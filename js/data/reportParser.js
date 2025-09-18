import { formatRelativeTime } from "../utility/dataUtils.js";
import { getLogger, setModuleLogLevel } from "../utility/logger.js";

setModuleLogLevel("ReportParser", "info");
const log = getLogger("ReportParser");

/**
 * Parse the GraphQL report response into a structured format.
 */
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

  return {
    title,
    fights,
    actorById,
    abilityById,
  };
}

/**
 * Enrich events with human-readable actor + ability + relative time.
 * Only keep casts from players in fight.friendlyPlayers.
 */
export function parseFightEvents(events, fight, actorById, abilityById) {
  if (!events || events.length === 0) {
    log.warn(`Fight ${fight.id}: no events returned`);
    return [];
  }

  // --- Raw pre-filter stats
  const actorCounts = new Map();
  let lastRawTime = 0;

  events.forEach((ev) => {
    const actor = actorById.get(ev.sourceID);
    const name = actor ? actor.name : `Unknown(${ev.sourceID})`;
    actorCounts.set(name, (actorCounts.get(name) || 0) + 1);
    if (ev.timestamp > lastRawTime) lastRawTime = ev.timestamp;
  });

  // --- Filter to players
  const enriched = events
    .map((ev) => {
      const actor = actorById.get(ev.sourceID);
      if (!actor || !fight.friendlyPlayers.includes(ev.sourceID)) {
        return null;
      }
      const ability = abilityById.get(ev.abilityGameID);
      return {
        rawTimestamp: ev.timestamp,
        relative: ev.timestamp - fight.startTime,
        actor: actor.name,
        ability: ability ? ability.name : "Unknown Ability",
      };
    })
    .filter(Boolean);

  // --- Summarize at INFO level
  const fightDuration = fight.endTime - fight.startTime;
  const lastEventTime =
    enriched.length > 0 ? enriched[enriched.length - 1].relative : 0;

  const keptPct = ((enriched.length / events.length) * 100).toFixed(1);

  if (keptPct < 50) {
    log.warn(
      `Fight ${fight.id}: ${events.length} raw events (${
        actorCounts.size
      } actors) → ${
        enriched.length
      } kept (${keptPct}%), last player event at ${(
        lastEventTime / 1000
      ).toFixed(1)}s / fight length ${(fightDuration / 1000).toFixed(1)}s`
    );
  } else {
    log.info(
      `Fight ${fight.id}: ${events.length} raw events (${
        actorCounts.size
      } actors), ${enriched.length} kept (${keptPct}%), last player event at ${(
        lastEventTime / 1000
      ).toFixed(1)}s / fight length ${(fightDuration / 1000).toFixed(1)}s`
    );
  }

  log.debug("Actor breakdown", Object.fromEntries(actorCounts));

  return enriched;
}
