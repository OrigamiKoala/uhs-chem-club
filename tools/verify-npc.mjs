#!/usr/bin/env node
/**
 * verify-npc.mjs — the crews (docs/plans/npc-plan.md). Headless: builds every Learn world that has a crew
 * (`src/npc/crews.js`) with no renderer, runs the same crew simulation the game runs (`src/npc/crew-sim.js`)
 * on each, and reads the built models. Checks 1-5 run per world.
 *
 *  1. Posts: clear ground on the main level, outside every bench's bay, off the boss arena, reachable
 *     from the spawn, and no two closer than 2 m.
 *  2. Every schedule leg has a walk.
 *  3. Ten world-minutes at 30 Hz with a player wandering among the posts: nobody stands in a collider, a
 *     bay, the arena or on ground steeper than the walk allows, no two people closer than their bodies allow (0.06 m tolerance, as tools/lib/overlap.mjs),
 *     nobody waits longer than 12 s at a stretch, everybody reaches every stop of their schedule.
 *  4. Lines: each at most 25 words; no digits; none of the words the story bible bans from narrative or
 *     that give an atom a motive.
 *  5. Tasks and unlocks name real things: the giver, the item spot (clear and reachable), the benches
 *     (that world's quest ids) and clues (`CLUES`); every task's note resolves in the lore notebook;
 *     ids are unique across worlds.
 *  6. Nothing under src/npc or src/three/npc pays XP or grades.
 *  7. Models: every body and clip file exists; each body stands 1.5-2.0 m; every clip a member uses is
 *     there, binds to the body's bones, and keeps the ankles on the ground through a walk.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const { CREW_WORLDS, walkFor, keepOffFor, simPostsOf } = await import('../src/npc/crews.js');
const { allLines } = await import('../src/npc/talk.js');
const { NPC_MODELS, NPC_MODEL_DIR, npcModel } = await import('../src/npc/models.js');
const { CLUES } = await import('../src/story/saga.js');
const { getLore } = await import('../src/story/lore.js');
const { loadNpcGlb, THREE } = await import('./lib/npc-gltf.mjs');

// Between grid cells the ground may read a little steeper than the grid's 0.3 m step (a mound's flank,
// 36° at worst); a terrace edge or a wall face reads over a metre. The walk checks allow 0.15 m over.
const STEP_TOL = 0.15;

let failures = 0;
const check = (cond, okMsg, failMsg) => {
  if (cond) console.log(`  ok   ${okMsg}`);
  else { failures++; console.log(`  FAIL ${failMsg}`); }
};

const only = process.argv[2] || null;
// World modules load before bench-bay.js: some worlds' station files sit in an import cycle with it.
const worlds = [];
for (const w of CREW_WORLDS) {
  if (only && w.key !== only) continue;
  const mod = await import(`../src/three/${w.module}.js`);
  worlds.push({ ...w, World: mod[w.className] });
}
const { bayBoxes } = await import('../src/three/bench-bay.js');
const { WalkGrid, CrewSim, bayRects, CREW_RADIUS } = await import('../src/npc/crew-sim.js');

for (const W of worlds) {
const { crew: CREW, posts: POSTS, tasks: TASKS } = W;
const world = new W.World(null);
const bays = bayRects(world, bayBoxes);
const t0 = Date.now();
const grid = new WalkGrid(world, bays, walkFor(W.key, world));
const gridMs = Date.now() - t0;
const posts = simPostsOf(POSTS);
const sp = world.data.spawn.pos || world.data.spawn;
const spawn = [sp[0], sp[2]];
const KEEP_OFF = keepOffFor(world);
const inKeepOff = (x, z, pad = 0) => KEEP_OFF.some(k => Math.hypot(x - k.x, z - k.z) < k.radius + pad);
const where = `${W.key}: `;

console.log(`npc: ${W.key} posts (walk grid ${grid.NI}x${grid.NJ}, ${gridMs} ms)`);
{
  const bad = [];
  const ids = Object.keys(POSTS);
  for (const id of ids) {
    const [x, z] = POSTS[id].pos;
    if (grid.blockedAt(x, z, 0.6)) bad.push(`${id} is not clear ground (0.6 m) or not walkable`);
    if (inKeepOff(x, z, 1)) bad.push(`${id} is on the boss arena`);
    if (!grid.path(spawn, [x, z])) bad.push(`${id} cannot be reached from the spawn`);
  }
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = POSTS[ids[i]].pos, b = POSTS[ids[j]].pos;
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 2) bad.push(`${ids[i]} and ${ids[j]} are under 2 m apart`);
  }
  check(!bad.length, `${where}${ids.length} posts clear, off the arena, reachable, spread out (${bays.length} bay volumes closed)`, where + bad.join('\n         '));
  const used = new Set(CREW.flatMap(c => c.schedule.map(s => s.post)));
  const unknown = [...used].filter(p => !POSTS[p]);
  check(!unknown.length, `${where}every schedule stop is a declared post`, `${where}unknown posts: ${unknown.join(', ')}`);
  const shared = CREW.flatMap(c => c.schedule.map(s => s.post)).filter((p, i, a) => a.indexOf(p) !== i);
  check(!shared.length, `${where}no post is in two schedules`, `${where}posts in two schedules: ${[...new Set(shared)].join(', ')}`);
}

console.log(`npc: ${W.key} legs`);
{
  const bad = [];
  let n = 0;
  for (const c of CREW) {
    for (let i = 0; i < c.schedule.length; i++) {
      const a = POSTS[c.schedule[i].post]?.pos, b = POSTS[c.schedule[(i + 1) % c.schedule.length].post]?.pos;
      if (!a || !b) continue;
      n++;
      const p = grid.path(a, b);
      if (!p) { bad.push(`${c.id}: ${c.schedule[i].post} -> ${c.schedule[(i + 1) % c.schedule.length].post}`); continue; }
      for (let k = 1; k < p.length; k++) if (!grid.clearLine(p[k - 1], p[k], CREW_RADIUS, STEP_TOL)) bad.push(`${c.id}: leg ${i} segment ${k} crosses a wall or bay`);
      for (const q of p) if (inKeepOff(q[0], q[1])) { bad.push(`${c.id}: leg ${i} crosses the boss arena`); break; }
    }
  }
  check(!bad.length, `${where}${n} schedule legs walk clear`, where + bad.join('\n         '));
}

console.log(`npc: ${W.key} ten minutes`);
{
  const sim = new CrewSim(grid, CREW, posts, { seed: 11 });
  const dt = 1 / 30;
  const player = { x: spawn[0], z: spawn[1] };
  const ppath = { pts: null, i: 0, pause: 3 };
  const postList = Object.values(POSTS).map(p => p.pos);
  let pick = 3;
  const reached = new Map(CREW.map(c => [c.id, new Set()]));
  const waits = new Map(CREW.map(c => [c.id, 0]));
  const problems = [];
  const note = msg => { if (problems.length < 12 && !problems.includes(msg)) problems.push(msg); };
  let worstGap = Infinity, maxWait = 0;
  for (let t = 0; t < 600; t += dt) {
    // The player walks post to post at 1.4 m/s and stands a few seconds at each.
    if (ppath.pause > 0) ppath.pause -= dt;
    else if (!ppath.pts) {
      pick = (pick * 7 + 3) % postList.length;
      const to = postList[pick];
      ppath.pts = grid.path([player.x, player.z], [to[0] + 1.2, to[1] + 1.2]);
      ppath.i = 1;
      if (!ppath.pts) ppath.pause = 1;
    } else {
      const tgt = ppath.pts[ppath.i];
      const dx = tgt[0] - player.x, dz = tgt[1] - player.z, d = Math.hypot(dx, dz);
      const go = Math.min(d, 1.4 * dt);
      if (d > 1e-6) { player.x += dx / d * go; player.z += dz / d * go; }
      if (d < 0.05 && ++ppath.i >= ppath.pts.length) { ppath.pts = null; ppath.pause = 2 + (pick % 5); }
    }
    sim.update(dt, player);
    for (const m of sim.members) {
      if (grid.blockedAt(m.x, m.z, CREW_RADIUS - 0.06, STEP_TOL)) note(`${m.id} stands in a wall, a bay or off the walk at [${m.x.toFixed(2)}, ${m.z.toFixed(2)}] (t=${t.toFixed(1)})`);
      if (m.state === 'act') reached.get(m.id).add(m.leg);
      const w = m.state === 'walk' && m.speed === 0 ? waits.get(m.id) + dt : 0;
      waits.set(m.id, w);
      maxWait = Math.max(maxWait, w);
      if (w > 12) note(`${m.id} has waited ${w.toFixed(1)} s at [${m.x.toFixed(1)}, ${m.z.toFixed(1)}]`);
    }
    for (let i = 0; i < sim.members.length; i++) for (let j = i + 1; j < sim.members.length; j++) {
      const a = sim.members[i], b = sim.members[j];
      const gap = Math.hypot(a.x - b.x, a.z - b.z);
      worstGap = Math.min(worstGap, gap);
      if (gap < 2 * CREW_RADIUS - 0.06) note(`${a.id} and ${b.id} overlap (${gap.toFixed(2)} m, t=${t.toFixed(1)})`);
    }
  }
  check(!problems.length, `${where}${CREW.length} people, 600 s: nobody in a wall or bay, closest pair ${worstGap.toFixed(2)} m, longest wait ${maxWait.toFixed(1)} s`, where + problems.join('\n         '));
  const missed = CREW.filter(c => reached.get(c.id).size < c.schedule.length).map(c => `${c.id} reached ${reached.get(c.id).size}/${c.schedule.length}`);
  check(!missed.length, `${where}everyone works every stop of their schedule`, where + missed.join(', '));
}

console.log(`npc: ${W.key} lines`);
{
  const BANNED = /\b(level|levels|button|game|games|quest|quests|menu|user|click|player|happy|wants?|wanted|xp|points)\b/i;
  const bad = [];
  const lines = allLines(CREW, TASKS);
  for (const { who, l } of lines) {
    const words = l.trim().split(/\s+/).length;
    if (words > 25) bad.push(`${who}: ${words} words: "${l}"`);
    if (/\d/.test(l)) bad.push(`${who}: a digit: "${l}"`);
    const m = l.match(BANNED);
    if (m) bad.push(`${who}: "${m[0]}" in "${l}"`);
  }
  for (const c of CREW) {
    for (const set of c.talk?.default || []) if (set.length < 1 || set.length > 3) bad.push(`${c.id}: a line set of ${set.length}`);
    if (!c.name || !c.role) bad.push(`${c.id}: no name or role`);
  }
  check(!bad.length, `${where}${lines.length} lines, each at most 25 words, no digits, no banned words`, where + bad.join('\n         '));
}

console.log(`npc: ${W.key} tasks and unlocks`);
{
  const bad = [];
  const quests = new Set(world.data.sites.map(s => s.questId));
  for (const c of CREW) {
    for (const q of Object.keys(c.talk?.afterBench || {})) if (!quests.has(q)) bad.push(`${c.id}: afterBench ${q} is not a bench here`);
    for (const k of Object.keys(c.talk?.afterClue || {})) if (!CLUES[k]) bad.push(`${c.id}: afterClue ${k} is not a clue`);
    if (c.task && !TASKS[c.task]) bad.push(`${c.id}: task ${c.task} undeclared`);
    if (!npcModel(c.model)) bad.push(`${c.id}: model ${c.model} undeclared`);
  }
  const models = CREW.map(c => c.model);
  const twice = models.filter((m, i) => models.indexOf(m) !== i);
  if (twice.length) bad.push(`the same body twice on one world: ${twice.join(', ')}`);
  for (const t of Object.values(TASKS)) {
    if (t.worldId !== W.worldId) bad.push(`${t.id}: worldId ${t.worldId}, expected ${W.worldId}`);
    const giver = CREW.find(c => c.id === t.giver);
    if (!giver || giver.task !== t.id) bad.push(`${t.id}: giver ${t.giver} does not hold it`);
    const [x, z] = t.item.pos;
    if (grid.blockedAt(x, z, 0.5)) bad.push(`${t.id}: item spot is not clear ground`);
    if (inKeepOff(x, z, 1)) bad.push(`${t.id}: item spot is on the boss arena`);
    if (!grid.path(spawn, [x, z])) bad.push(`${t.id}: item spot unreachable`);
    if (!getLore(`crew:${t.id}`)) bad.push(`${t.id}: crew:${t.id} does not resolve in story/lore.js`);
  }
  check(!bad.length, `${where}${Object.keys(TASKS).length} task(s) and every unlock name real things`, where + bad.join('\n         '));
}
world.dispose?.();
}

console.log('npc: across worlds');
{
  const bad = [];
  const ids = CREW_WORLDS.flatMap(w => w.crew.map(c => c.id));
  const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupIds.length) bad.push(`member ids used twice: ${dupIds.join(', ')}`);
  const tids = CREW_WORLDS.flatMap(w => Object.keys(w.tasks));
  const dupT = tids.filter((id, i) => tids.indexOf(id) !== i);
  if (dupT.length) bad.push(`task ids used twice: ${dupT.join(', ')}`);
  const names = CREW_WORLDS.flatMap(w => w.crew.map(c => c.name));
  const dupN = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupN.length) bad.push(`names used twice: ${dupN.join(', ')}`);
  const withoutTask = CREW_WORLDS.filter(w => Object.keys(w.tasks).length !== 1).map(w => w.key);
  if (withoutTask.length) bad.push(`worlds without exactly one task: ${withoutTask.join(', ')}`);
  check(!bad.length, `${CREW_WORLDS.length} worlds, ${ids.length} people, unique ids, names and tasks`, bad.join('\n         '));
}

console.log('npc: no XP');
{
  const dirs = ['src/npc', 'src/three/npc'].map(d => join(root, d)).filter(existsSync);
  const bad = [];
  for (const d of dirs) for (const f of readdirSync(d, { recursive: true })) {
    if (!/\.m?js$/.test(f)) continue;
    const src = readFileSync(join(d, f), 'utf8');
    if (/addXp|gradeStage|completeQuest/.test(src)) bad.push(f);
  }
  check(!bad.length, 'nothing in the crew code pays XP or grades', `XP or grading in: ${bad.join(', ')}`);
}

console.log('npc: models');
{
  const dir = join(root, 'public', NPC_MODEL_DIR);
  const manifestPath = join(dir, 'manifest.json');
  const missing = [];
  for (const m of NPC_MODELS) for (const f of [`${m.id}.glb`, `${m.id}.lite.glb`]) if (!existsSync(join(dir, f))) missing.push(f);
  for (const f of ['clips-m.glb', 'clips-f.glb', 'manifest.json', 'LICENSE-rocketbox.txt']) if (!existsSync(join(dir, f))) missing.push(f);
  check(!missing.length, `${NPC_MODELS.length} bodies (desktop and handset), two clip files, manifest and licence present`, `missing: ${missing.join(', ')}`);
  if (!missing.length) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const used = new Set(['walk', 'walkSlow', 'talk', ...CREW_WORLDS.flatMap(w => w.crew.flatMap(c => c.schedule.map(s => s.act)))]);
    const clipFiles = {};
    for (const sk of ['m', 'f']) clipFiles[sk] = await loadNpcGlb(join(dir, `clips-${sk}.glb`));
    const bad = [];
    let heaviest = 0;
    for (const m of NPC_MODELS) {
      for (const f of [`${m.id}.glb`, `${m.id}.lite.glb`]) heaviest = Math.max(heaviest, statSync(join(dir, f)).size);
      const body = await loadNpcGlb(join(dir, `${m.id}.glb`));
      const scene = body.scene;
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(scene, true);
      const h = box.max.y - box.min.y;
      if (h < 1.5 || h > 2.0 || Math.abs(box.min.y) > 0.05) bad.push(`${m.id}: stands ${h.toFixed(2)} m from y ${box.min.y.toFixed(2)}`);
      const names = new Set();
      scene.traverse(o => names.add(o.name));
      const clips = clipFiles[m.skeleton].animations;
      for (const name of used) {
        const clip = clips.find(c => c.name === name);
        if (!clip) { bad.push(`${m.id}: clip ${name} missing from clips-${m.skeleton}`); continue; }
        const unbound = clip.tracks.filter(t => !names.has(t.name.split('.')[0]));
        if (unbound.length) bad.push(`${m.id}: ${unbound.length} tracks of ${name} bind to nothing`);
        if (!manifest.clips?.[m.skeleton]?.[name]) bad.push(`${m.id}: ${name} not in the manifest`);
      }
      // Ankles on the ground through a walk cycle.
      const walk = clips.find(c => c.name === 'walk');
      if (walk) {
        const mixer = new THREE.AnimationMixer(scene);
        mixer.clipAction(walk).play();
        let lo = Infinity;
        const v = new THREE.Vector3();
        const feet = [];
        scene.traverse(o => { if (/^Bip01_[LR]_Foot$/.test(o.name)) feet.push(o); });
        for (let t = 0; t < walk.duration; t += 1 / 30) {
          mixer.setTime(t);
          scene.updateMatrixWorld(true);
          for (const f of feet) { f.getWorldPosition(v); lo = Math.min(lo, v.y); }
        }
        if (feet.length !== 2 || lo < 0.03 || lo > 0.16) bad.push(`${m.id}: lowest ankle in the walk at ${lo.toFixed(3)} m (feet found: ${feet.length})`);
      }
    }
    check(!bad.length, `every body stands 1.5-2.0 m, binds every clip it plays, and walks with its ankles on the ground (largest file ${(heaviest / 1048576).toFixed(1)} MB)`, bad.join('\n         '));
  }
}

console.log(failures ? `\nverify:npc FAILED (${failures})` : '\nverify:npc passed');
process.exit(failures ? 1 : 0);
