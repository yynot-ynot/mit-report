/**
 * filterState.js
 *
 * Encapsulates all UI filter states (toggles and selections) for a single fight.
 * Each fight gets its own FilterState instance, preventing cross-fight contamination.
 *
 * Responsibilities:
 *   - Manage boolean toggles for rendering options (auto attacks, combined DoTs, etc.).
 *   - Track selected players for row/column filtering.
 *   - Provide methods to reset state (e.g. clear player selections).
 *   - Ensure state is encapsulated per fight instance (no global leakage).
 */
export class FilterState {
  constructor() {
    /** @type {boolean} Highlight the full target column when enabled */
    this.enableColumnHighlight = true;

    /** @type {boolean} Collapse buffs into originating abilities */
    this.showAbilitiesOnly = false;

    /** @type {boolean} Whether to display auto-attacks in fight tables */
    this.showAutoAttacks = false;

    /** @type {boolean} Whether to combine DoTs into a single entry */
    this.showCombinedDots = false;

    /** @type {boolean} Whether to show condensed (grouped) view by default */
    this.showCondensedView = true;

    /** @type {Set<string>} Set of currently selected player names for filtering */
    this.selectedPlayers = new Set();

    /** @type {HTMLButtonElement|null} Reference to the Reset Player Filter button */
    this.resetPlayerBtn = null;

    /** @type {boolean} Whether to show botched mitigation comparisons */
    this.showBotchedMitigations = true;

    /** @type {boolean} Whether mitigation availability indicators are rendered */
    this.showAvailableMitigations = true;
  }

  /**
   * Reset all player selections.
   * Clears the selectedPlayers set.
   */
  resetPlayers() {
    this.selectedPlayers.clear();
  }

  /**
   * Toggle a player in the filter.
   *
   * @param {string} playerName - The player to toggle on/off
   */
  togglePlayer(playerName) {
    if (this.selectedPlayers.has(playerName)) {
      this.selectedPlayers.delete(playerName); // toggle off
    } else {
      this.selectedPlayers.add(playerName); // toggle on
    }
  }

  /**
   * Check if a player is selected.
   *
   * @param {string} playerName - Player name to check
   * @returns {boolean} true if the player is selected
   */
  isPlayerSelected(playerName) {
    return this.selectedPlayers.has(playerName);
  }

  /**
   * Check if any players are selected at all.
   *
   * @returns {boolean} true if at least one player is selected
   */
  hasSelections() {
    return this.selectedPlayers.size > 0;
  }
}
