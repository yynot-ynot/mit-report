import test from "node:test";
import assert from "node:assert/strict";

import {
  handleAstroCardDependency,
  handleMutualCardCooldown,
} from "../../../js/analysis/customCooldownHandlers.js";
import { CastCooldownTracker } from "../../../js/analysis/castAnalysis.js";
import { normalizeAbilityName } from "../../../js/utility/jobConfigHelper.js";

const DRAW_COOLDOWN_MS = 55 * 1000;
const SAFE_MAX_END = Number.MAX_SAFE_INTEGER;

function trackerKey(player, ability) {
  return `${player}::${normalizeAbilityName(ability)}`;
}

function buildTrackerMap(player, trackerDefs) {
  const map = new Map();
  trackerDefs.forEach(
    ({
      ability,
      windows = [],
      baseCooldownMs = DRAW_COOLDOWN_MS,
      job = "Astrologian",
    }) => {
      const tracker = CastCooldownTracker.fromCooldowns(
        ability,
        player,
        job,
        baseCooldownMs,
        windows
      );
      map.set(trackerKey(player, ability), tracker);
    }
  );
  return map;
}

/**
 * Purpose:
 *   Verify that casting The Bole produces an "indefinite" cooldown window that
 *   stays open until a subsequent draw event explicitly resolves it.
 *
 * Test flow:
 *   1. Start with an empty tracker for The Bole and invoke the custom handler
 *      using a simulated cast at 1200ms.
 *   2. Provide a sentinel default cooldown function to ensure the handler takes
 *      full ownership and never falls back to the generic cooldown writer.
 *   3. Assert that the tracker now carries a single window whose end time is
 *      `SAFE_MAX_END`, demonstrating the placeholder behaviour.
 *
 * Expectations:
 *   - The default cooldown generator is untouched.
 *   - The resulting window matches `{ start: 1200, end: SAFE_MAX_END }`.
 */
test("The Bole cast enters an indefinite cooldown until the next draw", () => {
  const player = "Akrui Tesh";
  const trackerMap = buildTrackerMap(player, [
    { ability: "The Bole", windows: [] },
  ]);

  const cast = { source: player, ability: "The Bole", relative: 1200 };
  const depConfig = { affects: ["The Bole"] };
  const triggerTracker = trackerMap.get(trackerKey(player, "The Bole"));

  let defaultCalled = false;
  handleAstroCardDependency({
    depConfig,
    cast,
    trackerMap,
    actorById: null,
    fight: null,
    start: cast.relative,
    triggerTracker,
    defaultAddCooldown: () => {
      defaultCalled = true;
    },
    normalizedAbility: normalizeAbilityName("The Bole"),
  });

  assert.equal(defaultCalled, false, "custom handler should not invoke default");

  const boleWindows = triggerTracker.getCooldownWindows();
  assert.equal(boleWindows.length, 1);
  assert.deepEqual(boleWindows[0], {
    start: 1200,
    end: SAFE_MAX_END,
  });
});

/**
 * Purpose:
 *   Confirm that the Umbral Draw handler collapses The Bole's indefinite window
 *   the moment a fresh Umbral Draw occurs, signaling that the card is ready.
 *
 * Test flow:
 *   1. Seed trackers where The Bole is waiting on an Umbral Draw (window end is
 *      `SAFE_MAX_END`).
 *   2. Fire the Umbral Draw handler with a simulated cast at 120000ms.
 *   3. Inspect the updated Bole window to ensure it now ends at the Umbral Draw
 *      timestamp, reflecting immediate availability.
 *
 * Expectations:
 *   - The Bole tracker retains a single window.
 *   - That window’s end is rewritten from `SAFE_MAX_END` to the draw timestamp.
 */
test("Umbral Draw resets The Bole cooldown at the moment of the draw", () => {
  const player = "Akrui Tesh";
  const trackerMap = buildTrackerMap(player, [
    {
      ability: "The Bole",
      windows: [{ start: 60000, end: SAFE_MAX_END }],
    },
    { ability: "Umbral Draw", windows: [] },
  ]);

  const cast = { source: player, ability: "Umbral Draw", relative: 120000 };
  const depConfig = { affects: ["The Bole"] };
  const triggerTracker = trackerMap.get(trackerKey(player, "Umbral Draw"));

  handleAstroCardDependency({
    depConfig,
    cast,
    trackerMap,
    actorById: null,
    fight: null,
    start: cast.relative,
    triggerTracker,
    defaultAddCooldown: () => {},
    normalizedAbility: normalizeAbilityName("Umbral Draw"),
  });

  const boleWindows = trackerMap
    .get(trackerKey(player, "The Bole"))
    .getCooldownWindows();
  assert.equal(boleWindows.length, 1);
  assert.deepEqual(boleWindows[0], {
    start: 60000,
    end: 120000,
  });
});

