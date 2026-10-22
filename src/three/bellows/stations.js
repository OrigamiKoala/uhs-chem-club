/**
 * bellows/stations.js — The six hosts: the pieces of the gas works a Learn bench is built into.
 *
 * A bench on Bellows is not a bench in a gantry. It is a working point of the plant on the cloud deck: the
 * gauge gallery on a gasholder's flank, the Compressor's piston deck, the metering skid where gas is weighed out
 * of a holder, the blending manifold on a pipe rack, the leak-test station at the foot of a vent stack and the
 * liquefier's cold box. Each builder returns the machine AND its bench as ONE object, so the overlap rule (which
 * exempts a body's own parts) lets the bench be bolted to the thing it belongs to, and the bay contract
 * (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the camera need empty of it.
 *
 * THE HOST FRAME. Origin on the deck under the middle of the plate; +z is the front (toward the deck the player
 * walks in from), +x to the player's right. The world places the group at `site.pos`, turned by `siteFacing(site)`.
 * Every builder keeps to the bay by construction:
 *
 *   |x| < 2.7, z in [-1.95, 0.65]      nothing from the deck up to 2.4 m (plate, instrument, screens)
 *   |x| < 2.4, z in [0.65, 5.05]       nothing from 0.3 to 2.2 m (where the player and camera stand)
 *   |x| < 1.2, z in [0.65, 2.75]       nothing from 2.2 to 4.6 m (where a leaned-in camera hangs)
 *
 * so machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m (a lamp boom, a
 * pipe run). `verify:bench` measures all of it, and `verify:bellows` measures that no host stands outside the
 * extent `host-plan.js` declares for it.
 *
 * ONLY LAMPS ARE LIT. A host's work lamp is a `lampMark` the world pools and a fixture of the one amber material;
 * nothing here owns a PointLight.
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the gas rig, cased up. Pressing [E]
 * hides the case and opens the table on the same plate: one object, two states. The case is the one clean,
 * bright thing on a weathered plant (`M.case`).
 *
 * @returns {{ group: THREE.Group, bench: object, benchLocal: number[], colliders: object[], fieldPoints?: object[] }}
 *   `colliders` are host-local: `{ lx, lz, r }` discs and `{ lx, lz, hw, hd }` boxes (half sizes along the host's
 *   x and z). The world turns them to its own frame.
 */

import * as THREE from 'three';
import { BENCH_BAY, buildBayBench, ctxMats } from '../bench-bay.js';
import { placard } from '../materials/pbr-kit.js';
import { buildGasholder, buildPipeRack, buildVentStack } from './props.js';
import { HOST_PLAN } from './host-plan.js';

/** Where the bench stands in an older, shelter-style site frame. Hosts stand it at their own origin. */
export const BENCH_Z = BENCH_BAY.benchZ;

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
   Small, local, and the same few verbs everywhere: a box, a cylinder, a round
   bar between two points, a cable, a pipe, a footed column, a gauge, a work lamp.
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
    for (let i = 1; i < pts.length - 1; i++) {
      const e = new THREE.Mesh(own(new THREE.SphereGeometry(r * 1.02, 10, 8)), mat);
      e.position.set(...pts[i]);
      g.add(e);
    }
  };

  /** A bolted base plate, flush on the deck. */
  const footing = (g, x, z, size = 0.34) => {
    box(g, [size + 0.16, 0.05, size + 0.16], M.darkSteel, [x, 0.025, z]);
  };

  /** A square post stood on a footing: from the deck to `top`. */
  const post = (g, x, z, top, s = 0.14, mat = M.darkSteel) => {
    footing(g, x, z, Math.max(0.28, s + 0.14));
    box(g, [s, top - 0.05, s], mat, [x, 0.05 + (top - 0.05) / 2, z], null, true);
  };

  /** A stencilled tag set flat on a surface. */
  const tag = (g, text, size, p, ry = 0) => {
    const t = placard(text, { fg: '#14223a', bg: '#d6e0ee', ...size });
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

  /** The work lamp over a bench: a pooled lamp mark and its amber fixture. */
  const lamp = (g, x, y, z, { intensity = 9, distance = 12 } = {}) => {
    const mark = new THREE.Object3D();
    mark.position.set(x, y, z);
    mark.userData.lamp = { color: LAMP, intensity, distance, decay: 1.7 };
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

  return { box, cyl, tube, strut, pipe, footing, post, tag, gauge, wheel, lamp, lampMast, shade, own, t4 };
}

/** The bench every host builds first: the plate at the origin, in the host's skin. */
function benchOf(w, siteId) {
  const plan = HOST_PLAN[siteId];
  return buildBwBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
}

/** The colliders a bench itself always carries (the plate, host frame). */
const PLATE = { lx: 0, lz: 0, hw: 2.4, hd: 0.65 };

/** The six legs of a gasholder at host (cx, cz), as discs, matching `props.js` (leg ring 3.9 m, 0.2 turned). */
function holderLegs(cx, cz) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.2;
    out.push({ lx: cx + Math.cos(a) * 3.9, lz: cz + Math.sin(a) * 3.9, r: 0.55 });
  }
  return out;
}

