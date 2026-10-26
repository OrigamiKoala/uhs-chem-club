/**
 * atom3d.js — 3D Atom, Specimen, Nucleus and Prediction models for tabletop chemistry.
 *
 * Used for tabletop pieces:
 *   - 'atom' and non-slate 'ion': 3D atomic structure with central nucleus & spinning electrons
 *   - 'model': 3D prediction models (Dalton solid sphere, Thomson soft plum pudding, Rutherford tiny dense center)
 *   - 'nucleus': countable 3D protons & neutrons visible from default view without occlusion
 *   - 'specimen': 3D atom displays with concentric orbit rings, spinning electrons & protective cages
 */

import * as THREE from 'three';
import { zOf } from './electrons.js';
import { shellsFor } from '../table/kits/atoms.js';
import { packCore } from './corebench.js';
import { mulberry32, hashId } from './plates.js';

const STANDARD_NEUTRONS = {
  H: 0, He: 2, Li: 4, Be: 5, B: 6, C: 6, N: 7, O: 8, F: 10, Ne: 10,
  Na: 12, Mg: 12, Al: 14, Si: 14, P: 16, S: 16, Cl: 18, Ar: 22, K: 20, Ca: 20,
  Sc: 24, Ti: 26, V: 28, Cr: 28, Mn: 30, Fe: 30, Co: 32, Ni: 31, Cu: 35, Zn: 35,
  Ga: 39, Ge: 41, As: 42, Se: 45, Br: 45, Kr: 48, Rb: 48, Sr: 50, Y: 50, Zr: 51,
  Nb: 52, Mo: 54, Ag: 61, Sn: 69, I: 74, Xe: 77, Ba: 81
};

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const RING_TILTS = [
  [Math.PI * 0.38, 0, Math.PI * 0.12],
  [-Math.PI * 0.36, Math.PI * 0.25, Math.PI * 0.35],
  [Math.PI * 0.15, -Math.PI * 0.35, -Math.PI * 0.4],
  [-Math.PI * 0.22, Math.PI * 0.55, Math.PI * 0.2],
  [Math.PI * 0.45, Math.PI * 0.35, -Math.PI * 0.15],
  [-Math.PI * 0.18, -Math.PI * 0.45, Math.PI * 0.5]
];

/**
 * Build a 3D Atom model with a nucleus in the center and electrons spinning around.
 */
