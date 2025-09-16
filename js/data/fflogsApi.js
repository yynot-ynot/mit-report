import { getLogger, setModuleLogLevel } from "../utility/logger.js";

setModuleLogLevel("FFLogsApi", "debug"); // adjust level as needed
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
        startTime
        endTime
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

window.FFLogsApi = { fetchReport };
