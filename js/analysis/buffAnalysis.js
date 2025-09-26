/**
 * buffAnalysis.js
 *
 * Utility functions to determine if a given ability/buff belongs
 * to the specified job, using the job configs in AppConfig,
 * and to handle special crediting logic for buffs in the FightTable.
 */

import { loadJobConfig } from "../config/AppConfig.js";
import { formatRelativeTime } from "../utility/dataUtils.js";
import { getLogger } from "../utility/logger.js";

const log = getLogger("ReportParser");

/**
 * Check if a given ability/buff is part of a specific job's actions.
 *
 * @param {string} buffName - The ability/buff name to check (e.g. "Kerachole")
 * @param {string} job - The job subType (e.g. "Sage", "Warrior")
 * @returns {boolean} true if the buff/ability belongs to the job, false otherwise
 */
export function isJobAbility(buffName, job) {
  if (!buffName || !job) return false;

  const jobConfig = loadJobConfig(job);
  if (!jobConfig || !jobConfig.actions) return false;

  // Case-insensitive match on keys of actions
  const normalizedBuff = buffName.trim().toLowerCase();
  return Object.keys(jobConfig.actions).some(
    (actionName) => actionName.trim().toLowerCase() === normalizedBuff
  );
}

/**
 * Purpose:
 *   When a buff is listed on a damage event but no active status
 *   window matches at that timestamp, this function looks back
 *   within a configurable window (default: 30s) to find the most
 *   recent expired status of the same buff and credits that source.
 *
 * Why:
 *   Some buffs may expire just before the server registers the
 *   associated damage event, leading to missing attributions.
 *   This prevents "lost" credits for buffs that were clearly active
 *   moments before the damage was applied.
 *
 * Behavior:
 *   - Finds the most recent status with the same buff whose `end`
 *     is within `lookbackWindow` ms before the event.
 *   - Credits that source to the FightTable row.
 *   - Logs the assignment for debugging and traceability.
 *
 * @param {string} buffName - Buff being applied
 * @param {Object} ev - The current damage event
 * @param {Array} statusList - Buff/debuff timelines
 * @param {Object} row - The FightTable row being updated
 * @param {Object} fight - Fight metadata (for logging)
 * @param {number} [lookbackWindow=30000] - Lookback window in ms
 * @returns {boolean} true if a backfill credit was applied, false otherwise
 */
export function assignLastKnownBuffSource(
  buffName,
  ev,
  statusList,
  row,
  fight,
  lookbackWindow = 30000
) {
  const recent = statusList
    .filter(
      (s) =>
        s.buff === buffName &&
        ev.relative >= s.start &&
        ev.relative - s.end <= lookbackWindow
    )
    .sort((a, b) => b.end - a.end)[0];

  if (recent) {
    if (!row.buffs[buffName]) row.buffs[buffName] = [];
    row.buffs[buffName].push(recent.source);

    log.info(
      `Failsafe applied: credited ${recent.source} for buff=${buffName} at ts=${ev.relative} ` +
        `(last seen active ${formatRelativeTime(
          recent.end + fight.startTime,
          fight.startTime
        )})`
    );
    return true;
  }
  return false;
}

/**
 * Purpose:
 *   Ensures every buff in the FightTable has a valid credited source.
 *
 * Why:
 *   After applying buffs and attempting backfill, some buffs may still
 *   have no source (empty array) or only invalid "Unknown" placeholders.
 *   This function guarantees that the FightTable has no unassigned buffs.
 *
 * Behavior:
 *   - Iterates through all rows and buffs.
 *   - If a buff has no valid appliers, credits *all* friendly players.
 *   - Logs a warning to indicate normalization was required.
 *
 * Tradeoff:
 *   This avoids rendering empty buff columns, but it inflates
 *   attribution by giving credit to everyone. Used only as a last resort.
 *
 * @param {Object} table - The FightTable being built
 * @param {Map} actorById - Map of actorID → actor metadata
 * @param {Object} fight - Fight metadata (for logging)
 */
export function resolveMissingBuffSources(table, actorById, fight) {
  for (const [ts, row] of Object.entries(table.rows)) {
    for (const [buffName, appliers] of Object.entries(row.buffs)) {
      if (
        appliers.length === 0 ||
        appliers.some((a) => !a || a.startsWith("Unknown"))
      ) {
        log.warn(
          `Fight ${fight.id}, ts=${ts}: Buff ${buffName} has no valid source, crediting all players`
        );
        row.buffs[buffName] = table.friendlyPlayerIds
          .map((id) => actorById.get(id)?.name)
          .filter(Boolean);
      }
    }
  }
}
