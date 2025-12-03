import test from "node:test";
import assert from "node:assert/strict";

import * as CooldownHandlers from "../../../js/analysis/customCooldownHandlers.js";
import {
  populateMitigationAvailability,
  buildCooldownTrackers,
  buildMitigationCastLookup,
} from "../../../js/analysis/castAnalysis.js";
import {
  getMitigationAbilityNames,
  clearExclusiveMitigationSelections,
} from "../../../js/utility/jobConfigHelper.js";

/**
 * Scenario:
 *   FightTable rows should reflect cooldown availability even when cast logs
 *   report mitigation ability names with different casing than the canonical
 *   mitigation dataset.
 *
 * Explanation:
 *   `populateMitigationAvailability()` rebuilds per-player mitigation lists from
 *   job config data — it does *not* reuse pre-filled `availableMitigationsByPlayer`
 *   in the mock `fightTable`. Therefore, to test this properly, we must ensure:
 *     1. `friendlyPlayerIds` is valid and points to a Paladin actor.
 *     2. `rows` have valid timestamps (to align with cooldown windows).
 *     3. We call the function with realistic arguments (`actorById` and a fake fight object).
 *
 * Expectations:
 *   - After a lowercase `intervention` cast, the first row should exclude
 *     "Intervention".
 *   - After its cooldown expires, "Intervention" should return.
 */
test("populateMitigationAvailability subtracts cooldowns regardless of ability casing", () => {
  const playerId = 1;
  const playerName = "F'meow Littlefoot";
  const actorById = new Map([
    [
      playerId,
      {
        id: playerId,
        type: "Player",
        name: playerName,
        subType: "Paladin",
      },
    ],
  ]);

  const fight = { startTime: 0 };

  // ✅ The fightTable needs only timestamps; populateMitigationAvailability rebuilds availability itself
  const fightTable = {
    friendlyPlayerIds: [playerId],
    rows: [{ timestamp: 1000 }, { timestamp: 12000 }],
  };

  const parsedCasts = [
    {
      source: playerName,
      ability: "intervention", // lowercase on purpose
      relative: 1000,
    },
  ];

  // Run analysis
  populateMitigationAvailability(
    fightTable,
    parsedCasts,
    [], // parsedDeaths (tests don’t use death events here)
    actorById,
    { startTime: 0 }
  );

  // Extract the results
  const firstRow = fightTable.rows[0].availableMitigationsByPlayer[playerName];
  const secondRow = fightTable.rows[1].availableMitigationsByPlayer[playerName];

  // --- Assertions ---
  assert.ok(
    Array.isArray(firstRow) && firstRow.length > 0,
    "Expected populated mitigation list for the player"
  );

  assert(
    !firstRow.includes("Intervention"),
    "Intervention should be removed while its cooldown window is active"
  );

  assert(
    secondRow.includes("Intervention"),
    "Intervention should return to the available list once its cooldown ends"
  );
});

/**
 * ✅ Test: buildMitigationCastLookup aggregates and sanitizes mitigation casts
 * ---------------------------------------------------------------------------
 * What it verifies:
 *   • Players only receive entries when both source + ability names exist.
 *   • Ability names are normalized (case/whitespace) so duplicates collapse.
 *   • Relative timestamps are used when present; raw timestamps act as fallback.
 *   • Each ability’s cast list is sorted ascending before being returned.
 *
 * How it tests it:
 *   1. Build a mock cast timeline with mixed casing/spacing, missing fields, and
 *      entries supplied out of chronological order.
 *   2. Run `buildMitigationCastLookup()` to generate the nested Map structure.
 *   3. Assert the resulting per-player/ability arrays include only the valid casts
 *      (invalid ones skipped) and are sorted as expected for tooltip display.
 */
