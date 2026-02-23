"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PropertySubnav } from "@/components/property/PropertySubnav";
import { ProjectionTable } from "@/components/property/ProjectionTable";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { HELP_TEXTS } from "@/lib/domain/uiHelp";

export function TimelinePageClient({ propertyId }: { propertyId: string }) {
  const [scenarioId, setScenarioId] = useState<"base" | "optimistic" | "conservative">("base");
  const analysis = useQuery(api.calculations.getValuationSuite as never, {
    propertyId: propertyId as never,
    scenarioId: scenarioId as never,
  }) as { projection: unknown[] } | undefined;

  if (!analysis) {
    return <div className="card">Lade Verlauf...</div>;
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Verlauf & Projektion</h1>
          <p>Die Tabelle zeigt die Entwicklung über 50 Jahre. Du kannst oben das Szenario wechseln.</p>
        </div>
      </section>
      <PropertySubnav propertyId={propertyId} />
      <div className="toolbar">
        <span className="flex items-center gap-1 text-sm font-medium">
          Szenario
          <InfoTooltip text={HELP_TEXTS.scenario.text} />
        </span>
        <select className="input max-w-52" value={scenarioId} onChange={(event) => setScenarioId(event.target.value as never)}>
          <option value="base">Basis</option>
          <option value="optimistic">Optimistisch</option>
          <option value="conservative">Konservativ</option>
        </select>
      </div>
      <ProjectionTable data={analysis.projection as never} />
    </div>
  );
}
