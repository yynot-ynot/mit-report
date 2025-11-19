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
import { getKnownBuffJob } from "../config/knownBuffJobs.js";
import { AUTO_ATTACK_NAMES } from "../config/AppConfig.js";

setModuleLogLevel("ReportRendererUtils", envLogLevel("info", "warn"));
const log = getLogger("ReportRendererUtils");

const MIT_AVAILABILITY_WRAPPER_CLASS = "mit-availability-wrapper";
const MIT_AVAILABILITY_CONTENT_CLASS = "mit-availability-content";
const MIT_AVAILABILITY_LAYER_CLASS = "mit-availability-layer";
const MIT_AVAILABILITY_DOT_CONTAINER_CLASS = "mit-availability-dot-container";
const MIT_AVAILABILITY_TOOLTIP_CLASS = "mit-availability-tooltip";
const MIT_AVAILABILITY_TOOLTIP_GRID_CLASS = "mit-availability-tooltip-grid";
const MAX_MIT_DOT_ROWS = 3;

const mitigationIconCache = new Map();
let mitigationHelperPromise = null;

function loadMitigationHelperModules() {
  if (!mitigationHelperPromise) {
    mitigationHelperPromise = Promise.all([
      import("../config/AppConfig.js"),
      import("../utility/jobConfigHelper.js"),
    ]).then(([appConfig, jobHelper]) => ({
      loadJobConfig: appConfig.loadJobConfig,
      getMitigationAbilityNames: jobHelper.getMitigationAbilityNames,
    }));
  }
  return mitigationHelperPromise;
}

/**
 * Resolve the friendly phase name for a fight using stored metadata.
 *
 * @param {Object} fight - Fight metadata record containing lastPhase fields.
 * @param {Map} phaseNamesByEncounter - Encounter → ordered phase name list.
 * @returns {string|null} Best-effort phase name.
 */
export function resolvePhaseName(fight, phaseNamesByEncounter) {
  if (!fight) {
    return null;
  }

  if (typeof fight.lastPhaseName === "string" && fight.lastPhaseName.length) {
    return fight.lastPhaseName;
  }

  const phaseNames =
    phaseNamesByEncounter instanceof Map
      ? phaseNamesByEncounter.get(fight.encounterID)
      : null;

  if (Array.isArray(phaseNames) && phaseNames.length > 0) {
    const absoluteIdx =
      Number.isFinite(fight.lastPhaseAsAbsoluteIndex) &&
      fight.lastPhaseAsAbsoluteIndex >= 0
        ? fight.lastPhaseAsAbsoluteIndex
        : null;
    const relativeIdx =
      Number.isFinite(fight.lastPhase) && fight.lastPhase > 0
        ? fight.lastPhase - 1
        : null;

    const resolvedIdx =
      absoluteIdx != null && phaseNames[absoluteIdx]
        ? absoluteIdx
        : relativeIdx;

    if (resolvedIdx != null && phaseNames[resolvedIdx]) {
      return phaseNames[resolvedIdx];
    }
  }

  return null;
}

/**
 * Produce a compact phase label (e.g., "P3" or "I") for pull summaries.
 *
 * @param {Object} fight - Fight metadata record.
 * @param {Map} phaseNamesByEncounter - Encounter → ordered phase name list.
 * @returns {string|null} Phase tag suitable for inline UI. Intentionally returns
 *   null when no phase metadata exists so the caller omits the tag entirely.
 */
export function formatPhaseTag(fight, phaseNamesByEncounter) {
  const phaseName = resolvePhaseName(fight, phaseNamesByEncounter);
  if (!phaseName) {
    return null;
  }

  const match = phaseName.match(/(P\d+)/i);
  if (match) {
    return match[1].toUpperCase();
  }

  const trimmed = phaseName.trim();
  if (trimmed.length > 0) {
    return trimmed.charAt(0).toUpperCase();
  }

  return null;
}

/**
 * Normalize a fight-scoped mutually exclusive mitigation map into a Map instance.
 *
 * @param {Map|string[][]|Object|null} mapLike - Map or plain object keyed by groupId.
 * @returns {Map<string, {abilityName: string, normalizedAbility?: string}>|null}
 */
