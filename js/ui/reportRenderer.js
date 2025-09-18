import { getLogger, setModuleLogLevel } from "../utility/logger.js";
import { formatRelativeTime } from "../utility/dataUtils.js";

setModuleLogLevel("ReportRenderer", "info");
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
      if (!eventsByTime.has(ev.relative)) {
        eventsByTime.set(ev.relative, {});
      }
      if (!eventsByTime.get(ev.relative)[ev.actor]) {
        eventsByTime.get(ev.relative)[ev.actor] = [];
      }
      eventsByTime.get(ev.relative)[ev.actor].push(ev.ability);
    });

    // Debug log: show how many events were mapped
    log.debug(
      `Fight ${fight.id}: collected ${fight.events.length} events across ${eventsByTime.size} unique timestamps`
    );

    const sortedTimestamps = Array.from(eventsByTime.keys()).sort(
      (a, b) => a - b
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
    sortedTimestamps.forEach((ms) => {
      const row = document.createElement("tr");
      const evs = eventsByTime.get(ms);

      const tdTime = document.createElement("td");
      tdTime.textContent = formatRelativeTime(ms, 0); // format at display time
      row.appendChild(tdTime);

      actorNames.forEach((name) => {
        const td = document.createElement("td");
        const abilities = evs[name];
        if (abilities) {
          td.textContent = abilities.join(", ");
        } else {
          td.textContent = "";
        }
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    section.appendChild(table);
    fightContainer.appendChild(section);

    if (fight.events.length > 0) {
      const lastEvent = fight.events[fight.events.length - 1];
      log.info(
        `Fight ${fight.id}: last parsed event timestamp = ${
          lastEvent.relative
        } ms (~${(lastEvent.relative / 1000).toFixed(1)}s)`
      );
    }

    // 🔹 Log the last displayed row time and check for ignored events
    if (sortedTimestamps.length > 0) {
      const lastTime = sortedTimestamps[sortedTimestamps.length - 1];
      log.info(
        `Fight ${fight.id}: displaying ${
          sortedTimestamps.length
        } rows, last displayed row at ${lastTime} ms (~${(
          lastTime / 1000
        ).toFixed(1)}s)`
      );

      // Look for events beyond the last displayed row
      const ignored = fight.events.filter((ev) => ev.relative > lastTime);
      if (ignored.length > 0) {
        log.warn(
          `Fight ${fight.id}: ${ignored.length} events occur AFTER last displayed row (showing 5)`,
          ignored.slice(0, 5)
        );
      }
    } else {
      log.warn(`Fight ${fight.id}: no rows rendered`);
    }
  }

  // render pulls for a given boss
  function renderPullGrid(encounterID) {
    const pulls = fightsByBoss.get(parseInt(encounterID, 10)) || [];
    pullGrid.innerHTML = "";

    pulls.forEach((f, idx) => {
      const box = document.createElement("div");
      box.textContent = idx + 1;
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
