/**
 * evaluator.js — Immediate in-browser grading and stage definitions for Quest 1
 * ZERO network roundtrips for grading.
 * NO forbidden terms ("electron", "electron-rich", "electron-deficient", "electrophile").
 */

export const STAGE_CONFIGS = [
  {
    stageIndex: 0,
    title: 'Stage 1 — Target Lock',
    prompt: 'Drag an arrow from the densest donor region (red) to the least dense acceptor center (blue).',
    moleculeId: 'stage1_pair',
    xp: 15,
    expectedFrom: 'red_lp1',
    expectedTo: 'blue_c1',
    sourcePos: [-1.4, 0.2, 0],
    targetPos: [1.8, 0, 0],
    tolerance: 1.35
  },
  {
    stageIndex: 1,
    title: 'Stage 2 — Electrons & Charge',
    prompt: 'Connect the electron-dense donor (red) to the electron-starved acceptor (blue).',
    moleculeId: 'stage2_pair',
    xp: 15,
    expectedFrom: 'red_lp1',
    expectedTo: 'blue_c1',
    sourcePos: [-1.5, 0.3, 0],
    targetPos: [1.1, 0, 0],
    tolerance: 1.35,
    concept: {
      badge: 'NEW CONCEPT',
      title: 'WHAT ARE YOU SEEING? ATOMS & ELECTRONS',
      intro: 'The 3D spheres and rods represent <strong>atoms</strong> linked into <strong>molecules</strong> (the basic building blocks of all matter). The glowing clouds show <strong>electrons</strong> — tiny negative electrical charges buzzing around the atoms.',
      pills: [
        {
          type: 'red-pill',
          html: '<strong style="color: #ff5252;">🔴 Red = High Electron Density:</strong> Packed with extra electrons (negative charge). This is the <em>electron donor</em>.'
        },
        {
          type: 'blue-pill',
          html: '<strong style="color: #40c4ff;">🔵 Blue = Low Electron Density:</strong> Starving for electrons (positive pull). This is the <em>electron acceptor</em>.'
        }
      ],
      action: '<strong>How chemistry works:</strong> Just like magnets, negative electrons naturally flow from where they are crowded (<strong>red</strong>) into empty spaces (<strong>blue</strong>). Draw your arrow to guide the electron flow!'
    }
  },
  {
    stageIndex: 2,
    title: 'Stage 3 — Comparing Densities',
    prompt: 'Multiple reactive sites: when molecules have several regions, electrons flow between the strongest donor (deepest red) and the strongest acceptor (deepest blue).',
    moleculeId: 'stage3_pair',
    xp: 20,
    expectedFrom: 'red_extreme',
    expectedTo: 'blue_extreme',
    sourcePos: [-0.8, -1.2, 0],
    targetPos: [1.3, -0.3, 0],
    tolerance: 1.35
  },
  {
    stageIndex: 3,
    title: 'Stage 4 — Competing Sites',
    prompt: 'Identify the primary electron cloud (extreme red) and route the arrow into the primary electron-deficient center (extreme blue).',
    moleculeId: 'stage4_pair',
    xp: 20,
    expectedFrom: 'red_extreme',
    expectedTo: 'blue_extreme',
    sourcePos: [-0.8, -1.2, 0],
    targetPos: [1.3, -0.3, 0],
    tolerance: 1.35
  },
  {
    stageIndex: 4,
    title: 'Stage 5 — Steric Hindrance',
    prompt: 'Trace the molecule\'s path into the open, accessible target. Avoid the crowded obstacle!',
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
      badge: 'CRITICAL CONCEPT',
      title: 'TRACING THE MOLECULE\'S PATH & STERIC HINDRANCE',
      intro: 'You are now tracing the <strong>actual physical path the reacting molecules travel</strong> as they approach each other to collide and bond.',
      pills: [
        {
          type: 'warning-pill',
          html: '⚠️ <strong>Atoms take up real physical space!</strong> One of the blue targets is blocked by bulky surrounding atom clusters. Chemists call this <strong>steric hindrance</strong> (molecular crowding). The incoming molecule physically crashes into these bumper atoms and cannot squeeze through!'
        }
      ],
      action: '<strong>Rotate the 3D view</strong> to inspect the obstacles. Spot the open, uncrowded side and trace the molecule\'s path into the <strong>accessible, unblocked blue target</strong>.'
    }
  },
  {
    stageIndex: 5,
    title: 'Stage 6 — Bulky Group Shielding',
    prompt: 'Bulky atoms are physically blocking one route. Rotate your view, avoid the crowded cluster, and trace the molecule\'s path into the open target.',
    moleculeId: 'stage6_pair',
    xp: 25,
    expectedFrom: 'red_nu',
    expectedTo: 'blue_open',
    sourcePos: [-1.5, 0.2, 0],
    targetPos: [1.6, -0.9, 0],
    blockedAnchor: 'blue_blocked',
    blockedPos: [1.8, 1.2, 0],
    tolerance: 1.35
  },
  {
    stageIndex: 6,
    title: 'Stage 7 — Final Synthesis Route',
    prompt: 'Master challenge: Multiple electron clouds and crowded targets. Find the strongest electron donor (red) and trace a clear, unhindered collision path into the accessible target (blue).',
    moleculeId: 'stage7_pair',
    xp: 30,
    expectedFrom: 'red_supreme',
    expectedTo: 'blue_accessible',
    sourcePos: [-0.4, 0, 0],
    targetPos: [1.6, -0.8, 0],
    blockedAnchor: 'blue_caged',
    blockedPos: [2.0, 1.2, 0],
    tolerance: 1.35
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
 * @param {object} payload { from, to, startPos, endPos }
 * @returns {{ correct: boolean, blocked: boolean, xpAwarded: number }}
 */
export function evaluateStageLocally(stageIndex, payload) {
  const cfg = STAGE_CONFIGS[stageIndex] || STAGE_CONFIGS[0];
  if (!payload) return { correct: false, blocked: false, xpAwarded: 0 };

  // 1. Direct anchor match
  if (payload.from && payload.to) {
    if (payload.from === cfg.expectedFrom && payload.to === cfg.expectedTo) {
      return { correct: true, blocked: false, xpAwarded: cfg.xp };
    }
    if (cfg.blockedAnchor && payload.to === cfg.blockedAnchor) {
      return { correct: false, blocked: true, xpAwarded: 0 };
    }
  }

  // 2. Proximity check on 3D coordinates (allows drawing anywhere close to solution)
  if (payload.startPos && payload.endPos) {
    const sPos = payload.startPos;
    const ePos = payload.endPos;

    // Check if target is near the blocked / hindered site
    if (cfg.blockedPos) {
      const distBlocked = dist3D(ePos, cfg.blockedPos);
      if (distBlocked < (cfg.tolerance || 1.35)) {
        return { correct: false, blocked: true, xpAwarded: 0 };
      }
    }

    const startDist = dist3D(sPos, cfg.sourcePos);
    const endDist = dist3D(ePos, cfg.targetPos);
    const tol = cfg.tolerance || 1.35;

    // Close to correct source AND target
    if (startDist <= tol && endDist <= tol) {
      return { correct: true, blocked: false, xpAwarded: cfg.xp };
    }
  }

  return { correct: false, blocked: false, xpAwarded: 0 };
}
