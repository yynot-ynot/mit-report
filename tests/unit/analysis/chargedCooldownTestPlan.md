Charged Cooldown Handler – Test Plan
===================================

Goal: validate a future handler that manages multi-charge cooldowns (e.g., Oblation, Divine Benison, Radiant Aegis). Each scenario describes the setup, expected state transitions, and whether it covers a positive or negative path.

Accounting Scenarios
--------------------
1. **Initial pull → full charges** (positive)  
   - Start at fight time 0 with `currentCharges = maxCharges`, `remainder = 0`.  
   - First cast should skip recharge logic, simply decrement to `maxCharges - 1`, and write no cooldown window.

2. **Partial recharge accumulation** (positive)  
   - Begin with `currentCharges = 1` out of 2, `remainder = 0`.  
   - Wait half the cooldown, cast nothing, then perform a charge accounting call — expect charges remain 1 and remainder equals half the cooldown.  
   - After another half cooldown elapses, next cast should see `gained = 1`, refill to 2, and zero the remainder.

3. **Remainder trimming at max charges** (positive)  
   - Force `currentCharges = maxCharges - 1` with a partial remainder such that settlement would exceed `maxCharges`.  
   - After settlement the handler must clamp to `maxCharges` **and** clear the remainder to 0, because the recharge is complete and no timer should keep running.

4. **Back-to-back casts while charges remain** (positive)  
   - With 2 charges available and cooldown 60s, cast twice within 5s.  
   - First cast leaves 1 charge and immediately starts a recharge that will finish at `firstCast + 60000`.  
   - Second cast consumes the final charge and should create a cooldown window with `start = secondCast` and `end = firstCast + 60000` (the moment the earlier recharge completes).  
   - Verify no other windows were created.

5. **Charge regeneration after window** (positive)  
   - After scenario 4, advance time past `firstCast + 60000`.  
   - Next accounting should restore 1 charge (now total 1) and keep remainder 0.  
   - Another 60s later, verify the handler tops back up to 2 charges.

6. **Casting exactly at recharge boundary** (positive)  
   - Consume final charge at timestamp 0, so cooldown ends at 60000.  
     - Cast again at 60000 exactly — handler should see `gained = 1`, restore one charge first, zero the remainder, then spend it. The new unavailability window starts at 60000 and ends at 60000 + cooldown (fresh recharge).

Negative / Edge Scenarios
-------------------------
7. **Over-consumption (cast with zero charges)** (negative)  
   - Simulate log inconsistency where a cast occurs but `currentCharges = 0` and the previous window is still active.  
   - Handler should log a warning and still record a cooldown window `[cast, cast + cooldown]` to avoid crashes, but charges remain 0 until accounting catches up.

8. **Missing cooldown info** (negative)  
   - If `depConfig.maxCharges` is set but `resolveAbilityCooldown` returns null, handler should abort and log an error, leaving default cooldown untouched.

9. **Charge map initialization** (negative)  
   - Ensure calling the handler without prior state creates a record using `maxCharges` as the starting point; repeated calls without casts should not mutate state.

10. **Multiple abilities per player** (positive/negative)  
    - Player has Oblation (2 charges) and Benison (3 charges).  
    - Interleave casts to verify the state map indexes by ability — Benison accounting must not alter Oblation’s counters.

11. **Fight restart / new player** (positive)  
    - When the same ability is cast by two different players, each should maintain independent charge states.

12. **Death resilience** (negative)  
    - Confirm deaths do **not** modify charge counts or cooldown remainder. The handler should ignore external death events entirely; charge state only changes during cast accounting.

Cooldown Window Assertions
--------------------------
For every cast that reduces charges to 0:
  - Expect exactly one window added: `start = castTimestamp`, `end = min(nextRechargeTimestamp, castTimestamp + cooldownMs)`. When previous recharges are still running, this end point becomes the earlier completion time (e.g., `firstCast + cooldown` in scenario 4).
  - Verify window ends are used as the next accounting baseline (i.e., after `end` passes, accounting adds one charge and remainder returns to 0).

For casts while at least one charge remains:
  - Expect no window added or modified.

Implementation Reference
------------------------
These scenarios assume:
  - Config entries declare `{ handler: "handleChargedCooldown", maxCharges: N }`.
  - Handler stores per-player state in a `Map<key, { charges, remainder, lastTimestamp }>` keyed by `buildTrackerKey`.
  - Accounting always runs before spending a charge and zeroes remainder whenever `charges === maxCharges`.
