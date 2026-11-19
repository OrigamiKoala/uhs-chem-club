/**
 * lanternfall/glacier-plan.js — Lanternfall's glacier, lake and shore walk, as plain data and plain functions.
 *
 * NO THREE.JS HERE, ON PURPOSE. The layout generator (`tools/gen-lanternfall-layout.mjs`), the world
 * (`lanternfall.js`, `lanternfall/ground.js`, `lanternfall/stations.js`), the walk, the guide arrow and
 * `verify:lanternfall` all stand on this ONE declaration, so what is walked is what is drawn and what is checked.
 *
 * THE LANDFORM (x east, z south). A frozen lake (ice at 0 m) lies in the middle. From the north a glacier tongue
 * comes down to it and ends in an ice cliff 14 m high across the lake's north shore. Lateral moraines run down
 * both sides of the glacier, with an ablation valley between each moraine and the ice; a nunatak (a peak of rock)
 * stands through the glacier's west margin and an erratic boulder sits on the west moraine. The south shore is
 * the outwash plain, where the pad is.
 *
 * THE WALK is a loop of `lib/workings.js` volumes round the lake: the south yard, up the east ablation valley,
 * over the glacier on a graded crossing, down the west valley and back. Four spurs leave it: two cut down through
 * the shore bank to caves on the lake ice, one cut down into the glacier to a crevasse, one up the crawler's
 * tailgate. Every side of every volume that is not a doorway is a wall collider. Ten rooms hang off the loop,
 * each entered through a door volume.
 *
 * THE HEIGHT FIELD is ONE function: inside a volume its floor (plus the pad's bevel); within `EDGE` of an open
 * volume's side the same floor; everywhere else the land. The terrain MESH is drawn from `surface`, which is the
 * land (the hill or the ice) over the rooms that are buried in it, so the hill is whole above a room whose floor
 * the walk stands on. No walkable floor lies over another: a room's roof and the land above it are bodies.
 */

import { makeWorkings, floorOf } from '../lib/workings.js';

/** The walk stays inside this square about the origin. */
export const WALK = 100;

/** The frozen lake: an ellipse, its ice at 0 m. The bed under the ice mesh is lower, so the two never fight. */
export const LAKE = { x: 0, z: 6, rx: 34, rz: 22, ice: 0, bed: -0.6 };

/** The glacier tongue: its two margins in x, its snout's line in z, and its surface (m) at the snout. */
export const GLACIER = { west: -46, east: 32, snout: -18, top: 14, rise: 0.025 };

/** The nunatak through the glacier's west margin, and the outwash knoll the dome stands on. */
export const NUNATAK = { x: -84, z: -33, r: 24, peak: 46 };

/** The pad on the south yard. */
export const PAD = [22, 58];
export const PAD_TOP = 0.12;
export const PAD_R = 9.4;

/** Walk levels (m). */
export const YARD = 2;
export const CROSSING = 14;

/** The player lands on the south yard looking north over the lake to the snout. */
export const SPAWN = [10, YARD + 1.6, 40];
export const SPAWN_LOOK = [0, 9, -30];

/** The Lantern-Eater's ground: the yard's west end, the lake and the snout behind it (north). */
export const ARENA = {
  boss: [-22, 2.6, 40],
  player: [-22, 1.6, 54]
};

/** Thickness of a room's walls, and of the door volume that passes through its front wall. */
export const WALL_T = 0.8;
/** Within this of an open volume's side the ground holds the volume's floor, so a face hides the step. */
export const EDGE = 0.35;
/** How thick a cut face is, out from its volume's side. */
export const FACE_T = 0.55;
/** How far in front of the plate the player stands. */
export const APPROACH = 4.6;

/**
 * THE TEN ROOMS, in bench order.
 *   rect     interior floor rectangle (each at least 12 x 12 m)
 *   floor    floor height (m)
 *   door     { side, lo, hi } on the room's own rect; the door volume is WALL_T deep outside it
 *   facing   which way the plate faces (toward the player): 'north' (-z), 'south' (+z), 'east' (+x), 'west' (-x)
 *   back     how far the plate stands from the wall behind it
 *   along    the plate's offset along that wall from its middle (+ is +x or +z)
 *   top      floor to ceiling over the plate (>= 5.0: the lean-in camera reaches 4.6)
 *   buried   true when the room is dug into the land: the land is whole above it
 *   ground   for a room that stands on the land (not buried): the level the land is scraped to round it
 *   shell    which builder in `stations.js` makes its walls and roof
 *   sky      the fraction of the sky's fill kept inside under the cover mask
 */
