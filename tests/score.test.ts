import { describe, expect, it } from "vitest";
import { computeScore, type ScoreInput, WEIGHTS, bandFor } from "../src/lib/scoring/score";

const today = new Date("2026-11-01");

const base: ScoreInput = {
  status: "registered",
  registrationDate: "2021-03-01",
  originalCompletionDate: "2024-12-31",
  revisedCompletionDate: null,
  actualCompletionDate: null,
  extensionCount: 0,
  totalUnits: 120,
  complaintsTotal: 0,
  complaintsOpen: 0,
  appealsOpen: 0,
  qprFiled: 12,
  qprDue: 12,
  encumbrance: false,
  litigation: false,
  carpetAreaRegisteredSqm: 60,
  carpetAreaAdvertisedSqm: 61,
  promoter: { projectCount: 4, completedCount: 3, delayedCount: 0, onTimeCount: 3, openComplaints: 0 },
  today,
};

describe("Trust Score", () => {
  it("weights sum to 100", () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("rates a delivered-on-time, complaint-free project as strong", () => {
    const r = computeScore({ ...base, status: "completed", actualCompletionDate: "2024-11-15" });
    expect(r.band).toBe("strong");
    expect(r.total).toBeGreaterThanOrEqual(90);
    expect(r.confidence).toBe(1);
  });

  it("penalises an overdue project that is still not complete", () => {
    const r = computeScore(base); // original date Dec 2024, today Nov 2026 -> ~22 months overdue
    const possession = r.components.find((c) => c.key === "possession")!;
    expect(possession.score).toBeLessThan(45);
    expect(possession.flags.some((f) => f.text.startsWith("Overdue"))).toBe(true);
  });

  it("drops to caution with many open complaints, missing filings and a lapsed registration", () => {
    const r = computeScore({
      ...base,
      status: "lapsed",
      complaintsTotal: 18,
      complaintsOpen: 14,
      appealsOpen: 2,
      qprFiled: 3,
      qprDue: 12,
      extensionCount: 2,
      litigation: true,
    });
    expect(r.band).toBe("caution");
    expect(r.total).toBeLessThan(35);
  });

  it("marks a brand new project with no dates and a single-project promoter as unrated", () => {
    const r = computeScore({
      ...base,
      originalCompletionDate: null,
      revisedCompletionDate: null,
      carpetAreaAdvertisedSqm: null,
      promoter: { projectCount: 1, completedCount: 0, delayedCount: 0, onTimeCount: 0, openComplaints: 0 },
    });
    // Only complaints (25) + compliance (15) covered = 0.4 confidence
    expect(r.confidence).toBeCloseTo(0.4);
    expect(r.band).toBe("unrated");
  });

  it("flags advertised carpet area that overstates the RERA filing", () => {
    const r = computeScore({ ...base, carpetAreaRegisteredSqm: 60, carpetAreaAdvertisedSqm: 72 });
    const area = r.components.find((c) => c.key === "area")!;
    expect(area.score).toBeLessThan(100);
    expect(area.flags[0].level).toBe("bad");
  });

  it("maps totals to bands at the published thresholds", () => {
    expect(bandFor(75)).toBe("strong");
    expect(bandFor(74)).toBe("watch");
    expect(bandFor(50)).toBe("watch");
    expect(bandFor(49)).toBe("caution");
  });

  it("normalises the total over covered weight only", () => {
    const r = computeScore({ ...base, carpetAreaAdvertisedSqm: null });
    const covered = r.components.filter((c) => c.covered);
    const w = covered.reduce((a, c) => a + c.weight, 0);
    const expected = Math.round(covered.reduce((a, c) => a + (c.score! * c.weight) / w, 0));
    expect(r.total).toBe(expected);
  });
});
