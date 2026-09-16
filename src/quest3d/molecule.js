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
      { from: 8, to: 9, order: 2 },
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
      { from: 2, to: 3, order: 2 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7, order: 2 },
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
  },

  // Stage 8: 3 Molecules (Hydroxide Base + Acid + Methane Spectator)
  stage8_trio: {
    atoms: [
      // Molecule 1: Hydroxide ion (OH-)
      { element: 'O', pos: [-2.8, 0.6, 0], scale: 0.6 },
      { element: 'H', pos: [-3.5, 0.4, 0], scale: 0.35 },
      // Molecule 2: Hydronium (H3O+)
      { element: 'O', pos: [0.6, 0.2, 0], scale: 0.56 },
      { element: 'H', pos: [-0.2, 0.4, 0], scale: 0.35 },
      { element: 'H', pos: [0.9, 0.9, 0], scale: 0.32 },
      { element: 'H', pos: [0.9, -0.5, 0], scale: 0.32 },
      // Molecule 3: Methane spectator (CH4)
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

  // Stage 9: 3 Molecules (Strong Nucleophile + Weak Nucleophile + Carbocation Target)
  stage9_trio: {
    atoms: [
      // Molecule 1: Ethoxide (Strong nucleophile CH3-CH2-O-)
      { element: 'C', pos: [-3.6, 1.4, 0], scale: 0.48 },
      { element: 'C', pos: [-2.4, 1.2, 0], scale: 0.5 },
      { element: 'O', pos: [-1.4, 1.6, 0], scale: 0.6 },
      { element: 'H', pos: [-4.0, 0.8, 0], scale: 0.3 },
      { element: 'H', pos: [-3.8, 2.2, 0], scale: 0.3 },
      // Molecule 2: Methanol (Weak neutral nucleophile CH3-OH)
      { element: 'C', pos: [-3.2, -1.4, 0], scale: 0.48 },
      { element: 'O', pos: [-2.0, -1.0, 0], scale: 0.54 },
      { element: 'H', pos: [-1.6, -1.7, 0], scale: 0.3 },
      { element: 'H', pos: [-3.6, -2.0, 0], scale: 0.3 },
      // Molecule 3: Ethyl carbocation (CH3-CH2+)
      { element: 'C', pos: [1.5, 0, 0], scale: 0.54 },
      { element: 'C', pos: [2.8, -0.2, 0], scale: 0.48 },
      { element: 'H', pos: [1.1, 0.7, 0], scale: 0.32 },
      { element: 'H', pos: [1.1, -0.7, 0], scale: 0.32 },
      { element: 'H', pos: [3.2, 0.6, 0], scale: 0.3 },
      { element: 'H', pos: [3.2, -1.0, 0], scale: 0.3 }
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

  // Stage 10: 3 Molecules (Ammonia Base + Methanol + Bromomethane)
  stage10_trio: {
    atoms: [
      // Molecule 1: Ammonia base (NH3)
      { element: 'N', pos: [-2.8, 1.2, 0], scale: 0.58 },
      { element: 'H', pos: [-3.4, 1.6, 0.4], scale: 0.32 },
      { element: 'H', pos: [-3.4, 1.6, -0.4], scale: 0.32 },
      { element: 'H', pos: [-2.4, 1.8, 0], scale: 0.32 },
      // Molecule 2: Methanol (CH3OH)
      { element: 'C', pos: [-0.4, 0.8, 0], scale: 0.5 },
      { element: 'O', pos: [0.6, 0.2, 0], scale: 0.56 },
      { element: 'H', pos: [-0.2, 1.6, 0], scale: 0.3 },
      { element: 'H', pos: [0.3, -0.6, 0], scale: 0.35 }, // Acidic proton
      // Molecule 3: Bromomethane (CH3Br)
      { element: 'C', pos: [2.5, -0.8, 0], scale: 0.52 },
      { element: 'Br', pos: [3.8, -1.2, 0], scale: 0.65 },
      { element: 'H', pos: [2.1, -1.4, 0.4], scale: 0.3 },
      { element: 'H', pos: [2.1, -1.4, -0.4], scale: 0.3 },
      { element: 'H', pos: [2.5, 0.0, 0], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 4, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 7 },
      { from: 8, to: 9 },
      { from: 8, to: 10 },
      { from: 8, to: 11 },
      { from: 8, to: 12 }
    ],
    regions: [
      { id: 'red_base', pos: [-2.2, 1.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_proton', pos: [0.3, -0.6, 0], type: 'blue', intensity: 'extreme', scale: 0.8 },
      { id: 'blue_substrate', pos: [2.2, -0.6, 0], type: 'blue', intensity: 'moderate', scale: 0.65 }
    ]
  },

  // Stage 11: Two-Step Substitution Cascade (OH- + CH3Cl + Halide Scavenger)
  stage11_pair: {
    atoms: [
      // Left: OH-
      { element: 'O', pos: [-2.2, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-2.9, -0.3, 0], scale: 0.35 },
      // Right: CH3-Cl
      { element: 'C', pos: [1.6, 0, 0], scale: 0.52 },
      { element: 'Cl', pos: [3.1, 0, 0], scale: 0.65 },
      { element: 'H', pos: [1.4, 0.9, 0.4], scale: 0.32 },
      { element: 'H', pos: [1.4, -0.9, 0.4], scale: 0.32 },
      { element: 'H', pos: [1.3, 0, -0.9], scale: 0.32 },
      // Scavenger
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

  // Stage 12: Carbonyl Addition + Proton Capture (Methoxide + Formaldehyde + Proton Donor)
  stage12_pair: {
    atoms: [
      // Left: Methoxide (CH3O-)
      { element: 'C', pos: [-3.2, 0, 0], scale: 0.5 },
      { element: 'O', pos: [-2.0, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-3.6, 0.6, 0], scale: 0.3 },
      { element: 'H', pos: [-3.6, -0.6, 0], scale: 0.3 },
      // Right: Formaldehyde (H2C=O)
      { element: 'C', pos: [1.6, 0, 0], scale: 0.54 },
      { element: 'O', pos: [1.6, 1.3, 0], scale: 0.58 },
      { element: 'H', pos: [1.0, -0.7, 0], scale: 0.32 },
      { element: 'H', pos: [2.2, -0.7, 0], scale: 0.32 },
      // Acid donor
      { element: 'H', pos: [2.1, 2.0, 0], scale: 0.35 },
      { element: 'O', pos: [2.9, 2.4, 0], scale: 0.56 },
      { element: 'H', pos: [3.5, 2.3, 0], scale: 0.3 }
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
      { id: 'red_o', pos: [1.6, 1.5, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_h', pos: [2.1, 2.0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 13: Proton Transfer Relay (Two consecutive acid-base steps)
  stage13_pair: {
    atoms: [
      // Left: Water 1
      { element: 'O', pos: [-2.4, 0.4, 0], scale: 0.58 },
      { element: 'H', pos: [-3.0, 0.8, 0], scale: 0.32 },
      { element: 'H', pos: [-3.0, -0.1, 0], scale: 0.32 },
      // Acid 1
      { element: 'H', pos: [-0.8, 0.4, 0], scale: 0.35 },
      { element: 'O', pos: [0.3, 0.2, 0], scale: 0.58 },
      { element: 'H', pos: [0.7, 0.8, 0], scale: 0.32 },
      // Water 2
      { element: 'O', pos: [1.8, -0.6, 0], scale: 0.58 },
      { element: 'H', pos: [1.3, -1.2, 0], scale: 0.32 },
      { element: 'H', pos: [2.5, -1.0, 0], scale: 0.32 },
      // Acid 2
      { element: 'H', pos: [3.1, -0.4, 0], scale: 0.35 },
      { element: 'O', pos: [3.9, -0.6, 0], scale: 0.58 },
      { element: 'H', pos: [4.4, -0.2, 0], scale: 0.32 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 6, to: 7 },
      { from: 6, to: 8 },
      { from: 9, to: 10 },
      { from: 10, to: 11 }
    ],
    regions: [
      { id: 'red_base1', pos: [-2.0, 0.4, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_h1', pos: [-0.8, 0.4, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_base2', pos: [1.8, -0.6, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_h2', pos: [3.1, -0.4, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 14: Acyl Substitution + Halide Capture (Methoxide + Acetyl Chloride + Scavenger)
  stage14_pair: {
    atoms: [
      // Left: Methoxide (CH3O-)
      { element: 'C', pos: [-3.2, 0, 0], scale: 0.5 },
      { element: 'O', pos: [-2.0, 0, 0], scale: 0.6 },
      { element: 'H', pos: [-3.6, 0.7, 0], scale: 0.3 },
      { element: 'H', pos: [-3.6, -0.7, 0], scale: 0.3 },
      // Right: Acetyl chloride
      { element: 'C', pos: [1.5, 0, 0], scale: 0.54 },
      { element: 'O', pos: [1.5, 1.3, 0], scale: 0.58 },
      { element: 'Cl', pos: [3.0, -0.4, 0], scale: 0.62 },
      { element: 'C', pos: [0.6, -1.0, 0], scale: 0.5 },
      { element: 'H', pos: [0.9, -1.8, 0], scale: 0.3 },
      { element: 'H', pos: [0.1, -0.8, 0.7], scale: 0.3 },
      // Halide Scavenger
      { element: 'H', pos: [4.0, 0.3, 0], scale: 0.35 }
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
      { id: 'red_cl', pos: [3.0, -0.4, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_scavenger', pos: [4.0, 0.3, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 15: Acid-Catalyzed Activation (3 Molecules: Acid H+ + Ketone + H2O Nucleophile)
  stage15_trio: {
    atoms: [
      // Molecule 1: Water nucleophile
      { element: 'O', pos: [-2.8, -0.5, 0], scale: 0.58 },
      { element: 'H', pos: [-3.4, -0.2, 0], scale: 0.32 },
      { element: 'H', pos: [-3.3, -1.1, 0], scale: 0.32 },
      // Molecule 2: Acetone
      { element: 'C', pos: [0.2, 0, 0], scale: 0.54 },
      { element: 'O', pos: [0.2, 1.3, 0], scale: 0.58 },
      { element: 'C', pos: [-0.6, -1.1, 0], scale: 0.48 },
      { element: 'C', pos: [1.4, -0.5, 0], scale: 0.48 },
      // Molecule 3: Acid donor
      { element: 'O', pos: [2.4, 1.5, 0], scale: 0.56 },
      { element: 'H', pos: [1.6, 1.8, 0], scale: 0.35 },
      { element: 'H', pos: [3.1, 1.7, 0], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 3, to: 4, order: 2 },
      { from: 3, to: 5 },
      { from: 3, to: 6 },
      { from: 7, to: 8 },
      { from: 7, to: 9 }
    ],
    regions: [
      { id: 'red_o_carbonyl', pos: [0.2, 1.5, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_proton', pos: [1.6, 1.8, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_water', pos: [-2.1, -0.5, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_activated_c', pos: [0.0, 0.0, 0], type: 'blue', intensity: 'extreme', scale: 0.9 }
    ]
  },

  // Stage 16: Transesterification Cascade (Hydroxide + Ester + Proton Donor)
  stage16_trio: {
    atoms: [
      // Hydroxide
      { element: 'O', pos: [-2.8, 0.4, 0], scale: 0.6 },
      { element: 'H', pos: [-3.4, 0.1, 0], scale: 0.35 },
      // Ester
      { element: 'C', pos: [0.0, 0.0, 0], scale: 0.54 },
      { element: 'O', pos: [0.0, 1.3, 0], scale: 0.58 },
      { element: 'C', pos: [-1.0, -0.9, 0], scale: 0.48 },
      { element: 'O', pos: [1.2, -0.3, 0], scale: 0.56 },
      // Alkyl group
      { element: 'C', pos: [2.3, -0.8, 0], scale: 0.48 },
      { element: 'C', pos: [3.4, -0.2, 0], scale: 0.48 },
      // Proton donor
      { element: 'H', pos: [2.8, 0.6, 0], scale: 0.35 },
      { element: 'O', pos: [3.6, 0.8, 0], scale: 0.56 },
      { element: 'H', pos: [4.2, 0.5, 0], scale: 0.3 }
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
      { id: 'red_ethoxide', pos: [1.8, -0.4, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_proton', pos: [2.8, 0.6, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 17: Epoxide Ring Opening + Proton Quench
  stage17_pair: {
    atoms: [
      // Hydroxide
      { element: 'O', pos: [-2.8, 0.2, 0], scale: 0.6 },
      { element: 'H', pos: [-3.5, 0.0, 0], scale: 0.35 },
      // Epoxide 3-ring
      { element: 'C', pos: [0.8, -0.6, 0], scale: 0.52 },
      { element: 'C', pos: [2.2, -0.6, 0], scale: 0.52 },
      { element: 'O', pos: [1.5, 0.6, 0], scale: 0.58 },
      { element: 'H', pos: [0.4, -1.2, 0], scale: 0.3 },
      { element: 'C', pos: [3.2, -1.3, 0], scale: 0.48 },
      // Proton donor
      { element: 'H', pos: [2.4, 1.4, 0], scale: 0.35 },
      { element: 'O', pos: [3.2, 1.7, 0], scale: 0.56 },
      { element: 'H', pos: [3.8, 1.5, 0], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 3, to: 6 },
      { from: 7, to: 8 },
      { from: 8, to: 9 }
    ],
    regions: [
      { id: 'red_nu', pos: [-2.1, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_c_ring', pos: [0.7, -0.5, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_o_ring', pos: [1.5, 0.6, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_proton', pos: [2.4, 1.4, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 18: Enolate Formation & Alkylation
  stage18_pair: {
    atoms: [
      // Base (Amide ion)
      { element: 'N', pos: [-3.2, 1.2, 0], scale: 0.58 },
      { element: 'H', pos: [-3.8, 1.5, 0], scale: 0.32 },
      // Carbonyl compound
      { element: 'C', pos: [-0.4, 0.0, 0], scale: 0.5 },
      { element: 'H', pos: [-0.8, 1.0, 0], scale: 0.35 },
      { element: 'C', pos: [0.8, 0.0, 0], scale: 0.54 },
      { element: 'O', pos: [1.2, 1.1, 0], scale: 0.58 },
      // Alkyl halide
      { element: 'C', pos: [2.4, -0.8, 0], scale: 0.5 },
      { element: 'Br', pos: [3.6, -1.2, 0], scale: 0.65 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 4, to: 5, order: 2 },
      { from: 6, to: 7 }
    ],
    regions: [
      { id: 'red_base', pos: [-2.5, 1.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_h_alpha', pos: [-0.8, 1.0, 0], type: 'blue', intensity: 'extreme', scale: 0.8 },
      { id: 'c_alpha', pos: [-0.2, -0.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_target', pos: [2.3, -0.8, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 19: S_N1 Stepwise Substitution (Halide Scavenger + t-Butyl Chloride + Water)
  stage19_pair: {
    atoms: [
      // t-Butyl chloride
      { element: 'C', pos: [0.8, 0.0, 0], scale: 0.54 },
      { element: 'Cl', pos: [2.8, 0.0, 0], scale: 0.65 },
      { element: 'C', pos: [0.4, 1.3, 0], scale: 0.48 },
      { element: 'C', pos: [0.4, -1.3, 0], scale: 0.48 },
      { element: 'C', pos: [0.2, 0.0, 1.3], scale: 0.48 },
      // Water
      { element: 'O', pos: [-2.8, 0.0, 0], scale: 0.58 },
      { element: 'H', pos: [-3.4, 0.5, 0], scale: 0.32 },
      { element: 'H', pos: [-3.4, -0.5, 0], scale: 0.32 },
      // Halide Scavenger
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
      { id: 'red_cl', pos: [2.8, 0.0, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_scavenger', pos: [4.0, 0.0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_water', pos: [-2.1, 0.0, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_carbocation', pos: [0.8, 0.0, 0], type: 'blue', intensity: 'extreme', scale: 0.9 }
    ]
  },

  // Stage 20: Grand Master Synthesis Cascade (3 Molecules)
  stage20_multi: {
    atoms: [
      // Catalyst acid
      { element: 'O', pos: [-3.2, 1.4, 0], scale: 0.56 },
      { element: 'H', pos: [-2.5, 1.5, 0], scale: 0.35 },
      // Core nucleophile
      { element: 'N', pos: [-2.4, -0.8, 0], scale: 0.58 },
      { element: 'C', pos: [-3.4, -0.8, 0], scale: 0.48 },
      // Target scaffold with leaving group
      { element: 'C', pos: [0.5, 0.0, 0], scale: 0.54 },
      { element: 'O', pos: [0.5, 1.3, 0], scale: 0.58 },
      { element: 'C', pos: [-0.4, -0.8, 0], scale: 0.48 },
      { element: 'Br', pos: [2.4, -0.5, 0], scale: 0.65 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 4, to: 5, order: 2 },
      { from: 4, to: 6 },
      { from: 4, to: 7 }
    ],
    regions: [
      { id: 'red_cat', pos: [-2.7, 1.4, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_proton', pos: [-1.8, 1.5, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'red_core', pos: [-1.9, -0.8, 0], type: 'red', intensity: 'extreme', scale: 0.95 },
      { id: 'blue_c_scaffold', pos: [0.4, 0.0, 0], type: 'blue', intensity: 'extreme', scale: 0.9 },
      { id: 'bond_leave', pos: [1.4, -0.3, 0], type: 'blue', intensity: 'moderate', scale: 0.7 },
      { id: 'red_depart', pos: [2.6, -0.5, 0], type: 'red', intensity: 'extreme', scale: 0.85 }
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

    // Find leaving bond if any
    let leavingBondObj = null;
    if (leavingBond) {
      leavingBondObj = this.bonds.find(b =>
        (b.from === leavingBond.from && b.to === leavingBond.to) ||
        (b.from === leavingBond.to && b.to === leavingBond.from)
      );
      if (!leavingBondObj) {
        leavingBondObj = this.newBonds.find(b =>
          (b.from === leavingBond.from && b.to === leavingBond.to) ||
          (b.from === leavingBond.to && b.to === leavingBond.from)
        );
      }
    }

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

      for (const idx of clusterLeft) {
        if (!this.atoms[idx] || leavingCluster.includes(idx)) continue;
        this.atoms[idx].pos.copy(this.atoms[idx].startPos).addScaledVector(shiftLeft, easeApproach);
        this.atoms[idx].mesh.position.copy(this.atoms[idx].pos);
      }

      for (const idx of clusterRight) {
        if (!this.atoms[idx] || leavingCluster.includes(idx)) continue;
        this.atoms[idx].pos.copy(this.atoms[idx].startPos).addScaledVector(shiftRight, easeApproach);
        this.atoms[idx].mesh.position.copy(this.atoms[idx].pos);
      }

      // Phase 2: Bond Formation, Double Bond Shift, and Leaving Group Departure (0.48 -> 1.0)
      if (progress >= 0.48) {
        const bondProgress = Math.min(1.0, (progress - 0.48) / 0.25);
        const easeBond = easeOutQuad(bondProgress);

        if (currentNewBond) {
          currentNewBond.scale = easeBond;
          currentNewBond.material.opacity = Math.min(1.0, easeBond * 1.2);
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

        // Cleave leaving bond and smoothly depart leaving group cluster
        if (leavingBondObj) {
          const breakProgress = Math.min(1.0, (progress - 0.48) / 0.16);
          if (leavingBondObj.material) leavingBondObj.material.opacity = Math.max(0, 1.0 - breakProgress);
          if (leavingBondObj.material1) leavingBondObj.material1.opacity = Math.max(0, 1.0 - breakProgress);
          if (leavingBondObj.material2) leavingBondObj.material2.opacity = Math.max(0, 1.0 - breakProgress);
          leavingBondObj.scale = Math.max(0.001, 1.0 - breakProgress);
          if (breakProgress >= 1.0) {
            leavingBondObj.cleaved = true;
            if (leavingBondObj.mesh) leavingBondObj.mesh.visible = false;
            if (leavingBondObj.mesh1) leavingBondObj.mesh1.visible = false;
            if (leavingBondObj.mesh2) leavingBondObj.mesh2.visible = false;
          }
        }

        if (leavingCluster.length > 0) {
          const departProgress = Math.min(1.0, (progress - 0.48) / 0.52);
          const easeDepart = easeInOutCubic(departProgress);
          const departDist = easeDepart * (stepCfg.departDistance || 3.8);

          for (const lAtomIdx of leavingCluster) {
            if (!this.atoms[lAtomIdx]) continue;
            const isLeft = clusterLeft.includes(lAtomIdx);
            const clusterShift = isLeft ? shiftLeft : shiftRight;
            const baseLeavePos = this.atoms[lAtomIdx].startPos.clone().addScaledVector(clusterShift, 1.0);
            this.atoms[lAtomIdx].pos.copy(baseLeavePos).addScaledVector(departDir, departDist);
            this.atoms[lAtomIdx].mesh.position.copy(this.atoms[lAtomIdx].pos);

            if (this.atoms[lAtomIdx].material) {
              this.atoms[lAtomIdx].material.emissive = new THREE.Color(0x38b000);
              this.atoms[lAtomIdx].material.emissiveIntensity = Math.max(0, 0.5 * (1 - easeDepart));
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