/**
 * Purpose:
 *   Validate the alternating placeholder/finite cycle between Astral Draw and
 *   Umbral Draw where each cast frees the opposite card after the configured
 *   recast duration.
 *
 * Test flow:
 *   1. Prime Astral Draw with an unresolved window and leave Umbral Draw ready.
 *   2. Cast Umbral Draw at 120000ms and run the mutual cooldown handler.
 *   3. Assert that Umbral Draw now holds an indefinite window while Astral Draw
 *      is rewritten to end exactly one cooldown length after its window start.
 *
 * Expectations:
 *   - The default cooldown hook is ignored.
 *   - Umbral Draw’s newest window ends at `SAFE_MAX_END`.
 *   - Astral Draw’s latest window ends at `start + DRAW_COOLDOWN_MS`.
 */
test("Draw abilities alternate indefinite and resolved cooldown windows", () => {
  const player = "Khel Lani";
  const trackerMap = buildTrackerMap(player, [
    {
      ability: "Astral Draw",
      windows: [{ start: 60000, end: SAFE_MAX_END }],
    },
    { ability: "Umbral Draw", windows: [] },
  ]);

  const cast = { source: player, ability: "Umbral Draw", relative: 120000 };
  const depConfig = { affects: ["Astral Draw"] };
  const triggerTracker = trackerMap.get(trackerKey(player, "Umbral Draw"));

  let defaultCalled = false;
  handleMutualCardCooldown({
    depConfig,
    cast,
    trackerMap,
    actorById: null,
    fight: null,
    start: cast.relative,
    triggerTracker,
    cooldownInfo: { cooldownMs: DRAW_COOLDOWN_MS },
    defaultAddCooldown: () => {
      defaultCalled = true;
    },
  });

  assert.equal(
    defaultCalled,
    false,
    "mutual handler should not fall back to the default cooldown"
  );

  const umbralWindows = triggerTracker.getCooldownWindows();
  assert.equal(umbralWindows.length, 1);
  assert.deepEqual(umbralWindows[0], {
    start: 120000,
    end: SAFE_MAX_END,
  });

  const astralWindows = trackerMap
    .get(trackerKey(player, "Astral Draw"))
    .getCooldownWindows();
  assert.equal(astralWindows.length, 1);
  assert.deepEqual(astralWindows[0], {
    start: 60000,
    end: 60000 + DRAW_COOLDOWN_MS,
  });
});

/**
 * Purpose:
 *   Ensure the mutual cooldown handler gracefully exits when the counterpart
 *   ability has no windows, while still recording an indefinite window for the
 *   triggering cast.
 *
 * Test flow:
 *   1. Start with empty Astral and Umbral trackers.
 *   2. Simulate an Umbral Draw cast and feed it through the handler.
 *   3. Confirm that Astral Draw remains untouched and Umbral Draw gains a
 *      single placeholder window.
 *
 * Expectations:
 *   - The default cooldown fallback is not invoked.
 *   - Astral Draw retains zero windows.
 *   - Umbral Draw records one window ending at `SAFE_MAX_END`.
 */
test("Mutual cooldown handler leaves counterparts untouched when they lack windows", () => {
  const player = "Mina Verra";
  const trackerMap = buildTrackerMap(player, [
    { ability: "Astral Draw", windows: [] },
    { ability: "Umbral Draw", windows: [] },
  ]);

  const cast = { source: player, ability: "Umbral Draw", relative: 32000 };
  const depConfig = { affects: ["Astral Draw"] };
  const triggerTracker = trackerMap.get(trackerKey(player, "Umbral Draw"));

  let defaultCalled = false;
  handleMutualCardCooldown({
    depConfig,
    cast,
    trackerMap,
    actorById: null,
    fight: null,
    start: cast.relative,
    triggerTracker,
    cooldownInfo: { cooldownMs: DRAW_COOLDOWN_MS },
    defaultAddCooldown: () => {
      defaultCalled = true;
    },
  });

  assert.equal(defaultCalled, false);

  const astralWindows = trackerMap
    .get(trackerKey(player, "Astral Draw"))
    .getCooldownWindows();
  const umbralWindows = triggerTracker.getCooldownWindows();

  assert.equal(astralWindows.length, 0);
  assert.deepEqual(umbralWindows[0], {
    start: 32000,
    end: SAFE_MAX_END,
  });
});

