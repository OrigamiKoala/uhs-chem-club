#!/usr/bin/env node
/**
 * gen-bellows-layout.mjs — Lays out Bellows' ground and writes
 * `src/three/world-data/bellows.json`.
 *
 * Bellows is a cloud deck: one great circular steel platform riding a sea of
 * pressurised cloud, with the Compressor standing at its middle and the six
 * benches of "Gases" on a ring round it, a road of work lamps between them, the
 * gas works (holders, scoops, vents, pipe racks) standing off outside the ring and
 * the Avalon's pad on the near side. The layout is DETERMINISTIC (seeded), and the
 * generator holds itself to the rules `verify:bellows` holds the world to: every
 * footprint disjoint, every site clear of every prop, every approach on open deck
 * facing the way the player walks in, and everything inside the rail.
 *
 * Run: node tools/gen-bellows-layout.mjs
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
const rnd = mulberry32(0xbe110e5);
const round = n => Math.round(n * 100) / 100;

const DECK = 82;           // the deck's radius; the rail stands just inside it
const INSIDE = 77;         // nothing is placed past this: room for the rail and a walk behind it
const RING = 46;           // where the benches stand
const TOWER = 12;          // the Compressor's footprint

/* ---------------------------------------------------------------- the sites */

const QUESTS = [
  ['q1-knocks', 'Pressure and Temperature', 'knock-hut'],
  ['q2-laws', 'The Gas Laws', 'piston-bay'],
  ['q3-ideal', 'Ideal Gas Law', 'scale-hall'],
  ['q4-mixtures', 'Partial Pressures', 'blend-house'],
  ['q5-speed', 'Speed and Escape', 'pinhole-gallery'],
  ['q6-real', 'Real Gases', 'cold-room']
];

const sites = QUESTS.map(([questId, title, structure], i) => {
  const a = (56 + i * 44) * Math.PI / 180;     // round the ring from the east, leaving the south open for the spawn
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
const fits = (x, z, r, pad = 0.6) => Math.hypot(x, z) + r <= INSIDE && taken.every(t => Math.hypot(x - t.x, z - t.z) >= t.r + r + pad);
function add(asset, x, z, radius, extra = {}) {
  landmarks.push({ asset, pos: [round(x), 0, round(z)], radius, ...extra });
  taken.push({ x, z, r: radius });
}

// The Compressor stands at the middle of everything.
add('compressor-tower', 0, 0, TOWER, { minTier: 'T3' });

// Every site claims its shelter and the walk to its bench before anything else is placed.
for (const s of sites) {
  taken.push({ x: s.pos[0], z: s.pos[2], r: 6.4 });
  taken.push({ x: s.approachPos[0], z: s.approachPos[2], r: 3.2 });
}
// The spawn and the way in from it, and the room the Avalon needs round its pad.
const SPAWN = [0, 62];
taken.push({ x: SPAWN[0], z: SPAWN[1], r: 4 }, { x: 0, z: 48, r: 4 }, { x: 0, z: 36, r: 4 });
const PAD = [27, 50];
taken.push({ x: PAD[0], z: PAD[1], r: 26 });

// The landing pad itself: flush with the deck, on open plate.
landmarks.push({ asset: 'landing-pad', pos: [PAD[0], 0, PAD[1]], radius: 8.5, minTier: 'T3' });

// The comms mast, standing off the pad's far side.
add('comms-mast', -56, 40, 1.4, { minTier: 'T3' });

// The lamp road: a ring of work lamps between the Compressor and the benches.
const POSTS = 28;
for (let i = 0; i < POSTS; i++) {
  const a = (i / POSTS) * Math.PI * 2 + 0.05;
  const r = RING - 10;
  const x = r * Math.sin(a), z = r * Math.cos(a);
  if (fits(x, z, 0.6, 0.4)) add('lamp-post', x, z, 0.6, { minTier: 'T3' });
}

// The gas works: holders, scoops, vents, racks, crates and the things somebody left moored.
function scatter(asset, count, rMin, rMax, radius, extra = () => ({})) {
  let placed = 0;
  for (let k = 0; k < 6000 && placed < count; k++) {
    const a = rnd() * Math.PI * 2;
    const r = rMin + rnd() * (rMax - rMin);
    const x = r * Math.sin(a), z = r * Math.cos(a);
    if (!fits(x, z, radius)) continue;
    add(asset, x, z, radius, extra());
    placed++;
  }
}
scatter('gasholder', 6, 56, 70, 6.5, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('vent-stack', 4, 20, 30, 2.6, () => ({ minTier: 'T3' }));
scatter('pipe-rack', 4, 58, 70, 8, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('scoop-pylon', 8, 68, 75, 2.0, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('bladder-moor', 3, 54, 70, 3.8, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('crate-stack', 8, 24, 72, 2.6, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));

/* ---------------------------------------------------------------- the world */

const world = {
  id: 'bellows',
  name: 'Bellows',
  place: 'Cloud deck',
  oneLine: 'Learn how pressure, temperature, volume and amount tie together in a gas, and where the gas law stops being true.',
  sky: 'bellows-sky',
  terrain: { heightmap: 'bellows-deck', size: [200, 200], maxHeight: 0, material: 'tread-plate' },
  ambience: {
    keyLight: 0xfff0d6,
    fillLight: 0x6f93d0,
    fogColor: 0xc3d3e8,
    fogNear: 60,
    fogFar: 760,
    dustDensity: 0.3
  },
  deck: { radius: DECK, seaLevel: -46 },
  landmarks,
  sites,
  spawn: { pos: [SPAWN[0], 1.6, SPAWN[1]], lookAt: [0, 1.6, 30] },
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], 1.2, s.pos[2]] }])) },
  t1: {
    siteOrder: sites.map(s => s.id),
    siteDescriptions: Object.fromEntries(sites.map((s, i) => [s.id, `Bench ${i + 1} of six, standing on the ring of deck round the Compressor, ${i === 0 ? 'the first on the walk from the landing pad' : 'a short walk from the one before it'}.`]))
  },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/bellows.json'), JSON.stringify(world, null, 2) + '\n');
const counts = {};
for (const l of landmarks) counts[l.asset] = (counts[l.asset] || 0) + 1;
console.log(`Bellows: ${landmarks.length} landmarks (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}), ${sites.length} sites written.`);
