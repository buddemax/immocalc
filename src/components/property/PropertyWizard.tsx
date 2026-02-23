"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";
import { DEFAULT_PROPERTY, PropertyInput } from "@/lib/domain/property";
import { NumberInput } from "@/components/ui/number-input";
import { SectionCard } from "@/components/ui/section-card";
import { calcKpiSummary, calcMonthlyCashflow } from "@/lib/calculations/kpis";
import { HELP_TEXTS } from "@/lib/domain/uiHelp";
import { formatEuro, formatPercent } from "@/lib/utils/format";

const DRAFT_KEY = "immocal-property-draft";

const stepSchemas: z.ZodTypeAny[] = [
  z.object({
    address: z.string().min(3),
    livingArea: z.number().positive(),
    purchaseDate: z.string().min(8),
    yearBuilt: z.number().min(1800),
    microLocationScore: z.number().min(0).max(1),
  }),
  z.object({ purchasePrice: z.number().positive(), coldRentPerSqm: z.number().positive() }),
  z.object({ brokerFeePercent: z.number().min(0), notaryFeePercent: z.number().min(0), landRegistryPercent: z.number().min(0), transferTaxPercent: z.number().min(0) }),
  z.object({}),
  z.object({ loan1Amount: z.number().min(0), loan1InterestRate: z.number().min(0), loan1InitialRepayment: z.number().min(0) }),
  z.object({}),
  z.object({ hausgeldTotal: z.number().min(0), hausgeldTransferable: z.number().min(0), otherOperatingCosts: z.number().min(0) }),
  z.object({}),
  z.object({}),
  z.object({ buildingSharePercent: z.number().min(0).max(1) }),
  z.object({ depreciationRate: z.number().min(0).max(1) }),
  z.object({ personalTaxRate: z.number().min(0).max(1) }),
  z.object({}),
  z.object({ valueIncreasePercent: z.number().min(-1), rentIncreasePercent: z.number().min(-1), costIncreasePercent: z.number().min(-1) }),
  z.object({}),
  z.object({}),
  z.object({ latitude: z.number(), longitude: z.number() }),
];

const steps = [
  "Objektdaten",
  "Kaufpreis & Bruttorendite",
  "Nebenkosten",
  "Anfängliche Investitionen",
  "Darlehen",
  "Finanzierungszusammenfassung",
  "Bewirtschaftungskosten",
  "Cashflow vor Steuern",
  "Zinsrisiko",
  "Finanzierungsübersicht",
  "Grundstücksanteil",
  "AfA",
  "Steuer",
  "Cashflow nach Steuern",
  "Prognose",
  "Gesamtübersicht",
  "Standort prüfen",
];

const stepDescriptions: string[] = [
  "Grunddaten zur Immobilie und Lage.",
  "Kaufpreis und anfängliche Mieteinnahmen.",
  "Einmalige Kaufnebenkosten.",
  "Modernisierungen und weitere Startkosten.",
  "Finanzierung mit bis zu zwei Darlehen.",
  "Überblick über die Darlehensstruktur.",
  "Laufende Bewirtschaftungskosten.",
  "Monatlicher Cashflow vor Steuern.",
  "Empfindlichkeit bei steigenden Zinsen.",
  "Zusammenfassung Finanzierung und Tragfähigkeit.",
  "Aufteilung zwischen Gebäude und Grundstück.",
  "Steuerliche Abschreibung (AfA).",
  "Persönliche Steuerannahmen.",
  "Cashflow nach Steuern und Dynamik.",
  "Langfristige Entwicklungsannahmen.",
  "Finale Plausibilitätsprüfung.",
  "Adresse und Koordinaten prüfen.",
];

const parseStoredDraft = (): PropertyInput => {
  if (typeof window === "undefined") {
    return DEFAULT_PROPERTY;
  }

  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return DEFAULT_PROPERTY;
  }

  try {
    const parsed = JSON.parse(raw) as PropertyInput;
    return {
      ...DEFAULT_PROPERTY,
      ...parsed,
      initialInvestments: parsed.initialInvestments ?? [],
      loan1InterestChanges: parsed.loan1InterestChanges ?? [],
      loan1RepaymentChanges: parsed.loan1RepaymentChanges ?? [],
      loan1SpecialRepayments: parsed.loan1SpecialRepayments ?? [],
      loan2InterestChanges: parsed.loan2InterestChanges ?? [],
      loan2RepaymentChanges: parsed.loan2RepaymentChanges ?? [],
      loan2SpecialRepayments: parsed.loan2SpecialRepayments ?? [],
    };
  } catch {
    return DEFAULT_PROPERTY;
  }
};

