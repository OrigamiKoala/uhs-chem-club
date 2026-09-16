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
      badge: 'WELCOME TO MOLECULES',
      title: 'ATOMS & CHARGES: THE BASICS',
      intro: 'Everything in the universe is made of tiny building blocks called <strong>atoms</strong> (the colored balls) linked like LEGO bricks into <strong>molecules</strong>! The glowing clouds show electric energy.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Red = Crowded:</strong> Packed with extra negative electrical energy looking to share.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Blue = Hungry:</strong> An open spot that has room to welcome new energy.'
        }
      ],
      action: '<strong>How to play:</strong> Click and drag your laser line from the <strong>crowded red zone</strong> into the <strong>hungry blue zone</strong> to bring them together!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Bond formed! Carbon had only 3 bonds, so this new C-O bond gives it exactly 4 full bonds (octet satisfied)!'
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
      badge: 'MAGNET POWER',
      title: 'HOW MOLECULES ATTRACT & BOND',
      intro: 'Why do molecules move? Think of refrigerator magnets! Opposite charges pull toward each other across space.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Negative Sparks:</strong> The red cloud is stuffed with tiny negative sparks called <strong>electrons</strong>.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Positive Pull:</strong> The blue center feels a positive tug, pulling the red sparks right in!'
        },
        {
          type: 'warning-pill',
          html: '⚡ <strong>The 4-Bond Rule:</strong> Carbon can ONLY hold 4 bonds at once! Watch what happens to the green chlorine atom when the new bond forms!'
        }
      ],
      action: '<strong>Draw the arrow:</strong> Guide the red sparks into the blue center and watch the reaction snap into place!'
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
      explanation: 'Bond formed! Carbon can never have 5 full bonds at once, so the Chloride atom broke off and flew away!'
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
      badge: 'COLOR RADAR',
      title: 'COMPARING ENERGY LEVELS',
      intro: 'Some molecules have multiple colored spots! When you have several choices, look for the <strong>deepest, brightest colors</strong>.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Deepest Red:</strong> The strongest giver with the most extra sparks.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Deepest Blue:</strong> The strongest pull with the biggest empty room.'
        }
      ],
      action: '<strong>Match extremes:</strong> Connect the <strong>deepest red</strong> spot straight into the <strong>deepest blue</strong> spot!'
    },
    reaction: {
      donorAtom: 3,
      acceptorAtom: 6,
      clusterLeft: [0, 1, 2, 3, 4, 5],
      clusterRight: [6, 7, 8, 9, 10],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Bond formed! The carbonyl double bond shifted to make room, keeping Carbon strictly at 4 bonds!'
    }
  },
  {
    stageIndex: 3,
    title: 'Stage 4 — Competing Sites',
    prompt: 'Ignore weak distractions: find the main power center (brightest red) and route into the deepest blue core.',
    moleculeId: 'stage4_pair',
    xp: 20,
    expectedFrom: 'red_extreme',
    expectedTo: 'blue_extreme',
    sourcePos: [-0.8, -1.2, 0],
    targetPos: [1.3, -0.3, 0],
    tolerance: 1.35,
    concept: {
      badge: 'TARGET PRACTICE',
      title: 'PICK THE STRONGEST SPOT',
      intro: 'Molecules can be tricky with faint spots trying to fool you. Ignore weak light-blue or orange zones!',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Super Red:</strong> The nitrogen center holds the main spark cloud.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Deep Blue Core:</strong> The carbonyl carbon is the hungriest target.'
        }
      ],
      action: '<strong>Trust your radar:</strong> Connect the brightest red power-cloud straight into the primary blue target!'
    },
    reaction: {
      donorAtom: 3,
      acceptorAtom: 8,
      clusterLeft: [0, 1, 2, 3, 4, 5],
      clusterRight: [6, 7, 8, 9, 10],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Bond formed! Nitrogen connected into the carbonyl carbon without exceeding the 4-bond limit!'
    }
  },
  {
    stageIndex: 4,
    title: 'Stage 5 — Steric Hindrance',
    prompt: 'Traffic jam ahead! Trace the molecule\'s path into the open target. Avoid the crowded bumper obstacle!',
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
      badge: 'TRAFFIC JAM!',
      title: 'ATOMS ARE SOLID BUMPERS',
      intro: 'Molecules aren\'t see-through ghosts — atoms are solid like bumper cars! If other atoms block the way, molecules physically crash.',
      pills: [
        {
          type: 'warning-pill',
          html: '⚠️ <strong>Steric Hindrance (Crowding):</strong> One blue target is trapped behind bulky atom clusters. The incoming molecule will crash right into them! Notice also: Bromine must leave so Carbon stays at 4 bonds.'
        }
      ],
      action: '<strong>Find the open door:</strong> Rotate your 3D view (click <strong>Rotate View</strong> or right-click drag). Find the open, uncrowded blue target and connect to it!'
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
      explanation: 'Bond formed! Oxygen docked into the open carbon, and Bromide departed so Carbon never has 5 bonds!'
    }
  },
  {
    stageIndex: 5,
    title: 'Stage 6 — Bulky Group Shielding',
    prompt: 'Bulky atoms are blocking one route like a bodyguard shield. Rotate your view and connect to the open flank!',
    moleculeId: 'stage6_pair',
    xp: 25,
    expectedFrom: 'red_nu',
    expectedTo: 'blue_open',
    sourcePos: [-1.5, 0.2, 0],
    targetPos: [1.6, -0.9, 0],
    blockedAnchor: 'blue_blocked',
    blockedPos: [1.8, 1.2, 0],
    tolerance: 1.35,
    concept: {
      badge: 'BODYGUARD SHIELD',
      title: 'STEER AROUND THE OBSTACLES',
      intro: 'Big groups of atoms act like bodyguards shielding the top target from incoming visitors.',
      pills: [
        {
          type: 'warning-pill',
          html: '⚠️ <strong>Blocked Angle:</strong> Don\'t fly straight into the atom shield or you will bounce off!'
        }
      ],
      action: '<strong>Rotate and aim:</strong> Spin the view to spot the wide-open landing pad on the lower flank!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Bond formed! The molecule slipped right into the open flank, completely dodging the bulky shield!'
    }
  },
  {
    stageIndex: 6,
    title: 'Stage 7 — Final Synthesis Route',
    prompt: 'Master challenge: Find the single strongest red donor and trace an open path into the unhindered blue target!',
    moleculeId: 'stage7_pair',
    xp: 30,
    expectedFrom: 'red_supreme',
    expectedTo: 'blue_accessible',
    sourcePos: [-0.4, 0, 0],
    targetPos: [1.6, -0.8, 0],
    blockedAnchor: 'blue_caged',
    blockedPos: [2.0, 1.2, 0],
    tolerance: 1.35,
    concept: {
      badge: 'MASTER PILOT',
      title: 'THE FINAL SYNTHESIS CHALLENGE',
      intro: 'You\'ve learned the two big rules of the molecular world: find the strongest electric pull, and avoid the traffic jams!',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">1. Champion Donor:</strong> Find the single brightest red cloud.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">2. Clear Landing Pad:</strong> Avoid the caged target; aim for the open door!'
        }
      ],
      action: '<strong>Finish Phase 1:</strong> Draw the trajectory from the master red donor into the unhindered blue target!'
    },
    reaction: {
      donorAtom: 4,
      acceptorAtom: 5,
      clusterLeft: [0, 1, 2, 3, 4],
      clusterRight: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Synthesis complete! Master nucleophile docked into the unhindered target with perfect 4-bond geometry!'
    }
  },
  {
    stageIndex: 7,
    title: 'Stage 8 — Three\'s Company',
    prompt: 'Three molecules in the chamber! Connect the active red giver directly to the hungry blue acid, ignoring the quiet spectator.',
    moleculeId: 'stage8_trio',
    xp: 30,
    expectedFrom: 'red_base',
    expectedTo: 'blue_acid',
    sourcePos: [-2.2, 0.7, 0],
    targetPos: [-0.2, 0.4, 0],
    tolerance: 1.35,
    concept: {
      badge: '3-MOLECULE SCENE',
      title: 'THE QUIET SPECTATOR',
      intro: 'In real chemistry, molecules float in a busy crowd of three or more! Some are energetic dancers, while others just sit back and watch.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Energetic Giver:</strong> The hydroxide ion has extra sparks ready to share.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Hungry Acid:</strong> The acid has an exposed proton eager to bond.'
        },
        {
          type: 'warning-pill',
          html: '⚪ <strong>Quiet Spectator:</strong> The methane molecule on the right has all its spots full. It stays completely out of the reaction!'
        }
      ],
      action: '<strong>Connect the active pair:</strong> Draw your line from the red giver into the blue acid proton. Ignore the bystander!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 3,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5],
      targetBondLength: 1.0,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Acid-base neutralization! Hydroxide grabbed the proton to form water, while methane stayed completely untouched.'
    }
  },
  {
    stageIndex: 8,
    title: 'Stage 9 — The Tug-of-War',
    prompt: 'Two givers want the same blue prize! Connect the super-bright red champion to the hungry blue receiver.',
    moleculeId: 'stage9_trio',
    xp: 30,
    expectedFrom: 'red_strong',
    expectedTo: 'blue_target',
    sourcePos: [-1.0, 1.8, 0],
    targetPos: [1.2, 0, 0],
    tolerance: 1.35,
    concept: {
      badge: '3-MOLECULE SCENE',
      title: 'TWO GIVERS, ONE TARGET',
      intro: 'Imagine two kids sprinting for the last slice of pizza. One is moving at full speed (super red), the other is barely jogging (faint orange).',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Fully Charged (Ethoxide):</strong> Packed with a full negative electric charge.'
        },
        {
          type: 'warning-pill',
          html: '<strong style="color: #ffb74d;">🟠 Neutral & Weak (Methanol):</strong> Much fainter sparks — it loses the race!'
        }
      ],
      action: '<strong>Pick the champion:</strong> Connect the strongest red donor on top straight into the blue target center!'
    },
    reaction: {
      donorAtom: 2,
      acceptorAtom: 9,
      clusterLeft: [0, 1, 2, 3, 4],
      clusterRight: [9, 10, 11, 12, 13, 14],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'The champion won! The fully charged ethoxide outpaced the weak neutral alcohol in the race to bond.'
    }
  },
  {
    stageIndex: 9,
    title: 'Stage 10 — The Team Relay',
    prompt: 'A molecule needs a teammate\'s help! Connect the helper base lone pair into the alcohol\'s blue proton to power it up.',
    moleculeId: 'stage10_trio',
    xp: 35,
    expectedFrom: 'red_base',
    expectedTo: 'blue_proton',
    sourcePos: [-2.2, 1.2, 0],
    targetPos: [0.3, -0.6, 0],
    tolerance: 1.35,
    concept: {
      badge: '3-MOLECULE SCENE',
      title: 'HELPING A TEAMMATE',
      intro: 'Sometimes a molecule is too weak to attack on its own. A helper base steps in to grab its proton and turn it into a powerhouse!',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Helper Base:</strong> Ammonia has extra sparks ready to assist.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Teammate Proton:</strong> Grabbing this proton activates the alcohol into a super-giver!'
        }
      ],
      action: '<strong>Start the relay:</strong> Draw from the helper base red cloud into the teammate alcohol\'s blue proton!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 7,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7],
      targetBondLength: 1.1,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Relay initiated! Ammonia deprotonated the alcohol, converting it into a super-charged nucleophile!'
    }
  },
  {
    stageIndex: 10,
    title: 'Stage 11 — The Knockout Punch',
    prompt: 'Multi-step reaction! Draw 2 arrows in order: 1st: Red Oxygen ➔ Carbon. 2nd: C-Cl bond ➔ Chlorine. Click number to reorder, click arrow to remove.',
    moleculeId: 'stage11_pair',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'bond_c_cl', expectedTo: 'cl_leave', sourcePos: [2.2, 0, 0], targetPos: [3.3, 0, 0] }
    ],
    concept: {
      badge: 'MULTI-STEP REACTION',
      title: 'ONE IN, ONE OUT',
      intro: 'Welcome to multi-step reactions! Carbon is like a chair at a table with only 4 seats. If a new friend rushes in, someone else must leave!',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Arrow 1 (Attack):</strong> Red Oxygen rushes in to join Carbon\'s table.'
        },
        {
          type: 'warning-pill',
          html: '<strong>② Arrow 2 (Departure):</strong> Carbon can\'t hold 5 bonds! The green chlorine atom flies away.'
        }
      ],
      action: '<strong>Draw in order:</strong> 1st: Red Oxygen ➔ Carbon. 2nd: C-Cl bond ➔ Chlorine. Click number to reorder, click arrow to remove!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6],
      leavingBond: { from: 2, to: 3 },
      leavingAtom: 3,
      departDirection: [1, 0, 0],
      explanation: 'One in, one out! Oxygen attached as Chlorine took its electrons and departed!'
    }
  },
  {
    stageIndex: 11,
    title: 'Stage 12 — The Rooftop Bounce',
    prompt: 'Two-step bounce! Arrow 1: Red donor ➔ central Carbon. Arrow 2: C=O double bond ➔ roof Oxygen. Click number to reorder.',
    moleculeId: 'stage12_pair',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o', sourcePos: [1.5, 0.7, 0], targetPos: [1.6, 1.6, 0] }
    ],
    concept: {
      badge: 'MULTI-STEP REACTION',
      title: 'THE SPRING MATTRESS',
      intro: 'Double bonds act like springy trampolines! When an incoming molecule strikes the carbon center, the spring pops open up to the roof oxygen.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Arrow 1:</strong> Incoming red donor attacks the central blue carbon.'
        },
        {
          type: 'blue-pill',
          html: '<strong>② Arrow 2:</strong> The double bond spring pops up, parking its sparks on the top oxygen atom.'
        }
      ],
      action: '<strong>Choreograph the bounce:</strong> Draw Arrow 1 from donor to carbon, then Arrow 2 from the double bond to the top oxygen!'
    },
    reaction: {
      donorAtom: 1,
      acceptorAtom: 4,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Spring mattress bounce! The nucleophile bonded to carbon and the double bond sparks parked safely on oxygen!'
    }
  },
  {
    stageIndex: 12,
    title: 'Stage 13 — The Hot Potato',
    prompt: 'Two-step proton relay! Arrow 1: Water ➔ Acid proton. Arrow 2: Old O-H bond ➔ Acid Oxygen. Click number to reorder.',
    moleculeId: 'stage13_pair',
    xp: 35,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h', sourcePos: [-1.5, 0.2, 0], targetPos: [0.3, 0.3, 0] },
      { order: 2, expectedFrom: 'bond_o_h', expectedTo: 'red_o_acid', sourcePos: [0.9, 0.2, 0], targetPos: [1.7, 0, 0] }
    ],
    concept: {
      badge: 'MULTI-STEP REACTION',
      title: 'PROTON PASSING RELAY',
      intro: 'Like a game of hot potato, atoms pass tiny hydrogen protons back and forth in high-speed relays!',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Catch:</strong> Water\'s red cloud reaches out to grab the hydrogen ball.'
        },
        {
          type: 'blue-pill',
          html: '<strong>② Release:</strong> The old bond snaps, giving the sparks back to the original oxygen owner.'
        }
      ],
      action: '<strong>Pass the potato:</strong> Draw Arrow 1 to catch the proton, then Arrow 2 to release the old bond!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 3,
      clusterLeft: [0, 1, 2],
      clusterRight: [3, 4, 5, 6],
      leavingBond: { from: 3, to: 4 },
      leavingAtom: 4,
      departDirection: [1, 0, 0],
      explanation: 'Hot potato caught and passed! The proton was smoothly transferred between the two oxygen centers!'
    }
  },
  {
    stageIndex: 13,
    title: 'Stage 14 — The Trampoline Kick-Back',
    prompt: '3-Step Dance! 1: Donor ➔ Carbon. 2: C=O ➔ Oxygen. 3: Oxygen ➔ Chlorine departure. Click numbers to fix order.',
    moleculeId: 'stage14_pair',
    xp: 40,
    multiArrow: true,
    maxArrows: 3,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-1.4, 0.2, 0], targetPos: [1.2, 0, 0] },
      { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o', sourcePos: [1.4, 0.6, 0], targetPos: [1.5, 1.5, 0] },
      { order: 3, expectedFrom: 'red_o', expectedTo: 'cl_leave', sourcePos: [1.5, 1.5, 0], targetPos: [3.1, -0.4, 0] }
    ],
    concept: {
      badge: '3-ARROW CASCADE',
      title: 'ADDITION THEN ELIMINATION',
      intro: 'A three-step rhythm! Attack the center, spring up to the roof, then the roof slams back down to kick the weak link out!',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Step 1:</strong> Red donor attacks carbon.'
        },
        {
          type: 'blue-pill',
          html: '<strong>② Step 2:</strong> Roof opens up to oxygen.'
        },
        {
          type: 'warning-pill',
          html: '<strong>③ Step 3:</strong> Roof slams back down, kicking chlorine out the door!'
        }
      ],
      action: '<strong>Three-beat dance:</strong> Draw the 3 arrows in order. Click numbers to fix the order if needed!'
    },
    reaction: {
      donorAtom: 1,
      acceptorAtom: 4,
      clusterLeft: [0, 1, 2, 3],
      clusterRight: [4, 5, 6, 7, 8, 9],
      leavingBond: { from: 4, to: 6 },
      leavingAtom: 6,
      departDirection: [1, -0.3, 0],
      explanation: 'Addition-elimination masterclass! Roof opened, slammed back down, and evicted chlorine!'
    }
  },
  {
    stageIndex: 14,
    title: 'Stage 15 — The Key to the Lock',
    prompt: 'Unlock then enter! Arrow 1: Carbonyl Oxygen ➔ Acid Proton (unlock). Arrow 2: Water ➔ Activated Carbon (enter).',
    moleculeId: 'stage15_trio',
    xp: 40,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_o_carbonyl', expectedTo: 'blue_proton', sourcePos: [0.2, 1.5, 0], targetPos: [1.6, 1.8, 0] },
      { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_activated_c', sourcePos: [-2.1, -0.5, 0], targetPos: [0.0, 0.0, 0] }
    ],
    concept: {
      badge: 'MULTI-STEP REACTION',
      title: 'ACID-CATALYZED ACTIVATION',
      intro: 'Some reactions are locked tight. You need a key (an acid proton) to unlock the door before you can walk through!',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Unlock:</strong> Oxygen grabs the acid proton key, turning the carbon into a super-hungry blue target.'
        },
        {
          type: 'blue-pill',
          html: '<strong>② Enter:</strong> Now that the door is unlocked, the water molecule walks right in!'
        }
      ],
      action: '<strong>Unlock then enter:</strong> Step 1 unlocks the ketone. Step 2 docks the water nucleophile!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 3,
      clusterLeft: [0, 1, 2],
      clusterRight: [3, 4, 5, 6],
      targetBondLength: 1.35,
      leavingBond: null,
      leavingAtom: null,
      explanation: 'Door unlocked and entered! Proton activated the ketone, opening the door for water to dock!'
    }
  },
  {
    stageIndex: 15,
    title: 'Stage 16 — The Soap Maker',
    prompt: '3-Step ester cleavage! 1: OH- ➔ Carbon. 2: C=O ➔ Oxygen. 3: Oxygen ➔ Leaving Group. Click number to reorder.',
    moleculeId: 'stage16_trio',
    xp: 40,
    multiArrow: true,
    maxArrows: 3,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c', sourcePos: [-2.2, 0.4, 0], targetPos: [0.0, 0.0, 0] },
      { order: 2, expectedFrom: 'bond_c_o', expectedTo: 'red_o', sourcePos: [0.0, 0.7, 0], targetPos: [0.0, 1.5, 0] },
      { order: 3, expectedFrom: 'red_o', expectedTo: 'blue_ethoxide', sourcePos: [0.0, 1.5, 0], targetPos: [1.8, -0.4, 0] }
    ],
    concept: {
      badge: '3-ARROW CASCADE',
      title: 'ESTER BREAKDOWN',
      intro: 'This is the exact reaction used for thousands of years to make soap from oils! Three moves break the stubborn ester link.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Attack:</strong> Hydroxide strikes the carbonyl carbon.'
        },
        {
          type: 'blue-pill',
          html: '<strong>② Shift:</strong> Double bond yields to oxygen.'
        },
        {
          type: 'warning-pill',
          html: '<strong>③ Release:</strong> Double bond reforms, ejecting the alcohol side chain!'
        }
      ],
      action: '<strong>Make the cut:</strong> Draw the 3 sequential arrows to split the ester bond!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6, 7],
      leavingBond: { from: 2, to: 5 },
      leavingAtom: 5,
      departDirection: [1, -0.2, 0],
      explanation: 'Ester split! Nucleophile attacked, carbonyl rebounded, and the alkoxide leaving group departed.'
    }
  },
  {
    stageIndex: 16,
    title: 'Stage 17 — The Snapping Spring',
    prompt: 'Release trapped strain! Arrow 1: Hydroxide ➔ Ring Carbon. Arrow 2: Ring Bond ➔ Ring Oxygen. Click number to reorder.',
    moleculeId: 'stage17_pair',
    xp: 40,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'red_nu', expectedTo: 'blue_c_ring', sourcePos: [-2.1, 0.2, 0], targetPos: [0.7, -0.5, 0] },
      { order: 2, expectedFrom: 'bond_ring', expectedTo: 'red_o_ring', sourcePos: [1.1, 0.1, 0], targetPos: [1.6, 0.8, 0] }
    ],
    concept: {
      badge: 'MULTI-STEP REACTION',
      title: 'STRAINED RING OPENING',
      intro: 'Imagine bending a plastic ruler into a tiny triangle — it is bursting with trapped energy! A tiny nudge snaps the triangle open into a relaxed line.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① The Nudge:</strong> Hydroxide attacks the open corner of the 3-membered ring.'
        },
        {
          type: 'blue-pill',
          html: '<strong>② The Snap:</strong> The tight ring bond snaps open, relaxing the strain onto oxygen.'
        }
      ],
      action: '<strong>Snap the ring:</strong> Attack the open corner first, then release the ring bond!'
    },
    reaction: {
      donorAtom: 0,
      acceptorAtom: 2,
      clusterLeft: [0, 1],
      clusterRight: [2, 3, 4, 5, 6],
      leavingBond: { from: 2, to: 4 },
      leavingAtom: 4,
      departDirection: [0.4, 1.0, 0],
      explanation: 'Strained spring snapped! The bent 3-ring popped open into an unstrained stable chain.'
    }
  },
  {
    stageIndex: 17,
    title: 'Stage 18 — The Domino Chain',
    prompt: '3-Domino cascade! 1: Base ➔ Alpha H. 2: C-H ➔ Carbonyl C. 3: Alpha C ➔ Alkyl Halide. Click numbers to fix order.',
    moleculeId: 'stage18_pair',
    xp: 45,
    multiArrow: true,
    maxArrows: 3,
    steps: [
      { order: 1, expectedFrom: 'red_base', expectedTo: 'blue_h_alpha', sourcePos: [-2.5, 1.2, 0], targetPos: [-0.8, 1.0, 0] },
      { order: 2, expectedFrom: 'bond_c_h', expectedTo: 'blue_c_carbonyl', sourcePos: [-0.5, 0.6, 0], targetPos: [0.7, 0.0, 0] },
      { order: 3, expectedFrom: 'c_alpha', expectedTo: 'blue_target', sourcePos: [-0.2, -0.2, 0], targetPos: [2.3, -0.8, 0] }
    ],
    concept: {
      badge: '3-ARROW CASCADE',
      title: 'ENOLATE RELAY',
      intro: 'Like a row of falling dominoes: toppling the first domino sends a wave through the molecule to launch the final attack!',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Domino 1:</strong> Base grabs the alpha proton.'
        },
        {
          type: 'blue-pill',
          html: '<strong>② Domino 2:</strong> Sparks fold down into a temporary double bond.'
        },
        {
          type: 'warning-pill',
          html: '<strong>③ Domino 3:</strong> The carbon reaches out to grab the new alkyl building block!'
        }
      ],
      action: '<strong>Trigger the dominoes:</strong> Sequence all 3 arrows from proton grab to final bond formation!'
    },
    reaction: {
      donorAtom: 2,
      acceptorAtom: 6,
      clusterLeft: [0, 1, 2, 3, 4, 5],
      clusterRight: [6, 7],
      leavingBond: { from: 6, to: 7 },
      leavingAtom: 7,
      departDirection: [1, -0.3, 0],
      explanation: 'Domino cascade finished! Base grabbed proton, electron wave surged, and new C-C bond locked in!'
    }
  },
  {
    stageIndex: 18,
    title: 'Stage 19 — Musical Chairs',
    prompt: 'Leave first, enter second! Arrow 1: C-Cl ➔ Chlorine (depart). Arrow 2: Water ➔ Carbocation (dock). Click number to reorder.',
    moleculeId: 'stage19_pair',
    xp: 45,
    multiArrow: true,
    maxArrows: 2,
    steps: [
      { order: 1, expectedFrom: 'bond_c_cl', expectedTo: 'red_cl', sourcePos: [1.8, 0.0, 0], targetPos: [2.9, 0.0, 0] },
      { order: 2, expectedFrom: 'red_water', expectedTo: 'blue_carbocation', sourcePos: [-2.1, 0.0, 0], targetPos: [0.8, 0.0, 0] }
    ],
    concept: {
      badge: 'MULTI-STEP REACTION',
      title: 'LEAVE FIRST, ENTER SECOND',
      intro: 'Unlike Stage 11 where the swap was simultaneous, here an occupant gets up and leaves FIRST, leaving an empty chair behind!',
      pills: [
        {
          type: 'warning-pill',
          html: '<strong>① Empty Chair:</strong> Chlorine leaves all by itself, creating a wide-open blue spot (carbocation).'
        },
        {
          type: 'red-pill',
          html: '<strong>② New Occupant:</strong> Once the chair is completely empty, the water molecule sits down!'
        }
      ],
      action: '<strong>Stepwise substitution:</strong> Draw chlorine leaving first, then water docking second!'
    },
    reaction: {
      donorAtom: 5,
      acceptorAtom: 0,
      clusterLeft: [5, 6, 7],
      clusterRight: [0, 1, 2, 3, 4],
      leavingBond: { from: 0, to: 1 },
      leavingAtom: 1,
      departDirection: [1, 0, 0],
      explanation: 'Stepwise substitution finished! The intermediate carbocation was cleanly captured by water.'
    }
  },
  {
    stageIndex: 19,
    title: 'Stage 20 — The Master Conductor',
    prompt: 'Grand Finale Synthesis! 1: Catalyst ➔ Proton. 2: Core Nucleophile ➔ Scaffold Carbon. 3: Leaving Group departs.',
    moleculeId: 'stage20_multi',
    xp: 50,
    multiArrow: true,
    maxArrows: 3,
    steps: [
      { order: 1, expectedFrom: 'red_cat', expectedTo: 'blue_proton', sourcePos: [-2.7, 1.4, 0], targetPos: [-1.8, 1.5, 0] },
      { order: 2, expectedFrom: 'red_core', expectedTo: 'blue_c_scaffold', sourcePos: [-1.9, -0.8, 0], targetPos: [0.4, 0.0, 0] },
      { order: 3, expectedFrom: 'bond_leave', expectedTo: 'red_depart', sourcePos: [1.4, -0.3, 0], targetPos: [2.6, -0.5, 0] }
    ],
    concept: {
      badge: 'GRAND FINALE SYNTHESIS',
      title: 'THE ULTIMATE SYNTHESIS',
      intro: 'The grand finale of Quest 1! You are the maestro conducting an orchestra of 3 molecules executing a flawless 3-step synthesis.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong>① Baton 1:</strong> Catalyst activates the reactive center.'
        },
        {
          type: 'blue-pill',
          html: '<strong>② Baton 2:</strong> Core nucleophile forms the critical durasteel scaffold bond.'
        },
        {
          type: 'warning-pill',
          html: '<strong>③ Baton 3:</strong> Leaving group departs to complete the synthesis.'
        }
      ],
      action: '<strong>Conduct the finale:</strong> Draw all 3 arrows in exact chronological order to finish the entire quest!'
    },
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