export const ROOMS = [
  {
    id: 'room-1', site: 'site-1', questId: 'q1-wave', title: 'Light Waves',
    rect: { minX: 15, maxX: 29, minZ: 4, maxZ: 18 }, floor: 0, onto: 'spur-1',
    door: { side: 'maxZ', lo: 20, hi: 24 }, facing: 'east', back: 4.2, along: 0,
    top: 5.4, buried: false, ground: null, shell: 'ridgeCave', sky: 0.16
  },
  {
    id: 'room-2', site: 'site-2', questId: 'q2-photon', title: 'Photons',
    rect: { minX: 50.8, maxX: 64.8, minZ: 0, maxZ: 14 }, floor: 5, onto: 'east-2',
    door: { side: 'minX', lo: 5, hi: 9 }, facing: 'west', back: 3.8, along: 0,
    top: 5.2, buried: true, shell: 'cribVault', sky: 0.1
  },
  {
    id: 'room-3', site: 'site-3', questId: 'q3-lines', title: 'Line Spectra',
    rect: { minX: 25.2, maxX: 39.2, minZ: -36, maxZ: -22 }, floor: 9, onto: 'east-4',
    door: { side: 'maxX', lo: -31, hi: -27 }, facing: 'south', back: 3.8, along: -1.2,
    top: 5.4, buried: true, shell: 'meltCave', sky: 0.08
  },
  {
    id: 'room-4', site: 'site-4', questId: 'q4-cloud', title: 'Orbitals',
    rect: { minX: -7, maxX: 7, minZ: -94, maxZ: -81.8 }, floor: 15.4, onto: 'tail',
    door: { side: 'maxZ', lo: -2, hi: 2 }, facing: 'south', back: 4.2, along: 0,
    top: 5.2, buried: false, ground: CROSSING, shell: 'drillHall', sky: 0.12
  },
  {
    id: 'room-5', site: 'site-5', questId: 'q5-numbers', title: 'Quantum Numbers',
    rect: { minX: -24, maxX: -8, minZ: -34, maxZ: -22 }, floor: 8.4, onto: 'crevasse',
    door: { side: 'minZ', lo: -18, hi: -12 }, facing: 'west', back: 3.6, along: 0,
    top: 5.4, buried: true, shell: 'recordsTent', sky: 0.1
  },
  {
    id: 'room-6', site: 'site-6', questId: 'q6-filling', title: 'Electron Configuration',
    rect: { minX: -38.8, maxX: -24.8, minZ: -34, maxZ: -22 }, floor: 8.4, onto: 'room-5',
    door: { side: 'maxX', lo: -30, hi: -26 }, facing: 'south', back: 3.6, along: 0,
    top: 5.0, buried: true, shell: 'coreStore', sky: 0.06, sharedWall: 'maxX'
  },
  {
    id: 'room-7', site: 'site-7', questId: 'q7-pes', title: 'Photoelectron Spectroscopy',
    rect: { minX: -76.8, maxX: -62.8, minZ: -40, maxZ: -26 }, floor: 10, onto: 'west-2',
    door: { side: 'maxX', lo: -35, hi: -31 }, facing: 'north', back: 3.6, along: 0,
    top: 5.4, buried: true, shell: 'rockChamber', sky: 0.06
  },
  {
    id: 'room-8', site: 'site-8', questId: 'q8-trends', title: 'Periodic Trends',
    rect: { minX: -51.2, maxX: -37.2, minZ: -4, maxZ: 10 }, floor: 6, onto: 'west-4',
    door: { side: 'minX', lo: 1, hi: 5 }, facing: 'west', back: 3.6, along: 0,
    top: 5.0, buried: false, ground: 6, shell: 'erratic', sky: 0.14
  },
  {
    id: 'room-9', site: 'site-9', questId: 'q9-absorb', title: 'Spectroscopy',
    rect: { minX: -34, maxX: -20, minZ: 6.8, maxZ: 18.8 }, floor: 0, onto: 'spur-9',
    door: { side: 'maxZ', lo: -26, hi: -22 }, facing: 'east', back: 3.6, along: -1.8,
    top: 5.0, buried: false, ground: null, shell: 'holeCave', sky: 0.16
  },
  {
    id: 'room-10', site: 'site-10', questId: 'q10-wavefunctions', title: 'Wavefunctions',
    rect: { minX: -59.5, maxX: -46.5, minZ: 45.4, maxZ: 58.4 }, floor: 2, onto: 'sw-turn',
    door: { side: 'minZ', lo: -55.5, hi: -50.5 }, facing: 'north', back: 3.6, along: 0,
    top: 7.6, buried: false, ground: YARD, shell: 'dome', sky: 0.18, porch: 3.4
  }
];

