import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";
import mitigationData from "../config/mitigationDataset.js";
import { MUTUALLY_EXCLUSIVE_MITIGATIONS } from "../config/ignoredEntities.js";

setModuleLogLevel("JobConfigHelper", envLogLevel("info", "warn"));
const log = getLogger("JobConfigHelper");

const mitigationParentCache = { lookup: null };
const exclusiveMitigationCache = { abilityMap: null, jobMap: null };
const fightExclusiveSelectionCache = new Map();

/**
 * Retrieves the mitigation percentage for a given buff name across all jobs.
 *
 * This function performs a global search in the mitigation dataset to find
 * the buff’s mitigation value. It supports conditional lookups based on
 * damage type (e.g., physical vs. magical) and target job relation (self/ally).
 *
 * Lookup behavior:
 *  1. Search through all job datasets for a direct name match.
 *  2. If not found, also check each job’s alias table.
 *  3. If multiple variants exist (e.g., physical/magical or self/ally),
 *     the variant whose `condition` or target type matches the provided
 *     `damageType` or `targetJob` will be prioritized.
 *  4. If multiple entries exist but all share the same mitigation value,
 *     they are treated as equivalent and no conflict is logged.
 *
 * Logging:
 *   - Logs conflicts only when unique mitigation values differ.
 *   - Adds target relation context (`self` vs. `ally`).
 *
 * @param {string} buffName - The name or alias of the mitigation ability.
 * @param {("physical"|"magical"|null)} [damageType=null] - Optional hint for which condition to prefer.
 * @param {string|null} [targetJob=null] - Optional target's job name (used to differentiate self vs ally).
 * @returns {number|null} The mitigation percentage as a decimal (e.g., 0.15 for 15%), or null if not found.
 */
