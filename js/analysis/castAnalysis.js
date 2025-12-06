import { loadJobConfig } from "../config/AppConfig.js";
import {
  buildActorNameMap,
  getMitigationAbilityNames,
  getExclusiveMitigationGroupByAbility,
  registerExclusiveMitigationSelections,
  getMitigationParentLookup,
  normalizeAbilityName,
  normalizeJobName,
} from "../utility/jobConfigHelper.js";
import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";
import { formatRelativeTime } from "../utility/dataUtils.js";
import { AUTO_ATTACK_NAMES } from "../config/AppConfig.js";
import { COOLDOWN_DEPENDENCY_MAP } from "../config/cooldownDependencyMap.js";
import * as CooldownHandlers from "../analysis/customCooldownHandlers.js";

setModuleLogLevel("CastAnalysis", envLogLevel("info", "warn"));
const log = getLogger("CastAnalysis");

/**
 * insertAutoAttacksIntoCasts()
 * --------------------------------------------------------------
 * Merges all detected *calculated damage* auto-attack events from parsed
 * damage data into the parsed cast timeline, ensuring they appear in
 * chronological order alongside standard ability casts.
 *
 * 💡 Behavior:
 *   - Filters to only include entries with `type === "calculateddamage"`.
 *   - Identifies auto-attacks using `AUTO_ATTACK_NAMES` from AppConfig.
 *   - Converts each matching event into a cast-like object with fields:
 *       {
 *         rawTimestamp: <timestamp>,
 *         relative: <relative time>,
 *         source: <attacker name>,
 *         target: <target name>,
 *         ability: <auto-attack name>,
 *         abilityGameID: <original ability ID>,
 *         type: "autoattack"
 *       }
 *   - Merges and sorts the final timeline by `relative` time, ensuring
 *     temporal accuracy with the rest of the cast events.
 *
 * 🧠 Purpose:
 *   Ensures auto-attacks that appear as *calculated damage* entries in FFLogs
 *   are fully represented in the cast timeline. This synchronization is
 *   essential for downstream analyses, such as Paladin Oath gauge generation,
 *   rotation validation, and GCD clipping analysis.
 *
 * @param {Array<Object>} parsedDamageDone - Parsed outgoing damage events (includes type).
 * @param {Array<Object>} parsedCasts - Parsed cast timeline (mutated in-place).
 * @returns {Array<Object>} The combined and sorted cast timeline.
 */
export function insertAutoAttacksIntoCasts(parsedDamageDone, parsedCasts) {
  if (!Array.isArray(parsedDamageDone) || parsedDamageDone.length === 0) {
    log.debug(
      "[CastAnalysis] No damage-done events available for auto-attack merge."
    );
    return parsedCasts;
  }

  if (!Array.isArray(parsedCasts)) {
    log.warn(
      "[CastAnalysis] parsedCasts is not an array; initializing new one."
    );
    parsedCasts = [];
  }

  // Normalize all auto attack names for case-insensitive comparison
  const normalizedAutoNames = new Set(
    Array.from(AUTO_ATTACK_NAMES || []).map((n) => n.toLowerCase())
  );

  // Extract auto-attacks that are calculated damage only
  const autoAttackEntries = parsedDamageDone
    .filter(
      (ev) =>
        ev.type === "calculateddamage" && // restrict to calculateddamage events only
        ev.ability &&
        normalizedAutoNames.has(ev.ability.toLowerCase()) &&
        ev.source &&
        Number.isFinite(ev.relative)
    )
    .map((ev) => ({
      rawTimestamp: ev.rawTimestamp,
      relative: ev.relative,
      source: ev.source,
      target: ev.target,
      ability: ev.ability,
      abilityGameID: ev.abilityGameID ?? null,
      type: "autoattack",
    }));

  if (autoAttackEntries.length === 0) {
    log.debug(
      "[CastAnalysis] No calculated-damage auto-attack entries found in parsed damage data."
    );
    return parsedCasts;
  }

  // Merge and re-sort the combined timeline
  const mergedTimeline = [...parsedCasts, ...autoAttackEntries].sort(
    (a, b) => a.relative - b.relative || a.source.localeCompare(b.source)
  );

  log.info(
    `[CastAnalysis] Inserted ${autoAttackEntries.length} calculated-damage auto-attack events into cast timeline.`
  );
  return mergedTimeline;
}

