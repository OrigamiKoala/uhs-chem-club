/**
 * quicklight/stations.js — The six hosts: what the refinery keeps in each of its rooms, and the bench built into it.
 *
 * A bench on Quicklight stands in a ROOM of the refinery (`refinery-plan.js`). The room's shell (floor, walls, roof) and the
 * structure over it are the refinery's (`terrain.js`). The HOST is what stands in it and its bench, as ONE object: so the overlap
 * rule (which exempts a body's own parts) lets the bench be bolted to the thing it belongs to, and the bay contract
 * (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the camera need empty of it.
 *
 *   1 analyser bunker   three analyser ovens on the back wall, the sample lines in from the plant through the headwall; the
 *                       sample-conditioning panel with its flow meters on the left; the carrier-gas cylinders chained on the
 *                       right; a timed sample on the clock
 *   2 control room      the mimic board of the feed manifold across the back wall, its three feed lines drawn on it; the
 *                       operators' console on the left, the marshalling cabinets on the right
 *   3 pump cellar       two transfer pumps on their plinths on the left, their lines up through the deck; the tank's sample
 *                       cooler and the rack of samples drawn day by day on the right; the valve manifold on the back wall
 *   4 reactor skirt     inside the cracking reactor's skirt: the feed nozzles' lines dropping from the vessel's head on either
 *                       side, the feed heater's thermocouple heads and its recorder, the refractory stock for relining
 *   5 reactor table     under the reactor train: the three reactors' bottom outlets coming down through the table behind the
 *                       plate, each with its valve and sample point; the chain hoist on its runway; the dosing skid
 *   6 catalyst bunker   the loading hopper coming down through the roof in the back corner, a drum under its slide gate; new
 *                       catalyst in drums on pallets on the right; spent catalyst in open drums on the left; the sieve
 *
 * THE HOST FRAME. Origin on the room's floor under the middle of the plate; +z toward the door (and the player), +x to the
 * player's right. Every builder is given its room in that frame (`h.room`: `x0, x1, z0, z1` with the walls' colliders taken
 * off, `topAt(lx, lz)` the height a lamp's rod is fixed at). Machinery stands to the sides (|x| > 2.85), behind the plate
 * (z < -2.0), or above 2.4 m; `verify:bench` measures all of it and `verify:quicklight` measures that no host leaves its room.
 *
 * ONLY LAMPS ARE LIT. A host hangs its room's lamps (`lampMark`s the world pools); nothing here owns a PointLight.
 * NO SIGN STANDS IN THE REFINERY. Nothing here carries lettering.
 *
 * @returns {{ group, bench, benchLocal, colliders, movers }} `colliders` are host-local discs `{ lx, lz, r }` and boxes
 *   `{ lx, lz, hw, hd }`; the world turns them to its own frame. `movers` have `update(t)`.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildBayBench } from '../bench-bay.js';
import { HOST_PLAN, hostExtent, toWorld } from './host-plan.js';
import { ROOMS, SKIRT } from './refinery-plan.js';
import { kitFor } from '../kettle/kit.js';

/* ----------------------------------------------------------------- the bench */

/** The bench: the shared bay bench in the host's skin, in the works' steel, its cased instrument for `kind`. */
export function buildQlBench(ctx, { kind = 'vessel', plate = 'QKL-01', skin = 'deck' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin, plate,
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.grating },
    tagStyle: { fg: '#1a1e24', bg: '#cfd4dc' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.18, 0.6, 0.44), M.case, -0.35, height + 0.345, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 22), M.brass, -0.62, height + 0.41, 0.04, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.12, 22), M.glassDark, -0.62, height + 0.41, 0.062);
      if (kind === 'vessel') {            // a stoppered flask of fuel and a stopwatch case
        add(new THREE.CylinderGeometry(0.14, 0.14, 0.28, 20), M.glass, 0.56, y0 + 0.14, 0.1);
        add(new THREE.CylinderGeometry(0.125, 0.125, 0.16, 20), M.fuel, 0.56, y0 + 0.09, 0.1);
        add(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), M.brass, 0.56, y0 + 0.32, 0.1);
        add(new THREE.BoxGeometry(0.28, 0.14, 0.18), M.caseDark, 0.94, y0 + 0.07, 0.12);
      } else if (kind === 'board') {      // three feed valves on a strip
        add(new THREE.BoxGeometry(0.54, 0.04, 0.2), M.caseDark, 0.68, y0 + 0.02, 0.1);
        [0.5, 0.68, 0.86].forEach(x => add(new THREE.CylinderGeometry(0.04, 0.04, 0.26, 14), M.copper, x, y0 + 0.15, 0.1));
      } else if (kind === 'plotter') {    // a chart recorder with a roll of paper
        add(new THREE.BoxGeometry(0.46, 0.18, 0.3), M.caseDark, 0.62, y0 + 0.09, 0.1);
        add(new THREE.BoxGeometry(0.36, 0.02, 0.22), M.paint, 0.62, y0 + 0.19, 0.1);
        add(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 10), M.brass, 0.96, y0 + 0.1, 0.12);
      } else if (kind === 'profile') {    // a heated cell on a base and its lead
        add(new THREE.BoxGeometry(0.52, 0.04, 0.22), M.caseDark, 0.66, y0 + 0.02, 0.1);
        add(new THREE.CylinderGeometry(0.07, 0.1, 0.22, 16), M.rusted, 0.66, y0 + 0.13, 0.1);
        add(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 10), M.copper, 0.94, y0 + 0.04, 0.2, [0, 0, Math.PI / 2]);
      } else if (kind === 'stack') {      // three small reactors in a row
        [0.48, 0.68, 0.88].forEach((x, i) => {
          add(new THREE.CylinderGeometry(0.07, 0.07, 0.16 + i * 0.05, 16), M.steel, x, y0 + 0.08 + i * 0.025, 0.1);
        });
      } else {                            // a bed of pellets in a tube, and a sample jar
        add(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 18), M.darkSteel, 0.56, y0 + 0.11, 0.1);
        add(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 18), M.catalyst, 0.56, y0 + 0.225, 0.1);
        add(new THREE.BoxGeometry(0.24, 0.12, 0.18), M.caseDark, 0.9, y0 + 0.06, 0.12);
      }
    }
  });
}

