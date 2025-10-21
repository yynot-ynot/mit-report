import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";
import {
  fetchReport,
  fetchFightDamageTaken,
  fetchFightDeaths,
  fetchFightBuffs,
  fetchFightDebuffs,
  fetchFightCasts,
  HostilityType,
} from "../data/fflogsApi.js";
import {
  parseReport,
  parseFightDamageTaken,
  parseFightDeaths,
  parseBuffEvents,
  buildFightTable,
} from "../data/reportParser.js";
import { generateCondensedPullTable } from "../analysis/pullAnalysis.js";
import { renderReport } from "./reportRenderer.js";
import { initializeAuth, ensureLogin } from "./authManager.js";
import { FightState } from "./fightState.js";
import { Profiler } from "../utility/dataUtils.js";

setModuleLogLevel("App", envLogLevel("debug", "info"));
const log = getLogger("App");

document.addEventListener("DOMContentLoaded", async () => {
  const profiler = new Profiler();

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

      // Helper to build fight table for a single pull (optimized + profiled)
      async function loadFightTable(pull) {
        if (fightTableCache.has(pull.id)) {
          return fightTableCache.get(pull.id);
        }

        log.info(`Loading fight table for Fight ${pull.id} (${pull.name})`);
        const startTime = performance.now();

        // === PARALLEL FETCH PHASE ===
        // We start timing each individual fetch, even though they all run concurrently.
        profiler.start("Fetch Casts");
        const castsPromise = fetchFightCasts(
          accessToken,
          reportCode,
          pull
        ).finally(() =>
          profiler.stop("Fetch Casts", "Fetch", `Pull ${pull.id}`)
        );

        profiler.start("Fetch Buffs");
        const buffsPromise = fetchFightBuffs(
          accessToken,
          reportCode,
          pull
        ).finally(() =>
          profiler.stop("Fetch Buffs", "Fetch", `Pull ${pull.id}`)
        );

        profiler.start("Fetch Enemy Debuffs");
        const debuffsEnemiesPromise = fetchFightDebuffs(
          accessToken,
          reportCode,
          pull,
          HostilityType.ENEMIES
        ).finally(() =>
          profiler.stop("Fetch Enemy Debuffs", "Fetch", `Pull ${pull.id}`)
        );

        profiler.start("Fetch Player Debuffs");
        const vulnerabilitiesTakenPromise = fetchFightDebuffs(
          accessToken,
          reportCode,
          pull,
          HostilityType.FRIENDLIES
        ).finally(() =>
          profiler.stop("Fetch Player Debuffs", "Fetch", `Pull ${pull.id}`)
        );

        profiler.start("Fetch Damage Taken");
        const damageTakenPromise = fetchFightDamageTaken(
          accessToken,
          reportCode,
          pull
        ).finally(() =>
          profiler.stop("Fetch Damage Taken", "Fetch", `Pull ${pull.id}`)
        );

        profiler.start("Fetch Player Deaths");
        const deathsPromise = fetchFightDeaths(
          accessToken,
          reportCode,
          pull
        ).finally(() =>
          profiler.stop("Fetch Player Deaths", "Fetch", `Pull ${pull.id}`)
        );

        // Await all fetches concurrently
        const [
          buffs,
          debuffsEnemies,
          vulnerabilitiesTaken,
          damageTaken,
          deaths,
          casts,
        ] = await Promise.all([
          buffsPromise,
          debuffsEnemiesPromise,
          vulnerabilitiesTakenPromise,
          damageTakenPromise,
          deathsPromise,
          castsPromise,
        ]);

        log.debug(`Pull ${pull.id}: raw Casts fetched`, casts);
        log.debug(`Pull ${pull.id}: raw Buffs fetched`, buffs);
        log.debug(
          `Pull ${pull.id}: raw Debuffs (enemies) fetched`,
          debuffsEnemies
        );
        log.debug(
          `Pull ${pull.id}: raw Vulnerabilities (debuffs on friendlies) fetched`,
          vulnerabilitiesTaken
        );
        log.debug(`Pull ${pull.id}: raw DamageTaken fetched`, damageTaken);
        log.debug(`Pull ${pull.id}: raw Deaths fetched`, deaths);

        // === PARSING PHASE ===
        // Each parser runs after its own data is available.
        const allStatusEvents = [...buffs, ...debuffsEnemies];

        profiler.start("Parse Buffs and Enemy Debuffs");
        const parsedBuffsPromise = Promise.resolve().then(() => {
          const result = parseBuffEvents(
            allStatusEvents,
            pull,
            report.actorById,
            report.abilityById
          );
          profiler.stop(
            "Parse Buffs and Enemy Debuffs",
            "Parse",
            `Pull ${pull.id}`
          );
          log.info(`Pull ${pull.id}: parsed Buffs/Debuffs`, result);
          return result;
        });

        profiler.start("Parse Player Debuffs");
        const parsedVulnerabilitiesPromise = Promise.resolve().then(() => {
          const result = parseBuffEvents(
            vulnerabilitiesTaken,
            pull,
            report.actorById,
            report.abilityById
          );
          profiler.stop("Parse Player Debuffs", "Parse", `Pull ${pull.id}`);
          log.info(
            `Pull ${pull.id}: parsed Vulnerabilities (debuffs on friendlies)`,
            result
          );
          return result;
        });

        profiler.start("Parse Damage Taken");
        const parsedDamageTakenPromise = Promise.resolve().then(() => {
          const result = parseFightDamageTaken(
            damageTaken,
            pull,
            report.actorById,
            report.abilityById
          );
          profiler.stop("Parse Damage Taken", "Parse", `Pull ${pull.id}`);
          log.info(`Pull ${pull.id}: parsed DamageTaken`, result);
          return result;
        });

        profiler.start("Parse Player Deaths");
        const parsedDeathsPromise = Promise.resolve().then(() => {
          const result = parseFightDeaths(
            deaths,
            pull,
            report.actorById,
            report.abilityById
          );
          profiler.stop("Parse Player Deaths", "Parse", `Pull ${pull.id}`);
          log.info(`Pull ${pull.id}: parsed Deaths`, result);
          return result;
        });

        // Await all parsing concurrently (they don't depend on each other)
        const [
          parsedBuffs,
          parsedVulnerabilities,
          parsedDamageTaken,
          parsedDeaths,
        ] = await Promise.all([
          parsedBuffsPromise,
          parsedVulnerabilitiesPromise,
          parsedDamageTakenPromise,
          parsedDeathsPromise,
        ]);

        // === TABLE BUILD PHASE ===
        const fightState = new FightState(null);

        profiler.start("Build FightTable");
        const fightTable = buildFightTable(
          parsedDamageTaken,
          parsedBuffs,
          parsedVulnerabilities,
          parsedDeaths,
          pull,
          report.actorById,
          fightState.buffAnalysis
        );
        profiler.stop("Build FightTable", "Processing", `Pull ${pull.id}`);
        log.info(`Pull ${pull.id}: built FightTable`, fightTable);

        // Build condensed pull analysis
        const condensedPull = generateCondensedPullTable(fightTable);
        fightState.fightTable = fightTable;
        fightState.condensedPull = condensedPull;

        fightTableCache.set(pull.id, fightState);
        log.info(`Pull ${pull.id}: built condensed PullTable`, condensedPull);

        profiler.print(); // Prints full timing summary for this pull

        const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
        log.info(`Pull ${pull.id}: total analysis time = ${totalTime}s`);

        // 🕓 Wait for all async BuffLookups to finish, then dump final map
        fightState.buffAnalysis.waitForBuffLookups(() => {
          try {
            const entries = [
              ...fightState.buffAnalysis.buffToAbilityMap.entries(),
            ];
            if (entries.length === 0) {
              log.info(
                `[BuffCacheDump][Final] Pull ${pull.id}: Buff → Ability map snapshot (still empty after lookups!)`
              );
            } else {
              const formatted = entries
                .map(([buff, ability]) => {
                  const paddedBuff = buff.padEnd(22, " ");
                  return `  ${paddedBuff} → ${ability ?? "null"}`;
                })
                .join("\n");
              log.info(
                `[BuffCacheDump][Final] Pull ${pull.id}: Final Buff → Ability map snapshot\n${formatted}`
              );
            }
          } catch (err) {
            log.warn(
              `[BuffCacheDump][Final] Failed to dump buff cache for pull ${pull.id}`,
              err
            );
          }
        });

        return fightState;
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

  // Allow pressing "Enter" in the input to trigger Analyze
  urlInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      const url = urlInput.value.trim();
      await analyze(url);
    }
  });
});