export function buildAtom3D(r, p, kit, state, opts = {}) {
  const own = opts.own || (m => m);
  const elSym = p.props?.el || (p.label && p.label !== 'Atom' ? p.label : null) || p.props?.sym || 'C';

  let pCount = zOf(elSym);
  if (!pCount || pCount < 1) pCount = p.props?.p || 6;

  let nCount = p.props?.n != null
    ? p.props.n
    : (STANDARD_NEUTRONS[elSym] != null ? STANDARD_NEUTRONS[elSym] : Math.max(0, Math.round(pCount * 1.1)));

  let shells = (p.props?.shells || shellsFor(pCount)).slice();
  if (p.props?.charge) {
    let c = p.props.charge;
    for (let i = shells.length - 1; i >= 0 && c !== 0; i--) {
      if (c > 0) { const take = Math.min(shells[i], c); shells[i] -= take; c -= take; }
      else { shells[i] += -c; c = 0; }
    }
  }
  let activeShells = shells.filter(cnt => cnt > 0);
  if (!activeShells.length) activeShells = [1];

  const g = new THREE.Group();
  g.name = `atom-${p.id}`;

  const cy = r * 1.05;
  g.userData.joinY = cy;
  g.userData.height = cy + r;

  // Base contact pedestal grounding the atom onto the plate
  const baseR = r * 0.92;
  const baseH = 0.0035;
  const baseMat = own(new THREE.MeshStandardMaterial({
    color: 0x1d1b17, roughness: 0.72, metalness: 0.25
  }));
  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(baseR * 0.96, baseR, baseH, 32), baseMat);
  baseMesh.position.y = baseH / 2;
  baseMesh.receiveShadow = true;
  g.add(baseMesh);

  if (opts.faceMat) {
    const faceMesh = new THREE.Mesh(new THREE.CircleGeometry(baseR * 0.91, 32), opts.faceMat);
    faceMesh.rotation.x = -Math.PI / 2;
    faceMesh.position.y = baseH + 0.0006;
    faceMesh.receiveShadow = true;
    g.add(faceMesh);
  }

  // Nucleus in the center
  const total = pCount + nCount;
  const protMat = own(new THREE.MeshStandardMaterial({
    color: 0xd99423, roughness: 0.35, metalness: 0.25, emissive: 0x331800
  }));
  const neutrMat = own(new THREE.MeshStandardMaterial({
    color: 0x8c8376, roughness: 0.55, metalness: 0.1
  }));

  let nucClusterR = 0;
  if (total <= 1) {
    const nucR = 0.20 * r;
    nucClusterR = nucR;
    const m = new THREE.Mesh(new THREE.SphereGeometry(nucR, 16, 12), protMat);
    m.position.set(0, cy, 0);
    m.castShadow = true;
    g.add(m);
  } else {
    const sphereR = Math.max(0.038 * r, Math.min(0.08 * r, (0.26 * r) / Math.cbrt(total)));
    const R = sphereR * Math.cbrt(total) * 1.15;
    nucClusterR = R + sphereR;
    const nucGeo = new THREE.SphereGeometry(sphereR, 10, 8);
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
      m.position.set(rr * ring * Math.cos(theta), cy + rr * y, rr * ring * Math.sin(theta));
      m.castShadow = true;
      g.add(m);
    }
  }

  // Orbit rings and electrons
  const S = activeShells.length;
  const Rmin = nucClusterR + 0.14 * r;
  const Rmax = 0.94 * r;

  const ringMat = own(new THREE.MeshStandardMaterial({
    color: 0x7a8b99, roughness: 0.35, metalness: 0.55, transparent: true, opacity: 0.5
  }));
  const elecMat = own(new THREE.MeshStandardMaterial({
    color: 0xe8f6ff, emissive: 0x3388bb, roughness: 0.2, metalness: 0.3
  }));

  const electronTrackers = [];
  let globalRingIdx = 0;

  for (let k = 0; k < S; k++) {
    const rad = S === 1 ? 0.72 * r : Rmin + (k / (S - 1)) * (Rmax - Rmin);
    const count = activeShells[k];

    let numRings = 1;
    if (count === 2) numRings = 2;
    else if (count >= 3 && count <= 4) numRings = 2;
    else if (count > 4) numRings = Math.min(count, 3);

    const ringBuckets = Array.from({ length: numRings }, () => []);
    for (let e = 0; e < count; e++) {
      ringBuckets[e % numRings].push(e);
    }

    const ringGeo = new THREE.TorusGeometry(rad, Math.max(0.0004, r * 0.008), 6, 64);
    const elecGeo = new THREE.SphereGeometry(Math.max(0.002, r * 0.05), 10, 8);

    for (let ri = 0; ri < numRings; ri++) {
      const tilt = RING_TILTS[(globalRingIdx++) % RING_TILTS.length];
      const ringEuler = new THREE.Euler(...tilt);
      const ringQuat = new THREE.Quaternion().setFromEuler(ringEuler);

      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, cy, 0);
      ringMesh.rotation.copy(ringEuler);
      g.add(ringMesh);

      const electronsOnThisRing = ringBuckets[ri];
      electronsOnThisRing.forEach((elecIdx, posIdx) => {
        const elecMesh = new THREE.Mesh(elecGeo, elecMat);
        g.add(elecMesh);
        const phase = (posIdx / electronsOnThisRing.length) * Math.PI * 2 + (ri * 0.6);
        const speed = (2.2 / (1 + k * 0.28)) * (posIdx % 2 === 0 ? 1 : -1);
        electronTrackers.push({
          mesh: elecMesh,
          rad,
          quat: ringQuat,
          phase,
          speed
        });
      });
    }
  }

  let time = 0;
  const v = new THREE.Vector3();
  const updateElectrons = (t) => {
    for (let i = 0; i < electronTrackers.length; i++) {
      const e = electronTrackers[i];
      const theta = e.phase + e.speed * t;
      v.set(e.rad * Math.cos(theta), 0, e.rad * Math.sin(theta));
      v.applyQuaternion(e.quat);
      e.mesh.position.set(v.x, cy + v.y, v.z);
    }
  };
  updateElectrons(0);

  g.userData.tick = (delta, still) => {
    if (still) return;
    time += delta;
    updateElectrons(time);
  };

  return g;
}

