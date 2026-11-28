/**
 * teeter/stations.js — The eight hosts: what the works keep in each room under the terraces, and the bench built into it.
 *
 * A bench on Teeter stands in a ROOM dug into a terrace wall (`terrace-plan.js`): the wall is its front, a pan of brine
 * its roof (or, in a weir house, a timber roof standing up among the pans). The room's shell (floor, walls, roof) is the
 * terraces' (`terrain.js`). The HOST is what stands in it and its bench, as ONE object: so the overlap rule (which exempts a
 * body's own parts) lets the bench be bolted to the thing it belongs to, and the bay contract (`bench-bay.js`) keeps the
 * volume the plate, the instrument, the screens and the camera need empty of it.
 *
 *   1 sluice chamber    the culvert across the back wall with a gate at each end on a handwheel; a brine gauge
 *   2 weigh house       a platform scale on its pit, a steelyard on the back wall, sacks on pallets
 *   3 gauge chamber     a tilting trough on a pivot over a catch basin, a graduated gauge post
 *   4 tally room        walls of pigeonholes, a sorting table, crates of tallies
 *   5 ledger house      a sloped clerk's desk, a column board, shelves of record books
 *   6 pump chamber      the pump barrel under the shaft, worked by the beam pump on the terrace above; the brine main
 *   7 settling cistern  a sunk settling tank crusted with salt, a cone-bottomed tank on legs, drums of reagent
 *   8 plotting room     a gridded board on the back wall, a drafting table, a rack of rolled charts
 *
 * THE HOST FRAME. Origin on the room's floor under the middle of the plate; +z toward the door (and the player), +x to the
 * player's right. Every builder is given its room in that frame (`h.room`: `x0, x1, z0, z1` with the walls' colliders taken
 * off, `top` the clear height at the plate, `topAt(x, z)` the underside of the roof over a point). Machinery stands to the
 * sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m; `verify:bench` measures all of it and `verify:teeter`
 * measures that no host leaves its room or reaches through its roof.
 *
 * ONLY LAMPS ARE LIT. A host hangs its room's lamps (`lampMark`s the world pools); nothing here owns a PointLight.
 * NO SIGN STANDS ON THE TERRACES. Nothing here carries lettering.
 *
 * @returns {{ group, bench, benchLocal, colliders, movers }} `colliders` are host-local discs `{ lx, lz, r }` and boxes
 *   `{ lx, lz, hw, hd }`; the world turns them to its own frame. `movers` have `update(t)`.
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { HOST_PLAN, hostExtent, toHost } from './host-plan.js';
import { ROOMS, FACE, WALL_T, LEVEL, shaftOf } from './terrace-plan.js';
import { kitFor } from '../kettle/kit.js';
import { PUMP_GLAND } from './plant.js';

/* ----------------------------------------------------------------- the bench */

/** The bench: the shared bay bench in the host's skin, dressed in the pans' weathered steel, its cased instrument for `kind`. */
export function buildTtBench(ctx, { kind = 'pan', plate = 'TTR-01', skin = 'deck' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin, plate,
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.timber },
    tagStyle: { fg: '#1e1a14', bg: '#dcd8c8' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.13, 22), M.glassDark, -0.62, height + 0.42, 0.072);
      if (kind === 'pan') {
        add(new THREE.BoxGeometry(0.9, 0.05, 0.5), M.timber, 0.6, y0 + 0.025, 0.1);
        add(new THREE.BoxGeometry(0.8, 0.02, 0.4), M.brine, 0.6, y0 + 0.055, 0.1);
        for (const x of [0.25, 0.4]) add(new THREE.CylinderGeometry(0.06, 0.05, 0.05, 16), x < 0.3 ? M.paint2 : M.paintBlue, x, y0 + 0.025, 0.4);
      } else if (kind === 'scale') {
        add(new THREE.BoxGeometry(0.6, 0.06, 0.4), M.caseDark, 0.6, y0 + 0.03, 0.1);
        add(new THREE.BoxGeometry(0.5, 0.03, 0.32), M.brass, 0.6, y0 + 0.075, 0.1);
        add(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 18), M.paint2, 0.9, y0 + 0.18, -0.05, [Math.PI / 2, 0, 0]);
      } else if (kind === 'gauge') {
        add(new THREE.BoxGeometry(0.16, 0.12, 0.16), M.caseDark, 0.6, y0 + 0.06, 0.1);
        add(new THREE.BoxGeometry(0.9, 0.04, 0.3), M.brass, 0.6, y0 + 0.14, 0.1, [0, 0, 0.12]);
      } else if (kind === 'cards') {
        add(new THREE.BoxGeometry(0.7, 0.04, 0.2), M.caseDark, 0.6, y0 + 0.02, 0.12);
        for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.12, 0.18, 0.015), k % 2 ? M.paint2 : M.paintYellow, 0.4 + k * 0.14, y0 + 0.13, 0.12, [-0.2, 0, 0]);
      } else if (kind === 'ledger') {
        add(new THREE.BoxGeometry(0.6, 0.05, 0.4), M.caseDark, 0.6, y0 + 0.1, 0.1, [-0.2, 0, 0]);
        add(new THREE.BoxGeometry(0.28, 0.02, 0.36), M.paint2, 0.45, y0 + 0.14, 0.1, [-0.2, 0, 0]);
        add(new THREE.BoxGeometry(0.28, 0.02, 0.36), M.paint2, 0.75, y0 + 0.14, 0.1, [-0.2, 0, 0]);
      } else if (kind === 'beam') {
        add(new THREE.CylinderGeometry(0.02, 0.03, 0.34, 8), M.caseDark, 0.6, y0 + 0.17, 0.1);
        add(new THREE.BoxGeometry(0.8, 0.025, 0.04), M.brass, 0.6, y0 + 0.35, 0.1, [0, 0, 0.1]);
      } else if (kind === 'dish') {
        add(new THREE.CylinderGeometry(0.2, 0.15, 0.08, 20), M.paint2, 0.6, y0 + 0.04, 0.1);
        add(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), M.saltWhite, 0.6, y0 + 0.085, 0.1);
      } else {
        add(new THREE.BoxGeometry(0.7, 0.4, 0.03), M.caseDark, 0.6, y0 + 0.24, 0.04, [-0.3, 0, 0]);
        for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.16, 0.03, 0.02), M.paint2, 0.4 + k * 0.2, y0 + 0.2 + k * 0.05, 0.07, [-0.3, 0, 0]);
      }
    }
  });
}

