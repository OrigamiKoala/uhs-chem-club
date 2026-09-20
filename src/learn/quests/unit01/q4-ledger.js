/**
 * q4-ledger.js — Tallow, site four: THE BUYER'S LEDGER.
 *
 * The fourth game on the Learn road, worked on the Tally Floor with the core
 * bench trolleyed up from the sub-level. The Guild will not take transfer of a
 * single canister until every one of them is written into the ledger the way
 * Imperial survey writes them: what element it is, how heavy that particular
 * piece is, and what charge it is carrying.
 *
 * WHAT THIS BENCH IS FOR. `q2-core` found the parts — protons, neutrons,
 * electrons, shells — and named isotopes and ions on its last two cards, which
 * is where a word gets introduced, not where it gets learned. This is the bench
 * where the player uses them until they are theirs: three counts off an open
 * piece, a label read off a sealed one, chemistry that follows the electrons and
 * ignores the neutrons, an atom driven positive and another driven negative, and
 * a shipment balanced to zero.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  count protons, neutrons and electrons   -> Mass Number · the label figure
 *   2  work a sealed canister from its label   -> Isotope Notation · A and Z
 *   3  say which canisters behave alike        -> Isotopes are chemically identical
 *   4  read a needle that is not on zero       -> Net charge is protons minus electrons
 *   5  drive a piece positive with the stripper-> Cations
 *   6  load an outer shell past neutral        -> Anions
 *   7  balance a mixed shipment to zero        -> Charges cancel, in whole pieces
 *   8  file four canisters into the ledger     -> Three numbers describe any piece
 *   -- debrief: the ledger, and the number on the card that no piece actually weighs.
 *
 * NOTHING HERE REQUIRES CLICKING A PARTICLE. Counting is the task on stages 1,
 * 2, 4 and 8, so the answer is a number the player enters; the probe is there if
 * they want a reading and is never a gate on a commit. Every specimen is a real
 * nuclide and balances unless a stage has taken something off it.
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

   NOTHING ON THIS BENCH IS NAMED WITHOUT BEING EXPLAINED (CLAUDE.md, and
   PRODUCT.md principle 2). Every control a stage puts on the plate carries one
   plain sentence saying what it does, and the sentence stays there for as long
   as the control does. `verify:learn` fails the build over a control with no
   line and runs every line through the withheld-vocabulary gate.

   Every word this bench uses in its legends was earned on an earlier one, so
   unlike the core bench at site two, nothing here has to change its wording
   partway through the quest.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  field: [{
    from: 1,
    key: 'The three view keys',
    what: 'Three ways of looking at the same piece. "Whole piece" is it at its own size, "The middle" magnifies the nucleus until its grains separate, and "Outside" pulls back to show the electrons on their shells.'
  }],
  meter: [{
    from: 1,
    key: 'Read Needle',
    what: 'Swings the charge balance onto the selected piece. Protons push the needle one way, electrons push it the other, and it settles wherever the two leave it — on zero if they cancel exactly.'
  }],
  strip: [{
    from: 1,
    key: 'Fire Stripper',
    what: 'Knocks one electron off the furthest-out shell of the selected piece. Nothing in the nucleus is touched, so the element and the mass number do not change.'
  }],
  reset: [{
    from: 1,
    key: 'Reset Specimen',
    what: 'Puts back every electron the stripper has taken off the selected piece.'
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
   The same three sorts of thing the core bench put a needle on at site
   two, with the same readings. Nothing has been renamed.
   ------------------------------------------------------------------ */
