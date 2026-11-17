/**
 * brinewire/stations.js — The six hosts: what the barrage keeps in each of its rooms, and the bench built into it.
 *
 * A bench on Brinewire stands in a ROOM of the barrage (`barrage-plan.js`): a gate house on the crest, a cell chamber off the
 * gallery inside the wall, or the switchyard's cage at the foot. The room's shell (floor, walls, roof) is the barrage's
 * (`terrain.js`). The HOST is what stands in it and its bench, as ONE object: so the overlap rule (which exempts a body's own
 * parts) lets the bench be bolted to the thing it belongs to, and the bay contract (`bench-bay.js`) keeps the volume the plate,
 * the instrument, the screens and the camera need empty of it.
 *
 *   1 hoist house     the sluice gate's steel leaf raised in its slot behind the plate, rusted at its waterline; the crab
 *                     on its runway over it; the hand-hoist gearbox; replaced rollers and seals
 *   2 anode store     racks of zinc and aluminium anodes on the walls; bins of spent anodes eaten to their cores; a copper
 *                     bus with iron clamps bolted to the wall, the iron rusted where it touches the copper
 *   3 bridge chamber  two half-cell tanks either side of the plate, a zinc plate in one and a copper plate in the other,
 *                     brine fed in from the lagoon; the salt-bridge trough between them across the back; the leads
 *   4 meter room      a panel of voltmeters across the back wall, one for every cell in the gallery; a chart recorder;
 *                     a rack of reference electrodes
 *   5 battery hall    two tiers of glass-sided cells along both side walls, the busbars over them; the load resistor
 *                     grid against the back wall
 *   6 rectifier cage  the rectifier cabinet against the wall; the plating tank with its anode bars; the busbars coming in
 *                     from the transformers outside
 *
 * THE HOST FRAME. Origin on the room's floor under the middle of the plate; +z toward the door (and the player), +x to the
 * player's right. Every builder is given its room in that frame (`h.room`: `x0, x1, z0, z1` with the walls' colliders taken
 * off, `hang` the height a lamp's rod is fixed at). Machinery stands to the sides (|x| > 2.85), behind the plate
 * (z < -2.0), or above 2.4 m; `verify:bench` measures all of it and `verify:brinewire` measures that no host leaves its room.
 *
 * ONLY LAMPS ARE LIT. A host hangs its room's lamps (`lampMark`s the world pools); nothing here owns a PointLight.
 * NO SIGN STANDS ON THE BARRAGE. Nothing here carries lettering.
 *
 * @returns {{ group, bench, benchLocal, colliders, movers }} `colliders` are host-local discs `{ lx, lz, r }` and boxes
 *   `{ lx, lz, hw, hd }`; the world turns them to its own frame. `movers` have `update(t)`.
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { HOST_PLAN, hostExtent } from './host-plan.js';
import { ROOMS, WALL_T } from './barrage-plan.js';
import { kitFor } from '../kettle/kit.js';

/* ----------------------------------------------------------------- the bench */

/** The bench: the shared bay bench in the host's skin, dressed in the works' steel and dark timber, its cased instrument for `kind`. */
export function buildBwBench(ctx, { kind = 'beaker', plate = 'BRW-01', skin = 'deck' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin, plate,
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.timberDark },
    tagStyle: { fg: '#1c211c', bg: '#cfc9b8' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.13, 22), M.glassDark, -0.62, height + 0.42, 0.072);
      if (kind === 'beaker') {                // a beaker of brine with a rod standing in it and a lead lying beside it
        add(new THREE.CylinderGeometry(0.13, 0.13, 0.24, 20), M.glass, 0.6, y0 + 0.12, 0.1);
        add(new THREE.CylinderGeometry(0.115, 0.115, 0.14, 20), M.water, 0.6, y0 + 0.08, 0.1);
        add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), M.copper, 0.64, y0 + 0.18, 0.1);
        add(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), M.caseDark, 0.98, y0 + 0.012, 0.28, [0, 0, Math.PI / 2]);
      } else if (kind === 'rack') {           // a rack of three metal strips on a stand
        add(new THREE.BoxGeometry(0.5, 0.03, 0.16), M.caseDark, 0.7, y0 + 0.015, 0.1);
        [M.copper, M.steel, M.brass].forEach((mat, i) => add(new THREE.BoxGeometry(0.08, 0.32, 0.015), mat, 0.55 + i * 0.15, y0 + 0.19, 0.1));
      } else if (kind === 'rig') {            // two small beakers joined by an arched bridge
        add(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 18), M.glass, 0.42, y0 + 0.08, 0.1);
        add(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 18), M.glass, 0.82, y0 + 0.08, 0.1);
        add(new THREE.TorusGeometry(0.2, 0.015, 8, 18, Math.PI), M.glass, 0.62, y0 + 0.12, 0.1);
      } else if (kind === 'meter') {          // a meter case with a dial and a short electrode strip
        add(new THREE.BoxGeometry(0.4, 0.16, 0.28), M.caseDark, 0.5, y0 + 0.08, 0.1);
        add(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 18), M.paint2, 0.5, y0 + 0.17, 0.12, [Math.PI / 2 - 0.5, 0, 0]);
        add(new THREE.BoxGeometry(0.06, 0.3, 0.012), M.copper, 0.95, y0 + 0.15, 0.1);
      } else if (kind === 'load') {           // a lamp on a base and a coil of lead
        add(new THREE.CylinderGeometry(0.1, 0.12, 0.05, 18), M.caseDark, 0.5, y0 + 0.025, 0.1);
        add(new THREE.SphereGeometry(0.1, 14, 10), M.glass, 0.5, y0 + 0.15, 0.1);
        add(new THREE.TorusGeometry(0.07, 0.012, 6, 16), M.copper, 0.88, y0 + 0.02, 0.1, [Math.PI / 2, 0, 0]);
      } else {                                // a supply box with two knobs and a balance pan
        add(new THREE.BoxGeometry(0.4, 0.2, 0.26), M.caseDark, 0.46, y0 + 0.1, 0.1);
        for (const dx of [-0.08, 0.08]) add(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 14), M.brass, 0.46 + dx, y0 + 0.22, 0.12);
        add(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), M.steel, 0.9, y0 + 0.05, 0.1);
        add(new THREE.CylinderGeometry(0.03, 0.05, 0.05, 12), M.caseDark, 0.9, y0 + 0.025, 0.1);
      }
    }
  });
}

