/**
 * buffAnalysis.js
 *
 * Utility functions to determine if a given ability/buff belongs
 * to the specified job, using the job configs in AppConfig.
 */

import { loadJobConfig } from "../config/AppConfig.js";

/**
 * Check if a given ability/buff is part of a specific job's actions.
 *
 * @param {string} buffName - The ability/buff name to check (e.g. "Kerachole")
 * @param {string} job - The job subType (e.g. "Sage", "Warrior")
 * @returns {boolean} true if the buff/ability belongs to the job, false otherwise
 */
export function isJobAbility(buffName, job) {
  if (!buffName || !job) return false;

  const jobConfig = loadJobConfig(job);
  if (!jobConfig || !jobConfig.actions) return false;

  // Case-insensitive match on keys of actions
  const normalizedBuff = buffName.trim().toLowerCase();
  return Object.keys(jobConfig.actions).some(
    (actionName) => actionName.trim().toLowerCase() === normalizedBuff
  );
}
