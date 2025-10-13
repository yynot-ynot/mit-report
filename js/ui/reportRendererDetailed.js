/**
 * reportRendererDetailed.js
 *
 * Renders the full detailed fight table (the original per-event table view).
 * Extracted from reportRenderer.js for modularity.
 */

import { formatRelativeTime } from "../utility/dataUtils.js";
import { getRoleClass, sortActorsByJob } from "../config/AppConfig.js";
import {
  makeFrozenHeader,
  enableHeaderHighlight,
  filterAndStyleTable,
  renderControlPanel,
  getRowTargets,
  updateResetButtonState,
  filterAndStyleCurrentView,
} from "./reportRenderer.js"; // reuse shared utils
import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";

setModuleLogLevel("ReportRendererDetailed", envLogLevel("info", "warn"));
const log = getLogger("ReportRendererDetailed");

/**
 * Render the full “Detailed Fight Table” view into the DOM.
 *
 * 🧩 Purpose:
 *   The detailed table is the *unaggregated* view of fight events.
 *   Each row corresponds to a single combat event with its timestamp,
 *   ability name, damage info, and per-player buff data.
 *
 *   This function’s sole job is to build the *complete DOM structure*.
 *   It renders *every* event and player column, regardless of filter toggles.
 *   Once the DOM is complete, it delegates filtering and styling logic
 *   to `filterAndStyleCurrentView()` (which will call `filterAndStyleTable()`).
 *
 * 🔁 Lifecycle:
 *   1. Build unfiltered DOM (headers, rows, cells)
 *   2. Assign `fightState.tableEl` reference (for filters to use)
 *   3. Call `filterAndStyleCurrentView()` once to apply filters
 *   4. Register hover highlighting and async buff repaint logic
 *   5. Create frozen header for persistent column titles
 *
 * ⚙️ Interaction Behavior:
 *   - Clicking player headers toggles player selection and immediately re-applies filters.
 *   - Hovering a row highlights the targeted player’s header if enabled.
 *   - Buff cells are painted in color based on job abilities and vulnerabilities.
 *   - Dead players’ cells are greyed out.
 *
 * 🧱 Safety:
 *   ✅ Does not mutate existing DOM after creation — filtering handled externally.
 *   ✅ Always leaves the DOM in a valid, consistent state.
 *   ✅ Re-entrant: can be safely destroyed and re-rendered by renderFight().
 *
 * @param {FightState} fightState - Current fight context (fightTable, filters, buffAnalysis)
 * @param {Object} report - Parsed report data (actors, metadata)
 * @param {HTMLElement} section - Container element to render this table into
 */
