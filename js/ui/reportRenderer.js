import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";
import { FilterState } from "./filterState.js";
import {
  renderDetailedTable,
  filterAndStyleDetailedTable,
} from "./reportRendererDetailed.js";
import {
  renderCondensedTable,
  filterAndStyleCondensedTable,
} from "./reportRendererCondensed.js";

setModuleLogLevel("ReportRenderer", envLogLevel("info", "warn"));
const log = getLogger("ReportRenderer");

/**
 * Render the full report into the given container.
 *
 * Responsibilities:
 *   - Groups fights by encounter ID and builds tabbed navigation.
 *   - Creates fight selection grid (pull numbers).
 *   - Provides a container for rendering individual fight tables.
 *   - Initializes the first encounter by default.
 *
 * @param {HTMLElement} outputEl - The container element to render into
 * @param {Object} report - Parsed report object with fights, actors, etc.
 * @param {Function} loadFightTable - Async loader for fightTable data
 */
export function renderReport(outputEl, report, loadFightTable) {
  outputEl.innerHTML = `<div class="report-category">${report.title}</div>`;

  const fightsByBoss = new Map();
  report.fights.forEach((f) => {
    if (!fightsByBoss.has(f.encounterID)) {
      fightsByBoss.set(f.encounterID, []);
    }
    fightsByBoss.get(f.encounterID).push(f);
  });

  const reportWrapper = document.createElement("div");
  reportWrapper.classList.add("report-wrapper");

  const bossTabs = document.createElement("div");
  bossTabs.classList.add("boss-tabs");
  reportWrapper.appendChild(bossTabs);

  outputEl.appendChild(reportWrapper);

  // New container for pulls + fight table
  const fightWrapper = document.createElement("div");
  fightWrapper.classList.add("fight-wrapper");

  const pullGrid = document.createElement("div");
  pullGrid.classList.add("pull-grid");
  fightWrapper.appendChild(pullGrid);

  const fightContainer = document.createElement("div");
  fightContainer.id = "fightContainer";
  fightWrapper.appendChild(fightContainer);

  outputEl.appendChild(fightWrapper);

  /**
   * Render a single fight’s table into the UI.
   *
   * Delivery Requirement:
   *   - This function must always produce a full, unfiltered DOM snapshot
   *     of the fight. Every row and every player column is rendered,
   *     regardless of filter settings. No structural filtering is applied
   *     here — it is deferred to `filterAndStyleTable`, which safely mutates
   *     the table in place.
   *
   * Output Structure:
   *   - A section containing:
   *       • Fight title
   *       • A stacked control panel of filter/interaction toggles
   *       • A scrollable table with frozen header support
   *
   * Table Columns:
   *   - Timestamp: relative time of the event
   *   - Attack Name: ability name
   *   - Damage: "unmitigated → amount (mit%)"
   *   - Player columns: buffs active on each player at that timestamp
   *
   * Table Behavior:
   *   - Each row represents a single damage event.
   *   - Buffs applied to a player are shown in that player’s column
   *     at the corresponding timestamp.
   *   - Dead players are rendered with greyed-out cells.
   *   - Targeted players (event.actor) are marked with `.target-cell`.
   *
   * Interactive Enhancements:
   *   - Control panel provides:
   *       • Show/Hide Auto-Attacks
   *       • Show/Hide Bleeds
   *       • Enable/Disable Target Player Highlighting
   *       • Show Buffs (Detailed) vs Show Abilities Only
   *       • Reset Player Filter (clears selected players)
   *   - Clicking player headers (live or frozen) toggles selection
   *     and triggers `filterAndStyleTable` to update visibility.
   *   - Selected players stay normal; non-selected headers grey out.
   *   - Hovering over a row highlights the corresponding player column header
   *     (live + frozen) with a “Target” badge if enabled.
   *
   * Notes:
   *   - Buff name resolution may complete asynchronously. Once all lookups
   *     are done, `buffAnalysis.waitForBuffLookups` triggers a final
   *     `filterAndStyleTable` to repaint cells with resolved names.
   *
   * @param {FightState} fightState - Encapsulates fight data, filters, and analysis
   */
  async function renderFight(fightState) {
    const filterState = fightState.filters;
    fightContainer.innerHTML = "";

    // 🧱 Build shared header (title + controls)
    const section = document.createElement("section");
    const headerContainer = renderFightHeader(fightState, report, renderFight);
    section.appendChild(headerContainer);

    // 🔀 Route between condensed and detailed views
    if (filterState.showCondensedView) {
      log.info(
        `[Router] Rendering condensed view for Pull ${fightState.fightTable?.fightId}`
      );
      renderCondensedTable(fightState, report, section);
    } else {
      log.info(
        `[Router] Rendering detailed view for Pull ${fightState.fightTable?.fightId}`
      );
      renderDetailedTable(fightState, report, section);
    }

    fightContainer.appendChild(section);
  }

  function renderPullGrid(encounterId) {
    const pulls = fightsByBoss.get(parseInt(encounterId, 10)) || [];
    pullGrid.innerHTML = "";

    log.debug(`Rendering ${pulls.length} pulls for encounter ${encounterId}`);

    pulls.forEach((f, idx) => {
      const box = document.createElement("div");
      box.textContent = idx + 1;
      box.classList.add("pull-box");
      box.dataset.fightId = f.id;

      box.addEventListener("click", async () => {
        document
          .querySelectorAll(".pull-box")
          .forEach((b) => b.classList.remove("active"));
        box.classList.add("active");

        fightContainer.innerHTML = "Loading fight data...";
        const fightState = await loadFightTable(f);

        // Add per-boss pull number
        f.bossPullNumber = idx + 1;

        // Ensure the pull number persists
        fightState.fightTable.bossPullNumber = f.bossPullNumber;

        renderFight(fightState);
      });

      pullGrid.appendChild(box);
    });

    if (pulls.length > 0) {
      pullGrid.lastChild.classList.add("active");
      pullGrid.lastChild.click();
    }
  }

  fightsByBoss.forEach((pulls, encounterId) => {
    const tab = document.createElement("div");
    const bossName = pulls[0]?.name || `Encounter ${encounterId}`;
    tab.textContent = bossName;
    tab.classList.add("boss-tab");
    tab.dataset.encounterId = encounterId;

    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".boss-tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderPullGrid(encounterId);
    });

    bossTabs.appendChild(tab);
  });

  const firstTab = bossTabs.querySelector(".boss-tab");
  if (firstTab) {
    firstTab.classList.add("active");
    renderPullGrid(firstTab.dataset.encounterId);
  }
}

