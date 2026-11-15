/**
 * lodestone/stations.js — The six hosts: what the Fifth left in each alcove of the canyon, and the bench built into it.
 *
 * A bench on Lodestone stands in an ALCOVE (`canyon-plan.js`): a hollow the water cut under the outside of a bend, roofed
 * by the hard bed that overhangs it, open to the canyon. The alcove (its floor, its rock, its roof) is the canyon's
 * (`terrain.js`). The HOST is what stands in it and its bench, as ONE object: so the overlap rule (which exempts a body's
 * own parts) lets the bench be bolted to the thing it belongs to, and the bay contract (`bench-bay.js`) keeps the volume
 * the plate, the instrument, the screens and the camera need empty of it.
 *
 *   1 core store        core racks down both walls, a core saw behind the plate, timber cribs propping the lip
 *   2 manganese face    a column drill at the black seam, bins of the seam's ores sorted by colour, a floodlamp
 *   3 seep              a kerbed basin catching the drip from the roof, the Fifth's leach tank, a drum of ammonia
 *   4 drum gallery      drums chocked in rows at both ends, a runway beam and hoist, steel props along the lip
 *   5 chimney           a shelf of sample jars, a hooded lamp-box and white board for judging colour, fallen blocks
 *   6 magnetite pocket  switchgear against the back wall, a test electromagnet, the Coil's cable drum, a rock pillar
 *
 * THE HOST FRAME. Origin on the alcove's floor under the middle of the plate; +z toward the mouth (and the player), +x to
 * the player's right. Every builder is given its alcove in that frame (`h.room`: `x0, x1, z0, z1` with the rock's
 * colliders taken off, `top` the roof over the floor, `topAt(z)` where the roof steps). Machinery stands to the sides
 * (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m; `verify:bench` measures all of it and `verify:lodestone`
 * measures that no host leaves its alcove.
 *
 * ONLY LAMPS ARE LIT. A host hangs its alcove's lamps (`lampMark`s the world pools); nothing here owns a PointLight.
 * NO SIGN STANDS IN THE CANYON. Nothing here carries lettering.
 *
 * @returns {{ group, bench, benchLocal, colliders, movers }} `colliders` are host-local discs `{ lx, lz, r }` and boxes
 *   `{ lx, lz, hw, hd }`; the world turns them to its own frame. `movers` are meshes that move (`update(t)`).
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { HOST_PLAN, hostExtent } from './host-plan.js';
import { ALCOVES, PLATE_FROM_BACK } from './canyon-plan.js';
import { kitFor } from '../kettle/kit.js';

/* ----------------------------------------------------------------- the bench */

/** The bench: the shared bay bench in the host's skin, in the Fifth's grey steel, its cased instrument for `kind`. */
export function buildLsBench(ctx, { kind = 'vessel', plate = 'LDS-01', skin = 'deck' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin,
    plate,
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.timber },
    tagStyle: { fg: '#1a1e24', bg: '#cfd4dc' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.18, 0.6, 0.44), M.case, -0.35, height + 0.345, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 22), M.brass, -0.62, height + 0.41, 0.04, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.12, 22), M.glassDark, -0.62, height + 0.41, 0.062);
      if (kind === 'assay' || kind === 'crusher') {
        add(new THREE.BoxGeometry(0.5, 0.05, 0.24), M.caseDark, 0.66, y0 + 0.025, 0.1);
        [0.5, 0.64, 0.78, 0.92].forEach((x, i) => add(new THREE.BoxGeometry(0.1, 0.06 + i * 0.03, 0.1), M.magnetite, x, y0 + 0.08, 0.1));
      } else if (kind === 'vats' || kind === 'booth') {
        [0.5, 0.7, 0.9].forEach((x, i) => {
          add(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 14), M.glass, x, y0 + 0.11, 0.1);
          add(new THREE.CylinderGeometry(0.052, 0.052, 0.12, 14), [M.leach, M.sampleGreen, M.sampleAmber][i], x, y0 + 0.07, 0.1);
        });
      } else {
        add(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 18), M.darkSteel, 0.62, y0 + 0.1, 0.1);
        add(new THREE.TorusGeometry(0.1, 0.03, 8, 18), M.copper, 0.62, y0 + 0.22, 0.1, [Math.PI / 2, 0, 0]);
        add(new THREE.BoxGeometry(0.24, 0.12, 0.18), M.caseDark, 0.94, y0 + 0.06, 0.12);
      }
    }
  });
}

