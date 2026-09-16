/**
 * evaluator.js — Immediate in-browser grading and stage definitions for Quest 1
 * ZERO network roundtrips for grading.
 * NO forbidden terms ("electron", "electron-rich", "electron-deficient", "electrophile").
 */

export const STAGE_CONFIGS = [
  {
    stageIndex: 0,
    title: 'Stage 1 — Target Lock',
    prompt: 'Drag a line from the crowded red zone to the hungry blue zone.',
    moleculeId: 'stage1_pair',
    xp: 15,
    expectedFrom: 'red_lp1',
    expectedTo: 'blue_c1',
    sourcePos: [-1.4, 0.2, 0],
    targetPos: [1.8, 0, 0],
    tolerance: 1.35,
    concept: {
      badge: 'BASICS',
      title: 'CHARGES & BONDS',
      intro: 'Glowing clouds show electric charge. Opposite charges attract.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Red:</strong> Negative donor region.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Blue:</strong> Positive acceptor region.'
        }
      ],
      action: 'Drag from the <strong>red zone</strong> into the <strong>blue zone</strong> to bond them!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Bond formed! The acceptor had 3 bonds; the new bond brings it to 4.'
    }
  },
  {
    stageIndex: 1,
    title: 'Stage 2 — Electrons & Charge',
    prompt: 'Opposites attract! Connect the negative red cloud to the positive blue center.',
    moleculeId: 'stage2_pair',
    xp: 15,
    expectedFrom: 'red_lp1',
    expectedTo: 'blue_c1',
    sourcePos: [-1.5, 0.3, 0],
    targetPos: [1.1, 0, 0],
    tolerance: 1.35,
    concept: {
      badge: 'BOND LIMIT',
      title: 'THE 4-BOND LIMIT',
      intro: 'An atom can hold at most 4 bonds at once.',
      pills: [
        {
          type: 'warning-pill',
          html: '⚡ <strong>Leaving Group:</strong> When a new bond forms, an existing group must break away so the center stays at 4 bonds.'
        }
      ],
      action: 'Connect the red cloud to the blue center to trigger substitution.'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 4,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7, 8],
      targetBondLength: 1.40,
      leavingBond: { from: 4, to: 5 },
      leavingAtom: 5,
      departDirection: [1, 0, 0],
      explanation: 'Bond formed! The central atom cannot exceed 4 bonds, so the leaving group departed.'
    }
  },
  {
    stageIndex: 2,
    title: 'Stage 3 — Comparing Densities',
    prompt: 'Multiple reactive spots: connect the deepest red donor to the deepest blue acceptor.',
    moleculeId: 'stage3_pair',
    xp: 20,
    expectedFrom: 'red_extreme',
    expectedTo: 'blue_extreme',
    sourcePos: [-0.8, -1.2, 0],
    targetPos: [1.3, -0.3, 0],
    tolerance: 1.35,
    concept: {
      badge: 'CHARGE DENSITY',
      title: 'STRONGEST SITES REACT FIRST',
      intro: 'When multiple sites are present, reactions happen between the most intense charges.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Brightest Red:</strong> Strongest donor.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Deepest Blue:</strong> Strongest acceptor.'
        }
      ],
      action: 'Connect the deepest red spot straight into the deepest blue spot.'
    },
    reaction: {
      donorAtom: 3,
      acceptorAtom: 6,
      clusterLeft: [0, 1, 2, 3, 4, 5],
      clusterRight: [6, 7, 8, 9, 10],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Bond formed! The double bond shifted to make room, maintaining 4 bonds.'
    }
  },
  {
    stageIndex: 3,
    title: 'Stage 4 — Competing Sites',
    prompt: 'Ignore weak distractions: connect the brightest red donor into the deepest blue core.',
    moleculeId: 'stage4_pair',
    xp: 20,
    expectedFrom: 'red_extreme',
    expectedTo: 'blue_extreme',
    sourcePos: [-0.8, -1.2, 0],
    targetPos: [1.3, -0.3, 0],
    tolerance: 1.35,
    concept: null,
    reaction: {
      donorAtom: 3,
      acceptorAtom: 8,
      clusterLeft: [0, 1, 2, 3, 4, 5],
      clusterRight: [6, 7, 8, 9, 10],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Bond formed! The strongest donor connected into the primary acceptor.'
    }
  },
  {
    stageIndex: 4,
    title: 'Stage 5 — Steric Hindrance',
    prompt: 'Trace the path into the open target. Avoid the crowded obstacle!',
    moleculeId: 'stage5_pair',
    xp: 25,
    expectedFrom: 'red_nu',
    expectedTo: 'blue_open',
    sourcePos: [-1.4, 0.2, 0],
    targetPos: [1.0, -1.0, 0],
    blockedAnchor: 'blue_blocked',
    blockedPos: [2.0, 1.1, 0],
    tolerance: 1.35,
    concept: {
      badge: 'CROWDING',
      title: 'STERIC HINDRANCE',
      intro: 'Surrounding atoms can physically block access to a reactive center.',
      pills: [
        {
          type: 'warning-pill',
          html: '⚠️ <strong>Blocked Target:</strong> Crowded positions cannot be reached directly.'
        }
      ],
      action: 'Rotate the 3D view to find the unblocked, accessible blue target.'
    },
    reaction: {
      donorAtom: 1,
      acceptorAtom: 4,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      targetBondLength: 1.35,
      leavingBond: { from: 4, to: 5 },
      leavingAtom: 5,
      departDirection: [1, -0.5, 0],
      explanation: 'Bond formed! The donor reached the open target and the leaving group departed.'
    }
  },
  {
    stageIndex: 5,
    title: 'Stage 6 — Bulky Group Shielding',
    prompt: 'Bulky groups block one route. Rotate view and connect to the open flank!',
    moleculeId: 'stage6_pair',
    xp: 25,
    expectedFrom: 'red_nu',
    expectedTo: 'blue_open',
    sourcePos: [-1.5, 0.2, 0],
    targetPos: [1.6, -0.9, 0],
    blockedAnchor: 'blue_blocked',
    blockedPos: [1.8, 1.2, 0],
    tolerance: 1.35,
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Bond formed! The donor accessed the open face, bypassing the bulky group.'
    }
  },
  {
    stageIndex: 6,
    title: 'Stage 7 — Final Synthesis Route',
    prompt: 'Find the strongest red donor and trace an open path into the unhindered blue target!',
    moleculeId: 'stage7_pair',
    xp: 30,
    expectedFrom: 'red_supreme',
    expectedTo: 'blue_accessible',
    sourcePos: [-0.4, 0, 0],
    targetPos: [1.6, -0.8, 0],
    blockedAnchor: 'blue_caged',
    blockedPos: [2.0, 1.2, 0],
    tolerance: 1.35,
    concept: null,
    reaction: {
      donorAtom: 4,
      acceptorAtom: 5,
      clusterLeft: [0, 1, 2, 3, 4],
      clusterRight: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Synthesis complete! Strongest donor connected into the accessible target.'
    }
  },
  {
    stageIndex: 7,
    title: 'Stage 8 — Three\'s Company',
    prompt: 'Three molecules in the chamber! Connect the active red donor directly to the hungry blue acceptor, ignoring the quiet spectator.',
    moleculeId: 'stage8_trio',
    xp: 30,
    expectedFrom: 'red_base',
    expectedTo: 'blue_acid',
    sourcePos: [-2.2, 0.7, 0],
    targetPos: [-0.2, 0.4, 0],
    tolerance: 1.35,
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 3,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5],
      targetBondLength: 1.0,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Reaction complete! The donor connected to the active acceptor while the spectator remained untouched.'
    }
  },
  {
    stageIndex: 8,
    title: 'Stage 9 — The Tug-of-War',
    prompt: 'Two givers want the same blue prize! Connect the strongest red donor to the hungry blue receiver.',
    moleculeId: 'stage9_trio',
    xp: 30,
    expectedFrom: 'red_strong',
    expectedTo: 'blue_target',
    sourcePos: [-1.0, 1.8, 0],
    targetPos: [1.2, 0, 0],
    tolerance: 1.35,
    concept: null,
    reaction: {
      donorAtom: 2,
      acceptorAtom: 9,
      clusterLeft: [0, 1, 2, 3, 4],
      clusterRight: [9, 10, 11, 12, 13, 14],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Reaction complete! The stronger donor outpaced the weaker site to form the bond.'
    }
  },
  {
    stageIndex: 9,
    title: 'Stage 10 — The Team Relay',
    prompt: 'A molecule needs help! Connect the helper red donor into the blue target to activate it.',
    moleculeId: 'stage10_trio',
    xp: 35,
    expectedFrom: 'red_base',
    expectedTo: 'blue_proton',
    sourcePos: [-2.2, 1.2, 0],
    targetPos: [0.3, -0.6, 0],
    tolerance: 1.35,
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 7,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7],
      targetBondLength: 1.1,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Relay complete! The helper group activated the donor into a strong reactive center.'
    }
  },
  {
    stageIndex: 10,
    title: 'Stage 11 — The Knockout Punch',
    prompt: 'Multi-step reaction! Draw 2 arrows in order: 1st: Red donor ➔ Blue center. 2nd: Connected bond ➔ Departing group.',
    moleculeId: 'stage11_pair',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'bond_c_cl', expectedTo: 'cl_leave', sourcePos: [2.2, 0, 0], targetPos: [3.3, 0, 0] }
    ],
    concept: {
      badge: 'SEQUENCE',
      title: 'MULTI-STEP ARROWS',
      intro: 'Some reactions require multiple arrows in chronological sequence.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Arrow 1:</strong> Donor connects to the central atom.'
        },
        {
          type: 'warning-pill',
          html: '<strong>② Arrow 2:</strong> Bond breaks to release the leaving group.'
        }
      ],
      action: 'Draw each arrow in order. Click step numbers to reorder if needed.'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6],
      leavingBond: { from: 2, to: 3 },
      leavingAtom: 3,
      departDirection: [1, 0, 0],
      explanation: 'One in, one out! New bond formed as the leaving group departed.'
    }
  },
  {
    stageIndex: 11,
    title: 'Stage 12 — The Rooftop Bounce',
    prompt: 'Two-step sequence! Arrow 1: Red donor ➔ Blue center. Arrow 2: Double bond ➔ Outer atom.',
    moleculeId: 'stage12_pair',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o', sourcePos: [1.5, 0.7, 0], targetPos: [1.6, 1.6, 0] }
    ],
    concept: {
      badge: 'DOUBLE BONDS',
      title: 'BOND SHIFTING',
      intro: 'When a new bond forms at a double-bonded atom, one bond shifts onto the adjacent atom.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Arrow 1:</strong> Donor connects to the central atom.'
        },
        {
          type: 'blue-pill',
          html: '<strong>② Arrow 2:</strong> Double bond shifts onto the adjacent atom.'
        }
      ],
      action: 'Draw Arrow 1 to the center, then Arrow 2 from the double bond to the adjacent atom.'
    },
    reaction: {
      donorAtom: 1,
      acceptorAtom: 4,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Bond formed! The donor attached and the double bond shifted onto the adjacent atom.'
    }
  },
  {
    stageIndex: 12,
    title: 'Stage 13 — The Hot Potato',
    prompt: 'Two-step relay! Arrow 1: Red donor ➔ Blue target. Arrow 2: Old bond ➔ Adjacent atom.',
    moleculeId: 'stage13_pair',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h', sourcePos: [-1.5, 0.2, 0], targetPos: [0.3, 0.3, 0] },
      { order: 2, expectedFrom: 'bond_o_h', expectedTo: 'red_o_acid', sourcePos: [0.9, 0.2, 0], targetPos: [1.7, 0, 0] }
    ],
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 3,
      clusterLeft: [0, 1, 2],
      clusterRight: [3, 4, 5, 6],
      leavingBond: { from: 3, to: 4 },
      leavingAtom: 4,
      departDirection: [1, 0, 0],
      explanation: 'Transfer complete! The target was transferred between the two centers.'
    }
  },
  {
    stageIndex: 13,
    title: 'Stage 14 — The Trampoline Kick-Back',
    prompt: '3-Step sequence! 1: Red donor ➔ Blue center. 2: Double bond ➔ Outer atom. 3: Outer atom ➔ Departing group.',
    moleculeId: 'stage14_pair',
    xp: 40,
    multiArrow: true,
    maxArrows: 3,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o', sourcePos: [1.4, 0.6, 0], targetPos: [1.5, 1.5, 0] },
      { order: 3, expectedFrom: 'red_o', expectedTo: 'cl_leave', sourcePos: [1.5, 1.5, 0], targetPos: [3.1, -0.4, 0] }
    ],
    concept: null,
    reaction: {
      donorAtom: 1,
      acceptorAtom: 4,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7, 8, 9],
      leavingBond: { from: 4, to: 6 },
      leavingAtom: 6,
      departDirection: [1, -0.3, 0],
      explanation: 'Addition-elimination complete! Double bond opened, reformed, and displaced the leaving group.'
    }
  },
  {
    stageIndex: 14,
    title: 'Stage 15 — The Key to the Lock',
    prompt: 'Unlock then enter! Arrow 1: Red donor ➔ Blue target (unlock). Arrow 2: Second donor ➔ Activated center (enter).',
    moleculeId: 'stage15_trio',
    xp: 40,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_o_carbonyl', expectedTo: 'blue_proton', sourcePos: [0.2, 1.5, 0], targetPos: [1.6, 1.8, 0] },
      { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_activated_c', sourcePos: [-2.1, -0.5, 0], targetPos: [0.0, 0.0, 0] }
    ],
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 3,
      clusterLeft: [0, 1, 2],
      clusterRight: [3, 4, 5, 6],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Activation complete! Activation opened the center for the second donor to bond.'
    }
  },
  {
    stageIndex: 15,
    title: 'Stage 16 — The Soap Maker',
    prompt: '3-Step sequence! 1: Red donor ➔ Blue center. 2: Double bond ➔ Outer atom. 3: Outer atom ➔ Departing group.',
    moleculeId: 'stage16_trio',
    xp: 40,
    multiArrow: true,
    maxArrows: 3,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-2.2, 0.4, 0], targetPos: [0.0, 0.0, 0] },
      { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o', sourcePos: [0.0, 0.7, 0], targetPos: [0.0, 1.5, 0] },
      { order: 3, expectedFrom: 'red_o', expectedTo: 'blue_ethoxide', sourcePos: [0.0, 1.5, 0], targetPos: [1.8, -0.4, 0] }
    ],
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6, 7],
      leavingBond: { from: 2, to: 5 },
      leavingAtom: 5,
      departDirection: [1, -0.2, 0],
      explanation: 'Cleavage complete! Donor bonded, double bond rebounded, and the leaving group departed.'
    }
  },
  {
    stageIndex: 16,
    title: 'Stage 17 — The Snapping Spring',
    prompt: 'Release trapped strain! Arrow 1: Red donor ➔ Ring center. Arrow 2: Ring bond ➔ Ring atom.',
    moleculeId: 'stage17_pair',
    xp: 40,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c_ring', sourcePos: [-2.1, 0.2, 0], targetPos: [0.7, -0.5, 0] },
      { order: 2, expectedFrom: 'bond_ring', expectedTo: 'red_o_ring', sourcePos: [1.1, 0.1, 0], targetPos: [1.6, 0.8, 0] }
    ],
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6],
      leavingBond: { from: 2, to: 4 },
      leavingAtom: 4,
      departDirection: [0.4, 1.0, 0],
      explanation: 'Ring opened! The strained ring broke open into a stable chain.'
    }
  },
  {
    stageIndex: 17,
    title: 'Stage 18 — The Domino Chain',
    prompt: '3-Step cascade! 1: Red donor ➔ Target atom. 2: Adjacent bond ➔ Center. 3: Reactive center ➔ Substrate.',
    moleculeId: 'stage18_pair',
    xp: 45,
    multiArrow: true,
    maxArrows: 3,
    steps: [
      { order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h_alpha', sourcePos: [-2.5, 1.2, 0], targetPos: [-0.8, 1.0, 0] },
      { order: 2, expectedFrom: 'bond_c_h', expectedTo: 'blue_c_carbonyl', sourcePos: [-0.5, 0.6, 0], targetPos: [0.7, 0.0, 0] },
      { order: 3, expectedFrom: 'c_alpha', expectedTo: 'blue_target', sourcePos: [-0.2, -0.2, 0], targetPos: [2.3, -0.8, 0] }
    ],
    concept: null,
    reaction: {
      donorAtom: 2,
      acceptorAtom: 6,
      clusterLeft: [0, 1, 2, 3, 4, 5],
      clusterRight: [6, 7],
      leavingBond: { from: 6, to: 7 },
      leavingAtom: 7,
      departDirection: [1, -0.3, 0],
      explanation: 'Cascade complete! Sequence triggered and new bond formed.'
    }
  },
  {
    stageIndex: 18,
    title: 'Stage 19 — Musical Chairs',
    prompt: 'Leave first, enter second! Arrow 1: Bond ➔ Departing group (leave). Arrow 2: Red donor ➔ Empty blue center (enter).',
    moleculeId: 'stage19_pair',
    xp: 45,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'bond_c_cl', expectedTo: 'red_cl', sourcePos: [1.8, 0.0, 0], targetPos: [2.9, 0.0, 0] },
      { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_carbocation', sourcePos: [-2.1, 0.0, 0], targetPos: [0.8, 0.0, 0] }
    ],
    concept: null,
    reaction: {
      donorAtom: 5,
      acceptorAtom: 0,
      clusterLeft: [5, 6, 7],
      clusterRight: [0, 1, 2, 3, 4],
      leavingBond: { from: 0, to: 1 },
      leavingAtom: 1,
      departDirection: [1, 0, 0],
      explanation: 'Stepwise substitution complete! Leaving group departed first, then donor bonded to the empty center.'
    }
  },
  {
    stageIndex: 19,
    title: 'Stage 20 — The Master Conductor',
    prompt: 'Grand Finale Synthesis! 1: Catalyst donor ➔ Target atom. 2: Core donor ➔ Central acceptor. 3: Bond ➔ Departing group.',
    moleculeId: 'stage20_multi',
    xp: 50,
    multiArrow: true,
    maxArrows: 3,
    steps: [
      { order: 1, expectedFrom: 'red_cat', expectedTo: 'blue_proton', sourcePos: [-2.7, 1.4, 0], targetPos: [-1.8, 1.5, 0] },
      { order: 2, expectedFrom: 'red_core', expectedTo: 'blue_c_scaffold', sourcePos: [-1.9, -0.8, 0], targetPos: [0.4, 0.0, 0] },
      { order: 3, expectedFrom: 'bond_leave', expectedTo: 'red_depart', sourcePos: [1.4, -0.3, 0], targetPos: [2.6, -0.5, 0] }
    ],
    concept: null,
    reaction: {
      donorAtom: 2,
      acceptorAtom: 4,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7],
      leavingBond: { from: 4, to: 7 },
      leavingAtom: 7,
      departDirection: [1, -0.3, 0],
      explanation: 'GRAND SYNTHESIS MASTERED! Catalyst activated, core scaffold assembled, and leaving group cleared. All 20 stages conquered!'
    }
  }
];

