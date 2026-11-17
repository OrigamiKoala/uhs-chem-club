/**
 * verdigris/stations.js — The eight hosts: what the fort keeps in each of its rooms, and the bench built into it.
 *
 * A bench on Verdigris stands in a ROOM of the drowned fort (`fort-plan.js`): the gatehouse's winch chamber, a tower's
 * chamber up a ramp from the boardwalk, the keep's hall, or a cistern down a stair below the water. The room's shell
 * (floor, walls, roof) is the fort's (`terrain.js`). The HOST is what stands in it and its bench, as ONE object: so the
 * overlap rule (which exempts a body's own parts) lets the bench be bolted to the thing it belongs to, and the bay contract
 * (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the camera need empty of it.
 *
 *   1 winch chamber   the gate sluice's winding gear: drum, spur wheel and crank, the counterweight in its guide, sheaves
 *   2 tide tower      the stilling well from the moat with its float and staff, the scale board, the recording drum
 *   3 twin cistern    the drained cell (its twin, still full, through the arcade); the drain and the Fifth's pump hose
 *   4 acid store      racks of acid carboys in wicker, a bottle shelf, a siphon stand
 *   5 salt cistern    squat pillars crusted with salt to the old water line, settling troughs, the neutraliser's sacks
 *   6 dosing hall     the dosing tank high on a steel frame, its metering run down to a receiving vat, a ladder
 *   7 water gate      the culvert trough with its two sluices (one held, one rusted through), the buffer vats
 *   8 great cistern   reserve vats of rising size with level staffs, the breach's spill of rubble in the corner
 *
 * THE HOST FRAME. Origin on the room's floor under the middle of the plate; +z toward the door (and the player), +x to the
 * player's right. Every builder is given its room in that frame (`h.room`: `x0, x1, z0, z1` with the walls' colliders
 * taken off, `top` the clear height at the plate, `topAt(x, z)` the underside of the roof over a point). Machinery stands to
 * the sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m; `verify:bench` measures all of it and
 * `verify:verdigris` measures that no host leaves its room or reaches through its roof.
 *
 * ONLY LAMPS ARE LIT. A host hangs its room's lamps (`lampMark`s the world pools); nothing here owns a PointLight.
 * NO SIGN STANDS IN THE FORT. Nothing here carries lettering.
 *
 * @returns {{ group, bench, benchLocal, colliders, movers }} `colliders` are host-local discs `{ lx, lz, r }` and boxes
 *   `{ lx, lz, hw, hd }`; the world turns them to its own frame. `movers` have `update(t)`.
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { HOST_PLAN, hostExtent, toWorld } from './host-plan.js';
import { ROOMS } from './fort-plan.js';
import { pointedArc } from './terrain.js';
import { kitFor } from '../kettle/kit.js';

/* ----------------------------------------------------------------- the bench */

/** The bench: the shared bay bench in the host's skin, dressed in the fort's patina and dark timber, its cased instrument for `kind`. */
export function buildVdBench(ctx, { kind = 'flask', plate = 'VDG-01', skin = 'deck' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin, plate,
    // The fort's own dress: patinated plate, dark-painted rims, dark timber trays.
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.timberDark },
    tagStyle: { fg: '#1c211c', bg: '#c6cdbf' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.13, 22), M.glassDark, -0.62, height + 0.42, 0.072);
      if (kind === 'flask') {                 // a flask of marsh water with a probe lying beside it
        add(new THREE.CylinderGeometry(0.1, 0.17, 0.22, 20), M.glass, 0.6, y0 + 0.11, 0.1);
        add(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 14), M.glass, 0.6, y0 + 0.28, 0.1);
        add(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 20), M.water, 0.6, y0 + 0.07, 0.1);
        add(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), M.caseDark, 0.95, y0 + 0.012, 0.28, [0, 0, Math.PI / 2]);
      } else if (kind === 'meter') {          // a meter case with a dial and a tall graduated cylinder
        add(new THREE.BoxGeometry(0.4, 0.16, 0.28), M.caseDark, 0.5, y0 + 0.08, 0.1);
        add(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 18), M.paint2, 0.5, y0 + 0.17, 0.12, [Math.PI / 2 - 0.5, 0, 0]);
        add(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 14), M.glass, 0.9, y0 + 0.18, 0.1);
      } else if (kind === 'race') {           // two wells joined by a short bar
        add(new THREE.CylinderGeometry(0.11, 0.09, 0.1, 18), M.paint2, 0.38, y0 + 0.05, 0.1);
        add(new THREE.CylinderGeometry(0.11, 0.09, 0.1, 18), M.paintBlue, 0.84, y0 + 0.05, 0.1);
        add(new THREE.BoxGeometry(0.42, 0.02, 0.05), M.brass, 0.61, y0 + 0.1, 0.1);
      } else if (kind === 'dish') {           // an evaporating dish with a crust
        add(new THREE.CylinderGeometry(0.2, 0.15, 0.08, 20), M.paint2, 0.6, y0 + 0.04, 0.1);
        add(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), M.bloom, 0.6, y0 + 0.085, 0.1);
      } else if (kind === 'burette') {        // a burette on a stand over a flask
        add(new THREE.CylinderGeometry(0.02, 0.03, 0.46, 8), M.caseDark, 0.46, y0 + 0.23, 0.0);
        add(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 10), M.glass, 0.62, y0 + 0.3, 0.1);
        add(new THREE.BoxGeometry(0.2, 0.012, 0.012), M.caseDark, 0.54, y0 + 0.4, 0.08);
        add(new THREE.CylinderGeometry(0.1, 0.15, 0.2, 18), M.glass, 0.62, y0 + 0.1, 0.1);
      } else {                                // a plot board on a stand
        add(new THREE.BoxGeometry(0.7, 0.4, 0.03), M.caseDark, 0.6, y0 + 0.24, 0.04, [-0.3, 0, 0]);
        for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.16, 0.03, 0.02), M.paint2, 0.4 + k * 0.2, y0 + 0.2 + k * 0.05, 0.07, [-0.3, 0, 0]);
      }
    }
  });
}

