/**
 * The second game on the Learn road. Eight stages on the core bench, introducing
 * the nucleus, protons, neutrons, electrons, electron shells, valence electrons,
 * isotopes, and ions immediately after each stage as the reward card payoff.
 *
 * THE ORDER IS THE WHOLE DESIGN. Every stage is a thing the player does with an
 * instrument, and the concept arrives immediately afterwards as a reward card,
 * connecting the player's hands-on observation to the real chemistry:
 *
 *   1  fire a beam through matter                -> The Nucleus · Mostly Empty Space
 *   2  count the marked grains in the core       -> Protons & Neutrons
 *   3  find the balance rule, apply it to a seal -> Electrons & Electrical Neutrality
 *   4  load electrons onto rings                 -> Electron Shells & The Bohr Model
 *   5  predict trading from the outer ring       -> Valence Electrons & Reactivity
 *   6  tell apart two specimens of equal mass    -> Atomic Number & Isotopes
 *   7  strip electrons to reach plus two         -> Ions & Net Charge
 *   8  classify unknown canisters                -> The Subatomic Architecture of Matter
 *   -- debrief: subatomic model summary & preview of the periodic table.
 *
 * VOCABULARY IS EARNED, THEN USED. A word is withheld until the player has
 * found the thing it names, and from the stage AFTER its reward card it is used
 * in play like any other word — the prompt for stage four asks about electrons,
 * because stage three is where the player worked out that they are there. The
 * schedule is `VOCABULARY` below, and `verify:learn` enforces it per stage:
 * naming a term one stage early fails the build, and so does never naming it.
 * Saying "light piece" for eight stages after the player has met the electron is
 * the instrument being coy, and it is what made stage three unreadable.
 *
 * WHAT THIS QUEST DOES NOT SAY. The core bench does not talk to the sampler
 * scope's catalogue, and Vess says so out loud in stage one. The player will
 * finish this site holding a proton count for a dozen specimens and no idea that
 * the scope has been filing by exactly that number since site one. That reveal
 * belongs to `q3-catalogue`, and handing it over early would spend the best
 * moment on this world for nothing.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings. It
 * reports through `ctx` and nothing else.
 */

import { CoreBench } from '../../engine/instruments.js';
import { LearnFrame, toolNotes } from '../../engine/frame.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned.
 *
 * `introducedAt` is the stage whose REWARD CARD first names the term. That card
 * may use it; play copy — titles, prompts, briefings, hints, widget labels and
 * refusal messages — may use it from the NEXT stage on. A term that is in the
 * quest's withheld list and absent from this table is never allowed before the
 * debrief. `verify:learn` reads this table; nothing here is player-facing.
 */
