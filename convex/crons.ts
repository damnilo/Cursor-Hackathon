import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh good first issue counts",
  { hours: 1 },
  internal.ai.issueCounts.refreshGoodFirstIssueCounts,
  {},
);

crons.interval(
  "refresh repo readme cache",
  { minutes: 15 },
  internal.ai.enrich.refreshRepoDocs,
  {},
);

export default crons;
