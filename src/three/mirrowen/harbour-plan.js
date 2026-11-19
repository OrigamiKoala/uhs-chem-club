/**
 * mirrowen/harbour-plan.js — Mirrowen's harbour, as plain data and plain functions.
 *
 * NO THREE.JS HERE, ON PURPOSE. The layout generator (`tools/gen-mirrowen-layout.mjs`), the world
 * (`mirrowen.js`, `mirrowen/terrain.js`, `mirrowen/stations.js`), the walk, the guide arrow and
 * `verify:mirrowen` all stand on this ONE declaration, so what is walked is what is drawn and checked.
 *
 * THE PLACE. A working harbour. Quays stand 2.6 m above the water round a basin; a mole runs north
 * from the main quay to a head on the frozen sea; a dry dock is sunk 7 m below the quay behind its
 * gate; an ice-breaker and a tanker lie moored, and a freighter is frozen into the canal behind the
 * lock gate. The town stands on a terrace 5 m above the main quay. North of the harbour the sea is ice.
 * Plan axes as every world: x east, z south (north is -z).
 *
 * THE WALK is a set of `lib/workings.js` volumes, closed on every side that is not a doorway. Kinds:
 *   GROUND kinds (`yard`, `quay`, `ramp`, `dock`): the terrain mesh is their floor.
 *   DECK kinds (`deck`, `gangway`, `pier`, `gate`): a built floor over water or inside a hull; the
 *     terrain mesh is cut away under them and `terrain.js` draws the deck.
 *   ROOFED kinds (`room`, `passage`): under a roof, covered by the shared light mask.
 * A gap in an edge that is not a way through (`pass: false`) is a `kerb` (a quay edge over the water),
 * a `rail` (a railing over a drop), a `bulwark` (a ship's side), a `window` or a `bay` (an open end).
 *
 * THE HEIGHT FIELD is ONE function: inside a volume its floor; within `EDGE` of a ground volume's side
 * the same floor (the step hides inside the wall drawn on the plane); everywhere else the land: the town
 * bank, the warehouse ground, the ice of the canal and the sea, the dry dock pit and the sea bed.
 */

import { makeWorkings, floorOf } from '../lib/workings.js';

/** The walk stays inside this square about the origin. */
export const WALK = 96;

/** Heights (m). */
export const TERRACE = 5.0;
export const QUAY = 0.0;
export const WATER = -2.6;
export const ICE = -2.3;
export const DOCK = -7.0;
export const SEABED = -10.0;

/** The landing pad on the town terrace. */
export const PAD = [66, 76];
export const PAD_TOP = 0.12;
export const PAD_R = 9.4;

/** The player lands on the terrace, at the head of the harbour stair, looking north-west over the harbour. */
export const SPAWN = [24, TERRACE + 1.6, 50];
export const SPAWN_LOOK = [6, TERRACE + 0.8, 20];

/** The Undertow's ground: the open mole head, the frozen sea behind it to the north. */
export const ARENA = {
  boss: [62, 0, -84],
  player: [62, 1.6, -70],
  lookAt: [62, 1.6, -84]
};

/** How far a ground volume's floor is held past its closed sides, and the half-thickness of every wall. */
export const EDGE = 0.2;
export const WALL_HALF = 0.3;

/** Where the plate stands from a room's back wall, and the approach mark in front of the plate. */
export const PLATE_FROM_BACK = 3.6;
export const APPROACH = 4.6;

/** The dry dock: its pit (the stair and the floor), the tug on its keel blocks, the gate across its mouth. */
export const DOCK_PIT = { minX: 2, maxX: 30, minZ: -96, maxZ: -66 };
export const TUG = { minX: 15.5, maxX: 22.5, minZ: -91, maxZ: -71, keel: DOCK + 1.2, deck: DOCK + 6.4 };

/** The frozen canal behind the lock gate (it runs on west past the edge of the walk). */
export const CANAL = { minX: -900, maxX: -46, minZ: -62, maxZ: -36 };

