import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";
import {
  normalizeAbilityName,
  getMitigationAbilityNames,
} from "../utility/jobConfigHelper.js";
import { AUTO_ATTACK_NAMES } from "../config/AppConfig.js";
import { CastCooldownTracker } from "./castAnalysis.js";

setModuleLogLevel("CustomCooldownHandlers", envLogLevel("info", "warn"));
const log = getLogger("CustomCooldownHandlers");
const SAFE_MAX_END = Number.MAX_SAFE_INTEGER;

/**
 * Paladin-specific job identifier used by handler guard clauses.
 * Matches the normalized name emitted by `normalizeJobName`.
 */
const PALADIN_JOB = "paladin";
/**
 * Oath gauge cost (in units) consumed by Intervention/Sheltron casts.
 */
const OATH_COST = 50;
/**
 * Oath gauge gain awarded per paladin auto attack.
 */
const OATH_GAIN = 5;
/**
 * Maximum Paladin Oath gauge value.
 */
const MAX_OATH = 100;
/**
 * Default starting gauge for a fresh pull.
 */
const STARTING_OATH = MAX_OATH;

// Fetch and validate Paladin mitigation abilities dynamically
let PALADIN_OATH_ABILITIES = new Set();
try {
  const allMitNames =
    getMitigationAbilityNames("Paladin").map(normalizeAbilityName);
  const intendedAbilities = ["Intervention", "Sheltron", "Holy Sheltron"].map(
    normalizeAbilityName
  );

  const validated = intendedAbilities.filter((name) =>
    allMitNames.includes(name)
  );
  PALADIN_OATH_ABILITIES = new Set(validated);

  const missing = intendedAbilities.filter(
    (name) => !allMitNames.includes(name)
  );
  if (missing.length > 0) {
    log.info(
      `[CustomCDHandlers] [PaladinOath] Missing expected abilities in mitigation config: ${missing.join(
        ", "
      )}`
    );
  } else {
    log.debug(
      `[CustomCDHandlers] [PaladinOath] All Oath-based abilities verified in config: ${validated.join(
        ", "
      )}`
    );
  }
} catch (err) {
  log.warn(
    `[CustomCDHandlers] [PaladinOath] Failed to initialize Oath ability set from config`,
    err
  );
}

const NORMALIZED_AUTO_ATTACK_NAMES = new Set(
  Array.from(AUTO_ATTACK_NAMES || []).map((name) => normalizeAbilityName(name))
);

/**
 * Clamp Oath gauge values into the legal range of 0…100.
 *
 * @param {number} value - Gauge amount to normalize.
 * @returns {number} Clamped gauge value.
 */
function clampGauge(value) {
  if (!Number.isFinite(value)) return STARTING_OATH;
  return Math.max(0, Math.min(MAX_OATH, value));
}

/**
 * Lightweight container that keeps per-player Paladin Oath gauge state
 * scoped to a single fight/report.
 */
export class PaladinOathGaugeContext {
  /**
   * @param {{startingGauge?: number}} [options]
   *        Optional configuration controlling the initial gauge for new players.
   */
  constructor({ startingGauge = STARTING_OATH } = {}) {
    this._startingGauge = clampGauge(startingGauge);
    this._gaugeByPlayer = new Map();
  }

  /**
   * Ensure a player record exists and return it.
   *
   * @param {string} player - Player name from FFLogs casts.
   * @returns {{gauge: number}}|null
   */
  _ensurePlayer(player) {
    if (!player) return null;
    if (!this._gaugeByPlayer.has(player)) {
      this._gaugeByPlayer.set(player, {
        gauge: this._startingGauge,
      });
    }
    return this._gaugeByPlayer.get(player);
  }

  /**
   * Read the current Oath gauge for a player, instantiating state if needed.
   *
   * @param {string} player
   * @returns {number} Current gauge amount.
   */
  getGauge(player) {
    const state = this._ensurePlayer(player);
    return state ? state.gauge : this._startingGauge;
  }

