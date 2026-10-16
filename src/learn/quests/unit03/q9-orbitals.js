/**
 * q9-orbitals.js — Ligar, bench nine: MOLECULAR ORBITALS. Beyond the exam, and the
 * briefing and the first card say so.
 *
 * The box rack in its `molecular` layout. The two atoms' boxes stand at the sides
 * and the boxes they make between them stand in the middle, lowest energy at the
 * bottom; electrons go in two taps, never by drag, at most one of each spin to a
 * box. The magnet measures the REAL molecule, never the player's arrangement.
 *
 *   1  what becomes of two 1s boxes when atoms join       -> bonding orbital, antibonding orbital
 *   2  place H2's two electrons                           -> (electrons fill from the bottom)
 *   3  He2, and whether it would hold together            -> (bond order is zero)
 *   4  N2's bond order                                    -> (a triple bond is order three)
 *   5  O2 and the magnet                                  -> (Lewis cannot explain it)
 *   6  O2+, O2, O2- by bond length                        -> (higher order, shorter bond)
 *   7  why F2 is weaker than O2                           -> (more antibonding electrons)
 *   8  B2 in the other order, and why it is magnetic      -> (the order switch)
 *
 * EVERY COUNT IS `mo.readMO`; every unpaired figure the magnet gives is the real
 * one in `mo.DIATOMICS`, and `verify:learn` checks the graded fills against both.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { BoxRack } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { handKeys, paintHand } from '../../engine/rackcontrols.js';
import { pullWords } from '../../engine/magnetnotes.js';
import { DIATOMICS, fillMO, readMO, bondOrderOf } from '../../engine/mo.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bantibonding\b/i, introducedAt: 1 },
  { term: /\bbonding orbitals?\b/i, introducedAt: 1 },
  { term: /\bmolecular orbitals?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q8-hybrid', 'unit02/q6-filling', 'unit03/q3-distance'];

const SPEAKER = 'Vess';

const TOOL_TEXT = {
  hand: { key: 'Up, Down, Remove', what: 'Pick what the next tap on a box does: place an up arrow, place a down arrow, or lift one out.' },
  magnet: { key: 'Test Sample', what: 'Holds the real molecule to the magnet and reports how hard it is pulled.' }
};
export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const SYM = { H2: 'H', He2: 'He', B2: 'B', N2: 'N', O2: 'O', O2p: 'O', O2m: 'O', F2: 'F' };

/** One molecule's rack. `join: true` starts with the atoms apart. */
const rack = (id, label, mol, extra = {}) => ({
  id, label, head: 'rack', layout: 'molecular', mol,
  order: DIATOMICS[mol].order, molLabel: DIATOMICS[mol].label, atomLabel: SYM[mol],
  note: extra.note || DIATOMICS[mol].label, ...extra
});

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Two Become Two',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench models how atoms bond together. Press "Join Atoms" to see how atomic energy levels combine when a molecule forms.'
    },
    prompt: 'What happens to the two atomic 1s orbitals when two hydrogen atoms combine into H2?',
    controls: ['join'],
    rigs: [rack('a', 'PLATE A', 'H2', { combined: false, note: 'two hydrogen atoms, apart' })],
    widget: {
      type: 'choice', label: 'The two boxes',
      options: [
        { id: 'split', label: 'One sits lower than the originals and one sits higher' },
        { id: 'lower', label: 'Both sit lower' },
        { id: 'same', label: 'Both stay where they were' },
        { id: 'higher', label: 'Both sit higher' }
      ]
    },
    hints: [
      'Press Join Atoms and read the ladder.',
      'Compare the heights of the new boxes with the heights of the boxes they came from.',
      'Two boxes went in, so look for what is above and what is below the level they started at.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a description.' };
      if (state.choice === 'split') return { ok: true };
      return { ok: false, msg: 'Press Join Atoms and compare the new boxes with the level the old ones stood at.' };
    },
    reward: {
      log: 'Two atomic boxes make two molecular ones.',
      title: 'Bonding and Antibonding Orbitals',
      body: 'When two atoms\' orbitals combine they make two molecular orbitals: a bonding orbital below the originals and an antibonding orbital above them. Electrons in the lower box hold the atoms together, and electrons in the upper box push them apart.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Two Electrons',
    briefing: {
      speaker: SPEAKER,
      body: 'You now have hand controls to place electrons. Select "Up" or "Down" and tap a molecular orbital box to place an electron.'
    },
    prompt: 'Place both valence electrons into the lowest available molecular orbital for H2.',
    controls: ['hand'],
    rigs: [rack('a', 'PLATE A', 'H2', { note: 'two hydrogen atoms, joined' })],
    widget: { type: 'none' },
    hints: [
      'Pick Up or Down from the hand keys and tap a box.',
      'Compare the two boxes by how high they sit on the ladder.',
      'Put both electrons in the lower box, one pointing each way.'
    ],
    check(state) {
      const r = readMO('1s', state.racks?.a || {});
      if (r.total === 0) return { ok: false, notYet: true, msg: 'Place the two electrons on the rack.' };
      if (r.total !== 2) return { ok: false, msg: 'Count the electrons on the rack against the number the molecule has.' };
      if ((state.racks.a['g1s:0'] || '') === 'ud') return { ok: true };
      return { ok: false, msg: 'An electron is sitting higher on the ladder than it needs to be.' };
    },
    reward: {
      log: 'Both go in the lower box.',
      title: 'Electrons Fill From the Bottom',
      body: 'Both electrons go in the bonding orbital, paired. The molecule is lower in energy than the separate atoms, so the atoms stay together.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Four Electrons',
    prompt: 'Does the diatomic helium molecule He2 hold together based on its molecular orbital bond order?',
    controls: ['hand'],
    counts: true,
    rigs: [rack('a', 'PLATE A', 'He2', { note: 'two helium atoms, joined' })],
    widget: {
      type: 'choice', label: 'He₂',
      options: [{ id: 'holds', label: 'It would hold together' }, { id: 'no', label: 'It would not hold together' }]
    },
    hints: [
      'Place the four electrons from the bottom of the ladder up.',
      'Compare the electrons in the lower box with those in the upper one.',
      'Subtract the electrons in the upper box from those in the lower one.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an answer.' };
      if (state.choice === 'no') return { ok: true };
      return { ok: false, msg: 'Place all four and read the counts for the lower and the upper box.' };
    },
    reward: {
      log: 'Nothing gained, so nothing holds.',
      title: 'Bond Order From the Boxes',
      body: 'Half the difference between the electrons in bonding orbitals and those in antibonding orbitals is the bond order. He₂ has two of each, so its bond order is zero and the molecule does not form.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Ten Electrons',
    prompt: 'Determine the bond order of diatomic nitrogen from its filled molecular orbital diagram.',
    controls: ['hand'],
    counts: true,
    rigs: [rack('a', 'PLATE A', 'N2', { note: 'two nitrogen atoms, joined' })],
    widget: {
      type: 'choice', label: 'Bond order',
      options: [{ id: '1', label: '1' }, { id: '2', label: '2' }, { id: '2.5', label: '2.5' }, { id: '3', label: '3' }]
    },
    hints: [
      'Place the ten electrons from the bottom of the ladder up, one to each box in a row before pairing.',
      'Compare the electrons in the lower boxes with those in the upper ones.',
      'Half the difference between the two counts is the bond order.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a bond order.' };
      if (state.choice === '3') return { ok: true };
      return { ok: false, msg: 'Place the electrons and read the counts for the lower and the upper boxes before halving the difference.' };
    },
    reward: {
      log: 'Eight below, two above.',
      title: 'A Triple Bond in Boxes',
      body: 'Nitrogen has eight electrons in bonding boxes and two in antibonding ones, so its bond order is three: the triple bond a Lewis structure draws.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Oxygen and the Magnet',
    briefing: {
      speaker: SPEAKER,
      body: 'You can now test magnetism. Press "Test Sample" or "Test Rack" to see how the magnetic field pulls on unpaired electrons.'
    },
    prompt: 'Is molecular oxygen attracted into a magnetic field based on its unpaired electrons?',
    controls: ['hand', 'magnet'],
    counts: true,
    rigs: [rack('a', 'PLATE A', 'O2', { note: 'two oxygen atoms, joined' })],
    widget: {
      type: 'choice', label: 'In the magnet',
      options: [{ id: 'pulled', label: 'It is pulled toward it' }, { id: 'pushed', label: 'It is pushed slightly away' }]
    },
    hints: [
      'Place the twelve electrons from the bottom of the ladder up, and test the sample with the magnet.',
      'Compare the boxes in the top row of the electrons you placed: how many hold one arrow, and how many two.',
      'Electrons standing alone in a box are pulled by a magnet, and pairs are not.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an answer.' };
      if (state.choice === 'pulled') return { ok: true };
      return { ok: false, msg: 'Test the sample with the magnet and compare it with how the electrons sit on your rack.' };
    },
    reward: {
      log: 'Two electrons stand alone.',
      title: 'Oxygen Is Paramagnetic',
      body: 'The last two electrons of O₂ go one each into two separate antibonding boxes, so oxygen is paramagnetic — pulled by a magnet. A Lewis structure with every electron paired could not have said so.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Three Oxygens',
    prompt: 'Rank the three oxygen species from shortest bond length to longest based on their bond orders.',
    controls: ['hand'],
    counts: true,
    rigs: [
      rack('a', 'PLATE A', 'O2', { note: 'two oxygen atoms, joined' }),
      rack('b', 'PLATE B', 'O2p', { note: 'two oxygen atoms with one electron fewer' }),
      rack('c', 'PLATE C', 'O2m', { note: 'two oxygen atoms with one electron more' })
    ],
    widget: {
      type: 'order', label: 'Shortest first',
      rail: { first: 'Shortest bond', last: 'Longest bond' },
      items: [{ id: 'a', label: 'Plate A' }, { id: 'b', label: 'Plate B' }, { id: 'c', label: 'Plate C' }]
    },
    hints: [
      'Place each plate\'s electrons from the bottom of the ladder up.',
      'Compare the counts in the lower and the upper boxes on the three plates.',
      'The bond with the highest bond order is the shortest.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Put all three plates in order.' };
      if (state.order.join() === ['b', 'a', 'c'].join()) return { ok: true };
      return { ok: false, msg: 'Work out the bond order of each plate from its counts, then ask which order pulls the atoms closest.' };
    },
    reward: {
      log: 'A higher order is a shorter bond.',
      title: 'Higher Order, Shorter Bond',
      body: 'Taking an electron out of an antibonding box raises the bond order and shortens the bond, and adding one lowers it and lengthens the bond. O₂⁺ has the highest order of the three and O₂⁻ the lowest.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'A Weak Link',
    prompt: 'Why is the fluorine-fluorine bond weaker than the oxygen-oxygen bond based on their molecular orbital diagrams?',
    controls: ['hand'],
    counts: true,
    rigs: [
      rack('a', 'PLATE A', 'O2', { note: 'two oxygen atoms, joined' }),
      rack('b', 'PLATE B', 'F2', { note: 'two fluorine atoms, joined' })
    ],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        { id: 'anti', label: 'F₂ has two more electrons in antibonding boxes, so its bond order is lower' },
        { id: 'size', label: 'Fluorine atoms are lighter than oxygen atoms' },
        { id: 'more', label: 'F₂ has more bonding electrons than O₂' },
        { id: 'same', label: 'F₂ has the same bond order as O₂' }
      ]
    },
    hints: [
      'Place the electrons for both plates from the bottom of the ladder up.',
      'Compare the electrons in the upper boxes on the two plates.',
      'Subtract the upper count from the lower on each plate and halve it.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'anti') return { ok: true };
      if (state.choice === 'more') return { ok: false, msg: 'Count the electrons in the lower boxes on the two plates before choosing.' };
      return { ok: false, msg: 'Fill both plates and compare the bond orders you get.' };
    },
    reward: {
      log: 'Every extra antibonding electron costs a bond.',
      title: 'Weaker With Each Antibonding Electron',
      body: 'F₂ fills both antibonding π boxes completely, so its bond order is only one. Each antibonding electron cancels the hold of a bonding one, and the weak F–F bond is the result.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Other Order',
    prompt: 'Why is diboron paramagnetic according to its molecular orbital electron configuration?',
    controls: ['hand', 'magnet'],
    counts: true,
    rigs: [rack('a', 'PLATE A', 'B2', { note: 'two boron atoms, joined' })],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        { id: 'alone', label: 'Its last two electrons go one each into two separate boxes' },
        { id: 'odd', label: 'It has an odd number of electrons' },
        { id: 'sigma', label: 'Its last two electrons pair up in the end-on box' },
        { id: 'atoms', label: 'Boron atoms are magnetic on their own' }
      ]
    },
    hints: [
      'Place the six electrons from the bottom of the ladder up, and test the sample.',
      'Compare the order of the boxes on this rack with the order on the oxygen rack.',
      'Fill the boxes in the order this rack shows, and see where the last two electrons land.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'alone') return { ok: true };
      if (state.choice === 'odd') return { ok: false, msg: 'Count the electrons B₂ has.' };
      return { ok: false, msg: 'Fill the rack in the order it shows and compare it with what the magnet says.' };
    },
    reward: {
      log: 'The boxes swap order below oxygen.',
      title: 'The Order Switch',
      body: 'In molecules up to nitrogen the side-to-side π boxes sit below the end-on one, because the 2s and 2p boxes mix. B₂\'s last two electrons then go into separate π boxes, so B₂ is paramagnetic — pulled by a magnet. This is beyond the exam.'
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
      body: 'Atomic boxes combine into molecular ones, half of them bonding and half antibonding, and electrons fill them from the bottom up. Half the difference between the bonding electrons and the antibonding ones is the bond order, and it sets length, strength and whether the molecule exists at all.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Where a Lewis structure fails, as with oxygen\'s magnetism, the boxes still work. That is why chemists keep both models and know which question each one answers.'
    },
    {
      heading: 'Next',
      body: 'Ligar\'s last guard stands at the end of the cut. It is made of everything you have measured here.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the bond order of N₂?',
    options: [
      { id: 'a', label: '3' },
      { id: 'b', label: '2' },
      { id: 'c', label: '1' },
      { id: 'd', label: '2.5' }
    ],
    answer: 'a',
    explanation: 'N₂ has 8 electrons in bonding orbitals and 2 in antibonding orbitals: (8 − 2)/2 = 3.'
  },
  {
    question: 'Why does He₂ not exist as a stable molecule?',
    options: [
      { id: 'a', label: 'Its bonding and antibonding orbitals are both filled, so its bond order is zero' },
      { id: 'b', label: 'Helium atoms repel each other electrically' },
      { id: 'c', label: 'Helium has no electrons' },
      { id: 'd', label: 'Helium atoms are too big' }
    ],
    answer: 'a',
    explanation: 'Two electrons in the bonding orbital and two in the antibonding orbital cancel: (2 − 2)/2 = 0.'
  },
  {
    question: 'Which statement about O₂ does a molecular orbital diagram explain, but a Lewis structure does not?',
    options: [
      { id: 'a', label: 'It is attracted to a magnet because it has two unpaired electrons' },
      { id: 'b', label: 'It has a double bond' },
      { id: 'c', label: 'It is a gas at room temperature' },
      { id: 'd', label: 'It has 12 valence electrons' }
    ],
    answer: 'a',
    explanation: 'The last two electrons go one each into two degenerate π* orbitals, so O₂ is paramagnetic.'
  },
  {
    question: 'Put O₂⁺, O₂ and O₂⁻ in order of increasing bond length.',
    options: [
      { id: 'a', label: 'O₂⁺ < O₂ < O₂⁻' },
      { id: 'b', label: 'O₂⁻ < O₂ < O₂⁺' },
      { id: 'c', label: 'O₂ < O₂⁺ < O₂⁻' },
      { id: 'd', label: 'All the same' }
    ],
    answer: 'a',
    explanation: 'Bond orders are 2.5, 2 and 1.5. The higher the bond order, the shorter the bond.'
  },
  {
    question: '(Beyond the exam.) Why is B₂ paramagnetic?',
    options: [
      { id: 'a', label: 'Its last two electrons occupy separate π orbitals, since π lies below σ in B₂' },
      { id: 'b', label: 'It has an odd number of electrons' },
      { id: 'c', label: 'Its bond order is zero' },
      { id: 'd', label: 'It has a triple bond' }
    ],
    answer: 'a',
    explanation: 'For B₂ the two π2p orbitals are filled before σ2p, so the last two electrons enter them singly.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return { racks: {} }; }

export const SOLUTIONS = [
  { choice: 'split' },
  { racks: { a: fillMO('1s', 2) } },
  { choice: 'no' },
  { choice: '3' },
  { choice: 'pulled' },
  { order: ['b', 'a', 'c'] },
  { choice: 'anti' },
  { choice: 'alone' }
];

export const MISSES = [
  { choice: 'lower' },
  { racks: { a: { 'u1s:0': 'ud' } } },
  { choice: 'holds' },
  { choice: '2' },
  { choice: 'pushed' },
  { order: ['a', 'b', 'c'] },
  { choice: 'same' },
  { choice: 'odd' }
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

  function paintAll() {
    paintHand(runner.frame.el.controls, bench.cfg.hand, false);
  }

  /** Every crawler holds, or comes apart, as the bond order on its own plate says. */
  function reactAll(quiet = false) {
    for (const rig of runner.stage.rigs) {
      const r = bench.readOf(rig.id);
      runner.frame.foeReact(rig.id, { kind: 'order', order: r.bondOrder, placed: r.total }, quiet);
    }
  }

  function onProbe(hit) {
    if (hit.kind === 'hand') { paintAll(); return; }
    if (hit.kind === 'rack') {
      runner.state.racks[hit.plateId] = hit.rack;
      const d = hit.action === 'refused'
        ? { head: 'Rack // refused', body: hit.reason }
        : hit.action === 'removed'
          ? { head: 'Rack // removed', body: 'One electron lifted out of a box.' }
          : { head: 'Rack // placed', body: `One electron placed, pointing ${hit.spin === 'u' ? 'up' : 'down'}.` };
      runner.readout(d.head, d.body);
      reactAll();
      paintAll();
    }
  }

  function onTool(tool) {
    if (tool.startsWith('hand:')) {
      bench.setHand(tool.split(':')[1]);
      paintAll();
    } else if (tool === 'clear') {
      bench.clear();
      for (const rig of runner.stage.rigs) runner.state.racks[rig.id] = bench.rackOf(rig.id);
      runner.readout('Rack // cleared', 'The rack is back to how the stage handed it over.');
      reactAll(true);
    } else if (tool === 'join') {
      for (const rig of runner.stage.rigs) bench.combine(rig.id);
      runner.readout('Atoms // joined', 'The two boxes of each atom have become the boxes of the molecule.');
    } else if (tool === 'magnet-sample') {
      const rig = runner.stage.rigs[0];
      const m = bench.measured(rig.id);
      if (m == null) return;
      bench.pull?.(rig.id, m);
      runner.readout('Magnet // sample', `${rig.label}: ${pullWords(m)}`);
    } else if (tool === 'magnet-rack') {
      const rig = runner.stage.rigs[0];
      const reading = bench.readOf(rig.id);
      bench.pull?.(rig.id, reading.unpaired);
      runner.readout('Magnet // rack', `The arrangement on the rack: ${pullWords(reading.unpaired)}`);
    }
  }

  function onLoad(stage, i, r) {
    bench.setPlates(stage.rigs, { show: { counts: Boolean(stage.counts) }, hand: null });
    bench.setSelectable(false);
    const parts = [];
    if (stage.controls.includes('join')) {
      parts.push(`
        <div class="cb-field" role="group" aria-label="Atoms">
          <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="join">Join Atoms</button>
        </div>`);
    }
    if (stage.controls.includes('hand')) parts.push(handKeys({ clear: true, core: false }));
    if (stage.controls.includes('magnet')) {
      parts.push(`
        <div class="cb-field" role="group" aria-label="Magnet">
          <span class="form-label">Magnet</span>
          <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="magnet-sample">Test Sample</button>
          <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="magnet-rack">Test Rack</button>
        </div>`);
    }
    r.setControls(parts, onTool);
    paintHand(r.frame.el.controls, null, false);
    r.readout(null, null, {
      idleHead: 'Rack // standby',
      idle: stage.controls.includes('hand') ? 'Pick a hand, then tap a box.' : 'Press Join Atoms.'
    });
    reactAll(true);
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { bench = BoxRack(r.frame.instrumentHost, { onProbe }); },
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

export { bondOrderOf };
