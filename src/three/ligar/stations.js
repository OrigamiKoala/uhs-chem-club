/**
 * stations.js — The nine hosts: the pieces of the quarry and the mine a Learn bench is built into.
 *
 * A bench on Ligar is not a bench in a hut. Four stand at the surface workings: the saw bed at the
 * quarry's west face, the crusher's inspection deck, the weighbridge's scale house and the mine's
 * substation at the main portal. Five stand underground, each in a chamber of the mine: the ore
 * drift just inside the main adit (the forge is here), the drill chamber, the survey station at the
 * junction of three drifts, the sump and pump station down the decline, and the hoist chamber at its
 * deepest point. Each builder here returns the machine AND its bench as ONE object, so the overlap
 * rule (which exempts a body's own parts) lets the bench be bolted to the thing it belongs to, and
 * the bay contract (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the
 * camera need empty of it.
 *
 * THE HOST FRAME. Origin on the floor under the middle of the plate; +z is the front (toward the
 * ground the player walks in from), +x to the player's right. The world places the group at
 * `site.pos`, turned by `siteFacing(site)`. Every builder keeps to the bay by construction:
 *
 *   |x| < 2.7, z in [-1.95, 0.65]      nothing from the floor up to 2.4 m (plate, instrument, screens)
 *   |x| < 2.4, z in [0.65, 5.05]       nothing from 0.3 to 2.2 m (where the player and camera stand)
 *
 * so machinery stands to the sides (|x| > 2.8), behind the plate (z < -2.0), or above 2.4 m.
 * `verify:bench` measures all of it.
 *
 * A CHAMBER'S WALLS stand at x = +-5.6 and z = -3.1 / +7.9 (`mine-plan.js`), the faces of their
 * columns up to 0.3 m inside those planes; the roof is 4.4 m up. A chamber host keeps to 5.2 m
 * either side and 2.7 behind, and hangs its own lamps.
 *
 * @returns {{ group: THREE.Group, bench: object, benchLocal: number[], colliders: object[] }}
 *   `colliders` are host-local: `{ lx, lz, r }` discs and `{ lx, lz, hw, hd }` boxes
 *   (half sizes along the host's x and z). The world turns them to its own frame.
 */

import * as THREE from 'three';
import { placard, hazardStripe } from '../materials/pbr-kit.js';
import { iBeamGeometry, corrugatedGeometry } from '../tallow/kit.js';
import { UNDERGROUND_LAMP } from './mine.js';

const Y = new THREE.Vector3(0, 1, 0);
/** The forge's fire. Hotter and redder than a lamp, because it is a fire. */
const FORGE = 0xc1521c;

/* ======================================================================
   THE PARTS KIT
   Small, local, and the same few verbs everywhere: a box, a cylinder, a section,
   a straight run of pipe between two points, a caged lamp on a mast.
   ====================================================================== */

function kitFor(w) {
  const own = (...o) => w.own(...o);
  const t4 = w.t4;
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

  /** A ring (torus) of major radius `r`, tube `t`, its axis along `axis` ('x' | 'y' | 'z'). */
  const ring = (g, r, t, mat, [x, y, z], axis = 'z') => {
    const m = new THREE.Mesh(own(new THREE.TorusGeometry(r, t, 6, 22)), mat);
    m.position.set(x, y, z);
    if (axis === 'x') m.rotation.y = Math.PI / 2; else if (axis === 'y') m.rotation.x = Math.PI / 2;
    g.add(m);
    return m;
  };

  /** An I-section `len` long, centred on `p`, running along `axis`, web vertical. */
  const beam = (g, len, mat, p, axis = 'y', dims = { h: 0.2, w: 0.14 }, shadow = false) => {
    const geo = own(iBeamGeometry(len, dims));
    if (axis === 'x') geo.rotateZ(Math.PI / 2);
    else if (axis === 'z') { geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI / 2); }
    const m = new THREE.Mesh(geo, mat);
    m.position.set(p[0], p[1], p[2]);
    if (shadow) m.castShadow = t4;
    g.add(m);
    return m;
  };

  /** A round bar or pipe between two points. */
  const strut = (g, a, b, r, mat, seg = 8) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, len, seg)), mat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(Y, vb.clone().sub(va).normalize());
    g.add(m);
    return m;
  };

  /** A pipe run through a list of points, an elbow at each corner and a flange at each end. */
  const pipe = (g, pts, r, mat) => {
    for (let i = 0; i < pts.length - 1; i++) strut(g, pts[i], pts[i + 1], r, mat, 10);
    for (let i = 1; i < pts.length - 1; i++) {
      const e = new THREE.Mesh(own(new THREE.SphereGeometry(r * 1.02, 10, 8)), mat);
      e.position.set(...pts[i]);
      g.add(e);
    }
    for (const p of [pts[0], pts[pts.length - 1]]) {
      const f = new THREE.Mesh(own(new THREE.CylinderGeometry(r * 1.6, r * 1.6, 0.04, 14)), w.darkSteelMat);
      f.position.set(...p);
      const d = p === pts[0]
        ? new THREE.Vector3(...pts[1]).sub(new THREE.Vector3(...pts[0]))
        : new THREE.Vector3(...pts[pts.length - 2]).sub(new THREE.Vector3(...pts[pts.length - 1]));
      f.quaternion.setFromUnitVectors(Y, d.normalize());
      g.add(f);
    }
  };

  /** A bolted base plate on a footing. */
  const footing = (g, x, z, size = 0.34) => {
    box(g, [size + 0.2, 0.18, size + 0.2], w.hostMats.footing, [x, -0.07, z]);
    box(g, [size, 0.03, size], w.darkSteelMat, [x, 0.025, z]);
  };

  /** An H column stood on a footing: from the ground to `top`. */
  const column = (g, x, z, top, dims = { h: 0.2, w: 0.16 }) => {
    footing(g, x, z, 0.32);
    beam(g, top - 0.04, w.darkSteelMat, [x, 0.04 + (top - 0.04) / 2, z], 'y', dims, true);
  };

  /** A caged sodium lamp on a mast, its arm reaching `arm` = [dx, dz]. */
  const lampMast = (g, x, z, { h = 3.6, arm = [0, 0] } = {}) => {
    footing(g, x, z, 0.3);
    cyl(g, [0.045, 0.06, h, 10], w.darkSteelMat, [x, h / 2, z], null, true);
    if (arm[0] || arm[1]) strut(g, [x, h - 0.05, z], [x + arm[0], h - 0.05, z + arm[1]], 0.035, w.darkSteelMat);
    g.add(w.buildLuminaire(x + arm[0], h - 0.12, z + arm[1]));
  };

  /** A stencilled plant tag set flat on a surface. */
  const tag = (g, text, size, p, ry = 0) => {
    const t = placard(text, size);
    t.position.set(...p);
    t.rotation.y = ry;
    g.add(t);
    own(t.geometry, t.material, t.material.map);
  };

  /** Four caged lamps at the corners of a chamber's ceiling, clear of everything below 4 m. */
  const chamberLamps = g => {
    for (const [x, z] of [[-3.4, 0.9], [3.4, 0.9], [-3.4, 5.4], [3.4, 5.4]]) g.add(w.buildLuminaire(x, 3.95, z, UNDERGROUND_LAMP));
  };

  return { box, cyl, ring, beam, strut, pipe, footing, column, lampMast, tag, chamberLamps, shade, own, t4 };
}

/** The shared dress a host needs that the world has not made for itself. */
function prepare(w) {
  if (w.hostMats) return w.hostMats;
  const std = o => w.own(new THREE.MeshStandardMaterial({ metalness: 0, roughness: 1, ...o }));
  w.hostMats = {
    footing: std({ color: 0x5e574c }),
    glass: std({ color: 0x14130f, roughness: 0.25, metalness: 0.15 }),
    copper: std({ color: 0x9a5b34, roughness: 0.5, metalness: 0.75 }),
    water: std({ color: 0x0f1113, roughness: 0.08, metalness: 0.35 }),
    porcelain: std({ color: 0x8a8272, roughness: 0.4 }),
    paper: std({ color: 0xcdc2a3 }),
    rubber: std({ color: 0x1c1a18, roughness: 0.95 }),
    rope: std({ color: 0x6b5a3e }),
    slate: std({ color: 0x1c1b1e, roughness: 0.82, metalness: 0.05 }),
    black: std({ color: 0x000000 }),
    brass: std({ color: 0x8c7440, roughness: 0.45, metalness: 0.8 }),
    face: std({ color: 0xb8ad96, roughness: 0.78 }),
    ink: std({ color: 0x2a251f, roughness: 0.8 })
  };
  return w.hostMats;
}

/** A crude loose pile of broken column: the merged rock mesh the quarry's spoil is. */
function pile(w, g, cx, cz, r, seed, mound = 0.5, count = 24) {
  const rb = w.buildRubbleField({
    count: w.t4 ? count : Math.ceil(count / 2), minX: cx - r, maxX: cx + r, minZ: cz - r, maxZ: cz + r,
    y: 0, seed, scale: 0.55, mound
  });
  rb.userData.noMerge = true;
  g.add(rb);
  return rb;
}

