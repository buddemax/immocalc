"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatEuro } from "@/lib/utils/format";

interface PropertyDoc {
  _id: string;
  address: string;
  purchasePrice: number;
  livingArea: number;
  coldRentPerSqm: number;
}

export function PropertyList() {
  const properties = useQuery(api.properties.list as never) as PropertyDoc[] | undefined;
  const seedDemoProperty = useMutation(api.seed.seedDemoProperty as never) as unknown as (
    args: unknown,
  ) => Promise<unknown>;

  if (!properties) {
    return <div className="card">Lade Immobilien...</div>;
  }

  if (properties.length === 0) {
    return (
      <div className="card">
        <p className="text-base font-semibold text-stone-800">Noch keine Immobilien vorhanden.</p>
        <p className="mt-1 text-sm text-stone-600">Lege deine erste Immobilie an oder lade Demo-Daten zum Kennenlernen.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="button-primary inline-flex" href="/property/new">
            Erste Immobilie anlegen
          </Link>
          <button
            className="button-secondary"
            type="button"
            onClick={async () => {
              await seedDemoProperty({});
            }}
          >
            Demo-Daten laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">Deine Immobilien</h2>
        <p className="text-sm text-stone-600">{properties.length} Objekt{properties.length === 1 ? "" : "e"}</p>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Objekt</th>
            <th>Kaufpreis</th>
            <th>Wohnfläche</th>
            <th>Kaltmiete/m²</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property._id}>
              <td className="font-semibold text-stone-800">{property.address}</td>
              <td>{formatEuro(property.purchasePrice)}</td>
              <td>{property.livingArea.toFixed(1)} m²</td>
              <td>{formatEuro(property.coldRentPerSqm)}</td>
              <td>
                <Link className="text-brand-700 hover:underline" href={`/property/${property._id}/cockpit`}>
                  Öffnen
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
