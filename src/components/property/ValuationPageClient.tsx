"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAction, useConvex, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PropertySubnav } from "@/components/property/PropertySubnav";
import { NumberInput } from "@/components/ui/number-input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { HELP_TEXTS } from "@/lib/domain/uiHelp";
import { formatEuro, formatNumber } from "@/lib/utils/format";

type ScenarioId = "base" | "optimistic" | "conservative";
type Metric =
  | "land_value_per_sqm"
  | "cap_rate"
  | "market_rent_per_sqm"
  | "property_price_per_sqm"
  | "material_factor"
  | "regional_vacancy_rate"
  | "poi_supermarket_1km"
  | "poi_school_1km"
  | "poi_transit_1km"
  | "distance_transit_m"
  | "distance_center_m";

const CONVEX_MISSING_FUNCTION_TEXT = "Could not find public function";

function isMissingPublicFunctionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.includes(CONVEX_MISSING_FUNCTION_TEXT);
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (isMissingPublicFunctionError(error)) {
    return "BORIS ist im Backend noch nicht aktiv. Bitte Convex mit `npx convex dev` starten oder mit `npx convex deploy` deployen.";
  }

  if (error.message.includes("Unauthorized")) {
    return "Bitte erneut einloggen. Die Aktion war nicht autorisiert.";
  }

  return fallback;
}

