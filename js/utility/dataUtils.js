/**
 * Convert FFLogs event timestamp to "Xm Ys" format relative to fight start.
 * Example: 63.234 -> " 1m 03.234s", 624.789 -> "10m 24.789s"
 */
export function formatRelativeTime(eventTimestamp, fightStartTime) {
  const relativeMs = eventTimestamp - fightStartTime;
  const totalSeconds = relativeMs / 1000;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);

  // pad minutes to 2 chars, seconds to 2 chars, millis to 3 chars
  const minStr = String(minutes).padStart(2, " ");
  const secStr = String(seconds).padStart(2, "0");
  const msStr = String(millis).padStart(3, "0");

  return `${minStr}m ${secStr}.${msStr}s`;
}
