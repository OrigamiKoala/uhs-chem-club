#!/usr/bin/env node
/**
 * verify-ember.mjs — Integrity check of Ember Reach, Learn world 05's ground.
 *
 * Every rule `verify:lanternfall` and `verify:bellows` hold their worlds to,
 * held to this one:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE, from the declaration (every footprint
 *    disjoint, every footprint clear of the caldera main and the rail) AND from
 *    the world as built: the real `EmberReachWorld` is constructed in Node and
 *    every pair of bodies measured.
 *  - Every Unit 5 bench has a site, every site names a real quest, and a site's
 *    `built` flag agrees with the chart.
 *  - A SITE LABEL IS A SIGNPOST: `Bench N - <what it teaches>`, six words at
 *    most, sharing a word with the quest it names.
 *  - Every site FACES ITS APPROACH, and its bench deploys onto a real plate.
 *  - THE PLAYER CAN WALK TO EVERY BENCH, to the pad, to the boss's ground and
 *    through the expansion loop to the overlook. The ground is flood-filled
 *    from the spawn against the real colliders, with no ledge anywhere.
 *  - ONLY LAMPS ARE LIT. Every emissive material in the built world is a work
 *    lamp or a bench indicator, or the lava lake under the rim; the lamps share
 *    a fixed handful of real lights.
 *  - T4-only landmarks are decoration: removing them strands nothing.
 *  - No player-facing string carries withheld vocabulary, emoji, or a long label.
 *
 * And what this world adds:
 *  - THE RIM IS A WALL: the rail's colliders are a closed chain from one edge
 *    of the walk to the other, and past it is a drop of more than 20 m.
 *  - THE SPRING IS OPEN WATER: a closed ring of colliders round it.
 *  - THE CALDERA MAIN CAN BE WALKED UNDER everywhere but at its risers.
 *  - THE BOSS'S GROUND IS THE ONE `boss-arena.js` NAMES, and it is open.
 *  - THE VENT FIELD BREATHES: every vent landmark has a plume, the geyser
 *    erupts, the cooling fans turn.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
import { HOST_PLAN, LANE } from '../src/three/ember/host-plan.js';
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/ember.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);

const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const distSeg = (x, z, a, b) => {
  const dx = b[0] - a[0], dz = b[2] - a[2];
  const L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[2]) * dz) / L2));
  return Math.hypot(x - (a[0] + dx * t), z - (a[2] + dz * t));
};
const railSide = (x, z) => Math.hypot(x - world.rim.cx, z - world.rim.cz) - world.rim.rail;   // > 0 on the walk's side

console.log(`Ember Reach — ${world.name}, ${world.place}\n`);

/* ------------------------------------------------------------ declarations */

{
  const L = world.landmarks;
  const clashes = [];
  for (let i = 0; i < L.length; i++) {
    for (let j = i + 1; j < L.length; j++) {
      const need = L[i].radius + L[j].radius;
      const d = dist(L[i].pos, L[j].pos);
      if (d < need) {
        clashes.push(`${L[i].asset}@[${L[i].pos[0]},${L[i].pos[2]}] and ` +
          `${L[j].asset}@[${L[j].pos[0]},${L[j].pos[2]}] overlap by ${(need - d).toFixed(2)}u`);
      }
    }
  }
  check(clashes.length === 0,
    `${L.length} landmarks, every footprint disjoint`,
    `landmark footprints overlap:\n         ${clashes.join('\n         ')}`);
}

{
  // A host's real extent (host-plan.js) and its lane stand clear of every free prop and of every pipe.
  const rectOf = (site, [x0, x1, z0, z1]) => {
    const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
    const c = Math.cos(a), sn = Math.sin(a);
    const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => [site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c]);
    return { minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])), minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1])) };
  };
  const rd = (x, z, r) => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
  const clashes = [];
  for (const s of world.sites) {
    const plan = HOST_PLAN[s.id];
    if (!plan || plan.structure !== s.structure) { clashes.push(`${s.id}: no host plan, or it names a different structure than the layout`); continue; }
    for (const [name, r] of [['host', rectOf(s, plan.extent)], ['lane', rectOf(s, [-LANE.hw, LANE.hw, LANE.from, LANE.to])]]) {
      for (const l of world.landmarks) {
        if (rd(l.pos[0], l.pos[2], r) < l.radius) clashes.push(`${s.id}'s ${name} is inside ${l.asset}@${l.pos[0]},${l.pos[2]}`);
      }
      for (const run of world.pipes) {
        for (let i = 0; i < run.points.length - 1; i++) {
          const A = run.points[i], B = run.points[i + 1];
          // a run is a polyline; sample it finely enough that a rectangle cannot slip between two samples
          const L = Math.hypot(B[0] - A[0], B[2] - A[2]);
          for (let t = 0; t <= L; t += 1) {
            const x = A[0] + (B[0] - A[0]) * t / (L || 1), z = A[2] + (B[2] - A[2]) * t / (L || 1);
            if (rd(x, z, r) < run.radius + 0.2) { clashes.push(`${s.id}'s ${name} is under ${run.id}`); t = L + 1; i = run.points.length; }
          }
        }
      }
    }
  }
  check(clashes.length === 0,
    `${world.sites.length} hosts and their lanes stand clear of every free prop and every pipe`,
    `hosts clash with props or pipes:\n         ${clashes.join('\n         ')}`);
}