/* ======================================================================
   1. THE GAUGE GALLERY — on a gasholder's flank (shelf)
   The plant's great gasholder stands on its legs behind the plate. A manifold
   of pressure gauges stands at either end of the gallery; the bench is the
   shelf they are read from. The player reads the plant's gauges, does not climb it.
   ====================================================================== */

export function buildGaugeGallery(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'gauge-gallery';
  const bench = benchOf(w, 'site-1');
  g.add(bench.group);

  // THE GASHOLDER: a sphere on six legs, its feed pipe coming down to the gallery's manifolds.
  const holder = buildGasholder(w.ctx, 0);
  holder.position.set(0, 0, -9.6);
  g.add(holder);

  // Two manifolds of gauges, one at each end of the gallery: a pipe on posts, a gauge on a stem at each outlet.
  for (const sx of [-1, 1]) {
    const x = sx * 4.1;
    k.post(g, x, -2.2, 1.0, 0.12);
    k.post(g, x + sx * 1.4, -2.2, 1.0, 0.12);
    k.cyl(g, [0.08, 0.08, 1.9, 12], M.brass, [x + sx * 0.7, 0.98, -2.2], [0, 0, Math.PI / 2], true);
    for (const o of [0.1, 0.7, 1.3]) {
      k.cyl(g, [0.03, 0.03, 0.5, 8], M.brass, [x + sx * o, 1.28, -2.2]);
      k.gauge(g, x + sx * o, 1.7, -2.2, 0.19, (sx * 0.4 * (o + 0.4)) - 0.2);
    }
    k.tag(g, sx < 0 ? 'HOLDER 1' : 'HOLDER 2', { w: 0.5, h: 0.18 }, [x + sx * 0.7, 0.72, -2.13]);
  }
  // The feed: from the holder's foot, a pipe along the deck to each manifold and up to it.
  k.pipe(g, [[-0.8, 0.5, -6.0], [-0.8, 0.3, -3.4], [-4.8, 0.3, -3.4], [-4.8, 0.9, -2.4]], 0.07, M.darkSteel);
  k.pipe(g, [[0.8, 0.5, -6.0], [0.8, 0.3, -3.4], [4.8, 0.3, -3.4], [4.8, 0.9, -2.4]], 0.07, M.darkSteel);

  // THE FIELD GAUGE: a pedestal gauge as tall as a hand, on the right-hand manifold's own pipe. The holder's reading
  // is taken from here (`[E]` takes a card of what its needle stands at) and carried back to the bench.
  {
    const PX = 6.0, PZ = -2.0;
    k.footing(g, PX, PZ, 0.3);
    k.cyl(g, [0.07, 0.09, 1.0, 10], M.darkSteel, [PX, 0.55, PZ], null, true);
    k.box(g, [0.5, 0.5, 0.2], M.caseDark, [PX, 1.3, PZ], null, true);
    k.gauge(g, PX, 1.3, PZ + 0.11, 0.2, -0.1);
    k.tag(g, 'HOLDER 1 · GAUGE', { w: 0.62, h: 0.17 }, [PX, 0.92, PZ + 0.1]);
  }

  // The work lamp: a boom from a mast beside the right-hand manifold, over the plate.
  k.lampMast(g, 3.0, -2.6, { h: 3.7, arm: [-2.4, 2.7] });

  const colliders = [
    PLATE,
    ...holderLegs(0, -9.6),
    { lx: -4.1, lz: -2.2, hw: 2.0, hd: 0.3 }, { lx: 4.1, lz: -2.2, hw: 2.0, hd: 0.3 },
    { lx: 6.0, lz: -2.0, hw: 0.3, hd: 0.2 },
    { lx: 3.0, lz: -2.6, r: 0.2 }
  ];
  const fieldPoints = [{
    id: 'gauge', label: 'Holder Gauge', lx: 6.0, ly: 1.3, lz: -1.9, half: [0.4, 0.4, 0.3],
    stand: { lx: 6.0, lz: -0.2 }
  }];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

/* ======================================================================
   2. THE PISTON DECK — at the Compressor's foot (deck)
   Two glass cylinders stand on the grated deck at the Compressor's plinth,
   the tall one with its weights on the rod: the demonstration pistons the
   plant's engineers adjusted by hand. The tower is the machinery behind the plate.
   ====================================================================== */

export function buildPistonDeck(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'piston-deck';
  const bench = benchOf(w, 'site-2');
  g.add(bench.group);

  // The tall demonstration cylinder, with its rod, its stack of weights and a top plate.
  {
    const X = -4.7, Z = -1.0;
    k.cyl(g, [0.62, 0.7, 0.22, 24], M.darkSteel, [X, 0.11, Z], null, true);
    k.tube(g, [0.55, 2.6, 28], M.glass, [X, 1.5, Z]);
    k.cyl(g, [0.54, 0.54, 0.12, 24], M.steel, [X, 1.55, Z]);
    k.cyl(g, [0.04, 0.04, 1.7, 8], M.darkSteel, [X, 2.5, Z]);
    for (let n = 0; n < 4; n++) k.cyl(g, [0.34, 0.34, 0.12, 18], M.darkSteel, [X, 2.8 + n * 0.14, Z]);
    k.cyl(g, [0.6, 0.6, 0.1, 24], M.darkSteel, [X, 2.85, Z]);
    k.tag(g, 'PISTON 1', { w: 0.5, h: 0.18 }, [X, 0.5, Z + 0.7]);
  }
  // The short one, at rest, and the rack the spare weights stand in.
  {
    const X = 4.7, Z = -1.0;
    k.cyl(g, [0.46, 0.52, 0.18, 22], M.darkSteel, [X, 0.09, Z], null, true);
    k.tube(g, [0.4, 1.5, 24], M.glass, [X, 0.95, Z]);
    k.cyl(g, [0.38, 0.38, 0.1, 20], M.steel, [X, 0.72, Z]);
    k.cyl(g, [0.035, 0.035, 0.9, 8], M.darkSteel, [X, 1.6, Z]);
    k.box(g, [1.0, 0.5, 0.4], M.darkSteel, [X + 1.3, 0.25, Z - 0.1], null, true);
    for (let n = 0; n < 3; n++) k.cyl(g, [0.16, 0.16, 0.1, 14], M.darkSteel, [X + 1.0 + n * 0.3, 0.55, Z - 0.1]);
    k.tag(g, 'PISTON 2', { w: 0.5, h: 0.18 }, [X, 0.38, Z + 0.62]);
  }
  // The pipework from the Compressor's plinth to the two cylinders, along the deck.
  k.pipe(g, [[-4.7, 0.3, -1.6], [-4.7, 0.3, -2.3], [-1.6, 0.3, -2.3]], 0.1, M.darkSteel);
  k.pipe(g, [[4.7, 0.3, -1.5], [4.7, 0.3, -2.3], [1.6, 0.3, -2.3]], 0.1, M.darkSteel);
  for (const x of [-1.6, 1.6]) k.cyl(g, [0.16, 0.16, 0.1, 14], M.darkSteel, [x, 0.3, -2.3], [0, 0, Math.PI / 2]);
  // A gauge on a stub at each end of the pipe, facing the plate.
  for (const x of [-3.0, 3.0]) {
    k.cyl(g, [0.03, 0.03, 0.55, 8], M.brass, [x, 0.55, -2.3]);
    k.gauge(g, x, 1.0, -2.3, 0.16, x < 0 ? -0.6 : 0.3);
  }

  k.lampMast(g, -3.4, -1.8, { h: 3.7, arm: [3.4, 1.9] });

  const colliders = [
    PLATE,
    { lx: -4.7, lz: -1.0, r: 0.75 }, { lx: 4.7, lz: -1.0, r: 0.6 }, { lx: 6.0, lz: -1.1, hw: 0.5, hd: 0.25 },
    { lx: -3.4, lz: -1.8, r: 0.2 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   3. THE METERING SKID — where gas is weighed out of a holder (desk)
   A second gasholder stands behind and to the right; its draw-off runs down to a
   skid, a horizontal receiver on saddles, and on to a beam balance on the left of
   the plate where the receiver is weighed full and empty.
   ====================================================================== */

export function buildMeteringSkid(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'metering-skid';
  const bench = benchOf(w, 'site-3');
  g.add(bench.group);

  const holder = buildGasholder(w.ctx, 0.6);
  holder.position.set(4.2, 0, -10.8);
  g.add(holder);

  // The skid: a base frame on the deck with a receiver lying on two saddles, valved at both ends.
  k.box(g, [3.4, 0.14, 1.3], M.darkSteel, [0.2, 0.17, -4.4], null, true);
  for (const x of [-0.8, 1.2]) k.box(g, [0.14, 0.4, 1.1], M.darkSteel, [x, 0.44, -4.4], null, true);
  k.cyl(g, [0.46, 0.46, 3.0, 24], M.cladding, [0.2, 0.9, -4.4], [0, 0, Math.PI / 2], true);
  for (const sx of [-1, 1]) k.cyl(g, [0.46, 0.2, 0.2, 18], M.darkSteel, [0.2 + sx * 1.55, 0.9, -4.4], [0, 0, sx * Math.PI / 2]);
  k.wheel(g, -1.7, 1.6, -4.4, 0.12);
  k.wheel(g, 2.0, 1.6, -4.4, 0.12);
  k.gauge(g, 0.2, 1.65, -4.0, 0.2, 0.2);
  k.tag(g, 'RECEIVER 3', { w: 0.62, h: 0.18 }, [0.2, 0.9, -3.92]);
  // The draw-off from the holder's foot to the skid.
  k.pipe(g, [[3.0, 0.5, -8.4], [3.0, 0.3, -5.2], [2.4, 0.3, -4.4]], 0.09, M.darkSteel);

  // The beam balance: an upright, a beam, two pans on hangers, the receiver's weight on the left one.
  {
    const X = -5.1, Z = -1.4;
    k.box(g, [0.9, 0.1, 0.9], M.darkSteel, [X, 0.06, Z], null, true);
    k.cyl(g, [0.1, 0.17, 2.4, 10], M.darkSteel, [X, 1.25, Z], null, true);
    const beam = k.box(g, [2.8, 0.09, 0.1], M.steel, [X, 2.5, Z]);
    beam.rotation.z = 0.05;
    for (const [dx, y] of [[-1.25, 2.55], [1.25, 2.45]]) {
      k.strut(g, [X + dx - 0.35, y - 0.05, Z], [X + dx, 1.3, Z], 0.012, M.darkSteel, 6);
      k.strut(g, [X + dx + 0.35, y - 0.05, Z], [X + dx, 1.3, Z], 0.012, M.darkSteel, 6);
      k.cyl(g, [0.5, 0.42, 0.08, 22], M.brass, [X + dx, 1.25, Z]);
    }
    k.cyl(g, [0.22, 0.22, 0.6, 16], M.cladding, [X - 1.25, 1.6, Z]);
    for (let n = 0; n < 4; n++) k.cyl(g, [0.09, 0.09, 0.06, 10], M.darkSteel, [X + 1.25, 1.31 + n * 0.065, Z]);
    k.tag(g, 'BALANCE 3', { w: 0.5, h: 0.17 }, [X, 0.5, Z + 0.46]);
  }
  k.lampMast(g, 3.4, -2.0, { h: 3.7, arm: [-3.0, 2.2] });

  const colliders = [
    PLATE,
    ...holderLegs(4.2, -10.8).map(c => {
      // the holder is turned 0.6 rad about its own centre
      const dx = c.lx - 4.2, dz = c.lz + 10.8;
      const cs = Math.cos(0.6), sn = Math.sin(0.6);
      return { lx: 4.2 + dx * cs + dz * sn, lz: -10.8 - dx * sn + dz * cs, r: c.r };
    }),
    { lx: 0.2, lz: -4.4, hw: 1.8, hd: 0.7 },
    { lx: -5.1, lz: -1.4, r: 0.5 },
    { lx: 3.4, lz: -2.0, r: 0.2 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   4. THE BLENDING MANIFOLD — on a pipe rack (shelf)
   Three pipes ride a trestle rack behind the plate; two risers drop to a header
   with a valve on each leg, and a storage tank stands at each end of the rack.
   ====================================================================== */

export function buildBlendingManifold(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'blending-manifold';
  const bench = benchOf(w, 'site-4');
  g.add(bench.group);

  const rack = buildPipeRack(w.ctx, 0);
  rack.position.set(0, 0, -5.0);
  g.add(rack);

  // The header below the rack: a pipe at gauge height with a valve on each leg and a gauge over the middle.
  const HZ = -3.9;
  k.cyl(g, [0.08, 0.08, 9.0, 12], M.brass, [0, 1.35, HZ], [0, 0, Math.PI / 2], true);
  for (const x of [-3.6, 3.6]) k.cyl(g, [0.07, 0.07, 2.2, 10], M.darkSteel, [x, 2.45, HZ - 0.15]);
  for (const x of [-3.6, -1.2, 1.2, 3.6]) {
    k.cyl(g, [0.045, 0.045, 0.45, 8], M.brass, [x, 1.0, HZ]);
    k.wheel(g, x, 0.75, HZ, 0.1);
  }
  k.gauge(g, 0, 1.95, HZ - 0.1, 0.22, 0.1);
  k.cyl(g, [0.03, 0.03, 0.6, 8], M.brass, [0, 1.62, HZ - 0.05]);
  k.tag(g, 'MANIFOLD 4', { w: 0.62, h: 0.18 }, [0, 0.55, HZ + 0.1]);
  // A storage tank at each end of the rack, on legs, with a gauge on its flank.
  for (const sx of [-1, 1]) {
    const X = sx * 7.4;
    k.cyl(g, [0.9, 0.9, 2.6, 22], M.cladding, [X, 1.75, -5.0], null, true);
    k.cyl(g, [0.9, 0.2, 0.4, 22], M.cladding, [X, 3.25, -5.0]);
    for (const [dx, dz] of [[0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]]) k.box(g, [0.1, 0.5, 0.1], M.darkSteel, [X + dx, 0.25, -5.0 + dz]);
    k.gauge(g, X, 1.6, -4.1, 0.17, sx * 0.3);
    k.pipe(g, [[X - sx * 0.9, 3.2, -5.0], [X - sx * 1.2, 3.55, -5.0]], 0.09, M.darkSteel);
  }
  k.lampMast(g, -3.6, -1.6, { h: 3.7, arm: [3.4, 1.4] });

  const colliders = [PLATE, { lx: 0, lz: HZ, hw: 4.6, hd: 0.2 }, { lx: -7.4, lz: -5.0, r: 1.0 }, { lx: 7.4, lz: -5.0, r: 1.0 }, { lx: -3.6, lz: -1.6, r: 0.2 }];
  for (const x of [-6.2, -2.07, 2.07, 6.2]) for (const z of [-6.5, -3.5]) colliders.push({ lx: x, lz: z, r: 0.45 });
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   5. THE LEAK-TEST STATION — at the foot of a vent stack (deck)
   A sight tube lies along the back of the plate on stands, a plate with a
   pinhole across its end and a bubbler jar past that; a vessel stands behind
   it and the stack rises beyond. The bleed valve on the stack's foot is where
   the plant's own leak is sampled.
   ====================================================================== */

export function buildLeakStation(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'leak-station';
  const bench = benchOf(w, 'site-5');
  g.add(bench.group);

  const stack = buildVentStack(w.ctx);
  stack.position.set(5.8, 0, -6.6);
  g.add(stack);

  // The sight tube: a glass tube along the back of the plate on three stands, a rule below it, a pinhole plate across its end.
  const TZ = -2.7;
  k.tube(g, [0.15, 5.4, 20], M.glass, [0, 1.45, TZ], [0, 0, Math.PI / 2]);
  for (const x of [-2.7, 2.7]) k.cyl(g, [0.19, 0.19, 0.1, 18], M.darkSteel, [x, 1.45, TZ], [0, 0, Math.PI / 2]);
  for (const x of [-2.2, 0, 2.2]) {
    k.footing(g, x, TZ, 0.3);
    k.box(g, [0.12, 1.3, 0.12], M.darkSteel, [x, 0.7, TZ], null, true);
  }
  k.box(g, [0.1, 0.52, 0.52], M.steel, [2.95, 1.45, TZ]);
  k.cyl(g, [0.02, 0.02, 0.14, 8], M.glassDark, [3.0, 1.45, TZ], [0, 0, Math.PI / 2]);
  for (let i = 0; i <= 24; i++) k.box(g, [0.02, i % 4 === 0 ? 0.2 : 0.1, 0.02], M.paint2, [-2.4 + i * 0.2, 0.98, TZ + 0.12]);
  // The bubbler jar past the plate: glass, a standpipe, and a little water in the foot.
  k.tube(g, [0.45, 0.9, 20], M.glass, [4.4, 1.0, TZ]);
  k.cyl(g, [0.46, 0.5, 0.12, 20], M.darkSteel, [4.4, 0.06, TZ], null, true);
  k.cyl(g, [0.4, 0.4, 0.3, 20], M.pane, [4.4, 0.27, TZ]);
  k.pipe(g, [[3.0, 1.45, TZ], [3.6, 1.45, TZ], [3.9, 1.7, TZ], [4.4, 1.7, TZ], [4.4, 0.7, TZ]], 0.05, M.brass);
  // The vessel the tube is fed from, behind and to the left, and the line across to the stack.
  k.cyl(g, [0.7, 0.7, 2.6, 22], M.cladding, [-5.2, 1.3, -4.6], [0, 0, Math.PI / 2], true);
  for (const x of [-5.9, -4.5]) k.box(g, [0.14, 0.8, 1.0], M.darkSteel, [x, 0.4, -4.6]);
  k.pipe(g, [[-5.2, 0.7, -3.9], [-5.2, 0.5, -2.7], [-2.7, 1.45, TZ]], 0.06, M.darkSteel);
  k.pipe(g, [[-3.9, 1.3, -4.8], [-1.0, 1.0, -5.9], [4.9, 0.7, -6.4]], 0.08, M.darkSteel);
  k.gauge(g, -5.2, 2.4, -3.85, 0.2, 0.4);
  // The bleed valve on the stack's foot, facing the plate: the plant's own leak, sampled here.
  {
    const VX = 5.8, VZ = -5.1;
    k.cyl(g, [0.045, 0.045, 0.55, 10], M.brass, [VX, 0.95, VZ], [Math.PI / 2, 0, 0]);
    k.wheel(g, VX, 1.2, VZ - 0.1, 0.12);
    k.box(g, [0.22, 0.22, 0.22], M.darkSteel, [VX, 0.95, VZ - 0.35]);
    k.tag(g, 'BLEED 5', { w: 0.46, h: 0.16 }, [VX, 0.6, VZ + 0.27]);
  }
  k.lampMast(g, 3.6, -1.4, { h: 3.7, arm: [-3.2, 1.4] });

  const colliders = [
    PLATE,
    { lx: 0, lz: TZ, hw: 3.2, hd: 0.3 },
    { lx: 4.4, lz: TZ, r: 0.5 },
    { lx: -5.2, lz: -4.6, hw: 1.5, hd: 0.8 },
    { lx: 5.8, lz: -6.6, r: 1.5 },
    { lx: 5.8, lz: -5.2, hw: 0.3, hd: 0.2 },
    { lx: 3.6, lz: -1.4, r: 0.2 }
  ];
  const fieldPoints = [{
    id: 'bleed', label: 'Stack Leak', lx: 5.8, ly: 0.95, lz: -5.0, half: [0.35, 0.45, 0.35],
    stand: { lx: 5.8, lz: -3.2 }
  }];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

/* ======================================================================
   6. THE COLD BOX — the liquefier, beside the Compressor (desk)
   A frosted, insulated chest with the liquefier's coil standing on its right
   and a dewar on its left, between the plate and the tower. Its draw-off valve,
   on a standpipe, is where the cold gas is drawn.
   ====================================================================== */

export function buildColdBox(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'cold-box';
  const bench = benchOf(w, 'site-6');
  g.add(bench.group);

  // The cabinet: frosted insulation over a steel frame, a sight window in its door, a vent along the top.
  k.box(g, [3.6, 2.7, 1.3], M.rime, [-0.9, 1.4, -2.8], null, true);
  k.box(g, [3.7, 0.12, 1.4], M.darkSteel, [-0.9, 2.82, -2.8]);
  k.box(g, [3.7, 0.12, 1.4], M.darkSteel, [-0.9, 0.07, -2.8]);
  k.box(g, [2.4, 1.5, 0.05], M.pane, [-0.9, 1.5, -2.13]);
  for (const x of [-2.1, 0.3]) k.box(g, [0.06, 1.6, 0.06], M.darkSteel, [x, 1.5, -2.1]);
  k.gauge(g, 0.5, 2.3, -2.12, 0.18, -0.3);
  k.tag(g, 'COLD BOX 6', { w: 0.62, h: 0.18 }, [-2.0, 0.5, -2.12]);
  // Frozen drips down the front: pale ribs.
  for (let i = 0; i < 6; i++) k.box(g, [0.05, 0.3 + (i % 3) * 0.16, 0.04], M.paint2, [-2.5 + i * 0.55, 2.55 - (i % 3) * 0.08, -2.12]);
  // The coil on the right: a stack of rings round a brass column, on a base.
  {
    const X = 3.6, Z = -2.8;
    k.cyl(g, [0.55, 0.62, 0.2, 22], M.darkSteel, [X, 0.1, Z], null, true);
    for (let n = 0; n < 7; n++) {
      const r = new THREE.Mesh(w.own(new THREE.TorusGeometry(0.42, 0.04, 6, 24)), M.brass);
      r.position.set(X, 0.5 + n * 0.28, Z);
      r.rotation.x = Math.PI / 2;
      g.add(r);
    }
    k.cyl(g, [0.035, 0.035, 2.5, 8], M.brass, [X, 1.35, Z]);
    k.pipe(g, [[2.7, 1.2, Z], [3.2, 1.2, Z]], 0.05, M.brass);
  }
  // The dewar on the left: a vacuum flask on a trolley.
  {
    const X = -4.2, Z = -2.6;
    k.cyl(g, [0.34, 0.34, 1.2, 20], M.cladding, [X, 0.85, Z], null, true);
    k.cyl(g, [0.34, 0.2, 0.25, 20], M.cladding, [X, 1.55, Z]);
    k.cyl(g, [0.14, 0.14, 0.2, 12], M.darkSteel, [X, 1.77, Z]);
    k.box(g, [0.8, 0.12, 0.8], M.darkSteel, [X, 0.18, Z]);
    for (const [dx, dz] of [[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]]) k.cyl(g, [0.06, 0.06, 0.1, 8], M.rubber, [X + dx, 0.05, Z + dz]);
    k.pipe(g, [[X + 0.3, 0.5, Z], [-2.9, 0.5, -2.7]], 0.05, M.darkSteel);
  }
  // THE DRAW-OFF: a standpipe with a spigot and a drip tray, to the right of the bay. The cold gas drawn here is carried back to the bench.
  {
    const PX = 3.5, PZ = -1.6;
    k.footing(g, PX, PZ, 0.3);
    k.cyl(g, [0.06, 0.07, 1.1, 10], M.darkSteel, [PX, 0.6, PZ], null, true);
    k.box(g, [0.3, 0.26, 0.26], M.rime, [PX, 1.28, PZ], null, true);
    k.cyl(g, [0.04, 0.04, 0.26, 8], M.brass, [PX, 1.12, PZ + 0.2], [Math.PI / 2, 0, 0]);
    k.wheel(g, PX, 1.55, PZ, 0.1);
    k.box(g, [0.5, 0.06, 0.4], M.darkSteel, [PX, 0.06, PZ + 0.35]);
    k.pipe(g, [[PX, 1.3, PZ - 0.1], [PX, 1.3, -2.2], [0.9, 1.3, -2.4]], 0.05, M.brass);
    k.tag(g, 'DRAW-OFF 6', { w: 0.5, h: 0.17 }, [PX, 0.8, PZ + 0.09]);
  }
  k.lampMast(g, -3.0, -1.4, { h: 3.7, arm: [3.0, 1.5] });

  const colliders = [
    PLATE,
    { lx: -0.9, lz: -2.8, hw: 1.9, hd: 0.7 },
    { lx: 3.6, lz: -2.8, r: 0.65 },
    { lx: -4.2, lz: -2.6, r: 0.5 },
    { lx: 3.5, lz: -1.6, hw: 0.3, hd: 0.3 },
    { lx: -3.0, lz: -1.4, r: 0.2 }
  ];
  const fieldPoints = [{
    id: 'drawoff', label: 'Cold Draw-off', lx: 3.5, ly: 1.2, lz: -1.5, half: [0.4, 0.5, 0.35],
    stand: { lx: 3.5, lz: -0.1 }
  }];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildGaugeGallery,
  'site-2': buildPistonDeck,
  'site-3': buildMeteringSkid,
  'site-4': buildBlendingManifold,
  'site-5': buildLeakStation,
  'site-6': buildColdBox
};
