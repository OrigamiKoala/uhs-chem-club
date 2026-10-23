/**
 * ember/stations.js — The seven hosts: the pieces of the geothermal field a Learn bench is built into.
 *
 * A bench on Ember Reach is not a bench under a heat-shield shelter. It is a working point of the field: the
 * heat-exchanger plates on a wellhead, a sampling shelf at the hot spring's edge, the habitat's boiler room, a
 * sampling coil over a fumarole, the separator and the two routes steam can take from it, the silencer pair where
 * steam expands, and the turbine hall's control room. Each builder returns the machine AND its bench as ONE object,
 * so the overlap rule (which exempts a body's own parts) lets the bench be bolted to the thing it belongs to, and the
 * bay contract (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the camera need empty.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the front (toward the ground the player
 * walks in from), +x to the player's right. The world places the group at `site.pos`, turned by `siteFacing(site)`.
 * Every builder keeps to the bay by construction:
 *
 *   |x| < 2.7, z in [-1.95, 0.65]      nothing from the ground up to 2.4 m (plate, instrument, screens)
 *   |x| < 2.4, z in [0.65, 5.05]       nothing from 0.3 to 2.2 m (where the player and camera stand)
 *   |x| < 1.2, z in [0.65, 2.75]       nothing from 2.2 to 4.6 m (where a leaned-in camera hangs)
 *
 * so machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m behind it (a pipe run,
 * a lamp boom). `verify:bench` measures all of it, and `verify:ember` measures that no host stands outside the extent
 * `host-plan.js` declares for it.
 *
 * ONLY LAMPS ARE LIT. A host's work lamp is a `lampMark` the world pools and a fixture of the one amber material;
 * nothing here owns a PointLight.
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the calorimeter bench, cased up.
 * Pressing [E] hides the case and opens the table on the same plate: one object, two states. The case is the one
 * clean, bright thing in a weathered field (`M.case`).
 *
 * @returns {{ group: THREE.Group, bench: object, benchLocal: number[], colliders: object[], fieldPoints?: object[], vents?: object[] }}
 *   `colliders` are host-local: `{ lx, lz, r }` discs and `{ lx, lz, hw, hd }` boxes (half sizes along the host's
 *   x and z). The world turns them to its own frame. `vents` are host-local steam mouths.
 */

import * as THREE from 'three';
import { BENCH_BAY, buildBayBench, ctxMats } from '../bench-bay.js';
import { placard } from '../materials/pbr-kit.js';
import { buildWellhead, buildSilencerPair } from './plant.js';
import { buildFumarole } from './field.js';
import { HOST_PLAN } from './host-plan.js';

/** Where the bench stands in an older, shelter-style site frame. Hosts stand it at their own origin. */
export const BENCH_Z = BENCH_BAY.benchZ;

const LAMP = 0xd99423;
const Y = new THREE.Vector3(0, 1, 0);

/* ======================================================================
   THE BENCH — the shared bay bench, its cased instrument dressed for the kind
   ====================================================================== */

