/**
 * reportRendererCondensed.js
 *
 * Condensed grouped view renderer.
 * Each parent row shows Timestamp | Attack Name | [Player Buff Contributions].
 * Clicking expands a child mini-table of detailed attacks.
 */

import { formatRelativeTime } from "../utility/dataUtils.js";
import { getRoleClass, sortActorsByJob } from "../config/AppConfig.js";
import {
  makeFrozenHeader,
  enableHeaderHighlight,
  updateResetButtonState,
} from "./reportRenderer.js";
import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";

setModuleLogLevel("ReportRendererCondensed", envLogLevel("debug", "warn"));
const log = getLogger("ReportRendererCondensed");

/**
 * renderCondensedTable()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Builds and renders the **Condensed (Grouped)** Fight Table UI.
 *   Each parent row represents a grouped set of attacks (e.g., all “auto-attacks”),
 *   and each can be expanded to reveal a mini detailed table of individual events.
 *
 * 🧠 Conceptual Overview:
 *   - Parent Rows:
 *       Columns → Timestamp | Attack Name | Player Buff Contributions
 *       • Represent grouped attacks
 *       • Clickable to toggle visibility of child mini-tables
 *   - Child Rows:
 *       Contain an embedded “mini detailed table” with per-hit breakdowns.
 *       Columns → Timestamp | Attack Name | Damage | Player Buffs
 *   - All filters (auto-attacks, bleeds, player selection, etc.) are applied
 *     post-render via `filterAndStyleCondensedTable()`.
 *
 * 🚀 Workflow:
 *   1️⃣ Resolve all players and sort them by job.
 *   2️⃣ Create the parent condensed table DOM (header + body).
 *   3️⃣ For each grouped attack set:
 *        - Render a parent `<tr>` (the summary)
 *        - Render a hidden `<tr>` underneath (child mini-table container)
 *   4️⃣ Assign `fightState.tableEl` for shared filter operations.
 *   5️⃣ Immediately apply filters via `filterAndStyleCondensedTable()`.
 *   6️⃣ Set up header hover highlighting, async buff repaint, and frozen header.
 *
 * ⚙️ Behavior Details:
 *   - Clicking a parent row toggles `.expanded` and shows/hides its child row.
 *   - Child mini-tables are self-contained `<table>` elements within a cell.
 *   - Expansion state is *not preserved* across filter or view toggles.
 *   - Buff colors follow consistent logic (job abilities = black, vulnerabilities = red).
 *   - Player header clicks toggle filters via `filterAndStyleCurrentView()`.
 *
 * 🔁 Integration:
 *   - Called by renderFight() when `filterState.showCondensedView === true`.
 *   - Shares FilterState and BuffAnalysis with the detailed view.
 *   - Controlled via unified toggle panel (renderFightHeader → renderControlPanel).
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

  // 🔗 Store table reference for shared filtering functions
  fightState.tableEl = table;

  // --- (3) Build Table Header ---
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
      // Reapply filters for current view
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

    // Timestamp cell
    const tdTime = document.createElement("td");
    tdTime.textContent = formatRelativeTime(set.timestamp, 0);
    parentRow.appendChild(tdTime);

    // Attack name cell
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
        td.innerHTML =
          buffs.length > 0
            ? buffs
                .map(
                  (buff) =>
                    `<div><span style="color:${
                      pData.wasTargeted ? "#000" : "#b45309"
                    }">${buff}</span></div>`
                )
                .join("")
            : "";

        // Greyed-out if dead
        if (pData.dead) {
          td.style.color = "#6b7280";
          td.style.backgroundColor = "#f3f4f6";
        }
      }
      parentRow.appendChild(td);
    });

    tbody.appendChild(parentRow);

    // --- Child Row (Hidden by Default) ---
    const childRow = document.createElement("tr");
    childRow.classList.add("child-row");
    childRow.style.display = "none";

    const childCell = document.createElement("td");
    childCell.classList.add("child-cell");
    childCell.colSpan = 2 + sortedActors.length;

    // --- Mini Detailed Table ---
    const miniTable = document.createElement("table");
    miniTable.classList.add("mini-detailed-table");

    // Mini table header
    const miniThead = document.createElement("thead");
    const miniHeader = document.createElement("tr");
    miniHeader.innerHTML = `
      <th>Timestamp</th>
      <th>Attack Name</th>
      <th class="damage-col">Damage</th>
    `;
    sortedActors.forEach((actor) => {
      const th = document.createElement("th");
      th.classList.add(getRoleClass(actor.subType));
      th.textContent = actor.name;
      miniHeader.appendChild(th);
    });
    miniThead.appendChild(miniHeader);
    miniTable.appendChild(miniThead);

    // Mini table body
    const miniTbody = document.createElement("tbody");
    for (const child of set.children) {
      const miniRow = document.createElement("tr");
      miniRow.__childEvent__ = child; // Keep direct reference to event

      // --- Identify which player this mini-row represents ---
      miniRow.dataset.actor = child.actor || "";
      miniRow.dataset.wasTargeted = String(
        !!(child.actor && set.players?.[child.actor]?.wasTargeted)
      );

      // Timestamp cell
      const tdCTime = document.createElement("td");
      tdCTime.textContent = formatRelativeTime(child.timestamp, 0);
      miniRow.appendChild(tdCTime);

      // Attack name cell
      const tdCAbility = document.createElement("td");
      tdCAbility.textContent = child.ability || "(Unknown)";
      miniRow.appendChild(tdCAbility);

      // Damage cell
      const tdCDamage = document.createElement("td");
      if (
        child.amount != null &&
        child.unmitigatedAmount != null &&
        child.mitigationPct != null
      ) {
        tdCDamage.innerHTML = `${child.unmitigatedAmount} → ${child.amount} (${child.mitigationPct}%)`;
      } else {
        tdCDamage.textContent = "-";
      }
      miniRow.appendChild(tdCDamage);

      // Per-player buff cells
      sortedActors.forEach((actor) => {
        const td = document.createElement("td");
        td.classList.add(getRoleClass(actor.subType));

        // Dead player styling
        if (child.deaths && child.deaths.includes(actor.name)) {
          td.style.color = "#6b7280";
          td.style.backgroundColor = "#f3f4f6";
          miniRow.appendChild(td);
          return;
        }

        // Buff rendering
        const buffs = [];
        if (child.buffs) {
          for (const [buffName, appliers] of Object.entries(child.buffs)) {
            if (appliers.includes(actor.name)) buffs.push(buffName);
          }
        }
        td.innerHTML =
          buffs.length > 0
            ? buffs.map((b) => `<div><span>${b}</span></div>`).join("")
            : "";

        // Mark if this actor is the target
        if (child.actor === actor.name) td.classList.add("target-cell");

        miniRow.appendChild(td);
      });

      miniTbody.appendChild(miniRow);
    }

    miniTable.appendChild(miniTbody);
    childCell.appendChild(miniTable);
    childRow.appendChild(childCell);
    tbody.appendChild(childRow);

    // 🖱️ Parent Click → Expand/Collapse Child
    parentRow.addEventListener("click", () => {
      const expanded = parentRow.classList.toggle("expanded");
      const isNowVisible = expanded;
      childRow.style.display = isNowVisible ? "table-row" : "none";

      if (isNowVisible) {
        const miniTable = childRow.querySelector(".mini-detailed-table");
        if (miniTable) {
          log.debug(
            `[CondensedTable] Expanded "${set.ability}" → reapplying filters for parent + mini-table`
          );

          // 🔹 1️⃣ Re-run parent filter pass for visibility + header sync
          filterAndStyleCondensedTable(fightState, report);

          // 🔹 2️⃣ Apply filters + repaint mini-table directly using structured data
          updateMiniChildTable(set, fightState, report, miniTable);
        }
      } else {
        log.debug(`[CondensedTable] Collapsed "${set.ability}"`);
      }
    });
  }

  table.appendChild(tbody);

  // --- (5) Assemble DOM Structure ---
  const wrapper = document.createElement("div");
  wrapper.classList.add("time-table-wrapper");
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  section.appendChild(container);

  // --- (6) Apply Initial Filters + Highlights ---
  filterAndStyleCondensedTable(fightState, report);

  // --- (7) Enable Column Hover Highlighting ---
  const allParentRows = table.querySelectorAll("tbody tr.condensed-row");
  allParentRows.forEach((r) => enableHeaderHighlight(table, r, filterState));

  // --- (8) Async Buff Repaint ---
  fightState.buffAnalysis.waitForBuffLookups(() => {
    filterAndStyleCondensedTable(fightState, report);
  });

  // --- (9) Frozen Header Activation ---
  makeFrozenHeader(table, section);
}

/**
 * filterAndStyleCondensedTable()
 * --------------------------------------------------------------
 * 🔧 Purpose:
 *   Applies all current filter and styling rules to the **Condensed (Grouped)**
 *   fight table view. Ensures both parent rows (group summaries) and expanded
 *   child mini-tables respond correctly to all active toggles.
 *
 * 🧠 Conceptual Overview:
 *   - Parent rows = condensed attack sets (e.g. "Fear of Death", "Attack")
 *   - Child mini-tables = individual attacks under that set
 *   - Filters and visual states are propagated hierarchically:
 *       • Hidden parent rows automatically hide their child rows.
 *       • Expanded parents update their child mini-tables via `updateMiniChildTable()`.
 *
 * 🧩 Filters Applied:
 *   1️⃣ **Show Auto-Attacks** — hides grouped auto-attacks if disabled.
 *   2️⃣ **Show Bleeds / DoTs** — hides grouped bleed/DoT sets if disabled.
 *   3️⃣ **Player Selection** — hides sets not involving selected players.
 *   4️⃣ **Show Abilities Only** — resolves buffs → ability names.
 *   5️⃣ **Show Botched Mitigations** — applied within expanded mini tables.
 *
 * 🧭 Behavior:
 *   - Idempotent: safe to call repeatedly.
 *   - Non-destructive: never rebuilds parent DOM or expansion state.
 *   - Each expanded mini-table is refreshed via `updateMiniChildTable()`
 *     to ensure per-hit filtering and buff repainting.
 *
 * 🔁 Integration:
 *   - Invoked on any filter change or player header click via
 *     `filterAndStyleCurrentView()` or control panel toggles.
 *   - Called once immediately after condensed table creation.
 *
 * 🧱 DOM Ownership:
 *   - Parent condensed rows and their <tr> structures belong to this function.
 *   - Mini-table <table> elements are owned by their child rows but filtered here.
 *   - No reliance on `__condensedSet__` for lookup (it is passed down directly).
 *
 * @param {FightState} fightState - The active fight’s full state
 * @param {Object} report - Parsed report data (actors, IDs, metadata)
 */
