/**
 * knownBuffJobs.js
 * ----------------
 * Auto-generated mapping of known buff names → their associated jobs.
 * Each key maps to an array of one or more job strings.
 * Ordered by shared → job-specific per JOB_ORDER.
 */

export const KNOWN_BUFF_JOBS = {
  // ==========================================================
  // 🛡️ Shared Tank Cooldowns
  // ==========================================================
  rampart: ["Paladin", "Warrior", "Gunbreaker", "DarkKnight"],
  reprisal: ["Paladin", "Warrior", "Gunbreaker", "DarkKnight"],

  // ==========================================================
  // ✨ Shared Healer Utilities
  // ==========================================================
  "sacred soil": ["Scholar"],
  "neutral sect": ["Astrologian"],
  "fey illumination": ["Scholar"],
  temperance: ["WhiteMage"],

  // ==========================================================
  // ⚔️ Shared Melee Debuff
  // ==========================================================
  feint: ["Monk", "Samurai", "Ninja", "Dragoon", "Reaper", "Viper"],

  // ==========================================================
  // 🏹 Shared Physical Ranged
  // ==========================================================
  troubadour: ["Bard"],
  tactician: ["Machinist"],
  "shield samba": ["Dancer"],

  // ==========================================================
  // 🔮 Shared Magical Debuff / Mitigation
  // ==========================================================
  addle: ["Blackmage", "Summoner", "RedMage", "Pictomancer"],
  "magick barrier": ["RedMage"],

  // ==========================================================
  // ---- Tanks ----
  // ==========================================================
  // ⚔️ Paladin
  sheltron: ["Paladin"],
  sentinel: ["Paladin"],
  intervention: ["Paladin"],
  "knight's resolve": ["Paladin"],
  "passage of arms": ["Paladin"],
  "holy sheltron": ["Paladin"],
  guardian: ["Paladin"],
  "arms up": ["Paladin"],
  "guardian's will": ["Paladin"],
  "divine veil": ["Paladin"],

  // 🪓 Warrior
  vengeance: ["Warrior"],
  "raw intuition": ["Warrior"],
  "nascent glint": ["Warrior"],
  "nascent flash": ["Warrior"],
  "stem the flow": ["Warrior"],
  "stem the tide": ["Warrior"],
  bloodwhetting: ["Warrior"],
  damnation: ["Warrior"],
  "thrill of battle": ["Warrior"],

  // 🦇 Dark Knight
  "shadow wall": ["DarkKnight"],
  "dark mind": ["DarkKnight"],
  "dark missionary": ["DarkKnight"],
  oblation: ["DarkKnight"],
  "shadowed vigil": ["DarkKnight"],
  vigilant: ["DarkKnight"], // From Shadowed Vigil (grants Vigilant effect)
  "blood weapon": ["DarkKnight"],
  "the blackest night": ["DarkKnight"],
  "blackest night": ["DarkKnight"],
  "living dead": ["DarkKnight"],
  "undead rebirth": ["DarkKnight"], // From Living Dead (revival state)

  // 🔫 Gunbreaker
  camouflage: ["Gunbreaker"],
  nebula: ["Gunbreaker"],
  "great nebula": ["Gunbreaker"],
  "heart of light": ["Gunbreaker"],
  "heart of stone": ["Gunbreaker"],
  "heart of corundum": ["Gunbreaker"],
  "clarity of corundum": ["Gunbreaker"],
  "brutal shell": ["Gunbreaker"],
  superbolide: ["Gunbreaker"],

  // ==========================================================
  // ---- Healers ----
  // ==========================================================
  // 🩺 White Mage
  temperance: ["WhiteMage"],
  aquaveil: ["WhiteMage"],

  // 🧝 Scholar
  "fey illumination": ["Scholar"],
  "sacred soil": ["Scholar"],
  "desperate measures": ["Scholar"],
  "seraphic illumination": ["Scholar"],
  "seraphic veil": ["Scholar"],
  galvanize: ["Scholar"],
  protraction: ["Scholar"],
  catalyze: ["Scholar"], // From Adloquium (creates Galvanize + Catalyze shields)

  // 🔮 Astrologian
  "collective unconscious": ["Astrologian"],
  exaltation: ["Astrologian"],
  "sun sign": ["Astrologian"],
  "the bole": ["Astrologian"],
  "neutral sect": ["Astrologian"],
  intersection: ["Astrologian"],

  // 🧙 Sage
  kerachole: ["Sage"],
  taurochole: ["Sage"],
  holos: ["Sage"],
  panhaima: ["Sage"],
  "eukrasian prognosis": ["Sage"],

  // ==========================================================
  // ---- Melee DPS ----
  // ==========================================================
  // 🥋 Monk
  "riddle of earth": ["Monk"],
  "earth's resolve": ["Monk"], // From Riddle of Earth (Earth's Resolve effect)

  // 🐉 Dragoon (no unique mitigation buffs)
  // ⚔️ Ninja (no unique mitigation buffs)
  // 🗡️ Samurai
  "third eye": ["Samurai"],
  tengentsu: ["Samurai"],
  "tengentsu's foresight": ["Samurai"],

  // ☠️ Reaper
  "crest of time borrowed": ["Reaper"], // From Arcane Crest (self barrier)
  "crest of time returned": ["Reaper"], // From Arcane Crest (party regen after barrier breaks)

  // 🐍 Viper (shares Feint)

  // ==========================================================
  // ---- Physical Ranged DPS ----
  // ==========================================================
  // 🎵 Bard
  troubadour: ["Bard"],
  "army's paeon": ["Bard"],

  // ⚙️ Machinist
  tactician: ["Machinist"],
  dismantle: ["Machinist"],

  // 🩰 Dancer
  "improvised finish": ["Dancer"],
  "rising rhythm": ["Dancer"],
  "shield samba": ["Dancer"],

  // ==========================================================
  // ---- Magical Ranged DPS ----
  // ==========================================================
  // 🔥 Black Mage
  manaward: ["BlackMage"],
  // 💫 Summoner
  "radiant aegis": ["Summoner"],

  // ❤️ Red Mage
  "magick barrier": ["RedMage"],

  // 🎨 Pictomancer
  "tempera grassa": ["Pictomancer"],
};

/**
 * Fallback lookup: checks the knownBuffJobs config when other lookups fail.
 *
 * @param {string} buffName - The buff to check (case-insensitive)
 * @returns {string|null} - Job name if found, otherwise null
 */
export function getKnownBuffJob(buffName) {
  if (!buffName) return null;
  const normalized = buffName.trim().toLowerCase();
  return KNOWN_BUFF_JOBS[normalized] || null;
}
