// js/config/AppConfig.js
// Configuration for job ordering in fight tables
// Jobs are grouped by role: Tanks, Healers, Melee DPS, Ranged Physical, Ranged Magical

import { SageConfig } from "./jobs/SageConfig.js";
import { AstrologianConfig } from "./jobs/AstrologianConfig.js";
import { BardConfig } from "./jobs/BardConfig.js";
import { BlackMageConfig } from "./jobs/BlackMageConfig.js";
import { DancerConfig } from "./jobs/DancerConfig.js";
import { DarkKnightConfig } from "./jobs/DarkKnightConfig.js";
import { DragoonConfig } from "./jobs/DragoonConfig.js";
import { GunbreakerConfig } from "./jobs/GunbreakerConfig.js";
import { MachinistConfig } from "./jobs/MachinistConfig.js";
import { MonkConfig } from "./jobs/MonkConfig.js";
import { NinjaConfig } from "./jobs/NinjaConfig.js";
import { PaladinConfig } from "./jobs/PaladinConfig.js";
import { PictomancerConfig } from "./jobs/PictomancerConfig.js";
import { ReaperConfig } from "./jobs/ReaperConfig.js";
import { RedMageConfig } from "./jobs/RedMageConfig.js";
import { SamuraiConfig } from "./jobs/SamuraiConfig.js";
import { ScholarConfig } from "./jobs/ScholarConfig.js";
import { SummonerConfig } from "./jobs/SummonerConfig.js";
import { ViperConfig } from "./jobs/ViperConfig.js";
import { WarriorConfig } from "./jobs/WarriorConfig.js";
import { WhitemageConfig } from "./jobs/WhitemageConfig.js";

// 🔗 Map job names to config objects
const JOB_CONFIGS = {
  sage: SageConfig,
  astrologian: AstrologianConfig,
  bard: BardConfig,
  blackmage: BlackMageConfig,
  dancer: DancerConfig,
  darkknight: DarkKnightConfig,
  dragoon: DragoonConfig,
  gunbreaker: GunbreakerConfig,
  machinist: MachinistConfig,
  monk: MonkConfig,
  ninja: NinjaConfig,
  paladin: PaladinConfig,
  pictomancer: PictomancerConfig,
  reaper: ReaperConfig,
  redmage: RedMageConfig,
  samurai: SamuraiConfig,
  scholar: ScholarConfig,
  summoner: SummonerConfig,
  viper: ViperConfig,
  warrior: WarriorConfig,
  whitemage: WhitemageConfig,
  "white mage": WhitemageConfig, // allow spaced version
  "black mage": BlackMageConfig,
  "red mage": RedMageConfig,
  "dark knight": DarkKnightConfig,
};

export const JOB_ORDER = [
  // ---- Tanks ----
  "Paladin",
  "Warrior",
  "Dark Knight",
  "Gunbreaker",

  // ---- Healers ----
  "White Mage",
  "Scholar",
  "Astrologian",
  "Sage",

  // ---- Melee DPS ----
  "Monk",
  "Dragoon",
  "Ninja",
  "Samurai",
  "Reaper",
  "Viper",

  // ---- Physical Ranged DPS ----
  "Bard",
  "Machinist",
  "Dancer",

  // ---- Magical Ranged DPS ----
  "Black Mage",
  "Summoner",
  "Red Mage",
  "Pictomancer",
];

/*
 * Utility to sort actors by their configured job order.
 *
 * - Normalizes job names from FFLogs to match JOB_ORDER:
 *   e.g. "BlackMage" → "Black Mage", "DarkKnight" → "Dark Knight"
 * - If a job is not found in JOB_ORDER, it is placed at the end.
 *
 * @param {Array} actors - Array of actor objects with a `subType` field (job)
 * @returns {Array} sorted - Actors sorted by role priority
 */
export function sortActorsByJob(actors) {
  const normalize = (job) => {
    if (!job) return "";
    return job
      .replace(/[_-]/g, " ") // replace underscores/dashes with space
      .replace(/([a-z])([A-Z])/g, "$1 $2") // split camelCase / PascalCase
      .trim();
  };

  return actors.slice().sort((a, b) => {
    const jobA = normalize(a.subType);
    const jobB = normalize(b.subType);

    const idxA = JOB_ORDER.indexOf(jobA);
    const idxB = JOB_ORDER.indexOf(jobB);

    // Unknown jobs go to the bottom, but keep relative order
    const safeA = idxA === -1 ? Infinity : idxA;
    const safeB = idxB === -1 ? Infinity : idxB;

    return safeA - safeB;
  });
}

/**
 * Get CSS role class for a given job.
 *
 * Normalizes job names (e.g. "DarkKnight" → "Dark Knight") and maps them
 * to a role class used for column coloring in tables.
 *
 * @param {string} job - The job/subType string from FFLogs actor
 * @returns {string} - One of "tank-col", "healer-col", "dps-col", "unknown-col"
 */
export function getRoleClass(job) {
  if (!job) return "unknown-col";
  const normalized = job.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  if (
    ["Paladin", "Warrior", "Dark Knight", "Gunbreaker"].includes(normalized)
  ) {
    return "tank-col";
  }
  if (["White Mage", "Scholar", "Astrologian", "Sage"].includes(normalized)) {
    return "healer-col";
  }
  if (
    [
      "Monk",
      "Dragoon",
      "Ninja",
      "Samurai",
      "Reaper",
      "Viper",
      "Bard",
      "Machinist",
      "Dancer",
      "Black Mage",
      "Summoner",
      "Red Mage",
      "Pictomancer",
    ].includes(normalized)
  ) {
    return "dps-col";
  }
  return "unknown-col";
}

// 🔍 Normalizer helper
function normalizeJobName(name) {
  return name?.toLowerCase().replace(/[_\-\s]/g, ""); // strip spaces, underscores, dashes
}

/**
 * Load the job config object for a given job name.
 *
 * - Case insensitive
 * - Ignores spaces, underscores, and dashes
 * - Accepts either `JOB_ORDER` style names or config-style names
 *
 * @param {string} jobName - e.g. "Dark Knight", "darkknight", "Dark_Knight"
 * @returns {object|null} - The job config object, or null if not found
 */
export function loadJobConfig(jobName) {
  if (!jobName) return null;
  const key = normalizeJobName(jobName);
  return JOB_CONFIGS[key] || null;
}
