# Engagement Pass: Progression, Standings, Commendations

Goal: make Avalon feel like a game you come back to. That means levels that arrive
often enough to feel, unlocks you can see coming, badges worth collecting, a Standings
page where every player can see somebody they could catch, and a reason to open the
portal between club meetings. It must also keep every rule that makes the game fair and
keeps it teaching. Status: **plan only, nothing built** (2026-09-24).

---

## 0. The rules this pass does not break

These rules are what make Avalon fair to a student who knows nothing and is on a phone.
Every feature below was checked against them, and a feature that needed to break one was
reshaped or cut.

| Rule | Where it lives | What it means for this pass |
|---|---|---|
| The Learn track pays no XP and never reaches Standings | CLAUDE.md, PRODUCT.md principle 5, `verify:learn` | Learn earns commendations, Field Manual entries and cosmetics, but no XP and no rank. See decision D1. |
| XP is flat, paid once per stage, with no attempt multiplier | CLAUDE.md "Rules that keep the game fair" | Nothing in this pass multiplies XP. That includes the items and events that currently claim to (§1.2). |
| Hints are free | same | No reward is withheld because a player used rungs 1 or 2. |
| The clean-solve streak pays nothing | same | Streaks and marks earn plates and cosmetics, never XP. |
| An instrument never invents a reading | PRODUCT.md principle 8, `verify:holo` | Boards, feeds and profiles show only real rows, or they say they have none. The product is pre-launch, so on day one they will say so. |
| Nothing is named before it is earned | CLAUDE.md top section | Commendation names, descriptions and hidden-plate clues go through the same withheld-vocabulary gate as prompts. A plate called "Nucleophile" at stage 3 would be a leak. |
| The interface does not advertise itself, and uses no emoji or glow | CLAUDE.md §2, §7 | Rewards are stamped plates, stencils and filament lamps. They never use confetti, neon, or a "NEW!" burst. |
| 375 px floor, and every stage solvable on T1 | PRODUCT.md | Every reward surface has a 2D form, and the 3D form is extra. |

One more rule is added here and enforced by `verify:progression` (§9): **nothing a player
unlocks may make a stage easier or change what a stage pays.** An unlock changes how you
look, what you can show, and how fast you get around. It never changes how well you score.

---

## 1. Where things stand (traced 2026-09-24)

### 1.1 What exists and works
- **XP** is 20 campaign stages paying 15 to 50 each (650), plus a 65 completion bonus
  (`Quests.gs:759-761`), for **715 earnable XP in the whole game today**.
- **Levels** follow `floor(sqrt(xp/45)) + 1`, capped at 12, with six titles from Cadet to
  Starmarshal. The same code is in `session.js:35-66`, `Scoring.gs:5-19` and
  `api/[...route].js:700`. **Finishing Quest 1 reaches level 4**, and level 12 needs
  4,950 XP. Most of the curve can't be reached, and a student gets about three level-ups
  over the only quest there is.
- **Standings** (`screens/leaderboard.js`) already has a Guilds tab and an individual tab
  (rank, player, guild, level + title, XP, top 50, your own row highlighted). The guild
  score is the normalized mean.
- **The HUD** shows XP, a bar and `LVL N` (`main.js:209-224`, `index.html:59-65`).

### 1.2 What exists but is broken or does nothing