/**
 * Build a control panel of buttons for fight display options.
 *
 * Supports two types of controls:
 *   1. Toggle buttons:
 *      - Have on/off labels and maintain an internal state.
 *      - State changes call the provided `onToggle` callback.
 *   2. Action buttons (e.g. Reset Player Filter):
 *      - Always display the same label.
 *      - Trigger `onClick` only when conditions are met
 *        (e.g. only active if players are selected).
 *
 * Styling:
 *   - .toggle-btn.enable (lit, active)
 *   - .toggle-btn.disable (greyed out, inactive)
 *
 * @param {Array} options - List of control definitions
 * @returns {HTMLElement} controlPanel - The constructed control panel div
 */
export function renderControlPanel(filterState, options) {
  const controlPanel = document.createElement("div");
  controlPanel.classList.add("control-panel");

  options.forEach((opt) => {
    const btn = document.createElement("button");

    if (opt.type === "reset-player") {
      // 🔹 Reset Player Filter special case
      btn.textContent = opt.label;
      btn.className = "toggle-btn disable"; // default greyed out
      btn.addEventListener("click", () => {
        if (filterState.selectedPlayers.size > 0) {
          opt.onClick();
        }
      });

      // Save ref for external updates
      filterState.resetPlayerBtn = btn;
    } else {
      // 🔹 Normal toggle buttons
      function updateBtn() {
        btn.textContent = opt.state ? opt.labelOn : opt.labelOff;
        btn.className = opt.state ? "toggle-btn disable" : "toggle-btn enable";
      }

      btn.addEventListener("click", () => {
        opt.state = !opt.state;
        opt.onToggle(opt.state);
        updateBtn();
      });

      updateBtn();
    }

    controlPanel.appendChild(btn);
  });

  return controlPanel;
}

/**
 * Determine which player(s) are the target of a given event row.
 *
 * Current behavior:
 *   - Uses event.actor (single string).
 *
 * Future-proofing:
 *   - Returns an array of targets to support multi-target abilities.
 *
 * @param {Object} event - A fightTable row event
 * @returns {string[]} Array of targeted player names
 */
export function getRowTargets(event) {
  if (event.actor) {
    return [event.actor];
  }
  return [];
}

/**
 * Update Reset Player button state based on FilterState selections.
 *
 * @param {FilterState} filterState - current fight’s filter state
 */
