/**
 * q4-weigh.js — Ligar, bench four: COUNTING BY WEIGHT.
 *
 * The assay floor from Tallow site five, put to the job it was always going to
 * end up doing. Bench three counted groups because there were few enough to
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
 *   -- debrief: why every real measurement is a mass, and what comes after Ligar.
 *
 * `q3-recipe` earned fixed composition, percent composition and the empirical
 * formula, so those are plain words here. What this quest has to earn is on
 * `VOCABULARY`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { AssayFloor } from '../../engine/instruments.js';
import { LearnFrame, toolNotes } from '../../engine/frame.js';
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

/* ------------------------------------------------------------------
   THE LISTED MASSES
   The figures charted at Tallow site three and measured at site five.
   Nothing on this bench may change one.
   ------------------------------------------------------------------ */
export const CARD_MASS = {
  'CAT 01': 1.0,
  'CAT 06': 12.0,
  'CAT 08': 16.0,
  'CAT 11': 23.0,
  'CAT 17': 35.5
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

/** How many pieces a hopper holds. The floor only ever reports this for a sample it could tip. */
export function countOf(hopper) {
  return (hopper.bins || []).reduce((n, b) => n + b.n, 0);
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
      body: 'Use the balance to find the piece count of bulk samples by weight.'
    },
    prompt: 'Sample B is too full to tip. Say how many pieces it holds.',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'h1', label: 'SAMPLE A', code: 'CAT 06', note: '40 pieces, kept as the counting standard', bins: [{ mass: 12, n: 40 }] },
      { id: 'h2', label: 'SAMPLE B', code: 'CAT 06', note: 'a full crate, gate shut', bulk: true, bins: [{ mass: 12, n: 300 }] }
    ],
    reference: ['CAT 06 — listed mass 12.0'],
    widget: { type: 'number', min: 0, max: 400, step: 50, label: 'Pieces in Sample B' },
    hints: [
      'Tap Sample A, press "Tip Sample", then press "Weigh Sample" on it, and weigh Sample B as well.',
      'Sample A is 40 pieces weighing 480 in all, and Sample B is the same kind of piece, so each of its pieces weighs the same.',
      'Divide the total weight of Sample B by the weight of a single piece from Sample A.'
    ],
    check(state) {
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the number you worked out.' };
      }
      if (state.number === 50) {
        return { ok: false, msg: 'Sample B weighs 3600 in all, which is more than seven times what Sample A weighs, and Sample A already holds 40.' };
      }
      if (state.number !== 300) {
        return { ok: false, msg: 'One piece weighs 12.0, and Sample B weighs 3600 in all. Divide the one by the other.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B: 3600 on the pan, 300 pieces.',
      title: 'Counting By Weighing',
      body: 'Nobody counted Sample B and nobody has to: once you know what one piece weighs, a total weight divides straight into a count. A small sample you CAN count hands you the weight of one piece, and from there the biggest crate in the yard is countable. This is the only way anybody has ever counted atoms.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What One Unit Weighs',
    prompt: 'Say what one unit of Sample B weighs.',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'h3', label: 'SAMPLE A', note: '40 units, one CAT 08 to two CAT 01', bins: [{ mass: 18, n: 40 }] },
      { id: 'h4', label: 'SAMPLE B', note: 'a full crate, one CAT 06 to four CAT 01, gate shut', bulk: true, bins: [{ mass: 16, n: 250 }] }
    ],
    reference: ['CAT 01 — 1.0', 'CAT 06 — 12.0', 'CAT 08 — 16.0'],
    widget: { type: 'number', min: 10, max: 24, step: 1, label: 'Weight of one unit of Sample B' },
    hints: [
      'Tap Sample A, press "Tip Sample", and read the weight stencilled under the bin that caught everything.',
      'Sample A\'s bin caught at 18, and its recipe is one CAT 08 at 16.0 with two CAT 01 at 1.0 each — so a unit weighs what its atoms weigh added up.',
      'Sum the listed masses of every atom specified in Sample B’s recipe.'
    ],
    check(state) {
      if (state.number === 10) {
        return { ok: false, notYet: true, msg: 'Set the counter to the figure you worked out.' };
      }
      if (state.number === 12) {
        return { ok: false, msg: 'That is the CAT 06 on its own, with none of the four CAT 01 counted.' };
      }
      if (state.number === 13) {
        return { ok: false, msg: 'That counts one CAT 01. A unit of Sample B holds four of them.' };
      }
      if (state.number === 18) {
        return { ok: false, msg: 'That is Sample A. Sample B holds a different recipe, so work its own out.' };
      }
      if (state.number !== 16) {
        return { ok: false, msg: 'Add up one unit of Sample B: 12.0 for the CAT 06 and 1.0 for each of the four CAT 01.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A caught at 18. Sample B: 16.',
      title: 'Formula Mass',
      body: 'Sample A landed in the bin marked 18, which is exactly 16.0 + 1.0 + 1.0 — the listed masses of the atoms in one unit of it, added up. Sample B comes to 12 + 4 = 16 the same way. Adding up the listed masses of everything in one unit of a substance gives its formula mass, and there is nothing more to it than that.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Three Samples of Sixty',
    prompt: 'Every one of these three samples holds sixty pieces. Say what their weights have in common.',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'h5', label: 'SAMPLE A', code: 'CAT 01', note: '60 pieces, counted in', bins: [{ mass: 1, n: 60 }] },
      { id: 'h6', label: 'SAMPLE B', code: 'CAT 06', note: '60 pieces, counted in', bins: [{ mass: 12, n: 60 }] },
      { id: 'h7', label: 'SAMPLE C', code: 'CAT 08', note: '60 pieces, counted in', bins: [{ mass: 16, n: 60 }] }
    ],
    reference: ['CAT 01 — 1.0', 'CAT 06 — 12.0', 'CAT 08 — 16.0'],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'ratio', label: 'The three totals stand in the same ratio as the three listed masses', note: 'Weight follows the listed mass exactly.' },
        { id: 'equal', label: 'They all weigh the same, because the counts are the same', note: 'Same count, same weight.' },
        { id: 'nothing', label: 'Nothing — three different kinds give three unrelated totals', note: 'No relation between them.' },
        { id: 'sum', label: 'They add up to a round number', note: 'The three totals taken together.' }
      ]
    },
    hints: [
      'Tap a sample, press "Tip Sample", and do the same for the other two.',
      'The three totals came to 60, 720 and 960, so divide each one by the 60 pieces it holds.',
      'Compare the average weight per piece for each sample against the reference card values.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'equal') {
        return { ok: false, msg: 'The three totals came to 60, 720 and 960, so equal counts did not give equal weights.' };
      }
      if (state.choice === 'nothing') {
        return { ok: false, msg: 'Divide each total by 60 and you get 1.0, 12.0 and 16.0 — the three listed masses. That is a relation.' };
      }
      if (state.choice === 'sum') {
        return { ok: false, msg: '60, 720 and 960 come to 1740 together, which is nothing in particular.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Three samples of 60: 60, 720 and 960 on the pan.',
      title: 'Equal Counts Weigh In the Same Ratio',
      body: 'Three samples holding exactly the same number of pieces weighed 60, 720 and 960 — one, twelve and sixteen times each other, which is the ratio of their listed masses. It has to come out that way: if one CAT 06 atom weighs twelve times one CAT 01 atom, any equal counts of the two weigh in that same twelve to one ratio. Run that backwards and you have a way of measuring out equal counts without counting anything.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Measure Out a Matching Count',
    prompt: 'You have weighed out 12.0 grams of CAT 06. Say how many grams of CAT 08 hold exactly the same number of atoms.',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'h5', label: 'SAMPLE A', code: 'CAT 01', note: '60 pieces, counted in', bins: [{ mass: 1, n: 60 }] },
      { id: 'h6', label: 'SAMPLE B', code: 'CAT 06', note: '60 pieces, counted in', bins: [{ mass: 12, n: 60 }] },
      { id: 'h7', label: 'SAMPLE C', code: 'CAT 08', note: '60 pieces, counted in', bins: [{ mass: 16, n: 60 }] }
    ],
    reference: ['CAT 01 — 1.0', 'CAT 06 — 12.0', 'CAT 08 — 16.0'],
    widget: { type: 'number', min: 8, max: 26, step: 1, label: 'Grams of CAT 08' },
    hints: [
      'Tip at least two of the samples and put each total next to the sixty pieces it came from.',
      'Equal counts weigh in the ratio of the listed masses, so to get equal counts you weigh out the listed masses themselves.',
      'Look up the listed mass of CAT 08 to find the mass in grams that yields the same count.'
    ],
    check(state) {
      if (state.number === 8) {
        return { ok: false, notYet: true, msg: 'Set the counter to the figure you worked out.' };
      }
      if (state.number === 12) {
        return { ok: false, msg: 'Equal weights are not equal counts: a CAT 08 atom is heavier, so 12.0 grams of it holds fewer atoms than 12.0 grams of CAT 06.' };
      }
      if (state.number === 24) {
        return { ok: false, msg: 'Doubling works for more of the same kind. These are two different kinds, so go by their listed masses.' };
      }
      if (state.number !== 16) {
        return { ok: false, msg: 'Take each kind in proportion to its own listed mass: 12.0 for CAT 06 and its own figure for CAT 08.' };
      }
      return { ok: true };
    },
    reward: {
      log: '12.0 g of CAT 06 matches 16.0 g of CAT 08.',
      title: 'The Mole',
      body: 'Take the listed mass of any element in grams and you have taken the same number of atoms every time, and that amount is called one mole of it. Nobody picked the number: it falls out of the listed masses already being ratios of one another. It works out to 6.02 x 10^23 atoms, a figure called Avogadro\'s number, and that count being far too big to say any other way is the whole reason the word mole exists.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'A Mole of a Compound',
    prompt: 'Sample A is one CAT 11 to one CAT 17. Say how many grams of it you would weigh out to have one mole of those units.',
    controls: ['balance'],
    hoppers: [
      { id: 'h8', label: 'SAMPLE A', note: 'a full crate, one CAT 11 to one CAT 17, gate shut', bulk: true, bins: [{ mass: 58.5, n: 200 }] }
    ],
    reference: ['CAT 11 — 23.0', 'CAT 17 — 35.5'],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: '585', label: '58.5 grams', note: 'The two listed masses added together.' },
        { id: '355', label: '35.5 grams', note: 'The heavier of the two on its own.' },
        { id: '230', label: '23.0 grams', note: 'The lighter of the two on its own.' },
        { id: '1170', label: '117.0 grams', note: 'Twice 23.0 plus twice 35.5.' }
      ]
    },
    hints: [
      'Work out what one unit of Sample A weighs first, the way you did two stages back.',
      'One mole of an element is its listed mass in grams, and a unit of a compound weighs the sum of the atoms in it.',
      'Add the listed masses of one CAT 11 and one CAT 17 to get the grams in one mole.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === '355' || state.choice === '230') {
        return { ok: false, msg: 'That is one of the two atoms on its own. A unit of Sample A holds both of them.' };
      }
      if (state.choice === '1170') {
        return { ok: false, msg: 'That is two of each. A unit of Sample A holds one CAT 11 and one CAT 17.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One mole of Sample A weighs 58.5 grams.',
      title: 'Molar Mass',
      body: 'The rule does not stop at elements: add up the listed masses in one unit of a compound and that many grams of it is one mole of those units. Here 23.0 + 35.5 = 58.5, so 58.5 grams holds 6.02 x 10^23 formula units of it. That figure, grams per mole, is called the molar mass, and every substance has one.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'A Drum of Seventy-Two',
    prompt: 'Say how many moles of Sample A the drum holds.',
    controls: ['balance'],
    hoppers: [
      { id: 'h9', label: 'SAMPLE A', note: 'one drum, one CAT 08 to two CAT 01, gate shut', bulk: true, bins: [{ mass: 18, n: 4 }] }
    ],
    reference: ['CAT 01 — 1.0', 'CAT 08 — 16.0'],
    widget: { type: 'number', min: 0, max: 8, step: 1, label: 'Moles in the drum' },
    hints: [
      'Tap Sample A and press "Weigh Sample" to read what the drum holds.',
      'Work out what one mole of this compound weighs first, the way you did on the last stage.',
      'Divide the total measured mass by the molar mass of 18 grams per mole.'
    ],
    check(state) {
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the number you worked out.' };
      }
      if (state.number === 1) {
        return { ok: false, msg: 'One mole of this compound weighs 18 grams, and the drum reads 72.' };
      }
      if (state.number === 2) {
        return { ok: false, msg: 'Two moles would be 36 grams. The drum reads 72.' };
      }
      if (state.number !== 4) {
        return { ok: false, msg: 'One unit is 16.0 + 1.0 + 1.0 = 18.0, so divide the 72 on the pan by 18.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Drum reads 72. That is 4 moles.',
      title: 'Grams and Moles Convert Both Ways',
      body: 'The molar mass is the bridge between the two: divide a mass in grams by it to get moles, multiply moles by it to get grams. 72 grams at 18 grams per mole is 4 moles, and those 4 moles hold four times 6.02 x 10^23 units. Every real measurement you can take is a mass and every recipe is a count, so this is the conversion that joins the two.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Moles of Each Kind',
    prompt: 'You have two moles of Sample A. Say how many moles of CAT 01 that holds.',
    controls: ['balance'],
    hoppers: [
      { id: 'h10', label: 'SAMPLE A', note: 'two drums, one CAT 08 to two CAT 01, gate shut', bulk: true, bins: [{ mass: 18, n: 2 }] }
    ],
    reference: ['CAT 01 — 1.0', 'CAT 08 — 16.0'],
    widget: { type: 'number', min: 0, max: 8, step: 1, label: 'Moles of CAT 01' },
    hints: [
      'Write down the recipe of one unit first: one CAT 08 and two CAT 01.',
      'A ratio does not care what you count in, so two CAT 01 per unit is also two moles of CAT 01 for every mole of units.',
      'Multiply the number of moles of the compound by the count of CAT 01 atoms in each unit.'
    ],
    check(state) {
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the number you worked out.' };
      }
      if (state.number === 2) {
        return { ok: false, msg: 'Two is the number of moles of units, and of the CAT 08 in them. Each unit holds two CAT 01, not one.' };
      }
      if (state.number === 1) {
        return { ok: false, msg: 'One unit already holds two CAT 01, so one mole of units holds two moles of them.' };
      }
      if (state.number !== 4) {
        return { ok: false, msg: 'Each unit holds two CAT 01, and you have two moles of units.' };
      }
      return { ok: true };
    },
    reward: {
      log: '2 moles of Sample A hold 4 moles of CAT 01.',
      title: 'A Recipe Reads in Moles',
      body: 'The numbers in a formula are a ratio of atoms, and a ratio does not care what unit you count in: two CAT 01 per unit is also two moles of CAT 01 per mole of units. So two moles of this compound hold four moles of CAT 01 and two moles of CAT 08. That is why the formula written for a single molecule is the same formula a yard uses to weigh out a shipment.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Which Drum Holds the Most',
    prompt: 'Say which of the three drums holds the most atoms.',
    controls: ['balance'],
    hoppers: [
      { id: 'd1', label: 'SAMPLE A', code: 'CAT 06', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 12, n: 5 }] },
      { id: 'd2', label: 'SAMPLE B', code: 'CAT 08', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 16, n: 4 }] },
      { id: 'd3', label: 'SAMPLE C', code: 'CAT 01', note: 'one drum, gate shut', bulk: true, bins: [{ mass: 1, n: 6 }] }
    ],
    reference: ['CAT 01 — 1.0', 'CAT 06 — 12.0', 'CAT 08 — 16.0'],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'd1', label: 'Sample A', note: 'Sixty grams of CAT 06.' },
        { id: 'd2', label: 'Sample B', note: 'Sixty-four grams of CAT 08.' },
        { id: 'd3', label: 'Sample C', note: 'Six grams of CAT 01.' }
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
        return { ok: false, msg: 'Sample B is the heaviest drum at 64 grams, but its atoms are the heaviest too: 64 / 16.0 is only 4 moles.' };
      }
      if (state.choice === 'd1') {
        return { ok: false, msg: 'Sample A comes to 60 / 12.0 = 5 moles, and one of the others beats that.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample C: 6 grams, 6 moles, the most atoms on the floor.',
      title: 'Weight Is Not Count',
      body: 'The lightest drum on the floor holds the most atoms, because a CAT 01 atom weighs a sixteenth of what a CAT 08 atom does. A balance only ever reports mass, so a count is always a mass divided by a molar mass. Every real piece of chemistry begins with that division and ends with the reverse of it.',
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
      body: 'Nobody can count atoms, so everybody weighs them instead. One mole of a substance is its formula mass in grams, and it always holds the same number of units — 6.02 x 10^23 of them.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'A formula is a count and a balance reads a mass, and until you can turn one into the other a recipe cannot be prepared. The molar mass provides that conversion.'
    },
    {
      heading: 'Next',
      body: 'Everything you have handled on Ligar has been a solid you could pick up. The next world asks what is left of all this when a substance is a liquid, or a gas, or in the middle of becoming one.'
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
  { weighed: new Set(['h8']), choice: '585' },
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
  { weighed: new Set(['h8']), choice: '355' },
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
    stageCount: STAGES.length,
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
      // A CRATE TOO FULL TO TIP CANNOT BE COUNTED, SO THE PAN DOES NOT SAY IT
      // WAS. The balance reports the mass it measured and stops there; working
      // the count out of that mass is the whole job of this bench.
      renderReadout(null, {
        head: `Balance // ${hopper.label}`,
        body: hopper.bulk
          ? `The pan reads ${fmt(totalOf(hopper))} in all. Nothing on this floor can tell you how many pieces that is.`
          : `The pan reads ${fmt(totalOf(hopper))} in all, over the ${countOf(hopper)} pieces the chute counted.`
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
        body: `${shot.total} pieces landed: ${shot.totals.map((n, i) => `${n} at weight ${hopper.bins[i].mass}`).join(', ')}. That is ${fmt(totalOf(hopper))} in all.`
      });
      busy = false;
      frame.setCommitEnabled(true);
    }
  }

  /** Whole numbers stay whole; 58.5 stays 58.5. */
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
            ? `${hit.count} piece${hit.count === 1 ? '' : 's'} landed in it.`
            : 'Empty. Nothing has been tipped yet.'}</div>
        <p class="lq-readout-line">A bin only catches pieces of the weight marked under it.</p>
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
