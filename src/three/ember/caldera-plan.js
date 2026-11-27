/**
 * ember/caldera-plan.js — Ember Reach's caldera wall switchback, as plain data and plain functions.
 *
 * NO THREE.JS HERE, ON PURPOSE. The layout generator (`tools/gen-ember-layout.mjs`), the world
 * (`ember.js`, `ember/terrain.js`, `ember/stations.js`), the walk, the guide arrow and `verify:ember`
 * all stand on this ONE declaration, so what is walked is what is drawn and what is checked.
 *
 * THE LANDFORM. North (-z) is into the volcanic caldera toward the molten lava lake (y = -20.25 m).
 * South (+z) is up the stepped inside wall of the caldera. Five terraces step down from the rim shelf
 * (y = 20 m) to the caldera-edge plant terrace (y = 0 m) via four 1-in-6 switchback ramps alternating
 * west and east between four hairpin turns. Six geothermal galleries are cut into the cliff faces
 * behind the switchback legs with their north side open to the caldera drop; the turbine hall stands
 * at the foot of the wall beside the Crucible's arena and the railed caldera overlook.
 *
 * THE WALK is a set of `lib/workings.js` volumes, closed on every side that is not a doorway. Every
 * lake-facing drop is closed by a `pass: false` railing (`kind: 'rail'` or `'bay'`, 1.05 m high —
 * below eye height so the lava lake and lower terraces remain in full view).
 *
 * THE HEIGHT FIELD is ONE function: inside a volume its floor (plus the landing pad bevel); within
 * `EDGE` of an open volume's closed side the same floor (hiding the step inside the wall or kerb);
 * everywhere else the caldera wall, floor, lava lake basin, volcanic cone and outer rim.
 */

import { makeWorkings, insideRect, floorOf } from '../lib/workings.js';

/** The walk stays inside this square about the origin (stage bound for every Learn world). */
export const WALK = 100;

/** Walking terrace elevations (m), top rim shelf down to caldera-edge plant terrace (6 m per step). */
export const LEVEL = [24, 18, 12, 6, 0];

/** Caldera floor and lava lake elevations (m), 20 m below Level 4 (40 m below the rim). */
export const CALDERA_FLOOR = -20;
export const LAKE_Y = -20.25;

/** Landing pad geometry on the rim shelf. */
export const PAD = [66, 76];
export const PAD_TOP = 0.12;
export const PAD_R = 9.4;

/** Player spawn on the rim shelf, looking west-northwest down Ramp 1 and across the caldera. */
export const SPAWN = [26, LEVEL[0] + 1.6, 66];
export const SPAWN_LOOK = [-6, LEVEL[0] + 0.8, 60];

/** The Crucible's arena on the caldera-edge overlook (Level 4, y = 0), facing north over the lake. */
export const ARENA = {
  boss: [0, 0, -58],
  player: [0, 1.6, -42],
  lookAt: [0, 1.6, -58]
};

/** Far caldera landmarks: lava lake and active cone on the caldera floor. */
export const LAKE = { x: -12, z: -155, rx: 75, rz: 45 };
export const CONE = { x: 68, z: -310, radius: 130, height: 175, crater: 18 };

/** Thickness of gallery front walls (separating each room from its switchback road) and retaining edge. */
export const WALL_T = 0.6;
/** How far over `floor + top` each buried gallery's roof tops out (`terrain.js` `buildCalderaShells`). */
const ROOF_LIFT = { ribs: 0.45, sinterArch: 0.45, overhang: 0.45, brickVault: 1.2, gantry: 0.8, baffle: 0.8 };
export const EDGE = 0.35;

/** How far in front of a room's back wall the bench plate stands, and how far in front of the plate the player stands. */
export const PLATE_FROM_BACK = 3.6;
export const APPROACH = 4.6;