export function ValuationPageClient({ propertyId }: { propertyId: string }) {
  const convex = useConvex();
  const apiUnsafe = api as unknown as {
    geo: {
      resolveAddress: unknown;
      fetchBoundary: unknown;
      fetchPoiInsights: unknown;
    };
    boris: {
      syncLandValue: unknown;
      listProviderStatus: unknown;
    };
  };
  const listProviderStatusRef = useMemo(() => apiUnsafe.boris.listProviderStatus as never, [apiUnsafe]);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [scenarioId, setScenarioId] = useState<ScenarioId>("base");
  const [metric, setMetric] = useState<Metric>("market_rent_per_sqm");
  const [unit, setUnit] = useState<"eur_per_sqm" | "percent" | "factor" | "meters">("eur_per_sqm");
  const [value, setValue] = useState(12);
  const [confidence, setConfidence] = useState(0.7);
  const [sourceLabel, setSourceLabel] = useState("Manuelle Eingabe");
  const [sourceUrl, setSourceUrl] = useState("");
  const [geoAddress, setGeoAddress] = useState("");
  const [geoFeedback, setGeoFeedback] = useState("");
  const [borisFeedback, setBorisFeedback] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [borisBusy, setBorisBusy] = useState(false);
  const [providerStatus, setProviderStatus] = useState<
    | {
        stateCode: string;
        providerType: string;
        enabled: boolean;
        priority: number;
      }[]
    | undefined
  >(undefined);
  const [providerStatusError, setProviderStatusError] = useState<string>("");

  const property = useQuery(api.properties.byId as never, {
    id: propertyId as never,
  }) as
    | {
        address?: string;
        valuationDate?: string;
        propertyType?: "apartment" | "multi_family" | "single_family";
        regionKey?: string;
        microLocationScore?: number;
        landArea?: number;
        yearBuilt?: number;
        remainingUsefulLife?: number;
        latitude?: number;
        longitude?: number;
        geoConfidence?: number;
        geoResolvedAt?: string;
        adminState?: string;
        adminCounty?: string;
        adminCity?: string;
        displayName?: string;
      }
    | null
    | undefined;

  const snapshots = useQuery(api.marketData.listByProperty as never, {
    propertyId: propertyId as never,
  }) as
    | {
        _id: string;
        metric: string;
        value: number;
        unit: string;
        sourceType: string;
        sourceLabel: string;
        sourceUrl?: string;
        effectiveDate: string;
        confidence: number;
      }[]
    | undefined;

  const runs = useQuery(api.valuationRuns.list as never, {
    propertyId: propertyId as never,
  }) as
    | {
        _id: string;
        runAt: string;
        scenarioId: string;
        parameterSetVersion: string;
        results: {
          primaryValue: number;
        };
      }[]
    | undefined;

  const suite = useQuery(api.calculations.getValuationSuite as never, {
    propertyId: propertyId as never,
    asOfDate: asOfDate as never,
    scenarioId: scenarioId as never,
  }) as
    | {
        ertragswert: { value: number; bandLow: number; bandHigh: number; qualityScore: number };
        vergleichswert: { value: number; qualityScore: number };
        sachwert: { value: number; qualityScore: number };
        assumptions: { parameterSetVersion: string };
        warnings: string[];
      }
    | undefined;

  const upsertSnapshot = useMutation(api.marketData.upsertManualSnapshot as never) as unknown as (args: unknown) => Promise<unknown>;
  const createRun = useMutation(api.valuationRuns.createFromCurrentInputs as never) as unknown as (args: unknown) => Promise<unknown>;
  const upsertValuationInputs = useMutation(api.properties.upsertValuationInputs as never) as unknown as (
    args: unknown,
  ) => Promise<unknown>;

  const geoResolveAction = useAction(apiUnsafe.geo.resolveAddress as never) as unknown as (args: unknown) => Promise<{
    point: { lat: number; lon: number };
    confidence: number;
    displayName: string;
  }>;
  const geoBoundaryAction = useAction(apiUnsafe.geo.fetchBoundary as never) as unknown as (args: unknown) => Promise<unknown>;
  const geoPoiAction = useAction(apiUnsafe.geo.fetchPoiInsights as never) as unknown as (
    args: unknown,
  ) => Promise<Array<{ key: string; count1km?: number; nearestDistanceMeters?: number }>>;
  const borisSyncAction = useAction(apiUnsafe.boris.syncLandValue as never) as unknown as (args: unknown) => Promise<{
    valueEurPerSqm: number;
    sourceUrl: string;
    effectiveDate: string;
    confidence: number;
    sampleSize: number;
  }>;

  const [updatingInputs, setUpdatingInputs] = useState(false);

  const primaryValue = useMemo(() => suite?.ertragswert.value ?? 0, [suite]);

  useEffect(() => {
    let active = true;
    setProviderStatusError("");

    convex
      .query(listProviderStatusRef, {})
      .then((result) => {
        if (!active) {
          return;
        }
        setProviderStatus(
          (result as
            | {
                stateCode: string;
                providerType: string;
                enabled: boolean;
                priority: number;
              }[]
            | undefined) ?? [],
        );
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setProviderStatus([]);
        const missingFunction = isMissingPublicFunctionError(error);
        setProviderStatusError(
          missingFunction
            ? "BORIS läuft im Fallback-Modus (Convex-Funktion noch nicht deployt)."
            : "BORIS-Providerstatus konnte aktuell nicht geladen werden.",
        );
      });

    return () => {
      active = false;
    };
  }, [convex, listProviderStatusRef]);

  if (property === undefined || !suite || !snapshots || !runs) {
    return <div className="card">Lade Bewertung...</div>;
  }

  if (!property) {
    return <div className="card">Objekt nicht gefunden.</div>;
  }

  const submitSnapshot = async (event: FormEvent) => {
    event.preventDefault();
    await upsertSnapshot({
      propertyId: propertyId as never,
      metric,
      value,
      unit,
      sourceLabel,
      sourceUrl: sourceUrl || undefined,
      effectiveDate: asOfDate,
      confidence,
      regionKey: property.regionKey ?? "DE-BE",
    });
  };

  const submitRun = async () => {
    await createRun({ propertyId: propertyId as never, scenarioId });
  };

  const handleResolveAddress = async () => {
    setGeoBusy(true);
    setGeoFeedback("");
    try {
      const result = await geoResolveAction({
        propertyId: propertyId as never,
        address: geoAddress || property.address || "",
      });
      setGeoFeedback(
        `Koordinate gesetzt: ${formatNumber(result.point.lat, 5)}, ${formatNumber(result.point.lon, 5)} (Conf: ${formatNumber(result.confidence, 2)})`,
      );
    } catch (error) {
      setGeoFeedback(error instanceof Error ? error.message : "Geocoding fehlgeschlagen");
    } finally {
      setGeoBusy(false);
    }
  };

  const handleBoundary = async () => {
    setGeoBusy(true);
    setGeoFeedback("");
    try {
      await geoBoundaryAction({ propertyId: propertyId as never });
      setGeoFeedback("Boundary erfolgreich aktualisiert.");
    } catch (error) {
      setGeoFeedback(error instanceof Error ? error.message : "Boundary-Update fehlgeschlagen");
    } finally {
      setGeoBusy(false);
    }
  };

  const handlePoi = async () => {
    setGeoBusy(true);
    setGeoFeedback("");
    try {
      const result = await geoPoiAction({ propertyId: propertyId as never, radiusMeters: 1000 });
      const counts = result.map((item) => `${item.key}:${item.count1km ?? 0}`).join(", ");
      setGeoFeedback(`POI-Insights aktualisiert (${counts}).`);
    } catch (error) {
      setGeoFeedback(error instanceof Error ? error.message : "POI-Update fehlgeschlagen");
    } finally {
      setGeoBusy(false);
    }
  };

  const handleBoris = async () => {
    setBorisBusy(true);
    setBorisFeedback("");
    try {
      const result = await borisSyncAction({ propertyId: propertyId as never, asOfDate });
      setBorisFeedback(
        `Bodenrichtwert geladen: ${formatEuro(result.valueEurPerSqm)} pro m², Stichtag ${result.effectiveDate}, Treffer ${result.sampleSize}, Conf ${formatNumber(result.confidence, 2)}.`,
      );
    } catch (error) {
      if (!isMissingPublicFunctionError(error)) {
        setBorisFeedback(getSafeErrorMessage(error, "BORIS-Abfrage fehlgeschlagen."));
        return;
      }

      try {
        const stateCode = (property.regionKey?.split("-").pop() ?? "BB").toUpperCase();
        const fallbackResponse = await fetch("/api/boris/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: property.latitude,
            lon: property.longitude,
            asOfDate,
            stateCode,
          }),
        });

        const fallbackBody = (await fallbackResponse.json()) as
          | {
              valueEurPerSqm?: number;
              effectiveDate?: string;
              confidence?: number;
              sourceUrl?: string;
              sampleSize?: number;
              error?: string;
            }
          | undefined;

        if (!fallbackResponse.ok || !fallbackBody?.valueEurPerSqm || !fallbackBody?.effectiveDate) {
          setBorisFeedback(fallbackBody?.error || "BORIS-Fallback konnte keinen Bodenrichtwert ermitteln.");
          return;
        }

        const existingLandValue = snapshots.find((snapshot) => snapshot.metric === "land_value_per_sqm");
        await upsertSnapshot({
          id: existingLandValue?._id as never,
          propertyId: propertyId as never,
          metric: "land_value_per_sqm",
          value: fallbackBody.valueEurPerSqm,
          unit: "eur_per_sqm",
          sourceLabel: `BORIS ${stateCode}`,
          sourceUrl: fallbackBody.sourceUrl || undefined,
          effectiveDate: fallbackBody.effectiveDate,
          confidence: fallbackBody.confidence ?? 0.5,
          regionKey: property.regionKey ?? `DE-${stateCode}`,
        });

        setBorisFeedback(
          `Bodenrichtwert geladen (Fallback): ${formatEuro(fallbackBody.valueEurPerSqm)} pro m², Stichtag ${fallbackBody.effectiveDate}, Treffer ${formatNumber(fallbackBody.sampleSize ?? 0)}.`,
        );
      } catch {
        setBorisFeedback("BORIS ist aktuell nicht verfügbar. Bitte später erneut versuchen.");
      }
    } finally {
      setBorisBusy(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1>Bewertung</h1>
          <p>Ertragswert, Vergleichswert und Sachwert im direkten Überblick inklusive Quellen und Datenqualität.</p>
        </div>
      </section>
      <PropertySubnav propertyId={propertyId} />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card space-y-3 lg:col-span-2">
          <h2 className="text-base font-semibold">Bewertungsergebnis</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <label>
              <span className="label">
                Stichtag
                <InfoTooltip text="Der Stichtag bestimmt, mit welchem Datum Marktdaten und Annahmen berechnet werden." />
              </span>
              <input className="input" type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} />
            </label>
            <label>
              <span className="label">
                Szenario
                <InfoTooltip text={HELP_TEXTS.scenario.text} />
              </span>
              <select className="input" value={scenarioId} onChange={(event) => setScenarioId(event.target.value as ScenarioId)}>
                <option value="base">Basis</option>
                <option value="optimistic">Optimistisch</option>
                <option value="conservative">Konservativ</option>
              </select>
            </label>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs text-stone-600">Ertragswert</p>
              <p className="text-sm font-semibold">{formatEuro(suite.ertragswert.value)}</p>
              <p className="text-xs text-stone-600">Q: {formatNumber(suite.ertragswert.qualityScore, 2)}</p>
            </div>
            <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs text-stone-600">Vergleichswert</p>
              <p className="text-sm font-semibold">{formatEuro(suite.vergleichswert.value)}</p>
              <p className="text-xs text-stone-600">Q: {formatNumber(suite.vergleichswert.qualityScore, 2)}</p>
            </div>
            <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs text-stone-600">Sachwert</p>
              <p className="text-sm font-semibold">{formatEuro(suite.sachwert.value)}</p>
              <p className="text-xs text-stone-600">Q: {formatNumber(suite.sachwert.qualityScore, 2)}</p>
            </div>
          </div>

          <div className="rounded-md border border-stone-200 p-3 text-sm">
            <p>Primärwert: {formatEuro(primaryValue)}</p>
            <p>
              Band: {formatEuro(suite.ertragswert.bandLow)} bis {formatEuro(suite.ertragswert.bandHigh)}
              <span className="ml-1 inline-flex align-middle">
                <InfoTooltip text={HELP_TEXTS.valuation_band.text} />
              </span>
            </p>
            <p>Parameterstand: {suite.assumptions.parameterSetVersion}</p>
          </div>

          {suite.warnings.length > 0 ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="mb-1 font-semibold">Hinweise</p>
              <ul className="list-disc pl-5">
                {suite.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button className="button-primary" type="button" onClick={submitRun}>
            Bewertungs-Run speichern
          </button>
        </section>

        <section className="card space-y-3">
          <h2 className="text-base font-semibold">Bewertungsinputs</h2>
          <NumberInput
            label="Mikrolage-Score"
            value={property.microLocationScore ?? 0.65}
            onChange={async (next) => {
              setUpdatingInputs(true);
              await upsertValuationInputs({ id: propertyId as never, microLocationScore: next });
              setUpdatingInputs(false);
            }}
            step={0.01}
            helpText={HELP_TEXTS.micro_location_score.text}
          />
          <NumberInput
            label="Grundstücksfläche"
            value={property.landArea ?? 0}
            onChange={async (next) => {
              setUpdatingInputs(true);
              await upsertValuationInputs({ id: propertyId as never, landArea: next });
              setUpdatingInputs(false);
            }}
          />
          <NumberInput
            label="Baujahr"
            value={property.yearBuilt ?? 1995}
            onChange={async (next) => {
              setUpdatingInputs(true);
              await upsertValuationInputs({ id: propertyId as never, yearBuilt: Math.round(next) });
              setUpdatingInputs(false);
            }}
          />
          <NumberInput
            label="Restnutzungsdauer"
            value={property.remainingUsefulLife ?? 50}
            onChange={async (next) => {
              setUpdatingInputs(true);
              await upsertValuationInputs({ id: propertyId as never, remainingUsefulLife: Math.round(next) });
              setUpdatingInputs(false);
            }}
            hint="Angabe in Jahren."
          />
          <p className="text-xs text-stone-600">{updatingInputs ? "Speichert..." : "Änderungen werden sofort gespeichert."}</p>
        </section>
      </div>

      <section className="card space-y-3">
        <h2 className="text-base font-semibold">Standortdaten (Geo/BORIS)</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="md:col-span-2">
            <span className="label">Adresse für Geocoding</span>
            <input
              className="input"
              value={geoAddress}
              onChange={(event) => setGeoAddress(event.target.value)}
              placeholder={property.address ?? "Adresse eingeben"}
            />
          </label>
          <button className="button-secondary mt-6" type="button" onClick={handleResolveAddress} disabled={geoBusy}>
            Adresse geocodieren
          </button>
          <button className="button-secondary mt-6" type="button" onClick={handleBoris} disabled={borisBusy}>
            Bodenrichtwert aus BORIS laden
          </button>
          <button className="button-secondary" type="button" onClick={handleBoundary} disabled={geoBusy}>
            Boundary aktualisieren
          </button>
          <button className="button-secondary" type="button" onClick={handlePoi} disabled={geoBusy}>
            POI aktualisieren
          </button>
        </div>

        <div className="grid gap-2 rounded-md border border-stone-200 p-3 text-sm md:grid-cols-2">
          <p>Koordinaten: {formatNumber(property.latitude ?? 0, 5)} / {formatNumber(property.longitude ?? 0, 5)}</p>
          <p className="flex items-center gap-1">
            Geo-Confidence: {formatNumber(property.geoConfidence ?? 0, 2)}
            <InfoTooltip text={HELP_TEXTS.confidence.text} />
          </p>
          <p>Region: {property.regionKey ?? "-"}</p>
          <p>Ort: {property.adminCity || property.adminCounty || "-"}</p>
          <p className="md:col-span-2">Display: {property.displayName || "-"}</p>
        </div>

        {geoFeedback ? <p className="text-sm text-blue-800">{geoFeedback}</p> : null}
        {borisFeedback ? <p className="text-sm text-emerald-800">{borisFeedback}</p> : null}
        {providerStatusError ? <p className="text-sm text-amber-800">{providerStatusError}</p> : null}

        {providerStatus && providerStatus.length > 0 ? (
          <div className="rounded-md border border-stone-200 p-3 text-xs text-stone-700">
            <p className="mb-1 font-semibold">Provider-Status</p>
            <p>
              {providerStatus.map((item) => `${item.stateCode}:${item.providerType}${item.enabled ? "" : "(off)"}`).join(", ")}
            </p>
          </div>
        ) : null}
      </section>

      <section className="card space-y-3">
        <h2 className="text-base font-semibold">Marktdaten (manuell)</h2>
        <form className="grid gap-3 md:grid-cols-6" onSubmit={submitSnapshot}>
          <label>
            <span className="label">Metrik</span>
            <select className="input" value={metric} onChange={(event) => setMetric(event.target.value as Metric)}>
              <option value="market_rent_per_sqm">Marktmiete €/m²</option>
              <option value="land_value_per_sqm">Bodenwert €/m²</option>
              <option value="cap_rate">Liegenschaftszins</option>
              <option value="property_price_per_sqm">Vergleichspreis €/m²</option>
              <option value="material_factor">Sachwertfaktor</option>
              <option value="regional_vacancy_rate">Leerstandsquote</option>
              <option value="poi_supermarket_1km">Supermärkte 1km</option>
              <option value="poi_school_1km">Schulen 1km</option>
              <option value="poi_transit_1km">ÖPNV 1km</option>
              <option value="distance_transit_m">Distanz ÖPNV (m)</option>
              <option value="distance_center_m">Distanz Zentrum (m)</option>
            </select>
          </label>
          <NumberInput label="Wert" value={value} onChange={setValue} />
          <label>
            <span className="label">Einheit</span>
            <select className="input" value={unit} onChange={(event) => setUnit(event.target.value as never)}>
              <option value="eur_per_sqm">EUR/m²</option>
              <option value="percent">%</option>
              <option value="factor">Faktor</option>
              <option value="meters">Meter</option>
            </select>
          </label>
          <NumberInput
            label="Confidence"
            value={confidence}
            onChange={setConfidence}
            step={0.01}
            helpText={HELP_TEXTS.confidence.text}
          />
          <label>
            <span className="label">Quelle</span>
            <input className="input" value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} />
          </label>
          <label>
            <span className="label">Quelle URL</span>
            <input className="input" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} />
          </label>
          <div className="md:col-span-6">
            <button className="button-secondary" type="submit">
              Snapshot speichern
            </button>
          </div>
        </form>

        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Metrik</th>
                <th>Wert</th>
                <th>Einheit</th>
                <th>Quelle</th>
                <th>Typ</th>
                <th>Stichtag</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snapshot) => (
                <tr key={snapshot._id}>
                  <td>{snapshot.metric}</td>
                  <td>{formatNumber(snapshot.value)}</td>
                  <td>{snapshot.unit}</td>
                  <td>{snapshot.sourceLabel}</td>
                  <td>{snapshot.sourceType}</td>
                  <td>{snapshot.effectiveDate}</td>
                  <td>{formatNumber(snapshot.confidence, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-2 text-base font-semibold">Bewertungsverlauf</h2>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Zeitpunkt</th>
                <th>Szenario</th>
                <th>Engine</th>
                <th>Primärwert</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run._id}>
                  <td>{new Date(run.runAt).toLocaleString("de-DE")}</td>
                  <td>{run.scenarioId}</td>
                  <td>{run.parameterSetVersion}</td>
                  <td>{formatEuro(run.results.primaryValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
