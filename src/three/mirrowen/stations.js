/**
 * mirrowen/stations.js — The seven hosts: the rooms of the harbour a Learn bench is built into.
 *
 * Each builder returns the machinery AND its bench as ONE object in the host frame, so the overlap rule
 * (which exempts a body's own parts) lets the bench stand against the machine it belongs to, and the bay
 * contract (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the camera need
 * empty. The room itself (walls, roof, floor) is built by `terrain.js` from `harbour-plan.js`.
 *
 * THE HOST FRAME. Origin on the room's floor under the middle of the plate; +z toward the player and the
 * door, +x to the player's right. The world places the group at `site.pos`, turned by `siteFacing(site)`.
 * Every builder keeps to the bay by construction:
 *
 *   |x| < 2.7, z in [-1.95, 0.65]      nothing from the floor up to 2.4 m (plate, instrument, screens)
 *   |x| < 2.4, z in [0.65, 5.05]       nothing from 0.3 to 2.2 m (where the player and camera stand)
 *   |x| < 1.2, z in [0.65, 2.75]       nothing from 2.2 to 4.6 m (where a leaned-in camera hangs)
 *
 * so machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m behind it.
 * The back wall stands 3.6 m behind the plate (its face at -3.3), the side walls 7 m to each side (faces
 * at ±6.7). `verify:bench` measures the bay; `verify:mirrowen` measures that no host leaves its extent.
 *
 * ONLY LAMPS ARE LIT. A host's lamps are `lampMark`s the world pools into three lights. No sign stands.
 *
 * @returns {{ group, bench, benchLocal, colliders, vents? }}  `colliders` are host-local:
 *   `{ lx, lz, r }` discs and `{ lx, lz, hw, hd }` boxes. `vents` are host-local steam mouths.
 */

import * as THREE from 'three';
import { BENCH_BAY, buildBayBench, ctxMats } from '../bench-bay.js';
import { HOST_PLAN } from './host-plan.js';
import { crystalGeometry, rng } from './kit.js';

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
   SHARED PIECES FOR THE ROOMS
   ====================================================================== */

/** A pendant work lamp hung by a rod from the roof at `ceil` down to `y`. */
function pendant(k, M, g, x, y, z, ceil, opts = {}) {
  const rod = Math.max(0.2, ceil - (y + 0.22));
  k.cyl(g, [0.016, 0.016, rod, 6], M.darkSteel, [x, y + 0.22 + rod / 2, z]);
  k.cyl(g, [0.12, 0.26, 0.14, 12], M.darkSteel, [x, y + 0.2, z]);
  k.lamp(g, x, y, z, opts);
}

/** A hand wheel standing upright, its face toward +z. */
function uprightWheel(k, M, g, x, y, z, r = 0.22) {
  const m = new THREE.Mesh(k.own(new THREE.TorusGeometry(r, 0.022, 6, 18)), M.paintRed);
  m.position.set(x, y, z);
  g.add(m);
  k.strut(g, [x - r, y, z], [x + r, y, z], 0.014, M.paintRed, 5);
  k.strut(g, [x, y - r, z], [x, y + r, z], 0.014, M.paintRed, 5);
  k.cyl(g, [0.03, 0.03, 0.22, 8], M.brass, [x, y, z - 0.11], [Math.PI / 2, 0, 0]);
}

/** A flanged joint on a pipe running along `axis`. */
function flange(k, M, g, x, y, z, r, axis = 'y') {
  const rot = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : null;
  k.cyl(g, [r * 1.45, r * 1.45, 0.06, 14], M.darkSteel, [x, y, z], rot);
}

function start(w, siteId, name) {
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = name;
  const bench = benchOf(w, siteId);
  g.add(bench.group);
  return { k, M: w.M, g, bench, colliders: [PLATE], vents: [] };
}

const done = ({ g, bench, colliders, vents }) => ({ group: g, bench, benchLocal: [0, 0, 0], colliders, vents });

/* ======================================================================
   1. THE ICE-BREAKER'S DECKHOUSE (site-1, q1-states, Three States)
   The wheelhouse and chart room on the ice-breaker's deck. Behind the plate the window band looks north
   over the basin, the white canal and the frozen sea; the ship's own funnel steams aft. The steering
   stand and the engine telegraph to the left, the radar console and the chart table to the right.
   ====================================================================== */

