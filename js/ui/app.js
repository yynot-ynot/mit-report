import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import { startLogin, exchangeCode } from "../utility/fflogsAuth.js";
import { fetchReport } from "../data/fflogsApi.js";

setModuleLogLevel("App", "debug");
const log = getLogger("App");

document.addEventListener("DOMContentLoaded", async () => {
  let accessToken = null;
  const statusEl = document.getElementById("login-status");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const outputEl = document.getElementById("output");
  const urlInput = document.getElementById("reportUrl");

  async function analyze(url) {
    const match = url.match(/reports\/([a-zA-Z0-9]+)/);
    if (!match) {
      outputEl.textContent = "Invalid report URL.";
      log.error("Invalid report URL provided", url);
      return;
    }

    if (!accessToken) {
      log.info("No token, redirecting user to FFLogs login");
      localStorage.setItem("pending_report_url", url);
      await startLogin();
      return;
    }

    log.info("Analyzing report", match[1]);
    const gqlData = await fetchReport(accessToken, match[1]);
    log.debug("GraphQL raw response", gqlData);

    if (gqlData?.data?.reportData?.report?.fights) {
      const fights = gqlData.data.reportData.report.fights;
      outputEl.innerHTML = `
        <h3>${gqlData.data.reportData.report.title}</h3>
        <ul>
          ${fights
            .map(
              (f) =>
                `<li>Encounter ID: ${f.encounterID} (Fight ID: ${f.id})</li>`
            )
            .join("")}
        </ul>
      `;
      log.debug("Rendered fights", fights);
    } else if (gqlData?.errors) {
      outputEl.innerHTML = `<p style="color:red;">⚠️ GraphQL error: ${gqlData.errors[0].message}</p>`;
      log.warn("GraphQL error response", gqlData.errors);
    } else {
      outputEl.textContent = JSON.stringify(gqlData, null, 2);
      log.warn("Unexpected GraphQL response", gqlData);
    }
  }

  // Handle redirect with code
  const data = await exchangeCode();
  if (data?.access_token) {
    accessToken = data.access_token;
    analyzeBtn.textContent = "Analyze";
    statusEl.textContent = "✅ Logged in to FFLogs";
    log.info("Access token acquired");

    // Clean up ?code=... from the URL after successful exchange
    if (window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    const savedUrl = localStorage.getItem("pending_report_url");
    if (savedUrl) {
      urlInput.value = savedUrl;
      localStorage.removeItem("pending_report_url");
      log.info("Restored report URL from storage and auto-analyzing");
      await analyze(savedUrl); // call directly, not analyzeBtn.click()
    }
  } else {
    analyzeBtn.textContent = "Login & Analyze";
    log.warn("No access token found, user must log in first");
  }

  analyzeBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    await analyze(url);
  });
});
