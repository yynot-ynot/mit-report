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

// Maps normalized buff → action name, or null
const buffToAbilityMap = new Map();

// 🔒 Buffs that should *always* be displayed as buffs (never collapse to abilities)
const ALWAYS_SHOW_AS_BUFF = new Set([
  "kardion", // Example
  "differential diagnosis",
  "galvanize",
]);

// 🔒 Hardcoded Buff → Ability overrides
const HARDCODED_BUFF_TO_ABILITY = {
  "blackest night": "The Blackest Night",
  intersection: "Celestial Intersection",
  "undead rebirth": "Living Dead",
  holosakos: "Holos",
};

/**
 * Check if a given ability/buff is part of a specific job's actions.
 *
 * Purpose:
 *   Determines whether a buff/ability name corresponds directly to
 *   an action in the provided job’s config. This is used in the UI
 *   layer to distinguish between “true abilities” and secondary
 *   effects or unidentified buffs.
 *
 * Behavior:
 *   - Performs a case-insensitive match against the job’s action keys.
 *   - If no direct match is found:
 *       • Triggers an async lookup via `spawnBuffLookup` to search
 *         through the job’s ability `effects` fields for a possible origin.
 *       • This lookup is background-only and does not affect the
 *         immediate return value.
 *   - Returns `true` only if the buffName matches an action key directly.
 *   - Returns `false` otherwise, even if a background lookup is in progress.
 *
 * Notes:
 *   - The async lookup fills `buffToAbilityMap` for later use in the UI.
 *   - Multiple quick lookups for the same buff are safe, because the
 *     map tracks `"__PENDING__"` while a search is running.
 *
 * @param {string} buffName - The ability/buff name to check (e.g. "Kerachole", "Stem the Flow")
 * @param {string} job - The job subType (e.g. "Sage", "Warrior")
 * @returns {boolean} true if the buff/ability matches a known job action, false otherwise
 */
