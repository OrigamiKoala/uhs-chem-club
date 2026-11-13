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
  { term: /\bperiods?\b/i, introducedAt: 1 },
  { term: /\bperiodic\b/i, introducedAt: 2 },
  { term: /\bgroups?\b/i, introducedAt: 3 },
  { term: /\bnoble\b/i, introducedAt: 4 },
  { term: /\bmetals?\b/i, introducedAt: 5 },
  { term: /\bnonmetals?\b/i, introducedAt: 5 }
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
  gives: 'Loses one electron.',
  takes: 'Gains one electron.',
  shares: 'Shares electrons with a partner.',
  inert: 'No change.'
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
    title: 'Find the Repeat',
    briefing: {
      speaker: SPEAKER,
      body: 'These eighteen elements lie in order of atomic number. The dots on each card are its valence electrons.'
    },
    prompt: 'At which elements does the count of valence electrons start again at one?',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: RUN_18.map((id, i) => card(id, { x: X(i % 9), y: i < 9 ? 14 : 30 })),
      zones: { trays: [cardTray('again', 'Where it starts over', { x: 75, y: 53 }, 4, 1)] }
    }),
    hints: [
      'Count the outer-shell dots along the top row, then the bottom row.',
      'Watch where the dot count drops back to one after a full shell.',
      'Hydrogen begins the first row; look for the cards that begin a new cycle at one dot.'
    ],
    check(state) {
      const set = piecesIn(state.table, 'tray:again').map(p => p.id);
      if (set.length === 0) {
        return { ok: false, notYet: true, msg: 'Set aside every card where the valence electron count drops back to 1.' };
      }
      if (set.includes('c01')) {
        return { ok: false, msg: 'Hydrogen is where the pattern begins, not where it starts over.' };
      }
      if (set.length === 1 && (set.includes('c03') || set.includes('c11'))) {
        return { ok: false, msg: 'You found one card where the count restarts, but there is another further along.' };
      }
      if (set.some(id => id !== 'c03' && id !== 'c11')) {
        return { ok: false, msg: 'A card you set aside does not restart at 1 valence electron.' };
      }
      if (set.length === 2) return { ok: true };
      return { ok: false, msg: 'Set aside only the cards where the valence electron count drops back to 1.' };
    },
    reward: {
      log: 'Repeat measured at 8.',
      title: 'Periods',
      body: 'The count climbs as a shell fills, then starts again at one. Starting a new row at each of those cards gives periods of 2, 8 and 8.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Lay the Last Row',
    prompt: 'Where does each loose card belong in the bottom row?',
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
      'Drag the loose cards into the empty places in the bottom row.',
      'Compare the atomic number on each loose card.',
      'Look at how atomic numbers run from left to right in the rows above.'
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
          return { ok: false, msg: `Place ${i + 1} holds ${here.name} with atomic number ${here.z}, which is out of order with its neighbours.` };
        }
      }
      return { ok: false, msg: 'The row is out of order — read the cards and lay them lowest on the left.' };
    },
    reward: {
      log: 'Chart complete: 18 cards, three rows.',
      title: 'The Periodic Table',
      body: 'This arrangement is the periodic table: elements in order of atomic number, with a new row where the outer shell starts again.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Read Down, Not Along',
    briefing: {
      speaker: SPEAKER,
      body: 'A row of the periodic table is a period and a column is a group.'
    },
    prompt: 'Which group does each loose card belong to?',
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
      'Drag each loose card into one of the open places in the bottom row.',
      'Compare the outer-shell dots on each loose card with the cards above each open place.',
      'Elements in the same group have the same number of valence electrons.'
    ],
    check(state) {
      const want = { s14: 'c14', s16: 'c16', s17: 'c17' };
      const filed = Object.keys(want).filter(s => slotCard(state.table, s)).length;
      if (filed < 3) {
        return { ok: false, notYet: true, msg: `Fill all three open places first — ${filed} of them are filled.` };
      }
      for (const [slot, id] of Object.entries(want)) {
        if (slotCard(state.table, slot) !== id) {
          return { ok: false, msg: 'A loose card\'s dots differ from the dots on the cards in its group.' };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Columns share outer-shell electrons.',
      title: 'Groups',
      body: 'Every element in a group has the same number of valence electrons, so the elements of a group react alike.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Ones That Do Not React',
    briefing: {
      speaker: SPEAKER,
      body: 'In the partner test an atom with a full outer shell neither loses nor gains an electron.'
    },
    prompt: 'Which elements on the chart will show no change in the partner test?',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: chartCards({ fixed: false }),
      zones: {
        trays: [cardTray('inert', 'No change', { x: 36, y: 54 }, 4, 1)],
        slots: [cardSlot('tester', { x: 92, y: 51 }, { label: 'Card' })]
      },
      fixtures: [{ id: 'tester', kind: 'tester', label: 'Partner test', runLabel: 'Test Card', at: { x: 126, y: 54 }, size: { w: 36, h: 15 }, props: { slot: 'tester' } }]
    }),
    hints: [
      'Look at the outer-shell dots on each card, or test a card in the Partner test.',
      'A full first shell holds 2 electrons; a full second or third shell holds 8.',
      'Find the group whose elements all have full outer shells.'
    ],
    check(state) {
      const noble = ['c02', 'c10', 'c18'];
      const got = piecesIn(state.table, 'tray:inert').map(p => p.id);
      if (!got.length) return { ok: false, notYet: true, msg: 'The tray is empty. Sort the cards that will show no change.' };
      const wrong = got.find(id => !noble.includes(id));
      if (wrong) {
        return { ok: false, msg: `${CARDS[wrong].name} does not have a full outer shell.` };
      }
      if (got.length < noble.length) {
        return { ok: false, msg: 'An element with a full outer shell is still on the chart.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Group 18 shows no change.',
      title: 'Noble Gases',
      body: 'Helium, neon and argon have full outer shells, so they do not react in the test. They are group 18, the noble gases.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Metals and Nonmetals',
    briefing: {
      speaker: SPEAKER,
      body: 'An element that loses electrons when it reacts is a metal; one that gains them is a nonmetal. Six tested cards stand along the bottom.'
    },
    prompt: 'What will each loose card do when it reacts?',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: [
        ...['c03', 'c12', 'c08', 'c17', 'c06', 'c10'].map((id, i) => card(id, { x: 21 + 22 * i, y: 8 })),
        ...['c11', 'c04', 'c14', 'c16', 'c09', 'c18'].map((id, i) => ({
          ...card(id, { x: 21 + 22 * i, y: LOOSE_Y }, { tested: CARDS[id].does }),
          fixed: true
        }))
      ],
      zones: {
        trays: [
          { ...cardTray('gives', 'Loses electrons: metal', { x: 19, y: 32 }, 2, 2), size: { w: 33, h: 24 } },
          { ...cardTray('takes', 'Gains electrons: nonmetal', { x: 56, y: 32 }, 2, 2), size: { w: 33, h: 24 } },
          { ...cardTray('shares', 'Shares', { x: 93, y: 32 }, 2, 2), size: { w: 33, h: 24 } },
          { ...cardTray('inert', 'No change', { x: 130, y: 32 }, 2, 2), size: { w: 33, h: 24 } }
        ]
      }
    }),
    hints: [
      'Compare each loose card\'s outer-shell dots with the six tested cards along the bottom.',
      'Elements in the same group have the same valence electrons and react alike.',
      'Match each loose card to the tested card with the same number of outer-shell dots.'
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
          return { ok: false, msg: `${CARDS[id].name}'s tray does not match the tested card with the same valence electrons.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'All six sorted by what they do.',
      title: 'Metals and Nonmetals',
      body: 'Elements at the left of the table are metals and those at the right are nonmetals. An element reacts like the others in its group.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'The Card That Is Not There',
    prompt: 'What is the atomic number of the element missing from the chart?',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: [
        ...chartCards({ skip: ['c14'] }),
        { ...elementCard('sealed', 'Si', { x: X(4), y: ROW_Y[2] }, { sealed: true }), label: 'UNMEASURED', fixed: true }
      ],
      fixtures: [{ id: 'stamp', kind: 'stamp', label: 'Atomic number', at: { x: 75, y: 8 }, size: { w: 60, h: 12 }, noRun: true, dials: { protons: { min: 0, max: 20, step: 1, value: 0, label: 'Atomic number' } } }]
    }),
    hints: [
      'Use the Atomic number dial.',
      'Read the atomic numbers on the cards to the left and right of the unmeasured card.',
      'Along a period, atomic number increases by one from left to right.'
    ],
    check(state) {
      const t = state.table;
      const claim = t.fixtures.stamp.dials.protons.value;
      if (claim === 0) {
        return { ok: false, notYet: true, msg: 'The dial is still on zero — set the atomic number of the missing element.' };
      }
      if (claim !== 14) {
        return { ok: false, msg: `${claim} does not sit between the neighbours of that place.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Missing card worked out: 14.',
      title: 'A Chart That Predicts',
      body: 'The missing element sits between 13 and 15, so its atomic number is 14: silicon. The table predicted it from its neighbours.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Estimating From Neighbours',
    prompt: 'Lithium (152 pm) and sodium (186 pm) sit above potassium in Group 1: what is a reasonable atomic radius for potassium?',
    widget: { type: 'table', label: 'The desk' },
    table: cardTable({
      pieces: [
        ...chartCards({ skip: [] })
      ],
      fixtures: [{ id: 'stamp', kind: 'stamp', label: 'Radius (pm)', at: { x: 75, y: 8 }, size: { w: 66, h: 12 }, noRun: true, dials: { radius: { min: 0, max: 300, step: 1, value: 0, label: 'Estimated radius (pm)' } } }]
    }),
    hints: [
      'Use the Estimated radius dial.',
      'Compare the step from lithium (152 pm) to sodium (186 pm).',
      'Going down Group 1 adds another electron shell, so potassium is larger than sodium by roughly a similar step.'
    ],
    check(state) {
      const claim = state.table.fixtures.stamp.dials.radius.value;
      if (claim === 0) return { ok: false, notYet: true, msg: 'The dial is still on zero — set an estimated radius for potassium.' };
      if (claim <= 186) return { ok: false, msg: 'Potassium has one more electron shell than sodium (186 pm), so its radius must be larger than 186 pm.' };
      if (claim > 245) return { ok: false, msg: `${claim} pm is too large a jump for adding one shell below sodium (186 pm).` };
      return { ok: true };
    },
    reward: {
      log: 'Estimated potassium radius from Group 1 neighbours.',
      title: 'Periodic Estimation',
      body: 'Potassium\'s measured atomic radius is 227 pm, right in line with the step from lithium (152 pm) to sodium (186 pm). Group neighbours let you estimate unknown properties.',
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
      body: 'Elements are ordered by atomic number, the proton count. As shells fill, chemical properties repeat periodically.'
    },
    {
      heading: 'Periods and Groups',
      body: 'Rows are periods, ending when a shell fills. Columns are groups, sharing valence electron counts and similar chemical behavior.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [to('c03', 'tray:again'), to('c11', 'tray:again')],
  ['c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18'].map((id, i) => to(id, `slot:r${i + 1}`)),
  [to('c14', 'slot:s14'), to('c16', 'slot:s16'), to('c17', 'slot:s17')],
  [to('c10', 'slot:tester'), run('tester'), to('c02', 'tray:inert'), to('c10', 'tray:inert'), to('c18', 'tray:inert')],
  [to('c03', 'tray:gives'), to('c12', 'tray:gives'), to('c08', 'tray:takes'), to('c17', 'tray:takes'), to('c06', 'tray:shares'), to('c10', 'tray:inert')],
  [{ setDial: { fixture: 'stamp', dial: 'protons', value: 14 } }],
  [{ setDial: { fixture: 'stamp', dial: 'radius', value: 227 } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [to('c01', 'tray:again'), to('c03', 'tray:again')],
  ['c11', 'c12', 'c13', 'c15', 'c14', 'c16', 'c17', 'c18'].map((id, i) => to(id, `slot:r${i + 1}`)),
  [to('c16', 'slot:s14'), to('c14', 'slot:s16'), to('c17', 'slot:s17')],
  [to('c09', 'tray:inert'), to('c17', 'tray:inert'), to('c02', 'tray:inert')],
  [to('c03', 'tray:gives'), to('c12', 'tray:takes'), to('c08', 'tray:takes'), to('c17', 'tray:takes'), to('c06', 'tray:shares'), to('c10', 'tray:inert')],
  [{ setDial: { fixture: 'stamp', dial: 'protons', value: 13 } }],
  [{ setDial: { fixture: 'stamp', dial: 'radius', value: 170 } }]
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
