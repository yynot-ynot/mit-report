/**
 * Convert FFLogs event timestamp to "mm:ss.###" format relative to fight start.
 * Example: 1694 -> "00:01.694", 63234 -> "01:03.234", 624789 -> "10:24.789"
 */
export function formatRelativeTime(eventTimestamp, fightStartTime) {
  const relativeMs = eventTimestamp - fightStartTime;
  const totalSeconds = relativeMs / 1000;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);

  // Always pad minutes + seconds to 2 digits, millis to 3 digits
  const minStr = String(minutes).padStart(2, "0");
  const secStr = String(seconds).padStart(2, "0");
  const msStr = String(millis).padStart(3, "0");

  return `${minStr}:${secStr}.${msStr}`;
}

/**
 * Profiler utility for measuring and reporting performance of
 * major pipeline steps (auth, fetch, parse, build, render).
 *
 * Usage:
 *   const profiler = new Profiler();
 *
 *   profiler.start("Fetch Buffs");
 *   const buffs = await fetchFightBuffs(...);
 *   profiler.stop("Fetch Buffs", "Fetch", "Buffs");
 *
 *   profiler.start("Parse Buffs");
 *   const parsedBuffs = parseBuffEvents(buffs, ...);
 *   profiler.stop("Parse Buffs", "Parse", "Buffs");
 *
 *   // At the end
 *   profiler.print();
 */
export class Profiler {
  constructor() {
    this.records = [];
    this.activeTimers = new Map();
  }

  /**
   * Start timing a labeled section.
   * @param {string} label - Unique identifier for this section.
   */
  start(label) {
    this.activeTimers.set(label, performance.now());
  }

  /**
   * Stop timing and record the result.
   * @param {string} label - Label passed to start().
   * @param {string} category - Broad type (e.g. "Fetch", "Parse", "Auth", "UI").
   * @param {string} details - Additional context (e.g. "Buffs", "Deaths").
   */
  stop(label, category, details = "") {
    const startTime = this.activeTimers.get(label);
    if (startTime == null) {
      console.warn(
        `[Profiler] Tried to stop '${label}' but no timer was started.`
      );
      return;
    }

    const duration = performance.now() - startTime;
    this.records.push({
      Category: category,
      Action: label,
      Details: details,
      DurationMs: duration.toFixed(2),
    });

    this.activeTimers.delete(label);
  }

  /**
   * Utility to time an async function directly.
   * Example:
   *   await profiler.timeIt("UI", "Render Report", "", () => renderReport(...));
   */
  async timeIt(category, action, details, fn) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.records.push({
      Category: category,
      Action: action,
      Details: details,
      DurationMs: duration.toFixed(2),
    });
    return result;
  }

  /**
   * Print all recorded timings in a nice console.table.
   * Shows only DurationSec for readability.
   */
  print() {
    const tableData = this.records.map((rec) => ({
      Details: rec.Details,
      Category: rec.Category,
      DurationSec: (rec.DurationMs / 1000).toFixed(3), // seconds only
      Action: rec.Action,
    }));

    console.table(tableData);
  }
}