/**
 * buildMitigationCastLookup()
 * --------------------------------------------------------------
 * Creates a nested Map describing, for each player, the timestamps of
 * their mitigation ability casts. The lookup is keyed by the player's
 * display name, then by the normalized mitigation ability name, and
 * stores the relative timestamp (in ms) for each cast.
 *
 * This data powers UI affordances like mitigation header tooltips without
 * forcing the rendering layer to repeatedly scan the full cast timeline.
 *
 * @param {Array<Object>} parsedCasts - Flattened cast timeline for the fight.
 * @returns {Map<string, Map<string, number[]>>} Nested lookup map.
 */
export function buildMitigationCastLookup(parsedCasts = []) {
  const lookup = new Map();
  if (!Array.isArray(parsedCasts) || parsedCasts.length === 0) {
    return lookup;
  }

  for (const cast of parsedCasts) {
    const source = cast?.source;
    const abilityName = cast?.ability;
    if (!source || !abilityName) {
      continue;
    }

    const normalizedAbility = normalizeAbilityName(abilityName);
    if (!normalizedAbility) {
      continue;
    }

    const relativeTime = Number.isFinite(cast?.relative)
      ? cast.relative
      : Number.isFinite(cast?.rawTimestamp)
      ? cast.rawTimestamp
      : null;
    if (relativeTime == null) {
      continue;
    }

    if (!lookup.has(source)) {
      lookup.set(source, new Map());
    }

    const abilityMap = lookup.get(source);
    if (!abilityMap.has(normalizedAbility)) {
      abilityMap.set(normalizedAbility, []);
    }

    abilityMap.get(normalizedAbility).push(relativeTime);
  }

  lookup.forEach((abilityMap) => {
    abilityMap.forEach((times, abilityKey) => {
      if (Array.isArray(times)) {
        times.sort((a, b) => a - b);
      } else {
        abilityMap.set(abilityKey, []);
      }
    });
  });

  return lookup;
}

/**
 * CastCooldownTracker manages cooldown periods for a single ability belonging to a player.
 *
 * Primary use case:
 *   const tracker = new CastCooldownTracker('Shield Bash', 'Tank A', 'Paladin', 30000);
 *   tracker.addCooldown(10230, 11230);            // explicit start/end
 *   tracker.addCooldownWithDuration(20300, 4500); // start + duration
 *
 * Data contract:
 *   - abilityName (string): Required identifier for the ability.
 *   - sourcePlayer (string): Required actor name responsible for the ability.
 *   - jobName (string): Required job/subType for the caster.
 *   - baseCooldownMs (number): Required base recast in milliseconds.
 *   - cooldownWindows (array): Each entry must provide start & end timestamps.
 *     The tracker accepts either an explicit end time or a duration which is
 *     converted into the final end timestamp. Missing fields throw immediately.
 *
 * The class exposes helper methods to read or mutate the tracked data while
 * preserving invariants such as sorted cooldown windows and non-empty strings.
 */
export class CastCooldownTracker {
  constructor(abilityName, sourcePlayer, jobName, baseCooldownMs) {
    // Validate identifiers up front to avoid partially constructed trackers
    this._assertString(abilityName, "abilityName");
    this._assertString(sourcePlayer, "sourcePlayer");
    this._assertString(jobName, "jobName");
    this._assertNumber(baseCooldownMs, "baseCooldownMs");

    this._abilityName = abilityName;
    this._sourcePlayer = sourcePlayer;
    this._jobName = jobName;
    this._baseCooldownMs = baseCooldownMs;
    this._cooldownWindows = [];
  }

  static fromCooldowns(
    abilityName,
    sourcePlayer,
    jobName,
    baseCooldownMs,
    windows = []
  ) {
    const tracker = new CastCooldownTracker(
      abilityName,
      sourcePlayer,
      jobName,
      baseCooldownMs
    );
    tracker.setCooldownWindows(windows);
    return tracker;
  }

  getAbilityName() {
    return this._abilityName;
  }

  setAbilityName(value) {
    this._assertString(value, "abilityName");
    this._abilityName = value;
  }

  getSourcePlayer() {
    return this._sourcePlayer;
  }

  setSourcePlayer(value) {
    this._assertString(value, "sourcePlayer");
    this._sourcePlayer = value;
  }

  getJobName() {
    return this._jobName;
  }

  setJobName(value) {
    this._assertString(value, "jobName");
    this._jobName = value;
  }

  getBaseCooldownMs() {
    return this._baseCooldownMs;
  }

  setBaseCooldownMs(value) {
    this._assertNumber(value, "baseCooldownMs");
    this._baseCooldownMs = value;
  }

  getCooldownWindows() {
    return this._cooldownWindows.map((window) => ({ ...window }));
  }

  get player() {
    return this._sourcePlayer;
  }

  get ability() {
    return this._abilityName;
  }

