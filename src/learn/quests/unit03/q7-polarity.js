/**
 * q7-polarity.js — Ligar, bench seven: POLARITY.
 *
 * The domain rig again, with two charged plates. A molecule is put between them,
 * the field is switched on, and a molecule whose bond pulls do not cancel swings
 * round to line up. An arrow tool draws each bond's pull and their sum.
 *
 *   1  which end of H-Cl is more negative               -> partial charge, polar bond
 *   2  sort three bonds by how unevenly they share       -> nonpolar covalent, polar covalent
 *   3  whether CO2 turns, with two polar bonds           -> molecular dipole
 *   4  why H2O turns and CO2 does not                    -> bond dipole
 *   5  CCl4 against CHCl3                                -> (symmetry cancels)
 *   6  NH3 against BF3                                   -> (a lone pair breaks symmetry)
 *   7  sort three molecules by the field                 -> (the field sorts them)
 *   8  which liquids a charged rod will bend             -> (polar liquids bend)
 *
 * EVERY TURN IS `vsepr.planDipole`: the bond pulls are electronegativity
 * differences along the arm vectors `planDomains` settled, summed. A warden on
 * each plate turns, or shivers, exactly as its molecule does.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { DomainRig } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { fieldKeys, paintToggle } from '../../engine/rigcontrols.js';
import { RIG_MOLECULES, planDipole, bondKind } from '../../engine/vsepr.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bbond dipoles?\b/i, introducedAt: 4 },
  { term: /\bmolecular dipoles?\b|\bdipoles?\b/i, introducedAt: 3 },
  { term: /\bpolar covalent\b/i, introducedAt: 2 },
  { term: /\bnonpolar\b/i, introducedAt: 2 },
  { term: /\bpolar\b/i, introducedAt: 1 },
  { term: /\bpartial charges?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q6-shape', 'unit03/q1-joins', 'unit02/q8-trends'];

const SPEAKER = 'Vess';

const TOOL_TEXT = {
  arrows: { key: 'Show Arrows', what: 'Draws an arrow across each bond toward the atom that pulls the pair harder.' }
};
export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const field = (id, label, mol, note) => ({ id, label, head: 'field', mol, note });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Which End',
    briefing: {
      speaker: SPEAKER,
      body: 'A molecule stands between two charged plates, the left one positive and the right one negative. Switch Field charges them, and Show Arrows draws the pull across each bond.'
    },
    prompt: 'Say which end of the H–Cl bond is more negative.',
    controls: ['field', 'arrows'],
    rigs: [field('a', 'PLATE A', 'HCl', 'hydrogen 2.20 and chlorine 3.16 on the electronegativity scale')],
    widget: { type: 'choice', label: 'The more negative end', options: [{ id: 'h', label: 'The hydrogen end' }, { id: 'cl', label: 'The chlorine end' }] },
    hints: [
      'Switch the field on and watch which way the molecule turns.',
      'Compare the electronegativities in the plate\'s note with the end that swings toward the positive plate.',
      'The end that pulls the shared pair harder is the end drawn toward the positive plate.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an end.' };
      if (state.choice === 'cl') return { ok: true };
      return { ok: false, msg: 'Switch the field on: a negative end is drawn toward the positive plate.' };
    },
    reward: {
      log: 'The harder puller takes the minus.',
      title: 'Partial Charge, Polar Bond',
      body: 'An atom that pulls the shared pair harder ends up with a partial negative charge, and the atom at the other end with a partial positive one. A bond like that is a polar bond.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Three Bonds',
    prompt: 'File each bond by how unevenly its atoms share the pair.',
    controls: ['field', 'arrows'],
    rigs: [
      field('a', 'PLATE A', 'NaCl', 'sodium 0.93 and chlorine 3.16 on the electronegativity scale'),
      field('b', 'PLATE B', 'H2', 'two hydrogen atoms, 2.20 each'),
      field('c', 'PLATE C', 'HCl', 'hydrogen 2.20 and chlorine 3.16 on the electronegativity scale')
    ],
    widget: {
      type: 'bins', label: 'How the pair is shared',
      rows: [{ id: 'a', label: 'Plate A' }, { id: 'b', label: 'Plate B' }, { id: 'c', label: 'Plate C' }],
      bins: [{ id: 'even', label: 'Evenly' }, { id: 'uneven', label: 'Unevenly' }, { id: 'given', label: 'Handed over' }]
    },
    hints: [
      'Switch the field on for each plate and show the arrows.',
      'Compare the size of the pull on each plate using the net figure the arrows give.',
      'Rank the three by the size of the pull and file them from none, through some, to nearly all.'
    ],
    check(state) {
      const rows = ['a', 'b', 'c'];
      if (rows.some(r => !state.bins[r])) return { ok: false, notYet: true, msg: 'File all three bonds.' };
      const want = { a: 'given', b: 'even', c: 'uneven' };
      if (rows.every(r => state.bins[r] === want[r])) return { ok: true };
      return { ok: false, msg: 'Compare the pull on each plate: the bond that pulls most is not shared like the one that pulls least.' };
    },
    reward: {
      log: 'A spectrum from even to handed over.',
      title: 'Nonpolar, Polar, Ionic',
      body: 'Atoms of the same element share a pair evenly, a nonpolar covalent bond. A small difference in pull makes a polar covalent bond, and a large one hands the pair over entirely, an ionic bond.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Two Pulls, No Turn',
    prompt: 'Say whether carbon dioxide turns between the plates.',
    controls: ['field', 'arrows'],
    rigs: [field('a', 'PLATE A', 'CO2', 'carbon 2.55 and oxygen 3.44 on the electronegativity scale')],
    widget: { type: 'choice', label: 'In the field', options: [{ id: 'turns', label: 'It turns' }, { id: 'still', label: 'It does not turn' }] },
    hints: [
      'Switch the field on and watch the molecule.',
      'Show the arrows and compare the pull of one bond with the pull of the other.',
      'Equal pulls in exactly opposite directions leave nothing to turn the molecule.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what it does.' };
      if (state.choice === 'still') return { ok: true };
      return { ok: false, msg: 'Switch the field on and watch. Show the arrows and read the net figure.' };
    },
    reward: {
      log: 'Polar bonds, no net pull.',
      title: 'Molecular Dipole',
      body: 'A molecule whose bond pulls do not cancel has a molecular dipole and swings round in a field. Carbon dioxide has two polar bonds but no molecular dipole, because the pulls oppose each other equally.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Bent and Straight',
    prompt: 'Say why H₂O turns between the plates and CO₂ does not.',
    controls: ['field', 'arrows'],
    rigs: [
      field('a', 'PLATE A', 'H2O', 'hydrogen 2.20 and oxygen 3.44 on the electronegativity scale'),
      field('b', 'PLATE B', 'CO2', 'carbon 2.55 and oxygen 3.44 on the electronegativity scale')
    ],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        { id: 'add', label: 'The bent molecule\'s bond pulls add up, and the straight molecule\'s cancel' },
        { id: 'polar', label: 'Water\'s bonds are polar and carbon dioxide\'s are not' },
        { id: 'lone', label: 'Carbon dioxide has lone pairs and water does not' },
        { id: 'size', label: 'Carbon dioxide is the bigger molecule' }
      ]
    },
    hints: [
      'Switch the field on for both plates and show the arrows.',
      'Compare the directions of the two bond arrows on each plate with the arrow they add up to.',
      'Arrows pointing different ways add to a net arrow, while arrows pointing straight against each other cancel.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'add') return { ok: true };
      if (state.choice === 'polar') return { ok: false, msg: 'Show the arrows on the carbon dioxide plate: both of its bonds pull.' };
      if (state.choice === 'lone') return { ok: false, msg: 'A lone pair adds no arrow of its own. Compare the bond arrows on the two plates.' };
      return { ok: false, msg: 'Size does not decide whether a molecule turns. Compare the arrows on the two plates.' };
    },
    reward: {
      log: 'Arrows add or cancel.',
      title: 'Bond Dipoles Add or Cancel',
      body: 'Each polar bond pulls like an arrow, a bond dipole. In a bent molecule the arrows add up to a net pull, and in a straight one they cancel.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'One Hydrogen',
    prompt: 'Say which of CCl₄ and CHCl₃ turns between the plates.',
    controls: ['field', 'arrows'],
    rigs: [
      field('a', 'PLATE A', 'CCl4', 'carbon 2.55 and chlorine 3.16 on the electronegativity scale'),
      field('b', 'PLATE B', 'CHCl3', 'carbon 2.55, hydrogen 2.20 and chlorine 3.16 on the electronegativity scale')
    ],
    widget: { type: 'choice', label: 'The one that turns', options: [{ id: 'a', label: 'CCl₄' }, { id: 'b', label: 'CHCl₃' }, { id: 'both', label: 'Both' }, { id: 'neither', label: 'Neither' }] },
    hints: [
      'Switch the field on for both plates.',
      'Compare the four bonds on one plate with the four on the other, one atom at a time.',
      'A molecule only fails to turn when every pull on one side is matched by an equal pull on the other.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an answer.' };
      if (state.choice === 'b') return { ok: true };
      if (state.choice === 'a') return { ok: false, msg: 'Switch the field on for both plates and watch which one does not move.' };
      return { ok: false, msg: 'Switch the field on for both plates and watch them.' };
    },
    reward: {
      log: 'One different atom breaks the balance.',
      title: 'Symmetry Cancels',
      body: 'Identical atoms placed evenly round the centre pull equally in every direction, so CCl₄ has no net pull. Swap one for a different atom and the balance is gone.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Flat and Pyramid',
    prompt: 'Say which of NH₃ and BF₃ turns between the plates.',
    controls: ['field', 'arrows'],
    rigs: [
      field('a', 'PLATE A', 'NH3', 'nitrogen 3.04 and hydrogen 2.20 on the electronegativity scale'),
      field('b', 'PLATE B', 'BF3', 'boron 2.04 and fluorine 3.98 on the electronegativity scale')
    ],
    widget: {
      type: 'choice', label: 'The one that turns',
      options: [{ id: 'a', label: 'NH₃ only' }, { id: 'b', label: 'BF₃ only' }, { id: 'both', label: 'Both' }, { id: 'neither', label: 'Neither' }]
    },
    hints: [
      'Switch the field on for both plates and show the arrows.',
      'Compare where the bond arrows point on each plate, flat in a plane or leaning to one side.',
      'Bonds that lie in a plane round the centre can cancel, while bonds that lean to one side cannot.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an answer.' };
      if (state.choice === 'a') return { ok: true };
      if (state.choice === 'b') return { ok: false, msg: 'Boron’s bonds are the strong ones, but ask whether they pull in one direction.' };
      return { ok: false, msg: 'Switch the field on for both plates and watch what each does.' };
    },
    reward: {
      log: 'A lone pair makes the bonds lean one way.',
      title: 'Shape Decides',
      body: 'Ammonia\'s lone pair makes its three bonds lean to one side, so they cannot cancel. Boron trifluoride\'s three bonds lie flat and cancel exactly, even though each one is strongly polar.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Three Molecules',
    prompt: 'File each molecule as polar or nonpolar.',
    controls: ['field', 'arrows'],
    rigs: [
      field('a', 'PLATE A', 'XeF4', 'xenon 2.60 and fluorine 3.98 on the electronegativity scale'),
      field('b', 'PLATE B', 'SF4', 'sulfur 2.58 and fluorine 3.98 on the electronegativity scale'),
      field('c', 'PLATE C', 'CHCl3', 'carbon 2.55, hydrogen 2.20 and chlorine 3.16 on the electronegativity scale')
    ],
    widget: {
      type: 'bins', label: 'In the field',
      rows: [{ id: 'a', label: 'Plate A' }, { id: 'b', label: 'Plate B' }, { id: 'c', label: 'Plate C' }],
      bins: [{ id: 'polar', label: 'Polar' }, { id: 'nonpolar', label: 'Nonpolar' }]
    },
    hints: [
      'Switch the field on for each plate and show the arrows.',
      'Compare the net arrow on each plate, if there is one, after the bond arrows are added.',
      'File a molecule as polar when its bond arrows add to a net arrow and as nonpolar when they cancel.'
    ],
    check(state) {
      const rows = ['a', 'b', 'c'];
      if (rows.some(r => !state.bins[r])) return { ok: false, notYet: true, msg: 'File all three molecules.' };
      const want = { a: 'nonpolar', b: 'polar', c: 'polar' };
      if (rows.every(r => state.bins[r] === want[r])) return { ok: true };
      return { ok: false, msg: 'Switch the field on for the plate you are unsure of and watch whether it turns.' };
    },
    reward: {
      log: 'The field sorts molecules.',
      title: 'The Field Sorts Them',
      body: 'A molecule is polar when its bond dipoles add to a net pull and nonpolar when they cancel. Its shape matters as much as its bonds.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Charged Rod',
    prompt: 'Pick every liquid whose stream a charged rod will bend.',
    controls: ['field', 'arrows'],
    rigs: [
      field('ccl4', 'PLATE A', 'CCl4', 'a liquid of CCl₄ molecules'),
      field('chcl3', 'PLATE B', 'CHCl3', 'a liquid of CHCl₃ molecules'),
      field('h2o', 'PLATE C', 'H2O', 'a liquid of H₂O molecules')
    ],
    widget: {
      type: 'multi', label: 'Bent by the rod',
      options: [{ id: 'ccl4', label: 'CCl₄' }, { id: 'chcl3', label: 'CHCl₃' }, { id: 'h2o', label: 'H₂O' }]
    },
    hints: [
      'Switch the field on for each liquid\'s molecules.',
      'Compare which of the molecules turn in the field.',
      'A charged rod bends the stream of a liquid whose molecules turn in the field.'
    ],
    check(state) {
      if (!state.picks.length) return { ok: false, notYet: true, msg: 'Pick the liquids the rod will bend.' };
      const want = ['chcl3', 'h2o'];
      const got = state.picks.slice().sort();
      if (got.join() === want.join()) return { ok: true };
      if (got.includes('ccl4')) return { ok: false, msg: 'One of those liquids has molecules that do not turn in the field.' };
      return { ok: false, msg: 'Another liquid has molecules that turn in the field.' };
    },
    reward: {
      log: 'Polar liquids bend; nonpolar ones do not.',
      title: 'Polar Liquids Bend',
      body: 'A stream of molecules that turn in a field is pulled by a charged rod, and a stream of molecules that do not turn is left alone. How strongly molecules attract each other follows the same rule, which is the next unit\'s question.'
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
      body: 'A bond is polar when its atoms pull the pair unequally, and a molecule is polar when those pulls do not cancel. Shape decides: symmetrical molecules cancel their pulls even when every bond is strongly polar.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Whether a molecule is polar decides what it dissolves in, how it attracts its neighbours and how it behaves near a charge. You can now tell from a Lewis structure and a shape.'
    },
    {
      heading: 'Next',
      body: 'The last of the shape benches asks what the orbitals look like that make these bonds, and why some bonds turn and some will not.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'In an H–Cl bond, which atom carries the partial negative charge?',
    options: [
      { id: 'a', label: 'Chlorine, because it is more electronegative' },
      { id: 'b', label: 'Hydrogen, because it is smaller' },
      { id: 'c', label: 'Neither, because the bond is nonpolar' },
      { id: 'd', label: 'Hydrogen, because it has fewer electrons' }
    ],
    answer: 'a',
    explanation: 'Chlorine (3.16) pulls the shared pair harder than hydrogen (2.20), so chlorine ends up partially negative.'
  },
  {
    question: 'Why is CO₂ nonpolar although each C=O bond is polar?',
    options: [
      { id: 'a', label: 'The molecule is linear, so the two bond dipoles cancel' },
      { id: 'b', label: 'Carbon and oxygen have the same electronegativity' },
      { id: 'c', label: 'The molecule is bent' },
      { id: 'd', label: 'The bonds are triple bonds' }
    ],
    answer: 'a',
    explanation: 'The two equal bond dipoles point in opposite directions along a straight line and cancel.'
  },
  {
    question: 'Which molecule is polar?',
    options: [
      { id: 'a', label: 'H₂O' },
      { id: 'b', label: 'CCl₄' },
      { id: 'c', label: 'BF₃' },
      { id: 'd', label: 'CO₂' }
    ],
    answer: 'a',
    explanation: 'Water is bent, so its two O–H bond dipoles add. The other three are symmetrical and their dipoles cancel.'
  },
  {
    question: 'BF₃ has three very polar B–F bonds. Why is the molecule nonpolar?',
    options: [
      { id: 'a', label: 'It is trigonal planar, so the three dipoles cancel' },
      { id: 'b', label: 'It has a lone pair on boron' },
      { id: 'c', label: 'The bonds are not polar' },
      { id: 'd', label: 'Fluorine is less electronegative than boron' }
    ],
    answer: 'a',
    explanation: 'Three equal dipoles at 120 degrees to one another add to zero.'
  },
  {
    question: 'Which pair of atoms forms the most polar bond?',
    options: [
      { id: 'a', label: 'H and F' },
      { id: 'b', label: 'H and C' },
      { id: 'c', label: 'C and C' },
      { id: 'd', label: 'H and H' }
    ],
    answer: 'a',
    explanation: 'The larger the electronegativity difference, the more polar the bond. H (2.20) and F (3.98) differ most.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: 'cl' },
  { bins: { a: 'given', b: 'even', c: 'uneven' } },
  { choice: 'still' },
  { choice: 'add' },
  { choice: 'b' },
  { choice: 'a' },
  { bins: { a: 'nonpolar', b: 'polar', c: 'polar' } },
  { picks: ['chcl3', 'h2o'] }
];

export const MISSES = [
  { choice: 'h' },
  { bins: { a: 'uneven', b: 'even', c: 'given' } },
  { choice: 'turns' },
  { choice: 'polar' },
  { choice: 'a' },
  { choice: 'b' },
  { bins: { a: 'polar', b: 'polar', c: 'nonpolar' } },
  { picks: ['ccl4', 'h2o'] }
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
  let fieldOn = false;
  let arrowsOn = false;

  function paintAll() {
    paintToggle(runner.frame.el.controls, 'field', fieldOn);
    paintToggle(runner.frame.el.controls, 'arrows', arrowsOn);
  }

  /** Every warden answers the field its molecule stands in. */
  function reactAll(quiet = false) {
    for (const r of runner.stage.rigs) {
      runner.frame.foeReact(r.id, { rig: 'field', mol: r.mol, on: fieldOn }, quiet);
    }
  }

  function readNow() {
    const rows = runner.stage.rigs.map(r => {
      const d = planDipole(r.mol);
      return `${r.label}: ${fieldOn ? (d.polar ? 'turned to line up' : 'did not turn') : 'field off'}${arrowsOn ? `, net pull ${d.mag.toFixed(2)}` : ''}`;
    });
    runner.readout('Plates // reading', `${rows.join('. ')}.`);
  }

  function onProbe(hit) {
    if (hit.kind === 'field' || hit.kind === 'arrows') {
      fieldOn = rig.cfg.field; arrowsOn = rig.cfg.arrows;
      paintAll(); reactAll(); readNow();
    }
  }

  function onTool(tool) {
    if (tool === 'field') {
      fieldOn = !fieldOn;
      rig.setField(fieldOn);
      paintAll(); reactAll(); readNow();
    } else if (tool === 'arrows') {
      arrowsOn = !arrowsOn;
      rig.setArrows(arrowsOn);
      paintAll(); readNow();
    } else if (tool === 'turn') {
      rig.turn();
    }
  }

  function onLoad(stage, i, r) {
    fieldOn = false; arrowsOn = false;
    rig.setPlates(stage.rigs, { field: false, arrows: false });
    rig.setSelectable(false);
    r.setControls(fieldKeys(), onTool);
    paintAll();
    r.readout(null, null, { idleHead: 'Plates // standby', idle: 'The plates are off. Switch the field on.' });
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

export { RIG_MOLECULES, planDipole, bondKind };