/* --------------------------------------------------------------- start and finish */

/** An alcove's lamp: hung low under rock, so dimmer and shorter than a canyon lamp. */
const ALCOVE_LAMP = { intensity: 9, distance: 12 };

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const al = ALCOVES.find(a => a.id === plan.alcove);
  const g = new THREE.Group();
  g.name = name;
  const bench = buildLsBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  const [x0, x1, z0, z1] = hostExtent(plan);
  // The roof over the floor at a host-frame z: the back part of a stepped roof is higher; the chimney is open.
  const topAt = z => {
    const fromBack = z + PLATE_FROM_BACK;
    if (al.chimney && fromBack >= al.chimney[0] && fromBack <= al.chimney[1]) return Infinity;
    if (al.roofBack && fromBack <= al.backDepth) return al.roofBack;
    return al.roof;
  };
  const room = { x0, x1, z0, z1, top: al.roof, topAt };
  const colliders = [{ lx: 0, lz: 0, hw: 2.4, hd: 0.65 }];
  const movers = [];
  /** Hang a lamp from the roof at (x, z), `y` over the floor. */
  const hang = (x, z, y = 3.5, opts = ALCOVE_LAMP) => k.pendant(g, x, y, z, Math.min(topAt(z), 9) - 0.05, opts);
  const solid = (lx, lz, hw, hd) => colliders.push({ lx, lz, hw, hd });
  const round = (lx, lz, r) => colliders.push({ lx, lz, r });
  return { k, M: w.M, g, bench, colliders, movers, room, hang, solid, round, w };
}

/** The lamp over the plate, and the host handed back. */
const finish = (h, y = 3.5) => {
  h.hang(0, -0.3, y);
  return { group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders, movers: h.movers };
};

/* ------------------------------------------------------------------------ shared pieces */

/** A drum standing on its end, with its two rolling hoops. */
const drum = (h, x, z, mat, y = 0) => {
  h.k.cyl(h.g, [0.29, 0.29, 0.88, 16], mat, [x, y + 0.44, z]);
  for (const dy of [0.28, 0.6]) h.k.cyl(h.g, [0.3, 0.3, 0.03, 16], h.M.darkSteel, [x, y + dy, z], null, false);
};

/** A heap of loose stuff: a low cone, flattened, as tipped ore lies. */
const heap = (h, x, z, r, ht, mat, y = 0) => {
  const m = h.k.cyl(h.g, [r * 0.18, r, ht, 12], mat, [x, y + ht / 2, z]);
  m.rotation.y = x * 1.7 + z;
  return m;
};

/** A steel rack along z (against a side wall): uprights, shelves, and `load(x, y, z)` on each bay of each shelf. */
function rackAlongZ(h, x, z0, z1, { depth = 0.7, top = 2.6, shelves = [0.45, 1.15, 1.85, 2.55], bay = 1.8, load = null } = {}) {
  const { k, g, M } = h;
  const n = Math.max(1, Math.round((z1 - z0) / bay));
  const step = (z1 - z0) / n;
  for (let i = 0; i <= n; i++) for (const dx of [-depth / 2 + 0.04, depth / 2 - 0.04]) k.box(g, [0.07, top, 0.07], M.darkSteel, [x + dx, top / 2, z0 + i * step]);
  for (const y of shelves) {
    k.box(g, [depth, 0.05, z1 - z0], M.steel, [x, y, (z0 + z1) / 2]);
    if (load) for (let i = 0; i < n; i++) load(x, y + 0.025, z0 + (i + 0.5) * step, step);
  }
  h.solid(x, (z0 + z1) / 2, depth / 2, (z1 - z0) / 2);
}

/** A timber crib from the floor to `top`: square layers of two balks, each layer across the one below. */
function crib(h, x, z, top, { size = 1.5, balk = 0.24 } = {}) {
  const { k, g, M } = h;
  const n = Math.floor(top / balk);
  for (let i = 0; i < n; i++) {
    const y = balk / 2 + i * balk;
    for (const s of [-1, 1]) {
      if (i % 2) k.box(g, [size, balk, balk], i % 4 === 1 ? M.timber : M.timberDark, [x, y, z + s * (size / 2 - balk / 2)], null, false);
      else k.box(g, [balk, balk, size], i % 4 === 0 ? M.timber : M.timberDark, [x + s * (size / 2 - balk / 2), y, z], null, false);
    }
  }
  // The cap: a timber headboard against the rock's underside.
  k.box(g, [size + 0.3, top - n * balk, size + 0.3], M.timberDark, [x, n * balk + (top - n * balk) / 2, z], null, false);
  h.round(x, z, size * 0.72);
}

