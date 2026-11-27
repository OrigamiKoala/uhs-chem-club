# Realism pass: one Learn world

Replace `<WORLD>` with the world's key (one of: ember, mirrowen, kettle, teeter, verdigris, brinewire, quicklight, lodestone, cinderhalo, thornmere, or the older ligar / lanternfall / bellows / tallow).

---

You are making ONE Avalon Learn world, **`<WORLD>`**, look like a real place. Today its walkable 3D world reads as cheap and toy-like. The worst problems are **shape** and **texture**; **lighting** is a close third. The layout, benches, teaching and gameplay already work. Do not change them. This is an art pass on how the world looks, and it ships only if every existing check still passes.

## Why it looks fake (diagnosis; confirm it in this world's code)

1. **Shapes are bare primitives.** Hosts and props are mostly raw `BoxGeometry` / `CylinderGeometry` / `SphereGeometry` with hard 90° edges, perfectly flat faces, perfect symmetry and no wear. Nothing real is that clean. Real objects have bevelled or rounded edges, seams, lips, flanges, sagging, chips, and parts built from smaller parts.
2. **Textures are procedural and low-frequency.** Every surface is a canvas map generated at runtime (`src/three/materials/<WORLD>-textures.js` on top of `pbr-kit.js`, `texSize(512)`). The usual results are: noise that reads as "noise" instead of as a material; one tile repeating visibly across large areas; albedo that is too saturated or too even; roughness that barely varies; normal maps that are too strong or too smooth; and no grime that follows the geometry (dirt in creases, wear on edges, streaks under drips, damp at the base of walls).
3. **Scale cues are missing.** Texel density changes from object to object, plank and stone sizes don't match real ones, and nothing at human scale (rails, steps, bolts, handles, conduit) shows the player how big things are.
4. **Lighting is flat.** Ambient and environment light are too uniform, there is no contact shadowing where objects meet the ground, and every material has the same specular response.

## Read first (in chunks, only what you need)

- `CLAUDE.md` (hard rules: performance, lamps, parity, banned looks)
- `DESIGN.md`, the SCOURED PLATE look. Obsidian/titanium plates are intentional. Use warm filament light, amber only as a signal, no neon, no cyan, no glow blooms.
- `docs/engineering/engine-and-worlds.md`, section "Worlds, ship, voyage (3D)": PBR kit rules, `mergeStatic` / `consolidateStatic`, `LampPool`, cover mask, shadow pacing, perf budgets
- `docs/world-build-prompt.md`, Phase 5 (the site method and its checks)
- This world's code: `src/three/<WORLD>.js`, `src/three/<WORLD>/`, `src/three/materials/<WORLD>-textures.js`, `src/three/materials/pbr-kit.js` (greeble helpers such as `boltRing`, `weldBead`, `pipeRun`, `addDetailNormal`, `addMacroVariation`), and `tools/verify-<WORLD>.mjs`
- This world's audit/feedback files in `docs/` (`<WORLD>-audit.md`, `feedback-*-<WORLD>.md`), so you don't undo a fix the owner asked for

## Phase 0: Look, then write a short plan

1. Take screenshots of the world at 3D On: spawn view, two hosts from the approach, one lean-in at a bench, the far horizon, and one close-up of the ground at eye height. **The owner allows browser use for this task, only to screenshot `<WORLD>`.** Start the dev server via `.claude/launch.json` (`npm run dev`, port 3000), enter as guest (`session.startGuest()`), and fly to the world. Save the shots to `docs/images/realism-<WORLD>/before-*.png`.
2. For each shot, list the 5–10 things that look most fake, each tied to a cause from the diagnosis above.
3. Write `docs/plans/realism-<WORLD>.md` with:
   - What real place this world is (the geology, the climate, what the structures are built from and how old they are) and 3–6 real-world reference descriptions for it, e.g. "flooded 19th-century concrete fort, green copper flashing, algae line at the high-water mark".
   - The CC0 texture list (see below).
   - The ordered list of changes and how each one will be checked.
4. Go straight on to Phase 1. Don't wait for the owner to approve the plan. If something is truly ambiguous, write down the choice you made and why in the plan, and keep going.

### Sourced vs procedural assets

The repo has no texture or model loading pipeline for worlds yet. NPCs load `.glb` from `public/models/npc/`, which is the only precedent. Two options:

- **A. CC0 photo-scanned PBR textures** (for example Poly Haven or ambientCG: albedo/normal/roughness/AO at 1K–2K, KTX2 or compressed JPG/WebP), plus optionally a few CC0 `.glb` props. This gives the biggest jump in realism. It costs download size, a loader path, warming inside `warmWorld`, and a fallback at lower tiers. Record licences in `public/textures/<WORLD>/LICENSE.md`.
- **B. Better procedural.** Keep the canvas generators but rewrite them properly: multi-octave structure at real-world scale, curvature/cavity grime, edge wear, macro variation over every big surface, and triplanar or world-space UVs on terrain so nothing visibly tiles.

