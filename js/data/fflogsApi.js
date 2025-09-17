import { getLogger, setModuleLogLevel } from "../utility/logger.js";

setModuleLogLevel("FFLogsApi", "debug");
const log = getLogger("FFLogsApi");

export async function fetchReport(accessToken, reportCode) {
  log.info("Fetching report", reportCode);

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
  log.debug("GraphQL response", data);
  return data;
}

export async function fetchFightCasts(accessToken, reportCode, fightID) {
  log.info("Fetching casts for fight", reportCode, fightID);

  const query = `{
    reportData {
      report(code: "${reportCode}") {
        events(fightIDs: [${fightID}], dataType: Casts, limit: 1000) {
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
    log.error("GraphQL fetch failed", gqlRes.status, gqlRes.statusText);
  }

  const data = await gqlRes.json();
  log.debug("GraphQL fight casts response", data);
  return data;
}

window.FFLogsApi = { fetchReport, fetchFightCasts };
