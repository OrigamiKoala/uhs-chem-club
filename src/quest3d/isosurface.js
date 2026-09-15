/**
 * isosurface.js — Precomputed & procedural nested electron density shells
 * Two nested shells: wide diffuse outer envelope (low isovalue) + tight bright inner core (high isovalue)
 */

import * as THREE from 'three';
import { createDensityFresnelMaterial } from '../three/materials/fresnel.js';
import { MOLECULE_DATA } from './molecule.js';

export class DensityIsosurface {
  constructor(moleculeKey = 'h2o') {
    this.group = new THREE.Group();
    this.moleculeData = MOLECULE_DATA[moleculeKey] || MOLECULE_DATA.h2o;
    this.materials = [];
    this.build();
  }

  build() {
    const { atoms, lonePairs = [] } = this.moleculeData;

    // Outer Shell (Wide diffuse envelope, low isovalue, dark blue-cyan rim)
    const outerMat = createDensityFresnelMaterial({
      innerColor: new THREE.Color('#2c476f'),
      outerColor: new THREE.Color('#00204d'),
      fresnelPower: 2.0,
      opacity: 0.45
    });
    this.materials.push(outerMat);

    // Inner Core (Tight intense core, high isovalue, luminous cividis yellow-gold)
    const coreMat = createDensityFresnelMaterial({
      innerColor: new THREE.Color('#ffea46'),
      outerColor: new THREE.Color('#9e9875'),
      fresnelPower: 2.8,
      opacity: 0.8
    });
    this.materials.push(coreMat);

    // Generate density lobes around atomic centers and lone pairs
    for (const atom of atoms) {
      const isElectrophile = atom.element === 'C';
      const isNegativeLobe = atom.element === 'O' || atom.element === 'F' || atom.element === 'Cl';

      const baseRadius = atom.scale * 1.5;
      const outerGeo = new THREE.SphereGeometry(baseRadius * 1.25, 16, 12);
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      outerMesh.position.set(atom.pos[0], atom.pos[1], atom.pos[2]);
      this.group.add(outerMesh);

      // Only electron-rich atoms get intense cores; electrophiles have starved cores
      if (!isElectrophile) {
        const coreGeo = new THREE.SphereGeometry(baseRadius * 0.75, 16, 12);
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.position.set(atom.pos[0], atom.pos[1], atom.pos[2]);
        this.group.add(coreMesh);
      }
    }

    // High density lobes around lone pairs
    for (const lp of lonePairs) {
      const lpOuterGeo = new THREE.SphereGeometry(0.85, 16, 12);
      const lpOuter = new THREE.Mesh(lpOuterGeo, outerMat);
      lpOuter.position.set(lp.pos[0], lp.pos[1], lp.pos[2]);
      lpOuter.scale.set(1.1, 1.3, 1.1); // Elongated directional lobe
      this.group.add(lpOuter);

      const lpCoreGeo = new THREE.SphereGeometry(0.55, 16, 12);
      const lpCore = new THREE.Mesh(lpCoreGeo, coreMat);
      lpCore.position.set(lp.pos[0], lp.pos[1], lp.pos[2]);
      lpCore.scale.set(1.1, 1.3, 1.1);
      this.group.add(lpCore);
    }
  }

  update(time) {
    for (const mat of this.materials) {
      if (mat.uniforms && mat.uniforms.uTime) {
        mat.uniforms.uTime.value = time;
      }
    }
  }

  dispose() {
    for (const mat of this.materials) {
      mat.dispose();
    }
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
    });
  }
}
