#!/usr/bin/env node
/**
 * verify:brinewire — Brinewire (unit10), Learn world 10: the electrochemistry planners, and the copper marsh as a place.
 *
 * PHASE 1 (kept): `checkBrinewireData` holds the cell planners (`engine/celldata.js`) to independent values.
 *
 * THE WORLD holds every rule `verify:verdigris`, `verify:teeter` and `verify:ember` hold their worlds to:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE, from the declaration (every footprint disjoint, every host's extent and
 *    lane clear of every pool and every free prop, every pool clear of every other) AND from the world as built: the
 *    real `BrinewireWorld` is constructed in Node and every pair of bodies measured; nothing is buried under the
 *    ground it stands on (a pylon stands on its pool's floor).
 *  - All six benches have a host, whether or not the quest is built; every site names a quest the plan declares; a site is
 *    `built` exactly when its quest has a module in `src/learn/quests/unit10/`; a site label is a signpost (`Bench N - ...`,
 *    six words at most).
 *  - Every site FACES ITS APPROACH, stands on level ground, and its bench deploys onto a real plate under a work lamp.
 *  - THE WALK IS THE BOARDWALKS AND BANKS. The ground is flood-filled from the spawn against the real colliders (discs AND
 *    the boxes that fence the pools): every bench's approach, the pad and the Clamp's court are reachable, there is no
 *    ledge anywhere, and no reachable cell is under water: shallow water is never waded or climbed.
 *  - THE CABLES hang from pylon to pylon, high over the pools and the spurs (never lower than the clearance named below),
 *    and every end of every span is a pylon's arm tip.
 *  - A LANE OF LAMPS runs from the spawn to every approach. ONLY LAMPS ARE LIT. The rotor piers' cup wheels turn slowly
 *    and nothing else moves.
 *  - EVERY BENCH HOST HOLDS THE BAY: no body in the plate, work, panel, behind, approach or lean volumes, no body
 *    between the leaned-in camera and the plate at seven viewports, and a host or ground behind the plate.
 *  - THE CLAMP'S GROUND is the one `boss-arena.js` names, beside the largest pool, and it is open.
 *  - T4-only landmarks are decoration: removing them strands nothing. No player-facing string carries emoji.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkBrinewireData } from './lib/brinewire-data-checks.mjs';
import { HOST_PLAN, LANE } from '../src/three/brinewire/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/brinewire.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const POOL_STANDING = new Set(['pylon', 'brine-tank', 'switch-house', 'rotor-pier']);

console.log('Brinewire data (the planners)\n');
{
  const found = checkBrinewireData();
  check(found.length === 0, 'celldata.js agrees with every independent value', `celldata.js disagrees:\n         ${found.join('\n         ')}`);
}

console.log(`\nBrinewire — ${world.name}, ${world.place}\n`);

/* ------------------------------------------------------------ declarations */

const rectOf = (site, [x0, x1, z0, z1]) => {
  const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
  const c = Math.cos(a), sn = Math.sin(a);
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => [site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c]);
  return { minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])), minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1])) };
};
const rd = (x, z, r) => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
const rectsMeet = (a, b) => a.minX < b.maxX - 0.01 && a.maxX > b.minX + 0.01 && a.minZ < b.maxZ - 0.01 && a.maxZ > b.minZ + 0.01;

{
  const L = world.landmarks;
  const clashes = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const need = L[i].radius + L[j].radius, d = dist(L[i].pos, L[j].pos);
    if (d < need) clashes.push(`${L[i].asset}@[${L[i].pos[0]},${L[i].pos[2]}] and ${L[j].asset}@[${L[j].pos[0]},${L[j].pos[2]}] overlap by ${(need - d).toFixed(2)}u`);
  }
  check(clashes.length === 0, `${L.length} landmarks, every footprint disjoint`, `landmark footprints overlap:\n         ${clashes.join('\n         ')}`);
}