/** The dome's sphere: its centre in plan and its radius (room-10's floor is inscribed in it). */
export const DOME = { x: -53, z: 51.9, r: 9.6 };

const FACE = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

/** A room's plate `[x, y, z]`, approach mark `[x, y, z]` and facing unit vector `[fx, fz]`. */
export function sitePlacement(room) {
  const r = room.rect;
  const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
  const [fx, fz] = FACE[room.facing];
  let px, pz;
  if (room.facing === 'north') { px = cx + room.along; pz = r.maxZ - room.back; }
  else if (room.facing === 'south') { px = cx + room.along; pz = r.minZ + room.back; }
  else if (room.facing === 'east') { px = r.minX + room.back; pz = cz + room.along; }
  else { px = r.maxX - room.back; pz = cz + room.along; }
  const round = n => Math.round(n * 100) / 100;
  return {
    pos: [round(px), room.floor, round(pz)],
    approachPos: [round(px + fx * APPROACH), round(room.floor + 1.6), round(pz + fz * APPROACH)],
    facing: [fx, fz]
  };
}

/** The rectangle a door volume occupies: WALL_T deep, outside the room's side. */
export function doorRect(room) {
  const r = room.rect, d = room.door, t = room.porch ?? WALL_T;
  if (d.side === 'minX') return { minX: r.minX - t, maxX: r.minX, minZ: d.lo, maxZ: d.hi };
  if (d.side === 'maxX') return { minX: r.maxX, maxX: r.maxX + t, minZ: d.lo, maxZ: d.hi };
  if (d.side === 'minZ') return { minX: d.lo, maxX: d.hi, minZ: r.minZ - t, maxZ: r.minZ };
  return { minX: d.lo, maxX: d.hi, minZ: r.maxZ, maxZ: r.maxZ + t };
}

/** A room's footprint with its walls: the rect grown by WALL_T on every side. */
export function footprint(room, pad = WALL_T) {
  const r = room.rect;
  return { minX: r.minX - pad, maxX: r.maxX + pad, minZ: r.minZ - pad, maxZ: r.maxZ + pad };
}

const OPP = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' };

/* ======================================================================
   THE WALK (lib/workings.js volumes)
   ====================================================================== */

