/**
 * boss-tipper.js — Learn world 8 elite: THE TIPPER.
 *
 * The Fifth Guild's beam pump at the largest salt pan, rocking on its pivot and calling every pan it reaches finished. It is made of
 * everything Teeter measured, and each of its five phases puts the TABLETOP of a bench the player has worked back in front of them, on
 * the pans kit (`table/kits/pans.js`), with a NEW case on the table and the Tipper standing in the table's corner, watching it. Each
 * phase is a different tool and ONE decision:
 *
 *   1  the pans      which of three pans has reached equilibrium, read from its graph and two counts   (the pan, bench 1)
 *   2  the burner    K of 2 SO₂ + O₂ ⇌ 2 SO₃ from a settled pan's bars, typed                          (the vessels, bench 2)
 *   3  the draw      the mixture of 2 A ⇌ B that makes more A when left alone                          (the test vessel, bench 3)
 *   4  the squeeze   the NO₂ amount after N₂O₄ ⇌ 2 NO₂ is squeezed                                     (the vessel, bench 6)
 *   5  the feed      the HI amount in a pan whose two starts differ, typed                              (the settling bars, bench 5)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung is one sentence
 * and never the answer; rung 1 names the control. A refusal names what the table shows, never the rule. Nothing blocks a correct commit.
 * A miss costs one point of Integrity and three knock the table back, with every reading and hint still kept. The foe is the Tipper
 * itself, in the corner pad of each table (`table/layout.js` `FOE_PAD`: x from 126.5, y to 23.5 on a 150-wide table): it only observes,
 * and a boss phase never declares a field stage or a prediction (the walk is suspended while the Tipper stands, and a boss tests what
 * the benches taught).
 *
 * Every figure is `engine/eqdata.js`; the numbers a stage grades against are the planners', never typed twice. Reactions are the pans'
 * (`K_SYSTEMS`, `LEAN_RXNS`, `Q5`). Clearing the last phase files the Case File clue `clue_teeter_pan`. The boss pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { session } from '../../../session.js';
import { pansTable, panFixture, selectorFixture, plaqueFixture, panRead, pieceIn, dialValue } from '../../table/kits/pans.js';
import { vesselFixture as ratioVessel, vslRead, testVessel, mixCard } from '../../table/kits/pans-ratio.js';
import { vesselFixture as stressVessel, vesselRead } from '../../table/kits/pans-stress.js';
import { barsFixture } from '../../table/kits/pans-ice.js';
import {
  K_SYSTEMS, Q5, kSlips, fmtNum, runMixture, spName, systemRatio, iceAmounts, iceColumns
} from '../../engine/eqdata.js';

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

// Phase 1: three pans of A ⇌ B, each already run to tick 60. One has finished (B never turns back), one is still creeping toward its
// level, and one has settled with three times as much B as A and both counts running.
const P1_PANS = [
  { id: 'p1', title: 'Pan 1', kf: 0.12, kr: 0, seed: 81 },
  { id: 'p2', title: 'Pan 2', kf: 0.09, kr: 0.03, seed: 94 },
  { id: 'p3', title: 'Pan 3', kf: 0.005, kr: 0.0025, seed: 86 }
];
const P1_RUN = 60;
const P1_PICK = 2;

// Phase 2: 2 SO₂ + O₂ ⇌ 2 SO₃ (Kc = 280 at 1000 K), one pan opened already settled from 1.00 mol/L SO₂ and 0.50 mol/L O₂.
const SO = K_SYSTEMS.so3;
const P2_START = { SO2: 1, O2: 0.5 };
const P2_PAN = [{ start: P2_START }];
const P2_TOL = 0.03;

// Phase 3: three mixtures of 2 A ⇌ B (K = 1.2). Mixture 1 holds equal amounts and sits above K, mixture 2 has the most A and sits below it,
// mixture 3 is already on K.
const AB2 = K_SYSTEMS.a2b;
const P3_MIX = [
  { id: 'm1', label: 'Mixture 1', amounts: { A: 0.5, B: 0.5 } },
  { id: 'm2', label: 'Mixture 2', amounts: { A: 1.0, B: 0.5 } },
  { id: 'm3', label: 'Mixture 3', amounts: { A: 0.7, B: 0.588 } }
];
const P3_WAY = 'reverse';

// Phase 4: N₂O₄ ⇌ 2 NO₂ at 298 K, 0.040 mol in 1 L, settled, then squeezed.
const P4 = { rxn: 'n2o4', mix: { N2O4: 0.04 }, V0: 1, T0: 298, axis: [-3, 4], unit: 0.0025, title: 'Vessel: N₂O₄ ⇌ 2 NO₂' };
const P4_VOL = { min: 0.5, max: 1, step: 0.25 };
const P4_OPTIONS = ['Rises', 'Falls', 'Stays the same', ' '];
const P4_ANSWER = 2;

// Phase 5: H₂ + I₂ ⇌ 2 HI (K = 54 at 698 K) from 0.50 mol/L H₂ and 1.00 mol/L I₂. The starts differ, so neither side is a perfect square.
const HI = Q5.hi;
const P5_START = { 'H₂': 0.5, 'I₂': 1.0 };
const P5_ICE = iceAmounts(HI.species, P5_START, HI.K);
const P5_TOL = 0.02;

const sig3 = v => String(Number((v * (1 + 1e-9)).toPrecision(3)));
const within = (v, want, rel) => Math.abs(v - want) <= rel * Math.abs(want);
const conc = v => v.toFixed(2);

/* ------------------------------------------------------------------
   LAYOUT HELPERS (copied from the benches the phases come from)
   ------------------------------------------------------------------ */