/** The bench: the shared bay bench in the host's skin, its dormant slot dressed for `kind`. */
export function buildErBench(ctx, { kind = 'cup', plate = 'CAL-01', skin = 'shelf' } = {}) {
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
    tagStyle: { fg: '#1e1a14', bg: '#d8c9a2' },
    dormant(dormant, { height }) {
      // THE ONE CLEAN THING. The field is weathered; the cased instrument is the thing somebody uses, so it
      // keeps its own bright paint.
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      dormant.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]));
      dormant.add(mesh(new THREE.CircleGeometry(0.13, 22), M.glassDark, -0.62, height + 0.42, 0.072));
      const cupY = height + 0.045;
      if (kind === 'contact') {
        // Two small blocks side by side, a thermometer in each.
        for (const [x, mat] of [[0.38, M.rusted], [0.72, M.copper]]) {
          dormant.add(mesh(new THREE.BoxGeometry(0.3, 0.24, 0.3), mat, x, cupY + 0.12, 0.12));
          dormant.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 8), M.glass, x, cupY + 0.42, 0.12));
        }
      } else if (kind === 'bonds') {
        // A crank wheel on a stand and a short rod: the bond is pulled by hand.
        dormant.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 22), M.brass, 0.55, cupY + 0.3, 0.12, [Math.PI / 2, 0, 0]));
        dormant.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 8), M.caseDark, 0.55, cupY + 0.14, 0.12));
        dormant.add(mesh(new THREE.BoxGeometry(0.06, 0.24, 0.06), M.caseDark, 0.7, cupY + 0.3, 0.12));
      } else if (kind === 'hess') {
        // A deck of cards on a stand: three steps stacked.
        for (let k = 0; k < 3; k++) dormant.add(mesh(new THREE.BoxGeometry(0.46, 0.03, 0.3), k % 2 ? M.paint2 : M.paintYellow, 0.55, cupY + 0.03 + k * 0.045, 0.12));
      } else if (kind === 'cell') {
        // Two glass bulbs joined through a stopcock.
        for (const x of [0.38, 0.78]) dormant.add(mesh(new THREE.SphereGeometry(0.17, 18, 12), M.glass, x, cupY + 0.19, 0.12));
        dormant.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 10), M.glass, 0.58, cupY + 0.19, 0.12, [0, 0, Math.PI / 2]));
        dormant.add(mesh(new THREE.BoxGeometry(0.07, 0.09, 0.07), M.brass, 0.58, cupY + 0.19, 0.12));
      } else if (kind === 'plot') {
        // A plotter: a tilted dark screen on a case.
        dormant.add(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.05), M.caseDark, 0.55, cupY + 0.26, 0.04, [-0.4, 0, 0]));
        dormant.add(mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), M.caseDark, 0.55, cupY + 0.05, 0.14));
      } else {
        // The cup: lagged, banded, lidded, with the thermometer through the lid and the stirrer beside it.
        dormant.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.44, 22), M.insul, 0.55, cupY + 0.22, 0.12));
        for (const y of [0.08, 0.36]) dormant.add(mesh(new THREE.CylinderGeometry(0.208, 0.208, 0.035, 22), M.darkSteel, 0.55, cupY + y, 0.12));
        dormant.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 22), M.darkSteel, 0.55, cupY + 0.465, 0.12));
        dormant.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), M.glass, 0.5, cupY + 0.66, 0.08));
        dormant.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), M.brass, 0.5, cupY + 0.88, 0.08));
        dormant.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 6), M.darkSteel, 0.62, cupY + 0.62, 0.17));
        dormant.add(mesh(new THREE.TorusGeometry(0.04, 0.008, 5, 12).rotateX(Math.PI / 2), M.darkSteel, 0.62, cupY + 0.79, 0.17));
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

  const tube = (g, [r, h, seg = 18], mat, [x, y, z], rot = null) => {
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, h, seg, 1, true)), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    g.add(m);
    return m;
  };

  const ball = (g, r, mat, [x, y, z]) => {
    const m = new THREE.Mesh(own(new THREE.SphereGeometry(r, 14, 10)), mat);
    m.position.set(x, y, z);
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

  /** A stencilled tag set flat on a surface. */
  const tag = (g, text, size, p, ry = 0) => {
    const t = placard(text, { fg: '#1e1a14', bg: '#d8c9a2', ...size });
    t.position.set(...p);
    t.rotation.y = ry;
    g.add(t);
    own(t.geometry, t.material, t.material.map);
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

  /** A thermometer stem standing at (x, z) from y0. */
  const thermometer = (g, x, y0, z, h = 0.9) => {
    cyl(g, [0.022, 0.022, h, 8], M.glass, [x, y0 + h / 2, z]);
    cyl(g, [0.008, 0.008, h * 0.6, 6], M.paintRed, [x, y0 + h * 0.3, z]);
    cyl(g, [0.04, 0.04, 0.06, 10], M.brass, [x, y0 + h + 0.03, z]);
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

  return { box, cyl, tube, ball, strut, pipe, footing, post, tag, gauge, wheel, thermometer, lamp, lampMast, shade, own, t4 };
}

/** The bench every host builds first: the plate at the origin, in the host's skin. */
function benchOf(w, siteId) {
  const plan = HOST_PLAN[siteId];
  return buildErBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
}

/** The colliders a bench itself always carries (the plate, host frame). */
const PLATE = { lx: 0, lz: 0, hw: 2.4, hd: 0.65 };

/**
 * A plant prop built elsewhere, stood in a host at (x, z) turned `rotY`, with its own colliders and vents carried over (they
 * are circles in the prop's frame; a turned circle is still a circle).
 */
function adopt(g, node, x, z, rotY, out) {
  node.position.set(x, 0, z);
  node.rotation.y = rotY;
  g.add(node);
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const at = (px, pz) => [x + px * c + pz * s, z - px * s + pz * c];
  for (const col of node.userData.colliders || []) {
    if (col.r === undefined) continue;
    const [lx, lz] = at(col.x, col.z);
    out.colliders.push({ lx, lz, r: col.r });
  }
  for (const v of node.userData.vents || []) {
    const [lx, lz] = at(v.x, v.z);
    out.vents.push({ ...v, lx, lz });
  }
}

/* ======================================================================
   1. THE WELLHEAD EXCHANGER — heat-exchanger plates on a wellhead's flowline (shelf)
   A production wellhead stands at the left behind the plate with its flowline run
   across behind the bench to a plate heat exchanger on the right; a hot-water
   tank stands between. A thermowell tap on the exchanger's outlet is the field point.
   ====================================================================== */

export function buildWellheadExchanger(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'wellhead-exchanger';
  const bench = benchOf(w, 'site-1');
  g.add(bench.group);
  const out = { colliders: [PLATE], vents: [] };

  // THE WELLHEAD, on its cellar slab, its flowline running out along +x.
  adopt(g, buildWellhead(w.ctx), -5.0, -3.3, 0, out);
  // The flowline continues across behind the plate on a row of stands, up to the exchanger's hot header.
  k.pipe(g, [[-2.8, 1.65, -3.3], [3.7, 1.65, -3.3]], 0.17, M.clad);
  for (const x of [-1.6, 0.2, 2.0]) {
    k.footing(g, x, -3.3, 0.3);
    k.box(g, [0.12, 1.45, 0.12], M.darkSteel, [x, 0.77, -3.3], null, true);
    k.box(g, [0.4, 0.06, 0.4], M.darkSteel, [x, 1.46, -3.3]);
  }

  // THE PLATE HEAT EXCHANGER: a stack of thin plates between two end frames on a skid, tie bars along its top and bottom.
  {
    const X0 = 3.95, Z = -3.3, N = 20, PITCH = 0.1;
    k.box(g, [2.6, 0.2, 1.3], M.darkSteel, [X0 + N * PITCH / 2 + 0.05, 0.1, Z], null, true);
    k.box(g, [0.14, 1.5, 1.0], M.steel, [X0 - 0.07, 1.05, Z], null, true);
    for (let i = 0; i < N; i++) k.box(g, [0.035, 1.3, 0.86], i % 2 ? M.clad : M.steel, [X0 + 0.05 + i * PITCH, 1.0, Z]);
    k.box(g, [0.14, 1.5, 1.0], M.steel, [X0 + N * PITCH + 0.12, 1.05, Z], null, true);
    for (const [y, z] of [[1.72, -0.35], [1.72, 0.35], [0.4, -0.35], [0.4, 0.35]]) {
      k.cyl(g, [0.02, 0.02, N * PITCH + 0.5, 6], M.darkSteel, [X0 + N * PITCH / 2, y, Z + z], [0, 0, Math.PI / 2]);
    }
    // The four ports on the fixed end: hot in at the top (the flowline), hot out below, cold in and cold out.
    k.cyl(g, [0.14, 0.14, 0.2, 14], M.clad, [X0 - 0.2, 1.65, Z], [0, 0, Math.PI / 2]);
    k.cyl(g, [0.12, 0.12, 0.2, 14], M.rusted, [X0 - 0.2, 0.55, Z], [0, 0, Math.PI / 2]);
    k.tag(g, 'EXCHANGER 1', { w: 0.62, h: 0.18 }, [X0 + N * PITCH / 2, 0.36, Z + 0.67]);
    // The hot outlet goes on to the right, and down to the thermowell tap.
    k.pipe(g, [[X0 + N * PITCH + 0.2, 1.65, Z], [6.45, 1.65, Z], [6.45, 1.1, -1.7]], 0.1, M.clad);
  }
  // THE HOT-WATER TANK between the wellhead and the exchanger: lagged, banded, on legs, with its return line.
  k.cyl(g, [0.8, 0.8, 2.0, 22], M.insul, [0.4, 1.4, -5.3], null, true);
  for (const y of [0.7, 1.4, 2.1]) k.cyl(g, [0.815, 0.815, 0.05, 22], M.darkSteel, [0.4, y, -5.3]);
  k.cyl(g, [0.8, 0.12, 0.35, 22], M.insul, [0.4, 2.55, -5.3]);
  for (const [dx, dz] of [[0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55]]) k.box(g, [0.1, 0.4, 0.1], M.darkSteel, [0.4 + dx, 0.2, -5.3 + dz]);
  k.pipe(g, [[1.2, 0.8, -5.3], [3.7, 0.55, -5.3], [3.75, 0.55, -3.5]], 0.09, M.rusted);

  // THE THERMOWELL TAP (the field point): a pedestal on the hot outlet, a gauge on its face.
  {
    const PX = 6.45, PZ = -1.7;
    k.footing(g, PX, PZ, 0.3);
    k.cyl(g, [0.07, 0.09, 1.0, 10], M.darkSteel, [PX, 0.55, PZ], null, true);
    k.box(g, [0.5, 0.5, 0.2], M.caseDark, [PX, 1.3, PZ], null, true);
    k.gauge(g, PX, 1.3, PZ + 0.11, 0.2, 0.7);
    k.tag(g, 'FLOWLINE · TAP', { w: 0.62, h: 0.17 }, [PX, 0.92, PZ + 0.1]);
  }
  k.lampMast(g, 3.0, -2.2, { h: 3.7, arm: [-2.5, 2.3] });

  out.colliders.push(
    { lx: 2.0, lz: -3.3, hw: 3.9, hd: 0.3 },
    { lx: 5.0, lz: -3.3, hw: 1.4, hd: 0.7 },
    { lx: 0.4, lz: -5.3, r: 1.0 },
    { lx: 6.45, lz: -1.7, hw: 0.3, hd: 0.2 },
    { lx: 3.0, lz: -2.2, r: 0.2 }
  );
  const fieldPoints = [{
    id: 'flowline', label: 'Flowline Tap', lx: 6.45, ly: 1.3, lz: -1.6, half: [0.4, 0.4, 0.3],
    stand: { lx: 6.45, lz: -0.1 }
  }];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders: out.colliders, vents: out.vents, fieldPoints };
}

/* ======================================================================
   2. THE SPRING SHELF — a railed sampling shelf at the hot spring's edge (deck)
   The shelf is a grated deck at the spring's lip, railed along the water side. A
   davit stands at the right with a basket on its chain where the sampling blocks
   are held in the spring; a lagged bath and a platform scale stand at the left.
   ====================================================================== */

export function buildSpringShelf(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'spring-shelf';
  const bench = benchOf(w, 'site-2');
  g.add(bench.group);
  const colliders = [PLATE];

  // The rail along the spring side: posts every 1.7 m, two rails, a toe board.
  const RZ = -4.0;
  for (let i = 0; i <= 8; i++) {
    const x = -6.8 + i * 1.7;
    k.box(g, [0.06, 1.05, 0.06], M.darkSteel, [x, 0.53, RZ], null, true);
  }
  for (const y of [1.05, 0.55]) k.box(g, [13.6, 0.05, 0.05], M.paintYellow, [0, y, RZ]);
  k.box(g, [13.6, 0.12, 0.03], M.darkSteel, [0, 0.08, RZ]);
  colliders.push({ lx: 0, lz: RZ, hw: 6.9, hd: 0.15 });

  // The sampling davit at the right: a post with a swung arm out over the rail and a basket on a chain.
  {
    const DX = 5.6, DZ = -3.3;
    k.footing(g, DX, DZ, 0.4);
    k.cyl(g, [0.09, 0.12, 2.8, 12], M.darkSteel, [DX, 1.45, DZ], null, true);
    k.strut(g, [DX, 2.7, DZ], [DX, 2.7, DZ - 1.6], 0.06, M.darkSteel);
    k.strut(g, [DX, 2.1, DZ], [DX, 2.65, DZ - 0.9], 0.035, M.darkSteel);
    k.strut(g, [DX, 2.62, DZ - 1.5], [DX, 1.25, DZ - 1.5], 0.012, M.darkSteel, 5);
    k.box(g, [0.55, 0.38, 0.45], M.mesh, [DX, 1.05, DZ - 1.5]);
    k.box(g, [0.58, 0.04, 0.48], M.darkSteel, [DX, 0.86, DZ - 1.5]);
    k.box(g, [0.58, 0.04, 0.48], M.darkSteel, [DX, 1.25, DZ - 1.5]);
    k.box(g, [0.34, 0.2, 0.3], M.copper, [DX, 1.0, DZ - 1.5]);
    k.tag(g, 'SAMPLE BASKET', { w: 0.7, h: 0.17 }, [DX + 0.18, 0.55, DZ + 0.2]);
    colliders.push({ lx: DX, lz: DZ, r: 0.35 }, { lx: DX, lz: DZ - 1.5, r: 0.45 });
  }
  // The lagged bath at the left, with its stirrer, and a thermometer in its lid.
  k.cyl(g, [0.62, 0.62, 1.25, 28], M.insul, [-4.6, 0.66, -2.9], null, true);
  for (const y of [0.18, 0.66, 1.14]) k.cyl(g, [0.635, 0.635, 0.06, 28], M.darkSteel, [-4.6, y, -2.9]);
  k.cyl(g, [0.66, 0.66, 0.08, 28], M.darkSteel, [-4.6, 1.33, -2.9]);
  k.cyl(g, [0.14, 0.16, 0.34, 14], M.steel, [-4.75, 1.54, -2.9]);
  k.cyl(g, [0.02, 0.02, 0.4, 6], M.darkSteel, [-4.75, 1.9, -2.9]);
  k.thermometer(g, -4.35, 1.37, -2.8, 0.8);
  k.tag(g, 'BATH 2', { w: 0.46, h: 0.16 }, [-4.6, 0.5, -2.27]);
  colliders.push({ lx: -4.6, lz: -2.9, r: 0.75 });
  // The platform scale beside it: a low plate with a post and a dial, a glass jug standing on the plate.
  k.box(g, [0.9, 0.12, 0.7], M.steel, [-6.1, 0.06, -2.7], null, true);
  k.box(g, [0.8, 0.04, 0.6], M.darkSteel, [-6.1, 0.14, -2.7]);
  k.cyl(g, [0.03, 0.03, 0.9, 6], M.darkSteel, [-6.5, 0.6, -3.0]);
  k.box(g, [0.28, 0.2, 0.08], M.steel, [-6.5, 1.1, -3.0]);
  k.cyl(g, [0.17, 0.15, 0.4, 16], M.glass, [-6.1, 0.36, -2.7]);
  colliders.push({ lx: -6.1, lz: -2.8, r: 0.6 });
  // A rock-lined drain and a stack of sample jars, to the right of the bath.
  for (let i = 0; i < 3; i++) k.cyl(g, [0.09, 0.09, 0.22, 10], M.glass, [-2.9 + i * 0.26, 0.11, -3.3]);
  k.box(g, [0.9, 0.05, 0.4], M.darkSteel, [-2.65, 0.025, -3.3]);

  k.lampMast(g, -3.1, -2.4, { h: 3.7, arm: [3.1, 2.1] });
  colliders.push({ lx: -3.1, lz: -2.4, r: 0.2 });
  const fieldPoints = [{
    id: 'edge', label: 'Spring Basket', lx: 5.6, ly: 1.05, lz: -4.8, half: [0.45, 0.35, 0.4],
    stand: { lx: 5.6, lz: -2.4 }
  }];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

/* ======================================================================
   3. THE BOILER ROOM — the habitat's boiler and its fuel cage (desk)
   A brick-set boiler drum lies on two saddles behind the plate, its firebox door
   facing the bench and a flue going up from it; a cage of fuel canisters stands
   at the right and a burner stand beside it.
   ====================================================================== */

export function buildBoilerRoom(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'boiler-room';
  const bench = benchOf(w, 'site-3');
  g.add(bench.group);
  const colliders = [PLATE];

  // The boiler: a horizontal drum on a brick setting, a firebox door in the setting's face, a sight glass and a gauge.
  k.box(g, [4.0, 1.1, 2.0], M.brick, [-0.6, 0.55, -5.4], null, true);
  k.box(g, [4.2, 0.08, 2.2], M.concrete, [-0.6, 0.04, -5.4]);
  k.cyl(g, [0.85, 0.85, 3.6, 28], M.clad, [-0.6, 1.95, -5.4], [0, 0, Math.PI / 2], true);
  for (const x of [-2.1, -1.0, 0.1, 0.9]) k.cyl(g, [0.86, 0.86, 0.05, 28], M.darkSteel, [x, 1.95, -5.4], [0, 0, Math.PI / 2]);
  k.box(g, [0.9, 0.7, 0.06], M.darkSteel, [-0.6, 0.6, -4.37]);
  k.box(g, [0.5, 0.4, 0.04], M.glassDark, [-0.6, 0.6, -4.33]);
  k.box(g, [0.12, 0.1, 0.1], M.brass, [-0.15, 0.65, -4.32]);
  k.gauge(g, 1.2, 2.55, -4.56, 0.2, 0.2);
  k.tag(g, 'BOILER 3', { w: 0.6, h: 0.17 }, [-1.9, 0.8, -4.36]);
  // The flue: a lagged stack off the drum's top, climbing past the roof line.
  k.cyl(g, [0.3, 0.3, 6.2, 16], M.rusted, [-2.0, 4.5, -5.4], null, true);
  k.cyl(g, [0.42, 0.34, 0.25, 16], M.darkSteel, [-2.0, 7.55, -5.4]);
  for (const y of [2.6, 4.0, 5.6]) k.cyl(g, [0.32, 0.32, 0.06, 16], M.darkSteel, [-2.0, y, -5.4]);
  // The feed: a steam line out of the drum's crown to the habitat, going up and away behind.
  k.pipe(g, [[0.9, 2.7, -5.4], [0.9, 3.4, -5.4], [0.9, 3.4, -7.2]], 0.14, M.insul);
  // The back wall of the room: a low brick wall, so the plant is a room and not a heap.
  k.box(g, [9.4, 2.2, 0.3], M.brick, [0.2, 1.1, -7.1], null, true);
  for (const x of [-4.5, 4.9]) k.box(g, [0.3, 2.2, 3.0], M.brick, [x, 1.1, -5.7], null, true);
  colliders.push({ lx: -0.6, lz: -5.4, hw: 2.1, hd: 1.15 }, { lx: 0.2, lz: -7.1, hw: 4.7, hd: 0.3 }, { lx: -4.5, lz: -5.7, hw: 0.3, hd: 1.5 }, { lx: 4.9, lz: -5.7, hw: 0.3, hd: 1.5 });

  // The fuel cage at the right: three canisters on a rack in a wire cage, the label of each on its shoulder.
  for (const [i, x] of [3.2, 3.9, 4.6].entries()) {
    const mat = [M.paintYellow, M.paintRed, M.steel][i];
    k.cyl(g, [0.26, 0.26, 1.15, 20], mat, [x, 0.6, -3.1], null, true);
    k.cyl(g, [0.06, 0.07, 0.16, 10], M.brass, [x, 1.34, -3.1]);
    k.cyl(g, [0.27, 0.27, 0.05, 20], M.darkSteel, [x, 0.9, -3.1]);
  }
  for (const x of [2.8, 4.95]) for (const z of [-3.5, -2.7]) k.box(g, [0.05, 1.7, 0.05], M.darkSteel, [x, 0.85, z]);
  for (const y of [0.4, 1.0, 1.65]) {
    k.box(g, [2.2, 0.04, 0.04], M.darkSteel, [3.9, y, -2.7]);
    k.box(g, [2.2, 0.04, 0.04], M.darkSteel, [3.9, y, -3.5]);
  }
  k.tag(g, 'FUEL 3', { w: 0.46, h: 0.16 }, [3.9, 0.3, -2.65]);
  colliders.push({ lx: 3.9, lz: -3.1, hw: 1.15, hd: 0.5 });
  // A burner on a tripod under a pot, left of the plate, with its hose to the cage.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    k.strut(g, [-4.9 + Math.cos(a) * 0.4, 0.02, -2.8 + Math.sin(a) * 0.4], [-4.9 + Math.cos(a) * 0.22, 0.85, -2.8 + Math.sin(a) * 0.22], 0.025, M.darkSteel, 6);
  }
  const ring = new THREE.Mesh(k.own(new THREE.TorusGeometry(0.24, 0.025, 6, 18)), M.darkSteel);
  ring.position.set(-4.9, 0.86, -2.8);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  k.cyl(g, [0.2, 0.18, 0.3, 18], M.copper, [-4.9, 1.04, -2.8]);
  colliders.push({ lx: -4.9, lz: -2.8, r: 0.5 });

  k.lampMast(g, 3.3, -1.5, { h: 3.7, arm: [-2.8, 1.5] });
  colliders.push({ lx: 3.3, lz: -1.5, r: 0.2 });
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents: [{ lx: -2.0, ly: 7.7, lz: -5.4, size: 0.4, rise: 9, life: 8, rate: 0.5, alpha: 0.3 }] };
}

