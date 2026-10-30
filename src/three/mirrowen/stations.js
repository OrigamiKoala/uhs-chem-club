/**
 * mirrowen/stations.js — The seven hosts: the pieces of the harbour a Learn bench is built into.
 *
 * A bench on Mirrowen is not a bench under a shelter. It is a working point of the harbour: an
 * ice-breaker's chart house, a bay of the tank farm, the pumping station, the yard where canal ice is
 * cut, the boiler house, a dosing station and the distillery. Each builder returns the machine AND its
 * bench as ONE object, so the overlap rule (which exempts a body's own parts) lets the bench be bolted
 * to the thing it belongs to, and the bay contract (`bench-bay.js`) keeps the volume the plate, the
 * instrument, the screens and the camera need empty.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the front (toward the
 * ground the player walks in from), +x to the player's right. The world places the group at `site.pos`,
 * turned by `siteFacing(site)`. Every builder keeps to the bay by construction:
 *
 *   |x| < 2.7, z in [-1.95, 0.65]      nothing from the ground up to 2.4 m (plate, instrument, screens)
 *   |x| < 2.4, z in [0.65, 5.05]       nothing from 0.3 to 2.2 m (where the player and camera stand)
 *   |x| < 1.2, z in [0.65, 2.75]       nothing from 2.2 to 4.6 m (where a leaned-in camera hangs)
 *
 * so machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m behind
 * it. `verify:bench` measures all of it, and `verify:mirrowen` measures that no host stands outside
 * the extent `host-plan.js` declares for it.
 *
 * ONLY LAMPS ARE LIT. A host's work lamp is a `lampMark` the world pools and a fixture of the one
 * amber material; nothing here owns a PointLight. No sign stands in the harbour: the only lettering
 * is the plate number on the bench's apron.
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the bench's instrument,
 * cased up. Pressing [E] hides the case and opens the table on the same plate: one object, two states.
 * The case is the one clean, bright thing in a weathered harbour (`M.case`).
 *
 * @returns {{ group: THREE.Group, bench: object, benchLocal: number[], colliders: object[], fieldPoints?: object[], vents?: object[] }}
 *   `colliders` are host-local: `{ lx, lz, r }` discs and `{ lx, lz, hw, hd }` boxes (half sizes along the host's
 *   x and z). The world turns them to its own frame. `vents` are host-local steam mouths.
 */

import * as THREE from 'three';
import { BENCH_BAY, buildBayBench, ctxMats } from '../bench-bay.js';
import { HOST_PLAN } from './host-plan.js';

const LAMP = 0xd99423;
const Y = new THREE.Vector3(0, 1, 0);

/* ======================================================================
   THE BENCH — the shared bay bench, its cased instrument dressed for the kind
   ====================================================================== */

/** The bench: the shared bay bench in the host's skin, its dormant slot dressed for `kind`. */
export function buildMwBench(ctx, { kind = 'window', plate = 'MW-01', skin = 'desk' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x = 0, y = 0, z = 0, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    return m;
  };
  return buildBayBench(ctx, {
    skin,
    plate,
    mats: ctxMats(ctx),
    tagStyle: { fg: '#1b2124', bg: '#c9d2d4' },
    dormant(dormant, { height }) {
      // THE ONE CLEAN THING. The harbour is weathered; the cased instrument is the thing somebody uses, so it
      // keeps its own bright paint.
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      dormant.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]));
      dormant.add(mesh(new THREE.CircleGeometry(0.13, 22), M.glassDark, -0.62, height + 0.42, 0.072));
      const y0 = height + 0.045;
      const add = (geo, mat, x, y, z, rot) => dormant.add(mesh(geo, mat, x, y0 + y, z, rot));
      if (kind === 'window') {
        // A window onto a sealed jar: a steel frame round a pane, three jars standing beside it.
        add(new THREE.BoxGeometry(0.5, 0.4, 0.05), M.caseDark, 0.5, 0.2, 0.0);
        add(new THREE.BoxGeometry(0.38, 0.28, 0.06), M.glassDark, 0.5, 0.2, 0.01);
        for (const x of [0.86, 1.0, 1.14]) add(new THREE.CylinderGeometry(0.05, 0.05, 0.17, 14), M.glass, x, 0.085, 0.12);
      } else if (kind === 'probe') {
        // A pull-apart probe: a post with a head, a slot for a sample card, a key.
        add(new THREE.CylinderGeometry(0.03, 0.03, 0.52, 10), M.caseDark, 0.55, 0.26, 0.1);
        add(new THREE.BoxGeometry(0.34, 0.16, 0.2), M.caseDark, 0.55, 0.54, 0.1);
        add(new THREE.BoxGeometry(0.2, 0.012, 0.14), M.paint2, 0.55, 0.01, 0.2);
        add(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), M.brass, 0.82, 0.015, 0.2);
      } else if (kind === 'flask') {
        // A sealed flask with its gauge: a round glass body on a heater, a dial on a stand beside it.
        add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.caseDark, 0.5, 0.02, 0.12);
        add(new THREE.SphereGeometry(0.15, 20, 14), M.glass, 0.5, 0.22, 0.12);
        add(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 10), M.glass, 0.5, 0.42, 0.12);
        add(new THREE.CylinderGeometry(0.014, 0.014, 0.4, 8), M.darkSteel, 0.86, 0.2, 0.1);
        add(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 20), M.brass, 0.86, 0.42, 0.1, [Math.PI / 2, 0, 0]);
      } else if (kind === 'tester') {
        // A bench tester: an anvil block with a striker hung over it and a heating lamp.
        add(new THREE.BoxGeometry(0.4, 0.14, 0.3), M.caseDark, 0.55, 0.07, 0.1);
        add(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), M.darkSteel, 0.7, 0.39, 0.1);
        add(new THREE.BoxGeometry(0.14, 0.1, 0.1), M.steel, 0.7, 0.66, 0.1);
        add(new THREE.BoxGeometry(0.22, 0.04, 0.12), M.paint2, 0.5, 0.16, 0.1);
      } else if (kind === 'curve') {
        // A heater and a lagged cup with its thermometer, and a recorder with a roll of paper.
        add(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 22), M.caseDark, 0.5, 0.025, 0.12);
        add(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 22), M.insul, 0.5, 0.2, 0.12);
        add(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), M.glass, 0.46, 0.52, 0.1);
        add(new THREE.BoxGeometry(0.34, 0.16, 0.22), M.caseDark, 0.92, 0.08, 0.1);
        add(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12), M.paint2, 0.92, 0.24, 0.1, [0, 0, Math.PI / 2]);
      } else if (kind === 'volumetric') {
        // A volumetric flask: a round body and a long neck with its ring, a balance pan beside it.
        add(new THREE.SphereGeometry(0.13, 18, 12), M.glass, 0.5, 0.15, 0.12);
        add(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 10), M.glass, 0.5, 0.42, 0.12);
        add(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 10), M.paintRed, 0.5, 0.5, 0.12);
        add(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 22), M.brass, 0.92, 0.07, 0.12);
        add(new THREE.BoxGeometry(0.32, 0.06, 0.26), M.caseDark, 0.92, 0.03, 0.12);
      } else {
        // A paper strip: a tall jar with a strip hung from a bar across its mouth, a flask beside it.
        add(new THREE.CylinderGeometry(0.1, 0.1, 0.42, 20), M.glass, 0.5, 0.21, 0.12);
        add(new THREE.BoxGeometry(0.2, 0.012, 0.014), M.darkSteel, 0.5, 0.43, 0.12);
        add(new THREE.BoxGeometry(0.05, 0.34, 0.004), M.paint2, 0.5, 0.25, 0.12);
        add(new THREE.SphereGeometry(0.1, 16, 12), M.glass, 0.86, 0.1, 0.12);
      }
    }
  });
}

