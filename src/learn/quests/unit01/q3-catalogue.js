/**
 * q3-catalogue.js — Tallow, site three: THE CATALOGUE NUMBERS.
 *
 * The third game on the Learn road, and the one the last two benches have been
 * setting up. The sampler scope has been filing every kind it meets under a CAT
 * number since site one and never said what the number counts. The core bench
 * spent eight stages counting protons and was told, out loud, that it does not
 * talk to the catalogue. This bench puts the two together, and the answer is the
 * periodic table.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  order six unmarked cards by proton count -> Atomic Number · the filing order
 *   2  measure how long the pattern runs        -> Periods · the rows
 *   3  lay the third row into the board         -> The Periodic Table
 *   4  read a column instead of a row           -> Groups · the columns
 *   5  find the column that never trades        -> Noble Gases · a full outer shell
 *   6  file six cards by what they do           -> Metals, Nonmetals and two families
 *   7  price a card that is not in the drawer   -> The table predicts what is missing
 *   8  file four unmarked cards into the chart  -> One number orders every kind there is
 *   -- debrief: the chart the buyer takes away, and what two kinds do when they meet.
 *
 * VOCABULARY IS EARNED, THEN USED. Everything the first two benches taught —
 * proton, neutron, electron, shell, valence, element, isotope, ion — is a plain
 * word here and is used like one. What this bench withholds is its OWN
 * vocabulary, and `VOCABULARY` below says which stage's reward card pays each
 * one out. `verify:learn` fails the build both ways round.
 *
 * WHAT THIS QUEST DOES NOT DO. It never weighs anything against a count. The
 * cards carry a mass and stage one uses it as the wrong answer, but the reason
 * the listed mass is not a whole number is site five's, and counting by weighing
 * is a whole other world's.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings. It
 * reports through `ctx` and nothing else.
 */

