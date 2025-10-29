import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";

setModuleLogLevel("FFLogsApi", envLogLevel("info", "warn"));
const log = getLogger("FFLogsApi");

/**
 * FFLogs GraphQL ENUM for hostilityType.
 * ⚠️ Important: Must use ENUM values, NOT integers.
 */
export const HostilityType = Object.freeze({
  FRIENDLIES: "Friendlies",
  ENEMIES: "Enemies",
});

/**
 * FFLogs GraphQL ENUM for EventDataType.
 * ⚠️ Important: Must use ENUM values, NOT strings or integers.
 *
 * Usage:
 * - These values are passed directly in GraphQL queries (without quotes).
 * - See: Report.events query.
 */
export const EventDataType = Object.freeze({
  ALL: "All",
  BUFFS: "Buffs",
  CASTS: "Casts",
  COMBATANT_INFO: "CombatantInfo",
  DAMAGE_DONE: "DamageDone",
  DAMAGE_TAKEN: "DamageTaken",
  DEATHS: "Deaths",
  DEBUFFS: "Debuffs",
  DISPELS: "Dispels",
  HEALING: "Healing",
  INTERRUPTS: "Interrupts",
  RESOURCES: "Resources",
  SUMMONS: "Summons",
  THREAT: "Threat",
});

export async function fetchReport(accessToken, reportCode) {
  log.info("Fetching report metadata", reportCode);

  const query = `{
    reportData {
      report(code: "${reportCode}") {
        title
        fights {
          id
          encounterID
          name
          startTime
          endTime
          friendlyPlayers
          enemyNPCs {
            id
            gameID
            instanceCount
            groupCount
            petOwner
          }
        }
        masterData {
          actors {
            id
            name
            type
            subType
            server
          }
          abilities {
            gameID
            name
            icon
            type
          }
        }
      }
    }
  }`;

  const gqlRes = await fetch("https://www.fflogs.com/api/v2/user", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!gqlRes.ok) {
    log.error("GraphQL fetch failed", gqlRes.status, gqlRes.statusText);
  }

  const data = await gqlRes.json();
  log.debug("GraphQL report response", data);
  return data;
}

/**
 * Format GraphQL option values.
 *
 * ⚠️ Important: hostilityType must use ENUM values, not integers or quoted strings.
 * Valid values: Friendlies, Enemies.
 */
function formatOption(key, value) {
  if (key === "hostilityType") {
    if (value !== "Friendlies" && value !== "Enemies") {
      throw new Error(
        `Invalid hostilityType: ${value}. Must be 'Friendlies' or 'Enemies'.`
      );
    }
    return `hostilityType: ${value}`; // enum, no quotes
  }

  return `${key}: ${JSON.stringify(value)}`; // ensure proper quoting for strings
}

/**
 * Fetches events from the FFLogs API with automatic pagination support.
 *
 * This function queries the `reportData.report.events` GraphQL endpoint for a specific fight,
 * handling page-by-page retrieval until all events are collected. It supports filtering by
 * `EventDataType` and any combination of other query arguments documented in the FFLogs schema.
 *
 * @param {string} accessToken - OAuth2 access token for the FFLogs API.
 * @param {string} reportCode - The unique code identifying the FFLogs report.
 * @param {Object} fight - Fight metadata object, containing at least `id`, `startTime`, and `endTime`.
 * @param {string} dataType - One of the `EventDataType` ENUM values (e.g. EventDataType.CASTS).
 *                            ⚠️ Must be an unquoted ENUM constant, not an arbitrary string.
 * @param {Object} [extraOptions={}] - Additional GraphQL query arguments for filtering events.
 *                                     See FFLogs `events` schema for full list. Examples:
 *   - abilityID {number} — Only include events from a specific ability.
 *   - hostilityType {HostilityType} — Filter by friendlies/enemies (ENUM, no quotes).
 *   - sourceID {number} / targetID {number} — Restrict to a specific actor.
 *   - filterExpression {string} — Custom FFLogs filter language.
 *   - includeResources {boolean} — Whether to include detailed resource data.
 *   - limit {number} — Number of events per page (100–10000, default 300).
 *
 * @returns {Promise<Array>} Resolves to an array of all fetched event objects.
 *
 * @example
 * const casts = await fetchEventsPaginated(
 *   token,
 *   "abc123XYZ",
 *   fight,
 *   EventDataType.CASTS,
 *   { hostilityType: HostilityType.ENEMIES }
 * );
 */