/* ------------------------------------------------------------------------ 1 */

/**
 * THE CORE STORE: where the Fifth's prospectors kept the drill core from the beds round the canyon. Racks of core boxes
 * down both walls (each box holds four sticks of banded core), a core saw on its bed behind the plate with its water
 * drum, and two timber cribs propping the overhang at the lip, where the bed was cracked.
 */
export function buildCoreStore(w) {
  const h = start(w, 'site-1', 'core-store');
  const { k, g, M, room } = h;
  for (const side of [-1, 1]) {
    const x = side < 0 ? room.x0 + 0.4 : room.x1 - 0.4;
    rackAlongZ(h, x, room.z0 + 0.4, 4.0, {
      load: (rx, y, z, bay) => {
        k.box(g, [0.56, 0.06, bay - 0.2], M.timber, [rx, y + 0.03, z], null, false);
        for (let c = 0; c < 4; c++) {
          const cx = rx - 0.21 + c * 0.14;
          // A stick of core in two pieces, cut where the bed changes: red jasper and grey iron.
          const cut = (Math.sin(z * 7.1 + c * 3.3 + y * 5.0) * 0.5) * (bay - 0.4) * 0.6;
          const len1 = (bay - 0.3) / 2 + cut, len2 = bay - 0.3 - len1;
          k.cyl(g, [0.045, 0.045, len1, 10], M.coreJasper, [cx, y + 0.11, z - (bay - 0.3) / 2 + len1 / 2], [Math.PI / 2, 0, 0], false);
          k.cyl(g, [0.045, 0.045, len2, 10], M.coreIron, [cx, y + 0.11, z + (bay - 0.3) / 2 - len2 / 2], [Math.PI / 2, 0, 0], false);
        }
      }
    });
  }
  // The core saw: a cast bed, the blade under its guard, the carriage and the motor; a drum of water to cool the cut.
  const sx = -0.9, sz = room.z0 + 1.1;
  k.box(g, [2.4, 0.8, 0.9], M.castIron, [sx, 0.4, sz]);
  k.box(g, [2.2, 0.05, 0.12], M.darkSteel, [sx, 0.83, sz - 0.3]);
  k.box(g, [2.2, 0.05, 0.12], M.darkSteel, [sx, 0.83, sz + 0.3]);
  k.cyl(g, [0.42, 0.42, 0.012, 32], M.steel, [sx + 0.3, 1.05, sz], [Math.PI / 2, 0, 0], false);
  k.cyl(g, [0.46, 0.46, 0.16, 24, 1, true], M.paintYellow, [sx + 0.3, 1.1, sz], [Math.PI / 2, 0, 0], false);
  k.box(g, [0.5, 0.36, 0.42], M.darkSteel, [sx + 1.1, 1.06, sz]);
  k.box(g, [0.7, 0.08, 0.6], M.darkSteel, [sx - 0.5, 0.88, sz]);
  drum(h, sx + 2.1, sz - 0.1, M.drumBlue);
  h.solid(sx + 0.4, sz, 1.7, 0.5);
  // Timber cribs where the lip cracked, one at each corner of the mouth.
  for (const side of [-1, 1]) crib(h, side * (room.x1 - 1.0), room.z1 - 1.2, room.top);
  h.hang(room.x0 + 1.7, 0.6);
  h.hang(room.x1 - 1.7, 3.2);
  return finish(h);
}

/* ------------------------------------------------------------------------ 2 */

/**
 * THE MANGANESE FACE: the black seam of manganese ore crossing the back wall, where a slab fell from the roof and left
 * the high vault. A column drill jacked floor to vault, its drifter aimed at the seam; three timber bins of the seam's
 * ores sorted by colour (pink, brown, black: the same metal at different charges); a floodlamp on a stand at the face.
 */
