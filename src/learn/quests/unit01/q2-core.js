/**
 * The second game on the Learn road. Eight stages on the core bench, introducing
 * the nucleus, protons, neutrons, electrons, electron shells, valence electrons,
 * isotopes, and ions immediately after each stage as the reward card payoff.
 *
 * THE ORDER IS THE WHOLE DESIGN. Every stage is a thing the player does with an
 * instrument, and the concept arrives immediately afterwards as a reward card,
 * connecting the player's hands-on observation to the real chemistry:
 *
 *   1  fire an alpha beam through matter        -> The Nucleus · Mostly Empty Space
 *   2  probe the heavy grains in the core       -> Protons & Neutrons · The Nucleus
 *   3  read net charge and deduce outer particles -> Electrons & Electrical Neutrality
 *   4  distribute electrons across energy rings -> Electron Shells & The Bohr Model
 *   5  test trading behavior with reagents     -> Valence Electrons & Chemical Reactivity
 *   6  differentiate specimens of equal mass   -> Atomic Number & Isotopes
 *   7  strip electrons to ionize a specimen    -> Ions & Net Charge
 *   8  classify unknown canisters by structure -> The Subatomic Architecture of Matter
 *   -- debrief: subatomic model summary & preview of the periodic table.
 *
 * Player-facing vocabulary before the debrief: piece, core, grain, mark, ring,
 * light piece, specimen, needle. That restraint is the product.
 *
 * WHAT THIS QUEST DOES NOT SAY. The core bench does not talk to the sampler
 * scope's catalogue, and Vess says so out loud in stage one. The player will
 * finish this site holding a marked count for a dozen specimens and no idea that
 * the scope has been filing by exactly that number since site one. That reveal
 * belongs to `q3-catalogue`, and handing it over early would spend the best
 * moment on this world for nothing.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings. It
 * reports through `ctx` and nothing else.
 */

import { CoreBench } from '../../engine/corebench.js';
import { LearnFrame } from '../../engine/frame.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