async function fetchEventsPaginated(
  accessToken,
  reportCode,
  fight,
  dataType = EventDataType.CASTS,
  extraOptions = {}
) {
  let allEvents = [];
  let nextPageTimestamp = fight.startTime;
  let page = 1;

  log.info(
    `Fight ${fight.id}: fetching ${dataType} events (time ${
      fight.startTime
    } → ${fight.endTime}, options=${JSON.stringify(extraOptions)})`
  );

  while (true) {
    log.debug(
      `Fight ${
        fight.id
      } ${dataType} page ${page} (time ${nextPageTimestamp} → ${
        fight.endTime
      }, options=${JSON.stringify(extraOptions)})`
    );

    const optionsStr = Object.entries(extraOptions)
      .map(([k, v]) => formatOption(k, v))
      .join(", ");

    const query = `{
      reportData {
        report(code: "${reportCode}") {
          events(
            fightIDs: [${fight.id}],
            dataType: ${dataType},
            startTime: ${nextPageTimestamp},
            endTime: ${fight.endTime},
            limit: 1000
            ${optionsStr}
          ) {
            data
            nextPageTimestamp
          }
        }
      }
    }`;

    const gqlRes = await fetch("https://www.fflogs.com/api/v2/user", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!gqlRes.ok) {
      throw new Error(
        `GraphQL fetch failed: ${gqlRes.status} ${gqlRes.statusText}`
      );
    }

    const json = await gqlRes.json();
    const eventsObj = json?.data?.reportData?.report?.events;

    if (!eventsObj) {
      log.warn(
        `No ${dataType} events returned for fight ${fight.id} on page ${page}`
      );
      break;
    }

    log.debug(
      `Fight ${fight.id} ${dataType} page ${page}: got ${
        eventsObj.data.length
      } events, nextPageTimestamp=${eventsObj.nextPageTimestamp ?? "null"}`
    );

    allEvents.push(...eventsObj.data);

    if (eventsObj.nextPageTimestamp) {
      nextPageTimestamp = eventsObj.nextPageTimestamp;
      page++;
    } else {
      log.info(
        `Fight ${fight.id}: fetched ${allEvents.length} ${dataType} events across ${page} page(s)`
      );
      break;
    }
  }

  return allEvents;
}
/**
 * Fetch cast events for a fight.
 *
 * Queries the FFLogs API for all `Casts` events within the fight duration.
 * This includes every ability cast attempt by actors (players, NPCs, pets).
 *
 * @param {string} accessToken - OAuth2 access token for the FFLogs API.
 * @param {string} reportCode - Unique FFLogs report code.
 * @param {Object} fight - Fight metadata (requires `id`, `startTime`, `endTime`).
 * @returns {Promise<Array>} Resolves to an array of cast event objects.
 */
export async function fetchFightCasts(accessToken, reportCode, fight) {
  return await fetchEventsPaginated(
    accessToken,
    reportCode,
    fight,
    EventDataType.CASTS
  );
}

/**
 * Fetch damage taken events for a fight.
 *
 * Queries the FFLogs API for all `DamageTaken` events and filters to
 * only include `damage`-type events (ignoring absorbed, mitigated, or
 * non-damage subtypes).
 *
 * @param {string} accessToken - OAuth2 access token for the FFLogs API.
 * @param {string} reportCode - Unique FFLogs report code.
 * @param {Object} fight - Fight metadata (requires `id`, `startTime`, `endTime`).
 * @returns {Promise<Array>} Resolves to an array of damage event objects.
 */
export async function fetchFightDamageTaken(accessToken, reportCode, fight) {
  const events = await fetchEventsPaginated(
    accessToken,
    reportCode,
    fight,
    EventDataType.DAMAGE_TAKEN,
    { includeResources: true }
  );
  return events.filter((ev) => ev.type === "damage");
}

/**
 * Fetch buff events for a fight.
 *
 * Queries the FFLogs API for all `Buffs` events applied or removed during the fight.
 * These include player and NPC buff applications, refreshes, and expirations.
 *
 * @param {string} accessToken - OAuth2 access token for the FFLogs API.
 * @param {string} reportCode - Unique FFLogs report code.
 * @param {Object} fight - Fight metadata (requires `id`, `startTime`, `endTime`).
 * @returns {Promise<Array>} Resolves to an array of buff event objects.
 */
