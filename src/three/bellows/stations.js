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
   PLACEHOLDER (phase 2): the bench, a lamp over it and a box where the host's machinery will stand
   ====================================================================== */

function placeholder(siteId) {
  return w => {
    const h = start(w, siteId, `host-${siteId}`);
    h.k.pendant(h.g, 0, 3.4, -0.6, 5.0);
    h.k.box(h.g, [3, 2, 1.2], w.M.darkSteel, [0, 1, -2.6]);
    h.colliders.push({ lx: 0, lz: -2.6, hw: 1.5, hd: 0.6 });
    return done(h);
  };
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': placeholder('site-1'),
  'site-2': placeholder('site-2'),
  'site-3': buildHolderMeter,
  'site-4': placeholder('site-4'),
  'site-5': placeholder('site-5'),
  'site-6': placeholder('site-6')
};
