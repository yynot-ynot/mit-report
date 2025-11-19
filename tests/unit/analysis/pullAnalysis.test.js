import test from "node:test";
import assert from "node:assert/strict";

import { generateCondensedPullTable } from "../../../js/analysis/pullAnalysis.js";

/**
 * Objective:
 *   Ensure buff-only contributors are included in condensed sets without
 *   throwing when their mitigation arrays are accessed, and confirm that
 *   targeted players retain their mitigation availability snapshots.
 *
 * Approach:
 *   1. Build a fight table with a single attack row where the main target
 *      has mitigation data and a healer supplies a buff.
 *   2. Run `generateCondensedPullTable()` and examine the resulting set.
 *   3. Assert that the healer appears with only buffs, while the target
 *      keeps mitigation/state fields populated as arrays/numbers.
 *
 * @param {import("node:test").TestContext} t - Node test context for diagnostics.
 */
test(
  "generateCondensedPullTable captures buff-only players without crashing",
  (t) => {
    t.diagnostic("Verifying buff-only contributors remain well-formed players.");
    const fightTable = {
      fightId: 99,
      encounterId: 1234,
      name: "Helper Dummy",
      rows: [
        {
          timestamp: 1000,
          ability: "Magitek Ray",
          actor: "Main Tank",
          amount: 6000,
          unmitigatedAmount: 12000,
          absorbed: 1000,
          mitigationPct: 50,
          intendedMitPct: 40,
          availableMitigationsByPlayer: {
            "Main Tank": ["Rampart"],
            "Lily Sage": ["Kerachole"],
          },
          buffs: { Kerachole: ["Lily Sage"] },
        },
      ],
    };

    const result = generateCondensedPullTable(fightTable);
    assert.equal(result.condensedSets.length, 1, "one condensed entry expected");

    const set = result.condensedSets[0];
    const tank = set.players["Main Tank"];
    assert.ok(tank, "targeted player should exist in aggregated players");
    assert.equal(tank.wasTargeted, true, "target must be marked as targeted");
    assert.deepEqual(
      [...tank.availableMitigations].sort(),
      ["Rampart"].sort(),
      "target should retain mitigation availability array"
    );

    const healer = set.players["Lily Sage"];
    assert.ok(healer, "buff applier should be present in players");
    assert.deepEqual(
      healer.buffs,
      ["Kerachole"],
      "buff contributor lists the buffs they applied"
    );
    assert.equal(
      healer.wasTargeted,
      false,
      "buff contributor should not be marked as targeted"
    );
    assert.deepEqual(
      healer.availableMitigations,
      [],
      "buff contributor should have an empty mitigation array"
    );
  }
);

/**
 * Objective:
 *   Validate that repeated hits for the same ability merge mitigation availability
 *   and that death-only participants receive initialized player entries.
 *
 * Approach:
 *   1. Build two sequential rows for the same ability occurring within the grouping window.
 *   2. Provide distinct mitigation options across the rows and a death entry referencing
 *      a player who never appears as actor or buff applier.
 *   3. Run `generateCondensedPullTable()` and confirm that the target's mitigation
 *      array/union contains both abilities and that the fallen player registers as dead.
 *
 * @param {import("node:test").TestContext} t - Node test context for diagnostics.
 */
test(
  "generateCondensedPullTable merges mitigation unions and records death-only players",
  (t) => {
    t.diagnostic("Ensuring mitigation union and death tracking stay intact.");
    const fightTable = {
      fightId: 2,
      encounterId: 5678,
      name: "Guardian Arkveld",
      rows: [
        {
          timestamp: 2000,
          ability: "Cataclysmic Swipe",
          actor: "Off Tank",
          amount: 8000,
          unmitigatedAmount: 13000,
          mitigationPct: 38,
          intendedMitPct: 42,
          availableMitigationsByPlayer: {
            "Off Tank": ["Rampart"],
          },
        },
        {
          timestamp: 3200,
          ability: "Cataclysmic Swipe",
          actor: "Off Tank",
          amount: 7500,
          unmitigatedAmount: 12800,
          mitigationPct: 41,
          intendedMitPct: 45,
          availableMitigationsByPlayer: {
            "Off Tank": ["Sentinel"],
          },
          deaths: ["Forgotten DPS"],
        },
      ],
    };

    const result = generateCondensedPullTable(fightTable);
    assert.equal(result.condensedSets.length, 1, "rows should condense into one set");

    const set = result.condensedSets[0];
    const tank = set.players["Off Tank"];
    assert.ok(tank, "tank should be present");
    assert.deepEqual(
      [...tank.availableMitigations].sort(),
      ["Rampart", "Sentinel"].sort(),
      "tank mitigations must include the union of both rows"
    );

    const availability = set.availableMitigationsByPlayer["Off Tank"];
    assert.deepEqual(
      availability.sort(),
      ["Rampart", "Sentinel"].sort(),
      "per-set mitigation union should match player arrays"
    );

    const fallen = set.players["Forgotten DPS"];
    assert.ok(fallen, "death-only player should still get an entry");
    assert.equal(fallen.dead, true, "death-only player must be marked dead");
    assert.equal(
      fallen.wasTargeted,
      false,
      "death-only participant should not be marked as targeted"
    );
  }
);

