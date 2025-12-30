/**
 * Manages reading and writing the `report` query parameter so the analyzer can
 * keep the user's FFLogs URL synchronized with browser history and bookmarks.
 * Only the bare FFLogs report code is stored in the query parameter to minimize
 * URL length while still allowing the UI to reconstruct the full URL string.
 */
export class ReportUrlState {
  /**
   * @param {Window} win - The global window object for history + location access.
   * @param {string} paramName - Query parameter used to store the report code.
   */
  constructor(win, paramName = "report") {
    this.window = win;
    this.paramName = paramName;
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
   * Builds a canonical FFLogs URL by combining the fixed host with the provided
   * report code. Consumers should call extractReportCode first.
   *
   * @param {string} reportCode
   * @returns {string}
   */
  static buildReportUrl(reportCode) {
    return `https://www.fflogs.com/reports/${reportCode}`;
  }

  /**
   * Reads the current query parameter (if present) and returns the reconstructed
   * FFLogs URL so the caller can prefill form fields or auto-analyze.
   *
   * @returns {string | null}
   */
  getFromQuery() {
    const code = this.getReportCodeFromQuery();
    return code ? ReportUrlState.buildReportUrl(code) : null;
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
   * Removes the report query parameter (if present) while preserving all other
   * query parameters and the hash fragment.
   */
  clearQueryParam() {
    this.#mutateUrl((searchParams) => {
      searchParams.delete(this.paramName);
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
