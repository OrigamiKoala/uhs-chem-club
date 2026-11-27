/**
 * bellows/stations.js — The six hosts: the rooms of the gas works a Learn bench is built into.
 *
 * Each builder returns the machinery AND its bench as ONE object in the host frame, so the overlap rule
 * (which exempts a body's own parts) lets the bench stand against the machine it belongs to, and the bay
 * contract (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the camera need
 * empty. The room itself (walls, roof, floor) is built by `decks.js` from `works-plan.js`.
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
 * The back wall stands 3.6 m behind the plate (its face at -3.3). `verify:bench` measures the bay;
 * `verify:bellows` measures that no host leaves its extent (`host-plan.js`).
 *
 * ONLY LAMPS ARE LIT. A host's lamps are `lampMark`s the world pools into three lights. No sign stands.
 *
 * @returns {{ group, bench, benchLocal, colliders, vents?, fieldPoints? }}  `colliders` are host-local:
 *   `{ lx, lz, r }` discs and `{ lx, lz, hw, hd }` boxes. `vents` are host-local plume mouths.
 */

import * as THREE from 'three';
import { buildBayBench, ctxMats } from '../bench-bay.js';
import { HOST_PLAN } from './host-plan.js';
import { BAGS, bagBelly } from './works-plan.js';

const LAMP = 0xd99423;
const Y = new THREE.Vector3(0, 1, 0);

/* ======================================================================
   THE BENCH — the shared bay bench, its cased instrument dressed for the kind
   ====================================================================== */

/** The bench: the shared bay bench in the host's skin, its dormant slot dressed for `kind`. */
export function buildBwBench(ctx, { kind = 'cylinder', plate = 'BN-01', skin = 'shelf' } = {}) {
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
    tagStyle: { fg: '#14223a', bg: '#d6e0ee' },
    dormant(dormant, { height }) {
      // THE ONE CLEAN THING. The plant is weathered; the cased instrument is the thing somebody uses, so it
      // keeps its own bright paint.
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.74, 0.5), M.case, 0, height + 0.41, -0.16);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      const barrel = (x, r, len) => dormant.add(mesh(new THREE.CylinderGeometry(r, r, len, 20, 1, true), M.glass, x, height + 0.62, 0.17, [0, 0, Math.PI / 2]));
      if (kind === 'cylinder' || kind === 'piston') {
        // A glass barrel with its piston and a gauge face: a bench for gas has a cylinder and a dial.
        barrel(-0.05, 0.15, 0.82);
        dormant.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 18), M.caseDark, 0.1, height + 0.62, 0.17, [0, 0, Math.PI / 2]));
        dormant.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), M.caseDark, 0.34, height + 0.62, 0.17, [0, 0, Math.PI / 2]));
        dormant.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 22), M.brass, -0.4, height + 0.44, 0.1, [Math.PI / 2, 0, 0]));
        dormant.add(mesh(new THREE.CircleGeometry(0.14, 22), M.glassDark, -0.4, height + 0.44, 0.125));
      } else if (kind === 'scale') {
        // A pan and a tare weight: the metering bench weighs.
        dormant.add(mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.05, 20), M.brass, -0.22, height + 0.46, 0.14));
        dormant.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 16), M.caseDark, 0.3, height + 0.46, 0.14));
        dormant.add(mesh(new THREE.CircleGeometry(0.1, 20), M.glassDark, 0.3, height + 0.6, 0.0, [-Math.PI / 2.4, 0, 0]));
      } else if (kind === 'tanks') {
        // Two small tanks and a valve between them.
        for (const x of [-0.3, 0.3]) dormant.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 16), M.caseDark, x, height + 0.57, 0.14));
        dormant.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), M.brass, 0, height + 0.66, 0.14, [0, 0, Math.PI / 2]));
        dormant.add(mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14), M.caseDark, 0, height + 0.76, 0.14, [Math.PI / 2, 0, 0]));
      } else if (kind === 'pinhole') {
        // A sight tube with a plate across its end.
        barrel(-0.1, 0.09, 0.9);
        dormant.add(mesh(new THREE.BoxGeometry(0.03, 0.26, 0.2), M.caseDark, 0.4, height + 0.62, 0.17));
        dormant.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8), M.glassDark, 0.42, height + 0.62, 0.17, [0, 0, Math.PI / 2]));
      } else {
        // A frosted chest with a coil on its lid: the cold bench.
        dormant.add(mesh(new THREE.BoxGeometry(1.0, 0.18, 0.4), M.rime, 0, height + 0.88, -0.16));
        for (let k = 0; k < 4; k++) dormant.add(mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 18), M.brass, 0.24, height + 0.46 + k * 0.06, 0.18, [Math.PI / 2, 0, 0]));
      }
    }
  });
}

