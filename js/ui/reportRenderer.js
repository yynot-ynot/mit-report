import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import { formatRelativeTime } from "../utility/dataUtils.js";

setModuleLogLevel("ReportRenderer", "info");
const log = getLogger("ReportRenderer");

export function renderReport(outputEl, report, fightsWithTables) {
  outputEl.innerHTML = `<div class="report-category">${report.title}</div>`;

  const fightsByBoss = new Map();
  fightsWithTables.forEach((f) => {
    if (!fightsByBoss.has(f.encounterId)) {
      fightsByBoss.set(f.encounterId, []);
    }
    fightsByBoss.get(f.encounterId).push(f);
  });

  const reportWrapper = document.createElement("div");
  reportWrapper.classList.add("report-wrapper");

  const bossTabs = document.createElement("div");
  bossTabs.classList.add("boss-tabs");
  reportWrapper.appendChild(bossTabs);

  const pullGrid = document.createElement("div");
  pullGrid.classList.add("pull-grid");
  reportWrapper.appendChild(pullGrid);

  const fightContainer = document.createElement("div");
  fightContainer.id = "fightContainer";
  reportWrapper.appendChild(fightContainer);

  outputEl.appendChild(reportWrapper);

  function renderFight(fightTable) {
    fightContainer.innerHTML = "";

    const section = document.createElement("section");
    section.innerHTML = `<h4>${fightTable.name} (Fight ID: ${fightTable.fightId})</h4>`;

    const timestamps = Object.keys(fightTable.rows)
      .map((n) => parseInt(n, 10))
      .sort((a, b) => a - b);

    log.debug(
      `Rendering fight ${fightTable.fightId} with ${
        timestamps.length
      } rows and ${Object.keys(fightTable.actors).length} player columns`
    );

    if (timestamps.length > 0) {
      const table = document.createElement("table");
      table.classList.add("time-table");

      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      headerRow.innerHTML =
        "<th>Timestamp</th><th>Attack Name</th>" +
        Object.values(fightTable.actors)
          .map((actor) => `<th>${actor.name}</th>`)
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

        Object.values(fightTable.actors).forEach((actor) => {
          const td = document.createElement("td");

          // Look up buffs applied to this actor at this timestamp
          const playerBuffs = [];
          for (const [buffName, appliers] of Object.entries(event.buffs)) {
            if (appliers.includes(actor.name)) {
              playerBuffs.push(buffName);
            }
          }

          td.textContent = playerBuffs.length > 0 ? playerBuffs.join(", ") : "";
          row.appendChild(td);
        });

        tbody.appendChild(row);
      });
      table.appendChild(tbody);

      section.appendChild(table);
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
      box.dataset.fightId = f.fightId;

      box.addEventListener("click", () => {
        document
          .querySelectorAll(".pull-box")
          .forEach((b) => b.classList.remove("active"));
        box.classList.add("active");
        renderFight(f);
      });

      pullGrid.appendChild(box);
    });

    if (pulls.length > 0) {
      pullGrid.firstChild.classList.add("active");
      renderFight(pulls[0]);
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
