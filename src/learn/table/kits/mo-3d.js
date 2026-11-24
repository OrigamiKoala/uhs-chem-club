/**
 * kits/mo-3d.js — The overlap track's combined orbital, stood up in space at `3D On`.
 *
 * The flat picture (`mo.js` `paintOverlapCloud`) is what `3D Off` shows; at `3D On` the plate under the track is left dark and this
 * cloud floats over it instead. It is the same sum (`mo.js` `blendAt`, sampled on a grid by `blendGrid`) in three dimensions: the line between the nuclei runs
 * left to right, "above and below the line" is up and down, and the third direction runs toward the player. Two surfaces of equal
 * |ψ| are drawn for each sign: a faint outer one (the edge of the cloud) and a solid inner one (where the electron is most often
 * found), bone where the combined orbital is +, green where it is −, as the flat picture colours them. A sign marker floats beside
 * each atom's lobe, on the far side from the other atom and level with the lobe, so it lines up with that lobe from any angle.
 *
 * When the Distance dial moves, the cloud eases to the new distance; when the Signs dial turns one orbital over, its sign passes
 * smoothly through zero (`blendAt`'s `sign` goes from +1 to −1), so the player watches the shared cloud between the nuclei thin and
 * split. Reduced motion jumps straight to the new shape. Nothing is graded from the 3D: it reads `overlapRead`, as the flat picture does.
 *
 * `dressOverlap(f, state, c)` returns a Group whose `userData.update(f, state)` sets the target and `userData.tick(dt, still)` eases to it.
 * The surfaces are re-cut only while the cloud is moving, so a still bench costs nothing.
 */

import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { PLATE_COLORS } from '../../engine/plates.js';
import { blendGrid, overlapRead, overlapFrame, cardPull, magnetRead } from './mo.js';

/** The cloud is drawn at this share of the flat picture's scale, so it does not hide the Distance dial behind it from the bench camera. */
const VIEW = 0.45;
/** The box the surfaces are cut in, in pm from the midpoint of the nuclei: half-lengths along the line, up, and toward the player. */
const HALF = Object.freeze({ x: 280, y: 210, z: 165 });
/** Grid points along each side of that box. */
const RES = 34;
/** The two surfaces of each sign: |ψ| at the cloud's edge and at its dense core. */
const LEVELS = Object.freeze([{ iso: 0.15, opacity: 0.32 }, { iso: 0.45, opacity: 0.9 }]);
/** How far out from its nucleus, along the line, a lobe's sign marker floats (clear of the faint surface), and a marker's bar length (pm). */
const MARK_OUT = { s: 125, p: 150 };
const MARK_LEN = 26;
/** The lowest point of the cloud's box sits this far above the deck (pm), so nothing passes through the table. */
const CLEAR = 8;

const hex = s => parseInt(String(s).replace('#', ''), 16);

