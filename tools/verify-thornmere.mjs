#!/usr/bin/env node
/**
 * verify:thornmere — Thornmere (unit13, organic chemistry).
 *
 *   1  the planners (`tools/lib/thornmere/data-checks.mjs`): formulas, isomer identity, tests, pair places, mirror turns, scenes, arrows
 *   2  the benches: stage counts, text rules (prompt, briefing, hints, reward), every refused arrow has a reason, glossary and bank in step
 *   3  the site's declarations: the plan, the layout file, the arena spot
 *   4  the world built in Node and measured: bodies that share space, buried bodies, only lamps lit, the shore closed, a walk from the
 *      spawn to every bench and the gate that never enters the tar
 *   5  the shape the site must hold (`docs/plans/thornmere-world.md` section 6.8): bench ground spans 3 m or more, at least two thirds
 *      of the benches housed, no bench on another world's coordinates, not one circle, not two columns, at most two plates in view from
 *      the spawn, one floor, every room at least 11.2 by 11 m with 4.4 m over the plate, every room covered and lit by its own lamps
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });

const THREE = await import('three');
const PLAN = await import('../src/three/thornmere/site-plan.js');
const { ThornmereWorld } = await import('../src/three/thornmere.js');
const { findOverlaps } = await import('./lib/overlap.mjs');
const SHAPE = await import('./lib/world-shape-checks.mjs');
const { covered } = await import('../src/three/lib/cover.js');
const { BOSS_ARENA_SPOTS } = await import('../src/learn/engine/boss-arena.js');
const { runThornDataChecks } = await import('./lib/thornmere/data-checks.mjs');
const { UNIT_13 } = await import('../src/learn/worlds/unit13-organic.js');
const GLOSS = await import('../src/learn/glossary/thornmere.js');
await import('../src/learn/table/kits/index.js');
const MODEL = await import('../src/learn/table/model.js');
const { sceneOf, judgeArrow } = await import('../src/learn/engine/thorndata.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const worldData = JSON.parse(readFileSync(join(root, 'src/three/world-data/thornmere.json'), 'utf8'));
const bank = JSON.parse(readFileSync(join(root, 'src/learn/bank/unit13.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => (cond ? ok(okMsg) : fail(failMsg || okMsg));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const words = s => String(s).trim().split(/\s+/).filter(Boolean).length;
const sentences = s => String(s).split(/(?<=[.?])\s+/).filter(x => x.trim()).length;

/* ------------------------------------------------------------ 1. planners */
console.log('Thornmere — planners\n');
runThornDataChecks({ ok, fail });

