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
 *  - T4-only landmarks are decoration: removing them strands nothing.
 *  - No player-facing string carries withheld vocabulary, emoji, or a long sign.
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

{
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
      if (Math.abs(a.pos[1] - b.pos[1]) > 2) continue;
      const d = dist(a.pos, b.pos);
      if (d < 8) clashes.push(`${a.id} and ${b.id} are ${d.toFixed(1)}u apart`);
    }
  }
  check(clashes.length === 0,
    'no two sites on the same floor are within 8u of each other',
    `sites crowd each other:\n         ${clashes.join('\n         ')}`);
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

  const forge = world.sites.find(x => x.pos[1] < -1);
  check(forge && forge.pos[0] > r.minX && forge.pos[0] < r.maxX &&
    forge.pos[2] > r.minZ && forge.pos[2] < r.maxZ,
    'the forge bench stands inside the cut',
    'a site is below ground but outside the excavation');
  check(forge && Math.abs(forge.pos[1] - sub.floorY) < 0.001,
    'the forge bench sits on the quarry floor',
    'the underground site is not at the quarry floor height');
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit02-molecules.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)',\s*title:\s*'([^']+)'/g)]
  .map(m => ({ id: m[1], title: m[2] }));

{
  const questIds = chartQuests.map(q => q.id);
  const live = new Set(
    [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)'[\s\S]*?status:\s*'(\w+)'/g)]
      .map(m => [m[1], m[2]]).filter(([, st]) => st === 'live').map(([id]) => id)
  );

  check(questIds.length > 0, `unit02 charts ${questIds.length} quests`, 'could not read the unit02 chart');

  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => !siteQuests.includes(q));
  check(missing.length === 0, 'every charted unit02 quest has a site on the ground',
    `quests with no site: ${missing.join(', ')}`);

  const invented = siteQuests.filter(q => !questIds.includes(q));
  check(invented.length === 0, 'every site names a quest the chart actually declares',
    `sites naming quests that do not exist: ${invented.join(', ')}`);

  const wrong = world.sites.filter(s => s.built !== live.has(s.questId));
  check(wrong.length === 0, 'built sites are exactly the quests with a module',
    `sites whose built flag disagrees with the chart: ${wrong.map(s => s.id).join(', ')}`);

  // A SITE LABEL IS A SIGNPOST. It is the quest's own title, numbered, so the
  // sign cannot drift from what the bench under it teaches.
  const off = [];
  for (const s of world.sites) {
    const q = chartQuests.find(x => x.id === s.questId);
    const want = q ? `Bench ${s.stage} - ${q.title}` : null;
    if (s.label !== want) off.push(`${s.id} reads "${s.label}", want "${want}"`);
  }
  check(off.length === 0, 'every sign names its bench by the quest it teaches',
    `signs that do not name their bench:\n         ${off.join('\n         ')}`);
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

  const t1 = world.t1.siteDescriptions;
  check(world.sites.every(s => typeof t1[s.id] === 'string' && t1[s.id].length > 20),
    'every site has a description a player with no 3D view can use',
    'a site has no T1 description');
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
    ...world.sites.map(s => s.label),
    ...Object.values(world.t1.siteDescriptions)
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
  }
}

console.log('');
if (failures) {
  console.log(`LIGAR FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('LIGAR OK');
