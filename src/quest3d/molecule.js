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

  // Stage 11: Multi-Step S_N2 (Simultaneous attack and departure)
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
      { element: 'H', pos: [1.3, 0, -0.9], scale: 0.32 }
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
      { id: 'bond_c_cl', pos: [2.2, 0, 0], type: 'blue', intensity: 'moderate', scale: 0.65 },
      { id: 'cl_leave', pos: [3.3, 0, 0], type: 'red', intensity: 'moderate', scale: 0.75 }
    ]
  },

  // Stage 12: Carbonyl Addition (Methoxide + Formaldehyde)
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
      { element: 'H', pos: [2.2, -0.7, 0], scale: 0.32 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 4, to: 5 },
      { from: 4, to: 6 },
      { from: 4, to: 7 }
    ],
    regions: [
      { id: 'red_nu', pos: [-1.4, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_c', pos: [1.2, 0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'bond_c_o', pos: [1.5, 0.7, 0], type: 'blue', intensity: 'moderate', scale: 0.65 },
      { id: 'red_o', pos: [1.6, 1.6, 0], type: 'red', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 13: Proton Transfer Relay (H2O + H3O+)
  stage13_pair: {
    atoms: [
      // Left: Water (H2O)
      { element: 'O', pos: [-2.2, 0, 0], scale: 0.58 },
      { element: 'H', pos: [-2.8, 0.5, 0], scale: 0.32 },
      { element: 'H', pos: [-2.8, -0.5, 0], scale: 0.32 },
      // Right: Acid proton and conjugate
      { element: 'H', pos: [0.3, 0.3, 0], scale: 0.35 },
      { element: 'O', pos: [1.6, 0, 0], scale: 0.58 },
      { element: 'H', pos: [2.1, 0.6, 0], scale: 0.32 },
      { element: 'H', pos: [2.1, -0.6, 0], scale: 0.32 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 4, to: 6 }
    ],
    regions: [
      { id: 'red_base', pos: [-1.5, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_h', pos: [0.3, 0.3, 0], type: 'blue', intensity: 'extreme', scale: 0.8 },
      { id: 'bond_o_h', pos: [0.9, 0.2, 0], type: 'blue', intensity: 'moderate', scale: 0.65 },
      { id: 'red_o_acid', pos: [1.7, 0, 0], type: 'red', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 14: Acyl Substitution (Methoxide + Acetyl Chloride)
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
      { element: 'H', pos: [0.1, -0.8, 0.7], scale: 0.3 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 4, to: 5 },
      { from: 4, to: 6 },
      { from: 4, to: 7 },
      { from: 7, to: 8 },
      { from: 7, to: 9 }
    ],
    regions: [
      { id: 'red_nu', pos: [-1.4, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.9 },
      { id: 'blue_c', pos: [1.2, 0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'bond_c_o', pos: [1.4, 0.6, 0], type: 'blue', intensity: 'moderate', scale: 0.65 },
      { id: 'red_o', pos: [1.5, 1.5, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'cl_leave', pos: [3.1, -0.4, 0], type: 'blue', intensity: 'moderate', scale: 0.7 }
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
      { from: 3, to: 4 },
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

  // Stage 16: Transesterification Step (3 Molecules: Hydroxide + Ester + Leaving group)
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
      { element: 'C', pos: [3.4, -0.2, 0], scale: 0.48 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7 }
    ],
    regions: [
      { id: 'red_nu', pos: [-2.2, 0.4, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_c', pos: [0.0, 0.0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'bond_c_o', pos: [0.0, 0.7, 0], type: 'blue', intensity: 'moderate', scale: 0.65 },
      { id: 'red_o', pos: [0.0, 1.5, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_ethoxide', pos: [1.8, -0.4, 0], type: 'blue', intensity: 'moderate', scale: 0.7 }
    ]
  },

  // Stage 17: Epoxide Ring Opening
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
      { element: 'C', pos: [3.2, -1.3, 0], scale: 0.48 }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 3, to: 6 }
    ],
    regions: [
      { id: 'red_nu', pos: [-2.1, 0.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_c_ring', pos: [0.7, -0.5, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'bond_ring', pos: [1.1, 0.1, 0], type: 'blue', intensity: 'moderate', scale: 0.65 },
      { id: 'red_o_ring', pos: [1.6, 0.8, 0], type: 'red', intensity: 'extreme', scale: 0.85 }
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
      { from: 4, to: 5 },
      { from: 6, to: 7 }
    ],
    regions: [
      { id: 'red_base', pos: [-2.5, 1.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_h_alpha', pos: [-0.8, 1.0, 0], type: 'blue', intensity: 'extreme', scale: 0.8 },
      { id: 'bond_c_h', pos: [-0.5, 0.6, 0], type: 'blue', intensity: 'moderate', scale: 0.65 },
      { id: 'blue_c_carbonyl', pos: [0.7, 0.0, 0], type: 'blue', intensity: 'extreme', scale: 0.85 },
      { id: 'c_alpha', pos: [-0.2, -0.2, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
      { id: 'blue_target', pos: [2.3, -0.8, 0], type: 'blue', intensity: 'extreme', scale: 0.85 }
    ]
  },

  // Stage 19: S_N1 Carbocation Formation & Capture
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
      { element: 'H', pos: [-3.4, -0.5, 0], scale: 0.32 }
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
      { id: 'bond_c_cl', pos: [1.8, 0.0, 0], type: 'blue', intensity: 'moderate', scale: 0.7 },
      { id: 'red_cl', pos: [2.9, 0.0, 0], type: 'red', intensity: 'extreme', scale: 0.85 },
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
      { from: 4, to: 5 },
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
    this.data = MOLECULE_DATA[moleculeKey] || MOLECULE_DATA.stage1_pair;
    this.atoms = [];
    this.atomMeshes = [];
    this.bonds = [];
    this.newBondMesh = null;
    this.newBondData = null;
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
        radius: r,
        mesh,
        material: mat
      });
      this.atomMeshes.push(mesh);
    }

    // 2. Individual Bond Meshes (Cylinder sticks)
    const bondGeo = new THREE.CylinderGeometry(0.075, 0.075, 1, 16);
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
      const mesh = new THREE.Mesh(bondGeo, mat);
      this.updateBondMesh(mesh, p1, p2, 1.0);
      this.group.add(mesh);

      this.bonds.push({
        from: b.from,
        to: b.to,
        mesh,
        material: mat,
        cleaved: false,
        scale: 1.0
      });
    }
  }

  updateBondMesh(mesh, p1, p2, scale = 1.0) {
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    mesh.position.copy(mid);
    mesh.scale.set(1, Math.max(0.0001, len * scale), 1);
    const up = new THREE.Vector3(0, 1, 0);
    if (len > 0.001) {
      mesh.quaternion.setFromUnitVectors(up, dir.normalize());
    }
  }

  updateAllBonds() {
    for (const b of this.bonds) {
      if (b.cleaved) continue;
      const p1 = this.atoms[b.from].pos;
      const p2 = this.atoms[b.to].pos;
      this.updateBondMesh(b.mesh, p1, p2, b.scale !== undefined ? b.scale : 1.0);
    }
    if (this.newBondMesh && this.newBondData) {
      const p1 = this.atoms[this.newBondData.from].pos;
      const p2 = this.atoms[this.newBondData.to].pos;
      this.updateBondMesh(this.newBondMesh, p1, p2, this.newBondData.scale !== undefined ? this.newBondData.scale : 1.0);
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

    if (reactionCfg.steps && Array.isArray(reactionCfg.steps) && reactionCfg.steps.length > 0) {
      let stepIdx = 0;
      const runNext = () => {
        if (stepIdx >= reactionCfg.steps.length) {
          if (onComplete) onComplete();
          return;
        }
        const currentStep = reactionCfg.steps[stepIdx++];
        this.animateReactionStep(currentStep, runNext);
      };
      runNext();
    } else {
      this.animateReactionStep(reactionCfg, onComplete);
    }
  }

  /**
   * Animate single reaction step:
   * 1. Approach: Left cluster glides smoothly toward right cluster along reaction vector
   * 2. Bond formation: Covalent bond snaps into place between donor and acceptor
   * 3. Octet preservation: If atom has 4 bonds, leaving group cleaves and departs
   */
  animateReactionStep(stepCfg, onComplete) {
    if (!stepCfg) {
      if (onComplete) onComplete();
      return;
    }

    this.cancelAnimation();

    const donorIdx = stepCfg.donorAtom;
    const acceptorIdx = stepCfg.acceptorAtom;
    const clusterLeft = stepCfg.clusterLeft || [];
    const clusterRight = stepCfg.clusterRight || [];
    const leavingBond = stepCfg.leavingBond || null;
    const leavingAtom = stepCfg.leavingAtom !== undefined ? stepCfg.leavingAtom : null;
    const targetBondLen = stepCfg.targetBondLength || 1.35;

    let shiftLeft = new THREE.Vector3(0, 0, 0);
    let shiftRight = new THREE.Vector3(0, 0, 0);
    let departDir = new THREE.Vector3(1, 0, 0);

    if (donorIdx !== undefined && acceptorIdx !== undefined && this.atoms[donorIdx] && this.atoms[acceptorIdx]) {
      const pDonor0 = this.atoms[donorIdx].initialPos.clone();
      const pAcceptor0 = this.atoms[acceptorIdx].initialPos.clone();
      const dir = new THREE.Vector3().subVectors(pAcceptor0, pDonor0);
      const initDist = dir.length();
      const unitDir = dir.clone().normalize();
      const distToClose = Math.max(0, initDist - targetBondLen);
      shiftLeft = unitDir.clone().multiplyScalar(distToClose * 0.82);
      shiftRight = unitDir.clone().multiplyScalar(-distToClose * 0.18);

      if (stepCfg.departDirection) {
        departDir.set(...stepCfg.departDirection).normalize();
      } else {
        departDir.copy(unitDir);
      }
    }

    // Find leaving bond if any
    let leavingBondObj = null;
    if (leavingBond) {
      leavingBondObj = this.bonds.find(b =>
        (b.from === leavingBond.from && b.to === leavingBond.to) ||
        (b.from === leavingBond.to && b.to === leavingBond.from)
      );
    }

    // Create the new bond cylinder mesh if donor and acceptor are present
    if (donorIdx !== undefined && acceptorIdx !== undefined && this.atoms[donorIdx] && this.atoms[acceptorIdx]) {
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
      this.newBondMesh = new THREE.Mesh(newBondGeo, newBondMat);
      this.group.add(this.newBondMesh);
      this.newBondData = {
        from: donorIdx,
        to: acceptorIdx,
        scale: 0.0,
        material: newBondMat
      };
    }

    const duration = 2000; // ms
    const startTime = performance.now();

    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);

      // Phase 1: Approach (progress 0.0 -> 0.48)
      const approachProgress = Math.min(1.0, progress / 0.48);
      const easeApproach = easeInOutCubic(approachProgress);

      for (const idx of clusterLeft) {
        if (!this.atoms[idx]) continue;
        this.atoms[idx].pos.copy(this.atoms[idx].initialPos).addScaledVector(shiftLeft, easeApproach);
        this.atoms[idx].mesh.position.copy(this.atoms[idx].pos);
      }

      for (const idx of clusterRight) {
        if (!this.atoms[idx]) continue;
        if (idx === leavingAtom && progress > 0.48) continue;
        this.atoms[idx].pos.copy(this.atoms[idx].initialPos).addScaledVector(shiftRight, easeApproach);
        this.atoms[idx].mesh.position.copy(this.atoms[idx].pos);
      }

      // Phase 2: Bond Formation & Octet Preservation (progress 0.48 -> 1.0)
      if (progress >= 0.48) {
        const bondProgress = Math.min(1.0, (progress - 0.48) / 0.22);
        const easeBond = easeOutQuad(bondProgress);

        if (this.newBondData) {
          this.newBondData.scale = easeBond;
          this.newBondData.material.opacity = Math.min(1.0, easeBond * 1.2);
          const glowPulse = Math.max(0.25, 0.85 * (1 - (progress - 0.48) / 0.52));
          this.newBondData.material.emissiveIntensity = glowPulse;
        }

        if (leavingBondObj && leavingAtom !== null && this.atoms[leavingAtom]) {
          const breakProgress = Math.min(1.0, (progress - 0.48) / 0.16);
          leavingBondObj.material.opacity = Math.max(0, 1.0 - breakProgress);
          leavingBondObj.scale = Math.max(0.001, 1.0 - breakProgress);
          if (breakProgress >= 1.0) {
            leavingBondObj.cleaved = true;
            leavingBondObj.mesh.visible = false;
          }

          const departProgress = Math.min(1.0, (progress - 0.48) / 0.52);
          const easeDepart = easeInOutCubic(departProgress);
          const departDist = easeDepart * 3.8;

          const baseLeavePos = this.atoms[leavingAtom].initialPos.clone().addScaledVector(shiftRight, 1.0);
          this.atoms[leavingAtom].pos.copy(baseLeavePos).addScaledVector(departDir, departDist);
          this.atoms[leavingAtom].mesh.position.copy(this.atoms[leavingAtom].pos);

          if (this.atoms[leavingAtom].material) {
            this.atoms[leavingAtom].material.emissive = new THREE.Color(0x38b000);
            this.atoms[leavingAtom].material.emissiveIntensity = Math.max(0, 0.5 * (1 - easeDepart));
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
    if (this.newBondMesh) {
      this.group.remove(this.newBondMesh);
      this.newBondMesh.geometry?.dispose();
      this.newBondMesh.material?.dispose();
      this.newBondMesh = null;
      this.newBondData = null;
    }
  }

  dispose() {
    this.cancelAnimation();
    for (const a of this.atoms) {
      a.mesh.geometry?.dispose();
      a.material?.dispose();
    }
    for (const b of this.bonds) {
      b.mesh.geometry?.dispose();
      b.material?.dispose();
    }
    this.atoms = [];
    this.bonds = [];
  }
}
