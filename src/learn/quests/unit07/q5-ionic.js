/**
 * Unit 7 · Bench 5 — Net Ionic Equations (q5-ionic)
 *
 * The effluent sump, on the pot kit (`table/kits/pot-ionic.js`): a pot that takes two solution jars, a window of ions before and
 * after mixing, a lamp that shines with the number of dissolved ions, and a filter. Every reading is `reactdata-ionic.js`
 * `mixOutcome`, which is `reactdata.js` `planMix` with the amounts poured in worked out so neither jar is left over. ONE click: the
 * belief that when two solutions are mixed, everything in them reacts.
 *
 *   1  pour the lead nitrate and potassium iodide together and collect the solid on the paper         -> precipitate
 *   2  PREDICT: which ions are still in the water once the cloud has settled                          (the held model: all react)
 *   3  TEST: window and lamp; put the ions still in the water in the tray                             -> spectator ions
 *   4  build the equation of only the ions that reacted, counted from the window                      -> net ionic equation
 *   5  PREDICT: which ions will always stay in the water, whatever they are mixed with
 *   6  TEST: four mixtures; the ions that stayed in the water every time                               -> solubility rules
 *   7  clear solutions of an acid and a base: build what reacted                                       -> H+ + OH- -> H2O
 *   8  sealed: the complete ionic equation of a pair of unlabelled jars                                -> complete ionic equation
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { potTable, stmt } from '../../table/kits/pot.js';
import { ionPotFixture, filterFixture, solutionJar, ionPuck, formulaChip, ionPotRead, mixesRun, filterRead } from '../../table/kits/pot-ionic.js';
import { ionText, pretty } from '../../engine/reactdata.js';
import { mixOutcome } from '../../engine/reactdata-ionic.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bprecipitates?\b/i, introducedAt: 1 },
  { term: /\bspectator ions?\b/i, introducedAt: 3 },
  { term: /\bnet ionic equations?\b/i, introducedAt: 4 },
  { term: /\bsolubility rules?\b/i, introducedAt: 6 },
  { term: /\bcomplete ionic equations?\b/i, introducedAt: 8 }
];

/** Ions, cations and anions are Tallow's. */
export const BUILDS_ON = ['unit01/q4-ledger'];

export const ROOM = 'foundry';

const SPEAKER = 'Vess';
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit07/q5-ionic';

/* ------------------------------------------------------------------
   THE CASES
   ------------------------------------------------------------------ */

const S = (cat, an) => ({ cat, an });
const LEAD = [S('Pb2', 'NO3'), S('K', 'I')];            // yellow PbI2
const FOUR = [                                           // stage 5 and 6
  [S('Ag', 'NO3'), S('Na', 'Cl')],                       // AgCl
  [S('Pb2', 'NO3'), S('K', 'SO4')],                      // PbSO4
  [S('NH4', 'Cl'), S('K', 'NO3')],                       // nothing
  [S('NH4', 'SO4'), S('Na', 'Cl')]                       // nothing
];
const ACID = [S('H', 'Cl'), S('Na', 'OH')];             // water
const SEALED = [S('Ag', 'NO3'), S('K', 'Br')];          // AgBr

const POOL = ['Na', 'K', 'NH4', 'NO3', 'Ag', 'Pb2', 'Cl', 'SO4'];
/** The ions that left the water in at least one of the four mixtures. */
const LEFT_ONCE = new Set(FOUR.flatMap(([A, B]) => Object.keys(mixOutcome(A, B).reacted)));
const STAYED = POOL.filter(id => !LEFT_ONCE.has(id));

/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */

const live = p => !p.hidden;
/** The ions standing in a tray, as counts. */
function ionsIn(t, tray) {
  const c = {};
  for (const p of Object.values(t.pieces)) if (live(p) && p.kind === 'ion' && p.zone === `tray:${tray}`) c[p.props.ion] = (c[p.props.ion] || 0) + 1;
  return c;
}
/** The formula chip standing in a slot, or null. */
const chipIn = (t, slot) => Object.values(t.pieces).find(p => live(p) && p.kind === 'formula' && (p.zone === `slot:${slot}` || p.zone === `tray:${slot}`)) || null;
const sameCounts = (a, b) => { const ks = new Set([...Object.keys(a), ...Object.keys(b)]); return [...ks].every(k => (a[k] || 0) === (b[k] || 0)); };
const total = c => Object.values(c).reduce((a, b) => a + b, 0);
const plural = n => (n === 1 ? 'disc' : 'discs');