/* --------------------------------------------------------------- start and finish */

const ROOM_LAMP = { intensity: 9, distance: 12 };

/**
 * The height (over the floor) a lamp's rod is fixed at over a host-frame point: the underside of the roof, or of the member it
 * hangs from.
 */
function roofUnder(room, plan, lx, lz) {
  const r = room.rect;
  const [x, z] = toWorld(plan, lx, lz);
  if (room.shell === 'arch') {
    const half = (r.maxZ - r.minZ) / 2, rise = room.top + 0.4 - 2.0;
    const R = (half * half + rise * rise) / (2 * rise), cy = 2.0 + rise - R;
    const off = z - (r.minZ + r.maxZ) / 2;
    return cy + Math.sqrt(Math.max(0, R * R - off * off)) - 0.12;
  }
  if (room.shell === 'block') return room.top + 0.1;
  if (room.shell === 'cellar') return room.top;
  if (room.shell === 'skirt') {
    const d = Math.hypot(x - SKIRT.x, z - SKIRT.z) / (SKIRT.r + SKIRT.t);
    return 6.8 + 1.2 * d * d - 0.1;
  }
  if (room.shell === 'table') return room.top + 0.45;
  return room.top + 0.2;
}

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const room = ROOMS.find(r => r.id === plan.room);
  const g = new THREE.Group();
  g.name = name;
  const bench = buildQlBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
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
  /** Glass is drawn sorted, one draw per mesh: a host's glass is gathered and drawn as ONE mesh (`finish`). */
  const glass = [];
  const pane = (geo, x, y, z) => { geo.translate(x, y, z); glass.push(geo); };
  return { k, M: w.M, g, bench, colliders, movers, room: box, hang, solid, round, w, plan, glass, pane };
}

/** The lamp over the plate, one by the door, and the host handed back. */
const finish = (h, { plateZ = -0.3, doorZ = null, y = 3.5, more = [] } = {}) => {
  if (h.glass.length) {
    const geo = mergeGeometries(h.glass.map(gg => (gg.index ? gg.toNonIndexed() : gg)));
    for (const gg of h.glass) gg.dispose();
    const m = new THREE.Mesh(h.w.own(geo), h.M.glass);
    m.name = `${h.g.name}:glass`;
    h.g.add(m);
  }
  h.hang(0, plateZ, y);
  const dz = doorZ ?? h.room.z1 - 2.2;
  h.hang(0, dz, Math.min(3.3, h.room.topAt(0, dz) - 0.6));
  for (const [x, z, yy] of more) h.hang(x, z, yy ?? Math.min(3.4, h.room.topAt(x, z) - 0.6));
  return { group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders, movers: h.movers };
};

/* ------------------------------------------------------------------------ shared pieces */

/** A handwheel on a spindle, its face toward +z (`axis` 'z') or toward +x ('x'). */
function handwheel(h, x, y, z, axis = 'z', r = 0.24) {
  const { k, g, M } = h;
  const ring = new THREE.Mesh(h.w.own(new THREE.TorusGeometry(r, 0.022, 8, 22)), M.darkSteel);
  ring.position.set(x, y, z);
  if (axis === 'x') ring.rotation.y = Math.PI / 2;
  g.add(ring);
  for (let i = 0; i < 3; i++) {
    const sp = k.box(g, [2 * r, 0.022, 0.022], M.darkSteel, [x, y, z], null, false);
    if (axis === 'z') sp.rotation.z = i * Math.PI / 3; else { sp.rotation.y = Math.PI / 2; sp.rotation.x = i * Math.PI / 3; }
  }
}