{
  const clashes = [];
  for (let i = 0; i < world.sites.length; i++) {
    for (let j = i + 1; j < world.sites.length; j++) {
      const d = dist(world.sites[i].pos, world.sites[j].pos);
      if (d < 8) clashes.push(`${world.sites[i].id} and ${world.sites[j].id} are ${d.toFixed(1)}u apart`);
    }
  }
  check(clashes.length === 0, 'no two sites are within 8u of each other', `sites crowd each other:\n         ${clashes.join('\n         ')}`);
}

/* THE PIPE CROSSES NOTHING. A run may end inside the landmark it joins (a
   wellhead's riser, the separator's inlet, the hall's gable, the siphon's
   nozzles) and nowhere else may it pass through a footprint. */
{
  const JOINS = { 'caldera-main': ['separator', 'turbine-hall'] };
  const clashes = [];
  for (const run of world.pipes) {
    const joins = JOINS[run.id] || (run.id.startsWith('spur') ? ['wellhead'] : run.id.startsWith('tap') ? ['siphon-manifold'] : []);
    for (const l of world.landmarks) {
      if (joins.includes(l.asset)) continue;
      for (let i = 0; i < run.points.length - 1; i++) {
        const d = distSeg(l.pos[0], l.pos[2], run.points[i], run.points[i + 1]);
        if (d < l.radius + run.radius + 0.3) { clashes.push(`${run.id} runs through ${l.asset}@[${l.pos[0]},${l.pos[2]}] (${d.toFixed(2)}u)`); break; }
      }
    }
  }
  check(clashes.length === 0, `${world.pipes.length} pipe runs cross no footprint but the ones they join`, `pipes through props:\n         ${clashes.join('\n         ')}`);
  const main = world.pipes.find(r => r.id === 'caldera-main');
  const low = main.points.filter(p => p[1] < 2.9);
  check(low.length === 0, 'the caldera main is carried at a height a player walks under, all along it', `${low.length} points of the main are below head height`);
  const loop = main.points.filter(p => p[1] > 6);
  check(loop.length >= 2 && loop.every(p => Math.abs(p[0]) < 6), 'the main lifts into an expansion loop over the lane to the rim', 'the main has no expansion loop over the lane');
}

/* NOTHING STANDS AT THE RAIL OR PAST IT, inside the walk. */
{
  const out = world.landmarks.filter(l => Math.abs(l.pos[0]) < 92 && l.pos[2] > -100 && railSide(l.pos[0], l.pos[2]) < l.radius + 0.5);
  check(out.length === 0, 'every landmark on the walk stands clear of the rail', `landmarks at or past the rail: ${out.map(l => `${l.asset}@[${l.pos[0]},${l.pos[2]}]`).join(', ')}`);
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit05-thermodynamics.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)',\s*title:\s*["']([^"']+)["']/g)]
  .map(m => ({ id: m[1], title: m[2] }));

{
  const questIds = chartQuests.map(q => q.id);
  const live = new Set(
    [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)'[\s\S]*?status:\s*'(\w+)'/g)]
      .map(m => [m[1], m[2]]).filter(([, st]) => st === 'live').map(([id]) => id)
  );
  check(questIds.length === 7, `unit05 charts ${questIds.length} benches`, `the unit05 chart lists ${questIds.length} benches, not seven`);

  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => live.has(q) && !siteQuests.includes(q));
  check(missing.length === 0, 'every built unit05 bench has a site on the ground', `quests with no site: ${missing.join(', ')}`);

  const invented = siteQuests.filter(q => !questIds.includes(q));
  check(invented.length === 0, 'every site names a quest the chart actually declares', `sites naming quests that do not exist: ${invented.join(', ')}`);

  const wrong = world.sites.filter(s => s.built !== live.has(s.questId));
  check(wrong.length === 0, 'built sites are exactly the quests with a module', `sites whose built flag disagrees with the chart: ${wrong.map(s => s.id).join(', ')}`);

  const stem = w => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
  const off = [];
  for (const s of world.sites) {
    const q = chartQuests.find(x => x.id === s.questId);
    const prefix = `Bench ${s.stage} - `;
    if (!s.label.startsWith(prefix)) { off.push(`${s.id} reads "${s.label}", which does not start "${prefix}"`); continue; }
    const words = s.label.slice(prefix.length).split(/\s+/).map(stem).filter(w => w.length >= 3);
    const title = new Set((q?.title || '').split(/\s+/).map(stem));
    if (!words.some(w => title.has(w))) off.push(`${s.id} reads "${s.label}", which shares no word with "${q?.title}"`);
  }
  check(off.length === 0, 'every site label names its bench by what it teaches', `site labels that do not name their bench:\n         ${off.join('\n         ')}`);
}

{
  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length, 'site stage numbers are unique', 'two sites claim the same stage number');
  const bad = world.sites.filter(s => { const d = dist(s.pos, s.approachPos); return d < 1.5 || d > 8; });
  check(bad.length === 0, 'every site has a usable approach mark', `approach marks out of range: ${bad.map(s => s.id).join(', ')}`);
}

