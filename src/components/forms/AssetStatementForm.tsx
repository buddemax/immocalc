"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatEuro } from "@/lib/utils/format";

interface StatementRow {
  description: string;
  amount: number;
  pledged?: boolean;
  comment?: string;
}

export function AssetStatementForm() {
  const entries = useQuery(api.assetStatements.list as never) as Array<{
    _id: string;
    assets: StatementRow[];
    liabilities: StatementRow[];
  }> | undefined;
  const upsert = useMutation(api.assetStatements.upsert as never) as unknown as (
    args: unknown,
  ) => Promise<unknown>;
  const existing = entries?.[0];

  const [assets, setAssets] = useState<StatementRow[]>(existing?.assets ?? [{ description: "Tagesgeld", amount: 0 }]);
  const [liabilities, setLiabilities] = useState<StatementRow[]>(existing?.liabilities ?? [{ description: "Kredit", amount: 0 }]);
  const totalAssets = assets.reduce((sum, row) => sum + (row.amount || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, row) => sum + (row.amount || 0), 0);
  const netAssets = totalAssets - totalLiabilities;

  useEffect(() => {
    if (existing) {
      setAssets(existing.assets);
      setLiabilities(existing.liabilities);
    }
  }, [existing]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await upsert({
      id: existing?._id,
      personalInfo: {
        name: "",
        address: "",
        city: "",
        maritalStatus: "",
        propertyRegime: "",
        children: "",
        referenceDate: new Date().toISOString().slice(0, 10),
      },
      assets: assets.map((entry) => ({ ...entry, pledged: Boolean(entry.pledged) })),
      liabilities,
    });
  };

  return (
    <form className="card space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 md:grid-cols-3">
        <p className="text-sm font-semibold text-stone-700">Aktiva: {formatEuro(totalAssets)}</p>
        <p className="text-sm font-semibold text-stone-700">Passiva: {formatEuro(totalLiabilities)}</p>
        <p className="text-sm font-semibold text-stone-700">Nettovermögen: {formatEuro(netAssets)}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-base font-semibold">Aktiva</p>
          <p className="text-sm text-stone-600">Alles, was dir gehört und einen Wert hat.</p>
          {assets.map((row, index) => (
            <div key={`asset-${index}`} className="grid grid-cols-[2fr_1fr_auto] gap-2">
              <input
                className="input"
                placeholder="Bezeichnung"
                value={row.description}
                onChange={(event) => {
                  const next = [...assets];
                  next[index] = { ...next[index], description: event.target.value };
                  setAssets(next);
                }}
              />
              <input
                className="input"
                type="number"
                placeholder="EUR"
                value={row.amount}
                onChange={(event) => {
                  const next = [...assets];
                  next[index] = { ...next[index], amount: Number(event.target.value) };
                  setAssets(next);
                }}
              />
              <label className="flex items-center gap-1 text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={Boolean(row.pledged)}
                  onChange={(event) => {
                    const next = [...assets];
                    next[index] = { ...next[index], pledged: event.target.checked };
                    setAssets(next);
                  }}
                />
                verpfändet
              </label>
            </div>
          ))}
          <button
            className="button-secondary"
            type="button"
            onClick={() => setAssets((rows) => [...rows, { description: "", amount: 0, pledged: false }])}
          >
            Aktivposten hinzufügen
          </button>
        </section>

        <section className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-base font-semibold">Passiva</p>
          <p className="text-sm text-stone-600">Alle offenen Schulden und Verbindlichkeiten.</p>
          {liabilities.map((row, index) => (
            <div key={`liability-${index}`} className="grid grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="Bezeichnung"
                value={row.description}
                onChange={(event) => {
                  const next = [...liabilities];
                  next[index] = { ...next[index], description: event.target.value };
                  setLiabilities(next);
                }}
              />
              <input
                className="input"
                type="number"
                placeholder="EUR"
                value={row.amount}
                onChange={(event) => {
                  const next = [...liabilities];
                  next[index] = { ...next[index], amount: Number(event.target.value) };
                  setLiabilities(next);
                }}
              />
            </div>
          ))}
          <button
            className="button-secondary"
            type="button"
            onClick={() => setLiabilities((rows) => [...rows, { description: "", amount: 0 }])}
          >
            Passivposten hinzufügen
          </button>
        </section>
      </div>

      <button className="button-primary" type="submit">
        Speichern
      </button>
    </form>
  );
}
