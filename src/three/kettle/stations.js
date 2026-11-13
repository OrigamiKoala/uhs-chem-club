/**
 * kettle/stations.js — The eight hosts: the working machinery of each bay of the works, and the bench built into it.
 *
 * A bench on Kettle is not a bench on a plain. It stands in one room of the ironworks (`works-plan.js`): the stores, the
 * scale bay, the control cabin, the sump cellar, the charge bank, the pickling bay, the tapping pit, the refining bay.
 * The ROOM (its floor, walls and roof) is the building's (`works.js`). The HOST is what the works put in that room, and
 * its bench, as ONE object: so the overlap rule (which exempts a body's own parts) lets the bench be bolted to the thing
 * it belongs to, and the bay contract (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the
 * camera need empty of it.
 *
 * THE HOST FRAME. Origin on the room's floor under the middle of the plate; +z is the front (toward the player), +x to
 * the player's right. The world places the group at `site.pos`, on the room's floor, turned to face its approach. Every
 * builder is given its room in that frame (`h.room`: `x0, x1, z0, z1`, a wall's thickness in, and `top`, the roof over
 * the floor), so machinery is placed against the walls that are really there. Machinery stands to the sides
 * (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m behind it; `verify:bench` measures all of it and
 * `verify:kettle` measures that no host leaves its room.
 *
 * ONLY LAMPS ARE LIT. A host hangs its room's lamps from the roof (`lampMark`s the world pools); nothing here owns a
 * PointLight. The one fire in the works is the furnace's tap hole (`plant.js`).
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the bench's instrument, cased up: the
 * one clean, bright thing in a weathered works (`M.case`). Pressing [E] hides the case and opens the table.
 *
 * NO SIGN STANDS IN THE WORKS. Nothing here carries lettering.
 *
 * @returns {{ group, bench, benchLocal, colliders }} `colliders` are host-local discs `{ lx, lz, r }` and boxes
 *   `{ lx, lz, hw, hd }`; the world turns them to its own frame.
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { HOST_PLAN, hostExtent } from './host-plan.js';
import { ROOMS } from './works-plan.js';
import { kitFor } from './kit.js';

/* ----------------------------------------------------------------- the bench */

/** The bench: the shared bay bench in the host's skin, dressed in the works' cast iron, its cased instrument for `kind`. */
export function buildKtBench(ctx, { kind = 'heap', plate = 'KET-01', skin = 'shelf' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin, plate,
    // The same dress the foundry room gave the table: cast-iron plate, blackened rims, firebrick trays.
    mats: { top: M.castIron, dark: M.darkIron, tray: M.firebrick },
    tagStyle: { fg: '#1e1a14', bg: '#d8c9a2' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.13, 22), M.glassDark, -0.62, height + 0.42, 0.072);
      if (kind === 'heap') {                  // three little heaps of ore on a tray
        add(new THREE.BoxGeometry(1.1, 0.04, 0.36), M.firebrick, 0.62, y0 + 0.02, 0.12);
        [M.ore, M.oreB, M.paint2].forEach((m, i) => add(new THREE.ConeGeometry(0.11, 0.16, 12), m, 0.34 + i * 0.28, y0 + 0.12, 0.12));
      } else if (kind === 'cards') {          // a stack of ion discs
        for (let k = 0; k < 4; k++) add(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 18), k % 2 ? M.paint2 : M.paintYellow, 0.5 + (k % 2) * 0.3, y0 + 0.02 + (k >> 1) * 0.035, 0.12);
      } else if (kind === 'pot') {            // a lidded pot on a small balance
        add(new THREE.BoxGeometry(0.6, 0.06, 0.4), M.caseDark, 0.55, y0 + 0.03, 0.12);
        add(new THREE.CylinderGeometry(0.17, 0.17, 0.3, 20), M.darkIron, 0.55, y0 + 0.21, 0.12);
        add(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 20), M.brass, 0.55, y0 + 0.38, 0.12);
      } else if (kind === 'board') {          // a card board on a stand
        add(new THREE.BoxGeometry(0.7, 0.4, 0.04), M.caseDark, 0.6, y0 + 0.24, 0.04, [-0.3, 0, 0]);
        for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.16, 0.08, 0.02), k % 2 ? M.paint2 : M.paintYellow, 0.4 + k * 0.2, y0 + 0.28, 0.07, [-0.3, 0, 0]);
      } else if (kind === 'ionic') {          // a beaker between two electrodes
        add(new THREE.CylinderGeometry(0.16, 0.14, 0.3, 20), M.glass, 0.55, y0 + 0.15, 0.12);
        for (const x of [0.46, 0.64]) add(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 6), M.copper, x, y0 + 0.24, 0.12);
      } else if (kind === 'burette') {        // a burette on a stand over a flask
        add(new THREE.CylinderGeometry(0.014, 0.014, 0.62, 8), M.caseDark, 0.78, y0 + 0.31, 0.04);
        add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 10), M.glass, 0.55, y0 + 0.46, 0.04);
        add(new THREE.CylinderGeometry(0.1, 0.16, 0.2, 18), M.glass, 0.55, y0 + 0.1, 0.04);
      } else {                                // gas tests: a splint holder and a tube rack
        add(new THREE.BoxGeometry(0.5, 0.04, 0.2), M.caseDark, 0.6, y0 + 0.02, 0.12);
        for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 10), M.glass, 0.44 + k * 0.16, y0 + 0.15, 0.12);
      }
    }
  });
}

/* --------------------------------------------------------------- start and finish */

/** A host's lamps: a bay's lamp is hung lower than a hall's, so it is dimmer. */
const BAY_LAMP = { intensity: 10, distance: 13 };

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const g = new THREE.Group();
  g.name = name;
  const bench = buildKtBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  const [x0, x1, z0, z1] = hostExtent(plan);
  const spec = ROOMS.find(r => r.id === plan.room);
  const room = { x0, x1, z0, z1, top: spec.top - spec.floor.y0 };
  const colliders = [{ lx: 0, lz: 0, hw: 2.4, hd: 0.65 }];
  /** Hang a lamp from the room's roof at (x, z), `y` over the floor. */
  const hang = (x, z, y = Math.min(3.6, room.top - 0.9), opts = BAY_LAMP) => k.pendant(g, x, y, z, room.top, opts);
  /** A body's footprint for the walk: a box by its centre and half sizes. */
  const solid = (lx, lz, hw, hd) => colliders.push({ lx, lz, hw, hd });
  const round = (lx, lz, r) => colliders.push({ lx, lz, r });
  return { k, M: w.M, g, bench, colliders, room, hang, solid, round };
}

