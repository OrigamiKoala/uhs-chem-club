/**
 * bellows/works-plan.js — Bellows' gas works, as plain data and plain functions.
 *
 * NO THREE.JS HERE, ON PURPOSE. The layout generator (`tools/gen-bellows-layout.mjs`), the world
 * (`bellows.js`, `bellows/decks.js`, `bellows/stations.js`), the walk, the guide arrow and `verify:bellows`
 * all stand on this ONE declaration, so what is walked is what is drawn and checked.
 *
 * THE PLACE. A gas works hung in thin air over a sea of cloud. There is no ground: every floor is a steel
 * deck on lattice legs that go down into the cloud, set at seven heights from -8 to +12 m round six
 * structures (a sphere on its skirt, a piston gasholder, the Compressor's tower, a liquefier's cold box and
 * two moored gas bladders). Railed catwalks and ramps join the decks; under them is the drop.
 * Plan axes as every world: x east, z south (north is -z).
 *
 * THE WALK is a set of `lib/workings.js` volumes. Kinds:
 *   OPEN kinds (`deck`, `catwalk`, `ramp`): built floors in the open, no roof.
 *   ROOFED kinds (`room`, `passage`): under a roof, covered by the shared light mask.
 * Every side of an open volume that is not a doorway and does not stand against a structure is a RAIL
 * (`pass: false`): `withRails` finds those spans by looking past the side, so a drop is never left open.
 *
 * THE HEIGHT FIELD is ONE function: inside a volume its floor; everywhere else the cloud sea (`SEA`), a
 * drop nobody can reach because every edge is a rail or a wall.
 */

import { makeWorkings, floorOf, SIDE } from '../lib/workings.js';

/** The walk stays inside this square about the origin. */
export const WALK = 96;

/** The cloud sea's top: the "ground" under every deck. */
export const SEA = -46;

/** Floor heights (m). */
export const LEVEL = { stage: 0, sphere: 8, tower: -4, holder: -8, moor: 4, cradle: -5, cold: 12 };

/** The landing pad on the landing stage. */
export const PAD = [6, 76];
export const PAD_R = 8.4;

/** The player lands on the stage, at the head of the catwalk, looking north to the apron and the tower. */
export const SPAWN = [-2, 1.6, 60];
export const SPAWN_LOOK = [0, 4, 20];

/** The Compressor's ground: the open apron in front of its tower (`boss-arena.js` 'boss-compressor'). */
export const ARENA = {
  boss: [0, 0, 20],
  player: [0, 1.6, 34],
  lookAt: [0, 1.6, 20]
};

/** Where the plate stands from a room's back wall, and the approach mark in front of the plate. */
export const PLATE_FROM_BACK = 3.6;
export const APPROACH = 4.6;

/** Half the thickness of a drawn wall. */
export const WALL_HALF = 0.3;

/**
 * THE STRUCTURES the decks stand round. Each is solid to the walk (its own walls and the rooms' walls
 * collide) and is built by `decks.js`.
 *   plinth   the Compressor tower's plinth (the base hall, Bench 2, is inside it); the machine stands on top
 *   sphere   the spherical holder over its square skirt (Bench 1 is inside the skirt)
 *   holder   the piston gasholder, a drum (Bench 3 is inside its foot)
 *   coldbox  the liquefier's insulated casing (Bench 6 is its foot)
 *   bags     the moored bladder over the gondola (Bench 4) and the bladder hauled down on its cradle (Bench 5)
 */
export const PLINTH = { minX: -14, maxX: 14, minZ: -28, maxZ: 8, top: 2.0 };
export const SPHERE = { x: -75, z: 25, r: 11, skirt: { minX: -82.3, maxX: -67.7, minZ: 17.7, maxZ: 32.3 } };
export const HOLDER = { x: -34, z: -55, r: 11.2, top: 30 };
export const COLDBOX = { minX: 49.7, maxX: 64.3, minZ: -70.3, maxZ: -55.7, top: 44 };
export const BAGS = [
  // The moored bladder over the gondola: riding on its cables, its belly 4 m over the car's roof.
  { id: 'moored', x: 67, y: 23.5, z: 25, a: 24, b: 9.5, c: 10, axis: 'x' },
  // The bladder hauled down onto its cradle: its belly is Bench 5's roof, 5.5 m over the floor at the middle.
  { id: 'cradled', x: -67, y: 7.5, z: 69, a: 16, b: 7, c: 9.5, axis: 'x' }
];

