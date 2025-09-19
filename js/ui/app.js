import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import {
  fetchReport,
  fetchFightDamageTaken,
  fetchFightBuffs,
  fetchFightDebuffs,
} from "../data/fflogsApi.js";
import {
  parseReport,
  parseFightDamageTaken,
  parseBuffEvents,
  normalizeFightTable,
} from "../data/reportParser.js";
import { renderReport } from "./reportRenderer.js";
import { initializeAuth, ensureLogin } from "./authManager.js";

setModuleLogLevel("App", "info");
const log = getLogger("App");

document.addEventListener("DOMContentLoaded", async () => {
  let accessToken = null;
  let loadingInterval;

  const statusEl = document.getElementById("login-status");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const outputEl = document.getElementById("output");
  const urlInput = document.getElementById("reportUrl");

  function startLoadingMessage() {
    let dotCount = 0;
    clearInterval(loadingInterval);

    loadingInterval = setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      outputEl.textContent = "Analyzing report" + ".".repeat(dotCount);
    }, 500);
  }

  function stopLoadingMessage(message) {
    clearInterval(loadingInterval);
    if (message) {
      outputEl.textContent = message;
    }
  }

  async function analyze(url) {
    const match = url.match(/reports\/([a-zA-Z0-9]+)/);
    if (!match) {
      outputEl.textContent = "Invalid report URL.";
      log.error("Invalid report URL", url);
      return;
    }
    const reportCode = match[1];

    if (!(await ensureLogin(accessToken, url))) return;

    startLoadingMessage();

    try {
      log.info("Analyzing report", reportCode);
      const gqlData = await fetchReport(accessToken, reportCode);
      const report = parseReport(gqlData);

      if (!report) {
        stopLoadingMessage("Failed to parse report.");
        return;
      }

      const fightsWithTables = [];
      for (const f of report.fights) {
        // Buffs & Debuffs for logging (not yet tied into FightTable)
        const buffs = await fetchFightBuffs(accessToken, reportCode, f);
        log.info(`Fight ${f.id}: raw Buffs fetched`, buffs);
        const debuffs = await fetchFightDebuffs(accessToken, reportCode, f);
        log.info(`Fight ${f.id}: raw Debuffs fetched`, debuffs);
        const parsedBuffs = parseBuffEvents(
          buffs,
          f,
          report.actorById,
          report.abilityById
        );
        const parsedDebuffs = parseBuffEvents(
          debuffs,
          f,
          report.actorById,
          report.abilityById
        );
        log.info(
          `Fight ${f.id}: Buffs=${parsedBuffs.length}, Debuffs=${parsedDebuffs.length}`
        );

        // Damage Taken
        const damageTaken = await fetchFightDamageTaken(
          accessToken,
          reportCode,
          f
        );
        const enrichedDamage = parseFightDamageTaken(
          damageTaken,
          f,
          report.actorById,
          report.abilityById
        );

        // Normalize into FightTable
        const fightTable = normalizeFightTable(
          enrichedDamage,
          f,
          report.actorById
        );

        fightsWithTables.push(fightTable);
      }

      stopLoadingMessage("");
      renderReport(outputEl, report, fightsWithTables);
    } catch (err) {
      log.error("Error analyzing report", err);
      stopLoadingMessage("Failed to analyze report.");
    }
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
