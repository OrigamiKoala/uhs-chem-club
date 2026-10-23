/**
 * boss-models.js — The five bosses of the walkable worlds, built to stand in an arena (Kettle's golem has no arena yet).
 *
 * `CombatMonster3D` owns what a body DOES in a fight (it arrives, closes in as it is hurt, winds up, lunges, rears, convulses and
 * comes apart; `boss-arena.js` decides when). This file owns what the bodies ARE: six machines of the Fifth Guild, each built from
 * the working parts of the place it is fought in, ~3 m tall before the arena's 2.2x, with joints that actually hinge.
 *
 *   the hopper         Tallow          a salt-works ore hopper on a mantis's legs, with two sawtooth blades
 *   the lantern-eater  Lanternfall     a gaunt winged thing built round an iron lantern cage, with an iris for a mouth
 *   basalt warden      Ligar           a colossus of jointed basalt columns, magma in its seams
 *   the compressor     Bellows         a reciprocating compressor on stilts, a pressure gauge for a face
 *   the crucible       Ember Reach     a furnace pot in a gantry that tilts to pour slag
 *
 * SCOURED PLATE. Weathered metal, bone-white salt and char; light is filament, not LED: the only lit parts are lenses, seams and a
 * maw, as small emissive surfaces, and `CombatMonster3D.applyTint` drives all of them (they pulse as it is hurt). No point lights.
 *
 * THE RIG CONTRACT. `buildBossRig(species, monster)` adds the body to `monster.group` (origin on the ground, +y up, +z toward the
 * player) and returns `{ update(s) }`, or null for a species it does not build. `s` is the fight's state this frame:
 *   t, dt, pace          clock (seconds, already scaled by how hurt it is) and step
 *   calm                 reduced motion: pose for events, but no idling
 *   wound                0..1 how hurt it is
 *   wind                 0..1 across a wind-up (0 when none)
 *   lunge                0..1 across a lunge (0 when none)
 *   hurt, roar, throes   0..1 impulses: a blow landed / rearing / mortal wound
 *   flash                0..1 the hit flash
 * It may set `monster.muzzle` (an Object3D a bolt leaves from) and register armour with `monster.armour(mesh, at)`: a plate that
 * is struck off once its wound level reaches `at`. The body is built once and only ever posed.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { cachedMaterial, buildMaterial, platedMetal, canvas2d } from '../../three/materials/pbr-kit.js';

const AMBER = 0xe59b24;

const clamp01 = x => Math.max(0, Math.min(1, x));
const sstep = x => { const k = clamp01(x); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;

/**
 * Where a body is in an attack, as two blends that never exceed 1 together: `up` (gathered: arms raised, head back) and `down`
 * (the blow). A wind-up lifts to `up`; the lunge falls through `down` and recovers to rest. Continuous across the hand-over.
 */
export function attackPose(s) {
  const up = s.wind > 0 ? sstep(s.wind) : s.lunge > 0 ? 1 - sstep(s.lunge * 2.2) : 0;
  const down = s.lunge > 0 ? (s.lunge < 0.45 ? sstep(s.lunge / 0.45) : 1 - sstep((s.lunge - 0.45) / 0.55)) : 0;
  return { up, down };
}

/* ------------------------------------------------------------------ the kit */

let PLATE = null;
/** The weathered plate maps, drawn once for all six bodies (a texture is never owned by a monster). */
function plateMaps() {
  if (PLATE !== null) return PLATE;
  try {
    PLATE = cachedMaterial('boss:plate', () => buildMaterial(
      platedMetal({ size: 256, paint: '#cdc6b6', metal: '#8d8a82', rust: '#7a4526', panels: 3, seed: 21, weather: 0.8 }),
      { roughness: 1, metalness: 1 }
    ));
  } catch (e) {
    PLATE = false;   // no canvas (a verifier in Node): flat colour
  }
  return PLATE;
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

class Kit {
  constructor(monster) {
    this.m = monster;
  }

  geo(g) { return this.m.own(g); }

  /** A weathered metal in `color`: the plate maps under a tint. */
  plate(color, { rough = 1, metal = 1, flat = false, side = THREE.FrontSide } = {}) {
    const maps = plateMaps();
    const mat = new THREE.MeshStandardMaterial(maps
      ? { color, map: maps.map, normalMap: maps.normalMap, roughnessMap: maps.roughnessMap, metalnessMap: maps.metalnessMap, roughness: rough, metalness: metal, flatShading: flat, side }
      : { color, roughness: 0.62, metalness: 0.55, flatShading: flat, side });
    return this.m.mat(mat);
  }

  /** A plain material (no maps). */
  std(color, { rough = 0.7, metal = 0.1, flat = false, side = THREE.FrontSide, opacity = 1 } = {}) {
    return this.m.mat(new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, flatShading: flat, side, transparent: opacity < 1, opacity }));
  }

  /** A lit surface: a lens, a seam, a filament. Driven by the monster's tint, so it pulses and flares. */
  glow(color, intensity = 1.6) {
    return this.m.mat(new THREE.MeshStandardMaterial({ color: 0x0d0b09, roughness: 0.4, metalness: 0.2, emissive: color, emissiveIntensity: intensity }));
  }

  at(mesh, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    mesh.position.set(x, y, z);
    if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
    return mesh;
  }

  node(parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const g = new THREE.Group();
    this.at(g, x, y, z, rx, ry, rz);
    parent.add(g);
    return g;
  }

  mesh(parent, geometry, material, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(this.geo(geometry), material);
    this.at(m, x, y, z, rx, ry, rz);
    parent.add(m);
    return m;
  }

  /** A box with its edges eased. */
  box(parent, w, h, d, material, x, y, z, rx, ry, rz, r) {
    const rad = r ?? Math.min(0.045, Math.min(w, h, d) * 0.28);
    return this.mesh(parent, new RoundedBoxGeometry(w, h, d, 2, rad), material, x, y, z, rx, ry, rz);
  }

  cyl(parent, rt, rb, h, seg, material, x, y, z, rx, ry, rz, open = false) {
    return this.mesh(parent, new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), material, x, y, z, rx, ry, rz);
  }

  sph(parent, r, material, x, y, z, sx = 1, sy = 1, sz = 1) {
    const m = this.mesh(parent, new THREE.SphereGeometry(r, 14, 10), material, x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  }

  cone(parent, r, h, seg, material, x, y, z, rx, ry, rz) {
    return this.mesh(parent, new THREE.ConeGeometry(r, h, seg), material, x, y, z, rx, ry, rz);
  }

  torus(parent, R, r, material, x, y, z, rx, ry, rz, radial = 8, tubular = 22) {
    return this.mesh(parent, new THREE.TorusGeometry(R, r, radial, tubular), material, x, y, z, rx, ry, rz);
  }

  /** A body of revolution about the vertical from [radius, height] points. */
  lathe(parent, points, material, x, y, z, seg = 28, rx, ry, rz) {
    return this.mesh(parent, new THREE.LatheGeometry(points.map(([r, h]) => new THREE.Vector2(r, h)), seg), material, x, y, z, rx, ry, rz);
  }

  /** A round strut between two points, in `parent`'s frame. */
  strut(parent, a, b, r, material, seg = 8, rb = r) {
    _a.set(...a);
    _b.set(...b);
    const len = _a.distanceTo(_b);
    const m = this.mesh(parent, new THREE.CylinderGeometry(rb, r, len, seg), material);
    m.position.copy(_a).lerp(_b, 0.5);
    m.quaternion.copy(_q.setFromUnitVectors(UP, _b.sub(_a).normalize()));
    return m;
  }

  /** A square-section beam between two points. */
  beam(parent, a, b, w, d, material) {
    _a.set(...a);
    _b.set(...b);
    const len = _a.distanceTo(_b);
    const m = this.mesh(parent, new RoundedBoxGeometry(w, len, d, 2, Math.min(0.03, w * 0.3, d * 0.3)), material);
    m.position.copy(_a).lerp(_b, 0.5);
    m.quaternion.copy(_q.setFromUnitVectors(UP, _b.sub(_a).normalize()));
    return m;
  }

  /** Bolt heads in a ring or a line, small enough to read as detail. */
  bolts(parent, points, r, material, normal = [0, 0, 1]) {
    const geo = this.geo(new THREE.CylinderGeometry(r, r, r * 0.9, 6));
    const q = new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(...normal).normalize());
    for (const p of points) {
      const m = new THREE.Mesh(geo, material);
      m.position.set(...p);
      m.quaternion.copy(q);
      parent.add(m);
    }
  }

  /** An extruded outline (a blade, a plate). `pts` are [x, y]; the depth runs along z, centred. */
  extrude(parent, pts, depth, material, bevel = 0.012) {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, steps: 1 });
    g.translate(0, 0, -depth / 2);
    return this.mesh(parent, g, material);
  }
}

