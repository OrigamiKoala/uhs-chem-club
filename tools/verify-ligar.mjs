#!/usr/bin/env node
/**
 * verify-ligar.mjs — Integrity check of Ligar, the Learn world 02 ground.
 *
 * Every rule `verify:tallow` holds Tallow to, held to Ligar, plus the two that
 * a quarry needs and a salt pan did not:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE, from the declaration (every footprint
 *    disjoint) AND from the world as built: the real `LigarWorld` is constructed
 *    in Node and every pair of bodies measured, including every column in every
 *    instanced field, which records its instances as part boxes.
 *  - Every Unit 2 quest has a site, every site names a real quest, and a site's
 *    `built` flag agrees with the chart.
 *  - A SITE LABEL IS A SIGNPOST: it reads `Bench N - <the quest's title>`, so a
 *    player choosing where to walk knows what each bench teaches.
 *  - Every site FACES ITS APPROACH, so the player walks up to the front of a
 *    bench and never round the back of its wall.
 *  - THE PLAYER CAN WALK TO EVERY BENCH. The ground is flood-filled from the
 *    spawn against the real colliders and the real walking surface, and each
 *    site's working spot has to be reached ON ITS OWN FLOOR.
 *  - THE CUT IS SEALED EXCEPT BY THE RAMP. Nowhere the player can reach may
 *    drop more than a step to its neighbour: the walk clamps the camera to the
 *    ground, so an unguarded ledge is somewhere a player falls five metres.
 *  - THE HILLS ARE NOT CLIMBED, AND THE WORKINGS ARE SOUND (`ligar/mine-plan.js`).
 *    Every doorway has a partner at the same height, every grade is walkable,
 *    every working has rock over its roof, every chamber holds its bench's bay,
 *    nothing reachable stands on a hill, and every underground bench is reached
 *    by the route the guide follows.
 *  - NOTHING UNDER A HILL IS LIT BUT A LAMP. The sun and the sky's fill are taken
 *    out of every fragment in a working (the cover mask, and its shader patch
 *    lands), every working has a lamp, and the only emissive surfaces anywhere
 *    are lamps, the forge and the benches' indicators.
 *  - T4-only landmarks are decoration: removing them strands nothing.
 *  - No player-facing string carries withheld vocabulary, emoji, or a long label.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/ligar.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);

const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log(`Ligar — ${world.name}, ${world.place}\n`);

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

const { makeMinePlan, hillDistance, hillsHeight, ROOF, PROUD_MAX, RING } = await import('../src/three/ligar/mine-plan.js');
const plan = makeMinePlan(world);
const underground = s => plan.volumeAt(s.pos[0], s.pos[2]) !== null;

{
  const surface = world.sites.filter(s => !underground(s));
  const clashes = [];
  for (const s of surface) {
    for (const l of world.landmarks) {
      // A host's landmark is the circle its machinery stands in; its own bench is inside it.
      if (l.host === s.id) continue;
      const d = dist(s.pos, l.pos);
      if (d < l.radius + 2.2) clashes.push(`${s.id} is inside ${l.asset} (${d.toFixed(2)}u)`);
    }
  }
  check(clashes.length === 0,
    `${surface.length} surface sites stand clear of every prop but their own host`,
    `sites clash with props:\n         ${clashes.join('\n         ')}`);
}

{
  const clashes = [];
  for (let i = 0; i < world.sites.length; i++) {
    for (let j = i + 1; j < world.sites.length; j++) {
      const a = world.sites[i];
      const b = world.sites[j];
      if (Math.abs(a.pos[1] - b.pos[1]) > 2 && underground(a) === underground(b)) continue;
      // Benches in different workings are rock apart however near they stand in plan.
      if (underground(a) && underground(b) && plan.volumeAt(a.pos[0], a.pos[2]) !== plan.volumeAt(b.pos[0], b.pos[2])) continue;
      if (underground(a) !== underground(b)) continue;
      const d = dist(a.pos, b.pos);
      if (d < 8) clashes.push(`${a.id} and ${b.id} are ${d.toFixed(1)}u apart`);
    }
  }
  check(clashes.length === 0,
    'no two sites on the same floor are within 8u of each other',
    `sites crowd each other:\n         ${clashes.join('\n         ')}`);
}

{
  // A surface bench is built into a host: one landmark declares the footprint its machinery stands in, the
  // bench is inside it, and the approach is not (the host sits behind the plate, never across the lane).
  const surface = world.sites.filter(s => !underground(s));
  const bad = [];
  for (const s of surface) {
    const hosts = world.landmarks.filter(l => l.host === s.id);
    if (hosts.length !== 1) { bad.push(`${s.id} has ${hosts.length} host landmarks`); continue; }
    const h = hosts[0];
    if (dist(s.pos, h.pos) > h.radius + 1) bad.push(`${s.id}'s bench is ${dist(s.pos, h.pos).toFixed(1)}u from its host (radius ${h.radius})`);
    if (dist(s.approachPos, h.pos) < h.radius + 0.5) bad.push(`${s.id}'s approach is inside its host`);
  }
  const stray = world.landmarks.filter(l => l.host && !world.sites.some(s => s.id === l.host));
  check(bad.length === 0 && stray.length === 0, `${surface.length} surface benches each stand beside their one host, and the approach is clear of it`,
    `host landmarks wrong:\n         ${[...bad, ...stray.map(l => `${l.asset} names no site`)].join('\n         ')}`);

  // The warden is fought in front of the ramp's head: its ground is open, and nothing's footprint reaches it.
  const arena = world.landmarks.filter(l => !l.host && dist(l.pos, [0, 0, 2]) < l.radius + 6 && l.asset !== 'landing-pad');
  check(arena.length === 0, "nothing stands on the warden's ground", `props on the warden's ground: ${arena.map(l => l.asset).join(', ')}`);
}

/* ------------------------------------------------------------------ the cut */