/* ======================================================================
   4. THE FUMAROLE COIL — a sampling coil over a vent (deck)
   A sulphur cone breathes behind the plate; a copper cracking coil hangs over it
   under a hood and flue, and a gauge board on a post at the right reads the heat
   the coil gives up. The board is the field point.
   ====================================================================== */

export function buildFumaroleCoil(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'fumarole-coil';
  const bench = benchOf(w, 'site-4');
  g.add(bench.group);
  const out = { colliders: [PLATE], vents: [] };

  // THE VENT: a sulphur cone, and over it a vent grate.
  adopt(g, buildFumarole(w.ctx, { scale: 1.15 }, 4), -0.6, -5.4, 0, out);
  const CX = -0.6, CZ = -5.4, R = 0.62;
  // THE COIL: a copper tube wound six turns round four posts, rising over the cone.
  {
    let prev = null;
    for (let i = 0; i <= 96; i++) {
      const t = i / 96;
      const a = t * Math.PI * 2 * 6;
      const p = [CX + Math.cos(a) * R, 1.6 + t * 1.4, CZ + Math.sin(a) * R];
      if (prev) k.strut(g, prev, p, 0.035, M.copper, 6);
      prev = p;
    }
    for (const [dx, dz] of [[-0.85, -0.7], [0.85, -0.7], [-0.85, 0.7], [0.85, 0.7]]) k.box(g, [0.06, 3.6, 0.06], M.darkSteel, [CX + dx, 1.8, CZ + dz], null, true);
    for (const y of [1.2, 3.4]) {
      k.box(g, [1.8, 0.05, 0.05], M.darkSteel, [CX, y, CZ - 0.7]);
      k.box(g, [1.8, 0.05, 0.05], M.darkSteel, [CX, y, CZ + 0.7]);
    }
    // The hood and its flue over the top of the coil.
    k.tube(g, [0.62, 0.55, 20], M.steel, [CX, 3.75, CZ]);
    k.cyl(g, [0.22, 0.62, 0.5, 20], M.steel, [CX, 4.0, CZ]);
    k.cyl(g, [0.16, 0.16, 1.4, 12], M.rusted, [CX, 4.9, CZ]);
    // The coil's two ends: cold in at the right-hand post, warm out to the gauge board.
    k.pipe(g, [[CX + R, 1.6, CZ], [CX + 1.2, 1.6, CZ], [3.3, 1.0, CZ + 1.0], [6.3, 1.0, -2.0]], 0.05, M.copper);
    k.tag(g, 'COIL 4', { w: 0.46, h: 0.16 }, [CX - 0.8, 0.9, CZ + 0.78]);
    out.colliders.push({ lx: CX, lz: CZ, r: 1.65 });
  }
  // THE GAUGE BOARD (the field point): a board on a post, two dials and a bar between them.
  {
    const PX = 6.3, PZ = -1.9;
    k.footing(g, PX, PZ, 0.3);
    k.cyl(g, [0.07, 0.09, 1.0, 10], M.darkSteel, [PX, 0.55, PZ], null, true);
    k.box(g, [1.0, 0.6, 0.12], M.caseDark, [PX, 1.45, PZ], null, true);
    k.gauge(g, PX - 0.27, 1.45, PZ + 0.07, 0.19, -0.3);
    k.gauge(g, PX + 0.27, 1.45, PZ + 0.07, 0.19, 0.6);
    k.tag(g, 'COIL · GAUGES', { w: 0.62, h: 0.17 }, [PX, 0.92, PZ + 0.1]);
    out.colliders.push({ lx: PX, lz: PZ, hw: 0.55, hd: 0.2 });
  }
  // A drum rack and a hose reel at the left, so the coil has a supply.
  k.cyl(g, [0.3, 0.3, 0.9, 16], M.drum, [-5.0, 0.5, -3.0], null, true);
  k.cyl(g, [0.3, 0.3, 0.9, 16], M.drumB, [-5.7, 0.5, -3.0], null, true);
  k.pipe(g, [[-5.0, 0.95, -3.0], [-5.0, 1.15, -3.6], [-1.4, 1.15, -5.4]], 0.04, M.rubber);
  out.colliders.push({ lx: -5.35, lz: -3.0, hw: 0.95, hd: 0.4 });

  k.lampMast(g, 3.2, -2.3, { h: 3.7, arm: [-2.8, 2.1] });
  out.colliders.push({ lx: 3.2, lz: -2.3, r: 0.2 });
  const fieldPoints = [{
    id: 'coil', label: 'Coil Gauges', lx: 6.3, ly: 1.45, lz: -1.8, half: [0.55, 0.35, 0.3],
    stand: { lx: 6.3, lz: -0.1 }
  }];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders: out.colliders, vents: out.vents, fieldPoints };
}

