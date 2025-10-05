import mitigationData from "../config/mitigationDataset.js";
import {
  getLogger,
  setModuleLogLevel,
  envLogLevel,
} from "../utility/logger.js";

setModuleLogLevel("JobConfigHelper", envLogLevel("info", "warn"));
const log = getLogger("JobConfigHelper");

/**
 * Retrieves the mitigation percentage for a given buff name across all jobs.
 *
 * This function performs a global search in the mitigation dataset to find
 * the buff’s mitigation value. It supports conditional lookups based on
 * damage type (e.g., physical vs. magical) and target job relation (self/ally).
 *
 * Lookup behavior:
 *  1. Search through all job datasets for a direct name match.
 *  2. If not found, also check each job’s alias table.
 *  3. If multiple variants exist (e.g., physical/magical or self/ally),
 *     the variant whose `condition` or target type matches the provided
 *     `damageType` or `targetJob` will be prioritized.
 *  4. If multiple entries exist but all share the same mitigation value,
 *     they are treated as equivalent and no conflict is logged.
 *
 * Logging:
 *   - Logs conflicts only when unique mitigation values differ.
 *   - Adds target relation context (`self` vs. `ally`).
 *
 * @param {string} buffName - The name or alias of the mitigation ability.
 * @param {("physical"|"magical"|null)} [damageType=null] - Optional hint for which condition to prefer.
 * @param {string|null} [targetJob=null] - Optional target's job name (used to differentiate self vs ally).
 * @returns {number|null} The mitigation percentage as a decimal (e.g., 0.15 for 15%), or null if not found.
 */
export function getMitigationPercent(
  buffName,
  damageType = null,
  targetJob = null
) {
  if (!buffName) return null;
  const normalized = buffName.trim().toLowerCase();
  const matches = [];

  // Search across all jobs
  for (const [jobName, jobBuffs] of Object.entries(
    mitigationData.mitigationEffects
  )) {
    for (const buff of jobBuffs) {
      if (buff.name.trim().toLowerCase() === normalized) {
        matches.push({ job: jobName, buff });
      }
    }

    // Search aliases
    const aliasMap = mitigationData.aliases[jobName] || {};
    for (const [alias, canonicalName] of Object.entries(aliasMap)) {
      if (alias.trim().toLowerCase() === normalized) {
        const targetBuff = jobBuffs.find((b) => b.name === canonicalName);
        if (targetBuff) {
          matches.push({ job: jobName, buff: targetBuff, alias });
        }
      }
    }
  }

  if (matches.length === 0) return null;

  // Deduplicate entries that share the same mitigation percentage
  const uniqueEntries = [];
  const seen = new Set();

  for (const m of matches) {
    const key = `${m.buff.name}|${m.buff.amount}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEntries.push(m);
    }
  }

  // Apply damageType filter early — only keep buffs matching the requested condition
  let filteredEntries = uniqueEntries;
  if (damageType) {
    const byCondition = uniqueEntries.filter((m) =>
      m.buff.condition?.toLowerCase().includes(damageType)
    );

    // If any conditional matches exist, prefer them and discard the rest
    if (byCondition.length > 0) {
      filteredEntries = byCondition;
    }
  }

  // Apply target relation filter — prefer self/ally variant if targetJob is known
  if (targetJob) {
    const byRelation = filteredEntries.filter((m) => {
      // Normalize job name to lower case for comparison
      const jobMatch =
        m.job.trim().toLowerCase() === targetJob.trim().toLowerCase();
      const target = m.buff.target?.toLowerCase();
      if (jobMatch && target === "self") return true; // self mitigation
      if (!jobMatch && target === "ally") return true; // ally mitigation
      return false;
    });

    if (byRelation.length > 0) {
      filteredEntries = byRelation;
    }
  }

  // Pick the first entry (after applying all filters)
  let chosen = filteredEntries[0];

  //️ Log remaining conflicts only if unique mitigation percentages differ
  const uniqueAmounts = new Set(filteredEntries.map((m) => m.buff.amount));
  if (uniqueAmounts.size > 1) {
    log.warn(
      `=== Mitigation conflicts for "${buffName}" (damageType: ${
        damageType || "none"
      }, targetJob: ${targetJob || "unknown"}) ===`
    );
    for (const { job, buff, alias } of filteredEntries) {
      const aliasStr = alias ? ` (alias: ${alias})` : "";
      const relation =
        targetJob && job.trim().toLowerCase() === targetJob.trim().toLowerCase()
          ? "self"
          : "ally";
      const conditionStr = buff.condition
        ? ` (condition: ${buff.condition})`
        : "";
      const targetStr = buff.target ? ` to ${buff.target}` : "";
      log.warn(
        `- ${job.toUpperCase()}${aliasStr}: ${buff.name} → ${
          buff.amount
        }%${targetStr}${conditionStr} [${relation}]`
      );
    }

    if (damageType && chosen) {
      log.warn(
        `→ Selected variant for "${damageType}" damage: ${chosen.job}/${chosen.buff.name}`
      );
    }
  }

  // Return the mitigation value as a decimal (rounded to two decimal places)
  if (!chosen?.buff?.amount) return null;

  const mitValue = chosen.buff.amount / 100;

  // Fix floating-point precision by rounding to 0.01
  return Math.round(mitValue * 100) / 100;
}
