import type { Metadata } from "next";
import { Container, Breadcrumbs } from "@/components/ui";
import { WatchlistClient } from "./WatchlistClient";

export const metadata: Metadata = {
  title: "Your watchlist",
  description: "Projects you are tracking on Rera Scanner. Stored in your browser only.",
  robots: { index: false },
};

export default function WatchlistPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Watchlist" }]} />
      <h1 className="mt-4 font-display text-3xl font-800">Your watchlist</h1>
      <p className="mt-2 max-w-2xl text-fg-muted">Projects you have chosen to follow. The list lives in this browser only; nothing is sent to us.</p>
      <div className="mt-8">
        <WatchlistClient />
      </div>
    </Container>
  );
}
