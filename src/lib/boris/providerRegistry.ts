import { BorisProviderAdapter } from "@/lib/domain/boris";
import { BrandenburgBorisAdapter } from "@/lib/boris/adapters/brandenburgBorisAdapter";
import { GenericOgcBorisAdapter } from "@/lib/boris/adapters/genericOgcBorisAdapter";

export interface BorisProviderConfig {
  stateCode: string;
  providerType: string;
  baseUrl: string;
  collectionId: string;
  enabled: boolean;
  priority: number;
  mappingVersion: string;
}

export function defaultBorisProviderConfigs(): BorisProviderConfig[] {
  return [
    {
      stateCode: "BB",
      providerType: "boris_ogc",
      baseUrl: "https://ogc-api.geobasis-bb.de/boris",
      collectionId: "br_bodenrichtwert",
      enabled: true,
      priority: 10,
      mappingVersion: "bb-v1",
    },
  ];
}

export function buildProviders(configs: BorisProviderConfig[]) {
  const providers: BorisProviderAdapter[] = [];

  for (const config of [...configs].sort((a, b) => a.priority - b.priority)) {
    if (!config.enabled) {
      continue;
    }

    if (config.stateCode === "BB") {
      providers.push(new BrandenburgBorisAdapter());
      continue;
    }

    providers.push(new GenericOgcBorisAdapter(config.stateCode, config.providerType, config.baseUrl, config.collectionId));
  }

  return providers;
}

export function pickProvider(stateCode: string, configs: BorisProviderConfig[]) {
  const providers = buildProviders(configs);
  return providers.find((provider) => provider.stateCode === stateCode) ?? null;
}
