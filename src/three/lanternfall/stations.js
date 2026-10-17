/**
 * lanternfall/stations.js — The nine hosts: the pieces of the aurora expedition a Learn bench is built into.
 *
 * A bench on Lanternfall is not a bench in a hut. It is a working point of the observatory camp on the
 * ice: the wave flume at the lake's edge, the photocell housing at the foot of an aurora mast, the
 * spectrograph sled with its tailgate down, the ice crawler's lab module with its doors open, the two
 * faces of the camp's records board under one tent, the detector arc on a mast platform, the sample-tile
 * racks in the store, and the cuvette sled by the hole cut through the lake. Each builder here returns
 * the machine AND its bench as ONE object, so the overlap rule (which exempts a body's own parts) lets
 * the bench be bolted to the thing it belongs to, and the bay contract (`bench-bay.js`) keeps the volume
 * the plate, the instrument, the screens and the camera need empty of it.
 *
 * THE HOST FRAME. Origin on the ice under the middle of the plate; +z is the front (toward the ground
 * the player walks in from), +x to the player's right. The world places the group at `site.pos`, turned
 * by `siteFacing(site)`. Every builder keeps to the bay by construction:
 *
 *   |x| < 2.7, z in [-1.95, 0.65]      nothing from the floor up to 2.4 m (plate, instrument, screens)
 *   |x| < 2.4, z in [0.65, 5.05]       nothing from 0.3 to 2.2 m (where the player and camera stand)
 *
 * so machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m (a tent's
 * roof, a lamp boom). `verify:bench` measures all of it, and `verify:lanternfall` measures that no host
 * stands outside the extent `host-plan.js` declares for it.
 *
 * ONLY LAMPS ARE LIT. A host's work lamp is a `lampMark` the world pools (`lamp-pool.js`) and a fixture
 * of the one amber material; nothing here owns a PointLight.
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the instrument, cased up.
 * Pressing [E] hides the case and deploys the stations on the same plate: one object, two states. The
 * case is the one clean, bright thing on a camp of frosted, weathered steel (`M.case`).
 *
 * @returns {{ group: THREE.Group, bench: object, benchLocal: number[], colliders: object[] }}
 *   `colliders` are host-local: `{ lx, lz, r }` discs and `{ lx, lz, hw, hd }` boxes
 *   (half sizes along the host's x and z). The world turns them to its own frame.
 */

import * as THREE from 'three';
import { BENCH_BAY, buildBayBench, ctxMats } from '../bench-bay.js';
import { placard } from '../materials/pbr-kit.js';
import { buildAuroraMast, buildCamp } from './props.js';
import { HOST_PLAN, WATER_HOLE } from './host-plan.js';

/** Where the bench stands in an older, shelter-style site frame. Hosts stand it at their own origin. */
export const BENCH_Z = BENCH_BAY.benchZ;

const LANTERN = 0xd99423;
const Y = new THREE.Vector3(0, 1, 0);

/* ======================================================================
   THE BENCH — the shared bay bench, its cased instrument dressed for the kind
   ====================================================================== */

/** The bench: the shared bay bench in the host's skin, its dormant slot dressed for `kind`. */
export function buildLfBench(ctx, { kind = 'light', plate = 'BN-01', skin = 'shelf' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    return m;
  };
  return buildBayBench(ctx, {
    skin,
    plate,
    mats: ctxMats(ctx),
    tagStyle: { fg: '#1d2a33', bg: '#cfe0e8' },
    dormant(dormant, { height }) {
      // THE ONE CLEAN THING. The camp is frosted and weathered; the cased instrument is the thing
      // somebody uses, so it keeps its own bright paint and its own bare metal.
      const housing = mesh(new THREE.BoxGeometry(1.15, 0.78, 0.52), kind === 'rack' ? M.caseDark : M.case, 0, height + 0.43, -0.16);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);

      if (kind === 'light') {
        // A lamp housing and a slit: a bench for light has a lamp and a slot.
        const lamp = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 20), M.caseDark, -0.28, height + 0.5, 0.14);
        lamp.rotation.x = Math.PI / 2;
        dormant.add(lamp);
        dormant.add(mesh(new THREE.CircleGeometry(0.135, 20), M.glassDark, -0.28, height + 0.5, 0.205));
        dormant.add(mesh(new THREE.BoxGeometry(0.34, 0.03, 0.02), M.caseDark, 0.22, height + 0.5, 0.11));
        dormant.add(mesh(new THREE.BoxGeometry(0.34, 0.03, 0.02), M.caseDark, 0.22, height + 0.38, 0.11));
      } else if (kind === 'cloud') {
        // A glass block on a plinth: the cloud plate's own shape.
        dormant.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 8), M.caseDark, 0, height + 0.5, 0.12));
        dormant.add(mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), M.glass, 0, height + 0.72, 0.12));
      } else if (kind === 'rack') {
        // A board of milled boxes, each a dark square, and the tray under it.
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 5 - (r % 2); c++) {
            dormant.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.012), M.glassDark, -0.38 + c * 0.17 + (r % 2) * 0.085, height + 0.28 + r * 0.16, 0.1));
          }
        }
      } else {
        // Rings of an atom, standing on a spindle: the electron bench's shape.
        for (const [rad, rot] of [[0.12, 0], [0.2, 0.7], [0.28, 1.4]]) {
          const ring = mesh(new THREE.TorusGeometry(rad, 0.012, 6, 28), M.caseDark, 0, height + 0.52, 0.12);
          ring.rotation.set(Math.PI / 2 + rot * 0.15, 0, rot);
          dormant.add(ring);
        }
        dormant.add(mesh(new THREE.SphereGeometry(0.035, 10, 8), M.case, 0, height + 0.52, 0.12));
      }
    }
  });
}

