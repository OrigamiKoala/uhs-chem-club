/**
 * q3-distance.js — Ligar, bench three: BOND ENERGY.
 *
 * The bond bench. Benches one and two found out WHETHER two atoms hold and what
 * that builds. This one asks how far apart they sit and how much holds them: a
 * crank winds a pair apart or together and the plate keeps a trace of the energy
 * at every separation it passes through, so the curve is something the player
 * builds and its bottom is a place they find.
 *
 *   1  find where the pair holds the least energy        -> potential energy curve, bond length
 *   2  the energy to part a pair completely              -> bond energy
 *   3  what pushing them together does                   -> (the nuclei repel)
 *   4  why chlorine's bottom sits further out            -> (more shells, bigger atoms)
 *   5  order three carbon-carbon bonds by length          -> bond order
 *   6  how length and energy go together                 -> (shorter is stronger)
 *   7  order three lattices by how strongly they hold    -> lattice energy
 *   8  which of two salts melts higher                   -> (a tighter lattice melts higher)
 *
 * EVERY FIGURE IS A MEASURED ONE. The pair plates draw `bonddata.planCurve` over
 * the real bond length and bond energy; the lattice plates are real ion radii and
 * charges. A lattice plate reads no energy: charge and size are the evidence, and
 * the order is something the player works out (and `verify:learn` checks it
 * against the real lattice energies).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { BondBench } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { PAIRS, LATTICES, IONS, planCurve, byLatticeEnergy, coulombIndex } from '../../engine/bonddata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\blattice energ(?:y|ies)\b/i, introducedAt: 7 },
  { term: /\bbond orders?\b/i, introducedAt: 5 },
  { term: /\bbond energ(?:y|ies)\b/i, introducedAt: 2 },
  { term: /\bbond lengths?\b/i, introducedAt: 1 },
  { term: /\bpotential energy curves?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q1-joins', 'unit03/q2-lattice', 'unit02/q8-trends'];

const SPEAKER = 'Vess';

/** Only the one key whose label does not say what it does. */
const TOOL_TEXT = {};
export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const kJ = n => ({ id: String(n), label: `${n} kJ/mol` });
const pm = n => ({ id: String(n), label: `${n} pm` });

/** Settings the crank stops at: every real bottom on the stage is one of them. */
const SET_H = [40, 50, 60, 66, 70, 74, 78, 84, 90, 100, 120, 160, 220, 300];
const SET_HCL = [70, 90, 105, 118, 127, 136, 150, 175, 220, 330];
const SET_TWO = [50, 66, 74, 84, 100, 140, 170, 190, 199, 210, 240, 330];
const SET_CC = [90, 100, 110, 120, 127, 134, 142, 150, 154, 160, 180, 240, 330];

