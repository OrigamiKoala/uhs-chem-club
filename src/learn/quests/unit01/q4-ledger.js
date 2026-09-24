/**
 * q4-ledger.js — Tallow, site four.
 *
 * Eight stages on the core bench. The player describes an atom with three
 * numbers — protons, neutrons and charge — and meets mass number, isotope
 * notation, cations and anions as the reward card after each stage.
 *
 *   1  count protons, neutrons and electrons   -> Mass Number
 *   2  work a sealed sample from its label     -> Isotope Notation
 *   3  say which samples behave alike          -> Isotopes react alike
 *   4  read a needle that is not on zero       -> Net charge
 *   5  strip electrons to reach plus two       -> Cations
 *   6  load an outer shell past neutral        -> Anions
 *   7  cancel two charges to zero              -> Charges cancel in whole numbers
 *   8  file four sealed samples                -> Three numbers describe any atom
 *
 * Counting is the task on stages 1, 2, 4 and 8, so the answer is a number the
 * player enters; the probe is there if they want a reading and is never a gate
 * on a commit. Every specimen is a real nuclide and balances unless a stage has
 * taken something off it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { CoreBench } from '../../engine/instruments.js';
import { LearnFrame, toolNotes } from '../../engine/frame.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned. Everything the first three benches taught
 * is a plain word here. Nothing in this table is player-facing.
 */
export const VOCABULARY = [
  { term: /\bmass number\b/i, introducedAt: 1 },
  { term: /\bcations?\b/i, introducedAt: 5 },
  { term: /\banions?\b/i, introducedAt: 6 }
];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE KEY LEGEND
   Every control a stage puts on the plate carries one plain sentence saying
   what it does, for as long as the control is there. `verify:learn` fails the
   build over a control with no line. Every word used here was earned on an
   earlier bench, so nothing has to change its wording partway through.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  field: [{
    from: 1,
    key: 'Whole piece / The middle / Outside',
    what: 'Three views of the same atom: all of it, the nucleus close up, or the electrons on their shells.'
  }],
  meter: [{
    from: 1,
    key: 'Read Needle',
    what: 'Clips the charge meter to the atom: protons push the needle up, electrons pull it down.'
  }],
  strip: [{
    from: 1,
    key: 'Fire Stripper',
    what: 'Knocks one electron off the outermost shell. The nucleus is not touched.'
  }]
  // Reset Sample is not listed. It resets the sample.
};

/**
 * The legend line for one control on one stage, or null if there is none.
 * `stageNumber` is one-based, the way a player counts stages.
 */
export function toolNoteFor(controlId, stageNumber) {
  const rows = TOOL_TEXT[controlId];
  if (!rows) return null;
  let out = null;
  for (const r of rows) if (stageNumber >= r.from) out = r;
  return out ? { key: out.key, what: out.what } : null;
}

/* ------------------------------------------------------------------
   THE PARTS
   The same three sorts of thing the core bench put a needle on at site
   two, with the same readings. Nothing has been renamed.
   ------------------------------------------------------------------ */
export const PARTS = {
  marked: {
    code: 'PROTON', mass: 1.0, charge: 1,
    note: 'A proton. Heavy, and it pushes the needle up every time.'
  },
  blank: {
    code: 'NEUTRON', mass: 1.0, charge: 0,
    note: 'A neutron. The same weight as a proton, but the needle does not move for it at all.'
  },
  light: {
    code: 'ELECTRON', mass: 0.0005, charge: -1,
    note: 'An electron. Almost weightless, and it pushes the needle the opposite way to a proton.'
  },
  core: {
    code: 'NUCLEUS', mass: null, charge: null,
    note: 'The whole nucleus at once, packed too tight to separate from here.'
  },
  whole: {
    code: 'WHOLE ATOM', mass: null, charge: null,
    note: 'The whole atom, edge to edge. Almost all of that width is empty.'
  }
};

/** How many electrons a specimen is carrying, over all its shells. */
export function electronCount(spec) {
  return (spec.rings || []).reduce((n, r) => n + r, 0);
}

/** What the needle reads: protons against electrons. */
export function netCharge(spec) {
  return (spec.core.marked || 0) - electronCount(spec);
}

