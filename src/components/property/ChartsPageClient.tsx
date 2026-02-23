"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { FinancingPieChart } from "@/components/charts/FinancingPieChart";
import { ValueChart } from "@/components/charts/ValueChart";
import { PropertySubnav } from "@/components/property/PropertySubnav";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { HELP_TEXTS } from "@/lib/domain/uiHelp";
import { formatEuro } from "@/lib/utils/format";

export function ChartsPageClient({ propertyId }: { propertyId: string }) {
  const [scenarioId, setScenarioId] = useState<"base" | "optimistic" | "conservative">("base");
  const analysis = useQuery(api.calculations.getValuationSuite as never, {
    propertyId: propertyId as never,
    scenarioId: scenarioId as never,
  }) as
    | {
        marketData: unknown[];
        kpis: {
          totalInvestment: number;
        };
        projection: unknown[];
        ertragswert: {
          value: number;
          bandLow: number;
          bandHigh: number;
        };
        assumptions: {
          parameterSetVersion: string;
        };
        risk: {
          breakevenInterestRate: number;
        };
        cashflow: {
          afterTaxCashflow: number;
        };
        costs: {
          total: number;
        };
        warnings: string[];
      }
    | undefined;

  const property = useQuery(api.properties.byId as never, {
    id: propertyId as never,
  }) as
    | {
          loan1Amount: number;
          loan2Amount: number;
        }
    | undefined;

  if (!analysis || !property) {
    return <div className="card">Lade Diagramme...</div>;
  }

  const equity = analysis.kpis.totalInvestment - property.loan1Amount - property.loan2Amount;

  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Charts & Entwicklung</h1>
          <p>Grafische Ansicht für Cashflow, Wertentwicklung und Finanzierungsstruktur.</p>
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
        <span className="text-xs text-stone-600">Parameter: {analysis.assumptions.parameterSetVersion}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CashflowChart data={analysis.projection as never} />
        <ValueChart data={analysis.projection as never} />
        <div className="card">
          <h3 className="mb-2 text-base font-semibold">Bewertungskorridor</h3>
          <p className="text-sm">Ertragswert: {formatEuro(analysis.ertragswert.value)}</p>
          <p className="text-sm">Band unten: {formatEuro(analysis.ertragswert.bandLow)}</p>
          <p className="text-sm">Band oben: {formatEuro(analysis.ertragswert.bandHigh)}</p>
          <p className="mt-2 text-sm">CF nach Steuern: {formatEuro(analysis.cashflow.afterTaxCashflow)}</p>
          <p className="text-sm">OpEx gesamt: {formatEuro(analysis.costs.total)}</p>
          <p className="text-sm">Breakeven-Zins: {(analysis.risk.breakevenInterestRate * 100).toFixed(2)}%</p>
        </div>
        <div className="lg:col-span-2">
          <FinancingPieChart loan1={property.loan1Amount} loan2={property.loan2Amount} equity={equity} />
        </div>
      </div>
    </div>
  );
}
