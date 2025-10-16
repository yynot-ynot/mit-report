/**
 * reportRendererCondensed.js
 *
 * Condensed grouped view renderer.
 * Each parent row shows Timestamp | Attack Name | [Player Buff Contributions].
 * Clicking expands a child mini-table of detailed attacks.
 */

import { formatRelativeTime } from "../utility/dataUtils.js";
import { getRoleClass, sortActorsByJob } from "../config/AppConfig.js";
import { updateResetButtonState } from "./reportRenderer.js";
import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";
import {
  createDamageCell,
  repaintDamageCell,
  shouldHideEvent,
  renderBuffCell,
  shouldShowRowForPlayerSelection,
  attachStickyHeaderHighlight,
  applyAdaptiveScrollPadding,
} from "./reportRendererUtils.js";

setModuleLogLevel("ReportRendererCondensed", envLogLevel("debug", "warn"));
const log = getLogger("ReportRendererCondensed");

/**
 * renderCondensedTable()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Builds and renders the **Condensed (Grouped)** Fight Table UI.
 *   Each parent row represents a grouped set of attacks (e.g., all “auto-attacks”),
 *   and each can be expanded to reveal *inline child event rows* directly below,
 *   instead of a nested “mini detailed table”.
 *
 * 🧠 Conceptual Overview:
 *   - Parent Rows:
 *       Columns → Timestamp | Attack Name | Player Buff Contributions
 *       • Represent grouped attack sets
 *       • Clickable to toggle expansion
 *
 *   - Child Event Rows (new structure):
 *       • Inserted directly beneath parent row (no nested <table>)
 *       • Columns → Timestamp | Damage | Player Buffs
 *       • Aligned perfectly with parent’s header columns
 *       • Filtering and styling identical to old mini-table behavior
 *
 * ⚙️ Behavior:
 *   - Each parent row toggles `.expanded` on click.
 *   - Expanding injects child `<tr class="child-event-row">` elements beneath.
 *   - Collapsing removes (or hides) those inline rows.
 *   - Multiple parents can be expanded simultaneously.
 *   - Filters apply uniformly to both parent and child rows.
 *
 * 🧩 Key Differences from Previous Implementation:
 *   ❌ No more `<tr class="child-row">` container or `<table class="mini-detailed-table">`.
 *   ✅ Child events now exist as `<tr class="child-event-row">` siblings to the parent.
 *   ✅ `insertChildEventRows()` handles construction + dataset tagging.
 *   ✅ `updateMiniChildTable()` filters inline rows seamlessly.
 *
 * 🧱 Integration:
 *   - Uses `filterAndStyleCondensedTable()` for global filtering.
 *   - Reuses `createDamageCell()`, `renderBuffCell()`, and `shouldShowRowForPlayerSelection()`.
 *   - Keeps column header and sorting logic identical.
 *
 * @param {FightState} fightState - The active fight’s full state (table, filters, buffAnalysis)
 * @param {Object} report - Parsed report data (actors, fights, metadata)
 * @param {HTMLElement} section - Parent DOM section to append into
 */
