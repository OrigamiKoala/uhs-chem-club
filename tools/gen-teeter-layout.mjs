#!/usr/bin/env node
/**
 * gen-teeter-layout.mjs — Lays out Teeter's hillside of salt terraces and writes `src/three/world-data/teeter.json`.
 *
 * The terraces, the stair, the dikes and the rooms in the terrace walls are declared in `src/three/teeter/terrace-plan.js`,
 * and which bench stands in which room in `src/three/teeter/host-plan.js`. This script checks the two agree, places the
 * sites (plate, approach mark, floor), the pad and the lamp posts along the dikes, and writes the JSON the stage, the
 * voyage, the lower tiers and the checks read. Deterministic: run it twice, get the same file.
 * (The first build's generator, which laid the benches in two columns either side of a causeway, is in
 * `archive/2026-11-16/site-teeter/tools/`.)
 *
 * Run: node tools/gen-teeter-layout.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makeTerracePlan, SPAWN, SPAWN_LOOK, PAD, ARENA, LEVEL, FACE, DIKE_W, SHELF, FLOOR4, STAIR, WALK } from '../src/three/teeter/terrace-plan.js';
import { HOST_PLAN, LANE, APPROACH, toWorld } from '../src/three/teeter/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;
let problems = 0;
const bad = msg => { problems++; console.error(`  ${msg}`); };

const plan = makeTerracePlan();
for (const p of plan.problems()) bad(p);

/* ---------------------------------------------------------------- the sites */

const sites = Object.entries(HOST_PLAN).map(([id, p], i) => {
  const room = plan.roomById.get(p.room);
  if (!room) { bad(`${id}: no room ${p.room}`); return null; }
  if (room.site !== id) bad(`${id}: ${room.id} is declared for ${room.site}`);
  const [ax, az] = toWorld(p, 0, APPROACH);
  // The plate, its feet and its lane lie on the room's level floor, inside it.
  for (const [lx, lz] of [[-2.5, -0.7], [2.5, -0.7], [-LANE.hw, LANE.from], [LANE.hw, LANE.from], [-LANE.hw, LANE.to], [LANE.hw, LANE.to], [0, APPROACH]]) {
    const [x, z] = toWorld(p, lx, lz);
    if (plan.volumeAt(x, z) !== room.vol) bad(`${id}: its plate or lane leaves ${room.id} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
    if (Math.abs(plan.height(x, z) - room.level) > 1e-6) bad(`${id}: the floor under its plate or lane is not level at (${x.toFixed(1)}, ${z.toFixed(1)})`);
  }
  if (!existsSync(join(root, 'src/learn/quests/unit08', `${p.questId}.js`))) bad(`${id}: no quest module ${p.questId}`);
  return {
    id, questId: p.questId, stage: i + 1,
    pos: [p.pos[0], round(room.level), p.pos[1]],
    approachPos: [round(ax), round(room.level + 1.6), round(az)],
    label: p.label, structure: p.structure, built: true, room: room.id
  };
}).filter(Boolean);
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const d = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (d < 20) bad(`${sites[i].id} and ${sites[j].id} are ${d.toFixed(1)} m apart`);
}

/* ---------------------------------------------------------------- the pad and the lamp posts */

const landmarks = [{ asset: 'landing-pad', pos: [PAD[0], LEVEL[0], PAD[1]], rotY: 0, radius: 10, minTier: 'T3' }];
const post = (x, z) => landmarks.push({ asset: 'lamp-post', pos: [round(x), round(plan.height(x, z)), round(z)], rotY: 0, radius: 0.6, minTier: 'T3' });
// On the shelf, from the spawn to the stair's head.
post(SHELF.minX + 1.2, 30); post(SHELF.minX + 1.2, 42.6);
// Along every dike, on its kerb side, from the stair north past its last room; on the drying floor, by its east wall.
for (const k of [1, 2, 3]) {
  const d = plan.byId.get(`dike-${k}`).rect;
  const x = FACE[k] - DIKE_W + 0.9;
  for (let z = STAIR.z0 - 3; z > d.minZ + 2; z -= 15) post(x, z);
}
{
  const x = FLOOR4.maxX - 7;
  for (let z = STAIR.z0 - 4; z > FLOOR4.minZ + 2; z -= 16) {
    if (Math.hypot(x - ARENA.boss[0], z - ARENA.boss[2]) < 9) continue;
    post(x, z);
  }
}
for (const l of landmarks) {
  if (l.asset === 'landing-pad') continue;
  const v = plan.volumeAt(l.pos[0], l.pos[2]);
  if (!v || v.kind === 'ramp' || v.kind === 'room') bad(`lamp-post@${l.pos[0]},${l.pos[2]} is not on a dike or the floor`);
}
if (Math.hypot(SPAWN[0] - PAD[0], SPAWN[2] - PAD[1]) < 14) bad('the spawn is on the pad');
if (plan.volumeAt(SPAWN[0], SPAWN[2])?.id !== 'shelf') bad('the spawn is not on the shelf');
if (plan.volumeAt(ARENA.boss[0], ARENA.boss[2])?.id !== 'floor' || plan.volumeAt(ARENA.player[0], ARENA.player[2])?.id !== 'floor') bad('the Tipper\'s ground is not on the drying floor');

/* ---------------------------------------------------------------- the world */

if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

const world = {
  id: 'teeter',
  name: 'Teeter',
  place: 'Salt pans',
  oneLine: 'Dynamic equilibrium, equilibrium constants, Le Chatelier’s principle, solubility and free energy.',
  sky: 'teeter-sky',
  ambience: { keyLight: 0xfff1d8, fillLight: 0xcfd6d6, fogColor: 0xdedacb, fogNear: 90, fogFar: 680 },
  walk: WALK,
  terraces: {
    levels: LEVEL.slice(0, 5),
    walls: FACE.slice(1, 6),
    volumes: plan.volumes.map(v => ({ id: v.id, kind: v.kind, rect: v.rect })),
    rooms: plan.rooms.map(r => ({ id: r.id, site: r.site, wall: r.wall, shell: r.shell, rect: r.vol.rect, floor: r.level, top: r.top }))
  },
  arena: { boss: [...ARENA.boss], player: [...ARENA.player] },
  roads: [],
  landmarks,
  sites,
  spawn: { pos: SPAWN, lookAt: SPAWN_LOOK },
  // The still for the baked tier stands at the approach mark, at the eye, on its room's floor, looking at the plate.
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], round(s.pos[1] + 1.2), s.pos[2]] }])) },
  t1: { siteOrder: sites.map(s => s.id) }
};

writeFileSync(join(root, 'src/three/world-data/teeter.json'), JSON.stringify(world, null, 2) + '\n');
console.log(`Teeter: ${plan.volumes.length} volumes (${plan.rooms.length} rooms), ${plan.pans().length} pans, ${sites.length} sites, ${landmarks.length} landmarks written.`);