/* ======================================================================
   THE PARTS KIT
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
    const m = new THREE.Mesh(own(new THREE.SphereGeometry(r, 16, 12)), mat);
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
  /** A pooled lamp mark and its amber fixture. */
  const lamp = (g, x, y, z, { intensity = 8, distance = 12 } = {}) => {
    const mark = new THREE.Object3D();
    mark.position.set(x, y, z);
    mark.userData.lamp = { color: LAMP, intensity, distance, decay: 1.7 };
    g.add(mark);
    w.lamps.push(mark);
    box(g, [0.4, 0.1, 0.2], M.lantern, [x, y + 0.12, z]);
  };
  /** A pendant work lamp hung by a rod from a ceiling at `ceil` down to `y`. */
  const pendant = (g, x, y, z, ceil, opts = {}) => {
    const rod = Math.max(0.2, ceil - (y + 0.22));
    cyl(g, [0.016, 0.016, rod, 6], M.darkSteel, [x, y + 0.22 + rod / 2, z]);
    cyl(g, [0.12, 0.26, 0.14, 12], M.darkSteel, [x, y + 0.2, z]);
    lamp(g, x, y, z, opts);
  };
  /** A vertical vessel standing on the floor: a shell, two dished heads, bands and a skirt. */
  const vessel = (g, x, z, r, h, mat, { y0 = 0 } = {}) => {
    cyl(g, [r * 0.9, r * 0.95, 0.5, 20], M.darkSteel, [x, y0 + 0.25, z]);
    cyl(g, [r, r, h, 24], mat, [x, y0 + 0.5 + h / 2, z], null, true);
    ball(g, r, mat, [x, y0 + 0.5 + h, z], [1, 0.4, 1]);
    for (const f of [0.2, 0.8]) cyl(g, [r + 0.03, r + 0.03, 0.08, 24], M.darkSteel, [x, y0 + 0.5 + h * f, z]);
  };
  return { box, cyl, ball, strut, pipe, gauge, wheel, lamp, pendant, vessel, shade, own, t4 };
}

/** The colliders a bench itself always carries (the plate, host frame). */
const PLATE = { lx: 0, lz: 0, hw: 2.4, hd: 0.65 };

function start(w, siteId, name) {
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = name;
  const plan = HOST_PLAN[siteId];
  const bench = buildBwBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  return { k, M: w.M, g, bench, colliders: [PLATE], vents: [], fieldPoints: [] };
}

const done = ({ g, bench, colliders, vents, fieldPoints }) => ({ group: g, bench, benchLocal: [0, 0, 0], colliders, vents, fieldPoints });

/* ======================================================================
   1. INSIDE THE SPHERE'S SKIRT (site-1, q1-knocks, Pressure and Temperature)
   The plated skirt that carries the spherical holder; the catch deck under the sphere is the roof. Behind
   the plate the gauge board on the skirt, its lines running up through the deck to the sphere. To the left
   the sphere's relief valve on its stand and the knockout pot under it; to the right the drain leg down
   from the sphere into the drain pot with its level glass, and a ladder up the skirt to the deck's hatch.
   ====================================================================== */

