/**
 * reportRendererUtils.js
 *
 * Shared rendering helpers used across both the Detailed and Condensed (mini-table)
 * fight views. Designed to centralize DOM fragment generation logic so that
 * display of damage/mitigation data and related styling remains perfectly
 * consistent across view modes.
 *
 * All helpers here are **pure** (no DOM mutations outside their own node)
 * and side-effect–free. They take in structured data and return either
 * a ready-to-insert HTML string or an element.
 */

import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";

setModuleLogLevel("ReportRendererUtils", envLogLevel("info", "warn"));
const log = getLogger("ReportRendererUtils");

/**
 * Generate HTML for the damage cell in any table view (Detailed or Condensed).
 *
 * 🧩 Purpose:
 *   Render a single `<td>` containing damage, absorption, and mitigation info.
 *   Handles both actual and intended mitigation percentage display, depending
 *   on the user's filter toggles.
 *
 * 💡 Input assumptions:
 *   - The provided `event` object matches the schema from `fightTable.rows[...]`
 *     or from a condensed set's `children[]` array (identical shape).
 *   - The helper does **not** mutate the event object.
 *
 * 🧱 Output:
 *   A fully populated `<td class="damage-col">` DOM element ready to insert
 *   into a `<tr>`. Example rendered output:
 *
 *   ```
 *   <td class="damage-col">
 *     81793 → 59627<br>
 *     <span>A: 0 | (27% <span class="intended-mit">31%</span>)</span>
 *   </td>
 *   ```
 *
 * ⚙️ Filter Behavior:
 *   - If `filterState.showBotchedMitigations` is true, the helper will display
 *     the intended mitigation percentage (`event.intendedMitPct`) **only**
 *     when it is greater than the actual (`event.mitigationPct`).
 *   - If false, only the actual mitigation % is shown.
 *
 * 🚫 Exclusions:
 *   - Does not perform any filtering or visibility logic (handled upstream).
 *   - Does not format timestamps or actor names.
 *   - Does not handle buffs or vuln visuals — use buffAnalysis helpers for that.
 *
 * @param {Object} event - Damage event row (from fightTable or condensed.children)
 * @param {Object} filterState - Current FilterState (controls toggles)
 * @returns {HTMLTableCellElement} td - A fully populated damage `<td>` element
 */
export function createDamageCell(event, filterState) {
  const td = document.createElement("td");
  td.classList.add("damage-col");

  if (
    event.amount != null &&
    event.unmitigatedAmount != null &&
    event.mitigationPct != null
  ) {
    // Fallback for unknown values
    const unmit = event.unmitigatedAmount === 0 ? "?" : event.unmitigatedAmount;
    const absorbed = event.absorbed || 0;

    // Base mitigation text
    let mitDisplay = `${event.mitigationPct}%`;

    // Optionally append intended mitigation if higher than actual
    if (
      filterState.showBotchedMitigations &&
      typeof event.intendedMitPct === "number" &&
      event.intendedMitPct > event.mitigationPct
    ) {
      mitDisplay += ` <span class="intended-mit">${event.intendedMitPct}%</span>`;
    }

    td.innerHTML = `
      &nbsp;${unmit}&nbsp;→&nbsp;${event.amount}<br>
      <span>A: ${absorbed} | (${mitDisplay})</span>
    `;
  } else {
    td.textContent = "-";
  }

  log.debug(
    `[createDamageCell] ability="${event.ability}" actor="${event.actor}" ` +
      `mit=${event.mitigationPct}% intended=${event.intendedMitPct}% absorbed=${event.absorbed}`
  );

  return td;
}

/**
 * Update an *existing* damage cell (in-place repaint) when filter toggles change.
 *
 * 🧩 Purpose:
 *   Enables consistent repainting of damage cells when the user toggles
 *   “Show Botched Mitigations” without rebuilding the entire table.
 *
 * ✅ Safe for both Detailed and Condensed mini-table rows.
 *
 * @param {HTMLTableCellElement} tdDamage - The existing <td> element to repaint
 * @param {Object} event - Original event object used for this row
 * @param {Object} filterState - Current FilterState (controls toggles)
 */
export function repaintDamageCell(tdDamage, event, filterState) {
  if (!tdDamage) return;

  // Remove old intended mitigation display
  tdDamage.querySelectorAll(".intended-mit").forEach((el) => el.remove());

  // Repaint only if the toggle is active and data qualifies
  if (
    filterState.showBotchedMitigations &&
    typeof event.intendedMitPct === "number" &&
    event.intendedMitPct > event.mitigationPct
  ) {
    const baseSpan = tdDamage.querySelector("span");
    if (baseSpan) {
      const mitDisplay = `<span class="intended-mit">${event.intendedMitPct}%</span>`;
      const currentHTML = baseSpan.innerHTML;
      const insertIndex = currentHTML.lastIndexOf(")");
      if (insertIndex !== -1) {
        baseSpan.innerHTML =
          currentHTML.slice(0, insertIndex) +
          " " +
          mitDisplay +
          currentHTML.slice(insertIndex);
      } else {
        baseSpan.insertAdjacentHTML("beforeend", mitDisplay);
      }
    }
  }
}