function buildVolumes() {
  const ramp = (axis, from, to, y0, y1) => ({ axis, from, to, y0, y1 });
  const vols = [
    {
      id: 'yard', kind: 'yard', rect: { minX: -40, maxX: 50, minZ: 30, maxZ: 72 }, floor: { y0: YARD },
      openings: [
        { side: 'minZ', lo: 40, hi: 50, to: 'east-1' },
        { side: 'minZ', lo: 20, hi: 24, to: 'spur-1' },
        { side: 'minZ', lo: -26, hi: -22, to: 'spur-9' },
        { side: 'minX', lo: 30, hi: 42, to: 'sw-turn' }
      ]
    },
    {
      id: 'spur-1', kind: 'ramp', rect: { minX: 20, maxX: 24, minZ: 18.8, maxZ: 30 }, floor: ramp('z', 30, 18.8, YARD, 0),
      openings: [{ side: 'maxZ', lo: 20, hi: 24, to: 'yard' }, { side: 'minZ', lo: 20, hi: 24, to: 'door-1' }]
    },
    {
      id: 'east-1', kind: 'ramp', rect: { minX: 40, maxX: 50, minZ: 14, maxZ: 30 }, floor: ramp('z', 30, 14, YARD, 5),
      openings: [{ side: 'maxZ', lo: 40, hi: 50, to: 'yard' }, { side: 'minZ', lo: 40, hi: 50, to: 'east-2' }]
    },
    {
      id: 'east-2', kind: 'path', rect: { minX: 40, maxX: 50, minZ: 0, maxZ: 14 }, floor: { y0: 5 },
      openings: [
        { side: 'maxZ', lo: 40, hi: 50, to: 'east-1' }, { side: 'minZ', lo: 40, hi: 50, to: 'east-3' },
        { side: 'maxX', lo: 5, hi: 9, to: 'door-2' }
      ]
    },
    {
      id: 'east-3', kind: 'ramp', rect: { minX: 40, maxX: 50, minZ: -22, maxZ: 0 }, floor: ramp('z', 0, -22, 5, 9),
      openings: [{ side: 'maxZ', lo: 40, hi: 50, to: 'east-2' }, { side: 'minZ', lo: 40, hi: 50, to: 'east-4' }]
    },
    {
      id: 'east-4', kind: 'path', rect: { minX: 40, maxX: 50, minZ: -36, maxZ: -22 }, floor: { y0: 9 },
      openings: [
        { side: 'maxZ', lo: 40, hi: 50, to: 'east-3' }, { side: 'minZ', lo: 40, hi: 50, to: 'east-5' },
        { side: 'minX', lo: -31, hi: -27, to: 'door-3' }
      ]
    },
    {
      id: 'east-5', kind: 'ramp', rect: { minX: 40, maxX: 50, minZ: -62, maxZ: -36 }, floor: ramp('z', -36, -62, 9, CROSSING),
      openings: [{ side: 'maxZ', lo: 40, hi: 50, to: 'east-4' }, { side: 'minZ', lo: 40, hi: 50, to: 'crossing' }]
    },
    {
      id: 'crossing', kind: 'path', rect: { minX: -62, maxX: 50, minZ: -74, maxZ: -62 }, floor: { y0: CROSSING },
      openings: [
        { side: 'maxZ', lo: 40, hi: 50, to: 'east-5' },
        { side: 'maxZ', lo: -18, hi: -12, to: 'crevasse' },
        { side: 'maxZ', lo: -62, hi: -52, to: 'west-1' },
        { side: 'minZ', lo: -2, hi: 2, to: 'tail' }
      ]
    },
    {
      id: 'tail', kind: 'ramp', rect: { minX: -2, maxX: 2, minZ: -81, maxZ: -74 }, floor: ramp('z', -74, -81, CROSSING, 15.4),
      openings: [{ side: 'maxZ', lo: -2, hi: 2, to: 'crossing' }, { side: 'minZ', lo: -2, hi: 2, to: 'door-4' }]
    },
    {
      id: 'crevasse', kind: 'ramp', rect: { minX: -18, maxX: -12, minZ: -62, maxZ: -34.8 }, floor: ramp('z', -62, -34.8, CROSSING, 8.4),
      openings: [{ side: 'minZ', lo: -18, hi: -12, to: 'crossing' }, { side: 'maxZ', lo: -18, hi: -12, to: 'door-5' }]
    },
    {
      id: 'west-1', kind: 'ramp', rect: { minX: -62, maxX: -52, minZ: -62, maxZ: -40 }, floor: ramp('z', -62, -40, CROSSING, 10),
      openings: [{ side: 'minZ', lo: -62, hi: -52, to: 'crossing' }, { side: 'maxZ', lo: -62, hi: -52, to: 'west-2' }]
    },
    {
      id: 'west-2', kind: 'path', rect: { minX: -62, maxX: -52, minZ: -40, maxZ: -26 }, floor: { y0: 10 },
      openings: [
        { side: 'minZ', lo: -62, hi: -52, to: 'west-1' }, { side: 'maxZ', lo: -62, hi: -52, to: 'west-3' },
        { side: 'minX', lo: -35, hi: -31, to: 'door-7' }
      ]
    },
    {
      id: 'west-3', kind: 'ramp', rect: { minX: -62, maxX: -52, minZ: -26, maxZ: -4 }, floor: ramp('z', -26, -4, 10, 6),
      openings: [{ side: 'minZ', lo: -62, hi: -52, to: 'west-2' }, { side: 'maxZ', lo: -62, hi: -52, to: 'west-4' }]
    },
    {
      id: 'west-4', kind: 'path', rect: { minX: -62, maxX: -52, minZ: -4, maxZ: 10 }, floor: { y0: 6 },
      openings: [
        { side: 'minZ', lo: -62, hi: -52, to: 'west-3' }, { side: 'maxZ', lo: -62, hi: -52, to: 'west-5' },
        { side: 'maxX', lo: 1, hi: 5, to: 'door-8' }
      ]
    },
    {
      id: 'west-5', kind: 'ramp', rect: { minX: -62, maxX: -52, minZ: 10, maxZ: 30 }, floor: ramp('z', 10, 30, 6, YARD),
      openings: [{ side: 'minZ', lo: -62, hi: -52, to: 'west-4' }, { side: 'maxZ', lo: -62, hi: -52, to: 'sw-turn' }]
    },
    {
      id: 'sw-turn', kind: 'path', rect: { minX: -62, maxX: -40, minZ: 30, maxZ: 42 }, floor: { y0: YARD },
      openings: [
        { side: 'minZ', lo: -62, hi: -52, to: 'west-5' }, { side: 'maxX', lo: 30, hi: 42, to: 'yard' },
        { side: 'maxZ', lo: -55.5, hi: -50.5, to: 'door-10' }
      ]
    },
    {
      id: 'spur-9', kind: 'ramp', rect: { minX: -26, maxX: -22, minZ: 19.6, maxZ: 30 }, floor: ramp('z', 30, 19.6, YARD, 0),
      openings: [{ side: 'maxZ', lo: -26, hi: -22, to: 'yard' }, { side: 'minZ', lo: -26, hi: -22, to: 'door-9' }]
    }
  ];

  for (let i = 0; i < ROOMS.length; i++) {
    const rm = ROOMS[i];
    const doorId = `door-${i + 1}`;
    const d = rm.door;
    vols.push({
      id: doorId, kind: 'door', rect: doorRect(rm), floor: { y0: rm.floor },
      roof: Math.min(rm.top, 3.6), sky: rm.sky, room: rm.id,
      openings: [
        { side: OPP[d.side], lo: d.lo, hi: d.hi, to: rm.onto },
        { side: d.side, lo: d.lo, hi: d.hi, to: rm.id }
      ]
    });
    vols.push({
      id: rm.id, kind: 'room', rect: rm.rect, floor: { y0: rm.floor }, roof: rm.top, sky: rm.sky, room: rm,
      openings: [{ side: d.side, lo: d.lo, hi: d.hi, to: doorId }]
    });
  }
  // Room 6 is entered from room 5: room 5's west wall carries the door to it.
  const r5 = vols.find(v => v.id === 'room-5');
  r5.openings.push({ side: 'minX', lo: -30, hi: -26, to: 'door-6' });
  return vols;
}

