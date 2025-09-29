import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import { formatRelativeTime } from "../utility/dataUtils.js";
import { getRoleClass, sortActorsByJob } from "../config/AppConfig.js";
import {
  isJobAbility,
  isVulnerability,
  resolveBuffsToAbilities,
  waitForBuffLookups,
} from "../analysis/buffAnalysis.js";

setModuleLogLevel("ReportRenderer", "info");
const log = getLogger("ReportRenderer");

// Toggle for highlighting full target column
let ENABLE_COLUMN_HIGHLIGHT = true;

// Toggle for collapsing buffs into abilities
let SHOW_ABILITIES_ONLY = true;

let SHOW_AUTO_ATTACKS = false; // default hidden
let SHOW_COMBINED_DOTS = false; // default hidden

let SELECTED_PLAYERS = new Set();

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

  // 🔑 New container for pulls + fight table
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
   * Columns:
   *   - Timestamp: relative time of the event
   *   - Attack Name: ability name
   *   - Damage: "unmitigated → amount (mit%)"
   *   - Player columns: buffs active on each player at that timestamp
   *
   * Enhancements:
   *   - Adds a stacked control panel with toggles:
   *       • Show/Hide Auto-Attacks
   *       • Show/Hide Combined DoTs
   *       • Enable/Disable Target Player Highlighting
   *       • Show Buffs (Detailed) vs Show Abilities Only
   *       • Reset Player Filter (clears selected players)
   *   - Allows clicking player headers (live & frozen) to filter rows
   *     by selected players (multiple selectable).
   *   - Selected player headers remain normal; non-selected turn grey.
   *
   * @param {Object} fightTable - Parsed FightTable object for one pull
   */
  async function renderFight(fightTable) {
    // log the fightTable object
    log.debug("[RenderFight] fightTable object:", fightTable);
    fightContainer.innerHTML = "";

    const section = document.createElement("section");

    // Container for title + controls stacked vertically
    const headerContainer = document.createElement("div");
    headerContainer.classList.add("fight-header");

    // Fight title
    const titleEl = document.createElement("h4");
    titleEl.textContent = `${fightTable.name} (Pull: ${fightTable.fightId})`;

    // 🔹 Build control panel
    const controlPanel = renderControlPanel([
      {
        labelOn: "Hide Auto-Attacks",
        labelOff: "Show Auto-Attacks",
        state: SHOW_AUTO_ATTACKS,
        onToggle: (newState) => {
          SHOW_AUTO_ATTACKS = newState;
          rerenderBuffCells(fightTable, report); // re-render efficiently
        },
      },
      {
        labelOn: "Hide Combined DoTs",
        labelOff: "Show Combined DoTs",
        state: SHOW_COMBINED_DOTS,
        onToggle: (newState) => {
          SHOW_COMBINED_DOTS = newState;
          rerenderBuffCells(fightTable, report);
        },
      },
      {
        labelOn: "Disable Target Player Highlight",
        labelOff: "Enable Target Player Highlight",
        state: ENABLE_COLUMN_HIGHLIGHT,
        onToggle: (newState) => {
          ENABLE_COLUMN_HIGHLIGHT = newState;
        },
      },
      {
        labelOn: "Show Buffs (Detailed)",
        labelOff: "Show Abilities Only",
        state: SHOW_ABILITIES_ONLY,
        onToggle: (newState) => {
          SHOW_ABILITIES_ONLY = newState;
          rerenderBuffCells(fightTable, report);
        },
      },
      {
        type: "reset-player",
        label: "Reset Player Filter",
        state: false,
        onClick: () => {
          SELECTED_PLAYERS.clear();
          rerenderBuffCells(fightTable, report);
          updateResetButtonState(); // ensure button greys out again
        },
      },
    ]);

    // Assemble stacked layout
    headerContainer.appendChild(titleEl);
    headerContainer.appendChild(controlPanel);
    section.appendChild(headerContainer);

    const timestamps = Object.keys(fightTable.rows)
      .map((n) => parseInt(n, 10))
      .sort((a, b) => a - b);

    // 🔑 Resolve player metadata from IDs using global actorById
    const allActors = fightTable.friendlyPlayerIds
      .map((id) => report.actorById.get(id))
      .filter(
        (a) =>
          a &&
          a.type === "Player" &&
          a.name !== "Multiple Players" &&
          a.name !== "Limit Break"
      );

    // 🔑 Sort actors according to AppConfig (Tank → Healer → DPS order)
    const sortedActors = sortActorsByJob(allActors);

    log.debug(
      `Rendering pull ${fightTable.fightId} with ${timestamps.length} rows and ${sortedActors.length} player columns`
    );

    if (timestamps.length > 0) {
      const container = document.createElement("div");
      container.classList.add("time-table-container");

      const table = document.createElement("table");
      table.classList.add("time-table");

      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      // Base headers
      headerRow.innerHTML =
        "<th>Timestamp</th><th>Attack Name</th><th class='damage-col'>Damage</th>";

      // Player headers
      sortedActors.forEach((actor) => {
        const roleClass = getRoleClass(actor.subType);
        const th = document.createElement("th");
        th.className = roleClass;
        th.textContent = actor.name;

        // 🔹 Make header clickable
        th.addEventListener("click", () => {
          if (SELECTED_PLAYERS.has(actor.name)) {
            SELECTED_PLAYERS.delete(actor.name); // toggle off
          } else {
            SELECTED_PLAYERS.add(actor.name); // toggle on
          }
          rerenderBuffCells(fightTable, report); // reapply filtering
        });

        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      timestamps.forEach((ms) => {
        const row = document.createElement("tr");
        const event = fightTable.rows[ms];

        // 🚫 Filter rows by selected players
        if (SELECTED_PLAYERS.size > 0) {
          const targets = getRowTargets(event);
          const hasMatch = targets.some((t) => SELECTED_PLAYERS.has(t));
          if (!hasMatch) return;
        }

        const tdTime = document.createElement("td");
        tdTime.textContent = formatRelativeTime(ms, 0);
        row.appendChild(tdTime);

        const tdAbility = document.createElement("td");
        tdAbility.textContent = event.ability || "";
        row.appendChild(tdAbility);

        // Damage Info cell (arrow style, uses precomputed fields)
        const tdDamage = document.createElement("td");
        tdDamage.classList.add("damage-col");
        if (
          event.amount != null &&
          event.unmitigatedAmount != null &&
          event.mitigationPct != null
        ) {
          tdDamage.innerHTML = `${event.unmitigatedAmount} → ${event.amount}<br>(${event.mitigationPct}% mit)`;
        } else {
          tdDamage.textContent = "-";
        }
        row.appendChild(tdDamage);

        // Buff columns per player
        sortedActors.forEach((actor) => {
          const td = document.createElement("td");
          td.classList.add(getRoleClass(actor.subType));

          // Check if player is dead at this timestamp
          if (event.deaths && event.deaths.includes(actor.name)) {
            td.style.color = "#6b7280"; // grey text
            td.style.backgroundColor = "#f3f4f6"; // light grey background
            row.appendChild(td);
            return; // skip buff rendering
          }

          // Look up buffs applied to this actor at this timestamp
          const rawBuffs = [];
          for (const [buffName, appliers] of Object.entries(event.buffs)) {
            if (appliers.includes(actor.name)) {
              rawBuffs.push(buffName);
            }
          }

          // Apply toggle: show raw buffs or collapse into abilities
          let displayBuffs = rawBuffs;
          if (SHOW_ABILITIES_ONLY) {
            displayBuffs = resolveBuffsToAbilities(rawBuffs);
          }

          // Wrap in span with coloring, then stack vertically
          const styledBuffs = displayBuffs.map((buff) => {
            const matched = isJobAbility(buff, actor.subType);
            return `<div><span style="color:${
              matched ? "#000" : "#b45309"
            }">${buff}</span></div>`;
          });

          // Insert into cell
          td.innerHTML = styledBuffs.length > 0 ? styledBuffs.join("") : "";

          // Highlight target cell (compare event.actor to this actor’s name)
          const targets = getRowTargets(event);
          if (targets.includes(actor.name)) {
            td.classList.add("target-cell");
            log.debug(
              `[RenderFight] Marked target column for actor="${actor.name}" at ts=${ms}`
            );
          }

          row.appendChild(td);
        });

        tbody.appendChild(row);
        enableHeaderHighlight(table, row);
      });
      table.appendChild(tbody);

      const wrapper = document.createElement("div");
      wrapper.classList.add("time-table-wrapper");
      wrapper.appendChild(table);
      container.appendChild(wrapper);
      section.appendChild(container);

      // Activate frozen header
      makeFrozenHeader(table, section);
    }

    fightContainer.appendChild(section);

    // 🔁 Schedule re-render once buff lookups are finished
    waitForBuffLookups(() => rerenderBuffCells(fightTable, report));
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
        const fightTable = await loadFightTable(f);
        renderFight(fightTable);
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
 * Create and manage a frozen (sticky) header for a time-table.
 *
 * Behavior:
 *   - Clones the live <thead> into a fixed-position header.
 *   - Syncs column widths and heights with the live table.
 *   - Updates position on scroll and resize.
 *   - Forwards click events from frozen header cells to live headers
 *     (keeps player selection behavior consistent).
 *   - Resyncs widths after clicks to prevent size shifts.
 *
 * @param {HTMLTableElement} table - The fight table to freeze header for
 */
function makeFrozenHeader(table) {
  const thead = table.querySelector("thead");
  if (!thead) return;

  const wrapper = table.closest(".time-table-wrapper");
  if (!wrapper) return;

  const frozen = document.createElement("table");
  frozen.className = table.className + " frozen-header";
  frozen.style.position = "fixed";
  frozen.style.top = "0";
  frozen.style.zIndex = "1000";
  frozen.style.display = "none";
  frozen.style.background = "#fff";
  frozen.style.tableLayout = "fixed";

  const clonedThead = thead.cloneNode(true);
  frozen.appendChild(clonedThead);

  // Sync clicks from frozen headers to live headers
  const liveHeaders = thead.querySelectorAll("th");
  const frozenHeaders = clonedThead.querySelectorAll("th");
  frozenHeaders.forEach((fh, idx) => {
    const live = liveHeaders[idx];
    if (!live) return;

    fh.style.cursor = "pointer"; // show clickable

    fh.addEventListener("click", (e) => {
      e.stopPropagation();
      live.click(); // delegate to live header’s handler

      // Force resync after the click to avoid size shift
      requestAnimationFrame(() => syncWidths(false));
    });
  });

  wrapper.parentNode.insertBefore(frozen, wrapper.nextSibling);

  let initialized = false;

  function syncWidths(forceRetry = true) {
    const rect = table.getBoundingClientRect();
    frozen.style.width = `${rect.width}px`;
    frozen.style.left = `${rect.left}px`;
    frozen.style.tableLayout = "fixed";

    const origCells = thead.querySelectorAll("th");
    const frozenCells = frozen.querySelectorAll("th");

    let totalFrozenWidth = 0;

    origCells.forEach((cell, i) => {
      if (frozenCells[i]) {
        const width = cell.offsetWidth; // ✅ more stable than getBoundingClientRect()
        const height = cell.offsetHeight;
        frozenCells[i].style.width = `${width}px`;
        frozenCells[i].style.minWidth = `${width}px`;
        frozenCells[i].style.maxWidth = `${width}px`;

        frozenCells[i].style.height = `${height}px`;
        frozenCells[i].style.minHeight = `${height}px`;
        frozenCells[i].style.maxHeight = `${height}px`;

        frozenCells[i].style.overflow = "hidden"; // still prevent overflow bleed
        frozenCells[i].style.whiteSpace = "normal"; // allow wrapping like original
        frozenCells[i].style.wordBreak = "break-word"; // break long words if needed

        const frozenWidth = frozenCells[i].offsetWidth;
        totalFrozenWidth += frozenWidth;

        log.debug(
          `[FrozenHeader] [Sync] Col ${i}: table cell=${width}px, frozen cell=${frozenWidth}px`
        );
      }
    });

    log.debug(
      `[FrozenHeader] [Sync] table width=${rect.width}px, frozen total=${totalFrozenWidth}px`
    );

    // 🔁 If mismatch, try forcing again once
    if (forceRetry && Math.abs(rect.width - totalFrozenWidth) > 1) {
      log.warn("[FrozenHeader] [Retry] width mismatch, retrying sync...");
      requestAnimationFrame(() => syncWidths(false));
      return;
    }

    initialized = true;
  }

  function updatePosition() {
    const rect = table.getBoundingClientRect();

    if (rect.top < 0 && rect.bottom > 0) {
      frozen.style.display = "table";

      if (!initialized) {
        requestAnimationFrame(() => syncWidths(true)); // ✅ delay sync to next paint
      }

      frozen.style.left = `${rect.left}px`;
    } else {
      frozen.style.display = "none";
      initialized = false;
    }
  }

  window.addEventListener("scroll", updatePosition);
  window.addEventListener("resize", () => {
    initialized = false;
    updatePosition();
  });
}

/**
 * Enable header highlighting when hovering rows.
 *
 * Behavior:
 *   - On row hover, finds the `.target-cell` in that row.
 *   - Highlights the corresponding player column header
 *     in both live and frozen headers.
 *   - Adds a small "Target" badge above the header cell.
 *   - On mouse leave, removes highlight and badge.
 *
 * Controlled by:
 *   - ENABLE_COLUMN_HIGHLIGHT toggle (if false, no effect).
 *
 * @param {HTMLTableElement} table - The fight table
 * @param {HTMLTableRowElement} row - The row element to attach listeners to
 */
function enableHeaderHighlight(table, row) {
  row.addEventListener("mouseenter", () => {
    if (!ENABLE_COLUMN_HIGHLIGHT) return;

    const targetCell = row.querySelector(".target-cell");
    if (!targetCell) return;

    const cellIndex = Array.from(row.children).indexOf(targetCell);

    // Highlight live header cell
    const headerCell = table.querySelector(
      `thead th:nth-child(${cellIndex + 1})`
    );
    if (headerCell) {
      headerCell.classList.add("highlight-header");

      // 🏷️ Add "Target" badge if not already present
      if (!headerCell.querySelector(".target-label")) {
        const label = document.createElement("span");
        label.className = "target-label";
        label.textContent = "Target";
        headerCell.appendChild(label);
      }
    }

    // Highlight frozen header cell
    const frozen = table.parentNode.parentNode.querySelector(".frozen-header");
    if (frozen) {
      const frozenHeaderCell = frozen.querySelector(
        `th:nth-child(${cellIndex + 1})`
      );
      if (frozenHeaderCell) {
        frozenHeaderCell.classList.add("highlight-header");

        // 🏷️ Add "Target" badge for frozen header if not already present
        if (!frozenHeaderCell.querySelector(".target-label")) {
          const label = document.createElement("span");
          label.className = "target-label";
          label.textContent = "Target";
          frozenHeaderCell.appendChild(label);
        }
      }
    }
  });

  row.addEventListener("mouseleave", () => {
    if (!ENABLE_COLUMN_HIGHLIGHT) return;

    // Remove from live header
    table.querySelectorAll("thead th.highlight-header").forEach((th) => {
      th.classList.remove("highlight-header");
      const label = th.querySelector(".target-label");
      if (label) label.remove(); // remove badge on exit
    });

    // Remove from frozen header
    const frozen = table.parentNode.parentNode.querySelector(".frozen-header");
    if (frozen) {
      frozen.querySelectorAll("th.highlight-header").forEach((th) => {
        th.classList.remove("highlight-header");
        const label = th.querySelector(".target-label");
        if (label) label.remove(); // remove badge on exit
      });
    }
  });
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
function renderControlPanel(options) {
  const controlPanel = document.createElement("div");
  controlPanel.classList.add("control-panel");

  options.forEach((opt) => {
    const btn = document.createElement("button");

    if (opt.type === "reset-player") {
      // 🔹 Reset Player Filter special case
      btn.textContent = opt.label;
      btn.className = "toggle-btn disable"; // default greyed out
      btn.addEventListener("click", () => {
        if (SELECTED_PLAYERS.size > 0) {
          opt.onClick();
        }
      });

      // Save ref for external updates
      controlPanel.resetPlayerBtn = btn;
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
 * Incrementally refresh buff cells and row visibility.
 *
 * Purpose:
 *   - Avoids full table rebuild when toggles or async lookups change.
 *   - Keeps DOM stable (no flicker).
 *
 * Behavior:
 *   - Iterates over fight rows and applies filters:
 *       • Auto-Attacks hidden if SHOW_AUTO_ATTACKS = false
 *       • Combined DoTs hidden if SHOW_COMBINED_DOTS = false
 *       • Only rows with selected player targets shown (if any)
 *   - Updates buff cells per player:
 *       • Raw buffs or collapsed into abilities
 *       • Styled with role/job matching
 *       • Vulnerabilities shown in red
 *   - Updates header greying to match player selection.
 *   - Updates Reset Player Filter button state.
 *
 * @param {Object} fightTable - Parsed FightTable with rows + buffs
 * @param {Object} report - Report reference (for actor lookups)
 */
function rerenderBuffCells(fightTable, report) {
  const table = fightContainer.querySelector("table.time-table");
  if (!table) return;

  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  const timestamps = Object.keys(fightTable.rows)
    .map((n) => parseInt(n, 10))
    .sort((a, b) => a - b);

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

  timestamps.forEach((ms, rowIndex) => {
    const event = fightTable.rows[ms];
    const row = tbody.rows[rowIndex];
    if (!row) return;

    // 🚫 Hide Auto-Attacks / DoTs
    if (
      (!SHOW_AUTO_ATTACKS && event.ability === "Attack") ||
      (!SHOW_COMBINED_DOTS && event.ability === "Combined DoTs")
    ) {
      row.style.display = "none";
      return;
    } else {
      row.style.display = "";
    }

    // 🚫 Hide rows if they don’t match selected players
    if (
      SELECTED_PLAYERS.size > 0 &&
      (!event.actor || !SELECTED_PLAYERS.has(event.actor))
    ) {
      row.style.display = "none";
    } else {
      row.style.display = ""; // ensure visible again if filter cleared
    }

    // 🚫 Hide rows if they don’t match selected players
    if (SELECTED_PLAYERS.size > 0) {
      const targets = getRowTargets(event);
      const hasMatch = targets.some((t) => SELECTED_PLAYERS.has(t));
      row.style.display = hasMatch ? "" : "none";
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
      if (SHOW_ABILITIES_ONLY) {
        displayBuffs = resolveBuffsToAbilities(rawBuffs);
      }

      const styledBuffs = displayBuffs.map((buff) => {
        const matched = isJobAbility(buff, actor.subType);
        const isVuln = isVulnerability(buff);

        let color = "#000"; // default (black)
        if (isVuln) {
          color = "#b91c1c"; // 🔴 redish, readable
        } else if (!matched) {
          color = "#228B22"; // 🟢 fallback for unknown buffs
        }

        return `<div><span style="color:${color}">${buff}</span></div>`;
      });

      td.innerHTML = styledBuffs.length > 0 ? styledBuffs.join("") : "";
    });
  });

  // 🔹 Update header styling to reflect selected players
  const liveHeaders = table.querySelectorAll("thead th");
  const frozen = table.parentNode.parentNode.querySelector(".frozen-header");
  const frozenHeaders = frozen ? frozen.querySelectorAll("th") : [];

  sortedActors.forEach((actor, idx) => {
    const headerCell = liveHeaders[idx + 3]; // offset: timestamp, ability, damage
    const frozenCell = frozenHeaders[idx + 3];

    if (SELECTED_PLAYERS.size > 0 && !SELECTED_PLAYERS.has(actor.name)) {
      headerCell?.classList.add("player-deselected");
      frozenCell?.classList.add("player-deselected");
    } else {
      headerCell?.classList.remove("player-deselected");
      frozenCell?.classList.remove("player-deselected");
    }
  });

  updateResetButtonState();
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
function getRowTargets(event) {
  if (event.actor) {
    return [event.actor];
  }
  return [];
}

/**
 * Update the Reset Player Filter button’s visual state.
 *
 * Behavior:
 *   - If one or more players are selected:
 *       • Button styled as "enable" (lit up).
 *   - If no players are selected:
 *       • Button styled as "disable" (greyed out).
 *
 * Called:
 *   - At the end of rerenderBuffCells().
 *   - After clearing selection via Reset button.
 */
function updateResetButtonState() {
  const resetBtn = document.querySelector(".control-panel").resetPlayerBtn;
  if (!resetBtn) return;
  if (SELECTED_PLAYERS.size > 0) {
    resetBtn.className = "toggle-btn enable";
  } else {
    resetBtn.className = "toggle-btn disable";
  }
}
