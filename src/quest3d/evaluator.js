/**
 * evaluator.js — Immediate in-browser grading and stage definitions for Quest 1
 * ZERO network roundtrips for grading.
 * NO forbidden terms ("electron", "electron-rich", "electron-deficient", "electrophile").
 */

export const STAGE_CONFIGS = [
  {
    stageIndex: 0,
    title: 'Stage 1 — Target Lock',
    prompt: 'Draw arrows to connect the molecules and trigger the reaction.',
    moleculeId: 'stage1_pair',
    hint: 'Look for the glowing red cloud on the left and the blue spot on the right. Drag a line from the red one to the blue one.',
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
          html: '<strong>Red:</strong> Negative giver.'
        },
        {
          type: 'blue-pill',
          html: '<strong>Blue:</strong> Positive receiver.'
        }
      ],
      action: 'Draw an arrow from red to blue to trigger the reaction.'
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
    hint: 'Start on the red cloud. Finish on the blue center — whatever is already parked there will get pushed out.',
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
          html: '<strong>Departing Piece:</strong> When a new piece snaps in, an old piece pops off to make room.'
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
    hint: 'Two reds and two blues are glowing. The brightest red and the deepest blue react first.',
    xp: 20,
    expectedFrom: 'red_extreme',
    expectedTo: 'blue_extreme',
    sourcePos: [-0.8, -1.2, 0],
    targetPos: [1.3, -0.3, 0],
    tolerance: 1.35,
    concept: {
      badge: 'DOUBLE BONDS',
      title: 'TWO-HANDED HANDSHAKE',
      intro: 'Some atoms connect with two links instead of one — like holding hands with both hands!',
      pills: [
        {
          type: 'warning-pill',
          html: '<strong>Double Bond:</strong> Notice the two parallel bars. They hold twice the grip and extra energy.'
        },
        {
          type: 'blue-pill',
          html: '<strong>Deepest blue:</strong> The strongest receiver still pulls hardest.'
        }
      ],
      action: 'Notice the double bars connecting atoms! Connect the brightest red spot into the deepest blue spot.'
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
    hint: 'Ignore the pale spots. Only the most intense red and the most intense blue matter here.',
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
    hint: 'One blue target is packed in by its neighbours, the other is out in the open. Right-click drag to spin the view and see which is which.',
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
          html: '<strong>Blocked Path:</strong> Too crowded to squeeze through directly.'
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
    hint: 'The upper center is fenced in by bulky groups. The open blue target sits lower down.',
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
      explanation: 'Connected! You found the open target and slipped past the bulky wings blocking the other one.'
    }
  },
  {
    stageIndex: 6,
    title: 'Stage 7 — Finding the Open Route',
    prompt: 'Find the brightest red spot and connect to the unblocked blue target!',
    moleculeId: 'stage7_pair',
    hint: 'Three reds, three blues. Take the most intense red, then the blue that nothing is blocking.',
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
    hint: 'One of the three molecules is only watching. Connect the two that are actually glowing.',
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
    hint: 'Both red spots want the same blue prize. The brighter red wins.',
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
    hint: 'The helper red spot has to activate the target first. Connect it to the blue it can reach.',
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
    title: 'Stage 11 — One In, One Out',
    prompt: 'Two arrows, in order. Bring the new piece in first, then send the old piece away.',
    moleculeId: 'stage11_pair',
    hint: 'This one needs two arrows. Something arrives first, then something leaves. Click an arrow\'s number badge to change its step order.',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger', sourcePos: [3.1, 0, 0], targetPos: [4.0, 0.8, 0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 0,
          acceptorAtom: 2,
          clusterLeft: [0, 1],
          clusterRight: [2, 3, 4, 5, 6],
          duration: 1400
        },
        {
          leavingBond: { from: 2, to: 3 },
          leavingCluster: [3],
          departDirection: [1, 0.5, 0],
          duration: 1400
        }
      ],
      explanation: 'One in, one out! The incoming piece snapped on as the leaving piece departed.'
    }
  },
  {
    stageIndex: 11,
    title: 'Stage 12 — Opening the Double Link',
    prompt: 'Two arrows, in order. Move in on the crowded center, then let the double link swing open.',
    moleculeId: 'stage12_pair',
    hint: 'Two arrows. Go at the center first — the double bar swings open afterwards.',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'red_o', expectedTo: 'blue_h', sourcePos: [1.6, 1.5, 0], targetPos: [2.1, 2.0, 0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 1,
          acceptorAtom: 4,
          clusterLeft: [0, 1, 2, 3],
          clusterRight: [4, 5, 6, 7],
          openDoubleBond: { from: 4, to: 5 },
          duration: 1400
        },
        {
          donorAtom: 5,
          acceptorAtom: 8,
          clusterLeft: [4, 5, 6, 7, 1],
          clusterRight: [8, 9, 10],
          leavingBond: { from: 8, to: 9 },
          leavingCluster: [9, 10],
          departDirection: [1, 0.4, 0],
          duration: 1400
        }
      ],
      explanation: 'Addition complete! The incoming piece attached and the double bond opened into a single bond.'
    }
  },
  {
    stageIndex: 12,
    title: 'Stage 13 — Passing It Along',
    prompt: 'Two arrows, in order. The shared piece hops across one step at a time.',
    moleculeId: 'stage13_pair',
    hint: 'Two arrows. The shared piece moves one hop at a time: one handoff per arrow.',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_base1', expectedTo: 'blue_h1', sourcePos: [-2.0, 0.4, 0], targetPos: [-0.8, 0.4, 0] },
      { order: 2, expectedFrom: 'red_base2', expectedTo: 'blue_h2', sourcePos: [1.8, -0.6, 0], targetPos: [3.1, -0.4, 0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 0,
          acceptorAtom: 3,
          clusterLeft: [0, 1, 2],
          clusterRight: [3, 4, 5],
          leavingBond: { from: 3, to: 4 },
          leavingCluster: [4, 5],
          departDirection: [0.5, 1, 0],
          duration: 1400
        },
        {
          donorAtom: 6,
          acceptorAtom: 9,
          clusterLeft: [6, 7, 8],
          clusterRight: [9, 10, 11],
          leavingBond: { from: 9, to: 10 },
          leavingCluster: [10, 11],
          departDirection: [1, 0, 0],
          duration: 1400
        }
      ],
      explanation: 'Handed off! The waiting partner caught the shared piece and the rest drifted apart.'
    }
  },
  {
    stageIndex: 13,
    title: 'Stage 14 — Add, Then Drop',
    prompt: 'Two arrows, in order. Attach the newcomer first, then drop the piece that no longer fits.',
    moleculeId: 'stage14_pair',
    hint: 'Two arrows. Add on first, then push the old piece off.',
    xp: 40,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger', sourcePos: [3.0, -0.4, 0], targetPos: [4.0, 0.3, 0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 1,
          acceptorAtom: 4,
          clusterLeft: [0, 1, 2, 3],
          clusterRight: [4, 5, 6, 7, 8, 9],
          openDoubleBond: { from: 4, to: 5 },
          duration: 1400
        },
        {
          closeDoubleBond: { from: 4, to: 5 },
          leavingBond: { from: 4, to: 6 },
          leavingCluster: [6],
          departDirection: [1, 0.3, 0],
          duration: 1400
        }
      ],
      explanation: 'Addition-elimination complete! The piece attached, the double bond swung open, then snapped shut to expel the leaving group.'
    }
  },
  {
    stageIndex: 14,
    title: 'Stage 15 — Wake It Up First',
    prompt: 'Two arrows, in order. The target is asleep — wake it up before anything else can move in.',
    moleculeId: 'stage15_trio',
    hint: 'Two arrows. The small helper molecule has to wake the target up before anything else can reach it.',
    xp: 40,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_o_carbonyl', expectedTo: 'blue_proton', sourcePos: [0.2, 1.5, 0], targetPos: [1.6, 1.8, 0] },
      { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_activated_c', sourcePos: [-2.1, -0.5, 0], targetPos: [0.0, 0.0, 0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 4,
          acceptorAtom: 8,
          clusterLeft: [3, 4, 5, 6],
          clusterRight: [7, 8, 9],
          leftRatio: 0.15,
          rightRatio: 0.85,
          leavingBond: { from: 7, to: 8 },
          leavingCluster: [7, 9],
          departDirection: [1, 0.4, 0],
          duration: 1500
        },
        {
          donorAtom: 0,
          acceptorAtom: 3,
          clusterLeft: [0, 1, 2],
          clusterRight: [3, 4, 5, 6, 8],
          openDoubleBond: { from: 3, to: 4 },
          duration: 1500
        }
      ],
      explanation: 'Activated! The helper woke the center up, which let the next piece move in and open the double link.'
    }
  },
  {
    stageIndex: 15,
    title: 'Stage 16 — Cutting the Tail',
    prompt: 'Two arrows, in order. Move in on the center, then cut the long tail loose.',
    moleculeId: 'stage16_trio',
    hint: 'Two arrows. Go at the center, then let the tail leave.',
    xp: 40,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-2.2, 0.4, 0], targetPos: [0.0, 0.0, 0] },
      { order: 2, expectedFrom: 'red_ethoxide', expectedTo: 'blue_proton', sourcePos: [1.8, -0.4, 0], targetPos: [2.8, 0.6, 0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 0,
          acceptorAtom: 2,
          clusterLeft: [0, 1],
          clusterRight: [2, 3, 4, 5, 6, 7],
          openDoubleBond: { from: 2, to: 3 },
          duration: 1400
        },
        {
          closeDoubleBond: { from: 2, to: 3 },
          leavingBond: { from: 2, to: 5 },
          leavingCluster: [5, 6, 7],
          departDirection: [1, -0.2, 0],
          duration: 1400
        }
      ],
      explanation: 'Tail cut! The newcomer moved in, the double link snapped back, and the long tail left.'
    }
  },
  {
    stageIndex: 16,
    title: 'Stage 17 — Ring Opening',
    prompt: 'Two arrows, in order. That three-cornered ring is stretched tight. Pop a corner, then tidy up.',
    moleculeId: 'stage17_pair',
    hint: 'Two arrows. The three-cornered ring is under strain — hit a corner, then tidy up what pops loose.',
    xp: 40,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c_ring', sourcePos: [-2.1, 0.2, 0], targetPos: [0.7, -0.5, 0] },
      { order: 2, expectedFrom: 'red_o_ring', expectedTo: 'blue_proton', sourcePos: [1.5, 0.6, 0], targetPos: [2.4, 1.4, 0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 0,
          acceptorAtom: 2,
          clusterLeft: [0, 1],
          clusterRight: [2, 3, 4, 5, 6],
          leavingBond: { from: 2, to: 4 },
          ringOpen: { swingAtom: 4, swingOffset: [0.4, 0.9, 0] },
          duration: 1400
        },
        {
          donorAtom: 4,
          acceptorAtom: 7,
          clusterLeft: [0, 1, 2, 3, 4, 5, 6],
          clusterRight: [7, 8, 9],
          leavingBond: { from: 7, to: 8 },
          leavingCluster: [8, 9],
          departDirection: [1, 0.4, 0],
          duration: 1400
        }
      ],
      explanation: 'Ring strain relieved! Attack at the corner snapped the strained 3-member ring open into a relaxed chain.'
    }
  },
  {
    stageIndex: 17,
    title: 'Stage 18 — Domino Cascade',
    prompt: 'Two arrows, in order. Take one outer piece off to open a reactive spot, then use that spot.',
    moleculeId: 'stage18_pair',
    hint: 'Two arrows. Take the outer piece off first; that is what creates the reactive spot for step two.',
    xp: 45,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h_alpha', sourcePos: [-2.5, 1.2, 0], targetPos: [-0.8, 1.0, 0] },
      { order: 2, expectedFrom: 'c_alpha', expectedTo: 'blue_target', sourcePos: [-0.2, -0.2, 0], targetPos: [2.3, -0.8, 0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 0,
          acceptorAtom: 3,
          clusterLeft: [0, 1],
          clusterRight: [2, 3, 4, 5],
          leavingBond: { from: 2, to: 3 },
          leavingCluster: [0, 1, 3],
          departDirection: [0, 1, 0],
          departDistance: 2.5,
          duration: 1400
        },
        {
          donorAtom: 2,
          acceptorAtom: 6,
          clusterLeft: [2, 4, 5],
          clusterRight: [6, 7],
          leavingBond: { from: 6, to: 7 },
          leavingCluster: [7],
          departDirection: [1, -0.3, 0],
          duration: 1400
        }
      ],
      explanation: 'Cascade complete! Removing the outer piece opened a reactive spot, which then grabbed the target.'
    }
  },
  {
    stageIndex: 18,
    title: 'Stage 19 — Leave, Then Fill',
    prompt: 'Two arrows, in order. One piece leaves and frees a seat; something else moves into it.',
    moleculeId: 'stage19_pair',
    hint: 'Two arrows. The leaving piece goes first, which frees up the seat for step two.',
    xp: 45,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger', sourcePos: [2.8, 0.0, 0], targetPos: [4.0, 0.0, 0] },
      { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_carbocation', sourcePos: [-2.1, 0.0, 0], targetPos: [0.8, 0.0, 0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          leavingBond: { from: 0, to: 1 },
          leavingCluster: [1],
          departDirection: [1, 0, 0],
          duration: 1500
        },
        {
          donorAtom: 5,
          acceptorAtom: 0,
          clusterLeft: [5, 6, 7],
          clusterRight: [0, 2, 3, 4],
          duration: 1500
        }
      ],
      explanation: 'Stepwise substitution complete! The leaving piece vacated the center first, creating an open seat for water to capture.'
    }
  },
  {
    stageIndex: 19,
    title: 'Stage 20 — Grand Finish',
    prompt: 'Two arrows, in order. Wake the big structure with the helper, then bring the final piece in.',
    moleculeId: 'stage20_multi',
    hint: 'Two arrows. Wake the scaffold with the catalyst, then bring in the core piece.',
    xp: 50,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_cat', expectedTo: 'blue_proton', sourcePos: [-2.7, 1.4, 0], targetPos: [-1.8, 1.5, 0] },
      { order: 2, expectedFrom: 'red_core', expectedTo: 'blue_c_scaffold', sourcePos: [-1.9, -0.8, 0], targetPos: [0.4, 0.0, 0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 5,
          acceptorAtom: 1,
          clusterLeft: [0, 1],
          clusterRight: [4, 5, 6, 7],
          leavingBond: { from: 0, to: 1 },
          leavingCluster: [0],
          departDirection: [-0.8, 1, 0],
          departDistance: 2.2,
          duration: 1400
        },
        {
          donorAtom: 2,
          acceptorAtom: 4,
          clusterLeft: [2, 3],
          clusterRight: [1, 4, 5, 6, 7],
          leavingBond: { from: 4, to: 7 },
          leavingCluster: [7],
          departDirection: [1, -0.3, 0],
          duration: 1400
        }
      ],
      explanation: 'Mission accomplished! The helper woke the structure, the core piece attached, and the old piece cleared out. All 20 stages solved.'
    }
  }
];

