import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";
import { normalizeAbilityName } from "../utility/jobConfigHelper.js";

setModuleLogLevel("CustomCooldownHandlers", envLogLevel("debug", "warn"));
const log = getLogger("CustomCooldownHandlers");
const SAFE_MAX_END = Number.MAX_SAFE_INTEGER;

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
