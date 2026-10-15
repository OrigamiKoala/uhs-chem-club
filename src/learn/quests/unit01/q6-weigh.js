/**
 * q6-weigh.js — Tallow, bench six: COUNTING BY WEIGHT. (Built as Ligar's bench four;
 * moved to Tallow on 2026-10-10, where it follows Atomic Mass as AP Unit 1 does. Its
 * one ionic sample became a molecular one, because Tallow comes before Ligar names
 * the formula unit.)
 *
 * The assay floor from Tallow site five, put to the job it was always going to
 * end up doing. Bench three counted molecules because there were few enough to
 * count; a real crate holds more atoms than anyone could count in a lifetime,
 * and every instrument in the yard reports a MASS. This bench is the bridge.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  a crate too full to tip, weighed instead   -> counting by weighing
 *   2  a bin weight against a recipe              -> formula mass
 *   3  three samples of sixty, weighed            -> equal counts weigh in the same ratio
 *   4  measure out a matching count               -> the mole
 *   5  a mole of a compound                       -> molar mass
 *   6  a drum of 72 grams                         -> grams and moles convert both ways
 *   7  two moles of a compound, by kind           -> a recipe reads in moles
 *   8  three drums, which holds the most atoms    -> weight is not count
 *   -- debrief: why every real measurement is a mass, and what comes after it.
 *
 * `q3-recipe` earned fixed composition, percent composition and the empirical
 * formula, so those are plain words here. What this quest has to earn is on
 * `VOCABULARY`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { AssayFloor } from '../../engine/instruments.js';
import { LearnFrame, toolNotes } from '../../engine/frame.js';
import { dialMarkup, bindDial, paintDial } from '../../engine/dial.js';
import { drawMoleMap } from '../../engine/visual-devices.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

/** When each withheld word is earned. Specific terms first. */
export const VOCABULARY = [
  { term: /\bformula mass\b/i, introducedAt: 2 },
  { term: /\bavogadro\w*\b/i, introducedAt: 4 },
  { term: /\bmolar\b/i, introducedAt: 5 },
  { term: /\bmoles?\b/i, introducedAt: 4 }
];

const SPEAKER = 'Vess';

/**
 * THE COUNT DIAL on stage 4's balance: how many atoms of the selected sample the pan
 * is weighing, from sixty up to the count the stage is about. The balance reports the
 * weight of that many atoms and nothing more; at the last detent the same figure
 * is in grams instead of atomic mass units, and that is the whole discovery.
 */
export const COUNTS = [60, 6000, 6000000, 6.02e23];
const COUNT_NAMES = { 1: 'x 60', 2: 'x 6,000', 3: 'x 6 million', 4: 'x 6.02 x 10^23' };

function sci(x) {
  if (x < 1e6) return x.toLocaleString('en-US', { maximumFractionDigits: 1 });
  const e = Math.floor(Math.log10(x));
  const m = x / Math.pow(10, e);
  return `${Number(m.toFixed(2))} x 10^${e}`;
}

/* ------------------------------------------------------------------
   THE LISTED MASSES
   The figures charted at Tallow site three and measured at site five.
   Nothing on this bench may change one.
   ------------------------------------------------------------------ */
export const CARD_MASS = {
  'hydrogen': 1.0,
  'carbon': 12.0,
  'oxygen': 16.0,
  'sodium': 23.0,
  'chlorine': 35.5
};

/* ------------------------------------------------------------------
   THE KEY LEGEND

   A KEY WHOSE LABEL SAYS WHAT IT DOES OWES NOTHING.

   Only the keys below carry a line, and each one carries it because
   its label leaves something out. Everything else on this bench — the
   keys that were once explained back to the player in their own words —
   is left to say what it says.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  balance: [{
    from: 1,
    key: 'Weigh Sample',
    what: 'Weighs the sample whole, without opening it.'
  }]
};

export function toolNoteFor(controlId, stageNumber) {
  const rows = TOOL_TEXT[controlId];
  if (!rows) return null;
  let out = null;
  for (const r of rows) if (stageNumber >= r.from) out = r;
  return out ? { key: out.key, what: out.what } : null;
}

/** What a hopper weighs in total, as the pan reads it. */
export function totalOf(hopper) {
  return (hopper.bins || []).reduce((m, b) => m + b.mass * b.n, 0);
}