/* --------------------------------------------------------------- start and finish */

/** A room's lamp: hung from the roof on a rod. */
const ROOM_LAMP = { intensity: 9, distance: 12 };

/** A segmental arc's height over its springing at `off` from its middle (`half` the half span). */
const seg = (rise, off, half) => {
  const R = (half * half + rise * rise) / (2 * rise);
  return rise - (R - Math.sqrt(Math.max(0, R * R - off * off)));
};

/** The underside of a room's roof over a world point, as a height over the room's floor (see `terrain.js` `roomRoof`). */
export function roofUnder(r, x, z) {
  const [minX, maxX, minZ, maxZ] = r.rect, mx = (minX + maxX) / 2, mz = (minZ + maxZ) / 2;
  const depthX = r.face.endsWith('x');
  const across = depthX ? z - mz : x - mx, half = depthX ? (maxZ - minZ) / 2 : (maxX - minX) / 2;
  switch (r.shell) {
    case 'groin': return Math.max(3.6 + seg(r.top - 3.6, z - mz, (maxZ - minZ) / 2), 3.6 + seg(r.top - 3.6, x - mx, (maxX - minX) / 2));
    case 'joists': return Math.abs(Math.abs(across) - 3.4) < 0.3 ? r.top - 0.45 : r.top;
    case 'vault': return 3.0 + seg(r.top - 3.0, across, half);
    case 'corbel': {
      const dw = Math.min(x - minX, maxX - x, z - minZ, maxZ - z), i = Math.floor(dw / 0.45);
      return i >= 6 ? r.top : 3.6 + (r.top - 3.6) / 6 * i;
    }
    case 'pillars': return Math.abs(Math.abs(x - mx) - 4.4) < 0.35 ? r.top - 0.3 : r.top;
    case 'hall': return r.top;
    case 'pointed': return 3.0 + pointedArc(across, half, r.top - 3.0);
    case 'arches': return 3.0 + seg(r.top - 3.0, across, half);
    default: return r.top;
  }
}

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const room = ROOMS.find(r => r.id === plan.room);
  const g = new THREE.Group();
  g.name = name;
  const bench = buildVdBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  const [x0, x1, z0, z1] = hostExtent(plan);
  const topAt = (lx, lz) => roofUnder(room, ...toWorld(plan, lx, lz));
  const box = { x0, x1, z0, z1, top: room.top, topAt, room };
  const colliders = [{ lx: 0, lz: 0, hw: 2.4, hd: 0.65 }];
  const movers = [];
  /** Hang a lamp from the roof at (x, z), `y` over the floor. */
  const hang = (x, z, y = 3.5, opts = ROOM_LAMP) => k.pendant(g, x, y, z, Math.min(topAt(x, z), 9) - 0.05, opts);
  const solid = (lx, lz, hw, hd) => colliders.push({ lx, lz, hw, hd });
  const round = (lx, lz, r) => colliders.push({ lx, lz, r });
  return { k, M: w.M, g, bench, colliders, movers, room: box, hang, solid, round, w, plan };
}

/** The lamp over the plate, one by the door, and the host handed back. */
const finish = (h, y = 3.5) => {
  h.hang(0, -0.3, y);
  const zd = h.room.z1 - 2.2;
  h.hang(0, zd, Math.min(3.4, h.room.topAt(0, zd) - 0.6));
  return { group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders, movers: h.movers };
};

/* ------------------------------------------------------------------------ shared pieces */

/** A handwheel on a spindle, facing along `axis` ('x' or 'z'). */
function handwheel(h, x, y, z, axis = 'z', r = 0.28) {
  const { k, g, M } = h;
  const ring = new THREE.Mesh(h.w.own(new THREE.TorusGeometry(r, 0.025, 8, 24)), M.darkSteel);
  ring.position.set(x, y, z);
  if (axis !== 'z') ring.rotation.y = Math.PI / 2;
  g.add(ring);
  for (let i = 0; i < 3; i++) {
    const sp = k.box(g, [2 * r, 0.025, 0.025], M.darkSteel, [x, y, z], null, false);
    if (axis === 'z') sp.rotation.z = i * Math.PI / 3; else { sp.rotation.y = Math.PI / 2; sp.rotation.x = i * Math.PI / 3; }
  }
}

/** A drum standing on its end, with its two rolling hoops. */
const drum = (h, x, z, mat, y = 0) => {
  h.k.cyl(h.g, [0.29, 0.29, 0.88, 16], mat, [x, y + 0.44, z]);
  for (const dy of [0.28, 0.6]) h.k.cyl(h.g, [0.3, 0.3, 0.03, 16], h.M.darkSteel, [x, y + dy, z], null, false);
};

/** A timber rack along z against a side wall at `x`: uprights, shelves, and `load(x, y, z, bay)` on each bay of each shelf. */
function rackAlongZ(h, x, z0, z1, { depth = 0.7, top = 2.4, shelves = [0.3, 1.25, 2.2], bay = 1.6, load = null } = {}) {
  const { k, g, M } = h;
  const n = Math.max(1, Math.round((z1 - z0) / bay));
  const step = (z1 - z0) / n;
  for (let i = 0; i <= n; i++) for (const dx of [-depth / 2 + 0.04, depth / 2 - 0.04]) k.box(g, [0.07, top, 0.07], M.timberDark, [x + dx, top / 2, z0 + i * step]);
  for (const y of shelves) {
    k.box(g, [depth, 0.05, z1 - z0], M.timber, [x, y, (z0 + z1) / 2]);
    if (load) for (let i = 0; i < n; i++) load(x, y + 0.025, z0 + (i + 0.5) * step, step);
  }
  h.solid(x, (z0 + z1) / 2, depth / 2, (z1 - z0) / 2);
}

