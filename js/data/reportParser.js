import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";
import {
  buildStatusList,
  buildVulnerabilityList,
  buildDeathStatusList,
} from "./buffTracker.js";
import { formatRelativeTime } from "../utility/dataUtils.js";
import { IGNORED_BUFFS } from "../config/ignoredEntities.js";
import {
  assignLastKnownBuffSource,
  calculateTotalMitigation,
} from "../analysis/buffAnalysis.js";
import { populateMitigationAvailability } from "../analysis/castAnalysis.js";

setModuleLogLevel("ReportParser", envLogLevel("info", "warn"));
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

  // Build name → actor mapping for convenience in renderers
  const actorByName = new Map();
  actors.forEach((a) => {
    if (a?.name) actorByName.set(a.name, a);
  });

  log.debug(
    `Parsed report "${title}" with ${fights.length} fights, ${actors.length} actors, ${abilities.length} abilities`
  );

  return { title, fights, actorById, abilityById, actorByName };
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

  // Track ability types and the names that use them
  const seenTypes = new Set();
  const typeToNames = new Map();

  // Store translation from numeric type code → readable label
  const typeCodeToDamageType = {
    32: "magical",
    128: "physical", // Regular physical
    1024: "magical", // Regular magical
  };

  const parsed = events
    .map((ev) => {
      const actor = actorById.get(ev.targetID); // target hit
      const source = actorById.get(ev.sourceID); // attacker
      const ability = abilityById.get(ev.abilityGameID);

      if (ability?.type) {
        seenTypes.add(ability.type);

        // Track the ability name under its type
        if (!typeToNames.has(ability.type)) {
          typeToNames.set(ability.type, new Set());
        }
        typeToNames.get(ability.type).add(ability.name);
      }

      // Parse buffs if present (string of ability IDs separated by ".")
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
      const absorbed = ev.absorbed ?? 0;
      const unmitigated = ev.unmitigatedAmount ?? amount;
      const mitigated = unmitigated - amount - absorbed;

      // Determine the translated damage type label (physical | magical | unique | null)
      let damageType = null;

      if (ability?.type != null) {
        if (typeCodeToDamageType[ability.type]) {
          damageType = typeCodeToDamageType[ability.type];
        } else {
          // Ability has a defined type, but it's not in our map — treat as "unique"
          damageType = "unique";
        }
      } else {
        // ability.type is missing entirely — keep null
        damageType = null;
      }

      // 1. Actual mitigation from event data
      const mitigationPct =
        unmitigated > 0 ? Math.round((mitigated / unmitigated) * 100) : 0;

      // Use the global mitigation calculator with damageType and target job context
      // 2. Intended mitigation based on buffs & context
      const targetJob = actor?.subType || null;
      const intendedMitPct = Math.round(
        calculateTotalMitigation(buffNames, damageType, targetJob) * 100
      );

      return {
        rawTimestamp: ev.timestamp,
        relative: ev.timestamp - fight.startTime,
        actor: actor ? actor.name : `Unknown(${ev.targetID})`,
        source: source ? source.name : `Unknown(${ev.sourceID})`,
        ability: ability ? ability.name : "Unknown Damage",
        amount,
        absorbed,
        unmitigatedAmount: unmitigated,
        mitigated,
        mitigationPct, // actual % from data
        intendedMitPct, // theoretical % from buffs
        damageType,
        buffs: buffNames, // include parsed buffs
      };
    })
    .filter(Boolean);

  // Log unique types + associated ability names
  const typeSummary = Array.from(typeToNames.entries()).map(
    ([type, names]) => ({
      type,
      abilities: Array.from(names).sort(),
    })
  );

  log.info(`[DamageTaken] Unique ability types for Fight ${fight.id}:`);
  typeSummary.forEach(({ type, abilities }) => {
    log.info(`- Type ${type}: ${abilities.join(", ")}`);
  });
  log.debug(`Fight ${fight.id}: parsed ${parsed.length} damage taken events`);
  return parsed;
}

