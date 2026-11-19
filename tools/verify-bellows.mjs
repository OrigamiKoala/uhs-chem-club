#!/usr/bin/env node
/**
 * verify-bellows.mjs — Integrity and world-shape check of Bellows, Learn world 04's gas works over the cloud.
 *
 * Holds the rebuilt site (`docs/plans/bellows-world.md`, "Site rebuild (2026-11-18)") to every safety rule the
 * world had and to `docs/plans/world-distinction-plan.md` section 3 through `tools/lib/world-shape-checks.mjs`.
 * The check it replaces (one round deck, a closed ring of rail colliders, a 46 m ring of hosts) is in
 * `archive/2026-11-18/site-bellows/verify-bellows.mjs`.
 *
 *  - THE PLAN: volumes do not overlap, every doorway is declared from both sides on one plane with one floor
 *    and at least 3.9 m wide, every room is at least 11.2 x 11 m with 5.2 m of headroom, no two rooms alike,
 *    the walk's floors span 20 m (-8 to +12), every ramp is no steeper than 1 in 4.5
 *  - EVERY DROP IS RAILED: past every rail the ground is the cloud sea, 30 m and more below the walk
 *  - NO TWO THINGS OCCUPY THE SAME SPACE (`overlap.mjs`, 0.06 m), NO BODY IS BURIED
 *  - WORLD SHAPE: bench ground spans >= 20 m, 6 of 6 benches housed, no cloned coordinates, not one circle,
 *    not two columns, <= 2 plates in view from the spawn, a single floor
 *  - THE WALK: flood fill from the spawn reaches every approach, the pad and the Compressor's ground with no
 *    ledge; every reachable cell is inside a declared walk volume (nobody reaches a roof, a structure or the drop)
 *  - COVER AND LAMPS: every room, passage and the holder's foot under the shared cover mask; only lamps lit;
 *    three pooled lights; a lamp over every plate; the guide routes from the spawn through every room's door
 *  - THE FIELD POINT: Quest 6's draw-off is a piece of the cold box's host, reachable, level and in reach
 *  - THE BOSS: agrees with `BOSS_ARENA_SPOTS['boss-compressor']`, seven metres clear, the tower behind it
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE } from '../src/three/bellows/host-plan.js';
import {
  makeWorksPlan, ROOMS, sitePlacement, ARENA, SPAWN, SEA, LEVEL, PLINTH, HOLDER
} from '../src/three/bellows/works-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/bellows.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log(`Bellows — ${world.name}, the gas works over the cloud\n`);

/* ------------------------------------------------------------------ the plan */

