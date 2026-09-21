/**
 * q3-catalogue.js — Tallow, site three: THE CATALOGUE NUMBERS.
 *
 * The third game on the Learn road, and the one the last two benches have been
 * setting up. The sampler scope has filed every kind it meets under a CAT number
 * since site one and never said what the number counts. The core bench spent
 * eight stages counting protons. This bench puts the two together, and the
 * answer is the periodic table.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  order six unmarked cards by proton count -> Atomic Number
 *   2  measure how long the pattern runs        -> Periods · the rows
 *   3  lay the third row into the board         -> The Periodic Table
 *   4  read a column instead of a row           -> Groups · the columns
 *   5  find the column that never trades        -> Noble Gases
 *   6  file six cards by what they do           -> Metals and Nonmetals
 *   7  price a card that is not in the drawer   -> The chart predicts
 *   8  file four unmarked cards into the chart  -> One number orders everything
 *
 * VOCABULARY IS EARNED, THEN USED. Everything the first two benches taught —
 * proton, neutron, electron, shell, valence, element, isotope, ion — is a plain
 * word here and is used like one. What this bench withholds is its OWN
 * vocabulary, and `VOCABULARY` below says which stage's reward card pays each
 * one out. `verify:learn` fails the build both ways round.
 *
 * COPY RULE: one briefing, on stage one, saying what the bench does. After that
 * every stage is a plain imperative prompt, three short hints and a reward card.
 * No story rides on top of it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings. It
 * reports through `ctx` and nothing else.
 */

import { CatalogueBoard } from '../../engine/instruments.js';
import { LearnFrame, toolNotes } from '../../engine/frame.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned. `introducedAt` is the stage whose REWARD
 * CARD first names it; play copy may use it from the stage after. Nothing here
 * is player-facing.
 */
export const VOCABULARY = [
  { term: /\batomic number\b/i, introducedAt: 1 },
  { term: /\bperiods?\b/i, introducedAt: 2 },
  { term: /\bperiodic\b/i, introducedAt: 3 },
  { term: /\bgroups?\b/i, introducedAt: 4 },
  { term: /\bnoble\b/i, introducedAt: 5 },
  { term: /\bmetals?\b/i, introducedAt: 6 },
  { term: /\bnonmetals?\b/i, introducedAt: 6 },
  { term: /\balkali\b/i, introducedAt: 6 },
  { term: /\bhalogens?\b/i, introducedAt: 6 }
];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE KEY LEGEND

   A CARD INDEX DOES NOT COME WITH A MANUAL.

   This table used to carry three lines: that tapping a card reads it,
   that tapping a slot files the card in your hand, and that Clear Board
   clears the board. A player who has picked up a card and put it in a
   slot has learned all three by doing them once, and reading about it
   first is slower than trying it. The lines are gone and nothing was
   lost with them.
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

/* ------------------------------------------------------------------
   THE CARDS
   One card per kind the scope has logged. Every reading on a card is one
   the player has already taken with their own hands on an earlier bench:
   the proton count came off the core bench, the outer-shell count off the
   ring field, the mass off the sampler scope.

   That the CAT codes are also the proton counts is the thing this bench
   exists to reveal, so nothing below says so.
   ------------------------------------------------------------------ */