| # | Problem | Where |
|---|---|---|
| B1 | The client never adds the 65 completion bonus. The HUD jumps later, when `player/me` syncs. | `quest.js` completion path |
| B2 | Mock `quest/complete` returns `totalXp: 650`, but production gives 715. | `api/[...route].js:620,642` |
| B3 | `myRank` is sent but never read. When the result is cached, it is looked up only in the top 50, so everyone below 50 gets `null`. | `Scoring.gs:64-67,161-180`, `leaderboard.js` |
| B4 | The trinket and background from Session Zero are silently dropped (Players has no columns for them). `inventory.js` has no display entry for `trinket_N`. | `Players.gs:105-117`, `Db.gs:323`, `inventory.js` |
| B5 | Six of seven item effects are no-ops that still use up the item. `hint_chip` and `spare_coolant` mean nothing when hints are free and attempts unlimited. `overclock_module` (+25% XP) and `resonance_key` (+50 XP, dropped at random) break the flat-XP rule on a competitive board. | `Items.gs:5-77`, `Db.gs:216-222` |
| B6 | Team events are rolled and shown on the bridge, but their ±XP% effects are applied nowhere. That is lucky, because applying them would break flat XP too. | `Events.gs`, `Quests.gs:520-529`, `bridge.js:65` |
| B7 | `levelTitle` is imported into `main.js` and never used, so the title never shows on the HUD. | `main.js:6` |
| B8 | Nothing marks a level-up: no detection, no moment, no sound. The only XP feedback is a toast saying `Correct · +N XP`. | `quest.js:860` |
| B9 | Roles were planned with perks (`avalon-implementation-plan.md` §2.3). Onboarding sends `role: ''`, and the only perk that exists (Engineer's free hint) is meaningless. | `api.js:63`, `Quests.gs:718` |
| B10 | PRODUCT.md says the Sheet has 13 tabs. It has 15. | `Db.gs:7-24` |

### 1.3 What does not exist
There are no badges, achievements, unlock table, cosmetics beyond visor colour, player
profiles, weekly boards, return loop, level-up moment, or any way for a Learn-only player
to see themselves progress beyond quest checkmarks.

---

## 2. The core problem: there is not enough XP to hold a level curve

Every idea in the brief (levels, unlocks, perks, a leaderboard people climb) runs on XP.
The game currently pays 715 XP, only from the campaign, and only once. So:

1. **Rebalance the curve against the XP that actually exists.** A table replaces the
   square root, so early levels come fast and later ones are paced by campaign content
   that is still to ship (§3.2).
2. **Give the Learn road its own visible progression that is not XP.** Nine built
   benches currently add up to a row of checkmarks. Commendations, Field Manual entries
   and world cosmetics (§5, §6) give a Learn player the same "I'm getting somewhere"
   signal without the study road ever moving Standings.

### Decision D1: keep the Learn XP wall (recommended)
- **Recommended: keep it.** Learn earns plates, cosmetics and Field Manual entries.
  XP and Standings stay campaign-only.
  - This keeps principle 5 ("learning must never become grinding").
  - It keeps Standings a measure of one comparable thing.
  - It means a strong student cannot bury a guild by grinding practice benches.
  - The cost is that a student who plays only Learn has a low level. §4's unlock table
    handles this by issuing a share of cosmetics from commendations, so they still have
    something to show.
- **Alternative: break the wall.** Learn benches would pay a small, fixed, once-only XP
  per stage.
  - This is simpler to explain and gives the curve roughly 5x the XP supply.
  - But it reverses a principle that PRODUCT.md, CLAUDE.md and `verify:learn` all
    enforce, and it turns the study road into the fastest way up Standings.
  - If chosen, it needs its own plan and a PRODUCT.md change first. It is not a line item
    here.

---

## 3. Phase 1: foundations and the level-up moment

### 3.1 Fix what is broken (B1 to B7, B10)
- **B1:** `quest.js` adds the completion bonus locally. It uses `{ trustXp: false }`
  semantics, so the server total still wins on the next sync.
- **B2:** Make the mock's `quest/complete` read `localTotalXp`. Extend `verify:flows` so
  a completion lands the same total the mock's `player/me` reports.
- **B3:**
  - Compute `myRank` against the full sorted list before it is cut to 50, and cache the
    rank map beside the board.
  - Have `leaderboard.js` render a pinned "your row" when you are outside the top 50.
- **B4:**
  - Add `trinket_id` and `background_id` columns (or put them in `avatar_json`, which is
    preferred because it needs no Sheet migration).
  - Give `inventory.js` a trinket catalogue entry for each of the 20.
- **B5:** Reshape items. See §4.4.
- **B6:** Repurpose events. See §7.4.
- **B7:** Show the title on the HUD as `LVL 5 · NAVIGATOR`. Below 760 px, show only the
  number.
- **B10:** Correct the tab count in PRODUCT.md.

### 3.2 One curve, in one module, as a table
Create `src/progression/levels.js` (pure, importable in Node). It exports
`LEVEL_THRESHOLDS`, `levelForXp`, `levelProgress`, `levelTitle` and `MAX_LEVEL`.
- `session.js` re-exports these, so no call site changes.
- The proxy imports it.
- `Scoring.gs` keeps a copy (Apps Script cannot import), and `verify:progression` fails
  the build if the copies differ.

Proposed thresholds, tuned so Quest 1 gives **five level-ups, about one every four
stages**, and a season of four campaign sectors at roughly 700 XP each reaches the cap:

| Level | XP | Reached in Quest 1 at | Title |
|---|---|---|---|
| 1 | 0 | start | Cadet |
| 2 | 60 | stage 4 | Cadet |
| 3 | 150 | stage 7 | Scout |
| 4 | 270 | stage 11 | Scout |
| 5 | 420 | stage 15 | Navigator |
| 6 | 600 | stage 19 | Navigator |
| 7 | 820 | Sector 02 | Voyager |
| 8 | 1,080 | | Voyager |
| 9 | 1,380 | | Pathfinder |
| 10 | 1,720 | | Pathfinder |
| 11 | 2,100 | | Starmarshal |
| 12 | 2,520 | | Starmarshal |

- The gaps between thresholds grow steadily (60, 90, 120, … 420), so no level feels like
  a wall.
- **Decision D6:** these numbers are a proposal until Sector 02's XP is known.
- `verify:progression` asserts that the planned content can reach the cap: the sum of
  `TOTAL_QUEST_XP` across built and charted campaign quests must be at least
  `LEVEL_THRESHOLDS[MAX_LEVEL]`.
- Changing the curve is free now because the product is pre-launch. After launch, a
  level must never go down for anyone.

### 3.3 The progression event queue
Create `src/progression/feed.js`, a small bus. `session.addXp`, the commendation
evaluator and the unlock resolver post to it:
`xp`, `level`, `commendation`, `requisition`, `watch`.

**It holds events until a safe moment, and that is what the queue is for.** CLAUDE.md §7
already says story copy "never appears between a miss and its `diagnoseMiss` message, or
over a reaction animation". A level-up is story copy.
- Flush points:
  - after the stage explainer or chem card is shown;
  - after a Learn reward card;
  - on stage advance;
  - on leaving a bench or quest;
  - on arrival at the bridge.
- Otherwise it waits.
- Several queued events are shown as one sequence, not a stack of toasts.

### 3.4 The moments themselves
- **XP gain:** the HUD figure counts up over about 600 ms, and the bar fills with a
  filament lamp at its leading edge (a lamp, so glow is allowed).
  - Under reduced motion it jumps straight to the new value.
  - The stage banner keeps its `+N XP` line.
- **Level-up:** a stamped rank plate (`.rank-plate`, the two-grade chamfer, the level
  number engraved, the title under it) and one Vess transmission of at most two
  sentences, diegetic, from `src/story/progression.js`.
  - It shows the requisition issued at that level (§4), so the reward and the reason
    arrive together.
  - A procedural "stamp" cue is added to `audio/soundscape.js`.
  - It is dismissed by any key or tap and never blocks input for more than 1.2 s.
- **Quest completion:** the debrief gets a tally plate:
  - stages cleared and XP from stages;
  - the completion bonus;
  - the level bar moving from where the quest started to where it ended;
  - commendations and requisitions earned during the quest.
  - The tally counts up. It shows only real figures.
- **Next unlock preview.** The HUD XP tooltip, the bridge and the Crew screen say what
  the next level issues ("Level 5: brass visor"). A reward you can see coming is the
  strongest pull a level system has, and today there is nothing to see.

---

## 4. Phase 2: requisitions (unlocks)

In the fiction, the quartermaster **issues** gear. So unlocks are **requisitions**, handed
over by Vess at a level-up or when a commendation is earned.

### 4.1 Registry
`src/progression/requisitions.js` is pure data. Each entry has:
`{ id, kind, name, line, source: { level } | { commendation }, apply }`.

**What you hold is DERIVED, never stored**, for the same reason XP is derived from
`Submissions` (`avalon-implementation-plan.md` §4.3):
`heldRequisitions(state) = byLevel(level) ∪ byCommendation(commendations)`.
- A rebalanced curve re-derives correctly.
- An officer's correction to a commendation carries through with no second write.
- Only a player's *choices* are stored: which visor is equipped, which plates are pinned.
  These go in `avatar_json` / `loadout_json`.

### 4.2 Kinds (the whole whitelist)
`verify:progression` fails any entry whose `kind` is not on this list.

| Kind | Examples | Shown |
|---|---|---|
| `visor` | brass, oxidised copper, smoked glass, salt-bleached (Tallow), basalt-black (Ligar) | Quarters customizer, Standings row swatch, T4 suit |
| `suit-stencil` | guild sigil variants, hazard stripe, pylon count tally, a world's survey mark | suit, profile |
| `nameplate` | frame finishes for your name on Standings and your profile: painted, brass, etched, riveted | Standings, profile |
| `title` | earned titles worn under your name ("Pylon Warden", "Salt Walker"), one equipped at a time | Standings, profile, HUD |
| `quarters` | bunk poster, locker decals, desk lamp filament colour, a specimen jar from each Learn world | Quarters (2D list, T4 objects) |
| `holo-theme` | the bridge board's frame and ink (amber, brass, green phosphor) | bridge holo |
| `privilege` | convenience only, from the fixed list in §4.3 | where it acts |

Colours must come from `tokens.css`. `verify:progression` rejects hard-coded hexes that
are not tokens, and rejects the banned palette (`#00e5ff`, Tailwind defaults, charge red
and blue outside the chamber).

### 4.3 Privileges: the only kind that does something
These make getting around faster. They never touch a stage.
- **Survey beacon:** on a Learn world, fast travel to any bench you have completed.
- **Recall:** return to the ship from any world without walking to the pad.
- **Holo memory:** the bridge board remembers which tab you left it on.
- **Comms relay:** the Comms screen gains a guild activity feed (§8.2). This one is
  debatable; see D3.

**Accessibility is never a privilege.** Reduced motion, text sizing, T1 inputs and
anything that helps a player *understand* a stage stay available to everyone from level 1.
A hint aid that helps weaker players must never be locked behind the XP those players
have not earned.

### 4.4 Items, reshaped (B5)
The item drop at quest completion stays, because a drop is a good moment. What drops
changes:
- Retire `hint_chip`, `spare_coolant`, `overclock_module`, `star_chart` and
  `resonance_key`. They either do nothing or break flat XP.
  - Retiring `resonance_key` removes the only XP an item grants. A random +50 on a
    competitive board is the thing the fairness rules exist to stop.
  - Nobody holds any of these yet, because the product is pre-launch.
- The quest item pool becomes **salvage**: rarity-tiered cosmetics from the same kinds as
  §4.2, themed on the sector. Examples: a pylon insulator for your bunk shelf, or a
  cracked Erebus lens as a visor.
  - Rarity is shown by finish (painted, brass, etched), never by colour or glow.
  - One drop per quest completion, idempotent, as now.
- `deflector_plate` and `scanner_upgrade` could return as T4 quarters props with no
  effect, or be dropped.

### 4.5 Where requisitions live
The **Crew** screen (`quarters.js`) grows a **Locker** section. It holds every kind you
own, grouped, with an Equip key, plus greyed entries for what is still to come and how
you earn each one (a level, or a named commendation).
- Nothing is sold, and nothing is random except the salvage drop.
- On T4, the quarters footlocker and wall show what is equipped (§10).

---

## 5. Phase 3: commendations (badges)

A commendation is a **stencilled plate** in the fiction, pinned to the suit and the
quarters board. It is earned once, from either road, and pays no XP.

### 5.1 Registry and rules
`src/progression/commendations.js` is pure. Each entry has:
`{ id, name, line, tier, road: 'campaign'|'learn'|'crew'|'season', hidden, clue, earnedBy(state) }`.
- `earnedBy` is a pure predicate over what the session already knows: progress, learn,
  flags, streak, inventory and the per-stage marks from §5.3. So it runs in the client,
  the proxy mock and `verify:progression` against fixtures.
- **The server has the final say for what others see.** `commendation/claim` re-checks
  the predicate against server rows before writing, so a player cannot pin a plate by
  editing `localStorage`.
- **Pays no XP.** No entry may carry an `xp` field. Learn plates are how the Learn road
  shows progress without breaching the wall.
- **Names and lines go through the withheld-vocabulary gate.** A Charge Gardens plate
  earned at stage 5 may not say "nucleophile". The same plate's description may use it
  only if the chem card that earns the word has already been seen. Hidden-plate clues are
  gated like prompts.
- **One sentence per line, and no emoji.** The same checks as legends.

### 5.2 A starting set (about 40)
Tiers are **painted, brass, etched**, the same finishes as §4.4. There are no gold
trophies.

- **Campaign:**
  - first pylon lit;
  - pylons 5, 10, 15 and 20;
  - the Charge Gardens restored;
  - every stage of a quest cleared clean (first try, no rung 3; the existing clean-streak
    definition);
  - a clean run of 5 and a clean run of 10.
- **Craft:** these reward *looking*, which is the game's core verb (PRODUCT.md
  principle 4).
  - Scanned every site on a stage before committing.
  - Solved a blocked-path stage after rotating the view.
  - Cleared a stage using the T1 inputs.
  - Opened every concept card in a quest.