/** The underside of a bag at (x, z): the y of its belly, or null when (x, z) is outside its outline. */
export function bagBelly(bag, x, z) {
  const u = (x - bag.x) / bag.a, w = (z - bag.z) / bag.c;
  const s = 1 - u * u - w * w;
  if (s <= 0) return null;
  return bag.y - bag.b * Math.sqrt(s);
}

/**
 * THE SIX ROOMS, one per bench, in bench order.
 *   rect     interior floor rectangle
 *   floor    floor height (m)
 *   top      clear height to the underside of the roof
 *   facing   the way the plate faces, toward the player and the door: 'north' (-z), 'south', 'east', 'west'
 *   door     { side, lo, hi } the way in, and `to` the volume it opens onto
 *   shell    the room's architecture, built by `decks.js`
 *   sky      fraction of sky fill the cover mask keeps inside
 */
export const ROOMS = [
  {
    id: 'room-1', site: 'site-1', questId: 'q1-knocks',
    structure: 'sphere-skirt', kind: 'cylinder', skin: 'shelf', plate: 'BN-01',
    rect: { minX: -82, maxX: -68, minZ: 18, maxZ: 32 }, floor: LEVEL.sphere, top: 5.2,
    facing: 'east', door: { side: 'maxX', lo: 22, hi: 28, to: 'sphere-deck' },
    shell: 'skirt', sky: 0.22
  },
  {
    id: 'room-2', site: 'site-2', questId: 'q2-laws',
    structure: 'tower-hall', kind: 'piston', skin: 'deck', plate: 'BN-02',
    rect: { minX: -7, maxX: 7, minZ: -24, maxZ: -10 }, floor: LEVEL.tower, top: 5.2,
    facing: 'east', door: { side: 'maxX', lo: -20, hi: -14, to: 'tower-door' },
    shell: 'hall', sky: 0.14
  },
  {
    id: 'room-3', site: 'site-3', questId: 'q3-ideal',
    structure: 'holder-meter', kind: 'scale', skin: 'desk', plate: 'BN-03',
    rect: { minX: -41, maxX: -27, minZ: -62, maxZ: -48 }, floor: LEVEL.holder, top: 5.2,
    facing: 'east', door: { side: 'maxX', lo: -58, hi: -52, to: 'holder-door' },
    shell: 'meter', sky: 0.16
  },
  {
    id: 'room-4', site: 'site-4', questId: 'q4-mixtures',
    structure: 'gondola', kind: 'tanks', skin: 'shelf', plate: 'BN-04',
    rect: { minX: 58, maxX: 76, minZ: 19, maxZ: 31 }, floor: LEVEL.moor, top: 5.2,
    facing: 'west', door: { side: 'minX', lo: 22, hi: 28, to: 'moor-deck' },
    windows: [{ side: 'minZ', lo: 63, hi: 74 }, { side: 'maxZ', lo: 63, hi: 74 }],
    shell: 'gondola', sky: 0.34
  },
  {
    id: 'room-5', site: 'site-5', questId: 'q5-speed',
    structure: 'bag-cradle', kind: 'pinhole', skin: 'deck', plate: 'BN-05',
    rect: { minX: -74, maxX: -60, minZ: 62, maxZ: 76 }, floor: LEVEL.cradle, top: 5.4,
    facing: 'south', door: { side: 'maxZ', lo: -70, hi: -64, to: 'cradle-deck' },
    shell: 'cradle', sky: 0.3
  },
  {
    id: 'room-6', site: 'site-6', questId: 'q6-real',
    structure: 'cold-box', kind: 'cold', skin: 'desk', plate: 'BN-06',
    rect: { minX: 50, maxX: 64, minZ: -70, maxZ: -56 }, floor: LEVEL.cold, top: 5.2,
    facing: 'south', door: { side: 'maxZ', lo: 54, hi: 60, to: 'cold-deck' },
    shell: 'casing', sky: 0.18
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

export const OPEN_KINDS = ['deck', 'catwalk', 'ramp'];
export const ROOFED_KINDS = ['room', 'passage'];

/** An opening helper: `o('minZ', lo, hi, to)` a way through. */
const o = (side, lo, hi, to) => ({ side, lo, hi, to });

function declared() {
  const S = LEVEL.stage;
  const vols = [
    /* THE LANDING STAGE AND THE APRON */
    { id: 'stage', kind: 'deck', rect: { minX: -20, maxX: 24, minZ: 52, maxZ: 94 }, floor: { y0: S },
      openings: [o('minZ', -3, 3, 'cw-south'), o('minX', 78, 82, 'ramp-cradle')] },
    { id: 'cw-south', kind: 'catwalk', rect: { minX: -3, maxX: 3, minZ: 40, maxZ: 52 }, floor: { y0: S },
      openings: [o('maxZ', -3, 3, 'stage'), o('minZ', -3, 3, 'apron')] },
    { id: 'apron', kind: 'deck', rect: { minX: -14, maxX: 14, minZ: 8, maxZ: 40 }, floor: { y0: S },
      openings: [o('maxZ', -3, 3, 'cw-south'), o('minX', 28, 32, 'ramp-west'), o('maxX', 8, 12, 'ramp-tower'), o('maxX', 24, 28, 'ramp-east')] },

    /* WEST: UP TO THE SPHERE (Bench 1) */
    { id: 'ramp-west', kind: 'ramp', rect: { minX: -54, maxX: -14, minZ: 28, maxZ: 32 },
      floor: { axis: 'x', from: -14, to: -54, y0: S, y1: LEVEL.sphere },
      openings: [o('maxX', 28, 32, 'apron'), o('minX', 28, 32, 'sphere-deck')] },
    { id: 'sphere-deck', kind: 'deck', rect: { minX: -68, maxX: -54, minZ: 12, maxZ: 40 }, floor: { y0: LEVEL.sphere },
      openings: [o('maxX', 28, 32, 'ramp-west'), o('minX', 22, 28, 'room-1')] },

    /* NORTH: DOWN INTO THE TOWER (Bench 2) AND ON DOWN TO THE HOLDER (Bench 3) */
    { id: 'ramp-tower', kind: 'ramp', rect: { minX: 14, maxX: 18, minZ: -22, maxZ: 12 },
      floor: { axis: 'z', from: 8, to: -14, y0: S, y1: LEVEL.tower },
      openings: [o('minX', 8, 12, 'apron'), o('minX', -20, -14, 'tower-door'), o('minZ', 14, 18, 'cw-north')] },
    { id: 'tower-door', kind: 'passage', rect: { minX: 7, maxX: 14, minZ: -20, maxZ: -14 }, floor: { y0: LEVEL.tower }, roof: 4.2, sky: 0.18,
      openings: [o('maxX', -20, -14, 'ramp-tower'), o('minX', -20, -14, 'room-2')] },
    { id: 'cw-north', kind: 'catwalk', rect: { minX: 14, maxX: 18, minZ: -60, maxZ: -22 }, floor: { y0: LEVEL.tower },
      openings: [o('maxZ', 14, 18, 'ramp-tower'), o('minX', -60, -56, 'ramp-holder')] },
    { id: 'ramp-holder', kind: 'ramp', rect: { minX: -6, maxX: 14, minZ: -60, maxZ: -56 },
      floor: { axis: 'x', from: 14, to: -6, y0: LEVEL.tower, y1: LEVEL.holder },
      openings: [o('maxX', -60, -56, 'cw-north'), o('minX', -60, -56, 'holder-deck')] },
    { id: 'holder-deck', kind: 'deck', rect: { minX: -22, maxX: -6, minZ: -66, maxZ: -44 }, floor: { y0: LEVEL.holder },
      openings: [o('maxX', -60, -56, 'ramp-holder'), o('minX', -58, -52, 'holder-door')] },
    { id: 'holder-door', kind: 'passage', rect: { minX: -27, maxX: -22, minZ: -58, maxZ: -52 }, floor: { y0: LEVEL.holder }, roof: 4.2, sky: 0.18,
      openings: [o('maxX', -58, -52, 'holder-deck'), o('minX', -58, -52, 'room-3')] },

    /* EAST: UP TO THE MOORING DECK (Bench 4) AND ON UP TO THE COLD BOX (Bench 6) */
    { id: 'ramp-east', kind: 'ramp', rect: { minX: 14, maxX: 44, minZ: 24, maxZ: 28 },
      floor: { axis: 'x', from: 14, to: 34, y0: S, y1: LEVEL.moor },
      openings: [o('minX', 24, 28, 'apron'), o('maxX', 24, 28, 'moor-deck')] },
    { id: 'moor-deck', kind: 'deck', rect: { minX: 44, maxX: 58, minZ: 8, maxZ: 44 }, floor: { y0: LEVEL.moor },
      openings: [o('minX', 24, 28, 'ramp-east'), o('maxX', 22, 28, 'room-4'), o('minZ', 48, 52, 'ramp-cold')] },
    { id: 'ramp-cold', kind: 'ramp', rect: { minX: 48, maxX: 52, minZ: -32, maxZ: 8 },
      floor: { axis: 'z', from: 8, to: -32, y0: LEVEL.moor, y1: LEVEL.cold },
      openings: [o('maxZ', 48, 52, 'moor-deck'), o('minZ', 48, 52, 'cold-deck')] },
    { id: 'cold-deck', kind: 'deck', rect: { minX: 40, maxX: 72, minZ: -56, maxZ: -32 }, floor: { y0: LEVEL.cold },
      openings: [o('maxZ', 48, 52, 'ramp-cold'), o('minZ', 54, 60, 'room-6')] },

    /* SOUTH-WEST: DOWN OFF THE STAGE TO THE CRADLE (Bench 5) */
    { id: 'ramp-cradle', kind: 'ramp', rect: { minX: -60, maxX: -20, minZ: 78, maxZ: 82 },
      floor: { axis: 'x', from: -20, to: -45, y0: S, y1: LEVEL.cradle },
      openings: [o('maxX', 78, 82, 'stage'), o('minX', 78, 82, 'cradle-deck')] },
    { id: 'cradle-deck', kind: 'deck', rect: { minX: -74, maxX: -60, minZ: 76, maxZ: 86 }, floor: { y0: LEVEL.cradle },
      openings: [o('maxX', 78, 82, 'ramp-cradle'), o('minZ', -70, -64, 'room-5')] }
  ];

  for (const rm of ROOMS) {
    const openings = [o(rm.door.side, rm.door.lo, rm.door.hi, rm.door.to)];
    for (const w of rm.windows || []) openings.push({ side: w.side, lo: w.lo, hi: w.hi, to: null, pass: false, kind: 'window' });
    vols.push({ id: rm.id, kind: 'room', rect: rm.rect, floor: { y0: rm.floor }, roof: rm.top, sky: rm.sky, room: rm, openings });
  }
  return vols;
}

const inRect = (r, x, z) => x >= r.minX && x < r.maxX && z >= r.minZ && z < r.maxZ;

/** True when (x, z) is inside a structure's solid body (the plinth, the skirt, the holder, the cold box). */
export function inStructure(x, z) {
  if (inRect(PLINTH, x, z)) return 'plinth';
  if (inRect(SPHERE.skirt, x, z)) return 'skirt';
  if (Math.hypot(x - HOLDER.x, z - HOLDER.z) < HOLDER.r + 0.35) return 'holder';
  if (inRect(COLDBOX, x, z)) return 'coldbox';
  return null;
}

/**
 * Every side of an OPEN volume, less its doorways: a span that stands against a structure or another
 * volume stays a wall (the structure is its face); a span with the drop behind it becomes a rail. Found by
 * looking 0.6 m past the side every quarter metre, so no stretch of a drop is ever left unrailed.
 */
function withRails(vols) {
  const byRect = vols.map(v => v.rect);
  const behind = (x, z) => byRect.some(r => inRect(r, x, z)) || Boolean(inStructure(x, z));
  for (const v of vols) {
    if (!OPEN_KINDS.includes(v.kind)) continue;
    const r = v.rect;
    for (const side of ['minX', 'maxX', 'minZ', 'maxZ']) {
      const { along, dir } = SIDE[side];
      const lo = along === 'z' ? r.minZ : r.minX, hi = along === 'z' ? r.maxZ : r.maxX;
      const plane = r[side];
      const gaps = v.openings.filter(op => op.side === side);
      const runs = [];
      const STEP = 0.25;
      for (let t = lo; t < hi - 1e-6; t += STEP) {
        const m = t + STEP / 2;
        if (gaps.some(g => m > g.lo && m < g.hi)) { runs.push(null); continue; }
        const [x, z] = along === 'z' ? [plane - dir[0] * 0.6, m] : [m, plane - dir[1] * 0.6];
        runs.push(behind(x, z) ? null : t);
      }
      let start = null;
      for (let i = 0; i <= runs.length; i++) {
        const t = runs[i];
        if (t !== null && t !== undefined) { if (start === null) start = t; continue; }
        if (start !== null) {
          const end = lo + i * STEP;
          v.openings.push({ side, lo: start, hi: Math.min(hi, end), to: null, pass: false, kind: 'rail' });
          start = null;
        }
      }
    }
  }
  return vols;
}

/* ======================================================================
   THE PLAN
   ====================================================================== */

/** Build the whole pure plan: the workings, the height field, the cover spec and the rails. */
export function makeWorksPlan() {
  const work = makeWorkings(withRails(declared()), {
    roof: 5.2, holeMargin: 0, jamb: 0.4, wallInner: 0.3, wallDepth: 0.5,
    openKinds: OPEN_KINDS, outdoorDoors: true
  });
  const openVols = work.volumes.filter(v => OPEN_KINDS.includes(v.kind));
  const roofedVols = work.volumes.filter(v => ROOFED_KINDS.includes(v.kind));

  /** The ONE height field: the walk, the landing solver and every check stand on it. */
  function height(x, z) {
    const v = work.volumeAt(x, z);
    return v ? floorOf(v, x, z) : SEA;
  }

  /** Cover-mask boxes (`lib/cover.js`): every roofed volume, and the piston holder's whole foot under its piston. */
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
    const R = HOLDER.r;
    boxes.push({
      id: 'holder-foot',
      min: [HOLDER.x - R - 0.2, LEVEL.holder - 0.3, HOLDER.z - R - 0.2],
      max: [HOLDER.x + R - 0.2, LEVEL.holder + 5.2 + 0.6, HOLDER.z + R + 0.2],
      sky: 0.16
    });
    return { boxes, openings: [] };
  }

  /** Every gap that is not a way through, with the floor at both ends: the rails and the gondola's windows. */
  function railSegments() {
    return work.barriers.map(b => {
      const v = work.byId.get(b.volume);
      return { ...b, ya: floorOf(v, b.ax, b.az), yb: floorOf(v, b.bx, b.bz), kind: b.opening.kind || 'rail', vkind: v.kind };
    });
  }

  /** Colliders the plan adds beyond the walls: the holder's drum, as a ring of discs round its shell. */
  function extraColliders() {
    const out = [];
    const n = 64;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push({ x: HOLDER.x + Math.cos(a) * HOLDER.r, z: HOLDER.z + Math.sin(a) * HOLDER.r, radius: 0.75 });
    }
    // The door through the shell: the discs that stand in the passage are left out.
    return out.filter(c => !(c.x > -28 && c.z > -58.6 && c.z < -51.4));
  }

  return {
    ...work,
    openVols, roofedVols, rooms: ROOMS,
    height, coverSpec, railSegments, extraColliders, inStructure, SEA
  };
}