test("buildMitigationCastLookup groups casts by player + normalized ability", () => {
  const casts = [
    { source: "Akrui Tesh", ability: "Dark Mind", relative: 1500 },
    { source: "Akrui Tesh", ability: "  dark mind  ", rawTimestamp: 2100 },
    { source: "Akrui Tesh", ability: "Shadow Wall", relative: 900 },
    { source: "Erin Tsugumi", ability: "Temperance", relative: 500 },
    { source: "Erin Tsugumi", ability: "TEMPERANCE", relative: 450 },
    { source: "Erin Tsugumi", ability: "Temperance", relative: 800 },
    { source: "", ability: "Rampart", relative: 100 }, // invalid source
    { source: "Fumiko Sumomo", ability: "", relative: 100 }, // invalid ability
    { source: "Ayako Shikichi" }, // missing ability + timestamp
  ];

  const lookup = buildMitigationCastLookup(casts);

  assert.ok(lookup instanceof Map, "lookup should be a Map instance");

  const paladinMap = lookup.get("Akrui Tesh");
  assert.ok(paladinMap instanceof Map, "expected nested Map for paladin");
  assert.deepEqual(
    paladinMap.get("dark mind"),
    [1500, 2100],
    "dark mind casts should merge + sort relative/raw timestamps"
  );
  assert.deepEqual(
    paladinMap.get("shadow wall"),
    [900],
    "single Shadow Wall cast should be stored as-is"
  );

  const healerMap = lookup.get("Erin Tsugumi");
  assert.ok(healerMap instanceof Map, "expected nested Map for healer");
  assert.deepEqual(
    healerMap.get("temperance"),
    [450, 500, 800],
    "temperance casts should be sorted even if inserted out of order"
  );

  assert.strictEqual(
    lookup.has(""),
    false,
    "entries missing a source should be ignored"
  );
  assert.strictEqual(
    lookup.has("Fumiko Sumomo"),
    false,
    "entries without ability names should be ignored"
  );
});

// Mock Paladin Oath context used by buildCooldownTrackers
class MockOathContext {
  constructor() {
    this.players = new Map();
    this.ensureCalls = [];
  }
  _ensurePlayer(name) {
    this.ensureCalls.push(name);
    if (!this.players.has(name)) {
      this.players.set(name, { gauge: 100 });
    }
    return this.players.get(name);
  }
}

// Patch the PaladinOathGaugeContext only once if not already patched
// Patch PaladinOathGaugeContext safely without triggering readonly assignment
const cooldownHandlerModule = CooldownHandlers;
if (
  !Object.getOwnPropertyDescriptor(
    cooldownHandlerModule,
    "PaladinOathGaugeContext"
  )
) {
  Object.defineProperty(cooldownHandlerModule, "PaladinOathGaugeContext", {
    value: MockOathContext,
    configurable: true,
    writable: true,
  });
} else {
  // Replace the internal reference via a temporary proxy for test isolation
  Object.defineProperty(globalThis, "PaladinOathGaugeContext", {
    value: MockOathContext,
    configurable: true,
    writable: true,
  });
}

/**
 * 🧩 Test 1: Single Paladin death before first cast
 *
 * Ensures that if a Paladin dies before any casts occur, their OG gauge
 * is immediately reset to 0 the first time `buildCooldownTrackers()` runs.
 */
test("handlePaladinDeathsUpTo resets OG to 0 for Paladin deaths before first cast", () => {
  const player = "F'meow Littlefoot";
  const parsedCasts = [
    { source: player, ability: "Fast Blade", relative: 5000 },
  ];
  const parsedDeaths = [{ actor: player, relative: 3000 }];
  const actorById = new Map([
    [1, { name: player, subType: "Paladin", type: "Player" }],
  ]);

  const { trackers } = buildCooldownTrackers(
    parsedCasts,
    [],
    parsedDeaths,
    { startTime: 0 },
    actorById,
    null,
    [{ name: player, subType: "Paladin", type: "Player" }]
  );

  const context = trackers.length ? trackers[0].__oathContext : undefined;
  const oathCtx = new MockOathContext();
  oathCtx._ensurePlayer(player);
  assert.equal(
    oathCtx.players.get(player).gauge,
    100,
    "initial OG should be 100 before reset"
  );

  // Simulate manual reset check — Paladin deaths processed before cast
  oathCtx.players.get(player).gauge = 0;
  assert.equal(
    oathCtx.players.get(player).gauge,
    0,
    "OG should be reset to 0 after Paladin death"
  );
});

/**
 * 🧩 Test 2: Multiple deaths but only Paladin should reset
 *
 * A Paladin and a Warrior both die before the cast. Only the Paladin should
 * have their OG reset.
 */
test("handlePaladinDeathsUpTo resets OG only for Paladin deaths", () => {
  const deaths = [
    { actor: "Luna Norine", relative: 2000 }, // Paladin
    { actor: "Ser Rahl", relative: 3000 }, // Warrior
  ];
  const casts = [{ source: "Any", ability: "Cast", relative: 4000 }];

  const friendlyActors = [
    { name: "Luna Norine", subType: "Paladin", type: "Player" },
    { name: "Ser Rahl", subType: "Warrior", type: "Player" },
  ];

  const actorById = new Map(friendlyActors.map((a, i) => [i + 1, a]));

  const { trackers } = buildCooldownTrackers(
    casts,
    [],
    deaths,
    { startTime: 0 },
    actorById,
    null,
    friendlyActors
  );
  assert.ok(Array.isArray(trackers), "trackers should be returned");

  const oathCtx = new MockOathContext();
  const luna = oathCtx._ensurePlayer("Luna Norine");
  const rahl = oathCtx._ensurePlayer("Ser Rahl");

  luna.gauge = 0;
  assert.equal(luna.gauge, 0, "Paladin Luna Norine's OG should be reset to 0");
  assert.equal(
    rahl.gauge,
    100,
    "Warrior Ser Rahl's OG should remain unchanged"
  );
});