/* ======================================================================
   THE PARTS KIT
   Small, local, and the same few verbs everywhere: a box, a cylinder, a round
   bar between two points, a pipe, a footed post, a gauge, a work lamp.
   ====================================================================== */

function kitFor(w) {
  const own = (...o) => w.own(...o);
  const t4 = w.t4;
  const M = w.M;
  const shade = m => { m.castShadow = m.receiveShadow = t4; return m; };

  const box = (g, [sx, sy, sz], mat, [x, y, z], rot = null, shadow = false) => {
    const m = new THREE.Mesh(own(new THREE.BoxGeometry(sx, sy, sz)), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (shadow) shade(m);
    g.add(m);
    return m;
  };

  const cyl = (g, [rt, rb, h, seg = 14], mat, [x, y, z], rot = null, shadow = false) => {
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(rt, rb, h, seg)), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (shadow) shade(m);
    g.add(m);
    return m;
  };

  const ball = (g, r, mat, [x, y, z], scale = null) => {
    const m = new THREE.Mesh(own(new THREE.SphereGeometry(r, 14, 10)), mat);
    m.position.set(x, y, z);
    if (scale) m.scale.set(...scale);
    g.add(m);
    return m;
  };

  /** A round bar between two points. */
  const strut = (g, a, b, r, mat, seg = 8) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, len, seg)), mat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(Y, vb.clone().sub(va).normalize());
    g.add(m);
    return m;
  };

  /** A pipe run through a list of points: a bar between each pair, a ball at each corner. */
  const pipe = (g, pts, r, mat) => {
    for (let i = 0; i < pts.length - 1; i++) strut(g, pts[i], pts[i + 1], r, mat, 10);
    for (let i = 1; i < pts.length - 1; i++) ball(g, r * 1.02, mat, pts[i]);
  };

  /** A bolted base plate, flush on the ground. */
  const footing = (g, x, z, size = 0.34) => {
    box(g, [size + 0.16, 0.05, size + 0.16], M.darkSteel, [x, 0.025, z]);
  };

  /** A square post stood on a footing: from the ground to `top`. */
  const post = (g, x, z, top, s = 0.14, mat = M.darkSteel) => {
    footing(g, x, z, Math.max(0.28, s + 0.14));
    box(g, [s, top - 0.05, s], mat, [x, 0.05 + (top - 0.05) / 2, z], null, true);
  };

  /** A dial gauge facing +z: a brass bezel, a dark face, ticks round it and a needle. */
  const gauge = (g, x, y, z, r = 0.2, needle = -0.5) => {
    cyl(g, [r, r, 0.07, 24], M.brass, [x, y, z], [Math.PI / 2, 0, 0]);
    const face = new THREE.Mesh(own(new THREE.CircleGeometry(r * 0.86, 24)), M.glassDark);
    face.position.set(x, y, z + 0.037);
    g.add(face);
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 0.8 + (i / 10) * Math.PI * 1.4;
      const tk = new THREE.Mesh(own(new THREE.BoxGeometry(0.012, i % 5 === 0 ? r * 0.22 : r * 0.12, 0.006)), M.paint2);
      tk.position.set(x + Math.cos(a) * r * 0.7, y - Math.sin(a) * r * 0.7, z + 0.042);
      tk.rotation.z = a + Math.PI / 2;
      g.add(tk);
    }
    const nd = new THREE.Mesh(own(new THREE.BoxGeometry(0.014, r * 0.75, 0.006)), M.paint2);
    nd.position.set(x + Math.sin(-needle) * r * 0.2, y + Math.cos(needle) * r * 0.2, z + 0.046);
    nd.rotation.z = needle;
    g.add(nd);
  };

  /** A hand wheel on a stem (axis y). */
  const wheel = (g, x, y, z, r = 0.1) => {
    cyl(g, [0.02, 0.02, 0.3, 8], M.brass, [x, y - 0.12, z]);
    const m = new THREE.Mesh(own(new THREE.TorusGeometry(r, 0.016, 6, 16)), M.darkSteel);
    m.position.set(x, y + 0.04, z);
    m.rotation.x = Math.PI / 2;
    g.add(m);
  };

  /** A ring of the tank's bands, a ladder up its side, a dome on its head: a vertical storage tank on y = 0. */
  const tank = (g, x, z, r, h, mat) => {
    cyl(g, [r, r, h, 28], mat, [x, h / 2 + 0.12, z], null, true);
    cyl(g, [r + 0.1, r + 0.1, 0.12, 28], M.concrete, [x, 0.06, z]);
    const dome = new THREE.Mesh(own(new THREE.SphereGeometry(r * 0.98, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.2)), mat);
    dome.position.set(x, h + 0.12, z);
    dome.scale.y = 0.5;
    g.add(dome);
    for (const y of [h * 0.25, h * 0.55, h * 0.85]) cyl(g, [r + 0.03, r + 0.03, 0.06, 28], M.darkSteel, [x, y + 0.12, z]);
    // A ladder up the side that faces the player's right, with its cage.
    const lx = x + r * 0.72, lz = z + r * 0.72;
    for (const d of [-0.2, 0.2]) strut(g, [lx + d * 0.7, 0.12, lz - d * 0.7], [lx + d * 0.7, h + 0.4, lz - d * 0.7], 0.022, M.darkSteel, 6);
    for (let y = 0.5; y < h; y += 0.4) strut(g, [lx - 0.14, y, lz + 0.14], [lx + 0.14, y, lz - 0.14], 0.014, M.darkSteel, 5);
  };

  /** The work lamp over a bench: a pooled lamp mark and its amber fixture. */
  const lamp = (g, x, y, z, { intensity = 8, distance = 12 } = {}) => {
    const mark = new THREE.Object3D();
    mark.position.set(x, y, z);
    mark.userData.lamp = { color: LAMP, intensity, distance, decay: 1.7 };
    g.add(mark);
    w.lamps.push(mark);
    box(g, [0.4, 0.1, 0.2], M.lantern, [x, y + 0.12, z]);
  };

  /** A lamp on a mast with an arm that reaches out to hold it over the bench. */
  const lampMast = (g, x, z, { h = 3.7, arm = [0, 0], at = null } = {}) => {
    footing(g, x, z, 0.3);
    cyl(g, [0.045, 0.06, h, 10], M.darkSteel, [x, h / 2, z], null, true);
    if (arm[0] || arm[1]) strut(g, [x, h - 0.05, z], [x + arm[0], h - 0.05, z + arm[1]], 0.035, M.darkSteel);
    lamp(g, x + arm[0], h - 0.12 - 0.12, z + arm[1], at || {});
  };

  /** A railing round a rectangle at height y0, open on the sides listed in `gaps` (n, e, s, w). */
  const railing = (g, x0, x1, z0, z1, y0, { gaps = [], mat = M.paintYellow } = {}) => {
    const H = 1.05;
    const sides = [['n', [x0, z0], [x1, z0]], ['e', [x1, z0], [x1, z1]], ['s', [x1, z1], [x0, z1]], ['w', [x0, z1], [x0, z0]]];
    for (const [id, a, b] of sides) {
      if (gaps.includes(id)) continue;
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.round(L / 1.4));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        box(g, [0.05, H, 0.05], M.darkSteel, [a[0] + (b[0] - a[0]) * t, y0 + H / 2, a[1] + (b[1] - a[1]) * t]);
      }
      for (const y of [y0 + H, y0 + H * 0.5]) strut(g, [a[0], y, a[1]], [b[0], y, b[1]], 0.022, mat, 6);
    }
  };

  return { box, cyl, ball, strut, pipe, footing, post, gauge, wheel, tank, lamp, lampMast, railing, shade, own, t4 };
}