const SPEAKER = 'VESS // TALLOW CORE BENCH';

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
      body: 'The cutter blade on the bench met a piece of scrap it could not divide, and standard sensors report it as uniform solid matter. In the reactor coils, however, radiation passes through it in an unexpected way. We mounted SPEC A in the accelerator chamber to determine its internal structure.'
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
        { id: 'hollow', label: 'A hard outer shell around a hollow', note: 'Empty inside, tough at the surface.' },
        { id: 'core', label: 'Mostly empty space, one heavy core in the middle', note: 'Vast empty void with a minute, dense center.' }
      ]
    },
    hints: [
      'Click the "Fire Beam" button beneath the controls to fire 40 particles through the specimen.',
      'Check the Beam readout: 37 particles passed straight through undisturbed, 2 grazed wide, and 1 bounced straight backward.',
      'If the piece were solid, the stream would stop cold. A hollow shell would deflect at the edges. Only a minute, super-dense core in an empty void explains a direct rebound.'
    ],
    check(state) {
      if (!state.fired.has('a')) return { ok: false, msg: 'Nothing has been fired yet. Click "Fire Beam" to test the specimen first.' };
      if (!state.choice) return { ok: false, msg: 'No conclusion filed. Select the structure that the beam counter proves.' };
      if (state.choice === 'solid') {
        return { ok: false, msg: 'Solid matter would have stopped the stream cold. 37 shots out of 40 passed straight through empty space.' };
      }
      if (state.choice === 'hollow') {
        return { ok: false, msg: 'A hollow shell would deflect particles at the outer edges. These passed through the edges and bounced off the dead center.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC A analyzed. Direct rebound: 1 in 40.',
      title: 'The Nucleus · Mostly Empty Space',
      body: 'Like Rutherford\'s famous gold foil experiment, firing energetic alpha particles reveals that an atom is over 99.99% empty space. Almost every particle passes straight through, while the rare rebound exposes a minute, incredibly dense central core: the atomic nucleus, where almost all mass is concentrated.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What Is In The Middle',
    field: 'core',
    briefing: {
      speaker: SPEAKER,
      body: 'That particle rebound came from a speck less than a ten-thousandth the width of the atom. Focus coils reveal a cluster of heavy subatomic particles in the nucleus of SPEC A. We need to determine the count of marked particles inside this core.'
    },
    prompt: 'Determine the count of marked particles in the core of SPEC A.',
    controls: ['field'],
    specimens: [
      { id: 'a', label: 'SPEC A', note: 'one piece, mounted', core: { marked: 6, blank: 6 }, rings: [2, 4] }
    ],
    widget: { type: 'number', min: 0, max: 20, label: 'Marked grains counted' },
    hints: [
      'Tap different grains inside the central cluster to read their mass and charge on the probe monitor.',
      'There are twelve grains in that core. Blank grains show no needle movement, while marked grains (stamped with a cross) deflect the needle to plus one.',
      'Count only the grains stamped with a cross: there are exactly 6 marked grains. Set the counter to 6 and commit.'
    ],
    check(state) {
      if (!state.probed.has('marked') && !state.probed.has('blank')) {
        return { ok: false, msg: 'No grains read yet. Tap a grain in the core cluster before committing a count.' };
      }
      if (state.number === 6) return { ok: true };
      if (state.number === 12) {
        return { ok: false, msg: '12 is the total count of all grains in the core. Count only the marked grains with crosses.' };
      }
      return { ok: false, msg: 'Recount the marked grains. SPEC A has 12 grains in its core: count only those stamped with a cross.' };
    },
    reward: {
      log: 'SPEC A core: 12 subatomic particles (6 marked, 6 blank).',
      title: 'Protons & Neutrons · The Nucleus',
      body: 'The atomic nucleus consists of two types of nucleons of nearly identical mass: protons (the marked grains with a +1 positive charge) and neutrons (the blank grains with 0 charge). SPEC A has 6 protons and 6 neutrons, giving it a mass number of 12.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'The Books Balance',
    field: 'whole',
    briefing: {
      speaker: SPEAKER,
      body: 'We salvaged sealed canister SPEC B from a refinery vault. The outer casing shields against radiation, preventing direct visual scans of its perimeter. Before connecting it to the power bank, we must confirm it is not carrying an unbalance of electrical charge.'
    },
    prompt: 'Deduce how many light particles surround the core of SPEC B.',
    controls: ['field', 'meter'],
    specimens: [
      {
        id: 'b', label: 'SPEC B', note: 'sealed casing, outside unresolved',
        core: { marked: 8, blank: 8 }, rings: [2, 6], sealed: true
      }
    ],
    widget: { type: 'number', min: 0, max: 20, label: 'Light pieces deduced' },
    hints: [
      'Ensure the Field is set to "Whole" and click "Read Needle" to measure the whole specimen\'s net charge.',
      'The needle sits dead on zero. Click the "Core" field button and count the marked grains with crosses (there are 8).',
      'Each marked grain pushes +1, and each light piece pulls -1. To balance 8 marked grains at zero net charge, there must be exactly 8 light pieces outside. Set the counter to 8.'
    ],
    check(state) {
      if (!state.metered.has('b')) {
        return { ok: false, msg: 'The needle has not touched SPEC B. With Field set to "Whole", click "Read Needle" first.' };
      }
      if (state.number === 8) return { ok: true };
      if (state.number === 0) {
        return { ok: false, msg: 'Zero is what the needle reads, meaning net charge is neutral. How many light pieces are required to cancel the core?' };
      }
      if (state.number === 16) {
        return { ok: false, msg: '16 is the total count of grains in the core (marked plus blank). Only marked grains carry charge.' };
      }
      return { ok: false, msg: 'Switch to the "Core" field and count the marked grains (8). To balance the core at zero, exactly 8 light pieces must be outside.' };
    },
    reward: {
      log: 'SPEC B certified. 8 electrons deduced, casing unopened.',
      title: 'Electrons & Electrical Neutrality',
      body: 'In an undisturbed, neutral atom, the total positive charge of the protons in the nucleus is exactly balanced by an equal number of negatively charged electrons (-1) orbiting outside. Because SPEC B has 8 protons and a net charge of zero, it must have exactly 8 electrons.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Where They Sit',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'We are calibrating an ion emitter with raw specimen SPEC C, containing 11 electrons. Electrons do not drift randomly around the nucleus; electrostatic and quantum constraints organize them into concentric energy shells.'
    },
    prompt: 'Configure all 11 electrons into their proper shells on SPEC C.',
    controls: ['field'],
    specimens: [
      { id: 'r1', label: 'REF 01', note: 'resolved', core: { marked: 2, blank: 2 }, rings: [2] },
      { id: 'r2', label: 'REF 02', note: 'resolved', core: { marked: 10, blank: 10 }, rings: [2, 8] },
      { id: 'u', label: 'SPEC C', note: 'eleven light pieces, unplaced', core: { marked: 11, blank: 12 }, rings: [] }
    ],
    target: 'u',
    widget: {
      type: 'rings',
      label: 'Placement — SPEC C',
      total: 11,
      rings: ['Ring 1 — nearest', 'Ring 2', 'Ring 3 — furthest']
    },
    hints: [
      'Click REF 01 and REF 02 in the "Rings" field to see how many light pieces each ring can hold.',
      'REF 01 holds 2 on Ring 1. REF 02 holds 2 on Ring 1 and 8 on Ring 2. Inner rings fill completely before any piece sits further out.',
      'Fill Ring 1 with 2 pieces, Ring 2 with 8 pieces (total 10). Place the 1 remaining light piece on Ring 3.'
    ],
    check(state) {
      const placed = state.rings.reduce((n, r) => n + r, 0);
      if (placed !== 11) {
        return { ok: false, msg: `You have placed ${placed} of the 11 light pieces. All 11 must be distributed onto the rings.` };
      }
      if (state.rings[0] > 2) {
        return { ok: false, msg: 'Too many on Ring 1. Look at REF 01: the nearest ring has a strict capacity of 2.' };
      }
      if (state.rings[1] > 8) {
        return { ok: false, msg: 'Too many on Ring 2. Look at REF 02: the second ring maxes out at 8.' };
      }
      if (state.rings[0] < 2 || (state.rings[2] > 0 && state.rings[1] < 8)) {
        return { ok: false, msg: 'Inner rings must fill first. Nothing sits on an outer ring while an inner ring has room left.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC C electron configuration: 2 / 8 / 1.',
      title: 'Electron Shells & The Bohr Model',
      body: 'Electrons occupy quantized concentric energy levels called electron shells. The first shell closest to the nucleus holds at most 2 electrons; the second holds up to 8. Electrons fill lower-energy inner shells first, meaning element 11 (sodium) has the electron configuration 2, 8, 1.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Two Charges Left',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'We must predict how four salvaged specimens (SPEC D, E, F, G) will react before mixing them into the fuel manifold. The reagent tester has only 2 charges left in its auxiliary battery; observe the electron architecture to deduce how all four will interact.'
    },
    prompt: 'Classify whether each specimen gives electrons, accepts electrons, or remains inert.',
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
        { id: 'gives', label: 'Gives one away', note: 'Hands a light piece over.' },
        { id: 'takes', label: 'Takes one on', note: 'Pulls a light piece off the partner.' },
        { id: 'inert', label: 'Will not trade', note: 'Does nothing either way.' }
      ]
    },
    hints: [
      'Select SPEC D or E and click "Run Tester". Then select SPEC F or G and spend your second charge.',
      'Compare the outermost rings: SPEC D and SPEC E both have 1 lonely piece. SPEC F has 7 (one short of a full ring of 8). SPEC G has a full ring of 8.',
      'A ring with 1 gives it away (SPEC D and E). A ring with 7 takes one on to fill its shell (SPEC F). A full ring of 8 will not trade (SPEC G).'
    ],
    check(state) {
      if (state.tested.size < 1) {
        return { ok: false, msg: 'Run the tester at least once. Do not file four predictions without empirical evidence.' };
      }
      const want = { s1: 'gives', s2: 'gives', s3: 'takes', s4: 'inert' };
      const labels = { s1: 'SPEC D', s2: 'SPEC E', s3: 'SPEC F', s4: 'SPEC G' };
      for (const id of ['s1', 's2', 's3', 's4']) {
        if (!state.bins[id]) return { ok: false, msg: `${labels[id]} has no line on the manifest yet.` };
      }
      for (const id of ['s1', 's2', 's3', 's4']) {
        if (state.bins[id] !== want[id]) {
          return { ok: false, msg: `${labels[id]} is filed incorrectly. Check how many light pieces sit on its outermost ring, and how much room that ring has left.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Four behaviors filed; two tester charges spent.',
      title: 'Valence Electrons & Chemical Reactivity',
      body: 'Chemical reactivity is determined by valence electrons—the electrons in the outermost shell. Atoms strive for a full outer shell (the octet rule): atoms with 1 valence electron readily donate it, atoms with 7 aggressively take one, and atoms with a complete outer shell of 8 (like neon) are chemically inert noble gases.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'The Same Weight Twice',
    field: 'core',
    briefing: {
      speaker: SPEAKER,
      body: 'The cooling system requires pure coolant matching reference standard SPEC H. Salvage bins yielded two unlabelled canisters, SPEC K and SPEC L, both with 13 total particles in their cores. We must verify which canister is genuine coolant before introducing it to the reactor.'
    },
    prompt: 'Determine whether SPEC K and SPEC L match the chemical identity of SPEC H.',
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
      'Switch Field to "Core" and tap the grains on SPEC H, K, and L to inspect their cores.',
      'Count only the marked grains with crosses. Reference SPEC H has 6 marked grains. Check how many marked grains SPEC K and SPEC L have.',
      'SPEC K has 6 marked grains and 7 blank (same material as SPEC H, with an extra blank). SPEC L has 7 marked grains and 6 blank (different material). File K as "Same material" and L as "Something else".'
    ],
    check(state) {
      if (!state.probed.has('marked') && !state.probed.has('blank')) {
        return { ok: false, msg: 'Nothing read yet. Switch to the "Core" field and tap the grains before filing.' };
      }
      if (!state.bins.k || !state.bins.l) {
        return { ok: false, msg: 'Both specimens need an assignment on the manifest.' };
      }
      if (state.bins.k !== 'match') {
        return { ok: false, msg: 'SPEC K is filed incorrectly. It has 6 marked grains, matching reference SPEC H—the extra grain is merely an uncharged blank.' };
      }
      if (state.bins.l !== 'other') {
        return { ok: false, msg: 'SPEC L is filed incorrectly. It has 7 marked grains. Even though its total weight is 13, having 7 marks makes it an entirely different element.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC K certified with SPEC H. SPEC L held back.',
      title: 'Atomic Number & Isotopes',
      body: 'An element\'s chemical identity is governed strictly by its atomic number (the number of protons in its nucleus). SPEC H and SPEC K both have 6 protons (carbon): SPEC K has an extra neutron, making it carbon-13, an isotope of the same element. SPEC L has 7 protons (nitrogen), making it an entirely different element despite having the same mass number 13.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Take One Off',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'The electrostatic thrusters require charged propellant to generate thrust; neutral atoms pass through magnetic acceleration stages unaffected. Neutral specimen SPEC M must be ionized to a net charge of plus two.'
    },
    prompt: 'Ionize specimen SPEC M to a net charge of plus two, and log the number of electrons removed.',
    controls: ['field', 'meter', 'strip', 'reset'],
    specimens: [
      { id: 'm', label: 'SPEC M', note: 'mounted, outside resolved', core: { marked: 11, blank: 12 }, rings: [2, 8, 1] }
    ],
    widget: { type: 'number', min: 0, max: 6, label: 'Pieces stripped' },
    hints: [
      'Click "Fire Stripper" to knock a light piece off the specimen, then click "Read Needle" to measure the charge.',
      'Each stripped light piece removes one negative charge, leaving one marked grain in the core uncancelled (+1 on the needle per strip).',
      'Fire the stripper twice so the needle reads "plus 2". Then set the number counter to 2 and commit.'
    ],
    check(state) {
      const taken = state.stripped.m || 0;
      if (taken === 0) {
        return { ok: false, msg: 'The specimen is untouched and the needle sits at zero. Click "Fire Stripper" to knock pieces free.' };
      }
      if (taken !== 2) {
        return { ok: false, msg: `The needle is reading plus ${taken}. Bring it to plus two. (Use "Reset Specimen" if you stripped too many).` };
      }
      if (state.number !== 2) {
        return { ok: false, msg: `The count logged (${state.number}) does not match the 2 pieces stripped from the specimen. Set the counter to 2.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC M brought to plus two. Core untouched.',
      title: 'Ions & Net Charge',
      body: 'When a neutral atom loses or gains electrons, it becomes an ion. Removing 2 negative electrons from SPEC M left its 11 positive protons partially uncancelled, yielding a +2 cation. The nucleus is completely unchanged, so the elemental identity remains sodium, but it now interacts powerfully with electric fields.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'File The Manifest',
    field: 'core',
    briefing: {
      speaker: SPEAKER,
      body: 'The orbital cargo shuttle is clearing its docking clamps. Three unlabelled canisters (SPEC N, SPEC P, SPEC R) must be certified against a reference standard of 7 protons, 7 neutrons, and 7 electrons before transfer.'
    },
    prompt: 'Classify all three canisters against the reference standard on the shipping manifest.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'n1', label: 'SPEC N', note: 'unlabelled', core: { marked: 7, blank: 8 }, rings: [2, 5] },
      { id: 'n2', label: 'SPEC P', note: 'unlabelled', core: { marked: 7, blank: 7 }, rings: [2, 4] },
      { id: 'n3', label: 'SPEC R', note: 'unlabelled', core: { marked: 8, blank: 8 }, rings: [2, 6] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'heavy', label: 'Same material, heavier', note: 'An extra blank grain in the core.' },
        { id: 'charged', label: 'Same material, carrying a charge', note: 'Short of light pieces outside.' },
        { id: 'other', label: 'A different material', note: 'The marked count does not match.' }
      ]
    },
    hints: [
      'Switch to "Core" and count the marked grains on all three canisters first. Only those with exactly 7 marks can be the reference material.',
      'SPEC R has 8 marked grains, making it a different material. For SPEC N and P: count blank grains in the core and click "Read Needle" to test net charge.',
      'SPEC N has 7 marked, 8 blank, and balanced rings (Same material, heavier). SPEC P has 7 marked, 7 blank, and 6 rings, needle at +1 (Same material, carrying a charge). SPEC R has 8 marks (A different material).'
    ],
    check(state) {
      const want = { n1: 'heavy', n2: 'charged', n3: 'other' };
      const labels = { n1: 'SPEC N', n2: 'SPEC P', n3: 'SPEC R' };
      for (const id of ['n1', 'n2', 'n3']) {
        if (!state.bins[id]) return { ok: false, msg: `${labels[id]} has no line on the manifest yet.` };
      }
      if (state.bins.n1 !== want.n1) {
        return { ok: false, msg: 'SPEC N is filed incorrectly. Its marked count matches 7 and its light pieces balance, but it carries 8 blank grains (heavier isotope).' };
      }
      if (state.bins.n2 !== want.n2) {
        return { ok: false, msg: 'SPEC P is filed incorrectly. It has 7 marked grains and 7 blank, but only 6 light pieces outside, giving a +1 needle reading (charged ion).' };
      }
      if (state.bins.n3 !== want.n3) {
        return { ok: false, msg: 'SPEC R is filed incorrectly. Count its marked grains in the Core field: 8 marks does not match the reference standard of 7 (different element).' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Three canisters certified. Orbital transfer manifest sealed.',
      title: 'The Subatomic Architecture of Matter',
      body: 'You have mastered the subatomic architecture of atoms: changing neutrons creates isotopes of different mass (nitrogen-15 in SPEC N), altering electrons creates charged ions (nitrogen cation in SPEC P), and altering protons changes the atomic number into an entirely different element (oxygen in SPEC R).',
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
      body: 'Eight specimens verified from the subatomic level up. The buyer signed the transfer manifest without dispute, our thrusters have ionized propellant, and the Avalon\'s reactor is fully operational. You deduced every nuclear and electronic property from first principles.'
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
  { number: 6, probed: new Set(['marked', 'blank']) },
  { number: 8, metered: new Set(['b']), probed: new Set(['marked']) },
  { rings: [2, 8, 1] },
  { tested: new Set(['s1', 's3']), bins: { s1: 'gives', s2: 'gives', s3: 'takes', s4: 'inert' } },
  { probed: new Set(['marked']), bins: { k: 'match', l: 'other' } },
  { number: 2, stripped: { m: 2 } },
  { bins: { n1: 'heavy', n2: 'charged', n3: 'other' } }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { fired: new Set(['a']), choice: 'hollow' },
  { number: 12, probed: new Set(['marked', 'blank']) },
  { number: 0, metered: new Set(['b']), probed: new Set(['marked']) },
  { rings: [2, 8, 0] },
  { tested: new Set(['s1', 's3']), bins: { s1: 'gives', s2: 'takes', s3: 'takes', s4: 'inert' } },
  { probed: new Set(['marked']), bins: { k: 'other', l: 'other' } },
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
      frame.miss(result.msg);
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
            <button type="button" class="quest-btn-sm cb-field-key" data-field="${id}">${label}</button>
          `).join('')}
        </div>
      `);
    }
    if (stage.controls.includes('beam')) {
      parts.push('<button type="button" class="quest-btn-sm lq-tool" data-tool="beam">Fire Beam</button>');
    }
    if (stage.controls.includes('meter')) {
      parts.push('<button type="button" class="quest-btn-sm lq-tool" data-tool="meter">Read Needle</button>');
    }
    if (stage.controls.includes('tester')) {
      parts.push(`<button type="button" class="quest-btn-sm lq-tool" data-tool="tester">Run Tester <span class="cb-charges">${charges}</span></button>`);
    }
    if (stage.controls.includes('strip')) {
      parts.push('<button type="button" class="quest-btn-sm lq-tool" data-tool="strip">Fire Stripper</button>');
    }
    if (stage.controls.includes('reset')) {
      parts.push('<button type="button" class="quest-btn-sm lq-tool" data-tool="reset">Reset Specimen</button>');
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
              ? 'Tap a grain in the core to read it.'
              : 'Tap a light piece, or the core at the centre, to read it.'}</p>
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
            <button type="button" class="quest-btn-sm" data-num="-1" aria-label="Lower">&minus;</button>
            <span class="lq-number-value" aria-live="polite">${state.number}</span>
            <button type="button" class="quest-btn-sm" data-num="1" aria-label="Raise">+</button>
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
                <button type="button" class="quest-btn-sm" data-ring-step="-1" aria-label="One fewer on ${esc(label)}">&minus;</button>
                <span class="lq-build-count">0</span>
                <button type="button" class="quest-btn-sm" data-ring-step="1" aria-label="One more on ${esc(label)}">+</button>
              </div>
            `).join('')}
          </div>
          <p class="form-help cb-remaining">${w.total} left to place.</p>
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
            left === 0 ? 'All placed.' : `${left} left to place.`;
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
