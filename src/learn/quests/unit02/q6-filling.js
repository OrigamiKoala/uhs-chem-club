/**
 * q6-filling.js — Lanternfall, bench six: ELECTRON CONFIGURATION.
 *
 * The box rack in its `atomic` layout, with a magnet. Bench five gave every box
 * an address; this one fills the boxes the way an atom does, from carbon to
 * iron, and finds the two places the rule and the measurement part company.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  place carbon's six electrons                 -> aufbau principle
 *   2  how carbon's two p electrons sit             -> Hund's rule, paramagnetic and diamagnetic
 *   3  say what the rack reads for oxygen           -> electron configuration
 *   4  place potassium's nineteenth electron        -> the ladder is not in shell order
 *   5  iron in short form                           -> noble-gas notation
 *   6  six elements, by where the last electron went -> blocks of the periodic table
 *   7  remove two electrons from iron               -> transition metal ions
 *   8  place chromium so the rack matches the magnet -> the Cr and Cu exceptions (BEYOND THE EXAM)
 *
 * THE MAGNET MEASURES THE SAMPLE. `Test Sample` reads the real sample's pull
 * from `electrons.MEASURED`, and `Test Rack` reads the arrangement on the rack
 * by the same rule (single electrons pointing the same way add, opposite ones
 * cancel). Chromium is the stage where the two disagree on the first attempt and
 * only agree on the right one, which is why it is a discovery and not a recital.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { BoxRack } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { handKeys, paintHand, describeAct } from '../../engine/rackcontrols.js';
import { drawPeriodicStrip } from '../../engine/visual-devices.js';
import { pullWords } from '../../engine/magnetnotes.js';
import {
  rackFor, groundConfig, readRack, zOf, blockOf, boxKey, isLaddered, symbolOf
} from '../../engine/electrons.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\btransition metal ions?\b/i, introducedAt: 7 },
  { term: /\bblocks?\b/i, introducedAt: 6 },
  { term: /\bnoble.gas notation\b/i, introducedAt: 5 },
  { term: /\bconfigurations?\b/i, introducedAt: 3 },
  { term: /\bhund.?s? rule\b/i, introducedAt: 2 },
  { term: /\bparamagnetic\b/i, introducedAt: 2 },
  { term: /\bdiamagnetic\b/i, introducedAt: 2 },
  { term: /\baufbau\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q5-numbers', 'unit02/q4-cloud'];

const SPEAKER = 'Vess';

const TOOL_TEXT = {
  hand: { key: 'Up, Down, Remove', what: 'Pick what the next tap on a box does: place an up arrow, place a down arrow, or lift one out.' },
  magnet: { key: 'Test Rack', what: 'Holds the arrangement on the rack to the magnet as if it were a sample.' },
  core: { key: 'Collapse Core', what: 'Folds every closed row that matches a noble gas into its symbol.' }
};

export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const ROWS = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p'];
/** Rows with the 3d row below 4s, the way an ion's ladder is drawn. */
const ION_ROWS = ['1s', '2s', '2p', '3s', '3p', '3d', '4s'];

/** The Ar core, locked on the rack so a stage can start where an atom's chemistry starts. */
const AR_CORE = rackFor(18);

const plate = (extra = {}) => ({ id: 'rack', label: 'RACK', head: 'rack', layout: 'atomic', rows: ROWS, note: 'the orbital boxes, lowest energy at the bottom', ...extra });

const STRIPS = ['K', 'Cl', 'Zn', 'Eu', 'Al', 'Mn'].map(sym => ({ id: sym.toLowerCase(), label: `SAMPLE ${sym}`, head: 'strip', sym, note: `${sym}, ground state` }));

/** Fe with its two 4s electrons gone, in the form the rack stores. */
const FE_ION = rackFor(26, { counts: { ...groundConfig(26), '4s': 0 } });
/** The wrong way to remove two: from the 3d row, leaving the 4s pair behind. */
const FE_WRONG = rackFor(26, { counts: { ...groundConfig(26), '3d': 4 } });