function buildDeckhouse(w) {
  const h = start(w, 'site-1', 'deckhouse');
  const { k, M, g, colliders } = h;
  const TOP = 5.2;
  // The steering stand: a pedestal, the wheel facing the windows, the gyro repeater on a column beside it.
  k.cyl(g, [0.28, 0.36, 1.0, 14], M.darkSteel, [-4.5, 0.5, -2.1], null, true);
  k.box(g, [0.5, 0.36, 0.4], M.shipWhite, [-4.5, 1.15, -2.1]);
  {
    const wheel = new THREE.Mesh(k.own(new THREE.TorusGeometry(0.42, 0.035, 8, 24)), M.timberDark);
    wheel.position.set(-4.5, 1.35, -2.36);
    g.add(wheel);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      k.strut(g, [-4.5 - Math.cos(a) * 0.5, 1.35 - Math.sin(a) * 0.5, -2.36], [-4.5 + Math.cos(a) * 0.5, 1.35 + Math.sin(a) * 0.5, -2.36], 0.02, M.timberDark, 5);
    }
  }
  k.cyl(g, [0.08, 0.1, 1.15, 10], M.darkSteel, [-5.6, 0.575, -2.6]);
  k.cyl(g, [0.22, 0.22, 0.16, 18], M.brass, [-5.6, 1.25, -2.6]);
  // The engine telegraph: a pedestal and a round dial head with its handle.
  k.cyl(g, [0.12, 0.18, 1.0, 12], M.brass, [-3.4, 0.5, -2.65]);
  k.cyl(g, [0.3, 0.3, 0.16, 20], M.brass, [-3.4, 1.22, -2.65], [Math.PI / 2, 0, 0]);
  k.gauge(g, -3.4, 1.22, -2.55, 0.25, 0.6);
  k.strut(g, [-3.4, 1.22, -2.5], [-3.2, 1.5, -2.45], 0.02, M.brass, 5);
  // The radar console: a steel cabinet, its hood and its screen.
  k.box(g, [1.3, 1.1, 0.8], M.darkSteel, [4.6, 0.55, -2.6], null, true);
  k.box(g, [1.3, 0.5, 0.7], M.darkSteel, [4.6, 1.33, -2.65], [-0.35, 0, 0]);
  k.box(g, [0.6, 0.42, 0.04], M.glassDark, [4.6, 1.3, -2.28], [-0.35, 0, 0]);
  // The chart table along the right wall, its drawers, a chart weighted on it and the chart light over it.
  k.box(g, [1.0, 1.0, 2.8], M.timberDark, [5.95, 0.5, 0.4], null, true);
  for (let i = 0; i < 3; i++) k.box(g, [0.04, 0.22, 2.5], M.timber, [5.43, 0.25 + i * 0.27, 0.4]);
  k.box(g, [0.86, 0.006, 1.2], M.paint2, [5.95, 1.004, 0.2]);
  k.box(g, [0.06, 0.06, 0.4], M.brass, [5.8, 1.04, 0.6]);
  // Repeater dials hung from the deckhead over the plate's back, read through the window.
  k.box(g, [3.6, 0.5, 0.36], M.darkSteel, [0, 3.35, -2.95]);
  for (const x of [-1.2, 0, 1.2]) k.gauge(g, x, 3.35, -2.76, 0.18, x * 0.4);
  k.cyl(g, [0.03, 0.03, TOP - 3.6, 6], M.darkSteel, [-1.6, 3.6 + (TOP - 3.6) / 2, -2.95]);
  k.cyl(g, [0.03, 0.03, TOP - 3.6, 6], M.darkSteel, [1.6, 3.6 + (TOP - 3.6) / 2, -2.95]);
  // The radar mast on the roof and its turning scanner.
  const roof = TOP + 0.45;
  k.cyl(g, [0.12, 0.16, 2.4, 10], M.darkSteel, [0, roof + 1.2, -1.6]);
  k.box(g, [0.5, 0.1, 0.5], M.darkSteel, [0, roof + 2.45, -1.6]);
  const scanner = new THREE.Group();
  scanner.position.set(0, roof + 2.55, -1.6);
  k.box(scanner, [2.6, 0.16, 0.22], M.shipWhite, [0, 0.2, 0]);
  k.cyl(scanner, [0.12, 0.12, 0.2, 10], M.darkSteel, [0, 0.05, 0]);
  scanner.userData.mover = { kind: 'yaw', rate: 1.1 };
  scanner.userData.noMerge = true;
  g.add(scanner);
  // Lamps: one over the plate, one over the chart table.
  pendant(k, M, g, 0, 3.75, -0.3, TOP, { intensity: 8, distance: 13 });
  pendant(k, M, g, 4.8, 3.95, 0.8, TOP, { intensity: 6, distance: 10 });
  colliders.push(
    { lx: -4.5, lz: -2.2, r: 0.55 }, { lx: -5.6, lz: -2.6, r: 0.3 }, { lx: -3.4, lz: -2.65, r: 0.35 },
    { lx: 4.6, lz: -2.6, hw: 0.7, hd: 0.45 }, { lx: 5.95, lz: 0.4, hw: 0.55, hd: 1.45 }
  );
  return done(h);
}

