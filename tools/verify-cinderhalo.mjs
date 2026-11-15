#!/usr/bin/env node
/**
 * verify:cinderhalo — Cinder Halo (unit14, nuclear chemistry).
 *
 *   1  the planners (`tools/lib/cinderhalo/data-checks.mjs`): elements, stable nuclides, decays, masses, binding energies, the grid, counts
 *   2  the benches: stage counts, text rules (prompt, briefing, hints, reward), scripted misses and solutions, every typed slip refused
 *      with a reason, glossary stages, the bank
 *   3  the site's declarations: the plan, the layout file, the arena spot, the landmarks
 *   4  the world built in Node and measured: bodies that share space, buried bodies, only lamps lit, the crater walls closed, a walk from
 *      the spawn to every bench and the Core's ground that never steps off a ledge, every guide route on the walk
 *   5  the shape the site must hold (`docs/plans/cinderhalo-world.md` section 6.8): bench ground spans 3 m or more, at least two thirds of
 *      the benches housed, no bench on another world's coordinates, not one circle, not two columns, at most two plates in view from
 *      the spawn, one floor, every cell at least 11.2 by 11 m with 4.4 m over the plate, covered, lit by its own lamps, and entered by a
 *      dog-leg (no straight line from the crater floor to the plate)
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });

const THREE = await import('three');
const PLAN = await import('../src/three/cinderhalo/site-plan.js');
const { CinderHaloWorld } = await import('../src/three/cinderhalo.js');
const { findOverlaps } = await import('./lib/overlap.mjs');
const SHAPE = await import('./lib/world-shape-checks.mjs');
const { BOSS_ARENA_SPOTS } = await import('../src/learn/engine/boss-arena.js');
const { runNucDataChecks } = await import('./lib/cinderhalo/data-checks.mjs');
const { UNIT_14 } = await import('../src/learn/worlds/unit14-nuclear-chemistry.js');
const GLOSS = await import('../src/learn/glossary/cinderhalo.js');
await import('../src/learn/table/kits/index.js');
const MODEL = await import('../src/learn/table/model.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const worldData = JSON.parse(readFileSync(join(root, 'src/three/world-data/cinderhalo.json'), 'utf8'));
const bank = JSON.parse(readFileSync(join(root, 'src/learn/bank/unit14.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => (cond ? ok(okMsg) : fail(failMsg || okMsg));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const words = s => String(s).trim().split(/\s+/).filter(Boolean).length;
const sentences = s => String(s).split(/(?<=[.?])\s+/).filter(x => x.trim()).length;

/* ------------------------------------------------------------ 1. planners */
console.log('Cinder Halo — planners\n');
runNucDataChecks({ ok, fail });