export const VOCABULARY = [
  { term: /\bnucle(us|i|ar)\b/i, introducedAt: 1 },
  { term: /\bprotons?\b/i, introducedAt: 2 },
  { term: /\bneutrons?\b/i, introducedAt: 2 },
  { term: /\belectrons?\b/i, introducedAt: 2 },
  { term: /\bshells?\b/i, introducedAt: 4 },
  { term: /\bvalence\b/i, introducedAt: 5 },
  { term: /\bisotopes?\b/i, introducedAt: 6 },
  { term: /\bions?\b/i, introducedAt: 7 }
];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE KEY LEGEND

   Every control on the plate says what it does, in one short sentence, for as
   long as it is on the plate. A line can change once a word has been earned:
   the needle says "light pieces" until the stage after electrons are named,
   and "electrons" from then on.

   `verify:learn` fails the build over a control with no line, and runs every
   line through the same vocabulary gate as a prompt or a hint.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  field: [{
    from: 1,
    key: 'Whole piece / The middle / Outside',
    what: 'Three ways of looking at the same atom: all of it, a close-up of the heavy center, or a pull-back showing the light pieces around it.'
  }, {
    from: 3,
    key: 'Whole piece / The middle / Outside',
    what: 'Three ways of looking at the same atom: all of it, a close-up of the nucleus, or a pull-back showing the electrons on their rings.'
  }],
  beam: [{
    from: 1,
    key: 'Fire Beam',
    what: 'Fires 40 tiny shots at the selected atom and counts what happened to each one.'
  }],
  meter: [{
    from: 1,
    key: 'Read Needle',
    what: 'Weighs the charge of the selected atom. It sits on zero when the two sides cancel.'
  }, {
    from: 3,
    key: 'Read Needle',
    what: 'Weighs the charge of the selected atom: protons push the needle up, electrons push it down.'
  }],
  tester: [{
    from: 1,
    key: 'Run Tester',
    what: 'Pushes another atom at the selected one and reports what it does. Each sample can only be tested once.'
  }],
  strip: [{
    from: 1,
    key: 'Fire Stripper',
    what: 'Knocks one electron off the outermost ring. The nucleus is not touched.'
  }],
  reset: [{
    from: 1,
    key: 'Reset Sample',
    what: 'Puts back every electron the stripper has taken off.'
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

/* ------------------------------------------------------------------
   THE PARTS
   Three sorts of thing the bench can put a needle on. The codes are the
   instrument's own, the readings are real, and none of them is named.
   ------------------------------------------------------------------ */
export const PARTS = {
  marked: {
    code: 'GRAIN // CROSSED', mass: 1.0, charge: 1,
    note: 'Heavy, and it pushes the needle up every time.'
  },
  blank: {
    code: 'GRAIN // BLANK', mass: 1.0, charge: 0,
    note: 'Same size and weight as a crossed grain, but the needle does not move for it at all.'
  },
  light: {
    code: 'OUTER // LIGHT', mass: 0.0005, charge: -1,
    note: 'Almost weightless, and it pushes the needle the opposite way to a crossed grain.'
  },
  core: {
    code: 'CORE // WHOLE', mass: null, charge: null,
    note: 'The whole center at once, packed too tight to separate from here.'
  },
  whole: {
    code: 'SPECIMEN // WHOLE', mass: null, charge: null,
    note: 'The whole atom, edge to edge. Almost all of that width is empty.'
  }
};

/* ------------------------------------------------------------------
   SPECIMENS
   A specimen is a single piece off the salvage, declared as what is in its
   middle and how many light pieces it keeps on each ring outward. Every
   specimen on this bench is internally honest: unless a stage has taken
   something off it, its light pieces balance its marked grains exactly.
   ------------------------------------------------------------------ */

/** How many light pieces a specimen is carrying, over all its rings. */
export function lightCount(spec) {
  return (spec.rings || []).reduce((n, r) => n + r, 0);
}

/** What the needle reads for a whole specimen: marked grains against light pieces. */
export function netCharge(spec) {
  return (spec.core.marked || 0) - lightCount(spec);
}

/** How many pieces are packed into a core, both sorts together. */
export function coreTotal(spec) {
  return (spec.core.marked || 0) + (spec.core.blank || 0);
}

/**
 * What a specimen does when the tester pushes a partner at it. This is the one
 * piece of chemistry the bench itself is not allowed to know, so it lives here:
 * a ring with one spare gives that spare away, a ring one short of full takes
 * one on, and a ring with no room and nothing spare does neither.
 *
 * It is the tester's model and it is only ever run against the four specimens on
 * stage five, which were picked because they are the clean cases. A ring sitting
 * half full is neither, and nothing on this bench asks it about one.
 */
export function behaviourOf(spec) {
  const rings = spec.rings || [];
  if (!rings.length) return 'inert';
  const outer = rings[rings.length - 1];
  const room = rings.length === 1 ? 2 : 8;
  if (outer === room) return 'inert';
  if (outer <= 2) return 'gives';
  return 'takes';
}

const BEHAVIOUR_TEXT = {
  gives: 'It hands one electron over.',
  takes: 'It pulls one electron off the other atom and keeps it.',
  inert: 'Nothing happens. It will not trade either way.'
};

/* ------------------------------------------------------------------
   THE EIGHT STAGES

   One idea per stage, one thing to do, one thing to answer. Every `check` is
   a pure function of the bench state, so `npm run verify:learn` can run
   SOLUTIONS and MISSES below through them without a browser: a stage whose
   grading has drifted fails the build instead of stranding a student.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Fire Through It',
    field: 'whole',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench looks inside a single atom. It can fire a beam through one, magnify its middle, weigh its charge, and knock pieces off the outside.'
    },
    prompt: 'Fire the beam through Sample A, read what came back, and say what the inside of an atom is like.',
    controls: ['beam'],
    specimens: [
      { id: 'a', label: 'SAMPLE A', note: 'one atom, mounted', core: { marked: 6, blank: 6 }, rings: [2, 4] }
    ],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'solid', label: 'Solid all the way through', note: 'Packed dense, edge to edge.' },
        { id: 'hollow', label: 'A hard crust around a hollow', note: 'Empty inside, tough at the surface.' },
        { id: 'core', label: 'Mostly empty, with one tiny heavy lump in the middle', note: 'Almost all nothing, plus a dense center.' }
      ]
    },
    hints: [
      'Press "Fire Beam". Forty shots go in, and the readout says what happened to each one.',
      '37 of the 40 went straight through as if nothing were there. 2 were knocked aside and 1 bounced straight back.',
      'Solid matter would stop the whole beam. Only a tiny, very dense lump sitting in a lot of empty space lets 37 through and throws 1 back.'
    ],
    check(state) {
      if (!state.fired.has('a')) return { ok: false, notYet: true, msg: 'Press "Fire Beam" first.' };
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick one of the three answers.' };
      if (state.choice === 'solid') {
        return { ok: false, msg: 'Solid matter would have stopped the beam. 37 shots out of 40 went straight through.' };
      }
      if (state.choice === 'hollow') {
        return { ok: false, msg: 'A hard crust would have deflected shots at the edges. These passed clean through the edges, and one bounced off the dead center.' };
      }
      return { ok: true };
    },
    reward: {
      log: '37 through, 2 deflected, 1 straight back.',
      title: 'The Nucleus',
      body: 'An atom is almost entirely empty space. Nearly everything it weighs is packed into a tiny lump at its center called the nucleus, which is what the one rebound hit.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What Is In the Middle',
    field: 'core',
    prompt: 'Press the "The middle" key and count how many grains in Sample A\'s nucleus are stamped with a cross.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'a', label: 'SAMPLE A', note: 'one atom, mounted', core: { marked: 6, blank: 6 }, rings: [2, 4] }
    ],
    widget: { type: 'number', min: 0, max: 20, label: 'Crossed grains' },
    hints: [
      'Press "The middle". The nucleus is drawn flat, so no grain is hiding behind another one.',
      'Twelve grains are packed in there. Some carry a cross and some are blank — count only the crossed ones.',
      'Six of the twelve carry a cross. Set the counter to 6.'
    ],
    check(state) {
      if (state.number === 6) return { ok: true };
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'The counter is still on zero. Count the crosses and set it.' };
      }
      if (state.number === 12) {
        return { ok: false, msg: 'That is every grain, crossed and blank together. Count only the crossed ones.' };
      }
      return { ok: false, msg: 'Count again: twelve grains in the nucleus, and six of them carry a cross.' };
    },
    reward: {
      log: 'Sample A: 12 grains, 6 crossed.',
      title: 'Protons, Neutrons and Electrons',
      body: 'The crossed grains are protons, each with a charge of +1, and the blank ones are neutrons, with no charge at all. Much further out, so light they barely weigh anything, sit the electrons, each with a charge of -1.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'The Charge Balance',
    field: 'rings',
    prompt: 'Sample D is sealed, so you cannot see its electrons. Use the needle on all four samples to work out how many electrons Sample D has.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'r1', label: 'SAMPLE A', note: 'open to the instrument', core: { marked: 3, blank: 4 }, rings: [2, 1] },
      { id: 'r2', label: 'SAMPLE B', note: 'open to the instrument', core: { marked: 6, blank: 6 }, rings: [2, 4] },
      { id: 'r3', label: 'SAMPLE C', note: 'open to the instrument', core: { marked: 6, blank: 6 }, rings: [2, 2] },
      {
        id: 'b', label: 'SAMPLE D', note: 'sealed, electrons will not resolve',
        core: { marked: 8, blank: 8 }, rings: [2, 6], sealed: true
      }
    ],
    widget: { type: 'number', min: 0, max: 20, label: 'Electrons on Sample D' },
    hints: [
      'Press "Read Needle" on each sample, then press "Outside" and count the electrons on the three you can see.',
      'Sample C is the useful one — its needle is the only one that is not on zero. Count its protons and its electrons and compare them.',
      'The needle reads protons minus electrons. Sample C has 6 protons and 4 electrons and reads +2. Sample D reads 0 with 8 protons, so it has 8 electrons.'
    ],
    check(state) {
      if (!state.metered.has('b')) {
        return { ok: false, notYet: true, msg: 'Put the needle on Sample D first: select it and press "Read Needle".' };
      }
      if (!['r1', 'r2', 'r3'].some(id => state.metered.has(id))) {
        return { ok: false, notYet: true, msg: 'Read the needle on the open samples too. Sample D alone cannot tell you what the needle measures.' };
      }
      if (state.number === 8) return { ok: true };
      if (state.number === 0) {
        return { ok: false, msg: 'Zero is what the needle reads, not how many electrons are there. Samples A and B read zero too, and they have 3 and 6.' };
      }
      if (state.number === 16) {
        return { ok: false, msg: 'That is every grain in the nucleus. Only the protons push the needle.' };
      }
      return { ok: false, msg: 'Work from Sample C: 6 protons, 4 electrons, needle on +2. Sample D reads 0 with 8 protons.' };
    },
    reward: {
      log: 'Sample D carries 8 electrons.',
      title: 'Neutral Atoms Balance',
      body: 'The needle reads protons minus electrons. An atom sits on zero exactly when it has one electron for every proton, so on a neutral atom counting one side tells you the other.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Where the Electrons Sit',
    field: 'rings',
    prompt: 'Sample D has 11 protons and reads zero, so it has 11 electrons. Put all 11 on its rings, following the pattern the other three samples show.',
    controls: ['field'],
    specimens: [
      { id: 'r1', label: 'SAMPLE A', note: 'open to the instrument', core: { marked: 2, blank: 2 }, rings: [2] },
      { id: 'r2', label: 'SAMPLE B', note: 'open to the instrument', core: { marked: 10, blank: 10 }, rings: [2, 8] },
      { id: 'r3', label: 'SAMPLE C', note: 'open to the instrument', core: { marked: 13, blank: 14 }, rings: [2, 8, 3] },
      { id: 'u', label: 'SAMPLE D', note: '11 electrons, not yet placed', core: { marked: 11, blank: 12 }, rings: [] }
    ],
    target: 'u',
    widget: {
      type: 'rings',
      label: 'Sample D — where the electrons go',
      total: 11,
      rings: ['Ring 1 — closest in', 'Ring 2 — middle', 'Ring 3 — furthest out']
    },
    hints: [
      'Press "Outside" and count how many electrons Samples A, B and C keep on each ring. The + and - keys move Sample D\'s electrons.',
      'No sample here has more than 2 on ring 1 or more than 8 on ring 2, and none of them starts a new ring while a closer one still has room.',
      'Put 2 on Ring 1 and 8 on Ring 2. That is 10, so the last electron goes on Ring 3.'
    ],
    check(state) {
      const placed = state.rings.reduce((n, r) => n + r, 0);
      if (placed !== 11) {
        return { ok: false, notYet: true, msg: `${placed} of the 11 electrons are placed. Use the + keys to place the rest.` };
      }
      if (state.rings[0] > 2) {
        return { ok: false, msg: 'Too many on Ring 1. Every other sample here holds exactly 2 there.' };
      }
      if (state.rings[1] > 8) {
        return { ok: false, msg: 'Too many on Ring 2. Samples B and C both hold 8 there and no more.' };
      }
      if (state.rings[0] < 2 || (state.rings[2] > 0 && state.rings[1] < 8)) {
        return { ok: false, msg: 'Fill each ring before starting the next one: 2 on Ring 1, then 8 on Ring 2, then whatever is left.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample D loaded 2 / 8 / 1.',
      title: 'Electron Shells',
      body: 'Electrons sit in rings called shells, and each shell holds a fixed number: 2 in the first, 8 in the second. A shell fills up before the next one starts, which is why 11 electrons come out as 2, 8 and 1.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Outer Shell Decides',
    field: 'rings',
    prompt: 'The tester has only 2 charges left. Test two of the four samples, then work out the other two, and say whether each one gives an electron away, takes one on, or will not trade.',
    controls: ['field', 'tester'],
    specimens: [
      { id: 's1', label: 'SAMPLE A', note: 'open to the instrument', core: { marked: 3, blank: 4 }, rings: [2, 1] },
      { id: 's2', label: 'SAMPLE B', note: 'open to the instrument', core: { marked: 11, blank: 12 }, rings: [2, 8, 1] },
      { id: 's3', label: 'SAMPLE C', note: 'open to the instrument', core: { marked: 17, blank: 18 }, rings: [2, 8, 7] },
      { id: 's4', label: 'SAMPLE D', note: 'open to the instrument', core: { marked: 10, blank: 10 }, rings: [2, 8] }
    ],
    testerCharges: 2,
    widget: {
      type: 'bins',
      bins: [
        { id: 'gives', label: 'Gives one away', note: 'Hands an electron over.' },
        { id: 'takes', label: 'Takes one on', note: 'Pulls an electron off the other atom.' },
        { id: 'inert', label: 'Will not trade', note: 'Does nothing either way.' }
      ]
    },
    hints: [
      'Press "Outside" and count the electrons on the outermost shell of all four samples.',
      'A shell that holds 8 is full. Ask of each sample whether its outer shell has almost none, almost 8, or exactly 8.',
      'An outer shell with 1 gives it away (A and B). One with 7 is one short of full, so it takes one on (C). One already full at 8 does neither (D).'
    ],
    check(state) {
      if (state.tested.size < 1) {
        return { ok: false, notYet: true, msg: 'Run the tester on at least one sample before filing four answers.' };
      }
      const want = { s1: 'gives', s2: 'gives', s3: 'takes', s4: 'inert' };
      const labels = { s1: 'Sample A', s2: 'Sample B', s3: 'Sample C', s4: 'Sample D' };
      for (const id of ['s1', 's2', 's3', 's4']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      for (const id of ['s1', 's2', 's3', 's4']) {
        if (state.bins[id] !== want[id]) {
          return { ok: false, msg: `${labels[id]} is wrong. Count the electrons on its outer shell, then work out how much room that shell has left.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'All four predictions correct.',
      title: 'Valence Electrons',
      body: 'The electrons in the outermost shell are the valence electrons, and they decide how an atom reacts. One valence electron is given away, seven pulls one in to make eight, and a full shell of eight trades nothing at all.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Same Weight, Different Atom',
    field: 'core',
    prompt: 'Samples B and C weigh the same as each other. Decide which of them is the same kind of atom as Sample A.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'h', label: 'SAMPLE A', note: 'the one to match', core: { marked: 6, blank: 6 }, rings: [2, 4] },
      { id: 'k', label: 'SAMPLE B', note: '13 grains in the nucleus', core: { marked: 6, blank: 7 }, rings: [2, 4] },
      { id: 'l', label: 'SAMPLE C', note: '13 grains in the nucleus', core: { marked: 7, blank: 6 }, rings: [2, 5] }
    ],
    widget: {
      type: 'bins',
      rows: ['k', 'l'],
      bins: [
        { id: 'match', label: 'Same kind as Sample A', note: 'It behaves the same way.' },
        { id: 'other', label: 'A different kind', note: 'It behaves differently.' }
      ]
    },
    hints: [
      'Use "The middle" to count protons and neutrons on all three, then "Outside" to count their electrons.',
      'B and C both hold 13 grains, so the total will not separate them. Their proton counts are different, and so are their outer shells.',
      'Sample B has 6 protons and the same 2 and 4 outer arrangement as Sample A, so it behaves the same; its extra grain is just a neutron. Sample C has 7 protons and an outer shell of 5, so it behaves differently.'
    ],
    check(state) {
      if (!state.bins.k || !state.bins.l) {
        return { ok: false, notYet: true, msg: 'Both samples need an answer.' };
      }
      if (state.bins.k !== 'match') {
        return { ok: false, msg: 'Sample B has the same 6 protons as Sample A and the same electrons outside, so it behaves identically. Its 13th grain is a neutron, which adds weight and nothing else.' };
      }
      if (state.bins.l !== 'other') {
        return { ok: false, msg: 'Sample C has 7 protons, so it has 7 electrons arranged 2 and 5 — a different outer shell from Sample A, so it behaves differently.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B matches Sample A. Sample C does not.',
      title: 'Elements and Isotopes',
      body: 'What kind of atom you have depends only on the proton count, and that count is called the atomic number. Samples A and B are both carbon, 6 protons, but B carries an extra neutron, which makes it an isotope; Sample C has 7 protons, so it is nitrogen, a different element.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Take Electrons Off',
    field: 'rings',
    prompt: 'Sample A reads zero on the needle. Knock electrons off it until the needle reads +2, then log how many you took.',
    controls: ['field', 'meter', 'strip', 'reset'],
    specimens: [
      { id: 'm', label: 'SAMPLE A', note: 'mounted, open to the instrument', core: { marked: 11, blank: 12 }, rings: [2, 8, 1] }
    ],
    widget: { type: 'number', min: 0, max: 6, label: 'Electrons taken off' },
    hints: [
      'Press "Fire Stripper" to knock one electron off the outer shell, then "Read Needle" to see what it did.',
      'Every electron you take off leaves one proton with nothing to cancel it, so the needle climbs by 1 each time.',
      'Fire the stripper twice to reach +2, then set the counter to 2.'
    ],
    check(state) {
      const taken = state.stripped.m || 0;
      if (taken === 0) {
        return { ok: false, notYet: true, msg: 'Nothing has been taken off yet. Press "Fire Stripper".' };
      }
      if (taken !== 2) {
        return { ok: false, msg: `The needle reads +${taken}. Bring it to +2 — "Reset Sample" puts every electron back if you went too far.` };
      }
      if (state.number !== 2) {
        return { ok: false, msg: `You took 2 electrons off but logged ${state.number}. Set the counter to 2.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A brought to +2.',
      title: 'Ions',
      body: 'An atom that has gained or lost electrons is called an ion. Taking 2 electrons off left 2 protons with nothing to cancel them, so this is now a +2 ion — the same element, carrying a charge.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Tell Them Apart',
    field: 'core',
    prompt: 'The standard is 7 protons, 7 neutrons and a needle on zero. Say how each of the three samples differs from it.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'n1', label: 'SAMPLE A', note: 'unlabelled', core: { marked: 7, blank: 8 }, rings: [2, 5] },
      { id: 'n2', label: 'SAMPLE B', note: 'unlabelled', core: { marked: 7, blank: 7 }, rings: [2, 4] },
      { id: 'n3', label: 'SAMPLE C', note: 'unlabelled', core: { marked: 8, blank: 8 }, rings: [2, 6] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'heavy', label: 'Same element, extra neutron', note: 'An isotope of the standard.' },
        { id: 'charged', label: 'Same element, missing an electron', note: 'An ion of the standard.' },
        { id: 'other', label: 'A different element', note: 'The proton count does not match.' }
      ]
    },
    hints: [
      'Count the protons of all three first. Only a sample with exactly 7 can be the same element as the standard.',
      'Sample C has 8 protons, so it is out straight away. For A and B, count the neutrons too and read the needle on each.',
      'Sample A is 7 protons and 8 neutrons, needle on zero — an isotope. Sample B is 7 and 7 but reads +1 — an ion. Sample C is a different element.'
    ],
    check(state) {
      const want = { n1: 'heavy', n2: 'charged', n3: 'other' };
      const labels = { n1: 'Sample A', n2: 'Sample B', n3: 'Sample C' };
      for (const id of ['n1', 'n2', 'n3']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      if (state.bins.n1 !== want.n1) {
        return { ok: false, msg: 'Sample A has 7 protons and its needle reads zero, but it carries 8 neutrons — the same element, one neutron heavier.' };
      }
      if (state.bins.n2 !== want.n2) {
        return { ok: false, msg: 'Sample B has 7 protons and 7 neutrons like the standard, but only 6 electrons, which is why the needle reads +1.' };
      }
      if (state.bins.n3 !== want.n3) {
        return { ok: false, msg: 'Sample C has 8 protons against the standard\'s 7, so it is a different element.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'All three identified.',
      title: 'Three Ways to Differ',
      body: 'Change the neutrons and you get an isotope. Change the electrons and you get an ion. Change the protons and you get a different element altogether.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   Three short cards: what the player found, the model it adds up to, and
   what the next bench is about.
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'An atom is mostly empty space with a nucleus at the center. The nucleus holds protons and neutrons, and electrons sit outside it in shells.'
    },
    {
      heading: 'What Each One Does',
      body: 'Protons (+1) decide which element you have. Neutrons (0) only add weight. Electrons (-1) cancel the protons, and the ones in the outer shell decide how the atom reacts.'
    },
    {
      heading: 'Next',
      body: 'You have now counted protons for a dozen atoms. The next bench shows you what happens when you line every element up by that number.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   Five questions covering nucleus, protons, neutrons, electrons, shells,
   and ions. Appear after the debrief, before the player exits.
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'You fire 40 shots at an atom. 39 go straight through and 1 bounces back. What does that tell you?',
    options: [
      { id: 'a', label: 'The atom is solid all the way through' },
      { id: 'b', label: 'The atom is mostly empty space with a tiny dense nucleus' },
      { id: 'c', label: 'The atom is a hollow ball' },
      { id: 'd', label: 'The atom has nothing inside it' }
    ],
    answer: 'b',
    explanation: 'Almost everything passes through because the atom is mostly empty. The one rebound hit the tiny, very dense nucleus.'
  },
  {
    question: 'A nucleus holds 8 protons and 8 neutrons. Which element is it?',
    options: [
      { id: 'a', label: 'Carbon (6 protons)' },
      { id: 'b', label: 'Nitrogen (7 protons)' },
      { id: 'c', label: 'Oxygen (8 protons)' },
      { id: 'd', label: 'Neon (10 protons)' }
    ],
    answer: 'c',
    explanation: 'The proton count decides the element. 8 protons is oxygen, whatever the neutron count is.'
  },
  {
    question: 'An atom has 6 protons and 6 electrons. What is its charge?',
    options: [
      { id: 'a', label: '+6' },
      { id: 'b', label: '−6' },
      { id: 'c', label: '0 (electrically neutral)' },
      { id: 'd', label: '+12' }
    ],
    answer: 'c',
    explanation: 'Protons are +1 and electrons are −1, so equal numbers of them cancel out to zero.'
  },
  {
    question: 'Carbon has 6 electrons: 2 in the first shell and 4 in the second. How many valence electrons is that?',
    options: [
      { id: 'a', label: '2' },
      { id: 'b', label: '4' },
      { id: 'c', label: '6' },
      { id: 'd', label: '8' }
    ],
    answer: 'b',
    explanation: 'Valence electrons are the ones in the outermost shell, and carbon keeps 4 there.'
  },
  {
    question: 'You knock 2 electrons off a sodium atom that had 11 protons and 11 electrons. What have you made?',
    options: [
      { id: 'a', label: 'Na⁻ (charge −1)' },
      { id: 'b', label: 'Na⁺ (charge +1)' },
      { id: 'c', label: 'Na²⁺ (charge +2)' },
      { id: 'd', label: 'Na²⁻ (charge −2)' }
    ],
    answer: 'c',
    explanation: '11 protons and 9 electrons left, so the charge is +2. An atom that has lost electrons is an ion.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   Everything a stage's `check` is allowed to look at. One shape for all
   eight stages, so the widgets stay interchangeable.
   ------------------------------------------------------------------ */
function blankState(stage) {
  return {
    field: stage.field || 'whole',
    number: stage.widget.type === 'number' ? stage.widget.min : null,
    choice: null,
    rings: stage.widget.type === 'rings' ? stage.widget.rings.map(() => 0) : [],
    bins: {},
    sample: null,
    probed: new Set(),    // part sorts read on this stage
    fired: new Set(),     // specimens the beam has been through
    metered: new Set(),   // specimens the needle has been on
    tested: new Set(),    // specimens the tester has been run against
    stripped: {}          // specimenId -> light pieces taken off
  };
}

/** The bench state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { fired: new Set(['a']), choice: 'core' },
  { number: 6 },
  { number: 8, metered: new Set(['r3', 'b']) },
  { rings: [2, 8, 1] },
  { tested: new Set(['s1', 's3']), bins: { s1: 'gives', s2: 'gives', s3: 'takes', s4: 'inert' } },
  { bins: { k: 'match', l: 'other' } },
  { number: 2, stripped: { m: 2 } },
  { bins: { n1: 'heavy', n2: 'charged', n3: 'other' } }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { fired: new Set(['a']), choice: 'hollow' },
  { number: 12 },
  { number: 0, metered: new Set(['r3', 'b']) },
  { rings: [2, 8, 0] },
  { tested: new Set(['s1', 's3']), bins: { s1: 'gives', s2: 'takes', s3: 'takes', s4: 'inert' } },
  { bins: { k: 'other', l: 'other' } },
  { number: 1, stripped: { m: 1 } },
  { bins: { n1: 'heavy', n2: 'other', n3: 'other' } }
];

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return { ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

/**
 * WHAT THE THREE KEYS ARE CALLED, IN ENGLISH.
 *
 * They used to read Whole / Core / Rings, under a label reading "Field". Not
 * one of those four words means anything to a player who has never used a
 * bench, and all four arrived at once on stage one. These say what the key
 * does instead, and `TOOL_TEXT` below carries the sentence that explains them.
 */
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

  // A finished quest replays from the top and costs nothing, the way a cleared
  // campaign quest does. Otherwise pick up where the bench was left.
  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = null;
  let charges = 0;
  let busy = false;
  let disposed = false;

  /* ---------------- stage lifecycle ---------------- */

  function loadStage(i) {
    index = i;
    const stage = STAGES[i];

    state = blankState(stage);
    charges = stage.testerCharges || 0;

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
    // A stage that has a tool needing a target lets the player pick one; a
    // one-specimen stage picks it for them, so no tool ever sits there asking.
    const needsTarget = stage.controls.some(c => c === 'beam' || c === 'meter' || c === 'tester' || c === 'strip');
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
      if (result.notYet) {
        frame.note(result.msg);
      } else {
        frame.miss(result.msg);
      }
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
    if (stage.controls.includes('beam')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="beam">Fire Beam</button>');
    }
    if (stage.controls.includes('meter')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="meter">Read Needle</button>');
    }
    if (stage.controls.includes('tester')) {
      parts.push(`<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="tester">Run Tester <span class="cb-charges">${charges}</span></button>`);
    }
    if (stage.controls.includes('strip')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="strip">Fire Stripper</button>');
    }
    if (stage.controls.includes('reset')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="reset">Reset Sample</button>');
    }

    // The legend, under the keys: what each one of them actually does.
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
    const host = frame.el.controls;
    host.querySelectorAll('[data-field]').forEach(btn => {
      btn.classList.toggle('lit', btn.dataset.field === state.field);
    });
    const cell = host.querySelector('.cb-charges');
    if (cell) cell.textContent = String(charges);
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
    const spec = specFor(id);

    if (tool === 'meter') {
      const net = liveCharge(id);
      state.metered.add(id);
      soundscape.playScanSweep?.();
      renderReadout(null, {
        head: `Needle // ${labelFor(id)}`,
        body: net === 0
          ? 'The needle settles on zero and stays there.'
          : `The needle swings to ${net > 0 ? 'plus' : 'minus'} ${Math.abs(net)} and holds.`
      });
      return;
    }

    if (tool === 'tester') {
      if (charges <= 0) {
        frame.note('The tester is out of charges. Work the rest out from what you can see.');
        return;
      }
      if (state.tested.has(id)) {
        frame.note('That sample has already been tested. Try one you have not tested yet.');
        return;
      }
      charges--;
      state.tested.add(id);
      soundscape.playBondSnap?.();
      bench.setPlateTag(id, 'TESTED');
      paintControls();
      renderReadout(null, {
        head: `Tester // ${labelFor(id)}`,
        body: BEHAVIOUR_TEXT[behaviourOf(spec)]
      });
      return;
    }

    busy = true;
    frame.clearBanner();
    frame.setCommitEnabled(false);

    if (tool === 'beam') {
      const shot = await bench.fireBeam(id);
      state.fired.add(id);
      soundscape.playPylonWake?.();
      renderReadout(null, {
        head: `Beam // ${labelFor(id)}`,
        body: `${shot.shots} shots fired. ${shot.through} passed straight through, ${shot.wide} turned aside, ${shot.back} came back the way ${shot.back === 1 ? 'it' : 'they'} came.`
      });
    } else if (tool === 'strip') {
      const ring = await bench.strip(id);
      if (ring === null) {
        renderReadout(null, {
          head: `Stripper // ${labelFor(id)}`,
          body: 'There are no electrons left to take off.'
        });
      } else {
        state.stripped[id] = (state.stripped[id] || 0) + 1;
        soundscape.playBondSnap?.();
        renderReadout(null, {
          head: `Stripper // ${labelFor(id)}`,
          body: `One light piece knocked clear of ring ${ring + 1}. Put the needle back on it.`
        });
      }
    }

    busy = false;
    frame.setCommitEnabled(true);
  }

  /* ---------------- bench queries ---------------- */

  function specFor(id) {
    return STAGES[index].specimens.find(s => s.id === id) || null;
  }

  function labelFor(id) {
    return specFor(id)?.label || id;
  }

  /**
   * The needle reads the specimen as it is right now, stripped pieces included —
   * the bench owns the live ring counts, so ask it rather than the stage table.
   */
  function liveCharge(id) {
    const spec = specFor(id);
    if (!spec) return 0;
    return netCharge({ core: spec.core, rings: bench.ringsOf(id) });
  }

  /* ---------------- probe readout ---------------- */

  function onProbe(hit) {
    state.probed.add(hit.part);
    soundscape.playScanSweep?.();
    renderReadout(hit);
  }

  function onSelect(id) {
    state.sample = id;
    bench.setSelected(id);
    if (STAGES[index].widget.type === 'sample') renderWidget();
  }

  /**
   * The instrument card. It reports what it measured and no more: the number of
   * grains packed into a core, never how that number splits between the two
   * sorts. Counting the marks is the player's job, and it is the whole of
   * stages two, six and eight.
   */
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
              ? 'The center, magnified until the grains come apart. Click any grain to read it.'
              : 'Pulled back to the light pieces outside, drawn on the rings they sit on. Click any one to read it.'}</p>
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
        ${part.mass === null ? '' : meter('Mass', massBar(hit.part), massText(hit.part))}
        ${part.charge === null ? '' : chargeChip(part.charge)}
        ${hit.part === 'core' && spec
          ? `<div class="lq-readout-hold">Packed with ${coreTotal(spec)} grains in all.</div>`
          : ''}
        ${hit.part === 'marked' || hit.part === 'blank'
          ? `<div class="lq-readout-hold">This center holds ${coreTotal(spec)} grains in all.</div>`
          : ''}
        ${hit.part === 'light'
          ? `<div class="lq-readout-hold">On ring ${hit.ring + 1}, counting outward.</div>`
          : ''}
        <p class="lq-readout-line">${esc(part.note)}</p>
      </div>
    `);
  }

  /** Mass on a 0–10 scale against a marked grain, which is the bench's unit. */
  function massBar(partId) {
    return partId === 'light' ? 1 : 10;
  }

  function massText(partId) {
    return partId === 'light' ? 'under 0.001' : '1.000';
  }

  function meter(label, filled, value) {
    return `
      <div class="lq-meter">
        <span class="lq-meter-label">${label}</span>
        <span class="lq-meter-bar" aria-hidden="true">${
          Array.from({ length: 10 }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('')
        }</span>
        <span class="lq-meter-value">${value}</span>
      </div>
    `;
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
          <p class="form-help cb-remaining">${w.total} still to place. The + key adds one to that ring and the &minus; key takes one off.</p>
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
              ? 'All placed. Move them between rings until it matches the pattern, then commit.'
              : `${left} still to place. The + key on a row puts one on that ring, the \u2212 key takes one off.`;
          if (stage.target) bench.setRings(stage.target, state.rings);
          soundscape.playToggleClack?.();
        });
      });
      return;
    }

    if (w.type === 'bins') {
      const rows = w.rows || stage.specimens.map(s => s.id);
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">Manifest</span>
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