import { CatalogueBoard } from '../../engine/catalogue.js';
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

   NOTHING ON THIS BENCH IS NAMED WITHOUT BEING EXPLAINED (CLAUDE.md, and
   PRODUCT.md principle 2). That covers the affordances as well as the keys:
   "tap a card to read it" is not obvious to somebody who has never seen a card
   index, and the two-tap file is the only gesture in this quest that has to be
   taught. `verify:learn` fails the build over a control with no line and runs
   every line through the withheld-vocabulary gate.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  reader: [{
    from: 1,
    key: 'Tapping a card',
    what: 'Puts that card under the reader. The readout gives its proton count, how many electrons it keeps in its outermost shell, what one piece of it weighs, and what the tester recorded it doing.'
  }],
  file: [{
    from: 1,
    key: 'Tapping a slot',
    what: 'Files the card you are holding into that slot. Take a card first by tapping it in the drawer, and tap a card already filed to lift it back out.'
  }],
  clear: [{
    from: 1,
    key: 'Clear Board',
    what: 'Lifts every card you have filed back into the drawer. The cards that were pinned to the board before you started are not yours to move and stay where they are.'
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
   THE CATALOGUE
   One card per kind the scope has logged, in the order the vault files
   them. Every reading on a card is one the player has already taken with
   their own hands on an earlier bench: the proton count came off the core
   bench, the outer-shell count came off the ring field, the mass came off
   the sampler scope, and the behaviour is the tester's own record.

   The codes are the catalogue's, unchanged since site one. That they are
   also the proton counts is the thing this whole bench exists to reveal,
   so nothing below says so.
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
  c13: { code: 'CAT 13', name: 'ALUMINIUM', z: 13, outer: 3, mass: 27.0, does: 'gives' },
  c14: { code: 'CAT 14', name: 'SILICON', z: 14, outer: 4, mass: 28.1, does: 'shares' },
  c15: { code: 'CAT 15', name: 'PHOSPHORUS', z: 15, outer: 5, mass: 31.0, does: 'takes' },
  c16: { code: 'CAT 16', name: 'SULFUR', z: 16, outer: 6, mass: 32.1, does: 'takes' },
  c17: { code: 'CAT 17', name: 'CHLORINE', z: 17, outer: 7, mass: 35.5, does: 'takes' },
  c18: { code: 'CAT 18', name: 'ARGON', z: 18, outer: 8, mass: 39.9, does: 'inert' },
  c19: { code: 'CAT 19', name: 'POTASSIUM', z: 19, outer: 1, mass: 39.1, does: 'gives' }
};

/** What the tester recorded against each card, in the words it recorded it in. */
export const DOES_TEXT = {
  gives: 'Hands one electron over and holds still afterwards.',
  takes: 'Pulls one electron off a partner and keeps it.',
  shares: 'Neither hands one over nor takes one. It holds on to a partner instead.',
  inert: 'Nothing at all. It will not trade either way.'
};

/** The run of cards the vault files, in its own order. */
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
      body: 'The vault is the refinery\'s card index and the buyer wants a reference chart out of it. Six cards came out of the drawer with their filing codes stripped off.'
    },
    prompt: 'Read all six cards and lay them into the six slots from fewest protons on the left to most protons on the right.',
    controls: ['reader', 'file', 'clear'],
    masked: true,
    board: { label: 'Reference strip', rows: [['#p1', '#p2', '#p3', '#p4', '#p5', '#p6']] },
    drawer: ['c11', 'c19', 'c01', 'c18', 'c08', 'c06'],
    widget: { type: 'board', label: 'Reference strip' },
    hints: [
      'Tap a card in the drawer to take it and read it. The readout gives that card\'s proton count. Tap a slot to file the card you are holding, and tap a filed card to lift it back out.',
      'Read all six before you file any of them. The counts you want are 1, 6, 8, 11, 18 and 19.',
      'Left to right: HYDROGEN, CARBON, OXYGEN, SODIUM, ARGON, POTASSIUM. ARGON is heavier than POTASSIUM, and it still goes first, because it has fewer protons.'
    ],
    check(state) {
      const want = ['c01', 'c06', 'c08', 'c11', 'c18', 'c19'];
      const slots = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
      const filed = slots.filter(s => state.board[s]).length;
      if (filed < 6) {
        return { ok: false, notYet: true, msg: `${filed} of the six slots are filled. Take a card from the drawer and tap a slot to file it.` };
      }
      const got = slots.map(s => state.board[s]);
      if (got.join() === want.join()) return { ok: true };
      const byMass = ['c01', 'c06', 'c08', 'c11', 'c19', 'c18'];
      if (got.join() === byMass.join()) {
        return { ok: false, msg: 'That is the order they weigh, not the order they count. ARGON is the heavier of the last two and still carries fewer protons, so it goes first.' };
      }
      for (let i = 1; i < got.length; i++) {
        const a = CARDS[got[i - 1]];
        const b = CARDS[got[i]];
        if (a && b && a.z > b.z) {
          return { ok: false, msg: `Slot ${i} holds ${a.name} at ${a.z} protons and slot ${i + 1} holds ${b.name} at ${b.z}. The bigger count cannot come first.` };
        }
      }
      return { ok: false, msg: 'Something is out of order. Read each card again and compare the proton counts, lowest on the left.' };
    },
    reward: {
      log: 'Six cards laid in count order. Vault codes restored.',
      title: 'Atomic Number · What The Catalogue Counts',
      body: 'Put the codes back on those cards and they read CAT 01, 06, 08, 11, 18, 19 — the exact order you just laid them in. The scope has been filing every kind by its proton count since the day it was switched on, and that count has a name: the atomic number.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'How Long The Pattern Runs',
    briefing: {
      speaker: SPEAKER,
      body: 'Here is the whole run in atomic number order, with each card stamped with how many electrons it keeps in its outermost shell. The buyer says there is a pattern in it and will not say what.'
    },
    prompt: 'After the first two cards, count how many cards the run takes before the outer-shell count starts over at 1.',
    controls: ['reader'],
    board: { label: 'The run, in atomic number order', rows: [RUN_18] },
    drawer: [],
    widget: { type: 'number', min: 2, max: 18, label: 'Cards before it starts over' },
    hints: [
      'The tally marks under each code are the outer-shell count. Read them straight along the run: 1, 2, then 1, 2, 3, 4, 5, 6, 7, 8, then 1 again.',
      'Ignore the first two cards. Start counting at LITHIUM, where the outer count drops back to 1, and stop on the card before the next card that reads 1.',
      'LITHIUM through NEON is eight cards, and SODIUM starts the count over. The answer is 8.'
    ],
    check(state) {
      if (state.number === 8) return { ok: true };
      if (state.number === 2) {
        return { ok: false, notYet: true, msg: 'The counter has not been moved. Read the tally marks along the run and set it.' };
      }
      if (state.number === 18) {
        return { ok: false, msg: '18 is the whole run. The question is how far it gets before the outer-shell count returns to 1.' };
      }
      if (state.number === 10) {
        return { ok: false, msg: 'That counts the first two cards as well. Start at LITHIUM, which is where the outer count first drops back to 1.' };
      }
      return { ok: false, msg: 'Recount along the tally marks. LITHIUM reads 1 and the next card to read 1 is SODIUM; count the cards from one to the other.' };
    },
    reward: {
      log: 'Repeat measured at 8. First run measured at 2.',
      title: 'Periods · Why The Chart Has Rows',
      body: 'The outer-shell count climbs and starts over, again and again, which is what a shell filling up and a new one opening looks like from outside. Break the run wherever it starts over and you get rows, and a row is called a period: the first holds 2 because the first shell holds 2, and the next two hold 8.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Lay The Last Row',
    briefing: {
      speaker: SPEAKER,
      body: 'Two periods are pinned to the board already, broken exactly where you measured. The eight cards of the third are loose in the drawer.'
    },
    prompt: 'File the eight loose cards into the third row, in atomic number order, left to right.',
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
    widget: { type: 'board', label: 'Third period' },
    hints: [
      'The codes are on these cards, so the order is on the cards themselves: CAT 11 first, CAT 18 last.',
      'Lay them so each one sits under a card of the row above with the same outer-shell count. SODIUM belongs under LITHIUM, which is under HYDROGEN.',
      'Left to right: SODIUM, MAGNESIUM, ALUMINIUM, SILICON, PHOSPHORUS, SULFUR, CHLORINE, ARGON.'
    ],
    check(state) {
      const want = ['c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18'];
      const slots = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'];
      const filed = slots.filter(s => state.board[s]).length;
      if (filed < 8) {
        return { ok: false, notYet: true, msg: `${filed} of the eight slots are filled. Keep filing.` };
      }
      const got = slots.map(s => state.board[s]);
      if (got.join() === want.join()) return { ok: true };
      for (let i = 0; i < got.length; i++) {
        if (got[i] !== want[i]) {
          const here = CARDS[got[i]];
          const there = CARDS[want[i]];
          return { ok: false, msg: `Slot ${i + 1} holds ${here.name}, and the column above it reads ${CARDS[CHART_ROWS[1][i]].name} with ${CARDS[CHART_ROWS[1][i]].outer} in its outer shell. ${there.name} is the card that matches.` };
        }
      }
      return { ok: false, msg: 'The row is not in atomic number order. Read the codes and lay them lowest on the left.' };
    },
    reward: {
      log: 'Reference chart complete: 18 cards, three rows.',
      title: 'The Periodic Table',
      body: 'That is the periodic table, and you built it out of two readings you took yourself: one number to order every card, and one pattern to say where the row breaks. Chemists have drawn it this way since Dmitri Mendeleev laid his own cards out in 1869.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Read Down, Not Along',
    briefing: {
      speaker: SPEAKER,
      body: 'The chart is pinned and the buyer wants it usable without an instrument. Rows were the easy direction; try the other one.'
    },
    prompt: 'Read the cards in column 6 and log how many electrons every one of them keeps in its outer shell.',
    controls: ['reader'],
    board: { label: 'Reference chart', columns: COLUMN_HEADS, rows: CHART_ROWS },
    drawer: [],
    widget: { type: 'number', min: 0, max: 8, label: 'Outer-shell electrons in column 6' },
    hints: [
      'Column 6 is the sixth from the left. Tap OXYGEN and then SULFUR and compare the two readouts.',
      'Both cards report the same outer-shell count, and it is not a coincidence — the chart was built by breaking the run wherever that count started over.',
      'OXYGEN keeps 6 in its outer shell, and so does SULFUR. The answer is 6.'
    ],
    check(state) {
      if (state.read.size < 2) {
        return { ok: false, notYet: true, msg: 'Read at least two cards in that column before logging a figure.' };
      }
      if (state.number === 6) return { ok: true };
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'The counter is still on zero. Set it to what the cards in column 6 report.' };
      }
      if (state.number === 8) {
        return { ok: false, msg: '8 is the outer count in column 8, on the far right. Column 6 is two to the left of it.' };
      }
      if (state.number === 16) {
        return { ok: false, msg: '16 is SULFUR\'s proton count, not what it keeps outside. Read the outer-shell line on the card.' };
      }
      return { ok: false, msg: 'Compare OXYGEN and SULFUR again. Both report the same outer-shell count, and that figure is what the column is worth.' };
    },
    reward: {
      log: 'Column 6 logged at 6 outer electrons.',
      title: 'Groups · Why The Chart Has Columns',
      body: 'A column of the periodic table is called a group, and every card in one carries the same number of outer-shell electrons. That is the whole reason the chart is worth drawing: valence electrons decide how a kind behaves, so a group is a list of kinds that behave alike.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Ones That Will Not Trade',
    briefing: {
      speaker: SPEAKER,
      body: 'The buyer wants to ship one group in unlined canisters, on the grounds that it will not attack the lining. Find the group that earns that.'
    },
    prompt: 'Find the group whose cards all refuse to trade an electron, and file which group it is.',
    controls: ['reader'],
    board: { label: 'Reference chart', columns: COLUMN_HEADS, rows: CHART_ROWS },
    drawer: [],
    widget: {
      type: 'choice',
      label: 'Group cleared for unlined canisters',
      options: [
        { id: 'g1', label: 'Group 1', note: 'HYDROGEN, LITHIUM, SODIUM.' },
        { id: 'g4', label: 'Group 4', note: 'CARBON, SILICON.' },
        { id: 'g7', label: 'Group 7', note: 'FLUORINE, CHLORINE.' },
        { id: 'g8', label: 'Group 8', note: 'HELIUM, NEON, ARGON.' }
      ]
    },
    hints: [
      'Every card reports what the tester recorded against it. Read one card from each of the four groups on offer and compare the four readouts.',
      'Three of those groups trade: one hands an electron over, one takes one on, one holds on to a partner instead. Only one does nothing at all.',
      'HELIUM, NEON and ARGON all report no trade of any kind, and all three sit in group 8 with a full outer shell.'
    ],
    check(state) {
      if (state.read.size < 2) {
        return { ok: false, notYet: true, msg: 'Read some cards first. Do not file a group on the strength of where it sits.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'No group filed yet. Pick one on the deck.' };
      }
      if (state.choice === 'g8') return { ok: true };
      if (state.choice === 'g1') {
        return { ok: false, msg: 'Group 1 hands an electron over — LITHIUM and SODIUM both do. A canister lining would not survive that.' };
      }
      if (state.choice === 'g7') {
        return { ok: false, msg: 'Group 7 takes an electron on. FLUORINE and CHLORINE will pull one off whatever they are shipped in.' };
      }
      return { ok: false, msg: 'Group 4 does not hand one over or take one on, but CARBON and SILICON still hold on to a partner. Look for the group that does nothing at all.' };
    },
    reward: {
      log: 'Group 8 cleared for unlined shipment.',
      title: 'Noble Gases · A Shell With No Room Left',
      body: 'Group 8 is the noble gases, and they are unreactive for one reason: eight outer-shell electrons is a full shell, so there is nothing to gain by trading. Everything else on the chart is reaching for that arrangement, which is why it trades at all.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Sort Them By What They Do',
    briefing: {
      speaker: SPEAKER,
      body: 'Six cards are pulled for the buyer\'s handling notes. Each one needs a line saying what it does when something is pushed at it.'
    },
    prompt: 'File each of the six cards by what the tester recorded against it.',
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
      'Read all six cards. Each readout ends with the line the tester recorded, and the outer-shell count above it explains the line.',
      'A card with 1, 2 or 3 outer electrons is close to empty and lets them go. A card with 5, 6 or 7 is close to full and pulls one in. A full 8 does neither.',
      'LITHIUM and MAGNESIUM hand one over. OXYGEN and CHLORINE take one on. CARBON holds on to a partner with its 4. NEON does nothing.'
    ],
    check(state) {
      const want = { c03: 'gives', c12: 'gives', c08: 'takes', c17: 'takes', c06: 'holds', c10: 'none' };
      for (const id of Object.keys(want)) {
        if (!state.bins[id]) {
          return { ok: false, notYet: true, msg: `${CARDS[id].name} has no line on the handling notes yet.` };
        }
      }
      for (const [id, expect] of Object.entries(want)) {
        if (state.bins[id] !== expect) {
          return { ok: false, msg: `${CARDS[id].name} is filed incorrectly. It keeps ${CARDS[id].outer} in its outer shell; work out whether that is nearer empty or nearer full.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Six handling notes filed.',
      title: 'Metals, Nonmetals And Two Families',
      body: 'The left of the chart hands electrons over and is called the metals; the right takes them on and is called the nonmetals. Two groups matter most because they are the most eager: group 1, the alkali metals, which give one away, and group 7, the halogens, which take one on.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'The Card That Is Not There',
    briefing: {
      speaker: SPEAKER,
      body: 'One card was lost out of the chart long before we got here and the buyer still wants it priced. Nothing about it has been measured.'
    },
    prompt: 'Work out the missing card\'s atomic number, and what it will do, from the slot it has to go in.',
    controls: ['reader'],
    board: {
      label: 'Reference chart — one slot empty',
      columns: COLUMN_HEADS,
      rows: chartWithSlots({ c14: 'gap' })
    },
    drawer: [],
    widget: {
      type: 'numchoice',
      label: 'Missing card',
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
      'The chart is in atomic number order, so the slot is boxed in by its neighbours. Read the card to its left and the card to its right.',
      'ALUMINIUM sits at 13 and PHOSPHORUS at 15, so only one number can go between them.',
      'The slot is in group 4, and the only other card in group 4 is CARBON, which holds on to a partner. So the missing card is atomic number 14 and it does the same.'
    ],
    check(state) {
      if (state.read.size < 1) {
        return { ok: false, notYet: true, msg: 'Nothing on the chart has been read. Look at what sits either side of the empty slot.' };
      }
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'The counter is still on zero. Set the atomic number you are claiming.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'No behaviour filed. Pick what the missing card will do.' };
      }
      if (state.number !== 14) {
        return { ok: false, msg: `The chart runs in atomic number order and that slot sits between ALUMINIUM at 13 and PHOSPHORUS at 15. ${state.number} cannot go there.` };
      }
      if (state.choice !== 'holds') {
        return { ok: false, msg: 'A card takes its behaviour from its group, and that slot is in group 4 with CARBON, which holds on to a partner rather than trading.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Missing card priced at 14, group 4 behaviour.',
      title: 'A Chart That Predicts',
      body: 'You just described a kind of matter nobody on this bench has ever measured, purely from the shape of the table — and the card that belongs in that slot is silicon, atomic number 14. Mendeleev did exactly this with three empty slots in 1871 and was proved right on all three.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'File The Chart',
    briefing: {
      speaker: SPEAKER,
      body: 'Four cards came back from the buyer\'s surveyor with the codes burned off and four slots are open in the chart. Transfer closes when the chart does.'
    },
    prompt: 'Read the four unmarked cards and file each one into the slot its proton count puts it in.',
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
      'Take each card and read it. The readout gives a proton count even with the code burned off, and the chart runs in atomic number order.',
      'The four counts are 4, 7, 13 and 16. The cards on either side of each open slot tell you which slot each one belongs in.',
      'Row one is unchanged. In row two the open slots take the card reading 4 and the card reading 7; in row three they take the card reading 13 and the card reading 16.'
    ],
    check(state) {
      const want = { s1: 'c04', s2: 'c07', s3: 'c13', s4: 'c16' };
      const filed = Object.keys(want).filter(s => state.board[s]).length;
      if (filed < 4) {
        return { ok: false, notYet: true, msg: `${filed} of the four slots are filled. Take a card and tap the slot it belongs in.` };
      }
      for (const [slot, card] of Object.entries(want)) {
        if (state.board[slot] !== card) {
          const got = CARDS[state.board[slot]];
          return { ok: false, msg: `One slot is wrong. It is holding a card that counts ${got.z} protons, and its neighbours on the chart put ${CARDS[card].z} in that place.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Chart closed. Nineteen cards, all filed.',
      title: 'One Number Orders Every Kind There Is',
      body: 'Every card on this chart was placed by one measurement: how many protons sit in the middle of it. Everything else — the row it lands in, the group it joins, whether it gives, takes, holds or does nothing — falls out of that one number, which is why the periodic table is the only reference a chemist really needs.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'VESS // TALLOW CATALOGUE VAULT',
  sections: [
    {
      heading: 'Chart Transferred',
      body: 'The buyer has the reference chart and stopped arguing about it the moment they saw the codes line up. Every one of those nineteen cards was filed by a number you took off a bench with your own hands.'
    },
    {
      heading: 'Why The Shape Is The Shape',
      body: 'Rows are periods, and a period ends when a shell fills. Columns are groups, and a group is a list of kinds with the same outer-shell count, which is why they behave alike — metals on the left handing electrons over, nonmetals on the right taking them on, and the noble gases at the far edge wanting nothing.'
    },
    {
      heading: 'Next: Two Numbers Are Not Enough',
      body: 'A card carries a proton count and a mass, and on the Tally Floor you will find that no single piece in a hopper actually weighs what the card says. Before that, the buyer wants a ledger: every canister on this flat described by what is in its core and what is riding outside it.'
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
      { id: 'c', label: 'The total particles in its nucleus' },
      { id: 'd', label: 'Its mass in grams' }
    ],
    answer: 'a',
    explanation: 'The atomic number is the proton count, and it is what the periodic table is ordered by. Change it and you have a different element entirely.'
  },
  {
    question: 'Two elements sit in the same group (column) of the periodic table. What do they share?',
    options: [
      { id: 'a', label: 'The same number of protons' },
      { id: 'b', label: 'The same number of valence electrons' },
      { id: 'c', label: 'The same mass' },
      { id: 'd', label: 'The same number of neutrons' }
    ],
    answer: 'b',
    explanation: 'A group is a column of elements with the same outer-shell (valence) electron count, which is why they react in similar ways. Protons and mass differ down a group.'
  },
  {
    question: 'Why are the noble gases in group 8 almost completely unreactive?',
    options: [
      { id: 'a', label: 'They have no electrons at all' },
      { id: 'b', label: 'They are too heavy to move' },
      { id: 'c', label: 'Their outer shell is already full, so trading gains them nothing' },
      { id: 'd', label: 'They have no protons in the nucleus' }
    ],
    answer: 'c',
    explanation: 'Eight valence electrons is a full outer shell. Every other element reacts because it is reaching for that arrangement; a noble gas already has it.'
  },
  {
    question: 'An element has 3 valence electrons and sits on the left of the periodic table. What is it most likely to do?',
    options: [
      { id: 'a', label: 'Take electrons on, like a halogen' },
      { id: 'b', label: 'Hand its outer electrons over, like a metal' },
      { id: 'c', label: 'Refuse to react at all' },
      { id: 'd', label: 'Lose protons from its nucleus' }
    ],
    answer: 'b',
    explanation: 'Elements with few valence electrons (1, 2 or 3) are metals: it takes less to give those few away than to collect five more, so they hand them over.'
  },
  {
    question: 'A slot in the periodic table sits between aluminium (13) and phosphorus (15), in the same group as carbon. What can you say about the missing element?',
    options: [
      { id: 'a', label: 'Nothing, until someone measures it' },
      { id: 'b', label: 'Its atomic number is 14 and it behaves like carbon' },
      { id: 'c', label: 'Its atomic number is 14 but its behaviour is unpredictable' },
      { id: 'd', label: 'It must be a noble gas' }
    ],
    answer: 'b',
    explanation: 'The table is ordered by atomic number, so the slot is 14, and a group shares valence electrons and therefore behaviour. This is exactly how Mendeleev predicted elements nobody had found yet.'
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
      ? { code: c.name, name: 'code burned off', pips: null }
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
      commitLabel: stage.widget.type === 'bins' ? 'File Notes' : 'Commit'
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
      frame.note('Nothing in hand. Take a card out of the drawer first, then tap the slot.');
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
          <p class="lq-readout-line">Tap any card on the board or in the drawer to put it under the reader.</p>
        </div>
      `);
      return;
    }
    const c = CARDS[cardId];
    const masked = Boolean(STAGES[index].masked);
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">Card reader // ${esc(c.name)}</div>
        <div class="lq-readout-code">${masked ? 'FILING CODE BURNED OFF' : esc(c.code)}</div>
        ${line('Protons in the core', String(c.z))}
        ${line('Outer-shell electrons', String(c.outer))}
        ${line('Mass, one piece', c.mass.toFixed(1))}
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
          <p class="form-help">Filed on the board above. Commit when every slot is full.</p>
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
          <span class="form-label">Handling notes</span>
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