/* --------------------------------------------------------------- start and finish */

/** A room's lamp: hung from the roof on a rod. */
const ROOM_LAMP = { intensity: 9, distance: 12 };

/**
 * The height a lamp's rod is fixed at over a host-frame point: the underside of the roof, or of the member it hangs from.
 * Every room faces east, so host (lx, lz) is world (px + lz, pz - lx).
 */
function roofUnder(room, plan, lx, lz) {
  const r = room.rect;
  const x = plan.pos[0] + lz, z = plan.pos[1] - lx;
  const T = WALL_T;
  if (room.shell === 'gable') return room.top - 0.18;
  if (room.shell === 'mono') {
    const X0 = r.minX - T - 0.35, X1 = r.maxX + T + 0.35;
    return room.top + (room.ridge - room.top) * ((X1 - x) / (X1 - X0)) - 0.12;
  }
  if (room.shell === 'vault') {
    const half = (r.maxZ - r.minZ) / 2, rise = room.top - 3.8, R = (half * half + rise * rise) / (2 * rise);
    const off = z - (r.minZ + r.maxZ) / 2;
    return room.top - (R - Math.sqrt(Math.max(0, R * R - off * off)));
  }
  if (room.shell === 'cage') {
    const run = r.maxX + T - (r.minX - T);
    return room.top + (room.ridge - room.top) * ((r.maxX + T - x) / run) - 0.35;
  }
  if (room.shell === 'hall') return room.top - 0.5;
  return room.top;
}

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const room = ROOMS.find(r => r.id === plan.room);
  const g = new THREE.Group();
  g.name = name;
  const bench = buildBwBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  const [x0, x1, z0, z1] = hostExtent(plan);
  const topAt = (lx, lz) => roofUnder(room, plan, lx, lz);
  const box = { x0, x1, z0, z1, top: room.top, topAt, room };
  const colliders = [{ lx: 0, lz: 0, hw: 2.4, hd: 0.65 }];
  const movers = [];
  /** Hang a lamp from the roof at (x, z), `y` over the floor. */
  const hang = (x, z, y = 3.5, opts = ROOM_LAMP) => k.pendant(g, x, y, z, topAt(x, z) - 0.02, opts);
  const solid = (lx, lz, hw, hd) => colliders.push({ lx, lz, hw, hd });
  const round = (lx, lz, r) => colliders.push({ lx, lz, r });
  return { k, M: w.M, g, bench, colliders, movers, room: box, hang, solid, round, w, plan };
}

/** The lamp over the plate, one by the door, and the host handed back. */
const finish = (h, { plateZ = -0.3, doorZ = null, y = 3.5 } = {}) => {
  h.hang(0, plateZ, y);
  const dz = doorZ ?? h.room.z1 - 2.2;
  h.hang(0, dz, Math.min(3.3, h.room.topAt(0, dz) - 0.6));
  return { group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders, movers: h.movers };
};

/* ------------------------------------------------------------------------ shared pieces */

/** A drum standing on its end, with its two rolling hoops. */
const drum = (h, x, z, mat, y = 0) => {
  h.k.cyl(h.g, [0.29, 0.29, 0.88, 16], mat, [x, y + 0.44, z]);
  for (const dy of [0.28, 0.6]) h.k.cyl(h.g, [0.3, 0.3, 0.03, 16], h.M.darkSteel, [x, y + dy, z], null, false);
};