/**
 * Objective:
 *   Verify botched buffs are propagated to both per-player aggregates and the
 *   condensed set-level map (`botchedBuffsByPlayer`).
 *
 * Approach:
 *   1. Build two rows for the same ability.
 *      - Row 1: buff applied by Healer, tagged as potentially botched.
 *      - Row 2: different buff applied by Tank, not botched.
 *   2. Run `generateCondensedPullTable()`.
 *   3. Assert:
 *      - Healer’s `botchedBuffs` contains the botched entry.
 *      - Tank’s `botchedBuffs` is empty.
 *      - Condensed set exposes `botchedBuffsByPlayer` with the same mapping.
 */
test("generateCondensedPullTable surfaces botched buff attribution", (t) => {
  const fightTable = {
    fightId: 3,
    encounterId: 999,
    name: "Botched Buff Check",
    rows: [
      {
        timestamp: 1000,
        ability: "Shadow Burst",
        actor: "Main Tank",
        amount: 5000,
        unmitigatedAmount: 10000,
        mitigationPct: 50,
        intendedMitPct: 60,
        buffs: {
          "Kerachole": ["Helpful Sage"],
        },
        potentiallyBotchedBuffs: ["Kerachole"],
      },
      {
        timestamp: 1800,
        ability: "Shadow Burst",
        actor: "Main Tank",
        amount: 4800,
        unmitigatedAmount: 9800,
        mitigationPct: 51,
        intendedMitPct: 61,
        buffs: {
          "Rampart": ["Main Tank"],
        },
        potentiallyBotchedBuffs: [], // not botched
      },
    ],
  };

  const result = generateCondensedPullTable(fightTable);
  assert.equal(result.condensedSets.length, 1, "rows should condense into one set");
  const set = result.condensedSets[0];

  // Per-player aggregates
  const tank = set.players["Main Tank"];
  const healer = set.players["Helpful Sage"];
  assert.ok(tank, "tank should be present");
  assert.ok(healer, "healer should be present");
  assert.deepEqual(
    healer.botchedBuffs,
    ["Kerachole"],
    "healer should list botched buff they applied"
  );
  assert.deepEqual(
    tank.botchedBuffs,
    [],
    "tank should not list botched buffs when none flagged"
  );

  // Set-level map mirrors per-player data
  assert.deepEqual(
    set.botchedBuffsByPlayer["Helpful Sage"],
    ["Kerachole"],
    "set-level botched map should carry healer’s botched buff"
  );
  assert.deepEqual(
    set.botchedBuffsByPlayer["Main Tank"],
    [],
    "set-level botched map should give tank an empty list"
  );
});

/**
 * Objective:
 *   Ensure condensed grouping initializes botched buff maps even when no
 *   botched buffs are present.
 *
 * Approach:
 *   1. Build a single row with a standard buff and no `potentiallyBotchedBuffs`.
 *   2. Run `generateCondensedPullTable()`.
 *   3. Assert `botchedBuffsByPlayer` exists and provides empty arrays
 *      for all participants.
 */
test("generateCondensedPullTable supplies empty botched maps when none found", (t) => {
  const fightTable = {
    fightId: 4,
    encounterId: 1000,
    name: "No Botched Buffs",
    rows: [
      {
        timestamp: 2000,
        ability: "Gentle Breeze",
        actor: "Target DPS",
        amount: 7000,
        unmitigatedAmount: 9000,
        mitigationPct: 22,
        intendedMitPct: 25,
        buffs: {
          "Rampart": ["Target DPS"],
        },
        potentiallyBotchedBuffs: [],
      },
    ],
  };

  const result = generateCondensedPullTable(fightTable);
  assert.equal(result.condensedSets.length, 1, "one condensed set expected");
  const set = result.condensedSets[0];

  assert.deepEqual(
    set.botchedBuffsByPlayer["Target DPS"],
    [],
    "botched map should exist with empty array for participant"
  );
  assert.ok(
    Array.isArray(set.botchedBuffsByPlayer["Target DPS"]),
    "botched map entry should be an array"
  );
});