/** The lamp over the plate, and the host handed back. */
const finish = (h) => {
  h.hang(0, -0.3, Math.min(3.5, h.room.top - 0.8));
  return { group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders };
};

/* ------------------------------------------------------------------------ shared pieces */

/** An open tank standing on the floor: four walls and the liquid lying level in it. */
function tank(h, x0, x1, z0, z1, { rim = 1.05, wall = 0.25, mat, liquid, level = 0.8 } = {}) {
  const { k, g } = h;
  k.box(g, [x1 - x0, rim, wall], mat, [(x0 + x1) / 2, rim / 2, z0 + wall / 2]);
  k.box(g, [x1 - x0, rim, wall], mat, [(x0 + x1) / 2, rim / 2, z1 - wall / 2]);
  for (const x of [x0 + wall / 2, x1 - wall / 2]) k.box(g, [wall, rim, z1 - z0 - wall * 2], mat, [x, rim / 2, (z0 + z1) / 2]);
  k.box(g, [x1 - x0 - wall * 2, 0.06, z1 - z0 - wall * 2], liquid, [(x0 + x1) / 2, level, (z0 + z1) / 2], null, false);
  h.solid((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2);
}

/** A drum standing on its end. */
const drum = (h, x, z, mat, y = 0) => {
  h.k.cyl(h.g, [0.29, 0.29, 0.88, 16], mat, [x, y + 0.44, z]);
  for (const dy of [0.28, 0.6]) h.k.cyl(h.g, [0.3, 0.3, 0.03, 16], h.M.darkSteel, [x, y + dy, z], null, false);
};

/** A vessel on four legs: a shell, a dished top and a cone to its outlet. Its footprint is a disc. */
function vessel(h, x, z, { r = 1.2, y0 = 1.0, body = 2.0, mat, legs = true, cone = 0.8 } = {}) {
  const { k, g, M } = h;
  k.cyl(g, [r, r, body, 22], mat, [x, y0 + body / 2, z]);
  k.cyl(g, [r * 0.5, r, 0.3, 22], mat, [x, y0 + body + 0.15, z]);
  if (cone) k.cyl(g, [r, 0.16, cone, 22], mat, [x, y0 - cone / 2, z]);
  for (const dy of [0.25, body - 0.25]) k.cyl(g, [r + 0.03, r + 0.03, 0.08, 22], M.darkSteel, [x, y0 + dy, z], null, false);
  if (legs) for (const [dx, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) k.post(g, x + dx * r * 0.72, z + dz * r * 0.72, y0 + 0.2, 0.12);
  h.round(x, z, r + 0.05);
}

/** A steel rack against a wall: uprights, shelves, and whatever `load(x, y, z, i, j)` puts on each shelf bay. */
function rack(h, x0, x1, z, { depth = 0.7, top = 4.0, shelves = [0.5, 1.5, 2.5, 3.4], bay = 1.8, load = null } = {}) {
  const { k, g, M } = h;
  const n = Math.max(1, Math.round((x1 - x0) / bay));
  const step = (x1 - x0) / n;
  for (let i = 0; i <= n; i++) for (const dz of [-depth / 2 + 0.04, depth / 2 - 0.04]) k.box(g, [0.07, top, 0.07], M.darkSteel, [x0 + i * step, top / 2, z + dz]);
  shelves.forEach((y, j) => {
    k.box(g, [x1 - x0, 0.05, depth], M.steel, [(x0 + x1) / 2, y, z]);
    if (load) for (let i = 0; i < n; i++) load(x0 + (i + 0.5) * step, y + 0.025, z, i, j);
  });
  h.solid((x0 + x1) / 2, z, (x1 - x0) / 2, depth / 2);
}

/* ------------------------------------------------------------------------ 1 */

/**
 * THE STORES. Everything that comes into the works is shelved and named here: racks of crates, carboys and drums the
 * length of the back wall, pallets waiting on the floor, a sorting counter. The plate has its back to the racks.
 */
export function buildStores(w) {
  const h = start(w, 'site-2', 'stores');
  const { k, M, g, room } = h;
  // The racks along the back wall, loaded shelf by shelf: crates low, carboys in their baskets, drums on the floor bay.
  rack(h, room.x0 + 0.5, room.x1 - 0.5, room.z0 + 0.45, {
    top: 4.3, bay: 2.1,
    load: (x, y, z, i, j) => {
      if (j === 3 && i % 3 === 1) return;
      if ((i + j) % 4 === 3) {
        for (const dx of [-0.5, 0, 0.5]) { k.cyl(g, [0.16, 0.2, 0.42, 12], M.glassDark, [x + dx, y + 0.21, z]); k.cyl(g, [0.05, 0.08, 0.14, 8], M.glassDark, [x + dx, y + 0.49, z], null, false); }
      } else {
        const wide = (i * 7 + j * 3) % 3;
        k.box(g, [0.8 + wide * 0.25, 0.55 + ((i + j) % 2) * 0.15, 0.5], (i + j) % 2 ? M.crate : M.crateB, [x - 0.3 + wide * 0.1, y + 0.3 + ((i + j) % 2) * 0.075, z]);
        if (wide < 2) k.box(g, [0.5, 0.4, 0.45], (i + j) % 2 ? M.crateB : M.crate, [x + 0.6, y + 0.2, z]);
      }
    }
  });
  // Pallets on the floor either side of the plate, stacked two high.
  for (const [x, z, n] of [[-5.2, 0.2, 2], [-8.4, 0.4, 1], [5.4, 0.2, 2], [6.6, 4.2, 1]]) {
    k.box(g, [1.3, 0.14, 1.1], M.timber, [x, 0.07, z]);
    for (let i = 0; i < n; i++) k.box(g, [1.1, 0.7, 0.9], i % 2 ? M.crate : M.crateB, [x, 0.49 + i * 0.7, z], [0, i * 0.12, 0]);
    h.solid(x, z, 0.7, 0.6);
  }
  // The sorting counter along the front wall, and the drums that are still to be opened.
  const cz = room.z1 - 0.6;
  k.box(g, [8, 0.08, 0.9], M.timber, [-3.5, 0.92, cz]);
  for (const x of [-7.3, -3.5, 0.3]) for (const dz of [-0.36, 0.36]) k.box(g, [0.08, 0.88, 0.08], M.darkSteel, [x, 0.44, cz + dz]);
  for (const [x, s] of [[-6.4, 0.5], [-4.9, 0.36], [-2.2, 0.44]]) k.box(g, [s, s * 0.8, s], M.crateB, [x, 0.96 + s * 0.4, cz]);
  k.box(g, [0.5, 0.3, 0.34], M.caseDark, [-0.6, 1.11, cz]);                          // the stores' own balance
  k.cyl(g, [0.16, 0.16, 0.02, 16], M.brass, [-0.6, 1.27, cz], null, false);
  h.solid(-3.5, cz, 4.0, 0.5);
  for (const [x, z, m] of [[5.2, cz - 0.1, M.drumB], [5.9, cz - 0.2, M.paintYellow], [5.5, cz - 0.85, M.drumB], [7.6, cz - 0.2, M.steel], [7.5, cz - 0.95, M.paintYellow]]) drum(h, x, z, m);
  h.solid(6.4, cz - 0.5, 1.6, 0.8);
  // A rolling ladder at the racks.
  for (const dx of [-0.3, 0.3]) k.strut(g, [5.0 + dx, 0.05, -1.3], [5.0 + dx, 3.4, -2.5], 0.03, M.steel, 6);
  for (let i = 1; i < 9; i++) k.box(g, [0.6, 0.03, 0.12], M.steel, [5.0, i * 0.37, -1.3 - i * 0.13], null, false);
  h.solid(5.0, -1.8, 0.4, 0.6);
  h.hang(-7, -1.4, 4.3);
  h.hang(5.6, 4.6, 4.3);
  return finish(h);
}

/* ------------------------------------------------------------------------ 2 */

/**
 * THE SCALE BAY. Every charge is weighed in here: a weighbridge let into the floor, the sealed charging pot standing on
 * it under its hoist frame, the scale's indicator column, the test weights along the wall.
 */
export function buildScaleBay(w) {
  const h = start(w, 'site-3', 'scale-bay');
  const { k, M, g, room } = h;
  const WZ = -5.2;
  k.box(g, [5.6, 0.3, 3.4], M.steel, [0, 0.15, WZ]);                                  // the weighbridge deck
  k.box(g, [5.6, 0.06, 3.4], M.deckPlate, [0, 0.33, WZ]);
  for (const sx of [-1, 1]) k.box(g, [1.4, 0.06, 3.2], M.deckPlate, [sx * 3.45, 0.17, WZ], [0, 0, sx * -0.21]);
  for (const [dx, dz] of [[-2.5, -1.5], [2.5, -1.5], [-2.5, 1.5], [2.5, 1.5]]) k.box(g, [0.3, 0.1, 0.3], M.brass, [dx, 0.05, WZ + dz], null, false);
  k.cyl(g, [1.3, 1.3, 1.5, 28], M.darkIron, [0, 1.3, WZ]);                            // the pot
  k.cyl(g, [1.4, 1.4, 0.16, 28], M.darkSteel, [0, 0.62, WZ]);
  k.cyl(g, [1.4, 1.4, 0.16, 28], M.darkSteel, [0, 2.0, WZ]);
  k.cone(g, [1.35, 0.7, 28], M.darkIron, [0, 2.45, WZ]);                              // the sealed lid
  k.cyl(g, [0.12, 0.12, 0.3, 10], M.brass, [0, 2.95, WZ]);
  k.strut(g, [0, 3.1, WZ], [0, 5.0, WZ], 0.02, M.darkSteel, 5);                       // the hoist chain
  for (const sx of [-1, 1]) {                                                         // the hoist frame
    k.bar(g, [sx * 3.9, 0.05, WZ - 1.2], [sx * 0.3, 5.2, WZ], 0.14, M.darkSteel);
    k.bar(g, [sx * 3.9, 0.05, WZ + 1.2], [sx * 0.3, 5.2, WZ], 0.14, M.darkSteel);
    for (const dz of [-1.2, 1.2]) { k.footing(g, sx * 3.9, WZ + dz, 0.4); h.round(sx * 3.9, WZ + dz, 0.3); }
  }
  k.beam(g, [-1.4, 5.2, WZ], [1.4, 5.2, WZ], { d: 0.3, f: 0.2 });
  k.box(g, [0.5, 0.4, 0.4], M.rusted, [0, 4.9, WZ]);
  h.solid(0, WZ, 4.2, 1.8);                                                         // out to the feet of the frame
  const cx = -3.9;                                                                    // the indicator column
  k.footing(g, cx, -1.7, 0.3);
  k.cyl(g, [0.08, 0.1, 1.3, 10], M.darkSteel, [cx, 0.7, -1.7]);
  k.box(g, [0.55, 0.45, 0.25], M.caseDark, [cx, 1.6, -1.7]);
  k.cyl(g, [0.17, 0.17, 0.03, 20], M.brass, [cx, 1.6, -1.56], [Math.PI / 2, 0, 0], false);
  h.round(cx, -1.7, 0.35);
  // The test weights: cast blocks on a low stand along the left wall, and a tall cabinet for the small ones.
  const lx = room.x0 + 0.7;
  k.box(g, [0.9, 0.5, 6], M.concrete, [lx, 0.25, 1]);
  for (let i = 0; i < 7; i++) {
    const s = 0.3 + (i % 3) * 0.09;
    k.cyl(g, [s, s * 1.1, s * 1.5, 14], M.castIron, [lx, 0.5 + s * 0.75, -1.5 + i * 0.84]);
    k.cyl(g, [0.05, 0.05, 0.12, 6], M.darkSteel, [lx, 0.5 + s * 1.5 + 0.06, -1.5 + i * 0.84], null, false);
  }
  h.solid(lx, 1, 0.5, 3.1);
  k.box(g, [2.2, 2.1, 1.0], M.steel, [-7.5, 1.05, -2.9]);                             // the weights cabinet
  k.box(g, [2.24, 0.06, 1.04], M.darkSteel, [-7.5, 2.13, -2.9]);
  h.solid(-7.5, -2.9, 1.15, 0.55);
  // A charging bucket waiting its turn, and the sand bins by the two doors.
  k.cyl(g, [1.15, 0.85, 2.0, 20], M.rusted, [7.5, 1.2, -2.9]);
  k.cyl(g, [1.2, 1.2, 0.1, 20], M.darkSteel, [7.5, 2.2, -2.9], null, false);
  k.box(g, [2.0, 0.2, 2.0], M.darkSteel, [7.5, 0.1, -2.9]);
  h.round(7.5, -2.9, 1.25);
  for (const sx of [-1, 1]) {
    k.box(g, [2.4, 1.9, 1.5], M.concrete, [sx * 8.9, 0.95, 13.4]);
    k.cone(g, [0.9, 0.5, 12], M.paint2, [sx * 8.9, 2.1, 13.4]);
    h.solid(sx * 8.9, 13.4, 1.25, 0.8);
  }
  h.hang(0, WZ + 2.4, 5.6);
  h.hang(7.2, 8, 5.2);
  return finish(h);
}

/* ------------------------------------------------------------------------ 3 */

/**
 * THE CONTROL CABIN. The furnace recipe hangs on the wall behind the plate: a board of cards in rows. Relay cabinets
 * stand along the left wall, a desk of gauges under the long window that looks out over the nave.
 */
export function buildControlCabin(w) {
  const h = start(w, 'site-4', 'control-cabin');
  const { k, M, g, room } = h;
  const bz = room.z0 + 0.09;
  k.box(g, [6.4, 2.2, 0.1], M.caseDark, [0.2, 1.9, bz]);                              // the recipe board
  for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) {
    if ((r * 3 + c) % 5 === 4) continue;
    k.box(g, [0.4, 0.22, 0.04], (r + c) % 3 ? M.paint2 : M.paintYellow, [-2.5 + c * 0.6, 1.05 + r * 0.42, bz + 0.07], null, false);
  }
  k.box(g, [6.6, 0.08, 0.16], M.darkSteel, [0.2, 0.76, bz + 0.03], null, false);     // its card rail
  // Relay cabinets down the left wall, their doors vented.
  for (let i = 0; i < 5; i++) {
    const z = -2.4 + i * 1.5;
    k.box(g, [0.7, 2.1, 1.4], i % 2 ? M.steel : M.clad, [room.x0 + 0.4, 1.05, z]);
    for (let v = 0; v < 4; v++) k.box(g, [0.02, 0.03, 1.0], M.darkSteel, [room.x0 + 0.76, 1.5 + v * 0.1, z], null, false);
    k.box(g, [0.03, 0.2, 0.06], M.brass, [room.x0 + 0.77, 1.0, z + 0.5], null, false);
  }
  h.solid(room.x0 + 0.4, 0.6, 0.45, 3.8);
  // The cable tray from the cabinets across the ceiling to the board.
  k.box(g, [0.4, 0.06, 7.2], M.darkSteel, [room.x0 + 0.5, 4.2, 0.6], null, false);
  k.box(g, [room.x1 - room.x0 - 1, 0.06, 0.4], M.darkSteel, [(room.x0 + room.x1) / 2, 4.2, -2.7], null, false);
  // The gauge desk under the window: a sloped panel of dials, a row of hand wheels.
  const dx = room.x1 - 0.55;
  k.box(g, [0.9, 0.8, 7], M.steel, [dx, 0.4, 3.2]);
  k.box(g, [0.9, 0.06, 7], M.darkSteel, [dx - 0.05, 0.98, 3.2], [0, 0, 0.35]);
  for (let i = 0; i < 8; i++) {
    k.cyl(g, [0.13, 0.13, 0.03, 18], i % 3 ? M.paint2 : M.brass, [dx - 0.07, 1.02, 0.2 + i * 0.85], [0, 0, 0.35 - Math.PI / 2], false);
    if (i % 2 === 0) k.cyl(g, [0.11, 0.11, 0.03, 12], M.paintRed, [dx - 0.5, 0.6, 0.6 + i * 0.85], [0, 0, Math.PI / 2], false);
  }
  h.solid(dx, 3.2, 0.5, 3.6);
  // A stool, and the speaking tube down to the cast house.
  k.cyl(g, [0.2, 0.2, 0.05, 14], M.timber, [3.9, 0.62, 5.2]);
  k.cyl(g, [0.03, 0.14, 0.6, 8], M.darkSteel, [3.9, 0.3, 5.2]);
  h.round(3.9, 5.2, 0.25);
  k.pipe(g, [[-4.6, 1.5, bz + 0.1], [-4.6, 4.0, bz + 0.1], [-4.6, 4.0, bz + 0.5]], 0.04, M.brass);
  k.cone(g, [0.09, 0.16, 10], M.brass, [-4.6, 1.42, bz + 0.1]);
  h.hang(-5.4, 2.4, 3.9);
  return finish(h);
}

/* ------------------------------------------------------------------------ 4 */

/**
 * THE SUMP CELLAR. The works' effluent settles here, under the floor: a walled basin against the wall behind the plate,
 * the bottoms of two tanks coming through the ceiling over it, a thickener and a dosing tank in the corners, a launder
 * along the wall and the pump that lifts the clear water back out.
 */
export function buildSumpCellar(w) {
  const h = start(w, 'site-5', 'sump-cellar');
  const { k, M, g, room } = h;
  tank(h, -4.6, 4.6, room.z0 + 0.1, -2.7, { mat: M.concrete, liquid: M.pool, rim: 1.0, level: 0.72, wall: 0.3 });
  for (const x of [-2.4, 2.4]) {                                                      // the tank bottoms through the ceiling
    k.cyl(g, [1.5, 0.3, 1.5, 24], M.steel, [x, room.top - 0.75, -4.2]);
    k.cyl(g, [0.14, 0.14, room.top - 1.5 - 1.2, 10], M.rusted, [x, (room.top - 1.5 + 1.2) / 2, -4.2]);
    k.cyl(g, [0.22, 0.22, 0.14, 10], M.brass, [x, 2.0, -4.2], null, false);
  }
  // The thickener (back left) and the dosing tank (back right), each on legs with its outlet over a tub.
  vessel(h, -7.6, -3.1, { r: 1.5, y0: 1.3, body: 2.0, mat: M.steel, cone: 1.0 });
  vessel(h, 6.6, -3.2, { r: 1.2, y0: 1.2, body: 2.2, mat: M.clad, cone: 0.8 });
  k.pipe(g, [[-6.2, 2.4, -3.1], [-5.0, 2.4, -3.1], [-5.0, 1.2, -3.4]], 0.08, M.rusted);
  k.pipe(g, [[5.5, 2.2, -3.2], [4.9, 2.2, -3.2], [4.9, 1.2, -3.5]], 0.06, M.copper);
  // The launder along the right wall: a steel trough on brackets, falling toward the basin.
  const tx = room.x1 - 0.5;
  for (const z of [0, 3, 6, 9]) { k.box(g, [0.5, 0.06, 0.06], M.darkSteel, [tx, 1.3 + z * 0.03, z]); k.post(g, tx - 0.2, z, 1.3 + z * 0.03, 0.08); }
  k.bar(g, [tx, 1.42, -2.4], [tx, 1.72, 10], 0.34, M.rusted);
  h.solid(tx - 0.1, 3.8, 0.4, 6.4);
  // The pump set by the front wall, its riser going up through the ceiling; a filter vessel beside it.
  const px = 4.4, pz = room.z1 - 1.3;
  k.box(g, [2.2, 0.25, 1.1], M.concrete, [px, 0.125, pz]);
  k.cyl(g, [0.38, 0.38, 0.9, 16], M.drumB, [px - 0.5, 0.63, pz], [0, 0, Math.PI / 2]);
  k.box(g, [0.6, 0.6, 0.6], M.darkSteel, [px + 0.45, 0.55, pz]);
  k.pipe(g, [[px + 0.45, 0.85, pz], [px + 0.45, 1.6, pz], [px + 0.45, 1.6, pz + 0.9], [px + 0.45, room.top, pz + 0.9]], 0.1, M.rusted);
  h.solid(px, pz, 1.15, 0.6);
  vessel(h, 6.0, 10.4, { r: 0.9, y0: 0.9, body: 2.0, mat: M.rusted, cone: 0.5 });
  // The filter press on the other side of the way in: a frame of plates between two heads.
  k.box(g, [3.2, 0.25, 1.1], M.darkSteel, [-6.3, 0.5, 10.6]);
  for (const x of [-7.8, -4.8]) k.box(g, [0.25, 1.9, 1.2], M.castIron, [x, 0.95, 10.6]);
  for (let i = 0; i < 12; i++) k.box(g, [0.1, 1.2, 1.0], i % 2 ? M.paint2 : M.clad, [-7.4 + i * 0.2, 1.25, 10.6], null, false);
  for (const dz of [-0.5, 0.5]) k.bar(g, [-7.8, 1.9, 10.6 + dz], [-4.8, 1.9, 10.6 + dz], 0.08, M.steel);
  h.solid(-6.3, 10.6, 1.7, 0.65);
  // Sludge tubs under the thickener, and the gully the floor drains to.
  for (const [x, z] of [[-8.6, 0.6], [-7.3, 0.9]]) { k.tube(g, [0.5, 0.75], M.firebrick, [x, 0.4, z]); k.cyl(g, [0.5, 0.5, 0.05, 18], M.darkIron, [x, 0.03, z]); h.round(x, z, 0.55); }
  k.box(g, [0.3, 0.02, 9], M.darkIron, [room.x0 + 1.6, 0.01, 4], null, false);
  h.hang(-3.4, -1.2, 3.9);
  h.hang(3.6, 7.5, 3.9);
  return finish(h);
}

/* ------------------------------------------------------------------------ 5 */

/**
 * THE CHARGE BANK. The charge is weighed into the skip here, 3.2 m over the works floor: three bunkers on the wall
 * behind the plate, the weigh hopper on its load cells, stock bays of ore, coke and stone along the east wall, a
 * charging car on the bank's rail, and the skip's incline climbing toward the furnace top.
 */
export function buildChargeBank(w) {
  const h = start(w, 'site-6', 'charge-bank');
  const { k, M, g, room } = h;
  // The bunkers: concrete bins on piers, each with a chute and its gate over the bank.
  [[-5.4, M.ore], [0, M.slagRock], [5.4, M.paint2]].forEach(([x, mat]) => {
    k.box(g, [4.2, 3.4, 3.6], M.concrete, [x, 4.9, -5.6]);
    k.cyl(g, [1.7, 0.45, 1.5, 4], M.rusted, [x, 2.45, -5.2], [0, Math.PI / 4, 0]);
    k.box(g, [0.9, 0.5, 0.9], M.darkSteel, [x, 1.55, -5.2]);                          // the gate
    k.box(g, [0.5, 0.06, 1.5], mat, [x, 1.34, -4.4], [0.5, 0, 0], false);             // what has run out under it
    k.cone(g, [0.8, 0.5, 10], mat, [x, 0.25, -3.9]);
    for (const dx of [-1.9, 1.9]) for (const dz of [-1.5, 1.5]) k.box(g, [0.4, 3.2, 0.4], M.concrete, [x + dx, 1.6, -5.6 + dz]);
  });
  h.solid(0, -5.2, 7.7, 2.3);
  // The weigh hopper on its three load cells, and its readout.
  const hx = 5.7, hz = -1.0;
  k.cyl(g, [1.0, 0.3, 1.5, 20], M.steel, [hx, 1.45, hz]);
  k.cyl(g, [1.0, 1.0, 0.9, 20], M.steel, [hx, 2.65, hz]);
  for (const [dx, dz] of [[0.85, 0.75], [-0.85, 0.75], [0, -1.1]]) { k.box(g, [0.2, 1.3, 0.2], M.darkSteel, [hx + dx, 0.65, hz + dz]); k.box(g, [0.26, 0.12, 0.26], M.brass, [hx + dx, 1.36, hz + dz]); }
  k.box(g, [0.5, 0.5, 0.25], M.caseDark, [hx - 1.7, 1.2, hz + 1.0]);
  k.post(g, hx - 1.7, hz + 1.0, 1.0, 0.1);
  h.round(hx, hz, 1.2);
  // The breeze bin on the other side of the plate.
  k.box(g, [1.8, 2.0, 1.6], M.rusted, [-5.8, 1.0, -1.1]);
  k.cone(g, [0.7, 0.4, 10], M.slagRock, [-5.8, 2.15, -1.1]);
  h.solid(-5.8, -1.1, 0.95, 0.85);
  // The stock bays along the east wall: push walls, and a heap in each.
  const bx = room.x1 - 2.2;
  [6.5, 10.9, 15.3, 19.7].forEach(z => k.box(g, [4.4, 2.2, 0.35], M.concrete, [bx, 1.1, z]));
  [[8.7, M.ore, 1.5], [13.1, M.slagRock, 1.7], [17.5, M.paint2, 1.4]].forEach(([z, mat, r]) => k.cone(g, [r, r * 0.95, 14], mat, [bx + 0.4, r * 0.47, z]));
  h.solid(bx, 13.1, 2.3, 6.8);
  // The bank's rail, level along the bank, and a charging car standing on it.
  for (const dz of [-0.4, 0.4]) k.box(g, [14, 0.1, 0.07], M.steel, [-6, 0.05, 12.6 + dz], null, false);
  for (let x = -12.6; x <= 0.8; x += 0.8) k.box(g, [0.16, 0.05, 1.2], M.timber, [x, 0.025, 12.6], null, false);
  k.box(g, [2.4, 1.5, 1.4], M.rusted, [0.4, 1.25, 12.6]);
  k.box(g, [2.5, 0.16, 1.1], M.darkSteel, [0.4, 0.42, 12.6]);
  k.cone(g, [0.9, 0.5, 10], M.ore, [0.4, 2.2, 12.6]);
  for (const dx of [-0.8, 0.8]) for (const dz of [-0.4, 0.4]) k.cyl(g, [0.24, 0.24, 0.08, 14], M.darkIron, [0.4 + dx, 0.25, 12.6 + dz], [Math.PI / 2, 0, 0]);
  h.solid(0.4, 12.6, 1.3, 0.8);
  // The skip's incline: two rails on trestle bents from the bank up toward the furnace top, the skip part way up.
  const sx = 9.0;
  const rise = t => [1.2 + t * 6.6, 3.2 - t * 10.2];
  for (const dx of [-0.42, 0.42]) k.bar(g, [sx + dx - 0.6, rise(0)[0], rise(0)[1]], [sx + dx - 0.6, rise(1)[0], rise(1)[1]], 0.1, M.darkSteel);
  for (const t of [0.15, 0.4, 0.65, 0.9]) {
    const [y, z] = rise(t);
    k.box(g, [1.2, 0.12, 0.14], M.darkSteel, [sx - 0.6, y - 0.08, z]);
    for (const dx of [-0.5, 0.5]) k.box(g, [0.14, y - 0.1, 0.14], M.rusted, [sx - 0.6 + dx, (y - 0.1) / 2, z]);
  }
  k.box(g, [0.9, 0.8, 1.3], M.rusted, [sx - 0.6, rise(0.45)[0] + 0.5, rise(0.45)[1]], [0.575, 0, 0]);
  h.solid(sx - 0.6, -2.0, 0.7, 5.0);
  h.hang(-5.4, -2.6, 2.7);
  h.hang(5.4, 3.4, 4.2);
  return finish(h);
}

/* ------------------------------------------------------------------------ 6 */

/**
 * THE PICKLING BAY. Scale is taken off the iron in acid here: the long acid tank and the rinse tank against the wall
 * behind the plate, a gantry over them carrying the burettes that dose the bath, the hoist and its basket, the fume
 * risers, the carboys the acid comes in and the rack the pickled plates dry on.
 */
export function buildPicklingBay(w) {
  const h = start(w, 'site-7', 'pickling-bay');
  const { k, M, g, room } = h;
  const z0 = room.z0 + 0.1, z1 = -2.75;
  tank(h, -8.0, 2.6, z0, z1, { mat: M.paintYellow, liquid: M.acid, rim: 1.1, level: 0.86 });
  tank(h, 3.6, 10.0, z0, z1, { mat: M.concrete, liquid: M.pool, rim: 1.1, level: 0.86 });
  const zc = (z0 + z1) / 2;
  // The gantry: four posts, two runway beams, a cross beam the burettes hang from.
  for (const x of [-8.3, 10.3]) for (const z of [z0 + 0.25, -2.35]) { k.post(g, x, z, 4.5, 0.2); h.round(x, z, 0.22); }
  for (const z of [z0 + 0.25, -2.35]) k.beam(g, [-8.4, 4.6, z], [10.4, 4.6, z], { d: 0.3, f: 0.2 });
  k.box(g, [0.2, 0.2, z1 - z0], M.steel, [-2.6, 4.5, zc]);
  for (const x of [-4.6, -2.6, -0.6]) {                                               // three burettes over the acid
    k.cyl(g, [0.045, 0.045, 2.3, 12], M.glass, [x, 3.15, zc], null, false);
    k.box(g, [0.14, 0.14, 0.14], M.brass, [x, 1.95, zc]);
    k.box(g, [0.18, 0.4, 0.18], M.caseDark, [x, 4.25, zc]);
    k.box(g, [0.06, 0.06, 0.3], M.steel, [x, 4.45, zc], null, false);
  }
  k.box(g, [0.8, 0.5, 0.6], M.rusted, [6.8, 4.25, zc]);                               // the hoist's crab, its chain and basket
  k.strut(g, [6.8, 4.0, zc], [6.8, 2.3, zc], 0.025, M.darkSteel, 5);
  k.box(g, [1.2, 0.5, 0.9], M.mesh, [6.8, 2.05, zc], null, false);
  for (const dx of [-0.6, 0.6]) for (const dz of [-0.45, 0.45]) k.box(g, [0.04, 0.5, 0.04], M.darkSteel, [6.8 + dx, 2.05, zc + dz], null, false);
  // The fume risers either side of the plate, up through the roof.
  for (const x of [-6.9, 7.0]) {
    k.box(g, [1.0, room.top - 0.1, 0.7], M.clad, [x, (room.top - 0.1) / 2 + 0.05, -2.3]);
    k.box(g, [1.1, 0.5, 0.8], M.darkSteel, [x, 1.3, -2.3], null, false);
    h.solid(x, -2.3, 0.55, 0.4);
  }
  // The carboys the acid comes in, in their baskets, on a rack along the left wall.
  const lx = room.x0 + 0.5;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    const z = 1.2 + i * 1.0;
    if ((i + j) % 5 === 4) continue;
    k.cyl(g, [0.3, 0.26, 0.5, 14], M.timber, [lx, 0.35 + j * 1.0, z]);
    k.cyl(g, [0.2, 0.25, 0.4, 12], M.glassDark, [lx, 0.72 + j * 1.0, z]);
  }
  for (const z of [0.6, 3.7, 6.8]) for (const dx of [-0.35, 0.35]) k.box(g, [0.06, 2.0, 0.06], M.darkSteel, [lx + dx, 1.0, z]);
  k.box(g, [0.8, 0.05, 6.4], M.steel, [lx, 1.05, 3.7]);
  k.box(g, [0.8, 0.05, 6.4], M.steel, [lx, 0.06, 3.7]);
  h.solid(lx, 3.7, 0.45, 3.3);
  // The drying rack, plates on edge; and the soda bin for spills.
  k.box(g, [2.6, 0.1, 1.0], M.darkSteel, [5.2, 0.3, 10.6]);
  for (const dx of [-1.25, 1.25]) k.box(g, [0.08, 2.0, 0.9], M.darkSteel, [5.2 + dx, 1.0, 10.6]);
  k.box(g, [2.6, 0.08, 0.08], M.darkSteel, [5.2, 2.0, 10.6]);
  for (let i = 0; i < 9; i++) k.box(g, [0.04, 1.4 + (i % 3) * 0.12, 0.8], i % 4 ? M.ingot : M.steel, [4.2 + i * 0.25, 1.05 + (i % 3) * 0.06, 10.6], [0, 0, 0.06]);
  h.solid(5.2, 10.6, 1.35, 0.55);
  k.box(g, [2.0, 1.8, 1.4], M.timber, [-6.2, 0.9, 10.8]);
  k.box(g, [2.1, 0.08, 1.5], M.darkSteel, [-6.2, 1.84, 10.8], [0.12, 0, 0]);
  k.cone(g, [0.6, 0.3, 10], M.paint2, [-4.7, 0.15, 10.9]);
  h.solid(-6.2, 10.8, 1.05, 0.75);
  h.hang(-4, 1.6, 4.4);
  h.hang(6.5, 4.8, 4.4);
  return finish(h);
}

