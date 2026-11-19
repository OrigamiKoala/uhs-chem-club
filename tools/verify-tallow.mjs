#!/usr/bin/env node
/**
 * verify-tallow.mjs — Static integrity check of Tallow, the Learn world 01 ground.
 *
 * What this asserts, and why each one is here:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE. Every landmark declares a footprint and
 *    every pair of footprints is disjoint, computed rather than eyeballed. A world
 *    where two objects interpenetrate is a world the player stops believing.
 *  - Every site a quest is played at exists, is reachable, and is clear of props
 *    that are not its own host (a bench is built INTO a piece of the plant).
 *  - The sub-level is a real excavation: the stair joins the surface to the room,
 *    the room is below the surface, and the ramp is walkable rather than a cliff.
 *  - Every quest in the Unit 1 chart has a site, and every site names a real quest.
 *    A site for a quest that does not exist would be a promise the world cannot keep.
 *  - A site whose quest has no module is marked `built: false`, so the world says
 *    "sealed" instead of opening something that was never written.
 *  - T4-only landmarks are decoration: removing every one of them leaves every
 *    site reachable. That is the tier-fork rule from 3d-conversion-prompts.md §0.5.
 *  - No player-facing string carries withheld vocabulary or a chemistry term.
 *  - THE SITE'S SHAPE (the rebuild of 2026-11-19, docs/plans/tallow-ligar-world.md section 5): every bench is
 *    inside one of the plant's buildings (or the pit), housed R6 or better; bench ground spans 5.5 m or more; no
 *    layout shared with another world, no ring, no columns, no plate in view from the spawn; one floor (no
 *    ledge, nothing walkable above 0.5 m, nothing lower than 2.4 m to walk under); every room 11.2 by 11 m with
 *    clear air over the plate; doors walked through and the guide's route in by them and through no wall;
 *    every building under the cover mask with a pooled lamp over its plate; each host inside its building.
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
      if (l.host === s.id) continue;       // the machine this bench is part of
      const d = dist(s.pos, l.pos);
      if (d < l.radius + 2.2) clashes.push(`${s.id} is inside ${l.asset} (${d.toFixed(2)}u)`);
    }
  }
  check(clashes.length === 0,
    `${surface.length} surface sites stand clear of every prop that is not their host`,
    `sites clash with props:\n         ${clashes.join('\n         ')}`);
}

{
  // A host is declared where its machinery stands, and its bench is close enough to be part of it.
  const siteIds = new Set(world.sites.map(s => s.id));
  const hosts = world.landmarks.filter(l => l.host);
  const strays = hosts.filter(h => !siteIds.has(h.host));
  const far = hosts.filter(h => {
    const s = world.sites.find(x => x.id === h.host);
    return s && dist(s.pos, h.pos) > 12;
  });
  const twice = hosts.filter((h, i) => hosts.findIndex(o => o.host === h.host) !== i);
  check(strays.length === 0 && far.length === 0 && twice.length === 0,
    `${hosts.length} hosts, each beside the one bench it holds`,
    `hosts out of step with their sites: ${[...strays, ...far, ...twice].map(h => `${h.asset}@[${h.pos}]`).join(', ')}`);

  // The vessels that stand on the instrument room's roof are over the room, and nothing else is.
  const room = world.sublevel.room;
  const onRoof = world.landmarks.filter(l => l.on === 'roof');
  const wrong = onRoof.filter(l => !(l.pos[0] - 4 > room.minX && l.pos[0] + 4 < room.maxX && l.pos[2] - 4 > room.minZ && l.pos[2] + 4 < room.maxZ));
  check(onRoof.length >= 1 && wrong.length === 0,
    `${onRoof.length} evaporators stand on the instrument room's roof`,
    `vessels declared on the roof but not over the room: ${wrong.map(l => `[${l.pos}]`).join(', ') || 'none declared'}`);
}

{
  // The Hopper is fought on open ground in front of the spawn (boss-arena.js keeps the coordinates).
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const entry = src.match(/'boss-hopper':\s*\{[^}]*\}/)?.[0] || '';
  const num = re => (entry.match(re)?.[1] || '').split(',').map(Number);
  const boss = num(/bossPos:\s*\[([^\]]+)\]/), player = num(/playerPos:\s*\[([^\]]+)\]/);
  const blocking = world.landmarks.filter(l =>
    l.asset !== 'pan-rim' && l.asset !== 'stake-marker' && l.asset !== 'debris-field' &&
    (dist([boss[0], 0, boss[2]], l.pos) < l.radius + 6 || dist([player[0], 0, player[2]], l.pos) < l.radius + 1.5));
  check(boss.length === 3 && player.length === 3 && blocking.length === 0,
    `the Hopper's ground at [${boss[0]}, ${boss[2]}] is open for 6u round the boss and under the player`,
    `the boss arena is not clear: ${blocking.map(l => `${l.asset}@[${l.pos}]`).join(', ') || 'could not read boss-hopper'}`);
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

  // A quest whose site has not been laid yet is played in its own room
  // (`learn-quest.js`). Each one is named here, with where it is planned, so the
  // exemption cannot grow silently.
  const SITE_PENDING = new Set([]);   // every charted Tallow quest now has its site
  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => !siteQuests.includes(q) && !SITE_PENDING.has(q));
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

  // The DOM-only tier walks the sites in `t1.siteOrder`; nothing reads a description of where each
  // one stands (they described a world that no longer exists), so none is kept.
  const ordered = world.t1.siteOrder.length === world.sites.length &&
    world.sites.every(s => world.t1.siteOrder.includes(s.id));
  check(ordered, 'the DOM-only tier lists every site', 'the T1 site order is out of step with the sites');

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
    ...world.sites.map(s => s.label)
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

  // A site label is read in the Star Map and the guide, so it is short and readable at a glance.
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

    /*
     * THE FIELD POINTS (plan §2.5). A field stage sends the player to a spot on the plant, so each spot
     * is held to what a place the player is sent to owes them: it belongs to a host (a site) and is
     * a real piece of it, the spot to stand at is on walkable ground and outside every collider, the
     * ground there is level with the ground under the point, and the player can walk from the bench's
     * approach mark to it (a flood fill over the real colliders, the way the walk tests them).
     */
    {
      const { fieldPointsOf } = await import('../src/three/field-points.js');
      const points = fieldPointsOf(built);
      check(points.length >= 1, `${points.length} field point(s) registered by the hosts`, 'no field point is registered: q6-weigh sends the player to the counted sack');
      // Every field stage a quest declares has its point in this world. Only q6-weigh's counted sack remains: the belt scoop,
      // cooler draw and hopper draw carried what the bench already held, so they were retired.
      for (const [id, site] of [['sack', 'site-6']]) {
        check(points.some(p => p.id === id && p.siteId === site), `the "${id}" point feeds ${site}`, `no "${id}" field point feeds ${site}: the quest at that bench sends the player to it`);
      }
      const R = 0.35;
      const free = (x, z) => !built.colliders.some(c => (c.radius !== undefined
        ? Math.hypot(x - c.x, z - c.z) < c.radius + R
        : x > c.minX - R && x < c.maxX + R && z > c.minZ - R && z < c.maxZ + R));
      for (const p of points) {
        const site = built.data.sites.find(s => s.id === p.host);
        check(Boolean(site), `field point "${p.id}" belongs to host ${p.host}`, `field point "${p.id}" names a host (${p.host}) that is not a site: a point is a piece of a host, never a free marker`);
        if (!site) continue;
        check(p.siteId === site.id && Boolean(p.label), `field point "${p.id}" feeds ${site.id} and is labelled "${p.label}"`, `field point "${p.id}" has no label or the wrong bench`);
        const near = Math.hypot(p.pos[0] - site.pos[0], p.pos[2] - site.pos[2]);
        check(near <= 12, `field point "${p.id}" stands ${near.toFixed(1)} m from its bench`, `field point "${p.id}" is ${near.toFixed(1)} m from its bench: too far to be this host's own`);
        const [sx, , sz] = p.stand;
        const groundAt = built.getTerrainHeight(sx, sz);
        const groundUnder = built.getTerrainHeight(p.pos[0], p.pos[2]);
        check(free(sx, sz), `field point "${p.id}": the place to stand (${sx.toFixed(1)}, ${sz.toFixed(1)}) is clear of every collider`, `field point "${p.id}": the place to stand is inside a collider`);
        // The test has teeth: the thing the point is a piece of is solid, so a stand placed on it would fail.
        check(!free(p.pos[0], p.pos[2]), `field point "${p.id}": the host's own piece it stands on is solid (the clearance test can fail)`, `field point "${p.id}": nothing solid stands at the point, so it is not a piece of its host`);
        check(Math.abs(groundAt - groundUnder) < 0.3 && p.pos[1] - groundUnder > 0.2 && p.pos[1] - groundUnder < 2.4,
          `field point "${p.id}": level ground to stand on, the point ${(p.pos[1] - groundUnder).toFixed(2)} m above it`,
          `field point "${p.id}": the ground to stand on is not level with the point (${groundAt.toFixed(2)} vs ${groundUnder.toFixed(2)}), or the point floats`);
        const d = Math.hypot(sx - p.pos[0], sz - p.pos[2]);
        check(d <= p.reach - 0.5, `field point "${p.id}": the stand is ${d.toFixed(1)} m from the point, inside the ${p.reach} m [E] reach`, `field point "${p.id}": the place to stand is ${d.toFixed(1)} m from the point, outside its reach`);

        // The walk from the bench's approach mark to the stand: a flood fill, 0.25 m cells.
        const step = 0.25;
        const from = site.approachPos;
        const half = 30;
        const n = Math.round((half * 2) / step);
        const x0 = from[0] - half;
        const z0 = from[2] - half;
        const key = (i, j) => j * n + i;
        const seen = new Uint8Array(n * n);
        const cell = (x, z) => [Math.round((x - x0) / step), Math.round((z - z0) / step)];
        const [si, sj] = cell(from[0], from[2]);
        const [ti, tj] = cell(sx, sz);
        const queue = [[si, sj]];
        seen[key(si, sj)] = 1;
        let reached = false;
        while (queue.length && !reached) {
          const [i, j] = queue.pop();
          if (Math.abs(i - ti) <= 1 && Math.abs(j - tj) <= 1) { reached = true; break; }
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const a = i + di, b = j + dj;
            if (a < 0 || b < 0 || a >= n || b >= n || seen[key(a, b)]) continue;
            if (!free(x0 + a * step, z0 + b * step)) continue;
            seen[key(a, b)] = 1;
            queue.push([a, b]);
          }
        }
        check(reached, `field point "${p.id}": walkable from the bench's approach mark to the place to stand`, `field point "${p.id}": the place to stand cannot be reached on foot from the bench`);
      }
    }

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