/* ------------------------------------------------------------------------- *
 * STAGE_COPY — everything the player reads, and everything a scan reveals.
 *
 * Kept separate from the geometry and reaction data above so the writing can be
 * read and edited as writing. Merged into STAGE_CONFIGS at the bottom.
 *
 * The rule for this layer: a prompt states the SITUATION and the GOAL, never the
 * route. What is true about an individual site lives in `scans`, and the player
 * only sees it by tapping that site. One scan is never enough — every stage is
 * solved by comparing two or more.
 *
 * `scans[regionId]`:
 *   site       letter shown in the readout, assigned left-to-right
 *   polarity   'giver' (red, has spare charge) | 'taker' (blue, short of it)
 *   strength   0-10, how hard this site pushes or pulls
 *   clearance  0-10, how much open room there is to approach it
 *   note       one plain sentence. An observation, never an instruction.
 *
 * `hints` is a ladder: [nudge, narrow, solution]. The nudge is free; the rest are
 * earned by missing. See HINT_UNLOCK in screens/quest.js.
 * ------------------------------------------------------------------------- */
const STAGE_COPY = [
  {
    shape: 'FIRST CONTACT',
    title: 'Stage 1 — Target Lock',
    prompt: 'Two sites are glowing. Tap each one to scan it, then drag a line from the site that gives to the site that takes.',
    hints: [
      'Tap a glowing cloud. The scan readout tells you whether that site has charge to spare or is short of it.',
      'Charge only travels one way: out of the site that has extra, into the site that wants more. Scan both and see which is which.',
      'Drag from the red cloud on the left to the blue spot on the right.'
    ],
    conceptTiming: 'intro',
    concept: {
      badge: 'CONTROLS',
      title: 'SCAN FIRST, THEN CONNECT',
      intro: 'Glowing clouds are electric charge. Opposite charges pull together — but you have to find out which is which.',
      pills: [
        { type: 'red-pill', html: '<strong>Tap a cloud</strong> to scan that site.' },
        { type: 'blue-pill', html: '<strong>Drag between clouds</strong> to connect them.' }
      ],
      action: 'Right-click drag (or two-finger drag) spins the chamber.'
    },
    scans: {
      red_lp1: { site: 'A', polarity: 'giver', strength: 8, clearance: 9, note: 'Carrying spare negative charge. Nothing parked in the way.' },
      blue_c1: { site: 'B', polarity: 'taker', strength: 8, clearance: 9, note: 'Short on charge and wide open. Anything could reach it.' }
    }
  },
  {
    shape: 'DISPLACEMENT',
    title: 'Stage 2 — Making Room',
    prompt: 'Same move, new chamber — except the blue site already has something parked on it. Scan first, then connect, and watch what happens to the old tenant.',
    hints: [
      'Scan the blue site and read its CLEARANCE. That number is how much room is left around it.',
      'There is only one giver here, so the move is not in doubt. The question is what the blue site does when a second piece arrives.',
      'Drag from the red cloud on the left into the blue center. The old piece gets pushed out.'
    ],
    conceptTiming: 'reward',
    concept: {
      badge: 'WHAT YOU JUST FOUND',
      title: 'ONE IN, ONE OUT',
      intro: 'That center had room for exactly one piece.',
      pills: [
        { type: 'warning-pill', html: 'When a new piece snaps on, the old one is forced off. Seats are not shared.' }
      ],
      action: 'Watch for this every time a blue site scans with low clearance and a piece already attached.'
    },
    scans: {
      red_lp1: { site: 'A', polarity: 'giver', strength: 8, clearance: 9, note: 'Spare charge, free approach, ready to move.' },
      blue_c1: { site: 'B', polarity: 'taker', strength: 8, clearance: 6, note: 'Short of charge — but a piece is already parked here. Room for exactly one.' }
    }
  },
  {
    shape: 'SURVEY',
    title: 'Stage 3 — Four Live Sites',
    prompt: 'Four sites are live and only one pairing is strong enough to fire. Scan them all before you commit.',
    hints: [
      'Every scan reports a CHARGE number. These four are not equal — two of them are much stronger than the other two.',
      'Line the givers up by CHARGE and do the same for the takers. You want the top of each list; anything scanning 5 or below is a distraction.',
      'Drag from the bright red site low on the left to the bright blue site just right of center.'
    ],
    conceptTiming: 'reward',
    concept: {
      badge: 'WHAT YOU JUST FOUND',
      title: 'THE STRONGEST PAIR GOES FIRST',
      intro: 'When several sites could react, the reaction does not pick at random.',
      pills: [
        { type: 'red-pill', html: 'The giver with the most concentrated charge pushes hardest.' },
        { type: 'blue-pill', html: 'The taker that is shortest of charge pulls hardest.' }
      ],
      action: 'Strongest push meets strongest pull. That pairing fires long before any weaker one gets a chance.'
    },
    scans: {
      red_weak: { site: 'A', polarity: 'giver', strength: 5, clearance: 8, note: 'Some spare charge, but it is spread across two spots — each one is weaker for it.' },
      red_extreme: { site: 'B', polarity: 'giver', strength: 9, clearance: 8, note: 'Charge piled into one place. Strongest giver in the chamber.' },
      blue_extreme: { site: 'C', polarity: 'taker', strength: 9, clearance: 8, note: 'Badly short of charge. The hungriest site here.' },
      blue_weak: { site: 'D', polarity: 'taker', strength: 4, clearance: 9, note: 'Only mildly short of charge. It can wait.' }
    }
  },
  {
    shape: 'DECOYS',
    title: 'Stage 4 — Decoys',
    prompt: 'Four sites again, and two of them are decoys. You already know the rule — prove you can apply it.',
    hints: [
      'No new idea here. The whole stage is reading four numbers and picking two.',
      'Two sites scan above 8 and two scan below 5. Take the strong pair.',
      'Drag from the bright red site near the middle-left to the bright blue site to its right.'
    ],
    scans: {
      red_weak: { site: 'A', polarity: 'giver', strength: 4, clearance: 7, note: 'Faint. The atom next door is pulling most of its charge away.' },
      red_extreme: { site: 'B', polarity: 'giver', strength: 9, clearance: 8, note: 'Dense negative charge, tightly packed. Strongest giver here.' },
      blue_extreme: { site: 'C', polarity: 'taker', strength: 9, clearance: 7, note: 'Stripped bare by its neighbours. Very hungry.' },
      blue_weak: { site: 'D', polarity: 'taker', strength: 4, clearance: 8, note: 'Slightly short of charge. Not desperate.' }
    }
  },
  {
    shape: 'THE TRAP',
    title: 'Stage 5 — The Trap',
    prompt: 'Two blue sites, both starving, both exactly as strong as each other. Only one of them can actually be reached. Scan to find out which — spin the chamber if it helps.',
    hints: [
      'Strength decides nothing here: both blue sites scan the same. Look at the second number instead.',
      'CLEARANCE is how much open space surrounds a site. A site with no clearance cannot be reached no matter how hungry it is.',
      'Drag from the red cloud on the left down to the lower blue site. The upper one is walled in.'
    ],
    conceptTiming: 'reward',
    concept: {
      badge: 'WHAT YOU JUST FOUND',
      title: 'ROOM TO MOVE BEATS RAW HUNGER',
      intro: 'Molecules are objects with size. They collide before they connect.',
      pills: [
        { type: 'warning-pill', html: 'Bumper cars: it does not matter how badly two cars want to meet if three others are wedged between them.' }
      ],
      action: 'From here on, check CLEARANCE before you commit. A caged site is a dead end.'
    },
    scans: {
      red_nu: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'Strong and unobstructed.' },
      blue_open: { site: 'B', polarity: 'taker', strength: 8, clearance: 9, note: 'Hungry, and standing out in open space. Easy approach.' },
      blue_blocked: { site: 'C', polarity: 'taker', strength: 8, clearance: 2, note: 'Just as hungry — but three bulky neighbours crowd every approach. Nothing fits through.' }
    }
  },
  {
    shape: 'THE TRAP AGAIN',
    title: 'Stage 6 — Fenced In',
    prompt: 'Same trap, better disguised. This time the unreachable site is the one that looks most inviting.',
    hints: [
      'Do not trust position or brightness. Scan both blue sites and compare CLEARANCE.',
      'The upper site is the hungrier of the two and it is completely fenced in. The lower one is exposed.',
      'Drag from the red cloud on the left to the lower-right blue site.'
    ],
    scans: {
      red_nu: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'Clear shot from here.' },
      blue_open: { site: 'B', polarity: 'taker', strength: 8, clearance: 8, note: 'Hungry, and sitting out on an exposed edge.' },
      blue_blocked: { site: 'C', polarity: 'taker', strength: 9, clearance: 2, note: 'The hungriest site here, and unreachable — two heavy wings fold over it.' }
    }
  },
  {
    shape: 'FULL SURVEY',
    title: 'Stage 7 — Six Sites, One Answer',
    prompt: 'Six live sites, and both rules you have worked out apply at once. Survey the whole chamber before you draw anything.',
    hints: [
      'Two numbers decide this. CHARGE alone picks the giver; the taker has to win on CHARGE and CLEARANCE together.',
      'One blue site is strong but caged. One is open but weak. Neither of those is the answer — you want the one that is both strong and open.',
      'Drag from the bright red site near the center to the open blue site below and to the right.'
    ],
    scans: {
      red_weak1: { site: 'A', polarity: 'giver', strength: 4, clearance: 7, note: 'Thin. Not much to give.' },
      red_weak2: { site: 'B', polarity: 'giver', strength: 5, clearance: 6, note: 'Moderate charge, and partly tucked behind its own molecule.' },
      red_supreme: { site: 'C', polarity: 'giver', strength: 9, clearance: 8, note: 'Concentrated charge, out in the open. Nothing here pushes harder.' },
      blue_accessible: { site: 'D', polarity: 'taker', strength: 8, clearance: 9, note: 'Hungry and completely exposed. A clean approach from any angle.' },
      blue_caged: { site: 'E', polarity: 'taker', strength: 9, clearance: 1, note: 'The hungriest site in the chamber, and sealed in on every side. Unreachable.' },
      blue_weak: { site: 'F', polarity: 'taker', strength: 4, clearance: 9, note: 'Wide open, but barely short of charge. It will not pull anything in.' }
    }
  },
  {
    shape: 'THE BYSTANDER',
    title: 'Stage 8 — Three in the Chamber',
    prompt: 'Three molecules now, and one of them has nothing to do with this reaction. Scan around and find the odd one out.',
    hints: [
      'One of the three has nothing worth giving and nothing worth taking. Its scan will read flat.',
      'The reacting pair is on the left. The molecule drifting on the right is only passing through.',
      'Drag from the red site on the far left to the blue site just to its right.'
    ],
    scans: {
      red_base: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'Strong, exposed, ready to go.' },
      blue_acid: { site: 'B', polarity: 'taker', strength: 9, clearance: 8, note: 'Very short of charge and easy to reach.' },
      spectator_mid: { site: 'C', polarity: 'taker', strength: 1, clearance: 9, note: 'Almost perfectly balanced. Barely registers — this one is not doing anything.' }
    }
  },
  {
    shape: 'THE RACE',
    title: 'Stage 9 — The Race',
    prompt: 'Two givers, one prize, and they cannot both have it. Scan both and back the one that gets there first.',
    hints: [
      'There is only one blue site, so the entire question is which red site wins the race to it.',
      'Whichever giver holds its charge more loosely lets go sooner. Compare the two CHARGE readings.',
      'Drag from the upper red site to the blue site in the middle.'
    ],
    scans: {
      red_strong: { site: 'A', polarity: 'giver', strength: 9, clearance: 8, note: 'Holds its charge loosely and gives it up fast.' },
      red_weak: { site: 'B', polarity: 'giver', strength: 5, clearance: 7, note: 'Grips its charge much tighter. Slow to let go.' },
      blue_target: { site: 'C', polarity: 'taker', strength: 9, clearance: 8, note: 'One prize, and both givers are reaching for it.' }
    }
  },
  {
    shape: 'THE SETUP',
    title: 'Stage 10 — Warm-Up Act',
    prompt: 'The main target is too comfortable to react with anything yet. Something else has to happen first. Find the move that sets it up.',
    hints: [
      'Scan the large molecule on the right. Its CHARGE reading is low — it is not hungry enough to pull anything in.',
      'There is a small, desperately hungry site sitting between the two big molecules. Feed that one instead.',
      'Drag from the red site on the far left to the small blue site near the center.'
    ],
    conceptTiming: 'reward',
    concept: {
      badge: 'WHAT YOU JUST FOUND',
      title: 'SOME MOVES ONLY UNLOCK OTHERS',
      intro: 'Not every step of a reaction is the main event.',
      pills: [
        { type: 'warning-pill', html: 'A cheap early move can make a sluggish site far hungrier — and only then can the real reaction happen.' }
      ],
      action: 'When nothing in a chamber looks reactive enough, look for the move that changes that.'
    },
    scans: {
      red_base: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'Strong and free. This is the helper.' },
      blue_proton: { site: 'B', polarity: 'taker', strength: 9, clearance: 8, note: 'A tiny site, desperately short of charge. The easiest grab in the chamber.' },
      blue_substrate: { site: 'C', polarity: 'taker', strength: 4, clearance: 6, note: 'Only mildly short of charge. Too comfortable to react until something changes.' }
    }
  },
  {
    shape: 'TWO MOVES',
    title: 'Stage 11 — One In, One Out',
    prompt: 'Two arrows from here on, and the order is part of the answer. Scan all four sites, then work out which move cannot happen until the other one has.',
    hints: [
      'Ask which of the two moves is even possible right now. One of them is not.',
      'The piece on the right will not let go until something new has arrived to take its seat.',
      'Step 1: the red site on the left into the blue center. Step 2: the red piece on the right into the blue site beyond it.'
    ],
    conceptTiming: 'intro',
    concept: {
      badge: 'CONTROLS',
      title: 'TWO ARROWS, NUMBERED',
      intro: 'This chamber needs two moves, and they happen in sequence.',
      pills: [
        { type: 'blue-pill', html: 'Each arrow carries a <strong>number badge</strong>. Click the badge to change that arrow\'s step.' },
        { type: 'warning-pill', html: 'Click the <strong>arrow itself</strong> to delete it.' }
      ],
      action: 'Right moves in the wrong order are reported separately, so you will know which mistake you made.'
    },
    scans: {
      red_nu: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'Strong, free, ready to move in.' },
      blue_c: { site: 'B', polarity: 'taker', strength: 8, clearance: 6, note: 'Short of charge — but a piece is still parked on it.' },
      red_cl: { site: 'C', polarity: 'giver', strength: 5, clearance: 8, note: 'Holding on for now. It will only let go once it is pushed off.' },
      blue_scavenger: { site: 'D', polarity: 'taker', strength: 9, clearance: 9, note: 'Waiting out on the right to catch whatever gets displaced.' }
    }
  },
  {
    shape: 'SWING OPEN',
    title: 'Stage 12 — The Double Link',
    prompt: 'Two atoms here are joined by a double bar. Something has to push before that bar can swing open. Two arrows.',
    hints: [
      'Find the double bar in the chamber. A double link can open up and dump its spare charge to one side — but only once it is pushed.',
      'The push comes first; the bar swinging open is the consequence, not the cause.',
      'Step 1: the red site on the left into the blue center. Step 2: the red site above it into the small blue site at the top right.'
    ],
    conceptTiming: 'reward',
    concept: {
      badge: 'WHAT YOU JUST FOUND',
      title: 'THE TWO-HANDED HANDSHAKE',
      intro: 'Those two parallel bars are one connection made twice over.',
      pills: [
        { type: 'warning-pill', html: 'A double link can let go with one hand and keep holding with the other — which is how it absorbs an incoming piece without breaking apart.' }
      ],
      action: 'A double bar next to a crowded center is almost always the escape valve.'
    },
    scans: {
      red_nu: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'Strong and clear. The push has to start here.' },
      blue_c: { site: 'B', polarity: 'taker', strength: 8, clearance: 7, note: 'Short of charge, and holding one end of the double bar.' },
      red_o: { site: 'C', polarity: 'giver', strength: 9, clearance: 8, note: 'This is where the double bar parks its charge once it swings open.' },
      blue_h: { site: 'D', polarity: 'taker', strength: 8, clearance: 9, note: 'A small exposed site, waiting to be fed.' }
    }
  },
  {
    shape: 'RELAY',
    title: 'Stage 13 — Passing It Along',
    prompt: 'A small piece has to travel across the chamber. It cannot jump the whole way — it moves one hop at a time. Two arrows.',
    hints: [
      'Scan the two blue sites. Each is a small piece loosely attached to a bigger molecule, ready to be pulled off.',
      'Work left to right: the first hop has to land before the second one can start.',
      'Step 1: the red site on the far left to the blue site beside it. Step 2: the red site right of center to the blue site at the far right.'
    ],
    scans: {
      red_base1: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'Strong, on the far left. This starts the chain.' },
      blue_h1: { site: 'B', polarity: 'taker', strength: 8, clearance: 8, note: 'A small piece, loosely attached. Easy to pull away.' },
      red_base2: { site: 'C', polarity: 'giver', strength: 8, clearance: 8, note: 'The second catcher, waiting downstream.' },
      blue_h2: { site: 'D', polarity: 'taker', strength: 8, clearance: 9, note: 'The last small piece in the line.' }
    }
  },
  {
    shape: 'ADD, THEN DROP',
    title: 'Stage 14 — Add, Then Drop',
    prompt: 'The center is already full, something new still has to get on, and something old has to come off. Two arrows, and only one order works.',
    hints: [
      'You have solved this shape before, in Stage 11. The molecule is different; the ordering question is identical.',
      'Add first. The old piece cannot leave until the newcomer is holding on.',
      'Step 1: the red site on the left into the blue center. Step 2: the red piece on the right into the blue site beyond it.'
    ],
    scans: {
      red_nu: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'Strong and unobstructed. The newcomer.' },
      blue_c: { site: 'B', polarity: 'taker', strength: 9, clearance: 6, note: 'Very hungry, and already carrying a full load of attachments.' },
      red_cl: { site: 'C', polarity: 'giver', strength: 8, clearance: 8, note: 'Attached to the center, and it would happily leave if it were pushed.' },
      blue_scavenger: { site: 'D', polarity: 'taker', strength: 9, clearance: 9, note: 'Waiting on the right to catch whatever comes off.' }
    }
  },
  {
    shape: 'WAKE IT UP',
    title: 'Stage 15 — Wake It Up First',
    prompt: 'Scan the center of the big molecule before anything else. It is not hungry enough to pull anything in yet — so fix that. Two arrows.',
    hints: [
      'Compare the CHARGE of the giver on the left with the CHARGE of the center. The giver is not strong enough as things stand.',
      'Feeding the small site on top drags charge away from the center, which makes the center far hungrier than it is now.',
      'Step 1: the red site on top of the big molecule to the small blue site beside it. Step 2: the red site on the far left into the center.'
    ],
    scans: {
      red_o_carbonyl: { site: 'A', polarity: 'giver', strength: 7, clearance: 8, note: 'Has charge to spare, and it sits directly above the center.' },
      blue_proton: { site: 'B', polarity: 'taker', strength: 9, clearance: 9, note: 'A tiny, very hungry site drifting nearby.' },
      red_water: { site: 'C', polarity: 'giver', strength: 6, clearance: 9, note: 'A modest giver on the left. Not strong enough for the center the way it is now.' },
      blue_activated_c: { site: 'D', polarity: 'taker', strength: 5, clearance: 7, note: 'Only mildly short of charge. Too comfortable to attract anything — for the moment.' }
    }
  },
  {
    shape: 'CUT THE TAIL',
    title: 'Stage 16 — Cutting the Tail',
    prompt: 'A long tail hangs off this molecule and it is on its way out — but it will not let go until something takes its place. Two arrows.',
    hints: [
      'Scan the four sites and sort them: which is the newcomer arriving, and which is the piece on its way out?',
      'The tail only leaves after the newcomer is attached. Same order you used in Stage 14.',
      'Step 1: the red site on the left into the blue center. Step 2: the red tail to the small blue site at its upper right.'
    ],
    scans: {
      red_nu: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'Strong and clear on the left. The newcomer.' },
      blue_c: { site: 'B', polarity: 'taker', strength: 9, clearance: 7, note: 'Hungry center, and it is carrying the long tail.' },
      red_ethoxide: { site: 'C', polarity: 'giver', strength: 8, clearance: 8, note: 'The tail. Loaded with charge and barely hanging on.' },
      blue_proton: { site: 'D', polarity: 'taker', strength: 9, clearance: 9, note: 'A small hungry site nearby, ready to take the tail off your hands.' }
    }
  },
  {
    shape: 'UNDER STRAIN',
    title: 'Stage 17 — Ring Opening',
    prompt: 'That three-cornered ring is bent far past comfortable and it is waiting for an excuse to snap open. Give it one. Two arrows.',
    hints: [
      'A ring of only three atoms forces its connections into a sharp corner. Everything in it is under tension.',
      'Hit a corner and the whole ring springs open. Then deal with the loose end you just created.',
      'Step 1: the red site on the left into the lower corner of the ring. Step 2: the red site that pops loose to the small blue site above and right.'
    ],
    conceptTiming: 'reward',
    concept: {
      badge: 'WHAT YOU JUST FOUND',
      title: 'STRAIN IS STORED ENERGY',
      intro: 'A three-cornered ring is a bent spring.',
      pills: [
        { type: 'warning-pill', html: 'Its connections are forced into angles they do not want. Open one corner and the whole thing relaxes — which is why a strained ring reacts far more eagerly than a relaxed chain.' }
      ],
      action: 'A very small ring is always a hot spot. Look for one.'
    },
    scans: {
      red_nu: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'Strong and free on the left.' },
      blue_c_ring: { site: 'B', polarity: 'taker', strength: 7, clearance: 8, note: 'A corner of the strained ring. Under visible tension and easy to reach.' },
      red_o_ring: { site: 'C', polarity: 'giver', strength: 8, clearance: 8, note: 'The other side of the ring. It will be left holding spare charge once a corner pops.' },
      blue_proton: { site: 'D', polarity: 'taker', strength: 9, clearance: 9, note: 'A small hungry site above and to the right.' }
    }
  },
  {
    shape: 'DOMINO',
    title: 'Stage 18 — Domino',
    prompt: 'Nothing in this chamber is reactive enough to start on its own. One move has to create the site that makes the next move possible. Two arrows.',
    hints: [
      'Scan the middle site. It is nearly neutral right now — which is exactly why it is worth a second look.',
      'Strip the small piece off the top of that middle site and what is left behind becomes the strongest giver in the chamber.',
      'Step 1: the red site on the far left to the small blue site beside it. Step 2: the middle site you just exposed to the blue site on the right.'
    ],
    scans: {
      red_base: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'A strong giver — but there is nothing here it can usefully attack directly.' },
      blue_h_alpha: { site: 'B', polarity: 'taker', strength: 7, clearance: 8, note: 'A small piece attached to the middle atom. It could be pulled off.' },
      c_alpha: { site: 'C', polarity: 'giver', strength: 2, clearance: 8, note: 'Almost neutral. Strip the piece sitting above it and this becomes the strongest giver here.' },
      blue_target: { site: 'D', polarity: 'taker', strength: 8, clearance: 8, note: 'Hungry, and waiting for a giver strong enough to reach it.' }
    }
  },
  {
    shape: 'LEAVE FIRST',
    title: 'Stage 19 — Leave, Then Fill',
    prompt: 'Every chamber so far has been add-first, then drop. This one is the exception. Scan it and work out why it has to run the other way round.',
    hints: [
      'Scan the center and read its CLEARANCE. Is there actually room for anything to move in right now?',
      'The seat is full and the approach is sealed. Nothing can add until the current occupant has left.',
      'Step 1: the red piece on the right to the blue site beyond it. Step 2: the red site on the far left into the center it just emptied.'
    ],
    conceptTiming: 'reward',
    concept: {
      badge: 'WHAT YOU JUST FOUND',
      title: 'SOMETIMES THE SEAT HAS TO EMPTY FIRST',
      intro: 'Whether a piece leaves before or after the newcomer arrives is decided by room, not preference.',
      pills: [
        { type: 'warning-pill', html: 'A crowded center has nowhere to put an incoming piece, so the old one leaves first and the seat sits briefly empty.' }
      ],
      action: 'That is why CLEARANCE is worth scanning even when you already know the pairing.'
    },
    scans: {
      red_cl: { site: 'A', polarity: 'giver', strength: 8, clearance: 8, note: 'Attached to the center and already half-loose.' },
      blue_scavenger: { site: 'B', polarity: 'taker', strength: 9, clearance: 9, note: 'Waiting on the far right to catch whatever comes off.' },
      red_water: { site: 'C', polarity: 'giver', strength: 6, clearance: 9, note: 'A modest giver on the left, with nowhere to go yet.' },
      blue_carbocation: { site: 'D', polarity: 'taker', strength: 4, clearance: 2, note: 'Full seat, no clearance. Nothing can move in here until it empties.' }
    }
  },
  {
    shape: 'FINAL RUN',
    title: 'Stage 20 — Grand Finish',
    prompt: 'Last chamber. Six sites, two arrows, and no new rules — everything you need you already worked out. Survey it and finish the run.',
    hints: [
      'Start with the question you have asked nineteen times: what can actually react right now, and what needs waking up first?',
      'The scaffold in the middle is too sluggish as it stands. The small helper on the upper left is what changes that.',
      'Step 1: the red site upper left to the small blue site beside it. Step 2: the red site lower left into the blue center of the scaffold.'
    ],
    scans: {
      red_cat: { site: 'A', polarity: 'giver', strength: 9, clearance: 9, note: 'A small, strong helper off to one side. It does not stay attached for long.' },
      blue_proton: { site: 'B', polarity: 'taker', strength: 9, clearance: 8, note: 'A tiny hungry site on the scaffold. The cheapest move available.' },
      red_core: { site: 'C', polarity: 'giver', strength: 8, clearance: 9, note: 'The core piece, waiting on the left. Strong, but the scaffold has to want it first.' },
      blue_c_scaffold: { site: 'D', polarity: 'taker', strength: 5, clearance: 7, note: 'The center of the scaffold. Sluggish now — it gets much hungrier once the helper lands.' },
      bond_leave: { site: 'E', polarity: 'taker', strength: 3, clearance: 6, note: 'A connection under mild tension. It gives way on its own once the center is loaded.' },
      red_depart: { site: 'F', polarity: 'giver', strength: 7, clearance: 8, note: 'The piece on its way out. It is a passenger here, not a move you have to draw.' }
    }
  }
];

