/**
 * kits/shells-3d.js — 3D Horseshoe Magnet & Physical Atom Animation for the filling bench.
 *
 * Provides `dress3d(f, state, c)` for `SHELLS_KIT`:
 *   - 3D Horseshoe Magnet with painted North (red) & South (blue) legs, silver pole shoes,
 *     and magnetic field indicators.
 *   - 3D Atom with central nucleus (protons & neutrons), electron orbit rings, and spinning electrons.
 *   - Physical 3D Animation:
 *       • Sample magnet: Carbon atom physically animates getting attracted to the magnet (paramagnetic).
 *       • Rack magnet: Atom representing the rack physically moves towards the magnet if attracted
 *         (unpaired electrons > 0) and gets pushed away if repelled (unpaired electrons === 0 / diamagnetic).
 *       • Spring-mass dynamics with magnetic vibration when attracted and levitation wobble when repelled.
 */

import * as THREE from 'three';
import { zOf, symbolOf } from './shells-read.js';
import { readOf, magnetRead } from './shells-read.js';

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const RING_TILTS = [
  [Math.PI * 0.36, 0, Math.PI * 0.12],
  [-Math.PI * 0.34, Math.PI * 0.25, Math.PI * 0.35],
  [Math.PI * 0.15, -Math.PI * 0.35, -Math.PI * 0.4],
  [-Math.PI * 0.22, Math.PI * 0.55, Math.PI * 0.2]
];

const STANDARD_NEUTRONS = {
  H: 0, He: 2, Li: 4, Be: 5, B: 6, C: 6, N: 7, O: 8, F: 10, Ne: 10,
  Na: 12, Mg: 12, Al: 14, Si: 14, P: 16, S: 16, Cl: 18, Ar: 22, K: 20, Ca: 20,
  Cr: 28, Fe: 30, Cu: 35
};

/** Standard shell electron capacities (Bohr shells: 2, 8, 18, 32). */
function shellsForElectrons(count) {
  const caps = [2, 8, 8, 18];
  const out = [];
  let rem = count;
  for (const cap of caps) {
    if (rem <= 0) break;
    const take = Math.min(rem, cap);
    out.push(take);
    rem -= take;
  }
  return out.length ? out : [1];
}

/**
 * Builds a 3D Atom model with nucleus, electron rings, and spinning electrons.
 */
