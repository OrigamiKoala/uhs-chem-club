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
    sourcePos: [-1.4, 0.2, 0.0],
    targetPos: [1.8, 0.0, 0.0],
    tolerance: 0.85,
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
      // The flat cation puckers as the oxygen lands; C–O–H settles to a bent shape.
      bend: [
        { center: 2, toward: 0, atoms: [3, 4, 5], angle: 109.5 },
        { center: 0, toward: 2, atoms: [1], angle: 109 }
      ],
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
    sourcePos: [-1.5, 0.3, 0.0],
    targetPos: [1.1, 0.0, 0.0],
    tolerance: 0.85,
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 4,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7, 8],
      targetBondLength: 1.40,
      leavingBond: { from: 4, to: 5 },
      leavingAtom: 5,
      departDirection: [1, 0, 0],
      // Backside attack turns the three C–H bonds inside out.
      bend: [{ center: 4, toward: 0, atoms: [6, 7, 8], angle: 109.5 }],
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
    sourcePos: [-0.8, -1.2, 0.0],
    targetPos: [1.3, -0.3, 0.0],
    tolerance: 0.85,
    concept: null,
    reaction: {
      donorAtom: 3,
      acceptorAtom: 6,
      clusterLeft: [0, 1, 2, 3, 4, 5],
      clusterRight: [6, 7, 8, 9, 10],
      targetBondLength: 1.40,
      openDoubleBond: { from: 6, to: 7 },
      leavingBond: null,
      leavingAtom: null,
      bend: [{ center: 6, toward: 3, atoms: [7, 8, { atom: 9, carry: [10] }], angle: 109.5 }],
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
    sourcePos: [-0.4, -0.4, 0.0],
    targetPos: [1.15, -0.3, 0.0],
    tolerance: 0.85,
    concept: null,
    reaction: {
      donorAtom: 3,
      acceptorAtom: 8,
      clusterLeft: [0, 1, 2, 3, 4, 5],
      clusterRight: [6, 7, 8, 9, 10],
      targetBondLength: 1.45,
      openDoubleBond: { from: 8, to: 9 },
      leavingBond: null,
      leavingAtom: null,
      bend: [{ center: 8, toward: 3, atoms: [9, { atom: 7, carry: [6] }, 10], angle: 109.5 }],
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
    sourcePos: [-1.4, 0.2, 0.0],
    targetPos: [1.0, -1.0, 0.0],
    blockedAnchor: 'blue_blocked',
    blockedPos: [2.0, 1.1, 0.0],
    tolerance: 0.85,
    concept: null,
    reaction: {
      donorAtom: 1,
      acceptorAtom: 4,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      targetBondLength: 1.40,
      leftRatio: 1,
      rightRatio: 0,
      leavingBond: { from: 4, to: 5 },
      leavingAtom: 5,
      departDirection: [1, -0.46, 0],
      bend: [{ center: 4, toward: 1, atoms: [6, 7], angle: 112 }],
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
    sourcePos: [-1.5, 0.2, 0.0],
    targetPos: [1.6, -0.9, 0.0],
    blockedAnchor: 'blue_blocked',
    blockedPos: [1.8, 1.2, 0.0],
    tolerance: 0.85,
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      targetBondLength: 1.40,
      leftRatio: 1,
      rightRatio: 0,
      openDoubleBond: { from: 2, to: 3 },
      leavingBond: null,
      leavingAtom: null,
      bend: [
        { center: 2, toward: 0, atoms: [3, 4], angle: 109.5 },
        { center: 0, toward: 2, atoms: [1], angle: 109 }
      ],
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
    sourcePos: [-0.4, 0.0, 0.0],
    targetPos: [1.6, -0.8, 0.0],
    blockedAnchor: 'blue_caged',
    blockedPos: [2.0, 1.2, 0.0],
    tolerance: 0.85,
    concept: null,
    reaction: {
      donorAtom: 4,
      acceptorAtom: 5,
      clusterLeft: [0, 1, 2, 3, 4],
      clusterRight: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      targetBondLength: 1.40,
      openDoubleBond: { from: 5, to: 6 },
      leavingBond: null,
      leavingAtom: null,
      bend: [{ center: 5, toward: 4, atoms: [6, 7], angle: 109.5 }],
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
    sourcePos: [-2.2, 0.7, 0.0],
    targetPos: [-0.2, 0.4, 0.0],
    tolerance: 0.85,
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 3,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5],
      targetBondLength: 0.95,
      leavingBond: { from: 2, to: 3 },
      leavingAtom: null,
      // The new water keeps the hydrogen and backs away bent; the old one stays.
      departures: [{ atoms: [0, 1, 3], direction: [-1, 0.2, 0], distance: 1.2 }],
      bend: [{ center: 0, toward: 3, atoms: [1], angle: 104.5 }],
      explanation: 'Connected! The shared piece hopped across to its new partner while the bystander just watched.'
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
    sourcePos: [-1.0, 1.8, 0.0],
    targetPos: [1.2, 0.0, 0.0],
    tolerance: 0.85,
    concept: null,
    reaction: {
      donorAtom: 2,
      acceptorAtom: 9,
      clusterLeft: [0, 1, 2, 3, 4],
      clusterRight: [9, 10, 11, 12, 13, 14],
      targetBondLength: 1.40,
      leavingBond: null,
      leavingAtom: null,
      bend: [{ center: 9, toward: 2, atoms: [11, 12, { atom: 10, carry: [13, 14] }], angle: 109.5 }],
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
    sourcePos: [-2.2, 1.2, 0.0],
    targetPos: [0.3, -0.6, 0.0],
    tolerance: 0.85,
    concept: null,
    reaction: {
      donorAtom: 0,
      acceptorAtom: 6,
      clusterLeft: [0, 1, 2],
      clusterRight: [3, 4, 5, 6],
      targetBondLength: 1.0,
      leavingBond: { from: 4, to: 6 },
      leavingAtom: null,
      // Ammonia leaves with the hydrogen; the methoxide stays facing the C–Br.
      departures: [{ atoms: [0, 1, 2, 6], direction: [-0.865, 0.502, 0], distance: 1.4 }],
      bend: [{ center: 0, toward: 6, atoms: [1, 2], angle: 108 }],
      explanation: 'Relay complete! The shared piece hopped across to its new partner so the target is ready for the next move.'
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
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0.0], targetPos: [1.2, 0.0, 0.0] },
      { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger', sourcePos: [3.1, 0.0, 0.0], targetPos: [4.0, 0.8, 0.0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          // Halfway point: O–C bond forming, C–Cl still attached, C–H bonds flat.
          donorAtom: 0,
          acceptorAtom: 2,
          clusterLeft: [0, 1],
          clusterRight: [2, 3, 4, 5, 6],
          targetBondLength: 1.45,
          partialBond: true,
          weakenBond: { from: 2, to: 3 },
          bend: [
            { center: 2, toward: 0, atoms: [4, 5, 6], angle: 90 },
            { center: 0, toward: 2, atoms: [1], angle: 109 }
          ],
          duration: 1400
        },
        {
          // Chloride leaves and is captured by the H+ as H–Cl; the C–H bonds finish flipping.
          donorAtom: 3,
          acceptorAtom: 7,
          clusterLeft: [3],
          clusterRight: [7],
          leftRatio: 0.3,
          rightRatio: 0.7,
          targetBondLength: 1.0,
          leavingBond: { from: 2, to: 3 },
          completeBond: { from: 0, to: 2 },
          leavingCluster: [3, 7],
          departDirection: [1, 0.35, 0],
          departDistance: 1.6,
          bend: [{ center: 2, toward: 0, atoms: [4, 5, 6], angle: 109.5 }],
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
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0.0], targetPos: [1.2, 0.0, 0.0] },
      { order: 2, expectedFrom: 'red_o', expectedTo: 'blue_h', sourcePos: [1.95, 1.15, 0.0], targetPos: [3.18, 1.75, 0.0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 1,
          acceptorAtom: 4,
          clusterLeft: [0, 1, 2, 3],
          clusterRight: [4, 5, 6, 7],
          leftRatio: 1,
          rightRatio: 0,
          targetBondLength: 1.40,
          openDoubleBond: { from: 4, to: 5 },
          bend: [
            { center: 4, toward: 1, atoms: [5, 6, 7], angle: 109.5 },
            { center: 1, toward: 4, atoms: [{ atom: 0, carry: [2, 3] }], angle: 112 }
          ],
          duration: 1400
        },
        {
          // The new O- takes the water's hydrogen; hydroxide drifts off.
          donorAtom: 5,
          acceptorAtom: 8,
          clusterLeft: [0, 1, 2, 3, 4, 5, 6, 7],
          clusterRight: [8, 9, 10],
          leftRatio: 0.15,
          rightRatio: 0.85,
          targetBondLength: 0.95,
          leavingBond: { from: 8, to: 9 },
          leavingCluster: [9, 10],
          departDirection: [0.8, 0.6, 0],
          departDistance: 1.4,
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
      { order: 1, expectedFrom: 'red_base1', expectedTo: 'blue_h1', sourcePos: [-2.0, 0.4, 0.0], targetPos: [-0.8, 0.4, 0.0] },
      { order: 2, expectedFrom: 'red_base2', expectedTo: 'blue_h2', sourcePos: [1.8, -0.6, 0.0], targetPos: [3.1, -0.4, 0.0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 0,
          acceptorAtom: 3,
          clusterLeft: [0, 1, 2],
          clusterRight: [3, 4, 5, 12],
          targetBondLength: 0.95,
          leavingBond: { from: 3, to: 4 },
          leavingCluster: [4, 5, 12],
          departDirection: [0.5, 1, 0],
          departDistance: 1.4,
          duration: 1400
        },
        {
          donorAtom: 6,
          acceptorAtom: 9,
          clusterLeft: [6, 7, 8],
          clusterRight: [9, 10, 11, 13],
          targetBondLength: 0.95,
          leavingBond: { from: 9, to: 10 },
          leavingCluster: [10, 11, 13],
          departDirection: [1, 0, 0],
          departDistance: 1.4,
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
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0.0], targetPos: [1.2, 0.0, 0.0] },
      { order: 2, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger', sourcePos: [2.1, -0.55, 1.2], targetPos: [3.25, -0.45, 1.2] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 1,
          acceptorAtom: 4,
          clusterLeft: [0, 1, 2, 3],
          clusterRight: [4, 5, 6, 7, 8, 9],
          targetBondLength: 1.40,
          openDoubleBond: { from: 4, to: 5 },
          bend: [
            { center: 4, toward: 1, atoms: [5, 6, { atom: 7, carry: [8, 9] }], angle: 109.5 },
            { center: 1, toward: 4, atoms: [{ atom: 0, carry: [2, 3] }], angle: 112 }
          ],
          duration: 1400
        },
        {
          // The C=O closes again, chloride leaves and is captured as H–Cl, and the
          // carbon flattens back out with the new group in its plane.
          closeDoubleBond: { from: 4, to: 5 },
          donorAtom: 6,
          acceptorAtom: 10,
          clusterLeft: [6],
          clusterRight: [10],
          leftRatio: 0.3,
          rightRatio: 0.7,
          targetBondLength: 1.0,
          leavingBond: { from: 4, to: 6 },
          leavingCluster: [6, 10],
          departDirection: [0.55, -0.2, 0.8],
          departDistance: 1.6,
          bend: [{ center: 4, toward: 1, atoms: [5, { atom: 7, carry: [8, 9] }], angle: 120 }],
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
      { order: 1, expectedFrom: 'red_o_carbonyl', expectedTo: 'blue_proton', sourcePos: [0.2, 1.5, 0.0], targetPos: [1.6, 1.8, 0.0] },
      { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_activated_c', sourcePos: [-2.1, -0.5, 0.0], targetPos: [0.0, 0.0, 0.0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 4,
          acceptorAtom: 8,
          clusterLeft: [3, 4, 5, 6],
          clusterRight: [7, 8, 9, 10],
          leftRatio: 0.15,
          rightRatio: 0.85,
          targetBondLength: 0.95,
          leavingBond: { from: 7, to: 8 },
          leavingCluster: [7, 9, 10],
          departDirection: [1, 0.4, 0],
          departDistance: 1.4,
          duration: 1500
        },
        {
          donorAtom: 0,
          acceptorAtom: 3,
          clusterLeft: [0, 1, 2],
          clusterRight: [3, 4, 5, 6, 8],
          targetBondLength: 1.45,
          openDoubleBond: { from: 3, to: 4 },
          bend: [{ center: 3, toward: 0, atoms: [{ atom: 4, carry: [8] }, 5, 6], angle: 109.5 }],
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
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-2.2, 0.4, 0.0], targetPos: [0.0, 0.0, 0.0] },
      { order: 2, expectedFrom: 'red_ethoxide', expectedTo: 'blue_proton', sourcePos: [0.75, -0.55, 1.1], targetPos: [1.1, 0.18, 1.15] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          donorAtom: 0,
          acceptorAtom: 2,
          clusterLeft: [0, 1],
          clusterRight: [2, 3, 4, 5, 6, 7],
          targetBondLength: 1.40,
          openDoubleBond: { from: 2, to: 3 },
          bend: [
            { center: 2, toward: 0, atoms: [3, 4, { atom: 5, carry: [6, 7] }], angle: 109.5 },
            { center: 0, toward: 2, atoms: [1], angle: 109 }
          ],
          duration: 1400
        },
        {
          // The C=O closes, the ethoxide tail breaks off and takes the water's
          // hydrogen (leaving as ethanol), and hydroxide drifts away.
          closeDoubleBond: { from: 2, to: 3 },
          donorAtom: 5,
          acceptorAtom: 8,
          clusterLeft: [5, 6, 7],
          clusterRight: [8, 9, 10],
          leftRatio: 0.3,
          rightRatio: 0.7,
          targetBondLength: 0.95,
          leavingBond: [{ from: 2, to: 5 }, { from: 8, to: 9 }],
          departures: [
            { atoms: [5, 6, 7, 8], direction: [0.35, -0.55, 0.75], distance: 1.4 },
            { atoms: [9, 10], direction: [0.6, 0.8, 0], distance: 1.3 }
          ],
          bend: [{ center: 2, toward: 0, atoms: [3, 4], angle: 120 }],
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
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c_ring', sourcePos: [-2.1, -0.25, 0.0], targetPos: [0.7, -0.5, 0.0] },
      { order: 2, expectedFrom: 'red_o_ring', expectedTo: 'blue_proton', sourcePos: [2.35, -0.2, 0.0], targetPos: [3.24, 1.91, 0.0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          // Backside attack on the ring carbon: its C–O bond breaks, the two C–H
          // bonds flip, and the freed oxygen swings open to a relaxed angle.
          donorAtom: 0,
          acceptorAtom: 2,
          clusterLeft: [0, 1],
          clusterRight: [2, 3, 4, 5, 6, 10],
          targetBondLength: 1.40,
          leavingBond: { from: 2, to: 4 },
          bend: [
            { center: 2, toward: 0, atoms: [5, 10], angle: 110 },
            { center: 3, toward: 2, atoms: [4], angle: 110 },
            { center: 0, toward: 2, atoms: [1], angle: 109 }
          ],
          duration: 1400
        },
        {
          donorAtom: 4,
          acceptorAtom: 7,
          clusterLeft: [0, 1, 2, 3, 4, 5, 6, 10],
          clusterRight: [7, 8, 9],
          leftRatio: 0.15,
          rightRatio: 0.85,
          targetBondLength: 0.95,
          leavingBond: { from: 7, to: 8 },
          leavingCluster: [8, 9],
          departDirection: [1, 0.4, 0],
          departDistance: 1.4,
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
      { order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h_alpha', sourcePos: [-2.3, 1.85, 0.0], targetPos: [-1.3, 1.1, 0.0] },
      { order: 2, expectedFrom: 'c_alpha', expectedTo: 'blue_target', sourcePos: [-0.22, 0.29, 0.0], targetPos: [1.35, -0.85, 0.0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          // The base takes the hydrogen and leaves as ammonia; the carbon left
          // behind flattens so its free side lines up with the C=O.
          donorAtom: 0,
          acceptorAtom: 3,
          clusterLeft: [0, 1, 8],
          clusterRight: [2, 3, 4, 5],
          targetBondLength: 1.0,
          leavingBond: { from: 2, to: 3 },
          leavingCluster: [0, 1, 3, 8],
          departDirection: [-0.8, 0.6, 0],
          departDistance: 1.6,
          bend: [{ center: 2, toward: 0, atoms: [{ atom: 4, carry: [5] }], angle: 90 }],
          duration: 1400
        },
        {
          // The carbon attacks CH3–Br from the far face, backside to the bromine.
          donorAtom: 2,
          acceptorAtom: 6,
          clusterLeft: [2, 4, 5],
          clusterRight: [6, 7],
          targetBondLength: 1.40,
          leavingBond: { from: 6, to: 7 },
          leavingCluster: [7],
          departDirection: [0.8, -0.6, 0],
          departDistance: 2.0,
          bend: [{ center: 2, toward: 6, atoms: [{ atom: 4, carry: [5] }], angle: 109.5 }],
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
      { order: 1, expectedFrom: 'red_cl', expectedTo: 'blue_scavenger', sourcePos: [2.5, 0.0, 0.0], targetPos: [4.0, 0.0, 0.0] },
      { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_carbocation', sourcePos: [-2.1, 0.0, 0.0], targetPos: [0.8, 0.0, 0.0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          // Chloride leaves (captured by the H+ as H–Cl); the center flattens.
          donorAtom: 1,
          acceptorAtom: 8,
          clusterLeft: [1],
          clusterRight: [8],
          leftRatio: 0.1,
          rightRatio: 0.9,
          targetBondLength: 1.0,
          leavingBond: { from: 0, to: 1 },
          leavingCluster: [1, 8],
          departDirection: [1, 0, 0],
          departDistance: 1.6,
          bend: [{ center: 0, toward: 1, atoms: [2, 3, 4], angle: 90 }],
          duration: 1500
        },
        {
          // Water lands on the open face and the center puckers again.
          donorAtom: 5,
          acceptorAtom: 0,
          clusterLeft: [5, 6, 7],
          clusterRight: [0, 2, 3, 4],
          targetBondLength: 1.45,
          bend: [{ center: 0, toward: 5, atoms: [2, 3, 4], angle: 109.5 }],
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
      { order: 1, expectedFrom: 'red_cat', expectedTo: 'blue_proton', sourcePos: [-1.0, 1.5, 0.0], targetPos: [-1.83, 2.02, 0.0] },
      { order: 2, expectedFrom: 'red_core', expectedTo: 'blue_c_scaffold', sourcePos: [-1.6, -1.13, 0.0], targetPos: [-0.45, -0.05, 0.0] }
    ],
    concept: null,
    reaction: {
      steps: [
        {
          // The C=O oxygen takes a hydrogen from hydronium; water drifts off.
          donorAtom: 5,
          acceptorAtom: 1,
          clusterLeft: [4, 5, 6, 7],
          clusterRight: [0, 1, 8, 9],
          leftRatio: 0.15,
          rightRatio: 0.85,
          targetBondLength: 0.95,
          leavingBond: { from: 0, to: 1 },
          leavingCluster: [0, 8, 9],
          departDirection: [-0.8, 0.55, 0],
          departDistance: 1.3,
          duration: 1400
        },
        {
          // The amine meets the activated carbon face-on and bromide leaves; the
          // carbon ends flat again with the nitrogen in its plane.
          donorAtom: 2,
          acceptorAtom: 4,
          clusterLeft: [2, 3],
          clusterRight: [1, 4, 5, 6, 7],
          targetBondLength: 1.40,
          leavingBond: { from: 4, to: 7 },
          leavingCluster: [7],
          departDirection: [0.55, -0.1, 0.8],
          departDistance: 2.0,
          bend: [{ center: 4, toward: 2, atoms: [{ atom: 5, carry: [1] }, 6], angle: 120 }],
          duration: 1400
        }
      ],
      explanation: 'Mission accomplished! The helper woke the structure, the core piece attached, and the old piece cleared out. All 20 stages solved.'
    }
  }
];

/* ------------------------------------------------------------------------- *
 * STAGE_COPY — prompts, hints, and explanations for Quest 1.
 *
 * `hints` is a ladder: [nudge, narrow, solution]. The nudge is free; the rest are
 * earned by missing.
 * ------------------------------------------------------------------------- */
const STAGE_COPY = [
  {
    shape: 'FIRST CONTACT',
    title: 'Stage 1 — Target Lock',
    prompt: 'Two sites are glowing. Drag an arrow from the red giver to the blue receiver.',
    hints: [
      'Charge travels from negative (red) to positive (blue). Look at the colors.',
      'Start on the red site with extra charge, and connect to the blue site that needs it.',
      'Drag from the red cloud on the left to the blue spot on the right.'
    ],
    conceptTiming: 'intro',
    concept: {
      badge: 'BASICS',
      title: 'OPPOSITES ATTRACT',
      intro: 'Opposite charges pull together: red donates charge, blue receives it.',
      pills: [
        { type: 'red-pill', html: '<strong>Red:</strong> Negative donor' },
        { type: 'blue-pill', html: '<strong>Blue:</strong> Positive receiver' }
      ],
      action: 'Drag an arrow from red to blue to trigger the reaction.'
    }
  },
  {
    shape: 'DISPLACEMENT',
    title: 'Stage 2 — Making Room',
    prompt: 'The blue center already has an attached group. Connect the red giver to the blue center to displace it.',
    hints: [
      'The blue center can only hold so many bonds. Adding a new bond will push the old group out.',
      'Start at the red giver on the left and target the blue center. The attached group will leave.',
      'Drag from the red cloud on the left into the blue center. The old piece gets pushed out.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'SURVEY',
    title: 'Stage 3 — Four Live Sites',
    prompt: 'Four sites are glowing. Connect the brightest red giver to the deepest blue receiver.',
    hints: [
      'Look at the brightness of the charges. The strongest pair reacts before the weaker ones.',
      'Find the brightest red spot and the deepest blue spot. Ignore the faint spots.',
      'Drag from the bright red site low on the left to the bright blue site just right of center.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'DECOYS',
    title: 'Stage 4 — Decoys',
    prompt: 'Four sites are present, and two are decoys. Connect the strongest red giver to the strongest blue receiver.',
    hints: [
      'Compare the brightness of the sites. The strongest pair will react first.',
      'Ignore the pale, faint spots. Connect the most intense red spot to the most intense blue spot.',
      'Drag from the bright red site near the middle-left to the bright blue site to its right.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'THE TRAP',
    title: 'Stage 5 — The Trap',
    prompt: 'Two blue sites pull equally, but one is blocked. Rotate the chamber to find the unblocked route.',
    hints: [
      'Both blue sites pull equally hard. Rotate the view to see which one has an open approach.',
      'Surrounding atoms physically block the upper blue site. Target the exposed blue site instead.',
      'Drag from the red cloud on the left down to the lower blue site. The upper one is walled in.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'THE TRAP AGAIN',
    title: 'Stage 6 — Fenced In',
    prompt: 'Bulky groups surround the upper site. Rotate the chamber to connect to the open blue site below.',
    hints: [
      'Look closely at the atoms around each blue site. One is crowded and one is out in the open.',
      'The upper site is completely fenced in by its neighbors. The lower-right site is exposed.',
      'Drag from the red cloud on the left to the lower-right blue site.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'FULL SURVEY',
    title: 'Stage 7 — Six Sites, One Answer',
    prompt: 'Six sites are visible. Connect the strongest red giver to the open, unblocked blue receiver.',
    hints: [
      'Find the brightest red spot. For the blue target, it must be both hungry and unblocked.',
      'One blue site is strong but caged, and another is open but weak. Pick the one that is both strong and open.',
      'Drag from the bright red site near the center to the open blue site below and to the right.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'THE BYSTANDER',
    title: 'Stage 8 — Three in the Chamber',
    prompt: 'Three molecules are present. Connect the active red giver to the blue receiver, ignoring the bystander.',
    hints: [
      'One of the three molecules is inactive and barely glowing. Ignore it.',
      'The reacting pair is on the left. The molecule on the right is an unreactive bystander.',
      'Drag from the red site on the far left to the blue site just to its right.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'THE RACE',
    title: 'Stage 9 — The Race',
    prompt: 'Two red givers compete for one blue receiver. Connect the stronger giver to the target.',
    hints: [
      'Both red givers are aimed at the same blue receiver. Compare their intensity.',
      'The brighter, more intense red giver reacts first. Connect that one to the blue center.',
      'Drag from the upper red site to the blue site in the middle.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'THE SETUP',
    title: 'Stage 10 — Warm-Up Act',
    prompt: 'The main structure is unreactive on its own. Transfer to the helper site first to activate it.',
    hints: [
      'The large molecule on the right is not reactive enough yet. It needs to be activated first.',
      'There is a small, hungry site between the two larger molecules. Connect to that site first.',
      'Drag from the red site on the far left to the small blue site near the center.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'TWO MOVES',
    title: 'Stage 11 — One In, One Out',
    prompt: 'Draw two arrows in sequence. Attach the incoming piece first, then displace the leaving piece.',
    hints: [
      'Decide which step must happen first. The leaving piece cannot depart until the newcomer arrives.',
      'Step 1 adds the new piece to the center; step 2 sends the old group away to the scavenger.',
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
      action: 'Draw all arrows in order.'
    },
  },
  {
    shape: 'SWING OPEN',
    title: 'Stage 12 — The Double Link',
    prompt: 'Two atoms share a double bond. Push into the center first to swing the double bond open. Two arrows.',
    hints: [
      'Attack the center first. The incoming bond forces the double bond to open up.',
      'The push into the center comes first; opening the double bond follows immediately after.',
      'Step 1: the red site on the left into the blue center. Step 2: the red site above it into the small blue site at the top right.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'RELAY',
    title: 'Stage 13 — Passing It Along',
    prompt: 'Transfer the piece across the chamber in two sequential steps. Two arrows.',
    hints: [
      'Look at the two transfer steps. Each arrow moves a loosely held piece to its partner.',
      'Work from left to right: the first handoff must complete before the second can begin.',
      'Step 1: the red site on the far left to the blue site beside it. Step 2: the red site right of center to the blue site at the far right.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'ADD, THEN DROP',
    title: 'Stage 14 — Add, Then Drop',
    prompt: 'The center is occupied. Add the new piece first, then expel the old group. Two arrows.',
    hints: [
      'Attack the center first to attach the new group, then release the leaving group.',
      'The newcomer connects in step 1, forcing the leaving piece to depart in step 2.',
      'Step 1: the red site on the left into the blue center. Step 2: the red piece on the right into the blue site beyond it.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'WAKE IT UP',
    title: 'Stage 15 — Wake It Up First',
    prompt: 'The main center is unreactive. Transfer to the helper site first to activate it, then attack. Two arrows.',
    hints: [
      'The giver on the left cannot attack the center directly until the center is activated.',
      'Step 1 bonds to the top site, pulling charge away from the center so step 2 can proceed.',
      'Step 1: the red site on top of the big molecule to the small blue site beside it. Step 2: the red site on the far left into the center.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'CUT THE TAIL',
    title: 'Stage 16 — Cutting the Tail',
    prompt: 'Attack the center first, then release the leaving tail. Two arrows.',
    hints: [
      'Identify the incoming group and the leaving group. New attachments form before old ones break.',
      'Step 1 connects the newcomer to the center. Step 2 detaches the tail to the nearby receiver.',
      'Step 1: the red site on the left into the blue center. Step 2: the red tail to the small blue site at its upper right.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'UNDER STRAIN',
    title: 'Stage 17 — Ring Opening',
    prompt: 'The three-membered ring is under high strain. Attack a corner to snap it open, then neutralize. Two arrows.',
    hints: [
      'The tight three-membered ring opens when attacked. Step 1 relieves the ring strain.',
      'Step 1 attacks the ring corner. Step 2 connects the opened oxygen end to the receiver.',
      'Step 1: the red site on the left into the lower corner of the ring. Step 2: the red site that pops loose to the small blue site above and right.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'DOMINO',
    title: 'Stage 18 — Domino',
    prompt: 'Remove the outer group first to generate a reactive center, then attack the target. Two arrows.',
    hints: [
      'The middle position becomes reactive only after its attached group is removed.',
      'Step 1 pulls off the top group. Step 2 uses the newly created negative spot to attack the target.',
      'Step 1: the red site on the far left to the small blue site beside it. Step 2: the middle site you just exposed to the blue site on the right.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'LEAVE FIRST',
    title: 'Stage 19 — Leave, Then Fill',
    prompt: 'The crowded center has no room for an incoming group. The leaving group must depart first. Two arrows.',
    hints: [
      'The center is completely blocked. An incoming piece cannot attach until the existing group leaves.',
      'Step 1 removes the leaving group to open up the center. Step 2 captures the vacant center.',
      'Step 1: the red piece on the right to the blue site beyond it. Step 2: the red site on the far left into the center it just emptied.'
    ],
    conceptTiming: 'reward',
    concept: null,
  },
  {
    shape: 'FINAL RUN',
    title: 'Stage 20 — Grand Finish',
    prompt: 'Activate the scaffold with the helper first, then connect the core piece. Two arrows.',
    hints: [
      'The central scaffold is inactive until the small helper donates charge to it.',
      'Step 1 connects the helper to activate the scaffold. Step 2 brings the core piece into the center.',
      'Step 1: the red site upper left to the small blue site beside it. Step 2: the red site lower left into the blue center of the scaffold.'
    ],
    conceptTiming: 'reward',
    concept: null,
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
        // If explicit anchors were targeted and do not match, do not fall back to loose proximity
        return false;
      }
      if (arr.startPos && arr.endPos && step.sourcePos && step.targetPos) {
        const tol = step.tolerance || 0.85;
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
    // Explicit anchors targeted that do not match expected: reject immediately
    // so connecting to neighboring wrong atoms is never accepted by loose coordinates.
    return { correct: false, blocked: false, xpAwarded: 0 };
  }

  // 3. Proximity check on 3D coordinates (when dragging without named discrete anchors)
  if (payload.startPos && payload.endPos) {
    const sPos = payload.startPos;
    const ePos = payload.endPos;

    if (cfg.blockedPos) {
      const distBlocked = dist3D(ePos, cfg.blockedPos);
      if (distBlocked < (cfg.tolerance || 0.85)) {
        return { correct: false, blocked: true, xpAwarded: 0 };
      }
    }

    const startDist = dist3D(sPos, cfg.sourcePos);
    const endDist = dist3D(ePos, cfg.targetPos);
    const tol = cfg.tolerance || 0.85;

    if (startDist <= tol && endDist <= tol) {
      return { correct: true, blocked: false, xpAwarded: cfg.xp };
    }
  }

  return { correct: false, blocked: false, xpAwarded: 0 };
}

/* ------------------------------------------------------------------------- *
 * Miss diagnostics
 * ------------------------------------------------------------------------- */

/**
 * Turn a wrong answer into a clear sentence explaining what happened.
 *
 * @param {number} stageIndex
 * @param {object} payload the same payload that was graded
 * @param {object} result   the result from evaluateStageLocally
 * @returns {{ title: string, message: string, soft: boolean }}
 */
export function diagnoseMiss(stageIndex, payload, result = {}) {
  const cfg = STAGE_CONFIGS[stageIndex] || STAGE_CONFIGS[0];

  if (result.incomplete) {
    return {
      title: 'NOT FINISHED',
      message: result.message || `This stage needs ${(cfg.steps || []).length || 2} arrows.`,
      soft: true
    };
  }

  if (result.wrongOrder) {
    return {
      title: 'RIGHT MOVES, WRONG ORDER',
      message: 'Both moves are correct, but the sequence is out of order. Click an arrow badge to change its number.',
      soft: true
    };
  }

  const drawn = cfg.multiArrow
    ? (payload?.arrows || [])
    : (payload?.from || payload?.to ? [{ from: payload.from, to: payload.to }] : []);

  const getPolarity = (id) => {
    if (!id) return null;
    const reg = (cfg.regions || []).find(r => r.id === id);
    if (reg?.type) return reg.type === 'red' ? 'giver' : 'taker';
    return String(id).startsWith('red') ? 'giver' : 'taker';
  };

  // 1. Polarity mistakes
  for (const arr of drawn) {
    const fromPol = getPolarity(arr.from);
    const toPol = getPolarity(arr.to);
    if (fromPol && toPol) {
      if (fromPol === 'giver' && toPol === 'giver') {
        return {
          title: 'TWO GIVERS',
          message: 'Both sites carry negative charge. Two negative regions push each other apart.',
          soft: false
        };
      }
      if (fromPol === 'taker' && toPol === 'taker') {
        return {
          title: 'TWO TAKERS',
          message: 'Both sites need charge. Neither has spare charge to give.',
          soft: false
        };
      }
      if (fromPol === 'taker' && toPol === 'giver') {
        return {
          title: 'BACKWARDS',
          message: 'Charge moves from negative (red) to positive (blue). Your arrow points the wrong way.',
          soft: false
        };
      }
    }
  }

  // 2. Blocked
  if (result.blocked) {
    return {
      title: 'PATH BLOCKED',
      message: 'That target is blocked by surrounding atoms. Rotate the view to find the open path.',
      soft: false
    };
  }

  // 3. Not on a site
  if (drawn.length > 0 && drawn.every(a => !a.from && !a.to)) {
    return {
      title: 'NO SITE SELECTED',
      message: 'Connect directly between two glowing sites.',
      soft: true
    };
  }

  return {
    title: 'NOT QUITE',
    message: result.message || 'That connection will not react. Connect the strongest red donor to the open blue target.',
    soft: false
  };
}