export function isJobAbility(buffName, job) {
  if (!buffName || !job) return false;

  const jobConfig = loadJobConfig(job);
  if (!jobConfig || !jobConfig.actions) return false;

  const normalizedBuff = buffName.trim().toLowerCase();

  // 🔎 Direct match against action names
  const isDirectMatch = Object.keys(jobConfig.actions).some(
    (actionName) => actionName.trim().toLowerCase() === normalizedBuff
  );

  if (isDirectMatch) {
    // Ensure table contains direct mapping
    if (!buffToAbilityMap.has(normalizedBuff)) {
      buffToAbilityMap.set(normalizedBuff, buffName);
    }
  }
  // 🔎 Check hardcoded lookup table
  else if (HARDCODED_BUFF_TO_ABILITY[normalizedBuff]) {
    const mappedAbility = HARDCODED_BUFF_TO_ABILITY[normalizedBuff];
    buffToAbilityMap.set(normalizedBuff, mappedAbility);
    return true;
  } else {
    // 🌀 Trigger background lookup to build buffToAbilityMap
    spawnBuffLookup(normalizedBuff, buffName, job, jobConfig);
  }

  return isDirectMatch;
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

/**
 * Purpose:
 *   Asynchronously attempt to resolve a buff name into its originating
 *   ability/action by inspecting the "effects" field of a job’s abilities.
 *
 * Why:
 *   Some buffs applied in combat are not directly listed as ability names,
 *   but instead appear as side-effects of other abilities (e.g. "Stem the Flow"
 *   from "Bloodwhetting"). This process builds a lookup table that can later
 *   be used in the UI layer to associate buff names with their true sources.
 *
 * Behavior:
 *   - Normalizes the buff name for case-insensitive matching.
 *   - If no entry exists in the lookup table, marks it as "__PENDING__".
 *   - Runs asynchronously (non-blocking) through the job’s actions:
 *       • If an action’s `effects` contains the buff text, store that action’s name.
 *       • If no match is found, store `null`.
 *   - Logs all findings, including the updated lookup table.
 *
 * Notes:
 *   - This does NOT affect the return value of isJobAbility.
 *   - Multiple quick lookups for the same buff are safe:
 *     "__PENDING__" prevents duplicate searches until resolved.
 *
 * @param {string} normalizedBuff - Lowercased, trimmed buff string key
 * @param {string} buffName - Original buff name as seen in events
 * @param {string} job - The job subType (e.g. "Warrior", "Sage")
 * @param {Object} jobConfig - Job config object (with actions map)
 */
function spawnBuffLookup(normalizedBuff, buffName, job, jobConfig) {
  // Mark lookup as pending if not already tracked
  if (!buffToAbilityMap.has(normalizedBuff)) {
    buffToAbilityMap.set(normalizedBuff, "__PENDING__");
  }

  setTimeout(() => {
    let foundAction = null;

    for (const [actionName, action] of Object.entries(jobConfig.actions)) {
      if (Array.isArray(action.effects)) {
        const match = action.effects.find(
          (effect) => effect.toLowerCase().includes(normalizedBuff) // fuzzy match
        );
        if (match) {
          foundAction = actionName;
          break;
        }
      }
    }

    if (foundAction) {
      buffToAbilityMap.set(normalizedBuff, foundAction);
      log.info(
        `[BuffLookup] "${buffName}" resolved → ability "${foundAction}" (job: ${job})`
      );
    } else {
      buffToAbilityMap.set(normalizedBuff, null); // ✅ nothing found
      log.warn(
        `[BuffLookup] "${buffName}" could not be resolved for job ${job}`
      );
    }

    log.debug("[BuffLookup][Table]", Object.fromEntries(buffToAbilityMap));
  }, 0);
}

/**
 * Resolve a list of buff names into their originating abilities using buffToAbilityMap.
 *
 * Purpose:
 *   Provides a simplified "ability-only" view of buffs by collapsing
 *   secondary effect buffs into their parent abilities. This makes
 *   the FightTable easier to read for users who only care about which
 *   buttons were pressed, not every side effect.
 *
 * Behavior:
 *   - For each buff in the input list:
 *       • If buffToAbilityMap has an entry (and it’s not "__PENDING__" or null),
 *         replace the buff with the mapped ability name.
 *       • Otherwise, keep the buff as-is.
 *   - Deduplicates the final results to avoid showing both an ability
 *     and its converted effect buff (e.g. "Bloodwhetting" and "Stem the Flow").
 *
 * Example:
 *   Input: ["Bloodwhetting", "Stem the Flow"]
 *   Mapping: { "stem the flow" → "Bloodwhetting" }
 *   Output: ["Bloodwhetting"]
 *
 * @param {Array<string>} buffs - List of buff/ability names for a single cell
 * @returns {Array<string>} resolved - List of simplified ability names
 */
export function resolveBuffsToAbilities(buffs) {
  if (!buffs || buffs.length === 0) return [];

  const resolved = buffs.map((buff) => {
    const normalized = buff.trim().toLowerCase();
    const mapped = buffToAbilityMap.get(normalized);

    if (mapped && mapped !== "__PENDING__") {
      return mapped; // Replace with ability name
    }

    return buff; // Keep original if no mapping or still pending
  });

  // Deduplicate while preserving order
  return [...new Set(resolved)];
}

/**
 * Poll until all async buff lookups are completed.
 * Once no "__PENDING__" entries remain in buffToAbilityMap,
 * trigger a final re-render.
 *
 * @param {Function} rerenderFn - Function to call when lookups are complete (e.g., renderFight)
 * @param {number} intervalMs - How often to check (default 500ms)
 */
export function waitForBuffLookups(rerenderFn, intervalMs = 500) {
  const intervalId = setInterval(() => {
    const pending = Array.from(buffToAbilityMap.values()).some(
      (val) => val === "__PENDING__"
    );

    if (!pending) {
      clearInterval(intervalId);
      log.info(
        "[BuffLookup] All lookups complete. Triggering final re-render."
      );
      rerenderFn(); // 🔄 call back into UI layer
    }
  }, intervalMs);
}