export function updateResetButtonState(filterState) {
  if (!filterState.resetPlayerBtn) return; // nothing to update yet
  if (filterState.hasSelections()) {
    filterState.resetPlayerBtn.classList.remove("disable");
    filterState.resetPlayerBtn.classList.add("enable");
  } else {
    filterState.resetPlayerBtn.classList.remove("enable");
    filterState.resetPlayerBtn.classList.add("disable");
  }
}

/**
 * Build and return the shared fight header section.
 *
 * Purpose:
 *   The fight header includes:
 *     - Fight title (boss name + pull number)
 *     - A vertically stacked control panel of toggle buttons
 *       for filtering, highlighting, and table view options.
 *
 * Responsibilities:
 *   • Render a consistent control panel across both detailed and condensed views.
 *   • Bind button callbacks to the correct filtering behavior.
 *   • Route filtering through `filterAndStyleCurrentView()`
 *     so the correct handler is invoked for the active view mode.
 *   • Call `reRenderCallback(fightState)` only for view structure changes
 *     (e.g., toggling condensed ↔ detailed).
 *
 * Behavior:
 *   Each control button corresponds to a filter or UI toggle:
 *     - Show/Hide Auto-Attacks
 *     - Show/Hide Bleeds / DoTs
 *     - Enable/Disable Target Player Highlight
 *     - Show Buffs (Detailed) vs Show Abilities Only
 *     - Reset Player Filter
 *     - Show/Hide Botched Mitigations
 *     - Toggle Condensed / Detailed Table View
 *
 * Interaction Policy:
 *   - Structural toggles (like "Show Condensed Table") → trigger full re-render.
 *   - Style-only toggles (like "Hide Auto-Attacks") → apply immediately to the existing DOM.
 *   - Player header clicks use `filterAndStyleCurrentView()` directly.
 *
 * Safety:
 *   ✅ Safe to call before table exists — only sets up callbacks.
 *   ✅ Callbacks check `fightState.tableEl` at runtime.
 *   ✅ No redundant re-renders except for view mode changes.
 *
 * @param {FightState} fightState - The state container for this fight
 * @param {Object} report - The parsed report data
 * @param {Function} reRenderCallback - Function to fully rebuild view (renderFight)
 * @returns {HTMLElement} headerContainer - Fully assembled header DOM element
 */
function renderFightHeader(fightState, report, reRenderCallback) {
  const filterState = fightState.filters;

  // --- Header container wrapper ---
  const headerContainer = document.createElement("div");
  headerContainer.classList.add("fight-header");

  // --- Title element (boss + pull number) ---
  const titleEl = document.createElement("h4");
  titleEl.textContent = `${fightState.fightTable.name} (Pull: ${fightState.fightTable.bossPullNumber})`;

  // --- Build Control Panel Definition ---
  const controlPanel = renderControlPanel(filterState, [
    {
      labelOn: "Hide Auto-Attacks",
      labelOff: "Show Auto-Attacks",
      state: filterState.showAutoAttacks,
      onToggle: (newState) => {
        filterState.showAutoAttacks = newState;
        // 🔁 Reapply filters on current view only
        filterAndStyleCurrentView(fightState, report);
      },
    },
    {
      labelOn: "Hide Bleeds",
      labelOff: "Show Bleeds",
      state: filterState.showCombinedDots,
      onToggle: (newState) => {
        filterState.showCombinedDots = newState;
        filterAndStyleCurrentView(fightState, report);
      },
    },
    {
      labelOn: "Disable Target Player Highlight",
      labelOff: "Enable Target Player Highlight",
      state: filterState.enableColumnHighlight,
      onToggle: (newState) => {
        filterState.enableColumnHighlight = newState;
        // ⚙️ No filter pass needed — highlight only affects hover interaction
      },
    },
    {
      labelOn: "Show Buffs (Detailed)",
      labelOff: "Show Abilities Only",
      state: filterState.showAbilitiesOnly,
      onToggle: (newState) => {
        filterState.showAbilitiesOnly = newState;
        filterAndStyleCurrentView(fightState, report);
      },
    },
    {
      type: "reset-player",
      label: "Reset Player Filter",
      state: false,
      onClick: () => {
        // 🧹 Clear selected players and refresh current view
        filterState.resetPlayers();
        filterAndStyleCurrentView(fightState, report);
        updateResetButtonState(filterState);
      },
    },
    {
      labelOn: "Hide Botched Mitigations",
      labelOff: "Show Botched Mitigations",
      state: filterState.showBotchedMitigations,
      onToggle: (newState) => {
        filterState.showBotchedMitigations = newState;
        filterAndStyleCurrentView(fightState, report);
      },
    },
    {
      labelOn: "Show Detailed Table", // when condensed view is active
      labelOff: "Show Condensed Table", // when detailed view is active
      state: filterState.showCondensedView,
      onToggle: (newState) => {
        filterState.showCondensedView = newState;
        log.info(`[ControlPanel] Condensed view → ${newState ? "ON" : "OFF"}`);

        // 🔁 Full re-render required for structural switch
        reRenderCallback(fightState);
      },
    },
  ]);

  // --- Assemble Header ---
  headerContainer.appendChild(titleEl);
  headerContainer.appendChild(controlPanel);

  return headerContainer;
}