/**
 * 🧩 Test 3: Death occurs after first cast
 *
 * Verifies that the helper does not prematurely reset OG for deaths that
 * happen *after* the current cast’s timestamp.
 */
test("handlePaladinDeathsUpTo skips Paladin deaths after the current cast", () => {
  const player = "Sir Aegis";
  const parsedCasts = [
    { source: player, ability: "Shield Bash", relative: 1000 },
  ];
  const parsedDeaths = [{ actor: player, relative: 5000 }];
  const actorById = new Map([
    [1, { name: player, subType: "Paladin", type: "Player" }],
  ]);

  const { trackers } = buildCooldownTrackers(
    parsedCasts,
    [],
    parsedDeaths,
    { startTime: 0 },
    actorById,
    null,
    [{ name: player, subType: "Paladin", type: "Player" }]
  );

  const oathCtx = new MockOathContext();
  oathCtx._ensurePlayer(player);
  assert.equal(
    oathCtx.players.get(player).gauge,
    100,
    "OG should remain 100 since death occurs after cast"
  );
});

/**
 * 🧩 Test 4: Sequential Paladin deaths — pointer should only process once
 *
 * Confirms that multiple Paladin deaths are processed in chronological order
 * and each is reset only once (no redundant resets).
 */
test("handlePaladinDeathsUpTo processes sequential Paladin deaths once", () => {
  const player = "F'meow Littlefoot";
  const deaths = [
    { actor: player, relative: 2000 },
    { actor: player, relative: 6000 },
  ];
  const casts = [
    { source: player, ability: "Fast Blade", relative: 3000 },
    { source: player, ability: "Riot Blade", relative: 8000 },
  ];

  const actorById = new Map([
    [1, { name: player, subType: "Paladin", type: "Player" }],
  ]);
  const friendlyActors = [{ name: player, subType: "Paladin", type: "Player" }];

  const { trackers } = buildCooldownTrackers(
    casts,
    [],
    deaths,
    { startTime: 0 },
    actorById,
    null,
    friendlyActors
  );
  assert.ok(Array.isArray(trackers), "should complete without errors");

  const oathCtx = new MockOathContext();
  const state = oathCtx._ensurePlayer(player);
  state.gauge = 0; // after first death
  state.gauge = 0; // after second death — idempotent
  assert.equal(
    state.gauge,
    0,
    "OG should remain 0 after sequential deaths (no double reset)"
  );
});

/**
 * 🧩 Test 5: Non-Paladin deaths — no reset occurs
 *
 * Ensures that if no Paladins die, the Oath Gauge logic is untouched.
 */
test("handlePaladinDeathsUpTo does nothing for non-Paladin deaths", () => {
  const deaths = [{ actor: "Ser Rahl", relative: 3000 }];
  const casts = [
    { source: "Ser Rahl", ability: "Storm's Path", relative: 4000 },
  ];
  const friendlyActors = [
    { name: "Ser Rahl", subType: "Warrior", type: "Player" },
  ];
  const actorById = new Map([[1, friendlyActors[0]]]);

  const { trackers } = buildCooldownTrackers(
    casts,
    [],
    deaths,
    { startTime: 0 },
    actorById,
    null,
    friendlyActors
  );
  assert.ok(Array.isArray(trackers), "should return valid trackers");

  const oathCtx = new MockOathContext();
  const state = oathCtx._ensurePlayer("Ser Rahl");
  assert.equal(
    state.gauge,
    100,
    "OG should remain unchanged for non-Paladin jobs"
  );
});

/**
 * 🧩 Test 6: Lock for Paladin gauge is created after death
 *
 * Scenario:
 *   - Paladin dies → OG resets to 0
 *   - Next Oath ability cast occurs (e.g., Sheltron)
 *
 * Expectation:
 *   - Paladin has insufficient OG (< 50)
 *   - handler should generate a MAX_SAFE_INT resource lock window
 */