/* ------------------------------------------------------------ 2. benches */
console.log('\nCinder Halo — benches\n');
{
  const before = failures;
  let stages = 0; let built = 0; let slips = 0;
  for (const q of UNIT_14.quests) {
    if (!q.module) continue;
    built++;
    const mod = await q.module();
    const key = `unit14/${q.id}`;
    const boss = q.arena === 'boss';
    if (mod.STAGES.length !== q.stageCount || mod.meta.stageCount !== q.stageCount) fail(`${key}: ${mod.STAGES.length} stages, the chart says ${q.stageCount}`);
    if (!boss && (mod.STAGES.length < 6 || mod.STAGES.length > 8)) fail(`${key}: a bench has 6 to 8 stages`);
    if (boss && mod.STAGES.length !== 5) fail(`${key}: a boss has five phases`);
    if (!GLOSS.QUESTS.includes(q.id)) fail(`${key}: not in the glossary's quest list`);
    if (!boss && (!bank.bench[q.id] || bank.bench[q.id].problems.length !== 2)) fail(`${key}: the bank needs exactly two problems for it`);
    const t0s = [];
    const play = (st, script) => { let cur = MODEL.createTable(st.table, st.title); for (const step of script) for (const a of MODEL.expandStep(cur, step, 'direct')) cur = MODEL.apply(cur, a); return cur; };
    mod.STAGES.forEach((st, i) => {
      stages++;
      const at = `${key} stage ${i + 1}`;
      const prompt = String(st.prompt);
      if (words(prompt.replace(/ You predicted .*$/, '')) > 25) fail(`${at}: the prompt is over 25 words`);
      if (/!/.test(prompt)) fail(`${at}: the prompt has an exclamation mark`);
      if (/^(Set|Type|Lay|Drag|Tap|Press)\b/.test(prompt)) fail(`${at}: the prompt is an operation, not a question`);
      if (!/\?/.test(prompt.replace(/ You predicted .*$/, ''))) fail(`${at}: the prompt is not a question`);
      if (!Array.isArray(st.hints) || st.hints.length !== 3) fail(`${at}: needs exactly three hints`);
      for (const h of st.hints || []) if (sentences(h) !== 1) fail(`${at}: a hint is not one sentence: "${h}"`);
      if (st.briefing && sentences(st.briefing.body) > 2) fail(`${at}: the briefing is over two sentences`);
      const reward = st.reward;
      if (!reward || words(reward.body) > 40) fail(`${at}: the reward is over 40 words (${reward ? words(reward.body) : 0})`);
      if (reward && sentences(reward.body) > 2) fail(`${at}: the reward is over two sentences`);
      for (const text of [prompt, ...(st.hints || []), reward?.body || '', st.briefing?.body || '']) {
        for (const b of GLOSS.BANNED) if (b.re.test(text)) fail(`${at}: uses "${text.match(b.re)[0]}" (${b.why}); use ${b.use}`);
      }
      if (!st.predict) {
        const miss = st.check({ table: play(st, mod.MISSES[i]) });
        if (miss.ok || !miss.msg) fail(`${at}: the scripted miss is not refused with a reason`);
        if (miss.msg && reward && reward.title && miss.msg.includes(reward.title)) fail(`${at}: the miss names the reward`);
      }
      if (!st.check({ table: play(st, mod.SOLUTIONS[i]) }).ok) fail(`${at}: the scripted solution is refused`);
      t0s.push(st);
    });
    // Every typed slip a student is likely to make is refused, with a reason.
    for (const [n, values] of Object.entries(mod.SLIPS || {})) {
      const st = mod.STAGES[n - 1];
      if (!st.entry) continue;
      const base = mod.SOLUTIONS[n - 1].filter(s => !s.type);
      for (const v of values) {
        slips++;
        const r = st.check({ table: play(st, [...base, { type: { entry: st.entry.id, value: String(v) } }]) });
        if (r.ok || !r.msg) fail(`${key} stage ${n}: the slip ${v} is not refused with a reason`);
      }
    }
    // Every term the glossary gives this quest is said by the stage it names.
    for (const t of GLOSS.TERMS.filter(x => x.quest === q.id)) {
      const st = mod.STAGES[t.stage - 1];
      const said = st && [st.briefing?.body, st.reward?.body, st.prompt].some(x => x && t.re.test(String(x)));
      if (!said) fail(`${key}: the glossary says stage ${t.stage} first uses "${t.term}", and it does not`);
    }
  }
  if (failures === before) ok(`${built} built quest(s), ${stages} stages: counts, prompts, briefings, hints, rewards, banned words, scripted misses and solutions, ${slips} typed slips refused, glossary stages`);
}

