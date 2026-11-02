import { describe, expect, it } from "vitest";
import { parseDate, parseAreaSqm, normalizeStatus, normalizeType, labelValueMap, pick, aspNetState } from "../src/ingest/parse";
import { detectStateFromRegNumber } from "../src/lib/states";
import { contentHash, projectSlug } from "../src/ingest/pipeline";
import { generateSample } from "../src/ingest/sample/generate";

describe("portal parsing helpers", () => {
  it("parses Indian date formats", () => {
    expect(parseDate("31/03/2025")).toBe("2025-03-31");
    expect(parseDate("05-12-2023")).toBe("2023-12-05");
    expect(parseDate("2024-07-01")).toBe("2024-07-01");
    expect(parseDate("NA")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
  it("converts areas to square metres", () => {
    expect(parseAreaSqm("1,076.39 sq ft")).toBeCloseTo(100, 0);
    expect(parseAreaSqm("2 acres")).toBe(8094);
    expect(parseAreaSqm("450.5")).toBe(450.5);
  });
  it("normalises status and type vocabularies", () => {
    expect(normalizeStatus("Registration Lapsed")).toBe("lapsed");
    expect(normalizeStatus("Completed - OC Received")).toBe("completed");
    expect(normalizeStatus("New Project")).toBe("registered");
    expect(normalizeType("Plotted Development/Layout")).toBe("plotted");
    expect(normalizeType("Residential/Group Housing")).toBe("residential");
  });
  it("reads label/value tables", () => {
    const html = `<table><tr><th>Project Name :</th><td>Sky Towers</td></tr><tr><td>District</td><td>Pune</td></tr></table>`;
    const kv = labelValueMap(html);
    expect(pick(kv, "project name")).toBe("Sky Towers");
    expect(pick(kv, "district")).toBe("Pune");
  });
  it("extracts ASP.NET state fields", () => {
    const st = aspNetState(`<input name="__VIEWSTATE" value="abc"/><input name="__EVENTVALIDATION" value="def"/>`);
    expect(st).toEqual({ __VIEWSTATE: "abc", __EVENTVALIDATION: "def" });
  });
});

describe("registration number detection", () => {
  it("maps formats to states", () => {
    expect(detectStateFromRegNumber("P51700053842")?.slug).toBe("maharashtra");
    expect(detectStateFromRegNumber("PR/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/RAA00001/010117")?.slug).toBe("gujarat");
    expect(detectStateFromRegNumber("PRM/KA/RERA/1251/446/PR/171014/000001")?.slug).toBe("karnataka");
    expect(detectStateFromRegNumber("UPRERAPRJ446747")?.slug).toBe("uttarpradesh");
    expect(detectStateFromRegNumber("WBRERA/P/NOR/2023/000123")?.slug).toBe("westbengal");
    expect(detectStateFromRegNumber("hello")).toBeUndefined();
  });
});

describe("sample generator & pipeline helpers", () => {
  it("is deterministic and every project detects as its own state", () => {
    const a = generateSample({ counts: { maharashtra: 5, gujarat: 5 }, fetchedAt: "2026-01-01T00:00:00Z" });
    const b = generateSample({ counts: { maharashtra: 5, gujarat: 5 }, fetchedAt: "2026-01-01T00:00:00Z" });
    expect(a.map((p) => p.reraNumber)).toEqual(b.map((p) => p.reraNumber));
    for (const p of a) expect(detectStateFromRegNumber(p.reraNumber)?.slug).toBe(p.stateSlug);
  });
  it("content hash ignores fetch time; slug is URL-safe", () => {
    const [p] = generateSample({ counts: { kerala: 1 }, fetchedAt: "2026-01-01T00:00:00Z" }).filter((x) => x.stateSlug === "kerala");
    expect(contentHash(p)).toBe(contentHash({ ...p, sourceFetchedAt: "2027-01-01T00:00:00Z" }));
    expect(projectSlug(p)).toMatch(/^[a-z0-9-]+$/);
  });
});