/**
 * Build 3D Prediction Models ('solid', 'spread', 'core') on cards.
 */
export function buildModel3D(r, p, kit, state, opts = {}) {
  const own = opts.own || (m => m);
  const s = opts.s || (r / 9);
  const halfW = (kit.kinds?.model?.rect?.hw || 11) * s;
  const halfH = (kit.kinds?.model?.rect?.hh || 8) * s;
  const g = new THREE.Group();
  g.name = `model-${p.id}`;

  const baseH = 0.0035;
  const cardMat = own(new THREE.MeshStandardMaterial({
    color: 0x1d1b17, roughness: 0.8, metalness: 0.15
  }));
  const cardMesh = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2, baseH, halfH * 2), cardMat);
  cardMesh.position.y = baseH / 2;
  cardMesh.receiveShadow = true;
  g.add(cardMesh);

  if (opts.faceMat) {
    const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2 * 0.98, halfH * 2 * 0.98), opts.faceMat);
    faceMesh.rotation.x = -Math.PI / 2;
    faceMesh.position.y = baseH + 0.0006;
    faceMesh.receiveShadow = true;
    g.add(faceMesh);
  }

  const modelKind = p.props?.model || 'solid';
  const modelCenterZ = -halfH * 0.22;
  const R = halfH * 0.58;
  const modelCY = baseH + R + 0.001;

  let tickFn = null;

  if (modelKind === 'solid') {
    // Dalton "Solid all through" billiard ball model
    const sphereGeo = new THREE.SphereGeometry(R, 28, 20);
    const sphereMat = own(new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      roughness: 0.24,
      metalness: 0.35,
      clearcoat: 0.5,
      clearcoatRoughness: 0.25
    }));
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.position.set(0, modelCY, modelCenterZ);
    sphereMesh.castShadow = true;
    sphereMesh.receiveShadow = true;
    g.add(sphereMesh);
  } else if (modelKind === 'spread') {
    // Thomson "Soft and even" plum pudding model
    const softGroup = new THREE.Group();
    softGroup.position.set(0, modelCY, modelCenterZ);
    g.add(softGroup);

    const outerGeo = new THREE.SphereGeometry(R, 28, 20);
    const outerMat = own(new THREE.MeshStandardMaterial({
      color: 0xcbb799,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    }));
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    softGroup.add(outerMesh);

    // Embedded electron spheres (plums) distributed through the soft positive volume
    const elecGeo = new THREE.SphereGeometry(Math.max(0.0018, R * 0.095), 10, 8);
    const elecMat = own(new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      roughness: 0.25,
      metalness: 0.3
    }));
    const count = 12;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = i * GOLDEN;
      const dist = R * 0.72 * Math.cbrt((i + 0.5) / count);
      const em = new THREE.Mesh(elecGeo, elecMat);
      em.position.set(
        dist * Math.sin(phi) * Math.cos(theta),
        dist * Math.cos(phi),
        dist * Math.sin(phi) * Math.sin(theta)
      );
      softGroup.add(em);
    }

    tickFn = (delta, still) => {
      if (still) return;
      softGroup.rotation.y += delta * 0.6;
    };
  } else {
    // Rutherford "Tiny dense center" nuclear model (core)
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, modelCY, modelCenterZ);
    g.add(coreGroup);

    // Tiny dense nucleus in the center
    const nucR = Math.max(0.002, R * 0.14);
    const nucGeo = new THREE.SphereGeometry(nucR, 14, 10);
    const nucMat = own(new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xb45309,
      roughness: 0.25,
      metalness: 0.3
    }));
    const nucMesh = new THREE.Mesh(nucGeo, nucMat);
    coreGroup.add(nucMesh);

    // Wide empty space with thin outer orbit wire ring
    const ringRad = R * 0.94;
    const ringGeo = new THREE.TorusGeometry(ringRad, Math.max(0.0004, R * 0.015), 6, 64);
    const ringMat = own(new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: 0.75
    }));
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI * 0.35;
    coreGroup.add(ringMesh);

    // An electron in orbit along the ring
    const elecGeo = new THREE.SphereGeometry(Math.max(0.0016, R * 0.05), 8, 8);
    const elecMat = own(new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x0284c7,
      roughness: 0.2,
      metalness: 0.3
    }));
    const elecMesh = new THREE.Mesh(elecGeo, elecMat);
    coreGroup.add(elecMesh);

    let angle = 0;
    tickFn = (delta, still) => {
      if (still) return;
      angle += delta * 2.2;
      const ex = ringRad * Math.cos(angle);
      const ey = ringRad * Math.sin(angle) * Math.sin(Math.PI * 0.35);
      const ez = ringRad * Math.sin(angle) * Math.cos(Math.PI * 0.35);
      elecMesh.position.set(ex, ey, ez);
    };
  }

  g.userData.height = modelCY + R;
  g.userData.tick = tickFn;
  return g;
}