const plan = makeWorksPlan();
{
  const V = plan.volumes;
  const clash = [];
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) {
    const a = V[i].rect, b = V[j].rect;
    if (a.minX < b.maxX - 1e-6 && a.maxX > b.minX + 1e-6 && a.minZ < b.maxZ - 1e-6 && a.maxZ > b.minZ + 1e-6) clash.push(`${V[i].id} / ${V[j].id}`);
  }
  check(clash.length === 0, `${V.length} walk volumes, none overlapping another`, `volumes overlap: ${clash.join(', ')}`);

  const opp = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' };
  const bad = [];
  let doors = 0;
  for (const v of V) for (const o of v.openings) {
    if (!o.to) continue;
    doors++;
    const w = plan.byId.get(o.to);
    if (!w) { bad.push(`${v.id} opens onto missing ${o.to}`); continue; }
    const back = w.openings.find(q => q.to === v.id && q.side === opp[o.side] && Math.abs(q.lo - o.lo) < 1e-6 && Math.abs(q.hi - o.hi) < 1e-6);
    if (!back) bad.push(`${v.id} -> ${o.to} is not declared back`);
    if (Math.abs(v.rect[o.side] - w.rect[opp[o.side]]) > 1e-6) bad.push(`${v.id} -> ${o.to} on two planes`);
    const mid = (o.lo + o.hi) / 2, p = v.rect[o.side];
    const [x, z] = o.side === 'minX' || o.side === 'maxX' ? [p, mid] : [mid, p];
    if (Math.abs(plan.floorOf(v, x, z) - plan.floorOf(w, x, z)) > 0.05) bad.push(`${v.id} -> ${o.to} steps at the doorway`);
    if (o.hi - o.lo < 3.9) bad.push(`${v.id} -> ${o.to} is only ${(o.hi - o.lo).toFixed(1)} m wide`);
  }
  check(bad.length === 0, `${doors / 2} doorways, each declared from both sides on one plane, level across, at least 3.9 m wide`, bad.join('\n         '));

  const small = ROOMS.filter(r => Math.min(r.rect.maxX - r.rect.minX, r.rect.maxZ - r.rect.minZ) < 11 || Math.max(r.rect.maxX - r.rect.minX, r.rect.maxZ - r.rect.minZ) < 11.2 || r.top < 5.2);
  check(small.length === 0, 'every room is at least 11.2 x 11 m with 5.2 m to its roof', `rooms too small: ${small.map(r => r.id).join(', ')}`);
  const shells = new Set(ROOMS.map(r => r.shell));
  check(shells.size === ROOMS.length, `${shells.size} rooms, no two built alike (${[...shells].join(', ')})`, 'two rooms share a shell');
  const floors = plan.volumes.flatMap(v => [v.floor.y0, v.floor.y1 ?? v.floor.y0]);
  check(Math.min(...floors) === LEVEL.holder && Math.max(...floors) === LEVEL.cold, `the walk's floors run from ${Math.min(...floors)} to ${Math.max(...floors)} m`, 'the walk\'s floors do not span -8 to +12 m');
  const steep = plan.volumes.filter(v => v.floor.y1 !== undefined && Math.abs(v.floor.y1 - v.floor.y0) / Math.abs(v.floor.to - v.floor.from) > 1 / 4.5);
  check(steep.length === 0, 'every ramp rises no steeper than 1 in 4.5', `steep ramps: ${steep.map(v => v.id).join(', ')}`);
  const kinds = new Set(plan.volumes.map(v => v.kind));
  check(['deck', 'catwalk', 'ramp', 'room', 'passage'].every(k => kinds.has(k)), 'the walk is decks, catwalks, ramps, rooms and passages', 'a kind of walk volume is missing');
}

/* ------------------------------------------------------- every drop is railed */

