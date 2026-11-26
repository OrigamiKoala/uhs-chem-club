# 3D Conversion — Prompt Pack

Prompts for turning Avalon from *route-driven camera dolly + DOM screens* into
*navigable ship + quests on 3D worlds*, delivered as a new **T4** tier, without breaking
the T1 floor, the 375 px floor, the no-XP Learn invariant or the withheld-vocabulary rules.

Every prompt here is copy-paste ready. Fill only the `«...»` slots.

---

## 0. The design this pack encodes

Read this before pasting anything — the prompts assume these five decisions.

**0.1 — The ship stays a node graph. It gains edges, look-around and doors.**
`SHIP_ANCHORS` in `src/three/camera-rig.js` is already the graph; it has nodes and no
edges. Free-roam WASD is the wrong target for the general case: the confirmed floor is a
student on a Chromebook at 375 px with a 30 fps budget. The conversion is: add adjacency,
add a visible hatch you click to traverse, add damped look-around at each node, and gate
continuous walking behind T4.

**0.2 — A quest world is one scene with N sites, not N scenes.**
The Charge Gardens is one Erebus basin with 20 pylons, instanced from a single mesh. The
existing `quest3d` chamber is not replaced — it becomes the instrument you deploy *at* a
pylon. Total new geometry for Quest 1: terrain, skybox, pylon, lander, three rock
variants. Seven assets, not seven hundred.

**0.3 — Every new 3D affordance ships with its lower-tier equivalent in the same commit.**
Not a follow-up task. `verify:flows` should fail otherwise.

**0.4 — Invariants that outrank any prompt below.**
Learn track never calls `session.addXp`, `api.gradeStage`, `api.completeQuest` or
`session.recordProgress`. XP once per stage, flat, hints free, completion idempotent,
progress never regresses. Withheld vocabulary never appears in a player-facing string.
Charge red `#ff1744` / blue `#00b0ff` appear only inside the chemistry chamber. Nothing
blooms. No emoji. No rounded corners.

**0.5 — T4 is a fidelity tier, not a second game. This is the load-bearing decision.**

T1, T2 and T3 mean one thing today: *the same game at different fidelity*. `PRODUCT.md`
pins it — every quest is 100 % solvable in T1, and every tier produces "the identical
payload contract." A T4 that alone has a navigable ship and 3D worlds would break that
meaning. It would be a **content fork**, not a quality tier, and it costs you:

- two ship navigation code paths to maintain forever;
- a teleport bug by construction — `recordFrame` already downgrades a struggling client
  mid-session, so a student walking through the ship would be dropped into a dolly rig
  with no matching camera state;
- invisible work on showcase night, when the projector is plugged into whatever laptop
  is in the room;
- a forked media manifest, forked budgets, and forked assertions in all five verifiers.

So the boundary here is drawn differently: **T3 and T4 share the world model and the ship
graph. They differ in how you move through it and how much of it is drawn.** T2 gets the
same world as baked stills — which your `npm run bake:stills` pipeline and `/art/*.jpg`
route stills already do for the ship, so it is an extension, not a new system. T1 is
untouched.

| | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| Ship | nav buttons (today) | baked still per node | procedural interior, graph traversal, eased dolly, free look | + continuous walk, dust, contact shadows |
| World | site list + `t1.siteDescriptions` | baked still per site | world scene, half-res terrain, no particles, instant dolly between sites | full terrain, dust, per-instance variation, walk between sites |
| Quest chamber | DOM inputs (today) | unchanged | unchanged | unchanged |
| World bytes | 0 | ~800 KB stills | ~2.5 MB | ~6 MB |
| Assigned by | probe | probe | probe (default ceiling) | **opt-in only** |

**T4 is never auto-assigned.** The probe's ceiling stays T3. A student is offered T4 in
Settings when their client clears the eligibility gate, and a downgrade from T4 lands on
T3 — same world, same graph, cheaper draw. Nothing teleports.

If you would rather T4 be a hard fork — T3 keeps today's dolly and floating chamber, and
all new 3D lives only in T4 — then §4.2 and §4.4 are the sections to rewrite, and you
should expect the four costs listed above. I do not recommend it.

---

## 1. The STYLE LOCK

