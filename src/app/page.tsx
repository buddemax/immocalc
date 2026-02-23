import Link from "next/link";
import { PropertyList } from "@/components/property/PropertyList";

export default function HomePage() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Immobilien-Dashboard</h1>
          <p>Hier siehst du dein Portfolio, offene Schritte und alle Immobilien auf einen Blick.</p>
        </div>
        <Link href="/property/new" className="button-primary">
          Neue Immobilie
        </Link>
      </section>
      <PropertyList />
    </div>
  );
}