/** How many particles (atoms or molecules) a hopper holds. The floor only ever reports this for a sample it could tip. */
export function countOf(hopper) {
  return (hopper.bins || []).reduce((n, b) => n + b.n, 0);
}

/**
 * What a hopper's particles are called, counted `n`. A sample of one element
 * holds atoms; a compound declares `particle` ('molecule'; Ligar's ionic samples
 * would say 'formula unit') because a mole is a count of whatever the substance
 * is made of, and the readout has to say which.
 */
export function particleWord(hopper, n = 2) {
  const one = hopper?.particle || 'atom';
  return n === 1 ? one : `${one}s`;
}

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Count What You Cannot Tip',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench tips a sample down a chute into bins by weight and counts what lands in each. "Weigh Sample" puts a whole sample on a balance, even one too full to tip.'
    },
    prompt: 'How many atoms are in the carbon crate based on its measured weight?',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'h1', label: 'SAMPLE A', code: 'carbon', note: '40 atoms, kept as the counting standard', bins: [{ mass: 12, n: 40 }] },
      { id: 'h2', label: 'SAMPLE B', code: 'carbon', note: 'a full crate, gate shut', bulk: true, bins: [{ mass: 12, n: 300 }] }
    ],
    reference: ['carbon — listed mass 12.0'],
    widget: { type: 'number', min: 0, max: 400, step: 50, label: 'Atoms in the full crate' },
    hints: [
      'Tap the open sample, press "Tip Sample", then press "Weigh Sample" on it, and weigh the full crate as well.',
      'The open sample is 40 atoms weighing 480 in all, and the full crate holds the same element, so each of its atoms weighs the same.',
      'Divide the total weight of the full crate by the weight of a single atom from the open sample.'
    ],
    check(state) {
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the number you worked out.' };
      }
      if (state.number === 50) {
        return { ok: false, msg: 'Weigh both: Sample B is far heavier than Sample A, and Sample A already holds 40.' };
      }
      if (state.number !== 300) {
        return { ok: false, msg: 'Work out what one atom weighs from Sample A, then divide Sample B\'s total by it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B: 3600 on the pan, 300 atoms.',
      title: 'Counting By Weighing',
      body: 'Nobody counted Sample B and nobody has to: once you know what one atom weighs, a total weight divides straight into a count. A small sample you CAN count hands you the weight of one atom, and from there the biggest crate in the yard is countable. This is how chemists count things far too small to count one by one.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What One Molecule Weighs',
    prompt: 'What is the formula weight of one molecule of methane (CH4)?',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'h3', label: 'SAMPLE A', note: '40 molecules, one oxygen to two hydrogen', particle: 'molecule', bins: [{ mass: 18, n: 40 }] },
      { id: 'h4', label: 'SAMPLE B', note: 'a full crate, one carbon to four hydrogen, gate shut', particle: 'molecule', bulk: true, bins: [{ mass: 16, n: 250 }] }
    ],
    reference: ['hydrogen — 1.0', 'carbon — 12.0', 'oxygen — 16.0'],
    widget: { type: 'number', min: 10, max: 24, step: 1, label: 'Weight of one molecule of the second sample' },
    hints: [
      'Tap the first sample, press "Tip Sample", and read the weight stencilled under the bin that caught everything.',
      'The first sample\'s bin caught at 18, and its recipe is one oxygen at 16.0 with two hydrogen at 1.0 each, so a molecule weighs what its atoms weigh added up.',
      'Read the second sample\'s recipe off its label, then add one listed mass from the plate for every atom in it.'
    ],
    check(state) {
      if (state.number === 10) {
        return { ok: false, notYet: true, msg: 'Set the counter to the figure you worked out.' };
      }
      if (state.number === 12) {
        return { ok: false, msg: 'That is the carbon on its own, with none of the four hydrogen counted.' };
      }
      if (state.number === 13) {
        return { ok: false, msg: 'That counts one hydrogen. A molecule of the second sample holds four of them.' };
      }
      if (state.number === 18) {
        return { ok: false, msg: 'That is the first sample. The second sample holds a different recipe, so work its own out.' };
      }
      if (state.number !== 16) {
        return { ok: false, msg: 'Add up one molecule of the second sample: one listed mass for every atom in its recipe.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'First sample caught at 18. Second sample: 16.',
      title: 'Formula Mass',
      body: 'The first sample landed in the bin marked 18, which is exactly 16.0 + 1.0 + 1.0: the listed masses of the atoms in one molecule of it, added up. The second sample comes to 12 + 4 = 16 the same way. Adding up the listed masses of every atom in one molecule of a substance gives its formula mass, and there is nothing more to it than that.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Three Samples of Sixty',
    prompt: 'What pattern do the weighed totals of sixty atoms of each element reveal?',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'h5', label: 'SAMPLE A', code: 'hydrogen', note: '60 atoms, counted in', bins: [{ mass: 1, n: 60 }] },
      { id: 'h6', label: 'SAMPLE B', code: 'carbon', note: '60 atoms, counted in', bins: [{ mass: 12, n: 60 }] },
      { id: 'h7', label: 'SAMPLE C', code: 'oxygen', note: '60 atoms, counted in', bins: [{ mass: 16, n: 60 }] }
    ],
    reference: ['hydrogen — 1.0', 'carbon — 12.0', 'oxygen — 16.0'],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'ratio', label: 'The three totals stand in the same ratio as the three listed masses', note: 'Weight follows the listed mass exactly.' },
        { id: 'equal', label: 'They all weigh the same, because the counts are the same', note: 'Same count, same weight.' },
        { id: 'nothing', label: 'Nothing — three different elements give three unrelated totals', note: 'No relation between them.' },
        { id: 'sum', label: 'They add up to a round number', note: 'The three totals taken together.' }
      ]
    },
    hints: [
      'Tap a sample, press "Tip Sample", and do the same for the other two.',
      'The three totals came to 60, 720 and 960, so divide each one by the 60 atoms it holds.',
      'Divide each of the three totals by 60 and set each result beside the listed mass of that element on the plate.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'equal') {
        return { ok: false, msg: 'The three totals came to 60, 720 and 960, so equal counts did not give equal weights.' };
      }
      if (state.choice === 'nothing') {
        return { ok: false, msg: 'Divide each total by the 60 atoms it holds, and compare the results with the plate.' };
      }
      if (state.choice === 'sum') {
        return { ok: false, msg: '60, 720 and 960 come to 1740 together, which is nothing in particular.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Three samples of 60: 60, 720 and 960 on the pan.',
      title: 'Equal Counts Weigh In the Same Ratio',
      body: 'Three samples holding exactly the same number of atoms weighed 60, 720 and 960 — one, twelve and sixteen times each other, which is the ratio of their listed masses. It has to come out that way: if one carbon atom weighs twelve times one hydrogen atom, any equal counts of the two weigh in that same twelve to one ratio. Run that backwards and you have a way of measuring out equal counts without counting anything.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Measure Out a Matching Count',
    briefing: {
      speaker: SPEAKER,
      body: 'A dozen eggs and a dozen bowling balls weigh differently but count the same. Use the count dial on the balance to see how atomic mass units scale up to grams.'
    },
    prompt: 'How many grams of oxygen contain the same number of atoms as 12.0 grams of carbon?',
    controls: ['pour', 'balance', 'count'],
    hoppers: [
      { id: 'h5', label: 'SAMPLE A', code: 'hydrogen', note: '60 atoms, counted in', bins: [{ mass: 1, n: 60 }] },
      { id: 'h6', label: 'SAMPLE B', code: 'carbon', note: '60 atoms, counted in', bins: [{ mass: 12, n: 60 }] },
      { id: 'h7', label: 'SAMPLE C', code: 'oxygen', note: '60 atoms, counted in', bins: [{ mass: 16, n: 60 }] }
    ],
    reference: ['hydrogen — 1.0', 'carbon — 12.0', 'oxygen — 16.0'],
    widget: { type: 'number', min: 8, max: 26, step: 1, label: 'Grams of oxygen' },
    hints: [
      'Tip at least two of the samples and put each total next to the sixty atoms it came from.',
      'Equal counts weigh in the ratio of the listed masses, so to get equal counts you weigh out the listed masses themselves.',
      'Set grams of oxygen over 12.0 grams of carbon equal to oxygen\'s listed mass over carbon\'s listed mass, and solve for the grams.'
    ],
    check(state) {
      if (state.number === 8) {
        return { ok: false, notYet: true, msg: 'Set the counter to the figure you worked out.' };
      }
      if (state.number === 12) {
        return { ok: false, msg: 'Equal weights are not equal counts: an oxygen atom is heavier, so 12.0 grams of it holds fewer atoms than 12.0 grams of carbon.' };
      }
      if (state.number === 24) {
        return { ok: false, msg: 'Doubling works for more of the same element. These are two different elements, so go by their listed masses.' };
      }
      if (state.number !== 16) {
        return { ok: false, msg: 'Equal counts weigh in the ratio of the listed masses. Compare oxygen\'s listed mass with carbon\'s.' };
      }
      return { ok: true };
    },
    reward: {
      log: '12.0 g of carbon matches 16.0 g of oxygen.',
      title: 'The Mole',
      body: "Take the listed mass of any element in grams and you have taken the same number of atoms every time, and that amount is called one mole of it. Nobody picked the number: it falls out of the listed masses already being ratios of one another. It works out to 6.02 x 10^23 atoms — a 6 followed by 23 zeros — a figure called Avogadro's number, and that count being far too big to say any other way is the whole reason the word mole exists."
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'A Mole of a Compound',
    prompt: 'How many grams of carbon dioxide (CO2) make up one mole of molecules?',
    controls: ['balance'],
    hoppers: [
      { id: 'h8', label: 'SAMPLE A', note: 'a full crate, one carbon to two oxygen, gate shut', particle: 'molecule', bulk: true, bins: [{ mass: 44, n: 200 }] }
    ],
    reference: ['carbon — 12.0', 'oxygen — 16.0'],
    widget: { type: 'number', min: 0, max: 100, step: 1, label: 'Grams in one mole of CO₂' },
    hints: [
      'Work out the formula mass of carbon dioxide first: one carbon and two oxygen.',
      'One mole of an element is its listed mass in grams, and a molecule weighs the listed masses of all its atoms added up.',
      'Add the listed mass of one carbon (12) to the listed mass of two oxygen (16 + 16) to get the grams in one mole.'
    ],
    check(state) {
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the molar mass of carbon dioxide.' };
      }
      if (state.number === 12) {
        return { ok: false, msg: '12 grams is carbon alone. Add the mass of both oxygen atoms.' };
      }
      if (state.number === 28) {
        return { ok: false, msg: '28 grams counts only one oxygen atom. Each molecule holds two.' };
      }
      if (state.number === 88) {
        return { ok: false, msg: '88 grams is two moles of carbon dioxide. Calculate for one mole.' };
      }
      if (state.number !== 44) {
        return { ok: false, msg: 'Add the listed mass of carbon (12) and two oxygen atoms (16 + 16).' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One mole of Sample A weighs 44.0 grams.',
      title: 'Molar Mass',
      body: 'The rule does not stop at elements: add up the listed masses of every atom in one molecule of a compound and that many grams of it is one mole of its molecules. Here 12.0 + 16.0 + 16.0 = 44.0, so 44.0 grams holds 6.02 x 10^23 molecules of it. That figure, grams per mole, is called the molar mass, and every substance has one.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'A Drum of Seventy-Two',
    prompt: 'How many moles of water does the 72-gram drum hold?',
    controls: ['balance'],
    hoppers: [
      { id: 'h9', label: 'SAMPLE A', note: 'one drum, one oxygen to two hydrogen, gate shut', particle: 'molecule', bulk: true, bins: [{ mass: 18, n: 4 }] }
    ],
    reference: ['hydrogen — 1.0', 'oxygen — 16.0'],
    widget: { type: 'number', min: 0, max: 8, step: 1, label: 'Moles in the drum' },
    hints: [
      'Tap Sample A and press "Weigh Sample" to read what the drum holds.',
      'Work out what one mole of this compound weighs first, the way you did on the last stage.',
      'Add up the listed masses in one molecule to get the grams in one mole, then divide the drum\'s reading by that.'
    ],
    check(state) {
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the number you worked out.' };
      }
      if (state.number === 1) {
        return { ok: false, msg: 'One mole is what one molecule weighs, in grams. Compare that with what the drum reads.' };
      }
      if (state.number === 2) {
        return { ok: false, msg: 'Two moles would weigh twice one mole. Compare that with what the drum reads.' };
      }
      if (state.number !== 4) {
        return { ok: false, msg: 'Work out what one mole weighs from the recipe, then divide the drum\'s reading by it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Drum reads 72. That is 4 moles.',
      title: 'Grams and Moles Convert Both Ways',
      body: 'The molar mass is the bridge between the two: divide a mass in grams by it to get moles, multiply moles by it to get grams. 72 grams at 18 grams per mole is 4 moles, and those 4 moles hold four times 6.02 x 10^23 molecules. Every real measurement you can take is a mass and every recipe is a count, so this is the conversion that joins the two.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Moles of Each Element',
    prompt: 'How many moles of hydrogen atoms are present in two moles of water (H2O)?',
    controls: ['balance'],
    hoppers: [
      { id: 'h10', label: 'SAMPLE A', note: 'two drums, one oxygen to two hydrogen, gate shut', particle: 'molecule', bulk: true, bins: [{ mass: 18, n: 2 }] }
    ],
    reference: ['hydrogen — 1.0', 'oxygen — 16.0'],
    widget: { type: 'number', min: 0, max: 8, step: 1, label: 'Moles of hydrogen' },
    hints: [
      'Write down the recipe of one molecule first: one oxygen and two hydrogen.',
      'A ratio does not care what you count in, so two hydrogen per molecule is also two moles of hydrogen for every mole of molecules.',
      'Multiply the number of moles of the compound by the count of hydrogen atoms in each molecule.'
    ],
    check(state) {
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the number you worked out.' };
      }
      if (state.number === 2) {
        return { ok: false, msg: 'Two is the number of moles of molecules, and of the oxygen in them. Each molecule holds two hydrogen, not one.' };
      }
      if (state.number === 1) {
        return { ok: false, msg: 'One molecule already holds two hydrogen, so one mole of molecules holds two moles of them.' };
      }
      if (state.number !== 4) {
        return { ok: false, msg: 'Each molecule holds two hydrogen, and you have two moles of molecules.' };
      }
      return { ok: true };
    },
    reward: {
      log: '2 moles of water hold 4 moles of hydrogen.',
      title: 'A Recipe Reads in Moles',
      body: 'The numbers in a formula are a ratio of atoms, and a ratio does not care what unit you count in: two hydrogen per molecule is also two moles of hydrogen per mole of molecules. So two moles of this compound hold four moles of hydrogen and two moles of oxygen. That is why the formula written for a single molecule is the same formula a yard uses to weigh out a shipment.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Which Drum Holds the Most',
    prompt: 'Which of the three element drums contains the greatest total count of atoms?',
    controls: ['balance'],
    hoppers: [
      { id: 'd1', label: 'SAMPLE A', code: 'carbon', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 12, n: 5 }] },
      { id: 'd2', label: 'SAMPLE B', code: 'oxygen', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 16, n: 4 }] },
      { id: 'd3', label: 'SAMPLE C', code: 'hydrogen', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 1, n: 6 }] }
    ],
    reference: ['hydrogen — 1.0', 'carbon — 12.0', 'oxygen — 16.0'],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'd1', label: 'Sample A', note: 'Sixty grams of carbon.' },
        { id: 'd2', label: 'Sample B', note: 'Sixty-four grams of oxygen.' },
        { id: 'd3', label: 'Sample C', note: 'Six grams of hydrogen.' }
      ]
    },
    hints: [
      'Tap each drum and press "Weigh Sample" to read what it holds.',
      'A weight tells you nothing about a count until you divide it by the listed mass of what is in the drum.',
      'Divide each drum’s mass by its element’s listed mass to compare their mole counts.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the three drums.' };
      }
      if (state.choice === 'd2') {
        return { ok: false, msg: 'Sample B is the heaviest drum, but its atoms are the heaviest too. Divide its weight by its listed mass before comparing.' };
      }
      if (state.choice === 'd1') {
        return { ok: false, msg: 'Divide every drum\'s weight by its listed mass, and compare all three results.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample C: 6 grams, 6 moles, the most atoms on the floor.',
      title: 'Weight Is Not Count',
      body: 'The lightest drum on the floor holds the most atoms, because a hydrogen atom weighs a sixteenth of what an oxygen atom does. A balance only ever reports mass, so a count is always a mass divided by a molar mass. Every real measurement in chemistry begins with that division and ends with the reverse of it.',
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
      body: 'Nobody can count atoms, so everybody weighs them instead. One mole of a substance is its formula mass in grams, and it always holds the same number of atoms or molecules, whichever the substance is made of — 6.02 x 10^23 of them.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'A formula is a count and a balance reads a mass, and until you can turn one into the other a recipe cannot be prepared. The molar mass provides that conversion.'
    },
    {
      heading: 'Next',
      body: 'You\'ve mastered weighing and counting on Tallow! Now, one colossal rogue machine stands on the salt flats: the refinery Hopper. Let\'s put everything together!'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Water is H2O. Hydrogen is 1.0 and oxygen is 16.0. How many moles are in 36 grams of water?',
    options: [
      { id: 'a', label: '1 mole' },
      { id: 'b', label: '2 moles' },
      { id: 'c', label: '18 moles' },
      { id: 'd', label: '36 moles' }
    ],
    answer: 'b',
    explanation: 'One molecule of water weighs 16.0 + 1.0 + 1.0 = 18.0, so the molar mass is 18 grams per mole. 36 / 18 = 2 moles.'
  },
  {
    question: 'Carbon is 12.0 and oxygen is 16.0. What is the molar mass of carbon dioxide, CO2?',
    options: [
      { id: 'a', label: '28 grams per mole' },
      { id: 'b', label: '32 grams per mole' },
      { id: 'c', label: '44 grams per mole' },
      { id: 'd', label: '56 grams per mole' }
    ],
    answer: 'c',
    explanation: 'One CO2 holds one carbon and TWO oxygens: 12.0 + 16.0 + 16.0 = 44.0. The answer 28 counts only one oxygen, which is carbon monoxide instead.'
  },
  {
    question: 'You have 12 grams of carbon (12.0) and 12 grams of magnesium (24.3). Which holds more atoms?',
    options: [
      { id: 'a', label: 'The carbon' },
      { id: 'b', label: 'The magnesium' },
      { id: 'c', label: 'They hold the same number, because they weigh the same' },
      { id: 'd', label: 'There is no way to tell' }
    ],
    answer: 'a',
    explanation: '12 / 12.0 = 1 mole of carbon, but 12 / 24.3 = about 0.49 moles of magnesium. A magnesium atom is roughly twice as heavy, so the same mass of it holds about half as many atoms.'
  },
  {
    question: 'How many moles of hydrogen atoms are in 2 moles of water, H2O?',
    options: [
      { id: 'a', label: '1' },
      { id: 'b', label: '2' },
      { id: 'c', label: '4' },
      { id: 'd', label: '6' }
    ],
    answer: 'c',
    explanation: 'Each water molecule holds 2 hydrogen atoms, so each mole of water holds 2 moles of hydrogen. Two moles of water therefore hold 2 x 2 = 4 moles of hydrogen atoms.'
  },
  {
    question: 'What does it mean to say you have one mole of iron?',
    options: [
      { id: 'a', label: 'You have one iron atom' },
      { id: 'b', label: 'You have one gram of iron' },
      { id: 'c', label: 'You have 6.02 x 10^23 iron atoms, which weigh 55.8 grams' },
      { id: 'd', label: 'You have as much iron as will fit in a standard container' }
    ],
    answer: 'c',
    explanation: 'A mole is a fixed count, 6.02 x 10^23, chosen so that one mole of any element weighs its listed atomic mass in grams. Iron is listed at 55.8, so one mole of it is 55.8 grams.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return {
    number: stage.widget.type === 'number' ? stage.widget.min : null,
    choice: null,
    bins: {},
    sample: null,
    bin: null,
    count: 1,
    poured: new Set(),
    weighed: new Set()
  };
}

