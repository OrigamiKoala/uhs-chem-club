# Avalon — Immersion Pass

**Written:** 2026-09-16 · **Status:** Plan — no code written yet
**Goal:** Stop Avalon from feeling like a website wrapped around a puzzle game. The player
should feel like they joined a crew, took a ship somewhere, and did a job there, starting
from the first screen the way a tabletop campaign starts at Session Zero.

---

## 1. Diagnosis — why it feels like a wrapper

| Symptom | Where | Why it breaks immersion |
|---|---|---|
| Stages have puzzle titles ("Stage 4 — Competing Sites") and nothing between them | `quest.js`, `evaluator.js` | Nothing is at stake. You solve a level, then the next level loads. |
| Signup is a web form, then a team picker | `register.js`, `onboarding.js` | You fill in a form. You never become somebody. |
| The star map is a grid of cards | `starmap.js` | You never go anywhere. Sector 01 is a link, not a place you travel to. |
| Every page is silent | — | Nothing in the ship hums, clicks, or crackles. |
| Backdrops are still images | `ROUTE_BACKDROPS`, `pageHeader` | The ship looks like a photo of a ship. |
| Solving a stage changes nothing in the world | `quest.js` completion | XP goes up, but the world stays the same. |
| The epilogue is the only story | `QUEST1_EPILOGUE` | The payoff has no setup. |

The fix has three layers, in priority order:
1. **Fiction.** A reason to be here, a voice talking to you, and a world that reacts. This costs almost nothing and does the most.
2. **Sound.** Most of what makes the ship feel alive comes from sound.
3. **Motion.** Video cutscenes and loops (Gemini / Veo). This layer is the most visible, but it only works on top of the first two.

---

## 2. The fiction (the campaign frame)

### Premise
The players are a newly signed-on crew aboard the **Avalon**, an old salvage hauler. It
has been flying for forty years and is held together by the four Imperial Guilds. The
quartermaster, **Vess**, narrates the whole campaign in the role of the Dungeon Master.
Vess is only ever a voice over comms and a silhouette behind CRT static, never a face.

**Sector 01 — Erebus.** The Charge Gardens are an abandoned refinery field on a desert world.
Its twenty **relay pylons** went dark when the old crew left. Every stage the player solves
wakes one pylon. The player doesn't need to know what a pylon does. They can see the field
light up.

- Stage N = **Pylon N**. The prompt stays the same, and a one-line comms transmission
  from Vess comes before it.
- Each milestone changes the world in a way the player can see: stage 7 (the first cluster
  lights up), stage 10 (a relay tower powers on), stage 20 (the whole field wakes, which
  leads into the epilogue).
- A **Gardens map** on the quest screen and the bridge shows 20 pylon lamps. Each lamp is
  dark, flickering (reached) or lit (cleared). It is the progress bar, given a place in the world.

### Copy discipline amendment (done, 2026-09-16)
CLAUDE.md §7 now exempts **story copy**: anything that builds the campaign fiction
(transmissions, `onClear` lines, Session Zero scenes, guild pitches, the mission log,
Fleet Comms, item provenance). Each line must be diegetic, and a transmission is at most
2 sentences. It uses no withheld vocabulary and never states a route. `verify:quest`
gets a check for each of these limits.

### Where the story lives
New module `src/story/quest1.js`, which is the story's one source of truth, like `evaluator.js`:
```js
export const QUEST1_STORY = {
  arrival:   { cinematic: 'erebus_descent', lines: [...] },
  // Stage 1 has one opening transmission per guild; stages 2–20 are shared.
  guildOpeners: { earth: '...', air: '...', fire: '...', water: '...' },
  pylons:    [{ stage: 1, transmission: null /* uses guildOpeners */, onClear: '...' },
              { stage: 2, transmission: '...', onClear: '...' }, ... ×20],
  milestones:{ 7: { cinematic: 'pylon_wake', line: '...' }, 10: {...}, 20: {...} },
  debrief:   { cinematic: 'gardens_restored', lines: [...] }
};
```
The story is display-only and never graded, so it does not need to be mirrored in `Quests.gs`.

---

