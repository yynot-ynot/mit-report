/**
 * fightState.js
 *
 * Encapsulates per-fight state into a single class.
 * Each fight gets its own FightState instance, which includes:
 *   - fightTable: parsed timeline data (rows, buffs, vulns, deaths).
 *   - filters: FilterState instance for UI toggles + selections.
 *   - buffAnalysis: BuffAnalysis instance for buff/vuln resolution.
 *
 * Purpose:
 *   - Prevent cross-fight contamination by isolating all state.
 *   - Provide a central object that rendering and parsing code
 *     can depend on, instead of loose globals.
 *   - Improve maintainability and testability by scoping logic
 *     inside class APIs.
 */

import { FilterState } from "./filterState.js";
import { BuffAnalysis } from "../analysis/buffAnalysis.js";

export class FightState {
  constructor(fightTable, condensedPull = null) {
    /** @type {Object} Parsed FightTable object for this fight */
    this.fightTable = fightTable;

    /** @type {Object|null} Condensed pull table (grouped summary view) */
    this.condensedPull = condensedPull;

    /** @type {BuffAnalysis} Buff/vulnerability resolution state */
    this.buffAnalysis = new BuffAnalysis();

    /** @type {FilterState} UI filter state for this fight */
    this.filters = new FilterState();

    /** @type {HTMLTableElement|null} Reference to the fight’s rendered table */
    this.tableEl = null;
  }

  /**
   * Determine whether a row should be visible under current filters.
   *
   * Combines filtering logic:
   *   - Auto-attacks toggle
   *   - Combined DoTs toggle
   *   - Player selection filtering
   *
   * @param {Object} event - Row object from fightTable.rows
   * @returns {boolean} true if row passes filters, false if hidden
   */
  isRowVisible(event) {
    // Hide auto-attacks
    if (!this.filters.showAutoAttacks && event.ability === "Attack") {
      return false;
    }

    // Hide combined DoTs
    if (!this.filters.showCombinedDots && event.ability === "Combined DoTs") {
      return false;
    }

    // If player filter is active, only show rows that match a selected player
    if (this.filters.selectedPlayers.size > 0) {
      const targets = [event.actor].filter(Boolean);
      return targets.some((t) => this.filters.selectedPlayers.has(t));
    }

    return true;
  }
}