/* ------------------------------------------------------------ 2. benches */
console.log('\nThornmere — benches\n');
{
  const before = failures;
  let stages = 0; let built = 0;
  for (const q of UNIT_13.quests) {
    if (!q.module) continue;
    built++;
    const mod = await q.module();
    const key = `unit13/${q.id}`;
    const boss = q.arena === 'boss';
    if (mod.STAGES.length !== q.stageCount || mod.meta.stageCount !== q.stageCount) fail(`${key}: ${mod.STAGES.length} stages, the chart says ${q.stageCount}`);
    if (!boss && (mod.STAGES.length < 6 || mod.STAGES.length > 8)) fail(`${key}: a bench has 6 to 8 stages`);
    if (boss && mod.STAGES.length !== 5) fail(`${key}: a boss has five phases`);
    if (!GLOSS.QUESTS.includes(q.id)) fail(`${key}: not in the glossary's quest list`);
    if (!bank.bench[q.id] || bank.bench[q.id].problems.length !== 2) fail(`${key}: the bank needs exactly two problems for it`);
    mod.STAGES.forEach((st, i) => {
      stages++;
      const at = `${key} stage ${i + 1}`;
      const prompt = String(st.prompt);
      if (words(prompt.replace(/ You predicted .*$/, '')) > 25) fail(`${at}: the prompt is over 25 words`);
      if (/!/.test(prompt)) fail(`${at}: the prompt has an exclamation mark`);
      if (/^(Set|Type|Lay|Drag|Tap|Press)\b/.test(prompt)) fail(`${at}: the prompt is an operation, not a question`);
      if (!Array.isArray(st.hints) || st.hints.length !== 3) fail(`${at}: needs exactly three hints`);
      for (const h of st.hints || []) if (sentences(h) !== 1) fail(`${at}: a hint is not one sentence: "${h}"`);
      if (st.briefing && sentences(st.briefing.body) > 2) fail(`${at}: the briefing is over two sentences`);
      const reward = st.reward;
      if (!reward || words(reward.body) > 40) fail(`${at}: the reward is over 40 words (${reward ? words(reward.body) : 0})`);
      if (reward && sentences(reward.body) > 2) fail(`${at}: the reward is over two sentences`);
      for (const text of [prompt, ...(st.hints || []), reward?.body || '', st.briefing?.body || '']) {
        for (const b of GLOSS.BANNED) if (b.re.test(text)) fail(`${at}: uses "${text.match(b.re)[0]}" (${b.why}); use ${b.use}`);
      }
      // The scripted miss is refused with words; the scripted solution passes.
      const t0 = MODEL.createTable(st.table, st.title);
      const play = script => { let cur = t0; for (const step of script) for (const a of MODEL.expandStep(cur, step, 'direct')) cur = MODEL.apply(cur, a); return cur; };
      if (!st.predict) {
        const miss = st.check({ table: play(mod.MISSES[i]) });
        if (miss.ok || !miss.msg) fail(`${at}: the scripted miss is not refused with a reason`);
        if (miss.msg && reward && reward.title && miss.msg.includes(reward.title)) fail(`${at}: the miss names the reward`);
      }
      if (!st.check({ table: play(mod.SOLUTIONS[i]) }).ok) fail(`${at}: the scripted solution is refused`);
    });
    // Every arrow a student is likely to draw wrongly is refused, with a reason that is not the generic one alone.
    for (const [n, slips] of Object.entries(mod.SLIPS || {})) {
      const view = mod.ARROW_VIEWS[n];
      const S = sceneOf(view.props.scene);
      for (const [src, dst] of slips) {
        const j = judgeArrow(S, src || view.props.arrow.srcFixed, dst || view.props.arrow.dstFixed, view.props.arrow.right, view.props.arrow.wrongs || []);
        if (j.ok || !j.msg) fail(`${key} stage ${n}: the arrow ${src} to ${dst} is not refused with a reason`);
      }
    }
    // Every term the glossary gives this quest is said by the stage it names.
    for (const t of GLOSS.TERMS.filter(x => x.quest === q.id)) {
      const st = mod.STAGES[t.stage - 1];
      const said = st && [st.briefing?.body, st.reward?.body, st.prompt].some(x => x && t.re.test(String(x)));
      if (!said) fail(`${key}: the glossary says stage ${t.stage} first uses "${t.term}", and it does not`);
    }
  }
  if (failures === before) ok(`${built} built quest(s), ${stages} stages: counts, prompts, briefings, hints, rewards, banned words, scripted misses and solutions, refused arrows, glossary stages`);
}