/* ======================================================================
   THE PARTS KIT
   Small, local, and the same few verbs everywhere: a box, a cylinder, a round
   bar between two points, a cable, a pipe, a footed column, a work lamp.
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

  /** A cable or hose along a curve through `pts`. */
  const cable = (g, pts, r, mat = M.rubber) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(own(new THREE.TubeGeometry(curve, Math.max(8, pts.length * 6), r, 6, false)), mat);
    g.add(m);
    return m;
  };

  /** A pipe run through a list of points: a bar between each pair, a ball at each corner. */
  const pipe = (g, pts, r, mat) => {
    for (let i = 0; i < pts.length - 1; i++) strut(g, pts[i], pts[i + 1], r, mat, 10);
    for (let i = 1; i < pts.length - 1; i++) {
      const e = new THREE.Mesh(own(new THREE.SphereGeometry(r * 1.02, 10, 8)), mat);
      e.position.set(...pts[i]);
      g.add(e);
    }
  };

  /** A bolted base plate on a poured footing (the footing is flush with the ice). */
  const footing = (g, x, z, size = 0.34) => {
    box(g, [size + 0.2, 0.18, size + 0.2], M.footing, [x, -0.07, z]);
    box(g, [size, 0.03, size], M.darkSteel, [x, 0.025, z]);
  };

  /** A square post stood on a footing: from the ice to `top`. */
  const post = (g, x, z, top, s = 0.14, mat = M.darkSteel) => {
    footing(g, x, z, Math.max(0.28, s + 0.14));
    box(g, [s, top - 0.04, s], mat, [x, 0.04 + (top - 0.04) / 2, z], null, true);
  };

  /** A stencilled tag set flat on a surface. */
  const tag = (g, text, size, p, ry = 0) => {
    const t = placard(text, { fg: '#1d2a33', bg: '#cfe0e8', ...size });
    t.position.set(...p);
    t.rotation.y = ry;
    g.add(t);
    own(t.geometry, t.material, t.material.map);
  };

  /** The work lantern over a bench: a pooled lamp mark and its amber fixture. */
  const lamp = (g, x, y, z, { intensity = 9, distance = 12 } = {}) => {
    const mark = new THREE.Object3D();
    mark.position.set(x, y, z);
    mark.userData.lamp = { color: LANTERN, intensity, distance, decay: 1.7 };
    g.add(mark);
    w.lamps.push(mark);
    box(g, [0.4, 0.1, 0.2], M.lantern, [x, y + 0.12, z]);
  };

  /** A lamp on a mast with an arm that reaches out to hold it over the bench. */
  const lampMast = (g, x, z, { h = 3.6, arm = [0, 0], at = null } = {}) => {
    footing(g, x, z, 0.3);
    cyl(g, [0.045, 0.06, h, 10], M.darkSteel, [x, h / 2, z], null, true);
    if (arm[0] || arm[1]) strut(g, [x, h - 0.05, z], [x + arm[0], h - 0.05, z + arm[1]], 0.035, M.darkSteel);
    lamp(g, x + arm[0], h - 0.12 - 0.12, z + arm[1], at || {});
  };

  return { box, cyl, strut, cable, pipe, footing, post, tag, lamp, lampMast, shade, own, t4 };
}

/* ======================================================================
   1. THE WAVE FLUME — on the shore of the lake (shelf)
   A long steel trough with a glass front, a paddle at the east end and a beach
   at the west, filled from the lake by a pump. The strobe over it freezes the
   ripples; the bench is its observation shelf. The player reads the flume's
   scale, does not enter it.
   ====================================================================== */