/* ======================================================================
   2. THE TANKER'S PUMP ROOM (site-2, q2-grip, The Grip Between)
   Down the companionway, between the cargo tanks: three cargo pumps behind the plate with their suction
   lines from the floor and their discharge lines up the bulkhead, the steam stripping pump to the left,
   the valve manifold to the right. Every liquid the ship carries passes through this room.
   ====================================================================== */

function buildPumpRoom(w) {
  const h = start(w, 'site-2', 'pump-room');
  const { k, M, g, colliders } = h;
  const TOP = 5.2;
  const paints = [M.tankGreen, M.paintRed, M.tankWhite];
  [-2.0, 0, 2.0].forEach((x, i) => {
    // A vertical cargo pump: bedplate, volute, the shaft up through the deck to its drive.
    k.box(g, [1.0, 0.16, 0.9], M.darkSteel, [x, 0.08, -2.75]);
    k.cyl(g, [0.42, 0.46, 0.7, 18], paints[i], [x, 0.51, -2.75], null, true);
    k.cyl(g, [0.2, 0.26, 0.6, 14], M.darkSteel, [x, 1.16, -2.75]);
    k.cyl(g, [0.07, 0.07, TOP - 1.46, 8], M.steel, [x, 1.46 + (TOP - 1.46) / 2, -2.75]);
    k.cyl(g, [0.18, 0.18, 0.3, 12], M.darkSteel, [x, 2.6, -2.75]);
    // Discharge up the bulkhead, suction down into the floor.
    k.pipe(g, [[x + 0.42, 0.55, -2.75], [x + 0.62, 0.55, -2.75], [x + 0.62, 0.55, -3.05], [x + 0.62, TOP, -3.05]], 0.13, M.steel);
    flange(k, M, g, x + 0.62, 1.4, -3.05, 0.13);
    flange(k, M, g, x + 0.62, 3.6, -3.05, 0.13);
    k.pipe(g, [[x - 0.42, 0.45, -2.75], [x - 0.62, 0.45, -2.75], [x - 0.62, 0.02, -2.75]], 0.15, paints[i]);
    k.gauge(g, x, 1.85, -2.38, 0.14, -0.3 + i * 0.4);
  });
  // A header across the top of the bulkhead gathering the discharges.
  k.pipe(g, [[-1.6, 4.4, -3.05], [2.8, 4.4, -3.05]], 0.18, M.steel);
  // The steam stripping pump: twin cylinders on a frame, its steam and exhaust lines.
  k.box(g, [1.6, 0.3, 1.1], M.darkSteel, [-4.9, 0.15, -1.3], null, true);
  for (const z of [-1.6, -1.0]) k.cyl(g, [0.26, 0.26, 1.3, 14], M.steel, [-4.9, 0.95, z], null, true);
  k.box(g, [0.9, 0.16, 1.0], M.darkSteel, [-4.9, 1.68, -1.3]);
  k.strut(g, [-4.9, 1.76, -1.3], [-4.9, 2.6, -1.3], 0.05, M.brass);
  k.pipe(g, [[-4.9, 2.6, -1.3], [-6.2, 2.6, -1.3], [-6.2, TOP, -1.3]], 0.08, M.insul);
  k.gauge(g, -4.4, 1.3, -0.72, 0.13, 0.4);
  // The valve manifold on the right: a header along the wall, a valve and a wheel on every branch.
  k.pipe(g, [[5.6, 1.0, -2.9], [5.6, 1.0, 2.6]], 0.16, M.tankGreen);
  for (let z = -2.2; z <= 2.2; z += 1.1) {
    k.box(g, [0.32, 0.36, 0.32], M.darkSteel, [5.6, 1.0, z]);
    k.cyl(g, [0.03, 0.03, 0.6, 8], M.brass, [5.6, 1.45, z]);
    k.wheel(g, 5.6, 1.78, z, 0.16);
    k.pipe(g, [[5.6, 0.82, z], [5.6, 0.0, z]], 0.1, M.steel);
  }
  k.pipe(g, [[5.6, 1.0, -2.9], [6.25, 1.0, -2.9], [6.25, TOP, -2.9]], 0.16, M.tankGreen);
  // Lamps.
  pendant(k, M, g, 0, 3.75, -0.3, TOP, { intensity: 8, distance: 12 });
  pendant(k, M, g, -4.6, 3.95, 0.9, TOP, { intensity: 6, distance: 10 });
  pendant(k, M, g, 4.6, 3.95, 0.9, TOP, { intensity: 6, distance: 10 });
  colliders.push({ lx: 0, lz: -2.8, hw: 2.9, hd: 0.5 }, { lx: -4.9, lz: -1.3, hw: 0.85, hd: 0.6 }, { lx: 5.75, lz: -0.1, hw: 0.6, hd: 2.9 });
  return done(h);
}