- **Learn:**
  - each bench completed (9 now, one per bench as they ship);
  - each world completed ("Tallow Surveyed", "Ligar Surveyed");
  - a world's practice set finished. This is a nudge, not a gate: it is optional, and
    the practice set stays skippable with one press;
  - every term in a world's Field Manual logged (§6).
- **Crew:**
  - joined a guild;
  - walked every compartment of the Avalon;
  - found each hidden object on Tallow and Ligar (§7.5);
  - customised the suit;
  - attended a meeting (§7.2).
- **Season:** attended 3, 6 or 10 meetings; stood 4, 8 or 12 watches (§7.1); your guild
  completed a contract (§7.3).

**Hidden plates** show as a blank plate with a one-line clue ("Something on Tallow is
still turning"). They reward exploring the worlds, which are the most expensive thing in
the build and currently give no reason to wander.

### 5.3 Stage marks: replay value without XP
Each stage (campaign and Learn) carries up to two marks, shown as small stencilled ticks
on the stage rail and the star map:
- **Cleared**
- **Clean**: first try without the solution rung. This is the definition `quest.js`
  already uses, so rungs 1 and 2 cost nothing, as the "hints are free" rule requires.

A finished quest already replays for free (CLAUDE.md). Marks give a replay a *purpose*
(clean the stages you fumbled) while it still pays no XP. Marks are stored per stage:
- as a new `clean_stages` column on `Progress` (a bitmask over the 20 stages);
- in `LearnProgress.stages` as `{ i, clean }`.

The **"Clean" mark must not become a hint tax.** Only rung 3 (the method) breaks it, and
the mark never appears on Standings. It is for the player, not the board.

### 5.4 Where they show
- **Crew screen:** a Commendations board, grouped by road, showing earned, locked and
  hidden plates.
- **Pinning:** a player pins up to three. Pinned plates show on the player's profile and
  beside their name on Standings (decision D4).
- **When earned:** through the §3.3 queue, as a plate stamped onto the screen with a
  one-line Vess acknowledgement for tier-3 plates only.

---

## 6. Phase 3b: the Field Manual (the vocabulary as a collection)

This is the idea most specific to Avalon. The withheld-vocabulary schedule already hands
each player the real words one at a time, on reward and chem cards, after they have done
the thing. Today those cards disappear into per-quest Findings.

The **Field Manual** collects every term the player has earned, across both roads, in one
place:
- the word;
- the card that earned it;
- the stage it was earned at;
- a Revisit key that reopens that stage.

Terms are shown as `Terms logged: 23 / 41` per world and overall. Unearned terms are
blank lines, **never the word** (the blank is the withholding).

- **Source:** `VOCABULARY` in each Learn quest, plus the chem-card terms in the campaign
  (a `terms` array to add to `STAGE_COPY`, checked by `verify:quest`).
- **Derived** from progress. Nothing is stored.
- It turns "vocabulary last" from a restriction the player never notices into something
  they collect, and it gives a Learn-only player a large, visible, meaningful number to
  fill.
- A completed world's manual is a commendation (§5.2).
- It lives in the Learn road and the Crew screen (one component, `ui/field-manual.js`),
  as a 2D overlay on every tier, like practice.

---

## 7. Phase 4: reasons to come back

### 7.1 The watch (a weekly streak, not a daily one)
The club meets weekly, and the players are 12 to 17 with homework. A daily streak would
punish exactly the students this product exists for.
- **A watch** is any calendar week (Monday to Sunday, school timezone in `Config`) in
  which the player cleared at least one stage on either road, or redeemed a meeting code
  (§7.2).
- The HUD shows `WATCH 4`.
- **One missed week is forgiven automatically** per six stood. Nothing is bought, nothing
  is asked for, and there is no "your streak is about to die" warning. The streak is
  shown; its loss is never announced.
- Pays no XP. Watch milestones are commendations and requisitions.
- **Derived** from `Submissions.ts` and `LearnProgress.updated_at`. No new table.

### 7.2 Meeting codes
An officer opens `#/admin` and presses **Issue Code**. A six-character code from an
unambiguous alphabet, valid until midnight, appears in large type to put on the
projector. Players enter it on the bridge.
- Earns the "attended" commendation track and stands that week's watch.
- New `AttendanceCodes` tab: `code, issued_by, valid_date, created_at`.
- New `Attendance` tab: `player_id, code, redeemed_at`, one per player per code.
- The redeem route is rate-limited per account (like sign-in), so it cannot be sprayed.
- This ties the portal to the real club, which is the most engaging thing it has, and
  gives officers a lever that costs them ten seconds a meeting.

### 7.3 Guild contracts
One contract a week per guild, shown on the Comms CRT and the bridge. For example:
"Clear 30 stages as a guild", "Three members stand a watch", "Complete a Learn world".
- The goal scales with active roster size.
- There is a shared progress bar, counted only from real rows.
- Completing it issues a contract plate to **every member who contributed at least one
  stage that week**. Members who did not contribute get nothing, and nobody is penalised.
- **It does not touch guild score.** The score stays the normalized XP mean, because a
  contract bonus would be a second, hidden scoring rule.
- Contracts come from a fixed rotation in `src/progression/contracts.js`, keyed by
  ISO week, so the proxy mock and Apps Script agree without storing anything.
- With no active members, the board says "No contract activity this week". It never
  shows a fabricated bar.

### 7.4 Events, repurposed (B6)
Team events are already rolled per quest, so give them effects that exist.
- Drop the ±XP% and `gamble_xp` effects.
- Recast the remaining events as **sector conditions**: a narrative line from Vess plus a
  cosmetic or contract effect. Examples: "Dust storm: this week's contract counts
  double", or "Salvage run: this quest's drop is one finish higher".
- Nothing changes scoring.

### 7.5 Things to find
Place a small number of hidden objects (about 3 per world) in Erebus, Tallow, Ligar and
the ship: a lamp that answers when you face it, a stencilled number on a crate, a sock
you can turn by hand.
- Each is an aim target (`three/aim-target.js`) that sets a flag.
- Each pays a hidden commendation.
- `verify:tallow`, `verify:ligar` and `verify:ship` must prove each one is standable and
  reachable, as they already do for benches.
- On T3 and below the worlds are not walkable, so these plates are marked T4-only.
  `verify:progression` asserts a T4-only plate is never required for a non-T4 plate or
  a season plate.

---

## 8. Phase 5: Standings and crew profiles

### 8.1 Standings, extended
Tabs: **Guilds** (unchanged), **Crew** (all players), **Your Guild** (players in your
guild ranked by XP; shows who is carrying the mean, which is cooperative rather than
cutthroat), **This Week** (first-clear XP earned in the last 7 days, from
`Submissions.ts`).
- **This Week** is the most important new view. It is the board a new or behind player
  can top, and it resets, so an early lead does not decide the season.
- **Your row is always visible.** The pinned row is shown even outside the top 50 (B3).
  Below it is a **neighbourhood**: the three players just above and below you.
- **Movement:** `+3 since last visit`, read against a rank snapshot kept in
  `localStorage`. It is written as text, not arrow glyphs (CLAUDE.md §6 bans arrows on
  keys, and the rest of the chrome follows that).
- **Rows carry identity:** nameplate finish, equipped title and up to three pinned plates.
  None of these affect rank.
- **Empty honestly:** "No crew on the board yet" (§0).
- **Server work:**
  - `Scoring.getLeaderboards(scope)` with scope `all | guild | week`;
  - rank computed before the cut;
  - `week` computed from `Submissions` filtered by `ts`, memoized with `_rowCache`;
  - the proxy mock mirrors all of it, and `verify:flows` asserts each scope.
- **T4:** the Comms CRT gains a second page with the top 5 of This Week.

**Decision D2: dignity at the bottom of the board.** Middle schoolers will see their rank.
- Recommended:
  - the Crew board shows the top 25 plus your neighbourhood, never a full list down to
    last place;
  - Settings gets **"Keep my name off public boards"**, which shows you to others as
    `Crew · <guild>` while you still see yourself;
  - the guild mean is unaffected.
- The alternative is a full list with no opt-out, as today.

### 8.2 Crew profiles and the guild feed
- **Profile** at `#/crew/:playerId`, a PARAM route, opened from any Standings row. It
  shows:
  - suit (visor and stencil);
  - level and title;
  - nameplate;
  - pinned plates;
  - commendation count by road;
  - Field Manual count;
  - watch;
  - guild.
  - It shows **no per-stage history** and nothing about hints, because a profile is
    something to show off, not a report card.
- **Guild feed** on Comms (decision D3 on whether it is a privilege). It lists real
  events only: "RK reached Level 5", "AH cleared Pylon 12", "TS completed the week's
  contract", read from `Submissions`, `Commendations` and level transitions, newest 20.
  - Players who opted out under D2 are left out.
  - With no rows it says so.
- **Salute** (optional, late): one press on a guildmate's feed line, counted on their
  profile. There is no text, so nothing needs moderating.

---

## 9. Architecture and checks

### 9.1 New client modules (`src/progression/`, all pure, all importable in Node)
| File | Owns |
|---|---|
| `levels.js` | the threshold table, level, progress, title |
| `requisitions.js` | the unlock registry and `heldRequisitions(state)` |
| `commendations.js` | the plate registry and predicates |
| `marks.js` | per-stage Cleared and Clean marks |
| `watch.js` | week bucketing and the forgiveness rule |
| `contracts.js` | the weekly rotation and goal scaling |
| `feed.js` | the §3.3 presentation queue (the one module with a DOM side) |

UI:
- `ui/rank-plate.js`, `ui/commendation-plate.js`, `ui/field-manual.js`;
- the Locker and Commendations sections in `quarters.js`;
- Standings tabs in `leaderboard.js`;
- `screens/crew-profile.js`.
- Styling in `styles/progression.css`, plus hooks in `mobile-screens.css` for 375 px.

### 9.2 Backend
- **New tabs:**
  - `Commendations` (player_id, commendation_id, earned_at, source);
  - `AttendanceCodes`;
  - `Attendance`.
- **Players:**
  - `loadout_json` (equipped visor, stencil, nameplate, title, pinned plates, holo theme);
  - `board_optout`.
- **Nothing stored that can be derived:** level, requisitions held, watch, marks
  roll-ups and contract progress are all computed.
- **Routes:**
  - `progression/me`: plates, loadout, watch, contract;
  - `commendation/claim`: re-checks the predicate on the server;
  - `loadout/set`: validates against held requisitions;
  - `leaderboard` with a `scope` parameter;
  - `profile/get`;
  - `attendance/issue` (officer only);
  - `attendance/redeem`.
  - All of these ride on `bootstrap` where cheap.
  - All follow the staying-signed-in rules: a failure is `BACKEND_BUSY`, never
    `UNAUTHORIZED`.
- `Scoring.computePlayerTotalXp` does not read `Commendations`, `Attendance` or
  `LearnProgress`. `verify:progression` asserts this with a text scan of `Scoring.gs`,
  the same kind of check `verify:learn` already does.

### 9.3 `npm run verify:progression` (added to `npm run verify`)
- Level curve: the copies in `levels.js`, the proxy and `Scoring.gs` are identical and
  strictly increasing, and planned campaign XP reaches the cap.
- Every level from 2 to 12 issues at least one requisition, so every level-up has
  something in the hand.
- Every requisition's `kind` is on the whitelist, and its colours are tokens.
- No requisition's `apply` touches grading or XP. This is a structural check: `apply`
  may only write `loadout`, `quarters`, `holo`, or a named privilege flag.
- Every commendation has a one-sentence line, a tier, and a predicate that is true on at
  least one fixture and false on the empty state.
- No commendation carries `xp`.
- Names, lines and clues pass the withheld-vocabulary gate for the stage at which they
  can first be seen. No emoji.
- Learn-road commendations do not import or call any XP path (this extends
  `verify:learn`'s list).
- Standings never fabricates: with an empty store, every scope returns `[]` and every
  view renders its empty state.
- Contracts: with zero activity, progress is zero.
- A T4-only plate is never required by a plate reachable on T3.

### 9.4 Measuring whether any of this works
The product is pre-launch and has no data (PRODUCT.md "Absences"), so this plan claims no
result. Once students are in, all of the following can be read from existing timestamps,
with no new telemetry:
- weekly actives per guild;
- median stages cleared per active week;
- share of week-1 players still active in week 4;
- share of This Week's top 10 who are not in the overall top 10 (whether the weekly
  board is reaching new players);
- meeting-code redemptions per meeting.

**One stop condition:** if players ranked in the bottom third of Crew play noticeably
less after the pass than before, apply D2's recommended option or narrow the Crew board
further.

---

## 10. T4 presentation (after the 2D forms work)
Each reward surface has a 2D form first, and the in-world version is extra.
- **Quarters wall:** a commendation board of real stencilled plates. The bunk shelf
  holds salvage and one specimen jar per completed world. The footlocker opens onto the
  Locker.
- **Bridge:** the rank plate is stamped onto the welcome holo on level-up. The holo
  theme applies to its frame.
- **Comms:** a second CRT page for This Week and the guild feed. The contract bar is
  drawn on the rack's VU meter.
- **Suit:** the visor and stencil show in the one place the player's own suit is visible
  (the quarters mirror or locker panel, added for this).
- **Worlds:** survey beacons at completed benches for fast travel, and a lit marker at a
  bench whose stages all carry Clean.

---

## 11. Order of work

| Phase | Contents | Depends on |
|---|---|---|
| 1 | §3: bug fixes, curve table, feed queue, XP/level/completion moments, next-unlock preview | D6 (provisional curve is fine) |
| 2 | §4: requisition registry, Locker, loadout, items reshaped | 1 |
| 3 | §5 and §6: commendations, stage marks, Field Manual, `verify:progression` | 1 |
| 4 | §8: Standings scopes, pinned row, neighbourhood, profiles, feed | 3 (for pinned plates), D2, D4 |
| 5 | §7: watch, meeting codes, contracts, events recast, hidden objects | 3 |
| 6 | §10: T4 presentation | 2, 3, 5 |
| 7 | Roles | D3 |

Each phase ends on `npm run verify` passing, and on CLAUDE.md and PRODUCT.md being
updated. The new rule (§0) and the progression section belong in both.

---

## 12. Decisions needed

- **D1: Learn XP wall.** Keep it (recommended) or break it. §2.
- **D2: Bottom of the board.** Top 25 plus neighbourhood plus opt-out (recommended), or
  the full list. §8.1.
- **D3: Roles.** The planned roles with perks (`avalon-implementation-plan.md` §2.3) all
  either pay XP or make stages easier, so every one breaks §0.
  - Recommended: roles become **identity**: a chosen specialty with its own suit
    insignia, its own commendation track, and a flavour line from Vess. They carry no
    mechanical perk.
  - The alternative is roles with privilege-only perks from §4.3. Under this option,
    Comms Officer gets the guild feed, and everyone else gets the feed at level 3.
- **D4: Pinned plates on Standings.** Should a Learn plate appear beside a name on
  Standings? Recommended **yes**: it is display, rank never reads it, and it is the one
  place a Learn-heavy player is seen by the room. A stricter reading of "never reaches
  the leaderboard" would say no.
- **D5: Retiring the XP items.** Retire `resonance_key` and `overclock_module`
  (recommended; nobody holds them pre-launch) or keep them as flavour with no effect.
- **D6: Curve numbers.** The §3.2 table is provisional until Sector 02's XP is set.

## 13. Deliberately not in this plan
- Anything bought with money, or anything random that pays XP.
- Daily streaks, streak-loss warnings, countdown timers on learning content, or
  "limited-time" Learn rewards.
- XP for badges, streaks, attendance, contracts, practice or the Learn road (unless D1
  is reversed through its own plan).
- A hint cost of any kind, including a softer one such as "no hints used" plates.
- Free-text chat or comments between players.
- Fabricated activity, sample rows or placeholder ranks anywhere a player can see them.
