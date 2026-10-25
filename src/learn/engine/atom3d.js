/**
 * atom3d.js — 3D Atom model with nucleus in the center and electrons spinning around.
 *
 * Used for tabletop pieces of kind 'atom' (and non-slate 'ion').
 * Replaces flat/squashed dome "chips" with a genuine 3D atomic structure:
 *   - Protons (amber) and neutrons (slate) clustered in the central nucleus;
 *   - 3D tilted orbital rings according to electron shells;
 *   - Electrons (luminous cyan/silver) orbiting continuously along their 3D paths;
 *   - Ground contact base pedestal with authentic element face/markings on the table.
 */

import * as THREE from 'three';
import { zOf } from './electrons.js';
import { shellsFor } from '../table/kits/atoms.js';

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
 *
 * @param {number} r   tabletop radius in metres
 * @param {object} p   table piece record (kind, label, props)
 * @param {object} kit kit definition
 * @param {object} state table state
 * @param {object} opts  { own, faceMat, bodyColor, THREE }
 * @returns {THREE.Group}
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