/**
 * Fold the copy layer onto the structural configs above. `hint` is kept as an alias
 * for the free first rung so the backend's single hint_text column and anything else
 * reading the old field still work.
 */
STAGE_COPY.forEach((copy, i) => {
  const cfg = STAGE_CONFIGS[i];
  if (!cfg) return;
  Object.assign(cfg, copy);
  cfg.hint = copy.hints[0];
  if (!cfg.conceptTiming) cfg.conceptTiming = 'reward';
});

/** Stage count and full-quest XP, derived from the configs above. */
export const TOTAL_STAGES = STAGE_CONFIGS.length;
export const TOTAL_QUEST_XP = STAGE_CONFIGS.reduce((sum, s) => sum + (s.xp || 0), 0);

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

/* ------------------------------------------------------------------------- *
 * Scan readouts and miss diagnostics
 * ------------------------------------------------------------------------- */

/** The scan readout for one site on one stage, or null if it has none. */
export function scanFor(stageIndex, regionId) {
  const cfg = STAGE_CONFIGS[stageIndex];
  if (!cfg || !cfg.scans) return null;
  const s = cfg.scans[regionId];
  return s ? { id: regionId, ...s } : null;
}

/** Every scan on a stage, in the order the sites are lettered. */
export function scansForStage(stageIndex) {
  const cfg = STAGE_CONFIGS[stageIndex];
  if (!cfg || !cfg.scans) return [];
  return Object.entries(cfg.scans)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => String(a.site).localeCompare(String(b.site)));
}