  get cooldownWindows() {
    return this.getCooldownWindows();
  }

  setCooldownWindows(windows) {
    // Replace the current window list while reusing validation logic
    if (!Array.isArray(windows)) {
      throw new TypeError("cooldownWindows must be an array");
    }

    this._cooldownWindows = [];
    windows.forEach((window) => this.addCooldownWindow(window));
  }

  addCooldown(start, end) {
    // Directly add a fully specified cooldown window
    this._assertNumber(start, "start");
    this._assertNumber(end, "end");

    if (end <= start) {
      throw new RangeError("End time must be greater than start time");
    }

    this._cooldownWindows.push({ start, end });
    this._cooldownWindows.sort((a, b) => a.start - b.start);
  }

  addCooldownWithDuration(start, cooldownLength) {
    // Build a cooldown window using a duration instead of explicit end
    this._assertNumber(start, "start");
    this._assertNumber(cooldownLength, "cooldownLength");

    const end = start + cooldownLength;
    this.addCooldown(start, end);
  }

  addCooldownWindow(window) {
    // Accept flexible window inputs while enforcing required fields
    if (typeof window !== "object" || window === null) {
      throw new TypeError("Cooldown window must be an object");
    }

    const { start, end, cooldownLength } = window;

    if (end != null) {
      this.addCooldown(start, end);
    } else if (cooldownLength != null) {
      this.addCooldownWithDuration(start, cooldownLength);
    } else {
      throw new TypeError("Cooldown window must specify end or cooldownLength");
    }
  }

  _assertString(value, fieldName) {
    // Shared guard to ensure text identifiers stay meaningful
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new TypeError(`${fieldName} must be a non-empty string`);
    }
  }

  _assertNumber(value, fieldName) {
    // Shared guard to ensure numeric values remain valid
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new TypeError(`${fieldName} must be a valid number`);
    }
  }
}

/**
 * Resolve the base cooldown (in ms) for a job ability using job configs.
 *
 * @param {string} jobName
 * @param {string} abilityName
 * @returns {{cooldownMs: number, maxCharges: number|null}|null}
 */
function resolveAbilityCooldown(jobName, abilityName) {
  if (!jobName || !abilityName) return null;

  const jobConfig = loadJobConfig(jobName);
  if (!jobConfig || !jobConfig.actions) return null;

  const normalizedAbility = normalizeAbilityName(abilityName);

  for (const [actionName, action] of Object.entries(jobConfig.actions)) {
    if (normalizeAbilityName(actionName) !== normalizedAbility) continue;

    let recastValue = action?.recast ?? null;
    if (typeof recastValue === "string") {
      recastValue = Number.parseFloat(recastValue);
    }
    if (typeof recastValue !== "number" || !Number.isFinite(recastValue)) {
      return null;
    }

    const cooldownMs = Math.round(recastValue * 1000);
    if (!Number.isFinite(cooldownMs) || cooldownMs <= 0) {
      return null;
    }

    return {
      cooldownMs,
      maxCharges: action?.max_charges ?? null,
    };
  }

  return null;
}

/**
 * Build CastCooldownTracker instances keyed by ability/player pairs.
 *
 * The routine now supports two complementary workflows:
 *   1. Standard cast-driven cooldown tracking for every ability in the log.
 *   2. Death-driven Paladin Oath enforcement where resource locks can exist even
 *      when no mitigation cast has occurred yet (useful for pure-death timelines).
 *
 * Each pass through the timeline resolves the actor’s job, looks up the base
 * cooldown, dispatches any custom handlers (e.g., Paladin Oath, AST cards),
 * captures mutually exclusive mitigation usage, and finally lets the custom
 * handler module decide whether additional resource locks should be recorded.
 *
 * @param {Array<Object>} parsedCasts - Flattened cast timeline for a fight. Accepts any array-like input; non-arrays are coerced to `[]`.
 * @param {Array<Object>} damageEvents - Parsed damage events (reserved for future use).
 * @param {Array<Object>} parsedDeaths - Sorted list of death events (by `relative`). Paladin-specific logic is delegated to `customCooldownHandlers`.
 * @param {Object|null} fight - Fight metadata for context (used for fallback timestamps).
 * @param {Map<number, Object>|null} actorById - Actor lookup map (used to resolve jobs).
 * @param {Map<string, Object>|null} rowMap - Timestamp/actor row lookup (reserved for future use).
 * @param {Array<Object>|Map<string,Object>} [friendlyActors=[]] - Optional roster data used to prioritize actor/job resolution.
 * @returns {{
 *   trackers: Array<CastCooldownTracker>,
 *   exclusiveAbilityMap: Map<string, {abilityName: string, normalizedAbility: string}>
 * }} trackers + mutually exclusive ability selections for the fight.
 */