{
  const sub = world.sublevel;
  const r = sub.room;
  const s = sub.stair;

  check(sub.floorY < -1, `the quarry floor is ${-sub.floorY}u below the flat`,
    `sublevel.floorY is ${sub.floorY}: the cut is not a cut`);

  check(Math.abs(s.minZ - r.maxZ) < 0.001,
    'the ramp foot meets the quarry wall',
    `stair.minZ (${s.minZ}) does not meet room.maxZ (${r.maxZ})`);

  check(s.minX >= r.minX && s.maxX <= r.maxX,
    'the ramp opening is inside the wall it cuts through',
    'the ramp is wider than the wall it opens into');

  const run = Math.abs(s.maxZ - s.minZ);
  const rise = Math.abs(sub.floorY);
  const grade = rise / run;
  check(grade <= 0.75,
    `the ramp falls ${rise}u over ${run}u (grade ${grade.toFixed(2)})`,
    `the ramp grade is ${grade.toFixed(2)}: too steep to walk down`);

  // The lava tube is the quarry's, and no bench stands in the cut any more: the forge is in the ore drift.
  const inCut = world.sites.filter(x => x.pos[0] > r.minX && x.pos[0] < r.maxX && x.pos[2] > r.minZ && x.pos[2] < r.maxZ);
  check(inCut.length === 0, 'no bench stands in the quarry\'s cut',
    `benches in the cut: ${inCut.map(x => x.id).join(', ')}`);
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit03-bonding.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)',\s*title:\s*'([^']+)'/g)]
  .map(m => ({ id: m[1], title: m[2] }));

{
  const questIds = chartQuests.map(q => q.id);
  const live = new Set(
    [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)'[\s\S]*?status:\s*'(\w+)'/g)]
      .map(m => [m[1], m[2]]).filter(([, st]) => st === 'live').map(([id]) => id)
  );

  check(questIds.length > 0, `unit03 charts ${questIds.length} quests`, 'could not read the unit03 chart');

  // Every BUILT quest needs ground to stand on. A charted quest does not yet:
  // Ligar charts more benches than it has laid out, and a site is laid out
  // when its bench is built.
  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => live.has(q) && !siteQuests.includes(q));
  check(missing.length === 0, 'every built unit03 quest has a site on the ground',
    `quests with no site: ${missing.join(', ')}`);

  const invented = siteQuests.filter(q => !questIds.includes(q));
  check(invented.length === 0, 'every site names a quest the chart actually declares',
    `sites naming quests that do not exist: ${invented.join(', ')}`);

  const wrong = world.sites.filter(s => s.built !== live.has(s.questId));
  check(wrong.length === 0, 'built sites are exactly the quests with a module',
    `sites whose built flag disagrees with the chart: ${wrong.map(s => s.id).join(', ')}`);

  // A SITE LABEL NAMES ITS BENCH in the Star Map, the guide and the [E] prompt (no sign stands
  // in the world). It is the quest's own title, numbered, so it cannot drift from what the bench teaches.
  const off = [];
  for (const s of world.sites) {
    const q = chartQuests.find(x => x.id === s.questId);
    const want = q ? `Bench ${s.stage} - ${q.title}` : null;
    if (s.label !== want) off.push(`${s.id} reads "${s.label}", want "${want}"`);
  }
  check(off.length === 0, 'every site label names its bench by the quest it teaches',
    `site labels that do not name their bench:\n         ${off.join('\n         ')}`);
}

{
  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length, 'site stage numbers are unique',
    'two sites claim the same stage number');

  const bad = world.sites.filter(s => {
    const d = dist(s.pos, s.approachPos);
    return d < 1.5 || d > 8;
  });
  check(bad.length === 0, 'every site has a usable approach mark',
    `approach marks out of range: ${bad.map(s => s.id).join(', ')}`);
}

/* -------------------------------------------------------------- tier parity */

{
  const t4Only = world.landmarks.filter(l => l.minTier === 'T4');
  const t3World = world.landmarks.filter(l => l.minTier !== 'T4');

  check(t4Only.length > 0, `${t4Only.length} landmarks are T4 decoration`,
    'no T4 decoration declared');

  const blocked = [];
  for (const s of world.sites) {
    for (const l of t3World) {
      if (dist(s.approachPos, l.pos) < l.radius + 0.5) {
        blocked.push(`${s.id}'s approach is blocked by ${l.asset}`);
      }
    }
  }
  check(blocked.length === 0, 'every site is reachable with all T4 decoration removed',
    `approach marks blocked at T3:\n         ${blocked.join('\n         ')}`);

  check(JSON.stringify(world.t1.siteOrder) === JSON.stringify(world.sites.map(s => s.id)),
    'the sites are listed in order for a player with no 3D view', 'the T1 site order does not match the sites');
  check(world.sites.every(s => world.t2.stillCamera[s.id]),
    'every site has a still framing for the baked tier', 'a site has no T2 still camera');
}

/* ---------------------------------------------------------------- the words */

