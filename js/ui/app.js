import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import { fetchReport, fetchFightCasts } from "../data/fflogsApi.js";
import { parseReport, parseFightEvents } from "../data/reportParser.js";
import { renderReport } from "./reportRenderer.js";
import { initializeAuth, ensureLogin } from "./authManager.js";

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
      log.error("Invalid report URL", url);
      return;
    }
    const reportCode = match[1];

    if (!(await ensureLogin(accessToken, url))) return;

    log.info("Analyzing report", reportCode);
    const gqlData = await fetchReport(accessToken, reportCode);
    const report = parseReport(gqlData);

    if (!report) {
      outputEl.textContent = "Failed to parse report.";
      return;
    }

    const fightsWithEvents = [];
    for (const f of report.fights) {
      const castsData = await fetchFightCasts(accessToken, reportCode, f.id);
      const events = castsData?.data?.reportData?.report?.events?.data || [];
      const enrichedEvents = parseFightEvents(
        events,
        f,
        report.actorById,
        report.abilityById
      );

      fightsWithEvents.push({ ...f, events: enrichedEvents });
    }

    renderReport(outputEl, report, fightsWithEvents);
  }

  accessToken = await initializeAuth(
    statusEl,
    analyzeBtn,
    urlInput,
    async (token, url) => {
      accessToken = token;
      await analyze(url);
    }
  );

  analyzeBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    await analyze(url);
  });
});