export function buildManganeseFace(w) {
  const h = start(w, 'site-2', 'manganese-face');
  const { k, g, M, room } = h;
  // The column: a jack bar from floor to the vault, a cross-arm, and the drill on its feed.
  const cx = 4.0, cz = room.z0 + 1.6, vault = room.topAt(cz);
  k.box(g, [0.5, 0.08, 0.5], M.darkSteel, [cx, 0.04, cz]);
  k.cyl(g, [0.07, 0.07, vault - 0.12, 12], M.steel, [cx, (vault - 0.04) / 2, cz]);
  k.box(g, [0.5, 0.08, 0.5], M.darkSteel, [cx, vault - 0.08, cz]);
  k.cyl(g, [0.12, 0.12, 0.3, 12], M.darkSteel, [cx, 1.6, cz]);
  k.box(g, [1.3, 0.1, 0.12], M.darkSteel, [cx - 0.75, 1.6, cz]);
  // The feed and the drifter, pointing at the face (into -z).
  k.box(g, [0.14, 0.12, 1.6], M.darkSteel, [cx - 1.35, 1.66, cz - 0.4]);
  k.box(g, [0.24, 0.22, 0.5], M.rusted, [cx - 1.35, 1.8, cz + 0.05]);
  k.cyl(g, [0.022, 0.022, 0.6, 8], M.steel, [cx - 1.35, 1.66, cz - 1.25], [Math.PI / 2, 0, 0], false);
  // Its air hose, slack along the floor to a receiver beside the wall.
  k.pipe(g, [[cx - 1.22, 1.82, cz + 0.12], [cx - 0.6, 1.0, cz + 0.2], [cx - 0.2, 0.08, cz + 0.45], [cx + 0.2, 0.08, cz + 0.8], [room.x1 - 0.6, 0.08, cz + 1.0], [room.x1 - 0.6, 0.6, cz + 2.0]], 0.035, M.rubber);
  k.cyl(g, [0.35, 0.35, 1.3, 16], M.drumGreen, [room.x1 - 0.6, 0.75, cz + 2.6]);
  h.solid(cx - 0.75, cz - 0.1, 1.05, 1.5);
  h.solid(room.x1 - 0.6, cz + 1.9, 0.42, 1.15);
  // Three ore bins down the left wall: timber sides, the ore heaped in each.
  const bx = room.x0 + 0.75;
  [[M.orePink, -2.6], [M.oreBrown, -0.6], [M.oreBlack, 1.4]].forEach(([ore, z]) => {
    const z0 = room.z0 + 1.0 + (z + 2.6);
    for (const s of [-1, 1]) k.box(g, [1.1, 0.75, 0.06], M.timber, [bx, 0.375, z0 + s * 0.8], null, false);
    k.box(g, [0.06, 0.75, 1.66], M.timber, [bx - 0.52, 0.375, z0], null, false);
    k.box(g, [0.06, 0.45, 1.66], M.timber, [bx + 0.52, 0.225, z0], null, false);
    heap(h, bx - 0.05, z0, 0.7, 0.62, ore);
    h.solid(bx, z0, 0.58, 0.84);
  });
  // The floodlamp on a tripod, aimed at the face.
  const fx = room.x1 - 1.0, fz = 2.2;
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2;
    k.strut(g, [fx + Math.cos(a) * 0.5, 0, fz + Math.sin(a) * 0.5], [fx, 2.2, fz], 0.025, M.darkSteel, 6);
  }
  k.box(g, [0.5, 0.36, 0.3], M.darkSteel, [fx, 2.45, fz]);
  k.lamp(g, fx, 2.45, fz - 0.2, { intensity: 8, distance: 11 });
  h.round(fx, fz, 0.55);
  h.hang(room.x0 + 1.6, 2.8, 3.4);
  return finish(h);
}

/* ------------------------------------------------------------------------ 3 */

/**
 * THE SEEP: a bedding plane in the roof weeps groundwater, and the drip falls into a basin the Fifth kerbed along the
 * left wall; its water lies level. To the right, the Fifth's leach tank (its liquor deep blue: copper bound to ammonia),
 * the drum of ammonia it was dosed from on a timber cradle, and the hose between.
 */