/** A flanged gate valve in a vertical line at (x, y, z): the body, two flanges, the bonnet and its wheel facing +z. */
function valveV(h, x, y, z, r = 0.1, wheel = 'z') {
  const { k, g, M } = h;
  k.cyl(g, [r * 1.7, r * 1.7, 0.05, 14], M.darkSteel, [x, y - 0.22, z], null, false);
  k.cyl(g, [r * 1.7, r * 1.7, 0.05, 14], M.darkSteel, [x, y + 0.22, z], null, false);
  k.box(g, [r * 2.6, 0.4, r * 2.6], M.darkSteel, [x, y, z]);
  const out = wheel === 'z' ? [0, 0, 1] : [1, 0, 0];
  k.box(g, [wheel === 'x' ? 0.36 : 0.08, 0.08, wheel === 'z' ? 0.36 : 0.08], M.steel, [x + out[0] * 0.2, y, z + out[2] * 0.2], null, false);
  handwheel(h, x + out[0] * 0.42, y, z + out[2] * 0.42, wheel, 0.18);
}

/** A drum standing on its end, with its two rolling hoops; `open` takes the lid off and shows what is in it. */
const drum = (h, x, z, mat, { y = 0, open = null } = {}) => {
  h.k.cyl(h.g, [0.29, 0.29, 0.88, 16], mat, [x, y + 0.44, z]);
  for (const dy of [0.28, 0.6]) h.k.cyl(h.g, [0.3, 0.3, 0.03, 16], h.M.darkSteel, [x, y + dy, z], null, false);
  if (open) h.k.cyl(h.g, [0.27, 0.27, 0.02, 16], open, [x, y + 0.87, z], null, false);
};

/** A pallet. */
const pallet = (h, x, z, w = 1.2, d = 1.0) => {
  const { k, g, M } = h;
  k.box(g, [w, 0.03, d], M.timber, [x, 0.135, z], null, false);
  for (const dz of [-d / 2 + 0.05, 0, d / 2 - 0.05]) k.box(g, [w, 0.1, 0.1], M.timber, [x, 0.07, z + dz], null, false);
};

/* ------------------------------------------------------------------------ the hosts */

/**
 * 1 THE ANALYSER BUNKER. Where the plant's product is sampled and its make-up measured, again and again, so the operators can
 * see how fast it changes. Three analyser ovens stand against the back wall, the sample lines coming in through the headwall and
 * along the arch; the sample-conditioning panel with its glass flow meters on the left; the carrier-gas cylinders chained in their
 * rack on the right; a clock on the arch's end over the plate.
 */