{
  const rails = plan.railSegments().filter(s => s.kind === 'rail');
  const open = [];
  for (const s of rails) {
    const L = Math.hypot(s.bx - s.ax, s.bz - s.az);
    for (let t = 0.25; t < L; t += 0.5) {
      const x = s.ax + (s.bx - s.ax) * (t / L) - s.dirX * 0.8, z = s.az + (s.bz - s.az) * (t / L) - s.dirZ * 0.8;
      if (plan.volumeAt(x, z) || plan.height(x, z) > SEA + 0.01) { open.push(`${s.volume} ${s.side} at (${x.toFixed(1)}, ${z.toFixed(1)})`); break; }
    }
  }
  const total = rails.reduce((a, s) => a + Math.hypot(s.bx - s.ax, s.bz - s.az), 0);
  check(open.length === 0, `${rails.length} rails, ${total.toFixed(0)} m in all, each with the cloud sea behind it`, `rails with something other than the drop behind them:\n         ${open.join('\n         ')}`);
  const drop = Math.min(...plan.volumes.map(v => Math.min(v.floor.y0, v.floor.y1 ?? v.floor.y0))) - SEA;
  check(drop >= 30, `the lowest floor stands ${drop.toFixed(0)} m over the cloud sea`, `the drop under the lowest floor is only ${drop.toFixed(0)} m`);
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit04-gases.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)',\s*title:\s*'([^']+)'/g)].map(m => ({ id: m[1], title: m[2] }));
{
  const questIds = chartQuests.map(q => q.id);
  const live = new Set([...chart.matchAll(/id:\s*'(q\d+-[a-z]+)'[\s\S]*?status:\s*'(\w+)'/g)].map(m => [m[1], m[2]]).filter(([, st]) => st === 'live').map(([id]) => id));
  check(questIds.length === 6, `unit04 charts ${questIds.length} benches`, `the unit04 chart lists ${questIds.length} benches, not six`);
  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => live.has(q) && !siteQuests.includes(q));
  check(missing.length === 0, 'every built unit04 bench has a site on the ground', `quests with no site: ${missing.join(', ')}`);
  const invented = siteQuests.filter(q => !questIds.includes(q));
  check(invented.length === 0, 'every site names a quest the chart actually declares', `unknown quests: ${invented.join(', ')}`);
  const wrong = world.sites.filter(s => s.built !== live.has(s.questId));
  check(wrong.length === 0, 'built sites are exactly the quests with a module', `built flag disagrees: ${wrong.map(s => s.id).join(', ')}`);
  const order = world.sites.every((s, i) => s.stage === i + 1 && s.questId === questIds[i] && s.id === `site-${i + 1}`);
  check(order, 'sites are keyed by bench order: site-N is Bench N', 'a site is out of bench order');
  const stem = w => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
  const off = [];
  for (const s of world.sites) {
    const q = chartQuests.find(x => x.id === s.questId);
    const prefix = `Bench ${s.stage} - `;
    if (!s.label.startsWith(prefix)) { off.push(`${s.id} reads "${s.label}"`); continue; }
    const words = s.label.slice(prefix.length).split(/\s+/).map(stem).filter(w => w.length >= 3);
    const title = new Set((q?.title || '').split(/\s+/).map(stem));
    if (!words.some(w => title.has(w))) off.push(`${s.id} reads "${s.label}", which shares no word with "${q?.title}"`);
  }
  check(off.length === 0, 'every site label names its bench by what it teaches', off.join('\n         '));
  const hosts = ['sphere-skirt', 'tower-hall', 'holder-meter', 'gondola', 'bag-cradle', 'cold-box'];
  check(world.sites.every((s, i) => s.structure === hosts[i]), 'the six hosts are the sphere\'s skirt, the tower hall, the holder\'s meter house, the gondola, the bag cradle and the cold box', 'a site names the wrong host');
  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length, 'site stage numbers are unique', 'two sites claim the same stage number');
  const bad = world.sites.filter(s => { const d = dist(s.pos, s.approachPos); return d < 1.5 || d > 8; });
  check(bad.length === 0, 'every site has a usable approach mark', `approach marks out of range: ${bad.map(s => s.id).join(', ')}`);
  const placed = world.sites.filter((s, i) => JSON.stringify(sitePlacement(ROOMS[i]).pos) !== JSON.stringify(s.pos));
  check(placed.length === 0, 'every site stands where its room in works-plan.js puts it', `sites off their rooms: ${placed.map(s => s.id).join(', ')}`);
  const crowd = [];
  for (let i = 0; i < world.sites.length; i++) for (let j = i + 1; j < world.sites.length; j++) if (dist(world.sites[i].pos, world.sites[j].pos) < 8) crowd.push(`${world.sites[i].id}/${world.sites[j].id}`);
  check(crowd.length === 0, 'no two sites are within 8 m of each other', crowd.join(', '));
}

/* -------------------------------------------------------------- tier parity */

{
  const blocked = [];
  for (const s of world.sites) for (const l of world.landmarks) if (l.asset !== 'landing-pad' && dist(s.approachPos, l.pos) < l.radius + 0.5) blocked.push(`${s.id} by ${l.asset}`);
  check(blocked.length === 0, 'no landmark stands on an approach mark', blocked.join(', '));
  check(world.landmarks.every(l => l.minTier !== 'T4'), 'the walk is the same at T3 and T4: nothing on it is T4 decoration', 'a T4-only landmark stands on the walk');
  check(world.sites.every(s => world.t2.stillCamera[s.id]), 'every site has a T2 still camera', 'a site has no T2 still camera');
  check(JSON.stringify(world.t1.siteOrder) === JSON.stringify(world.sites.map(s => s.id)), 'the T1 site order is bench order', 'the T1 site order is out of step');
}

/* ---------------------------------------------------------------- the words */