export function buildSeep(w) {
  const h = start(w, 'site-3', 'seep');
  const { k, g, M, room } = h;
  // The basin: a concrete kerb on the rock, the water level inside it.
  const x0 = room.x0, x1 = -3.1, z0 = room.z0 + 0.2, z1 = 5.2, rim = 0.42, t = 0.22;
  k.box(g, [x1 - x0, rim, t], M.concrete, [(x0 + x1) / 2, rim / 2, z0 + t / 2]);
  k.box(g, [x1 - x0, rim, t], M.concrete, [(x0 + x1) / 2, rim / 2, z1 - t / 2]);
  k.box(g, [t, rim, z1 - z0 - 2 * t], M.concrete, [x1 - t / 2, rim / 2, (z0 + z1) / 2]);
  k.box(g, [t, rim, z1 - z0 - 2 * t], M.concrete, [x0 + t / 2, rim / 2, (z0 + z1) / 2]);
  k.box(g, [x1 - x0 - 2 * t, 0.04, z1 - z0 - 2 * t], M.water, [(x0 + x1) / 2, 0.3, (z0 + z1) / 2], null, false);
  h.solid((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2);
  // The drip: a few drops falling from the bedding plane into the basin, over and over.
  const dropGeo = w.own(new THREE.SphereGeometry(0.035, 6, 4));
  const fall = room.top - 0.35;
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Mesh(dropGeo, M.water);
    const dx = x0 + 0.9 + i * 0.55, dz = z0 + 1.3 + (i % 2) * 1.6;
    d.position.set(dx, fall, dz);
    d.name = 'seep-drop';
    d.userData.noMerge = true;
    d.userData.phys = 'ambient';
    g.add(d);
    const phase = i * 0.37;
    h.movers.push({ mesh: d, update: tt => { const s = ((tt * 0.55 + phase) % 1); d.position.y = 0.3 + (fall - 0.3) * (1 - s * s); } });
  }
  // The weep line along the roof: a dark wet streak of rock over the basin (a thin plate under the roof).
  k.box(g, [x1 - x0 - 0.4, 0.04, 0.5], M.wetRock, [(x0 + x1) / 2, room.top - 0.22, z0 + 2.1], null, false);
  // The leach tank: steel, open, its liquor level inside.
  const tx0 = 3.2, tx1 = room.x1 - 0.1, tz0 = room.z0 + 0.2, tz1 = -1.0, trim = 1.15, tw = 0.08;
  k.box(g, [tx1 - tx0, trim, tw], M.steel, [(tx0 + tx1) / 2, trim / 2, tz0 + tw / 2]);
  k.box(g, [tx1 - tx0, trim, tw], M.steel, [(tx0 + tx1) / 2, trim / 2, tz1 - tw / 2]);
  k.box(g, [tw, trim, tz1 - tz0 - 2 * tw], M.steel, [tx0 + tw / 2, trim / 2, (tz0 + tz1) / 2]);
  k.box(g, [tw, trim, tz1 - tz0 - 2 * tw], M.steel, [tx1 - tw / 2, trim / 2, (tz0 + tz1) / 2]);
  k.box(g, [tx1 - tx0 - 2 * tw, 0.04, tz1 - tz0 - 2 * tw], M.leach, [(tx0 + tx1) / 2, 0.9, (tz0 + tz1) / 2], null, false);
  for (const x of [tx0 + 0.3, tx1 - 0.3]) k.box(g, [0.1, 0.05, tz1 - tz0 + 0.3], M.darkSteel, [x, trim + 0.03, (tz0 + tz1) / 2]);
  h.solid((tx0 + tx1) / 2, (tz0 + tz1) / 2, (tx1 - tx0) / 2, (tz1 - tz0) / 2);
  // The drum of ammonia on its side in a timber cradle, its tap over a bucket, and the hose to the tank.
  const dx = room.x1 - 1.1, dz = 2.2;
  for (const s of [-1, 1]) k.box(g, [1.0, 0.36, 0.16], M.timber, [dx, 0.18, dz + s * 0.32], null, false);
  k.cyl(g, [0.29, 0.29, 0.88, 16], M.drumGreen, [dx, 0.62, dz], [0, 0, Math.PI / 2]);
  k.cyl(g, [0.05, 0.05, 0.12, 8], M.brass, [dx - 0.5, 0.62, dz], [0, 0, Math.PI / 2], false);
  k.cyl(g, [0.14, 0.12, 0.26, 12], M.rusted, [dx - 0.6, 0.13, dz]);
  k.pipe(g, [[dx - 0.48, 0.66, dz + 0.1], [dx - 0.7, 1.0, dz - 1.2], [tx1 - 0.6, 1.3, tz1 + 0.3], [tx1 - 0.6, 1.0, tz1 - 0.3]], 0.03, M.rubber);
  h.solid(dx, dz, 0.55, 0.5);
  h.hang((x0 + x1) / 2, z0 + 3.0, 3.6);
  return finish(h);
}

