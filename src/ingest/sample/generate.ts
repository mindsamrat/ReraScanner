/**
 * Deterministic sample dataset.
 *
 * Why this exists: the state RERA portals cannot be reached from every build
 * environment, and a fresh checkout should still produce a fully working site.
 * The generator produces realistic-looking but entirely fictional projects and
 * promoters (no real company names) with the same shape the live adapters emit,
 * so every page, filter and score path is exercised.
 *
 * The UI shows a "sample data" banner whenever NEXT_PUBLIC_DATA_MODE=sample.
 */
import { DISTRICTS } from "./geo";
import { STATE_BY_SLUG } from "@/lib/states";
import type { NormalizedComplaint, NormalizedProject, NormalizedUnitMix, ProjectStatus, ProjectType } from "../types";

// --- tiny seeded PRNG (mulberry32) ------------------------------------------
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
    gauss: (mean: number, sd: number) => {
      const u = 1 - next();
      const v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    weighted: <T extends { weight: number }>(arr: readonly T[]): T => {
      const total = arr.reduce((s, x) => s + x.weight, 0);
      let r = next() * total;
      for (const x of arr) {
        r -= x.weight;
        if (r <= 0) return x;
      }
      return arr[arr.length - 1];
    },
  };
}

const PROMOTER_WORDS = [
  "Aarambh", "Nivaan", "Suryansh", "Vrindavan", "Satyam", "Ashirwad", "Mangalam", "Trishul", "Avani", "Rudra", "Siddhi", "Shubham", "Panchratna",
  "Navkar", "Sankalp", "Pranav", "Vedant", "Keshav", "Tirupati", "Samarth", "Shivalik", "Gokul", "Dwarka", "Anant", "Pushpak", "Ekta", "Kalash",
  "Sarvam", "Nirmaan", "Tridev", "Vighnesh", "Aastha", "Prakruti", "Utsav", "Chaitanya", "Srushti", "Vasudha", "Mahalaxmi", "Omkar", "Saptagiri",
  "Jeevan", "Akshar", "Nandan", "Parijat", "Swastik", "Yash", "Ratnadeep", "Gurukrupa", "Bhoomi", "Dhara", "Sumeru", "Kanak", "Vaibhav", "Shivam",
];
const PROMOTER_SUFFIX = ["Developers", "Realty", "Infra", "Buildcon", "Constructions", "Housing", "Estates", "Lifespaces", "Group", "Properties", "Builders", "Landmarks", "Infraprojects", "Homes", "Spaces"];
const PROMOTER_TYPE = [
  { v: "Pvt Ltd", t: "company", w: 5 },
  { v: "LLP", t: "llp", w: 3 },
  { v: "", t: "partnership", w: 2 },
];
const PROJECT_THEMES = ["Heights", "Greens", "Residency", "Enclave", "Towers", "Gardens", "Meadows", "Vista", "Square", "Plaza", "Arcade", "Horizon", "Skyline", "County", "Avenue", "Park", "Orchid", "Serenity", "Elegance", "One", "Nest", "Bliss", "Harmony", "Palms", "Woods", "Riverside", "Lakefront", "Hills", "Crest", "Vihar", "Nagar", "Pride", "Grandeur", "Aura", "Imperia", "Sapphire", "Emerald", "Panorama", "Terraces", "Courtyard"];
const PROJECT_SUFFIX = ["", "", "", " Phase 1", " Phase 2", " Phase 3", " Wing A", " Wing B", " Tower 1", " Tower 2", " Block C", " II", " Annexe"];
const FIRST = ["Aditya", "Priya", "Rahul", "Sneha", "Vikram", "Anjali", "Rohan", "Kavita", "Sanjay", "Meera", "Arjun", "Pooja", "Nikhil", "Deepa", "Manish", "Rekha", "Suresh", "Neha", "Amit", "Divya", "Ganesh", "Lakshmi", "Harish", "Swati", "Imran", "Farah", "Joseph", "Anita"];
const LAST = ["Sharma", "Patel", "Desai", "Reddy", "Nair", "Iyer", "Kulkarni", "Joshi", "Mehta", "Shah", "Rao", "Gupta", "Singh", "Verma", "Chatterjee", "Banerjee", "Menon", "Pillai", "Naidu", "Khan", "Fernandes", "Bhatt", "Trivedi", "Jain"];
const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Bank of Baroda", "Kotak Mahindra Bank", "Punjab National Bank", "Union Bank of India", "Canara Bank", "IDBI Bank"];
const COMPLAINT_SUMMARIES: Record<string, string[]> = {
  delay: [
    "Possession not handed over by the date in the agreement for sale; complainant seeks interest for every month of delay.",
    "Project running behind the registered completion date; buyer seeks delay compensation under Section 18.",
    "Allottee alleges construction stalled for over a year and seeks refund with interest.",
  ],
  refund: [
    "Complainant withdrew from the project and seeks refund of the amount paid along with interest.",
    "Booking cancelled by allottee owing to delay; refund of advance pending.",
  ],
  quality: [
    "Complainant reports seepage and structural defects within the defect-liability period.",
    "Common amenities promised in the brochure have not been provided at handover.",
  ],
  area: [
    "Carpet area delivered is smaller than the area stated in the agreement; proportional refund sought.",
    "Complainant alleges the advertised carpet area differs from the area registered with the authority.",
  ],
  other: [
    "Promoter collected more than 10% of cost without executing a registered agreement for sale.",
    "Conveyance of the society not executed within the statutory period.",
    "Charges levied for parking and club membership not disclosed at booking.",
  ],
};
const ORDER_SUMMARIES = [
  "Promoter directed to pay interest at MCLR + 2% from the agreed date of possession till actual possession.",
  "Complaint disposed; parties recorded a settlement and the promoter undertook to hand over possession within 90 days.",
  "Promoter directed to refund the amount with interest within 45 days.",
  "Complaint dismissed as the allottee had defaulted on instalments.",
  "Promoter directed to execute the conveyance deed within three months.",
];

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addMonths(d: Date, m: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + Math.round(m));
  return r;
}

