import test from "node:test";
import assert from "node:assert/strict";

import {
  getPotentiallyBotchedBuffs,
  shouldStrikeBotchedMitigation,
} from "../../../js/analysis/buffAnalysis.js";

/**
 * Objective:
 *   Buffs present on the `damage` packet but missing from `calculateddamage`
 *   should be flagged as potentially botched.
 *
 * Approach:
 *   Provide disjoint buff lists and assert the function returns only the
 *   missing entries from the damage list.
 */
test("flags buffs missing from calculated packet", () => {
  const damageBuffs = ["Kerachole", "Addle"];
  const calculatedBuffs = ["Addle"];

  assert.deepEqual(
    getPotentiallyBotchedBuffs(damageBuffs, calculatedBuffs),
    ["Kerachole"]
  );
});

/**
 * Objective:
 *   Ensure comparison is case-insensitive while preserving original casing
 *   in the returned list.
 *
 * Approach:
 *   Use upper/lowercase variants across damage and calculated inputs and
 *   assert the output keeps the original damage casing.
 */
test("compares buff names case-insensitively", () => {
  const damageBuffs = ["KERACHOLE", "Reprisal"];
  const calculatedBuffs = ["kerachole"];

  assert.deepEqual(
    getPotentiallyBotchedBuffs(damageBuffs, calculatedBuffs),
    ["Reprisal"]
  );
});

/**
 * Objective:
 *   Avoid duplicate entries when the damage list contains repeated buffs.
 *
 * Approach:
 *   Supply damage buffs with duplicates and verify only one instance is
 *   reported as potentially botched.
 */
test("deduplicates botched buff output", () => {
  const damageBuffs = ["Kerachole", "Kerachole"];
  const calculatedBuffs = [];

  assert.deepEqual(
    getPotentiallyBotchedBuffs(damageBuffs, calculatedBuffs),
    ["Kerachole"]
  );
});

/**
 * Objective:
 *   When mitigation context is unknown (e.g., unmitigatedAmount === 0),
 *   we cannot determine botched buffs and should return an empty list.
 *
 * Approach:
 *   Pass the mitigationUnknown option flag and assert detection is skipped.
 */
test("skips botched detection when mitigation is unknown", () => {
  const damageBuffs = ["Kerachole", "Addle"];
  const calculatedBuffs = [];

  assert.deepEqual(
    getPotentiallyBotchedBuffs(damageBuffs, calculatedBuffs, {
      mitigationUnknown: true,
    }),
    []
  );
});

/**
 * Objective:
 *   Gracefully handle empty or falsy inputs by returning an empty list.
 *
 * Approach:
 *   Pass undefined/null and ensure no exceptions are thrown and output is [].
 */
test("returns empty array for empty inputs", () => {
  assert.deepEqual(getPotentiallyBotchedBuffs(), []);
  assert.deepEqual(getPotentiallyBotchedBuffs([], []), []);
  assert.deepEqual(getPotentiallyBotchedBuffs(["Reprisal"], ["reprisal"]), []);
});

/**
 * Objective:
 *   Ignore non-string entries in the damage buff list to avoid runtime errors.
 *
 * Approach:
 *   Provide mixed-type damage buff entries and assert only string candidates
 *   are evaluated for botched detection.
 */
test("ignores non-string damage buff entries", () => {
  const damageBuffs = ["Kerachole", 123, null, "Addle"];
  const calculatedBuffs = ["Addle"];

  assert.deepEqual(
    getPotentiallyBotchedBuffs(damageBuffs, calculatedBuffs),
    ["Kerachole"]
  );
});

/**
 * Objective:
 *   Botched styling should only apply when the toggle is on and intendedMitPct
 *   exceeds the actual mitigationPct.
 *
 * Approach:
 *   Evaluate combinations of toggle on/off and higher/lower intendedMitPct
 *   to confirm the helper returns true only for the qualifying case.
 */
test("shouldStrikeBotchedMitigation respects toggle and mitigation delta", () => {
  const filterOn = { showBotchedMitigations: true };
  const filterOff = { showBotchedMitigations: false };

  assert.equal(
    shouldStrikeBotchedMitigation(
      { mitigationPct: 20, intendedMitPct: 30 },
      filterOn
    ),
    true,
    "toggle on + intended > actual should strike"
  );

  assert.equal(
    shouldStrikeBotchedMitigation(
      { mitigationPct: 40, intendedMitPct: 30 },
      filterOn
    ),
    false,
    "toggle on + intended <= actual should not strike"
  );

  assert.equal(
    shouldStrikeBotchedMitigation(
      { mitigationPct: 20, intendedMitPct: 30 },
      filterOff
    ),
    false,
    "toggle off should prevent strikeout even when intended > actual"
  );

  assert.equal(
    shouldStrikeBotchedMitigation(
      { mitigationPct: null, intendedMitPct: 30 },
      filterOn
    ),
    false,
    "missing numbers should return false"
  );
});
