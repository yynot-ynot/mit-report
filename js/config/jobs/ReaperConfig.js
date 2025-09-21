export const ReaperConfig = {
  actions: {
  Slice: {
    id: "pve_action__01",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/26fda59956454f1dbca5f260b2763321a2bb761a.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 1,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 420.\nAdditional Effect: Increases Soul Gauge by 10",
    potency: [
      "Delivers an attack with a potency of 420."
    ],
    effects: [
      "Additional Effect: Increases Soul Gauge by 10"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Waxing Slice": {
    id: "pve_action__02",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/4bab01eb43df9752e98deef097e9251647ad96df.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 5,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 260.\nCombo Action: Slice\nCombo Potency: 500\nCombo Bonus: Increases Soul Gauge by 10",
    potency: [
      "Delivers an attack with a potency of 260.",
      "Combo Potency: 500"
    ],
    effects: [
      "Combo Bonus: Increases Soul Gauge by 10"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Shadow of Death": {
    id: "pve_action__03",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/e3e48cee91c7abf77a15f6c4c9c9630349849205.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 10,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 300.\nAdditional Effect: Afflicts target with Death's Design, increasing damage you deal target by 10%\nDuration: 30s\nExtends duration of Death's Design by 30s to a maximum of 60s.\nAdditional Effect: Increases Soul Gauge by 10 if target is KO'd before effect expires",
    potency: [
      "Delivers an attack with a potency of 300."
    ],
    effects: [
      "Additional Effect: Afflicts target with Death's Design, increasing damage you deal target by 10%",
      "Additional Effect: Increases Soul Gauge by 10 if target is KO'd before effect expires"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Harpe: {
    id: "pve_action__04",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/d3ae9c9673da37ea10aa4103b747163250c4a385.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 15,
    type: "Spell",
    cast: 1.3,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Deals unaspected damage with a potency of 300.\nAdditional Effect: Increases Soul Gauge by 10",
    potency: [
      "Deals unaspected damage with a potency of 300."
    ],
    effects: [
      "Additional Effect: Increases Soul Gauge by 10"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Hell's Ingress": {
    id: "pve_action__05",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/2e1c97fd007f90808b2fd40ad86354b9e97447a8.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 20,
    type: "Ability",
    cast: 0.0,
    recast: 20.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Quickly dash 15 yalms forward.\nAdditional Effect: Grants Enhanced Harpe\nEnhanced Harpe Effect: Next Harpe can be cast immediately and will reduce recast timer of Hell's Ingress by 5s upon execution\nDuration: 10s\nAdditional Effect: Leaves behind a Hellsgate at point of origin, and grants Threshold to self\nDuration: 10s\nCannot be executed while bound.\nShares a recast timer with Hell's Egress.",
    potency: [],
    effects: [
      "Additional Effect: Grants Enhanced Harpe",
      "Enhanced Harpe Effect: Next Harpe can be cast immediately and will reduce recast timer of Hell's Ingress by 5s upon execution",
      "Additional Effect: Leaves behind a Hellsgate at point of origin, and grants Threshold to self"
    ],
    conditions: [
      "Shares a recast timer with Hell's Egress."
    ],
    duration: {
      seconds: 10
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Hell's Egress": {
    id: "pve_action__06",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/113b87916c7ffdb9a8007615f697f2c189c6646a.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 20,
    type: "Ability",
    cast: 0.0,
    recast: 20.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Quickly dash 15 yalms backwards.\nAdditional Effect: Grants Enhanced Harpe\nEnhanced Harpe Effect: Next Harpe can be cast immediately and will reduce recast timer of Hell's Egress by 5s upon execution\nDuration: 10s\nAdditional Effect: Leaves behind a Hellsgate at point of origin, and grants Threshold to self\nDuration: 10s\nCannot be executed while bound.\nShares a recast timer with Hell's Ingress.",
    potency: [],
    effects: [
      "Additional Effect: Grants Enhanced Harpe",
      "Enhanced Harpe Effect: Next Harpe can be cast immediately and will reduce recast timer of Hell's Egress by 5s upon execution",
      "Additional Effect: Leaves behind a Hellsgate at point of origin, and grants Threshold to self"
    ],
    conditions: [
      "Shares a recast timer with Hell's Ingress."
    ],
    duration: {
      seconds: 10
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Spinning Scythe": {
    id: "pve_action__07",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/dac9dba46aa8ff673cd2e365c9468525db0ba1a2.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 25,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 0,
    radius: 5,
    tooltip: "Delivers an attack with a potency of 140 to all nearby enemies.\nAdditional Effect: Increases Soul Gauge by 10",
    potency: [
      "Delivers an attack with a potency of 140 to all nearby enemies."
    ],
    effects: [
      "Additional Effect: Increases Soul Gauge by 10"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Infernal Slice": {
    id: "pve_action__08",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/aa7a7dd464459f24aa2209cddcbf8a3ebb167f0b.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 30,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 280.\nCombo Action: Waxing Slice\nCombo Potency: 600\nCombo Bonus: Increases Soul Gauge by 10",
    potency: [
      "Delivers an attack with a potency of 280.",
      "Combo Potency: 600"
    ],
    effects: [
      "Combo Bonus: Increases Soul Gauge by 10"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Whorl of Death": {
    id: "pve_action__09",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/31d409f8aaeae041b8150e68764e032fccd7c4c6.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 35,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 0,
    radius: 5,
    tooltip: "Delivers an attack with a potency of 100 to all nearby enemies.\nAdditional Effect: Afflicts target with Death's Design, increasing damage you deal target by 10%\nDuration: 30s\nExtends duration of Death's Design by 30s to a maximum of 60s.\nAdditional Effect: Increases Soul Gauge by 10 if target is KO'd before effect expires",
    potency: [
      "Delivers an attack with a potency of 100 to all nearby enemies."
    ],
    effects: [
      "Additional Effect: Afflicts target with Death's Design, increasing damage you deal target by 10%",
      "Additional Effect: Increases Soul Gauge by 10 if target is KO'd before effect expires"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Arcane Crest": {
    id: "pve_action__10",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/9977fdbbf70443f9f31f4868cba97138fbec5460.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 40,
    type: "Ability",
    cast: 0.0,
    recast: 30.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Grants Crest of Time Borrowed to self, creating a barrier that nullifies damage totaling up to 10% of maximum HP.\nDuration: 5s\nGrants Crest of Time Returned to self and nearby party members within a radius of 15 yalms when barrier is completely absorbed.\nCrest of Time Returned Effect: Gradually restores HP\nCure Potency: 50\nDuration: 15s",
    potency: [
      "Cure Potency: 50"
    ],
    effects: [
      "Crest of Time Returned Effect: Gradually restores HP"
    ],
    conditions: [],
    duration: {
      seconds: 15
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Nightmare Scythe": {
    id: "pve_action__11",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/710256a9319251859b53dd3804078cc8e35c2333.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 45,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 0,
    radius: 5,
    tooltip: "Delivers an attack with a potency of 120 to all nearby enemies.\nCombo Action: Spinning Scythe\nCombo Potency: 180\nCombo Bonus: Increases Soul Gauge by 10",
    potency: [
      "Delivers an attack with a potency of 120 to all nearby enemies.",
      "Combo Potency: 180"
    ],
    effects: [
      "Combo Bonus: Increases Soul Gauge by 10"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Blood Stalk": {
    id: "pve_action__12",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/f0f3d4c722f5f9b36b25ba72d3774b4b811b699d.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 50,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Summons your avatar to deliver an attack with a potency of 340.\nAdditional Effect: Grants Soul Reaver\nDuration: 30s\nStack count will be reduced to 1 when already under the effect of Soul Reaver.\nEffect cannot be stacked with Executioner.\nSoul Gauge Cost: 50\nShares a recast timer with all avatar attacks except Gluttony.",
    potency: [
      "Summons your avatar to deliver an attack with a potency of 340."
    ],
    effects: [
      "Additional Effect: Grants Soul Reaver"
    ],
    conditions: [
      "Shares a recast timer with all avatar attacks except Gluttony."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Grim Swathe": {
    id: "pve_action__13",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/ac34fd282b758c407014a47e3c30e188050307d8.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 55,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 8,
    radius: 8,
    tooltip: "Summons your avatar to deliver an attack with a potency of 140 to all enemies in a cone before you.\nAdditional Effect: Grants Soul Reaver\nDuration: 30s\nStack count will be reduced to 1 when already under the effect of Soul Reaver.\nEffect cannot be stacked with Executioner.\nSoul Gauge Cost: 50\nShares a recast timer with all avatar attacks except Gluttony.",
    potency: [
      "Summons your avatar to deliver an attack with a potency of 140 to all enemies in a cone before you."
    ],
    effects: [
      "Additional Effect: Grants Soul Reaver"
    ],
    conditions: [
      "Shares a recast timer with all avatar attacks except Gluttony."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Soul Slice": {
    id: "pve_action__14",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/089e7135cc2e4e64590c18db17fbab56e0040843.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 60,
    type: "Weaponskill",
    cast: 0.0,
    recast: 30.0,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 520.\nAdditional Effect: Increases Soul Gauge by 50\nMaximum Charges: 2\nShares a recast timer with Soul Scythe.\nRecast timer cannot be affected by status effects or gear attributes.",
    potency: [
      "Delivers an attack with a potency of 520."
    ],
    effects: [
      "Additional Effect: Increases Soul Gauge by 50"
    ],
    conditions: [
      "Shares a recast timer with Soul Scythe."
    ],
    duration: null,
    max_charges: 2,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Soul Scythe": {
    id: "pve_action__15",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/22ae994a06569700d3f9d51b1b999c951ca171e3.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 65,
    type: "Weaponskill",
    cast: 0.0,
    recast: 30.0,
    cost: {},
    range: 0,
    radius: 5,
    tooltip: "Delivers an attack with a potency of 180 to all nearby enemies.\nAdditional Effect: Increases Soul Gauge by 50\nMaximum Charges: 2\nShares a recast timer with Soul Slice.\nRecast timer cannot be affected by status effects or gear attributes.",
    potency: [
      "Delivers an attack with a potency of 180 to all nearby enemies."
    ],
    effects: [
      "Additional Effect: Increases Soul Gauge by 50"
    ],
    conditions: [
      "Shares a recast timer with Soul Slice."
    ],
    duration: null,
    max_charges: 2,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Gibbet: {
    id: "pve_action__16",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/f8259f07fef48d2d418535404fdc672bdc852285.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 70,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 500.\n560 when executed from a target's flank.\nEnhanced Gibbet Potency: 560\nFlank Enhanced Potency: 620\nAdditional Effect: Grants Enhanced Gallows\nDuration: 60s\nThe action Blood Stalk changes to Unveiled Gallows while under the effect of Enhanced Gallows.\nAdditional Effect: Increases Shroud Gauge by 10\nCan only be executed while under the effect of Soul Reaver.",
    potency: [
      "Delivers an attack with a potency of 500.",
      "Enhanced Gibbet Potency: 560",
      "Flank Enhanced Potency: 620"
    ],
    effects: [
      "Additional Effect: Grants Enhanced Gallows",
      "Additional Effect: Increases Shroud Gauge by 10"
    ],
    conditions: [
      "Can only be executed while under the effect of Soul Reaver."
    ],
    duration: {
      seconds: 60
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Gallows: {
    id: "pve_action__17",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/ae681cd40113523630db64f0e3823235db61a364.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 70,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 500.\n560 when executed from a target's rear.\nEnhanced Gallows Potency: 560\nRear Enhanced Potency: 620\nAdditional Effect: Grants Enhanced Gibbet\nDuration: 60s\nThe action Blood Stalk changes to Unveiled Gibbet while under the effect of Enhanced Gibbet.\nAdditional Effect: Increases Shroud Gauge by 10\nCan only be executed while under the effect of Soul Reaver.",
    potency: [
      "Delivers an attack with a potency of 500.",
      "Enhanced Gallows Potency: 560",
      "Rear Enhanced Potency: 620"
    ],
    effects: [
      "Additional Effect: Grants Enhanced Gibbet",
      "Additional Effect: Increases Shroud Gauge by 10"
    ],
    conditions: [
      "Can only be executed while under the effect of Soul Reaver."
    ],
    duration: {
      seconds: 60
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Guillotine: {
    id: "pve_action__18",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/b4d685f506367e2bd3228603e7b2c4172567f933.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 70,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 8,
    radius: 8,
    tooltip: "Delivers an attack with a potency of 200 to all enemies in a cone before you.\nAdditional Effect: Increases Shroud Gauge by 10\nCan only be executed while under the effect of Soul Reaver.",
    potency: [
      "Delivers an attack with a potency of 200 to all enemies in a cone before you."
    ],
    effects: [
      "Additional Effect: Increases Shroud Gauge by 10"
    ],
    conditions: [
      "Can only be executed while under the effect of Soul Reaver."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Unveiled Gibbet": {
    id: "pve_action__19",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/02ab830b9551480d0b5d62a24012c401a422b0bd.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 70,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Summons your avatar to deliver an attack with a potency of 440.\nAdditional Effect: Grants Soul Reaver\nDuration: 30s\nStack count will be reduced to 1 when already under the effect of Soul Reaver.\nEffect cannot be stacked with Executioner.\nSoul Gauge Cost: 50\nCan only be executed while under the effect of Enhanced Gibbet.\nShares a recast timer with all avatar attacks except Gluttony.\n\n※This action cannot be assigned to a hotbar.\n※Blood Stalk changes to Unveiled Gibbet when under the effect of Enhanced Gibbet.",
    potency: [
      "Summons your avatar to deliver an attack with a potency of 440."
    ],
    effects: [
      "Additional Effect: Grants Soul Reaver"
    ],
    conditions: [
      "Can only be executed while under the effect of Enhanced Gibbet.",
      "Shares a recast timer with all avatar attacks except Gluttony.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Unveiled Gallows": {
    id: "pve_action__20",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/017af138fc2458f9cae561ec96f027791d1da803.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 70,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Summons your avatar to deliver an attack with a potency of 440.\nAdditional Effect: Grants Soul Reaver\nDuration: 30s\nStack count will be reduced to 1 when already under the effect of Soul Reaver.\nEffect cannot be stacked with Executioner.\nSoul Gauge Cost: 50\nCan only be executed while under the effect of Enhanced Gallows.\nShares a recast timer with all avatar attacks except Gluttony.\n\n※This action cannot be assigned to a hotbar.\n※Blood Stalk changes to Unveiled Gallows while under the effect of Enhanced Gallows.",
    potency: [
      "Summons your avatar to deliver an attack with a potency of 440."
    ],
    effects: [
      "Additional Effect: Grants Soul Reaver"
    ],
    conditions: [
      "Can only be executed while under the effect of Enhanced Gallows.",
      "Shares a recast timer with all avatar attacks except Gluttony.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Arcane Circle": {
    id: "pve_action__21",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/b561271272c45fb8436bfe4dfb590b76c631687b.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 72,
    type: "Ability",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 30,
    tooltip: "Increases damage dealt by self and nearby party members by 3%.\nDuration: 20s\nAdditional Effect: Grants Circle of Sacrifice to self and nearby party members\nDuration: 5s\nAdditional Effect: Grants Bloodsown Circle to self\nDuration: 6s\nCircle of Sacrifice Effect: When you or party members under this effect successfully land a weaponskill or ability, or cast a spell, the reaper who applied it may be granted a stack of Immortal Sacrifice, up to a maximum of 8\nDuration: 30s\nBloodsown Circle Effect: Allows you to accumulate stacks of Immortal Sacrifice from party members under the effect of your Circle of Sacrifice",
    potency: [],
    effects: [
      "Additional Effect: Grants Circle of Sacrifice to self and nearby party members",
      "Additional Effect: Grants Bloodsown Circle to self",
      "Circle of Sacrifice Effect: When you or party members under this effect successfully land a weaponskill or ability, or cast a spell, the reaper who applied it may be granted a stack of Immortal Sacrifice, up to a maximum of 8",
      "Bloodsown Circle Effect: Allows you to accumulate stacks of Immortal Sacrifice from party members under the effect of your Circle of Sacrifice"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Regress: {
    id: "pve_action__22",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/eaeec5829efd0623650ee09d1b3867ef3804c643.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 74,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 30,
    radius: 0,
    tooltip: "Move instantly to the Hellsgate left behind by you.\nCan only be executed while under the effect of Threshold.\nCannot be executed while bound.\n\n※This action cannot be assigned to a hotbar.\n※Hell's Ingress or Hell's Egress will change to Regress when requirements for execution are met.",
    potency: [],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Threshold.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Gluttony: {
    id: "pve_action__23",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/933867484213377dc45cafd796ff5d934cee8906.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 76,
    type: "Ability",
    cast: 0.0,
    recast: 60.0,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Summons your avatar to deal unaspected damage to target and all enemies nearby it with a potency of 520 for the first enemy, and 25% less for all remaining enemies.\nAdditional Effect: Grants 2 stacks of Executioner\nDuration: 30s\nEffect cannot be stacked with Soul Reaver.\nSoul Gauge Cost: 50",
    potency: [
      "Summons your avatar to deal unaspected damage to target and all enemies nearby it with a potency of 520 for the first enemy, and 25% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Grants 2 stacks of Executioner"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Enshroud: {
    id: "pve_action__24",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/4e389efd3504b3ed9dcd4f7633ebc9a5bb528971.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 80,
    type: "Ability",
    cast: 0.0,
    recast: 5.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Offers your flesh as a vessel to your avatar, gaining maximum stacks of Lemure Shroud.\nDuration: 30s\nCertain actions cannot be executed while playing host to your avatar.\nAdditional Effect: Grants Oblatio\nDuration: 30s\nShroud Gauge Cost: 50",
    potency: [],
    effects: [
      "Additional Effect: Grants Oblatio"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Void Reaping": {
    id: "pve_action__25",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/d2632208267baca74f7d9c19ee7a9c794034f2f0.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 80,
    type: "Weaponskill",
    cast: 0.0,
    recast: 1.5,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 540.\nEnhanced Void Reaping Potency: 600\nAdditional Effect: Grants Enhanced Cross Reaping\nDuration: 30s\nAdditional Effect: Grants Void Shroud\nCan only be executed while under the effect of Enshrouded.\nRecast timer cannot be affected by status effects or gear attributes.\nLemure Shroud Cost: 1\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Gibbet changes to Void Reaping when requirements for execution are met.",
    potency: [
      "Delivers an attack with a potency of 540.",
      "Enhanced Void Reaping Potency: 600"
    ],
    effects: [
      "Additional Effect: Grants Enhanced Cross Reaping",
      "Additional Effect: Grants Void Shroud"
    ],
    conditions: [
      "Can only be executed while under the effect of Enshrouded.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Cross Reaping": {
    id: "pve_action__26",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/a080e4189263d80adcd79deaaac266c93798d202.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 80,
    type: "Weaponskill",
    cast: 0.0,
    recast: 1.5,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 540.\nEnhanced Cross Reaping Potency: 600\nAdditional Effect: Grants Enhanced Void Reaping\nDuration: 30s\nAdditional Effect: Grants Void Shroud\nCan only be executed while under the effect of Lemure Shroud.\nLemure Shroud Cost: 1\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Gallows changes to Cross Reaping when requirements for execution are met.",
    potency: [
      "Delivers an attack with a potency of 540.",
      "Enhanced Cross Reaping Potency: 600"
    ],
    effects: [
      "Additional Effect: Grants Enhanced Void Reaping",
      "Additional Effect: Grants Void Shroud"
    ],
    conditions: [
      "Can only be executed while under the effect of Lemure Shroud.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Grim Reaping": {
    id: "pve_action__27",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/3b57c45ec39fc75788c9603653a77c5b95f04e67.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 80,
    type: "Weaponskill",
    cast: 0.0,
    recast: 1.5,
    cost: {},
    range: 8,
    radius: 8,
    tooltip: "Delivers an attack with a potency of 200 to all enemies in a cone before you.\nAdditional Effect: Grants Void Shroud\nCan only be executed while under the effect of Enshrouded.\nLemure Shroud Cost: 1\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Guillotine changes to Grim Reaping when requirements for execution are met.",
    potency: [
      "Delivers an attack with a potency of 200 to all enemies in a cone before you."
    ],
    effects: [
      "Additional Effect: Grants Void Shroud"
    ],
    conditions: [
      "Can only be executed while under the effect of Enshrouded.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Soulsow: {
    id: "pve_action__28",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/a59a5def406758cbd282cffdea8bea00a98f5e58.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 82,
    type: "Spell",
    cast: 5.0,
    recast: 2.5,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Grants Soulsow to self, changing the action to Harvest Moon.\nCast time is instant when used outside of battle.",
    potency: [],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Harvest Moon": {
    id: "pve_action__29",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/e5f0a7dabd5ef44d08e8d5920d834f3e734169d9.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 82,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals unaspected damage to target and all enemies nearby it with a potency of 800 for the first enemy, and 40% less for all remaining enemies.\nAdditional Effect: Increases Soul Gauge by 10\nCan only be executed while under the effect of Soulsow.\n\n※This action cannot be assigned to a hotbar.\n※Soulsow changes to Harvest Moon when requirements for execution are met.",
    potency: [
      "Deals unaspected damage to target and all enemies nearby it with a potency of 800 for the first enemy, and 40% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Increases Soul Gauge by 10"
    ],
    conditions: [
      "Can only be executed while under the effect of Soulsow.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Lemure's Slice": {
    id: "pve_action__30",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/c9ae486399356401f032b455ea5b13f986236c82.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 86,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 280.\nVoid Shroud Cost: 2\nShares a recast timer with Lemure's Scythe.\n\n※This action cannot be assigned to a hotbar.\n※Blood Stalk changes to Lemure's Slice while under the effect of Enshrouded.",
    potency: [
      "Delivers an attack with a potency of 280."
    ],
    effects: [],
    conditions: [
      "Shares a recast timer with Lemure's Scythe.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Lemure's Scythe": {
    id: "pve_action__31",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/479155b751c2764273ae35c1aab71ed298ad9d18.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 86,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 8,
    radius: 8,
    tooltip: "Delivers an attack with a potency of 100 to all enemies in a cone before you.\nVoid Shroud Cost: 2\nShares a recast timer with Lemure's Slice.\n\n※This action cannot be assigned to a hotbar.\n※Grim Swathe changes to Lemure's Scythe while under the effect of Enshrouded.",
    potency: [
      "Delivers an attack with a potency of 100 to all enemies in a cone before you."
    ],
    effects: [],
    conditions: [
      "Shares a recast timer with Lemure's Slice.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Plentiful Harvest": {
    id: "pve_action__32",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/08babf4d2bf7ce046d03f459af8fa4c9921f96cc.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 88,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 15,
    radius: 15,
    tooltip: "Delivers an attack to all enemies in a straight line before you with a potency of 720 for the first enemy, and 20% less for all remaining enemies.\nImmortal Sacrifice Cost: 1 stack\nPotency increases up to 1,000 as stacks of Immortal Sacrifice exceed minimum cost.\nAdditional Effect: Grants Ideal Host\nDuration: 30s\nAdditional Effect: Grants Perfectio Occulta\nPerfectio Occulta Effect: Grants Perfectio Parata upon executing Communio\nDuration: 30s\nCannot be executed while under the effect of Bloodsown Circle.\nConsumes all stacks of Immortal Sacrifice upon execution.",
    potency: [
      "Delivers an attack to all enemies in a straight line before you with a potency of 720 for the first enemy, and 20% less for all remaining enemies.",
      "Potency increases up to 1,000 as stacks of Immortal Sacrifice exceed minimum cost."
    ],
    effects: [
      "Additional Effect: Grants Ideal Host",
      "Additional Effect: Grants Perfectio Occulta",
      "Perfectio Occulta Effect: Grants Perfectio Parata upon executing Communio"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Communio: {
    id: "pve_action__33",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/3b0daa7e454abbd2b6ce037b5c77157462fadbf7.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 90,
    type: "Spell",
    cast: 1.3,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals unaspected damage to target and all enemies nearby it with a potency of 1,100 for the first enemy, and 20% less for all remaining enemies.\nAdditional Effect: Grants Perfectio Parata when executed while Perfectio Occulta is active\nDuration: 30s\nEnshrouded effect expires upon execution.\nRequires at least one stack of Lemure Shroud to execute.",
    potency: [
      "Deals unaspected damage to target and all enemies nearby it with a potency of 1,100 for the first enemy, and 20% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Grants Perfectio Parata when executed while Perfectio Occulta is active"
    ],
    conditions: [
      "Requires at least one stack of Lemure Shroud to execute."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Sacrificium: {
    id: "pve_action__34",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/c30eb0a31733645a16fe4afedf837597addded77.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 92,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals unaspected damage to target and all enemies nearby it with a potency of 600 for the first enemy, and 20% less for all remaining enemies.\nCan only be executed while under the effect of Enshrouded and Oblatio.\n\n※This action cannot be assigned to a hotbar.\n※Gluttony changes to Sacrificium when requirements for execution are met.",
    potency: [
      "Deals unaspected damage to target and all enemies nearby it with a potency of 600 for the first enemy, and 20% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Enshrouded and Oblatio.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Executioner's Gibbet": {
    id: "pve_action__35",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/7df5921d09e8a524ef8b7c187a9f0cb1ee181aff.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 96,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 700.\n760 when executed from a target's flank.\nEnhanced Gibbet Potency: 760\nFlank Enhanced Potency: 820\nAdditional Effect: Grants Enhanced Gallows\nDuration: 60s\nThe action Blood Stalk changes to Unveiled Gallows while under the effect of Enhanced Gallows.\nAdditional Effect: Increases Shroud Gauge by 10\nCan only be executed while under the effect of Executioner.\n\n※This action cannot be assigned to a hotbar.\n※Gibbet changes to Executioner's Gibbet when requirements for execution are met.",
    potency: [
      "Delivers an attack with a potency of 700.",
      "Enhanced Gibbet Potency: 760",
      "Flank Enhanced Potency: 820"
    ],
    effects: [
      "Additional Effect: Grants Enhanced Gallows",
      "Additional Effect: Increases Shroud Gauge by 10"
    ],
    conditions: [
      "Can only be executed while under the effect of Executioner.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 60
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Executioner's Gallows": {
    id: "pve_action__36",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/0dfc7d7951330304c328135c306fa3d54b1a9cdc.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 96,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 3,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 700.\n760 when executed from a target's rear.\nEnhanced Gallows Potency: 760\nRear Enhanced Potency: 820\nAdditional Effect: Grants Enhanced Gibbet\nDuration: 60s\nThe action Blood Stalk changes to Unveiled Gibbet while under the effect of Enhanced Gibbet.\nAdditional Effect: Increases Shroud Gauge by 10\nCan only be executed while under the effect of Executioner.\n\n※This action cannot be assigned to a hotbar.\n※Gallows changes to Executioner's Gallows when requirements for execution are met.",
    potency: [
      "Delivers an attack with a potency of 700.",
      "Enhanced Gallows Potency: 760",
      "Rear Enhanced Potency: 820"
    ],
    effects: [
      "Additional Effect: Grants Enhanced Gibbet",
      "Additional Effect: Increases Shroud Gauge by 10"
    ],
    conditions: [
      "Can only be executed while under the effect of Executioner.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 60
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Executioner's Guillotine": {
    id: "pve_action__37",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/d732a04e72dd2c5e3c0702749e6310329b611ca8.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 96,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 8,
    radius: 8,
    tooltip: "Delivers an attack with a potency of 260 to all enemies in a cone before you.\nAdditional Effect: Increases Shroud Gauge by 10\nCan only be executed while under the effect of Executioner.\n\n※This action cannot be assigned to a hotbar.\n※Guillotine changes to Executioner's Guillotine when requirements for execution are met.",
    potency: [
      "Delivers an attack with a potency of 260 to all enemies in a cone before you."
    ],
    effects: [
      "Additional Effect: Increases Shroud Gauge by 10"
    ],
    conditions: [
      "Can only be executed while under the effect of Executioner.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Perfectio: {
    id: "pve_action__38",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/ab9537a1e24665b2b794656e28f58981b95b3c52.png",
    job: "Reaper",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/p/y8GHAXX4qhY7D-yqnCqtEPkjoo.png",
    level: 100,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Delivers an attack to target and all enemies nearby it with a potency of 1,300 for the first enemy, and 20% less for all remaining enemies.\nCan only be executed while under the effect of Perfectio Parata.\n\n※This action cannot be assigned to a hotbar.\n※Communio changes to Perfectio when requirements for execution are met.",
    potency: [
      "Delivers an attack to target and all enemies nearby it with a potency of 1,300 for the first enemy, and 20% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Perfectio Parata.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_reaper_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  }
},
  rotations: []
};