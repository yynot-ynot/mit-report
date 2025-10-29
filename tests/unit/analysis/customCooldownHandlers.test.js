import test from "node:test";
import assert from "node:assert/strict";

import {
  handleAstroCardDependency,
  handleMutualCardCooldown,
  handlePaladinOathAbility,
  handlePaladinAutoAttack,
  PaladinOathGaugeContext,
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
 *   Verify that the Paladin Oath gauge handler locks mitigation cooldowns when
 *   the gauge falls below 50 and frees them once sufficient auto attacks have
 *   restored the resource.
 *
 * Test flow:
 *   1. Cast Holy Sheltron twice, separated by a full recast, to deplete the gauge to zero.
 *   2. Confirm that both mitigation abilities are forced to `SAFE_MAX_END`.
 *   3. Feed nine auto attacks (45 gauge) and verify the lock persists.
 *   4. Feed a tenth auto attack (total 50) and check that the original cooldown
 *      endpoints are restored.
 *
 * Expectations:
 *   - Gauge drops from 100 → 50 → 0 across the two casts.
 *   - Holy Sheltron and Intervention both report locked windows until
 *     the gauge refills to at least 50.
 *   - Once refilled, Holy Sheltron regains its base cooldown end while Intervention
 *     resolves to the auto-attack timestamp that freed it.
 */
test("Paladin Oath gauge locks abilities until gauge replenishes", () => {
  const oathContext = new PaladinOathGaugeContext();
  const player = "Roeslan Hal";
  const baseCooldownMs = 25000;
  const trackerMap = buildTrackerMap(player, [
    { ability: "Holy Sheltron", baseCooldownMs, job: "Paladin" },
    { ability: "Intervention", baseCooldownMs, job: "Paladin" },
  ]);

  const normalizedJob = "paladin";
  const normalizedAuto = normalizeAbilityName("Attack");
  const autoCast = { source: player, ability: "Attack" };

  const simulateAuto = (timestamp) =>
    handlePaladinAutoAttack({
      cast: autoCast,
      trackerMap,
      start: timestamp,
      normalizedAbility: normalizedAuto,
      normalizedJob,
      oathContext,
    });

  const holyTracker = trackerMap.get(trackerKey(player, "Holy Sheltron"));
  const interventionTracker = trackerMap.get(
    trackerKey(player, "Intervention")
  );

  const firstCastStart = 10000;
  const firstBaseEnd = firstCastStart + baseCooldownMs;
  handlePaladinOathAbility({
    cast: { source: player, ability: "Holy Sheltron" },
    trackerMap,
    start: firstCastStart,
    triggerTracker: holyTracker,
    cooldownInfo: { cooldownMs: baseCooldownMs },
    defaultAddCooldown: () =>
      holyTracker.addCooldown(firstCastStart, firstBaseEnd),
    normalizedAbility: normalizeAbilityName("Holy Sheltron"),
    normalizedJob,
    oathContext,
  });
  assert.equal(oathContext.getGauge(player), 50);

  assert.deepEqual(holyTracker.getCooldownWindows(), [
    { start: firstCastStart, end: firstBaseEnd },
  ]);

  const secondCastStart = firstBaseEnd + 1000;
  const secondBaseEnd = secondCastStart + baseCooldownMs;
  handlePaladinOathAbility({
    cast: { source: player, ability: "Holy Sheltron" },
    trackerMap,
    start: secondCastStart,
    triggerTracker: holyTracker,
    cooldownInfo: { cooldownMs: baseCooldownMs },
    defaultAddCooldown: () =>
      holyTracker.addCooldown(secondCastStart, secondBaseEnd),
    normalizedAbility: normalizeAbilityName("Holy Sheltron"),
    normalizedJob,
    oathContext,
  });
  assert.equal(oathContext.getGauge(player), 0);

  const holySecondStartWindows =
    holyTracker
      .getCooldownWindows()
      .filter((window) => window.start === secondCastStart);
  assert.equal(holySecondStartWindows.length, 2);
  assert(
    holySecondStartWindows.some(
      (window) => window.end === SAFE_MAX_END
    ),
    "Holy Sheltron should record a resource lock window ending at SAFE_MAX_END"
  );
  assert.deepEqual(interventionTracker.getCooldownWindows(), [
    { start: secondCastStart, end: SAFE_MAX_END },
  ]);

  for (let i = 1; i <= 9; i += 1) {
    simulateAuto(secondCastStart + i * 1000);
  }
  assert.equal(oathContext.getGauge(player), 45);
  assert(
    holyTracker
      .getCooldownWindows()
      .some(
        (window) =>
          window.start === secondCastStart && window.end === SAFE_MAX_END
      ),
    "Holy Sheltron lock should persist until the gauge refills to at least 50"
  );

  const finalAutoTime = secondCastStart + 10 * 1000;
  simulateAuto(finalAutoTime);
  assert.equal(oathContext.getGauge(player), 50);

  const resolvedHolyWindows =
    holyTracker
      .getCooldownWindows()
      .filter((window) => window.start === secondCastStart)
      .map((window) => window.end)
      .sort((a, b) => a - b);
  assert.deepEqual(resolvedHolyWindows, [
    finalAutoTime,
    secondBaseEnd,
  ]);
  const interventionResolved =
    interventionTracker
      .getCooldownWindows()
      .filter((window) => window.start === secondCastStart)
      .map((window) => window.end);
  assert.deepEqual(interventionResolved, [finalAutoTime]);
});

/**
 * Purpose:
 *   Demonstrate that Paladin mitigation locks are released even when the
 *   auto attacks that refill the gauge occur at the exact same timestamp as
 *   the original lock point (a common situation when log timestamps lack
 *   millisecond precision).
 *
 * Test flow:
 *   1. Drain the gauge to zero via two Holy Sheltron casts.
 *   2. Fire ten auto attacks all stamped with the lock timestamp.
 *   3. Inspect the cooldown windows to ensure each lock resolves to a finite
 *      end greater than the cast timestamp.
 *
 * Expectations:
 *   - Holy Sheltron’s tracker retains both the base cooldown window and a resolved
 *     lock window ending shortly after the cast.
 *   - Holy Sheltron and Intervention windows no longer end at `SAFE_MAX_END`
 *     and report an end strictly greater than the lock timestamp.
 */
test("Paladin Oath locks resolve when auto attacks share the lock timestamp", () => {
  const oathContext = new PaladinOathGaugeContext();
  const player = "Tahlia Crest";
  const baseCooldownMs = 30000;
  const trackerMap = buildTrackerMap(player, [
    { ability: "Holy Sheltron", baseCooldownMs, job: "Paladin" },
    { ability: "Intervention", baseCooldownMs, job: "Paladin" },
  ]);

  const normalizedJob = "paladin";
  const normalizedAuto = normalizeAbilityName("Attack");
  const autoCast = { source: player, ability: "Attack" };

  const simulateAuto = (timestamp) =>
    handlePaladinAutoAttack({
      cast: autoCast,
      trackerMap,
      start: timestamp,
      normalizedAbility: normalizedAuto,
      normalizedJob,
      oathContext,
    });

  const holyTracker = trackerMap.get(trackerKey(player, "Holy Sheltron"));
  const interventionTracker = trackerMap.get(
    trackerKey(player, "Intervention")
  );

  const firstStart = 8000;
  const firstEnd = firstStart + baseCooldownMs;
  handlePaladinOathAbility({
    cast: { source: player, ability: "Holy Sheltron" },
    trackerMap,
    start: firstStart,
    triggerTracker: holyTracker,
    cooldownInfo: { cooldownMs: baseCooldownMs },
    defaultAddCooldown: () =>
      holyTracker.addCooldown(firstStart, firstEnd),
    normalizedAbility: normalizeAbilityName("Holy Sheltron"),
    normalizedJob,
    oathContext,
  });

  const secondStart = firstEnd + 2000;
  const secondEnd = secondStart + baseCooldownMs;
  handlePaladinOathAbility({
    cast: { source: player, ability: "Holy Sheltron" },
    trackerMap,
    start: secondStart,
    triggerTracker: holyTracker,
    cooldownInfo: { cooldownMs: baseCooldownMs },
    defaultAddCooldown: () =>
      holyTracker.addCooldown(secondStart, secondEnd),
    normalizedAbility: normalizeAbilityName("Holy Sheltron"),
    normalizedJob,
    oathContext,
  });

  // All auto attacks register at the exact same timestamp as the lock.
  for (let i = 0; i < 10; i += 1) {
    simulateAuto(secondStart);
  }

  const holyWindows = holyTracker.getCooldownWindows();
  const interventionWindows = interventionTracker.getCooldownWindows();

  const holyEndsAtSecondStart = holyWindows
    .filter((window) => window.start === secondStart)
    .map((window) => window.end)
    .sort((a, b) => a - b);
  assert.equal(holyEndsAtSecondStart.length, 2);
  assert(holyEndsAtSecondStart[0] > secondStart);
  assert.equal(holyEndsAtSecondStart[1], secondEnd);

  const holyLast = holyWindows[holyWindows.length - 1];
  assert.notEqual(holyLast.end, SAFE_MAX_END);
  assert(holyLast.end > secondStart);

  const interventionLast = interventionWindows[interventionWindows.length - 1];
  assert.notEqual(interventionLast.end, SAFE_MAX_END);
  assert(interventionLast.end > secondStart);
});

/**
 * Purpose:
 *   Ensure that stacked resource locks created by consecutive Paladin casts are
 *   all cleared once the auto-attack handler restores the gauge to 50.
 *
 * Test flow:
 *   1. Cast Holy Sheltron to drain the gauge to 50 (no lock).
 *   2. Cast Holy Sheltron again to drop the gauge to 0 (first lock added for both mitigations).
 *   3. Cast Intervention while the gauge is still 0 (second lock stacked for every mitigation).
 *   4. Feed ten auto attacks to reach 50 gauge.
 *   5. Verify that no mitigation retains a `SAFE_MAX_END` cooldown window.
 *
 * Expectations:
 *   - Each mitigation temporarily holds two resource lock windows.
 *   - After the gauge returns to 50, every lock window resolves to a finite end time.
 */
test("Paladin auto attacks resolve stacked resource locks", () => {
  const oathContext = new PaladinOathGaugeContext();
  const player = "Brant Ferron";
  const baseCooldownMs = 20000;
  const trackerMap = buildTrackerMap(player, [
    { ability: "Holy Sheltron", baseCooldownMs, job: "Paladin" },
    { ability: "Intervention", baseCooldownMs, job: "Paladin" },
  ]);

  const normalizedJob = "paladin";
  const normalizedAuto = normalizeAbilityName("Attack");
  const autoCast = { source: player, ability: "Attack" };

  const simulateAuto = (timestamp) =>
    handlePaladinAutoAttack({
      cast: autoCast,
      trackerMap,
      start: timestamp,
      normalizedAbility: normalizedAuto,
      normalizedJob,
      oathContext,
    });

  const holyTracker = trackerMap.get(trackerKey(player, "Holy Sheltron"));
  const interventionTracker = trackerMap.get(
    trackerKey(player, "Intervention")
  );

  const castWith = (abilityName, tracker, start) =>
    handlePaladinOathAbility({
      cast: { source: player, ability: abilityName },
      trackerMap,
      start,
      triggerTracker: tracker,
      cooldownInfo: { cooldownMs: baseCooldownMs },
      defaultAddCooldown: () =>
        tracker.addCooldown(start, start + baseCooldownMs),
      normalizedAbility: normalizeAbilityName(abilityName),
      normalizedJob,
      oathContext,
    });

  castWith("Holy Sheltron", holyTracker, 5000); // gauge → 50, no lock
  castWith("Holy Sheltron", holyTracker, 30000); // gauge → 0, first lock
  castWith("Intervention", interventionTracker, 60000); // gauge → 0, second lock

  [holyTracker, interventionTracker].forEach((tracker) => {
    const pendingLocks = tracker
      .getCooldownWindows()
      .filter((window) => window.end === SAFE_MAX_END);
    assert.equal(
      pendingLocks.length,
      2,
      "Each mitigation should accumulate two resource lock windows"
    );
  });

  for (let i = 0; i < 10; i += 1) {
    simulateAuto(65000 + i * 1000);
  }
  assert.equal(oathContext.getGauge(player), 50);

  [holyTracker, interventionTracker].forEach((tracker) => {
    const unresolvedLocks = tracker
      .getCooldownWindows()
      .filter((window) => window.end === SAFE_MAX_END);
    assert.equal(
      unresolvedLocks.length,
      0,
      "All resource locks should resolve once the gauge reaches 50"
    );
  });
});

/**
 * Purpose:
 *   Ensure that mitigation windows remain locked when the Paladin fails to
 *   accumulate enough auto attacks to cover the 50-gauge cost.
 *
 * Test flow:
 *   1. Drain the gauge to zero with two Holy Sheltron casts.
 *   2. Feed only five auto attacks (25 gauge) and inspect the cooldown window.
 *
 * Expectations:
 *   - Gauge sits at 25 after the partial refill.
 *   - Holy Sheltron’s most recent window remains forced to `SAFE_MAX_END`.
 */
test("Paladin Oath gauge keeps abilities locked without sufficient auto attacks", () => {
  const oathContext = new PaladinOathGaugeContext();

  const player = "Leovan Steel";
  const baseCooldownMs = 20000;
  const trackerMap = buildTrackerMap(player, [
    { ability: "Holy Sheltron", baseCooldownMs, job: "Paladin" },
  ]);

  const normalizedJob = "paladin";
  const normalizedAuto = normalizeAbilityName("Attack");
  const autoCast = { source: player, ability: "Attack" };

  const simulateAuto = (timestamp) =>
    handlePaladinAutoAttack({
      cast: autoCast,
      trackerMap,
      start: timestamp,
      normalizedAbility: normalizedAuto,
      normalizedJob,
      oathContext,
    });

  const holyTracker = trackerMap.get(trackerKey(player, "Holy Sheltron"));

  const firstStart = 6000;
  const firstEnd = firstStart + baseCooldownMs;
  handlePaladinOathAbility({
    cast: { source: player, ability: "Holy Sheltron" },
    trackerMap,
    start: firstStart,
    triggerTracker: holyTracker,
    cooldownInfo: { cooldownMs: baseCooldownMs },
    defaultAddCooldown: () =>
      holyTracker.addCooldown(firstStart, firstEnd),
    normalizedAbility: normalizeAbilityName("Holy Sheltron"),
    normalizedJob,
    oathContext,
  });

  const secondStart = firstEnd + 1000;
  const secondEnd = secondStart + baseCooldownMs;
  handlePaladinOathAbility({
    cast: { source: player, ability: "Holy Sheltron" },
    trackerMap,
    start: secondStart,
    triggerTracker: holyTracker,
    cooldownInfo: { cooldownMs: baseCooldownMs },
    defaultAddCooldown: () =>
      holyTracker.addCooldown(secondStart, secondEnd),
    normalizedAbility: normalizeAbilityName("Holy Sheltron"),
    normalizedJob,
    oathContext,
  });
  assert.equal(oathContext.getGauge(player), 0);

  for (let i = 1; i <= 5; i += 1) {
    simulateAuto(secondStart + i * 800);
  }
  assert.equal(oathContext.getGauge(player), 25);

  assert(
    holyTracker
      .getCooldownWindows()
      .some(
        (window) =>
          window.start === secondStart && window.end === SAFE_MAX_END
      ),
    "Holy Sheltron lock should persist when the gauge remains below 50"
  );
});

/**
 * Purpose:
 *   Confirm that a Paladin mitigation ability retains its base cooldown window
 *   when the gauge remains above the 50-point threshold after a cast.
 *
 * Test flow:
 *   1. Cast Holy Sheltron once at full gauge.
 *   2. Inspect the tracker window and gauge amount immediately afterwards.
 *
 * Expectations:
 *   - Gauge drops from 100 to 50.
 *   - The tracker records the default cooldown window without forcing a lock.
 */
test("Paladin Oath abilities remain on base cooldown when gauge stays at threshold", () => {
  const oathContext = new PaladinOathGaugeContext();

  const player = "Tyrin Blaze";
  const baseCooldownMs = 15000;
  const trackerMap = buildTrackerMap(player, [
    { ability: "Holy Sheltron", baseCooldownMs, job: "Paladin" },
  ]);

  const normalizedJob = "paladin";
  const holyTracker = trackerMap.get(trackerKey(player, "Holy Sheltron"));

  const holyStart = 12000;
  const holyBaseEnd = holyStart + baseCooldownMs;

  handlePaladinOathAbility({
    cast: { source: player, ability: "Holy Sheltron" },
    trackerMap,
    start: holyStart,
    triggerTracker: holyTracker,
    cooldownInfo: { cooldownMs: baseCooldownMs },
    defaultAddCooldown: () =>
      holyTracker.addCooldown(holyStart, holyBaseEnd),
    normalizedAbility: normalizeAbilityName("Holy Sheltron"),
    normalizedJob,
    oathContext,
  });

  assert.equal(oathContext.getGauge(player), 50);
  assert.deepEqual(holyTracker.getCooldownWindows(), [
    { start: holyStart, end: holyBaseEnd },
  ]);
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