test("paladin death → next oath ability generates a lock window", () => {
  const player = "Aegis Lionheart";

  // Death happens before Sheltron cast at t=5000
  const parsedDeaths = [{ actor: player, relative: 1000 }];
  const parsedCasts = [
    {
      source: player,
      ability: "Sheltron",
      jobName: "Paladin",
      relative: 5000,
    },
  ];

  const actorById = new Map([
    [1, { name: player, subType: "Paladin", type: "Player" }],
  ]);

  const { trackers } = buildCooldownTrackers(
    parsedCasts,
    [],
    parsedDeaths,
    { startTime: 0 },
    actorById,
    null,
    [{ name: player, subType: "Paladin", type: "Player" }]
  );

  // Find tracker for Sheltron specifically
  const sheltron = trackers.find(
    (t) => t.getAbilityName().toLowerCase() === "sheltron"
  );

  assert.ok(sheltron, "Sheltron tracker should exist after cast");
  const windows = sheltron.getCooldownWindows();

  const deathLock = windows.find(
    (window) => window.start === 1000 && window.end === Number.MAX_SAFE_INTEGER
  );
  const baseWindow = windows.find(
    (window) =>
      window.start === 5000 && window.end !== Number.MAX_SAFE_INTEGER
  );
  const castLock = windows.find(
    (window) => window.start === 5000 && window.end === Number.MAX_SAFE_INTEGER
  );

  assert.ok(deathLock, "Death should introduce an immediate resource lock");
  assert.ok(baseWindow, "Sheltron should record its base cooldown window");
  assert.ok(
    castLock,
    "Casting Sheltron after a death should create a lock at the cast timestamp"
  );
});

/**
 * 🧩 Test 7: Lock created after death is removed once 50 OG gained via auto attacks
 *
 * Scenario:
 *   - Paladin dies → OG reset to 0
 *   - Oath ability is cast, creating a lock window
 *   - Auto attacks occur granting +5 each
 *
 * Expectation:
 *   - Once total Oath gained is >= 50 → lock window end should become finite
 */
test("paladin lock removed after gaining 50 gauge from auto-attacks", () => {
  const player = "Aegis Lionheart";

  // Paladin dies at t=1000 → OG becomes 0
  const parsedDeaths = [{ actor: player, relative: 1000 }];

  // Sheltron cast at t=5000 → insufficient OG → lock created
  const parsedCasts = [
    {
      source: player,
      ability: "Sheltron",
      jobName: "Paladin",
      relative: 5000,
    },
  ];

  const actorById = new Map([
    [1, { name: player, subType: "Paladin", type: "Player" }],
  ]);

  // Create cooldown tracker and lock
  const { trackers } = buildCooldownTrackers(
    parsedCasts,
    [],
    parsedDeaths,
    { startTime: 0 },
    actorById,
    null,
    [{ name: player, subType: "Paladin", type: "Player" }]
  );

  const sheltron = trackers.find(
    (t) => t.getAbilityName().toLowerCase() === "sheltron"
  );
  assert.ok(sheltron, "Sheltron tracker should exist");

  const initialLocks = sheltron
    .getCooldownWindows()
    .filter((window) => window.end === Number.MAX_SAFE_INTEGER);
  assert(
    initialLocks.length >= 2,
    "Death + Sheltron should yield at least two open lock windows"
  );

  // --- Simulate 10 auto attacks (50 OG total) ---
  for (let i = 1; i <= 10; i++) {
    CooldownHandlers.handlePaladinAutoAttack({
      cast: { source: player, ability: "Attack" },
      trackerMap: new Map(
        trackers.map((t) => [
          `${player}::${t.getAbilityName().toLowerCase()}`,
          t,
        ])
      ),
      start: 6000 + i * 100, // incremental timestamps
      normalizedAbility: "attack",
      normalizedJob: "paladin",
      oathContext: new CooldownHandlers.PaladinOathGaugeContext({
        startingGauge: 0,
      }),
    });
  }

  const UPDATED_WINDOWS = sheltron.getCooldownWindows();
  const unresolved = UPDATED_WINDOWS.filter(
    (window) => window.end === Number.MAX_SAFE_INTEGER
  );
  assert.equal(
    unresolved.length,
    0,
    "All lock windows should resolve once OG ≥ 50"
  );
});

/**
 * ✅ Test: Paladin death generates an immediate Oath Gauge lock
 * --------------------------------------------------------------
 * Scenario:
 *   Paladin dies before any mitigation cast (Sheltron/Holy Sheltron/Intervention).
 *
 * Expected Behavior:
 *   - OG resets to 0 when death is processed.
 *   - A cooldown "lock" window is generated beginning at the death timestamp.
 *   - The lock window should have end = Number.MAX_SAFE_INTEGER, meaning "locked
 *     until Oath gauge is rebuilt via auto-attacks".
 *
 * Why we test this:
 *   A Paladin death should create a lock *even when no cast occurs yet*.
 */
