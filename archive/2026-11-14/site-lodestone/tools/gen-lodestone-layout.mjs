#!/usr/bin/env node
/**
 * gen-lodestone-layout.mjs — Lays out Lodestone's canyon depot and writes `src/three/world-data/lodestone.json`.
 *
 * Run: node tools/gen-lodestone-layout.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE, APPROACH, CANYON } from '../src/three/lodestone/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x10de12);
const round = n => Math.round(n * 100) / 100;

const ARENA = { boss: [0, 0, -58], player: [0, 1.6, -42] };
const PLAZA = { minX: -14, maxX: 14, minZ: -68, maxZ: -34 };
const SPAWN = [0, 1.6, 90];
const PAD = [24, 84];

const SITE_DEFS = Object.entries(HOST_PLAN).map(([id, plan], i) => ({
  id, plan, stage: i + 1, pos: plan.pos, f: plan.face
}));

function toWorld(def, lx, lz) {
  const [px, pz] = def.pos;
  const [fx, fz] = def.f;
  return [px + lx * fz + lz * fx, pz - lx * fx + lz * fz];
}

function hostRect(def, [x0, x1, z0, z1]) {
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => toWorld(def, lx, lz));
  return {
    minX: Math.min(...pts.map(p => p[0])),
    maxX: Math.max(...pts.map(p => p[0])),
    minZ: Math.min(...pts.map(p => p[1])),
    maxZ: Math.max(...pts.map(p => p[1]))
  };
}

const unionRect = (a, b) => ({
  minX: Math.min(a.minX, b.minX),
  maxX: Math.max(a.maxX, b.maxX),
  minZ: Math.min(a.minZ, b.minZ),
  maxZ: Math.max(a.maxZ, b.maxZ)
});

const rectOverlap = (a, b, gap = 0) => (
  a.minX < b.maxX + gap && a.maxX > b.minX - gap && a.minZ < b.maxZ + gap && a.maxZ > b.minZ - gap
);

const questExists = id => existsSync(join(root, 'src/learn/quests/unit12', `${id}.js`));

const sites = SITE_DEFS.map(d => {
  const [fx, fz] = d.f;
  const area = unionRect(hostRect(d, d.plan.extent), hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]));
  const cx = (area.minX + area.maxX) / 2;
  const cz = (area.minZ + area.maxZ) / 2;
  return {
    id: d.id,
    questId: d.plan.questId,
    stage: d.stage,
    pos: [d.pos[0], 0, d.pos[1]],
    approachPos: [round(d.pos[0] + fx * APPROACH), 1.6, round(d.pos[1] + fz * APPROACH)],
    label: d.plan.label,
    structure: d.plan.structure,
    built: questExists(d.plan.questId),
    flat: {
      x: round(cx),
      z: round(cz),
      r: round(Math.hypot(area.maxX - area.minX, area.maxZ - area.minZ) / 2 + 1.0)
    }
  };
});

// Spine road + 6 spur catwalks + pad connector
const roads = [
  { id: 'haul-road', w: 6.4, pts: [[0, 94], [0, -40]] },
  { id: 'pad-spur', w: 5.0, pts: [[0, 84], [15, 84]] },
  ...SITE_DEFS.map(d => ({
    id: `spur-${d.id}`,
    w: 4.8,
    pts: [[0, d.pos[1]], [round(d.pos[0] + d.f[0] * 4.6), d.pos[1]]]
  }))
];

// Keep-out rectangles for landmarks
const keepOut = [
  PLAZA,
  { minX: -6, maxX: 6, minZ: -42, maxZ: 98 }, // haul road
  { minX: 12, maxX: 36, minZ: 72, maxZ: 96 }, // landing pad
  { minX: -2, maxX: 16, minZ: 80, maxZ: 88 }, // pad spur
  ...SITE_DEFS.map(d => unionRect(hostRect(d, d.plan.extent), hostRect(d, [-LANE.hw - 1, LANE.hw + 1, LANE.from - 1, LANE.to + 1]))),
  ...SITE_DEFS.map(d => {
    const x0 = Math.min(0, d.pos[0]);
    const x1 = Math.max(0, d.pos[0]);
    return { minX: x0 - 2, maxX: x1 + 2, minZ: d.pos[1] - 4, maxZ: d.pos[1] + 4 };
  })
];

const landmarks = [];
const placedRects = [...keepOut];

function tryPlace(kind, x, z, hw, hd, extra = {}) {
  const r = { minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd };
  if (Math.abs(x) + hw > CANYON.wallX - 3 || z + hd > CANYON.north - 3 || z - hd < CANYON.south + 3) return false;
  for (const k of placedRects) {
    if (rectOverlap(r, k, 1.5)) return false;
  }
  placedRects.push(r);
  landmarks.push({ asset: kind, pos: [round(x), 0, round(z)], rotY: round(rnd() * Math.PI * 2), radius: round(Math.max(hw, hd)), ...extra });
  return true;
}

landmarks.push({ asset: 'landing-pad', pos: [PAD[0], 0, PAD[1]], rotY: 0, radius: 10 });
placedRects.push({ minX: PAD[0] - 11, maxX: PAD[0] + 11, minZ: PAD[1] - 11, maxZ: PAD[1] + 11 });

// Lamp posts along the haul road (never on the plaza or a lane).
for (const z of [80, 56, 38, 20, 2, -16, -32]) {
  tryPlace('lamp-post', -8.6, z, 0.6, 0.6);
  tryPlace('lamp-post', 8.6, z, 0.6, 0.6);
}

// The depot: drum stacks between the hosts, ore heaps and magnetite boulders toward the walls, the Coil's masts round its bowl.
const candidates = [
  ['drum-stack', -14, 76, 2.0, 1.6], ['drum-stack', 14, 58, 2.0, 1.6], ['drum-stack', -14, 40, 2.0, 1.6], ['drum-stack', 14, 22, 2.0, 1.6],
  ['drum-stack', -14, 4, 2.0, 1.6], ['drum-stack', 14, -12, 2.0, 1.6], ['drum-stack', -14, -24, 2.0, 1.6], ['drum-stack', 14, 72, 2.0, 1.6],
  ['ore-heap', -38, 82, 2.6, 2.6], ['ore-heap', 38, 64, 2.6, 2.6], ['ore-heap', -38, 46, 2.6, 2.6], ['ore-heap', 38, 28, 2.6, 2.6],
  ['ore-heap', -38, 10, 2.6, 2.6], ['ore-heap', 38, -8, 2.6, 2.6], ['ore-heap', -38, -26, 2.6, 2.6], ['ore-heap', 38, -44, 2.6, 2.6],
  ['lode-boulder', 36, 86, 1.7, 1.7], ['lode-boulder', -36, 64, 1.7, 1.7], ['lode-boulder', 36, 46, 1.7, 1.7], ['lode-boulder', -36, 28, 1.7, 1.7],
  ['lode-boulder', 36, 10, 1.7, 1.7], ['lode-boulder', -36, -8, 1.7, 1.7], ['lode-boulder', -30, -52, 1.7, 1.7], ['lode-boulder', 30, -64, 1.7, 1.7],
  ['coil-mast', -18, -50, 1.2, 1.2], ['coil-mast', 18, -50, 1.2, 1.2], ['coil-mast', -18, -66, 1.2, 1.2], ['coil-mast', 18, -66, 1.2, 1.2]
];
for (const [kind, x, z, hw, hd] of candidates) tryPlace(kind, x, z, hw, hd);

const out = {
  id: 'lodestone',
  name: 'Lodestone',
  sky: 'lodestone-sky',
  canyon: CANYON,
  spawn: SPAWN,
  pad: { pos: [PAD[0], 0, PAD[1]], r: 10 },
  arena: ARENA,
  plaza: PLAZA,
  roads,
  sites,
  landmarks
};

const outPath = join(root, 'src/three/world-data/lodestone.json');
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outPath}: ${sites.length} sites, ${landmarks.length} landmarks, ${roads.length} roads.`);