function dist3D(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = (a[2] || 0) - (b[2] || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Immediate in-browser grading of an arrow submission
 * @param {number} stageIndex 0-indexed stage index
 * @param {object} payload { from, to, startPos, endPos, arrows }
 * @returns {{ correct: boolean, blocked?: boolean, wrongOrder?: boolean, incomplete?: boolean, xpAwarded: number, message?: string }}
 */
export function evaluateStageLocally(stageIndex, payload) {
  const cfg = STAGE_CONFIGS[stageIndex] || STAGE_CONFIGS[0];
  if (!payload) return { correct: false, blocked: false, xpAwarded: 0 };

  // 1. Multi-step arrow sequence grading (Stages 11-20)
  if (cfg.multiArrow && cfg.steps) {
    const userArrows = payload.arrows || [];
    if (userArrows.length === 0) {
      return { correct: false, incomplete: true, xpAwarded: 0, message: `Draw all ${cfg.steps.length} arrows in order!` };
    }
    if (userArrows.length < cfg.steps.length) {
      return {
        correct: false,
        incomplete: true,
        xpAwarded: 0,
        message: `Almost there! You've drawn ${userArrows.length} of ${cfg.steps.length} arrows. Draw the remaining steps!`
      };
    }

    const checkArrowMatch = (arr, step) => {
      if (arr.from && arr.to && step.expectedFrom && step.expectedTo) {
        if (arr.from === step.expectedFrom && arr.to === step.expectedTo) return true;
      }
      if (arr.startPos && arr.endPos && step.sourcePos && step.targetPos) {
        const tol = step.tolerance || 1.45;
        const sDist = dist3D(arr.startPos, step.sourcePos);
        const eDist = dist3D(arr.endPos, step.targetPos);
        if (sDist <= tol && eDist <= tol) return true;
      }
      return false;
    };

    // Check exact order
    let allInExactOrder = true;
    for (const step of cfg.steps) {
      const matchingArrow = userArrows.find(a => a.order === step.order);
      if (!matchingArrow || !checkArrowMatch(matchingArrow, step)) {
        allInExactOrder = false;
        break;
      }
    }

    if (allInExactOrder) {
      return { correct: true, blocked: false, xpAwarded: cfg.xp };
    }

    // Check if right moves but wrong order
    let matchedCount = 0;
    for (const step of cfg.steps) {
      if (userArrows.some(a => checkArrowMatch(a, step))) {
        matchedCount++;
      }
    }

    if (matchedCount === cfg.steps.length) {
      return {
        correct: false,
        blocked: false,
        wrongOrder: true,
        xpAwarded: 0,
        message: 'You drew the right moves, but the chronological order is wrong! Click on the arrow numbers to swap their order.'
      };
    }

    return {
      correct: false,
      blocked: false,
      xpAwarded: 0,
      message: 'Check your arrow directions. Connect from the energy source into the target in the proper step order.'
    };
  }

  // 2. Single arrow direct anchor match (Stages 1-10)
  if (payload.from && payload.to) {
    if (payload.from === cfg.expectedFrom && payload.to === cfg.expectedTo) {
      return { correct: true, blocked: false, xpAwarded: cfg.xp };
    }
    if (cfg.blockedAnchor && payload.to === cfg.blockedAnchor) {
      return { correct: false, blocked: true, xpAwarded: 0 };
    }
  }

  // 3. Proximity check on 3D coordinates
  if (payload.startPos && payload.endPos) {
    const sPos = payload.startPos;
    const ePos = payload.endPos;

    if (cfg.blockedPos) {
      const distBlocked = dist3D(ePos, cfg.blockedPos);
      if (distBlocked < (cfg.tolerance || 1.35)) {
        return { correct: false, blocked: true, xpAwarded: 0 };
      }
    }

    const startDist = dist3D(sPos, cfg.sourcePos);
    const endDist = dist3D(ePos, cfg.targetPos);
    const tol = cfg.tolerance || 1.35;

    if (startDist <= tol && endDist <= tol) {
      return { correct: true, blocked: false, xpAwarded: cfg.xp };
    }
  }

  return { correct: false, blocked: false, xpAwarded: 0 };
}
