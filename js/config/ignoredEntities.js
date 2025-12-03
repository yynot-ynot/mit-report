/**
 * List of buffs/debuffs to globally ignore in parsing and crediting.
 *
 * ⚠️ Important: Keep this centralized for maintainability.
 * Add any new buffs that should not be credited (food, vulnerability markers, etc).
 */
export const IGNORED_BUFFS = new Set([
  "Medicated",
  "Well Fed",
  "Well-Done, Steak",
  "Physical Vulnerability Up",
  "Magic Vulnerability Up",
  "Vulnerability Up",
  // add more here as needed
]);

/**
 * Define mitigation abilities that cannot coexist within a single fight.
 *
 * Each entry describes a job-specific group of abilities where only one
 * variant should ever appear in parsed casts (e.g., level-up replacements).
 * When multiple abilities from the same group are detected during a fight,
 * the analysis layer logs an error so the dataset can be corrected.
 */
export const MUTUALLY_EXCLUSIVE_MITIGATIONS = [
  {
    job: "Paladin",
    groupId: "paladin_sheltron_variants",
    abilities: ["Sheltron", "Holy Sheltron"],
  },
  {
    job: "Paladin",
    groupId: "paladin_sentinel_variants",
    abilities: ["Sentinel", "Guardian"],
  },
  {
    job: "Warrior",
    groupId: "warrior_vengeance_variants",
    abilities: ["Vengeance", "Damnation"],
  },
  {
    job: "Dark Knight",
    groupId: "darkknight_shadowwall_variants",
    abilities: ["Shadow Wall", "Shadowed Vigil"],
  },
  {
    job: "Gunbreaker",
    groupId: "gunbreaker_nebula_variants",
    abilities: ["Nebula", "Great Nebula"],
  },
];