export function buildCooldownTrackers(
  parsedCasts = [],
  damageEvents = [],
  parsedDeaths = [],
  fight = null,
  actorById = null,
  rowMap = null,
  friendlyActors = []
) {
  // Step 0: Normalize inputs so that “death-only” scenarios still run through
  // the Paladin death sweep logic.
  const casts = Array.isArray(parsedCasts) ? parsedCasts : [];
  const deaths = Array.isArray(parsedDeaths) ? parsedDeaths : [];

  if (casts.length === 0 && deaths.length === 0) {
    const emptyMap = new Map();
    if (fight?.id != null) {
      registerExclusiveMitigationSelections(fight.id, emptyMap);
    }
    return { trackers: [], exclusiveAbilityMap: emptyMap };
  }

  const actorByName = buildActorNameMap(actorById);
  const friendlyActorMap = new Map();
  let hasPaladin = false;
  if (Array.isArray(friendlyActors)) {
    friendlyActors.forEach((actor) => {
      if (actor && actor.name) {
        friendlyActorMap.set(actor.name, actor);
        if (!hasPaladin) {
          const normalizedJob = actor?.subType
            ? normalizeJobName(actor.subType)
            : "";
          if (normalizedJob === "paladin") {
            hasPaladin = true;
          }
        }
      }
    });
  } else if (friendlyActors instanceof Map) {
    friendlyActors.forEach((actor, name) => {
      if (!actor && !name) return;
      const resolvedActor = actor ?? {};
      const actorName = resolvedActor.name || name;
      if (!actorName) return;
      const record = { ...resolvedActor, name: actorName };
      friendlyActorMap.set(actorName, record);
      if (!hasPaladin) {
        const normalizedJob = record?.subType
          ? normalizeJobName(record.subType)
          : "";
        if (normalizedJob === "paladin") {
          hasPaladin = true;
        }
      }
    });
  }

  if (!hasPaladin && actorByName instanceof Map) {
    actorByName.forEach((actor) => {
      if (hasPaladin) return;
      const normalizedJob = actor?.subType
        ? normalizeJobName(actor.subType)
        : "";
      if (normalizedJob === "paladin") {
        hasPaladin = true;
      }
    });
  }

  const oathContext =
    hasPaladin && typeof CooldownHandlers.PaladinOathGaugeContext === "function"
      ? new CooldownHandlers.PaladinOathGaugeContext()
      : null;
  const fightStartTimeMs = fight?.startTime ?? 0;
  const exclusiveSelections = new Map();
  const exclusiveConflictGroups = new Set();

  // Step 1: Build friendly roster + baseline mitigation ability lists.
  const trackerMap = new Map();

  // 🧭 Pointer into the sorted deaths array so we process each death once, in order
  let deathPtr = 0;

  /**
   * handlePaladinDeathsUpTo()
   * --------------------------------------------------------------
   * Advance through all parsed death events whose `relative` time is strictly
   * less than `uptoRelTs` and, for each death, if the *dead player* is a Paladin,
   * reset that player's Oath Gauge (OG) to 0 immediately.
   *
   * Why this shape?
   *   - `parsedDeaths` is already sorted by `relative`.
   *   - We should not scan the entire array for every cast (O(n²)).
   *   - Using a moving pointer ensures each death is handled exactly once (O(n)).
   *
   * Important:
   *   - The decision of *who* is Paladin is based on the **death actor** (the one who died),
   *     NOT the player who is casting right now.
   *   - The current cast is used only as a time barrier (i.e., process all deaths that
   *     happened before this cast's timestamp).
   *
   * @param {number} uptoRelTs - Process all deaths with relative < uptoRelTs.
   */
  function handlePaladinDeathsUpTo(uptoRelTs) {
    if (deaths.length === 0) return;
    if (!oathContext || typeof oathContext._ensurePlayer !== "function") return;
    if (!Number.isFinite(uptoRelTs)) return;

    // Walk forward through deaths that happened before this cast
    while (deathPtr < deaths.length && deaths[deathPtr].relative < uptoRelTs) {
      const death = deaths[deathPtr++];
      const deadName = death?.actor;
      if (!deadName) continue;

      // 🔍 Resolve job using the same method used elsewhere in this file
      const actor = friendlyActorMap.get(deadName) || actorByName.get(deadName);
      const jobName = actor?.subType;
      const normalizedJob = jobName ? normalizeJobName(jobName) : "";

      if (
        normalizedJob === "paladin" &&
        typeof CooldownHandlers.handlePaladinDeathLock === "function"
      ) {
        CooldownHandlers.handlePaladinDeathLock({
          playerName: deadName,
          normalizedJob,
          deathRelativeTime: death?.relative ?? null,
          deathRawTimestamp: death?.rawTimestamp ?? null,
          fightStartTime: fight?.startTime ?? 0,
          oathContext,
          trackerMap,
        });
      }
    }
  }

  /**
   * Record which mutually exclusive mitigation ability appears in this fight.
   *
   * @param {Object} cast - Current cast entry being processed.
   * @param {string} normalizedJob - Normalized job identifier for the caster.
   * @param {number} start - Fight-relative timestamp for the cast.
   */
  function recordExclusiveAbilityUsage(cast, normalizedJob, start) {
    if (!cast || !cast.ability) return;

    const descriptor = getExclusiveMitigationGroupByAbility(cast.ability);
    if (!descriptor || descriptor.normalizedJob !== normalizedJob) {
      return;
    }

    const groupId = descriptor.groupId;
    const normalizedAbility = normalizeAbilityName(cast.ability);
    const existing = exclusiveSelections.get(groupId);
    if (!existing) {
      exclusiveSelections.set(groupId, {
        abilityName: cast.ability,
        normalizedAbility,
      });
      return;
    }

    if (existing.normalizedAbility === normalizedAbility) {
      return;
    }

    if (exclusiveConflictGroups.has(groupId)) {
      return;
    }
    exclusiveConflictGroups.add(groupId);

    const relativeTime = Number.isFinite(start)
      ? formatRelativeTime(start + fightStartTimeMs, fightStartTimeMs)
      : "unknown";

    log.error(`[CastAnalysis] Mutually exclusive mitigations detected`, {
      fightId: fight?.id ?? null,
      groupId,
      firstAbility: existing.abilityName,
      conflictingAbility: cast.ability,
      player: cast.source || "Unknown",
      time: relativeTime,
    });
  }

  // Step 2: Sweep the combined timeline and dispatch per-cast handlers.
  casts.forEach((cast) => {
    // Process any deaths that occurred before this cast; if the death actor is a Paladin, reset OG.
    handlePaladinDeathsUpTo(cast?.relative);
    if (!cast || !cast.ability || !cast.source) return;

    // --------------------------------------------------------------
    // 🔍 Resolve actor/job context for this cast
    // --------------------------------------------------------------
    // Instead of restricting to mitigation abilities, we now build a
    // cooldown tracker for *every* casted ability. The cooldown length
    // is resolved directly from the job’s configuration file.
    const actor =
      friendlyActorMap.get(cast.source) || actorByName.get(cast.source);
    const jobName = actor?.subType;
    if (!jobName) return;

    // Normalize names for consistency with job configs
    const normalizedJob = normalizeJobName(jobName);
    const normalizedAbility = normalizeAbilityName(cast.ability);
    const isPaladinCaster = normalizedJob === "paladin";

    const dependencies = COOLDOWN_DEPENDENCY_MAP.filter(
      (dep) =>
        (dep.job === normalizedJob || dep.job === "any") &&
        normalizeAbilityName(dep.trigger) === normalizedAbility
    );

    // Compute relative start timestamp before dependency handling so that
    // resource-driven handlers (e.g., Paladin Oath gauge) can react to casts
    // without requiring a valid cooldown entry.
    let start = Number.isFinite(cast.relative) ? cast.relative : null;
    if (!Number.isFinite(start) && Number.isFinite(cast.rawTimestamp)) {
      const fightStart = fight?.startTime ?? null;
      if (Number.isFinite(fightStart)) {
        start = cast.rawTimestamp - fightStart;
      }
    }

    if (!Number.isFinite(start)) return;

    recordExclusiveAbilityUsage(cast, normalizedJob, start);

    // --------------------------------------------------------------
    // ⏱️ Lookup cooldown duration from job config
    // --------------------------------------------------------------
    // Consult the job’s configuration (via resolveAbilityCooldown)
    // to obtain the base cooldown in milliseconds. If no entry is found
    // or the ability has no valid recast time, we still allow custom
    // handlers to process the event (e.g., Paladin auto attacks).
    const cooldownInfo = resolveAbilityCooldown(jobName, cast.ability);
    const hasCooldownInfo =
      cooldownInfo && Number.isFinite(cooldownInfo.cooldownMs);

    const key = `${cast.source}::${normalizedAbility}`;
    let tracker = null;
    if (hasCooldownInfo) {
      tracker = trackerMap.get(key);
      if (!tracker) {
        tracker = new CastCooldownTracker(
          cast.ability,
          cast.source,
          jobName,
          cooldownInfo.cooldownMs
        );
        if (oathContext) {
          tracker.__oathContext = oathContext;
        }
        trackerMap.set(key, tracker);
      } else {
        tracker.setJobName(jobName);
        tracker.setBaseCooldownMs(cooldownInfo.cooldownMs);
        if (oathContext) {
          tracker.__oathContext = oathContext;
        }
      }
    }

    // Helper that records the default cooldown window once.
    let defaultCooldownConsumed = false;
    const defaultAddCooldown = () => {
      if (!hasCooldownInfo || !tracker) return false;
      if (defaultCooldownConsumed) return false;
      tracker.addCooldown(start, start + cooldownInfo.cooldownMs);
      defaultCooldownConsumed = true;
      return true;
    };

    // --------------------------------------------------------------
    // Dependency Dispatch
    // --------------------------------------------------------------
    // Custom handlers can opt-in to the default cooldown by invoking
    // `defaultAddCooldown()`. When no custom handlers exist we fall
    // back to the default behavior automatically.
    if (dependencies.length > 0) {
      const eventTimestamp =
        (Number.isFinite(cast?.timestamp) && cast.timestamp) ||
        (Number.isFinite(cast?.rawTimestamp) && cast.rawTimestamp) ||
        0;
      const relTime = formatRelativeTime(eventTimestamp, fightStartTimeMs);

      log.debug(`[CastAnalysis] Dispatching cooldown dependency handlers`, {
        player: cast.source,
        trigger: cast.ability,
        time: relTime, // Human-readable fight-relative timestamp
        handlers: dependencies.map((dep) => dep.handler),
      });
    }

    if (dependencies.length === 0) {
      defaultAddCooldown();
    } else {
      dependencies.forEach((dep) => {
        const handlerFn = CooldownHandlers[dep.handler];
        if (typeof handlerFn === "function") {
          handlerFn({
            depConfig: dep,
            cast,
            trackerMap,
            actorById,
            fight,
            start,
            triggerTracker: tracker,
            cooldownInfo,
            defaultAddCooldown,
            normalizedAbility,
            normalizedJob,
            oathContext,
          });
        } else {
          log.warn(
            `[CastAnalysis] Missing handler "${dep.handler}" for ${dep.trigger}`
          );
        }
      });
    }

    if (
      isPaladinCaster &&
      typeof CooldownHandlers.ensurePaladinOathLock === "function"
    ) {
      const trackerBaseCooldown =
        tracker && typeof tracker.getBaseCooldownMs === "function"
          ? tracker.getBaseCooldownMs()
          : null;
      let baseCooldown = null;
      if (cooldownInfo && Number.isFinite(cooldownInfo.cooldownMs)) {
        baseCooldown = cooldownInfo.cooldownMs;
      } else if (Number.isFinite(trackerBaseCooldown)) {
        baseCooldown = trackerBaseCooldown;
      }

      const currentGauge =
        oathContext && typeof oathContext.getGauge === "function"
          ? oathContext.getGauge(cast.source)
          : null;
      CooldownHandlers.ensurePaladinOathLock({
        playerName: cast.source,
        trackerMap,
        startTime: start,
        baseCooldown,
        extraAbilities: [normalizedAbility],
        oathContext,
        gaugeOverride: currentGauge,
      });
    }
  });

  // Step 3: Flush any remaining deaths that occurred after the final cast.
  handlePaladinDeathsUpTo(Number.MAX_SAFE_INTEGER);

  const trackers = Array.from(trackerMap.values());

  // --- LOGGING: Print readable cooldown windows using mm:ss.mmm ---
  const formattedTrackers = trackers.map((t) => {
    const cooldowns = t.getCooldownWindows().map((w) => ({
      start: formatRelativeTime(w.start + fightStartTimeMs, fightStartTimeMs),
      end: formatRelativeTime(w.end + fightStartTimeMs, fightStartTimeMs),
    }));
    return {
      ability: t.getAbilityName(),
      player: t.getSourcePlayer(),
      job: t.getJobName(),
      baseCD: t.getBaseCooldownMs(),
      cooldownWindows: cooldowns,
    };
  });

  log.info(
    `[CastAnalysis] Built ${trackers.length} mitigation cooldown tracker(s)`,
    formattedTrackers
  );

  // log.info(
  //   `[CastAnalysis] Built ${trackers.length} mitigation cooldown tracker(s)`,
  //   trackers
  // );

  if (fight?.id != null) {
    registerExclusiveMitigationSelections(fight.id, exclusiveSelections);
  }

  return {
    trackers,
    exclusiveAbilityMap: exclusiveSelections,
  };
}