/* --------------------------------------------------------------- start and finish */

/** A room's lamp: hung from the roof on a rod. */
const ROOM_LAMP = { intensity: 9, distance: 12 };

/** The underside of a room's roof over a host-frame point, as a height over the floor. */
function roofUnder(room, plan, lx, lz) {
  const r = room;
  const minX = FACE[r.wall] + WALL_T, maxX = minX + r.depth;
  // Host frame to world: x = px - lz, z = pz + lx (every room faces west).
  const x = plan.pos[0] - lz, z = plan.pos[1] + lx;
  const midZ = (r.z[0] + r.z[1]) / 2, midX = (minX + maxX) / 2;
  if (r.shell === 'vaultX' || r.shell === 'vaultZ') {
    const half = r.shell === 'vaultX' ? (r.z[1] - r.z[0]) / 2 : r.depth / 2;
    const rise = r.top - 3.6, R = (half * half + rise * rise) / (2 * rise);
    const off = r.shell === 'vaultX' ? z - midZ : x - midX;
    return r.top - (R - Math.sqrt(Math.max(0, R * R - off * off)));
  }
  if (r.shell === 'joists') return Math.abs(z - (midZ - 3.5)) < 0.3 || Math.abs(z - (midZ + 3.5)) < 0.3 ? r.top - 0.42 : r.top;
  if (r.shell === 'gable' || r.shell === 'mono') return r.top - 0.3;
  if (r.shaft) { const s = shaftOf(r); if (Math.abs(x - s.cx) < s.size / 2 && Math.abs(z - s.cz) < s.size / 2) return Infinity; }
  return r.top;
}

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const room = ROOMS.find(r => r.id === plan.room);
  const g = new THREE.Group();
  g.name = name;
  const bench = buildTtBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  const [x0, x1, z0, z1] = hostExtent(plan);
  const topAt = (lx, lz) => roofUnder(room, plan, lx, lz);
  const doorZ = (() => { const d = w.plan.byId.get(`door-${room.id.slice(5)}`).rect; return toHost(plan, d.maxX, (d.minZ + d.maxZ) / 2); })();
  const box = { x0, x1, z0, z1, top: room.top, topAt, door: doorZ, room };
  const colliders = [{ lx: 0, lz: 0, hw: 2.4, hd: 0.65 }];
  const movers = [];
  /** Hang a lamp from the roof at (x, z), `y` over the floor. */
  const hang = (x, z, y = 3.5, opts = ROOM_LAMP) => k.pendant(g, x, y, z, Math.min(topAt(x, z), 9) - 0.05, opts);
  const solid = (lx, lz, hw, hd) => colliders.push({ lx, lz, hw, hd });
  const round = (lx, lz, r) => colliders.push({ lx, lz, r });
  return { k, M: w.M, g, bench, colliders, movers, room: box, hang, solid, round, w, plan, level: LEVEL[room.wall] };
}

