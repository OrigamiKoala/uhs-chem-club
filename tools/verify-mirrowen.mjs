#!/usr/bin/env node
/**
 * verify-mirrowen.mjs — Integrity check of Mirrowen, Learn world 06's ground.
 *
 * Every rule `verify:ember` and its siblings hold their worlds to, held to this one:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE, from the declaration (every footprint disjoint, every
 *    footprint clear of the water) AND from the world as built: the real `MirrowenWorld` is
 *    constructed in Node and every pair of bodies measured.
 *  - Every Unit 6 bench has a site, every site names a real quest of the chart.
 *  - A SITE LABEL IS A SIGNPOST: `Bench N - <what it teaches>`, six words at most, sharing a word
 *    with the quest it names.
 *  - Every site FACES ITS APPROACH, and its bench deploys onto a real plate.
 *  - THE PLAYER CAN WALK TO EVERY BENCH, to the pad and to the boss's ground. The ground is
 *    flood-filled from the spawn against the real colliders, with no ledge anywhere.
 *  - ONLY LAMPS ARE LIT. Every emissive material in the built world is a work lamp or a bench
 *    indicator; the lamps share a fixed handful of real lights.
 *  - T4-only landmarks are decoration: removing them strands nothing.
 *  - No sign stands in the world; no player-facing string carries withheld vocabulary, emoji or a
 *    long label.
 *
 * And what this world adds:
 *  - THE WATER IS A WALL: a closed ring of colliders round the basin and the canal; the flood fill
 *    never reaches open water, and the shelf ends in a sea nobody can reach.
 *  - THE FROZEN STRETCH CANNOT BE CROSSED: its sheet, two hulls and the walls of ice stand in it, and
 *    nothing walkable lies north of it.
 *  - THE BOSS'S GROUND IS THE ONE `boss-arena.js` NAMES, and it is open.
 *  - THE AIR MOVES: the stack, the still and the standpipe breathe, the sea smoke lifts, the scanner turns.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
import { HOST_PLAN, LANE } from '../src/three/mirrowen/host-plan.js';
const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/mirrowen.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);

const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const C = world.water.channel;
const B = world.water.basin;
const distSeg2 = (x, z, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
};
/** Signed distance to open water, negative over it (the same union terrain.js draws). */
const waterSD = (x, z) => Math.min(Math.hypot(x - B.x, z - B.z) - B.radius, distSeg2(x, z, [C.ax, C.az], [C.bx, C.bz]) - C.half);

console.log(`Mirrowen — ${world.name}, ${world.place}\n`);

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
  // A host's real extent (host-plan.js) and its lane stand clear of every free prop and of the water.
  const rectOf = (site, [x0, x1, z0, z1]) => {
    const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
    const c = Math.cos(a), sn = Math.sin(a);
    const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => [site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c]);
    return { minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])), minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1])), pts };
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
      for (const [x, z] of r.pts) if (waterSD(x, z) < 3) clashes.push(`${s.id}'s ${name} reaches within 3 m of the water`);
    }
  }
  check(clashes.length === 0,
    `${world.sites.length} hosts and their lanes stand clear of every free prop and of the water`,
    `hosts clash with props or water:\n         ${clashes.join('\n         ')}`);
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

