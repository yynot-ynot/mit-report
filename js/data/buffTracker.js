import { getLogger, setModuleLogLevel } from "../utility/logger.js";

setModuleLogLevel("BuffTracker", "info");
const log = getLogger("BuffTracker");

/**
 * Build a complete list of buff/debuff statuses with start, end, and stack counts.
 *
 * This tracker handles both BUFF and DEBUFF events from FFLogs.
 *
 * Supported event types:
 *   - applybuff / applydebuff
 *   - applybuffstack / applydebuffstack
 *   - removebuffstack / removedebuffstack
 *   - removebuff / removedebuff
 *   - refreshbuff / refreshdebuff
 *
 * Behavior:
 *   - "apply*" creates a new incomplete status if not already active.
 *   - "apply*stack" increases stack count on an active status (or creates if missing).
 *   - "remove*stack" decreases stack count but does NOT close the status until a plain remove occurs.
 *   - "remove*" closes the status completely.
 *   - "refresh*" is logged but does not change the timeline.
 *   - Leftover incomplete statuses are closed at MAX_SAFE_INTEGER and logged.
 *
 * @param {Array} events - Raw buff/debuff events from FFLogs
 * @param {Object} fight - Fight object with startTime
 * @param {Map} actorById - Map of actorID -> actor metadata
 * @param {Map} abilityById - Map of abilityGameID -> ability metadata
 * @returns {Array} completeStatuses - Array of { source, buff, start, end, stacks }
 */
export function buildStatusList(events, fight, actorById, abilityById) {
  const incompleteStatuses = []; // currently active
  const completeStatuses = []; // finalized

  events.forEach((ev) => {
    const source = actorById.get(ev.sourceID);
    const ability = abilityById.get(ev.abilityGameID);
    if (!ability) return;

    const buffName = ability.name;
    const relTs = ev.timestamp - fight.startTime;

    log.debug(
      `Buff/Debuff event: type=${ev.type}, ability=${buffName}, ts=${relTs}, ` +
        `sourceID=${ev.sourceID}, source=${source?.name}, targetID=${ev.targetID}`
    );

    // ---- APPLY ----
    if (ev.type === "applybuff" || ev.type === "applydebuff") {
      const exists = incompleteStatuses.find(
        (s) =>
          s.source === source?.name && s.buff === buffName && s.end === null
      );
      if (exists) {
        log.debug(
          `Duplicate apply detected for ${buffName} on ${source?.name} @${relTs}, ignoring`
        );
        return;
      }
      incompleteStatuses.push({
        source: source ? source.name : `Unknown(${ev.sourceID})`,
        buff: buffName,
        start: relTs,
        end: null,
        stacks: ev.stack ?? 1,
      });
    }

    // ---- APPLY STACK ----
    else if (ev.type === "applybuffstack" || ev.type === "applydebuffstack") {
      let status = incompleteStatuses.find(
        (s) =>
          s.source === source?.name && s.buff === buffName && s.end === null
      );
      if (!status) {
        // create a new status if missing
        status = {
          source: source ? source.name : `Unknown(${ev.sourceID})`,
          buff: buffName,
          start: relTs,
          end: null,
          stacks: ev.stack ?? 1,
        };
        incompleteStatuses.push(status);
      } else {
        status.stacks = ev.stack ?? status.stacks + 1;
      }
      log.debug(
        `Applied stack for ${buffName} (${status.stacks}) on ${status.source} @${relTs}`
      );
    }

    // ---- REMOVE STACK ----
    else if (ev.type === "removebuffstack" || ev.type === "removedebuffstack") {
      const status = incompleteStatuses.find(
        (s) =>
          s.source === source?.name && s.buff === buffName && s.end === null
      );
      if (status) {
        status.stacks = ev.stack ?? Math.max(0, (status.stacks ?? 1) - 1);
        log.debug(
          `Removed stack for ${buffName}, now ${status.stacks} stacks on ${status.source} @${relTs}`
        );
      } else {
        log.error(
          `No active status found for ${buffName} when processing remove*stack @${relTs}`
        );
      }
    }

    // ---- REMOVE (close status) ----
    else if (ev.type === "removebuff" || ev.type === "removedebuff") {
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
    }

    // ---- REFRESH ----
    else if (ev.type === "refreshbuff" || ev.type === "refreshdebuff") {
      log.debug(`Refresh event ignored for ${buffName} on ${source?.name}`);
    }
  });

  // Close leftover
  incompleteStatuses.forEach((s) => {
    log.info(
      `Incomplete buff/debuff ${s.buff} from ${s.source}, no removal found`
    );
    s.end = Number.MAX_SAFE_INTEGER; // stays active until end of fight
    completeStatuses.push(s);
  });

  // Sort all completed statuses by start time for consistent output
  return completeStatuses.sort((a, b) => a.start - b.start);
}
