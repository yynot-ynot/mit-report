/**
 * Manages reading and writing the `report`/`fight` query parameters so the
 * analyzer can keep the user's FFLogs URL synchronized with history/bookmarks.
 * Only the bare FFLogs report code plus a normalized fight selector (numeric ID
 * or the keyword "latest") are stored.
 */
export class ReportUrlState {
  /**
   * @param {Window} win - The global window object for history + location access.
   * @param {string} paramName - Query parameter used to store the report code.
   * @param {string} fightParamName - Query parameter used to store the fight selection.
   */
  constructor(win, paramName = "report", fightParamName = "fight") {
    this.window = win;
    this.paramName = paramName;
    this.fightParamName = fightParamName;
  }

  /**
   * Extracts a FFLogs report code (`reports/<code>`) from free-form user input.
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
   * Determines how the fight should be selected (numeric or "latest") from a raw
   * URL/query string. `hasValue` indicates whether a fight parameter existed.
   *
   * @param {string | number | null | undefined} rawValue
   * @returns {{ fightId: number | null, useLatest: boolean, hasValue: boolean }}
   */
  static parseFightSelection(rawValue) {
    const fightValue = ReportUrlState.#extractFightValue(rawValue);
    if (fightValue == null) {
      return { fightId: null, useLatest: false, hasValue: false };
    }

    const normalized = decodeURIComponent(fightValue).trim();
    if (!normalized) {
      return { fightId: null, useLatest: true, hasValue: true };
    }

    if (ReportUrlState.#isLatestKeyword(normalized)) {
      return { fightId: null, useLatest: true, hasValue: true };
    }

    if (/^\d+$/.test(normalized)) {
      return {
        fightId: parseInt(normalized, 10),
        useLatest: false,
        hasValue: true,
      };
    }

    // Any other non-numeric token should be treated as a request for the latest fight.
    return { fightId: null, useLatest: true, hasValue: true };
  }

  /**
   * Extracts the fight portion from a raw input. Returns null when the input
   * does not reference a fight parameter/value.
   *
   * @param {string | number | null | undefined} rawValue
   * @returns {string | null}
   */
  static #extractFightValue(rawValue) {
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      return rawValue.toString();
    }
    if (typeof rawValue !== "string") return null;
    const trimmed = rawValue.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/(?:\?|&|^)fight=([^&#]+)/i);
    if (match) return match[1];
    if (/^\d+$/.test(trimmed) || ReportUrlState.#isLatestKeyword(trimmed)) {
      return trimmed;
    }
    return null;
  }

  static #isLatestKeyword(value) {
    return typeof value === "string" && value.trim().toLowerCase() === "latest";
  }

  /**
   * Builds a canonical FFLogs URL by combining the fixed host with the provided
   * report code and optional fight selector. When `useLatest` is true the fight
   * id is ignored and `fight=latest` is appended.
   *
   * @param {string} reportCode
   * @param {number|null} fightId
   * @param {boolean} useLatest
   * @returns {string}
   */
  static buildReportUrl(reportCode, fightId = null, useLatest = false) {
    const base = `https://www.fflogs.com/reports/${reportCode}`;
    if (useLatest) return `${base}?fight=latest`;
    if (fightId == null || Number.isNaN(fightId)) return base;
    return `${base}?fight=${fightId}`;
  }

  /**
   * Normalizes raw user input into the canonical FFLogs URL that contains only
   * the report code plus the normalized fight selector. When no fight is
   * provided the result defaults to `fight=latest`.
   *
   * @param {string} rawValue
   * @returns {string | null}
   */
  static normalizeReportUrl(rawValue) {
    const code = ReportUrlState.extractReportCode(rawValue);
    if (!code) return null;
    const selection = ReportUrlState.parseFightSelection(rawValue);
    const useLatest = selection.useLatest || !selection.hasValue;
    return ReportUrlState.buildReportUrl(
      code,
      selection.fightId,
      useLatest
    );
  }

  /**
   * Reads the current query parameter (if present) and returns the reconstructed
   * FFLogs URL so the caller can prefill form fields or auto-analyze.
   *
   * @returns {string | null}
   */
  getFromQuery() {
    const code = this.getReportCodeFromQuery();
    const selection = this.getFightSelectionFromQuery();
    return code
      ? ReportUrlState.buildReportUrl(
          code,
          selection.fightId,
          selection.useLatest
        )
      : null;
  }

  /**
   * Reads the current `report=` query parameter and returns the normalized code
   * so callers can reuse it without re-parsing the URL each time.
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
   * Convenience helper that returns the numeric fight id when one is stored.
   * When the selection is "latest" this returns null so callers know they must
   * request the newest fight dynamically.
   *
   * @returns {number | null}
   */
  getFightIdFromQuery() {
    const selection = this.getFightSelectionFromQuery();
    return selection.useLatest ? null : selection.fightId;
  }

  /**
   * Exposes the full fight selection metadata stored in the URL, including
   * whether the user requested "latest" and whether an explicit value existed.
   *
   * @returns {{ fightId: number | null, useLatest: boolean, hasValue: boolean }}
   */
  getFightSelectionFromQuery() {
    try {
      const url = new URL(this.window.location.href);
      const hasParam = url.searchParams.has(this.fightParamName);
      const value = url.searchParams.get(this.fightParamName);
      const selection = ReportUrlState.parseFightSelection(value);
      return hasParam ? selection : { ...selection, hasValue: false };
    } catch (err) {
      return { fightId: null, useLatest: false, hasValue: false };
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
   * Persists the fight selection (numeric or latest) in the query string. When
   * `forceLatest` is true the value is set to "latest" regardless of `rawValue`.
   *
   * @param {string | number | null | undefined} rawValue
   * @param {{ forceLatest?: boolean }} [options]
   * @returns {number | "latest" | null}
   */
  setFightParam(rawValue, { forceLatest = false } = {}) {
    if (forceLatest) {
      this.#mutateUrl((searchParams) => {
        searchParams.set(this.fightParamName, "latest");
      });
      return "latest";
    }
    const selection = ReportUrlState.parseFightSelection(rawValue);
    if (!selection.hasValue) {
      this.clearFightParam();
      return null;
    }
    this.#mutateUrl((searchParams) => {
      searchParams.set(
        this.fightParamName,
        selection.useLatest ? "latest" : selection.fightId
      );
    });
    return selection.useLatest ? "latest" : selection.fightId;
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