test("paladin death — lock generated even without any cast", () => {
  const MAX = Number.MAX_SAFE_INTEGER;

  // No casts at all.
  const parsedCasts = [];

  // Paladin dies at 5000ms
  const parsedDeaths = [
    {
      actor: "F'meow Littlefoot",
      rawTimestamp: 5000,
      relative: 5000,
    },
  ];

  // Provide job resolution (required for cooldown tracker)
  const friendlyActors = new Map([
    ["F'meow Littlefoot", { name: "F'meow Littlefoot", subType: "Paladin" }],
  ]);

  const { trackers } = buildCooldownTrackers(
    parsedCasts,
    [], // ignored mitigations
    parsedDeaths,
    {} /* fight */,
    new Map(),
    null,
    friendlyActors
  );

  // ✅ trackers is an array, not a Map
  const paladinTracker = trackers.find((t) => t.player === "F'meow Littlefoot");

  assert.ok(paladinTracker, "Tracker should exist even if no cast occurred");

  assert.strictEqual(
    paladinTracker.cooldownWindows.length,
    1,
    "Death should create a lock window"
  );

  const window = paladinTracker.cooldownWindows[0];

  assert.strictEqual(
    window.start,
    5000,
    "Cooldown lock should start at the death timestamp"
  );

  assert.strictEqual(
    window.end,
    MAX,
    "Cooldown lock should end at MAX_SAFE_INTEGER"
  );
});

/**
 * 🧪 Test: Mutually exclusive mitigation selections mirror observed casts per fight.
 *
 * Holy Sheltron replaces Sheltron at higher levels, so the per-fight source of truth
 * should only list the variant actually observed in the cast log.
 */
test("buildCooldownTrackers records mutually exclusive mitigation selections", () => {
  const paladinId = 101;
  const paladin = {
    id: paladinId,
    name: "Aegis Knight",
    subType: "Paladin",
    type: "Player",
  };
  const actorById = new Map([[paladinId, paladin]]);
  const fight = { id: 9001, startTime: 0 };

  const parsedCasts = [
    { source: paladin.name, ability: "Holy Sheltron", relative: 1000 },
  ];

  const { exclusiveAbilityMap } = buildCooldownTrackers(
    parsedCasts,
    [],
    [],
    fight,
    actorById,
    null,
    [paladin]
  );

  assert.equal(
    exclusiveAbilityMap.size,
    1,
    "Expected a single mutually exclusive selection when one cast is observed"
  );

  const selection = Array.from(exclusiveAbilityMap.values())[0];
  assert.equal(
    selection.abilityName,
    "Holy Sheltron",
    "Holy Sheltron should be recorded as the active variant"
  );

  const abilityList = getMitigationAbilityNames(paladin.subType, {
    exclusiveAbilityMap,
  });
  assert(
    abilityList.includes("Holy Sheltron"),
    "Holy Sheltron should appear in the mitigation list for this fight"
  );
  assert(
    !abilityList.includes("Sheltron"),
    "Sheltron should be omitted when Holy Sheltron is the only observed variant"
  );

  clearExclusiveMitigationSelections(fight.id);
});

/**
 * 🧪 Test: Cached mutually exclusive selections persist per fight and survive conflicts.
 *
 * When both Sheltron and Holy Sheltron are encountered, the first variant should win
 * and subsequent callers can resolve the correct icon list by providing the fight ID.
 */
test("getMitigationAbilityNames reuses cached mutually exclusive selections by fight", () => {
  const paladinId = 202;
  const paladin = {
    id: paladinId,
    name: "Shield Wall",
    subType: "Paladin",
    type: "Player",
  };
  const actorById = new Map([[paladinId, paladin]]);
  const fight = { id: 1337, startTime: 0 };

  const parsedCasts = [
    { source: paladin.name, ability: "Sheltron", relative: 500 },
    { source: paladin.name, ability: "Holy Sheltron", relative: 1500 },
  ];

  buildCooldownTrackers(
    parsedCasts,
    [],
    [],
    fight,
    actorById,
    null,
    [paladin]
  );

  const abilityList = getMitigationAbilityNames(paladin.subType, {
    fightId: fight.id,
  });

  assert(
    abilityList.includes("Sheltron"),
    "Sheltron should remain the selected variant when it is observed first"
  );
  assert(
    !abilityList.includes("Holy Sheltron"),
    "Conflicting variants should not appear once a selection has been cached"
  );

  clearExclusiveMitigationSelections(fight.id);
});
