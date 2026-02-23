"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PropertyInput, DEFAULT_KPI_THRESHOLDS, pickPropertyInput } from "@/lib/domain/property";
import { calcBreakevenInterestRate } from "@/lib/calculations/risk";
import { calcKpiSummary, calcMonthlyCashflow } from "@/lib/calculations/kpis";
import { calcProjection } from "@/lib/calculations/projection";
import { calcDepreciation } from "@/lib/calculations/depreciation";
import { buildValuationInput } from "@/lib/calculations/valuation/fromProperty";
import { calcValuationSuite, pickScenario } from "@/lib/calculations/valuation/suite";
import { KpiCard } from "@/components/property/KpiCard";
import { LoanCalculator } from "@/components/property/LoanCalculator";
import { NumberInput } from "@/components/ui/number-input";
import { FeatureGate } from "@/components/ui/feature-gate";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { HELP_TEXTS } from "@/lib/domain/uiHelp";
import { formatEuro, formatPercent } from "@/lib/utils/format";
import type { PlanTier } from "@/lib/featureFlags";

interface CockpitViewProps {
  propertyId: string;
  property: PropertyInput;
  planTier?: PlanTier;
}

export function CockpitView({ propertyId, property, planTier = "pro" }: CockpitViewProps) {
  const updateProperty = useMutation(api.properties.update as never) as unknown as (args: unknown) => Promise<unknown>;
  const [state, setState] = useState<PropertyInput>(property);
  const [saving, setSaving] = useState(false);
  const [scenarioId, setScenarioId] = useState<"base" | "optimistic" | "conservative">("base");

  const cashflow = useMemo(() => calcMonthlyCashflow(state), [state]);
  const kpis = useMemo(() => calcKpiSummary(state), [state]);
  const projection = useMemo(() => calcProjection(state, pickScenario(scenarioId)), [scenarioId, state]);
  const depreciation = useMemo(() => calcDepreciation(state), [state]);
  const valuationSuite = useMemo(() => {
    const valuationInput = buildValuationInput(state, []);
    return calcValuationSuite(valuationInput, pickScenario(scenarioId));
  }, [scenarioId, state]);

  const selectedYear = state.projectionYear ?? projection[0].year;
  const selectedProjection = projection.find((entry) => entry.year === selectedYear) ?? projection[0];

  const breakevenRate = calcBreakevenInterestRate({
    warmRent: cashflow.warmRent,
    operatingCosts: cashflow.operatingCosts,
    repayment: cashflow.repayment,
    depreciation: depreciation.monthlyDepreciation,
    taxRate: state.personalTaxRate,
    totalDebt: state.loan1Amount + state.loan2Amount,
  });

  const onSave = async () => {
    setSaving(true);
    await updateProperty({ id: propertyId as never, ...pickPropertyInput(state as unknown as Record<string, unknown>) });
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <section className="toolbar justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-800">Cockpit-Ansicht</p>
          <p className="text-sm text-stone-600">Alle zentralen Eingaben und Kennzahlen auf einer Seite.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="label !mb-0">
            Szenario
            <InfoTooltip text={HELP_TEXTS.scenario.text} />
          </label>
          <select className="input min-w-[180px]" value={scenarioId} onChange={(event) => setScenarioId(event.target.value as never)}>
            <option value="base">Basis</option>
            <option value="optimistic">Optimistisch</option>
            <option value="conservative">Konservativ</option>
          </select>
        </div>
      </section>

      <section className="section-grid lg:grid-cols-3">
        <KpiCard
          label="Bruttorendite"
          value={formatPercent(kpis.grossYield)}
          numericValue={kpis.grossYield}
          thresholds={{
            green: DEFAULT_KPI_THRESHOLDS.grossYieldGreen,
            yellow: DEFAULT_KPI_THRESHOLDS.grossYieldYellow,
            red: DEFAULT_KPI_THRESHOLDS.grossYieldRed,
          }}
        />
        <KpiCard
          label="Nettorendite"
          value={formatPercent(kpis.netYield)}
          numericValue={kpis.netYield}
          thresholds={{
            green: DEFAULT_KPI_THRESHOLDS.netYieldGreen,
            yellow: DEFAULT_KPI_THRESHOLDS.netYieldYellow,
            red: DEFAULT_KPI_THRESHOLDS.netYieldRed,
          }}
        />
        <KpiCard
          label="Cashflow nach Steuern"
          value={formatEuro(cashflow.afterTaxCashflow)}
          numericValue={cashflow.afterTaxCashflow}
          helpText="Das ist dein monatlicher Überschuss nach laufenden Kosten, Finanzierung und Steuern."
          thresholds={{
            green: DEFAULT_KPI_THRESHOLDS.afterTaxCfGreen,
            yellow: DEFAULT_KPI_THRESHOLDS.afterTaxCfYellow,
            red: DEFAULT_KPI_THRESHOLDS.afterTaxCfRed,
          }}
        />
      </section>

      <section className="section-grid lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Objekt & Lage</h2>
          <div className="section-grid md:grid-cols-2">
            <label>
              <span className="label">Adresse</span>
              <input className="input" value={state.address} onChange={(event) => setState({ ...state, address: event.target.value })} />
            </label>
            <NumberInput
              label="Wohnfläche"
              value={state.livingArea}
              onChange={(value) => setState({ ...state, livingArea: value })}
              unit="m²"
              inputSize="lg"
            />
            <NumberInput label="Kaufpreis" value={state.purchasePrice} onChange={(value) => setState({ ...state, purchasePrice: value })} unit="EUR" />
            <NumberInput
              label="Mikrolage-Score"
              value={state.microLocationScore}
              onChange={(value) => setState({ ...state, microLocationScore: value })}
              step={0.01}
              helpText={HELP_TEXTS.micro_location_score.text}
              hint="Typisch zwischen 0 und 1."
            />
            <NumberInput label="Latitude" value={state.latitude} onChange={(value) => setState({ ...state, latitude: value })} step={0.00001} />
            <NumberInput label="Longitude" value={state.longitude} onChange={(value) => setState({ ...state, longitude: value })} step={0.00001} />
          </div>
          <p className="text-sm text-stone-600">
            Standort: {state.adminCity || state.adminCounty || "Unbekannt"} | Confidence: {state.geoConfidence.toFixed(2)}
          </p>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Miete, Kosten, Steuer</h2>
          <div className="section-grid md:grid-cols-2">
            <NumberInput label="Kaltmiete pro m²" value={state.coldRentPerSqm} onChange={(value) => setState({ ...state, coldRentPerSqm: value })} unit="EUR" />
            <NumberInput
              label="Umlagefähiges Hausgeld"
              value={state.hausgeldTransferable}
              onChange={(value) => setState({ ...state, hausgeldTransferable: value })}
              helpText={HELP_TEXTS.allocable_hausgeld.text}
              unit="EUR"
            />
            <NumberInput label="Hausgeld gesamt" value={state.hausgeldTotal} onChange={(value) => setState({ ...state, hausgeldTotal: value })} unit="EUR" />
            <NumberInput label="WEG-Rücklage" value={state.wegReserve} onChange={(value) => setState({ ...state, wegReserve: value })} unit="EUR" />
            <NumberInput
              label="Persönlicher Steuersatz"
              value={state.personalTaxRate}
              onChange={(value) => setState({ ...state, personalTaxRate: value })}
              step={0.01}
              helpText={HELP_TEXTS.personal_tax_rate.text}
              unit="%"
            />
            <NumberInput
              label="AfA-Satz"
              value={state.depreciationRate}
              onChange={(value) => setState({ ...state, depreciationRate: value })}
              step={0.01}
              helpText={HELP_TEXTS.afa.text}
              unit="%"
            />
          </div>
        </div>
      </section>

      <section className="section-grid lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Finanzierung</h2>
          <div className="section-grid md:grid-cols-2">
            <NumberInput label="Darlehen I" value={state.loan1Amount} onChange={(value) => setState({ ...state, loan1Amount: value })} unit="EUR" />
            <NumberInput label="Zins I" value={state.loan1InterestRate} onChange={(value) => setState({ ...state, loan1InterestRate: value })} step={0.001} unit="%" />
            <NumberInput
              label="Tilgung I"
              value={state.loan1InitialRepayment}
              onChange={(value) => setState({ ...state, loan1InitialRepayment: value })}
              step={0.001}
              unit="%"
            />
            <FeatureGate planTier={planTier} feature="second_loan">
              <NumberInput label="Darlehen II" value={state.loan2Amount} onChange={(value) => setState({ ...state, loan2Amount: value })} unit="EUR" />
            </FeatureGate>
          </div>
        </div>

        <div className="card space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            Kennzahlen Zukunft
            <InfoTooltip text={HELP_TEXTS.scenario.text} />
          </h2>
          <NumberInput
            label="Projektionsjahr"
            value={selectedYear}
            onChange={(value) => setState({ ...state, projectionYear: value })}
            step={1}
            unit="Jahr"
            inputSize="lg"
          />
          <p className="text-sm">Wert im Jahr {selectedYear}: {formatEuro(selectedProjection.propertyValueStart)}</p>
          <p className="flex items-center gap-1 text-sm">
            Nettovermögen: {formatEuro(selectedProjection.netEquity)}
            <InfoTooltip text={HELP_TEXTS.net_equity.text} />
          </p>
          <p className="flex items-center gap-1 text-sm">
            Break-even-Zins: {formatPercent(breakevenRate)}
            <InfoTooltip text={HELP_TEXTS.breakeven_interest.text} />
          </p>
          <p className="text-sm">Ertragswert: {formatEuro(valuationSuite.ertragswert.value)}</p>
          <p className="flex items-center gap-1 text-sm">
            Band: {formatEuro(valuationSuite.ertragswert.bandLow)} - {formatEuro(valuationSuite.ertragswert.bandHigh)}
            <InfoTooltip text={HELP_TEXTS.valuation_band.text} />
          </p>
        </div>
      </section>

      <section className="section-grid lg:grid-cols-2">
        <LoanCalculator
          title="Darlehen I"
          amount={state.loan1Amount}
          interestRate={state.loan1InterestRate}
          initialRepayment={state.loan1InitialRepayment}
          startYear={new Date(state.purchaseDate).getFullYear()}
        />
        <FeatureGate planTier={planTier} feature="second_loan">
          <LoanCalculator
            title="Darlehen II"
            amount={state.loan2Amount}
            interestRate={state.loan2InterestRate}
            initialRepayment={state.loan2InitialRepayment}
            startYear={new Date(state.purchaseDate).getFullYear()}
          />
        </FeatureGate>
      </section>

      <button className="button-primary" type="button" onClick={onSave} disabled={saving}>
        {saving ? "Speichert..." : "Änderungen speichern"}
      </button>
    </div>
  );
}