/**
 * repaintAllDamageCells()
 * --------------------------------------------------------------
 * Bulk-repaint helper to apply Show Botched Mitigation toggles
 * across all visible rows in a given table.
 *
 * Intended for condensed mini-tables, but safe for any table structure.
 *
 * @param {HTMLTableElement} table - Target table (e.g., mini-detailed-table)
 * @param {Object} filterState - Active FilterState (controls toggles)
 */
export function repaintAllDamageCells(table, filterState) {
  if (!table) return;
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const tdDamage = row.querySelector(".damage-col");
    const event = row.__childEvent__;
    if (tdDamage && event) {
      repaintDamageCell(tdDamage, event, filterState);
    }
  });
}

/**
 * shouldHideEvent()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Centralized logic for determining whether an event (row or
 *   grouped attack set) should be hidden based on current filter
 *   settings for Auto-Attacks and DoTs/Bleeds.
 *
 * 🧠 Why:
 *   - Previously duplicated across:
 *       • filterAndStyleTable()
 *       • filterAndStyleCondensedTable()
 *       • updateMiniChildTable()
 *   - Each version defined its own `AUTO_ATTACK_NAMES` and
 *     manual string comparisons.
 *   - This helper unifies that logic for consistent visibility
 *     behavior across all table types.
 *
 * ⚙️ Behavior:
 *   - Case-insensitive comparison of ability name.
 *   - Hides if:
 *       1️⃣ Auto-attacks are disabled (`showAutoAttacks = false`)
 *           AND ability is “attack” or localized equivalent (“攻撃”).
 *       2️⃣ Bleeds/DoTs are disabled (`showCombinedDots = false`)
 *           AND ability name contains “dot” or “bleed”.
 *
 * 🧾 Usage Examples:
 *   if (shouldHideEvent(event.ability, filterState)) {
 *       row.style.display = "none";
 *       return;
 *   }
 *
 * @param {string} abilityName - The ability name to evaluate.
 * @param {FilterState} filterState - Current filter state toggles.
 * @returns {boolean} true if the event should be hidden; false otherwise.
 */
export function shouldHideEvent(abilityName, filterState) {
  if (!abilityName || !filterState) return false;

  const name = abilityName.toLowerCase().trim();
  const AUTO_ATTACK_NAMES = new Set(["attack", "攻撃"]);
  const isAutoAttack = AUTO_ATTACK_NAMES.has(name);
  const isBleed =
    name.includes("dot") ||
    name.includes("bleed") ||
    name.includes("damage over time");

  // 🚫 Hide based on toggle states
  if (
    (!filterState.showAutoAttacks && isAutoAttack) ||
    (!filterState.showCombinedDots && isBleed)
  ) {
    return true;
  }

  return false;
}

/**
 * renderBuffCell()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Generate consistent HTML for a player’s buff cell across all
 *   table types (Detailed, Condensed, Mini tables).
 *
 * 🧠 Why:
 *   - The same “resolve → color → render” logic was repeated
 *     in multiple places:
 *       • reportRendererDetailed.js (main table)
 *       • reportRendererCondensed.js (parent rows)
 *       • updateMiniChildTable() (mini tables)
 *   - This helper ensures *identical visual and logical behavior* everywhere.
 *
 * ⚙️ Behavior:
 *   - Resolves buffs → ability names if `showAbilitiesOnly` is true.
 *   - Applies color coding:
 *       🔴 Vulnerability  → "#b91c1c"
 *       ⚫ Known job buff → "#000000"
 *       🟢 Unknown/other  → "#228B22"
 *   - Accepts either:
 *       • raw buff list from fight event
 *       • pre-resolved display buff list
 *
 * 🧾 Example Usage:
 *   td.innerHTML = renderBuffCell({
 *     buffs: ["Reprisal", "Vulnerability Up"],
 *     actorSubType: "TANK",
 *     buffAnalysis,
 *     filterState,
 *   });
 *
 * @param {Object} params - Configuration object
 * @param {string[]} params.buffs - List of buff names for this cell
 * @param {string} params.actorSubType - Player's job/subtype (e.g. "TANK", "HEALER")
 * @param {Object} params.buffAnalysis - Buff analysis utility
 * @param {Object} params.filterState - Active FilterState (for showAbilitiesOnly toggle)
 * @returns {string} HTML string to inject into the cell
 */
export function renderBuffCell({
  buffs = [],
  actorSubType,
  buffAnalysis,
  filterState,
}) {
  if (!buffs || buffs.length === 0) return "";

  // Optionally resolve raw buffs → ability names
  const displayBuffs = filterState?.showAbilitiesOnly
    ? buffAnalysis.resolveBuffsToAbilities(buffs)
    : buffs;

  // Map buffs to styled HTML spans
  return displayBuffs
    .map((buff) => {
      const isVuln = buffAnalysis.isVulnerability(buff);
      const isJobBuff = buffAnalysis.isJobAbility(buff, actorSubType);

      let color = "#000";
      if (isVuln) color = "#b91c1c";
      else if (!isJobBuff) color = "#228B22";

      return `<div><span style="color:${color}">${buff}</span></div>`;
    })
    .join("");
}

