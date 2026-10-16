#!/usr/bin/env node
/**
 * verify-bellows.mjs — Integrity check of Bellows, Learn world 04's ground.
 *
 * Every rule `verify:tallow` and `verify:ligar` hold their worlds to, held to
 * this one:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE, from the declaration (every footprint
 *    disjoint) AND from the world as built: the real `BellowsWorld` is
 *    constructed in Node and every pair of bodies measured.
 *  - Every Unit 4 bench has a site, every site names a real quest, and a site's
 *    `built` flag agrees with the chart.
 *  - A SITE LABEL IS A SIGNPOST: `Bench N - <what it teaches>`, six words at
 *    most, and sharing a word with the quest it names, so the label cannot drift
 *    from the bench under it.
 *  - Every site FACES ITS APPROACH, so the player walks up to the front of a
 *    bench and never round the back of its shelter.
 *  - THE PLAYER CAN WALK TO EVERY BENCH. The ground is flood-filled from the
 *    spawn against the real colliders and walking surface, and every site must
 *    be reached within arm's length, on its own floor, with no ledge to fall off.
 *  - ONLY LAMPS ARE LIT. Every emissive material in the built world is a work lamp
 *    or a bench indicator, and the lamps share a fixed handful of real lights.
 *  - The cloud sea runs to the horizon, the deck is a plate laid on it, and the rail is a closed wall.
 *  - T4-only landmarks are decoration: removing them strands nothing.
 *  - No player-facing string carries withheld vocabulary, emoji, or a long label.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/bellows.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);

const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log(`Bellows — ${world.name}, ${world.place}\n`);

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
  }
  check(clashes.length === 0,
    `${world.sites.length} sites stand clear of every prop`,
    `sites clash with props:\n         ${clashes.join('\n         ')}`);
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

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit04-gases.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)',\s*title:\s*'([^']+)'/g)]
  .map(m => ({ id: m[1], title: m[2] }));

{
  const questIds = chartQuests.map(q => q.id);
  const live = new Set(
    [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)'[\s\S]*?status:\s*'(\w+)'/g)]
      .map(m => [m[1], m[2]]).filter(([, st]) => st === 'live').map(([id]) => id)
  );
  check(questIds.length === 6, `unit04 charts ${questIds.length} benches`, `the unit04 chart lists ${questIds.length} benches, not six`);

  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => live.has(q) && !siteQuests.includes(q));
  check(missing.length === 0, 'every built unit04 bench has a site on the ground', `quests with no site: ${missing.join(', ')}`);

  const invented = siteQuests.filter(q => !questIds.includes(q));
  check(invented.length === 0, 'every site names a quest the chart actually declares', `sites naming quests that do not exist: ${invented.join(', ')}`);

  const wrong = world.sites.filter(s => s.built !== live.has(s.questId));
  check(wrong.length === 0, 'built sites are exactly the quests with a module', `sites whose built flag disagrees with the chart: ${wrong.map(s => s.id).join(', ')}`);

  // A SITE LABEL NAMES ITS BENCH in the Star Map, the guide and the [E] prompt (no sign stands in the world): numbered, short, and sharing a word with the quest it names.
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
  const out = world.landmarks.filter(l => Math.hypot(l.pos[0], l.pos[2]) + l.radius > world.deck.radius - 4);
  check(out.length === 0, 'every landmark stands inside the rail', `landmarks too close to the edge of the deck: ${out.map(l => l.asset).join(', ')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  installDomShim({ tier: 'T4' });
  const THREE = await import('three');
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const { BellowsWorld } = await import('../src/three/bellows.js');

  let built = null;
  try {
    built = new BellowsWorld(null);
  } catch (err) {
    check(false, 'the world builds', `BellowsWorld threw while building: ${err.stack || err.message}`);
  }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 150, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built: something failed silently`);

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the cloud sea runs ${Math.round(r)} m to the horizon`, `the sea ends ${Math.round(r)} m out: there is an edge to fall off the world`);
    check(Boolean(built.deckMesh) && built.deckMesh.userData.phys === 'ground', 'the deck is a plate laid on the sea, as ground', 'the deck is missing or is a body');
    check(built.movers.length >= 2, `${built.movers.length} moving parts (the Compressor's rod and wheel)`, 'the Compressor has no moving parts');
    {
      // THE RAIL IS A WALL: a closed ring of colliders, with no gap a player could step through.
      const ring = built.rimColliders;
      let gap = 0;
      for (const a of ring) {
        const near = ring.filter(b => b !== a && Math.hypot(a.x - b.x, a.z - b.z) < 1.4).length;
        if (near < 2) gap++;
      }
      check(ring.length > 200 && gap === 0, `the rail is a closed ring of ${ring.length} colliders`, `the rail has ${gap} gaps in its ring`);
      const past = built.getTerrainHeight(world.deck.radius + 3, 0);
      check(past < -20, `past the rail the ground is ${past} m: a drop no one can take`, 'there is ground past the rail');
    }

    // A frame runs: the stage and the voyage both call update(delta, cameraPos)
    // with a POSITION, and the sky dome once read `.position` off it and threw on
    // the first frame of every descent.
    {
      const eye = new THREE.Vector3(3, 1.7, -4);
      let threw = null;
      try { for (let f = 0; f < 3; f++) built.update(1 / 60, eye); } catch (err) { threw = err; }
      check(!threw, 'a frame updates with the eye handed in as a position',
        `update(delta, cameraPos) threw: ${threw?.stack || threw?.message}`);
      check(!threw && built.sky.position.distanceTo(eye) < 1e-6, 'the sky dome follows the eye',
        'the sky dome did not move to the eye');
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

    /* NOTHING IS BURIED. The ground is exempt from the overlap check, so a body
       sunk wholly into it overlaps nothing and would pass. */
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
      const allowed = new Set([built.M.lantern]);
      const strangers = [...lit].filter(m => !allowed.has(m));
      check(strangers.length === 0, `${lit.size} emissive material is a work lamp; nothing else in the world is lit`,
        `${strangers.length} emissive material(s) that are not a work lamp`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight) realLights++; });
      check(realLights === 3 && built.lamps.length >= 28,
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
      // The sites stand on the level deck, so the instrument frames the same plate at every one.
      const flat = [[0, 0], [2.4, 0], [-2.4, 0], [0, 3]].map(([dx, dz]) => built.getTerrainHeight(site.pos[0] + dx, site.pos[2] + dz));
      check(Math.max(...flat) - Math.min(...flat) < 0.02, `${site.id}: the deck under the gantry is level`, `${site.id}: the ground under the bench varies by ${(Math.max(...flat) - Math.min(...flat)).toFixed(2)}u`);
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
        } else if (x > c.minX - R && x < c.maxX + R && z > c.minZ - R && z < c.maxZ + R) return true;
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
      const x = at(i), z = at(j);
      const h = built.getTerrainHeight(x, z);
      height[idx(i, j)] = h;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
        if (seen[idx(ni, nj)]) continue;
        const nx = at(ni), nz = at(nj);
        if (blocked(nx, nz)) continue;
        // A drop the walk would take in one step is a ledge the player falls off.
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
    check(ledges.length === 0, `${reached} cells of ground are walkable, and none of them drops off a ledge`,
      `the player can walk off a drop the walk would fall down:\n         ${ledges.join('\n         ')}`);

    for (const site of world.sites) {
      // Within arm's reach of the bench's front, on its own floor, joined to the spawn.
      let found = false;
      for (let i = 0; i < N && !found; i++) {
        for (let j = 0; j < N && !found; j++) {
          if (!seen[idx(i, j)]) continue;
          if (Math.hypot(at(i) - site.approachPos[0], at(j) - site.approachPos[2]) > 1.6) continue;
          found = true;
        }
      }
      check(found, `${site.id}: a player can walk from the spawn to the bench's approach`, `${site.id}: its approach mark is sealed off from the spawn`);
    }
    // And the pad: the ship's ramp comes down onto ground the walk can reach.
    const pad = world.landmarks.find(l => l.asset === 'landing-pad');
    {
      let found = false;
      for (let i = 0; i < N && !found; i++) {
        for (let j = 0; j < N && !found; j++) {
          if (seen[idx(i, j)] && Math.hypot(at(i) - pad.pos[0], at(j) - pad.pos[2]) < 6) found = true;
        }
      }
      check(found, 'the landing pad is joined to the rest of the ground', 'the landing pad is walled off from the spawn');
    }
  }
}

console.log('');
if (failures) {
  console.log(`BELLOWS FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('BELLOWS OK');
