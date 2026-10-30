/**
 * Unit 7 · Bench 3 — Physical or Chemical (q3-change)
 *
 * The weighbridge pot of the foundry, on the pot kit (`table/kits/pot.js`) with this bench's own instruments (`table/kits/pot-change.js`):
 * a pot that does one change to whatever sample jar stands in it, a window of particles before and after, a balance that weighs the
 * whole pot, four lamps for the things a pot might do, and a Lid dial. Every reading is `engine/reactdata-change.js` `planChange`;
 * nothing on the table is authored. Eight stages and ONE click: the belief that burning loses mass.
 *
 *   1  sort four changes by whether a new substance is in the pot afterwards    -> physical change, chemical change
 *   2  pick the change that lit a lamp but made no new substance               -> evidence of reaction
 *   3  PREDICT: an open pot of steel wool burns; heavier, the same or lighter?  (the held model: burning loses mass)
 *   4  TEST: burn it and lay the chip for what the balance shows               -> an open pot GAINS: iron takes oxygen from the air
 *   5  three open burns sorted heavier or lighter                                -> a gas that leaves lightens it, a gas that joins weighs more
 *   6  sealed: type what a sealed pot weighs after the burn, past the dial       -> conservation of mass for a whole pot
 *   7  pick the change that leaves the same particles in the pot                 -> salt in water: the ions were there already
 *   8  sealed: three unlabelled samples sorted by what the window shows          -> a lamp is evidence, not proof
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { potTable, chip, plaqueFixture, fixed } from '../../table/kits/pot.js';
import { cjar, changePotFixture, potScaleFixture, evidenceFixture, changeRead, scaleRead, lampsRead, LAMPS } from '../../table/kits/pot-change.js';
import { planChange, CASES } from '../../engine/reactdata-change.js';
import { pretty } from '../../engine/reactdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bphysical change\b/i, introducedAt: 1 },
  { term: /\bchemical change\b/i, introducedAt: 1 },
  { term: /\bevidence of reaction\b/i, introducedAt: 2 }
];

/** The conservation of mass is bench 1's: this bench uses it on a whole pot. */
export const BUILDS_ON = ['unit07/q1-recipe'];

export const ROOM = 'foundry';

const SPEAKER = 'Vess';
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit07/q3-change';

/* ------------------------------------------------------------------
   THE CASES (every figure is `planChange`)
   ------------------------------------------------------------------ */

const plan = (id, o) => planChange(id, o);

// Stage 3 and 4: the guess cards.
const GUESS = { more: 'Heavier', same: 'The same', less: 'Lighter' };
const WOOL_OPEN = plan('wool');

// Stage 6: steel wool at three settings, and 83.7 g (1.5 mol of iron) past the dial with the oxygen that goes with it.
const WOOL_DIAL = { list: [11.2, 22.3, 33.5], scales: [0.2, 0.4, 0.6] };
const ASKED_SCALE = 1.5;
const ASKED = plan('wool', { sealed: true, scale: ASKED_SCALE });
const ASKED_IRON = ASKED.before.find(b => b.from === 'jar').grams;
const ASKED_OXYGEN = ASKED.before.find(b => b.from === 'sealed').grams;
const ASKED_TOTAL = ASKED.massAfter;

/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */

const zoneOf = (t, id) => (t.pieces[id]?.zone || '').replace(/^(tray|slot):/, '');
const cardIn = (t, slot) => Object.values(t.pieces).find(p => p.zone === `slot:${slot}`) || null;
const nameOf = id => CASES[id].name;
const formulas = list => [...new Set(list.map(i => pretty(i.f.replace(/[+-]$/, m => (m === '+' ? '⁺' : '⁻')))))].join(', ');
const litNames = p => LAMPS.filter(([k]) => p.lamps[k]).map(([, n]) => n);
const GRAMS = x => `${fixed(x, 1)} g`;
const jarOf = (t, id) => t.pieces[id];

/** What the table shows of one change, before and after, in words for a refusal. */
function shown(id, sealed = false) {
  const p = plan(id, { sealed });
  const lamps = litNames(p);
  return `${nameOf(id)}: the window shows ${formulas(p.before)} before and ${formulas([...p.after, ...p.escaped])} after`
    + `${lamps.length ? `; lit: ${lamps.join(', ')}` : '; no lamp lit'}`;
}

