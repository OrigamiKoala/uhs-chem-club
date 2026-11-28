/**
 * verdigris/fort-plan.js — The drowned fort in the reed swamp, as plain data and plain functions.
 *
 * NO THREE.JS HERE. The layout generator, the world, the walk, the guide and `verify:verdigris` all stand on this one
 * declaration, so what is walked is what is drawn and what is checked (`docs/plans/verdigris-world.md` section 8).
 *
 * THE FORT is a masonry enceinte (x -60 to 46, z -66 to 30; x east, z south) sunk in a reed swamp: its ward is flooded,
 * its curtain walls stand out of the water and are broken in places, and towers stand at its corners and on its north
 * wall. The swamp's water lies at `WATER`; the boardwalks that cross it are decks at `DECK`.
 *
 * THE WALK is a set of `lib/workings.js` volumes, closed on every side that is not a doorway:
 *   deck      a boardwalk: the landing stage, a run of planks, a junction, a ramp up to a tower door (graded), the
 *             bridge over the moat, the pump stage where the Leach is fought
 *   gate      the gatehouse's vaulted passage, a deck through it over the flooded gate channel (roofed)
 *   door      a passage through a wall into a room (roofed)
 *   stair     a vaulted stair going down from a deck into a cistern (roofed, graded)
 *   room      the room of one bench: a tower's chamber, a cistern, the gatehouse's winch chamber (roofed)
 *
 * The boardwalk branches and turns: no run of planks is longer than `MAX_RUN` before it meets a junction.
 *
 * THE HEIGHT FIELD is ONE function: inside a volume its floor; within `EDGE` of an open volume's closed side the same
 * floor (the step is hidden under the deck's fascia); everywhere else the land: the swamp's bed under the water, the
 * moat deeper, mud banks and reed beds just out of the water, and far off the low wooded rises round the swamp.
 * Nothing over the walk is walked: a tower's upper floors, a cistern's vault and the earth over it are bodies.
 */

import { makeWorkings, insideRect, floorOf } from '../lib/workings.js';

/** The walk stays in this square about the origin (the stage's bound for every Learn world). */
export const WALK = 100;

/** The deck's top, the water's surface, the swamp's bed and the moat's. */
export const DECK = 0;
export const WATER = -0.55;
export const BED = -1.6;
export const MOAT_BED = -2.6;
/** A boardwalk's width. */
export const WW = 3.2;
/** How far an open volume's floor runs past its closed sides (the step is hidden under the fascia there). */
export const EDGE = 0.3;
/** The passage through a wall: its width, and the lintel over it. */
export const DOOR = { w: 3.6, top: 3.2 };
/** How far in front of the back wall the plate stands. */
export const PLATE_FROM_BACK = 3.0;
/** The longest run of planks between two junctions. */
export const MAX_RUN = 22;

/** The fort's outer faces, and its curtain's thickness and height over the water. */
export const FORT = { minX: -60, maxX: 46, minZ: -66, maxZ: 30 };
export const CURTAIN_T = 3;
export const CURTAIN_TOP = 4.2;
/** The moat: a band of open water this wide outside the curtain. */
export const MOAT_W = 16;

export const SPAWN = [63, DECK + 1.6, 42];
export const SPAWN_LOOK = [54, DECK + 1.2, 45];
export const PAD = [77, 55];
/** The Leach's ground on the pump stage in the ward's north-east corner; the sump lies under the stage's north edge. */
export const ARENA = { boss: [32, 0, -50], player: [32, 1.6, -34] };

/**
 * THE ROOMS, one per bench, in bench order. `rect` is the room's floor; `level` its height; `top` the clear height over
 * the floor at the plate; `face` the way the plate looks (toward the door); `shell` how `terrain.js` builds the room:
 *   groin    the gatehouse's winch chamber: a groin vault on four corner piers
 *   joists   a tower's ground chamber: the timber floor of the storey above on two oak girders, the stilling well through it
 *   vault    a cistern: one barrel vault, an arcade along one side opening onto its twin cell, still full of water
 *   corbel   a tower's chamber roofed by stone courses corbelled in, a slab over the last course
 *   pillars  a cistern: a flat stone roof on a grid of squat pillars, salt-bloomed to the old water line
 *   hall     the keep's hall: tall walls, a timber roof on trusses, the dosing tank high on a steel frame at the back
 *   pointed  the water-gate tower's chamber: a pointed tunnel vault, the water channel beside it behind a grille
 *   arches   the great cistern: heavy transverse arches every few metres carrying a flat roof, a breach high in one wall
 * `wall` is the room's own wall thickness; `sky` how much of the sky's fill the cover mask leaves.
 */
