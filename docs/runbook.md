# Avalon Emergency Runbook — "It's Friday and the Showcase is Live"

Quick reference for club officers during live showcase meetings or quest releases.

---

## 1. A student is locked out of their account

1. Open `#/admin` on an officer laptop.
2. Under **Password Reset**, type the student's email or display name.
3. Click **GENERATE** (or type a readable phrase like `drift-42-ember`), then **OVERRIDE PASSWORD**.
4. Hand the student the temporary phrase. They can log in immediately with either their email or display name.
5. *If admin panel is unreachable:* Open the **Avalon DB** spreadsheet -> `Players` tab -> update the `pw_hash` cell directly or change `status`.

---

## 2. A Chromebook is lagging or freezing

1. Look at the top-right corner of the student's screen in the HUD.
2. Click the **Tier Button** (reads `T3` or `T2`).
3. Set to **T2 (Standard)**: DPR 1, removes all post-processing, soft shadows, and bloom.
4. If still sluggish on school hardware, switch to **T1 (Non-WebGL Fallback)**:
   - Disables WebGL completely.
   - Replaces 3D viewer with static SVG backdrops and standard accessible `<select>` dropdowns.
   - **All 7 quest stages and bonus stages are 100% solvable in T1.**

---

## 3. A team is full and students want to join together

1. If Ignis or Zephyr reaches 12/12 berths:
   - The UI displays *"Windward filled up while you were deciding. Pick another ship, or let us assign you where you're needed most."*
   - Direct them to click **Auto-Assign to Smallest Team**.
2. If you choose to raise the cap:
   - Open **Avalon DB** spreadsheet -> `Config` tab.
   - Change `team_slot_cap` from `12` to `14` or `16`.
   - **Rule:** Always raise all 4 teams equally, or team normalization will skew leaderboards.

---

## 4. Inappropriate or offensive display name reported

1. Open `#/admin` -> **Force Rename**.
2. Enter the player's ID or name, provide a replacement (e.g. `Explorer-42`), and enter the reason.
3. Changes immediately apply to all public leaderboards.
4. The replacement is permanently recorded in the `NameHistory` and `AuditLog` tabs.

---

## 5. Correcting a typo or stage prompt mid-meeting

- **Never redeploy code for content changes.**
- Open **Avalon DB** spreadsheet -> `QuestStages` tab -> find the stage row.
- Edit `scene_config`, `hint_text`, or `reveal_text`.
- The change is live across the entire club within 10 minutes (or immediately after clearing script cache).

---

## 6. Backend deploy / URL stability

- **Never create a new deployment.**
- Always deploy in place using:
  ```bash
  npm run deploy:backend
  # or
  clasp deploy -i <deploymentId>
  ```
- Creating a new deployment generates a new URL and invalidates the Vercel proxy environment configuration.