function buildAtomModel(c, sym, electronCount, r_m) {
  const { own } = c;
  const pCount = Math.max(1, zOf(sym) || electronCount || 6);
  const nCount = STANDARD_NEUTRONS[sym] ?? Math.max(0, Math.round(pCount * 1.1));
  const total = pCount + nCount;

  const g = new THREE.Group();
  g.name = `atom-model-${sym}`;

  const protMat = own(new THREE.MeshStandardMaterial({
    color: 0xd99423, roughness: 0.35, metalness: 0.25, emissive: 0x331800
  }));
  const neutrMat = own(new THREE.MeshStandardMaterial({
    color: 0x8c8376, roughness: 0.55, metalness: 0.1
  }));

  // Nucleus
  const sphereR = Math.max(0.0012, Math.min(0.0035, (0.24 * r_m) / Math.cbrt(total)));
  const R = sphereR * Math.cbrt(total) * 1.1;
  const nucGeo = own(new THREE.SphereGeometry(sphereR, 8, 6));

  let pLeft = pCount;
  let nLeft = nCount;
  for (let i = 0; i < total; i++) {
    const rr = R * Math.cbrt((i + 0.5) / total);
    const y = 1 - (2 * (i + 0.5)) / total;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN;
    const isProton = nLeft === 0 || (pLeft > 0 && (i % 2 === 0 ? pLeft >= nLeft : pLeft > nLeft));
    if (isProton) pLeft--; else nLeft--;
    const m = new THREE.Mesh(nucGeo, isProton ? protMat : neutrMat);
    m.position.set(rr * ring * Math.cos(theta), rr * y, rr * ring * Math.sin(theta));
    g.add(m);
  }

  // Orbit rings and electrons
  const shells = shellsForElectrons(electronCount);
  const S = shells.length;
  const Rmin = R + sphereR + 0.12 * r_m;
  const Rmax = 0.92 * r_m;

  const ringMat = own(new THREE.MeshStandardMaterial({
    color: 0x7a8b99, roughness: 0.4, metalness: 0.5, transparent: true, opacity: 0.4
  }));
  const elecMat = own(new THREE.MeshStandardMaterial({
    color: 0xebf8ff, emissive: 0x3388bb, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.3
  }));

  const electronTrackers = [];
  let ringIdx = 0;

  for (let k = 0; k < S; k++) {
    const rad = S === 1 ? 0.65 * r_m : Rmin + (k / (S - 1)) * (Rmax - Rmin);
    const count = shells[k];
    const numRings = Math.min(count, 2);
    const ringBuckets = Array.from({ length: numRings }, () => []);
    for (let e = 0; e < count; e++) ringBuckets[e % numRings].push(e);

    const ringGeo = own(new THREE.TorusGeometry(rad, Math.max(0.0003, r_m * 0.015), 6, 36));
    const elecGeo = own(new THREE.SphereGeometry(Math.max(0.0016, r_m * 0.08), 8, 6));

    for (let ri = 0; ri < numRings; ri++) {
      const tilt = RING_TILTS[(ringIdx++) % RING_TILTS.length];
      const ringEuler = new THREE.Euler(...tilt);
      const ringQuat = new THREE.Quaternion().setFromEuler(ringEuler);

      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.copy(ringEuler);
      g.add(ringMesh);

      const bucket = ringBuckets[ri];
      bucket.forEach((elecI, posI) => {
        const elecMesh = new THREE.Mesh(elecGeo, elecMat);
        g.add(elecMesh);
        const phase = (posI / bucket.length) * Math.PI * 2 + ri * 0.7;
        const speed = (2.6 / (1 + k * 0.25)) * (posI % 2 === 0 ? 1 : -1);
        electronTrackers.push({ mesh: elecMesh, rad, quat: ringQuat, phase, speed });
      });
    }
  }

  // Small brass dish underneath the atom
  const dishMat = own(new THREE.MeshStandardMaterial({
    color: 0x5a5042, roughness: 0.6, metalness: 0.35
  }));
  const dishGeo = own(new THREE.CylinderGeometry(r_m * 0.9, r_m * 0.95, 0.0018, 24));
  const dishMesh = new THREE.Mesh(dishGeo, dishMat);
  dishMesh.position.y = -r_m * 0.95;
  dishMesh.receiveShadow = true;
  g.add(dishMesh);

  let time = 0;
  const tempV = new THREE.Vector3();
  g.userData.tick = (delta, still) => {
    if (still) return;
    time += delta;
    for (let i = 0; i < electronTrackers.length; i++) {
      const e = electronTrackers[i];
      const theta = e.phase + e.speed * time;
      tempV.set(e.rad * Math.cos(theta), 0, e.rad * Math.sin(theta));
      tempV.applyQuaternion(e.quat);
      e.mesh.position.copy(tempV);
    }
  };

  return g;
}

/**
 * Builds the 3D Horseshoe Magnet standing on the fixture deck.
 */