/* ======================================================================
   THE HOPPER
   A salt-works ore hopper that learned to hunt: a square funnel for a thorax, a salt tank for an abdomen, a wedge head with one
   lens, two sawtooth blades folded like a mantis's, two hind legs built to jump and two front ones to hold.
   ====================================================================== */

/** A scythe blade in the XY plane, length along +x, curving toward -y, the cutting edge serrated on the inside. */
function scytheOutline(len, width, curve) {
  const N = 14;
  const centre = t => [len * t, -curve * len * t * t];
  const normal = t => {
    // the derivative of the centre line, turned a quarter
    const dx = len;
    const dy = -2 * curve * len * t;
    const l = Math.hypot(dx, dy);
    return [-dy / l, dx / l];
  };
  const spine = [];
  const edge = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [cx, cy] = centre(t);
    const [nx, ny] = normal(t);
    const w = width * Math.pow(1 - t, 0.75) + 0.012;
    spine.push([cx + nx * w * 0.35, cy + ny * w * 0.35]);
    // The cutting edge is cut into teeth: every other sample is set back.
    const tooth = i > 1 && i < N - 1 ? (i % 2 === 0 ? 0.0 : 0.075 * Math.min(1, width * 4)) : 0;
    edge.push([cx - nx * (w * 0.65 - tooth), cy - ny * (w * 0.65 - tooth)]);
  }
  return [...spine, ...edge.reverse()];
}

function buildHopper(monster) {
  const k = new Kit(monster);
  const iron = k.plate(0x9a8c78);
  const ironDark = k.plate(0x5a5145);
  const rust = k.plate(0xb4642a);
  const charcoal = k.std(0x23201d, { rough: 0.85, metal: 0.4 });
  const steel = k.std(0xd2cec2, { rough: 0.24, metal: 0.92 });
  const salt = k.std(0xe4ddca, { rough: 0.95, metal: 0.0, flat: true });
  const lens = k.glow(AMBER, 2.4);
  const lensSmall = k.glow(AMBER, 1.6);
  const hose = k.std(0x1b1917, { rough: 0.9, metal: 0.1 });

  const TORSO_Y = 1.15;
  const torso = k.node(monster.group, 0, TORSO_Y, 0);

  /* --- the thorax: a square funnel, mouth up and forward so the load shows --- */
  const fun = k.node(torso, 0, 0.2, 0.02, 0.5);
  const cone = k.cyl(fun, 0.95, 0.45, 1.1, 4, iron, 0, 0, 0, 0, Math.PI / 4, 0, true);
  cone.material.side = THREE.DoubleSide;
  const rim = k.node(fun, 0, 0.55, 0);
  for (const [w, d, x, z] of [[1.5, 0.12, 0, 0.7], [1.5, 0.12, 0, -0.7], [0.12, 1.5, 0.7, 0], [0.12, 1.5, -0.7, 0]]) {
    k.box(rim, w, 0.12, d, rust, x, 0, z);
  }
  // The load: a heap of salt filling the funnel to just under its rim, and lumps spilled over the lip.
  const heap = k.mesh(fun, new THREE.IcosahedronGeometry(0.6, 1), salt, 0, 0.36, 0);
  heap.scale.set(1.05, 0.5, 1.05);
  for (const [x, y, z, r] of [[0.35, 0.5, 0.2, 0.2], [-0.3, 0.46, -0.15, 0.22], [0.1, 0.52, -0.4, 0.17], [-0.18, 0.5, 0.38, 0.15]]) {
    k.mesh(fun, new THREE.IcosahedronGeometry(r, 0), salt, x, y, z).scale.y = 0.7;
  }
  for (const [x, z, sx] of [[0.7, 0.2, 1], [-0.7, -0.3, 1], [0.15, 0.7, 0], [-0.4, -0.7, 0]]) {
    const crust = k.mesh(rim, new THREE.IcosahedronGeometry(0.11, 0), salt, x, 0.08, z);
    crust.scale.set(1.3 + sx * 0.4, 0.6, 1.1);
  }
  k.bolts(cone, [-0.35, -0.12, 0.11, 0.34].map(y => [0, y, 0.62 - (y + 0.55) * 0.28]), 0.026, charcoal, [0, 0, 1]);

  /* --- the chest: a boiler under the funnel, a hazard band across its front --- */
  k.box(torso, 1.1, 0.62, 1.0, ironDark, 0, -0.38, 0.02, 0, 0, 0, 0.07);
  k.box(torso, 1.0, 0.14, 0.05, rust, 0, -0.3, 0.53, 0, 0, 0, 0.012);
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) k.box(torso, 0.04, 0.05, 0.4, charcoal, sx * 0.56, -0.5 + i * 0.12, 0.05, 0, 0, 0, 0.008);
  }
  const hopperPlate = k.box(torso, 0.8, 0.3, 0.05, iron, 0, -0.46, 0.55, 0, 0, 0, 0.012);
  monster.armour(hopperPlate, 0.62);

  /* --- the abdomen: a salt tank, tail up --- */
  const tank = k.node(torso, 0, -0.08, -0.98, -0.32);
  k.mesh(tank, new THREE.CapsuleGeometry(0.56, 0.95, 6, 16), iron, 0, 0, 0, Math.PI / 2);
  for (const [z, m] of [[-0.55, ironDark], [-0.15, rust], [0.25, ironDark], [0.65, ironDark]]) k.torus(tank, 0.565, 0.035, m, 0, 0, z, 0, 0, 0, 6, 28);
  k.bolts(tank, [-0.5, -0.25, 0, 0.25, 0.5].map(a => [Math.sin(a * 3.2) * 0.58, Math.cos(a * 3.2) * 0.58, 0.05]), 0.022, charcoal, [0, 1, 0]);
  for (const [x, y, z, r] of [[0.3, 0.52, -0.3, 0.14], [-0.34, 0.45, 0.2, 0.17], [0.4, 0.34, 0.6, 0.12], [-0.1, 0.57, 0.5, 0.11], [0.05, 0.57, -0.6, 0.12]]) {
    k.mesh(tank, new THREE.IcosahedronGeometry(r, 0), salt, x, y, z).scale.y = 0.65;
  }
  k.cyl(tank, 0.075, 0.105, 0.7, 8, ironDark, -0.22, 0.7, 0.1, 0.18);
  k.cyl(tank, 0.1, 0.1, 0.06, 8, charcoal, -0.23, 1.04, 0.05, 0.18);
  const tankPlate = k.box(tank, 0.55, 0.38, 0.05, rust, 0, 0.22, -0.9, -0.3, 0, 0, 0.012);
  monster.armour(tankPlate, 0.8);
  // Feed hoses from the funnel's throat to the tank.
  for (const sx of [-1, 1]) k.strut(torso, [sx * 0.2, -0.05, -0.3], [sx * 0.38, -0.2, -0.85], 0.05, hose);

  /* --- the head: a wedge with one great lens, on a neck under the funnel --- */
  const neck = k.node(torso, 0, -0.3, 0.52);
  k.box(neck, 0.44, 0.36, 0.34, ironDark, 0, 0, 0.05, 0, 0, 0, 0.05);
  const head = k.node(neck, 0, -0.04, 0.2);
  head.scale.setScalar(1.3);
  const skull = k.box(head, 0.74, 0.5, 0.86, iron, 0, 0, 0.3, 0, 0, 0, 0.07);
  k.box(head, 0.82, 0.09, 0.62, ironDark, 0, 0.29, 0.28, -0.14, 0, 0, 0.02);
  const snout = k.box(head, 0.5, 0.3, 0.4, ironDark, 0, -0.1, 0.74, 0, 0, 0, 0.05);
  const eyeZ = 0.745;
  k.cyl(head, 0.16, 0.16, 0.08, 18, lens, 0, 0.08, eyeZ, Math.PI / 2);
  k.torus(head, 0.175, 0.026, ironDark, 0, 0.08, eyeZ + 0.02, 0, 0, 0, 8, 22);
  for (const sx of [-1, 1]) {
    k.cyl(head, 0.065, 0.065, 0.06, 12, lensSmall, sx * 0.3, 0.02, 0.62, Math.PI / 2, 0, sx * 0.0).rotation.set(Math.PI / 2, 0, 0);
    for (let i = 0; i < 3; i++) k.box(head, 0.03, 0.05, 0.3, charcoal, sx * 0.375, -0.1 + i * 0.09, 0.3, 0, 0, 0, 0.008);
  }
  const antennae = [];
  for (const sx of [-1, 1]) {
    const root = k.node(head, sx * 0.2, 0.3, 0.1, -0.2, 0, sx * 0.3);
    k.strut(root, [0, 0, 0], [0, 0.7, 0.14], 0.015, steel, 5, 0.022);
    k.strut(root, [0, 0.7, 0.14], [0, 1.2, 0.5], 0.008, steel, 5, 0.015);
    antennae.push({ root, sx });
  }
  const jaws = [];
  for (const sx of [-1, 1]) {
    const hinge = k.node(head, sx * 0.22, -0.28, 0.5);
    k.box(hinge, 0.1, 0.09, 0.78, steel, 0, 0, 0.38, 0, 0, 0, 0.015);
    for (let i = 0; i < 4; i++) k.cone(hinge, 0.034, 0.17, 4, steel, -sx * 0.045, 0.1, 0.14 + i * 0.17, 0, 0, 0);
    jaws.push({ hinge, sx });
  }
  const muzzle = k.node(head, 0, -0.05, 0.9);
  monster.muzzle = muzzle;
  monster.armour(skull, 0.4);
  monster.armour(snout, 0.7);

  /* --- the blades: shoulder -> upper arm -> elbow -> forearm -> blade --- */
  const arms = [];
  const bladeGeo = new THREE.ExtrudeGeometry(
    new THREE.Shape(scytheOutline(1.8, 0.34, 0.24).map(([x, y]) => new THREE.Vector2(x, y))),
    { depth: 0.06, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 }
  );
  bladeGeo.translate(0, 0, -0.03);
  bladeGeo.rotateY(-Math.PI / 2);          // length along +z, curving toward -y
  monster.own(bladeGeo);
  for (const sx of [-1, 1]) {
    const shoulder = k.node(torso, sx * 0.82, 0.3, 0.22, -0.9);
    k.cyl(shoulder, 0.22, 0.22, 0.4, 16, rust, 0, 0, 0, 0, 0, Math.PI / 2);
    k.box(shoulder, 0.28, 0.3, 1.05, iron, 0, 0, 0.55, 0, 0, 0, 0.05);
    k.strut(shoulder, [sx * 0.17, 0.2, 0.15], [sx * 0.14, 0.18, 0.85], 0.04, steel, 7);
    const elbow = k.node(shoulder, 0, 0, 1.05, 0.5);
    k.cyl(elbow, 0.18, 0.18, 0.36, 16, ironDark, 0, 0, 0, 0, 0, Math.PI / 2);
    k.box(elbow, 0.2, 0.22, 0.9, iron, 0, 0, 0.46, 0, 0, 0, 0.04);
    const blade = new THREE.Mesh(bladeGeo, steel);
    blade.position.set(0, 0, 0.82);
    blade.rotation.z = sx * 0.2;
    elbow.add(blade);
    arms.push({ sx, shoulder, elbow, blade });
    if (sx < 0) monster.armour(blade, 0.25);
  }

  /* --- legs: two to hold the front, two to jump --- */
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = k.node(torso, sx * 0.72, -0.3, -0.72);
    k.sph(hip, 0.25, ironDark, 0, 0, 0);
    k.strut(hip, [0, 0, 0], [sx * 0.42, 0.5, -0.5], 0.15, iron, 9, 0.18);
    const knee = k.node(hip, sx * 0.42, 0.5, -0.5);
    k.sph(knee, 0.21, rust, 0, 0, 0);
    k.strut(knee, [0, 0, 0], [sx * 0.08, -1.65, 0.5], 0.11, iron, 9, 0.15);
    k.strut(knee, [sx * 0.22, 0.0, 0.1], [sx * 0.2, -1.0, 0.36], 0.045, steel, 7);
    const foot = k.node(knee, sx * 0.08, -1.65, 0.5);
    k.box(foot, 0.44, 0.1, 0.7, ironDark, 0, 0.02, 0.1, 0, 0, 0, 0.035);
    k.box(foot, 0.26, 0.24, 0.26, iron, 0, 0.16, -0.08, 0, 0, 0, 0.05);
    legs.push({ sx, hip, knee, rear: true });

    const fh = k.node(torso, sx * 0.62, -0.38, 0.5);
    k.sph(fh, 0.17, ironDark, 0, 0, 0);
    k.strut(fh, [0, 0, 0], [sx * 0.4, 0.2, 0.42], 0.1, iron, 8, 0.13);
    const fk = k.node(fh, sx * 0.4, 0.2, 0.42);
    k.sph(fk, 0.15, rust, 0, 0, 0);
    k.strut(fk, [0, 0, 0], [sx * 0.1, -1.0, 0.18], 0.07, iron, 8, 0.1);
    const ff = k.node(fk, sx * 0.1, -1.0, 0.18);
    k.box(ff, 0.3, 0.09, 0.44, ironDark, 0, 0.01, 0.06, 0, 0, 0, 0.03);
    legs.push({ sx, hip: fh, knee: fk, rear: false });
  }

  return {
    update(s) {
      const { up, down } = attackPose(s);
      const idle = s.calm ? 0 : 1;
      const t = s.t;
      const bob = idle * Math.sin(t * 1.9) * 0.022;
      const crouch = 0.09 * up + 0.05 * s.roar + 0.07 * s.hurt;
      torso.position.y = TORSO_Y + bob - crouch - s.throes * 0.3;
      // It leans back to gather, drives forward on the blow, throws its head up to roar and reels under a hit.
      torso.rotation.x = 0.04 - 0.16 * up + 0.24 * down - 0.22 * s.roar - 0.18 * s.hurt + s.throes * 0.2;
      torso.rotation.z = Math.sin(t * 43) * 0.03 * s.hurt + Math.sin(t * 31) * 0.05 * s.throes;
      for (const a of arms) {
        const flail = s.throes * Math.sin(t * 17 + a.sx * 2) * 0.5;
        const sway = idle * Math.sin(t * 1.3 + a.sx) * 0.05;
        a.shoulder.rotation.x = -0.9 + sway - up * 0.65 + down * 1.3 - s.roar * 0.35 + flail;
        a.shoulder.rotation.y = a.sx * (-0.1 + up * 0.4 + s.roar * 0.55 - down * 0.35);
        a.elbow.rotation.x = 0.5 - up * 0.3 + down * 0.4 - s.roar * 0.15 + idle * Math.sin(t * 2.1 + a.sx) * 0.06;
      }
      const open = Math.max(s.roar * 0.6, up * 0.55, down * 0.35);
      for (const j of jaws) j.hinge.rotation.y = -j.sx * (open * 0.55 + idle * Math.sin(t * 5) * 0.015);
      head.rotation.x = -0.32 * s.roar - 0.2 * up + 0.2 * down + 0.2 * s.throes;
      head.rotation.y = idle * Math.sin(t * 0.8) * 0.12;
      for (const a of antennae) {
        a.root.rotation.z = a.sx * 0.3 + idle * Math.sin(t * 2.6 + a.sx) * 0.1;
        a.root.rotation.x = -0.2 + idle * Math.sin(t * 2.1) * 0.08;
      }
      for (const l of legs) {
        l.knee.rotation.x = crouch * (l.rear ? 1.6 : 0.8) + idle * Math.sin(t * 0.9 + l.sx) * 0.015;
        l.hip.rotation.x = -crouch * 0.4;
      }
    }
  };
}

