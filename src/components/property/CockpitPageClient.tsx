"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CockpitView } from "@/components/property/CockpitView";
import { PropertySubnav } from "@/components/property/PropertySubnav";
import { pickPropertyInput } from "@/lib/domain/property";

export function CockpitPageClient({ propertyId }: { propertyId: string }) {
  const property = useQuery(api.properties.byId as never, { id: propertyId as never }) as Record<string, unknown> | null | undefined;

  if (property === undefined) {
    return <div className="card">Lade Objekt...</div>;
  }

  if (!property) {
    return <div className="card">Objekt nicht gefunden.</div>;
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Objekt-Cockpit</h1>
          <p>Bearbeite alle Kernwerte an einer Stelle und prüfe direkt die Auswirkungen auf Kennzahlen und Projektion.</p>
        </div>
      </section>
      <PropertySubnav propertyId={propertyId} />
      <CockpitView propertyId={propertyId} property={pickPropertyInput(property)} />
    </div>
  );
}