/* NOTHING STANDS IN THE WATER but the Fifth's ice (which stands in the frozen stretch, and is built there). */
{
  const wet = world.landmarks.filter(l => l.asset !== 'ice-wall' && waterSD(l.pos[0], l.pos[2]) < l.radius);
  check(wet.length === 0, 'no landmark but the ice stands in the water', `landmarks in the water: ${wet.map(l => `${l.asset}@[${l.pos[0]},${l.pos[2]}]`).join(', ')}`);
  const walls = world.landmarks.filter(l => l.asset === 'ice-wall');
  const stretch = walls.filter(l => l.pos[2] < world.water.frozenZ - 10);
  check(walls.length >= 12 && stretch.length === walls.length, `${walls.length} walls of ice, every one beside or beyond the frozen stretch`, 'an ice wall stands outside the frozen stretch, or too few stand');
  check((world.hulls || []).length >= 2, `${world.hulls.length} hulls frozen into the canal`, 'the frozen canal holds fewer than two hulls');
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit06-states-of-matter.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)',\s*title:\s*["']([^"']+)["']/g)]
  .map(m => ({ id: m[1], title: m[2] }));

{
  const questIds = chartQuests.map(q => q.id);
  check(questIds.length === 7, `unit06 charts ${questIds.length} benches`, `the unit06 chart lists ${questIds.length} benches, not seven`);

  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => !siteQuests.includes(q));
  check(missing.length === 0, 'every unit06 bench has a site on the ground', `quests with no site: ${missing.join(', ')}`);

  const invented = siteQuests.filter(q => !questIds.includes(q));
  check(invented.length === 0, 'every site names a quest the chart actually declares', `sites naming quests that do not exist: ${invented.join(', ')}`);

  const unbuilt = world.sites.filter(s => s.built !== true);
  check(unbuilt.length === 0, 'every site is built', `sites not built: ${unbuilt.map(s => s.id).join(', ')}`);

  const order = world.sites.every((s, i) => s.stage === i + 1 && s.questId === questIds[i] && s.id === `site-${i + 1}`);
  check(order, 'sites are keyed by bench order: site-N is Bench N', 'a site is out of bench order');

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
  const hosts = ['chart-house', 'tank-bay', 'pump-house', 'cutting-yard', 'boiler-house', 'dosing-station', 'distillery'];
  check(world.sites.every((s, i) => s.structure === hosts[i]), 'the seven hosts are the chart house, tank bay, pump house, cutting yard, boiler house, dosing station and distillery', 'a site names the wrong host');
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
  const WITHHELD = ['intermolecular', 'dispersion', 'dipole', 'hydrogen bond', 'vapor pressure', 'vapour pressure', 'molarity', 'dilution', 'chromatography', 'miscible', 'heating curve', 'vaporization', 'fusion', 'polarizab'];
  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  const bad = [];
  for (const str of strings) {
    for (const word of WITHHELD) if (new RegExp(word, 'i').test(str)) bad.push(`"${str}" contains "${word}"`);
  }
  check(bad.length === 0, `${strings.length} player-facing strings withhold the vocabulary`, `withheld vocabulary leaked into the world:\n         ${bad.join('\n         ')}`);
  const emoji = strings.filter(s => /\p{Extended_Pictographic}/u.test(s));
  check(emoji.length === 0, 'the world is emoji-free', `emoji in: ${emoji.join(', ')}`);
  const tooLong = world.sites.filter(s => s.label.split(/\s+/).length > 6).map(s => s.label);
  check(tooLong.length === 0, 'every site label is short enough to read at a glance', `site labels running long: ${tooLong.join(', ')}`);

  // NO SIGN STANDS IN THE WORLD: the builders have no placard (the one tag is the bench's own plate number, in bench-bay.js).
  const files = ['mirrowen.js', 'mirrowen/plant.js', 'mirrowen/stations.js', 'mirrowen/kit.js', 'mirrowen/effects.js'];
  const signs = files.filter(f => /\bplacard\b|\bsign\(/.test(readFileSync(join(root, 'src/three', f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')));
  check(signs.length === 0, 'no builder stands a sign in the world', `a sign is built in: ${signs.join(', ')}`);
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
  check(lanterns >= 18, `${lanterns} work lamps mark the quay between the benches`, `only ${lanterns} work lamps: the quay is unmarked`);
}

/* ------------------------------------------------------- the registration */

{
  const { world3dFor } = await import('../src/learn/worlds3d.js');
  const w = world3dFor('unit06');
  check(Boolean(w) && w.key === 'mirrowen' && w.worldName === 'Mirrowen' && Boolean(w.data), 'worlds3d.js registers unit06 as Mirrowen', 'worlds3d.js does not register unit06 as Mirrowen');
  check(w && world.sites.every(s => w.siteForQuest(s.questId)?.id === s.id), 'every quest finds its site through worlds3d.js', 'a quest cannot find its site');
  const voyage = readFileSync(join(root, 'src/three/voyage.js'), 'utf8');
  check(/mirrowen:\s*\{\s*key: 'mirrowen', name: 'Mirrowen', hash: '#\/learn\/unit06'/.test(voyage), 'the voyage flies to Mirrowen and lands on #/learn/unit06', 'voyage.js has no Mirrowen destination');
  const stage = readFileSync(join(root, 'src/three/stage.js'), 'utf8');
  check(/new MirrowenWorld\(this\.renderer\)/.test(stage) && /enterMirrowenScene/.test(stage) && /w === this\.mirrowenWorld/.test(stage) && /setMirrowenSiteComplete/.test(stage) && /key === "mirrowen"\) return MIRROWEN_EXPOSURE/.test(stage),
    'stage.js builds, enters, warms and lights Mirrowen like the other Learn worlds', 'stage.js is missing a Mirrowen hook (build, enter, isLearnWorld, site indicator or exposure)');
  const inst = readFileSync(join(root, 'src/learn/engine/instruments.js'), 'utf8');
  const need = [...chartQuests.map(q => q.id), 'boss-undertow'].filter(id => !inst.includes(`'${id}'`));
  check(need.length === 0, 'every Mirrowen bench and the Undertow are on the built-bench list', `instruments.js does not list: ${need.join(', ')}`);
}

/* ------------------------------------------- the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-undertow':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && same(player, world.arena.player) && same(boss, world.arena.boss) && /worldId:\s*'unit06'/.test(m[1]) && /species:\s*'the undertow'/.test(m[1]),
    `the Undertow is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Undertow at ${boss.join(',')} / player ${player.join(',')}, but the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const THREE = await import('three');
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const { MirrowenWorld, waterRing } = await import('../src/three/mirrowen.js');

  let built = null;
  try {
    built = new MirrowenWorld(null);
  } catch (err) {
    check(false, 'the world builds', `MirrowenWorld threw while building: ${err.stack || err.message}`);
  }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 250, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built: something failed silently`);

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `the ground ends ${Math.round(r)} m out: there is an edge to fall off the world`);
    check(built.waterMesh?.userData.phys === 'ground' && built.iceMesh?.userData.phys === 'ground' && built.seaMesh?.userData.phys === 'ground',
      'the water, the ice sheet and the sea are laid in the ground, as ground', 'the water, the sheet or the sea is missing, or is a body');
    check(tb.max.y > 60, `the walls of ice stand ${Math.round(tb.max.y)} m over the shelf`, 'the horizon is flat: no wall of ice stands round the shelf');
    const shoreY = built.getTerrainHeight(world.shore + 14, 0);
    check(shoreY < built.field.LEVEL - 1.5, `past the shelf the sea bed lies ${(-shoreY).toFixed(1)} m down, under the sea`, 'the shelf does not end in the sea');
    const wl = built.field.LEVEL;
    check(built.getTerrainHeight(B.x, B.z) < wl - 1 && built.getTerrainHeight(C.bx, C.bz + 30) < wl - 1, 'the basin and the canal are deep water', 'the basin or the canal is shallow');

    /* THE WATER IS A WALL. */
    {
      const ring = built.waterColliders;
      const again = waterRing(built.field, world);
      check(ring.length > 150 && ring.length === again.length, `the water is ringed by ${ring.length} colliders`, 'the water ring is missing or not what waterRing() returns');
      // Every point of the offset outline has a collider within a pace of it.
      let gaps = 0;
      const near = (x, z) => ring.some(c => Math.hypot(c.x - x, c.z - z) < 0.9);
      const probe = (x, z) => { if (waterSD(x, z) >= 0.5 && !near(x, z)) gaps++; };
      const off = 0.55;
      for (let a = 0; a < Math.PI * 2; a += 0.01) probe(B.x + Math.sin(a) * (B.radius + off), B.z + Math.cos(a) * (B.radius + off));
      for (let z = C.az; z >= C.bz; z -= 0.4) for (const s of [-1, 1]) probe(C.ax + s * (C.half + off), z);
      for (let a = -Math.PI / 2; a <= Math.PI / 2; a += 0.01) probe(C.bx + Math.sin(a) * (C.half + off), C.bz - Math.cos(a) * (C.half + off));
      check(gaps === 0, 'the ring has no gap along the quay edge or the canal banks', `${gaps} points of the quay edge have no collider within a pace`);
    }

    /* THE AIR MOVES. */
    {
      check(built.hostVents.length >= 3, `${built.hostVents.length} plumes rise off the stack, the still and the standpipe`, 'the plant breathes fewer than three plumes');
      const scanners = built.movers.filter(o => o.userData.mover.kind === 'yaw').length;
      check(scanners >= 1, `${scanners} radar scanner turns over the chart house`, 'nothing turns in the harbour');
      const before = built.movers[0].rotation.y;
      built.update(0.5, new THREE.Vector3(3, 1.7, 80));
      check(built.movers[0].rotation.y !== before, 'the scanner turns when the world updates', 'the scanner did not turn');
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

    /* A round thing is never turned as a group. */
    {
      const turned = built.landmarkNodes.filter(({ lm, node }) => ['ice-wall', 'bollard', 'harbour-light'].includes(lm.asset) && Math.abs(node.rotation.y) > 1e-9);
      check(turned.length === 0, 'no round landmark is turned as a group (ice walls, bollards, the light)', `${turned.length} round landmarks are turned as a group`);
    }

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
      const strangers = [...lit].filter(m => m !== built.M.lantern);
      check(strangers.length === 0, `${lit.size} emissive material: the work lamps; nothing else in the world is lit`,
        `${strangers.length} emissive material(s) that are not a work lamp`);
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
      check(Math.max(...flat) - Math.min(...flat) < 0.02, `${site.id}: the ground under the bench is level`, `${site.id}: the ground under the bench varies by ${(Math.max(...flat) - Math.min(...flat)).toFixed(2)}u`);
    }

    /* THE WALK. Flood-fill the ground from the spawn against the real colliders, with the player's own radius. */
    const R = 0.25;
    const CELL = 0.5;
    const MIN = -100;
    const N = Math.round(200 / CELL);
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
    let wettest = Infinity;
    let steepest = 0;
    let inChannel = 0;
    for (let k = 0; k < seen.length; k++) {
      if (!seen[k]) continue;
      reached++;
      const x = at((k / N) | 0), z = at(k % N);
      lowest = Math.min(lowest, built.getTerrainHeight(x, z));
      wettest = Math.min(wettest, waterSD(x, z));
      steepest = Math.max(steepest, Math.abs(built.getTerrainHeight(x + 0.5, z) - built.getTerrainHeight(x, z)), Math.abs(built.getTerrainHeight(x, z + 0.5) - built.getTerrainHeight(x, z)));
      if (z < C.az && Math.abs(x - C.ax) < C.half + 0.5) inChannel++;
    }
    check(ledges.length === 0, `${reached} cells of ground are walkable, and none of them drops off a ledge`,
      `the player can walk off a drop the walk would fall down:\n         ${ledges.join('\n         ')}`);
    check(steepest < 0.45, `the steepest step a player can take is ${steepest.toFixed(2)} m in half a metre: no hill is climbed`, `a player can walk a slope of ${steepest.toFixed(2)} m in half a metre`);
    check(wettest > 0.4, `the walk comes no nearer open water than ${wettest.toFixed(1)} m: the water is a wall`, `a player can walk ${(-wettest).toFixed(1)} m into the water`);
    check(lowest > -0.4, `the lowest ground a player can reach is ${lowest.toFixed(2)} m: nobody reaches the sea`, `a player can reach ground at ${lowest.toFixed(2)} m: the water leaks`);
    check(inChannel === 0 && C.bz - C.half <= -100, 'nobody can walk the canal, and its rounded end lies past the edge of the walk: the frozen stretch cannot be crossed or walked round', `${inChannel} walkable cells lie in the canal's width, or the canal ends at z ${C.bz - C.half} inside the walk`);

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

    /* THE FROZEN STRETCH: hulls and ice stand in the sheet, inside the canal, and the sheet is closed at its end. */
    {
      const bad = [];
      for (const h of world.hulls) {
        const node = built.scene.children.find(o => o.name === `${h.tug ? 'tug' : 'cargo-ship'}@${h.x},${h.z}`);
        if (!node) { bad.push(`${h.tug ? 'tug' : 'cargo-ship'} at ${h.z} was not built`); continue; }
        node.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(node);
        if (b.min.x < C.ax - C.half || b.max.x > C.ax + C.half) bad.push(`the hull at z ${h.z} is wider than the canal`);
        if (b.max.z > world.water.frozenZ + 0.5 || b.min.z < C.bz - C.half) bad.push(`the hull at z ${h.z} lies outside the frozen stretch`);
      }
      check(bad.length === 0, 'the hulls lie inside the canal, in the frozen stretch', bad.join('\n         '));
      const open = built.waterMesh.geometry.boundingBox;
      const sheet = built.iceMesh.geometry.boundingBox;
      check(open.min.z >= world.water.frozenZ - 0.6 && sheet.max.z <= world.water.frozenZ + 1.2 && sheet.min.z < C.bz, 'open water ends where the sheet begins, and the sheet runs to the end of the canal', `open water reaches z ${open.min.z.toFixed(1)}, the sheet z ${sheet.max.z.toFixed(1)}`);
    }

    /* A HOST STANDS INSIDE THE EXTENT IT DECLARES, and the declaration is not slack. */
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

    /* THE LEVEL GROUND UNDER EVERY HOST. */
    {
      const bad = [];
      for (const site of world.sites) {
        const plan = HOST_PLAN[site.id];
        const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
        const c = Math.cos(a), sn = Math.sin(a);
        const atL = (lx, lz) => [site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c];
        const hs = [];
        const [x0, x1, z0] = plan.extent;
        for (let lx = x0; lx <= x1; lx += 1.5) for (let lz = z0; lz <= LANE.to; lz += 1.5) { const [x, z] = atL(lx, lz); hs.push(built.getTerrainHeight(x, z)); }
        const spread = Math.max(...hs) - Math.min(...hs);
        if (spread > 0.35) bad.push(`${site.id}: the ground under its host and lane varies by ${spread.toFixed(2)} m`);
      }
      check(bad.length === 0, 'the ground under every host and its lane is level', bad.join('\n         '));
    }

    /* NO FIELD POINTS: no fetch in Mirrowen carries new evidence yet. */
    {
      const { fieldPointsOf } = await import('../src/three/field-points.js');
      const points = fieldPointsOf(built);
      check(points.length === 0, 'no field point is registered', `field points registered: ${points.map(p => p.id).join(', ')}`);
    }

    /* A TABLE IS WORKED BY ITS LAMP. A work lamp hangs over every plate, a `lampMark` in the pool. */
    {
      const bad = [];
      for (const site of world.sites) {
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
      check(bad.length === 0, `every bench (${world.sites.length}) has a lamp over its plate`, `tables with no lamp:\n         ${bad.join('\n         ')}`);
    }

    const pad = world.landmarks.find(l => l.asset === 'landing-pad');
    check(reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the rest of the ground', 'the landing pad is walled off from the spawn');
    const A = world.arena;
    check(reachable(A.player[0], A.player[2], 1.0) && reachable(A.boss[0], A.boss[2], 1.0), "the Undertow's ground and the player's mark in front of it are walkable", "the boss's ground is sealed off");
    {
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Undertow are open ground', 'something stands within seven metres of the Undertow');
      const ice = world.landmarks.filter(l => l.asset === 'ice-wall' && dist(l.pos, A.boss) < 24);
      check(ice.length >= 1, 'the wall of ice stands behind the boss', 'no ice stands behind the Undertow');
    }
  }
}

console.log('');
if (failures) {
  console.log(`MIRROWEN FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('MIRROWEN OK');