export function buildWaveTank(w, site) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'wave-tank';
  const bench = buildLfBench(w.ctx, { kind: 'light', plate: HOST_PLAN['site-1'].plate, skin: HOST_PLAN['site-1'].skin });
  g.add(bench.group);

  const Z0 = -4.0;       // the flume's centreline
  // The trestles under it, and their stretchers.
  for (const x of [-5.2, -2.6, 0, 2.6, 5.2]) {
    for (const z of [Z0 - 1.25, Z0 + 1.25]) k.box(g, [0.12, 0.85, 0.12], M.darkSteel, [x, 0.425, z]);
    k.box(g, [0.1, 0.1, 2.7], M.darkSteel, [x, 0.8, Z0]);
  }
  // The trough: floor, back, ends, a glass front under a gutter lip, and the water in it.
  k.box(g, [11.6, 0.1, 3.0], M.steel, [0, 0.9, Z0], null, true);
  k.box(g, [11.6, 0.55, 0.08], M.steel, [0, 1.225, Z0 - 1.46], null, true);
  for (const sx of [-1, 1]) k.box(g, [0.08, 0.55, 3.0], M.steel, [sx * 5.76, 1.225, Z0], null, true);
  k.box(g, [11.6, 0.5, 0.05], M.glass, [0, 1.2, Z0 + 1.46]);
  k.box(g, [11.6, 0.05, 0.12], M.darkSteel, [0, 1.5, Z0 + 1.46]);
  k.box(g, [11.4, 0.02, 2.9], M.glass, [0, 1.34, Z0]);
  // The ruler along the gutter: a tick every 45 cm.
  for (let i = 0; i < 26; i++) k.box(g, [0.015, i % 5 === 0 ? 0.09 : 0.05, 0.015], M.darkSteel, [-5.6 + i * 0.45, 1.55, Z0 + 1.5]);

  // The paddle at the east end, its crank and the motor that turns it.
  k.box(g, [0.06, 0.5, 2.8], M.darkSteel, [5.35, 1.18, Z0]);
  k.strut(g, [5.4, 1.3, Z0], [6.45, 1.3, Z0], 0.035, M.darkSteel);
  k.box(g, [0.8, 0.6, 0.8], M.darkSteel, [6.9, 1.1, Z0], null, true);
  k.cyl(g, [0.1, 0.1, 0.12, 12], M.steel, [6.45, 1.3, Z0], [0, 0, Math.PI / 2]);
  k.tag(g, 'FLUME 1', { w: 0.5, h: 0.19 }, [6.9, 1.1, Z0 + 0.41]);
  // The beach at the west end: a mesh ramp that eats the wave, so it does not come back.
  k.box(g, [1.7, 0.08, 2.8], M.darkSteel, [-4.85, 1.2, Z0], [0, 0, -0.33]);

  // The strobe gantry over it: two posts, a beam, the strobe head, and the boom that carries
  // the work lantern forward over the bench (above the work volume, 3.4 m up).
  for (const sx of [-1, 1]) k.post(g, sx * 6.3, Z0, 3.4, 0.14);
  k.box(g, [12.8, 0.14, 0.14], M.darkSteel, [0, 3.4, Z0]);
  k.box(g, [0.7, 0.3, 0.4], M.caseDark, [-2.4, 3.1, Z0]);
  k.cyl(g, [0.12, 0.12, 0.1, 16], M.glassDark, [-2.4, 2.93, Z0], [0, 0, 0]);
  k.box(g, [0.1, 0.1, 4.6], M.darkSteel, [0.5, 3.4, Z0 + 2.3 - 0.3]);
  k.lamp(g, 0.5, 3.2, 0.3);

  // The intake: a pump on the shore side and its pipe into the lake.
  k.cyl(g, [0.3, 0.3, 0.8, 14], M.darkSteel, [-4.8, 0.45, -6.6], null, true);
  k.pipe(g, [[-4.8, 0.9, Z0 - 1.5], [-4.8, 0.55, -5.9]], 0.07, M.darkSteel);
  k.pipe(g, [[-4.8, 0.45, -7.0], [-4.8, 0.2, -9.0]], 0.09, M.darkSteel);
  // Ice blocks cut to make the berm the pump stands in.
  for (const [x, z, s, r] of [[2.4, -7.4, 1.0, 0.3], [3.7, -7.9, 0.8, -0.4], [0.9, -8.2, 0.7, 0.8]]) {
    k.box(g, [1.2 * s, 0.6 * s, 0.9 * s], M.carved, [x, 0.3 * s, z], [0, r, 0], true);
  }

  // THE CREST RECORDER: a chart recorder on a post in front of the flume's gutter, its pen riding a float in the water through a slot in
  // the glass and drawing the surface on a paper strip. The strip it feeds out is the field point: `[E]` takes a length of the chart, and
  // the same wave, drawn in water, is on the bench's table. A real piece of this host, to the right of the bay.
  {
    const RX = 3.7, RZ = -2.2;
    k.footing(g, RX, RZ, 0.3);
    k.cyl(g, [0.04, 0.05, 0.85, 8], M.darkSteel, [RX, 0.46, RZ], null, true);
    k.box(g, [0.62, 0.34, 0.34], M.caseDark, [RX, 1.08, RZ], null, true);
    k.box(g, [0.48, 0.1, 0.02], M.paper, [RX, 1.0, RZ + 0.18]);            // the strip, fed out of the case's lip
    k.box(g, [0.5, 0.012, 0.16], M.paper, [RX, 0.93, RZ + 0.27], [-0.5, 0, 0]);
    k.strut(g, [RX, 1.2, RZ - 0.17], [RX, 1.55, Z0 + 1.2], 0.018, M.darkSteel);   // the arm to the float in the water
    k.cyl(g, [0.07, 0.07, 0.05, 10], M.steel, [RX, 1.36, Z0 + 1.2]);
    k.tag(g, 'CHART 1', { w: 0.42, h: 0.16 }, [RX, 1.14, RZ + 0.18]);
  }
  const fieldPoints = [{
    id: 'flume', label: 'Flume Strip', lx: 3.7, ly: 1.0, lz: -2.0, half: [0.42, 0.4, 0.4],
    stand: { lx: 4.1, lz: -1.0 }
  }];

  const colliders = [
    { lx: 0, lz: Z0, hw: 5.95, hd: 1.6 },
    { lx: 6.9, lz: Z0, hw: 0.45, hd: 0.45 },
    { lx: -6.3, lz: Z0, r: 0.25 }, { lx: 6.3, lz: Z0, r: 0.25 },
    { lx: -4.8, lz: -6.6, r: 0.42 },
    { lx: 3.7, lz: -2.2, hw: 0.4, hd: 0.25 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

/* ======================================================================
   2. THE PHOTOCELL HOUSING — at the foot of an aurora mast (desk)
   The watch mast carries a sensor at its head and a cable down to this housing,
   where the cell and its optics are kept out of the wind. A lens tube points at
   the sky; the bench is the desk the housing's readout is read from.
   ====================================================================== */

export function buildPhotocellMast(w, site) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'photocell-mast';
  const bench = buildLfBench(w.ctx, { kind: 'light', plate: HOST_PLAN['site-2'].plate, skin: HOST_PLAN['site-2'].skin });
  g.add(bench.group);

  // The mast itself: the same lattice as the camp's other watch masts, stood behind the desk.
  const mast = buildAuroraMast(w.ctx);
  mast.position.set(0, 0, -4.9);
  g.add(mast);

  // The housing bolted to the mast's foot: a cabinet on a plinth, a mounting plate behind it, the
  // lens tube tilted at the sky with its hood, and the shutter box on the tube.
  k.box(g, [1.9, 0.2, 1.1], M.footing, [0, 0.1, -3.35]);
  k.box(g, [1.7, 1.35, 0.9], M.darkSteel, [0, 0.87, -3.35], null, true);
  k.box(g, [1.2, 1.0, 0.06], M.steel, [0, 1.05, -4.1]);
  const tube = k.cyl(g, [0.15, 0.15, 1.4, 16], M.darkSteel, [0, 2.05, -3.0], [0.72, 0, 0], true);
  tube.name = 'lens-tube';
  const hood = k.cyl(g, [0.3, 0.19, 0.42, 16], M.darkSteel, [0, 2.55, -2.6], [0.72, 0, 0]);
  hood.userData.openShell = true;
  k.box(g, [0.34, 0.3, 0.3], M.caseDark, [0, 1.75, -3.2], [0.72, 0, 0]);
  k.tag(g, 'PHOTO 2', { w: 0.5, h: 0.19 }, [0, 0.95, -2.89]);
  // The cable that comes down the mast leg from the sensor at its head.
  k.cable(g, [[-0.62, 1.4, -3.55], [-0.92, 2.6, -4.15], [-0.62, 6.0, -4.3]], 0.025);

  // The battery cabinet on the right, with a conduit across the ice to the housing.
  k.box(g, [0.8, 1.4, 0.7], M.steel, [4.3, 0.7, -1.2], null, true);
  for (let i = 0; i < 4; i++) k.box(g, [0.5, 0.025, 0.02], M.darkSteel, [4.3, 0.45 + i * 0.12, -0.84]);
  k.pipe(g, [[4.3, 0.2, -1.55], [4.3, 0.12, -3.35], [0.95, 0.12, -3.35]], 0.04, M.darkSteel);

  // A photometer on a tripod on the left, for checking the housing against a lamp of known output.
  const tx = -4.2, tz = -1.5;
  for (const a of [0.4, 2.5, 4.6]) {
    k.strut(g, [tx, 1.35, tz], [tx + Math.cos(a) * 0.65, 0.02, tz + Math.sin(a) * 0.65], 0.025, M.darkSteel);
  }
  k.box(g, [0.34, 0.26, 0.26], M.caseDark, [tx, 1.48, tz]);
  k.cyl(g, [0.07, 0.07, 0.2, 12], M.glassDark, [tx, 1.48, tz + 0.2], [Math.PI / 2, 0, 0]);

  // THE PLATE CASE on a trestle beside the desk: the three metal plates the photocell is loaded with, each standing in its slot, a
  // lid thrown back. The table's plates are these; the case is outside the bay, to the right of the desk.
  {
    const CX = 3.4, CZ = -0.4;
    for (const dx of [-0.3, 0.3]) k.box(g, [0.08, 0.8, 0.5], M.darkSteel, [CX + dx, 0.4, CZ]);
    k.box(g, [0.9, 0.1, 0.5], M.caseDark, [CX, 0.85, CZ], null, true);
    k.box(g, [0.9, 0.5, 0.05], M.caseDark, [CX, 1.15, CZ - 0.25], [-0.25, 0, 0]);
    [0x9aa3a8, 0xc6a24a, 0xb9bcc0].forEach((c, i) => {
      const plate = new THREE.Mesh(w.own(new THREE.BoxGeometry(0.18, 0.2, 0.02)), w.own(new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.8 })));
      plate.position.set(CX - 0.28 + i * 0.28, 1.0, CZ);
      g.add(plate);
    });
  }

  // The work lantern, hung from the mast on a boom that reaches over the desk.
  k.box(g, [0.1, 0.1, 4.6], M.darkSteel, [0.5, 3.45, -1.9]);
  k.lamp(g, 0.5, 3.25, 0.3);

  const colliders = [
    { lx: 3.4, lz: -0.4, hw: 0.5, hd: 0.3 },
    { lx: 0, lz: -4.9, hw: 0.95, hd: 0.95 },
    { lx: 0, lz: -3.35, hw: 0.95, hd: 0.55 },
    { lx: 4.3, lz: -1.2, hw: 0.42, hd: 0.38 },
    { lx: tx, lz: tz, r: 0.55 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   3. THE SPECTROGRAPH SLED — in camp 1 (shelf)
   The camp's spectrograph travels on a sled: slit, collimator, prism, camera.
   At a halt the tailgate is dropped and the bench is set to its front. The spectrum
   card pinned on the camera back is the one coloured thing in the camp.
   ====================================================================== */

export function buildSpectrographSled(w, site) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'spectrograph-sled';
  const bench = buildLfBench(w.ctx, { kind: 'light', plate: HOST_PLAN['site-3'].plate, skin: HOST_PLAN['site-3'].skin });
  g.add(bench.group);

  // The sled: two runners with turned-up noses, a bed on bearers, and the dropped tailgate.
  for (const sx of [-1, 1]) {
    k.box(g, [0.2, 0.18, 4.6], M.timber, [sx * 2.5, 0.12, -4.6], null, true);
    k.box(g, [0.2, 0.18, 0.7], M.timber, [sx * 2.5, 0.3, -7.05], [0.5, 0, 0]);
    for (const z of [-3.0, -4.6, -6.2]) k.box(g, [0.14, 0.2, 0.14], M.darkSteel, [sx * 2.5, 0.31, z]);
  }
  for (const z of [-3.0, -4.6, -6.2]) k.box(g, [5.4, 0.12, 0.18], M.timber, [0, 0.4, z]);
  k.box(g, [5.6, 0.1, 4.4], M.steel, [0, 0.5, -4.6], null, true);
  // The tailgate, hinged on the front edge and let down to the ice, held by its chains.
  k.box(g, [5.0, 0.05, 0.45], M.timber, [0, 0.27, -2.2], [0.55, 0, 0]);
  for (const sx of [-1, 1]) k.strut(g, [sx * 2.5, 0.52, -2.4], [sx * 2.5, 0.42, -2.0], 0.012, M.darkSteel);

  // The spectrograph on the bed: slit box, collimator tube, prism table, camera on a bellows.
  k.box(g, [0.5, 0.5, 0.5], M.caseDark, [-2.35, 0.8, -3.6]);
  k.cyl(g, [0.16, 0.16, 2.2, 16], M.darkSteel, [-1.0, 0.9, -3.6], [0, 0, Math.PI / 2], true);
  const shape = new THREE.Shape();
  shape.moveTo(-0.42, 0); shape.lineTo(0.42, 0); shape.lineTo(0, 0.72); shape.closePath();
  const prism = new THREE.Mesh(w.own(new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false })), M.glass);
  prism.rotation.x = 0;
  prism.position.set(0.6, 0.94, -3.85);
  g.add(prism);
  k.box(g, [1.0, 0.1, 0.9], M.darkSteel, [0.6, 0.6, -3.6]);
  for (let i = 0; i < 4; i++) k.box(g, [0.5 - i * 0.06, 0.5 - i * 0.06, 0.3], M.canvas, [1.75 + i * 0.3, 0.88, -3.6]);
  k.box(g, [0.6, 0.6, 0.6], M.caseDark, [2.75, 0.88, -3.6]);
  // The spectrum card on the camera's back: seven muted bands, the colours a prism spreads.
  const bands = [0x6a4a8f, 0x4a5f9f, 0x3f8f7a, 0x6a9a4a, 0xb0993f, 0xb06a3a, 0xa04a4a];
  w.bandMats = w.bandMats || bands.map(c => w.own(new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })));
  w.bandMats.forEach((m, i) => k.box(g, [0.05, 0.4, 0.06], m, [2.55 + i * 0.075, 0.9, -3.28]));
  // The cover, half drawn over the camera end, and the lashing straps.
  k.box(g, [1.8, 0.7, 1.5], M.tarp, [2.2, 1.05, -5.6]);
  for (const sx of [-1, 1]) k.box(g, [0.04, 0.05, 4.2], M.rubber, [sx * 2.0, 0.58, -4.6]);

  // THE TUBE RACK on the bed in front of the slit box: four gas tubes in a wooden rack and the spare filament lamp, the sources the
  // spectrograph's socket takes.
  k.box(g, [1.1, 0.06, 0.3], M.timber, [-1.5, 0.58, -2.75]);
  for (let i = 0; i < 4; i++) k.cyl(g, [0.035, 0.035, 0.36, 8], M.glass, [-1.9 + i * 0.27, 0.79, -2.75]);
  k.cyl(g, [0.07, 0.07, 0.12, 12], M.caseDark, [-0.78, 0.65, -2.75]);

  // Camp 1 round it: two tents, a drum and a crate left where they were set down.
  const camp = buildCamp(w.ctx, 0.3, 11);
  camp.position.set(9.0, 0, -4.0);
  g.add(camp);

  // The work lantern, on a post at the sled's front corner with an arm over the bench.
  k.lampMast(g, -3.2, -2.3, { h: 3.5, arm: [3.2, 2.4] });

  const colliders = [
    { lx: 0, lz: -4.6, hw: 3.0, hd: 2.4 },
    { lx: 9.0 - 1.15, lz: -4.0 - 0.4, r: 1.2 }, { lx: 9.0 + 1.05, lz: -4.0 + 0.5, r: 1.0 }, { lx: 9.0 + 0.2, lz: -4.0 - 1.25, r: 0.4 },
    { lx: -3.2, lz: -2.3, r: 0.25 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   4. THE CRAWLER'S LAB MODULE — doors open (desk)
   The camp's tracked crawler, sunk to its axles, is also its field lab: the
   module on its rear deck is fitted with a bench, shelves, a stove and a lamp.
   Its floor is level with the bench plate, and its doors stand open flat against
   its sides, so the module opens straight onto the bench.
   ====================================================================== */

export function buildCrawlerLab(w, site) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'crawler-lab';
  const bench = buildLfBench(w.ctx, { kind: 'cloud', plate: HOST_PLAN['site-4'].plate, skin: HOST_PLAN['site-4'].skin });
  g.add(bench.group);

  // Tracks, road wheels and the hull between them.
  for (const sx of [-1, 1]) {
    k.box(g, [0.95, 1.0, 8.2], M.darkSteel, [sx * 2.55, 0.5, -6.2], null, true);
    for (let i = 0; i < 7; i++) k.cyl(g, [0.4, 0.4, 0.12, 14], M.steel, [sx * 3.08, 0.5, -2.8 - i * 1.1], [0, 0, Math.PI / 2]);
  }
  k.box(g, [3.9, 0.8, 8.0], M.steel, [0, 0.55, -6.1], null, true);

  // The lab module on the rear deck: floor level with the plate, three walls, a roof, an open front.
  k.box(g, [4.2, 0.08, 3.4], M.darkSteel, [0, 0.96, -3.8]);
  k.box(g, [4.2, 2.5, 0.1], M.steel, [0, 2.25, -5.45], null, true);
  for (const sx of [-1, 1]) k.box(g, [0.1, 2.5, 3.4], M.steel, [sx * 2.1, 2.25, -3.8], null, true);
  k.box(g, [4.5, 0.12, 3.7], M.steel, [0, 3.56, -3.75], null, true);
  k.box(g, [4.2, 0.3, 0.1], M.darkSteel, [0, 3.3, -2.15]);
  for (const sx of [-1, 1]) {
    k.box(g, [0.12, 2.3, 0.12], M.darkSteel, [sx * 1.95, 2.15, -2.15]);
    // The doors, swung through half a turn and lying flat against the module's sides.
    k.box(g, [0.05, 2.25, 1.0], M.steel, [sx * 2.2, 2.2, -2.7]);
    k.cyl(g, [0.04, 0.04, 2.2, 8], M.darkSteel, [sx * 2.2, 2.2, -2.2]);
  }
  k.tag(g, 'LAB 4', { w: 0.5, h: 0.19 }, [0, 3.0, -2.09]);

  // What is in it: a bench along the back with its apparatus, shelves of sample boxes on the
  // side walls, a stove with a stack through the roof, a chart board.
  k.box(g, [3.6, 0.85, 0.6], M.darkSteel, [0, 1.43, -5.1]);
  k.box(g, [3.7, 0.05, 0.66], M.timber, [0, 1.88, -5.1]);
  k.box(g, [0.9, 0.5, 0.4], M.caseDark, [-1.0, 2.15, -5.1]);
  k.cyl(g, [0.12, 0.12, 0.4, 12], M.glass, [0.6, 2.1, -5.05]);
  k.box(g, [0.5, 0.35, 0.4], M.case, [1.3, 2.05, -5.1]);
  for (const sx of [-1, 1]) {
    for (const y of [1.9, 2.5]) {
      k.box(g, [0.4, 0.05, 2.4], M.timber, [sx * 1.85, y, -3.8]);
      for (let i = 0; i < 5; i++) k.box(g, [0.26, 0.2, 0.34], M.canvas, [sx * 1.85, y + 0.125, -4.8 + i * 0.45]);
    }
  }
  k.box(g, [1.6, 0.9, 0.04], M.paper, [0.6, 2.8, -5.38]);
  k.cyl(g, [0.22, 0.22, 0.8, 14], M.darkSteel, [-1.0, 1.4, -4.5], null, true);
  k.cyl(g, [0.06, 0.06, 3.8, 10], M.darkSteel, [-1.0, 2.9, -4.5]);
  k.lamp(g, 0, 3.15, -3.9, { intensity: 6, distance: 9 });

  // The cab, the cargo on the deck between, the whip antenna, and the drift over the far end.
  k.box(g, [2.6, 1.5, 2.2], M.steel, [0, 1.7, -9.0], null, true);
  k.box(g, [2.0, 0.5, 0.03], M.glassDark, [0, 2.0, -7.88]);
  for (const [x, z] of [[-1.0, -6.9], [1.0, -6.9], [0, -7.4]]) k.cyl(g, [0.3, 0.3, 0.8, 14], M.darkSteel, [x, 1.35, z], null, true);
  k.strut(g, [1.9, 3.62, -5.4], [1.9, 6.4, -5.4], 0.02, M.darkSteel);
  k.box(g, [0.9, 0.04, 0.04], M.darkSteel, [1.9, 6.0, -5.4]);
  const drift = new THREE.Mesh(w.own(new THREE.SphereGeometry(3.2, 10, 6)), M.snow);
  drift.scale.set(1.0, 0.3, 0.7);
  drift.position.set(-0.4, 0, -9.0);
  g.add(drift);

  // The work lantern, on a boom out of the module's roof over the bench.
  k.box(g, [0.1, 0.1, 3.0], M.darkSteel, [0, 3.45, -1.0]);
  k.lamp(g, 0, 3.22, 0.3);

  const colliders = [
    { lx: 0, lz: -6.2, hw: 3.15, hd: 4.25 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   5 AND 6. THE RECORDS TENT — one ridge, a board with two faces
   Two benches back to back under one ridge (`TENT_SPAN` apart, bench to bench). Each builder makes its
   half: the canopy from the ridge forward to an eave that stops at the plate's own line, the side walls,
   and the board's face toward its bench. The halves meet at the ridge (z = -3.5, the same line in the
   world from both) and at the board's spine. THE CANOPY ENDS AT THE PLATE (z 0.5), because a player
   leaned in over the table has the camera 2 m in front of it and 3 to 4 m up, and a roof over that air
   is a roof over the camera (plan `bench-tabletop.md` §2.6): the tent is open at its mouth, the bench
   stands in the doorway, and the lamp hangs from the eave over the plate.
   Bench 5's face is a wall board of milled boxes in ladder rows; bench 6's is a ladder of shelves with
   a token on each.
   ====================================================================== */

function buildRecordsHalf(w, site, planId) {
  const k = kitFor(w);
  const M = w.M;
  const first = planId === 'site-5';
  const g = new THREE.Group();
  g.name = first ? 'records-tent-south' : 'records-tent-north';
  const bench = buildLfBench(w.ctx, { kind: 'rack', plate: HOST_PLAN[planId].plate, skin: HOST_PLAN[planId].skin });
  g.add(bench.group);

  // THE CANOPY: a roof panel rising from the eave (z 0.5, 3.3 m) to the ridge (z -3.5, 4.2 m),
  // with rafters under it, a ridge beam and an eave beam, and a post at each corner. It ends at the
  // plate's line, so nothing of it stands over the lean-in camera's air in front of the plate.
  const EAVE = 0.5;
  const RUN = EAVE + 3.5;
  const slope = Math.atan2(0.9, RUN);
  const len = Math.hypot(RUN, 0.9);
  const midZ = (EAVE - 3.5) / 2;
  k.box(g, [11.0, 0.05, len], M.tarp, [0, 3.75, midZ], [slope, 0, 0]);
  for (let i = -3; i <= 3; i++) k.box(g, [0.08, 0.1, len], M.darkSteel, [i * 1.55, 3.69, midZ], [slope, 0, 0]);
  k.box(g, [11.0, 0.14, 0.14], M.darkSteel, [0, 4.14, -3.45]);
  k.box(g, [11.0, 0.12, 0.12], M.darkSteel, [0, 3.25, EAVE - 0.06]);
  for (const sx of [-1, 1]) {
    k.post(g, sx * 5.3, EAVE - 0.1, 3.3, 0.14);
    k.post(g, sx * 5.3, -3.3, 4.2, 0.14);
    // The side walls: canvas hung from the eave, so the tent is open at its mouth.
    k.box(g, [0.05, 3.1, 3.7], M.tarp, [sx * 5.3, 1.6, (EAVE - 0.1 - 3.3) / 2]);
  }

  // THE BOARD: two panels on a frame, 0.9 m between them. This half builds the face toward its
  // bench and its half of the back; the other half builds the other.
  k.box(g, [5.4, 2.3, 0.06], M.darkSteel, [0, 1.55, -2.62]);
  k.box(g, [5.4, 2.3, 0.06], M.darkSteel, [0, 1.55, -3.38]);
  for (const sx of [-1, 1]) k.box(g, [0.12, 2.7, 0.12], M.darkSteel, [sx * 2.8, 1.35, -3.0], null, true);
  k.box(g, [5.7, 0.18, 0.9], M.darkSteel, [0, 2.8, -3.0]);
  k.box(g, [5.4, 0.12, 0.9], M.darkSteel, [0, 0.34, -3.0]);
  if (first) {
    // A wall board of milled boxes in ladder rows: one, one, three, one, three, five.
    const slot = w.own(new THREE.BoxGeometry(0.22, 0.22, 0.02));
    [1, 1, 3, 1, 3, 5].forEach((n, r) => {
      for (let c = 0; c < n; c++) {
        const m = new THREE.Mesh(slot, M.glassDark);
        m.position.set((c - (n - 1) / 2) * 0.4, 0.75 + r * 0.3, -2.58);
        g.add(m);
      }
    });
    k.tag(g, 'REC 5', { w: 0.5, h: 0.19 }, [0, 2.45, -2.58]);
  } else {
    // A ladder of shelves, a token on each.
    for (let r = 0; r < 6; r++) {
      k.box(g, [4.6, 0.04, 0.3], M.steel, [0, 0.7 + r * 0.32, -2.45]);
      for (let c = 0; c < 6; c++) k.cyl(g, [0.0, 0.06, 0.2, 4], M.darkSteel, [-1.6 + c * 0.64, 0.82 + r * 0.32, -2.45]);
    }
    k.tag(g, 'REC 6', { w: 0.5, h: 0.19 }, [0, 2.45, -2.58]);
  }

  // WHAT THE TENT KEEPS. Bench 5's half: filing cabinets down the west wall, a stove with its
  // stack through the roof on the east. Bench 6's half: a plan table and stool, a rack of charts.
  const colliders = [
    { lx: 0, lz: -3.0, hw: 2.9, hd: 0.55 },
    { lx: -5.3, lz: -1.4, hw: 0.12, hd: 1.85 }, { lx: 5.3, lz: -1.4, hw: 0.12, hd: 1.85 },
    { lx: -5.3, lz: 0.4, r: 0.22 }, { lx: 5.3, lz: 0.4, r: 0.22 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  if (first) {
    for (let i = 0; i < 4; i++) {
      k.box(g, [0.5, 1.3, 0.55], M.steel, [-4.8, 0.65, -1.9 + i * 0.6], null, true);
      k.box(g, [0.04, 0.05, 0.2], M.darkSteel, [-4.54, 0.95, -1.9 + i * 0.6]);
    }
    k.cyl(g, [0.22, 0.22, 0.8, 14], M.darkSteel, [4.5, 0.4, -1.2], null, true);
    k.cyl(g, [0.06, 0.06, 3.8, 10], M.darkSteel, [4.5, 2.7, -1.2]);
    colliders.push({ lx: -4.8, lz: -0.7, hw: 0.3, hd: 1.3 }, { lx: 4.5, lz: -1.2, r: 0.4 });
  } else {
    k.box(g, [1.6, 0.08, 0.9], M.timber, [-4.1, 0.85, -1.1]);
    for (const [dx, dz] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) k.box(g, [0.06, 0.8, 0.06], M.timber, [-4.1 + dx, 0.42, -1.1 + dz]);
    k.box(g, [0.5, 0.05, 0.36], M.paper, [-4.2, 0.92, -1.1]);
    k.cyl(g, [0.2, 0.2, 0.45, 10], M.timber, [-3.5, 0.23, -0.3]);
    for (let i = 0; i < 5; i++) k.cyl(g, [0.07, 0.07, 1.3, 10], M.paper, [4.7, 0.9 + (i % 2) * 0.2, -2.0 + i * 0.35], [Math.PI / 2, 0, 0]);
    k.box(g, [0.9, 0.08, 2.2], M.timber, [4.7, 0.75, -1.2]);
    colliders.push({ lx: -4.1, lz: -1.1, hw: 0.9, hd: 0.55 }, { lx: 4.7, lz: -1.2, hw: 0.5, hd: 1.1 });
  }

  // The work lantern, hung from the eave on a chain over the bench.
  k.strut(g, [0, 3.32, 0.3], [0, 3.28, 0.3], 0.012, M.darkSteel);
  k.lamp(g, 0, 3.15, 0.3);

  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

export const buildRecordsSouth = (w, site) => buildRecordsHalf(w, site, 'site-5');
export const buildRecordsNorth = (w, site) => buildRecordsHalf(w, site, 'site-6');

/* ======================================================================
   7. THE DETECTOR MAST — an arc on the mast platform (deck)
   A watch mast stands on a grated platform with a half ring of detectors round
   a sample chamber: the source on one side, the arc catching what comes off. The
   deck skin is the bench's own grating, the platform's first step.
   ====================================================================== */

export function buildDetectorMast(w, site) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'detector-mast';
  const bench = buildLfBench(w.ctx, { kind: 'electron', plate: HOST_PLAN['site-7'].plate, skin: HOST_PLAN['site-7'].skin });
  g.add(bench.group);

  // The platform behind the bench: a grated slab on bearers, its toe board on the open edge.
  const PZ = -4.4;
  k.box(g, [9.0, 0.12, 4.6], M.darkSteel, [0, 0.06, PZ]);
  for (let i = 0; i < 14; i++) k.box(g, [0.04, 0.05, 4.6], M.steel, [-4.3 + i * (8.6 / 13), 0.14, PZ]);
  k.box(g, [9.0, 0.12, 0.025], M.darkSteel, [0, 0.18, PZ + 2.3]);

  // The arc: a half ring of detectors on two feet, round a sample chamber on a pedestal.
  const AZ = -3.9, R = 3.3;
  const arc = new THREE.Mesh(w.own(new THREE.TorusGeometry(R, 0.08, 8, 48, Math.PI)), M.steel);
  arc.position.set(0, 0.25, AZ);
  arc.userData.openShell = true;
  g.add(arc);
  for (const sx of [-1, 1]) k.box(g, [0.5, 0.2, 0.7], M.darkSteel, [sx * R, 0.22, AZ]);
  for (let i = 1; i < 10; i++) {
    const a = i * Math.PI / 10;
    k.box(g, [0.2, 0.2, 0.36], M.caseDark, [Math.cos(a) * R, 0.25 + Math.sin(a) * R, AZ], [0, 0, a]);
  }
  k.cyl(g, [0.5, 0.58, 0.55, 18], M.darkSteel, [0, 0.4, AZ], null, true);
  k.cyl(g, [0.3, 0.3, 0.5, 18], M.glass, [0, 0.93, AZ]);
  // The source on the left: a housing and the tube that carries its beam to the chamber.
  k.box(g, [1.0, 0.8, 0.8], M.caseDark, [-4.3, 0.52, AZ], null, true);
  k.cyl(g, [0.09, 0.09, 3.2, 12], M.darkSteel, [-2.1, 0.95, AZ], [0, 0, Math.PI / 2]);
  k.cyl(g, [0.1, 0.1, 0.5, 12], M.glassDark, [-3.75, 0.95, AZ], [0, 0, Math.PI / 2]);
  k.tag(g, 'DET 7', { w: 0.5, h: 0.19 }, [-4.3, 0.55, AZ + 0.41]);

  // The mast itself, stood beside the platform, and the cable tray from the arc to its foot.
  const mast = buildAuroraMast(w.ctx);
  mast.position.set(6.2, 0, -4.6);
  g.add(mast);
  k.cable(g, [[3.4, 0.3, AZ], [5.0, 0.2, -4.3], [5.7, 0.4, -4.6], [5.8, 5.0, -4.6]], 0.03);

  // The work lantern, on a post at the right-hand front corner with an arm over the bench.
  k.lampMast(g, 3.3, 0.9, { h: 3.6, arm: [-2.6, -0.6] });

  const colliders = [
    { lx: 0, lz: PZ, hw: 4.5, hd: 2.3 },
    { lx: -4.3, lz: AZ, hw: 0.5, hd: 0.4 },
    { lx: 6.2, lz: -4.6, hw: 0.95, hd: 0.95 },
    { lx: 3.3, lz: 0.9, r: 0.25 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   8. THE TILE STORE — sample-tile racks in camp 3 (shelf)
   The camp keeps its reference tiles on racks under a tarpaulin: one tile per
   element, laid out in the shape of the periodic table, the rest in crates.
   The bench is set in front of the racks.
   ====================================================================== */

export function buildTileStore(w, site) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'tile-store';
  const bench = buildLfBench(w.ctx, { kind: 'electron', plate: HOST_PLAN['site-8'].plate, skin: HOST_PLAN['site-8'].skin });
  g.add(bench.group);

  // The racking: four uprights, a top rail, and six shelves a bay.
  const RZ = -2.9;
  const ups = [-3.5, -1.17, 1.17, 3.5];
  for (const x of ups) k.post(g, x, RZ, 3.3, 0.08);
  k.box(g, [7.2, 0.1, 0.1], M.darkSteel, [0, 3.35, RZ]);
  for (let b = 0; b < 3; b++) {
    const cx = (ups[b] + ups[b + 1]) / 2;
    for (let i = 0; i < 6; i++) k.box(g, [2.3, 0.04, 0.55], M.steel, [cx, 0.4 + i * 0.5, RZ]);
  }
  // The tiles, standing on the shelves in the periodic table's stepped shape: two, eight, eight, eighteen.
  w.tileMats = w.tileMats || [0x8a4a45, 0x4a6a8a, 0x6a8a56].map(c => w.own(new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.35 })));
  const tile = w.own(new THREE.BoxGeometry(0.3, 0.32, 0.05));
  const rows = [
    [0, 17],
    [0, 1, 12, 13, 14, 15, 16, 17],
    [0, 1, 12, 13, 14, 15, 16, 17],
    Array.from({ length: 18 }, (_, c) => c)
  ];
  rows.forEach((cols, r) => {
    const shelfY = 0.4 + (5 - r) * 0.5 + 0.02;
    for (const c of cols) {
      const x = -3.23 + c * 0.38;
      const mat = c === 0 ? w.tileMats[0] : c >= 16 ? w.tileMats[1] : c >= 12 ? w.tileMats[2] : (c % 2 ? M.steel : M.darkSteel);
      const m = new THREE.Mesh(tile, mat);
      m.position.set(x, shelfY + 0.16, RZ);
      g.add(m);
    }
  });
  // Spare tiles in crates on the lower shelves.
  for (const x of [-2.4, -0.1, 2.2]) for (const y of [0.64, 1.14]) k.box(g, [0.9, 0.3, 0.45], M.timber, [x, y, RZ]);
  k.tag(g, 'STORE 8', { w: 0.5, h: 0.19 }, [0, 3.0, RZ + 0.34]);

  // The tarpaulin over the racks and its poles, raked a little so the snow runs off to the back.
  for (const sx of [-1, 1]) for (const z of [-2.4, -6.8]) k.post(g, sx * 5.8, z, 3.6, 0.14);
  k.box(g, [11.9, 0.05, 5.0], M.tarp, [0, 3.7, -4.55], [-0.08, 0, 0]);
  for (const x of [-5.8, -2.9, 0, 2.9, 5.8]) k.box(g, [0.08, 0.1, 5.0], M.darkSteel, [x, 3.64, -4.55], [-0.08, 0, 0]);

  // Crate stacks and a barrel at the sides.
  for (const sx of [-1, 1]) {
    k.box(g, [0.9, 0.6, 0.7], M.timber, [sx * 4.9, 0.3, -0.9], [0, sx * 0.2, 0], true);
    k.box(g, [0.8, 0.5, 0.6], M.timber, [sx * 4.85, 0.85, -0.95], [0, -sx * 0.3, 0]);
  }
  k.cyl(g, [0.3, 0.3, 0.8, 14], M.darkSteel, [-5.2, 0.4, -2.0], null, true);

  // Camp 3 beside the store.
  const camp = buildCamp(w.ctx, 0.9, 23);
  camp.position.set(9.5, 0, -5.5);
  g.add(camp);

  // The work lantern, on a boom out of the racking over the bench.
  k.box(g, [0.1, 0.1, 3.4], M.darkSteel, [0.8, 3.35, -1.2]);
  k.lamp(g, 0.8, 3.15, 0.4);

  const colliders = [
    { lx: 0, lz: RZ, hw: 3.75, hd: 0.4 },
    { lx: -4.9, lz: -0.9, hw: 0.55, hd: 0.45 }, { lx: 4.9, lz: -0.9, hw: 0.55, hd: 0.45 },
    { lx: -5.2, lz: -2.0, r: 0.35 },
    { lx: -5.8, lz: -2.4, r: 0.25 }, { lx: 5.8, lz: -2.4, r: 0.25 }, { lx: -5.8, lz: -6.8, r: 0.25 }, { lx: 5.8, lz: -6.8, r: 0.25 },
    { lx: 9.5 - 1.15, lz: -5.5 - 0.4, r: 1.2 }, { lx: 9.5 + 1.05, lz: -5.5 + 0.5, r: 1.0 }, { lx: 9.5 + 0.2, lz: -5.5 - 1.25, r: 0.4 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   9. THE CUVETTE SLED — by the hole cut through the lake ice (shelf)
   Samples are drawn from the lake through a hole kept open by a tripod and
   a winch, and read at the sled where the cuvettes are racked and the
   spectrometer is boxed up against the wind.
   ====================================================================== */

export function buildWaterHole(w, site) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'water-hole';
  const bench = buildLfBench(w.ctx, { kind: 'light', plate: HOST_PLAN['site-9'].plate, skin: HOST_PLAN['site-9'].skin });
  g.add(bench.group);

  // The sled on the right: runners, a bed, the cuvette rack, the boxed spectrometer, a reagent crate.
  const SX = 3.2;
  for (const dx of [-1.2, 1.2]) {
    k.box(g, [0.18, 0.16, 2.4], M.timber, [SX + dx, 0.1, -3.6], null, true);
    k.box(g, [0.18, 0.16, 0.5], M.timber, [SX + dx, 0.22, -4.95], [0.5, 0, 0]);
  }
  k.box(g, [3.6, 0.1, 2.0], M.steel, [SX, 0.45, -3.6], null, true);
  for (const dx of [-1.55, 1.55]) k.box(g, [0.08, 0.7, 0.08], M.darkSteel, [SX + dx, 0.85, -3.0]);
  k.box(g, [3.2, 0.05, 0.4], M.darkSteel, [SX, 1.2, -3.0]);
  for (let i = 0; i < 12; i++) k.cyl(g, [0.05, 0.05, 0.28, 8], M.glass, [SX - 1.4 + i * 0.255, 1.36, -3.0]);
  k.box(g, [1.3, 0.75, 0.75], M.caseDark, [SX + 0.7, 0.88, -4.0], null, true);
  k.cyl(g, [0.1, 0.1, 0.5, 12], M.darkSteel, [SX - 0.1, 0.9, -4.0], [0, 0, Math.PI / 2]);
  k.box(g, [0.7, 0.45, 0.5], M.timber, [SX - 1.1, 0.72, -4.1]);
  k.tag(g, 'CUV 9', { w: 0.5, h: 0.19 }, [SX + 0.7, 0.88, -3.61]);

  // The hole: a ring of cut blocks round black water, a tripod over it with a pulley, a rope and a bucket.
  const { lx: hx, lz: hz } = WATER_HOLE;
  const water = new THREE.Mesh(w.own(new THREE.CircleGeometry(WATER_HOLE.r, 28)), M.glassDark);
  water.rotation.x = -Math.PI / 2;
  water.position.set(hx, 0.05, hz);
  g.add(water);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    k.box(g, [0.85, 0.4, 0.55], M.carved, [hx + Math.sin(a) * 1.3, 0.2, hz + Math.cos(a) * 1.3], [0, a, 0], true);
  }
  const apex = [hx, 3.0, hz];
  for (const a of [Math.PI / 2, Math.PI / 2 + 2.094, Math.PI / 2 + 4.189]) {
    k.strut(g, apex, [hx + Math.cos(a) * 1.9, 0.04, hz + Math.sin(a) * 1.9], 0.045, M.darkSteel);
  }
  k.cyl(g, [0.14, 0.14, 0.1, 14], M.steel, [hx, 2.9, hz], [0, 0, Math.PI / 2]);
  k.strut(g, [hx, 2.9, hz], [hx, 0.6, hz], 0.012, M.rubber);
  k.cyl(g, [0.1, 0.1, 0.3, 12], M.glass, [hx, 0.5, hz]);
  k.box(g, [0.5, 0.35, 0.4], M.darkSteel, [hx - 1.0, 0.55, hz + 1.3], null, true);

  // The work lantern, hung from the tripod's head on a wire over the bench.
  k.strut(g, apex, [0.4, 3.45, 0.2], 0.012, M.darkSteel);
  k.lamp(g, 0.4, 3.3, 0.2);

  const colliders = [
    { lx: SX, lz: -3.6, hw: 1.9, hd: 1.1 },
    { lx: hx, lz: hz, r: 1.95 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/** The host builder for each site, by site id. */
export const HOST_BUILDERS = {
  'site-1': buildWaveTank,
  'site-2': buildPhotocellMast,
  'site-3': buildSpectrographSled,
  'site-4': buildCrawlerLab,
  'site-5': buildRecordsSouth,
  'site-6': buildRecordsNorth,
  'site-7': buildDetectorMast,
  'site-8': buildTileStore,
  'site-9': buildWaterHole
};
