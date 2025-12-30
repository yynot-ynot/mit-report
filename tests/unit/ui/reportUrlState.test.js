import test from "node:test";
import assert from "node:assert/strict";
import { ReportUrlState } from "../../../js/ui/reportUrlState.js";

/**
 * Builds a minimal window mock with history + location so ReportUrlState can
 * mutate URLs without touching a real browser environment.
 * The mock tracks every replaceState call for assertions.
 *
 * @param {string} href
 */
function createFakeWindow(href = "https://example.com/index.html") {
  const replaceCalls = [];
  const windowMock = {
    location: { href },
    history: {
      replaceState: (_state, _title, newUrl) => {
        replaceCalls.push(newUrl);
        const base = new URL(windowMock.location.href);
        const absolute = newUrl.startsWith("http")
          ? newUrl
          : `${base.origin}${newUrl}`;
        windowMock.location.href = absolute;
      },
    },
  };
  return { windowMock, replaceCalls };
}

// Ensures report-code extraction works for both direct codes and full URLs so
// user input stays flexible while history stays compact.
test("extractReportCode handles raw codes and URLs", () => {
  assert.equal(
    ReportUrlState.extractReportCode(" https://www.fflogs.com/reports/abc123 "),
    "abc123"
  );
  assert.equal(ReportUrlState.extractReportCode("abc123"), "abc123");
  assert.equal(ReportUrlState.extractReportCode(""), null);
  assert.equal(ReportUrlState.extractReportCode("https://example.com/foo"), null);
});

// Builds the canonical URL (with optional fight) so the textbox always displays
// a full FFLogs link even though only the id(s) are stored in the query string.
test("buildReportUrl reconstructs the canonical FFLogs link", () => {
  assert.equal(
    ReportUrlState.buildReportUrl("ynGLwYTV3cAW7mZ8"),
    "https://www.fflogs.com/reports/ynGLwYTV3cAW7mZ8"
  );
  assert.equal(
    ReportUrlState.buildReportUrl("ynGLwYTV3cAW7mZ8", 6),
    "https://www.fflogs.com/reports/ynGLwYTV3cAW7mZ8?fight=6"
  );
});

// Validates fight id extraction for both raw digits and URLs like those copied
// from FFLogs.
test("extractFightId handles plain digits and query params", () => {
  assert.equal(ReportUrlState.extractFightId("7"), 7);
  assert.equal(
    ReportUrlState.extractFightId(
      "https://www.fflogs.com/reports/gC7tXWMwvNqpyD2f?fight=6&type=damage"
    ),
    6
  );
  assert.equal(
    ReportUrlState.extractFightId(
      "https://www.fflogs.com/reports/gC7tXWMwvNqpyD2f?fight=7&type=damage-done&source=7&view=events"
    ),
    7
  );
  assert.equal(ReportUrlState.extractFightId(""), null);
});

// Full URLs copied from FFLogs should normalize down to the canonical report +
// optional fight representation so the textbox/address bar stay tidy.
test("normalizeReportUrl strips non-essential FFLogs params", () => {
  assert.equal(
    ReportUrlState.normalizeReportUrl(
      "https://www.fflogs.com/reports/gC7tXWMwvNqpyD2f?fight=7&type=damage-done&source=7&view=events"
    ),
    "https://www.fflogs.com/reports/gC7tXWMwvNqpyD2f?fight=7"
  );
  assert.equal(
    ReportUrlState.normalizeReportUrl("https://www.fflogs.com/reports/abc123"),
    "https://www.fflogs.com/reports/abc123"
  );
});