  /**
   * Spend Oath gauge for a player.
   *
   * @param {string} player
   * @param {number} amount
   * @returns {number} Remaining gauge after the spend.
   */
  consumeGauge(player, amount) {
    const state = this._ensurePlayer(player);
    if (!state) return this._startingGauge;
    const next = clampGauge(state.gauge - amount);
    state.gauge = next;
    return next;
  }

  /**
   * Award Oath gauge to a player.
   *
   * @param {string} player
   * @param {number} amount
   * @returns {number} Gauge after the gain is applied.
   */
  gainGauge(player, amount) {
    const state = this._ensurePlayer(player);
    if (!state) return this._startingGauge;
    const next = clampGauge(state.gauge + amount);
    state.gauge = next;
    return next;
  }
}

/**
 * Append a resource lock window (start → SAFE_MAX_END) to a tracker. Duplicate
 * locks for the same timestamp are ignored to keep the cooldown history tidy.
 *
 * @param {CastCooldownTracker|null} tracker
 * @param {number} start
 */
function addResourceLockWindow(tracker, start) {
  if (!tracker || !Number.isFinite(start)) return;
  const windows = tracker.getCooldownWindows();
  if (!Array.isArray(windows)) return;

  // 🔍 Look for an existing unresolved lock (end === SAFE_MAX_END)
  const duplicateLock = windows.find(
    (w) => w.end === SAFE_MAX_END && w.start === start
  );
  if (duplicateLock) {
    log.warn(
      `[CustomCDHandlers] [PaladinOath] Existing MAX_SAFE_INT lock detected for ${
        tracker._abilityName || "unknown ability"
      };` + ` reusing existing entry (start=${duplicateLock.start}).`
    );
    return; // Do not add another open lock
  }

  try {
    tracker.addCooldown(start, SAFE_MAX_END);
    log.debug(
      `[CustomCDHandlers] [PaladinOath] Added new resource lock for ${
        tracker._abilityName || "unknown ability"
      } at ${start}.`
    );
  } catch (error) {
    log.debug(
      "[CustomCDHandlers] Unable to append resource lock window",
      error
    );
  }
}

/**
 * Resolve every outstanding resource lock window by assigning an actual end time.
 *
 * @param {CastCooldownTracker|null} tracker
 * @param {number} timestamp
 */
function resolveAllResourceLocks(tracker, timestamp) {
  if (!tracker) return;
  const windows = tracker.getCooldownWindows();
  if (!Array.isArray(windows) || windows.length === 0) return;

  const updated = [];
  let mutated = false;

  windows.forEach((window) => {
    if (window && window.end === SAFE_MAX_END) {
      const minEnd = Number.isFinite(window.start) ? window.start + 1 : 1;
      const resolvedEnd = Number.isFinite(timestamp)
        ? Math.max(timestamp, minEnd)
        : minEnd;
      updated.push({ ...window, end: resolvedEnd });
      mutated = true;
    } else {
      updated.push(window);
    }
  });

  if (mutated) {
    tracker.setCooldownWindows(updated);
  }
}

/**
 * Builds the key used to look up CastCooldownTrackers within the global map.
 */
function buildTrackerKey(playerName, abilityName) {
  if (!playerName) return null;
  const normalizedAbility = normalizeAbilityName(abilityName);
  if (!normalizedAbility) return null;
  return `${playerName}::${normalizedAbility}`;
}

/**
 * handleAstroCardDependency()
 * --------------------------------------------------------------
 * Models the Astrologian card flow:
 *   - Casting The Bole should keep it on cooldown until the next draw.
 *   - The next Umbral Draw cast immediately frees The Bole for use again.
 * Any other trigger falls back to the default cooldown generator.
 */
