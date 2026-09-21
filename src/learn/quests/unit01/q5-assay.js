/**
 * q5-assay.js — Tallow, site five: THE WEIGHT ON THE CARD.
 *
 * The last bench on Tallow. A sample is tipped down a chute, a deflector sorts
 * its pieces by weight into bins, and a balance weighs a whole sample without
 * opening it. It answers the question the catalogue left lying there: a single
 * atom always has a whole-number mass, and almost none of the listed masses are
 * whole numbers.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  tip one kind and watch it split in two  -> A sample is a mix of isotopes
 *   2  run two samples of the same stock       -> Abundance
 *   3  put the listed mass against the bins    -> The listed mass is an average
 *   4  do the weighting on a fresh sample      -> Average atomic mass
 *   5  a sample that lands in one bin          -> Why some masses are whole
 *   6  a sealed sample, weighed whole          -> The average pins the mix
 *   7  name three unlabelled samples           -> The mass names the element
 *   8  three claims of the same stock          -> The mass is a fingerprint
 *   -- debrief: what a listed mass really is, and what comes after Tallow.
 *
 * WHAT THIS BENCH DOES NOT DO. It never counts a heap too large to count, and
 * it never converts a weight into a number of pieces. Counting by weighing —
 * the mole, molar mass and Avogadro's number — belongs to Ligar, and a unit
 * that has only just met the weighted average has no business being handed it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { AssayFloor } from '../../engine/instruments.js';
import { LearnFrame, toolNotes } from '../../engine/frame.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned. Everything the first four benches taught —
 * proton, neutron, electron, element, isotope, ion, atomic number, mass number,
 * period, group — is a plain word here. Nothing in this table is player-facing.
 */
export const VOCABULARY = [
  { term: /\babundances?\b/i, introducedAt: 2 },
  { term: /\baverage atomic mass\b/i, introducedAt: 4 },
  { term: /\bweighted average\b/i, introducedAt: 4 }
];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE LISTED MASSES
   The figures the player charted at site three, kept here as the bench's
   own reference sheet. Nothing on this bench may change one.
   ------------------------------------------------------------------ */
export const CARD_MASS = {
  'CAT 05': 10.8,
  'CAT 09': 19.0,
  'CAT 10': 20.2,
  'CAT 17': 35.5
};

/* ------------------------------------------------------------------
   THE KEY LEGEND

   THIS FLOOR HAS NOTHING TO EXPLAIN, AND SAYS NOTHING.

   Tip Sample tips the sample. Read Code reads the code. Weigh Sample
   weighs the sample. A line under each key restating its own label is
   not a legend, it is noise between the player and the bench, and it
   was here for all three. A legend earns its place only where a key
   does something its label does not say; none of these do.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {};

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

/**
 * The average weight of one piece in a hopper.
 *
 * NOT WHAT THE BALANCE REPORTS, AND THAT IS THE POINT. A balance weighs; the
 * division is the player's. This is kept because it is the arithmetic every
 * stage from four on is grading against, and having it written once means a
 * hint rung that quotes a figure and a check that refuses one cannot drift
 * apart from each other.
 */
