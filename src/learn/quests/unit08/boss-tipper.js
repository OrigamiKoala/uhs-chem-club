/**
 * boss-tipper.js — Learn world 8 elite: THE TIPPER.
 *
 * The Fifth Guild's beam pump at the largest salt pan, rocking on its pivot and calling every vessel it reaches finished. It is made of
 * everything Teeter measured, and each of its five phases puts the TABLETOP of a bench the player has worked back in front of them, on
 * the pans kit (`table/kits/pans.js`), with a NEW case on the table and the Tipper standing in the table's corner, watching it. Each
 * phase is a different tool and ONE decision:
 *
 *   1  the pans      which of three vessels has reached equilibrium, read from its graph and two counts (the pan, bench 1)
 *   2  the burner    K of 2 SO₂ + O₂ ⇌ 2 SO₃ from a settled vessel's bars, typed                        (the vessels, bench 2)
 *   3  the draw      the mixture of butane ⇌ isobutane that makes more butane when left alone           (the test vessel, bench 3, noRun)
 *   4  the squeeze   the NO₂ amount after N₂O₄ ⇌ 2 NO₂ is compressed                                    (the vessel, bench 6)
 *   5  the feed      the HI amount in a vessel with equal 0.80 M starts, typed                          (the settling bars, bench 5)
 *
 * Every figure is `engine/eqdata.js`; the numbers a stage grades against are the planners', never typed twice. Reactions are the pans'
 * (`K_SYSTEMS`, `LEAN_RXNS`, `Q5`). Clearing the last phase files the Case File clue `clue_teeter_pan`. The boss pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { session } from '../../../session.js';
import { pansTable, panFixture, plaqueFixture, panRead, pieceIn, dialValue } from '../../table/kits/pans.js';
import { vesselFixture as ratioVessel, vslRead, testVessel, mixCard } from '../../table/kits/pans-ratio.js';
import { vesselFixture as stressVessel, vesselRead } from '../../table/kits/pans-stress.js';
import { barsFixture } from '../../table/kits/pans-ice.js';
import {
  K_SYSTEMS, Q5, kSlips, fmtNum, systemRatio, iceAmounts, iceColumns
} from '../../engine/eqdata.js';

import { choiceFixture, pickable } from '../../table/kits/pans-choice.js';
export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit08/q1-both', 'unit08/q2-k', 'unit08/q3-q', 'unit08/q5-ice', 'unit08/q6-lean'
];

export const CLUE_ID = 'clue_teeter_pan';
const SPEAKER = 'Vess';

/** Every key on these tables says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The Tipper, as every phase's foe: one body, watching the table. On a table it reads no probe, it only observes. */
const TIPPER_FOE = [{ id: 'tipper', label: 'The Tipper' }];

const widget = { type: 'table', label: 'The bench' };

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const runs = (fid, n) => Array.from({ length: n }, () => ({ run: fid }));

/* ------------------------------------------------------------------
   THE FIGURES (inputs; every figure shown or graded is the planners')
   ------------------------------------------------------------------ */

// Phase 1: three vessels of butane ⇌ isobutane, each already run to 60 s.
const P1_PANS = [
  { id: 'p1', title: 'Vessel 1', kf: 0.12, kr: 0, seed: 81 },
  { id: 'p2', title: 'Vessel 2', kf: 0.09, kr: 0.03, seed: 94 },
  { id: 'p3', title: 'Vessel 3', kf: 0.005, kr: 0.0025, seed: 86 }
];
const P1_RUN = 60;
const P1_PICK = 2;

// Phase 2: 2 SO₂ + O₂ ⇌ 2 SO₃ (Kc = 280 at 1000 K), one vessel opened already settled from 1.00 mol/L SO₂ and 0.50 mol/L O₂.
const SO = K_SYSTEMS.so3;
const P2_START = { SO2: 1, O2: 0.5 };
const P2_PAN = [{ start: P2_START }];
const P2_TOL = 0.03;