/** A handwheel on a spindle, its face toward +z (`axis` 'z') or toward +x ('x'). */
function handwheel(h, x, y, z, axis = 'z', r = 0.28) {
  const { k, g, M } = h;
  const ring = new THREE.Mesh(h.w.own(new THREE.TorusGeometry(r, 0.025, 8, 24)), M.darkSteel);
  ring.position.set(x, y, z);
  if (axis === 'x') ring.rotation.y = Math.PI / 2;
  g.add(ring);
  for (let i = 0; i < 3; i++) {
    const sp = k.box(g, [2 * r, 0.025, 0.025], M.darkSteel, [x, y, z], null, false);
    if (axis === 'z') sp.rotation.z = i * Math.PI / 3; else { sp.rotation.y = Math.PI / 2; sp.rotation.x = i * Math.PI / 3; }
  }
}

/** A steel shelf rack along z against a side wall at x: uprights, shelves, and `load(x, y, z, bay)` on each bay of each shelf. */
function rackAlongZ(h, x, z0, z1, { depth = 0.7, top = 2.6, shelves = [0.45, 1.15, 1.85, 2.55], bay = 1.6, load = null, mat = null } = {}) {
  const { k, g, M } = h;
  const n = Math.max(1, Math.round((z1 - z0) / bay));
  const step = (z1 - z0) / n;
  for (let i = 0; i <= n; i++) for (const dx of [-depth / 2 + 0.04, depth / 2 - 0.04]) k.box(g, [0.06, top, 0.06], mat || M.darkSteel, [x + dx, top / 2, z0 + i * step]);
  for (const y of shelves) {
    k.box(g, [depth, 0.04, z1 - z0], M.steel, [x, y, (z0 + z1) / 2]);
    if (load) for (let i = 0; i < n; i++) load(x, y + 0.02, z0 + (i + 0.5) * step, step);
  }
  h.solid(x, (z0 + z1) / 2, depth / 2, (z1 - z0) / 2);
}

/** A cable tray along z at height y on brackets off the side wall at `wall` (the wall's x), `out` its reach. */
function trayAlongZ(h, wall, y, z0, z1, out = 0.5) {
  const { k, g, M } = h;
  const s = Math.sign(wall);
  const x = wall - s * out / 2;
  k.box(g, [out, 0.04, z1 - z0], M.darkSteel, [x, y, (z0 + z1) / 2], null, false);
  for (const dx of [-out / 2, out / 2]) k.box(g, [0.03, 0.12, z1 - z0], M.darkSteel, [x + dx, y + 0.06, (z0 + z1) / 2], null, false);
  for (let z = z0 + 0.4; z < z1; z += 1.6) k.box(g, [out, 0.06, 0.06], M.darkSteel, [x, y - 0.05, z], null, false);
  // The cables in it.
  for (let i = 0; i < 3; i++) k.cyl(g, [0.035, 0.035, z1 - z0 - 0.1, 6], M.rubber, [x - out / 2 + 0.12 + i * 0.12, y + 0.06, (z0 + z1) / 2], [Math.PI / 2, 0, 0], false);
}

/* ------------------------------------------------------------------------ the hosts */

/**
 * 1 THE HOIST HOUSE over gate 1. The sluice gate's steel leaf stands raised in its slot across the back of the room: its paint
 * blistered and its steel rusted through a band where it stood at the waterline. The crab that lifts it runs on a beam over it.
 * On the left, the hand-hoist gearbox and its handwheel; on the right, the replaced rollers and the seal rubber.
 */
