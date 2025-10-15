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
 * renderControlPanel()
 * --------------------------------------------------------------
 * 🧩 Purpose:
 *   Dynamically builds the control panel section that appears below
 *   each fight header title. It supports both:
 *     - Flat arrays of button definitions (legacy behavior)
 *     - Grouped objects with labeled categories (new layout)
 *
 * 💡 Layout Summary:
 *   The control panel is **center-aligned** and split into 3 labeled groups:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Filters        Analysis             Interaction / View       │
 *   │ [AutoAtk] [Bleeds]   [Buff Names] [Botched]   [Highlight] [View Mode] │
 *   │                                                  [Reset Player Filter] │
 *   └──────────────────────────────────────────────────────────────┘
 *
 *   - Groups are displayed side-by-side (horizontally centered).
 *   - Each group has a small label above its button cluster.
 *   - The "Interaction / View" group displays its Reset button
 *     on a second row for better balance and visual clarity.
 *
 * ⚙️ Behavior:
 *   - Toggle buttons flip between `labelOn` / `labelOff` text
 *     and trigger `onToggle(newState)`.
 *   - Action buttons (`type: "reset-player"`) remain static
 *     and trigger `onClick()` when applicable.
 *   - Button states update immediately, ensuring reactive UI.
 *
 * 🧱 Output DOM Structure:
 *   <div class="control-panel">
 *     <div class="control-group filters">
 *       <div class="group-label">Filters</div>
 *       <div class="group-buttons"> ...buttons... </div>
 *     </div>
 *     <div class="control-group analysis"> ... </div>
 *     <div class="control-group interaction"> ... </div>
 *   </div>
 *
 * 📁 Styling Notes:
 *   Corresponding CSS should define:
 *     - `.control-panel { display: flex; justify-content: center; }`
 *     - `.control-group { display: flex; flex-direction: column; align-items: center; }`
 *     - `.group-buttons { display: flex; justify-content: center; gap: 0.5rem; }`
 *     - `.interaction .group-buttons { flex-direction: column; }`
 *
 * @param {FilterState} filterState - Current filter state object (tracks toggle flags)
 * @param {Array|Object} groupsOrOptions - Either:
 *        • An array of button definitions (legacy flat layout)
 *        • An object with named groups: { filters: [], analysis: [], interaction: [] }
 * @returns {HTMLElement} controlPanel - Fully constructed control panel container
 */
