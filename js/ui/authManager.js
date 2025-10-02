import { startLogin, exchangeCode } from "../utility/fflogsAuth.js";
import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";

setModuleLogLevel("AuthManager", envLogLevel("info", "warn"));
const log = getLogger("AuthManager");

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
      urlInput.value = savedUrl;
      localStorage.removeItem("pending_report_url");
      log.info("Restored report URL, auto-analyzing");
      await onLogin(accessToken, savedUrl);
    }
  } else {
    analyzeBtn.textContent = "Login to FFLogs & Analyze";
    statusEl.classList.add("logged-out");
    statusEl.classList.remove("logged-in");
    log.warn("No access token found, user must log in");
  }

  return accessToken;
}

export async function ensureLogin(accessToken, reportUrl) {
  if (!accessToken) {
    log.info("No token, redirecting user to FFLogs login");
    localStorage.setItem("pending_report_url", reportUrl);
    await startLogin();
    return false;
  }
  return true;
}