export async function fetchFightBuffs(accessToken, reportCode, fight) {
  return await fetchEventsPaginated(
    accessToken,
    reportCode,
    fight,
    EventDataType.BUFFS
  );
}

/**
 * Fetch debuff events for a fight.
 *
 * Queries the FFLogs API for all `Debuffs` events applied or removed during the fight.
 * Debuffs can be filtered by hostility (friendlies vs enemies).
 *
 * @param {string} accessToken - OAuth2 access token for the FFLogs API.
 * @param {string} reportCode - Unique FFLogs report code.
 * @param {Object} fight - Fight metadata (requires `id`, `startTime`, `endTime`).
 * @param {string} hostilityType - One of the `HostilityType` ENUM values
 *                                 (HostilityType.FRIENDLIES or HostilityType.ENEMIES).
 *                                 Defaults to `HostilityType.ENEMIES`.
 * @returns {Promise<Array>} Resolves to an array of debuff event objects.
 *
 * @example
 * const debuffsOnEnemies = await fetchFightDebuffs(
 *   token,
 *   "abc123XYZ",
 *   fight,
 *   HostilityType.ENEMIES
 * );
 */
export async function fetchFightDebuffs(
  accessToken,
  reportCode,
  fight,
  hostilityType = HostilityType.ENEMIES
) {
  const extraOptions = {};
  if (hostilityType) {
    extraOptions.hostilityType = hostilityType; // must be ENUM
  }

  return await fetchEventsPaginated(
    accessToken,
    reportCode,
    fight,
    EventDataType.DEBUFFS,
    extraOptions
  );
}

/**
 * Fetch death events for a fight.
 *
 * Queries the FFLogs API for all `Deaths` events within the fight duration.
 * These include player and NPC deaths with timestamp and actor info.
 *
 * @param {string} accessToken - OAuth2 access token for the FFLogs API.
 * @param {string} reportCode - Unique FFLogs report code.
 * @param {Object} fight - Fight metadata (requires `id`, `startTime`, `endTime`).
 * @returns {Promise<Array>} Resolves to an array of death event objects.
 */
export async function fetchFightDeaths(accessToken, reportCode, fight) {
  return await fetchEventsPaginated(
    accessToken,
    reportCode,
    fight,
    EventDataType.DEATHS
  );
}

/**
 * Fetch damage done events for a specific player in a fight.
 *
 * Queries the FFLogs API for all `DamageDone` events within the fight duration,
 * filtered to only include events from a specified player's actor ID.
 *
 * 💡 Usage Notes:
 * - The `sourceID` argument must correspond to the player's unique actor ID
 *   as provided in the `masterData.actors` section of the report metadata.
 * - `hostilityType` must use the ENUM values from `HostilityType` (e.g. Friendlies or Enemies),
 *   and is unquoted in GraphQL queries (see `formatOption()` for ENUM handling).
 *
 * @param {string} accessToken - OAuth2 access token for the FFLogs API.
 * @param {string} reportCode - Unique FFLogs report code.
 * @param {Object} fight - Fight metadata (requires `id`, `startTime`, and `endTime`).
 * @param {number} playerSourceId - The actor ID for the player whose damage data should be fetched.
 * @param {string} [hostilityType=HostilityType.FRIENDLIES] - The hostility filter ENUM (default: Friendlies).
 * @returns {Promise<Array>} Resolves to an array of damage event objects for the specified player.
 *
 * @example
 * const playerDamage = await fetchPlayerDamage(
 *   token,
 *   "abc123XYZ",
 *   fight,
 *   42, // Player's actor ID
 *   HostilityType.FRIENDLIES
 * );
 */
export async function fetchPlayerDamage(
  accessToken,
  reportCode,
  fight,
  playerSourceId,
  hostilityType = HostilityType.FRIENDLIES
) {
  if (!playerSourceId || typeof playerSourceId !== "number") {
    throw new Error(
      "fetchPlayerDamage requires a valid numeric playerSourceId."
    );
  }

  const extraOptions = {
    hostilityType, // ENUM value: Friendlies or Enemies
    sourceID: playerSourceId, // Filter to this specific actor
    includeResources: true, // Include MP/TP/HP changes for context
  };

  // Delegate pagination and retrieval to the shared helper
  const events = await fetchEventsPaginated(
    accessToken,
    reportCode,
    fight,
    EventDataType.DAMAGE_DONE,
    extraOptions
  );

  return events;
}
