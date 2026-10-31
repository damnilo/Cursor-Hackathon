/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_contribute from "../ai/contribute.js";
import type * as ai_enrich from "../ai/enrich.js";
import type * as ai_issueCountStore from "../ai/issueCountStore.js";
import type * as ai_issueCounts from "../ai/issueCounts.js";
import type * as ai_lib_catalog from "../ai/lib/catalog.js";
import type * as ai_lib_docs from "../ai/lib/docs.js";
import type * as ai_lib_exa from "../ai/lib/exa.js";
import type * as ai_lib_firecrawl from "../ai/lib/firecrawl.js";
import type * as ai_lib_githubIssues from "../ai/lib/githubIssues.js";
import type * as ai_lib_grok from "../ai/lib/grok.js";
import type * as ai_lib_guide from "../ai/lib/guide.js";
import type * as ai_lib_http from "../ai/lib/http.js";
import type * as ai_normalize from "../ai/normalize.js";
import type * as ai_parseCv from "../ai/parseCv.js";
import type * as ai_rank from "../ai/rank.js";
import type * as ai_store from "../ai/store.js";
import type * as ai_usage from "../ai/usage.js";
import type * as auth from "../auth.js";
import type * as contributions from "../contributions.js";
import type * as crons from "../crons.js";
import type * as data_sampleProfiles from "../data/sampleProfiles.js";
import type * as data_verifiedRepos from "../data/verifiedRepos.js";
import type * as fixtures from "../fixtures.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as lib_aiQuota from "../lib/aiQuota.js";
import type * as lib_catalogSync from "../lib/catalogSync.js";
import type * as lib_chipFreshness from "../lib/chipFreshness.js";
import type * as lib_chips from "../lib/chips.js";
import type * as lib_contributionLookup from "../lib/contributionLookup.js";
import type * as lib_docsHunt from "../lib/docsHunt.js";
import type * as lib_matching from "../lib/matching.js";
import type * as lib_planFreshness from "../lib/planFreshness.js";
import type * as lib_profileAccess from "../lib/profileAccess.js";
import type * as lib_redirectAllow from "../lib/redirectAllow.js";
import type * as lib_rerank from "../lib/rerank.js";
import type * as lib_scoring from "../lib/scoring.js";
import type * as lib_validators from "../lib/validators.js";
import type * as matching from "../matching.js";
import type * as profiles from "../profiles.js";
import type * as repositories from "../repositories.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/contribute": typeof ai_contribute;
  "ai/enrich": typeof ai_enrich;
  "ai/issueCountStore": typeof ai_issueCountStore;
  "ai/issueCounts": typeof ai_issueCounts;
  "ai/lib/catalog": typeof ai_lib_catalog;
  "ai/lib/docs": typeof ai_lib_docs;
  "ai/lib/exa": typeof ai_lib_exa;
  "ai/lib/firecrawl": typeof ai_lib_firecrawl;
  "ai/lib/githubIssues": typeof ai_lib_githubIssues;
  "ai/lib/grok": typeof ai_lib_grok;
  "ai/lib/guide": typeof ai_lib_guide;
  "ai/lib/http": typeof ai_lib_http;
  "ai/normalize": typeof ai_normalize;
  "ai/parseCv": typeof ai_parseCv;
  "ai/rank": typeof ai_rank;
  "ai/store": typeof ai_store;
  "ai/usage": typeof ai_usage;
  auth: typeof auth;
  contributions: typeof contributions;
  crons: typeof crons;
  "data/sampleProfiles": typeof data_sampleProfiles;
  "data/verifiedRepos": typeof data_verifiedRepos;
  fixtures: typeof fixtures;
  health: typeof health;
  http: typeof http;
  "lib/aiQuota": typeof lib_aiQuota;
  "lib/catalogSync": typeof lib_catalogSync;
  "lib/chipFreshness": typeof lib_chipFreshness;
  "lib/chips": typeof lib_chips;
  "lib/contributionLookup": typeof lib_contributionLookup;
  "lib/docsHunt": typeof lib_docsHunt;
  "lib/matching": typeof lib_matching;
  "lib/planFreshness": typeof lib_planFreshness;
  "lib/profileAccess": typeof lib_profileAccess;
  "lib/redirectAllow": typeof lib_redirectAllow;
  "lib/rerank": typeof lib_rerank;
  "lib/scoring": typeof lib_scoring;
  "lib/validators": typeof lib_validators;
  matching: typeof matching;
  profiles: typeof profiles;
  repositories: typeof repositories;
  seed: typeof seed;
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
