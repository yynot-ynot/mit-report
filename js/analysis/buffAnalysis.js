import { getMitigationPercent } from "../utility/jobConfigHelper.js";

/**
 * buffAnalysis.js
 *
 * Utility functions to determine if a given ability/buff belongs
 * to the specified job, using the job configs in AppConfig,
 * and to handle special crediting logic for buffs in the FightTable.
 */

import { loadJobConfig } from "../config/AppConfig.js";
import { KNOWN_BUFF_JOBS, getKnownBuffJob } from "../config/knownBuffJobs.js";
import linkedAbilities from "../config/linkedAbilities.js";
import { formatRelativeTime } from "../utility/dataUtils.js";
import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";

setModuleLogLevel("BuffAnalysis", envLogLevel("warn", "warn"));
const log = getLogger("BuffAnalysis");

// 🔒 Hardcoded Buff → Ability overrides
const HARDCODED_BUFF_TO_ABILITY = {
  "blackest night": "The Blackest Night",
  intersection: "Celestial Intersection",
  "undead rebirth": "Living Dead",
  holosakos: "Holos",
};

/**
 * BuffAnalysis
 * ------------
 * Encapsulates per-fight buff/vulnerability resolution.
 * Each fight gets its own instance (no cross-fight contamination).
 */
export class BuffAnalysis {
  constructor() {
    this.buffToAbilityMap = new Map();
    this.vulnToAbilityMap = new Map();
  }

  /**
   * Setter to update the vulnerability map from buffTracker.
   *
   * @param {Map} newMap - Map of vulnerabilityName(lowercased) → originalName
   */
  setVulnerabilityMap(newMap) {
    this.vulnToAbilityMap = newMap;
    log.info(
      `[VulnerabilityMap] Updated with ${this.vulnToAbilityMap.size} entries`,
      Object.fromEntries(this.vulnToAbilityMap)
    );
  }

  /**
   * Check if a given name is a known vulnerability.
   *
   * Purpose:
   *   Provides a quick lookup to verify whether a debuff name should
   *   be treated as a vulnerability tracked in the FightTable.
   *
   * @param {string} vulnName - The vulnerability name to check
   * @returns {boolean} true if recognized as a vulnerability, false otherwise
   */
  isVulnerability(vulnName) {
    if (!vulnName) return false;
    return this.vulnToAbilityMap.has(vulnName.trim().toLowerCase());
  }

  /**
   * Getter to retrieve the current vulnerability map.
   *
   * @returns {Map} vulnToAbilityMap
   */
  getVulnerabilityMap() {
    return this.vulnToAbilityMap;
  }

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
  isJobAbility(buffName, job) {
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
      if (!this.buffToAbilityMap.has(normalizedBuff)) {
        this.buffToAbilityMap.set(normalizedBuff, buffName);
      }
    }
    // 🔎 Check hardcoded lookup table
    else if (HARDCODED_BUFF_TO_ABILITY[normalizedBuff]) {
      const mappedAbility = HARDCODED_BUFF_TO_ABILITY[normalizedBuff];
      this.buffToAbilityMap.set(normalizedBuff, mappedAbility);
      return true;
    } else {
      // 🌀 Trigger background lookup to build buffToAbilityMap
      this.spawnBuffLookup(normalizedBuff, buffName, job, jobConfig);
    }

