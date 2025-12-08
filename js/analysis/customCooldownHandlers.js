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
import { formatRelativeTime } from "../utility/dataUtils.js";

setModuleLogLevel("CustomCooldownHandlers", envLogLevel("warn", "warn"));
const log = getLogger("CustomCooldownHandlers");
const SAFE_MAX_END = Number.MAX_SAFE_INTEGER;

/**
 * Paladin-specific job identifier used by handler guard clauses.
 * Matches the normalized name emitted by `normalizeJobName`.
 */
export const PALADIN_JOB = "paladin";
/**
 * Oath gauge cost (in units) consumed by Intervention/Sheltron casts.
 */
const OATH_COST = 50;
export const PALADIN_OATH_COST = OATH_COST;
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

const FALLBACK_OATH_GAUGE = new Map();

function setFallbackGauge(player, value) {
  if (!player) return;
  if (!Number.isFinite(value)) {
    FALLBACK_OATH_GAUGE.delete(player);
    return;
  }
  FALLBACK_OATH_GAUGE.set(player, clampGauge(value));
}

function getFallbackGauge(player) {
  if (!player) return null;
  const value = FALLBACK_OATH_GAUGE.get(player);
  return Number.isFinite(value) ? value : null;
}

// Fetch and validate Paladin mitigation abilities dynamically
let PALADIN_OATH_ABILITIES = new Set();
try {
  const allMitNames =
    getMitigationAbilityNames("Paladin").map(normalizeAbilityName);
  const intendedAbilities = ["Intervention", "Sheltron", "Holy Sheltron"].map(
    normalizeAbilityName
  );

  PALADIN_OATH_ABILITIES = new Set(intendedAbilities);

  const missing = intendedAbilities.filter(
    (name) => !allMitNames.includes(name)
  );
  const present = intendedAbilities.filter((name) =>
    allMitNames.includes(name)
  );

  if (missing.length > 0) {
    log.info(
      `[CustomCDHandlers] [PaladinOath] Missing expected abilities in mitigation config: ${missing.join(
        ", "
      )}`
    );
  } else {
    log.debug(
      `[CustomCDHandlers] [PaladinOath] All Oath-based abilities verified in config: ${present.join(
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
 * Retrieve (or initialize) the per-tracker state used for charged cooldowns.
 *
 * Each charged ability needs to remember how many charges remain, how much
 * progress has been made toward the next recharge (`remainderMs`), and the
 * last timestamp when accounting took place. Attaching that object directly to
 * the `CastCooldownTracker` keeps the cache scoped to the current fight/player.
 *
 * @param {CastCooldownTracker|null} tracker - Tracker backing the charged ability.
 * @param {number} maxCharges - Declared maximum number of charges.
 * @returns {{maxCharges:number, charges:number, remainderMs:number, lastTimestamp:number|null}|null}
 */
function getChargedCooldownState(tracker, maxCharges) {
  if (!(tracker instanceof CastCooldownTracker)) return null;
  const normalizedCharges = Number.isFinite(maxCharges)
    ? Math.max(1, Math.floor(maxCharges))
    : 1;
  let state = tracker.__chargedCooldownState;
  if (!state || state.maxCharges !== normalizedCharges) {
    state = {
      maxCharges: normalizedCharges,
      charges: normalizedCharges,
      remainderMs: 0,
      lastTimestamp: null,
    };
    tracker.__chargedCooldownState = state;
  }
  return state;
}

/**
 * Apply elapsed time toward charge regeneration before spending a new charge.
 *
 * @param {Object} state - Object returned from `getChargedCooldownState`.
 * @param {number} timestamp - Current cast timestamp (ms, relative to fight start).
 * @param {number} baseCooldown - Ability cooldown length (ms).
 */
function settleChargedCooldownState(state, timestamp, baseCooldown) {
  if (!state || !Number.isFinite(timestamp) || !Number.isFinite(baseCooldown)) {
    return;
  }

  const lastTs = Number.isFinite(state.lastTimestamp)
    ? state.lastTimestamp
    : timestamp;
  let elapsed = timestamp - lastTs;
  if (!Number.isFinite(elapsed) || elapsed <= 0) {
    state.lastTimestamp = timestamp;
    if (state.charges >= state.maxCharges) {
      state.remainderMs = 0;
    }
    return;
  }

  if (state.charges >= state.maxCharges) {
    state.remainderMs = 0;
    state.lastTimestamp = timestamp;
    return;
  }

  const carried = state.remainderMs || 0;
  const total = Math.max(0, elapsed + carried);
  if (total < baseCooldown) {
    state.remainderMs = total;
    state.lastTimestamp = timestamp;
    return;
  }

  const gained = Math.floor(total / baseCooldown);
  state.charges = Math.min(state.maxCharges, state.charges + gained);
  if (state.charges === state.maxCharges) {
    state.remainderMs = 0;
  } else {
    state.remainderMs = total % baseCooldown;
  }
  state.lastTimestamp = timestamp;
}

const DEBUG_PAL_OATH =
  (typeof process !== "undefined" && process?.env?.DEBUG_PAL_OATH === "true") ||
  (typeof globalThis !== "undefined" && globalThis?.DEBUG_PAL_OATH === true);

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
 * scoped to a single fight/report and mirrors updates into the fallback cache.
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
    setFallbackGauge(player, next);
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
    setFallbackGauge(player, next);
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
 * lockPaladinOathAbilities()
 * --------------------------------------------------------------
 * Low-level helper that appends MAX_SAFE_INT cooldown windows for the
 * core Paladin mitigation trio (Holy Sheltron, Intervention, Sheltron).
 * Callers can optionally provide `extraAbilities` when the triggering
 * cast is not part of the standard trio (e.g., Holy Sheltron variants in
 * localized logs) and may forward the shared `oathContext` so downstream
 * handlers can reconstruct gauge state when needed.
 */
export function lockPaladinOathAbilities({
  playerName,
  trackerMap,
  start,
  baseCooldown,
  extraAbilities = [],
  oathContextRef = null,
  gaugeOverride = null,
}) {
  if (!playerName || !trackerMap || !Number.isFinite(start)) return;

  const normalizedCooldown =
    Number.isFinite(baseCooldown) && baseCooldown > 0 ? baseCooldown : 0;

  const normalizedExtras = Array.isArray(extraAbilities)
    ? extraAbilities
        .map((ability) => normalizeAbilityName(ability))
        .filter(Boolean)
    : [];

  const extraAbilitySet = new Set(normalizedExtras);

  const abilitiesToLock = new Set([
    ...PALADIN_OATH_ABILITIES,
    ...extraAbilitySet,
  ]);

  if (abilitiesToLock.size === 0) return;

  if (Number.isFinite(gaugeOverride)) {
    setFallbackGauge(playerName, gaugeOverride);
  } else if (!FALLBACK_OATH_GAUGE.has(playerName)) {
    setFallbackGauge(playerName, 0);
  }

  abilitiesToLock.forEach((oathAbility) => {
    const key = buildTrackerKey(playerName, oathAbility);
    if (!key) return;

    let targetTracker = trackerMap.get(key);
    if (!targetTracker) {
      targetTracker = new CastCooldownTracker(
        oathAbility,
        playerName,
        PALADIN_JOB,
        normalizedCooldown
      );
      trackerMap.set(key, targetTracker);
    }
    if (oathContextRef && typeof oathContextRef === "object") {
      targetTracker.__oathContext = oathContextRef;
    }

    const shouldReplaceExisting = extraAbilitySet.has(oathAbility);
    if (shouldReplaceExisting) {
      const windows = targetTracker.getCooldownWindows();
      const nextWindows = [
        ...windows.filter(
          (window) => !(window.start === start && window.end === SAFE_MAX_END)
        ),
        { start, end: SAFE_MAX_END },
      ];
      targetTracker.setCooldownWindows(nextWindows);
      return;
    }

    addResourceLockWindow(targetTracker, start);
  });
}

/**
 * ensurePaladinOathLock()
 * --------------------------------------------------------------
 * Centralized gauge gatekeeper used by CastAnalysis and unit tests to
 * decide when Paladin mitigation abilities should be forced into a
 * resource-lock window (end === MAX_SAFE_INT).
 *
 * The helper inspects the live `oathContext` when available, falls back
 * to locally cached gauge readings when handlers are invoked without a
 * persistent context (e.g., isolated unit tests), and records the lock
 * by delegating to `lockPaladinOathAbilities`.
 */
export function ensurePaladinOathLock({
  playerName,
  trackerMap,
  startTime,
  oathContext,
  baseCooldown,
  extraAbilities = [],
  gaugeOverride = null,
}) {
  if (!playerName || !trackerMap || !Number.isFinite(startTime)) return;

  const threshold = Number.isFinite(PALADIN_OATH_COST) ? PALADIN_OATH_COST : 50;

  // Step 1: Resolve the best available gauge reading (live context → gaugeOverride → fallback cache).
  const contextGauge =
    typeof oathContext?.getGauge === "function"
      ? oathContext.getGauge(playerName)
      : null;

  const fallbackGauge = getFallbackGauge(playerName);
  let gauge = Number.isFinite(gaugeOverride)
    ? gaugeOverride
    : Number.isFinite(contextGauge)
    ? contextGauge
    : fallbackGauge ?? STARTING_OATH;

  if (!Number.isFinite(gauge)) return;

  setFallbackGauge(
    playerName,
    Number.isFinite(contextGauge) ? contextGauge : gauge
  );

  // Step 2: If the Paladin still has enough gauge there is nothing to do.
  if (gauge >= threshold) {
    return;
  }

  // Step 3: Delegate to the raw lock helper so every Oath ability records an open window.
  lockPaladinOathAbilities({
    playerName,
    trackerMap,
    start: startTime,
    baseCooldown,
    extraAbilities,
    oathContextRef: oathContext,
    gaugeOverride: gauge,
  });
}

/**
 * handlePaladinDeathLock()
 * --------------------------------------------------------------
 * Resets Oath gauge immediately after a Paladin death and records a
 * resource lock at the death timestamp so that mitigation abilities
 * remain unavailable until auto attacks rebuild the gauge.
 */
export function handlePaladinDeathLock({
  playerName,
  normalizedJob,
  deathRelativeTime = null,
  deathRawTimestamp = null,
  fightStartTime = 0,
  oathContext,
  trackerMap,
}) {
  if (normalizedJob !== PALADIN_JOB || !playerName) return;
  if (
    !trackerMap ||
    !(trackerMap instanceof Map) ||
    !oathContext ||
    typeof oathContext._ensurePlayer !== "function"
  ) {
    return;
  }

  // Step 1: Zero the live oathContext state and sync the fallback cache.
  const state = oathContext._ensurePlayer(playerName);
  if (state) {
    state.gauge = 0;
    setFallbackGauge(playerName, 0);
  }

  // Step 2: Convert the death timestamp into the same relative scale used by casts.
  const startTime = Number.isFinite(deathRelativeTime)
    ? deathRelativeTime
    : Number.isFinite(deathRawTimestamp)
    ? deathRawTimestamp - fightStartTime
    : null;
  if (!Number.isFinite(startTime)) return;

  // Step 3: Reuse the generic lock helper so the trio stays disabled until OG recovers.
  ensurePaladinOathLock({
    playerName,
    trackerMap,
    startTime,
    oathContext,
    baseCooldown: null,
    extraAbilities: [],
    gaugeOverride: 0,
  });
}

/**
 * handleAstroCardDependency()
 * --------------------------------------------------------------
 * Models the Astrologian card flow for deck abilities such as The Bole and
 * The Spire. Card vs. draw behavior is driven entirely by the dependency map:
 *   - If the `depConfig.trigger` also appears in `depConfig.affects`, this
 *     handler treats the cast as a **card** being played.
 *   - Otherwise, the trigger is considered a **draw** action that releases the
 *     cards listed in `depConfig.affects`.
 *
 * Behavior:
 *   1. When a *card* action (e.g., The Bole) is cast, the handler records an
 *      indefinite cooldown window (`start → SAFE_MAX_END`). This mirrors in-game
 *      behaviour where the card cannot be redrawn until the next appropriate
 *      draw action is used.
 *   2. When the complementary draw (Umbral or Astral) fires, the handler walks
 *      all affected card trackers in `depConfig.affects` and collapses their
 *      most recent placeholder window to end at the draw timestamp, restoring
 *      availability for downstream consumers.
 *
 * The dependency map controls which trigger maps to which card(s), so extending
 * coverage to additional arcanum only requires new entries in the map.
 * Any trigger that is not part of this relationship falls back to the default
 * cooldown generator.
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

  // 🧠 Data-driven inputs: the dependency map dictates which card ability names
  // this trigger influences via `depConfig.affects`. If the trigger itself is
  // inside that list the handler treats it as the card cast; otherwise it is the
  // paired draw action that should resolve those cards.
  const affectedAbilities = (depConfig.affects || [])
    .map(normalizeAbilityName)
    .filter(Boolean);
  if (affectedAbilities.length === 0) {
    if (typeof defaultAddCooldown === "function") {
      defaultAddCooldown();
    }
    return;
  }

  // Card detection: trigger ∈ affects → card cast, trigger ∉ affects → draw.
  const isCardCast = affectedAbilities.includes(trigger);
  const resolveLabel = (ability) => {
    const original = (depConfig.affects || []).find(
      (name) => normalizeAbilityName(name) === ability
    );
    return original || ability;
  };

  if (isCardCast) {
    if (!triggerTracker) {
      log.debug(
        `[CustomCDHandlers] [AstroDependency] Missing tracker for ${resolveLabel(
          trigger
        )} (${player}); cannot record cooldown.`
      );
      return;
    }

    triggerTracker.addCooldown(start, SAFE_MAX_END);
    return;
  }

  affectedAbilities.forEach((abilityName) => {
    const key = buildTrackerKey(player, abilityName);
    if (!key) return;
    const tracker = trackerMap.get(key);
    if (!tracker) return;

    const windows = tracker.getCooldownWindows();
    if (!Array.isArray(windows) || windows.length === 0) return;

    const lastWindow = windows[windows.length - 1];
    if (lastWindow.end !== SAFE_MAX_END) return;

    const resolvedEnd = start > lastWindow.start ? start : lastWindow.start + 1;
    if (resolvedEnd <= lastWindow.start) return;

    const updatedWindows = [
      ...windows.slice(0, -1),
      { ...lastWindow, end: resolvedEnd },
    ];
    tracker.setCooldownWindows(updatedWindows);
  });

  return;
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
 * handleChargedCooldown()
 * --------------------------------------------------------------
 * Manages mitigation abilities that regenerate via a limited set of shared
 * charges (e.g., Oblation, Divine Benison, Radiant Aegis). The handler keeps
 * per-player accounting data so it can determine how many charges remain and
 * how much time has accrued toward the next recharge.
 *
 * Behavior:
 *   1. `depConfig.maxCharges` declares the hard cap for that ability.
 *   2. Each cast runs a settlement pass that:
 *        - Computes the elapsed time since the last accounting event.
 *        - Adds any carried remainder from the previous pass.
 *        - Awards `floor(total / cooldown)` charges (up to the cap) and stores
 *          the leftover remainder, resetting it to 0 whenever the cap is
 *          reached because no recharge is running at that point.
 *   3. After settlement the handler spends one charge. If that spend leaves the
 *      player with zero charges, it records a cooldown window whose end is the
 *      earliest timestamp a charge will regenerate
 *      (`cooldown - accumulatedProgress`).
 *   4. When at least one charge remains, no cooldown window is recorded so the
 *      ability stays immediately castable.
 *
 * State is stored on the corresponding `CastCooldownTracker` instance so each
 * fight/player pair keeps isolated accounting (no cross-fight cache bleed).
 */
export function handleChargedCooldown({
  depConfig,
  cast,
  trackerMap,
  actorById,
  fight,
  start,
  triggerTracker,
  cooldownInfo,
  defaultAddCooldown,
  normalizedAbility,
}) {
  const player = cast?.source;
  if (!player || !Number.isFinite(start)) {
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  const abilityName =
    normalizedAbility || normalizeAbilityName(cast?.ability || "");
  if (!abilityName) {
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  const maxCharges = Number.isFinite(depConfig?.maxCharges)
    ? Math.max(1, Math.floor(depConfig.maxCharges))
    : null;
  if (!Number.isFinite(maxCharges) || maxCharges <= 1) {
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  if (!(triggerTracker instanceof CastCooldownTracker)) {
    log.debug(
      `[CustomCDHandlers] [Charged] Missing tracker for ${cast.ability} (${player}); falling back to default cooldown.`
    );
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  const baseCooldown =
    cooldownInfo?.cooldownMs ?? triggerTracker.getBaseCooldownMs();
  if (!Number.isFinite(baseCooldown) || baseCooldown <= 0) {
    log.warn(
      `[CustomCDHandlers] [Charged] Missing cooldown data for ${cast.ability} (${player}); using default handler.`
    );
    if (typeof defaultAddCooldown === "function") defaultAddCooldown();
    return;
  }

  const jobName =
    typeof triggerTracker.getJobName === "function"
      ? triggerTracker.getJobName()
      : null;
  const fightStartTime =
    typeof fight?.startTime === "number" ? fight.startTime : 0;
  const absoluteTs = start + fightStartTime;
  const readableTime = formatRelativeTime(absoluteTs, fightStartTime);
  const beforeWindows = triggerTracker.getCooldownWindows();
  const latestBeforeWindow =
    Array.isArray(beforeWindows) && beforeWindows.length > 0
      ? beforeWindows[beforeWindows.length - 1]
      : null;

  const state = getChargedCooldownState(triggerTracker, maxCharges);
  if (state) {
    log.debug(`[CustomCDHandlers] [Charged] BEFORE accounting`, {
      player,
      job: jobName,
      ability: cast.ability,
      timeMs: start,
      time: readableTime,
      charges: state.charges,
      remainderMs: state.remainderMs || 0,
      latestWindow: latestBeforeWindow,
    });
  }

  settleChargedCooldownState(state, start, baseCooldown);

  const chargesBeforeCast = state.charges;
  const remainderBeforeCast = state.remainderMs || 0;

  if (chargesBeforeCast <= 0) {
    log.warn(
      `[CustomCDHandlers] [Charged] ${player} cast ${cast.ability} with no charges available; treating as immediate spend.`
    );
  }

  state.charges = Math.max(0, state.charges - 1);
  const chargesAfterCast = state.charges;

  if (chargesAfterCast === 0) {
    const timeUntilNextCharge =
      remainderBeforeCast > 0 && remainderBeforeCast < baseCooldown
        ? baseCooldown - remainderBeforeCast
        : baseCooldown;
    const windowEnd = start + timeUntilNextCharge;
    triggerTracker.addCooldown(start, windowEnd);
  }

  const afterWindows = triggerTracker.getCooldownWindows();
  const latestAfterWindow =
    Array.isArray(afterWindows) && afterWindows.length > 0
      ? afterWindows[afterWindows.length - 1]
      : null;
  log.debug(`[CustomCDHandlers] [Charged] AFTER accounting`, {
    player,
    job: jobName,
    ability: cast.ability,
    timeMs: start,
    time: readableTime,
    charges: state.charges,
    remainderMs: state.remainderMs || 0,
    latestWindow: latestAfterWindow,
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
  setFallbackGauge(player, gaugeAfter);

  if (gaugeBefore < OATH_COST) {
    log.warn(
      `[CustomCDHandlers] [PaladinOath] WARNING: ${player} attempted to cast ${cast.ability} with insufficient Oath (${gaugeBefore}).` +
        ` This indicates OG < 50 but ability was still cast; existing lock should be reused instead of adding a new one.`
    );
  }

  // Lock application moved to CastAnalysis so we only inspect gauge deltas once per cast.
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
 *   - When invoked without a persistent `oathContext` (common in tests),
 *     a fallback gauge cache is consulted so auto-attack sequences still
 *     resolve locks deterministically.
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

  let context = oathContext;
  if (
    (!context || typeof context.getGauge !== "function") &&
    trackerMap instanceof Map
  ) {
    context = resolveOathContextFromTrackers(trackerMap, player);
  }

  const contextGauge =
    typeof context?.getGauge === "function" ? context.getGauge(player) : null;
  const fallbackGauge = getFallbackGauge(player);
  let gaugeBefore = Number.isFinite(contextGauge)
    ? contextGauge
    : fallbackGauge ?? STARTING_OATH;
  let usedFallback = false;
  if (
    Number.isFinite(fallbackGauge) &&
    (!Number.isFinite(gaugeBefore) || fallbackGauge > gaugeBefore)
  ) {
    gaugeBefore = fallbackGauge;
    usedFallback = true;
  }
  log.debug(
    `[CustomCDHandlers] [PaladinOath] Current OG for ${player} before auto attack: ${gaugeBefore}`
  );

  const gaugeAfter =
    !usedFallback && typeof context?.gainGauge === "function"
      ? context.gainGauge(player, OATH_GAIN)
      : gaugeBefore + OATH_GAIN;
  setFallbackGauge(player, gaugeAfter);

  log.debug(
    `[CustomCDHandlers] [PaladinOath] Auto attack for ${player}; gauge ${gaugeBefore} -> ${gaugeAfter}`
  );
  if (DEBUG_PAL_OATH) {
    console.log(
      `[DEBUG_PAL_OATH] auto ${player} gauge ${gaugeBefore} -> ${gaugeAfter}`
    );
  }

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
        if (DEBUG_PAL_OATH) {
          console.log(
            `[DEBUG_PAL_OATH] closed ${abilityName} for ${player}: start=${lock.start}, newEnd=${newEnd}`
          );
        }

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