function buildSkirt(w) {
  const h = start(w, 'site-1', 'sphere-skirt');
  const { k, M, g, colliders } = h;
  const CEIL = 4.8;
  // The gauge board on the back plating, above the screens, its lines up to the sphere.
  k.box(g, [3.8, 1.0, 0.06], M.darkSteel, [0, 3.05, -3.24]);
  for (const [x, n] of [[-1.35, -0.9], [-0.45, -0.3], [0.45, 0.2], [1.35, 0.7]]) {
    k.gauge(g, x, 3.05, -3.2, 0.2, n);
    k.strut(g, [x, 3.25, -3.17], [x, 5.15, -3.17], 0.014, M.copper, 5);
  }
  // A header along the back plating high up, from the relief stand across to the drain leg.
  k.pipe(g, [[-4.6, 4.3, -2.95], [4.6, 4.3, -2.95]], 0.12, M.steel);
  // THE RELIEF VALVE at the left: a riser from the header down to a spring valve, its discharge into the knockout pot.
  k.pipe(g, [[-4.6, 4.3, -2.95], [-4.6, 2.4, -2.95]], 0.12, M.steel);
  k.cyl(g, [0.22, 0.22, 0.55, 14], M.paintRed, [-4.6, 2.05, -2.95]);
  k.cyl(g, [0.1, 0.16, 0.7, 12], M.paintRed, [-4.6, 2.65, -2.95]);
  k.cyl(g, [0.16, 0.16, 0.08, 12], M.darkSteel, [-4.6, 1.75, -2.95]);
  k.pipe(g, [[-4.6, 1.75, -2.95], [-4.6, 1.75, -1.4], [-5.3, 1.75, -1.0]], 0.1, M.steel);
  k.box(g, [0.5, 1.7, 0.5], M.darkSteel, [-4.6, 0.85, -2.95]);
  k.vessel(g, -5.3, -0.6, 0.62, 1.4, M.steel);
  k.gauge(g, -5.3, 1.1, 0.04, 0.14, 0.2);
  colliders.push({ lx: -4.6, lz: -2.95, r: 0.42 });
  colliders.push({ lx: -5.3, lz: -0.6, r: 0.72 });
  // THE DRAIN LEG at the right: down from the deck to a drain pot with its level glass and a valve to the floor drain.
  k.pipe(g, [[4.6, 4.3, -2.95], [4.6, 5.15, -2.95]], 0.12, M.steel);
  k.pipe(g, [[5.0, 5.15, -1.2], [5.0, 2.2, -1.2]], 0.16, M.steel);
  k.vessel(g, 5.0, -1.2, 0.55, 1.2, M.steel);
  k.strut(g, [5.62, 0.6, -1.2], [5.62, 1.6, -1.2], 0.045, M.glass, 8);
  for (const y of [0.55, 1.65]) k.box(g, [0.14, 0.08, 0.14], M.darkSteel, [5.62, y, -1.2]);
  k.pipe(g, [[5.0, 0.35, -0.6], [5.0, 0.35, 0.3], [5.0, 0.05, 0.3]], 0.07, M.steel);
  k.wheel(g, 5.0, 0.75, 0.3, 0.12);
  colliders.push({ lx: 5.0, lz: -1.0, r: 0.75 });
  colliders.push({ lx: 5.0, lz: 0.3, r: 0.2 });
  // The ladder up the right-hand plating to the hatch in the catch deck.
  for (const z of [1.9, 2.5]) k.box(g, [0.06, CEIL + 0.3, 0.06], M.darkSteel, [6.45, (CEIL + 0.3) / 2, z]);
  for (let y = 0.3; y < CEIL; y += 0.3) k.box(g, [0.03, 0.03, 0.6], M.darkSteel, [6.45, y, 2.2]);
  colliders.push({ lx: 6.3, lz: 2.2, hw: 0.3, hd: 0.45 });
  // Lamps hung from the catch deck's beams.
  k.pendant(g, 0, 3.4, -0.6, CEIL);
  k.pendant(g, -4.0, 3.6, 2.8, CEIL, { intensity: 5 });
  k.pendant(g, 3.8, 3.6, 2.8, CEIL, { intensity: 5 });
  return done(h);
}

/* ======================================================================
   2. THE COMPRESSOR TOWER'S BASE HALL (site-2, q2-laws, The Gas Laws)
   Cast into the plinth under the Compressor. Behind the plate the crankcase along the back wall with
   the three crosshead guides rising from it through the roof to the cylinders above. To the left the
   intercooler lies on its saddles; to the right the receiver stands, and the delivery main runs across
   under the roof from one to the other.
   ====================================================================== */

function buildHall(w) {
  const h = start(w, 'site-2', 'tower-hall');
  const { k, M, g, colliders } = h;
  const CEIL = 5.2;
  // The crankcase: a long cast block along the back wall, inspection doors in its face, the shaft's cover on top.
  k.box(g, [11.2, 1.9, 1.12], M.darkSteel, [0, 0.95, -2.71], null, true);
  for (const x of [-4.2, -1.4, 1.4, 4.2]) {
    k.box(g, [1.1, 0.8, 0.04], M.steel, [x, 1.05, -2.13]);
    for (const [dx, dy] of [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]]) k.cyl(g, [0.035, 0.035, 0.05, 6], M.brass, [x + dx, 1.05 + dy, -2.1], [Math.PI / 2, 0, 0]);
  }
  k.cyl(g, [0.5, 0.5, 11.0, 18], M.steel, [0, 1.9, -2.71], [0, 0, Math.PI / 2]);
  // The crosshead guides: three cast frames from the crankcase up through the roof to the cylinders above.
  for (const x of [-3.6, 0, 3.6]) {
    k.box(g, [1.0, CEIL - 2.3, 0.9], M.steel, [x, 2.3 + (CEIL - 2.3) / 2, -2.78], null, true);
    k.box(g, [0.5, 1.4, 0.04], M.glassDark, [x, 3.4, -2.31]);
    k.box(g, [1.2, 0.16, 1.1], M.darkSteel, [x, 2.38, -2.78]);
  }
  // Oil lines along the crankcase's top.
  k.pipe(g, [[-5.2, 2.2, -2.3], [5.2, 2.2, -2.3]], 0.04, M.brass);
  colliders.push({ lx: 0, lz: -2.71, hw: 5.65, hd: 0.6 });
  // THE INTERCOOLER at the left: a shell on two saddles, its tube plate and water connections, a line up to the roof.
  for (const z of [-1.4, 2.0]) k.box(g, [1.2, 0.6, 0.4], M.darkSteel, [-4.9, 0.3, z]);
  k.cyl(g, [0.72, 0.72, 4.4, 22], M.steel, [-4.9, 1.3, 0.3], [Math.PI / 2, 0, 0], true);
  for (const z of [-1.9, 2.5]) k.cyl(g, [0.86, 0.86, 0.12, 22], M.darkSteel, [-4.9, 1.3, z], [Math.PI / 2, 0, 0]);
  k.pipe(g, [[-4.9, 2.0, -1.0], [-4.9, CEIL - 0.6, -1.0], [-4.9, CEIL - 0.6, -2.3]], 0.16, M.steel);
  k.pipe(g, [[-5.5, 1.9, 1.6], [-5.5, 2.6, 1.6], [-6.3, 2.6, 1.6]], 0.08, M.steel);
  k.pipe(g, [[-4.3, 1.9, 1.6], [-4.3, 2.6, 1.6], [-4.3, 2.6, 2.9]], 0.08, M.steel);
  colliders.push({ lx: -4.9, lz: 0.3, hw: 0.95, hd: 2.4 });
  // THE RECEIVER at the right: a vertical vessel, its relief valve and gauge, the delivery main across under the roof.
  k.vessel(g, 4.9, 0.6, 0.95, 2.8, M.steel);
  k.cyl(g, [0.12, 0.12, 0.5, 10], M.paintRed, [4.9, 4.05, 0.6]);
  k.gauge(g, 4.9, 1.6, 1.58, 0.2, 0.5);
  k.pipe(g, [[4.9, 4.3, 0.6], [4.9, CEIL - 0.6, 0.6], [4.9, CEIL - 0.6, -2.3], [-4.9, CEIL - 0.6, -2.3]], 0.16, M.steel);
  colliders.push({ lx: 4.9, lz: 0.6, r: 1.1 });
  // A lube oil pump skid in the back right corner beside the crankcase.
  // Lamps hung from the crane girders.
  k.pendant(g, 0, 3.4, -0.6, CEIL - 0.55);
  k.pendant(g, -3.2, 3.7, 3.6, CEIL, { intensity: 5 });
  k.pendant(g, 3.2, 3.7, 3.6, CEIL, { intensity: 5 });
  return done(h);
}