Everything visual in sets 2 and 3 is generated with this block pasted verbatim. Changing
it per-asset is what makes an AI-generated asset set look like it came from nine different
games.

```
STYLE LOCK — SCOURED PLATE

Matte industrial hardware that has been in the dust for forty years and still works.
Advanced technology, poorly maintained.

Materials: sandblasted metal, worn anodised plate, scuffed ceramic, dust-caked seams.
Surface finish is matte throughout — no gloss, no chrome, no wet look.
Palette: warm dark neutrals with a brown/sand bias. Never blue-black.
Light: warm sodium filament from inside the object, dim and local, colour #d99423.
Never LED, never neon, never rim glow, never bloom, never lens flare.
Geometry: machined chamfered corners — cut, never rounded. Visible seams, rivets,
weld lines, panel gaps, stencilled serial markings and hazard stripes worn half away.
Lighting setup: one warm sodium key from upper left, cool dim starlight fill from
behind, deep shadow. High micro-contrast, low bloom.

BANNED: neon, synthwave, electric cyan #00e5ff, glossy blue glassmorphism, candy
gradients, white specular highlights, glowing outlines, holographic rainbow sheen,
rounded corners, text, logos, watermarks, human figures, UI overlays.
```

Append the per-asset line from §2 to this block. Never edit the block itself.

---

## 2. Asset generation prompts

### 2.1 Concept image → image-to-3D (the two-stage path)

Generate a concept image first, then feed that image to image-to-3D. Text-to-3D directly
is consistently worse and gives you no art-direction control.

**Stage A — concept image.** Paste the STYLE LOCK, then one of these, then the framing
line.

Framing line (always append):
```
Single object centred, full object in frame with margin on all sides, three-quarter
view slightly above eye level, plain mid-grey seamless background, no ground shadow
contact beyond a soft ellipse, product-catalogue framing.
```

Per-asset lines for Quest 1 (Erebus, The Charge Gardens):

```
ASSET: charge pylon. A derelict alien power pylon roughly four metres tall — a
tapered ceramic-and-durasteel mast on a splayed three-footed base half-buried in
desert grit, a banded collar of cooling fins at two-thirds height, a dark inspection
recess at chest height with a single dead amber indicator inside it, and a cracked
dish crown. Dormant: nothing is lit except that one indicator. Weathered by four
decades of abrasive sand.
```

```
ASSET: survey lander. A squat four-legged short-range descent craft, wedge fuselage,
scorched heat-shield underbelly, a folded boarding ramp at the rear, two external
cargo cradles, hull plating in worn sand-brown with stencilled two-letter guild
designator markings worn to half legibility. Landed, ramp down, no crew.
```

```
ASSET: basin rock formation, variant «A|B|C». A wind-carved desert outcrop of layered
sedimentary stone, undercut at the base by abrasion, sharp fractured upper edges,
sand drifted against the windward face. Dry, dusty, no vegetation, no ice.
```

