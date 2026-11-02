import Link from "next/link";
import { SITE } from "@/lib/site";

export function SampleBanner() {
  if (SITE.dataMode !== "sample") return null;
  return (
    <div className="bg-watch-soft text-watch">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 text-xs font-medium sm:px-6">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-watch" />
        <span>
          Demo mode: this instance shows a generated sample register with fictional projects and builders. Run the portal ingestion to load live data.{" "}
          <Link href="/data-sources" className="underline underline-offset-2">
            How ingestion works →
          </Link>
        </span>
      </div>
    </div>
  );
}