// Exercises Test Cases #2 and #11: the analyzer writes a valid URL via
// replaceState (no extra history entries) while serializing only the bare code.
test("setQueryParam encodes only the report code via replaceState", () => {
  const { windowMock, replaceCalls } = createFakeWindow(
    "https://example.com/index.html"
  );
  const state = new ReportUrlState(windowMock);
  const code = state.setQueryParam("https://www.fflogs.com/reports/abcdEF");

  assert.equal(code, "abcdEF");
  assert.equal(replaceCalls.length, 1);
  assert.equal(replaceCalls[0], "/index.html?report=abcdEF");
  assert.equal(
    windowMock.location.href,
    "https://example.com/index.html?report=abcdEF"
  );
});

// Confirms malformed edits do not clobber the current query parameter so users
// can keep their last good link until they submit a valid one.
test("setQueryParam ignores invalid values so existing URLs remain untouched", () => {
  const { windowMock, replaceCalls } = createFakeWindow(
    "https://example.com/index.html?report=original"
  );
  const state = new ReportUrlState(windowMock);

  assert.equal(state.setQueryParam("invalid url!"), null);
  assert.equal(replaceCalls.length, 0);
  assert.equal(
    windowMock.location.href,
    "https://example.com/index.html?report=original"
  );
});

// Ensures fight selection (Test Case #11 extension) writes only the numeric id
// and leaves other parameters intact.
test("setFightParam serializes numeric fight id with replaceState", () => {
  const { windowMock, replaceCalls } = createFakeWindow(
    "https://example.com/index.html?report=abc123"
  );
  const state = new ReportUrlState(windowMock);

  const fightId = state.setFightParam("fight=6");
  assert.equal(fightId, 6);
  assert.equal(replaceCalls.length, 1);
  assert.equal(
    windowMock.location.href,
    "https://example.com/index.html?report=abc123&fight=6"
  );
});

// Covers Test Case #5 (clear flow cleanup) by ensuring only the report query
// parameter disappears when inputs are emptied.
test("clearQueryParam removes only the report parameter", () => {
  const { windowMock } = createFakeWindow(
    "https://example.com/index.html?report=original&fight=6&code=xyz"
  );
  const state = new ReportUrlState(windowMock);

  state.clearQueryParam();

  assert.equal(
    windowMock.location.href,
    "https://example.com/index.html?code=xyz"
  );
});

// Clearing just the fight parameter should leave everything else untouched.
test("clearFightParam removes only the fight parameter", () => {
  const { windowMock } = createFakeWindow(
    "https://example.com/index.html?report=original&fight=6&code=xyz"
  );
  const state = new ReportUrlState(windowMock);

  state.clearFightParam();

  assert.equal(
    windowMock.location.href,
    "https://example.com/index.html?report=original&code=xyz"
  );
});

// Mirrors Test Cases #2 and #3 by simulating a direct navigation with an
// encoded query parameter and verifying the sanitized result is surfaced.
test("getFromQuery returns sanitized parameter for direct navigation cases (Test Case #2/#3)", () => {
  const { windowMock } = createFakeWindow(
    "https://example.com/index.html?report=codeXYZ&fight=9"
  );
  const state = new ReportUrlState(windowMock);

  assert.equal(
    state.getFromQuery(),
    "https://www.fflogs.com/reports/codeXYZ?fight=9"
  );
});

// Verifies Test Case #11 that callers can read the raw code for history
// correlation logic or comparisons without rebuilding the full URL each time.
test("getReportCodeFromQuery exposes the stored report id", () => {
  const { windowMock } = createFakeWindow(
    "https://example.com/index.html?report=ynGLwYTV3cAW7mZ8"
  );
  const state = new ReportUrlState(windowMock);

  assert.equal(state.getReportCodeFromQuery(), "ynGLwYTV3cAW7mZ8");
});

// Fight id should be readable directly for use when auto-selecting a pull.
test("getFightIdFromQuery exposes the stored fight id", () => {
  const { windowMock } = createFakeWindow(
    "https://example.com/index.html?report=ynGLwYTV3cAW7mZ8&fight=12"
  );
  const state = new ReportUrlState(windowMock);

  assert.equal(state.getFightIdFromQuery(), 12);
});