/* ======================================================================
   3. THE METER HOUSE INSIDE THE PISTON HOLDER (site-3, q3-ideal, Ideal Gas Law)
   Low plated partitions inside the drum, the piston parked overhead. Behind the plate the meter run
   carries the gas in from the inlet riser at the left, which stands up to a bellmouth under the piston.
   To the left the volume indicator reads the piston's height off a tape; to the right the station meter
   and its gauge and thermometer stand.
   ====================================================================== */
function buildHolderMeter(w) {
  const h = start(w, 'site-3', 'holder-meter');
  const { k, M, g, colliders } = h;
  const CEIL = 4.85;
  // The inlet riser at the back left: a main up from the floor to a bellmouth under the piston.
  k.cyl(g, [0.55, 0.55, 3.9, 20], M.steel, [-5.2, 1.95, -2.55], null, true);
  k.cyl(g, [0.95, 0.6, 0.5, 20], M.steel, [-5.2, 4.15, -2.55]);
  k.cyl(g, [0.72, 0.72, 0.08, 20], M.darkSteel, [-5.2, 0.9, -2.55]);
  k.cyl(g, [0.72, 0.72, 0.08, 20], M.darkSteel, [-5.2, 2.9, -2.55]);
  colliders.push({ lx: -5.2, lz: -2.55, r: 0.8 });
  // The meter run along the back: a pipe at waist height on saddles, flanged either side of the orifice carrier.
  k.pipe(g, [[-4.6, 1.15, -2.65], [4.4, 1.15, -2.65]], 0.22, M.steel);
  for (const x of [-3.4, -1.0, 1.0, 3.4]) k.box(g, [0.3, 0.95, 0.5], M.darkSteel, [x, 0.48, -2.65]);
  for (const x of [-0.35, 0.35]) k.cyl(g, [0.36, 0.36, 0.08, 18], M.darkSteel, [x, 1.15, -2.65], [0, 0, Math.PI / 2]);
  k.box(g, [0.5, 0.9, 0.5], M.caseDark, [0, 1.75, -2.65]);
  k.strut(g, [-0.15, 1.38, -2.65], [-0.15, 1.3, -2.65], 0.02, M.brass);
  k.gauge(g, -0.3, 2.85, -2.85, 0.24, -0.2);
  k.gauge(g, 0.3, 2.85, -2.85, 0.24, 0.6);
  k.pipe(g, [[-0.15, 2.2, -2.65], [-0.3, 2.6, -2.85]], 0.02, M.brass);
  k.pipe(g, [[0.15, 2.2, -2.65], [0.3, 2.6, -2.85]], 0.02, M.brass);
  colliders.push({ lx: 0, lz: -2.65, hw: 4.7, hd: 0.4 });
  // The run turns up at the right into the station meter.
  k.pipe(g, [[4.4, 1.15, -2.65], [4.9, 1.15, -2.65], [4.9, 1.15, -1.6]], 0.22, M.steel);
  // THE STATION METER: a cased bellows meter on a plinth, its index on top, a thermometer well and a gauge on a stand.
  k.box(g, [1.6, 0.3, 1.4], M.darkSteel, [4.9, 0.15, -0.9]);
  k.box(g, [1.4, 1.5, 1.2], M.steel, [4.9, 1.05, -0.9], null, true);
  k.box(g, [1.46, 0.08, 1.26], M.darkSteel, [4.9, 1.82, -0.9]);
  k.box(g, [0.6, 0.3, 0.4], M.caseDark, [4.9, 2.0, -0.9]);
  k.box(g, [0.46, 0.18, 0.02], M.glassDark, [4.9, 2.02, -0.69]);
  k.pipe(g, [[4.9, 1.15, -0.25], [4.9, 1.15, 0.6], [4.9, 0.4, 0.6]], 0.22, M.steel);
  k.cyl(g, [0.035, 0.035, 0.6, 8], M.brass, [4.3, 1.5, 0.6], [0, 0, Math.PI / 2]);
  k.cyl(g, [0.03, 0.03, 1.4, 8], M.darkSteel, [3.6, 0.7, 0.7]);
  k.gauge(g, 3.6, 1.55, 0.74, 0.18, 0.3);
  colliders.push({ lx: 4.85, lz: -0.6, hw: 0.95, hd: 1.45 });
  colliders.push({ lx: 3.6, lz: 0.7, r: 0.25 });
  // THE VOLUME INDICATOR at the left: a tall scale on a post, its pointer hung from the piston on a tape.
  k.box(g, [0.5, 0.12, 0.5], M.darkSteel, [-5.4, 0.06, 0.4]);
  k.box(g, [0.14, 4.6, 0.14], M.darkSteel, [-5.4, 2.4, 0.4]);
  k.box(g, [0.06, 3.6, 0.5], M.paint2, [-5.3, 2.4, 0.4]);
  for (let i = 0; i <= 18; i++) k.box(g, [0.02, 0.02, i % 6 === 0 ? 0.3 : 0.16], M.caseDark, [-5.26, 0.6 + i * 0.2, 0.4 + (i % 6 === 0 ? 0.07 : 0.14)]);
  k.box(g, [0.08, 0.06, 0.36], M.paintRed, [-5.22, 3.05, 0.4]);
  k.strut(g, [-5.22, 3.08, 0.4], [-5.22, CEIL, 0.4], 0.01, M.darkSteel, 4);
  colliders.push({ lx: -5.4, lz: 0.4, r: 0.35 });
  // A pressure gauge on the partition at the left, its line up to the drum's floor.
  k.gauge(g, -6.45, 1.6, -1.2, 0.2, -0.4);
  // Lamps hung from the piston's ribs.
  k.pendant(g, 0, 3.4, -0.6, CEIL);
  k.pendant(g, -4.2, 3.6, 2.6, CEIL, { intensity: 5 });
  k.pendant(g, 4.2, 3.6, 2.6, CEIL, { intensity: 5 });
  return done(h);
}

