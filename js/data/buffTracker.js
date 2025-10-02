import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";
import { formatRelativeTime } from "../utility/dataUtils.js";

setModuleLogLevel("BuffTracker", envLogLevel("info", "warn"));
const log = getLogger("BuffTracker");

/**
 * Build a complete list of buff/debuff statuses with start, end, stacks, activeTargets, and targets.
 *
 * This tracker processes both BUFF and DEBUFF events from FFLogs, but it consumes
 * already-parsed buff/debuff events (from parseBuffEvents) rather than raw logs.
 *
 * Each status is uniquely keyed by (source, buff) and maintains:
 *   - start / end time (relative to fight start)
 *   - stack count
 *   - activeTargets: a Set of currently affected targets (working field used
 *     to decide when the status should close)
 *   - targets: a Set of all targets that have ever been affected by this status
 *     (historical record, even if they are no longer active)
 *
 * Using a single status per (source, buff) with activeTargets ensures that
 * multi-target buffs (e.g. Shake It Off, Embolden) are tracked correctly:
 *   - When the buff applies to one target, behavior is identical to before.
 *   - When the buff applies to multiple targets, they are all tracked in the same
 *     status, and each target is removed individually until none remain.
 *   - The historical `targets` field still records everyone who was ever affected,
 *     even if they were removed before the status closed.
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
 *     Both `activeTargets` and `targets` are updated.
 *   - "apply*stack" increases stack count on an active status (or creates if missing).
 *     Target is also added to both sets.
 *   - "remove*stack" decreases stack count but does NOT close the status until
 *     all activeTargets are removed.
 *   - "remove*" removes a single target from activeTargets. If no activeTargets remain,
 *     the status closes. The `targets` set is NOT modified, preserving history.
 *   - "refresh*" is logged but does not change the timeline.
 *   - Leftover incomplete statuses are force-closed at MAX_SAFE_INTEGER and logged.
 *
 * @param {Array} parsedEvents - Parsed buff/debuff events from parseBuffEvents
 * @param {Object} fight - Fight object with startTime
 * @returns {Array} completeStatuses - Array of { source, buff, start, end, stacks, activeTargets, targets }
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
          activeTargets: new Set(),
          targets: new Set(), // historical record
        };
        incompleteStatuses.push(status);
      }
      status.activeTargets.add(target);
      status.targets.add(target); // track historical
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
          activeTargets: new Set([target]),
          targets: new Set([target]), // historical
        };
        incompleteStatuses.push(status);
      } else {
        status.stacks = ev.stack ?? status.stacks + 1;
        status.activeTargets.add(target);
        status.targets.add(target); // add to historical as well
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

    // ---- REMOVE (close status if all activeTargets gone) ----
    else if (ev.type === "removebuff" || ev.type === "removedebuff") {
      const status = incompleteStatuses.find(
        (s) => s.source === source && s.buff === buffName && s.end === null
      );
      if (status) {
        status.activeTargets.delete(target); // remove from working set only
        if (status.activeTargets.size === 0) {
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
          activeTargets: new Set(), // no one still active
          targets: new Set([target]), // historical
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
 * @param {BuffAnalysis} buffAnalysis - Instance of BuffAnalysis for this fight
 * @returns {Array} completeVulns - Array of { vuln, target, start, end, stacks }
 */
export function buildVulnerabilityList(parsedEvents, fight, buffAnalysis) {
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
  buffAnalysis.setVulnerabilityMap(vulnMap);

  return sortedVulns;
}

/**
 * Build a complete death status list using parsed death events and Raise buff statuses.
 *
 * Purpose:
 *   Track when a player is "dead" (from death → rez). FFLogs does not log
 *   "revive" directly, but Raise is represented as a buff. The Raise buff
 *   applies to a dead player and falls off when they accept and return.
 *
 * Logic:
 *   - Start: the timestamp of the death event.
 *   - End: the removal time of the first Raise buff applied to the same actor
 *           after the death.
 *   - If no Raise buff is found, end = Number.MAX_SAFE_INTEGER.
 *
 * Behavior:
 *   - Each death creates one timeline entry { actor, start, end, source }.
 *   - Multiple deaths per actor in the same fight will produce multiple entries.
 *   - Raise detection is case-insensitive (`buff.toLowerCase() === "raise"`).
 *
 * @param {Array} parsedDeaths - Parsed death events (from parseFightDeaths)
 * @param {Array} statusList - Buff/debuff timelines (from buildStatusList)
 * @param {Object} fight - Fight metadata (id, startTime)
 * @returns {Array} deathStatuses - Array of { actor, start, end, source }
 */
export function buildDeathStatusList(parsedDeaths, statusList, fight) {
  const deathStatuses = [];

  parsedDeaths.forEach((death) => {
    const { actor, relative, source } = death;

    /**
     * ⚠️ FFLogs Quirk Justification:
     * In some cases, Raise is logged slightly *before* the actual death event,
     * even though logically it is associated with that death.
     *
     * Example:
     *   - Death:  https://www.fflogs.com/reports/gC7tXWMwvNqpyD2f?fight=7&type=deaths&view=events
     *   - Raise:  https://www.fflogs.com/reports/gC7tXWMwvNqpyD2f?fight=7&type=auras&view=events&target=4&ability=1000148
     *
     * In this report, Fumiko Sumomo’s Raise is logged ~0.09s before her death.
     * To handle this, we allow a small lookback window of 1.5s when associating
     * Raise buffs with deaths.
     */
    const lookbackWindow = 1500;
    const raiseStatuses = statusList.filter(
      (s) =>
        s.buff.toLowerCase() === "raise" &&
        s.targets.has(actor) &&
        s.start >= relative - lookbackWindow
    );

    log.debug(
      `Death tracking: actor=${actor}, ts=${formatRelativeTime(
        death.rawTimestamp,
        fight.startTime
      )}, found ${raiseStatuses.length} Raise buff(s)`
    );

    let end = Number.MAX_SAFE_INTEGER;
    if (raiseStatuses.length > 0) {
      // Take the first Raise after (or just before) death
      const raise = raiseStatuses[0];
      end = raise.end ?? Number.MAX_SAFE_INTEGER;

      // 🛠 Sanity check: make sure end ≥ start
      if (end < relative) {
        log.error(
          `Death tracking correction: actor=${actor}, Raise ended before death ` +
            `(end=${formatRelativeTime(
              raise.end + fight.startTime,
              fight.startTime
            )}, start=${formatRelativeTime(
              death.rawTimestamp,
              fight.startTime
            )}). Clamping end=start.`
        );
        end = relative;
      }
    }

    deathStatuses.push({
      actor,
      start: relative,
      end,
      source,
    });
  });

  log.info(
    `Fight ${fight.id}: built ${deathStatuses.length} death statuses`,
    deathStatuses
  );

  return deathStatuses;
}