/** The lamp over the plate, one by the door, and the host handed back. */
const finish = (h, y = 3.5) => {
  h.hang(0, -0.3, y);
  h.hang(0, h.room.z1 - 2.2, Math.min(3.3, h.room.topAt(0, h.room.z1 - 2.2) - 0.6));
  return { group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders, movers: h.movers };
};

/* ------------------------------------------------------------------------ shared pieces */

/** A drum standing on its end, with its two rolling hoops. */
const drum = (h, x, z, mat, y = 0) => {
  h.k.cyl(h.g, [0.29, 0.29, 0.88, 16], mat, [x, y + 0.44, z]);
  for (const dy of [0.28, 0.6]) h.k.cyl(h.g, [0.3, 0.3, 0.03, 16], h.M.darkSteel, [x, y + dy, z], null, false);
};

/** A pallet of sacks, stacked crosswise in `rows`. */
function sacks(h, x, z, rows = 4) {
  const { k, g, M } = h;
  k.box(g, [1.6, 0.14, 1.2], M.timber, [x, 0.07, z]);
  for (let r = 0; r < rows; r++) for (let i = 0; i < 2; i++) {
    const turned = r % 2;
    k.box(g, turned ? [0.72, 0.2, 0.5] : [0.5, 0.2, 0.72], M.sack, [x + (turned ? 0 : -0.36 + i * 0.72), 0.25 + r * 0.2, z + (turned ? -0.27 + i * 0.54 : 0)]);
  }
  h.solid(x, z, 0.8, 0.6);
}

/** A handwheel on a spindle, facing along `axis` ('x' or 'z'). */
function handwheel(h, x, y, z, axis = 'z', r = 0.28) {
  const { k, g, M } = h;
  const rot = axis === 'z' ? null : [0, Math.PI / 2, 0];
  const ring = new THREE.Mesh(h.w.own(new THREE.TorusGeometry(r, 0.025, 8, 24)), M.darkSteel);
  ring.position.set(x, y, z);
  if (rot) ring.rotation.set(...rot);
  g.add(ring);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI / 3;
    const sp = k.box(g, [2 * r, 0.025, 0.025], M.darkSteel, [x, y, z], null, false);
    if (axis === 'z') sp.rotation.z = a; else { sp.rotation.y = Math.PI / 2; sp.rotation.x = a; }
  }
}

/** A shelf rack along z against a side wall: uprights, shelves, and `load(x, y, z, bay)` on each bay of each shelf. */
function rackAlongZ(h, x, z0, z1, { depth = 0.7, top = 2.6, shelves = [0.45, 1.15, 1.85, 2.55], bay = 1.6, load = null } = {}) {
  const { k, g, M } = h;
  const n = Math.max(1, Math.round((z1 - z0) / bay));
  const step = (z1 - z0) / n;
  for (let i = 0; i <= n; i++) for (const dx of [-depth / 2 + 0.04, depth / 2 - 0.04]) k.box(g, [0.06, top, 0.06], M.timberDark, [x + dx, top / 2, z0 + i * step]);
  for (const y of shelves) {
    k.box(g, [depth, 0.04, z1 - z0], M.timber, [x, y, (z0 + z1) / 2]);
    if (load) for (let i = 0; i < n; i++) load(x, y + 0.02, z0 + (i + 0.5) * step, step);
  }
  h.solid(x, (z0 + z1) / 2, depth / 2, (z1 - z0) / 2);
}

/* ------------------------------------------------------------------------ the hosts */

/**
 * 1 THE SLUICE CHAMBER. Brine is let from the pan above to the pan below, and back: the culvert crosses the room high
 * behind the plate, a gate at each end on its handwheel; the left trough runs down to the door, the right pipe and hand
 * pump lift it back. A sight glass shows the level.
 */