Ship-interior props (used by set 4's station work):

```
ASSET: «cargo crate | instrument console | bunk locker | comms relay rack |
navigation plinth». «one sentence of physical description». Free-standing, scale
readable against a one-metre reference, all faces resolved.
```

**Stage B — image-to-3D.** Model choice, cheapest first:

| Model | VRAM | Licence | Use it for |
|---|---|---|---|
| TripoSR | ~6 GB, CPU fallback | MIT | First pass, silhouette check, anything you will hand-retopo anyway |
| Hunyuan3D 2.1 shape-only | ~10 GB (fits a free T4 GPU) | Community licence — EU/UK/KR carve-out, 1M MAU gate | Production shape for every hero prop |
| TRELLIS.2 | 24 GB, Linux only | MIT | Only if you get a bigger GPU; native PBR + transparency |

Run them on Kaggle (~30 GPU-hours/week free, 2×T4) or Colab free. **Do not try this on
the M2 Air** — these are CUDA-bound and MPS support is partial and slow. Your Mac is the
Blender + Vite machine.

> Note: "T4" in this table is the NVIDIA GPU. Everywhere else in this document T4 is the
> Avalon quality tier. They are unrelated.

Notebook prompt, if you want an agent to write the Kaggle notebook for you:

```
Write a single Kaggle notebook that runs Hunyuan3D 2.1 in shape-only mode on an
NVIDIA T4. Constraints: shape-only so it fits in ~10 GB; batch over every PNG in
/kaggle/input/avalon-concepts/; export GLB to /kaggle/working/raw/; print peak VRAM
and wall-clock per asset; no interactive widgets; must survive a session restart by
skipping assets whose GLB already exists. Include a cell at the top that pins exact
package versions and a cell at the bottom that zips /kaggle/working/raw for download.
Do not add texture generation — texturing happens in Blender against the concept image.
```

### 2.2 Skyboxes

One equirectangular sky per world. This is the single highest-leverage generated asset
you have: it sells a planet for roughly one draw call, and it is the one asset T2's baked
stills inherit directly.

```
STYLE LOCK (paste it)

ASSET: 360° equirectangular panorama, 2:1 aspect ratio, seamless left-right wrap,
horizon on the vertical midline.

SCENE: «Erebus — a desert world at low sun. Dust-laden amber sky grading to deep
umber at zenith, a banded gas giant low on the horizon taking up 20° of arc with its
ring system edge-on, one small pale moon, distant mesa silhouettes along the horizon
line, suspended dust reducing contrast with distance.»

No ground plane detail below -20° elevation — it will be covered by terrain geometry.
No sun disc in frame. No stars on the day side. No text, no watermark, no vignette.
```

Generate at 4096×2048 and downsample — T4 ships 2048×1024, T3 ships 1024×512, T2 crops
stills from it. One generation, three outputs.

Per-world SCENE lines for the Learn track (worlds 1–10) follow the same shape: the planet,
the light, the one landmark, the haze depth. Keep every one warm-neutral — a cyan ice
world would break the palette rule.

Free sources: Blockade Labs Skybox AI has a usable free tier and exports engine-ready;
otherwise generate the equirect with any free image model and fix the pole pinch and the
wrap seam by hand in GIMP (offset by half the width, heal the seam, offset back).

### 2.3 Tileable surface textures

```
STYLE LOCK (paste it)

ASSET: seamless tileable PBR albedo texture, 1024×1024, orthographic top-down, even
flat lighting with no baked shadows and no baked highlights, tiles perfectly on all
four edges.

SURFACE: «wind-rippled coarse desert grit with scattered dark basalt fragments and
fine dust filling the hollows»
```

Other SURFACE values you need: `worn ribbed durasteel deck plating with anti-slip
tread and dust in the grooves`, `scuffed anodised bulkhead panel with rivet rows and
stencil ghosting`, `cracked dry lakebed hardpan`.

Derive normal/roughness/AO locally from the albedo — do not generate them, they will not
register with each other. Blender: Image Texture → Color Ramp → Bump, or bake a height
pass. Free and correct beats generated and misaligned.

---

## 3. Level + quest JSON prompts

### 3.1 The world graph prompt (Gemini Flash / any cheap model)

This is the prompt that authors a world as data, so a world can be regenerated without
touching art or code — and so one definition drives all four tiers.

```
You are authoring a world definition for Avalon, a chemistry RPG for middle- and
high-school students who know no chemistry. Output JSON only, no prose, no fences.

WORLD TO AUTHOR: «Erebus — The Charge Gardens»

SCHEMA:
{
  "id": string, kebab-case,
  "name": string, the diegetic place name,
  "oneLine": string, at most 8 words, the quest's single descriptive line,
  "sky": string, the skybox asset key,
  "terrain": { "heightmap": string, "size": [x, z], "maxHeight": number,
               "material": string },
  "ambience": { "keyLight": hex, "fillLight": hex, "fogColor": hex,
                "fogNear": number, "fogFar": number, "dustDensity": 0..1 },
  "landmarks": [ { "asset": string, "pos": [x,y,z], "rotY": number,
                   "scale": number, "minTier": "T3"|"T4" } ],
  "sites": [ { "id": string, "stage": integer 1..20, "pos": [x,y,z],
               "approachPos": [x,y,z], "label": string } ],
  "spawn": { "pos": [x,y,z], "lookAt": [x,y,z] },
  "t2": { "stillCamera": { siteId: { "pos": [x,y,z], "lookAt": [x,y,z] } } },
  "t1": { "siteOrder": [site ids], "siteDescriptions": { siteId: string } }
}

HARD RULES:
1. Exactly 20 sites, one per Quest 1 stage, stage numbers 1..20 with no gaps.
2. Sites are laid out so that stage order is also a walkable route: each site's
   approachPos is within 18 units of the previous site's pos. The basin is a loop,
   not a line — site 20 ends within 30 units of spawn.
3. No two sites within 12 units of each other, or their labels will overlap at 375 px.
4. Landmarks with "minTier": "T4" are decoration only. Removing every one of them must
   leave the basin fully navigable and every site reachable — that is what makes T3 the
   same world rather than a different one.
5. Every "label" is a place name, never a chemistry term. Allowed vocabulary is:
   pylon, mast, basin, ridge, drift, terrace, hollow, span, relay.
6. FORBIDDEN in every string: electron, nucleophile, electrophile, carbonyl,
   carbocation, alkyl, ester, epoxide, isopropyl, charge, polarity, bond.
7. "t2.stillCamera" gives one framing per site for the baked-still tier: the site must
   fill at least a third of frame height and be unambiguous against its neighbours.
8. "t1.siteDescriptions" must let a student with no 3D view pick the same site by
   description alone — use position and landmark relationships ("north of the lander,
   at the foot of the tall outcrop"), never colour and never a chemistry hint. It may
   only reference landmarks whose minTier is "T3".
9. Colours are warm neutrals with a brown/sand bias. Never blue-black, never cyan,
   never #ff1744 or #00b0ff — those are reserved for the chemistry chamber.
10. "asset" values must come from this list and no other:
    «pylon, lander, rock-a, rock-b, rock-c»
11. oneLine follows the existing template exactly in register: "Find what pulls. Draw
    the line." — an instruction to the player, two short sentences, no product voice.
```

Then a second pass to catch what a generator always gets wrong:

```
Here is the world JSON you produced: «paste»

Audit it against the HARD RULES and report violations as a JSON array of
{ "rule": integer, "where": string, "why": string }. Check rules 2, 3 and 4 by
actually computing the distances and by simulating removal of every minTier T4
landmark. If there are no violations, output [].
Do not output a corrected version — only the audit.
```

### 3.2 Ship graph prompt

```
Author the ship traversal graph for Avalon. Output JSON only.

The nodes already exist as SHIP_ANCHORS in src/three/camera-rig.js:
cockpit, bridge, starmap, quarters, cargo, comms, airlock — with pos and target
vectors given here: «paste SHIP_ANCHORS»

Produce:
{
  "nodes": { nodeId: { "adjacent": [nodeId], "hatchPos": { nodeId: [x,y,z] },
                       "lookLimits": { "yaw": degrees, "pitch": degrees },
                       "walkPath": { nodeId: [[x,y,z], ...] } } },
  "routeBinding": { hashRoute: nodeId }
}

HARD RULES:
1. The graph is connected and undirected — if A lists B, B lists A.
2. Every node is reachable from bridge in at most 3 hops. A student at a club meeting
   does not have time for a maze.
3. hatchPos[B] is a point in node A's space that the player clicks to travel to B.
   It must be inside A's lookLimits cone from A's pos, or it is unreachable.
4. lookLimits.yaw ≤ 100 and pitch ≤ 35 at every node — free look, not free rotation,
   so the procedural interior is never seen from behind.
5. walkPath[B] is a 3–6 point spline from A's pos to B's pos, used only by T4's
   continuous walk. Every point clears the interior geometry by at least 0.4 units and
   sits between 1.4 and 1.8 on Y. T3 ignores walkPath entirely and eases straight
   between the two anchor positions — both must arrive at the same place.
6. routeBinding covers exactly: #/bridge, #/starmap, #/quarters, #/inventory,
   #/leaderboard, #/settings, #/quest. Nothing else.
7. airlock is adjacent to bridge and to cargo only — it is the departure node and must
   not be a shortcut between crew spaces.
```

---

## 4. Coding agent prompts

Paste these one at a time into Claude Code / your planner subagent, in order. Each one
ends by requiring `npm run verify` to pass, which is what keeps the conversion honest.

### 4.1 Preamble — prepend to every prompt in this section

```
Read CLAUDE.md, PRODUCT.md and DESIGN.md before writing any code. They are authority,
not background.

Non-negotiable constraints for this task:
- SCOURED PLATE aesthetic. Nothing blooms. box-shadow glow is banned. Corners are
  chamfered, never rounded. No emoji in player-facing markup.
- Charge red #ff1744 and blue #00b0ff appear only inside the quest3d chamber.
- FOUR hardware tiers. T1 has zero WebGL and must remain 100% able to complete every
  stage. T4 is a fidelity tier over the same world model as T3 — it may add motion,
  density and resolution, and may never add a place, a site, a route or an
  interaction that T3 does not have. Any 3D affordance you add ships with its
  lower-tier equivalent in the same commit.
- A tier downgrade mid-session must never move the player, reset their view target,
  or re-download an asset they already have.
- Every screen works at 375 px wide.
- Player-facing strings contain no withheld vocabulary.
- src/learn/** must never call session.addXp, api.gradeStage, api.completeQuest or
  session.recordProgress.
- Dependencies: three ^0.174.0 and Vite only. If you believe a new dependency is
  required, stop and explain why instead of adding it.

When you are done: run `npm run verify` and paste the output. If it fails, fix it
before reporting. Do not report success on a failing verify.
```

### 4.2 Tier plumbing — do this first, it is the smallest and everything depends on it

```
«preamble»

TASK: add a fourth quality tier, T4, to src/three/tier.js and everything that reads it.

T4 is the enhanced tier: continuous walking, particle dust, contact shadows, full-res
terrain and skybox, per-instance prop variation. It renders the same world and the same
ship graph as T3.

1. TierManager gains 'T4'. The AUTOMATIC PROBE CEILING STAYS AT T3 — no client is ever
   probed into T4. Reason: T4 costs ~6 MB of world assets, and no vendor string or
   frame probe can honestly predict that a school network wants to pay it.
2. Add isT4Eligible(): WebGL2 present, not coarse-pointer, hardwareConcurrency >= 8,
   navigator.deviceMemory >= 8 when the browser reports it (treat absent as pass),
   devicePixelRatio <= 2, and the boot frame probe averaging >= 55 fps at T3. Eligibility
   only unlocks the offer; it never applies the tier.
3. Settings (#/settings) gains an explicit opt-in control for T4, disabled with a one-line
   diegetic reason when isT4Eligible() is false. Copy is a label and a rule, nothing else
   — no feature marketing, per CLAUDE.md §7.
4. Downgrade ladder becomes T4 -> T3 -> T2 -> T1, driven by the existing recordFrame
   thresholds. A T4 -> T3 downgrade must be seamless: same scene graph, same camera
   position and target, drop the enhancements only. Write it so that if the player is
   mid-walk when it fires, the walk completes as a T3 eased dolly to the same
   destination rather than snapping.
5. A downgrade out of T4 sets a session flag that prevents automatic re-entry for the
   rest of the session. Re-entering must be a deliberate act in Settings. Without this
   a borderline machine oscillates.
6. cycleTier() becomes four-way but SKIPS T4 when isT4Eligible() is false, so the
   settings cycle can never strand an ineligible client on a tier it cannot render.
7. session.gfxTier migration: an existing stored value of 'T3' still means T3. Do not
   renumber, do not remap, do not promote anyone silently.
8. Everything that currently branches on `tierManager.currentTier === 'T3'` must be
   audited — stage.js antialias, DPR, starfield count. Decide per site whether the
   condition should become `>= T3` or stay `=== T3`, and say which you chose and why in
   your summary. Add a tierAtLeast(tier) helper rather than string comparisons scattered
   through the codebase.

Update the tier documentation in README.md, PRODUCT.md and CLAUDE.md — all three
currently describe exactly three tiers, in several places each.

Extend tools/verify-flows.mjs to assert: the probe never returns T4; isT4Eligible() is
false for a simulated coarse-pointer client; and a T4 -> T3 downgrade preserves camera
position and target to within 0.001.
```

### 4.3 Ship traversal

```
«preamble»

TASK: convert the ship from route-driven camera dolly to player-driven node traversal,
at T3 and T4.

Today src/three/camera-rig.js dollies between SHIP_ANCHORS when the hash route changes.
The player never moves the camera themselves. Change that.

1. Add src/three/ship-graph.js exporting the graph JSON from §3.2 (adjacency, hatchPos,
   lookLimits, walkPath, routeBinding). Pure data, no THREE import, so the verifier can
   import it.
2. Extend CameraRig with:
   - look(dx, dy) — damped free look at the current node, clamped to that node's
     lookLimits. Pointer drag on desktop, one-finger drag on touch. T3 and T4.
   - traverse(nodeId) — only succeeds when nodeId is adjacent to currentLocation.
     T3 uses the existing eased dolly between anchor positions. T4 follows walkPath.
     Both arrive at identical position and target.
   - Route binding inverts: changing the hash calls traverse() along the shortest path,
     and arriving at a node pushes its bound hash route.
3. Add hatch markers at T3 and T4: at each node, one low-poly plate marker per adjacent
   node, placed at hatchPos, raycast-pickable, labelled with the destination name in
   Share Tech Mono on a chamfered plate. Unlit except for a single amber indicator — it
   is a sign, not a lamp. Hover raises its indicator; it does not glow.
4. T4 only: hold-to-walk. Damped forward translation along walkPath, with the player able
   to stop, look and reverse anywhere along it. Never leaves the spline.
5. T2: the ship is a baked still per node, swapped on traverse. Hatch markers become
   DOM hotspots positioned from the still's camera projection.
6. T1: unchanged. The adjacency renders as destination buttons in the existing nav — the
   same routes, the same payload. No new screen.
7. Respect session.reduceMotion everywhere: it already snaps the dolly; it must also
   disable hold-to-walk and set look damping to zero.

Add tools/verify-ship.mjs, wired as `npm run verify:ship` and added to `npm run verify`.
It must assert: the graph is connected and undirected; every node is within 3 hops of
bridge; every hatchPos lies inside its source node's lookLimits cone; every walkPath
starts and ends at its two anchors and clears 0.4 units of interior geometry; T3 and T4
traversal of the same edge terminate at the same position and target; routeBinding covers
exactly the seven routes CLAUDE.md lists; and no node has lookLimits exceeding 100° yaw
or 35° pitch.

Update CLAUDE.md §Architecture and §8 to describe ship-graph.js and the traversal model.
```

### 4.4 World scenes

```
«preamble»

TASK: give Quest 1 a place. The containment chamber currently floats with no context;
the Charge Gardens should be a basin on Erebus with 20 pylons standing in it.

1. Add src/three/world.js exporting class WorldScene, built from a world JSON matching
   the schema in §3.1. It owns: skybox, terrain from heightmap, instanced landmark
   meshes, instanced pylon meshes at every site, fog per the ambience block, and the
   site picker.
2. stage.js gains a third mode: 'ship' | 'world' | 'quest'. Entering #/quest loads the
   Erebus world and places the camera at world.spawn, not at the chamber.
3. Site interaction: clicking a pylon whose stage is reached opens the existing quest3d
   chamber as a deployed instrument — the chamber stays exactly as it is today, including
   evaluator.js, grading and the reaction animation. The world is the frame around it,
   never a replacement for it. Unreached pylons are pickable but answer with the existing
   soft-refusal path, not an error banner.
4. Cleared pylons light their single indicator. That is the only thing in the world
   allowed to be lit. ui/gardens-map.js already tracks 20-pylon status — drive the
   instanced indicator colour from the same source, do not duplicate the state.
5. Tier split, one scene graph, enhancements added not substituted:
   - T4: full heightmap resolution, dust particles at ambience.dustDensity, contact
     shadows, per-instance rotation/scale variation on pylons and rocks, all landmarks
     including minTier T4, 2048 skybox, continuous walk between sites along the stage
     route.
   - T3: half heightmap resolution, no particles, no shadows, no per-instance variation,
     minTier T3 landmarks only, 1024 skybox, eased dolly between site approachPos.
   - T2: no WebGL world. Baked still per site from world.t2.stillCamera, swapped on site
     change, with the chamber layered over it exactly as the ship stills work today.
   - T1: the world does not load at all. fallback2d is unchanged and still completes
     every stage; world.t1.siteDescriptions supplies the site labels.
6. Extend tools/bake-stills.mjs to render the T2 site stills headlessly from the same
   WorldScene at T3 settings. One content model, four presentations — do not hand-author
   T2 art.
7. Asset budget, enforced by verify:media: T4 world ≤ 6 MB over the wire including
   skybox; T3 ≤ 2.5 MB; T2 stills ≤ 800 KB total. If you cannot hit a budget, reduce
   texture resolution before reducing geometry — the silhouette is what reads at 375 px.

Do not touch src/quest3d/evaluator.js. Grading, XP, hints and the withheld-vocabulary
rules are unchanged by this task.
```

### 4.5 Streaming and boot cost

```
«preamble»

TASK: the ship must still paint in under a second on a Chromebook now that world assets
exist, and a T3 client must never download T4's assets.

1. Worlds are lazy — dynamic import + fetch on entering #/quest, never at boot. main.js
   keeps booting the ship stage, HUD and router before any network call.
2. Asset sets are per-tier and resolved at request time: T4 pulls the full set, T3 the
   reduced set, T2 the stills, T1 nothing. A tier downgrade mid-session uses what is
   already in memory and cancels in-flight fetches for assets the new tier does not need.
   It never re-downloads.
3. One loading state, diegetic, in the existing transmission component's register. No
   spinner, no percentage bar unless it is a real percentage.
4. Assets are content-hashed per file so a redeploy does not cost students a re-download
   of unchanged assets.
5. Add per-tier world bundle sizes to media/manifest.js and extend verify:media to
   enforce the three budgets from §4.4.7 separately.
6. Measure and report in your summary: time-to-first-paint for #/bridge and total bytes
   for #/quest, per tier, before and after, on a DPR-1 throttled profile.
```

### 4.6 The consistency pass

Run this last, and run it again after every batch of generated assets.

```
«preamble»

TASK: audit, do not fix. Report only.

Walk every new 3D asset and scene added by the world conversion and report, as a table,
every violation of the SCOURED PLATE brief in CLAUDE.md §Aesthetic:
- anything emissive that is not literally a lamp or an indicator
- any material with roughness < 0.35 (nothing in this universe is polished)
- any colour outside the warm-neutral plate scale, excluding the reserved chemistry
  red/blue inside the chamber and the guild liveries
- any rounded geometry where a chamfer belongs
- any asset whose triangle count exceeds its budget: hero prop 5000, background prop
  1000, terrain 20000 at T4 / 10000 at T3
- any texture above 1024 that is not the T4 skybox
- any player-facing string added by the conversion that contains withheld vocabulary,
  advertises the product, or exceeds the two-sentence transmission limit
- ANY place, site, route or interaction that exists at T4 and not at T3 — this is the
  tier-fork check and it is the most important row in the table

For each row give file, line, the rule from CLAUDE.md it violates, and the one-line fix.
Do not edit anything.
```

---

## 5. Asset post-processing prompts

Generated meshes arrive at 100k–500k triangles with unusable topology and 4K textures.
Untouched, ten of them end the Chromebook tier. This step is not optional.

### 5.1 Budgets

| Asset class | Triangles (T4 / T3) | Texture (T4 / T3) | Over the wire |
|---|---|---|---|
| Hero prop (pylon, lander) | 5 000 / 2 500 | 1024 / 512 albedo + ORM | ≤ 400 KB / 150 KB |
| Background prop (rocks, crates) | 1 000 / 500 | 512 shared atlas | ≤ 120 KB / 60 KB |
| Terrain | 20 000 / 10 000 | 1024 / 512 tiling | ≤ 500 KB / 250 KB |
| Skybox | — | 2048×1024 / 1024×512 KTX2 | ≤ 1.2 MB / 400 KB |
| **World total** | | | **≤ 6 MB / 2.5 MB** |

Both levels come from one processing run — §5.2 emits the T4 mesh and §5.3 derives the T3
set from it. Never author two versions by hand; they will drift.

### 5.2 Blender headless prompt

```
Write a Blender 4.x headless Python script, tools/process-asset.py, run as:
  blender --background --python tools/process-asset.py -- <in.glb> <out.glb> <budget_tris>

It must, in order:
1. Import the GLB, join meshes, and drop everything not on the largest connected
   component (image-to-3D output routinely carries floating fragments).
2. Recalculate normals outside; remove doubles at 0.0001.
3. Decimate (collapse) to <budget_tris>, then, if the result has n-gons, triangulate.
4. Smart-UV-unwrap the decimated mesh with 0.02 island margin.
5. Bake the pre-decimation high-poly normals onto the decimated mesh as a 1024 normal
   map, plus AO at 512 into the green channel of an ORM texture.
6. Set the material to Principled BSDF with roughness clamped to a minimum of 0.35 and
   metallic no higher than 0.6 — nothing in this universe is polished or chrome.
7. Apply all transforms, set origin to the base of the bounding box (assets stand on
   terrain, they do not float), and scale so one Blender unit is one metre.
8. Export GLB with +Y up, no cameras, no lights, no animation.

Print before/after triangle counts and bail with exit code 1 if the output exceeds the
budget. No GUI calls, no bpy.ops.wm.save_mainfile, deterministic output.
```

### 5.3 Compression and tier derivation prompt

```
Add tools/compress-assets.sh using @gltf-transform/cli (devDependency, build-time only —
it never ships to the browser).

For every GLB in public/art/models/raw/, emit TWO optimised outputs:
  public/art/models/t4/<name>.glb  — full budget
  public/art/models/t3/<name>.glb  — half triangles, half texture resolution

  gltf-transform optimize <in> <out> \
    --compress draco \
    --texture-compress ktx2 \
    --texture-size <1024|512> \
    --simplify <false|true>

The T3 output uses --simplify true with a ratio computed to land on the T3 triangle
budget from §5.1. Both outputs must keep identical node names, origins and scales so
world.js can swap sets by path alone with no per-tier code.

Then:
- Prune unused nodes, materials and textures in both sets.
- Weld vertices.
- Deduplicate textures shared across assets — the rock variants must reference one atlas,
  not three copies, in each set.
- Write the resulting byte sizes, per tier, into src/media/manifest.js so verify:media
  enforces the three budgets separately.
- Fail the script if any single asset exceeds its class budget for its tier.

Note in the script header that three.js needs DRACOLoader and KTX2Loader configured in
world.js, and confirm they are wired before the first asset ships.
```

---

## 6. Order of operations

1. **§4.2 tier plumbing.** Smallest task, no assets, no visual change, and everything
   else branches on it. Ship it alone and confirm `npm run verify` is green before
   touching a scene.
2. §3.2 ship graph JSON → §4.3 ship traversal. Still no new assets, no download cost.
   This is the change students will feel most and it cannot break the quest.
3. §2.1 concept images for pylon, lander, three rocks → §2.2 Erebus skybox → §2.3 terrain
   texture. Five images, one sky, one tile.
4. §5.2 + §5.3 processing, before anything is imported. Never let an unprocessed GLB into
   `public/`.
5. §3.1 world JSON → §4.4 world scenes → §4.5 streaming.
6. §4.6 consistency audit, with particular attention to the tier-fork row. Then again
   after the Learn track's ten skyboxes.

Everything above runs on free tiers: Kaggle for the GPU, Blender and gltf-transform
locally, one free skybox tier or hand-fixed equirects. The only thing you can spend money
on here is speed, and at seven assets per world you do not need it.

---

## 7. What this pack deliberately does not do

- It does not touch `evaluator.js`, grading, XP, hints or the epilogue. The chemistry is
  finished; this is the frame around it.
- It does not let T4 contain content T3 lacks. See §0.5 — that constraint is the whole
  reason the tier is affordable to maintain.
- It does not auto-promote anyone to T4. Opt-in only, eligibility-gated, one-way per
  session after a downgrade.
- It does not generate the Learn track's ten worlds yet. Build Erebus end-to-end first and
  let what breaks inform the other ten — the §4.6 audit is the instrument for that.
- It does not establish an accessibility standard. `PRODUCT.md` says none is agreed;
  adding one is a product decision, not a conversion task.