## 3. Session Zero — interactive onboarding

This replaces the form-then-picker flow with a guided scene that plays like the first
night of a campaign. It keeps the same three steps on `stepRail` and makes the same API
calls (`player/create`, team join), so the backend does not change.

### Flow (`#/register` → `#/onboarding` → `#/bridge`)

**Scene 0 — Cold open** (landing, no account)
Full-bleed `cold_open` loop. A CRT powers on and Vess speaks in typed lines, one per click:
> "Signal's weak out here. If you can read this, the Avalon's still hiring."

There are two switches: **Sign On** and **Try a Pylon** (the existing `#/demo`).

**Scene 1 — The manifest** (`#/register`, step 1)
Vess walks the player through the crew manifest one field at a time, instead of showing a form:
1. *"Name for the manifest?"* is the display name. The live validation stays exactly as
   it is (it mirrors `validateDisplayName`). If validation fails, Vess says the error
   in character, and the `.form-banner` text underneath stays literal.
2. *"Comms frequency and a passphrase."* covers email and password, as they work today.
3. **Background** (a new, purely cosmetic choice from three options). It sets the player's
   starting title and a one-line flavour tag on the Quarters screen:
   - *Salvager*: "You've pulled parts from worse wrecks than this."
   - *Runaway*: "Nobody asks where you came from. Good."
   - *Scholar*: "You read the manuals. All of them."

   Background never affects XP or grading, which keeps the game fair.

**Scene 2 — Choose your guild** (`#/onboarding`, step 2)
- All four guild cards stay on screen together, each showing its live slot count, just
  as in the existing picker.
- Selecting a card plays that guild's 8-second **guild briefing** loop and Vess's pitch line.
  **Join** confirms the choice.
- The player meets their party: the existing crew-manifest list of teammates who already
  joined, shown as call signs, with each teammate's trinket next to their name.

**Scene 3 — The oath and the roll** (step 3, just before `#/bridge`)
- The player holds the **Sign On** key cap for about 1 second. Every campaign has a
  moment where the player commits, and this is it.
- **Issue roll:** the player rolls a d20 on screen (a CSS 3D die with a mechanical clatter
  sound) to draw a starting trinket from the quartermaster's crate. The trinket is
  cosmetic and appears in `#/inventory`.
  Every result is good, and the roll only changes *which* trinket the player gets, so it
  is never a gamble on power. Rolling a 20 gives a rare-looking trinket. The seed is the
  player id, so reloading the page can't reroll.
- A `launch` cinematic plays, then the bridge loads with Vess's first mission line.

**Scene 4 — Scanner calibration** (first entry into `#/quest`)
Stage 1's `intro` concept card already teaches scanning and dragging. Here Vess says the
controls out loud instead ("Tap anything that glows. Tell me what the needle says.").
This is the same card with a different voice.

### Rules
- Each scene has a **Skip** control, and returning players never see Session Zero again
  (`session.flags.sessionZeroDone`).
- It must work at 375 px width and on Tier 1 (stills instead of video, same text).
- The whole flow takes 90 seconds or less when the player clicks straight through. The
  showcase audience is 8th graders standing at a table.

---

## 4. Sound

New module `src/audio/soundscape.js`, built on Web Audio with one `AudioContext` that is
unlocked on the player's first click.

| Layer | Content | Trigger |
|---|---|---|
| Bed | Low ship hum plus occasional hull creaks, crossfaded per room | Route change (use the room from `SHIP_ANCHORS`) |
| Room tint | Cockpit: instrument ticks · Comms: static · Cargo: chains · Quest: chamber drone | Route |
| UI foley | Key cap *thunk* (`.btn-primary`), toggle clack, relay click on nav, CRT *tick* when a scan prints | Delegated listeners in `main.js` |
| Game | Scan sweep, charge-meter fill, miss buzzer (soft, never mocking), bond *snap*, pylon wake (a filament hum that rises) | `quest.js` / `arrow.js` hooks |
| Voice | Vess is a **radio murmur** (decided): unintelligible, radio-filtered speech under the typed text, with no recorded lines. Use 4–6 murmur clips of 1–3 s and pick one by transmission length. Make them by band-passing (300–3000 Hz), distorting and scrambling any spoken audio, so no real words survive. | Transmissions |

