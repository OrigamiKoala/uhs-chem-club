#!/usr/bin/env node
/**
 * gen-quicklight-layout.mjs — Lays out Quicklight's storm-belt refinery and writes `src/three/world-data/quicklight.json`.
 *
 * Run: node tools/gen-quicklight-layout.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE, APPROACH } from '../src/three/quicklight/host-plan.js';

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
const rnd = mulberry32(0x91c417);
const round = n => Math.round(n * 100) / 100;

const ARENA = { boss: [0, 0, -54], player: [0, 1.6, -38] };
const PLAZA = { minX: -14, maxX: 14, minZ: -64, maxZ: -30 };
const SPAWN = [0, 1.6, 92];
const PAD = [60, 84];

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

const questExists = id => existsSync(join(root, 'src/learn/quests/unit11', `${id}.js`));

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
  { id: 'spine', w: 6.4, pts: [[0, 94], [0, -36]] },
  { id: 'pad-spur', w: 5.0, pts: [[0, 84], [48, 84]] },
  ...SITE_DEFS.map(d => ({
    id: `spur-${d.id}`,
    w: 4.8,
    pts: [[0, d.pos[1]], [round(d.pos[0] + d.f[0] * 4.6), d.pos[1]]]
  }))
];

// Keep-out rectangles for landmarks
const keepOut = [
  PLAZA,
  { minX: -6, maxX: 6, minZ: -38, maxZ: 98 }, // spine
  { minX: 46, maxX: 74, minZ: 70, maxZ: 98 }, // landing pad
  { minX: -2, maxX: 50, minZ: 80, maxZ: 88 }, // pad spur
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
  if (Math.abs(x) > 88 || Math.abs(z) > 88) return false;
  for (const k of placedRects) {
    if (rectOverlap(r, k, 1.5)) return false;
  }
  placedRects.push(r);
  landmarks.push({ kind, pos: [round(x), 0, round(z)], yaw: round(rnd() * Math.PI * 2), ...extra });
  return true;
}

// Place lamp posts along spine and spurs (never in plaza or lanes)
for (const z of [78, 54, 36, 20, 2, -14, -28]) {
  tryPlace('lamp-post', -4.2, z, 0.8, 0.8);
  tryPlace('lamp-post', 4.2, z, 0.8, 0.8);
}

// Place cracking towers, storage tanks, manifold racks, and storm pylons in outer quadrants
const candidates = [
  ['cracking-tower', -24, 72, 4.5, 4.5],
  ['cracking-tower', 24, 64, 4.5, 4.5],
  ['cracking-tower', -24, 42, 4.5, 4.5],
  ['cracking-tower', 24, 26, 4.5, 4.5],
  ['cracking-tower', -24, 8, 4.5, 4.5],
  ['cracking-tower', 24, -8, 4.5, 4.5],
  ['storage-tank', -22, -24, 4.2, 4.2],
  ['storage-tank', 22, -40, 4.2, 4.2],
  ['storage-tank', -64, 48, 4.2, 4.2],
  ['storage-tank', 64, 30, 4.2, 4.2],
  ['storage-tank', -64, 12, 4.2, 4.2],
  ['storage-tank', 64, -8, 4.2, 4.2],
  ['manifold-rack', -20, 52, 3.2, 2.2],
  ['manifold-rack', 20, 38, 3.2, 2.2],
  ['manifold-rack', -20, 18, 3.2, 2.2],
  ['manifold-rack', 20, 2, 3.2, 2.2],
  ['storm-pylon', -68, 72, 2.5, 2.5],
  ['storm-pylon', 68, 58, 2.5, 2.5],
  ['storm-pylon', -68, -24, 2.5, 2.5],
  ['storm-pylon', 68, -42, 2.5, 2.5]
];

for (const [kind, x, z, hw, hd] of candidates) {
  tryPlace(kind, x, z, hw, hd);
}

const out = {
  id: 'quicklight',
  name: 'Quicklight',
  sky: 'quicklight-sky',
  spawn: SPAWN,
  pad: { pos: [PAD[0], 0, PAD[1]], r: 10 },
  arena: ARENA,
  plaza: PLAZA,
  roads,
  sites,
  landmarks
};

const outPath = join(root, 'src/three/world-data/quicklight.json');
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outPath}: ${sites.length} sites, ${landmarks.length} landmarks, ${roads.length} roads.`);