// Phase 3: three mixtures of butane ⇌ isobutane (K = 2.0). Mixture 1 has Q = 3.0 (> K, makes more butane),
// Mixture 2 has equal amounts (Q = 1.0 < K, makes more isobutane), Mixture 3 is already on K (Q = 2.0).
const BUTANE = K_SYSTEMS.butane;
const P3_MIX = [
  { id: 'm1', label: 'Mixture 1', amounts: { butane: 0.4, isobutane: 1.2 } },
  { id: 'm2', label: 'Mixture 2', amounts: { butane: 0.6, isobutane: 0.6 } },
  { id: 'm3', label: 'Mixture 3', amounts: { butane: 0.4, isobutane: 0.8 } }
];
const P3_WAY = 'reverse';

// Phase 4: N₂O₄ ⇌ 2 NO₂ at 298 K, 0.040 mol in 1 L, settled, then compressed.
const P4 = { rxn: 'n2o4', mix: { N2O4: 0.04 }, V0: 1, T0: 298, axis: [-3, 4], unit: 0.0025, title: 'Vessel: N₂O₄ ⇌ 2 NO₂' };
const P4_VOL = { min: 0.5, max: 1, step: 0.25 };
const P4_OPTIONS = ['Rises', 'Falls', 'Stays the same', ' '];
const P4_ANSWER = 2;

// Phase 5: H₂ + I₂ ⇌ 2 HI (K = 54 at 698 K) from equal 0.80 mol/L starts (both sides are squares, no quadratic needed).
const HI = Q5.hi;
const P5_START = { 'H₂': 0.8, 'I₂': 0.8 };
const P5_ICE = iceAmounts(HI.species, P5_START, HI.K);
const P5_TOL = 0.02;

const sig3 = v => String(Number((v * (1 + 1e-9)).toPrecision(3)));
const within = (v, want, rel) => Math.abs(v - want) <= rel * Math.abs(want);
const conc = v => v.toFixed(2);

/* ------------------------------------------------------------------
   LAYOUT HELPERS (copied from the benches the phases come from)
   ------------------------------------------------------------------ */

const TV_AT = { x: 62, y: 22 };
const cardAt = i => ({ x: 18 + i * 28, y: 58 });
const p3Vessel = testVessel('tv', TV_AT, { system: 'butane', q: true, noRun: true });