/** The floor state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { poured: new Set(['h1']), weighed: new Set(['h1', 'h2']), number: 300 },
  { poured: new Set(['h3']), number: 16 },
  { poured: new Set(['h5', 'h6', 'h7']), choice: 'ratio' },
  { poured: new Set(['h6', 'h7']), number: 16 },
  { weighed: new Set(['h8']), number: 44 },
  { weighed: new Set(['h9']), number: 4 },
  { weighed: new Set(['h10']), number: 4 },
  { weighed: new Set(['d1', 'd2', 'd3']), choice: 'd3' }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { poured: new Set(['h1']), weighed: new Set(['h1', 'h2']), number: 50 },
  { poured: new Set(['h3']), number: 18 },
  { poured: new Set(['h5', 'h6', 'h7']), choice: 'equal' },
  { poured: new Set(['h6', 'h7']), number: 12 },
  { weighed: new Set(['h8']), number: 12 },
  { weighed: new Set(['h9']), number: 1 },
  { weighed: new Set(['h10']), number: 2 },
  { weighed: new Set(['d1', 'd2', 'd3']), choice: 'd2' }
];

/** Build a full floor state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return { ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const frame = new LearnFrame(container, {
    quest: ctx?.quest || { id: 'q6-weigh' },
    world: ctx?.world,
    stageCount: STAGES.length,
    rewards: STAGES.map(s => s.reward),
    onSubmit: () => submit(),
    onNext: () => next(),
    onJump: i => loadStage(i),
    onExit: () => ctx.exit()
  });

  const floor = new AssayFloor(frame.instrumentHost, {
    onProbe: hit => onProbe(hit),
    onSelect: id => onSelect(id)
  });

  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = null;
  let busy = false;
  let disposed = false;
  let unbindCount = null;

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
      commitLabel: stage.encounter?.act || 'Commit'
    });

    floor.setHoppers(stage.hoppers);
    floor.setSelectable(stage.hoppers.length > 1);
    if (stage.hoppers.length === 1) onSelect(stage.hoppers[0].id);

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

  /* ---------------- floor controls ---------------- */

  function renderControls() {
    const stage = STAGES[index];
    const parts = [];

    if (stage.controls.includes('pour')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="pour">Tip Sample</button>');
    }
    if (stage.controls.includes('balance')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="balance">Weigh Sample</button>');
    }
    if (stage.controls.includes('count')) {
      parts.push(dialMarkup({ label: 'Count', min: 1, max: COUNTS.length, value: state.count, id: 'count-dial', scaleLabels: COUNT_NAMES }));
    }
    if (stage.reference?.length) {
      parts.push(`
        <div class="assay-extract">
          <span class="form-label">Listed masses</span>
          <ul>${stage.reference.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
        </div>
      `);
    }
    parts.push(toolNotes(
      stage.controls.map(id => toolNoteFor(id, index + 1)).filter(Boolean)
    ));

    frame.setControls(parts.join(''));
    frame.el.controls.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => runTool(btn.dataset.tool));
    });
    unbindCount?.();
    unbindCount = stage.controls.includes('count')
      ? bindDial(frame.el.controls, { min: 1, max: COUNTS.length, onChange: v => setCount(v) })
      : null;
    if (stage.controls.includes('count')) paintDial(frame.el.controls, state.count, { min: 1, max: COUNTS.length, scaleLabels: COUNT_NAMES });
    // Once the word molar has been earned (stage 5), the road between grams, moles and
    // particles stands on the card. It names the two conversions and prints no molar mass.
    frame.setDevice(index >= 5 ? (ctx, w, h) => drawMoleMap(ctx, 6, 6, w - 12, h - 12, null, {}) : null);
  }

  function setCount(v) {
    state.count = Math.max(1, Math.min(COUNTS.length, v));
    paintDial(frame.el.controls, state.count, { min: 1, max: COUNTS.length, scaleLabels: COUNT_NAMES });
    soundscape.playToggleClack?.();
    if (state.sample) runTool('balance');
  }

  async function runTool(tool) {
    if (busy) return;
    if (!state.sample) {
      frame.note('No sample selected. Tap one of the samples first.');
      return;
    }
    const id = state.sample;
    const hopper = hopperFor(id);

    if (tool === 'balance') {
      state.weighed.add(id);
      soundscape.playScanSweep?.();
      if (STAGES[index].controls.includes('count') && !hopper.bulk) {
        // The balance weighs this many atoms of the sample, and only says what they weigh.
        const c = COUNTS[state.count - 1];
        const per = hopper.bins[0].mass;
        const atMole = state.count === COUNTS.length;
        renderReadout(null, {
          head: `Balance // ${hopper.label}`,
          body: `${sci(c)} atoms weigh ${sci(per * c / (atMole ? 6.02e23 : 1))} ${atMole ? 'grams' : 'atomic mass units'}.`
        });
        return;
      }
      // A CRATE TOO FULL TO TIP CANNOT BE COUNTED, SO THE PAN DOES NOT SAY IT
      // WAS. The balance reports the mass it measured and stops there; working
      // the count out of that mass is the whole job of this bench.
      renderReadout(null, {
        head: `Balance // ${hopper.label}`,
        body: hopper.bulk
          ? `The pan reads ${fmt(totalOf(hopper))} in all. Nothing on this floor can tell you how many ${particleWord(hopper)} that is.`
          : `The pan reads ${fmt(totalOf(hopper))} in all, over the ${countOf(hopper)} ${particleWord(hopper, countOf(hopper))} the chute counted.`
      });
      return;
    }

    if (tool === 'pour') {
      if (hopper.bulk) {
        frame.note(`${hopper.label} has its gate dogged shut. There is far too much in it for the chute, so weigh it instead.`);
        return;
      }
      if (floor.poured(id)) {
        frame.note(`${hopper.label} has already been tipped, and the tallies above its bins are still there.`);
        return;
      }
      busy = true;
      frame.clearBanner();
      frame.setCommitEnabled(false);
      const shot = await floor.pour(id);
      state.poured.add(id);
      soundscape.playPylonWake?.();
      renderReadout(null, {
        head: `Chute // ${hopper.label}`,
        body: `${shot.total} ${particleWord(hopper, shot.total)} landed: ${shot.totals.map((n, i) => `${n} at weight ${hopper.bins[i].mass}`).join(', ')}. That is ${fmt(totalOf(hopper))} in all.`
      });
      busy = false;
      frame.setCommitEnabled(true);
    }
  }

  /** Whole numbers stay whole; 44.5 stays 44.5. */
  function fmt(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  function hopperFor(id) {
    return STAGES[index].hoppers.find(h => h.id === id) || null;
  }

  /* ---------------- readout ---------------- */

  function onProbe(hit) {
    state.sample = hit.hopperId;
    state.bin = hit.bin;
    floor.setSelected(hit.hopperId);
    soundscape.playToggleClack?.();
    renderReadout(hit);
  }

  function onSelect(id) {
    state.sample = id;
    state.bin = null;
    floor.setSelected(id);
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
          <div class="lq-readout-head">Floor // standby</div>
          <p class="lq-readout-line">Tap a sample to select it. A sample with its gate shut will only go on the balance.</p>
        </div>
      `);
      return;
    }
    const hopper = hopperFor(hit.hopperId);
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">Bin // ${esc(hit.hopperLabel)}, bin ${hit.bin + 1}</div>
        <div class="lq-readout-code">CATCHES WEIGHT ${esc(String(hit.mass))}</div>
        <div class="lq-readout-hold">${hopper?.bulk
          ? 'Empty. The gate on this one is shut.'
          : hit.poured
            ? `${hit.count} ${particleWord(hopper, hit.count)} landed in it.`
            : 'Empty. Nothing has been tipped yet.'}</div>
        <p class="lq-readout-line">A bin only catches ${esc(particleWord(hopper))} of the weight marked under it.</p>
      </div>
    `);
  }

  /* ---------------- answer widgets ---------------- */

  function renderWidget() {
    const stage = STAGES[index];
    const w = stage.widget;

    if (w.type === 'number') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-number">
            <button type="button" class="btn-secondary quest-btn-sm" data-num="-1" aria-label="Lower">&minus;</button>
            <span class="lq-number-value" aria-live="polite">${state.number}</span>
            <button type="button" class="btn-secondary quest-btn-sm" data-num="1" aria-label="Raise">+</button>
          </div>
          <p class="form-help">Steps of ${w.step}, between ${w.min} and ${w.max}.</p>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-num]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.number = Math.max(w.min, Math.min(w.max, state.number + Number(btn.dataset.num) * (w.step || 1)));
          frame.el.widget.querySelector('.lq-number-value').textContent = String(state.number);
          soundscape.playToggleClack?.();
        });
      });
      return;
    }

    if (w.type === 'choice') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-bin-keys">
            ${w.options.map(o => `
              <button type="button" class="choice-option lq-bin-key" data-choice="${o.id}">
                <span class="lq-bin-label">${esc(o.label)}</span>
                <span class="lq-bin-note">${esc(o.note)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-choice]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.choice = btn.dataset.choice;
          frame.el.widget.querySelectorAll('[data-choice]')
            .forEach(o => o.classList.toggle('selected', o === btn));
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
      floor.dispose();
      frame.dispose();
    }
  };
}