export function averageOf(hopper) {
  const bins = hopper.bins || [];
  const count = bins.reduce((n, b) => n + b.n, 0);
  if (!count) return 0;
  const mass = bins.reduce((m, b) => m + b.mass * b.n, 0);
  return Math.round((mass / count) * 100) / 100;
}

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   Exported so `verify:learn` can run SOLUTIONS and MISSES through every
   `check` without a browser.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Tip It Out',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench tips a sample down a chute, where a deflector sorts the pieces by weight into numbered bins. A balance can also weigh a whole sample without opening it.'
    },
    prompt: 'Say why Sample A splits across two bins instead of landing in one.',
    controls: ['pour', 'code'],
    hoppers: [
      { id: 'h1', label: 'SAMPLE A', code: 'CAT 17', note: '40 pieces, sealed at the mine', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] }
    ],
    reference: ['CAT 17 — listed mass 35.5'],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'mixed', label: 'Two different kinds of atom got mixed together', note: 'Two kinds in one sample.' },
        { id: 'weights', label: 'One kind of atom, with pieces of two different weights', note: 'Same kind, two weights.' },
        { id: 'fault', label: 'The deflector is broken', note: 'It split a sample that is really all one weight.' }
      ]
    },
    hints: [
      'Press "Tip Sample", then tap a bin and press "Read Code", and do the same on the other bin.',
      'The bins are marked 35 and 37, so compare the two codes to see whether the pieces are different kinds.',
      'Both bins read CAT 17, so this is one kind of atom with two weights in it.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the three answers.' };
      }
      if (state.choice === 'mixed') {
        return { ok: false, msg: 'Both bins read CAT 17, so the pieces are all the same kind.' };
      }
      if (state.choice === 'fault') {
        return { ok: false, msg: 'A broken deflector would scatter the pieces instead of sorting them into two tidy bins.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A: 30 pieces at 35, 10 at 37, all CAT 17.',
      title: 'A Sample Is a Mix of Isotopes',
      body: 'Both bins read CAT 17, so every piece has 17 protons and every piece is the same element. The 35s and the 37s differ only in neutrons, which makes them isotopes of each other. A natural sample of an element is a mixture of its isotopes, and this is what that looks like.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Run It Twice',
    prompt: 'Work out how many pieces in every hundred are the lighter weight.',
    controls: ['pour'],
    hoppers: [
      { id: 'h1', label: 'SAMPLE A', note: '40 pieces', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] },
      { id: 'h2', label: 'SAMPLE B', note: '80 pieces', bins: [{ mass: 35, n: 60 }, { mass: 37, n: 20 }] }
    ],
    reference: ['CAT 17 — listed mass 35.5'],
    widget: { type: 'number', min: 0, max: 100, step: 5, label: 'Lighter bin, per hundred pieces' },
    hints: [
      'Tap a sample to select it, press "Tip Sample", then do the same for the other one.',
      'Sample A drops 30 of its 40 pieces into the 35 bin, and Sample B drops 60 of its 80.',
      '30 out of 40 and 60 out of 80 both come to 75 out of 100, so set the counter to 75.'
    ],
    check(state) {
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the share you measured.' };
      }
      if (state.number === 30) {
        return { ok: false, msg: 'That is a count, not a share: 30 pieces out of 40.' };
      }
      if (state.number === 25) {
        return { ok: false, msg: 'That is the heavier bin\'s share, and the question asks about the lighter bin.' };
      }
      if (state.number === 50) {
        return { ok: false, msg: 'The lighter bin caught three times as many pieces, not the same number.' };
      }
      if (state.number !== 75) {
        return { ok: false, msg: 'Work it out from 30 out of 40, or from 60 out of 80.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Both samples split 75 to 25.',
      title: 'Abundance',
      body: 'Two samples of different sizes gave the same split, because the proportions of an element\'s isotopes belong to the material and not to the scoop you took. The share of a sample that is one isotope is called that isotope\'s abundance. Here it is 75 percent at weight 35 and 25 percent at weight 37.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Where 35.5 Sits',
    prompt: 'Sample A is listed at mass 35.5. Say where that figure sits between its two weights.',
    controls: ['pour'],
    hoppers: [
      { id: 'h1', label: 'SAMPLE A', note: '40 pieces', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] }
    ],
    reference: ['CAT 17 — listed mass 35.5'],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'half', label: 'Halfway between them', note: 'Halfway from 35 to 37 is 36.' },
        { id: 'light', label: 'Near 35, because most of the pieces weigh 35', note: 'The common weight pulls it down.' },
        { id: 'heavy', label: 'Near 37, because heavy pieces count for more', note: 'Weight decides, not how many.' },
        { id: 'wrong', label: 'Nowhere — 35.5 is simply wrong', note: 'No piece weighs 35.5.' }
      ]
    },
    hints: [
      'Tip it, then read the number on each bin and the tally above it.',
      'Halfway between 35 and 37 is 36, and 35.5 is not 36, so compare how many pieces landed in each bin.',
      '30 of the 40 pieces weigh 35, so 35.5 sits a quarter of the way from 35 up to 37.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'half') {
        return { ok: false, msg: 'Halfway between 35 and 37 is 36, and the listed mass is 35.5.' };
      }
      if (state.choice === 'heavy') {
        return { ok: false, msg: '35.5 is below 36, so it leans toward the light end, not the heavy one.' };
      }
      if (state.choice === 'wrong') {
        return { ok: false, msg: '35.5 is not the weight of one piece; it is the average over all of them.' };
      }
      return { ok: true };
    },
    reward: {
      log: '35.5 sits a quarter of the way from 35 to 37.',
      title: 'The Listed Mass Is an Average',
      body: 'The mass listed for an element is not the weight of any single atom. It is what one atom weighs on average across a natural sample, so it leans toward whichever isotope is common. Three quarters of this sample weighs 35, which is why the figure lands at 35.5.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Work Out the Average',
    prompt: 'Work out what one piece of Sample A weighs on average.',
    controls: ['pour'],
    hoppers: [
      { id: 'h3', label: 'SAMPLE A', note: '40 pieces, nothing listed for it', bins: [{ mass: 10, n: 8 }, { mass: 11, n: 32 }] }
    ],
    reference: ['CAT 05 — listed mass missing'],
    widget: { type: 'decimal', min: 10.0, max: 11.0, step: 0.1, label: 'Average weight of one piece' },
    hints: [
      'Tip it and read both tallies: 8 pieces at weight 10 and 32 pieces at weight 11.',
      '8 out of 40 is one fifth of the pieces at weight 10, and 32 out of 40 is four fifths at weight 11.',
      'Multiply each weight by its share and add them: (0.2 x 10) + (0.8 x 11) = 2 + 8.8 = 10.8.'
    ],
    check(state) {
      const v = state.decimal;
      if (v === 10.0) {
        return { ok: false, notYet: true, msg: 'Set the dial to the figure you worked out.' };
      }
      if (v === 10.5) {
        return { ok: false, msg: '10.5 is the plain middle of 10 and 11, but the bins caught 8 and 32, not equal numbers.' };
      }
      if (Math.abs(v - 10.8) > 0.001) {
        return { ok: false, msg: `One fifth at weight 10 and four fifths at weight 11 does not come to ${v.toFixed(1)}.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A averages 10.8 per piece.',
      title: 'Average Atomic Mass',
      body: 'You just worked out the average atomic mass: each isotope\'s mass counted in proportion to how much of it there is. Because the two amounts are not equal, that is called a weighted average rather than a plain one. It is the mass listed for every element, and it is why those numbers are almost never whole.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Only One Bin',
    prompt: 'Say why Sample A\'s listed mass of 19.0 is a whole number when the last two were not.',
    controls: ['pour'],
    hoppers: [
      { id: 'h4', label: 'SAMPLE A', note: '40 pieces', bins: [{ mass: 19, n: 40 }] }
    ],
    reference: ['CAT 09 — listed mass 19.0'],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'one', label: 'Every piece weighs the same, so there is nothing to average', note: 'One weight in, one weight out.' },
        { id: 'round', label: 'Somebody rounded the number off', note: 'The real figure has decimals.' },
        { id: 'fault', label: 'The deflector failed to split them', note: 'A split is being missed.' }
      ]
    },
    hints: [
      'Tip it and count how many bins caught anything at all.',
      'All 40 pieces landed in the bin marked 19, so every piece weighs exactly the same.',
      'The weighted average of 19 and 19 and 19 is 19, so this element has only one isotope.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the three answers.' };
      }
      if (state.choice === 'round') {
        return { ok: false, msg: 'All 40 pieces weigh 19, so the average is exactly 19 and no decimal ever turns up.' };
      }
      if (state.choice === 'fault') {
        return { ok: false, msg: 'The deflector split the earlier samples into two bins, so it is working fine.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A: one weight only, 19.0 confirmed.',
      title: 'Why Some Masses Are Whole',
      body: 'A few elements occur as only one isotope, so there is nothing to weight and the listed mass comes out whole. That means the decimal on a listed mass is information, not untidiness. It tells you the element turns up as a mixture of isotopes, and roughly where in that mixture the weight sits.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Weighed Without Opening It',
    prompt: 'Sample A is sealed. Work out how many of its pieces in every hundred weigh 20 rather than 22.',
    controls: ['balance'],
    hoppers: [
      { id: 'h5', label: 'SAMPLE A', note: 'sealed, 40 pieces, bins cut for weights 20 and 22', bins: [{ mass: 20, n: 36 }, { mass: 22, n: 4 }] }
    ],
    reference: ['CAT 10 — listed mass 20.2'],
    widget: { type: 'number', min: 0, max: 100, step: 5, label: 'Weight 20, per hundred pieces' },
    hints: [
      'Press "Weigh Sample" on Sample A and divide what it reads by the number of pieces.',
      '808 over 40 pieces is 20.2 each, and the two weights are 20 and 22, so 20.2 is one tenth of the way from 20 up to 22.',
      'Try one tenth heavy: (0.9 x 20) + (0.1 x 22) = 18 + 2.2 = 20.2, so 90 pieces in every hundred weigh 20.'
    ],
    check(state) {
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the share you worked out.' };
      }
      if (state.number === 50) {
        return { ok: false, msg: 'An even split would weigh 21 a piece, and 808 over 40 pieces is 20.2.' };
      }
      if (state.number === 10) {
        return { ok: false, msg: 'That is the share of the heavy pieces, and the question asks about the light ones.' };
      }
      if (state.number !== 90) {
        return { ok: false, msg: '20.2 is one tenth of the way from 20 to 22, so one tenth of the pieces are the heavy ones.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A averages 20.2: 90 pieces light, 10 heavy.',
      title: 'The Average Pins the Mix',
      body: 'The weighting runs both ways: the abundances give you the average, and the average plus the two weights gives you the abundances. That is how a sealed sample is identified without being opened. It is also how the isotope proportions of the elements were first measured.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Name Three Samples',
    prompt: 'Match each sample to the element whose listed mass it fits.',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'ha', label: 'SAMPLE A', note: 'unlabelled, 40 pieces', bins: [{ mass: 20, n: 36 }, { mass: 22, n: 4 }] },
      { id: 'hb', label: 'SAMPLE B', note: 'unlabelled, 40 pieces', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] },
      { id: 'hc', label: 'SAMPLE C', note: 'unlabelled, 40 pieces', bins: [{ mass: 10, n: 8 }, { mass: 11, n: 32 }] }
    ],
    reference: ['CAT 05 — listed mass 10.8', 'CAT 10 — listed mass 20.2', 'CAT 17 — listed mass 35.5'],
    widget: {
      type: 'bins',
      rows: ['ha', 'hb', 'hc'],
      bins: [
        { id: 'c05', label: 'CAT 05', note: 'Listed mass 10.8.' },
        { id: 'c10', label: 'CAT 10', note: 'Listed mass 20.2.' },
        { id: 'c17', label: 'CAT 17', note: 'Listed mass 35.5.' }
      ]
    },
    hints: [
      'Weigh each sample and divide what the balance reads by the number of pieces.',
      'A weight per piece is what a listed mass on the plate is too, so the two can be compared directly.',
      '808 / 40 = 20.2, 1420 / 40 = 35.5, 432 / 40 = 10.8.'
    ],
    check(state) {
      const want = { ha: 'c10', hb: 'c17', hc: 'c05' };
      const labels = { ha: 'Sample A', hb: 'Sample B', hc: 'Sample C' };
      const listed = { ha: '20.2', hb: '35.5', hc: '10.8' };
      for (const id of ['ha', 'hb', 'hc']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      for (const id of ['ha', 'hb', 'hc']) {
        if (state.bins[id] !== want[id]) {
          return { ok: false, msg: `${labels[id]} is wrong: one piece of it weighs ${listed[id]} on average, and only one listed mass matches that.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'All three samples named off their weights.',
      title: 'The Mass Names the Element',
      body: 'Every element has its own isotopes in its own proportions, so its average weight is as good as a name. No two listed masses are the same. Weighing a heap and dividing by the number of pieces named all three samples without opening any of them.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Three Claims',
    prompt: 'Say which of the three samples really are natural CAT 17.',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'j1', label: 'SAMPLE A', note: 'sold as natural CAT 17', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] },
      { id: 'j2', label: 'SAMPLE B', note: 'sold as natural CAT 17', bins: [{ mass: 35, n: 20 }, { mass: 37, n: 20 }] },
      { id: 'j3', label: 'SAMPLE C', note: 'sold as natural CAT 17', bins: [{ mass: 35, n: 38 }, { mass: 37, n: 2 }] }
    ],
    reference: ['CAT 17 — listed mass 35.5'],
    widget: {
      type: 'bins',
      rows: ['j1', 'j2', 'j3'],
      bins: [
        { id: 'natural', label: 'Natural CAT 17', note: 'Its weight matches the listed mass.' },
        { id: 'altered', label: 'Not natural', note: 'Its mix of isotopes has been changed.' }
      ]
    },
    hints: [
      'Weigh all three: every one is CAT 17, so the code will not tell them apart.',
      'Natural CAT 17 is 75 pieces at weight 35 for every 25 at weight 37, which averages 35.5.',
      '1420 / 40 = 35.5, 1440 / 40 = 36.0, 1404 / 40 = 35.1, so only Sample A is natural.'
    ],
    check(state) {
      const want = { j1: 'natural', j2: 'altered', j3: 'altered' };
      const labels = { j1: 'Sample A', j2: 'Sample B', j3: 'Sample C' };
      for (const id of ['j1', 'j2', 'j3']) {
        if (!state.bins[id]) {
          return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
        }
      }
      if (state.bins.j1 !== want.j1) {
        return { ok: false, msg: 'Sample A holds 30 light to 10 heavy, which weighs 35.5 a piece — exactly the listed mass.' };
      }
      if (state.bins.j2 !== want.j2) {
        return { ok: false, msg: 'Sample B holds 20 light to 20 heavy, which weighs 36.0 a piece, not 35.5.' };
      }
      if (state.bins.j3 !== want.j3) {
        return { ok: false, msg: 'Sample C holds 38 light to 2 heavy, which weighs 35.1 a piece, not 35.5.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One sample natural, two altered.',
      title: 'The Mass Is a Fingerprint of the Mix',
      body: 'All three samples were CAT 17, and only one of them had the natural mix. A listed mass says more than which element you have: it says what proportions that element\'s isotopes turn up in. Change the mix and the weight moves off the listed figure.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   Three short cards: what the player found, what the number means, and
   what the next world is about.
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'A real sample of an element is a mixture of isotopes, and the proportions are fixed for that element. The mass listed for it is what one atom weighs on average across that mixture.'
    },
    {
      heading: 'Why It Has a Decimal',
      body: 'A single atom always has a whole-number mass, but an average over a mixture usually does not. The average leans toward the most common isotope, so the decimal tells you how the mix sits.'
    },
    {
      heading: 'Next',
      body: 'Everything on Tallow was one kind of atom at a time. The next world is about what happens when two kinds join together.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Chlorine is listed at 35.5, but no chlorine atom weighs 35.5. Why?',
    options: [
      { id: 'a', label: 'The measurement is not precise enough' },
      { id: 'b', label: 'It is the average over chlorine\'s natural mix of isotopes' },
      { id: 'c', label: 'Chlorine atoms lose mass when weighed' },
      { id: 'd', label: 'It is the mass of a chlorine molecule, not an atom' }
    ],
    answer: 'b',
    explanation: 'Natural chlorine is about 75% chlorine-35 and 25% chlorine-37. Averaging 35 and 37 in those amounts gives 35.5, so the number describes the mixture, not one atom.'
  },
  {
    question: 'An element has two isotopes: mass 10 at 20% and mass 11 at 80%. What is its average atomic mass?',
    options: [
      { id: 'a', label: '10.2' },
      { id: 'b', label: '10.5' },
      { id: 'c', label: '10.8' },
      { id: 'd', label: '11.0' }
    ],
    answer: 'c',
    explanation: 'Multiply each mass by its share and add: (0.20 x 10) + (0.80 x 11) = 2 + 8.8 = 10.8. It sits near 11 because mass 11 is the common one.'
  },
  {
    question: 'An element\'s average atomic mass is listed as exactly 19.0. What does that most likely mean?',
    options: [
      { id: 'a', label: 'It occurs as only one isotope' },
      { id: 'b', label: 'It has no neutrons' },
      { id: 'c', label: 'The number has been rounded off' },
      { id: 'd', label: 'Its isotopes are present in equal amounts' }
    ],
    answer: 'a',
    explanation: 'A single atom always has a whole-number mass, so a whole-number average means there is nothing to average. Fluorine is essentially all fluorine-19.'
  },
  {
    question: 'Copper has isotopes of mass 63 and 65, and its average atomic mass is 63.5. Which isotope is more common?',
    options: [
      { id: 'a', label: 'Copper-65, because it is heavier' },
      { id: 'b', label: 'Copper-63, because the average sits closer to 63' },
      { id: 'c', label: 'They are equally common' },
      { id: 'd', label: 'You cannot tell from the average' }
    ],
    answer: 'b',
    explanation: 'The average always leans toward the more common isotope. 63.5 is a quarter of the way from 63 to 65, so about three quarters of copper is copper-63.'
  },
  {
    question: 'Two samples are both pure chlorine, but one weighs 35.5 per atom and the other 36.0. What is true of the second one?',
    options: [
      { id: 'a', label: 'It contains a different element' },
      { id: 'b', label: 'Its atoms each carry extra electrons' },
      { id: 'c', label: 'Its mix of isotopes has been changed from the natural one' },
      { id: 'd', label: 'It was weighed wrong' }
    ],
    answer: 'c',
    explanation: 'Both are chlorine, so both have 17 protons. Natural chlorine is 75% mass 35 and 25% mass 37, which averages 35.5, so 36.0 means the sample holds extra chlorine-37.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return {
    number: stage.widget.type === 'number' ? stage.widget.min : null,
    decimal: stage.widget.type === 'decimal' ? stage.widget.min : null,
    choice: null,
    bins: {},
    sample: null,
    bin: null,
    poured: new Set(),
    weighed: new Set(),
    coded: new Set()
  };
}

/** The floor state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { poured: new Set(['h1']), coded: new Set(['h1:0', 'h1:1']), choice: 'weights' },
  { poured: new Set(['h1', 'h2']), number: 75 },
  { poured: new Set(['h1']), choice: 'light' },
  { poured: new Set(['h3']), decimal: 10.8 },
  { poured: new Set(['h4']), choice: 'one' },
  { weighed: new Set(['h5']), number: 90 },
  { weighed: new Set(['ha', 'hb', 'hc']), bins: { ha: 'c10', hb: 'c17', hc: 'c05' } },
  { weighed: new Set(['j1', 'j2', 'j3']), bins: { j1: 'natural', j2: 'altered', j3: 'altered' } }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { poured: new Set(['h1']), coded: new Set(['h1:0', 'h1:1']), choice: 'mixed' },
  { poured: new Set(['h1', 'h2']), number: 25 },
  { poured: new Set(['h1']), choice: 'half' },
  { poured: new Set(['h3']), decimal: 10.5 },
  { poured: new Set(['h4']), choice: 'round' },
  { weighed: new Set(['h5']), number: 10 },
  { weighed: new Set(['ha', 'hb', 'hc']), bins: { ha: 'c05', hb: 'c17', hc: 'c10' } },
  { weighed: new Set(['j1', 'j2', 'j3']), bins: { j1: 'natural', j2: 'natural', j3: 'altered' } }
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
    if (stage.controls.includes('code')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="code">Read Code</button>');
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

    if (tool === 'code') {
      if (state.bin === null) {
        frame.note('Tap one of the bins first, then read it.');
        return;
      }
      if (!floor.poured(id)) {
        frame.note('That sample has not been tipped, so its bins are empty.');
        return;
      }
      soundscape.playScanSweep?.();
      if (!hopper.code) {
        // The floor never invents a reading. A hopper whose code plate is gone
        // gets an honest refusal, not a plausible code.
        renderReadout(null, {
          head: `Code // ${hopper.label}, bin ${state.bin + 1}`,
          body: 'No code comes back from this sample. You will have to work out what it is from what it weighs.'
        });
        return;
      }
      state.coded.add(`${id}:${state.bin}`);
      renderReadout(null, {
        head: `Code // ${hopper.label}, bin ${state.bin + 1}`,
        body: `Every piece in that bin reads ${hopper.code}, and each one weighs ${hopper.bins[state.bin].mass}.`
      });
      return;
    }

    if (tool === 'balance') {
      // A BALANCE WEIGHS. IT DOES NOT DIVIDE.
      //
      // It used to report the total, the count, the division and the answer,
      // which handed the player every stage from six on: press the key, read
      // 20.2 off the readout, find 20.2 on the reference plate, commit. The one
      // piece of arithmetic this whole bench exists to teach was being done for
      // them by the instrument. So it reports the two figures it actually
      // measures and stops there.
      const count = hopper.bins.reduce((n, b) => n + b.n, 0);
      const mass = hopper.bins.reduce((m, b) => m + b.mass * b.n, 0);
      state.weighed.add(id);
      soundscape.playScanSweep?.();
      renderReadout(null, {
        head: `Balance // ${hopper.label}`,
        body: `${mass} in total, over ${count} pieces.`
      });
      return;
    }

    if (tool === 'pour') {
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
        body: `${shot.total} pieces landed: ${shot.totals.map((n, i) => `${n} at weight ${hopper.bins[i].mass}`).join(', ')}.`
      });
      busy = false;
      frame.setCommitEnabled(true);
    }
  }

  /* ---------------- floor queries ---------------- */

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
          <div class="lq-readout-head">Bench // standby</div>
          <p class="lq-readout-line">Each bin catches one weight, marked under it.</p>
        </div>
      `);
      return;
    }
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">Bin // ${esc(hit.hopperLabel)}, bin ${hit.bin + 1}</div>
        <div class="lq-readout-code">CATCHES WEIGHT ${esc(String(hit.mass))}</div>
        <div class="lq-readout-hold">${hit.poured
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

    if (w.type === 'number' || w.type === 'decimal') {
      const dec = w.type === 'decimal';
      const shown = dec ? state.decimal.toFixed(1) : String(state.number);
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-number">
            <button type="button" class="btn-secondary quest-btn-sm" data-num="-1" aria-label="Lower">&minus;</button>
            <span class="lq-number-value" aria-live="polite">${shown}</span>
            <button type="button" class="btn-secondary quest-btn-sm" data-num="1" aria-label="Raise">+</button>
          </div>
          <p class="form-help">Steps of ${dec ? w.step.toFixed(1) : w.step}, between ${dec ? w.min.toFixed(1) : w.min} and ${dec ? w.max.toFixed(1) : w.max}.</p>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-num]').forEach(btn => {
        btn.addEventListener('click', () => {
          const delta = Number(btn.dataset.num) * (w.step || 1);
          if (dec) {
            state.decimal = Math.round(Math.max(w.min, Math.min(w.max, state.decimal + delta)) * 10) / 10;
            frame.el.widget.querySelector('.lq-number-value').textContent = state.decimal.toFixed(1);
          } else {
            state.number = Math.max(w.min, Math.min(w.max, state.number + delta));
            frame.el.widget.querySelector('.lq-number-value').textContent = String(state.number);
          }
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
      return;
    }

    if (w.type === 'bins') {
      const rows = w.rows || stage.hoppers.map(h => h.id);
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">Your answer</span>
          <div class="lq-bins">
            ${rows.map(id => `
              <div class="lq-bin-row" data-hopper="${id}">
                <span class="lq-bin-sample">${esc(hopperFor(id)?.label || id)}</span>
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
          const row = btn.closest('[data-hopper]');
          const hid = row.dataset.hopper;
          state.bins[hid] = btn.dataset.bin;
          row.querySelectorAll('[data-bin]').forEach(o => o.classList.toggle('selected', o === btn));
          const bin = w.bins.find(b => b.id === btn.dataset.bin);
          floor.setPlateTag(hid, bin ? bin.label : '');
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