export function renderDetailedTable(fightState, report, section) {
  const { fightTable, filters: filterState, buffAnalysis } = fightState;

  log.debug(
    `[RenderDetailedTable] Rendering detailed table for Pull ${fightTable.fightId}`
  );

  // --- Extract and sort all event timestamps ---
  const timestamps = Object.keys(fightTable.rows)
    .map((n) => parseInt(n, 10))
    .sort((a, b) => a - b);

  // --- Resolve player metadata ---
  const allActors = fightTable.friendlyPlayerIds
    .map((id) => report.actorById.get(id))
    .filter(
      (a) =>
        a &&
        a.type === "Player" &&
        a.name !== "Multiple Players" &&
        a.name !== "Limit Break"
    );

  // Sort by job order (Tank → Healer → DPS)
  const sortedActors = sortActorsByJob(allActors);

  // --- Early Exit: No events recorded ---
  if (timestamps.length === 0) {
    const msg = document.createElement("div");
    msg.textContent = "No events recorded for this pull.";
    section.appendChild(msg);
    return;
  }

  // --- Table Container Setup ---
  const container = document.createElement("div");
  container.classList.add("time-table-container");

  const wrapper = document.createElement("div");
  wrapper.classList.add("time-table-wrapper");
  container.appendChild(wrapper);

  const table = document.createElement("table");
  table.classList.add("time-table");
  wrapper.appendChild(table);

  // Save reference so filters know which table to mutate
  fightState.tableEl = table;

  // ============================================================
  // 🧩 HEADER CONSTRUCTION
  // ============================================================
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headerRow.innerHTML = `
    <th>Timestamp</th>
    <th>Attack Name</th>
    <th class="damage-col">
      <div class="damage-header-top">
        <span>U:</span><span>Damage</span><span>M:</span>
      </div>
      <div class="damage-header-bottom">
        <span>A:</span><span>(mit)</span>
      </div>
    </th>
  `;

  // Build player header cells
  sortedActors.forEach((actor) => {
    const roleClass = getRoleClass(actor.subType);
    const th = document.createElement("th");
    th.className = roleClass;
    th.textContent = actor.name;

    // 🔹 Clickable header: toggle player filter
    th.addEventListener("click", () => {
      filterState.togglePlayer(actor.name);
      // Use central router for filter logic
      filterAndStyleCurrentView(fightState, report);
    });

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // ============================================================
  // 🧩 BODY CONSTRUCTION
  // ============================================================
  const tbody = document.createElement("tbody");

  timestamps.forEach((ms) => {
    const event = fightTable.rows[ms];
    const row = document.createElement("tr");

    // Timestamp column
    const tdTime = document.createElement("td");
    tdTime.textContent = formatRelativeTime(ms, 0);
    row.appendChild(tdTime);

    // Ability column
    const tdAbility = document.createElement("td");
    tdAbility.textContent = event.ability || "";
    row.appendChild(tdAbility);

    // Damage column
    const tdDamage = document.createElement("td");
    tdDamage.classList.add("damage-col");
    if (
      event.amount != null &&
      event.unmitigatedAmount != null &&
      event.mitigationPct != null
    ) {
      const unmit =
        event.unmitigatedAmount === 0 ? "?" : event.unmitigatedAmount;
      let mitDisplay = `${event.mitigationPct}%`;

      // Show intended mitigation if toggle is on and applicable
      if (
        filterState.showBotchedMitigations &&
        typeof event.intendedMitPct === "number" &&
        event.intendedMitPct > event.mitigationPct
      ) {
        mitDisplay += ` <span class="intended-mit">${event.intendedMitPct}%</span>`;
      }

      tdDamage.innerHTML = `
        &nbsp;${unmit}&nbsp;→&nbsp;${event.amount}<br>
        <span>A: ${event.absorbed || 0} | (${mitDisplay})</span>
      `;
    } else {
      tdDamage.textContent = "-";
    }
    row.appendChild(tdDamage);

    // ========================================================
    // 🧩 Player Buff Columns
    // ========================================================
    sortedActors.forEach((actor) => {
      const td = document.createElement("td");
      td.classList.add(getRoleClass(actor.subType));

      // Death coloring
      if (event.deaths && event.deaths.includes(actor.name)) {
        td.style.color = "#6b7280";
        td.style.backgroundColor = "#f3f4f6";
        row.appendChild(td);
        return;
      }

      // Collect buffs for this actor
      const rawBuffs = [];
      for (const [buffName, appliers] of Object.entries(event.buffs)) {
        if (appliers.includes(actor.name)) rawBuffs.push(buffName);
      }

      let displayBuffs = rawBuffs;
      if (filterState.showAbilitiesOnly) {
        displayBuffs = buffAnalysis.resolveBuffsToAbilities(rawBuffs);
      }

      const styledBuffs = displayBuffs.map((buff) => {
        const matched = buffAnalysis.isJobAbility(buff, actor.subType);
        const isVuln = buffAnalysis.isVulnerability(buff);
        const color = isVuln ? "#b91c1c" : matched ? "#000" : "#228B22";
        return `<div><span style="color:${color}">${buff}</span></div>`;
      });

      td.innerHTML = styledBuffs.length > 0 ? styledBuffs.join("") : "";

      // Target marker
      const targets = getRowTargets(event);
      if (targets.includes(actor.name)) {
        td.classList.add("target-cell");
      }

      row.appendChild(td);
    });

    tbody.appendChild(row);
    enableHeaderHighlight(table, row, filterState);
  });

  table.appendChild(tbody);
  section.appendChild(container);

  // ============================================================
  // 🧩 Apply Initial Filters and Header Sync
  // ============================================================
  // Apply filter set immediately once DOM exists
  filterAndStyleCurrentView(fightState, report);

  // Enable frozen header sync and resizing
  makeFrozenHeader(table, section);

  // ============================================================
  // 🧩 Async Buff Lookup Completion
  // ============================================================
  buffAnalysis.waitForBuffLookups(() => {
    // Re-apply filters + repaint after buff names resolve
    filterAndStyleCurrentView(fightState, report);
  });
}
