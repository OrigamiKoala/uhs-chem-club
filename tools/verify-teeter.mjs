#!/usr/bin/env node
/**
 * verify:teeter — Teeter (unit08), Learn world 08: the planners' data, and the salt pans as a place.
 *
 * PHASE 1 (kept): `checkTeeterData` holds the equilibrium planners (`engine/eqdata.js`) to hand calculations.
 *
 * THE WORLD holds every rule `verify:kettle` and `verify:ember` hold their worlds to:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE, from the declaration (every footprint disjoint, every host's extent and
 *    lane clear of every pan and every free prop, every pan clear of every other) AND from the world as built: the
 *    real `TeeterWorld` is constructed in Node and every pair of bodies measured; nothing is buried under the
 *    ground it stands on (a beam pump stands on its pan's floor).
 *  - All eight benches have a host; every site names a quest the plan declares; a site is `built` exactly when its
 *    quest has a module in `src/learn/quests/unit08/`; a site label is a signpost (`Bench N - ...`, six words at most).
 *  - Every site FACES ITS APPROACH, stands on level ground, and its bench deploys onto a real plate under a work lamp.
 *  - THE WALK IS THE DIKE TOPS. The ground is flood-filled from the spawn against the real colliders (discs AND the
 *    boxes that fence the pans): every bench's approach, the pad and the Tipper's plaza are reachable, there is no
 *    ledge anywhere, and no reachable cell is under brine: shallow water is never waded or climbed.
 *  - A LANE OF LAMPS runs from the spawn to every approach. ONLY LAMPS ARE LIT. The beam pumps rock (their beam and
 *    rod stay joined) and nothing else moves.
 *  - EVERY BENCH HOST HOLDS THE BAY: no body in the plate, work, panel, behind, approach or lean volumes, no body
 *    between the leaned-in camera and the plate at seven viewports, and a host or ground behind the plate.
 *  - THE TIPPER'S GROUND is the one `boss-arena.js` names, beside the largest pan, and it is open.
 *  - T4-only landmarks are decoration: removing them strands nothing. No player-facing string carries emoji.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkTeeterData } from './lib/teeter-data-checks.mjs';
import { checkTeeterQ2 } from './lib/teeter-q2-checks.mjs';
import { checkTeeterQ3 } from './lib/teeter-q3-checks.mjs';
import { checkTeeterQ8 } from './lib/teeter-q8-checks.mjs';
import { checkTeeterQ6 } from './lib/teeter-q6-checks.mjs';
import { checkTeeterQ7 } from './lib/teeter-q7-checks.mjs';
import { checkTeeterQ4 } from './lib/teeter-q4-checks.mjs';
import { checkTeeterQ5 } from './lib/teeter-q5-checks.mjs';
import { HOST_PLAN, LANE } from '../src/three/teeter/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/teeter.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log('Teeter data (the planners)\n');
checkTeeterData(ok, fail);
await checkTeeterQ2(ok, fail);
await checkTeeterQ3(ok, fail);
await checkTeeterQ8(ok, fail);
await checkTeeterQ7(ok, fail);
await checkTeeterQ6(ok, fail);
await checkTeeterQ4(ok, fail);
await checkTeeterQ5(ok, fail);

console.log(`\nTeeter — ${world.name}, ${world.place}\n`);

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
  const pans = world.pans;
  for (const s of world.sites) {
    const plan = HOST_PLAN[s.id];
    if (!plan || plan.structure !== s.structure || plan.questId !== s.questId) { clashes.push(`${s.id}: no host plan, or it names a different structure or quest than the layout`); continue; }
    for (const [name, r] of [['host', rectOf(s, plan.extent)], ['lane', rectOf(s, [-LANE.hw, LANE.hw, LANE.from, LANE.to])]]) {
      for (const l of world.landmarks) if (l.asset !== 'beam-pump' && rd(l.pos[0], l.pos[2], r) < l.radius) clashes.push(`${s.id}'s ${name} is inside ${l.asset}@${l.pos[0]},${l.pos[2]}`);
      for (const p of pans) if (rectsMeet(r, p)) clashes.push(`${s.id}'s ${name} is in ${p.id}`);
    }
  }
  check(clashes.length === 0, `${world.sites.length} hosts and their lanes stand clear of every free prop and every pan`, `hosts clash:\n         ${clashes.join('\n         ')}`);
  const near = [];
  for (let i = 0; i < world.sites.length; i++) for (let j = i + 1; j < world.sites.length; j++) {
    const d = dist(world.sites[i].pos, world.sites[j].pos);
    if (d < 8) near.push(`${world.sites[i].id} and ${world.sites[j].id} are ${d.toFixed(1)}u apart`);
  }
  check(near.length === 0, 'no two sites are within 8u of each other', near.join('; '));

  const meet = [];
  for (const p of pans) for (const q of pans) if (p.id < q.id && p.minX < q.maxX + 0.9 && p.maxX > q.minX - 0.9 && p.minZ < q.maxZ + 0.9 && p.maxZ > q.minZ - 0.9) meet.push(`${p.id} and ${q.id}`);
  check(meet.length === 0, `${pans.length} pans, each at least a metre from every other`, `pans too close: ${meet.join(', ')}`);
  const biggest = [...pans].filter(p => !p.decor).sort((a, b) => (b.maxX - b.minX) * (b.maxZ - b.minZ) - (a.maxX - a.minX) * (a.maxZ - a.minZ))[0];
  check(biggest.id === 'pan-tipper' && biggest.largest, `the largest pan (${biggest.id}) is the Tipper's`, `the largest pan is ${biggest.id}, not the Tipper's`);
  const onLand = world.landmarks.filter(l => !['beam-pump', 'lamp-post', 'landing-pad'].includes(l.asset)).filter(l => pans.some(p => l.pos[0] + l.radius > p.minX && l.pos[0] - l.radius < p.maxX && l.pos[2] + l.radius > p.minZ && l.pos[2] - l.radius < p.maxZ));
  check(onLand.length === 0, 'every free prop stands on land, never in a pan', `props in pans: ${onLand.map(l => `${l.asset}@${l.pos[0]},${l.pos[2]}`).join(', ')}`);
  const pumps = world.landmarks.filter(l => l.asset === 'beam-pump');
  const dry = pumps.filter(l => !pans.some(p => l.pos[0] - l.radius >= p.minX && l.pos[0] + l.radius <= p.maxX && l.pos[2] - l.radius >= p.minZ && l.pos[2] + l.radius <= p.maxZ));
  check(pumps.length >= 10 && dry.length === 0, `${pumps.length} beam pumps, every one wholly inside a pan`, `${dry.length} beam pump(s) not wholly in a pan`);
  const walkBound = world.landmarks.filter(l => l.asset !== 'beam-pump' && (Math.abs(l.pos[0]) + l.radius > 100 || Math.abs(l.pos[2]) + l.radius > 100));
  check(walkBound.length === 0, 'every free prop stands inside the walk (100 m)', `props past the walk: ${walkBound.map(l => l.asset).join(', ')}`);
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit08-equilibrium.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'((?:q\d+|boss)-[a-z]+)',\s*title:\s*["']([^"']+)["'][\s\S]*?status:\s*'(\w+)'/g)].map(m => ({ id: m[1], title: m[2], status: m[3] }));
const PLAN_QUESTS = ['q1-both', 'q2-k', 'q3-q', 'q4-properties', 'q5-ice', 'q6-lean', 'q7-dissolve', 'q8-free'];
{
  const siteQuests = world.sites.map(s => s.questId);
  check(world.sites.length === 8 && PLAN_QUESTS.every((q, i) => siteQuests[i] === q), 'eight sites, one per bench of the plan, in teaching order', `sites name ${siteQuests.join(', ')}`);
  const missing = chartQuests.filter(q => !q.id.startsWith('boss') && !siteQuests.includes(q.id));
  check(missing.length === 0, 'every charted bench has a host on the ground, live or not', `charted benches with no site: ${missing.map(q => q.id).join(', ')}`);
  const invented = siteQuests.filter(q => !PLAN_QUESTS.includes(q));
  check(invented.length === 0, 'every site names a quest the plan declares', `sites naming quests that do not exist: ${invented.join(', ')}`);

  const stale = world.sites.filter(s => s.built !== existsSync(join(root, 'src/learn/quests/unit08', `${s.questId}.js`)));
  check(stale.length === 0, 'a site is built exactly when its quest has a module (rerun tools/gen-teeter-layout.mjs when one lands)', `sites whose built flag disagrees with src/learn/quests/unit08: ${stale.map(s => s.id).join(', ')}`);
  const stateless = chartQuests.filter(q => q.status === 'live' && !world.sites.find(s => s.questId === q.id)?.built);
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
  check(lamps >= 30, `${lamps} work lamps line the causeway, the spurs and the plaza`, `only ${lamps} work lamps`);

  // THE LANE OF LAMPS: from the spawn down the causeway, then out along the spur, no stretch more than 12 m from a lamp.
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
  const m = src.match(/'boss-tipper':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const worldId = m?.[1].match(/worldId:\s*'(\w+)'/)?.[1];
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && worldId === 'unit08' && same(player, world.arena.player) && same(boss, world.arena.boss),
    `the Tipper is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Tipper at ${boss.join(',')} / player ${player.join(',')}, but the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
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
  const { TeeterWorld } = await import('../src/three/teeter.js');
  const { PAN } = await import('../src/three/teeter/terrain.js');
  const { PUMP } = await import('../src/three/teeter/plant.js');

    let built = null;
  try { built = new TeeterWorld(null); } catch (err) { fail(`TeeterWorld threw while building: ${err.stack || err.message}`); }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 250, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built: something failed silently`);

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `the ground ends ${Math.round(r)} m out: there is an edge to fall off the world`);
    check(tb.max.y > 5 && tb.max.y < 40, `the dunes stand ${Math.round(tb.max.y)} m over the pans`, `the horizon is flat or absurd (${tb.max.y.toFixed(1)} m)`);

    {
      const eye = new THREE.Vector3(3, 1.7, 80);
      let threw = null;
      try { for (let f = 0; f < 3; f++) built.update(1 / 60, eye); } catch (err) { threw = err; }
      check(!threw && built.sky.position.distanceTo(eye) < 1e-6, 'a frame updates with the eye handed in as a position, and the sky follows it', `update(delta, cameraPos) failed: ${threw?.message || 'the sky did not follow'}`);
    }

    /* THE PUMPS ROCK, and their rods stay joined to their beams. */
    {
      const pumps = built.animated;
      check(pumps.length >= 11, `${pumps.length} beam pumps rock on their pivots`, `only ${pumps.length} pumps animate`);
      let worst = 0, swing = 0, jumped = false;
      for (const g of pumps) {
        const beam = g.children.find(c => c.userData.noMerge && c.children.length >= 3);
        const rod = g.children.find(c => c.userData.noMerge && c !== beam);
        if (!beam || !rod) { jumped = true; continue; }
        for (let t = 0; t <= PUMP.period; t += PUMP.period / 24) {
          g.userData.animate(t);
          const a = beam.rotation.z;
          swing = Math.max(swing, Math.abs(a));
          const endX = PUMP.half * Math.cos(a), endY = PUMP.pivotY + PUMP.half * Math.sin(a);
          worst = Math.max(worst, Math.hypot(rod.position.x - endX, rod.position.y + 0.5 - endY));
        }
        g.userData.animate(0);
      }
      check(!jumped && worst < 1e-6, `every rod hangs from its beam's end through a full stroke (the beam tips ${swing.toFixed(2)} rad each way)`, `a rod comes off its beam (${worst.toFixed(3)} m), or a pump lost its moving parts`);
      check(swing > 0.08 && swing < 0.2, 'the stroke is a slow see-saw, not a shake', `the beam tips ${swing.toFixed(3)} rad`);
      const period = PUMP.period;
      check(period >= 5, `one stroke takes ${period} s`, `a stroke of ${period} s is a flutter`);
    }

    const hits = findOverlaps(built.scene, { tolerance: 0.06, label: owner => owner.name || `${owner.type}#${owner.id}` });
    const pairs = new Map();
    for (const h of hits) {
      const key = [h.a, h.b].sort().join(' <-> ');
      if (!pairs.has(key) || pairs.get(key).depth < h.depth) pairs.set(key, h);
    }
    check(pairs.size === 0, `no two bodies share space — ${meshes} meshes measured`,
      `bodies occupy the same space:\n${[...pairs.entries()].map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`).join('\n')}`);

    /* NOTHING IS BURIED (a pump stands on its pan's floor, so its pier is measured against that). */
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
      // The pumps stand ON their floors: the lowest point of each pier sits within a hand of the pan floor.
      const floating = [];
      for (const { lm, node } of built.landmarkNodes.filter(n => n.lm.asset === 'beam-pump')) {
        const floor = built.getTerrainHeight(lm.pos[0], lm.pos[2]);
        if (floor > PAN.water - 0.05) floating.push(`${lm.pos[0]},${lm.pos[2]} stands on ground at ${floor.toFixed(2)}, above the brine`);
        if (Math.abs(node.position.y - floor) > 1e-6) floating.push(`${lm.pos[0]},${lm.pos[2]} is not on its floor`);
      }
      check(floating.length === 0, 'every beam pump stands on its pan\'s floor, in the brine', floating.join('\n         '));
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

    /* THE BRINE: a sheet in every pan, at the water's level, never lit, never solid. */
    {
      const sheets = [];
      built.scene.traverse(o => { if (o.isMesh && o.material === built.M.panWater) sheets.push(o); });
      check(sheets.length === world.pans.length, `${sheets.length} sheets of brine, one for every pan`, `${sheets.length} brine sheets for ${world.pans.length} pans`);
      const wrong = sheets.filter(s => { s.geometry.computeBoundingBox(); return Math.abs(s.geometry.boundingBox.min.y - PAN.water) > 1e-6; });
      check(wrong.length === 0, `every sheet lies at ${PAN.water} m, a hand over the crust`, `${wrong.length} brine sheets are at the wrong level`);
      const shallow = world.pans.filter(p => Math.abs(built.getTerrainHeight((p.minX + p.maxX) / 2, (p.minZ + p.maxZ) / 2) - PAN.floor) > 0.02);
      check(shallow.length === 0, `every pan floor lies ${-PAN.floor} m under the land`, `pans whose floor is not at ${PAN.floor}: ${shallow.map(p => p.id).join(', ')}`);
      check(built.M.panWater.transparent && !built.M.panWater.emissive.getHex(), 'the brine is translucent and not lit', 'the brine is solid or lit');
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
    check(lowest > PAN.water, `no walkable cell is under brine (the lowest is ${lowest.toFixed(2)} m, the brine stands at ${PAN.water} m)`, `the player can wade: the walk reaches ${lowest.toFixed(2)} m at (${lowestAt?.map(n => n.toFixed(1)).join(', ')})`);
    // Every pan is fenced: no walkable cell stands inside the rectangle of any near pan's brine.
    {
      const wet = [];
      for (const p of world.pans.filter(p => !p.decor)) {
        for (let i = 0; i < N && wet.length < 6; i++) {
          const x = at(i);
          if (x < p.minX + PAN.rim || x > p.maxX - PAN.rim) continue;
          for (let j = 0; j < N; j++) {
            const z = at(j);
            if (z < p.minZ + PAN.rim || z > p.maxZ - PAN.rim) continue;
            if (seen[idx(i, j)]) { wet.push(`${p.id} at (${x.toFixed(1)}, ${z.toFixed(1)})`); break; }
          }
        }
      }
      check(wet.length === 0, `every one of the ${world.pans.filter(p => !p.decor).length} near pans is fenced: the walk never enters their brine`, `the walk reaches into a pan's brine: ${wet.join(', ')}`);
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

    /* THE TIPPER'S GROUND. */
    {
      const A = world.arena;
      check(reachable(A.player[0], A.player[2], 1.0) && reachable(A.boss[0], A.boss[2], 1.0), "the Tipper's ground and the player's mark in front of it are walkable", "the boss's ground is sealed off");
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Tipper are open ground', 'something stands within seven metres of the Tipper');
      const big = world.pans.find(p => p.largest);
      check(big && A.boss[2] - big.maxZ > 6 && A.boss[2] - big.maxZ < 14 && A.boss[0] > big.minX && A.boss[0] < big.maxX, `the Tipper is fought on the shore of the largest pan (${(A.boss[2] - big.maxZ).toFixed(0)} m from the water)`, 'the arena is not on the largest pan\'s shore');
      const heights = [[0, 0], [4, 0], [-4, 0], [0, 4]].map(([dx, dz]) => built.getTerrainHeight(A.boss[0] + dx, A.boss[2] + dz));
      check(Math.max(...heights) - Math.min(...heights) < 0.2, 'the plaza under the Tipper is level', 'the Tipper stands on a slope');
    }

    /* EVERY BENCH HOST HOLDS THE BAY, and the leaned-in view from each (plan bench-tabletop.md section 2.6). */
    {
      const BAY = await import('../src/three/bench-bay.js');
      const { planLeanIn, PLATE_ZONE } = await import('../src/learn/engine/lean.js');
      const { sightBlockers, behindCover } = await import('./lib/lean-check.mjs');
      const VIEWPORTS = [['ultrawide', 2560, 1080], ['16:9', 1920, 1080], ['16:10', 1680, 1050], ['3:2', 1440, 960], ['4:3', 1280, 960], ['phone landscape', 812, 375], ['small phone', 667, 375]];
      // Unbaked, so the bench's own parts stay identifiable and exempt (the same build verify:bench measures).
      const proto = TeeterWorld.prototype;
      const baked = proto.bakeStatics;
      proto.bakeStatics = function () { /* bodies stay identifiable for this check */ };
      let w;
      try { w = new TeeterWorld(null); } finally { proto.bakeStatics = baked; }
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
  const w3d = world3dFor('unit08');
  check(Boolean(w3d) && w3d.worldName === 'Teeter' && w3d.key === 'teeter', 'worlds3d.js registers unit08 as Teeter', 'unit08 is not a walkable world in worlds3d.js');
  check(w3d && world.sites.every(s => w3d.siteForQuest(s.questId)?.id === s.id), 'every quest of the plan resolves to its site, live or not', 'a quest does not resolve to its site');
  check(w3d && w3d.siteForQuest('q9-nothing') === null && w3d.siteForQuest('boss-tipper') === null, 'a quest with no site (the boss, or one not charted) resolves to null, not an error', 'siteForQuest is not tolerant of a quest with no site');
  const voyageSrc = readFileSync(join(root, 'src/three/voyage.js'), 'utf8');
  check(/key:\s*'teeter',\s*name:\s*'Teeter',\s*hash:\s*'#\/learn\/unit08'/.test(voyageSrc), 'the voyage has a destination for Teeter, landing on its Learn road', 'voyage.js has no Teeter destination');
  const stageSrc = readFileSync(join(root, 'src/three/stage.js'), 'utf8');
  check(/key === "teeter"/.test(stageSrc) && /enterTeeterScene/.test(stageSrc) && /setTeeterSiteComplete/.test(stageSrc) && /w === this\.teeterWorld/.test(stageSrc), 'stage.js builds, enters, lights and recognises Teeter', 'stage.js is missing part of Teeter');
}

console.log(failures ? `\nTEETER FAILED (${failures})` : '\nTEETER OK');
process.exit(failures ? 1 : 0);