export const CARDS = {
  c01: { code: 'CAT 01', name: 'HYDROGEN', z: 1, outer: 1, mass: 1.0, does: 'shares' },
  c02: { code: 'CAT 02', name: 'HELIUM', z: 2, outer: 2, mass: 4.0, does: 'inert' },
  c03: { code: 'CAT 03', name: 'LITHIUM', z: 3, outer: 1, mass: 6.9, does: 'gives' },
  c04: { code: 'CAT 04', name: 'BERYLLIUM', z: 4, outer: 2, mass: 9.0, does: 'gives' },
  c05: { code: 'CAT 05', name: 'BORON', z: 5, outer: 3, mass: 10.8, does: 'gives' },
  c06: { code: 'CAT 06', name: 'CARBON', z: 6, outer: 4, mass: 12.0, does: 'shares' },
  c07: { code: 'CAT 07', name: 'NITROGEN', z: 7, outer: 5, mass: 14.0, does: 'takes' },
  c08: { code: 'CAT 08', name: 'OXYGEN', z: 8, outer: 6, mass: 16.0, does: 'takes' },
  c09: { code: 'CAT 09', name: 'FLUORINE', z: 9, outer: 7, mass: 19.0, does: 'takes' },
  c10: { code: 'CAT 10', name: 'NEON', z: 10, outer: 8, mass: 20.2, does: 'inert' },
  c11: { code: 'CAT 11', name: 'SODIUM', z: 11, outer: 1, mass: 23.0, does: 'gives' },
  c12: { code: 'CAT 12', name: 'MAGNESIUM', z: 12, outer: 2, mass: 24.3, does: 'gives' },
  c13: { code: 'CAT 13', name: 'ALUMINUM', z: 13, outer: 3, mass: 27.0, does: 'gives' },
  c14: { code: 'CAT 14', name: 'SILICON', z: 14, outer: 4, mass: 28.1, does: 'shares' },
  c15: { code: 'CAT 15', name: 'PHOSPHORUS', z: 15, outer: 5, mass: 31.0, does: 'takes' },
  c16: { code: 'CAT 16', name: 'SULFUR', z: 16, outer: 6, mass: 32.1, does: 'takes' },
  c17: { code: 'CAT 17', name: 'CHLORINE', z: 17, outer: 7, mass: 35.5, does: 'takes' },
  c18: { code: 'CAT 18', name: 'ARGON', z: 18, outer: 8, mass: 39.9, does: 'inert' },
  c19: { code: 'CAT 19', name: 'POTASSIUM', z: 19, outer: 1, mass: 39.1, does: 'gives' }
};

/** What each card does when another atom is pushed at it. */
export const DOES_TEXT = {
  gives: 'Hands one electron over.',
  takes: 'Pulls one electron off the other atom and keeps it.',
  shares: 'Neither gives nor takes. It holds on to a partner instead.',
  inert: 'Nothing at all. It will not trade either way.'
};

/** The run of cards in catalogue order. */
const RUN_18 = ['c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09',
  'c10', 'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18'];

/** The chart as it stands once the rows are laid: eight across, a gap is a gap. */
const CHART_ROWS = [
  ['c01', null, null, null, null, null, null, 'c02'],
  ['c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09', 'c10'],
  ['c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18']
];

const COLUMN_HEADS = ['1', '2', '3', '4', '5', '6', '7', '8'];

/** The chart with one entry swapped for a slot the player has to fill. */
function chartWithSlots(swaps) {
  return CHART_ROWS.map(row => row.map(id => (id && swaps[id]) ? `#${swaps[id]}` : id));
}