/* ======================================================================
   NOISE
   ====================================================================== */

function hash2(ix, iz, seed) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
export function fbm2(x, z, seed, oct = 3) {
  let s = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += vnoise(x * f, z * f, seed + i * 31) * amp; n += amp; f *= 2.03; amp *= 0.5; }
  return s / n;
}
export function ridge2(x, z, seed, oct = 3) {
  return 1 - Math.abs(fbm2(x, z, seed, oct) * 2 - 1);
}
export const smooth = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const inRect = (r, x, z, pad = 0) => x >= r.minX - pad && x <= r.maxX + pad && z >= r.minZ - pad && z <= r.maxZ + pad;
/** Distance in plan from (x, z) to a rectangle (0 inside). */
const rectDist = (r, x, z) => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));

/** The lake's elliptic radius: < 1 on the lake. */
export const lakeE = (x, z) => Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz);

/** How much of (x, z) is glacier, 0 to 1, across its two margins and its snout. */
export function glacierMask(x, z) {
  const gx = smooth(GLACIER.west - 5, GLACIER.west + 3, x) * smooth(GLACIER.east + 5, GLACIER.east - 3, x);
  const gz = smooth(GLACIER.snout + 1.6, GLACIER.snout - 0.6, z);
  return gx * gz;
}

/** The glacier's surface (m), on the tongue and up to the ice field in the north. */
export function glacierSurface(x, z) {
  const down = Math.max(0, GLACIER.snout - z);
  let y = GLACIER.top + down * GLACIER.rise;
  // The icefall beyond the walk, then the ice field.
  y += smooth(-110, -330, z) * 120 + smooth(-150, -260, z) * (fbm2(x * 0.03, z * 0.03, 71, 3) - 0.5) * 24;
  // The surface is gently convex across the tongue (ice is thickest in the middle).
  const mid = (GLACIER.west + GLACIER.east) / 2, half = (GLACIER.east - GLACIER.west) / 2;
  y += 1.2 * (1 - ((x - mid) / half) ** 2);
  return y;
}

/**
 * Crevasses: transverse cracks across the lower tongue between the crossing and the snout, each a line
 * `z = zk - bend(x)`. Too narrow for the terrain's grid, so they are drawn (`ground.js` `buildCrevasses`), not carved
 * into the height field; `crevasseDepth` says how open the crack is at a point, for drawing only.
 */
export const crevasseBend = x => 4 * Math.sin(x * 0.05 + 1.3) + 2 * fbm2(x * 0.08, 0.5, 13, 2);
export function crevasseDepth(x, z) {
  if (z > GLACIER.snout - 3 || z < -60) return 0;
  const bend = 4 * Math.sin(x * 0.05 + 1.3) + 2 * fbm2(x * 0.08, z * 0.02, 13, 2);
  const s = Math.abs(Math.sin((z + bend) * 0.42));
  const open = 1 - smooth(0.0, 0.14, s);
  const fade = smooth(-60, -52, z) * smooth(GLACIER.snout - 3, GLACIER.snout - 7, z);
  return open * fade * (2.2 + 1.6 * fbm2(x * 0.1, z * 0.1, 17, 2));
}