/**
 * parseFightDamageDone()
 * --------------------------------------------------------------
 * Generic parser for player damage-done events (outgoing damage).
 *
 * Purpose:
 *   Converts raw FFLogs damage-done events into normalized objects
 *   containing essential metadata for analysis and rendering.
 *
 * Structure of raw event (example):
 *   {
 *     timestamp: 2116437,
 *     type: "calculateddamage",
 *     sourceID: 3,
 *     targetID: 61,
 *     abilityGameID: 7384,
 *     amount: 26571,
 *     unmitigatedAmount: 26571,
 *     hitType: 2,
 *     ...
 *   }
 *
 * Returned object fields:
 *   - rawTimestamp: original event timestamp
 *   - relative: timestamp offset from fight start
 *   - source: player name dealing the damage
 *   - target: target name receiving the damage
 *   - ability: name of the damaging ability
 *   - amount: actual damage dealt
 *   - unmitigatedAmount: raw pre-mitigation damage (if available)
 *   - hitType: numeric FFLogs hit type (1=Normal, 2=Crit, 3=Direct, etc.)
 *
 * This parser is lightweight — it intentionally omits mitigation math
 * and buff attribution, as those belong to the damage-taken pipeline.
 *
 * @param {Array} events - Raw damage-done events from FFLogs.
 * @param {Object} fight - Fight metadata (requires startTime/id).
 * @param {Map<number, Object>} actorById - Map of actorID → actor metadata.
 * @param {Map<number, Object>} abilityById - Map of abilityGameID → ability metadata.
 * @returns {Array<Object>} Parsed damage-done events.
 */
export function parseFightDamageDone(events, fight, actorById, abilityById) {
  if (!events || events.length === 0) {
    log.warn(`Fight ${fight.id}: no damage done events returned`);
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
        ability: ability ? ability.name : "Unknown Ability",
        amount: ev.amount ?? 0,
        unmitigatedAmount: ev.unmitigatedAmount ?? ev.amount ?? 0,
        hitType: ev.hitType ?? null,
        type: ev.type ?? null, // retain event type (e.g., "damage", "calculateddamage")
      };
    })
    .filter(Boolean);

  log.debug(
    `Fight ${fight.id}: parsed ${parsed.length} damage done events (outgoing)`
  );
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
 * @param {Map<string, Object>} rowMap - Prebuilt lookup map of fight table rows keyed by `${timestamp}_${actor}`
 */
