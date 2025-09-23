import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import { buildStatusList } from "./buffTracker.js";
import { formatRelativeTime } from "../utility/dataUtils.js";
import { IGNORED_BUFFS } from "../config/ignoredBuffs.js";

setModuleLogLevel("ReportParser", "debug");
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

/**
 * Parse raw buff/debuff events into normalized objects for easier processing.
 *
 * Each event is enriched with source/target names and ability names
 * using the actorById and abilityById maps.
 *
 * Returned objects include:
 *   - rawTimestamp: original event timestamp
 *   - relative: timestamp offset from fight start
 *   - source: actor name applying the buff/debuff
 *   - target: actor name receiving the buff/debuff
 *   - ability: buff/debuff name
 *   - type: event type (applybuff, removebuff, applydebuff, etc.)
 *   - stack: stack count if provided (nullable)
 *   - abilityGameID: raw FFLogs ability ID
 *
 * ⚠️ Enhancement: Keeping stack and raw IDs ensures downstream consumers
 * (like buildStatusList) don’t need to re-lookup or lose information.
 *
 * @param {Array} events - Raw buff/debuff events from FFLogs
 * @param {Object} fight - Fight object containing startTime/id
 * @param {Map} actorById - Map of actorID → actor metadata
 * @param {Map} abilityById - Map of abilityGameID → ability metadata
 * @returns {Array} parsed - Array of normalized buff/debuff events
 */
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
        stack: ev.stack ?? null,
        abilityGameID: ev.abilityGameID,
      };
    })
    .filter(Boolean);

  log.debug(
    `Fight ${fight.id}: parsed ${parsed.length} buff/debuff events (apply/remove)`
  );

  return parsed;
}

/**
 * Parse raw damage-taken events into normalized objects for the FightTable.
 *
 * Each event is enriched with actor/source names, ability names,
 * mitigation calculations, and any buffs present in the raw event (via `ev.buffs`).
 *
 * Buff parsing:
 *   - Some "calculateddamage" events include a `buffs` field, e.g. "1001203.1001174.1002675."
 *   - This field is split into individual ability IDs, then translated into buff names
 *     using the `abilityById` map (falling back to `Unknown(<id>)` if not found).
 *   - Parsed buff names are returned in a `buffs` array attached to each event.
 *
 * Mitigation calculation:
 *   - `amount`: the actual damage taken after mitigation.
 *   - `unmitigatedAmount`: the damage that would have been taken without mitigation.
 *   - `mitigated`: the raw difference (`unmitigatedAmount - amount`).
 *   - `mitigationPct`: percentage of damage prevented,
 *       calculated as `(1 - amount / unmitigatedAmount) * 100`, rounded.
 *
 * Returned objects include:
 *   - rawTimestamp: original event timestamp
 *   - relative: timestamp offset from fight start
 *   - actor: name of the target taking damage
 *   - source: name of the attacker
 *   - ability: attack name (resolved from abilityGameID)
 *   - amount: actual damage taken
 *   - unmitigatedAmount: raw unmitigated damage
 *   - mitigated: raw absorbed/mitigated value
 *   - mitigationPct: percentage mitigated (0–100)
 *   - buffs: array of buff names active on the target during this event
 *
 * @param {Array} events - Raw damage events from FFLogs
 * @param {Object} fight - Fight object containing startTime/id
 * @param {Map} actorById - Map of actorID → actor metadata
 * @param {Map} abilityById - Map of abilityGameID → ability metadata
 * @returns {Array} parsed - Array of normalized damage-taken events
 */
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

      // 🔍 Parse buffs if present (string of ability IDs separated by ".")
      let buffNames = [];
      if (ev.buffs) {
        buffNames = ev.buffs
          .split(".")
          .filter((id) => id.length > 0)
          .map((id) => {
            const buffAbility = abilityById.get(Number(id));
            return buffAbility ? buffAbility.name : `Unknown(${id})`;
          })
          // 🚫 Drop globally ignored buffs
          .filter((name) => !IGNORED_BUFFS.has(name));
      }

      const amount = ev.amount ?? 0;
      const unmitigated = ev.unmitigatedAmount ?? amount;
      const mitigated = unmitigated - amount;
      const mitigationPct =
        unmitigated > 0 ? Math.round((1 - amount / unmitigated) * 100) : 0;

      return {
        rawTimestamp: ev.timestamp,
        relative: ev.timestamp - fight.startTime,
        actor: actor ? actor.name : `Unknown(${ev.targetID})`,
        source: source ? source.name : `Unknown(${ev.sourceID})`,
        ability: ability ? ability.name : "Unknown Damage",
        amount,
        unmitigatedAmount: unmitigated,
        mitigated,
        mitigationPct,
        buffs: buffNames, // ✅ include parsed buffs
      };
    })
    .filter(Boolean);

  log.debug(`Fight ${fight.id}: parsed ${parsed.length} damage taken events`);
  return parsed;
}

/**
 * Apply buff/debuff sources to damage events in the FightTable.
 *
 * Matching logic:
 *   - Each damage event already lists the buff *names* active (`ev.buffs`).
 *   - Each status entry from `buildStatusList` describes a buff's timeline
 *     with { source, buff, start, end }.
 *   - We only credit a buff to an event if:
 *       1. The event lists that buff name.
 *       2. The event timestamp falls between the buff’s start and end.
 *
 * Result:
 *   rows[timestamp].buffs = {
 *     "Addle": ["PlayerA"],        // PlayerA applied Addle
 *     "Intervention": ["PlayerB"], // PlayerB applied Intervention
 *   }
 *
 * @param {Array} statusList - Buff/debuff timelines ({ source, buff, start, end })
 * @param {Array} damageEvents - Parsed damage-taken events (with ev.buffs)
 * @param {Object} fightTable - FightTable being constructed
 * @param {Object} fight - Fight metadata for logging context
 */