/* ------------------------------------------------------------------------ 7 */

/**
 * THE TAPPING PIT. 2.2 m under the cast house floor, under a hood: the iron runner comes over the pit's lip to a ladle
 * on its car, pig moulds lie in the sand, the slag pot waits, and two flues rise behind the plate from the gas main.
 */
export function buildTappingPit(w) {
  const h = start(w, 'site-8', 'tapping-pit');
  const { k, M, g, room } = h;
  // The gas main along the back wall and the two flues rising from it through the hood.
  const mz = room.z0 + 0.55;
  k.cyl(g, [0.45, 0.45, 15, 16], M.rusted, [0.5, 3.3, mz], [0, 0, Math.PI / 2]);
  for (const x of [-6.5, -1.5, 3.5, 7.5]) { k.box(g, [0.2, 2.85, 0.5], M.darkSteel, [x, 1.425, mz]); k.box(g, [0.5, 0.1, 0.7], M.darkSteel, [x, 2.85, mz]); }
  for (const x of [-4.2, 5.2]) {
    k.cyl(g, [0.5, 0.5, room.top - 3.7, 16], M.clad, [x, (room.top + 3.7) / 2, mz]);
    k.cyl(g, [0.6, 0.6, 0.2, 16], M.darkSteel, [x, 4.6, mz], null, false);
  }
  h.solid(0.5, mz, 7.6, 0.5);
  // The runner: a lined trough from the lip of the pit (the cast house floor, 2.2 m up) down to the ladle.
  const LX = -5.6, LZ = 0.4;
  k.bar(g, [room.x0 + 0.35, 2.5, LZ], [LX + 0.5, 1.95, LZ], 0.5, M.darkIron);
  k.bar(g, [room.x0 + 0.35, 2.72, LZ], [LX + 0.5, 2.17, LZ], 0.24, M.firebrick);
  for (const x of [room.x0 + 0.6, LX - 0.9]) { k.box(g, [0.16, 2.1, 0.16], M.darkSteel, [x, 1.05, LZ + 0.55]); k.box(g, [0.16, 2.1, 0.16], M.darkSteel, [x, 1.05, LZ - 0.55]); }
  // The ladle on its car, on rails the length of the pit.
  for (const dx of [-0.6, 0.6]) k.box(g, [0.08, 0.12, room.z1 - room.z0 - 2.2], M.steel, [LX + dx, 0.06, (room.z0 + room.z1) / 2 + 0.6], null, false);
  k.box(g, [2.0, 0.3, 2.2], M.darkSteel, [LX, 0.34, LZ]);
  for (const dx of [-0.6, 0.6]) for (const dz of [-0.7, 0.7]) k.cyl(g, [0.2, 0.2, 0.1, 14], M.darkIron, [LX + dx, 0.2, LZ + dz], [0, 0, Math.PI / 2]);
  k.cyl(g, [1.1, 0.9, 1.4, 24], M.darkIron, [LX, 1.2, LZ]);
  k.cyl(g, [1.15, 1.15, 0.12, 24], M.rusted, [LX, 1.9, LZ], null, false);
  for (const dz of [-1.15, 1.15]) k.cyl(g, [0.09, 0.09, 0.3, 8], M.darkSteel, [LX, 1.4, LZ + dz], [Math.PI / 2, 0, 0]);
  h.solid(LX, LZ, 1.2, 1.2);
  // The pig bed: moulds in the sand floor to the right of the plate.
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    k.box(g, [1.3, 0.16, 0.42], M.castIron, [4.4 + j * 1.6, 0.08, 0.2 + i * 0.7], null, false);
    if ((i + j) % 3) k.box(g, [1.1, 0.1, 0.26], M.ingot, [4.4 + j * 1.6, 0.17, 0.2 + i * 0.7], null, false);
  }
  k.box(g, [3.6, 0.1, 4.8], M.paint2, [5.2, 0.05, 1.95], null, false);
  // The slag pot (back right), a sand bin (front left), and the gas-test stand beside the plate.
  k.cyl(g, [1.0, 0.55, 1.5, 18], M.darkIron, [6.4, 1.15, -1.9]);
  k.box(g, [1.7, 0.4, 1.7], M.darkSteel, [6.4, 0.2, -1.9]);
  for (const dx of [-1.05, 1.05]) k.cyl(g, [0.08, 0.08, 0.3, 8], M.darkSteel, [6.4 + dx, 1.5, -1.9], [0, 0, Math.PI / 2]);
  h.round(6.4, -1.9, 1.1);
  k.box(g, [2.2, 2.0, 1.6], M.concrete, [-7.3, 1.0, 11.9]);
  k.cone(g, [0.9, 0.45, 12], M.paint2, [-7.3, 2.2, 11.9]);
  h.solid(-7.3, 11.9, 1.15, 0.85);
  k.box(g, [1.2, 0.85, 0.7], M.steel, [3.7, 0.425, -1.5]);
  for (let i = 0; i < 4; i++) k.cyl(g, [0.045, 0.045, 0.36, 8], M.glass, [3.3 + i * 0.26, 1.03, -1.5], null, false);
  k.box(g, [1.0, 0.04, 0.2], M.caseDark, [3.7, 0.87, -1.5], null, false);
  h.solid(3.7, -1.5, 0.65, 0.4);
  // Tapping bars leaning in the corner by the way in.
  for (let i = 0; i < 4; i++) k.strut(g, [room.x1 - 0.5, 0.05, 8.2 + i * 0.25], [room.x1 - 0.12, 3.2, 8.3 + i * 0.25], 0.025, M.darkSteel, 5);
  h.hang(-4.6, 3.4, 4.6);
  h.hang(4.8, 6.5, 4.6);
  return finish(h);
}

