/**
 * q6-shape.js — Ligar, bench six: MOLECULAR SHAPE.
 *
 * The domain rig. A hub, and arms the player clips on: an arm carrying an atom, or
 * a balloon for a lone pair. The arms push apart and settle, and a protractor
 * reads the angle between any two as a number, so nothing is judged by eye.
 *
 *   1  the angle between two arms                          -> electron domain, linear
 *   2  the angle with four arms                            -> trigonal planar, tetrahedral, VSEPR
 *   3  how NH3's atoms are arranged                        -> trigonal pyramidal
 *   4  the angle in water                                  -> bent
 *   5  how many arms a double bond takes                   -> (a multiple bond is one domain)
 *   6  where the lone pair on SF4's hub settles            -> trigonal bipyramidal, seesaw
 *   7  where XeF4's two lone pairs settle                  -> octahedral, square planar
 *   8  the shape the atoms make in three molecules         -> electron geometry, molecular geometry
 *
 * EVERY SETTLING COMES FROM `vsepr.planDomains`. Ammonia's 107 degrees and water's
 * 104.5 are the real measured angles; every other shape is the ideal one. The
 * warden fought on each plate stands as many columns as the hub holds arms.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { DomainRig } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { hubKeys, paintRigHand, describeRig } from '../../engine/rigcontrols.js';
import { RIG_MOLECULES, planDomains, bondAngles } from '../../engine/vsepr.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\b(?:electron|molecular) geometr(?:y|ies)\b/i, introducedAt: 8 },
  { term: /\bsquare planar\b/i, introducedAt: 7 },
  { term: /\boctahedral\b/i, introducedAt: 7 },
  { term: /\bseesaw\b/i, introducedAt: 6 },
  { term: /\btrigonal bipyramidal\b/i, introducedAt: 6 },
  { term: /\bbent\b/i, introducedAt: 4 },
  { term: /\btrigonal pyramidal\b/i, introducedAt: 3 },
  { term: /\btetrahedral\b/i, introducedAt: 2 },
  { term: /\btrigonal planar\b/i, introducedAt: 2 },
  { term: /\bvsepr\b/i, introducedAt: 2 },
  { term: /\blinear\b/i, introducedAt: 1 },
  { term: /\b(?:electron )?domains?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q4-dots', 'unit03/q3-distance', 'unit02/q4-cloud'];

const SPEAKER = 'Vess';

const TOOL_TEXT = {
  arms: { key: 'Arms', what: 'Pick an arm, then tap the hub to clip it on.' },
  protractor: { key: 'Protractor', what: 'Tap two arms to read the angle between them.' }
};
export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const hub = (id, label, sym, stock, extra = {}) => ({ id, label, head: 'hub', hub: sym, stock, ...extra });
const atoms = (id, sym, n, label, mult = 1) => ({ id, kind: 'atom', sym, mult, n, label });
const lone = n => ({ id: 'l', kind: 'lone', n, label: 'Lone Pair' });

const deg = n => ({ id: String(n), label: `${n}°` });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Two Arms',
    briefing: {
      speaker: SPEAKER,
      body: 'Arms clip onto the hub and push each other as far apart as they can get. The protractor reads the angle between any two arms.'
    },
    prompt: 'Say the angle between two arms on the hub.',
    controls: ['arms', 'protractor'],
    rigs: [hub('a', 'HUB A', 'X', [atoms('a', 'A', 2, 'Arm')], { note: 'a hub with room for six arms' })],
    widget: { type: 'choice', label: 'Angle', options: [deg(60), deg(90), deg(120), deg(180)] },
    hints: [
      'Clip both arms onto the hub, then use the protractor on the pair.',
      'Compare the angle you read with how far apart two arms could possibly get.',
      'Arms that push each other as far apart as they can end up on opposite sides of the hub.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an angle.' };
      if (state.choice === '180') return { ok: true };
      return { ok: false, msg: 'Clip both arms on and read the protractor: the arms keep pushing until nothing more can be gained.' };
    },
    reward: {
      log: 'Two arms settle opposite.',
      title: 'Electron Domain, Linear',
      body: 'Each arm is a region of electrons round the hub, an electron domain. Two domains settle opposite each other, 180 degrees apart, in a linear arrangement.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Four Arms',
    prompt: 'Say the angle between any two arms when the hub holds four.',
    controls: ['arms', 'protractor'],
    rigs: [hub('a', 'HUB A', 'X', [atoms('a', 'A', 4, 'Arm')], { note: 'a hub with room for six arms' })],
    widget: { type: 'choice', label: 'Angle', options: [deg(90), { id: '109.5', label: '109.5°' }, deg(120), deg(180)] },
    hints: [
      'Clip on a third arm and then a fourth, reading the angle each time.',
      'Compare the angle with three arms to the angle with four, and turn the view to see which arm leaves the plane.',
      'With four arms every pair makes the same angle, and it is smaller than the angle with three.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an angle.' };
      if (state.choice === '109.5') return { ok: true };
      if (state.choice === '120') return { ok: false, msg: 'That is the angle the arms make while they lie flat. Add the fourth and read again.' };
      return { ok: false, msg: 'Clip on all four, turn the view, and read the protractor for any pair.' };
    },
    reward: {
      log: 'Four arms leave the plane.',
      title: 'Trigonal Planar, Tetrahedral, VSEPR',
      body: 'Three domains lie flat at 120 degrees, trigonal planar; four reach the corners of a tetrahedron at 109.5 degrees, tetrahedral. Domains arranging themselves as far apart as they can get is the idea behind VSEPR.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'The Unseen Arm',
    prompt: 'Say how the atoms of NH₃ are arranged.',
    controls: ['arms', 'protractor'],
    rigs: [hub('a', 'HUB A', 'N', [atoms('h', 'H', 3, 'Hydrogen'), lone(1)], { note: 'nitrogen with three hydrogen atoms and one lone pair' })],
    widget: {
      type: 'choice', label: 'The atoms',
      options: [
        { id: 'pyr', label: 'On the corners of a low pyramid, nitrogen at its peak' },
        { id: 'flat', label: 'In a flat triangle with nitrogen in the middle' },
        { id: 'tet', label: 'On the corners of a tetrahedron with nitrogen at its centre' },
        { id: 'line', label: 'In a straight line' }
      ]
    },
    hints: [
      'Clip the three hydrogen atoms and the lone pair onto the hub, then turn the view.',
      'Compare where the atoms sit with where the lone pair sits.',
      'The atoms alone make the shape, so picture the hub with the lone pair left out.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an arrangement.' };
      if (state.choice === 'pyr') return { ok: true };
      if (state.choice === 'tet') return { ok: false, msg: 'A tetrahedron has an atom at each of four corners. Count the atoms on this hub.' };
      return { ok: false, msg: 'Turn the view and look at the atoms alone, with the lone pair left out.' };
    },
    reward: {
      log: 'A lone pair is a domain you cannot see in the shape.',
      title: 'Trigonal Pyramidal',
      body: 'A lone pair takes a domain but no atom, so three atoms and a lone pair make a molecule with its atoms in a pyramid, trigonal pyramidal. The lone pair points away from the atoms, out of the shape.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Two Unseen Arms',
    prompt: 'Say the angle between the two hydrogen atoms of water.',
    controls: ['arms', 'protractor'],
    rigs: [hub('a', 'HUB A', 'O', [atoms('h', 'H', 2, 'Hydrogen'), lone(2)], { note: 'oxygen with two hydrogen atoms and two lone pairs' })],
    widget: { type: 'choice', label: 'Angle', options: [deg(90), { id: '104.5', label: '104.5°' }, { id: '109.5', label: '109.5°' }, deg(120)] },
    hints: [
      'Clip the two hydrogen atoms and both lone pairs onto the hub, then use the protractor on the atoms.',
      'Compare the angle with those you read for the hubs holding three atoms and four.',
      'The more lone pairs on the hub, the further the angle between the atoms falls below the four-atom value.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an angle.' };
      if (state.choice === '104.5') return { ok: true };
      if (state.choice === '109.5') return { ok: false, msg: 'That is the angle with four atoms. These arms are not all atoms.' };
      return { ok: false, msg: 'Clip both lone pairs on and read the protractor between the two hydrogen arms.' };
    },
    reward: {
      log: 'Lone pairs push harder.',
      title: 'Bent',
      body: 'Two atoms and two lone pairs make a bent molecule. Lone pairs push harder than bonding pairs, so the angle closes below 109.5 degrees: to 107 in ammonia and 104.5 in water.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Double Arms',
    prompt: 'Say how many domains the carbon in CO₂ has.',
    controls: ['arms', 'protractor'],
    rigs: [hub('a', 'HUB A', 'C', [atoms('o', 'O', 2, 'Double-Bonded Oxygen', 2)], { note: 'carbon with two oxygen atoms, each joined by a double bond' })],
    widget: { type: 'choice', label: 'Domains', options: [{ id: '2', label: '2' }, { id: '3', label: '3' }, { id: '4', label: '4' }, { id: '6', label: '6' }] },
    hints: [
      'Clip both oxygen atoms onto the hub and read the arms the plate counts.',
      'Compare the number of arms on the hub with the number of pairs each oxygen atom shares.',
      'Count the arms on the hub, not the pairs in the bonds.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a number.' };
      if (state.choice === '2') return { ok: true };
      return { ok: false, msg: 'However many pairs a bond holds, they sit in the same region. Count the arms that settle.' };
    },
    reward: {
      log: 'A multiple bond is one domain.',
      title: 'A Multiple Bond Is One Domain',
      body: 'However many pairs a bond holds, they sit in the same region and push as one arm. Carbon dioxide has two domains, so it is linear.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Five Arms',
    prompt: 'Say where the lone pair settles on the SF₄ hub.',
    controls: ['arms', 'protractor'],
    rigs: [
      hub('a', 'HUB A', 'P', [atoms('c', 'Cl', 5, 'Chlorine')], { note: 'phosphorus with five chlorine atoms' }),
      hub('b', 'HUB B', 'S', [atoms('f', 'F', 4, 'Fluorine'), lone(1)], { note: 'sulfur with four fluorine atoms and one lone pair' })
    ],
    widget: {
      type: 'choice', label: 'The lone pair',
      options: [
        { id: 'middle', label: 'Round the middle, between the other arms' },
        { id: 'end', label: 'At one end, in line with another arm' }
      ]
    },
    hints: [
      'Build both hubs, then read the angle between the lone pair and each atom on the second.',
      'Compare those angles with the angles between the atoms on the first hub.',
      'The lone pair settles where it has the fewest close neighbours.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a position.' };
      if (state.choice === 'middle') return { ok: true };
      return { ok: false, msg: 'Read the angle from the lone pair to each atom, and count how many atoms sit close to it.' };
    },
    reward: {
      log: 'The lone pair takes the roomy place.',
      title: 'Trigonal Bipyramidal, Seesaw',
      body: 'Five domains make a trigonal bipyramid: three round the middle and one above and one below. A lone pair takes a place round the middle, where it has the most room, so SF₄ is a seesaw.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Six Arms',
    prompt: 'Say where the two lone pairs settle on the XeF₄ hub.',
    controls: ['arms', 'protractor'],
    rigs: [
      hub('a', 'HUB A', 'S', [atoms('f', 'F', 6, 'Fluorine')], { note: 'sulfur with six fluorine atoms' }),
      hub('b', 'HUB B', 'Xe', [atoms('f', 'F', 4, 'Fluorine'), lone(2)], { note: 'xenon with four fluorine atoms and two lone pairs' })
    ],
    widget: {
      type: 'choice', label: 'The lone pairs',
      options: [
        { id: 'opposite', label: 'Opposite each other, one above the hub and one below' },
        { id: 'together', label: 'Side by side, on the same side of the hub' },
        { id: 'plane', label: 'Next to each other, round the middle' }
      ]
    },
    hints: [
      'Build both hubs and read the angle between the two lone pairs on the second.',
      'Compare the angle between the lone pairs with the angles between the atoms on the first hub.',
      'Two lone pairs settle as far from each other as the hub allows.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a position.' };
      if (state.choice === 'opposite') return { ok: true };
      return { ok: false, msg: 'Read the angle between the two lone pairs with the protractor and ask whether the arms would stay that close.' };
    },
    reward: {
      log: 'The lone pairs sit opposite.',
      title: 'Octahedral, Square Planar',
      body: 'Six domains point to the corners of an octahedron, octahedral. When two of them are lone pairs they sit opposite each other, leaving the four atoms in a flat square, square planar.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Three Shapes',
    prompt: 'Name the shape the atoms make in each molecule.',
    controls: ['arms', 'protractor'],
    rigs: [
      hub('a', 'HUB A', 'Xe', [atoms('f', 'F', 2, 'Fluorine'), lone(3)], { note: 'xenon with two fluorine atoms and three lone pairs' }),
      hub('b', 'HUB B', 'B', [atoms('f', 'F', 3, 'Fluorine')], { note: 'boron with three fluorine atoms' }),
      hub('c', 'HUB C', 'Xe', [atoms('f', 'F', 4, 'Fluorine'), lone(2)], { note: 'xenon with four fluorine atoms and two lone pairs' })
    ],
    widget: {
      type: 'bins', label: 'The shape of the atoms',
      rows: [{ id: 'a', label: 'Hub A' }, { id: 'b', label: 'Hub B' }, { id: 'c', label: 'Hub C' }],
      bins: [
        { id: 'linear', label: 'Linear' },
        { id: 'planar', label: 'Trigonal planar' },
        { id: 'square', label: 'Square planar' },
        { id: 'octa', label: 'Octahedral' }
      ]
    },
    hints: [
      'Build each hub from the note beside it and look at the atoms alone.',
      'Compare the shape all the domains make with the shape the atoms make once the lone pairs are ignored.',
      'Name the shape the atoms make, not the shape the domains make.'
    ],
    check(state) {
      const rows = ['a', 'b', 'c'];
      if (rows.some(r => !state.bins[r])) return { ok: false, notYet: true, msg: 'Name the shape on every hub.' };
      const want = { a: 'linear', b: 'planar', c: 'square' };
      if (rows.every(r => state.bins[r] === want[r])) return { ok: true };
      return { ok: false, msg: 'One hub is named for the shape of all its domains. Look at where the atoms alone sit.' };
    },
    reward: {
      log: 'Domains and atoms name different shapes.',
      title: 'Electron Geometry, Molecular Geometry',
      body: 'The electron geometry names how all the domains are arranged, and the molecular geometry names only where the atoms are. XeF₂ has a trigonal bipyramidal electron geometry but a linear molecular geometry.'
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Domains push apart until they are as far from each other as they can get, and the arrangement they settle in fixes the shape. Lone pairs take a domain but no atom, and they squeeze the angles because they push harder.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'From a Lewis structure you can now count the domains, say how they settle, and name the shape the atoms make. A few of those shapes are symmetrical and the rest are not, and that decides which way a molecule leans.'
    },
    {
      heading: 'Next',
      body: 'The next bench puts molecules between charged plates to see which ones swing round.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the electron geometry of a central atom with four electron domains?',
    options: [
      { id: 'a', label: 'Tetrahedral' },
      { id: 'b', label: 'Trigonal planar' },
      { id: 'c', label: 'Linear' },
      { id: 'd', label: 'Octahedral' }
    ],
    answer: 'a',
    explanation: 'Four domains push to the corners of a tetrahedron, with ideal angles of 109.5 degrees.'
  },
  {
    question: 'What is the molecular geometry of NH₃?',
    options: [
      { id: 'a', label: 'Trigonal pyramidal' },
      { id: 'b', label: 'Trigonal planar' },
      { id: 'c', label: 'Tetrahedral' },
      { id: 'd', label: 'Bent' }
    ],
    answer: 'a',
    explanation: 'Nitrogen has four domains, one of them a lone pair. With three atoms only, the shape is trigonal pyramidal.'
  },
  {
    question: 'Why is the H–O–H angle in water (104.5°) smaller than the tetrahedral angle?',
    options: [
      { id: 'a', label: 'Lone pairs repel bonding pairs more strongly than bonding pairs repel each other' },
      { id: 'b', label: 'Oxygen is larger than hydrogen' },
      { id: 'c', label: 'The O–H bonds are double bonds' },
      { id: 'd', label: 'Water has no lone pairs' }
    ],
    answer: 'a',
    explanation: 'The two lone pairs on oxygen take more room than bonding pairs, squeezing the bond angle below 109.5 degrees.'
  },
  {
    question: 'How many electron domains does the carbon atom in CO₂ have?',
    options: [
      { id: 'a', label: '2' },
      { id: 'b', label: '4' },
      { id: 'c', label: '3' },
      { id: 'd', label: '1' }
    ],
    answer: 'a',
    explanation: 'Each double bond is one region of electron density, so carbon has two domains and CO₂ is linear.'
  },
  {
    question: 'What is the molecular geometry of XeF₄?',
    options: [
      { id: 'a', label: 'Square planar' },
      { id: 'b', label: 'Tetrahedral' },
      { id: 'c', label: 'Octahedral' },
      { id: 'd', label: 'Seesaw' }
    ],
    answer: 'a',
    explanation: 'Xenon has six domains, two of them lone pairs placed opposite each other. The four fluorine atoms lie in a plane.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: '180' },
  { choice: '109.5' },
  { choice: 'pyr' },
  { choice: '104.5' },
  { choice: '2' },
  { choice: 'middle' },
  { choice: 'opposite' },
  { bins: { a: 'linear', b: 'planar', c: 'square' } }
];

export const MISSES = [
  { choice: '120' },
  { choice: '120' },
  { choice: 'tet' },
  { choice: '109.5' },
  { choice: '4' },
  { choice: 'end' },
  { choice: 'together' },
  { bins: { a: 'planar', b: 'planar', c: 'octa' } }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let rig = null;
  let runner = null;

  function paintAll() {
    paintRigHand(runner.frame.el.controls, rig.cfg.hand);
  }

  /** Every warden stands as the hub it was made from does. */
  function reactAll(quiet = false) {
    for (const r of runner.stage.rigs) {
      runner.frame.foeReact(r.id, { rig: 'arms', arms: rig.armsOf(r.id) }, quiet);
    }
  }

  function onProbe(hit) {
    if (hit.kind === 'hand') { paintAll(); return; }
    const d = describeRig(hit);
    if (d.body) runner.readout(d.head, d.body);
    if (hit.kind === 'rig') reactAll();
    paintAll();
  }

  function onTool(tool) {
    if (tool.startsWith('hand:')) {
      rig.setHand(tool.slice(5));
      paintAll();
    } else if (tool === 'turn') {
      rig.turn();
    } else if (tool === 'clear') {
      rig.clear();
      runner.readout('Hub // cleared', 'The hub is back to how the stage handed it over.');
      reactAll(true);
    }
  }

  function onLoad(stage, i, r) {
    rig.setPlates(stage.rigs, {});
    rig.setSelectable(false);
    r.setControls(hubKeys(stage), onTool);
    paintAll();
    r.readout(null, null, { idleHead: 'Hub // standby', idle: 'Pick an arm, then tap the hub.' });
    reactAll(true);
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { rig = DomainRig(r.frame.instrumentHost, { onProbe }); },
    onLoad,
    onDispose: () => rig?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

export { RIG_MOLECULES, planDomains, bondAngles };
