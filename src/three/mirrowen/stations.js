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
   THE HOSTS
   ====================================================================== */

/** Placeholder host for the ground phase: the bench, a box behind it and a lamp over it. */
function placeholder(siteId) {
  return w => {
    const k = kitFor(w);
    const g = new THREE.Group();
    g.name = HOST_PLAN[siteId].structure;
    const bench = benchOf(w, siteId);
    g.add(bench.group);
    k.box(g, [5, 2, 0.8], w.M.darkSteel, [0, 1, -2.7], null, true);
    k.lamp(g, 0, 3.6, -0.3);
    return { group: g, bench, benchLocal: [0, 0, 0], colliders: [PLATE, { lx: 0, lz: -2.7, hw: 2.5, hd: 0.4 }], vents: [] };
  };
}

export const HOST_BUILDERS = Object.fromEntries(Object.keys(HOST_PLAN).map(id => [id, placeholder(id)]));