/** The pump house over the pump well, on the dock's east side. Solid from the quay up. */
export const PUMP_HOUSE = { minX: 30, maxX: 44, minZ: -96, maxZ: -78, top: 8.5 };

/**
 * THE HULLS. `rect` is the parallel body in plan; the bow runs `bowLen` past it in direction `bow`.
 * `deck` is the main deck's height, `keel` the bottom of the hull. Rooms and decks inside the rect are
 * volumes below; the rest of the hull is closed (forecastle, casings, hatch coamings).
 */
export const HULLS = [
  { id: 'icebreaker', rect: { minX: -28, maxX: 36, minZ: -2, maxZ: 18 }, bow: 'west', bowLen: 12, deck: 1.2, keel: -8.4, paint: 'shipRed' },
  { id: 'tanker', rect: { minX: 56, maxX: 74, minZ: -54, maxZ: 14 }, bow: 'north', bowLen: 6, deck: 1.0, keel: -9.0, paint: 'shipBlack' },
  { id: 'freighter', rect: { minX: -96, maxX: -56, minZ: -58, maxZ: -40 }, bow: 'west', bowLen: 10, deck: 0.4, keel: -7.6, paint: 'shipRust' }
];

/**
 * THE SEVEN ROOMS, one per bench, in bench order.
 *   rect     interior floor rectangle (all 14 x 14 m)
 *   floor    floor height (m)
 *   top      clear height to the underside of the roof
 *   facing   the way the plate faces, toward the player and the door: 'north' (-z), 'south', 'east', 'west'
 *   door     { side, lo, hi } the way in, and `to` the volume it opens onto
 *   shell    the room's architecture, built by `terrain.js`
 *   hull     the hull it stands in, when it is aboard a ship
 *   sky      fraction of sky fill the cover mask keeps inside
 */
export const ROOMS = [
  {
    id: 'room-1', site: 'site-1', questId: 'q1-states', title: 'Three States',
    structure: 'deckhouse', kind: 'window', skin: 'desk', plate: 'MW-01',
    rect: { minX: 6, maxX: 20, minZ: 0, maxZ: 14 }, floor: 1.2, top: 5.2,
    facing: 'south', door: { side: 'maxZ', lo: 11, hi: 15, to: 'ib-deck' },
    windows: { side: 'minZ', lo: 7, hi: 19 },
    shell: 'deckhouse', hull: 'icebreaker', sky: 0.34
  },
  {
    id: 'room-2', site: 'site-2', questId: 'q2-grip', title: 'The Grip Between',
    structure: 'pump-room', kind: 'probe', skin: 'deck', plate: 'MW-02',
    rect: { minX: 58, maxX: 72, minZ: -48, maxZ: -34 }, floor: -4.4, top: 5.2,
    facing: 'south', door: { side: 'maxZ', lo: 62, hi: 68, to: 'tk-ramp' },
    shell: 'pumpRoom', hull: 'tanker', sky: 0.16
  },
  {
    id: 'room-3', site: 'site-3', questId: 'q3-boil', title: 'Liquids and Vapour',
    structure: 'pump-well', kind: 'flask', skin: 'desk', plate: 'MW-03',
    rect: { minX: 30, maxX: 44, minZ: -92, maxZ: -78 }, floor: DOCK, top: 5.4,
    facing: 'west', door: { side: 'minX', lo: -88, hi: -82, to: 'dock' },
    shell: 'pumpWell', sky: 0.22
  },
  {
    id: 'room-4', site: 'site-4', questId: 'q4-solids', title: 'Kinds of Solid',
    structure: 'hold', kind: 'tester', skin: 'deck', plate: 'MW-04',
    rect: { minX: -94, maxX: -80, minZ: -57, maxZ: -43 }, floor: -3.6, top: 5.4,
    facing: 'east', door: { side: 'maxX', lo: -56, hi: -50, to: 'fr-ramp' },
    shell: 'hold', hull: 'freighter', sky: 0.26
  },
  {
    id: 'room-5', site: 'site-5', questId: 'q5-crossing', title: 'The Crossing',
    structure: 'thaw-shed', kind: 'curve', skin: 'shelf', plate: 'MW-05',
    rect: { minX: -34, maxX: -20, minZ: -40, maxZ: -26 }, floor: -0.8, top: 5.4,
    facing: 'south', door: { side: 'minX', lo: -36, hi: -30, to: 'pier-5' },
    bay: { side: 'maxX', lo: -38.6, hi: -27.4 },
    shell: 'thawShed', sky: 0.42
  },
  {
    id: 'room-6', site: 'site-6', questId: 'q6-solution', title: 'Taken Into Solution',
    structure: 'salt-store', kind: 'volumetric', skin: 'shelf', plate: 'MW-06',
    rect: { minX: -34, maxX: -20, minZ: -20, maxZ: -6 }, floor: 0.6, top: 5.2,
    facing: 'west', door: { side: 'minX', lo: -16, hi: -10, to: 'pier-6' },
    shell: 'saltStore', sky: 0.24
  },
  {
    id: 'room-7', site: 'site-7', questId: 'q7-separate', title: 'Pulling Apart',
    structure: 'evaporator-flat', kind: 'strip', skin: 'desk', plate: 'MW-07',
    rect: { minX: -26, maxX: -12, minZ: 0, maxZ: 14 }, floor: -2.4, top: 5.2,
    facing: 'east', door: { side: 'maxX', lo: 8, hi: 14, to: 'ib-comp' },
    shell: 'evaporator', hull: 'icebreaker', sky: 0.18
  }
];

