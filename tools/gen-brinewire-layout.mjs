#!/usr/bin/env node
/**
 * gen-brinewire-layout.mjs — Lays out Brinewire's tidal barrage and writes `src/three/world-data/brinewire.json`.
 *
 * The wall, the crest road, the ramp, the gallery and the rooms are declared in `src/three/brinewire/barrage-plan.js`, and which
 * bench stands in which room in `src/three/brinewire/host-plan.js`. This script checks the two agree, places the sites (plate,
 * approach mark, floor), the pad and the lamp posts on the open walk, and writes the JSON the stage, the voyage, the lower tiers
 * and the checks read. A site is `built` exactly when its quest has a module in `src/learn/quests/unit10/`. Deterministic: run it
 * twice, get the same file. (The first build's generator, which laid the benches in two columns either side of a plank spine over
 * a field of pools, is in `archive/2026-11-17/site-brinewire/tools/`.)
 *
 * Run: node tools/gen-brinewire-layout.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  makeBarragePlan, SPAWN, SPAWN_LOOK, PAD, ARENA, WALL, YARD_N, YARD_S, APRON, CREST, FOOT, GALLERY, WALK
} from '../src/three/brinewire/barrage-plan.js';
import { HOST_PLAN, LANE, APPROACH, toWorld } from '../src/three/brinewire/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;
let problems = 0;
const bad = msg => { problems++; console.error(`  ${msg}`); };

const plan = makeBarragePlan();
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
  const built = existsSync(join(root, 'src/learn/quests/unit10', `${p.questId}.js`));
  return {
    id, questId: p.questId, stage: i + 1,
    pos: [p.pos[0], round(room.level), p.pos[1]],
    approachPos: [round(ax), round(room.level + 1.6), round(az)],
    label: p.label, structure: p.structure, built, room: room.id
  };
}).filter(Boolean);
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const d = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (d < 20) bad(`${sites[i].id} and ${sites[j].id} are ${d.toFixed(1)} m apart`);
}

/* ---------------------------------------------------------------- the pad and the lamp posts */

const landmarks = [{ asset: 'landing-pad', pos: [PAD[0], CREST, PAD[1]], rotY: 0, radius: 10, minTier: 'T3' }];
const post = (x, z) => landmarks.push({ asset: 'lamp-post', pos: [round(x), round(plan.height(x, z)), round(z)], rotY: 0, radius: 0.6, minTier: 'T3' });
// The crest road: along its west parapet, clear of the gate houses' doors; the posts stand a metre in off the parapet.
const doors = plan.rooms.filter(r => r.onto === 'road').map(r => [r.door.rect.minZ - 2.5, r.door.rect.maxZ + 2.5]);
for (let z = YARD_N.maxZ + 4; z < YARD_S.minZ - 1; z += 14) {
  if (doors.some(([a, b]) => z > a && z < b)) continue;
  post(WALL.roadW + 1.0, z);
}
// The north yard, by the pad and the head of the road; the south yard, at the road's foot and the ramp's head.
post(YARD_N.maxX - 1.0, YARD_N.maxZ - 2);
post(YARD_N.minX + 1.2, YARD_N.maxZ - 2);
post(WALL.roadW + 1.0, YARD_S.minZ + 8);
post(YARD_S.maxX - 1.0, YARD_S.minZ + 6);
post(YARD_S.minX + 12, YARD_S.minZ + 1.0);
post(YARD_S.minX + 26, YARD_S.minZ + 1.0);
// The foot: by the ramp's foot, along the wall's face to the cage's door, round the Clamp's ground.
post(APRON.minX + 9.4, APRON.maxZ - 2.5);
post(APRON.minX + 13.2, APRON.maxZ - 15);
for (const [x, z] of [[24, -62], [24, -85], [44.6, -58], [44.6, -84], [32, -90.6]]) post(x, z);
for (const l of landmarks) {
  if (l.asset === 'landing-pad') continue;
  const v = plan.volumeAt(l.pos[0], l.pos[2]);
  if (!v || !['road', 'yard', 'apron'].includes(v.kind)) bad(`lamp-post@${l.pos[0]},${l.pos[2]} is not on the road, a yard or the apron`);
  if (Math.hypot(l.pos[0] - ARENA.boss[0], l.pos[2] - ARENA.boss[2]) < 8) bad(`lamp-post@${l.pos[0]},${l.pos[2]} is on the Clamp's ground`);
  if (Math.hypot(l.pos[0] - PAD[0], l.pos[2] - PAD[1]) < 11) bad(`lamp-post@${l.pos[0]},${l.pos[2]} is on the pad`);
}
if (Math.hypot(SPAWN[0] - PAD[0], SPAWN[2] - PAD[1]) < 14) bad('the spawn is on the pad');
if (plan.volumeAt(SPAWN[0], SPAWN[2])?.id !== 'yard-n') bad('the spawn is not on the north yard');
if (plan.volumeAt(ARENA.boss[0], ARENA.boss[2])?.id !== 'apron' || plan.volumeAt(ARENA.player[0], ARENA.player[2])?.id !== 'apron') bad('the Clamp\'s ground is not on the apron');

/* ---------------------------------------------------------------- the world */

if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

const world = {
  id: 'brinewire',
  name: 'Brinewire',
  place: 'Copper marsh',
  oneLine: 'Redox reactions, galvanic cells, cell potentials and electrolysis.',
  sky: 'brinewire-sky',
  ambience: { keyLight: 0xf4e3bd, fillLight: 0xbfc6c4, fogColor: 0xc4b9a0, fogNear: 70, fogFar: 760 },
  walk: WALK,
  barrage: {
    levels: { crest: CREST, gallery: GALLERY, foot: FOOT },
    wall: { ...WALL },
    volumes: plan.volumes.map(v => ({ id: v.id, kind: v.kind, rect: v.rect })),
    rooms: plan.rooms.map(r => ({ id: r.id, site: r.site, shell: r.shell, rect: r.vol.rect, floor: r.level, top: r.top }))
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

writeFileSync(join(root, 'src/three/world-data/brinewire.json'), JSON.stringify(world, null, 2) + '\n');
console.log(`Brinewire: ${plan.volumes.length} volumes (${plan.rooms.length} rooms), ${sites.length} sites, ${landmarks.length} landmarks written.`);
void APRON;
