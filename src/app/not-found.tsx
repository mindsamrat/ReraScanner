import Link from "next/link";
import { Container, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-20">
      <EmptyState title="Page not found" body="The project, builder or page you were looking for is not here. It may have been re-slugged after a register update." action={<Link href="/search" className="btn btn-primary">Search projects</Link>} />
    </Container>
  );
}