function hoistHouse(w) {
  const h = start(w, 'site-1', 'host-hoist-house');
  const { k, g, M, room } = h;
  const zs = -2.35;
  // The slot in the floor, grated either side of the leaf; the guide channels up the room to the truss.
  k.box(g, [6.4, 0.03, 0.7], M.darkSteel, [0, 0.015, zs], null, false);
  for (const s of [-1, 1]) {
    const x = s * 2.95;
    k.box(g, [0.3, room.top - 0.2, 0.12], M.darkSteel, [x, (room.top - 0.2) / 2, zs - 0.2]);
    k.box(g, [0.3, room.top - 0.2, 0.12], M.darkSteel, [x, (room.top - 0.2) / 2, zs + 0.2]);
    k.box(g, [0.1, room.top - 0.2, 0.3], M.darkSteel, [x + s * 0.1, (room.top - 0.2) / 2, zs]);
  }
  // The leaf, raised: a skin plate on four horizontal girders, rusted along the band that sat at the waterline.
  const leafTop = 4.3;
  k.box(g, [5.6, leafTop, 0.12], M.gateLeaf, [0, leafTop / 2, zs - 0.1]);
  for (const y of [0.35, 1.4, 2.5, 3.6]) k.box(g, [5.6, 0.26, 0.24], M.gateLeaf, [0, y, zs + 0.08]);
  k.box(g, [5.62, 0.9, 0.14], M.rust, [0, 1.15, zs - 0.08]);
  for (let i = 0; i < 9; i++) k.box(g, [0.24 + (i % 3) * 0.1, 0.18, 0.02], M.rust, [-2.4 + i * 0.6, 1.75 + (i % 4) * 0.12, zs + 0.21], null, false);
  // The rollers down each edge and the two lifting lugs.
  for (const s of [-1, 1]) for (const y of [0.6, 2.0, 3.4]) k.cyl(g, [0.16, 0.16, 0.1, 12], M.darkSteel, [s * 2.68, y, zs + 0.05], [0, 0, Math.PI / 2], false);
  for (const s of [-1, 1]) k.box(g, [0.14, 0.3, 0.24], M.darkSteel, [s * 1.6, leafTop + 0.12, zs]);
  // The runway beam across the room over the slot, the crab on it, its two chains to the lugs.
  k.beam(g, [room.x0, 6.0, zs], [room.x1, 6.0, zs], { d: 0.36, f: 0.24 });
  k.box(g, [1.2, 0.5, 0.9], M.paintYellow, [0, 5.55, zs]);
  for (const s of [-1, 1]) k.strut(g, [s * 0.4, 5.3, zs], [s * 1.6, leafTop + 0.27, zs], 0.03, M.darkSteel);
  h.solid(0, zs, 3.1, 0.35);
  // Left: the hand-hoist gearbox on its plinth and its handwheel, the drive shaft up to the crab's beam.
  const L = -4.4;
  k.box(g, [1.4, 0.3, 1.2], M.concrete, [L, 0.15, -1.4]);
  k.box(g, [1.0, 1.1, 0.8], M.castIron ?? M.darkSteel, [L, 0.85, -1.4]);
  handwheel(h, L, 1.2, -0.9, 'z', 0.42);
  k.cyl(g, [0.06, 0.06, 4.6, 8], M.steel, [L, 3.6, -1.4], null, false);
  h.solid(L, -1.4, 0.7, 0.6);
  // Left, toward the door: two paint drums and a coil of seal rubber on a pallet.
  drum(h, -5.4, 2.4, M.drumB); drum(h, -5.4, 3.2, M.drumB);
  h.round(-5.4, 2.8, 0.75);
  k.box(g, [1.2, 0.12, 1.0], M.timber, [-5.2, 0.06, 5.2]);
  for (let i = 0; i < 4; i++) k.cyl(g, [0.42 - i * 0.02, 0.42 - i * 0.02, 0.1, 18], M.rubber, [-5.2, 0.18 + i * 0.1, 5.2], null, false);
  h.solid(-5.2, 5.2, 0.6, 0.5);
  // Right: the replaced rollers, rusted to their axles, on a rack, and a bench with a vice and a wire brush.
  rackAlongZ(h, 5.4, -1.6, 2.2, { depth: 0.6, top: 1.6, shelves: [0.4, 1.0, 1.55], bay: 1.9, load: (x, y, z) => {
    for (const dz of [-0.4, 0, 0.4]) k.cyl(g, [0.15, 0.15, 0.1, 12], M.rust, [x, y + 0.15, z + dz], [0, 0, Math.PI / 2], false);
  } });
  k.box(g, [0.8, 0.06, 2.0], M.timberDark, [5.3, 0.92, 4.4]);
  for (const dz of [-0.8, 0.8]) for (const dx of [-0.3, 0.3]) k.box(g, [0.06, 0.9, 0.06], M.darkSteel, [5.3 + dx, 0.45, 4.4 + dz]);
  k.box(g, [0.2, 0.18, 0.3], M.darkSteel, [5.1, 1.04, 3.8]);
  h.solid(5.3, 4.4, 0.42, 1.02);
  return finish(h, { plateZ: 0.25, doorZ: 6.75 });
}

/**
 * 2 THE ANODE STORE over gate 2. The gates are kept from rotting by blocks of a more active metal bolted to them, which rot in
 * the steel's place: here they are kept new on racks (zinc, aluminium), and the spent ones come back eaten to their steel
 * cores. On the right wall a copper bus is held by iron clamps, and the iron is rusted where it touches the copper.
 */