/* ======================================================================
   1. THE SLAB-DRESSING YARD — at the quarry's west face (shelf)
   Cut slabs come out of the face and are dressed here: clamped on a long
   steel bed under a bridge saw, then racked. The bench is the shelf in front
   of the saw bed, where two dressed faces are brought together to see what
   holds them.
   ====================================================================== */

export function buildSlabYard(w, site) {
  const M = prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'slab-yard';

  // The apron the work is done on: a skim of concrete, bedded.
  k.box(g, [17.6, 0.12, 9.6], M.footing, [0, -0.06, -1.9]);

  const bench = w.buildBench({ kind: 'join', plate: 'LB-01', skin: 'shelf' });
  g.add(bench.group);

  // THE SAW BED, behind the bench: slats across two long rails, on legs. A slab lies clamped on it.
  {
    const bz = -3.0;
    for (const dz of [-0.5, 0.5]) k.beam(g, 11.2, w.darkSteelMat, [0, 0.8, bz + dz], 'x', { h: 0.18, w: 0.12 });
    for (let i = 0; i < 22; i++) k.box(g, [0.12, 0.06, 1.14], w.plateMat, [-5.25 + i * 0.5, 0.9, bz]);
    for (let i = -2; i <= 2; i++) for (const dz of [-0.5, 0.5]) k.box(g, [0.14, 0.78, 0.14], w.darkSteelMat, [i * 2.4, 0.39, bz + dz]);
    // The slab: sawn on top, rough at the ends, with its cut half made.
    k.box(g, [4.4, 0.22, 0.95], w.basaltMat, [-1.6, 1.04, bz], null, true);
    k.box(g, [0.04, 0.22, 0.95], w.hostMats.ink, [-0.35, 1.04, bz]);
    // Two clamps on the near rail, screwed down onto the slab's edge.
    for (const cx of [-3.4, -0.6]) {
      k.box(g, [0.16, 0.34, 0.28], w.darkSteelMat, [cx, 1.18, bz + 0.58]);
      k.cyl(g, [0.025, 0.025, 0.3, 8], w.pipeMat, [cx, 1.32, bz + 0.58]);
      k.box(g, [0.3, 0.03, 0.03], w.pipeMat, [cx, 1.47, bz + 0.58]);
    }
    // A second, finished slab stood on its edge against the end of the bed.
    k.box(g, [1.5, 0.16, 0.9], w.basaltMat, [3.7, 1.04, bz], null, true);
  }

  // THE BRIDGE SAW: a portal over the bed on two legs, a rail along its beam, a carriage with the blade.
  {
    const bz = -3.0;
    for (const sx of [-6.2, 6.2]) {
      k.column(g, sx, bz, 3.0, { h: 0.3, w: 0.22 });
      k.strut(g, [sx, 0.4, bz + 0.5], [sx, 2.6, bz + 0.05], 0.03, w.darkSteelMat);
    }
    k.beam(g, 12.6, w.darkSteelMat, [0, 3.0, bz], 'x', { h: 0.34, w: 0.2 }, true);
    k.box(g, [12.4, 0.05, 0.1], w.pipeMat, [0, 3.2, bz]);
    // The carriage and its blade: a toothed disc a metre across, its edge a hand above the slab.
    const cxs = 0.8;
    k.box(g, [1.0, 0.9, 0.7], w.plateMat, [cxs, 2.55, bz], null, true);
    k.cyl(g, [0.15, 0.15, 0.5, 14], w.darkSteelMat, [cxs, 2.2, bz], [Math.PI / 2, 0, 0]);
    k.cyl(g, [0.52, 0.52, 0.035, 36], w.pipeMat, [cxs, 1.62, bz - 0.02], [Math.PI / 2, 0, 0]);
    k.cyl(g, [0.55, 0.55, 0.02, 36], w.darkSteelMat, [cxs, 1.62, bz + 0.2], [Math.PI / 2, 0, 0]);
    k.box(g, [1.2, 0.05, 0.1], w.darkSteelMat, [cxs, 2.2, bz + 0.42]);
    // The water feed to the blade: a hose from a drum on the right.
    k.cyl(g, [0.3, 0.3, 0.8, 16], w.drumMat, [4.3, 0.4, -1.5], null, true);
    k.pipe(g, [[4.3, 0.8, -1.5], [4.3, 1.4, -2.3], [cxs + 0.4, 2.4, bz + 0.2]], 0.02, M.rubber);
  }

  // SLAB RACKS on both sides: an A-frame with slabs leaning on it, edge on.
  for (const sx of [-6.4, 6.4]) {
    k.box(g, [2.0, 0.12, 1.5], w.darkSteelMat, [sx, 0.06, 0.4]);
    for (const dx of [-0.95, 0.95]) k.box(g, [0.1, 1.9, 0.1], w.darkSteelMat, [sx + dx, 0.95, 0.4], [0, 0, dx * 0.12]);
    k.box(g, [2.0, 0.1, 0.1], w.darkSteelMat, [sx, 1.6, 0.4]);
    for (let i = 0; i < 6; i++) {
      k.box(g, [0.16, 1.5, 1.15], w.basaltMat, [sx - 0.7 + i * 0.28, 0.82, 0.4], [0, 0, 0.14], true);
    }
  }

  // A hand winch on a post at the left of the bench, a jib out over the bed and a hook on a chain.
  {
    const px = -4.4, pz = -1.1;
    k.footing(g, px, pz, 0.4);
    k.cyl(g, [0.1, 0.12, 2.6, 10], w.pipeMat, [px, 1.3, pz], null, true);
    k.box(g, [0.1, 0.1, 1.7], w.darkSteelMat, [px, 2.5, pz - 0.85]);
    k.strut(g, [px, 1.2, pz - 0.1], [px, 2.45, pz - 1.5], 0.03, w.darkSteelMat);
    k.strut(g, [px, 2.45, pz - 1.6], [px, 1.6, pz - 1.6], 0.02, w.darkSteelMat, 6);
    k.ring(g, 0.09, 0.02, w.pipeMat, [px, 1.5, pz - 1.6], 'x');
  }

  // Offcuts heaped at the right front, and a work lamp on a mast beside them.
  pile(w, g, 4.9, 2.2, 1.0, 0x6a11, 0.35, 14);
  k.lampMast(g, 4.4, 3.4, { h: 3.6, arm: [-1.6, -0.6] });
  k.lampMast(g, -4.4, 3.4, { h: 3.6, arm: [1.6, -0.6] });

  const colliders = [
    { lx: 0, lz: -3.0, hw: 5.7, hd: 0.7 },
    { lx: -6.2, lz: -3.0, r: 0.45 },
    { lx: 6.2, lz: -3.0, r: 0.45 },
    { lx: -6.4, lz: 0.4, hw: 1.1, hd: 0.8 },
    { lx: 6.4, lz: 0.4, hw: 1.1, hd: 0.8 },
    { lx: -4.4, lz: -1.1, r: 0.35 },
    { lx: 4.3, lz: -1.5, r: 0.45 },
    { lx: 4.9, lz: 2.2, r: 1.0 },
    { lx: 4.4, lz: 3.4, r: 0.3 },
    { lx: -4.4, lz: 3.4, r: 0.3 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   3. THE CRUSHER HOUSE — the jaw crusher's inspection deck (deck)
   Energy breaks stone, and the crusher is where it is done to it. The host is
   the crusher with its housing: a feed belt climbs to the hopper from behind,
   the flywheels stand either side of the jaws, a catwalk crosses the front of
   the machine above the bench, and what comes out falls to a pile at the left.
   The bench is the grated deck at the crusher's foot.
   ====================================================================== */

export function buildCrusherHouse(w, site) {
  const M = prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'crusher-house';

  const bench = w.buildBench({ kind: 'bond', plate: 'LB-03', skin: 'deck' });
  g.add(bench.group);

  // THE FRAME the jaws sit on: four columns, a deck of beams, the jaw body above.
  const zc = -5.0;
  for (const [x, z] of [[-2.6, zc - 1.2], [2.6, zc - 1.2], [-2.6, zc + 1.2], [2.6, zc + 1.2]]) k.column(g, x, z, 1.7, { h: 0.24, w: 0.2 });
  for (const dz of [-1.2, 1.2]) k.beam(g, 5.6, w.darkSteelMat, [0, 1.7, zc + dz], 'x', { h: 0.26, w: 0.16 });
  for (const sx of [-2.6, 2.6]) k.beam(g, 2.6, w.darkSteelMat, [sx, 1.7, zc], 'z', { h: 0.26, w: 0.16 });
  // The crusher itself: a heavy body with its cheek plates, the fixed jaw and the toggle behind.
  k.box(g, [3.6, 2.2, 2.6], w.plateMat, [0, 2.9, zc], null, true);
  k.box(g, [3.7, 0.22, 2.7], w.darkSteelMat, [0, 4.0, zc]);
  k.box(g, [3.0, 1.6, 0.18], w.pipeMat, [0, 2.9, zc + 1.38]);                      // the fixed jaw's face
  k.box(g, [0.5, 0.5, 1.0], w.darkSteelMat, [0, 2.2, zc - 1.8], null, true);        // the toggle block
  k.box(g, [0.14, 0.14, 1.5], w.pipeMat, [0, 2.9, zc - 1.9]);                       // the toggle plate
  // Two flywheels either side of the jaw body, belt-driven, with their guard rings.
  for (const sx of [-1, 1]) {
    k.cyl(g, [1.05, 1.05, 0.26, 28], w.darkSteelMat, [sx * 2.4, 2.9, zc], [0, 0, Math.PI / 2], true);
    k.cyl(g, [0.3, 0.3, 0.4, 14], w.pipeMat, [sx * 2.4, 2.9, zc], [0, 0, Math.PI / 2]);
    k.ring(g, 1.1, 0.04, w.pipeMat, [sx * 2.55, 2.9, zc], 'x');
  }
  // The feed hopper over the jaws, and the chute under them.
  k.cyl(g, [1.9, 0.85, 1.0, 4], w.plateMat, [0, 4.6, zc], [0, Math.PI / 4, 0], true);
  k.box(g, [1.7, 0.1, 1.6], w.darkSteelMat, [0, 4.0, zc]);
  k.box(g, [1.0, 0.07, 3.0], w.plateMat, [-0.6, 1.3, zc], [0, 0, 0.5]);              // the discharge chute, falling left
  k.box(g, [0.06, 0.2, 3.0], w.darkSteelMat, [-1.02, 1.4, zc], [0, 0, 0.5]);

  // THE FEED BELT climbing from low behind to the hopper's lip, on trestles.
  {
    const a = [0, 1.0, -13.2], b = [0, 4.7, zc - 1.9];
    const len = Math.hypot(b[1] - a[1], b[2] - a[2]);
    const tilt = -Math.atan2(b[1] - a[1], b[2] - a[2]);
    k.box(g, [1.2, 0.24, len], M.rubber, [0, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [tilt, 0, 0], true);
    for (const dx of [-0.66, 0.66]) k.box(g, [0.08, 0.3, len], w.darkSteelMat, [dx, (a[1] + b[1]) / 2 + 0.1, (a[2] + b[2]) / 2], [tilt, 0, 0]);
    for (const t of [0.15, 0.4, 0.65, 0.9]) {
      const z = a[2] + (b[2] - a[2]) * t, y = a[1] + (b[1] - a[1]) * t;
      for (const dx of [-0.8, 0.8]) k.column(g, dx, z, y - 0.15, { h: 0.14, w: 0.12 });
    }
    // The tail pulley and its small feed hopper where the loader tips.
    k.cyl(g, [0.5, 0.2, 0.7, 4], w.plateMat, [0, 1.6, -13.4], [0, Math.PI / 4, 0], true);
  }

  // THE HOUSING: sheet on three sides and over the top, open to the bench, the belt passing through the back.
  {
    const hy = 3.3;
    for (const sx of [-4.4, 4.4]) k.box(g, [0.1, 6.0, 5.6], w.plateMat, [sx, 3.0, zc - 0.3], null, true);
    k.box(g, [8.9, 1.4, 0.1], w.plateMat, [0, 5.3, zc - 3.1], null, true);          // back wall, above the belt's way in
    k.box(g, [3.7, 4.6, 0.1], w.plateMat, [-2.55, 2.3, zc - 3.1]);                   // back wall, either side of it
    k.box(g, [3.7, 4.6, 0.1], w.plateMat, [2.55, 2.3, zc - 3.1]);
    for (let i = 0; i < 4; i++) {
      const sh = new THREE.Mesh(w.own(corrugatedGeometry(2.3, 6.2)), w.plateMat);
      sh.position.set(-3.4 + i * 2.27, 6.1, zc - 0.5);
      sh.castShadow = sh.receiveShadow = w.t4;
      k.beam(g, 6.2, w.darkSteelMat, [-4.4 + i * 2.2, 5.95, zc - 0.5], 'z', { h: 0.2, w: 0.12 });
      g.add(sh);
    }
    k.beam(g, 9.0, w.darkSteelMat, [0, 5.95, zc + 2.45], 'x', { h: 0.22, w: 0.14 });
    for (const sx of [-4.4, 4.4]) { k.column(g, sx, zc + 2.45, 5.9, { h: 0.2, w: 0.16 }); k.column(g, sx, zc - 3.1, 5.9, { h: 0.2, w: 0.16 }); }
    void hy;
  }

  // THE INSPECTION CATWALK across the machine's front, above the bench's work volume, on legs at both ends,
  // with a handrail and a ladder up at the right.
  {
    const cy = 2.9, cz = zc + 2.1;
    for (let i = 0; i < 11; i++) k.box(g, [0.78, 0.05, 1.0], w.plateMat, [-3.9 + i * 0.78, cy, cz]);
    k.beam(g, 8.4, w.darkSteelMat, [0, cy - 0.12, cz - 0.45], 'x', { h: 0.16, w: 0.1 });
    k.beam(g, 8.4, w.darkSteelMat, [0, cy - 0.12, cz + 0.45], 'x', { h: 0.16, w: 0.1 });
    for (const sx of [-4.1, 4.1]) for (const dz of [-0.4, 0.4]) k.column(g, sx, cz + dz, cy - 0.15, { h: 0.14, w: 0.12 });
    k.box(g, [8.4, 0.05, 0.05], w.pipeMat, [0, cy + 1.05, cz + 0.5]);
    k.box(g, [8.4, 0.05, 0.05], w.pipeMat, [0, cy + 0.55, cz + 0.5]);
    for (let i = 0; i < 6; i++) k.box(g, [0.05, 1.05, 0.05], w.pipeMat, [-4.0 + i * 1.6, cy + 0.55, cz + 0.5]);
    // The ladder: two stiles and rungs, at the right end.
    for (const dz of [-0.2, 0.2]) k.box(g, [0.05, cy + 0.9, 0.05], w.darkSteelMat, [4.55, (cy + 0.9) / 2, cz + dz + 0.5]);
    for (let i = 0; i < 9; i++) k.box(g, [0.05, 0.04, 0.4], w.darkSteelMat, [4.55, 0.3 + i * 0.32, cz + 0.5]);
  }

  // WHAT COMES OUT: a pile of crushed stone under the discharge chute at the left, and the lamps in the housing.
  pile(w, g, -4.6, zc, 1.4, 0xc4c4, 0.9, 30);
  g.add(w.buildLuminaire(-2.4, 5.0, zc + 0.6));
  g.add(w.buildLuminaire(2.4, 5.0, zc + 0.6));
  k.tag(g, 'CR-03', { w: 0.5, h: 0.19 }, [0, 3.7, zc + 1.45]);

  const colliders = [
    { lx: 0, lz: zc, hw: 3.0, hd: 1.6 },
    { lx: -2.4, lz: zc, r: 1.1 },
    { lx: 2.4, lz: zc, r: 1.1 },
    { lx: -4.4, lz: zc - 0.3, hw: 0.3, hd: 2.9 },
    { lx: 4.4, lz: zc - 0.3, hw: 0.3, hd: 2.9 },
    { lx: 0, lz: zc - 3.1, hw: 4.4, hd: 0.2 },
    { lx: -4.6, lz: zc, r: 1.3 },
    { lx: -4.1, lz: zc + 2.1, hw: 0.3, hd: 0.5 },
    { lx: 4.1, lz: zc + 2.1, hw: 0.3, hd: 0.5 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   4. THE SCALE HOUSE — the weighbridge's desk (desk)
   A small riveted cabin with the dial on its face, big enough to read from the
   weigh deck, which is the whole point of it. The bench is the control desk in
   front of the cabin; the weigh deck lies on its right on four load cells.
   ====================================================================== */

export function buildScaleHouse(w, site) {
  const M = prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'scale-house';

  const bench = w.buildBench({ kind: 'pair', plate: 'LB-04', skin: 'desk' });
  g.add(bench.group);

  // THE CABIN behind the desk: riveted drum plate, a cap roof, four angle posts, a window and the door.
  const cz = -3.9;
  k.box(g, [3.2, 2.6, 2.6], w.drumMat, [0, 1.3, cz], null, true);
  k.box(g, [3.6, 0.12, 3.0], w.plateMat, [0, 2.66, cz], null, true);
  for (const [px, pz] of [[-1.62, cz - 1.32], [1.62, cz - 1.32], [-1.62, cz + 1.32], [1.62, cz + 1.32]]) k.box(g, [0.12, 2.6, 0.12], w.darkSteelMat, [px, 1.3, pz]);
  k.box(g, [0.05, 0.6, 0.9], M.glass, [1.63, 1.7, cz]);
  k.box(g, [0.06, 1.9, 0.8], w.plateMat, [-0.6, 0.98, cz - 1.33]);

  // THE DIAL on the cabin's face: a big round scale, graduated, its needle on the bottom stop — it reads
  // nothing because nothing is on the bridge, which is what an honest instrument does.
  {
    const dx = 0.3, dy = 1.62, dz = cz + 1.31;
    k.cyl(g, [0.62, 0.62, 0.02, 36], M.face, [dx, dy, dz], [Math.PI / 2, 0, 0]);
    k.ring(g, 0.64, 0.05, w.darkSteelMat, [dx, dy, dz + 0.01]);
    for (let i = 0; i < 21; i++) {
      const a = -Math.PI * 0.78 + (i / 20) * Math.PI * 1.56;
      const major = i % 5 === 0;
      const r = major ? 0.5 : 0.53;
      k.box(g, [0.014, major ? 0.11 : 0.064, 0.006], M.ink, [dx + Math.sin(a) * r, dy + Math.cos(a) * r, dz + 0.016], [0, 0, -a]);
    }
    k.box(g, [0.02, 0.5, 0.01], M.ink, [dx - 0.17, dy - 0.15, dz + 0.02], [0, 0, 0.78]);
    k.cyl(g, [0.045, 0.045, 0.03, 12], w.darkSteelMat, [dx, dy, dz + 0.025], [Math.PI / 2, 0, 0]);
  }

  // Test weights racked against the cabin: cast blocks with lifting eyes, behind the desk's left end.
  for (let i = 0; i < 4; i++) {
    k.box(g, [0.36, 0.28, 0.24], w.pipeMat, [-2.0, 0.14 + i * 0.29, cz + 1.0]);
    k.ring(g, 0.05, 0.014, w.darkSteelMat, [-2.0, 0.33 + i * 0.29, cz + 1.0], 'x');
  }

  // THE WEIGH DECK, to the right: a plate on four cells standing a hand proud of the deck it is let into,
  // with a gap all round — a weighbridge that touched its surround would weigh the surround.
  {
    const bx = 5.0, bz = 0.0;
    k.box(g, [3.4, 0.24, 6.4], w.treadMat, [bx, 0.16, bz], null, true);
    for (const [cx, czz] of [[bx - 1.4, bz - 2.7], [bx + 1.4, bz - 2.7], [bx - 1.4, bz + 2.7], [bx + 1.4, bz + 2.7]]) {
      k.cyl(g, [0.2, 0.24, 0.16, 12], w.pipeMat, [cx, 0.06, czz]);
    }
    for (const dx of [-1.62, 1.62]) k.box(g, [0.1, 0.18, 6.4], w.darkSteelMat, [bx + dx, 0.34, bz]);
    // Cables from the cells back along the deck to the cabin, laid on the ground.
    k.pipe(g, [[bx - 1.4, 0.06, bz - 2.7], [bx - 1.4, 0.04, cz + 1.9], [1.7, 0.04, cz + 1.9]], 0.014, w.darkSteelMat);
    for (const sx of [-1.4, 1.4]) {
      const stripe = hazardStripe(0.42, 6.4, { pitch: 0.18 });
      stripe.rotation.set(-Math.PI / 2, 0, 0);
      stripe.position.set(bx + sx * 1.0, 0.29, bz);
      g.add(stripe);
      w.own(stripe.geometry, stripe.material, stripe.material.map);
    }
  }

  k.lampMast(g, -3.6, 1.6, { h: 3.4, arm: [1.6, -0.4] });
  g.add(w.buildLuminaire(0, 2.9, cz + 1.8));
  k.tag(g, 'WB-04', { w: 0.44, h: 0.17 }, [-1.1, 2.3, cz + 1.31]);

  const colliders = [
    { lx: 0, lz: cz, hw: 1.7, hd: 1.4 },
    { lx: 5.0, lz: 0, hw: 1.8, hd: 3.3 },
    { lx: -3.6, lz: 1.6, r: 0.3 },
    { lx: -2.0, lz: cz + 1.0, hw: 0.3, hd: 0.2 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   5. THE MINE SUBSTATION — at hill A's main portal (deck)
   Two charged plates stand on insulators at either side of the bench: the
   substation's bus bars, one marked as the positive, one as the negative. A
   transformer and its switchgear stand behind, the bushings reaching up to the
   bars. The bench is the inspection deck between them.
   ====================================================================== */

export function buildSubstation(w, site) {
  const M = prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'substation';

  k.box(g, [14.0, 0.12, 8.6], M.footing, [0, -0.06, -2.7]);
  const bench = w.buildBench({ kind: 'pair', plate: 'LB-05', skin: 'deck' });
  g.add(bench.group);

  // THE BUS BARS: two tall plates on porcelain stacks, the sign of each stencilled on its top (a cross on the
  // left plate, a bar on the right).
  const colliders = [];
  for (const sx of [-1, 1]) {
    const x = sx * 4.5, z = -1.2;
    k.box(g, [0.1, 2.4, 1.8], w.plateMat, [x, 1.9, z], null, true);
    for (const dz of [-0.6, 0.6]) {
      k.cyl(g, [0.1, 0.1, 0.6, 10], M.porcelain, [x, 0.38, z + dz]);
      for (let i = 0; i < 3; i++) k.cyl(g, [0.17, 0.17, 0.04, 12], M.porcelain, [x, 0.18 + i * 0.15, z + dz]);
      k.box(g, [0.5, 0.06, 0.5], w.darkSteelMat, [x, 0.03, z + dz]);
    }
    k.box(g, [0.04, 0.5, 0.1], w.darkSteelMat, [x - sx * 0.07, 3.35, z]);
    if (sx < 0) k.box(g, [0.04, 0.1, 0.5], w.darkSteelMat, [x - sx * 0.07, 3.35, z]);
    colliders.push({ lx: x, lz: z, hw: 0.4, hd: 1.0 });
  }

  // THE TRANSFORMER behind the bench: tank, radiator fins, a conservator on top, three bushings, the bars led
  // out to the plates well above the bay.
  {
    const tz = -3.7;
    k.box(g, [2.8, 2.0, 1.7], w.plateMat, [0, 1.2, tz], null, true);
    k.box(g, [3.0, 0.14, 1.9], w.darkSteelMat, [0, 0.07, tz]);
    for (let i = 0; i < 9; i++) k.box(g, [0.05, 1.6, 0.5], w.darkSteelMat, [-1.2 + i * 0.3, 1.1, tz - 1.1]);
    k.cyl(g, [0.34, 0.34, 2.2, 16], w.drumMat, [0, 2.75, tz - 0.3], [0, 0, Math.PI / 2], true);
    for (const bx of [-0.8, 0, 0.8]) {
      k.cyl(g, [0.08, 0.08, 0.7, 10], M.porcelain, [bx, 2.55, tz + 0.4]);
      for (let i = 0; i < 3; i++) k.cyl(g, [0.15, 0.15, 0.04, 12], M.porcelain, [bx, 2.4 + i * 0.16, tz + 0.4]);
    }
    // The bars: copper pipe from the outer bushings up and out to the plates, over the bay (y > 2.4).
    k.pipe(g, [[-0.8, 2.95, tz + 0.4], [-0.8, 3.35, tz + 0.4], [-4.45, 3.35, -1.5]], 0.03, M.copper);
    k.pipe(g, [[0.8, 2.95, tz + 0.4], [0.8, 3.35, tz + 0.4], [4.45, 3.35, -1.5]], 0.03, M.copper);
    colliders.push({ lx: 0, lz: tz, hw: 1.6, hd: 1.0 });
  }

  // THE SWITCHGEAR: four cabinets in a row against the back, one door standing ajar.
  for (let i = 0; i < 4; i++) {
    k.box(g, [1.0, 2.2, 0.8], w.drumMat, [-1.65 + i * 1.1, 1.1, -5.0], null, true);
    k.box(g, [0.5, 0.5, 0.02], M.glass, [-1.65 + i * 1.1, 1.7, -4.58]);
  }
  k.box(g, [0.04, 2.1, 0.8], w.darkSteelMat, [2.3, 1.1, -4.7], [0, 0.9, 0]);
  colliders.push({ lx: 0, lz: -5.0, hw: 2.3, hd: 0.5 });

  // THE EARTH MAT and a lightning mast, and the work lamps.
  k.lampMast(g, -3.2, 2.4, { h: 3.8, arm: [1.5, -0.5] });
  k.lampMast(g, 3.2, 2.4, { h: 3.8, arm: [-1.5, -0.5] });
  colliders.push({ lx: -3.2, lz: 2.4, r: 0.3 }, { lx: 3.2, lz: 2.4, r: 0.3 });
  k.tag(g, 'SS-05', { w: 0.5, h: 0.19 }, [0, 2.2, -4.58]);

  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   2. THE ORE DRIFT — just inside the main adit (ledge)
   Where a vein of metal crosses the basalt, stone and wire lie side by side:
   a slab of the country rock with a seam of copper through it on a stand, and
   coils of drawn wire beside it. The forge is here (it moved from the lava
   tube): a hearth, bellows, an anvil and a quench trough, and the flue goes up
   through the hill. The fire is the only red light in the world.
   ====================================================================== */

export function buildOreDrift(w, site) {
  const M = prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'ore-drift';

  const bench = w.buildBench({ kind: 'join', plate: 'LB-02', skin: 'ledge' });
  g.add(bench.group);

  // THE HEARTH, against the left wall: a stone box with a steel grate, a hood and a flue up through the roof.
  const HX = -4.0, HZ = -0.4;
  k.box(g, [1.9, 0.86, 1.3], w.basaltMat, [HX, 0.43, HZ], null, true);
  k.box(g, [1.5, 0.06, 1.0], w.darkSteelMat, [HX, 0.88, HZ]);
  for (let i = 0; i < 7; i++) k.box(g, [0.05, 0.08, 1.0], w.pipeMat, [HX - 0.64 + i * 0.21, 0.92, HZ]);
  // THE FIRE: emissive coals and a light on them. A fire is a lamp in the sense the aesthetic allows: it is
  // literally a source, and it is the reason this end of the drift is lit red.
  w.forgeCoals = new THREE.Mesh(
    w.own(new THREE.BoxGeometry(1.3, 0.14, 0.8)),
    w.own(new THREE.MeshStandardMaterial({ color: 0x2a1006, emissive: FORGE, emissiveIntensity: 2.3, roughness: 0.9 }))
  );
  w.forgeCoals.position.set(HX, 0.99, HZ);
  w.forgeCoals.userData.noMerge = true;
  g.add(w.forgeCoals);
  w.forgeLight = new THREE.PointLight(FORGE, 16, 15, 1.7);
  w.forgeLight.position.set(HX, 1.5, HZ);
  if (w.t4) {
    w.forgeLight.castShadow = true;
    w.forgeLight.shadow.mapSize.set(512, 512);
    w.forgeLight.shadow.bias = -0.004;
    // A point light's shadow is six renders of the scene and three.js re-draws all six every frame by default,
    // for a fire that does not move in a stone room where nothing else does either. Drawn once, and again only
    // while an instrument is worked beside it (`update`).
    w.forgeLight.shadow.autoUpdate = false;
    w.forgeLight.shadow.needsUpdate = true;
  }
  g.add(w.forgeLight);
  // The hood is a four-sided frustum turned on the diagonal; its box is wider than it looks, so it is drawn in.
  k.cyl(g, [0.2, 0.8, 1.0, 4], w.drumMat, [HX, 2.0, HZ], [0, Math.PI / 4, 0], true);
  k.cyl(g, [0.26, 0.26, 2.2, 12], w.pipeMat, [HX, 3.6, HZ]);
  // Bellows on a timber frame, handle down; a fuel bin and its coal.
  k.box(g, [0.52, 0.36, 1.0], w.timberMat, [HX - 0.6, 1.05, HZ - 1.5]);
  k.cyl(g, [0.03, 0.03, 1.0, 6], w.timberMat, [HX - 0.6, 0.9, HZ - 1.0], [0, 0, 0.5]);
  k.box(g, [0.12, 0.7, 0.12], w.timberMat, [HX - 0.6, 0.35, HZ - 1.9]);
  k.box(g, [1.0, 0.7, 0.9], w.darkSteelMat, [4.0, 0.35, -1.2], null, true);
  pile(w, g, 4.0, -1.2, 0.3, 0x9e17, 0.15, 8).position.y = 0.7;

  // THE ANVIL on its stump, and THE QUENCH TROUGH: heat a block, hit it, put it in the water.
  k.cyl(g, [0.34, 0.4, 0.6, 12], w.timberMat, [-3.9, 0.3, 1.5], null, true);
  k.box(g, [0.9, 0.2, 0.28], w.pipeMat, [-3.9, 0.7, 1.5], null, true);
  k.box(g, [0.34, 0.22, 0.24], w.pipeMat, [-3.9, 0.49, 1.5]);
  k.cyl(g, [0.0, 0.11, 0.42, 10], w.pipeMat, [-3.24, 0.7, 1.5], [0, 0, -Math.PI / 2]);
  k.box(g, [0.66, 0.46, 1.4], w.drumMat, [3.9, 0.23, 3.0], null, true);
  k.box(g, [0.54, 0.02, 1.26], M.water, [3.9, 0.4, 3.0]);
  // A rack of tongs on the right wall.
  k.box(g, [0.1, 1.4, 1.2], w.darkSteelMat, [5.0, 0.8, 1.2]);
  for (let i = 0; i < 4; i++) k.box(g, [0.04, 0.8, 0.04], w.pipeMat, [4.9, 1.0, 0.75 + i * 0.3], [0, 0, (i % 2 ? 1 : -1) * 0.08]);

  // THE VEIN: a slab of the country rock on a plinth with a seam of copper crossing it, and a second piece,
  // struck, showing the seam's face. Stone and wire side by side.
  {
    const sx = 3.9, sz = -0.3;
    k.box(g, [0.9, 0.5, 0.9], w.darkSteelMat, [sx, 0.25, sz]);
    k.box(g, [0.9, 1.1, 0.34], w.basaltMat, [sx, 1.05, sz], [0, 0.5, 0.0], true);
    k.box(g, [0.2, 1.3, 0.1], M.copper, [sx + 0.02, 1.07, sz + 0.16], [0, 0.5, 0.45]);
    k.box(g, [0.9, 0.5, 0.6], w.basaltMat, [4.3, 0.25, 5.2], [0, 0.3, 0], true);
    k.box(g, [0.1, 0.55, 0.45], M.copper, [4.3, 0.26, 5.2], [0, 0.3, 0.2]);
  }
  // THE WIRE: two drums of drawn copper on a spindle beside it, and a coil on the wall.
  for (const dz of [-1.9, -1.2]) {
    k.cyl(g, [0.5, 0.5, 0.06, 20], w.darkSteelMat, [4.5, 0.55, dz], [Math.PI / 2, 0, 0]);
    k.cyl(g, [0.5, 0.5, 0.06, 20], w.darkSteelMat, [4.5, 0.55, dz + 0.5], [Math.PI / 2, 0, 0]);
    k.cyl(g, [0.42, 0.42, 0.44, 20], M.copper, [4.5, 0.55, dz + 0.25], [Math.PI / 2, 0, 0]);
  }
  // THE ROOF's way for the flue and the lamps.
  k.chamberLamps(g);
  // THE BENCH LAMP: under a hill only lamps light, and a bench is worked with the eyes on the plate, so one hangs over the back of it,
  // above the bay's air (the camera's lean-in view stands in front of it). A `lampMark` in the pool, no light of its own.
  g.add(w.buildLuminaire(0, 3.7, -1.0, UNDERGROUND_LAMP));

  // THE CHISEL AND THE LUMP HAMMER lying on the vein's plinth: where a block is chipped from the seam.
  k.box(g, [0.5, 0.05, 0.07], w.pipeMat, [3.9, 0.52, 0.34], [0, 0.3, 0]);
  k.box(g, [0.34, 0.1, 0.1], w.pipeMat, [3.5, 0.55, 0.38], [0, 0, 0]);
  k.cyl(g, [0.025, 0.025, 0.4, 6], w.timberMat, [3.3, 0.54, 0.38], [0, 0, Math.PI / 2]);

  // NO FIELD POINT. The seam chip was retired (2026-10-23 rollout): it carried a block the bench already held, so it was pure carrying
  // (a fetch stays only where what is fetched is new evidence).
  const fieldPoints = [];

  const colliders = [
    { lx: HX, lz: HZ, hw: 1.0, hd: 0.7 },
    { lx: HX - 0.6, lz: HZ - 1.5, hw: 0.3, hd: 0.55 },
    { lx: 4.0, lz: -1.2, hw: 0.55, hd: 0.5 },
    { lx: -3.9, lz: 1.5, r: 0.55 },
    { lx: 3.9, lz: 3.0, hw: 0.4, hd: 0.75 },
    { lx: 3.9, lz: -0.3, hw: 0.55, hd: 0.55 },
    { lx: 4.3, lz: 5.2, hw: 0.5, hd: 0.4 },
    { lx: 4.5, lz: -1.5, hw: 0.55, hd: 0.8 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

/* ======================================================================
   6. THE DRILL CHAMBER (ledge)
   A rock-bolt pattern board across the back wall, a grid of holes with the
   bolts that have been driven, and the drill jumbo parked at the left with its
   booms folded; its control stand is at the right. Where the roof has to be
   held, this is where the pattern is decided.
   ====================================================================== */

export function buildDrillChamber(w, site) {
  const M = prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'drill-chamber';

  const bench = w.buildBench({ kind: 'rig', plate: 'LB-06', skin: 'ledge' });
  g.add(bench.group);

  // THE PATTERN BOARD: a steel plate, a grid of drilled holes, and bolts driven through some of them.
  {
    const bz = -2.68;
    k.box(g, [5.4, 2.5, 0.08], w.plateMat, [0, 2.6, bz]);
    for (const [bx, by, bw, bh] of [[0, 3.87, 5.5, 0.1], [0, 1.33, 5.5, 0.1], [-2.7, 2.6, 0.1, 2.6], [2.7, 2.6, 0.1, 2.6]]) k.box(g, [bw, bh, 0.12], w.darkSteelMat, [bx, by, bz + 0.01]);
    const driven = new Set(['0,0', '2,1', '4,0', '1,2', '3,3', '5,2', '6,1', '0,3', '2,4', '4,4', '6,3']);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 7; c++) {
        const x = -2.4 + c * 0.8, y = 1.7 + r * 0.48 + (c % 2 ? 0.0 : 0.0);
        k.cyl(g, [0.07, 0.07, 0.02, 12], M.black, [x, y, bz + 0.05], [Math.PI / 2, 0, 0]);
        if (driven.has(`${c},${r}`)) {
          k.cyl(g, [0.035, 0.035, 0.26, 8], w.pipeMat, [x, y, bz + 0.17], [Math.PI / 2, 0, 0]);
          k.box(g, [0.18, 0.18, 0.03], w.darkSteelMat, [x, y, bz + 0.31]);
        }
      }
    }
    k.tag(g, 'RB-06', { w: 0.5, h: 0.19 }, [0, 4.1, bz + 0.05]);
  }

  // THE DRILL JUMBO at the left: tracked carrier, a cab, and two booms folded forward with their feeds.
  {
    const jx = -4.1;
    for (const dx of [-0.8, 0.8]) k.box(g, [0.5, 0.5, 3.7], w.darkSteelMat, [jx + dx, 0.25, 0.9], null, true);
    for (const dx of [-0.8, 0.8]) for (let i = 0; i < 7; i++) k.box(g, [0.52, 0.06, 0.1], w.pipeMat, [jx + dx, 0.51, -0.8 + i * 0.52]);
    k.box(g, [1.9, 0.7, 3.2], w.plateMat, [jx, 0.85, 0.9], null, true);
    k.box(g, [1.3, 1.3, 1.1], w.drumMat, [jx, 1.85, 1.9], null, true);
    k.box(g, [1.0, 0.7, 0.04], M.glass, [jx, 2.0, 2.46]);
    k.cyl(g, [0.3, 0.3, 1.5, 14], w.darkSteelMat, [jx, 1.7, -0.3], [Math.PI / 2, 0, 0]);
    for (const bx of [jx - 0.55, jx + 0.55]) {
      k.strut(g, [bx, 1.5, 0.2], [bx * 0.9 + (bx > jx ? 0.1 : -0.1), 3.0, 3.6], 0.07, w.pipeMat);
      k.box(g, [0.16, 0.16, 1.7], w.darkSteelMat, [bx * 0.9 + (bx > jx ? 0.1 : -0.1), 3.0, 4.3], [0.0, 0, 0], true);
      k.cyl(g, [0.04, 0.04, 1.6, 8], M.brass, [bx * 0.9 + (bx > jx ? 0.1 : -0.1), 3.0, 4.3], [Math.PI / 2, 0, 0]);
    }
    // The control stand at the right: levers, a gauge, and the cable running back along the wall to the carrier.
    k.box(g, [0.8, 1.1, 0.6], w.drumMat, [4.0, 0.55, 0.9], null, true);
    k.box(g, [0.9, 0.08, 0.7], w.darkSteelMat, [4.0, 1.12, 0.9]);
    for (let i = 0; i < 4; i++) {
      k.strut(g, [3.7 + i * 0.2, 1.14, 0.8], [3.7 + i * 0.2 + (i % 2 ? 0.08 : -0.06), 1.5, 0.9], 0.016, w.pipeMat, 6);
      k.cyl(g, [0.035, 0.035, 0.05, 8], M.copper, [3.7 + i * 0.2 + (i % 2 ? 0.08 : -0.06), 1.52, 0.9]);
    }
    k.cyl(g, [0.12, 0.12, 0.04, 16], M.face, [4.0, 0.92, 0.58], [Math.PI / 2, 0, 0]);
    k.pipe(g, [[4.0, 0.3, 0.7], [4.0, 0.15, -2.5], [jx, 0.15, -2.5], [jx, 0.5, -1.4]], 0.03, M.rubber);
    // Rock bolts in a crate and a rack of drill steel on the right wall.
    k.box(g, [0.9, 0.5, 0.6], w.timberMat, [4.4, 0.25, 3.4], null, true);
    for (let i = 0; i < 6; i++) k.cyl(g, [0.025, 0.025, 1.2, 6], w.pipeMat, [4.15 + i * 0.1, 0.56, 3.4], [Math.PI / 2, 0, 0.05]);
    k.box(g, [0.1, 1.6, 1.4], w.darkSteelMat, [5.1, 0.8, 5.0]);
    for (let i = 0; i < 5; i++) k.cyl(g, [0.025, 0.025, 1.7, 6], w.pipeMat, [4.9, 0.9, 4.5 + i * 0.2]);
    void jx;
  }
  k.chamberLamps(g);
  // THE BENCH LAMP: under a hill only lamps light, and a bench is worked with the eyes on the plate, so one hangs over the back of it,
  // above the bay's air. A `lampMark` in the pool, no light of its own.
  g.add(w.buildLuminaire(0, 3.7, -1.0, UNDERGROUND_LAMP));
  // AN ORE TUB AND A MINER'S PICK at the side of the plate, the host's own tools within the table's reach: the lean-in view shows them at the edge of the plate.
  const tub = (x, z, d = 1) => {
    k.cyl(g, [0.34, 0.28, 0.5, 14], w.drumMat, [x, 0.25, z], null, true);
    k.cyl(g, [0.35, 0.35, 0.05, 14], w.darkSteelMat, [x, 0.5, z]);
    pile(w, g, x, z, 0.2, 0x3a11 + Math.round(x * 7), 0.12, 6).position.y = 0.52;
    k.strut(g, [x + d * 0.3, 0.45, z - 0.05], [x + d * 0.5, 1.05, z - 0.3], 0.025, w.timberMat, 6);
    k.box(g, [0.34, 0.05, 0.05], w.pipeMat, [x + d * 0.5, 1.07, z - 0.3], [0, 0.5 * d, 0.2]);
  };
  tub(3.1, -0.9);

  const colliders = [
    { lx: 3.1, lz: -0.9, r: 0.5 },
    { lx: -4.1, lz: 0.9, hw: 1.3, hd: 1.9 },
    { lx: -4.1, lz: 3.0, hw: 0.9, hd: 0.8 },
    { lx: 4.0, lz: 0.9, hw: 0.5, hd: 0.4 },
    { lx: 4.4, lz: 3.4, hw: 0.5, hd: 0.35 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   7. THE SUMP AND PUMP STATION (ledge)
   Water runs downhill and the decline runs downhill: it gathers here, in a
   steel sump at the left, and two pumps at the right lift it out through a
   main that climbs the wall and goes up through the hill. The suction lines
   cross the back of the chamber from the sump to the pumps.
   ====================================================================== */

export function buildSumpStation(w, site) {
  const M = prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'sump-station';

  const bench = w.buildBench({ kind: 'rig', plate: 'LB-07', skin: 'ledge' });
  g.add(bench.group);

  // THE SUMP: an open steel tank at the right with dark water standing in it, a float on a rod and a gauge post.
  {
    const sx = 3.9, sz = 2.2;
    for (const [bx, bz, w2, d2] of [[sx - 1.1, sz, 0.12, 2.8], [sx + 1.1, sz, 0.12, 2.8], [sx, sz - 1.4, 2.3, 0.12], [sx, sz + 1.4, 2.3, 0.12]]) {
      k.box(g, [w2, 0.95, d2], w.drumMat, [bx, 0.48, bz], null, true);
    }
    k.box(g, [2.2, 0.06, 2.7], w.darkSteelMat, [sx, 0.03, sz]);
    k.box(g, [2.1, 0.02, 2.6], M.water, [sx, 0.78, sz]);
    k.cyl(g, [0.12, 0.12, 0.1, 12], w.pipeMat, [sx - 0.3, 0.8, sz - 0.3]);
    k.cyl(g, [0.015, 0.015, 1.5, 6], w.pipeMat, [sx - 0.3, 1.5, sz - 0.3]);
    k.box(g, [0.1, 1.5, 0.1], w.darkSteelMat, [sx - 1.25, 0.75, sz + 1.2]);
    k.cyl(g, [0.1, 0.1, 0.04, 14], M.face, [sx - 1.25, 1.4, sz + 1.12], [Math.PI / 2, 0, 0]);
    // A grating walk-over across one end, so the sump can be looked into.
    for (let i = 0; i < 5; i++) k.box(g, [0.5, 0.04, 0.06], w.plateMat, [sx - 0.9 + i * 0.45, 0.98, sz + 1.0]);
  }

  // THE PUMPS at the left: a motor over a volute on a plinth, twice; a main up the wall, through the roof.
  for (const pz of [-0.6, 1.6]) {
    k.box(g, [1.0, 0.3, 1.0], w.darkSteelMat, [-4.0, 0.15, pz], null, true);
    k.cyl(g, [0.38, 0.4, 0.5, 18], w.pipeMat, [-4.0, 0.55, pz], null, true);
    k.cyl(g, [0.32, 0.32, 0.9, 18], w.drumMat, [-4.0, 1.25, pz], null, true);
    k.cyl(g, [0.34, 0.34, 0.06, 18], w.darkSteelMat, [-4.0, 1.72, pz]);
    k.pipe(g, [[-4.4, 0.55, pz], [-4.95, 0.55, pz], [-4.95, 3.6, pz]], 0.1, w.pipeMat);
    k.box(g, [0.5, 0.6, 0.3], w.plateMat, [-4.0, 0.9, pz - 0.7]);
  }
  k.pipe(g, [[-4.95, 3.6, -0.6], [-4.95, 3.6, 1.6], [-4.95, 4.6, 1.6]], 0.1, w.pipeMat);
  // THE SUCTION, laid along the back from the sump to the pumps, well behind the bench.
  k.pipe(g, [[3.9, 0.45, 1.0], [3.9, 0.45, -2.4], [-3.6, 0.45, -2.4], [-3.6, 0.45, -0.6], [-3.8, 0.55, -0.6]], 0.09, w.pipeMat);
  k.pipe(g, [[-3.6, 0.45, -2.4], [-3.6, 0.45, 1.6], [-3.8, 0.55, 1.6]], 0.07, w.pipeMat);
  // The starter panel on the right wall, and a cable tray along the back at the height of the roof.
  k.box(g, [0.14, 1.3, 1.0], w.drumMat, [5.1, 1.4, 5.2]);
  k.box(g, [0.04, 1.2, 0.9], M.glass, [5.0, 1.4, 5.2]);
  k.box(g, [10.0, 0.05, 0.3], w.darkSteelMat, [0, 3.55, -2.6]);
  k.chamberLamps(g);
  g.add(w.buildLuminaire(0, 3.7, -1.0, UNDERGROUND_LAMP));
  // AN ORE TUB AND A MINER'S PICK at the side of the plate, the host's own tools within the table's reach: the lean-in view shows them at the edge of the plate.
  const tub = (x, z, d = 1) => {
    k.cyl(g, [0.34, 0.28, 0.5, 14], w.drumMat, [x, 0.25, z], null, true);
    k.cyl(g, [0.35, 0.35, 0.05, 14], w.darkSteelMat, [x, 0.5, z]);
    pile(w, g, x, z, 0.2, 0x3a11 + Math.round(x * 7), 0.12, 6).position.y = 0.52;
    k.strut(g, [x + d * 0.3, 0.45, z - 0.05], [x + d * 0.5, 1.05, z - 0.3], 0.025, w.timberMat, 6);
    k.box(g, [0.34, 0.05, 0.05], w.pipeMat, [x + d * 0.5, 1.07, z - 0.3], [0, 0.5 * d, 0.2]);
  };
  tub(-3.3, -1.0, -1);

  // THE DRAW-OFF: a cock on the sump's front wall with a stub over a catch bucket, and the sump's own water running from it in a thin
  // stream. A real piece of this host (the bleed on the sump), the player stands in front of it (`stand`, host frame) and `[E]` on it
  // draws a stream from the sump for the bench.
  {
    const dx = 3.9, dz = 3.6;
    k.strut(g, [dx, 1.3, dz - 0.1], [dx, 1.3, dz + 0.45], 0.045, w.pipeMat, 8);
    k.cyl(g, [0.075, 0.075, 0.12, 12], M.brass, [dx, 1.3, dz + 0.2], [Math.PI / 2, 0, 0]);
    k.box(g, [0.16, 0.04, 0.04], M.brass, [dx, 1.4, dz + 0.2]);
    k.cyl(g, [0.012, 0.012, 0.85, 6], M.water, [dx, 0.82, dz + 0.45]);
    k.cyl(g, [0.22, 0.18, 0.34, 14], w.drumMat, [dx, 0.17, dz + 0.45], null, true);
    k.box(g, [0.4, 0.02, 0.4], M.water, [dx, 0.3, dz + 0.45]).scale.set(0.8, 1, 0.8);
  }
  // NO FIELD POINT. The sump stream was retired (2026-10-23 rollout): it was the same water as the stream already on the bench.
  const fieldPoints = [];

  const colliders = [
    { lx: -3.3, lz: -1.0, r: 0.5 },
    { lx: 3.9, lz: 4.05, r: 0.3 },
    { lx: 3.9, lz: 2.2, hw: 1.2, hd: 1.5 },
    { lx: -4.0, lz: -0.6, r: 0.6 },
    { lx: -4.0, lz: 1.6, r: 0.6 },
    { lx: 5.1, lz: 5.2, hw: 0.2, hd: 0.55 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

/* ======================================================================
   8. THE SURVEY STATION — the junction of three drifts (ledge)
   Where three drifts meet, the mine is fixed to the world: a theodolite on its
   tripod over a station mark, plumb lines hung from the roof, a plan table, and
   the stakes a surveyor drives. The bench is where a sight is read.
   ====================================================================== */

export function buildSurveyStation(w, site) {
  const M = prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'survey-station';

  const bench = w.buildBench({ kind: 'rig', plate: 'LB-08', skin: 'ledge' });
  g.add(bench.group);

  // THE THEODOLITE on a tripod over a station mark let into the floor, at the right.
  {
    const tx = 3.8, tz = -0.4;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      k.strut(g, [tx, 1.3, tz], [tx + Math.cos(a) * 0.55, 0, tz + Math.sin(a) * 0.55], 0.025, w.timberMat, 6);
    }
    k.cyl(g, [0.12, 0.12, 0.08, 14], w.darkSteelMat, [tx, 1.32, tz]);
    k.box(g, [0.2, 0.32, 0.2], w.plateMat, [tx, 1.52, tz]);
    k.cyl(g, [0.05, 0.05, 0.4, 10], w.darkSteelMat, [tx, 1.7, tz + 0.1], [Math.PI / 2, 0, 0]);
    k.cyl(g, [0.14, 0.14, 0.04, 16], M.brass, [tx, 0.02, tz]);
    k.strut(g, [tx, 1.28, tz], [tx, 0.1, tz], 0.006, M.black, 4);
  }

  // THE PLAN TABLE at the left: a drawing sheet pinned out, a lamp, a measuring tape lying across it.
  {
    const px = -3.9, pz = -0.6;
    k.box(g, [1.7, 0.08, 1.1], w.timberMat, [px, 0.92, pz], null, true);
    for (const [dx, dz] of [[-0.75, -0.45], [0.75, -0.45], [-0.75, 0.45], [0.75, 0.45]]) k.box(g, [0.08, 0.9, 0.08], w.timberMat, [px + dx, 0.45, pz + dz]);
    k.box(g, [1.4, 0.01, 0.9], M.paper, [px, 0.97, pz]);
    for (let i = 0; i < 5; i++) k.box(g, [1.2 - i * 0.1, 0.005, 0.01], M.ink, [px - 0.05, 0.98, pz - 0.35 + i * 0.16]);
    k.cyl(g, [0.12, 0.12, 0.05, 14], w.darkSteelMat, [px + 0.55, 1.0, pz + 0.3]);
  }
  // PLUMB LINES hung from the roof at the two back corners: a cord, a bob, and the rest of the line at its foot.
  for (const sx of [-4.2, 4.2]) {
    k.box(g, [0.2, 0.04, 0.2], w.darkSteelMat, [sx, 4.35, -2.3]);
    k.strut(g, [sx, 4.3, -2.3], [sx, 0.75, -2.3], 0.006, M.rope, 4);
    k.cyl(g, [0.0, 0.09, 0.22, 10], M.brass, [sx, 0.62, -2.3]);
    k.cyl(g, [0.16, 0.16, 0.03, 14], w.darkSteelMat, [sx, 0.02, -2.3]);
  }
  // Stakes driven and bundled at the left front, a chain reel on the right wall, and the station tag.
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9;
    k.cyl(g, [0.025, 0.025, 1.0, 6], w.timberMat, [-4.7 + Math.cos(a) * 0.2, 0.5, -1.7 + Math.sin(a) * 0.2], [0.05 * (i % 3 - 1), 0, 0.05]);
  }
  k.cyl(g, [0.4, 0.4, 0.18, 20], w.darkSteelMat, [5.05, 1.5, 1.3], [0, 0, Math.PI / 2]);
  k.cyl(g, [0.3, 0.3, 0.14, 20], M.rope, [5.05, 1.5, 1.3], [0, 0, Math.PI / 2]);
  k.box(g, [0.7, 0.3, 0.05], w.plateMat, [0, 3.2, -2.75]);
  k.tag(g, 'SV-08', { w: 0.46, h: 0.18 }, [0, 3.2, -2.71]);
  k.chamberLamps(g);
  g.add(w.buildLuminaire(0, 3.7, -1.0, UNDERGROUND_LAMP));
  // AN ORE TUB AND A MINER'S PICK at the side of the plate, the host's own tools within the table's reach: the lean-in view shows them at the edge of the plate.
  const tub = (x, z, d = 1) => {
    k.cyl(g, [0.34, 0.28, 0.5, 14], w.drumMat, [x, 0.25, z], null, true);
    k.cyl(g, [0.35, 0.35, 0.05, 14], w.darkSteelMat, [x, 0.5, z]);
    pile(w, g, x, z, 0.2, 0x3a11 + Math.round(x * 7), 0.12, 6).position.y = 0.52;
    k.strut(g, [x + d * 0.3, 0.45, z - 0.05], [x + d * 0.5, 1.05, z - 0.3], 0.025, w.timberMat, 6);
    k.box(g, [0.34, 0.05, 0.05], w.pipeMat, [x + d * 0.5, 1.07, z - 0.3], [0, 0.5 * d, 0.2]);
  };
  tub(3.05, 1.7);

  const colliders = [
    { lx: 3.05, lz: 1.7, r: 0.5 },
    { lx: 3.8, lz: -0.4, r: 0.6 },
    { lx: -3.9, lz: -0.6, hw: 0.9, hd: 0.6 },
    { lx: -4.7, lz: -1.7, r: 0.35 },
    { lx: 5.05, lz: 1.3, hw: 0.25, hd: 0.45 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   9. THE HOIST CHAMBER — the deepest point (desk)
   A winze goes down to a lower level from here: its collar is a kerb of steel
   at the left with an A-frame over it carrying the sheave; the winder stands at
   the right with its drum, and the rope runs from one to the other well above
   the bench. The bench is the winder's control desk.
   ====================================================================== */

export function buildHoistChamber(w, site) {
  const M = prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'hoist-chamber';

  const bench = w.buildBench({ kind: 'rack', plate: 'LB-09', skin: 'desk' });
  g.add(bench.group);

  // THE WINDER at the right: a bedplate, a motor, a drum on its shaft with a brake, and a control pedestal.
  {
    const wx = 4.3;
    k.box(g, [1.9, 0.2, 3.8], w.darkSteelMat, [wx, 0.1, 0.4], null, true);
    k.box(g, [1.0, 1.0, 1.3], w.drumMat, [wx, 0.7, -1.2], null, true);
    k.cyl(g, [0.7, 0.7, 1.4, 22], w.plateMat, [wx, 1.0, 0.9], [0, 0, Math.PI / 2], true);
    for (const dx of [-0.75, 0.75]) k.cyl(g, [0.92, 0.92, 0.1, 22], w.darkSteelMat, [wx + dx, 1.0, 0.9], [0, 0, Math.PI / 2]);
    k.cyl(g, [0.08, 0.08, 2.2, 8], w.pipeMat, [wx, 1.0, 0.9], [0, 0, Math.PI / 2]);
    k.box(g, [0.5, 0.1, 0.2], w.darkSteelMat, [wx, 1.9, 0.9]);
    k.box(g, [0.9, 1.1, 0.8], w.drumMat, [wx + 0.2, 0.55, 3.3], null, true);
    k.box(g, [0.95, 0.06, 0.85], w.darkSteelMat, [wx + 0.2, 1.13, 3.3]);
    for (let i = 0; i < 3; i++) {
      k.strut(g, [wx - 0.1 + i * 0.25, 1.16, 3.2], [wx - 0.1 + i * 0.25 - 0.05, 1.5, 3.3], 0.016, w.pipeMat, 6);
      k.cyl(g, [0.035, 0.035, 0.05, 8], M.copper, [wx - 0.15 + i * 0.25, 1.52, 3.3]);
    }
    k.cyl(g, [0.14, 0.14, 0.04, 16], M.face, [wx + 0.2, 0.9, 2.88], [Math.PI / 2, 0, 0]);
    // The fairlead pylon the rope leaves the drum over.
    k.column(g, 3.5, 0.5, 3.2, { h: 0.16, w: 0.12 });
    k.ring(g, 0.22, 0.03, w.pipeMat, [3.5, 3.1, 0.5], 'x');
  }

  // THE WINZE AND ITS HEADGEAR at the left: a steel kerb round the collar, the void inside it, an A-frame, the sheave.
  {
    // The collar stands at the BACK of the chamber, behind the plate (z < -0.65), so the rope to the drum runs behind the bench and
    // not across the air the leaned-in camera stands in; the A-frame's feet are outside the work volume (|x| > 2.7).
    const cx = -3.9, cz = -0.9;
    for (const [bx, bz, w2, d2] of [[cx - 0.75, cz, 0.12, 1.5], [cx + 0.75, cz, 0.12, 1.5], [cx, cz - 0.75, 1.5, 0.12], [cx, cz + 0.75, 1.5, 0.12]]) {
      k.box(g, [w2, 0.8, d2], w.drumMat, [bx, 0.4, bz], null, true);
    }
    k.box(g, [1.5, 0.02, 1.5], M.black, [cx, 0.08, cz]);
    for (const [px, pz] of [[cx - 0.8, cz - 0.8], [cx + 0.8, cz - 0.8], [cx - 0.8, cz + 0.8], [cx + 0.8, cz + 0.8]]) k.cyl(g, [0.03, 0.03, 0.9, 6], w.pipeMat, [px, 1.2, pz]);
    // The A-frame: two raking legs each side and a cross-tie, the sheave between the apexes.
    for (const sx of [-5.15, -2.9]) {
      k.strut(g, [sx, 0, cz - 0.6], [-3.9 + (sx > -3.9 ? -0.2 : 0.2), 3.75, cz], 0.06, w.darkSteelMat, 8);
      k.strut(g, [sx, 0, cz + 0.6], [-3.9 + (sx > -3.9 ? -0.2 : 0.2), 3.75, cz], 0.06, w.darkSteelMat, 8);
    }
    k.cyl(g, [0.03, 0.03, 1.8, 8], w.pipeMat, [-3.9, 3.75, cz], [0, 0, Math.PI / 2]);
    k.ring(g, 0.5, 0.06, w.darkSteelMat, [-3.9, 3.75, cz], 'x');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      k.box(g, [0.03, 0.03, 1.0], w.darkSteelMat, [-3.9, 3.75 + Math.sin(a) * 0.0, cz], [a, 0, 0]);
    }
    // THE ROPE: from the drum over the pylon, high across the back of the chamber, over the sheave and down into the winze.
    k.strut(g, [3.5, 3.2, 0.5], [-3.9, 4.22, cz], 0.022, M.rope, 6);
    k.strut(g, [-3.9, 4.22, cz], [-3.9, 0.0, cz], 0.022, M.rope, 6);
    // The skip standing beside the collar, a tub on its own sledge.
    k.cyl(g, [0.42, 0.34, 0.7, 14], w.drumMat, [-4.3, 0.4, 1.4], null, true);
    k.box(g, [1.0, 0.06, 0.8], w.timberMat, [-4.3, 0.03, 1.4]);
  }
  k.box(g, [0.7, 0.3, 0.05], w.plateMat, [0, 3.0, -2.75]);
  k.tag(g, 'HC-09', { w: 0.46, h: 0.18 }, [0, 3.0, -2.71]);
  k.chamberLamps(g);
  // THE BENCH LAMP: under a hill only lamps light, and a bench is worked with the eyes on the plate, so one hangs over the back of it,
  // above the bay's air. A `lampMark` in the pool, no light of its own.
  g.add(w.buildLuminaire(0, 3.7, -1.0, UNDERGROUND_LAMP));
  // AN ORE TUB AND A MINER'S PICK at the side of the plate, the host's own tools within the table's reach: the lean-in view shows them at the edge of the plate.
  const tub = (x, z, d = 1) => {
    k.cyl(g, [0.34, 0.28, 0.5, 14], w.drumMat, [x, 0.25, z], null, true);
    k.cyl(g, [0.35, 0.35, 0.05, 14], w.darkSteelMat, [x, 0.5, z]);
    pile(w, g, x, z, 0.2, 0x3a11 + Math.round(x * 7), 0.12, 6).position.y = 0.52;
    k.strut(g, [x + d * 0.3, 0.45, z - 0.05], [x + d * 0.5, 1.05, z - 0.3], 0.025, w.timberMat, 6);
    k.box(g, [0.34, 0.05, 0.05], w.pipeMat, [x + d * 0.5, 1.07, z - 0.3], [0, 0.5 * d, 0.2]);
  };
  tub(-3.2, 1.2, -1);

  const colliders = [
    { lx: -3.2, lz: 1.2, r: 0.5 },
    { lx: 4.3, lz: 0.4, hw: 0.95, hd: 1.9 },
    { lx: 4.5, lz: 3.3, hw: 0.5, hd: 0.45 },
    { lx: 3.5, lz: 0.5, r: 0.3 },
    { lx: -3.9, lz: -0.9, hw: 0.95, hd: 0.95 },
    { lx: -5.15, lz: -0.9, r: 0.3 },
    { lx: -2.9, lz: -0.9, r: 0.3 },
    { lx: -4.3, lz: 1.4, r: 0.5 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/** One builder per site: the world places each at its site's mark (`ligar.js initHosts`). */
export const HOST_BUILDERS = {
  'site-1': buildSlabYard,
  'site-2': buildOreDrift,
  'site-3': buildCrusherHouse,
  'site-4': buildScaleHouse,
  'site-5': buildSubstation,
  'site-6': buildDrillChamber,
  'site-7': buildSumpStation,
  'site-8': buildSurveyStation,
  'site-9': buildHoistChamber
};