function buildMagnetProp(c, s) {
  const { own } = c;
  const g = new THREE.Group();
  g.name = 'horseshoe-magnet';

  const archR = 3.6 * s;
  const barR = 0.9 * s;
  const legLen = 3.8 * s;

  // Materials
  const archMat = own(new THREE.MeshStandardMaterial({
    color: 0x22252a, roughness: 0.45, metalness: 0.75
  }));
  const northMat = own(new THREE.MeshStandardMaterial({
    color: 0xbd2828, roughness: 0.35, metalness: 0.25
  }));
  const southMat = own(new THREE.MeshStandardMaterial({
    color: 0x2a5482, roughness: 0.35, metalness: 0.25
  }));
  const poleFaceMat = own(new THREE.MeshStandardMaterial({
    color: 0xd8d8d8, roughness: 0.2, metalness: 0.85
  }));
  const glowMat = own(new THREE.MeshStandardMaterial({
    color: 0xd99423, emissive: 0xd99423, emissiveIntensity: 0, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85
  }));

  // Horseshoe Arch (curved half-circle at the top)
  const archGeo = own(new THREE.TorusGeometry(archR, barR, 14, 28, Math.PI));
  const archMesh = new THREE.Mesh(archGeo, archMat);
  archMesh.rotation.x = Math.PI / 2;
  archMesh.rotation.z = Math.PI;
  archMesh.castShadow = true;
  g.add(archMesh);

  // Left Leg (North, red)
  const legGeo = own(new THREE.CylinderGeometry(barR, barR, legLen, 14));
  const leftLeg = new THREE.Mesh(legGeo, northMat);
  leftLeg.rotation.x = Math.PI / 2;
  leftLeg.position.set(-archR, 0, legLen / 2);
  leftLeg.castShadow = true;
  g.add(leftLeg);

  // Left Pole Face (silver tip)
  const capGeo = own(new THREE.CylinderGeometry(barR * 1.02, barR * 1.02, 0.002, 14));
  const leftCap = new THREE.Mesh(capGeo, poleFaceMat);
  leftCap.rotation.x = Math.PI / 2;
  leftCap.position.set(-archR, 0, legLen + 0.001);
  g.add(leftCap);

  // Right Leg (South, blue)
  const rightLeg = new THREE.Mesh(legGeo, southMat);
  rightLeg.rotation.x = Math.PI / 2;
  rightLeg.position.set(archR, 0, legLen / 2);
  rightLeg.castShadow = true;
  g.add(rightLeg);

  // Right Pole Face (silver tip)
  const rightCap = new THREE.Mesh(capGeo, poleFaceMat);
  rightCap.rotation.x = Math.PI / 2;
  rightCap.position.set(archR, 0, legLen + 0.001);
  g.add(rightCap);

  // Glowing indicator rings at pole faces
  const glowRingGeo = own(new THREE.TorusGeometry(barR * 1.08, barR * 0.18, 8, 20));
  const leftGlow = new THREE.Mesh(glowRingGeo, glowMat);
  leftGlow.rotation.x = Math.PI / 2;
  leftGlow.position.set(-archR, 0, legLen + 0.002);
  g.add(leftGlow);

  const rightGlow = new THREE.Mesh(glowRingGeo, glowMat);
  rightGlow.rotation.x = Math.PI / 2;
  rightGlow.position.set(archR, 0, legLen + 0.002);
  g.add(rightGlow);

  // Cast iron mounting base bracket
  const bracketGeo = own(new THREE.BoxGeometry(archR * 2.5, 0.008, barR * 2.8));
  const bracketMat = own(new THREE.MeshStandardMaterial({
    color: 0x181a1d, roughness: 0.8, metalness: 0.4
  }));
  const bracket = new THREE.Mesh(bracketGeo, bracketMat);
  bracket.position.set(0, -barR * 0.9, -0.002);
  bracket.receiveShadow = true;
  g.add(bracket);

  g.userData.setGlow = intensity => {
    glowMat.emissiveIntensity = intensity;
  };

  return g;
}

/**
 * 3D Dressing for a magnet fixture (`msample` or `mrack`).
 */
