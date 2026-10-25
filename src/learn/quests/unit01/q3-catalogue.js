/**
 * q3-catalogue.js — Tallow, site three: THE CATALOGUE NUMBERS.
 *
 * The third game on the Learn road, and the third on the TABLETOP (plan `bench-tabletop.md`, phase
 * T2): a card table. The player already knows the element names and has counted protons on the core
 * bench, so this bench is about ORDER: laying every element out by its proton count and discovering
 * the repeating pattern — the periodic table, Mendeleev-style. The cards are on the veranda desk
 * of the control house, the record wall beside it; the player does with them what a filing clerk
 * does, and the SHAPE of the table is something their hands find.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  lay six cards on a strip by proton count         -> Atomic Number
 *   2  set aside the cards where the pattern restarts   -> Periods · the rows
 *   3  fold the strip: lay the third row of the chart   -> The Periodic Table
 *   4  give loose cards the column their dots match     -> Groups · the columns
 *   5  tray every card that will not trade              -> Noble Gases
 *   6  tray six cards by what they do                   -> Metals and Nonmetals
 *   7  place a card nobody measured, and stamp its protons -> The chart predicts
 *
 * (A stage 8, "file four cards into the chart", repeated stages 3, 4 and 7 with no new idea and was cut;
 * its closing line, that one number orders everything, now ends the debrief.)
 *
 * EVERYTHING ON A CARD'S FACE IS READ OFF THE ELEMENT (`table/kits/cards.js`): the proton count is
 * its atomic number, the dots are its outer-shell electrons (`atoms.js` `shellsFor`), the tester's
 * answer is `tradeOf` (the outer shell and `joinbench.js` `shellPlan`). Only the mass is data (the
 * sampler scope weighed it). Filing a row is the catalogue board's own `fileCard` (a card dropped on
 * a filled place pushes the row along), reached through the table's strip rows. No stage declares an
 * outcome; `SOLUTIONS` and `MISSES` are scripts of the player's own actions, replayed by `verify:table`.
 *
 * VOCABULARY IS EARNED, THEN USED. Everything the first two benches taught — proton, neutron,
 * electron, shell, valence, element, isotope, ion — is a plain word here and is used like one.
 * What this bench withholds is its OWN vocabulary, and `VOCABULARY` below says which stage's reward
 * card pays each one out. `verify:learn` fails the build both ways round.
 *
 * COPY RULE: no briefing: the Tour explains every tool on the table. Every stage is a
 * plain imperative prompt, three short hints and a reward card. No story rides on top of it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings. It reports through `ctx`
 * and nothing else.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import {
  cardTable, cardSlot, cardTray, elementCard, tradeOf, piecesIn, slotCard, railOrder
} from '../../table/kits/cards.js';

export const meta = { stageCount: 7 };

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

/**
 * The legend lines. Every key on this table says what it does ("Test Card"), the rest are cards
 * dragged and a strip to lay them on, so nothing owes a legend. Kept so the quest contract
 * (`toolNoteFor`) holds.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE CARDS
   One card per element the player has met. Every reading on a card is one
   the player has already taken with their own hands on an earlier bench:
   the proton count came off the core bench, the outer-shell count off the
   shell field, the mass off the sampler scope.
   ------------------------------------------------------------------ */