export function renderCondensedTable(fightState, report, section) {
  const condensedPull = fightState.condensedPull;
  const filterState = fightState.filters;

  // 🧩 Guard: Ensure data is available before proceeding
  if (!condensedPull || !Array.isArray(condensedPull.condensedSets)) {
    const msg = document.createElement("div");
    msg.textContent = "No condensed data available for this pull.";
    section.appendChild(msg);
    log.warn("[CondensedTable] Missing or invalid condensedPull data.");
    return;
  }

  // --- (1) Resolve & Sort Players ---
  const allActors = fightState.fightTable.friendlyPlayerIds
    .map((id) => report.actorById.get(id))
    .filter(
      (a) =>
        a &&
        a.type === "Player" &&
        a.name !== "Multiple Players" &&
        a.name !== "Limit Break"
    );
  const sortedActors = sortActorsByJob(allActors);

  log.info(
    `[CondensedTable] Rendering ${condensedPull.condensedSets.length} grouped sets for ${sortedActors.length} players`
  );

  // --- (2) Create Table Container ---
  const container = document.createElement("div");
  container.classList.add("time-table-container");

  const table = document.createElement("table");
  table.classList.add("time-table", "condensed-table");
  fightState.tableEl = table;

  // --- (3) Build Header ---
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th>Timestamp</th>
    <th>Attack Name</th>
  `;
  sortedActors.forEach((actor) => {
    const roleClass = getRoleClass(actor.subType);
    const th = document.createElement("th");
    th.className = roleClass;
    th.textContent = actor.name;

    // 🖱️ Click → Toggle player selection
    th.addEventListener("click", () => {
      filterState.togglePlayer(actor.name);
      log.debug(`[CondensedTable] Header click toggled player: ${actor.name}`);
      filterAndStyleCondensedTable(fightState, report);
    });

    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // --- (4) Build Table Body ---
  const tbody = document.createElement("tbody");

  for (const set of condensedPull.condensedSets) {
    // --- Parent Row ---
    const parentRow = document.createElement("tr");
    parentRow.classList.add("condensed-row");

    // Timestamp
    const tdTime = document.createElement("td");
    tdTime.textContent = formatRelativeTime(set.timestamp, 0);
    parentRow.appendChild(tdTime);

    // Attack Name
    const tdAbility = document.createElement("td");
    tdAbility.textContent = set.ability || "(Unknown)";
    parentRow.appendChild(tdAbility);

    // Per-player buff contributions
    sortedActors.forEach((actor) => {
      const td = document.createElement("td");
      td.classList.add(getRoleClass(actor.subType));

      const pData = set.players[actor.name];
      if (pData) {
        const buffs = pData.buffs || [];
        td.dataset.rawBuffs = JSON.stringify(buffs);

        td.innerHTML = renderBuffCell({
          buffs,
          actorSubType: actor.subType,
          buffAnalysis: fightState.buffAnalysis,
          filterState,
        });

        if (pData.dead) {
          td.style.color = "#6b7280";
          td.style.backgroundColor = "#f3f4f6";
        }
      }
      parentRow.appendChild(td);
    });

    tbody.appendChild(parentRow);

    // 🧩 🆕 Replace old child mini-table creation with inline insertion
    //     OLD CODE (DELETE):
    //       const childRow = document.createElement("tr");
    //       childRow.classList.add("child-row");
    //       ...
    //       childRow.appendChild(childCell);
    //       tbody.appendChild(childRow);
    //
    //     NEW CODE (BELOW):

    parentRow.addEventListener("click", () => {
      const expanded = parentRow.classList.toggle("expanded");

      // Collapse: hide existing inline child rows
      if (!expanded) {
        const existingChildren = tbody.querySelectorAll(
          `tr.child-event-row[data-parent-id="${set.id ?? set.timestamp}"]`
        );
        existingChildren.forEach((r) => r.remove());
        log.debug(`[CondensedTable] Collapsed "${set.ability}"`);
        return;
      }

      // Expand: inject new inline child rows
      log.debug(
        `[CondensedTable] Expanded "${set.ability}" → inserting inline child event rows`
      );
      const newRows = insertChildEventRows(set, parentRow, fightState, report);

      // Apply filters + styling immediately
      updateMiniChildTable(set, fightState, report, { inlineRows: newRows });
      filterAndStyleCondensedTable(fightState, report);
    });
  }

  table.appendChild(tbody);

  // --- (5) Assemble DOM Structure ---
  const wrapper = document.createElement("div");
  wrapper.classList.add("time-table-wrapper");
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  section.appendChild(container);

  // --- (6) Initial Filters + Highlights ---
  filterAndStyleCondensedTable(fightState, report);

  // --- (7) Header hover highlight ---
  const allParentRows = table.querySelectorAll("tbody tr.condensed-row");
  allParentRows.forEach((r) =>
    attachStickyHeaderHighlight(table, r, filterState)
  );

  // --- (8) Async Buff repaint ---
  fightState.buffAnalysis.waitForBuffLookups(() => {
    filterAndStyleCondensedTable(fightState, report);
  });

  // ============================================================
  // 🧩 Adaptive scroll padding for end-of-table visibility
  // ============================================================
  applyAdaptiveScrollPadding(wrapper, table);
}

/**
 * filterAndStyleCondensedTable()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Applies all active filters and styling rules to the **Condensed (Grouped)**
 *   fight table view — covering both:
 *     1️⃣ Parent condensed rows (group summaries)
 *     2️⃣ Their expanded children (legacy mini-tables or new inline rows)
 *
 * 🧠 Conceptual Overview:
 *   - Each parent <tr.condensed-row> = a grouped attack set.
 *   - Children can be:
 *       ❌ Old: <tr class="child-row"><table.mini-detailed-table>...</table></tr>
 *       ✅ New: multiple <tr class="child-event-row" data-parent-id="...">
 *
 * ⚙️ Unified Filtering Logic:
 *   1️⃣ Auto-Attacks & Bleeds — via shouldHideEvent()
 *   2️⃣ Player Selection — via shouldShowRowForPlayerSelection()
 *   3️⃣ Buff repainting (abilities-only toggle)
 *   4️⃣ Botched Mitigation visibility — via updateMiniChildTable()
 *   5️⃣ Header highlighting sync
 *
 * 🧩 DOM Rules:
 *   - Never rebuild the table — purely show/hide & repaint.
 *   - Expanding/collapsing handled by renderCondensedTable().
 *   - Multiple parents can remain expanded simultaneously.
 *   - Each child set filtered independently via updateMiniChildTable().
 *
 * 🚀 Enhancements:
 *   ✅ Automatically detects new inline structure
 *   ✅ Maintains support for older nested mini-table mode
 *   ✅ Ensures consistency across both render types
 *
 * @param {FightState} fightState - Current fight state (table, filters, buffAnalysis)
 * @param {Object} report - Parsed report data (actors, metadata)
 */
export function filterAndStyleCondensedTable(fightState, report) {
  const { filters: filterState, tableEl: table, condensedPull } = fightState;
  if (!table || !condensedPull) return;

  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  const parentRows = Array.from(tbody.querySelectorAll("tr.condensed-row"));
  if (parentRows.length === 0) return;

  const AUTO_ATTACK_NAMES = new Set(["attack", "攻撃"]);

  // --- Resolve players for consistent buff repaint + header updates ---
  const allActors = fightState.fightTable.friendlyPlayerIds
    .map((id) => report.actorById.get(id))
    .filter(
      (a) =>
        a &&
        a.type === "Player" &&
        a.name !== "Multiple Players" &&
        a.name !== "Limit Break"
    );
  const sortedActors = sortActorsByJob(allActors);

  let visibleCount = 0;
  let hiddenCount = 0;

  // ============================================================
  // 🧩 PASS 1 — Parent Row Filtering & Buff Repaint
  // ============================================================
  parentRows.forEach((row, idx) => {
    const set = condensedPull.condensedSets[idx];
    if (!set) return;

    const ability = set.ability?.toLowerCase() ?? "";
    const isHiddenByType = shouldHideEvent(ability, filterState);
    const isHiddenByPlayer = !shouldShowRowForPlayerSelection(set, filterState);

    // --- Hide logic ---
    if (isHiddenByType || isHiddenByPlayer) {
      row.classList.remove("expanded");
      row.style.display = "none";

      // Hide both legacy & inline children
      const legacyChild = row.nextElementSibling;
      if (legacyChild?.classList.contains("child-row")) {
        legacyChild.style.display = "none";
      }

      const inlineChildren = tbody.querySelectorAll(
        `tr.child-event-row[data-parent-id="${set.id ?? set.timestamp}"]`
      );
      inlineChildren.forEach((r) => (r.style.display = "none"));

      hiddenCount++;
      return;
    }

    // --- Visible parent ---
    row.style.display = "";
    visibleCount++;

    // --- Buff repaint (Abilities toggle) ---
    const playerCells = Array.from(row.querySelectorAll("td")).slice(2);
    playerCells.forEach((td, colIdx) => {
      const actor = sortedActors[colIdx];
      if (!actor) return;

      let rawBuffs = [];
      try {
        rawBuffs = JSON.parse(td.dataset.rawBuffs || "[]");
      } catch {
        rawBuffs = [];
      }

      td.innerHTML = renderBuffCell({
        buffs: rawBuffs,
        actorSubType: actor.subType,
        buffAnalysis: fightState.buffAnalysis,
        filterState,
      });
    });

    // ============================================================
    // 🧩 PASS 2 — Update Expanded Child Structures
    // ============================================================
    const isExpanded = row.classList.contains("expanded");

    // --- LEGACY mini-table support ---
    const legacyChild = row.nextElementSibling;
    if (legacyChild?.classList.contains("child-row")) {
      legacyChild.style.display = isExpanded ? "table-row" : "none";
      if (isExpanded) {
        const miniTable = legacyChild.querySelector(".mini-detailed-table");
        if (miniTable) {
          updateMiniChildTable(set, fightState, report, miniTable);
        }
      }
    }

    // --- NEW inline child-event-row support ---
    const inlineChildren = Array.from(
      tbody.querySelectorAll(
        `tr.child-event-row[data-parent-id="${set.id ?? set.timestamp}"]`
      )
    );
    if (inlineChildren.length > 0) {
      const mode = isExpanded ? "visible" : "hidden";
      inlineChildren.forEach(
        (r) => (r.style.display = mode === "visible" ? "" : "none")
      );

      if (isExpanded) {
        updateMiniChildTable(set, fightState, report, {
          inlineRows: inlineChildren,
        });
      }
    }
  });

  // ============================================================
  // 🧩 PASS 3 — Header Highlight Sync (Player Selection)
  // ============================================================
  const liveHeaders = table.querySelectorAll("thead th");
  sortedActors.forEach((actor, idx) => {
    const headerCell = liveHeaders[idx + 2]; // offset (timestamp + attack)
    if (
      filterState.selectedPlayers.size > 0 &&
      !filterState.selectedPlayers.has(actor.name)
    ) {
      headerCell?.classList.add("player-deselected");
    } else {
      headerCell?.classList.remove("player-deselected");
    }
  });

  // ============================================================
  // 🧩 PASS 4 — Header Sync for Legacy Mini-Tables
  // ============================================================
  const expandedMiniTables = table.querySelectorAll(
    "tr.child-row .mini-detailed-table"
  );
  expandedMiniTables.forEach((miniTable) => {
    const miniHeaders = miniTable.querySelectorAll("thead th");
    sortedActors.forEach((actor, idx) => {
      const headerCell = miniHeaders[idx + 3]; // 3 base columns (timestamp, attack, damage)
      if (
        filterState.selectedPlayers.size > 0 &&
        !filterState.selectedPlayers.has(actor.name)
      ) {
        headerCell?.classList.add("player-deselected");
      } else {
        headerCell?.classList.remove("player-deselected");
      }
    });
  });

  // ============================================================
  // 🧩 PASS 5 — Update Reset Button + Logging
  // ============================================================
  updateResetButtonState(filterState);

  log.debug(
    `[CondensedFilter] visible=${visibleCount}, hidden=${hiddenCount}, selectedPlayers=[${Array.from(
      filterState.selectedPlayers
    ).join(", ")}], showAuto=${filterState.showAutoAttacks}, showBleeds=${
      filterState.showCombinedDots
    }, showBotched=${filterState.showBotchedMitigations}`
  );
}

/**
 * updateMiniChildTable()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Unified filtering + repaint function for both legacy mini-tables
 *   and the new inline child-event-row structure under the Condensed Table view.
 *
 * 🧠 Conceptual Overview:
 *   - The legacy mode (mini-table):
 *       <tr class="child-row">
 *         <td><table class="mini-detailed-table">...</table></td>
 *       </tr>
 *
 *   - The new inline mode:
 *       <tr class="condensed-row" data-parent-id="42">...</tr>
 *       <tr class="child-event-row" data-parent-id="42">...</tr>
 *       <tr class="child-event-row" data-parent-id="42">...</tr>
 *
 *   - This function now detects which structure is provided and
 *     applies identical filtering, repaint, and styling behavior.
 *
 * ⚙️ Behavior:
 *   1️⃣ Hide rows matching disabled filters (auto-attacks, bleeds)
 *   2️⃣ Apply botched mitigation highlighting via repaintDamageCell()
 *   3️⃣ Repaint per-player buff cells using renderBuffCell()
 *   4️⃣ Enforce player-selection visibility via shouldShowRowForPlayerSelection()
 *   5️⃣ Maintain compatibility with both rendering modes
 *
 * 🧩 Input Parameters:
 *   @param {Object} condensedSet - One grouped attack window (set) from condensedPull
 *   @param {FightState} fightState - Current fight state (filters, buffAnalysis)
 *   @param {Object} report - Parsed report data (actors, metadata)
 *   @param {HTMLTableElement|Object} target - Either:
 *        → Legacy: <table class="mini-detailed-table">
 *        → New: { inlineRows: [<tr class="child-event-row">, ...] }
 *
 * 🧱 Implementation Notes:
 *   - Does not rebuild DOM; purely modifies visibility and repainting.
 *   - `shouldShowRowForPlayerSelection()` continues to use dataset.actor.
 *   - Works seamlessly regardless of expansion order or filter timing.
 *
 * 🚀 Key Enhancement:
 *   Unified handling for both display architectures, allowing smooth
 *   migration from mini-table → inline rows without breaking anything.
 *
 * @returns {void}
 */
export function updateMiniChildTable(condensedSet, fightState, report, target) {
  const { filters: filterState, buffAnalysis } = fightState;
  if (!condensedSet || !target) return;

  // --- Determine mode ---
  const isInlineMode = !!target.inlineRows;
  const rows = isInlineMode
    ? target.inlineRows
    : Array.from(target.querySelectorAll("tbody tr"));

  if (!rows || rows.length === 0) return;

  // --- Resolve player order for per-player buff repaint ---
  const allActors = fightState.fightTable.friendlyPlayerIds
    .map((id) => report.actorById.get(id))
    .filter(
      (a) =>
        a &&
        a.type === "Player" &&
        a.name !== "Multiple Players" &&
        a.name !== "Limit Break"
    );
  const sortedActors = sortActorsByJob(allActors);
  const AUTO_ATTACK_NAMES = new Set(["attack", "攻撃"]);

  log.debug(
    `[updateMiniChildTable] Mode=${
      isInlineMode ? "inline" : "legacy-mini"
    }, ability="${condensedSet.ability}", totalRows=${rows.length}`
  );

  // --- Apply per-row filters and repaint logic ---
  let visibleCount = 0;
  for (const row of rows) {
    // Inline rows store event data on __childEvent__
    const event =
      row.__childEvent__ ||
      (isInlineMode
        ? null
        : row.dataset.event
        ? JSON.parse(row.dataset.event)
        : null);
    const abilityName = event?.ability || row.cells[1]?.textContent || "";

    // 1️⃣ Auto-attack / Bleed filtering
    if (shouldHideEvent(abilityName, filterState)) {
      row.style.display = "none";
      continue;
    }

    // 2️⃣ Player selection filtering
    if (!shouldShowRowForPlayerSelection(row, filterState)) {
      row.style.display = "none";
      continue;
    }

    // ✅ Row is visible by default
    row.style.display = "";

    // 3️⃣ Damage Cell repaint
    const tdDamage = row.querySelector(".damage-col") || row.cells[1];
    if (tdDamage && event) {
      repaintDamageCell(tdDamage, event, filterState);
    }

    // 4️⃣ Buff repaint per-player column
    sortedActors.forEach((actor, idx) => {
      // Offset: timestamp + damage → player columns start at col 2
      const td = row.cells[idx + 2];
      if (!td) return;

      let rawBuffs = [];
      try {
        rawBuffs = JSON.parse(td.dataset.rawBuffs || "[]");
      } catch {
        rawBuffs = [];
      }

      td.innerHTML = renderBuffCell({
        buffs: rawBuffs,
        actorSubType: actor.subType,
        buffAnalysis,
        filterState,
      });
    });

    visibleCount++;
  }

  // --- Legacy mini-table visibility ---
  if (!isInlineMode) {
    const visibleRows = rows.filter((r) => r.style.display !== "none").length;
    target.style.display = visibleRows > 0 ? "table" : "none";
  }

  log.debug(
    `[updateMiniChildTable] "${
      condensedSet.ability
    }" → visible=${visibleCount}/${rows.length} (${
      isInlineMode ? "inline" : "mini"
    })`
  );
}

/**
 * insertChildEventRows()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Injects detailed child event rows *inline* beneath a condensed parent row
 *   instead of rendering a nested “mini detailed table”.
 *
 * 🧠 Conceptual Overview:
 *   - Replaces the old `<tr class="child-row"><td><table class="mini-detailed-table">`
 *     structure with **multiple `<tr class="child-event-row">` siblings** that
 *     follow the parent `<tr class="condensed-row">` directly.
 *
 *   - Each child-event-row is aligned with the parent table’s columns:
 *       • Child timestamp → Parent timestamp column
 *       • Child damage → Parent attack name column
 *       • Player buffs → Parent player columns
 *
 *   - Expansion/collapse logic:
 *       • Parent keeps `.expanded` toggle class.
 *       • Each child-event-row has `data-parent-id` for easy batch show/hide.
 *       • Multiple parents can be expanded simultaneously (no shared state).
 *
 * ⚙️ Filter Compatibility:
 *   Every filter works exactly as before:
 *     - Auto-attack / bleed visibility → via `shouldHideEvent(child.ability, filterState)`
 *     - Player selection → via `shouldShowRowForPlayerSelection(row, filterState)`
 *       (child rows attach `dataset.actor` + `dataset.wasTargeted`)
 *     - Botched mitigations → via `repaintDamageCell()`
 *     - Abilities-only view → via `renderBuffCell()`
 *
 * 🧩 DOM Shape Example:
 *   Before:
 *     <tr.condensed-row>...</tr>
 *     <tr.child-row><td colspan=...><table.mini-detailed-table>...</table></td></tr>
 *
 *   After:
 *     <tr.condensed-row data-parent-id="42">...</tr>
 *     <tr.child-event-row data-parent-id="42">...</tr>
 *     <tr.child-event-row data-parent-id="42">...</tr>
 *     ...
 *
 * 🧱 Responsibilities:
 *   - Create DOM rows for each `set.children[]` event.
 *   - Align their cells correctly with the parent table layout.
 *   - Tag with proper dataset metadata for unified filtering.
 *   - Attach hover highlight listeners (sticky header highlighting).
 *
 * 🚫 Does NOT:
 *   - Modify parent table headers
 *   - Handle filtering logic itself (deferred to `updateMiniChildTable()`)
 *   - Remove or collapse existing rows — that’s controlled by the parent click.
 *
 * @param {Object} set - One condensed attack group (from condensedPull.condensedSets[])
 * @param {HTMLTableRowElement} parentRow - The parent condensed-row element
 * @param {FightState} fightState - Current fight state (filters, buffAnalysis, etc.)
 * @param {Object} report - Parsed report data (actors, metadata)
 * @returns {HTMLTableRowElement[]} Array of inserted <tr class="child-event-row"> elements
 */
export function insertChildEventRows(set, parentRow, fightState, report) {
  const { filters: filterState, buffAnalysis } = fightState;
  const table = fightState.tableEl;
  if (!table || !parentRow || !set || !set.children) return [];

  const tbody = parentRow.parentElement;
  const sortedActors = (() => {
    const allActors = fightState.fightTable.friendlyPlayerIds
      .map((id) => report.actorById.get(id))
      .filter(
        (a) =>
          a &&
          a.type === "Player" &&
          a.name !== "Multiple Players" &&
          a.name !== "Limit Break"
      );
    return sortActorsByJob(allActors);
  })();

  const childRows = [];

  for (const child of set.children) {
    const row = document.createElement("tr");
    row.classList.add("child-event-row");
    row.dataset.parentId = set.id ?? set.timestamp;
    row.__childEvent__ = child;

    // --- dataset setup for filtering compatibility ---
    row.dataset.actor = child.actor || "";
    row.dataset.wasTargeted = String(
      !!(child.actor && set.players?.[child.actor]?.wasTargeted)
    );
    if (typeof child.intendedMitPct === "number") {
      row.dataset.intendedMit = child.intendedMitPct;
    }
    if (typeof child.mitigationPct === "number") {
      row.dataset.mitigationPct = child.mitigationPct;
    }

    // --- 1️⃣ Timestamp Cell (aligns under parent timestamp) ---
    const tdTime = document.createElement("td");
    tdTime.innerHTML = `<span class="timestamp-text">${formatRelativeTime(
      child.timestamp,
      0
    )}</span>`;
    row.appendChild(tdTime);
    // const tdTime = document.createElement("td");
    // tdTime.textContent = formatRelativeTime(child.timestamp, 0);
    // row.appendChild(tdTime);

    // --- 2️⃣ Damage Cell (aligns under parent attack name column) ---
    const tdDamage = createDamageCell(child, filterState);
    row.appendChild(tdDamage);

    // --- 3️⃣ Per-Player Buff Columns (aligned to parent columns) ---
    sortedActors.forEach((actor) => {
      const td = document.createElement("td");
      td.classList.add(getRoleClass(actor.subType));

      // Death coloring
      if (child.deaths && child.deaths.includes(actor.name)) {
        td.style.color = "#6b7280";
        td.style.backgroundColor = "#f3f4f6";
        row.appendChild(td);
        return;
      }

      const buffs = [];
      if (child.buffs) {
        for (const [buffName, appliers] of Object.entries(child.buffs)) {
          if (appliers.includes(actor.name)) buffs.push(buffName);
        }
      }

      td.dataset.rawBuffs = JSON.stringify(buffs);
      td.innerHTML = renderBuffCell({
        buffs,
        actorSubType: actor.subType,
        buffAnalysis,
        filterState,
      });

      // Target highlight
      if (child.actor === actor.name) td.classList.add("target-cell");

      row.appendChild(td);
    });

    // --- 4️⃣ Insert row right after parent (maintain order) ---
    tbody.insertBefore(row, parentRow.nextSibling);
    parentRow = row; // update reference for next insertion
    childRows.push(row);

    // --- 5️⃣ Hook hover highlight ---
    attachStickyHeaderHighlight(table, row, filterState);
  }

  // --- 6️⃣ Apply initial filter pass to new rows ---
  updateMiniChildTable(set, fightState, report, { inlineRows: childRows });

  return childRows;
}