/* ------------------------------------------------------------ 3. declarations */
console.log('\nCinder Halo — the site as declared\n');
{
  const clashes = [];
  for (const s of worldData.sites) {
    const plan = PLAN.HOST_PLAN[s.id];
    if (!plan || plan.structure !== s.structure || plan.questId !== s.questId || plan.label !== s.label) { clashes.push(`${s.id}: does not match the plan`); continue; }
    if (Math.hypot(s.pos[0] - plan.pos[0], s.pos[2] - plan.pos[1]) > 0.02) clashes.push(`${s.id}: stands off its planned place (re-run tools/gen-cinderhalo-layout.mjs)`);
    if (Boolean(s.built) !== existsSync(join(root, 'src/learn/quests/unit14', `${s.questId}.js`))) clashes.push(`${s.id}: built is ${s.built} but the quest module ${s.built ? 'is missing' : 'exists'} (re-run tools/gen-cinderhalo-layout.mjs)`);
    if (!UNIT_14.quests.find(q => q.id === s.questId)) clashes.push(`${s.id}: ${s.questId} is not on the chart`);
  }
  check(clashes.length === 0, `all ${worldData.sites.length} sites match the plan and say truly whether their bench is built`, clashes.join('; '));
  const L = worldData.landmarks; const hit = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (dist(L[i].pos, L[j].pos) < (L[i].radius || 1) + (L[j].radius || 1)) hit.push(`${L[i].asset} and ${L[j].asset}`);
  check(hit.length === 0, `${L.length} landmarks, every footprint disjoint`, `landmark overlaps: ${hit.join('; ')}`);
  const spot = BOSS_ARENA_SPOTS['boss-core'];
  check(spot && spot.worldId === 'unit14' && dist(spot.bossPos, worldData.arena.boss) < 0.01 && dist(spot.playerPos, worldData.arena.player) < 0.01 && Math.abs(spot.bossPos[1] - PLAN.PARTS.G.floor) < 0.01, 'the Core\'s arena spot matches cinderhalo.json and stands on the great crater\'s floor', 'boss-core arena spot mismatch');
  const G = PLAN.PARTS.G;
  check([worldData.arena.boss, worldData.arena.player].every(p => Math.hypot(p[0] - G.x, p[2] - G.z) < G.r - 2), 'the boss and the player stand on the great crater\'s level floor', 'the arena is off the great crater\'s floor');
  // The floors are flat and every step of a cutting is a grade a player can walk.
  let worst = 0; let steep = 0;
  for (const [, P] of Object.entries(PLAN.PARTS)) for (let a = 0; a < 6.28; a += 0.2) for (let r = 0; r < P.r; r += 1.5) {
    const x = P.x + Math.cos(a) * r; const z = P.z + Math.sin(a) * r;
    if (Math.hypot(x - PLAN.PAD[0], z - PLAN.PAD[1]) < PLAN.PAD_R + 1) continue;
    worst = Math.max(worst, Math.abs(PLAN.height(x, z) - P.floor));
  }
  for (const s of PLAN.CUT_SEGS) steep = Math.max(steep, Math.abs(s.fb - s.fa) / Math.hypot(s.bx - s.ax, s.bz - s.az));
  check(worst < 0.01 && steep < 0.2, `every crater floor is flat (worst ${worst.toFixed(3)} m) and the steepest cutting is a ${(steep * 100).toFixed(0)} % grade`, `floors off by ${worst.toFixed(2)} m or a cutting at ${(steep * 100).toFixed(0)} %`);
  check(!/\p{Extended_Pictographic}/u.test(JSON.stringify(worldData)), 'no emoji in the layout\'s strings');
}