/* ======================================================================
   3. THE DRY DOCK'S PUMP WELL (site-3, q3-boil, Liquids and Vapour)
   A concrete chamber under the pump house, its door on the dock floor. The two dock pumps stand to either
   side with their shafts going up to the motors overhead; between them the vacuum priming tank hangs over
   the plate's back, and the culvert valve's wheel stands on its pedestal over the sump.
   ====================================================================== */

function buildPumpWell(w) {
  const h = start(w, 'site-3', 'pump-well');
  const { k, M, g, colliders } = h;
  const TOP = 5.4;
  for (const s of [-1, 1]) {
    const x = s * 4.6;
    // A vertical dock pump: plinth, volute, the column up through the roof, the suction down into the sump.
    k.box(g, [1.6, 0.3, 1.6], M.concrete, [x, 0.15, -1.6]);
    k.cyl(g, [0.68, 0.72, 0.9, 20], M.tankGreen, [x, 0.75, -1.6], null, true);
    k.cyl(g, [0.34, 0.4, 0.5, 16], M.tankGreen, [x, 1.45, -1.6]);
    k.cyl(g, [0.22, 0.22, TOP - 1.7, 12], M.darkSteel, [x, 1.7 + (TOP - 1.7) / 2, -1.6]);
    for (const y of [2.4, 3.6, 4.8]) k.cyl(g, [0.3, 0.3, 0.08, 14], M.darkSteel, [x, y, -1.6]);
    k.pipe(g, [[x, 0.6, -2.3], [x, 0.6, -2.9], [x, 0.02, -2.9]], 0.3, M.tankGreen);
    flange(k, M, g, x, 0.6, -2.55, 0.3, 'z');
    // The discharge rising up the side wall to the culvert overhead.
    k.pipe(g, [[x + s * 0.7, 0.75, -1.6], [x + s * 1.5, 0.75, -1.6], [x + s * 1.5, TOP, -1.6]], 0.26, M.tankGreen);
    flange(k, M, g, x + s * 1.5, 2.2, -1.6, 0.26);
    k.gauge(g, x, 1.5, -0.88, 0.16, s * 0.3);
  }
  // The vacuum priming tank over the plate's back, its lines to both pumps and its gauge.
  k.cyl(g, [0.45, 0.45, 3.6, 20], M.steel, [0, 3.25, -2.7], [0, 0, Math.PI / 2], true);
  for (const x of [-1.8, 1.8]) k.cyl(g, [0.47, 0.47, 0.06, 20], M.darkSteel, [x, 3.25, -2.7], [0, 0, Math.PI / 2]);
  for (const x of [-1.2, 1.2]) k.box(g, [0.12, 0.6, 0.6], M.darkSteel, [x, 3.25, -3.05]);
  k.pipe(g, [[-1.8, 3.25, -2.7], [-4.6, 3.25, -2.7], [-4.6, 3.25, -1.85]], 0.06, M.copper);
  k.pipe(g, [[1.8, 3.25, -2.7], [4.6, 3.25, -2.7], [4.6, 3.25, -1.85]], 0.06, M.copper);
  k.gauge(g, 0, 3.25, -2.22, 0.2, -0.9);
  // The culvert valve: a pedestal over the sump, its wheel facing the plate's back, the sump grating at the wall.
  k.box(g, [0.5, 0.95, 0.4], M.darkSteel, [0, 0.475, -2.85], null, true);
  uprightWheel(k, M, g, 0, 1.15, -2.55, 0.3);
  k.box(g, [5.8, 0.03, 0.7], M.grating, [0, 0.015, -2.9]);
  // Lamps: one over the plate, one at each pump.
  pendant(k, M, g, 0, 3.75, -0.3, TOP, { intensity: 8, distance: 12 });
  pendant(k, M, g, -4.0, 4.0, 1.2, TOP, { intensity: 5, distance: 9 });
  pendant(k, M, g, 4.0, 4.0, 1.2, TOP, { intensity: 5, distance: 9 });
  colliders.push(
    { lx: -4.6, lz: -1.6, r: 0.95 }, { lx: 4.6, lz: -1.6, r: 0.95 },
    { lx: -6.1, lz: -1.6, r: 0.35 }, { lx: 6.1, lz: -1.6, r: 0.35 },
    { lx: 0, lz: -2.85, hw: 0.3, hd: 0.3 }
  );
  return done(h);
}