export function getMitigationPercent(
  buffName,
  damageType = null,
  targetJob = null
) {
  if (!buffName) return null;
  const normalized = buffName.trim().toLowerCase();
  const matches = [];

  // Search across all jobs
  for (const [jobName, jobBuffs] of Object.entries(
    mitigationData.mitigationEffects
  )) {
    for (const buff of jobBuffs) {
      if (buff.name.trim().toLowerCase() === normalized) {
        matches.push({ job: jobName, buff });
      }
    }

    // Search aliases
    const aliasMap = mitigationData.aliases[jobName] || {};
    for (const [alias, canonicalName] of Object.entries(aliasMap)) {
      if (alias.trim().toLowerCase() === normalized) {
        const targetBuff = jobBuffs.find((b) => b.name === canonicalName);
        if (targetBuff) {
          matches.push({ job: jobName, buff: targetBuff, alias });
        }
      }
    }
  }

  if (matches.length === 0) return null;

  // Deduplicate entries that share the same mitigation percentage
  const uniqueEntries = [];
  const seen = new Set();

  for (const m of matches) {
    const key = `${m.buff.name}|${m.buff.amount}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEntries.push(m);
    }
  }

  // Apply damageType filter early — only keep buffs matching the requested condition
  let filteredEntries = uniqueEntries;
  if (damageType) {
    const byCondition = uniqueEntries.filter((m) =>
      m.buff.condition?.toLowerCase().includes(damageType)
    );

    // If any conditional matches exist, prefer them and discard the rest
    if (byCondition.length > 0) {
      filteredEntries = byCondition;
    }
  }

  // Apply target relation filter — prefer self/ally variant if targetJob is known
  if (targetJob) {
    const byRelation = filteredEntries.filter((m) => {
      // Normalize job name to lower case for comparison
      const jobMatch =
        m.job.trim().toLowerCase() === targetJob.trim().toLowerCase();
      const target = m.buff.target?.toLowerCase();
      if (jobMatch && target === "self") return true; // self mitigation
      if (!jobMatch && target === "ally") return true; // ally mitigation
      return false;
    });

    if (byRelation.length > 0) {
      filteredEntries = byRelation;
    }
  }

  // Pick the first entry (after applying all filters)
  let chosen = filteredEntries[0];

  //️ Log remaining conflicts only if unique mitigation percentages differ
  const uniqueAmounts = new Set(filteredEntries.map((m) => m.buff.amount));
  if (uniqueAmounts.size > 1) {
    log.info(
      `=== Mitigation conflicts for "${buffName}" (damageType: ${
        damageType || "none"
      }, targetJob: ${targetJob || "unknown"}) ===`
    );
    for (const { job, buff, alias } of filteredEntries) {
      const aliasStr = alias ? ` (alias: ${alias})` : "";
      const relation =
        targetJob && job.trim().toLowerCase() === targetJob.trim().toLowerCase()
          ? "self"
          : "ally";
      const conditionStr = buff.condition
        ? ` (condition: ${buff.condition})`
        : "";
      const targetStr = buff.target ? ` to ${buff.target}` : "";
      log.info(
        `- ${job.toUpperCase()}${aliasStr}: ${buff.name} → ${
          buff.amount
        }%${targetStr}${conditionStr} [${relation}]`
      );
    }

    if (damageType && chosen) {
      log.info(
        `→ Selected variant for "${damageType}" damage: ${chosen.job}/${chosen.buff.name}`
      );
    }
  }

  // Return the mitigation value as a decimal (rounded to two decimal places)
  if (!chosen?.buff?.amount) return null;

  const mitValue = chosen.buff.amount / 100;

  // Fix floating-point precision by rounding to 0.01
  return Math.round(mitValue * 100) / 100;
}

/**
 * Build (and cache) a Map of normalized job name → mitigation ability map.
 *
 * Purpose:
 *   Mitigation entries in the dataset often contain duplicate rows for the same ability
 *   (e.g., separate physical/magical conditions, self vs. ally targets). Downstream code
 *   only needs to know which *abilities* count as mitigation for a given job. This helper
 *   compacts the dataset into a simple lookup keyed by job, with each value containing the
 *   unique parent ability identifiers for that job.
 *
 * Behavior:
 *   1. Normalizes job names by stripping punctuation and lowercasing so variants like
 *      "DarkKnight", "Dark Knight", and "dark_knight" map to the same key.
 *   2. Normalizes ability names by trimming and lowercasing to ensure case-insensitive matches.
 *   3. Deduplicates parent abilities per job, even if multiple dataset rows reference them.
 *   4. Caches the result (per-process) to avoid repeatedly traversing the large dataset.
 *
 * Cache:
 *   The lookup is stored in `mitigationParentCache.lookup`; subsequent calls return the cached
 *   value. If the mitigation dataset is ever updated at runtime, callers should clear that cache
 *   manually (`mitigationParentCache.lookup = null`) before invoking this helper again.
 *
 * Example result:
 *   Map {
 *     "paladin" => Map {
 *       "divineveil" -> "Divine Veil",
 *       "passageofarms" -> "Passage of Arms",
 *       ...
 *     },
 *     "sage"    => Map {
 *       "kerachole" -> "Kerachole",
 *       "holos"     -> "Holos",
 *       ...
 *     }
 *   }
 *
 * @returns {Map<string, Map<string, string>>} Cached mapping of job → mitigation ability map.
 */
export function getMitigationParentLookup() {
  if (mitigationParentCache.lookup) {
    return mitigationParentCache.lookup;
  }

  const lookup = new Map();
  const effects = mitigationData?.mitigationEffects || {};

  for (const [jobKey, entries] of Object.entries(effects)) {
    const normalizedJob = normalizeJobName(jobKey);
    if (!normalizedJob || !Array.isArray(entries)) continue;

    if (!lookup.has(normalizedJob)) {
      lookup.set(normalizedJob, new Map());
    }
    const abilityMap = lookup.get(normalizedJob);

    entries.forEach((entry) => {
      const rawAbility = entry?.parent_ability || entry?.name || null;
      if (!rawAbility) return;

      const normalizedAbility = normalizeAbilityName(rawAbility);
      if (!normalizedAbility) return;

      if (!abilityMap.has(normalizedAbility)) {
        abilityMap.set(normalizedAbility, rawAbility);
      }
    });
  }

  mitigationParentCache.lookup = lookup;
  return lookup;
}

/**
 * Build (and cache) lookup tables describing mutually exclusive mitigation groups.
 *
 * @returns {{abilityMap: Map<string, Object>, jobMap: Map<string, Map<string, Object>>}}
 *   abilityMap: normalized ability name → group descriptor
 *   jobMap: normalized job name → Map<groupId, descriptor>
 */
function buildExclusiveMitigationLookups() {
  if (exclusiveMitigationCache.abilityMap && exclusiveMitigationCache.jobMap) {
    return exclusiveMitigationCache;
  }

  const abilityMap = new Map();
  const jobMap = new Map();

  MUTUALLY_EXCLUSIVE_MITIGATIONS.forEach((group, index) => {
    if (!group || !Array.isArray(group.abilities) || group.abilities.length < 2) {
      return;
    }

    const normalizedJob = normalizeJobName(group.job);
    if (!normalizedJob) return;

    const normalizedAbilities = group.abilities
      .map((ability) => ({
        original: ability,
        normalized: normalizeAbilityName(ability),
      }))
      .filter((entry) => entry.original && entry.normalized);

    if (normalizedAbilities.length < 2) return;

    const groupId =
      group.groupId ||
      `${normalizedJob}::${normalizedAbilities
        .map((entry) => entry.normalized)
        .join("|") ||
        index}`;

    const descriptor = {
      groupId,
      job: group.job,
      normalizedJob,
      abilityNames: normalizedAbilities.map((entry) => entry.original),
      normalizedAbilities: normalizedAbilities.map((entry) => entry.normalized),
    };

    if (!jobMap.has(normalizedJob)) {
      jobMap.set(normalizedJob, new Map());
    }
    jobMap.get(normalizedJob).set(groupId, descriptor);

    descriptor.normalizedAbilities.forEach((normalizedAbility) => {
      abilityMap.set(normalizedAbility, descriptor);
    });
  });

  exclusiveMitigationCache.abilityMap = abilityMap;
  exclusiveMitigationCache.jobMap = jobMap;
  return exclusiveMitigationCache;
}

/**
 * Register fight-scoped mutually exclusive mitigation selections so repeated
 * calls to `getMitigationAbilityNames` can reuse the cached choices.
 *
 * @param {number|string|null} fightId - Fight identifier used for the cache key.
 * @param {Map<string, {abilityName: string, normalizedAbility: string}>} selections
 */
export function registerExclusiveMitigationSelections(fightId, selections) {
  if (fightId == null || !(selections instanceof Map)) return;
  const cacheKey = String(fightId);
  fightExclusiveSelectionCache.set(cacheKey, new Map(selections));
}

/**
 * Retrieve the cached mutually exclusive mitigation selections for a fight.
 *
 * @param {number|string|null} fightId - Fight identifier used for the cache key.
 * @returns {Map<string, {abilityName: string, normalizedAbility: string}>|null}
 */
export function getExclusiveMitigationSelections(fightId) {
  if (fightId == null) return null;
  const cacheKey = String(fightId);
  return fightExclusiveSelectionCache.get(cacheKey) || null;
}

/**
 * Remove cached mutually exclusive mitigation selections.
 *
 * @param {number|string|null} [fightId=null] - When omitted, clears the entire cache.
 */
export function clearExclusiveMitigationSelections(fightId = null) {
  if (fightId == null) {
    fightExclusiveSelectionCache.clear();
    return;
  }

  const cacheKey = String(fightId);
  fightExclusiveSelectionCache.delete(cacheKey);
}

/**
 * Resolve mutually exclusive mitigation metadata for a specific ability name.
 *
 * @param {string} abilityName - Ability to inspect.
 * @returns {{groupId: string, job: string, normalizedJob: string, abilityNames: string[], normalizedAbilities: string[]}|null}
 */
export function getExclusiveMitigationGroupByAbility(abilityName) {
  if (!abilityName) return null;
  const normalizedAbility = normalizeAbilityName(abilityName);
  if (!normalizedAbility) return null;
  const { abilityMap } = buildExclusiveMitigationLookups();
  return abilityMap.get(normalizedAbility) || null;
}

/**
 * Retrieve the list of mitigation ability names associated with a job.
 *
 * This helper builds on top of `getMitigationParentLookup`, returning the
 * normalized set of parent ability names for the requested job while keeping
 * the original casing as stored in the mitigation dataset.
 *
 * Typical usage:
 *   const abilities = getMitigationAbilityNames("Dark Knight");
 *   → ["Shadow Wall", "Dark Mind", "Rampart", ...]
 *
 * Notes:
 *   - Falls back to the job’s normalized key (whitespace, punctuation removed).
 *   - Returns an empty array if the job is unknown or has no mitigation entries.
 *   - The returned array preserves the insertion order from the dataset, which
 *     groups related abilities together.
 *   - When `options.exclusiveAbilityMap` or `options.fightId` is provided, only
 *     the selected mutually exclusive abilities for that fight are returned.
 *
 * @param {string} jobName - Job/subType string (e.g. "Dark Knight", "Scholar")
 * @param {Object} [options]
 * @param {Map<string, {abilityName: string}>} [options.exclusiveAbilityMap] - Fight-scoped overrides keyed by groupId.
 * @param {number|string|null} [options.fightId=null] - Fight identifier used to read the shared selection cache.
 * @returns {Array<string>} Ordered list of unique mitigation ability names.
 */
export function getMitigationAbilityNames(jobName, options = {}) {
  if (!jobName) return [];

  const normalizedJob = normalizeJobName(jobName);
  if (!normalizedJob) return [];

  const lookup = getMitigationParentLookup();
  if (!lookup.has(normalizedJob)) return [];

  const abilityMap = lookup.get(normalizedJob);
  const { abilityMap: exclusiveAbilityLookup } = buildExclusiveMitigationLookups();

  const selectionFromCache =
    options?.fightId != null
      ? getExclusiveMitigationSelections(options.fightId)
      : null;
  const selectionMap =
    options?.exclusiveAbilityMap instanceof Map
      ? options.exclusiveAbilityMap
      : selectionFromCache instanceof Map
      ? selectionFromCache
      : null;

  const seenExclusiveGroups = new Set();
  const abilities = [];

  for (const ability of abilityMap.values()) {
    const normalizedAbility = normalizeAbilityName(ability);
    const exclusiveDescriptor =
      exclusiveAbilityLookup?.get(normalizedAbility) || null;

    if (
      exclusiveDescriptor &&
      exclusiveDescriptor.normalizedJob === normalizedJob
    ) {
      const { groupId } = exclusiveDescriptor;
      if (seenExclusiveGroups.has(groupId)) {
        continue;
      }
      seenExclusiveGroups.add(groupId);

      const selection =
        selectionMap?.get(groupId)?.abilityName || ability;
      abilities.push(selection);
      continue;
    }

    abilities.push(ability);
  }

  return abilities;
}

/**
 * Normalize an ability name for case-insensitive comparisons.
 *
 * Trims whitespace and lowercases the result so mitigation lookups
 * can match reliably regardless of FFLogs naming quirks.
 *
 * @param {string} name - Ability name from FFLogs or configuration.
 * @returns {string} Normalized ability identifier.
 */
export function normalizeAbilityName(name) {
  if (!name) return "";
  return String(name).trim().toLowerCase();
}

/**
 * Normalize a job name for dataset lookups.
 *
 * Removes spaces, punctuation, and casing differences so job keys like
 * "Dark Knight", "dark_knight", and "DarkKnight" resolve to the same
 * canonical form used in datasets.
 *
 * @param {string} job - Job/subType string from FFLogs actors.
 * @returns {string} Normalized job identifier.
 */
export function normalizeJobName(job) {
  if (!job) return "";
  return String(job)
    .replace(/[\s'_-]/g, "")
    .toLowerCase();
}

/**
 * Build a lookup map keyed by actor name for quick job/subType resolution.
 *
 * Supports any data shape emitted by `parseReport` and related helpers:
 *   - Map<int, Actor>
 *   - Array<Actor>
 *   - Plain object keyed by actor IDs
 *
 * Each actor entry is expected to include at least `{ name, subType }`.
 * Actors missing a name are skipped to avoid ambiguous lookups.
 *
 * @param {Map|Array|Object|null} actorById - Actor collection from FFLogs parsing.
 * @returns {Map<string, Object>} Map keyed by the actor’s display name.
 */
export function buildActorNameMap(actorById) {
  const map = new Map();
  if (!actorById) return map;

  const addActor = (actor) => {
    if (actor && actor.name) {
      map.set(actor.name, actor);
    }
  };

  if (actorById instanceof Map) {
    actorById.forEach(addActor);
  } else if (Array.isArray(actorById)) {
    actorById.forEach(addActor);
  } else if (typeof actorById === "object") {
    Object.values(actorById).forEach(addActor);
  }

  return map;
}
