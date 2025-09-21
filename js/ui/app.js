import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import {
  fetchReport,
  fetchFightDamageTaken,
  fetchFightBuffs,
  fetchFightDebuffs,
  HostilityType,
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
      log.info("GraphQL raw report response", gqlData);

      const report = parseReport(gqlData);
      if (!report) {
        stopLoadingMessage("Failed to parse report.");
        return;
      }

      // Cache fight tables so we only fetch once per fight
      const fightTableCache = new Map();

      async function loadFightTable(pull) {
        if (fightTableCache.has(pull.id)) {
          return fightTableCache.get(pull.id);
        }

        log.info(`Loading fight table for Fight ${pull.id} (${pull.name})`);

        // Fetch buffs/debuffs
        const buffs = await fetchFightBuffs(accessToken, reportCode, pull);
        log.info(`Pull ${pull.id}: raw Buffs fetched`, buffs);

        const debuffsEnemies = await fetchFightDebuffs(
          accessToken,
          reportCode,
          pull,
          HostilityType.ENEMIES
        );
        log.info(
          `Pull ${pull.id}: raw Debuffs (enemies) fetched`,
          debuffsEnemies
        );

        const allStatusEvents = [...buffs, ...debuffsEnemies];
        const parsedBuffs = parseBuffEvents(
          allStatusEvents,
          pull,
          report.actorById,
          report.abilityById
        );
        log.info(`Pull ${pull.id}: parsed Buffs/Debuffs`, parsedBuffs);

        // Fetch damage taken
        const damageTaken = await fetchFightDamageTaken(
          accessToken,
          reportCode,
          pull
        );
        log.info(`Pull ${pull.id}: raw DamageTaken fetched`, damageTaken);

        const parsedDamageTaken = parseFightDamageTaken(
          damageTaken,
          pull,
          report.actorById,
          report.abilityById
        );
        log.info(`Pull ${pull.id}: parsed DamageTaken`, parsedDamageTaken);

        // Build fight table
        const fightTable = buildFightTable(
          parsedDamageTaken,
          allStatusEvents,
          pull,
          report.actorById,
          report.abilityById
        );

        fightTableCache.set(pull.id, fightTable);
        return fightTable;
      }

      stopLoadingMessage("");

      // Render UI with fights metadata; loadFightTable called on user click
      renderReport(outputEl, report, loadFightTable);
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
