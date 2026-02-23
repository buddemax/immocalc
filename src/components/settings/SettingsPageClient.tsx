"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DEFAULT_KPI_THRESHOLDS, KpiThresholds } from "@/lib/domain/property";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const THRESHOLD_LABELS: Record<string, string> = {
  grossYieldGreen: "Bruttorendite (grün)",
  grossYieldYellow: "Bruttorendite (gelb)",
  grossYieldRed: "Bruttorendite (rot)",
  netYieldGreen: "Nettorendite (grün)",
  netYieldYellow: "Nettorendite (gelb)",
  netYieldRed: "Nettorendite (rot)",
  afterTaxCfGreen: "Cashflow nach Steuer (grün)",
  afterTaxCfYellow: "Cashflow nach Steuer (gelb)",
  afterTaxCfRed: "Cashflow nach Steuer (rot)",
};

export function SettingsPageClient() {
  const thresholds = useQuery(api.kpiThresholds.get as never) as KpiThresholds | null | undefined;
  const upsert = useMutation(api.kpiThresholds.upsert as never) as unknown as (
    args: unknown,
  ) => Promise<unknown>;
  const [state, setState] = useState<KpiThresholds>(DEFAULT_KPI_THRESHOLDS);

  useEffect(() => {
    if (thresholds) {
      setState(thresholds);
    }
  }, [thresholds]);

  return (
    <form
      className="card space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await upsert(state);
      }}
    >
      <div>
        <h2 className="text-lg font-semibold">KPI-Schwellwerte</h2>
        <p className="mt-1 text-sm text-stone-600">
          Diese Werte steuern die Ampelfarben deiner Kennzahlen. So kannst du Warnungen an deine Strategie anpassen.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(state).map(([key, value]) => (
          <label key={key} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <span className="label">
              {THRESHOLD_LABELS[key] ?? key}
              <InfoTooltip text="Grenzwert für die Ampel-Logik. Höhere grüne Werte bedeuten strengere Bewertung." />
            </span>
            <input
              className="input"
              type="number"
              step="0.01"
              value={value}
              onChange={(event) =>
                setState((previous) => ({
                  ...previous,
                  [key]: Number(event.target.value),
                }))
              }
            />
          </label>
        ))}
      </div>
      <button className="button-primary" type="submit">
        Speichern
      </button>
    </form>
  );
}
