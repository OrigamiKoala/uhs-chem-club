/**
 * q5-assay.js — Tallow, site five: THE WEIGHT ON THE CARD.
 *
 * The last bench on Tallow, worked on the Hopper Gantry where bulk salvage is
 * tipped over a deflector and sorted by weight. It answers a question the
 * catalogue vault left lying there and the ledger sharpened: a mass number is
 * always a whole number, and almost none of the masses printed on the catalogue
 * cards are.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  tip one kind and watch it split in two  -> A real sample is a mix of isotopes
 *   2  run two hoppers of the same stock       -> Abundance · the proportions are fixed
 *   3  place the card's figure against the bins-> The card is an average, and it leans
 *   4  do the weighting on a fresh hopper      -> Average Atomic Mass
 *   5  a hopper that lands in one bin          -> Why some cards ARE whole numbers
 *   6  a sealed hopper, weighed whole          -> The average pins the mix
 *   7  name three unmarked hoppers             -> A card identifies stock unopened
 *   8  three claims of the same stock          -> The card is a fingerprint of the mix
 *   -- debrief: what a catalogue card really quotes, and what comes after Tallow.
 *
 * WHAT THIS BENCH DOES NOT DO. It never counts a heap too large to count, and
 * it never converts a weight into a number of pieces. Counting by weighing —
 * the mole, molar mass and Avogadro's number — belongs to Ligar, and a unit
 * that has only just met the weighted average has no business being handed it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { AssayFloor } from '../../engine/assay.js';
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
   THE CATALOGUE EXTRACT
   The cards the player built the chart out of at site three, quoted
   here as the floor's own reference sheet. These are the listed masses
   and nothing on this bench is allowed to change one.
   ------------------------------------------------------------------ */
export const CARD_MASS = {
  'CAT 05': 10.8,
  'CAT 09': 19.0,
  'CAT 10': 20.2,
  'CAT 17': 35.5
};

