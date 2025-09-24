export const PictomancerConfig = {
  actions: {
  "Fire in Red": {
    id: "pve_action__01",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/e25904d9d00a0c1067e479ea752557aaec6fc30d.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 1,
    type: "Spell",
    cast: 1.5,
    recast: 2.5,
    cost: {
      mp: 300
    },
    range: 25,
    radius: 0,
    tooltip: "Deals fire damage with a potency of 490.\nAdditional Effect: Grants Aetherhues\nDuration: 30s\nCannot be executed while under the effect of Subtractive Palette.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.",
    potency: [
      "Deals fire damage with a potency of 490."
    ],
    effects: [
      "Additional Effect: Grants Aetherhues"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Aero in Green": {
    id: "pve_action__02",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/07406a981daf5e92fa645d070a97d8dc87e68a78.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 5,
    type: "Spell",
    cast: 1.5,
    recast: 2.5,
    cost: {
      mp: 300
    },
    range: 25,
    radius: 0,
    tooltip: "Deals wind damage with a potency of 530.\nAdditional Effect: Grants Aetherhues II\nDuration: 30s\nCan only be executed while under the effect of Aetherhues and not under the effect of Subtractive Palette. \nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\n\n※This action cannot be assigned to a hotbar.\n※Fire in Red changes to Aero in Green when requirements for execution are met.",
    potency: [
      "Deals wind damage with a potency of 530."
    ],
    effects: [
      "Additional Effect: Grants Aetherhues II"
    ],
    conditions: [
      "Can only be executed while under the effect of Aetherhues and not under the effect of Subtractive Palette.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Tempera Coat": {
    id: "pve_action__03",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/615ab65c73e8727db1cd8de2bb161626170506c8.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 10,
    type: "Ability",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Creates a barrier around self that absorbs damage totaling 20% of maximum HP.\nDuration: 10s\nReduces the recast time of Tempera Coat by 60 seconds when barrier is completely absorbed.",
    potency: [],
    effects: [],
    conditions: [],
    duration: {
      seconds: 10
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Water in Blue": {
    id: "pve_action__04",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/2cf03c27a9e09631ea594dea8b064cf4f9aa48be.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 15,
    type: "Spell",
    cast: 1.5,
    recast: 2.5,
    cost: {
      mp: 300
    },
    range: 25,
    radius: 0,
    tooltip: "Deals water damage with a potency of 570.\nAdditional Effect: Increases Palette Gauge by 25\nAdditional Effect: Grants White Paint\nMaximum Stacks: 5\nCan only be executed while under the effect of Aetherhues II and not under the effect of Subtractive Palette.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\n\n※This action cannot be assigned to a hotbar.\n※Aero in Green changes to Water in Blue when requirements for execution are met.",
    potency: [
      "Deals water damage with a potency of 570."
    ],
    effects: [
      "Additional Effect: Increases Palette Gauge by 25",
      "Additional Effect: Grants White Paint"
    ],
    conditions: [
      "Can only be executed while under the effect of Aetherhues II and not under the effect of Subtractive Palette.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Smudge: {
    id: "pve_action__05",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/2933360212b43c10972912ef1907e45937f50292.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 20,
    type: "Ability",
    cast: 0.0,
    recast: 20.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Quickly dash 15 yalms forward.\nAdditional Effect: Increases movement speed\nDuration: 5s\nCannot be executed while bound.",
    potency: [],
    effects: [
      "Additional Effect: Increases movement speed"
    ],
    conditions: [],
    duration: {
      seconds: 5
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Fire II in Red": {
    id: "pve_action__06",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/a7bc8c6fb62a9d9666ef56e064ac6624474520c4.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 25,
    type: "Spell",
    cast: 1.5,
    recast: 2.5,
    cost: {
      mp: 300
    },
    range: 25,
    radius: 5,
    tooltip: "Deals fire damage with a potency of 180 to target and all enemies nearby it.\nAdditional Effect: Grants Aetherhues\nDuration: 30s\nCannot be executed while under the effect of Subtractive Palette.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.",
    potency: [
      "Deals fire damage with a potency of 180 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Grants Aetherhues"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Creature Motif": {
    id: "pve_action__07",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/89e15b3832fe4cd3edbe62d6149f48053694306f.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 30,
    type: "Spell",
    cast: 3.0,
    recast: 4.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Paints a creature motif.\nThis action changes when placed on the hotbar in the order of Pom Motif, Wing Motif, Claw Motif, and Maw Motif when executed in succession.\nCast immediately when used outside of combat.\nThis action does not share a recast timer with any other actions. Recast timer cannot be affected by status effects or gear attributes.\nUpon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.",
    potency: [],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Living Muse": {
    id: "pve_action__08",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/f9128e8be207d2af1ea466a8a16e0c84028bd237.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 30,
    type: "Ability",
    cast: 0.0,
    recast: 40.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Render your depiction of a creature to life.\nThis action changes to Pom Muse, Winged Muse, Clawed Muse, or Fanged Muse based on your current motif.\nMaximum Charges: 3\nCan only be executed when a Creature Motif is depicted on the Creature Canvas.",
    potency: [],
    effects: [],
    conditions: [
      "Can only be executed when a Creature Motif is depicted on the Creature Canvas."
    ],
    duration: null,
    max_charges: 3,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Mog of the Ages": {
    id: "pve_action__09",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/67d1a8e6464d65e94696ab65d1b0ba85e7501a91.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 30,
    type: "Ability",
    cast: 0.0,
    recast: 30.0,
    cost: {},
    range: 25,
    radius: 25,
    tooltip: "Render your moogle portrait to life, dealing unaspected damage to all enemies in a straight line before you with a potency of 1,000 for the first enemy, and 70% less for all remaining enemies.\nCan only be executed while Moogle Portrait is active.",
    potency: [
      "Render your moogle portrait to life, dealing unaspected damage to all enemies in a straight line before you with a potency of 1,000 for the first enemy, and 70% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while Moogle Portrait is active."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Pom Motif": {
    id: "pve_action__10",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/39158442095659217fb08bed59c45b2caf4ae7c2.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 30,
    type: "Spell",
    cast: 3.0,
    recast: 4.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Paints a pom.\nCast immediately when used outside of combat.\nThe Creature Canvas must be empty to execute this action.\nThis action does not share a recast timer with any other actions. Recast timer cannot be affected by status effects or gear attributes.\nUpon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Creature Motif changes to Pom Motif when requirements for execution are met.",
    potency: [],
    effects: [],
    conditions: [
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Wing Motif": {
    id: "pve_action__11",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/9ccb0df55e15663f80866bd12936553cef27e1f8.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 30,
    type: "Spell",
    cast: 3.0,
    recast: 4.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Paints a pair of wings.\nCast immediately when used outside of combat.\nThe Creature Canvas must be empty to execute this action.\nThis action does not share a recast timer with any other actions. Recast timer cannot be affected by status effects or gear attributes.\nUpon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Creature Motif changes to Wing Motif when requirements for execution are met.",
    potency: [],
    effects: [],
    conditions: [
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Pom Muse": {
    id: "pve_action__12",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/839afb2d992cdfd4588764299d02f5acd46d8765.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 30,
    type: "Ability",
    cast: 0.0,
    recast: 40.0,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Render a rain of poms, dealing unaspected damage to target and all enemies nearby it with a potency of 800 for the first enemy, and 70% less for all remaining enemies.\nAdditional Effect: Adds Depiction of Pom to the Creature Canvas\nMaximum Charges: 3\nCan only be executed while a pom is painted on the Creature Canvas.\n\n※This action cannot be assigned to a hotbar.\n※Living Muse changes to Pom Muse when requirements for execution are met.",
    potency: [
      "Render a rain of poms, dealing unaspected damage to target and all enemies nearby it with a potency of 800 for the first enemy, and 70% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Adds Depiction of Pom to the Creature Canvas"
    ],
    conditions: [
      "Can only be executed while a pom is painted on the Creature Canvas.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: 3,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Winged Muse": {
    id: "pve_action__13",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/78640b1974c2e3ac862c3e94b6cf0715c2a53705.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 30,
    type: "Ability",
    cast: 0.0,
    recast: 40.0,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Render a pair of windborne wings, dealing unaspected damage to target and all enemies nearby it with a potency of 800 for the first enemy, and 70% less for all remaining enemies.\nAdditional Effect: Adds Depiction of Wings to the Creature Canvas\nAlso paints a Moogle Portrait when Depiction of Pom and Depiction of Wings are rendered on the Creature Canvas.\nMaximum Charges: 3\nCan only be executed while a pair of wings is painted on the Creature Canvas.\n\n※This action cannot be assigned to a hotbar.\n※Living Muse changes to Winged Muse when requirements for execution are met.",
    potency: [
      "Render a pair of windborne wings, dealing unaspected damage to target and all enemies nearby it with a potency of 800 for the first enemy, and 70% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Adds Depiction of Wings to the Creature Canvas"
    ],
    conditions: [
      "Can only be executed while a pair of wings is painted on the Creature Canvas.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: 3,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Aero II in Green": {
    id: "pve_action__14",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/bc20c2aa10ac1db0fae2452b5c3cd41e2b9c2eda.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 35,
    type: "Spell",
    cast: 1.5,
    recast: 2.5,
    cost: {
      mp: 300
    },
    range: 25,
    radius: 5,
    tooltip: "Deals wind damage with a potency of 200 to target and all enemies nearby it.\nAdditional Effect: Grants Aetherhues II\nDuration: 30s\nCan only be executed while under the effect of Aetherhues and not under the effect of Subtractive Palette. \nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\n\n※This action cannot be assigned to a hotbar.\n※Fire II in Red changes to Aero II in Green when requirements for execution are met.",
    potency: [
      "Deals wind damage with a potency of 200 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Grants Aetherhues II"
    ],
    conditions: [
      "Can only be executed while under the effect of Aetherhues and not under the effect of Subtractive Palette.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Water II in Blue": {
    id: "pve_action__15",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/5d8842fd05fef2d1c4f940bd5a7b35137bdba502.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 45,
    type: "Spell",
    cast: 1.5,
    recast: 2.5,
    cost: {
      mp: 300
    },
    range: 25,
    radius: 5,
    tooltip: "Deals water damage with a potency of 220 to target and all enemies nearby it.\nAdditional Effect: Increases Palette Gauge by 25\nAdditional Effect: Grants White Paint\nMaximum Stacks: 5\nCan only be executed while under the effect of Aetherhues II and not under the effect of Subtractive Palette.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\n\n※This action cannot be assigned to a hotbar.\n※Aero II in Green changes to Water II in Blue when requirements for execution are met.",
    potency: [
      "Deals water damage with a potency of 220 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Increases Palette Gauge by 25",
      "Additional Effect: Grants White Paint"
    ],
    conditions: [
      "Can only be executed while under the effect of Aetherhues II and not under the effect of Subtractive Palette.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Weapon Motif": {
    id: "pve_action__16",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/385f005903208963e20e251176a2e9b7efc0590f.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 50,
    type: "Spell",
    cast: 3.0,
    recast: 4.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Paints a weapon motif.\nThis action changes to Hammer Motif when placed on the hotbar.\nCast immediately when used outside of combat.\nThis action does not share a recast timer with any other actions. Recast timer cannot be affected by status effects or gear attributes.\nUpon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.",
    potency: [],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Steel Muse": {
    id: "pve_action__17",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/b17ceff782edd7fed2934d1bb6a918fb8e97ef7f.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 50,
    type: "Ability",
    cast: 0.0,
    recast: 60.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Render your depiction of a weapon to life.\nThis action changes to Striking Muse based on your current motif.\nMaximum Charges: 2\nCan only be executed in combat and when a Weapon Motif is depicted on the Weapon Canvas.",
    potency: [],
    effects: [],
    conditions: [
      "Can only be executed in combat and when a Weapon Motif is depicted on the Weapon Canvas."
    ],
    duration: null,
    max_charges: 2,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Hammer Stamp": {
    id: "pve_action__18",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/bd61923ae5b677d8d93e57b962b23511d0f4396c.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 50,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals unaspected damage as a critical direct hit with a potency of 560 for the first enemy, and 70% less for all remaining enemies.\nCan only be executed while under the effect of Hammer Time.",
    potency: [
      "Deals unaspected damage as a critical direct hit with a potency of 560 for the first enemy, and 70% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Hammer Time."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Hammer Motif": {
    id: "pve_action__19",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/3c48a4050ea4386ef17063dbc841e75327a8d29e.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 50,
    type: "Spell",
    cast: 3.0,
    recast: 4.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Paints a hammer.\nCast immediately when used outside of combat.\nCannot be executed while under the effect of Hammer Time.\nThe Weapon Canvas must be empty to execute this action.\nThis action does not share a recast timer with any other actions. Recast timer cannot be affected by status effects or gear attributes.\nUpon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Weapon Motif changes to Hammer Motif when requirements for execution are met.",
    potency: [],
    effects: [],
    conditions: [
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Striking Muse": {
    id: "pve_action__20",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/83dc200badfab99ff0f550da3b13737e82dfa118.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 50,
    type: "Ability",
    cast: 0.0,
    recast: 60.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Render a mighty hammer, granting three stacks of Hammer Time.\nDuration: 30s\nMaximum Charges: 2\nCan only be executed while in combat and when a hammer is painted on the Weapon Canvas.\n\n※This action cannot be assigned to a hotbar.\n※Steel Muse changes to Striking Muse when requirements for execution are met.",
    potency: [],
    effects: [],
    conditions: [
      "Can only be executed while in combat and when a hammer is painted on the Weapon Canvas.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: 2,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Blizzard in Cyan": {
    id: "pve_action__21",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/4a31c08d79867d5b332f98f8616bb06b9088daf0.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 60,
    type: "Spell",
    cast: 2.3,
    recast: 3.3,
    cost: {
      mp: 400
    },
    range: 25,
    radius: 0,
    tooltip: "Deals ice damage with a potency of 860.\nAdditional Effect: Grants Aetherhues\nDuration: 30s\nCan only be executed while under the effect of Subtractive Palette.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.",
    potency: [
      "Deals ice damage with a potency of 860."
    ],
    effects: [
      "Additional Effect: Grants Aetherhues"
    ],
    conditions: [
      "Can only be executed while under the effect of Subtractive Palette."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Blizzard II in Cyan": {
    id: "pve_action__22",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/5f09a63e115cb331f60826a258ba7d2cf51adf3f.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 60,
    type: "Spell",
    cast: 2.3,
    recast: 3.3,
    cost: {
      mp: 400
    },
    range: 25,
    radius: 5,
    tooltip: "Deals ice damage with a potency of 360 to target and all enemies nearby it.\nAdditional Effect: Grants Aetherhues\nDuration: 30s\nCan only be executed while under the effect of Subtractive Palette.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.",
    potency: [
      "Deals ice damage with a potency of 360 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Grants Aetherhues"
    ],
    conditions: [
      "Can only be executed while under the effect of Subtractive Palette."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Subtractive Palette": {
    id: "pve_action__23",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/346a632a64591ed1e61406c1a85357112ae98a80.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 60,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Grants 3 stacks of Subtractive Palette.\nAdditional Effect: Grants Monochrome Tones\nMonochrome Tones Effect: Converts one stack of White Paint into Black Paint\nCannot be cast while under the effect of Subtractive Palette.\nPalette Gauge Cost: 50",
    potency: [],
    effects: [
      "Additional Effect: Grants Monochrome Tones",
      "Monochrome Tones Effect: Converts one stack of White Paint into Black Paint"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Stone in Yellow": {
    id: "pve_action__24",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/8f7552113b38a8e6b3debb5ca900fbcd2bc3d0fb.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 60,
    type: "Spell",
    cast: 2.3,
    recast: 3.3,
    cost: {
      mp: 400
    },
    range: 25,
    radius: 0,
    tooltip: "Deals earth damage with a potency of 900.\nAdditional Effect: Grants Aetherhues II\nDuration: 30s\nCan only be executed while under the effect of Aetherhues and Subtractive Palette.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Blizzard in Cyan changes to Stone in Yellow when requirements for execution are met.",
    potency: [
      "Deals earth damage with a potency of 900."
    ],
    effects: [
      "Additional Effect: Grants Aetherhues II"
    ],
    conditions: [
      "Can only be executed while under the effect of Aetherhues and Subtractive Palette.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Thunder in Magenta": {
    id: "pve_action__25",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/f6f648fbed76b3d0b99e4127e8e9024234b6fb97.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 60,
    type: "Spell",
    cast: 2.3,
    recast: 3.3,
    cost: {
      mp: 400
    },
    range: 25,
    radius: 0,
    tooltip: "Deals lightning damage with a potency of 940.\nAdditional Effect: Grants White Paint\nMaximum Stacks: 5\nCan only be executed while under the effect of Aetherhues II and Subtractive Palette.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Stone in Yellow changes to Thunder in Magenta when requirements for execution are met.",
    potency: [
      "Deals lightning damage with a potency of 940."
    ],
    effects: [
      "Additional Effect: Grants White Paint"
    ],
    conditions: [
      "Can only be executed while under the effect of Aetherhues II and Subtractive Palette.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Stone II in Yellow": {
    id: "pve_action__26",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/900e2d32cfb03084ddf48bc8120763ad623f5540.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 60,
    type: "Spell",
    cast: 2.3,
    recast: 3.3,
    cost: {
      mp: 400
    },
    range: 25,
    radius: 5,
    tooltip: "Deals earth damage with a potency of 380 to target and all enemies nearby it.\nAdditional Effect: Grants Aetherhues II\nDuration: 30s\nCan only be executed while under the effect of Aetherhues and Subtractive Palette.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Blizzard II in Cyan changes to Stone II in Yellow when requirements for execution are met.",
    potency: [
      "Deals earth damage with a potency of 380 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Grants Aetherhues II"
    ],
    conditions: [
      "Can only be executed while under the effect of Aetherhues and Subtractive Palette.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Thunder II in Magenta": {
    id: "pve_action__27",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/6463351c3b4bef69baddc35e1c6d93a247daa923.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 60,
    type: "Spell",
    cast: 2.3,
    recast: 3.3,
    cost: {
      mp: 400
    },
    range: 25,
    radius: 5,
    tooltip: "Deals lightning damage with a potency of 400 to target and all enemies nearby it.\nAdditional Effect: Grants White Paint\nMaximum Stacks: 5\nCan only be executed while under the effect of Aetherhues II and Subtractive Palette.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Stone II in Yellow changes to Thunder II in Magenta when requirements for execution are met.",
    potency: [
      "Deals lightning damage with a potency of 400 to target and all enemies nearby it."
    ],
    effects: [
      "Additional Effect: Grants White Paint"
    ],
    conditions: [
      "Can only be executed while under the effect of Aetherhues II and Subtractive Palette.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Landscape Motif": {
    id: "pve_action__28",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/f05b478236d27157b878276c280c3b49bd13cca6.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 70,
    type: "Spell",
    cast: 3.0,
    recast: 4.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Paints a landscape motif.\nThis action changes to Starry Sky Motif when placed on the hotbar.\nCast immediately when used outside of combat.\nThis action does not share a recast timer with any other actions. Recast timer cannot be affected by status effects or gear attributes.\nUpon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.",
    potency: [],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Scenic Muse": {
    id: "pve_action__29",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/d711d26c3f29241311b78bca1d92cc18de18e35f.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 70,
    type: "Ability",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Render your depiction of a landscape to life.\nThis action changes to Starry Muse based on your current motif.\nCan only be executed in combat and when a Landscape Motif is depicted on the Landscape Canvas.",
    potency: [],
    effects: [],
    conditions: [
      "Can only be executed in combat and when a Landscape Motif is depicted on the Landscape Canvas."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Starry Sky Motif": {
    id: "pve_action__30",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/39ff3bff7a4857c386313552edd236755358526a.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 70,
    type: "Spell",
    cast: 3.0,
    recast: 4.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Paints a starry sky.\nCast immediately when used outside of combat.\nCannot be executed while under the effect of Starry Muse.\nThe Landscape Canvas must be empty to execute this action.\nThis action does not share a recast timer with any other actions. Recast timer cannot be affected by status effects or gear attributes.\nUpon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Landscape Motif changes to Starry Sky Motif when requirements for execution are met.",
    potency: [],
    effects: [],
    conditions: [
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Starry Muse": {
    id: "pve_action__31",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/cafa13f63003b860d9edc8e67aa095fed5501a79.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 70,
    type: "Ability",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 30,
    tooltip: "Render a star streaming sky over a magicked landscape, increasing damage dealt by self and nearby party members by 5%.\nDuration: 20s\nAdditional Effect: Grants Subtractive Spectrum\nDuration: 30s\nAdditional Effect: Grants Inspiration and 5 stacks of Hyperphantasia\nStacks of Hyperphantasia are consumed upon casting certain spells while under the effect of Inspiration.\nDuration: 30s\nInspiration Effect: Reduces cast time and recast time of Star Prism and aetherhue spells by 25% while standing within the bounds of the magicked landscape\nEffect expires when all stacks of Hyperphantasia are consumed.\nAdditional Effect: Grants Rainbow Bright upon consuming all 5 stacks of Hyperphantasia\nDuration: 30s\nRainbow Bright Effect: Rainbow Drip can be cast immediately and has a reduced recast timer\nAdditional Effect: Grants Starstruck\nDuration: 20s\nCan only be executed while in combat and when a starry sky is painted on the Landscape Canvas.\n\n※This action cannot be assigned to a hotbar.\n※Scenic Muse changes to Starry Muse when requirements for execution are met.",
    potency: [],
    effects: [
      "Additional Effect: Grants Subtractive Spectrum",
      "Additional Effect: Grants Inspiration and 5 stacks of Hyperphantasia",
      "Inspiration Effect: Reduces cast time and recast time of Star Prism and aetherhue spells by 25% while standing within the bounds of the magicked landscape",
      "Additional Effect: Grants Rainbow Bright upon consuming all 5 stacks of Hyperphantasia",
      "Rainbow Bright Effect: Rainbow Drip can be cast immediately and has a reduced recast timer",
      "Additional Effect: Grants Starstruck"
    ],
    conditions: [
      "Can only be executed while in combat and when a starry sky is painted on the Landscape Canvas.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 20
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Holy in White": {
    id: "pve_action__32",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/5d8eefda835c959562af7d1fe12b229cedcca409.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 80,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {
      mp: 300
    },
    range: 25,
    radius: 5,
    tooltip: "Deals unaspected damage to target and all enemies nearby it with a potency of 570 for the first enemy, and 65% less for all remaining enemies.\nCan only be executed while under the effect of White Paint.\nCannot be executed while under the effect of Monochrome Tones.\nWhite Paint Cost: 1\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.",
    potency: [
      "Deals unaspected damage to target and all enemies nearby it with a potency of 570 for the first enemy, and 65% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of White Paint."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Hammer Brush": {
    id: "pve_action__33",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/10803efae25f689fa66fe9ddedce3a95390e80c5.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 86,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals unaspected damage as a critical direct hit with a potency of 580 for the first enemy, and 70% less for all remaining enemies.\nCombo Action: Hammer Stamp\nCan only be executed while under the effect of Hammer Time.\n\n※This action cannot be assigned to a hotbar.\n※Hammer Stamp changes to Hammer Brush when requirements for execution are met.",
    potency: [
      "Deals unaspected damage as a critical direct hit with a potency of 580 for the first enemy, and 70% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Hammer Time.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Polishing Hammer": {
    id: "pve_action__34",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/2405c837c6e42b5e05b84f9e10b30ef2eb6224e0.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 86,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals unaspected damage as a critical direct hit with a potency of 600 for the first enemy, and 70% less for all remaining enemies.\nCombo Action: Hammer Brush\nCan only be executed while under the effect of Hammer Time.\n\n※This action cannot be assigned to a hotbar.\n※Hammer Brush changes to Polishing Hammer when requirements for execution are met.",
    potency: [
      "Deals unaspected damage as a critical direct hit with a potency of 600 for the first enemy, and 70% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Hammer Time.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Tempera Grassa": {
    id: "pve_action__35",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/ed684b430814130c6917a00018cd5e400430e210.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 88,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 0,
    radius: 30,
    tooltip: "Removes Tempera Coat to create a barrier around self and all nearby party members that absorbs damage totaling 10% of maximum HP.\nDuration: 10s\nReduces the recast time of Tempera Coat by 30 seconds when barrier is completely absorbed.\nCan only be executed when under the effect of Tempera Coat.",
    potency: [],
    effects: [],
    conditions: [
      "Can only be executed when under the effect of Tempera Coat."
    ],
    duration: {
      seconds: 10
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Comet in Black": {
    id: "pve_action__36",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/b6e90d61c6e71d968943043d62ddb5e1a9e6d7f3.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 90,
    type: "Spell",
    cast: 0.0,
    recast: 3.3,
    cost: {
      mp: 400
    },
    range: 25,
    radius: 5,
    tooltip: "Deals unaspected damage to target and all enemies nearby it with a potency of 940 for the first enemy, and 65% less for all remaining enemies.\nCan only be executed while under the effect of Black Paint and Monochrome Tones.\nBlack Paint Cost: 1\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.",
    potency: [
      "Deals unaspected damage to target and all enemies nearby it with a potency of 940 for the first enemy, and 65% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Black Paint and Monochrome Tones."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Rainbow Drip": {
    id: "pve_action__37",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/5611f2fd77f2a770574f207216a66a12629a7526.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 92,
    type: "Spell",
    cast: 4.0,
    recast: 6.0,
    cost: {},
    range: 25,
    radius: 25,
    tooltip: "Deals unaspected damage to all enemies in a straight line before you with a potency of 1,000 for the first enemy, and 85% less for all remaining enemies.\nAdditional Effect: Grants White Paint\nMaximum Stacks: 5\nWhen Rainbow Bright is active, Rainbow Drip can be cast immediately and its recast timer is reduced.\nThis action does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.",
    potency: [
      "Deals unaspected damage to all enemies in a straight line before you with a potency of 1,000 for the first enemy, and 85% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Grants White Paint"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Claw Motif": {
    id: "pve_action__38",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/34cd074b3bd5cc9036d2598ae899aed5e77e6db3.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 96,
    type: "Spell",
    cast: 3.0,
    recast: 4.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Paints a claw.\nCast immediately when used outside of combat.\nThe Creature Canvas must be empty to execute this action.\nThis action does not share a recast timer with any other actions. Recast timer cannot be affected by status effects or gear attributes.\nUpon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Creature Motif changes to Claw Motif when requirements for execution are met.",
    potency: [],
    effects: [],
    conditions: [
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Maw Motif": {
    id: "pve_action__39",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/96814a40791c36cc4eff5e82300e1fb851a4515e.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 96,
    type: "Spell",
    cast: 3.0,
    recast: 4.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Paints a set of fangs.\nCast immediately when used outside of combat.\nThe Creature Canvas must be empty to execute this action.\nThis action does not share a recast timer with any other actions. Recast timer cannot be affected by status effects or gear attributes.\nUpon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Creature Motif changes to Maw Motif when requirements for execution are met.",
    potency: [],
    effects: [],
    conditions: [
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Clawed Muse": {
    id: "pve_action__40",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/e7eb51e71ca43854e55e520c860658d166e4b266.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 96,
    type: "Ability",
    cast: 0.0,
    recast: 40.0,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Render a sharpened claw, dealing unaspected damage to target and all enemies nearby it with a potency of 800 for the first enemy, and 70% less for all remaining enemies.\nAdditional Effect: Adds Depiction of Claw to the Creature Canvas\nMaximum Charges: 3\nCan only be executed while a claw is painted on the Creature Canvas.\n\n※This action cannot be assigned to a hotbar.\n※Living Muse changes to Clawed Muse when requirements for execution are met.",
    potency: [
      "Render a sharpened claw, dealing unaspected damage to target and all enemies nearby it with a potency of 800 for the first enemy, and 70% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Adds Depiction of Claw to the Creature Canvas"
    ],
    conditions: [
      "Can only be executed while a claw is painted on the Creature Canvas.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: 3,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Fanged Muse": {
    id: "pve_action__41",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/a7397b9f417ac2daf98e9f72b38e30768ec3b1cf.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 96,
    type: "Ability",
    cast: 0.0,
    recast: 40.0,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Render a set of ferocious fangs, dealing unaspected damage to target and all enemies nearby it with a potency of 800 for the first enemy, and 70% less for all remaining enemies.\nAdditional Effect: Adds Depiction of Fangs to the Creature Canvas\nAlso paints a Madeen Portrait when Depiction of Pom, Depiction of Wings, Depiction of Claw, and Depiction of Fangs are rendered on the Creature Canvas.\nAll depictions are removed from the canvas upon execution.\nMaximum Charges: 3\nCan only be executed while fangs are painted on the Creature Canvas.\n\n※This action cannot be assigned to a hotbar.\n※Living Muse changes to Fanged Muse when requirements for execution are met.",
    potency: [
      "Render a set of ferocious fangs, dealing unaspected damage to target and all enemies nearby it with a potency of 800 for the first enemy, and 70% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Adds Depiction of Fangs to the Creature Canvas"
    ],
    conditions: [
      "Can only be executed while fangs are painted on the Creature Canvas.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: 3,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Retribution of the Madeen": {
    id: "pve_action__42",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/cfe33f3c8faa98ade9f3f2fa13e4fbb1aa0cb3e3.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 96,
    type: "Ability",
    cast: 0.0,
    recast: 30.0,
    cost: {},
    range: 25,
    radius: 25,
    tooltip: "Render your Madeen portrait to life, dealing unaspected damage to all enemies in a straight line before you with a potency of 1,100 for the first enemy, and 70% less for all remaining enemies.\nCan only be executed while Madeen Portrait is active.\n\n※This action cannot be assigned to a hotbar.\n※Mog of the Ages changes to Retribution of the Madeen when requirements for execution are met.",
    potency: [
      "Render your Madeen portrait to life, dealing unaspected damage to all enemies in a straight line before you with a potency of 1,100 for the first enemy, and 70% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while Madeen Portrait is active.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Star Prism": {
    id: "pve_action__43",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/5627109a7394cce83a4085e16b4448a7d0262525.png",
    job: "Pictomancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/t0iiQ-ja8O8YNZaVimL5Qb6Tnw.png",
    level: 100,
    type: "Spell",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Deals unaspected damage with a potency of 1,100 for the first enemy, and 70% less for all remaining enemies.\nAdditional Effect: Restores HP of all party members within 30 yalms of target\nCure Potency: 400\nCan only be executed while under the effect of Starstruck.\nWhen standing within the bounds of Starry Muse, consumes a stack of Hyperphantasia if available.",
    potency: [
      "Deals unaspected damage with a potency of 1,100 for the first enemy, and 70% less for all remaining enemies.",
      "Cure Potency: 400"
    ],
    effects: [
      "Additional Effect: Restores HP of all party members within 30 yalms of target"
    ],
    conditions: [
      "Can only be executed while under the effect of Starstruck."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Addle: {
    id: "mrange_action__01",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/b45e688d81b5607246600f904aac008364db0d1e.png",
    job: "Magical Ranged DPS",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/X/8Dnf8Wy9IyxIt21y6lrE5atKt0.png",
    level: 8,
    type: "Ability",
    cast: 0.0,
    recast: 90.0,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Lowers target's physical damage dealt by 5% and magic damage dealt by 10%.\nDuration: 15s",
    potency: [],
    effects: [],
    conditions: [],
    duration: {
      seconds: 15
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Sleep: {
    id: "mrange_action__02",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/10e9fb5302668c923b8237ffbd4841ccc6c2edb4.png",
    job: "Magical Ranged DPS",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/X/8Dnf8Wy9IyxIt21y6lrE5atKt0.png",
    level: 10,
    type: "Spell",
    cast: 2.5,
    recast: 2.5,
    cost: {
      mp: 800
    },
    range: 30,
    radius: 5,
    tooltip: "Puts target and all nearby enemies to sleep.\nDuration: 30s\nCancels auto-attack upon execution.",
    potency: [],
    effects: [],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Lucid Dreaming": {
    id: "mrange_action__03",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/3629c6854aa559656623925e2489b60c2fa91e18.png",
    job: "Healer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/V5xx3kfnREBO-2xWbTUW2Csy_Q.png",
    level: 14,
    type: "Ability",
    cast: 0.0,
    recast: 60.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Gradually restores own MP.\nPotency: 55\nDuration: 21s",
    potency: [
      "Potency: 55"
    ],
    effects: [],
    conditions: [],
    duration: {
      seconds: 21
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Swiftcast: {
    id: "mrange_action__04",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/27d401b3cfbf90c846ffeaa9f661afb4bd77ce98.png",
    job: "Healer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/V5xx3kfnREBO-2xWbTUW2Csy_Q.png",
    level: 18,
    type: "Ability",
    cast: 0.0,
    recast: 40.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Next spell is cast immediately.\nDuration: 10s",
    potency: [],
    effects: [],
    conditions: [],
    duration: {
      seconds: 10
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Surecast: {
    id: "mrange_action__05",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/477d1e7f7115db19c344c0f5cadfcfa2ac0cdcc0.png",
    job: "Healer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/e/V5xx3kfnREBO-2xWbTUW2Csy_Q.png",
    level: 44,
    type: "Ability",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Spells can be cast without interruption.\nAdditional Effect: Nullifies most knockback and draw-in effects\nDuration: 6s",
    potency: [],
    effects: [
      "Additional Effect: Nullifies most knockback and draw-in effects"
    ],
    conditions: [],
    duration: {
      seconds: 6
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_pictomancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  }
},
  rotations: []
};