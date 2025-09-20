import { getLogger, setModuleLogLevel } from "../utility/logger.js";

setModuleLogLevel("BuffTracker", "info");
const log = getLogger("BuffTracker");

/**
 * Build a complete list of buff/debuff statuses with start and end times.
 *
 * This tracker handles both BUFF and DEBUFF events from FFLogs.
 *
 * Event types supported:
 *   - Buffs:   applybuff, applybuffstack, removebuff, removebuffstack, refreshbuff
 *   - Debuffs: applydebuff, applydebuffstack, removedebuff, removedebuffstack, refreshdebuff
 *
 * Behavior:
 *   - Each "apply*" creates a new incomplete status (if none active).
 *   - Each "remove*" completes an active status (if one exists).
 *   - Each "refresh*" is logged but does not change the timeline.
 *   - Leftover incomplete statuses are closed at MAX_SAFE_INTEGER and logged.
 *
 * @param {Array} buffs - Raw buff/debuff events from FFLogs
 * @param {Object} fight - Fight object with startTime
 * @param {Map} actorById - Map of actorID -> actor metadata
 * @param {Map} abilityById - Map of abilityGameID -> ability metadata
 * @returns {Array} completeStatuses - Array of { source, buff, start, end }
 */
export function buildStatusList(buffs, fight, actorById, abilityById) {
  const incompleteStatuses = []; // stores currently active buffs/debuffs
  const completeStatuses = []; // stores finalized buff/debuff timelines

  buffs.forEach((ev) => {
    const source = actorById.get(ev.sourceID);
    const target = actorById.get(ev.targetID);
    const ability = abilityById.get(ev.abilityGameID);
    if (!ability) return;

    const buffName = ability.name;
    const relTs = ev.timestamp - fight.startTime;

    // 🔍 DEBUG logging to see what we're parsing
    log.debug(
      `Buff/Debuff event: type=${ev.type}, ability=${buffName}, ts=${relTs}, sourceID=${ev.sourceID}, source=${source?.name}, targetID=${ev.targetID}, target=${target?.name}`
    );

    // 1️⃣ Handle APPLY events (buffs or debuffs)
    if (
      ev.type === "applybuff" ||
      ev.type === "applybuffstack" ||
      ev.type === "applydebuff" ||
      ev.type === "applydebuffstack"
    ) {
      // Check if this buff/debuff is already active (duplicate apply)
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

      // Create a new incomplete status entry
      incompleteStatuses.push({
        source: source ? source.name : `Unknown(${ev.sourceID})`,
        buff: buffName,
        start: relTs,
        end: null, // stays null until removed
      });

      // 2️⃣ Handle REMOVE events (buffs or debuffs)
    } else if (
      ev.type === "removebuff" ||
      ev.type === "removebuffstack" ||
      ev.type === "removedebuff" ||
      ev.type === "removedebuffstack"
    ) {
      // Find the corresponding active status
      const idx = incompleteStatuses.findIndex(
        (s) =>
          s.source === source?.name && s.buff === buffName && s.end === null
      );

      if (idx !== -1) {
        // Close it and move to complete list
        const status = incompleteStatuses.splice(idx, 1)[0];
        status.end = relTs;
        completeStatuses.push(status);
      } else {
        // Removal with no matching apply (e.g., log missing)
        log.error(
          `No matching apply found for ${buffName} removed by ${source?.name} @${relTs}`
        );
      }

      // 3️⃣ Handle REFRESH events (buffs or debuffs)
    } else if (ev.type === "refreshbuff" || ev.type === "refreshdebuff") {
      // Does not change start/end timeline, just log it
      log.info(`Refresh event ignored for ${buffName} on ${source?.name}`);
    }
  });

  // 4️⃣ Close leftover statuses (never had a remove event)
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