function sluiceChamber(w) {
  const h = start(w, 'site-1', 'host-sluice-chamber');
  const { k, g, M, room } = h;
  const X = room.x1;
  // The culvert: a stone trough on two piers, high across the back, brine in it.
  for (const px of [-4.2, 4.2]) { k.slab(g, [0.8, 2.55, 1.0], M.vault, [px, 1.275, -2.15], { tile: 1.2 }); h.solid(px, -2.15, 0.4, 0.5); }
  k.slab(g, [2 * X, 0.2, 1.1], M.vault, [0, 2.65, -2.15], { tile: 1.2 });
  for (const dz of [-0.5, 0.5]) k.slab(g, [2 * X, 0.5, 0.12], M.vault, [0, 3.0, -2.15 + dz], { tile: 1.2 });
  k.box(g, [2 * X - 0.1, 0.03, 0.86], M.brine, [0, 3.1, -2.15], null, false);
  // The two gates where the culvert meets the side walls: a frame, a gate plate raised part way, a spindle, a handwheel.
  for (const s of [-1, 1]) {
    const gx = s * (X - 0.7);
    for (const dz of [-0.48, 0.62]) k.box(g, [0.14, 4.1, 0.14], M.darkSteel, [gx, 2.05, -2.15 + dz]);
    k.box(g, [0.1, 1.0, 1.1], M.castIron, [gx, 3.35, -2.15]);
    k.box(g, [0.3, 0.16, 1.24], M.darkSteel, [gx, 4.1, -2.05]);
    k.cyl(g, [0.03, 0.03, 1.6, 8], M.steel, [gx, 3.3, -1.45], null, false);
    k.box(g, [0.4, 1.2, 0.4], M.castIron, [gx, 0.6, -1.35]);
    handwheel(h, gx, 1.32, -1.1, 'z', 0.26);
    h.solid(gx, -1.6, 0.3, 0.8);
  }
  // The left trough: from the left gate down along the wall to the door, brine in it.
  k.slab(g, [0.9, 0.6, 8.6], M.vault, [-X + 0.45, 0.3, 2.6], { tile: 1.2 });
  k.box(g, [0.6, 0.03, 8.4], M.brine, [-X + 0.45, 0.52, 2.6], null, false);
  k.pipe(g, [[-X + 0.45, 3.0, -1.6], [-X + 0.45, 0.62, -1.6]], 0.09, M.castIron);
  h.solid(-X + 0.45, 2.6, 0.45, 4.3);
  // The right: a hand pump by the door lifting brine back up a copper pipe to the culvert.
  const px = X - 0.6;
  k.cyl(g, [0.22, 0.26, 1.1, 14], M.castIron, [px, 0.55, 6.2]);
  k.box(g, [0.06, 0.06, 1.1], M.timber, [px, 1.25, 6.5], [0.35, 0, 0]);
  k.pipe(g, [[px, 1.1, 6.2], [px, 2.6, 6.2], [px, 2.6, -1.2], [px, 3.0, -1.6]], 0.06, M.copper);
  h.round(px, 6.2, 0.4);
  // The sight glass on the left pier: a glass tube in brass, the brine standing in it at the culvert's level.
  k.cyl(g, [0.05, 0.05, 1.4, 10], M.glass, [-3.6, 2.6, -1.62], null, false);
  k.cyl(g, [0.04, 0.04, 0.9, 10], M.brine, [-3.6, 2.4, -1.62], null, false);
  for (const y of [1.88, 3.32]) k.cyl(g, [0.08, 0.08, 0.06, 10], M.brass, [-3.6, y, -1.62]);
  h.hang(-4.2, 4.2, 3.4);
  return finish(h);
}

/** 2 THE WEIGH HOUSE. A platform scale on its pit with its beam and poise, a steelyard hung from a tie beam, sacks waiting. */
function weighHouse(w) {
  const h = start(w, 'site-2', 'host-weigh-house');
  const { k, g, M, room } = h;
  const X = room.x1;
  // The platform scale on the right: a steel deck flush on its pit frame, the beam column and the poise.
  const sx = X - 2.0, sz = 2.6;
  k.box(g, [2.4, 0.08, 2.4], M.darkSteel, [sx, 0.04, sz]);
  k.box(g, [2.2, 0.04, 2.2], M.steel, [sx, 0.1, sz]);
  k.box(g, [0.4, 1.5, 0.4], M.castIron, [X - 0.35, 0.75, sz - 1.4]);
  k.box(g, [0.08, 0.08, 1.6], M.brass, [X - 0.35, 1.55, sz - 0.9]);
  k.box(g, [0.14, 0.2, 0.14], M.castIron, [X - 0.35, 1.48, sz - 0.3]);
  sacks(h, sx, sz, 3);
  h.solid(X - 0.35, sz - 1.4, 0.25, 0.25);
  // The steelyard: a long bar hung by chains from a tie beam, a hook and a sack on one arm, a poise on the other.
  const yx = -X + 2.2, yz = 1.0, yy = 3.3;
  k.box(g, [0.06, 6.1 - yy, 0.06], M.darkSteel, [yx, (6.1 + yy) / 2, yz]);
  k.box(g, [0.1, 0.1, 2.6], M.castIron, [yx, yy, yz + 0.4]);
  k.box(g, [0.18, 0.24, 0.16], M.castIron, [yx, yy - 0.2, yz + 1.4]);
  k.box(g, [0.03, 0.4, 0.03], M.darkSteel, [yx, yy - 0.25, yz - 0.7]);
  k.box(g, [0.5, 0.7, 0.4], M.sack, [yx, yy - 0.8, yz - 0.7]);
  // Nobody walks under a hanging load: a rope rail round the steelyard's floor (its posts are the collider's corners).
  for (const [ox, oz] of [[-0.6, -1.1], [0.6, -1.1], [-0.6, 1.9], [0.6, 1.9]]) k.box(g, [0.06, 1.0, 0.06], M.timberDark, [yx + ox, 0.5, yz + oz]);
  for (const ox of [-0.6, 0.6]) k.box(g, [0.03, 0.03, 3.0], M.rubber, [yx + ox, 0.95, yz + 0.4], null, false);
  h.solid(yx, yz + 0.4, 0.65, 1.55);
  // Sacks on pallets along the left wall, and by the door.
  sacks(h, -X + 0.85, 4.6, 4);
  sacks(h, -X + 0.85, 6.6, 3);
  sacks(h, X - 0.85, room.z1 - 1.2, 2);
  h.hang(-3.8, 5.2, 3.6);
  return finish(h);
}

