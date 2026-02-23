import { PropertyInput } from "@/lib/domain/property";
import { calcKpiSummary, calcMonthlyCashflow } from "@/lib/calculations/kpis";
import { calcTotalInvestment } from "@/lib/calculations/core";
import { formatEuro, formatPercent } from "@/lib/utils/format";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export function BankReportView({ property }: { property: PropertyInput }) {
  const cashflow = calcMonthlyCashflow(property);
  const kpis = calcKpiSummary(property);
  const equity = calcTotalInvestment(property) - property.loan1Amount - property.loan2Amount;

  return (
    <div className="space-y-4 print:p-0">
      <section className="card print:shadow-none">
        <h1 className="text-xl font-semibold">Bankgespräch-Übersicht</h1>
        <p className="text-sm text-stone-600">{property.address}</p>
      </section>

      <section className="card print:shadow-none">
        <h2 className="mb-2 text-base font-semibold">Finanzierungsübersicht</h2>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>Gesamtinvestition: {formatEuro(calcTotalInvestment(property))}</p>
          <p className="flex items-center gap-1">
            Eigenkapital: {formatEuro(equity)}
            <InfoTooltip text="Eigenkapital ist dein eigener eingesetzter Anteil in der Finanzierung." />
          </p>
          <p>Darlehen I: {formatEuro(property.loan1Amount)}</p>
          <p>Darlehen II: {formatEuro(property.loan2Amount)}</p>
        </div>
      </section>

      <section className="card print:shadow-none">
        <h2 className="mb-2 text-base font-semibold">Cashflow</h2>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>Operativer CF/Monat: {formatEuro(cashflow.operativeCashflow)}</p>
          <p>CF nach Steuern/Monat: {formatEuro(cashflow.afterTaxCashflow)}</p>
          <p>Steuern/Monat: {formatEuro(cashflow.tax)}</p>
          <p className="flex items-center gap-1">
            Bruttorendite: {formatPercent(kpis.grossYield)}
            <InfoTooltip text="Bruttorendite vergleicht die jährliche Miete mit dem Kaufpreis, noch ohne laufende Kosten." />
          </p>
        </div>
      </section>
    </div>
  );
}
