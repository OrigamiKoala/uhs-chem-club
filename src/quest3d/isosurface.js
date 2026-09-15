/**
 * isosurface.js — Electrostatic potential electron density isosurfaces
 * Red regions = high electron density (donor / lone pair / excess charge)
 * Blue regions = lowest electron density (acceptor / starved core)
 * Steric shielding clouds envelope crowded centers
 */

import * as THREE from 'three';
import { createDensityFresnelMaterial } from '../three/materials/fresnel.js';
import { MOLECULE_DATA } from './molecule.js';

export class DensityIsosurface {
  constructor(moleculeKey = 'stage1_pair') {
    this.group = new THREE.Group();
    this.moleculeData = MOLECULE_DATA[moleculeKey] || MOLECULE_DATA.stage1_pair;
    this.materials = [];
    this.build();
  }

  build() {
    const { atoms = [], regions = [] } = this.moleculeData;

    // 1. Extreme Red Material (highest electron density)
    const redExtremeMat = createDensityFresnelMaterial({
      innerColor: new THREE.Color('#ff1744'),
      outerColor: new THREE.Color('#d50000'),
      fresnelPower: 2.0,
      opacity: 0.8
    });
    this.materials.push(redExtremeMat);

    // 2. Moderate Red Material (secondary red regions)
    const redModerateMat = createDensityFresnelMaterial({
      innerColor: new THREE.Color('#c2185b'),
      outerColor: new THREE.Color('#ad1457'),
      fresnelPower: 2.4,
      opacity: 0.55
    });
    this.materials.push(redModerateMat);

    // 3. Extreme Blue Material (fewest electrons / starved center)
    const blueExtremeMat = createDensityFresnelMaterial({
      innerColor: new THREE.Color('#00e5ff'),
      outerColor: new THREE.Color('#0091ea'),
      fresnelPower: 2.0,
      opacity: 0.82
    });
    this.materials.push(blueExtremeMat);

    // 4. Moderate Blue Material (secondary blue regions)
    const blueModerateMat = createDensityFresnelMaterial({
      innerColor: new THREE.Color('#0288d1'),
      outerColor: new THREE.Color('#01579b'),
      fresnelPower: 2.4,
      opacity: 0.5
    });
    this.materials.push(blueModerateMat);

    // 5. Neutral Molecular Framework Material (subtle translucent envelope)
    const neutralMat = createDensityFresnelMaterial({
      innerColor: new THREE.Color('#334155'),
      outerColor: new THREE.Color('#0f172a'),
      fresnelPower: 3.2,
      opacity: 0.28
    });
    this.materials.push(neutralMat);

    // 6. Steric Hindrance Protective Cloud (bulky protective envelope)
    const stericCloudMat = createDensityFresnelMaterial({
      innerColor: new THREE.Color('#64748b'),
      outerColor: new THREE.Color('#334155'),
      fresnelPower: 2.0,
      opacity: 0.55
    });
    this.materials.push(stericCloudMat);

    // Build neutral envelopes for all atoms
    for (const atom of atoms) {
      const baseRadius = (atom.scale || 0.45) * 1.5;
      const geo = new THREE.SphereGeometry(baseRadius, 16, 12);
      const mesh = new THREE.Mesh(geo, neutralMat);
      mesh.position.set(atom.pos[0], atom.pos[1], atom.pos[2]);
      this.group.add(mesh);
    }

    // Build prominent electron density lobes from defined regions
    for (const reg of regions) {
      const isRed = reg.type === 'red';
      const isExtreme = reg.intensity === 'extreme';
      const lobeScale = reg.scale || 0.8;

      const mat = isRed
        ? (isExtreme ? redExtremeMat : redModerateMat)
        : (isExtreme ? blueExtremeMat : blueModerateMat);

      // Outer diffuse halo
      const outerGeo = new THREE.SphereGeometry(lobeScale * 1.35, 20, 16);
      const outerMesh = new THREE.Mesh(outerGeo, mat);
      outerMesh.position.set(reg.pos[0], reg.pos[1], reg.pos[2]);
      this.group.add(outerMesh);

      // Inner dense core
      const coreGeo = new THREE.SphereGeometry(lobeScale * 0.75, 16, 12);
      const coreMat = createDensityFresnelMaterial({
        innerColor: isRed ? new THREE.Color('#ffffff') : new THREE.Color('#ffffff'),
        outerColor: isRed ? new THREE.Color('#ff1744') : new THREE.Color('#00b0ff'),
        fresnelPower: 2.8,
        opacity: isExtreme ? 0.9 : 0.65
      });
      this.materials.push(coreMat);

      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.set(reg.pos[0], reg.pos[1], reg.pos[2]);
      this.group.add(coreMesh);

      // If region is hindered, add surrounding steric shielding cloud
      if (reg.hindered) {
        const shieldGeo = new THREE.SphereGeometry(lobeScale * 1.7, 16, 12);
        const shieldMesh = new THREE.Mesh(shieldGeo, stericCloudMat);
        shieldMesh.position.set(reg.pos[0], reg.pos[1], reg.pos[2]);
        this.group.add(shieldMesh);
      }
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