/* ======================================================================
   4. THE FREIGHTER'S HOLD (site-4, q4-solids, Kinds of Solid)
   Down the slope from the after deck into the hold of the ship the ice took. Behind the plate, crates of
   sheet glass; to the left, salt in sacks, wax in cakes and metal in ingots; to the right, the ice has
   pushed in through the split side plating in columns of crystal.
   ====================================================================== */

function buildHold(w) {
  const h = start(w, 'site-4', 'hold');
  const { k, M, g, colliders } = h;
  const TOP = 5.4;
  const r = rng(0x401d);
  // Dunnage on the tank top.
  for (let z = -3.0; z <= 2.8; z += 0.9) {
    k.box(g, [3.2, 0.08, 0.14], M.timber, [-4.9, 0.04, z]);
  }
  // Crates of sheet glass behind the plate, two high: slatted timber with the glass edge showing between slats.
  for (const [x, y] of [[-1.6, 0], [0, 0], [1.6, 0], [-0.8, 1.05], [0.8, 1.05]]) {
    k.box(g, [1.5, 1.0, 1.0], M.timber, [x, y + 0.5, -2.75], null, true);
    for (const yy of [0.25, 0.75]) k.box(g, [1.52, 0.08, 1.02], M.timberDark, [x, y + yy, -2.75]);
    k.box(g, [1.3, 0.8, 0.02], M.glass, [x, y + 0.5, -2.24]);
  }
  // Salt in sacks on a pallet (left, back), wax in cakes (left, middle), ingots in a stack (left, front).
  k.box(g, [1.6, 0.14, 1.4], M.timber, [-5.1, 0.15, -2.2]);
  for (let i = 0; i < 9; i++) {
    const sx = -5.6 + (i % 3) * 0.5, sy = 0.36 + Math.floor(i / 3) * 0.32, sz = -2.2 + ((i % 2) - 0.5) * 0.4;
    k.box(g, [0.48, 0.3, 0.9], M.sack, [sx, sy, sz], [0, (r() - 0.5) * 0.2, 0]);
  }
  k.box(g, [1.6, 0.14, 1.4], M.timber, [-5.1, 0.15, -0.2]);
  for (let i = 0; i < 12; i++) {
    k.box(g, [0.5, 0.18, 0.36], M.insul, [-5.6 + (i % 3) * 0.5, 0.31 + Math.floor(i / 6) * 0.19, -0.6 + Math.floor((i % 6) / 3) * 0.6]);
  }
  for (let layer = 0; layer < 4; layer++) {
    for (let i = 0; i < 4 - (layer % 2); i++) {
      const along = layer % 2 === 0;
      k.box(g, along ? [0.9, 0.12, 0.22] : [0.22, 0.12, 0.9], M.steel, along ? [-5.1, 0.06 + layer * 0.12, 1.4 + i * 0.26] : [-5.5 + i * 0.26, 0.06 + layer * 0.12, 1.75]);
    }
  }
  // The ice, in through the split plating on the right: columns of crystal leaning in from the hull's side.
  const cols = [[5.9, -2.6, 0.55, 3.8], [6.1, -1.3, 0.7, 4.4], [5.6, -0.2, 0.45, 2.6], [6.2, 0.9, 0.6, 3.6], [5.7, 2.0, 0.4, 2.2], [5.2, -1.9, 0.38, 1.8], [6.3, 2.6, 0.5, 2.8]];
  cols.forEach(([x, z, cr, ch], i) => {
    const m = new THREE.Mesh(k.own(crystalGeometry(cr, ch, { seed: i + 3 })), i % 3 === 1 ? M.iceDeep : M.ice);
    m.position.set(x, 0.02, z);
    m.rotation.set((r() - 0.5) * 0.12, 0, 0.18 + r() * 0.12);
    m.castShadow = k.t4;
    g.add(m);
  });
  k.box(g, [1.6, 0.4, 6.0], M.iceDeep, [6.0, 0.2, -0.2]);
  // Lamps: a cargo cluster hung from the hatch, and one over the stows.
  pendant(k, M, g, 0, 3.8, -0.3, TOP, { intensity: 8, distance: 13 });
  pendant(k, M, g, -4.6, 4.0, 0.4, TOP, { intensity: 6, distance: 10 });
  colliders.push(
    { lx: 0, lz: -2.75, hw: 2.4, hd: 0.55 },
    { lx: -5.1, lz: 0.2, hw: 0.9, hd: 3.2 },
    { lx: 5.55, lz: -0.1, hw: 1.3, hd: 3.1 }
  );
  return done(h);
}