function analyserBunker(w) {
  const h = start(w, 'site-1', 'host-analyser-bunker');
  const { k, g, M, room } = h;
  const zb = room.z0 + 0.35;
  // The ovens: three cabinets across the back wall, each a door with a window onto its column coil, a controller over it.
  for (const x of [-4.2, 0, 4.2]) {
    k.box(g, [1.5, 2.0, 0.62], M.case, [x, 1.0 + 0.06, zb]);
    k.box(g, [1.5, 0.06, 0.66], M.darkSteel, [x, 0.03, zb]);
    k.box(g, [0.9, 0.7, 0.02], M.glassDark, [x - 0.15, 1.45, zb + 0.32], null, false);
    const coil = new THREE.Mesh(w.own(new THREE.TorusGeometry(0.22, 0.012, 6, 28)), M.steel);
    coil.position.set(x - 0.15, 1.45, zb + 0.26);
    g.add(coil);
    k.box(g, [1.4, 0.5, 0.5], M.caseDark, [x, 2.35, zb - 0.02]);
    // The sample line and the vent: up from the cabinet's top to the tray along the arch.
    k.cyl(g, [0.012, 0.012, 1.4, 6], M.steel, [x + 0.5, 3.1, zb], null, false);
    k.cyl(g, [0.02, 0.02, 1.4, 6], M.steel, [x + 0.62, 3.1, zb], null, false);
  }
  h.solid(0, zb, 5.0, 0.34);
  // The tube tray along the top of the back wall at 3.8 m, the lines in it running to the headwall over the left side.
  k.box(g, [room.x1 - room.x0 - 0.6, 0.05, 0.36], M.darkSteel, [0, 3.85, zb + 0.05], null, false);
  for (let i = 0; i < 6; i++) k.cyl(g, [0.012, 0.012, room.x1 - room.x0 - 0.8, 6], M.steel, [0, 3.9, zb - 0.1 + i * 0.05], [0, 0, Math.PI / 2], false);
  // Left: the sample-conditioning panel on a frame, flow meters (glass tubes on brass bodies), needle valves, a filter pot each.
  const L = room.x0 + 0.45;
  k.box(g, [0.08, 2.2, 3.6], M.paint, [L, 1.4, 1.2]);
  for (const z of [-0.5, 2.9]) k.box(g, [0.1, 2.5, 0.1], M.darkSteel, [L, 1.25, z]);
  for (let i = 0; i < 4; i++) {
    const z = -0.1 + i * 0.85;
    h.pane(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 12), L + 0.12, 1.75, z);
    k.box(g, [0.08, 0.08, 0.1], M.brass, [L + 0.12, 1.47, z], null, false);
    k.box(g, [0.08, 0.08, 0.1], M.brass, [L + 0.12, 2.03, z], null, false);
    k.cyl(g, [0.02, 0.02, 0.08, 8], M.brass, [L + 0.16, 1.2, z], [0, 0, Math.PI / 2], false);
    k.cyl(g, [0.06, 0.06, 0.22, 12], M.steel, [L + 0.14, 0.75, z], null, false);
  }
  k.cyl(g, [0.025, 0.025, 3.6, 6], M.steel, [L + 0.1, 2.45, 1.2], [Math.PI / 2, 0, 0], false);
  h.solid(L + 0.1, 1.2, 0.25, 1.85);
  // Left, toward the door: the bin for spent sample bombs.
  k.box(g, [0.7, 0.8, 1.0], M.darkSteel, [L + 0.4, 0.4, 5.6]);
  h.solid(L + 0.4, 5.6, 0.38, 0.52);
  // Right: the carrier-gas cylinders chained in a rack, their regulators, the manifold to the ovens.
  const R = room.x1 - 0.45;
  k.box(g, [0.1, 1.6, 3.0], M.darkSteel, [R, 0.8, 1.0]);
  for (const y of [0.6, 1.3]) k.box(g, [0.5, 0.06, 3.0], M.darkSteel, [R - 0.25, y, 1.0], null, false);
  for (let i = 0; i < 5; i++) {
    const z = -0.2 + i * 0.6;
    k.cyl(g, [0.12, 0.12, 1.5, 14], i % 2 ? M.steel : M.darkSteel, [R - 0.3, 0.75, z]);
    k.cyl(g, [0.12, 0.05, 0.14, 14], M.steel, [R - 0.3, 1.57, z]);
    k.box(g, [0.1, 0.12, 0.08], M.brass, [R - 0.3, 1.72, z], null, false);
  }
  k.pipe(g, [[R - 0.3, 1.85, -0.2], [R - 0.3, 1.85, 2.2], [R - 0.3, 3.85, 2.2]], 0.015, M.copper);
  h.solid(R - 0.25, 1.0, 0.35, 1.6);
  // Right, toward the door: a bench with sample bombs laid in a tray, timed.
  k.box(g, [0.75, 0.05, 1.6], M.timber, [R - 0.35, 0.9, 5.0]);
  for (const dz of [-0.7, 0.7]) k.box(g, [0.7, 0.88, 0.06], M.darkSteel, [R - 0.35, 0.44, 5.0 + dz]);
  for (let i = 0; i < 5; i++) k.cyl(g, [0.045, 0.045, 0.32, 10], M.steel, [R - 0.35, 0.97, 4.4 + i * 0.3], [0, 0, Math.PI / 2], false);
  h.solid(R - 0.35, 5.0, 0.4, 0.82);
  // The clock: on the back wall over the middle oven, a plain face and two hands.
  k.cyl(g, [0.3, 0.3, 0.06, 24], M.caseDark, [0, 3.2, zb + 0.32], [Math.PI / 2, 0, 0], false);
  k.cyl(g, [0.27, 0.27, 0.01, 24], M.paint, [0, 3.2, zb + 0.355], [Math.PI / 2, 0, 0], false);
  k.box(g, [0.015, 0.2, 0.01], M.caseDark, [0, 3.27, zb + 0.365], null, false);
  k.box(g, [0.14, 0.015, 0.01], M.caseDark, [0.06, 3.2, zb + 0.365], null, false);
  return finish(h, { more: [[-4.2, 2.0], [4.2, 2.0]] });
}

/**
 * 2 THE CONTROL ROOM. The feed manifold is run from here: its mimic board across the back wall shows the three feeds that meet in
 * the reactor, each line with its control valve drawn as a valve; the operators' console on the left with its dark screens; the
 * marshalling cabinets that the plant's wiring comes into on the right.
 */