/* ------------------------------------------------------------ 4. the built world */
console.log('\nCinder Halo — the world built in Node\n');
{
  const origBake = CinderHaloWorld.prototype.bakeStatics;
  CinderHaloWorld.prototype.bakeStatics = function () {};
  let w;
  try { w = new CinderHaloWorld(null); } finally { CinderHaloWorld.prototype.bakeStatics = origBake; }
  w.scene.updateMatrixWorld(true);
  let meshes = 0;
  w.scene.traverse(o => { if (o.isMesh) meshes++; });
  check(meshes > 150, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built`);
  const built = new Set(w.landmarkNodes.map(n => n.lm.asset));
  const declared = new Set(worldData.landmarks.map(l => l.asset));
  check([...declared].every(a => built.has(a)), `every declared landmark kind is built (${[...declared].join(', ')})`, `declared but not built: ${[...declared].filter(a => !built.has(a)).join(', ')}`);
  w.terrainMesh.geometry.computeBoundingBox();
  const tb = w.terrainMesh.geometry.boundingBox;
  check(Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z) > 800, 'the ground runs to the horizon on every side');
  {
    const pos = w.terrainMesh.geometry.attributes.position; let worst = 0;
    for (let i = 0; i < pos.count; i += 97) worst = Math.max(worst, Math.abs(pos.getY(i) - w.getTerrainHeight(pos.getX(i), pos.getZ(i))));
    check(worst < 1e-4, 'the drawn ground is the one height field the walk stands on', `the drawn ground is off the height field by ${worst.toFixed(3)} m`);
  }
  {
    const hits = findOverlaps(w.scene, { tolerance: 0.06, label: owner => owner.name || `${owner.type}#${owner.id}` });
    const pairs = new Map();
    for (const h of hits) { const k = [h.a, h.b].sort().join(' <-> '); if (!pairs.has(k) || pairs.get(k).depth < h.depth) pairs.set(k, h); }
    check(pairs.size === 0, `no two bodies share space — ${meshes} meshes measured`,
      `bodies occupy the same space:\n${[...pairs.entries()].slice(0, 12).map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`).join('\n')}`);
  }
  {
    const buried = [];
    const EXEMPT = new Set(['ground', 'ambient']);
    const tagOf = o => { for (let n = o; n; n = n.parent) if (n.userData?.phys) return n.userData.phys; return null; };
    const ownerName = o => { let n = o; while (n.parent && n.parent !== w.scene) n = n.parent; return n.name || n.type; };
    w.scene.traverse(o => {
      if (!o.isMesh || EXEMPT.has(tagOf(o))) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const box = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if (box.isEmpty()) return;
      const c = box.getCenter(new THREE.Vector3());
      const ground = w.getTerrainHeight(c.x, c.z);
      if (box.max.y < ground - 0.3 && buried.length < 10) buried.push(`${ownerName(o)} at (${c.x.toFixed(1)}, ${c.z.toFixed(1)}) tops out at ${box.max.y.toFixed(2)} under ground ${ground.toFixed(2)}`);
    });
    check(buried.length === 0, 'no body is buried under the ground it stands on', `buried:\n         ${buried.join('\n         ')}`);
  }
  {
    let threw = null;
    try { for (let f = 0; f < 3; f++) w.update(1 / 60, new THREE.Vector3(0, 1.6, 60)); } catch (err) { threw = err; }
    check(!threw, 'a frame updates with the eye handed in', `update threw: ${threw?.message}`);
  }
  let lights = 0;
  w.scene.traverse(o => { if (o.isPointLight || o.isSpotLight) lights++; });
  check(lights === 0 && w.lamps.length >= 30, `${w.lamps.length} lamps add no real lights to the scene`, `${w.lamps.length} lamps and ${lights} real lights: a lamp is its emissive mesh only (lamp-pool.js)`);
  {
    let bad = 0;
    w.scene.traverse(o => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) if (m && !m.transparent && m.depthWrite === false && o !== w.sky && !/sky|dome/i.test(o.name || '')) bad++;
    });
    check(bad === 0, 'no opaque material sets depthWrite off', `${bad} opaque materials set depthWrite off`);
  }
  let hostErrors = 0;
  for (const s of worldData.sites) {
    const anchor = w.benchAnchor(s.questId);
    if (!anchor) { hostErrors++; console.log(`  FAIL missing benchAnchor for ${s.questId}`); continue; }
    w.setBenchDeployed(s.questId, true); w.setBenchDeployed(s.questId, false);
    w.setSiteComplete(s.questId, true); w.setSiteComplete(s.questId, false);
  }
  check(hostErrors === 0, `all ${worldData.sites.length} hosts have anchors and toggle cleanly`);

  // The walk: flood fill on a half-metre grid from the spawn, with the player's radius, against the real colliders.
  const F = SHAPE.flood(w, { bound: PLAN.BOUND, spawn: worldData.spawn.pos, step: 0.6 });
  const targets = [['the landing pad', worldData.pad.pos], ['the Core\'s ground', worldData.arena.player], ...worldData.sites.map(s => [s.id, s.approachPos])];
  const missed = targets.filter(([, p]) => !F.reachable(p[0], p[2], 0.6)).map(t => t[0]);
  check(missed.length === 0, `a walk from the spawn reaches the pad, the Core's ground and all ${worldData.sites.length} bench approaches (${F.reached} cells)`, `unreachable: ${missed.join(', ')}`);
  check(F.ledges.length === 0, 'no step on the walk is a ledge (every neighbouring cell within 0.6 m)', `ledges: ${F.ledges.join('; ')}`);
  const edge = F.cells.filter(([x, z]) => Math.abs(x) > PLAN.BOUND - 1 || Math.abs(z) > PLAN.BOUND - 1).length;
  check(edge === 0, 'the walk never reaches the edge of the map', `${edge} reachable cells lie on the map's edge`);
  const offWalk = F.cells.filter(([x, z]) => PLAN.walkDistance(x, z).d > 0.6).length;
  check(offWalk === 0, `nowhere a player can stand is up a crater wall (${(w.walls || []).length} wall colliders)`, `${offWalk} reachable cells lie on a crater wall`);
  {
    const off = [];
    for (const s of [...worldData.sites, { id: 'the Core', route: worldData.arenaRoute }]) {
      const pts = s.route;
      for (let k = 0; k < pts.length - 1; k++) {
        const [ax, az] = pts[k]; const [bx, bz] = pts[k + 1];
        const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5);
        for (let t = 0; t <= n; t++) { const x = ax + (bx - ax) * (t / n); const z = az + (bz - az) * (t / n); if (!F.reachable(x, z, 0.45)) { off.push(`${s.id} near (${x.toFixed(1)}, ${z.toFixed(1)})`); break; } }
      }
    }
    check(off.length === 0, 'the guide\'s way to every bench and to the Core runs over walkable ground and in through each dog-leg', `the guide's way leaves the walk: ${off.slice(0, 6).join('; ')}`);
  }

  /* ---------------------------------------------------------- 5. the shape */
  console.log('\nCinder Halo — the shape the site holds\n');
  const span = SHAPE.benchGround(w);
  check(span.span >= 3, `bench ground spans ${span.span.toFixed(2)} m (${span.lo.toFixed(2)} to ${span.hi.toFixed(2)})`, `bench ground spans only ${span.span.toFixed(2)} m`);
  const H = SHAPE.housing(w, THREE);
  const housed = H.filter(h => h.housed).length;
  check(housed * 3 >= H.length * 2, `${housed} of ${H.length} benches are housed (${H.map(h => h.code).join(' ')})`, `only ${housed} of ${H.length} benches are housed`);
  check(H.every(h => h.closed >= 3), 'every bench stands in a working that closes at least three directions');
  check(!SHAPE.oneCircle(worldData), 'the benches are not on one circle', 'the benches stand on one circle');
  check(!SHAPE.twoColumns(worldData), 'the benches are not in two columns', 'the benches stand in two columns');
  const clones = SHAPE.sharedLayout(worldData);
  check(clones.length === 0, 'no bench stands on another world\'s coordinates', `benches on another world's coordinates: ${clones.join(', ')}`);
  const sp = worldData.spawn.pos;
  const inView = SHAPE.platesInView(w, THREE, [sp[0], w.getTerrainHeight(sp[0], sp[2]) + 1.6, sp[2]]);
  check(inView.length <= 2, `${inView.length} plate(s) in view from the spawn${inView.length ? ` (${inView.join(', ')})` : ''}`, `${inView.length} plates are in view from the spawn`);
  {
    const low = SHAPE.lowBodies(w, THREE, F.cells, { every: 4 });
    check(low.length === 0, 'one floor: nothing lower than 2.4 m over any ground a player can reach', `low bodies: ${low.join('; ')}`);
  }
  {
    const bodies = SHAPE.bodiesOf(w).filter(o => { for (let n = o; n; n = n.parent) if (n.userData?.phys === 'ground' || n.userData?.phys === 'ambient') return false; return true; });
    const ray = new THREE.Raycaster();
    const small = []; const unlit = []; const uncovered = []; const straight = [];
    for (const s of worldData.sites) {
      const plan = PLAN.HOST_PLAN[s.id];
      const [fx, fz] = plan.face;
      const y = PLAN.PARTS[plan.crater].floor;
      const reachTo = (dx, dz, from, h = 1.4) => { ray.far = 40; ray.set(new THREE.Vector3(from[0], y + h, from[1]), new THREE.Vector3(dx, 0, dz).normalize()); const hit = ray.intersectObjects(bodies, false)[0]; return hit ? hit.distance : 40; };
      const edge = PLAN.hostToWorld(plan, 0, 1.2);
      const across = reachTo(fz, -fx, edge) + reachTo(-fz, fx, edge);
      const side = PLAN.hostToWorld(plan, -4.2 * plan.mirror, 1.2);
      const depth = reachTo(-fx, -fz, side) + reachTo(fx, fz, side);
      ray.far = 30; ray.set(new THREE.Vector3(edge[0], y + 0.2, edge[1]), new THREE.Vector3(0, 1, 0));
      const up = ray.intersectObjects(bodies, false)[0];
      const head = up ? up.distance + 0.2 : 30;
      if (across < 11.2 || depth < 11 || head < 4.4) small.push(`${s.id}: ${across.toFixed(1)} m across, ${depth.toFixed(1)} m front to back, ${head.toFixed(1)} m overhead`);
      const anchor = w.benchAnchor(s.questId);
      const near = w.lamps.map(l => l.getWorldPosition(new THREE.Vector3())).filter(p => Math.hypot(p.x - anchor.position[0], p.z - anchor.position[2]) < 9 && Math.abs(p.y - y) < 7);
      if (near.length < 2) unlit.push(s.id);
      const cAp = w.cover.at(s.approachPos[0], y + 1.6, s.approachPos[2]); const cPl = w.cover.at(anchor.position[0], anchor.topY, anchor.position[2]);
      if (cAp.sun < 0.9 || cPl.sun < 0.9 || cAp.sky < 0.9) uncovered.push(`${s.id} (sun taken ${cAp.sun.toFixed(2)} at the mark)`);
      // The dog-leg: a straight line from outside the vestibule's opening to the plate meets concrete.
      const outside = PLAN.cellWay(plan)[0];
      const from = new THREE.Vector3(outside[0], y + 1.2, outside[1]);
      for (const lx of [-2.2, 0, 2.2]) {
        const to = new THREE.Vector3(anchor.position[0] + lx * fz, anchor.topY + 0.2, anchor.position[2] - lx * fx);
        const dir = to.clone().sub(from); const L = dir.length();
        ray.set(from, dir.normalize()); ray.far = L - 0.4;
        const hit = ray.intersectObjects(bodies, false)[0];
        if (!hit) { straight.push(s.id); break; }
      }
    }
    check(small.length === 0, 'every cell is at least 11.2 m across and 11 m front to back, with 4.4 m over the plate', `cells too small:\n         ${small.join('\n         ')}`);
    check(unlit.length === 0, 'every cell hangs at least two lamps of its own within 9 m of the plate', `cells short of lamps: ${unlit.join(', ')}`);
    check(uncovered.length === 0, 'every cell is inside a cover box, so the sun and sky do not light it', `cells not covered: ${uncovered.join(', ')}`);
    check(straight.length === 0, 'every cell is entered by a dog-leg: no straight line from outside its vestibule to its plate', `a straight line reaches the plate of: ${straight.join(', ')}`);
    const c0 = w.cover.at(worldData.spawn.pos[0], 1.6, worldData.spawn.pos[2]);
    check(c0.sun === 0 && c0.sky === 0, 'the spawn, on the open landing, is not covered');
  }
  {
    const posts = worldData.landmarks.filter(l => l.asset === 'lamp-post');
    const dark = worldData.sites.filter(s => !posts.some(p => Math.hypot(p.pos[0] - PLAN.cellWay(PLAN.HOST_PLAN[s.id])[0][0], p.pos[2] - PLAN.cellWay(PLAN.HOST_PLAN[s.id])[0][1]) < 6)).map(s => s.id);
    check(dark.length === 0 && posts.length >= PLAN.CUTS.length * 2, `${posts.length} lamp posts: one at each end of every cutting and one outside every vestibule`, `no lamp post outside the vestibule of ${dark.join(', ')}`);
  }
  w.dispose();
}

console.log(failures === 0 ? '\nALL CINDER HALO CHECKS PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