/**
 * Populate `availableMitigations` for each damage-row in a FightTable.
 *
 * Workflow:
 *   1. Determine the friendly player roster and build baseline mitigation lists via `getMitigationAbilityNames`.
 *   2. Generate mitigation cooldown trackers via `buildMitigationCooldownTrackers`, seeded with the friendly roster.
 *   3. Create a timestamp → player → abilities-on-cooldown index by sweeping through
 *      the cooldown windows alongside the fight’s damage timestamps.
 *   4. For every FightTable row, subtract any on-cooldown abilities from each player’s
 *      baseline list and store the results under `row.availableMitigationsByPlayer[name]`.
 *
 * Notes:
 *   - Rows belonging to actors without mitigation entries simply receive an empty array.
 *   - Cooldown windows treat the `end` timestamp as exclusive: once the timestamp reaches
 *     the window’s `end`, the mitigation is considered available again.
 *   - Updates `fightTable.availableMitigationTrackers` so downstream consumers can reuse
 *     the tracker metadata (e.g., for debugging or advanced UI overlays).
 *   - “Anomalies” represent cooldown trackers whose ability was not present in the baseline
 *     mitigation list for that player’s job, indicating a potential dataset mismatch or
 *     unidentified mitigation ability.
 *   - Persists mutually exclusive mitigation selections under
 *     `fightTable.mutuallyExclusiveMitigationMap` for UI/icon rendering.
 *
 * @param {Object} fightTable - FightTable returned from buildFightTable (mutated in-place).
 * @param {Array<Object>} parsedCasts - Flattened cast timeline for this fight.
 * @param {Array<Object>} parsedDeaths - Parsed death events sorted by relative time (used to reset Paladin OG).
 * @param {Map|Array|Object|null} actorById - Actor lookup to resolve jobs per player.
 * @param {Object|null} fight - Fight metadata (used for relative timestamp fallback).
 */
