import { getLogger, setModuleLogLevel } from "../utility/logger.js";

setModuleLogLevel("BuffTracker", "debug");
const log = getLogger("BuffTracker");

/**
 * Build a complete list of buff/debuff statuses with start and end times.
 * - Each "apply" creates a new incomplete status.
 * - Each "remove" tries to match an incomplete one, completes it, and moves it to the completed list.
 * - "refresh" events are ignored but logged as INFO.
 * - Leftover incomplete statuses are closed with MAX_SAFE_INTEGER and logged.
 *
 * @param {Array} buffs - Raw buff/debuff events from FFLogs
 * @param {Object} fight - Fight object with startTime
 * @param {Map} actorById - Map of actorID -> actor metadata
 * @param {Map} abilityById - Map of abilityGameID -> ability metadata
 * @returns {Array} completeStatuses - Array of { source, buff, start, end }
 */
export function buildStatusList(buffs, fight, actorById, abilityById) {
  const incompleteStatuses = [];
  const completeStatuses = [];

  buffs.forEach((ev) => {
    const source = actorById.get(ev.sourceID);
    const target = actorById.get(ev.targetID);
    const ability = abilityById.get(ev.abilityGameID);
    if (!ability) return;

    const buffName = ability.name;
    const relTs = ev.timestamp - fight.startTime;

    // 🔍 DEBUG logging for triage
    log.debug(
      `Buff event: type=${ev.type}, ability=${buffName}, ts=${relTs}, sourceID=${ev.sourceID}, source=${source?.name}, targetID=${ev.targetID}, target=${target?.name}`
    );

    if (ev.type === "applybuff" || ev.type === "applybuffstack") {
      // 1️⃣ Check if an incomplete status already exists for this source+buff
      const exists = incompleteStatuses.find(
        (s) =>
          s.source === source?.name && s.buff === buffName && s.end === null
      );

      if (exists) {
        log.info(
          `Duplicate apply detected for ${buffName} on ${source?.name} @${relTs}, ignoring`
        );
        return;
      }

      // a) new incomplete status
      incompleteStatuses.push({
        source: source ? source.name : `Unknown(${ev.sourceID})`,
        buff: buffName,
        start: relTs,
        end: null,
      });
    } else if (ev.type === "removebuff" || ev.type === "removebuffstack") {
      // c) find matching incomplete status
      const idx = incompleteStatuses.findIndex(
        (s) =>
          s.source === source?.name && s.buff === buffName && s.end === null
      );
      if (idx !== -1) {
        const status = incompleteStatuses.splice(idx, 1)[0];
        status.end = relTs;
        completeStatuses.push(status);
      } else {
        log.error(
          `No matching apply found for ${buffName} removed by ${source?.name} @${relTs}`
        );
      }
    } else if (ev.type === "refreshbuff") {
      log.info(`Refresh event ignored for ${buffName} on ${source?.name}`);
    }
  });

  // f) leftover incomplete statuses
  incompleteStatuses.forEach((s) => {
    log.info(`Incomplete buff ${s.buff} from ${s.source}, no removal found`);
    s.end = Number.MAX_SAFE_INTEGER;
    completeStatuses.push(s);
  });

  return completeStatuses.sort((a, b) => a.start - b.start);
}