{
  const WITHHELD = [
    'nucleophile', 'electrophile', 'carbonyl', 'carbocation',
    'alkyl', 'ester', 'epoxide', 'isopropyl'
  ];
  const strings = [
    world.name, world.place, world.oneLine,
    ...world.sites.map(s => s.label)
  ];
  const bad = [];
  for (const str of strings) {
    for (const word of WITHHELD) {
      if (new RegExp(`\\b${word}s?\\b`, 'i').test(str)) bad.push(`"${str}" contains "${word}"`);
    }
  }
  check(bad.length === 0, `${strings.length} player-facing strings withhold the vocabulary`,
    `withheld vocabulary leaked into the world:\n         ${bad.join('\n         ')}`);

  const emoji = strings.filter(s => /\p{Extended_Pictographic}/u.test(s));
  check(emoji.length === 0, 'the world is emoji-free', `emoji in: ${emoji.join(', ')}`);

  const tooLong = world.sites.filter(s => s.label.split(/\s+/).length > 6).map(s => s.label);
  check(tooLong.length === 0, 'every site label is short enough to read at a glance',
    `site labels running long: ${tooLong.join(', ')}`);
}

/* -------------------------------------------------------------------- spawn */

{
  const spawn = world.spawn;
  const inProp = world.landmarks.find(l => l.asset !== 'landing-pad' && dist(spawn.pos, l.pos) < l.radius + 0.5);
  check(!inProp, 'the player does not spawn inside anything', `spawn is inside ${inProp?.asset}`);

  const nearest = Math.min(...world.sites.map(s => dist(spawn.pos, s.pos)));
  check(nearest < 60, `the nearest site is ${nearest.toFixed(0)}u from the pad`,
    `the nearest site is ${nearest.toFixed(0)}u away: too far to find`);

  const [sx, sz] = world.terrain.size;
  const outside = world.landmarks.filter(l => Math.abs(l.pos[0]) > sx / 2 || Math.abs(l.pos[2]) > sz / 2);
  check(outside.length === 0, 'every landmark stands on the terrain',
    `landmarks off the edge of the world: ${outside.map(l => l.asset).join(', ')}`);
}

/* ------------------------------------------------------------- the workings
 *
 * The plan (`ligar/mine-plan.js`) read as data: nothing here builds a mesh. What the hills and the
 * mine are made of is measured below, in the world as built.
 */