/* ======================================================================
   4. THE GONDOLA UNDER THE MOORED BLADDER (site-4, q4-mixtures, Partial Pressures)
   The car hung under the bag, moored alongside the deck. Behind the plate the blending manifold on the
   car's end wall, four cell valves on it, each with a riser up through the roof to one of the bag's cells.
   To the left the racks of gas bottles the blend is made from; to the right the sampling counter with its
   bottles and a manometer. Windows along both sides look out over the drop.
   ====================================================================== */

function buildGondola(w) {
  const h = start(w, 'site-4', 'gondola');
  const { k, M, g, colliders } = h;
  const CEIL = 4.95;
  // The blending manifold: a header across the end wall, a cell valve and a gauge on each riser.
  k.pipe(g, [[-4.6, 1.5, -2.7], [4.6, 1.5, -2.7]], 0.1, M.steel);
  for (const [i, x] of [-3.6, -1.2, 1.2, 3.6].entries()) {
    k.pipe(g, [[x, 1.5, -2.7], [x, 1.5, -2.95], [x, CEIL + 0.2, -2.95]], 0.07, M.steel);
    k.cyl(g, [0.12, 0.12, 0.3, 10], M.darkSteel, [x, 2.0, -2.95]);
    const wh = new THREE.Mesh(k.own(new THREE.TorusGeometry(0.17, 0.02, 6, 16)), M.paintRed);
    wh.position.set(x, 2.0, -2.7);
    g.add(wh);
    k.gauge(g, x, 2.85, -2.86, 0.15, -0.6 + i * 0.4);
  }
  for (const x of [-4.4, 4.4]) k.box(g, [0.25, 1.5, 0.4], M.darkSteel, [x, 0.75, -2.8]);
  k.cyl(g, [0.16, 0.16, 0.6, 12], M.darkSteel, [0, 1.5, -2.7], [0, 0, Math.PI / 2]);
  colliders.push({ lx: 0, lz: -2.8, hw: 4.7, hd: 0.35 });
  // THE BOTTLE RACKS at the left: two rows of cylinders in a frame, chained, their valves capped.
  for (const z of [-2.2, -1.3, -0.4, 0.5]) {
    for (const x of [-4.0, -4.9]) {
      k.cyl(g, [0.15, 0.15, 1.45, 12], z < -1 ? M.caseDark : M.steel, [x, 0.75, z]);
      k.cyl(g, [0.07, 0.11, 0.18, 10], M.brass, [x, 1.56, z]);
    }
  }
  for (const y of [0.4, 1.2]) {
    k.box(g, [1.6, 0.05, 3.4], M.darkSteel, [-4.45, y, -0.85]);
  }
  for (const [x, z] of [[-3.65, -2.5], [-5.25, -2.5], [-3.65, 0.8], [-5.25, 0.8]]) k.box(g, [0.06, 1.4, 0.06], M.darkSteel, [x, 0.7, z]);
  k.pipe(g, [[-4.0, 1.7, -2.2], [-4.0, 2.3, -2.2], [-4.0, 2.3, -2.7]], 0.04, M.copper);
  colliders.push({ lx: -4.45, lz: -0.85, hw: 0.95, hd: 1.8 });
  // THE SAMPLING COUNTER at the right: a counter on legs along the car's side, sample bottles and a manometer on it.
  k.box(g, [0.8, 0.06, 2.6], M.darkSteel, [4.9, 0.92, 1.3]);
  for (const [x, z] of [[4.6, 0.1], [5.2, 0.1], [4.6, 2.5], [5.2, 2.5]]) k.box(g, [0.05, 0.9, 0.05], M.darkSteel, [x, 0.45, z]);
  for (const z of [0.4, 0.8, 1.2]) k.cyl(g, [0.07, 0.07, 0.3, 12], M.glass, [4.8, 1.1, z]);
  k.box(g, [0.06, 0.9, 0.5], M.darkSteel, [5.25, 1.4, 2.0]);
  for (const z of [1.85, 2.15]) k.strut(g, [5.2, 1.05, z], [5.2, 1.8, z], 0.02, M.glass, 6);
  k.pipe(g, [[5.2, 1.0, 1.85], [5.2, 0.98, 2.15]], 0.02, M.glass);
  colliders.push({ lx: 4.9, lz: 1.3, hw: 0.55, hd: 1.4 });
  // A blend vessel in the right back corner, the bottles' line into it, its outlet into the header.
  k.vessel(g, 4.7, -1.8, 0.5, 1.6, M.steel);
  k.pipe(g, [[4.7, 2.6, -1.8], [4.7, 2.8, -1.8], [4.6, 2.8, -2.6], [4.6, 1.5, -2.7]], 0.05, M.steel);
  colliders.push({ lx: 4.7, lz: -1.8, r: 0.6 });
  // Lamps from the car's roof frames.
  k.pendant(g, 0, 3.4, -0.6, CEIL);
  k.pendant(g, 0, 3.8, 5.6, CEIL, { intensity: 5 });
  return done(h);
}