const pucks = (ids, row, x0, dx) => ids.flatMap((spec, i) => {
  const [id, ion] = spec;
  return [ionPuck(id, ion, { x: x0 + i * dx, y: row })];
});
const trayAt = (id, label, at, size) => ({ id, label, at, size, cell: 14, cellH: 14 });

/* Stage 3 and 4 and 7 and 8 start with the jars already in the seats of the pot. */
const jarsSeated = (pair, ids, o = {}) => pair.map((s, i) => solutionJar(ids[i], { x: 0, y: 0 }, { ...s, ...(o.sealed ? { label: `Jar ${'AB'[i]}`, sealed: true } : {}), ...(o.names?.[i] ? { name: o.names[i] } : {}) }, { zone: `slot:pot.in${i + 1}` }));

const GUESS = {
  gnone: 'No ions are left in the water',
  gall: 'All four ions are still in the water',
  gleft: 'Only Pb²⁺ and I⁻ are left',
  gspec: 'Only K⁺ and NO₃⁻ are left',
  gmetal: 'Only Pb²⁺ and K⁺ are left'
};
const GUESS_RIGHT = 'gspec';

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const p = ionPotFixture('pot', { x: 29, y: 26 }, {});
    const f = filterFixture('filter', { x: 70, y: 17 }, { pot: 'pot' });
    return {
      id: 's1-cloud',
      title: 'Two Clear Solutions',
      prompt: 'Pour the two solutions together and collect on the paper what forms.',
      widget,
      table: potTable({
        pieces: [
          solutionJar('pb', { x: 100, y: 12 }, { ...LEAD[0] }),
          solutionJar('ki', { x: 124, y: 12 }, { ...LEAD[1] })
        ],
        fixtures: [p.fixture, f],
        zones: { slots: p.slots }
      }),
      hints: [
        'Use the two jars, the pot with its "Mix" key, and the "Filter" key.',
        'Look at the glass of the pot and at the paper before and after each key.',
        'Pour the jars together first; the filter can only lift out something that is in the pot.'
      ],
      check(state) {
        const r = ionPotRead(state.table, 'pot');
        if (!r.ready) return { ok: false, notYet: true, msg: 'Put a jar in each seat of the pot.' };
        if (!r.ran) return { ok: false, notYet: true, msg: 'The jars have not been poured together yet.' };
        if (!filterRead(state.table, 'filter').done) return { ok: false, msg: 'The glass of the pot is cloudy and the paper is still empty.' };
        return { ok: true };
      },
      reward: {
        log: 'A yellow solid formed from two clear solutions.',
        title: 'Precipitate',
        body: 'Two clear solutions made a cloud, and the cloud settled into a yellow solid that the filter caught. A solid that forms when solutions are mixed is a precipitate.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'What Is Left in the Water',
    // A PREDICT STAGE: the pot is not on the table yet.
    predict: true,
    prompt: 'Choose which ions are still in the water after the lead nitrate and potassium iodide solutions are mixed and the cloud settles.',
    widget,
    table: potTable({
      pieces: Object.entries(GUESS).map(([id, label], i) => stmt(id, label, { x: 24 + (i % 2) * 38, y: 10 + Math.floor(i / 2) * 16 })),
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 116, y: 30 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the five cards and the slot.',
      'Think about which of the four ions in the two jars ended up in the cloud, and which of them could have stayed dissolved.',
      'Commit to the ions you expect to find in the water, then mix the jars to see them.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, mix the same two solutions again and look at the ions in the water before and after.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const p = ionPotFixture('pot', { x: 57, y: 26 }, { window: true, lamp: true });
    return {
      id: 's3-water',
      title: 'Still Dissolved',
      get prompt() {
        const g = recall(QUEST_KEY);
        const guess = g && GUESS[g] ? `You guessed: ${GUESS[g]}. ` : '';
        return `${guess}Put in the tray each ion that is still dissolved in the water.`;
      },
      widget,
      table: potTable({
        pieces: [
          ...jarsSeated(LEAD, ['pb', 'ki']),
          ...pucks([['pPb', 'Pb2'], ['pNO3', 'NO3'], ['pK', 'K'], ['pI', 'I']], 57, 14, 20)
        ],
        fixtures: [p.fixture],
        zones: { slots: p.slots, trays: [trayAt('water', 'Still in the water', { x: 131, y: 20 }, { w: 28, h: 28 })] }
      }),
      hints: [
        'Use the "Mix" key, then drag the ion pucks into the tray.',
        'Compare the discs in BEFORE and AFTER, and the two bulbs.',
        'An ion that is still dissolved is drawn loose in the water of AFTER, not packed together at the bottom.'
      ],
      check(state) {
        const t = state.table;
        const r = ionPotRead(t, 'pot');
        if (!r.ran) return { ok: false, notYet: true, msg: 'The jars have not been poured together yet.' };
        const have = ionsIn(t, 'water');
        if (!total(have)) return { ok: false, notYet: true, msg: 'The tray is empty.' };
        const want = r.out.after;
        for (const id of Object.keys(have)) if (!want[id]) return { ok: false, msg: `There are no ${ionText(id)} discs loose in the water of AFTER.` };
        for (const id of Object.keys(want)) if (!have[id]) return { ok: false, msg: `AFTER still shows ${ionText(id)} discs loose in the water, and the tray has none.` };
        return { ok: true };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g && GUESS[g] ? (g === GUESS_RIGHT ? 'The window agreed with your guess. ' : 'The window did not agree with your guess, which is how a guess gets better. ') : '';
        return {
          log: 'K⁺ and NO₃⁻ were in the water before and after.',
          title: 'Spectator Ions',
          body: `${verdict}The potassium and nitrate ions were in the water before the mixing and after it, unchanged, and the bulb stayed lit because of them. Ions that are unchanged through a mixing are spectator ions.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const p = ionPotFixture('pot', { x: 45, y: 26 }, { window: true });
    return {
      id: 's4-net',
      title: 'Only What Reacted',
      prompt: 'Build the equation for only the ions that reacted.',
      widget,
      table: potTable({
        pieces: [
          ...jarsSeated(LEAD, ['pb', 'ki']),
          ...pucks([['pPb', 'Pb2'], ['pN1', 'NO3'], ['pN2', 'NO3'], ['pK1', 'K'], ['pK2', 'K'], ['pI1', 'I'], ['pI2', 'I']], 57.5, 8, 12.8),
          formulaChip('fPbI2', 'PbI2', 's', { x: 99, y: 46 }),
          formulaChip('fKNO3', 'KNO3', 's', { x: 119.5, y: 46 }),
          formulaChip('fPbNO3', 'Pb(NO3)2', 's', { x: 140, y: 46 })
        ],
        fixtures: [p.fixture],
        zones: {
          slots: [...p.slots, { id: 'solid', label: 'Solid formed', at: { x: 119, y: 28 }, size: { w: 24, h: 12 } }],
          trays: [trayAt('reacted', 'Ions that reacted', { x: 119, y: 12 }, { w: 56, h: 14 })]
        }
      }),
      hints: [
        'Use the "Mix" key, then drag ion pucks into the tray and a formula chip into the slot.',
        'Compare how many discs of each ion are in BEFORE and in AFTER.',
        'Count only the ions whose discs left the water, and write the packed solid as one formula.'
      ],
      check(state) {
        const t = state.table;
        const r = ionPotRead(t, 'pot');
        if (!r.ran) return { ok: false, notYet: true, msg: 'The jars have not been poured together yet.' };
        const have = ionsIn(t, 'reacted');
        const chip = chipIn(t, 'solid');
        if (!total(have) && !chip) return { ok: false, notYet: true, msg: 'The tray and the slot are empty.' };
        const o = r.out;
        for (const id of Object.keys(have)) if (!o.reacted[id]) return { ok: false, msg: `${ionText(id)} is in the window both before and after.` };
        for (const [id, n] of Object.entries(o.reacted)) if ((have[id] || 0) !== n) return { ok: false, msg: `${n} ${ionText(id)} ${plural(n)} left the water, and the tray holds ${have[id] || 0}.` };
        if (!chip) return { ok: false, msg: 'The packed discs at the bottom of AFTER have no formula in the slot.' };
        if (chip.props.f !== o.solid.formula) return { ok: false, msg: 'The packed discs at the bottom of AFTER do not match the chip in the slot.' };
        return { ok: true };
      },
      reward: {
        log: 'Pb²⁺ + 2 I⁻ → PbI₂(s)',
        title: 'Net Ionic Equation',
        body: 'Pb²⁺(aq) + 2 I⁻(aq) → PbI₂(s) shows only the ions that changed, counted as they left the water. An equation that leaves out the spectator ions is a net ionic equation.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-predict',
    title: 'Ions That Always Stay',
    predict: true,
    prompt: 'Choose the ions you think stay in the water, whatever solution they are mixed with.',
    widget,
    table: potTable({
      pieces: pucks(POOL.map(id => [`g${id}`, id]), 18, 14, 16).map((p, i) => ({ ...p, at: { x: 14 + (i % 4) * 20, y: 14 + Math.floor(i / 4) * 20 } })),
      zones: { trays: [trayAt('guess', 'I think these always stay', { x: 112, y: 28 }, { w: 56, h: 28 })] }
    }),
    hints: [
      'Use the eight ion pucks and the tray.',
      'Think about which of the eight you have seen leave the water to make a solid, and which stood by.',
      'Commit to the ions you expect never to leave the water, then mix four pairs of solutions to test them.'
    ],
    check(state) {
      const have = ionsIn(state.table, 'guess');
      if (!total(have)) return { ok: false, notYet: true, msg: 'Put your guess in the tray.' };
      return { ok: true };
    },
    onClear(state) {
      remember(`${QUEST_KEY}#5`, Object.keys(ionsIn(state.table, 'guess')).sort().join(','));
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, mix four pairs of solutions and watch which ions ever leave the water.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const p = ionPotFixture('pot', { x: 45, y: 26 }, { window: true, mixes: FOUR });
    return {
      id: 's6-rules',
      title: 'Four Mixtures',
      get prompt() {
        const g = recall(`${QUEST_KEY}#5`);
        const guess = g ? `You guessed: ${g.split(',').map(id => ionText(id)).join(', ')}. ` : '';
        return `${guess}Put in the tray the ions that stayed in the water in every mixture.`;
      },
      widget,
      table: potTable({
        pieces: pucks(POOL.map(id => [`p${id}`, id]), 57, 10, 14.5),
        fixtures: [p.fixture],
        zones: { slots: p.slots, trays: [trayAt('stayed', 'Stayed every time', { x: 121, y: 20 }, { w: 56, h: 28 })] }
      }),
      hints: [
        'Use the "Mixture" dial and the "Mix" key, then drag the ion pucks into the tray.',
        'For each mixture, compare which discs are packed at the bottom of AFTER with the discs in BEFORE.',
        'An ion belongs in the tray only if it was never packed into a solid in any of the four mixtures.'
      ],
      check(state) {
        const t = state.table;
        const have = ionsIn(t, 'stayed');
        if (!total(have)) return { ok: false, notYet: true, msg: 'The tray is empty.' };
        const done = mixesRun(t, 'pot');
        const missing = done.findIndex(x => !x);
        if (missing >= 0) return { ok: false, msg: `Mixture ${missing + 1} has not been poured together yet.` };
        for (const id of Object.keys(have)) {
          if (LEFT_ONCE.has(id)) {
            const k = FOUR.findIndex(([A, B]) => mixOutcome(A, B).reacted[id]);
            return { ok: false, msg: `${ionText(id)} was packed into a solid in mixture ${k + 1}.` };
          }
        }
        for (const id of STAYED) if (!have[id]) return { ok: false, msg: `${ionText(id)} was never packed into a solid in any mixture, and the tray does not hold it.` };
        return { ok: true };
      },
      reward: {
        log: 'Na⁺, K⁺, NH₄⁺ and NO₃⁻ never left the water.',
        title: 'Solubility Rules',
        body: 'Sodium, potassium, ammonium and nitrate ions stayed dissolved with every partner, while chloride and sulfate ions left the water only with some. Solubility rules say which pairs of ions make a solid and which stay dissolved.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const p = ionPotFixture('pot', { x: 57, y: 26 }, { window: true, lamp: true });
    return {
      id: 's7-clear',
      title: 'Clear and Still Reacting',
      prompt: 'Build the equation for only what reacted when these two clear solutions were mixed.',
      widget,
      table: potTable({
        pieces: [
          ...jarsSeated(ACID, ['hcl', 'naoh'], { names: ['hydrochloric acid', null] }),
          ...pucks([['pH', 'H'], ['pOH', 'OH'], ['pNa', 'Na'], ['pCl', 'Cl']], 57.5, 12, 20),
          formulaChip('fH2O', 'H2O', 'l', { x: 92, y: 57.5 }),
          formulaChip('fNaCl', 'NaCl', 'aq', { x: 113, y: 57.5 })
        ],
        fixtures: [p.fixture],
        zones: {
          slots: [...p.slots, { id: 'formed', label: 'Formed', at: { x: 131, y: 43 }, size: { w: 24, h: 12 } }],
          trays: [trayAt('reacted', 'Ions that reacted', { x: 131, y: 19 }, { w: 28, h: 28 })]
        }
      }),
      hints: [
        'Use the "Mix" key, then drag ion pucks into the tray and a formula chip into the slot.',
        'Compare the discs in BEFORE and AFTER, the new drawing in AFTER, and the two bulbs.',
        'Count only the ions whose discs are gone from AFTER, and write what they became.'
      ],
      check(state) {
        const t = state.table;
        const r = ionPotRead(t, 'pot');
        if (!r.ran) return { ok: false, notYet: true, msg: 'The solutions have not been poured together yet.' };
        const have = ionsIn(t, 'reacted');
        const chip = chipIn(t, 'formed');
        if (!total(have) && !chip) return { ok: false, notYet: true, msg: 'The tray and the slot are empty.' };
        const o = r.out;
        for (const id of Object.keys(have)) if (!o.reacted[id]) return { ok: false, msg: `${ionText(id)} is in the window both before and after.` };
        for (const [id, n] of Object.entries(o.reacted)) if ((have[id] || 0) !== n) return { ok: false, msg: `${n} ${ionText(id)} ${plural(n)} left the water, and the tray holds ${have[id] || 0}.` };
        if (!chip) return { ok: false, msg: 'A new drawing appeared in AFTER, and the slot is empty.' };
        if (chip.props.f !== 'H2O') return { ok: false, msg: 'The new drawing in AFTER does not match the chip in the slot.' };
        return { ok: true };
      },
      reward: {
        log: 'H⁺ + OH⁻ → H₂O, with Na⁺ and Cl⁻ standing by.',
        title: 'Clear Does Not Mean Nothing Happened',
        body: 'No cloud formed, yet H⁺ and OH⁻ left the water as H₂O while Na⁺ and Cl⁻ stood by, so the bulb dimmed but stayed lit. The net ionic equation is H⁺(aq) + OH⁻(aq) → H₂O(l).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const p = ionPotFixture('pot', { x: 45, y: 26 }, { window: true });
    return {
      id: 's8-sealed',
      title: 'Sealed Jars',
      prompt: 'Build the equation for the sealed jars with every dissolved ion shown, before and after the mixing.',
      widget,
      table: potTable({
        pieces: [
          ...jarsSeated(SEALED, ['jar1', 'jar2'], { sealed: true }),
          ...pucks([['pAg', 'Ag'], ['pBr', 'Br'], ['pK1', 'K'], ['pK2', 'K'], ['pN1', 'NO3'], ['pN2', 'NO3']], 57.5, 10, 14),
          formulaChip('fAgBr', 'AgBr', 's', { x: 98, y: 57.5 }),
          formulaChip('fKNO3', 'KNO3', 'aq', { x: 118.5, y: 57.5 }),
          formulaChip('fAgNO3', 'AgNO3', 'aq', { x: 139, y: 57.5 })
        ],
        fixtures: [p.fixture],
        zones: {
          slots: p.slots,
          trays: [
            trayAt('before', 'Before mixing', { x: 103, y: 19 }, { w: 28, h: 28 }),
            trayAt('after', 'After mixing', { x: 135, y: 19 }, { w: 28, h: 28 }),
            { id: 'solid', label: 'Solid formed', at: { x: 135, y: 45 }, size: { w: 24, h: 14 }, cell: 24, cellH: 14 }
          ]
        }
      }),
      hints: [
        'Use the "Mix" key, then drag ion pucks into the two trays and a formula chip into the third.',
        'Compare BEFORE and AFTER: every dissolved ion goes in a tray, and the ions packed together are not dissolved.',
        'The left tray holds the ions of both jars, and the right tray holds the ions still dissolved afterwards.'
      ],
      check(state) {
        const t = state.table;
        const r = ionPotRead(t, 'pot');
        if (!r.ran) return { ok: false, notYet: true, msg: 'The jars have not been poured together yet.' };
        const b = ionsIn(t, 'before'); const a = ionsIn(t, 'after');
        const chip = chipIn(t, 'solid');
        if (!total(b) && !total(a) && !chip) return { ok: false, notYet: true, msg: 'The trays and the slot are empty.' };
        const o = r.out;
        if (!sameCounts(b, o.before)) return { ok: false, msg: `BEFORE shows ${total(o.before)} discs, and the first tray holds ${total(b)}.` };
        for (const id of Object.keys(a)) if (!o.after[id]) return { ok: false, msg: `${ionText(id)} discs are packed together at the bottom of AFTER, not loose in the water.` };
        if (!sameCounts(a, o.after)) return { ok: false, msg: `AFTER shows ${total(o.after)} discs loose in the water, and the second tray holds ${total(a)}.` };
        if (!chip) return { ok: false, msg: 'The packed discs at the bottom of AFTER have no formula in the slot.' };
        if (chip.props.f !== o.solid.formula || chip.props.state !== 's') return { ok: false, msg: 'The packed discs at the bottom of AFTER do not match the chip in the slot.' };
        return { ok: true };
      },
      reward: {
        log: 'Ag⁺ + NO₃⁻ + K⁺ + Br⁻ → AgBr(s) + K⁺ + NO₃⁻',
        title: 'Complete Ionic Equation',
        body: 'A complete ionic equation shows every dissolved ion, and writes a solid as one formula: Ag⁺ + NO₃⁻ + K⁺ + Br⁻ → AgBr(s) + K⁺ + NO₃⁻. Cross out the ions that stand on both sides and the net ionic equation is left.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag a jar into each seat, press Mix, then press Filter.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Press Mix, then drag the ions into the tray.'],
  4: ['Press Mix, then fill the tray and the slot.'],
  5: ['Drag your guesses into the tray.'],
  6: ['Turn the dial, press Mix,', 'then fill the tray.'],
  7: ['Press Mix, then', 'fill the tray', 'and slot.'],
  8: ['Press Mix, then fill', 'the three trays.']
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
      body: 'Not every ion in a mixture reacts. The pond turned cloudy because one pair of ions left the water as a precipitate, and the rest stood by.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const run = id => ({ run: id });
const intray = (ids, tray) => ids.map(id => put(id, `tray:${tray}`));

const MIXED = [run('pot')];
const allFour = [1, 2, 3, 4].flatMap(k => [dial('pot', 'mix', k), run('pot')]);

export const SOLUTIONS = [
  [put('pb', 'slot:pot.in1'), put('ki', 'slot:pot.in2'), run('pot'), run('filter')],
  [put('gspec', 'slot:guess')],
  [...MIXED, ...intray(['pNO3', 'pK'], 'water')],
  [...MIXED, ...intray(['pPb', 'pI1', 'pI2'], 'reacted'), put('fPbI2', 'slot:solid')],
  [...intray(['gNa', 'gK'], 'guess')],
  [...allFour, ...intray(['pNa', 'pK', 'pNH4', 'pNO3'], 'stayed')],
  [...MIXED, ...intray(['pH', 'pOH'], 'reacted'), put('fH2O', 'slot:formed')],
  [...MIXED, ...intray(['pAg', 'pBr', 'pK1', 'pN1'], 'before'), ...intray(['pK2', 'pN2'], 'after'), put('fAgBr', 'tray:solid')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('pb', 'slot:pot.in1'), put('ki', 'slot:pot.in2'), run('pot')],
  [],
  [...MIXED, ...intray(['pPb', 'pNO3', 'pK', 'pI'], 'water')],
  [...MIXED, ...intray(['pPb', 'pI1', 'pI2', 'pK1'], 'reacted'), put('fPbI2', 'slot:solid')],
  [],
  [...allFour, ...intray(['pNa', 'pK', 'pNH4', 'pNO3', 'pCl'], 'stayed')],
  [...MIXED, ...intray(['pH', 'pOH', 'pNa', 'pCl'], 'reacted'), put('fH2O', 'slot:formed')],
  [...MIXED, ...intray(['pAg', 'pBr', 'pK1', 'pN1'], 'before'), ...intray(['pK2', 'pN2', 'pAg'], 'after'), put('fAgBr', 'tray:solid')]
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
  LEAD, FOUR, ACID, SEALED, POOL, GUESS, GUESS_RIGHT,
  answers: {
    leadAfter: mixOutcome(LEAD[0], LEAD[1]).after, leadReacted: mixOutcome(LEAD[0], LEAD[1]).reacted,
    stayed: STAYED, leftOnce: [...LEFT_ONCE], acidReacted: mixOutcome(ACID[0], ACID[1]).reacted, sealedBefore: mixOutcome(SEALED[0], SEALED[1]).before, sealedAfter: mixOutcome(SEALED[0], SEALED[1]).after
  }
};
export { pretty };
