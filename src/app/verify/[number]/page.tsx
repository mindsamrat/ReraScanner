import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Container, Breadcrumbs, EmptyState } from "@/components/ui";
import { getProjectByReraNumber } from "@/db/queries";
import { detectStateFromRegNumber, STATES } from "@/lib/states";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Verify a RERA number", robots: { index: false } };

/** /verify/<RERA number> — deep link that resolves straight to the project. */
export default async function VerifyPage({ params }: { params: Promise<{ number: string }> }) {
  const raw = decodeURIComponent((await params).number);
  const p = await getProjectByReraNumber(raw);
  if (p) redirect(`/projects/${p.slug}`);
  const s = detectStateFromRegNumber(raw);
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Verify" }]} />
      <div className="mt-6">
        <EmptyState
          title={`“${raw}” is not in our index`}
          body={s ? `The format matches ${s.authority}. We may not have read this registration yet, or the number may be mistyped. Check it on the official portal.` : "The number does not match a format we recognise. Check it against the state portal list."}
          action={
            s ? (
              <a href={s.projectSearchUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Search on {s.authority} <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <Link href="/state" className="btn btn-primary">
                All {STATES.length} official portals
              </Link>
            )
          }
        />
      </div>
    </Container>
  );
}