export function dressOverlap(f, state, c) {
  const { THREE, scale: s, toPlate, box, ground } = c;
  const fr = overlapFrame(f, box);
  const m = fr.k * s * VIEW; // metres to the picometre
  const group = new THREE.Group();
  group.name = 'mo-overlap-cloud';
  const at = toPlate({ x: fr.cx, y: fr.cy });
  // A p orbital's lobes reach up and down; an s cloud is no taller than it is deep.
  group.position.set(at.x, ground + ((f.props.type === 'p' ? HALF.y : HALF.z) + CLEAR) * m, at.z);

  // The surfaces: one field of +ψ and one of −ψ, each cut at the two levels. The cubes span [-1, 1] on each axis, scaled to the box.
  const fields = { pos: null, neg: null };
  const surfaces = [];
  for (const [key, color] of [['pos', hex(PLATE_COLORS.text)], ['neg', hex(PLATE_COLORS.phosphor)]]) {
    for (const lv of LEVELS) {
      const mat = c.own(new THREE.MeshStandardMaterial({
        color, roughness: 0.6, metalness: 0.05,
        transparent: true, opacity: lv.opacity, depthWrite: lv.opacity > 0.5
      }));
      const mc = new MarchingCubes(RES, mat, false, false, 24000);
      mc.isolation = lv.iso;
      mc.scale.set(HALF.x * m, HALF.y * m, HALF.z * m);
      mc.castShadow = false;
      mc.receiveShadow = false;
      mc.frustumCulled = false;
      mc.renderOrder = lv.opacity > 0.5 ? 0 : 1;
      if (fields[key]) mc.field = fields[key];
      else fields[key] = mc.field;
      surfaces.push(mc);
      group.add(mc);
    }
  }

  // The line between the nuclei and the two nuclei on it.
  const lineMat = c.own(new THREE.MeshStandardMaterial({ color: hex(PLATE_COLORS.dim), roughness: 0.8 }));
  const line = new THREE.Mesh(new THREE.CylinderGeometry(2.2 * m, 2.2 * m, HALF.x * 2 * m, 8), lineMat);
  line.rotation.z = Math.PI / 2;
  group.add(line);
  const nucMat = c.own(new THREE.MeshStandardMaterial({ color: hex(PLATE_COLORS.amber), roughness: 0.45, metalness: 0.2 }));
  const nuclei = [0, 1].map(() => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(9 * m, 16, 12), nucMat);
    group.add(n);
    return n;
  });

  // The sign markers: a bar (−) or a cross (+), turned to face the bench camera, beside each lobe (one per atom for s, two for p).
  const markMat = c.own(new THREE.MeshStandardMaterial({ color: hex(PLATE_COLORS.amber), roughness: 0.5, metalness: 0.1 }));
  const barGeo = new THREE.BoxGeometry(MARK_LEN * m, 5 * m, 3 * m);
  const type = f.props.type;
  const lobes = type === 'p' ? [1, -1] : [1];
  const marks = [];
  for (let atom = 0; atom < 2; atom++) {
    for (const up of lobes) {
      const g = new THREE.Group();
      const across = new THREE.Mesh(barGeo, markMat);
      const upright = new THREE.Mesh(barGeo, markMat);
      upright.rotation.z = Math.PI / 2;
      g.add(across, upright);
      g.rotation.x = -0.6;
      group.add(g);
      marks.push({ g, upright, atom, up });
    }
  }

  // Grid coordinates in pm, worked out once.
  const axis = (half) => Float32Array.from({ length: RES }, (_, i) => ((i - RES / 2) / (RES / 2)) * half);
  const gx = axis(HALF.x);
  const gy = axis(HALF.y);
  const gz = axis(HALF.z);

  const shown = { gap: null, sign: null };
  const target = { gap: 0, sign: 1 };

  function cut() {
    const pos = fields.pos;
    const neg = fields.neg;
    const { gap, sign } = shown;
    blendGrid(type, gap, sign, gx, gy, gz, pos);
    for (let q = 0; q < pos.length; q++) neg[q] = -pos[q];
    for (const mc of surfaces) mc.update();
    nuclei[0].position.set(-gap / 2 * m, 0, 0);
    nuclei[1].position.set(gap / 2 * m, 0, 0);
    for (const mk of marks) {
      const sg = mk.up * (mk.atom === 0 ? 1 : sign);
      const side = mk.atom === 0 ? -1 : 1;
      const x = side * (gap / 2 + MARK_OUT[type === 'p' ? 'p' : 's']) * m;
      // A p orbital's lobes stand above and below its nucleus; an s orbital's marker sits level with it.
      mk.g.position.set(x, type === 'p' ? mk.up * 70 * m : 0, 0);
      mk.upright.visible = sg > 0;
      const sz = Math.max(0.001, Math.abs(mk.atom === 0 ? 1 : sign));
      mk.g.scale.setScalar(sz);
    }
  }

  function read(fx, st) {
    const r = overlapRead(st, fx.id);
    target.gap = r.gap;
    target.sign = r.opposite ? -1 : 1;
  }

  read(f, state);
  shown.gap = target.gap;
  shown.sign = target.sign;
  cut();

  group.userData.update = (fx, st) => read(fx, st);
  let wait = 0;
  group.userData.tick = (dt, still) => {
    wait += dt;
    // Re-cut at most about 30 times a second: each cut samples the whole grid.
    if (wait < 1 / 30) return;
    const step = wait;
    wait = 0;
    const dGap = target.gap - shown.gap;
    const dSign = target.sign - shown.sign;
    if (Math.abs(dGap) < 0.25 && Math.abs(dSign) < 0.004) {
      if (dGap === 0 && dSign === 0) return;
      shown.gap = target.gap;
      shown.sign = target.sign;
      cut();
      return;
    }
    const e = still ? 1 : 1 - Math.exp(-Math.min(step, 0.1) * 5);
    shown.gap += dGap * e;
    shown.sign += dSign * e;
    cut();
  };
  return group;
}