/* ------------------------------------------------------------ 3. declarations */
console.log(`\nThornmere — the site as declared\n`);
{
  const clashes = [];
  for (const s of worldData.sites) {
    const plan = PLAN.HOST_PLAN[s.id];
    if (!plan || plan.structure !== s.structure || plan.questId !== s.questId || plan.label !== s.label) { clashes.push(`${s.id}: does not match the plan`); continue; }
    if (Math.hypot(s.pos[0] - plan.pos[0], s.pos[2] - plan.pos[1]) > 0.02) clashes.push(`${s.id}: stands off its planned place (re-run tools/gen-thornmere-layout.mjs)`);
    if (Boolean(s.built) !== existsSync(join(root, 'src/learn/quests/unit13', `${s.questId}.js`))) clashes.push(`${s.id}: built is ${s.built} but the quest module ${s.built ? 'is missing' : 'exists'} (re-run tools/gen-thornmere-layout.mjs)`);
    const chart = UNIT_13.quests.find(q => q.id === s.questId);
    if (!chart) clashes.push(`${s.id}: ${s.questId} is not on the chart`);
  }
  check(clashes.length === 0, `all ${worldData.sites.length} sites match the plan and say truly whether their bench is built`, clashes.join('; '));
  const L = worldData.landmarks; const hit = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (dist(L[i].pos, L[j].pos) < (L[i].radius || 1) + (L[j].radius || 1)) hit.push(`${L[i].asset} and ${L[j].asset}`);
  check(hit.length === 0, `${L.length} landmarks, every footprint disjoint`, `landmark overlaps: ${hit.join('; ')}`);
  const spot = BOSS_ARENA_SPOTS['boss-carapace'];
  check(spot && spot.worldId === 'unit13' && dist(spot.bossPos, worldData.arena.boss) < 0.01 && dist(spot.playerPos, worldData.arena.player) < 0.01, 'the Carapace\'s arena spot matches thornmere.json', 'boss-carapace arena spot mismatch');
  const gate = PLAN.MOUNDS.M7;
  check([worldData.arena.boss, worldData.arena.player].every(p => Math.hypot(p[0] - gate.x, p[2] - gate.z) < gate.r - PLAN.EDGE_IN - 2), 'the boss and the player stand on the level top of the gate mound', 'the arena is off the gate mound\'s level top');
  const strings = JSON.stringify(worldData);
  check(!/\p{Extended_Pictographic}/u.test(strings), 'no emoji in the layout\'s strings');
}