const FACE = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

/** A room's plate `[x, y, z]`, its approach mark `[x, y, z]` and the unit vector the plate faces. */
export function sitePlacement(room) {
  const r = room.rect;
  const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
  const [fx, fz] = FACE[room.facing];
  const px = fx > 0 ? r.minX + PLATE_FROM_BACK : fx < 0 ? r.maxX - PLATE_FROM_BACK : cx;
  const pz = fz > 0 ? r.minZ + PLATE_FROM_BACK : fz < 0 ? r.maxZ - PLATE_FROM_BACK : cz;
  const round = n => Math.round(n * 100) / 100;
  return {
    pos: [round(px), room.floor, round(pz)],
    approachPos: [round(px + fx * APPROACH), round(room.floor + 1.6), round(pz + fz * APPROACH)],
    facing: [fx, fz]
  };
}

/* ======================================================================
   THE WALK
   ====================================================================== */

export const GROUND_KINDS = ['yard', 'quay', 'ramp', 'dock'];
export const DECK_KINDS = ['deck', 'gangway', 'pier', 'gate'];
export const ROOFED_KINDS = ['room', 'passage'];

/** An opening helper: `o('minZ', lo, hi, to)` a way through, `bar('minZ', lo, hi, kind)` a gap that is not. */
const o = (side, lo, hi, to) => ({ side, lo, hi, to });
const bar = (side, lo, hi, kind) => ({ side, lo, hi, to: null, pass: false, kind });

