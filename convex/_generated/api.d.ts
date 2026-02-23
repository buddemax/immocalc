/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assetStatements from "../assetStatements.js";
import type * as auth from "../auth.js";
import type * as boris from "../boris.js";
import type * as calculations from "../calculations.js";
import type * as geo from "../geo.js";
import type * as geoCache from "../geoCache.js";
import type * as householdBudgets from "../householdBudgets.js";
import type * as kpiThresholds from "../kpiThresholds.js";
import type * as marketData from "../marketData.js";
import type * as plan from "../plan.js";
import type * as properties from "../properties.js";
import type * as regulatoryParameterSets from "../regulatoryParameterSets.js";
import type * as seed from "../seed.js";
import type * as valuationRuns from "../valuationRuns.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assetStatements: typeof assetStatements;
  auth: typeof auth;
  boris: typeof boris;
  calculations: typeof calculations;
  geo: typeof geo;
  geoCache: typeof geoCache;
  householdBudgets: typeof householdBudgets;
  kpiThresholds: typeof kpiThresholds;
  marketData: typeof marketData;
  plan: typeof plan;
  properties: typeof properties;
  regulatoryParameterSets: typeof regulatoryParameterSets;
  seed: typeof seed;
  valuationRuns: typeof valuationRuns;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