/** Piecewise-linear through `[[z, y], ...]` (z descending), held flat past both ends and rising north past the last. */
function chain(pts, z, riseNorth = 0.12) {
  if (z >= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [z0, y0] = pts[i - 1], [z1, y1] = pts[i];
    if (z >= z1) return y0 + (y1 - y0) * (z0 - z) / (z0 - z1);
  }
  const [zl, yl] = pts[pts.length - 1];
  return yl + (zl - z) * riseNorth;
}
/** The east ablation valley's floor: the east path's grades, and on north of the crossing. */
export const valleyEast = z => chain([[30, YARD], [14, 5], [0, 5], [-22, 9], [-36, 9], [-62, CROSSING], [-74, CROSSING]], z);
/** The west ablation valley's floor: the west path's grades. */
export const valleyWest = z => chain([[30, YARD], [10, 6], [-4, 6], [-26, 10], [-40, 10], [-62, CROSSING], [-74, CROSSING]], z);

/* ======================================================================
   THE PLAN
   ====================================================================== */

export function makeGlacierPlan() {
  const volumes = buildVolumes();
  const work = makeWorkings(volumes, {
    roof: 5, holeMargin: 0.4, jamb: 0.5, wallInner: 0.22, wallDepth: 0.65,
    openKinds: ['yard', 'path', 'ramp'], outdoorDoors: true
  });
  const openVols = work.volumes.filter(v => ['yard', 'path', 'ramp'].includes(v.kind));
  const doorVols = work.volumes.filter(v => v.kind === 'door');
  const roomVols = work.volumes.filter(v => v.kind === 'room');
  const buried = ROOMS.filter(r => r.buried);
  const standing = ROOMS.filter(r => !r.buried);

  /** The land before the rooms shape it: lake, shore, plain, ablation valleys, moraines, glacier, nunatak, far country. */
  function naturalHeight(x, z) {
    const e = lakeE(x, z);
    // The shore bank and the outwash plain round the lake.
    let y = LAKE.bed + (YARD + 0.4 - LAKE.bed) * smooth(0.97, 1.22, e);
    y += (fbm2(x * 0.05, z * 0.05, 5, 3) - 0.5) * 1.6 * smooth(1.15, 1.6, e);

    // The two ablation valleys, between each lateral moraine and the ice, north of the lake: their floors climb
    // with the paths in them, banked a little above the path's own grade.
    const ve = valleyEast(z) + 0.8, vw = valleyWest(z) + 0.8;
    const me = smooth(31, 36, x) * smooth(-2, -14, z);
    const mw = smooth(-44, -49, x) * smooth(14, 2, z);
    // (A term whose mask is nought must not lift the lake's bed to 0 m: each lifts only where it applies.)
    const lift = (v, k) => { if (k > 1e-3 && v > y) y = v; };
    lift(ve * me, me);
    lift(vw * mw, mw);

    // The east lateral moraine: a sharp-crested bank along x ~ 60 above its valley, and the valley side behind it.
    const eastBase = valleyEast(Math.min(z, 30));
    const kEM = Math.exp(-(((x - 60) / 7.5) ** 2)) * smooth(36, 20, z);
    const kES = smooth(63, 70, x) * smooth(40, 10, z);
    lift((eastBase + 6 + (fbm2(z * 0.05, 3, 21, 2) - 0.5) * 3) * kEM, kEM);
    lift((eastBase + 4 + Math.min(70, (x - 64) * 0.9) + (fbm2(x * 0.03, z * 0.03, 25, 3) - 0.5) * 8) * kES, kES);

    // The west lateral moraine between the west path and the ice, and the west valley side.
    const westBase = valleyWest(Math.min(z, 30));
    const kWM = Math.exp(-(((x + 48.5) / 2.8) ** 2)) * smooth(12, 2, z);
    const kWS = smooth(-62.3, -64, x) * smooth(64, 36, z);
    lift((westBase + 3 + (fbm2(z * 0.05, 9, 23, 2) - 0.5) * 2) * kWM, kWM);
    lift((westBase + 1.5 + Math.min(80, (-62 - x) * 1.1) + (fbm2(x * 0.03, z * 0.03, 27, 3) - 0.5) * 8) * kWS, kWS);

    // The glacier over the land, its snout an ice cliff onto the lake.
    const gm = glacierMask(x, z);
    if (gm > 0) {
      const g = glacierSurface(x, z);
      y = y * (1 - gm) + Math.max(y, g) * gm;
    }

    // The nunatak.
    const rn = Math.hypot(x - NUNATAK.x, z - NUNATAK.z);
    if (rn < NUNATAK.r) {
      const a = Math.atan2(x - NUNATAK.x, z - NUNATAK.z);
      const k = 1 - rn / NUNATAK.r;
      const crag = 0.8 + 0.4 * ridge2(a * 2.4, rn * 0.08, 41, 3);
      y = Math.max(y, 8 + (NUNATAK.peak - 8) * Math.pow(k, 1.25) * crag);
    }

    // The far country: a ring of peaks and the ice field's rim.
    const R = Math.hypot(x, z + 40);
    const far = smooth(170, 420, R);
    if (far > 0) {
      const az = Math.atan2(x, z + 40);
      const H = 120 + 120 * fbm2(az * 2.6 + 4, 1.7, 43, 3);
      y += H * Math.pow(far, 1.4) + (ridge2(x * 0.012, z * 0.012, 47, 4) - 0.5) * 50 * far;
    }
    return y;
  }

  /** The land with the rooms in it: hills over the buried ones, a scraped level round the standing ones. */
  function landHeight(x, z) {
    let y = naturalHeight(x, z);
    for (const rm of buried) {
      const d = rectDist(footprint(rm), x, z);
      if (d < 4) {
        const need = rm.floor + rm.top + 1.1;
        if (y < need) y = need - (need - y) * smooth(1.2, 4, d);
      }
    }
    for (const rm of standing) {
      if (rm.ground === null || rm.ground === undefined) continue;
      const d = rectDist(rm.shell === 'dome' ? { minX: DOME.x - DOME.r, maxX: DOME.x + DOME.r, minZ: DOME.z - DOME.r, maxZ: DOME.z + DOME.r } : footprint(rm), x, z);
      const reach = rm.shell === 'drillHall' ? 3.5 : 4;
      if (d < reach) {
        const t = smooth(1.5, reach, d);
        y = rm.ground * (1 - t) + y * t;
      }
    }
    // The crawler's apron is scraped down to the crossing in front of the tailgate as well.
    {
      const r = { minX: -9, maxX: 9, minZ: -98, maxZ: -80 };
      const d = rectDist(r, x, z);
      if (d < 3.5) y = CROSSING * (1 - smooth(1, 3.5, d)) + y * smooth(1, 3.5, d);
    }
    return y;
  }

  /** THE height field: the walk, the landing solver and every check stand on this. */
  function height(x, z) {
    const v = work.volumeAt(x, z);
    if (v) {
      let y = floorOf(v, x, z);
      if (v.id === 'yard') {
        const dp = Math.hypot(x - PAD[0], z - PAD[1]);
        if (dp < PAD_R + 0.6) y += PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, dp));
      }
      return y;
    }
    for (const ov of openVols) {
      const r = ov.rect;
      if (x >= r.minX - EDGE && x <= r.maxX + EDGE && z >= r.minZ - EDGE && z <= r.maxZ + EDGE) {
        const cx = Math.max(r.minX, Math.min(r.maxX, x));
        const cz = Math.max(r.minZ, Math.min(r.maxZ, z));
        return floorOf(ov, cx, cz);
      }
    }
    return landHeight(x, z);
  }

  /** The square the dome and its platform stand on. */
  const domeSquare = { minX: DOME.x - DOME.r, maxX: DOME.x + DOME.r, minZ: DOME.z - DOME.r, maxZ: DOME.z + DOME.r };

  /** The rectangles cut out of the terrain mesh: rooms that stand on the land, every door, and the tailgate. */
  function holes() {
    const out = [];
    for (const rm of standing) out.push(rm.shell === 'dome' ? { ...domeSquare } : footprint(rm, WALL_T));
    for (const dv of doorVols) out.push({ minX: dv.rect.minX - 0.02, maxX: dv.rect.maxX + 0.02, minZ: dv.rect.minZ - 0.02, maxZ: dv.rect.maxZ + 0.02 });
    const t = work.byId.get('tail').rect;
    out.push({ minX: t.minX - 0.2, maxX: t.maxX + 0.2, minZ: t.minZ, maxZ: t.maxZ });
    return out;
  }

  /** A buried room's hill: its footprint, less the band its door's side shares with the walk. */
  const hillOver = rm => {
    const f = footprint(rm);
    const k = rm.door.side;
    if (rm.sharedWall !== k) f[k] += (k.startsWith('min') ? 1 : -1) * (WALL_T + 0.01);
    return f;
  };

  /** What the terrain MESH draws at (x, z): the land over a buried room, else the height field. */
  function surface(x, z) {
    for (const rm of buried) if (inRect(hillOver(rm), x, z)) return landHeight(x, z);
    return height(x, z);
  }

  /** The cover mask: the air of each room and its door, one box per room. */
  function coverSpec() {
    const boxes = ROOMS.map(rm => {
      const r = rm.shell === 'dome' ? domeSquare : rm.rect;
      const d = doorRect(rm);
      const top = rm.shell === 'dome' ? DOME.r : rm.top;
      return {
        id: rm.id,
        min: [Math.min(r.minX, d.minX) - 0.15, rm.floor - 0.3, Math.min(r.minZ, d.minZ) - 0.15],
        max: [Math.max(r.maxX, d.maxX) + 0.15, rm.floor + top + 0.4, Math.max(r.maxZ, d.maxZ) + 0.15],
        sky: rm.sky
      };
    });
    return { boxes, openings: [] };
  }

  /** Every footprint a cut face must leave alone: rooms with their walls, and their doors. */
  const keepOut = [...ROOMS.map(rm => rm.shell === 'dome' ? domeSquare : footprint(rm, WALL_T + 0.05)), ...doorVols.map(d => d.rect)];

  /**
   * THE CUT FACES. Along every wall of every open volume, where the land beyond stands above the floor, a face
   * of ice or moraine from the floor to the land, in pieces no longer than 4 m. `{ side, a: [x, z], b: [x, z],
   * y0, y1, top: [ya, yb], ice }`: the face's two ends on the volume's side, and the land's height at each.
   */
  function cutFaces() {
    const out = [];
    for (const w of work.walls) {
      const v = work.byId.get(w.volume);
      if (!openVols.includes(v)) continue;
      const len = Math.hypot(w.bx - w.ax, w.bz - w.az);
      const n = Math.max(1, Math.ceil(len / 4));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const a = [w.ax + (w.bx - w.ax) * t0, w.az + (w.bz - w.az) * t0];
        const b = [w.ax + (w.bx - w.ax) * t1, w.az + (w.bz - w.az) * t1];
        const out1 = p => [p[0] - w.dirX * (FACE_T + 0.08), p[1] - w.dirZ * (FACE_T + 0.08)];
        const la = landHeight(...out1(a)), lb = landHeight(...out1(b));
        const fa = floorOf(v, a[0], a[1]), fb = floorOf(v, b[0], b[1]);
        if (Math.max(la - fa, lb - fb) < 0.35) continue;
        // The face's box in plan, outside the side.
        const box = {
          minX: Math.min(a[0], b[0], a[0] - w.dirX * FACE_T, b[0] - w.dirX * FACE_T),
          maxX: Math.max(a[0], b[0], a[0] - w.dirX * FACE_T, b[0] - w.dirX * FACE_T),
          minZ: Math.min(a[1], b[1], a[1] - w.dirZ * FACE_T, b[1] - w.dirZ * FACE_T),
          maxZ: Math.max(a[1], b[1], a[1] - w.dirZ * FACE_T, b[1] - w.dirZ * FACE_T)
        };
        if (keepOut.some(k => box.maxX > k.minX && box.minX < k.maxX && box.maxZ > k.minZ && box.minZ < k.maxZ)) continue;
        const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
        out.push({
          volume: v.id, side: w.side, dirX: w.dirX, dirZ: w.dirZ, a, b,
          floor: [fa, fb], top: [Math.max(la, fa + 0.35), Math.max(lb, fb + 0.35)],
          ice: glacierMask(mx - w.dirX * 3, mz - w.dirZ * 3) > 0.5
        });
      }
    }
    return out;
  }

  /** The lake-facing edges of the walk: the sides where the land beyond falls away (the shore's ridge goes there). */
  function shoreEdges() {
    const out = [];
    for (const w of work.walls) {
      const v = work.byId.get(w.volume);
      if (!openVols.includes(v)) continue;
      const len = Math.hypot(w.bx - w.ax, w.bz - w.az);
      const n = Math.max(1, Math.round(len / 2));
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const p = [w.ax + (w.bx - w.ax) * t, w.az + (w.bz - w.az) * t];
        const q = [p[0] - w.dirX * 2.5, p[1] - w.dirZ * 2.5];
        const drop = floorOf(v, p[0], p[1]) - landHeight(q[0], q[1]);
        if (drop > 0.6) out.push({ volume: v.id, side: w.side, at: p, out: [-w.dirX, -w.dirZ], floor: floorOf(v, p[0], p[1]), drop });
      }
    }
    return out;
  }

  /** Is (x, z) inside any room's footprint (its walls) or door: what no prop may stand in. */
  const inBuilt = (x, z, pad = 0) => keepOut.some(k => inRect(k, x, z, pad));

  return {
    ...work, openVols, doorVols, roomVols, rooms: ROOMS,
    height, landHeight, naturalHeight, surface, holes, coverSpec, cutFaces, shoreEdges, inBuilt,
    hillOver, domeSquare, PAD_TOP, PAD_R
  };
}