const CR_RIGHT = (() => {
  const r = { ...AR_CORE };
  r['4s:0'] = 'u';
  for (let i = 0; i < 5; i++) r[boxKey('3d', i)] = 'u';
  return r;
})();
const CR_RULE = (() => {
  const r = { ...AR_CORE };
  r['4s:0'] = 'ud';
  for (let i = 0; i < 4; i++) r[boxKey('3d', i)] = 'u';
  return r;
})();

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Six for Carbon',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench files electrons into orbital boxes by energy, lowest first. Controls let you place arrows into open boxes to build ground-state atoms.'
    },
    prompt: 'Build a ground-state carbon atom by placing its six electrons on the rack.',
    table: true,
    controls: ['hand'],
    rigs: [plate({ label: 'SAMPLE C', sample: 'C', note: 'C, six electrons' })],
    widget: { type: 'none' },
    hints: [
      'Pick "Up" or "Down" from the hand keys and tap boxes, starting at the bottom of the ladder.',
      'Compare the rows by how high they sit on the ladder, and decide which of them still have room.',
      'Fill the lowest row until its boxes are full before you put anything in the row above it.'
    ],
    check(state) {
      const r = readRack(state.rack);
      if (r.total === 0) return { ok: false, notYet: true, msg: 'Place carbon\'s electrons on the rack.' };
      if (r.total !== 6) return { ok: false, msg: 'Count the electrons on the rack against how many carbon has.' };
      if (!isLaddered(r.counts)) {
        return { ok: false, msg: 'An electron is sitting in a row while a lower row still has room. Look further down the ladder.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Lowest rows first.',
      title: 'Aufbau Principle',
      body: 'Electrons fill the lowest energy rows first, from the bottom of the ladder up, and no row takes an electron while a lower one has room. That filling order is the aufbau principle, from the German for building up.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Two in the p Row',
    briefing: {
      speaker: SPEAKER,
      body: 'A magnetic probe is now available. Use "Test Sample" or "Test Rack" to measure the magnetic pull of unpaired electrons.'
    },
    prompt: 'How do carbon\'s two 2p electrons arrange themselves across the three 2p boxes?',
    controls: ['hand', 'magnet'],
    rigs: [plate({ label: 'SAMPLE C', sample: 'C', prefill: rackFor(4), locked: true, note: 'C, the p electrons are still to place' })],
    widget: {
      type: 'choice', label: 'How they sit',
      options: [
        { id: 'apart', label: 'In separate boxes, both pointing the same way' },
        { id: 'pair', label: 'Together in one box, pointing opposite ways' },
        { id: 'opp', label: 'In separate boxes, pointing opposite ways' },
        { id: 'same', label: 'Together in one box, both pointing the same way' }
      ]
    },
    hints: [
      'Press "Test Sample" to see how hard carbon is pulled, then place the two p electrons different ways and press "Test Rack" each time.',
      'Compare the pull of the rack with the pull of the sample, arrangement by arrangement.',
      'Find the arrangement of the two p electrons whose pull on the rack matches the sample\'s.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick how they sit.' };
      if (state.choice === 'same') {
        return { ok: false, msg: 'The rack refuses a second arrow pointing the same way in one box, so that arrangement cannot exist.' };
      }
      if (state.choice !== 'apart') {
        return { ok: false, msg: 'Test the sample and test each arrangement on the rack, and keep the one whose pull matches the sample\'s.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Carbon is pulled: two electrons stand alone, pointing alike.',
      title: 'Hund\'s Rule',
      body: 'Electrons spread out over the boxes of a row before any pair up, and the single ones all point the same way: that is Hund\'s rule. An atom with unpaired electrons is pulled into a magnet and is called paramagnetic, while one with none is pushed very slightly away and is called diamagnetic.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Eight for Oxygen',
    prompt: 'What is the ground-state electron configuration of oxygen?',
    table: true,
    controls: ['hand'],
    rigs: [plate({ label: 'SAMPLE O', sample: 'O', note: 'O, eight electrons' })],
    widget: {
      type: 'choice', label: 'What the rack reads',
      options: [
        { id: 'p4', label: '1s² 2s² 2p⁴' },
        { id: 'p6', label: '1s² 2s² 2p⁶' },
        { id: 'p5', label: '1s² 2s² 2p⁵' },
        { id: 's4', label: '1s² 2s⁴ 2p²' }
      ]
    },
    hints: [
      'Place oxygen\'s electrons on the rack the way you placed carbon\'s, and read what the rack prints along the top.',
      'Compare the figures the rack prints for each row with the options.',
      'Fill the lowest rows first, then match the number of electrons the rack reports in each row to an option.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what the rack reads.' };
      if (state.choice !== 'p4') {
        return { ok: false, msg: 'Place all of oxygen\'s electrons on the rack and compare what it prints, row by row, with this option.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The rack prints rows and their electrons.',
      title: 'Electron Configuration',
      body: 'The written arrangement the rack prints, each row followed by its number of electrons as a small raised figure, is the electron configuration. Oxygen\'s is 1s² 2s² 2p⁴, with four electrons in 2p filling one box twice and two boxes once.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Potassium\'s Last',
    prompt: 'Where does potassium\'s nineteenth electron settle on the energy ladder?',
    table: true,
    controls: ['hand'],
    rigs: [plate({ label: 'SAMPLE K', sample: 'K', prefill: AR_CORE, locked: true, note: 'K, eighteen electrons are already in place' })],
    widget: { type: 'none' },
    hints: [
      'Pick "Up" and tap a box for the one electron still to place.',
      'Compare the rows that have room by how high each sits on the ladder.',
      'Place the electron in the lowest row with room, even if it is not the next shell along.'
    ],
    check(state) {
      const r = readRack(state.rack);
      if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place the one electron still to come.' };
      if (r.total !== 19) return { ok: false, msg: 'Place exactly one more electron than the rack started with.' };
      if (!r.counts['4s'] || r.counts['4s'] !== 1) {
        return { ok: false, msg: 'A row lower on the ladder still has room. Compare the heights of the rows, not the order of their labels.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The 4s row sits below the 3d row.',
      title: 'Energy Order, Not Shell Order',
      body: 'The 4s row sits below the 3d row on the ladder, so potassium\'s last electron goes into 4s even though 3 comes before 4. Rows fill in order of their energy, and that is not always the order of their shells.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Iron in Short Form',
    briefing: {
      speaker: SPEAKER,
      body: 'You can now abbreviate filled inner shells. Use "Collapse Core" to compress completed inner rows into a shorthand symbol.'
    },
    prompt: 'What is the noble-gas shorthand configuration of iron?',
    table: true,
    controls: ['hand', 'core'],
    rigs: [plate({ label: 'SAMPLE FE', sample: 'Fe', prefill: AR_CORE, locked: true, note: 'Fe, eighteen electrons are already in place' })],
    widget: {
      type: 'choice', label: 'Iron in short form',
      options: [
        { id: 'ar', label: '[Ar] 4s² 3d⁶' },
        { id: 'd8', label: '[Ar] 4s² 3d⁸' },
        { id: 'ne', label: '[Ne] 4s² 3d⁶' },
        { id: 'kr', label: '[Kr] 4s² 3d⁶' }
      ]
    },
    hints: [
      'Place the eight electrons iron has beyond the closed core, then press "Collapse Core" and read the top of the rack.',
      'Compare the symbol in brackets with the rows it replaces: it stands for every closed row below the open ones.',
      'Fill the 4s row first and then the 3d boxes, and take the bracketed symbol the rack prints.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the short form.' };
      if (state.choice !== 'ar') {
        return { ok: false, msg: 'Place the rest of iron\'s electrons, press the core key, and compare what the rack prints with this option.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'A closed core folds into one symbol.',
      title: 'Noble-Gas Notation',
      body: 'The closed rows that match a noble gas fold into its symbol in brackets, so iron is written [Ar] 4s² 3d⁶. This noble-gas notation says only what lies beyond the closed core, which is where the chemistry happens.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Where the Last Electron Went',
    prompt: 'Sort these six element strips by which subshell holds their last electron.',
    controls: [],
    rigs: STRIPS,
    widget: {
      type: 'bins', label: 'Row of the last electron',
      rows: STRIPS.map(s => ({ id: s.id, label: s.sym })),
      bins: [
        { id: 's', label: 'An s row', note: '' },
        { id: 'p', label: 'A p row', note: '' },
        { id: 'd', label: 'A d row', note: '' },
        { id: 'f', label: 'An f row', note: '' }
      ]
    },
    hints: [
      'Find the lit bar on each plate; it marks the row the last electron went into.',
      'Read the letter on the lit row\'s label and sort the plate by it.',
      'Compare the letter of the highest row with electrons in it, in ladder order, for each element.'
    ],
    check(state) {
      const rows = STRIPS.map(s => s.id);
      if (rows.some(r => !state.bins[r])) return { ok: false, notYet: true, msg: 'Sort all six elements.' };
      for (const s of STRIPS) {
        if (state.bins[s.id] !== blockOf(zOf(s.sym))) {
          return { ok: false, msg: 'Look for the lit bar on that plate and read the letter of the row it belongs to.' };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Where the last electron lands is where the element sits.',
      title: 'Blocks of the Periodic Table',
      body: 'The row an element\'s last electron goes into puts it in the s, p, d or f block of the periodic table. The s block is the first two columns, the p block the last six, the d block the ten between them and the f block the fourteen that hang below.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Iron Loses Two',
    prompt: 'When an iron atom forms an Fe²⁺ ion, which two electrons are stripped away first?',
    controls: ['hand', 'magnet'],
    rigs: [plate({ label: 'SAMPLE FE', sample: 'Fe2+', z: 26, rows: ION_ROWS, fillGround: true, note: 'Fe, the ladder as an ion draws it' })],
    widget: { type: 'none' },
    hints: [
      'Pick "Remove" from the hand keys and tap the boxes you want to lift an electron from.',
      'Look at the ladder: this is how a charged atom draws it, and the electrons that leave first are the highest on it.',
      'Take both electrons from the highest row with electrons in it, then press "Test Rack" and compare with "Test Sample".'
    ],
    check(state) {
      const r = readRack(state.rack);
      if (r.total >= 26) return { ok: false, notYet: true, msg: 'Lift two electrons off the rack.' };
      if (r.total !== 24) return { ok: false, msg: 'Lift exactly two electrons from the rack, no more and no fewer.' };
      if ((r.counts['4s'] || 0) !== 0 || r.counts['3d'] !== 6) {
        return { ok: false, msg: 'The electrons that leave first are the ones in the highest row on this ladder. Check which row that is.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The 4s electrons go first.',
      title: 'Transition Metal Ions',
      body: 'A transition metal gives up its 4s electrons before its 3d ones, so iron(II) is [Ar] 3d⁶ and not [Ar] 4s² 3d⁴. Once an atom carries a charge the 3d row drops below 4s on the ladder, and the highest row is the one that empties first.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Chromium Disagrees',
    prompt: 'Place chromium\'s electrons so the rack\'s magnetic pull matches the sample.',
    table: true,
    controls: ['hand', 'magnet'],
    beyondExam: true,
    rigs: [plate({ label: 'SAMPLE CR', sample: 'Cr', prefill: AR_CORE, locked: true, note: 'Cr, eighteen electrons are already in place. Beyond the exam.' })],
    widget: { type: 'none' },
    hints: [
      'Press "Test Sample" to see how hard chromium is pulled, then fill the rack the way you have been and press "Test Rack".',
      'Compare the two pulls and ask which arrangement of the last six electrons would make the rack pull harder.',
      'Count how many electrons would have to stand alone in separate boxes, pointing the same way, to match the sample\'s pull.'
    ],
    check(state) {
      const r = readRack(state.rack);
      if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place the last six electrons on the rack.' };
      if (r.total !== 24) return { ok: false, msg: 'Place exactly as many electrons as chromium has.' };
      if (r.pull !== 6) {
        return { ok: false, msg: 'The rack pulls differently from the sample. Test both, and look for an arrangement that matches the sample\'s pull.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The sample is pulled harder than the rule predicts.',
      title: 'The Chromium and Copper Exceptions',
      body: 'Chromium moves one 4s electron into 3d, so every box in the 3d row holds one, and copper does the same to fill its 3d row. The ladder alone predicts a smaller pull, but the magnet measures the real one. This is beyond the exam.',
      last: true
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
      body: 'Electrons fill the lowest rows first, spread across a row before pairing, and the ladder is ordered by energy and not by shell. The blocks of the periodic table are simply the rows the last electron lands in.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Nearly everything an element does follows from the few electrons beyond its closed core. You can now write that core in one symbol and the rest in a line.'
    },
    {
      heading: 'Next',
      body: 'The core bench from Tallow can pull those electrons off one at a time. The next two benches measure what it costs, and read it back as a spectrum.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the ground-state electron configuration of oxygen?',
    options: [
      { id: 'a', label: '1s² 2s² 2p⁴' },
      { id: 'b', label: '1s² 2s² 2p⁶' },
      { id: 'c', label: '1s² 2s⁴ 2p²' },
      { id: 'd', label: '1s² 2s² 2p⁵' }
    ],
    answer: 'a',
    explanation: 'Oxygen has 8 electrons. They fill 1s (2), then 2s (2), leaving 4 for the 2p row.'
  },
  {
    question: 'How many unpaired electrons does a ground-state nitrogen atom have?',
    options: [
      { id: 'a', label: '0' },
      { id: 'b', label: '1' },
      { id: 'c', label: '2' },
      { id: 'd', label: '3' }
    ],
    answer: 'd',
    explanation: 'Nitrogen is 1s² 2s² 2p³. By Hund\'s rule the three 2p electrons occupy three separate boxes, all pointing the same way, so all three are unpaired.'
  },
  {
    question: 'Which is the correct noble-gas notation for the ground state of calcium (20 electrons)?',
    options: [
      { id: 'a', label: '[Ar] 4s²' },
      { id: 'b', label: '[Ar] 3d²' },
      { id: 'c', label: '[Ne] 4s²' },
      { id: 'd', label: '[Kr] 4s²' }
    ],
    answer: 'a',
    explanation: 'Argon has 18 electrons, and the next two go into 4s, which sits below 3d on the ladder. Calcium is [Ar] 4s².'
  },
  {
    question: 'When an iron atom becomes Fe²⁺, which electrons are lost first?',
    options: [
      { id: 'a', label: 'The two 4s electrons' },
      { id: 'b', label: 'Two 3d electrons' },
      { id: 'c', label: 'One 4s and one 3d electron' },
      { id: 'd', label: 'Two 3p electrons' }
    ],
    answer: 'a',
    explanation: 'Transition metals lose their outermost s electrons first. Fe²⁺ is [Ar] 3d⁶, not [Ar] 4s² 3d⁴.'
  },
  {
    question: '(Beyond the exam.) Chromium\'s ground state is [Ar] 4s¹ 3d⁵, not [Ar] 4s² 3d⁴. What does the magnet find?',
    options: [
      { id: 'a', label: 'Six unpaired electrons' },
      { id: 'b', label: 'Four unpaired electrons' },
      { id: 'c', label: 'No unpaired electrons' },
      { id: 'd', label: 'Two unpaired electrons' }
    ],
    answer: 'a',
    explanation: 'Chromium has one electron in 4s and one in each of the five 3d boxes: six unpaired electrons. The simple filling order would have predicted four.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  const first = stage.rigs[0];
  return { rack: { ...(first.prefill || {}), ...(first.fillGround ? rackFor(first.z ?? zOf(first.sample)) : {}) }, core: false };
}

export const SOLUTIONS = [
  { rack: rackFor(6) },
  { choice: 'apart' },
  { choice: 'p4' },
  { rack: { ...AR_CORE, '4s:0': 'u' } },
  { choice: 'ar' },
  { bins: { k: 's', cl: 'p', zn: 'd', eu: 'f', al: 'p', mn: 'd' } },
  { rack: FE_ION },
  { rack: CR_RIGHT }
];

export const MISSES = [
  { rack: (() => { const r = rackFor(2); r['2p:0'] = 'ud'; r['2p:1'] = 'ud'; return r; })() },
  { choice: 'opp' },
  { choice: 'p6' },
  { rack: { ...AR_CORE, '3d:0': 'u' } },
  { choice: 'ne' },
  { bins: { k: 's', cl: 'p', zn: 's', eu: 'd', al: 'p', mn: 'd' } },
  { rack: FE_WRONG },
  { rack: CR_RULE }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let rack = null;
  let runner = null;

  function paintAll() {
    paintHand(runner.frame.el.controls, rack.cfg.hand, runner.state.core);
  }

  /** Electrons on the rack, counted off the boxes. */
  function electronsOn(r) {
    return Object.values(r || {}).reduce((n, v) => n + (v === 'ud' ? 2 : v ? 1 : 0), 0);
  }

  /**
   * THE TABLE STRIP. Each electron added to the rack lights the element with that many, so
   * building an atom walks a lit cell across the table. It is not drawn for an ion, whose
   * electron count is not its element's.
   */
  function paintTable() {
    const stage = runner.stage;
    if (!stage.table) { runner.frame.setDevice(null); return; }
    const z = electronsOn(runner.state.rack);
    runner.frame.setDevice((ctx, w, h) => drawPeriodicStrip(ctx, 6, 6, w - 12, h - 12, z, symbolOf));
  }

  function onProbe(hit) {
    if (hit.kind === 'hand') { paintAll(); return; }
    if (hit.kind === 'rack') {
      runner.state.rack = hit.rack;
      const item = rack.itemFor(hit.plateId);
      const d = describeAct(hit, item);
      runner.readout(d.head, d.body);
      paintAll();
      paintTable();
    }
  }

  function onTool(tool) {
    const stage = runner.stage;
    if (tool.startsWith('hand:')) {
      rack.setHand(tool.split(':')[1]);
      paintAll();
    } else if (tool === 'clear') {
      rack.clear();
      runner.state.rack = rack.rackOf('rack');
      runner.readout('Rack // cleared', 'The rack is back to how the stage handed it over.');
      paintTable();
    } else if (tool === 'core') {
      runner.state.core = !runner.state.core;
      rack.setCore(runner.state.core);
      paintAll();
    } else if (tool === 'magnet-sample') {
      const m = rack.measured('rack');
      if (m == null) return;
      rack.pull?.('rack', m);
      runner.readout('Magnet // sample', `${stage.rigs[0].label}: ${pullWords(m)}`);
    } else if (tool === 'magnet-rack') {
      const reading = readRack(runner.state.rack);
      rack.pull?.('rack', reading.pull);
      runner.readout('Magnet // rack', `The arrangement on the rack: ${pullWords(reading.pull)}`);
    }
  }

  function onLoad(stage, i, r) {
    rack.setPlates(stage.rigs, { show: { n: true, l: true, ml: true, ms: true }, hand: null, core: false });
    rack.setSelectable(false);
    if (stage.rigs[0].head === 'rack') r.state.rack = rack.rackOf('rack');

    const parts = [];
    if (stage.controls.includes('hand')) parts.push(handKeys({ clear: true, core: stage.controls.includes('core') }));
    if (stage.controls.includes('magnet')) {
      parts.push(`
        <div class="cb-field" role="group" aria-label="Magnet">
          <span class="form-label">Magnet</span>
          <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="magnet-sample">Test Sample</button>
          <button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="magnet-rack">Test Rack</button>
        </div>
      `);
    }
    r.setControls(parts, onTool);
    paintHand(r.frame.el.controls, null, false);
    paintTable();
    r.readout(null, null, {
      idleHead: 'Rack // standby',
      idle: stage.controls.includes('hand') ? 'Pick a hand, then tap a box.' : 'Read each ladder.'
    });
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { rack = BoxRack(r.frame.instrumentHost, { onProbe }); },
    onLoad,
    onDispose: () => rack?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
