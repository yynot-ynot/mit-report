export const DancerConfig = {
  actions: {
  Cascade: {
    id: "pve_action__01",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/6843786e4a944ff2e315004f38416b9098b62988.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 1,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 220.\nAdditional Effect: 50% chance of granting Silken Symmetry\nDuration: 30s",
    potency: [
      "Delivers an attack with a potency of 220."
    ],
    effects: [
      "Additional Effect: 50% chance of granting Silken Symmetry"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Fountain: {
    id: "pve_action__02",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/25291ed46a237d93b8ada8db02fdeb34f5706c6e.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 2,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 120.\nCombo Action: Cascade\nCombo Potency: 280\nCombo Bonus: 50% chance of granting Silken Flow\nDuration: 30s",
    potency: [
      "Delivers an attack with a potency of 120.",
      "Combo Potency: 280"
    ],
    effects: [
      "Combo Bonus: 50% chance of granting Silken Flow"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Windmill: {
    id: "pve_action__03",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/2b56bd032544ac3119cf459288984ea195837486.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 15,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 0,
    radius: 5,
    tooltip: "Delivers an attack with a potency of 120 to all nearby enemies.\nAdditional Effect: 50% chance of granting Silken Symmetry\nDuration: 30s",
    potency: [
      "Delivers an attack with a potency of 120 to all nearby enemies."
    ],
    effects: [
      "Additional Effect: 50% chance of granting Silken Symmetry"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Standard Step": {
    id: "pve_action__04",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/601122ac0085d666731203ba91b41a5099457eca.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 15,
    type: "Weaponskill",
    cast: 0.0,
    recast: 30.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Begin dancing, granting yourself Standard Step.\nDuration: 15s\nAction changes to Standard Finish while dancing.\nOnly Standard Finish, En Avant, Curing Waltz, Shield Samba, step actions, role actions, Sprint, and Limit Break can be performed while dancing.\nThis weaponskill does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.",
    potency: [],
    effects: [],
    conditions: [],
    duration: {
      seconds: 15
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Standard Finish": {
    id: "pve_action__05",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/3be799f98318288057e0c0957fce44d32d8f2974.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 15,
    type: "Weaponskill",
    cast: 0.0,
    recast: 1.5,
    cost: {},
    range: 0,
    radius: 15,
    tooltip: "Delivers an attack to all nearby enemies. Potency varies with number of successful steps, dealing full potency for the first enemy, and 60% less for all remaining enemies.\n0 Steps: 360\n1 Step: 540\n2 Steps: 850\nStep Bonus: Grants Standard Finish and Esprit to self and party member designated as your Dance Partner\nDamage bonus of Standard Finish varies with number of successful steps.\n1 Step: 2%\n2 Steps: 5%\nDuration: 60s\nAdditional Effect: Grants Last Dance Ready\nDuration: 30s\nCan only be executed while Dancing.\nThis weaponskill does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Standard Step changes to Standard Finish when requirements for execution are met.",
    potency: [
      "Delivers an attack to all nearby enemies. Potency varies with number of successful steps, dealing full potency for the first enemy, and 60% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Grants Last Dance Ready"
    ],
    conditions: [
      "Can only be executed while Dancing.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Reverse Cascade": {
    id: "pve_action__06",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/a03ec89f3860e636fa459b5ac4212031aea5c8f7.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 20,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 280.\nAdditional Effect: 50% chance of granting a Fourfold Feather\nCan only be executed while under the effect of Silken Symmetry or Flourishing Symmetry.",
    potency: [
      "Delivers an attack with a potency of 280."
    ],
    effects: [
      "Additional Effect: 50% chance of granting a Fourfold Feather"
    ],
    conditions: [
      "Can only be executed while under the effect of Silken Symmetry or Flourishing Symmetry."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Bladeshower: {
    id: "pve_action__07",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/65c0208ef7c6b132558c6aab0a15832fec601e5b.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 25,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 0,
    radius: 5,
    tooltip: "Delivers an attack with a potency of 100 to all nearby enemies.\nCombo Action: Windmill\nCombo Potency: 160\nCombo Bonus: 50% chance of granting Silken Flow\nDuration: 30s",
    potency: [
      "Delivers an attack with a potency of 100 to all nearby enemies.",
      "Combo Potency: 160"
    ],
    effects: [
      "Combo Bonus: 50% chance of granting Silken Flow"
    ],
    conditions: [],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Fan Dance": {
    id: "pve_action__08",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/62a211c886bd5b46f47b11419f3b55fb628f6535.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 30,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 180.\nAdditional Effect: 50% chance of granting Threefold Fan Dance\nDuration: 30s\nCan only be executed while in possession of Fourfold Feathers.",
    potency: [
      "Delivers an attack with a potency of 180."
    ],
    effects: [
      "Additional Effect: 50% chance of granting Threefold Fan Dance"
    ],
    conditions: [
      "Can only be executed while in possession of Fourfold Feathers."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Rising Windmill": {
    id: "pve_action__09",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/e233509e4d32c5f7aef385766026a3e161d2d142.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 35,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 0,
    radius: 5,
    tooltip: "Delivers an attack with a potency of 160 to all nearby enemies.\nAdditional Effect: 50% chance of granting a Fourfold Feather\nCan only be executed while under the effect of Silken Symmetry or Flourishing Symmetry.",
    potency: [
      "Delivers an attack with a potency of 160 to all nearby enemies."
    ],
    effects: [
      "Additional Effect: 50% chance of granting a Fourfold Feather"
    ],
    conditions: [
      "Can only be executed while under the effect of Silken Symmetry or Flourishing Symmetry."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Fountainfall: {
    id: "pve_action__10",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/e4e0f0c2d152720e33f1759219de09ab52051a21.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 40,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 0,
    tooltip: "Delivers an attack with a potency of 340.\nAdditional Effect: 50% chance of granting a Fourfold Feather\nCan only be executed while under the effect of Silken Flow or Flourishing Flow.",
    potency: [
      "Delivers an attack with a potency of 340."
    ],
    effects: [
      "Additional Effect: 50% chance of granting a Fourfold Feather"
    ],
    conditions: [
      "Can only be executed while under the effect of Silken Flow or Flourishing Flow."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Bloodshower: {
    id: "pve_action__11",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/75fa1885b19b76db73429a0661588d544e5bc974.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 45,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 0,
    radius: 5,
    tooltip: "Delivers an attack with a potency of 200 to all nearby enemies.\nAdditional Effect: 50% chance of granting a Fourfold Feather\nCan only be executed while under the effect of Silken Flow or Flourishing Flow.",
    potency: [
      "Delivers an attack with a potency of 200 to all nearby enemies."
    ],
    effects: [
      "Additional Effect: 50% chance of granting a Fourfold Feather"
    ],
    conditions: [
      "Can only be executed while under the effect of Silken Flow or Flourishing Flow."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Fan Dance II": {
    id: "pve_action__12",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/835016d35e3f62a1ce42a3519e70714b25d91969.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 50,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 0,
    radius: 5,
    tooltip: "Delivers an attack with a potency of 100 to all nearby enemies.\nAdditional Effect: 50% chance of granting Threefold Fan Dance\nDuration: 30s\nCan only be executed while in possession of Fourfold Feathers.",
    potency: [
      "Delivers an attack with a potency of 100 to all nearby enemies."
    ],
    effects: [
      "Additional Effect: 50% chance of granting Threefold Fan Dance"
    ],
    conditions: [
      "Can only be executed while in possession of Fourfold Feathers."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "En Avant": {
    id: "pve_action__13",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/b855b43c6fa93b143a93b339527a31950f6cdc47.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 50,
    type: "Ability",
    cast: 0.0,
    recast: 30.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Quickly dash 10 yalms forward.\nMaximum Charges: 3\nCannot be executed while bound.",
    potency: [],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: 3,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Curing Waltz": {
    id: "pve_action__14",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/30a793f0a1bae7d643449bd69b63722b8bbf1b3a.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 52,
    type: "Ability",
    cast: 0.0,
    recast: 60.0,
    cost: {},
    range: 0,
    radius: 5,
    tooltip: "Restores own HP and the HP of all nearby party members.\nCure Potency: 300\nAdditional Effect: Party member designated as your Dance Partner will also heal self and nearby party members",
    potency: [
      "Cure Potency: 300"
    ],
    effects: [
      "Additional Effect: Party member designated as your Dance Partner will also heal self and nearby party members"
    ],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Shield Samba": {
    id: "pve_action__15",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/f9692ff39ee50c5901429aaca48c066b8952732a.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 56,
    type: "Ability",
    cast: 0.0,
    recast: 90.0,
    cost: {},
    range: 0,
    radius: 30,
    tooltip: "Reduces damage taken by self and nearby party members by 15%.\nDuration: 15s\nEffect cannot be stacked with bard's Troubadour or machinist's Tactician.",
    potency: [],
    effects: [],
    conditions: [],
    duration: {
      seconds: 15
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Closed Position": {
    id: "pve_action__16",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/6bdcca52407a9435fe5a8578742995382e38f097.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 60,
    type: "Ability",
    cast: 0.0,
    recast: 30.0,
    cost: {},
    range: 30,
    radius: 0,
    tooltip: "Grants you Closed Position and designates a party member as your Dance Partner, allowing you to share the effects of Standard Finish, Curing Waltz, Devilment, and Finishing Move with said party member.\nEffect ends upon reuse.",
    potency: [],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Ending: {
    id: "pve_action__17",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/93294a32bcae356f21ad6373d561df40db347ed2.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 60,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Ends dance with your partner.",
    potency: [],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Devilment: {
    id: "pve_action__18",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/5dbf1b6a363454e48f1a32f92fe5c5cb6d8d229b.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 62,
    type: "Ability",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Increases critical hit rate and direct hit rate by 20%.\nDuration: 20s\nAdditional Effect: Party member designated as your Dance Partner will also receive the effect of Devilment\nAdditional Effect: Grants Flourishing Starfall\nDuration: 20s",
    potency: [],
    effects: [
      "Additional Effect: Party member designated as your Dance Partner will also receive the effect of Devilment",
      "Additional Effect: Grants Flourishing Starfall"
    ],
    conditions: [],
    duration: {
      seconds: 20
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Fan Dance III": {
    id: "pve_action__19",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/d786bf59396fce45e0e1bdf96cb1196b48b4a98a.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 66,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Delivers an attack to target and all enemies nearby it with a potency of 220 for the first enemy, and 60% less for all remaining enemies.\nCan only be executed while under the effect of Threefold Fan Dance.",
    potency: [
      "Delivers an attack to target and all enemies nearby it with a potency of 220 for the first enemy, and 60% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Threefold Fan Dance."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Technical Step": {
    id: "pve_action__20",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/2b0f0944de8d90ce1e9413cc3294bde99b7e1d7a.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 70,
    type: "Weaponskill",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Begin dancing, granting yourself Technical Step.\nDuration: 15s\nAction changes to Technical Finish while dancing.\nOnly Technical Finish, En Avant, Curing Waltz, Shield Samba, step actions, role actions, Sprint, and Limit Break can be performed while dancing.\nThis weaponskill does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.",
    potency: [],
    effects: [],
    conditions: [],
    duration: {
      seconds: 15
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Technical Finish": {
    id: "pve_action__21",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/4fa04453ce7de1db88f05bd6f931d489961cc6b1.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 70,
    type: "Weaponskill",
    cast: 0.0,
    recast: 1.5,
    cost: {},
    range: 0,
    radius: 15,
    tooltip: "Delivers an attack to all nearby enemies within 15 yalms. Potency varies with number of successful steps, dealing full potency for the first enemy, and 60% less for all remaining enemies.\n0 Steps: 350\n1 Step: 540\n2 Steps: 720\n3 Steps: 900\n4 Steps: 1,300\nStep Bonus: Grants Technical Finish and Esprit to self and party members within 30 yalms\nDamage bonus of Technical Finish varies with number of successful steps.\n1 Step: 1%\n2 Steps: 2%\n3 Steps: 3%\n4 Steps: 5%\nDuration: 20s\nAdditional Effect: Grants Flourishing Finish\nDuration: 30s\nAdditional Effect: Grants Dance of the Dawn Ready\nDuration: 30s\nCan only be executed while Dancing.\nThis weaponskill does not share a recast timer with any other actions. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Technical Step changes to Technical Finish when requirements for execution are met.",
    potency: [
      "Delivers an attack to all nearby enemies within 15 yalms. Potency varies with number of successful steps, dealing full potency for the first enemy, and 60% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Grants Flourishing Finish",
      "Additional Effect: Grants Dance of the Dawn Ready"
    ],
    conditions: [
      "Can only be executed while Dancing.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Flourish: {
    id: "pve_action__22",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/2255baa09f4cd761ec63575d79cb6a94e2c61db4.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 72,
    type: "Ability",
    cast: 0.0,
    recast: 60.0,
    cost: {},
    range: 0,
    radius: 0,
    tooltip: "Grants you the effects of Flourishing Symmetry, Flourishing Flow, Threefold Fan Dance, Fourfold Fan Dance, and Finishing Move Ready.\nDuration: 30s\nCan only be executed while in combat.",
    potency: [],
    effects: [],
    conditions: [
      "Can only be executed while in combat."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Saber Dance": {
    id: "pve_action__23",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/69b1d581e573e922634e9e66da798f9d1d13e3e5.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 76,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Delivers an attack to target and all enemies nearby it with a potency of 520 for the first enemy, and 60% less for all remaining enemies.\nEsprit Gauge Cost: 50",
    potency: [
      "Delivers an attack to target and all enemies nearby it with a potency of 520 for the first enemy, and 60% less for all remaining enemies."
    ],
    effects: [],
    conditions: [],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Improvisation: {
    id: "pve_action__24",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/ccba8c0dd5fc79db6437cd65d4a23daf8393b1fb.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 80,
    type: "Ability",
    cast: 0.0,
    recast: 120.0,
    cost: {},
    range: 0,
    radius: 8,
    tooltip: "Dance to the beat of your own drum, granting Rising Rhythm to self.\nStacks increase every 3 seconds, up to a maximum of 4.\nAdditional Effect: Healing over time for self and nearby party members\nCure Potency: 100\nDuration: 15s\nEffect ends upon using another action or moving (including facing a different direction).\nCancels auto-attack upon execution.",
    potency: [
      "Cure Potency: 100"
    ],
    effects: [
      "Additional Effect: Healing over time for self and nearby party members"
    ],
    conditions: [],
    duration: {
      seconds: 15
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Improvised Finish": {
    id: "pve_action__25",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/778e3634d9ab8d9e60cf6dd43e5942d494d1c9e0.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 80,
    type: "Ability",
    cast: 0.0,
    recast: 1.5,
    cost: {},
    range: 0,
    radius: 8,
    tooltip: "Creates a barrier around self and all nearby party members. Damage absorbed increases with stacks of Rising Rhythm.\n0 Stacks: 5% of maximum HP\n1 Stack: 6% of maximum HP\n2 Stacks: 7% of maximum HP\n3 Stacks: 8% of maximum HP\n4 Stacks: 10% of maximum HP\nDuration: 30s\nCan only be executed while Improvisation is active.\n\n※This action cannot be assigned to a hotbar.\n※Improvisation changes to Improvised Finish when requirements for execution are met.",
    potency: [],
    effects: [],
    conditions: [
      "Can only be executed while Improvisation is active.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  Tillana: {
    id: "pve_action__26",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/6f887d9c373a0acd970c90107861268f74bda2e0.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 82,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 0,
    radius: 15,
    tooltip: "Delivers an attack to all nearby enemies with a potency of 600 for the first enemy, and 60% less for all remaining enemies.\nAdditional Effect: Increases Esprit Gauge by 50\nCan only be executed while under the effect of Flourishing Finish.\n\n※This action cannot be assigned to a hotbar.\n※Technical Finish changes to Tillana when requirements for execution are met.",
    potency: [
      "Delivers an attack to all nearby enemies with a potency of 600 for the first enemy, and 60% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Increases Esprit Gauge by 50"
    ],
    conditions: [
      "Can only be executed while under the effect of Flourishing Finish.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Fan Dance IV": {
    id: "pve_action__27",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/38e73f37bf106b3e0b289b77b7f20481fae9746d.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 86,
    type: "Ability",
    cast: 0.0,
    recast: 1.0,
    cost: {},
    range: 15,
    radius: 15,
    tooltip: "Delivers an attack to all enemies in a cone before you with a potency of 420 for the first enemy, and 60% less for all remaining enemies.\nCan only be executed while under the effect of Fourfold Fan Dance.",
    potency: [
      "Delivers an attack to all enemies in a cone before you with a potency of 420 for the first enemy, and 60% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Fourfold Fan Dance."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Starfall Dance": {
    id: "pve_action__28",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/70231f15896f8bd24d6d8794e8932d19f4c8e29f.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 90,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 25,
    tooltip: "Delivers a critical direct hit to all enemies in a straight line before you with a potency of 600 for the first enemy, and 75% less for all remaining enemies.\nDamage dealt is increased when under an effect that raises critical hit rate or direct hit rate.\nCan only be executed while under the effect of Flourishing Starfall.",
    potency: [
      "Delivers a critical direct hit to all enemies in a straight line before you with a potency of 600 for the first enemy, and 75% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Flourishing Starfall."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Last Dance": {
    id: "pve_action__29",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/4928175718cd6dcb3f4e39eccea94c7c2fd6f595.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 92,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Delivers an attack to target and all enemies nearby it with a potency of 520 for the first enemy, and 60% less for all remaining enemies.\nCan only be executed while under the effect of Last Dance Ready.",
    potency: [
      "Delivers an attack to target and all enemies nearby it with a potency of 520 for the first enemy, and 60% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Last Dance Ready."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Finishing Move": {
    id: "pve_action__30",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/8b85962f58aaef35ad086a228b5fb12584fc6e0d.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 96,
    type: "Weaponskill",
    cast: 0.0,
    recast: 30.0,
    cost: {},
    range: 0,
    radius: 15,
    tooltip: "Delivers an attack to all nearby enemies with a potency of 850 for the first enemy, and 60% less for all remaining enemies.\nAdditional Effect: Grants Standard Finish and Esprit to self and party member designated as your Dance Partner\nStandard Finish Effect: Increases damage dealt by 5%\nDuration: 60s\nAdditional Effect: Grants Last Dance Ready\nDuration: 30s\nCan only be executed while under the effect of Finishing Move Ready.\nShares a recast timer with Standard Step. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.\n\n※This action cannot be assigned to a hotbar.\n※Standard Step changes to Finishing Move when requirements for execution are met.",
    potency: [
      "Delivers an attack to all nearby enemies with a potency of 850 for the first enemy, and 60% less for all remaining enemies."
    ],
    effects: [
      "Additional Effect: Grants Standard Finish and Esprit to self and party member designated as your Dance Partner",
      "Standard Finish Effect: Increases damage dealt by 5%",
      "Additional Effect: Grants Last Dance Ready"
    ],
    conditions: [
      "Can only be executed while under the effect of Finishing Move Ready.",
      "Shares a recast timer with Standard Step. Upon execution, the recast timer for this action will be applied to all other weaponskills and magic actions.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: {
      seconds: 30
    },
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  },
  "Dance of the Dawn": {
    id: "pve_action__31",
    icon_url: "https://lds-img.finalfantasyxiv.com/d/a4c8408be6396477a003a90a573bc23c141b54a6.png",
    job: "Dancer",
    job_icon_url: "https://lds-img.finalfantasyxiv.com/promo/h/0/ZzzbixB1HHW9FaxNXdfY7Y7lvw.png",
    level: 100,
    type: "Weaponskill",
    cast: 0.0,
    recast: 2.5,
    cost: {},
    range: 25,
    radius: 5,
    tooltip: "Delivers an attack to target and all enemies nearby it with a potency of 1,000 for the first enemy, and 60% less for all remaining enemies.\nEsprit Gauge Cost: 50\nCan only be executed while under the effect of Dance of the Dawn Ready.\n\n※This action cannot be assigned to a hotbar.\n※Saber Dance changes to Dance of the Dawn when requirements for execution are met.",
    potency: [
      "Delivers an attack to target and all enemies nearby it with a potency of 1,000 for the first enemy, and 60% less for all remaining enemies."
    ],
    effects: [],
    conditions: [
      "Can only be executed while under the effect of Dance of the Dawn Ready.",
      "※This action cannot be assigned to a hotbar."
    ],
    duration: null,
    max_charges: null,
    source_url: "FFXIV_Job_Guide_Raw_dancer_2025-09.html",
    last_seen: "2025-09-12T00:00:00+00:00",
    language: "en"
  }
},
  rotations: []
};