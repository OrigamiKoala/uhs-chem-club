/**
 * molecule.js — InstancedMesh rendering for atoms, covalent bonds, and reaction scenes
 */

import * as THREE from 'three';

export const CPK_COLORS = {
  H: 0xf1f5f9,
  C: 0x334155,
  O: 0xef4444,
  N: 0x3b82f6,
  F: 0x06b6d4,
  Cl: 0x22c55e,
  Br: 0x991b1b,
  Li: 0xa855f7
};

export const MOLECULE_DATA = {
  // Stage 1: Easy (1 obvious Red OH- + 1 obvious Blue CH3+)
  stage1_pair: {
    atoms: [
      // Left: Hydroxide ion (OH-)
      { element: 'O', pos: [-2.2, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-2.9, -0.3, 0], scale: 0.35 },
      // Right: Methyl carbocation (CH3+)
      { element: 'C', pos: [1.8, 0, 0], scale: 0.52 },
      { element: 'H', pos: [2.5, 0.6, 0], scale: 0.32 },
      { element: 'H', pos: [2.5, -0.6, 0], scale: 0.32 },
      { element: 'H', pos: [1.3, 0, 0.7], scale: 0.32 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 }
    ],
    regions: [
      { id: 'red_lp1', pos: [-1.4, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_c1', pos: [1.8, 0, 0], type: 'blue', intensity: 'extreme', scale: 0.8 }
    ]
  },

  // Stage 2: Easy (1 obvious Red NH3 + 1 obvious Blue CH3-Cl)
  stage2_pair: {
    atoms: [
      // Left: Ammonia (NH3)
      { element: 'N', pos: [-2.2, 0, 0], scale: 0.58 },
      { element: 'H', pos: [-2.8, -0.4, 0.4], scale: 0.32 },
      { element: 'H', pos: [-2.8, -0.4, -0.4], scale: 0.32 },
      { element: 'H', pos: [-2.4, 0.6, 0], scale: 0.32 },
      // Right: Chloromethane (CH3Cl)
      { element: 'C', pos: [1.6, 0, 0], scale: 0.52 },
      { element: 'Cl', pos: [3.1, 0, 0], scale: 0.65 },
      { element: 'H', pos: [1.4, 0.9, 0.4], scale: 0.32 },
      { element: 'H', pos: [1.4, -0.9, 0.4], scale: 0.32 },
      { element: 'H', pos: [1.3, 0, -0.9], scale: 0.32 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 4, to: 5 },
      { from: 4, to: 6 },
      { from: 4, to: 7 },
      { from: 4, to: 8 }
    ],
    regions: [
      { id: 'red_lp1', pos: [-1.5, 0.3, 0], type: 'red', intensity: 'extreme', scale: 0.8 },
      { id: 'blue_c1', pos: [1.1, 0, 0], type: 'blue', intensity: 'extreme', scale: 0.8 }
    ]
  },

  // Stage 3: Multiple regions (Acetate CH3COO- + Acetaldehyde CH3CHO) - Match Extremes
  stage3_pair: {
    atoms: [
      // Left: Acetate (CH3-COO-)
      { element: 'C', pos: [-3.2, 0, 0], scale: 0.5 },
      { element: 'C', pos: [-2.0, 0, 0], scale: 0.52 },
      { element: 'O', pos: [-1.6, 1.2, 0], scale: 0.56 }, // Carbonyl O (weaker red)
      { element: 'O', pos: [-1.3, -1.0, 0], scale: 0.6 }, // Anionic O (extreme red)
      { element: 'H', pos: [-3.6, 0.8, 0], scale: 0.3 },
      { element: 'H', pos: [-3.6, -0.8, 0], scale: 0.3 },
      // Right: Formaldehyde/Acetaldehyde
      { element: 'C', pos: [1.6, 0, 0], scale: 0.54 }, // Carbonyl C (extreme blue)
      { element: 'O', pos: [1.6, 1.3, 0], scale: 0.58 },
      { element: 'H', pos: [1.1, -0.8, 0], scale: 0.32 },
      { element: 'C', pos: [2.9, -0.4, 0], scale: 0.48 }, // Methyl C (weak blue)
      { element: 'H', pos: [3.4, 0.4, 0], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 0, to: 4 },
      { from: 0, to: 5 },
      { from: 6, to: 7 },
      { from: 6, to: 8 },
      { from: 6, to: 9 },
      { from: 9, to: 10 }
    ],
    regions: [
      { id: 'red_weak', pos: [-1.3, 1.5, 0], type: 'red', intensity: 'moderate', scale: 0.65 },
      { id: 'red_extreme', pos: [-0.8, -1.2, 0], type: 'red', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_extreme', pos: [1.3, -0.3, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_weak', pos: [3.2, -0.7, 0], type: 'blue', intensity: 'moderate', scale: 0.55 }
    ]
  },

  // Stage 4: Multiple competing sites (Aminoalcohol + Halo-carbonyl)
  stage4_pair: {
    atoms: [
      // Left: H2N-CH2-CH2-OH
      { element: 'O', pos: [-3.5, 0.8, 0], scale: 0.56 }, // O lone pair (moderate red)
      { element: 'C', pos: [-2.8, 0, 0], scale: 0.5 },
      { element: 'C', pos: [-1.8, 0, 0], scale: 0.5 },
      { element: 'N', pos: [-1.0, -0.6, 0], scale: 0.58 }, // N lone pair (extreme red)
      { element: 'H', pos: [-3.8, 1.4, 0], scale: 0.3 },
      { element: 'H', pos: [-0.6, -1.3, 0.3], scale: 0.3 },
      // Right: Cl-CH2-CO-CH3
      { element: 'Cl', pos: [3.8, 0.9, 0], scale: 0.62 },
      { element: 'C', pos: [2.8, 0.5, 0], scale: 0.5 }, // Alkyl C (moderate blue)
      { element: 'C', pos: [1.5, -0.2, 0], scale: 0.54 }, // Carbonyl C (extreme blue)
      { element: 'O', pos: [1.1, -1.3, 0], scale: 0.58 },
      { element: 'C', pos: [0.8, 0.8, 0], scale: 0.5 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 0, to: 4 },
      { from: 3, to: 5 },
      { from: 6, to: 7 },
      { from: 7, to: 8 },
      { from: 8, to: 9 },
      { from: 8, to: 10 }
    ],
    regions: [
      { id: 'red_weak', pos: [-3.7, 1.2, 0], type: 'red', intensity: 'moderate', scale: 0.65 },
      { id: 'red_extreme', pos: [-0.4, -0.4, 0], type: 'red', intensity: 'extreme', scale: 0.95 },
      { id: 'blue_extreme', pos: [1.8, -0.5, 0], type: 'blue', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_weak', pos: [2.6, 0.8, 0], type: 'blue', intensity: 'moderate', scale: 0.6 }
    ]
  },

  // Stage 5: Steric Hindrance 1 (Crowded tertiary carbon vs Open primary carbon)
  stage5_pair: {
    atoms: [
      // Left: Methoxide nucleophile (CH3O-)
      { element: 'C', pos: [-3.3, 0, 0], scale: 0.5 },
      { element: 'O', pos: [-2.1, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-3.7, 0.7, 0], scale: 0.3 },
      { element: 'H', pos: [-3.7, -0.7, 0], scale: 0.3 },

      // Right: Bifunctional substrate with crowded vs uncrowded sites
      // Uncrowded primary carbon (blue_open)
      { element: 'C', pos: [1.4, -1.2, 0], scale: 0.52 },
      { element: 'Br', pos: [2.7, -1.8, 0], scale: 0.65 },
      { element: 'H', pos: [0.8, -1.6, 0.6], scale: 0.32 },
      { element: 'H', pos: [0.8, -1.6, -0.6], scale: 0.32 },

      // Central linker
      { element: 'C', pos: [1.7, 0, 0], scale: 0.5 },

      // Crowded tertiary carbon (blue_blocked) surrounded by methyl clusters
      { element: 'C', pos: [2.2, 1.2, 0], scale: 0.52 },
      { element: 'Cl', pos: [3.6, 1.4, 0], scale: 0.62 },
      // Bulky methyl 1
      { element: 'C', pos: [1.8, 2.2, 0.8], scale: 0.48 },
      { element: 'H', pos: [1.1, 2.5, 0.8], scale: 0.3 },
      { element: 'H', pos: [2.5, 2.7, 0.8], scale: 0.3 },
      // Bulky methyl 2
      { element: 'C', pos: [1.8, 2.2, -0.8], scale: 0.48 },
      { element: 'H', pos: [1.1, 2.5, -0.8], scale: 0.3 },
      { element: 'H', pos: [2.5, 2.7, -0.8], scale: 0.3 },
      // Bulky methyl 3 (forward shield)
      { element: 'C', pos: [1.4, 0.8, 0], scale: 0.48 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 4, to: 5 },
      { from: 4, to: 6 },
      { from: 4, to: 7 },
      { from: 4, to: 8 },
      { from: 8, to: 9 },
      { from: 9, to: 10 },
      { from: 9, to: 11 },
      { from: 11, to: 12 },
      { from: 11, to: 13 },
      { from: 9, to: 14 },
      { from: 14, to: 15 },
      { from: 14, to: 16 },
      { from: 9, to: 17 }
    ],
    regions: [
      { id: 'red_nu', pos: [-1.4, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.9 },
      // Accessible open primary site
      { id: 'blue_open', pos: [1.0, -1.0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      // Crowded tertiary site (sterically shielded)
      { id: 'blue_blocked', pos: [2.0, 1.1, 0], type: 'blue', intensity: 'extreme', scale: 0.8, hindered: true }
    ]
  },

  // Stage 6: Steric Hindrance 2 (Shielded branched center vs Open flank site)
  stage6_pair: {
    atoms: [
      // Left: Nucleophile
      { element: 'O', pos: [-2.2, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-2.9, 0, 0], scale: 0.35 },

      // Right: Substrate with bulky isopropyl guards protecting one carbonyl
      // Accessible unhindered center
      { element: 'C', pos: [1.3, -1.2, 0], scale: 0.52 },
      { element: 'O', pos: [0.8, -2.1, 0], scale: 0.56 },
      { element: 'H', pos: [1.9, -1.4, 0], scale: 0.32 },

      // Linker
      { element: 'C', pos: [1.7, 0, 0], scale: 0.5 },

      // Hindered center (blue_blocked) with bulky wings
      { element: 'C', pos: [2.1, 1.2, 0], scale: 0.54 },
      { element: 'O', pos: [3.3, 1.4, 0], scale: 0.58 },
      // Isopropyl wing left
      { element: 'C', pos: [1.2, 1.6, 0.8], scale: 0.5 },
      { element: 'C', pos: [0.6, 2.4, 0.8], scale: 0.46 },
      { element: 'C', pos: [1.2, 1.1, 1.8], scale: 0.46 },
      // Isopropyl wing right
      { element: 'C', pos: [1.2, 1.6, -0.8], scale: 0.5 },
      { element: 'C', pos: [0.6, 2.4, -0.8], scale: 0.46 },
      { element: 'C', pos: [1.2, 1.1, -1.8], scale: 0.46 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
      { from: 6, to: 8 },
      { from: 8, to: 9 },
      { from: 8, to: 10 },
      { from: 6, to: 11 },
      { from: 11, to: 12 },
      { from: 11, to: 13 }
    ],
    regions: [
      { id: 'red_nu', pos: [-1.5, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_open', pos: [1.6, -0.9, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_blocked', pos: [1.8, 1.2, 0], type: 'blue', intensity: 'extreme', scale: 0.85, hindered: true }
    ]
  },

  // Stage 7: Master Challenge (Multiple Extremes & Steric Filtration)
  stage7_pair: {
    atoms: [
      // Left: Complex donor with multiple red sites
      { element: 'O', pos: [-3.4, 1.0, 0], scale: 0.55 }, // red_weak1
      { element: 'C', pos: [-2.6, 0.4, 0], scale: 0.5 },
      { element: 'C', pos: [-1.8, -0.4, 0], scale: 0.5 },
      { element: 'N', pos: [-2.2, -1.4, 0], scale: 0.55 }, // red_weak2
      { element: 'O', pos: [-0.9, -0.2, 0], scale: 0.62 }, // red_supreme (extreme nucleophile)

      // Right: Complex substrate with multiple blue sites
      // Open accessible blue site
      { element: 'C', pos: [1.3, -1.1, 0], scale: 0.54 }, // blue_accessible
      { element: 'O', pos: [1.0, -2.1, 0], scale: 0.58 },
      { element: 'H', pos: [0.7, -0.8, 0.7], scale: 0.32 },

      // Central backbone
      { element: 'C', pos: [1.9, 0, 0], scale: 0.5 },

      // Caged extreme blue site (sterically blocked)
      { element: 'C', pos: [2.3, 1.2, 0], scale: 0.54 }, // blue_caged
      { element: 'Cl', pos: [3.5, 1.5, 0], scale: 0.62 },
      // Shield cage
      { element: 'C', pos: [1.4, 1.8, 0.9], scale: 0.5 },
      { element: 'C', pos: [1.4, 1.8, -0.9], scale: 0.5 },
      { element: 'C', pos: [1.1, 0.8, 0], scale: 0.5 }, // Direct face shield
      { element: 'C', pos: [3.0, -0.8, 0], scale: 0.48 } // blue_weak
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 5, to: 6 },
      { from: 5, to: 7 },
      { from: 5, to: 8 },
      { from: 8, to: 9 },
      { from: 9, to: 10 },
      { from: 9, to: 11 },
      { from: 9, to: 12 },
      { from: 9, to: 13 },
      { from: 8, to: 14 }
    ],
    regions: [
      { id: 'red_weak1', pos: [-3.7, 1.4, 0], type: 'red', intensity: 'moderate', scale: 0.6 },
      { id: 'red_weak2', pos: [-2.4, -1.8, 0], type: 'red', intensity: 'moderate', scale: 0.65 },
      { id: 'red_supreme', pos: [-0.4, 0, 0], type: 'red', intensity: 'extreme', scale: 0.95 },
      { id: 'blue_accessible', pos: [1.6, -0.8, 0], type: 'blue', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_caged', pos: [2.0, 1.2, 0], type: 'blue', intensity: 'extreme', scale: 0.95, hindered: true },
      { id: 'blue_weak', pos: [3.4, -1.1, 0], type: 'blue', intensity: 'moderate', scale: 0.55 }
    ]
  }
};

export class MoleculeMesh {
  constructor(moleculeKey) {
    this.group = new THREE.Group();
    this.data = MOLECULE_DATA[moleculeKey] || MOLECULE_DATA.stage1_pair;
    this.build();
  }

  build() {
    const { atoms = [], bonds = [] } = this.data;

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
      const bondGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 12);
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
        if (!atoms[b.from] || !atoms[b.to]) continue;
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