{
  const clashes = [];
  const pools = world.pools;
  for (const s of world.sites) {
    const plan = HOST_PLAN[s.id];
    if (!plan || plan.structure !== s.structure || plan.questId !== s.questId) { clashes.push(`${s.id}: no host plan, or it names a different structure or quest than the layout`); continue; }
    for (const [name, r] of [['host', rectOf(s, plan.extent)], ['lane', rectOf(s, [-LANE.hw, LANE.hw, LANE.from, LANE.to])]]) {
      for (const l of world.landmarks) if (!POOL_STANDING.has(l.asset) && rd(l.pos[0], l.pos[2], r) < l.radius) clashes.push(`${s.id}'s ${name} is inside ${l.asset}@${l.pos[0]},${l.pos[2]}`);
      for (const p of pools) if (rectsMeet(r, p)) clashes.push(`${s.id}'s ${name} is in ${p.id}`);
    }
  }
  check(clashes.length === 0, `${world.sites.length} hosts and their lanes stand clear of every free prop and every pool`, `hosts clash:\n         ${clashes.join('\n         ')}`);
  const near = [];
  for (let i = 0; i < world.sites.length; i++) for (let j = i + 1; j < world.sites.length; j++) {
    const d = dist(world.sites[i].pos, world.sites[j].pos);
    if (d < 8) near.push(`${world.sites[i].id} and ${world.sites[j].id} are ${d.toFixed(1)}u apart`);
  }
  check(near.length === 0, 'no two sites are within 8u of each other', near.join('; '));

  const meet = [];
  for (const p of pools) for (const q of pools) if (p.id < q.id && p.minX < q.maxX + 0.9 && p.maxX > q.minX - 0.9 && p.minZ < q.maxZ + 0.9 && p.maxZ > q.minZ - 0.9) meet.push(`${p.id} and ${q.id}`);
  check(meet.length === 0, `${pools.length} pools, each at least a metre from every other`, `pools too close: ${meet.join(', ')}`);
  const biggest = [...pools].filter(p => !p.decor).sort((a, b) => (b.maxX - b.minX) * (b.maxZ - b.minZ) - (a.maxX - a.minX) * (a.maxZ - a.minZ))[0];
  check(biggest.id === 'pool-lagoon' && biggest.largest, `the largest pool (${biggest.id}) is the Clamp's lagoon`, `the largest pool is ${biggest.id}, not the lagoon`);
  const onLand = world.landmarks.filter(l => !POOL_STANDING.has(l.asset) && !['lamp-post', 'landing-pad'].includes(l.asset)).filter(l => pools.some(p => l.pos[0] + l.radius > p.minX && l.pos[0] - l.radius < p.maxX && l.pos[2] + l.radius > p.minZ && l.pos[2] - l.radius < p.maxZ));
  check(onLand.length === 0, 'every free prop stands on land, never in a pool', `props in pools: ${onLand.map(l => `${l.asset}@${l.pos[0]},${l.pos[2]}`).join(', ')}`);
  const standing = world.landmarks.filter(l => POOL_STANDING.has(l.asset));
  const dry = standing.filter(l => !pools.some(p => l.pos[0] - l.radius >= p.minX && l.pos[0] + l.radius <= p.maxX && l.pos[2] - l.radius >= p.minZ && l.pos[2] + l.radius <= p.maxZ));
  check(standing.length >= 12 && dry.length === 0, `${standing.length} pylons, brine tanks, rotor piers and the switch house, every one wholly inside a pool`, `${dry.length} pool landmark(s) not wholly in a pool`);
  const walkBound = world.landmarks.filter(l => !POOL_STANDING.has(l.asset) && (Math.abs(l.pos[0]) + l.radius > 100 || Math.abs(l.pos[2]) + l.radius > 100));
  check(walkBound.length === 0, 'every free prop stands inside the walk (100 m)', `props past the walk: ${walkBound.map(l => l.asset).join(', ')}`);
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit10-electrochemistry.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'((?:q\d+|boss)-[a-z]+)',\s*title:\s*["']([^"']+)["'][\s\S]*?status:\s*'(\w+)'/g)].map(m => ({ id: m[1], title: m[2], status: m[3] }));
const PLAN_QUESTS = ['q1-halves', 'q2-activity', 'q3-galvanic', 'q4-potential', 'q5-load', 'q6-electrolysis'];
{
  const siteQuests = world.sites.map(s => s.questId);
  check(world.sites.length === 6 && PLAN_QUESTS.every((q, i) => siteQuests[i] === q), 'six sites, one per bench of the plan, in teaching order', `sites name ${siteQuests.join(', ')}`);
  // The chart may still hold the draft placeholders; once it carries the plan's ids, every charted bench must have a host.
  const charted = chartQuests.filter(q => PLAN_QUESTS.includes(q.id) || q.id === 'boss-clamp');
  const missing = chartQuests.filter(q => !q.id.startsWith('boss') && charted.length >= 6 && !siteQuests.includes(q.id));
  check(missing.length === 0, charted.length >= 6 ? 'every charted bench has a host on the ground, live or not' : `(the chart still holds ${chartQuests.length} draft quests, not the plan's six: charted-bench check waits for the chart)`, `charted benches with no site: ${missing.map(q => q.id).join(', ')}`);
  const invented = siteQuests.filter(q => !PLAN_QUESTS.includes(q));
  check(invented.length === 0, 'every site names a quest the plan declares', `sites naming quests that do not exist: ${invented.join(', ')}`);

  const stale = world.sites.filter(s => s.built !== existsSync(join(root, 'src/learn/quests/unit10', `${s.questId}.js`)));
  check(stale.length === 0, 'a site is built exactly when its quest has a module (rerun tools/gen-brinewire-layout.mjs when one lands)', `sites whose built flag disagrees with src/learn/quests/unit10: ${stale.map(s => s.id).join(', ')}`);
  const stateless = chartQuests.filter(q => q.status === 'live' && !q.id.startsWith('boss') && !world.sites.find(s => s.questId === q.id)?.built);
  check(stateless.length === 0, 'every live chart quest has its site built', `live quests whose site is sealed: ${stateless.map(q => q.id).join(', ')}`);

  const stem = w => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
  const off = [];
  for (const s of world.sites) {
    const plan = HOST_PLAN[s.id];
    const title = chartQuests.find(x => x.id === s.questId)?.title || plan.title;
    const prefix = `Bench ${s.stage} - `;
    if (!s.label.startsWith(prefix)) { off.push(`${s.id} reads "${s.label}", which does not start "${prefix}"`); continue; }
    const words = s.label.slice(prefix.length).split(/\s+/).map(stem).filter(w => w.length >= 1);
    const have = new Set(title.split(/\s+/).map(stem));
    if (!words.some(w => have.has(w))) off.push(`${s.id} reads "${s.label}", which shares no word with "${title}"`);
    if (s.label.split(/\s+/).length > 6) off.push(`${s.id}: "${s.label}" is longer than six words`);
  }
  check(off.length === 0, 'every site label names its bench by what it teaches, in six words or fewer', off.join('\n         '));
  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length, 'site stage numbers are unique', 'two sites claim the same stage number');
  const badA = world.sites.filter(s => { const d = dist(s.pos, s.approachPos); return d < 1.5 || d > 8; });
  check(badA.length === 0, 'every site has a usable approach mark', `approach marks out of range: ${badA.map(s => s.id).join(', ')}`);
}

