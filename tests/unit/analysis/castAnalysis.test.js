import test from "node:test";
import assert from "node:assert/strict";

import { populateMitigationAvailability } from "../../../js/analysis/castAnalysis.js";

/**
 * Scenario:
 *   FightTable rows should reflect cooldown availability even when cast logs
 *   report mitigation ability names with different casing than the canonical
 *   mitigation dataset. In earlier versions, baseline abilities were stored
 *   with their original casing while cooldown trackers stored names as lower
 *   case strings. When `populateMitigationAvailability` compared those values
 *   directly, mismatched casing caused Intervention (and similar abilities) to
 *   remain listed as available despite an active cooldown window.
 *
 * Expectations:
 *   - After a lowercase `intervention` cast, the first row should exclude
 *     Intervention from the availability list.
 *   - Once the base cooldown elapses, the ability should reappear in later rows.
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

  const fightTable = {
    friendlyPlayerIds: [playerId],
    rows: [{ timestamp: 1000 }, { timestamp: 12000 }],
  };

  const parsedCasts = [
    {
      source: playerName,
      ability: "intervention", // intentionally lower case to mimic log variance
      relative: 1000,
    },
  ];

  populateMitigationAvailability(
    fightTable,
    parsedCasts,
    actorById,
    { startTime: 0 }
  );

  const firstRow =
    fightTable.rows[0]?.availableMitigationsByPlayer?.[playerName] ?? [];
  const secondRow =
    fightTable.rows[1]?.availableMitigationsByPlayer?.[playerName] ?? [];

  assert(
    firstRow.length > 0,
    "expected baseline mitigation list to exist for the player"
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