/**
 * Purpose:
 *   Demonstrate the chained dependency flow where Astral Draw throttles Umbral
 *   Draw, which in turn unlocks The Bole only after its own cast resolves.
 *
 * Test flow:
 *   1. Seed all three trackers with outstanding placeholder windows, mimicking a
 *      scenario where the player has just drawn and played cards.
 *   2. Cast Astral Draw at 70000ms to collapse the outstanding Umbral window to
 *      exactly one recast interval and to start a fresh Astral placeholder.
 *   3. Cast Umbral Draw precisely when it comes off cooldown (`start + 55s`) and
 *      run both of its handlers to release The Bole and reopen Umbral’s cooldown.
 *
 * Expectations:
 *   - Neither handler uses the default cooldown generator.
 *   - The pre-existing Umbral window resolves to `40000 + DRAW_COOLDOWN_MS`.
 *   - The Bole window closes at the Umbral cast timestamp, reflecting the card
 *     becoming instantly available.
 *   - Astral Draw’s newest window resolves to `70000 + DRAW_COOLDOWN_MS`.
 */
test("Chained card dependencies release The Bole only after Astral → Umbral sequencing", () => {
  const player = "Seren Cass";
  const trackerMap = buildTrackerMap(player, [
    {
      ability: "The Bole",
      windows: [{ start: 10000, end: SAFE_MAX_END }],
    },
    {
      ability: "Umbral Draw",
      windows: [{ start: 40000, end: SAFE_MAX_END }],
    },
    {
      ability: "Astral Draw",
      windows: [{ start: 20000, end: SAFE_MAX_END }],
    },
  ]);

  const astralCast = { source: player, ability: "Astral Draw", relative: 70000 };
  const astralTracker = trackerMap.get(trackerKey(player, "Astral Draw"));
  const umbralTracker = trackerMap.get(trackerKey(player, "Umbral Draw"));
  const boleTracker = trackerMap.get(trackerKey(player, "The Bole"));

  let defaultAstralCalls = 0;
  handleMutualCardCooldown({
    depConfig: { affects: ["Umbral Draw"] },
    cast: astralCast,
    trackerMap,
    actorById: null,
    fight: null,
    start: astralCast.relative,
    triggerTracker: astralTracker,
    cooldownInfo: { cooldownMs: DRAW_COOLDOWN_MS },
    defaultAddCooldown: () => {
      defaultAstralCalls += 1;
    },
  });
  assert.equal(defaultAstralCalls, 0);

  const umbralAfterAstral = umbralTracker.getCooldownWindows();
  const lastUmbralWindow = umbralAfterAstral[umbralAfterAstral.length - 1];
  assert.deepEqual(lastUmbralWindow, {
    start: 40000,
    end: 40000 + DRAW_COOLDOWN_MS,
  });

  const umbralCastTime = lastUmbralWindow.end;
  const umbralCast = {
    source: player,
    ability: "Umbral Draw",
    relative: umbralCastTime,
  };

  let defaultUmbralCalls = 0;
  const defaultAddCooldown = () => {
    defaultUmbralCalls += 1;
    return true;
  };

  handleAstroCardDependency({
    depConfig: { affects: ["The Bole"] },
    cast: umbralCast,
    trackerMap,
    actorById: null,
    fight: null,
    start: umbralCast.relative,
    triggerTracker: umbralTracker,
    defaultAddCooldown,
    normalizedAbility: normalizeAbilityName("Umbral Draw"),
  });

  handleMutualCardCooldown({
    depConfig: { affects: ["Astral Draw"] },
    cast: umbralCast,
    trackerMap,
    actorById: null,
    fight: null,
    start: umbralCast.relative,
    triggerTracker: umbralTracker,
    cooldownInfo: { cooldownMs: DRAW_COOLDOWN_MS },
    defaultAddCooldown,
  });

  assert.equal(defaultUmbralCalls, 0);

  const boleWindows = boleTracker.getCooldownWindows();
  assert.deepEqual(boleWindows[boleWindows.length - 1], {
    start: 10000,
    end: umbralCastTime,
  });

  const astralWindows = astralTracker.getCooldownWindows();
  assert.deepEqual(astralWindows[astralWindows.length - 1], {
    start: 70000,
    end: 70000 + DRAW_COOLDOWN_MS,
  });

  const umbralWindows = umbralTracker.getCooldownWindows();
  assert.deepEqual(umbralWindows[umbralWindows.length - 1], {
    start: umbralCastTime,
    end: SAFE_MAX_END,
  });
});

