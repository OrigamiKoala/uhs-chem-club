/**
 * stations.js — The six hosts: the pieces of the refinery a Learn bench is built into.
 *
 * A bench on Tallow is not a bench in a hut. It is a working point of the plant:
 * the sampling shelf at the foot of the conveyor, the control desk of the process
 * house, the inspection deck of a cracking tower, the weigh hopper under the belt's
 * discharge, the sack scale on the bagging line, and the instrument room under the
 * evaporators. Each builder here returns the machine AND its bench as ONE object,
 * so the overlap rule (which exempts a body's own parts) lets the bench be bolted
 * to the thing it belongs to, and the bay contract (`bench-bay.js`) keeps the
 * volume the plate, the instrument, the screens and the camera need empty of it.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the
 * front (toward the ground the player walks in from), +x to the player's right.
 * The world places the group at `site.pos`, turned by `siteFacing(site)`. Every
 * builder keeps to the bay by construction:
 *
 *   |x| < 2.7, z in [-1.95, 0.65]      nothing from the floor up to 2.4 m (plate, instrument, screens)
 *   |x| < 2.4, z in [0.65, 5.05]       nothing from 0.3 to 2.2 m (where the player and camera stand)
 *
 * so machinery stands to the sides (|x| > 2.8), behind the plate (z < -2.0), or
 * above 2.4 m. `verify:bench` measures all of it.
 *
 * @returns {{ group: THREE.Group, bench: object, benchLocal: number[], colliders: object[] }}
 *   `colliders` are host-local: `{ lx, lz, r }` discs and `{ lx, lz, hw, hd }` boxes
 *   (half sizes along the host's x and z). The world turns them to its own frame.
 */

import * as THREE from 'three';
import { placard } from '../materials/pbr-kit.js';
import { iBeamGeometry, corrugatedGeometry } from './kit.js';
import { buildCrackingTower, CONVEYOR } from './plant.js';

const Y = new THREE.Vector3(0, 1, 0);

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
      const d = p === pts[0] ? new THREE.Vector3(...pts[1]).sub(new THREE.Vector3(...pts[0])) : new THREE.Vector3(...pts[pts.length - 2]).sub(new THREE.Vector3(...pts[pts.length - 1]));
      f.quaternion.setFromUnitVectors(Y, d.normalize());
      g.add(f);
    }
  };

  /** A bolted base plate on a footing, with the four nuts. */
  const footing = (g, x, z, size = 0.34) => {
    box(g, [size + 0.2, 0.18, size + 0.2], w.footingMat, [x, -0.07, z]);
    box(g, [size, 0.03, size], w.darkSteelMat, [x, 0.025, z]);
  };

  /** An H column stood on a footing: from the ground to `top`. */
  const column = (g, x, z, top, dims = { h: 0.2, w: 0.16 }) => {
    footing(g, x, z, 0.32);
    beam(g, top - 0.04, w.darkSteelMat, [x, 0.04 + (top - 0.04) / 2, z], 'y', dims, true);
  };

  /** A caged sodium lamp on a mast, its arm reaching `arm` = [dx, dz] and no lower than `h` - 0.3. */
  const lampMast = (g, x, z, { h = 3.6, arm = [0, 0] } = {}) => {
    footing(g, x, z, 0.3);
    cyl(g, [0.045, 0.06, h, 10], w.darkSteelMat, [x, h / 2, z], null, true);
    if (arm[0] || arm[1]) strut(g, [x, h - 0.05, z], [x + arm[0], h - 0.05, z + arm[1]], 0.035, w.darkSteelMat);
    g.add(w.buildLuminaire(x + arm[0], h - 0.12, z + arm[1]));
  };

  /** A stencilled tag set flat on a surface. */
  const tag = (g, text, size, p, ry = 0) => {
    const t = placard(text, size);
    t.position.set(...p);
    t.rotation.y = ry;
    g.add(t);
    own(t.geometry, t.material, t.material.map);
  };

  return { box, cyl, beam, strut, pipe, footing, column, lampMast, tag, shade, own, t4 };
}

/** The shared dress a host needs that the world has not made for itself. */
function prepare(w) {
  if (!w.footingMat) {
    w.footingMat = w.own(new THREE.MeshStandardMaterial({ color: 0x7a7164, roughness: 1.0, metalness: 0.0 }));
  }
  if (!w.sackMat) {
    w.sackMat = w.own(new THREE.MeshStandardMaterial({ color: 0xb9ab8c, roughness: 1.0, metalness: 0.0 }));
    w.timberMat = w.own(new THREE.MeshStandardMaterial({ color: 0x6f5d44, roughness: 1.0, metalness: 0.0 }));
    w.glassMat = w.own(new THREE.MeshStandardMaterial({ color: 0x14130f, roughness: 0.25, metalness: 0.15 }));
    w.paperMat = w.own(new THREE.MeshStandardMaterial({ color: 0xcdc2a3, roughness: 1.0, metalness: 0.0 }));
    w.paperDarkMat = w.own(new THREE.MeshStandardMaterial({ color: 0x9a8e70, roughness: 1.0, metalness: 0.0 }));
  }
}

/** A drum-on-pallet or a sealed pail, the small salvage every plant has. */
function pail(k, w, g, x, y, z, r = 0.13, h = 0.2) {
  k.cyl(g, [r, r, h, 12], w.drumMat, [x, y + h / 2, z]);
  k.cyl(g, [r * 1.06, r * 1.06, 0.025, 12], w.darkSteelMat, [x, y + h + 0.012, z]);
}

/* ======================================================================
   1. THE RAW-SALT SAMPLE POINT — at the conveyor's tail (shelf)
   Harvested crust, a mixture, arrives here and is first taken in a sample. A
   cross-cut sampler on the left cuts the stream into a drum; the retained
   samples are racked on the right; the bench is the shelf between them.
   ====================================================================== */

