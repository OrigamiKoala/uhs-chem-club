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
 *  - No player-facing string carries withheld vocabulary, emoji, or a long sign.
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
  const clashes = [];
  for (const s of world.sites) {
    for (const l of world.landmarks) {
      const d = dist(s.pos, l.pos);
      if (d < l.radius + 4.2) clashes.push(`${s.id} is inside ${l.asset} (${d.toFixed(2)}u)`);
    }
    for (const run of world.pipes) {
      for (let i = 0; i < run.points.length - 1; i++) {
        const d = distSeg(s.pos[0], s.pos[2], run.points[i], run.points[i + 1]);
        if (d < 6.5) clashes.push(`${s.id} is ${d.toFixed(2)}u from ${run.id}`);
      }
    }
  }
  check(clashes.length === 0,
    `${world.sites.length} sites stand clear of every prop and every pipe`,
    `sites clash:\n         ${clashes.join('\n         ')}`);
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
  check(off.length === 0, 'every sign names its bench by what it teaches', `signs that do not name their bench:\n         ${off.join('\n         ')}`);
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
  const t1 = world.t1.siteDescriptions;
  check(world.sites.every(s => typeof t1[s.id] === 'string' && t1[s.id].length > 20),
    'every site has a description a player with no 3D view can use', 'a site has no T1 description');
  check(world.sites.every(s => world.t2.stillCamera[s.id]), 'every site has a still framing for the baked tier', 'a site has no T2 still camera');
}

/* ---------------------------------------------------------------- the words */

{
  const WITHHELD = ['nucleophile', 'electrophile', 'carbonyl', 'carbocation', 'alkyl', 'ester', 'epoxide', 'isopropyl'];
  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label), ...Object.values(world.t1.siteDescriptions)];
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

console.log('');
if (failures) {
  console.log(`EMBER REACH FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('EMBER REACH OK');
