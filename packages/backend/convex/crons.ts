import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run cleanup of old queued matches every 2 minutes
// This prevents matches from staying in "Queuing" status indefinitely
crons.interval(
  "archive old queued matches",
  { minutes: 2 },
  internal.matches.archiveOldQueuedMatches,
  {}
);

export default crons;