/** Protons plus neutrons — the figure stamped on a sample label. */
export function massNumber(spec) {
  return (spec.core.marked || 0) + (spec.core.blank || 0);
}

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   Exported so `verify:learn` can run SOLUTIONS and MISSES through every
   `check` without a browser.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Three Numbers Off One Atom',
    field: 'core',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench inspects one atom at a time.'
    },
    prompt: 'Count the protons, the neutrons and the electrons on Sample A.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'a', label: 'SAMPLE A', note: 'one atom, mounted', core: { marked: 6, blank: 6 }, rings: [2, 4] }
    ],
    widget: {
      type: 'triple',
      label: 'Sample A',
      min: 0, max: 20,
      fields: ['Protons', 'Neutrons', 'Electrons']
    },
    hints: [
      'Press "The middle" to count the grains, then "Outside" to count the electrons.',
      'Twelve grains are packed into the nucleus, and half of them carry a cross.',
      'Count the crossed grains in the nucleus for protons, the blank grains for neutrons, and the rings for electrons.'
    ],
    check(state) {
      const [p, n, e] = state.numbers;
      if (p === 0 && n === 0 && e === 0) {
        return { ok: false, notYet: true, msg: 'The answer is still blank. Count the three numbers and set them.' };
      }
      if (p === 12) {
        return { ok: false, msg: '12 is every grain in the nucleus. Only the crossed ones are protons.' };
      }
      if (p !== 6) {
        return { ok: false, msg: 'Count the crosses again in "The middle". Each cross marks a proton.' };
      }
      if (n !== 6) {
        return { ok: false, msg: 'The neutrons are the blank grains in the nucleus without crosses.' };
      }
      if (e !== 6) {
        return { ok: false, msg: 'Count the electrons in "Outside". The needle reads zero, so electrons balance protons.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A: 6 protons, 6 neutrons, 6 electrons.',
      title: 'Mass Number',
      body: 'Electrons weigh almost nothing, so everything an atom weighs is in its nucleus. Add the protons to the neutrons and you get 12, which is called the mass number. This atom is written carbon-12.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Read The Label',
    field: 'core',
    prompt: 'Work out how many neutrons and electrons the sealed Sample B has.',
    controls: ['field', 'meter'],
    specimens: [
      {
        id: 'r1', label: 'SAMPLE A',
        note: 'Label: CAT 06, mass number 12, needle 0. Open.',
        core: { marked: 6, blank: 6 }, rings: [2, 4]
      },
      {
        id: 'b', label: 'SAMPLE B',
        note: 'Label: CAT 17, mass number 37, needle 0. Sealed.',
        core: { marked: 17, blank: 20 }, rings: [2, 8, 7], casing: true
      }
    ],
    widget: {
      type: 'pair',
      label: 'Sample B',
      min: 0, max: 40,
      fields: ['Neutrons', 'Electrons']
    },
    hints: [
      'Count Sample A in both views, then compare your counts with the two numbers on its label.',
      'On Sample A the CAT code is the proton count, and the mass number is protons plus neutrons.',
      'Subtract the CAT code from the mass number to find the neutrons, and match electrons to protons for a zero needle.'
    ],
    check(state) {
      const [n, e] = state.numbers;
      if (n === 0 && e === 0) {
        return { ok: false, notYet: true, msg: 'The answer is still blank. Work the two numbers out from the label.' };
      }
      if (n === 37) {
        return { ok: false, msg: 'That number counts the protons too. Take the 17 protons off it.' };
      }
      if (n !== 20) {
        return { ok: false, msg: 'On Sample A, 12 was its 6 protons plus its 6 neutrons. Sample B stamps 17 and 37.' };
      }
      if (e !== 17) {
        return { ok: false, msg: 'A needle on zero means the electrons match the protons one for one.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B: 17 protons, 20 neutrons, 17 electrons.',
      title: 'Isotope Notation',
      body: 'Two numbers describe any atom: the atomic number, which says which element it is, and the mass number, which says how heavy this one is. Chemists write that as chlorine-37, or as the mass number above the atomic number beside the symbol. Every other count falls out of the pair.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Which Ones Behave Alike',
    field: 'rings',
    prompt: 'Say which of the three samples will react the same way as Sample A.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'ref', label: 'SAMPLE A', note: 'the one to match', core: { marked: 17, blank: 18 }, rings: [2, 8, 7] },
      { id: 'k', label: 'SAMPLE B', note: 'unlabelled', core: { marked: 17, blank: 20 }, rings: [2, 8, 7] },
      { id: 'l', label: 'SAMPLE C', note: 'unlabelled', core: { marked: 18, blank: 18 }, rings: [2, 8, 8] },
      { id: 'm', label: 'SAMPLE D', note: 'unlabelled', core: { marked: 16, blank: 19 }, rings: [2, 8, 6] }
    ],
    widget: {
      type: 'bins',
      rows: ['k', 'l', 'm'],
      bins: [
        { id: 'same', label: 'Reacts the same way', note: 'Behaves like Sample A.' },
        { id: 'other', label: 'Reacts differently', note: 'Behaves unlike Sample A.' }
      ]
    },
    hints: [
      'Press "Outside" and count the electrons on the outermost shell of all four.',
      'Only one of the three has the same outer shell as Sample A: 2, 8 and 7.',
      'Look for the sample whose outermost shell has the exact same electron count as Sample A.'
    ],
    check(state) {
      const want = { k: 'same', l: 'other', m: 'other' };
      const labels = { k: 'Sample B', l: 'Sample C', m: 'Sample D' };
      for (const id of ['k', 'l', 'm']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      if (state.bins.k !== want.k) {
        return { ok: false, msg: 'Sample B has the same outer shell as Sample A, so it reacts the same way. Its extra neutrons only make it heavier.' };
      }
      if (state.bins.l !== want.l) {
        return { ok: false, msg: 'Sample C carries 8 on its outer shell where Sample A carries 7, so it behaves differently.' };
      }
      if (state.bins.m !== want.m) {
        return { ok: false, msg: 'Sample D carries 6 on its outer shell where Sample A carries 7, so it behaves differently.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B matches. Samples C and D do not.',
      title: 'Isotopes React Alike',
      body: 'Isotopes of an element differ only in neutrons, and neutrons take no part in chemistry. The same proton count means the same electrons, the same outer shell and the same behaviour. That is why chlorine-35 and chlorine-37 are interchangeable in a reaction.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Needle Is Not On Zero',
    field: 'rings',
    prompt: 'Work out how many protons and electrons the sealed Sample B has.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'r2', label: 'SAMPLE A', note: 'Label: CAT 03, mass number 7. Open.', core: { marked: 3, blank: 4 }, rings: [2] },
      {
        id: 'c', label: 'SAMPLE B',
        note: 'Label: CAT 11, mass number 23, needle not stamped. Sealed.',
        core: { marked: 11, blank: 12 }, rings: [2, 8], casing: true
      }
    ],
    widget: {
      type: 'pair',
      label: 'Sample B',
      min: 0, max: 30,
      fields: ['Protons', 'Electrons']
    },
    hints: [
      'Press "Read Needle" on Sample A, then count its protons and its electrons.',
      'Sample A has 3 protons, 2 electrons and a needle on plus one.',
      'Use the CAT code for the proton count, and adjust the electron count so positive protons exceed electrons by one.'
    ],
    check(state) {
      const [p, e] = state.numbers;
      if (p === 0 && e === 0) {
        return { ok: false, notYet: true, msg: 'The answer is still blank. Set the two counts.' };
      }
      if (p !== 11) {
        return { ok: false, msg: 'On Sample A the CAT code and the proton count came out the same. Sample B stamps CAT 11.' };
      }
      if (e === 11) {
        return { ok: false, msg: '11 electrons would cancel 11 protons and put the needle on zero. Sample B reads plus one.' };
      }
      if (e === 12) {
        return { ok: false, msg: 'An extra electron would push the needle to minus one. Both samples read plus.' };
      }
      if (e !== 10) {
        return { ok: false, msg: 'Plus one means the protons outnumber the electrons by exactly one.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B: 11 protons, 10 electrons, needle plus one.',
      title: 'Net Charge',
      body: 'The needle does one subtraction: protons count up, electrons count down, and what is left over is the net charge. Nothing in Sample B\'s nucleus has changed, so it is still CAT 11 and still mass number 23. It is simply one electron short.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Drive It Positive',
    field: 'rings',
    prompt: 'Drive Sample A to a charge of plus two, and log how many electrons that took.',
    controls: ['field', 'meter', 'strip', 'reset'],
    specimens: [
      { id: 'd', label: 'SAMPLE A', note: 'mounted, open to the instrument', core: { marked: 12, blank: 12 }, rings: [2, 8, 2] }
    ],
    widget: { type: 'number', min: 0, max: 6, label: 'Electrons taken off' },
    hints: [
      'Press "Fire Stripper" to knock one electron off, then "Read Needle" to see what it did.',
      'Every electron you take off leaves one more proton with nothing to cancel it.',
      'Knock off electrons until the charge reads plus two, then set the counter to match how many were removed.'
    ],
    check(state) {
      const taken = state.stripped.d || 0;
      if (taken !== 2) {
        // Driving the sample IS the answer here, so a sample still sitting on
        // zero is a wrong answer with a reason, not a gate on having pressed a
        // key. Nothing on this bench refuses a player who already knows.
        if (taken === 0) {
          return { ok: false, msg: 'Sample A is still neutral. Take electrons off it until the charge reads plus two.' };
        }
        return { ok: false, msg: `The needle reads plus ${taken}. Bring it to plus two — "Reset Sample" puts every electron back.` };
      }
      if (state.number !== 2) {
        return { ok: false, msg: `You took 2 electrons off but logged ${state.number}. Set the counter to match the electrons removed.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A brought to plus two.',
      title: 'Cations',
      body: 'An atom carrying a positive charge is called a cation. It is made by moving electrons, never by touching the nucleus. Metals form them easily because their outer shell holds only one or two electrons to start with.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Fill It Past Neutral',
    field: 'rings',
    prompt: 'Load Sample A with enough electrons to fill its outer shell completely.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'e', label: 'SAMPLE A', note: 'mounted, all its electrons removed', core: { marked: 17, blank: 18 }, rings: [] }
    ],
    target: 'e',
    widget: {
      type: 'rings',
      label: 'Sample A — where the electrons go',
      total: 18,
      rings: ['Shell 1 — closest in', 'Shell 2 — middle', 'Shell 3 — furthest out']
    },
    hints: [
      'Use the + keys on the shell rows to put electrons on Sample A.',
      'A shell holds 2 closest in and 8 after that, and nothing sits further out while a nearer shell has room.',
      'Fill each inner shell to its capacity before placing electrons on the outer shell until it is completely full.'
    ],
    check(state) {
      const placed = state.rings.reduce((n, r) => n + r, 0);
      if (placed === 0) {
        return { ok: false, notYet: true, msg: 'Nothing loaded yet. Use the + keys to put electrons on the shells.' };
      }
      if (state.rings[0] > 2) {
        return { ok: false, msg: 'Too many on Shell 1. The closest shell holds 2 and never more.' };
      }
      if (state.rings[1] > 8 || state.rings[2] > 8) {
        return { ok: false, msg: 'Too many on a shell. After the first, a shell holds 8.' };
      }
      if (state.rings[0] < 2 || (state.rings[2] > 0 && state.rings[1] < 8)) {
        return { ok: false, msg: 'Fill each shell before starting the next one: 2, then 8.' };
      }
      if (placed === 17) {
        return { ok: false, msg: '17 electrons cancels the 17 protons, but it leaves the outer shell one short of full.' };
      }
      if (placed !== 18) {
        return { ok: false, msg: `${placed} electrons are on. A full outer shell here is 8, on top of 2 and 8 further in.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A loaded 2 / 8 / 8. Needle on minus one.',
      title: 'Anions',
      body: 'An atom carrying a negative charge is called an anion. This one holds 18 electrons against 17 protons, because filling the outer shell matters more than balancing the needle. Nonmetals sit one or two electrons short of full, so they take rather than give, and what you built is a chloride ion.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Cancel The Charges',
    field: 'rings',
    prompt: 'Work out the fewest atoms of each sample that add up to zero charge.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 's', label: 'SAMPLE A', note: 'open to the instrument', core: { marked: 12, blank: 12 }, rings: [2, 8] },
      { id: 't', label: 'SAMPLE B', note: 'open to the instrument', core: { marked: 17, blank: 18 }, rings: [2, 8, 8] }
    ],
    widget: {
      type: 'pair',
      label: 'How many of each',
      min: 0, max: 8,
      fields: ['Atoms of Sample A', 'Atoms of Sample B']
    },
    hints: [
      'Press "Read Needle" on both samples before you count anything.',
      'Sample A reads plus two and Sample B reads minus one.',
      'Multiply each sample count by its charge so the total positive and negative charges sum to zero.'
    ],
    check(state) {
      const [s, t] = state.numbers;
      if (s === 0 && t === 0) {
        return { ok: false, notYet: true, msg: 'Nothing is set yet. Choose how many of each.' };
      }
      if (s === 0 || t === 0) {
        return { ok: false, msg: 'One sample on its own cannot come to zero, because nothing cancels its charge.' };
      }
      const net = s * 2 - t;
      if (net !== 0) {
        return { ok: false, msg: `That comes to ${net > 0 ? 'plus' : 'minus'} ${Math.abs(net)}. Sample A is plus two each and Sample B is minus one each.` };
      }
      if (s !== 1) {
        return { ok: false, msg: 'That balances, but it is not the smallest set that does. Halve both numbers.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One Sample A to two Sample B. Charge zero.',
      title: 'Charges Cancel In Whole Numbers',
      body: 'A neutral combination has to come out to zero charge, and you cannot use half an atom. So one atom at plus two needs two atoms at minus one. That ratio is why magnesium and chlorine combine one to two and never any other way.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'File Them All',
    field: 'core',
    prompt: 'Say how each of the four sealed samples differs from Sample A.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'std', label: 'SAMPLE A', note: 'Label: CAT 08, mass number 16, needle 0. Open.', core: { marked: 8, blank: 8 }, rings: [2, 6] },
      { id: 'n1', label: 'SAMPLE B', note: 'Label: CAT 08, mass number 18, needle 0. Sealed.', core: { marked: 8, blank: 10 }, rings: [2, 6], casing: true },
      { id: 'n2', label: 'SAMPLE C', note: 'Label: CAT 08, mass number 16, needle minus 2. Sealed.', core: { marked: 8, blank: 8 }, rings: [2, 8], casing: true },
      { id: 'n3', label: 'SAMPLE D', note: 'Label: CAT 07, mass number 16, needle 0. Sealed.', core: { marked: 7, blank: 9 }, rings: [2, 5], casing: true },
      { id: 'n4', label: 'SAMPLE E', note: 'Label: CAT 08, mass number 16, needle 0. Sealed.', core: { marked: 8, blank: 8 }, rings: [2, 6], casing: true }
    ],
    widget: {
      type: 'bins',
      rows: ['n1', 'n2', 'n3', 'n4'],
      bins: [
        { id: 'match', label: 'No difference', note: 'All three numbers agree.' },
        { id: 'heavy', label: 'Extra neutrons', note: 'Same element, heavier.' },
        { id: 'charged', label: 'Carrying a charge', note: 'The electron count is off.' },
        { id: 'other', label: 'Different element', note: 'The CAT code does not match.' }
      ]
    },
    hints: [
      'Count Sample A in both views and check it against its own label.',
      'The CAT code is the first test: only a sample stamped CAT 08 can match at all.',
      'Compare the CAT code, mass number, and needle of each sample against Sample A to identify the difference.'
    ],
    check(state) {
      const want = { n1: 'heavy', n2: 'charged', n3: 'other', n4: 'match' };
      const labels = { n1: 'Sample B', n2: 'Sample C', n3: 'Sample D', n4: 'Sample E' };
      for (const id of ['n1', 'n2', 'n3', 'n4']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      if (state.bins.n1 !== want.n1) {
        return { ok: false, msg: 'Sample B is CAT 08 with a needle on zero, so only its mass number differs. It is two neutrons heavier.' };
      }
      if (state.bins.n2 !== want.n2) {
        return { ok: false, msg: 'Sample C has the same code and mass number as Sample A, so the minus 2 can only be electrons.' };
      }
      if (state.bins.n3 !== want.n3) {
        return { ok: false, msg: 'Sample D is stamped CAT 07, so it is a different element whatever else it says.' };
      }
      if (state.bins.n4 !== want.n4) {
        return { ok: false, msg: 'Sample E agrees with Sample A on all three numbers: CAT 08, mass number 16, needle on zero.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'All four filed.',
      title: 'Three Numbers Describe Any Atom',
      body: 'Atomic number says what the atom is, mass number says how heavy this one is, and net charge says what it is carrying. Each of the three can change without touching the other two. Get all three and you have described the atom completely.',
      last: true
    }
  }

];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'Any atom is described by three numbers: how many protons, how many neutrons, and what charge it carries. Protons plus neutrons is the mass number.'
    },
    {
      heading: 'What Each Number Does',
      body: 'Change the protons and it is a different element. Change the neutrons and it is an isotope, which behaves exactly the same. Change the electrons and it is an ion: a cation if you took some off, an anion if you put some on.'
    },
    {
      heading: 'Next',
      body: 'Look at the catalogue cards again. Almost none of the masses are whole numbers, but a mass number always is, and the next bench shows you why.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'An atom has 15 protons, 16 neutrons and 15 electrons. What is its mass number?',
    options: [
      { id: 'a', label: '15' },
      { id: 'b', label: '16' },
      { id: 'c', label: '31' },
      { id: 'd', label: '46' }
    ],
    answer: 'c',
    explanation: 'Mass number is protons plus neutrons: 15 + 16 = 31. Electrons weigh too little to count.'
  },
  {
    question: 'Chlorine-37 has an atomic number of 17. How many neutrons does it have?',
    options: [
      { id: 'a', label: '17' },
      { id: 'b', label: '20' },
      { id: 'c', label: '37' },
      { id: 'd', label: '54' }
    ],
    answer: 'b',
    explanation: 'The number after the name is the mass number. Take the atomic number off it: 37 - 17 = 20 neutrons.'
  },
  {
    question: 'Chlorine-35 and chlorine-37 go into the same reaction. What happens?',
    options: [
      { id: 'a', label: 'They react in exactly the same way' },
      { id: 'b', label: 'Chlorine-37 reacts faster because it is heavier' },
      { id: 'c', label: 'Only chlorine-35 reacts at all' },
      { id: 'd', label: 'They react as two different elements' }
    ],
    answer: 'a',
    explanation: 'Isotopes differ only in neutrons, and reactions are done by electrons. Same protons means same electrons, so they behave the same.'
  },
  {
    question: 'A magnesium atom with 12 protons loses 2 electrons. What has it become?',
    options: [
      { id: 'a', label: 'A different element with 10 protons' },
      { id: 'b', label: 'An anion with a charge of -2' },
      { id: 'c', label: 'A cation with a charge of +2' },
      { id: 'd', label: 'An isotope of magnesium' }
    ],
    answer: 'c',
    explanation: 'Losing electrons leaves protons uncancelled, so the charge goes positive. The nucleus was never touched, so it is still magnesium.'
  },
  {
    question: 'An ion has a charge of +3 and 10 electrons. How many protons does it have?',
    options: [
      { id: 'a', label: '7' },
      { id: 'b', label: '10' },
      { id: 'c', label: '13' },
      { id: 'd', label: '30' }
    ],
    answer: 'c',
    explanation: 'Charge is protons minus electrons, so protons = 3 + 10 = 13. That is aluminium.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function widgetSlots(stage) {
  if (stage.widget.type === 'triple') return 3;
  if (stage.widget.type === 'pair') return 2;
  return 0;
}

function blankState(stage) {
  return {
    field: stage.field || 'whole',
    numbers: Array.from({ length: widgetSlots(stage) }, () => 0),
    number: stage.widget.type === 'number' ? stage.widget.min : null,
    choice: null,
    rings: stage.widget.type === 'rings' ? stage.widget.rings.map(() => 0) : [],
    bins: {},
    sample: null,
    probed: new Set(),
    metered: new Set(),
    stripped: {}
  };
}

/** The bench state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { numbers: [6, 6, 6] },
  { numbers: [20, 17] },
  { bins: { k: 'same', l: 'other', m: 'other' } },
  { numbers: [11, 10], metered: new Set(['c', 'r2']) },
  { number: 2, stripped: { d: 2 } },
  { rings: [2, 8, 8] },
  { numbers: [1, 2], metered: new Set(['s', 't']) },
  { bins: { n1: 'heavy', n2: 'charged', n3: 'other', n4: 'match' } }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { numbers: [12, 6, 6] },
  { numbers: [37, 17] },
  { bins: { k: 'other', l: 'other', m: 'other' } },
  { numbers: [11, 11], metered: new Set(['c', 'r2']) },
  { number: 1, stripped: { d: 1 } },
  { rings: [2, 8, 7] },
  { numbers: [2, 4], metered: new Set(['s', 't']) },
  { bins: { n1: 'heavy', n2: 'match', n3: 'other', n4: 'match' } }
];

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return { ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

const FIELD_LABELS = { whole: 'Whole piece', core: 'The middle', rings: 'Outside' };

export function mount(container, ctx) {
  const frame = new LearnFrame(container, {
    stageCount: STAGES.length,
    onSubmit: () => submit(),
    onNext: () => next(),
    onJump: i => loadStage(i),
    onExit: () => ctx.exit()
  });

  const bench = new CoreBench(frame.instrumentHost, {
    onProbe: hit => onProbe(hit),
    onSelect: id => onSelect(id)
  });

  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = null;
  let busy = false;
  let disposed = false;

  /* ---------------- stage lifecycle ---------------- */

  function loadStage(i) {
    index = i;
    const stage = STAGES[i];
    state = blankState(stage);

    frame.setCleared(cleared);
    frame.setStage({
      index: i,
      title: stage.title,
      prompt: stage.prompt,
      briefing: stage.briefing,
      hints: stage.hints,
      commitLabel: 'Commit'
    });

    bench.setSpecimens(stage.specimens);
    bench.setField(state.field);
    const needsTarget = stage.controls.some(c => c === 'meter' || c === 'strip');
    bench.setSelectable(needsTarget && stage.specimens.length > 1);
    if (needsTarget && stage.specimens.length === 1) onSelect(stage.specimens[0].id);
    else if (stage.target) onSelect(stage.target);

    renderControls();
    renderWidget();
    renderReadout(null);

    if (stage.briefing && !ctx.isComplete && cleared <= i) frame.showBriefing();
  }

  function next() {
    if (index >= STAGES.length - 1) {
      frame.showDebrief(DEBRIEF, () => ctx.exit());
      return;
    }
    loadStage(index + 1);
  }

  function submit() {
    if (busy) return;
    const stage = STAGES[index];
    const result = stage.check(state);
    if (!result.ok) {
      if (result.notYet) frame.note(result.msg);
      else frame.miss(result.msg);
      return;
    }
    frame.clearBanner();
    if (index + 1 > cleared) {
      cleared = index + 1;
      ctx.reportStage(index);
    }
    frame.setCleared(cleared);
    frame.clear(stage.reward);
    if (index === STAGES.length - 1) ctx.reportComplete();
  }

  /* ---------------- bench controls ---------------- */

  function renderControls() {
    const stage = STAGES[index];
    const parts = [];

    if (stage.controls.includes('field')) {
      parts.push(`
        <div class="cb-field" role="group" aria-label="View">
          <span class="form-label">View</span>
          ${Object.entries(FIELD_LABELS).map(([id, label]) => `
            <button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-field="${id}">${label}</button>
          `).join('')}
        </div>
      `);
    }
    if (stage.controls.includes('meter')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="meter">Read Needle</button>');
    }
    if (stage.controls.includes('strip')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="strip">Fire Stripper</button>');
    }
    if (stage.controls.includes('reset')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="reset">Reset Sample</button>');
    }
    parts.push(toolNotes(
      stage.controls.map(id => toolNoteFor(id, index + 1)).filter(Boolean)
    ));

    frame.setControls(parts.join(''));
    const host = frame.el.controls;
    host.querySelectorAll('[data-field]').forEach(btn => {
      btn.addEventListener('click', () => setField(btn.dataset.field));
    });
    host.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => runTool(btn.dataset.tool));
    });
    paintControls();
  }

  function paintControls() {
    frame.el.controls.querySelectorAll('[data-field]').forEach(btn => {
      btn.classList.toggle('lit', btn.dataset.field === state.field);
    });
  }

  function setField(field) {
    if (field === state.field) return;
    state.field = field;
    bench.setField(field);
    soundscape.playToggleClack?.();
    paintControls();
    renderReadout(null);
  }

  async function runTool(tool) {
    if (busy) return;

    if (tool === 'reset') {
      if (!state.sample) return;
      bench.reset(state.sample);
      delete state.stripped[state.sample];
      refreshNeedles();
      soundscape.playToggleClack?.();
      renderReadout(null, {
        head: `Bench // ${labelFor(state.sample)}`,
        body: 'Every electron is back where it started.'
      });
      return;
    }

    if (!state.sample) {
      frame.note('Tap a sample on the bench first.');
      return;
    }
    const id = state.sample;

    if (tool === 'meter') {
      /* THE NEEDLE STAYS ON THE SAMPLE.
         It used to print one sentence into the readout and leave, so the very
         stages that are ABOUT the needle asked a player to compare a reading
         against a thing that had already scrolled away, and driving a sample to
         a given charge meant carrying a number in your head through four presses
         of a stripper. A meter you clip to something stays clipped: the gauge is
         drawn on that sample's own plate, it follows the sample when an electron
         comes off, and four samples on the bench carry four gauges you can read
         side by side. `refreshNeedles` below is what keeps them honest. */
      const net = liveCharge(id);
      state.metered.add(id);
      soundscape.playScanSweep?.();
      refreshNeedles();
      renderReadout(null, {
        head: `Needle // ${labelFor(id)}`,
        body: net === 0
          ? 'The needle settles on zero and stays there.'
          : `The needle swings to ${net > 0 ? 'plus' : 'minus'} ${Math.abs(net)} and holds.`
      });
      return;
    }

    if (tool === 'strip') {
      busy = true;
      frame.clearBanner();
      frame.setCommitEnabled(false);
      const ring = await bench.strip(id);
      if (ring === null) {
        renderReadout(null, {
          head: `Stripper // ${labelFor(id)}`,
          body: 'There are no electrons left to take off.'
        });
      } else {
        state.stripped[id] = (state.stripped[id] || 0) + 1;
        soundscape.playBondSnap?.();
        refreshNeedles();
        renderReadout(null, {
          head: `Stripper // ${labelFor(id)}`,
          body: `One electron knocked clear of shell ${ring + 1}.`
        });
      }
      busy = false;
      frame.setCommitEnabled(true);
    }
  }

  /* ---------------- bench queries ---------------- */

  function specFor(id) {
    return STAGES[index].specimens.find(s => s.id === id) || null;
  }

  function labelFor(id) {
    return specFor(id)?.label || id;
  }

  /**
   * Re-read every needle that is clipped to a sample.
   *
   * A meter left on a sample keeps measuring it, so anything that changes what
   * is on a sample has to come through here. The bench does no arithmetic of its
   * own: it is handed the figure and shows it.
   */
  function refreshNeedles() {
    for (const mid of state.metered) bench.setNeedle(mid, liveCharge(mid));
  }

  /** The needle reads the specimen as it stands now, stripped pieces included. */
  function liveCharge(id) {
    const spec = specFor(id);
    if (!spec) return 0;
    return netCharge({ core: spec.core, rings: bench.ringsOf(id) });
  }

  /* ---------------- readout ---------------- */

  function onProbe(hit) {
    state.probed.add(hit.part);
    soundscape.playScanSweep?.();
    renderReadout(hit);
  }

  function onSelect(id) {
    state.sample = id;
    bench.setSelected(id);
  }

  function renderReadout(hit, message) {
    if (message) {
      frame.setReadout(`
        <div class="lq-readout-card">
          <div class="lq-readout-head">${esc(message.head)}</div>
          <p class="lq-readout-line">${esc(message.body)}</p>
        </div>
      `);
      return;
    }
    if (!hit) {
      frame.setReadout(`
        <div class="lq-readout-card lq-readout-idle">
          <div class="lq-readout-head">Probe // standby</div>
          <p class="lq-readout-line">${state.field === 'whole'
            ? 'The whole atom at its own size. Use the other two keys to look inside it.'
            : state.field === 'core'
              ? 'The nucleus, magnified until the grains come apart. Click any grain to read it.'
              : 'Pulled back to the electrons on their shells. Click any one to read it.'}</p>
        </div>
      `);
      return;
    }

    const part = PARTS[hit.part];
    const spec = specFor(hit.specimenId);
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">Probe // ${esc(hit.specimenLabel)}</div>
        <div class="lq-readout-code">${esc(part.code)}</div>
        ${part.charge === null ? '' : chargeChip(part.charge)}
        ${(hit.part === 'marked' || hit.part === 'blank' || hit.part === 'core') && spec
          ? `<div class="lq-readout-hold">This nucleus holds ${massNumber(spec)} grains in all.</div>`
          : ''}
        ${hit.part === 'light'
          ? `<div class="lq-readout-hold">On shell ${hit.ring + 1}, counting outward.</div>`
          : ''}
        <p class="lq-readout-line">${esc(part.note)}</p>
      </div>
    `);
  }

  /** Printed ink on a hairline, never a glowing block (CLAUDE.md §4). */
  function chargeChip(charge) {
    const sign = charge > 0 ? 'plus' : charge < 0 ? 'minus' : 'none';
    const text = charge > 0 ? 'Needle: plus one' : charge < 0 ? 'Needle: minus one' : 'Needle: no movement';
    return `<div class="cb-charge" data-sign="${sign}">${text}</div>`;
  }

  /* ---------------- answer widgets ---------------- */

  function renderWidget() {
    const stage = STAGES[index];
    const w = stage.widget;

    if (w.type === 'triple' || w.type === 'pair') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-build">
            ${w.fields.map((label, fi) => `
              <div class="lq-build-row no-dot" data-slot="${fi}">
                <span class="lq-build-code">${esc(label)}</span>
                <button type="button" class="btn-secondary quest-btn-sm" data-slot-step="-1" aria-label="Lower ${esc(label)}">&minus;</button>
                <span class="lq-build-count">0</span>
                <button type="button" class="btn-secondary quest-btn-sm" data-slot-step="1" aria-label="Raise ${esc(label)}">+</button>
              </div>
            `).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-slot-step]').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('[data-slot]');
          const fi = Number(row.dataset.slot);
          const delta = Number(btn.dataset.slotStep);
          state.numbers[fi] = Math.max(w.min, Math.min(w.max, state.numbers[fi] + delta));
          row.querySelector('.lq-build-count').textContent = String(state.numbers[fi]);
          row.classList.toggle('filled', state.numbers[fi] > 0);
          soundscape.playToggleClack?.();
        });
      });
      return;
    }

    if (w.type === 'number') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-number">
            <button type="button" class="btn-secondary quest-btn-sm" data-num="-1" aria-label="Lower">&minus;</button>
            <span class="lq-number-value" aria-live="polite">${state.number}</span>
            <button type="button" class="btn-secondary quest-btn-sm" data-num="1" aria-label="Raise">+</button>
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-num]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.number = Math.max(w.min, Math.min(w.max, state.number + Number(btn.dataset.num)));
          frame.el.widget.querySelector('.lq-number-value').textContent = String(state.number);
          soundscape.playToggleClack?.();
        });
      });
      return;
    }

    if (w.type === 'rings') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-build">
            ${w.rings.map((label, ri) => `
              <div class="lq-build-row" data-ring="${ri}">
                <span class="lq-build-dot" data-tint="bone"></span>
                <span class="lq-build-code">${esc(label)}</span>
                <button type="button" class="btn-secondary quest-btn-sm" data-ring-step="-1" aria-label="One fewer on ${esc(label)}">&minus;</button>
                <span class="lq-build-count">0</span>
                <button type="button" class="btn-secondary quest-btn-sm" data-ring-step="1" aria-label="One more on ${esc(label)}">+</button>
              </div>
            `).join('')}
          </div>
          <p class="form-help cb-remaining">${w.total} electrons to place. The + key on a row puts one on that shell, the &minus; key takes one off.</p>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-ring-step]').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('[data-ring]');
          const ri = Number(row.dataset.ring);
          const delta = Number(btn.dataset.ringStep);
          const placed = state.rings.reduce((n, r) => n + r, 0);
          if (delta > 0 && placed >= w.total) return;
          state.rings[ri] = Math.max(0, state.rings[ri] + delta);
          row.querySelector('.lq-build-count').textContent = String(state.rings[ri]);
          row.classList.toggle('filled', state.rings[ri] > 0);
          const left = w.total - state.rings.reduce((n, r) => n + r, 0);
          frame.el.widget.querySelector('.cb-remaining').textContent =
            left === 0
              ? 'All placed. Move them between shells until the outer one is full, then commit.'
              : `${left} still to place. The + key on a row puts one on that shell, the \u2212 key takes one off.`;
          if (STAGES[index].target) bench.setRings(STAGES[index].target, state.rings);
          soundscape.playToggleClack?.();
        });
      });
      return;
    }

    if (w.type === 'bins') {
      const rows = w.rows || STAGES[index].specimens.map(s => s.id);
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">Your answer</span>
          <div class="lq-bins">
            ${rows.map(id => `
              <div class="lq-bin-row" data-specimen="${id}">
                <span class="lq-bin-sample">${esc(labelFor(id))}</span>
                <div class="lq-bin-keys">
                  ${w.bins.map(b => `
                    <button type="button" class="choice-option lq-bin-key" data-bin="${b.id}">
                      <span class="lq-bin-label">${esc(b.label)}</span>
                      <span class="lq-bin-note">${esc(b.note)}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-bin]').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('[data-specimen]');
          const sid = row.dataset.specimen;
          state.bins[sid] = btn.dataset.bin;
          row.querySelectorAll('[data-bin]').forEach(o => o.classList.toggle('selected', o === btn));
          const bin = w.bins.find(b => b.id === btn.dataset.bin);
          bench.setPlateTag(sid, bin ? bin.label : '');
          soundscape.playToggleClack?.();
        });
      });
    }
  }

  /* ---------------- go ---------------- */

  loadStage(index);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      bench.dispose();
      frame.dispose();
    }
  };
}