/** A vat on a low plinth, `r` its radius and `ht` its height, water to `fill` of it, a level staff up its side. */
function vat(h, x, z, r, ht, fill = 0.7, staff = true) {
  const { k, g, M } = h;
  k.cyl(g, [r + 0.12, r + 0.12, 0.2, 20], M.stone, [x, 0.1, z]);
  k.tube(g, [r, ht, 22], M.copperClad, [x, 0.2 + ht / 2, z]);
  k.cyl(g, [r, r, 0.04, 22], M.darkSteel, [x, 0.22, z], null, false);
  k.cyl(g, [r - 0.04, r - 0.04, 0.02, 22], M.water, [x, 0.2 + ht * fill, z], null, false);
  for (const y of [0.35, ht * 0.5 + 0.2, ht + 0.15]) k.cyl(g, [r + 0.025, r + 0.025, 0.05, 22], M.patinaDark, [x, y, z], null, false);
  if (staff) {
    k.box(g, [0.1, ht + 0.5, 0.03], M.paint2, [x, 0.2 + (ht + 0.5) / 2, z + r + 0.08]);
    for (let i = 1; i < 10; i++) k.box(g, [0.06, 0.012, 0.012], M.caseDark, [x - 0.02, 0.2 + (ht + 0.4) * i / 10, z + r + 0.1], null, false);
  }
  h.round(x, z, r + 0.15);
}

/* ------------------------------------------------------------------------ the hosts */

/**
 * 1 THE WINCH CHAMBER of the flooded gatehouse. The gate's sluice hands water from the moat to the ward: its winding gear
 * stands here. A drum on a cast-iron frame with a spur wheel and a crank to the right; the counterweight in its timber
 * guide to the left; the chain running from the drum up over two sheaves on a beam high across the back and down through a
 * slot in the floor by the left wall to the gate.
 */
function winchChamber(w) {
  const h = start(w, 'site-1', 'host-winch-chamber');
  const { k, g, M, room } = h;
  // The crab winch on the right: two cheeks, the drum across them, the spur wheel and its pinion, a crank each side.
  const wx = 4.4, wz = 2.0;
  for (const dz of [-0.75, 0.75]) {
    k.box(g, [1.6, 0.16, 0.16], M.castIron, [wx, 0.08, wz + dz]);
    k.strut(g, [wx - 0.75, 0.1, wz + dz], [wx, 1.55, wz + dz], 0.07, M.castIron, 6);
    k.strut(g, [wx + 0.75, 0.1, wz + dz], [wx, 1.55, wz + dz], 0.07, M.castIron, 6);
  }
  k.cyl(g, [0.32, 0.32, 1.3, 18], M.darkSteel, [wx, 1.2, wz], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 7; i++) k.cyl(g, [0.335, 0.335, 0.07, 18], M.steel, [wx, 1.2, wz - 0.48 + i * 0.16], [Math.PI / 2, 0, 0], false);
  k.cyl(g, [0.72, 0.72, 0.08, 28], M.castIron, [wx, 1.2, wz + 0.9], [Math.PI / 2, 0, 0]);
  k.cyl(g, [0.2, 0.2, 0.1, 12], M.castIron, [wx + 0.5, 0.7, wz + 0.9], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) {
    k.box(g, [0.06, 0.5, 0.06], M.darkSteel, [wx + 0.5, 0.55, wz + s * 1.0]);
    k.box(g, [0.06, 0.06, 0.3], M.timber, [wx + 0.5, 0.32, wz + s * 1.15]);
  }
  // The pawl and its ratchet on the drum's far end.
  k.cyl(g, [0.42, 0.42, 0.06, 20], M.darkSteel, [wx, 1.2, wz - 0.9], [Math.PI / 2, 0, 0]);
  k.box(g, [0.08, 0.5, 0.06], M.steel, [wx - 0.3, 1.55, wz - 0.92], [0, 0, -0.5]);
  h.solid(wx, wz, 0.9, 1.25);
  // The beam high across the back on its two corbels, the two sheaves on it; the chain from the drum to the floor slot.
  const by = 3.15;
  k.box(g, [room.x1 - room.x0, 0.36, 0.3], M.timberDark, [(room.x0 + room.x1) / 2, by, -2.35]);
  for (const x of [room.x0 + 0.25, room.x1 - 0.25]) k.box(g, [0.5, 0.4, 0.4], M.coping, [x, by - 0.38, -2.4]);
  for (const x of [-4.4, 4.4]) {
    k.cyl(g, [0.3, 0.3, 0.1, 18], M.castIron, [x, by - 0.5, -2.35], [Math.PI / 2, 0, 0]);
    k.box(g, [0.08, 0.42, 0.26], M.darkSteel, [x, by - 0.3, -2.35]);
  }
  const chain = [[wx, 1.52, wz], [4.4, by - 0.2, -2.15], [-4.4, by - 0.2, -2.15], [-4.4, 0.05, -2.15]];
  k.pipe(g, chain, 0.035, M.darkSteel);
  // The slot the chain drops through, framed in iron, at the foot of the back wall on the left.
  k.box(g, [0.7, 0.04, 0.44], M.castIron, [-4.4, 0.02, -2.3], null, false);
  // The counterweight on the left, in a timber guide against the side wall: four cast weights on a rod, half way up.
  const cx = -5.0, cz = 2.6;
  for (const dz of [-0.45, 0.45]) k.box(g, [0.16, 3.4, 0.16], M.timberDark, [cx, 1.7, cz + dz]);
  k.box(g, [0.5, 0.14, 1.1], M.timberDark, [cx, 3.35, cz]);
  for (let i = 0; i < 4; i++) k.box(g, [0.42, 0.18, 0.72], M.castIron, [cx, 1.3 + i * 0.2, cz]);
  k.cyl(g, [0.03, 0.03, 2.2, 8], M.steel, [cx, 2.3, cz]);
  h.solid(cx, cz, 0.3, 0.6);
  // A coil of spare chain and a grease drum by the door on the left.
  drum(h, -4.9, 7.0, M.drumB);
  h.round(-4.9, 7.0, 0.35);
  for (let i = 0; i < 3; i++) k.cyl(g, [0.38 - i * 0.06, 0.38 - i * 0.06, 0.07, 18], M.darkSteel, [-4.6, 0.04 + i * 0.07, 5.6], null, false);
  return finish(h, 3.6);
}