- **Sources:** extract ambience from the Veo clips (`ffmpeg -vn`), and fill the gaps with
  CC0 foley from freesound.org. Store everything in `public/audio/` as `.webm` (Opus)
  plus `.mp3` fallback, each file 200 KB or smaller.
- **Settings:** a Master / Ambience / Effects slider and a mute key cap in the HUD. The
  default volume is 60%, and the setting persists in `session`.
- Nothing plays before the player's first click, as browsers require. The landing page
  shows a stencilled `// SOUND OFF` toggle.

---

## 5. Video (Gemini / Veo)

### How the videos are used (from most to least important)
1. **Cinematics:** full-screen, click-to-skip, played once. They open and close story beats.
2. **CRT textures:** `THREE.VideoTexture` on the ship's twin CRT monitors (`ship.js` lines
   74–75 and 271–273), replacing the static canvas textures. They play muted and loop.
3. **Banner loops:** `pageHeader({ art, video })` shows a muted looping `<video>` in
   `.panel-banner`, with the still as its `poster`. The existing sepia and scanline
   treatment still applies over it.
4. **Transmission window:** a small CRT inset that shows the Vess silhouette loop while
   a transmission types out.

The procedural canopy vista stays in 3D. Replacing it with video would lose parallax and
make it look like a screensaver.

### Generating in Gemini (Veo) — technique
- **Start every clip from an existing still** in `public/art/` using image-to-video, so
  the clips match the art already on the site.
- **Seamless loops:** use the **same image as the first and last frame** (the first/last
  frame option). If your Veo version doesn't offer it, generate the clip and fix the seam
  with a 0.5 s crossfade in ffmpeg.
- Ask for **16:9, 1080p, 8 s**. For long cinematics, chain clips by using the last frame
  of clip A as the first frame of clip B.
- **Never let text appear in a clip.** Veo mangles lettering, and on-screen text also
  risks leaking withheld vocabulary. End every prompt with the negative block below.
- Generate 3–4 takes of each clip and keep the one with the least warping in hard metal edges.

### Shared style block (paste at the start of every prompt)
> Cinematic film still come to life, 35mm anamorphic, shallow depth of field, heavy film
> grain. Used-universe science fiction: advanced machinery that has sat in desert dust for
> forty years and still works. Scratched, sandblasted durasteel plates with cut corners,
> exposed rivets, grime in the seams. Warm dark palette of sand, rust and umber. The only
> light sources are dim tungsten filament lamps glowing amber from inside the machines,
> plus cool pale starlight. Dust motes hang in the air. Slow, deliberate, weighty motion.

### Shared negative block (paste at the end)
> No text, no letters, no numbers, no logos, no user interface overlays. No neon, no
> glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's
> faces, no rounded consumer-electronics design.

### Shot list

Priority **P0** is needed for the Friday showcase. **P1** is the full immersion pass, and
**P2** is polish.

#### Loops (seamless, muted in use, 8 s)