/* ======================================================================
   5. THE THAW SHED (site-5, q5-crossing, The Crossing)
   A boat shed on piles, its east end open over the slipway where a launch sits frozen on its cradle.
   The harbour thaws iced boats here with steam: the vertical boiler to the left, its steam header across
   the back wall with the hose reels under it, the lances racked by the slip.
   ====================================================================== */

function buildThawShed(w) {
  const h = start(w, 'site-5', 'thaw-shed');
  const { k, M, g, colliders, vents } = h;
  const TOP = 5.4;
  // The vertical boiler: a riveted shell on a firebox, its flue up through the roof, a coal bunker beside it.
  k.box(g, [2.1, 0.2, 2.1], M.brick, [-4.6, 0.1, -1.8]);
  k.cyl(g, [0.85, 0.95, 3.0, 22], M.darkSteel, [-4.6, 1.7, -1.8], null, true);
  for (const y of [0.7, 1.5, 2.3, 3.0]) k.cyl(g, [0.97, 0.97, 0.05, 22], M.rusted, [-4.6, y, -1.8]);
  k.box(g, [0.6, 0.5, 0.1], M.rusted, [-4.6, 0.65, -0.86]);
  k.cyl(g, [0.26, 0.26, TOP + 2.6, 12], M.darkSteel, [-4.6, 3.2 + (TOP + 2.6) / 2, -1.8]);
  k.gauge(g, -4.0, 2.6, -1.05, 0.15, 0.6);
  k.box(g, [1.4, 1.0, 0.9], M.timberDark, [-5.8, 0.5, -2.75], null, true);
  // The steam header across the back wall, a valve at each hose, the hose reels under it.
  k.pipe(g, [[-4.6, 3.2, -1.8], [-4.6, 3.2, -2.95], [5.0, 3.2, -2.95]], 0.1, M.insul);
  for (const x of [-1.8, 0, 1.8, 3.6]) {
    k.box(g, [0.18, 0.22, 0.18], M.brass, [x, 3.0, -2.95]);
    k.strut(g, [x, 2.9, -2.95], [x, 2.2, -2.95], 0.03, M.rubber, 6);
    const reel = new THREE.Mesh(k.own(new THREE.TorusGeometry(0.32, 0.07, 6, 16)), M.rubber);
    reel.position.set(x, 1.7, -3.0);
    g.add(reel);
    k.cyl(g, [0.05, 0.05, 0.3, 8], M.darkSteel, [x, 1.7, -3.1], [Math.PI / 2, 0, 0]);
  }
  // The lances racked by the open end: steel pipes leaning on a timber rail.
  k.box(g, [0.14, 1.4, 2.8], M.timberDark, [5.9, 0.7, 0.2]);
  for (let i = 0; i < 5; i++) k.strut(g, [5.4, 0.02, -0.9 + i * 0.55], [6.0, 2.2, -0.9 + i * 0.55], 0.03, M.steel, 6);
  // Ice melt and the gratings over the floor drain along the back.
  k.box(g, [8.0, 0.03, 0.5], M.grating, [0.6, 0.015, -3.0]);
  vents.push({ lx: -4.6, ly: TOP + 6.0, lz: -1.8, size: 0.6, rise: 6, life: 6, rate: 0.5, alpha: 0.24 });
  vents.push({ lx: 6.4, ly: 0.6, lz: 4.5, size: 0.7, rise: 3, life: 4, rate: 0.4, alpha: 0.2 });
  // Lamps.
  pendant(k, M, g, 0, 3.8, -0.3, TOP, { intensity: 8, distance: 12 });
  pendant(k, M, g, -3.9, 4.0, 1.4, TOP, { intensity: 5, distance: 9 });
  colliders.push(
    { lx: -4.6, lz: -1.8, r: 1.1 }, { lx: -5.8, lz: -2.75, hw: 0.75, hd: 0.5 },
    { lx: 5.8, lz: 0.2, hw: 0.45, hd: 1.5 }
  );
  return done(h);
}

/* ======================================================================
   6. THE SALT STORE (site-6, q6-solution, Taken Into Solution)
   A closed store on piles where the harbour dissolves salt to make brine for the quays. The hopper over the
   plate's back feeds the dissolving tank under it; the stirred mixing tank to the left, the graduated
   measuring tank to the right, sacks on pallets along both walls.
   ====================================================================== */