export const ROOMS = [
  { id: 'room-1', site: 'site-1', rect: [16, 28.4, 26, 37.6], level: 0, top: 4.8, face: '-x', shell: 'groin', wall: 0.8, sky: 0.3 },
  { id: 'room-2', site: 'site-2', rect: [33.4, 46.6, 13.5, 26.5], level: 2.0, top: 4.6, face: '-x', shell: 'joists', wall: 1.4, sky: 0.3 },
  { id: 'room-3', site: 'site-3', rect: [-10.4, 3.2, 8.4, 20.4], level: -2.8, top: 4.6, face: '-z', shell: 'vault', wall: 0.8, sky: 0.28 },
  { id: 'room-4', site: 'site-4', rect: [-60.6, -47.4, 19.8, 31.8], level: 2.8, top: 5.0, face: '-z', shell: 'corbel', wall: 1.4, sky: 0.3 },
  { id: 'room-5', site: 'site-5', rect: [-44.4, -30.8, -45.6, -33.6], level: -2.0, top: 4.4, face: '+z', shell: 'pillars', wall: 0.8, sky: 0.28 },
  { id: 'room-6', site: 'site-6', rect: [6, 19.6, -34, -22], level: 4.4, top: 6.6, face: '-x', shell: 'hall', wall: 1.6, sky: 0.34 },
  { id: 'room-7', site: 'site-7', rect: [-14, -0.8, -69.6, -56.6], level: 1.2, top: 5.0, face: '+z', shell: 'pointed', wall: 1.4, sky: 0.3 },
  { id: 'room-8', site: 'site-8', rect: [-56.2, -42.2, -62, -50], level: -3.6, top: 4.6, face: '+x', shell: 'arches', wall: 0.8, sky: 0.28 }
];

/** The roof's thickness over a cistern, and the earth bank over it. */
export const VAULT_T = 0.5;

/* ================================================================== the walk */

const R = (minX, maxX, minZ, maxZ) => ({ minX, maxX, minZ, maxZ });
const r2 = n => Math.round(n * 100) / 100;

/**
 * Every volume, and the pairs that meet at a doorway. Openings are worked out from the pairs: two linked volumes
 * share a plane, and the doorway is the span they share on it.
 */
