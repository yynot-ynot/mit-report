import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import { formatRelativeTime } from "../utility/dataUtils.js";
import { setVulnerabilityMap } from "../analysis/buffAnalysis.js";

setModuleLogLevel("BuffTracker", "info");
const log = getLogger("BuffTracker");

/**
 * Build a complete list of buff/debuff statuses with start, end, stacks, and targets.
 *
 * This tracker processes both BUFF and DEBUFF events from FFLogs, but it consumes
 * already-parsed buff/debuff events (from parseBuffEvents) rather than raw logs.
 *
 * Each status is uniquely keyed by (source, buff) and maintains:
 *   - start / end time (relative to fight start)
 *   - stack count
 *   - a Set of current targets
 *
 * Using a single status per (source, buff) with a Set of targets ensures that
 * multi-target buffs (e.g. Shake It Off, Embolden) are tracked correctly:
 *   - When the buff applies to one target, behavior is identical to before.
 *   - When the buff applies to multiple targets, they are all tracked in the same
 *     status, and each target is removed individually until none remain.
 *   - This prevents duplicate overlapping statuses for AoE/raid buffs.
 *
 * Supported event types:
 *   - applybuff / applydebuff
 *   - applybuffstack / applydebuffstack
 *   - removebuffstack / removedebuffstack
 *   - removebuff / removedebuff
 *   - refreshbuff / refreshdebuff
 *
 * Event handling rules:
 *   - "apply*" creates a new status or extends an existing one, adding the target.
 *   - "apply*stack" increases stack count on an active status (or creates if missing).
 *   - "remove*stack" decreases stack count but does NOT close the status until
 *     all targets are removed.
 *   - "remove*" removes a single target. If no targets remain, the status closes.
 *   - "refresh*" is logged but does not change the timeline.
 *   - Leftover incomplete statuses are force-closed at MAX_SAFE_INTEGER and logged.
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
  const sortedStatuses = completeStatuses.sort((a, b) => a.start - b.start);

  log.info(
    `Fight ${fight.id}: built ${sortedStatuses.length} complete buff/debuff statuses`,
    sortedStatuses
  );

  return sortedStatuses;
}

/**
 * Build a complete list of vulnerability (debuff) statuses with start, end, stacks, and target.
 *
 * Unlike buff/debuff tracking (which groups multiple targets into one status),
 * vulnerabilities are tracked separately for each target. Each entry corresponds
 * to a specific target being under the effect of a vulnerability.
 *
 * Supported event types:
 *   - applydebuff       → opens a new vulnerability entry
 *   - applydebuffstack  → increases stack count (or opens if missing)
 *   - removedebuffstack → decreases stack count (but entry stays open until full remove)
 *   - removedebuff      → closes the vulnerability entry for that target
 *   - refreshdebuff     → logged but does not affect timeline
 *
 * Behavior:
 *   - Each (target, vulnName) pair is tracked independently.
 *   - An "apply*" opens a new entry if none exists for that target+vuln.
 *   - A "remove*" closes the entry for that target only.
 *   - Stacks are tracked per-target, and removal of one stack does not end the vuln.
 *   - Incomplete entries at the end of the fight are force-closed at MAX_SAFE_INTEGER.
 *   - Additionally: builds a vulnerability name map (like buffToAbilityMap) for later use.
 *
 * @param {Array} parsedEvents - Parsed vulnerability events from parseBuffEvents
 * @param {Object} fight - Fight metadata (must include startTime, id)
 * @returns {Array} completeVulns - Array of { vuln, target, start, end, stacks }
 */
export function buildVulnerabilityList(parsedEvents, fight) {
  const openVulns = []; // active vulnerabilities per target
  const completeVulns = []; // finalized timelines
  const vulnMap = new Map(); // ✅ collect unique vulnerability names

  parsedEvents.forEach((ev) => {
    const vulnName = ev.ability;
    const relTs = ev.relative;
    const target = ev.target;

    // track vuln name in map
    if (vulnName && !vulnMap.has(vulnName.toLowerCase())) {
      vulnMap.set(vulnName.toLowerCase(), vulnName);
    }

    log.debug(
      `Vuln event: type=${ev.type}, vuln=${vulnName}, ts=${relTs}, target=${target}`
    );

    // ---- APPLY ----
    if (ev.type === "applydebuff") {
      let status = openVulns.find(
        (s) => s.vuln === vulnName && s.target === target && s.end === null
      );
      if (!status) {
        status = {
          vuln: vulnName,
          target,
          start: relTs,
          end: null,
          stacks: ev.stack ?? 1,
        };
        openVulns.push(status);
      }
    }

    // ---- APPLY STACK ----
    else if (ev.type === "applydebuffstack") {
      let status = openVulns.find(
        (s) => s.vuln === vulnName && s.target === target && s.end === null
      );
      if (!status) {
        status = {
          vuln: vulnName,
          target,
          start: relTs,
          end: null,
          stacks: ev.stack ?? 1,
        };
        openVulns.push(status);
      } else {
        status.stacks = ev.stack ?? status.stacks + 1;
      }
    }

    // ---- REMOVE STACK ----
    else if (ev.type === "removedebuffstack") {
      const status = openVulns.find(
        (s) => s.vuln === vulnName && s.target === target && s.end === null
      );
      if (status) {
        status.stacks = ev.stack ?? Math.max(0, (status.stacks ?? 1) - 1);
      } else {
        log.error(
          `No active vuln found for ${vulnName} on ${target} when processing removedebuffstack @${relTs}`
        );
      }
    }

    // ---- REMOVE ----
    else if (ev.type === "removedebuff") {
      const status = openVulns.find(
        (s) => s.vuln === vulnName && s.target === target && s.end === null
      );
      if (status) {
        status.end = relTs;
        completeVulns.push(status);
        openVulns.splice(openVulns.indexOf(status), 1);
      } else if (relTs <= 30000) {
        // 🟢 Removed early in fight (<30s) → assume active from pull
        const syntheticStatus = {
          vuln: vulnName,
          target,
          start: 0,
          end: relTs,
          stacks: ev.stack ?? 1,
        };
        completeVulns.push(syntheticStatus);
      } else {
        log.error(
          `Unmatched REMOVE vuln event @${relTs}ms for ${vulnName} on ${target} in Fight ${fight.id}`
        );
      }
    }

    // ---- REFRESH ----
    else if (ev.type === "refreshdebuff") {
      log.debug(`Refresh vuln ignored for ${vulnName} on ${target}`);
    }
  });

  // Close leftovers
  openVulns.forEach((s) => {
    log.info(`Incomplete vuln ${s.vuln} on ${s.target}, no removal found`);
    s.end = Number.MAX_SAFE_INTEGER;
    completeVulns.push(s);
  });

  // Sort by start time
  const sortedVulns = completeVulns.sort((a, b) => a.start - b.start);

  log.info(
    `Fight ${fight.id}: built ${sortedVulns.length} vulnerability statuses`,
    sortedVulns
  );

  // Update global vulnerability map in buffAnalysis
  setVulnerabilityMap(vulnMap);

  return sortedVulns;
}
