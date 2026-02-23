import { NextResponse } from "next/server";
import { defaultBorisProviderConfigs, pickProvider } from "@/lib/boris/providerRegistry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BorisSyncRequest {
  lat?: number;
  lon?: number;
  asOfDate?: string;
  stateCode?: string;
}

function normalizeStateCode(input?: string) {
  if (!input) {
    return "BB";
  }
  return input.trim().toUpperCase() || "BB";
}

function normalizeDate(input?: string) {
  if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  return new Date().toISOString().slice(0, 10);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BorisSyncRequest;
    if (!isFiniteNumber(body.lat) || !isFiniteNumber(body.lon)) {
      return NextResponse.json(
        {
          error: "Latitude/Longitude fehlen oder sind ungueltig.",
        },
        { status: 400 },
      );
    }

    const stateCode = normalizeStateCode(body.stateCode);
    const asOfDate = normalizeDate(body.asOfDate);
    const provider = pickProvider(stateCode, defaultBorisProviderConfigs());

    if (!provider) {
      return NextResponse.json(
        {
          error: `Kein BORIS-Provider fuer ${stateCode} konfiguriert.`,
        },
        { status: 404 },
      );
    }

    const normalized = await provider.fetchLandValue({
      stateCode,
      lat: body.lat,
      lon: body.lon,
      asOfDate,
    });

    if (!normalized) {
      return NextResponse.json(
        {
          error: "Kein verwertbarer Bodenrichtwert gefunden.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      stateCode,
      ...normalized,
    });
  } catch {
    return NextResponse.json(
      {
        error: "BORIS-Fallback konnte nicht ausgefuehrt werden.",
      },
      { status: 500 },
    );
  }
}