export function handleAstroCardDependency({
  depConfig,
  cast,
  trackerMap,
  actorById,
  fight,
  start,
  triggerTracker,
  defaultAddCooldown,
  normalizedAbility,
}) {
  const player = cast.source;
  const trigger = normalizedAbility || normalizeAbilityName(cast.ability);
  if (!player || !trigger || !Number.isFinite(start)) return;

  const boleAbility = normalizeAbilityName("The Bole");
  const umbralAbility = normalizeAbilityName("Umbral Draw");
  const affectedAbilities = (depConfig.affects || [])
    .map(normalizeAbilityName)
    .filter(Boolean);

  if (trigger === boleAbility) {
    if (!triggerTracker) {
      log.debug(
        `[CustomCDHandlers] [AstroDependency] Missing tracker for The Bole (${player}); cannot record cooldown.`
      );
      return;
    }

    triggerTracker.addCooldown(start, SAFE_MAX_END);
    return;
  }

  if (trigger === umbralAbility) {
    affectedAbilities
      .filter((abilityName) => abilityName === boleAbility)
      .forEach((abilityName) => {
        const key = buildTrackerKey(player, abilityName);
        if (!key) return;
        const tracker = trackerMap.get(key);
        if (!tracker) return;

        const windows = tracker.getCooldownWindows();
        if (!Array.isArray(windows) || windows.length === 0) return;

        const lastWindow = windows[windows.length - 1];
        if (lastWindow.end !== SAFE_MAX_END) return;

        const resolvedEnd =
          start > lastWindow.start ? start : lastWindow.start + 1;
        if (resolvedEnd <= lastWindow.start) return;

        const updatedWindows = [
          ...windows.slice(0, -1),
          { ...lastWindow, end: resolvedEnd },
        ];
        tracker.setCooldownWindows(updatedWindows);
      });
    return;
  }

  if (typeof defaultAddCooldown === "function") {
    defaultAddCooldown();
  }
}

/**
 * handleMutualCardCooldown()
 * --------------------------------------------------------------
 * Keeps Umbral Draw and Astral Draw on mutually exclusive cooldowns.
 * When either variant is cast we:
 *   1. Record a placeholder window (start → SAFE_MAX_END) for the trigger.
 *   2. Collapse the opposite variant's most recent placeholder window to the
 *      observed recast length using the trigger's configured cooldown.
 * This lets us capture the true downtime between casts without assuming the
 * player used the opposite draw immediately.
 */