/* -------------------------------------------------------------- tier parity, words, spawn */

{
  const t4Only = world.landmarks.filter(l => l.minTier === 'T4');
  const t3World = world.landmarks.filter(l => l.minTier !== 'T4');
  check(t4Only.length > 0, `${t4Only.length} landmarks are T4 decoration`, 'no T4 decoration declared');
  const blocked = [];
  for (const s of world.sites) for (const l of t3World) if (dist(s.approachPos, l.pos) < l.radius + 0.5) blocked.push(`${s.id}'s approach is blocked by ${l.asset}`);
  check(blocked.length === 0, 'every site is reachable with all T4 decoration removed', blocked.join('\n         '));
  check(world.sites.every(s => world.t2.stillCamera[s.id]), 'every site has a still framing for the baked tier', 'a site has no T2 still camera');

  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  check(!strings.some(s => /\p{Extended_Pictographic}/u.test(s)), 'the world is emoji-free', 'emoji in a player-facing string');

  const inProp = world.landmarks.find(l => l.asset !== 'landing-pad' && dist(world.spawn.pos, l.pos) < l.radius + 0.5);
  check(!inProp, 'the player does not spawn inside anything', `spawn is inside ${inProp?.asset}`);
  const nearest = Math.min(...world.sites.map(s => dist(world.spawn.pos, s.pos)));
  check(nearest < 60, `the nearest site is ${nearest.toFixed(0)}u from the spawn`, `the nearest site is ${nearest.toFixed(0)}u away: too far to find`);
  check(world.landmarks.some(l => l.asset === 'landing-pad'), 'the Avalon has a pad to land on', 'no landing-pad landmark');
  const lamps = world.landmarks.filter(l => l.asset === 'lamp-post').length;
  check(lamps >= 30, `${lamps} work lamps line the spine, the spurs and the court`, `only ${lamps} work lamps`);

  // THE LANE OF LAMPS: from the spawn down the spine, then out along the spur, no stretch more than 12 m from a lamp.
  const posts = world.landmarks.filter(l => l.asset === 'lamp-post').map(l => l.pos);
  const dark = [];
  for (const s of world.sites) {
    const az = s.approachPos[2], ax = s.approachPos[0];
    const pts = [];
    for (let z = world.spawn.pos[2]; z >= az; z -= 1) pts.push([0, 0, z]);
    for (let x = 0; x <= Math.abs(ax); x += 1) pts.push([Math.sign(ax) * x, 0, az]);
    const gap = pts.find(p => !posts.some(l => dist(p, l) <= 12));
    if (gap) dark.push(`${s.id}: dark at (${gap[0]}, ${gap[2]})`);
  }
  check(dark.length === 0, 'a lane of lamps runs from the spawn to every approach', `unlit stretches:\n         ${dark.join('\n         ')}`);
}