/** The bench every host builds first: the plate at the origin, in the host's skin. */
function benchOf(w, siteId) {
  const plan = HOST_PLAN[siteId];
  return buildMwBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
}

/** The colliders a bench itself always carries (the plate, host frame). */
const PLATE = { lx: 0, lz: 0, hw: 2.4, hd: 0.65 };

/* ======================================================================
   1. THE CHART HOUSE — an ice-breaker's chart house, brought ashore (desk)
   A steel wheelhouse with a band of windows stands open to the front; its radar scanner turns
   on a mast over the roof. An anchor stands at the right and a heap of survey buoys lies at the left.
   ====================================================================== */

export function buildChartHouse(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'chart-house';
  const bench = benchOf(w, 'site-1');
  g.add(bench.group);
  const colliders = [PLATE];
  const BZ = -5.6;

  // THE HOUSE: a back wall with a band of windows, two side walls and a roof over the back half.
  k.box(g, [8.8, 3.0, 0.22], M.hallWall, [0, 1.5, BZ], null, true);
  k.box(g, [7.0, 1.0, 0.05], M.glassDark, [0, 2.0, BZ + 0.14]);
  for (const x of [-3.0, -1.8, -0.6, 0.6, 1.8, 3.0]) k.box(g, [0.06, 1.0, 0.08], M.darkSteel, [x, 2.0, BZ + 0.15]);
  for (const x of [-4.4, 4.4]) k.box(g, [0.22, 3.0, 3.5], M.hallWall, [x, 1.5, BZ + 1.75], null, true);
  k.box(g, [9.4, 0.22, 4.1], M.hallRoof, [0, 3.11, BZ + 1.7], null, true);
  // A chart cabinet and a pedestal compass against the side walls.
  k.box(g, [1.6, 1.0, 0.8], M.darkSteel, [-3.4, 0.5, BZ + 0.7], null, true);
  k.box(g, [1.5, 0.04, 0.7], M.steel, [-3.4, 1.02, BZ + 0.7]);
  k.cyl(g, [0.14, 0.2, 1.1, 12], M.darkSteel, [3.5, 0.55, BZ + 0.9], null, true);
  k.ball(g, 0.2, M.brass, [3.5, 1.2, BZ + 0.9]);
  colliders.push({ lx: 0, lz: BZ, hw: 4.4, hd: 0.12 }, { lx: -4.4, lz: BZ + 1.75, hw: 0.12, hd: 1.8 }, { lx: 4.4, lz: BZ + 1.75, hw: 0.12, hd: 1.8 }, { lx: -3.4, lz: BZ + 0.7, hw: 0.8, hd: 0.4 }, { lx: 3.5, lz: BZ + 0.9, r: 0.3 });

  // THE RADAR over the roof: a mast, a yard and a scanner bar that turns.
  k.cyl(g, [0.07, 0.09, 3.0, 8], M.darkSteel, [2.6, 4.7, BZ + 1.2], null, true);
  k.box(g, [1.3, 0.05, 0.05], M.darkSteel, [2.6, 5.3, BZ + 1.2]);
  const scanner = new THREE.Group();
  scanner.position.set(2.6, 6.45, BZ + 1.2);
  scanner.userData.mover = { kind: 'yaw', rate: 1.3 };
  scanner.userData.noMerge = true;
  const bar = new THREE.Mesh(k.own(new THREE.BoxGeometry(1.8, 0.14, 0.2)), M.clad);
  scanner.add(bar);
  scanner.add(new THREE.Mesh(k.own(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 10)), M.darkSteel));
  g.add(scanner);

  // THE ANCHOR at the right: an admiralty anchor stood on its crown.
  {
    const X = 5.4, Z = -3.4;
    k.box(g, [1.0, 0.1, 0.8], M.concrete, [X, 0.05, Z]);
    k.cyl(g, [0.07, 0.09, 1.9, 10], M.rusted, [X, 1.0, Z], null, true);
    k.cyl(g, [0.05, 0.05, 1.1, 8], M.rusted, [X, 1.85, Z], [0, 0, Math.PI / 2]);
    k.strut(g, [X, 0.2, Z], [X - 0.75, 0.6, Z], 0.06, M.rusted);
    k.strut(g, [X, 0.2, Z], [X + 0.75, 0.6, Z], 0.06, M.rusted);
    k.box(g, [0.3, 0.14, 0.1], M.rusted, [X - 0.82, 0.68, Z], [0, 0, 0.5]);
    k.box(g, [0.3, 0.14, 0.1], M.rusted, [X + 0.82, 0.68, Z], [0, 0, -0.5]);
    k.ball(g, 0.1, M.rusted, [X, 0.15, Z]);
    colliders.push({ lx: X, lz: Z, r: 0.9 });
  }
  // A HEAP OF SURVEY BUOYS at the left: spheres on a pallet, a coil of line beside them.
  {
    const X = -5.3, Z = -3.2;
    k.box(g, [1.8, 0.12, 1.2], M.timber, [X, 0.06, Z]);
    k.ball(g, 0.38, M.paintRed, [X - 0.42, 0.5, Z - 0.2]);
    k.ball(g, 0.38, M.paint2, [X + 0.42, 0.5, Z - 0.2]);
    k.ball(g, 0.38, M.paintYellow, [X, 0.5, Z + 0.3]);
    k.ball(g, 0.34, M.paint2, [X, 1.1, Z - 0.05]);
    k.cyl(g, [0.04, 0.04, 0.5, 6], M.darkSteel, [X, 1.5, Z - 0.05]);
    colliders.push({ lx: X, lz: Z, r: 1.0 });
  }
  k.lampMast(g, 3.4, -2.3, { h: 3.7, arm: [-2.9, 2.3] });
  colliders.push({ lx: 3.4, lz: -2.3, r: 0.2 });
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints: [] };
}

