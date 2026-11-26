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
import { potTable, plaqueFixture, stmt } from '../../table/kits/pot.js';
import { ionPotFixture, filterFixture, solutionJar, ionPuck, formulaChip, ionPotRead, mixesRun, filterRead } from '../../table/kits/pot-ionic.js';
import { ionText, pretty } from '../../engine/reactdata.js';
import { mixOutcome } from '../../engine/reactdata-ionic.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bsolutions?\b/i, introducedAt: 1 },
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
const plural = n => (n === 1 ? 'circle' : 'circles');

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
      briefing: {
        speaker: SPEAKER,
        body: 'When an ionic compound dissolves in water, its ions separate and move freely. Each jar holds a clear solution of dissolved ions.'
      },
      prompt: 'Mix the two solutions and filter them — what do you find on the paper?',
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
        'Watch what happens in the vessel when the two clear solutions meet.',
        'Watch the vessel and the filter paper before and after each step.',
        'If the liquid turns cloudy, a solid formed — filtering lifts it onto the paper.'
      ],
      check(state) {
        const r = ionPotRead(state.table, 'pot');
        if (!r.ready) return { ok: false, notYet: true, msg: 'Put a jar in each slot of the vessel.' };
        if (!r.ran) return { ok: false, notYet: true, msg: 'Press Mix to combine the jars first.' };
        if (!filterRead(state.table, 'filter').done) return { ok: false, msg: 'The vessel is cloudy, but you have not filtered out the solid yet.' };
        return { ok: true };
      },
      reward: {
        log: 'A yellow solid formed from two clear solutions.',
        title: 'Precipitate',
        body: 'Mixing the two clear solutions formed a yellow solid that the filter caught. A solid formed from mixed solutions is called a precipitate.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'What Is Left in the Water',
    // A PREDICT STAGE: the vessel is not on the table yet.
    predict: true,
    prompt: 'Which ions stay dissolved in the water after the precipitate settles?',
    widget,
    table: potTable({
      pieces: Object.entries(GUESS).map(([id, label], i) => stmt(id, label, { x: 24 + (i % 2) * 38, y: 10 + Math.floor(i / 2) * 16 })),
      fixtures: [plaqueFixture('ions', 'Ions in the two jars', { x: 118, y: 12 }, ['Lead(II) nitrate: Pb²⁺, NO₃⁻', 'Potassium iodide: K⁺, I⁻'], { w: 46 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 36 }, size: { w: 42, h: 16 } }] }
    }),
    hints: [
      'Think about which ions from Pb²⁺, NO₃⁻, K⁺, and I⁻ joined to make the yellow solid.',
      'Think about which of the four ions formed the yellow precipitate, and which could stay dissolved.',
      'Choose which ions you expect to find in the water, then test it next.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the prediction slot.' };
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
    const p = ionPotFixture('pot', { x: 46, y: 26 }, { window: true });
    return {
      id: 's3-water',
      title: 'Still Dissolved',
      get prompt() {
        const g = recall(QUEST_KEY);
        const guess = g && GUESS[g] ? `Your guess was: ${GUESS[g]}. Test it: ` : '';
        return `${guess}Which ions are still dissolved after mixing?`;
      },
      widget,
      table: potTable({
        pieces: [
          ...jarsSeated(LEAD, ['pb', 'ki']),
          ...pucks([['pPb', 'Pb2'], ['pNO3', 'NO3'], ['pK', 'K'], ['pI', 'I']], 57, 14, 20)
        ],
        fixtures: [p.fixture],
        zones: { slots: p.slots, trays: [trayAt('water', 'Still in the water', { x: 122, y: 26 }, { w: 34, h: 30 })] }
      }),
      hints: [
        'Compare the ions floating before mixing with the ions still floating after mixing.',
        'Look at which ions stay floating in the upper part of the after panel instead of packing at the bottom.',
        'Dissolved ions float freely after mixing instead of packing into the solid at the bottom.'
      ],
      check(state) {
        const t = state.table;
        const r = ionPotRead(t, 'pot');
        if (!r.ran) return { ok: false, notYet: true, msg: 'Press Mix to combine the jars first.' };
        const have = ionsIn(t, 'water');
        if (!total(have)) return { ok: false, notYet: true, msg: 'The tray is empty.' };
        const want = r.out.after;
        for (const id of Object.keys(have)) if (!want[id]) return { ok: false, msg: `No ${ionText(id)} ions are floating free after mixing.` };
        for (const id of Object.keys(want)) if (!have[id]) return { ok: false, msg: `Free ${ionText(id)} ions are still in the water after mixing, but they are missing from your tray.` };
        return { ok: true };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g && GUESS[g] ? (g === GUESS_RIGHT ? 'The particle view agreed with your guess. ' : 'The particle view disagreed with your guess. ') : '';
        return {
          log: 'K⁺ and NO₃⁻ were in the water before and after.',
          title: 'Spectator Ions',
          body: `${verdict}K⁺ and NO₃⁻ stayed dissolved and unchanged — they only watched, so ions that do not react are called spectator ions.`
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
      briefing: {
        speaker: SPEAKER,
        body: 'A net ionic equation shows only the ions that actually reacted and writes the solid they formed as one formula: reacted ions → solid.'
      },
      prompt: 'Which ions reacted and what solid formed in the net ionic equation?',
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
          slots: [...p.slots, { id: 'solid', label: '→ Solid formed', at: { x: 119, y: 28 }, size: { w: 26, h: 12 } }],
          trays: [trayAt('reacted', 'Ions that reacted', { x: 119, y: 12 }, { w: 56, h: 14 })]
        }
      }),
      hints: [
        'Look at which ions appear before mixing and whether they are still floating free after mixing.',
        'Compare how many ions of each kind float freely before and after mixing.',
        'Count only the ions that left the water, and match the packed solid to one formula card.'
      ],
      check(state) {
        const t = state.table;
        const r = ionPotRead(t, 'pot');
        if (!r.ran) return { ok: false, notYet: true, msg: 'Press Mix to combine the jars first.' };
        const have = ionsIn(t, 'reacted');
        const chip = chipIn(t, 'solid');
        if (!total(have) && !chip) return { ok: false, notYet: true, msg: 'The tray and the slot are empty.' };
        const o = r.out;
        for (const id of Object.keys(have)) if (!o.reacted[id]) return { ok: false, msg: `${ionText(id)} appears unchanged both before and after, so it did not react.` };
        for (const [id, n] of Object.entries(o.reacted)) if ((have[id] || 0) !== n) return { ok: false, msg: `${n} ${ionText(id)} ${plural(n)} left the solution, but your tray holds ${have[id] || 0}.` };
        if (!chip) return { ok: false, msg: 'Choose a formula card for the solid packed at the bottom after mixing.' };
        if (chip.props.f !== o.solid.formula) return { ok: false, msg: 'The solid at the bottom after mixing does not match that formula card.' };
        return { ok: true };
      },
      reward: {
        log: 'Pb²⁺ + 2 I⁻ → PbI₂(s)',
        title: 'Net Ionic Equation',
        body: 'Pb²⁺(aq) + 2 I⁻(aq) → PbI₂(s). Here (aq) means dissolved in water and (s) means solid; the net ionic equation leaves out the spectator ions.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-predict',
    title: 'Ions That Always Stay',
    predict: true,
    prompt: 'Pick the ions you think stay dissolved no matter what they are mixed with (you will test four mixtures next).',
    widget,
    table: potTable({
      pieces: pucks(POOL.map(id => [`g${id}`, id]), 16, 14, 19).map((p, i) => ({ ...p, at: { x: 14 + (i % 4) * 19, y: 16 + Math.floor(i / 4) * 20 } })),
      zones: { trays: [trayAt('guess', 'I think these always stay', { x: 114, y: 28 }, { w: 58, h: 32 })] }
    }),
    hints: [
      'Think about which ions stayed dissolved in the first reaction.',
      'Think about which ions you have seen leave the water to form a precipitate, and which stayed dissolved.',
      'Choose the ions you expect never to form a solid, then test four mixtures next.'
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
        return `${guess}Which ions stayed dissolved in every mixture?`;
      },
      widget,
      table: potTable({
        pieces: pucks(POOL.map(id => [`p${id}`, id]), 57, 10, 14.5),
        fixtures: [p.fixture],
        zones: { slots: p.slots, trays: [trayAt('stayed', 'Stayed every time', { x: 121, y: 22 }, { w: 56, h: 30 })] }
      }),
      hints: [
        'Compare before and after for each of the four mixtures.',
        'For each mixture, check which ions stay floating in water and which pack into a solid at the bottom.',
        'An ion belongs in the tray only if it never packed into a solid in any of the four mixtures.'
      ],
      check(state) {
        const t = state.table;
        const have = ionsIn(t, 'stayed');
        if (!total(have)) return { ok: false, notYet: true, msg: 'The tray is empty.' };
        const done = mixesRun(t, 'pot');
        const missing = done.findIndex(x => !x);
        if (missing >= 0) return { ok: false, msg: `Mix pair ${missing + 1} first so you test all four mixtures.` };
        for (const id of Object.keys(have)) {
          if (LEFT_ONCE.has(id)) {
            const k = FOUR.findIndex(([A, B]) => mixOutcome(A, B).reacted[id]);
            return { ok: false, msg: `${ionText(id)} formed a solid in mixture ${k + 1}.` };
          }
        }
        for (const id of STAYED) if (!have[id]) return { ok: false, msg: 'One ion that never left the water is missing. Compare before and after across all four mixtures again.' };
        return { ok: true };
      },
      reward: {
        log: 'Na⁺, K⁺, NH₄⁺ and NO₃⁻ never left the water.',
        title: 'Solubility Rules',
        body: 'Na⁺, K⁺, NH₄⁺, and NO₃⁻ stayed dissolved in all four mixtures, while Ag⁺, Pb²⁺, Cl⁻, and SO₄²⁻ formed solids in some pairs. Solubility rules summarize which pairs form solids and which stay dissolved.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const p = ionPotFixture('pot', { x: 46, y: 26 }, { window: true });
    return {
      id: 's7-clear',
      title: 'Clear and Still Reacting',
      prompt: 'Nothing turns cloudy when HCl and NaOH mix — what is the net ionic equation?',
      widget,
      table: potTable({
        pieces: [
          ...jarsSeated(ACID, ['hcl', 'naoh'], { names: ['hydrochloric acid', null] }),
          ...pucks([['pH', 'H'], ['pOH', 'OH'], ['pNa', 'Na'], ['pCl', 'Cl']], 57.5, 12, 20),
          formulaChip('fH2O', 'H2O', 'l', { x: 108, y: 52 }),
          formulaChip('fNaCl', 'NaCl', 'aq', { x: 132, y: 52 })
        ],
        fixtures: [p.fixture],
        zones: {
          slots: [...p.slots, { id: 'formed', label: '→ Formed', at: { x: 122, y: 36 }, size: { w: 26, h: 12 } }],
          trays: [trayAt('reacted', 'Ions that reacted', { x: 122, y: 15 }, { w: 36, h: 20 })]
        }
      }),
      hints: [
        'Compare the ions floating before mixing with the particles drawn after mixing.',
        'Notice which two ions disappear after mixing and what new molecule appears in their place.',
        'Count only the ions that are gone after mixing, and pick the card for what they became.'
      ],
      check(state) {
        const t = state.table;
        const r = ionPotRead(t, 'pot');
        if (!r.ran) return { ok: false, notYet: true, msg: 'Press Mix to combine the solutions first.' };
        const have = ionsIn(t, 'reacted');
        const chip = chipIn(t, 'formed');
        if (!total(have) && !chip) return { ok: false, notYet: true, msg: 'The tray and the slot are empty.' };
        const o = r.out;
        for (const id of Object.keys(have)) if (!o.reacted[id]) return { ok: false, msg: `${ionText(id)} appears unchanged both before and after, so it did not react.` };
        for (const [id, n] of Object.entries(o.reacted)) if ((have[id] || 0) !== n) return { ok: false, msg: `${n} ${ionText(id)} ${plural(n)} left the solution, but your tray holds ${have[id] || 0}.` };
        if (!chip) return { ok: false, msg: 'A new molecule formed after mixing; place its card in the slot.' };
        if (chip.props.f !== 'H2O') return { ok: false, msg: 'The new molecule after mixing does not match that card.' };
        return { ok: true };
      },
      reward: {
        log: 'H⁺ + OH⁻ → H₂O, with Na⁺ and Cl⁻ standing by.',
        title: 'Clear Does Not Mean Nothing Happened',
        body: 'H⁺(aq) + OH⁻(aq) → H₂O(l). Even though no solid formed, H⁺ and OH⁻ reacted to make water while Na⁺ and Cl⁻ stayed spectators.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const p = ionPotFixture('pot', { x: 45, y: 26 }, { window: true });
    return {
      id: 's8-sealed',
      title: 'Complete Ionic Equation',
      briefing: {
        speaker: SPEAKER,
        body: 'A complete ionic equation lists every dissolved ion before and after mixing, while writing any solid as a single formula.'
      },
      prompt: 'What is the complete ionic equation for mixing silver nitrate and potassium bromide?',
      widget,
      table: potTable({
        pieces: [
          ...jarsSeated(SEALED, ['jar1', 'jar2']),
          ...pucks([['pAg', 'Ag'], ['pBr', 'Br'], ['pK1', 'K'], ['pK2', 'K'], ['pN1', 'NO3'], ['pN2', 'NO3']], 57.5, 10, 14),
          formulaChip('fAgBr', 'AgBr', 's', { x: 98, y: 57.5 }),
          formulaChip('fKNO3', 'KNO3', 'aq', { x: 118.5, y: 57.5 }),
          formulaChip('fAgNO3', 'AgNO3', 'aq', { x: 139, y: 57.5 })
        ],
        fixtures: [p.fixture],
        zones: {
          slots: p.slots,
          trays: [
            { id: 'before', label: 'Before mixing', at: { x: 105, y: 19 }, size: { w: 30, h: 24 }, cell: 13, cellH: 11 },
            { id: 'after', label: 'After mixing', at: { x: 136, y: 19 }, size: { w: 26, h: 24 }, cell: 12, cellH: 11 },
            { id: 'solid', label: 'Solid formed', at: { x: 135, y: 44 }, size: { w: 24, h: 12 }, cell: 24, cellH: 12 }
          ]
        }
      }),
      hints: [
        'Compare the dissolved ions before mixing with what stays dissolved and what packs into a solid after mixing.',
        'Compare before and after: every dissolved ion goes in a tray, and the ions packed together are a solid.',
        'Put every ion from both jars in "Before mixing", and only the ions still dissolved afterwards in "After mixing".'
      ],
      check(state) {
        const t = state.table;
        const r = ionPotRead(t, 'pot');
        if (!r.ran) return { ok: false, notYet: true, msg: 'Press Mix to combine the jars first.' };
        const b = ionsIn(t, 'before'); const a = ionsIn(t, 'after');
        const chip = chipIn(t, 'solid');
        if (!total(b) && !total(a) && !chip) return { ok: false, notYet: true, msg: 'The trays and the slot are empty.' };
        const o = r.out;
        if (!sameCounts(b, o.before)) return { ok: false, msg: `Before mixing shows ${total(o.before)} dissolved ions, but your "Before mixing" tray holds ${total(b)}.` };
        for (const id of Object.keys(a)) if (!o.after[id]) return { ok: false, msg: `${ionText(id)} is packed into the solid after mixing, not dissolved in the water.` };
        if (!sameCounts(a, o.after)) return { ok: false, msg: `After mixing shows ${total(o.after)} dissolved ions, but your "After mixing" tray holds ${total(a)}.` };
        if (!chip) return { ok: false, msg: 'Choose a formula card for the solid packed at the bottom after mixing.' };
        if (chip.props.f !== o.solid.formula || chip.props.state !== 's') return { ok: false, msg: 'The solid at the bottom after mixing does not match that formula card.' };
        return { ok: true };
      },
      reward: {
        log: 'Ag⁺ + NO₃⁻ + K⁺ + Br⁻ → AgBr(s) + K⁺ + NO₃⁻',
        title: 'Complete Ionic Equation',
        body: 'Ag⁺ + NO₃⁻ (silver nitrate) + K⁺ + Br⁻ (potassium bromide) → AgBr(s) + K⁺ + NO₃⁻. Canceling K⁺ and NO₃⁻ from both sides leaves the net ionic equation.'
      }
    };
  })()
];


/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Not every ion in a mixture reacts. The pond turned cloudy because one pair of ions formed a solid precipitate while the spectator ions stayed dissolved.'
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