function controlRoom(w) {
  const h = start(w, 'site-2', 'host-control-room');
  const { k, g, M, room } = h;
  const zb = room.z0 + 0.25;
  // The mimic board: steel panels on the back wall, 1 to 3.6 m, the three feed lines inlaid in dark strip meeting at the reactor.
  k.box(g, [room.x1 - room.x0 - 0.8, 2.6, 0.12], M.paint, [0, 2.3, zb]);
  for (let x = room.x0 + 0.4; x <= room.x1 - 0.4 + 1e-6; x += (room.x1 - room.x0 - 0.8) / 6) k.box(g, [0.03, 2.6, 0.02], M.darkSteel, [x, 2.3, zb + 0.07], null, false);
  const line = (a, b) => k.box(g, [Math.abs(b[0] - a[0]) + 0.06, Math.abs(b[1] - a[1]) + 0.06, 0.02], M.caseDark, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, zb + 0.075], null, false);
  for (const [i, y] of [[0, 3.2], [1, 2.6], [2, 2.0]].map(([i, y]) => [i, y])) {
    line([-5.2, y], [-1.2, y]);
    line([-1.2, y], [-1.2 + i * 0.6, 1.5]);
    // The control valve on each line: a bow-tie of two triangles, drawn as two small rotated squares.
    for (const s of [-1, 1]) { const v = k.box(g, [0.16, 0.16, 0.02], M.caseDark, [-3.2 + s * 0.11, y, zb + 0.08], null, false); v.rotation.z = Math.PI / 4; }
  }
  line([-1.2, 1.5], [3.6, 1.5]);
  k.box(g, [1.2, 1.8, 0.03], M.caseDark, [4.2, 2.3, zb + 0.08], null, false);
  h.solid(0, zb, room.x1 - room.x0 - 0.8 > 0 ? (room.x1 - room.x0) / 2 - 0.4 : 1, 0.1);
  // Left: the console, an angled desk with four screens and keyboards, two chairs.
  const L = room.x0 + 0.9;
  for (let i = 0; i < 2; i++) {
    const z = 0.6 + i * 1.8;
    k.box(g, [0.9, 0.75, 1.7], M.caseDark, [L, 0.375, z]);
    const top = k.box(g, [0.95, 0.05, 1.75], M.darkSteel, [L + 0.05, 0.78, z]);
    top.rotation.z = -0.08;
    for (const dz of [-0.42, 0.42]) {
      k.box(g, [0.08, 0.5, 0.75], M.caseDark, [L - 0.25, 1.15, z + dz]);
      k.box(g, [0.01, 0.44, 0.68], M.glassDark, [L - 0.2, 1.15, z + dz], null, false);
      k.box(g, [0.18, 0.02, 0.45], M.caseDark, [L + 0.2, 0.82, z + dz], null, false);
    }
    // A chair: seat, back, the column and its five feet.
    const cx = L + 1.0;
    k.box(g, [0.48, 0.08, 0.48], M.rubber, [cx, 0.48, z]);
    k.box(g, [0.06, 0.55, 0.44], M.rubber, [cx + 0.24, 0.8, z]);
    k.cyl(g, [0.03, 0.03, 0.4, 8], M.steel, [cx, 0.25, z], null, false);
    for (let f = 0; f < 5; f++) { const a = f * Math.PI * 2 / 5; k.box(g, [0.3, 0.03, 0.04], M.steel, [cx + Math.cos(a) * 0.15, 0.05, z + Math.sin(a) * 0.15], [0, -a, 0], false); }
  }
  h.solid(L, 1.5, 0.48, 1.8);
  // Right: the marshalling cabinets in a row, their cable entries from the trays overhead.
  const R = room.x1 - 0.45;
  for (let i = 0; i < 4; i++) {
    const z = -1.2 + i * 1.05;
    k.box(g, [0.7, 2.2, 1.0], M.darkSteel, [R - 0.05, 1.1, z]);
    k.box(g, [0.02, 2.0, 0.9], M.caseDark, [R - 0.41, 1.1, z], null, false);
    k.box(g, [0.04, 0.2, 0.02], M.steel, [R - 0.43, 1.2, z + 0.38], null, false);
    k.box(g, [0.3, room.top - 2.2 + 0.1, 0.3], M.darkSteel, [R, 2.2 + (room.top - 2.2 + 0.1) / 2, z], null, false);
  }
  h.solid(R - 0.05, 0.4, 0.38, 2.12);
  // Right, toward the door: the shift desk and its log.
  k.box(g, [0.8, 0.05, 1.4], M.timber, [R - 0.3, 0.76, 5.4]);
  for (const dz of [-0.62, 0.62]) k.box(g, [0.75, 0.74, 0.05], M.darkSteel, [R - 0.3, 0.37, 5.4 + dz]);
  k.box(g, [0.32, 0.04, 0.44], M.paper, [R - 0.3, 0.8, 5.3], null, false);
  h.solid(R - 0.3, 5.4, 0.42, 0.72);
  return finish(h, { more: [[-4.5, 1.8], [4.5, 1.8], [-4.5, 6.6], [4.5, 6.6]] });
}

/**
 * 3 THE PUMP CELLAR under the tank bund's manifold. The tanks' product is pumped out from here, and here their samples are drawn
 * and kept, day after day. Two transfer pumps on their plinths on the left, their lines up through the deck; the valve manifold
 * across the back wall; the sample cooler and the rack of dated samples on the right.
 */