function anodeStore(w) {
  const h = start(w, 'site-2', 'host-anode-store');
  const { k, g, M, room } = h;
  const anode = (x, y, z, mat, len = 0.5) => {
    k.box(g, [0.12, 0.1, len], mat, [x, y + 0.05, z], null, false);
    k.box(g, [0.03, 0.03, len + 0.3], M.darkSteel, [x, y + 0.05, z], null, false);
  };
  // Behind the plate, under the strip window: a low rack of new zinc anodes the length of the back wall.
  {
    const xa = room.x0 + 0.4, xb = room.x1 - 0.4, z = -2.35;
    for (let i = 0; i <= 5; i++) for (const dz of [-0.26, 0.26]) k.box(g, [0.06, 1.4, 0.06], M.darkSteel, [xa + (xb - xa) * i / 5, 0.7, z + dz]);
    for (const y of [0.35, 0.85, 1.35]) {
      k.box(g, [xb - xa, 0.04, 0.6], M.steel, [(xa + xb) / 2, y, z]);
      for (let i = 0; i < 10; i++) {
        const x = xa + 0.5 + i * (xb - xa - 1.0) / 9;
        k.box(g, [0.5, 0.1, 0.12], y > 1 ? M.zinc : M.steel, [x, y + 0.07, z], null, false);
        k.box(g, [0.8, 0.03, 0.03], M.darkSteel, [x, y + 0.07, z], null, false);
      }
    }
    h.solid((xa + xb) / 2, z, (xb - xa) / 2, 0.32);
  }
  // Left wall: new anodes, zinc above and aluminium below, on a deep rack.
  rackAlongZ(h, room.x0 + 0.45, -1.8, 4.4, { depth: 0.7, top: 2.3, shelves: [0.4, 1.0, 1.6, 2.2], bay: 1.55, load: (x, y, z) => {
    for (const dx of [-0.16, 0.16]) anode(x + dx, y, z, y > 1.2 ? M.zinc : M.steel);
  } });
  // Right wall: the spent anodes in bins (eaten to their cores), then the copper bus on the wall with its iron clamps.
  for (const [i, z] of [-1.4, -0.2, 1.0].entries()) {
    k.box(g, [0.9, 0.7, 1.0], M.darkSteel, [room.x1 - 0.55, 0.35, z]);
    for (let j = 0; j < 4; j++) k.box(g, [0.1, 0.08, 0.3 + (j % 2) * 0.12], M.zincSpent, [room.x1 - 0.7 + (j % 2) * 0.25, 0.74, z - 0.3 + j * 0.18], null, false);
    void i;
  }
  h.solid(room.x1 - 0.55, -0.2, 0.45, 1.7);
  const bz0 = 2.4, bz1 = room.z1 - 1.2;
  k.box(g, [0.06, 0.12, bz1 - bz0], M.copper, [room.x1 - 0.25, 1.9, (bz0 + bz1) / 2]);
  for (let z = bz0 + 0.4; z < bz1; z += 1.1) {
    k.box(g, [0.18, 0.3, 0.1], M.rusted, [room.x1 - 0.2, 1.9, z]);
    k.box(g, [0.04, 0.34, 0.14], M.rust, [room.x1 - 0.31, 1.9, z], null, false);
  }
  // A weigh scale for the spent anodes by the door, on the right.
  k.box(g, [0.9, 0.12, 0.9], M.darkSteel, [room.x1 - 0.8, 0.06, room.z1 - 1.6]);
  k.box(g, [0.08, 1.1, 0.08], M.darkSteel, [room.x1 - 0.4, 0.6, room.z1 - 1.95]);
  k.cyl(g, [0.18, 0.18, 0.06, 18], M.paint2, [room.x1 - 0.4, 1.2, room.z1 - 1.88], [Math.PI / 2, 0, 0], false);
  h.solid(room.x1 - 0.8, room.z1 - 1.6, 0.5, 0.5);
  return finish(h, { plateZ: 0.2 });
}

/**
 * 3 THE BRIDGE CHAMBER. A cell is two halves: here each half is a concrete tank of brine fed from the lagoon through the wall,
 * a zinc plate hung in the left and a copper plate in the right; the glazed salt-bridge trough runs between them across the
 * back of the room, and the two leads go up to the porcelain insulators on the back wall.
 */