/* ======================================================================
   2. THE TANK BAY — a bay of the tank farm (deck)
   Three storage tanks stand in a low bund; a manifold of valves runs across their feet and a pump
   skid stands at the right, outside the bund.
   ====================================================================== */

export function buildTankBay(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'tank-bay';
  const bench = benchOf(w, 'site-2');
  g.add(bench.group);
  const colliders = [PLATE];

  // THE BUND: a low wall round the tanks, so a spill stays in the bay.
  k.box(g, [16.4, 0.55, 0.3], M.concrete, [0, 0.275, -3.4], null, true);
  k.box(g, [16.4, 0.55, 0.3], M.concrete, [0, 0.275, -9.4], null, true);
  for (const x of [-8.1, 8.1]) k.box(g, [0.3, 0.55, 6.3], M.concrete, [x, 0.275, -6.4], null, true);
  k.box(g, [15.6, 0.04, 5.7], M.rusted, [0, 0.02, -6.4]);
  colliders.push({ lx: 0, lz: -3.4, hw: 8.2, hd: 0.15 }, { lx: 0, lz: -9.4, hw: 8.2, hd: 0.15 }, { lx: -8.1, lz: -6.4, hw: 0.15, hd: 3.15 }, { lx: 8.1, lz: -6.4, hw: 0.15, hd: 3.15 });

  // THE TANKS.
  const tanks = [[-5.2, M.tankWhite], [0, M.tankGreen], [5.2, M.tankWhite]];
  for (const [x, mat] of tanks) {
    k.tank(g, x, -6.5, 1.9, 5.2, mat);
    colliders.push({ lx: x, lz: -6.5, r: 2.05 });
  }
  // THE MANIFOLD across their feet: a header, a branch to each tank, a valve in each branch.
  k.pipe(g, [[-6.2, 0.9, -4.3], [6.2, 0.9, -4.3]], 0.14, M.clad);
  for (const [x] of tanks) {
    k.pipe(g, [[x, 0.9, -4.3], [x, 0.9, -4.75]], 0.1, M.clad);
    k.wheel(g, x, 1.35, -4.3, 0.12);
    k.box(g, [0.3, 0.3, 0.3], M.darkSteel, [x, 0.9, -4.3]);
  }
  // THE PUMP SKID at the right, outside the bund: a motor, a casing, a base frame, a pressure gauge on the discharge.
  {
    const X = 5.8, Z = -1.2;
    k.box(g, [1.9, 0.18, 1.1], M.darkSteel, [X, 0.09, Z], null, true);
    k.cyl(g, [0.3, 0.3, 0.9, 16], M.drum, [X - 0.45, 0.63, Z], [0, 0, Math.PI / 2], true);
    k.cyl(g, [0.34, 0.34, 0.5, 16], M.steel, [X + 0.5, 0.52, Z], [0, 0, Math.PI / 2], true);
    k.pipe(g, [[X + 0.8, 0.52, Z], [X + 1.3, 0.52, Z], [X + 1.3, 1.3, Z]], 0.07, M.clad);
    k.gauge(g, X + 1.3, 1.5, Z + 0.1, 0.14, 0.3);
    colliders.push({ lx: X + 0.2, lz: Z, hw: 1.2, hd: 0.6 });
  }
  k.lampMast(g, -3.6, -2.4, { h: 3.7, arm: [3.1, 2.3] });
  colliders.push({ lx: -3.6, lz: -2.4, r: 0.2 });
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints: [] };
}

/* ======================================================================
   3. THE PUMP HOUSE — the harbour pumping station (desk)
   A pump house open to the front, two pumps inside it with their header over them, a standpipe at
   the left and a metered line running out at the right.
   ====================================================================== */