/* ------------------------------------------------ the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-clamp':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const worldId = m?.[1].match(/worldId:\s*'(\w+)'/)?.[1];
  const species = m?.[1].match(/species:\s*'([^']+)'/)?.[1];
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && worldId === 'unit10' && species === 'the clamp' && same(player, world.arena.player) && same(boss, world.arena.boss),
    `the Clamp is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Clamp at ${boss.join(',')} / player ${player.join(',')}, but the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  // The bench checks run above stub a bare `document`/`window` for themselves; the world needs the real canvas shim.
  delete globalThis.document;
  delete globalThis.window;
  installDomShim({ tier: 'T4' });
  const THREE = await import('three');
  const { findOverlaps, collectBoxes, findBayIntrusions } = await import('./lib/overlap.mjs');
  const { BrinewireWorld } = await import('../src/three/brinewire.js');
  const { POOL } = await import('../src/three/brinewire/terrain.js');
  const { ROTOR } = await import('../src/three/brinewire/plant.js');

    let built = null;
  try { built = new BrinewireWorld(null); } catch (err) { fail(`BrinewireWorld threw while building: ${err.stack || err.message}`); }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 250, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built: something failed silently`);

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `the ground ends ${Math.round(r)} m out: there is an edge to fall off the world`);
    check(tb.max.y > 5 && tb.max.y < 40, `the far banks stand ${Math.round(tb.max.y)} m over the pools`, `the horizon is flat or absurd (${tb.max.y.toFixed(1)} m)`);

    {
      const eye = new THREE.Vector3(3, 1.7, 80);
      let threw = null;
      try { for (let f = 0; f < 3; f++) built.update(1 / 60, eye); } catch (err) { threw = err; }
      check(!threw && built.sky.position.distanceTo(eye) < 1e-6, 'a frame updates with the eye handed in as a position, and the sky follows it', `update(delta, cameraPos) failed: ${threw?.message || 'the sky did not follow'}`);
    }

    /* THE ROTOR WHEELS TURN, slowly, about their stems, and nothing else moves. */
    {
      const piers = built.animated;
      check(piers.length === world.landmarks.filter(l => l.asset === 'rotor-pier').length && piers.length >= 4, `${piers.length} rotor piers turn their cup wheels, and only they animate`, `${piers.length} nodes animate`);
      let still = 0, moved = 0, tilted = false;
      for (const g of piers) {
        const wheel = g.children.find(c => c.userData.noMerge);
        if (!wheel) { tilted = true; continue; }
        g.userData.animate(0);
        const a0 = wheel.rotation.y;
        g.userData.animate(ROTOR.period / 4);
        if (Math.abs(wheel.rotation.y - a0) > 0.1) moved++; else still++;
        if (Math.abs(wheel.rotation.x) > 1e-9 || Math.abs(wheel.rotation.z) > 1e-9) tilted = true;
        g.userData.animate(0);
      }
      check(moved === piers.length && still === 0 && !tilted, 'every wheel turns flat about its stem and never tips', `a wheel is stuck (${still}) or tips off its stem (${tilted})`);
      check(ROTOR.period >= 20, `one turn takes ${ROTOR.period} s`, `a turn of ${ROTOR.period} s is a spin`);
    }

    /* THE CABLES hang pylon to pylon, high, over the pools and the spurs and clear of every host. */
    {
      const cg = built.scene.children.find(o => o.name === 'cable-runs');
      const spans = world.cables || [];
      check(Boolean(cg) && cg.userData.phys === 'ambient' && spans.length >= 3, `${spans.length} cable spans hang as one ambient object`, 'the cable runs are missing, or are not ambient');
      const pylonAt = (x, z) => world.landmarks.some(l => l.asset === 'pylon' && Math.hypot(l.pos[0] - x, l.pos[2] - z) < 0.01);
      check(spans.every(s => pylonAt(s.a[0], s.a[1]) && pylonAt(s.b[0], s.b[1])), 'every cable span runs from one pylon to another', 'a cable span ends where no pylon stands');
      let low = Infinity;
      if (cg) cg.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); low = Math.min(low, o.geometry.boundingBox.min.y); } });
      const need = 7.5;
      check(low >= need, `no conductor hangs lower than ${low.toFixed(1)} m (at least ${need} m)`, `a conductor sags to ${low.toFixed(1)} m, under the ${need} m clearance`);
      const segDist = (px, pz, a, b) => {
        const L2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
        const t = Math.max(0, Math.min(1, ((px - a[0]) * (b[0] - a[0]) + (pz - a[1]) * (b[1] - a[1])) / L2));
        return Math.hypot(px - (a[0] + t * (b[0] - a[0])), pz - (a[1] + t * (b[1] - a[1])));
      };
      const under = [];
      for (const s of world.sites) {
        const plan = HOST_PLAN[s.id];
        const r = rectOf(s, plan.extent);
        for (const c of spans) for (const side of [-1, 1]) {
          const a = [c.a[0] + side * 2.8, c.a[1]], b = [c.b[0] + side * 2.8, c.b[1]];
          const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
          if (segDist(cx, cz, a, b) < Math.hypot(r.maxX - r.minX, r.maxZ - r.minZ) / 2 + 1) under.push(`${s.id} lies under a cable`);
        }
      }
      check(under.length === 0, 'no host stands under a cable', [...new Set(under)].join('; '));
    }

    const hits = findOverlaps(built.scene, { tolerance: 0.06, label: owner => owner.name || `${owner.type}#${owner.id}` });
    const pairs = new Map();
    for (const h of hits) {
      const key = [h.a, h.b].sort().join(' <-> ');
      if (!pairs.has(key) || pairs.get(key).depth < h.depth) pairs.set(key, h);
    }
    check(pairs.size === 0, `no two bodies share space — ${meshes} meshes measured`,
      `bodies occupy the same space:\n${[...pairs.entries()].map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`).join('\n')}`);

    /* NOTHING IS BURIED (a tower stands on its pool's floor, so its footing is measured against that). */
    {
      const buried = [];
      const EXEMPT = new Set(['ground', 'ambient']);
      const tagOf = o => { for (let n = o; n; n = n.parent) if (n.userData?.phys) return n.userData.phys; return null; };
      const ownerName = o => { let n = o; while (n.parent && n.parent !== built.scene) n = n.parent; return n.name || n.type; };
      const test = (box, o) => {
        if (box.isEmpty() || box.getSize(new THREE.Vector3()).lengthSq() < 1e-8) return;
        const c = box.getCenter(new THREE.Vector3());
        const ground = built.getTerrainHeight(c.x, c.z);
        if (box.max.y < ground - 0.3 && buried.length < 10) buried.push(`${ownerName(o)}: a part at (${c.x.toFixed(1)}, ${c.y.toFixed(1)}, ${c.z.toFixed(1)}) tops out at ${box.max.y.toFixed(2)}u, under ground at ${ground.toFixed(2)}u`);
      };
      built.scene.traverse(o => {
        if (!o.isMesh || EXEMPT.has(tagOf(o))) return;
        if (o.userData.partBoxes?.length) { for (const pb of o.userData.partBoxes) test(pb.clone().applyMatrix4(o.matrixWorld), o); return; }
        if (o.parent?.userData?.partBoxes?.length && o.userData.ownGeometry) { for (const pb of o.parent.userData.partBoxes) test(pb.clone().applyMatrix4(o.parent.matrixWorld), o); return; }
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        test(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), o);
      });
      check(buried.length === 0, 'no body is buried under the ground it stands on', `bodies buried under the ground:\n         ${buried.join('\n         ')}`);
      // What stands in a pool stands ON its floor, under the water.
      const floating = [];
      for (const { lm, node } of built.landmarkNodes.filter(n => POOL_STANDING.has(n.lm.asset))) {
        const floor = built.getTerrainHeight(lm.pos[0], lm.pos[2]);
        if (floor > POOL.water - 0.05) floating.push(`${lm.asset}@${lm.pos[0]},${lm.pos[2]} stands on ground at ${floor.toFixed(2)}, above the water`);
        if (Math.abs(node.position.y - floor) > 1e-6) floating.push(`${lm.asset}@${lm.pos[0]},${lm.pos[2]} is not on its floor`);
      }
      check(floating.length === 0, "every pylon, tank, rotor pier and the switch house stands on its pool's floor, in the water", floating.join('\n         '));
    }

    /* ONLY LAMPS ARE LIT. */
    {
      const lit = new Set();
      built.scene.traverse(o => {
        if (!o.isMesh) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m && m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) lit.add(m);
      });
      const strangers = [...lit].filter(m => m !== built.M.lantern);
      check(strangers.length === 0, `${lit.size} emissive material: the work lamps; nothing else in the world is lit`, `${strangers.length} emissive material(s) that are not a work lamp`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight) realLights++; });
      check(realLights === 3 && built.lamps.length >= 30, `${built.lamps.length} lamps share ${realLights} real lights`, `${built.lamps.length} lamps and ${realLights} real lights: the lamp pool is not what keeps the frame cheap`);
    }

    /* THE WATER: a sheet in every pool, at the water's level, never lit, never solid. */
    {
      const sheets = [];
      built.scene.traverse(o => { if (o.isMesh && o.material === built.M.poolWater) sheets.push(o); });
      check(sheets.length === world.pools.length, `${sheets.length} sheets of water, one for every pool`, `${sheets.length} water sheets for ${world.pools.length} pools`);
      const wrong = sheets.filter(s => { s.geometry.computeBoundingBox(); return Math.abs(s.geometry.boundingBox.min.y - POOL.water) > 1e-6; });
      check(wrong.length === 0, `every sheet lies at ${POOL.water} m, a hand over the silt`, `${wrong.length} water sheets are at the wrong level`);
      const shallow = world.pools.filter(p => Math.abs(built.getTerrainHeight((p.minX + p.maxX) / 2, (p.minZ + p.maxZ) / 2) - POOL.floor) > 0.02);
      check(shallow.length === 0, `every pool floor lies ${-POOL.floor} m under the land`, `pools whose floor is not at ${POOL.floor}: ${shallow.map(p => p.id).join(', ')}`);
      check(built.M.poolWater.transparent && !built.M.poolWater.emissive.getHex(), 'the water is translucent and not lit', 'the water is solid or lit');
    }

    /* EVERY SITE FACES ITS APPROACH, and its bench deploys onto a real plate. */
    for (const site of world.sites) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: the bench reports a working surface`, `${site.id} has no bench anchor to deploy onto`);
      if (!anchor) continue;
      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces the ground the player walks in from`, `${site.id}: faces ${anchor.rotationY.toFixed(2)} rad, but its approach is at ${want.toFixed(2)}`);
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05, `${site.id}: the plate is at ${anchor.topY.toFixed(2)}u, standing on ground at ${ground.toFixed(2)}u`, `${site.id}: bench top at ${anchor.topY.toFixed(2)}, but the ground under it is ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: the cased instrument can be opened`, `${site.id}: no dormant cabinet, so deploying would draw two instruments in one place`);
    }

    /* A TABLE IS WORKED BY ITS LAMP: a work lamp over every plate, a `lampMark` in the pool. */
    {
      const bad = [];
      for (const site of world.sites) {
        const g = built.siteMarkers.get(site.questId).group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const over = built.lamps.some(m => { const p = new THREE.Vector3(); m.getWorldPosition(p); p.applyMatrix4(inv); return Math.abs(p.x) < 2.4 && p.z > -1.4 && p.z < 1.0 && p.y > 2.4 && p.y < 4.2; });
        if (!over) bad.push(`${site.id}: no lamp hangs over the plate`);
      }
      check(bad.length === 0, `every one of the ${world.sites.length} plates has a lamp over it`, bad.join('\n         '));
    }

    /* THE WALK. Flood-fill the ground from the spawn against the real colliders, discs and boxes, with the player's own radius. */
    const R = 0.25, CELL = 0.5, MIN = -100, N = Math.round(200 / CELL), BUCK = 4;
    const buckets = new Map();
    const bkey = (i, j) => `${i}|${j}`;
    const extentOf = c => c.radius !== undefined
      ? [c.x - c.radius, c.x + c.radius, c.z - c.radius, c.z + c.radius]
      : [c.minX, c.maxX, c.minZ, c.maxZ];
    for (const c of built.colliders) {
      const [x0, x1, z0, z1] = extentOf(c);
      for (let i = Math.floor((x0 - R) / BUCK); i <= Math.floor((x1 + R) / BUCK); i++) {
        for (let j = Math.floor((z0 - R) / BUCK); j <= Math.floor((z1 + R) / BUCK); j++) {
          if (!buckets.has(bkey(i, j))) buckets.set(bkey(i, j), []);
          buckets.get(bkey(i, j)).push(c);
        }
      }
    }
    const hitBy = (c, x, z) => c.radius !== undefined
      ? Math.hypot(x - c.x, z - c.z) < c.radius + R
      : x > c.minX - R && x < c.maxX + R && z > c.minZ - R && z < c.maxZ + R;
    const blocked = (x, z) => (buckets.get(bkey(Math.floor(x / BUCK), Math.floor(z / BUCK))) || []).some(c => hitBy(c, x, z));
    const idx = (i, j) => i * N + j;
    const at = i => MIN + (i + 0.5) * CELL;
    const seen = new Uint8Array(N * N);
    const si = Math.floor((world.spawn.pos[0] - MIN) / CELL), sj = Math.floor((world.spawn.pos[2] - MIN) / CELL);
    const queue = [[si, sj]];
    seen[idx(si, sj)] = 1;
    const ledges = [];
    let lowest = Infinity, lowestAt = null;
    while (queue.length) {
      const [i, j] = queue.pop();
      const x = at(i), z = at(j), h = built.getTerrainHeight(x, z);
      if (h < lowest) { lowest = h; lowestAt = [x, z]; }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= N || nj >= N || seen[idx(ni, nj)]) continue;
        const nx = at(ni), nz = at(nj);
        if (blocked(nx, nz)) continue;
        const nh = built.getTerrainHeight(nx, nz);
        if (Math.abs(nh - h) > 0.6 && ledges.length < 8) ledges.push(`(${x.toFixed(1)}, ${z.toFixed(1)}) ${h.toFixed(2)}u -> (${nx.toFixed(1)}, ${nz.toFixed(1)}) ${nh.toFixed(2)}u`);
        seen[idx(ni, nj)] = 1;
        queue.push([ni, nj]);
      }
    }
    let reached = 0;
    for (let k = 0; k < seen.length; k++) if (seen[k]) reached++;
    check(ledges.length === 0, `${reached} cells of ground are walkable, and none of them drops off a ledge`, `the player can walk off a drop:\n         ${ledges.join('\n         ')}`);
    check(lowest > POOL.water, `no walkable cell is under water (the lowest is ${lowest.toFixed(2)} m, the water stands at ${POOL.water} m)`, `the player can wade: the walk reaches ${lowest.toFixed(2)} m at (${lowestAt?.map(n => n.toFixed(1)).join(', ')})`);
    // Every pool is fenced: no walkable cell stands inside the rectangle of any near pool's water.
    {
      const wet = [];
      for (const p of world.pools.filter(p => !p.decor)) {
        for (let i = 0; i < N && wet.length < 6; i++) {
          const x = at(i);
          if (x < p.minX + POOL.rim || x > p.maxX - POOL.rim) continue;
          for (let j = 0; j < N; j++) {
            const z = at(j);
            if (z < p.minZ + POOL.rim || z > p.maxZ - POOL.rim) continue;
            if (seen[idx(i, j)]) { wet.push(`${p.id} at (${x.toFixed(1)}, ${z.toFixed(1)})`); break; }
          }
        }
      }
      check(wet.length === 0, `every one of the ${world.pools.filter(p => !p.decor).length} near pools is fenced: the walk never enters their water`, `the walk reaches into a pool's water: ${wet.join(', ')}`);
    }
    const reachable = (px, pz, within) => {
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (seen[idx(i, j)] && Math.hypot(at(i) - px, at(j) - pz) <= within) return true;
      return false;
    };
    for (const site of world.sites) check(reachable(site.approachPos[0], site.approachPos[2], 1.6), `${site.id}: a player can walk from the spawn to the bench's approach`, `${site.id}: its approach mark is sealed off from the spawn`);

    /* A HOST STANDS INSIDE THE EXTENT IT DECLARES, and the declaration is tight. */
    {
      const off = [];
      for (const site of world.sites) {
        const marker = built.siteMarkers.get(site.questId);
        const plan = HOST_PLAN[site.id];
        if (!marker || !plan) { off.push(`${site.id}: no host group`); continue; }
        const g = marker.group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const total = new THREE.Box3();
        g.traverse(o => {
          if (!o.isMesh || !o.geometry) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          total.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)));
        });
        const [x0, x1, z0, z1] = plan.extent;
        for (const [name, got, want, dir] of [['left', total.min.x, x0, -1], ['right', total.max.x, x1, 1], ['back', total.min.z, z0, -1], ['front', total.max.z, z1, 1]]) {
          if (dir * (got - want) > 0.25) off.push(`${site.id} (${plan.structure}) stands ${(dir * (got - want)).toFixed(2)} m outside its declared extent on the ${name}`);
          else if (dir * (want - got) > 2.5) off.push(`${site.id} (${plan.structure}) declares ${(dir * (want - got)).toFixed(2)} m more than it builds on the ${name}`);
        }
      }
      check(off.length === 0, 'every host stands inside the extent host-plan.js declares, and the declaration is tight', `hosts out of step with host-plan.js:\n         ${off.join('\n         ')}`);
    }

    /* THE LEVEL GROUND UNDER EVERY HOST AND ITS LANE. */
    {
      const bad = [];
      for (const site of world.sites) {
        const plan = HOST_PLAN[site.id];
        const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
        const c = Math.cos(a), sn = Math.sin(a);
        const hs = [];
        const [x0, x1, z0] = plan.extent;
        for (let lx = x0; lx <= x1; lx += 1.5) for (let lz = z0; lz <= LANE.to; lz += 1.5) hs.push(built.getTerrainHeight(site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c));
        const spread = Math.max(...hs) - Math.min(...hs);
        if (spread > 0.35) bad.push(`${site.id}: the ground under its host and lane varies by ${spread.toFixed(2)} m`);
      }
      check(bad.length === 0, 'the ground under every host and its lane is level', bad.join('\n         '));
    }

    const pad = world.landmarks.find(l => l.asset === 'landing-pad');
    check(reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the rest of the ground', 'the landing pad is walled off from the spawn');

    /* THE CLAMP'S GROUND. */
    {
      const A = world.arena;
      check(reachable(A.player[0], A.player[2], 1.0) && reachable(A.boss[0], A.boss[2], 1.0), "the Clamp's ground and the player's mark in front of it are walkable", "the boss's ground is sealed off");
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Clamp are open ground', 'something stands within seven metres of the Clamp');
      const big = world.pools.find(p => p.largest);
      check(big && A.boss[2] - big.maxZ > 6 && A.boss[2] - big.maxZ < 14 && A.boss[0] > big.minX && A.boss[0] < big.maxX, `the Clamp is fought on the shore of the largest pool (${(A.boss[2] - big.maxZ).toFixed(0)} m from the water)`, 'the arena is not on the largest pool\'s shore');
      const heights = [[0, 0], [4, 0], [-4, 0], [0, 4]].map(([dx, dz]) => built.getTerrainHeight(A.boss[0] + dx, A.boss[2] + dz));
      check(Math.max(...heights) - Math.min(...heights) < 0.2, 'the court under the Clamp is level', 'the Clamp stands on a slope');
    }

    /* EVERY BENCH HOST HOLDS THE BAY, and the leaned-in view from each (plan bench-tabletop.md section 2.6). */
    {
      const BAY = await import('../src/three/bench-bay.js');
      const { planLeanIn, PLATE_ZONE } = await import('../src/learn/engine/lean.js');
      const { sightBlockers, behindCover } = await import('./lib/lean-check.mjs');
      const VIEWPORTS = [['ultrawide', 2560, 1080], ['16:9', 1920, 1080], ['16:10', 1680, 1050], ['3:2', 1440, 960], ['4:3', 1280, 960], ['phone landscape', 812, 375], ['small phone', 667, 375]];
      // Unbaked, so the bench's own parts stay identifiable and exempt (the same build verify:bench measures).
      const proto = BrinewireWorld.prototype;
      const baked = proto.bakeStatics;
      proto.bakeStatics = function () { /* bodies stay identifiable for this check */ };
      let w;
      try { w = new BrinewireWorld(null); } finally { proto.bakeStatics = baked; }
      w.scene.updateMatrixWorld(true);
      const volumes = BAY.bayBoxes();
      const lift = BAY.PLATE_TOP - 0.895;
      const poses = VIEWPORTS.map(([name, vw, vh]) => [name, vw, vh, planLeanIn({ viewport: { w: vw, h: vh } })]);
      const problems = [];
      let rays = 0;
      for (const [questId, anchor] of w.benchAnchors) {
        const node = new THREE.Group();
        node.position.set(anchor.position[0], anchor.topY - BAY.PLATE_TOP, anchor.position[2]);
        node.rotation.y = anchor.rotationY;
        node.updateMatrixWorld(true);
        const frame = new THREE.Matrix4().copy(node.matrixWorld).invert();
        const own = anchor.dormant?.parent;
        if (!own) { problems.push(`${questId}: the anchor has no bench to exempt`); continue; }
        const bodies = collectBoxes(w.scene, { frame, skip: o => o === own });
        for (const h of findBayIntrusions(w.scene, frame, volumes, { skip: o => o === own, bodies })) problems.push(`${questId}: ${h.body} stands ${h.depth.toFixed(2)} m inside the bay's ${h.volume} volume at (${h.at.join(', ')})`);
        for (const [name, vw, vh, pose] of poses) {
          const cam = [pose.position[0], pose.position[1] + lift, pose.position[2]];
          const sb = sightBlockers(bodies, cam, PLATE_ZONE, BAY.PLATE_TOP);
          if (sb.blocked) problems.push(`${questId}: ${sb.first.name} stands between the leaned-in camera and the plate (${name})`);
          const camera = new THREE.PerspectiveCamera(55, vw / vh, 0.05, 80);
          camera.position.set(...cam);
          camera.lookAt(pose.target[0], pose.target[1] + lift, pose.target[2]);
          const bc = behindCover({ bodies, camera, plateY: BAY.PLATE_TOP, farZ: -BAY.BENCH_BAY.depth / 2, toWorld: node.matrixWorld, terrain: (x, z) => w.getTerrainHeight(x, z), safe: pose.safe });
          rays += bc.total;
          if (bc.covered < bc.total) problems.push(`${questId}: ${bc.total - bc.covered} of ${bc.total} rays past the plate reach no host and no ground (${name})`);
        }
      }
      check(problems.length === 0, `all ${w.benchAnchors.size} hosts hold the bay's volumes clear, have nothing between the camera and the plate and a host or ground behind it at ${VIEWPORTS.length} viewports (${rays} rays)`, `bay or lean-in problems:\n         ${problems.slice(0, 12).join('\n         ')}`);
    }
  }
}

