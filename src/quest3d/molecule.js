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
  // Geometry notes (apply to every stage):
  // - A group landing on a flat (three-connected) center arrives along the face,
  //   roughly perpendicular to the plane of that center, never edge-on.
  // - A backside displacement lines up nucleophile, carbon and leaving group.
  // - A hydrogen handed between two partners sits on the line between them.
  // Hydrogens that play no part in the reaction are often left implicit.

  // Stage 1: Hydroxide (OH-) + methyl cation (CH3+). The cation is flat; its
  // empty face points at the incoming oxygen.
  stage1_pair: {
    atoms: [
      { element: 'O', pos: [-2.2, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-2.9, -0.3, 0], scale: 0.35 },
      { element: 'C', pos: [1.8, 0, 0], scale: 0.52 },
      { element: 'H', pos: [1.8, 0.375, 0.65], scale: 0.32 },
      { element: 'H', pos: [1.8, -0.75, 0], scale: 0.32 },
      { element: 'H', pos: [1.8, 0.375, -0.65], scale: 0.32 }
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

  // Stage 2: Ammonia (NH3) + chloromethane (CH3Cl). N, C and Cl are collinear
  // (backside attack); the three C–H bonds flip through like an umbrella.
  stage2_pair: {
    atoms: [
      { element: 'N', pos: [-2.2, 0, 0], scale: 0.58 },
      { element: 'H', pos: [-2.46, -0.38, 0.65], scale: 0.32 },
      { element: 'H', pos: [-2.46, -0.38, -0.65], scale: 0.32 },
      { element: 'H', pos: [-2.46, 0.75, 0], scale: 0.32 },
      { element: 'C', pos: [1.6, 0, 0], scale: 0.52 },
      { element: 'Cl', pos: [3.1, 0, 0], scale: 0.65 },
      { element: 'H', pos: [1.27, 0.81, 0.47], scale: 0.32 },
      { element: 'H', pos: [1.27, -0.81, 0.47], scale: 0.32 },
      { element: 'H', pos: [1.27, 0, -0.94], scale: 0.32 }
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

  // Stage 3: Acetate (CH3COO-) + acetaldehyde (CH3CHO). The aldehyde's flat face
  // is turned toward the charged acetate oxygen.
  stage3_pair: {
    atoms: [
      { element: 'C', pos: [-3.2, 0, 0], scale: 0.5 },
      { element: 'C', pos: [-2.0, 0, 0], scale: 0.52 },
      { element: 'O', pos: [-1.6, 1.2, 0], scale: 0.56 }, // C=O oxygen (weaker red)
      { element: 'O', pos: [-1.3, -1.0, 0], scale: 0.6 }, // charged oxygen (extreme red)
      { element: 'H', pos: [-3.6, 0.8, 0], scale: 0.3 },
      { element: 'H', pos: [-3.6, -0.8, 0], scale: 0.3 },
      { element: 'C', pos: [1.6, 0, 0], scale: 0.54 }, // C=O carbon (extreme blue)
      { element: 'O', pos: [1.51, 1.25, 0], scale: 0.58 },
      { element: 'H', pos: [1.3, -0.4, -0.56], scale: 0.32 },
      { element: 'C', pos: [2.21, -0.61, 0.97], scale: 0.48 }, // methyl C (weak blue)
      { element: 'H', pos: [2.76, -0.31, 1.37], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2, order: 2 },
      { from: 1, to: 3 },
      { from: 0, to: 4 },
      { from: 0, to: 5 },
      { from: 6, to: 7, order: 2 },
      { from: 6, to: 8 },
      { from: 6, to: 9 },
      { from: 9, to: 10 }
    ],
    regions: [
      { id: 'red_weak', pos: [-1.3, 1.5, 0], type: 'red', intensity: 'moderate', scale: 0.65 },
      { id: 'red_extreme', pos: [-0.8, -1.2, 0], type: 'red', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_extreme', pos: [1.3, -0.3, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_weak', pos: [2.45, -0.75, 1.2], type: 'blue', intensity: 'moderate', scale: 0.55 }
    ]
  },

  // Stage 4: 2-aminoethanol (H2N-CH2-CH2-OH) + chloroacetone (Cl-CH2-CO-CH3).
  // The ketone's flat face is turned toward the nitrogen.
  stage4_pair: {
    atoms: [
      { element: 'O', pos: [-3.5, 0.8, 0], scale: 0.56 }, // O lone pair (moderate red)
      { element: 'C', pos: [-2.8, 0, 0], scale: 0.5 },
      { element: 'C', pos: [-1.8, 0, 0], scale: 0.5 },
      { element: 'N', pos: [-1.0, -0.6, 0], scale: 0.58 }, // N lone pair (extreme red)
      { element: 'H', pos: [-3.8, 1.4, 0], scale: 0.3 },
      { element: 'H', pos: [-1.25, -1.3, 0.35], scale: 0.3 },
      { element: 'Cl', pos: [2.55, 1.55, -1.75], scale: 0.62 },
      { element: 'C', pos: [1.75, 0.62, -0.97], scale: 0.5 }, // CH2Cl carbon (moderate blue)
      { element: 'C', pos: [1.5, -0.2, 0], scale: 0.54 }, // C=O carbon (extreme blue)
      { element: 'O', pos: [2.01, -1.34, 0], scale: 0.58 },
      { element: 'C', pos: [0.72, 0.16, 0.97], scale: 0.5 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 0, to: 4 },
      { from: 3, to: 5 },
      { from: 6, to: 7 },
      { from: 7, to: 8 },
      { from: 8, to: 9, order: 2 },
      { from: 8, to: 10 }
    ],
    regions: [
      { id: 'red_weak', pos: [-3.7, 1.2, 0], type: 'red', intensity: 'moderate', scale: 0.65 },
      { id: 'red_extreme', pos: [-0.4, -0.4, 0], type: 'red', intensity: 'extreme', scale: 0.95 },
      { id: 'blue_extreme', pos: [1.15, -0.3, 0], type: 'blue', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_weak', pos: [2.0, 0.85, -1.2], type: 'blue', intensity: 'moderate', scale: 0.6 }
    ]
  },

  // Stage 5: Methoxide (CH3O-) + a substrate with an open CH2-Br (backside open,
  // O···C···Br collinear) and a tertiary C-Cl walled in by methyl groups.
  stage5_pair: {
    atoms: [
      { element: 'C', pos: [-3.3, 0, 0], scale: 0.5 },
      { element: 'O', pos: [-2.1, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-3.7, 0.7, 0], scale: 0.3 },
      { element: 'H', pos: [-3.7, -0.7, 0], scale: 0.3 },

      // Uncrowded primary carbon (blue_open)
      { element: 'C', pos: [1.4, -1.2, 0], scale: 0.52 },
      { element: 'Br', pos: [2.7, -1.8, 0], scale: 0.65 },
      { element: 'H', pos: [0.8, -1.6, 0.6], scale: 0.32 },
      { element: 'H', pos: [0.8, -1.6, -0.6], scale: 0.32 },

      // Central linker (CH carrying the forward shield methyl)
      { element: 'C', pos: [1.7, 0, 0], scale: 0.5 },

      // Crowded tertiary carbon (blue_blocked): linker, Cl and two methyls
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
      // Forward shield methyl, hung on the linker in front of the tertiary carbon
      { element: 'C', pos: [0.75, 0.65, 0.3], scale: 0.48 }
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
      { from: 8, to: 17 }
    ],
    regions: [
      { id: 'red_nu', pos: [-1.4, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_open', pos: [1.0, -1.0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_blocked', pos: [2.0, 1.1, 0], type: 'blue', intensity: 'extreme', scale: 0.8, hindered: true }
    ]
  },

  // Stage 6: Hydroxide + a molecule with an open C=O (lower) and a C=O fenced in
  // by two bulky branches (upper). The open C=O faces the hydroxide.
  stage6_pair: {
    atoms: [
      { element: 'O', pos: [-2.2, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-2.9, 0, 0], scale: 0.35 },

      // Accessible C=O (CHO)
      { element: 'C', pos: [1.3, -1.2, 0], scale: 0.52 },
      { element: 'O', pos: [1.46, -1.89, 1.04], scale: 0.56 },
      { element: 'H', pos: [1.18, -1.56, -0.65], scale: 0.32 },

      // Linker (CH carrying branch 2)
      { element: 'C', pos: [1.7, 0, 0], scale: 0.5 },

      // Hindered C=O (CHO) with branch 1 alongside
      { element: 'C', pos: [2.1, 1.2, 0], scale: 0.54 },
      { element: 'O', pos: [3.3, 1.4, 0], scale: 0.58 },
      // Branch 1 (on the hindered carbon)
      { element: 'C', pos: [1.2, 1.6, 0.8], scale: 0.5 },
      { element: 'C', pos: [0.6, 2.4, 0.8], scale: 0.46 },
      { element: 'C', pos: [1.2, 1.1, 1.8], scale: 0.46 },
      // Branch 2 (on the linker)
      { element: 'C', pos: [1.1, 0.8, -0.7], scale: 0.5 },
      { element: 'C', pos: [0.4, 1.7, -0.9], scale: 0.46 },
      { element: 'C', pos: [1.2, 1.1, -1.8], scale: 0.46 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3, order: 2 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7, order: 2 },
      { from: 6, to: 8 },
      { from: 8, to: 9 },
      { from: 8, to: 10 },
      { from: 5, to: 11 },
      { from: 11, to: 12 },
      { from: 11, to: 13 }
    ],
    regions: [
      { id: 'red_nu', pos: [-1.5, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_open', pos: [1.6, -0.9, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_blocked', pos: [1.8, 1.2, 0], type: 'blue', intensity: 'extreme', scale: 0.85, hindered: true }
    ]
  },

  // Stage 7: A donor with three red sites (the charged O is strongest) + a
  // substrate with an open C=O, a caged tertiary C-Cl and a weak methyl.
  stage7_pair: {
    atoms: [
      { element: 'O', pos: [-3.4, 1.0, 0], scale: 0.55 }, // red_weak1
      { element: 'C', pos: [-2.6, 0.4, 0], scale: 0.5 },
      { element: 'C', pos: [-1.8, -0.4, 0], scale: 0.5 },
      { element: 'N', pos: [-2.2, -1.4, 0], scale: 0.55 }, // red_weak2
      { element: 'O', pos: [-0.6, -0.1, 0], scale: 0.62 }, // red_supreme (charged O)

      // Open C=O (blue_accessible), flat face toward the charged O
      { element: 'C', pos: [1.3, -1.1, 0], scale: 0.54 },
      { element: 'O', pos: [1.31, -1.76, 1.06], scale: 0.58 },
      { element: 'H', pos: [1.12, -1.43, -0.65], scale: 0.32 },

      // Central backbone (carries the face shield and the weak methyl)
      { element: 'C', pos: [1.9, 0, 0], scale: 0.5 },

      // Caged tertiary C-Cl (sterically blocked)
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
      { from: 5, to: 6, order: 2 },
      { from: 5, to: 7 },
      { from: 5, to: 8 },
      { from: 8, to: 9 },
      { from: 9, to: 10 },
      { from: 9, to: 11 },
      { from: 9, to: 12 },
      { from: 8, to: 13 },
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
  },

  // Stage 8: Hydroxide + hydronium (H3O+) + methane bystander. The transferred H
  // sits on the O···H–O line.
  stage8_trio: {
    atoms: [
      { element: 'O', pos: [-2.8, 0.6, 0], scale: 0.6 },
      { element: 'H', pos: [-3.5, 0.4, 0], scale: 0.35 },
      { element: 'O', pos: [0.6, 0.2, 0], scale: 0.56 },
      { element: 'H', pos: [-0.2, 0.4, 0], scale: 0.35 },
      { element: 'H', pos: [0.9, 0.55, 0.65], scale: 0.32 },
      { element: 'H', pos: [0.9, 0.55, -0.65], scale: 0.32 },
      { element: 'C', pos: [3.0, -0.6, 0], scale: 0.5 },
      { element: 'H', pos: [2.5, -1.3, 0], scale: 0.3 },
      { element: 'H', pos: [3.7, -1.0, 0], scale: 0.3 },
      { element: 'H', pos: [3.2, 0.1, 0.5], scale: 0.3 },
      { element: 'H', pos: [2.6, -0.2, -0.5], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 6, to: 7 },
      { from: 6, to: 8 },
      { from: 6, to: 9 },
      { from: 6, to: 10 }
    ],
    regions: [
      { id: 'red_base', pos: [-2.2, 0.7, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_acid', pos: [-0.2, 0.4, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'spectator_mid', pos: [3.0, -0.6, 0], type: 'blue', intensity: 'weak', scale: 0.45 }
    ]
  },

  // Stage 9: Ethoxide (strong) + methanol (weak) + ethyl cation. The cation is
  // flat and its empty face points at the ethoxide oxygen.
  stage9_trio: {
    atoms: [
      { element: 'C', pos: [-3.6, 1.4, 0], scale: 0.48 },
      { element: 'C', pos: [-2.4, 1.2, 0], scale: 0.5 },
      { element: 'O', pos: [-1.4, 1.6, 0], scale: 0.6 },
      { element: 'H', pos: [-4.0, 0.8, 0], scale: 0.3 },
      { element: 'H', pos: [-3.8, 2.2, 0], scale: 0.3 },
      { element: 'C', pos: [-3.2, -1.4, 0], scale: 0.48 },
      { element: 'O', pos: [-2.0, -1.0, 0], scale: 0.54 },
      { element: 'H', pos: [-1.6, -1.7, 0], scale: 0.3 },
      { element: 'H', pos: [-3.6, -2.0, 0], scale: 0.3 },
      { element: 'C', pos: [1.5, 0, 0], scale: 0.54 },
      { element: 'C', pos: [2.13, 1.14, 0], scale: 0.48 },
      { element: 'H', pos: [1.32, -0.33, 0.65], scale: 0.32 },
      { element: 'H', pos: [1.32, -0.33, -0.65], scale: 0.32 },
      { element: 'H', pos: [2.74, 1.37, 0.38], scale: 0.3 },
      { element: 'H', pos: [2.2, 1.59, -0.6], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
      { from: 5, to: 8 },
      { from: 9, to: 10 },
      { from: 9, to: 11 },
      { from: 9, to: 12 },
      { from: 10, to: 13 },
      { from: 10, to: 14 }
    ],
    regions: [
      { id: 'red_strong', pos: [-1.0, 1.8, 0], type: 'red', intensity: 'extreme', scale: 0.95 },
      { id: 'red_weak', pos: [-1.6, -0.8, 0], type: 'red', intensity: 'moderate', scale: 0.6 },
      { id: 'blue_target', pos: [1.2, 0, 0], type: 'blue', intensity: 'extreme', scale: 0.9 }
    ]
  },

  // Stage 10: Amide base (NH2-) + methanol + bromomethane. Only a base this strong
  // can pull the O-H hydrogen off methanol; N···H–O are collinear. The methoxide
  // left behind faces the back of the C-Br bond, ready for the next move.
  stage10_trio: {
    atoms: [
      { element: 'N', pos: [-2.8, 1.2, 0], scale: 0.58 },
      { element: 'H', pos: [-3.22, 1.45, 0.63], scale: 0.32 },
      { element: 'H', pos: [-3.22, 1.45, -0.63], scale: 0.32 },
      // Methanol (CH3OH)
      { element: 'C', pos: [0.72, -2.19, 0], scale: 0.5 },
      { element: 'O', pos: [1.04, -1.03, 0], scale: 0.56 },
      { element: 'H', pos: [0.26, -2.57, 0.46], scale: 0.3 },
      { element: 'H', pos: [0.3, -0.6, 0], scale: 0.35 }, // O-H hydrogen
      // Bromomethane (CH3Br)
      { element: 'C', pos: [2.7, -0.7, 0], scale: 0.52 },
      { element: 'Br', pos: [4.0, -1.1, 0], scale: 0.65 },
      { element: 'H', pos: [2.66, 0.2, 0], scale: 0.3 },
      { element: 'H', pos: [2.2, -1.31, -0.42], scale: 0.3 },
      { element: 'H', pos: [2.2, -1.31, 0.42], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 6 },
      { from: 7, to: 8 },
      { from: 7, to: 9 },
      { from: 7, to: 10 },
      { from: 7, to: 11 }
    ],
    regions: [
      { id: 'red_base', pos: [-2.2, 1.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_proton', pos: [0.3, -0.6, 0], type: 'blue', intensity: 'extreme', scale: 0.8 },
      { id: 'blue_substrate', pos: [2.2, -0.6, 0], type: 'blue', intensity: 'moderate', scale: 0.65 }
    ]
  },

  // Stage 11: OH- + CH3Cl + a bare H+ that captures the chloride. Step 1 reaches
  // the five-around-carbon halfway point (H3 flat); step 2 finishes the flip.
  stage11_pair: {
    atoms: [
      { element: 'O', pos: [-2.2, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-2.9, -0.3, 0], scale: 0.35 },
      { element: 'C', pos: [1.6, 0, 0], scale: 0.52 },
      { element: 'Cl', pos: [3.1, 0, 0], scale: 0.65 },
      { element: 'H', pos: [1.27, 0.81, 0.47], scale: 0.32 },
      { element: 'H', pos: [1.27, -0.81, 0.47], scale: 0.32 },
      { element: 'H', pos: [1.27, 0, -0.94], scale: 0.32 },
      { element: 'H', pos: [4.0, 0.8, 0], scale: 0.35 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 2, to: 6 }
    ],
    regions: [
      { id: 'red_nu', pos: [-1.4, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_c', pos: [1.2, 0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_cl', pos: [3.1, 0, 0], type: 'red', intensity: 'moderate', scale: 0.75 },
      { id: 'blue_scavenger', pos: [4.0, 0.8, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 12: Methoxide + formaldehyde (face-on) + water as the H donor, lined up
  // with where the new O- ends up after step 1.
  stage12_pair: {
    atoms: [
      { element: 'C', pos: [-3.2, 0, 0], scale: 0.5 },
      { element: 'O', pos: [-2.0, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-3.6, 0.6, 0], scale: 0.3 },
      { element: 'H', pos: [-3.6, -0.6, 0], scale: 0.3 },
      { element: 'C', pos: [1.6, -0.3, 0], scale: 0.54 },
      { element: 'O', pos: [1.92, 0.91, 0], scale: 0.58 },
      { element: 'H', pos: [1.5, -0.66, 0.65], scale: 0.32 },
      { element: 'H', pos: [1.5, -0.66, -0.65], scale: 0.32 },
      { element: 'H', pos: [3.18, 1.75, 0], scale: 0.35 },
      { element: 'O', pos: [3.9, 2.29, 0], scale: 0.56 },
      { element: 'H', pos: [4.36, 2.06, 0.57], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 4, to: 5, order: 2 },
      { from: 4, to: 6 },
      { from: 4, to: 7 },
      { from: 8, to: 9 },
      { from: 9, to: 10 }
    ],
    regions: [
      { id: 'red_nu', pos: [-1.4, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_c', pos: [1.2, 0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_o', pos: [1.95, 1.15, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_h', pos: [3.18, 1.75, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 13: Two water + hydronium (H3O+) handoffs. Each water points a lone
  // pair straight at the H it receives.
  stage13_pair: {
    atoms: [
      // Water 1
      { element: 'O', pos: [-2.4, 0.4, 0], scale: 0.58 },
      { element: 'H', pos: [-2.67, 0.02, 0.6], scale: 0.32 },
      { element: 'H', pos: [-2.67, 0.02, -0.6], scale: 0.32 },
      // Hydronium 1
      { element: 'H', pos: [-0.8, 0.4, 0], scale: 0.35 },
      { element: 'O', pos: [0.3, 0.2, 0], scale: 0.58 },
      { element: 'H', pos: [0.65, 0.5, 0.63], scale: 0.32 },
      // Water 2
      { element: 'O', pos: [1.8, -0.6, 0], scale: 0.58 },
      { element: 'H', pos: [1.59, -1.02, 0.6], scale: 0.32 },
      { element: 'H', pos: [1.59, -1.02, -0.6], scale: 0.32 },
      // Hydronium 2
      { element: 'H', pos: [3.1, -0.4, 0], scale: 0.35 },
      { element: 'O', pos: [3.9, -0.6, 0], scale: 0.58 },
      { element: 'H', pos: [4.27, -0.32, 0.63], scale: 0.32 },
      // Third hydrogens of the two hydronium ions
      { element: 'H', pos: [0.65, 0.5, -0.63], scale: 0.32 },
      { element: 'H', pos: [4.27, -0.32, -0.63], scale: 0.32 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 6, to: 7 },
      { from: 6, to: 8 },
      { from: 9, to: 10 },
      { from: 10, to: 11 },
      { from: 4, to: 12 },
      { from: 10, to: 13 }
    ],
    regions: [
      { id: 'red_base1', pos: [-2.0, 0.4, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_h1', pos: [-0.8, 0.4, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_base2', pos: [1.8, -0.6, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_h2', pos: [3.1, -0.4, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 14: Methoxide + acetyl chloride (face-on) + H+ that captures chloride.
  stage14_pair: {
    atoms: [
      { element: 'C', pos: [-3.2, 0, 0], scale: 0.5 },
      { element: 'O', pos: [-2.0, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-3.6, 0.7, 0], scale: 0.3 },
      { element: 'H', pos: [-3.6, -0.7, 0], scale: 0.3 },
      { element: 'C', pos: [1.5, 0, 0], scale: 0.54 },
      { element: 'O', pos: [1.82, 1.21, 0], scale: 0.58 },
      { element: 'Cl', pos: [1.95, -0.92, 1.16], scale: 0.62 },
      { element: 'C', pos: [0.79, -0.48, -0.97], scale: 0.5 },
      { element: 'H', pos: [0.63, -0.71, -1.66], scale: 0.3 },
      { element: 'H', pos: [0.4, -1.1, -1.05], scale: 0.3 },
      { element: 'H', pos: [3.25, -0.45, 1.2], scale: 0.35 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 4, to: 5, order: 2 },
      { from: 4, to: 6 },
      { from: 4, to: 7 },
      { from: 7, to: 8 },
      { from: 7, to: 9 }
    ],
    regions: [
      { id: 'red_nu', pos: [-1.4, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_c', pos: [1.2, 0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_cl', pos: [2.1, -0.55, 1.2], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_scavenger', pos: [3.25, -0.45, 1.2], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 15: Water + acetone (face-on) + hydronium. The hydronium H sits on the
  // C=O oxygen's side, in line with it.
  stage15_trio: {
    atoms: [
      { element: 'O', pos: [-2.8, -0.5, 0], scale: 0.58 },
      { element: 'H', pos: [-3.0, -0.92, 0.6], scale: 0.32 },
      { element: 'H', pos: [-3.0, -0.92, -0.6], scale: 0.32 },
      { element: 'C', pos: [0.2, 0, 0], scale: 0.54 },
      { element: 'O', pos: [0.32, 1.24, 0], scale: 0.58 },
      { element: 'C', pos: [-0.34, -0.6, -1.02], scale: 0.48 },
      { element: 'C', pos: [0.61, -0.69, 1.02], scale: 0.48 },
      { element: 'O', pos: [2.38, 2.14, 0], scale: 0.56 },
      { element: 'H', pos: [1.6, 1.8, 0], scale: 0.35 },
      { element: 'H', pos: [2.5, 2.59, 0.63], scale: 0.3 },
      { element: 'H', pos: [2.5, 2.59, -0.63], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 3, to: 4, order: 2 },
      { from: 3, to: 5 },
      { from: 3, to: 6 },
      { from: 7, to: 8 },
      { from: 7, to: 9 },
      { from: 7, to: 10 }
    ],
    regions: [
      { id: 'red_o_carbonyl', pos: [0.2, 1.5, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_proton', pos: [1.6, 1.8, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_water', pos: [-2.1, -0.5, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_activated_c', pos: [0.0, 0.0, 0], type: 'blue', intensity: 'extreme', scale: 0.9 }
    ]
  },

  // Stage 16: Hydroxide + ethyl acetate (face-on) + water that protonates the
  // departing ethoxide.
  stage16_trio: {
    atoms: [
      { element: 'O', pos: [-2.8, 0.4, 0], scale: 0.6 },
      { element: 'H', pos: [-3.4, 0.1, 0], scale: 0.35 },
      { element: 'C', pos: [0.0, 0.0, 0], scale: 0.54 },
      { element: 'O', pos: [0.49, 1.15, 0], scale: 0.58 },
      { element: 'C', pos: [-0.77, -0.38, -0.97], scale: 0.48 },
      { element: 'O', pos: [0.26, -0.82, 0.97], scale: 0.56 },
      { element: 'C', pos: [1.55, -0.95, 1.35], scale: 0.48 },
      { element: 'C', pos: [2.58, -0.31, 0.96], scale: 0.48 },
      { element: 'H', pos: [1.1, 0.18, 1.15], scale: 0.35 },
      { element: 'O', pos: [1.73, 0.81, 1.24], scale: 0.56 },
      { element: 'H', pos: [2.3, 1.2, 0.9], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3, order: 2 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
      { from: 8, to: 9 },
      { from: 9, to: 10 }
    ],
    regions: [
      { id: 'red_nu', pos: [-2.2, 0.4, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_c', pos: [0.0, 0.0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_ethoxide', pos: [0.75, -0.55, 1.1], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_proton', pos: [1.1, 0.18, 1.15], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 17: Hydroxide + methyl-substituted three-ring (C, C, O) + water. Attack
  // at the less crowded ring carbon, from directly behind its C-O bond.
  stage17_pair: {
    atoms: [
      { element: 'O', pos: [-2.8, -0.3, 0], scale: 0.6 },
      { element: 'H', pos: [-3.5, -0.5, 0], scale: 0.35 },
      { element: 'C', pos: [0.8, -0.6, 0], scale: 0.52 },
      { element: 'C', pos: [1.28, 0.71, 0], scale: 0.52 },
      { element: 'O', pos: [2.17, -0.36, 0], scale: 0.58 },
      { element: 'H', pos: [0.56, -1.0, 0.65], scale: 0.3 },
      { element: 'C', pos: [1.02, 1.81, 0.64], scale: 0.48 },
      { element: 'H', pos: [3.24, 1.91, 0], scale: 0.35 },
      { element: 'O', pos: [3.96, 2.45, 0], scale: 0.56 },
      { element: 'H', pos: [4.56, 2.15, 0.4], scale: 0.3 },
      { element: 'H', pos: [0.56, -1.0, -0.65], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 3, to: 6 },
      { from: 7, to: 8 },
      { from: 8, to: 9 },
      { from: 2, to: 5 },
      { from: 2, to: 10 }
    ],
    regions: [
      { id: 'red_nu', pos: [-2.1, -0.25, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_c_ring', pos: [0.7, -0.5, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_o_ring', pos: [2.35, -0.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_proton', pos: [3.24, 1.91, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 18: Amide base (NH2-) + acetaldehyde + bromomethane. The C-H being
  // removed lines up with the C=O system; once it is gone the carbon attacks the
  // CH3-Br from the opposite face, backside to the bromine.
  stage18_pair: {
    atoms: [
      { element: 'N', pos: [-2.58, 2.06, 0], scale: 0.58 },
      { element: 'H', pos: [-3.1, 2.55, 0.5], scale: 0.32 },
      { element: 'C', pos: [-0.5, 0.5, 0], scale: 0.5 },
      { element: 'H', pos: [-1.3, 1.1, 0], scale: 0.35 },
      { element: 'C', pos: [0.58, 1.22, 0], scale: 0.54 },
      { element: 'O', pos: [1.1, 1.57, 1.08], scale: 0.58 },
      { element: 'C', pos: [1.58, -1.06, 0], scale: 0.5 },
      { element: 'Br', pos: [2.82, -1.99, 0], scale: 0.65 },
      { element: 'H', pos: [-3.1, 2.55, -0.5], scale: 0.32 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 4, to: 5, order: 2 },
      { from: 6, to: 7 },
      { from: 0, to: 8 }
    ],
    regions: [
      { id: 'red_base', pos: [-2.3, 1.85, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_h_alpha', pos: [-1.3, 1.1, 0], type: 'blue', intensity: 'extreme', scale: 0.8 },
      { id: 'c_alpha', pos: [-0.22, 0.29, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_target', pos: [1.35, -0.85, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 19: tert-butyl chloride + water + H+ that captures chloride. The center
  // flattens when Cl leaves and puckers again when water lands on the open face.
  stage19_pair: {
    atoms: [
      { element: 'C', pos: [0.8, 0.0, 0], scale: 0.54 },
      { element: 'Cl', pos: [2.4, 0.0, 0], scale: 0.65 },
      { element: 'C', pos: [0.37, 1.23, 0], scale: 0.48 },
      { element: 'C', pos: [0.37, -0.62, -1.07], scale: 0.48 },
      { element: 'C', pos: [0.37, -0.62, 1.07], scale: 0.48 },
      { element: 'O', pos: [-2.8, 0.0, 0], scale: 0.58 },
      { element: 'H', pos: [-3.07, -0.38, 0.6], scale: 0.32 },
      { element: 'H', pos: [-3.07, -0.38, -0.6], scale: 0.32 },
      { element: 'H', pos: [4.0, 0.0, 0], scale: 0.35 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 5, to: 6 },
      { from: 5, to: 7 }
    ],
    regions: [
      { id: 'red_cl', pos: [2.5, 0.0, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_scavenger', pos: [4.0, 0.0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_water', pos: [-2.1, 0.0, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_carbocation', pos: [0.8, 0.0, 0], type: 'blue', intensity: 'extreme', scale: 0.9 }
    ]
  },

  // Stage 20: Hydronium + methylamine + acetyl bromide. The hydronium H sits in
  // line with the C=O oxygen (upper left); the amine meets the C=O face-on.
  stage20_multi: {
    atoms: [
      { element: 'O', pos: [-2.53, 2.49, 0], scale: 0.56 },
      { element: 'H', pos: [-1.83, 2.02, 0], scale: 0.35 },
      { element: 'N', pos: [-1.9, -1.4, 0], scale: 0.58 },
      { element: 'C', pos: [-3.06, -1.53, -0.58], scale: 0.48 },
      { element: 'C', pos: [-0.2, 0.2, 0], scale: 0.54 },
      { element: 'O', pos: [-0.79, 1.3, 0], scale: 0.58 },
      { element: 'C', pos: [-0.31, -0.6, -1.02], scale: 0.48 },
      { element: 'Br', pos: [0.67, -0.21, 1.22], scale: 0.65 },
      { element: 'H', pos: [-2.98, 2.36, -0.63], scale: 0.3 },
      { element: 'H', pos: [-2.98, 2.36, 0.63], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 4, to: 5, order: 2 },
      { from: 4, to: 6 },
      { from: 4, to: 7 },
      { from: 0, to: 8 },
      { from: 0, to: 9 }
    ],
    regions: [
      { id: 'red_cat', pos: [-1.0, 1.5, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_proton', pos: [-1.83, 2.02, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_core', pos: [-1.6, -1.13, 0], type: 'red', intensity: 'extreme', scale: 0.95 },
      { id: 'blue_c_scaffold', pos: [-0.45, -0.05, 0], type: 'blue', intensity: 'extreme', scale: 0.9 },
      { id: 'bond_leave', pos: [0.8, -0.1, 0.75], type: 'blue', intensity: 'moderate', scale: 0.7 },
      { id: 'red_depart', pos: [1.05, -0.35, 1.45], type: 'red', intensity: 'extreme', scale: 0.85 }
    ]
  }
};

export const BALL_RADII = {
  H: 0.16,
  C: 0.25,
  N: 0.25,
  O: 0.25,
  F: 0.22,
  Cl: 0.32,
  Br: 0.35,
  Li: 0.28
};

export class MoleculeMesh {
  constructor(moleculeKey) {
    this.group = new THREE.Group();
    if (!MOLECULE_DATA[moleculeKey]) {
      console.warn(`Unknown molecule "${moleculeKey}", falling back to stage1_pair.`);
    }
    this.data = MOLECULE_DATA[moleculeKey] || MOLECULE_DATA.stage1_pair;
    this.atoms = [];
    this.atomMeshes = [];
    this.bonds = [];
    this.newBonds = [];
    this.activeAnimation = null;
    this.build();
  }

  build() {
    const { atoms = [], bonds = [] } = this.data;

    // 1. Individual Atom Meshes (Ball & stick spheres)
    const sphereGeoCache = {};
    for (let i = 0; i < atoms.length; i++) {
      const a = atoms[i];
      const r = BALL_RADII[a.element] || 0.25;
      if (!sphereGeoCache[r]) {
        sphereGeoCache[r] = new THREE.SphereGeometry(r, 24, 24);
      }
      const hex = CPK_COLORS[a.element] || 0xcccccc;
      const mat = new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.25,
        metalness: 0.15
      });
      const mesh = new THREE.Mesh(sphereGeoCache[r], mat);
      mesh.position.set(a.pos[0], a.pos[1], a.pos[2]);
      this.group.add(mesh);

      this.atoms.push({
        element: a.element,
        pos: new THREE.Vector3(...a.pos),
        initialPos: new THREE.Vector3(...a.pos),
        startPos: new THREE.Vector3(...a.pos),
        radius: r,
        mesh,
        material: mat
      });
      this.atomMeshes.push(mesh);
    }

    // 2. Individual Bond Meshes (Cylinder sticks)
    const bondGeoSingle = new THREE.CylinderGeometry(0.075, 0.075, 1, 16);
    const bondGeoDouble = new THREE.CylinderGeometry(0.048, 0.048, 1, 16);

    for (let j = 0; j < bonds.length; j++) {
      const b = bonds[j];
      if (!this.atoms[b.from] || !this.atoms[b.to]) continue;
      const p1 = this.atoms[b.from].pos;
      const p2 = this.atoms[b.to].pos;

      const mat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.35,
        metalness: 0.25,
        transparent: true,
        opacity: 1.0
      });

      if (b.order === 2) {
        const mat2 = mat.clone();
        const mesh1 = new THREE.Mesh(bondGeoDouble, mat);
        const mesh2 = new THREE.Mesh(bondGeoDouble, mat2);
        this.group.add(mesh1);
        this.group.add(mesh2);

        const bondItem = {
          from: b.from,
          to: b.to,
          order: 2,
          mesh1,
          mesh2,
          material1: mat,
          material2: mat2,
          cleaved: false,
          scale: 1.0,
          doubleScale: 1.0
        };
        this.updateBondMesh(bondItem, p1, p2, 1.0);
        this.bonds.push(bondItem);
      } else {
        const mesh = new THREE.Mesh(bondGeoSingle, mat);
        this.group.add(mesh);
        const bondItem = {
          from: b.from,
          to: b.to,
          order: 1,
          mesh,
          material: mat,
          cleaved: false,
          scale: 1.0
        };
        this.updateBondMesh(bondItem, p1, p2, 1.0);
        this.bonds.push(bondItem);
      }
    }
  }

  updateBondMesh(bondItem, p1, p2, scale = 1.0) {
    if (bondItem.cleaved) {
      if (bondItem.order === 2) {
        bondItem.mesh1.visible = false;
        bondItem.mesh2.visible = false;
      } else if (bondItem.mesh) {
        bondItem.mesh.visible = false;
      }
      return;
    }

    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const up = new THREE.Vector3(0, 1, 0);
    const unitDir = len > 0.001 ? dir.clone().normalize() : new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, unitDir);

    if (bondItem.order === 2) {
      let norm = new THREE.Vector3(0, 0, 1).cross(unitDir);
      if (norm.lengthSq() < 0.01) {
        norm = new THREE.Vector3(0, 1, 0).cross(unitDir);
      }
      norm.normalize();
      const offset = norm.clone().multiplyScalar(0.08);

      bondItem.mesh1.position.copy(mid).add(offset);
      bondItem.mesh1.scale.set(1, Math.max(0.0001, len * scale), 1);
      bondItem.mesh1.quaternion.copy(quat);
      bondItem.mesh1.visible = scale > 0.005;

      const dScale = bondItem.doubleScale !== undefined ? bondItem.doubleScale : scale;
      bondItem.mesh2.position.copy(mid).sub(offset);
      bondItem.mesh2.scale.set(1, Math.max(0.0001, len * dScale), 1);
      bondItem.mesh2.quaternion.copy(quat);
      bondItem.mesh2.visible = dScale > 0.005;
    } else if (bondItem.mesh) {
      bondItem.mesh.position.copy(mid);
      bondItem.mesh.scale.set(1, Math.max(0.0001, len * scale), 1);
      bondItem.mesh.quaternion.copy(quat);
      bondItem.mesh.visible = scale > 0.005;
    }
  }

  addNewBond(fromIdx, toIdx) {
    if (
      fromIdx === undefined || toIdx === undefined ||
      !this.atoms[fromIdx] || !this.atoms[toIdx]
    ) {
      return null;
    }
    const newBondGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 16);
    const newBondMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00e676,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.0
    });
    const mesh = new THREE.Mesh(newBondGeo, newBondMat);
    this.group.add(mesh);
    const bondObj = {
      from: fromIdx,
      to: toIdx,
      scale: 0.0,
      material: newBondMat,
      mesh,
      order: 1,
      cleaved: false
    };
    this.newBonds.push(bondObj);
    return bondObj;
  }

  updateAllBonds() {
    for (const b of this.bonds) {
      if (b.cleaved) continue;
      if (!this.atoms[b.from] || !this.atoms[b.to]) continue;
      const p1 = this.atoms[b.from].pos;
      const p2 = this.atoms[b.to].pos;
      this.updateBondMesh(b, p1, p2, b.scale !== undefined ? b.scale : 1.0);
    }
    for (const nb of this.newBonds) {
      if (nb.cleaved) continue;
      if (!this.atoms[nb.from] || !this.atoms[nb.to]) continue;
      const p1 = this.atoms[nb.from].pos;
      const p2 = this.atoms[nb.to].pos;
      this.updateBondMesh(nb, p1, p2, nb.scale !== undefined ? nb.scale : 1.0);
    }
  }

  /**
   * Master animation runner. Supports both single-step reactions and multi-step reaction sequences.
   */
  animateReaction(reactionCfg, onComplete) {
    if (!reactionCfg) {
      if (onComplete) onComplete();
      return;
    }

    this.cancelAnimation();

    if (reactionCfg.steps && Array.isArray(reactionCfg.steps) && reactionCfg.steps.length > 0) {
      let stepIdx = 0;
      const runNext = () => {
        if (stepIdx >= reactionCfg.steps.length) {
          this.activeAnimation = null;
          if (onComplete) onComplete();
          return;
        }
        const currentStep = reactionCfg.steps[stepIdx++];
        this.animateReactionStep(currentStep, runNext);
      };
      runNext();
    } else {
      this.animateReactionStep(reactionCfg, () => {
        this.activeAnimation = null;
        if (onComplete) onComplete();
      });
    }
  }

  /**
   * Animate single reaction step:
   * Smoothly transitions atom positions from current state, forms new bonds,
   * handles double bond opening/closing, and smoothly departs leaving groups.
   */
  animateReactionStep(stepCfg, onComplete) {
    if (!stepCfg) {
      if (onComplete) onComplete();
      return;
    }

    // Capture starting positions for this step
    for (const a of this.atoms) {
      a.startPos = a.pos.clone();
    }

    const donorIdx = stepCfg.donorAtom;
    const acceptorIdx = stepCfg.acceptorAtom;
    const clusterLeft = stepCfg.clusterLeft || [];
    const clusterRight = stepCfg.clusterRight || [];
    const leavingBond = stepCfg.leavingBond || null;
    const targetBondLen = stepCfg.targetBondLength || 1.35;

    // Support multi-atom leaving groups
    let leavingCluster = [];
    if (stepCfg.leavingCluster && Array.isArray(stepCfg.leavingCluster)) {
      leavingCluster = [...stepCfg.leavingCluster];
    } else if (stepCfg.leavingAtom !== undefined && stepCfg.leavingAtom !== null) {
      leavingCluster = Array.isArray(stepCfg.leavingAtom) ? [...stepCfg.leavingAtom] : [stepCfg.leavingAtom];
    }

    let shiftLeft = new THREE.Vector3(0, 0, 0);
    let shiftRight = new THREE.Vector3(0, 0, 0);
    let departDir = new THREE.Vector3(1, 0, 0);

    if (donorIdx !== undefined && acceptorIdx !== undefined && this.atoms[donorIdx] && this.atoms[acceptorIdx]) {
      const pDonor0 = this.atoms[donorIdx].startPos.clone();
      const pAcceptor0 = this.atoms[acceptorIdx].startPos.clone();
      const dir = new THREE.Vector3().subVectors(pAcceptor0, pDonor0);
      const initDist = dir.length();
      const unitDir = dir.clone().normalize();
      const distToClose = Math.max(0, initDist - targetBondLen);

      if (stepCfg.approach !== false) {
        shiftLeft = unitDir.clone().multiplyScalar(distToClose * (stepCfg.leftRatio !== undefined ? stepCfg.leftRatio : 0.82));
        shiftRight = unitDir.clone().multiplyScalar(-distToClose * (stepCfg.rightRatio !== undefined ? stepCfg.rightRatio : 0.18));
      }

      if (stepCfg.departDirection) {
        departDir.set(...stepCfg.departDirection).normalize();
      } else {
        departDir.copy(unitDir);
      }
    } else if (stepCfg.departDirection) {
      departDir.set(...stepCfg.departDirection).normalize();
    }

    // Find leaving bond(s) — a step may break more than one bond, e.g. a proton
    // hopping between partners while a leaving group departs.
    const findBond = (lb) =>
      this.bonds.find(b => (b.from === lb.from && b.to === lb.to) || (b.from === lb.to && b.to === lb.from)) ||
      this.newBonds.find(b => (b.from === lb.from && b.to === lb.to) || (b.from === lb.to && b.to === lb.from));
    const leavingBondObjs = [].concat(leavingBond || []).map(findBond).filter(Boolean);
    for (const lb of leavingBondObjs) {
      // Fade from wherever the bond is now (it may already be drawn faint).
      lb.fadeFrom = (lb.material || lb.material1)?.opacity ?? 1.0;
    }
    // Transition states: a bond half-made or half-broken is drawn faint.
    const weakenObjs = [].concat(stepCfg.weakenBond || []).map(findBond).filter(Boolean);
    const completeObjs = [].concat(stepCfg.completeBond || []).map(findBond).filter(Boolean);
    const PARTIAL_OPACITY = 0.4;

    // Fragments that drift away once their bond is gone.
    const departures = [];
    if (leavingCluster.length > 0) {
      departures.push({ atoms: leavingCluster, dir: departDir, dist: stepCfg.departDistance || 3.8 });
    }
    for (const dep of stepCfg.departures || []) {
      departures.push({
        atoms: dep.atoms || [],
        dir: new THREE.Vector3(...(dep.direction || [1, 0, 0])).normalize(),
        dist: dep.distance ?? 1.5
      });
    }
    const inCluster = (idx) => clusterLeft.includes(idx) || clusterRight.includes(idx);

    // Find double bond to open (transition to single bond)
    let openBondObj = null;
    if (stepCfg.openDoubleBond) {
      openBondObj = this.bonds.find(b =>
        (b.from === stepCfg.openDoubleBond.from && b.to === stepCfg.openDoubleBond.to) ||
        (b.from === stepCfg.openDoubleBond.to && b.to === stepCfg.openDoubleBond.from)
      );
    }

    // Find double bond to close (transition back to double bond)
    let closeBondObj = null;
    if (stepCfg.closeDoubleBond) {
      closeBondObj = this.bonds.find(b =>
        (b.from === stepCfg.closeDoubleBond.from && b.to === stepCfg.closeDoubleBond.to) ||
        (b.from === stepCfg.closeDoubleBond.to && b.to === stepCfg.closeDoubleBond.from)
      );
    }

    // Create new bond if donor and acceptor are present and formBond isn't false
    let currentNewBond = null;
    if (donorIdx !== undefined && acceptorIdx !== undefined && stepCfg.formBond !== false && this.atoms[donorIdx] && this.atoms[acceptorIdx]) {
      currentNewBond = this.addNewBond(donorIdx, acceptorIdx);
      if (currentNewBond && stepCfg.partialBond) currentNewBond.partial = true;
    }

    // Geometry changes at a reacting center: a flat center puckers as a new group
    // lands on it, a crowded center flattens as a group leaves, and a backside
    // attack flips the remaining groups through like an umbrella. Each entry
    // rotates `atoms` about `center`, away from (or toward) `toward`, until their
    // angle to the center→toward axis equals `angle` (degrees). Bond lengths are
    // preserved; `carry` atoms move rigidly with the atom they hang from.
    const bends = [];
    for (const bend of stepCfg.bend || []) {
      const c = this.atoms[bend.center];
      const t = this.atoms[bend.toward];
      if (!c || !t) continue;
      const n = new THREE.Vector3().subVectors(t.startPos, c.startPos).normalize();
      for (const entry of bend.atoms || []) {
        const idx = typeof entry === 'number' ? entry : entry.atom;
        const carry = typeof entry === 'number' ? [] : (entry.carry || []);
        const a = this.atoms[idx];
        if (!a) continue;
        const off = new THREE.Vector3().subVectors(a.startPos, c.startPos);
        const len = off.length();
        if (len < 1e-6) continue;
        const theta0 = Math.acos(Math.max(-1, Math.min(1, off.dot(n) / len)));
        let axis = new THREE.Vector3().crossVectors(n, off);
        if (axis.lengthSq() < 1e-8) axis = new THREE.Vector3(0, 0, 1).cross(n);
        axis.normalize();
        bends.push({
          center: bend.center,
          idx,
          carry,
          off,
          axis,
          delta: THREE.MathUtils.degToRad(bend.angle) - theta0
        });
      }
    }

    const duration = stepCfg.duration || 1800; // ms
    const startTime = performance.now();

    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);

      // Phase 1: Approach & collision (0.0 -> 0.48)
      const approachProgress = Math.min(1.0, progress / 0.48);
      const easeApproach = easeInOutCubic(approachProgress);

      // Leaving atoms ride along with their cluster during the approach so they
      // never jump at the phase boundary; they peel away in phase 2.
      for (const idx of clusterLeft) {
        if (!this.atoms[idx]) continue;
        this.atoms[idx].pos.copy(this.atoms[idx].startPos).addScaledVector(shiftLeft, easeApproach);
        this.atoms[idx].mesh.position.copy(this.atoms[idx].pos);
      }

      for (const idx of clusterRight) {
        if (!this.atoms[idx]) continue;
        this.atoms[idx].pos.copy(this.atoms[idx].startPos).addScaledVector(shiftRight, easeApproach);
        this.atoms[idx].mesh.position.copy(this.atoms[idx].pos);
      }

      // Phase 2: Bond Formation, Double Bond Shift, and Leaving Group Departure (0.48 -> 1.0)
      if (progress >= 0.48) {
        const bondProgress = Math.min(1.0, (progress - 0.48) / 0.25);
        const easeBond = easeOutQuad(bondProgress);

        if (currentNewBond) {
          currentNewBond.scale = easeBond;
          const maxOpacity = currentNewBond.partial ? PARTIAL_OPACITY : 1.0;
          currentNewBond.material.opacity = Math.min(maxOpacity, easeBond * 1.2);
          const glowPulse = Math.max(0.25, 0.85 * (1 - (progress - 0.48) / 0.52));
          currentNewBond.material.emissiveIntensity = glowPulse;
        }

        // Open double bond (second cylinder smoothly disappears)
        if (openBondObj && openBondObj.order === 2) {
          openBondObj.doubleScale = Math.max(0, 1.0 - easeBond);
          if (openBondObj.material2) {
            openBondObj.material2.opacity = Math.max(0, 1.0 - easeBond);
          }
        }

        // Close/reform double bond (second cylinder reappears)
        if (closeBondObj && closeBondObj.order === 2) {
          closeBondObj.doubleScale = easeBond;
          if (closeBondObj.material2) {
            closeBondObj.material2.opacity = easeBond;
          }
        }

        // Handle Ring Opening relaxation (Stage 17)
        if (stepCfg.ringOpen) {
          const swingAtom = stepCfg.ringOpen.swingAtom;
          const swingOffset = stepCfg.ringOpen.swingOffset || [0.3, 0.9, 0];
          const easeSwing = easeInOutCubic(Math.min(1.0, (progress - 0.48) / 0.52));
          if (this.atoms[swingAtom]) {
            const basePos = this.atoms[swingAtom].startPos.clone().addScaledVector(shiftRight, 1.0);
            this.atoms[swingAtom].pos.copy(basePos).add(new THREE.Vector3(...swingOffset).multiplyScalar(easeSwing));
            this.atoms[swingAtom].mesh.position.copy(this.atoms[swingAtom].pos);
          }
        }

        if (bends.length > 0) {
          const easeBend = easeInOutCubic(Math.min(1.0, (progress - 0.48) / 0.52));
          const rotated = new THREE.Vector3();
          for (const b of bends) {
            rotated.copy(b.off).applyAxisAngle(b.axis, b.delta * easeBend);
            const centerPos = this.atoms[b.center].pos;
            const atom = this.atoms[b.idx];
            atom.pos.copy(centerPos).add(rotated);
            atom.mesh.position.copy(atom.pos);
            // Carried atoms keep their offset from the atom they hang on.
            const moved = new THREE.Vector3().subVectors(atom.pos, atom.startPos);
            for (const cIdx of b.carry) {
              const ca = this.atoms[cIdx];
              if (!ca) continue;
              ca.pos.copy(ca.startPos).add(moved);
              ca.mesh.position.copy(ca.pos);
            }
          }
        }

        // Cleave leaving bond and smoothly depart leaving group cluster
        for (const wb of weakenObjs) {
          const o = 1.0 - (1.0 - PARTIAL_OPACITY) * easeBond;
          if (wb.material) wb.material.opacity = o;
          if (wb.material1) wb.material1.opacity = o;
          wb.partial = true;
        }
        const breakProgress = Math.min(1.0, (progress - 0.48) / 0.16);
        for (const cb of completeObjs) {
          // Full strength only once the departing bond is gone.
          cb.partial = breakProgress < 1.0;
          if (cb.material) cb.material.opacity = PARTIAL_OPACITY + (1.0 - PARTIAL_OPACITY) * easeBond;
        }
        for (const lb of leavingBondObjs) {
          const o = Math.max(0, lb.fadeFrom * (1.0 - breakProgress));
          if (lb.material) lb.material.opacity = o;
          if (lb.material1) lb.material1.opacity = o;
          if (lb.material2) lb.material2.opacity = o;
          lb.scale = Math.max(0.001, 1.0 - breakProgress);
          if (breakProgress >= 1.0) {
            lb.cleaved = true;
            if (lb.mesh) lb.mesh.visible = false;
            if (lb.mesh1) lb.mesh1.visible = false;
            if (lb.mesh2) lb.mesh2.visible = false;
          }
        }

        if (departures.length > 0) {
          const departProgress = Math.min(1.0, (progress - 0.48) / 0.52);
          const easeDepart = easeInOutCubic(departProgress);
          for (const dep of departures) {
            const departDist = easeDepart * dep.dist;
            for (const lAtomIdx of dep.atoms) {
              const atom = this.atoms[lAtomIdx];
              if (!atom) continue;
              // Cluster atoms were already placed (and bent) this frame.
              const base = inCluster(lAtomIdx) ? atom.pos.clone() : atom.startPos.clone();
              atom.pos.copy(base).addScaledVector(dep.dir, departDist);
              atom.mesh.position.copy(atom.pos);
              if (atom.material) {
                atom.material.emissive = new THREE.Color(0x38b000);
                atom.material.emissiveIntensity = Math.max(0, 0.5 * (1 - easeDepart));
              }
            }
          }
        }
      }

      this.updateAllBonds();

      if (progress < 1.0) {
        this.activeAnimation = requestAnimationFrame(step);
      } else {
        this.activeAnimation = null;
        if (onComplete) onComplete();
      }
    };

    this.activeAnimation = requestAnimationFrame(step);
  }

  cancelAnimation() {
    if (this.activeAnimation) {
      cancelAnimationFrame(this.activeAnimation);
      this.activeAnimation = null;
    }
    for (const nb of this.newBonds) {
      this.group.remove(nb.mesh);
      nb.mesh.geometry?.dispose();
      nb.material?.dispose();
    }
    this.newBonds = [];
  }

  dispose() {
    this.cancelAnimation();
    for (const a of this.atoms) {
      a.mesh.geometry?.dispose();
      a.material?.dispose();
    }
    for (const b of this.bonds) {
      if (b.order === 2) {
        b.mesh1.geometry?.dispose();
        b.material1?.dispose();
        b.mesh2.geometry?.dispose();
        b.material2?.dispose();
      } else {
        b.mesh?.geometry?.dispose();
        b.material?.dispose();
      }
    }
    this.atoms = [];
    this.bonds = [];
  }
}