/* -------------------------------------------------------------- tier parity */

{
  const t4Only = world.landmarks.filter(l => l.minTier === 'T4');
  const t3World = world.landmarks.filter(l => l.minTier !== 'T4');
  check(t4Only.length > 0, `${t4Only.length} landmarks are T4 decoration`, 'no T4 decoration declared');
  const blocked = [];
  for (const s of world.sites) {
    for (const l of t3World) {
      if (dist(s.approachPos, l.pos) < l.radius + 0.5) blocked.push(`${s.id}'s approach is blocked by ${l.asset}`);
    }
  }
  check(blocked.length === 0, 'every site is reachable with all T4 decoration removed', `approach marks blocked at T3:\n         ${blocked.join('\n         ')}`);
  check(world.sites.every(s => world.t2.stillCamera[s.id]), 'every site has a still framing for the baked tier', 'a site has no T2 still camera');
}

/* ---------------------------------------------------------------- the words */

{
  const WITHHELD = ['nucleophile', 'electrophile', 'carbonyl', 'carbocation', 'alkyl', 'ester', 'epoxide', 'isopropyl'];
  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  const bad = [];
  for (const str of strings) {
    for (const word of WITHHELD) if (new RegExp(`\\b${word}s?\\b`, 'i').test(str)) bad.push(`"${str}" contains "${word}"`);
  }
  check(bad.length === 0, `${strings.length} player-facing strings withhold the vocabulary`, `withheld vocabulary leaked into the world:\n         ${bad.join('\n         ')}`);
  const emoji = strings.filter(s => /\p{Extended_Pictographic}/u.test(s));
  check(emoji.length === 0, 'the world is emoji-free', `emoji in: ${emoji.join(', ')}`);
  const tooLong = world.sites.filter(s => s.label.split(/\s+/).length > 6).map(s => s.label);
  check(tooLong.length === 0, 'every site label is short enough to read at a glance', `site labels running long: ${tooLong.join(', ')}`);
}

/* -------------------------------------------------------------------- spawn */

{
  const spawn = world.spawn;
  const inProp = world.landmarks.find(l => l.asset !== 'landing-pad' && dist(spawn.pos, l.pos) < l.radius + 0.5);
  check(!inProp, 'the player does not spawn inside anything', `spawn is inside ${inProp?.asset}`);
  const nearest = Math.min(...world.sites.map(s => dist(spawn.pos, s.pos)));
  check(nearest < 60, `the nearest site is ${nearest.toFixed(0)}u from the spawn`, `the nearest site is ${nearest.toFixed(0)}u away: too far to find`);
  const [sx, sz] = world.terrain.size;
  const outside = world.landmarks.filter(l => Math.abs(l.pos[0]) > sx / 2 || Math.abs(l.pos[2]) > sz / 2);
  check(outside.length === 0, 'every landmark stands on the terrain', `landmarks off the edge of the world: ${outside.map(l => l.asset).join(', ')}`);
  check(world.landmarks.some(l => l.asset === 'landing-pad'), 'the Avalon has a pad to land on', 'no landing-pad landmark: the voyage has nowhere to set down');
  const lanterns = world.landmarks.filter(l => l.asset === 'lamp-post').length;
  check(lanterns >= 18, `${lanterns} work lamps mark the road between the benches`, `only ${lanterns} work lamps: the road is unmarked`);
}