export function handleMutualCardCooldown({
  depConfig,
  cast,
  trackerMap,
  actorById,
  fight,
  start,
  triggerTracker,
  cooldownInfo,
  defaultAddCooldown,
}) {
  const player = cast.source;
  const trigger = normalizeAbilityName(cast.ability);
  if (!player || !trigger || !Number.isFinite(start)) return;

  if (!triggerTracker) {
    log.debug(
      `[CustomCDHandlers] [MutualCooldown] Missing trigger tracker for ${trigger} (${player}); falling back to default.`
    );
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  const baseCooldown =
    cooldownInfo?.cooldownMs ?? triggerTracker.getBaseCooldownMs();
  if (!Number.isFinite(baseCooldown) || baseCooldown <= 0) {
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  triggerTracker.addCooldown(start, SAFE_MAX_END);

  const affectedAbilities = (depConfig.affects || [])
    .map(normalizeAbilityName)
    .filter(Boolean);

  affectedAbilities.forEach((abilityName) => {
    const key = buildTrackerKey(player, abilityName);
    if (!key) return;

    const tracker = trackerMap.get(key);
    if (!tracker) return;

    const windows = tracker.getCooldownWindows();
    if (!Array.isArray(windows) || windows.length === 0) return;

    const lastWindow = windows[windows.length - 1];
    if (lastWindow.end !== SAFE_MAX_END) return;

    const resolvedEnd = lastWindow.start + baseCooldown;
    if (resolvedEnd <= lastWindow.start) return;

    const updatedWindows = [
      ...windows.slice(0, -1),
      { ...lastWindow, end: resolvedEnd },
    ];
    tracker.setCooldownWindows(updatedWindows);
  });
}

/**
 * handlePaladinOathAbility()
 * --------------------------------------------------------------
 * Extends the standard cooldown handling for Intervention, Sheltron,
 * and Holy Sheltron by applying Paladin Oath gauge rules.
 *
 * Behaviour:
 *   - Always records the base cooldown window via `defaultAddCooldown()`.
 *   - Deducts 50 gauge from the casting Paladin.
 *   - If the remaining gauge falls below 50, locks the current ability and
 *     its two siblings by forcing their windows to `SAFE_MAX_END`.
 *   - Stores metadata about the lock so it can be reverted once enough gauge
 *     is regenerated.
 */
export function handlePaladinOathAbility({
  cast,
  trackerMap,
  start,
  triggerTracker,
  cooldownInfo,
  defaultAddCooldown,
  normalizedAbility,
  normalizedJob,
  oathContext,
}) {
  const player = cast?.source;
  if (!player || !Number.isFinite(start)) {
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  const job = normalizedJob || "";
  if (job !== PALADIN_JOB) {
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  const abilityName =
    normalizedAbility || normalizeAbilityName(cast?.ability || "");
  if (!PALADIN_OATH_ABILITIES.has(abilityName)) {
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  if (!triggerTracker) {
    log.debug(
      `[CustomCDHandlers] [PaladinOath] Missing tracker for ${cast.ability} (${player}); using default cooldown.`
    );
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  const baseCooldown =
    cooldownInfo?.cooldownMs ?? triggerTracker.getBaseCooldownMs();
  if (!Number.isFinite(baseCooldown) || baseCooldown <= 0) {
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  if (typeof defaultAddCooldown === "function") {
    defaultAddCooldown();
  } else {
    triggerTracker.addCooldown(start, start + baseCooldown);
  }

  const gaugeBefore = oathContext?.getGauge(player) ?? STARTING_OATH;
  // 🔍 Log the current OG before consuming
  log.debug(
    `[CustomCDHandlers] [PaladinOath] Current OG for ${player} before ${cast.ability}: ${gaugeBefore}`
  );
  const gaugeAfter =
    typeof oathContext?.consumeGauge === "function"
      ? oathContext.consumeGauge(player, OATH_COST)
      : gaugeBefore - OATH_COST;

  if (gaugeBefore < OATH_COST) {
    log.warn(
      `[CustomCDHandlers] [PaladinOath] WARNING: ${player} attempted to cast ${cast.ability} with insufficient Oath (${gaugeBefore}).` +
        ` This indicates OG < 50 but ability was still cast; existing lock should be reused instead of adding a new one.`
    );
  }

  // Falling below 50 Oath locks every mitigation in the trio until gauge recovers.
  if (gaugeAfter < OATH_COST) {
    log.debug(
      `[CustomCDHandlers] [PaladinOath] ${player} OG dropped below 50 (${gaugeAfter}); locking all Oath-based abilities.`
    );

    PALADIN_OATH_ABILITIES.forEach((oathAbility) => {
      const key = buildTrackerKey(player, oathAbility);
      if (!key) return;

      let targetTracker =
        oathAbility === abilityName ? triggerTracker : trackerMap.get(key);
      if (!targetTracker) {
        targetTracker = new CastCooldownTracker(
          oathAbility,
          player,
          PALADIN_JOB,
          baseCooldown
        );
        trackerMap.set(key, targetTracker);
      }

      addResourceLockWindow(targetTracker, start);
    });
    return; // stop here — do not continue to resolution path
  }

  // Otherwise OG ≥ 50 → no new locks created.
}

/**
 * handlePaladinAutoAttack()
 * --------------------------------------------------------------
 * Handles Paladin auto-attacks as Oath gauge triggers and conditionally
 * resolves mitigation cooldown locks once sufficient Oath has been restored.
 *
 * 🧭 Behavior:
 *   - Each auto-attack event grants +5 Oath gauge.
 *   - Once gauge ≥ OATH_COST (e.g., 50), the function inspects all
 *     `CastCooldownTracker` instances tied to Paladin Oath-based
 *     mitigation abilities (e.g., Holy Sheltron, Intervention).
 *   - For each tracker, any open cooldown window (one that does not
 *     yet have a defined end time, or where `end > start` but is
 *     still active at the time of this auto-attack) will be resolved.
 *   - When a cooldown window is resolved, the function logs the full
 *     entry details (ability, player, start, oldEnd, newEnd, duration)
 *     for full transparency in debugging.
 *
 * 🧩 Tracker Interaction:
 *   - The cooldown data structure is managed by `CastCooldownTracker`,
 *     which exposes safe accessors (`getCooldownWindows()` and
 *     `setCooldownWindows()`). This ensures that validation and sorting
 *     invariants are preserved.
 *   - The function does not mutate `_cooldownWindows` directly, but uses
 *     the setter whenever available.
 *
 * ⚙️ Example Log Output:
 *   [CustomCDHandlers] [PaladinOath] Holy Sheltron lock closed for F'meow Littlefoot:
 *     start=1250, oldEnd=9007199254740991, newEnd=103431, duration=102181
 *
 * @param {Object} params
 * @param {Object} params.cast - The cast object representing the auto-attack event.
 * @param {Map<string, CastCooldownTracker>} params.trackerMap - Tracker map of cooldowns per ability.
 * @param {number} params.start - The timestamp of the auto attack.
 * @param {string} params.normalizedAbility - Normalized ability name.
 * @param {string} params.normalizedJob - Normalized job/subType (e.g., "Paladin").
 * @param {Object} params.oathContext - Context object managing current Oath gauge state.
 */
export function handlePaladinAutoAttack({
  cast,
  trackerMap,
  start,
  normalizedAbility,
  normalizedJob,
  oathContext,
}) {
  const player = cast?.source;
  if (!player || !Number.isFinite(start)) return;

  const job = normalizedJob || "";
  if (job !== PALADIN_JOB) return;

  const abilityName =
    normalizedAbility || normalizeAbilityName(cast?.ability || "");
  if (!NORMALIZED_AUTO_ATTACK_NAMES.has(abilityName)) return;

  const gaugeBefore = oathContext?.getGauge(player) ?? STARTING_OATH;
  log.debug(
    `[CustomCDHandlers] [PaladinOath] Current OG for ${player} before auto attack: ${gaugeBefore}`
  );

  const gaugeAfter =
    typeof oathContext?.gainGauge === "function"
      ? oathContext.gainGauge(player, OATH_GAIN)
      : gaugeBefore + OATH_GAIN;

  log.debug(
    `[CustomCDHandlers] [PaladinOath] Auto attack for ${player}; gauge ${gaugeBefore} -> ${gaugeAfter}`
  );

  // Only proceed if Oath gauge threshold is met
  if (gaugeAfter < OATH_COST) return;

  // Iterate through all Paladin Oath abilities and close any open cooldowns
  PALADIN_OATH_ABILITIES.forEach((abilityName) => {
    const key = buildTrackerKey(player, abilityName);
    if (!key) return;

    const tracker = trackerMap.get(key);
    if (!(tracker instanceof CastCooldownTracker)) {
      log.info(
        `[CustomCDHandlers] [PaladinOath] Tracker missing or invalid for ${abilityName} (${player})`
      );
      return;
    }

    const windows = tracker.getCooldownWindows();
    if (!Array.isArray(windows) || windows.length === 0) {
      log.debug(
        `[CustomCDHandlers] [PaladinOath] No cooldown windows found for ${abilityName}`
      );
      return;
    }

    // Find all open cooldown windows (those ending after this timestamp)
    const updated = [];
    let anyClosed = false;

    windows.forEach((lock) => {
      if (lock.end === SAFE_MAX_END) {
        const oldEnd = lock.end;
        const newEnd = Math.max(start, lock.start + 1);
        const duration = newEnd - lock.start;

        // Log full details of each resolved entry
        log.info(
          `[CustomCDHandlers] [PaladinOath] ${abilityName} lock closed for ${player}: ` +
            `start=${lock.start}, oldEnd=${oldEnd}, newEnd=${newEnd}, duration=${duration}`
        );

        updated.push({ ...lock, end: newEnd });
        anyClosed = true;
      } else {
        updated.push(lock);
      }
    });

    if (anyClosed) {
      tracker.setCooldownWindows(updated);
      log.debug(
        `[CustomCDHandlers] [PaladinOath] Updated cooldown window list persisted for ${abilityName} (${player})`
      );
    }
  });
}
