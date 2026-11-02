/**
 * Rera Scanner Trust Score
 * ------------------------
 * A 0-100 score computed only from the public regulatory record of a project.
 * The formula is deliberately simple and fully published on /methodology.
 *
 * Five weighted components:
 *   possession   35  Did the promoter deliver when they said they would?
 *   complaints   25  Buyer complaints and appeals on the record
 *   promoter     15  The promoter's delivery history across all their projects
 *   compliance   15  Quarterly progress reports, extensions, lapses, encumbrances
 *   area         10  Carpet area registered vs. carpet area advertised
 *
 * Each component returns a 0-100 sub-score plus a `coverage` flag saying whether
 * the data needed for it was actually available. The total is the weighted mean
 * over the components that had data, and `confidence` is the share of total
 * weight that had data. Projects with confidence below 0.5 are shown as
 * "Unrated" instead of pretending to a precision we don't have.
 */

export type Band = "strong" | "watch" | "caution" | "unrated";

export interface ScoreInput {
  status: string;
  registrationDate?: string | null;
  originalCompletionDate?: string | null;
  revisedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  extensionCount: number;
  totalUnits?: number | null;
  complaintsTotal: number;
  complaintsOpen: number;
  appealsOpen: number;
  qprFiled: number;
  qprDue: number;
  encumbrance: boolean;
  litigation: boolean;
  carpetAreaRegisteredSqm?: number | null;
  carpetAreaAdvertisedSqm?: number | null;
  promoter: {
    projectCount: number;
    completedCount: number;
    delayedCount: number;
    onTimeCount: number;
    openComplaints: number;
  };
  /** Injected for deterministic tests; defaults to now. */
  today?: Date;
}

export interface ComponentResult {
  key: "possession" | "complaints" | "promoter" | "compliance" | "area";
  label: string;
  weight: number;
  score: number | null; // 0-100, null when no data
  covered: boolean;
  evidence: string[]; // human-readable facts that drove the sub-score
  flags: Array<{ level: "good" | "warn" | "bad"; text: string }>;
}

export interface ScoreResult {
  total: number | null;
  band: Band;
  confidence: number; // 0-1
  components: ComponentResult[];
  headline: string;
}

export const WEIGHTS = {
  possession: 35,
  complaints: 25,
  promoter: 15,
  compliance: 15,
  area: 10,
} as const;

export const BANDS: Array<{ band: Band; min: number; label: string; description: string }> = [
  {
    band: "strong",
    min: 75,
    label: "Strong",
    description: "Clean regulatory record: delivered or on track, few or no complaints, filings in order.",
  },
  {
    band: "watch",
    min: 50,
    label: "Watch",
    description: "Basics look fine but something is open: a delay, pending complaints or missing filings.",
  },
  {
    band: "caution",
    min: 0,
    label: "Caution",
    description: "Serious signals on the record: long delays, many complaints, lapsed registration or litigation.",
  },
];

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function monthsBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return ms / (1000 * 60 * 60 * 24 * 30.4375);
}

function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtMonths(m: number): string {
  const r = Math.round(m);
  if (r < 1) return "under a month";
  if (r === 1) return "1 month";
  if (r < 24) return `${r} months`;
  const y = Math.floor(r / 12);
  const rem = r % 12;
  return rem ? `${y} yr ${rem} mo` : `${y} years`;
}