export const PARTS = {
  marked: {
    code: 'PROTON', mass: 1.0, charge: 1,
    note: 'A proton. Heavy, and it throws the needle one way every time.'
  },
  blank: {
    code: 'NEUTRON', mass: 1.0, charge: 0,
    note: 'A neutron. The same size and weight as a proton, and the needle does not move for it at all.'
  },
  light: {
    code: 'ELECTRON', mass: 0.0005, charge: -1,
    note: 'An electron. Almost nothing on the scale, and it throws the needle the opposite way to a proton.'
  },
  core: {
    code: 'NUCLEUS', mass: null, charge: null,
    note: 'The whole nucleus at once, too tight to separate at this field.'
  },
  whole: {
    code: 'CANISTER // SEALED', mass: null, charge: null,
    note: 'The casing, edge to edge. Nothing inside this one will resolve while it is shut.'
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

/** Protons plus neutrons — the figure Imperial survey stamps on a label. */
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
    title: 'Three Numbers Off One Piece',
    field: 'core',
    briefing: {
      speaker: SPEAKER,
      body: 'The Guild surveyor will not sign for a canister described as "salvage" and wants every line of the ledger filled. One piece out of cargo one is open on the bench with every view resolving.'
    },
    prompt: 'Count the protons, the neutrons and the electrons on SPEC A and log all three.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'a', label: 'SPEC A', note: 'cargo one, casing off', core: { marked: 6, blank: 6 }, rings: [2, 4] }
    ],
    widget: {
      type: 'triple',
      label: 'Ledger line — SPEC A',
      min: 0, max: 20,
      fields: ['Protons', 'Neutrons', 'Electrons']
    },
    hints: [
      'Set the view to "The middle" and count the grains stamped with a cross, then count the blank ones. Then set it to "Outside" and count the pieces on the shells.',
      'Twelve grains are packed into that nucleus, drawn flat so none of them is hiding behind another. Half of them carry a cross.',
      'SPEC A is 6 protons, 6 neutrons and 6 electrons, and the needle sits on zero because the first and last of those are equal.'
    ],
    check(state) {
      const [p, n, e] = state.numbers;
      if (p === 0 && n === 0 && e === 0) {
        return { ok: false, notYet: true, msg: 'The ledger line is still blank. Count the three figures on the bench and set them.' };
      }
      if (p === 12) {
        return { ok: false, msg: '12 is every grain in that nucleus, crossed and blank together. Only the crossed ones are protons.' };
      }
      if (p !== 6) {
        return { ok: false, msg: 'Recount the protons in "The middle". Twelve grains are packed into the nucleus and six of them carry a cross.' };
      }
      if (n !== 6) {
        return { ok: false, msg: 'Recount the neutrons. They are the blank grains in the nucleus, and they make up the rest of the twelve.' };
      }
      if (e !== 6) {
        return { ok: false, msg: 'Recount the electrons in "Outside". The needle reads zero on this piece, which is only possible when they match the protons.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC A ledgered: 6 / 6 / 6.',
      title: 'Mass Number · The Figure On The Label',
      body: 'Electrons weigh almost nothing, so everything a piece weighs is in its nucleus: add the protons to the neutrons and you get 12, which is called the mass number. That is the figure Imperial survey stamps on a canister, and it is why this piece is written carbon-12.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Read The Label',
    field: 'core',
    briefing: {
      speaker: SPEAKER,
      body: 'Cargo two is pressure-sealed and the surveyor will not authorise opening it, so the stamped label is all there is. An open reference carrying the same style of label is on the bench beside it.'
    },
    prompt: 'Using REF 01 to work out what the two stamped figures mean, log how many neutrons and how many electrons SPEC B is carrying.',
    controls: ['field', 'meter'],
    specimens: [
      {
        id: 'r1', label: 'REF 01',
        note: 'LABEL // CAT 06 // MASS NUMBER 12 // NEEDLE 0 · casing off',
        core: { marked: 6, blank: 6 }, rings: [2, 4]
      },
      {
        id: 'b', label: 'SPEC B',
        note: 'LABEL // CAT 17 // MASS NUMBER 37 // NEEDLE 0 · welded shut',
        core: { marked: 17, blank: 20 }, rings: [2, 8, 7], casing: true
      }
    ],
    widget: {
      type: 'pair',
      label: 'Ledger line — SPEC B',
      min: 0, max: 40,
      fields: ['Neutrons', 'Electrons']
    },
    hints: [
      'Count REF 01 in both views and hold its three counts against the two figures on its own label. Its stamp reads CAT 06 and MASS NUMBER 12, and it has 6 protons, 6 neutrons and 6 electrons.',
      'So on that reference the catalogue code is the proton count, and the mass number is the protons and the neutrons added together. Take the code off the mass number and what is left is the neutrons.',
      'SPEC B stamps CAT 17 and 37, so 17 protons and 37 minus 17 is 20 neutrons. Its needle reads zero, so the electrons match the protons exactly: 17.'
    ],
    check(state) {
      const [n, e] = state.numbers;
      if (n === 0 && e === 0) {
        return { ok: false, notYet: true, msg: 'The ledger line is still blank. Work the two figures out from the label and set them.' };
      }
      if (n === 37) {
        return { ok: false, msg: '37 is the mass number, and on REF 01 that figure counted the protons as well as the neutrons. Take the 17 protons off it.' };
      }
      if (n !== 20) {
        return { ok: false, msg: 'Check REF 01 again: its stamped 12 is its 6 protons plus its 6 neutrons. SPEC B stamps CAT 17 and 37.' };
      }
      if (e !== 17) {
        return { ok: false, msg: 'The needle on that label reads zero, and REF 01 shows what zero means: the electrons cancel the protons one for one.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC B ledgered from its label: 17 / 20 / 17.',
      title: 'Isotope Notation · Two Numbers Say Everything',
      body: 'A shut piece is fully described by two figures: the atomic number, which says what element it is, and the mass number, which says how heavy this particular one is. Chemists write that as chlorine-37, or as the mass number above the atomic number beside the symbol, and every other count falls out of the pair.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Which Ones Behave Alike',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'The reference canister is what the buyer contracted for, and three more came off the salvage with no paperwork. Two pieces do the same job when they react the same way, and you already know from site two what decides that.'
    },
    prompt: 'File each canister by whether it will react the same way as the reference.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'ref', label: 'REFERENCE', note: 'contracted stock, casing off', core: { marked: 17, blank: 18 }, rings: [2, 8, 7] },
      { id: 'k', label: 'SPEC K', note: 'salvage, casing off', core: { marked: 17, blank: 20 }, rings: [2, 8, 7] },
      { id: 'l', label: 'SPEC L', note: 'salvage, casing off', core: { marked: 18, blank: 18 }, rings: [2, 8, 8] },
      { id: 'm', label: 'SPEC M', note: 'salvage, casing off', core: { marked: 16, blank: 19 }, rings: [2, 8, 6] }
    ],
    widget: {
      type: 'bins',
      rows: ['k', 'l', 'm'],
      bins: [
        { id: 'same', label: 'Will do the same job', note: 'Ship it against the contract.' },
        { id: 'other', label: 'Will not', note: 'Hold it back off the manifest.' }
      ]
    },
    hints: [
      'Site two settled that what a piece does is decided by the electrons on its outermost shell. Set the view to "Outside" and count that shell on all four.',
      'The reference and SPEC K have exactly the same outside: 2, 8 and 7. SPEC L carries 8 out there and SPEC M carries 6.',
      'Now look at "The middle" on the reference and SPEC K. They hold the same number of crosses and a different number of blanks, which is the only difference between them — and it is not the part that reacts.'
    ],
    check(state) {
      const want = { k: 'same', l: 'other', m: 'other' };
      const labels = { k: 'SPEC K', l: 'SPEC L', m: 'SPEC M' };
      for (const id of ['k', 'l', 'm']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no line on the manifest yet.` };
      }
      if (state.bins.k !== want.k) {
        return { ok: false, msg: 'SPEC K is filed incorrectly. Its outside is 2, 8 and 7, exactly like the reference, so it reacts exactly like the reference; the extra blanks in the middle only make it heavier.' };
      }
      if (state.bins.l !== want.l) {
        return { ok: false, msg: 'SPEC L is filed incorrectly. It carries 8 on its outermost shell where the reference carries 7, and a full shell behaves nothing like one that is a short.' };
      }
      if (state.bins.m !== want.m) {
        return { ok: false, msg: 'SPEC M is filed incorrectly. It weighs the same as the reference, but it carries 6 on its outermost shell where the reference carries 7, and weight is not what reacts.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One canister shipped against contract, two held back.',
      title: 'Isotopes Are Chemically Identical',
      body: 'Isotopes of an element differ only in neutrons, and neutrons take no part in chemistry: the same proton count means the same electron count, which means the same outermost shell and the same behaviour. That is why chlorine-35 and chlorine-37 are interchangeable in a reaction, while sulfur-35 — the same weight as one of them — is not.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Needle Is Not On Zero',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'Cargo four came off a thruster line welded shut, and its label never got a needle reading stamped on it. An open reference off the same line is on the bench with it.'
    },
    prompt: 'Read the needle on both pieces, then log how many protons and how many electrons SPEC C is carrying.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'r2', label: 'REF 02', note: 'LABEL // CAT 03 // MASS NUMBER 7 · casing off', core: { marked: 3, blank: 4 }, rings: [2] },
      {
        id: 'c', label: 'SPEC C',
        note: 'LABEL // CAT 11 // MASS NUMBER 23 // NEEDLE UNSTAMPED · welded shut',
        core: { marked: 11, blank: 12 }, rings: [2, 8], casing: true
      }
    ],
    widget: {
      type: 'pair',
      label: 'Ledger line — SPEC C',
      min: 0, max: 30,
      fields: ['Protons', 'Electrons']
    },
    hints: [
      'Read the needle on REF 02 first, then count it: 3 crosses in "The middle" and 2 electrons in "Outside". Its needle reads plus one.',
      'So the needle is doing one subtraction — the crosses count up, the electrons count down, and what is left over is what it shows. Now read the needle on SPEC C.',
      'SPEC C reads plus one as well, and its label stamps CAT 11, so 11 protons. One more proton than electrons means there are 10 electrons.'
    ],
    check(state) {
      if (!state.metered.has('c')) {
        return { ok: false, notYet: true, msg: 'The needle has not been on SPEC C yet. Select it and click "Read Needle".' };
      }
      if (!state.metered.has('r2')) {
        return { ok: false, notYet: true, msg: 'Put the needle on REF 02 as well. One reading on its own says nothing about what the needle is measuring.' };
      }
      const [p, e] = state.numbers;
      if (p === 0 && e === 0) {
        return { ok: false, notYet: true, msg: 'The ledger line is still blank. Set the two counts.' };
      }
      if (p !== 11) {
        return { ok: false, msg: 'On REF 02 the catalogue code and the crosses came out the same, and SPEC C stamps CAT 11.' };
      }
      if (e === 11) {
        return { ok: false, msg: '11 electrons against 11 protons would cancel and put the needle on zero. SPEC C is reading plus one, the way REF 02 does.' };
      }
      if (e === 12) {
        return { ok: false, msg: 'An extra electron would drive the needle the other way, to minus one. Both pieces on this bench read plus.' };
      }
      if (e !== 10) {
        return { ok: false, msg: 'Count it the way REF 02 does it: plus one means the protons outnumber the electrons by exactly one.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC C ledgered at plus one: 11 protons, 10 electrons.',
      title: 'Net Charge Is Protons Minus Electrons',
      body: 'The needle is doing one subtraction and nothing else: protons count up, electrons count down, and what is left over is the net charge. Nothing on SPEC C has been added to or taken from the nucleus, so it is still CAT 11 and still mass number 23 — it is simply short one electron.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Drive It Positive',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'The Avalon\'s thrusters take charged propellant at plus two and the drum we have is sitting neutral. SPEC D is mounted with its outside resolving.'
    },
    prompt: 'Strip electrons off SPEC D until the needle reads plus two, then log how many you took.',
    controls: ['field', 'meter', 'strip', 'reset'],
    specimens: [
      { id: 'd', label: 'SPEC D', note: 'propellant drum, casing off', core: { marked: 12, blank: 12 }, rings: [2, 8, 2] }
    ],
    widget: { type: 'number', min: 0, max: 6, label: 'Electrons stripped' },
    hints: [
      'Click "Fire Stripper" to knock one electron off, then "Read Needle" to see what it did. "Reset Specimen" puts everything back.',
      'Each electron taken off leaves one more proton with nothing to cancel it, so the needle climbs by one every time.',
      'This piece carries 12 electrons against 12 protons. Fire the stripper twice to leave 10, which reads plus two, then set the counter to 2.'
    ],
    check(state) {
      const taken = state.stripped.d || 0;
      if (taken === 0) {
        return { ok: false, notYet: true, msg: 'SPEC D is untouched and the needle sits on zero. Click "Fire Stripper".' };
      }
      if (taken !== 2) {
        return { ok: false, msg: `The needle is reading plus ${taken}. The thrusters take plus two — use "Reset Specimen" if you have gone past it.` };
      }
      if (state.number !== 2) {
        return { ok: false, msg: `The counter reads ${state.number} and ${taken} electrons have come off the drum. Set it to 2.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC D driven to plus two. Propellant signed off.',
      title: 'Cations · An Atom Short Of Electrons',
      body: 'An atom carrying a positive charge is called a cation, and it is made the only way a charge can be made: by moving electrons, never by touching the nucleus. Metals form them readily because their outer shell holds only one or two electrons to start with, which is exactly what you stripped.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Fill It Past Neutral',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'The scrubber cartridge needs its working element loaded with a full outer shell, not a neutral one. SPEC E arrived with its electrons stripped off entirely for transport.'
    },
    prompt: 'Load SPEC E with enough electrons to fill its outer shell completely, and lay them on the shells correctly.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'e', label: 'SPEC E', note: 'scrubber element, electrons removed for transport', core: { marked: 17, blank: 18 }, rings: [] }
    ],
    target: 'e',
    widget: {
      type: 'rings',
      label: 'Shell loading — SPEC E',
      total: 18,
      rings: ['Shell 1 — nearest', 'Shell 2', 'Shell 3 — outermost']
    },
    hints: [
      'The shell counters are on the deck: a minus key and a plus key on each row, and SPEC E redraws on the bench as you load it.',
      'A shell holds 2 nearest in and 8 after that, and nothing sits further out while a nearer shell still has room. Fill shell 1, then shell 2, then put the rest on shell 3.',
      'Loading 2, 8 and 8 fills the outer shell. That is 18 electrons against 17 protons, so the needle will settle on minus one.'
    ],
    check(state) {
      const placed = state.rings.reduce((n, r) => n + r, 0);
      if (placed === 0) {
        return { ok: false, notYet: true, msg: 'Nothing loaded yet. Use the plus keys on the deck to put electrons on the shells.' };
      }
      if (state.rings[0] > 2) {
        return { ok: false, msg: 'Too many on shell 1. The nearest shell holds 2 and never more.' };
      }
      if (state.rings[1] > 8 || state.rings[2] > 8) {
        return { ok: false, msg: 'Too many on a shell. After the first, a shell holds 8.' };
      }
      if (state.rings[0] < 2 || (state.rings[2] > 0 && state.rings[1] < 8)) {
        return { ok: false, msg: 'Nothing sits on an outer shell while an inner one still has room. Fill shell 1, then shell 2.' };
      }
      if (placed === 17) {
        return { ok: false, msg: '17 electrons cancels the 17 protons and leaves the outer shell one short of full. The cartridge needs the shell filled, not the needle zeroed.' };
      }
      if (placed !== 18) {
        return { ok: false, msg: `${placed} electrons are loaded. A full outer shell here is 8, on top of 2 and 8 further in.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'SPEC E loaded 2 / 8 / 8. Needle at minus one.',
      title: 'Anions · An Atom With An Electron Too Many',
      body: 'An atom carrying a negative charge is called an anion, and this is why one forms: 17 protons hold 18 electrons because filling the outer shell is worth more than balancing the needle. Nonmetals sit one or two electrons short of a full shell, so they take rather than give, and what you have built is a chloride ion.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Balance The Shipment',
    field: 'rings',
    briefing: {
      speaker: SPEAKER,
      body: 'The hold will not take a charged load, so whatever goes in it has to come out neutral overall. Two charged stocks are on the bench and the surveyor wants the smallest crate that balances.'
    },
    prompt: 'Work out the fewest canisters of each stock that add up to zero charge, and log both counts.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 's', label: 'STOCK S', note: 'charged stock, casing off', core: { marked: 12, blank: 12 }, rings: [2, 8] },
      { id: 't', label: 'STOCK T', note: 'charged stock, casing off', core: { marked: 17, blank: 18 }, rings: [2, 8, 8] }
    ],
    widget: {
      type: 'pair',
      label: 'Crate manifest',
      min: 0, max: 8,
      fields: ['Canisters of STOCK S', 'Canisters of STOCK T']
    },
    hints: [
      'Put the needle on both stocks before you count anything. One reads plus two and the other reads minus one.',
      'Every canister of STOCK S you load puts plus two into the crate, and every canister of STOCK T takes one away. The crate leaves when those cancel exactly.',
      'One STOCK S is plus two, so it takes two of STOCK T to bring it back to zero. The answer is 1 and 2.'
    ],
    check(state) {
      if (state.metered.size < 2) {
        return { ok: false, notYet: true, msg: 'Both stocks need a needle reading before a crate can be manifested.' };
      }
      const [s, t] = state.numbers;
      if (s === 0 && t === 0) {
        return { ok: false, notYet: true, msg: 'The crate is empty. Set how many canisters of each go in it.' };
      }
      if (s === 0 || t === 0) {
        return { ok: false, msg: 'A crate of one stock alone cannot come out neutral — either one carries a charge and nothing cancels it.' };
      }
      const net = s * 2 - t;
      if (net !== 0) {
        return { ok: false, msg: `That crate comes to ${net > 0 ? 'plus' : 'minus'} ${Math.abs(net)}. STOCK S is plus two each and STOCK T is minus one each; they have to cancel exactly.` };
      }
      if (s !== 1) {
        return { ok: false, msg: 'That balances, but it is not the smallest crate that does. Halve both counts until one of them will not divide again.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Crate manifested 1 : 2. Hold accepts.',
      title: 'Charges Cancel, In Whole Pieces',
      body: 'Anything that leaves this flat has to be neutral overall, and a canister cannot be split, so the counts have to be whole numbers that cancel exactly: one at plus two needs two at minus one. That ratio is not a shipping rule — it is why magnesium and chlorine combine one to two and never any other way.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'File The Ledger',
    field: 'core',
    briefing: {
      speaker: SPEAKER,
      body: 'Four welded canisters are left and the shuttle is on the pad. The contracted standard is open on the bench, and its own label reads CAT 08, mass number 16, needle zero.'
    },
    prompt: 'File all four welded canisters against the contracted standard on the bench.',
    controls: ['field', 'meter'],
    specimens: [
      { id: 'std', label: 'STANDARD', note: 'LABEL // CAT 08 // MASS NUMBER 16 // NEEDLE 0 · casing off', core: { marked: 8, blank: 8 }, rings: [2, 6] },
      { id: 'n1', label: 'SPEC N', note: 'LABEL // CAT 08 // MASS NUMBER 18 // NEEDLE 0 · welded shut', core: { marked: 8, blank: 10 }, rings: [2, 6], casing: true },
      { id: 'n2', label: 'SPEC P', note: 'LABEL // CAT 08 // MASS NUMBER 16 // NEEDLE MINUS 2 · welded shut', core: { marked: 8, blank: 8 }, rings: [2, 8], casing: true },
      { id: 'n3', label: 'SPEC R', note: 'LABEL // CAT 07 // MASS NUMBER 16 // NEEDLE 0 · welded shut', core: { marked: 7, blank: 9 }, rings: [2, 5], casing: true },
      { id: 'n4', label: 'SPEC T', note: 'LABEL // CAT 08 // MASS NUMBER 16 // NEEDLE 0 · welded shut', core: { marked: 8, blank: 8 }, rings: [2, 6], casing: true }
    ],
    widget: {
      type: 'bins',
      rows: ['n1', 'n2', 'n3', 'n4'],
      bins: [
        { id: 'match', label: 'Meets the standard', note: 'Ship it as contracted.' },
        { id: 'heavy', label: 'Right element, extra neutrons', note: 'Heavier than the standard.' },
        { id: 'charged', label: 'Right element, carrying a charge', note: 'The electron count is off.' },
        { id: 'other', label: 'Wrong element', note: 'The catalogue code does not match.' }
      ]
    },
    hints: [
      'Count the standard in both views and check it against its own stamps, so you know the three stamps mean what you think they mean. Then read all four labels against it.',
      'The catalogue code is the first test: only a canister stamped CAT 08 can meet the standard at all, whatever else it says.',
      'SPEC N is CAT 08 at mass number 18, so two extra neutrons. SPEC P is CAT 08 at 16 but reads minus 2, so two extra electrons. SPEC R is CAT 07 and out. SPEC T matches on all three stamps.'
    ],
    check(state) {
      const want = { n1: 'heavy', n2: 'charged', n3: 'other', n4: 'match' };
      const labels = { n1: 'SPEC N', n2: 'SPEC P', n3: 'SPEC R', n4: 'SPEC T' };
      for (const id of ['n1', 'n2', 'n3', 'n4']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no line in the ledger yet.` };
      }
      if (state.bins.n1 !== want.n1) {
        return { ok: false, msg: 'SPEC N is filed incorrectly. It is CAT 08 with a needle on zero, so the element and the electrons are right; only its mass number is two above the standard.' };
      }
      if (state.bins.n2 !== want.n2) {
        return { ok: false, msg: 'SPEC P is filed incorrectly. Its code and mass number match the standard exactly, so the nucleus is right and the minus-2 needle can only be electrons.' };
      }
      if (state.bins.n3 !== want.n3) {
        return { ok: false, msg: 'SPEC R is filed incorrectly. It is stamped CAT 07, and no reading anywhere else can make a CAT 07 piece into a CAT 08 one.' };
      }
      if (state.bins.n4 !== want.n4) {
        return { ok: false, msg: 'SPEC T is filed incorrectly. All three of its stamps are the standard\'s: CAT 08, mass number 16, needle on zero.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Ledger closed. Four canisters signed, shuttle away.',
      title: 'Three Numbers Describe Any Piece',
      body: 'Atomic number says what the piece is, mass number says how heavy that particular one is, and net charge says what it is carrying — and each of the three can be changed without touching the other two. Get all three and you have described a piece of matter completely, which is the whole of what a ledger line is for.',
      last: true
    }
  }

];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'VESS // TALLOW TALLY FLOOR',
  sections: [
    {
      heading: 'Ledger Signed',
      body: 'Every canister on this flat is now written down the way Imperial survey writes them, and the surveyor did not query one line. That is a hold full of cargo described by three numbers each, and you took every one of those numbers yourself.'
    },
    {
      heading: 'What Each Number Does',
      body: 'Change the protons and it is a different element. Change the neutrons and it is the same element, heavier — an isotope, which behaves identically because nothing outside has moved. Change the electrons and it is an ion: a cation if you took some away, an anion if you put some on.'
    },
    {
      heading: 'Next: The Number That Nothing Weighs',
      body: 'Look at the catalogue cards again and you will see that almost none of the listed masses are whole numbers, and a mass number always is. On the Hopper Gantry you will pour a whole crate over the separator and find out what the card is really quoting.'
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
    explanation: 'Mass number counts protons plus neutrons only: 15 + 16 = 31. Electrons weigh so little that they are left out of it entirely.'
  },
  {
    question: 'A neutral atom is written as chlorine-37 (atomic number 17). How many neutrons does it carry?',
    options: [
      { id: 'a', label: '17' },
      { id: 'b', label: '20' },
      { id: 'c', label: '37' },
      { id: 'd', label: '54' }
    ],
    answer: 'b',
    explanation: 'The number after the name is the mass number. Subtract the atomic number from it: 37 − 17 = 20 neutrons.'
  },
  {
    question: 'Chlorine-35 and chlorine-37 are both put in the same reaction. What happens?',
    options: [
      { id: 'a', label: 'They react in exactly the same way' },
      { id: 'b', label: 'Chlorine-37 reacts faster because it is heavier' },
      { id: 'c', label: 'Only chlorine-35 reacts at all' },
      { id: 'd', label: 'They react as two different elements' }
    ],
    answer: 'a',
    explanation: 'Isotopes differ only in neutrons, and chemistry is done by electrons. Same proton count means the same electron arrangement, so isotopes of an element are chemically interchangeable.'
  },
  {
    question: 'A magnesium atom (12 protons) loses 2 electrons. What has it become?',
    options: [
      { id: 'a', label: 'A different element with 10 protons' },
      { id: 'b', label: 'An anion with a charge of −2' },
      { id: 'c', label: 'A cation with a charge of +2' },
      { id: 'd', label: 'An isotope of magnesium' }
    ],
    answer: 'c',
    explanation: 'Losing electrons leaves protons uncancelled, so the charge goes positive: 12 protons and 10 electrons is Mg²⁺, a cation. The nucleus was never touched, so it is still magnesium.'
  },
  {
    question: 'An ion carries a charge of +3 and has 10 electrons. How many protons does it have?',
    options: [
      { id: 'a', label: '7' },
      { id: 'b', label: '10' },
      { id: 'c', label: '13' },
      { id: 'd', label: '30' }
    ],
    answer: 'c',
    explanation: 'Charge is protons minus electrons, so protons = charge + electrons = 3 + 10 = 13. That makes it aluminium, Al³⁺.'
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
      commitLabel: stage.widget.type === 'bins' ? 'File Ledger' : 'Commit'
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
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="reset">Reset Specimen</button>');
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
      soundscape.playToggleClack?.();
      renderReadout(null, {
        head: `Bench // ${labelFor(state.sample)}`,
        body: 'Specimen restored. Every electron taken off it is back on its shell.'
      });
      return;
    }

    if (!state.sample) {
      frame.note('Nothing selected. Tap a specimen on the bench first.');
      return;
    }
    const id = state.sample;

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

    if (tool === 'strip') {
      busy = true;
      frame.clearBanner();
      frame.setCommitEnabled(false);
      const ring = await bench.strip(id);
      if (ring === null) {
        renderReadout(null, {
          head: `Stripper // ${labelFor(id)}`,
          body: 'Nothing left outside to take. The nucleus does not come off with this.'
        });
      } else {
        state.stripped[id] = (state.stripped[id] || 0) + 1;
        soundscape.playBondSnap?.();
        renderReadout(null, {
          head: `Stripper // ${labelFor(id)}`,
          body: `One electron knocked clear of shell ${ring + 1}. Put the needle back on it.`
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
            ? 'The whole canister, at its own scale. Nothing inside resolves at this field.'
            : state.field === 'core'
              ? 'The nucleus is up on the screen. Click a grain to put the needle on that one.'
              : 'The shells are up on the screen. Click a piece to put the needle on that one.'}</p>
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
          ? `<div class="lq-readout-hold">This nucleus holds ${massNumber(spec)} grains in all, crossed and blank together.</div>`
          : ''}
        ${hit.part === 'light'
          ? `<div class="lq-readout-hold">Sitting on shell ${hit.ring + 1}, out from the nucleus.</div>`
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
              <div class="lq-build-row" data-slot="${fi}">
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
          <p class="form-help cb-remaining">${w.total} electrons available. Use the plus and minus keys on each shell.</p>
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
              ? 'All available electrons are loaded. Move them between shells with the minus and plus keys.'
              : `${left} of the ${w.total} still in the loader.`;
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
          <span class="form-label">Ledger</span>
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