/* ======================================================================
   5. THE SEPARATOR MANIFOLD — where steam takes two routes (shelf)
   A cyclone separator stands at the left behind the plate; its steam line comes
   down to a header with two routes to the same drain at the right: a straight
   shaft, capped and sealed, and a stepped route of lagged pipe that lands on
   level plates, so a drop can be taken in one fall or in steps.
   ====================================================================== */

export function buildSeparatorManifold(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'separator-manifold';
  const bench = benchOf(w, 'site-5');
  g.add(bench.group);
  const colliders = [PLATE];

  // THE SEPARATOR: a cyclone vessel on four legs with a cone below and a dome above, a ladder, steam off the top.
  {
    const X = -5.0, Z = -4.4, R = 1.1;
    k.cyl(g, [R, R, 5.2, 24], M.clad, [X, 4.0, Z], null, true);
    const dome = new THREE.Mesh(k.own(new THREE.SphereGeometry(R, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2)), M.clad);
    dome.position.set(X, 6.6, Z);
    g.add(dome);
    const cone = new THREE.Mesh(k.own(new THREE.ConeGeometry(R, 0.9, 24, 1, true).rotateX(Math.PI)), M.clad);
    cone.position.set(X, 1.05, Z);
    g.add(cone);
    for (let n = 0; n < 4; n++) k.cyl(g, [R + 0.02, R + 0.02, 0.05, 24], M.darkSteel, [X, 2.2 + n * 1.2, Z]);
    for (const [dx, dz] of [[0.8, 0.8], [-0.8, 0.8], [0.8, -0.8], [-0.8, -0.8]]) {
      k.box(g, [0.2, 1.6, 0.2], M.steel, [X + dx, 0.8, Z + dz], null, true);
      k.box(g, [0.4, 0.05, 0.4], M.darkSteel, [X + dx, 0.03, Z + dz]);
    }
    k.cyl(g, [0.3, 0.3, 0.9, 14], M.clad, [X, 7.4, Z]);
    k.tag(g, 'SEPARATOR 5', { w: 0.9, h: 0.22 }, [X, 3.0, Z + R + 0.02]);
    // The inlet at the side and the outlet below, both to the header.
    k.pipe(g, [[X + R, 3.0, Z], [X + R + 0.8, 3.0, Z], [X + R + 0.8, 1.4, Z + 0.4], [-2.5, 1.4, -3.4]], 0.16, M.clad);
    colliders.push({ lx: X, lz: Z, r: 1.35 });
  }
  // THE HEADER: a lagged line across behind the plate, a valve on each leg, and a gauge.
  const HZ = -3.4;
  k.cyl(g, [0.13, 0.13, 5.4, 12], M.clad, [0.2, 1.4, HZ], [0, 0, Math.PI / 2], true);
  for (const x of [-2.4, 2.8]) k.cyl(g, [0.15, 0.15, 0.06, 12], M.darkSteel, [x, 1.4, HZ], [0, 0, Math.PI / 2]);
  k.gauge(g, 0.2, 2.0, HZ + 0.12, 0.2, 0.3);
  k.cyl(g, [0.03, 0.03, 0.5, 8], M.brass, [0.2, 1.7, HZ + 0.1]);
  colliders.push({ lx: 0.2, lz: HZ, hw: 2.8, hd: 0.25 });
  // THE STRAIGHT SHAFT: a capped, sealed pipe straight down from the header, with its cap and a sight plate.
  {
    const X = 2.8;
    k.cyl(g, [0.26, 0.26, 2.7, 18], M.rusted, [X, 1.35, -5.0], null, true);
    k.cyl(g, [0.38, 0.38, 0.1, 18], M.paintRed, [X, 2.75, -5.0]);
    k.pipe(g, [[X, 1.4, HZ], [X, 1.4, -4.2], [X, 2.4, -4.9]], 0.1, M.clad);
    k.tag(g, 'SHAFT', { w: 0.4, h: 0.15 }, [X, 0.3, -4.7]);
    colliders.push({ lx: X, lz: -5.0, r: 0.5 });
  }
  // THE STEPPED ROUTE: lagged pipe stepping down in three falls, landing on a plate at each.
  {
    const route = [[4.2, 2.6], [4.2, 2.0], [5.1, 2.0], [5.1, 1.35], [6.0, 1.35], [6.0, 0.7], [6.9, 0.7], [6.9, 0.15]];
    const Z = -5.6;
    for (let i = 0; i < route.length - 1; i++) {
      const [ax, ay] = route[i], [bx, by] = route[i + 1];
      k.strut(g, [ax, ay, Z], [bx, by, Z], 0.1, M.clad, 12);
      k.ball(g, 0.105, M.clad, [bx, by, Z]);
    }
    for (const [x, y] of [[4.65, 2.0], [5.55, 1.35], [6.45, 0.7]]) k.box(g, [0.5, 0.05, 0.3], M.paint2, [x, y - 0.14, Z + 0.2]);
    k.pipe(g, [[2.8, 1.4, HZ], [4.2, 2.6, HZ - 1.0], [4.2, 2.6, Z]], 0.1, M.clad);
    k.footing(g, 6.9, Z, 0.3);
    colliders.push({ lx: 5.4, lz: Z, hw: 1.7, hd: 0.3 });
  }
  // A drain sump at the foot of the route.
  k.box(g, [1.0, 0.5, 1.0], M.concrete, [6.9, 0.25, -6.5], null, true);

  k.lampMast(g, -3.3, -1.8, { h: 3.7, arm: [3.2, 1.8] });
  colliders.push({ lx: -3.3, lz: -1.8, r: 0.2 });
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents: [{ lx: -5.0, ly: 7.9, lz: -4.4, size: 0.45, rise: 11, life: 9, rate: 0.5, alpha: 0.3 }] };
}