function declare() {
  const V = [];
  const flat = (id, kind, r, y, extra = {}) => V.push({ id, kind, rect: R(...r), floor: { y0: y }, ...extra });
  /** A graded volume: `ya` at the low end of `axis`, `yb` at the high end. */
  const graded = (id, kind, r, axis, ya, yb, extra = {}) => V.push({ id, kind, rect: R(...r), floor: { y0: ya, y1: yb, axis, from: axis === 'x' ? r[0] : r[2], to: axis === 'x' ? r[1] : r[3] }, ...extra });
  const L = [];
  const link = (...ids) => { for (let i = 0; i < ids.length - 1; i++) L.push([ids[i], ids[i + 1]]); };

  /* ---- outside the fort: the landing stage in the reeds, the boardwalk to the gate, the bridge over the moat. */
  flat('stage', 'deck', [58, 92, 34, 76], DECK);
  flat('w1', 'deck', [36.8, 58, 43.4, 46.6], DECK);
  flat('j1', 'deck', [33.6, 36.8, 43.4, 46.6], DECK);
  flat('w2', 'deck', [33.6, 36.8, 46.6, 54.4], DECK);
  flat('j2', 'deck', [33.6, 36.8, 54.4, 57.6], DECK);
  flat('w3', 'deck', [13.6, 33.6, 54.4, 57.6], DECK);
  flat('j3', 'deck', [10.4, 13.6, 54.4, 57.6], DECK);
  flat('bridge', 'deck', [10.4, 13.6, 40, 54.4], DECK);
  link('stage', 'w1', 'j1', 'w2', 'j2', 'w3', 'j3', 'bridge', 'gate');

  /* ---- the gatehouse: the vaulted passage over the flooded gate channel, and the winch chamber off it (bench 1). */
  flat('gate', 'gate', [10.4, 13.6, 24, 40], DECK, { roof: 5.4 });
  flat('door-1', 'door', [13.6, 16, 30, 33.6], DECK, { roof: DOOR.top });
  link('gate', 'door-1', 'room-1');

  /* ---- the ward: the landing at the gate's inner mouth; east to the corner tower (bench 2). */
  flat('j4', 'deck', [8.8, 15.2, 17.6, 24], DECK);
  link('gate', 'j4');
  flat('w4', 'deck', [15.2, 21.6, 18.4, 21.6], DECK);
  graded('ramp-2', 'deck', [21.6, 29.6, 18.4, 21.6], 'x', DECK, 2.0);
  flat('land-2', 'deck', [29.6, 32, 18.4, 21.6], 2.0);
  flat('door-2', 'door', [32, 33.4, 18.2, 21.8], 2.0, { roof: DOOR.top });
  link('j4', 'w4', 'ramp-2', 'land-2', 'door-2', 'room-2');

  /* ---- north up the trunk, west to the twin cistern's stair (bench 3). */
  flat('w5', 'deck', [10.4, 13.6, -2, 17.6], DECK);
  flat('j5', 'deck', [8.8, 15.2, -8.4, -2], DECK);
  flat('w6', 'deck', [-2, 8.8, -6.8, -3.6], DECK);
  flat('j6', 'deck', [-5.2, -2, -6.8, -3.6], DECK);
  graded('stair-3', 'stair', [-5.2, -2, -3.6, 8.4], 'z', DECK, -2.8, { roof: 3.0 });
  link('j4', 'w5', 'j5', 'w6', 'j6', 'stair-3', 'room-3');

  /* ---- west, then south and west again to the south-west tower (bench 4). */
  flat('w7', 'deck', [-20.4, -5.2, -6.8, -3.6], DECK);
  flat('j7', 'deck', [-23.6, -20.4, -9.2, -3.6], DECK);
  flat('w8', 'deck', [-36, -23.6, -9.2, -6], DECK);
  flat('j8', 'deck', [-39.2, -36, -9.2, -6], DECK);
  flat('w9', 'deck', [-39.2, -36, -6, 1.4], DECK);
  flat('j9', 'deck', [-39.2, -36, 1.4, 4.6], DECK);
  flat('w10', 'deck', [-52.4, -39.2, 1.4, 4.6], DECK);
  flat('j10', 'deck', [-55.6, -52.4, 1.4, 4.6], DECK);
  graded('ramp-4', 'deck', [-55.6, -52.4, 4.6, 16.8], 'z', DECK, 2.8);
  flat('land-4', 'deck', [-55.6, -52.4, 16.8, 18.4], 2.8);
  flat('door-4', 'door', [-55.8, -52.2, 18.4, 19.8], 2.8, { roof: DOOR.top });
  link('j6', 'w7', 'j7', 'w8', 'j8', 'w9', 'j9', 'w10', 'j10', 'ramp-4', 'land-4', 'door-4', 'room-4');

  /* ---- north from the west junction to the salt cistern's stair (bench 5). */
  flat('w11', 'deck', [-39.2, -36, -22.4, -9.2], DECK);
  flat('j11', 'deck', [-39.2, -36, -25.6, -22.4], DECK);
  graded('stair-5', 'stair', [-39.2, -36, -33.6, -25.6], 'z', -2.0, DECK, { roof: 3.0 });
  link('j8', 'w11', 'j11', 'stair-5', 'room-5');

  /* ---- east and up the keep's ramp to its hall (bench 6). */
  flat('w12', 'deck', [-36, -18.8, -25.6, -22.4], DECK);
  flat('j12', 'deck', [-18.8, -15.6, -29.6, -22.4], DECK);
  graded('ramp-6', 'deck', [-15.6, 2, -29.6, -26.4], 'x', DECK, 4.4);
  flat('land-6', 'deck', [2, 4.4, -29.6, -26.4], 4.4);
  flat('door-6', 'door', [4.4, 6, -29.8, -26.2], 4.4, { roof: DOOR.top });
  link('j11', 'w12', 'j12', 'ramp-6', 'land-6', 'door-6', 'room-6');

  /* ---- north from the keep's ramp foot, east along the north wall, up into the water-gate tower (bench 7). */
  flat('w13', 'deck', [-18.8, -15.6, -44.8, -29.6], DECK);
  flat('j13', 'deck', [-18.8, -15.6, -48, -44.8], DECK);
  flat('w14', 'deck', [-15.6, -9, -48, -44.8], DECK);
  flat('j14', 'deck', [-9, -5.8, -50.4, -44.8], DECK);
  graded('ramp-7', 'deck', [-9, -5.8, -55.2, -50.4], 'z', 1.2, DECK);
  flat('door-7', 'door', [-9.2, -5.6, -56.6, -55.2], 1.2, { roof: DOOR.top });
  link('j12', 'w13', 'j13', 'w14', 'j14', 'ramp-7', 'door-7', 'room-7');

  /* ---- back west along the north and down the great cistern's stair (bench 8). */
  flat('w15', 'deck', [-26, -18.8, -48, -44.8], DECK);
  flat('j15', 'deck', [-29.2, -26, -57.6, -44.8], DECK);
  graded('stair-8', 'stair', [-42.2, -29.2, -57.6, -54.4], 'x', -3.6, DECK, { roof: 3.0 });
  link('j13', 'w15', 'j15', 'stair-8', 'room-8');

  /* ---- east along the north to the pump stage, where the Leach is fought. */
  flat('w16', 'deck', [-5.8, 8, -48, -44.8], DECK);
  flat('j16', 'deck', [8, 11.2, -48, -40.4], DECK);
  flat('w17', 'deck', [11.2, 22.4, -43.6, -40.4], DECK);
  flat('pump', 'deck', [22.4, 42, -62, -28], DECK);
  link('j14', 'w16', 'j16', 'w17', 'pump');

  /* ---- the rooms. */
  for (const r of ROOMS) V.push({ id: r.id, kind: 'room', rect: R(...r.rect), floor: { y0: r.level }, roof: r.top, room: r });
  return { V, L };
}

