/**
 * reportRendererDetailed.js
 *
 * Renders the full detailed fight table (the original per-event table view).
 * Extracted from reportRenderer.js for modularity.
 */

import { formatRelativeTime } from "../utility/dataUtils.js";
import { getRoleClass, sortActorsByJob } from "../config/AppConfig.js";
import {
  getRowTargets,
  updateResetButtonState,
  filterAndStyleCurrentView,
} from "./reportRenderer.js"; // reuse shared utils
import {
  repaintDamageCell,
  buildMitigationIconRow,
  shouldHideEvent,
  shouldShowRowForPlayerSelection,
  attachStickyHeaderHighlight,
  applyAdaptiveScrollPadding,
  getDamageTypeIconHTML,
  logCrossJobBuffAnomalies,
} from "./reportRendererUtils.js";
import { shouldStrikeBotchedMitigation } from "../analysis/buffAnalysis.js";
import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";
import {
  createDamageCell,
  renderBuffCell,
  renderAvailableMitigationIcons,
} from "./reportRendererUtils.js";

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
  const showAvailableMit = filterState.showAvailableMitigations;
  const exclusiveMitOptions = {
    fightId: fightTable?.fightId ?? null,
    exclusiveAbilityMap: fightTable?.mutuallyExclusiveMitigationMap ?? null,
  };

  log.debug(
    `[RenderDetailedTable] Rendering detailed table for Pull ${fightTable.fightId}`
  );

  // --- Extract and sort all event timestamps ---
  const allRows = [...fightTable.rows].sort(
    (a, b) => a.timestamp - b.timestamp
  );

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
  if (allRows.length === 0) {
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

  if (showAvailableMit) {
    buildMitigationIconRow(
      sortedActors,
      report,
      3,
      fightTable,
      fightState.mitigationCastLookup
    ).then((mitRow) => {
      thead.appendChild(mitRow);
    });
  }

  // ============================================================
  // 🧩 BODY CONSTRUCTION
  // ============================================================
  const tbody = document.createElement("tbody");

  allRows.forEach((event) => {
    const row = document.createElement("tr");

    // Timestamp column
    const tdTime = document.createElement("td");
    tdTime.textContent = formatRelativeTime(event.timestamp, 0);
    row.appendChild(tdTime);

    // Ability column with damage type icons + attacker (source) label
    const tdAbility = document.createElement("td");
    tdAbility.classList.add("ability-cell");
    const beforeIcon = getDamageTypeIconHTML(event.damageType);
    const afterIcon = getDamageTypeIconHTML(event.damageType);
    const abilityName = event.ability || "";
    const sourceLabel = event.source
      ? `<div class="attack-source">${event.source}</div>`
      : "";
    tdAbility.innerHTML = `
      <div class="ability-name">
        ${beforeIcon}${abilityName}${afterIcon}
      </div>
      ${sourceLabel}
    `;
    row.appendChild(tdAbility);

    // Damage column
    const tdDamage = createDamageCell(event, filterState);
    row.appendChild(tdDamage);

    // ========================================================
    // 🧩 Player Buff Columns
    // ========================================================
    sortedActors.forEach((actor) => {
      const td = document.createElement("td");
      td.classList.add(getRoleClass(actor.subType));

      // Death coloring
      if (event.deaths && event.deaths.includes(actor.name)) {
        td.style.color = "#4b5563";
        td.style.backgroundColor = "#e5e7eb";
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

      // Find the likely caster’s job (based on applier info)
      const sources = Object.keys(event.buffs || {});
      const sourceName = sources[0];
      let casterJob = actor.subType;
      if (sourceName) {
        const caster = report.actorByName.get(sourceName);
        if (caster && caster.subType) casterJob = caster.subType;
      }

      // Check for cross-job buff anomalies (e.g., Sage buffs on DarkKnight with no source)
      logCrossJobBuffAnomalies({
        set: event, // current detailed table event
        actor,
        buffs: rawBuffs,
        firstApplier: sourceName,
        report,
        logger: log,
      });

      const botchedActive = shouldStrikeBotchedMitigation(event, filterState);
      td.innerHTML = renderBuffCell({
        buffs: rawBuffs,
        actorSubType: casterJob,
        buffAnalysis,
        filterState,
        botchedBuffs: event.potentiallyBotchedBuffs || [],
        botchedActive,
      });

      if (showAvailableMit) {
        const availableMitNames = Array.isArray(
          event.availableMitigationsByPlayer?.[actor.name]
        )
          ? event.availableMitigationsByPlayer[actor.name]
          : [];

        renderAvailableMitigationIcons(
          td,
          actor.subType,
          availableMitNames,
          {
            resourceState: event.resourceStateByPlayer?.[actor.name] ?? null,
          }
        ).catch((err) =>
          log.warn(
            `[DetailedTable] Failed to render mitigation availability for ${actor.name}`,
            err
          )
        );
      }

      // Target marker
      const targets = getRowTargets(event);
      if (targets.includes(actor.name)) {
        td.classList.add("target-cell");
      }

      row.appendChild(td);
    });

    tbody.appendChild(row);
    attachStickyHeaderHighlight(table, row, filterState);
  });

  table.appendChild(tbody);
  section.appendChild(container);

  // ============================================================
  // 🧩 Apply Initial Filters and Header Sync
  // ============================================================
  // Apply filter set immediately once DOM exists
  filterAndStyleCurrentView(fightState, report);

  // ============================================================
  // 🧩 Async Buff Lookup Completion
  // ============================================================
  buffAnalysis.waitForBuffLookups(() => {
    // Re-apply filters + repaint after buff names resolve
    filterAndStyleCurrentView(fightState, report);
  });

  // ============================================================
  // 🧩 Adaptive scroll padding for end-of-table visibility
  // ============================================================
  applyAdaptiveScrollPadding(wrapper, table);
}

/**
 * Incrementally refresh buff cells and row visibility.
 *
 * Purpose:
 *   - Avoids full table rebuild when toggles or async lookups change.
 *   - Keeps DOM stable (no flicker, no row reallocation).
 *
 * Behavior:
 *   - Iterates over fight rows and applies filters:
 *       • Hides Auto-Attacks if filterState.showAutoAttacks = false
 *       • Hides Bleeds if filterState.showCombinedDots = false
 *       • Hides rows with non-matching player targets if selections exist
 *   - Updates buff cells per player:
 *       • Raw buffs or collapsed into abilities (based on filterState.showAbilitiesOnly)
 *       • Styles vulnerabilities in red, known job abilities in black, unknowns in green
 *       • ⚠️ Buff cells are fully repainted each call (innerHTML replaced).
 *         → Current contents: <div><span style="color:...">BuffName</span></div>
 *         → Any custom DOM (icons, tooltips, event listeners) must be
 *           injected inside this function, or else it will be wiped.
 *   - Updates header greying to match selected players.
 *   - Updates Reset Player Filter button state.
 *   - Logs row visibility statistics (total, visible, hidden).
 *
 * ✅ Safe operations (allowed here):
 *   - Show/hide rows using CSS (`row.style.display`).
 *   - Update buff cells’ innerHTML and styling (paint-only ownership).
 *   - Toggle header cell classes for selection state.
 *   - Update external UI controls (reset button).
 *
 * 🚫 Constraints (must avoid here):
 *   - Do NOT add/remove <tr> rows or <td>/<th> cells.
 *   - Do NOT modify Timestamp, Attack Name, or Damage cells.
 *   - Do NOT mutate fightTable.rows (source of truth).
 *   - Do NOT introduce side effects outside rendering (idempotency required).
 *
 * @param {FightState} fightState - Per-fight state container (table, filters, buffAnalysis)
 * @param {Object} report - Report reference (for actor lookups)
 */
export function filterAndStyleDetailedTable(fightState, report) {
  const {
    fightTable,
    buffAnalysis,
    filters: filterState,
    tableEl,
  } = fightState;
  const table = tableEl;
  if (!table) return;

  const exclusiveMitOptions = {
    fightId: fightTable?.fightId ?? null,
    exclusiveAbilityMap: fightTable?.mutuallyExclusiveMitigationMap ?? null,
  };

  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  // Restore all rows before applying filters
  Array.from(tbody.rows).forEach((row) => {
    row.style.display = ""; // reset visibility
  });

  // Rows are now an array — clone and sort by timestamp
  const allRows = [...fightTable.rows].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  // Sorted player columns (same as in renderFight)
  const allActors = fightTable.friendlyPlayerIds
    .map((id) => report.actorById.get(id))
    .filter(
      (a) =>
        a &&
        a.type === "Player" &&
        a.name !== "Multiple Players" &&
        a.name !== "Limit Break"
    );
  const sortedActors = sortActorsByJob(allActors);

  allRows.forEach((event, rowIndex) => {
    const row = tbody.rows[rowIndex];
    if (!row) return;

    // 🚫 Hide Auto-Attacks / DoTs
    if (shouldHideEvent(event.ability, filterState)) {
      row.style.display = "none";
      return;
    } else {
      row.style.display = "";
    }

    // 🚫 Hide rows if they don’t match selected players
    if (!shouldShowRowForPlayerSelection(event, filterState)) {
      row.style.display = "none";
      return;
    } else {
      row.style.display = "";
    }

    // Update mitigation visibility dynamically
    const tdDamage = row.cells[2];
    if (tdDamage && event.mitigationPct != null) {
      repaintDamageCell(tdDamage, event, filterState);
    }

    sortedActors.forEach((actor, colIndex) => {
      // Columns offset by 3 (Timestamp, Ability, Damage)
      const td = row.cells[colIndex + 3];
      if (!td) return;

      // Buffs applied to this actor at this timestamp
      const rawBuffs = [];
      for (const [buffName, appliers] of Object.entries(event.buffs)) {
        if (appliers.includes(actor.name)) {
          rawBuffs.push(buffName);
        }
      }

      let displayBuffs = rawBuffs;
      if (filterState.showAbilitiesOnly) {
        displayBuffs = buffAnalysis.resolveBuffsToAbilities(rawBuffs);
      }

      // Use shared utility for buff rendering (unifies logic)
      // Pass the actual caster’s job subtype when available, instead of target’s
      const sources = Object.keys(event.buffs || {});
      const sourceName = sources[0];
      let casterJob = actor.subType;
      if (sourceName) {
        const caster = report.actorByName.get(sourceName);
        if (caster && caster.subType) casterJob = caster.subType;
      }

      // Check for cross-job buff anomalies (e.g., Sage buffs on DarkKnight with no source)
      logCrossJobBuffAnomalies({
        set: event, // current detailed table event
        actor,
        buffs: rawBuffs,
        firstApplier: sourceName,
        report,
        logger: log,
      });

      // --- Step 1: Repaint Buff Cell (base content) ---
      const botchedActive = shouldStrikeBotchedMitigation(event, filterState);
      td.innerHTML = renderBuffCell({
        buffs: rawBuffs,
        actorSubType: casterJob,
        buffAnalysis,
        filterState,
        botchedBuffs: event.potentiallyBotchedBuffs || [],
        botchedActive,
      });

      // --- Step 2: Reapply Mitigation Availability Layer ---
      // This was missing before — it ensures mitigation dots/icons remain visible
      const availableMitNames = Array.isArray(
        event.availableMitigationsByPlayer?.[actor.name]
      )
        ? event.availableMitigationsByPlayer[actor.name]
        : [];

      if (filterState.showAvailableMitigations) {
        renderAvailableMitigationIcons(
          td,
          actor.subType,
          availableMitNames,
          {
            ...exclusiveMitOptions,
            resourceState: event.resourceStateByPlayer?.[actor.name] ?? null,
          }
        ).catch((err) =>
          log.warn(
            `[DetailedTable] Failed to repaint mitigation availability for ${actor.name}`,
            err
          )
        );
      } else {
        // Clear previous mitigation layer when toggle is off
        renderAvailableMitigationIcons(
          td,
          actor.subType,
          [],
          {
            ...exclusiveMitOptions,
            resourceState: null,
          }
        ).catch(() => {});
      }
    });
  });

  // 🔹 After processing all rows, log visibility stats
  const domRows = Array.from(tbody.rows);
  const visibleRows = domRows.filter((r) => r.style.display !== "none");
  const hiddenRows = domRows.filter((r) => r.style.display === "none");

  log.debug(
    `[filterAndStyleTable] Total rows=${domRows.length}, visible=${
      visibleRows.length
    }, hidden=${hiddenRows.length}, selectedPlayers=[${Array.from(
      filterState.selectedPlayers
    ).join(", ")}]`
  );

  // 🔹 Update header styling to reflect selected players
  const liveHeaders = table.querySelectorAll("thead th");

  sortedActors.forEach((actor, idx) => {
    const headerCell = liveHeaders[idx + 3]; // offset: timestamp, ability, damage

    if (
      filterState.selectedPlayers.size > 0 &&
      !filterState.selectedPlayers.has(actor.name)
    ) {
      headerCell?.classList.add("player-deselected");
    } else {
      headerCell?.classList.remove("player-deselected");
    }
  });

  updateResetButtonState(filterState);
}
