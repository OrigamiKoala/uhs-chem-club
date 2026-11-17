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

/* ------------------------------------------------------------------------ the hosts */

const plain = (siteId, name) => (w) => finish(start(w, siteId, name));

export const HOST_BUILDERS = {
  'site-1': plain('site-1', 'host-sluice-chamber'),
  'site-2': plain('site-2', 'host-weigh-house'),
  'site-3': plain('site-3', 'host-gauge-chamber'),
  'site-4': plain('site-4', 'host-tally-room'),
  'site-5': plain('site-5', 'host-ledger-house'),
  'site-6': plain('site-6', 'host-pump-chamber'),
  'site-7': plain('site-7', 'host-settling-cistern'),
  'site-8': plain('site-8', 'host-plotting-room')
};