/** The side of `a` that `b` meets, and the span they share on it, or null when they do not touch. */
function meeting(a, b) {
  const A = a.rect, B = b.rect, eq = (p, q) => Math.abs(p - q) < 1e-6;
  const span = (lo1, hi1, lo2, hi2) => [Math.max(lo1, lo2), Math.min(hi1, hi2)];
  let side = null, s = null;
  if (eq(A.maxX, B.minX)) { side = 'maxX'; s = span(A.minZ, A.maxZ, B.minZ, B.maxZ); }
  else if (eq(A.minX, B.maxX)) { side = 'minX'; s = span(A.minZ, A.maxZ, B.minZ, B.maxZ); }
  else if (eq(A.maxZ, B.minZ)) { side = 'maxZ'; s = span(A.minX, A.maxX, B.minX, B.maxX); }
  else if (eq(A.minZ, B.maxZ)) { side = 'minZ'; s = span(A.minX, A.maxX, B.minX, B.maxX); }
  if (!side || s[1] - s[0] < 1) return null;
  return { side, lo: r2(s[0]), hi: r2(s[1]) };
}
const OPPOSITE = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' };

/** The volumes with their openings, and anything wrong with the declaration. */
function buildVolumes() {
  const { V, L } = declare();
  const byId = new Map(V.map(v => [v.id, { ...v, openings: [] }]));
  const errors = [];
  for (const [a, b] of L) {
    const A = byId.get(a), B = byId.get(b);
    if (!A || !B) { errors.push(`link ${a} - ${b}: no such volume`); continue; }
    const m = meeting(A, B);
    if (!m) { errors.push(`link ${a} - ${b}: the two do not share a wall`); continue; }
    A.openings.push({ side: m.side, lo: m.lo, hi: m.hi, to: b });
    B.openings.push({ side: OPPOSITE[m.side], lo: m.lo, hi: m.hi, to: a });
  }
  return { volumes: [...byId.values()], links: L, errors };
}

/* ================================================================== the land */

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z, n = 4) {
  let s = 0, a = 0.5;
  for (let i = 0; i < n; i++) { s += a * vnoise(x, z); x = x * 2.03 + 7.1; z = z * 2.03 - 3.3; a *= 0.5; }
  return s;
}

/** How far (m) a point lies outside the fort's outer faces (negative inside). */
export function fortDistance(x, z) {
  const dx = Math.max(FORT.minX - x, x - FORT.maxX), dz = Math.max(FORT.minZ - z, z - FORT.maxZ);
  if (dx <= 0 && dz <= 0) return Math.max(dx, dz);
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0));
}

/**
 * How much reed bed a point of open swamp carries, 0 to 1: patches of reed between the boardwalks outside the moat and
 * in the ward's shallows, none in the moat itself. `world` (not the walk) decides what stands on them.
 */
export function reediness(x, z) {
  const d = fortDistance(x, z);
  const moat = d > 0 && d < MOAT_W ? 1 - smooth(MOAT_W - 4, MOAT_W, d) : 0;
  const patch = smooth(0.42, 0.62, fbm(x * 0.045 + 3, z * 0.045 - 7));
  return Math.max(0, patch * (1 - moat) * (1 - smooth(260, 420, Math.hypot(x, z))));
}

