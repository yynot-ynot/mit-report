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