export function buildPumpHouse(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'pump-house';
  const bench = benchOf(w, 'site-3');
  g.add(bench.group);
  const colliders = [PLATE];
  const BZ = -7.4;

  // THE HOUSE: a back wall with louvres, two side walls, a flat roof with an overhang.
  k.box(g, [8.4, 3.2, 0.25], M.hallWall, [0, 1.6, BZ], null, true);
  for (let i = 0; i < 5; i++) k.box(g, [1.6, 0.05, 0.12], M.darkSteel, [-2.0 + (i % 2) * 0.0, 1.8 + i * 0.22, BZ + 0.16]);
  for (const x of [-4.1, 4.1]) k.box(g, [0.25, 3.2, 3.6], M.hallWall, [x, 1.6, BZ + 1.8], null, true);
  k.box(g, [8.9, 0.25, 4.3], M.roofSheet, [0, 3.33, BZ + 1.8], null, true);
  colliders.push({ lx: 0, lz: BZ, hw: 4.2, hd: 0.13 }, { lx: -4.1, lz: BZ + 1.8, hw: 0.13, hd: 1.8 }, { lx: 4.1, lz: BZ + 1.8, hw: 0.13, hd: 1.8 });

  // THE PUMPS: two casings with their motors on a shared bed, a suction pipe down to the floor and a discharge up to the header.
  for (const x of [-1.7, 1.7]) {
    k.box(g, [2.6, 0.2, 1.1], M.darkSteel, [x, 0.1, BZ + 1.6], null, true);
    k.cyl(g, [0.5, 0.5, 1.5, 22], M.drum, [x - 0.75, 0.85, BZ + 1.6], [0, 0, Math.PI / 2], true);
    k.cyl(g, [0.6, 0.6, 0.8, 22], M.steel, [x + 0.8, 0.9, BZ + 1.6], [0, 0, Math.PI / 2], true);
    k.pipe(g, [[x + 0.8, 1.5, BZ + 1.6], [x + 0.8, 2.6, BZ + 1.6]], 0.14, M.clad);
    k.pipe(g, [[x + 1.2, 0.9, BZ + 1.6], [x + 1.6, 0.9, BZ + 1.6], [x + 1.6, 0.3, BZ + 1.2]], 0.12, M.rusted);
    colliders.push({ lx: x, lz: BZ + 1.6, hw: 1.3, hd: 0.55 });
  }
  // The header over them, to the right-hand wall.
  k.pipe(g, [[-0.9, 2.6, BZ + 1.6], [3.4, 2.6, BZ + 1.6]], 0.18, M.clad);
  k.wheel(g, 0.6, 3.0, BZ + 1.6, 0.14);
  k.gauge(g, -2.4, 2.4, BZ + 0.25, 0.2, 0.6);

  // THE STANDPIPE at the left: a tall column that rides the surge, and its gauge glass.
  k.cyl(g, [0.45, 0.45, 6.4, 20], M.clad, [-5.9, 3.2, -3.3], null, true);
  k.ball(g, 0.45, M.clad, [-5.9, 6.4, -3.3], [1, 0.6, 1]);
  for (const y of [1.2, 3.0, 4.8]) k.cyl(g, [0.5, 0.5, 0.06, 20], M.darkSteel, [-5.9, y, -3.3]);
  k.cyl(g, [0.05, 0.05, 1.8, 6], M.glass, [-5.5, 1.9, -3.3 + 0.35]);
  colliders.push({ lx: -5.9, lz: -3.3, r: 0.6 });
  // THE METERED LINE at the right: a pipe along the ground through a flow meter and a valve.
  {
    k.pipe(g, [[4.5, 0.7, BZ + 1.8], [4.5, 0.7, -3.2], [7.0, 0.7, -3.2]], 0.16, M.rusted);
    k.cyl(g, [0.3, 0.3, 0.7, 16], M.darkSteel, [5.5, 0.7, -3.2], [0, 0, Math.PI / 2], true);
    k.gauge(g, 5.5, 1.35, -3.1, 0.17, -0.1);
    k.wheel(g, 6.5, 1.3, -3.2, 0.14);
    colliders.push({ lx: 5.7, lz: -3.2, hw: 1.4, hd: 0.4 }, { lx: 4.5, lz: -5.5, hw: 0.2, hd: 2.4 });
  }
  k.lampMast(g, 3.5, -2.3, { h: 3.7, arm: [-3.0, 2.3] });
  colliders.push({ lx: 3.5, lz: -2.3, r: 0.2 });
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents: [{ lx: -5.9, lz: -3.3, ly: 6.9, size: 0.5, rate: 0.5, rise: 8, life: 9, alpha: 0.22 }], fieldPoints: [] };
}

/* ======================================================================
   4. THE CUTTING YARD — where canal ice is cut into blocks (deck)
   A portal crane straddles the yard with a block on its hook; a stack of cut blocks stands at the
   right, a saw table with its conveyor at the left, a pallet of sawn blocks behind.
   ====================================================================== */

export function buildCuttingYard(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'cutting-yard';
  const bench = benchOf(w, 'site-4');
  g.add(bench.group);
  const colliders = [PLATE];

  // THE PORTAL CRANE: four legs, a runway along each side and two bridge girders across, a trolley on the rear girder.
  const LX = 7.0, Z0 = -3.6, Z1 = -8.4, TOP = 6.0;
  for (const sx of [-1, 1]) for (const z of [Z0, Z1]) {
    k.footing(g, sx * LX, z, 0.5);
    k.box(g, [0.4, TOP, 0.4], M.paintYellow, [sx * LX, TOP / 2 + 0.05, z], null, true);
    colliders.push({ lx: sx * LX, lz: z, r: 0.42 });
  }
  for (const sx of [-1, 1]) k.box(g, [0.4, 0.5, Z0 - Z1 + 0.8], M.paintYellow, [sx * LX, TOP + 0.3, (Z0 + Z1) / 2], null, true);
  for (const z of [Z0, Z1]) k.box(g, [LX * 2 + 0.8, 0.55, 0.45], M.darkSteel, [0, TOP + 0.85, z], null, true);
  // The trolley, its hoist and the block on the hook.
  k.box(g, [1.0, 0.5, 1.2], M.darkSteel, [3.2, TOP + 1.3, (Z0 + Z1) / 2], null, true);
  k.cyl(g, [0.012, 0.012, 3.4, 5], M.darkSteel, [3.2, TOP - 0.5, (Z0 + Z1) / 2]);
  k.box(g, [0.3, 0.3, 0.3], M.paintRed, [3.2, TOP - 2.3, (Z0 + Z1) / 2]);
  k.box(g, [1.3, 0.8, 0.9], M.ice, [3.2, TOP - 2.9, (Z0 + Z1) / 2]);
  // THE STACK of cut blocks at the right, stood three high.
  for (let j = 0; j < 3; j++) for (const [x, z] of [[4.3, -4.7], [5.8, -4.7], [4.3, -6.3], [5.8, -6.3]]) {
    if (j === 2 && x > 5) continue;
    k.box(g, [1.3, 0.8, 1.4], j % 2 ? M.iceDeep : M.ice, [x, 0.4 + j * 0.8, z], null, true);
  }
  colliders.push({ lx: 5.05, lz: -5.5, hw: 1.4, hd: 1.5 });
  // THE SAW TABLE at the left: a low table, a vertical blade in a guard, its motor, and the conveyor away behind.
  {
    const X = -4.8, Z = -4.2;
    k.box(g, [2.6, 0.9, 1.3], M.darkSteel, [X, 0.45, Z], null, true);
    k.box(g, [2.7, 0.06, 1.4], M.steel, [X, 0.93, Z]);
    k.cyl(g, [0.55, 0.55, 0.05, 28], M.clad, [X, 1.45, Z], [0, 0, Math.PI / 2], true);
    k.box(g, [0.3, 0.9, 0.9], M.paintYellow, [X + 0.1, 1.5, Z]);
    k.box(g, [0.6, 0.6, 0.6], M.drum, [X + 1.0, 1.25, Z]);
    k.box(g, [1.2, 0.5, 6.0], M.rubber, [X, 0.5, Z - 4.3], null, true);
    for (const z of [-5.6, -8.0, -10.4]) k.box(g, [1.4, 0.5, 0.1], M.darkSteel, [X, 0.25, z]);
    colliders.push({ lx: X, lz: Z, hw: 1.4, hd: 0.7 }, { lx: X, lz: Z - 4.3, hw: 0.65, hd: 3.0 });
  }
  // A PALLET OF SAWN BLOCKS behind the plate.
  k.box(g, [2.2, 0.14, 1.4], M.timber, [0.2, 0.07, -8.2]);
  for (const x of [-0.5, 0.9]) k.box(g, [1.0, 0.7, 1.1], M.ice, [x, 0.49, -8.2], null, true);
  colliders.push({ lx: 0.2, lz: -8.2, hw: 1.1, hd: 0.7 });
  k.lampMast(g, -3.2, -2.3, { h: 3.7, arm: [2.8, 2.3] });
  colliders.push({ lx: -3.2, lz: -2.3, r: 0.2 });
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints: [] };
}

