import { formatRelativeTime } from "../utility/dataUtils.js";
import { getLogger, setModuleLogLevel } from "../utility/logger.js";

setModuleLogLevel("ReportParser", "debug");
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
 */
export function parseFightEvents(events, fight, actorById, abilityById) {
  return events.map((ev) => {
    const actor = actorById.get(ev.sourceID);
    const ability = abilityById.get(ev.abilityGameID);
    const timestamp = formatRelativeTime(ev.timestamp, fight.startTime);

    return {
      timestamp,
      actor: actor ? actor.name : "Unknown",
      ability: ability ? ability.name : "Unknown Ability",
    };
  });
}
