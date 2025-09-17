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
  outputEl.innerHTML = `<h3>${report.title}</h3>`;

  for (const f of fightsWithEvents) {
    const section = document.createElement("section");
    section.innerHTML = `<h4>Encounter ID: ${f.encounterID} (Fight ID: ${f.id})</h4>`;

    // collect all unique actors for column headers
    const actors = Array.from(report.actorById.values());
    const actorNames = [...new Set(actors.map((a) => a.name))].filter(
      (name) => name !== "Multiple Players"
    );

    // group events by timestamp
    const eventsByTime = new Map();
    f.events.forEach((ev) => {
      if (!eventsByTime.has(ev.timestamp)) {
        eventsByTime.set(ev.timestamp, {});
      }
      eventsByTime.get(ev.timestamp)[ev.actor] = ev.ability;
    });

    // sort timestamps numerically
    const sortedTimestamps = Array.from(eventsByTime.keys()).sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );

    // build table
    const table = document.createElement("table");
    table.classList.add("time-table");

    // header row
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.innerHTML =
      "<th>Timestamp (s)</th>" +
      actorNames.map((name) => `<th>${name}</th>`).join("");
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // body rows
    const tbody = document.createElement("tbody");
    sortedTimestamps.forEach((ts) => {
      const row = document.createElement("tr");
      const evs = eventsByTime.get(ts);

      // timestamp cell
      const tdTime = document.createElement("td");
      tdTime.textContent = ts;
      row.appendChild(tdTime);

      // one cell per actor
      actorNames.forEach((name) => {
        const td = document.createElement("td");
        td.textContent = evs[name] || "";
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    section.appendChild(table);
    outputEl.appendChild(section);
  }

  log.debug("Rendered fights as time tables", fightsWithEvents);
}