**The owner has chosen A: CC0 textures.** Use CC0 photo-scanned PBR sets for the ground and every surface the player sees up close. Keep procedural maps only for small details, and as the lower-tier fallback. In the plan, list each texture you intend to use (name, source URL, resolution, size on disk), and keep the world's total texture download as small as you reasonably can. **The owner pre-approves these downloads:** download CC0 textures from Poly Haven or ambientCG whenever you need them, without asking. Check that each one is actually CC0 before using it, and download nothing that isn't. Build the loader as a small shared, opt-in module (e.g. `src/three/materials/texture-pack.js`) so later worlds can reuse it.

## Phase 1: Shape (do this first; it matters most)

- Replace bare primitives on everything the player walks past within ~15 m with built shapes: bevelled boxes (`RoundedBoxGeometry` from three/addons, or a chamfered extrusion), extruded profiles (`ExtrudeGeometry` with bevel, `LatheGeometry` for anything turned), and real construction: frames, posts, beams, panels with seams, plinths, copings, flanges, handrails, steps with nosings.
- Break the perfection: slight irregularity in stone courses, planks that differ in width, a lean, a sag, chipped corners, vertex-noise displacement on rocks and terrain features. Seed it so it stays deterministic (`makeRng`/`hashStr`).
- Ground meeting objects: add footings, skirts of debris, puddles, worn paths, so nothing looks set down on a flat plane.
- Add human-scale detail sparingly and only where the structure would need it (bolts on joints, conduit to lamps, drains under spouts). The "no scatter creep" rule still holds: no filler crates or barrels.
- Far country: silhouettes that read as real landforms (eroded, layered, uneven), not cones or domes.

## Phase 2: Texture

- One texel density across the world (roughly 512 px per metre near the player, less far away). Check plank, brick and stone sizes against real ones.
- Every large surface gets macro variation (`addMacroVariation`) and a detail normal (`addDetailNormal`), so tiling can't be seen from any walkable spot.
- Grime that follows the geometry: AO-driven dirt in creases, lighter edge wear on exposed corners, vertical streaks under ledges, a damp/dark band at ground contact. Use vertex colour or a second-UV mask so it's baked, not per-pixel noise.
- Albedo stays physically plausible (no pure black or white, nothing over-saturated). Roughness is where materials should differ most: wet vs dry, polished metal vs rusted, worn path vs untrodden.
- Normals stay OpenGL-style (`verify:normals`); `aoMap` uses uv2.

## Phase 3: Light

- Tune the world's one sky/fog/PMREM function so ambient isn't flat: a sky that is brighter on the sun side, a warm or cool bounce that fits the ground colour, and fog that gives depth without washing out the colours.
- Contact shadowing where things meet the ground (baked AO blobs or vertex AO; no SSAO pass unless you prove it fits the budget).
- Lamps stay inside the existing `LampPool` with the same light count. Do not add lights.
- Exposure per world via the stage's `exposureFor`. Check that a bench lean-in still reads clearly. The table pieces must stay legible; realism never costs teaching clarity.

## Rules you must not break

- No change to site ids, `questId`, labels, layout JSON positions, colliders, bay envelopes (`verify:bench`), walkable cells, the flood fill, or any bench/table behaviour.
- No physical overlaps (`tools/lib/overlap.mjs`, 0.06 m).
- Budget at T4: ≤ 900k triangles, ≤ 566 draws (`node tools/perf-worlds.mjs <WORLD> ligar`). Report before/after numbers. Merge static (`mergeStatic`); only addressable or moving things are `noMerge`/`mover`.
- Textures uploaded and shaders compiled in `warmWorld`, never on first frame. Lower tiers get half-size textures (`texSize`) or the procedural fallback.
- DPR cap 1.5, no `backdrop-filter`, no pointer lock, no `depthWrite:false` on opaque materials, no new PointLights outside the pool.
- SCOURED PLATE: no neon, cyan, glow blooms or candy gradients. No signs in the world. No added UI text.
- Retire by archiving: old texture generators or meshes you replace move to `archive/<date>/` with a README. Never delete them.
- `dist/` is wiped by `npm run build`. If anything non-build is in `dist/` (e.g. `dist/art`), copy it out first.
- Don't touch other worlds or shared kit behaviour that other worlds depend on. If you improve a shared helper in `pbr-kit.js`, make it opt-in.

## Done means

1. `npm run verify:<WORLD>`, `npm run verify:bench`, `npm run verify:normals` and then the full `npm run verify` all pass. Paste the summary lines.
2. Perf numbers before/after, within budget.
3. After-screenshots taken from the same five viewpoints as the before-shots (`docs/images/realism-<WORLD>/after-*.png`), each with a one-line note on what changed.
4. `docs/plans/realism-<WORLD>.md` updated with what was done, what was left out and why, and any asset licences. Add a short entry under this world in `docs/engineering/engine-and-worlds.md` if you added a pipeline (e.g. a texture loader) that later worlds will reuse.
5. Don't commit. Tell the owner what changed and what's ready to review.
