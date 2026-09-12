/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as data_sampleProfiles from "../data/sampleProfiles.js";
import type * as data_verifiedRepos from "../data/verifiedRepos.js";
import type * as health from "../health.js";
import type * as lib_matching from "../lib/matching.js";
import type * as lib_validators from "../lib/validators.js";
import type * as repositories from "../repositories.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "data/sampleProfiles": typeof data_sampleProfiles;
  "data/verifiedRepos": typeof data_verifiedRepos;
  health: typeof health;
  "lib/matching": typeof lib_matching;
  "lib/validators": typeof lib_validators;
  repositories: typeof repositories;
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