function bridgeChamber(w) {
  const h = start(w, 'site-3', 'host-bridge-chamber');
  const { k, g, M, room } = h;
  const tank = (s, plate) => {
    const xc = s * 4.7, hw = 1.35, z0 = -2.4, z1 = 3.0, H = 1.1;
    for (const [x, sx] of [[xc - hw, 0.18], [xc + hw, 0.18]]) k.box(g, [sx, H, z1 - z0], M.concrete, [x, H / 2, (z0 + z1) / 2]);
    for (const z of [z0, z1]) k.box(g, [2 * hw + 0.18, H, 0.18], M.concrete, [xc, H / 2, z]);
    k.box(g, [2 * hw - 0.18, 0.06, z1 - z0 - 0.18], M.water, [xc, H - 0.2, (z0 + z1) / 2], null, false);
    // The plate hung on a bar across the tank, its lead up from it.
    k.box(g, [0.06, 0.06, z1 - z0 + 0.2], M.darkSteel, [xc, H + 0.5, (z0 + z1) / 2], null, false);
    k.box(g, [0.05, 1.0, 2.6], plate, [xc, H + 0.0, (z0 + z1) / 2]);
    k.strut(g, [xc, H + 0.5, 0.3], [xc, 3.2, -2.55], 0.025, M.rubber);
    // The feed from the lagoon: a pipe out of the back wall, down into the tank, its valve.
    k.pipe(g, [[xc + s * 0.6, 2.6, room.z0 + 0.05], [xc + s * 0.6, 2.6, -2.2], [xc + s * 0.6, 1.3, -2.2]], 0.07, M.copper);
    handwheel(h, xc + s * 0.6, 2.2, -2.05, 'z', 0.16);
    h.solid(xc, (z0 + z1) / 2, hw + 0.1, (z1 - z0) / 2 + 0.1);
  };
  tank(-1, M.zinc);
  tank(1, M.copper);
  // The salt bridge: a glazed U-trough on brick piers, from the top of one tank to the other across the back.
  for (const x of [-2.4, 0, 2.4]) k.box(g, [0.4, 1.0, 0.4], M.brick, [x, 0.5, -2.35]);
  k.box(g, [6.9, 0.08, 0.5], M.paint2, [0, 1.04, -2.35]);
  for (const dz of [-0.22, 0.22]) k.box(g, [6.9, 0.22, 0.06], M.paint2, [0, 1.17, -2.35 + dz]);
  k.box(g, [6.8, 0.05, 0.38], M.water, [0, 1.16, -2.35], null, false);
  h.solid(0, -2.35, 3.4, 0.3);
  // The insulators on the back wall the leads run to, and the lead across between them above the plate's head.
  for (const x of [-3.0, 3.0]) {
    k.box(g, [0.5, 0.08, 0.3], M.darkSteel, [x, 3.15, -2.55]);
    for (let i = 0; i < 3; i++) k.cyl(g, [0.09, 0.09, 0.05, 10], M.paint2, [x, 3.28 + i * 0.09, -2.55], null, false);
  }
  k.strut(g, [-3.0, 3.5, -2.55], [3.0, 3.5, -2.55], 0.022, M.rubber);
  // By the door: a carboy rack of fresh brine on the left, the lead coils on the right.
  for (const [i, z] of [5.0, 5.8, 6.6].entries()) { k.cyl(g, [0.26, 0.26, 0.6, 14], M.glass, [-5.6, 0.32, z]); void i; }
  h.solid(-5.6, 5.8, 0.4, 1.2);
  for (let i = 0; i < 3; i++) k.cyl(g, [0.36, 0.36, 0.1, 16], M.rubber, [5.6, 0.06 + i * 0.1, 5.6], null, false);
  h.round(5.6, 5.6, 0.45);
  return finish(h, { plateZ: -0.2 });
}

/**
 * 4 THE METER ROOM. Every cell in the gallery is read here: a steel panel across the back wall with a voltmeter for each, their
 * leads coming down from the tray along the wall; a chart recorder on a desk on the left; the reference electrodes in tubes of
 * brine on a rack on the right.
 */
function meterRoom(w) {
  const h = start(w, 'site-4', 'host-meter-room');
  const { k, g, M, room } = h;
  // The panel: a steel board on the back wall, 12 dials in two rows over the plate's head, a switch row under them.
  k.box(g, [6.4, 3.2, 0.12], M.steel, [0, 1.8, -2.55]);
  for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) {
    const x = -2.5 + i * 1.0, y = 2.7 + row * 0.55;
    k.cyl(g, [0.2, 0.2, 0.06, 20], M.caseDark, [x, y, -2.47], [Math.PI / 2, 0, 0], false);
    k.cyl(g, [0.16, 0.16, 0.02, 20], M.paint2, [x, y, -2.43], [Math.PI / 2, 0, 0], false);
    k.box(g, [0.01, 0.13, 0.01], M.caseDark, [x + 0.03, y + 0.02, -2.41], [0, 0, -0.5 + ((i * 7 + row * 3) % 9) * 0.12], false);
  }
  for (let i = 0; i < 12; i++) k.box(g, [0.06, 0.12, 0.06], M.caseDark, [-2.75 + i * 0.5, 2.2, -2.46], null, false);
  trayAlongZ(h, room.x0, 3.8, -2.6, room.z1 - 0.5);
  for (let i = 0; i < 6; i++) k.strut(g, [room.x0 + 0.3, 3.8, -2.4 + i * 0.05], [-2.5 + i, 3.0, -2.5], 0.012, M.rubber);
  h.solid(0, -2.55, 3.2, 0.15);
  // Left: the chart recorder on its desk, a roll of chart paper on the drum, a stool.
  k.box(g, [1.0, 0.08, 1.8], M.timberDark, [-4.6, 0.8, 0.6]);
  for (const [dx, dz] of [[-0.4, -0.8], [0.4, -0.8], [-0.4, 2.0], [0.4, 2.0]]) k.box(g, [0.06, 0.8, 0.06], M.darkSteel, [-4.6 + dx, 0.4, 0.6 + dz * 0.5]);
  k.box(g, [0.7, 0.5, 0.8], M.caseDark, [-4.6, 1.09, 0.3]);
  k.cyl(g, [0.1, 0.1, 0.62, 14], M.paper, [-4.6, 1.42, 0.3], [Math.PI / 2, 0, 0], false);
  k.box(g, [0.5, 0.01, 0.45], M.paper, [-4.45, 0.85, 1.2], [-0.15, 0, 0], false);
  h.solid(-4.6, 0.6, 0.55, 0.95);
  k.cyl(g, [0.2, 0.18, 0.65, 12], M.darkSteel, [-3.5, 0.32, 1.8]);
  h.round(-3.5, 1.8, 0.3);
  // Right: the rack of reference electrodes, each a glass tube of brine in a clip, their leads to the panel.
  rackAlongZ(h, room.x1 - 0.4, -1.8, 3.0, { depth: 0.5, top: 1.9, shelves: [0.5, 1.2, 1.85], bay: 1.6, load: (x, y, z) => {
    for (let i = 0; i < 4; i++) k.cyl(g, [0.03, 0.03, 0.4, 8], M.glass, [x, y + 0.2, z - 0.45 + i * 0.3], null, false);
  } });
  trayAlongZ(h, room.x1, 3.8, -2.6, room.z1 - 0.5);
  return finish(h, { plateZ: -0.3, y: 3.3 });
}