/* ======================================================================
   6. THE SILENCER BAY — where steam expands (desk)
   The plant's pair of rock-muffler silencers stand behind the bench, side by side,
   letting unwanted steam go. In front of them, behind the plate, two glass bulbs
   on a stand are joined through a stopcock; a vacuum pump and its gauge stand at
   the right. One bulb holds the gas, one is empty, and the stopcock lets it spread.
   ====================================================================== */

export function buildSilencerBay(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'silencer-bay';
  const bench = benchOf(w, 'site-6');
  g.add(bench.group);
  const out = { colliders: [PLATE], vents: [] };

  adopt(g, buildSilencerPair(w.ctx), 0, -9.0, 0, out);
  // The bulb stand: a bench-high table on four posts with two bulbs, a stopcock between, a rule along it.
  {
    const Z = -3.5;
    k.box(g, [3.0, 0.07, 0.8], M.darkSteel, [-0.2, 0.95, Z], null, true);
    for (const [x, z] of [[-1.6, Z - 0.3], [1.2, Z - 0.3], [-1.6, Z + 0.3], [1.2, Z + 0.3]]) k.box(g, [0.07, 0.95, 0.07], M.darkSteel, [x, 0.47, z]);
    for (const x of [-1.0, 0.6]) {
      const bulb = new THREE.Mesh(k.own(new THREE.SphereGeometry(0.42, 22, 16)), M.glass);
      bulb.position.set(x, 1.62, Z);
      g.add(bulb);
      k.cyl(g, [0.1, 0.12, 0.2, 12], M.brass, [x, 1.1, Z]);
      const ring = new THREE.Mesh(k.own(new THREE.TorusGeometry(0.43, 0.02, 5, 24).rotateX(Math.PI / 2)), M.darkSteel);
      ring.position.set(x, 1.62, Z);
      g.add(ring);
    }
    k.cyl(g, [0.05, 0.05, 0.5, 10], M.glass, [-0.2, 1.62, Z], [0, 0, Math.PI / 2]);
    k.box(g, [0.16, 0.16, 0.16], M.brass, [-0.2, 1.62, Z]);
    k.box(g, [0.04, 0.3, 0.04], M.paintRed, [-0.2, 1.82, Z]);
    k.tag(g, 'BULBS 6', { w: 0.5, h: 0.16 }, [-0.2, 0.7, Z + 0.42]);
    out.colliders.push({ lx: -0.2, lz: Z, hw: 1.6, hd: 0.5 });
  }
  // The vacuum pump at the right, and a hose to the bulbs.
  k.box(g, [0.8, 0.55, 0.5], M.steel, [4.4, 0.28, -3.4], null, true);
  k.cyl(g, [0.2, 0.2, 0.55, 14], M.darkSteel, [4.95, 0.32, -3.4], [0, 0, Math.PI / 2]);
  k.gauge(g, 4.4, 1.05, -3.12, 0.17, 0.4);
  k.pipe(g, [[4.0, 0.56, -3.4], [3.0, 1.9, -3.4], [0.9, 1.85, -3.5]], 0.025, M.rubber);
  out.colliders.push({ lx: 4.5, lz: -3.4, hw: 0.7, hd: 0.4 });
  // A line from the plant's steam to the silencers' inlets, behind everything.
  k.pipe(g, [[-5.6, 0.9, -12.3], [-2.6, 0.9, -12.3]], 0.2, M.clad);
  k.pipe(g, [[2.6, 0.9, -12.3], [5.6, 0.9, -12.3]], 0.2, M.clad);

  k.lampMast(g, -3.4, -2.0, { h: 3.7, arm: [3.2, 1.9] });
  out.colliders.push({ lx: -3.4, lz: -2.0, r: 0.2 });
  return { group: g, bench, benchLocal: [0, 0, 0], colliders: out.colliders, vents: out.vents };
}

