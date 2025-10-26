/**
 * Generate a condensed version of a fight table by grouping related attacks together.
 *
 * This function scans through a fight’s damage table and produces a summarized structure
 * where sequential attacks of the same name — occurring close together in time —
 * are grouped into a single "condensed attack set".
 *
 * Each condensed set represents a mechanic or burst window, combining all related
 * attacks, buffs, mitigation, and death state data into one summary block.
 *
 * ---
 * GROUPING LOGIC
 * ---
 * 1. Iterate through all fight table rows in chronological order.
 * 2. Group attacks by their ability name (e.g., "Fear of Death", "Attack").
 * 3. A new group is started when:
 *    - It's the first occurrence of that ability, OR
 *    - The current attack occurs more than 2000 ms (2 seconds) after
 *      the first attack in the current group for that ability.
 * 4. All attacks within that time window are collected as a single "set".
 *
 * ---
 * OUTPUT STRUCTURE
 * ---
 * Returns a **new object** (not a mutation of fightTable) structured as:
 *
 * {
 *   fightId: number,
 *   encounterId: number,
 *   name: string,
 *   condensedSets: [
 *     {
 *       timestamp: number,          // earliest timestamp among grouped attacks
 *       ability: string,            // name of the attack group
 *
 *       // --- Aggregated per-player summary (stats + buffs + death state) ---
 *       players: {
 *         [playerName: string]: {
 *           buffs: [ "Buff1", "Buff2", ... ],  // merged list of buffs applied by this player
 *           unmitigatedAmount: number,         // total unmitigated damage across all grouped hits
 *           amount: number,                    // total mitigated damage taken
 *           absorbed: number,                  // total absorbed/shielded amount
 *           mitigationPct: number,             // average % mitigated (mean of all hits)
 *           intendedMitPct: number,            // average intended mitigation (mean of all hits)
 *           availableMitigations: string[],    // mitigation abilities off cooldown at the set timestamp
 *           dead: boolean,                     // true if dead in any hit within the group
 *           wasTargeted: boolean               // true if this player was the target (actor) in any hit
 *         }
 *       },
 *       availableMitigationsByPlayer: {        // per-set union of mitigation availability
 *         [playerName: string]: string[]
 *       },
 *
 *       // --- Child events (subset of FightTable.rows entries) ---
 *       children: [
 *         {
 *           timestamp: number,
 *           actor: string,               // player who took the hit
 *           ability: string,             // ability name
 *           amount: number,              // post-mitigation damage
 *           unmitigatedAmount: number,   // pre-mitigation damage
 *           absorbed: number,            // shielded value
 *           mitigationPct: number,       // % mitigated from data
 *           intendedMitPct: number,      // % intended from buffs
 *           availableMitigations: string[], // mitigation options available to the target at this instant
 *           buffs: { [buffName]: [appliers...] }, // buffs active during hit
 *           deaths: [string],            // players dead at that time
 *           source?: string              // attacker name (if available)
 *         },
 *         ...
 *       ]
 *     },
 *     ...
 *   ]
 * }
 *
 * ---
 * PLAYER PARTICIPATION SCENARIOS
 * ---
 * This condensed structure distinguishes between three player involvement cases:
 *
 * 1️⃣ **Buff-only contributor**
 *    - Player applied one or more buffs but was not targeted by any attack.
 *    - `buffs`: populated with all buffs they contributed.
 *    - All damage-related fields remain `0`.
 *    - `wasTargeted = false`.
 *
 *    Example:
 *    {
 *      "Ethan Enjio": {
 *        buffs: ["Kerachole"],
 *        unmitigatedAmount: 0,
 *        amount: 0,
 *        absorbed: 0,
 *        mitigationPct: 0,
 *        intendedMitPct: 0,
 *        dead: false,
 *        wasTargeted: false
 *      }
 *    }
 *
 * 2️⃣ **Attack target (damage recipient)**
 *    - Player was the target of one or more attacks in the set (even if shields absorbed all damage).
 *    - `buffs`: lists any buffs they also contributed, if applicable.
 *    - Damage and mitigation fields are aggregated normally.
 *    - `wasTargeted = true`.
 *
 *    Example:
 *    {
 *      "Akrui Tesh": {
 *        buffs: [],
 *        unmitigatedAmount: 81793,
 *        amount: 59627,
 *        absorbed: 0,
 *        mitigationPct: 27,
 *        intendedMitPct: 31,
 *        availableMitigations: ["Rampart", "Shadowskin"], // example snapshot of ready mitigations
 *        dead: false,
 *        wasTargeted: true
 *      }
 *    }
 *
 * 3️⃣ **Uninvolved player**
 *    - Player neither applied a buff nor was targeted by any attack in this set.
 *    - They are **not included** in the `players` object for this set.
 *
 * ---
 * EDGE CASES
 * ---
 * - If two identical attack names occur more than 2 seconds apart,
 *   they form separate condensed sets.
 * - Buff lists are deduplicated per player.
 * - Players without buffs still appear if they were targeted by an attack.
 * - Players whose shields fully absorbed damage are still marked `wasTargeted = true`.
 * - Empty or malformed fight tables result in an empty `condensedSets` array.
 *
 * ---
 * RETURN VALUE
 * ---
 * Returns a **new object**:
 * {
 *   fightId,
 *   encounterId,
 *   name,
 *   condensedSets
 * }
 *
 * The original fightTable is left unmodified.
 *
 * @param {Object} fightTable - The FightTable to condense.
 * @returns {{
 *   fightId: number,
 *   encounterId: number,
 *   name: string,
 *   condensedSets: Array<{
 *     timestamp: number,
 *     ability: string,
 *     players: Record<string, {
 *       buffs: string[],
 *       unmitigatedAmount: number,
 *       amount: number,
 *       absorbed: number,
 *       mitigationPct: number,
 *       intendedMitPct: number,
 *       dead: boolean,
 *       wasTargeted: boolean
 *     }>,
 *     availableMitigationsByPlayer: Record<string, string[]>,
 *     children: Array<Object>
 *   }>
 * }}
 */