/** The land with no walk on it: the swamp's bed, the moat, mud banks with reeds, and the wooded rises far off. */
export function land(x, z) {
  const d = fortDistance(x, z);
  const n = fbm(x * 0.02, z * 0.02);
  let y = BED + (n - 0.5) * 0.5;
  // The moat outside the curtain runs deeper; the ward inside is the old flagged floor, drowned.
  if (d > 0 && d < MOAT_W + 4) y = Math.min(y, MOAT_BED + smooth(MOAT_W - 3, MOAT_W + 4, d) * (BED - MOAT_BED));
  if (d <= 0) y = BED + 0.2;
  // Mud banks: where the reeds grow the bed rises to a hand under the water, and here and there out of it.
  const reed = reediness(x, z);
  y += reed * (WATER - 0.12 - y) + smooth(0.75, 1, fbm(x * 0.11 - 4, z * 0.11 + 9)) * reed * 0.35;
  // Far off the swamp ends at low wooded rises, highest to the north and east.
  const far = Math.hypot(x, z);
  if (far > 300) y += smooth(300, 620, far) * (14 + fbm(x * 0.006, z * 0.006) * 36) * (0.75 + 0.25 * Math.sin(Math.atan2(z, x) * 2 + 1));
  return y;
}

/* ================================================================== the plan */