/* ------------------------------------------------------------------------ 8 */

/**
 * THE REFINING BAY. Metal is thrown down out of solution here: two precipitation vats against the wall behind the
 * plate under the reagent manifold, header tanks on their stands, a settling cone, the bars that came of it stacked by
 * the wall.
 */
export function buildRefiningBay(w) {
  const h = start(w, 'site-9', 'refining-bay');
  const { k, M, g, room } = h;
  const z0 = room.z0 + 0.1, z1 = -2.75, zc = (z0 + z1) / 2;
  tank(h, -8.6, -0.5, z0, z1, { mat: M.concrete, liquid: M.pool, rim: 1.15, level: 0.9 });
  tank(h, 0.5, 8.6, z0, z1, { mat: M.darkSteel, liquid: M.acid, rim: 1.15, level: 0.9 });
  // The manifold over the vats: a pipe on a gantry, a feed dropping to each vat through a brass cock.
  for (const x of [-8.9, 8.9]) for (const z of [z0 + 0.25, -2.35]) { k.post(g, x, z, 4.3, 0.18); h.round(x, z, 0.2); }
  for (const z of [z0 + 0.25, -2.35]) k.beam(g, [-9.0, 4.4, z], [9.0, 4.4, z], { d: 0.28, f: 0.18 });
  k.cyl(g, [0.11, 0.11, 17.4, 12], M.copper, [0, 4.1, zc], [0, 0, Math.PI / 2]);
  for (const x of [-6.6, -2.6, 2.6, 6.6]) {
    k.cyl(g, [0.06, 0.06, 1.9, 10], M.copper, [x, 3.15, zc]);
    k.cyl(g, [0.12, 0.12, 0.18, 10], M.brass, [x, 2.2, zc]);
    k.box(g, [0.3, 0.04, 0.04], M.brass, [x, 2.3, zc], null, false);
  }
  // The header tanks on their stands, either side of the plate, piped up to the manifold.
  for (const [x, mat] of [[-7.2, M.clad], [7.2, M.paintYellow]]) {
    k.box(g, [1.3, 1.0, 0.9], mat, [x, 2.5, -2.2]);
    for (const dx of [-0.55, 0.55]) for (const dz of [-0.35, 0.35]) k.box(g, [0.1, 2.0, 0.1], M.darkSteel, [x + dx, 1.0, -2.2 + dz]);
    k.box(g, [1.3, 1.2, 0.06], M.mesh, [x, 1.0, -1.82], null, false);
    k.pipe(g, [[x, 3.0, -2.2], [x, 4.1, -2.2], [x, 4.1, zc]], 0.05, M.copper);
    h.solid(x, -2.2, 0.7, 0.5);
  }
  // The settling cone by the front wall, and the bars that have come of the vats, stacked on timbers.
  vessel(h, 8.2, 12.9, { r: 1.3, y0: 1.5, body: 1.6, mat: M.steel, cone: 1.2 });
  k.box(g, [2.4, 0.14, 1.6], M.timber, [-8.3, 0.07, 13.0]);
  for (let row = 0; row < 8; row++) for (let i = 0; i < 4; i++) k.box(g, [0.5, 0.2, 1.4], (row + i) % 5 ? M.ingot : M.copper, [-9.2 + i * 0.58 + (row % 2) * 0.05, 0.24 + row * 0.2, 13.0], null, row > 5);
  h.solid(-8.3, 13.0, 1.25, 0.85);
  // The filter along the right wall, its frames between two heads; carboys of reagent beside the way in.
  const fx = room.x1 - 0.8;
  k.box(g, [1.0, 0.25, 4.0], M.darkSteel, [fx, 0.5, 6.4]);
  for (const z of [4.5, 8.3]) k.box(g, [1.2, 1.9, 0.25], M.castIron, [fx, 0.95, z]);
  for (let i = 0; i < 16; i++) k.box(g, [1.0, 1.2, 0.1], i % 2 ? M.paint2 : M.clad, [fx, 1.25, 4.9 + i * 0.2], null, false);
  h.solid(fx, 6.4, 0.65, 2.1);
  for (const [x, z] of [[room.x0 + 0.6, 8.2], [room.x0 + 0.6, 9.1], [room.x0 + 1.4, 8.6]]) {
    k.cyl(g, [0.3, 0.26, 0.5, 14], M.timber, [x, 0.25, z]);
    k.cyl(g, [0.2, 0.25, 0.42, 12], M.glassDark, [x, 0.66, z]);
    h.round(x, z, 0.32);
  }
  h.hang(-4.4, 2.0, 4.6);
  h.hang(4.8, 7.4, 4.6);
  return finish(h);
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-2': buildStores,
  'site-3': buildScaleBay,
  'site-4': buildControlCabin,
  'site-5': buildSumpCellar,
  'site-6': buildChargeBank,
  'site-7': buildPicklingBay,
  'site-8': buildTappingPit,
  'site-9': buildRefiningBay
};
