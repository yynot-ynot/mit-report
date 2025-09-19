import { getLogger, setModuleLogLevel } from "../utility/logger.js";

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

  return {
    title,
    fights,
    actorById,
    abilityById,
  };
}

export function parseFightEvents(events, fight, actorById, abilityById) {
  if (!events || events.length === 0) {
    log.warn(`Fight ${fight.id}: no cast events returned`);
    return [];
  }

  const parsed = events
    .map((ev) => {
      const actor = actorById.get(ev.sourceID);
      if (!actor) return null;
      const ability = abilityById.get(ev.abilityGameID);
      return {
        rawTimestamp: ev.timestamp,
        relative: ev.timestamp - fight.startTime,
        actor: actor.name,
        ability: ability ? ability.name : "Unknown Ability",
      };
    })
    .filter(Boolean);

  log.debug(
    `Fight ${fight.id}: parsed ${parsed.length} cast events into player actions`
  );

  return parsed;
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
 * Normalize parsed events into a FightTable structure
 */
export function normalizeFightTable(damageEvents, fight, actorById) {
  const table = {
    fightId: fight.id,
    encounterId: fight.encounterID,
    name: fight.name,
    rows: {},
    actors: {},
  };

  // Deduplicate and filter actors: only real players, exclude “Multiple Players” and “Limit Break”
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

  log.debug(
    `Fight ${fight.id}: normalizing into FightTable with ${
      Object.keys(table.actors).length
    } player columns`
  );

  damageEvents.forEach((ev, idx) => {
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

    // Test injection: add Rampart for the very first attack event, first player
    if (idx === 0) {
      table.rows[ts].targets[ev.actor].push("Rampart");
      log.debug(
        `Injected test buff 'Rampart' for ${ev.actor} at ${ts}ms (first event)`
      );
    }

    log.debug(
      `Fight ${fight.id} @${ts}ms: ${ev.source} used ${ev.ability} on ${ev.actor}`
    );
  });

  log.debug(
    `Fight ${fight.id}: FightTable complete with ${
      Object.keys(table.rows).length
    } rows`
  );

  return table;
}
