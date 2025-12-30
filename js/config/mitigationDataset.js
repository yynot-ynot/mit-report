const mitigationData = {
  "mitigationEffects": {
    "Blackmage": [
      {
        "name": "Addle",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "physical damage",
        "source_job": "Blackmage",
        "granted_by": null,
        "parent_ability": "Addle"
      },
      {
        "name": "Addle",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "magical damage",
        "source_job": "Blackmage",
        "granted_by": null,
        "parent_ability": "Addle"
      },
      {
        "name": "Manaward",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Blackmage",
        "granted_by": "Manaward",
        "parent_ability": "Manaward"
      }
    ],
    "Darkknight": [
      {
        "name": "Shadow Wall",
        "type": "reduction",
        "target": "self",
        "amount": 30,
        "condition": null,
        "source_job": "Darkknight",
        "granted_by": null,
        "parent_ability": "Shadow Wall"
      },
      {
        "name": "Dark Mind",
        "type": "reduction",
        "target": "self",
        "amount": 10,
        "condition": "physical damage",
        "source_job": "Darkknight",
        "granted_by": null,
        "parent_ability": "Dark Mind"
      },
      {
        "name": "Dark Mind",
        "type": "reduction",
        "target": "self",
        "amount": 20,
        "condition": "magical damage",
        "source_job": "Darkknight",
        "granted_by": null,
        "parent_ability": "Dark Mind"
      },
      {
        "name": "Dark Missionary",
        "type": "reduction",
        "target": "party",
        "amount": 5,
        "condition": "physical damage",
        "source_job": "Darkknight",
        "granted_by": null,
        "parent_ability": "Dark Missionary"
      },
      {
        "name": "Dark Missionary",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": "magical damage",
        "source_job": "Darkknight",
        "granted_by": null,
        "parent_ability": "Dark Missionary"
      },
      {
        "name": "Oblation",
        "type": "reduction",
        "target": "ally",
        "amount": 10,
        "condition": null,
        "source_job": "Darkknight",
        "granted_by": null,
        "parent_ability": "Oblation"
      },
      {
        "name": "Shadowed Vigil",
        "type": "reduction",
        "target": "self",
        "amount": 40,
        "condition": null,
        "source_job": "Darkknight",
        "granted_by": null,
        "parent_ability": "Shadowed Vigil"
      },
      {
        "name": "Rampart",
        "type": "reduction",
        "target": "self",
        "amount": 20,
        "condition": null,
        "source_job": "Darkknight",
        "granted_by": null,
        "parent_ability": "Rampart"
      },
      {
        "name": "Reprisal",
        "type": "debuff",
        "target": "enemy",
        "amount": 10,
        "condition": null,
        "source_job": "Darkknight",
        "granted_by": null,
        "parent_ability": "Reprisal"
      },
      {
        "name": "The Blackest Night",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Darkknight",
        "granted_by": "The Blackest Night",
        "parent_ability": "The Blackest Night"
      }
    ],
    "Scholar": [
      {
        "name": "Fey Illumination",
        "type": "reduction",
        "target": "party",
        "amount": 5,
        "condition": "magical damage",
        "source_job": "Scholar",
        "granted_by": null,
        "parent_ability": "Fey Illumination"
      },
      {
        "name": "Fey Illumination",
        "type": "reduction",
        "target": "party",
        "amount": 5,
        "condition": "magical damage",
        "source_job": "Scholar",
        "granted_by": "Fey Illumination",
        "parent_ability": "Fey Illumination"
      },
      {
        "name": "Sacred Soil",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": null,
        "source_job": "Scholar",
        "granted_by": null,
        "parent_ability": "Sacred Soil"
      },
      {
        "name": "Desperate Measures",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": null,
        "source_job": "Scholar",
        "granted_by": "Expedient",
        "parent_ability": "Expedient"
      },
      {
        "name": "Seraphic Illumination",
        "type": "reduction",
        "target": "party",
        "amount": 5,
        "condition": "magical damage",
        "source_job": "Scholar",
        "granted_by": null,
        "parent_ability": "Seraphic Illumination"
      },
      {
        "name": "Consolation",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Scholar",
        "granted_by": "Consolation",
        "parent_ability": "Consolation"
      },
      {
        "name": "Protraction",
        "type": "special",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Scholar",
        "granted_by": "Protraction",
        "parent_ability": "Protraction"
      }
    ],
    "Gunbreaker": [
      {
        "name": "Camouflage",
        "type": "reduction",
        "target": "self",
        "amount": 10,
        "condition": null,
        "source_job": "Gunbreaker",
        "granted_by": null,
        "parent_ability": "Camouflage"
      },
      {
        "name": "Nebula",
        "type": "reduction",
        "target": "self",
        "amount": 30,
        "condition": null,
        "source_job": "Gunbreaker",
        "granted_by": null,
        "parent_ability": "Nebula"
      },
      {
        "name": "Heart of Light",
        "type": "reduction",
        "target": "party",
        "amount": 5,
        "condition": "physical damage",
        "source_job": "Gunbreaker",
        "granted_by": null,
        "parent_ability": "Heart of Light"
      },
      {
        "name": "Heart of Light",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": "magical damage",
        "source_job": "Gunbreaker",
        "granted_by": null,
        "parent_ability": "Heart of Light"
      },
      {
        "name": "Heart of Stone",
        "type": "reduction",
        "target": "ally",
        "amount": 15,
        "condition": null,
        "source_job": "Gunbreaker",
        "granted_by": null,
        "parent_ability": "Heart of Stone"
      },
      {
        "name": "Heart of Corundum",
        "type": "reduction",
        "target": "ally",
        "amount": 15,
        "condition": null,
        "source_job": "Gunbreaker",
        "granted_by": null,
        "parent_ability": "Heart of Corundum"
      },
      {
        "name": "Clarity of Corundum",
        "type": "reduction",
        "target": "ally",
        "amount": 15,
        "condition": null,
        "source_job": "Gunbreaker",
        "granted_by": "Heart of Corundum",
        "parent_ability": "Heart of Corundum"
      },
      {
        "name": "Great Nebula",
        "type": "reduction",
        "target": "self",
        "amount": 40,
        "condition": null,
        "source_job": "Gunbreaker",
        "granted_by": null,
        "parent_ability": "Great Nebula"
      },
      {
        "name": "Rampart",
        "type": "reduction",
        "target": "self",
        "amount": 20,
        "condition": null,
        "source_job": "Gunbreaker",
        "granted_by": null,
        "parent_ability": "Rampart"
      },
      {
        "name": "Reprisal",
        "type": "debuff",
        "target": "enemy",
        "amount": 10,
        "condition": null,
        "source_job": "Gunbreaker",
        "granted_by": null,
        "parent_ability": "Reprisal"
      }
    ],
    "Summoner": [
      {
        "name": "Addle",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "physical damage",
        "source_job": "Summoner",
        "granted_by": null,
        "parent_ability": "Addle"
      },
      {
        "name": "Addle",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "magical damage",
        "source_job": "Summoner",
        "granted_by": null,
        "parent_ability": "Addle"
      },
      {
        "name": "Radiant Aegis",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Summoner",
        "granted_by": "Radiant Aegis",
        "parent_ability": "Radiant Aegis"
      }
    ],
    "DarkKnight": [
      {
        "name": "Shadow Wall",
        "type": "reduction",
        "target": "self",
        "amount": 30,
        "condition": null,
        "source_job": "DarkKnight",
        "granted_by": null,
        "parent_ability": "Shadow Wall"
      },
      {
        "name": "Dark Mind",
        "type": "reduction",
        "target": "self",
        "amount": 10,
        "condition": "physical damage",
        "source_job": "DarkKnight",
        "granted_by": null,
        "parent_ability": "Dark Mind"
      },
      {
        "name": "Dark Mind",
        "type": "reduction",
        "target": "self",
        "amount": 20,
        "condition": "magical damage",
        "source_job": "DarkKnight",
        "granted_by": null,
        "parent_ability": "Dark Mind"
      },
      {
        "name": "Dark Missionary",
        "type": "reduction",
        "target": "party",
        "amount": 5,
        "condition": "physical damage",
        "source_job": "DarkKnight",
        "granted_by": null,
        "parent_ability": "Dark Missionary"
      },
      {
        "name": "Dark Missionary",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": "magical damage",
        "source_job": "DarkKnight",
        "granted_by": null,
        "parent_ability": "Dark Missionary"
      },
      {
        "name": "Oblation",
        "type": "reduction",
        "target": "ally",
        "amount": 10,
        "condition": null,
        "source_job": "DarkKnight",
        "granted_by": null,
        "parent_ability": "Oblation"
      },
      {
        "name": "Shadowed Vigil",
        "type": "reduction",
        "target": "self",
        "amount": 40,
        "condition": null,
        "source_job": "DarkKnight",
        "granted_by": null,
        "parent_ability": "Shadowed Vigil"
      },
      {
        "name": "Rampart",
        "type": "reduction",
        "target": "self",
        "amount": 20,
        "condition": null,
        "source_job": "DarkKnight",
        "granted_by": null,
        "parent_ability": "Rampart"
      },
      {
        "name": "Reprisal",
        "type": "debuff",
        "target": "enemy",
        "amount": 10,
        "condition": null,
        "source_job": "DarkKnight",
        "granted_by": null,
        "parent_ability": "Reprisal"
      },
      {
        "name": "The Blackest Night",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "DarkKnight",
        "granted_by": "The Blackest Night",
        "parent_ability": "The Blackest Night"
      }
    ],
    "Paladin": [
      {
        "name": "Sheltron",
        "type": "reduction",
        "target": "self",
        "amount": 15,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": null,
        "parent_ability": "Sheltron"
      },
      {
        "name": "Sentinel",
        "type": "reduction",
        "target": "self",
        "amount": 30,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": null,
        "parent_ability": "Sentinel"
      },
      {
        "name": "Intervention",
        "type": "reduction",
        "target": "ally",
        "amount": 10,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": null,
        "parent_ability": "Intervention"
      },
      {
        "name": "Intervention",
        "type": "reduction",
        "target": "ally",
        "amount": 10,
        "condition": "if Rampart or Guardian are active",
        "source_job": "Paladin",
        "granted_by": null,
        "parent_ability": "Intervention"
      },
      {
        "name": "Knight's Resolve",
        "type": "reduction",
        "target": "ally",
        "amount": 10,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": "Intervention",
        "parent_ability": "Intervention"
      },
      {
        "name": "Passage of Arms",
        "type": "reduction",
        "target": "party",
        "amount": 15,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": null,
        "parent_ability": "Passage of Arms"
      },
      {
        "name": "Holy Sheltron",
        "type": "reduction",
        "target": "self",
        "amount": 15,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": null,
        "parent_ability": "Holy Sheltron"
      },
      {
        "name": "Knight's Resolve",
        "type": "reduction",
        "target": "self",
        "amount": 15,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": "Holy Sheltron",
        "parent_ability": "Holy Sheltron"
      },
      {
        "name": "Guardian",
        "type": "reduction",
        "target": "self",
        "amount": 40,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": null,
        "parent_ability": "Guardian"
      },
      {
        "name": "Rampart",
        "type": "reduction",
        "target": "self",
        "amount": 20,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": null,
        "parent_ability": "Rampart"
      },
      {
        "name": "Reprisal",
        "type": "debuff",
        "target": "enemy",
        "amount": 10,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": null,
        "parent_ability": "Reprisal"
      },
      {
        "name": "Divine Veil",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": "Divine Veil",
        "parent_ability": "Divine Veil"
      },
      {
        "name": "Bulwark",
        "type": "special",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Paladin",
        "granted_by": "Bulwark",
        "parent_ability": "Bulwark"
      }
    ],
    "Machinist": [
      {
        "name": "Tactician",
        "type": "reduction",
        "target": "party",
        "amount": 15,
        "condition": null,
        "source_job": "Machinist",
        "granted_by": null,
        "parent_ability": "Tactician"
      },
      {
        "name": "Dismantle",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": null,
        "source_job": "Machinist",
        "granted_by": null,
        "parent_ability": "Dismantle"
      }
    ],
    "Bard": [
      {
        "name": "Troubadour",
        "type": "reduction",
        "target": "party",
        "amount": 15,
        "condition": null,
        "source_job": "Bard",
        "granted_by": null,
        "parent_ability": "Troubadour"
      }
    ],
    "Samurai": [
      {
        "name": "Third Eye",
        "type": "reduction",
        "target": "self",
        "amount": 10,
        "condition": null,
        "source_job": "Samurai",
        "granted_by": null,
        "parent_ability": "Third Eye"
      },
      {
        "name": "Tengentsu",
        "type": "reduction",
        "target": "self",
        "amount": 10,
        "condition": null,
        "source_job": "Samurai",
        "granted_by": null,
        "parent_ability": "Tengentsu"
      },
      {
        "name": "Tengentsu's Foresight",
        "type": "reduction",
        "target": "self",
        "amount": 10,
        "condition": null,
        "source_job": "Samurai",
        "granted_by": "Tengentsu",
        "parent_ability": "Tengentsu"
      },
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "physical damage",
        "source_job": "Samurai",
        "granted_by": null,
        "parent_ability": "Feint"
      },
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "magical damage",
        "source_job": "Samurai",
        "granted_by": null,
        "parent_ability": "Feint"
      }
    ],
    "Viper": [
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "physical damage",
        "source_job": "Viper",
        "granted_by": null,
        "parent_ability": "Feint"
      },
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "magical damage",
        "source_job": "Viper",
        "granted_by": null,
        "parent_ability": "Feint"
      }
    ],
    "Dancer": [
      {
        "name": "Shield Samba",
        "type": "reduction",
        "target": "party",
        "amount": 15,
        "condition": null,
        "source_job": "Dancer",
        "granted_by": null,
        "parent_ability": "Shield Samba"
      },
      {
        "name": "Improvisation",
        "type": "special",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Dancer",
        "granted_by": "Improvisation",
        "parent_ability": "Improvisation"
      }
    ],
    "Whitemage": [
      {
        "name": "Temperance",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": null,
        "source_job": "Whitemage",
        "granted_by": null,
        "parent_ability": "Temperance"
      },
      {
        "name": "Aquaveil",
        "type": "reduction",
        "target": "ally",
        "amount": 15,
        "condition": null,
        "source_job": "Whitemage",
        "granted_by": null,
        "parent_ability": "Aquaveil"
      },
      {
        "name": "Plenary Indulgence",
        "type": "reduction",
        "target": "self",
        "amount": 10,
        "condition": null,
        "source_job": "Whitemage",
        "granted_by": null,
        "parent_ability": "Plenary Indulgence"
      },
      {
        "name": "Divine Benison",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Whitemage",
        "granted_by": "Divine Benison",
        "parent_ability": "Divine Benison"
      },
      {
        "name": "Divine Caress",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Whitemage",
        "granted_by": "Divine Caress",
        "parent_ability": "Divine Caress"
      }
    ],
    "Monk": [
      {
        "name": "Riddle of Earth",
        "type": "reduction",
        "target": "self",
        "amount": 20,
        "condition": null,
        "source_job": "Monk",
        "granted_by": null,
        "parent_ability": "Riddle of Earth"
      },
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "physical damage",
        "source_job": "Monk",
        "granted_by": null,
        "parent_ability": "Feint"
      },
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "magical damage",
        "source_job": "Monk",
        "granted_by": null,
        "parent_ability": "Feint"
      }
    ],
    "Redmage": [
      {
        "name": "Magick Barrier",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": "magical damage",
        "source_job": "Redmage",
        "granted_by": null,
        "parent_ability": "Magick Barrier"
      },
      {
        "name": "Addle",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "physical damage",
        "source_job": "Redmage",
        "granted_by": null,
        "parent_ability": "Addle"
      },
      {
        "name": "Addle",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "magical damage",
        "source_job": "Redmage",
        "granted_by": null,
        "parent_ability": "Addle"
      }
    ],
    "Reaper": [
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "physical damage",
        "source_job": "Reaper",
        "granted_by": null,
        "parent_ability": "Feint"
      },
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "magical damage",
        "source_job": "Reaper",
        "granted_by": null,
        "parent_ability": "Feint"
      },
      {
        "name": "Arcane Crest",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Reaper",
        "granted_by": "Arcane Crest",
        "parent_ability": "Arcane Crest"
      }
    ],
    "Astrologian": [
      {
        "name": "Collective Unconscious",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": null,
        "source_job": "Astrologian",
        "granted_by": null,
        "parent_ability": "Collective Unconscious"
      },
      {
        "name": "Exaltation",
        "type": "reduction",
        "target": "ally",
        "amount": 10,
        "condition": null,
        "source_job": "Astrologian",
        "granted_by": null,
        "parent_ability": "Exaltation"
      },
      {
        "name": "Sun Sign",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": null,
        "source_job": "Astrologian",
        "granted_by": null,
        "parent_ability": "Neutral Sect"
      },
      {
        "name": "The Bole",
        "type": "reduction",
        "target": "ally",
        "amount": 10,
        "condition": null,
        "source_job": "Astrologian",
        "granted_by": null,
        "parent_ability": "The Bole"
      },
      {
        "name": "Celestial Intersection",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Astrologian",
        "granted_by": "Celestial Intersection",
        "parent_ability": "Celestial Intersection"
      },
      {
        "name": "Neutral Sect",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Astrologian",
        "granted_by": "Neutral Sect",
        "parent_ability": "Neutral Sect"
      },
      {
        "name": "The Spire",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Astrologian",
        "granted_by": "The Spire",
        "parent_ability": "The Spire"
      }
    ],
    "Warrior": [
      {
        "name": "Vengeance",
        "type": "reduction",
        "target": "self",
        "amount": 30,
        "condition": "physical damage",
        "source_job": "Warrior",
        "granted_by": null,
        "parent_ability": "Vengeance"
      },
      {
        "name": "Raw Intuition",
        "type": "reduction",
        "target": "self",
        "amount": 10,
        "condition": null,
        "source_job": "Warrior",
        "granted_by": null,
        "parent_ability": "Raw Intuition"
      },
      {
        "name": "Nascent Glint",
        "type": "reduction",
        "target": "ally",
        "amount": 10,
        "condition": null,
        "source_job": "Warrior",
        "granted_by": "Nascent Flash",
        "parent_ability": "Nascent Flash"
      },
      {
        "name": "Stem the Flow",
        "type": "reduction",
        "target": "ally",
        "amount": 10,
        "condition": null,
        "source_job": "Warrior",
        "granted_by": "Nascent Flash",
        "parent_ability": "Nascent Flash"
      },
      {
        "name": "Bloodwhetting",
        "type": "reduction",
        "target": "self",
        "amount": 10,
        "condition": null,
        "source_job": "Warrior",
        "granted_by": null,
        "parent_ability": "Bloodwhetting"
      },
      {
        "name": "Stem the Flow",
        "type": "reduction",
        "target": "self",
        "amount": 10,
        "condition": null,
        "source_job": "Warrior",
        "granted_by": "Bloodwhetting",
        "parent_ability": "Bloodwhetting"
      },
      {
        "name": "Damnation",
        "type": "reduction",
        "target": "self",
        "amount": 40,
        "condition": "physical damage",
        "source_job": "Warrior",
        "granted_by": null,
        "parent_ability": "Damnation"
      },
      {
        "name": "Rampart",
        "type": "reduction",
        "target": "self",
        "amount": 20,
        "condition": null,
        "source_job": "Warrior",
        "granted_by": null,
        "parent_ability": "Rampart"
      },
      {
        "name": "Reprisal",
        "type": "debuff",
        "target": "enemy",
        "amount": 10,
        "condition": null,
        "source_job": "Warrior",
        "granted_by": null,
        "parent_ability": "Reprisal"
      },
      {
        "name": "Shake It Off",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Warrior",
        "granted_by": "Shake It Off",
        "parent_ability": "Shake It Off"
      },
      {
        "name": "Thrill of Battle",
        "type": "special",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Warrior",
        "granted_by": "Thrill of Battle",
        "parent_ability": "Thrill of Battle"
      }
    ],
    "Pictomancer": [
      {
        "name": "Addle",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "physical damage",
        "source_job": "Pictomancer",
        "granted_by": null,
        "parent_ability": "Addle"
      },
      {
        "name": "Addle",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "magical damage",
        "source_job": "Pictomancer",
        "granted_by": null,
        "parent_ability": "Addle"
      },
      {
        "name": "Tempera Coat",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Pictomancer",
        "granted_by": "Tempera Coat",
        "parent_ability": "Tempera Coat"
      },
      {
        "name": "Tempera Grassa",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Pictomancer",
        "granted_by": "Tempera Grassa",
        "parent_ability": "Tempera Grassa"
      }
    ],
    "RedMage": [
      {
        "name": "Magick Barrier",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": "magical damage",
        "source_job": "RedMage",
        "granted_by": null,
        "parent_ability": "Magick Barrier"
      },
      {
        "name": "Addle",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "physical damage",
        "source_job": "RedMage",
        "granted_by": null,
        "parent_ability": "Addle"
      },
      {
        "name": "Addle",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "magical damage",
        "source_job": "RedMage",
        "granted_by": null,
        "parent_ability": "Addle"
      }
    ],
    "Dragoon": [
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "physical damage",
        "source_job": "Dragoon",
        "granted_by": null,
        "parent_ability": "Feint"
      },
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "magical damage",
        "source_job": "Dragoon",
        "granted_by": null,
        "parent_ability": "Feint"
      }
    ],
    "Sage": [
      {
        "name": "Kerachole",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": null,
        "source_job": "Sage",
        "granted_by": null,
        "parent_ability": "Kerachole"
      },
      {
        "name": "Taurochole",
        "type": "reduction",
        "target": "ally",
        "amount": 10,
        "condition": null,
        "source_job": "Sage",
        "granted_by": null,
        "parent_ability": "Taurochole"
      },
      {
        "name": "Holos",
        "type": "reduction",
        "target": "party",
        "amount": 10,
        "condition": null,
        "source_job": "Sage",
        "granted_by": null,
        "parent_ability": "Holos"
      },
      {
        "name": "Haima",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Sage",
        "granted_by": "Haima",
        "parent_ability": "Haima"
      },
      {
        "name": "Panhaima",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Sage",
        "granted_by": "Panhaima",
        "parent_ability": "Panhaima"
      }
    ],
    "Ninja": [
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 10,
        "condition": "physical damage",
        "source_job": "Ninja",
        "granted_by": null,
        "parent_ability": "Feint"
      },
      {
        "name": "Feint",
        "type": "debuff",
        "target": "self",
        "amount": 5,
        "condition": "magical damage",
        "source_job": "Ninja",
        "granted_by": null,
        "parent_ability": "Feint"
      },
      {
        "name": "Shade Shift",
        "type": "shield",
        "target": "self",
        "amount": 0,
        "condition": null,
        "source_job": "Ninja",
        "granted_by": "Shade Shift",
        "parent_ability": "Shade Shift"
      }
    ]
  },
  "aliases": []
};

export default mitigationData;
