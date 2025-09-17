import { getLogger, setModuleLogLevel } from "../utility/logger.js";

setModuleLogLevel("ReportRenderer", "debug");
const log = getLogger("ReportRenderer");

/**
 * Render fights as time tables:
 * Rows = timestamps
 * Columns = players
 * Cells = abilities
 */
export function renderReport(outputEl, report, fightsWithEvents) {
  // reset output
  outputEl.innerHTML = `<div class="report-category">${report.title}</div>`;

  // group fights by encounterID
  const fightsByBoss = new Map();
  fightsWithEvents.forEach((f) => {
    if (!fightsByBoss.has(f.encounterID)) {
      fightsByBoss.set(f.encounterID, []);
    }
    fightsByBoss.get(f.encounterID).push(f);
  });

  // build main wrapper
  const reportWrapper = document.createElement("div");
  reportWrapper.classList.add("report-wrapper");

  // --- Boss tabs ---
  const bossTabs = document.createElement("div");
  bossTabs.classList.add("boss-tabs");
  reportWrapper.appendChild(bossTabs);

  // --- Pull grid ---
  const pullGrid = document.createElement("div");
  pullGrid.classList.add("pull-grid");
  reportWrapper.appendChild(pullGrid);

  // --- Fight container ---
  const fightContainer = document.createElement("div");
  fightContainer.id = "fightContainer";
  reportWrapper.appendChild(fightContainer);

  // append wrapper to output
  outputEl.appendChild(reportWrapper);

  // render one fight table
  function renderFight(fight) {
    fightContainer.innerHTML = ""; // clear previous

    const section = document.createElement("section");
    section.innerHTML = `<h4>Encounter ID: ${fight.encounterID} (Fight ID: ${fight.id})</h4>`;

    // Only include actors that were part of this fight
    const actors = fight.friendlyPlayers
      .map((id) => report.actorById.get(id))
      .filter(
        (a) => a && a.name !== "Multiple Players" && a.name !== "Limit Break"
      );

    // Get unique names, sorted alphanumerically
    const actorNames = [...new Set(actors.map((a) => a.name))].sort((a, b) =>
      a.localeCompare(b)
    );

    const eventsByTime = new Map();
    fight.events.forEach((ev) => {
      if (!eventsByTime.has(ev.timestamp)) {
        eventsByTime.set(ev.timestamp, {});
      }
      eventsByTime.get(ev.timestamp)[ev.actor] = ev.ability;
    });

    const sortedTimestamps = Array.from(eventsByTime.keys()).sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );

    const table = document.createElement("table");
    table.classList.add("time-table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.innerHTML =
      "<th>Timestamp</th>" +
      actorNames.map((name) => `<th>${name}</th>`).join("");
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    sortedTimestamps.forEach((ts) => {
      const row = document.createElement("tr");
      const evs = eventsByTime.get(ts);

      const tdTime = document.createElement("td");
      tdTime.textContent = ts;
      row.appendChild(tdTime);

      actorNames.forEach((name) => {
        const td = document.createElement("td");
        td.textContent = evs[name] || "";
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    section.appendChild(table);
    fightContainer.appendChild(section);
  }

  // render pulls for a given boss
  function renderPullGrid(encounterID) {
    const pulls = fightsByBoss.get(parseInt(encounterID, 10)) || [];
    pullGrid.innerHTML = "";

    pulls.forEach((f, idx) => {
      const box = document.createElement("div");
      box.textContent = idx + 1; // just number
      box.classList.add("pull-box");
      box.dataset.fightId = f.id;

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

  // build boss tabs
  fightsByBoss.forEach((pulls, encounterID) => {
    const tab = document.createElement("div");
    const bossName = pulls[0]?.name || `Encounter ${encounterID}`;
    tab.textContent = bossName;
    tab.classList.add("boss-tab");
    tab.dataset.encounterId = encounterID;

    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".boss-tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderPullGrid(encounterID);
    });

    bossTabs.appendChild(tab);
  });

  // auto-select first boss if present
  const firstTab = bossTabs.querySelector(".boss-tab");
  if (firstTab) {
    firstTab.classList.add("active");
    renderPullGrid(firstTab.dataset.encounterId);
  }
}