{
  const { makeLigarField } = await import('../src/three/ligar/terrain.js');
  const field = makeLigarField(world.terrain.maxHeight, world.hills);
  const plain = makeLigarField(world.terrain.maxHeight, []);
  const V = plan.volumes;
  const tunnels = plan.tunnels, cuttings = plan.cuttings;

  check(world.hills.length >= 2 && world.hills.every(h => h.H >= 12 && h.H <= 18),
    `${world.hills.length} trap-bench hills, ${world.hills.map(h => h.H).join(' and ')} m high (the plan's 12-18)`,
    'the hills are not two or three, 12-18 m high');
  check(world.hills.every(h => cuttings.some(c => c.hill === h.id)),
    'every hill has a cutting dug into its face', 'a hill has no way in');

  // A doorway has a partner on the other side of one plane, at the one height.
  const OPP = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' };
  const planeOf = (v, side) => v.rect[side];
  const doorBad = [];
  let doors = 0;
  for (const v of V) {
    for (const o of v.openings) {
      if (o.to === null) continue;
      doors++;
      const w = plan.byId.get(o.to);
      const back = w?.openings.find(p => p.to === v.id && p.side === OPP[o.side] && Math.abs(p.lo - o.lo) < 0.011 && Math.abs(p.hi - o.hi) < 0.011);
      if (!back) { doorBad.push(`${v.id} -> ${o.to} has no partner`); continue; }
      if (Math.abs(planeOf(v, o.side) - planeOf(w, back.side)) > 0.011) doorBad.push(`${v.id} and ${o.to} do not share a plane`);
      const p = plan.doorPoint(v, o);
      const dy = Math.abs(plan.floorOf(v, p[0], p[1]) - plan.floorOf(w, p[0], p[1]));
      if (dy > 0.03) doorBad.push(`${v.id} and ${o.to} meet at two heights (${dy.toFixed(2)} m)`);
    }
  }
  check(doorBad.length === 0, `${doors} doorways, each with a partner on the same plane and at the same height`,
    `doorways that do not meet:\n         ${doorBad.join('\n         ')}`);

  const steep = V.filter(v => v.floor.y1 !== undefined && Math.abs(v.floor.y1 - v.floor.y0) / Math.abs(v.floor.to - v.floor.from) > 0.105);
  check(steep.length === 0, 'every grade is 6 degrees or less', `too steep to walk: ${steep.map(v => v.id).join(', ')}`);

  const narrow = V.filter(v => v.kind !== 'chamber' && Math.min(v.rect.maxX - v.rect.minX, v.rect.maxZ - v.rect.minZ) < 3.6);
  check(narrow.length === 0, 'every drift is at least 3.6 m across', `drifts too narrow: ${narrow.map(v => v.id).join(', ')}`);
  const room = V.filter(v => v.kind === 'chamber' && (Math.min(v.rect.maxX - v.rect.minX, v.rect.maxZ - v.rect.minZ) < 7.5 || Math.max(v.rect.maxX - v.rect.minX, v.rect.maxZ - v.rect.minZ) < 9));
  check(room.length === 0, 'every chamber is at least 7.5 x 9 m, and the roof 4.2 m or more',
    `chambers too small: ${room.map(v => v.id).join(', ')}`);
  check(world.mine.roof >= 4.2, `the roof is ${world.mine.roof} m above the floor`, 'the roof is under 4.2 m');

  // Rock over every roof, and every working well inside its hill.
  const bad = [];
  for (const v of tunnels) {
    const hill = world.hills.find(h => h.id === v.hill);
    const r = v.rect;
    for (let x = r.minX; x <= r.maxX + 1e-6; x += Math.max(0.5, (r.maxX - r.minX) / 10)) {
      for (let z = r.minZ; z <= r.maxZ + 1e-6; z += Math.max(0.5, (r.maxZ - r.minZ) / 10)) {
        const cover = field.height(x, z) - (plan.floorOf(v, x, z) + ROOF + 0.8);
        if (cover < 1.4) bad.push(`${v.id} at (${x.toFixed(1)}, ${z.toFixed(1)}): ${cover.toFixed(2)} m of rock`);
        if (hillDistance(hill, x, z) > -1.4) bad.push(`${v.id} at (${x.toFixed(1)}, ${z.toFixed(1)}) is at the edge of ${hill.id}`);
      }
    }
  }
  check(bad.length === 0, `${tunnels.length} roofed workings, each under at least 1.4 m of rock and inside its hill`,
    `workings too near the surface:\n         ${bad.slice(0, 8).join('\n         ')}`);

  // A cutting's foot is on the ground, not above or below it.
  const foot = [];
  for (const c of cuttings) {
    const o = c.openings.find(p => p.to === null);
    const x = o.side === 'minX' ? c.rect.minX : c.rect.maxX;
    const z = (c.rect.minZ + c.rect.maxZ) / 2;
    const dy = plan.floorOf(c, x, z) - plain.height(x, z);
    if (Math.abs(dy) > 0.08) foot.push(`${c.id} (${dy.toFixed(2)} m)`);
    if (field.height(x, z) - plain.height(x, z) > 0.05) foot.push(`${c.id} starts on the hill`);
  }
  check(foot.length === 0, `${cuttings.length} cuttings meet the ground at their foot`, `cuttings that do not meet the ground: ${foot.join(', ')}`);

  // Each bench stands in exactly one chamber, on its floor, with the bay inside the walls' faces.
  const bays = [];
  for (const s of world.sites.filter(underground)) {
    const v = plan.volumeAt(s.pos[0], s.pos[2]);
    if (!v || v.kind !== 'chamber') { bays.push(`${s.id} is not in a chamber`); continue; }
    if (Math.abs(plan.floorOf(v, s.pos[0], s.pos[2]) - s.pos[1]) > 0.011) bays.push(`${s.id} is not on its chamber's floor`);
    const f = [(s.approachPos[0] - s.pos[0]) / 5, (s.approachPos[2] - s.pos[2]) / 5];
    const corner = (lx, lz) => [s.pos[0] + lx * f[1] + lz * f[0], s.pos[2] - lx * f[0] + lz * f[1]];
    for (const [lx, lz] of [[-2.7, -1.95], [2.7, -1.95], [-2.7, 5.5], [2.7, 5.5]]) {
      const [x, z] = corner(lx, lz);
      const r = v.rect, m = PROUD_MAX;
      if (x < r.minX + m || x > r.maxX - m || z < r.minZ + m || z > r.maxZ - m) bays.push(`${s.id}'s bay corner (${lx}, ${lz}) is outside the walls of ${v.id}`);
    }
  }
  check(bays.length === 0, `${world.sites.filter(underground).length} underground benches, each on its chamber's floor with its whole bay inside the walls`,
    `bays outside their chambers:\n         ${bays.join('\n         ')}`);

  // The cover mask holds what the plan needs.
  const { COVER_PER_HILL, COVER_HILLS } = await import('../src/three/ligar/atmosphere.js');
  const perHill = world.hills.map(h => tunnels.filter(v => v.hill === h.id).length);
  check(world.hills.length <= COVER_HILLS && perHill.every(n => n <= COVER_PER_HILL),
    `the cover mask holds every roofed working (${perHill.join(' and ')} of ${COVER_PER_HILL} each)`,
    `the cover mask is too small: ${perHill.join(', ')} roofed workings against ${COVER_PER_HILL} per hill`);

  // The guide leads through the doorways.
  const spawnAt = [world.spawn.pos[0], world.spawn.pos[2]];
  const routes = world.sites.filter(underground).map(s => [s, plan.routeTo(spawnAt[0], spawnAt[1], s.approachPos[0], s.approachPos[2])]);
  check(routes.every(([, r]) => r.length >= 3),
    `the guide leads to every underground bench through its portal and doorways (longest route ${Math.max(...routes.map(([, r]) => r.length))} legs)`,
    `a bench has no route: ${routes.filter(([, r]) => r.length < 3).map(([s]) => s.id).join(', ')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  installDomShim({ tier: 'T4' });
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const { LigarWorld } = await import('../src/three/ligar.js');

  let built = null;
  try {
    built = new LigarWorld(null);
  } catch (err) {
    check(false, 'the world builds', `LigarWorld threw while building: ${err.stack || err.message}`);
  }

  if (built) {
    let meshes = 0;
    let instances = 0;
    built.scene.traverse(o => {
      if (o.isMesh) meshes++;
      if (o.isInstancedMesh) instances += o.count;
    });
    check(meshes > 300, `the world builds — ${meshes} meshes, ${instances} instanced bodies`,
      `only ${meshes} meshes were built: something failed silently`);

    // An instanced field is measured per instance, or not at all. A field with
    // no recorded boxes would be read as its unit body at its origin.
    const unrecorded = [];
    built.scene.traverse(o => {
      if (o.isInstancedMesh && !(o.userData.partBoxes?.length === o.count)) {
        unrecorded.push(o.parent?.name || o.name || o.uuid.slice(0, 6));
      }
    });
    check(unrecorded.length === 0, 'every instanced field records a box per instance',
      `instanced fields the overlap check cannot see into: ${unrecorded.join(', ')}`);

    /* THE STONE IS COLUMNAR, NOT HEXAGONAL. Every rock is a merged mesh of
       real cells (ligar/basalt.js): irregular, vertex-toned, and recording
       one box per column so the checks below can see each one. The world
       used to be one unit hexagon, instanced, and the first thing to go
       wrong in a rebuild is a builder quietly falling back to one. */
    {
      const rocks = [];
      built.scene.traverse(o => {
        if (o.isMesh && Array.isArray(o.material) && o.material.length === 2 && o.geometry.attributes.color) rocks.push(o);
      });
      const parts = rocks.reduce((n, o) => n + (o.userData.partBoxes?.length || 0), 0);
      const blind = rocks.filter(o => o.name !== 'vista-rock' && !(o.userData.partBoxes?.length));
      check(rocks.length >= 20 && parts > 2000 && blind.length === 0,
        `${rocks.length} merged basalt meshes carry ${parts} columns and pieces, each boxed`,
        `the basalt kit is not in use or its bodies are unboxed (${rocks.length} meshes, ${parts} parts, ${blind.length} unboxed)`);
      let r = 0;
      built.terrainMesh.geometry.computeBoundingBox();
      const tb = built.terrainMesh.geometry.boundingBox;
      r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
      check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`,
        `the ground ends ${Math.round(r)} m out: there is an edge to fall off the world`);
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
    check(pairs.size === 0,
      `no two bodies share space — ${meshes} meshes and ${instances} instances measured`,
      `bodies occupy the same space:\n${[...pairs.entries()]
        .map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`)
        .join('\n')}`);

    /* NOTHING IS BURIED. The overlap check cannot see a body sunk wholly into
       the ground, because the ground is exempt from it — and that is how four
       conveyors once stood with their tails five metres under the flat. A part
       whose top is below the walking surface under it is geometry nobody can
       see, in a place its builder did not mean. Bedding a foot into the ground
       is fine; burying the whole part is not. */
    {
      const THREE = await import('three');
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
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        test(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), o);
      });
      check(buried.length === 0, 'no body is buried under the ground it stands on',
        `bodies buried under the ground:\n         ${buried.join('\n         ')}`);
    }

    /* EVERY SITE FACES ITS APPROACH, and its bench deploys onto a real plate. */
    for (const site of world.sites.filter(s => s.built)) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: the bench reports a working surface`,
        `${site.id} is built but has no bench anchor to deploy onto`);
      if (!anchor) continue;

      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces the ground the player walks in from`,
        `${site.id}: faces ${anchor.rotationY.toFixed(2)} rad, but its approach is at ${want.toFixed(2)}`);

      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05,
        `${site.id}: the plate is at ${anchor.topY.toFixed(2)}u, standing on ground at ${ground.toFixed(2)}u`,
        `${site.id}: bench top at ${anchor.topY.toFixed(2)}, but the ground under it is ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: the cased instrument can be opened`,
        `${site.id}: no dormant cabinet, so deploying would draw two instruments in one place`);
    }

    /* THE WALK. Flood-fill the ground from the spawn against the real colliders,
       with the player's own radius, exactly as `FpsControls` resolves them. */
    const R = 0.25;
    const CELL = 0.5;
    const MIN = -100;
    const N = Math.round(200 / CELL);
    const blocked = (x, z) => {
      for (const c of built.colliders) {
        if (c.radius != null) {
          if (Math.hypot(x - c.x, z - c.z) < c.radius + R) return true;
        } else if (x > c.minX - R && x < c.maxX + R && z > c.minZ - R && z < c.maxZ + R) {
          return true;
        }
      }
      return false;
    };
    const idx = (i, j) => i * N + j;
    const at = i => MIN + (i + 0.5) * CELL;
    const seen = new Uint8Array(N * N);
    const height = new Float32Array(N * N).fill(NaN);
    const si = Math.floor((world.spawn.pos[0] - MIN) / CELL);
    const sj = Math.floor((world.spawn.pos[2] - MIN) / CELL);
    const queue = [[si, sj]];
    seen[idx(si, sj)] = 1;
    const ledges = [];
    while (queue.length) {
      const [i, j] = queue.pop();
      const x = at(i);
      const z = at(j);
      const h = built.getTerrainHeight(x, z);
      height[idx(i, j)] = h;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
        if (seen[idx(ni, nj)]) continue;
        const nx = at(ni);
        const nz = at(nj);
        if (blocked(nx, nz)) continue;
        // A drop the walk would take in one step is a ledge the player falls
        // off, since the walk clamps to the ground with no step limit. It is
        // recorded rather than refused, because that is the failure.
        const nh = built.getTerrainHeight(nx, nz);
        if (Math.abs(nh - h) > 0.6 && ledges.length < 8) {
          ledges.push(`(${x.toFixed(1)}, ${z.toFixed(1)}) ${h.toFixed(2)}u -> (${nx.toFixed(1)}, ${nz.toFixed(1)}) ${nh.toFixed(2)}u`);
        }
        seen[idx(ni, nj)] = 1;
        queue.push([ni, nj]);
      }
    }
    let reached = 0;
    for (let k = 0; k < seen.length; k++) reached += seen[k];
    check(ledges.length === 0,
      `${reached} cells of ground are walkable, and none of them drops off a ledge`,
      `the player can walk off a drop the walk would fall down:\n         ${ledges.join('\n         ')}`);

    for (const site of world.sites) {
      // Somewhere within arm's reach of the bench — close enough that
      // `learnWorldAimTargets`' 3 m reach meets it when the player looks at it —
      // reachable from the spawn and on the bench's own floor.
      let found = false;
      for (let i = 0; i < N && !found; i++) {
        for (let j = 0; j < N && !found; j++) {
          if (!seen[idx(i, j)]) continue;
          if (Math.hypot(at(i) - site.pos[0], at(j) - site.pos[2]) > 3.2) continue;
          if (Math.abs(height[idx(i, j)] - site.pos[1]) > 1.0) continue;
          found = true;
        }
      }
      check(found, `${site.id}: a player can walk from the pad to within reach of the bench`,
        `${site.id}: no walkable ground within reach of the bench on its own floor`);
    }

    // The warden's ground is bare in the world as built too: no body (cobble, scrub aside) on the disc it is fought on.
    {
      const THREE = await import('three');
      const { collectBoxes } = await import('./lib/overlap.mjs');
      const disc = new THREE.Box3(new THREE.Vector3(-5, 0.3, -3), new THREE.Vector3(5, 3, 7));
      const hits = collectBoxes(built.scene, { tolerance: 0.0 }).filter(b => b.box.intersectsBox(disc) && !/cobbles|scrub/.test(b.name));
      check(hits.length === 0, "no body stands on the warden's ground",
        `bodies on the warden's ground: ${[...new Set(hits.map(h => h.name))].join(', ')}`);
    }

    /* THE HILLS ARE NOT CLIMBED. Nothing the player can reach stands within the ring of a hill unless it
       is in one of its workings: the ring is closed round every face but the cuttings. */
    {
      const onHill = [];
      for (let i = 0; i < N && onHill.length < 6; i++) {
        for (let j = 0; j < N && onHill.length < 6; j++) {
          if (!seen[idx(i, j)]) continue;
          const x = at(i), z = at(j);
          for (const h of world.hills) {
            if (hillDistance(h, x, z) < RING.out - 0.5 && plan.floorAt(x, z) === null) {
              onHill.push(`(${x.toFixed(1)}, ${z.toFixed(1)}) on ${h.id}`);
              break;
            }
          }
        }
      }
      check(onHill.length === 0, 'no cell a player can reach stands on a hill but the workings\' own',
        `reachable ground on a hill:\n         ${onHill.join('\n         ')}`);
    }

    /* THE ROUTE IS WALKABLE. Every leg of the way to an underground bench, sampled every half metre,
       stands on ground the flood fill reached. */
    {
      const bad = [];
      for (const site of world.sites.filter(underground)) {
        const route = built.routeTo(site.id, { x: world.spawn.pos[0], z: world.spawn.pos[2] });
        if (!route || route.length < 3) { bad.push(`${site.id}: no route`); continue; }
        // The first leg is the open ground from wherever the player stands (the yard's props are theirs to walk
        // round); from the first doorway on, every leg is a corridor.
        for (let k = 1; k < route.length - 1; k++) {
          const [ax, az] = route[k], [bx, bz] = route[k + 1];
          const L = Math.hypot(bx - ax, bz - az);
          for (let t = 0; t <= L; t += 0.5) {
            const x = ax + (bx - ax) * t / (L || 1), z = az + (bz - az) * t / (L || 1);
            const i = Math.floor((x - MIN) / CELL), j = Math.floor((z - MIN) / CELL);
            if (!seen[idx(i, j)]) { bad.push(`${site.id}: leg ${k} stands on ground the walk cannot reach at (${x.toFixed(1)}, ${z.toFixed(1)})`); t = L + 1; k = route.length; }
          }
        }
      }
      check(bad.length === 0, `the guide's route to each of ${world.sites.filter(underground).length} underground benches is walkable end to end`,
        `a route leaves the walkable ground:\n         ${bad.join('\n         ')}`);
    }

    /* EVERY WALL HOLDS. A point just inside the rock of every wall segment is blocked, and a point a metre
       into the working is free: the walk is held out of the column faces and nowhere else. */
    {
      const bad = [];
      for (const w of plan.walls) {
        const mx = (w.ax + w.bx) / 2, mz = (w.az + w.bz) / 2;
        if (Math.hypot(w.bx - w.ax, w.bz - w.az) < 1.2) continue;
        const inRock = [mx - w.dirX * 0.3, mz - w.dirZ * 0.3];
        const inRoom = [mx + w.dirX * 1.0 + w.dirX * PROUD_MAX, mz + w.dirZ * 1.0 + w.dirZ * PROUD_MAX];
        if (!blocked(...inRock)) bad.push(`${w.volume} ${w.side}: a point in the rock is walkable`);
        if (plan.volumeAt(...inRoom) === w.volume && blocked(...inRoom)) bad.push(`${w.volume} ${w.side}: a point a metre inside is blocked`);
      }
      check(bad.length === 0, `${plan.walls.length} wall segments each hold the walk out of the rock and leave the room open`,
        `walls that do not hold:\n         ${bad.slice(0, 8).join('\n         ')}`);
    }

    /* A WORKING IS LIT BY LAMPS. Every drift has a lamp over it and every chamber four; a lamp is a
       `lampMark` in the pool, so the world's light count is the pool's and never grows. */
    {
      built.scene.updateMatrixWorld(true);
      const THREE = await import('three');
      const marks = built.lampMarks.map(m => m.getWorldPosition(new THREE.Vector3()));
      const dark = [];
      for (const v of plan.tunnels) {
        const inside = marks.filter(p => p.x > v.rect.minX && p.x < v.rect.maxX && p.z > v.rect.minZ && p.z < v.rect.maxZ);
        const want = v.kind === 'chamber' ? 4 : 1;
        if (inside.length < want) dark.push(`${v.id} has ${inside.length} lamps, wants ${want}`);
        for (const p of inside) {
          const fy = plan.floorOf(v, p.x, p.z);
          if (p.y < fy + 2.5 || p.y > fy + ROOF) dark.push(`${v.id}: a lamp at ${(p.y - fy).toFixed(2)} m, not under the roof`);
        }
      }
      check(dark.length === 0, `every one of ${plan.tunnels.length} workings is lit by lamps in the pool (${marks.length} lamps in the world)`,
        `workings with no lamps:\n         ${dark.join('\n         ')}`);
      check(built.lampPool.lights.length === 3, 'the lamp pool is still three lights', `the pool has ${built.lampPool.lights.length} lights`);

      // And NOTHING ELSE IS LIT: every emissive material is a lamp's diffuser, the forge's coals, or a bench's indicator.
      const allowed = new Set([...built.lamps.map(l => l.material), built.forgeCoals?.material,
        ...[...built.siteMarkers.values()].map(m => m.indicator?.material)].filter(Boolean));
      const strangers = new Set();
      built.scene.traverse(o => {
        if (!o.isMesh) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m && m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0 && !allowed.has(m)) strangers.add(o.name || o.parent?.name || 'mesh');
        }
      });
      check(strangers.size === 0, 'every emissive surface is a lamp, the forge or a bench\'s indicator',
        `something that is not a lamp is lit: ${[...strangers].join(', ')}`);
    }

    /* THE COVER MASK, evaluated the way the shader does. Every point of the air inside a working is fully
       covered (sun and sky's fill gone); the open cutting a few metres outside a portal is not; and the
       rock's outside, over the roof, is not asked to be. The uniforms are the plan's boxes, so a working
       that moves moves its dark with it. */
    {
      const { ligarCoverUniforms: U, COVER_PER_HILL, COVER_HILLS } = await import('../src/three/ligar/atmosphere.js');
      const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      const cover = p => {
        let c = 0;
        for (let h = 0; h < COVER_HILLS; h++) {
          const lo = U.uCoverHillLo.value[h], hi = U.uCoverHillHi.value[h];
          if (p.x < lo.x || p.y < lo.y || p.z < lo.z || p.x > hi.x || p.y > hi.y || p.z > hi.z) continue;
          for (let i = 0; i < COVER_PER_HILL; i++) {
            const l = U.uCoverLo.value[h * COVER_PER_HILL + i], u = U.uCoverHi.value[h * COVER_PER_HILL + i];
            const d = Math.hypot(Math.max(l.x - p.x, p.x - u.x, 0), Math.max(l.y - p.y, p.y - u.y, 0), Math.max(l.z - p.z, p.z - u.z, 0));
            c = Math.max(c, 1 - smooth(0, U.uCoverFall.value, d));
          }
        }
        return c;
      };
      const THREE = await import('three');
      const lit = [];
      for (const v of plan.tunnels) {
        const r = v.rect;
        for (const fx of [0.15, 0.5, 0.85]) for (const fz of [0.15, 0.5, 0.85]) {
          const x = r.minX + (r.maxX - r.minX) * fx, z = r.minZ + (r.maxZ - r.minZ) * fz;
          const fy = plan.floorOf(v, x, z);
          for (const y of [fy + 0.05, fy + 1.6, fy + ROOF - 0.05]) {
            const c = cover(new THREE.Vector3(x, y, z));
            if (c < 0.999) lit.push(`${v.id} at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) is ${(100 - c * 100).toFixed(0)}% in the sun`);
          }
        }
      }
      for (const c of plan.cuttings) {
        const o = c.openings.find(op => op.to);
        const side = o.side, r = c.rect;
        // Three metres out from the headwall, in the open cutting at head height.
        const sign = side === 'maxX' || side === 'maxZ' ? -1 : 1;
        const x = side === 'maxX' ? r.maxX + sign * 3.5 : side === 'minX' ? r.minX + 3.5 : (r.minX + r.maxX) / 2;
        const z = side === 'maxZ' ? r.maxZ + sign * 3.5 : side === 'minZ' ? r.minZ + 3.5 : (r.minZ + r.maxZ) / 2;
        const k = cover(new THREE.Vector3(x, plan.floorOf(c, x, z) + 1.6, z));
        if (k > 0.01) lit.push(`${c.id}: the open cutting is ${(k * 100).toFixed(0)}% covered`);
      }
      check(lit.length === 0, `the cover mask darkens every point of ${plan.tunnels.length} workings and leaves the open cuttings in the sky's light`,
        `the cover mask is wrong:\n         ${lit.slice(0, 8).join('\n         ')}`);
    }

    /* A DEPLOYED INSTRUMENT IS LIT BY LAMPS TOO. Its meshes are made after the world, with materials of
       their own; the world gives them the air (and so the cover mask) while an instrument is open, and not
       the weather: it is still the one clean thing somebody is using. */
    {
      const THREE = await import('three');
      const mat = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
      built.scene.add(mesh);
      built.setBenchDeployed('q2-lattice', true);
      built.update(0.016, new THREE.Vector3(75, 2, 0));
      check(mat.userData.ligarAir === true && !mat.userData.ligarWeather,
        'a material made after the world (a deployed instrument) gets the air and the cover mask, and no weather',
        'a deployed instrument would be lit by a sun that cannot reach it: its material got ' + (mat.userData.ligarAir ? 'the weather' : 'no air'));
      built.setBenchDeployed('q2-lattice', false);
      built.scene.remove(mesh);
    }

    /* A CHAMBER'S FURNITURE STANDS CLEAR OF ITS WALLS. Rock is ground, exempt from the overlap rule, so a
       host's body driven into a wall column would pass it. Every body under a chamber's roof is measured
       against the part boxes of that chamber's wall columns (flues, mains and cables that go up through the
       roof are above 4.2 m and are not the question). */
    {
      const THREE = await import('three');
      const { collectBoxes } = await import('./lib/overlap.mjs');
      const bodies = collectBoxes(built.scene, { tolerance: 0.0 });
      const bad = [];
      for (const v of plan.tunnels.filter(x => x.kind === 'chamber')) {
        const wallMesh = built.scene.getObjectByName('mine-rock')?.children.find(c => c.name === `walls-${v.id}`);
        if (!wallMesh) { bad.push(`${v.id} has no wall mesh`); continue; }
        const walls = wallMesh.userData.partBoxes;
        const floor = plan.floorOf(v, (v.rect.minX + v.rect.maxX) / 2, (v.rect.minZ + v.rect.maxZ) / 2);
        for (const b of bodies) {
          const c = b.box.getCenter(new THREE.Vector3());
          if (c.x < v.rect.minX + 0.2 || c.x > v.rect.maxX - 0.2 || c.z < v.rect.minZ + 0.2 || c.z > v.rect.maxZ - 0.2) continue;
          if (b.box.min.y > floor + ROOF - 0.2) continue;
          const lower = b.box.clone(); lower.max.y = Math.min(lower.max.y, floor + ROOF - 0.2);
          for (const wb of walls) {
            if (!wb.intersectsBox(lower)) continue;
            const o = wb.clone().intersect(lower).getSize(new THREE.Vector3());
            if (Math.min(o.x, o.y, o.z) > 0.04) { bad.push(`${v.id}: ${b.name} stands ${Math.min(o.x, o.y, o.z).toFixed(2)} m in a wall column at (${c.x.toFixed(1)}, ${c.y.toFixed(1)}, ${c.z.toFixed(1)})`); break; }
          }
        }
      }
      check(bad.length === 0, 'every chamber\'s furniture stands clear of its walls', `furniture driven into the rock:\n         ${[...new Set(bad)].slice(0, 10).join('\n         ')}`);
    }
  }
}

