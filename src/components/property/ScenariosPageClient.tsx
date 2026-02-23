"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PropertySubnav } from "@/components/property/PropertySubnav";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { HELP_TEXTS } from "@/lib/domain/uiHelp";
import { formatEuro, formatPercent } from "@/lib/utils/format";

interface ScenarioResult {
  ertragswert: { value: number; bandLow: number; bandHigh: number };
  cashflow: { afterTaxCashflow: number };
  risk: { breakevenInterestRate: number };
  projection: { year: number; afterTaxCashflow: number; propertyValueEnd: number }[];
}

function ScenarioCard({ label, result }: { label: string; result: ScenarioResult }) {
  const yearOne = result.projection[0];
  const yearTen = result.projection[9] ?? result.projection[result.projection.length - 1];

  return (
    <article className="card space-y-2">
      <h3 className="text-base font-semibold">{label}</h3>
      <p className="text-sm">Ertragswert: {formatEuro(result.ertragswert.value)}</p>
      <p className="text-sm">
        Band: {formatEuro(result.ertragswert.bandLow)} - {formatEuro(result.ertragswert.bandHigh)}
      </p>
      <p className="text-sm">CF nach Steuer (Monat): {formatEuro(result.cashflow.afterTaxCashflow)}</p>
      <p className="text-sm">Breakeven-Zins: {formatPercent(result.risk.breakevenInterestRate)}</p>
      <p className="text-sm">Wert Jahr {yearOne?.year}: {formatEuro(yearOne?.propertyValueEnd ?? 0)}</p>
      <p className="text-sm">Wert Jahr {yearTen?.year}: {formatEuro(yearTen?.propertyValueEnd ?? 0)}</p>
    </article>
  );
}

export function ScenariosPageClient({ propertyId }: { propertyId: string }) {
  const base = useQuery(api.calculations.getValuationSuite as never, {
    propertyId: propertyId as never,
    scenarioId: "base" as never,
  }) as ScenarioResult | undefined;

  const optimistic = useQuery(api.calculations.getValuationSuite as never, {
    propertyId: propertyId as never,
    scenarioId: "optimistic" as never,
  }) as ScenarioResult | undefined;

  const conservative = useQuery(api.calculations.getValuationSuite as never, {
    propertyId: propertyId as never,
    scenarioId: "conservative" as never,
  }) as ScenarioResult | undefined;

  if (!base || !optimistic || !conservative) {
    return <div className="card">Lade Szenarien...</div>;
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Szenariovergleich</h1>
          <p>Vergleiche die Immobilie unter unterschiedlichen Annahmen und prüfe die Robustheit.</p>
        </div>
      </section>
      <PropertySubnav propertyId={propertyId} />
      <section className="toolbar">
        <p className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          Basis, optimistisch und konservativ werden parallel berechnet.
          <InfoTooltip text={HELP_TEXTS.scenario.text} />
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ScenarioCard label="Basis" result={base} />
        <ScenarioCard label="Optimistisch" result={optimistic} />
        <ScenarioCard label="Konservativ" result={conservative} />
      </div>
    </div>
  );
}