export function PropertyWizard() {
  const apiUnsafe = api as unknown as {
    geo: {
      previewAddress: unknown;
    };
  };
  const createProperty = useMutation(api.properties.create as never) as unknown as (
    args: unknown,
  ) => Promise<string>;
  const previewAddress = useAction(apiUnsafe.geo.previewAddress as never) as unknown as (args: unknown) => Promise<
    | {
        point: { lat: number; lon: number };
        confidence: number;
        displayName: string;
      }
    | null
  >;
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<PropertyInput>(parseStoredDraft);
  const [error, setError] = useState<string | null>(null);
  const [geoPreview, setGeoPreview] = useState<string>("");
  const [geoBusy, setGeoBusy] = useState(false);

  const cashflow = useMemo(() => calcMonthlyCashflow(draft), [draft]);
  const kpis = useMemo(() => calcKpiSummary(draft), [draft]);
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const patchDraft = (patch: Partial<PropertyInput>) => {
    setDraft((previous) => {
      const next = { ...previous, ...patch };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const validateStep = () => {
    const schema = stepSchemas[step];
    const result = schema.safeParse(draft);
    if (!result.success) {
      setError("Bitte die Felder im aktuellen Schritt prüfen.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateStep()) {
      return;
    }

    const id = (await createProperty(draft)) as string;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_KEY);
    }
    router.push(`/property/${id}/cockpit`);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <SectionCard
        title={`Schritt ${step + 1}/${steps.length}: ${steps[step]}`}
        description={stepDescriptions[step]}
        helpText="Dieser Assistent führt dich von den Basisdaten bis zur vollständigen Kalkulation. Du kannst jederzeit zurückspringen."
        actions={<p className="text-sm font-semibold text-stone-700">{progress}% abgeschlossen</p>}
      >
        <div className="h-2 w-full rounded-full bg-stone-200">
          <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>

        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-4">
            <label>
              <span className="label">Adresse</span>
              <input className="input" value={draft.address} onChange={(event) => patchDraft({ address: event.target.value })} />
            </label>
            <NumberInput label="Wohnfläche" value={draft.livingArea} onChange={(value) => patchDraft({ livingArea: value })} unit="m²" />
            <label>
              <span className="label">Kaufdatum</span>
              <input className="input" type="date" value={draft.purchaseDate} onChange={(event) => patchDraft({ purchaseDate: event.target.value })} />
            </label>
            <label>
              <span className="label">Objekttyp</span>
              <select className="input" value={draft.propertyType} onChange={(event) => patchDraft({ propertyType: event.target.value as never })}>
                <option value="apartment">Wohnung</option>
                <option value="multi_family">Mehrfamilienhaus</option>
                <option value="single_family">Einfamilienhaus</option>
              </select>
            </label>
            <NumberInput label="Baujahr" value={draft.yearBuilt} onChange={(value) => patchDraft({ yearBuilt: Math.round(value) })} step={1} />
            <NumberInput label="Grundstück (m²)" value={draft.landArea} onChange={(value) => patchDraft({ landArea: value })} />
            <NumberInput
              label="Mikrolage-Score"
              value={draft.microLocationScore}
              onChange={(value) => patchDraft({ microLocationScore: value })}
              step={0.01}
              helpText={HELP_TEXTS.micro_location_score.text}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-3 md:grid-cols-3">
            <NumberInput label="Kaufpreis" value={draft.purchasePrice} onChange={(value) => patchDraft({ purchasePrice: value })} />
            <NumberInput label="Kaltmiete pro m²" value={draft.coldRentPerSqm} onChange={(value) => patchDraft({ coldRentPerSqm: value })} />
            <NumberInput label="Stellplatzmiete" value={draft.parkingRent} onChange={(value) => patchDraft({ parkingRent: value })} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3 md:grid-cols-4">
            <NumberInput label="Makler %" value={draft.brokerFeePercent} onChange={(value) => patchDraft({ brokerFeePercent: value })} step={0.001} />
            <NumberInput label="Notar %" value={draft.notaryFeePercent} onChange={(value) => patchDraft({ notaryFeePercent: value })} step={0.001} />
            <NumberInput label="Grundbuch %" value={draft.landRegistryPercent} onChange={(value) => patchDraft({ landRegistryPercent: value })} step={0.001} />
            <NumberInput
              label="GrESt %"
              value={draft.transferTaxPercent}
              onChange={(value) => patchDraft({ transferTaxPercent: value })}
              step={0.001}
              helpText={HELP_TEXTS.transfer_tax.text}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-2">
            {draft.initialInvestments.map((investment, index) => (
              <div key={`${investment.name}-${index}`} className="grid gap-2 md:grid-cols-4">
                <input
                  className="input"
                  value={investment.name}
                  onChange={(event) => {
                    const next = [...draft.initialInvestments];
                    next[index] = { ...next[index], name: event.target.value };
                    patchDraft({ initialInvestments: next });
                  }}
                  placeholder="Maßnahme"
                />
                <input
                  className="input"
                  type="number"
                  value={investment.cost}
                  onChange={(event) => {
                    const next = [...draft.initialInvestments];
                    next[index] = { ...next[index], cost: Number(event.target.value) };
                    patchDraft({ initialInvestments: next });
                  }}
                  placeholder="Kosten"
                />
                <select
                  className="input"
                  value={investment.taxTreatment}
                  onChange={(event) => {
                    const next = [...draft.initialInvestments];
                    next[index] = {
                      ...next[index],
                      taxTreatment: event.target.value as "activate" | "deduct" | "none",
                    };
                    patchDraft({ initialInvestments: next });
                  }}
                >
                  <option value="activate">aktivieren</option>
                  <option value="deduct">absetzen</option>
                  <option value="none">ohne</option>
                </select>
                <input
                  className="input"
                  type="number"
                  value={investment.valueIncrease}
                  onChange={(event) => {
                    const next = [...draft.initialInvestments];
                    next[index] = { ...next[index], valueIncrease: Number(event.target.value) };
                    patchDraft({ initialInvestments: next });
                  }}
                  placeholder="Wertsteigerung"
                />
              </div>
            ))}
            <button
              className="button-secondary"
              type="button"
              onClick={() =>
                patchDraft({
                  initialInvestments: [
                    ...draft.initialInvestments,
                    { name: "", cost: 0, taxTreatment: "none", valueIncrease: 0 },
                  ],
                })
              }
            >
              Investition hinzufügen
            </button>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-3 md:grid-cols-3">
            <NumberInput label="Darlehen I" value={draft.loan1Amount} onChange={(value) => patchDraft({ loan1Amount: value })} />
            <NumberInput label="Zins I" value={draft.loan1InterestRate} onChange={(value) => patchDraft({ loan1InterestRate: value })} step={0.001} />
            <NumberInput label="Tilgung I" value={draft.loan1InitialRepayment} onChange={(value) => patchDraft({ loan1InitialRepayment: value })} step={0.001} />
            <NumberInput label="Darlehen II" value={draft.loan2Amount} onChange={(value) => patchDraft({ loan2Amount: value })} />
            <NumberInput label="Zins II" value={draft.loan2InterestRate} onChange={(value) => patchDraft({ loan2InterestRate: value })} step={0.001} />
            <NumberInput label="Tilgung II" value={draft.loan2InitialRepayment} onChange={(value) => patchDraft({ loan2InitialRepayment: value })} step={0.001} />
          </div>
        ) : null}

        {step === 6 ? (
          <div className="grid gap-3 md:grid-cols-4">
            <NumberInput label="Hausgeld gesamt" value={draft.hausgeldTotal} onChange={(value) => patchDraft({ hausgeldTotal: value })} />
            <NumberInput
              label="Hausgeld umlagefähig"
              value={draft.hausgeldTransferable}
              onChange={(value) => patchDraft({ hausgeldTransferable: value })}
              helpText={HELP_TEXTS.allocable_hausgeld.text}
            />
            <NumberInput label="WEG-Rücklage" value={draft.wegReserve} onChange={(value) => patchDraft({ wegReserve: value })} />
            <NumberInput
              label="Sonstige BWK"
              value={draft.otherOperatingCosts}
              onChange={(value) => patchDraft({ otherOperatingCosts: value })}
            />
          </div>
        ) : null}

        {step === 10 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <NumberInput
              label="Gebäudeanteil"
              value={draft.buildingSharePercent}
              onChange={(value) => patchDraft({ buildingSharePercent: value })}
              step={0.01}
            />
            <NumberInput
              label="AfA-Satz"
              value={draft.depreciationRate}
              onChange={(value) => patchDraft({ depreciationRate: value })}
              step={0.01}
              helpText={HELP_TEXTS.afa.text}
            />
          </div>
        ) : null}

        {step === 12 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <NumberInput
              label="Persönlicher Steuersatz"
              value={draft.personalTaxRate}
              onChange={(value) => patchDraft({ personalTaxRate: value })}
              step={0.01}
              helpText={HELP_TEXTS.personal_tax_rate.text}
            />
            <NumberInput
              label="Wertsteigerung p.a."
              value={draft.valueIncreasePercent}
              onChange={(value) => patchDraft({ valueIncreasePercent: value })}
              step={0.01}
            />
          </div>
        ) : null}

        {step === 13 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <NumberInput
              label="Mietsteigerung p.a."
              value={draft.rentIncreasePercent}
              onChange={(value) => patchDraft({ rentIncreasePercent: value })}
              step={0.01}
            />
            <NumberInput
              label="Kostensteigerung p.a."
              value={draft.costIncreasePercent}
              onChange={(value) => patchDraft({ costIncreasePercent: value })}
              step={0.01}
            />
          </div>
        ) : null}

        {step === 16 ? (
          <div className="space-y-3">
            <p className="text-sm text-stone-700">
              Dieser Schritt prüft die Adresse serverseitig über Nominatim. Kein Live-Autocomplete.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <NumberInput
                label="Latitude"
                value={draft.latitude}
                onChange={(value) => patchDraft({ latitude: value })}
                step={0.00001}
              />
              <NumberInput
                label="Longitude"
                value={draft.longitude}
                onChange={(value) => patchDraft({ longitude: value })}
                step={0.00001}
              />
              <NumberInput
                label="Geo-Confidence"
                value={draft.geoConfidence}
                onChange={(value) => patchDraft({ geoConfidence: value })}
                step={0.01}
              />
            </div>
            <button
              className="button-secondary"
              type="button"
              disabled={geoBusy || draft.address.trim().length < 3}
              onClick={async () => {
                setGeoBusy(true);
                setGeoPreview("");
                try {
                  const result = await previewAddress({ address: draft.address });
                  if (result) {
                    patchDraft({
                      latitude: result.point.lat,
                      longitude: result.point.lon,
                      geoConfidence: result.confidence,
                      displayName: result.displayName,
                    });
                    setGeoPreview(
                      `Treffer: ${result.displayName} (${result.point.lat.toFixed(5)}, ${result.point.lon.toFixed(5)})`,
                    );
                  } else {
                    setGeoPreview("Kein Treffer gefunden.");
                  }
                } catch (previewError) {
                  setGeoPreview(previewError instanceof Error ? previewError.message : "Geo-Check fehlgeschlagen.");
                } finally {
                  setGeoBusy(false);
                }
              }}
            >
              {geoBusy ? "Prüfe..." : "Adresse prüfen"}
            </button>
            {geoPreview ? <p className="text-sm text-blue-800">{geoPreview}</p> : null}
          </div>
        ) : null}

        {step >= 5 && step !== 6 && step !== 10 && step !== 12 && step !== 13 ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
            <p>Vorschau Cashflow nach Steuern: {formatEuro(cashflow.afterTaxCashflow)} / Monat</p>
            <p>Bruttorendite: {formatPercent(kpis.grossYield)}</p>
            <p>Nettorendite: {formatPercent(kpis.netYield)}</p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </SectionCard>

      <div className="flex items-center justify-between">
        <button className="button-secondary" type="button" onClick={handlePrevious} disabled={step === 0}>
          Zurück
        </button>
        {step === steps.length - 1 ? (
          <button className="button-primary" type="submit">
            Immobilie speichern
          </button>
        ) : (
          <button className="button-primary" type="button" onClick={handleNext}>
            Weiter
          </button>
        )}
      </div>
    </form>
  );
}
