import { AUTO_ATTACK_NAMES } from "./AppConfig.js";
import {
  normalizeAbilityName,
  normalizeJobName,
} from "../utility/jobConfigHelper.js";

/**
 * COOLDOWN_DEPENDENCY_MAP
 * --------------------------------------------------------------
 * Each entry describes *which abilities trigger additional cooldown logic*.
 */
// Paladin auto attacks grant Oath gauge and are handled via a custom handler.
const PALADIN_AUTO_ATTACK_ENTRIES = Array.from(AUTO_ATTACK_NAMES).map(
  (autoAttackName) => ({
    job: "Paladin",
    trigger: autoAttackName,
    affects: [],
    handler: "handlePaladinAutoAttack",
  })
);

const RAW_COOLDOWN_DEPENDENCY_MAP = [
  {
    job: "Astrologian",
    trigger: "The Bole",
    affects: ["The Bole"],
    handler: "handleAstroCardDependency",
  },
  {
    job: "Astrologian",
    trigger: "The Spire",
    affects: ["The Spire"],
    handler: "handleAstroCardDependency",
  },
  {
    job: "Astrologian",
    trigger: "Umbral Draw",
    affects: ["The Bole"],
    handler: "handleAstroCardDependency",
  },
  {
    job: "Astrologian",
    trigger: "Astral Draw",
    affects: ["The Spire"],
    handler: "handleAstroCardDependency",
  },
  {
    job: "Astrologian",
    trigger: "Umbral Draw",
    affects: ["Astral Draw"],
    handler: "handleMutualCardCooldown",
  },
  {
    job: "Astrologian",
    trigger: "Astral Draw",
    affects: ["Umbral Draw"],
    handler: "handleMutualCardCooldown",
  },
  {
    job: "Dark Knight",
    trigger: "Oblation",
    affects: [],
    handler: "handleChargedCooldown",
    maxCharges: 2,
  },
  {
    job: "White Mage",
    trigger: "Divine Benison",
    affects: [],
    handler: "handleChargedCooldown",
    maxCharges: 2,
  },
  {
    job: "Summoner",
    trigger: "Radiant Aegis",
    affects: [],
    handler: "handleChargedCooldown",
    maxCharges: 2,
  },
  {
    job: "Paladin",
    trigger: "Intervention",
    affects: ["Intervention"],
    handler: "handlePaladinOathAbility",
  },
  {
    job: "Paladin",
    trigger: "Sheltron",
    affects: ["Sheltron"],
    handler: "handlePaladinOathAbility",
  },
  {
    job: "Paladin",
    trigger: "Holy Sheltron",
    affects: ["Holy Sheltron"],
    handler: "handlePaladinOathAbility",
  },
  ...PALADIN_AUTO_ATTACK_ENTRIES,
];

// Normalize trigger/affect names immediately upon load
export const COOLDOWN_DEPENDENCY_MAP = RAW_COOLDOWN_DEPENDENCY_MAP.map(
  (entry) => {
    const normalizedJob =
      entry.job && entry.job.toLowerCase() !== "any"
        ? normalizeJobName(entry.job)
        : "any";

    return {
      ...entry,
      job: normalizedJob,
      trigger: normalizeAbilityName(entry.trigger),
      affects: entry.affects.map((a) => normalizeAbilityName(a)),
    };
  }
);
