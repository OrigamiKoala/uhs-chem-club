/**
 * molecule.js — InstancedMesh rendering for atoms and covalent bonds
 * Minimizes draw calls: 1 draw call for all atoms, 1 draw call for all bonds
 */

import * as THREE from 'three';

const CPK_COLORS = {
  H: 0xffffff,
  C: 0x334155,
  O: 0xef4444,
  N: 0x3b82f6,
  F: 0x06b6d4,
  Cl: 0x22c55e,
  Br: 0x991b1b,
  Li: 0xa855f7
};

export const MOLECULE_DATA = {
  h2o: {
    atoms: [
      { element: 'O', pos: [0, 0, 0], scale: 0.55 },
      { element: 'H', pos: [-0.85, -0.55, 0], scale: 0.35 },
      { element: 'H', pos: [0.85, -0.55, 0], scale: 0.35 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 }
    ],
    lonePairs: [
      { pos: [0, 0.9, 0.45], id: 'lp_o' }
    ]
  },

  hf: {
    atoms: [
      { element: 'F', pos: [0.4, 0, 0], scale: 0.5 },
      { element: 'H', pos: [-0.65, 0, 0], scale: 0.35 }
    ],
    bonds: [{ from: 0, to: 1 }],
    lonePairs: [{ pos: [0.95, 0, 0], id: 'lp_f' }]
  },

  lih: {
    atoms: [
      { element: 'Li', pos: [-0.6, 0, 0], scale: 0.55 },
      { element: 'H', pos: [0.6, 0, 0], scale: 0.35 }
    ],
    bonds: [{ from: 0, to: 1 }],
    lonePairs: []
  },

  h2: {
    atoms: [
      { element: 'H', pos: [-0.45, 0, 0], scale: 0.35 },
      { element: 'H', pos: [0.45, 0, 0], scale: 0.35 }
    ],
    bonds: [{ from: 0, to: 1 }],
    lonePairs: []
  },

  nu_sub_pair: {
    // Nucleophile (OH-) approaching Chloromethane (CH3Cl)
    atoms: [
      // OH- nucleophile
      { element: 'O', pos: [-2.2, 0.4, 0], scale: 0.55 },
      { element: 'H', pos: [-2.8, 0.0, 0], scale: 0.35 },
      // CH3Cl electrophile
      { element: 'C', pos: [0.6, 0, 0], scale: 0.5 },
      { element: 'Cl', pos: [2.1, 0, 0], scale: 0.6 },
      { element: 'H', pos: [0.4, 0.9, 0.4], scale: 0.32 },
      { element: 'H', pos: [0.4, -0.9, 0.4], scale: 0.32 },
      { element: 'H', pos: [0.4, 0.0, -0.95], scale: 0.32 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 2, to: 6 }
    ],
    lonePairs: [
      { pos: [-1.4, 0.6, 0], id: 'lp_o' }
    ]
  },

  sn2_reaction: {
    atoms: [
      { element: 'O', pos: [-1.8, 0.2, 0], scale: 0.55 },
      { element: 'H', pos: [-2.4, -0.2, 0], scale: 0.35 },
      { element: 'C', pos: [0.2, 0, 0], scale: 0.5 },
      { element: 'Cl', pos: [1.9, 0, 0], scale: 0.6 },
      { element: 'H', pos: [0.1, 0.85, 0.3], scale: 0.32 },
      { element: 'H', pos: [0.1, -0.85, 0.3], scale: 0.32 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 }
    ],
    lonePairs: [
      { pos: [-1.1, 0.3, 0], id: 'lp_o' }
    ]
  },

  bonus_reaction: {
    atoms: [
      { element: 'O', pos: [-2.4, 0.5, 0], scale: 0.55 },
      { element: 'C', pos: [0.4, 0, 0], scale: 0.52 },
      { element: 'Br', pos: [2.2, 0, 0], scale: 0.65 },
      { element: 'C', pos: [0.3, 1.2, 0.3], scale: 0.45 },
      { element: 'C', pos: [0.3, -1.2, 0.3], scale: 0.45 }
    ],
    bonds: [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 1, to: 4 }
    ],
    lonePairs: [
      { pos: [-1.6, 0.7, 0], id: 'lp_nu' }
    ]
  }
};

export class MoleculeMesh {
  constructor(moleculeKey) {
    this.group = new THREE.Group();
    this.data = MOLECULE_DATA[moleculeKey] || MOLECULE_DATA.h2o;
    this.build();
  }

  build() {
    const { atoms, bonds } = this.data;

    // 1. Instanced Atoms
    if (atoms.length > 0) {
      const atomGeo = new THREE.IcosahedronGeometry(1, 2);
      const atomMat = new THREE.MeshStandardMaterial({
        roughness: 0.3,
        metalness: 0.2
      });
      const instancedAtoms = new THREE.InstancedMesh(atomGeo, atomMat, atoms.length);
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();

      for (let i = 0; i < atoms.length; i++) {
        const a = atoms[i];
        dummy.position.set(a.pos[0], a.pos[1], a.pos[2]);
        const s = a.scale || 0.45;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        instancedAtoms.setMatrixAt(i, dummy.matrix);

        const hex = CPK_COLORS[a.element] || 0xcccccc;
        color.setHex(hex);
        instancedAtoms.setColorAt(i, color);
      }
      instancedAtoms.instanceMatrix.needsUpdate = true;
      if (instancedAtoms.instanceColor) instancedAtoms.instanceColor.needsUpdate = true;
      this.group.add(instancedAtoms);
    }

    // 2. Instanced Bonds
    if (bonds.length > 0) {
      const bondGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 12);
      const bondMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.5,
        metalness: 0.3
      });
      const instancedBonds = new THREE.InstancedMesh(bondGeo, bondMat, bonds.length);
      const dummy = new THREE.Object3D();
      const up = new THREE.Vector3(0, 1, 0);

      for (let j = 0; j < bonds.length; j++) {
        const b = bonds[j];
        const p1 = new THREE.Vector3(...atoms[b.from].pos);
        const p2 = new THREE.Vector3(...atoms[b.to].pos);

        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(p2, p1);
        const len = dir.length();

        dummy.position.copy(mid);
        dummy.scale.set(1, len, 1);
        dummy.quaternion.setFromUnitVectors(up, dir.normalize());
        dummy.updateMatrix();
        instancedBonds.setMatrixAt(j, dummy.matrix);
      }
      instancedBonds.instanceMatrix.needsUpdate = true;
      this.group.add(instancedBonds);
    }
  }
}
