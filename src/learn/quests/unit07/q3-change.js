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

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bphysical changes?\b/i, introducedAt: 1 },
  { term: /\bchemical changes?\b/i, introducedAt: 1 },
  { term: /\bevidence of reaction\b/i, introducedAt: 2 },
  { term: /\bconservation of mass\b/i, introducedAt: 6 }
];

/** The conservation of mass is bench 1's: this bench uses it on a whole pot. */
export const BUILDS_ON = [];

export const ROOM = 'foundry';

const SPEAKER = 'Vess';
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit07/q3-change';

/* ------------------------------------------------------------------
   THE CASES (every figure is `planChange`)
   ------------------------------------------------------------------ */

const plan = (id, o) => planChange(id, o);

// Stage 3: the guess cards.
const GUESS = { more: 'Greater', same: 'The same', less: 'Less' };
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
  return `${nameOf(id)}: the particle view shows ${formulas(p.before)} before and ${formulas([...p.after, ...p.escaped])} after`
    + `${lamps.length ? `; lit: ${lamps.join(', ')}` : '; no sign lit'}`;
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
  { id: 'same', label: 'Physical change', at: { x: 92.5, y: 23.5 }, size: { w: 36, h: 30 }, cell: 17, cellH: 13.4 },
  { id: 'new', label: 'Chemical change', at: { x: 130, y: 23.5 }, size: { w: 36, h: 30 }, cell: 17, cellH: 13.4 }
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
      briefing: {
        speaker: SPEAKER,
        body: 'In a physical change the substance is the same afterwards. In a chemical change a new substance has formed.'
      },
      prompt: 'Which of these changes are physical and which are chemical?',
      widget,
      table: potTable({
        pieces: [JARS.ice({ x: 82, y: 47 }), JARS.sugarwater({ x: 101, y: 47 }), JARS.sugarheat({ x: 120, y: 47 }), JARS.wool({ x: 139, y: 47 })],
        fixtures: [pot.fixture],
        zones: { slots: [...pot.slots], trays: NEW_TRAYS }
      }),
      hints: [
        'Run each jar in the reaction vessel, then sort it into a tray.',
        'Compare the particles in the particle view before the change with the particles after it.',
        'Think about whether the particles after the change are the same substance or a new one.'
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
        body: 'Melted ice is still H₂O and dissolved sugar is still sugar, so those are physical changes. Heated sugar and burned steel wool left new particles, so those are chemical changes.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const pot = changePotFixture('pot', POT_AT, { w: POT_W });
    const lamps = evidenceFixture('lamps', 'pot', { x: 108, y: 12 }, { grid: true });
    return {
      id: 's2-lamp',
      title: 'A Sign Is Not Proof',
      prompt: 'Which change gives a sign of a reaction without making a new substance?',
      widget,
      table: potTable({
        pieces: [JARS.dryice({ x: 82, y: 31.5 }), JARS.wood({ x: 101, y: 31.5 }), JARS.wool({ x: 82, y: 45.5 }), JARS.sugarwater({ x: 101, y: 45.5 })],
        fixtures: [pot.fixture, lamps],
        zones: { slots: [...pot.slots, { id: 'pick', label: 'My pick', at: { x: 130, y: 40 }, size: { w: 24, h: 16 } }] }
      }),
      hints: [
        'Run each jar in the reaction vessel and watch the four signs.',
        'Compare which signs light up with whether the particle view shows a new substance.',
        'A sign tells you something happened, but only the particles show whether a new substance formed.'
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
        log: 'Dry ice lit the gas sign and is still carbon dioxide.',
        title: 'Evidence of Reaction',
        body: 'Dry ice gives off a gas and is still carbon dioxide. A sign is only evidence of reaction; only a new substance shows a chemical change.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Steel Wool in an Open Vessel',
    // A PREDICT STAGE: the vessel is not on the table yet. The guess is made first and comes back with the test.
    predict: true,
    prompt: 'After steel wool burns in an open vessel, is the mass greater, the same or less?',
    widget,
    table: potTable({
      pieces: [chip('more', GUESS.more, { x: 40, y: 50 }), chip('same', GUESS.same, { x: 62, y: 50 }), chip('less', GUESS.less, { x: 84, y: 50 })],
      fixtures: [plaqueFixture('what', 'The vessel', { x: 62, y: 14 }, ['Open to the air', 'Steel wool, 55.8 g'], { w: 50 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 62, y: 32 }, size: { w: 38, h: 14 } }] }
    }),
    hints: [
      'Look at the three cards and the prediction slot.',
      'Think about what burning does to the steel wool and what an open lid lets in or out.',
      'Decide whether burning in open air adds mass, leaves it unchanged or takes mass away.'
    ],
    check(state) {
      const card = cardIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = cardIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, burn the steel wool in an open vessel and read the balance.'
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
        return `${guess}Where did the extra mass come from when the steel wool burned?`;
      },
      widget,
      table: potTable({
        pieces: [
          JARS.wool({ x: 128, y: 13 }),
          chip('air', 'O₂ from air', { x: 84, y: 48 }),
          chip('heat', 'Heat added', { x: 106, y: 48 }),
          chip('none', 'Nothing added', { x: 128, y: 48 })
        ],
        fixtures: [pot.fixture, bal],
        zones: { slots: [...pot.slots, { id: 'ans', label: 'Cause', at: { x: 106, y: 31 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Burn the steel wool in the reaction vessel and watch the balance and particle view.',
        'Compare the balance before and after the burn, and look at the rows of the particle view.',
        'Look at which particles were not in the jar at the start but appear in the iron oxide afterwards.'
      ],
      check(state) {
        const card = cardIn(state.table, 'ans');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        const t = state.table;
        if (card.id === 'air') return { ok: true };
        const r = changeRead(t, 'pot');
        if (!r.ran) return { ok: false, msg: 'The reaction vessel has not been run: the balance only has its reading from before.' };
        if (card.id === 'heat') return { ok: false, msg: `Heat adds no particles; the balance read ${GRAMS(r.plan.massBefore)} before and ${GRAMS(r.plan.massAfter)} after.` };
        return { ok: false, msg: `The balance rose from ${GRAMS(r.plan.massBefore)} to ${GRAMS(r.plan.massAfter)}, so something was added.` };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g && GUESS[g]
          ? (g === 'more' ? 'The balance agreed with your guess. ' : 'The balance did not agree with your guess, which is how a guess gets better. ')
          : '';
        return {
          log: 'The open vessel read 55.8 g before and 79.8 g after.',
          title: 'An Open Vessel Can Gain',
          body: `${verdict}The iron bonded to oxygen from the air, 4 Fe + 3 O₂ → 2 Fe₂O₃, so the vessel gained the mass of that oxygen: 24.0 g.`
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
      prompt: 'Which burns make an open vessel gain mass and which make it lose mass?',
      widget,
      table: potTable({
        pieces: [JARS.wool({ x: 122, y: 11 }), JARS.magnesium({ x: 140, y: 11 }), JARS.wood({ x: 122, y: 26 })],
        fixtures: [pot.fixture, bal],
        zones: {
          slots: [...pot.slots],
          trays: [
            { id: 'heavier', label: 'Gains mass: gas in', at: { x: 92.5, y: 45.5 }, size: { w: 36, h: 14 }, cell: 17, cellH: 13.4 },
            { id: 'lighter', label: 'Loses mass: gas out', at: { x: 130, y: 45.5 }, size: { w: 36, h: 14 }, cell: 17, cellH: 13.4 }
          ]
        }
      }),
      hints: [
        'Run each jar in the reaction vessel and watch the balance and particle view.',
        'Compare the balance before and after, and look at which rows of the particle view are grey.',
        'A burn that takes a gas in from the air gains mass, and one that lets a gas out loses mass.'
      ],
      check(state) {
        const r = sortCheck(state.table, truth);
        if (r.open) return { ok: false, notYet: true, msg: 'Put every jar in one of the two trays.' };
        if (r.ok) return { ok: true };
        const p = plan(r.wrong);
        return { ok: false, msg: `${nameOf(r.wrong)}: the balance read ${GRAMS(p.massBefore)} before and ${GRAMS(p.massAfter)} after.` };
      },
      reward: {
        log: 'Steel wool and magnesium gained mass in the open vessel; wood chips lost it.',
        title: 'What Crosses the Lid',
        body: 'Iron and magnesium take in oxygen and gain mass. Wood gives off carbon dioxide and water vapour and loses mass.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const pot = changePotFixture('pot', { x: 36, y: 30 }, { caseId: 'wool', lid: 'dial', amounts: { label: 'Steel wool', ...WOOL_DIAL }, unit: 0.05, w: POT_W });
    const bal = potScaleFixture('bal', 'pot', { x: 90, y: 13 });
    return {
      id: 's6-sealed',
      title: 'A Sealed Vessel',
      prompt: `What is the mass of the contents of a sealed vessel after ${ASKED_IRON.toFixed(1)} g of steel wool burns with the ${ASKED_OXYGEN.toFixed(1)} g of oxygen inside?`,
      entry: { id: 'g', label: 'Vessel after', unit: 'g' },
      widget,
      table: potTable({
        fixtures: [pot.fixture, bal],
        zones: { slots: [] }
      }),
      hints: [
        'Set the "Lid" dial to sealed and run the "Steel wool" dial at different amounts.',
        'Compare the balance before and after each burn when the lid is sealed.',
        'Nothing enters or leaves a sealed vessel, so the mass after equals the total mass loaded in.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'g');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the mass in grams.' };
        if (Math.abs(v - ASKED_TOTAL) <= 0.15) return { ok: true };
        if (Math.abs(v - ASKED_IRON) <= 0.15) return { ok: false, msg: `${fixed(v, 1)} g is the steel wool alone; ${ASKED_OXYGEN.toFixed(1)} g of oxygen was sealed in with it.` };
        const sealedRuns = t.recorder.rows.filter(r => r.label.includes('|1|'));
        if (!sealedRuns.length) return { ok: false, msg: 'The reaction vessel has not been run sealed yet.' };
        const last = sealedRuns[sealedRuns.length - 1];
        return { ok: false, msg: `${fixed(v, 1)} g does not carry on from the sealed vessel, which read ${GRAMS(last.x)} before and ${GRAMS(last.y)} after.` };
      },
      reward: {
        log: `${ASKED_IRON.toFixed(1)} g of iron and ${ASKED_OXYGEN.toFixed(1)} g of oxygen have a mass of ${ASKED_TOTAL.toFixed(1)} g as iron oxide.`,
        title: 'A Sealed Vessel Keeps Its Mass',
        body: `${ASKED_IRON.toFixed(1)} g of iron and ${ASKED_OXYGEN.toFixed(1)} g of oxygen make ${ASKED_TOTAL.toFixed(1)} g of iron oxide. This is conservation of mass: mass is conserved when nothing enters or leaves.`
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const pot = changePotFixture('pot', POT_AT, { w: POT_W });
    return {
      id: 's7-same',
      title: 'The Same Particles',
      prompt: 'After which change does the vessel hold the same particles it began with?',
      widget,
      table: potTable({
        pieces: [JARS.saltwater({ x: 82, y: 14 }), JARS.wood({ x: 101, y: 14 }), JARS.wool({ x: 82, y: 30 }), JARS.magnesium({ x: 101, y: 30 })],
        fixtures: [pot.fixture],
        zones: { slots: [...pot.slots, { id: 'pick', label: 'My pick', at: { x: 130, y: 24 }, size: { w: 24, h: 16 } }] }
      }),
      hints: [
        'Run each jar in the reaction vessel and look at the particle view.',
        'Compare the particles before and after, row by row, for each jar.',
        'The same particles before and after means no new substance formed, even if they spread out.'
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
        body: 'The Na⁺ and Cl⁻ ions are the same before and after, so dissolving salt is classed as a physical change, though the ions do separate.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Seat a jar, press Run, sort it.'],
  2: ['Run each jar; slot your pick.'],
  3: ['Drag your card into the slot.'],
  4: ['Run the vessel, then pick a card.'],
  5: ['Seat each jar, Run, sort it.'],
  6: ['Set the dials, Run, then type.'],
  7: ['Run each jar; slot your pick.']
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
      body: 'A chemical change makes a new substance and a physical change does not, and a sign lit on the vessel is only evidence of reaction. A sealed vessel has the same mass before and after, so metal in a ledger cannot appear from nowhere.'
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
  [seat('wool'), run('pot'), put('air', 'slot:ans')],
  [seat('wool'), run('pot'), file('wool', 'heavier'), seat('magnesium'), run('pot'), file('magnesium', 'heavier'), seat('wood'), run('pot'), file('wood', 'lighter')],
  [dial('pot', 'lid', 2), dial('pot', 'amount', 3), run('pot'), typed('g', ASKED_TOTAL.toFixed(1))],
  [seat('saltwater'), run('pot'), put('saltwater', 'slot:pick')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [seat('ice'), run('pot'), file('ice', 'new'), file('sugarwater', 'same'), file('sugarheat', 'new'), file('wool', 'new')],
  [seat('wood'), run('pot'), put('wood', 'slot:pick')],
  [],
  [seat('wool'), run('pot'), put('heat', 'slot:ans')],
  [file('wool', 'heavier'), file('magnesium', 'heavier'), file('wood', 'heavier')],
  [dial('pot', 'lid', 2), run('pot'), typed('g', ASKED_IRON.toFixed(1))],
  [seat('wood'), run('pot'), put('wood', 'slot:pick')]
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
