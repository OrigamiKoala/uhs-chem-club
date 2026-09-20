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
import { LearnFrame } from '../../engine/frame.js';
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
  { term: /\b(atoms?|atomic)\b/i, introducedAt: 1 },
  { term: /\bnucle(us|i|ar)\b/i, introducedAt: 1 },
  { term: /\bprotons?\b/i, introducedAt: 2 },
  { term: /\bneutrons?\b/i, introducedAt: 2 },
  { term: /\belectrons?\b/i, introducedAt: 3 },
  { term: /\bshells?\b/i, introducedAt: 4 },
  { term: /\bvalence\b/i, introducedAt: 5 },
  { term: /\belements?\b/i, introducedAt: 6 },
  { term: /\bisotopes?\b/i, introducedAt: 6 },
  { term: /\bions?\b/i, introducedAt: 7 }
];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE PARTS
   Three sorts of thing the bench can put a needle on. The codes are the
   instrument's own, the readings are real, and none of them is named.
   ------------------------------------------------------------------ */
export const PARTS = {
  marked: {
    code: 'GRAIN // MARKED', mass: 1.0, charge: 1,
    note: 'Heavy, and it throws the needle one way every single time.'
  },
  blank: {
    code: 'GRAIN // BLANK', mass: 1.0, charge: 0,
    note: 'The same size and the same weight as a marked one. The needle does not move for it at all.'
  },
  light: {
    code: 'OUTER // LIGHT', mass: 0.0005, charge: -1,
    note: 'Almost nothing on the scale, and it throws the needle the opposite way to a marked grain.'
  },
  core: {
    code: 'CORE // WHOLE', mass: null, charge: null,
    note: 'The whole middle at once, too tight to separate at this field.'
  },
  whole: {
    code: 'SPECIMEN // WHOLE', mass: null, charge: null,
    note: 'One piece, edge to edge. Almost all of that width is nothing at all.'
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
  gives: 'Hands one light piece over and holds still afterwards.',
  takes: 'Pulls one light piece off the partner and keeps it.',
  inert: 'Nothing happens. It will not trade either way.'
};

/* ------------------------------------------------------------------
   THE EIGHT STAGES

   Exported because every `check` here is a pure function of the bench state,
   which is what makes them checkable without a browser. `npm run verify:learn`
   runs SOLUTIONS and MISSES below through them, so a stage whose grading has
   drifted away from its specimens fails the build instead of stranding a
   student halfway down the road.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Fire Through It',
    field: 'whole',
    briefing: {
      speaker: SPEAKER,
      body: 'We mounted an uncuttable particle into the test chamber. Fire a beam through SPEC A and observe what happens to determine its internal structure.'
    },
    prompt: 'Determine the internal structure of specimen SPEC A.',
    controls: ['beam'],
    specimens: [
      { id: 'a', label: 'SPEC A', note: 'one piece, mounted', core: { marked: 6, blank: 6 }, rings: [2, 4] }
    ],
    widget: {
      type: 'choice',
      label: 'Filed conclusion',
      options: [
        { id: 'solid', label: 'Solid all the way through', note: 'Packed dense matter, edge to edge.' },
        { id: 'hollow', label: 'A hard outer wall around a hollow', note: 'Empty inside, tough at the surface.' },
        { id: 'core', label: 'Mostly empty space, one heavy core in the middle', note: 'Vast empty void with a tiny, dense center.' }
      ]
    },
    hints: [
      'Click the "Fire Beam" button beneath the controls to fire 40 particles through the specimen.',
      'Check the Beam readout: 37 particles passed straight through undisturbed, 2 grazed wide, and 1 bounced straight backward.',
      'If the piece were solid, the stream would stop cold. A hollow wall would deflect at the edges. Only a tiny, super-dense core in an empty void explains a direct rebound.'
    ],
    check(state) {
      if (!state.fired.has('a')) return { ok: false, notYet: true, msg: 'Nothing has been fired yet. Click "Fire Beam" to test the specimen first.' };
      if (!state.choice) return { ok: false, notYet: true, msg: 'No conclusion filed. Select the structure that the beam counter proves.' };
      if (state.choice === 'solid') {
        return { ok: false, msg: 'Solid matter would have stopped the stream cold. 37 shots out of 40 passed straight through empty space.' };
      }
      if (state.choice === 'hollow') {
        return { ok: false, msg: 'A hollow wall would deflect particles at the outer edges. These passed through the edges and bounced off the dead center.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC A analyzed. Direct rebound: 1 in 40.',
      title: 'The Nucleus · Mostly Empty Space',
      body: 'Firing energetic particles reveals that an atom is mostly empty space! Almost every particle passes straight through, but a rare rebound shows a tiny, dense core in the center: the nucleus!'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What Is In The Middle',
    field: 'core',
    briefing: {
      speaker: SPEAKER,
      body: 'Almost all of that mass is packed into the nucleus, and the bench has SPEC A\'s up on the screen at full magnification. Some of the grains in it carry a stencilled cross.'
    },
    prompt: 'Count the grains stamped with a cross in the nucleus of SPEC A, and log the number.',
    controls: ['field'],
    specimens: [
      { id: 'a', label: 'SPEC A', note: 'one piece, mounted', core: { marked: 6, blank: 6 }, rings: [2, 4] }
    ],
    widget: { type: 'number', min: 0, max: 20, label: 'Marked grains counted' },
    hints: [
      'The screen is showing the nucleus, laid out flat so that nothing is hiding behind anything else. Twelve grains are packed into it.',
      'Blank grains are the same size and the same weight as marked ones, and they are not what is being counted. Work round the cluster from the outside in so you do not count one twice.',
      'Six of the twelve grains carry a cross. Set the counter to 6 and commit.'
    ],
    check(state) {
      if (state.number === 6) return { ok: true };
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'The counter is still on zero. Count the crosses on the screen and set it.' };
      }
      if (state.number === 12) {
        return { ok: false, msg: '12 is every grain in there, crossed or not. Count only the ones stamped with a cross.' };
      }
      return { ok: false, msg: 'Recount. Twelve grains are packed into that nucleus and six of them carry a cross.' };
    },
    reward: {
      log: 'SPEC A nucleus: 12 grains, 6 marked.',
      title: 'Protons & Neutrons · The Nucleus',
      body: 'The nucleus holds two kinds of heavy particle: protons (the marked ones, each carrying a charge of +1) and neutrons (the blank ones, with no charge at all). They weigh the same, which is why the needle is the only thing that tells them apart.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'The Books Balance',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'Two reference pieces are open to the instrument and the third is welded shut, so its outside will not resolve at all. Read the needle on all three, then work out what the sealed one is carrying.'
    },
    prompt: 'Work out how many light pieces sit outside the sealed core of SPEC B.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'r1', label: 'REF 01', note: 'reference, outside resolved', core: { marked: 3, blank: 4 }, rings: [2, 1] },
      { id: 'r2', label: 'REF 02', note: 'reference, outside resolved', core: { marked: 6, blank: 6 }, rings: [2, 4] },
      {
        id: 'b', label: 'SPEC B', note: 'welded casing, outside unresolved',
        core: { marked: 8, blank: 8 }, rings: [2, 6], sealed: true
      }
    ],
    widget: { type: 'number', min: 0, max: 20, label: 'Light pieces deduced' },
    hints: [
      'Select each specimen in turn and click "Read Needle". All three sit dead on zero, sealed or not.',
      'The two references are open, so both sides can be counted: the "Core" field shows their protons as crosses, and the "Rings" field shows the light pieces outside. Count both on each one.',
      'REF 01 has 3 crosses and 3 light pieces; REF 02 has 6 and 6. Whenever the needle reads zero the two counts are equal, and SPEC B has 8 crosses in its core — so set the counter to 8.'
    ],
    check(state) {
      if (!state.metered.has('b')) {
        return { ok: false, notYet: true, msg: 'The needle has not been on SPEC B yet. Select it and click "Read Needle".' };
      }
      if (state.number === 8) return { ok: true };
      if (state.number === 0) {
        return { ok: false, msg: 'Zero is what the needle reads on all three. That is the balance itself, not a count of what is doing the balancing.' };
      }
      if (state.number === 16) {
        return { ok: false, msg: '16 is every grain in that core, crossed and blank together. Only the crosses push the needle.' };
      }
      return { ok: false, msg: 'Check a reference first. On REF 01 and REF 02 the crosses in the core and the light pieces outside come out equal, and the needle reads zero — SPEC B has 8 crosses.' };
    },
    reward: {
      log: 'SPEC B certified at 8 outside. Casing unopened.',
      title: 'Electrons & Electrical Neutrality',
      body: 'Those light pieces are electrons, and each one carries a charge of -1. A specimen reads zero on the needle exactly when its electrons match its protons one for one, which is why counting one side of a neutral piece tells you the other.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Where They Sit',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'SPEC C reads zero on the needle with 11 protons in its core, so 11 electrons are out there somewhere. They do not go anywhere you like: check the two references, then load SPEC C ring by ring.'
    },
    prompt: 'Load all 11 of SPEC C\'s electrons onto its rings, using the ring counters on the deck.',
    controls: ['field'],
    specimens: [
      { id: 'r1', label: 'REF 01', note: 'resolved', core: { marked: 2, blank: 2 }, rings: [2] },
      { id: 'r2', label: 'REF 02', note: 'resolved', core: { marked: 10, blank: 10 }, rings: [2, 8] },
      { id: 'u', label: 'SPEC C', note: 'eleven electrons, unplaced', core: { marked: 11, blank: 12 }, rings: [] }
    ],
    target: 'u',
    widget: {
      type: 'rings',
      label: 'Ring loading — SPEC C',
      total: 11,
      rings: ['Ring 1 — nearest', 'Ring 2', 'Ring 3 — furthest']
    },
    hints: [
      'The ring counters are on the deck under the readout: a minus key and a plus key on each row. Every press moves one electron, and SPEC C redraws on the bench as you go.',
      'Look at the references in the "Rings" field. REF 01 carries 2 and nothing further out; REF 02 carries 2 on the nearest ring and 8 on the next — so a ring further out is never used while a nearer one still has room.',
      'Put 2 on Ring 1 and 8 on Ring 2. That is 10, and the one electron left over goes on Ring 3.'
    ],
    check(state) {
      const placed = state.rings.reduce((n, r) => n + r, 0);
      if (placed !== 11) {
        return { ok: false, notYet: true, msg: `${placed} of the 11 electrons are on a ring. Use the plus keys on the deck to load the rest.` };
      }
      if (state.rings[0] > 2) {
        return { ok: false, msg: 'Too many on Ring 1. REF 01 shows the nearest ring holding 2, and it never holds more.' };
      }
      if (state.rings[1] > 8) {
        return { ok: false, msg: 'Too many on Ring 2. REF 02 shows the second ring holding 8, and it never holds more.' };
      }
      if (state.rings[0] < 2 || (state.rings[2] > 0 && state.rings[1] < 8)) {
        return { ok: false, msg: 'Nothing sits on an outer ring while an inner one still has room. Fill Ring 1, then Ring 2, then whatever is left over.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC C loaded 2 / 8 / 1.',
      title: 'Electron Shells & The Bohr Model',
      body: 'Electrons are not scattered at random: they sit in rings called shells, and a shell holds a fixed number — 2 on the first, 8 on the second. Each shell fills before the next one starts, which is why SPEC C came out 2, 8 and 1.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Two Charges Left',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'We need to predict how four specimens will trade, and the tester has 2 charges left in it. Spend them on two, read the outer shell on all four, and file what each one will do.'
    },
    prompt: 'File whether each specimen gives an electron away, takes one on, or will not trade at all.',
    controls: ['field', 'tester'],
    specimens: [
      { id: 's1', label: 'SPEC D', note: 'resolved', core: { marked: 3, blank: 4 }, rings: [2, 1] },
      { id: 's2', label: 'SPEC E', note: 'resolved', core: { marked: 11, blank: 12 }, rings: [2, 8, 1] },
      { id: 's3', label: 'SPEC F', note: 'resolved', core: { marked: 17, blank: 18 }, rings: [2, 8, 7] },
      { id: 's4', label: 'SPEC G', note: 'resolved', core: { marked: 10, blank: 10 }, rings: [2, 8] }
    ],
    testerCharges: 2,
    widget: {
      type: 'bins',
      bins: [
        { id: 'gives', label: 'Gives one away', note: 'Hands an electron over.' },
        { id: 'takes', label: 'Takes one on', note: 'Pulls an electron off the partner.' },
        { id: 'inert', label: 'Will not trade', note: 'Does nothing either way.' }
      ]
    },
    hints: [
      'Select SPEC D or E and click "Run Tester", then spend the second charge on SPEC F or G. Two readings and four specimens means the other two have to be worked out.',
      'Set the field to "Rings" and compare the outermost shell on all four. SPEC D and SPEC E each carry 1 out there, SPEC F carries 7, and SPEC G carries a full 8.',
      'A shell holding 1 hands it over (SPEC D and SPEC E). A shell holding 7 is one short of full, so it takes one on (SPEC F). A shell already full at 8 does neither (SPEC G).'
    ],
    check(state) {
      if (state.tested.size < 1) {
        return { ok: false, notYet: true, msg: 'Run the tester at least once. Do not file four predictions without empirical evidence.' };
      }
      const want = { s1: 'gives', s2: 'gives', s3: 'takes', s4: 'inert' };
      const labels = { s1: 'SPEC D', s2: 'SPEC E', s3: 'SPEC F', s4: 'SPEC G' };
      for (const id of ['s1', 's2', 's3', 's4']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no line on the manifest yet.` };
      }
      for (const id of ['s1', 's2', 's3', 's4']) {
        if (state.bins[id] !== want[id]) {
          return { ok: false, msg: `${labels[id]} is filed incorrectly. Count the electrons on its outermost shell, and work out how much room that shell has left.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Four behaviors filed; two tester charges spent.',
      title: 'Valence Electrons & Chemical Reactivity',
      body: 'The electrons in the outermost shell are called valence electrons, and they decide everything about how an atom reacts. An atom with 1 of them gives it away, an atom with 7 takes one on to fill the shell, and an atom whose outer shell is already full of 8 does neither.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'The Same Weight Twice',
    field: 'core',
    briefing: {
      speaker: SPEAKER,
      body: 'We need more coolant matching reference sample H, and canisters K and L both weigh exactly the same as each other. Count what is in their cores and find the real match.'
    },
    prompt: 'Decide whether SPEC K and SPEC L are the same material as SPEC H.',
    controls: ['field'],
    specimens: [
      { id: 'h', label: 'SPEC H', note: 'reference', core: { marked: 6, blank: 6 }, rings: [2, 4] },
      { id: 'k', label: 'SPEC K', note: '13 core grains', core: { marked: 6, blank: 7 }, rings: [2, 4] },
      { id: 'l', label: 'SPEC L', note: '13 core grains', core: { marked: 7, blank: 6 }, rings: [2, 5] }
    ],
    widget: {
      type: 'bins',
      rows: ['k', 'l'],
      bins: [
        { id: 'match', label: 'Same material as SPEC H', note: 'Sell it on the same manifest line.' },
        { id: 'other', label: 'Something else', note: 'It does not belong with SPEC H.' }
      ]
    },
    hints: [
      'Switch the field to "Core". All three cores are on the screens at once, so they can be counted side by side.',
      'Both K and L hold 13 grains, so the totals will not separate them. Count the protons — the ones stamped with a cross — on all three.',
      'SPEC H has 6 protons. SPEC K has 6 protons and 7 neutrons, so it is the same material carrying one extra neutron. SPEC L has 7 protons, which makes it something else entirely.'
    ],
    check(state) {
      if (!state.bins.k || !state.bins.l) {
        return { ok: false, notYet: true, msg: 'Both specimens need an assignment on the manifest.' };
      }
      if (state.bins.k !== 'match') {
        return { ok: false, msg: 'SPEC K is filed incorrectly. It carries 6 protons, exactly as SPEC H does; the thirteenth grain is an uncharged neutron and changes nothing about what it is.' };
      }
      if (state.bins.l !== 'other') {
        return { ok: false, msg: 'SPEC L is filed incorrectly. It carries 7 protons where SPEC H carries 6, and that is a different material however much it happens to weigh.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC K certified with SPEC H. SPEC L held back.',
      title: 'Atomic Number & Isotopes',
      body: 'An element\'s identity depends ONLY on its proton count (atomic number). SPEC H and SPEC K both have 6 protons (carbon), but SPEC K has an extra neutron — making it an isotope. SPEC L has 7 protons, so it is a completely different element (nitrogen)!'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Take One Off',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'The thrusters need charged fuel and SPEC M is sitting neutral on the needle. Knock electrons off it until the needle reads plus two.'
    },
    prompt: 'Strip electrons from SPEC M until the needle reads plus 2, then log how many you took off.',
    controls: ['field', 'meter', 'strip', 'reset'],
    specimens: [
      { id: 'm', label: 'SPEC M', note: 'mounted, outside resolved', core: { marked: 11, blank: 12 }, rings: [2, 8, 1] }
    ],
    widget: { type: 'number', min: 0, max: 6, label: 'Electrons stripped' },
    hints: [
      'Click "Fire Stripper" to knock one electron off the specimen, then "Read Needle" to see what that did to the charge.',
      'Every electron taken off leaves one proton in the core with nothing cancelling it, so the needle climbs by one each time.',
      'Fire the stripper twice, so the needle reads plus two. Then set the counter to 2 and commit.'
    ],
    check(state) {
      const taken = state.stripped.m || 0;
      if (taken === 0) {
        return { ok: false, notYet: true, msg: 'The specimen is untouched and the needle sits at zero. Click "Fire Stripper" to knock an electron free.' };
      }
      if (taken !== 2) {
        return { ok: false, msg: `The needle is reading plus ${taken}. Bring it to plus two. (Use "Reset Specimen" if you stripped too many).` };
      }
      if (state.number !== 2) {
        return { ok: false, msg: `The count logged (${state.number}) does not match the 2 electrons taken off the specimen. Set the counter to 2.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC M brought to plus two. Core untouched.',
      title: 'Ions & Net Charge',
      body: 'An atom that has gained or lost electrons is called an ion. Taking 2 electrons off left 2 protons with nothing to cancel them, so what is in the chamber now is a +2 ion — same element, different charge.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'File The Manifest',
    field: 'core',
    briefing: {
      speaker: SPEAKER,
      body: 'The shuttle is ready to load and three canisters came off the salvage unlabelled. The reference standard is 7 protons, 7 neutrons and a needle on zero.'
    },
    prompt: 'File all three canisters against the reference standard of 7 protons, 7 neutrons and zero charge.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'n1', label: 'SPEC N', note: 'unlabelled', core: { marked: 7, blank: 8 }, rings: [2, 5] },
      { id: 'n2', label: 'SPEC P', note: 'unlabelled', core: { marked: 7, blank: 7 }, rings: [2, 4] },
      { id: 'n3', label: 'SPEC R', note: 'unlabelled', core: { marked: 8, blank: 8 }, rings: [2, 6] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'heavy', label: 'Same element, heavier', note: 'An extra neutron in the nucleus.' },
        { id: 'charged', label: 'Same element, carrying a charge', note: 'Short of electrons outside.' },
        { id: 'other', label: 'A different element', note: 'The proton count does not match.' }
      ]
    },
    hints: [
      'Switch to "Core" and count the protons on all three first. Only a canister with exactly 7 can be the reference element at all.',
      'SPEC R has 8 protons, so it is out. For SPEC N and SPEC P, count the neutrons as well and put the needle on each of them.',
      'SPEC N is 7 protons and 8 neutrons with the needle on zero — the same element, one neutron heavier. SPEC P is 7 and 7 but reads plus one, so it is the same element short an electron. SPEC R is a different element.'
    ],
    check(state) {
      const want = { n1: 'heavy', n2: 'charged', n3: 'other' };
      const labels = { n1: 'SPEC N', n2: 'SPEC P', n3: 'SPEC R' };
      for (const id of ['n1', 'n2', 'n3']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no line on the manifest yet.` };
      }
      if (state.bins.n1 !== want.n1) {
        return { ok: false, msg: 'SPEC N is filed incorrectly. It has 7 protons and its needle reads zero, but it carries 8 neutrons — the same element, one neutron heavier.' };
      }
      if (state.bins.n2 !== want.n2) {
        return { ok: false, msg: 'SPEC P is filed incorrectly. It has 7 protons and 7 neutrons like the standard, but only 6 electrons outside, which is why the needle reads plus one.' };
      }
      if (state.bins.n3 !== want.n3) {
        return { ok: false, msg: 'SPEC R is filed incorrectly. Count its protons in the Core field: 8 against the standard\'s 7 makes it a different element.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Three canisters certified. Orbital transfer manifest sealed.',
      title: 'The Subatomic Architecture of Matter',
      body: 'Three ways a piece of matter can differ, and only one of them changes what it is: change the neutrons and you have an isotope, change the electrons and you have an ion, change the protons and you have a different element altogether.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   Where the words finally arrive, after the intuition that earns them.
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'VESS // TALLOW CORE BENCH',
  sections: [
    {
      heading: 'Manifest Closed',
      body: 'Eight specimens verified from the inside out. The buyer signed the transfer manifest without dispute, the thrusters have charged propellant, and the Avalon\'s reactor is running — and every one of those readings you worked out yourself, from what the bench would actually show you.'
    },
    {
      heading: 'The Subatomic Model',
      body: 'You have uncovered the architecture that governs all chemistry: protons (+1) define the element, neutrons (0) stabilize the nucleus, and electrons (-1) fill quantized shells to dictate bonding and charge. Every reaction in the universe begins here.'
    },
    {
      heading: 'Next: The Periodic Table',
      body: 'You logged proton counts for a dozen specimens on this bench without opening a reference catalogue. When we reach Site 3 on Tallow, you will discover how Dmitri Mendeleev organized every known element across the galaxy using these exact proton numbers.'
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
    question: 'A beam fires through a specimen. 39 of 40 particles pass straight through empty space, and 1 rebounds backward. What does this prove?',
    options: [
      { id: 'a', label: 'The specimen is solid all the way through' },
      { id: 'b', label: 'The specimen is mostly empty space with a tiny dense nucleus' },
      { id: 'c', label: 'The specimen has a hollow outer shell' },
      { id: 'd', label: 'The specimen has no internal structure' }
    ],
    answer: 'b',
    explanation: 'The rare direct rebound reveals a tiny, incredibly dense nucleus — exactly what Rutherford\'s gold foil experiment demonstrated.'
  },
  {
    question: 'You probe a nucleus and count 8 marked grains (protons) and 8 blank grains (neutrons). What element is this?',
    options: [
      { id: 'a', label: 'Carbon (6 protons)' },
      { id: 'b', label: 'Nitrogen (7 protons)' },
      { id: 'c', label: 'Oxygen (8 protons)' },
      { id: 'd', label: 'Neon (10 protons)' }
    ],
    answer: 'c',
    explanation: 'The number of protons (atomic number) defines the element. 8 protons = oxygen, regardless of the neutron count.'
  },
  {
    question: 'A specimen has 6 protons and 6 electrons. What is its net electrical charge?',
    options: [
      { id: 'a', label: '+6' },
      { id: 'b', label: '−6' },
      { id: 'c', label: '0 (electrically neutral)' },
      { id: 'd', label: '+12' }
    ],
    answer: 'c',
    explanation: 'Equal numbers of protons (+1 each) and electrons (−1 each) cancel out, giving a net charge of zero.'
  },
  {
    question: 'Carbon has 6 electrons distributed as 2 in the first shell and 4 in the second. How many valence electrons does carbon have?',
    options: [
      { id: 'a', label: '2' },
      { id: 'b', label: '4' },
      { id: 'c', label: '6' },
      { id: 'd', label: '8' }
    ],
    answer: 'b',
    explanation: 'Valence electrons are in the outermost shell. Carbon\'s second (outer) shell holds 4 electrons — which is why carbon forms 4 bonds.'
  },
  {
    question: 'You strip 2 electrons off a neutral sodium atom (11 protons, 11 electrons). What is the resulting ion?',
    options: [
      { id: 'a', label: 'Na⁻ (charge −1)' },
      { id: 'b', label: 'Na⁺ (charge +1)' },
      { id: 'c', label: 'Na²⁺ (charge +2)' },
      { id: 'd', label: 'Na²⁻ (charge −2)' }
    ],
    answer: 'c',
    explanation: 'Removing 2 electrons from a neutral atom leaves 11 protons and 9 electrons: net charge = +2, written Na²⁺.'
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
  { number: 8, metered: new Set(['b']) },
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
  { number: 0, metered: new Set(['b']) },
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

const FIELD_LABELS = { whole: 'Whole', core: 'Core', rings: 'Rings' };

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
      commitLabel: stage.widget.type === 'bins' ? 'File Manifest' : 'Commit'
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
        <div class="cb-field" role="group" aria-label="Field">
          <span class="form-label">Field</span>
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
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="reset">Reset Specimen</button>');
    }

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
        body: 'Specimen restored. Everything that was taken off it is back where it was.'
      });
      return;
    }

    if (!state.sample) {
      frame.note('Nothing selected. Tap a specimen on the bench first.');
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
          ? 'The needle settles on zero and stays there. Nothing to report on the whole specimen.'
          : `The needle swings to ${net > 0 ? 'plus' : 'minus'} ${Math.abs(net)} and holds.`
      });
      return;
    }

    if (tool === 'tester') {
      if (charges <= 0) {
        frame.note('The tester cell is dead. Whatever is left on this bench, you work out from the rings.');
        return;
      }
      if (state.tested.has(id)) {
        frame.note('That specimen has already been run. Spend the charge on one you have not read.');
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
          body: 'Nothing left outside to take. The core does not come off with this.'
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
            ? 'The whole piece, at its own scale. Nothing in here separates at this field.'
            : state.field === 'core'
              ? 'The core is up on the screen. Click a grain on it to put the needle on that one.'
              : 'The rings are up on the screen. Click a piece on it to put the needle on that one.'}</p>
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
          ? `<div class="lq-readout-hold">Packed with ${coreTotal(spec)} grains in all, both sorts together.</div>`
          : ''}
        ${hit.part === 'marked' || hit.part === 'blank'
          ? `<div class="lq-readout-hold">This core holds ${coreTotal(spec)} grains in all.</div>`
          : ''}
        ${hit.part === 'light'
          ? `<div class="lq-readout-hold">Sitting on ring ${hit.ring + 1}, out from the core.</div>`
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
          <p class="form-help cb-remaining">${w.total} left to place. Use the plus and minus keys on each ring.</p>
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
              ? 'All placed. Move them between rings with the minus and plus keys.'
              : `${left} left to place. Use the plus and minus keys on each ring.`;
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