// q3: the test vessel and its seat, mixture cards along the bottom.
const TV_AT = { x: 62, y: 22 };
const cardAt = i => ({ x: 18 + i * 28, y: 58 });
const p3Vessel = testVessel('tv', TV_AT, { system: 'a2b', q: true });

/* ------------------------------------------------------------------
   THE FIVE PHASES
   Each keeps the top-right corner clear for the foe (x from 126.5, y to 23.5 on a 150-wide table).
   ------------------------------------------------------------------ */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 'p1-pans',
    title: 'Phase 1 · The Pans',
    prompt: 'Set the dial to the pan that has reached equilibrium.',
    widget,
    table: pansTable({
      fixtures: [
        ...P1_PANS.map((p, i) => panFixture(p.id, { x: 24 + i * 50, y: 46 }, { kf: p.kf, kr: p.kr, b0: 0, seed: p.seed, start: P1_RUN, title: p.title, window: false, w: 44, h: 40 })),
        selectorFixture('pick', 'Reached equilibrium', { x: 40, y: 11 }, { options: ['Pan 1', 'Pan 2', 'Pan 3', ' '], start: 4, w: 56 })
      ]
    }, { h: 74 }),
    foes: TIPPER_FOE,
    encounter: {
      species: 'the tipper',
      act: 'Commit Pan',
      intent: 'The Tipper rocks three pans on its beam, each on a run of changes of its own.'
    },
    hints: [
      'Use the "Run" key on each pan and the answer dial.',
      'Compare each pan\'s graph with the two counts under it.',
      'A pan in equilibrium has a graph that has stopped moving and changes still counted in both directions.'
    ],
    check(state) {
      const t = state.table;
      const v = dialValue(t, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === P1_PICK) return { ok: true };
      if (v === 1) {
        const r = panRead(t, 'p1');
        return { ok: false, msg: `Pan 1's "B to A" count reads ${r.rev}, and its blue line has reached the top of the graph.` };
      }
      const r = panRead(t, 'p3');
      return { ok: false, msg: `Pan 3's orange line is still falling at tick ${r.t}, and its blue line is still rising.` };
    },
    reward: {
      log: 'Pan 2 held steady with changes counted both ways.',
      title: 'Level, Not Finished',
      body: 'Pan 2 held steady at about three times as much B as A while both counts kept running, which is equilibrium. Pan 1 had stopped because nothing turned back, and Pan 3 had not settled.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 'p2-burner',
    title: 'Phase 2 · The Burner',
    prompt: 'Find K for this pan, to two significant figures.',
    widget,
    entry: { id: 'k', label: 'K', unit: '' },
    table: pansTable({
      fixtures: [ratioVessel('pans', { x: 38, y: 22 }, { system: 'so3', pans: P2_PAN, settled: true, w: 70, titles: ['The pan at equilibrium'] })]
    }, { h: 46 }),
    foes: TIPPER_FOE,
    encounter: {
      species: 'the tipper',
      act: 'Commit K',
      intent: 'The Tipper feeds a burner with sulfur dioxide and oxygen, and the burner has settled.'
    },
    hints: [
      'Type the figure in the field.',
      'Read the amount of each substance from the bars and take the reaction from the equation printed beside them.',
      'Write the ratio the way you found it on the rig, put the bar amounts in, and round to two figures.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'k');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const pan = vslRead(state.table, 'pans').pans[0];
      if (within(v, pan.K, P2_TOL)) return { ok: true };
      const sl = kSlips(SO, pan.eq);
      const bars = `SO₂ at ${fmtNum(pan.eq.SO2, 3)}, O₂ at ${fmtNum(pan.eq.O2, 3)} and SO₃ at ${fmtNum(pan.eq.SO3, 3)} mol/L`;
      if (within(v, sl.inverted, 0.05)) return { ok: false, msg: `That figure is below 1, and on this pan (${bars}) the SO₃ bar stands tallest.` };
      if (within(v, sl.noPower, 0.05)) return { ok: false, msg: 'That figure counts each substance once; the equation printed on the pan has a 2 in front of SO₂ and SO₃.' };
      return { ok: false, msg: `With ${bars}, that is not the figure the ratio of this pan comes to.` };
    },
    reward: {
      log: 'K for 2 SO₂ + O₂ ⇌ 2 SO₃ came from the bars.',
      title: 'K From a Pan',
      body: `The 2 in front of SO₂ and SO₃ became powers: SO₃² over SO₂² times O₂ came to ${fmtNum(SO.K, 2)} at 1000 K. Any pan of this reaction at this temperature settles to the same figure.`
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 'p3-draw',
    title: 'Phase 3 · The Draw',
    prompt: 'Lay the mixture that will make more A when it is left alone.',
    widget,
    table: pansTable({
      pieces: P3_MIX.map((c, i) => mixCard(c.id, c.label, cardAt(i), 'a2b', c.amounts)),
      fixtures: [p3Vessel.fixture],
      zones: { slots: [p3Vessel.seat] }
    }, { h: 72 }),
    foes: TIPPER_FOE,
    encounter: {
      species: 'the tipper',
      act: 'Commit Mixture',
      intent: 'The Tipper draws a mixture from each of three pans into its test vessel.'
    },
    hints: [
      'Use the cards, the slot in the vessel and the "Run" key.',
      'Compare the marker with the K line for each mixture, and run any you are unsure of.',
      'Lay the mixtures in the vessel one at a time; the one you want is the one whose bar of A rises when it is run.'
    ],
    check(state) {
      const seat = pieceIn(state.table, 'tv.seat');
      if (!seat) return { ok: false, notYet: true, msg: 'Lay a mixture card in the vessel.' };
      const c = P3_MIX.find(x => x.id === seat.id);
      if (wayOf(c) === P3_WAY) return { ok: true };
      return { ok: false, msg: ranText(c) };
    },
    reward: {
      log: 'The mixture with equal amounts made more A.',
      title: 'Equal Amounts Move Too',
      body: `Mixture 1 held equal amounts of A and B, and its Q was ${fmtNum(systemRatio(AB2, P3_MIX[0].amounts), 2)} against a K of ${fmtNum(AB2.K, 2)}, so it made A. Mixture 2, with the most A, had a Q below K and made B instead.`
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 'p4-squeeze',
    title: 'Phase 4 · The Squeeze',
    prompt: 'Squeeze the vessel, then set the dial to what happens to the NO₂ amount.',
    widget,
    table: pansTable({
      fixtures: [
        stressVessel('v', { x: 52, y: 30 }, { ...P4, dials: { vol: { ...P4_VOL, value: P4_VOL.max } } }),
        selectorFixture('ans', 'NO₂ amount', { x: 127, y: 40 }, { options: P4_OPTIONS, start: 4 })
      ]
    }),
    foes: TIPPER_FOE,
    encounter: {
      species: 'the tipper',
      act: 'Commit Reading',
      intent: 'The Tipper presses on a sealed vessel of brown gas.'
    },
    hints: [
      'Use the "Volume" dial, the "Run" key and the answer dial.',
      'Watch the NO₂ line against its level from before the squeeze, and the Q needle against the K line.',
      'Follow Q against K just after the squeeze and once the lines are flat, and see which gas the amounts moved toward.'
    ],
    check(state) {
      const t = state.table;
      const v = Math.round(dialValue(t, 'ans'));
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      if (v === P4_ANSWER) return { ok: true };
      const r = vesselRead(t, 'v');
      if (!r.changed) return { ok: false, msg: 'The piston has not moved: the vessel is still 1 L.' };
      if (r.t === 0) return { ok: false, msg: 'No time has passed since the piston moved.' };
      return { ok: false, msg: `With the piston at ${r.res.post.V} L, the NO₂ line reads ${r.now.n.NO2.toFixed(4)} mol now and stood at ${r.base.n.NO2.toFixed(4)} mol before.` };
    },
    reward: {
      log: 'Squeezing the vessel left less NO₂.',
      title: 'Which Side Has Fewer Molecules',
      body: 'The squeeze doubled the pressure of both gases and put Q at twice K, so the vessel moved toward N₂O₄, which has fewer molecules than the NO₂ it comes from. The NO₂ amount fell.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 'p5-feed',
    title: 'Phase 5 · The Feed',
    prompt: 'Type the concentration of HI when this pan has settled, in moles per litre.',
    widget,
    entry: { id: 'hi', label: 'HI at equilibrium', unit: 'M' },
    table: pansTable({
      fixtures: [
        barsFixture('bars', { x: 42, y: 28 }, { species: iceColumns(HI.species, P5_START), K: HI.K, max: 1.2, title: 'Pan', w: 62, h: 42 }),
        plaqueFixture('plate', 'Pan', { x: 116, y: 40 }, [HI.eq, `K = ${HI.K} at ${HI.T} K`, `start: ${conc(P5_START['H₂'])} M H₂, ${conc(P5_START['I₂'])} M I₂`], { w: 62 })
      ]
    }),
    foes: TIPPER_FOE,
    encounter: {
      species: 'the tipper',
      act: 'Commit Amount',
      intent: 'The Tipper feeds a pan with two gases in unequal amounts.'
    },
    hints: [
      'Use the "Settle" key on the pan and the number field.',
      'Compare the settled bars with the dashed start marks, and read the K on the plate.',
      'The starts differ, so write K with 2x for HI and each start less x, then solve the quadratic for x.'
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
        log: 'The quadratic gave the amount that matches the bars.',
        title: 'Unequal Starts',
        body: `With unequal starts neither side of K is a perfect square, so x came from a quadratic: ${sig3(P5_ICE.x)} M. HI holds 2x, ${sig3(P5_ICE.amounts.HI)} M, and a little H₂ is left.`
      };
    }
  }
];

/* ------------------------------------------------------------------
   WHAT A MIXTURE DOES WHEN IT IS LEFT ALONE (phase 3's refusals, from the planner)
   ------------------------------------------------------------------ */

const fill = (sys, a) => Object.fromEntries(Object.keys(sys.species).map(s => [s, a[s] ?? 0]));
function wayOf(c) { return runMixture(AB2, fill(AB2, c.amounts)).dir; }
function ranText(c) {
  const r = runMixture(AB2, fill(AB2, c.amounts));
  const parts = Object.keys(AB2.species).map(s => `${spName(AB2, s)} ${fmtNum(c.amounts[s] ?? 0, 3)} to ${fmtNum(r.after[s], 3)}`);
  return `When run, ${c.label} goes ${parts.join(', ')} ${AB2.unit}.`;
}

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */

export const DEBRIEF = {
  speaker: SPEAKER,
  clueAwarded: CLUE_ID,
  sections: [
    {
      heading: 'What You Found',
      body: 'The Tipper stops rocking and settles level. Behind it is a sealed pan the Fifth filed as finished, and its particles are still changing.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase asked a pan the same kind of question: has it settled, what is its K, which way will it go, how does it answer a push, how much is left. That was enough to read the machine.'
    },
    {
      heading: 'Next',
      body: 'The last pan goes into the Case File. It was never finished; someone stopped measuring it.'
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
  [{ run: 'bars' }, typed('hi', '1.0')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  // Clearing the last phase files the clue. The boss pays no XP, so this is not a rail.
  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };
  const runner = createRunner(container, bossCtx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn` and `verify:teeter`, which hold every graded figure to the real tables. */
export const CHECKS = { P1_PANS, P1_RUN, P1_PICK, P2_START, P2_TOL, P3_MIX, P3_WAY, P4, P4_VOL, P4_ANSWER, P5_START, P5_ICE, P5_TOL };