/**
 * 5 THE BATTERY HALL. The gallery's cells, in glass-sided jars with their plates showing through, stand in two tiers on steel
 * stands along both side walls; a copper busbar runs along the top of each stand; the load, a grid of resistor elements in a
 * steel frame, stands against the back wall.
 */
function batteryHall(w) {
  const h = start(w, 'site-5', 'host-battery-hall');
  const { k, g, M, room } = h;
  const stand = (s) => {
    const x = s * (room.x1 - 0.65), z0 = -2.4, z1 = room.z1 - 1.0;
    const n = Math.round((z1 - z0) / 0.7);
    for (const y of [0.5, 1.45]) {
      k.box(g, [0.9, 0.06, z1 - z0], M.darkSteel, [x, y, (z0 + z1) / 2]);
      for (let i = 0; i < n; i++) {
        const z = z0 + 0.35 + i * (z1 - z0 - 0.7) / (n - 1);
        k.box(g, [0.6, 0.62, 0.52], M.glass, [x, y + 0.35, z]);
        for (const dz of [-0.12, 0, 0.12]) k.box(g, [0.5, 0.48, 0.02], dz ? M.lead : M.copper, [x, y + 0.3, z + dz], null, false);
        k.cyl(g, [0.03, 0.03, 0.12, 8], M.lead, [x - 0.1 * s, y + 0.72, z], null, false);
      }
    }
    for (const dz of [z0, z1]) for (const dx of [-0.42, 0.42]) k.box(g, [0.06, 2.4, 0.06], M.darkSteel, [x + dx, 1.2, dz]);
    k.box(g, [0.06, 0.14, z1 - z0], M.copper, [x - 0.1 * s, 2.3, (z0 + z1) / 2]);
    h.solid(x, (z0 + z1) / 2, 0.48, (z1 - z0) / 2);
  };
  stand(-1); stand(1);
  // The load against the back wall: a steel frame of resistor grids, three bays, behind the plate; the bus over to it.
  k.box(g, [5.2, 2.9, 0.06], M.darkSteel, [0, 1.6, -2.58]);
  for (let i = 0; i < 3; i++) {
    const x = -1.7 + i * 1.7;
    for (let j = 0; j < 7; j++) k.box(g, [1.4, 0.05, 0.12], M.rusted, [x, 0.6 + j * 0.3, -2.42], null, false);
    for (const dx of [-0.72, 0.72]) k.box(g, [0.06, 2.4, 0.3], M.darkSteel, [x + dx, 1.5, -2.4]);
  }
  for (const s of [-1, 1]) k.box(g, [room.x1 - 3.0, 0.1, 0.1], M.copper, [s * (room.x1 + 2.6) / 2, 3.2, -2.4], null, false);
  h.solid(0, -2.45, 2.7, 0.3);
  h.hang(0, 4.0, 3.6);
  return finish(h, { plateZ: -0.3, y: 3.6 });
}

/**
 * 6 THE RECTIFIER CAGE at the foot. The grid's current comes in from the transformers outside on busbars through the cage's
 * north side; the rectifier cabinet against the wall turns it one way; from it, the bars run to the plating tank on the left,
 * filled from the tailrace, its anode bars across it and its cathode plates hung between them.
 */