/* ------------------------------------------------------------------
   THE KEY LEGEND
   Nothing on this floor is named without being explained. Every control
   a stage offers carries one plain sentence for as long as it is there.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  pour: [{
    from: 1,
    key: 'Tip Hopper',
    what: 'Empties the selected hopper down the chute. The deflector turns a light piece aside further than a heavy one, so every piece lands in the bin stencilled with its own weight, and the figure above each bin is how many landed in it.'
  }],
  code: [{
    from: 1,
    key: 'Read Catalogue Code',
    what: 'Puts the code reader on whichever bin you last tapped and reports the catalogue code of the pieces in it — the same code the sampler scope files a kind under.'
  }],
  balance: [{
    from: 6,
    key: 'Weigh Whole Hopper',
    what: 'Weighs a hopper without opening it and counts what is inside, then divides one by the other. It reports the average weight of one piece and says nothing about how the pieces differ.'
  }]
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

/** The average weight of one piece in a hopper, as the balance computes it. */
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
    title: 'Tip It Over The Deflector',
    briefing: {
      speaker: SPEAKER,
      body: 'The gantry sorts bulk salvage by weight and the buyer wants a certificate for every hopper on it. HOPPER 01 came off a single-source seam, so it should land in one bin.'
    },
    prompt: 'Tip HOPPER 01, read the catalogue code on every bin that catches anything, and file what the split means.',
    controls: ['pour', 'code'],
    hoppers: [
      { id: 'h1', label: 'HOPPER 01', code: 'CAT 17', note: 'single-source seam, sealed at the face', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] }
    ],
    reference: ['CAT 17 — listed mass 35.5'],
    widget: {
      type: 'choice',
      label: 'Certificate note',
      options: [
        { id: 'mixed', label: 'Two different kinds got into the crate', note: 'The seam was not single-source after all.' },
        { id: 'weights', label: 'One kind, whose pieces do not all weigh the same', note: 'Same material, two different weights.' },
        { id: 'fault', label: 'The deflector is out of true', note: 'The floor is splitting a heap that is really uniform.' }
      ]
    },
    hints: [
      'Click "Tip Hopper" first, then tap one of the bins on the floor and click "Read Catalogue Code". Do the same on the other bin.',
      'The two bins are stencilled 35 and 37, so the pieces in them really do weigh different amounts. What you need to know is whether they are different KINDS.',
      'Both bins read CAT 17. Two different kinds would read two different codes, and a deflector out of true would not sort a heap into two tidy weights — so it is one kind with two weights in it.'
    ],
    check(state) {
      if (!state.poured.has('h1')) {
        return { ok: false, notYet: true, msg: 'Nothing has been tipped yet. Click "Tip Hopper".' };
      }
      if (state.coded.size < 2) {
        return { ok: false, notYet: true, msg: 'Only one bin has been under the code reader. Read both before certifying a split.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'No note filed. Pick what the split means.' };
      }
      if (state.choice === 'mixed') {
        return { ok: false, msg: 'Two kinds would read two catalogue codes. Both bins came back CAT 17.' };
      }
      if (state.choice === 'fault') {
        return { ok: false, msg: 'A deflector out of true would smear one heap across the floor, not drop it into two clean bins at 35 and 37.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'HOPPER 01 certified: CAT 17, two weights, 30 and 10.',
      title: 'A Real Sample Is A Mix Of Isotopes',
      body: 'Both bins read CAT 17, so every piece has 17 protons and every piece is the same element — the 35s and the 37s differ only in neutrons, which makes them isotopes of one another. Salvage does not come sorted: a natural sample of an element is a mixture of its isotopes, and this is what that looks like on a floor.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Run It Twice',
    briefing: {
      speaker: SPEAKER,
      body: 'The surveyor says the split we certified was luck and wants it shown again on a different hopper off the same seam. HOPPER 02 is twice the size.'
    },
    prompt: 'Tip both hoppers and log what share of the pieces land in the lighter bin, out of every hundred.',
    controls: ['pour'],
    hoppers: [
      { id: 'h1', label: 'HOPPER 01', note: 'seam four, forty pieces', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] },
      { id: 'h2', label: 'HOPPER 02', note: 'seam four, eighty pieces', bins: [{ mass: 35, n: 60 }, { mass: 37, n: 20 }] }
    ],
    reference: ['CAT 17 — listed mass 35.5'],
    widget: { type: 'number', min: 0, max: 100, step: 5, label: 'Lighter bin, per hundred pieces' },
    hints: [
      'Select a hopper by tapping its plate, then click "Tip Hopper". Do the same for the other one. The figure above each bin is how many pieces landed in it.',
      'HOPPER 01 drops 30 pieces out of 40 into the 35 bin. HOPPER 02 drops 60 out of 80. Work out what each of those is out of a hundred.',
      '30 out of 40 is the same share as 60 out of 80, and both come to 75 out of every hundred. Set the counter to 75.'
    ],
    check(state) {
      if (state.poured.size < 2) {
        return { ok: false, notYet: true, msg: 'Both hoppers need tipping. One run on its own cannot show that a share holds.' };
      }
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'The counter is still on zero. Set the share you measured.' };
      }
      if (state.number === 30) {
        return { ok: false, msg: '30 is the count in HOPPER 01\'s lighter bin, not a share out of a hundred. That 30 is out of 40.' };
      }
      if (state.number === 25) {
        return { ok: false, msg: '25 per hundred is the HEAVIER bin\'s share. The question is the lighter one.' };
      }
      if (state.number === 50) {
        return { ok: false, msg: 'A 50 share would mean the two bins caught the same number, and the lighter bin caught three times as many.' };
      }
      if (state.number !== 75) {
        return { ok: false, msg: 'Work it from either hopper: 30 out of 40, or 60 out of 80. Both come to the same share out of a hundred.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Share confirmed at 75 per hundred across two hoppers.',
      title: 'Abundance · The Proportions Are Fixed',
      body: 'Two hoppers of different sizes gave the same split, because the proportions of an element\'s isotopes are a property of the material and not of the sample you happened to scoop. That share is called the isotope\'s abundance, and for this stock it is 75 percent of mass 35 and 25 percent of mass 37.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Where The Card Sits',
    briefing: {
      speaker: SPEAKER,
      body: 'The catalogue card for this stock has quoted 35.5 since site three, and nothing that came off that floor weighs 35.5. Tip the hopper again and put the card against what lands.'
    },
    prompt: 'Tip the hopper, then file where the card\'s 35.5 sits between the two bins and why.',
    controls: ['pour'],
    hoppers: [
      { id: 'h1', label: 'HOPPER 01', note: 'seam four, forty pieces', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] }
    ],
    reference: ['CAT 17 — listed mass 35.5'],
    widget: {
      type: 'choice',
      label: 'Certificate note',
      options: [
        { id: 'half', label: 'Halfway between them, because there are two weights', note: '35 and 37 give a middle of 36.' },
        { id: 'light', label: 'Nearer 35, because most of the pieces weigh 35', note: 'The common weight pulls it.' },
        { id: 'heavy', label: 'Nearer 37, because the heavy pieces count for more', note: 'Weight decides, not number.' },
        { id: 'wrong', label: 'Nowhere — the card is simply wrong', note: 'No piece weighs that, so the figure is bad.' }
      ]
    },
    hints: [
      'Read the two bin stencils and the two tallies above them, then read the card. 35, 37, and a card that says 35.5.',
      'Halfway between 35 and 37 is 36, and the card does not say 36. It sits much closer to one end than the other.',
      'Three quarters of the pieces weigh 35, so the card lands close to 35 — a quarter of the way along to 37, which is exactly 35.5.'
    ],
    check(state) {
      if (!state.poured.has('h1')) {
        return { ok: false, notYet: true, msg: 'Nothing has been tipped yet. The card has to be put against something.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'No note filed. Pick where the card\'s figure sits.' };
      }
      if (state.choice === 'half') {
        return { ok: false, msg: 'Halfway between 35 and 37 is 36, and the card says 35.5. The two bins did not catch equal numbers, so the middle is not where it lands.' };
      }
      if (state.choice === 'heavy') {
        return { ok: false, msg: '35.5 is below 36, so it is on the light side. The heavy bin caught a quarter of the pieces, not most of them.' };
      }
      if (state.choice === 'wrong') {
        return { ok: false, msg: 'Nothing weighs 35.5 and the card is still right, the same way nothing in a crate of 30 and 10 weighs the crate\'s own figure. It is not quoting one piece.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Card figure placed a quarter of the way from 35 to 37.',
      title: 'The Card Quotes An Average, And It Leans',
      body: 'A catalogue card does not quote any single piece — it quotes what one piece weighs on average across a natural sample. And the average leans toward whichever isotope is common: three quarters of this stock is mass 35, so the figure sits a quarter of the way along to 37, at 35.5.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Do The Weighting',
    briefing: {
      speaker: SPEAKER,
      body: 'HOPPER 03 is a different stock and its card has been lost. The buyer will accept a figure we work out ourselves if the floor backs it.'
    },
    prompt: 'Tip HOPPER 03, then work out and log what one piece of it weighs on average.',
    controls: ['pour'],
    hoppers: [
      { id: 'h3', label: 'HOPPER 03', note: 'unfiled stock, forty pieces', bins: [{ mass: 10, n: 8 }, { mass: 11, n: 32 }] }
    ],
    reference: ['CAT 05 — card lost'],
    widget: { type: 'decimal', min: 10.0, max: 11.0, step: 0.1, label: 'Average weight of one piece' },
    hints: [
      'Tip it and read both tallies. 8 pieces landed at weight 10 and 32 landed at weight 11, which is 40 in all.',
      'That is 8 out of 40 at weight 10 — a fifth of them — and 32 out of 40 at weight 11, which is four fifths. The heavier weight is much the more common, so the answer sits close to 11.',
      'Take a fifth of 10 and add four fifths of 11: 2 plus 8.8 comes to 10.8.'
    ],
    check(state) {
      if (!state.poured.has('h3')) {
        return { ok: false, notYet: true, msg: 'Nothing has been tipped yet. Click "Tip Hopper".' };
      }
      const v = state.decimal;
      if (v === 10.0) {
        return { ok: false, notYet: true, msg: 'The dial is still at the bottom of its travel. Work the figure out and set it.' };
      }
      if (v === 10.5) {
        return { ok: false, msg: '10.5 is the plain middle of 10 and 11, which would be right if the two bins had caught equal numbers. They caught 8 and 32.' };
      }
      if (Math.abs(v - 10.8) > 0.001) {
        return { ok: false, msg: `The floor caught 8 at weight 10 and 32 at weight 11. A fifth of the pieces at 10 and four fifths at 11 does not come to ${v.toFixed(1)}.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'HOPPER 03 assayed at 10.8 per piece.',
      title: 'Average Atomic Mass',
      body: 'What you just computed is the average atomic mass: each isotope\'s mass counted in proportion to how much of it there is, which is why it is called a weighted average rather than a plain one. It is the figure on every catalogue card, and it is why a card almost never reads a whole number.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Hopper That Lands In One Bin',
    briefing: {
      speaker: SPEAKER,
      body: 'HOPPER 04 carries a card that reads 19.0 exactly, and the surveyor is convinced somebody rounded it. Tip it and settle the argument.'
    },
    prompt: 'Tip HOPPER 04 and file why its card is a whole number when the last two were not.',
    controls: ['pour'],
    hoppers: [
      { id: 'h4', label: 'HOPPER 04', note: 'filed stock, forty pieces', bins: [{ mass: 19, n: 40 }] }
    ],
    reference: ['CAT 09 — listed mass 19.0'],
    widget: {
      type: 'choice',
      label: 'Certificate note',
      options: [
        { id: 'one', label: 'Every piece weighs the same, so there is nothing to average', note: 'One weight in, one weight out.' },
        { id: 'round', label: 'The card was rounded off at some point', note: 'The real figure has decimals.' },
        { id: 'fault', label: 'The deflector failed to separate them', note: 'A split is being missed.' }
      ]
    },
    hints: [
      'Tip it and look at the floor. Count how many bins caught anything at all.',
      'Everything landed in the bin stencilled 19, and forty out of forty pieces weigh 19. Work out the weighted average of a set where every member is the same.',
      'Averaging 19 against 19 against 19 gives 19, every time. The card is a whole number because this stock has only one isotope in it, not because anybody rounded.'
    ],
    check(state) {
      if (!state.poured.has('h4')) {
        return { ok: false, notYet: true, msg: 'Nothing has been tipped yet. Click "Tip Hopper".' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'No note filed. Pick the reason the card reads a whole number.' };
      }
      if (state.choice === 'round') {
        return { ok: false, msg: 'Nothing has been rounded. Every one of the forty pieces weighs 19, so the average across them is 19 and no decimal ever arises.' };
      }
      if (state.choice === 'fault') {
        return { ok: false, msg: 'The deflector split HOPPER 01 into two clean bins on the same floor a moment ago. There is nothing here for it to separate.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'HOPPER 04 certified: one weight, card confirmed at 19.0.',
      title: 'Why Some Cards Are Whole Numbers After All',
      body: 'A handful of elements occur as only one isotope, and their cards read a whole number because there is nothing to weight. So the decimal on a card is information rather than untidiness: it tells you the element turns up as a mixture, and roughly where in that mixture the weight sits.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Weighed Without Opening It',
    briefing: {
      speaker: SPEAKER,
      body: 'HOPPER 05 carries an intact Guild seal that cannot be broken before transfer, so nothing goes down the chute. The gantry balance will weigh it shut and count what is inside.'
    },
    prompt: 'Weigh HOPPER 05 whole, and work out what share of its pieces are the lighter of the two weights its bins are cut for.',
    controls: ['balance'],
    hoppers: [
      { id: 'h5', label: 'HOPPER 05', note: 'Guild seal intact, bins cut for 20 and 22', bins: [{ mass: 20, n: 36 }, { mass: 22, n: 4 }] }
    ],
    reference: ['CAT 10 — listed mass 20.2'],
    widget: { type: 'number', min: 0, max: 100, step: 5, label: 'Lighter weight, per hundred pieces' },
    hints: [
      'Click "Weigh Whole Hopper". It reports one figure: what a single piece weighs on average across everything in there.',
      'The balance says 20.2, and the bins under the chute are stencilled 20 and 22. The whole span from one to the other is 2, and 20.2 is only a tenth of the way along it.',
      'A tenth of the way from 20 to 22 means a tenth of the pieces are the heavy ones. So 90 out of every hundred are the lighter weight.'
    ],
    check(state) {
      if (!state.weighed.has('h5')) {
        return { ok: false, notYet: true, msg: 'The hopper has not been on the balance. Click "Weigh Whole Hopper".' };
      }
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'The counter is still on zero. Set the share you worked out.' };
      }
      if (state.number === 50) {
        return { ok: false, msg: 'An even split would put the average at 21, halfway between 20 and 22. The balance read 20.2, which is far nearer the light end.' };
      }
      if (state.number === 10) {
        return { ok: false, msg: '10 per hundred is the share of the HEAVY pieces. The question asks for the lighter weight, which is everything else.' };
      }
      if (state.number !== 90) {
        return { ok: false, msg: 'Measure 20.2 along the span from 20 to 22: it is a tenth of the way. The heavy pieces are that tenth, so the light ones are the rest.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'HOPPER 05 read at 20.2 per piece: 90 light, 10 heavy.',
      title: 'The Average Pins The Mix',
      body: 'The weighting runs both ways: given the abundances you can work out the average, and given the average and the two weights you can work out the abundances. That is how a sealed hopper gets certified without a seal being broken, and it is how the isotope proportions of an element were first measured.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Name Three Hoppers',
    briefing: {
      speaker: SPEAKER,
      body: 'Three hoppers came up from the lower yard with their code plates burned off and the buyer will not take unnamed stock. The catalogue extract is on the plate.'
    },
    prompt: 'Weigh or tip each hopper and file it against the catalogue card its stock matches.',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'ha', label: 'HOPPER A', note: 'lower yard, code plate burned off', bins: [{ mass: 20, n: 36 }, { mass: 22, n: 4 }] },
      { id: 'hb', label: 'HOPPER B', note: 'lower yard, code plate burned off', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] },
      { id: 'hc', label: 'HOPPER C', note: 'lower yard, code plate burned off', bins: [{ mass: 10, n: 8 }, { mass: 11, n: 32 }] }
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
      'Select a hopper and click "Weigh Whole Hopper". That gives you its average weight per piece in one reading, which is the figure a card quotes.',
      'Do it on all three and you have three figures to hold against the three cards on the extract. Tipping a hopper gives the same answer the long way round.',
      'HOPPER A weighs 20.2, HOPPER B weighs 35.5 and HOPPER C weighs 10.8. Each one matches exactly one card.'
    ],
    check(state) {
      if (state.weighed.size + state.poured.size < 3) {
        return { ok: false, notYet: true, msg: 'Every hopper needs a reading of its own before it can be named. Weigh or tip all three.' };
      }
      const want = { ha: 'c10', hb: 'c17', hc: 'c05' };
      const labels = { ha: 'HOPPER A', hb: 'HOPPER B', hc: 'HOPPER C' };
      const listed = { ha: '20.2', hb: '35.5', hc: '10.8' };
      for (const id of ['ha', 'hb', 'hc']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no card against it yet.` };
      }
      for (const id of ['ha', 'hb', 'hc']) {
        if (state.bins[id] !== want[id]) {
          return { ok: false, msg: `${labels[id]} is filed against the wrong card. One piece of it weighs ${listed[id]} on average, and only one card on the extract quotes that.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Three hoppers named off the extract.',
      title: 'A Card Names Stock Without Opening A Piece',
      body: 'Every element has its own isotopes in its own proportions, so the weighted average that comes out is as good as a name — no two cards on the extract quote the same figure. Weighing a heap and dividing by the count identified three unmarked hoppers without a single piece being opened.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Three Claims Of The Same Stock',
    briefing: {
      speaker: SPEAKER,
      body: 'Three sellers on this flat have all invoiced us for natural CAT 17 at the card price, and the card reads 35.5. One of them is telling the truth.'
    },
    prompt: 'Assay all three hoppers and file whether each one really is natural CAT 17 stock.',
    controls: ['pour', 'balance'],
    hoppers: [
      { id: 'j1', label: 'HOPPER J', note: 'invoiced as natural CAT 17', bins: [{ mass: 35, n: 30 }, { mass: 37, n: 10 }] },
      { id: 'j2', label: 'HOPPER K', note: 'invoiced as natural CAT 17', bins: [{ mass: 35, n: 20 }, { mass: 37, n: 20 }] },
      { id: 'j3', label: 'HOPPER L', note: 'invoiced as natural CAT 17', bins: [{ mass: 35, n: 38 }, { mass: 37, n: 2 }] }
    ],
    reference: ['CAT 17 — listed mass 35.5'],
    widget: {
      type: 'bins',
      rows: ['j1', 'j2', 'j3'],
      bins: [
        { id: 'natural', label: 'Natural stock, pay the invoice', note: 'The assay matches the card.' },
        { id: 'altered', label: 'Not natural, hold the invoice', note: 'The proportions have been meddled with.' }
      ]
    },
    hints: [
      'Weigh all three. Every one of them is CAT 17 — the bins are 35 and 37 in all three cases — so the codes will not separate them.',
      'The card says 35.5, and that figure comes out of a fixed set of proportions: 75 of the light for every 25 of the heavy. Compare what each hopper actually holds against that.',
      'HOPPER J is 30 and 10, which weighs 35.5 and matches. HOPPER K is 20 and 20, which weighs 36.0. HOPPER L is 38 and 2, which weighs 35.1. Only HOPPER J is natural stock.'
    ],
    check(state) {
      if (state.weighed.size + state.poured.size < 3) {
        return { ok: false, notYet: true, msg: 'All three hoppers need assaying before an invoice is settled.' };
      }
      const want = { j1: 'natural', j2: 'altered', j3: 'altered' };
      for (const id of ['j1', 'j2', 'j3']) {
        if (!state.bins[id]) {
          return { ok: false, notYet: true, msg: `${id === 'j1' ? 'HOPPER J' : id === 'j2' ? 'HOPPER K' : 'HOPPER L'} has no line on the invoice yet.` };
        }
      }
      if (state.bins.j1 !== want.j1) {
        return { ok: false, msg: 'HOPPER J is filed incorrectly. It holds 30 light to 10 heavy, which weighs 35.5 a piece — exactly what the card quotes.' };
      }
      if (state.bins.j2 !== want.j2) {
        return { ok: false, msg: 'HOPPER K is filed incorrectly. An even 20 and 20 weighs 36.0 a piece, and no natural CAT 17 does that.' };
      }
      if (state.bins.j3 !== want.j3) {
        return { ok: false, msg: 'HOPPER L is filed incorrectly. 38 light to 2 heavy weighs 35.1 a piece, well under the card, so the heavy pieces have been taken out of it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One invoice paid, two held. Gantry closed.',
      title: 'The Card Is A Fingerprint Of The Mix',
      body: 'Every one of those hoppers was CAT 17 and only one of them was natural CAT 17, because the card does not just say which element it is — it says what proportions that element occurs in. Change the mix and the assayed weight moves off the card, which is how altered stock is caught without a single piece being opened.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'VESS // TALLOW HOPPER GANTRY',
  sections: [
    {
      heading: 'Gantry Closed',
      body: 'Every hopper on this flat is assayed, two bad invoices are held and the buyer has signed the last of it. Tallow is finished, and there is nothing in this refinery you have not opened, counted or weighed yourself.'
    },
    {
      heading: 'What The Card Really Says',
      body: 'A catalogue card carries two numbers and they are different kinds of thing. The atomic number is a count and never moves; the mass is an average over a natural mixture of isotopes, weighted by how much of each there is, which is why it carries a decimal and why no single piece ever weighs it.'
    },
    {
      heading: 'Next: Ligar',
      body: 'Everything on this flat was one kind at a time, and almost nothing in the galaxy is. Ligar is a field of black stone arches that should have fallen a thousand years ago, and what holds them up is the thing you have not looked at yet: what happens when two kinds are joined.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Why is chlorine\'s atomic mass listed as 35.5 when no chlorine atom weighs 35.5?',
    options: [
      { id: 'a', label: 'The measurement is not precise enough' },
      { id: 'b', label: 'It is the weighted average over chlorine\'s natural mix of isotopes' },
      { id: 'c', label: 'Chlorine atoms lose mass when weighed' },
      { id: 'd', label: 'It is the mass of a chlorine molecule, not an atom' }
    ],
    answer: 'b',
    explanation: 'Natural chlorine is about 75% chlorine-35 and 25% chlorine-37. Averaging 35 and 37 in those proportions gives 35.5, so the listed value describes the mixture, not any single atom.'
  },
  {
    question: 'An element has two isotopes, mass 10 (20% abundance) and mass 11 (80%). What is its average atomic mass?',
    options: [
      { id: 'a', label: '10.2' },
      { id: 'b', label: '10.5' },
      { id: 'c', label: '10.8' },
      { id: 'd', label: '11.0' }
    ],
    answer: 'c',
    explanation: 'Weight each mass by its abundance: (0.20 x 10) + (0.80 x 11) = 2 + 8.8 = 10.8. It sits nearer 11 because mass 11 is the more abundant isotope.'
  },
  {
    question: 'An element\'s average atomic mass is listed as exactly 19.0. What does that most likely tell you?',
    options: [
      { id: 'a', label: 'It occurs as essentially one isotope' },
      { id: 'b', label: 'It has no neutrons' },
      { id: 'c', label: 'The value has been rounded from something else' },
      { id: 'd', label: 'Its isotopes are present in equal amounts' }
    ],
    answer: 'a',
    explanation: 'A mass number is always a whole number, so an average that is also a whole number means there is nothing to average — fluorine is essentially 100% fluorine-19.'
  },
  {
    question: 'Copper has isotopes of mass 63 and 65, and its average atomic mass is 63.5. Which isotope is more abundant?',
    options: [
      { id: 'a', label: 'Copper-65, because it is heavier' },
      { id: 'b', label: 'Copper-63, because the average sits closer to 63' },
      { id: 'c', label: 'They are equally abundant' },
      { id: 'd', label: 'There is no way to tell from the average' }
    ],
    answer: 'b',
    explanation: 'A weighted average always leans toward the more abundant isotope. 63.5 is a quarter of the way from 63 to 65, so copper-63 makes up about three quarters of natural copper.'
  },
  {
    question: 'Two samples are both pure chlorine, but one assays at 35.5 and the other at 36.0. What is true of the second sample?',
    options: [
      { id: 'a', label: 'It contains a different element' },
      { id: 'b', label: 'Its atoms each carry extra electrons' },
      { id: 'c', label: 'Its isotope proportions have been altered from the natural mix' },
      { id: 'd', label: 'It was weighed incorrectly' }
    ],
    answer: 'c',
    explanation: 'Both samples are chlorine — same protons — but natural chlorine has a fixed 75:25 isotope ratio giving 35.5. An assay of 36.0 means the sample has been enriched in chlorine-37, which is exactly how enriched material is detected.'
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
      commitLabel: stage.widget.type === 'bins' ? 'File Certificate' : 'Commit'
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
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="pour">Tip Hopper</button>');
    }
    if (stage.controls.includes('code')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="code">Read Catalogue Code</button>');
    }
    if (stage.controls.includes('balance')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="balance">Weigh Whole Hopper</button>');
    }
    if (stage.reference?.length) {
      parts.push(`
        <div class="assay-extract">
          <span class="form-label">Catalogue extract</span>
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
      frame.note('No hopper selected. Tap a hopper plate on the gantry first.');
      return;
    }
    const id = state.sample;
    const hopper = hopperFor(id);

    if (tool === 'code') {
      if (state.bin === null) {
        frame.note('The code reader needs a bin. Tap one of the bins on the floor, then read it.');
        return;
      }
      if (!floor.poured(id)) {
        frame.note('That hopper has not been tipped, so there is nothing in its bins to read.');
        return;
      }
      soundscape.playScanSweep?.();
      if (!hopper.code) {
        // The floor never invents a reading. A hopper whose code plate is gone
        // gets an honest refusal, not a plausible code.
        renderReadout(null, {
          head: `Code reader // ${hopper.label}, bin ${state.bin + 1}`,
          body: 'No code comes back off this stock. Whatever this hopper is, it will have to be worked out from what it weighs.'
        });
        return;
      }
      state.coded.add(`${id}:${state.bin}`);
      renderReadout(null, {
        head: `Code reader // ${hopper.label}, bin ${state.bin + 1}`,
        body: `Every piece in that bin reads ${hopper.code}. Each one weighs ${hopper.bins[state.bin].mass}.`
      });
      return;
    }

    if (tool === 'balance') {
      const count = hopper.bins.reduce((n, b) => n + b.n, 0);
      const mass = hopper.bins.reduce((m, b) => m + b.mass * b.n, 0);
      state.weighed.add(id);
      soundscape.playScanSweep?.();
      renderReadout(null, {
        head: `Balance // ${hopper.label}`,
        body: `${mass} in all, over ${count} pieces. That is ${averageOf(hopper).toFixed(1)} for one piece, averaged across everything in there.`
      });
      return;
    }

    if (tool === 'pour') {
      if (floor.poured(id)) {
        frame.note(`${hopper.label} has already gone down the chute. The tallies above its bins are still there.`);
        return;
      }
      busy = true;
      frame.clearBanner();
      frame.setCommitEnabled(false);
      const shot = await floor.pour(id);
      state.poured.add(id);
      soundscape.playPylonWake?.();
      renderReadout(null, {
        head: `Floor // ${hopper.label}`,
        body: `${shot.total} pieces down the chute. ${shot.totals.map((n, i) => `${n} at weight ${hopper.bins[i].mass}`).join(', ')}.`
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
          <div class="lq-readout-head">Gantry // standby</div>
          <p class="lq-readout-line">Each bin on the floor catches one weight, stencilled under it. Tap a bin to put the reader on it.</p>
        </div>
      `);
      return;
    }
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">Bin // ${esc(hit.hopperLabel)}, bin ${hit.bin + 1}</div>
        <div class="lq-readout-code">CUT FOR WEIGHT ${esc(String(hit.mass))}</div>
        <div class="lq-readout-hold">${hit.poured
          ? `${hit.count} piece${hit.count === 1 ? '' : 's'} landed in it.`
          : 'Empty. Nothing has been tipped into it yet.'}</div>
        <p class="lq-readout-line">The deflector turns a light piece aside further than a heavy one, so a bin only ever catches the weight it is cut for.</p>
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
          <span class="form-label">Certificate</span>
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