export function generateCondensedPullTable(fightTable) {
  if (!fightTable || !fightTable.rows) {
    return {
      fightId: fightTable?.fightId ?? null,
      encounterId: fightTable?.encounterId ?? null,
      name: fightTable?.name ?? "Unknown Fight",
      condensedSets: [],
    };
  }

  const condensedSets = [];
  // Rows are already an array — just clone & ensure sorted by timestamp
  const allRows = [...fightTable.rows].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  if (allRows.length === 0) {
    return {
      fightId: fightTable.fightId,
      encounterId: fightTable.encounterId,
      name: fightTable.name,
      condensedSets: [],
    };
  }

  const activeGroups = new Map(); // abilityName → current group object

  for (const row of allRows) {
    const ability = row.ability;
    if (!ability) continue;

    const currentGroup = activeGroups.get(ability);

    // Determine if this attack should start a new group
    if (!currentGroup || row.timestamp - currentGroup.firstTimestamp > 2000) {
      // Finalize previous group if exists
      if (currentGroup) {
        condensedSets.push(buildCondensedGroup(currentGroup));
      }

      // Create a new group
      activeGroups.set(ability, {
        ability,
        firstTimestamp: row.timestamp,
        rows: [row],
      });
    } else {
      // Add to current group
      currentGroup.rows.push(row);
    }
  }

  // Finalize any remaining groups
  for (const [, group] of activeGroups) {
    condensedSets.push(buildCondensedGroup(group));
  }

  // Sort condensed sets by time
  condensedSets.sort((a, b) => a.timestamp - b.timestamp);

  // Return a new object (non-mutating)
  return {
    fightId: fightTable.fightId,
    encounterId: fightTable.encounterId,
    name: fightTable.name,
    condensedSets,
  };
}

/**
 * Helper function — builds one condensed group from raw grouped rows.
 * Aggregates buffs, per-player damage stats, and death flags.
 */
