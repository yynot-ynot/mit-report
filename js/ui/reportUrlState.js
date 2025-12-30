/**
 * Manages reading and writing the `report` query parameter so the analyzer can
 * keep the user's FFLogs URL synchronized with browser history and bookmarks.
 * Only the bare FFLogs report code (and optional fight id) is stored in the query
 * parameters to minimize URL length while still allowing the UI to reconstruct
 * the full URL string.
 */
export class ReportUrlState {
  /**
   * @param {Window} win - The global window object for history + location access.
  - * @param {string} paramName - Query parameter used to store the report code.
  + * @param {string} paramName - Query parameter used to store the report code.
  + * @param {string} fightParamName - Query parameter used to store fight id.
   */
  constructor(win, paramName = "report", fightParamName = "fight") {
    this.window = win;
    this.paramName = paramName;
    this.fightParamName = fightParamName;
  }

  /**
   * Extracts a FFLogs report code (`reports/<code>`) from free-form user input.
   * Accepts either the raw code or any string containing `/reports/<code>`.
   *
   * @param {string | null | undefined} rawValue
   * @returns {string | null} - Report code (e.g., `ynGLwYTV3cAW7mZ8`) or null.
   */
  static extractReportCode(rawValue) {
    if (typeof rawValue !== "string") return null;
    const trimmed = rawValue.trim();
    if (!trimmed) return null;

    const fullMatch = trimmed.match(/reports\/([a-zA-Z0-9]+)/);
    if (fullMatch) return fullMatch[1];
    return /^[a-zA-Z0-9]+$/.test(trimmed) ? trimmed : null;
  }

  /**
   * Extracts a fight id from URLs or plain digits.
   *
   * @param {string | number | null | undefined} rawValue
   * @returns {number | null}
   */
  static extractFightId(rawValue) {
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      return Number.isInteger(rawValue) ? rawValue : Math.floor(rawValue);
    }
    if (typeof rawValue !== "string") return null;
    const trimmed = rawValue.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    const match = trimmed.match(/(?:\?|&|^)fight=(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Builds a canonical FFLogs URL by combining the fixed host with the provided
   * report code and optional fight id. Consumers should call extractReportCode
   * first.
   *
   * @param {string} reportCode
   * @param {number|null} fightId
   * @returns {string}
   */
  static buildReportUrl(reportCode, fightId = null) {
    const base = `https://www.fflogs.com/reports/${reportCode}`;
    if (fightId == null || Number.isNaN(fightId)) return base;
    return `${base}?fight=${fightId}`;
  }

  /**
   * Normalizes raw user input into the canonical FFLogs URL that contains only
   * the report code and optional fight id. When no valid code exists returns
   * null so callers can reject the input.
   *
   * @param {string} rawValue
   * @returns {string | null}
   */
  static normalizeReportUrl(rawValue) {
    const code = ReportUrlState.extractReportCode(rawValue);
    if (!code) return null;
    const fightId = ReportUrlState.extractFightId(rawValue);
    return ReportUrlState.buildReportUrl(code, fightId);
  }

  /**
   * Reads the current query parameter (if present) and returns the reconstructed
   * FFLogs URL so the caller can prefill form fields or auto-analyze.
   *
   * @returns {string | null}
   */
  getFromQuery() {
    const code = this.getReportCodeFromQuery();
    const fightId = this.getFightIdFromQuery();
    return code ? ReportUrlState.buildReportUrl(code, fightId) : null;
  }

  /**
   * Returns the raw report code currently encoded in the query parameter.
   *
   * @returns {string | null}
   */
  getReportCodeFromQuery() {
    try {
      const url = new URL(this.window.location.href);
      const value = url.searchParams.get(this.paramName);
      return ReportUrlState.extractReportCode(value);
    } catch (err) {
      return null;
    }
  }

  /**
   * Returns the fight id stored in the query parameter, or null if absent.
   *
   * @returns {number | null}
   */
  getFightIdFromQuery() {
    try {
      const url = new URL(this.window.location.href);
      const value = url.searchParams.get(this.fightParamName);
      return ReportUrlState.extractFightId(value);
    } catch (err) {
      return null;
    }
  }

  /**
   * Writes the provided report code (or full URL) into the query string via
   * replaceState so the browser history reflects the current analysis target
   * without creating a new history entry. Only the bare code is stored.
   *
   * @param {string} rawValue - New report code or URL.
   * @returns {string | null} - Report code written to history, or null.
   */
  setQueryParam(rawValue) {
    const code = ReportUrlState.extractReportCode(rawValue);
    if (!code) {
      return null;
    }
    this.#mutateUrl((searchParams) => {
      searchParams.set(this.paramName, code);
    });
    return code;
  }

  /**
   * Persists the fight id in the query string (or clears it when invalid).
   *
   * @param {string | number | null | undefined} rawValue
   * @returns {number | null}
   */
  setFightParam(rawValue) {
    const fightId = ReportUrlState.extractFightId(rawValue);
    if (fightId == null) {
      this.clearFightParam();
      return null;
    }
    this.#mutateUrl((searchParams) => {
      searchParams.set(this.fightParamName, fightId);
    });
    return fightId;
  }

  /**
   * Removes the report/fight query parameters (if present) while preserving all
   * other query parameters and the hash fragment.
   */
  clearQueryParam() {
    this.#mutateUrl((searchParams) => {
      searchParams.delete(this.paramName);
      searchParams.delete(this.fightParamName);
    });
  }

  /**
   * Removes only the fight parameter.
   */
  clearFightParam() {
    this.#mutateUrl((searchParams) => {
      searchParams.delete(this.fightParamName);
    });
  }

  /**
   * Shared helper that re-computes the address bar after running the provided
   * searchParam mutator function.
   *
   * @param {(searchParams: URLSearchParams) => void} mutator
   */
  #mutateUrl(mutator) {
    const url = new URL(this.window.location.href);
    mutator(url.searchParams);
    const query = url.searchParams.toString();
    const nextPath =
      url.pathname + (query ? `?${query}` : "") + (url.hash ?? "");
    this.window.history.replaceState({}, "", nextPath);
  }
}