export const CARDS = {
  c01: { code: 'No. 1', name: 'HYDROGEN', z: 1, outer: 1, mass: 1.0, does: 'shares' },
  c02: { code: 'No. 2', name: 'HELIUM', z: 2, outer: 2, mass: 4.0, does: 'inert' },
  c03: { code: 'No. 3', name: 'LITHIUM', z: 3, outer: 1, mass: 6.9, does: 'gives' },
  c04: { code: 'No. 4', name: 'BERYLLIUM', z: 4, outer: 2, mass: 9.0, does: 'gives' },
  c05: { code: 'No. 5', name: 'BORON', z: 5, outer: 3, mass: 10.8, does: 'gives' },
  c06: { code: 'No. 6', name: 'CARBON', z: 6, outer: 4, mass: 12.0, does: 'shares' },
  c07: { code: 'No. 7', name: 'NITROGEN', z: 7, outer: 5, mass: 14.0, does: 'takes' },
  c08: { code: 'No. 8', name: 'OXYGEN', z: 8, outer: 6, mass: 16.0, does: 'takes' },
  c09: { code: 'No. 9', name: 'FLUORINE', z: 9, outer: 7, mass: 19.0, does: 'takes' },
  c10: { code: 'No. 10', name: 'NEON', z: 10, outer: 8, mass: 20.2, does: 'inert' },
  c11: { code: 'No. 11', name: 'SODIUM', z: 11, outer: 1, mass: 23.0, does: 'gives' },
  c12: { code: 'No. 12', name: 'MAGNESIUM', z: 12, outer: 2, mass: 24.3, does: 'gives' },
  c13: { code: 'No. 13', name: 'ALUMINUM', z: 13, outer: 3, mass: 27.0, does: 'gives' },
  c14: { code: 'No. 14', name: 'SILICON', z: 14, outer: 4, mass: 28.1, does: 'shares' },
  c15: { code: 'No. 15', name: 'PHOSPHORUS', z: 15, outer: 5, mass: 31.0, does: 'takes' },
  c16: { code: 'No. 16', name: 'SULFUR', z: 16, outer: 6, mass: 32.1, does: 'takes' },
  c17: { code: 'No. 17', name: 'CHLORINE', z: 17, outer: 7, mass: 35.5, does: 'takes' },
  c18: { code: 'No. 18', name: 'ARGON', z: 18, outer: 8, mass: 39.9, does: 'inert' },
  c19: { code: 'No. 19', name: 'POTASSIUM', z: 19, outer: 1, mass: 39.1, does: 'gives' }
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

/** The chart as it stands once the rows are laid: columns 1, 2, a gap, 13 to 18. */
const CHART_ROWS = [
  ['c01', null, null, null, null, null, null, null, 'c02'],
  ['c03', 'c04', null, 'c05', 'c06', 'c07', 'c08', 'c09', 'c10'],
  ['c11', 'c12', null, 'c13', 'c14', 'c15', 'c16', 'c17', 'c18']
];

/** The number printed under a column of the chart. */
const COLUMN_HEADS = ['1', '2', '', '13', '14', '15', '16', '17', '18'];

/* ------------------------------------------------------------------
   THE TABLES
   One card table (150 x 64 units): nine columns at a 15 unit pitch, three chart rows
   and a band of loose cards under them.
   ------------------------------------------------------------------ */

const X = c => 13.5 + 15 * c;
const ROW_Y = [8, 21.5, 35];
const LOOSE_Y = 54;

/** A card of the catalogue, with the mass the sampler scope weighed for it. */
const card = (id, at, props = {}) => elementCard(id, ELEMENT_OF[id], at, { mass: CARDS[id].mass, ...props });

/** The element each card is: the card's own name is the only thing that says. */
const ELEMENT_OF = {
  c01: 'H', c02: 'He', c03: 'Li', c04: 'Be', c05: 'B', c06: 'C', c07: 'N', c08: 'O', c09: 'F', c10: 'Ne',
  c11: 'Na', c12: 'Mg', c13: 'Al', c14: 'Si', c15: 'P', c16: 'S', c17: 'Cl', c18: 'Ar', c19: 'K'
};

/** Chart cards standing where the chart puts them; `skip` leaves some out; `fixed` makes them targets, not handles. */
function chartCards({ skip = [], fixed = true } = {}) {
  const out = [];
  CHART_ROWS.forEach((row, r) => row.forEach((id, c) => {
    if (id && !skip.includes(id)) out.push({ ...card(id, { x: X(c), y: ROW_Y[r] }), ...(fixed ? { fixed: true } : {}) });
  }));
  return out;
}

/** Loose cards laid in a row along the foot of the table, left to right in the order given. */
const loose = (ids, props = {}, x0 = 13.5, pitch = 15) => ids.map((id, i) => card(id, { x: x0 + i * pitch, y: LOOSE_Y }, props));

const to = (piece, target) => ({ place: { piece, to: target } });
const run = id => ({ run: id });

/* ------------------------------------------------------------------
   THE EIGHT STAGES

   Exported because every `check` is a pure function of the table state, which is
   what makes them checkable without a browser. `verify:learn` and `verify:table`
   run SOLUTIONS and MISSES through them.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Put Them In Order',
    prompt: 'Sort the elements from smallest to largest.',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: ['c11', 'c19', 'c01', 'c18', 'c08', 'c06'].map((id, i) => card(id, { x: 30 + 18 * i, y: 48 })),
      zones: { rail: { at: { x: 75, y: 22 }, size: { w: 102, h: 14 }, first: 'Fewest protons', last: 'Most protons', items: [] } }
    }),
    hints: [
      'Use the strip along the top.',
      'Read the protons printed on each card; how heavy a card is does not matter here.',
      'Write the six proton counts down, sort them smallest to largest, and lay the cards in that order from the leftmost place to the rightmost.'
    ],
    check(state) {
      const want = ['c01', 'c06', 'c08', 'c11', 'c18', 'c19'];
      const got = railOrder(state.table);
      if (got.length < 6) {
        return { ok: false, notYet: true, msg: `Lay all six cards on the strip first — ${got.length} of them are there.` };
      }
      if (got.join() === want.join()) return { ok: true };
      const byMass = ['c01', 'c06', 'c08', 'c11', 'c19', 'c18'];
      if (got.join() === byMass.join()) {
        return { ok: false, msg: 'The cards are in the order of their weights.' };
      }
      for (let i = 1; i < got.length; i++) {
        const a = CARDS[got[i - 1]];
        const b = CARDS[got[i]];
        if (a && b && a.z > b.z) {
          return { ok: false, msg: `${a.name} (${a.z} protons) sits before ${b.name} (${b.z} protons).` };
        }
      }
      return { ok: false, msg: 'Two neighbouring cards are out of order by proton count.' };
    },
    reward: {
      log: 'Six cards laid in count order.',
      title: 'Atomic Number',
      body: 'You laid the cards from fewest protons to most (smallest to largest). The number of protons is called the atomic number.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Find The Repeat',
    prompt: 'Pick the elements where the number of valence electrons resets.',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: RUN_18.map((id, i) => card(id, { x: X(i % 9), y: i < 9 ? 14 : 30 })),
      zones: { trays: [cardTray('again', 'Where it starts over', { x: 75, y: 53 }, 4, 1)] }
    }),
    hints: [
      'Each card carries one dot for every electron in its outer shell.',
      'Follow the dots along the rows and watch how the count changes from card to card.',
      'Compare each card with the one before it, and set aside every card whose dots fall back to a single dot after a longer run.'
    ],
    check(state) {
      const set = piecesIn(state.table, 'tray:again').map(p => p.id);
      if (set.length === 0) {
        return { ok: false, notYet: true, msg: 'Set aside every card where the outer electron count drops back to 1.' };
      }
      if (set.includes('c01')) {
        return { ok: false, msg: 'Hydrogen is where the pattern begins, not where it starts over.' };
      }
      if (set.length === 1 && (set.includes('c03') || set.includes('c11'))) {
        return { ok: false, msg: 'You found one card where the count restarts, but there is another further along.' };
      }
      if (set.some(id => id !== 'c03' && id !== 'c11')) {
        return { ok: false, msg: 'A card you set aside does not restart at 1 outer electron. Look for where the dot count drops back to 1.' };
      }
      if (set.length === 2) return { ok: true };
      return { ok: false, msg: 'Set aside only the cards where the outer shell count drops back to 1.' };
    },
    reward: {
      log: 'Repeat measured at 8.',
      title: 'Periods',
      body: 'The outer-shell count climbs and starts over, again and again, because one shell fills up and a new one opens. Breaking the row wherever it starts over yields periods of 2, 8, and 8 cards. The ten middle columns appear later, leaving the gap between group 2 and 13.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Lay The Last Row',
    prompt: 'Place the remaining cards in the bottom row. Hint: use the number of valence electrons to determine the order.',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: [
        ...chartCards({ skip: CHART_ROWS[2].filter(Boolean) }),
        ...loose(['c16', 'c11', 'c14', 'c18', 'c12', 'c17', 'c13', 'c15'])
      ],
      zones: {
        slots: CHART_ROWS[2].map((id, c) => (id ? cardSlot(`r${CHART_ROWS[2].slice(0, c + 1).filter(Boolean).length}`, { x: X(c), y: ROW_Y[2] }, { label: COLUMN_HEADS[c], row: 'bottom' }) : null)).filter(Boolean)
      }
    }),
    hints: [
      'Use the loose cards and the empty places in the row.',
      'SODIUM reads the fewest protons of the eight and ARGON reads the most.',
      'Put the fewest-proton card in the first place, then for each next place find the card with one proton more than the card before it.'
    ],
    check(state) {
      const want = ['c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18'];
      const slots = want.map((_, i) => `r${i + 1}`);
      const got = slots.map(s => slotCard(state.table, s));
      const filed = got.filter(Boolean).length;
      if (filed < 8) {
        return { ok: false, notYet: true, msg: `Fill all eight places first — ${filed} of them are filled.` };
      }
      if (got.join() === want.join()) return { ok: true };
      for (let i = 0; i < got.length; i++) {
        if (got[i] !== want[i]) {
          const here = CARDS[got[i]];
          return { ok: false, msg: `Place ${i + 1} holds ${here.name} with ${here.z} protons, which is out of order with its neighbors.` };
        }
      }
      return { ok: false, msg: 'The row is out of order — read the cards and lay them lowest on the left.' };
    },
    reward: {
      log: 'Chart complete: 18 cards, three rows.',
      title: 'The Periodic Table',
      body: 'That chart is the periodic table. You built it from two things you measured yourself: one number to put the cards in order, and one pattern to say where a row ends. Chemists have drawn it this way since Dmitri Mendeleev laid his own cards out in 1869, and the dotted gap marks ten more columns the full table fits between groups 2 and 13.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Read Down, Not Along',
    prompt: 'File each of the three loose cards in the column it belongs to.',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: [
        ...chartCards({ skip: ['c14', 'c16', 'c17'] }),
        ...[['c16', 3], ['c17', 5], ['c14', 7]].map(([id, c]) => card(id, { x: X(c), y: LOOSE_Y }, { hide: ['z', 'mass'] }))
      ],
      zones: {
        slots: [['s14', 4, '14'], ['s16', 6, '16'], ['s17', 7, '17']].map(([id, c, label]) => cardSlot(id, { x: X(c), y: ROW_Y[2] }, { label }))
      }
    }),
    hints: [
      'Use the open places under the columns.',
      'Compare the outer-shell dots on the loose cards with the dots on the cards in the column above each open place.',
      'Pick one reading on the cards, follow it down a column to see which one never changes, then give each loose card the open place that matches it.'
    ],
    check(state) {
      const want = { s14: 'c14', s16: 'c16', s17: 'c17' };
      const filed = Object.keys(want).filter(s => slotCard(state.table, s)).length;
      if (filed < 3) {
        return { ok: false, notYet: true, msg: `Fill all three open places first — ${filed} of them are filled.` };
      }
      for (const [slot, id] of Object.entries(want)) {
        if (slotCard(state.table, slot) !== id) {
          return { ok: false, msg: 'A loose card\'s dots differ from the dots on the cards in its column.' };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Columns share outer-shell electrons.',
      title: 'Groups',
      body: 'A column of the periodic table is called a group, and every card in a group has the same number of outer-shell electrons. Those outer electrons decide how an atom behaves, so a group is a list of atoms that behave alike.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Ones That Will Not Trade',
    prompt: 'Find every element that won\'t trade electrons and put them in the tray.',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: chartCards({ fixed: false }),
      zones: {
        trays: [cardTray('inert', 'Will not trade', { x: 36, y: 54 }, 4, 1)],
        slots: [cardSlot('tester', { x: 92, y: 51 }, { label: 'Card' })]
      },
      fixtures: [{ id: 'tester', kind: 'tester', label: 'Tester', runLabel: 'Test Card', at: { x: 126, y: 54 }, size: { w: 36, h: 15 }, props: { slot: 'tester' } }]
    }),
    hints: [
      'Use the tester and "Test Card".',
      'Group 1 hands electrons over, group 17 takes them on, and group 14 shares.',
      'Find the cards for which "Test Card" reports that nothing happens at all, and tray every card in that column.'
    ],
    check(state) {
      const noble = ['c02', 'c10', 'c18'];
      const got = piecesIn(state.table, 'tray:inert').map(p => p.id);
      if (!got.length) return { ok: false, notYet: true, msg: 'The tray is empty. Tray the cards that will not trade.' };
      const wrong = got.find(id => !noble.includes(id));
      if (wrong) {
        return { ok: false, msg: `${CARDS[wrong].name} does trade — ${DOES_TEXT[tradeOf(ELEMENT_OF[wrong])].replace(/\.$/, '').toLowerCase()}. Test it to see.` };
      }
      if (got.length < noble.length) {
        return { ok: false, msg: 'A card that will not trade is still on the chart.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Group 18 never trades.',
      title: 'Noble Gases',
      body: 'Group 18 are the noble gases, and they almost never react. Eight outer-shell electrons is a full shell, so there is nothing to gain by trading. Every other atom on the chart is reaching for that full shell, which is why it trades at all.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Sort Them By What They Do',
    prompt: 'Sort each of the six cards by what it does with its outer-shell electrons.',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: ['c03', 'c12', 'c08', 'c17', 'c06', 'c10'].map((id, i) => card(id, { x: 21 + 22 * i, y: 8 })),
      zones: {
        trays: [
          { ...cardTray('gives', 'Hands one over', { x: 19, y: 32 }, 2, 2), size: { w: 33, h: 24 } },
          { ...cardTray('takes', 'Takes one on', { x: 56, y: 32 }, 2, 2), size: { w: 33, h: 24 } },
          { ...cardTray('shares', 'Holds on to a partner', { x: 93, y: 32 }, 2, 2), size: { w: 33, h: 24 } },
          { ...cardTray('inert', 'Does nothing', { x: 130, y: 32 }, 2, 2), size: { w: 33, h: 24 } }
        ],
        slots: [cardSlot('tester', { x: 84, y: 51.5 }, { label: 'Card' })]
      },
      fixtures: [{ id: 'tester', kind: 'tester', label: 'Tester', runLabel: 'Test Card', at: { x: 120, y: 54 }, size: { w: 36, h: 15 }, props: { slot: 'tester' } }]
    }),
    hints: [
      'Use the tester and "Test Card".',
      'Cards in the same group behave alike, so you can predict untested cards from their column.',
      'Cards on the left of the chart give electrons, cards on the right take them, the column under carbon holds on, and the last column does nothing.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['c03', 'c12', 'c08', 'c17', 'c06', 'c10'];
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      const trays = ['gives', 'takes', 'shares', 'inert'];
      for (const id of ids) {
        if (!trays.includes(where(id))) return { ok: false, notYet: true, msg: `${CARDS[id].name} has no tray yet.` };
      }
      for (const id of ids) {
        if (where(id) !== tradeOf(ELEMENT_OF[id])) {
          return { ok: false, msg: `${CARDS[id].name}\'s tray does not match what the tester shows it doing.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'All six filed by what they do.',
      title: 'Metals and Nonmetals',
      body: 'Atoms on the left of the chart hand electrons over, and those are the metals. Atoms on the right take electrons on, and those are the nonmetals. The keenest of each get their own name: group 1 are the alkali metals and group 17 are the halogens.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'The Card That Is Not There',
    prompt: 'Place the unmeasured card where the chart says it goes, and set its proton count.',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: [
        ...chartCards({ skip: ['c14'] }),
        { ...elementCard('sealed', 'Si', { x: 13.5, y: 53 }, { sealed: true }), label: 'UNMEASURED' }
      ],
      zones: { slots: [cardSlot('gap', { x: X(4), y: ROW_Y[2] }, { label: '' })] },
      fixtures: [{ id: 'stamp', kind: 'stamp', label: 'Stamp', at: { x: 75, y: 8 }, size: { w: 60, h: 12 }, noRun: true, dials: { protons: { min: 0, max: 20, step: 1, value: 0, label: 'Protons' } } }]
    }),
    hints: [
      'Use the open place and the stamp.',
      'Read the cards on either side of the open place and the card above it.',
      'Find the number that sits between its left and right neighbors.'
    ],
    check(state) {
      const t = state.table;
      if (slotCard(t, 'gap') !== 'sealed') {
        return { ok: false, notYet: true, msg: 'Lay the unmeasured card in the open place first.' };
      }
      const claim = t.fixtures.stamp.dials.protons.value;
      if (claim === 0) {
        return { ok: false, notYet: true, msg: 'The stamp is still on zero — set the proton count you are claiming.' };
      }
      if (claim !== 14) {
        return { ok: false, msg: `${claim} protons does not sit between the neighbours of that place.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Missing card worked out: 14.',
      title: 'A Chart That Predicts',
      body: 'You just described an atom nobody at this bench has ever measured, using nothing but the shape of the chart. The card that belongs in that slot is silicon, atomic number 14. Mendeleev did exactly this with three empty slots in 1871 and was proved right on all three.',
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
      body: 'Every kind of atom has an atomic number, which is simply how many protons it has. Put them in that order and a pattern repeats, which is what the periodic table is. One number orders everything: the row an atom lands in, the group it joins, and what it does with its outer electrons.'
    },
    {
      heading: 'Rows and Columns',
      body: 'A row is a period, and it ends when a shell fills up. A column is a group, and everything in it has the same outer-shell count, which is why it behaves the same way: metals on the left hand electrons over, nonmetals on the right take them on, and the noble gases at the edge want nothing.'
    },
    {
      heading: 'Next',
      body: 'Nice detective work assembling the chart! Next, we\'ll track how protons, neutrons, and electrons balance inside each atom.'
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
    question: 'Why do the noble gases in group 18 hardly react with anything?',
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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  ['c01', 'c06', 'c08', 'c11', 'c18', 'c19'].map((id, i) => to(id, `rail:${i}`)),
  [to('c03', 'tray:again'), to('c11', 'tray:again')],
  ['c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18'].map((id, i) => to(id, `slot:r${i + 1}`)),
  [to('c14', 'slot:s14'), to('c16', 'slot:s16'), to('c17', 'slot:s17')],
  [
    to('c10', 'slot:tester'), run('tester'), to('c18', 'slot:tester'), run('tester'), to('c09', 'slot:tester'), run('tester'),
    to('c02', 'tray:inert'), to('c10', 'tray:inert'), to('c18', 'tray:inert')
  ],
  [
    to('c03', 'slot:tester'), run('tester'), to('c08', 'slot:tester'), run('tester'), to('c06', 'slot:tester'), run('tester'),
    to('c03', 'tray:gives'), to('c12', 'tray:gives'), to('c08', 'tray:takes'), to('c17', 'tray:takes'), to('c06', 'tray:shares'), to('c10', 'tray:inert')
  ],
  [to('sealed', 'slot:gap'), { setDial: { fixture: 'stamp', dial: 'protons', value: 14 } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  ['c01', 'c06', 'c08', 'c11', 'c19', 'c18'].map((id, i) => to(id, `rail:${i}`)),
  [to('c01', 'tray:again'), to('c03', 'tray:again')],
  ['c11', 'c12', 'c13', 'c15', 'c14', 'c16', 'c17', 'c18'].map((id, i) => to(id, `slot:r${i + 1}`)),
  [to('c16', 'slot:s14'), to('c14', 'slot:s16'), to('c17', 'slot:s17')],
  [to('c09', 'slot:tester'), run('tester'), to('c09', 'tray:inert'), to('c17', 'tray:inert'), to('c02', 'tray:inert')],
  [to('c03', 'tray:gives'), to('c12', 'tray:takes'), to('c08', 'tray:takes'), to('c17', 'tray:takes'), to('c06', 'tray:shares'), to('c10', 'tray:inert')],
  [to('sealed', 'slot:gap'), { setDial: { fixture: 'stamp', dial: 'protons', value: 13 } }]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}