/* ======================================================================
   5. UNDER THE BLADDER ON ITS CRADLE (site-5, q5-speed, Speed and Escape)
   A bladder brought down onto its cradle for its skin test: its belly is the roof and its curtain the
   walls. Behind the plate a square of the bag's skin stretched in a test frame, and the leak-test header
   along the back curtain with its two effusion tubes. To the left the inflation trunk comes down out of
   the bag to its valve; to the right the bank of bottles the bag is filled from.
   ====================================================================== */

function buildCradle(w) {
  const h = start(w, 'site-5', 'bag-cradle');
  const { k, M, g, colliders } = h;
  const site = w.data.sites.find(s => s.id === 'site-5');
  const bag = BAGS.find(b => b.id === 'cradled');
  // The bag's belly over a point of the room, in the host frame (the host faces south: local x is world x).
  const ceil = (lx, lz) => bagBelly(bag, site.pos[0] + lx, site.pos[2] + lz) - site.pos[1] - 0.05;
  // THE SKIN UNDER TEST: a square of the bag's skin stretched in a frame, a test cell clamped on its face.
  k.box(g, [2.6, 0.12, 0.4], M.darkSteel, [0, 0.06, -2.75]);
  for (const x of [-1.25, 1.25]) k.box(g, [0.1, 2.2, 0.1], M.darkSteel, [x, 1.2, -2.75]);
  k.box(g, [2.6, 0.1, 0.1], M.darkSteel, [0, 2.3, -2.75]);
  k.box(g, [2.3, 1.8, 0.02], M.skin, [0, 1.25, -2.75]);
  k.cyl(g, [0.22, 0.22, 0.16, 18], M.caseDark, [0, 1.25, -2.62], [Math.PI / 2, 0, 0]);
  k.pipe(g, [[0, 1.25, -2.54], [0, 1.25, -2.3], [0.6, 1.25, -2.3], [0.6, 0.8, -2.3]], 0.025, M.copper);
  colliders.push({ lx: 0, lz: -2.75, hw: 1.35, hd: 0.25 });
  // THE LEAK-TEST HEADER along the back curtain, an effusion tube on a stand at each end of it.
  k.pipe(g, [[-5.6, 1.0, -3.05], [5.6, 1.0, -3.05]], 0.06, M.steel);
  for (const x of [-3.6, 3.6]) {
    k.box(g, [0.5, 0.08, 0.5], M.darkSteel, [x, 0.04, -2.65]);
    k.box(g, [0.08, 1.0, 0.08], M.darkSteel, [x, 0.5, -2.65]);
    k.strut(g, [x, 1.0, -2.65], [x, 2.4, -2.65], 0.07, M.glass, 12);
    k.cyl(g, [0.1, 0.1, 0.08, 12], M.darkSteel, [x, 2.4, -2.65]);
    k.cyl(g, [0.1, 0.1, 0.08, 12], M.darkSteel, [x, 1.0, -2.65]);
    k.pipe(g, [[x, 1.0, -2.65], [x, 1.0, -3.05]], 0.04, M.steel);
    colliders.push({ lx: x, lz: -2.65, r: 0.32 });
  }
  // THE INFLATION TRUNK at the left: a cloth hose down out of the bag's belly to its valve on the floor.
  {
    const x = -5.2, z = -1.2;
    const top = ceil(x, z) + 0.4;
    k.cyl(g, [0.42, 0.48, top - 0.9, 18], M.canvas, [x, 0.9 + (top - 0.9) / 2, z]);
    for (let y = 1.4; y < top - 0.3; y += 0.9) k.cyl(g, [0.5, 0.5, 0.05, 18], M.darkSteel, [x, y, z]);
    k.box(g, [1.1, 0.6, 1.1], M.darkSteel, [x, 0.3, z]);
    k.cyl(g, [0.5, 0.5, 0.3, 18], M.steel, [x, 0.75, z]);
    k.wheel(g, x + 0.75, 0.75, z, 0.16);
    k.pipe(g, [[x, 0.3, z + 0.55], [x, 0.3, 1.4], [-3.6, 0.3, 1.4]], 0.12, M.steel);
    colliders.push({ lx: x, lz: z, r: 0.75 });
    colliders.push({ lx: -4.4, lz: 1.4, hw: 0.95, hd: 0.2 });
  }
  // THE BOTTLE BANK at the right: long cylinders laid in a rack, three high, coupled to one valve.
  for (const y of [0.45, 0.95, 1.45]) {
    for (const x of [4.5, 5.15]) k.cyl(g, [0.22, 0.22, 2.8, 14], M.steel, [x, y, -1.1], [Math.PI / 2, 0, 0]);
  }
  for (const z of [-2.4, 0.2]) k.box(g, [1.6, 1.8, 0.12], M.darkSteel, [4.82, 0.9, z]);
  k.pipe(g, [[4.5, 1.45, 0.3], [4.5, 1.9, 0.6], [4.0, 1.9, 0.6], [4.0, 1.0, 0.6]], 0.04, M.brass);
  k.wheel(g, 4.0, 1.12, 0.6, 0.1);
  colliders.push({ lx: 4.82, lz: -1.1, hw: 0.85, hd: 1.45 });
  // Lamps hung from the bag's load straps.
  k.pendant(g, 0, 3.4, -0.6, ceil(0, -0.6));
  k.pendant(g, -3.6, 3.8, 3.0, ceil(-3.6, 3.0), { intensity: 5 });
  k.pendant(g, 3.6, 3.8, 3.0, ceil(3.6, 3.0), { intensity: 5 });
  return done(h);
}