function pumpCellar(w) {
  const h = start(w, 'site-3', 'host-pump-cellar');
  const { k, g, M, room } = h;
  const zb = room.z0 + 0.3;
  // The manifold on the back wall: a header at 1.2 m along it, four branches up through the roof, a valve on each.
  k.cyl(g, [0.14, 0.14, room.x1 - room.x0 - 0.4, 14], M.steel, [0, 1.2, zb + 0.1], [0, 0, Math.PI / 2]);
  for (const x of [-4.4, -1.5, 1.5, 4.4]) {
    k.cyl(g, [0.1, 0.1, room.top - 1.2, 12], M.steel, [x, 1.2 + (room.top - 1.2) / 2, zb + 0.1]);
    valveV(h, x, 2.1, zb + 0.1);
  }
  for (const x of [room.x0 + 0.3, room.x1 - 0.3]) k.box(g, [0.2, 1.3, 0.2], M.darkSteel, [x, 0.6, zb + 0.1]);
  h.solid(0, zb + 0.1, (room.x1 - room.x0) / 2 - 0.1, 0.3);
  // Left: two pumps, each a volute and a motor on a baseplate on a plinth, suction from the header, discharge up and out.
  const L = room.x0 + 1.15;
  for (const z of [0.6, 4.2]) {
    k.box(g, [1.4, 0.3, 2.4], M.concrete, [L, 0.15, z]);
    k.box(g, [1.0, 0.1, 2.0], M.darkSteel, [L, 0.35, z]);
    k.cyl(g, [0.36, 0.36, 0.3, 18], M.paintRed, [L, 0.8, z - 0.55], [Math.PI / 2, 0, 0]);
    k.cyl(g, [0.28, 0.3, 0.9, 16], M.paintRed, [L, 0.75, z + 0.25], [Math.PI / 2, 0, 0]);
    for (let f = 0; f < 6; f++) k.box(g, [0.62, 0.04, 0.8], M.paintRed, [L, 0.48 + f * 0.11, z + 0.25], null, false);
    k.cyl(g, [0.06, 0.06, 0.4, 10], M.steel, [L, 0.8, z - 0.1], [Math.PI / 2, 0, 0], false);
    k.pipe(g, [[L, 0.8, z - 0.7], [L, 0.8, z - 1.05], [L, room.top, z - 1.05]], 0.09, M.steel);
    valveV(h, L, 1.8, z - 1.05, 0.09, 'x');
    h.solid(L, z, 0.72, 1.22);
  }
  // Right: the sample cooler on the wall (a coil in a can), its sample valve over a drip tray; the rack of samples beside it,
  // a bottle for each day, set out in order.
  const R = room.x1 - 0.4;
  k.cyl(g, [0.22, 0.22, 0.8, 16], M.steel, [R - 0.2, 1.6, -0.8]);
  k.pipe(g, [[R - 0.2, 2.0, -0.8], [R - 0.2, room.top, -0.8]], 0.03, M.steel);
  k.cyl(g, [0.02, 0.02, 0.2, 8], M.steel, [R - 0.3, 1.05, -0.8], null, false);
  k.box(g, [0.5, 0.06, 0.5], M.darkSteel, [R - 0.25, 0.75, -0.8], null, false);
  k.box(g, [0.5, 0.74, 0.06], M.darkSteel, [R - 0.25, 0.37, -0.8], null, false);
  h.solid(R - 0.2, -0.8, 0.3, 0.3);
  k.box(g, [0.5, 1.9, 0.06], M.darkSteel, [R - 0.2, 0.95, 0.6]);
  k.box(g, [0.5, 1.9, 0.06], M.darkSteel, [R - 0.2, 0.95, 4.4]);
  for (const y of [0.5, 1.05, 1.6]) {
    k.box(g, [0.5, 0.03, 3.8], M.steel, [R - 0.2, y, 2.5], null, false);
    for (let i = 0; i < 10; i++) {
      // A bottle for each day, the oldest furthest from the cooler.
      const z = 0.85 + i * 0.36;
      h.pane(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10), R - 0.2, y + 0.13, z);
    }
  }
  h.solid(R - 0.2, 2.5, 0.3, 1.95);
  return finish(h, { more: [[-3.6, 4.2], [3.6, 2.5]] });
}

/**
 * 4 INSIDE THE CRACKING REACTOR'S SKIRT. Over the room the vessel's bottom head; through it come the feed nozzles' lines,
 * dropping on either side of the room to their isolating valves and out through the skirt to the feed heater. The heater's
 * thermocouple heads and the temperature recorder stand on the left; the stock of refractory brick for relining on the right.
 */