    return isDirectMatch;
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
  spawnBuffLookup(normalizedBuff, buffName, job, jobConfig) {
    // Skip lookup if this is actually a vulnerability
    if (this.isVulnerability(buffName)) {
      log.info(
        `[BuffLookup] Skipping lookup for vulnerability "${buffName}" (job=${job})`
      );
      return;
    }

    // Mark lookup as pending if not already tracked
    if (!this.buffToAbilityMap.has(normalizedBuff)) {
      this.buffToAbilityMap.set(normalizedBuff, "__PENDING__");
    }

    setTimeout(() => {
      let foundAction = null;

      // 1️⃣ Check knownBuffJobs first (direct mapping)
      const knownJobs = getKnownBuffJob(buffName);
      if (knownJobs && Array.isArray(knownJobs) && knownJobs.length > 0) {
        // If the current job matches any of the known jobs (case-insensitive)
        const jobMatch = knownJobs.some(
          (j) => j.trim().toLowerCase() === job.trim().toLowerCase()
        );
        if (jobMatch) {
          foundAction = buffName; // Directly map buff to itself (known for this job)
          log.debug(
            `[BuffLookup] Direct match via knownBuffJobs: buff="${buffName}" → job=${job}`
          );
        }
      }

      // 2️⃣ Fallback: Fuzzy search through jobConfig if not found above
      if (!foundAction) {
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
      }

      if (foundAction) {
        this.buffToAbilityMap.set(normalizedBuff, foundAction);
        log.debug(
          `[BuffLookup] Fuzzy match: buff="${buffName}" matched effect → action="${foundAction}" (job=${job})`
        );
      } else {
        this.buffToAbilityMap.set(normalizedBuff, null); // nothing found
        log.warn(
          `[BuffLookup] "${buffName}" could not be resolved for job ${job}`
        );
      }

      log.debug(
        "[BuffLookup][Table]",
        Object.fromEntries(this.buffToAbilityMap)
      );
    }, 0);
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
   * Updated Behavior:
   *   - Instead of crediting *all* friendly players, the buff is attributed
   *     directly to the damage target (`row.actor`).
   *   - This avoids inflated attributions and keeps mitigation credit aligned
   *     with the player who actually benefited from the buff.
   *
   * Behavior:
   *   - Iterates through all rows and buffs.
   *   - If a buff has no valid appliers, credits the targeted player instead.
   *   - Logs a warning to indicate fallback attribution was required.
   *
   * Tradeoff:
   *   - Prevents empty buff columns without over-crediting.
   *   - However, if the true applier differs from the target, the buff may
   *     still be misattributed (better than "credit everyone").
   *
   * @param {Object} table - The FightTable being built
   * @param {Map} actorById - Map of actorID → actor metadata
   * @param {Object} fight - Fight metadata (for logging)
   */
  resolveMissingBuffSources(table, actorById, fight, report = null) {
    for (const row of table.rows) {
      for (const [buffName, appliers] of Object.entries(row.buffs)) {
        const hasValidApplier =
          appliers.length > 0 &&
          !appliers.some((a) => !a || a.startsWith("Unknown"));

        if (hasValidApplier) continue;

        if (!this.isVulnerability(buffName)) {
          const knownJobs = getKnownBuffJob(buffName);

          if (
            buffName.trim().toLowerCase() === "stem the tide" &&
            row.actor === "Artemis Greyheart"
          ) {
            const normalizedKey = buffName.trim().toLowerCase();
            const keysNearby = Object.keys(KNOWN_BUFF_JOBS)
              .filter((k) => k.includes("stem") || k.includes("flow"))
              .slice(0, 10); // context of similar keys
          }

          // Try heuristic attribution by job
          if (knownJobs && Array.isArray(knownJobs) && knownJobs.length > 0) {
            let foundPlayer = null;

            // Loop over known jobs → pick the first matching actor
            for (const job of knownJobs) {
              for (const [_, actor] of actorById.entries()) {
                if (
                  actor?.subType &&
                  actor.subType.trim().toLowerCase() ===
                    job.trim().toLowerCase()
                ) {
                  foundPlayer = actor.name;
                  break;
                }
              }
              if (foundPlayer) break;
            }

            if (foundPlayer) {
              row.buffs[buffName] = [foundPlayer];
              log.info(
                `Fight ${fight.id}, ts=${formatRelativeTime(
                  row.timestamp + fight.startTime,
                  fight.startTime
                )}: Buff "${buffName}" had no valid source → heuristically attributed to "${foundPlayer}" (job=${
                  knownJobs[0]
                })`
              );

              // TODO: This attribution is a heuristic guess based on job match.
              // TODO: We need to consult the cast table in the future for confirmation.
              continue;
            }
          }

          if (
            buffName.trim().toLowerCase() === "stem the tide" &&
            row.actor === "Artemis Greyheart"
          ) {
            const actorJobs = Array.from(actorById.values()).map(
              (a) => `${a.name}:${a.subType}`
            );
            log.info(
              `[Debug][StemTheTide] No actor match found — checked jobs ${JSON.stringify(
                knownJobs
              )} against actors ${JSON.stringify(actorJobs)}`
            );
          }

          // ⚠️ Fallback: credit damage target
          log.warn(
            `Fight ${fight.id}, ts=${formatRelativeTime(
              row.timestamp + fight.startTime,
              fight.startTime
            )}: Buff "${buffName}" still unresolved → crediting target "${
              row.actor
            }"`
          );
        }

        row.buffs[buffName] = [row.actor];
      }
    }
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
   * Enhanced Behavior (with linkedAbilities):
   *   - For each buff in the input list:
   *       • If buffToAbilityMap has an entry (and it’s not "__PENDING__" or null),
   *         treat that as the "candidate mapped ability".
   *       • Then check linkedAbilities.json for other abilities that are
   *         considered equivalent or alternative sources.
   *       • If any of those linked abilities are directly present in the
   *         input buff list, prefer that one instead of the fuzzy match.
   *         (This avoids wrongly attributing a buff to the wrong skill
   *         when multiple valid sources exist.)
   *       • Otherwise, fallback to the candidate mapped ability.
   *   - If no mapping exists, keep the buff unchanged.
   *   - Deduplicates the final results to avoid showing both an ability
   *     and its converted effect buff.
   *
   * Example:
   *   Input Buffs: ["Nascent Flash", "Stem the Flow"]
   *   Mapping: { "stem the flow" → "Raw Intuition" }
   *   Linked: { "Raw Intuition" ↔ "Nascent Flash" }
   *   Resolution:
   *     - "Stem the Flow" fuzzily maps to "Raw Intuition".
   *     - But since "Nascent Flash" is in the buff list and is linked,
   *       we prefer "Nascent Flash".
   *   Output: ["Nascent Flash"]
   *
   * @param {Array<string>} buffs - List of buff/ability names for a single cell
   * @returns {Array<string>} resolved - List of simplified ability names
   */
  resolveBuffsToAbilities(buffs) {
    if (!Array.isArray(buffs) || buffs.length === 0) return [];

    // 3) Resolve each buff with linked-ability disambiguation
    const resolved = buffs.map((buff) => {
      const normalized = buff.trim().toLowerCase();
      const mapped = this.buffToAbilityMap.get(normalized);

      // Pending → keep as-is and log once
      if (mapped === "__PENDING__") {
        log.debug(
          `[BuffResolve] Outcome buff="${buff}" → pending; keep as "${buff}"`
        );
        return buff;
      }

      // Have a candidate (from direct/hardcoded/fuzzy) → try linked disambiguation
      if (mapped) {
        // Build the set of all linked abilities reachable from the candidate
        const linkedSet = new Set();
        const stack = [mapped];
        while (stack.length) {
          const ability = stack.pop();
          if (!ability || linkedSet.has(ability)) continue;
          linkedSet.add(ability);

          const linked = linkedAbilities[ability];
          if (Array.isArray(linked)) {
            linked.forEach((la) => {
              if (!linkedSet.has(la)) stack.push(la);
            });
          } else if (linked && !linkedSet.has(linked)) {
            stack.push(linked);
          }
        }

        // Prefer a linked ability that already appears in this input list
        const preferredLinked = buffs.find((b) => linkedSet.has(b));
        if (preferredLinked) {
          log.debug(
            `[BuffResolve] Outcome buff="${buff}" → candidate="${mapped}" → chosen linked="${preferredLinked}"`
          );

          return preferredLinked;
        }

        // Otherwise fall back to the candidate mapped ability
        log.debug(
          `[BuffResolve] Outcome buff="${buff}" → candidate="${mapped}" → chosen candidate`
        );
        return mapped;
      }

      // No mapping known (null / unset) → keep original buff
      log.debug(
        `[BuffResolve] Outcome buff="${buff}" → no mapping; keep as "${buff}"`
      );
      return buff;
    });

    // 4) Deduplicate while preserving order (avoid showing both effect + ability)
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
  waitForBuffLookups(rerenderFn, intervalMs = 500) {
    const intervalId = setInterval(() => {
      const pending = Array.from(this.buffToAbilityMap.values()).some(
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
}

/**
 * getPotentiallyBotchedBuffs()
 * --------------------------------------------------------------
 * Determine which buffs are “potentially botched” by comparing the
 * buff list on a final `damage` packet to the buff list on its paired
 * `calculateddamage` packet.
 *
 * A buff is flagged as potentially botched when it appears on the `damage`
 * packet but is missing from the `calculateddamage` packet.
 *
 * Behavior:
 *   - Case-insensitive comparison.
 *   - Preserves the original casing from the damage packet in the output.
 *   - Deduplicates results to avoid double-listing the same buff.
 *   - Ignores non-string entries safely.
 *
 * @param {string[]} damageBuffs - Buff names parsed from the `damage` packet.
 * @param {string[]} calculatedBuffs - Buff names parsed from the paired `calculateddamage` packet.
 * @returns {string[]} Buff names that should be considered potentially botched.
 */
export function getPotentiallyBotchedBuffs(
  damageBuffs = [],
  calculatedBuffs = []
) {
  if (!Array.isArray(damageBuffs) || damageBuffs.length === 0) return [];

  const calcSet = new Set(
    (Array.isArray(calculatedBuffs) ? calculatedBuffs : []).map((name) =>
      typeof name === "string" ? name.toLowerCase() : ""
    )
  );

  const seen = new Set();
  const result = [];

  for (const buff of damageBuffs) {
    if (typeof buff !== "string") continue;

    const key = buff.toLowerCase();
    if (seen.has(key)) continue; // prevent duplicates
    seen.add(key);

    if (!calcSet.has(key)) {
      result.push(buff);
    }
  }

  return result;
}

/**
 * shouldStrikeBotchedMitigation()
 * --------------------------------------------------------------
 * Decide whether botched-mitigation styling should be applied based on
 * mitigation percentages and the UI toggle.
 *
 * A row qualifies when:
 *   1) The “Show Botched Mitigations” filter is enabled, and
 *   2) intendedMitPct > mitigationPct (actual).
 *
 * @param {Object} data - Source of mitigation numbers.
 * @param {number} data.mitigationPct - Actual mitigation percent.
 * @param {number} data.intendedMitPct - Intended mitigation percent.
 * @param {Object} filterState - Global filter state (expects showBotchedMitigations).
 * @returns {boolean} true if botched styling should be shown.
 */
export function shouldStrikeBotchedMitigation(data = {}, filterState) {
  if (!filterState?.showBotchedMitigations) return false;
  const { mitigationPct, intendedMitPct } = data;
  if (typeof mitigationPct !== "number" || typeof intendedMitPct !== "number") {
    return false;
  }
  return intendedMitPct > mitigationPct;
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
 * Compute the combined mitigation percentage from multiple buffs.
 *
 * Formula:
 *   totalMit = 1 - ∏(1 - aᵢ)
 *
 * Example:
 *   Buffs: ["Rampart", "Reprisal"]
 *   Rampart = 0.20 (20%), Reprisal = 0.10 (10%)
 *   Result = 1 - (1 - 0.20) * (1 - 0.10) = 0.28 (28%)
 *
 * Notes:
 *   - Works globally (no jobName needed).
 *   - Accepts optional `damageType` ("physical" | "magical") and `targetJob`.
 *     This allows the function to choose the correct conditional and relational
 *     mitigation variant (e.g. Feint for physical vs Addle for magical, or
 *     self vs ally like “Knight’s Resolve”).
 *   - Any buff not found in the config will be ignored (treated as 0%).
 *   - Returns a decimal fraction rounded to 0.01 (e.g. 0.28 for 28% total mitigation).
 *   - Logs any missing or unknown buffs for transparency.
 *
 * @param {Array<string>} buffNames - List of buff or ability names.
 * @param {("physical"|"magical"|null)} [damageType=null] - Optional type of incoming damage.
 * @param {string|null} [targetJob=null] - Optional target's job name (used for self vs ally mitigation).
 * @returns {number} Combined mitigation as a decimal (0–1 range).
 */
export function calculateTotalMitigation(
  buffNames,
  damageType = null,
  targetJob = null
) {
  if (!Array.isArray(buffNames) || buffNames.length === 0) return 0;

  const missingBuffs = [];
  const mitigations = [];

  for (const buff of buffNames) {
    // Pass both damageType and targetJob for correct lookup variant
    const mit = getMitigationPercent(buff, damageType, targetJob);
    if (typeof mit === "number" && mit > 0) {
      mitigations.push(mit);
    } else {
      missingBuffs.push(buff);
    }
  }

  if (missingBuffs.length > 0) {
    log.info(
      `[MitigationCalc] Ignoring unknown or 0% buffs: ${missingBuffs.join(
        ", "
      )}`
    );
  }

  if (mitigations.length === 0) return 0;

  // Compute multiplicative stacking: 1 - ∏(1 - aᵢ)
  const totalMitigation =
    1 - mitigations.reduce((prod, a) => prod * (1 - a), 1);

  // Round to two decimal places (e.g. 0.2847 → 0.28)
  return Math.round(totalMitigation * 100) / 100;
}