/* ---------------------------------------------------------- shader patches
 *
 * Ligar's look is mostly shader patches on three's own materials: the ground
 * finishes itself (column tops, rain in the joints, the scoria yard, ruts,
 * the cliffs, the air), and every prop and rock is weathered (ash, a damp
 * foot, lichen, rust) and faded into the sky. A patch is a string replace on a
 * chunk include; if three renames the chunk, the replace silently does
 * nothing and the quarry renders clean and unhazed with no error anywhere. So
 * each patch is run against three's real shader source and must land.
 */
{
  const THREE = await import('three');
  const { ShaderLib } = THREE;
  const { createLigarTerrainMaterial, MAX_TRACK_LINES } = await import('../src/three/ligar/terrain.js');
  const { applyLigarWeather } = await import('../src/three/ligar/surfaces.js');
  const { applyLigarAir } = await import('../src/three/ligar/atmosphere.js');
  const patched = mat => {
    const shader = {
      vertexShader: ShaderLib.physical.vertexShader,
      fragmentShader: ShaderLib.physical.fragmentShader,
      uniforms: {}
    };
    mat.onBeforeCompile(shader, null);
    return shader.vertexShader + '\n' + shader.fragmentShader;
  };
  const t = new THREE.Texture();
  const set = { map: t, normalMap: t, roughnessMap: t, aoMap: t };
  const ground = patched(createLigarTerrainMaterial({
    stone: set, grit: set, detail: t, macro: t, tracks: world.tracks
  }));
  const groundMarks = ['vGN = normalize', 'vec3 cc = gCells(', 'gRut = 0.0', 'float gCliff;',
    'roughnessFactor = mix(roughnessFactor, 0.04, gWet)', 'mapN.xy += gRimDir',
    'reflectedLight.indirectDiffuse *= 1.0 - gJoint', 'vFogWorld = (modelMatrix',
    'lgSky(normalize(rd))', 'lgOut(lgHaze(lDir))'];
  const lostG = groundMarks.filter(m => !ground.includes(m));
  check(lostG.length === 0, 'the ground shader lands all its patches',
    `the ground shader lost patches: ${lostG.join(', ')}`);

  const prop = new THREE.MeshStandardMaterial({ map: t });
  applyLigarWeather(prop, { ground: t, lichen: 0.5 });
  applyLigarAir(prop);
  const src = patched(prop);
  const propMarks = ['vWW = (modelMatrix', 'wAsh = up', 'wDampK = 1.0', 'float lich =',
    'roughnessFactor = mix(roughnessFactor, 0.97, wAsh)', 'metalnessFactor = mix',
    'vFogWorld = (modelMatrix', 'lgOut(lgHaze(lDir))'];
  // The cover mask: the sun and the sky's fill come out of a covered fragment, the lamps' light does not.
  propMarks.push('float ligarCover(vec3 p)', 'float lgCoverK = ligarCover(vFogWorld)', 'directLight.color *= 1.0 - lgCoverK',
    'reflectedLight.indirectDiffuse *= 1.0 - lgCoverK', 'reflectedLight.indirectSpecular *= 1.0 - lgCoverK');
  const lostP = propMarks.filter(m => !src.includes(m));
  check(lostP.length === 0, 'the weather and air patches land on a standard material',
    `the prop patches lost: ${lostP.join(', ')}`);

  const segs = (world.tracks?.ruts || []).reduce((n, l) => n + l.length - 1, 0);
  const rl = (world.tracks?.ruts || []).length;
  check(segs <= 24 && rl <= MAX_TRACK_LINES,
    `${rl} haul-road lines, ${segs} segments, fit the ground shader`,
    `tracks overflow the ground shader: ${segs}/24 segments, ${rl}/${MAX_TRACK_LINES} lines`);
}

console.log('');
if (failures) {
  console.log(`LIGAR FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('LIGAR OK');