/* ------------------------------------------- the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-crucible':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && same(player, world.arena.player) && same(boss, world.arena.boss),
    `the Crucible is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Crucible at ${boss.join(',')} / player ${player.join(',')}, but the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  installDomShim({ tier: 'T4' });
  const THREE = await import('three');
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const { EmberReachWorld } = await import('../src/three/ember.js');
  const { geyserPhase } = await import('../src/three/ember/effects.js');

  let built = null;
  try {
    built = new EmberReachWorld(null);
  } catch (err) {
    check(false, 'the world builds', `EmberReachWorld threw while building: ${err.stack || err.message}`);
  }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 300, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built: something failed silently`);

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `the ground ends ${Math.round(r)} m out: there is an edge to fall off the world`);
    check(built.springMesh?.userData.phys === 'ground' && built.lakeMesh?.userData.phys === 'ground',
      'the spring and the lava lake are laid in the ground, as ground', 'the spring or the lake is missing, or is a body');
    check(tb.max.y > 120, `the caldera's walls and cone stand ${Math.round(tb.max.y)} m over the shelf`, 'the horizon is flat: no caldera wall stands round the shelf');

    /* THE RIM IS A WALL. */
    {
      const ring = built.rimColliders;
      let gap = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        if (Math.hypot(ring[i].x - ring[i + 1].x, ring[i].z - ring[i + 1].z) > 1.4) gap++;
      }
      const ends = [ring[0], ring[ring.length - 1]];
      const reach = ends.every(c => Math.abs(c.x) > 76 && c.z < -99);
      check(ring.length > 100 && gap === 0 && reach, `the rail is a closed chain of ${ring.length} colliders from one edge of the walk to the other`,
        `the rail has ${gap} gaps, or does not reach the walk's edge (${ends.map(c => `${c.x.toFixed(1)},${c.z.toFixed(1)}`).join(' / ')})`);
      const past = built.getTerrainHeight(0, world.rim.cz + world.rim.radius - 12);
      check(past < -20, `past the rail the ground is ${past.toFixed(1)} m: a drop no one can take`, 'there is ground past the rail');
      const lakeY = built.lakeMesh.position.y;
      check(lakeY < -20, `the lava lake lies ${(-lakeY).toFixed(1)} m under the shelf`, 'the lava lake is not under the rim');
    }

    /* THE SPRING IS OPEN WATER: nobody walks into it. */
    {
      const S = world.spring;
      const ring = built.colliders.filter(c => c.radius !== undefined && Math.abs(Math.hypot(c.x - S.x, c.z - S.z) - (S.radius + 0.55)) < 0.05);
      const step = ring.length ? (2 * Math.PI * (S.radius + 0.55)) / ring.length : Infinity;
      check(ring.length > 40 && step < 1.4, `the spring is ringed by ${ring.length} colliders`, 'the spring is open to walk into');
    }

    /* THE VENT FIELD BREATHES. */
    {
      const ventAssets = new Set(['fumarole', 'mud-pot', 'sinter-terrace', 'separator', 'silencer-pair', 'cooling-cells']);
      const breathing = world.landmarks.filter(l => ventAssets.has(l.asset)).length;
      check(built.vents.length >= breathing, `${built.vents.length} plumes rise off ${breathing} vents and the plant`, `${breathing} vents but only ${built.vents.length} plumes`);
      check(Boolean(built.geyserVent), 'the geyser has a vent to erupt from', 'the geyser has no vent');
      let erupts = 0;
      for (let t = 0; t < 200; t += 0.5) if (geyserPhase(t) >= 0) erupts++;
      check(erupts > 0 && erupts < 120, `the geyser erupts for ${(erupts * 0.5).toFixed(0)} s of every 200`, 'the geyser never erupts, or never stops');
      const fans = built.movers.filter(o => o.userData.mover.kind === 'yaw').length;
      const bubbles = built.movers.filter(o => o.userData.mover.kind === 'bubble').length;
      check(fans >= 3 && bubbles >= 6, `${fans} cooling fans turn and ${bubbles} bubbles swell in the mud`, `${fans} fans and ${bubbles} bubbles: the plant and the mud are still`);
    }

    /* A frame runs, with the eye handed in as a position. */
    {
      const eye = new THREE.Vector3(3, 1.7, 80);
      let threw = null;
      try { for (let f = 0; f < 3; f++) built.update(1 / 60, eye); } catch (err) { threw = err; }
      check(!threw, 'a frame updates with the eye handed in as a position',
        `update(delta, cameraPos) threw: ${threw?.stack || threw?.message}`);
      check(!threw && built.sky.position.distanceTo(eye) < 1e-6, 'the sky dome follows the eye', 'the sky dome did not move to the eye');
    }

    const hits = findOverlaps(built.scene, {
      tolerance: 0.06,
      label: owner => owner.name || `${owner.type}#${owner.id}`
    });
    const pairs = new Map();
    for (const h of hits) {
      const key = [h.a, h.b].sort().join(' <-> ');
      if (!pairs.has(key) || pairs.get(key).depth < h.depth) pairs.set(key, h);
    }
    check(pairs.size === 0, `no two bodies share space — ${meshes} meshes measured`,
      `bodies occupy the same space:\n${[...pairs.entries()].map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`).join('\n')}`);

    /* NOTHING IS BURIED. */
    {
      const buried = [];
      const EXEMPT = new Set(['ground', 'ambient']);
      const tagOf = o => { for (let n = o; n; n = n.parent) if (n.userData?.phys) return n.userData.phys; return null; };
      const ownerName = o => { let n = o; while (n.parent && n.parent !== built.scene) n = n.parent; return n.name || n.type; };
      const test = (box, o) => {
        if (box.isEmpty() || box.getSize(new THREE.Vector3()).lengthSq() < 1e-8) return;
        const c = box.getCenter(new THREE.Vector3());
        const ground = built.getTerrainHeight(c.x, c.z);
        if (box.max.y < ground - 0.3 && buried.length < 10) {
          buried.push(`${ownerName(o)}: a part at (${c.x.toFixed(1)}, ${c.y.toFixed(1)}, ${c.z.toFixed(1)}) tops out at ${box.max.y.toFixed(2)}u, under ground at ${ground.toFixed(2)}u`);
        }
      };
      built.scene.traverse(o => {
        if (!o.isMesh || EXEMPT.has(tagOf(o))) return;
        if (o.userData.partBoxes?.length) {
          for (const pb of o.userData.partBoxes) test(pb.clone().applyMatrix4(o.matrixWorld), o);
          return;
        }
        if (o.parent?.userData?.partBoxes?.length && o.userData.ownGeometry) {
          for (const pb of o.parent.userData.partBoxes) test(pb.clone().applyMatrix4(o.parent.matrixWorld), o);
          return;
        }
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        test(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), o);
      });
      check(buried.length === 0, 'no body is buried under the ground it stands on', `bodies buried under the ground:\n         ${buried.join('\n         ')}`);
    }

    /* ONLY LAMPS ARE LIT. */
    {
      const lit = new Set();
      built.scene.traverse(o => {
        if (!o.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) if (m && m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) lit.add(m);
      });
      const allowed = new Set([built.M.lantern, built.M.magma]);
      const strangers = [...lit].filter(m => !allowed.has(m));
      check(strangers.length === 0, `${lit.size} emissive materials: the work lamps and the lava lake; nothing else in the world is lit`,
        `${strangers.length} emissive material(s) that are not a work lamp or the lake`);
      let onShelf = 0;
      built.scene.traverse(o => { if (o.isMesh && o.material === built.M.magma && built.getTerrainHeight(o.position.x, o.position.z) > -10) onShelf++; });
      check(onShelf === 0, 'the molten rock lies only under the rim, where nobody stands', `${onShelf} lava surface(s) on the shelf`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight) realLights++; });
      check(realLights === 3 && built.lamps.length >= 30,
        `${built.lamps.length} lamps share ${realLights} real lights`,
        `${built.lamps.length} lamps and ${realLights} real lights: the lamp pool is not what keeps the frame cheap`);
    }

    /* EVERY SITE FACES ITS APPROACH, and its bench deploys onto a real plate. */
    for (const site of world.sites.filter(s => s.built)) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: the bench reports a working surface`, `${site.id} is built but has no bench anchor to deploy onto`);
      if (!anchor) continue;
      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces the ground the player walks in from`, `${site.id}: faces ${anchor.rotationY.toFixed(2)} rad, but its approach is at ${want.toFixed(2)}`);
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05,
        `${site.id}: the plate is at ${anchor.topY.toFixed(2)}u, standing on ground at ${ground.toFixed(2)}u`,
        `${site.id}: bench top at ${anchor.topY.toFixed(2)}, but the ground under it is ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: the cased instrument can be opened`, `${site.id}: no dormant cabinet, so deploying would draw two instruments in one place`);
      const flat = [[0, 0], [2.4, 0], [-2.4, 0], [0, 3]].map(([dx, dz]) => built.getTerrainHeight(site.pos[0] + dx, site.pos[2] + dz));
      check(Math.max(...flat) - Math.min(...flat) < 0.02, `${site.id}: the shelf under the shelter is level`, `${site.id}: the ground under the bench varies by ${(Math.max(...flat) - Math.min(...flat)).toFixed(2)}u`);
    }

    /* THE WALK. Flood-fill the ground from the spawn against the real colliders,
       with the player's own radius, exactly as `FpsControls` resolves them. */
    const R = 0.25;
    const CELL = 0.5;
    const MIN = -100;
    const N = Math.round(200 / CELL);
    // Bucket the colliders so the fill stays quick with seven hundred of them.
    const BUCK = 4;
    const buckets = new Map();
    const bkey = (i, j) => `${i}|${j}`;
    for (const c of built.colliders) {
      const x0 = c.radius != null ? c.x - c.radius : c.minX, x1 = c.radius != null ? c.x + c.radius : c.maxX;
      const z0 = c.radius != null ? c.z - c.radius : c.minZ, z1 = c.radius != null ? c.z + c.radius : c.maxZ;
      for (let i = Math.floor((x0 - R) / BUCK); i <= Math.floor((x1 + R) / BUCK); i++) {
        for (let j = Math.floor((z0 - R) / BUCK); j <= Math.floor((z1 + R) / BUCK); j++) {
          const k = bkey(i, j);
          if (!buckets.has(k)) buckets.set(k, []);
          buckets.get(k).push(c);
        }
      }
    }
    const blocked = (x, z) => {
      for (const c of buckets.get(bkey(Math.floor(x / BUCK), Math.floor(z / BUCK))) || []) {
        if (c.radius != null) {
          if (Math.hypot(x - c.x, z - c.z) < c.radius + R) return true;
        } else if (x > c.minX - R && x < c.maxX + R && z > c.minZ - R && z < c.maxZ + R) return true;
      }
      return false;
    };
    const idx = (i, j) => i * N + j;
    const at = i => MIN + (i + 0.5) * CELL;
    const seen = new Uint8Array(N * N);
    const si = Math.floor((world.spawn.pos[0] - MIN) / CELL);
    const sj = Math.floor((world.spawn.pos[2] - MIN) / CELL);
    const queue = [[si, sj]];
    seen[idx(si, sj)] = 1;
    const ledges = [];
    while (queue.length) {
      const [i, j] = queue.pop();
      const x = at(i), z = at(j);
      const h = built.getTerrainHeight(x, z);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
        if (seen[idx(ni, nj)]) continue;
        const nx = at(ni), nz = at(nj);
        if (blocked(nx, nz)) continue;
        const nh = built.getTerrainHeight(nx, nz);
        if (Math.abs(nh - h) > 0.6 && ledges.length < 8) {
          ledges.push(`(${x.toFixed(1)}, ${z.toFixed(1)}) ${h.toFixed(2)}u -> (${nx.toFixed(1)}, ${nz.toFixed(1)}) ${nh.toFixed(2)}u`);
        }
        seen[idx(ni, nj)] = 1;
        queue.push([ni, nj]);
      }
    }
    let reached = 0;
    let lowest = Infinity;
    for (let k = 0; k < seen.length; k++) {
      if (!seen[k]) continue;
      reached++;
      lowest = Math.min(lowest, built.getTerrainHeight(at((k / N) | 0), at(k % N)));
    }
    check(ledges.length === 0, `${reached} cells of ground are walkable, and none of them drops off a ledge`,
      `the player can walk off a drop the walk would fall down:\n         ${ledges.join('\n         ')}`);
    check(lowest > -2.5, `the lowest ground a player can reach is ${lowest.toFixed(2)} m: nobody gets down the cliff`, `a player can reach ground at ${lowest.toFixed(2)} m: the rim leaks`);

    const reachable = (px, pz, within) => {
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          if (seen[idx(i, j)] && Math.hypot(at(i) - px, at(j) - pz) <= within) return true;
        }
      }
      return false;
    };
    for (const site of world.sites) {
      check(reachable(site.approachPos[0], site.approachPos[2], 1.6), `${site.id}: a player can walk from the spawn to the bench's approach`, `${site.id}: its approach mark is sealed off from the spawn`);
    }
    /* A HOST STANDS INSIDE THE EXTENT IT DECLARES. `host-plan.js` is what the layout generator keeps everything else out of, so a body
       that stands outside it would be stood in by the scatter. And the declaration is not slack: no side is more than 2.5 m wider than
       what is built. */
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
        const slack = 0.25;
        const sides = [['left', total.min.x, x0, -1], ['right', total.max.x, x1, 1], ['back', total.min.z, z0, -1], ['front', total.max.z, z1, 1]];
        for (const [name, got, want, dir] of sides) {
          if (dir * (got - want) > slack) off.push(`${site.id} (${plan.structure}) stands ${(dir * (got - want)).toFixed(2)} m outside its declared extent on the ${name}`);
          else if (dir * (want - got) > 2.5) off.push(`${site.id} (${plan.structure}) declares ${(dir * (want - got)).toFixed(2)} m more than it builds on the ${name}`);
        }
      }
      check(off.length === 0, 'every host stands inside the extent host-plan.js declares, and the declaration is tight',
        `hosts out of step with host-plan.js:\n         ${off.join('\n         ')}`);
    }

    /* THE LEVEL GROUND UNDER EVERY HOST: the generator writes each site's `flat` disc, and the ground under the whole footprint and its
       lane is level to within a hand. */
    {
      const bad = [];
      for (const site of world.sites) {
        const plan = HOST_PLAN[site.id];
        const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
        const c = Math.cos(a), sn = Math.sin(a);
        const at = (lx, lz) => [site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c];
        const hs = [];
        const [x0, x1, z0, z1] = plan.extent;
        for (let lx = x0; lx <= x1; lx += 1.5) for (let lz = z0; lz <= LANE.to; lz += 1.5) { const [x, z] = at(lx, lz); hs.push(built.getTerrainHeight(x, z)); }
        const spread = Math.max(...hs) - Math.min(...hs);
        if (spread > 0.35) bad.push(`${site.id}: the ground under its host and lane varies by ${spread.toFixed(2)} m`);
      }
      check(bad.length === 0, 'the ground under every host and its lane is level', bad.join('\n         '));
    }

    /* THE FIELD POINTS (plan section 2.5). A field stage sends the player to a spot in the field, so each spot is held to what a place
       the player is sent to owes them: it belongs to a host and is a real piece of it (something solid stands at the point), the place
       to stand is clear of every collider, level with the ground under the point and joined to the spawn on foot, the point is inside
       [E] reach from there, and the guide's way (a straight line from the bench's approach) is open ground. */
    {
      const { fieldPointsOf } = await import('../src/three/field-points.js');
      const points = fieldPointsOf(built);
      // The three field points were retired (2026-10-23): each fetch carried a copy of what its bench already holds, or fed a stage that
      // was cut. A fetch stays only where it brings new evidence, and Ember Reach has none left.
      check(points.length === 0, 'no field point is registered (every fetch carried what its bench holds)', `field points remain (${points.map(p => p.id).join(', ')}) for stages that no longer fetch`);
      const bad = [];
      for (const p of points) {
        const site = world.sites.find(s => s.id === p.host);
        if (!site) { bad.push(`${p.id}: names host ${p.host}, which is not a site (a point is a piece of a host)`); continue; }
        if (p.siteId !== site.id || !p.label) bad.push(`${p.id}: no label or the wrong bench`);
        const near = Math.hypot(p.pos[0] - site.pos[0], p.pos[2] - site.pos[2]);
        if (near > 12) bad.push(`${p.id}: ${near.toFixed(1)} m from its bench, too far to be this host's own`);
        const [sx, , sz] = p.stand;
        if (blocked(sx, sz)) bad.push(`${p.id}: the place to stand is inside a collider`);
        if (!blocked(p.pos[0], p.pos[2])) bad.push(`${p.id}: nothing solid stands at the point, so it is not a piece of its host`);
        const g1 = built.getTerrainHeight(sx, sz);
        const g2 = built.getTerrainHeight(p.pos[0], p.pos[2]);
        if (Math.abs(g1 - g2) > 0.3 || p.pos[1] - g2 < 0.2 || p.pos[1] - g2 > 2.4) bad.push(`${p.id}: the floor to stand on is not level with the point, or the point floats`);
        const d = Math.hypot(sx - p.pos[0], sz - p.pos[2]);
        if (d > p.reach - 0.5) bad.push(`${p.id}: the stand is ${d.toFixed(1)} m from the point, outside its ${p.reach} m reach`);
        if (!seen[idx(Math.floor((sx - MIN) / CELL), Math.floor((sz - MIN) / CELL))]) bad.push(`${p.id}: the place to stand is on ground the walk cannot reach from the spawn`);
        const [ax, az] = [site.approachPos[0], site.approachPos[2]];
        const L = Math.hypot(sx - ax, sz - az);
        for (let t = 0; t <= L; t += 0.5) {
          const x = ax + (sx - ax) * t / (L || 1), z = az + (sz - az) * t / (L || 1);
          if (!seen[idx(Math.floor((x - MIN) / CELL), Math.floor((z - MIN) / CELL))]) { bad.push(`${p.id}: the way from the approach to the stand crosses ground the walk cannot reach at (${x.toFixed(1)}, ${z.toFixed(1)})`); break; }
        }
      }
      check(bad.length === 0, `${points.length} field point(s): each is a piece of its host, with a clear, level place to stand inside reach, reachable on foot, and an open way to it`,
        `field points:\n         ${bad.join('\n         ')}`);
    }

    /* A TABLE IS WORKED BY ITS LAMP. There is a work lamp over every plate whose quest is a tabletop, a `lampMark` in the pool (so the
       world's light count does not grow): it hangs over the plate, within its width and depth. */
    {
      const { allQuests } = await import('../src/learn/curriculum.js').catch(() => ({ allQuests: () => [] }));
      const tableQuests = [];
      for (const q of allQuests().filter(x => x.status === 'live' && x.key.startsWith('unit05/'))) {
        const mod = await q.module();
        if ((mod.STAGES || []).length && mod.STAGES.every(st => st.widget?.type === 'table')) tableQuests.push(q.key.split('/')[1]);
      }
      const bad = [];
      for (const site of world.sites.filter(s => tableQuests.includes(s.questId))) {
        const g = built.siteMarkers.get(site.questId).group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const over = built.lamps.some(m => {
          const p = new THREE.Vector3();
          m.getWorldPosition(p);
          p.applyMatrix4(inv);
          return Math.abs(p.x) < 2.4 && p.z > -1.4 && p.z < 1.0 && p.y > 2.4 && p.y < 4.2;
        });
        if (!over) bad.push(`${site.id} (${site.questId}): no lamp hangs over the plate`);
      }
      check(bad.length === 0, `every bench whose quest is a tabletop (${tableQuests.length}) has a lamp over its plate`, `tables with no lamp:\n         ${bad.join('\n         ')}`);
    }

    const pad = world.landmarks.find(l => l.asset === 'landing-pad');
    check(reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the rest of the ground', 'the landing pad is walled off from the spawn');
    const A = world.arena;
    check(reachable(A.player[0], A.player[2], 1.0) && reachable(A.boss[0], A.boss[2], 1.0), "the Crucible's ground and the player's mark in front of it are walkable", "the boss's ground is sealed off");
    {
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Crucible are open ground', 'something stands within seven metres of the Crucible');
    }
    const overlook = [0, 0, world.rim.cz + world.rim.rail + 2.0];
    check(reachable(overlook[0], overlook[2], 1.0), 'the overlook is reached through the expansion loop', 'the overlook beyond the main cannot be reached');
  }
}

