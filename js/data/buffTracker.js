import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import { formatRelativeTime } from "../utility/dataUtils.js";

setModuleLogLevel("BuffTracker", "info");
const log = getLogger("BuffTracker");

/**
 * Build a complete list of buff/debuff statuses with start, end, stacks, and targets.
 *
 * This tracker handles both BUFF and DEBUFF events from FFLogs, but now consumes
 * already-parsed buff/debuff events (from parseBuffEvents).
 *
 * Supported event types:
 *   - applybuff / applydebuff
 *   - applybuffstack / applydebuffstack
 *   - removebuffstack / removedebuffstack
 *   - removebuff / removedebuff
 *   - refreshbuff / refreshdebuff
 *
 * Behavior:
 *   - "apply*" creates or extends a status with the given target.
 *   - "apply*stack" increases stack count on an active status (or creates if missing).
 *   - "remove*stack" decreases stack count but does NOT close the status until all targets are removed.
 *   - "remove*" removes a single target from the status. If no targets remain, the status closes.
 *   - "refresh*" is logged but does not change the timeline.
 *   - Leftover incomplete statuses are closed at MAX_SAFE_INTEGER and logged.
 *
 * ⚠️ New behavior:
 *   - A single status is kept per (source, buff), containing a Set of targets.
 *   - This fixes AoE/raid buffs (e.g., Shake It Off, Embolden) that previously created duplicate overlapping statuses.
 *   - When the buff applies to one target, this behaves like before.
 *   - When it applies to multiple targets, each remove only clears that one target until all are gone.
 *
 * @param {Array} parsedEvents - Parsed buff/debuff events from parseBuffEvents
 * @param {Object} fight - Fight object with startTime
 * @returns {Array} completeStatuses - Array of { source, buff, start, end, stacks, targets }
 */
export function buildStatusList(parsedEvents, fight) {
  const incompleteStatuses = []; // currently active (open)
  const completeStatuses = []; // finalized (closed)

  parsedEvents.forEach((ev) => {
    const buffName = ev.ability;
    const relTs = ev.relative;
    const source = ev.source;
    const target = ev.target;

    log.debug(
      `Buff/Debuff event: type=${ev.type}, ability=${buffName}, ts=${relTs}, ` +
        `source=${source}, target=${target}`
    );

    // ---- APPLY ----
    if (ev.type === "applybuff" || ev.type === "applydebuff") {
      let status = incompleteStatuses.find(
        (s) => s.source === source && s.buff === buffName && s.end === null
      );
      if (!status) {
        status = {
          source,
          buff: buffName,
          start: relTs,
          end: null,
          stacks: ev.stack ?? 1,
          targets: new Set(),
        };
        incompleteStatuses.push(status);
      }
      status.targets.add(target);
    }

    // ---- APPLY STACK ----
    else if (ev.type === "applybuffstack" || ev.type === "applydebuffstack") {
      let status = incompleteStatuses.find(
        (s) => s.source === source && s.buff === buffName && s.end === null
      );
      if (!status) {
        status = {
          source,
          buff: buffName,
          start: relTs,
          end: null,
          stacks: ev.stack ?? 1,
          targets: new Set([target]),
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
        (s) => s.source === source && s.buff === buffName && s.end === null
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

    // ---- REMOVE (close status if all targets gone) ----
    else if (ev.type === "removebuff" || ev.type === "removedebuff") {
      const status = incompleteStatuses.find(
        (s) => s.source === source && s.buff === buffName && s.end === null
      );
      if (status) {
        status.targets.delete(target);
        if (status.targets.size === 0) {
          status.end = relTs;
          completeStatuses.push(status);
          incompleteStatuses.splice(incompleteStatuses.indexOf(status), 1);
        }
      } else if (relTs <= 30000) {
        // 🟢 Case: Removed early in fight (<30s), assume buff active from pull start
        const syntheticStatus = {
          source,
          buff: buffName,
          start: 0,
          end: relTs,
          stacks: ev.stack ?? 1,
          targets: new Set([target]),
        };
        completeStatuses.push(syntheticStatus);
        log.debug(
          `No matching apply found for ${buffName} removed by ${source} @${relTs}. ` +
            `Assuming it was active from pull start.`
        );
      } else {
        // 🟠 TODO: Handle mid-fight removes without apply
        log.error(
          `Unmatched REMOVE event @${relTs}ms (${formatRelativeTime(
            ev.rawTimestamp,
            fight.startTime
          )}) ` +
            `in Fight ${fight.id}: type=${ev.type}, buff=${buffName}, source=${source}, target=${target}, ` +
            `stack=${ev.stack ?? "n/a"}, abilityGameID=${ev.abilityGameID}`
        );
      }
    }

    // ---- REFRESH ----
    else if (ev.type === "refreshbuff" || ev.type === "refreshdebuff") {
      log.debug(`Refresh event ignored for ${buffName} on ${source}`);
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