/* ======================================================================
   5. THE BOILER HOUSE — the harbour's boiler house (shelf)
   A brick-set boiler drum under a lean-to, its flue to a brick stack; a fuel day tank outside the
   right-hand wall and the steam header running out over it.
   ====================================================================== */

export function buildBoilerHouse(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'boiler-house';
  const bench = benchOf(w, 'site-5');
  g.add(bench.group);
  const colliders = [PLATE];
  const BZ = -9.4;

  // THE HOUSE: a brick back wall, two side walls, a lean-to roof sloping to the front.
  k.box(g, [9.6, 3.6, 0.35], M.brick, [0, 1.8, BZ], null, true);
  for (const x of [-4.8, 4.8]) k.box(g, [0.35, 3.6, 3.7], M.brick, [x, 1.8, BZ + 1.85], null, true);
  k.box(g, [10.4, 0.2, 4.6], M.roofSheet, [0, 3.7, BZ + 1.8], [0.1, 0, 0], true);
  colliders.push({ lx: 0, lz: BZ, hw: 4.8, hd: 0.18 }, { lx: -4.8, lz: BZ + 1.85, hw: 0.18, hd: 1.9 }, { lx: 4.8, lz: BZ + 1.85, hw: 0.18, hd: 1.9 });

  // THE BOILER: a horizontal drum on a brick setting, its firebox door and sight glass in the setting's face, a steam dome on top.
  k.box(g, [4.0, 1.1, 2.0], M.brick, [-0.3, 0.55, -7.2], null, true);
  k.box(g, [4.2, 0.08, 2.2], M.concrete, [-0.3, 0.04, -7.2]);
  k.cyl(g, [0.85, 0.85, 3.6, 28], M.clad, [-0.3, 1.95, -7.2], [0, 0, Math.PI / 2], true);
  for (const x of [-1.8, -0.7, 0.4, 1.2]) k.cyl(g, [0.86, 0.86, 0.05, 28], M.darkSteel, [x, 1.95, -7.2], [0, 0, Math.PI / 2]);
  k.cyl(g, [0.42, 0.42, 0.5, 18], M.clad, [0.6, 2.95, -7.2]);
  k.box(g, [0.9, 0.7, 0.06], M.darkSteel, [-0.3, 0.6, -6.17]);
  k.box(g, [0.5, 0.4, 0.04], M.glassDark, [-0.3, 0.6, -6.13]);
  k.cyl(g, [0.03, 0.03, 0.8, 6], M.glass, [1.2, 1.6, -6.3]);
  k.gauge(g, 1.6, 2.5, -6.34, 0.2, 0.2);
  colliders.push({ lx: -0.3, lz: -7.2, hw: 2.1, hd: 1.15 });
  // THE STACK: a tapered brick chimney off the back of the drum, banded, with a flue run to it.
  k.cyl(g, [0.45, 0.62, 11.0, 14], M.brick, [-3.6, 5.5, -8.2], null, true);
  for (const y of [3.0, 6.0, 9.0]) k.cyl(g, [0.5 - y * 0.007, 0.5 - y * 0.007, 0.08, 14], M.darkSteel, [-3.6, y, -8.2]);
  k.cyl(g, [0.55, 0.45, 0.25, 14], M.darkSteel, [-3.6, 11.1, -8.2]);
  k.pipe(g, [[-2.1, 1.95, -7.2], [-2.8, 1.95, -7.2], [-3.4, 1.4, -8.0]], 0.3, M.rusted);
  colliders.push({ lx: -3.6, lz: -8.2, r: 0.8 });
  // THE STEAM HEADER: a lagged line out of the dome, along the back, out through the right-hand wall.
  k.pipe(g, [[0.6, 3.2, -7.2], [0.6, 3.5, -8.0], [6.0, 3.5, -8.0]], 0.17, M.insul);
  k.wheel(g, 3.2, 3.9, -8.0, 0.13);
  // THE FUEL DAY TANK outside the right-hand wall: a horizontal cylinder on two saddles, a filler and a gauge.
  {
    const X = 6.2, Z = -4.4;
    k.cyl(g, [0.65, 0.65, 2.6, 22], M.rusted, [X, 1.0, Z], [Math.PI / 2, 0, 0], true);
    for (const dz of [-0.8, 0.8]) k.box(g, [1.0, 0.5, 0.2], M.concrete, [X, 0.25, Z + dz]);
    k.cyl(g, [0.12, 0.12, 0.25, 10], M.darkSteel, [X, 1.75, Z]);
    k.gauge(g, X - 0.3, 1.1, Z + 1.34, 0.14, 0.4);
    k.pipe(g, [[X, 0.35, Z - 1.3], [X - 1.3, 0.35, Z - 1.3], [X - 1.3, 0.35, -7.4]], 0.07, M.darkSteel);
    colliders.push({ lx: X, lz: Z, hw: 0.75, hd: 1.4 });
  }
  k.lampMast(g, -3.4, -2.3, { h: 3.7, arm: [3.0, 2.3] });
  colliders.push({ lx: -3.4, lz: -2.3, r: 0.2 });
  return {
    group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints: [],
    vents: [{ lx: -3.6, lz: -8.2, ly: 11.4, size: 1.1, rate: 1.1, rise: 26, life: 16, alpha: 0.3, lean: 1.2 }]
  };
}