function buildSaltStore(w) {
  const h = start(w, 'site-6', 'salt-store');
  const { k, M, g, colliders } = h;
  const TOP = 5.2;
  // The hopper: a square funnel of plate on four legs, its chute down to the dissolving tank.
  {
    const geo = k.own(new THREE.CylinderGeometry(1.0, 0.18, 1.6, 4, 1));
    geo.rotateY(Math.PI / 4);
    const hop = new THREE.Mesh(geo, M.steel);
    hop.position.set(0, 3.8, -2.65);
    hop.scale.set(1.4, 1, 0.75);
    g.add(hop);
    for (const [x, z] of [[-1.25, -2.15], [1.25, -2.15], [-1.25, -3.15], [1.25, -3.15]]) k.box(g, [0.1, 4.5, 0.1], M.darkSteel, [x, 2.25, z]);
    k.cyl(g, [0.14, 0.14, 0.9, 10], M.steel, [0, 2.6, -2.65]);
  }
  // The dissolving tank under it, low behind the plate.
  k.cyl(g, [0.5, 0.5, 1.6, 20], M.tankWhite, [0, 0.8, -2.65], null, true);
  k.cyl(g, [0.52, 0.52, 0.06, 20], M.darkSteel, [0, 1.6, -2.65]);
  // The mixing tank to the left: its stirrer motor and shaft, an outlet to the measuring tank.
  k.cyl(g, [0.9, 0.9, 1.9, 22], M.tankGreen, [-4.4, 0.95, -1.6], null, true);
  k.box(g, [0.5, 0.4, 0.5], M.darkSteel, [-4.4, 2.1, -1.6]);
  k.cyl(g, [0.04, 0.04, 0.6, 8], M.steel, [-4.4, 2.4, -1.6]);
  k.box(g, [2.0, 0.12, 0.18], M.darkSteel, [-4.4, 1.94, -1.6]);
  k.pipe(g, [[-0.5, 0.4, -2.65], [-3.5, 0.4, -2.65], [-3.5, 0.4, -1.6]], 0.07, M.steel);
  // The measuring tank to the right: graduated, with its gauge glass and outlet valve.
  k.cyl(g, [0.75, 0.75, 2.1, 22], M.tankWhite, [4.4, 1.05, -1.6], null, true);
  k.cyl(g, [0.025, 0.025, 1.8, 8], M.glass, [4.4, 1.05, -0.8]);
  for (let y = 0.3; y < 2.0; y += 0.2) k.box(g, [0.12, 0.01, 0.01], M.darkSteel, [4.33, y, -0.8]);
  k.pipe(g, [[0.5, 0.4, -2.65], [3.6, 0.4, -2.65], [3.6, 0.4, -1.6]], 0.07, M.steel);
  k.wheel(g, 3.6, 0.75, -1.6, 0.12);
  // Sacks on pallets along both walls.
  for (const [x, z0] of [[-5.6, 0.4], [5.6, 0.6]]) {
    k.box(g, [1.2, 0.14, 2.4], M.timber, [x, 0.07, z0 + 1.0]);
    for (let i = 0; i < 8; i++) k.box(g, [0.46, 0.28, 0.9], M.sack, [x - 0.25 + (i % 2) * 0.5, 0.28 + Math.floor(i / 4) * 0.3, z0 + 0.5 + Math.floor((i % 4) / 2) * 1.0]);
  }
  // A spill of salt by the dissolving tank's foot.
  k.cyl(g, [0.01, 0.6, 0.18, 14], M.salt, [1.0, 0.09, -2.4]);
  // Lamps.
  pendant(k, M, g, 0, 3.75, -0.3, TOP, { intensity: 8, distance: 12 });
  pendant(k, M, g, 4.4, 3.95, 1.0, TOP, { intensity: 5, distance: 9 });
  colliders.push(
    { lx: 0, lz: -2.65, hw: 1.4, hd: 0.6 }, { lx: -4.4, lz: -1.6, r: 1.05 }, { lx: 4.4, lz: -1.6, r: 0.9 },
    { lx: -5.6, lz: 1.4, hw: 0.65, hd: 1.25 }, { lx: 5.6, lz: 1.6, hw: 0.65, hd: 1.25 }
  );
  return done(h);
}

/* ======================================================================
   7. THE ICE-BREAKER'S EVAPORATOR FLAT (site-7, q7-separate, Pulling Apart)
   Under the forecastle, at the foot of the companionway: where the ship makes its fresh water. Sea water
   boils in the evaporator shell to the left, its vapour crosses over the plate's back to the condenser on
   the right, the brine pump and the distilled-water tank with its gauge glass stand behind the plate.
   ====================================================================== */