/**
 * shouldShowRowForPlayerSelection()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Determine whether a given event, grouped set, or DOM row should
 *   remain visible when one or more players are selected in the filter.
 *
 * 🧠 Context:
 *   This helper is the single source of truth for player-selection
 *   visibility logic across **all view types**:
 *     • Detailed Table (per-event rows)
 *     • Condensed Parent Rows (group summaries)
 *     • Legacy Mini-Tables
 *     • 🆕 Inline Child Rows (`<tr class="child-event-row">`)
 *
 * ⚙️ Behavior Rules:
 *   - ✅ If no players are selected, all rows remain visible.
 *   - ✅ For parent condensed rows:
 *       Visible if **any** selected player in `set.players` has
 *       `{ wasTargeted: true }`.
 *   - ✅ For inline child rows (new structure):
 *       Visible if:
 *         → `row.dataset.actor` matches a selected player, **and**
 *         → `row.dataset.wasTargeted === "true"`.
 *   - ✅ For legacy mini-table `<tr>` rows:
 *       Same dataset logic (identical to inline).
 *   - ✅ For detailed event objects:
 *       Visible if `event.actor` (target) matches any selected player.
 *
 * 🚫 Hides:
 *   - Rows whose associated actor(s) are not part of the current
 *     `filterState.selectedPlayers` set.
 *   - Inline child rows that do not target a selected player.
 *
 * 🧩 Example Inputs:
 *   • Condensed Parent Row:  shouldShowRowForPlayerSelection(set, filterState)
 *   • Inline Child Row:      shouldShowRowForPlayerSelection(row, filterState)
 *   • Detailed Event:        shouldShowRowForPlayerSelection(event, filterState)
 *
 * @param {Object|HTMLElement} item - The row, set, or event to evaluate
 * @param {FilterState} filterState - Current global filter state
 * @returns {boolean} - true if row/set/event should remain visible
 */
export function shouldShowRowForPlayerSelection(item, filterState) {
  // 🧱 Case 1: No player selected → show all
  if (!filterState || filterState.selectedPlayers.size === 0) {
    return true;
  }

  const selectedPlayers = filterState.selectedPlayers;

  // ============================================================
  // 🧩 Case 2 — New Inline or Legacy Mini-Table <tr>
  // ============================================================
  if (item instanceof HTMLElement && item.dataset) {
    const actorName = item.dataset.actor || "";
    const wasTargeted = item.dataset.wasTargeted === "true";

    // 🧠 Behavior proof:
    // In inline rows, actorName comes directly from child.actor.
    // `wasTargeted` mirrors parent set.players[actor].wasTargeted.
    // Therefore this check reproduces identical semantics to parent filter.
    return actorName && wasTargeted && selectedPlayers.has(actorName);
  }

  // ============================================================
  // 🧩 Case 3 — Condensed Parent Set (grouped attacks)
  // ============================================================
  if (item.players) {
    const players = item.players || {};
    // Visible if any selected player participated as a target
    return Object.entries(players).some(
      ([name, data]) => selectedPlayers.has(name) && data.wasTargeted === true
    );
  }

  // ============================================================
  // 🧩 Case 4 — Detailed Table Event Object
  // ============================================================
  if (item.actor) {
    return selectedPlayers.has(item.actor);
  }

  // ============================================================
  // 🧩 Case 5 — Fallback (unknown structure)
  // ============================================================
  return true;
}

/**
 * attachStickyHeaderHighlight()
 * --------------------------------------------------------------
 * Shared hover → header highlight logic for all table views.
 *
 * Works with native CSS `position: sticky` headers (no frozen clones).
 * Automatically:
 *   • Highlights the corresponding <th> when hovering a targeted row.
 *   • Adds a small “Target” badge inside the header.
 *   • Cleans up on mouseleave.
 *
 * @param {HTMLTableElement} table - Target table (detailed, condensed, or mini)
 * @param {HTMLTableRowElement} row - The row to attach hover listeners to
 * @param {FilterState} filterState - Controls highlight toggle
 */
export function attachStickyHeaderHighlight(table, row, filterState) {
  row.addEventListener("mouseenter", () => {
    if (!filterState.enableColumnHighlight) return;

    const targetCell = row.querySelector(".target-cell");
    if (!targetCell) return;

    const cellIndex = Array.from(row.children).indexOf(targetCell);
    const headerCell = table.querySelector(
      `thead th:nth-child(${cellIndex + 1})`
    );
    if (!headerCell) return;

    headerCell.classList.add("highlight-header");

    if (!headerCell.querySelector(".target-label")) {
      const label = document.createElement("span");
      label.className = "target-label";
      label.textContent = "Target";
      headerCell.appendChild(label);
    }
  });

  row.addEventListener("mouseleave", () => {
    if (!filterState.enableColumnHighlight) return;

    table.querySelectorAll("thead th.highlight-header").forEach((th) => {
      th.classList.remove("highlight-header");
      const badge = th.querySelector(".target-label");
      if (badge) badge.remove();
    });
  });
}