/** Registration number in the format each authority actually uses. */
function regNumber(state: string, r: ReturnType<typeof rng>, i: number, district: string, year: number): string {
  const pad = (n: number, w: number) => String(n).padStart(w, "0");
  switch (state) {
    case "maharashtra":
      return `P5${pad(r.int(10, 29), 2)}${pad(r.int(0, 99), 2)}${pad(20000 + i * 7 + r.int(0, 6), 6)}`;
    case "gujarat": {
      const d = district.toUpperCase();
      return `PR/GJ/${d}/${d} CITY/${d.slice(0, 2)}UDA/${d.slice(0, 2)}A${pad(i + 1, 5)}/${pad(r.int(1, 28), 2)}${pad(r.int(1, 12), 2)}${String(year).slice(2)}`;
    }
    case "karnataka":
      return `PRM/KA/RERA/${pad(1250 + r.int(0, 2), 4)}/${pad(300 + r.int(0, 199), 3)}/PR/${String(year).slice(2)}${pad(r.int(1, 12), 2)}${pad(r.int(1, 28), 2)}/${pad(i + 1, 6)}`;
    case "uttarpradesh":
      return `UPRERAPRJ${pad(100000 + i * 13 + r.int(0, 12), 6)}`;
    case "westbengal":
      return `WBRERA/P/${r.pick(["NOR", "SOU", "KOL", "HOW", "HOO"])}/${year}/${pad(i + 1, 6)}`;
    case "kerala":
      return `K-RERA/PRJ/${pad(i + 1, 3)}/${year}`;
    case "tamilnadu":
      return `TN/${pad(r.int(1, 35), 2)}/${r.pick(["Building", "Layout"])}/${pad(i + 1, 4)}/${year}`;
    case "telangana":
      return `P0${pad(r.int(2, 3), 1)}${pad(r.int(100000000, 999999999), 9)}`;
    case "haryana":
      return `RC/REP/HARERA/${district.startsWith("Panch") ? "PKL" : "GGM"}/${pad(i + 1, 3)}/${pad(r.int(100, 999), 3)}/${year}/${pad(r.int(1, 99), 2)}`;
    case "delhi":
      return `DLRERA${year}P${pad(i + 1, 4)}`;
    default:
      return `${state.toUpperCase().slice(0, 2)}-RERA-${year}-${pad(i + 1, 5)}`;
  }
}

