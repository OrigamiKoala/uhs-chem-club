/**
 * q5-resonance.js — Ligar, bench five: FORMAL CHARGE AND RESONANCE.
 *
 * The pair board again, with two tools it did not offer at bench four: a CHARGE
 * tool that stencils the charge each atom carries, and a GAUGE that reads the
 * measured length of a bond. The gauge reads the real molecule and not the
 * drawing, which is what makes ozone a discovery: the drawing says one double
 * bond and one single, and the gauge says both are the same.
 *
 *   1  the atom that owns one electron too few           -> formal charge
 *   2  the better of two drawings of carbon dioxide        -> (charges near zero)
 *   3  the better of two drawings of thiocyanate           -> (negative on the stronger puller)
 *   4  ozone's two bonds, drawn one way and measured       -> resonance
 *   5  every place nitrate's double bond can go            -> resonance structures
 *   6  the order of each nitrate bond                      -> fractional bond order
 *   7  which carbonate drawing counts most                 -> delocalized electrons
 *   8  why water has no resonance                          -> (nothing to move)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { PairBoard } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { pairKeys, paintPairHand, paintCharges, describeBoard, boardState } from '../../engine/paircontrols.js';
import {
  MOLECULES, DRAWINGS, planLewis, allLit, drawing, blankDrawing, distinctDrawings, drawingKey, linkKey, gaugeLength
} from '../../engine/lewis.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bdelocali[sz]ed\b/i, introducedAt: 7 },
  { term: /\bfractional bond orders?\b/i, introducedAt: 6 },
  { term: /\bresonance structures?\b/i, introducedAt: 5 },
  { term: /\bresonance\b/i, introducedAt: 4 },
  { term: /\bformal charges?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q4-dots', 'unit03/q3-distance', 'unit02/q8-trends'];

const SPEAKER = 'Vess';

const TOOL_TEXT = {
  gauge: { key: 'Read Length', what: 'Tap a bond to read how long it measures in the real molecule.' }
};
export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const slate = (id, label, mol, extra = {}) => ({ id, label, head: 'slate', mol, ...extra });
const fixed = (id, label, mol, prefill, extra = {}) => slate(id, label, mol, { prefill, locked: true, ...extra });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Who Owns What',
    briefing: {
      speaker: SPEAKER,
      body: 'Use "Show Charges" to inspect the electrical charge each atom carries in a drawing. Drawings can also be fixed on the slate so they can only be read.'
    },
    prompt: 'Which atom in carbon monoxide carries a positive formal charge?',
    controls: ['charges'],
    rigs: [fixed('a', 'DRAWING A', 'CO', DRAWINGS.CO)],
    widget: {
      type: 'choice', label: 'The atom',
      options: [{ id: 'c', label: 'Carbon' }, { id: 'o', label: 'Oxygen' }]
    },
    hints: [
      'Switch on the charges and read the number beside each atom.',
      'Compare the electrons each atom brings with the electrons it owns, counting a bond as one and a lone pair as two.',
      'An atom that owns one electron fewer than it brought reads positive.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an atom.' };
      if (state.choice === 'o') return { ok: true };
      return { ok: false, msg: 'That atom owns one electron more than it brought, not one fewer.' };
    },
    reward: {
      log: 'Brought minus owned.',
      title: 'Formal Charge',
      body: 'An atom\'s formal charge is the electrons it brings minus the electrons it owns, counting each bond as one and each lone pair as two. In this drawing oxygen is +1 and carbon is −1.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Two Drawings',
    prompt: 'Which drawing of carbon dioxide is more stable based on formal charges?',
    controls: ['charges'],
    rigs: [
      fixed('a', 'DRAWING A', 'CO2', DRAWINGS.CO2_triple),
      fixed('b', 'DRAWING B', 'CO2', DRAWINGS.CO2_double)
    ],
    widget: { type: 'choice', label: 'The better drawing', options: [{ id: 'a', label: 'Drawing A' }, { id: 'b', label: 'Drawing B' }] },
    hints: [
      'Switch on the charges and read both drawings.',
      'Compare the charges on the atoms of each drawing.',
      'Prefer the drawing whose atoms carry charges closest to zero.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a drawing.' };
      if (state.choice === 'b') return { ok: true };
      return { ok: false, msg: 'Both drawings light every lamp, so the lamps cannot choose. Compare what the charges say.' };
    },
    reward: {
      log: 'Charges near zero win.',
      title: 'Charges Near Zero',
      body: 'Between two drawings of the same molecule, prefer the one whose atoms carry formal charges closest to zero. A +1 and a −1 on neighbouring atoms cost the drawing stability.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Where the Minus Goes',
    prompt: 'Which drawing of thiocyanate places the negative formal charge on the more electronegative atom?',
    controls: ['charges'],
    rigs: [
      fixed('a', 'DRAWING A', 'SCN', DRAWINGS.SCN_s),
      fixed('b', 'DRAWING B', 'SCN', DRAWINGS.SCN_n)
    ],
    widget: { type: 'choice', label: 'The better drawing', options: [{ id: 'a', label: 'Drawing A' }, { id: 'b', label: 'Drawing B' }] },
    hints: [
      'Switch on the charges and read both drawings.',
      'Compare which atom carries the negative charge in each drawing, and how hard that atom pulls on electrons.',
      'Choose the drawing that puts the negative charge on the atom that pulls electrons harder.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a drawing.' };
      if (state.choice === 'b') return { ok: true };
      return { ok: false, msg: 'Both drawings carry one minus. Compare which atom each puts it on.' };
    },
    reward: {
      log: 'The minus goes where the pull is.',
      title: 'The Stronger Puller Takes the Minus',
      body: 'When two drawings have the same charges, the better one puts the negative charge on the atom that pulls electrons harder. Nitrogen pulls harder than sulfur, so it takes the minus here.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Same Length',
    briefing: {
      speaker: SPEAKER,
      body: 'You now have a bond length gauge. Use "Read Length" to measure the actual distance between atoms in the real molecule.'
    },
    prompt: 'How do the measured bond lengths of the two oxygen-oxygen bonds in ozone compare?',
    controls: ['hand', 'gauge', 'clear'],
    rigs: [slate('a', 'PLATE A', 'O3')],
    widget: {
      type: 'choice', label: 'The two bonds',
      options: [
        { id: 'same', label: 'They are the same length' },
        { id: 'long', label: 'One is longer than the other' }
      ]
    },
    hints: [
      'Draw ozone so every lamp is lit, then read each bond with the gauge.',
      'Compare the two lengths the gauge gives with what your drawing says about the two bonds.',
      'A double bond and a single bond would not normally measure alike, so check what the gauge says before you trust the drawing.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose how they compare.' };
      if (state.choice === 'same') return { ok: true };
      return { ok: false, msg: 'Read both bonds with the gauge and compare what it says with what the drawing says.' };
    },
    reward: {
      log: 'The measured bonds match.',
      title: 'Resonance',
      body: 'Ozone\'s drawing shows one double bond and one single, but both bonds measure the same, between single and double. The real molecule is a blend of drawings, and that blend is resonance.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Three Places',
    briefing: {
      speaker: SPEAKER,
      body: 'You can now save valid arrangements to a catalogue. Tap "File Drawing" whenever all lamps light up to record that candidate structure.'
    },
    prompt: 'File every equivalent resonance structure of the nitrate ion.',
    controls: ['hand', 'record', 'clear'],
    rigs: [slate('a', 'PLATE A', 'NO3')],
    widget: { type: 'none' },
    hints: [
      'Draw nitrate so every lamp is lit, then file the drawing.',
      'Compare each filed drawing with the next and see which oxygen atom carries the double bond in each.',
      'File one drawing for every oxygen atom that can hold the double bond.'
    ],
    check(state) {
      const mol = MOLECULES.NO3;
      const filed = state.recorded?.a || [];
      if (!filed.length) return { ok: false, notYet: true, msg: 'File a drawing to start the set.' };
      const good = distinctDrawings(mol, filed);
      if (good.length >= 3) return { ok: true };
      if (good.length < filed.length) return { ok: false, msg: 'A filed drawing does not light every lamp. Only drawings that do count.' };
      return { ok: false, msg: 'There is another place the double bond could go that you have not filed.' };
    },
    reward: {
      log: 'The same ion, three drawings.',
      title: 'Resonance Structures',
      body: 'Drawings that differ only in where the electrons sit are resonance structures. Nitrate has three, and the real ion is a blend of all of them.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Four Over Three',
    prompt: 'What is the effective bond order of each nitrogen-oxygen bond in the nitrate resonance hybrid?',
    controls: ['gauge'],
    rigs: [fixed('a', 'DRAWING A', 'NO3', DRAWINGS.NO3_a)],
    handGauge: true,
    widget: {
      type: 'choice', label: 'Each bond',
      options: [
        { id: '1', label: '1' },
        { id: '4/3', label: '1⅓' },
        { id: '3/2', label: '1½' },
        { id: '2', label: '2' }
      ]
    },
    hints: [
      'Read the gauge on all three bonds of the drawing.',
      'Compare the number of shared pairs in the whole ion with the number of bonds that hold them.',
      'Share the pairs equally among the bonds that hold them.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a bond order.' };
      if (state.choice === '4/3') return { ok: true };
      if (state.choice === '1' || state.choice === '2') return { ok: false, msg: 'The gauge reads the three bonds alike, so a whole number does not describe them.' };
      return { ok: false, msg: 'Count the shared pairs in the whole drawing and share them among the bonds.' };
    },
    reward: {
      log: 'Four pairs share three bonds.',
      title: 'Fractional Bond Order',
      body: 'Four shared pairs spread over three equal bonds give each a bond order of one and a third. A bond order that is not a whole number belongs to a molecule whose electrons are shared among several bonds.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Which Counts Most',
    prompt: 'Which of carbonate\'s three resonance drawings contributes most to its actual structure?',
    controls: [],
    rigs: [
      fixed('a', 'DRAWING A', 'CO3', DRAWINGS.CO3_a),
      fixed('b', 'DRAWING B', 'CO3', DRAWINGS.CO3_b),
      fixed('c', 'DRAWING C', 'CO3', DRAWINGS.CO3_c)
    ],
    widget: {
      type: 'choice', label: 'The drawing that counts most',
      options: [
        { id: 'a', label: 'Drawing A' }, { id: 'b', label: 'Drawing B' }, { id: 'c', label: 'Drawing C' },
        { id: 'all', label: 'None more than any other' }
      ]
    },
    hints: [
      'Compare the three drawings side by side.',
      'Look for anything that differs between them apart from which oxygen atom carries the double bond.',
      'Drawings that are the same except for where one thing sits count equally.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an answer.' };
      if (state.choice === 'all') return { ok: true };
      return { ok: false, msg: 'Compare the three drawings: is any one of them different from the others in anything but its position?' };
    },
    reward: {
      log: 'Equal drawings count equally.',
      title: 'Delocalized Electrons',
      body: 'When the drawings are equivalent they count equally, and the electrons of the double bond are spread over all three bonds. Electrons spread over more than two atoms in this way are delocalized.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Nothing to Move',
    prompt: 'Why does water have no resonance structures?',
    controls: [],
    rigs: [fixed('a', 'DRAWING A', 'H2O', DRAWINGS.H2O)],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        { id: 'nothing', label: 'It has no double bond whose electrons could be drawn elsewhere' },
        { id: 'few', label: 'It has too few atoms' },
        { id: 'lone', label: 'Its oxygen has no lone pairs' },
        { id: 'strong', label: 'Its bonds are too strong' }
      ]
    },
    hints: [
      'Look at every bond in the drawing of water.',
      'Compare what could be moved in water with what was moved in nitrate.',
      'Check whether moving any pair in the drawing would give a second structure that still lights every lamp.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'nothing') return { ok: true };
      if (state.choice === 'lone') return { ok: false, msg: 'Count the lone pairs on the oxygen in the drawing.' };
      return { ok: false, msg: 'Neither the number of atoms nor the strength of a bond decides whether a second drawing exists. Ask what could move.' };
    },
    reward: {
      log: 'A drawing with nothing to move.',
      title: 'When There Is Nothing to Move',
      body: 'Resonance needs a multiple bond whose electrons could be drawn in another place. Water\'s bonds are single, so it has only one drawing.'
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
      body: 'Formal charge tells you which drawing to prefer: the one with charges nearest zero, and a negative charge on the atom that pulls harder. Where several equal drawings exist, the real molecule is a blend of them, with bonds between whole numbers.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Ozone, nitrate and carbonate all measure differently from any one drawing of them. Resonance is how a model that draws only whole bonds can still describe them.'
    },
    {
      heading: 'Next',
      body: 'A drawing says what is bonded to what, but not the shape. The next bench pushes the arms apart and reads the angles.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the formal charge of an atom that brings 6 valence electrons and owns 5 in a drawing?',
    options: [
      { id: 'a', label: '+1' },
      { id: 'b', label: '−1' },
      { id: 'c', label: '0' },
      { id: 'd', label: '+2' }
    ],
    answer: 'a',
    explanation: 'Formal charge is the valence electrons brought minus the electrons owned (lone electrons plus half the bonding electrons): 6 − 5 = +1.'
  },
  {
    question: 'Two Lewis structures of the same molecule differ only in their formal charges. Which is usually the better?',
    options: [
      { id: 'a', label: 'The one whose formal charges are closest to zero' },
      { id: 'b', label: 'The one with the most charges' },
      { id: 'c', label: 'The one with a positive charge on the most electronegative atom' },
      { id: 'd', label: 'The one with the most lone pairs' }
    ],
    answer: 'a',
    explanation: 'Structures with formal charges near zero are more stable, and a negative charge belongs on the more electronegative atom.'
  },
  {
    question: 'The two O–O bonds in ozone are both 128 pm long. What explains this?',
    options: [
      { id: 'a', label: 'Resonance: the real molecule is a blend of two equivalent structures' },
      { id: 'b', label: 'Ozone has two double bonds' },
      { id: 'c', label: 'Ozone has two single bonds' },
      { id: 'd', label: 'Ozone is nonpolar' }
    ],
    answer: 'a',
    explanation: 'Either structure alone predicts one long and one short bond. The measured equal lengths show the electrons are shared across both, which resonance describes.'
  },
  {
    question: 'What is the bond order of each N–O bond in the nitrate ion, NO₃⁻?',
    options: [
      { id: 'a', label: '1⅓' },
      { id: 'b', label: '1' },
      { id: 'c', label: '2' },
      { id: 'd', label: '1½' }
    ],
    answer: 'a',
    explanation: 'Nitrate has four shared pairs spread over three equivalent bonds, so each has a bond order of 4/3.'
  },
  {
    question: 'How many resonance structures does the carbonate ion have?',
    options: [
      { id: 'a', label: 'Three' },
      { id: 'b', label: 'Two' },
      { id: 'c', label: 'One' },
      { id: 'd', label: 'Four' }
    ],
    answer: 'a',
    explanation: 'The double bond can sit on any of the three oxygens, giving three equivalent structures.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return boardState(stage.rigs);
}

const NO3_SET = [DRAWINGS.NO3_a, DRAWINGS.NO3_b, DRAWINGS.NO3_c];

export const SOLUTIONS = [
  { choice: 'o' },
  { choice: 'b' },
  { choice: 'b' },
  { choice: 'same' },
  { recorded: { a: NO3_SET } },
  { choice: '4/3' },
  { choice: 'all' },
  { choice: 'nothing' }
];

export const MISSES = [
  { choice: 'c' },
  { choice: 'a' },
  { choice: 'a' },
  { choice: 'long' },
  { recorded: { a: [DRAWINGS.NO3_a, DRAWINGS.NO3_b] } },
  { choice: '2' },
  { choice: 'a' },
  { choice: 'lone' }
];

export function stateFor(i, overrides) {
  const base = { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]) };
  return { ...base, ...overrides, boards: { ...base.boards, ...(overrides?.boards || {}) }, recorded: { ...base.recorded, ...(overrides?.recorded || {}) } };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let board = null;
  let runner = null;
  let chargesOn = false;

  function paintAll() {
    paintPairHand(runner.frame.el.controls, board.cfg.hand);
    paintCharges(runner.frame.el.controls, chargesOn);
  }

  /** Every crawler answers the plate it was made from: the lamps, or the charges if they are on. */
  function reactAll(quiet = false) {
    for (const rig of runner.stage.rigs) {
      const read = board.readOf(rig.id);
      if (!read) continue;
      const probe = chargesOn
        ? { kind: 'charges', zero: read.atoms.filter(a => a.fc === 0).length, of: read.atoms.length }
        : { kind: 'lamps', lit: read.atoms.filter(a => ['full', 'amber', 'expanded'].includes(a.lamp)).length, of: read.atoms.length };
      runner.frame.foeReact(rig.id, probe, quiet);
    }
  }

  function onProbe(hit) {
    if (hit.kind === 'hand') { paintAll(); return; }
    if (hit.kind === 'board') {
      runner.state.boards[hit.plateId] = hit.placed;
      const d = describeBoard(hit, board.itemFor(hit.plateId));
      runner.readout(d.head, d.body);
      reactAll();
      paintAll();
    } else if (hit.kind === 'gauge') {
      runner.readout('Gauge // reading', hit.length != null ? `That bond measures ${hit.length} pm in the real molecule.` : hit.none);
    }
  }

  function onTool(tool) {
    if (tool.startsWith('hand:')) {
      board.setHand(tool.split(':')[1]);
      paintAll();
    } else if (tool === 'charges') {
      chargesOn = !chargesOn;
      board.setCharges(chargesOn);
      paintAll();
      reactAll();
    } else if (tool === 'clear') {
      board.clear();
      for (const rig of runner.stage.rigs) runner.state.boards[rig.id] = board.placedOf(rig.id);
      runner.readout('Slate // cleared', 'The slate is back to how the stage handed it over.');
      reactAll(true);
    } else if (tool === 'record') {
      const id = runner.stage.rigs[0].id;
      const read = board.readOf(id);
      if (!allLit(read)) {
        runner.readout('Slate // not filed', read.left > 0 ? 'Electrons are still in the tray.' : 'A lamp is still dark.');
        return;
      }
      const res = board.record(id);
      runner.state.recorded[id] = board.recordedOf(id);
      runner.readout(res.action === 'filed' ? 'Slate // filed' : 'Slate // not filed', res.action === 'filed' ? `${res.count} ${res.count === 1 ? 'drawing' : 'drawings'} filed.` : res.reason);
    }
  }

  function onLoad(stage, i, r) {
    chargesOn = false;
    const hands = ['bond', 'lone'];
    if (stage.controls.includes('gauge') || stage.handGauge) hands.push('gauge');
    hands.push('x');
    board.setPlates(stage.rigs, { hands: stage.rigs.every(rg => rg.locked) ? (stage.handGauge ? ['gauge'] : []) : hands, charges: false });
    board.setSelectable(false);
    if (stage.handGauge) board.setHand('gauge');
    const parts = pairKeys({
      earned: true,
      charges: stage.controls.includes('charges'),
      gauge: stage.controls.includes('gauge'),
      record: stage.controls.includes('record'),
      clear: !stage.rigs.every(rg => rg.locked)
    });
    // A stage of fixed drawings has no hand to pick: the keys it offers are the tools alone.
    const keep = stage.rigs.every(rg => rg.locked) ? parts.filter(p => !p.includes('aria-label="Hand"')) : parts;
    if (stage.handGauge) keep.unshift(`
      <div class="cb-field" role="group" aria-label="Hand">
        <button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="hand:gauge" data-hand="gauge">Read Length</button>
      </div>`);
    r.setControls(keep, onTool);
    paintAll();
    r.readout(null, null, {
      idleHead: 'Slate // standby',
      idle: stage.rigs.every(rg => rg.locked) ? 'These drawings are fixed. Read them.' : 'Pick where the next pair goes, then tap the slate.'
    });
    reactAll(true);
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { board = PairBoard(r.frame.instrumentHost, { onProbe }); },
    onLoad,
    onDispose: () => board?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

export { planLewis, drawingKey, linkKey, gaugeLength, blankDrawing, drawing };
