import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import { buildStatusList } from "./buffTracker.js";

setModuleLogLevel("ReportParser", "info");
const log = getLogger("ReportParser");

export function parseReport(gqlData) {
  const report = gqlData?.data?.reportData?.report;
  if (!report) {
    log.warn("No report found in gqlData", gqlData);
    return null;
  }

  const { fights, masterData, title } = report;
  const actors = masterData?.actors || [];
  const abilities = masterData?.abilities || [];

  const actorById = new Map(actors.map((a) => [a.id, a]));
  const abilityById = new Map(abilities.map((a) => [a.gameID, a]));

  log.debug(
    `Parsed report "${title}" with ${fights.length} fights, ${actors.length} actors, ${abilities.length} abilities`
  );

  return { title, fights, actorById, abilityById };
}

export function parseBuffEvents(events, fight, actorById, abilityById) {
  if (!events || events.length === 0) {
    log.warn(`Fight ${fight.id}: no buff/debuff events returned`);
    return [];
  }

  const parsed = events
    .map((ev) => {
      const source = actorById.get(ev.sourceID);
      const target = actorById.get(ev.targetID);
      const ability = abilityById.get(ev.abilityGameID);
      return {
        rawTimestamp: ev.timestamp,
        relative: ev.timestamp - fight.startTime,
        source: source ? source.name : `Unknown(${ev.sourceID})`,
        target: target ? target.name : `Unknown(${ev.targetID})`,
        ability: ability ? ability.name : "Unknown Buff/Debuff",
        type: ev.type,
      };
    })
    .filter(Boolean);

  log.debug(
    `Fight ${fight.id}: parsed ${parsed.length} buff/debuff events (apply/remove)`
  );

  return parsed;
}

export function parseFightDamageTaken(events, fight, actorById, abilityById) {
  if (!events || events.length === 0) {
    log.warn(`Fight ${fight.id}: no damage taken events returned`);
    return [];
  }

  const parsed = events
    .map((ev) => {
      const actor = actorById.get(ev.targetID); // target hit
      const source = actorById.get(ev.sourceID); // attacker
      const ability = abilityById.get(ev.abilityGameID);
      return {
        rawTimestamp: ev.timestamp,
        relative: ev.timestamp - fight.startTime,
        actor: actor ? actor.name : `Unknown(${ev.targetID})`,
        source: source ? source.name : `Unknown(${ev.sourceID})`,
        ability: ability ? ability.name : "Unknown Damage",
        amount: ev.amount ?? 0,
        mitigated: ev.absorbed ?? 0,
      };
    })
    .filter(Boolean);

  log.debug(`Fight ${fight.id}: parsed ${parsed.length} damage taken events`);
  return parsed;
}

/**
 * Apply buffs to damage events in the FightTable based on status ranges.
 */
function applyBuffsToAttacks(statusList, damageEvents, fightTable, fight) {
  statusList.forEach((status) => {
    let applied = false;

    damageEvents.forEach((ev) => {
      if (ev.relative >= status.start && ev.relative <= status.end) {
        applied = true;

        if (!fightTable.rows[ev.relative]) {
          fightTable.rows[ev.relative] = {
            source: ev.source,
            ability: ev.ability,
            targets: {},
          };
        }

        if (!fightTable.rows[ev.relative].targets[status.source]) {
          fightTable.rows[ev.relative].targets[status.source] = [];
        }
        fightTable.rows[ev.relative].targets[status.source].push(status.buff);
      }
    });

    if (!applied) {
      log.warn(
        `Buff ${status.buff} from ${status.source} had no matching attacks in Fight ${fight.id} (${status.start}-${status.end})`
      );
    }
  });
}

/**
 * Build the final FightTable with buffs integrated
 */
export function buildFightTable(
  damageEvents,
  buffs,
  fight,
  actorById,
  abilityById
) {
  const statusList = buildStatusList(buffs, fight, actorById, abilityById);

  const table = {
    fightId: fight.id,
    encounterId: fight.encounterID,
    name: fight.name,
    rows: {},
    actors: {},
  };

  // Deduplicate and filter actors
  for (const actor of actorById.values()) {
    if (
      actor.type === "Player" &&
      actor.name !== "Multiple Players" &&
      actor.name !== "Limit Break" &&
      !table.actors[actor.name]
    ) {
      table.actors[actor.name] = {
        id: actor.id,
        name: actor.name,
        type: actor.type,
      };
    }
  }

  // Populate damage events
  damageEvents.forEach((ev) => {
    const ts = ev.relative;

    if (!table.rows[ts]) {
      table.rows[ts] = {
        source: ev.source,
        ability: ev.ability,
        targets: {},
      };
    }

    if (!table.rows[ts].targets[ev.actor]) {
      table.rows[ts].targets[ev.actor] = [];
    }
  });

  // Apply buffs across ranges
  applyBuffsToAttacks(statusList, damageEvents, table, fight);

  log.info(
    `Fight ${fight.id}: FightTable built with ${
      Object.keys(table.rows).length
    } rows and ${Object.keys(table.actors).length} players`
  );

  return table;
}
