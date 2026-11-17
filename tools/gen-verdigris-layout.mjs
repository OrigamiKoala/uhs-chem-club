#!/usr/bin/env node
/**
 * gen-verdigris-layout.mjs — Lays out Verdigris's drowned fort and writes `src/three/world-data/verdigris.json`.
 *
 * The fort, its boardwalks, towers, cisterns and gatehouse are declared in `src/three/verdigris/fort-plan.js`, and which
 * bench stands in which room in `src/three/verdigris/host-plan.js`. This script checks the two agree, places the sites
 * (plate, approach mark, floor) and the pad, and writes the JSON the stage, the voyage, the lower tiers and the checks
 * read. Deterministic: run it twice, get the same file. A site is `built` when its quest has a module in
 * `src/learn/quests/unit09/`: rerun this script when one lands.
 * (The first build's generator, which laid the benches in two columns either side of a plank spine, is in
 * `archive/2026-11-16/site-verdigris/tools/`.)
 *
 * Run: node tools/gen-verdigris-layout.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makeFortPlan, SPAWN, SPAWN_LOOK, PAD, ARENA, DECK, WATER, WALK, FORT } from '../src/three/verdigris/fort-plan.js';
import { HOST_PLAN, LANE, APPROACH, toWorld } from '../src/three/verdigris/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;
let problems = 0;
const bad = msg => { problems++; console.error(`  ${msg}`); };

const plan = makeFortPlan();
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
  return {
    id, questId: p.questId, stage: i + 1,
    pos: [p.pos[0], round(room.level), p.pos[1]],
    approachPos: [round(ax), round(room.level + 1.6), round(az)],
    label: p.label, structure: p.structure, built: existsSync(join(root, 'src/learn/quests/unit09', `${p.questId}.js`)), room: room.id
  };
}).filter(Boolean);
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const d = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (d < 20) bad(`${sites[i].id} and ${sites[j].id} are ${d.toFixed(1)} m apart`);
}

/* ---------------------------------------------------------------- the pad, the spawn, the arena */

const landmarks = [{ asset: 'landing-pad', pos: [PAD[0], DECK, PAD[1]], rotY: 0, radius: 10, minTier: 'T3' }];
if (Math.hypot(SPAWN[0] - PAD[0], SPAWN[2] - PAD[1]) < 14) bad('the spawn is on the pad');
if (plan.volumeAt(SPAWN[0], SPAWN[2])?.id !== 'stage') bad('the spawn is not on the landing stage');
if (plan.volumeAt(PAD[0], PAD[1])?.id !== 'stage') bad('the pad is not on the landing stage');
{
  const st = plan.byId.get('stage').rect;
  if (PAD[0] - 10 < st.minX || PAD[0] + 10 > st.maxX || PAD[1] - 10 < st.minZ || PAD[1] + 10 > st.maxZ) bad('the pad overhangs the landing stage');
}
if (plan.volumeAt(ARENA.boss[0], ARENA.boss[2])?.id !== 'pump' || plan.volumeAt(ARENA.player[0], ARENA.player[2])?.id !== 'pump') bad('the Leach\'s ground is not on the pump stage');

/* ---------------------------------------------------------------- the world */

if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

const world = {
  id: 'verdigris',
  name: 'Verdigris',
  place: 'Acid marsh',
  oneLine: 'Acids and bases, pH, weak acid equilibria, titration curves and buffers.',
  sky: 'verdigris-sky',
  // Thick fog: the reeds and the walls close the near view, the fog the far one.
  ambience: { keyLight: 0xf1ead2, fillLight: 0xa9b8ae, fogColor: 0xa3ae9f, fogNear: 4, fogFar: 220 },
  walk: WALK,
  fort: {
    faces: { ...FORT },
    deck: DECK,
    water: WATER,
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

writeFileSync(join(root, 'src/three/world-data/verdigris.json'), JSON.stringify(world, null, 2) + '\n');
console.log(`Verdigris: ${plan.volumes.length} volumes (${plan.rooms.length} rooms), ${plan.structures().length} structures, ${sites.length} sites, ${landmarks.length} landmarks written.`);
