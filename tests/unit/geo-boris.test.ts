import { describe, expect, it } from "vitest";
import { parseNominatimResult } from "@/lib/geo/nominatimClient";
import { createBorisBbox, mapBrandenburgFeatures } from "@/lib/boris/adapters/brandenburgBorisAdapter";
import { mapGenericFeatures } from "@/lib/boris/adapters/genericOgcBorisAdapter";

describe("geo and boris helpers", () => {
  it("parses nominatim search row", () => {
    const parsed = parseNominatimResult({
      lat: "52.52",
      lon: "13.405",
      place_id: 123,
      display_name: "Berlin, Deutschland",
      importance: 0.74,
      address: {
        country_code: "de",
        state: "Berlin",
        county: "Berlin",
        city: "Berlin",
      },
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.countryCode).toBe("DE");
    expect(parsed?.point.lat).toBeCloseTo(52.52, 4);
  });

  it("builds boris bbox around a point", () => {
    const bbox = createBorisBbox(52.5, 13.4, 0.01);
    const parts = bbox.split(",").map(Number);
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBeCloseTo(13.39, 4);
    expect(parts[3]).toBeCloseTo(52.51, 4);
  });

  it("maps brandenburg features to normalized record", () => {
    const normalized = mapBrandenburgFeatures(
      [
        {
          geometry: { type: "Point", coordinates: [13.401, 52.501] },
          properties: { bodenrichtwert: 620, stichtag: "2025-01-01", gemeinde_bezeichnung: "Berlin", bodenrichtwertNummer: "A-1" },
        },
        {
          geometry: { type: "Point", coordinates: [13.406, 52.505] },
          properties: { bodenrichtwert: 640, stichtag: "2025-01-01", gemeinde_bezeichnung: "Berlin", bodenrichtwertNummer: "A-2" },
        },
      ],
      { lat: 52.5, lon: 13.4 },
      "2025-01-01",
      "https://example.test",
    );

    expect(normalized).not.toBeNull();
    expect(normalized?.valueEurPerSqm).toBeGreaterThan(600);
    expect(normalized?.sampleSize).toBe(2);
  });

  it("maps generic ogc features with fallback value keys", () => {
    const normalized = mapGenericFeatures(
      [
        { properties: { value: 500 } },
        { properties: { brw: "700" } },
        { properties: { unknown: 100 } },
      ],
      "https://example.test",
      "2026-01-01",
    );

    expect(normalized).not.toBeNull();
    expect(normalized?.valueEurPerSqm).toBe(700);
    expect(normalized?.sampleSize).toBe(2);
  });
});