| id | P | Source still | Prompt (after the style block) |
|---|---|---|---|
| `cockpit_loop` | P0 | `cockpit.jpg` | Locked-off shot from the pilot's seat looking out through a faceted, dust-streaked canopy. Beyond the glass, a banded desert planet turns very slowly, and a ringed gas giant hangs in the far distance. In the foreground, two analog yokes vibrate faintly and one amber indicator lamp flickers once. Dust drifts through a shaft of starlight. The camera stays still. Audio: deep engine hum, soft instrument ticking. |
| `crucible_loop` | P0 | `crucible.jpg` | A heavy cylindrical containment vessel of thick scratched glass, bolted into a rusted steel frame. Inside, slow soft clouds of deep red and deep blue haze drift and curl around each other without touching, like ink in water. Pressure gauges on the frame twitch. The camera makes a very slow push-in. Audio: low electrical drone, faint glass resonance. |
| `starmap_loop` | P1 | `starmap.jpg` | Top-down view of a battered navigation table: a backlit, sepia-tinted star chart under scratched glass, with brass pins marking four worlds. A mechanical plotting arm slowly traces a line between two pins and leaves a faint amber trail. Audio: servo whir, paper rustle. |
| `comms_loop` | P1 | `comms.jpg` | A bank of old cathode-ray monitors in a cramped comms alcove, each showing rolling analog static and slow sine waveforms in amber phosphor. One screen rolls vertically as if losing sync. Cables hang from the ceiling. Audio: radio static, distant garbled chatter. |
| `cargo_loop` | P1 | `cargo.jpg` | A dim cargo hold packed with dented metal crates strapped down with frayed webbing. A chain sways slightly. A single caged work lamp swings a few degrees and throws moving shadows. Audio: hull creak, chain clink. |
| `quarters_loop` | P2 | `quarters.jpg` | A tiny crew bunk room: a fold-down cot, a personal footlocker, a small porthole with stars sliding slowly past. A dim reading lamp buzzes and flickers once. Audio: muffled engine hum, quiet ticking clock. |
| `airlock_loop` | P2 | `airlock.jpg` | A massive circular airlock door with hazard-striped paint worn to bare metal. Faint vapour leaks from a seal. A warning lamp above it pulses slowly amber. Audio: hiss, deep mechanical thud. |
| `vess_transmission` | P1 | — (text-to-video) | Extreme close framing of an old CRT monitor filled with rolling static. Behind the static, a dark hooded silhouette of a figure sits in shadow, backlit by one amber lamp, and tilts its head slightly as if speaking. The face is never visible, only a silhouette. The picture drifts in and out of sync. Audio: none (it gets muted). |
| `guild_mining` | P1 | `factions.jpg` | A colossal tracked mining crawler grinding across a rust-red canyon floor. Its drill arm turns slowly and throws up curtains of dust, with tiny work lamps on its hull. Wide shot, slow pan. |
| `guild_air` | P1 | `factions_fleet.jpg` | Tall skeletal harvester towers rise from the cloud tops of a banded gas giant. Their long scoops trail through pale ochre cloud bands, and a small tug ship drifts past. Slow aerial drift. |
| `guild_fire` | P1 | `factions.jpg` | Inside an enormous foundry carved into black volcanic rock, a crucible tips and pours molten orange metal into a channel. Sparks drift, heat shimmer rises, and silhouetted gantries are overhead. Slow dolly. |
| `guild_water` | P1 | `hero_desert_outpost.jpg` | A lonely field of tall, thin moisture-collecting towers on a pale desert at dawn. Condensation drips from a collector vane into a dented tank. Two suns sit low on the horizon, and wind carries sand across the ground. Static wide shot. |

#### Cinematics (played once, with audio, click-to-skip)

| id | P | Length | Prompt(s) (after the style block) | Plays at |
|---|---|---|---|---|
| `cold_open` | P0 | 8 s | Slow push-in through a dark, dusty cockpit toward the canopy. The instrument lamps flicker on one by one, from left to right, as if the ship is waking. Past the glass, a banded desert planet comes into view from below. Audio: rising power-up hum, relays clicking in sequence. | Landing, first visit |
| `launch` | P0 | 8 s | Close-up of a worn throttle quadrant: a gloved hand pushes both levers forward. Cut to the canopy view, where the ship lurches and the starfield slides sideways as the ship turns, then pulls ahead. The cabin shakes and dust shakes loose from the ceiling. Audio: engine roar building, metal groaning. | End of Session Zero |
| `erebus_descent` | P0 | 2 × 8 s | **A:** Exterior. A boxy, battered salvage hauler with patched hull plates dives into the upper atmosphere of a banded ochre desert planet, and heat glow builds faintly on its nose. **B** (first frame = last frame of A): The ship breaks through the haze above a vast desert, and far below lies a field of dozens of dark metal pylons arranged in rings around a ruined glass dome. Audio: atmospheric roar fading to wind. | First entry to Sector 01 |
| `gardens_reveal` | P1 | 8 s | Ground level at dusk. The camera cranes up over the dune to reveal the field of twenty dark pylons, each topped by a dead glass lamp, with sand drifted against their bases. One pylon in the foreground has a lamp that flickers weakly. Audio: wind, a faint electrical crackle. | After `erebus_descent`, before stage 1 |
| `pylon_wake` | P1 | 8 s | Close-up of one weathered metal pylon half-buried in sand. It shudders, sand pours off its sides, and the filament inside its glass lamp warms slowly from dark to a steady amber. Sparks drop from a joint. Audio: deep rising hum, a heavy relay clunk. | Stages 7, 10, 15 cleared |
| `gardens_restored` | P0 | 2 × 8 s | **A:** Wide shot at night. Across the desert field, the pylon lamps ignite ring by ring, moving outward from the centre, until the whole field glows amber. **B:** Slow aerial pull-back until the lit rings form a small ember pattern on the dark planet, and the salvage ship rises past the camera. Audio: layered hums building to a chord, then wind. | Stage 20 cleared, before the epilogue |
| `item_award` | P2 | 8 s | A dented cargo crate on a steel floor. Its clamps snap open one after another, and the lid lifts a few inches to let out a slit of warm amber light and a puff of dust. Audio: clamps clacking, pneumatic hiss. | Quest completion item |