/** 3 THE GAUGE CHAMBER. A trough on a pivot over a catch basin rocks as the brine runs into it; the gauge post reads the level. */
function gaugeChamber(w) {
  const h = start(w, 'site-3', 'host-gauge-chamber');
  const { k, g, M, room } = h;
  const X = room.x1;
  const tx = -X + 1.1, tz0 = -0.2, tz1 = 4.6, tm = (tz0 + tz1) / 2;
  // The catch basin: a stone kerb with brine in it.
  k.slab(g, [1.9, 0.5, tz1 - tz0 + 0.6], M.vault, [tx, 0.25, tm], { tile: 1.2 });
  k.box(g, [1.6, 0.03, tz1 - tz0 + 0.3], M.brine, [tx, 0.48, tm], null, false);
  h.solid(tx, tm, 0.95, (tz1 - tz0 + 0.6) / 2);
  // The pivot frame and the trough that rocks on it.
  for (const dz of [-0.9, 0.9]) {
    k.box(g, [0.14, 1.1, 0.14], M.darkSteel, [tx, 1.05, tm + dz]);
  }
  const trough = new THREE.Group();
  trough.position.set(tx, 1.65, tm);
  trough.userData.noMerge = true;
  k.box(trough, [0.9, 0.06, tz1 - tz0], M.steel, [0, 0, 0]);
  for (const dx of [-0.42, 0.42]) k.box(trough, [0.06, 0.3, tz1 - tz0], M.steel, [dx, 0.15, 0]);
  k.box(trough, [0.76, 0.02, tz1 - tz0 - 0.1], M.brine, [0, 0.08, 0], null, false);
  k.cyl(trough, [0.06, 0.06, 1.9, 10], M.darkSteel, [0, -0.05, 0], [Math.PI / 2, 0, 0]);
  g.add(trough);
  h.movers.push({ update: t => { trough.rotation.x = 0.07 * Math.sin(t * 0.45); } });
  // The gauge post: a tall staff by the basin, banded every half metre, a float arm reading the trough.
  const gx = tx + 1.15, gz = tz1 + 0.6;
  k.box(g, [0.16, 3.6, 0.12], M.timberDark, [gx, 1.8, gz]);
  for (let i = 1; i < 7; i++) k.box(g, [0.18, 0.04, 0.14], i % 2 ? M.paint2 : M.paintRed, [gx, i * 0.5, gz]);
  k.box(g, [0.04, 0.04, 0.6], M.brass, [gx - 0.1, 1.85, gz - 0.3]);
  h.solid(gx, gz, 0.15, 0.15);
  // The header tank on the right, high on its legs, and the feed pipe across the roof to the trough's end.
  const hx = X - 1.0, hz = 0.8;
  for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) k.box(g, [0.1, 2.6, 0.1], M.darkSteel, [hx + dx, 1.3, hz + dz]);
  k.cyl(g, [0.8, 0.8, 1.3, 20], M.clad, [hx, 3.25, hz]);
  k.pipe(g, [[hx, 3.9, hz], [hx, 4.1, hz], [tx, 4.1, hz], [tx, 4.1, tz0], [tx, 2.2, tz0]], 0.06, M.castIron);
  h.solid(hx, hz, 0.7, 0.7);
  k.box(g, [0.5, 0.9, 0.5], M.castIron, [X - 0.4, 0.45, 5.6]);
  handwheel(h, X - 0.4, 1.0, 5.3, 'z', 0.22);
  h.solid(X - 0.4, 5.6, 0.25, 0.3);
  h.hang(-3.0, 5.5, 3.4);
  return finish(h);
}