const GAS_COLOR = { O2: 0xc9423a, N2: 0x4b7ec8, F2: 0x86c96c, B2: 0xc27a46 };

/**
 * 3D realistic horseshoe magnet + suspended diatomic gas sample capsule (`mo` kit `magnet` fixture).
 * When "Test Sample" is pressed, paramagnetic gases (O₂, B₂) visibly pull closer into the magnet poles
 * while diamagnetic gases (N₂, F₂) visibly push farther away from the magnet.
 */
export function dressMagnet(f, state, c) {
  const { THREE, scale: s, toPlate, ground } = c;
  const root = new THREE.Group();
  root.name = 'mo-magnet-3d';
  const center = toPlate({ x: f.at.x, y: f.at.y - 3.2 });
  root.position.set(center.x, ground, center.z);

  // Horseshoe magnet lying horizontally, poles facing toward +Z (toward the player / sample in front)
  const magGroup = new THREE.Group();
  magGroup.position.set(0, 3.6 * s, -3.5 * s);
  root.add(magGroup);

  const armR = 5.4 * s;
  const armLen = 5.2 * s;
  const tubeR = 1.65 * s;

  const uPts = [];
  uPts.push(new THREE.Vector3(-armR, 0, armLen));
  uPts.push(new THREE.Vector3(-armR, 0, 0));
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (i / 14) * Math.PI;
    uPts.push(new THREE.Vector3(Math.cos(a) * armR, 0, Math.sin(a) * armR));
  }
  uPts.push(new THREE.Vector3(armR, 0, 0));
  uPts.push(new THREE.Vector3(armR, 0, armLen));

  const bodyMat = c.own(new THREE.MeshStandardMaterial({ color: 0x8c2420, roughness: 0.36, metalness: 0.55 }));
  const uMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(uPts), 36, tubeR, 14, false), bodyMat);
  uMesh.castShadow = true;
  magGroup.add(uMesh);

  // Polished steel pole tips
  const tipMat = c.own(new THREE.MeshStandardMaterial({ color: 0xc8c4bc, roughness: 0.24, metalness: 0.85 }));
  const tipGeo = new THREE.CylinderGeometry(tubeR * 1.04, tubeR * 1.04, 2.2 * s, 14);
  for (const sx of [-1, 1]) {
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(sx * armR, 0, armLen + 0.8 * s);
    tip.castShadow = true;
    magGroup.add(tip);
  }

  // Shimmering magnetic field lines between the poles (visible during/after test)
  const fieldMat = c.own(new THREE.MeshBasicMaterial({ color: 0xf2a629, transparent: true, opacity: 0.0 }));
  const fieldArcs = [];
  for (const archZ of [1.2, 3.0, 4.8]) {
    const fc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-armR, 0, armLen + 1.4 * s),
      new THREE.Vector3(0, 0.4 * s, armLen + (1.4 + archZ) * s),
      new THREE.Vector3(armR, 0, armLen + 1.4 * s)
    ]);
    const fm = new THREE.Mesh(new THREE.TubeGeometry(fc, 16, 0.22 * s, 6, false), fieldMat);
    magGroup.add(fm);
    fieldArcs.push(fm);
  }

  // Suspended gas sample vial + diatomic molecule sitting right in front of the magnet poles
  const restZ = 6.2 * s;
  const sampleGroup = new THREE.Group();
  sampleGroup.position.set(0, 3.8 * s, restZ);
  root.add(sampleGroup);

  const glassMat = c.own(new THREE.MeshPhysicalMaterial({
    color: 0xd8e8f0, roughness: 0.12, metalness: 0.0, transparent: true, opacity: 0.28, depthWrite: false
  }));
  const vial = new THREE.Mesh(new THREE.CapsuleGeometry(2.5 * s, 3.2 * s, 8, 16), glassMat);
  vial.rotation.z = Math.PI / 2;
  sampleGroup.add(vial);

  const atomMat = c.own(new THREE.MeshStandardMaterial({ color: 0xc9423a, roughness: 0.32, metalness: 0.15 }));
  const atomGeo = new THREE.SphereGeometry(1.35 * s, 18, 14);
  const a1 = new THREE.Mesh(atomGeo, atomMat);
  a1.position.x = -1.25 * s;
  const a2 = new THREE.Mesh(atomGeo, atomMat);
  a2.position.x = 1.25 * s;
  const bondMat = c.own(new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.4, metalness: 0.5 }));
  const bond = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * s, 0.32 * s, 2.5 * s, 10), bondMat);
  bond.rotation.z = Math.PI / 2;
  sampleGroup.add(a1, a2, bond);

  // Animation state
  let currentZ = restZ;
  let targetZ = restZ;
  let fieldTarget = 0;
  let fieldAlpha = 0;
  let animClock = 0;
  let lastPulse = f.dials?.pulse?.value || 0;
  let lastTestedState = null;

  function sync(fx, st) {
    const slotted = fx.props.slot
      ? Object.values(st.pieces).find(p => !p.hidden && p.zone === `slot:${fx.props.slot}`)
      : null;
    const mol = fx.props.slot ? slotted?.props?.mol : fx.props.mol;
    const hasSample = Boolean(mol);
    sampleGroup.visible = hasSample;

    if (hasSample) {
      atomMat.color.setHex(GAS_COLOR[mol] || 0xc8c0b4);
    }

    const pulse = fx.dials?.pulse?.value || 0;
    const pullVal = fx.props.slot
      ? (slotted ? cardPull(slotted) : null)
      : (magnetRead(st, fx.id).tested ? magnetRead(st, fx.id).pull : null);
    const tested = pullVal !== null;

    if (!hasSample || !tested) {
      targetZ = restZ;
      fieldTarget = 0;
      if (!hasSample) currentZ = restZ;
    } else if (pullVal > 0) {
      // Attracted: pull visibly closer into the magnet poles
      targetZ = restZ - 4.4 * s;
      fieldTarget = 0.65;
    } else {
      // Not attracted / repelled: push visibly farther away from the magnet poles
      targetZ = restZ + 3.6 * s;
      fieldTarget = 0.35;
    }

    const key = `${mol || ''}:${tested ? pullVal : '-'}:${pulse}`;
    if (pulse !== lastPulse || key !== lastTestedState) {
      if (pulse !== lastPulse) currentZ = restZ; // replay crisp motion on every Test Sample press
      lastPulse = pulse;
      lastTestedState = key;
    }
  }

  sync(f, state);
  sampleGroup.position.z = targetZ;
  currentZ = targetZ;

  root.userData.update = (fx, st) => sync(fx, st);
  root.userData.tick = (dt, still) => {
    animClock += dt;
    if (still) {
      currentZ = targetZ;
      fieldAlpha = fieldTarget;
    } else {
      const k = 1 - Math.exp(-Math.min(dt, 0.1) * 7.5);
      currentZ += (targetZ - currentZ) * k;
      fieldAlpha += (fieldTarget - fieldAlpha) * k;
    }
    const bob = still ? 0 : Math.sin(animClock * 3.2) * 0.22 * s;
    sampleGroup.position.set(0, 3.8 * s + bob, currentZ);
    if (!still) sampleGroup.rotation.y = Math.sin(animClock * 1.4) * 0.25;
    fieldMat.opacity = fieldAlpha * (still ? 1 : 0.78 + 0.22 * Math.sin(animClock * 8));
  };

  return root;
}