/**
 * Build 3D Nucleus Display with countable, non-occluded protons and neutrons.
 */
export function buildNucleus3D(r, p, kit, state, opts = {}) {
  const own = opts.own || (m => m);
  const g = new THREE.Group();
  g.name = `nucleus-${p.id}`;

  const baseR = r * 0.94;
  const baseH = 0.0035;

  // Base dish
  const baseMat = own(new THREE.MeshStandardMaterial({
    color: 0x1d1b17, roughness: 0.75, metalness: 0.25
  }));
  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(baseR * 0.96, baseR, baseH, 32), baseMat);
  baseMesh.position.y = baseH / 2;
  baseMesh.receiveShadow = true;
  g.add(baseMesh);

  // Bevelled brass rim
  const rimMat = own(new THREE.MeshStandardMaterial({
    color: 0x5c503d, roughness: 0.38, metalness: 0.65
  }));
  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(baseR * 0.95, baseH * 0.45, 8, 36), rimMat);
  rimMesh.rotation.x = -Math.PI / 2;
  rimMesh.position.y = baseH;
  g.add(rimMesh);

  // Base disc face showing label
  if (opts.faceMat) {
    const faceMesh = new THREE.Mesh(new THREE.CircleGeometry(baseR * 0.90, 32), opts.faceMat);
    faceMesh.rotation.x = -Math.PI / 2;
    faceMesh.position.y = baseH + 0.0004;
    faceMesh.receiveShadow = true;
    g.add(faceMesh);
  }

  // Tilted platter so all protons and neutrons are completely visible from default view without occlusion
  const pCount = p.props?.p || 0;
  const nCount = p.props?.n || 0;
  const total = pCount + nCount;

  const tiltGroup = new THREE.Group();
  tiltGroup.position.set(0, baseH + 0.0015, -baseR * 0.08);
  // Tilt up toward camera (+z at 55 deg) by ~25 deg so the face is almost perpendicular to gaze
  tiltGroup.rotation.x = Math.PI * 0.14;
  g.add(tiltGroup);

  if (total > 0) {
    const rand = mulberry32(hashId(p.id) ^ 0x7a31);
    const pack = packCore(total, rand);
    const spread = Math.max(1, ...pack.map(([x, y]) => Math.hypot(x, y))) + 1;
    const maxR = baseR * 0.65;
    const unit = maxR / spread;
    const sphereR = Math.max(0.0016, unit * 0.74);

    const protMat = own(new THREE.MeshStandardMaterial({
      color: 0xd97706, roughness: 0.32, metalness: 0.3, emissive: 0x331800
    }));
    const neutrMat = own(new THREE.MeshStandardMaterial({
      color: 0x64748b, roughness: 0.52, metalness: 0.12
    }));

    const protGeo = new THREE.SphereGeometry(sphereR, 12, 10);
    const neutrGeo = new THREE.SphereGeometry(sphereR, 12, 10);

    let m = pCount;
    let b = nCount;
    const order = [];
    for (let i = 0; i < total; i++) {
      const isProt = b === 0 || (m > 0 && (i % 2 === 0 ? m >= b : m > b));
      if (isProt) { order.push(true); m--; } else { order.push(false); b--; }
    }

    for (let i = 0; i < total; i++) {
      const [ox, oy] = pack[i];
      const isProt = order[i];
      const mesh = new THREE.Mesh(isProt ? protGeo : neutrGeo, isProt ? protMat : neutrMat);
      mesh.position.set(ox * unit, sphereR * 0.85, oy * unit);
      mesh.castShadow = true;
      tiltGroup.add(mesh);
    }
  }

  g.userData.height = baseH + baseR * 0.6;
  return g;
}