/**
 * 2 THE TIDE CHAMBER of the corner tower. The scale is read here: a stilling well rising from the moat through the floor in
 * the back left corner, its float and graduated staff; the scale board of marks closing up toward the top on the back
 * wall; a recording drum on its cabinet to the right; a shelf of logbooks.
 */
function tideTower(w) {
  const h = start(w, 'site-2', 'host-tide-tower');
  const { k, g, M, room } = h;
  // The stilling well: a cast-iron pipe 1.1 m across from the floor to the ceiling's girder, a float wire over a pulley.
  const sx = room.x0 + 1.0, sz = -1.3;
  k.cyl(g, [0.55, 0.6, 3.9, 20], M.castIron, [sx, 1.95, sz]);
  for (const y of [0.4, 1.6, 2.8, 3.8]) k.cyl(g, [0.63, 0.63, 0.08, 20], M.darkSteel, [sx, y, sz], null, false);
  k.cyl(g, [0.6, 0.6, 0.05, 20], M.darkSteel, [sx, 3.93, sz], null, false);
  k.cyl(g, [0.18, 0.18, 0.06, 14], M.brass, [sx + 0.4, 4.05, sz], [Math.PI / 2, 0, 0]);
  k.box(g, [0.012, 2.2, 0.012], M.steel, [sx + 0.58, 2.95, sz], null, false);
  k.box(g, [0.3, 0.22, 0.12], M.brass, [sx + 0.58, 1.8, sz], null, false);
  h.round(sx, sz, 0.7);
  // The graduated staff beside it: a white board 4 m high with a mark every 0.1 m, longer every metre.
  k.box(g, [0.18, 3.9, 0.04], M.paint2, [sx + 1.05, 2.15, room.z0 + 0.04]);
  for (let i = 1; i < 38; i++) k.box(g, [i % 10 ? 0.07 : 0.16, 0.014, 0.012], M.caseDark, [sx + 1.0 - (i % 10 ? 0.03 : 0), 0.25 + i * 0.1, room.z0 + 0.07], null, false);
  // THE SCALE BOARD across the back wall behind the plate: a dark board, its marks closing up as they rise (a scale of tens).
  const bx0 = -2.6, bx1 = 3.4, by0 = 1.25, by1 = 3.65;
  k.box(g, [bx1 - bx0, by1 - by0, 0.05], M.board, [(bx0 + bx1) / 2, (by0 + by1) / 2, room.z0 + 0.03]);
  for (let d = 0; d < 3; d++) for (let m = 1; m < 10; m++) {
    const y = by0 + 0.12 + (d + Math.log10(m)) * (by1 - by0 - 0.24) / 3;
    k.box(g, [m === 1 ? 1.6 : 0.6, 0.016, 0.01], M.paint2, [(bx0 + bx1) / 2 - (m === 1 ? 0 : 0.5), y, room.z0 + 0.06], null, false);
  }
  // The recording drum on its cabinet to the right: a clock drum under a glass hood, its pen arm.
  const rx = room.x1 - 0.9, rz = 1.2;
  k.box(g, [1.0, 1.0, 1.4], M.timberDark, [rx, 0.5, rz]);
  k.cyl(g, [0.22, 0.22, 0.8, 18], M.paint2, [rx, 1.25, rz], [Math.PI / 2, 0, 0]);
  k.box(g, [0.7, 0.55, 1.1], M.glass, [rx, 1.28, rz]);
  k.box(g, [0.5, 0.02, 0.02], M.brass, [rx - 0.1, 1.42, rz], null, false);
  h.solid(rx, rz, 0.5, 0.7);
  // Logbooks on a shelf against the right wall nearer the door, and a stool.
  rackAlongZ(h, room.x1 - 0.4, 4.4, 7.6, { depth: 0.5, top: 2.2, shelves: [0.5, 1.2, 1.9], load: (x, y, z, b) => {
    for (let i = 0; i < 6; i++) k.box(g, [0.3, 0.32, 0.07], i % 2 ? M.paintRed : M.board, [x, y + 0.16, z - b / 2 + 0.25 + i * 0.12], null, false);
  } });
  k.cyl(g, [0.2, 0.2, 0.05, 14], M.timber, [rx - 1.1, 0.62, rz + 1.2]);
  for (const a of [0, 2.1, 4.2]) k.strut(g, [rx - 1.1, 0.6, rz + 1.2], [rx - 1.1 + Math.cos(a) * 0.22, 0, rz + 1.2 + Math.sin(a) * 0.22], 0.02, M.timberDark, 5);
  h.round(rx - 1.1, rz + 1.2, 0.28);
  // A tide table's hooks along the left wall: a row of brass tallies hung on pegs (bare brass, no lettering).
  for (let i = 0; i < 8; i++) {
    k.box(g, [0.04, 0.04, 0.12], M.timberDark, [room.x0 + 0.06, 1.85, 2.0 + i * 0.5], null, false);
    k.box(g, [0.02, 0.16, 0.1], M.brass, [room.x0 + 0.1, 1.7, 2.0 + i * 0.5], null, false);
  }
  return finish(h, 3.5);
}

/**
 * 3 THE TWIN CISTERN. Two equal cells: this one drained, its twin through the arcade on the right still full. The drain's
 * grating and valve in the floor behind the plate; the Fifth's pump hose run from the drain along the left wall to the
 * stair; two dipping ladles on a beam and the sample jars on a rack against the left wall; the old water line stains the
 * walls.
 */