function normalizeExclusiveAbilityMap(mapLike) {
  if (!mapLike) return null;
  if (mapLike instanceof Map) return mapLike;
  if (typeof mapLike !== "object") return null;
  return new Map(Object.entries(mapLike));
}

/**
 * Build a deterministic cache key fragment for a mutually exclusive mitigation map.
 *
 * @param {Map<string, {abilityName: string}>} exclusiveMap - Normalized selection map.
 * @returns {string|null} Stable string representing the selected abilities, or null if empty.
 */
function buildExclusiveMapCacheKey(exclusiveMap) {
  if (!(exclusiveMap instanceof Map) || exclusiveMap.size === 0) {
    return null;
  }

  return Array.from(exclusiveMap.entries())
    .map(([groupId, selection]) => `${groupId}:${selection?.abilityName || ""}`)
    .sort()
    .join(",");
}

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
  const isAutoAttack = AUTO_ATTACK_NAMES.has(name);
  const isBleed =
    name.includes("dot") ||
    name.includes("bleed") ||
    name.includes("dark vengeance") ||
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
  botchedBuffs = [],
  botchedActive = false,
}) {
  if (!buffs || buffs.length === 0) return "";

  const showBotched = !!botchedActive && !!filterState?.showBotchedMitigations;

  // Optionally resolve raw buffs → ability names
  const displayBuffs = filterState?.showAbilitiesOnly
    ? buffAnalysis.resolveBuffsToAbilities(buffs)
    : buffs;

  const botchedSet = new Set(
    (botchedBuffs || []).map((name) => name.toLowerCase())
  );

  // Map buffs to styled HTML spans
  return displayBuffs
    .map((buff, idx) => {
      const isVuln = buffAnalysis.isVulnerability(buff);
      const isJobBuff = buffAnalysis.isJobAbility(buff, actorSubType);
      const sourceBuffName = buffs[idx] ?? buff;
      const isBotched =
        showBotched && botchedSet.has(sourceBuffName.toLowerCase());

      let color = "#000";
      if (isVuln) color = "#b91c1c";
      else if (!isJobBuff) color = "#228B22";

      if (isBotched) {
        color = "#6b7280"; // subdued gray
      }

      const styles = [`color:${color}`];
      if (isBotched) {
        styles.push("text-decoration: line-through");
        styles.push("text-decoration-color: #374151");
        styles.push("text-decoration-thickness: 2px");
      }

      return `<div><span style="${styles.join(";")}">${buff}</span></div>`;
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

/**
 * applyAdaptiveScrollPadding()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Dynamically adds bottom padding to a scrollable table wrapper
 *   (usually `.time-table-wrapper`) so the last rows aren’t clipped
 *   when scrolled to the bottom.
 *
 * 💡 Why:
 *   Fixed padding (e.g. `16rem`) doesn't adapt to varying table lengths.
 *   This function measures the rendered table height and computes an
 *   adaptive "scroll buffer" that scales proportionally.
 *
 * ⚙️ Behavior:
 *   - Waits until the browser has painted the table (via requestAnimationFrame).
 *   - Measures the table’s total scroll height once layout is stable.
 *   - Adds bottom padding to the wrapper equal to a configurable % of the height.
 *   - Automatically retries measurement if tableHeight is 0 (e.g. async render).
 *   - Clamps padding between defined min and max pixel values.
 *   - Safe for repeated calls (updates existing padding idempotently).
 *
 * 🧩 Example:
 *   const wrapper = container.querySelector('.time-table-wrapper');
 *   applyAdaptiveScrollPadding(wrapper);
 *
 * 🪄 Notes:
 *   - Works for both **Detailed** and **Condensed** renderers.
 *   - Reacts gracefully to async updates (filters, buffs, etc.).
 *   - Should be called *after* table is appended to the DOM.
 *   - Padding is applied to the wrapper, not the table itself.
 *
 * @param {HTMLElement} wrapper - The scrollable wrapper element (e.g. `.time-table-wrapper`)
 * @param {HTMLElement} [table] - Optional table element to measure. Defaults to first `<table>` inside wrapper.
 * @param {Object} [options] - Optional configuration overrides.
 * @param {number} [options.ratio=0.12] - Fraction of table height used as padding (12% by default).
 * @param {number} [options.min=100] - Minimum padding in pixels.
 * @param {number} [options.max=320] - Maximum padding in pixels.
 */
export function applyAdaptiveScrollPadding(wrapper, table, options = {}) {
  if (!wrapper) return;

  const config = {
    ratio: options.ratio ?? 0.12,
    min: options.min ?? 100,
    max: options.max ?? 320,
  };

  const targetTable = table || wrapper.querySelector("table");
  if (!targetTable) return;

  // ✅ Delay measurement until after next paint cycle
  requestAnimationFrame(() => {
    // Sometimes table updates asynchronously (filters, buffs, etc.)
    // So check again a bit later to ensure proper height
    const measureAndApply = () => {
      const tableHeight =
        targetTable.scrollHeight || targetTable.offsetHeight || 0;

      if (tableHeight === 0) {
        // Recheck shortly if layout isn't ready yet
        setTimeout(measureAndApply, 100);
        return;
      }

      const buffer = Math.min(
        Math.max(tableHeight * config.ratio, config.min),
        config.max
      );

      wrapper.style.paddingBottom = `${buffer}px`;

      console.debug(
        `[applyAdaptiveScrollPadding] ✅ Table height=${tableHeight}px → padding=${buffer}px`
      );
    };

    measureAndApply();
  });
}

/**
 * getDamageTypeIconHTML()
 * --------------------------------------------------------------
 * Returns an HTML <img> element string for a given damage type.
 *
 * @param {"physical"|"magical"|"unique"|null} damageType - The attack's damage type
 * @param {Object} [options] - Optional configuration
 * @param {boolean} [options.includeSpacing=true] - Adds small margin spacing
 * @returns {string} - HTML string for the icon (may be empty if damageType is null)
 */
export function getDamageTypeIconHTML(damageType, options = {}) {
  const includeSpacing = options.includeSpacing !== false;

  if (!damageType) return "";

  const iconMap = {
    physical: "js/config/damage_icons/Physical_Damage_Icon.png",
    magical: "js/config/damage_icons/Magic_Damage_Icon.png",
    unique: "js/config/damage_icons/Unique_Damage_Icon.png",
  };

  const src = iconMap[damageType];
  if (!src) return "";

  const spacing = includeSpacing ? "margin: 0 0.25rem;" : "";

  return `<img src="${src}" alt="${damageType} icon" style="height: 1em; vertical-align: middle; ${spacing}">`;
}

/**
 * logCrossJobBuffAnomalies()
 * --------------------------------------------------------------
 * 🧠 Purpose:
 *   Detects and logs cases where a player (target) has buffs applied
 *   that normally belong to a *different job family*, according to
 *   `knownBuffJobs.js`, **and** the event has no recorded buff source.
 *
 * 💡 Why:
 *   Helps diagnose missing buff-source attribution (e.g., "Panhaima"
 *   showing on DarkKnight with no Sage applier). This catches
 *   mismatched job→buff pairings that likely indicate a resolution issue.
 *
 * ⚙️ Behavior:
 *   - Iterates over each buff for the target player.
 *   - For each buff, retrieves known associated jobs from KNOWN_BUFF_JOBS.
 *   - If the buff’s known job list does *not* include the actor’s job
 *     and there is *no valid applier*, logs a warning.
 *
 * 🧾 Example Log:
 *   [ReportRendererCondensed] [WARN] [CrossJobBuffMissingSource]
 *   timestamp=102591, ability="Combined DoTs", target="Apple Crunch" (job=DarkKnight)
 *   → cross-job buffs=["Panhaima","Temperance"] with no applier.
 *
 * @param {Object} params
 * @param {Object} params.set - Condensed set (parent row object)
 * @param {Object} params.actor - The player (target) object { name, subType }
 * @param {string[]} params.buffs - List of buff names on this target
 * @param {string|null} params.firstApplier - Name of the first buff source (if any)
 * @param {Object} params.report - Parsed report (for logging context)
 * @param {Object} [params.logger=console] - Optional logger (default: console)
 */
export function logCrossJobBuffAnomalies({
  set,
  actor,
  buffs,
  firstApplier,
  report,
  logger = getLogger("ReportRendererCondensed"),
}) {
  if (!buffs || buffs.length === 0 || !actor) return;

  const crossJobBuffs = buffs.filter((b) => {
    const knownJobs = getKnownBuffJob?.(b);
    // Only consider if buff has a defined job list
    return (
      knownJobs &&
      !knownJobs.some(
        (j) =>
          j.trim().toLowerCase().replace(/\s+/g, "") ===
          actor.subType.trim().toLowerCase().replace(/\s+/g, "")
      )
    );
  });

  // Only log if cross-job buffs exist AND no applier found
  if (crossJobBuffs.length > 0 && !firstApplier) {
    logger.warn(
      `[ReportRendererCondensed] [WARN] [CrossJobBuffMissingSource] ` +
        `timestamp=${set.timestamp}, ability="${set.ability}", ` +
        `target="${actor.name}" (${actor.subType}) has cross-job buffs ` +
        `${JSON.stringify(crossJobBuffs)} but no applier found.`,
      set
    );
  }
}

/**
 * getMitigationAbilityIcons()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Given a job name (e.g. "Dark Knight"), fetch all mitigation
 *   ability icons from the job’s configuration and mitigation dataset.
 *
 * 🧠 Data Sources:
 *   - mitigationDataset.mitigationEffects[jobName] provides the list
 *     of mitigation abilities for that job.
 *   - loadJobConfig(jobName) (from AppConfig.js) provides the full job
 *     ability data, including icon URLs.
 *
 * ⚙️ Behavior:
 *   - Resolves each mitigation ability name to its icon URL from the
 *     job’s config object.
 *   - Skips abilities that do not have icons or that are missing from config.
 *   - Returns an array of objects: [{ name, icon_url }, ...].
 *
 * 🧾 Example Output:
 *   getMitigationAbilityIcons("Dark Knight") → [
 *     { name: "Shadow Wall", icon_url: "https://..." },
 *     { name: "Dark Mind", icon_url: "https://..." },
 *     ...
 *   ]
 *
 * @param {string} jobName - Full display name, e.g. "Dark Knight"
 * @param {Object} [options]
 * @param {number|string|null} [options.fightId=null] - Fight identifier used for caching and selection.
 * @param {Map|Object|null} [options.exclusiveAbilityMap=null] - Fight-specific mutually exclusive selection map.
 * @returns {Array<{name: string, icon_url: string}>} - Array of mitigation icons
 */
export async function getMitigationAbilityIcons(jobName, options = {}) {
  if (!jobName) return [];

  const fightId =
    options?.fightId == null ? null : String(options.fightId ?? "");
  const exclusiveMap = normalizeExclusiveAbilityMap(
    options?.exclusiveAbilityMap || null
  );
  const exclusiveKeyFragment = buildExclusiveMapCacheKey(exclusiveMap);

  let cacheKey = jobName;
  if (fightId) {
    cacheKey = `${jobName}::fight::${fightId}`;
  } else if (exclusiveKeyFragment) {
    cacheKey = `${jobName}::exclusive::${exclusiveKeyFragment}`;
  }

  if (mitigationIconCache.has(cacheKey)) {
    return mitigationIconCache.get(cacheKey);
  }

  const helpers = await loadMitigationHelperModules();
  const abilityNames = helpers.getMitigationAbilityNames(jobName, {
    fightId,
    exclusiveAbilityMap: exclusiveMap,
  });
  if (!abilityNames || abilityNames.length === 0) {
    mitigationIconCache.set(cacheKey, []);
    return [];
  }

  const jobConfig = helpers.loadJobConfig(jobName);
  if (!jobConfig || !jobConfig.actions) {
    mitigationIconCache.set(cacheKey, []);
    return [];
  }

  const icons = [];
  for (const abilityName of abilityNames) {
    const action = jobConfig.actions[abilityName];
    if (action && action.icon_url) {
      icons.push({
        name: abilityName,
        icon_url: action.icon_url,
      });
    }
  }

  mitigationIconCache.set(cacheKey, icons);
  return icons;
}

/**
 * buildMitigationIconRow()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Build a visual row of mitigation ability icons for each player’s job.
 *   Designed to appear *below the player header row* in both the
 *   Detailed and Condensed fight tables.
 *
 * 🧠 Behavior:
 *   - Creates a new <tr class="mitigation-row"> DOM element.
 *   - The first columns (Timestamp, Attack Name, [Damage]) remain
 *     empty placeholders. (2 for Condensed, 3 for Detailed)
 *   - For each player in sortedActors:
 *       → Determine their job via `actor.subType`.
 *       → Fetch that job’s mitigation ability icons using
 *         `getMitigationAbilityIcons()`.
 *       → Deduplicate mitigation abilities by name.
 *       → Render icons (<img>) grouped in rows of 5 per line.
 *   - Each icon includes both `title` and `alt` attributes showing the ability name.
 *   - Each cell uses the job’s role color class (via `getRoleClass()`).
 *   - Icons are rendered in multiple lines if a job has more than 5 mitigation abilities.
 *
 * 🧱 Output Example:
 *   <tr class="mitigation-row">
 *     <td></td><td></td><td></td>
 *     <td class="tank-col">
 *       <div class="mitigation-icon-line">
 *         <img src="..." title="Shadow Wall">
 *         <img src="..." title="Dark Mind">
 *         <img src="..." title="The Blackest Night">
 *         <img src="..." title="Dark Missionary">
 *         <img src="..." title="Rampart">
 *       </div>
 *       <div class="mitigation-icon-line">
 *         <img src="..." title="Reprisal">
 *       </div>
 *     </td>
 *     <td class="healer-col">
 *       <div class="mitigation-icon-line">
 *         <img src="..." title="Temperance">
 *       </div>
 *     </td>
 *   </tr>
 *
 * @param {Array<Object>} sortedActors - Players sorted by job order
 * @param {Object} report - Report object (used for job lookup)
 * @param {number} offset - Number of non-player columns preceding player headers (e.g., 2 for condensed, 3 for detailed)
 * @param {Object|null} fightTable - Fight table supplying fightId + mutually exclusive selections.
 * @returns {HTMLTableRowElement} - Fully constructed mitigation icon row
 */
export async function buildMitigationIconRow(
  sortedActors,
  report,
  offset = 2,
  fightTable = null
) {
  const { getRoleClass } = await import("../config/AppConfig.js");

  const row = document.createElement("tr");
  row.classList.add("mitigation-row");

  // Detect table type (Condensed = 2 placeholders, Detailed = 3)
  const columnCount =
    sortedActors.length > 0 &&
    report?.fightTable?.condensedPull == null &&
    report?.fightTable?.rows
      ? 3
      : 2;

  // Add empty placeholder cells
  for (let i = 0; i < offset; i++) {
    const td = document.createElement("td");
    td.textContent = "";
    row.appendChild(td);
  }

  const iconOptions = {
    fightId: fightTable?.fightId ?? report?.fightTable?.fightId ?? null,
    exclusiveAbilityMap:
      fightTable?.mutuallyExclusiveMitigationMap ??
      report?.fightTable?.mutuallyExclusiveMitigationMap ??
      null,
  };

  // Build player icon cells
  for (const actor of sortedActors) {
    const td = document.createElement("td");
    const roleClass = getRoleClass(actor.subType);
    td.classList.add(roleClass);

    const icons = await getMitigationAbilityIcons(actor.subType, iconOptions);

    if (icons.length > 0) {
      // 🧹 Deduplicate icons by ability name
      const seen = new Set();
      const uniqueIcons = icons.filter((icon) => {
        if (seen.has(icon.name)) return false;
        seen.add(icon.name);
        return true;
      });

      // 🧩 Wrap icons after every 5 → multiple lines per player cell
      for (let i = 0; i < uniqueIcons.length; i += 5) {
        const lineDiv = document.createElement("div");
        lineDiv.classList.add("mitigation-icon-line");

        uniqueIcons.slice(i, i + 5).forEach((icon) => {
          const img = document.createElement("img");
          img.src = icon.icon_url;
          img.title = icon.name; // hover tooltip
          img.alt = icon.name;
          img.classList.add("mitigation-icon");
          lineDiv.appendChild(img);
        });

        td.appendChild(lineDiv);
      }
    }

    row.appendChild(td);
  }

  return row;
}

/**
 * renderAvailableMitigationIcons()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Augment a player cell with a compact “availability” indicator that shows
 *   which mitigation abilities are currently off cooldown. The indicator uses a
 *   grid of colored dots (top→down, right→left) to keep table rows compact while
 *   providing a hover/focus tooltip that lists the full icon + ability name pairs.
 *
 * 🧠 Behavior:
 *   - Preserves existing cell content (buff summaries, text) by wrapping it in
 *     a flex container alongside the mitigation layer.
 *   - Reuses `getMitigationAbilityIcons(jobName)` to resolve ability → icon URL.
 *     Icons are expected to be cached already via `buildMitigationIconRow`.
 *   - When no abilities are available (or the feature is toggled off), the helper
 *     simply restores the original content and removes any previous mitigation layer.
 *   - Hovering/focusing the dot cluster reveals a tooltip labeled “Available
 *     Mitigations” with a two-column icon/name layout for quick identification.
 *   - Missing icons fall back to a neutral placeholder block while logging a warning.
 *
 * ⚠️ Notes:
 *   - Intended for both condensed parent rows and detailed rows; pass an empty array
 *     to remove any existing indicator (e.g., when hiding the feature).
 *   - Invocations are idempotent; subsequent calls rebuild the layer based on the
 *     latest `availableMitigations` data without accumulating DOM nodes.
 *
 * @param {HTMLTableCellElement} cell - Target table cell for the player column.
 * @param {string} jobName - Player job (subType) used to resolve mitigation icons.
 * @param {string[]} availableMitigations - Ordered list of mitigation ability names.
 * @param {Object} [options]
 * @param {number|string|null} [options.fightId=null] - Fight identifier for caching selection data.
 * @param {Map|Object|null} [options.exclusiveAbilityMap=null] - Fight-scoped mutually exclusive selections.
 * @returns {Promise<void>} Resolves once the icon layer has been updated.
 */
export async function renderAvailableMitigationIcons(
  cell,
  jobName,
  availableMitigations = [],
  options = {}
) {
  if (!cell) return;

  // Preserve the current cell markup so we can rebuild the wrapper without
  // temporarily clearing the cell (prevents layout jumps while promises resolve).
  const baseHTML = snapshotCellContent(cell);
  const hadWrapper =
    cell.querySelector(`.${MIT_AVAILABILITY_WRAPPER_CLASS}`) !== null;

  // Deduplicate / sanitize the list before doing any async work.
  const sanitizedNames = [];
  const seen = new Set();
  if (Array.isArray(availableMitigations)) {
    for (const ability of availableMitigations) {
      if (typeof ability !== "string") continue;
      const trimmed = ability.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      sanitizedNames.push(trimmed);
    }
  }

  // Always ensure every cell has a consistent wrapper structure,
  // even if there are no available mitigations.
  if (!jobName || sanitizedNames.length === 0) {
    cell.textContent = ""; // clear to rebuild cleanly

    const wrapper = document.createElement("div");
    wrapper.classList.add(MIT_AVAILABILITY_WRAPPER_CLASS);

    const contentWrapper = document.createElement("div");
    contentWrapper.classList.add(MIT_AVAILABILITY_CONTENT_CLASS);
    contentWrapper.innerHTML = baseHTML;

    // No layer added — empty grid position
    wrapper.appendChild(contentWrapper);

    cell.appendChild(wrapper);

    delete cell.dataset.mitLayerToken;
    return; // exit early to skip mitigation icon building
  }

  const renderToken = `${Date.now()}-${Math.random()}`;
  cell.dataset.mitLayerToken = renderToken;

  try {
    // Cached resolver fetches the icon set for the job only once.
    const icons = await getMitigationAbilityIcons(jobName, options);
    if (cell.dataset.mitLayerToken !== renderToken) {
      return;
    }

    const iconMap = new Map(
      icons.map(({ name, icon_url }) => [name.toLowerCase(), icon_url])
    );

    cell.textContent = "";
    const wrapper = document.createElement("div");
    wrapper.classList.add(MIT_AVAILABILITY_WRAPPER_CLASS);

    const contentWrapper = document.createElement("div");
    contentWrapper.classList.add(MIT_AVAILABILITY_CONTENT_CLASS);
    contentWrapper.innerHTML = baseHTML;

    const layer = document.createElement("div");
    layer.classList.add(MIT_AVAILABILITY_LAYER_CLASS);

    const dotContainer = document.createElement("div");
    dotContainer.classList.add(MIT_AVAILABILITY_DOT_CONTAINER_CLASS);
    dotContainer.setAttribute("tabindex", "0");

    const dotLayer = document.createElement("div");
    dotLayer.classList.add("mit-availability-dot-layer");

    const columns = [];
    sanitizedNames.forEach((ability, index) => {
      const columnIndex = Math.floor(index / MAX_MIT_DOT_ROWS);
      if (!columns[columnIndex]) {
        columns[columnIndex] = [];
      }
      columns[columnIndex].push(ability);
    });

    columns.forEach((columnAbilities) => {
      const columnDiv = document.createElement("div");
      columnDiv.classList.add("mit-availability-column");

      columnAbilities.forEach((ability) => {
        const dot = document.createElement("span");
        dot.classList.add("mitigation-dot");
        dot.title = ability;

        const key = ability.toLowerCase();
        const iconUrl = iconMap.get(key);
        if (iconUrl) {
          dot.style.backgroundImage = `url(${iconUrl})`;
        }

        columnDiv.appendChild(dot);
      });

      dotLayer.appendChild(columnDiv);
    });

    dotContainer.appendChild(dotLayer);

    const tooltip = document.createElement("div");
    tooltip.classList.add(MIT_AVAILABILITY_TOOLTIP_CLASS);
    const tooltipHeader = document.createElement("div");
    tooltipHeader.classList.add("mit-availability-tooltip-header");
    tooltipHeader.textContent = "Available DR";
    tooltip.appendChild(tooltipHeader);

    const tooltipGrid = document.createElement("div");
    tooltipGrid.classList.add(MIT_AVAILABILITY_TOOLTIP_GRID_CLASS);

    sanitizedNames.forEach((ability) => {
      const item = document.createElement("div");
      item.classList.add("mit-availability-tooltip-item");

      const key = ability.toLowerCase();
      const iconUrl = iconMap.get(key);

      if (iconUrl) {
        const img = document.createElement("img");
        img.src = iconUrl;
        img.alt = ability;
        img.title = ability;
        img.classList.add("mit-availability-tooltip-icon");
        item.appendChild(img);
      } else {
        const fallback = document.createElement("span");
        fallback.classList.add("mit-availability-tooltip-icon", "placeholder");
        item.appendChild(fallback);
        log.warn(
          `[renderAvailableMitigationIcons] Missing icon for ability "${ability}" (${jobName})`
        );
      }

      const label = document.createElement("span");
      label.textContent = ability;
      label.classList.add("mit-availability-tooltip-label");
      item.appendChild(label);

      tooltipGrid.appendChild(item);
    });

    tooltip.appendChild(tooltipGrid);
    dotContainer.appendChild(tooltip);
    layer.appendChild(dotContainer);

    wrapper.appendChild(contentWrapper);
    wrapper.appendChild(layer);

    cell.appendChild(wrapper);
  } catch (err) {
    // If something fails we restore the original content so the cell never stays blank.
    if (cell.dataset.mitLayerToken === renderToken) {
      cell.innerHTML = baseHTML;
    }
    throw err;
  } finally {
    if (cell.dataset.mitLayerToken === renderToken) {
      delete cell.dataset.mitLayerToken;
    }
  }
}

function snapshotCellContent(cell) {
  const existingWrapper = cell.querySelector(
    `.${MIT_AVAILABILITY_WRAPPER_CLASS}`
  );
  if (existingWrapper) {
    const content = existingWrapper.querySelector(
      `.${MIT_AVAILABILITY_CONTENT_CLASS}`
    );
    if (content) {
      return content.innerHTML;
    }
  }
  return cell.innerHTML;
}