/* ---------------------------------------------------------------- possession */
function possession(input: ScoreInput, today: Date): ComponentResult {
  const res: ComponentResult = {
    key: "possession",
    label: "Possession record",
    weight: WEIGHTS.possession,
    score: null,
    covered: false,
    evidence: [],
    flags: [],
  };
  const original = parseDate(input.originalCompletionDate);
  const revised = parseDate(input.revisedCompletionDate);
  const actual = parseDate(input.actualCompletionDate);
  const promised = original ?? revised;

  if (!promised) {
    res.evidence.push("The authority has not published a completion date for this project.");
    return res;
  }
  res.covered = true;

  if (actual) {
    const delay = monthsBetween(original ?? promised, actual);
    if (delay <= 0.5) {
      res.score = 100;
      res.evidence.push(`Completed on ${fmt(actual)}, on or before the promised date of ${fmt(promised)}.`);
      res.flags.push({ level: "good", text: "Delivered on time" });
    } else {
      // 100 at 0 months late, linear to 20 at 36 months late, floor 10
      res.score = clamp(Math.round(100 - (delay / 36) * 80), 10, 100);
      res.evidence.push(`Completed ${fmtMonths(delay)} after the originally promised date of ${fmt(promised)}.`);
      res.flags.push({ level: delay > 12 ? "bad" : "warn", text: `Delivered ${fmtMonths(delay)} late` });
    }
    return res;
  }

  if (input.status === "lapsed" || input.status === "revoked" || input.status === "expired") {
    res.score = 5;
    res.evidence.push(`Registration is ${input.status}; the project did not complete within its registered timeline.`);
    res.flags.push({ level: "bad", text: `Registration ${input.status}` });
    return res;
  }

  const deadline = revised ?? original!;
  const overdue = monthsBetween(deadline, today);
  if (overdue > 0) {
    // Past the (latest) deadline and still not complete.
    const fromOriginal = original ? monthsBetween(original, today) : overdue;
    res.score = clamp(Math.round(85 - (fromOriginal / 36) * 85), 0, 85);
    res.evidence.push(
      `Still not complete ${fmtMonths(fromOriginal)} after the original completion date of ${fmt(original ?? deadline)}.`,
    );
    if (revised && original && revised > original) {
      res.evidence.push(`Completion date was revised to ${fmt(revised)}${overdue > 0 ? ", which has also passed." : "."}`);
    }
    res.flags.push({ level: fromOriginal > 12 ? "bad" : "warn", text: `Overdue by ${fmtMonths(fromOriginal)}` });
    return res;
  }

  // Not yet due. Score reflects how much of the timeline has been consumed and whether dates moved.
  const slipped = original && revised && revised > original ? monthsBetween(original, revised) : 0;
  let s = 90;
  if (slipped > 0) {
    s -= Math.min(40, Math.round(slipped * 2));
    res.evidence.push(`Completion date pushed out by ${fmtMonths(slipped)} (now ${fmt(revised!)}).`);
    res.flags.push({ level: slipped > 12 ? "bad" : "warn", text: `Timeline extended ${fmtMonths(slipped)}` });
  } else {
    res.evidence.push(`Promised completion ${fmt(deadline)} is ${fmtMonths(-overdue)} away; no slippage so far.`);
    res.flags.push({ level: "good", text: "On its original timeline" });
  }
  if (input.extensionCount > 1) s -= 10;
  res.score = clamp(s);
  return res;
}

/* ---------------------------------------------------------------- complaints */
function complaintsComponent(input: ScoreInput): ComponentResult {
  const res: ComponentResult = {
    key: "complaints",
    label: "Complaints & litigation",
    weight: WEIGHTS.complaints,
    score: null,
    covered: true,
    evidence: [],
    flags: [],
  };
  const units = Math.max(input.totalUnits ?? 50, 10);
  // Complaints per 100 units keeps a 600-unit township comparable with a 30-unit building.
  const per100 = (input.complaintsTotal / units) * 100;
  const openPer100 = (input.complaintsOpen / units) * 100;
  let s = 100;
  s -= Math.min(45, per100 * 9); // 5 complaints per 100 units -> -45
  s -= Math.min(30, openPer100 * 10);
  s -= Math.min(15, input.appealsOpen * 5);
  if (input.litigation) s -= 15;
  res.score = clamp(Math.round(s));

  if (input.complaintsTotal === 0) {
    res.evidence.push("No buyer complaints recorded against this project with the authority.");
    res.flags.push({ level: "good", text: "No complaints on record" });
  } else {
    res.evidence.push(
      `${input.complaintsTotal} complaint${input.complaintsTotal > 1 ? "s" : ""} filed, ${input.complaintsOpen} still open (${per100.toFixed(1)} per 100 units).`,
    );
    res.flags.push({
      level: input.complaintsOpen > 0 ? (openPer100 > 2 ? "bad" : "warn") : "good",
      text: input.complaintsOpen > 0 ? `${input.complaintsOpen} open complaint${input.complaintsOpen > 1 ? "s" : ""}` : "All complaints disposed",
    });
  }
  if (input.appealsOpen > 0) {
    res.evidence.push(`${input.appealsOpen} appeal${input.appealsOpen > 1 ? "s" : ""} pending before the appellate tribunal.`);
    res.flags.push({ level: "warn", text: `${input.appealsOpen} tribunal appeal${input.appealsOpen > 1 ? "s" : ""}` });
  }
  if (input.litigation) {
    res.evidence.push("The promoter has disclosed pending litigation affecting the project land or approvals.");
    res.flags.push({ level: "bad", text: "Litigation disclosed" });
  }
  return res;
}