**Budget:** about 20 clips at 3–4 takes each comes to roughly 70 generations. Do the P0 set
first: 5 clips, 7 generations with the 2-part clips, about 25 takes.

### Pipeline
1. Save the raw downloads to `assets-src/video/<id>.mp4`. Add this folder to `.gitignore`,
   because the raw files are too large to commit.
2. `npm run bake:video` runs `tools/bake-video.sh`, which uses ffmpeg to produce, for each clip:
   - `public/video/<id>.webm` (VP9 at 960×540, CRF 36, no audio for loops, about 0.6–1.2 MB)
   - `public/video/<id>.mp4` (H.264 at 960×540, as a Safari fallback)
   - `public/video/<id>.jpg`, a poster frame taken at 0 s
   - `public/audio/<id>.webm`, the extracted audio, for cinematics and ambience beds
3. `src/media/manifest.js` lists every clip: `{ id, kind: 'loop'|'cinematic', poster, sources, captions }`.
4. `npm run verify:media` checks that every manifest entry exists on disk, that each
   file stays within its size budget (1.5 MB loop / 3 MB cinematic), and that every
   cinematic has a caption track. Add it to `npm run verify`.

---

## 6. Rules for the other screens

| Screen | Change |
|---|---|
| **Bridge** | The "Resume" key cap becomes **"Pylon 8 awaits"**, and a Vess transmission sits above the progress bar. The progress bar becomes the 20-lamp Gardens map. |
| **Star Map** | Clicking Sector 01 plays `launch` (the first time only), then loads `#/quest`. Locked sectors show as dark pins with the words "No charts." |
| **Quest** | The stage title reads "Pylon 4 · Competing Sites". A transmission line types out before the prompt. When the player solves the stage, the pylon's lamp lights up on the Gardens map with a hum. At milestones, `pylon_wake` plays **after** the reaction animation and the explainer, never over them. |
| **Standings** | Retitle the section to "Fleet Comms". Rank changes print as intercepted transmissions ("Thermal Smelters just lit Pylon 12"). |
| **Inventory** | Items get a one-line provenance ("Pulled from Pylon 20's housing"). The Session Zero trinket appears here. |
| **Crew (Quarters)** | A **Mission log** records each cleared pylon with a timestamp and Vess's `onClear` line. Background and title appear here too. |

The HUD keeps the same nav labels (BRIDGE, STAR MAP, STANDINGS, INVENTORY, CREW), which
CLAUDE.md requires to stay unchanged.

---

## 7. Implementation phases

### Phase 0 — Showcase slice (by Fri 2026-09-18)
Keep this small, because the demo has to work reliably first.
- [ ] Generate the P0 clips: `cold_open`, `cockpit_loop`, `crucible_loop`, `launch`, `erebus_descent`, `gardens_restored`
- [ ] `tools/bake-video.sh` + `npm run bake:video`
- [ ] `src/media/manifest.js`, and `src/ui/cinematic.js` → `playCinematic(id): Promise` (skip on click/Esc/Space, captions, resolves on error, and falls back to the poster on T1 or reduced motion)
- [ ] Cold open on the landing page, and `gardens_restored` before the epilogue
- [ ] `pageHeader({ video })` support, with the banner loop used on the landing page and the quest screen
- [ ] Minimal `soundscape.js`: bed hum, key cap thunk, bond snap, and a mute toggle
- [ ] `npm run verify` passes

