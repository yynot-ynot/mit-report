import { startLogin, exchangeCode } from "../utility/fflogsAuth.js";
import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";

setModuleLogLevel("AuthManager", envLogLevel("info", "warn"));
const log = getLogger("AuthManager");

/**
 * Orchestrates FFLogs OAuth initialization, updates the login UI, and restores
 * any pending report URL that was stored before a redirect. When a caller has
 * already populated the URL input (e.g., from a query parameter), that value is
 * preserved and reused for auto-analysis after login completes.
 *
 * @param {HTMLElement} statusEl - Element used to display login state.
 * @param {HTMLElement} analyzeBtn - Analyze/login button element.
 * @param {HTMLInputElement} urlInput - Input containing the current report URL.
 * @param {(token: string, url: string) => Promise<void>} onLogin - Callback
 *   invoked once an access token exists so initialization can auto-analyze.
 * @returns {Promise<string | null>} - Access token when available.
 */
export async function initializeAuth(statusEl, analyzeBtn, urlInput, onLogin) {
  let accessToken = null;

  const data = await exchangeCode();
  if (data?.access_token) {
    accessToken = data.access_token;
    analyzeBtn.textContent = "Analyze";
    statusEl.textContent = "✅ Logged into FFLogs";
    statusEl.classList.add("logged-in");
    statusEl.classList.remove("logged-out");
    log.info("Access token acquired");

    // Clean up ?code=... from URL
    if (window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    const savedUrl = localStorage.getItem("pending_report_url");
    if (savedUrl) {
      const existingValue = urlInput.value?.trim();
      const urlToAnalyze = existingValue || savedUrl;

      if (!existingValue) {
        urlInput.value = savedUrl;
        log.info("Restored report URL from storage, auto-analyzing");
      } else if (existingValue !== savedUrl) {
        log.info(
          "URL input already populated, skipping pending_report_url overwrite"
        );
      } else {
        log.info("URL input already matches pending_report_url");
      }

      localStorage.removeItem("pending_report_url");
      await onLogin(accessToken, urlToAnalyze);
    }
  } else {
    analyzeBtn.textContent = "Login to FFLogs & Analyze";
    statusEl.classList.add("logged-out");
    statusEl.classList.remove("logged-in");
    log.warn("No access token found, user must log in");
  }

  return accessToken;
}

/**
 * Ensures the user is logged into FFLogs before the analyzer runs. When no
 * token is available the user is redirected to the OAuth flow and the desired
 * report URL is persisted so it can be restored on return.
 *
 * @param {string | null} accessToken - Current OAuth access token.
 * @param {string} reportUrl - Report URL that triggered analysis.
 * @returns {Promise<boolean>} - True when logged in and analysis may continue.
 */
export async function ensureLogin(accessToken, reportUrl) {
  if (!accessToken) {
    log.info("No token, redirecting user to FFLogs login");
    localStorage.setItem("pending_report_url", reportUrl);
    await startLogin();
    return false;
  }
  return true;
}