/**
 * Purpose:
 *   Guard against accidental window fabrication by confirming that the chained
 *   handlers leave The Bole untouched when it has never been cast, even if the
 *   draw abilities interact with one another.
 *
 * Test flow:
 *   1. Build trackers where only Umbral Draw and Astral Draw have outstanding
 *      placeholder windows.
 *   2. Resolve Astral → Umbral exactly as in the positive chain test.
 *   3. Inspect The Bole tracker to ensure no windows were introduced.
 *
 * Expectations:
 *   - Default cooldown logic remains unused.
 *   - Both draw trackers behave as expected (one window resolves, the other
 *     reopens indefinitely).
 *   - The Bole tracker stays empty throughout the sequence.
 */
test("Chained dependencies do not fabricate The Bole cooldown without a cast", () => {
  const player = "Seren Cass";
  const trackerMap = buildTrackerMap(player, [
    { ability: "The Bole", windows: [] },
    {
      ability: "Umbral Draw",
      windows: [{ start: 50000, end: SAFE_MAX_END }],
    },
    {
      ability: "Astral Draw",
      windows: [{ start: 30000, end: SAFE_MAX_END }],
    },
  ]);

  const astralCast = { source: player, ability: "Astral Draw", relative: 90000 };
  const astralTracker = trackerMap.get(trackerKey(player, "Astral Draw"));
  const umbralTracker = trackerMap.get(trackerKey(player, "Umbral Draw"));
  const boleTracker = trackerMap.get(trackerKey(player, "The Bole"));

  let defaultAstralCalls = 0;
  handleMutualCardCooldown({
    depConfig: { affects: ["Umbral Draw"] },
    cast: astralCast,
    trackerMap,
    actorById: null,
    fight: null,
    start: astralCast.relative,
    triggerTracker: astralTracker,
    cooldownInfo: { cooldownMs: DRAW_COOLDOWN_MS },
    defaultAddCooldown: () => {
      defaultAstralCalls += 1;
    },
  });
  assert.equal(defaultAstralCalls, 0);

  const umbralAfterAstral = umbralTracker.getCooldownWindows();
  const lastUmbralWindow = umbralAfterAstral[umbralAfterAstral.length - 1];
  assert.deepEqual(lastUmbralWindow, {
    start: 50000,
    end: 50000 + DRAW_COOLDOWN_MS,
  });

  const umbralCastTime = lastUmbralWindow.end;
  const umbralCast = {
    source: player,
    ability: "Umbral Draw",
    relative: umbralCastTime,
  };

  let defaultUmbralCalls = 0;
  const defaultAddCooldown = () => {
    defaultUmbralCalls += 1;
    return true;
  };

  handleAstroCardDependency({
    depConfig: { affects: ["The Bole"] },
    cast: umbralCast,
    trackerMap,
    actorById: null,
    fight: null,
    start: umbralCast.relative,
    triggerTracker: umbralTracker,
    defaultAddCooldown,
    normalizedAbility: normalizeAbilityName("Umbral Draw"),
  });

  handleMutualCardCooldown({
    depConfig: { affects: ["Astral Draw"] },
    cast: umbralCast,
    trackerMap,
    actorById: null,
    fight: null,
    start: umbralCast.relative,
    triggerTracker: umbralTracker,
    cooldownInfo: { cooldownMs: DRAW_COOLDOWN_MS },
    defaultAddCooldown,
  });

  assert.equal(defaultUmbralCalls, 0);
  assert.equal(boleTracker.getCooldownWindows().length, 0);

  const astralWindows = astralTracker.getCooldownWindows();
  assert.deepEqual(astralWindows[astralWindows.length - 1], {
    start: 90000,
    end: 90000 + DRAW_COOLDOWN_MS,
  });

  const umbralWindows = umbralTracker.getCooldownWindows();
  assert.deepEqual(umbralWindows[umbralWindows.length - 1], {
    start: umbralCastTime,
    end: SAFE_MAX_END,
  });
});