### Phase 1 — Fiction layer
- [ ] `src/story/quest1.js` (4 guild openers for stage 1, 19 shared transmissions, 20 `onClear` lines, milestones). The stage 1 opener is chosen from `session.teamId`, and a player with no team falls back to the `earth` opener. In `#/demo` there is no account, so it uses a neutral opener.
- [ ] Transmission component (typed text plus CRT inset) in `quest.js` and `bridge.js`
- [ ] Gardens map component (`src/ui/gardens-map.js`) that replaces the bridge progress bar and adds a strip to the quest HUD
- [ ] "Pylon N" titling
- [ ] CLAUDE.md §7 amendment for transmissions, plus `verify:quest` checks (at most 2 sentences, no withheld vocabulary, 20 entries)
- [ ] Mission log in Quarters

### Phase 2 — Session Zero
- [ ] `src/screens/session-zero/` scene runner (a small state machine with `next()`, `back()` and `skip()`)
- [ ] Rebuild `register.js` as the manifest scene. The validation code and API calls stay unchanged.
- [ ] Rebuild `onboarding.js` as the guild scene, with briefing loops and the party list
- [ ] Oath hold-to-confirm plus the d20 issue roll (CSS 3D die, deterministic seed, cosmetic trinket table)
- [ ] `background` and `trinket` fields: add them to `player/create` as optional columns in `Players.gs` and the proxy mock, and have `verify:flows` cover them
- [ ] Show teammates' trinkets: team roster responses (Apps Script and the proxy mock) include each member's `trinket` id. Display it on the Session Zero party list and on the Crew screen. Only the trinket id and display name are exposed, never email.
- [ ] `sessionZeroDone` flag, and Skip on every scene
- [ ] Generate the P1 guild clips and `vess_transmission`

### Phase 3 — Sound, full
- [ ] Per-room beds, the full UI foley set, and quest game sounds (scan sweep, miss, pylon wake)
- [ ] Volume sliders in Settings
- [ ] Radio murmur under transmissions: 4–6 clips in `public/audio/vess_murmur_*.webm`, picked by line length and ducked under the bed

### Phase 4 — Ship and world polish
- [ ] `VideoTexture` on the cockpit CRTs (on T3 only; T2 keeps the canvas textures)
- [ ] Star Map travel sequence, and Fleet Comms feed on Standings
- [ ] P1/P2 loops on the remaining banners, plus `pylon_wake`, `gardens_reveal` and `item_award`
- [ ] `npm run verify:media` added to `verify`

---

## 8. Guardrails
- **Performance:** a video must never autoplay on T1. On T2, loops play only while visible
  (`IntersectionObserver`) and the player sees only the poster until they interact. No
  page may decode two videos at once.
- **Accessibility:** every cinematic has captions and can be skipped with the keyboard.
  `prefers-reduced-motion` replaces cinematics with the poster and the caption text.
  Audio is off until the player interacts.
- **Teaching comes first:** no cinematic or transmission appears between a miss and its
  `diagnoseMiss` message, or over a reaction animation. Vocabulary still appears only in
  the epilogue.
- **Privacy:** roster payloads carry display name and trinket only.
- **Fairness:** background, trinket and the d20 roll are cosmetic, and `verify:flows`
  asserts that they grant no XP.
- **Aesthetic:** every generated frame is checked against §2 of the brief (no neon, no
  cyan, no bloom, no text). Reject any take that fails.

## 9. Decisions (2026-09-16)
1. **Vess's voice:** a radio murmur only, with no recorded lines.
2. **Trinkets:** teammates can see them, on the party list and the Crew screen.
3. **Stage 1:** each guild gets its own opening transmission.
4. **CLAUDE.md §7:** now exempts story copy (see §2).