export function buildSamplePoint(w, site) {
  prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'sample-point';

  // The apron the work is done on: a skim of concrete, bedded.
  k.box(g, [12.4, 0.12, 6.0], w.footingMat, [0, -0.06, -0.2]);

  const bench = w.buildBench({ kind: 'scope', plate: 'BN-01', skin: 'shelf' });
  g.add(bench.group);

  // THE CROSS-CUT SAMPLER (left): a four-post frame carrying a hopper, a diverter chute
  // and the drum that takes the cut.
  {
    const sx = -4.5, sz = -1.1;
    for (const [dx, dz] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]]) k.column(g, sx + dx, sz + dz, 2.5, { h: 0.14, w: 0.12 });
    for (const dz of [-0.5, 0.5]) k.beam(g, 1.4, w.darkSteelMat, [sx, 2.5, sz + dz], 'x', { h: 0.14, w: 0.1 });
    for (const dx of [-0.6, 0.6]) k.beam(g, 1.1, w.darkSteelMat, [sx + dx, 2.5, sz], 'z', { h: 0.14, w: 0.1 });
    // The hopper: a four-sided frustum, wide at the mouth.
    k.cyl(g, [0.95, 0.22, 0.95, 4], w.plateMat, [sx, 3.0, sz], [0, Math.PI / 4, 0], true);
    // Its throat, the diverter box, and the cutter's motor on a bracket.
    k.box(g, [0.5, 0.42, 0.5], w.darkSteelMat, [sx, 2.18, sz]);
    k.box(g, [0.44, 0.34, 0.3], w.plateMat, [sx - 0.9, 2.3, sz + 0.1]);
    k.cyl(g, [0.11, 0.11, 0.3, 12], w.darkSteelMat, [sx - 0.62, 2.3, sz + 0.1], [0, 0, Math.PI / 2]);
    // The chute from the diverter, falling forward into the drum.
    k.box(g, [0.34, 0.05, 1.6], w.plateMat, [sx, 1.35, sz + 1.05], [0.62, 0, 0], true);
    for (const dx of [-0.17, 0.17]) k.box(g, [0.03, 0.1, 1.6], w.darkSteelMat, [sx + dx, 1.42, sz + 1.05], [0.62, 0, 0]);
    // The drum and its pallet, lid off, a scoop across it.
    k.box(g, [1.0, 0.12, 0.9], w.timberMat, [sx, 0.06, sz + 1.95]);
    k.cyl(g, [0.34, 0.34, 0.8, 18], w.drumMat, [sx, 0.52, sz + 1.95], null, true);
    k.cyl(g, [0.36, 0.36, 0.05, 18], w.darkSteelMat, [sx, 0.94, sz + 1.95]);
    k.box(g, [0.06, 0.03, 0.5], w.pipeMat, [sx + 0.2, 1.0, sz + 1.95], [0, 0.4, 0]);
    // Sample bags hung on the frame's rail, and the cable to the motor.
    for (let i = 0; i < 3; i++) k.box(g, [0.16, 0.22, 0.05], w.sackMat, [sx - 0.64 + i * 0.22, 1.2, sz - 0.58]);
    k.pipe(g, [[sx - 0.9, 2.2, sz + 0.1], [sx - 0.9, 1.0, sz + 0.1], [sx - 1.3, 0.14, sz + 0.1]], 0.016, w.darkSteelMat);
  }

  // THE RETAINED-SAMPLE RACK (right): sealed pails by the day, on four shelves.
  {
    const rx = 4.5, rz = -0.9;
    for (const [dx, dz] of [[-0.8, -0.3], [0.8, -0.3], [-0.8, 0.3], [0.8, 0.3]]) k.column(g, rx + dx, rz + dz, 2.1, { h: 0.1, w: 0.08 });
    for (let s = 0; s < 4; s++) {
      const y = 0.3 + s * 0.55;
      k.box(g, [1.75, 0.04, 0.68], w.darkSteelMat, [rx, y, rz]);
      for (let i = 0; i < 5; i++) pail(k, w, g, rx - 0.66 + i * 0.33, y + 0.02, rz + ((i + s) % 2 ? 0.06 : -0.06));
    }
    // Wire mesh across the back and a hasp on the door at the end.
    k.box(g, [1.75, 1.9, 0.02], w.darkSteelMat, [rx, 1.15, rz - 0.34]);
    k.box(g, [0.04, 1.9, 0.68], w.darkSteelMat, [rx + 0.86, 1.15, rz]);
  }

  // A sampling log board on two posts behind the bench, out of the screens' way.
  for (const px of [-1.5, 1.5]) k.column(g, px, -2.6, 2.0, { h: 0.1, w: 0.08 });
  k.box(g, [3.5, 1.0, 0.06], w.plateMat, [0, 1.55, -2.6]);
  for (let c = 0; c < 8; c++) k.box(g, [0.035, 0.34, 0.012], w.paperMat, [-1.45 + c * 0.4, 1.55 + (c % 3) * 0.08 - 0.08, -2.56], [0, 0, c % 2 ? 0.07 : -0.05]);
  k.tag(g, 'SP-01', { w: 0.5, h: 0.19 }, [0, 2.2, -2.56]);

  // Work lamp on a mast at the right-hand front corner.
  k.lampMast(g, 3.3, 1.3, { h: 3.6, arm: [-1.6, -0.2] });

  const colliders = [
    { lx: -4.5, lz: -1.1, hw: 0.95, hd: 0.8 },
    { lx: -4.5, lz: 0.85, hw: 0.45, hd: 0.45 },
    { lx: 4.5, lz: -0.9, hw: 1.0, hd: 0.45 },
    { lx: 0, lz: -2.6, hw: 1.8, hd: 0.15 },
    { lx: 3.3, lz: 1.3, r: 0.2 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  // NO FIELD POINT. The belt scoop was retired: it carried the same atoms the bench already held, so it was pure
  // carrying (a fetch stays only where what is fetched is new evidence).
  const fieldPoints = [];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

/* ======================================================================
   2. THE INSTRUMENT ROOM UNDER THE EVAPORATORS (desk)
   The old diagnostic lab, moved: the bench, its beam column, equipment rack and
   gauge board. The room is `initSublevel`'s; this is what stands in it.
   ====================================================================== */

export function buildInstrumentRoom(w, site) {
  prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'instrument-room-bench';

  const bench = w.buildBench({ kind: 'core', plate: 'BN-02', skin: 'desk' });
  g.add(bench.group);

  // The beam column on one side: a magnet stack with its emitter turned toward the bench.
  k.cyl(g, [0.34, 0.4, 2.3, 18], w.plateMat, [-4.3, 1.15, -0.2], null, true);
  k.cyl(g, [0.12, 0.2, 0.7, 14], w.darkSteelMat, [-3.7, 1.45, -0.2], [0, 0, -Math.PI / 2]);
  k.box(g, [0.9, 0.12, 0.9], w.darkSteelMat, [-4.3, 0.06, -0.2]);

  // The equipment rack on the other: nineteen-inch modules with their handles.
  const rx = 4.3;
  k.box(g, [0.7, 1.95, 0.85], w.bulkMat, [rx, 0.98, -0.2], null, true);
  for (let i = 0; i < 7; i++) {
    k.box(g, [0.04, 0.2, 0.62], w.darkSteelMat, [rx - 0.37, 0.34 + i * 0.24, -0.2]);
    for (const hz of [-0.22, 0.22]) k.box(g, [0.03, 0.1, 0.05], w.plateMat, [rx - 0.4, 0.34 + i * 0.24, -0.2 + hz]);
  }

  // The gauge board on the bulkhead behind: dial faces with their needles.
  k.box(g, [2.0, 0.78, 0.07], w.plateMat, [0, 1.85, -2.76]);
  const faceMat = w.own(new THREE.MeshStandardMaterial({ color: 0xcfc5ae, roughness: 0.75 }));
  const needleMat = w.own(new THREE.MeshStandardMaterial({ color: 0x3a332b, roughness: 0.8 }));
  for (let i = 0; i < 4; i++) {
    k.cyl(g, [0.14, 0.14, 0.03, 18], faceMat, [-0.69 + i * 0.46, 1.9, -2.7], [Math.PI / 2, 0, 0]);
    k.box(g, [0.012, 0.1, 0.008], needleMat, [-0.69 + i * 0.46, 1.94, -2.675], [0, 0, -0.9 + i * 0.4]);
  }
  k.tag(g, 'DIAG BAY', { w: 0.62, h: 0.2 }, [0, 2.45, -2.72]);

  // Cable draped along the bulkhead from the rack to the column, well behind the bench. In three
  // runs (rack to wall, along the wall, wall to column) so no one tube is boxed across the bench.
  const cableMat = w.own(new THREE.MeshStandardMaterial({ color: 0x2a251f, roughness: 0.95, metalness: 0.2 }));
  for (let i = 0; i < 3; i++) {
    const runs = [
      [[4.0, 1.4 - i * 0.1, -0.7], [3.7, 1.2 - i * 0.1, -1.5], [3.4, 0.9 - i * 0.07, -2.1]],
      [[3.4, 0.9 - i * 0.07, -2.1], [0, 0.78 - i * 0.04, -2.2], [-3.4, 0.8 - i * 0.05, -2.1]],
      [[-3.4, 0.8 - i * 0.05, -2.1], [-3.7, 0.95 - i * 0.1, -1.5], [-4.0, 1.1 - i * 0.1, -0.6]]
    ];
    for (const pts of runs) {
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
      g.add(new THREE.Mesh(w.own(new THREE.TubeGeometry(curve, 12, 0.022, 6, false)), cableMat));
    }
  }

  const colliders = [
    { lx: -4.3, lz: -0.2, r: 0.55 },
    { lx: 4.3, lz: -0.2, hw: 0.4, hd: 0.45 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   3. THE PROCESS CONTROL HOUSE (desk)
   A poured block house south of the evaporator row. The control desk stands on its
   veranda, the windows of the control room behind it; the card index is the wall of
   record cards beside the glass.
   ====================================================================== */

export function buildControlHouse(w, site) {
  prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'control-house';
  const concrete = w.concreteMaterial();
  const cwall = (size, p, shadow = true) => {
    const geo = w.boxUVs(w.own(new THREE.BoxGeometry(size[0], size[1], size[2])), 0.45);
    const m = new THREE.Mesh(geo, concrete);
    m.position.set(...p);
    if (shadow) m.castShadow = m.receiveShadow = w.t4;
    g.add(m);
    return m;
  };

  // The apron the house stands on, and the veranda's floor.
  k.box(g, [13.0, 0.12, 12.0], w.footingMat, [0, -0.06, -3.3]);

  const bench = w.buildBench({ kind: 'cards', plate: 'BN-03', skin: 'desk' });
  g.add(bench.group);

  // THE BLOCKHOUSE: back and side walls, and the front wall pierced for the glass and the door.
  const H = 3.6, zF = -2.6, zB = -8.4;
  cwall([9.8, H, 0.3], [0, H / 2, zB]);
  for (const sx of [-1, 1]) cwall([0.3, H, zF - zB], [sx * 4.9, H / 2, (zF + zB) / 2]);
  cwall([2.3, H, 0.3], [-3.75, H / 2, zF]);                  // solid, the record wall's
  cwall([5.2, 1.0, 0.3], [0, 0.5, zF]);                      // sill under the glass
  cwall([5.2, 1.0, 0.3], [0, H - 0.5, zF]);                  // lintel band over it
  cwall([0.7, H, 0.3], [2.95, H / 2, zF]);                   // pier before the door
  cwall([1.0, 1.4, 0.3], [3.8, H - 0.7, zF]);                // over the door
  cwall([0.6, H, 0.3], [4.6, H / 2, zF]);                    // corner
  // The roof slab with a parapet lip.
  cwall([10.2, 0.3, 6.1], [0, H + 0.15, (zF + zB) / 2 - 0.05]);
  for (const [sx, sz, lx, lz] of [[0, -1, 10.2, 0.14], [0, 1, 10.2, 0.14], [-1, 0, 0.14, 6.1], [1, 0, 0.14, 6.1]]) {
    cwall([lx, 0.22, lz], [sx * 5.0, H + 0.41, (zF + zB) / 2 - 0.05 + sz * 2.97], false);
  }
  // Four panes of dark glass in their mullions.
  for (let i = 0; i < 4; i++) {
    k.box(g, [1.15, 1.55, 0.03], w.glassMat, [-1.95 + i * 1.3, 1.78, zF + 0.04]);
  }
  for (const mx of [-2.6, -1.3, 0, 1.3, 2.6]) k.box(g, [0.1, 1.6, 0.12], w.darkSteelMat, [mx, 1.78, zF - 0.02]);
  // The door, racked ajar on its hinge side.
  k.box(g, [0.96, 2.2, 0.05], w.darkSteelMat, [3.8 - 0.55, 1.1, zF - 0.62], [0, 1.1, 0], true);
  k.box(g, [0.16, 2.2, 0.16], w.darkSteelMat, [3.34, 1.1, zF + 0.0]);
  k.box(g, [0.16, 2.2, 0.16], w.darkSteelMat, [4.3, 1.1, zF + 0.0]);
  k.tag(g, 'CH-03', { w: 0.44, h: 0.17 }, [4.6, 2.5, zF + 0.16]);

  // THE RECORD WALL: a board of index cards on the solid bay, six across and five down.
  k.box(g, [2.0, 1.7, 0.04], w.darkSteelMat, [-3.75, 1.85, zF + 0.17]);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      const mat = (r * 6 + c) % 5 === 0 ? w.paperDarkMat : w.paperMat;
      k.box(g, [0.25, 0.26, 0.012], mat, [-4.4 + c * 0.265, 1.2 + r * 0.31, zF + 0.2], [0, 0, ((r + c) % 3 - 1) * 0.02]);
    }
  }

  // THE VERANDA: a header and rafters on two columns, sheet over them, a lamp under. Its front edge stands
  // at the plate's own, so the air in front (where a leaned-in camera stands) is open to the sky.
  const yR = 3.18;
  const zV = 0.45;
  const lenV = zV - zF;
  for (const sx of [-1, 1]) k.column(g, sx * 4.6, zV, yR - 0.1, { h: 0.22, w: 0.18 });
  k.beam(g, 10.2, w.darkSteelMat, [0, yR, zV], 'x', { h: 0.26, w: 0.14 }, true);
  for (const rx of [-4.6, -1.5, 1.5, 4.6]) k.beam(g, lenV, w.darkSteelMat, [rx, yR, (zV + zF) / 2], 'z', { h: 0.22, w: 0.12 });
  for (const sx of [-3.9, -1.3, 1.3, 3.9]) {
    const sheet = new THREE.Mesh(w.own(corrugatedGeometry(2.6, lenV)), w.plateMat);
    sheet.position.set(sx, yR + 0.14, (zV + zF) / 2);
    sheet.castShadow = sheet.receiveShadow = w.t4;
    g.add(sheet);
  }
  g.add(w.buildLuminaire(0, 3.0, -0.5));
  k.strut(g, [0, yR - 0.06, -0.5], [0, 3.1, -0.5], 0.012, w.darkSteelMat, 6);

  // ON THE ROOF: a condenser box and its fan, a vent cowl, a whip, and the way up.
  k.box(g, [1.2, 0.7, 0.8], w.plateMat, [-1.5, H + 0.3 + 0.35, -6.5], null, true);
  k.cyl(g, [0.3, 0.3, 0.04, 18], w.darkSteelMat, [-1.5, H + 0.3 + 0.72, -6.5]);
  k.cyl(g, [0.22, 0.26, 0.9, 14], w.pipeMat, [1.6, H + 0.3 + 0.45, -6.8]);
  k.cyl(g, [0.34, 0.22, 0.16, 14], w.darkSteelMat, [1.6, H + 0.3 + 0.98, -6.8]);
  k.cyl(g, [0.012, 0.02, 3.0, 6], w.darkSteelMat, [4.4, H + 0.3 + 1.5, -7.6]);
  for (let i = 0; i < 9; i++) {
    const rung = new THREE.Mesh(w.own(new THREE.TorusGeometry(0.18, 0.018, 5, 10, Math.PI)), w.darkSteelMat);
    rung.position.set(5.12, 0.5 + i * 0.36, -5.4);
    rung.rotation.set(0, Math.PI / 2, -Math.PI / 2);
    g.add(rung);
  }

  // THE IMPULSE LINES: three small-bore pipes from the west wall toward the row, ending in blind flanges.
  for (const [py, pz, r] of [[1.0, -5.2, 0.045], [1.5, -5.6, 0.04], [2.1, -6.0, 0.05]]) {
    k.pipe(g, [[-5.05, py, pz], [-6.1, py, pz]], r, w.pipeMat);
  }
  // The distribution cabinet beside the east wall, its door standing open.
  k.box(g, [0.5, 1.2, 0.3], w.bulkMat, [5.28, 0.6, -4.2], null, true);
  k.box(g, [0.04, 1.14, 0.46], w.darkSteelMat, [5.35, 0.6, -3.86], [0, 0.9, 0]);

  const colliders = [
    { lx: 0, lz: (zF + zB) / 2, hw: 5.1, hd: 3.0 },
    { lx: -4.6, lz: 0.45, r: 0.3 },
    { lx: 4.6, lz: 0.45, r: 0.3 },
    { lx: 5.3, lz: -4.2, hw: 0.3, hd: 0.25 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders };
}

/* ======================================================================
   4. THE CRACKING TOWER'S SAMPLING DECK (deck)
   A tower separates what goes in by weight, which is what a mass spectrometer
   does to isotopes. The host IS the tower with its deck: the column stands behind
   the bench, a draw-off line comes down it to a sample-cooler skid, and the bench
   is the inspection deck beside the skid.
   ====================================================================== */

export function buildTowerDeck(w, site, { towerBack = 8.5, towerRot = 0.647, towerScale = 1.0 } = {}) {
  prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'tower-deck';

  const bench = w.buildBench({ kind: 'core', plate: 'BN-04', skin: 'deck' });
  g.add(bench.group);

  // THE COLUMN. Built whole, as the plant builds it, and set behind the deck.
  const tower = buildCrackingTower(w.plantCtx, towerScale);
  tower.position.set(0, 0, -towerBack);
  tower.rotation.y = towerRot;
  tower.name = 'tower';
  g.add(tower);

  // The deck extends back to the skid: a grated floor, with a lip round its open edges.
  const grate = (sx, sz, p) => {
    k.box(g, [sx, 0.05, sz], w.darkSteelMat, p);
    for (let i = 0; i < Math.round(sx / 0.35); i++) k.box(g, [0.025, 0.03, sz], w.pipeMat, [p[0] - sx / 2 + 0.175 + i * 0.35, p[1] + 0.04, p[2]]);
  };
  grate(7.0, 3.6, [0, 0.025, -3.9]);

  // THE SAMPLE-COOLER SKID: a cooling coil in its jacket, three sample bombs on a rack, a panel.
  {
    const sx = -0.4, sz = -3.7;
    k.beam(g, 3.4, w.darkSteelMat, [sx, 0.16, sz - 0.4], 'x', { h: 0.14, w: 0.1 });
    k.beam(g, 3.4, w.darkSteelMat, [sx, 0.16, sz + 0.4], 'x', { h: 0.14, w: 0.1 });
    // The cooler: a jacketed shell on its end, the coil showing at the top.
    k.cyl(g, [0.42, 0.42, 1.5, 20], w.drumMat, [sx - 1.0, 1.0, sz], null, true);
    k.cyl(g, [0.46, 0.46, 0.06, 20], w.darkSteelMat, [sx - 1.0, 1.78, sz]);
    for (let i = 0; i < 4; i++) k.cyl(g, [0.5, 0.5, 0.03, 20], w.darkSteelMat, [sx - 1.0, 0.45 + i * 0.35, sz]);
    // The sample bombs: three steel cylinders in a rack, each with its valve.
    k.box(g, [1.2, 0.05, 0.4], w.darkSteelMat, [sx + 0.7, 0.62, sz]);
    for (const lx of [-0.4, 0, 0.4]) {
      k.box(g, [0.06, 0.6, 0.06], w.darkSteelMat, [sx + 0.7 + lx - 0.2, 0.32, sz - 0.15]);
      k.cyl(g, [0.07, 0.07, 0.55, 12], w.pipeMat, [sx + 0.7 + lx, 0.92, sz]);
      k.cyl(g, [0.025, 0.025, 0.14, 8], w.darkSteelMat, [sx + 0.7 + lx, 1.26, sz]);
      k.cyl(g, [0.05, 0.05, 0.02, 10], w.darkSteelMat, [sx + 0.7 + lx, 1.34, sz], [Math.PI / 2, 0, 0]);
    }
    // The gauge panel on a stand at the skid's end.
    k.box(g, [0.1, 1.2, 0.1], w.darkSteelMat, [sx + 1.85, 0.6, sz]);
    k.box(g, [0.7, 0.5, 0.1], w.plateMat, [sx + 1.85, 1.35, sz]);
    for (let i = 0; i < 2; i++) {
      k.cyl(g, [0.11, 0.11, 0.03, 16], w.own(new THREE.MeshStandardMaterial({ color: 0xcfc5ae, roughness: 0.75 })), [sx + 1.6 + i * 0.3, 1.38, sz + 0.07], [Math.PI / 2, 0, 0]);
    }
  }

  // THE DRAW-OFF LINE: from a nozzle low on the stripping section, out, down, and along to the cooler.
  {
    const a = -0.45;
    const R = 1.3 * towerScale;
    const p0 = [Math.sin(a) * R, 3.9, -towerBack + Math.cos(a) * R];
    const out = [Math.sin(a) * (R + 0.7), 3.9, -towerBack + Math.cos(a) * (R + 0.7)];
    k.pipe(g, [p0, out, [out[0], 0.9, out[2]], [-1.4, 0.9, -3.7], [-1.4, 1.6, -3.7]], 0.055, w.pipeMat);
    // Two pipe sleepers to carry it, and a gate valve with its wheel.
    for (const sz of [-6.1]) k.box(g, [0.3, 0.5, 0.3], w.footingMat, [out[0], 0.25 - 0.05, sz]);
    k.cyl(g, [0.14, 0.14, 0.2, 12], w.darkSteelMat, [out[0], 0.9, -5.6]);
    k.cyl(g, [0.12, 0.12, 0.03, 14], w.darkSteelMat, [out[0] + 0.0, 1.12, -5.6]);
  }

  // Rails across the deck's open ends (outside the bench's reach), a lamp on a mast, the tag.
  for (const sx of [-1, 1]) {
    for (const rz of [-1.0, 0.9]) k.column(g, sx * 3.1, rz, 1.05, { h: 0.08, w: 0.06 });
    k.strut(g, [sx * 3.1, 1.02, -1.0], [sx * 3.1, 1.02, 0.9], 0.025, w.darkSteelMat);
    k.strut(g, [sx * 3.1, 0.55, -1.0], [sx * 3.1, 0.55, 0.9], 0.02, w.darkSteelMat);
  }
  k.lampMast(g, 3.5, 1.5, { h: 3.6, arm: [-1.7, -0.3] });
  k.tag(g, 'SMP-04', { w: 0.5, h: 0.19 }, [1.85 - 0.4, 1.35, -3.7 + 0.08]);

  const colliders = [
    { lx: 0, lz: -towerBack, r: 3.4 },
    { lx: -0.4, lz: -3.7, hw: 2.3, hd: 0.65 },
    { lx: 3.5, lz: 1.5, r: 0.2 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  // NO FIELD POINT. The cooler draw was retired: the sample it carried matched the reference already on the bench.
  const fieldPoints = [];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

/* ======================================================================
   5. THE WEIGH HOPPER AT THE CONVEYOR'S HEAD (deck)
   The belt throws its load off the head pulley into a sleeve; the sleeve feeds the
   hopper; the chute runs it over the deflector into catch bins that each take one
   weight. The bench stands in front of the works.
   ====================================================================== */

/** How far behind the bench the gantry stands (its origin), and where the bin is in it. */
export const HOPPER = {
  back: 3.5, binZ: -1.5,
  /**
   * The gantry stands this far west of the belt's discharge. The belt's long diagonal members are
   * boxed from the head's lip, 0.44 m past the chute's centre line, and the bin's ring frame is
   * 1.9 m across; sliding the gantry clear lets the sleeve (which slopes back to the throat) be
   * the only thing under the head.
   */
  shift: 0.55
};

export function buildWeighHopper(w, site) {
  prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'weigh-hopper';
  const t4 = w.t4;
  const z0 = -HOPPER.back;

  const bench = w.buildBench({ kind: 'assay', plate: 'BN-05', skin: 'deck' });
  g.add(bench.group);

  // The gantry, in its own frame (z0 behind the bench): four legs, braced in X on each face.
  const gg = new THREE.Group();
  gg.position.set(-HOPPER.shift, 0, z0);
  g.add(gg);
  const legGeo = w.own(iBeamGeometry(3.22, { h: 0.16, w: 0.12 }));
  for (const [px, pz] of [[-0.75, -2.1], [0.75, -2.1], [-0.75, -0.9], [0.75, -0.9]]) {
    const leg = new THREE.Mesh(legGeo, w.darkSteelMat);
    leg.position.set(px, 1.61, pz);
    leg.castShadow = t4;
    gg.add(leg);
    k.footing(gg, px, pz, 0.3);
  }
  const xLen = Math.hypot(1.5, 1.6);
  for (const pz of [-2.1, -0.9]) {
    for (const sgn of [-1, 1]) k.box(gg, [0.04, xLen, 0.04], w.darkSteelMat, [0, 1.05, pz], [0, 0, sgn * Math.atan2(1.5, 1.6)]);
  }
  for (const px of [-0.75, 0.75]) {
    for (const sgn of [-1, 1]) k.box(gg, [0.04, Math.hypot(1.2, 1.6), 0.04], w.darkSteelMat, [px, 1.05, -1.5], [sgn * Math.atan2(1.2, 1.6), 0, 0]);
  }
  // The bin: a square frustum, wide at the mouth, necking to the throat, with its inner face.
  const binGeo = w.own(new THREE.CylinderGeometry(1.3, 0.36, 1.25, 4, 1, true));
  binGeo.rotateY(Math.PI / 4);
  const body = new THREE.Mesh(binGeo, w.plateMat);
  body.position.set(0, 2.95, -1.5);
  body.castShadow = body.receiveShadow = t4;
  gg.add(body);
  const inner = new THREE.Mesh(binGeo, w.own(w.darkSteelMat.clone()));
  inner.material.side = THREE.BackSide;
  inner.position.copy(body.position);
  gg.add(inner);
  // The ring frame the bin sits in and the band round its mouth: four members each, never a slab.
  for (const [bw, bd, by] of [[1.66, 1.36, 3.2], [1.9, 1.9, 3.53]]) {
    for (const sgn of [-1, 1]) {
      k.box(gg, [bw, 0.1, 0.08], w.darkSteelMat, [0, by, -1.5 + sgn * bd / 2]);
      k.box(gg, [0.08, 0.1, bd], w.darkSteelMat, [sgn * bw / 2, by, -1.5]);
    }
  }
  k.box(gg, [0.5, 0.5, 0.5], w.darkSteelMat, [0, 2.05, -1.4]);
  // Half the grille thrown back on its hinge.
  k.box(gg, [1.0, 0.05, 1.8], w.darkSteelMat, [-0.45, 3.62, -1.55], [0, 0, 0.05]);

  // THE SLEEVE the belt discharges into: a four-sided chute sloping from just under the
  // head chute's lip, which stands over the bench's centre line, back to the bin's mouth, with
  // a collar at the top to catch the throw and stays to the legs' heads.
  {
    const lip = CONVEYOR.outlet.y - 0.14;          // the sleeve ends short of the belt's chute
    const y0 = 3.58, h = lip - y0;
    const half = Math.max(0.42, CONVEYOR.outlet.half + 0.16);
    const lean = HOPPER.shift;                     // how far the mouth is west of the lip
    const sleeveGeo = w.own(new THREE.CylinderGeometry(half * Math.SQRT2, half * Math.SQRT2 * 0.9, h, 4, 1, true));
    sleeveGeo.rotateY(Math.PI / 4);
    const sp = sleeveGeo.attributes.position;
    for (let i = 0; i < sp.count; i++) sp.setX(i, sp.getX(i) - lean * (0.5 - sp.getY(i) / h));
    sleeveGeo.computeVertexNormals();
    const sleeve = new THREE.Mesh(sleeveGeo, w.plateMat);
    sleeve.position.set(0, y0 + h / 2, z0 - 1.5);
    sleeve.castShadow = sleeve.receiveShadow = t4;
    g.add(sleeve);
    // Inner face, so the open sleeve is solid from inside.
    const sleeveIn = new THREE.Mesh(sleeveGeo, w.own(w.darkSteelMat.clone()));
    sleeveIn.material.side = THREE.BackSide;
    sleeveIn.position.copy(sleeve.position);
    g.add(sleeveIn);
    // The collar at the lip, and stays from the legs' heads up to the sleeve's waist.
    for (const sgn of [-1, 1]) {
      k.box(g, [0.06, 0.08, half * 2 + 0.2], w.darkSteelMat, [sgn * (half + 0.03), lip - 0.04, z0 - 1.5]);
      k.box(g, [half * 2 + 0.2, 0.08, 0.06], w.darkSteelMat, [0, lip - 0.04, z0 - 1.5 + sgn * (half + 0.03)]);
    }
    for (const [lx, lz] of [[-0.75, -2.1], [0.75, -2.1], [-0.75, -0.9], [0.75, -0.9]]) {
      k.strut(g, [lx - HOPPER.shift, 3.2, z0 + lz], [Math.sign(lx) * half * 0.9 - lean * 0.6, y0 + h * 0.55, z0 - 1.5 + Math.sign(lz + 1.5) * half * 0.9], 0.025, w.darkSteelMat);
    }
    // A cable from the head's drive down the near leg.
    k.pipe(g, [[0.78 - HOPPER.shift, 3.2, z0 - 0.9], [0.78 - HOPPER.shift, 1.4, z0 - 0.72], [1.4 - HOPPER.shift, 0.1, z0 - 0.5]], 0.014, w.darkSteelMat);
  }

  // The chute from the throat, the deflector comb across it, and the four catch bins under its mouth.
  k.box(gg, [0.55, 0.06, 2.4], w.plateMat, [0, 1.42, -0.3], [0.42, 0, 0], true);
  for (const rx of [-0.25, 0.25]) k.box(gg, [0.04, 0.09, 2.4], w.darkSteelMat, [rx, 1.47, -0.3], [0.42, 0, 0]);
  k.box(gg, [0.4, 0.3, 0.03], w.darkSteelMat, [0, 1.72, -0.55], [0.42, 0, 0]);
  for (let i = 0; i < 4; i++) k.box(gg, [0.5, 0.42, 0.5], w.bulkMat, [-1.05 + i * 0.7, 0.21, 1.05], null, true);
  // A sampling scoop laid across the third bin, the way a draw is taken off a catch bin (the field point).
  k.box(gg, [0.06, 0.03, 0.62], w.pipeMat, [-1.05 + 2 * 0.7 + 0.14, 0.445, 1.05], [0, 0.35, 0]);

  // The floor balance: post, dial drum and pan.
  k.box(gg, [0.12, 1.05, 0.12], w.darkSteelMat, [2.3, 0.53, 0.9]);
  k.cyl(gg, [0.16, 0.16, 0.1, 18], w.plateMat, [2.3, 1.18, 0.9], [0, 0, Math.PI / 2]);
  k.cyl(gg, [0.24, 0.2, 0.035, 18], w.darkSteelMat, [2.3, 1.3, 0.9]);

  k.tag(gg, 'WH-05', { w: 0.5, h: 0.19 }, [0, 3.05, -0.63]);

  // Deck rails at the ends, and the work lamp.
  for (const sx of [-1, 1]) {
    for (const rz of [-1.0, 0.9]) k.column(g, sx * 3.1, rz, 1.05, { h: 0.08, w: 0.06 });
    k.strut(g, [sx * 3.1, 1.02, -1.0], [sx * 3.1, 1.02, 0.9], 0.025, w.darkSteelMat);
  }
  k.lampMast(g, 3.4, 1.5, { h: 3.6, arm: [-1.7, -0.3] });

  const colliders = [
    { lx: -HOPPER.shift, lz: z0 - 1.5, hw: 0.95, hd: 0.8 },
    { lx: -HOPPER.shift, lz: z0 + 1.05, hw: 1.4, hd: 0.3 },
    { lx: 2.3 - HOPPER.shift, lz: z0 + 0.9, r: 0.35 },
    { lx: 3.4, lz: 1.5, r: 0.2 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  // NO FIELD POINT. The hopper draw was retired: it was the same chlorine as the sample already on the bench.
  const fieldPoints = [];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

/* ======================================================================
   6. THE SACK-FILLING SCALE ON THE BAGGING LINE (shelf)
   Weighed salt comes from the hopper's catch bins on a short belt, a bucket elevator
   lifts it to the bagging bin, and a spout fills a sack on the platform scale; the
   filled sack rolls down to the pallet. The bench is the shelf beside the scale.
   `feedX` is where the hopper's bins end, in this host's frame.
   ====================================================================== */

export function buildBaggingLine(w, site, { feedX = 9.7 } = {}) {
  prepare(w);
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'bagging-line';
  const zL = -3.4;                                     // the line's centre line behind the bench

  k.box(g, [14.0, 0.12, 6.0], w.footingMat, [2.0, -0.06, -3.0]);

  const bench = w.buildBench({ kind: 'assay', plate: 'BN-06', skin: 'shelf' });
  g.add(bench.group);

  // THE TRANSFER BELT from the catch bins: a low troughed belt on trestles to the elevator's boot.
  {
    const x1 = feedX, x0 = 6.6;
    k.box(g, [x1 - x0, 0.08, 0.5], w.darkSteelMat, [(x0 + x1) / 2, 0.62, zL]);
    for (const sz of [-0.28, 0.28]) k.box(g, [x1 - x0, 0.14, 0.04], w.darkSteelMat, [(x0 + x1) / 2, 0.7, zL + sz]);
    for (const tx of [x0 + 0.4, (x0 + x1) / 2, x1 - 0.4]) {
      for (const sz of [-0.25, 0.25]) k.box(g, [0.06, 0.58, 0.06], w.darkSteelMat, [tx, 0.29, zL + sz]);
    }
    for (let x = x0 + 0.2; x < x1 - 0.1; x += 0.3) k.cyl(g, [0.04, 0.04, 0.5, 8], w.pipeMat, [x, 0.67, zL], [Math.PI / 2, 0, 0]);
  }

  // THE BUCKET ELEVATOR: a boot, a tall casing, a head with its discharge chute to the bagging bin.
  {
    const ex = 5.7, top = 4.0;
    k.box(g, [0.7, 0.7, 0.7], w.bulkMat, [ex, 0.55, zL], null, true);
    k.box(g, [0.5, top - 0.9, 0.5], w.plateMat, [ex, (top + 0.9) / 2, zL], null, true);
    for (const y of [1.6, 2.4, 3.2]) k.box(g, [0.58, 0.05, 0.58], w.darkSteelMat, [ex, y, zL]);
    k.box(g, [0.8, 0.6, 0.62], w.plateMat, [ex, top + 0.2, zL], null, true);
    k.cyl(g, [0.12, 0.12, 0.7, 12], w.darkSteelMat, [ex, top + 0.2, zL], [Math.PI / 2, 0, 0]);
    // The head's chute, falling to the bin's mouth on the other side.
    const chute = k.box(g, [1.1, 0.06, 0.34], w.plateMat, [ex - 0.8, top - 0.1, zL], [0, 0, 0.45]);
    chute.castShadow = w.t4;
    // Guard rail up its casing, the ladder.
    for (const sz of [-1, 1]) k.box(g, [0.04, top - 0.6, 0.04], w.darkSteelMat, [ex + 0.36, (top + 0.6) / 2, zL + sz * 0.18]);
    for (let y = 0.8; y < top - 0.4; y += 0.32) k.box(g, [0.03, 0.03, 0.4], w.darkSteelMat, [ex + 0.36, y, zL]);
  }

  // THE BAGGING BIN on four legs, its spout, and the platform scale it fills over.
  {
    const bx = 3.7;
    for (const [dx, dz] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]]) k.column(g, bx + dx, zL + dz, 2.9, { h: 0.14, w: 0.12 });
    for (const dz of [-0.5, 0.5]) k.beam(g, 1.4, w.darkSteelMat, [bx, 2.9, zL + dz], 'x', { h: 0.14, w: 0.1 });
    for (const dx of [-0.6, 0.6]) k.beam(g, 1.1, w.darkSteelMat, [bx + dx, 2.9, zL], 'z', { h: 0.14, w: 0.1 });
    k.cyl(g, [0.85, 0.22, 1.1, 4], w.plateMat, [bx, 3.5, zL], [0, Math.PI / 4, 0], true);
    // The spout and its clamp, the weigh-in feeder above the sack.
    k.cyl(g, [0.14, 0.14, 0.5, 12], w.darkSteelMat, [bx, 2.4, zL]);
    k.box(g, [0.42, 0.1, 0.2], w.darkSteelMat, [bx, 2.14, zL]);
    for (const sx of [-1, 1]) k.box(g, [0.06, 0.2, 0.2], w.darkSteelMat, [bx + sx * 0.18, 2.0, zL]);
    // The platform scale: deck on four load cells, with a pedestal and its dial.
    k.box(g, [1.1, 0.06, 0.85], w.plateMat, [bx, 0.62, zL], null, true);
    for (const [dx, dz] of [[-0.45, -0.34], [0.45, -0.34], [-0.45, 0.34], [0.45, 0.34]]) k.cyl(g, [0.06, 0.07, 0.5, 8], w.darkSteelMat, [bx + dx, 0.3, zL + dz]);
    k.box(g, [1.3, 0.08, 1.0], w.darkSteelMat, [bx, 0.04, zL]);
    k.box(g, [0.1, 1.15, 0.1], w.darkSteelMat, [bx - 0.95, 0.58, zL + 0.5]);
    k.cyl(g, [0.18, 0.18, 0.1, 18], w.plateMat, [bx - 0.95, 1.18, zL + 0.5], [Math.PI / 2, 0, 0]);
    // A sack on the scale, its mouth clamped.
    const sack = new THREE.Mesh(w.own(new THREE.SphereGeometry(0.4, 14, 10)), w.sackMat);
    sack.scale.set(1.0, 0.62, 0.7);
    sack.position.set(bx, 0.95, zL);
    g.add(sack);
    k.tag(g, 'BG-06', { w: 0.44, h: 0.17 }, [bx - 0.95, 1.5, zL + 0.56]);
  }

  // THE ROLLER CONVEYOR from the scale to the pallet, a stitching head across it.
  {
    const x1 = 2.9, x0 = -2.6;
    for (const sz of [-0.38, 0.38]) k.box(g, [x1 - x0, 0.1, 0.05], w.darkSteelMat, [(x0 + x1) / 2, 0.72, zL + sz]);
    for (let x = x0 + 0.1; x < x1; x += 0.2) k.cyl(g, [0.03, 0.03, 0.72, 8], w.pipeMat, [x, 0.74, zL], [Math.PI / 2, 0, 0]);
    for (const lx of [x0 + 0.3, 0, x1 - 0.3]) for (const sz of [-0.34, 0.34]) k.box(g, [0.06, 0.7, 0.06], w.darkSteelMat, [lx, 0.35, zL + sz]);
    // The stitching head: two posts and a bridge, the head hung over the line.
    for (const sz of [-0.55, 0.55]) k.column(g, -0.9, zL + sz, 1.7, { h: 0.1, w: 0.08 });
    k.box(g, [0.1, 0.1, 1.2], w.darkSteelMat, [-0.9, 1.7, zL]);
    k.box(g, [0.28, 0.34, 0.3], w.plateMat, [-0.9, 1.45, zL], null, true);
    k.cyl(g, [0.025, 0.025, 0.3, 8], w.darkSteelMat, [-0.9, 1.15, zL]);
  }

  // THE PALLET at the end of the line, a stack of filled sacks on it.
  {
    const px = -4.3;
    k.box(g, [1.2, 0.12, 1.0], w.timberMat, [px, 0.06, zL]);
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const s = k.box(g, [0.58, 0.2, 0.42], w.sackMat, [px - 0.29 + i * 0.6, 0.22 + layer * 0.2, zL - 0.25 + j * 0.5 + (layer % 2) * 0.04]);
        s.rotation.y = ((i + j + layer) % 3 - 1) * 0.05;
      }
    }
    k.box(g, [0.55, 0.2, 0.4], w.sackMat, [px - 1.05, 0.1, zL + 0.2], [0, 0.3, 0]);
  }

  // A baling-wire reel and a rack of empty sacks on the left, and the lamp.
  for (const sx of [-6.0]) {
    k.box(g, [0.5, 0.5, 0.5], w.sackMat, [sx, 0.25, zL + 0.3]);
    k.cyl(g, [0.22, 0.22, 0.1, 16], w.darkSteelMat, [sx + 0.7, 0.3, zL + 0.2], [Math.PI / 2, 0, 0]);
  }
  k.lampMast(g, -3.3, 1.4, { h: 3.6, arm: [1.6, -0.3] });

  const colliders = [
    { lx: 3.7, lz: zL, hw: 0.8, hd: 0.7 },
    { lx: 5.7, lz: zL, hw: 0.45, hd: 0.45 },
    { lx: (6.6 + feedX) / 2, lz: zL, hw: (feedX - 6.6) / 2, hd: 0.3 },
    { lx: 0, lz: zL, hw: 2.85, hd: 0.5 },
    { lx: -4.5, lz: zL, hw: 0.7, hd: 0.6 },
    { lx: -6.0, lz: zL + 0.3, hw: 0.3, hd: 0.3 },
    { lx: -3.3, lz: 1.4, r: 0.2 },
    { lx: 0, lz: 0, hw: 2.4, hd: 0.65 }
  ];
  // THE FIELD POINT: the filled sack on the platform scale, which has been counted into. It is a real piece of this host (the sack
  // on its scale), the player stands on the open ground in front of the scale (`stand`, host frame) and `[E]` on it brings the
  // counted sack to the bench in the carry slot.
  const fieldPoints = [{
    id: 'sack', label: 'Counted Sack', lx: 3.7, ly: 0.95, lz: zL, half: [0.5, 0.4, 0.45],
    stand: { lx: 3.7, lz: -2.1 }
  }];
  return { group: g, bench, benchLocal: [0, 0, 0], colliders, fieldPoints };
}

export const HOST_BUILDERS = {
  'site-1': buildSamplePoint,
  'site-2': buildInstrumentRoom,
  'site-3': buildControlHouse,
  'site-4': buildTowerDeck,
  'site-5': buildWeighHopper,
  'site-6': buildBaggingLine
};