/* ------------------------------------------------------------ 4. the built world */
console.log('\nThornmere — the world built in Node\n');
{
  const origBake = ThornmereWorld.prototype.bakeStatics;
  ThornmereWorld.prototype.bakeStatics = function () {};
  let w;
  try { w = new ThornmereWorld(null); } finally { ThornmereWorld.prototype.bakeStatics = origBake; }
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
  // The mesh is the height field: sample it at its own vertices.
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
    try { for (let f = 0; f < 3; f++) w.update(1 / 60, new THREE.Vector3(0, 2.1, 46)); } catch (err) { threw = err; }
    check(!threw, 'a frame updates with the eye handed in', `update threw: ${threw?.message}`);
  }
  let lights = 0;
  w.scene.traverse(o => { if (o.isPointLight || o.isSpotLight) lights++; });
  check(lights <= 3, `only pooled lamps are lit (${lights} point lights for ${w.lamps.length} lamps)`, `${lights} point lights`);
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

  // The walk: flood fill on a half-metre grid from the spawn, with the player's radius.
  const R = 0.25;
  const blocked = (x, z) => w.colliders.some(c => (c.radius !== undefined ? Math.hypot(x - c.x, z - c.z) < c.radius + R : x > c.minX - R && x < c.maxX + R && z > c.minZ - R && z < c.maxZ + R));
  const STEP = 0.5; const N = Math.round((2 * PLAN.BOUND) / STEP);
  const at = i => -PLAN.BOUND + i * STEP; const ix = v => Math.round((v + PLAN.BOUND) / STEP);
  const seen = new Uint8Array((N + 1) * (N + 1));
  const start = [ix(worldData.spawn[0]), ix(worldData.spawn[2])];
  const q = [start]; seen[start[1] * (N + 1) + start[0]] = 1;
  const cells = [];
  let lowest = Infinity; let edge = 0;
  while (q.length) {
    const [i, j] = q.pop();
    const x = at(i); const z = at(j);
    cells.push([x, z]);
    lowest = Math.min(lowest, w.getTerrainHeight(x, z));
    if (i === 0 || j === 0 || i === N || j === N) edge++;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di; const nj = j + dj;
      if (ni < 0 || nj < 0 || ni > N || nj > N || seen[nj * (N + 1) + ni]) continue;
      if (blocked(at(ni), at(nj))) continue;
      seen[nj * (N + 1) + ni] = 1; q.push([ni, nj]);
    }
  }
  const reach = (x, z) => seen[ix(z) * (N + 1) + ix(x)] === 1;
  const targets = [['the landing pad', worldData.pad.pos[0], worldData.pad.pos[2]], ['the gate\'s ground', worldData.arena.player[0], worldData.arena.player[2]], ...worldData.sites.map(s => [s.id, s.approachPos[0], s.approachPos[2]])];
  const missed = targets.filter(([, x, z]) => !reach(x, z)).map(t => t[0]);
  check(missed.length === 0, `a walk from the spawn reaches the pad, the gate's ground and all ${worldData.sites.length} bench approaches (${cells.length} cells)`, `unreachable: ${missed.join(', ')}`);
  check(lowest > PLAN.TAR_LEVEL + 0.05, `nowhere a player can stand is in the tar (lowest ground reached ${lowest.toFixed(2)} m, tar at ${PLAN.TAR_LEVEL})`, `the walk reaches ground at ${lowest.toFixed(2)} m, under the tar`);
  check(edge === 0, 'the walk never reaches the edge of the map', `${edge} reachable cells lie on the map's edge`);
  check((w.shore || []).length > 600, `the shore is a chain of ${(w.shore || []).length} colliders`, 'the shore is open');
  // Every step of the guide's way to a bench is walkable ground, door included.
  {
    const off = [];
    for (const s of worldData.sites) {
      const pts = s.route;
      for (let k = 0; k < pts.length - 1; k++) {
        const [ax, az] = pts[k]; const [bx, bz] = pts[k + 1];
        const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 1.0);
        for (let t = 0; t <= n; t++) { const x = ax + (bx - ax) * (t / n); const z = az + (bz - az) * (t / n); if (!reach(x, z)) { off.push(`${s.id} near (${x.toFixed(0)}, ${z.toFixed(0)})`); break; } }
      }
    }
    check(off.length === 0, 'the guide\'s way to every bench runs over walkable ground and in through the door', `the guide's way leaves the walk: ${off.join('; ')}`);
  }

  /* ---------------------------------------------------------- 5. the shape */
  console.log('\nThornmere — the shape the site holds\n');
  const span = SHAPE.benchGroundSpan(w);
  check(span.span >= 3, `bench ground spans ${span.span.toFixed(2)} m (${span.lo.toFixed(2)} to ${span.hi.toFixed(2)})`, `bench ground spans only ${span.span.toFixed(2)} m`);
  const H = SHAPE.housing(THREE, w);
  const housed = H.filter(h => h.housed).length;
  check(housed * 3 >= H.length * 2, `${housed} of ${H.length} benches are housed (${H.map(h => `${h.roof ? 'R' : '-'}${h.closed}`).join(' ')})`, `only ${housed} of ${H.length} benches are housed`);
  check(H.every(h => h.closed >= 3), 'every bench stands in a working that closes at least three directions');
  check(!SHAPE.onOneCircle(w), 'the benches are not on one circle', 'the benches stand on one circle');
  check(!SHAPE.inTwoColumns(w), 'the benches are not in two columns', 'the benches stand in two columns');
  const clones = SHAPE.clonedCoordinates(w);
  check(clones.length === 0, 'no bench stands on another world\'s coordinates', `benches on another world's coordinates: ${clones.join(', ')}`);
  const inView = SHAPE.platesInView(THREE, w);
  check(inView.length <= 2, `${inView.length} plate(s) in view from the spawn${inView.length ? ` (${inView.join(', ')})` : ''}`, `${inView.length} plates are in view from the spawn`);
  {
    // One floor: nothing lower than 2 m over any ground a player can reach, apart from the benches themselves and machines' own parts
    // that the colliders already keep the player out from under.
    const low = SHAPE.lowOverhead(THREE, w, cells.filter((_, k) => k % 3 === 0), { low: 2.0 });
    check(low.length === 0, 'one floor: nothing hangs lower than 2 m over ground a player can reach', `${low.length} reachable places lie under a body lower than 2 m, first at (${low[0]?.join(', ')})`);
  }
  {
    // A room's size, measured from inside: across the plate, front to back, and over the plate's front edge.
    const bodies = SHAPE.bodiesOf(w).filter(o => { for (let n = o; n; n = n.parent) if (n.userData?.phys === 'ground' || n.userData?.phys === 'ambient') return false; return true; });
    const ray = new THREE.Raycaster();
    const small = []; const unlit = []; const uncovered = [];
    for (const s of worldData.sites) {
      const plan = PLAN.HOST_PLAN[s.id];
      const [fx, fz] = plan.face;
      const [cx, cz] = plan.centre;
      const y = w.getTerrainHeight(cx, cz);
      const reachTo = (dx, dz, from = [cx, cz], h = 1.4) => { ray.far = 40; ray.set(new THREE.Vector3(from[0], y + h, from[1]), new THREE.Vector3(dx, 0, dz).normalize()); const hit = ray.intersectObjects(bodies, false)[0]; return hit ? hit.distance : 40; };
      // Across the room at the plate's front edge, both ways, from the middle.
      const edge = PLAN.hostToWorld(plan, 0, 1.2);
      const across = reachTo(fz, -fx, edge) + reachTo(-fz, fx, edge);
      const back = reachTo(-fx, -fz, PLAN.hostToWorld(plan, 4.2, 1.2));
      const front = reachTo(fx, fz, PLAN.hostToWorld(plan, 4.2, 1.2));
      const depth = back + front;
      ray.far = 30; ray.set(new THREE.Vector3(edge[0], y + 0.2, edge[1]), new THREE.Vector3(0, 1, 0));
      const up = ray.intersectObjects(bodies, false)[0];
      const head = up ? up.distance + 0.2 : 30;
      if (across < 11.2 || depth < 11 || head < 4.4) small.push(`${s.id}: ${across.toFixed(1)} m across, ${depth.toFixed(1)} m front to back, ${head.toFixed(1)} m overhead`);
      const anchor = w.benchAnchor(s.questId);
      const near = w.lamps.map(l => l.getWorldPosition(new THREE.Vector3())).filter(p => Math.hypot(p.x - anchor.position[0], p.z - anchor.position[2]) < 9);
      if (near.length < 2) unlit.push(s.id);
      if (!covered(w.coverBoxes, [s.approachPos[0], y + 1.6, s.approachPos[2]]) || !covered(w.coverBoxes, [anchor.position[0], anchor.topY, anchor.position[2]])) uncovered.push(s.id);
    }
    check(small.length === 0, 'every room is at least 11.2 m across and 11 m front to back, with 4.4 m over the plate', `rooms too small:\n         ${small.join('\n         ')}`);
    check(unlit.length === 0, 'every room hangs at least two lamps of its own within 9 m of the plate', `rooms short of lamps: ${unlit.join(', ')}`);
    check(uncovered.length === 0, 'every room is inside a cover box, so the sun and sky do not light it', `rooms not covered: ${uncovered.join(', ')}`);
  }
  {
    // A lamp stands by every door and at both ends of every ridge.
    const posts = worldData.landmarks.filter(l => l.asset === 'lamp-post');
    const dark = worldData.sites.filter(s => !posts.some(p => Math.hypot(p.pos[0] - s.approachPos[0], p.pos[2] - s.approachPos[2]) < 16)).map(s => s.id);
    check(dark.length === 0 && posts.length >= PLAN.RIDGES.length * 2, `${posts.length} lamp posts: one at each end of every ridge and one by every door`, `no lamp post near the door of ${dark.join(', ')}`);
  }
  w.dispose();
}

console.log(failures === 0 ? '\nALL THORNMERE CHECKS PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
