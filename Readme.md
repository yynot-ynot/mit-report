# 📊 FFLogs Raid Mitigation Report

This web application analyzes **FFLogs reports** to show how mitigation abilities (such as _Rampart_, _Reprisal_, _Addle_, etc.) were used during raid encounters in **Final Fantasy XIV**.

It focuses on the **damage taken timeline**:

- Each **row** = a timestamped boss/NPC attack.
- Each **column** = a **player** in the raid.
- Each **cell** = the mitigation abilities the player had active when struck at that timestamp.

The app’s purpose is to help raiders and groups review mitigation usage, identify gaps, and improve defensive coordination.

---

## 📐 Core Data Structure

All data is normalized into a single **FightTable object**.  
This structure is what the UI layer consumes to render the timeline table.

```ts
FightTable {
  fightId: number                  // Unique fight identifier from FFLogs
  encounterId: number              // Encounter (boss) ID
  name: string                     // Encounter name

  rows: {                          // Timeline rows keyed by timestamp
    [timestamp: number]: {         // ms since fight start (e.g. 1000 = 1s)
      source: string               // Attacker (boss or NPC)
      ability: string              // The attack used at this time
      targets: {                   // Defenses active on each player hit
        [playerName: string]: string[]
        // Key = player's name (e.g. "PlayerA")
        // Value = list of mitigation/defensive abilities active during this hit
        // Example: { "PlayerA": ["Rampart", "Addle"], "PlayerB": ["Reprisal"] }
      }
    }
  }

  actors: {                        // Metadata for players (columns in the table)
    [id: number]: {
      id: number
      name: string
      type: string                 // Always "Player" here
    }
  }
}
```

---

### 🔍 Example

```json
{
  "fightId": 1,
  "encounterId": 1234,
  "name": "Boss Fight",
  "rows": {
    "1000": {
      "source": "Boss",
      "ability": "Cleave",
      "targets": {
        "PlayerA": ["Rampart", "Addle"],
        "PlayerB": ["Reprisal"]
      }
    },
    "2000": {
      "source": "Boss",
      "ability": "Auto Attack",
      "targets": {
        "PlayerC": []
      }
    }
  },
  "actors": {
    "12": { "id": 12, "name": "PlayerA", "type": "Player" },
    "13": { "id": 13, "name": "PlayerB", "type": "Player" },
    "14": { "id": 14, "name": "PlayerC", "type": "Player" }
  }
}
```