const pair = (id, label, key, extra = {}) => ({ id, label, head: 'pair', pair: key, ...extra });
const lattice = (id, key, extra = {}) => ({ id, label: LATTICES[key].label, head: 'lattice', lattice: key, ...extra });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'The Bottom',
    briefing: {
      speaker: SPEAKER,
      body: 'The crank winds two atoms apart or together, and the trace on the plate keeps every point it passes through. Clear Trace wipes it and starts the trace again.'
    },
    prompt: 'Find the separation at which the two atoms hold the least energy.',
    controls: ['crank', 'clear'],
    settings: SET_H,
    start: 14,
    rigs: [pair('a', 'PAIR A', 'H-H', { note: 'two hydrogen atoms' })],
    widget: { type: 'choice', label: 'Lowest at', options: [pm(60), pm(74), pm(90), pm(120)] },
    encounter: {
      species: 'slag crawler',
      act: 'Mark Bottom',
      intent: 'A slag crawler lies along the rail, as long as the crank makes it.'
    },
    hints: [
      'Wind the crank through its whole range and let the trace fill in.',
      'Compare the points on either side of the lowest one the trace has drawn.',
      'The answer is the separation printed under the point where the energy is most negative.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a separation.' };
      const r0 = PAIRS['H-H'].r0;
      if (Number(state.choice) === r0) return { ok: true };
      return Number(state.choice) < r0
        ? { ok: false, msg: 'Squeezed in that far the trace has already started to climb again.' }
        : { ok: false, msg: 'Wound out that far the trace is higher than it is closer in.' };
    },
    reward: {
      log: 'The lowest point of the trace.',
      title: 'Potential Energy Curve',
      body: 'The trace is a potential energy curve: the energy of the pair at every separation. Its lowest point is where the atoms are happiest, and that separation is the bond length.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Pulling Apart',
    prompt: 'Give the energy it takes to pull this pair completely apart.',
    controls: ['crank', 'clear'],
    settings: SET_HCL,
    start: 10,
    rigs: [pair('a', 'PAIR A', 'H-Cl', { note: 'a hydrogen atom and a chlorine atom' })],
    widget: { type: 'choice', label: 'To part them', options: [kJ(127), kJ(216), kJ(431), kJ(862)] },
    encounter: {
      species: 'slag crawler',
      act: 'Mark Depth',
      intent: 'The crawler is stretched along the rail and pulls back as the crank turns.'
    },
    hints: [
      'Wind the crank until the atoms are far enough apart that the trace stops rising.',
      'Measure from the zero line down to the lowest point the trace has reached.',
      'The energy to part the pair is how far below the zero line the bottom of the trace sits.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an energy.' };
      const de = PAIRS['H-Cl'].de;
      if (Number(state.choice) === de) return { ok: true };
      if (Number(state.choice) === PAIRS['H-Cl'].r0) return { ok: false, msg: 'That figure is a separation. The question asks for an energy.' };
      return Number(state.choice) < de
        ? { ok: false, msg: 'The well goes deeper than that: measure all the way from the zero line to its bottom.' }
        : { ok: false, msg: 'The well is not as deep as that. Measure from the zero line to its bottom.' };
    },
    reward: {
      log: 'The depth of the well.',
      title: 'Bond Energy',
      body: 'The depth of the well, measured from the zero line down to its bottom, is the energy it takes to pull the atoms completely apart. That is the bond energy.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Squeezed',
    prompt: 'Say what happens to the energy when the atoms are pushed closer than the lowest point.',
    controls: ['crank', 'clear'],
    settings: SET_H,
    start: 6,
    rigs: [pair('a', 'PAIR A', 'H-H', { note: 'two hydrogen atoms' })],
    widget: {
      type: 'choice', label: 'Closer in',
      options: [
        { id: 'climbs', label: 'It climbs steeply' },
        { id: 'flat', label: 'It stays at the lowest value' },
        { id: 'drops', label: 'It drops lower still' },
        { id: 'zero', label: 'It falls to zero' }
      ]
    },
    encounter: {
      species: 'slag crawler',
      act: 'Mark Climb',
      intent: 'The crawler is crushed shorter every time the crank closes the gap.'
    },
    hints: [
      'Wind the crank toward the smallest separations and watch where the new points land.',
      'Compare the energy at the lowest point with the energy at the closest settings.',
      'Read whether the points closest in sit above or below the points further out.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what the energy does.' };
      if (state.choice === 'climbs') return { ok: true };
      if (state.choice === 'flat') return { ok: false, msg: 'The points do not stay level as the crank closes in; read the closest few.' };
      if (state.choice === 'drops') return { ok: false, msg: 'If it dropped, the lowest point would not be where the trace turns round.' };
      return { ok: false, msg: 'Zero is the energy of two atoms parted. Closing in does not take them back there.' };
    },
    reward: {
      log: 'Closer in, the trace climbs.',
      title: 'Nuclei Repel',
      body: 'Pushed closer than the bond length, the positive nuclei repel each other and the energy climbs steeply. That repulsion is what holds the bottom of the well where it is.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Two Sizes',
    prompt: 'Say why the chlorine pair bottoms out further out than the hydrogen pair.',
    controls: ['crank', 'clear'],
    settings: SET_TWO,
    start: 12,
    rigs: [
      pair('a', 'PAIR A', 'H-H', { note: 'two hydrogen atoms, one shell each' }),
      pair('b', 'PAIR B', 'Cl-Cl', { note: 'two chlorine atoms, three shells each' })
    ],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        { id: 'size', label: 'Chlorine atoms are bigger, so their outer shells meet further apart' },
        { id: 'mass', label: 'Chlorine atoms are heavier' },
        { id: 'grip', label: 'Chlorine atoms hold each other more tightly' },
        { id: 'charge', label: 'Chlorine atoms carry a charge' }
      ]
    },
    encounter: {
      species: 'slag crawler',
      act: 'Mark Cause',
      intent: 'Two crawlers lie on two rails, one far longer than the other.'
    },
    hints: [
      'Wind the crank until both traces have a bottom, then compare where the two sit.',
      'Compare the atoms themselves: how many shells each carries and how big each disc is.',
      'Atoms cannot get closer than the point where their outer shells begin to meet.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'size') return { ok: true };
      if (state.choice === 'mass') return { ok: false, msg: 'Weight takes no part in where a trace bottoms out; the same curve would come from heavier or lighter atoms.' };
      if (state.choice === 'grip') return { ok: false, msg: 'The depth of a well says how hard the pair holds. The question is about where the bottom sits along the axis.' };
      return { ok: false, msg: 'Neither pair carries a charge. Look for what differs between the atoms on the two plates.' };
    },
    reward: {
      log: 'Bigger atoms sit further apart.',
      title: 'Size Sets the Length',
      body: 'More shells make a bigger atom, and bigger atoms cannot get as close before their outer electrons meet. So a bond between larger atoms is longer.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Three Wells',
    prompt: 'Put the three carbon–carbon bonds in order, longest first.',
    controls: ['crank', 'clear'],
    settings: SET_CC,
    start: 13,
    rigs: [
      pair('a', 'PAIR A', 'C#C', { note: 'two carbon atoms' }),
      pair('b', 'PAIR B', 'C-C', { note: 'two carbon atoms' }),
      pair('c', 'PAIR C', 'C=C', { note: 'two carbon atoms' })
    ],
    widget: {
      type: 'order', label: 'Longest first',
      items: [{ id: 'a', label: 'Pair A' }, { id: 'b', label: 'Pair B' }, { id: 'c', label: 'Pair C' }]
    },
    encounter: {
      species: 'slag crawler',
      act: 'Mark Order',
      intent: 'Three crawlers lie side by side, each stopped at a different length.'
    },
    hints: [
      'Wind the crank until all three traces have a bottom.',
      'Compare where each bottom sits along the separation axis, and what is printed on each plate.',
      'Put first the plate whose lowest point sits at the widest separation.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Put all three plates in order.' };
      const want = ['b', 'c', 'a'];
      if (state.order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Compare where each trace bottoms out along the separation axis, not how deep it goes.' };
    },
    reward: {
      log: 'The more pairs shared, the shorter the bond.',
      title: 'Bond Order',
      body: 'The number of shared pairs between two atoms is the bond order. Each extra pair draws the atoms closer, so a higher bond order means a shorter bond.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Deeper Too',
    prompt: 'Say how bond length goes with bond energy across those three bonds.',
    controls: ['crank', 'clear'],
    settings: SET_CC,
    start: 13,
    rigs: [
      pair('a', 'PAIR A', 'C-C', { note: 'two carbon atoms' }),
      pair('b', 'PAIR B', 'C=C', { note: 'two carbon atoms' }),
      pair('c', 'PAIR C', 'C#C', { note: 'two carbon atoms' })
    ],
    widget: {
      type: 'choice', label: 'The shorter the bond',
      options: [
        { id: 'stronger', label: 'The more energy it takes to break it' },
        { id: 'weaker', label: 'The less energy it takes to break it' },
        { id: 'same', label: 'The energy stays about the same' }
      ]
    },
    encounter: {
      species: 'slag crawler',
      act: 'Mark Link',
      intent: 'The crawlers stand in a row, the shortest set deepest into the plate.'
    },
    hints: [
      'Wind the crank until all three traces have a bottom.',
      'Compare the depth of each well with where its bottom sits.',
      'Read whether the plate with the lowest bottom is also the one with the smallest separation.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose how they go together.' };
      if (state.choice === 'stronger') return { ok: true };
      if (state.choice === 'weaker') return { ok: false, msg: 'The shortest of the three is not the shallowest; compare the plates side by side.' };
      return { ok: false, msg: 'The three wells are not equally deep.' };
    },
    reward: {
      log: 'Shorter bonds are stronger bonds.',
      title: 'Shorter and Stronger',
      body: 'Across a family of bonds, the shorter one is the stronger one. The extra shared pairs both draw the atoms closer and hold them harder.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Salt Strength',
    prompt: 'Put the three salts in order of how strongly their ions are held, strongest first.',
    controls: [],
    rigs: [lattice('a', 'NaCl'), lattice('b', 'KCl'), lattice('c', 'MgO')],
    widget: {
      type: 'order', label: 'Strongest first',
      items: [{ id: 'a', label: 'NaCl' }, { id: 'b', label: 'KCl' }, { id: 'c', label: 'MgO' }]
    },
    hints: [
      'Tap each plate to read its ions.',
      'Compare the charges on the ions first, then how far apart their centres sit.',
      'Order by the size of the charges first, and where the charges tie, put the smaller ions ahead.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Put all three salts in order.' };
      const want = byLatticeEnergy(['NaCl', 'KCl', 'MgO']).map(l => ({ NaCl: 'a', KCl: 'b', MgO: 'c' })[l]);
      if (state.order.join() === want.join()) return { ok: true };
      if (state.order[0] !== want[0]) return { ok: false, msg: 'Compare the charges on the ions of the three plates before anything else.' };
      return { ok: false, msg: 'The two salts with matching charges differ in how big their ions are.' };
    },
    reward: {
      log: 'Charge and size set the hold.',
      title: 'Lattice Energy',
      body: 'The energy needed to separate a lattice into its ions is the lattice energy. It rises with the charges on the ions and falls as the ions get bigger.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Melting Higher',
    prompt: 'Say which of the two salts melts at the higher temperature.',
    controls: [],
    rigs: [lattice('a', 'NaF'), lattice('b', 'NaCl')],
    widget: {
      type: 'choice', label: 'Melts higher',
      options: [{ id: 'a', label: 'NaF' }, { id: 'b', label: 'NaCl' }]
    },
    hints: [
      'Tap each plate to read its ions.',
      'Compare the two plates by the distance between ion centres, since the charges match.',
      'The salt held more tightly takes more heat before its ions can move.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a salt.' };
      if (state.choice === 'a') return { ok: true };
      return { ok: false, msg: 'Compare how far apart the ion centres sit on the two plates, and what that does to the hold.' };
    },
    reward: {
      log: 'A tighter lattice melts higher.',
      title: 'Tighter Lattice, Higher Melting Point',
      body: 'A more tightly held lattice takes more heat before its ions can move, so it melts at a higher temperature. Fluoride ions are smaller than chloride ions, so sodium fluoride holds harder.'
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
      body: 'Two atoms settle where the pull between them and the push between their nuclei balance, and that sets how long the bond is and how much it costs to break. Bigger atoms sit further apart, more shared pairs sit closer and hold harder, and a lattice is held by charge over distance.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every bond length and bond energy in a table is a point on one of these curves. You can now say why one is long, why another is strong, and why one salt melts before another.'
    },
    {
      heading: 'Next',
      body: 'The next bench lays the electrons out on a slate, so you can see where each one of a molecule\'s pairs goes.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'On a potential energy curve for two bonded atoms, what does the lowest point represent?',
    options: [
      { id: 'a', label: 'The bond length, where the energy is a minimum' },
      { id: 'b', label: 'The separation at which the atoms are fully parted' },
      { id: 'c', label: 'The point of greatest repulsion' },
      { id: 'd', label: 'The point where the atoms have no energy' }
    ],
    answer: 'a',
    explanation: 'The atoms are most stable at the separation where attraction and repulsion balance. That separation is the bond length, and the depth of the well there is the bond energy.'
  },
  {
    question: 'Why is the H–H bond shorter than the Cl–Cl bond?',
    options: [
      { id: 'a', label: 'Hydrogen atoms are smaller, so their outer shells meet closer together' },
      { id: 'b', label: 'Hydrogen atoms are lighter' },
      { id: 'c', label: 'The H–H bond is weaker' },
      { id: 'd', label: 'Hydrogen atoms carry a charge' }
    ],
    answer: 'a',
    explanation: 'Atomic size sets how close two atoms can get. A hydrogen atom has one small shell, a chlorine atom three, so the chlorine pair sits further apart.'
  },
  {
    question: 'Which carbon–carbon bond is the shortest and the strongest?',
    options: [
      { id: 'a', label: 'The triple bond' },
      { id: 'b', label: 'The double bond' },
      { id: 'c', label: 'The single bond' },
      { id: 'd', label: 'All three are the same' }
    ],
    answer: 'a',
    explanation: 'Each extra shared pair draws the atoms closer and holds them harder. C≡C is about 120 pm and 839 kJ/mol, against 154 pm and 348 kJ/mol for C–C.'
  },
  {
    question: 'Which has the largest lattice energy?',
    options: [
      { id: 'a', label: 'MgO' },
      { id: 'b', label: 'NaCl' },
      { id: 'c', label: 'KCl' },
      { id: 'd', label: 'NaF' }
    ],
    answer: 'a',
    explanation: 'Lattice energy grows with the product of the ion charges and shrinks with the distance between them. MgO has 2+ and 2− ions that are also small.'
  },
  {
    question: 'Sodium fluoride melts at a higher temperature than sodium chloride. What is the best explanation?',
    options: [
      { id: 'a', label: 'Fluoride ions are smaller, so the ions sit closer and are held more strongly' },
      { id: 'b', label: 'Fluoride has a larger charge than chloride' },
      { id: 'c', label: 'Sodium fluoride is made of molecules' },
      { id: 'd', label: 'Sodium fluoride has covalent bonds' }
    ],
    answer: 'a',
    explanation: 'Both ions carry one unit of charge, but fluoride is smaller, so the centres are closer and the lattice energy is larger. More heat is needed to free the ions.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return { setting: stage.start || 1 };
}

export const SOLUTIONS = [
  { choice: '74' },
  { choice: '431' },
  { choice: 'climbs' },
  { choice: 'size' },
  { order: ['b', 'c', 'a'] },
  { choice: 'stronger' },
  { order: byLatticeEnergy(['NaCl', 'KCl', 'MgO']).map(l => ({ NaCl: 'a', KCl: 'b', MgO: 'c' })[l]) },
  { choice: 'a' }
];

export const MISSES = [
  { choice: '120' },
  { choice: '216' },
  { choice: 'flat' },
  { choice: 'mass' },
  { order: ['a', 'b', 'c'] },
  { choice: 'weaker' },
  { order: ['b', 'a', 'c'] },
  { choice: 'b' }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let bench = null;
  let runner = null;

  function paintCrank() {
    const st = runner.stage.settings;
    if (!st) return;
    runner.paintDial('setting', runner.state.setting, { min: 1, max: st.length, text: `${st[runner.state.setting - 1]} pm` });
  }

  function setSetting(v) {
    runner.state.setting = v;
    bench.setSetting(v);
    paintCrank();
    readNow();
  }

  /** The plates' present readings, and each crawler's answer to them. */
  function readNow(quiet = false) {
    const stage = runner.stage;
    const lines = [];
    for (const rig of stage.rigs) {
      if (rig.head !== 'pair') continue;
      const rd = bench.reading(rig.id);
      if (!rd) continue;
      runner.frame.foeReact(rig.id, { kind: 'curve', pair: rig.pair, r: rd.r }, quiet);
      lines.push(`${rig.label}: ${rd.r} pm apart, energy ${rd.energy} kJ/mol`);
    }
    if (lines.length) runner.readout('Crank // reading', `${lines.join('. ')}.`);
  }

  function onProbe(hit) {
    if (hit.kind === 'pair') {
      runner.readout(`Plate // ${hit.plateId.toUpperCase()}`, `${hit.r} pm apart, energy ${hit.energy} kJ/mol.`);
    } else if (hit.kind === 'lattice') {
      const c = hit.cation; const a = hit.anion;
      const q = n => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
      runner.readout(`Plate // ${hit.lattice}`, `${c.sym} ${q(c.charge)}, ${c.radius} pm. ${a.sym} ${q(a.charge)}, ${a.radius} pm. Centres ${hit.centres} pm apart.`);
    }
  }

  function onTool(tool) {
    if (tool === 'clear') {
      bench.clearTrace();
      readNow(true);
    }
  }

  function onLoad(stage, i, r) {
    bench.setPlates(stage.rigs, { settings: stage.settings || [], setting: r.state.setting });
    bench.setSelectable(false);

    const parts = [];
    const dials = {};
    if (stage.settings) {
      parts.push(r.dialHtml('setting', { label: 'Separation', min: 1, max: stage.settings.length, value: r.state.setting }));
      dials.setting = { min: 1, max: stage.settings.length, onChange: v => setSetting(v) };
      parts.push(`
        <div class="cb-field" role="group" aria-label="Trace">
          <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="clear">Clear Trace</button>
        </div>
      `);
    }
    r.setControls(parts, onTool, { dials });
    if (stage.settings) {
      paintCrank();
      readNow(true);
    } else {
      r.readout(null, null, { idleHead: 'Plates // standby', idle: 'Tap a plate to read its ions.' });
    }
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { bench = BondBench(r.frame.instrumentHost, { onProbe, onSetting: v => setSetting(v) }); },
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { planCurve, coulombIndex, IONS };