function buildEvaporator(w) {
  const h = start(w, 'site-7', 'evaporator-flat');
  const { k, M, g, colliders } = h;
  const TOP = 5.2;
  // The evaporator: a lagged vertical shell on a stand, a sight glass, the sea-water feed in at its foot.
  k.box(g, [2.0, 0.3, 2.0], M.darkSteel, [-4.6, 0.15, -1.6]);
  k.cyl(g, [0.9, 0.9, 3.0, 24], M.insul, [-4.6, 1.8, -1.6], null, true);
  for (const y of [0.6, 1.8, 3.0]) k.cyl(g, [0.93, 0.93, 0.06, 24], M.darkSteel, [-4.6, y, -1.6]);
  const dome = new THREE.Mesh(k.own(new THREE.SphereGeometry(0.9, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2)), M.steel);
  dome.position.set(-4.6, 3.3, -1.6);
  dome.scale.y = 0.4;
  g.add(dome);
  k.cyl(g, [0.12, 0.12, 0.5, 10], M.glass, [-4.6, 1.4, -0.68], [Math.PI / 2, 0, 0]);
  k.gauge(g, -3.9, 2.4, -0.82, 0.15, 0.5);
  k.pipe(g, [[-4.6, 0.4, -0.72], [-4.6, 0.4, 0.4], [-4.6, 0.02, 0.4]], 0.08, M.paintRed);
  // The vapour line: up out of the dome, across over the plate's back, down to the condenser.
  k.pipe(g, [[-4.6, 3.6, -1.6], [-4.6, 3.9, -2.85], [4.6, 3.9, -2.85], [4.6, 2.3, -1.6]], 0.16, M.insul);
  // The condenser on the right: a shell-and-tube cylinder on saddles, its cooling water lines.
  for (const z of [-2.4, -0.4]) k.box(g, [0.9, 1.0, 0.3], M.darkSteel, [4.6, 0.5, z]);
  k.cyl(g, [0.55, 0.55, 2.8, 20], M.copper, [4.6, 1.55, -1.4], [Math.PI / 2, 0, 0], true);
  for (const z of [-2.8, 0.0]) k.cyl(g, [0.6, 0.6, 0.08, 20], M.darkSteel, [4.6, 1.55, z], [Math.PI / 2, 0, 0]);
  k.pipe(g, [[5.2, 1.3, -0.4], [6.2, 1.3, -0.4], [6.2, 0.02, -0.4]], 0.08, M.paintRed);
  k.pipe(g, [[5.2, 1.8, -2.4], [6.2, 1.8, -2.4], [6.2, TOP, -2.4]], 0.08, M.paintRed);
  // The brine pump and the distilled-water tank behind the plate, the gauge glass on the tank's face.
  k.box(g, [0.9, 0.2, 0.7], M.darkSteel, [-1.6, 0.1, -2.7]);
  k.cyl(g, [0.28, 0.3, 0.5, 14], M.paintRed, [-1.6, 0.45, -2.7], [0, 0, Math.PI / 2]);
  k.box(g, [0.36, 0.36, 0.36], M.darkSteel, [-1.05, 0.45, -2.7]);
  k.cyl(g, [0.5, 0.5, 1.9, 20], M.tankWhite, [1.6, 0.95, -2.75], null, true);
  k.cyl(g, [0.025, 0.025, 1.6, 8], M.glass, [1.6, 0.95, -2.2]);
  for (const y of [0.15, 1.75]) k.box(g, [0.08, 0.08, 0.1], M.brass, [1.6, y, -2.22]);
  k.pipe(g, [[4.6, 0.95, -2.6], [2.1, 0.95, -2.75]], 0.05, M.copper);
  // Lamps.
  pendant(k, M, g, 0, 3.75, -0.3, TOP, { intensity: 8, distance: 12 });
  pendant(k, M, g, -4.0, 4.0, 1.4, TOP, { intensity: 5, distance: 9 });
  colliders.push(
    { lx: -4.6, lz: -1.6, r: 1.1 }, { lx: 4.6, lz: -1.4, hw: 0.7, hd: 1.6 }, { lx: 5.8, lz: -1.3, hw: 0.6, hd: 1.4 },
    { lx: 0, lz: -2.75, hw: 2.3, hd: 0.5 }
  );
  return done(h);
}

export const HOST_BUILDERS = {
  'site-1': buildDeckhouse,
  'site-2': buildPumpRoom,
  'site-3': buildPumpWell,
  'site-4': buildHold,
  'site-5': buildThawShed,
  'site-6': buildSaltStore,
  'site-7': buildEvaporator
};
