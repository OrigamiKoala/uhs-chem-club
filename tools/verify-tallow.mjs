#!/usr/bin/env node
/**
 * verify-tallow.mjs — Static integrity check of Tallow, the Learn world 01 ground.
 *
 * What this asserts, and why each one is here:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE. Every landmark declares a footprint and
 *    every pair of footprints is disjoint, computed rather than eyeballed. A world
 *    where two objects interpenetrate is a world the player stops believing.
 *  - Every site a quest is played at exists, is reachable, and is clear of props.
 *  - The sub-level is a real excavation: the stair joins the surface to the room,
 *    the room is below the surface, and the ramp is walkable rather than a cliff.
 *  - Every quest in the Unit 1 chart has a site, and every site names a real quest.
 *    A site for a quest that does not exist would be a promise the world cannot keep.
 *  - A site whose quest has no module is marked `built: false`, so the world says
 *    "sealed" instead of opening something that was never written.
 *  - T4-only landmarks are decoration: removing every one of them leaves every
 *    site reachable. That is the tier-fork rule from 3d-conversion-prompts.md §0.5.
 *  - No player-facing string carries withheld vocabulary or a chemistry term.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/tallow.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);

const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log(`Tallow — ${world.name}, ${world.place}\n`);

/* ------------------------------------------------------------------ physics */

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
  // A prop standing in a bench is a prop the player walks through to reach it.
  const surface = world.sites.filter(s => s.pos[1] > -1);
  const clashes = [];
  for (const s of surface) {
    for (const l of world.landmarks) {
      const d = dist(s.pos, l.pos);
      if (d < l.radius + 2.2) clashes.push(`${s.id} is inside ${l.asset} (${d.toFixed(2)}u)`);
    }
  }
  check(clashes.length === 0,
    `${surface.length} surface sites stand clear of every prop`,
    `sites clash with props:\n         ${clashes.join('\n         ')}`);
}

{
  const clashes = [];
  for (let i = 0; i < world.sites.length; i++) {
    for (let j = i + 1; j < world.sites.length; j++) {
      const a = world.sites[i];
      const b = world.sites[j];
      // Two sites on different floors may share a footprint; that is what a
      // sub-level is. Two on the same floor may not.
      if (Math.abs(a.pos[1] - b.pos[1]) > 2) continue;
      const d = dist(a.pos, b.pos);
      if (d < 8) clashes.push(`${a.id} and ${b.id} are ${d.toFixed(1)}u apart`);
    }
  }
  check(clashes.length === 0,
    'no two sites on the same floor are within 8u of each other',
    `sites crowd each other:\n         ${clashes.join('\n         ')}`);
}

/* ---------------------------------------------------------------- sub-level */

{
  const sub = world.sublevel;
  const r = sub.room;
  const s = sub.stair;

  check(sub.floorY < -1, 'the lab floor is below the surface',
    `sublevel.floorY is ${sub.floorY}: the lab is not underground`);

  check(sub.ceilingY > sub.floorY && sub.ceilingY < 0,
    'the lab is roofed, below the crust',
    'sublevel.ceilingY must sit between the floor and ground level');

  const headroom = sub.ceilingY - sub.floorY;
  check(headroom >= 2.2,
    `the lab has ${headroom.toFixed(1)}u of headroom`,
    `the lab has ${headroom.toFixed(1)}u of headroom: a 1.6u player cannot stand up`);

  // The stair must actually meet the room, or the way down leads nowhere.
  check(Math.abs(s.minZ - r.maxZ) < 0.001,
    'the stair foot meets the lab wall',
    `stair.minZ (${s.minZ}) does not meet room.maxZ (${r.maxZ})`);

  check(s.minX >= r.minX && s.maxX <= r.maxX,
    'the stair opening is inside the lab wall it cuts through',
    'the stair is wider than the wall it opens into');

  const run = Math.abs(s.maxZ - s.minZ);
  const rise = Math.abs(sub.floorY);
  const grade = rise / run;
  check(grade <= 0.75,
    `the ramp falls ${rise}u over ${run}u (grade ${grade.toFixed(2)})`,
    `the ramp grade is ${grade.toFixed(2)}: too steep to walk down`);

  const lab = world.sites.find(x => x.pos[1] < -1);
  check(lab && lab.pos[0] > r.minX && lab.pos[0] < r.maxX &&
    lab.pos[2] > r.minZ && lab.pos[2] < r.maxZ,
    'the lab bench stands inside the lab',
    'a site is below ground but outside the excavated room');

  check(lab && Math.abs(lab.pos[1] - sub.floorY) < 0.001,
    'the lab bench sits on the lab floor',
    'the underground site is not at the lab floor height');
}