interface PromoterProfile {
  name: string;
  type: string;
  typeSlug: string;
  quality: number; // 0 (poor) .. 1 (excellent): drives delays and complaints across all their projects
  address: string;
  website: string | null;
  cin: string | null;
}

function makePromoters(state: string, r: ReturnType<typeof rng>, count: number): PromoterProfile[] {
  const used = new Set<string>();
  const out: PromoterProfile[] = [];
  const stateName = STATE_BY_SLUG[state]?.name ?? state;
  while (out.length < count) {
    const w1 = r.pick(PROMOTER_WORDS);
    const w2 = r.chance(0.35) ? ` ${r.pick(PROMOTER_WORDS)}` : "";
    const suffix = r.pick(PROMOTER_SUFFIX);
    const t = r.weighted(PROMOTER_TYPE.map((x) => ({ ...x, weight: x.w })));
    const name = `${w1}${w2} ${suffix}${t.v ? ` ${t.v}` : ""}`;
    if (used.has(name)) continue;
    used.add(name);
    const districts = DISTRICTS[state];
    const d = r.weighted(districts);
    out.push({
      name,
      type: t.v || "Partnership firm",
      typeSlug: t.t,
      quality: Math.min(1, Math.max(0, r.gauss(0.62, 0.22))),
      address: `${r.int(1, 900)}, ${r.pick(d.localities)}, ${d.name}, ${stateName}`,
      website: r.chance(0.45) ? `https://www.${w1.toLowerCase()}${suffix.toLowerCase()}.example` : null,
      cin: t.t === "company" ? `U${r.int(45200, 70200)}${STATE_BY_SLUG[state]?.code ?? "XX"}${r.int(2005, 2021)}PTC${r.int(100000, 999999)}` : null,
    });
  }
  return out;
}

const UNIT_TYPES: Record<ProjectType, Array<{ type: string; carpet: [number, number]; w: number }>> = {
  residential: [
    { type: "1 BHK", carpet: [32, 45], w: 3 },
    { type: "2 BHK", carpet: [55, 75], w: 5 },
    { type: "3 BHK", carpet: [85, 125], w: 3 },
    { type: "4 BHK", carpet: [140, 210], w: 1 },
  ],
  commercial: [
    { type: "Shop", carpet: [18, 60], w: 4 },
    { type: "Office", carpet: [40, 180], w: 4 },
    { type: "Showroom", carpet: [120, 400], w: 1 },
  ],
  mixed: [
    { type: "2 BHK", carpet: [55, 75], w: 4 },
    { type: "3 BHK", carpet: [85, 125], w: 2 },
    { type: "Shop", carpet: [18, 60], w: 2 },
    { type: "Office", carpet: [40, 180], w: 1 },
  ],
  plotted: [
    { type: "Plot", carpet: [120, 450], w: 1 },
  ],
};

export interface GenerateOptions {
  seed?: number;
  /** Projects per state. Defaults are tuned to feel like a real register at small scale. */
  counts?: Partial<Record<string, number>>;
  fetchedAt?: string;
}

const DEFAULT_COUNTS: Record<string, number> = {
  maharashtra: 160,
  gujarat: 110,
  karnataka: 95,
  uttarpradesh: 90,
  westbengal: 60,
  kerala: 55,
  tamilnadu: 70,
  telangana: 75,
  haryana: 65,
  delhi: 20,
};