/**
 * THE SEVEN ROOMS, one per bench, in bench order.
 *   rect      interior floor rectangle (at least 13.6 x 13.0 m, well above 11.2 x 11 m minimum)
 *   floor     terrace elevation (m)
 *   onto      the switchback road volume this room opens onto
 *   facing    which way the bench plate faces: 'north' (-z), 'west' (-x), 'east' (+x)
 *   door      [lo, hi] along x on the room's north wall (`minZ`)
 *   bay       optional [lo, hi] along x on `minZ` for an open railed lake-viewing bay (`pass: false`)
 *   shell     architectural roof/wall style built by `ember/terrain.js`
 *   top       clear interior headroom at the plate (>= 5.2 m, clearing the 4.6 m lean-in camera)
 *   ridge     optional gabled ridge height (turbine hall)
 *   sky       fraction of sky fill kept inside the cover mask (higher for open-sided galleries)
 */
export const ROOMS = [
  {
    id: 'room-1', site: 'site-1', questId: 'q1-flow', title: 'Heat and Temperature',
    structure: 'wellhead-exchanger', kind: 'contact', skin: 'shelf', plate: 'CAL-01',
    rect: { minX: -12, maxX: 2, minZ: 42.6, maxZ: 55.6 }, floor: LEVEL[1], onto: 'road-1',
    facing: 'north', door: [-8.2, -1.8], bay: null,
    shell: 'ribs', top: 5.4, sky: 0.36
  },
  {
    id: 'room-2', site: 'site-2', questId: 'q2-calorimetry', title: 'Calorimetry',
    structure: 'spring-shelf', kind: 'cup', skin: 'deck', plate: 'CAL-02',
    rect: { minX: 24, maxX: 38, minZ: 42.6, maxZ: 55.6 }, floor: LEVEL[1], onto: 'road-1',
    facing: 'west', door: [24.4, 28.4], bay: [29.4, 37.0],
    shell: 'sinterArch', top: 5.2, sky: 0.40
  },
  {
    id: 'room-3', site: 'site-3', questId: 'q3-enthalpy', title: 'Reaction Enthalpy',
    structure: 'boiler-room', kind: 'cup', skin: 'desk', plate: 'CAL-03',
    rect: { minX: 44, maxX: 58, minZ: 18.6, maxZ: 31.6 }, floor: LEVEL[2], onto: 'road-2',
    facing: 'north', door: [48.2, 53.8], bay: null,
    shell: 'brickVault', top: 5.6, sky: 0.30
  },
  {
    id: 'room-4', site: 'site-4', questId: 'q4-bonds', title: 'Bond Enthalpies',
    structure: 'fumarole-coil', kind: 'bonds', skin: 'deck', plate: 'CAL-04',
    rect: { minX: -2, maxX: 13, minZ: 18.6, maxZ: 31.6 }, floor: LEVEL[2], onto: 'road-2',
    facing: 'north', door: [1.5, 9.5], bay: null,
    shell: 'overhang', top: 5.8, sky: 0.42
  },
  {
    id: 'room-5', site: 'site-5', questId: 'q5-hess', title: "Hess's Law",
    structure: 'separator-manifold', kind: 'hess', skin: 'shelf', plate: 'CAL-05',
    rect: { minX: -36, maxX: -21.6, minZ: -5.4, maxZ: 7.6 }, floor: LEVEL[3], onto: 'road-3',
    facing: 'north', door: [-32.2, -25.4], bay: null,
    shell: 'gantry', top: 6.0, sky: 0.36
  },
  {
    id: 'room-6', site: 'site-6', questId: 'q6-entropy', title: 'Entropy',
    structure: 'silencer-pair', kind: 'cell', skin: 'desk', plate: 'CAL-06',
    rect: { minX: 4, maxX: 18, minZ: -5.4, maxZ: 7.6 }, floor: LEVEL[3], onto: 'road-3',
    facing: 'east', door: [13.6, 17.6], bay: [5.0, 12.6],
    shell: 'baffle', top: 5.6, sky: 0.40
  },
  {
    id: 'room-7', site: 'site-7', questId: 'q7-gibbs', title: 'Free Energy',
    structure: 'control-room', kind: 'plot', skin: 'desk', plate: 'CAL-07',
    rect: { minX: 28, maxX: 44, minZ: -29.4, maxZ: -16.4 }, floor: LEVEL[4], onto: 'road-4',
    facing: 'north', door: [33.6, 38.4], bay: null,
    shell: 'turbineHall', top: 6.8, ridge: 9.0, sky: 0.20
  }
];