{
  const WITHHELD = ['nucleophile', 'electrophile', 'carbonyl', 'carbocation', 'alkyl', 'ester', 'epoxide', 'isopropyl'];
  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  const bad = [];
  for (const str of strings) for (const word of WITHHELD) if (new RegExp(`\\b${word}s?\\b`, 'i').test(str)) bad.push(`"${str}" contains "${word}"`);
  check(bad.length === 0, `${strings.length} player-facing strings withhold the vocabulary`, bad.join('\n         '));
  check(!strings.some(s => /\p{Extended_Pictographic}/u.test(s)), 'the world is emoji-free', 'emoji in a world string');
  const tooLong = world.sites.filter(s => s.label.split(/\s+/).length > 6).map(s => s.label);
  check(tooLong.length === 0, 'every site label is short enough to read at a glance', tooLong.join(', '));
  const files = ['bellows.js', 'bellows/plant.js', 'bellows/stations.js', 'bellows/decks.js', 'bellows/vista.js', 'bellows/effects.js', 'bellows/works-plan.js'];
  const signs = files.filter(f => /\bplacard\b|\bsign\(|\.tag\(/.test(readFileSync(join(root, 'src/three', f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')));
  check(signs.length === 0, 'no builder stands a sign in the world', `a sign is built in: ${signs.join(', ')}`);
}

/* -------------------------------------------------------------------- spawn */

{
  const spawn = world.spawn;
  const nearest = Math.min(...world.sites.map(s => dist(spawn.pos, s.pos)));
  check(nearest < 90, `the nearest site is ${nearest.toFixed(0)} m from the spawn`, `the nearest site is ${nearest.toFixed(0)} m away`);
  const [sx, sz] = world.terrain.size;
  const outside = world.landmarks.filter(l => Math.abs(l.pos[0]) > sx / 2 || Math.abs(l.pos[2]) > sz / 2);
  check(outside.length === 0, 'every landmark stands inside the works', outside.map(l => l.asset).join(', '));
  const pad = world.landmarks.find(l => l.asset === 'landing-pad');
  check(Boolean(pad) && plan.volumeAt(pad.pos[0], pad.pos[2])?.id === 'stage', 'the Avalon has a pad to land on, on the landing stage', 'no landing-pad on the stage');
  check(SPAWN[0] === spawn.pos[0] && SPAWN[2] === spawn.pos[2] && plan.volumeAt(SPAWN[0], SPAWN[2])?.id === 'stage', 'the spawn is the plan\'s, on the landing stage', 'the JSON spawn and the plan disagree');
}

/* ------------------------------------------------------- the registration */

{
  const { world3dFor } = await import('../src/learn/worlds3d.js');
  const w = world3dFor('unit04');
  check(Boolean(w) && w.worldName === 'Bellows' && Boolean(w.data), 'worlds3d.js registers unit04 as Bellows', 'worlds3d.js does not register unit04 as Bellows');
  check(w && world.sites.every(s => w.siteForQuest(s.questId)?.id === s.id), 'every quest finds its site through worlds3d.js', 'a quest cannot find its site');
  const voyage = readFileSync(join(root, 'src/three/voyage.js'), 'utf8');
  check(/bellows:\s*\{\s*key: 'bellows', name: 'Bellows', hash: '#\/learn\/unit04'/.test(voyage), 'the voyage flies to Bellows and lands on #/learn/unit04', 'voyage.js has no Bellows destination');
  const stage = readFileSync(join(root, 'src/three/stage.js'), 'utf8');
  check(/new BellowsWorld\(this\.renderer\)/.test(stage) && /enterBellowsScene/.test(stage) && /w === this\.bellowsWorld/.test(stage) && /setBellowsSiteComplete/.test(stage) && /key === "bellows"\) return BELLOWS_EXPOSURE/.test(stage),
    'stage.js builds, enters, warms and lights Bellows like the other Learn worlds', 'stage.js is missing a Bellows hook');
}

/* ------------------------------------------- the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-compressor':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && same(player, world.arena.player) && same(boss, world.arena.boss) && same(boss, ARENA.boss) && /worldId:\s*'unit04'/.test(m[1]) && /species:\s*'the compressor'/.test(m[1]),
    `the Compressor is fought where the world keeps its ground open (${world.arena.boss.join(', ')}), on the apron`,
    `boss-arena.js puts the Compressor at ${boss.join(',')} / ${player.join(',')}, the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
  check(plan.volumeAt(ARENA.boss[0], ARENA.boss[2])?.id === 'apron' && plan.volumeAt(ARENA.player[0], ARENA.player[2])?.id === 'apron', 'the boss and the player\'s mark are both on the apron', 'the arena is off the apron');
  check(ARENA.boss[2] - PLINTH.maxZ > 7, `the tower's plinth stands ${(ARENA.boss[2] - PLINTH.maxZ).toFixed(0)} m behind the boss`, 'the plinth crowds the boss');
}

/* --------------------------------------------- the world as it is built */

{
  const THREE = await import('three');
  const { BellowsWorld } = await import('../src/three/bellows.js');
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const S = await import('./lib/world-shape-checks.mjs');

  let built = null;
  try {
    built = new BellowsWorld(null);
  } catch (err) {
    check(false, 'the world builds', `BellowsWorld threw: ${err.stack || err.message}`);
  }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 150, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built`);

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the cloud sea runs ${Math.round(r)} m to the horizon`, `the sea ends ${Math.round(r)} m out`);
    check(Boolean(built.deckMesh) && built.deckMesh.userData.phys === 'ground', 'the deck plate is ground', 'the deck plate is missing or is a body');
    check(Math.abs(built.getTerrainHeight(150, 0) - SEA) < 1e-6 && Math.abs(built.getTerrainHeight(0, 0) - SEA) < 1e-6, 'off every deck, and under the tower\'s plinth, the ground is the cloud sea', 'there is ground off the decks');

    /* WORLD SHAPE (world-distinction-plan.md section 3) */
    {
      const bg = S.benchGround(built);
      check(bg.span >= 20 - 1e-6, `bench ground spans ${bg.span.toFixed(2)} m (${bg.lo.toFixed(2)} to ${bg.hi.toFixed(2)} m)`, `bench ground spans only ${bg.span.toFixed(2)} m`);
      const hs = S.housing(built, THREE);
      const housed = hs.filter(h => h.housed).length;
      check(housed === 6, `${housed}/${hs.length} benches housed (${hs.map(h => h.code).join(' ')})`, `only ${housed}/${hs.length} benches housed (${hs.map(h => h.code).join(' ')})`);
      const clones = S.sharedLayout(world);
      check(clones.length === 0, 'no bench coordinates shared with any other world', `shares layout with: ${clones.join(', ')}`);
      check(!S.oneCircle(world), 'the benches are not on one circle', 'the benches lie on one circle');
      check(!S.twoColumns(world), 'the benches are not in two straight columns', 'the benches lie in two columns');
      const seen = S.platesInView(built, THREE, world.spawn.pos);
      check(seen.length <= 2, `${seen.length} plate(s) in view from the spawn (at most 2)`, `plates in view from the spawn: ${seen.join(', ')}`);
    }

    /* WHAT MOVES */
    {
      const rod = built.movers.find(o => o.userData.mover.kind === 'stroke');
      const wheel = built.movers.find(o => o.userData.mover.kind === 'spin');
      check(Boolean(rod && wheel), `${built.movers.length} moving parts (the Compressor's rod and wheel)`, 'the Compressor has no moving parts');
      const [y0, r0] = [rod?.position.y, wheel?.rotation.z];
      let threw = null;
      const eye = new THREE.Vector3(...world.spawn.pos);
      try { built.update(0.4, eye); for (let f = 0; f < 3; f++) built.update(1 / 60, eye); } catch (err) { threw = err; }
      check(!threw && rod.position.y !== y0 && wheel.rotation.z !== r0, 'the rod strokes and the wheel turns when the world updates', `the Compressor did not move${threw ? `: ${threw.message}` : ''}`);
      check(!threw && built.sky.position.distanceTo(eye) < 1e-6, 'the sky dome follows the eye', 'the sky dome did not follow the eye');
      check(built.vents.length + built.hostVents.length + (world.vents || []).length >= 2, 'plumes rise off the Compressor\'s stack and the cold box\'s vent', 'fewer than two plumes');
    }

    /* OVERLAPS */
    {
      const hits = findOverlaps(built.scene, { tolerance: 0.06, label: owner => owner.name || `${owner.type}#${owner.id}` });
      const pairs = new Map();
      for (const h of hits) {
        const key = [h.a, h.b].sort().join(' <-> ');
        if (!pairs.has(key) || pairs.get(key).depth < h.depth) pairs.set(key, h);
      }
      check(pairs.size === 0, `no two bodies share space — ${meshes} meshes measured`,
        `bodies occupy the same space:\n${[...pairs.entries()].map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`).join('\n')}`);
    }

    /* NOTHING IS BURIED */
    {
      const buried = [];
      const EXEMPT = new Set(['ground', 'ambient']);
      const tagOf = o => { for (let n = o; n; n = n.parent) if (n.userData?.phys) return n.userData.phys; return null; };
      const ownerName = o => { let n = o; while (n.parent && n.parent !== built.scene) n = n.parent; return n.name || n.type; };
      const test = (box, o) => {
        if (box.isEmpty() || box.getSize(new THREE.Vector3()).lengthSq() < 1e-8) return;
        const c = box.getCenter(new THREE.Vector3());
        const ground = built.getTerrainHeight(c.x, c.z);
        if (box.max.y < ground - 0.3 && buried.length < 10) buried.push(`${ownerName(o)}: tops out at ${box.max.y.toFixed(2)} under ground at ${ground.toFixed(2)}`);
      };
      built.scene.traverse(o => {
        if (!o.isMesh || EXEMPT.has(tagOf(o))) return;
        if (o.userData.partBoxes?.length) { for (const pb of o.userData.partBoxes) test(pb.clone().applyMatrix4(o.matrixWorld), o); return; }
        if (o.parent?.userData?.partBoxes?.length && o.userData.ownGeometry) { for (const pb of o.parent.userData.partBoxes) test(pb.clone().applyMatrix4(o.parent.matrixWorld), o); return; }
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        test(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), o);
      });
      check(buried.length === 0, 'no body is buried under the floor it stands on', buried.join('\n         '));
    }

    /* ONLY LAMPS ARE LIT; EVERY ROOM IS COVERED; NO OPAQUE MATERIAL SKIPS THE DEPTH BUFFER */
    {
      const lit = new Set();
      const noDepth = new Set();
      built.scene.traverse(o => {
        if (!o.isMesh || o === built.sky) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m && m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) lit.add(m);
          if (m && !m.transparent && m.depthWrite === false) noDepth.add(m);
        }
      });
      const strangers = [...lit].filter(m => m !== built.M.lantern);
      check(strangers.length === 0, `${lit.size} emissive material: the work lamps; nothing else is lit`, `${strangers.length} other emissive material(s)`);
      check(noDepth.size === 0, 'no opaque material sets depthWrite: false', `${noDepth.size} opaque material(s) skip the depth buffer`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight) realLights++; });
      check(realLights === 3 && built.lamps.length >= 30, `${built.lamps.length} lamps share ${realLights} pooled lights`, `${built.lamps.length} lamps and ${realLights} PointLights`);
      const uncovered = world.sites.filter(s => { const cv = built.cover.at(s.pos[0], s.pos[1] + 1.0, s.pos[2]); return cv.sun < 0.9 || cv.sky < 0.5; });
      check(uncovered.length === 0, `all ${world.sites.length} rooms are under the shared cover mask`, `uncovered rooms: ${uncovered.map(s => s.id).join(', ')}`);
      const passages = plan.roofedVols.filter(v => v.kind === 'passage').filter(v => {
        const cx = (v.rect.minX + v.rect.maxX) / 2, cz = (v.rect.minZ + v.rect.maxZ) / 2;
        return built.cover.at(cx, v.floor.y0 + 1.0, cz).sun < 0.9;
      });
      check(passages.length === 0, 'both passages (through the plinth and through the drum) are covered', `uncovered passages: ${passages.map(v => v.id).join(', ')}`);
      const foot = built.cover.at(HOLDER.x - HOLDER.r + 1.5, LEVEL.holder + 3, HOLDER.z);
      check(foot.sun >= 0.9, 'the drum\'s foot outside the meter house is covered too (it is seen over the partitions)', 'the drum\'s foot is lit by the sun');
      const open = built.cover.at(0, 1.0, 30);
      check(open.sun < 0.1, 'the apron is in the open sun', 'the apron is covered');
    }

    /* EVERY SITE: FACES ITS APPROACH, PLATE ON ITS FLOOR, CASED INSTRUMENT, GUIDE ROUTE THROUGH ITS DOOR */
    for (const site of world.sites) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: reports a working surface`, `${site.id} has no bench anchor`);
      if (!anchor) continue;
      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces its approach`, `${site.id}: wrong facing`);
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05, `${site.id}: plate at ${anchor.topY.toFixed(2)} on floor ${ground.toFixed(2)}`, `${site.id}: plate ${anchor.topY.toFixed(2)} vs floor ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: the cased instrument can be opened`, `${site.id}: no dormant cabinet`);
      const route = built.routeTo(site.id, world.spawn.pos);
      const room = ROOMS.find(rm => rm.site === site.id);
      const v = plan.byId.get(room.id);
      const door = plan.doorPoint(v, v.openings.find(o => o.to === room.door.to));
      const through = route.some(p => Math.hypot(p[0] - door[0], p[1] - door[1]) < 0.01);
      check(route.length >= 3 && through, `${site.id}: the guide routes through ${route.length - 2} doorways to the bench`, `${site.id}: the guide's route does not pass the room's door`);
    }

    /* HOST EXTENTS AND LEVEL FLOOR */
    {
      const off = [], uneven = [];
      for (const site of world.sites) {
        const g = built.siteMarkers.get(site.questId)?.group;
        const hp = HOST_PLAN[site.id];
        if (!g || !hp) { off.push(`${site.id}: missing`); continue; }
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const total = new THREE.Box3();
        g.traverse(o => {
          if (!o.isMesh || !o.geometry) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          total.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)));
        });
        const [x0, x1, z0, z1] = hp.extent;
        for (const [name, got, want, dir] of [['left', total.min.x, x0, -1], ['right', total.max.x, x1, 1], ['back', total.min.z, z0, -1], ['front', total.max.z, z1, 1]]) {
          if (dir * (got - want) > 0.25) off.push(`${site.id} outside ${name} by ${(dir * (got - want)).toFixed(2)} m`);
        }
        const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
        const c = Math.cos(a), sn = Math.sin(a);
        const at = (lx, lz) => [site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c];
        const hs = [];
        for (let lx = x0; lx <= x1; lx += 1.5) for (let lz = z0; lz <= LANE.to; lz += 1.5) { const [x, z] = at(lx, lz); hs.push(built.getTerrainHeight(x, z)); }
        if (Math.max(...hs) - Math.min(...hs) > 0.05) uneven.push(`${site.id} floor varies by ${(Math.max(...hs) - Math.min(...hs)).toFixed(2)} m`);
      }
      check(off.length === 0, 'every host stands inside its declared extent in host-plan.js', off.join('\n         '));
      check(uneven.length === 0, 'the floor under every host and its lane is dead level', uneven.join('\n         '));
    }

    /* A LAMP OVER EVERY PLATE */
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
        if (!over) bad.push(site.id);
      }
      check(bad.length === 0, `every bench (${world.sites.length}) has a pooled lamp over its plate`, `no lamp over: ${bad.join(', ')}`);
    }

    /* THE WALK: FLOOD FILL, ONE FLOOR, NOBODY LEAVES THE DECKS */
    {
      const f = S.flood(built, { bound: 100, cell: 0.5, radius: 0.25, step: 0.6 });
      check(f.ledges.length === 0, `${f.reached} cells of floor are walkable with no ledge`, `walkable ledges:\n         ${f.ledges.join('\n         ')}`);
      const hs = f.cells.map(c => c[2]);
      const minH = Math.min(...hs), maxH = Math.max(...hs);
      check(minH === LEVEL.holder && maxH === LEVEL.cold, `reachable floor spans ${minH.toFixed(2)} (the holder) to ${maxH.toFixed(2)} m (the cold deck)`, `reachable floor leaked: ${minH.toFixed(2)} to ${maxH.toFixed(2)} m`);
      const strays = f.cells.filter(([x, z]) => !plan.volumeAt(x, z));
      check(strays.length === 0, 'every reachable cell is inside a declared walk volume: nobody reaches a roof, a structure or the drop',
        `${strays.length} reachable cells lie outside the walk, first at (${strays[0]?.[0]}, ${strays[0]?.[1]})`);
      const low = S.lowBodies(built, THREE, f.cells, { every: 2 });
      check(low.length === 0, 'one floor: no body less than 2.4 m over reachable floor', `low bodies:\n         ${low.join('\n         ')}`);
      for (const site of world.sites) check(f.reachable(site.approachPos[0], site.approachPos[2], 1.2), `${site.id}: approach reachable from the spawn`, `${site.id}: unreachable`);
      const pad = world.landmarks.find(l => l.asset === 'landing-pad');
      check(f.reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the walk', 'the landing pad is walled off');
      const A = world.arena;
      check(f.reachable(A.player[0], A.player[2], 1.0) && f.reachable(A.boss[0], A.boss[2], 1.0), "the Compressor's ground and the player's mark are reachable", "the boss's ground is sealed off");
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (f.blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Compressor are open deck', 'something stands within seven metres of the Compressor');
      const sp = world.spawn.pos;
      check(Math.abs(built.getTerrainHeight(sp[0], sp[2]) + 1.6 - sp[1]) < 0.05 && f.reachable(sp[0], sp[2], 0.5), 'the spawn stands on the landing stage at eye height', 'the spawn is off the floor');

      /* THE FIELD POINT: the cold box's draw-off, a piece of its host, in reach of a clear, level place to stand. */
      const { fieldPointsOf } = await import('../src/three/field-points.js');
      const points = fieldPointsOf(built);
      check(points.some(p => p.id === 'drawoff' && p.siteId === 'site-6'), 'the "drawoff" point feeds site-6 (the cold box\'s draw-off)', 'no "drawoff" field point feeds site-6');
      const bad = [];
      for (const p of points) {
        const site = world.sites.find(s => s.id === p.host);
        if (!site) { bad.push(`${p.id}: names host ${p.host}, which is not a site`); continue; }
        if (Math.hypot(p.pos[0] - site.pos[0], p.pos[2] - site.pos[2]) > 12) bad.push(`${p.id}: too far from its bench to be its host's own`);
        const [sx, , sz] = p.stand;
        if (f.blocked(sx, sz)) bad.push(`${p.id}: the place to stand is inside a collider`);
        if (!f.blocked(p.pos[0], p.pos[2])) bad.push(`${p.id}: nothing solid stands at the point`);
        const g1 = built.getTerrainHeight(sx, sz), g2 = built.getTerrainHeight(p.pos[0], p.pos[2]);
        if (Math.abs(g1 - g2) > 0.3 || p.pos[1] - g2 < 0.2 || p.pos[1] - g2 > 2.4) bad.push(`${p.id}: the floor to stand on is not level with the point, or the point floats`);
        const d = Math.hypot(sx - p.pos[0], sz - p.pos[2]);
        if (d > p.reach - 0.5) bad.push(`${p.id}: the stand is ${d.toFixed(1)} m from the point, outside its reach`);
        if (!f.reachable(sx, sz, 0.4)) bad.push(`${p.id}: the place to stand cannot be reached from the spawn`);
        const [ax, az] = [site.approachPos[0], site.approachPos[2]];
        const L = Math.hypot(sx - ax, sz - az);
        for (let t = 0; t <= L; t += 0.5) {
          const x = ax + (sx - ax) * t / (L || 1), z = az + (sz - az) * t / (L || 1);
          if (!f.reachable(x, z, 0.4)) { bad.push(`${p.id}: the way from the approach to the stand is blocked at (${x.toFixed(1)}, ${z.toFixed(1)})`); break; }
        }
      }
      check(bad.length === 0, `${points.length} field point(s): each a piece of its host, with a clear, level place to stand in reach and an open way to it`, bad.join('\n         '));
    }
  }
}

console.log('');
if (failures) {
  console.log(`BELLOWS FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('BELLOWS OK');