/* ------------------------------------------------------------------
   THE EIGHT STAGES

   Exported because every `check` is a pure function of the board state,
   which is what makes them checkable without a browser. `verify:learn`
   runs SOLUTIONS and MISSES through them.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Put Them In Order',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench is a card index with one card for every kind of atom, and a board to lay them out on.'
    },
    prompt: 'File the six cards in the slots, fewest protons on the left.',
    controls: ['reader', 'file', 'clear'],
    masked: true,
    board: { label: 'Reference strip', rows: [['#p1', '#p2', '#p3', '#p4', '#p5', '#p6']] },
    drawer: ['c11', 'c19', 'c01', 'c18', 'c08', 'c06'],
    widget: { type: 'board', label: 'Reference strip' },
    hints: [
      'Tap a card in the drawer to read it, then tap a slot to put it there.',
      'Read all six first. The proton counts are 1, 6, 8, 11, 18 and 19.',
      'Left to right: HYDROGEN, CARBON, OXYGEN, SODIUM, ARGON, POTASSIUM.'
    ],
    check(state) {
      const want = ['c01', 'c06', 'c08', 'c11', 'c18', 'c19'];
      const slots = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
      const filed = slots.filter(s => state.board[s]).length;
      if (filed < 6) {
        return { ok: false, notYet: true, msg: `Fill all six slots first — ${filed} of them are filled.` };
      }
      const got = slots.map(s => state.board[s]);
      if (got.join() === want.join()) return { ok: true };
      const byMass = ['c01', 'c06', 'c08', 'c11', 'c19', 'c18'];
      if (got.join() === byMass.join()) {
        return { ok: false, msg: 'That is the order they weigh, not the order they count — ARGON is heavier than POTASSIUM but has fewer protons.' };
      }
      for (let i = 1; i < got.length; i++) {
        const a = CARDS[got[i - 1]];
        const b = CARDS[got[i]];
        if (a && b && a.z > b.z) {
          return { ok: false, msg: `${a.name} has ${a.z} protons and ${b.name} has ${b.z}, so ${a.name} cannot come first.` };
        }
      }
      return { ok: false, msg: 'Something is out of order — read the proton counts again and put the smallest on the left.' };
    },
    reward: {
      log: 'Six cards laid in count order.',
      title: 'Atomic Number',
      body: 'Put the codes back on those cards and they read CAT 01, 06, 08, 11, 18, 19 — the order you just laid them in. The scope has been filing every kind by its proton count all along. That count is called the atomic number.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Find The Repeat',
    prompt: 'Ignoring the first two cards, count how many go by before the outer-shell count starts over at 1.',
    controls: ['reader'],
    board: { label: 'All 18 cards, in atomic number order', rows: [RUN_18] },
    drawer: [],
    widget: { type: 'number', min: 2, max: 18, label: 'Cards before it starts over' },
    hints: [
      'Tap the cards one by one and read the outer-shell electron count on each.',
      'Along the row the counts go 1, 2, then 1, 2, 3, 4, 5, 6, 7, 8, then 1 again.',
      'LITHIUM to NEON is eight cards, and SODIUM starts over, so the answer is 8.'
    ],
    check(state) {
      if (state.number === 8) return { ok: true };
      if (state.number === 2) {
        return { ok: false, notYet: true, msg: 'The counter has not moved yet — read the cards and set it.' };
      }
      if (state.number === 18) {
        return { ok: false, msg: 'That is every card in the row, not how far it gets before the count starts over.' };
      }
      if (state.number === 10) {
        return { ok: false, msg: 'That includes the first two cards — start counting at LITHIUM, where the count drops back to 1.' };
      }
      return { ok: false, msg: 'Count again from LITHIUM, which reads 1, up to the card before SODIUM, which reads 1 again.' };
    },
    reward: {
      log: 'Repeat measured at 8.',
      title: 'Periods',
      body: 'The outer-shell count climbs and starts over, again and again, because one shell fills up and a new one opens. Break the row wherever it starts over and you get shorter rows: 2, then 8, then 8. Each of those rows is called a period.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Lay The Last Row',
    prompt: 'File the eight loose cards into the empty bottom row, in atomic number order, left to right.',
    controls: ['reader', 'file', 'clear'],
    board: {
      label: 'Reference chart',
      columns: COLUMN_HEADS,
      rows: [
        CHART_ROWS[0],
        CHART_ROWS[1],
        ['#r1', '#r2', '#r3', '#r4', '#r5', '#r6', '#r7', '#r8']
      ]
    },
    drawer: ['c16', 'c11', 'c14', 'c18', 'c12', 'c17', 'c13', 'c15'],
    widget: { type: 'board', label: 'Bottom row' },
    hints: [
      'Tap a card in the drawer to pick it up, then tap the slot you want it in.',
      'These cards still carry their codes: CAT 11 is the lowest and CAT 18 is the highest.',
      'Left to right: SODIUM, MAGNESIUM, ALUMINUM, SILICON, PHOSPHORUS, SULFUR, CHLORINE, ARGON.'
    ],
    check(state) {
      const want = ['c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18'];
      const slots = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'];
      const filed = slots.filter(s => state.board[s]).length;
      if (filed < 8) {
        return { ok: false, notYet: true, msg: `Fill all eight slots first — ${filed} of them are filled.` };
      }
      const got = slots.map(s => state.board[s]);
      if (got.join() === want.join()) return { ok: true };
      for (let i = 0; i < got.length; i++) {
        if (got[i] !== want[i]) {
          const here = CARDS[got[i]];
          const there = CARDS[want[i]];
          return { ok: false, msg: `Slot ${i + 1} holds ${here.name} with ${here.z} protons, but ${there.name} with ${there.z} belongs there.` };
        }
      }
      return { ok: false, msg: 'The row is out of order — read the codes and lay them lowest on the left.' };
    },
    reward: {
      log: 'Chart complete: 18 cards, three rows.',
      title: 'The Periodic Table',
      body: 'That chart is the periodic table. You built it from two things you measured yourself: one number to put the cards in order, and one pattern to say where a row ends. Chemists have drawn it this way since Dmitri Mendeleev laid his own cards out in 1869.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Read Down, Not Along',
    prompt: 'Say how many electrons the cards in column 6 keep in their outer shells.',
    controls: ['reader'],
    board: { label: 'Reference chart', columns: COLUMN_HEADS, rows: CHART_ROWS },
    drawer: [],
    widget: { type: 'number', min: 0, max: 8, label: 'Outer-shell electrons in column 6' },
    hints: [
      'Column 6 is the sixth from the left. Tap OXYGEN, then tap SULFUR.',
      'Compare the two readouts. Both cards report the same outer-shell count.',
      'OXYGEN keeps 6 in its outer shell and so does SULFUR, so the answer is 6.'
    ],
    check(state) {
      if (state.number === 6) return { ok: true };
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'The counter is still on zero — set it to what the cards report.' };
      }
      if (state.number === 8) {
        return { ok: false, msg: 'That is the count in column 8, on the far right. Column 6 is two columns to the left.' };
      }
      if (state.number === 16) {
        return { ok: false, msg: 'That is how many protons SULFUR has, not how many electrons it keeps outside.' };
      }
      return { ok: false, msg: 'Read OXYGEN and SULFUR again and use the outer-shell number they both report.' };
    },
    reward: {
      log: 'Column 6 logged at 6 outer electrons.',
      title: 'Groups',
      body: 'A column of the periodic table is called a group, and every card in a group has the same number of outer-shell electrons. Those outer electrons decide how an atom behaves, so a group is a list of atoms that behave alike.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Ones That Will Not Trade',
    prompt: 'Pick the group whose cards never trade an electron.',
    controls: ['reader'],
    board: { label: 'Reference chart', columns: COLUMN_HEADS, rows: CHART_ROWS },
    drawer: [],
    widget: {
      type: 'choice',
      label: 'The group that never trades',
      options: [
        { id: 'g1', label: 'Group 1', note: 'HYDROGEN, LITHIUM, SODIUM.' },
        { id: 'g4', label: 'Group 4', note: 'CARBON, SILICON.' },
        { id: 'g7', label: 'Group 7', note: 'FLUORINE, CHLORINE.' },
        { id: 'g8', label: 'Group 8', note: 'HELIUM, NEON, ARGON.' }
      ]
    },
    hints: [
      'Tap one card from each of the four groups and read the last line of each readout.',
      'Three of them trade: one hands an electron over, one takes one on, one holds on to a partner.',
      'HELIUM, NEON and ARGON all do nothing at all, and all three sit in group 8.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four groups.' };
      }
      if (state.choice === 'g8') return { ok: true };
      if (state.choice === 'g1') {
        return { ok: false, msg: 'Group 1 does trade — LITHIUM and SODIUM both hand an electron over.' };
      }
      if (state.choice === 'g7') {
        return { ok: false, msg: 'Group 7 does trade — FLUORINE and CHLORINE both pull an electron off a partner.' };
      }
      return { ok: false, msg: 'CARBON and SILICON do not give or take, but they still hold on to a partner, so look for the group that does nothing at all.' };
    },
    reward: {
      log: 'Group 8 never trades.',
      title: 'Noble Gases',
      body: 'Group 8 are the noble gases, and they almost never react. Eight outer-shell electrons is a full shell, so there is nothing to gain by trading. Every other atom on the chart is reaching for that full shell, which is why it trades at all.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Sort Them By What They Do',
    prompt: 'File each of the six cards by what it does when another atom is pushed at it.',
    controls: ['reader'],
    board: { label: 'Reference chart', columns: COLUMN_HEADS, rows: CHART_ROWS },
    drawer: [],
    rows: ['c03', 'c12', 'c08', 'c17', 'c06', 'c10'],
    widget: {
      type: 'bins',
      rows: ['c03', 'c12', 'c08', 'c17', 'c06', 'c10'],
      bins: [
        { id: 'gives', label: 'Hands one over', note: 'Gives an electron away.' },
        { id: 'takes', label: 'Takes one on', note: 'Pulls an electron off a partner.' },
        { id: 'holds', label: 'Holds on to a partner', note: 'Neither gives nor takes.' },
        { id: 'none', label: 'Does nothing', note: 'Will not trade at all.' }
      ]
    },
    hints: [
      'Tap all six cards. The last line of each readout says what that card does.',
      'A card with 1, 2 or 3 outer electrons lets them go; one with 5, 6 or 7 pulls one in.',
      'LITHIUM and MAGNESIUM hand one over, OXYGEN and CHLORINE take one on, CARBON holds on to a partner, and NEON does nothing.'
    ],
    check(state) {
      const want = { c03: 'gives', c12: 'gives', c08: 'takes', c17: 'takes', c06: 'holds', c10: 'none' };
      for (const id of Object.keys(want)) {
        if (!state.bins[id]) {
          return { ok: false, notYet: true, msg: `${CARDS[id].name} has no answer yet.` };
        }
      }
      for (const [id, expect] of Object.entries(want)) {
        if (state.bins[id] !== expect) {
          return { ok: false, msg: `${CARDS[id].name} is filed wrong — it keeps ${CARDS[id].outer} electrons in its outer shell, so read what its card says it does.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'All six filed by what they do.',
      title: 'Metals and Nonmetals',
      body: 'Atoms on the left of the chart hand electrons over, and those are the metals. Atoms on the right take electrons on, and those are the nonmetals. The keenest of each get their own name: group 1 are the alkali metals and group 7 are the halogens.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'The Card That Is Not There',
    prompt: 'One slot in the chart is empty. Work out the missing card\'s atomic number and what it will do.',
    controls: ['reader'],
    board: {
      label: 'Reference chart — one slot empty',
      columns: COLUMN_HEADS,
      rows: chartWithSlots({ c14: 'gap' })
    },
    drawer: [],
    widget: {
      type: 'numchoice',
      label: 'The missing card',
      min: 0,
      max: 20,
      numberLabel: 'Atomic number',
      choiceLabel: 'What it will do',
      options: [
        { id: 'gives', label: 'Hands one over', note: 'Like the cards on the left.' },
        { id: 'holds', label: 'Holds on to a partner', note: 'Like the rest of its group.' },
        { id: 'takes', label: 'Takes one on', note: 'Like the cards on the right.' }
      ]
    },
    hints: [
      'Tap the card to the left of the empty slot and the card to its right.',
      'ALUMINUM is 13 and PHOSPHORUS is 15, and the other card in that column is CARBON.',
      'The missing card is atomic number 14, and like CARBON above it, it holds on to a partner.'
    ],
    check(state) {
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'The counter is still on zero — set the number you are claiming.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick what the missing card will do.' };
      }
      if (state.number !== 14) {
        return { ok: false, msg: `The slot sits between ALUMINUM at 13 and PHOSPHORUS at 15, so ${state.number} cannot go there.` };
      }
      if (state.choice !== 'holds') {
        return { ok: false, msg: 'A card behaves like the rest of its column, and the other card in that column is CARBON, which holds on to a partner.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Missing card worked out: 14.',
      title: 'A Chart That Predicts',
      body: 'You just described an atom nobody at this bench has ever measured, using nothing but the shape of the chart. The card that belongs in that slot is silicon, atomic number 14. Mendeleev did exactly this with three empty slots in 1871 and was proved right on all three.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Fill The Chart',
    prompt: 'File each of the four unmarked cards into the slot its proton count gives it.',
    controls: ['reader', 'file', 'clear'],
    masked: true,
    board: {
      label: 'Reference chart — four slots open',
      columns: COLUMN_HEADS,
      rows: chartWithSlots({ c04: 's1', c07: 's2', c13: 's3', c16: 's4' })
    },
    drawer: ['c16', 'c04', 'c13', 'c07'],
    widget: { type: 'board', label: 'Open slots' },
    hints: [
      'Tap each card to read it. The readout still gives a proton count with the code missing.',
      'The four counts are 4, 7, 13 and 16, and the chart runs in atomic number order.',
      'The cards reading 4 and 7 go in the middle row; the cards reading 13 and 16 go in the bottom row.'
    ],
    check(state) {
      const want = { s1: 'c04', s2: 'c07', s3: 'c13', s4: 'c16' };
      const filed = Object.keys(want).filter(s => state.board[s]).length;
      if (filed < 4) {
        return { ok: false, notYet: true, msg: `Fill all four slots first — ${filed} of them are filled.` };
      }
      for (const [slot, card] of Object.entries(want)) {
        if (state.board[slot] !== card) {
          const got = CARDS[state.board[slot]];
          return { ok: false, msg: `One slot holds a card with ${got.z} protons, but the cards beside it put ${CARDS[card].z} in that place.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Chart filled. Nineteen cards, all in place.',
      title: 'One Number Orders Everything',
      body: 'Every card on this chart was placed by one measurement: how many protons sit in its nucleus. The row it lands in, the group it joins, and whether it gives, takes, holds or does nothing all follow from that one number. That is why the periodic table is the reference chemists reach for first.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   Three short cards: what the player found, why the chart is shaped the
   way it is, and what the next bench is about.
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'Every kind of atom has an atomic number, which is simply how many protons it has. Put them in that order and a pattern repeats, which is what the periodic table is.'
    },
    {
      heading: 'Rows and Columns',
      body: 'A row is a period, and it ends when a shell fills up. A column is a group, and everything in it has the same outer-shell count, which is why it behaves the same way: metals on the left hand electrons over, nonmetals on the right take them on, and the noble gases at the edge want nothing.'
    },
    {
      heading: 'Next',
      body: 'Each card also carries a mass. The next bench describes every atom by its protons, its neutrons and its electrons, and the one after that asks why that mass is never a whole number.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   Five, shown at the END OF THE WORLD with the rest of Unit 1's.
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What does an element\'s atomic number count?',
    options: [
      { id: 'a', label: 'The protons in its nucleus' },
      { id: 'b', label: 'The neutrons in its nucleus' },
      { id: 'c', label: 'Everything in its nucleus added up' },
      { id: 'd', label: 'Its mass in grams' }
    ],
    answer: 'a',
    explanation: 'The atomic number is the proton count, and the periodic table is ordered by it. Change it and you have a different element.'
  },
  {
    question: 'Two elements sit in the same column of the periodic table. What do they share?',
    options: [
      { id: 'a', label: 'The same number of protons' },
      { id: 'b', label: 'The same number of outer-shell electrons' },
      { id: 'c', label: 'The same mass' },
      { id: 'd', label: 'The same number of neutrons' }
    ],
    answer: 'b',
    explanation: 'A column is a group, and everything in it has the same outer-shell count. That is why they react in similar ways.'
  },
  {
    question: 'Why do the noble gases in group 8 hardly react with anything?',
    options: [
      { id: 'a', label: 'They have no electrons at all' },
      { id: 'b', label: 'They are too heavy to move' },
      { id: 'c', label: 'Their outer shell is already full, so trading gains them nothing' },
      { id: 'd', label: 'They have no protons in the nucleus' }
    ],
    answer: 'c',
    explanation: 'Eight outer-shell electrons is a full shell. Every other element reacts because it is reaching for that; a noble gas already has it.'
  },
  {
    question: 'An element has 3 outer-shell electrons and sits on the left of the periodic table. What is it most likely to do?',
    options: [
      { id: 'a', label: 'Take electrons on, like a halogen' },
      { id: 'b', label: 'Hand its outer electrons over, like a metal' },
      { id: 'c', label: 'Refuse to react at all' },
      { id: 'd', label: 'Lose protons from its nucleus' }
    ],
    answer: 'b',
    explanation: 'With only 1, 2 or 3 outer electrons it is easier to give them away than to collect five more. Elements that do this are the metals.'
  },
  {
    question: 'A slot in the periodic table sits between aluminium (13) and phosphorus (15), in the same column as carbon. What can you say about the missing element?',
    options: [
      { id: 'a', label: 'Nothing, until someone measures it' },
      { id: 'b', label: 'Its atomic number is 14 and it behaves like carbon' },
      { id: 'c', label: 'Its atomic number is 14 but there is no telling what it does' },
      { id: 'd', label: 'It must be a noble gas' }
    ],
    answer: 'b',
    explanation: 'The table runs in atomic number order, so the slot is 14. A column shares outer-shell electrons, so it behaves like carbon.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return {
    board: {},
    number: stage.widget.type === 'number' || stage.widget.type === 'numchoice' ? stage.widget.min : null,
    choice: null,
    bins: {},
    read: new Set()
  };
}

/** The board state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { board: { p1: 'c01', p2: 'c06', p3: 'c08', p4: 'c11', p5: 'c18', p6: 'c19' } },
  { number: 8 },
  { board: { r1: 'c11', r2: 'c12', r3: 'c13', r4: 'c14', r5: 'c15', r6: 'c16', r7: 'c17', r8: 'c18' } },
  { number: 6, read: new Set(['c08', 'c16']) },
  { choice: 'g8', read: new Set(['c10', 'c17']) },
  { bins: { c03: 'gives', c12: 'gives', c08: 'takes', c17: 'takes', c06: 'holds', c10: 'none' } },
  { number: 14, choice: 'holds', read: new Set(['c13']) },
  { board: { s1: 'c04', s2: 'c07', s3: 'c13', s4: 'c16' } }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { board: { p1: 'c01', p2: 'c06', p3: 'c08', p4: 'c11', p5: 'c19', p6: 'c18' } },
  { number: 10 },
  { board: { r1: 'c11', r2: 'c12', r3: 'c13', r4: 'c15', r5: 'c14', r6: 'c16', r7: 'c17', r8: 'c18' } },
  { number: 16, read: new Set(['c08', 'c16']) },
  { choice: 'g7', read: new Set(['c10', 'c17']) },
  { bins: { c03: 'gives', c12: 'takes', c08: 'takes', c17: 'takes', c06: 'holds', c10: 'none' } },
  { number: 14, choice: 'gives', read: new Set(['c13']) },
  { board: { s1: 'c07', s2: 'c04', s3: 'c13', s4: 'c16' } }
];

/** Build a full board state for stage `i` from one of the sets above. */
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

  const board = new CatalogueBoard(frame.instrumentHost, {
    onProbe: id => onProbe(id),
    onPlace: (slotId, cardId) => onPlace(slotId, cardId),
    onLift: () => syncBoard()
  });

  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = null;
  let disposed = false;

  /* ---------------- stage lifecycle ---------------- */

  function faceFor(id, masked) {
    const c = CARDS[id];
    return masked
      ? { code: c.name, name: 'code missing', pips: null }
      : { code: c.code, name: c.name, pips: c.outer };
  }

  function loadStage(i) {
    index = i;
    const stage = STAGES[i];
    state = blankState(stage);

    const ids = new Set(stage.drawer || []);
    for (const row of stage.board?.rows || []) {
      for (const entry of row) if (entry && !String(entry).startsWith('#')) ids.add(entry);
    }
    const cards = {};
    for (const id of ids) cards[id] = faceFor(id, Boolean(stage.masked));

    frame.setCleared(cleared);
    frame.setStage({
      index: i,
      title: stage.title,
      prompt: stage.prompt,
      briefing: stage.briefing,
      hints: stage.hints,
      commitLabel: 'Commit'
    });

    board.setStage({
      cards,
      board: stage.board,
      drawer: (stage.drawer || []).slice(),
      drawerLabel: stage.masked ? 'Unmarked cards' : 'Loose cards'
    });

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

  /* ---------------- controls ---------------- */

  function renderControls() {
    const stage = STAGES[index];
    const parts = [];
    if (stage.controls.includes('clear')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="clear">Clear Board</button>');
    }
    // `reader` and `file` are affordances rather than keys: there is no button
    // for tapping a card. They still carry a legend, because the rule is about
    // what the player has to be told, not about what has a button.
    parts.push(toolNotes(
      stage.controls.map(id => toolNoteFor(id, index + 1)).filter(Boolean)
    ));
    frame.setControls(parts.join(''));
    frame.el.controls.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        board.clearBoard();
        syncBoard();
        soundscape.playToggleClack?.();
        renderReadout(null);
      });
    });
  }

  /* ---------------- instrument callbacks ---------------- */

  function onProbe(cardId) {
    state.read.add(cardId);
    soundscape.playScanSweep?.();
    renderReadout(cardId);
  }

  function onPlace(slotId, cardId) {
    if (!cardId) {
      frame.note('Take a card from the drawer first, then tap the slot.');
      return;
    }
    soundscape.playToggleClack?.();
    syncBoard();
  }

  function syncBoard() {
    state.board = board.placements();
  }

  /* ---------------- readout ---------------- */

  function renderReadout(cardId) {
    if (!cardId) {
      frame.setReadout(`
        <div class="lq-readout-card lq-readout-idle">
          <div class="lq-readout-head">Card reader // standby</div>
          <p class="lq-readout-line">Tap any card to read it.</p>
        </div>
      `);
      return;
    }
    const c = CARDS[cardId];
    const masked = Boolean(STAGES[index].masked);
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">Card reader // ${esc(c.name)}</div>
        <div class="lq-readout-code">${masked ? 'CODE MISSING' : esc(c.code)}</div>
        ${line('Protons', String(c.z))}
        ${line('Electrons in the outer shell', String(c.outer))}
        ${line('Mass of one atom', c.mass.toFixed(1))}
        <p class="lq-readout-line">${esc(DOES_TEXT[c.does])}</p>
      </div>
    `);
  }

  function line(label, value) {
    return `
      <div class="lq-meter cat-line">
        <span class="lq-meter-label">${esc(label)}</span>
        <span class="lq-meter-value">${esc(value)}</span>
      </div>
    `;
  }

  /* ---------------- answer widgets ---------------- */

  function renderWidget() {
    const stage = STAGES[index];
    const w = stage.widget;

    if (w.type === 'board') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <p class="form-help">Fill every slot on the board above, then press Commit.</p>
        </div>
      `);
      return;
    }

    if (w.type === 'number') {
      frame.setWidget(numberMarkup(w, state.number));
      bindNumber(w);
      return;
    }

    if (w.type === 'numchoice') {
      frame.setWidget(`
        ${numberMarkup({ ...w, label: w.numberLabel }, state.number)}
        <div class="lq-answer">
          <span class="form-label">${esc(w.choiceLabel)}</span>
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
      bindNumber(w);
      bindChoice();
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
      bindChoice();
      return;
    }

    if (w.type === 'bins') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">What each card does</span>
          <div class="lq-bins">
            ${w.rows.map(id => `
              <div class="lq-bin-row" data-row="${id}">
                <span class="lq-bin-sample">${esc(CARDS[id].name)}</span>
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
          const row = btn.closest('[data-row]');
          state.bins[row.dataset.row] = btn.dataset.bin;
          row.querySelectorAll('[data-bin]').forEach(o => o.classList.toggle('selected', o === btn));
          const bin = w.bins.find(b => b.id === btn.dataset.bin);
          board.setTag(row.dataset.row, bin ? bin.label : '');
          soundscape.playToggleClack?.();
        });
      });
    }
  }

  function numberMarkup(w, value) {
    return `
      <div class="lq-answer">
        <span class="form-label">${esc(w.label)}</span>
        <div class="lq-number">
          <button type="button" class="btn-secondary quest-btn-sm" data-num="-1" aria-label="Lower">&minus;</button>
          <span class="lq-number-value" aria-live="polite">${value}</span>
          <button type="button" class="btn-secondary quest-btn-sm" data-num="1" aria-label="Raise">+</button>
        </div>
      </div>
    `;
  }

  function bindNumber(w) {
    frame.el.widget.querySelectorAll('[data-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.number = Math.max(w.min, Math.min(w.max, state.number + Number(btn.dataset.num)));
        frame.el.widget.querySelector('.lq-number-value').textContent = String(state.number);
        soundscape.playToggleClack?.();
      });
    });
  }

  function bindChoice() {
    frame.el.widget.querySelectorAll('[data-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.choice = btn.dataset.choice;
        frame.el.widget.querySelectorAll('[data-choice]')
          .forEach(o => o.classList.toggle('selected', o === btn));
        soundscape.playToggleClack?.();
      });
    });
  }

  /* ---------------- go ---------------- */

  loadStage(index);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      board.dispose();
      frame.dispose();
    }
  };
}