function dressMagnet(f, state, c) {
  const { THREE: _T, scale: s, toPlate, box, ground } = c;
  const group = new THREE.Group();
  group.name = `dress-magnet-${f.id}`;

  const cx = (box.x0 + box.x1) / 2;
  const isSample = f.props.sample != null;
  const targetSymbol = isSample ? f.props.sample : 'C';

  // 1. The 3D Magnet
  const magnetProp = buildMagnetProp(c, s);
  const magnetPos = toPlate({ x: cx, y: box.y0 + 10.4 });
  const magnetHeight = ground + 0.022;
  magnetProp.position.set(magnetPos.x, magnetHeight, magnetPos.z);
  group.add(magnetProp);

  // 2. The 3D Atom
  const atomR_m = 2.4 * s;
  const atomRoot = new THREE.Group();
  atomRoot.name = `atom-carrier-${f.id}`;
  group.add(atomRoot);

  let currentAtomModel = null;
  let currentSymbol = null;
  let currentElectronCount = null;

  function setAtomModel(sym, eCount) {
    if (currentSymbol === sym && currentElectronCount === eCount && currentAtomModel) return;
    if (currentAtomModel) {
      atomRoot.remove(currentAtomModel);
    }
    currentSymbol = sym;
    currentElectronCount = eCount;
    currentAtomModel = buildAtomModel(c, sym, eCount, atomR_m);
    atomRoot.add(currentAtomModel);
  }

  // Initial atom setup
  if (isSample) {
    setAtomModel(targetSymbol, zOf(targetSymbol) || 6);
  } else {
    const rackRead = readOf(state, f.props.rack || 'rack');
    const cnt = rackRead.total;
    const sym = cnt > 0 ? (symbolOf(cnt) || 'C') : 'C';
    setAtomModel(sym, cnt > 0 ? cnt : 6);
  }

  // Animation physical state
  const y_rest = box.y0 + 19.5;
  const anim = {
    currentY: y_rest,
    targetY: y_rest,
    velocity: 0,
    tested: false,
    pull: null,
    glow: 0,
    lastDialVal: f.dials.pull?.value ?? 0
  };

  const sync = (fixture, st) => {
    const read = magnetRead(st, fixture.id);
    const dialVal = fixture.dials.pull?.value ?? 0;
    const justTriggered = dialVal > 0 && (dialVal !== anim.lastDialVal || !anim.tested);
    anim.lastDialVal = dialVal;
    anim.tested = read.tested;
    anim.pull = read.pull;

    // Update rack atom model if electron count changed
    if (!isSample) {
      const rackRead = readOf(st, fixture.props.rack || 'rack');
      const cnt = rackRead.total;
      const sym = cnt > 0 ? (symbolOf(cnt) || 'C') : 'C';
      setAtomModel(sym, cnt > 0 ? cnt : 6);
    }

    if (!read.tested) {
      anim.targetY = y_rest;
    } else if (read.pull > 0) {
      // Attracted (paramagnetic): moves towards magnet poles
      anim.targetY = box.y0 + 14.2 - Math.min(1.0, read.pull * 0.18);
      if (justTriggered) {
        // Physical acceleration pull impulse towards magnet
        anim.velocity = -26.0;
        anim.glow = 1.0;
      }
    } else {
      // Repelled (diamagnetic): pushed away from magnet
      anim.targetY = box.y0 + 25.0;
      if (justTriggered) {
        // Physical recoil kick away from magnet
        anim.velocity = 22.0;
        anim.glow = 0.8;
      }
    }
  };

  let globalTime = 0;
  group.userData.tick = (delta, still) => {
    currentAtomModel?.userData?.tick?.(delta, still);

    if (still) {
      anim.currentY = anim.targetY;
      anim.velocity = 0;
      anim.glow = 0;
    } else {
      globalTime += delta;
      const dt = Math.min(delta, 0.05);

      // Spring-mass-damper physics
      const k = 42.0;
      const damping = 8.8;
      const diff = anim.currentY - anim.targetY;
      const force = -k * diff - damping * anim.velocity;
      anim.velocity += force * dt;
      anim.currentY += anim.velocity * dt;

      // Pole glow fade
      if (anim.glow > 0) {
        anim.glow = Math.max(0, anim.glow - delta * 1.5);
      }
    }

    magnetProp.userData.setGlow(anim.tested ? 0.35 + anim.glow * 0.65 : 0);

    // Position the atom on the plate
    const at = toPlate({ x: cx, y: anim.currentY });
    const heightNorm = Math.max(0, Math.min(1, (box.y0 + 25.0 - anim.currentY) / 11));
    const h = ground + 0.016 + heightNorm * 0.007;

    atomRoot.position.set(at.x, h, at.z);

    // Subtle magnetic tactile vibration when attracted near poles
    if (anim.tested && anim.pull > 0 && !still) {
      const hum = Math.sin(globalTime * 38) * 0.00035 * Math.min(anim.pull, 3);
      atomRoot.position.x += hum;
      atomRoot.position.z += Math.cos(globalTime * 30) * 0.00025;
    }
    // Levitation wobble when repelled
    if (anim.tested && anim.pull === 0 && !still) {
      const wobble = Math.sin(globalTime * 5.5) * 0.00045;
      atomRoot.position.x += wobble;
    }
  };

  group.userData.sync = sync;
  sync(f, state);

  return group;
}

/**
 * Solid parts for `SHELLS_KIT` fixtures at `3D On`.
 */
export function dress3d(f, state, c) {
  if (f.kind === 'magnet') {
    return dressMagnet(f, state, c);
  }
  return null;
}