export function populateMitigationAvailability(
  fightTable,
  parsedCasts = [],
  parsedDeaths = [],
  actorById = null,
  fight = null
) {
  if (
    !fightTable ||
    !Array.isArray(fightTable.rows) ||
    fightTable.rows.length === 0
  ) {
    return;
  }

  const actorByName = buildActorNameMap(actorById);
  const baselineAbilitiesByPlayer = new Map();
  const baselineNormalizedByPlayer = new Map();

  const resolveActorById = (id) => {
    if (!actorById) return null;
    if (actorById instanceof Map) return actorById.get(id);
    if (typeof actorById === "object") return actorById[id] || null;
    return null;
  };

  const friendlyActors = [];
  const friendlyIds = Array.isArray(fightTable.friendlyPlayerIds)
    ? fightTable.friendlyPlayerIds
    : [];
  const seenFriendlyNames = new Set();

  friendlyIds.forEach((id) => {
    const actor = resolveActorById(id);
    if (
      actor &&
      actor.type === "Player" &&
      actor.name &&
      !seenFriendlyNames.has(actor.name)
    ) {
      seenFriendlyNames.add(actor.name);
      friendlyActors.push(actor);
    }
  });

  if (friendlyActors.length === 0) {
    actorByName.forEach((actor) => {
      if (
        actor &&
        actor.type === "Player" &&
        actor.name &&
        !seenFriendlyNames.has(actor.name)
      ) {
        seenFriendlyNames.add(actor.name);
        friendlyActors.push(actor);
      }
    });
  }

  // Step 2: Build cooldown trackers for mitigation abilities
  const { trackers = [], exclusiveAbilityMap = new Map() } =
    buildCooldownTrackers(
      parsedCasts,
      [],
      parsedDeaths,
      fight,
      actorById,
      null,
      friendlyActors
    );
  fightTable.availableMitigationTrackers = trackers;
  fightTable.mutuallyExclusiveMitigationMap =
    Object.fromEntries(exclusiveAbilityMap);

  friendlyActors.forEach((actor) => {
    const abilities = getMitigationAbilityNames(actor.subType, {
      exclusiveAbilityMap,
    });
    const normalizedAbilities = abilities.map((name) =>
      normalizeAbilityName(name)
    );
    baselineAbilitiesByPlayer.set(actor.name, abilities);
    baselineNormalizedByPlayer.set(actor.name, normalizedAbilities);
  });

  const allPlayerNames = Array.from(baselineAbilitiesByPlayer.keys());

  // Step 3: Build cooldown index keyed by timestamp → player → Set(abilities)
  const uniqueTimestamps = Array.from(
    new Set(fightTable.rows.map((row) => row.timestamp))
  ).sort((a, b) => a - b);

  const trackerAnomalies = [];

  const cooldownData = trackers
    .map((tracker) => {
      const source = tracker.getSourcePlayer();
      const ability = tracker.getAbilityName();
      const normalizedAbility = normalizeAbilityName(ability);
      const baselineNormalized = baselineNormalizedByPlayer.get(source) || [];
      if (
        baselineNormalized.length === 0 ||
        !baselineNormalized.includes(normalizedAbility)
      ) {
        trackerAnomalies.push({ source, ability });
      }
      return {
        source,
        ability,
        normalizedAbility,
        periods: tracker.getCooldownWindows(),
      };
    })
    .filter(
      (entry) => Array.isArray(entry.periods) && entry.periods.length > 0
    );

  const cooldownIndex = buildCooldownIndex(uniqueTimestamps, cooldownData);

  // Step 4: Populate row-level availability by subtracting active cooldowns
  fightTable.rows.forEach((row) => {
    const cooldownsForTimestamp = cooldownIndex.get(row.timestamp) || new Map();
    row.availableMitigationsByPlayer = {};

    allPlayerNames.forEach((playerName) => {
      const baseline = baselineAbilitiesByPlayer.get(playerName) || [];
      const baselineNormalized =
        baselineNormalizedByPlayer.get(playerName) || [];
      if (baseline.length === 0) {
        row.availableMitigationsByPlayer[playerName] = [];
        return;
      }

      const onCooldown = cooldownsForTimestamp.get(playerName);
      if (!onCooldown || onCooldown.size === 0) {
        row.availableMitigationsByPlayer[playerName] = [...baseline];
        return;
      }

      const available = [];
      for (let i = 0; i < baseline.length; i++) {
        const abilityName = baseline[i];
        const normalized =
          baselineNormalized[i] || normalizeAbilityName(abilityName);
        if (!onCooldown.has(normalized)) {
          available.push(abilityName);
        }
      }

      row.availableMitigationsByPlayer[playerName] = available;
    });
  });

  const playersWithMit = Array.from(baselineAbilitiesByPlayer.entries()).filter(
    ([, abilities]) => abilities.length > 0
  ).length;
  const playersWithoutMit = baselineAbilitiesByPlayer.size - playersWithMit;

  log.info(`[CastAnalysis] Mitigation availability populated`, {
    rows: fightTable.rows.length,
    trackers: trackers.length,
    timestamps: uniqueTimestamps.length,
    playersWithMit,
    playersWithoutMit,
    anomalies: trackerAnomalies.length,
  });

  if (trackerAnomalies.length > 0) {
    log.warn(
      `[CastAnalysis] Mitigation tracker anomalies detected`,
      trackerAnomalies.slice(0, 10)
    );
  }
}