function twinCistern(w) {
  const h = start(w, 'site-3', 'host-twin-cistern');
  const { k, g, M, room } = h;
  // The drain behind the plate: a grating, a valve column with its wheel.
  k.box(g, [1.0, 0.03, 0.5], M.castIron, [-1.2, 0.015, -2.35], null, false);
  k.cyl(g, [0.1, 0.12, 0.9, 12], M.castIron, [1.4, 0.45, -2.4]);
  handwheel(h, 1.4, 0.95, -2.4, 'x', 0.22);
  // The Fifth's pump hose: from the drain round the left of the plate and along the left wall toward the stair.
  const hx = room.x0 + 0.35;
  k.pipe(g, [[-1.2, 0.09, -2.3], [hx, 0.09, -2.3], [hx, 0.09, room.z1 - 0.5]], 0.085, M.rubber);
  // Sample jars on a rack along the left wall, two dippers on pegs.
  rackAlongZ(h, room.x0 + 0.45, 0.4, 4.2, { depth: 0.55, top: 1.8, shelves: [0.35, 1.0, 1.65], bay: 1.3, load: (x, y, z, b) => {
    for (let i = 0; i < 3; i++) k.cyl(g, [0.09, 0.09, 0.24, 12], M.glass, [x, y + 0.12, z - b / 3 + i * b / 3], null, false);
  } });
  for (const dz of [5.2, 5.9]) {
    k.box(g, [0.08, 0.08, 0.2], M.timberDark, [room.x0 + 0.06, 2.0, dz], null, false);
    k.cyl(g, [0.02, 0.02, 1.4, 6], M.timber, [room.x0 + 0.13, 1.35, dz], null, false);
    k.cyl(g, [0.12, 0.08, 0.12, 12], M.copperClad, [room.x0 + 0.13, 0.62, dz], null, false);
  }
  h.solid(room.x0 + 0.2, 5.55, 0.2, 0.45);
  // By the arcade on the right: the measuring rod the twin's level is read with, on two hooks under the arches' sill.
  k.box(g, [0.06, 0.06, 3.4], M.timber, [room.x1 - 0.1, 1.0, 2.2]);
  for (const z of [0.8, 3.6]) k.box(g, [0.18, 0.06, 0.06], M.darkSteel, [room.x1 - 0.06, 0.94, z], null, false);
  // A tally board of the two cells' readings on the back wall, left of the plate (dark board, chalk strokes, no words).
  k.box(g, [1.8, 1.1, 0.04], M.board, [-4.6, 1.9, room.z0 + 0.02]);
  for (let i = 0; i < 5; i++) k.box(g, [0.02, 0.22, 0.01], M.paint2, [-5.2 + i * 0.12, 2.1, room.z0 + 0.05], null, false);
  for (let i = 0; i < 5; i++) k.box(g, [0.02, 0.22, 0.01], M.paint2, [-4.4 + i * 0.12, 1.7, room.z0 + 0.05], null, false);
  // The old water line round the walls: a band of dark stain at the swamp's level.
  const stain = new THREE.Group();
  stain.userData.phys = 'decal';
  const yLine = -0.55 - (-2.8);
  for (const [x, z, sx, sz] of [[(room.x0 + room.x1) / 2, room.z0 - 0.28, room.x1 - room.x0, 0.02], [room.x0 - 0.28, (room.z0 + room.z1) / 2, 0.02, room.z1 - room.z0]]) {
    k.box(stain, [sx, 0.35, sz], M.patinaDark, [x, yLine, z], null, false);
  }
  g.add(stain);
  return finish(h, 3.5);
}

/**
 * 4 THE ACID STORE of the south-west tower: the Fifth's reagents, compared by what they are made of. Racks of glass carboys
 * in wicker along both walls, a long shelf of stoppered bottles behind the plate, a siphon stand and a carboy tilter.
 */
function acidStore(w) {
  const h = start(w, 'site-4', 'host-acid-store');
  const { k, g, M, room } = h;
  const carboy = (x, y, z, s = 1) => {
    k.cyl(g, [0.26 * s, 0.24 * s, 0.42 * s, 14], M.wicker, [x, y + 0.21 * s, z]);
    k.cyl(g, [0.2 * s, 0.25 * s, 0.16 * s, 14], M.glassCarboy, [x, y + 0.5 * s, z]);
    k.cyl(g, [0.05, 0.06, 0.12, 10], M.glassCarboy, [x, y + 0.64 * s, z]);
    k.cyl(g, [0.055, 0.055, 0.04, 10], M.castIron, [x, y + 0.72 * s, z], null, false);
  };
  // Two racks of carboys, one each side, two tiers each; the carboys on each rack ordered by size.
  for (const sx of [-1, 1]) {
    const x = sx * (room.x1 - 0.5);
    rackAlongZ(h, x, -2.0, 6.0, { depth: 0.75, top: 1.9, shelves: [0.15, 1.05], bay: 2.0, load: (rx, y, z, b) => {
      for (let i = 0; i < 2; i++) carboy(rx, y, z - b / 4 + i * b / 2, 0.85 + (z + 2) * 0.03);
    } });
  }
  // The bottle shelf behind the plate, along the back wall, above and below the plate's reach.
  for (const y of [1.25, 1.85, 2.45]) k.box(g, [5.6, 0.04, 0.32], M.timber, [0, y, room.z0 + 0.2]);
  for (const x of [-2.75, 2.75]) k.box(g, [0.05, 1.6, 0.32], M.timberDark, [x, 1.9, room.z0 + 0.2]);
  h.solid(0, room.z0 + 0.2, 2.8, 0.2);
  for (const y of [1.25, 1.85, 2.45]) for (let i = 0; i < 16; i++) {
    const x = -2.5 + i * 0.33, tall = 0.18 + (i * 7 % 5) * 0.03;
    k.cyl(g, [0.06, 0.07, tall, 10], i % 3 ? M.glassCarboy : M.glassDark, [x, y + 0.02 + tall / 2, room.z0 + 0.2], null, false);
  }
  // The siphon stand and a carboy tilter near the door on the right.
  const tx = room.x1 - 1.9, tz = 7.0;
  k.box(g, [0.9, 0.08, 0.9], M.castIron, [tx, 0.04, tz]);
  for (const dx of [-0.4, 0.4]) k.box(g, [0.06, 1.0, 0.06], M.castIron, [tx + dx, 0.5, tz]);
  k.cyl(g, [0.04, 0.04, 0.86, 8], M.steel, [tx, 0.95, tz], [0, 0, Math.PI / 2]);
  const tilted = new THREE.Group();
  tilted.position.set(tx, 0.95, tz);
  tilted.rotation.z = -0.35;
  g.add(tilted);
  k.cyl(tilted, [0.27, 0.27, 0.6, 14], M.wicker, [0, -0.1, 0]);
  k.cyl(tilted, [0.2, 0.26, 0.2, 14], M.glassCarboy, [0, 0.3, 0]);
  h.solid(tx, tz, 0.5, 0.5);
  k.pipe(g, [[tx - 0.6, 1.3, tz], [tx - 1.0, 1.1, tz], [tx - 1.0, 0.3, tz]], 0.02, M.rubber);
  k.cyl(g, [0.16, 0.14, 0.3, 14], M.glass, [tx - 1.0, 0.15, tz]);
  h.round(tx - 1.0, tz, 0.22);
  return finish(h, 3.6);
}

