import { getLogger, setModuleLogLevel } from "../utility/logger.js";

setModuleLogLevel("FFLogsApi", "info");
const log = getLogger("FFLogsApi");

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
        }
        masterData {
          actors(type: "Player") {
            id
            name
            type
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
 * Generic event fetcher with pagination
 */
async function fetchEventsPaginated(
  accessToken,
  reportCode,
  fight,
  dataType = "Casts"
) {
  let allEvents = [];
  let nextPageTimestamp = fight.startTime;
  let page = 1;

  log.info(
    `Fight ${fight.id}: fetching ${dataType} events (time ${fight.startTime} → ${fight.endTime})`
  );

  while (true) {
    log.debug(
      `Fight ${fight.id} ${dataType} page ${page} (time ${nextPageTimestamp} → ${fight.endTime})`
    );

    const query = `{
      reportData {
        report(code: "${reportCode}") {
          events(
            fightIDs: [${fight.id}],
            dataType: ${dataType},
            startTime: ${nextPageTimestamp},
            endTime: ${fight.endTime},
            limit: 1000
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
