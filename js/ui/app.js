import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import {
  fetchReport,
  fetchFightDamageTaken,
  fetchFightDeaths,
  fetchFightBuffs,
  fetchFightDebuffs,
  HostilityType,
} from "../data/fflogsApi.js";
import {
  parseReport,
  parseFightDamageTaken,
  parseFightDeaths,
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

  // Grab UI elements
  const statusEl = document.getElementById("login-status");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const outputEl = document.getElementById("output");
  const urlInput = document.getElementById("reportUrl");

  // Show "Analyzing..." animation while processing report
  function startLoadingMessage() {
    let dotCount = 0;
    clearInterval(loadingInterval);
    loadingInterval = setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      outputEl.textContent = "Analyzing report" + ".".repeat(dotCount);
    }, 500);
  }

  // Stop loading message, optionally replace with final message
  function stopLoadingMessage(message) {
    clearInterval(loadingInterval);
    if (message) {
      outputEl.textContent = message;
    }
  }

  // Main analysis pipeline
  async function analyze(url) {
    // Extract FFLogs report code from URL
    const match = url.match(/reports\/([a-zA-Z0-9]+)/);
    if (!match) {
      outputEl.textContent = "Invalid report URL.";
      log.error("Invalid report URL", url);
      return;
    }
    const reportCode = match[1];

    // Ensure user is logged in before fetching
    if (!(await ensureLogin(accessToken, url))) return;

    startLoadingMessage();

    try {
      log.info("Analyzing report", reportCode);

      // 1. Fetch raw report metadata
      const gqlData = await fetchReport(accessToken, reportCode);
      log.info("GraphQL raw report response", gqlData);

      // 2. Parse metadata into structured format (actors, fights, abilities)
      const report = parseReport(gqlData);
      if (!report) {
        stopLoadingMessage("Failed to parse report.");
        return;
      }

      // Cache fight tables to avoid refetching the same pull multiple times
      const fightTableCache = new Map();

      // Helper to build fight table for a single pull
      async function loadFightTable(pull) {
        if (fightTableCache.has(pull.id)) {
          return fightTableCache.get(pull.id);
        }

        log.info(`Loading fight table for Fight ${pull.id} (${pull.name})`);

        // --- Fetch buffs applied to players/NPCs ---
        const buffs = await fetchFightBuffs(accessToken, reportCode, pull);
        log.debug(`Pull ${pull.id}: raw Buffs fetched`, buffs);

        // --- Fetch debuffs applied to enemies ---
        const debuffsEnemies = await fetchFightDebuffs(
          accessToken,
          reportCode,
          pull,
          HostilityType.ENEMIES
        );
        log.debug(
          `Pull ${pull.id}: raw Debuffs (enemies) fetched`,
          debuffsEnemies
        );

        // Merge buffs and enemy debuffs into one status list
        const allStatusEvents = [...buffs, ...debuffsEnemies];
        const parsedBuffs = parseBuffEvents(
          allStatusEvents,
          pull,
          report.actorById,
          report.abilityById
        );
        log.info(`Pull ${pull.id}: parsed Buffs/Debuffs`, parsedBuffs);

        // --- Fetch vulnerabilities (debuffs applied to friendlies) ---
        const vulnerabilitiesTaken = await fetchFightDebuffs(
          accessToken,
          reportCode,
          pull,
          HostilityType.FRIENDLIES
        );
        log.debug(
          `Pull ${pull.id}: raw Vulnerabilities (debuffs on friendlies) fetched`,
          vulnerabilitiesTaken
        );

        const parsedVulnerabilities = parseBuffEvents(
          vulnerabilitiesTaken,
          pull,
          report.actorById,
          report.abilityById
        );
        log.info(
          `Pull ${pull.id}: parsed Vulnerabilities (debuffs on friendlies)`,
          parsedVulnerabilities
        );

        // --- Fetch damage taken events ---
        const damageTaken = await fetchFightDamageTaken(
          accessToken,
          reportCode,
          pull
        );
        log.debug(`Pull ${pull.id}: raw DamageTaken fetched`, damageTaken);

        const parsedDamageTaken = parseFightDamageTaken(
          damageTaken,
          pull,
          report.actorById,
          report.abilityById
        );
        log.info(`Pull ${pull.id}: parsed DamageTaken`, parsedDamageTaken);

        // --- Fetch death events ---
        const deaths = await fetchFightDeaths(accessToken, reportCode, pull);
        log.debug(`Pull ${pull.id}: raw Deaths fetched`, deaths);

        const parsedDeaths = parseFightDeaths(
          deaths,
          pull,
          report.actorById,
          report.abilityById
        );
        log.info(`Pull ${pull.id}: parsed Deaths`, parsedDeaths);

        // --- Build fight table with damage, buffs, vulnerabilities ---
        const fightTable = buildFightTable(
          parsedDamageTaken,
          parsedBuffs,
          parsedVulnerabilities,
          parsedDeaths,
          pull,
          report.actorById,
          report.abilityById
        );

        fightTableCache.set(pull.id, fightTable);
        return fightTable;
      }

      stopLoadingMessage("");

      // Render fights list in UI; fight tables built lazily on user click
      renderReport(outputEl, report, loadFightTable);
    } catch (err) {
      log.error("Error analyzing report", err);
      stopLoadingMessage("Failed to analyze report.");
    }
  }

  // Initialize OAuth flow and run analyze() once logged in
  accessToken = await initializeAuth(
    statusEl,
    analyzeBtn,
    urlInput,
    async (token, url) => {
      accessToken = token;
      await analyze(url);
    }
  );

  // Analyze on button click
  analyzeBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    await analyze(url);
  });
});