function applyBuffsToAttacks(statusList, damageEvents, fightTable, fight) {
  damageEvents.forEach((ev) => {
    const row = fightTable.rows[ev.relative];
    if (!row) return;

    ev.buffs.forEach((buffName) => {
      // Find any matching status windows for this buff
      const matches = statusList.filter(
        (s) =>
          s.buff === buffName && ev.relative >= s.start && ev.relative <= s.end
      );

      if (matches.length > 0) {
        matches.forEach((m) => {
          if (!row.buffs[buffName]) row.buffs[buffName] = [];
          row.buffs[buffName].push(m.source);
        });
      } else {
        if (matches.length === 0) {
          // 🛡️ Failsafe: look back within 30s for most recent status of this buff
          const lookbackWindow = 30000;
          const recent = statusList
            .filter(
              (s) =>
                s.buff === buffName &&
                ev.relative >= s.start &&
                ev.relative - s.end <= lookbackWindow
            )
            .sort((a, b) => b.end - a.end)[0];

          if (recent) {
            if (!row.buffs[buffName]) row.buffs[buffName] = [];
            row.buffs[buffName].push(recent.source);
            log.info(
              `Failsafe applied: credited ${recent.source} for buff=${buffName} at ts=${ev.relative} ` +
                `(last seen active ${formatRelativeTime(
                  recent.end + fight.startTime,
                  fight.startTime
                )})`
            );
            return;
          }

          // If failsafe also fails, warn
          log.warn(
            `No active status for buff=${buffName} at ts=${ev.relative}. ` +
              `Known statuses: ${statusList
                .filter((s) => s.buff === buffName)
                .map(
                  (s) =>
                    `[${formatRelativeTime(
                      s.start + fight.startTime,
                      fight.startTime
                    )} - ${formatRelativeTime(
                      s.end + fight.startTime,
                      fight.startTime
                    )}]`
                )
                .join(", ")}`
          );
        }
        // Buff was present in event.buffs but no source found in statusList
        log.warn(
          `Buff ${buffName} on damage event @${ev.relative} (Fight ${fight.id}) had no matching active status`
        );
      }
    });
  });
}

/**
 * Build the final FightTable for a given fight.
 *
 * Rows are keyed by relative timestamp:
 *   {
 *     fightId, encounterId, name,
 *     friendlyPlayerIds: [id1, id2, ...],  // only references player IDs
 *     rows: {
 *       [timestamp]: {
 *         source: attacker name,
 *         ability: attack name,
 *         amount: actual damage taken,
 *         unmitigatedAmount: raw unmitigated damage,
 *         mitigated: raw absorbed/mitigated value,
 *         mitigationPct: percentage mitigated (0–100),
 *         buffs: { buffName: [applierNames] }
 *       }
 *     }
 *   }
 *
 * ⚠️ Enhancement:
 *   - Now consumes parsedBuffEvents instead of raw FFLogs buff/debuff events,
 *     making it consistent with parsedDamageTaken events.
 *   - Rows now include mitigation data (amount, unmitigatedAmount, mitigated, mitigationPct)
 *     directly from parsed damage events so the renderer does not need to recompute.
 *
 * @param {Array} damageEvents - Parsed damage taken events
 * @param {Array} parsedBuffs - Parsed buff/debuff events (from parseBuffEvents)
 * @param {Object} fight - Fight metadata (id, encounterID, name, startTime)
 * @param {Map} actorById - Map of actorID → actor metadata
 * @returns {Object} FightTable
 */
export function buildFightTable(damageEvents, parsedBuffs, fight, actorById) {
  const statusList = buildStatusList(parsedBuffs, fight);

  const table = {
    fightId: fight.id,
    encounterId: fight.encounterID,
    name: fight.name,
    rows: {},
    // ✅ Instead of duplicating actor metadata, only keep friendly player IDs
    friendlyPlayerIds: fight.friendlyPlayers || [],
  };

  // Populate rows from damage events
  damageEvents.forEach((ev) => {
    const ts = ev.relative;
    if (!table.rows[ts]) {
      table.rows[ts] = {
        source: ev.source,
        actor: ev.actor, // target actor name
        targetID: ev.targetID ?? null, // optional: add ID for safer matching
        ability: ev.ability,
        amount: ev.amount,
        unmitigatedAmount: ev.unmitigatedAmount,
        mitigated: ev.mitigated,
        mitigationPct: ev.mitigationPct,
        buffs: {},
      };
    }

    ev.buffs.forEach((buffName) => {
      if (!table.rows[ts].buffs[buffName]) {
        table.rows[ts].buffs[buffName] = [];
      }
    });
  });

  // Fill in applier names based on buff timelines
  applyBuffsToAttacks(statusList, damageEvents, table, fight);

  // ✅ Final pass: replace null/unknown appliers with all players in this fight
  for (const [ts, row] of Object.entries(table.rows)) {
    for (const [buffName, appliers] of Object.entries(row.buffs)) {
      if (
        appliers.length === 0 ||
        appliers.some((a) => !a || a.startsWith("Unknown"))
      ) {
        log.warn(
          `Fight ${fight.id}, ts=${ts}: Buff ${buffName} has no valid source, crediting all players`
        );
        // Replace with all player names from global actorById
        row.buffs[buffName] = table.friendlyPlayerIds
          .map((id) => actorById.get(id)?.name)
          .filter(Boolean);
      }
    }
  }

  log.info(
    `Fight ${fight.id}: FightTable built with ${
      Object.keys(table.rows).length
    } rows and ${table.friendlyPlayerIds.length} players`
  );

  return table;
}