/**
 * filterAndStyleCurrentView()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Provides a **centralized routing layer** for applying filters and style updates
 *   to whichever table view (Detailed or Condensed) is currently active.
 *
 * 🧠 Why this function exists:
 *   Both `filterAndStyleTable()` (detailed) and `filterAndStyleCondensedTable()` (condensed)
 *   share identical triggers:
 *     • Control panel toggles (Auto-Attacks, Bleeds, Buffs, Botched Mitigation, etc.)
 *     • Player header clicks
 *     • Reset Player Filter
 *     • Async buff name resolution callbacks
 *
 *   Instead of having each button or event handler check the view mode manually,
 *   they call this one unified function. It delegates filtering to the correct
 *   handler based on `filterState.showCondensedView`.
 *
 * 🚀 Workflow:
 *   1️⃣ Check that a table is actually rendered (`fightState.tableEl`).
 *       - If not (e.g. control panel loaded before table build), safely no-op.
 *   2️⃣ Inspect the current view mode:
 *       - If `showCondensedView` → route to `filterAndStyleCondensedTable()`
 *       - Else → route to `filterAndStyleTable()`
 *   3️⃣ Log diagnostic info (which handler executed, number of rows affected, etc.).
 *
 * ⚙️ Integration Points:
 *   - Called by:
 *       → Control panel toggle buttons (renderFightHeader)
 *       → Player header clicks (both Detailed & Condensed)
 *       → Async buff repaint callbacks
 *   - Called automatically after table build by `renderDetailedTable()` and `renderCondensedTable()`
 *
 * 🧩 Safety & Guarantees:
 *   ✅ Idempotent — can be safely re-run any time
 *   ✅ No DOM rebuild — delegates to existing table structure
 *   ✅ Handles early calls gracefully (no table yet)
 *   ✅ Unified logging and error handling
 *
 * ⚠️ Implementation Notes:
 *   - This replaces the earlier `window.filterAndStyleCondensedTable` placeholder.
 *   - `filterAndStyleCondensedTable` must be imported at the top of this file:
 *
 *       import {
 *         renderCondensedTable,
 *         filterAndStyleCondensedTable,
 *       } from "./reportRendererCondensed.js";
 *
 * @param {FightState} fightState - Per-fight state container (table, filters, buffAnalysis)
 * @param {Object} report - Parsed report object (actors, fights, metadata)
 */
export function filterAndStyleCurrentView(fightState, report) {
  const filterState = fightState.filters;
  const table = fightState.tableEl;

  // 🧱 Guard: Table may not yet exist (e.g. header renders before table)
  if (!table) {
    console.debug(
      "[filterAndStyleCurrentView] No tableEl found — skipping filter update."
    );
    return;
  }

  try {
    if (filterState.showCondensedView) {
      // 🧩 Condensed (Grouped) View Path
      filterAndStyleCondensedTable(fightState, report);
      log.debug(
        `[filterAndStyleCurrentView] Condensed filter pass applied (auto=${filterState.showAutoAttacks}, bleeds=${filterState.showCombinedDots}, botched=${filterState.showBotchedMitigations})`
      );
    } else {
      // 🧩 Detailed View Path
      filterAndStyleDetailedTable(fightState, report);
      log.debug(
        `[filterAndStyleCurrentView] Detailed filter pass applied (auto=${filterState.showAutoAttacks}, bleeds=${filterState.showCombinedDots}, botched=${filterState.showBotchedMitigations})`
      );
    }
  } catch (err) {
    console.error("[filterAndStyleCurrentView] Filter routing failed:", err);
  }
}