function buildCondensedGroup(group) {
  const { ability, firstTimestamp, rows } = group;
  const players = {};
  const mitigationUnion = new Map(); // playerName → union of available mitigations across children

  for (const row of rows) {
    const playerName = row.actor || "Unknown";
    if (!players[playerName]) {
      players[playerName] = {
        buffs: new Set(),
        unmitigatedAmount: 0,
        amount: 0,
        absorbed: 0,
        mitigationPctValues: [],
        intendedMitPctValues: [],
        availableMitigations: new Set(), // Track off-cooldown mitigations seen in the group
        dead: false,
        wasTargeted: false,
      };
    }

    const player = players[playerName];

    if (row.availableMitigationsByPlayer) {
      for (const [name, abilities] of Object.entries(
        row.availableMitigationsByPlayer
      )) {
        if (!mitigationUnion.has(name)) {
          mitigationUnion.set(name, new Set());
        }
        if (Array.isArray(abilities)) {
          abilities.forEach((ability) =>
            mitigationUnion.get(name).add(ability)
          );
        }
      }
    }

    const rowAvailableMit = row.availableMitigationsByPlayer?.[playerName] ?? [];
    if (Array.isArray(rowAvailableMit)) {
      rowAvailableMit.forEach((ability) =>
        player.availableMitigations.add(ability)
      );
    }

    // --- Aggregate numerical stats ---
    player.unmitigatedAmount += row.unmitigatedAmount ?? 0;
    player.amount += row.amount ?? 0;
    player.absorbed += row.absorbed ?? 0;
    if (typeof row.mitigationPct === "number") {
      player.mitigationPctValues.push(row.mitigationPct);
    }
    if (typeof row.intendedMitPct === "number") {
      player.intendedMitPctValues.push(row.intendedMitPct);
    }

    // ✅ Explicitly mark this player as a target in this attack set
    player.wasTargeted = true;

    // --- Aggregate buffs (add appliers who contributed) ---
    if (row.buffs) {
      for (const [buffName, appliers] of Object.entries(row.buffs)) {
        for (const applier of appliers) {
          if (!players[applier]) {
            players[applier] = {
              buffs: new Set(),
              unmitigatedAmount: 0,
              amount: 0,
              absorbed: 0,
              mitigationPctValues: [],
              intendedMitPctValues: [],
              availableMitigations: new Set(), // Track off-cooldown mitigations seen in the group
              dead: false,
              wasTargeted: false, // ✅ buff applier only, not target
            };
          }
          players[applier].buffs.add(buffName);
        }
      }
    }

    // --- Death detection ---
    if (Array.isArray(row.deaths)) {
      for (const deadName of row.deaths) {
        if (!players[deadName]) {
          players[deadName] = {
            buffs: new Set(),
            unmitigatedAmount: 0,
            amount: 0,
            absorbed: 0,
            mitigationPctValues: [],
            intendedMitPctValues: [],
            dead: true,
            wasTargeted: false, // ✅ maintain consistent schema
          };
        } else {
          players[deadName].dead = true;
        }
      }
    }
  }

  // --- Convert sets and compute averages ---
  const finalizedPlayers = {};
  for (const [name, p] of Object.entries(players)) {
    const availableMitArray =
      p.availableMitigations instanceof Set
        ? Array.from(p.availableMitigations)
        : Array.isArray(p.availableMitigations)
        ? [...p.availableMitigations]
        : [];

    finalizedPlayers[name] = {
      buffs: Array.from(p.buffs).sort(),
      unmitigatedAmount: p.unmitigatedAmount,
      amount: p.amount,
      absorbed: p.absorbed,
      mitigationPct:
        p.mitigationPctValues.length > 0
          ? Math.round(
              p.mitigationPctValues.reduce((a, b) => a + b, 0) /
                p.mitigationPctValues.length
            )
          : 0,
      intendedMitPct:
        p.intendedMitPctValues.length > 0
          ? Math.round(
              p.intendedMitPctValues.reduce((a, b) => a + b, 0) /
              p.intendedMitPctValues.length
            )
          : 0,
      availableMitigations: availableMitArray,
      dead: p.dead,
      wasTargeted: p.wasTargeted, // ✅ exported for analysis/visuals
    };
  }

  const availableMitigationsByPlayer = {};
  mitigationUnion.forEach((set, name) => {
    availableMitigationsByPlayer[name] = Array.from(set);
  });

  return {
    timestamp: firstTimestamp,
    ability,
    players: finalizedPlayers,
    children: rows,
    damageType: rows[0]?.damageType ?? null,
    availableMitigationsByPlayer,
  };
}