/**
 * Build 3D Specimen Display with orbit rings, spinning electrons and protective casings.
 */
export function buildSpecimen3D(r, p, kit, state, opts = {}) {
  const own = opts.own || (m => m);
  const g = new THREE.Group();
  g.name = `specimen-${p.id}`;

  const baseR = r * 0.94;
  const baseH = 0.0035;

  // Base dish
  const baseMat = own(new THREE.MeshStandardMaterial({
    color: 0x1d1b17, roughness: 0.75, metalness: 0.25
  }));
  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(baseR * 0.96, baseR, baseH, 32), baseMat);
  baseMesh.position.y = baseH / 2;
  baseMesh.receiveShadow = true;
  g.add(baseMesh);

  // Bevelled rim
  const rimMat = own(new THREE.MeshStandardMaterial({
    color: 0x5c503d, roughness: 0.38, metalness: 0.65
  }));
  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(baseR * 0.95, baseH * 0.45, 8, 36), rimMat);
  rimMesh.rotation.x = -Math.PI / 2;
  rimMesh.position.y = baseH;
  g.add(rimMesh);

  // Face texture on base
  if (opts.faceMat) {
    const faceMesh = new THREE.Mesh(new THREE.CircleGeometry(baseR * 0.90, 32), opts.faceMat);
    faceMesh.rotation.x = -Math.PI / 2;
    faceMesh.position.y = baseH + 0.0004;
    faceMesh.receiveShadow = true;
    g.add(faceMesh);
  }

  const cy = baseH + 0.002;
  const isCased = Boolean(p.props?.casing);

  if (isCased) {
    // Cased sample: protective wire mesh cage dome
    const cageR = baseR * 0.72;
    const domeMat = own(new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4,
      metalness: 0.75,
      wireframe: true
    }));
    const domeMesh = new THREE.Mesh(new THREE.SphereGeometry(cageR, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    domeMesh.position.y = cy;
    g.add(domeMesh);

    // Inner tinted bell glass
    const glassMat = own(new THREE.MeshStandardMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.25,
      roughness: 0.2,
      metalness: 0.1,
      depthWrite: false
    }));
    const glassMesh = new THREE.Mesh(new THREE.SphereGeometry(cageR * 0.98, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    glassMesh.position.y = cy;
    g.add(glassMesh);

    g.userData.height = cy + cageR;
    return g;
  }

  // Uncased 3D atom display
  const pCount = p.props?.p || 0;
  const nCount = p.props?.n || 0;
  const hasCounts = Boolean(p.props?.counts);

  // Center nucleus (only if no counts box covering it)
  if (!hasCounts) {
    const nucTotal = pCount + nCount;
    const protMat = own(new THREE.MeshStandardMaterial({
      color: 0xd97706, roughness: 0.35, metalness: 0.25, emissive: 0x331800
    }));
    const neutrMat = own(new THREE.MeshStandardMaterial({
      color: 0x64748b, roughness: 0.52, metalness: 0.12
    }));

    if (nucTotal <= 1) {
      const nucMesh = new THREE.Mesh(new THREE.SphereGeometry(baseR * 0.12, 12, 10), protMat);
      nucMesh.position.set(0, cy + baseR * 0.12, 0);
      g.add(nucMesh);
    } else {
      const rand = mulberry32(hashId(p.id) ^ 0x5eed);
      const pack = packCore(nucTotal, rand);
      const spread = Math.max(1, ...pack.map(([x, y]) => Math.hypot(x, y))) + 1;
      const maxR = baseR * 0.26;
      const unit = maxR / spread;
      const sphereR = Math.max(0.0014, unit * 0.72);
      const protGeo = new THREE.SphereGeometry(sphereR, 10, 8);
      const neutrGeo = new THREE.SphereGeometry(sphereR, 10, 8);

      let m = pCount;
      let b = nCount;
      for (let i = 0; i < nucTotal; i++) {
        const isProt = b === 0 || (m > 0 && (i % 2 === 0 ? m >= b : m > b));
        if (isProt) m--; else b--;
        const [ox, oy] = pack[i];
        const mesh = new THREE.Mesh(isProt ? protGeo : neutrGeo, isProt ? protMat : neutrMat);
        mesh.position.set(ox * unit, cy + sphereR * 0.85, oy * unit);
        mesh.castShadow = true;
        g.add(mesh);
      }
    }
  }

  // Concentric orbit rings with spinning electrons
  const rings = p.props?.rings || [];
  const Rmin = hasCounts ? baseR * 0.48 : baseR * 0.34;
  const Rmax = baseR * 0.86;

  const ringMat = own(new THREE.MeshStandardMaterial({
    color: 0x64748b, roughness: 0.4, metalness: 0.5, transparent: true, opacity: 0.55
  }));
  const elecMat = own(new THREE.MeshStandardMaterial({
    color: 0xe0f2fe, emissive: 0x0284c7, roughness: 0.2, metalness: 0.3
  }));

  const electronTrackers = [];

  for (let ri = 0; ri < rings.length; ri++) {
    const rad = rings.length === 1 ? (Rmin + Rmax) / 2 : Rmin + (ri / (rings.length - 1)) * (Rmax - Rmin);
    const count = rings[ri];

    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(rad, Math.max(0.0003, baseR * 0.007), 4, 48), ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = cy + 0.001 + ri * 0.0004;
    g.add(ringMesh);

    const elecGeo = new THREE.SphereGeometry(Math.max(0.0016, baseR * 0.046), 10, 8);
    const speed = (2.2 / (1 + ri * 0.28)) * (ri % 2 === 0 ? 1 : -1);

    for (let j = 0; j < count; j++) {
      const elecMesh = new THREE.Mesh(elecGeo, elecMat);
      elecMesh.position.set(rad, cy + 0.003 + ri * 0.0004, 0);
      g.add(elecMesh);
      const phase = (j / count) * Math.PI * 2 + (ri * 0.5);
      electronTrackers.push({
        mesh: elecMesh,
        rad,
        y: cy + 0.003 + ri * 0.0004,
        phase,
        speed
      });
    }
  }

  let time = 0;
  g.userData.tick = (delta, still) => {
    if (still) return;
    time += delta;
    for (let i = 0; i < electronTrackers.length; i++) {
      const t = electronTrackers[i];
      const theta = t.phase + t.speed * time;
      t.mesh.position.set(t.rad * Math.cos(theta), t.y, t.rad * Math.sin(theta));
    }
  };

  g.userData.height = cy + baseR * 0.5;
  return g;
}