/** Which sites a stage expects to be connected, flattened across steps. */
function solutionSites(cfg) {
  if (cfg.multiArrow && cfg.steps) {
    return cfg.steps.flatMap(s => [s.expectedFrom, s.expectedTo]);
  }
  return [cfg.expectedFrom, cfg.expectedTo];
}

/**
 * Turn a wrong answer into a sentence that names what physically went wrong.
 *
 * A miss is the most teachable moment in the stage, so "NOT QUITE" is a wasted one.
 * Every branch here points the player at something they can go and scan.
 *
 * @param {number} stageIndex
 * @param {object} payload the same payload that was graded
 * @param {object} result   the result from evaluateStageLocally
 * @returns {{ title: string, message: string, soft: boolean }}
 */
export function diagnoseMiss(stageIndex, payload, result = {}) {
  const cfg = STAGE_CONFIGS[stageIndex] || STAGE_CONFIGS[0];
  const scan = (id) => (id && cfg.scans ? cfg.scans[id] : null);

  if (result.incomplete) {
    return {
      title: 'NOT FINISHED',
      message: result.message || `This chamber takes ${(cfg.steps || []).length || 2} arrows.`,
      soft: true
    };
  }

  if (result.wrongOrder) {
    return {
      title: 'RIGHT MOVES, WRONG ORDER',
      message: 'Both moves are correct — they just cannot happen in that sequence. Click an arrow\'s number badge to swap the steps.',
      soft: true
    };
  }

  // The arrows the player actually drew, single- and multi-arrow alike.
  const drawn = cfg.multiArrow
    ? (payload?.arrows || [])
    : (payload?.from || payload?.to ? [{ from: payload.from, to: payload.to }] : []);

  // 1. Polarity mistakes — the most common and the most worth naming.
  for (const arr of drawn) {
    const from = scan(arr.from);
    const to = scan(arr.to);
    if (from && to) {
      if (from.polarity === 'giver' && to.polarity === 'giver') {
        return {
          title: 'TWO GIVERS',
          message: `Site ${from.site} and site ${to.site} both have charge to spare. Two negatives push each other apart — nothing will connect.`,
          soft: false
        };
      }
      if (from.polarity === 'taker' && to.polarity === 'taker') {
        return {
          title: 'TWO TAKERS',
          message: `Site ${from.site} and site ${to.site} are both short of charge. Neither one has anything to give the other.`,
          soft: false
        };
      }
      if (from.polarity === 'taker' && to.polarity === 'giver') {
        return {
          title: 'BACKWARDS',
          message: `Charge travels out of the site that has extra and into the site that wants more — so this arrow is pointing the wrong way. Try it from site ${to.site} to site ${from.site}.`,
          soft: false
        };
      }
    }
  }

  // 2. Aimed at a site nothing can physically reach.
  if (result.blocked) {
    const blocked = scan(cfg.blockedAnchor);
    return {
      title: 'PATH BLOCKED',
      message: blocked
        ? `Site ${blocked.site} scans ${blocked.clearance}/10 for clearance. It is hungry, but there is no way in — its neighbours are in the way.`
        : 'That target is fenced in by its neighbours. Rotate the chamber and find the site that is actually open.',
      soft: false
    };
  }
  for (const arr of drawn) {
    const to = scan(arr.to);
    if (to && to.clearance <= 3) {
      return {
        title: 'PATH BLOCKED',
        message: `Site ${to.site} scans ${to.clearance}/10 for clearance. Nothing can squeeze in there, however hungry it is.`,
        soft: false
      };
    }
  }

  // 3. Right idea, wrong sites — say which reading was the giveaway.
  const wanted = solutionSites(cfg).map(scan).filter(Boolean);
  for (const arr of drawn) {
    const from = scan(arr.from);
    const to = scan(arr.to);
    if (!from || !to) continue;

    const bestGiver = wanted.find(s => s.polarity === 'giver');
    const bestTaker = wanted.find(s => s.polarity === 'taker');

    if (bestGiver && from.polarity === 'giver' && from.strength < bestGiver.strength) {
      return {
        title: 'TOO WEAK TO FIRE',
        message: `Site ${from.site} only scans ${from.strength}/10 for charge. Something in this chamber pushes harder — scan the other givers and compare.`,
        soft: false
      };
    }
    if (bestTaker && to.polarity === 'taker' && to.strength < bestTaker.strength) {
      return {
        title: 'TOO WEAK TO FIRE',
        message: `Site ${to.site} only scans ${to.strength}/10 for charge. It is not short enough to pull anything in — something else here is hungrier.`,
        soft: false
      };
    }
  }

  // 4. The drag never landed on a site at all.
  if (drawn.length > 0 && drawn.every(a => !a.from && !a.to)) {
    return {
      title: 'NO SITE SELECTED',
      message: 'That line did not start or finish on a glowing site. Drag between the clouds themselves — tap one first if you want to scan it.',
      soft: true
    };
  }

  return {
    title: 'NOT QUITE',
    message: result.message || 'That pairing will not react. Scan the sites you have not looked at yet and compare their numbers.',
    soft: false
  };
}