/* ------------------------------------------------ the registry */

{
  const { world3dFor } = await import('../src/learn/worlds3d.js');
  const w3d = world3dFor('unit10');
  check(Boolean(w3d) && w3d.worldName === 'Brinewire' && w3d.key === 'brinewire', 'worlds3d.js registers unit10 as Brinewire', 'unit10 is not a walkable world in worlds3d.js');
  check(w3d && world.sites.every(s => w3d.siteForQuest(s.questId)?.id === s.id), 'every quest of the plan resolves to its site, live or not', 'a quest does not resolve to its site');
  check(w3d && w3d.siteForQuest('q9-nothing') === null && w3d.siteForQuest('boss-clamp') === null, 'a quest with no site (the boss, or one not charted) resolves to null, not an error', 'siteForQuest is not tolerant of a quest with no site');
  const voyageSrc = readFileSync(join(root, 'src/three/voyage.js'), 'utf8');
  check(/key:\s*'brinewire',\s*name:\s*'Brinewire',\s*hash:\s*'#\/learn\/unit10'/.test(voyageSrc), 'the voyage has a destination for Brinewire, landing on its Learn road', 'voyage.js has no Brinewire destination');
  const stageSrc = readFileSync(join(root, 'src/three/stage.js'), 'utf8');
  check(/key === "brinewire"/.test(stageSrc) && /enterBrinewireScene/.test(stageSrc) && /setBrinewireSiteComplete/.test(stageSrc) && /w === this\.brinewireWorld/.test(stageSrc), 'stage.js builds, enters, lights and recognises Brinewire', 'stage.js is missing part of Brinewire');
}

console.log(failures ? `\nBRINEWIRE FAILED (${failures})` : '\nBRINEWIRE OK');
process.exit(failures ? 1 : 0);
