export const SITE = {
  name: "Rera Scanner",
  tagline: "Check any RERA project before you pay a rupee.",
  description:
    "Search every RERA-registered real estate project in India by name, promoter or registration number. See possession delays, complaints, filings and a transparent 0-100 Trust Score built only from the official record.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  dataMode: (process.env.NEXT_PUBLIC_DATA_MODE ?? "sample") as "sample" | "live",
  contactEmail: "hello@rerascanner.in",
  twitter: "@rerascanner",
};

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