/* ------------------------------------------------------------------ promoter */
function promoterComponent(input: ScoreInput): ComponentResult {
  const res: ComponentResult = {
    key: "promoter",
    label: "Promoter track record",
    weight: WEIGHTS.promoter,
    score: null,
    covered: false,
    evidence: [],
    flags: [],
  };
  const p = input.promoter;
  const history = p.completedCount + p.delayedCount;
  if (p.projectCount <= 1 && history === 0) {
    res.evidence.push("This is the promoter's only registered project, so there is no delivery history to assess.");
    return res;
  }
  res.covered = true;
  let s = 70; // neutral prior for a promoter with projects but nothing finished yet
  if (history > 0) {
    const onTimeRate = p.onTimeCount / history;
    s = Math.round(40 + onTimeRate * 60);
    res.evidence.push(
      `${p.onTimeCount} of ${history} concluded project${history > 1 ? "s" : ""} delivered on time (${Math.round(onTimeRate * 100)}%).`,
    );
    res.flags.push({
      level: onTimeRate >= 0.75 ? "good" : onTimeRate >= 0.4 ? "warn" : "bad",
      text: `${Math.round(onTimeRate * 100)}% on-time delivery`,
    });
  } else {
    res.evidence.push(`${p.projectCount} registered projects, none concluded yet.`);
  }
  if (p.openComplaints > 0) {
    const penalty = Math.min(25, Math.round((p.openComplaints / Math.max(p.projectCount, 1)) * 10));
    s -= penalty;
    res.evidence.push(`${p.openComplaints} open complaints across the promoter's portfolio.`);
    res.flags.push({ level: penalty >= 15 ? "bad" : "warn", text: `${p.openComplaints} open complaints portfolio-wide` });
  }
  res.score = clamp(s);
  return res;
}

/* ---------------------------------------------------------------- compliance */
function complianceComponent(input: ScoreInput): ComponentResult {
  const res: ComponentResult = {
    key: "compliance",
    label: "Filings & compliance",
    weight: WEIGHTS.compliance,
    score: null,
    covered: true,
    evidence: [],
    flags: [],
  };
  let s = 100;
  if (input.qprDue > 0) {
    const rate = input.qprFiled / input.qprDue;
    s -= Math.round((1 - clamp(rate, 0, 1)) * 50);
    res.evidence.push(`${input.qprFiled} of ${input.qprDue} quarterly progress reports filed.`);
    res.flags.push({
      level: rate >= 0.9 ? "good" : rate >= 0.6 ? "warn" : "bad",
      text: rate >= 0.9 ? "Quarterly updates filed" : `${input.qprDue - input.qprFiled} quarterly update${input.qprDue - input.qprFiled > 1 ? "s" : ""} missing`,
    });
  } else {
    res.evidence.push("No quarterly progress reports were due yet.");
  }
  if (input.extensionCount > 0) {
    s -= Math.min(30, input.extensionCount * 12);
    res.evidence.push(`${input.extensionCount} extension${input.extensionCount > 1 ? "s" : ""} of the registration granted.`);
    res.flags.push({ level: input.extensionCount > 1 ? "bad" : "warn", text: `${input.extensionCount} extension${input.extensionCount > 1 ? "s" : ""}` });
  }
  if (input.encumbrance) {
    s -= 15;
    res.evidence.push("An encumbrance (mortgage or charge) is recorded on the project land.");
    res.flags.push({ level: "warn", text: "Encumbrance on land" });
  }
  if (["lapsed", "revoked", "expired"].includes(input.status)) {
    s -= 40;
    res.flags.push({ level: "bad", text: `Registration ${input.status}` });
  }
  res.score = clamp(s);
  return res;
}