/** 4 THE TALLY ROOM. Pigeonholes down both walls full of slips, a sorting table, crates of tallies waiting to be filed. */
function tallyRoom(w) {
  const h = start(w, 'site-4', 'host-tally-room');
  const { k, g, M, room } = h;
  const X = room.x1;
  const slips = (x, y, z, step) => {
    const n = Math.max(2, Math.round(step / 0.32));
    for (let i = 0; i < n; i++) {
      const zz = z - step / 2 + (i + 0.5) * step / n;
      k.box(g, [0.04, 0.32, step / n - 0.04], M.timberDark, [x, y + 0.2, zz - step / n / 2 + 0.02]);
      if ((i + Math.round(x * 3 + y * 5)) % 3) k.box(g, [0.36, 0.14, 0.18], M.paper, [x, y + 0.08, zz], null, false);
    }
  };
  for (const s of [-1, 1]) rackAlongZ(h, s * (X - 0.35), -2.5, 5.5, { depth: 0.55, top: 2.8, shelves: [0.4, 0.82, 1.24, 1.66, 2.08, 2.5], bay: 1.0, load: (x, y, z, step) => slips(x, y, z, step) });
  // The sorting table by the door, on the right.
  const tx = X - 1.4, tz = 6.6;
  k.box(g, [1.6, 0.06, 2.2], M.timber, [tx, 0.9, tz]);
  for (const [dx, dz] of [[-0.7, -1.0], [0.7, -1.0], [-0.7, 1.0], [0.7, 1.0]]) k.box(g, [0.07, 0.87, 0.07], M.timberDark, [tx + dx, 0.435, tz + dz]);
  for (let i = 0; i < 6; i++) k.box(g, [0.3, 0.02, 0.2], M.paper, [tx - 0.5 + (i % 3) * 0.45, 0.94, tz - 0.6 + Math.floor(i / 3) * 0.9], null, false);
  h.solid(tx, tz, 0.8, 1.1);
  // Crates of tallies on the left by the door.
  for (const [cz, cy] of [[6.2, 0.3], [6.2, 0.9], [7.6, 0.3]]) k.box(g, [0.9, 0.6, 0.9], M.timber, [-X + 0.8, cy, cz]);
  h.solid(-X + 0.8, 6.9, 0.45, 1.15);
  h.hang(0, 3.2, 3.5);
  return finish(h);
}

/** 5 THE LEDGER HOUSE. The clerk's sloped desk and stool, a column board on the left wall, shelves of record books. */
function ledgerHouse(w) {
  const h = start(w, 'site-5', 'host-ledger-house');
  const { k, g, M, room } = h;
  const X = room.x1;
  // The desk on the left: a sloped top on a frame, an inkwell, an open ledger, a high stool.
  const dx = -X + 1.0, dz = 3.2;
  k.box(g, [1.0, 0.06, 1.8], M.timber, [dx, 1.12, dz], [0, 0, 0.18]);
  for (const [ox, oz] of [[-0.4, -0.8], [0.4, -0.8], [-0.4, 0.8], [0.4, 0.8]]) k.box(g, [0.07, 1.05 + ox * 0.2, 0.07], M.timberDark, [dx + ox, 0.52 + ox * 0.1, dz + oz]);
  k.box(g, [0.5, 0.03, 0.7], M.paper, [dx + 0.05, 1.17, dz], [0, 0, 0.18], false);
  k.cyl(g, [0.3, 0.3, 0.04, 14], M.timber, [dx + 1.0, 0.75, dz], null, false);
  k.cyl(g, [0.03, 0.03, 0.73, 6], M.timberDark, [dx + 1.0, 0.37, dz]);
  h.solid(dx, dz, 0.55, 0.95);
  h.round(dx + 1.0, dz, 0.32);
  // The column board on the left wall above the desk: a dark board ruled in columns.
  k.box(g, [0.06, 1.6, 4.6], M.board, [-X + 0.05, 2.9, 2.2]);
  for (let i = 0; i < 5; i++) k.box(g, [0.02, 1.5, 0.03], M.paint2, [-X + 0.09, 2.9, 0.2 + i * 1.0], null, false);
  k.box(g, [0.02, 0.03, 4.5], M.paint2, [-X + 0.09, 3.5, 2.2], null, false);
  // Shelves of record books down the right wall.
  const bookColors = [M.paintRed, M.timberDark, M.paintBlue, M.timber];
  rackAlongZ(h, X - 0.35, -2.4, 6.6, { depth: 0.5, top: 3.0, shelves: [0.3, 0.9, 1.5, 2.1, 2.7], bay: 1.5, load: (x, y, z, step) => {
    let zz = z - step / 2 + 0.08, i = Math.round(x + y * 7 + z * 3);
    while (zz < z + step / 2 - 0.12) { const t = 0.07 + ((i * 7) % 5) * 0.012; k.box(g, [0.34, 0.38 - (i % 3) * 0.04, t], bookColors[Math.abs(i) % 4], [x, y + 0.2, zz + t / 2], null, false); zz += t + 0.01; i++; }
  } });
  h.hang(-3.4, 2.6, 3.6);
  return finish(h);
}