function reactorSkirt(w) {
  const h = start(w, 'site-4', 'host-reactor-skirt');
  const { k, g, M, room } = h;
  // The feed nozzles: four lines down from the head, two each side, each with a valve at 2 m and a bend out to the wall.
  for (const s of [-1, 1]) for (const z of [-1.4, 1.6]) {
    const x = s * (room.x1 - 0.6);
    const top = room.topAt(x, z);
    k.cyl(g, [0.16, 0.16, top - 2.6, 14], M.cladding, [x, 2.6 + (top - 2.6) / 2, z]);
    valveV(h, x, 2.2, z, 0.12, 'x');
    k.cyl(g, [0.14, 0.14, 1.9, 12], M.steel, [x, 0.95 + 0.05, z]);
    k.box(g, [0.5, 0.1, 0.5], M.darkSteel, [x, 0.05, z], null, false);
    h.round(x, z, 0.3);
  }
  // The steam ring: a header round the room at 3.6 m on brackets, feeding the nozzles' purge.
  const yr = 3.65;
  k.cyl(g, [0.06, 0.06, room.z1 - room.z0 - 1.0, 8], M.steel, [room.x0 + 0.3, yr, (room.z0 + room.z1) / 2], [Math.PI / 2, 0, 0], false);
  k.cyl(g, [0.06, 0.06, room.z1 - room.z0 - 1.0, 8], M.steel, [room.x1 - 0.3, yr, (room.z0 + room.z1) / 2], [Math.PI / 2, 0, 0], false);
  k.cyl(g, [0.06, 0.06, room.x1 - room.x0 - 0.6, 8], M.steel, [0, yr, room.z0 + 0.3], [0, 0, Math.PI / 2], false);
  // Left: thermocouple heads on a frame (one for each point up the riser), their leads to the recorder cabinet.
  const L = room.x0 + 0.5;
  k.box(g, [0.1, 2.0, 2.4], M.darkSteel, [L, 1.2, 3.6]);
  for (let i = 0; i < 6; i++) {
    const z = 2.6 + (i % 3) * 1.0, y = 1.4 + Math.floor(i / 3) * 0.6;
    k.cyl(g, [0.07, 0.07, 0.12, 12], M.steel, [L + 0.12, y, z], [0, 0, Math.PI / 2], false);
    k.cyl(g, [0.01, 0.01, 0.5, 6], M.rubber, [L + 0.08, y + 0.3, z], null, false);
  }
  k.box(g, [0.6, 1.9, 0.8], M.case, [L + 0.25, 0.95, 5.6]);
  k.box(g, [0.02, 0.5, 0.6], M.glassDark, [L + 0.56, 1.4, 5.6], null, false);
  h.solid(L + 0.1, 3.6, 0.3, 1.25);
  h.solid(L + 0.25, 5.6, 0.34, 0.44);
  // Right: refractory brick stacked on pallets, a mixing tub of castable, the trowels.
  const R = room.x1 - 0.8;
  for (const z of [3.0, 4.4]) {
    pallet(h, R, z);
    for (let y = 0; y < 4; y++) for (let i = 0; i < 3; i++) k.box(g, [0.34, 0.12, 0.92], M.paper, [R - 0.38 + i * 0.38, 0.21 + y * 0.125, z], null, false);
    h.solid(R, z, 0.62, 0.52);
  }
  k.cyl(g, [0.38, 0.32, 0.4, 16], M.darkSteel, [R, 0.2, 5.9]);
  k.cyl(g, [0.34, 0.34, 0.01, 16], M.concrete, [R, 0.38, 5.9], null, false);
  h.round(R, 5.9, 0.42);
  return finish(h, { y: 3.8, more: [[-4.0, 4.0, 3.6], [4.0, 4.0, 3.6]] });
}

/**
 * 5 UNDER THE REACTOR TRAIN'S TABLE. The three reactors stand on the table over the room, the product of one going on to the
 * next. Each one's bottom outlet comes down through the table behind the plate, to a valve and a sample point; a chain hoist on a
 * runway beam to lift the valves out; the dosing skid on the left; the sample bombs from each step racked on the right.
 */
function reactorTable(w) {
  const h = start(w, 'site-5', 'host-reactor-table');
  const { k, g, M, room } = h;
  const zb = room.z0 + 0.4;
  const xs = [-6.4, 0, 6.4];
  // The three outlets, west to east as the reactors stand over them: down from the table to a valve, a sample point, and back
  // into the wall to the next reactor's feed.
  for (const x of xs) {
    const top = room.topAt(x, zb);
    k.cyl(g, [0.2, 0.2, top - 2.2, 14], M.cladding, [x, 2.2 + (top - 2.2) / 2, zb]);
    k.cyl(g, [0.3, 0.3, 0.06, 16], M.darkSteel, [x, top - 0.1, zb], null, false);
    valveV(h, x, 1.8, zb, 0.14);
    k.pipe(g, [[x, 1.55, zb], [x, 0.5, zb], [x, 0.5, room.z0 + 0.05]], 0.14, M.steel);
    k.cyl(g, [0.02, 0.02, 0.4, 8], M.steel, [x + 0.3, 1.2, zb + 0.2], null, false);
    k.box(g, [0.3, 0.05, 0.3], M.darkSteel, [x + 0.3, 0.9, zb + 0.2], null, false);
  }
  h.solid(0, zb, 7.0, 0.32);
  // The runway beam along the room under the table, and the chain hoist parked on it at the west end.
  k.beam(g, [room.x0 + 0.2, room.top + 0.2, zb + 1.2], [room.x1 - 0.2, room.top + 0.2, zb + 1.2], { d: 0.3, f: 0.2 });
  k.box(g, [0.4, 0.4, 0.3], M.paintRed, [-6.4, room.top - 0.25, zb + 1.2]);
  k.cyl(g, [0.012, 0.012, 1.8, 6], M.darkSteel, [-6.4, room.top - 1.35, zb + 1.2], null, false);
  k.box(g, [0.08, 0.12, 0.05], M.darkSteel, [-6.4, room.top - 2.3, zb + 1.2], null, false);
  // Left: the dosing skid, two small tanks and their metering pumps on a frame.
  const L = room.x0 + 1.1;
  k.box(g, [1.6, 0.12, 2.6], M.darkSteel, [L, 0.06, 2.6]);
  for (const z of [1.9, 3.3]) {
    k.cyl(g, [0.42, 0.42, 1.3, 16], M.steel, [L - 0.2, 0.77, z]);
    k.box(g, [0.4, 0.3, 0.3], M.paintRed, [L + 0.5, 0.3, z]);
    k.pipe(g, [[L + 0.5, 0.45, z], [L + 0.5, 1.8, z], [L + 0.5, 1.8, room.z0 + 0.3]], 0.025, M.steel);
  }
  h.solid(L, 2.6, 0.82, 1.32);
  // Right: three racks of sample bombs, one for each reactor's outlet, side by side.
  const R = room.x1 - 0.4;
  for (let j = 0; j < 3; j++) {
    const z = 1.0 + j * 1.6;
    k.box(g, [0.5, 1.4, 0.06], M.darkSteel, [R - 0.2, 0.7, z - 0.6]);
    k.box(g, [0.5, 1.4, 0.06], M.darkSteel, [R - 0.2, 0.7, z + 0.6]);
    for (const y of [0.55, 1.15]) {
      k.box(g, [0.5, 0.03, 1.2], M.steel, [R - 0.2, y, z], null, false);
      for (let i = 0; i < 4; i++) k.cyl(g, [0.05, 0.05, 0.28, 10], M.steel, [R - 0.2, y + 0.16, z - 0.42 + i * 0.28], null, false);
    }
  }
  h.solid(R - 0.2, 2.6, 0.3, 2.25);
  return finish(h, { y: 3.8, more: [[-6.4, 3.0, 3.6], [6.4, 3.0, 3.6]] });
}