/* ======================================================================
   THE COMPRESSOR
   A reciprocating gas compressor that stands up on four hydraulic legs. A receiver drum is its body and a pressure gauge its face;
   its arms are two cylinder blocks whose piston rods punch; a flywheel turns on its back, faster the more it is hurt, and the
   needle follows the wheel into the red.
   ====================================================================== */

/** A pressure gauge's face: dark enamel, a ring of ticks, numbers, a red arc at the top of the range. */
function gaugeFace(size = 256) {
  try {
    const c = canvas2d(size, size);
    const g = c.getContext('2d');
    g.fillStyle = '#d8d2c0';
    g.fillRect(0, 0, size, size);
    const cx = size / 2;
    const a0 = -2.3 - Math.PI / 2;
    const span = 4.6;
    g.lineCap = 'butt';
    // The red end of the range.
    g.strokeStyle = '#a8321f';
    g.lineWidth = size * 0.07;
    g.beginPath();
    g.arc(cx, cx, size * 0.4, a0 + span * 0.78, a0 + span);
    g.stroke();
    g.strokeStyle = '#1c1a17';
    for (let i = 0; i <= 40; i++) {
      const a = a0 + (span * i) / 40;
      const major = i % 5 === 0;
      g.lineWidth = major ? size * 0.016 : size * 0.007;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * size * (major ? 0.31 : 0.34), cx + Math.sin(a) * size * (major ? 0.31 : 0.34));
      g.lineTo(cx + Math.cos(a) * size * 0.37, cx + Math.sin(a) * size * 0.37);
      g.stroke();
    }
    g.fillStyle = '#1c1a17';
    g.font = `bold ${size * 0.075}px sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (span * i) / 8;
      g.fillText(String(i), cx + Math.cos(a) * size * 0.23, cx + Math.sin(a) * size * 0.23);
    }
    g.font = `${size * 0.05}px sans-serif`;
    g.fillText('BAR', cx, cx + size * 0.14);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  } catch (e) {
    return null;
  }
}

function buildCompressor(monster) {
  const k = new Kit(monster);
  const iron = k.plate(0x8d9488);
  const ironDark = k.plate(0x4d524d);
  const blue = k.plate(0x4f6b7a);
  const rust = k.plate(0xa9622c);
  const charcoal = k.std(0x1f1f1d, { rough: 0.85, metal: 0.4 });
  const steel = k.std(0xd6d6cf, { rough: 0.22, metal: 0.95 });
  const brass = k.std(0xb8913f, { rough: 0.4, metal: 0.85 });
  const lensA = k.glow(AMBER, 2.0);
  const steam = monster.mat(new THREE.MeshStandardMaterial({ color: 0xdfe6e6, roughness: 1, metalness: 0, transparent: true, opacity: 0.0, depthWrite: false }));
  const faceTex = gaugeFace();
  if (faceTex) monster.own(faceTex);
  const face = monster.mat(new THREE.MeshStandardMaterial({ color: 0xffffff, map: faceTex, roughness: 0.55, metalness: 0.0 }));

  const TORSO_Y = 2.3;
  const body = k.node(monster.group, 0, 0, 0);
  const torso = k.node(body, 0, TORSO_Y, 0);

  /* --- the receiver: a vertical drum with domed ends, hooped --- */
  k.mesh(torso, new THREE.CapsuleGeometry(0.85, 1.0, 8, 24), blue, 0, 0, -0.05);
  for (const y of [-0.62, -0.2, 0.62]) k.torus(torso, 0.865, 0.04, ironDark, 0, y, -0.05, Math.PI / 2, 0, 0, 6, 32);
  k.torus(torso, 0.865, 0.045, rust, 0, 0.2, -0.05, Math.PI / 2, 0, 0, 6, 32);
  k.bolts(torso, Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 1.6 - Math.PI * 0.8; return [Math.sin(a) * 0.87, -0.2 + 0.0, Math.cos(a) * 0.87 - 0.05]; }), 0.026, charcoal, [0, 1, 0]);

  /* --- the face: a gauge in a brass bezel, two sight-glass eyes over it --- */
  const gauge = k.node(torso, 0, 0.02, 0.8);
  k.cyl(gauge, 0.5, 0.5, 0.12, 32, ironDark, 0, 0, 0, Math.PI / 2);
  k.torus(gauge, 0.5, 0.06, brass, 0, 0, 0.05, 0, 0, 0, 10, 36);
  k.mesh(gauge, new THREE.CircleGeometry(0.46, 40), face, 0, 0, 0.07);
  const needlePivot = k.node(gauge, 0, 0, 0.1);
  k.box(needlePivot, 0.035, 0.4, 0.015, charcoal, 0, 0.14, 0, 0, 0, 0, 0.004);
  k.box(needlePivot, 0.045, 0.16, 0.015, charcoal, 0, -0.1, 0, 0, 0, 0, 0.004);
  k.cyl(needlePivot, 0.045, 0.045, 0.03, 12, brass, 0, 0, 0.01, Math.PI / 2);
  for (const sx of [-1, 1]) {
    k.cyl(torso, 0.17, 0.17, 0.14, 16, ironDark, sx * 0.4, 0.78, 0.55, Math.PI / 2 - 0.35);
    k.cyl(torso, 0.12, 0.12, 0.05, 16, lensA, sx * 0.4, 0.8, 0.62, Math.PI / 2 - 0.35);
    k.torus(torso, 0.17, 0.025, brass, sx * 0.4, 0.8, 0.605, -0.35, 0, 0, 8, 20);
  }
  // the manifold: a pipe run across the chest under the gauge, with a relief valve at its middle that vents
  k.strut(torso, [-0.85, -0.62, 0.62], [0.85, -0.62, 0.62], 0.07, ironDark, 10);
  const valve = k.node(torso, 0, -0.62, 0.7);
  k.cyl(valve, 0.11, 0.14, 0.26, 12, rust, 0, 0, 0.0, Math.PI / 2);
  const muzzle = k.node(valve, 0, 0, 0.18);
  monster.muzzle = muzzle;
  const compPlate = k.box(torso, 0.8, 0.34, 0.06, rust, 0, -0.95, 0.5, -0.35, 0, 0, 0.012);
  monster.armour(compPlate, 0.4);

  /* --- the stacks: two chimneys on top that breathe steam --- */
  const puffs = [];
  for (const sx of [-1, 1]) {
    k.cyl(torso, 0.1, 0.13, 0.7, 10, ironDark, sx * 0.42, 1.2, -0.25);
    k.cyl(torso, 0.14, 0.11, 0.1, 10, charcoal, sx * 0.42, 1.58, -0.25);
    const puff = k.mesh(torso, new THREE.IcosahedronGeometry(0.25, 1), steam, sx * 0.42, 1.8, -0.25);
    puffs.push({ puff, sx });
  }
  k.cyl(torso, 0.07, 0.09, 0.4, 8, steel, 0, 1.1, -0.5, 0.2);   // the safety valve

  /* --- the flywheel on its back: a spoked wheel, a crank, the cross-head it drives --- */
  const wheel = k.node(torso, 0, 0.1, -1.05);
  k.torus(wheel, 0.95, 0.12, ironDark, 0, 0, 0, 0, Math.PI / 2, 0, 10, 36);
  k.cyl(wheel, 0.2, 0.2, 0.34, 16, steel, 0, 0, 0, 0, 0, Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    k.beam(wheel, [0, 0, 0], [0, Math.cos(a) * 0.9, Math.sin(a) * 0.9], 0.1, 0.07, iron);
  }
  k.box(wheel, 0.28, 0.2, 0.2, rust, 0, 0.82, 0, 0, 0, 0, 0.02);   // the counterweight
  const wheelBase = k.node(torso, 0, 0.1, -1.05);
  for (const sx of [-1, 1]) k.beam(wheelBase, [sx * 0.55, -1.05, 0.05], [sx * 0.2, 0.0, 0], 0.1, 0.12, ironDark);

  /* --- the arms: shoulder -> cylinder block with cooling fins -> piston rod -> crosshead --- */
  const arms = [];
  for (const sx of [-1, 1]) {
    const shoulder = k.node(torso, sx * 1.15, 0.42, 0.1, 0.1);
    k.sph(shoulder, 0.3, ironDark, 0, 0, 0);
    k.cyl(shoulder, 0.34, 0.34, 1.15, 20, iron, sx * 0.0, 0, 0.62, Math.PI / 2);
    for (let i = 0; i < 6; i++) k.cyl(shoulder, 0.43, 0.43, 0.05, 22, ironDark, 0, 0, 0.2 + i * 0.16, Math.PI / 2);
    monster.armour(k.cyl(shoulder, 0.28, 0.4, 0.18, 18, rust, 0, 0, 1.24, Math.PI / 2), sx < 0 ? 0.3 : 0.65);          // cylinder head
    k.cyl(shoulder, 0.14, 0.14, 0.12, 12, brass, 0, 0, 1.36, Math.PI / 2);
    const rod = k.node(shoulder, 0, 0, 1.36);
    k.cyl(rod, 0.09, 0.09, 1.1, 12, steel, 0, 0, 0.5, Math.PI / 2);
    k.cyl(rod, 0.3, 0.3, 0.34, 18, ironDark, 0, 0, 1.1, Math.PI / 2);                // the crosshead: the fist
    k.cyl(rod, 0.34, 0.34, 0.06, 18, steel, 0, 0, 1.3, Math.PI / 2);
    k.bolts(rod, Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return [Math.cos(a) * 0.23, Math.sin(a) * 0.23, 1.28]; }), 0.028, charcoal, [0, 0, 1]);
    arms.push({ sx, shoulder, rod });
  }

  /* --- the legs: a hull under the drum and four hydraulic stilts --- */
  k.box(torso, 1.9, 0.5, 1.6, ironDark, 0, -1.28, 0, 0, 0, 0, 0.07);
  k.box(torso, 1.5, 0.12, 1.2, charcoal, 0, -1.55, 0, 0, 0, 0, 0.03);
  const legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const hip = k.node(torso, sx * 0.95, -1.2, sz * 0.62);
    k.sph(hip, 0.3, rust, 0, 0, 0);
    k.strut(hip, [0, 0, 0], [sx * 0.5, -0.45, sz * 0.12], 0.2, iron, 10, 0.24);
    const knee = k.node(hip, sx * 0.5, -0.45, sz * 0.12);
    k.sph(knee, 0.25, ironDark, 0, 0, 0);
    k.strut(knee, [0, 0, 0], [sx * 0.08, -0.62, 0], 0.16, steel, 10, 0.2);
    k.strut(knee, [sx * 0.26, 0.05, 0.18], [sx * 0.24, -0.5, 0.18], 0.06, brass, 7);
    const foot = k.node(knee, sx * 0.08, -0.62, 0);
    k.box(foot, 0.62, 0.14, 0.78, ironDark, 0, 0.02, sz * 0.05, 0, 0, 0, 0.04);
    k.box(foot, 0.34, 0.2, 0.3, iron, 0, 0.17, 0, 0, 0, 0, 0.05);
    legs.push({ sx, sz, hip, knee });
  }

  let wheelAngle = 0;
  return {
    update(s) {
      const { up, down } = attackPose(s);
      const idle = s.calm ? 0 : 1;
      const t = s.t;
      // The wheel turns faster the more it is hurt and the more it has gathered; the pistons follow its crank.
      wheelAngle += (s.calm ? 0 : s.dt) * (2.2 + s.wound * 5 + up * 3);
      wheel.rotation.x = wheelAngle;
      const pump = idle * Math.sin(wheelAngle * 2);
      torso.position.y = TORSO_Y + idle * Math.sin(t * 2.4) * 0.018 - 0.1 * up - 0.06 * s.hurt - s.throes * 0.4;
      torso.rotation.x = -0.1 * up + 0.14 * down - 0.14 * s.roar - 0.12 * s.hurt + s.throes * 0.18;
      torso.rotation.z = Math.sin(t * 40) * 0.025 * s.hurt + Math.sin(t * 29) * 0.04 * s.throes + idle * Math.sin(wheelAngle * 2) * 0.004;
      // The needle goes up with the wound, up again as it gathers and into the red at the blow.
      const v = clamp01(0.22 + 0.5 * s.wound + 0.22 * up + 0.2 * down + 0.05 * pump + 0.12 * s.roar + s.throes * 0.3 * Math.sin(t * 30));
      needlePivot.rotation.z = -(-2.3 + 4.6 * v);
      for (const a of arms) {
        a.shoulder.rotation.x = 0.1 - up * 0.75 + down * 0.4 - s.roar * 0.35 + s.throes * Math.sin(t * 19 + a.sx) * 0.4;
        a.shoulder.rotation.y = a.sx * (0.05 + up * 0.3 + s.roar * 0.5 - down * 0.2);
        // the rod: pumping at idle, drawn back to gather, driven out at the blow
        a.rod.position.z = 1.36 + 0.07 * pump * (a.sx > 0 ? 1 : -1) - up * 0.45 + down * 0.9;
      }
      for (const l of legs) {
        l.knee.rotation.x = (0.05 + 0.15 * up) * l.sz * 0.3;
        l.hip.rotation.z = idle * Math.sin(t * 1.1 + l.sx) * 0.004;
      }
      // Steam: a breath at idle, a gout when it vents (roar) or is hurt.
      const vent = clamp01(0.15 + 0.5 * s.roar + 0.4 * s.hurt + 0.3 * up + 0.5 * s.wound * (0.5 + 0.5 * Math.sin(t * 5)));
      for (const p of puffs) {
        const grow = 0.55 + vent * 1.3 + idle * Math.sin(t * 3 + p.sx) * 0.12;
        p.puff.scale.set(grow, grow * (1 + vent * 0.8), grow);
        p.puff.position.y = 1.78 + vent * 0.28;
      }
      steam.opacity = 0.2 + vent * 0.4;
    }
  };
}

/* ======================================================================
   THE CRUCIBLE
   A furnace pot hung in a gantry, a face of tap-holes on its belly. It tilts back to gather, forward to pour slag, lifts its lid to
   vent; the molten surface and the seam under the lid are its only light.
   ====================================================================== */

function buildCrucible(monster) {
  const k = new Kit(monster);
  const iron = k.plate(0x77706a);
  const ironDark = k.plate(0x403b37);
  const brick = k.plate(0x9a6048);
  const brickDark = k.plate(0x6a4434);
  const brass = k.std(0xb48a3a, { rough: 0.4, metal: 0.85 });
  const charcoal = k.std(0x1d1a18, { rough: 0.9, metal: 0.3 });
  const steel = k.std(0xc8c4ba, { rough: 0.3, metal: 0.9 });
  const rust = k.plate(0xa85a26);
  const magma = k.glow(0xff6a1a, 2.6);
  const magmaSoft = k.glow(0xff8a2a, 1.6);
  const slag = monster.mat(new THREE.MeshStandardMaterial({ color: 0x2a0d05, roughness: 0.6, metalness: 0.1, emissive: 0xff5a14, emissiveIntensity: 2.0, transparent: true, opacity: 0.95 }));
  const steam = monster.mat(new THREE.MeshStandardMaterial({ color: 0xe0dcd4, roughness: 1, metalness: 0, transparent: true, opacity: 0, depthWrite: false }));

  const body = k.node(monster.group, 0, 0, 0);
  const AXIS_Y = 3.3;

  /* --- the gantry: two A-frames on skids, a cross beam, bearing blocks on the pins --- */
  for (const sx of [-1, 1]) {
    k.beam(body, [sx * 1.9, 0.2, 0.95], [sx * 1.4, AXIS_Y - 0.1, 0.12], 0.3, 0.3, iron);
    k.beam(body, [sx * 1.9, 0.2, -0.95], [sx * 1.4, AXIS_Y - 0.1, -0.12], 0.3, 0.3, iron);
    k.beam(body, [sx * 1.74, 1.2, 0.58], [sx * 1.74, 1.2, -0.58], 0.18, 0.18, ironDark);
    k.beam(body, [sx * 1.88, 0.5, 0.9], [sx * 1.6, 1.9, -0.45], 0.1, 0.1, ironDark);
    k.box(body, 0.8, 0.22, 2.6, ironDark, sx * 1.9, 0.11, 0, 0, 0, 0, 0.05);       // the skid
    k.bolts(body, [-1.0, -0.5, 0, 0.5, 1.0].map(z => [sx * 1.9, 0.23, z]), 0.04, charcoal, [0, 1, 0]);
    k.box(body, 0.62, 0.62, 0.86, ironDark, sx * 1.4, AXIS_Y, 0, 0, 0, 0, 0.06);    // the bearing block
    k.cyl(body, 0.27, 0.27, 0.42, 18, steel, sx * 1.05, AXIS_Y, 0, 0, 0, Math.PI / 2);   // the pin
    k.torus(body, 0.3, 0.04, brass, sx * 1.12, AXIS_Y, 0, 0, Math.PI / 2, 0, 8, 22);
    k.box(body, 0.46, 0.22, 0.46, rust, sx * 1.9, 0.32, 0.95, 0, 0, 0, 0.03);
  }
  k.beam(body, [-1.4, AXIS_Y + 0.42, 0], [1.4, AXIS_Y + 0.42, 0], 0.34, 0.5, ironDark);
  k.beam(body, [-1.0, AXIS_Y + 0.7, 0], [1.0, AXIS_Y + 0.7, 0], 0.12, 0.12, steel);

  /* --- the pot: lathed, hooped in brass, a face of tap-holes on its belly --- */
  const pivot = k.node(body, 0, AXIS_Y, 0);
  const pot = k.node(pivot, 0, -0.4, 0);
  const profile = [[0.02, -1.5], [0.55, -1.46], [0.88, -1.12], [1.04, -0.55], [1.0, 0.0], [0.84, 0.45], [0.66, 0.68], [0.72, 0.8], [0.78, 0.9]];
  const shell = k.lathe(pot, profile, brick, 0, 0, 0, 36);
  shell.material.side = THREE.DoubleSide;
  // the inside: a dark floor and the molten surface, a hand under the rim
  k.mesh(pot, new THREE.CircleGeometry(0.66, 32).rotateX(-Math.PI / 2), magma, 0, 0.62, 0);
  for (const [y, r, m] of [[-1.05, 0.9, brass], [-0.35, 1.05, ironDark], [0.3, 0.93, brass]]) k.torus(pot, r + 0.02, 0.05, m, 0, y, 0, Math.PI / 2, 0, 0, 8, 40);
  k.bolts(pot, Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [Math.sin(a) * 1.07, -0.35, Math.cos(a) * 1.07]; }), 0.035, steel, [0, 1, 0]);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    k.box(pot, 0.1, 0.9, 0.06, ironDark, Math.sin(a) * 0.98, -0.8, Math.cos(a) * 0.98, 0, a, 0, 0.012);
  }
  // the face: two slit eyes cut through the belly, a tap-hole for a mouth
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = k.box(pot, 0.4, 0.1, 0.07, magma, sx * 0.4, -0.12, 0.98, 0, sx * 0.4, sx * -0.28, 0.01);
    eyes.push(eye);
    k.box(pot, 0.5, 0.05, 0.05, ironDark, sx * 0.4, 0.0, 1.0, 0, sx * 0.4, sx * -0.28, 0.01);
  }
  const mouth = k.node(pot, 0, -0.78, 1.0, 0.0);
  k.torus(mouth, 0.24, 0.07, ironDark, 0, 0, 0, 0, 0, 0, 8, 22);
  k.mesh(mouth, new THREE.CircleGeometry(0.2, 20), magmaSoft, 0, 0, 0.02);
  const potPlate = k.box(pot, 0.7, 0.5, 0.06, rust, 0.0, -0.55, 1.1, 0.12, 0, 0, 0.015);
  monster.armour(potPlate, 0.45);
  const potPlate2 = k.box(pot, 0.5, 0.7, 0.06, brickDark, 0.92, -0.2, 0.4, 0, 1.0, 0, 0.015);
  monster.armour(potPlate2, 0.7);

  /* --- the lid: a clamped cap on the rim that lifts to vent --- */
  const lid = k.node(pot, 0, 0.9, 0);
  k.lathe(lid, [[0.8, 0.0], [0.74, 0.1], [0.5, 0.34], [0.2, 0.52], [0.0, 0.56]], ironDark, 0, 0, 0, 28);
  k.torus(lid, 0.8, 0.045, brass, 0, 0.03, 0, Math.PI / 2, 0, 0, 8, 34);
  k.sph(lid, 0.15, steel, 0, 0.62, 0);
  k.torus(lid, 0.2, 0.03, steel, 0, 0.72, 0, Math.PI / 2, 0, 0);
  k.torus(lid, 0.77, 0.03, magma, 0, -0.02, 0, Math.PI / 2, 0, 0, 6, 34);   // the seam of light under the lid
  const puff = k.mesh(lid, new THREE.IcosahedronGeometry(0.4, 1), steam, 0, 0.9, 0);
  // clamps: three toggles that open with the lid
  const clamps = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const c = k.node(pot, Math.sin(a) * 0.86, 0.78, Math.cos(a) * 0.86, 0, a, 0);
    k.box(c, 0.1, 0.34, 0.07, steel, 0, 0, 0.05, 0, 0, 0, 0.012);
    clamps.push(c);
  }

  /* --- the slag it pours, and the point it pours from --- */
  const stream = k.cyl(body, 0.15, 0.1, 1, 10, slag, 0, 1.5, 1.05);
  stream.scale.y = 0.001;
  const muzzle = k.node(body, 0, 2.8, 1.05);
  monster.muzzle = muzzle;
  k.cyl(body, 0.5, 0.6, 0.06, 18, magma, 0, 0.04, 1.05);          // the pool it pours into
  const pool = body.children[body.children.length - 1];
  pool.scale.setScalar(0.001);

  return {
    update(s) {
      const { up, down } = attackPose(s);
      const idle = s.calm ? 0 : 1;
      const t = s.t;
      // It tilts back to gather, forward to pour, and swings in its pins when it is struck.
      const swing = Math.sin(t * 5) * s.hurt * 0.07;
      pivot.rotation.x = -0.18 * up + 1.25 * down - 0.1 * s.roar + s.throes * 0.3 * Math.sin(t * 9) + idle * Math.sin(t * 0.9) * 0.012;
      pivot.rotation.z = swing + idle * Math.sin(t * 0.7) * 0.01 + s.throes * Math.sin(t * 21) * 0.06;
      // The lid rises on a roar, a gather and a pour; the clamps drop away from it.
      const lift = clamp01(s.roar * 0.9 + up * 0.5 + down * 1.0 + s.wound * 0.12 * (0.5 + 0.5 * Math.sin(t * 3)));
      lid.position.y = 0.9 + lift * 0.55 + (s.calm ? 0 : Math.sin(t * 22) * 0.012 * s.roar);
      lid.position.z = -down * 0.55;
      lid.rotation.x = -down * 0.9;
      for (const c of clamps) c.rotation.x = lift * 1.1;
      // Steam off the open pot; it thickens as the pot is hurt.
      const vent = clamp01(0.1 + lift * 0.9 + s.wound * 0.3);
      puff.scale.setScalar(0.5 + vent * 1.3 + idle * Math.sin(t * 3.4) * 0.1);
      steam.opacity = 0.12 + 0.3 * vent;
      // The pour: a column from the lip to the pool, only while the pot is tipped.
      const pour = clamp01((down - 0.35) / 0.5);
      stream.scale.set(1 + 0.2 * Math.sin(t * 30), Math.max(0.001, pour * 2.7), 1 + 0.2 * Math.cos(t * 27));
      stream.position.y = 2.8 - pour * 1.35;
      pool.scale.setScalar(Math.max(0.001, pour * (1.2 + 0.2 * Math.sin(t * 12))));
      body.position.y = -s.throes * 0.5 * clamp01(s.throes);
      body.rotation.z = Math.sin(t * 38) * 0.012 * s.hurt;
      body.rotation.x = s.throes * 0.06 * Math.sin(t * 11);
    }
  };
}

/* ======================================================================
   THE BASALT WARDEN
   Jointed columnar basalt: hexagonal prisms with cleavage planes, bundled into a colossus. Magma shows in its seams, its heart and
   the slit of its visor, and brightens as it is hurt. Pieces of its own lattice hang about it.
   ====================================================================== */

function buildWarden(monster) {
  const k = new Kit(monster);
  const rock = k.plate(0x8a8892, { flat: true });
  const rockDark = k.plate(0x4c4b53, { flat: true });
  const rockLight = k.plate(0xaaa8b0, { flat: true });
  const magma = k.glow(0xff4818, 2.6);
  const magmaSoft = k.glow(0xff6a24, 1.6);

  const hexMesh = new THREE.CylinderGeometry(1, 0.95, 1, 6);
  monster.own(hexMesh);
  /** One basalt column: a hexagonal prism, `r` across and `h` tall, standing on y = 0 of its own node (turned on its axis by `yaw`). */
  const col = (parent, r, h, mat, x, y, z, yaw = 0, rx = 0, rz = 0) => {
    const m = new THREE.Mesh(hexMesh, mat);
    m.scale.set(r, h, r);
    m.position.set(x, y + h / 2, z);
    m.rotation.set(rx, yaw, rz);
    parent.add(m);
    return m;
  };
  /** A column hung from its node's origin downward (an arm, a thigh): top at y = 0. */
  const hang = (parent, r, h, mat, x = 0, z = 0, yaw = 0) => col(parent, r, h, mat, x, -h, z, yaw);
  /** A cleavage plane: a thin dark disc on a column's face. */
  const joint = (parent, r, y, z = 0, x = 0) => col(parent, r * 1.04, 0.07, rockDark, x, y, z);

  const root = k.node(monster.group, 0, 0, 0);

  /* --- legs: thigh, knee slab, shin, a broad foot --- */
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = k.node(root, sx * 0.85, 2.0, 0);
    hang(hip, 0.56, 1.05, rock, 0, 0, sx);
    joint(hip, 0.56, -0.5);
    const knee = k.node(hip, 0, -1.05, 0);
    col(knee, 0.64, 0.3, rockDark, 0, -0.16, 0.04, 0.2);
    hang(knee, 0.5, 0.78, rock, 0, 0.02, -sx);
    k.box(knee, 0.2, 0.46, 0.06, magmaSoft, sx * 0.22, -0.55, 0.52, 0, 0, 0, 0.008);
    const foot = k.node(knee, 0, -1.1, 0.1);
    col(foot, 0.86, 0.34, rockDark, 0, 0, 0.12, 0.3);
    col(foot, 0.5, 0.26, rock, 0, 0.34, 0.0, 0.1);
    legs.push({ sx, hip, knee });
  }
  col(root, 1.25, 0.55, rockDark, 0, 1.95, 0, 0.1);   // the pelvis

  /* --- the chest: a waist, a flared breast, a heart in a plate --- */
  const chest = k.node(root, 0, 2.5, 0);
  col(chest, 0.95, 0.75, rock, 0, 0, 0, 0.4);
  const breast = k.node(chest, 0, 0.75, 0);
  col(breast, 1.5, 1.35, rock, 0, 0, 0, 0.0);
  joint(breast, 1.5, 0.62);
  for (const sx of [-1, 1]) {
    k.box(breast, 0.06, 1.1, 0.06, magma, sx * 0.62, 0.7, 1.0, 0, 0, 0, 0.01);
    k.box(breast, 0.06, 0.7, 0.06, magmaSoft, sx * 1.1, 0.55, 0.62, 0, -0.6 * sx, 0, 0.01);
  }
  col(breast, 0.6, 0.12, rockDark, 0, 0.65, 1.2, 0, Math.PI / 2);
  col(breast, 0.4, 0.1, magma, 0, 0.65, 1.28, 0, Math.PI / 2);   // the heart
  const chestPlate = col(breast, 0.7, 0.26, rockLight, 0, 0.18, 1.18, 0.0, Math.PI / 2 - 0.35);
  monster.armour(chestPlate, 0.5);
  // the organ-pipe ridge down its back
  [[-0.9, 1.6, 0.4], [-0.45, 2.3, 0.36], [0, 2.7, 0.42], [0.45, 2.2, 0.34], [0.9, 1.5, 0.4]].forEach(([x, h, r], i) => {
    col(breast, r, h, i % 2 ? rockLight : rock, x, 0.5, -1.1, i * 0.4);
  });

  /* --- the head: a block set between the shoulders, a visor of magma, two short horns --- */
  const head = k.node(breast, 0, 1.25, 0.4);
  head.scale.setScalar(1.2);
  k.box(head, 0.98, 0.78, 0.96, rockDark, 0, 0.36, 0, 0, 0, 0, 0.06);
  k.box(head, 0.8, 0.12, 0.1, magma, 0, 0.42, 0.5, 0, 0, 0, 0.012);
  k.box(head, 0.12, 0.4, 0.1, magmaSoft, 0.2, 0.3, 0.5, 0, 0, 0, 0.01);
  k.box(head, 0.12, 0.4, 0.1, magmaSoft, -0.2, 0.3, 0.5, 0, 0, 0, 0.01);
  const brow = k.box(head, 1.1, 0.22, 0.4, rock, 0, 0.78, 0.35, 0.2, 0, 0, 0.04);
  monster.armour(brow, 0.38);
  for (const sx of [-1, 1]) col(head, 0.2, 0.85, rockLight, sx * 0.62, 0.5, -0.1, 0, 0, -sx * 0.45);
  const muzzle = k.node(head, 0, 0.4, 0.55);
  monster.muzzle = muzzle;

  /* --- the arms: a pauldron, a thick upper arm, an elbow slab, a thicker forearm, a hex fist --- */
  const arms = [];
  for (const sx of [-1, 1]) {
    const shoulder = k.node(breast, sx * 1.95, 0.95, 0);
    const pauldron = col(shoulder, 0.92, 0.5, rockLight, sx * -0.1, 0.0, 0, 0.3);
    monster.armour(pauldron, sx < 0 ? 0.3 : 0.62);
    col(shoulder, 0.64, 0.5, rockDark, 0, -0.1, 0, 0, 0, Math.PI / 2).rotation.z = Math.PI / 2;
    const arm = k.node(shoulder, 0, -0.1, 0);
    hang(arm, 0.5, 1.7, rock, 0, 0, sx * 0.3);
    joint(arm, 0.5, -0.85);
    k.box(arm, 0.06, 1.2, 0.06, magmaSoft, sx * 0.4, -0.95, 0.38, 0, 0, 0, 0.01);
    const elbow = k.node(arm, 0, -1.7, 0);
    col(elbow, 0.58, 0.34, rockDark, 0, -0.17, 0.0, 0.2);
    hang(elbow, 0.58, 1.4, rock, 0, 0.05, -sx * 0.2).position.y -= 0.12;
    const fist = k.node(elbow, 0, -1.65, 0.1);
    col(fist, 0.95, 0.85, rockLight, 0, -0.5, 0.1, 0.5);
    k.box(fist, 1.35, 0.1, 0.1, magma, 0, -0.1, 0.78, 0, 0, 0, 0.012);
    for (const dx of [-0.42, 0, 0.42]) col(fist, 0.2, 0.3, rockDark, dx, -0.72, 0.72, 0.2);
    arms.push({ sx, shoulder, elbow, fist });
  }

  return {
    update(s) {
      const { up, down } = attackPose(s);
      const idle = s.calm ? 0 : 1;
      const t = s.t;
      root.position.y = idle * Math.sin(t * 1.6) * 0.02 - 0.12 * up - 0.06 * s.hurt - s.throes * 0.5;
      chest.rotation.x = 0.03 - 0.12 * up + 0.24 * down - 0.14 * s.roar - 0.12 * s.hurt + s.throes * 0.22;
      chest.rotation.z = Math.sin(t * 41) * 0.02 * s.hurt + Math.sin(t * 27) * 0.04 * s.throes;
      breast.rotation.y = idle * Math.sin(t * 0.5) * 0.04;
      for (const a of arms) {
        const flail = s.throes * Math.sin(t * 15 + a.sx * 2) * 0.5;
        a.shoulder.rotation.x = 0.1 + idle * Math.sin(t * 1.2 + a.sx) * 0.03 - up * 2.8 - down * 1.15 - s.roar * 1.0 + flail;
        a.shoulder.rotation.z = a.sx * (0.1 + s.roar * 0.9 + up * 0.18);
        a.elbow.rotation.x = -0.35 - up * 0.25 - down * 0.35 - s.roar * 0.2;
      }
      head.rotation.x = -0.26 * s.roar - 0.14 * up + 0.2 * down + 0.2 * s.throes;
      head.rotation.y = idle * Math.sin(t * 0.7) * 0.1;
      for (const l of legs) {
        l.hip.rotation.x = -0.05 * up;
        l.knee.rotation.x = 0.1 * up + 0.07 * s.hurt;
      }
    }
  };
}

/* ======================================================================
   THE LANTERN-EATER
   A gaunt winged thing built round an iron lantern cage with a stolen light caged inside it; a camera's iris is its mouth and the
   light shows when it opens. Dead lanterns hang from it on chains. Its body hovers: the origin is where it floats, tendrils below.
   ====================================================================== */

/** A membrane between a wing's spars, scalloped between the tips. Points are in the wing's frame; the sheet is two-sided. */
function wingSheet(S, tips, B) {
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const notch = (a, b) => mix(mix(a, b, 0.5), S, 0.24);
  const ring = [];
  for (let i = 0; i < tips.length; i++) {
    ring.push(tips[i]);
    ring.push(notch(tips[i], i + 1 < tips.length ? tips[i + 1] : B));
  }
  ring.push(B);
  const pos = [];
  for (let i = 0; i + 1 < ring.length; i++) pos.push(...S, ...ring[i], ...ring[i + 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function buildLanternEater(monster) {
  const k = new Kit(monster);
  const iron = k.plate(0x6c6a72);
  const ironDark = k.plate(0x34333a);
  const cloth = k.std(0x2a2a31, { rough: 0.95, metal: 0.05, side: THREE.DoubleSide });
  const brass = k.std(0xb08a3c, { rough: 0.4, metal: 0.85 });
  const bone = k.std(0xd9d3c0, { rough: 0.8, metal: 0.05 });
  const core = k.glow(0xcdf3a2, 2.4);
  const eyeGlow = k.glow(0xcdf3a2, 2.0);
  const lampGlow = k.glow(AMBER, 1.2);
  const ringGlow = k.glow(0xa9e07a, 1.6);

  const BODY_Y = 2.0;
  const body = k.node(monster.group, 0, BODY_Y, 0);
  // the cage, the mask and the chains are larger than the beat of the wings suggests: the wings hang off `body`, the rest off `frame`
  const frame = k.node(body, 0, 0, 0);
  frame.scale.setScalar(1.3);

  /* --- the cage: ribs between three rings, a cap, a hook --- */
  const ringsAt = [[0.95, 0.62], [0.0, 0.8], [-0.95, 0.34]];
  for (const [y, r] of ringsAt) k.torus(frame, r, 0.05, ironDark, 0, y, 0, Math.PI / 2, 0, 0, 6, 30);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const sa = Math.sin(a), ca = Math.cos(a);
    k.strut(frame, [sa * 0.62, 0.95, ca * 0.62], [sa * 0.8, 0, ca * 0.8], 0.032, iron, 6);
    k.strut(frame, [sa * 0.8, 0, ca * 0.8], [sa * 0.34, -0.95, ca * 0.34], 0.032, iron, 6);
  }
  k.cone(frame, 0.62, 0.55, 8, ironDark, 0, 1.22, 0);
  k.cone(frame, 0.34, 0.45, 8, ironDark, 0, -1.2, 0, Math.PI);
  k.torus(frame, 0.1, 0.025, brass, 0, -1.5, 0, 0, 0, 0, 6, 16);
  // the stolen light
  k.sph(frame, 0.45, core, 0, 0, 0);
  const gyros = [];
  for (const [r, rx] of [[0.56, 0.3], [0.66, 1.3]]) gyros.push(k.torus(frame, r, 0.018, ringGlow, 0, 0, 0, rx, 0, 0, 6, 34));

  /* --- the iris: a bezel, a lit disc behind it, ten blades --- */
  const IRIS_Z = 0.86;
  const iris = k.node(frame, 0, 0.0, IRIS_Z);
  k.torus(iris, 0.52, 0.055, brass, 0, 0, 0, 0, 0, 0, 8, 34);
  k.mesh(iris, new THREE.CircleGeometry(0.5, 30), core, 0, 0, -0.03);
  const blades = [];
  const bladeGeo = monster.own(new THREE.ExtrudeGeometry(
    new THREE.Shape([new THREE.Vector2(0, -0.15), new THREE.Vector2(0.66, -0.01), new THREE.Vector2(0.66, 0.02), new THREE.Vector2(0, 0.15)]),
    { depth: 0.012, bevelEnabled: false }
  ));
  const N_BLADES = 10;
  for (let i = 0; i < N_BLADES; i++) {
    const th = (i / N_BLADES) * Math.PI * 2;
    const node = k.node(iris, Math.cos(th) * 0.52, Math.sin(th) * 0.52, 0.02 + (i % 2) * 0.012);
    const b = new THREE.Mesh(bladeGeo, i % 2 ? iron : ironDark);
    node.add(b);
    blades.push({ node, th });
  }
  const muzzle = k.node(iris, 0, 0, 0.12);
  monster.muzzle = muzzle;
  const irisPlate = k.box(frame, 0.5, 0.3, 0.06, ironDark, 0, -0.62, 0.62, -0.5, 0, 0, 0.012);
  monster.armour(irisPlate, 0.4);

  /* --- the head: a mask on a neck, a beak, eye slits, two horns --- */
  const neck = k.node(frame, 0, 1.45, 0.02);
  k.strut(neck, [0, -0.2, 0], [0, 0.35, 0.06], 0.1, iron, 8, 0.07);
  const head = k.node(neck, 0, 0.5, 0.08);
  k.sph(head, 0.36, ironDark, 0, 0.12, 0, 1, 1.3, 1.15);
  const mask = k.box(head, 0.5, 0.72, 0.1, bone, 0, 0.05, 0.38, 0.1, 0, 0, 0.03);
  const beak = k.cone(head, 0.13, 0.62, 5, bone, 0, -0.3, 0.46, Math.PI - 0.15, 0, 0);
  for (const sx of [-1, 1]) {
    k.box(head, 0.2, 0.05, 0.06, eyeGlow, sx * 0.14, 0.16, 0.44, 0, 0, sx * -0.3, 0.008);
    // a horn: four segments of a rising curve
    const P = [[sx * 0.26, 0.38, 0.0], [sx * 0.5, 0.6, -0.04], [sx * 0.66, 0.98, -0.1], [sx * 0.6, 1.45, -0.2]];
    for (let i = 0; i < 3; i++) k.strut(head, P[i], P[i + 1], 0.012 + (2 - i) * 0.0, bone, 6, 0.06 - i * 0.015);
  }
  monster.armour(mask, 0.55);
  monster.armour(beak, 0.75);

  /* --- wings: three spars and a scalloped sheet each --- */
  const wings = [];
  for (const sx of [-1, 1]) {
    const wing = k.node(body, sx * 1.0, 0.8, -0.1);
    const tips = [[sx * 3.1, 1.6, 0.35], [sx * 3.6, 0.2, -0.6], [sx * 2.9, -1.1, -1.1]];
    const B = [sx * 0.25, -0.9, -0.45];
    k.sph(wing, 0.17, ironDark, 0, 0, 0);
    for (const T of tips) {
      k.strut(wing, [0, 0, 0], T, 0.022, iron, 6, 0.06);
      k.sph(wing, 0.04, brass, ...T);
    }
    k.mesh(wing, wingSheet([0, 0, 0], tips, B), cloth, 0, 0, 0);
    // a cross-spar, where the sheet is hung
    k.strut(wing, [sx * 1.6, 0.85, 0.12], [sx * 1.8, -0.5, -0.6], 0.016, iron, 5);
    wings.push({ sx, wing });
  }

  /* --- tendrils: chains of dead lanterns hung from the cage --- */
  const tendrils = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const root = k.node(frame, Math.sin(a) * 0.3, -1.0, Math.cos(a) * 0.3);
    const L1 = 0.7 + (i % 3) * 0.2;
    k.strut(root, [0, 0, 0], [0, -L1, 0], 0.012, ironDark, 5);
    const mid = k.node(root, 0, -L1, 0);
    const L2 = 0.6 + ((i + 1) % 3) * 0.18;
    k.strut(mid, [0, 0, 0], [0, -L2, 0], 0.012, ironDark, 5);
    const lamp = k.node(mid, 0, -L2, 0);
    k.torus(lamp, 0.045, 0.01, brass, 0, 0.0, 0, Math.PI / 2, 0, 0, 5, 12);
    k.box(lamp, 0.17, 0.05, 0.17, ironDark, 0, -0.06, 0, 0, 0, 0, 0.01);
    k.box(lamp, 0.12, 0.18, 0.12, i % 3 === 0 ? lampGlow : k.std(0x8d8a7a, { rough: 0.2, metal: 0.1, opacity: 0.55 }), 0, -0.18, 0, 0, 0, 0, 0.012);
    k.box(lamp, 0.17, 0.04, 0.17, ironDark, 0, -0.29, 0, 0, 0, 0, 0.01);
    tendrils.push({ root, mid, lamp, ph: i * 0.9 });
  }

  return {
    update(s) {
      const { up, down } = attackPose(s);
      const idle = s.calm ? 0 : 1;
      const t = s.t;
      body.position.y = BODY_Y + idle * Math.sin(t * 1.5) * 0.12 + 0.25 * up - 0.3 * s.hurt - 0.9 * s.throes;
      body.rotation.x = -0.12 * up + 0.3 * down - 0.2 * s.roar - 0.2 * s.hurt + s.throes * 0.5;
      body.rotation.z = idle * Math.sin(t * 0.8) * 0.04 + Math.sin(t * 36) * 0.03 * s.hurt + Math.sin(t * 23) * 0.12 * s.throes;
      // Wings: a slow beat at idle, raised to gather, swept down on the blow, flung wide on a roar, thrashing at the end.
      const beat = idle * Math.sin(t * 3.4) * 0.32;
      for (const w of wings) {
        const sx = w.sx;
        w.wing.rotation.z = sx * (0.22 + beat * (1 - up * 0.6) + up * 0.75 - down * 1.15 + s.roar * 0.5 + s.throes * Math.sin(t * 17) * 0.6);
        w.wing.rotation.y = sx * (-0.15 * up + 0.2 * down);
      }
      // The iris: a breath at idle, wide to gather, wider on the blow.
      const open = clamp01(0.12 + idle * (0.5 + 0.5 * Math.sin(t * 1.1)) * 0.1 + 0.65 * up + 0.4 * s.roar + 0.5 * down + s.wound * 0.12);
      for (const b of blades) b.node.rotation.z = b.th + Math.PI + open * 1.05;
      for (const [i, g] of gyros.entries()) g.rotation.set((i ? 1.3 : 0.3) + (s.calm ? 0 : t * (0.8 + i * 0.5)), (s.calm ? 0 : t * (0.5 - i * 0.9)), 0);
      for (const d of tendrils) {
        const sw = idle ? 1 : 0;
        d.root.rotation.z = sw * Math.sin(t * 1.4 + d.ph) * 0.2 + 0.15 * s.hurt * Math.sin(t * 20 + d.ph);
        d.root.rotation.x = sw * Math.cos(t * 1.1 + d.ph) * 0.14 - 0.35 * down;
        d.mid.rotation.z = sw * Math.sin(t * 1.9 + d.ph + 1) * 0.3;
        d.lamp.rotation.z = sw * Math.sin(t * 2.3 + d.ph) * 0.2;
      }
      head.rotation.x = -0.25 * s.roar - 0.15 * up + 0.22 * down;
      head.rotation.y = idle * Math.sin(t * 0.7) * 0.14;
    }
  };
}

/* ====================================================================== registry */

const BUILDERS = {
  'the hopper': buildHopper,
  'the compressor': buildCompressor,
  'the crucible': buildCrucible,
  'basalt warden': buildWarden,
  'the lantern-eater': buildLanternEater
};

/** Build the body for `species` into `monster.group`; returns its rig, or null when this file does not build that species. */
export function buildBossRig(species, monster) {
  const build = BUILDERS[species];
  return build ? build(monster) : null;
}

export const BOSS_SPECIES = Object.keys(BUILDERS);
