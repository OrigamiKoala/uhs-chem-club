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
      title: 'OPPOSITES ATTRACT',
      intro: 'Glowing clouds show electric charge. Opposite charges pull together.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Red:</strong> Negative giver.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Blue:</strong> Positive receiver.'
        }
      ],
      action: 'Drag from <strong>red</strong> to <strong>blue</strong> to snap them together!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Connected! The red and blue regions snapped together into a new bond.'
    }
  },
  {
    stageIndex: 1,
    title: 'Stage 2 — Making Room',
    prompt: 'Connect the negative red cloud to the positive blue center to make a new bond.',
    moleculeId: 'stage2_pair',
    xp: 15,
    expectedFrom: 'red_lp1',
    expectedTo: 'blue_c1',
    sourcePos: [-1.5, 0.3, 0],
    targetPos: [1.1, 0, 0],
    tolerance: 1.35,
    concept: {
      badge: 'MAKING ROOM',
      title: 'ONE IN, ONE OUT',
      intro: 'There is only so much room at the center.',
      pills: [
        {
          type: 'warning-pill',
          html: '⚡ <strong>Departing Piece:</strong> When a new piece snaps in, an old piece pops off to make room.'
        }
      ],
      action: 'Connect the red cloud to the blue center to pop off the old piece.'
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
      explanation: 'Connected! The new piece attached and popped off the old piece to make room.'
    }
  },
  {
    stageIndex: 2,
    title: 'Stage 3 — Comparing Strengths',
    prompt: 'Multiple reactive spots: connect the brightest red donor to the deepest blue receiver.',
    moleculeId: 'stage3_pair',
    xp: 20,
    expectedFrom: 'red_extreme',
    expectedTo: 'blue_extreme',
    sourcePos: [-0.8, -1.2, 0],
    targetPos: [1.3, -0.3, 0],
    tolerance: 1.35,
    concept: {
      badge: 'STRENGTH',
      title: 'STRONGEST SPOTS REACT FIRST',
      intro: 'When multiple spots are present, the brightest charges pull hardest.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Brightest Red:</strong> Strongest giver.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Deepest Blue:</strong> Strongest receiver.'
        }
      ],
      action: 'Connect the brightest red spot directly into the deepest blue spot.'
    },
    reaction: {
      donorAtom: 3,
      acceptorAtom: 6,
      clusterLeft: [0, 1, 2, 3, 4, 5],
      clusterRight: [6, 7, 8, 9, 10],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Connected! The strongest spots reacted first, shifting a link over to make room.'
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
      explanation: 'Connected! The strongest spots paired up, ignoring the weaker distractions.'
    }
  },
  {
    stageIndex: 4,
    title: 'Stage 5 — Crowded Spaces',
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
      title: 'AVOID THE TRAFFIC JAM',
      intro: 'Surrounding pieces can physically block the way in.',
      pills: [
        {
          type: 'warning-pill',
          html: '⚠️ <strong>Blocked Path:</strong> Too crowded to squeeze through directly.'
        }
      ],
      action: 'Rotate the 3D view to find the open, unblocked blue target.'
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
      explanation: 'Connected! You steered around the crowd, and the old piece popped off.'
    }
  },
  {
    stageIndex: 5,
    title: 'Stage 6 — Bulky Group Shielding',
    prompt: 'Bulky groups shield the top center. Connect to the open blue target at the bottom!',
    moleculeId: 'stage6_pair',
    xp: 25,
    expectedFrom: 'red_nu',
    expectedTo: 'blue_open',
    sourcePos: [-1.5, 0.2, 0],
    targetPos: [1.6, -0.9, 0],
    blockedAnchor: 'blue_blocked',
    blockedPos: [1.8, 1.2, 0],
    tolerance: 1.85,
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Connected! You reached the open unshielded carbonyl, bypassing the bulky isopropyl wings.'
    }
  },
  {
    stageIndex: 6,
    title: 'Stage 7 — Finding the Open Route',
    prompt: 'Find the brightest red spot and connect to the unblocked blue target!',
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
      explanation: 'Route complete! The strongest red spot connected right into the open blue target.'
    }
  },
  {
    stageIndex: 7,
    title: 'Stage 8 — Three\'s Company',
    prompt: 'Three molecules in the chamber! Connect the active red donor directly to the hungry blue receiver, ignoring the quiet bystander.',
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
      explanation: 'Connected! The active spots snapped together while the bystander just watched.'
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
      explanation: 'Tug-of-war won! The stronger red spot won the race and claimed the blue target.'
    }
  },
  {
    stageIndex: 9,
    title: 'Stage 10 — The Team Relay',
    prompt: 'Teamwork! Connect the helper red spot into the blue target to activate it.',
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
      explanation: 'Relay complete! The helper powered up the target so it is ready for the next move.'
    }
  },
  {
    stageIndex: 10,
    title: 'Stage 11 — The Knockout Punch',
    prompt: 'Multi-step combo! Draw 2 arrows in order: 1st: Red spot ➔ Blue center. 2nd: Connected bond ➔ Departing piece.',
    moleculeId: 'stage11_pair',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'bond_c_cl', expectedTo: 'cl_leave', sourcePos: [2.2, 0, 0], targetPos: [3.3, 0, 0] }
    ],
    concept: {
      badge: 'STEP BY STEP',
      title: 'ONE-TWO COMBO',
      intro: 'Steps happen in order, like a combo move in a game.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Arrow 1:</strong> New piece snaps into the center.'
        },
        {
          type: 'warning-pill',
          html: '<strong>② Arrow 2:</strong> Old piece pops off into space.'
        }
      ],
      action: 'Draw each arrow in order. Click numbers to swap their order if needed.'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6],
      leavingBond: { from: 2, to: 3 },
      leavingAtom: 3,
      departDirection: [1, 0, 0],
      explanation: 'One in, one out! The new piece snapped on and kicked the old piece free.'
    }
  },
  {
    stageIndex: 11,
    title: 'Stage 12 — The Rooftop Bounce',
    prompt: 'Two-step bounce! Arrow 1: Red spot ➔ Blue center. Arrow 2: Double bond ➔ Top spot.',
    moleculeId: 'stage12_pair',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o', sourcePos: [1.5, 0.7, 0], targetPos: [1.6, 1.6, 0] }
    ],
    concept: {
      badge: 'BOND SHIFT',
      title: 'THE ROOFTOP BOUNCE',
      intro: 'When a new piece connects, an extra link swings up to the roof to make room.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Arrow 1:</strong> Connect to the center.'
        },
        {
          type: 'blue-pill',
          html: '<strong>② Arrow 2:</strong> Swing the extra link up to the top spot.'
        }
      ],
      action: 'Draw Arrow 1 to the center, then Arrow 2 swinging up to the top spot.'
    },
    reaction: {
      donorAtom: 1,
      acceptorAtom: 4,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Rooftop bounce complete! The new piece attached and the extra link swung up to the roof.'
    }
  },
  {
    stageIndex: 12,
    title: 'Stage 13 — The Hot Potato',
    prompt: 'Pass the hot potato! Arrow 1: Red spot ➔ Blue target. Arrow 2: Old bond ➔ Adjacent spot.',
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
      explanation: 'Hot potato passed! The target piece was handed smoothly from one partner to the other.'
    }
  },
  {
    stageIndex: 13,
    title: 'Stage 14 — The Trampoline Kick-Back',
    prompt: '3-Step combo! 1: Red spot ➔ Blue center. 2: Double bond ➔ Top spot. 3: Top spot ➔ Departing piece.',
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
      explanation: 'Trampoline kick-back complete! The top link bounced up, snapped back down, and kicked the old piece away.'
    }
  },
  {
    stageIndex: 14,
    title: 'Stage 15 — The Key to the Lock',
    prompt: 'Unlock then enter! Arrow 1: Red spot ➔ Blue target (unlock). Arrow 2: Second red spot ➔ Unlocked center (enter).',
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
      explanation: 'Door unlocked! The first step unlocked the door, letting the second piece snap right in.'
    }
  },
  {
    stageIndex: 15,
    title: 'Stage 16 — The Clean Split',
    prompt: '3-Step snap! 1: Red spot ➔ Blue center. 2: Double bond ➔ Top spot. 3: Top spot ➔ Departing piece.',
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
      explanation: 'Clean split complete! The new piece attached, the top link bounced down, and the tail broke free.'
    }
  },
  {
    stageIndex: 16,
    title: 'Stage 17 — The Snapping Spring',
    prompt: 'Release the spring! Arrow 1: Red spot ➔ Ring corner. Arrow 2: Ring bond ➔ Ring top.',
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
      explanation: 'Spring popped open! Connecting to the corner popped the tight ring open into a relaxed chain.'
    }
  },
  {
    stageIndex: 17,
    title: 'Stage 18 — The Domino Chain',
    prompt: '3-Step domino chain! 1: Red spot ➔ Outer target. 2: Connecting bond ➔ Center. 3: Center ➔ Blue target.',
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
      explanation: 'Domino effect! Each push triggered the next until the final pieces locked together.'
    }
  },
  {
    stageIndex: 18,
    title: 'Stage 19 — Musical Chairs',
    prompt: 'Musical chairs! Arrow 1: Bond ➔ Departing piece (leave chair). Arrow 2: Red spot ➔ Empty blue chair (sit down).',
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
      explanation: 'Musical chairs won! The old piece vacated the spot first, leaving an open seat for the red piece to take.'
    }
  },
  {
    stageIndex: 19,
    title: 'Stage 20 — The Master Conductor',
    prompt: 'Grand Finale! 1: Helper ➔ Target. 2: Main red piece ➔ Center. 3: Bond ➔ Departing piece.',
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
      explanation: 'MISSION ACCOMPLISHED! The helper kicked off the reaction, the core pieces locked together, and the old part cleared out. All 20 stages conquered!'
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
