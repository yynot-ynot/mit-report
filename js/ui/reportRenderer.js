import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import { formatRelativeTime } from "../utility/dataUtils.js";
import { getRoleClass, sortActorsByJob } from "../config/AppConfig.js";

setModuleLogLevel("ReportRenderer", "info");
const log = getLogger("ReportRenderer");

// Toggle for highlighting full target column
let ENABLE_COLUMN_HIGHLIGHT = true;

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
   * Render a single fight's table into the UI.
   *
   * Columns:
   *   - Timestamp: relative time of the event
   *   - Attack Name: ability name
   *   - Damage: compact arrow format "unmitigated → amount (-mitigationPct%)"
   *   - Player columns: show buffs active on each player at that timestamp
   *
   * Enhancement:
   *   - Damage values now come directly from parser (`amount`, `unmitigatedAmount`, `mitigationPct`)
   *     instead of recalculating in the renderer.
   *   - Keeps renderer focused on formatting and display only.
   *
   * @param {Object} fightTable - parsed FightTable object
   */
  async function renderFight(fightTable) {
    // log the fightTable object
    log.debug("[RenderFight] fightTable object:", fightTable);
    fightContainer.innerHTML = "";

    const section = document.createElement("section");

    // Header row container (flexbox)
    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.alignItems = "center";
    headerRow.style.justifyContent = "space-between";

    // Fight title
    const titleEl = document.createElement("h4");
    titleEl.textContent = `${fightTable.name} (Pull: ${fightTable.fightId})`;

    // Toggle button
    const toggleBtn = document.createElement("button");
    function updateToggleStyle() {
      toggleBtn.textContent = ENABLE_COLUMN_HIGHLIGHT
        ? "Disable Target Column Highlight"
        : "Enable Target Column Highlight";
      toggleBtn.className = ENABLE_COLUMN_HIGHLIGHT
        ? "toggle-btn disable"
        : "toggle-btn enable";
    }
    toggleBtn.addEventListener("click", () => {
      ENABLE_COLUMN_HIGHLIGHT = !ENABLE_COLUMN_HIGHLIGHT;
      updateToggleStyle();
    });
    updateToggleStyle();

    // Assemble header row
    headerRow.appendChild(titleEl);
    headerRow.appendChild(toggleBtn);
    section.appendChild(headerRow);

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
      headerRow.innerHTML =
        "<th>Timestamp</th><th>Attack Name</th><th class='damage-col'>Damage</th>" +
        sortedActors
          .map((actor) => {
            const roleClass = getRoleClass(actor.subType);
            return `<th class="${roleClass}">${actor.name}</th>`;
          })
          .join("");
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      timestamps.forEach((ms) => {
        const row = document.createElement("tr");
        const event = fightTable.rows[ms];

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

          // Look up buffs applied to this actor at this timestamp
          const playerBuffs = [];
          for (const [buffName, appliers] of Object.entries(event.buffs)) {
            if (appliers.includes(actor.name)) {
              playerBuffs.push(buffName);
            }
          }

          td.textContent = playerBuffs.length > 0 ? playerBuffs.join(", ") : "";

          // Highlight target cell (compare event.actor to this actor’s name)
          if (event.actor && actor.name === event.actor) {
            td.classList.add("target-cell");
            log.debug(
              `[RenderFight] Marked target column for actor="${actor.name}" at ts=${ms}`
            );
          }

          row.appendChild(td);
        });

        tbody.appendChild(row);
        enableColumnHighlight(table, row);
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
      pullGrid.firstChild.classList.add("active");
      pullGrid.firstChild.click();
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
 * Enable column highlight on row hover.
 *
 * When a row is hovered, the `.target-cell` in that row is located,
 * its column index is determined, and the entire column (header + all rows)
 * is highlighted. Highlight is removed on mouse leave.
 *
 * @param {HTMLTableElement} table - The table element to apply highlighting in
 * @param {HTMLTableRowElement} row - The row element being configured
 */
function enableColumnHighlight(table, row) {
  row.addEventListener("mouseenter", () => {
    if (!ENABLE_COLUMN_HIGHLIGHT) return; // 🚫 skip if disabled
    const targetCell = row.querySelector(".target-cell");
    if (!targetCell) return;

    const cellIndex = Array.from(row.children).indexOf(targetCell);

    // Highlight same column across table (header + body)
    table
      .querySelectorAll(
        `tr td:nth-child(${cellIndex + 1}), tr th:nth-child(${cellIndex + 1})`
      )
      .forEach((cell) => cell.classList.add("highlight-col"));
  });

  row.addEventListener("mouseleave", () => {
    if (!ENABLE_COLUMN_HIGHLIGHT) return; // 🚫 skip if disabled
    table
      .querySelectorAll(".highlight-col")
      .forEach((cell) => cell.classList.remove("highlight-col"));
  });
}