export function renderControlPanel(filterState, groupsOrOptions) {
  const controlPanel = document.createElement("div");
  controlPanel.classList.add("control-panel");

  // 🧠 Determine structure type: grouped or flat
  const isGrouped =
    groupsOrOptions &&
    !Array.isArray(groupsOrOptions) &&
    typeof groupsOrOptions === "object";

  /**
   * 🧩 Internal helper to build a button element from definition.
   * Keeps legacy logic intact for toggles and reset buttons.
   */
  function createButton(opt) {
    const btn = document.createElement("button");

    if (opt.type === "reset-player") {
      // 🔹 Special: Reset Player Filter
      btn.textContent = opt.label;
      btn.className = "toggle-btn disable";
      btn.addEventListener("click", () => {
        if (filterState.selectedPlayers.size > 0) {
          opt.onClick();
        }
      });
      filterState.resetPlayerBtn = btn; // external reference
    } else {
      // 🔹 Normal toggle buttons
      const updateBtn = () => {
        btn.textContent = opt.state ? opt.labelOn : opt.labelOff;
        btn.className = opt.state ? "toggle-btn disable" : "toggle-btn enable";
      };
      btn.addEventListener("click", () => {
        opt.state = !opt.state;
        opt.onToggle(opt.state);
        updateBtn();
      });
      updateBtn();
    }

    return btn;
  }

  // ============================================================
  // 🧩 Case 1 — Grouped structure (new layout)
  // ============================================================
  if (isGrouped) {
    const groupOrder = ["filters", "analysis", "interaction"];
    const groupLabels = {
      filters: "Filters",
      analysis: "Analysis",
      interaction: "Interaction / View",
    };

    groupOrder.forEach((groupKey) => {
      const defs = groupsOrOptions[groupKey];
      if (!defs || defs.length === 0) return;

      const wrapper = document.createElement("div");
      wrapper.classList.add("control-group", groupKey);

      const labelEl = document.createElement("div");
      labelEl.className = "group-label";
      labelEl.textContent = groupLabels[groupKey];
      wrapper.appendChild(labelEl);

      const btnContainer = document.createElement("div");
      btnContainer.classList.add("group-buttons");

      // Render buttons inside this group
      defs.forEach((opt) => {
        const btn = createButton(opt);
        btnContainer.appendChild(btn);
      });

      // 🪄 Layout tweak for "interaction" group (2-row arrangement)
      if (groupKey === "interaction") {
        // Wrap last button ("Reset Player Filter") in its own line
        const buttons = btnContainer.querySelectorAll("button");
        if (buttons.length > 2) {
          const topRow = document.createElement("div");
          topRow.className = "interaction-top-row";
          topRow.append(buttons[0], buttons[1]);

          const bottomRow = document.createElement("div");
          bottomRow.className = "interaction-bottom-row";
          bottomRow.append(buttons[2]);

          btnContainer.innerHTML = ""; // clear
          btnContainer.append(topRow, bottomRow);
        }
      }

      wrapper.appendChild(btnContainer);
      controlPanel.appendChild(wrapper);
    });

    return controlPanel;
  }

  // ============================================================
  // 🧩 Case 2 — Flat array (legacy behavior)
  // ============================================================
  groupsOrOptions.forEach((opt) => {
    const btn = createButton(opt);
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
 * renderFightHeader()
 * --------------------------------------------------------------
 * 🧩 Purpose:
 *   Builds the fight header section containing:
 *     - The fight title (boss name + pull number)
 *     - A **centered, grouped control panel** of toggle buttons
 *       divided into three labeled categories:
 *         1️⃣ Filters
 *         2️⃣ Analysis
 *         3️⃣ Interaction / View
 *
 * 💡 Layout Summary:
 *   The control panel now has a *horizontal*, centered layout:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Filters        Analysis             Interaction / View   │
 *   │ [AutoAtk] [Bleeds]   [Buff Names] [Botched]   [Highlight] [View Mode] │
 *   │                                                [Reset Player Filter]   │
 *   └──────────────────────────────────────────────────────────┘
 *
 *   - Groups are visually labeled and horizontally centered.
 *   - “Reset Player Filter” sits below the Highlight/View buttons.
 *
 * ⚙️ Behavior Notes:
 *   - Toggles still call `filterAndStyleCurrentView()` for immediate DOM updates.
 *   - Structural toggles (Condensed ↔ Detailed view) trigger full re-render.
 *   - The “Show Buff Names” toggle corresponds to `filterState.showAbilitiesOnly`.
 *
 * 🧱 DOM Hierarchy:
 *   <div class="fight-header">
 *     <h4>Futures Rewritten (Pull: 13)</h4>
 *     <div class="control-panel">
 *       <div class="control-group filters"> ... </div>
 *       <div class="control-group analysis"> ... </div>
 *       <div class="control-group interaction"> ... </div>
 *     </div>
 *   </div>
 *
 * @param {FightState} fightState - Per-fight state container (filters, table, etc.)
 * @param {Object} report - Parsed report data
 * @param {Function} reRenderCallback - Function to re-render when structure changes
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
  headerContainer.appendChild(titleEl);

  // --- Build grouped control panel ---
  // 3 logical groups: Filters, Analysis, Interaction/View
  const controlPanel = document.createElement("div");
  controlPanel.classList.add("control-panel");

  // ====== 1️⃣ Filters Group ======
  const filtersGroup = renderControlPanel(filterState, [
    {
      labelOn: "Hide Auto-Attacks",
      labelOff: "Show Auto-Attacks",
      state: filterState.showAutoAttacks,
      onToggle: (newState) => {
        filterState.showAutoAttacks = newState;
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
  ]);
  const filtersLabel = document.createElement("div");
  filtersLabel.className = "group-label";
  filtersLabel.textContent = "Filters";
  const filtersWrapper = document.createElement("div");
  filtersWrapper.className = "control-group filters";
  filtersWrapper.append(filtersLabel, filtersGroup);

  // ====== 2️⃣ Analysis Group ======
  const analysisGroup = renderControlPanel(filterState, [
    {
      labelOn: "Show Ability Names",
      labelOff: "Show Buff Names",
      state: filterState.showAbilitiesOnly,
      onToggle: (newState) => {
        filterState.showAbilitiesOnly = newState;
        filterAndStyleCurrentView(fightState, report);
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
  ]);
  const analysisLabel = document.createElement("div");
  analysisLabel.className = "group-label";
  analysisLabel.textContent = "Analysis";
  const analysisWrapper = document.createElement("div");
  analysisWrapper.className = "control-group analysis";
  analysisWrapper.append(analysisLabel, analysisGroup);

  // ====== 3️⃣ Interaction / View Group ======
  const interactionGroup = renderControlPanel(filterState, [
    {
      labelOn: "Disable Target Highlight",
      labelOff: "Enable Target Highlight",
      state: filterState.enableColumnHighlight,
      onToggle: (newState) => {
        filterState.enableColumnHighlight = newState;
        // ⚙️ Highlight only affects hover interaction, no re-filter needed
      },
    },
    {
      labelOn: "Show Detailed Table", // when condensed view active
      labelOff: "Show Condensed Table", // when detailed view active
      state: filterState.showCondensedView,
      onToggle: (newState) => {
        filterState.showCondensedView = newState;
        log.info(`[ControlPanel] Condensed view → ${newState ? "ON" : "OFF"}`);
        reRenderCallback(fightState); // full rebuild
      },
    },
    {
      type: "reset-player",
      label: "Reset Player Filter",
      state: false,
      onClick: () => {
        filterState.resetPlayers();
        filterAndStyleCurrentView(fightState, report);
        updateResetButtonState(filterState);
      },
    },
  ]);
  const interactionLabel = document.createElement("div");
  interactionLabel.className = "group-label";
  interactionLabel.textContent = "Interaction / View";
  const interactionWrapper = document.createElement("div");
  interactionWrapper.className = "control-group interaction";
  interactionWrapper.append(interactionLabel, interactionGroup);

  // --- Assemble final control panel ---
  controlPanel.append(filtersWrapper, analysisWrapper, interactionWrapper);

  // --- Add to header ---
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