/** The first jar of `ids` filed in the wrong tray, or null; or 'open' when one is still not filed. */
function sortCheck(t, truth) {
  const unfiled = Object.keys(truth).filter(id => !zoneOf(t, id) || !(zoneOf(t, id) in { same: 1, new: 1, heavier: 1, lighter: 1 }));
  if (unfiled.length) return { open: true };
  const wrong = Object.keys(truth).find(id => zoneOf(t, id) !== truth[id]);
  return wrong ? { wrong } : { ok: true };
}

/* ------------------------------------------------------------------
   LAYOUT SHARED BY THE STAGES
   ------------------------------------------------------------------ */

const POT_AT = { x: 36, y: 32 };
const POT_W = 70;
const TRAY_CELL = { cell: 21, cellH: 14 };

const NEW_TRAYS = [
  { id: 'same', label: 'Same substance after', at: { x: 92.5, y: 23.5 }, size: { w: 36, h: 30 }, cell: 17, cellH: 13.4 },
  { id: 'new', label: 'New substance after', at: { x: 130, y: 23.5 }, size: { w: 36, h: 30 }, cell: 17, cellH: 13.4 }
];

const J = (id, at, caseId, name, shownLine, extra) => cjar(id, name, at, caseId, { shown: shownLine }, extra);
const JARS = {
  ice: (at, id = 'ice') => J(id, at, 'ice', 'Ice', 'melts'),
  sugarwater: (at, id = 'sugarwater') => J(id, at, 'sugarwater', 'Sugar', 'in water'),
  saltwater: (at, id = 'saltwater') => J(id, at, 'saltwater', 'Salt', 'in water'),
  dryice: (at, id = 'dryice') => J(id, at, 'dryice', 'Dry ice', 'warms'),
  sugarheat: (at, id = 'sugarheat') => J(id, at, 'sugarheat', 'Sugar', 'heated'),
  wool: (at, id = 'wool') => J(id, at, 'wool', 'Steel wool', 'burned'),
  magnesium: (at, id = 'magnesium') => J(id, at, 'magnesium', 'Magnesium', 'burned'),
  wood: (at, id = 'wood') => J(id, at, 'wood', 'Wood chips', 'burned')
};
const hidden = (id, at, caseId, letter) => cjar(id, `Sample ${letter}`, at, caseId);

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const pot = changePotFixture('pot', POT_AT, { w: POT_W });
    const truth = { ice: 'same', sugarwater: 'same', sugarheat: 'new', wool: 'new' };
    return {
      id: 's1-new',
      title: 'Same or New',
      prompt: 'Sort the four changes by whether a new substance is in the pot afterwards.',
      widget,
      table: potTable({
        pieces: [JARS.ice({ x: 82, y: 47 }), JARS.sugarwater({ x: 101, y: 47 }), JARS.sugarheat({ x: 120, y: 47 }), JARS.wool({ x: 139, y: 47 })],
        fixtures: [pot.fixture],
        zones: { slots: [...pot.slots], trays: NEW_TRAYS }
      }),
      hints: [
        'Use the pot, its "Run" key and the two trays.',
        'Compare the particles in the window before the change with the particles after it.',
        'A change that leaves the same particles in the pot has made nothing new, and one that leaves different particles has.'
      ],
      check(state) {
        const r = sortCheck(state.table, truth);
        if (r.open) return { ok: false, notYet: true, msg: 'Put every jar in one of the two trays.' };
        if (r.ok) return { ok: true };
        return { ok: false, msg: `${shown(r.wrong)}.` };
      },
      reward: {
        log: 'Ice and dissolved sugar stayed the same substance; heated sugar and burned steel wool did not.',
        title: 'Physical or Chemical Change',
        body: 'In a physical change the same substance is still there afterwards, only its state or place has changed: ice and water are both H₂O. A chemical change makes a new substance, as heated sugar and burned steel wool did.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const pot = changePotFixture('pot', POT_AT, { w: POT_W });
    const lamps = evidenceFixture('lamps', 'pot', { x: 108, y: 12 }, { grid: true });
    return {
      id: 's2-lamp',
      title: 'A Lamp Is Lit',
      prompt: 'Pick the change that lit a lamp without making a new substance.',
      widget,
      table: potTable({
        pieces: [JARS.dryice({ x: 82, y: 31.5 }), JARS.wood({ x: 101, y: 31.5 }), JARS.wool({ x: 82, y: 45.5 }), JARS.sugarwater({ x: 101, y: 45.5 })],
        fixtures: [pot.fixture, lamps],
        zones: { slots: [...pot.slots, { id: 'pick', label: 'My pick', at: { x: 130, y: 40 }, size: { w: 24, h: 16 } }] }
      }),
      hints: [
        'Use the pot, its "Run" key and the four lamps.',
        'Compare which lamps lit with whether the window shows a new substance, for each jar.',
        'A lamp reports what the pot did, but only the particles in the window show whether a new substance was made.'
      ],
      check(state) {
        const jar = cardIn(state.table, 'pick');
        if (!jar) return { ok: false, notYet: true, msg: 'Put a jar in the slot.' };
        const p = plan(jar.props.case);
        if (p.newSubstance) return { ok: false, msg: `${shown(jar.props.case)}.` };
        if (!litNames(p).length) return { ok: false, msg: `${shown(jar.props.case)}.` };
        return { ok: true };
      },
      reward: {
        log: 'Dry ice lit the gas lamp and is still carbon dioxide.',
        title: 'Evidence of Reaction',
        body: 'A gas, a new colour, a solid or a change of temperature is evidence of reaction, but only evidence: dry ice gives off a gas and is still carbon dioxide. A new substance in the window is what shows a chemical change.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Steel Wool in an Open Pot',
    // A PREDICT STAGE: the pot is not on the table yet. The guess is made first and comes back with the test.
    predict: true,
    prompt: 'Choose how an open pot of steel wool weighs after the wool burns, compared with before.',
    widget,
    table: potTable({
      pieces: [chip('more', GUESS.more, { x: 40, y: 50 }), chip('same', GUESS.same, { x: 62, y: 50 }), chip('less', GUESS.less, { x: 84, y: 50 })],
      fixtures: [plaqueFixture('what', 'The pot', { x: 62, y: 14 }, ['Open to the air', 'Steel wool, 55.8 g'], { w: 50 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 62, y: 32 }, size: { w: 38, h: 14 } }] }
    }),
    hints: [
      'Use the three chips and the slot.',
      'Think about what burning does to the wool and what the open lid lets in or out.',
      'Commit to how the weight will change, then burn the wool in the next part and read the balance.'
    ],
    check(state) {
      const card = cardIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a chip in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = cardIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, burn the steel wool in an open pot and read the balance.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const pot = changePotFixture('pot', POT_AT, { w: POT_W });
    const bal = potScaleFixture('bal', 'pot', { x: 90, y: 13 });
    return {
      id: 's4-open',
      title: 'Burn It Open',
      get prompt() {
        const g = recall(QUEST_KEY);
        const guess = g && GUESS[g] ? `You guessed "${GUESS[g].toLowerCase()}". ` : '';
        return `${guess}Lay the chip for what the balance shows after the steel wool burns in the open pot.`;
      },
      widget,
      table: potTable({
        pieces: [
          JARS.wool({ x: 128, y: 13 }),
          chip('more', GUESS.more, { x: 84, y: 47 }), chip('same', GUESS.same, { x: 106, y: 47 }), chip('less', GUESS.less, { x: 128, y: 47 })
        ],
        fixtures: [pot.fixture, bal],
        zones: { slots: [...pot.slots, { id: 'ans', label: 'What the balance showed', at: { x: 106, y: 31 }, size: { w: 38, h: 14 } }] }
      }),
      hints: [
        'Use the wool jar, the pot, its "Run" key and the balance.',
        'Compare the balance before the burn with the balance after it, and the rows of the window.',
        'Whatever stands in the pot after the burn is what the balance weighs, so ask what joined the iron and where it came from.'
      ],
      check(state) {
        const card = cardIn(state.table, 'ans');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a chip in the slot.' };
        const t = state.table;
        if (card.id === 'more') return { ok: true };
        const r = changeRead(t, 'pot');
        if (!r.ran) return { ok: false, msg: 'The pot has not been run: the balance only has its reading from before.' };
        return { ok: false, msg: `The balance read ${GRAMS(r.plan.massBefore)} before and ${GRAMS(r.plan.massAfter)} after.` };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g && GUESS[g]
          ? (g === 'more' ? 'The balance agreed with your guess. ' : 'The balance did not agree with your guess, which is how a guess gets better. ')
          : '';
        return {
          log: 'The open pot read 55.8 g before and 79.8 g after.',
          title: 'An Open Pot Can Gain',
          body: `${verdict}Burning joined the iron to oxygen from the air, 4 Fe + 3 O₂ → 2 Fe₂O₃, so the pot gained 24.0 g.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const pot = changePotFixture('pot', POT_AT, { w: POT_W });
    const bal = potScaleFixture('bal', 'pot', { x: 90, y: 13 });
    const truth = { wool: 'heavier', magnesium: 'heavier', wood: 'lighter' };
    return {
      id: 's5-lighter',
      title: 'Heavier or Lighter',
      prompt: 'Sort the three burns by whether the open pot weighs more or less afterwards.',
      widget,
      table: potTable({
        pieces: [JARS.wool({ x: 122, y: 11 }), JARS.magnesium({ x: 140, y: 11 }), JARS.wood({ x: 122, y: 26 })],
        fixtures: [pot.fixture, bal],
        zones: {
          slots: [...pot.slots],
          trays: [
            { id: 'heavier', label: 'Weighs more after', at: { x: 92.5, y: 45.5 }, size: { w: 36, h: 14 }, cell: 17, cellH: 13.4 },
            { id: 'lighter', label: 'Weighs less after', at: { x: 130, y: 45.5 }, size: { w: 36, h: 14 }, cell: 17, cellH: 13.4 }
          ]
        }
      }),
      hints: [
        'Use the pot, its "Run" key, the balance and the two trays.',
        'Compare the balance before and after, and look at which rows of the window are grey.',
        'A burn that takes a gas in from the air makes the pot heavier, and a burn that lets a gas out makes it lighter.'
      ],
      check(state) {
        const r = sortCheck(state.table, truth);
        if (r.open) return { ok: false, notYet: true, msg: 'Put every jar in one of the two trays.' };
        if (r.ok) return { ok: true };
        const p = plan(r.wrong);
        return { ok: false, msg: `${nameOf(r.wrong)}: the balance read ${GRAMS(p.massBefore)} before and ${GRAMS(p.massAfter)} after.` };
      },
      reward: {
        log: 'Steel wool and magnesium gained weight in the open pot; wood chips lost it.',
        title: 'What Crosses the Lid',
        body: 'Iron and magnesium take in oxygen from the air, so an open pot gains weight when they burn. Wood sends carbon dioxide and water vapour out of the open pot, so it loses weight.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const pot = changePotFixture('pot', { x: 36, y: 30 }, { caseId: 'wool', lid: 'dial', amounts: { label: 'Steel wool', ...WOOL_DIAL }, unit: 0.05, w: POT_W });
    const bal = potScaleFixture('bal', 'pot', { x: 90, y: 13 });
    return {
      id: 's6-sealed',
      title: 'A Sealed Pot',
      prompt: `Type what a sealed pot weighs after ${ASKED_IRON.toFixed(1)} g of steel wool burns in it, with ${ASKED_OXYGEN.toFixed(1)} g of oxygen sealed in.`,
      entry: { id: 'g', label: 'Pot after', unit: 'g' },
      widget,
      table: potTable({
        fixtures: [pot.fixture, bal],
        zones: { slots: [] }
      }),
      hints: [
        'Use the "Lid" and "Steel wool" dials, the "Run" key and the balance.',
        'Seal the lid and compare the balance before and after the burn at each amount.',
        'Nothing enters or leaves a sealed pot, so what it weighs after is what it weighed with everything loaded in.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'g');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the mass in grams.' };
        if (Math.abs(v - ASKED_TOTAL) <= 0.15) return { ok: true };
        if (Math.abs(v - ASKED_IRON) <= 0.15) return { ok: false, msg: `${fixed(v, 1)} g is the steel wool alone; ${ASKED_OXYGEN.toFixed(1)} g of oxygen was sealed in with it.` };
        const sealedRuns = t.recorder.rows.filter(r => r.label.includes('|1|'));
        if (!sealedRuns.length) return { ok: false, msg: 'The pot has not been run sealed yet.' };
        const last = sealedRuns[sealedRuns.length - 1];
        return { ok: false, msg: `${fixed(v, 1)} g does not carry on from the sealed pot, which read ${GRAMS(last.x)} before and ${GRAMS(last.y)} after.` };
      },
      reward: {
        log: `${ASKED_IRON.toFixed(1)} g of iron and ${ASKED_OXYGEN.toFixed(1)} g of oxygen weigh ${ASKED_TOTAL.toFixed(1)} g as iron oxide.`,
        title: 'A Sealed Pot Keeps Its Mass',
        body: `Nothing enters or leaves a sealed pot, so it weighs the same after a reaction as before: ${ASKED_IRON.toFixed(1)} g of iron and ${ASKED_OXYGEN.toFixed(1)} g of oxygen make ${ASKED_TOTAL.toFixed(1)} g of iron oxide. This is the conservation of mass for a whole pot.`
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const pot = changePotFixture('pot', POT_AT, { w: POT_W });
    return {
      id: 's7-same',
      title: 'The Same Particles',
      prompt: 'Pick the change after which the pot holds the same particles it began with.',
      widget,
      table: potTable({
        pieces: [JARS.saltwater({ x: 82, y: 14 }), JARS.wood({ x: 101, y: 14 }), JARS.wool({ x: 82, y: 30 }), JARS.magnesium({ x: 101, y: 30 })],
        fixtures: [pot.fixture],
        zones: { slots: [...pot.slots, { id: 'pick', label: 'My pick', at: { x: 130, y: 24 }, size: { w: 24, h: 16 } }] }
      }),
      hints: [
        'Use the pot, its "Run" key and the slot.',
        'Compare the particles in the window before and after, row by row, for each jar.',
        'The same particles before and after means no new substance, however the rows are arranged.'
      ],
      check(state) {
        const jar = cardIn(state.table, 'pick');
        if (!jar) return { ok: false, notYet: true, msg: 'Put a jar in the slot.' };
        const p = plan(jar.props.case);
        if (!p.newSubstance) return { ok: true };
        return { ok: false, msg: `${shown(jar.props.case)}.` };
      },
      reward: {
        log: 'Salt in water: the same ions before and after.',
        title: 'Dissolving Is Physical',
        body: 'The window shows the same Na⁺ and Cl⁻ ions in the crystal and in the water, so no new substance forms and dissolving salt is classed as a physical change. Some chemists argue otherwise, because the bonds between the ions do break.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const pot = changePotFixture('pot', POT_AT, { lid: 'sealed', w: POT_W });
    const lamps = evidenceFixture('lamps', 'pot', { x: 108, y: 12 }, { grid: true });
    const truth = { a: 'new', b: 'same', c: 'same' };
    return {
      id: 's8-sealed',
      title: 'Three Samples',
      prompt: 'Sort samples A, B and C by whether a new substance forms in the sealed pot.',
      widget,
      table: potTable({
        pieces: [hidden('a', { x: 82, y: 52 }, 'wood', 'A'), hidden('b', { x: 101, y: 52 }, 'dryice', 'B'), hidden('c', { x: 120, y: 52 }, 'ice', 'C')],
        fixtures: [pot.fixture, lamps],
        zones: {
          slots: [...pot.slots],
          trays: [
            { id: 'same', label: 'Same substance after', at: { x: 92.5, y: 37 }, size: { w: 36, h: 15 }, cell: 17, cellH: 13.4 },
            { id: 'new', label: 'New substance after', at: { x: 130, y: 37 }, size: { w: 36, h: 15 }, cell: 17, cellH: 13.4 }
          ]
        }
      }),
      hints: [
        'Use the pot, its "Run" key and the two trays.',
        'Two samples may light the same lamps, so compare the particles in the window as well.',
        'A lit lamp only reports what the pot did; a sample made something new only if different particles stand in the pot afterwards.'
      ],
      check(state) {
        const r = sortCheck(state.table, truth);
        if (r.open) return { ok: false, notYet: true, msg: 'Put every sample in one of the two trays.' };
        if (r.ok) return { ok: true };
        const t = state.table;
        const id = t.pieces[r.wrong].props.case;
        const p = plan(id, { sealed: true });
        const lamps = litNames(p);
        return { ok: false, msg: `Sample ${r.wrong.toUpperCase()}: the window shows ${formulas(p.before)} before and ${formulas(p.after)} after${lamps.length ? `; lit: ${lamps.join(', ')}` : '; no lamp lit'}.` };
      },
      reward: {
        log: 'Only sample A made a new substance.',
        title: 'Evidence, Then Proof',
        body: 'Samples A and B lit the same lamps, yet only A made new particles. A lit lamp is evidence of reaction; a chemical change is shown by a new substance in the pot, and a physical change by the same substance still being there.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Seat a jar, press Run, file it.'],
  2: ['Run each jar; slot your pick.'],
  3: ['Drag your chip into the slot.'],
  4: ['Run the pot, then pick a chip.'],
  5: ['Seat each jar, Run, file it.'],
  6: ['Set the dials, Run, then type.'],
  7: ['Run each jar; slot your pick.'],
  8: ['Run each sample, then file it.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'A chemical change makes a new substance and a physical change does not, and a lamp lit in the pot is only evidence of reaction. A sealed pot weighs the same before and after, so metal in a ledger cannot appear from nowhere.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const run = id => ({ run: id });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const seat = id => put(id, 'slot:pot.in');
const file = (id, tray) => put(id, `tray:${tray}`);

export const SOLUTIONS = [
  [seat('ice'), run('pot'), file('ice', 'same'), seat('sugarwater'), run('pot'), file('sugarwater', 'same'), seat('sugarheat'), run('pot'), file('sugarheat', 'new'), seat('wool'), run('pot'), file('wool', 'new')],
  [seat('dryice'), run('pot'), put('dryice', 'slot:pick')],
  [put('less', 'slot:guess')],
  [seat('wool'), run('pot'), put('more', 'slot:ans')],
  [seat('wool'), run('pot'), file('wool', 'heavier'), seat('magnesium'), run('pot'), file('magnesium', 'heavier'), seat('wood'), run('pot'), file('wood', 'lighter')],
  [dial('pot', 'lid', 2), dial('pot', 'amount', 3), run('pot'), typed('g', ASKED_TOTAL.toFixed(1))],
  [seat('saltwater'), run('pot'), put('saltwater', 'slot:pick')],
  [seat('a'), run('pot'), file('a', 'new'), seat('b'), run('pot'), file('b', 'same'), seat('c'), run('pot'), file('c', 'same')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [seat('ice'), run('pot'), file('ice', 'new'), file('sugarwater', 'same'), file('sugarheat', 'new'), file('wool', 'new')],
  [seat('wood'), run('pot'), put('wood', 'slot:pick')],
  [],
  [seat('wool'), run('pot'), put('less', 'slot:ans')],
  [file('wool', 'heavier'), file('magnesium', 'heavier'), file('wood', 'heavier')],
  [dial('pot', 'lid', 2), run('pot'), typed('g', ASKED_IRON.toFixed(1))],
  [seat('wood'), run('pot'), put('wood', 'slot:pick')],
  [file('a', 'same'), file('b', 'same'), file('c', 'same')]
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
    STAGES, DEBRIEF, blankState, toolNoteFor, room: ROOM,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = {
  GUESS, WOOL_DIAL, ASKED_SCALE, answers: { woolBefore: WOOL_OPEN.massBefore, woolAfter: WOOL_OPEN.massAfter, askedIron: ASKED_IRON, askedOxygen: ASKED_OXYGEN, askedTotal: ASKED_TOTAL }
};
export { changeRead, scaleRead, lampsRead };