/* -------------------------------------------------------------------- sites */

{
  const chart = readFileSync(join(root, 'src/learn/worlds/unit01-atoms.js'), 'utf8');
  const questIds = [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)'/g)].map(m => m[1]);
  const live = new Set(
    [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)'[\s\S]*?status:\s*'(\w+)'/g)]
      .map(m => [m[1], m[2]]).filter(([, st]) => st === 'live').map(([id]) => id)
  );

  check(questIds.length > 0, `unit01 charts ${questIds.length} quests`, 'could not read the unit01 chart');

  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => !siteQuests.includes(q));
  check(missing.length === 0,
    'every charted unit01 quest has a site on the ground',
    `quests with no site: ${missing.join(', ')}`);

  const invented = siteQuests.filter(q => !questIds.includes(q));
  check(invented.length === 0,
    'every site names a quest the chart actually declares',
    `sites naming quests that do not exist: ${invented.join(', ')}`);

  const wrong = world.sites.filter(s => s.built !== live.has(s.questId));
  check(wrong.length === 0,
    'built sites are exactly the quests with a module; the rest are sealed',
    `sites whose built flag disagrees with the chart: ${wrong.map(s => s.id).join(', ')}`);
}

{
  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length, 'site stage numbers are unique',
    'two sites claim the same stage number');

  for (const s of world.sites) {
    const d = dist(s.pos, s.approachPos);
    if (d < 1.5 || d > 8) {
      fail(`${s.id}: approach mark is ${d.toFixed(1)}u from the site (want 1.5–8)`);
    }
  }
  if (!failures) ok('every site has a usable approach mark');
}

/* -------------------------------------------------------------- tier parity */

{
  // Removing every T4 landmark must leave the world navigable: the T4 tier adds
  // density, never a place. Decoration is decoration only if nothing needs it.
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
  check(blocked.length === 0,
    'every site is reachable with all T4 decoration removed',
    `approach marks blocked at T3:\n         ${blocked.join('\n         ')}`);

  const t1 = world.t1.siteDescriptions;
  const described = world.sites.every(s => typeof t1[s.id] === 'string' && t1[s.id].length > 20);
  check(described, 'every site has a description a player with no 3D view can use',
    'a site has no T1 description');

  const framed = world.sites.every(s => world.t2.stillCamera[s.id]);
  check(framed, 'every site has a still framing for the baked tier',
    'a site has no T2 still camera');
}

/* ---------------------------------------------------------------- the words */

{
  /**
   * WHAT TALLOW MAY SAY OUT LOUD.
   *
   * The campaign's own withheld list still applies — Erebus teaches those words
   * in its epilogue and a place name must not spend them early. Unit 1's
   * vocabulary is a different matter: `q1-grain` names the atom on its first
   * reward card and the unit is called Atoms on the star map, so a bench the
   * player is walking towards is allowed to say what it is about. A sign
   * reading "Bench 3 - The Periodic Table" is how somebody finds the right
   * bench; "Catalogue Vault" is how they find it by trial and error.
   */
  const WITHHELD = [
    'nucleophile', 'electrophile', 'carbonyl', 'carbocation',
    'alkyl', 'ester', 'epoxide', 'isopropyl'
  ];

  const strings = [
    world.name, world.place, world.oneLine,
    ...world.sites.map(s => s.label),
    ...Object.values(world.t1.siteDescriptions)
  ];

  const bad = [];
  for (const str of strings) {
    for (const word of WITHHELD) {
      if (new RegExp(`\\b${word}s?\\b`, 'i').test(str)) {
        bad.push(`"${str}" contains "${word}"`);
      }
    }
  }
  check(bad.length === 0,
    `${strings.length} player-facing strings withhold the vocabulary`,
    `withheld vocabulary leaked into the world:\n         ${bad.join('\n         ')}`);

  const emoji = strings.filter(s => /\p{Extended_Pictographic}/u.test(s));
  check(emoji.length === 0, 'the world is emoji-free', `emoji in: ${emoji.join(', ')}`);

  // A site label is a signpost, so it is short and it is readable at a glance.
  const tooLong = world.sites.filter(s => s.label.split(/\s+/).length > 6).map(s => s.label);
  check(tooLong.length === 0,
    'every site label is short enough to read at a glance',
    `site labels running long: ${tooLong.join(', ')}`);
}