/* ------------------------------------------------------------------
   THE FIVE PHASES
   Each keeps the top-right corner clear for the foe (x from 126.5, y to 23.5 on a 150-wide table).
   ------------------------------------------------------------------ */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 'p1-pans',
    title: 'Phase 1 · The Vessels',
    prompt: 'Which vessel has reached equilibrium?',
    widget,
    table: pansTable({
      fixtures: [
        ...P1_PANS.map((p, i) => pickable(panFixture(p.id, { x: 24 + i * 50, y: 46 }, { kf: p.kf, kr: p.kr, b0: 0, seed: p.seed, start: P1_RUN, title: p.title, aName: 'Butane', bName: 'Isobutane', window: false, w: 44, h: 40 }), i + 1)),
        choiceFixture('pick', 'Reached equilibrium', { x: 40, y: 11 }, { options: ['Vessel 1', 'Vessel 2', 'Vessel 3', ' '], start: 4, w: 56 })
      ]
    }, { h: 74 }),
    foes: TIPPER_FOE,
    encounter: {
      species: 'the tipper',
      act: 'Commit Vessel',
      intent: 'The Tipper rocks three vessels on its beam, each on a run of changes of its own.'
    },
    hints: [
      'Use the "Run" key on each vessel, then tap the vessel you choose.',
      'Compare each vessel\'s graph with the two counts under it.',
      'Look at both the graph and the two change counts on each vessel.'
    ],
    check(state) {
      const t = state.table;
      const v = dialValue(t, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap a vessel.' };
      if (v === P1_PICK) return { ok: true };
      if (v === 1) {
        const r = panRead(t, 'p1');
        return { ok: false, msg: `Vessel 1's "Isobutane to Butane" count reads ${r.rev}, and its blue line has reached the top of the graph.` };
      }
      const r = panRead(t, 'p3');
      return { ok: false, msg: `Vessel 3's orange line is still falling at ${r.t} s, and its blue line is still rising.` };
    },
    reward: {
      log: 'Vessel 2 held steady with changes counted both ways.',
      title: 'Level, Not Finished',
      body: 'Vessel 2 held steady at about three times as much isobutane as butane while both counts kept running, which is equilibrium. Vessel 1 had stopped because nothing turned back, and Vessel 3 had not settled.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 'p2-burner',
    title: 'Phase 2 · The Burner',
    prompt: 'What is K for this vessel, to two significant figures?',
    widget,
    entry: { id: 'k', label: 'K', unit: '' },
    table: pansTable({
      fixtures: [ratioVessel('pans', { x: 38, y: 22 }, { system: 'so3', pans: P2_PAN, settled: true, w: 70, titles: ['The vessel at equilibrium'] })]
    }, { h: 46 }),
    foes: TIPPER_FOE,
    encounter: {
      species: 'the tipper',
      act: 'Commit K',
      intent: 'The Tipper feeds a burner with sulfur dioxide and oxygen, and the burner has settled.'
    },
    hints: [
      'Read the settled bars and the equation printed on the vessel, then type K in the field.',
      'Read the amount of each substance from the bars and take the reaction from the equation printed beside them.',
      'Use the coefficients from the equation as powers in the products-over-reactants ratio.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'k');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const pan = vslRead(state.table, 'pans').pans[0];
      if (within(v, pan.K, P2_TOL)) return { ok: true };
      const sl = kSlips(SO, pan.eq);
      const bars = `SO₂ at ${fmtNum(pan.eq.SO2, 3)}, O₂ at ${fmtNum(pan.eq.O2, 3)} and SO₃ at ${fmtNum(pan.eq.SO3, 3)} mol/L`;
      if (within(v, sl.inverted, 0.05)) return { ok: false, msg: `That figure is below 1, and on this vessel (${bars}) the SO₃ bar stands tallest.` };
      if (within(v, sl.noPower, 0.05)) return { ok: false, msg: 'That figure counts each substance once; the equation printed on the vessel has a 2 in front of SO₂ and SO₃.' };
      return { ok: false, msg: `With ${bars}, that is not the figure the ratio of this vessel comes to.` };
    },
    reward: {
      log: 'K for 2 SO₂ + O₂ ⇌ 2 SO₃ came from the bars.',
      title: 'K From a Vessel',
      body: `The 2 in front of SO₂ and SO₃ became powers: SO₃² over SO₂² times O₂ came to ${fmtNum(SO.K, 2)} at 1000 K. Any vessel of this reaction at this temperature settles to the same figure.`
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 'p3-draw',
    title: 'Phase 3 · The Draw',
    prompt: 'Which mixture will make more butane when left alone?',
    widget,
    table: pansTable({
      pieces: P3_MIX.map((c, i) => mixCard(c.id, c.label, cardAt(i), 'butane', c.amounts)),
      fixtures: [p3Vessel.fixture],
      zones: { slots: [p3Vessel.seat] }
    }, { h: 72 }),
    foes: TIPPER_FOE,
    encounter: {
      species: 'the tipper',
      act: 'Commit Mixture',
      intent: 'The Tipper draws a mixture from each of three vessels into its test vessel.'
    },
    hints: [
      'Lay each mixture card in the test vessel to read its Q against K.',
      'Compare the Q marker with the K line for each mixture.',
      'Compare Q with K for each mixture to see which way it runs.'
    ],
    check(state) {
      const seat = pieceIn(state.table, 'tv.seat');
      if (!seat) return { ok: false, notYet: true, msg: 'Lay a mixture card in the vessel.' };
      const c = P3_MIX.find(x => x.id === seat.id);
      if (wayOf(c) === P3_WAY) return { ok: true };
      const q = systemRatio(BUTANE, c.amounts);
      return { ok: false, msg: `${c.label} has Q = ${fmtNum(q, 2)} against K = ${fmtNum(BUTANE.K, 2)}, so it ${q < BUTANE.K ? 'makes more isobutane' : 'does not change'}.` };
    },
    reward: {
      log: 'The mixture with Q above K made more butane.',
      title: 'Q Above K Moves Back',
      body: `Mixture 1 had Q = ${fmtNum(systemRatio(BUTANE, P3_MIX[0].amounts), 2)} against K = ${fmtNum(BUTANE.K, 2)}, so it made more butane. Mixture 2 held equal amounts (Q = 1.0), below K, so it made isobutane instead.`
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 'p4-squeeze',
    title: 'Phase 4 · The Squeeze',
    prompt: 'After the vessel is compressed, where does the amount of NO₂ settle?',
    widget,
    table: pansTable({
      fixtures: [
        stressVessel('v', { x: 52, y: 30 }, { ...P4, touch: true, answer: { target: 'ans', watch: 'NO2', higher: 1, same: 3, lower: 2 }, dials: { vol: { ...P4_VOL, value: P4_VOL.max } } }),
        choiceFixture('ans', 'NO₂ amount', { x: 127, y: 40 }, { options: P4_OPTIONS, start: 4, w: 40 })
      ]
    }),
    foes: TIPPER_FOE,
    encounter: {
      species: 'the tipper',
      act: 'Commit Reading',
      intent: 'The Tipper presses on a sealed vessel of brown gas.'
    },
    hints: [
      'Drag the piston down, then tap the graph where the NO₂ amount will settle.',
      'Watch the NO₂ line against its level from before the compression, and the Q marker against the K line.',
      'Follow Q against K just after the compression and see which side has fewer gas molecules.'
    ],
    check(state) {
      const t = state.table;
      const v = Math.round(dialValue(t, 'ans'));
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap the graph where the NO₂ amount will settle.' };
      if (v === P4_ANSWER) return { ok: true };
      const r = vesselRead(t, 'v');
      if (!r.changed) return { ok: false, msg: 'The piston has not moved: the vessel is still 1 L.' };
      if (r.t === 0) return { ok: false, msg: 'No time has passed since the piston moved.' };
      return { ok: false, msg: `With the piston at ${r.res.post.V} L, the NO₂ line reads ${r.now.n.NO2.toFixed(4)} mol now and stood at ${r.base.n.NO2.toFixed(4)} mol before.` };
    },
    reward: {
      log: 'Compressing the vessel left less NO₂.',
      title: 'Which Side Has Fewer Molecules',
      body: 'Compressing the vessel raised the pressure of both gases and put Q above K, so the vessel moved toward N₂O₄, which has fewer molecules than the NO₂ it comes from. The NO₂ amount fell.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 'p5-feed',
    title: 'Phase 5 · The Feed',
    prompt: 'What is the concentration of HI when this vessel has settled, in mol/L?',
    widget,
    entry: { id: 'hi', label: 'HI at equilibrium', unit: 'M' },
    table: pansTable({
      fixtures: [
        barsFixture('bars', { x: 42, y: 28 }, { species: iceColumns(HI.species, P5_START), K: HI.K, max: 1.5, title: 'Vessel', w: 62, h: 42 }),
        plaqueFixture('plate', 'Vessel', { x: 116, y: 40 }, [HI.eq, `K = ${HI.K} at ${HI.T} K`, `start: ${conc(P5_START['H₂'])} M H₂, ${conc(P5_START['I₂'])} M I₂`], { w: 62 })
      ]
    }),
    foes: TIPPER_FOE,
    encounter: {
      species: 'the tipper',
      act: 'Commit Amount',
      intent: 'The Tipper feeds a vessel with equal amounts of H₂ and I₂.'
    },
    hints: [
      'Press "Settle" on the vessel and type the concentration in the field.',
      'Compare the settled bars with the dashed start marks, and read K on the plate.',
      'Write the equilibrium amounts from the ICE table into K = [HI]² ÷ ([H₂] × [I₂]), then solve for x.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'hi');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the concentration in the field.' };
      const want = P5_ICE.amounts.HI;
      if (within(v, want, P5_TOL)) return { ok: true };
      if (within(v, P5_ICE.x, 0.03)) return { ok: false, msg: `The settled HI bar stands at twice ${sig3(v)}.` };
      if (within(v, 2 * Math.min(...Object.values(P5_START)), 0.02)) return { ok: false, msg: `${sig3(v)} counts all the H₂ as used up, and the settled H₂ bar still stands above zero.` };
      return { ok: false, msg: v > want ? `The HI bar settles lower than ${sig3(v)}.` : `The HI bar settles higher than ${sig3(v)}.` };
    },
    get reward() {
      return {
        log: 'Equal starts gave a square-root equation that matched the bars.',
        title: 'Equal Starts',
        body: `With equal 0.80 M starts, both sides are squares: 2x ÷ (0.80 − x) = √54, giving x = ${sig3(P5_ICE.x)} M and [HI] = ${sig3(P5_ICE.amounts.HI)} M.`
      };
    }
  }
];

/* ------------------------------------------------------------------
   WHAT A MIXTURE DOES WHEN IT IS LEFT ALONE (phase 3's direction, from the planner)
   ------------------------------------------------------------------ */

const fill = (sys, a) => Object.fromEntries(Object.keys(sys.species).map(s => [s, a[s] ?? 0]));
function wayOf(c) { return systemRatio(BUTANE, fill(BUTANE, c.amounts)) > BUTANE.K ? 'reverse' : systemRatio(BUTANE, fill(BUTANE, c.amounts)) < BUTANE.K ? 'forward' : 'none'; }

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */

export const DEBRIEF = {
  speaker: SPEAKER,
  clueAwarded: CLUE_ID,
  sections: [
    {
      heading: 'What You Found',
      body: 'The Tipper stops rocking and settles level. Behind it is a sealed vessel the Fifth filed as finished, and its particles are still changing.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase asked a vessel the same kind of question: has it settled, what is its K, which way will it go, how does it answer a change, how much is left. That was enough to read the machine.'
    },
    {
      heading: 'Next',
      body: 'The last vessel goes into the Case File. It was never finished; someone stopped measuring it.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [...runs('p2', 2), dial('pick', 'value', P1_PICK)],
  [typed('k', '280')],
  [put('m1', 'slot:tv.seat')],
  [dial('v', 'vol', 0.5), ...runs('v', 6), dial('ans', 'value', P4_ANSWER)],
  [{ run: 'bars' }, typed('hi', sig3(P5_ICE.amounts.HI))]
];

/** A plausible wrong answer per phase. Each must be refused, and must say why. */
export const MISSES = [
  [dial('pick', 'value', 1)],
  [typed('k', '57')],
  [put('m2', 'slot:tv.seat')],
  [dial('v', 'vol', 0.5), ...runs('v', 6), dial('ans', 'value', 1)],
  [{ run: 'bars' }, typed('hi', '1.6')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn` and `verify:teeter`, which hold every graded figure to the real tables. */
export const CHECKS = { P1_PANS, P1_RUN, P1_PICK, P2_START, P2_TOL, P3_MIX, P3_WAY, P4, P4_VOL, P4_ANSWER, P5_START, P5_ICE, P5_TOL };