/* ------------------------------------------------------------------------ 4 */

/**
 * THE DRUM GALLERY: the Fifth's drum store, the longest alcove. Drums stand chocked on timber in rows at both ends, two
 * of the rows the same blue; a runway beam hangs along the back under the roof with a chain hoist on it; three steel
 * props with timber head-boards hold the lip at the mouth, the middle way left open.
 */
export function buildDrumGallery(w) {
  const h = start(w, 'site-4', 'drum-gallery');
  const { k, g, M, room } = h;
  const colours = [M.drumBlue, M.drumBlue, M.drumGreen, M.drumRed];
  for (const side of [-1, 1]) {
    const xa = side < 0 ? room.x0 + 0.5 : 3.3, xb = side < 0 ? -3.3 : room.x1 - 0.5;
    const cols = Math.floor((xb - xa) / 0.66), rows = Math.floor((3.2 - room.z0 - 0.4) / 0.66);
    // Timber chocks under each row.
    for (let r = 0; r < rows; r++) k.box(g, [xb - xa + 0.1, 0.1, 0.16], M.timberDark, [(xa + xb) / 2, 0.05, room.z0 + 0.6 + r * 0.66], null, false);
    for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) {
      const x = xa + 0.3 + c * ((xb - xa - 0.6) / Math.max(1, cols));
      const z = room.z0 + 0.6 + r * 0.66;
      drum(h, x, z, colours[(r + (side > 0 ? 2 : 0)) % 4], 0.1);
      // The rows nearest the aisle are stacked two high, on boards across the lower drums' heads.
      if (r >= rows - 5 && Math.abs(x) < 5.4) {
        k.box(g, [0.62, 0.04, 0.62], M.timberDark, [x, 1.0, z], null, false);
        drum(h, x, z, colours[(r + c + 1) % 4], 1.02);
      }
    }
    h.solid((xa + xb) / 2, (room.z0 + 0.3 + room.z0 + 0.9 + (rows - 1) * 0.66) / 2, (xb - xa) / 2 + 0.05, (0.6 + (rows - 1) * 0.66) / 2 + 0.05);
  }
  // The runway beam along the back, hung from the roof on rods, and its hoist.
  const bz = room.z0 + 1.0, by = room.top - 0.75;
  k.beam(g, [room.x0 + 0.3, by, bz], [room.x1 - 0.3, by, bz], { d: 0.32, f: 0.2 });
  for (let x = room.x0 + 1.5; x < room.x1 - 1; x += 4) k.box(g, [0.05, room.top - by - 0.15, 0.05], M.darkSteel, [x, (room.top + by + 0.15) / 2, bz]);
  k.box(g, [0.5, 0.3, 0.36], M.paintYellow, [-5.2, by - 0.32, bz]);
  k.box(g, [0.04, 1.1, 0.04], M.darkSteel, [-5.2, by - 1.0, bz]);
  k.box(g, [0.18, 0.2, 0.06], M.darkSteel, [-5.2, by - 1.65, bz]);
  // Props at the lip: I-section, a timber head-board under the rock, a foot plate.
  for (const x of [room.x0 + 1.4, room.x1 - 1.4, -4.4, 4.4]) {
    const pz = room.z1 - 0.7;
    k.stanchion(g, x, pz, 0.05, room.top - 0.3, { d: 0.3, b: 0.26 });
    k.box(g, [0.6, 0.05, 0.6], M.darkSteel, [x, 0.025, pz]);
    k.box(g, [1.6, 0.25, 0.4], M.timberDark, [x, room.top - 0.17, pz], null, false);
    h.round(x, pz, 0.3);
  }
  h.hang(-5.6, -0.2);
  h.hang(5.6, -0.2);
  return finish(h, 3.4);
}

/* ------------------------------------------------------------------------ 5 */