/**
 * 6 THE PUMP CHAMBER. The beam pump on the terrace above works the barrel under the shaft through its rod (plant.js); the
 * barrel's discharge rises up the right wall to the pans, its suction comes from the brine main along the left wall.
 */
function pumpChamber(w) {
  const h = start(w, 'site-6', 'host-pump-chamber');
  const { k, g, M, room } = h;
  const X = room.x1;
  const r6 = room.room;
  const s = shaftOf(r6);
  const [bx, bz] = toHost(h.plan, s.cx, s.cz);
  // The barrel: a cast-iron cylinder on a plinth, flanged, its gland at PUMP_GLAND under the rod.
  k.slab(g, [1.3, 0.3, 1.3], M.vault, [bx, 0.15, bz], { tile: 1.2 });
  k.cyl(g, [0.36, 0.4, GLAND - 0.5, 18], M.castIron, [bx, 0.3 + (GLAND - 0.5) / 2, bz]);
  for (const y of [0.5, 1.2, GLAND - 0.25]) k.cyl(g, [0.48, 0.48, 0.07, 18], M.castIron, [bx, y, bz]);
  k.cyl(g, [0.14, 0.18, 0.2, 12], M.brass, [bx, GLAND - 0.1, bz]);
  h.round(bx, bz, 0.65);
  // The discharge: out of the barrel, an air vessel, and up the right wall to the roof (to the pans above).
  const ax = X - 0.55;
  k.pipe(g, [[bx, 1.0, bz], [ax, 1.0, bz], [ax, 1.0, 1.6]], 0.11, M.castIron);
  k.cyl(g, [0.34, 0.34, 1.2, 16], M.castIron, [ax, 1.75, 1.6]);
  k.cone(g, [0.34, 0.4, 16], M.castIron, [ax, 2.55, 1.6]);
  k.pipe(g, [[ax, 1.0, 1.6], [ax, 1.0, 4.0], [ax, r6.top + 0.4, 4.0]], 0.11, M.castIron);
  h.solid(ax, 2.8, 0.4, 1.6);
  h.solid((bx + ax) / 2 + 0.3, bz + 0.5, (ax - bx) / 2 + 0.1, 0.8);
  // The brine main along the left wall on saddles, a valve with its wheel, and the suction across behind the plate.
  const mx = -X + 0.45;
  k.pipe(g, [[mx, 0.55, room.z0 + 0.1], [mx, 0.55, room.z1 - 0.2]], 0.22, M.rusted);
  for (let z = room.z0 + 0.8; z < room.z1; z += 2.4) k.box(g, [0.6, 0.35, 0.3], M.vault, [mx, 0.17, z]);
  k.box(g, [0.5, 0.7, 0.5], M.castIron, [mx, 0.55, 3.0]);
  handwheel(h, mx + 0.4, 1.1, 3.0, 'x', 0.3);
  k.pipe(g, [[mx, 0.3, -2.4], [bx, 0.3, -2.4], [bx, 0.3, bz - 0.4]], 0.12, M.castIron);
  h.solid(mx, (room.z0 + room.z1) / 2, 0.42, (room.z1 - room.z0) / 2);
  // A spare rod and a crate of packing by the door.
  k.box(g, [0.9, 0.5, 0.7], M.timber, [mx + 1.2, 0.25, room.z1 - 0.8]);
  h.solid(mx + 1.2, room.z1 - 0.8, 0.45, 0.35);
  h.hang(-4.0, 6.0, 3.5);
  return finish(h);
}