/* ======================================================================
   6. THE FOOT OF THE COLD BOX (site-6, q6-real, Real Gases)
   Inside the liquefier's insulated casing, under the box's own floor. Behind the plate the three plate-fin
   heat exchanger cores, rimed at their feet. To the left the expansion turbine on its skid, the cold gas
   in from overhead; to the right the draw-off valve (the field point Quest 6 sends the player to) and a
   dewar.
   ====================================================================== */

function buildCasing(w) {
  const h = start(w, 'site-6', 'cold-box');
  const { k, M, g, colliders, fieldPoints } = h;
  const CEIL = 4.8;
  // THE CORES: three brazed blocks on a stand behind the plate, a half-round header on each face.
  k.box(g, [10.6, 0.3, 1.1], M.darkSteel, [0, 0.15, -2.75]);
  for (const [x, wdt] of [[-4.0, 1.6], [0, 1.8], [4.0, 1.6]]) {
    k.box(g, [wdt, 4.1, 0.95], M.cladding, [x, 0.3 + 2.05, -2.78], null, true);
    for (let y = 0.8; y < 4.4; y += 0.5) k.box(g, [wdt + 0.04, 0.03, 0.99], M.darkSteel, [x, y, -2.78]);
    k.cyl(g, [0.16, 0.16, 3.4, 12], M.cladding, [x - wdt * 0.3, 2.4, -2.25]);
    k.cyl(g, [0.16, 0.16, 3.4, 12], M.cladding, [x + wdt * 0.3, 2.4, -2.25]);
    k.box(g, [wdt + 0.06, 0.6, 1.0], M.rime, [x, 0.6, -2.78]);
    k.strut(g, [x - wdt * 0.3, 4.1, -2.25], [x - wdt * 0.3, CEIL, -2.25], 0.09, M.cladding);
  }
  colliders.push({ lx: 0, lz: -2.75, hw: 5.3, hd: 0.6 });
  // THE EXPANSION TURBINE at the left: a volute on a skid, its brake fan, the cold gas in from overhead.
  k.box(g, [1.6, 0.4, 2.2], M.darkSteel, [-4.9, 0.2, 0.6]);
  k.cyl(g, [0.55, 0.55, 0.7, 20], M.steel, [-4.9, 1.0, 0.2], [Math.PI / 2, 0, 0], true);
  k.cyl(g, [0.3, 0.38, 0.9, 16], M.steel, [-4.9, 1.0, 0.95], [Math.PI / 2, 0, 0]);
  k.cyl(g, [0.45, 0.45, 0.12, 16], M.darkSteel, [-4.9, 1.0, 1.45], [Math.PI / 2, 0, 0]);
  k.pipe(g, [[-4.9, 1.55, 0.2], [-4.9, CEIL - 0.2, 0.2], [-4.9, CEIL - 0.2, -2.2]], 0.14, M.insul);
  k.pipe(g, [[-5.45, 1.0, 0.2], [-5.9, 1.0, 0.2], [-5.9, 1.0, -2.0], [-4.9, 1.0, -2.2]], 0.12, M.insul);
  k.cyl(g, [0.18, 0.18, 0.9, 12], M.rime, [-5.9, 1.0, -0.9], [Math.PI / 2, 0, 0]);
  colliders.push({ lx: -5.1, lz: -0.2, hw: 1.05, hd: 1.9 });
  // THE DRAW-OFF at the right: the liquid's valve on its stand, piped from the core (a field point).
  {
    const PX = 3.5, PZ = -1.5;
    k.box(g, [0.5, 0.06, 0.5], M.darkSteel, [PX, 0.03, PZ - 0.05]);
    k.cyl(g, [0.06, 0.06, 1.1, 10], M.darkSteel, [PX, 0.6, PZ - 0.1]);
    k.cyl(g, [0.14, 0.14, 0.32, 14], M.brass, [PX, 1.22, PZ - 0.1], [0, 0, Math.PI / 2]);
    k.cyl(g, [0.04, 0.04, 0.26, 8], M.brass, [PX, 1.12, PZ + 0.1], [Math.PI / 2, 0, 0]);
    k.wheel(g, PX, 1.5, PZ - 0.1, 0.1);
    k.pipe(g, [[PX, 1.3, PZ - 0.2], [PX, 1.3, -2.2]], 0.05, M.insul);
    k.cyl(g, [0.09, 0.09, 0.3, 10], M.rime, [PX, 1.3, PZ - 0.45], [Math.PI / 2, 0, 0]);
    colliders.push({ lx: PX, lz: PZ - 0.1, hw: 0.3, hd: 0.3 });
    fieldPoints.push({ id: 'drawoff', label: 'Cold Draw-off', lx: PX, ly: 1.2, lz: PZ, half: [0.4, 0.5, 0.35], stand: { lx: PX, lz: PZ + 1.4 } });
  }
  // A dewar on the floor at the right, its neck rimed.
  k.vessel(g, 5.3, 1.3, 0.6, 1.1, M.insul);
  k.cyl(g, [0.16, 0.16, 0.3, 12], M.rime, [5.3, 2.1, 1.3]);
  colliders.push({ lx: 5.3, lz: 1.3, r: 0.7 });
  // Lamps hung from the box's floor beams.
  k.pendant(g, 0, 3.4, -0.6, CEIL);
  k.pendant(g, -3.6, 3.7, 3.4, CEIL, { intensity: 5 });
  k.pendant(g, 3.6, 3.7, 3.4, CEIL, { intensity: 5 });
  return done(h);
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildSkirt,
  'site-2': buildHall,
  'site-3': buildHolderMeter,
  'site-4': buildGondola,
  'site-5': buildCradle,
  'site-6': buildCasing
};