/**
 * THE CHIMNEY: a tall alcove with a cleft rising out of its roof to a slot of sky; what seeps down the cleft has stained
 * the back wall blue-green with copper, ochre with iron, black with manganese. On a shelf in the left wall, the Fifth's
 * sample jars of coloured solutions; on the right, a hooded lamp-box and a white board, where a colour is judged against
 * known light; behind the plate, blocks fallen from the cleft.
 */
export function buildChimney(w) {
  const h = start(w, 'site-5', 'chimney');
  const { k, g, M, room } = h;
  // The shelf: a timber board on two iron brackets let into the rock, and the jars on it.
  const sx = room.x0 + 0.35, sy = 1.35;
  k.box(g, [0.5, 0.05, 4.2], M.timber, [sx, sy, -0.6], null, false);
  for (const z of [-2.3, 1.1]) k.box(g, [0.45, 0.32, 0.05], M.darkSteel, [sx - 0.02, sy - 0.18, z], null, false);
  const samples = [M.leach, M.sampleGreen, M.sampleViolet, M.sampleAmber, M.sampleClear, M.samplePink, M.leach];
  samples.forEach((liq, i) => {
    const z = -2.4 + i * 0.6;
    k.tube(g, [0.09, 0.3, 16], M.glass, [sx, sy + 0.175, z]);
    k.cyl(g, [0.082, 0.082, 0.2, 14], liq, [sx, sy + 0.125, z], null, false);
    k.cyl(g, [0.095, 0.095, 0.03, 14], M.darkSteel, [sx, sy + 0.34, z], null, false);
  });
  h.solid(sx, -0.6, 0.3, 2.1);
  // The lamp-box: a hooded steel box on legs, a lamp inside it, a white board behind for judging colour against.
  const lx = room.x1 - 1.0, lz = -0.4;
  for (const [dx, dz] of [[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]]) k.box(g, [0.05, 1.05, 0.05], M.darkSteel, [lx + dx, 0.525, lz + dz]);
  k.box(g, [0.95, 0.06, 0.7], M.darkSteel, [lx, 1.08, lz]);
  k.box(g, [0.95, 0.6, 0.04], M.darkSteel, [lx, 1.41, lz - 0.33]);
  k.box(g, [0.04, 0.6, 0.7], M.darkSteel, [lx + 0.46, 1.41, lz]);
  k.box(g, [0.95, 0.04, 0.7], M.darkSteel, [lx, 1.72, lz]);
  k.box(g, [0.86, 0.5, 0.02], M.paintWhite, [lx, 1.41, lz - 0.3]);
  k.lamp(g, lx + 0.1, 1.62, lz - 0.05, { intensity: 4, distance: 6 });
  h.solid(lx, lz, 0.5, 0.4);
  // Blocks fallen from the cleft, behind the plate.
  for (const [x, z, s] of [[-3.4, room.z0 + 0.9, 0.85], [3.6, room.z0 + 1.0, 1.0], [2.2, room.z0 + 0.6, 0.55]]) {
    const b = k.box(g, [s * 1.3, s * 0.8, s], M.rock, [x, s * 0.4, z]);
    b.rotation.y = x * 0.7;
    h.round(x, z, s * 0.8);
  }
  // A lamp high on the stained wall, aimed down at it, and the one over the plate hung from the front of the roof.
  k.bracketLamp(g, 0.0, 4.6, room.z0 + 0.05, [0, 0.9], { intensity: 9, distance: 12 });
  h.hang(room.x0 + 1.8, 3.0, 3.7);
  return finish(h, 3.7);
}

/* ------------------------------------------------------------------------ 6 */

/**
 * THE MAGNETITE POCKET: a jet-black band of magnetite crosses the pocket, the lodestone itself. The Coil in the pothole is
 * wired from here: switchgear cabinets stand against the back wall, the heavy cable comes in off its drum by the mouth.
 * To the left, a test electromagnet: a steel yoke with two copper coils on a frame, a sample cage hung between its
 * poles. A pillar of rock was left standing in the right-hand back corner to hold the roof.
 */