/* ---------------------------------------------------------------------- area */
function areaComponent(input: ScoreInput): ComponentResult {
  const res: ComponentResult = {
    key: "area",
    label: "Carpet area consistency",
    weight: WEIGHTS.area,
    score: null,
    covered: false,
    evidence: [],
    flags: [],
  };
  const reg = input.carpetAreaRegisteredSqm;
  const adv = input.carpetAreaAdvertisedSqm;
  if (!reg || !adv) {
    res.evidence.push("No advertised carpet area was found to compare against the RERA filing.");
    return res;
  }
  res.covered = true;
  const diffPct = ((adv - reg) / reg) * 100;
  if (Math.abs(diffPct) <= 3) {
    res.score = 100;
    res.evidence.push(`Advertised carpet area (${adv.toFixed(1)} m²) matches the RERA filing (${reg.toFixed(1)} m²) within 3%.`);
    res.flags.push({ level: "good", text: "Advertised area matches filing" });
  } else if (diffPct > 0) {
    res.score = clamp(Math.round(100 - diffPct * 6));
    res.evidence.push(
      `Advertised carpet area (${adv.toFixed(1)} m²) is ${diffPct.toFixed(0)}% larger than the ${reg.toFixed(1)} m² registered with RERA.`,
    );
    res.flags.push({ level: diffPct > 10 ? "bad" : "warn", text: `Ads overstate area by ${diffPct.toFixed(0)}%` });
  } else {
    res.score = 95;
    res.evidence.push(`Advertised carpet area is ${Math.abs(diffPct).toFixed(0)}% smaller than registered, which is conservative.`);
    res.flags.push({ level: "good", text: "Ads understate area" });
  }
  return res;
}

/* ------------------------------------------------------------------- compose */
export function computeScore(input: ScoreInput): ScoreResult {
  const today = input.today ?? new Date();
  const components = [
    possession(input, today),
    complaintsComponent(input),
    promoterComponent(input),
    complianceComponent(input),
    areaComponent(input),
  ];
  const covered = components.filter((c) => c.covered && c.score !== null);
  const coveredWeight = covered.reduce((a, c) => a + c.weight, 0);
  const totalWeight = components.reduce((a, c) => a + c.weight, 0);
  const confidence = coveredWeight / totalWeight;

  if (coveredWeight === 0) {
    return { total: null, band: "unrated", confidence: 0, components, headline: "Not enough public data to rate this project yet." };
  }
  const total = Math.round(covered.reduce((a, c) => a + (c.score! * c.weight) / coveredWeight, 0));

  let band: Band;
  if (confidence < 0.5) band = "unrated";
  else band = bandFor(total);

  return { total, band, confidence, components, headline: headlineFor(band, components) };
}

export function bandFor(total: number): Band {
  for (const b of BANDS) if (total >= b.min) return b.band;
  return "caution";
}

export function bandMeta(band: Band) {
  return BANDS.find((b) => b.band === band) ?? { band: "unrated" as Band, min: 0, label: "Unrated", description: "Not enough data on the public record to score this project." };
}

function headlineFor(band: Band, components: ComponentResult[]): string {
  const bad = components.flatMap((c) => c.flags.filter((f) => f.level === "bad").map((f) => f.text));
  const warn = components.flatMap((c) => c.flags.filter((f) => f.level === "warn").map((f) => f.text));
  if (band === "unrated") return "Too early to rate: the project has not reached a checkable milestone yet.";
  if (band === "strong") return bad.length === 0 && warn.length === 0 ? "Clean record across every check we run." : `Strong overall; keep an eye on: ${[...bad, ...warn].slice(0, 2).join(", ").toLowerCase()}.`;
  if (band === "watch") return `Worth a closer look: ${[...bad, ...warn].slice(0, 3).join(", ").toLowerCase()}.`;
  return `Serious signals on the record: ${[...bad, ...warn].slice(0, 3).join(", ").toLowerCase()}.`;
}

function fmt(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
