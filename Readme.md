# 📊 FFLogs Raid Mitigation Analyzer

This web app analyzes **FFLogs raid reports** to visualize how defensive cooldowns were used against incoming damage in **Final Fantasy XIV**.

---

## ✨ Features

- **Mitigation Timeline View**  
  See when raid-wide and personal cooldowns were active during boss mechanics.

- **Damage Breakdown**  
  Each event shows unmitigated vs. mitigated damage, absorbed shields, and mitigation %.

- **Buff Attribution**  
  Buffs are linked back to their actual source player.

- **Vulnerability Tracking**  
  Tracks debuffs like _Magic Vulnerability Up_ or _Physical Vulnerability Up_ on players.

- **Death Timeline**  
  Marks players as dead until they are revived (Raise detection included).

- **Interactive Report Browser**

  - Grouped by boss encounter
  - Pull selection grid
  - Player columns sortable by role
  - Clickable headers to filter by player

- **UI Controls**
  - Toggle Auto-Attacks and Bleeds
  - Switch between “buff detail” and “abilities only” views
  - Highlight the target player per event

---

## 🔄 Workflow

1. **Authentication**

   - Log in via FFLogs OAuth to access reports.

2. **Data Fetching (FFLogs API)**

   - Report metadata (actors, fights, abilities)
   - Buff and debuff events
   - Damage taken events
   - Death events
   - Vulnerabilities (debuffs on friendlies)

3. **Parsing & Normalization**

   - Raw events are normalized into structured objects:
     - Damage events (with mitigation calculations)
     - Buff/debuff events (timelines, stacks, AoE)
     - Vulnerability debuffs per target
     - Death timelines (death → raise)

4. **FightTable Construction**

   - All normalized events are merged into a **FightTable**, keyed by relative timestamps.
   - Each row = one **damage taken event**, enriched with:
     - Damage values
     - Active buffs (with credited sources)
     - Vulnerabilities
     - Death states

5. **Buff Analysis**

   - Buff names are resolved back to abilities.
   - Linked abilities (e.g. _Stem the Flow_ → _Bloodwhetting_) are merged.
   - Missing sources are backfilled using heuristics.

6. **Rendering**
   - The FightTable is rendered as an interactive timeline table.
   - Players are displayed in columns, **damage taken events** in rows.
   - Buffs show up in the cells of players who applied them.
   - UI filters update the table live without reloading data.