/** 7 THE SETTLING CISTERN. A long stone settling tank crusted with salt, a cone-bottomed tank on legs, drums of reagent. */
function settlingCistern(w) {
  const h = start(w, 'site-7', 'host-settling-cistern');
  const { k, g, M, room } = h;
  const X = room.x1;
  // The settling tank down the right wall: stone, waist high, brine in it and salt crusted on its rim and walls.
  const tx = X - 1.3, tz0 = room.z0 + 0.05, tz1 = 5.2, tw = 2.4;
  k.slab(g, [tw, 1.1, tz1 - tz0], M.vault, [tx, 0.55, (tz0 + tz1) / 2], { tile: 1.2 });
  k.box(g, [tw - 0.3, 0.03, tz1 - tz0 - 0.3], M.brine, [tx, 1.02, (tz0 + tz1) / 2], null, false);
  for (const [w2, d, ox, oz] of [[tw, 0.12, 0, -(tz1 - tz0) / 2 + 0.06], [tw, 0.12, 0, (tz1 - tz0) / 2 - 0.06], [0.12, tz1 - tz0, -tw / 2 + 0.06, 0]]) k.box(g, [w2 + 0.02, 0.06, d + 0.02], M.saltWhite, [tx + ox, 1.13, (tz0 + tz1) / 2 + oz], null, false);
  h.solid(tx, (tz0 + tz1) / 2, tw / 2, (tz1 - tz0) / 2);
  // The cone-bottomed tank on the left, on four legs, its draw-off cock over a tub.
  const cx = -X + 1.3, cz = 0.6;
  for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) k.box(g, [0.1, 2.0, 0.1], M.darkSteel, [cx + dx, 1.0, cz + dz]);
  k.cyl(g, [1.0, 1.0, 1.6, 22], M.clad, [cx, 2.8, cz]);
  k.cyl(g, [1.0, 0.12, 1.0, 22], M.clad, [cx, 1.5, cz]);
  k.cyl(g, [0.05, 0.05, 0.4, 8], M.brass, [cx, 0.85, cz]);
  k.cyl(g, [0.35, 0.3, 0.35, 14], M.timber, [cx, 0.18, cz]);
  h.solid(cx, cz, 0.9, 0.9);
  // Drums of reagent on the left by the door.
  for (const [dz, mat] of [[4.6, M.drumB], [5.3, M.paintBlue], [6.0, M.drumB]]) drum(h, -X + 0.45, dz, mat);
  h.solid(-X + 0.45, 5.3, 0.32, 1.05);
  h.hang(X - 1.3, 2.0, 3.3);
  return finish(h);
}

/** 8 THE PLOTTING ROOM. A gridded board high on the back wall, a drafting table with a rule on its rail, a rack of rolled charts. */
function plottingRoom(w) {
  const h = start(w, 'site-8', 'host-plotting-room');
  const { k, g, M, room } = h;
  const X = room.x1;
  // The board on the back wall, above the plate: dark, ruled in a grid, a curve pinned on it in slips.
  const bz = room.z0 + 0.04;
  k.box(g, [6.4, 1.7, 0.06], M.board, [0, 3.35, bz]);
  for (let i = 0; i <= 8; i++) k.box(g, [0.02, 1.6, 0.02], M.paint2, [-3.0 + i * 0.75, 3.35, bz + 0.04], null, false);
  for (let j = 0; j <= 4; j++) k.box(g, [6.1, 0.02, 0.02], M.paint2, [0, 2.6 + j * 0.375, bz + 0.04], null, false);
  for (let i = 0; i < 7; i++) k.box(g, [0.12, 0.08, 0.02], M.paintYellow, [-2.7 + i * 0.85, 2.75 + Math.log(1 + i * 1.3) * 0.48, bz + 0.06], null, false);
  // The drafting table on the right: a tilted board on a trestle, a rule on a rail across it, a stool.
  const tx = X - 1.4, tz = 2.4;
  k.box(g, [1.3, 0.05, 1.9], M.timber, [tx, 1.08, tz], [0, 0, 0.32]);
  k.box(g, [0.05, 0.05, 1.9], M.brass, [tx + 0.5, 1.26, tz], null, false);
  for (const oz of [-0.8, 0.8]) for (const ox of [-0.45, 0.45]) k.box(g, [0.07, 1.0, 0.07], M.timberDark, [tx + ox, 0.5, tz + oz]);
  k.box(g, [0.8, 0.02, 1.0], M.paper, [tx, 1.12, tz], [0, 0, 0.32], false);
  h.solid(tx, tz, 0.7, 1.0);
  // The chart rack on the left: rolled charts laid in a frame of pigeonholes.
  rackAlongZ(h, -X + 0.4, -1.6, 5.6, { depth: 0.6, top: 2.2, shelves: [0.35, 0.8, 1.25, 1.7, 2.15], bay: 1.8, load: (x, y, z, step) => {
    for (let i = 0; i < 4; i++) k.cyl(g, [0.06, 0.06, step - 0.2, 8], i % 2 ? M.paper : M.paint2, [x - 0.2 + i * 0.13, y + 0.07, z], [Math.PI / 2, 0, 0], false);
  } });
  h.hang(X - 1.4, 2.4, 3.4);
  return finish(h);
}

/** The pump barrel's gland over the floor (plant.js hangs the rod a hand over it). */
const GLAND = PUMP_GLAND;

export const HOST_BUILDERS = {
  'site-1': sluiceChamber,
  'site-2': weighHouse,
  'site-3': gaugeChamber,
  'site-4': tallyRoom,
  'site-5': ledgerHouse,
  'site-6': pumpChamber,
  'site-7': settlingCistern,
  'site-8': plottingRoom
};
