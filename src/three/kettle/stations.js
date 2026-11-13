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

/* ------------------------------------------------------------------------ the hosts */

export function buildStores(w) { const h = start(w, 'site-2', 'stores'); return finish(h); }
export function buildScaleBay(w) { const h = start(w, 'site-3', 'scale-bay'); return finish(h); }
export function buildControlCabin(w) { const h = start(w, 'site-4', 'control-cabin'); return finish(h); }
export function buildSumpCellar(w) { const h = start(w, 'site-5', 'sump-cellar'); return finish(h); }
export function buildChargeBank(w) { const h = start(w, 'site-6', 'charge-bank'); return finish(h); }
export function buildPicklingBay(w) { const h = start(w, 'site-7', 'pickling-bay'); return finish(h); }
export function buildTappingPit(w) { const h = start(w, 'site-8', 'tapping-pit'); return finish(h); }
export function buildRefiningBay(w) { const h = start(w, 'site-9', 'refining-bay'); return finish(h); }

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