/** Compute a room's bench plate position `[x, y, z]`, approach mark `[x, y, z]`, and facing unit vector `[fx, fz]`. */
export function sitePlacement(room) {
  const r = room.rect;
  const cx = (r.minX + r.maxX) / 2;
  const cz = (r.minZ + r.maxZ) / 2;
  let px, pz, fx, fz;
  if (room.facing === 'north') {
    px = cx; pz = r.maxZ - PLATE_FROM_BACK; fx = 0; fz = -1;
  } else if (room.facing === 'west') {
    px = r.maxX - PLATE_FROM_BACK; pz = cz; fx = -1; fz = 0;
  } else {
    px = r.minX + PLATE_FROM_BACK; pz = cz; fx = 1; fz = 0;
  }
  const round = n => Math.round(n * 100) / 100;
  return {
    pos: [round(px), room.floor, round(pz)],
    approachPos: [round(px + fx * APPROACH), round(room.floor + 1.6), round(pz + fz * APPROACH)],
    facing: [fx, fz]
  };
}

/* ======================================================================
   WALK VOLUMES (lib/workings.js)
   ====================================================================== */

function buildVolumes() {
  const vols = [
    // Level 0: Rim Shelf (y = 20)
    {
      id: 'yard-rim', kind: 'yard',
      rect: { minX: 14, maxX: 92, minZ: 58, maxZ: 92 },
      floor: { y0: LEVEL[0] },
      openings: [
        { side: 'minX', lo: 58, hi: 66, to: 'ramp-1' },
        { side: 'minZ', lo: 14, hi: 92, to: null, pass: false, kind: 'rail' }
      ]
    },
    // Ramp 1: westbound 20 -> 15 m (1 in 6)
    {
      id: 'ramp-1', kind: 'ramp',
      rect: { minX: -16, maxX: 14, minZ: 58, maxZ: 66 },
      floor: { axis: 'x', from: 14, to: -16, y0: LEVEL[0], y1: LEVEL[1] },
      openings: [
        { side: 'maxX', lo: 58, hi: 66, to: 'yard-rim' },
        { side: 'minX', lo: 58, hi: 66, to: 'turn-1' },
        { side: 'minZ', lo: -16, hi: 14, to: null, pass: false, kind: 'rail' }
      ]
    },
    // Hairpin 1: west turn at y = 15
    {
      id: 'turn-1', kind: 'road',
      rect: { minX: -30, maxX: -16, minZ: 34, maxZ: 66 },
      floor: { y0: LEVEL[1] },
      openings: [
        { side: 'maxX', lo: 58, hi: 66, to: 'ramp-1' },
        { side: 'maxX', lo: 34, hi: 42, to: 'road-1' },
        { side: 'minZ', lo: -30, hi: -16, to: null, pass: false, kind: 'rail' },
        { side: 'minX', lo: 34, hi: 66, to: null, pass: false, kind: 'rail' }
      ]
    },
    // Level 1: eastbound road at y = 15 (Benches 1 & 2)
    {
      id: 'road-1', kind: 'road',
      rect: { minX: -16, maxX: 46, minZ: 34, maxZ: 42 },
      floor: { y0: LEVEL[1] },
      openings: [
        { side: 'minX', lo: 34, hi: 42, to: 'turn-1' },
        { side: 'maxX', lo: 34, hi: 42, to: 'ramp-2' },
        { side: 'minZ', lo: -16, hi: 46, to: null, pass: false, kind: 'rail' },
        { side: 'maxZ', lo: -8.2, hi: -1.8, to: 'door-1' },
        { side: 'maxZ', lo: 24.4, hi: 28.4, to: 'door-2' },
        { side: 'maxZ', lo: 29.4, hi: 37.0, to: null, pass: false, kind: 'bay' }
      ]
    },
    // Ramp 2: eastbound 15 -> 10 m (1 in 6)
    {
      id: 'ramp-2', kind: 'ramp',
      rect: { minX: 46, maxX: 76, minZ: 34, maxZ: 42 },
      floor: { axis: 'x', from: 46, to: 76, y0: LEVEL[1], y1: LEVEL[2] },
      openings: [
        { side: 'minX', lo: 34, hi: 42, to: 'road-1' },
        { side: 'maxX', lo: 34, hi: 42, to: 'turn-2' },
        { side: 'minZ', lo: 46, hi: 76, to: null, pass: false, kind: 'rail' }
      ]
    },
    // Hairpin 2: east turn at y = 10
    {
      id: 'turn-2', kind: 'road',
      rect: { minX: 76, maxX: 88, minZ: 10, maxZ: 42 },
      floor: { y0: LEVEL[2] },
      openings: [
        { side: 'minX', lo: 34, hi: 42, to: 'ramp-2' },
        { side: 'minX', lo: 10, hi: 18, to: 'road-2' },
        { side: 'minZ', lo: 76, hi: 88, to: null, pass: false, kind: 'rail' }
      ]
    },
    // Level 2: westbound road at y = 10 (Benches 3 & 4)
    {
      id: 'road-2', kind: 'road',
      rect: { minX: -26, maxX: 76, minZ: 10, maxZ: 18 },
      floor: { y0: LEVEL[2] },
      openings: [
        { side: 'maxX', lo: 10, hi: 18, to: 'turn-2' },
        { side: 'minX', lo: 10, hi: 18, to: 'ramp-3' },
        { side: 'minZ', lo: -26, hi: 76, to: null, pass: false, kind: 'rail' },
        { side: 'maxZ', lo: 48.2, hi: 53.8, to: 'door-3' },
        { side: 'maxZ', lo: 1.5, hi: 9.5, to: 'door-4' }
      ]
    },
    // Ramp 3: westbound 10 -> 5 m (1 in 6)
    {
      id: 'ramp-3', kind: 'ramp',
      rect: { minX: -56, maxX: -26, minZ: 10, maxZ: 18 },
      floor: { axis: 'x', from: -26, to: -56, y0: LEVEL[2], y1: LEVEL[3] },
      openings: [
        { side: 'maxX', lo: 10, hi: 18, to: 'road-2' },
        { side: 'minX', lo: 10, hi: 18, to: 'turn-3' },
        { side: 'minZ', lo: -56, hi: -26, to: null, pass: false, kind: 'rail' }
      ]
    },
    // Hairpin 3: west turn at y = 5
    {
      id: 'turn-3', kind: 'road',
      rect: { minX: -68, maxX: -56, minZ: -14, maxZ: 18 },
      floor: { y0: LEVEL[3] },
      openings: [
        { side: 'maxX', lo: 10, hi: 18, to: 'ramp-3' },
        { side: 'maxX', lo: -14, hi: -6, to: 'road-3' },
        { side: 'minZ', lo: -68, hi: -56, to: null, pass: false, kind: 'rail' },
        { side: 'minX', lo: -14, hi: 18, to: null, pass: false, kind: 'rail' }
      ]
    },
    // Level 3: eastbound road at y = 5 (Benches 5 & 6)
    {
      id: 'road-3', kind: 'road',
      rect: { minX: -56, maxX: 34, minZ: -14, maxZ: -6 },
      floor: { y0: LEVEL[3] },
      openings: [
        { side: 'minX', lo: -14, hi: -6, to: 'turn-3' },
        { side: 'maxX', lo: -14, hi: -6, to: 'ramp-4' },
        { side: 'minZ', lo: -56, hi: 34, to: null, pass: false, kind: 'rail' },
        { side: 'maxZ', lo: -32.2, hi: -25.4, to: 'door-5' },
        { side: 'maxZ', lo: 13.6, hi: 17.6, to: 'door-6' },
        { side: 'maxZ', lo: 5.0, hi: 12.6, to: null, pass: false, kind: 'bay' }
      ]
    },
    // Ramp 4: eastbound 5 -> 0 m (1 in 6)
    {
      id: 'ramp-4', kind: 'ramp',
      rect: { minX: 34, maxX: 64, minZ: -14, maxZ: -6 },
      floor: { axis: 'x', from: 34, to: 64, y0: LEVEL[3], y1: LEVEL[4] },
      openings: [
        { side: 'minX', lo: -14, hi: -6, to: 'road-3' },
        { side: 'maxX', lo: -14, hi: -6, to: 'turn-4' },
        { side: 'minZ', lo: 34, hi: 64, to: null, pass: false, kind: 'rail' }
      ]
    },
    // Hairpin 4: east turn at y = 0
    {
      id: 'turn-4', kind: 'road',
      rect: { minX: 64, maxX: 76, minZ: -42, maxZ: -6 },
      floor: { y0: LEVEL[4] },
      openings: [
        { side: 'minX', lo: -14, hi: -6, to: 'ramp-4' },
        { side: 'minX', lo: -42, hi: -30, to: 'road-4' },
        { side: 'minZ', lo: 64, hi: 76, to: null, pass: false, kind: 'rail' }
      ]
    },
    // Level 4: westbound plant terrace road at y = 0 (Bench 7 Turbine Hall)
    {
      id: 'road-4', kind: 'road',
      rect: { minX: 20, maxX: 64, minZ: -42, maxZ: -30 },
      floor: { y0: LEVEL[4] },
      openings: [
        { side: 'maxX', lo: -42, hi: -30, to: 'turn-4' },
        { side: 'minX', lo: -42, hi: -30, to: 'arena-deck' },
        { side: 'minZ', lo: 20, hi: 64, to: null, pass: false, kind: 'rail' },
        { side: 'maxZ', lo: 33.6, hi: 38.4, to: 'door-7' }
      ]
    },
    // Level 4: Caldera-edge overlook & Crucible boss arena (y = 0)
    {
      id: 'arena-deck', kind: 'yard',
      rect: { minX: -24, maxX: 20, minZ: -72, maxZ: -30 },
      floor: { y0: LEVEL[4] },
      openings: [
        { side: 'maxX', lo: -42, hi: -30, to: 'road-4' },
        { side: 'maxX', lo: -72, hi: -42, to: null, pass: false, kind: 'rail' },
        { side: 'minZ', lo: -24, hi: 20, to: null, pass: false, kind: 'rail' },
        { side: 'minX', lo: -72, hi: -30, to: null, pass: false, kind: 'rail' }
      ]
    }
  ];

  // Add each room and its 0.6 m doorway volume connecting it to its road.
  for (let i = 0; i < ROOMS.length; i++) {
    const rm = ROOMS[i];
    const doorId = `door-${i + 1}`;
    const [d0, d1] = rm.door;
    const zRoad = rm.rect.minZ - WALL_T;
    vols.push({
      id: doorId, kind: 'door',
      rect: { minX: d0, maxX: d1, minZ: zRoad, maxZ: rm.rect.minZ },
      floor: { y0: rm.floor },
      roof: Math.min(rm.top - 0.3, 4.6),
      sky: rm.sky,
      openings: [
        { side: 'minZ', lo: d0, hi: d1, to: rm.onto },
        { side: 'maxZ', lo: d0, hi: d1, to: rm.id }
      ]
    });
    const rOpen = [{ side: 'minZ', lo: d0, hi: d1, to: doorId }];
    if (rm.bay) rOpen.push({ side: 'minZ', lo: rm.bay[0], hi: rm.bay[1], to: null, pass: false, kind: 'bay' });
    vols.push({
      id: rm.id, kind: 'room',
      rect: rm.rect,
      floor: { y0: rm.floor },
      roof: rm.top,
      sky: rm.sky,
      room: rm,
      openings: rOpen
    });
  }

  return vols;
}