/* -------------------------------------------------------------------- spawn */

{
  const spawn = world.spawn;
  const inProp = world.landmarks.find(l => dist(spawn.pos, l.pos) < l.radius + 0.5);
  check(!inProp, 'the player does not spawn inside anything',
    `spawn is inside ${inProp?.asset}`);

  const nearest = Math.min(...world.sites.map(s => dist(spawn.pos, s.pos)));
  check(nearest < 60, `the nearest site is ${nearest.toFixed(0)}u from the pad`,
    `the nearest site is ${nearest.toFixed(0)}u away: too far to find`);

  const [sx, sz] = world.terrain.size;
  const outside = world.landmarks.filter(l =>
    Math.abs(l.pos[0]) > sx / 2 || Math.abs(l.pos[2]) > sz / 2);
  check(outside.length === 0, 'every landmark stands on the terrain',
    `landmarks off the edge of the world: ${outside.map(l => l.asset).join(', ')}`);
}

/* --------------------------------------------- the world as it is built
 *
 * Everything above reads the world's DATA. This reads the world ITSELF: the
 * real `TallowWorld` is constructed in Node behind a DOM shim, and every pair
 * of separate props is measured with three.js's own bounding boxes.
 *
 * This is the check that actually enforces "no two objects occupy the same
 * space", because it cannot be satisfied by keeping a table tidy. A crate
 * nudged 40 cm in the builder fails here and passes everything above.
 */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  installDomShim({ tier: 'T4' });
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const { TallowWorld } = await import('../src/three/tallow.js');

  let built = null;
  try {
    built = new TallowWorld(null);
  } catch (err) {
    check(false, 'the world builds', `TallowWorld threw while building: ${err.message}`);
  }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 200, `the world builds — ${meshes} meshes on the ground`,
      `only ${meshes} meshes were built: something failed silently`);

    const hits = findOverlaps(built.scene, {
      tolerance: 0.06,
      label: owner => owner.name || `${owner.type}#${owner.id}`
    });

    // One line per offending PAIR, not per box: a 26 m structure intersecting
    // another one reports a dozen boxes and only one problem.
    const pairs = new Map();
    for (const h of hits) {
      const key = [h.a, h.b].sort().join(' <-> ');
      if (!pairs.has(key) || pairs.get(key).depth < h.depth) pairs.set(key, h);
    }

    check(pairs.size === 0,
      `no two props share space — ${meshes} meshes measured, every pair disjoint`,
      `props occupy the same space:\n${[...pairs.entries()]
        .map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`)
        .join('\n')}`);

    // The instrument has to have somewhere to deploy, and it has to be a real
    // surface at a real height — a bench anchor that drifted would put four
    // stations in mid-air or sink them into the plate.
    const anchored = built.data.sites.filter(s => s.built);
    for (const site of anchored) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: the bench reports a working surface`,
        `${site.id} is built but has no bench anchor to deploy onto`);
      if (!anchor) continue;
      // The ground the bench stands on, not the site's nominal y: a bench on
      // the flat sits on whatever the crust does there, and a bench in the lab
      // sits on the deck.
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      const expected = ground + 0.995;
      check(Math.abs(anchor.topY - expected) < 0.4,
        `${site.id}: the working surface is at ${anchor.topY.toFixed(2)}u, on ground at ${ground.toFixed(2)}u`,
        `${site.id}: bench top at ${anchor.topY.toFixed(2)} but the ground under it is at ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant),
        `${site.id}: the cased instrument can be opened`,
        `${site.id}: no dormant cabinet, so deploying would draw two instruments in one place`);
    }
  }
}

console.log('');
if (failures) {
  console.log(`TALLOW FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('TALLOW OK');
