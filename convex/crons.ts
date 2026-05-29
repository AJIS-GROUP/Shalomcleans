import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval(
  "purge old events",
  { hours: 24 },
  internal.events.purgeOld,
)

export default crons
