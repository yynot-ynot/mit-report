/* ==========================================================================
   Black Mage Config
   --------------------------------------------------------------------------
   - Defines potency values for each action under different Astral Fire (AF)
     and Umbral Ice (UI) levels.
   ========================================================================== */

export const BlackMageConfig = {
  actions: {
  Fire: {
    base: 180,
    AF1: 252,
    AF2: 288,
    AF3: 324,
    UI1: null,
    UI2: null,
    UI3: null,
    castTime: 2.42,
    recastTime: 2.42,
    aliases: [
      "F1"
    ],
    id: "pve_action__02",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/0f0b18de207de52d394b2ca8cb990a38e96587e0.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 2,
    type: "Spell",
    cast: 2.0,
    recast: 2.5,
    cost: {
      mp: 800
    },
    range: 25,
    radius: 0,
    tooltip: "Deals fire damage with a potency of 180.\nAdditional Effect: Grants Astral Fire or removes Umbral Ice\nAdditional Effect: 40% chance to grant Firestarter\nFirestarter Effect: Next Fire III will cost no MP and have no cast time",
    potency: [
      "Deals fire damage with a potency of 180."
    ],
    effects: [
      "Additional Effect: Grants Astral Fire or removes Umbral Ice",
      "Additional Effect: 40% chance to grant Firestarter",
      "Firestarter Effect: Next Fire III will cost no MP and have no cast time"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Fire III": {
    base: 290,
    AF1: 406,
    AF2: 464,
    AF3: 522,
    UI1: 261,
    UI2: 232,
    UI3: 203,
    castTime: 3.53,
    recastTime: 2.42,
    aliases: [
      "F3"
    ],
    id: "pve_action__11",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/3ff8dcabba57f6a697d5a86fc7490884b74eddff.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 35,
    type: "Spell",
    cast: 3.5,
    recast: 2.5,
    cost: {
      mp: 2000
    },
    range: 25,
    radius: 0,
    tooltip: "Deals fire damage with a potency of 290.\nAdditional Effect: Grants Astral Fire III and removes Umbral Ice",
    potency: [
      "Deals fire damage with a potency of 290."
    ],
    effects: [
      "Additional Effect: Grants Astral Fire III and removes Umbral Ice"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Fire IV": {
    base: 300,
    AF1: 420,
    AF2: 480,
    AF3: 540,
    UI1: null,
    UI2: null,
    UI3: null,
    castTime: 2.42,
    recastTime: 2.42,
    aliases: [
      "F4"
    ],
    id: "pve_action__20",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/92e87bf20382bc6359c7448008c3423724b9f0b4.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 60,
    type: "Spell",
    cast: 2.0,
    recast: 2.5,
    cost: {
      mp: 800
    },
    range: 25,
    radius: 0,
    tooltip: "Deals fire damage with a potency of 300.\nAdditional Effect: Grants Astral Soul\nEffect ends when Astral Fire expires.\nCan only be executed while under the effect of Astral Fire.",
    potency: [
      "Deals fire damage with a potency of 300."
    ],
    effects: [
      "Additional Effect: Grants Astral Soul"
    ],
    conditions: [
      "Can only be executed while under the effect of Astral Fire."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Despair: {
    base: 350,
    AF1: 490,
    AF2: 560,
    AF3: 630,
    UI1: null,
    UI2: null,
    UI3: null,
    castTime: 2.42,
    recastTime: 2.42,
    aliases: [
      "Desp"
    ],
    id: "pve_action__25",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/ec2a834393b6ffaf415b043fb9e2c6d23afde9cd.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 72,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {
      mp: "all"
    },
    range: 25,
    radius: 0,
    tooltip: "Deals fire damage with a potency of 350.\nAdditional Effect: Grants Astral Fire III\nCan only be executed while under the effect of Astral Fire.",
    potency: [
      "Deals fire damage with a potency of 350."
    ],
    effects: [
      "Additional Effect: Grants Astral Fire III"
    ],
    conditions: [
      "Can only be executed while under the effect of Astral Fire."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Flare Star": {
    base: 500,
    AF1: 700,
    AF2: 800,
    AF3: 900,
    UI1: null,
    UI2: null,
    UI3: null,
    castTime: 2.42,
    recastTime: 2.42,
    aliases: [
      "FS"
    ],
    id: "pve_action__34",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/1bf799ec68187691dceb2adb9dc0ea1259f03dd1.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 100,
    type: "Spell",
    cast: 2.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals fire damage to target and all enemies nearby it with a potency of 500 for the first enemy, and 65% less for all remaining enemies.\nCan only be executed when the Astral Gauge is full.",
    potency: [
      "Deals fire damage to target and all enemies nearby it with a potency of 500 for the first enemy, and 65% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed when the Astral Gauge is full."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Blizzard III": {
    base: 290,
    AF1: 261,
    AF2: 232,
    AF3: 203,
    UI1: 290,
    UI2: 290,
    UI3: 290,
    castTime: 3.53,
    recastTime: 2.42,
    aliases: [
      "B3"
    ],
    id: "pve_action__12",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/6dbb819d3f64b93d6f6ffa23a73101c79592ae2f.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 35,
    type: "Spell",
    cast: 3.5,
    recast: 2.5,
    cost: {
      mp: 800
    },
    range: 25,
    radius: 0,
    tooltip: "Deals ice damage with a potency of 290.\nAdditional Effect: Grants Umbral Ice III and removes Astral Fire",
    potency: [
      "Deals ice damage with a potency of 290."
    ],
    effects: [
      "Additional Effect: Grants Umbral Ice III and removes Astral Fire"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Blizzard IV": {
    base: 300,
    AF1: null,
    AF2: null,
    AF3: null,
    UI1: 300,
    UI2: 300,
    UI3: 300,
    castTime: 2.42,
    recastTime: 2.42,
    aliases: [
      "B4"
    ],
    id: "pve_action__19",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/d370de07c30f08bd306ed3c58f0f0490b4541870.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 58,
    type: "Spell",
    cast: 2.0,
    recast: 2.5,
    cost: {
      mp: 800
    },
    range: 25,
    radius: 0,
    tooltip: "Deals ice damage with a potency of 300.\nAdditional Effect: Grants 3 Umbral Hearts\nUmbral Heart Bonus: Nullifies Astral Fire's MP cost increase for Fire spells and reduces MP cost for Flare by one-third\nCan only be executed while under the effect of Umbral Ice.",
    potency: [
      "Deals ice damage with a potency of 300."
    ],
    effects: [
      "Additional Effect: Grants 3 Umbral Hearts"
    ],
    conditions: [
      "Can only be executed while under the effect of Umbral Ice."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Paradox: {
    base: 540,
    AF1: 540,
    AF2: 540,
    AF3: 540,
    UI1: 540,
    UI2: 540,
    UI3: 540,
    castTime: 2.42,
    recastTime: 2.42,
    aliases: [
      "PD",
      "Para"
    ],
    id: "pve_action__30",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/e4dbf2ab28919eb82a4b410db2a07cf59706c011.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 90,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {
      mp: 1600
    },
    range: 25,
    radius: 0,
    tooltip: "Deals unaspected damage with a potency of 540.\nAstral Fire Bonus: Grants Firestarter\nFirestarter Effect: Next Fire III will require no time to cast and cost no MP\nUmbral Ice Bonus: Requires no MP to cast\nCan only be executed while under the effect of Paradox.\n\n※This action cannot be assigned to a hotbar.\n※Fire and Blizzard change to Paradox when requirements for execution are met.",
    potency: [
      "Deals unaspected damage with a potency of 540."
    ],
    effects: [
      "Firestarter Effect: Next Fire III will require no time to cast and cost no MP"
    ],
    conditions: [
      "Umbral Ice Bonus: Requires no MP to cast",
      "Can only be executed while under the effect of Paradox.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Flare: {
    base: 240,
    AF1: 336,
    AF2: 384,
    AF3: 432,
    UI1: null,
    UI2: null,
    UI3: null,
    castTime: 2.42,
    recastTime: 2.42,
    aliases: [],
    id: "pve_action__17",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/bc3d31c27d861d18280280b18a5f2e5ab0f2858e.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 50,
    type: "Spell",
    cast: 2.0,
    recast: 2.5,
    cost: {
      mp: "all"
    },
    range: 25,
    radius: 5,
    tooltip: "Deals fire damage to target and all enemies nearby it with a potency of 240 for the first enemy, and 30% less for all remaining enemies.\nAdditional Effect: Grants Astral Fire III\nAdditional Effect: Grants 3 stacks of Astral Soul\nEffect ends when Astral Fire expires.\nCan only be executed while under the effect of Astral Fire.",
    potency: [
      "Deals fire damage to target and all enemies nearby it with a potency of 240 for the first enemy, and 30% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Grants Astral Fire III",
      "Additional Effect: Grants 3 stacks of Astral Soul"
    ],
    conditions: [
      "Can only be executed while under the effect of Astral Fire."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Blizzard: {
    base: 180,
    AF1: null,
    AF2: null,
    AF3: null,
    UI1: 180,
    UI2: 180,
    UI3: 180,
    castTime: 2.42,
    recastTime: 2.42,
    aliases: [
      "UI1"
    ],
    id: "pve_action__01",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/dab74d4a196c546228d67c91db4bde70c32c45df.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 1,
    type: "Spell",
    cast: 2.0,
    recast: 2.5,
    cost: {
      mp: 400
    },
    range: 25,
    radius: 0,
    tooltip: "Deals ice damage with a potency of 180.\nAdditional Effect: Grants Umbral Ice or removes Astral Fire",
    potency: [
      "Deals ice damage with a potency of 180."
    ],
    effects: [
      "Additional Effect: Grants Umbral Ice or removes Astral Fire"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Transpose: {
    id: "pve_action__03",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/11343c230e7ebd41588ca8f684cb99ee13809398.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 4,
    type: "Ability",
    cast: 0.0,
    recast: 5.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Swaps Astral Fire with a single Umbral Ice, or Umbral Ice with a single Astral Fire.",
    potency: [],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Thunder: {
    id: "pve_action__04",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/db30f0fa05ce4f541f839c5b2c57cfe0e9fb77f8.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 6,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Deals lightning damage with a potency of 100.\nAdditional Effect: Lightning damage over time\nPotency: 45\nDuration: 24s\nCan only be cast while under the effect of Thunderhead, granted when gaining Astral Fire or Umbral Ice from an unaspected state, or changing between their influences.\nOnly one Thunder spell-induced damage over time effect per caster can be inflicted upon a single target.",
    potency: [
      "Deals lightning damage with a potency of 100.",
      "Potency: 45"
    ],
    effects: [
      "Additional Effect: Lightning damage over time"
    ],
    conditions: [],
    duration: {
      seconds: 24
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Blizzard II": {
    id: "pve_action__05",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/c4883e7698b37e901837be6a0bcc8de043847479.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 12,
    type: "Spell",
    cast: 3.0,
    recast: 2.5,
    cost: {
      mp: 800
    },
    range: 25,
    radius: 5,
    tooltip: "Deals ice damage with a potency of 80 to target and all enemies nearby it.\nAdditional Effect: Grants Umbral Ice III and removes Astral Fire",
    potency: [
      "Deals ice damage with a potency of 80 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Grants Umbral Ice III and removes Astral Fire"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Scathe: {
    id: "pve_action__06",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/9b763aecc46c5559bbbccadfe866fe42d56a9597.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 15,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {
      mp: 800
    },
    range: 25,
    radius: 0,
    tooltip: "Deals unaspected damage with a potency of 100.\nAdditional Effect: 20% chance potency will double",
    potency: [
      "Deals unaspected damage with a potency of 100.",
      "Additional Effect: 20% chance potency will double"
    ],
    effects: [
      "Additional Effect: 20% chance potency will double"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Fire II": {
    id: "pve_action__07",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/8876f1b3cf116acf7138253e0193396c75698651.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 18,
    type: "Spell",
    cast: 3.0,
    recast: 2.5,
    cost: {
      mp: 1500
    },
    range: 25,
    radius: 5,
    tooltip: "Deals fire damage with a potency of 80 to target and all enemies nearby it.\nAdditional Effect: Grants Astral Fire III and removes Umbral Ice",
    potency: [
      "Deals fire damage with a potency of 80 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Grants Astral Fire III and removes Umbral Ice"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Thunder II": {
    id: "pve_action__08",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/67205b06f51ddd0e07f16441e38e90d59840f1b6.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 26,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals lightning damage with a potency of 60 to target and all enemies nearby it.\nAdditional Effect: Lightning damage over time\nPotency: 30\nDuration: 18s\nCan only be cast while under the effect of Thunderhead, granted when gaining Astral Fire or Umbral Ice from an unaspected state, or changing between their influences.\nOnly one Thunder spell-induced damage over time effect per caster can be inflicted upon a single target.",
    potency: [
      "Deals lightning damage with a potency of 60 to target and all enemies nearby it.",
      "Potency: 30"
    ],
    effects: [
      "Additional Effect: Lightning damage over time"
    ],
    conditions: [],
    duration: {
      seconds: 18
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Manaward: {
    id: "pve_action__09",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/75ed92265dc2dcc6fa1e0b8f22a01258799f222d.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 30,
    type: "Ability",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Creates a barrier that nullifies damage totaling up to 30% of maximum HP.\nDuration: 20s",
    potency: [],
    effects: [],
    conditions: [],
    duration: {
      seconds: 20
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Manafont: {
    id: "pve_action__10",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/1b9ba4e020c77e1768d7d15d3c8aac1e7b7d88ea.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 30,
    type: "Ability",
    cast: 0.0,
    recast: 100.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Fully restores MP.\nAdditional Effect: Grants Astral Fire III\nAdditional Effect: Grants Thunderhead\nAdditional Effect: Grants 3 Umbral Hearts\nUmbral Heart Bonus: Nullifies Astral Fire's MP cost increase for Fire spells and reduces MP cost for Flare by one-third\nAdditional Effect: Grants Paradox\nCan only be executed while under the effect of Astral Fire.",
    potency: [],
    effects: [
      "Additional Effect: Grants Astral Fire III",
      "Additional Effect: Grants Thunderhead",
      "Additional Effect: Grants 3 Umbral Hearts",
      "Additional Effect: Grants Paradox"
    ],
    conditions: [
      "Can only be executed while under the effect of Astral Fire."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Umbral Soul": {
    id: "pve_action__13",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/7dbfbe8ecadac526c0a2739cd45571f6ea2732fc.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 35,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Grants Umbral Ice and 1 Umbral Heart.\nUmbral Heart Bonus: Nullifies Astral Fire's MP cost increase for Fire spells and reduces MP cost for Flare by one-third\nAdditional Effect: Restores an amount of MP commensurate with your stacks of Umbral Ice\nUmbral Ice I: 2,500 MP\nUmbral Ice II: 5,000 MP\nUmbral Ice III: 10,000 MP\nGrants Umbral Ice III and 3 Umbral Hearts, and also restores 10,000 MP when used while outside of combat.\nCan only be executed while under the effect of Umbral Ice.",
    potency: [],
    effects: [
      "Additional Effect: Restores an amount of MP commensurate with your stacks of Umbral Ice"
    ],
    conditions: [
      "Can only be executed while under the effect of Umbral Ice."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Freeze: {
    id: "pve_action__14",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/a26308be548e58eb346aae1b4850ceabc417f35e.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 40,
    type: "Spell",
    cast: 2.0,
    recast: 2.5,
    cost: {
      mp: 1000
    },
    range: 25,
    radius: 5,
    tooltip: "Deals ice damage with a potency of 120 to target and all enemies nearby it.\nAdditional Effect: Grants 3 Umbral Hearts\nUmbral Heart Bonus: Nullifies Astral Fire's MP cost increase for Fire spells and reduces MP cost for Flare by one-third\nCan only be executed while under the effect of Umbral Ice.",
    potency: [
      "Deals ice damage with a potency of 120 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Grants 3 Umbral Hearts"
    ],
    conditions: [
      "Can only be executed while under the effect of Umbral Ice."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Thunder III": {
    id: "pve_action__15",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/2efb022c0715f802a88e1edef4924c075e92a53d.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 45,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Deals lightning damage with a potency of 120.\nAdditional Effect: Lightning damage over time\nPotency: 50\nDuration: 27s\nCan only be cast while under the effect of Thunderhead, granted when gaining Astral Fire or Umbral Ice from an unaspected state, or changing between their influences.\nOnly one Thunder spell-induced damage over time effect per caster can be inflicted upon a single target.",
    potency: [
      "Deals lightning damage with a potency of 120.",
      "Potency: 50"
    ],
    effects: [
      "Additional Effect: Lightning damage over time"
    ],
    conditions: [],
    duration: {
      seconds: 27
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Aetherial Manipulation": {
    id: "pve_action__16",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/a8c94264a1522d4e1f80e9dcac7864eb6170d722.png",
    job: "Thaumaturge",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/Q/Zlo0xBHOBte3IGPo8SY9XUcGes.png",
    level: 50,
    type: "Ability",
    cast: 0.0,
    recast: 10.0,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Rush to a target party member's side.\nUnable to cast if bound.",
    potency: [],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Ley Lines": {
    id: "pve_action__18",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/f3540a1d13a0387b442767d1a4279e94d9d24097.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 52,
    type: "Ability",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 3,
    tooltip: "Connects naturally occurring ley lines to create a circle of power which, while standing within it, reduces spell cast time and recast time, and auto-attack delay by 15%.\nDuration: 20s\nMaximum Charges: 2\nCannot be executed while under the effect of Ley Lines.",
    potency: [],
    effects: [],
    conditions: [],
    duration: {
      seconds: 20
    },
    max_charges: 2,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Between the Lines": {
    id: "pve_action__21",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/f12a8a4f87f81ce00e56922f8c61c58e47e8a3c8.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 62,
    type: "Ability",
    cast: 0.0,
    recast: 3.0,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Move instantly to Ley Lines drawn by you.\nCannot be executed while bound.",
    potency: [],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Thunder IV": {
    id: "pve_action__22",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/c141aa71c34830d6b161c667042815c5d7805320.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 64,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals lightning damage with a potency of 80 to target and all enemies nearby it.\nAdditional Effect: Lightning damage over time\nPotency: 35\nDuration: 21s\nCan only be cast while under the effect of Thunderhead, granted when gaining Astral Fire or Umbral Ice from an unaspected state, or changing between their influences.\nOnly one Thunder spell-induced damage over time effect per caster can be inflicted upon a single target.",
    potency: [
      "Deals lightning damage with a potency of 80 to target and all enemies nearby it.",
      "Potency: 35"
    ],
    effects: [
      "Additional Effect: Lightning damage over time"
    ],
    conditions: [],
    duration: {
      seconds: 21
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Triplecast: {
    id: "pve_action__23",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/61cd894fc6b3e28004512ed61ffc0eb4fef170f2.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 66,
    type: "Ability",
    cast: 0.0,
    recast: 60.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "The next three spells will require no cast time.\nDuration: 15s\nMaximum Charges: 2",
    potency: [],
    effects: [],
    conditions: [],
    duration: {
      seconds: 15
    },
    max_charges: 2,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Foul: {
    id: "pve_action__24",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/801f21d137c07c099140d653b8a69995fc2b8404.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 70,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals unaspected damage to target and all enemies nearby it with a potency of 600 for the first enemy, and 25% less for all remaining enemies.\nPolyglot Cost: 1",
    potency: [
      "Deals unaspected damage to target and all enemies nearby it with a potency of 600 for the first enemy, and 25% less for all remaining enemies."
    ],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Xenoglossy: {
    id: "pve_action__26",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/b1fcdd06d76b9eb7c7a55364b81bc3ed2674631c.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 80,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Deals unaspected damage with a potency of 890.\nPolyglot Cost: 1",
    potency: [
      "Deals unaspected damage with a potency of 890."
    ],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "High Fire II": {
    id: "pve_action__27",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/f0eb5938ef101e5eddb4abf3c96c71e0f5334022.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 82,
    type: "Spell",
    cast: 3.0,
    recast: 2.5,
    cost: {
      mp: 1500
    },
    range: 25,
    radius: 5,
    tooltip: "Deals fire damage with a potency of 100 to target and all enemies nearby it.\nAdditional Effect: Grants Astral Fire III and removes Umbral Ice",
    potency: [
      "Deals fire damage with a potency of 100 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Grants Astral Fire III and removes Umbral Ice"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "High Blizzard II": {
    id: "pve_action__28",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/32f2b5e549d388dea8d84a814380a697b9038b71.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 82,
    type: "Spell",
    cast: 3.0,
    recast: 2.5,
    cost: {
      mp: 800
    },
    range: 25,
    radius: 5,
    tooltip: "Deals ice damage with a potency of 100 to target and all enemies nearby it.\nAdditional Effect: Grants Umbral Ice III and removes Astral Fire",
    potency: [
      "Deals ice damage with a potency of 100 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Grants Umbral Ice III and removes Astral Fire"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Amplifier: {
    id: "pve_action__29",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/afd6e5ce788dd3a0bf9159f29de292886c3febe4.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 86,
    type: "Ability",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Grants Polyglot.\nCan only be executed while under the effect of Astral Fire or Umbral Ice.",
    potency: [],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Astral Fire or Umbral Ice."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "High Thunder": {
    id: "pve_action__31",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/1babd2b0f9ad34451ac3ac29230b2239db95065b.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 92,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Deals lightning damage with a potency of 150.\nAdditional Effect: Lightning damage over time\nPotency: 60\nDuration: 30s\nCan only be cast while under the effect of Thunderhead, granted when gaining Astral Fire or Umbral Ice from an unaspected state, or changing between their influences.\nOnly one Thunder spell-induced damage over time effect per caster can be inflicted upon a single target.",
    potency: [
      "Deals lightning damage with a potency of 150.",
      "Potency: 60"
    ],
    effects: [
      "Additional Effect: Lightning damage over time"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "High Thunder II": {
    id: "pve_action__32",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/51a70145dcf0d8136ff82ce50713529f1cebaf84.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 92,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals lightning damage with a potency of 100 to target and all enemies nearby it.\nAdditional Effect: Lightning damage over time\nPotency: 40\nDuration: 24s\nCan only be cast while under the effect of Thunderhead, granted when gaining Astral Fire or Umbral Ice from an unaspected state, or changing between their influences.\nOnly one Thunder spell-induced damage over time effect per caster can be inflicted upon a single target.",
    potency: [
      "Deals lightning damage with a potency of 100 to target and all enemies nearby it.",
      "Potency: 40"
    ],
    effects: [
      "Additional Effect: Lightning damage over time"
    ],
    conditions: [],
    duration: {
      seconds: 24
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Retrace: {
    id: "pve_action__33",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/44666e4299c0eded8c4af12edb67c7c9f718bda5.png",
    job: "Black Mage",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/A/7JuT00VSwaFqTfcTYUCUnGPFQE.png",
    level: 96,
    type: "Ability",
    cast: 0.0,
    recast: 40.0,
    cost: {},
    range: 0,
    radius: 3,
    tooltip: "Weave ley lines anew, setting your circle of power at a new location.\nCan only be executed while under the effect of Ley Lines, and the effect duration will not be reset.",
    potency: [],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Ley Lines, and the effect duration will not be reset."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_blackmage_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  }
},
  rotations: [
    {
      ln: 1,
      sequence: "UI1 B3* B4 PD AF1 Para F3P 6xF4 Desp FS",
      totalPotency: 6846.0,
      duration: 31.46,
      f3pGenerated: 0,
    },
    {
      ln: 2,
      sequence: "B3 B4 PD F3 3xF4 PD 3xF4 Desp FS",
      totalPotency: 6556.0,
      duration: 31.46,
      f3pGenerated: 1,
    },
    {
      ln: 3,
      sequence: "B3 B4 PD AF1 Para F3P 6xF4 Desp FS",
      totalPotency: 6759.0,
      duration: 31.46,
      f3pGenerated: 0,
    },
    {
      ln: 4,
      sequence: "B3 B4 PD AF1 F3P 3xF4 PD 3xF4 Desp FS",
      totalPotency: 6759.0,
      duration: 31.46,
      f3pGenerated: 0,
    },
    {
      ln: 5,
      sequence: "B3 B4 PD F3 3xF4 PD 3xF4 Desp FS F3P",
      totalPotency: 7078.0,
      duration: 33.88,
      f3pGenerated: 0,
    },
    {
      ln: 6,
      sequence: "B3 PD AF1:PD F3P Desp",
      totalPotency: 2319.0,
      duration: 12.1,
      f3pGenerated: 0,
    },
    {
      ln: 7,
      sequence: "B3 B4 PD AF1:PD F3P 2xF4 Flare F4 FS",
      totalPotency: 4941.0,
      duration: 24.2,
      f3pGenerated: 0,
    },
    {
      ln: 8,
      sequence: "B4 PD AF1:Flare Flare FS",
      totalPotency: 2508.0,
      duration: 12.1,
      f3pGenerated: 0,
    },
    {
      ln: 9,
      sequence: "UI1:PD AF1:Desp",
      totalPotency: 1030.0,
      duration: 4.84,
      f3pGenerated: 0,
    },
    {
      ln: 10,
      sequence: "UI1:B4 AF1:PD Desp",
      totalPotency: 1330.0,
      duration: 7.26,
      f3pGenerated: 1,
    },
    {
      ln: 11,
      sequence: "F3P UI1:B4 AF1 PD Desp",
      totalPotency: 1852.0,
      duration: 9.68,
      f3pGenerated: 0,
    },
    {
      ln: 12,
      sequence: "UI1 B4 AF1 PD Desp UI1 PD B4 AF1 F3P 4xF4 Desp",
      totalPotency: 5366.0,
      duration: 26.62,
      f3pGenerated: 0,
    },
    {
      ln: 13,
      sequence: "B4 AF1 PD F3P Desp",
      totalPotency: 1876.0,
      duration: 9.68,
      f3pGenerated: 0,
    },
    {
      ln: 14,
      sequence: "UI1 B4 AF1 PD F3P",
      totalPotency: 1246.0,
      duration: 7.26,
      f3pGenerated: 0,
    },
    {
      ln: 15,
      sequence: "UI1 B4 AF1 PD Desp UI1 PD AF1 F3P Desp",
      totalPotency: 2906.0,
      duration: 14.52,
      f3pGenerated: 0,
    },
    {
      ln: 16,
      sequence: "UI1:PD AF1:F3P Desp UI1:B4 AF1:PD Desp",
      totalPotency: 2906.0,
      duration: 14.52,
      f3pGenerated: 0,
    },
    {
      ln: 17,
      sequence: "-2 Desp +2 Flare +1 FS",
      totalPotency: 504.0,
      duration: 2.42,
      f3pGenerated: 0,
    },
    {
      ln: 18,
      sequence: "UI1:PD AF1:Flare [MF] 3xF4 FS 3xF4 Flare FS",
      totalPotency: 6348.0,
      duration: 26.62,
      f3pGenerated: 0,
    },
  ],
};