function buildVolumes() {
  const vols = [
    /* THE TOWN AND THE MAIN QUAY */
    {
      id: 'terrace', kind: 'yard', rect: { minX: 8, maxX: 92, minZ: 44, maxZ: 94 }, floor: { y0: TERRACE },
      openings: [o('minX', 44, 52, 'hill'), bar('minZ', 8, 92, 'rail')]
    },
    {
      // The harbour stair: a ramp down the face of the quay wall, railed on the harbour side.
      id: 'hill', kind: 'ramp', rect: { minX: -22, maxX: 8, minZ: 44, maxZ: 52 },
      floor: { axis: 'x', from: 8, to: -18, y0: TERRACE, y1: QUAY },
      openings: [o('maxX', 44, 52, 'terrace'), o('minZ', -22, -18, 'quay-main'), bar('minZ', -18, 8, 'rail')]
    },
    {
      id: 'quay-main', kind: 'quay', rect: { minX: -64, maxX: 52, minZ: 22, maxZ: 44 }, floor: { y0: QUAY },
      openings: [
        o('maxZ', -22, -18, 'hill'),
        o('minZ', -64, -40, 'shore'),
        bar('minZ', -40, 16, 'kerb'),
        o('minZ', 16, 20, 'ib-gang'),
        bar('minZ', 20, 40, 'kerb'),
        o('minZ', 40, 52, 'mole'),
        bar('maxX', 22, 44, 'kerb')
      ]
    },

    /* THE ICE-BREAKER (Benches 1 and 7) */
    {
      id: 'ib-gang', kind: 'gangway', rect: { minX: 16, maxX: 20, minZ: 18, maxZ: 22 },
      floor: { axis: 'z', from: 22, to: 18, y0: QUAY, y1: 1.2 },
      openings: [o('maxZ', 16, 20, 'quay-main'), o('minZ', 16, 20, 'ib-deck'), bar('minX', 18, 22, 'rail'), bar('maxX', 18, 22, 'rail')]
    },
    {
      id: 'ib-deck', kind: 'deck', rect: { minX: -14, maxX: 32, minZ: 14, maxZ: 18 }, floor: { y0: 1.2 },
      openings: [
        bar('maxZ', -14, 16, 'bulwark'), o('maxZ', 16, 20, 'ib-gang'), bar('maxZ', 20, 32, 'bulwark'),
        o('minZ', 2, 6, 'ib-well'), o('minZ', 11, 15, 'room-1')
      ]
    },
    {
      id: 'ib-well', kind: 'deck', rect: { minX: 2, maxX: 6, minZ: 8, maxZ: 14 }, floor: { y0: 1.2 },
      openings: [o('maxZ', 2, 6, 'ib-deck'), o('minX', 8, 14, 'ib-comp')]
    },
    {
      id: 'ib-comp', kind: 'passage', rect: { minX: -12, maxX: 2, minZ: 8, maxZ: 14 },
      floor: { axis: 'x', from: 2, to: -10, y0: 1.2, y1: -2.4 }, roof: 3.4, sky: 0.2,
      openings: [o('maxX', 8, 14, 'ib-well'), o('minX', 8, 14, 'room-7')]
    },

    /* THE MOLE, THE TANKER (Bench 2) AND THE MOLE HEAD (the Undertow) */
    {
      id: 'mole', kind: 'quay', rect: { minX: 40, maxX: 52, minZ: -62, maxZ: 22 }, floor: { y0: QUAY },
      openings: [
        o('maxZ', 40, 52, 'quay-main'),
        bar('minX', -62, 22, 'kerb'),
        bar('maxX', -62, -12, 'kerb'), o('maxX', -12, -8, 'tk-gang'), bar('maxX', -8, 22, 'kerb'),
        o('minZ', 40, 44, 'pump-yard'), o('minZ', 44, 52, 'mole-head')
      ]
    },
    {
      id: 'tk-gang', kind: 'gangway', rect: { minX: 52, maxX: 56, minZ: -12, maxZ: -8 },
      floor: { axis: 'x', from: 52, to: 56, y0: QUAY, y1: 1.0 },
      openings: [o('minX', -12, -8, 'mole'), o('maxX', -12, -8, 'tk-deck'), bar('minZ', 52, 56, 'rail'), bar('maxZ', 52, 56, 'rail')]
    },
    {
      id: 'tk-deck', kind: 'deck', rect: { minX: 56, maxX: 74, minZ: -14, maxZ: -2 }, floor: { y0: 1.0 },
      openings: [
        bar('minX', -14, -12, 'bulwark'), o('minX', -12, -8, 'tk-gang'), bar('minX', -8, -2, 'bulwark'),
        bar('maxX', -14, -2, 'bulwark'),
        o('minZ', 62, 68, 'tk-ramp')
      ]
    },
    {
      id: 'tk-ramp', kind: 'passage', rect: { minX: 62, maxX: 68, minZ: -34, maxZ: -14 },
      floor: { axis: 'z', from: -14, to: -34, y0: 1.0, y1: -4.4 }, roof: 3.4, sky: 0.16,
      openings: [o('maxZ', 62, 68, 'tk-deck'), o('minZ', 62, 68, 'room-2')]
    },
    {
      id: 'mole-head', kind: 'quay', rect: { minX: 44, maxX: 82, minZ: -96, maxZ: -62 }, floor: { y0: QUAY },
      openings: [
        o('maxZ', 44, 52, 'mole'), bar('maxZ', 52, 82, 'kerb'),
        bar('maxX', -96, -62, 'kerb'), bar('minZ', 44, 82, 'kerb'),
        o('minX', -78, -62, 'pump-yard')
      ]
    },

    /* THE DRY DOCK (Bench 3) */
    {
      id: 'pump-yard', kind: 'quay', rect: { minX: 30, maxX: 44, minZ: -78, maxZ: -62 }, floor: { y0: QUAY },
      openings: [
        o('maxZ', 40, 44, 'mole'), bar('maxZ', 30, 40, 'kerb'),
        o('maxX', -78, -62, 'mole-head'),
        o('minX', -66, -62, 'gate'), bar('minX', -78, -66, 'rail')
      ]
    },
    {
      id: 'gate', kind: 'gate', rect: { minX: 2, maxX: 30, minZ: -66, maxZ: -62 }, floor: { y0: QUAY },
      openings: [
        o('maxX', -66, -62, 'pump-yard'), o('minX', -66, -62, 'quay-north'),
        bar('maxZ', 2, 30, 'rail'),
        o('minZ', 2, 8, 'dock-stair'), bar('minZ', 8, 30, 'rail')
      ]
    },
    {
      id: 'dock-stair', kind: 'ramp', rect: { minX: 2, maxX: 8, minZ: -96, maxZ: -66 },
      floor: { axis: 'z', from: -66, to: -90, y0: QUAY, y1: DOCK },
      openings: [o('maxZ', 2, 8, 'gate'), o('maxX', -96, -90, 'dock'), bar('maxX', -90, -66, 'rail')]
    },
    {
      id: 'dock', kind: 'dock', rect: { minX: 8, maxX: 30, minZ: -96, maxZ: -66 }, floor: { y0: DOCK },
      openings: [o('minX', -96, -90, 'dock-stair'), o('maxX', -88, -82, 'room-3')]
    },

    /* THE NORTH QUAY AND THE FREIGHTER (Bench 4) */
    {
      id: 'quay-north', kind: 'quay', rect: { minX: -72, maxX: 2, minZ: -96, maxZ: -62 }, floor: { y0: QUAY },
      openings: [
        o('maxX', -66, -62, 'gate'),
        bar('minZ', -72, 2, 'kerb'),
        bar('maxZ', -72, -62, 'kerb'), o('maxZ', -62, -58, 'fr-gang'), bar('maxZ', -58, -46, 'kerb'),
        o('maxZ', -46, -42, 'lock-gate'), bar('maxZ', -42, 2, 'kerb')
      ]
    },
    {
      id: 'fr-gang', kind: 'gangway', rect: { minX: -62, maxX: -58, minZ: -62, maxZ: -58 },
      floor: { axis: 'z', from: -62, to: -58, y0: QUAY, y1: 0.4 },
      openings: [o('minZ', -62, -58, 'quay-north'), o('maxZ', -62, -58, 'fr-deck'), bar('minX', -62, -58, 'rail'), bar('maxX', -62, -58, 'rail')]
    },
    {
      id: 'fr-deck', kind: 'deck', rect: { minX: -68, maxX: -56, minZ: -58, maxZ: -46 }, floor: { y0: 0.4 },
      openings: [
        bar('minZ', -68, -62, 'bulwark'), o('minZ', -62, -58, 'fr-gang'), bar('minZ', -58, -56, 'bulwark'),
        bar('maxX', -58, -46, 'bulwark'),
        o('minX', -56, -50, 'fr-ramp')
      ]
    },
    {
      id: 'fr-ramp', kind: 'passage', rect: { minX: -80, maxX: -68, minZ: -56, maxZ: -50 },
      floor: { axis: 'x', from: -68, to: -80, y0: 0.4, y1: -3.6 }, roof: 3.4, sky: 0.2,
      openings: [o('maxX', -56, -50, 'fr-deck'), o('minX', -56, -50, 'room-4')]
    },

    /* THE LOCK GATE, THE WEST SHORE AND THE BOATHOUSES (Benches 5 and 6) */
    {
      id: 'lock-gate', kind: 'gate', rect: { minX: -46, maxX: -42, minZ: -62, maxZ: -36 }, floor: { y0: QUAY },
      openings: [o('minZ', -46, -42, 'quay-north'), o('maxZ', -46, -42, 'shore'), bar('minX', -62, -36, 'rail'), bar('maxX', -62, -36, 'rail')]
    },
    {
      id: 'shore', kind: 'quay', rect: { minX: -72, maxX: -40, minZ: -36, maxZ: 22 }, floor: { y0: QUAY },
      openings: [
        o('maxZ', -64, -40, 'quay-main'),
        bar('minZ', -72, -46, 'kerb'), o('minZ', -46, -42, 'lock-gate'), bar('minZ', -42, -40, 'kerb'),
        o('maxX', -36, -30, 'pier-5'), bar('maxX', -30, -16, 'kerb'), o('maxX', -16, -10, 'pier-6'), bar('maxX', -10, 22, 'kerb')
      ]
    },
    {
      id: 'pier-5', kind: 'pier', rect: { minX: -40, maxX: -34, minZ: -36, maxZ: -30 },
      floor: { axis: 'x', from: -40, to: -34, y0: QUAY, y1: -0.8 },
      openings: [o('minX', -36, -30, 'shore'), o('maxX', -36, -30, 'room-5'), bar('minZ', -40, -34, 'rail'), bar('maxZ', -40, -34, 'rail')]
    },
    {
      id: 'pier-6', kind: 'pier', rect: { minX: -40, maxX: -34, minZ: -16, maxZ: -10 },
      floor: { axis: 'x', from: -40, to: -34, y0: QUAY, y1: 0.6 },
      openings: [o('minX', -16, -10, 'shore'), o('maxX', -16, -10, 'room-6'), bar('minZ', -40, -34, 'rail'), bar('maxZ', -40, -34, 'rail')]
    }
  ];

  for (const rm of ROOMS) {
    const openings = [o(rm.door.side, rm.door.lo, rm.door.hi, rm.door.to)];
    if (rm.windows) openings.push(bar(rm.windows.side, rm.windows.lo, rm.windows.hi, 'window'));
    if (rm.bay) openings.push(bar(rm.bay.side, rm.bay.lo, rm.bay.hi, 'bay'));
    vols.push({ id: rm.id, kind: 'room', rect: rm.rect, floor: { y0: rm.floor }, roof: rm.top, sky: rm.sky, room: rm, openings });
  }
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
export const smooth = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const inRect = (r, x, z) => x >= r.minX && x < r.maxX && z >= r.minZ && z < r.maxZ;

/** A hull's outline in plan as a polygon `[[x, z], ...]`: the parallel body and its bow. */
export function hullOutline(h) {
  const r = h.rect;
  if (h.bow === 'west') {
    const cz = (r.minZ + r.maxZ) / 2, half = (r.maxZ - r.minZ) / 2, L = h.bowLen;
    return [[r.maxX, r.minZ], [r.maxX, r.maxZ], [r.minX, r.maxZ], [r.minX - L * 0.55, cz + half * 0.62], [r.minX - L, cz], [r.minX - L * 0.55, cz - half * 0.62], [r.minX, r.minZ]];
  }
  const cx = (r.minX + r.maxX) / 2, half = (r.maxX - r.minX) / 2, L = h.bowLen;
  return [[r.minX, r.maxZ], [r.maxX, r.maxZ], [r.maxX, r.minZ], [cx + half * 0.62, r.minZ - L * 0.55], [cx, r.minZ - L], [cx - half * 0.62, r.minZ - L * 0.55], [r.minX, r.minZ]];
}

function inPoly(poly, x, z) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/* ======================================================================
   THE PLAN
   ====================================================================== */

/** Build the whole pure plan: the workings, the height field, the water, the cover spec and the rails. */
export function makeHarbourPlan() {
  const work = makeWorkings(buildVolumes(), {
    roof: 5.2, holeMargin: 0, jamb: 0.4, wallInner: 0.3, wallDepth: 0.5,
    openKinds: [...GROUND_KINDS, ...DECK_KINDS], outdoorDoors: true
  });
  const groundVols = work.volumes.filter(v => GROUND_KINDS.includes(v.kind));
  const deckVols = work.volumes.filter(v => DECK_KINDS.includes(v.kind));
  const roofedVols = work.volumes.filter(v => ROOFED_KINDS.includes(v.kind));
  const outlines = HULLS.map(h => ({ hull: h, poly: hullOutline(h) }));

  /** The hull whose outline holds (x, z), or null. */
  const hullAt = (x, z) => outlines.find(e => inPoly(e.poly, x, z))?.hull || null;

  /** Sea ice: the frozen sea north of the harbour and east past the outer harbour. */
  const seaIce = (x, z) => z < -96.25 || (x > 92.25 && z < 44);

  /** The land as it lies outside the walk. */
  function landHeight(x, z) {
    // The town bank and the hill behind it.
    if (z >= 44) {
      let y = TERRACE;
      const rise = smooth(110, 420, z) * 0.85 + smooth(120, 460, Math.abs(x)) * 0.35;
      if (rise > 0) y += rise * (70 + 50 * fbm2(x * 0.006, z * 0.006, 13, 3)) + (fbm2(x * 0.03, z * 0.03, 17, 2) - 0.5) * 6 * rise;
      return y;
    }
    // The dry dock pit (its floor; the stair and the floor are volumes) and the pump house's ground.
    if (inRect(DOCK_PIT, x, z)) return DOCK;
    if (inRect(PUMP_HOUSE, x, z)) return QUAY;
    // The frozen canal, running west between its banks.
    if (inRect(CANAL, x, z)) {
      let y = ICE;
      if (x < -110) y += smooth(-110, -160, x) * (fbm2(x * 0.05, z * 0.2, 41, 2) - 0.35) * 2.2;
      return y;
    }
    // The warehouse ground west of the shore, and the fells beyond.
    if (x <= -72 || (x <= -40 && z >= 22)) {
      let y = QUAY;
      const rise = smooth(-120, -480, x);
      if (rise > 0) y += rise * (55 + 45 * fbm2(x * 0.006, z * 0.006, 23, 3)) + (fbm2(x * 0.03, z * 0.03, 29, 2) - 0.5) * 5 * rise;
      return y;
    }
    // The frozen sea: flat near the harbour, pressure ridges further out.
    if (seaIce(x, z)) {
      const out = Math.max(smooth(-110, -200, z), smooth(105, 190, x));
      const ridge = 1 - Math.abs(fbm2(x * 0.02, z * 0.05, 53, 3) * 2 - 1);
      return ICE + out * (Math.pow(ridge, 3) * 3.2 + (fbm2(x * 0.08, z * 0.08, 59, 2) - 0.5) * 0.6);
    }
    // Open water: the basin and the outer harbour, over the sea bed.
    return SEABED;
  }

  /** The ONE height field: the walk, the landing solver and every check stand on it. */
  function height(x, z) {
    const v = work.volumeAt(x, z);
    if (v) {
      let y = floorOf(v, x, z);
      if (v.id === 'terrace') {
        const dp = Math.hypot(x - PAD[0], z - PAD[1]);
        if (dp < PAD_R + 0.6) y += PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, dp));
      }
      return y;
    }
    const g = groundEdge(x, z);
    if (g !== null) return g;
    return landHeight(x, z);
  }

  /** Within EDGE of a ground volume: that volume's floor at the nearest point inside it; else null. */
  function groundEdge(x, z) {
    for (const v of groundVols) {
      const r = v.rect;
      if (x >= r.minX - EDGE && x <= r.maxX + EDGE && z >= r.minZ - EDGE && z <= r.maxZ + EDGE) {
        return floorOf(v, Math.max(r.minX, Math.min(r.maxX, x)), Math.max(r.minZ, Math.min(r.maxZ, z)));
      }
    }
    return null;
  }

  /** What the terrain MESH draws at (x, z): the ground volumes' floors, else the land (decks, rooms and hulls are built). */
  function surfaceHeight(x, z) {
    const v = work.volumeAt(x, z);
    if (v && GROUND_KINDS.includes(v.kind)) return height(x, z);
    const g = groundEdge(x, z);
    if (g !== null && !(v && !GROUND_KINDS.includes(v.kind))) return g;
    return landHeight(x, z);
  }

  /** Open water to be drawn at (x, z): over the sea bed, outside every hull and the dock. */
  function isOpenWater(x, z) {
    if (landHeight(x, z) > WATER - 1) return false;
    if (inRect(DOCK_PIT, x, z)) return false;
    if (hullAt(x, z)) return false;
    return true;
  }

  /** Rectangles cut out of the terrain mesh: every deck, every roofed volume, every hull's body. */
  function holes() {
    const out = [...deckVols, ...roofedVols].map(v => ({ ...v.rect }));
    for (const h of HULLS) out.push({ ...h.rect });
    out.push({ ...PUMP_HOUSE });
    return out;
  }

  /** Cover-mask boxes (`lib/cover.js`) for every roofed volume. */
  function coverSpec() {
    const boxes = roofedVols.map(v => {
      const f = v.floor;
      const lo = f.y1 === undefined ? f.y0 : Math.min(f.y0, f.y1);
      const hi = f.y1 === undefined ? f.y0 : Math.max(f.y0, f.y1);
      return {
        id: v.id,
        min: [v.rect.minX - 0.2, lo - 0.3, v.rect.minZ - 0.2],
        max: [v.rect.maxX + 0.2, hi + (v.roof ?? 5.2) + 0.3, v.rect.maxZ + 0.2],
        sky: v.sky ?? 0.25
      };
    });
    return { boxes, openings: [] };
  }

  /** Every gap that is not a way through, with the floor height at both ends and what lies beyond it. */
  function railSegments() {
    return work.barriers.map(b => {
      const v = work.byId.get(b.volume);
      return { ...b, ya: floorOf(v, b.ax, b.az), yb: floorOf(v, b.bx, b.bz), kind: b.opening.kind || 'rail', vkind: v.kind };
    });
  }

  /** Colliders the plan adds beyond the walls: the tug on its keel blocks. */
  function extraColliders() {
    return [{ minX: TUG.minX - 0.3, maxX: TUG.maxX + 0.3, minZ: TUG.minZ - 0.3, maxZ: TUG.maxZ + 0.3 }];
  }

  return {
    ...work,
    groundVols, deckVols, roofedVols, rooms: ROOMS, hulls: HULLS, outlines,
    height, landHeight, surfaceHeight, isOpenWater, hullAt, seaIce, holes, coverSpec, railSegments, extraColliders,
    PAD_TOP, PAD_R, LEVEL: WATER
  };
}