export function buildMagnetitePocket(w) {
  const h = start(w, 'site-6', 'magnetite-pocket');
  const { k, g, M, room } = h;
  // The pillar: rock, left when the pocket was cut back; it stands to the roof.
  const px = room.x1 - 1.4, pz = room.z0 + 1.4;
  const pillar = k.cyl(g, [1.0, 1.25, room.top, 9], M.rock, [px, room.top / 2, pz]);
  pillar.rotation.y = 0.4;
  h.round(px, pz, 1.25);
  // Switchgear: three cabinets on a plinth against the back wall, a cable tray over them to the right.
  const cz = room.z0 + 0.45;
  k.box(g, [3.6, 0.12, 0.8], M.concrete, [-1.2, 0.06, cz]);
  [-2.4, -1.2, 0.0].forEach((x, i) => {
    k.box(g, [1.1, 2.1, 0.62], i === 1 ? M.paintGrey : M.steel, [x, 1.17, cz]);
    k.box(g, [0.9, 0.12, 0.02], M.darkSteel, [x, 1.9, cz + 0.32]);
    k.cyl(g, [0.05, 0.05, 0.06, 10], M.brass, [x + 0.35, 1.2, cz + 0.33], [Math.PI / 2, 0, 0], false);
  });
  h.solid(-1.2, cz, 1.8, 0.42);
  k.box(g, [5.0, 0.08, 0.4], M.darkSteel, [0.9, 2.65, cz + 0.1]);
  // The test magnet: a frame, a C-yoke of steel, two copper coils on its poles, a sample cage between.
  const mx = room.x0 + 1.4, mz = 0.2;
  for (const [dx, dz] of [[-0.6, -0.9], [0.6, -0.9], [-0.6, 0.9], [0.6, 0.9]]) k.box(g, [0.1, 0.9, 0.1], M.darkSteel, [mx + dx, 0.45, mz + dz]);
  k.box(g, [1.4, 0.1, 2.0], M.darkSteel, [mx, 0.95, mz]);
  k.box(g, [0.5, 0.3, 1.8], M.castIron, [mx, 1.15, mz]);
  for (const s of [-1, 1]) {
    k.box(g, [0.5, 1.1, 0.4], M.castIron, [mx, 1.85, mz + s * 0.7]);
    k.cyl(g, [0.34, 0.34, 0.5, 20], M.copper, [mx, 1.75, mz + s * 0.7]);
    k.cyl(g, [0.16, 0.16, 0.24, 14], M.castIron, [mx, 2.3, mz + s * 0.38], [Math.PI / 2, 0, 0], false);
  }
  k.box(g, [0.5, 0.3, 1.8], M.castIron, [mx, 2.55, mz]);
  k.box(g, [0.02, 0.5, 0.02], M.darkSteel, [mx, 2.15, mz]);
  k.box(g, [0.1, 0.12, 0.1], M.brass, [mx, 1.88, mz]);
  h.solid(mx, mz, 0.72, 1.0);
  // The cable drum by the mouth, its cable out along the floor and out of the pocket (the canyon's run takes it on).
  const dx = room.x1 - 1.0, dz = room.z1 - 2.2;
  for (const s of [-1, 1]) k.cyl(g, [0.75, 0.75, 0.06, 24], M.timber, [dx + s * 0.4, 0.75, dz], [0, 0, Math.PI / 2], false);
  k.cyl(g, [0.5, 0.5, 0.74, 20], M.rubber, [dx, 0.75, dz], [0, 0, Math.PI / 2]);
  for (const s of [-1, 1]) k.box(g, [0.08, 0.8, 0.5], M.darkSteel, [dx + s * 0.5, 0.4, dz]);
  k.pipe(g, [[dx - 0.3, 0.3, dz + 0.4], [dx - 0.4, 0.06, dz + 1.2], [dx - 0.3, 0.06, room.z1 - 0.05]], 0.06, M.rubber);
  k.pipe(g, [[0.9 + 2.4, 2.62, cz + 0.1], [3.3, 0.08, cz + 0.35], [3.3, 0.08, -1.3], [4.6, 0.08, 3.6], [dx - 0.2, 0.3, dz - 0.7]], 0.05, M.rubber);
  h.round(dx, dz, 0.8);
  h.hang(mx + 0.2, 2.6, 3.6);
  return finish(h);
}

export const HOST_BUILDERS = {
  'site-1': buildCoreStore,
  'site-2': buildManganeseFace,
  'site-3': buildSeep,
  'site-4': buildDrumGallery,
  'site-5': buildChimney,
  'site-6': buildMagnetitePocket
};
