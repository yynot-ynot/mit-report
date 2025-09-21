import { getLogger, setModuleLogLevel } from "../utility/logger.js";

setModuleLogLevel("FFLogsApi", "debug");
const log = getLogger("FFLogsApi");

/**
 * FFLogs GraphQL ENUM for hostilityType.
 * ⚠️ Important: Must use ENUM values, NOT integers.
 */
export const HostilityType = Object.freeze({
  FRIENDLIES: "Friendlies",
  ENEMIES: "Enemies",
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
 * Generic event fetcher with pagination
 */
async function fetchEventsPaginated(
  accessToken,
  reportCode,
  fight,
  dataType = "Casts",
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

export async function fetchFightCasts(accessToken, reportCode, fight) {
  return await fetchEventsPaginated(accessToken, reportCode, fight, "Casts");
}

export async function fetchFightDamageTaken(accessToken, reportCode, fight) {
  const events = await fetchEventsPaginated(
    accessToken,
    reportCode,
    fight,
    "DamageTaken"
  );
  return events.filter((ev) => ev.type === "damage");
}

export async function fetchFightBuffs(accessToken, reportCode, fight) {
  return await fetchEventsPaginated(accessToken, reportCode, fight, "Buffs");
}

/**
 * Fetch debuff events for a fight.
 *
 * @param {string} accessToken - OAuth token
 * @param {string} reportCode - Report code
 * @param {Object} fight - Fight metadata
 * @param {string} hostilityType - (ENUM) Friendlies or Enemies. Defaults to Enemies.
 * ⚠️ Important: Do NOT use integers (0/1). Must be the ENUM values.
 */
export async function fetchFightDebuffs(
  accessToken,
  reportCode,
  fight,
  hostilityType = HostilityType.ENEMIES // Default: Enemies
) {
  const extraOptions = {};
  if (hostilityType) {
    extraOptions.hostilityType = hostilityType; // ENUM only
  }

  return await fetchEventsPaginated(
    accessToken,
    reportCode,
    fight,
    "Debuffs",
    extraOptions
  );
}

export async function fetchFightDamageDone(
  accessToken,
  reportCode,
  fight,
  hostilityType = 0 // 0 = Friendlies, 1 = Enemies
) {
  return await fetchEventsPaginated(
    accessToken,
    reportCode,
    fight,
    "DamageDone",
    {
      hostilityType,
    }
  );
}
