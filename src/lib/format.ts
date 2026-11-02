export function formatDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", opts);
}

export function formatMonthYear(iso?: string | null): string {
  return formatDate(iso, { month: "short", year: "numeric" });
}

export function formatNumber(n?: number | null): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-IN").format(n);
}

export function formatArea(sqm?: number | null): string {
  if (!sqm) return "—";
  const sqft = sqm * 10.7639;
  return `${formatNumber(Math.round(sqm))} m² (${formatNumber(Math.round(sqft))} sq ft)`;
}

export function formatPct(n?: number | null, digits = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} hours ago`;
  const days = Math.round(hrs / 24);
  if (days < 60) return `${days} days ago`;
  return formatDate(iso);
}

export function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

export const STATUS_LABEL: Record<string, string> = {
  registered: "Registered",
  completed: "Completed",
  lapsed: "Lapsed",
  revoked: "Revoked",
  expired: "Expired",
  withdrawn: "Withdrawn",
};

export const TYPE_LABEL: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  mixed: "Mixed use",
  plotted: "Plotted development",
};
