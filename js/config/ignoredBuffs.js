/**
 * List of buffs/debuffs to globally ignore in parsing and crediting.
 *
 * ⚠️ Important: Keep this centralized for maintainability.
 * Add any new buffs that should not be credited (food, vulnerability markers, etc).
 */
export const IGNORED_BUFFS = new Set([
  "Well Fed",
  "Well-Done, Steak",
  "Physical Vulnerability Up",
  "Magic Vulnerability Up",
  "Vulnerability Up",
  // add more here as needed
]);
