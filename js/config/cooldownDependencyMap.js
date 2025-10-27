import {
  normalizeAbilityName,
  normalizeJobName,
} from "../utility/jobConfigHelper.js";

/**
 * COOLDOWN_DEPENDENCY_MAP
 * --------------------------------------------------------------
 * Each entry describes *which abilities trigger additional cooldown logic*.
 */
const RAW_COOLDOWN_DEPENDENCY_MAP = [
  {
    job: "Astrologian",
    trigger: "The Bole",
    affects: ["The Bole"],
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
