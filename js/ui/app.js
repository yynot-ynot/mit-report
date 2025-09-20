import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import {
  fetchReport,
  fetchFightDamageTaken,
  fetchFightBuffs,
  fetchFightDebuffs,
  fetchFightDamageDone,
} from "../data/fflogsApi.js";
import {
  parseReport,
  parseFightDamageTaken,
  parseBuffEvents,
  buildFightTable,
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
        const buffs = await fetchFightBuffs(accessToken, reportCode, f);
        log.info(`Fight ${f.id}: raw Buffs fetched`, buffs);

        const debuffsEnemies = await fetchFightDebuffs(
          accessToken,
          reportCode,
          f,
          1
        );
        log.info(
          `Fight ${f.id}: raw Debuffs (enemies) fetched`,
          debuffsEnemies
        );

        // ✅ Merge buffs + debuffs for tracking
        const allStatusEvents = [...buffs, ...debuffsEnemies];

        const parsedBuffs = parseBuffEvents(
          allStatusEvents,
          f,
          report.actorById,
          report.abilityById
        );
        log.info(
          `Fight ${f.id}: parsed ${parsedBuffs.length} buff/debuff events`
        );

        const damageTaken = await fetchFightDamageTaken(
          accessToken,
          reportCode,
          f
        );
        log.info(`Fight ${f.id}: raw DamageTaken fetched`, damageTaken);

        const parsedDamageTaken = parseFightDamageTaken(
          damageTaken,
          f,
          report.actorById,
          report.abilityById
        );
        log.info(`Fight ${f.id}: parsed DamageTaken`, parsedDamageTaken);

        const fightTable = buildFightTable(
          parsedDamageTaken,
          allStatusEvents,
          f,
          report.actorById,
          report.abilityById
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