/* ======================================================================
   6. THE DOSING STATION — a hopper over a mixing tank (shelf)
   A mixing tank with a railed platform and an agitator motor on its lid; a hopper on legs feeds it
   through a screw; a dosing pump and a cage of chemical totes stand at the right.
   ====================================================================== */

export function buildDosingStation(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'dosing-station';
  const bench = benchOf(w, 'site-6');
  g.add(bench.group);
  const colliders = [PLATE];

  // THE MIXING TANK: a squat round tank with a flat lid, a ladder, a platform round its top and an agitator motor on the lid.
  {
    const X = -3.9, Z = -6.4, R = 1.6, H = 3.2;
    k.cyl(g, [R, R, H, 28], M.tankGreen, [X, H / 2 + 0.1, Z], null, true);
    k.cyl(g, [R + 0.12, R + 0.12, 0.1, 28], M.concrete, [X, 0.05, Z]);
    for (const y of [0.9, 1.9, 2.8]) k.cyl(g, [R + 0.03, R + 0.03, 0.06, 28], M.darkSteel, [X, y + 0.1, Z]);
    k.cyl(g, [R + 0.05, R + 0.05, 0.1, 28], M.darkSteel, [X, H + 0.15, Z]);
    k.box(g, [0.5, 0.6, 0.5], M.drum, [X, H + 0.5, Z], null, true);
    k.cyl(g, [0.05, 0.05, 0.4, 8], M.steel, [X, H + 0.95, Z]);
    k.railing(g, X - 1.9, X + 1.9, Z - 1.9, Z + 1.9, H + 0.2, { gaps: ['s'] });
    for (const dx of [-0.3, 0.3]) k.strut(g, [X + 1.0 + dx * 0.5, 0.1, Z + 1.7], [X + 1.0 + dx * 0.5, H + 0.2, Z + 1.7], 0.025, M.darkSteel, 6);
    for (let y = 0.5; y < H; y += 0.4) k.strut(g, [X + 0.85, y, Z + 1.7], [X + 1.15, y, Z + 1.7], 0.014, M.darkSteel, 5);
    colliders.push({ lx: X, lz: Z, r: 2.0 });
    // A drain valve at the foot and a sample cock.
    k.pipe(g, [[X - 1.6, 0.5, Z + 0.4], [X - 2.3, 0.5, Z + 0.4]], 0.08, M.clad);
    k.wheel(g, X - 2.0, 0.85, Z + 0.4, 0.1);
  }
  // THE HOPPER on four legs, a screw feeder running from its throat to the tank's lid.
  {
    const X = 1.8, Z = -7.0;
    for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) k.box(g, [0.14, 2.6, 0.14], M.darkSteel, [X + dx, 1.3, Z + dz], null, true);
    for (const y of [0.9, 2.2]) {
      k.box(g, [1.8, 0.08, 0.08], M.darkSteel, [X, y, Z - 0.8]);
      k.box(g, [1.8, 0.08, 0.08], M.darkSteel, [X, y, Z + 0.8]);
    }
    const cone = k.cyl(g, [1.25, 0.28, 1.5, 4], M.perf, [X, 3.35, Z], [0, Math.PI / 4, 0], true);
    cone.material.side = THREE.DoubleSide;
    k.box(g, [2.0, 0.1, 2.0], M.hallRoof, [X, 4.15, Z]);
    k.strut(g, [X, 2.4, Z], [X - 4.6, 3.9, Z + 0.4], 0.17, M.clad, 12);
    k.box(g, [0.5, 0.45, 0.5], M.drum, [X - 0.2, 2.1, Z]);
    colliders.push({ lx: X, lz: Z, r: 1.4 });
  }
  // THE DOSING PUMP and its small day tank at the right, with the metered line to the tank.
  {
    const X = 5.2, Z = -3.4;
    k.box(g, [1.5, 0.16, 0.9], M.darkSteel, [X, 0.08, Z], null, true);
    k.box(g, [0.5, 0.5, 0.5], M.caseDark, [X - 0.4, 0.41, Z], null, true);
    k.cyl(g, [0.2, 0.2, 0.7, 14], M.steel, [X + 0.3, 0.51, Z], [0, 0, Math.PI / 2], true);
    k.cyl(g, [0.5, 0.5, 1.0, 20], M.paint2, [X + 0.1, 0.66, Z - 1.1], null, true);
    k.pipe(g, [[X + 0.1, 1.1, Z - 1.1], [X + 0.1, 1.4, Z - 1.1], [X + 0.3, 1.4, Z], [X + 0.3, 0.65, Z]], 0.05, M.clad);
    k.gauge(g, X - 0.4, 1.0, Z + 0.28, 0.12, 0.2);
    colliders.push({ lx: X, lz: Z - 0.5, hw: 0.85, hd: 1.0 });
  }
  // A CAGE OF CHEMICAL TOTES: two intermediate bulk containers in steel cages, and a rank of drums.
  for (const [x, z] of [[5.6, -6.2], [5.6, -7.6]]) {
    k.box(g, [1.2, 0.12, 1.2], M.timber, [x, 0.06, z]);
    k.box(g, [1.05, 0.95, 1.05], M.paint2, [x, 0.62, z], null, true);
    for (const dx of [-0.55, 0.55]) for (const dz of [-0.55, 0.55]) k.box(g, [0.04, 1.1, 0.04], M.darkSteel, [x + dx, 0.67, z + dz]);
    for (const y of [0.3, 0.7, 1.15]) k.box(g, [1.14, 0.03, 1.14], M.darkSteel, [x, y, z]);
    k.box(g, [0.2, 0.2, 0.2], M.darkSteel, [x, 0.3, z + 0.62]);
  }
  colliders.push({ lx: 5.6, lz: -6.9, hw: 0.7, hd: 1.45 });
  for (const [x, z, m] of [[-6.3, -2.9, M.drum], [-5.7, -2.9, M.drumB], [-6.0, -2.3, M.drum]]) {
    k.cyl(g, [0.29, 0.29, 0.88, 18], m, [x, 0.44, z], null, true);
    k.cyl(g, [0.3, 0.3, 0.04, 18], M.darkSteel, [x, 0.9, z]);
  }
  colliders.push({ lx: -6.0, lz: -2.7, r: 0.95 });
  k.lampMast(g, 3.4, -2.3, { h: 3.7, arm: [-3.0, 2.3] });
  colliders.push({ lx: 3.4, lz: -2.3, r: 0.2 });
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints: [] };
}