/**
 * 5 THE SALT CISTERN. What was left after neutralising: squat pillars carrying the flat roof, white with salt to the old
 * water line; two settling troughs against the back wall with their crust; the neutraliser's sacks stacked by the door; a
 * salt rake and a heap scraped into the corner.
 */
function saltCistern(w) {
  const h = start(w, 'site-5', 'host-salt-cistern');
  const { k, g, M, room } = h;
  const line = -0.55 - (-2.0);
  // The pillars, in two rows either side of the lane: stone shafts, a salt sleeve to the water line, a capital.
  for (const x of [-4.4, 4.4]) for (const z of [-1.4, 1.9, 5.2, 8.0]) {
    if (z > room.z1 - 0.5) continue;
    k.slab(g, [0.66, room.top - 0.3, 0.66], M.stone, [x, (room.top - 0.3) / 2, z], { tile: 1.2 });
    k.box(g, [0.74, line, 0.74], M.salt, [x, line / 2, z]);
    k.box(g, [0.9, 0.25, 0.9], M.coping, [x, room.top - 0.42, z]);
    h.solid(x, z, 0.4, 0.4);
  }
  // Two settling troughs across the back wall, crusted white inside.
  for (const sx of [-1, 1]) {
    const cx = sx * 1.5;
    k.slab(g, [2.6, 0.75, 0.6], M.stone, [cx, 0.375, room.z0 + 0.3], { tile: 1.2 });
    k.box(g, [2.4, 0.04, 0.42], M.salt, [cx, 0.72, room.z0 + 0.3]);
  }
  // The neutraliser's sacks on a pallet by the door on the left, a lime bin and its scoop.
  const px = room.x0 + 1.0, pz = room.z1 - 1.6;
  k.box(g, [1.4, 0.12, 1.2], M.timber, [px, 0.06, pz]);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 2; i++) k.box(g, r % 2 ? [0.62, 0.2, 0.5] : [0.5, 0.2, 0.62], M.paint2, [px + (r % 2 ? 0 : -0.3 + i * 0.6), 0.22 + r * 0.2, pz + (r % 2 ? -0.27 + i * 0.54 : 0)]);
  h.solid(px, pz, 0.7, 0.6);
  // The salt heap scraped into the right back corner, and the rake leaning against the wall over it.
  const hx = room.x1 - 0.9, hz = room.z0 + 1.0;
  const heap = new THREE.Mesh(w.own(new THREE.ConeGeometry(0.9, 0.7, 12)), M.salt);
  heap.position.set(hx, 0.35, hz);
  g.add(heap);
  h.round(hx, hz, 0.9);
  k.strut(g, [hx + 0.3, 0.02, hz + 1.1], [room.x1 - 0.05, 2.0, hz + 0.6], 0.025, M.timber, 6);
  k.box(g, [0.06, 0.08, 0.6], M.darkSteel, [hx + 0.3, 0.06, hz + 1.1]);
  return finish(h, 3.4);
}

/**
 * 6 THE KEEP'S HALL, where the dosing is done. The dosing tank stands high over the back on a steel frame; its metering run
 * comes down the right in a glass sight tube with a valve at each end into the receiving vat beside the plate; a ladder
 * goes up the frame on the left to the tank's walkway; indicator bottles on a side table.
 */