/* ======================================================================
   7. THE CONTROL ROOM — the turbine hall's control room (desk)
   A booth of ribbed sheet with a window on the hall stands behind the plate,
   open at the front; inside, a rack of dials; outside, at the right, a small
   brick furnace with its door and dial and a beam balance beside it.
   ====================================================================== */

export function buildControlRoom(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'control-room';
  const bench = benchOf(w, 'site-7');
  g.add(bench.group);
  const colliders = [PLATE];

  // THE BOOTH: a back wall with a window onto the hall, two side walls and a roof behind the plate only.
  const BZ = -5.4;
  k.box(g, [8.4, 3.2, 0.2], M.hallWall, [-0.2, 1.6, BZ], null, true);
  k.box(g, [5.0, 1.3, 0.05], M.glassDark, [-0.6, 2.0, BZ + 0.12]);
  for (const x of [-3.1, -1.85, -0.6, 0.65, 1.9]) k.box(g, [0.05, 1.3, 0.07], M.darkSteel, [x, 2.0, BZ + 0.13]);
  for (const x of [-4.2, 3.8]) k.box(g, [0.2, 3.2, 3.4], M.hallWall, [x, 1.6, BZ + 1.6], null, true);
  k.box(g, [8.4, 0.2, 3.7], M.hallRoof, [-0.2, 3.3, BZ + 1.75], null, true);
  // The rack of dials along the back wall: a console of three cases, each with a dial and a row of keys.
  for (const [i, x] of [-2.7, -0.7, 1.3].entries()) {
    k.box(g, [1.5, 1.0, 0.6], M.darkSteel, [x, 0.5, BZ + 1.1], null, true);
    k.box(g, [1.4, 0.04, 0.5], M.steel, [x, 1.02, BZ + 1.1]);
    k.gauge(g, x - 0.35, 1.5, BZ + 0.45, 0.16, -0.5 + i * 0.5);
    k.gauge(g, x + 0.35, 1.5, BZ + 0.45, 0.16, 0.5 - i * 0.4);
  }
  k.tag(g, 'CONTROL 7', { w: 0.7, h: 0.18 }, [-0.6, 2.85, BZ + 0.12]);
  colliders.push({ lx: -0.2, lz: BZ, hw: 4.2, hd: 0.15 }, { lx: -4.2, lz: BZ + 1.6, hw: 0.15, hd: 1.7 }, { lx: 3.8, lz: BZ + 1.6, hw: 0.15, hd: 1.7 }, { lx: -0.7, lz: BZ + 1.1, hw: 2.2, hd: 0.35 });

  // THE FURNACE at the right: a small brick furnace with its door and dial, a short flue.
  k.box(g, [1.2, 1.3, 0.95], M.brick, [5.5, 0.65, -3.0], null, true);
  k.box(g, [0.6, 0.55, 0.06], M.darkSteel, [5.5, 0.7, -2.5]);
  k.box(g, [0.08, 0.08, 0.1], M.brass, [5.75, 0.7, -2.46]);
  k.cyl(g, [0.13, 0.13, 0.04, 18], M.brass, [5.1, 1.15, -2.51], [Math.PI / 2, 0, 0]);
  k.cyl(g, [0.15, 0.17, 1.9, 12], M.rusted, [5.3, 2.25, -3.2]);
  colliders.push({ lx: 5.5, lz: -3.0, hw: 0.7, hd: 0.55 });
  // THE BEAM BALANCE beside it: an upright, a beam, two pans on hangers.
  {
    const X = -5.6, Z = -3.1;
    k.cyl(g, [0.08, 0.14, 1.6, 10], M.darkSteel, [X, 0.8, Z], null, true);
    k.box(g, [0.6, 0.06, 0.6], M.darkSteel, [X, 0.03, Z]);
    const beam = k.box(g, [2.2, 0.07, 0.08], M.brass, [X, 1.64, Z]);
    beam.rotation.z = 0.08;
    for (const [dx, y] of [[-1.0, 1.56], [1.0, 1.72]]) {
      k.strut(g, [X + dx - 0.2, y, Z], [X + dx, y - 0.5, Z], 0.008, M.darkSteel, 4);
      k.strut(g, [X + dx + 0.2, y, Z], [X + dx, y - 0.5, Z], 0.008, M.darkSteel, 4);
      k.cyl(g, [0.3, 0.25, 0.05, 18], M.brass, [X + dx, y - 0.52, Z]);
    }
    colliders.push({ lx: X, lz: Z, r: 0.55 });
  }
  k.lampMast(g, 3.3, -1.5, { h: 3.7, arm: [-2.9, 1.5] });
  colliders.push({ lx: 3.3, lz: -1.5, r: 0.2 });
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildWellheadExchanger,
  'site-2': buildSpringShelf,
  'site-3': buildBoilerRoom,
  'site-4': buildFumaroleCoil,
  'site-5': buildSeparatorManifold,
  'site-6': buildSilencerBay,
  'site-7': buildControlRoom
};