/* ---------------------------------------------------------- shader patches
 *
 * Tallow's look is mostly shader patches on three's own materials: the ground
 * finishes itself (ruts, mirror flats, mirage, air), and every prop is crusted
 * with salt and faded into the sky. A patch is a string replace on a chunk
 * include; if three renames the chunk, the replace silently does nothing and
 * the world renders clean and unhazed with no error anywhere. So each patch is
 * run against three's real shader source and must land every injection.
 */
{
  const THREE = await import('three');
  const { ShaderLib } = THREE;
  const { createTallowTerrainMaterial } = await import('../src/three/tallow/terrain.js');
  const { applySaltWeather } = await import('../src/three/tallow/surfaces.js');
  const { applyTallowAir } = await import('../src/three/tallow/atmosphere.js');
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
  const ground = patched(createTallowTerrainMaterial({
    crust: { map: t, normalMap: t, roughnessMap: t, aoMap: t }, grit: t, macro: t, strata: t,
    tracks: world.tracks
  }));
  const groundMarks = ['vTN = normalize', 'gRut = 0.0', 'roughnessFactor = mix(roughnessFactor, 0.5',
    'float flatK', 'vFogWorld = (modelMatrix', 'tlSky(normalize(rd))', 'tlOut(tlHaze(tDir))'];
  const lostG = groundMarks.filter(m => !ground.includes(m));
  check(lostG.length === 0, 'the ground shader lands all its patches',
    `the ground shader lost patches: ${lostG.join(', ')}`);

  const prop = new THREE.MeshStandardMaterial({ map: t });
  applySaltWeather(prop, { ground: t });
  applyTallowAir(prop);
  const src = patched(prop);
  const propMarks = ['vSW = (modelMatrix', 'sSalt = clamp', 'roughnessFactor = mix(roughnessFactor, 0.96',
    'metalnessFactor = mix', 'vFogWorld = (modelMatrix', 'tlOut(tlHaze(tDir))'];
  const lostP = propMarks.filter(m => !src.includes(m));
  check(lostP.length === 0, 'the salt and air patches land on a standard material',
    `the prop patches lost: ${lostP.join(', ')}`);

  const segs = (world.tracks?.ruts || []).reduce((n, l) => n + l.length - 1, 0);
  const psegs = (world.tracks?.paths || []).reduce((n, l) => n + l.length - 1, 0);
  check(segs <= 24 && psegs <= 16, `${segs} rut and ${psegs} path segments fit the ground shader`,
    `tracks overflow the ground shader: ${segs}/24 rut, ${psegs}/16 path segments (the rest are dropped)`);
  // Each polyline is culled by its own box in the shader, and there are only
  // so many boxes: a line past the last one would never be drawn at all.
  const { MAX_TRACK_LINES } = await import('../src/three/tallow/terrain.js');
  const rl = (world.tracks?.ruts || []).length;
  const pl = (world.tracks?.paths || []).length;
  check(rl <= MAX_TRACK_LINES && pl <= MAX_TRACK_LINES,
    `${rl} rut and ${pl} path lines fit the ground shader's ${MAX_TRACK_LINES} boxes each`,
    `tracks overflow the ground shader: ${rl}/${MAX_TRACK_LINES} rut, ${pl}/${MAX_TRACK_LINES} path lines`);
}