export function filterAndStyleCondensedTable(fightState, report) {
  const { filters: filterState, tableEl: table, condensedPull } = fightState;
  if (!table || !condensedPull) return;

  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  const parentRows = Array.from(tbody.querySelectorAll("tr.condensed-row"));
  if (parentRows.length === 0) return;

  const AUTO_ATTACK_NAMES = new Set(["attack", "攻撃"]);

  // Resolve actor metadata for consistent header order and styling
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

  parentRows.forEach((row, idx) => {
    const set = condensedPull.condensedSets[idx];
    if (!set) return;

    const ability = set.ability?.toLowerCase() ?? "";
    const isAutoAttack = AUTO_ATTACK_NAMES.has(ability);
    const isBleed = ability.includes("dot") || ability.includes("bleed");

    // --- (1️⃣) Auto-Attack / Bleed filter ---
    if (
      (!filterState.showAutoAttacks && isAutoAttack) ||
      (!filterState.showCombinedDots && isBleed)
    ) {
      // Collapse this parent and its mini-table
      row.classList.remove("expanded");
      row.style.display = "none";
      const childRow = row.nextElementSibling;
      if (childRow?.classList.contains("child-row")) {
        childRow.style.display = "none";
      }
      hiddenCount++;
      return;
    }

    // --- (2️⃣) Player selection filter ---
    if (filterState.selectedPlayers.size > 0) {
      const players = set.players || {};
      const intersects = Object.entries(players).some(
        ([playerName, pdata]) =>
          filterState.selectedPlayers.has(playerName) &&
          pdata.wasTargeted === true
      );

      if (!intersects) {
        row.classList.remove("expanded"); // ensure it won’t re-expand automatically
        row.style.display = "none";
        const childRow = row.nextElementSibling;
        if (childRow?.classList.contains("child-row"))
          childRow.style.display = "none";
        hiddenCount++;
        return;
      }
    }

    // ✅ Visible parent
    row.style.display = "";
    visibleCount++;

    // --- (3️⃣) Repaint Buff Cells (Abilities vs Buffs) ---
    const playerCells = Array.from(row.querySelectorAll("td")).slice(2);
    playerCells.forEach((td) => {
      const spans = td.querySelectorAll("span");
      if (spans.length === 0) return;

      const buffs = Array.from(spans).map((s) => s.textContent);
      const displayBuffs = filterState.showAbilitiesOnly
        ? fightState.buffAnalysis.resolveBuffsToAbilities(buffs)
        : buffs;

      const styled = displayBuffs.map((buff) => {
        const isVuln = fightState.buffAnalysis.isVulnerability(buff);
        const color = isVuln ? "#b91c1c" : "#000";
        return `<div><span style="color:${color}">${buff}</span></div>`;
      });

      td.innerHTML = styled.join("");
    });

    // --- (4️⃣) Child mini-table update (if expanded) ---
    const childRow = row.nextElementSibling;
    if (childRow?.classList.contains("child-row")) {
      const isExpanded = row.classList.contains("expanded");
      childRow.style.display = isExpanded ? "table-row" : "none";

      if (isExpanded) {
        const miniTable = childRow.querySelector(".mini-detailed-table");
        if (miniTable) {
          updateMiniChildTable(set, fightState, report, miniTable);
          log.debug(
            `[CondensedFilter] Updated mini-table for "${set.ability}" with current filters`
          );
        }
      }
    }
  });

  // --- (5️⃣) Update header greying to match player selections ---
  const liveHeaders = table.querySelectorAll("thead th");
  const frozen = table.parentNode.parentNode.querySelector(".frozen-header");
  const frozenHeaders = frozen ? frozen.querySelectorAll("th") : [];

  sortedActors.forEach((actor, idx) => {
    const headerCell = liveHeaders[idx + 2]; // skip timestamp + ability
    const frozenCell = frozenHeaders[idx + 2];

    if (
      filterState.selectedPlayers.size > 0 &&
      !filterState.selectedPlayers.has(actor.name)
    ) {
      headerCell?.classList.add("player-deselected");
      frozenCell?.classList.add("player-deselected");
    } else {
      headerCell?.classList.remove("player-deselected");
      frozenCell?.classList.remove("player-deselected");
    }
  });

  // --- (6️⃣) Apply same header greying to all expanded mini tables ---
  const expandedMiniTables = table.querySelectorAll(
    "tr.child-row .mini-detailed-table"
  );

  expandedMiniTables.forEach((miniTable) => {
    const miniHeaders = miniTable.querySelectorAll("thead th");
    sortedActors.forEach((actor, idx) => {
      const headerCell = miniHeaders[idx + 3]; // mini tables have 3 base columns
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

  // --- (7️⃣) Update Reset Player Filter button ---
  updateResetButtonState(filterState);

  // --- (8️⃣) Summary log ---
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
 *   Apply all active filters and styling updates to a single
 *   condensed set’s mini detailed table — *without relying on
 *   any DOM-attached data like `__condensedSet__`*.
 *
 *   Each `condensedSet` from `generateCondensedPullTable()` already
 *   contains the complete structured data for one grouped attack window:
 *     {
 *       ability: string,
 *       timestamp: number,
 *       players: { [playerName]: { wasTargeted, buffs, dead, ... } },
 *       children: [ { ...fightTableRow }, ... ]
 *     }
 *
 *   This function now operates directly on that object instead of
 *   walking the DOM to rediscover it. The DOM mini-table is treated
 *   purely as a rendering target.
 *
 * 🚀 Parameters:
 *   @param {Object} condensedSet
 *     One grouped attack window from `fightState.condensedPull.condensedSets`.
 *     Contains both summary player data (`players`) and child events (`children`).
 *
 *   @param {FightState} fightState
 *     Current fight context with shared filters, buffAnalysis, etc.
 *
 *   @param {Object} report
 *     Parsed report data (actors, metadata, IDs).
 *
 *   @param {HTMLTableElement} miniTable
 *     The mini detailed table DOM element to filter & repaint in place.
 *
 * 🧩 Filters applied:
 *   1️⃣ Hide auto-attacks / bleeds if toggled off.
 *   2️⃣ Show botched mitigations if toggle enabled.
 *   3️⃣ Show abilities instead of raw buffs if toggle enabled.
 *   4️⃣ Hide rows unless at least one selected player wasTargeted = true.
 *   5️⃣ Repaint vulnerability and ability color coding.
 *
 * 🧠 Key change from old version:
 *   ❌ Removed all DOM-based `__condensedSet__` lookups.
 *   ✅ Accepts `condensedSet` directly from caller.
 *   ✅ Uses `condensedSet.players[playerName].wasTargeted` for filtering logic.
 */
export function updateMiniChildTable(
  condensedSet,
  fightState,
  report,
  miniTable
) {
  const { filters: filterState, buffAnalysis } = fightState;
  if (!miniTable || !condensedSet) return;

  const tbody = miniTable.querySelector("tbody");
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll("tr"));
  if (rows.length === 0) return;

  const AUTO_ATTACK_NAMES = new Set(["attack", "攻撃"]);

  // Resolve actor metadata for buff coloring
  const allActors = fightState.fightTable.friendlyPlayerIds
    .map((id) => report.actorById.get(id))
    .filter((a) => a && a.type === "Player" && a.name !== "Multiple Players");
  const sortedActors = sortActorsByJob(allActors);

  log.debug(
    `[MiniFilter] Applying filters for "${condensedSet.ability}" → rows=${
      rows.length
    }, selectedPlayers=[${Array.from(filterState.selectedPlayers).join(", ")}]`
  );

  // Apply per-row filtering and styling
  rows.forEach((row) => {
    const abilityCell = row.cells[1];
    const damageCell = row.cells[2];
    if (!abilityCell) return;

    const ability = abilityCell.textContent?.toLowerCase() ?? "";
    const isAutoAttack = AUTO_ATTACK_NAMES.has(ability);
    const isBleed = ability.includes("dot") || ability.includes("bleed");

    // 🚫 Hide filtered-out abilities
    if (
      (!filterState.showAutoAttacks && isAutoAttack) ||
      (!filterState.showCombinedDots && isBleed)
    ) {
      row.style.display = "none";
      return;
    }

    // ✅ Otherwise visible by default
    row.style.display = "";

    // --- 1️⃣ Show Botched Mitigations (intendedMitPct > mitigationPct)
    if (damageCell && damageCell.innerHTML.includes("→")) {
      const intendedMit = row.dataset.intendedMit
        ? parseInt(row.dataset.intendedMit)
        : null;
      const match = damageCell.textContent.match(/\((\d+)%\)/);
      const actualMit = match ? parseInt(match[1]) : null;

      if (filterState.showBotchedMitigations) {
        if (
          intendedMit &&
          actualMit &&
          intendedMit > actualMit &&
          !damageCell.querySelector(".intended-mit")
        ) {
          damageCell.innerHTML = damageCell.innerHTML.replace(
            /\)$/,
            `, <span class="intended-mit">${intendedMit}%</span>)`
          );
        }
      } else {
        // Remove intended mitigation annotations
        damageCell
          .querySelectorAll(".intended-mit")
          .forEach((el) => el.remove());
      }
    }

    // --- 2️⃣ Buff repaint per player column
    sortedActors.forEach((actor, idx) => {
      const td = row.cells[idx + 3];
      if (!td) return;

      const buffs = Array.from(td.querySelectorAll("span")).map(
        (s) => s.textContent
      );

      const displayBuffs = filterState.showAbilitiesOnly
        ? buffAnalysis.resolveBuffsToAbilities(buffs)
        : buffs;

      td.innerHTML = displayBuffs
        .map((buff) => {
          const isVuln = buffAnalysis.isVulnerability(buff);
          const isJobBuff = buffAnalysis.isJobAbility(buff, actor.subType);
          const color = isVuln ? "#b91c1c" : isJobBuff ? "#000" : "#228B22";
          return `<div><span style="color:${color}">${buff}</span></div>`;
        })
        .join("");
    });

    // --- 3️⃣ Player selection filtering (row-based via dataset.actor) ---
    if (filterState.selectedPlayers.size > 0) {
      const selectedPlayers = [...filterState.selectedPlayers];
      const rowActor = row.dataset.actor || "";
      const wasTargeted = row.dataset.wasTargeted === "true";

      // Only show this row if it matches a selected player AND that player was targeted
      const visible =
        rowActor && wasTargeted && selectedPlayers.includes(rowActor);

      row.style.display = visible ? "" : "none";

      // 🧾 Log precise filtering decision
      log.debug(
        `[MiniFilter] ${visible ? "✅ KEEP" : "❌ HIDE"} ` +
          `rowActor="${rowActor}" (wasTargeted=${wasTargeted}) ` +
          `| ability="${condensedSet.ability}" ` +
          `| childAbility="${abilityCell.textContent}" ` +
          `| selected=[${selectedPlayers.join(", ")}]`
      );
    }
  });

  // --- 4️⃣ Hide entire mini-table if no visible rows remain
  const visibleRows = rows.filter((r) => r.style.display !== "none").length;
  miniTable.style.display = visibleRows > 0 ? "table" : "none";

  log.debug(
    `[MiniFilter] "${condensedSet.ability}" visibleRows=${visibleRows}/${rows.length}`
  );
}

/**
 * buildMiniTable()
 * --------------------------------------------------------------
 * Rebuilds a fresh mini detailed table from a condensed set,
 * applying current filters (auto-attacks, DoTs, player selection, etc.)
 * as if the user had just expanded it.
 *
 * @param {Object} setData - The parent condensedSet data
 * @param {FightState} fightState - current fight context
 * @param {Object} report - report reference
 * @returns {HTMLTableElement} miniTable
 */
function buildMiniTable(setData, fightState, report) {
  const { filters: filterState, buffAnalysis } = fightState;
  const sortedActors = sortActorsByJob(
    fightState.fightTable.friendlyPlayerIds
      .map((id) => report.actorById.get(id))
      .filter(
        (a) =>
          a &&
          a.type === "Player" &&
          a.name !== "Multiple Players" &&
          a.name !== "Limit Break"
      )
  );

  const miniTable = document.createElement("table");
  miniTable.classList.add("mini-detailed-table");

  // --- Header ---
  const miniThead = document.createElement("thead");
  const miniHeader = document.createElement("tr");
  miniHeader.innerHTML = `
    <th>Timestamp</th>
    <th>Attack Name</th>
    <th class="damage-col">Damage</th>
  `;
  sortedActors.forEach((actor) => {
    const th = document.createElement("th");
    th.classList.add(getRoleClass(actor.subType));
    th.textContent = actor.name;
    miniHeader.appendChild(th);
  });
  miniThead.appendChild(miniHeader);
  miniTable.appendChild(miniThead);

  // --- Body ---
  const miniTbody = document.createElement("tbody");

  for (const child of setData.children) {
    const ability = child.ability?.toLowerCase() ?? "";
    const isAutoAttack = ["attack", "攻撃"].includes(ability);
    const isBleed = ability.includes("dot") || ability.includes("bleed");

    // Skip filtered abilities
    if (
      (!filterState.showAutoAttacks && isAutoAttack) ||
      (!filterState.showCombinedDots && isBleed)
    ) {
      continue;
    }

    // Player selection: skip if no selected players are involved
    if (filterState.selectedPlayers.size > 0) {
      const involvedPlayers = new Set();
      if (child.actor) involvedPlayers.add(child.actor);
      if (child.buffs) {
        for (const [, appliers] of Object.entries(child.buffs)) {
          appliers.forEach((a) => involvedPlayers.add(a));
        }
      }
      const show = [...filterState.selectedPlayers].some((p) =>
        involvedPlayers.has(p)
      );
      if (!show) continue;
    }

    // --- Row ---
    const row = document.createElement("tr");

    const tdTime = document.createElement("td");
    tdTime.textContent = formatRelativeTime(child.timestamp, 0);
    row.appendChild(tdTime);

    const tdAbility = document.createElement("td");
    tdAbility.textContent = child.ability;
    row.appendChild(tdAbility);

    const tdDamage = document.createElement("td");
    if (
      child.amount != null &&
      child.unmitigatedAmount != null &&
      child.mitigationPct != null
    ) {
      let mitHTML = `(${child.mitigationPct}%)`;
      if (
        filterState.showBotchedMitigations &&
        typeof child.intendedMitPct === "number" &&
        child.intendedMitPct > child.mitigationPct
      ) {
        mitHTML = `(${child.mitigationPct}%, <span class="intended-mit">${child.intendedMitPct}%</span>)`;
      }
      tdDamage.innerHTML = `${child.unmitigatedAmount} → ${child.amount} ${mitHTML}`;
    } else {
      tdDamage.textContent = "-";
    }
    row.appendChild(tdDamage);

    sortedActors.forEach((actor) => {
      const td = document.createElement("td");
      td.classList.add(getRoleClass(actor.subType));

      if (child.deaths?.includes(actor.name)) {
        td.style.color = "#6b7280";
        td.style.backgroundColor = "#f3f4f6";
        row.appendChild(td);
        return;
      }

      const buffs = [];
      if (child.buffs) {
        for (const [buff, appliers] of Object.entries(child.buffs)) {
          if (appliers.includes(actor.name)) buffs.push(buff);
        }
      }

      const displayBuffs = filterState.showAbilitiesOnly
        ? buffAnalysis.resolveBuffsToAbilities(buffs)
        : buffs;

      const styled = displayBuffs.map((buff) => {
        const isVuln = buffAnalysis.isVulnerability(buff);
        const color = isVuln ? "#b91c1c" : "#000";
        return `<div><span style="color:${color}">${buff}</span></div>`;
      });

      td.innerHTML = styled.join("");
      if (child.actor === actor.name) td.classList.add("target-cell");

      row.appendChild(td);
    });

    miniTbody.appendChild(row);
  }

  miniTable.appendChild(miniTbody);
  return miniTable;
}
