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
  fetchPlayerDamage,
} from "../data/fflogsApi.js";
import {
  parseReport,
  parseFightDamageTaken,
  parseFightDeaths,
  parseBuffEvents,
  parseFightCasts,
  parseFightDamageDone,
  buildFightTable,
} from "../data/reportParser.js";
import { generateCondensedPullTable } from "../analysis/pullAnalysis.js";
import {
  insertAutoAttacksIntoCasts,
  buildMitigationCastLookup,
} from "../analysis/castAnalysis.js";
import { renderReport } from "./reportRenderer.js";
import { initializeAuth, ensureLogin } from "./authManager.js";
import { FightState } from "./fightState.js";
import { Profiler } from "../utility/dataUtils.js";
import { ReportUrlState } from "./reportUrlState.js";

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
  const reportUrlState = new ReportUrlState(window);
  const initialCodeFromQuery = reportUrlState.getReportCodeFromQuery();
  const initialFightIdFromQuery = reportUrlState.getFightIdFromQuery();
  const initialUrlFromQuery = initialCodeFromQuery
    ? ReportUrlState.buildReportUrl(initialCodeFromQuery, initialFightIdFromQuery)
    : null;
  if (initialUrlFromQuery) {
    urlInput.value = initialUrlFromQuery;
  }

  let lastAutoAnalyzedUrl = null;
  let initialParamAutoAnalyzed = false;

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
  /**
   * Runs the analyzer pipeline for the provided FFLogs URL. Callers can opt out
   * of synchronizing the query parameter when the value already originated from
   * the URL (e.g., popstate) to avoid redundant history writes.
   *
   * @param {string} url - User-provided FFLogs report URL.
   * @param {{ skipQuerySync?: boolean }} [options]
   */
  async function analyze(url, { skipQuerySync = false } = {}) {
    const reportCode = ReportUrlState.extractReportCode(url);
    const requestedFightId = ReportUrlState.extractFightId(url);
    const sanitizedUrl = ReportUrlState.buildReportUrl(
      reportCode ?? "",
      requestedFightId
    );
    if (!reportCode || !sanitizedUrl) {
      outputEl.textContent = "Invalid report URL.";
      log.error("Invalid report URL", url);
      return;
    }

    // Normalize the textbox so pasted FFLogs URLs drop extra params after Analyze.
    urlInput.value = sanitizedUrl;

    if (!skipQuerySync) {
      reportUrlState.setQueryParam(reportCode);
      if (requestedFightId != null) {
        reportUrlState.setFightParam(requestedFightId);
      } else {
        reportUrlState.clearFightParam();
      }
    }

    // Ensure user is logged in before fetching
    if (!(await ensureLogin(accessToken, sanitizedUrl))) return;

    lastAutoAnalyzedUrl = sanitizedUrl;

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

        // === PALADIN DAMAGE FETCH PHASE ===
        // Detect if the current pull includes any Paladin players.
        const paladins = Array.from(report.actorById.values()).filter(
          (actor) =>
            actor.type === "Player" &&
            actor.subType &&
            actor.subType.toLowerCase() === "paladin"
        );

        let paladinDamagePromise = Promise.resolve([]);
        if (paladins.length > 0) {
          profiler.start("Fetch Paladin Damage");
          paladinDamagePromise = Promise.all(
            paladins.map((p) =>
              fetchPlayerDamage(
                accessToken,
                reportCode,
                pull,
                p.id,
                HostilityType.FRIENDLIES
              )
            )
          )
            // Flatten the results in case there are multiple paladins
            .then((results) => results.flat())
            .finally(() =>
              profiler.stop("Fetch Paladin Damage", "Fetch", `Pull ${pull.id}`)
            );
        }

        // Await all fetches concurrently
        const [
          buffs,
          debuffsEnemies,
          vulnerabilitiesTaken,
          damageTaken,
          deaths,
          casts,
          paladinDamage,
        ] = await Promise.all([
          buffsPromise,
          debuffsEnemiesPromise,
          vulnerabilitiesTakenPromise,
          damageTakenPromise,
          deathsPromise,
          castsPromise,
          paladinDamagePromise,
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
        log.debug(`Pull ${pull.id}: raw PaladinDamage fetched`, paladinDamage);

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

        profiler.start("Parse Player Casts");
        const parsedCastsPromise = Promise.resolve().then(() => {
          const result = parseFightCasts(
            casts,
            pull,
            report.actorById,
            report.abilityById
          );
          profiler.stop("Parse Player Casts", "Parse", `Pull ${pull.id}`);
          log.info(`Pull ${pull.id}: parsed Casts`, result);
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

        profiler.start("Parse Damage Done");
        const parsedDamageDonePromise = Promise.resolve().then(() => {
          const result = parseFightDamageDone(
            paladinDamage,
            pull,
            report.actorById,
            report.abilityById
          );
          profiler.stop("Parse Damage Done", "Parse", `Pull ${pull.id}`);
          log.info(`Pull ${pull.id}: parsed DamageDone`, result);
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
          parsedCast,
          parsedDamageDone,
        ] = await Promise.all([
          parsedBuffsPromise,
          parsedVulnerabilitiesPromise,
          parsedDamageTakenPromise,
          parsedDeathsPromise,
          parsedCastsPromise,
          parsedDamageDonePromise,
        ]);

        // === AUTO ATTACK MERGE PHASE ===
        // Merge all auto-attacks from parsed damage into the cast timeline.
        const mergedCasts = insertAutoAttacksIntoCasts(
          parsedDamageDone,
          parsedCast
        );
        log.info(
          `Pull ${pull.id}: merged auto-attacks into cast timeline`,
          mergedCasts
        );

        // === TABLE BUILD PHASE ===
        const fightState = new FightState(null);

        profiler.start("Build FightTable");
        const fightTablePromise = Promise.resolve().then(() => {
          const table = buildFightTable(
            parsedDamageTaken,
            parsedBuffs,
            parsedVulnerabilities,
            parsedDeaths,
            mergedCasts,
            pull,
            report.actorById,
            fightState.buffAnalysis
          );
          profiler.stop("Build FightTable", "Processing", `Pull ${pull.id}`);
          return table;
        });

        profiler.start("Build Mitigation Cast Lookup");
        const mitigationCastPromise = Promise.resolve().then(() => {
          const lookup = buildMitigationCastLookup(mergedCasts);
          profiler.stop(
            "Build Mitigation Cast Lookup",
            "Processing",
            `Pull ${pull.id}`
          );
          return lookup;
        });

        const [fightTable, mitigationCastLookup] = await Promise.all([
          fightTablePromise,
          mitigationCastPromise,
        ]);

        log.info(`Pull ${pull.id}: built FightTable`, fightTable);

        // Build condensed pull analysis
        const condensedPull = generateCondensedPullTable(fightTable);
        fightState.fightTable = fightTable;
        fightState.condensedPull = condensedPull;
        fightState.parsedCasts = mergedCasts;
        fightState.mitigationCastLookup = mitigationCastLookup;

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
      renderReport(outputEl, report, loadFightTable, {
        initialFightId:
          typeof requestedFightId === "number" ? requestedFightId : null,
        onFightSelected: (fightId) => {
          if (typeof fightId === "number") {
            reportUrlState.setFightParam(fightId);
            lastAutoAnalyzedUrl = ReportUrlState.buildReportUrl(
              reportCode,
              fightId
            );
          }
        },
      });
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
      const initialCode = initialCodeFromQuery;
      const initialFightId = initialFightIdFromQuery;
      const callbackCode = ReportUrlState.extractReportCode(url);
      const callbackFightId = ReportUrlState.extractFightId(url);
      const skipQuerySync =
        initialCode &&
        callbackCode &&
        callbackCode === initialCode &&
        ((initialFightId == null && callbackFightId == null) ||
          initialFightId === callbackFightId);
      if (skipQuerySync) {
        initialParamAutoAnalyzed = true;
      }
      const urlToAnalyze = callbackCode
        ? ReportUrlState.buildReportUrl(callbackCode, callbackFightId)
        : ReportUrlState.normalizeReportUrl(url) ?? url;
      await analyze(urlToAnalyze, { skipQuerySync });
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

  // Clearing the textbox should also clear the query parameter to satisfy
  // Test Case #5 from the planning doc.
  urlInput.addEventListener("input", () => {
    if (!urlInput.value.trim()) {
      reportUrlState.clearQueryParam();
      lastAutoAnalyzedUrl = null;
    }
  });

  // When the user blurs the input after edits (without clicking Analyze), sync
  // the history with the sanitized value so shareable URLs stay up-to-date.
  urlInput.addEventListener("change", () => {
    const code = ReportUrlState.extractReportCode(urlInput.value);
    const fightId = ReportUrlState.extractFightId(urlInput.value);
    if (code) {
      reportUrlState.setQueryParam(code);
    }
    if (fightId != null) {
      reportUrlState.setFightParam(fightId);
    } else {
      reportUrlState.clearFightParam();
    }
  });

  // Respond to browser history navigation by re-reading the query param and
  // auto-analyzing if it differs from the last processed value.
  window.addEventListener("popstate", async () => {
    const nextCode = reportUrlState.getReportCodeFromQuery();
    const nextFightId = reportUrlState.getFightIdFromQuery();
    if (!nextCode) {
      urlInput.value = "";
      lastAutoAnalyzedUrl = null;
      return;
    }

    const nextUrl = ReportUrlState.buildReportUrl(nextCode, nextFightId);
    if (nextUrl === lastAutoAnalyzedUrl) {
      urlInput.value = nextUrl;
      return;
    }

    urlInput.value = nextUrl;
    await analyze(nextUrl, { skipQuerySync: true });
  });

  // Kick off auto-analysis when the user landed with ?report=... unless the
  // OAuth callback already did so via initializeAuth's onLogin handler.
  if (initialUrlFromQuery && !initialParamAutoAnalyzed) {
    await analyze(initialUrlFromQuery, { skipQuerySync: true });
  }
});