/**
 * Build an index describing which mitigation trackers are cooling down at each timestamp.
 *
 * Uses a pointer-per-tracker sweep to advance through cooldown windows efficiently.
 *
 * @param {number[]} timestamps - Sorted list of unique fight-relative timestamps.
 * @param {Array<{source:string, ability:string, periods:Array<{start:number,end:number}>}>} cooldownData
 * @returns {Map<number, Map<string, Set<string>>>} timestamp → player → abilities-on-cooldown
 */
function buildCooldownIndex(timestamps, cooldownData) {
  const index = new Map();

  if (!Array.isArray(timestamps) || timestamps.length === 0) {
    return index;
  }

  if (!Array.isArray(cooldownData) || cooldownData.length === 0) {
    timestamps.forEach((t) => index.set(t, new Map()));
    return index;
  }

  const pointers = cooldownData.map(() => 0);

  for (const t of timestamps) {
    const playerMap = new Map();

    for (let i = 0; i < cooldownData.length; i++) {
      const periods = cooldownData[i].periods;
      if (!Array.isArray(periods) || periods.length === 0) continue;

      let p = pointers[i];

      // Advance pointer while the cooldown finished before this timestamp
      while (p < periods.length && periods[p].end <= t) {
        p++;
      }
      pointers[i] = p;

      if (p >= periods.length) continue;

      const window = periods[p];
      if (window.start <= t && t < window.end) {
        const { source, ability, normalizedAbility } = cooldownData[i];
        const abilityKey = normalizedAbility || normalizeAbilityName(ability);
        if (!abilityKey) continue;
        if (!playerMap.has(source)) {
          playerMap.set(source, new Set());
        }
        playerMap.get(source).add(abilityKey);
      }
    }

    index.set(t, playerMap);
  }

  return index;
}