function applyBuffsToAttacks(
  statusList,
  damageEvents,
  fightTable,
  fight,
  buffAnalysis,
  rowMap
) {
  damageEvents.forEach((ev) => {
    const row = rowMap.get(`${ev.relative}_${ev.actor}`);
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
        const applied = assignLastKnownBuffSource(
          buffName,
          ev,
          statusList,
          row,
          fight
        );
        if (!applied) {
          if (buffAnalysis.isVulnerability(buffName)) {
            // Detected as a vulnerability — log at debug level
            log.debug(
              `Vulnerability buff="${buffName}" on attack=${
                ev.ability
              } at ${formatRelativeTime(
                ev.rawTimestamp,
                fight.startTime
              )} (Fight ${
                fight.id
              }) has no matching buff status (expected for vulns)`
            );
          } else {
            // ⚠️ Still a real buff, warn about missing status
            log.warn(
              `No active status for buff=${buffName} on attack=${ev.ability} ` +
                `at ${formatRelativeTime(ev.rawTimestamp, fight.startTime)} ` +
                `(Fight ${fight.id}). Known statuses: ${statusList
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
        }
      }
    });
  });
}

/**
 * Apply vulnerability statuses to damage events in the FightTable.
 *
 * Matching logic:
 *   - Each damage event corresponds to a target (actor).
 *   - Each vulnerability status entry describes a vuln’s timeline
 *     with { vuln, target, start, end }.
 *   - We only credit a vuln to an event if:
 *       1. The damage event’s actor matches the vuln’s target.
 *       2. The event timestamp falls between the vuln’s start and end.
 *
 * Result:
 *   rows[timestamp].vulns = {
 *     "Magic Vulnerability Up": true,
 *     "Physical Vulnerability Up": true,
 *   }
 *
 * Notes:
 *   - Unlike buffs, vulns are not tied to a source player. They only need to
 *     indicate that the target was vulnerable at the time of the hit.
 *   - If no matching vuln is found but the event was expected to have one,
 *     the function logs a warning for triage.
 *
 * @param {Array} vulnerabilityStatusList - Vulnerability timelines ({ vuln, target, start, end })
 * @param {Array} damageEvents - Parsed damage-taken events
 * @param {Object} fightTable - FightTable being constructed
 * @param {Object} fight - Fight metadata for logging context
 * @param {Map<string, Object>} rowMap - Prebuilt lookup map of fight table rows keyed by `${timestamp}_${actor}`
 */
function applyVulnsToAttacks(
  vulnerabilityStatusList,
  damageEvents,
  fightTable,
  fight,
  rowMap
) {
  damageEvents.forEach((ev) => {
    const row = rowMap.get(`${ev.relative}_${ev.actor}`);
    if (!row) return;

    if (!row.vulns) {
      row.vulns = {};
    }

    // Match all vulnerabilities affecting this actor at this time
    const matches = vulnerabilityStatusList.filter(
      (s) =>
        s.target === ev.actor && // must match same target name
        ev.relative >= s.start &&
        ev.relative <= s.end
    );

    if (matches.length > 0) {
      matches.forEach((m) => {
        row.vulns[m.vuln] = true;
      });
    } else {
      log.debug(
        `No active vuln found for actor=${ev.actor} at ts=${ev.relative} (Fight ${fight.id}). ` +
          `Checked vulns: ${vulnerabilityStatusList
            .filter((s) => s.target === ev.actor)
            .map((s) => `[${s.vuln}: ${s.start}-${s.end}]`)
            .join(", ")}`
      );
    }
  });
}

/**
 * Apply death statuses to damage events in the FightTable.
 *
 * Matching logic:
 *   - Each damage event corresponds to a timestamp.
 *   - Each death status entry describes a timeline with { actor, start, end }.
 *   - For each row, we add ALL actors who are dead at that timestamp.
 *
 * Result:
 *   rows[timestamp].deaths = [ "PlayerA", "PlayerB", ... ]
 *
 * Notes:
 *   - Multiple players can be dead at the same timestamp.
 *   - Death attribution is independent of the event’s actor/target.
 *   - If no deaths are active at that time, the list is empty.
 *
 * @param {Array} deathStatusList - Death timelines ({ actor, start, end })
 * @param {Array} damageEvents - Parsed damage-taken events
 * @param {Object} fightTable - FightTable being constructed
 * @param {Object} fight - Fight metadata for logging context
 * @param {Map<string, Object>} rowMap - Prebuilt lookup map of fight table rows keyed by `${timestamp}_${actor}`
 */
function applyDeathsToAttacks(
  deathStatusList,
  damageEvents,
  fightTable,
  fight,
  rowMap
) {
  damageEvents.forEach((ev) => {
    const row = rowMap.get(`${ev.relative}_${ev.actor}`);
    if (!row) return;

    if (!row.deaths) {
      row.deaths = [];
    }

    // Collect all players who are "dead" at this timestamp
    const matches = deathStatusList.filter(
      (s) => ev.relative >= s.start && ev.relative <= s.end
    );

    row.deaths = matches.map((m) => m.actor);

    log.debug(
      `Row @${formatRelativeTime(ev.rawTimestamp, fight.startTime)} (Fight ${
        fight.id
      }) deaths=[${row.deaths.join(", ")}]`
    );
  });
}

/**
 * Build the final FightTable for a given fight.
 *
 * The FightTable is a structured view of a fight's damage-taken timeline,
 * enriched with mitigation values, buff/debuff sources, and vulnerabilities.
 *
 * Structure:
 *   {
 *     fightId: number,
 *     encounterId: number,
 *     name: string,
 *     castsTimeline: Array<Object>,             // flattened cast events for the fight
 *     availableMitigationTrackers: Array<Object>, // CastCooldownTracker metadata per ability/player
 *     friendlyPlayerIds: [id1, id2, ...],  // only player IDs (no NPCs/pets)
 *     rows: {
 *       [relativeTimestamp: number]: {
 *         source: string,            // attacker name
 *         actor: string,             // target name (player taking damage)
 *         targetID: number|null,     // target actor ID, if available
 *         ability: string,           // attack or damage ability name
 *
 *         // --- Damage & mitigation ---
 *         amount: number,            // actual damage taken (post-mitigation)
 *         absorbed: number,          // absorbed value (e.g. shields)
 *         unmitigatedAmount: number, // estimated damage before mitigation
 *         mitigated: number,         // total damage prevented (unmitigated - amount)
 *         mitigationPct: number,     // actual % mitigated from combat data (derived from damage)
 *         intendedMitPct: number,    // theoretical % mitigated based on buffs + context (predicted)
 *
 *         // --- Status effects ---
 *         buffs: {                   // buffs active on the target at this time
 *           [buffName: string]: [applierNames...] // who applied each buff
 *         },
 *         vulns: {                   // vulnerabilities (debuffs) active on the target
 *           [vulnName: string]: true
 *         },
 *
 *         // --- Other fight context ---
 *         deaths: [string],          // list of all players dead at this timestamp
 *         availableMitigationsByPlayer: Record<string, string[]>, // per-player mitigation availability snapshot
 *       }
 *     }
 *   }
 *
 * Buff attribution:
 *   1. `applyBuffsToAttacks` matches parsed buff/debuff timelines against
 *      each damage event, assigning the known applier(s).
 *   2. `resolveMissingBuffSources` fills in missing/unknown appliers
 *      (e.g. when FFLogs omits source data) using fallback heuristics.
 *
 * Vulnerability attribution:
 *   1. `applyVulnsToAttacks` matches vulnerability timelines against each
 *      damage event, ensuring the damage target matches the vuln’s target.
 *   2. If no matching vuln is found, a debug log is written for triage.
 *   3. Unlike buffs, vulnerabilities are not tied to sources — they simply
 *      indicate that the target was vulnerable at the time of the hit.
 *
 * Enhancements over raw FFLogs events:
 *   - Consumes parsedBuffEvents, parsedVulnerabilityEvents, and parsedDamageTaken
 *     for consistency.
 *   - Rows include mitigation data (`amount`, `unmitigatedAmount`, `mitigated`, `mitigationPct`)
 *     computed once during parsing (renderer does not need to recompute).
 *   - Buff source attribution ensures each buff listed on a damage event
 *     is tied to the correct player(s).
 *   - Vulnerability attribution ensures per-target vulnerability windows
 *     are tracked and reflected on each relevant damage event.
 *   - Includes a flattened cast timeline to keep downstream consumers in sync
 *     with the damage table when building timelines/UI affordances.
 *   - Populates per-row mitigation availability via cast analysis helpers,
 *     storing a map of player → available mitigations along with tracker metadata.
 *
 * @param {Array} damageEvents - Parsed damage-taken events (from parseFightDamageTaken)
 * @param {Array} parsedBuffs - Parsed buff/debuff events (from parseBuffEvents)
 * @param {Array} parsedVulnerabilities - Parsed vulnerabilities/debuffs on friendlies
 * @param {Array} parsedDeaths - Parsed death events (from parseFightDeaths)
 * @param {Array} parsedCasts - Parsed cast events (from parseFightCasts)
 * @param {Object} fight - Fight metadata (id, encounterID, name, startTime, friendlyPlayers)
 * @param {Map} actorById - Map of actorID → actor metadata
 * @returns {Object} FightTable
 */
export function buildFightTable(
  damageEvents,
  parsedBuffs,
  parsedVulnerabilities,
  parsedDeaths,
  parsedCasts,
  fight,
  actorById,
  buffAnalysis
) {
  const statusList = buildStatusList(parsedBuffs, fight);
  const vulnerabilityStatusList = buildVulnerabilityList(
    parsedVulnerabilities,
    fight,
    buffAnalysis
  );
  const deathStatusList = buildDeathStatusList(parsedDeaths, statusList, fight);

  // 🔎 For development: log the death status list
  log.info(
    `Fight ${fight.id}: built ${deathStatusList.length} death statuses`,
    deathStatusList
  );

  const table = {
    fightId: fight.id,
    encounterId: fight.encounterID,
    name: fight.name,
    rows: [],
    castsTimeline: parsedCasts ?? [], // Flattened cast events aligned with this fight
    availableMitigationTrackers: [], // mitigation cooldown metadata per ability/player
    // Instead of duplicating actor metadata, only keep friendly player IDs
    friendlyPlayerIds: fight.friendlyPlayers || [],
  };

  // Populate rows from damage events
  damageEvents.forEach((ev) => {
    table.rows.push({
      timestamp: ev.relative,
      source: ev.source,
      actor: ev.actor, // target actor name
      targetID: ev.targetID ?? null, // optional: add ID for safer matching
      ability: ev.ability,
      amount: ev.amount,
      absorbed: ev.absorbed,
      unmitigatedAmount: ev.unmitigatedAmount,
      mitigated: ev.mitigated,
      mitigationPct: ev.mitigationPct,
      intendedMitPct: ev.intendedMitPct, // theoretical % from buffs
      damageType: ev.damageType,
      buffs: {},
      vulns: {}, // active vulnerabilities (per-target, no sources)
      deaths: [], // all players dead at this timestamp
      availableMitigationsByPlayer: {}, // per-player mitigation availability snapshot
    });

    const newRow = table.rows[table.rows.length - 1];
    ev.buffs.forEach((buffName) => {
      if (!newRow.buffs[buffName]) {
        newRow.buffs[buffName] = [];
      }
    });
  });

  // Sort rows by timestamp (just to guarantee chronological order)
  table.rows.sort(
    (a, b) => a.timestamp - b.timestamp || a.actor.localeCompare(b.actor)
  );

  // Build one shared lookup map for efficient row access
  // Prebuild a quick lookup map: key = `${timestamp}_${actor}`
  // ⚡ Optimization: `fightTable.rows` is now an array, not keyed by timestamp.
  // Build a lookup map once per call to avoid O(n²) .find() scans.
  const rowMap = new Map();
  for (const row of table.rows) {
    rowMap.set(`${row.timestamp}_${row.actor}`, row);
  }

  // Populate mitigation availability using cast-derived cooldown data
  populateMitigationAvailability(table, parsedCasts, actorById, fight);

  // Fill in applier names based on buff timelines
  applyBuffsToAttacks(
    statusList,
    damageEvents,
    table,
    fight,
    buffAnalysis,
    rowMap
  );

  // Fill in vulnerabilities based on target timelines
  applyVulnsToAttacks(
    vulnerabilityStatusList,
    damageEvents,
    table,
    fight,
    rowMap
  );

  // Fill in deaths based on death timelines
  applyDeathsToAttacks(deathStatusList, damageEvents, table, fight, rowMap);

  // ✅ Final pass: replace null/unknown appliers with all players in this fight
  buffAnalysis.resolveMissingBuffSources(table, actorById, fight);

  return table;
}

/**
 * Parse raw death events into normalized objects.
 *
 * Each death event includes:
 *   - rawTimestamp: original event timestamp
 *   - relative: timestamp offset from fight start
 *   - actor: name of the target who died
 *   - source: name of the killer (if available)
 *   - ability: killing ability name (if available)
 *   - abilityGameID: raw FFLogs ability ID
 *
 * @param {Array} events - Raw death events from FFLogs
 * @param {Object} fight - Fight metadata (must include startTime, id)
 * @param {Map} actorById - Map of actorID → actor metadata
 * @param {Map} abilityById - Map of abilityGameID → ability metadata
 * @returns {Array} parsed - Array of normalized death events
 */
export function parseFightDeaths(events, fight, actorById, abilityById) {
  if (!events || events.length === 0) {
    log.warn(`Fight ${fight.id}: no death events returned`);
    return [];
  }

  const parsed = events
    .map((ev) => {
      const actor = actorById.get(ev.targetID);
      const source = actorById.get(ev.sourceID);
      const ability = abilityById.get(ev.abilityGameID);

      return {
        rawTimestamp: ev.timestamp,
        relative: ev.timestamp - fight.startTime,
        actor: actor ? actor.name : `Unknown(${ev.targetID})`,
        source: source ? source.name : `Unknown(${ev.sourceID})`,
        ability: ability ? ability.name : "Unknown Ability",
        abilityGameID: ev.abilityGameID,
      };
    })
    .filter(Boolean);

  log.debug(`Fight ${fight.id}: parsed ${parsed.length} death events`);
  return parsed;
}

/**
 * Parse raw cast events into a single, chronologically sorted timeline.
 *
 * Each cast is enriched with human-friendly source/target names, the ability name,
 * and relative timing information derived from the fight start time. The resulting
 * array makes it simple to show a unified log of spell usage across all players
 * without additional grouping logic.
 *
 * Returned event shape (ordered by `rawTimestamp` ascending):
 * [
 *   {
 *     rawTimestamp: 2295155,          // Absolute timestamp from FFLogs
 *     relative: 9155,                 // Offset from fight.startTime
 *     source: "PlayerA",              // Casting actor name or fallback
 *     target: "EnemyB",               // Target actor name or fallback
 *     ability: "Glare III",           // Resolved ability name or "Unknown Ability"
 *     abilityGameID: 24316,           // Raw ability identifier
 *     type: "cast",                   // Original event type (cast, beginsCast, etc.)
 *   },
 *   ...
 * ]
 *
 * Notes:
 *   - Missing actors are labelled as `Unknown(<id>)` to aid debugging.
 *   - Sorting happens after normalization so downstream consumers can assume
 *     increasing timestamps when iterating the array.
 *
 * @param {Array} events - Raw cast events from FFLogs
 * @param {Object} fight - Fight metadata (must include startTime, id)
 * @param {Map<number, Object>} actorById - Map of actorID → actor metadata
 * @param {Map<number, Object>} abilityById - Map of abilityGameID → ability metadata
 * @returns {Array<Object>} casts - Flattened list of casts sorted by timestamp
 */
export function parseFightCasts(events, fight, actorById, abilityById) {
  if (!events || events.length === 0) {
    log.warn(`Fight ${fight.id}: no cast events returned`);
    return [];
  }

  const casts = events.map((ev) => {
    const source = actorById.get(ev.sourceID);
    const target = actorById.get(ev.targetID);
    const ability = abilityById.get(ev.abilityGameID);

    return {
      rawTimestamp: ev.timestamp,
      relative: ev.timestamp - fight.startTime,
      source: source ? source.name : `Unknown(${ev.sourceID})`,
      target: target ? target.name : `Unknown(${ev.targetID})`,
      ability: ability ? ability.name : "Unknown Ability",
      abilityGameID: ev.abilityGameID,
      type: ev.type,
    };
  });

  casts.sort((a, b) => a.rawTimestamp - b.rawTimestamp);

  log.debug(
    `Fight ${fight.id}: parsed ${casts.length} cast events into a flattened timeline`
  );

  return casts;
}
