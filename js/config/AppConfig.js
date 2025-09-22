// js/config/AppConfig.js
// Configuration for job ordering in fight tables
// Jobs are grouped by role: Tanks, Healers, Melee DPS, Ranged Physical, Ranged Magical

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