/**
 * 6 THE CATALYST BUNKER. The catalyst for the reactors is kept here, out of the weather and the storm: new in sealed drums on
 * pallets along the right, spent in open drums on the left, grey and broken; the loading hopper comes down through the roof in
 * the back-left corner with a drum under its slide gate; a sieve on a stand where fines are screened out.
 */
function catalystBunker(w) {
  const h = start(w, 'site-6', 'host-catalyst-bunker');
  const { k, g, M, room } = h;
  // The hopper: a steel cone from the roof down to 1.5 m in the back-left corner, its slide gate, a drum under it on a scale.
  const hx = room.x0 + 1.4, hz = room.z0 + 1.2, top = room.topAt(hx, hz);
  k.cyl(g, [0.9, 0.9, top - 3.2, 18], M.steel, [hx, 3.2 + (top - 3.2) / 2, hz]);
  k.cyl(g, [0.9, 0.2, 1.4, 18], M.steel, [hx, 2.5, hz]);
  k.box(g, [0.5, 0.12, 0.7], M.darkSteel, [hx, 1.75, hz]);
  k.box(g, [0.08, 0.06, 0.6], M.steel, [hx + 0.35, 1.75, hz + 0.3], null, false);
  k.box(g, [0.9, 0.12, 0.9], M.darkSteel, [hx, 0.06, hz]);
  drum(h, hx, hz, M.darkSteel, { y: 0.12, open: M.catalyst });
  for (const s of [-1, 1]) k.box(g, [0.08, top, 0.08], M.darkSteel, [hx + s * 0.95, top / 2, hz - 0.5]);
  h.solid(hx, hz, 1.0, 0.9);
  // Left, toward the door: spent catalyst in open drums, two rows.
  const L = room.x0 + 0.6;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) drum(h, L + j * 0.65, 1.6 + i * 0.7, M.rusted, { open: M.catalyst });
  h.solid(L + 0.33, 2.65, 0.65, 1.4);
  // Behind the plate: the sieve on its stand, its fines tray.
  k.box(g, [1.4, 0.06, 0.6], M.darkSteel, [1.4, 1.1, room.z0 + 0.35]);
  for (const s of [-1, 1]) k.box(g, [0.06, 1.1, 0.5], M.darkSteel, [1.4 + s * 0.65, 0.55, room.z0 + 0.35]);
  k.cyl(g, [0.38, 0.38, 0.22, 20], M.steel, [1.4, 1.25, room.z0 + 0.35]);
  k.box(g, [1.0, 0.1, 0.5], M.darkSteel, [1.4, 0.2, room.z0 + 0.35], null, false);
  h.solid(1.4, room.z0 + 0.35, 0.72, 0.3);
  // Right: new catalyst, sealed drums on pallets, three pallets of four, a fourth pallet stacked two high.
  const R = room.x1 - 0.65;
  for (let p = 0; p < 3; p++) {
    const z = 0.0 + p * 1.25;
    pallet(h, R, z, 1.2, 1.15);
    for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) drum(h, R + dx, z + dz, M.paintRed, { y: 0.14 });
  }
  h.solid(R, 1.25, 0.62, 1.85);
  // A big-bag on its frame near the door, half emptied.
  const bz = 5.4;
  for (const [dx, dz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) k.box(g, [0.08, 2.4, 0.08], M.darkSteel, [R - 0.05 + dx, 1.2, bz + dz]);
  k.box(g, [1.0, 1.1, 1.0], M.paper, [R - 0.05, 1.75, bz]);
  k.cyl(g, [0.15, 0.08, 0.4, 10], M.paper, [R - 0.05, 1.0, bz]);
  h.solid(R - 0.05, bz, 0.62, 0.62);
  return finish(h, { more: [[-4.0, 4.6], [4.0, 4.6]] });
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': analyserBunker,
  'site-2': controlRoom,
  'site-3': pumpCellar,
  'site-4': reactorSkirt,
  'site-5': reactorTable,
  'site-6': catalystBunker
};