export function generateSample(opts: GenerateOptions = {}): NormalizedProject[] {
  const seed = opts.seed ?? 20260101;
  const fetchedAt = opts.fetchedAt ?? new Date().toISOString();
  const today = new Date("2026-11-01");
  const out: NormalizedProject[] = [];

  for (const [state, defaultCount] of Object.entries(DEFAULT_COUNTS)) {
    const count = opts.counts?.[state] ?? defaultCount;
    const r = rng(seed + state.length * 7919 + state.charCodeAt(0) * 31);
    const info = STATE_BY_SLUG[state];
    const promoters = makePromoters(state, r, Math.max(6, Math.round(count / 3.2)));
    const districts = DISTRICTS[state];
    const usedNames = new Set<string>();

    for (let i = 0; i < count; i++) {
      // Promoters with more projects are picked more often (long tail is realistic).
      const promoter = promoters[Math.min(promoters.length - 1, Math.floor(Math.pow(r.next(), 1.6) * promoters.length))];
      const d = r.weighted(districts);
      const locality = r.pick(d.localities);
      const type: ProjectType = r.weighted([
        { v: "residential" as const, weight: 68 },
        { v: "commercial" as const, weight: 12 },
        { v: "mixed" as const, weight: 12 },
        { v: "plotted" as const, weight: 8 },
      ]).v;

      let name = `${promoter.name.split(" ")[0]} ${r.pick(PROJECT_THEMES)}${r.pick(PROJECT_SUFFIX)}`;
      while (usedNames.has(name)) name = `${promoter.name.split(" ")[0]} ${r.pick(PROJECT_THEMES)}${r.pick(PROJECT_SUFFIX)}`;
      usedNames.add(name);

      // Timeline
      const regYear = r.int(2017, 2026);
      const registration = new Date(regYear, r.int(0, regYear === 2026 ? 8 : 11), r.int(1, 28));
      const plannedMonths = type === "plotted" ? r.int(12, 30) : r.int(30, 66);
      const original = addMonths(registration, plannedMonths);
      const reraNumber = regNumber(state, r, i, d.name, regYear);

      // Promoter quality drives slippage probability. 0 = poor, 1 = excellent.
      const slipChance = 0.75 - promoter.quality * 0.6;
      const slipMonths = r.chance(slipChance) ? Math.max(2, Math.round(r.gauss(14 - promoter.quality * 8, 9))) : 0;
      let revised: Date | null = null;
      const extensionsList: NormalizedProject["extensions"] = [];
      let extensionCount = 0;
      if (slipMonths > 0) {
        revised = addMonths(original, slipMonths);
        extensionCount = slipMonths > 15 && r.chance(0.5) ? 2 : 1;
        let prev = original;
        for (let e = 0; e < extensionCount; e++) {
          const nd = e === extensionCount - 1 ? revised : addMonths(prev, Math.round(slipMonths / 2));
          extensionsList.push({
            kind: e === 0 && r.chance(0.3) ? "force-majeure" : "extension",
            previousDate: iso(prev),
            newDate: iso(nd),
            grantedOn: iso(addMonths(prev, -1)),
            reason: r.pick(["Delay in receipt of occupancy certificate", "Covid-19 moratorium", "Delay in environmental clearance", "Change in development plan", "Shortage of labour and material", "Litigation over access road"]),
          });
          prev = nd;
        }
      }
      const effectiveDeadline = revised ?? original;

      let status: ProjectStatus = "registered";
      let actual: Date | null = null;
      if (effectiveDeadline < today) {
        // Deadline passed: did it complete?
        const completeChance = 0.35 + promoter.quality * 0.5;
        if (r.chance(completeChance)) {
          status = "completed";
          const lateBy = slipMonths > 0 ? r.int(-2, Math.max(1, Math.round(slipMonths * 0.6))) : r.int(-4, 3);
          actual = addMonths(original, Math.max(0, lateBy));
          if (actual > today) actual = addMonths(today, -1);
        } else if (r.chance(0.3 - promoter.quality * 0.2)) {
          status = r.chance(0.8) ? "lapsed" : "revoked";
        }
      } else if (original < today && r.chance(0.12 + (1 - promoter.quality) * 0.2)) {
        // Original passed, revised in future: still registered (handled by default)
      }

      // Inventory
      const totalUnits = type === "plotted" ? r.int(40, 260) : type === "commercial" ? r.int(20, 180) : r.int(24, 520);
      const buildings = type === "plotted" ? 0 : Math.max(1, Math.round(totalUnits / r.int(40, 120)));
      const mixDef = UNIT_TYPES[type];
      const unitMixList: NormalizedUnitMix[] = [];
      let remaining = totalUnits;
      const picked = mixDef.filter(() => r.chance(0.8));
      const defs = picked.length ? picked : [mixDef[0]];
      const totalW = defs.reduce((s, x) => s + x.w, 0);
      const bookedShare = status === "completed" ? r.gauss(0.9, 0.08) : Math.min(0.98, Math.max(0.05, (monthsBetween(registration, today) / plannedMonths) * r.gauss(0.75, 0.15)));
      const adOverstate = r.chance(0.28 - promoter.quality * 0.2) ? r.gauss(0.11, 0.05) : r.gauss(0.005, 0.015);
      // Roughly a quarter of projects have no brochure/listing data to compare against.
      const hasAdData = r.chance(0.74);
      defs.forEach((def, idx) => {
        const cnt = idx === defs.length - 1 ? remaining : Math.round((totalUnits * def.w) / totalW);
        remaining -= cnt;
        const carpet = r.int(def.carpet[0], def.carpet[1]);
        unitMixList.push({
          unitType: def.type,
          count: Math.max(0, cnt),
          booked: Math.round(Math.max(0, cnt) * Math.min(1, Math.max(0, bookedShare + r.gauss(0, 0.05)))),
          carpetAreaSqm: carpet,
          advertisedCarpetAreaSqm: hasAdData && r.chance(0.8) ? Math.round(carpet * (1 + adOverstate) * 10) / 10 : null,
        });
      });
      const withAds = unitMixList.filter((u) => u.advertisedCarpetAreaSqm);
      const avgReg = unitMixList.reduce((s, u) => s + (u.carpetAreaSqm ?? 0) * u.count, 0) / Math.max(1, totalUnits);
      const avgAdv = withAds.length ? withAds.reduce((s, u) => s + (u.advertisedCarpetAreaSqm ?? 0) * u.count, 0) / Math.max(1, withAds.reduce((s, u) => s + u.count, 0)) : null;
      const avgRegForAds = withAds.length ? withAds.reduce((s, u) => s + (u.carpetAreaSqm ?? 0) * u.count, 0) / Math.max(1, withAds.reduce((s, u) => s + u.count, 0)) : avgReg;

      // Complaints
      const monthsLate = status === "completed" && actual ? Math.max(0, monthsBetween(original, actual)) : original < today ? monthsBetween(original, today) : 0;
      // Most projects never see a complaint; delayed ones from weak promoters see many.
      const lambda = (0.1 + monthsLate * 0.22 + (1 - promoter.quality) * 1.4) * (totalUnits / 150);
      const nComplaints = r.chance(0.42 - Math.min(0.35, monthsLate * 0.03)) ? 0 : Math.max(0, Math.round(r.gauss(lambda, Math.sqrt(lambda + 0.5))));
      const complaintsList: NormalizedComplaint[] = [];
      for (let c = 0; c < nComplaints; c++) {
        const category = r.weighted([
          { v: "delay" as const, weight: monthsLate > 0 ? 6 : 2 },
          { v: "refund" as const, weight: 2 },
          { v: "quality" as const, weight: 1.5 },
          { v: "area" as const, weight: adOverstate > 0.05 ? 2 : 0.5 },
          { v: "other" as const, weight: 1.5 },
        ]).v;
        const filed = addMonths(original, r.int(-6, Math.max(1, Math.round(monthsLate) + 3)));
        const filedClamped = filed > today ? addMonths(today, -r.int(1, 6)) : filed;
        const st = r.weighted([
          { v: "disposed" as const, weight: status === "completed" ? 6 : 3 },
          { v: "open" as const, weight: 3 },
          { v: "appeal" as const, weight: 0.6 },
        ]).v;
        complaintsList.push({
          caseNumber: `CC${pad(r.int(1, 9), 1)}${pad(r.int(0, 99999), 5)}/${filedClamped.getFullYear()}`,
          filedOn: iso(filedClamped),
          status: st,
          category,
          summary: r.pick(COMPLAINT_SUMMARIES[category]),
          orderDate: st === "disposed" ? iso(addMonths(filedClamped, r.int(4, 18))) : null,
          orderSummary: st === "disposed" ? r.pick(ORDER_SUMMARIES) : null,
          sourceUrl: info.portalUrl,
        });
      }

      // Compliance
      const quartersElapsed = Math.max(0, Math.floor(monthsBetween(registration, status === "completed" && actual ? actual : today) / 3));
      const qprDue = quartersElapsed;
      const qprFiled = Math.min(qprDue, Math.max(0, Math.round(qprDue * Math.min(1, Math.max(0.2, r.gauss(0.55 + promoter.quality * 0.45, 0.12))))));

      const professionalsList: NormalizedProject["professionals"] = [
        { role: "architect", name: `${r.pick(FIRST)} ${r.pick(LAST)}`, registrationNumber: `CA/${r.int(2001, 2020)}/${r.int(10000, 99999)}` },
        { role: "engineer", name: `${r.pick(FIRST)} ${r.pick(LAST)}`, registrationNumber: null },
        { role: "chartered-accountant", name: `${r.pick(LAST)} & Associates`, registrationNumber: `FRN ${r.int(100000, 199999)}W` },
      ];

      // WBRERA publishes no handover date for most projects; mirror that so the reduced-confidence path is real.
      const hideDates = state === "westbengal" && r.chance(0.6);

      const project: NormalizedProject = {
        reraNumber,
        stateSlug: state,
        name,
        type,
        status,
        district: d.name,
        taluka: null,
        locality,
        pincode: String(r.int(110001, 695615)),
        lat: Math.round((d.lat + r.gauss(0, 0.06)) * 10000) / 10000,
        lng: Math.round((d.lng + r.gauss(0, 0.06)) * 10000) / 10000,
        promoter: { name: promoter.name, type: promoter.typeSlug, address: promoter.address, website: promoter.website, cin: promoter.cin },
        registrationDate: iso(registration),
        originalCompletionDate: hideDates ? null : iso(original),
        revisedCompletionDate: hideDates || !revised ? null : iso(revised),
        actualCompletionDate: hideDates || !actual ? null : iso(actual),
        extensionCount,
        landAreaSqm: Math.round(totalUnits * (type === "plotted" ? 260 : 38) * r.gauss(1, 0.15)),
        totalBuildings: buildings,
        totalUnits,
        unitsBooked: unitMixList.reduce((s, u) => s + (u.booked ?? 0), 0),
        carpetAreaRegisteredSqm: Math.round(avgRegForAds * 10) / 10,
        carpetAreaAdvertisedSqm: avgAdv ? Math.round(avgAdv * 10) / 10 : null,
        complaints: complaintsList,
        qprFiled,
        qprDue,
        lastQprDate: qprFiled > 0 ? iso(addMonths(registration, qprFiled * 3)) : null,
        escrowBank: r.pick(BANKS),
        encumbrance: r.chance(0.22),
        litigation: r.chance(0.08 + (1 - promoter.quality) * 0.1),
        description: `${TYPE_SENTENCE[type]} at ${locality}, ${d.name}, registered with ${info.authority} in ${registration.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}.`,
        extensions: extensionsList,
        unitMix: unitMixList,
        documents: [
          { name: "Registration certificate", kind: "certificate", url: info.projectSearchUrl, publishedOn: iso(registration) },
          { name: "Approved layout plan", kind: "layout", url: info.projectSearchUrl, publishedOn: iso(registration) },
          { name: "Title report", kind: "title", url: info.projectSearchUrl, publishedOn: iso(registration) },
          ...(qprFiled > 0 ? [{ name: `Quarterly progress report Q${((qprFiled - 1) % 4) + 1}`, kind: "qpr" as const, url: info.projectSearchUrl, publishedOn: iso(addMonths(registration, qprFiled * 3)) }] : []),
        ],
        professionals: professionalsList,
        sourceUrl: info.projectSearchUrl,
        sourceFetchedAt: fetchedAt,
      };
      out.push(project);
    }
  }
  return out;
}

const TYPE_SENTENCE: Record<ProjectType, string> = {
  residential: "Residential apartment project",
  commercial: "Commercial shops-and-offices project",
  mixed: "Mixed-use development with residential units and retail",
  plotted: "Plotted development with serviced plots",
};

function pad(n: number, w: number) {
  return String(n).padStart(w, "0");
}
function monthsBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
}