/* ======================================================================
   NOISE + ANALYTIC HEIGHT FIELD
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
function ridge2(x, z, seed, oct = 3) {
  return 1 - Math.abs(fbm2(x, z, seed, oct) * 2 - 1);
}
const smooth = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/** Toward the WSW sun in plan: outer caldera wall dips there so the sun clears the rim. */
const SUN_PLAN = (() => { const x = -0.82, z = 0.44; const n = Math.hypot(x, z); return [x / n, z / n]; })();

/**
 * Build the complete pure caldera plan: workings, height field, cover spec, terrain holes.
 */
export function makeCalderaPlan() {
  const volumes = buildVolumes();
  const work = makeWorkings(volumes, {
    roof: 5.4,
    holeMargin: 0.4,
    jamb: 0.5,
    wallInner: 0.22,
    wallDepth: 0.65,
    openKinds: ['road', 'ramp', 'yard'],
    outdoorDoors: true
  });

  const openVols = work.volumes.filter(v => ['road', 'ramp', 'yard'].includes(v.kind));
  const roofedVols = work.volumes.filter(v => v.kind === 'room' || v.kind === 'door');
  // Galleries buried in the cliff, each with the height its roof tops out at (`terrain.js` builds each shell's roof).
  const buried = roofedVols.filter(v => v.kind === 'room' && ROOF_LIFT[v.room.shell] !== undefined).map(v => ({
    id: v.id, rect: v.rect, door: v.room.door,
    cap: v.room.floor + v.room.top + ROOF_LIFT[v.room.shell] + 0.08
  }));

  /** The natural caldera landform outside the walkable volumes. */
  function landHeight(x, z) {
    // 1. Base terraced caldera wall stepping down from south (+z) to north (-z).
    // Steps sit at the z lines between switchback terraces: 58, 34, 10, -14, -72.
    let y;
    if (z >= 58) {
      y = LEVEL[0];
    } else if (z >= 34) {
      y = LEVEL[1] + (LEVEL[0] - LEVEL[1]) * smooth(42.5, 57.5, z);
    } else if (z >= 10) {
      y = LEVEL[2] + (LEVEL[1] - LEVEL[2]) * smooth(18.5, 33.5, z);
    } else if (z >= -14) {
      y = LEVEL[3] + (LEVEL[2] - LEVEL[3]) * smooth(-5.5, 9.5, z);
    } else if (z >= -72) {
      y = LEVEL[4] + (LEVEL[3] - LEVEL[4]) * smooth(-29.5, -14.5, z);
    } else {
      // Sheer drop past the north overlook rail (z = -72) down 20 m to the caldera floor.
      const drop = smooth(-72, -88, z);
      const ledge = Math.floor(drop * 3) / 3 * 0.3 + drop * 0.7;
      y = LEVEL[4] + (CALDERA_FLOOR - LEVEL[4]) * ledge;
    }

    // Add natural volcanic roughness on the unwalked cliff bands and flanks.
    const rockNoise = (fbm2(x * 0.04, z * 0.04, 19, 3) - 0.5) * 2.2;
    if (z >= -76 && z <= 96 && Math.abs(x) <= 105) {
      y += rockNoise * 0.45;
    }

    // 2. Caldera floor details north of z = -80: lava lake basin and volcanic cone.
    if (z < -76) {
      const floorBlend = smooth(-76, -94, z);
      let floorY = CALDERA_FLOOR
        + (fbm2(x * 0.025, z * 0.025, 61, 4) - 0.5) * 4.5
        + (ridge2(x * 0.08, z * 0.08, 63, 2) - 0.5) * 1.1;

      // Flatten into the lava lake ellipse.
      const le = ((x - LAKE.x) / LAKE.rx) ** 2 + ((z - LAKE.z) / LAKE.rz) ** 2;
      floorY = (CALDERA_FLOOR - 0.7) + (floorY - (CALDERA_FLOOR - 0.7)) * smooth(0.85, 1.45, le);

      // Volcanic cone rising out of the far caldera floor.
      const rc = Math.hypot(x - CONE.x, z - CONE.z);
      if (rc < CONE.radius) {
        // Realism pass: the angle is taken as (cos, sin), so the gullies have no seam where atan2 wraps; flow lobes
        // and levees run down the mid-flanks, rills score the upper cone, and old flow fronts step the profile.
        const ca = (x - CONE.x) / (rc || 1), sa = (z - CONE.z) / (rc || 1);
        const t = rc / CONE.radius;
        const gully = 0.84 + 0.32 * ridge2(ca * 4.1 + 11, sa * 4.1 + rc * 0.018, 67, 3);
        let h = CONE.height * Math.pow(1 - t, 1.5) * gully;
        h += 9 * (ridge2(ca * 9 + rc * 0.01, sa * 9 - rc * 0.012, 73, 2) - 0.45) * Math.sin(Math.PI * Math.min(1, t * 1.15));
        h += 3 * (fbm2(x * 0.09, z * 0.09, 79, 3) - 0.5) * (1 - t);
        const st = 11;
        const stepped = Math.floor(h / st) * st + smooth(0.6, 1, (h / st) % 1) * st;
        h = h * 0.8 + stepped * 0.2;
        if (rc < CONE.crater) h -= (1 - (rc / CONE.crater) ** 2) * 34;
        else h = Math.max(0, h);
        floorY += h;
      }
      y = y * (1 - floorBlend) + floorY * floorBlend;
    }

    // 3. Outer caldera amphitheatre walls (south behind the rim, east/west flanks, far north rim).
    // Centered around the lava lake so the whole world sits inside one great volcanic caldera.
    const cx = 0, cz = -160;
    const dCal = Math.hypot(x - cx, z - cz);
    const nx = (x - cx) / (dCal || 1), nz = (z - cz) / (dCal || 1);
    const az = Math.atan2(x - cx, z - cz);
    const sunward = Math.max(0, nx * SUN_PLAN[0] + nz * SUN_PLAN[1]);

    // South wall rises behind z > 94; east/west walls rise past |x| > 108; far north wall rises past dCal > 360.
    const southRise = smooth(94, 340, z);
    const eastRise = smooth(104, 320, x);
    const westRise = smooth(-92, -320, x);
    const farRim = smooth(350, 620, dCal);
    const wallP = Math.max(southRise, eastRise * 0.9, westRise * 0.75, farRim);

    if (wallP > 0) {
      const H = 175 + 85 * fbm2(az * 2.2 + 3, 4.7, 43, 3) - 105 * sunward * sunward;
      let wall = H * Math.pow(wallP, 1.3);
      // Stepped lava-flow ledges in the caldera walls.
      const step = 20;
      const stepped = Math.floor(wall / step) * step + smooth(0.55, 1, (wall / step) % 1) * step;
      wall = wall * 0.52 + stepped * 0.48;
      wall += (ridge2(x * 0.017, z * 0.017, 47, 4) - 0.5) * 32 * wallP;
      y += wall;
    }

    return bankGalleries(x, z, y);
  }

  /**
   * GALLERIES CUT INTO THE CLIFF (realism pass, docs/plans/realism-ember.md). Every gallery but the turbine hall is
   * hollowed into the wall, so the cliff is banked up round its sides and back to just over its roof and only the
   * portal face shows; the ground runs on over the roof (`buriedRooms`, `terrain.js`). Only raises, only outside the
   * walk (inside a walk volume `height` never reads this), and never in front of the facade plane.
   */
  function bankGalleries(x, z, y) {
    for (const g of buried) {
      const r = g.rect;
      if (z < r.minZ - WALL_T + 0.02) continue;
      const dx = Math.max(r.minX - WALL_T - x, 0, x - r.maxX - WALL_T);
      const dz = Math.max(0, z - r.maxZ - WALL_T);
      const d = Math.hypot(dx, dz);
      if (d > 5) continue;
      const w = 1 - smooth(0.5, 5, d + (fbm2(x * 0.4, z * 0.4, 71, 2) - 0.5) * 1.2);
      if (g.cap > y) y += (g.cap - y) * w;
    }
    return y;
  }

  /** The ONE height field used by the terrain mesh, the walk, the landing solver and every check. */
  function height(x, z) {
    // 1. Inside any walk volume: exact flat or graded floor.
    const v = work.volumeAt(x, z);
    if (v) {
      let y = floorOf(v, x, z);
      if (v.id === 'yard-rim') {
        const dp = Math.hypot(x - PAD[0], z - PAD[1]);
        if (dp < PAD_R + 0.6) y += PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, dp));
      }
      return y;
    }
    // 2. Within EDGE of an open volume's perimeter: hold the volume's floor so the drop hides under the kerb/rail.
    for (const ov of openVols) {
      const r = ov.rect;
      if (x >= r.minX - EDGE && x <= r.maxX + EDGE && z >= r.minZ - EDGE && z <= r.maxZ + EDGE) {
        const cx = Math.max(r.minX, Math.min(r.maxX, x));
        const cz = Math.max(r.minZ, Math.min(r.maxZ, z));
        return floorOf(ov, cx, cz);
      }
    }
    // 3. Outside the walk: natural caldera wall, floor, lake, cone and outer rim.
    return landHeight(x, z);
  }

  /** The galleries the cliff is banked over (`bankGalleries`): id, rect, door span and the ground's height over the roof. */
  function buriedRooms() {
    return buried.map(g => ({ ...g, rect: { ...g.rect } }));
  }

  /** Rectangles cut out of the terrain mesh: every roofed room and its doorway passage. */
  function roomHoles() {
    return roofedVols.map(v => ({
      minX: v.rect.minX - 0.2,
      maxX: v.rect.maxX + 0.2,
      minZ: v.rect.minZ - 0.2,
      maxZ: v.rect.maxZ + 0.2
    }));
  }

  /** Cover mask boxes (`lib/cover.js`) for every roofed room and doorway (14 boxes <= 20 limit). */
  function coverSpec() {
    const boxes = roofedVols.map(v => ({
      id: v.id,
      min: [v.rect.minX - 0.15, v.floor.y0 - 0.3, v.rect.minZ - 0.15],
      max: [v.rect.maxX + 0.15, v.floor.y0 + (v.roof ?? 5.4) + 0.25, v.rect.maxZ + 0.15],
      sky: v.sky ?? 0.32
    }));
    // No direct sun openings needed because north portals face away from WSW sun;
    // the open-sided galleries keep 30-42% sky spill via `sky` and are lit by their pooled lamps.
    return { boxes, openings: [] };
  }

  /** Every railing / open viewing bay segment (`pass: false`), with floor elevation at both ends. */
  function railSegments() {
    const out = [];
    for (const b of work.barriers) {
      const v = work.byId.get(b.volume);
      if (!v) continue;
      // Avoid duplicating the shared `bay` rail between road and room: draw it on the room's north plane.
      if (b.opening.kind === 'bay' && v.kind !== 'room') continue;
      const ya = floorOf(v, b.ax, b.az);
      const yb = floorOf(v, b.bx, b.bz);
      out.push({ ...b, ya, yb, kind: b.opening.kind || 'rail' });
    }
    return out;
  }

  return {
    ...work,
    openVols,
    roofedVols,
    rooms: ROOMS,
    height,
    landHeight,
    roomHoles,
    buriedRooms,
    coverSpec,
    railSegments,
    PAD_TOP,
    PAD_R
  };
}
