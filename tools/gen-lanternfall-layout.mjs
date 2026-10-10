#!/usr/bin/env node
/**
 * gen-lanternfall-layout.mjs — Lays out Lanternfall's ground and writes
 * `src/three/world-data/lanternfall.json`.
 *
 * Lanternfall is an ice field under a permanent aurora. The nine benches stand
 * on a ring of packed ice round a frozen lake, a lantern road lighting the way
 * between them, with the Avalon's pad on the near side and the ice country
 * standing off outside the ring. The layout is DETERMINISTIC (seeded), and the
 * generator holds itself to the rules `verify:lanternfall` holds the world to:
 * every footprint disjoint, every site clear of every prop, every approach on
 * open ground facing the way the player walks in.
 *
 * Run: node tools/gen-lanternfall-layout.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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
const rnd = mulberry32(0x1a77e12);
const round = n => Math.round(n * 100) / 100;

const RING = 52;           // where the benches stand
const LAKE = 24;           // the frozen lake's radius, at the middle

/* ---------------------------------------------------------------- the sites */

const QUESTS = [
  ['q1-wave', 'Light Waves', 'wave-hut'],
  ['q2-photon', 'Photons', 'photon-hut'],
  ['q3-lines', 'Line Spectra', 'prism-hall'],
  ['q4-cloud', 'Orbitals', 'cloud-dome'],
  ['q5-numbers', 'Quantum Numbers', 'number-board'],
  ['q6-filling', 'Electron Configuration', 'filling-gallery'],
  ['q7-pes', 'Photoelectron Spectroscopy', 'spectrum-bay'],
  ['q8-trends', 'Periodic Trends', 'trend-table'],
  ['q9-absorb', 'Spectroscopy', 'cuvette-lab']
];

const sites = QUESTS.map(([questId, title, structure], i) => {
  const a = (32 + i * 37) * Math.PI / 180;   // from due south, round the ring, leaving a gap at the spawn
  const x = RING * Math.sin(a);
  const z = RING * Math.cos(a);
  const ax = (RING - 4.6) * Math.sin(a);
  const az = (RING - 4.6) * Math.cos(a);
  return {
    id: `site-${i + 1}`, questId, stage: i + 1,
    pos: [round(x), 0, round(z)],
    approachPos: [round(ax), 1.6, round(az)],
    label: `Bench ${i + 1} - ${title}`,
    structure, built: true
  };
});

/* ---------------------------------------------------------------- the props */

const landmarks = [];
const taken = [];       // { x, z, r }
const fits = (x, z, r, pad = 0.6) => taken.every(t => Math.hypot(x - t.x, z - t.z) >= t.r + r + pad);
function add(asset, x, z, radius, extra = {}) {
  landmarks.push({ asset, pos: [round(x), 0, round(z)], radius, ...extra });
  taken.push({ x, z, r: radius });
}

// Every site claims its shelter and the walk to its bench before anything else is placed.
for (const s of sites) {
  taken.push({ x: s.pos[0], z: s.pos[2], r: 6.4 });
  taken.push({ x: s.approachPos[0], z: s.approachPos[2], r: 3.2 });
}
// The spawn and the way in from it.
taken.push({ x: 0, z: 84, r: 4 }, { x: 0, z: 66, r: 4 }, { x: 0, z: 48, r: 4 });

// The landing pad: south-east, low and wide, on open ice.
add('landing-pad', 52, 80, 8.5, { minTier: 'T3' });

// The two things somebody left standing are placed first, so everything scattered round them keeps clear.
add('ice-crawler', -74, 24, 5.6, { rotY: 0.6, minTier: 'T3' });
add('comms-mast', 64, 70, 1.4, { minTier: 'T3' });

// The lake is walkable and carries no prop; a ring of lantern posts marks the road.
const POSTS = 26;
for (let i = 0; i < POSTS; i++) {
  const a = (i / POSTS) * Math.PI * 2 + 0.07;
  const r = RING - 9;
  const x = r * Math.sin(a), z = r * Math.cos(a);
  if (fits(x, z, 0.6, 0.4)) add('lantern-post', x, z, 0.6, { minTier: 'T3' });
}

// The ice country: spires, ridges, camps and the things somebody left.
function scatter(asset, count, rMin, rMax, radius, extra = () => ({})) {
  let placed = 0;
  for (let k = 0; k < 4000 && placed < count; k++) {
    const a = rnd() * Math.PI * 2;
    const r = rMin + rnd() * (rMax - rMin);
    const x = r * Math.sin(a), z = r * Math.cos(a);
    if (Math.abs(x) > 92 || Math.abs(z) > 92) continue;
    // Keep clear of the lake, whatever else.
    if (Math.hypot(x, z) < LAKE + radius + 4) continue;
    if (!fits(x, z, radius)) continue;
    add(asset, x, z, radius, extra());
    placed++;
  }
}
scatter('ice-spire', 14, 62, 92, 3.0, () => ({ scale: round(0.8 + rnd() * 1.0), rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('ice-spire', 6, 30, 44, 2.4, () => ({ scale: round(0.6 + rnd() * 0.6), rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('pressure-ridge', 9, 60, 92, 6.5, () => ({ scale: round(0.8 + rnd() * 0.5), rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('aurora-mast', 4, 66, 90, 2.0, () => ({ minTier: 'T3' }));
scatter('camp', 4, 58, 88, 3.6, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('camp', 2, 32, 42, 3.6, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('sled', 5, 40, 90, 1.8, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));
scatter('stake-marker', 6, 36, 90, 0.35, () => ({ minTier: 'T4' }));

/* ---------------------------------------------------------------- the world */

const world = {
  id: 'lanternfall',
  name: 'Lanternfall',
  place: 'Aurora ice',
  oneLine: 'Learn how light, energy levels, orbitals and periodic trends explain the electrons you met on Tallow.',
  sky: 'lanternfall-sky',
  terrain: { heightmap: 'lanternfall-ice', size: [240, 240], maxHeight: 4.0, material: 'packed-ice' },
  ambience: {
    keyLight: 0x9fe8c4,
    fillLight: 0x3b5a8f,
    fogColor: 0x1a2f45,
    fogNear: 40,
    fogFar: 520,
    dustDensity: 0.4
  },
  lake: { x: 0, z: 0, radius: LAKE },
  landmarks,
  sites,
  spawn: { pos: [0, 1.6, 84], lookAt: [0, 1.6, 30] },
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], 1.2, s.pos[2]] }])) },
  t1: {
    siteOrder: sites.map(s => s.id),
    siteDescriptions: Object.fromEntries(sites.map((s, i) => [s.id, `Bench ${i + 1} of nine, standing on the ring of ice round the frozen lake, ${i === 0 ? 'the first on the road from the landing pad' : 'a short walk from the one before it'}.`]))
  },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/lanternfall.json'), JSON.stringify(world, null, 2) + '\n');
console.log(`Lanternfall: ${landmarks.length} landmarks, ${sites.length} sites written.`);