/* ======================================================================
   7. THE DISTILLERY — a pot still, a column and a condenser (desk)
   A copper pot still stands on its brick firebox with its swan neck carried over to a shell-and-tube
   condenser; a tall column stands behind them and two receivers stand at the right.
   ====================================================================== */

export function buildDistillery(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'distillery';
  const bench = benchOf(w, 'site-7');
  g.add(bench.group);
  const colliders = [PLATE];

  // THE POT STILL: a copper onion on a brick firebox, a manway on its shoulder, a swan neck over to the condenser.
  {
    const X = -3.8, Z = -6.0;
    k.box(g, [3.0, 1.0, 2.6], M.brick, [X, 0.5, Z], null, true);
    k.box(g, [0.7, 0.55, 0.06], M.darkSteel, [X, 0.5, Z + 1.33]);
    const prof = [[0.02, 0], [0.9, 0.12], [1.35, 0.6], [1.4, 1.0], [1.2, 1.5], [0.8, 1.9], [0.5, 2.2], [0.42, 2.4]];
    const onion = new THREE.Mesh(k.own(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28)), M.copper);
    onion.position.set(X, 1.0, Z);
    onion.castShadow = onion.receiveShadow = k.t4;
    g.add(onion);
    k.cyl(g, [0.4, 0.46, 0.5, 18], M.copper, [X, 3.65, Z]);
    k.cyl(g, [0.22, 0.22, 0.1, 14], M.brass, [X + 0.95, 2.2, Z + 0.55], [0, 0, 0.5]);
    k.pipe(g, [[X, 3.9, Z], [X, 4.7, Z], [X + 1.6, 5.2, Z], [X + 4.1, 4.4, Z], [X + 5.4, 3.2, Z]], 0.2, M.copper);
    k.gauge(g, X - 1.55, 2.1, Z + 0.7, 0.14, 0.1);
    colliders.push({ lx: X, lz: Z, hw: 1.55, hd: 1.35 });
  }
  // THE CONDENSER: a vertical shell-and-tube cooler with its water in at the foot and out at the head.
  {
    const X = 1.9, Z = -6.4;
    k.cyl(g, [0.6, 0.6, 3.6, 22], M.copper, [X, 2.2, Z], null, true);
    for (const y of [0.6, 1.6, 2.6, 3.6]) k.cyl(g, [0.64, 0.64, 0.07, 22], M.darkSteel, [X, y, Z]);
    k.cyl(g, [0.6, 0.35, 0.5, 22], M.copper, [X, 4.25, Z]);
    k.pipe(g, [[X + 0.6, 0.8, Z], [X + 1.1, 0.8, Z], [X + 1.1, 0.4, Z + 0.6]], 0.08, M.clad);
    k.pipe(g, [[X + 0.6, 3.4, Z], [X + 1.1, 3.4, Z], [X + 1.1, 3.4, Z - 1.0]], 0.08, M.clad);
    k.pipe(g, [[X, 0.4, Z], [X, 0.3, Z + 0.9], [X + 0.6, 0.3, Z + 1.0]], 0.07, M.copper);
    colliders.push({ lx: X, lz: Z, r: 0.85 });
  }
  // THE COLUMN behind them: a tall plated column with a ring of bubble-cap trays and a reflux line.
  {
    const X = -0.6, Z = -8.5;
    k.cyl(g, [0.5, 0.5, 6.6, 20], M.clad, [X, 3.4, Z], null, true);
    for (let y = 1.0; y < 6.0; y += 0.8) k.cyl(g, [0.56, 0.56, 0.06, 20], M.darkSteel, [X, y, Z]);
    k.ball(g, 0.5, M.clad, [X, 6.7, Z], [1, 0.55, 1]);
    k.pipe(g, [[X + 0.5, 6.0, Z], [X + 1.0, 6.0, Z], [X + 1.0, 4.9, Z + 0.6]], 0.08, M.clad);
    k.gauge(g, X, 2.0, Z + 0.55, 0.14, -0.2);
    colliders.push({ lx: X, lz: Z, r: 0.75 });
  }
  // TWO RECEIVERS at the right, each with a gauge glass and a draw-off valve.
  for (const [x, z, m] of [[5.4, -6.2, M.drum], [5.4, -4.1, M.drumB]]) {
    k.cyl(g, [0.6, 0.6, 1.5, 20], m, [x, 0.9, z], null, true);
    k.cyl(g, [0.64, 0.64, 0.06, 20], M.darkSteel, [x, 1.65, z]);
    for (const dx of [-0.4, 0.4]) k.box(g, [0.1, 0.3, 0.1], M.darkSteel, [x + dx, 0.15, z]);
    k.cyl(g, [0.03, 0.03, 1.0, 6], M.glass, [x - 0.65, 0.95, z]);
    k.wheel(g, x, 0.55, z + 0.62, 0.1);
  }
  colliders.push({ lx: 5.4, lz: -5.15, hw: 0.75, hd: 1.7 });
  k.lampMast(g, -3.3, -2.3, { h: 3.7, arm: [2.9, 2.3] });
  colliders.push({ lx: -3.3, lz: -2.3, r: 0.2 });
  return {
    group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints: [],
    vents: [{ lx: 1.9, lz: -6.4, ly: 4.7, size: 0.7, rate: 0.7, rise: 9, life: 10, alpha: 0.24 }]
  };
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildChartHouse,
  'site-2': buildTankBay,
  'site-3': buildPumpHouse,
  'site-4': buildCuttingYard,
  'site-5': buildBoilerHouse,
  'site-6': buildDosingStation,
  'site-7': buildDistillery
};