function dosingHall(w) {
  const h = start(w, 'site-6', 'host-dosing-hall');
  const { k, g, M, room } = h;
  // The frame: four stanchions, two at the back wall and two forward at the sides, carrying a deck at 3.6 m.
  const fy = 3.6, fz0 = room.z0 + 0.3, fz1 = -2.15;
  for (const x of [-4.6, 4.6]) for (const z of [fz0, fz1]) k.stanchion(g, x, z, 0, fy, { d: 0.25, b: 0.22 });
  for (const z of [fz0, fz1]) k.beam(g, [-4.6, fy - 0.2, z], [4.6, fy - 0.2, z], { d: 0.36, f: 0.22 });
  k.box(g, [9.6, 0.06, fz1 - fz0 + 0.6], M.steel, [0, fy + 0.03, (fz0 + fz1) / 2]);
  for (const x of [-4.6, 4.6]) { h.solid(x, (fz0 + fz1) / 2, 0.2, (fz1 - fz0) / 2 + 0.15); }
  // The dosing tank on the deck: a horizontal cylinder with dished ends, a filler, a sight glass.
  k.cyl(g, [0.85, 0.85, 5.6, 22], M.copperClad, [0, fy + 0.95, (fz0 + fz1) / 2], [0, 0, Math.PI / 2]);
  for (const s of [-1, 1]) {
    const end = new THREE.Mesh(w.own(new THREE.SphereGeometry(0.85, 18, 10, 0, Math.PI)), M.copperClad);
    end.position.set(s * 2.8, fy + 0.95, (fz0 + fz1) / 2);
    end.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(end);
  }
  for (const x of [-1.6, 1.6]) k.box(g, [0.25, 0.55, 1.2], M.darkSteel, [x, fy + 0.3, (fz0 + fz1) / 2]);
  k.cyl(g, [0.12, 0.12, 0.5, 12], M.castIron, [-1.0, fy + 1.95, (fz0 + fz1) / 2]);
  // A guard rail round the deck's front edge.
  k.box(g, [9.4, 0.05, 0.05], M.darkSteel, [0, fy + 1.0, fz1 + 0.25]);
  for (const x of [-4.4, -1.5, 1.5, 4.4]) k.box(g, [0.05, 1.0, 0.05], M.darkSteel, [x, fy + 0.5, fz1 + 0.25], null, false);
  // The metering run: from the tank's end down the right in a glass sight tube with a valve top and bottom, to the vat.
  const mx = 3.9;
  k.pipe(g, [[2.8, fy + 0.5, (fz0 + fz1) / 2], [mx, fy + 0.5, fz1 + 0.6], [mx, 2.5, fz1 + 0.6]], 0.05, M.copper);
  k.cyl(g, [0.05, 0.05, 1.2, 12], M.glass, [mx, 1.85, fz1 + 0.6]);
  for (const y of [2.5, 1.2]) { k.cyl(g, [0.08, 0.08, 0.14, 10], M.brass, [mx, y, fz1 + 0.6]); handwheel(h, mx + 0.16, y, fz1 + 0.6, 'x', 0.12); }
  k.pipe(g, [[mx, 1.2, fz1 + 0.6], [mx, 0.95, fz1 + 1.4]], 0.04, M.copper);
  vat(h, mx + 0.4, fz1 + 2.1, 0.6, 0.85, 0.6, false);
  // The ladder up the left stanchion to the deck.
  const lx = -4.6 + 0.45, lz = fz1 + 0.25;
  for (const dx of [-0.22, 0.22]) k.box(g, [0.05, fy, 0.05], M.darkSteel, [lx + dx, fy / 2, lz]);
  for (let i = 1; i < 12; i++) k.box(g, [0.44, 0.03, 0.03], M.darkSteel, [lx, i * 0.3, lz], null, false);
  // Indicator bottles on a side table along the left wall nearer the door.
  const tx = room.x0 + 0.5;
  k.box(g, [0.8, 0.06, 2.4], M.timber, [tx, 0.9, 4.0]);
  for (const z of [3.0, 5.0]) for (const dx of [-0.3, 0.3]) k.box(g, [0.06, 0.9, 0.06], M.timberDark, [tx + dx, 0.45, z]);
  const dyes = [M.paintRed, M.paintYellow, M.paintBlue, M.paint2];
  for (let i = 0; i < 8; i++) k.cyl(g, [0.05, 0.06, 0.2, 10], dyes[i % 4], [tx, 1.03, 3.1 + i * 0.26], null, false);
  h.solid(tx, 4.0, 0.4, 1.2);
  // The hall is tall: three lamps, one over the plate, one by the door, one hung from the tank deck over the vat.
  k.pendant(g, mx + 0.4, 2.7, fz1 + 2.1, fy - 0.05, ROOM_LAMP);
  return finish(h, 3.6);
}

/**
 * 7 THE WATER GATE's chamber. The fort's water gate lets the swamp in through the north wall: its culvert runs along the
 * left wall as a stone trough with two sluice gates in it, the near one holding the water back, the far one rusted
 * through and leaking; on the right, the two vats the Fifth never mixed, acid and its salt, piped to a mixing box.
 */
function waterGate(w) {
  const h = start(w, 'site-7', 'host-water-gate');
  const { k, g, M, room } = h;
  // The culvert trough along the left wall: stone sides, water in it, from the back wall to near the door.
  const cx0 = room.x0, cx1 = room.x0 + 1.5, cz0 = room.z0, cz1 = 6.4, ty = 0.9;
  k.slab(g, [cx1 - cx0, ty, 0.25], M.stone, [(cx0 + cx1) / 2, ty / 2, cz1 - 0.125], { tile: 1.2 });
  k.slab(g, [0.25, ty, cz1 - cz0], M.stone, [cx1 - 0.125, ty / 2, (cz0 + cz1) / 2], { tile: 1.2 });
  k.box(g, [cx1 - cx0 - 0.25, 0.1, cz1 - cz0 - 0.25], M.stone, [(cx0 + cx1 - 0.25) / 2, 0.05, (cz0 + cz1 - 0.25) / 2]);
  h.solid((cx0 + cx1) / 2, (cz0 + cz1) / 2, (cx1 - cx0) / 2, (cz1 - cz0) / 2);
  // The water stands high behind the sound gate (back) and low past the leaking one.
  const gz1 = 0.6, gz2 = 3.6;
  k.box(g, [cx1 - cx0 - 0.3, 0.02, gz1 - cz0], M.water, [(cx0 + cx1 - 0.25) / 2, 0.78, (cz0 + gz1) / 2], null, false);
  k.box(g, [cx1 - cx0 - 0.3, 0.02, gz2 - gz1 - 0.2], M.water, [(cx0 + cx1 - 0.25) / 2, 0.5, (gz1 + gz2) / 2], null, false);
  k.box(g, [cx1 - cx0 - 0.3, 0.02, cz1 - gz2 - 0.4], M.water, [(cx0 + cx1 - 0.25) / 2, 0.22, (gz2 + cz1) / 2 - 0.1], null, false);
  for (const [gz, sound] of [[gz1, true], [gz2, false]]) {
    const gx = (cx0 + cx1 - 0.25) / 2;
    for (const dx of [-0.6, 0.55]) k.box(g, [0.14, 2.6, 0.18], M.castIron, [gx + dx, 1.3, gz]);
    k.box(g, [1.4, 0.2, 0.26], M.castIron, [gx, 2.6, gz]);
    // The plate: whole on the sound gate; on the leaking gate eaten through low down (two plates either side of the hole).
    if (sound) k.box(g, [1.05, 0.9, 0.06], M.patinaDark, [gx, 0.55, gz]);
    else { k.box(g, [1.05, 0.45, 0.06], M.rusted, [gx, 0.8, gz]); k.box(g, [0.3, 0.3, 0.06], M.rusted, [gx - 0.38, 0.25, gz]); }
    k.box(g, [0.06, 1.5, 0.06], M.steel, [gx, 1.8, gz + 0.1]);
    handwheel(h, gx, 2.85, gz + 0.12, 'z', 0.26);
  }
  // The grille in the back wall where the culvert comes in from the swamp: iron bars over a dark opening.
  k.box(g, [cx1 - cx0 - 0.3, 1.2, 0.04], M.slit, [(cx0 + cx1 - 0.25) / 2, 1.1, room.z0 + 0.03], null, false);
  for (let i = 0; i < 6; i++) k.box(g, [0.04, 1.3, 0.04], M.castIron, [cx0 + 0.15 + i * 0.22, 1.1, room.z0 + 0.08], null, false);
  // The two vats on the right, side by side, a pipe from each to a mixing box between them that never ran.
  const vx = room.x1 - 1.1;
  vat(h, vx, -0.9, 0.75, 1.5, 0.75);
  vat(h, vx, 2.3, 0.75, 1.5, 0.4);
  k.box(g, [0.7, 0.6, 0.6], M.castIron, [vx - 0.3, 0.3, 0.7]);
  k.pipe(g, [[vx - 0.35, 1.4, -0.9], [vx - 0.3, 1.4, 0.4], [vx - 0.3, 0.6, 0.55]], 0.04, M.copper);
  k.pipe(g, [[vx - 0.35, 1.4, 2.3], [vx - 0.3, 1.4, 1.0], [vx - 0.3, 0.6, 0.85]], 0.04, M.copper);
  h.solid(vx - 0.3, 0.7, 0.35, 0.3);
  // A sack barrow by the door on the right.
  k.box(g, [0.5, 0.05, 0.7], M.darkSteel, [room.x1 - 0.8, 0.2, 6.6]);
  for (const dx of [-0.24, 0.24]) k.cyl(g, [0.16, 0.16, 0.05, 12], M.rubber, [room.x1 - 0.8 + dx, 0.16, 7.0], [0, 0, Math.PI / 2]);
  k.strut(g, [room.x1 - 0.8, 0.2, 6.3], [room.x1 - 0.8, 1.2, 6.15], 0.025, M.darkSteel, 5);
  h.solid(room.x1 - 0.8, 6.6, 0.3, 0.45);
  return finish(h, 3.5);
}