export function makeFortPlan() {
  const { volumes: list, links, errors } = buildVolumes();
  const work = makeWorkings(list, { openKinds: ['deck'], roof: 4.4, wallInner: 0.3, wallDepth: 0.6, jamb: 0.5 });
  const { volumes, byId } = work;
  const openVols = volumes.filter(v => v.kind === 'deck');
  const roofed = volumes.filter(v => v.kind !== 'deck');
  const rooms = ROOMS.map(r => {
    const vol = byId.get(r.id);
    const door = vol.openings.length ? byId.get(vol.openings[0].to) : null;
    return { ...r, vol, door, opening: vol.openings[0] };
  });
  const roomById = new Map(rooms.map(r => [r.id, r]));

  /** An open volume whose floor runs out under (x, z): inside it, or within `EDGE` of one of its closed sides. */
  function edgeVolume(x, z) {
    for (const v of openVols) {
      const r = v.rect;
      if (x < r.minX - EDGE || x > r.maxX + EDGE || z < r.minZ - EDGE || z > r.maxZ + EDGE) continue;
      return v;
    }
    return null;
  }

  /** THE HEIGHT FIELD. */
  function height(x, z) {
    const v = work.volumeAt(x, z);
    if (v) return floorOf(v, x, z);
    const e = edgeVolume(x, z);
    if (e) return floorOf(e, Math.min(e.rect.maxX, Math.max(e.rect.minX, x)), Math.min(e.rect.maxZ, Math.max(e.rect.minZ, z)));
    return land(x, z);
  }

  /** The volume of the walk (x, z) stands in; the ground mesh is a hole there (every floor of the walk is built). */
  const inWalk = (x, z) => work.volumeAt(x, z);

  /** The walls of every volume, and their colliders. */
  const colliders = () => work.wallColliders();

  /** The lines the ground mesh must have a vertex row on, so a hole's edge is straight. */
  function breaks() {
    const xs = new Set(), zs = new Set();
    for (const v of volumes) {
      const r = v.rect;
      for (const x of [r.minX, r.maxX]) xs.add(x);
      for (const z of [r.minZ, r.maxZ]) zs.add(z);
    }
    for (const s of structures()) { xs.add(s.rect[0]); xs.add(s.rect[1]); zs.add(s.rect[2]); zs.add(s.rect[3]); }
    return { xs: [...xs], zs: [...zs] };
  }

  /* ------------------------------------------------------------ the masonry masses */

  /**
   * THE STRUCTURES: the masses of masonry the fort is made of, each a rectangle `[x0, x1, z0, z1]` with a top. The water
   * is cut away over every one, and nothing of the reed beds stands on them.
   *   tower      a tower round a room (its walls `room.wall` thick), with its storeys above
   *   cistern    the masonry head of a cistern, standing out of the water, earth and grass over its vault
   *   gatehouse  the gatehouse round the gate passage and the winch chamber
   *   keep       the keep's plinth and the keep on it
   *   curtain    a length of curtain wall (`breach` lengths are broken down near the water)
   */
  let structCache = null;
  function structures() {
    if (structCache) return structCache;
    const out = [];
    const grow = (r, t) => [r[0] - t, r[1] + t, r[2] - t, r[3] + t];
    const room = id => ROOMS.find(r => r.id === id);
    const v = id => byId.get(id).rect;
    const rr = x => [x.minX, x.maxX, x.minZ, x.maxZ];
    // The gatehouse: two towers either side of the passage, the winch chamber in the east one.
    out.push({ id: 'gatehouse', kind: 'gatehouse', rect: [-4, 30, 24, 40], top: 11.5 });
    // The corner tower over room 2, the south-west tower over room 4, the water-gate tower over room 7.
    for (const id of ['room-2', 'room-4', 'room-7']) {
      const r = room(id);
      out.push({ id: `tower-${id.slice(5)}`, kind: 'tower', room: id, rect: grow(r.rect, r.wall), top: r.level + r.top + (id === 'room-2' ? 9.5 : id === 'room-4' ? 7.5 : 8.5) });
    }
    // The keep on its plinth: the plinth carries the landing; the keep's walls rise round the hall.
    {
      const r = room('room-6');
      out.push({ id: 'keep', kind: 'keep', room: 'room-6', rect: grow(r.rect, r.wall), top: r.level + r.top + 6.5 });
      out.push({ id: 'keep-plinth', kind: 'plinth', rect: [2, 22, -37, -19], top: r.level });
    }
    // The cistern heads: the room (and the twin cell, for room 3) and the stair, in one block of masonry.
    for (const [id, stair, extra] of [['room-3', 'stair-3', [-24.6, -11.2, 8.4, 20.4]], ['room-5', 'stair-5', null], ['room-8', 'stair-8', null]]) {
      const r = room(id), s = v(stair);
      const body = grow(r.rect, r.wall);
      // The stair's walls stand on its sides and its far end; its head opens onto the deck and is not walled.
      const head = byId.get(stair).openings.find(o => o.to !== id).side;
      const st = [s.minX - (head === 'minX' ? 0 : 0.8), s.maxX + (head === 'maxX' ? 0 : 0.8), s.minZ - (head === 'minZ' ? 0 : 0.8), s.maxZ + (head === 'maxZ' ? 0 : 0.8)];
      const parts = [body, st];
      if (extra) parts.push(grow(extra, r.wall));
      const box = [Math.min(...parts.map(p => p[0])), Math.max(...parts.map(p => p[1])), Math.min(...parts.map(p => p[2])), Math.max(...parts.map(p => p[3]))];
      // The head stands at least high enough to roof the stair's head (3 m over the deck) under its earth.
      out.push({ id: `cistern-${id.slice(5)}`, kind: 'cistern', room: id, stair, parts, twin: extra, rect: box, top: Math.max(r.level + r.top + VAULT_T + 0.6, DECK + 3.9) });
    }
    // The curtain: four walls round the ward, with the gatehouse and the towers standing in them.
    const T = CURTAIN_T, F = FORT;
    out.push({ id: 'curtain-s', kind: 'curtain', rect: [F.minX, F.maxX, F.maxZ - T, F.maxZ], top: CURTAIN_TOP, breach: [[-30, -14]] });
    out.push({ id: 'curtain-n', kind: 'curtain', rect: [F.minX, F.maxX, F.minZ, F.minZ + T], top: CURTAIN_TOP, breach: [[16, 30]] });
    out.push({ id: 'curtain-w', kind: 'curtain', rect: [F.minX, F.minX + T, F.minZ, F.maxZ], top: CURTAIN_TOP, breach: [[-24, -10]] });
    out.push({ id: 'curtain-e', kind: 'curtain', rect: [F.maxX - T, F.maxX, F.minZ, F.maxZ], top: CURTAIN_TOP, breach: [[-16, -2]] });
    void rr;
    structCache = out;
    return out;
  }

  /** The structure a point stands in (by its rectangle, and for a cistern by its parts), or null. */
  function structureAt(x, z) {
    for (const s of structures()) {
      const [a, b, c, d] = s.rect;
      if (x < a || x > b || z < c || z > d) continue;
      if (s.parts && !s.parts.some(p => x >= p[0] && x <= p[1] && z >= p[2] && z <= p[3])) continue;
      return s;
    }
    return null;
  }

  /* ------------------------------------------------------------ the cover */

  /**
   * THE COVER: every room, door, stair and the gate passage is roofed (the sun and most of the sky taken out). A door that
   * faces the sun and opens onto an open deck lets it onto the floor just inside; the twin cell beside room 3 is covered too.
   */
  function coverSpec(sun = [-0.8, 0.3, 0.5]) {
    const boxes = [];
    for (const v of roofed) {
      const r = v.rect;
      const [lo, hi] = v.floor.y1 === undefined ? [v.floor.y0, v.floor.y0] : [Math.min(v.floor.y0, v.floor.y1), Math.max(v.floor.y0, v.floor.y1)];
      const top = v.kind === 'room' ? v.room.top + (v.room.shell === 'hall' ? 2.4 : 0.2) : (v.roof ?? 3);
      const sky = v.kind === 'room' ? v.room.sky : v.kind === 'gate' ? 0.4 : 0.36;
      boxes.push({ id: v.id, min: [r.minX - 0.05, lo - 0.3, r.minZ - 0.05], max: [r.maxX + 0.05, hi + top + 0.3, r.maxZ + 0.05], sky });
    }
    const twin = structures().find(s => s.twin);
    if (twin) {
      const t = twin.twin, lv = ROOMS.find(r => r.id === twin.room).level;
      boxes.push({ id: 'twin-cell', min: [t[0] - 0.05, lv - 2.3, t[2] - 0.05], max: [t[1] + 0.05, lv + 4.9, t[3] + 0.05], sky: 0.25 });
    }
    // The sun comes in at a room's door only where the door faces it.
    const openings = [];
    const len = Math.hypot(...sun), s = sun.map(c => c / len);
    for (const r of rooms) {
      const o = r.opening, v = r.vol.rect, lo = r.level;
      // Only a door that opens onto an open deck: a stair's foot or a door off the gate passage is under a roof itself.
      const door = byId.get(o.to);
      if (door.kind !== 'door' || !door.openings.some(q => q.to !== r.id && byId.get(q.to)?.kind === 'deck')) continue;
      const out = { minX: [-1, 0], maxX: [1, 0], minZ: [0, -1], maxZ: [0, 1] }[o.side];
      if (out[0] * s[0] + out[1] * s[2] < 0.3) continue;
      const axis = o.side.endsWith('X') ? 'x' : 'z';
      const at = { minX: v.minX, maxX: v.maxX, minZ: v.minZ, maxZ: v.maxZ }[o.side];
      const into = -(out[0] + out[1]);
      const reach = axis === 'x'
        ? { min: [Math.min(at - 0.5 * into, at + 2.5 * into), lo - 0.3, v.minZ], max: [Math.max(at - 0.5 * into, at + 2.5 * into), lo + DOOR.top + 0.5, v.maxZ] }
        : { min: [v.minX, lo - 0.3, Math.min(at - 0.5 * into, at + 2.5 * into)], max: [v.maxX, lo + DOOR.top + 0.5, Math.max(at - 0.5 * into, at + 2.5 * into)] };
      openings.push(axis === 'x'
        ? { id: `${r.id}-door`, axis, at, lo: [lo, o.lo], hi: [lo + DOOR.top, o.hi], reach }
        : { id: `${r.id}-door`, axis, at, lo: [o.lo, lo], hi: [o.hi, lo + DOOR.top], reach });
    }
    return { boxes, openings };
  }

  /* ------------------------------------------------------------ the way */

  /** Every doorway's middle, keyed by position: which axis its plane is square to. */
  const doorAxis = new Map();
  for (const v of volumes) for (const o of v.openings) {
    const [x, z] = work.doorPoint(v, o);
    doorAxis.set(`${r2(x)},${r2(z)}`, o.side.endsWith('X') ? 'x' : 'z');
  }

  /**
   * The way on foot from (fx, fz) to (tx, tz), door by door through the boardwalk. Every doorway is passed SQUARE: a point
   * is added on each side of it, a metre out (or half the volume's depth, if that is less), so the way never cuts a jamb.
   * The guide follows it.
   */
  function routeTo(fx, fz, tx, tz) {
    const raw = work.routeTo(fx, fz, tx, tz);
    const pts = [raw[0]];
    for (let i = 1; i < raw.length - 1; i++) {
      const p = raw[i], ax = doorAxis.get(`${r2(p[0])},${r2(p[1])}`);
      if (!ax) { pts.push(p); continue; }
      const k = ax === 'x' ? 0 : 1;
      const prev = raw[i - 1], next = raw[i + 1];
      const dir = Math.sign(next[k] - prev[k]) || 1;
      const reach = (q) => {
        const v = work.volumeAt(q[0], q[1]);
        if (!v) return 1;
        const lo = k === 0 ? v.rect.minX : v.rect.minZ, hi = k === 0 ? v.rect.maxX : v.rect.maxZ;
        return Math.min(1, (hi - lo) / 2);
      };
      const before = [...p], after = [...p];
      before[k] = p[k] - dir * 0.01; after[k] = p[k] + dir * 0.01;
      const b = [...p], a = [...p];
      b[k] = p[k] - dir * reach(before);
      a[k] = p[k] + dir * reach(after);
      pts.push(b, p, a);
    }
    pts.push(raw[raw.length - 1]);
    return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.01);
  }

  /** The plan's own consistency. */
  function problems() {
    const out = [...errors];
    for (const r of rooms) {
      const v = r.vol.rect;
      const across = r.face.endsWith('x') ? v.maxZ - v.minZ : v.maxX - v.minX;
      const deep = r.face.endsWith('x') ? v.maxX - v.minX : v.maxZ - v.minZ;
      if (across < 11.2 || deep < 11 || r.top < 4.4) out.push(`${r.id}: ${across} x ${deep} m with ${r.top} m over the floor, under 11.2 x 11 x 4.4`);
      if (r.vol.openings.length !== 1) out.push(`${r.id}: ${r.vol.openings.length} doors (a room has one)`);
      const want = { '-x': 'minX', '+x': 'maxX', '-z': 'minZ', '+z': 'maxZ' }[r.face];
      if (r.opening && r.opening.side !== want) out.push(`${r.id}: its door is on ${r.opening.side}, but its plate faces ${r.face}`);
      // The door stands across the middle of the room, so the plate (in the middle) faces it.
      if (r.opening) {
        const mid = r.face.endsWith('x') ? (v.minZ + v.maxZ) / 2 : (v.minX + v.maxX) / 2;
        if (Math.abs((r.opening.lo + r.opening.hi) / 2 - mid) > 0.05) out.push(`${r.id}: its door is not across the middle of the room`);
      }
    }
    // No two volumes overlap.
    for (let i = 0; i < volumes.length; i++) for (let j = i + 1; j < volumes.length; j++) {
      const a = volumes[i].rect, b = volumes[j].rect;
      if (a.minX < b.maxX - 1e-6 && b.minX < a.maxX - 1e-6 && a.minZ < b.maxZ - 1e-6 && b.minZ < a.maxZ - 1e-6) out.push(`${volumes[i].id} and ${volumes[j].id} overlap`);
    }
    // No run of planks is longer than MAX_RUN.
    for (const v of openVols) {
      if (v.id === 'stage' || v.id === 'pump') continue;
      const r = v.rect, run = Math.max(r.maxX - r.minX, r.maxZ - r.minZ);
      if (run > MAX_RUN + 1e-6) out.push(`${v.id}: a straight run of ${run.toFixed(1)} m`);
    }
    // No volume of the walk stands inside a structure it does not belong to; no structure stands in another.
    const S = structures();
    const own = (v, s) => (s.room && (v.id === s.room || v.id === s.stair || (s.room && byId.get(s.room)?.openings.some(o => o.to === v.id))))
      || (s.kind === 'gatehouse' && ['gate', 'door-1', 'room-1'].includes(v.id))
      || (s.kind === 'plinth' && ['land-6', 'door-6', 'room-6'].includes(v.id));
    for (const v of volumes) for (const s of S) {
      if (s.kind === 'curtain') continue;
      const r = v.rect;
      const hit = (s.parts || [s.rect]).some(p => r.minX < p[1] - 1e-6 && r.maxX > p[0] + 1e-6 && r.minZ < p[3] - 1e-6 && r.maxZ > p[2] + 1e-6);
      if (hit && !own(v, s)) out.push(`${v.id} runs into ${s.id}`);
    }
    for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
      const a = S[i], b = S[j];
      if (a.kind === 'curtain' || b.kind === 'curtain') continue;
      if ((a.kind === 'keep' && b.kind === 'plinth') || (b.kind === 'keep' && a.kind === 'plinth')) continue;
      const A = a.parts || [a.rect], B = b.parts || [b.rect];
      if (A.some(p => B.some(q => p[0] < q[1] && q[0] < p[1] && p[2] < q[3] && q[2] < p[3]))) out.push(`${a.id} and ${b.id} overlap`);
    }
    for (const v of volumes) {
      const r = v.rect;
      if (Math.abs(r.minX) > WALK - 4 || Math.abs(r.maxX) > WALK - 4 || Math.abs(r.minZ) > WALK - 4 || Math.abs(r.maxZ) > WALK - 4) out.push(`${v.id} reaches outside the walk's square`);
    }
    return out;
  }

  const b = volumes.reduce((a, v) => ({ minX: Math.min(a.minX, v.rect.minX), maxX: Math.max(a.maxX, v.rect.maxX), minZ: Math.min(a.minZ, v.rect.minZ), maxZ: Math.max(a.maxZ, v.rect.maxZ) }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });

  return {
    work, volumes, byId, links, rooms, roomById, roofed, openVols, bounds: b,
    height, land, inWalk, colliders, breaks, structures, structureAt, coverSpec, routeTo, problems,
    volumeAt: (x, z) => work.volumeAt(x, z)
  };
}

export { insideRect };