/* ------------------------------------------------------------ the benches' rework (2026-10-23): what the audit asked of every Ember Reach table */

console.log('\nEmber Reach — the benches and the boss, held to the rules of the rework\n');
{
  const MODEL = await import('../src/learn/table/model.js');
  const { tourSteps } = await import('../src/learn/table/tour.js');
  const MP = await import('../src/learn/engine/model-parts.js');
  const { QUEST_STORY } = await import('../src/story/quest-story.js');
  const { SCENES } = await import('../src/ui/story-scenes.js');
  const { WORLDS } = await import('../src/learn/curriculum.js');
  const world5 = WORLDS.find(w => w.id === 'unit05');
  const mods = new Map();
  for (const q of world5.quests) mods.set(q.id, await q.module());
  const counts = { stages: 0, predicts: 0, tours: 0, models: 0 };
  const bad0 = failures;
  for (const [id, mod] of mods) {
    const stages = mod.STAGES;
    const isBoss = id.startsWith('boss-');
    if (stages.length < 3 || stages.length > 7) fail(`unit05/${id} has ${stages.length} stages, not 3 to 7`);
    let predicts = 0;
    stages.forEach((st, i) => {
      counts.stages++;
      const label = `unit05/${id} stage ${i + 1}`;
      const t = MODEL.createTable(st.table, st.title);
      // A field fetch must bring new evidence, never a lock, never on a boss: Ember Reach has none left.
      if (Object.keys(t.fetch).length) fail(`${label}: a field fetch (every one carried what its bench already holds)`);
      // Predict first: the guess is made with no instrument on the table, and the next stage brings the instrument.
      if (t.prediction) fail(`${label}: a prediction token on a stage that is not a predict stage`);
      if (st.predict) {
        predicts++;
        counts.predicts++;
        if (isBoss) fail(`${label}: a boss phase asks for a prediction`);
        if (Object.values(t.fixtures).some(f => !f.noRun || Object.keys(f.dials).length)) fail(`${label}: a predict stage has a runnable or adjustable instrument on the table`);
        if (t.tools.length) fail(`${label}: a predict stage carries a tool`);
        const next = stages[i + 1];
        if (!next) fail(`${label}: a predict stage with no stage after it to test the guess`);
        else {
          const nt = MODEL.createTable(next.table, next.title);
          if (next.predict || !Object.values(nt.fixtures).length && !Object.values(nt.pieces).some(p => ['block', 'charge', 'eqn', 'bond', 'phase'].includes(p.kind))) fail(`${label}: the stage after a predict stage must bring the instrument`);
          if (typeof next.prompt !== 'string') fail(`${label}: the test stage has no prompt`);
        }
        const slot = Object.values(t.zones.slots);
        if (!slot.length) fail(`${label}: a predict stage with no slot for the guess`);
        if (typeof st.onClear !== 'function') fail(`${label}: a predict stage does not keep its guess (onClear)`);
      }
      // The Tour: a step for every instrument, in plain words, and no word the quest has not earned.
      const steps = tourSteps(t, {});
      counts.tours++;
      for (const f of Object.values(t.fixtures)) {
        if (f.props?.backdrop) continue;
        if (f.kind === 'plaque' || f.kind === 'plate') continue;
        if (!steps.some(s => s.flag.startsWith(`tour_${t.kit}_fx_${f.kind}`))) fail(`${label}: the instrument "${f.label}" is not in the Tour`);
      }
      for (const v of mod.VOCABULARY || []) {
        if (v.introducedAt > i) for (const s of steps) if (v.term.test(`${s.name} ${s.desc}`)) fail(`${label}: Tour step "${s.name}" uses a word the quest has not earned yet (${v.term})`);
      }
      // A reward model builds, and its counts are the spec's own.
      const r = (() => { try { return st.reward; } catch (e) { return null; } })();
      if (r?.model) {
        counts.models++;
        try { const parts = MP.modelParts(r.model); if (!parts.spheres.length) fail(`${label}: the reward model has nothing in it`); } catch (e) { fail(`${label}: the reward model does not build (${e.message})`); }
        if (!MP.captionOf(r.model)) fail(`${label}: the reward model has no words under it`);
      }
    });
    if (!isBoss && !predicts) fail(`unit05/${id} has no predict stage for its click`);
    if (predicts > 2) fail(`unit05/${id} asks for ${predicts} predictions: one for the click and at most one for a new case`);
  }
  // Every story animation Ember Reach plays names a painter that exists.
  for (const key of ['unit05/q1-flow', 'unit05/q5-hess', 'unit05/q7-gibbs', 'unit05/boss-crucible']) {
    const st = QUEST_STORY[key];
    if (!st) fail(`${key} has no story animation`);
    else if (!SCENES[st.scene]) fail(`${key} names the painter "${st.scene}", which does not exist`);
  }
  for (const key of Object.keys(QUEST_STORY)) if (key.startsWith('unit05/') && !mods.has(key.replace('unit05/', ''))) fail(`${key} is a story animation for no quest`);
  check(failures === bad0, `${counts.stages} stages in ${mods.size} quests: 3 to 7 each, one prediction on each click, no fetch, a Tour step for every instrument, ${counts.models} reward model(s) that build, four story animations with painters`);
}

console.log('');
if (failures) {
  console.log(`EMBER REACH FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('EMBER REACH OK');