function rectifierCage(w) {
  const h = start(w, 'site-6', 'host-rectifier-cage');
  const { k, g, M, room } = h;
  // The rectifier: a louvred steel cabinet against the wall behind the plate.
  k.box(g, [5.0, 2.6, 0.62], M.paintBlue, [0, 1.3, -2.36]);
  for (let i = 0; i < 6; i++) k.box(g, [0.7, 0.04, 0.03], M.darkSteel, [-2.0 + i * 0.8, 2.2, -2.04], null, false);
  for (let i = 0; i < 4; i++) k.box(g, [0.5, 0.9, 0.02], M.darkSteel, [-1.8 + i * 1.2, 0.9, -2.04], null, false);
  h.solid(0, -2.36, 2.5, 0.31);
  // The bus in from the right (north), over the cabinet, and out to the tank on the left.
  k.box(g, [room.x1 - 2.4, 0.12, 0.08], M.copper, [(room.x1 + 2.4) / 2, 3.6, -2.4], null, false);
  for (const s of [-1, 1]) k.box(g, [0.08, 1.0, 0.08], M.copper, [s * 2.4, 3.1, -2.4], null, false);
  k.box(g, [Math.abs(room.x0) - 2.4, 0.12, 0.08], M.copper, [(room.x0 - 2.4) / 2, 3.6, -2.4], null, false);
  for (const x of [room.x1 - 0.3, 3.6]) for (let i = 0; i < 3; i++) k.cyl(g, [0.08, 0.08, 0.05, 10], M.paint2, [x, 3.82 + i * 0.07, -2.4], null, false);
  // The plating tank on the left: a long steel tank on sleepers, brine in it, the anode bars across, the plates hung between.
  const tx = -4.55, tz0 = -1.8, tz1 = 5.4, tw = 1.45;
  k.box(g, [2 * tw, 0.2, tz1 - tz0], M.timberDark, [tx, 0.1, (tz0 + tz1) / 2]);
  k.box(g, [2 * tw, 1.0, 0.1], M.darkSteel, [tx, 0.7, tz0]);
  k.box(g, [2 * tw, 1.0, 0.1], M.darkSteel, [tx, 0.7, tz1]);
  for (const x of [tx - tw, tx + tw]) k.box(g, [0.1, 1.0, tz1 - tz0], M.darkSteel, [x, 0.7, (tz0 + tz1) / 2]);
  k.box(g, [2 * tw - 0.1, 0.05, tz1 - tz0 - 0.1], M.water, [tx, 1.05, (tz0 + tz1) / 2], null, false);
  for (let i = 0; i < 6; i++) {
    const z = tz0 + 0.6 + i * (tz1 - tz0 - 1.2) / 5;
    k.box(g, [2 * tw + 0.3, 0.06, 0.08], i % 2 ? M.copper : M.darkSteel, [tx, 1.32, z], null, false);
    k.box(g, [1.6, 0.9, 0.03], i % 2 ? M.copperClad : M.patina, [tx, 0.82, z], null, false);
  }
  k.strut(g, [room.x0 + 0.2, 3.6, -2.4], [tx, 1.4, tz0 + 0.6], 0.04, M.copper);
  h.solid(tx, (tz0 + tz1) / 2, tw + 0.05, (tz1 - tz0) / 2 + 0.05);
  // The feed from the tailrace: a pipe in through the floor at the tank's door end, its valve.
  k.pipe(g, [[tx + tw + 0.3, 0.05, tz1 + 0.6], [tx + tw + 0.3, 1.3, tz1 + 0.6], [tx + tw - 0.2, 1.3, tz1 - 0.2]], 0.07, M.darkSteel);
  handwheel(h, tx + tw + 0.3, 1.0, tz1 + 0.78, 'z', 0.16);
  h.round(tx + tw + 0.3, tz1 + 0.6, 0.25);
  // Right: an isolator cabinet and the earthing switch handle on the wall, a rack of finished plates.
  k.box(g, [0.8, 1.9, 1.2], M.paintBlue, [room.x1 - 0.5, 0.95, -0.8]);
  k.box(g, [0.05, 0.5, 0.06], M.paintRed, [room.x1 - 0.95, 1.4, -0.4], null, false);
  h.solid(room.x1 - 0.5, -0.8, 0.42, 0.62);
  rackAlongZ(h, room.x1 - 0.45, 1.6, 5.0, { depth: 0.6, top: 1.6, shelves: [0.5, 1.1, 1.55], bay: 1.7, load: (x, y, z) => {
    for (let i = 0; i < 5; i++) k.box(g, [0.36, 0.5, 0.02], M.copperClad, [x, y + 0.25, z - 0.4 + i * 0.2], null, false);
  } });
  return finish(h, { plateZ: -0.3, y: 3.4 });
}

export const HOST_BUILDERS = {
  'site-1': hoistHouse,
  'site-2': anodeStore,
  'site-3': bridgeChamber,
  'site-4': meterRoom,
  'site-5': batteryHall,
  'site-6': rectifierCage
};