/* ------------------------------------------------------------ the site's shape
 *
 * THE BENCHES ARE INSIDE THE PLANT (docs/plans/tallow-ligar-world.md section 5, the site rebuild of 2026-11-19).
 * What the spec declares, measured on the built world through tools/lib/world-shape-checks.mjs and the one hall
 * declaration (src/three/tallow/hall-plan.js):
 *
 *  - bench ground spans at least 5.5 m (the pit), every bench housed (R6 or better), no layout shared with
 *    another world, not one circle, not two columns, no plate in view from the spawn;
 *  - one floor: from the spawn the flood fill reaches every approach and every door, drops off no ledge, reaches
 *    nothing above 0.5 m (no roof, no wall top), and walks under nothing lower than 2.4 m;
 *  - every room is at least 11.2 by 11 m with 5 m over the plate's air, every door is a door (1.2 m or wider,
 *    2.2 m or taller), and the guide's route to each bench goes in by its building's door;
 *  - every building and the pit are under the cover mask, lit by their own lamps (a pooled lamp over each
 *    plate, inside its room), the pool's light count is fixed, and no opaque material writes no depth;
 *  - each host's machinery is inside its building (the tower over the base house, and the pipes and the belt
 *    that run through a wall, excepted by name), and the floor under each plate and its lane is level.
 */
{
  const THREE = await import('three');
  const S = await import('./lib/world-shape-checks.mjs');
  const P = await import('../src/three/tallow/hall-plan.js');
  const { TallowWorld } = await import('../src/three/tallow.js');
  const built = new TallowWorld(null);
  built.scene.updateMatrixWorld(true);
  // The same world unbaked, so a host's parts keep their names for the extent check.
  const baked = TallowWorld.prototype.bakeStatics;
  TallowWorld.prototype.bakeStatics = function () {};
  let raw;
  try { raw = new TallowWorld(null); } finally { TallowWorld.prototype.bakeStatics = baked; }
  raw.scene.updateMatrixWorld(true);

  // THE SHAPE.
  {
    const g = S.benchGround(built);
    check(g.span >= 5.5, `bench ground spans ${g.span.toFixed(2)} m (${g.lo.toFixed(2)} to ${g.hi.toFixed(2)})`, `bench ground spans only ${g.span.toFixed(2)} m; the spec holds 5.5`);
    const rows = S.housing(built, THREE);
    const weak = rows.filter(r => !r.roof || r.closed < 6);
    check(weak.length === 0, `every bench is housed: ${rows.map(r => r.code).join(' ')}`, `benches not housed R6 or better: ${weak.map(r => `${r.id} ${r.code}`).join(', ')}`);
    const shared = S.sharedLayout(world);
    check(shared.length === 0, 'no other world stands its benches on these coordinates', `the layout is shared with ${shared.join(', ')}`);
    check(!S.oneCircle(world), 'the benches are not on one circle', 'every bench stands on one circle: the ring template');
    check(!S.twoColumns(world), 'the benches are not in two columns or two rows', 'the benches stand on two lines: the road template');
    const seen = S.platesInView(built, THREE, world.spawn.pos);
    check(seen.length === 0, 'no plate is in view from the spawn', `plates in view from the spawn: ${seen.join(', ')}`);
  }

  // ONE FLOOR, AND THE WAY IN.
  {
    const f = S.flood(built, { bound: 110, cell: 0.5, radius: 0.25, step: 0.6 });
    check(f.ledges.length === 0, `the flood fill from the spawn reaches ${f.reached} cells and drops off no ledge`, `the walk drops off a ledge: ${f.ledges.join('; ')}`);
    const lost = world.sites.filter(s => !f.reachable(s.approachPos[0], s.approachPos[2], 0.6));
    check(lost.length === 0, 'every approach mark is reachable on foot from the spawn', `approaches out of reach: ${lost.map(s => s.id).join(', ')}`);
    const high = f.cells.filter(([, , h]) => h > 0.5);
    check(high.length === 0, 'nothing above 0.5 m is walkable (no roof, no wall top, no hill)', `${high.length} walkable cells stand above 0.5 m, first at (${high[0]?.slice(0, 2).map(n => n.toFixed(1)).join(', ')})`);
    const low = S.lowBodies(built, THREE, f.cells);
    check(low.length === 0, 'nothing the player can walk under is lower than 2.4 m (one floor)', `low bodies over the walk: ${low.join('; ')}`);
    for (const h of P.HALLS) {
      for (const d of P.doorPoints(h)) {
        check(f.reachable(d.out[0], d.out[1], 0.6) && f.reachable(d.in[0], d.in[1], 0.6), `${h.id}: its door is walked through (both sides reached)`, `${h.id}: the door at (${d.out.map(n => n.toFixed(1))}) is not walkable on both sides`);
        check(d.width >= 1.2 && d.top >= 2.2, `${h.id}: the door is ${d.width.toFixed(1)} m wide and ${d.top.toFixed(1)} m high`, `${h.id}: the door is ${d.width.toFixed(1)} by ${d.top.toFixed(1)} m: too small to walk through`);
      }
      const site = world.sites.find(s => s.id === h.site);
      const route = built.routeTo(site.id, world.spawn.pos);
      const dp = P.doorPoints(h)[0];
      const through = route.some(p => Math.hypot(p[0] - dp.in[0], p[1] - dp.in[1]) < 0.01) && route.some(p => Math.hypot(p[0] - dp.out[0], p[1] - dp.out[1]) < 0.01);
      check(through, `${site.id}: the guide's route from the spawn goes in by the ${h.id}'s door`, `${site.id}: the guide's route does not pass the ${h.id}'s door`);
      const crossing = route.findIndex((p, i) => i > 0 && !built.clearLine(route[i - 1], p, 0.2));
      check(crossing === -1, `${site.id}: the guide's route (${route.length} points) runs through no wall or prop`, `${site.id}: the guide's route runs through a collider between (${route[crossing - 1]?.map(n => n.toFixed(1))}) and (${route[crossing]?.map(n => n.toFixed(1))})`);
    }
    const pit = world.sites.find(s => s.pos[1] < -1);
    const pr = built.routeTo(pit.id, world.spawn.pos);
    check(pr.length >= 4, `${pit.id}: the guide's route goes down the stair`, `${pit.id}: the guide's route does not use the stair`);
    // Bench to bench in order, and the spawn to the pit: no leg of the guide's line runs through a collider.
    const order = world.t1.siteOrder.map(id => world.sites.find(s => s.id === id));
    const legs = [[world.spawn.pos, pit], ...order.slice(1).map((s, i) => [order[i].approachPos, s])];
    const bad = [];
    for (const [from, to] of legs) {
      const r = built.routeTo(to.id, from);
      if (r.some((p, i) => i > 0 && !built.clearLine(r[i - 1], p, 0.2))) bad.push(to.id);
    }
    check(bad.length === 0, `the guide walks bench to bench in order (${legs.length} legs) through no wall or prop`, `the guide's line runs through a collider on the way to ${bad.join(', ')}`);
  }

  // THE ROOMS.
  {
    for (const h of P.HALLS) {
      const r = h.room, w = r.x1 - r.x0, d = r.z1 - r.z0;
      check(Math.min(w, d) >= 11.0 && Math.max(w, d) >= 11.2, `${h.id}: the room is ${w.toFixed(1)} by ${d.toFixed(1)} m`, `${h.id}: the room is ${w.toFixed(1)} by ${d.toFixed(1)} m; the floor is 11.2 by 11`);
      // The roof over the lean-in camera's air (|x| < 1.2, z 0.65 to 2.75), less 0.3 m of steel under a sheet roof.
      const steel = h.roof.type === 'flat' ? 0 : 0.3;
      let over = Infinity;
      for (const lx of [-1.2, 0, 1.2]) for (const lz of [0.65, 1.7, 2.75]) over = Math.min(over, P.roofAt(h, lx, lz) - steel);
      check(over >= 4.7, `${h.id}: ${over.toFixed(2)} m of clear air over the plate`, `${h.id}: only ${over.toFixed(2)} m over the plate; the lean-in camera reaches 4.6`);
      check(r.x0 < -2.8 && r.x1 > 2.8 && r.z0 < -1.95 && r.z1 > 5.6, `${h.id}: the bay and its approach are inside the room`, `${h.id}: the room does not hold the bay and its approach`);
    }
  }

  // UNDER COVER, LIT BY LAMPS.
  {
    const boxes = built.coverBoxes || [];
    const inBox = (x, y, z) => boxes.some(b => x >= b.min[0] && x <= b.max[0] && y >= b.min[1] && y <= b.max[1] && z >= b.min[2] && z <= b.max[2]);
    for (const site of world.sites) {
      const a = built.benchAnchor(site.questId);
      check(inBox(a.position[0], a.topY + 0.6, a.position[2]), `${site.id}: the plate is under the cover mask`, `${site.id}: the plate is not under the cover mask, so the sky lights it`);
      const h = P.hallFor(site.id);
      const room = h ? P.roomRect(h) : P.PIT.room;
      const lamps = built.lamps.map(m => m.getWorldPosition(new THREE.Vector3())).filter(p =>
        p.x > room.minX && p.x < room.maxX && p.z > room.minZ && p.z < room.maxZ && p.y > a.topY &&
        Math.hypot(p.x - a.position[0], p.z - a.position[2]) < 8);
      check(lamps.length >= 1, `${site.id}: ${lamps.length} pooled lamp(s) in its room within 8 m of the plate`, `${site.id}: no lamp in its room over the plate`);
    }
    let unpatched = 0, noDepth = 0;
    const seen = new Set();
    built.scene.traverse(o => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) {
        if (!m || seen.has(m)) continue;
        seen.add(m);
        if ((m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial) && !m.userData.worldCover) unpatched++;
        if (!m.transparent && m.depthWrite === false && !m.isShaderMaterial) noDepth++;
      }
    });
    check(unpatched === 0, `every lit material carries the cover mask (${boxes.length} boxes)`, `${unpatched} lit materials have no cover mask`);
    check(noDepth === 0, 'no opaque material sets depthWrite false', `${noDepth} opaque materials set depthWrite false`);
    let points = 0;
    built.scene.traverse(o => { if (o.isPointLight) points++; });
    check(points === built.lampPool.lights.length && points <= 2, `${built.lamps.length} lamps are lit through ${points} pooled lights`, `the scene holds ${points} point lights, not the pool's ${built.lampPool.lights.length}`);
    // Only lamps glow: the luminaires' diffusers and, before this rebuild, the mast's obstruction lamp. The
    // buildings add no emissive surface.
    const glow = new Set();
    built.scene.traverse(o => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) {
        if (!m?.emissive || !(m.emissiveIntensity > 0) || m.emissive.getHex() === 0 || m === built.lumMats?.diffuser) continue;
        glow.add(m);
      }
    });
    check(glow.size <= 1, `only lamps glow (the luminaires and ${glow.size} other lamp material)`, `${glow.size} emissive materials besides the luminaires`);
  }

  // THE HOSTS ARE INSIDE THEIR BUILDINGS, ON LEVEL FLOORS.
  {
    const THROUGH = /^(tower|draw-off)$/;
    for (const h of P.HALLS) {
      const marker = raw.siteMarkers.get(world.sites.find(s => s.id === h.site).questId);
      const g = marker.group;
      const shed = P.HALLS.filter(o => h.shed ? o.shed === h.shed : o === h).map(P.hallRect);
      const box = shed.reduce((u, r) => ({ minX: Math.min(u.minX, r.minX), maxX: Math.max(u.maxX, r.maxX), minZ: Math.min(u.minZ, r.minZ), maxZ: Math.max(u.maxZ, r.maxZ) }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });
      const out = [];
      const v = new THREE.Vector3();
      g.traverse(o => {
        if (!o.isMesh) return;
        for (let n = o; n && n !== g; n = n.parent) if (THROUGH.test(n.name || '')) return;
        const pos = o.geometry.attributes.position;
        for (let i = 0; i < pos.count; i += 7) {
          v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
          // The vapour main and the draw-off line leave through a wall by design: 0.6 m of pipe outside is allowed.
          if (v.x < box.minX - 0.6 || v.x > box.maxX + 0.6 || v.z < box.minZ - 0.6 || v.z > box.maxZ + 0.6) { out.push(`${o.name || o.type} at (${v.x.toFixed(1)}, ${v.z.toFixed(1)})`); return; }
        }
      });
      check(out.length === 0, `${h.site}: every piece of the host is inside the ${h.id}`, `${h.site}: host pieces outside the ${h.id}: ${out.slice(0, 4).join('; ')}`);
    }
    for (const site of world.sites) {
      const a = built.benchAnchor(site.questId);
      const c = Math.cos(a.rotationY), sn = Math.sin(a.rotationY);
      const hs = [];
      for (let lx = -2.8; lx <= 2.8; lx += 0.7) for (let lz = -1.95; lz <= 5.6; lz += 0.75) hs.push(built.getTerrainHeight(a.position[0] + lx * c + lz * sn, a.position[2] - lx * sn + lz * c));
      const span = Math.max(...hs) - Math.min(...hs);
      check(span < 0.02, `${site.id}: the floor under the plate and its lane is level (${(span * 100).toFixed(1)} cm)`, `${site.id}: the floor under the plate and its lane varies by ${(span * 100).toFixed(1)} cm`);
    }
  }
}

console.log('');
if (failures) {
  console.log(`TALLOW FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('TALLOW OK');
