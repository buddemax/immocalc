"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BankReportView } from "@/components/property/BankReportView";
import { PropertySubnav } from "@/components/property/PropertySubnav";
import { pickPropertyInput } from "@/lib/domain/property";

export function BankPageClient({ propertyId }: { propertyId: string }) {
  const property = useQuery(api.properties.byId as never, { id: propertyId as never }) as Record<string, unknown> | null | undefined;

  if (property === undefined) {
    return <div className="card">Lade Daten...</div>;
  }

  if (!property) {
    return <div className="card">Objekt nicht gefunden.</div>;
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Bank-Ansicht</h1>
          <p>Diese Sicht fasst Finanzierung und Cashflow bankgerecht zusammen und ist druckfreundlich aufgebaut.</p>
        </div>
      </section>
      <PropertySubnav propertyId={propertyId} />
      <BankReportView property={pickPropertyInput(property)} />
    </div>
  );
}