/**
 * 8 THE GREAT CISTERN, the lowest room: how much it could take. Four reserve vats of rising size along the left wall with a
 * level staff on each; a gauge board of their capacities behind the plate; in the right back corner the breach: masonry
 * fallen in from the wall in a spill of rubble, the wall wet and dark round it.
 */
function greatCistern(w) {
  const h = start(w, 'site-8', 'host-great-cistern');
  const { k, g, M, room } = h;
  // The vats, smallest nearest the back, each a size up.
  const sizes = [0.5, 0.65, 0.8, 0.95];
  let z = -1.4;
  for (let i = 0; i < 4; i++) {
    const r = sizes[i];
    z += r + (i ? sizes[i - 1] : 0) * 0 + 0.25;
    vat(h, room.x0 + r + 0.2, z, r, 1.0 + i * 0.3, 0.8 - i * 0.12);
    z += r;
  }
  // The gauge board behind the plate: four columns of marks, each column taller than the last.
  k.box(g, [3.6, 1.6, 0.05], M.board, [0, 2.0, room.z0 + 0.03]);
  for (let c = 0; c < 4; c++) for (let i = 0; i < 4 + c * 2; i++) k.box(g, [0.5, 0.03, 0.012], M.paint2, [-1.3 + c * 0.86, 1.3 + i * 0.12, room.z0 + 0.07], null, false);
  // The breach in the right back corner: blocks fallen from the wall, smaller rubble, a wet dark stain over them.
  const bx = room.x1 - 1.2, bz = room.z0 + 1.3;
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  for (let i = 0; i < 9; i++) {
    const sx = 0.4 + rnd() * 0.5, sy = 0.25 + rnd() * 0.3, sz = 0.3 + rnd() * 0.45;
    const blockM = k.slab(g, [sx, sy, sz], M.stone, [bx + (rnd() - 0.4) * 1.4, sy / 2 + (i > 5 ? 0.3 : 0), bz + (rnd() - 0.5) * 1.6], { tile: 1.2 });
    blockM.rotation.y = rnd() * 1.2;
  }
  h.solid(bx, bz, 1.0, 1.1);
  const wet = new THREE.Group();
  wet.userData.phys = 'decal';
  k.box(wet, [0.02, 2.6, 2.2], M.patinaDark, [room.x1 + 0.27, 1.6, bz], null, false);
  k.box(wet, [2.0, 2.6, 0.02], M.patinaDark, [bx, 1.6, room.z0 - 0.27], null, false);
  g.add(wet);
  // A pump on a skid by the door on the right, its hose to the breach's pool.
  const px = room.x1 - 1.0, pz = 7.6;
  k.box(g, [1.0, 0.12, 1.4], M.darkSteel, [px, 0.06, pz]);
  k.cyl(g, [0.3, 0.3, 0.7, 16], M.paintRed, [px, 0.5, pz - 0.2], [Math.PI / 2, 0, 0]);
  k.box(g, [0.5, 0.5, 0.5], M.castIron, [px, 0.37, pz + 0.4]);
  h.solid(px, pz, 0.55, 0.75);
  k.pipe(g, [[px, 0.15, pz - 0.75], [px, 0.08, bz + 1.4], [bx + 0.2, 0.08, bz + 1.0]], 0.07, M.rubber);
  return finish(h, 3.6);
}

export const HOST_BUILDERS = {
  'site-1': winchChamber,
  'site-2': tideTower,
  'site-3': twinCistern,
  'site-4': acidStore,
  'site-5': saltCistern,
  'site-6': dosingHall,
  'site-7': waterGate,
  'site-8': greatCistern
};
