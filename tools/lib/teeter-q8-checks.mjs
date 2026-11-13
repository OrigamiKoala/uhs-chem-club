/**
 * Checks for Teeter bench 8 (`q8-free`, free energy and K). Every expected value was worked on paper from the stated route (R = 8.314
 * J/(mol·K), T = 298 K on the bench, 298.15 K in the older table checks), never produced by the code under test.
 *
 * Worked by hand (e^x by powers of ten and e^0.1 steps, to four figures):
 *   RT = 8.314 × 298 = 2477.6 J/mol.
 *   ΔG° = +20 kJ: 20000/2477.6 = 8.0723, K = e^−8.0723 = 3.355e-4 × 0.9303 = 3.12e-4.   ΔG° = −10 kJ: 10000/2477.6 = 4.0361, K = 54.60 × 1.0368 = 56.6.
 *   Pans, started from 1.00 of A, K = B/A, B = K/(1+K):
 *     +8:  8000/2477.6 = 3.2290, K = 0.04977 × 0.7954 = 0.0396, B = 0.0381.    +2: K = 0.4493 × 0.9928 = 0.4461, B = 0.3085.
 *     −3:  K = e^1.2108 = 3.3201 × 1.0109 = 3.356, B = 0.7705.    −2: K = 2.242.    −4: K = e^1.6145 = 4.953 × 1.0146 = 5.025.
 *   N2O4 ⇌ 2 NO2 (start 1.00 bar N2O4), 4x²/(1−x) = K, NO2 = 2x:
 *     298 K: ΔG° = 57.2 − 298 × 0.1758 = +4.812, K = e^−1.9421 = 0.1434, x = (−0.1434 + √(0.02057 + 2.2944))/8 = 0.1723, NO2 = 0.3445.
 *     350 K: ΔG° = 57.2 − 61.53 = −4.33, K = e^1.4880 = 4.428, x = (−4.428 + √(19.61 + 70.85))/8 = 0.6354, NO2 = 1.271.
 *   CO + H2O ⇌ CO2 + H2 (1.00 bar each reactant), x/(1−x) = √K, CO2 = x:
 *     500 K: ΔG° = −41.2 + 21.0 = −20.2, K = e^4.8592 = 128.9, √K = 11.35, CO2 = 0.9191.
 *     800 K: ΔG° = −41.2 + 33.6 = −7.6, K = e^1.1426 = 3.135, √K = 1.771, CO2 = 0.6391.
 *   Dissolving at 298 K: ΔG from the formation free energies (independent of ΔH and ΔS): NaCl −261.9 − 131.2 + 384.1 = −9.0; AgCl 77.1 − 131.2 + 109.8 = +55.7;
 *     BaSO4 −560.8 − 744.5 + 1362.2 = +56.9; NH4Cl −79.3 − 131.2 + 202.9 = −7.6. K of dissolving AgCl = e^−22.48 = 1.7e-10 (Ksp 1.8e-10);
 *     BaSO4 = e^−22.94 = 1.1e-10 (Ksp 1.1e-10).
 *   Cold pack: 14800 J / (500 g × 4.184) = 7.075 °C fall, 25.0 → 17.9 °C.
 *   Coupling: −30.5 + 13.8 = −16.7 kJ/mol; K = e^(16700/2477.6) = e^6.7404 = 846.
 *   Sealed: (ΔH, ΔS) = (−35, −90) → −35 + 26.82 = −8.18; (+40, +200) → 40 − 59.6 = −19.6; (−30, −120) → −30 + 35.76 = +5.76. Largest K: reaction 2.
 */

import {
  T_BENCH, MODEL_PAN, WARM, DISSOLVE, settledAt, columnRead, pulls, coldPack, coupledPair, COUPLE
} from '../../src/learn/engine/eqdata-free.js';
import { kFromDeltaG, KSP } from '../../src/learn/engine/eqdata.js';

export async function checkTeeterQ8(ok, bad) {
  const near = (got, want, rel, label) => {
    if (Math.abs(got - want) <= rel * Math.abs(want)) ok(`q8-free ${label}: ${Number(got).toPrecision(4)} ≈ ${want}`);
    else bad(`q8-free ${label}: got ${got}, expected ${want}`);
  };

  // K from ΔG° at the bench temperature.
  near(kFromDeltaG(20, T_BENCH), 3.12e-4, 5e-3, 'K at ΔG° = +20 kJ');
  near(kFromDeltaG(-10, T_BENCH), 56.6, 3e-3, 'K at ΔG° = −10 kJ');
  near(kFromDeltaG(-10, 298.15), 56.5, 3e-3, 'K at ΔG° = −10 kJ, 298.15 K');
  // The model pans.
  const pan = dG => settledAt(MODEL_PAN, dG, T_BENCH);
  near(pan(8).K, 0.0396, 5e-3, 'pan K at +8');
  near(pan(8).amounts.B, 0.0381, 5e-3, 'pan product at +8');
  near(pan(2).amounts.B, 0.3085, 5e-3, 'pan product at +2');
  near(pan(-3).K, 3.356, 5e-3, 'pan K at −3');
  near(pan(-3).amounts.B, 0.7705, 5e-3, 'pan product at −3');
  near(pan(-2).K, 2.242, 5e-3, 'pan K at −2');
  near(pan(-4).K, 5.025, 5e-3, 'pan K at −4');
  near(pan(0).amounts.B, 0.5, 1e-9, 'a pan with ΔG° = 0 holds equal amounts');
  // The product share falls as ΔG° rises (monotone) and the two amounts sum to the start.
  let mono = true; let prev = 2;
  for (let d = -12; d <= 12; d += 1) { const b = pan(d).amounts.B; if (!(b < prev)) mono = false; prev = b; if (Math.abs(b + pan(d).amounts.A - 1) > 1e-9) mono = false; }
  if (mono) ok('q8-free product share falls steadily as ΔG° rises, and A + B stays 1.00'); else bad('q8-free the share of product is not monotone in ΔG°');

  // The temperature stage.
  const n = WARM.n2o4; const w = WARM.wgs;
  const col = (r, i) => columnRead(r.sys, { dH: r.dH, dS: r.dS, T: r.Ts[i] });
  near(col(n, 0).dG, 4.812, 2e-3, 'N2O4 ΔG° at 298 K');
  near(col(n, 0).amounts.NO2, 0.3445, 5e-3, 'N2O4 pan NO2 at 298 K');
  near(col(n, 1).dG, -4.33, 1e-3, 'N2O4 ΔG° at 350 K');
  near(col(n, 1).amounts.NO2, 1.271, 5e-3, 'N2O4 pan NO2 at 350 K');
  near(col(w, 0).amounts.CO2, 0.9191, 5e-3, 'water-gas shift CO2 at 500 K');
  near(col(w, 1).amounts.CO2, 0.6391, 5e-3, 'water-gas shift CO2 at 800 K');
  if (col(n, 1).amounts.NO2 > col(n, 0).amounts.NO2 && col(w, 1).amounts.CO2 < col(w, 0).amounts.CO2) ok('q8-free warming raises the product of the endothermic pan and lowers the exothermic one');
  else bad('q8-free the two warming pans do not move opposite ways');

  // Dissolving: ΔH − TΔS agrees with the formation free energies to 0.3 kJ/mol, and K reproduces the printed Ksp.
  for (const [id, want] of [['nacl', -9.0], ['agcl', 55.7], ['baso4', 56.9], ['nh4cl', -7.6]]) {
    const g = pulls({ ...DISSOLVE[id], T: T_BENCH }).dG;
    if (Math.abs(g - want) <= 0.3) ok(`q8-free ΔG of dissolving ${id}: ${g.toFixed(2)} ≈ ${want}`); else bad(`q8-free ΔG of dissolving ${id}: ${g} vs ${want}`);
  }
  near(pulls({ ...DISSOLVE.agcl, T: T_BENCH }).K, KSP.AgCl.ksp, 0.1, 'K of dissolving AgCl is Ksp');
  near(pulls({ ...DISSOLVE.baso4, T: T_BENCH }).K, KSP.BaSO4.ksp, 0.1, 'K of dissolving BaSO4 is Ksp');
  // All three salts take in heat, and only NaCl has TΔS above ΔH (the stage-5 answer is not "the exothermic one").
  const p5 = ['agcl', 'nacl', 'baso4'].map(id => pulls({ ...DISSOLVE[id], T: T_BENCH }));
  if (p5.every(p => p.dH > 0) && p5.map(p => p.dG < 0).join() === 'false,true,false') ok('q8-free stage 5: every salt takes in heat and only the second dissolves'); else bad('q8-free stage 5 shape');
  // The cold pack.
  const cp = coldPack(DISSOLVE.nh4cl, { waterG: 500, T0: 25, mol: 1 });
  near(cp.dT, -7.075, 2e-3, 'cold pack temperature change');
  near(cp.T1, 17.925, 1e-3, 'cold pack final temperature');
  if (cp.left === 0) ok('q8-free all the salt of the cold pack dissolves'); else bad(`q8-free cold pack leaves ${cp.left} mol`);

  // Coupling.
  const pair = coupledPair(COUPLE.atp.dG, COUPLE.g6p.dG);
  near(pair.dG, -16.7, 1e-12, 'coupled ΔG°');
  near(pair.K, 846, 5e-3, 'K of the coupled pair');
  if (COUPLE.atp.lhs.concat(COUPLE.g6p.lhs).some(([, s]) => s === 'Pi') && COUPLE.atp.rhs.some(([, s]) => s === 'Pi')) ok('q8-free the two coupled cards share Pi'); else bad('q8-free coupled cards share no substance');

  // The sealed stage: the order of K is reaction 2, 1, 3.
  const Ks = [{ dH: -35, dS: -90 }, { dH: 40, dS: 200 }, { dH: -30, dS: -120 }].map(c => pulls({ ...c, T: T_BENCH }));
  near(Ks[0].dG, -8.18, 2e-3, 'sealed reaction 1 ΔG');
  near(Ks[1].dG, -19.6, 2e-3, 'sealed reaction 2 ΔG');
  near(Ks[2].dG, 5.76, 2e-3, 'sealed reaction 3 ΔG');
  if (Ks[1].K > Ks[0].K && Ks[0].K > Ks[2].K) ok('q8-free sealed order of K is reaction 2, 1, 3'); else bad('q8-free sealed order of K');

  /* ---- the stage's own grading, replayed through the real table ---- */
  // A quest module is browser code (it imports the session and the soundscape at load): stand up the smallest shims, as verify:learn does.
  if (typeof globalThis.window === 'undefined') {
    const memory = new Map(); const noop = () => {};
    globalThis.localStorage = globalThis.localStorage || { getItem: k => (memory.has(k) ? memory.get(k) : null), setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k), clear: () => memory.clear() };
    globalThis.window = { addEventListener: noop, removeEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), location: { hash: '' }, devicePixelRatio: 1 };
    globalThis.document = globalThis.document || { addEventListener: noop, removeEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getContext: () => null, setAttribute: noop }) };
  }
  const q = await import('../../src/learn/quests/unit08/q8-free.js');
  const typed = value => q.stateFor(2, [{ run: 'a' }, { run: 'b' }, { type: { entry: 'k', value } }]);
  const s3 = q.STAGES[2];
  for (const v of ['56.6', '56.5', '57', '55.8']) { if (s3.check(typed(v)).ok) ok(`q8-free typed K ${v} is accepted`); else bad(`q8-free typed K ${v} should be accepted`); }
  // The slips a student makes: kJ taken as J (K near 1), forgotten sign (K below 1), log10 for ln, and the pan's own ratio. Each is refused and
  // told what the pans on the bench show, and no refusal carries the answer.
  for (const [v, why] of [['0.996', 'kJ with R in J'], ['1.004', 'kJ with R in J, other sign'], ['0.0177', 'forgotten minus sign'], ['10860', 'log10 for ln'], ['5.02', 'the K of the -4 pan'], ['10', 'ΔG° taken as K']]) {
    const r = s3.check(typed(v));
    if (r.ok) bad(`q8-free typed K ${v} (${why}) is accepted`);
    else if (!r.msg || /56\.?[56]|57\.|846/.test(r.msg)) bad(`q8-free typed K ${v} (${why}): refusal missing or carries the answer: ${r.msg}`);
    else if (!/vessel/i.test(r.msg)) bad(`q8-free typed K ${v} (${why}): refusal does not name what the vessels show: ${r.msg}`);
    else ok(`q8-free typed K ${v} (${why}) refused: ${r.msg.slice(0, 70)}…`);
  }
  if (s3.check(q.stateFor(2, [])).notYet) ok('q8-free a blank answer box is not yet'); else bad('q8-free a blank answer box is judged');

  // Stage 2: all six placements of three cards on three pans; only one is accepted.
  const ids = ['tm3', 't8', 't2'];
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  let accepted = 0; let refusedWithoutReason = 0;
  for (const pm of perms) {
    const st = q.stateFor(1, pm.map((c, i) => ({ place: { piece: ids[c], to: `slot:s${i + 1}` } })));
    const r = q.STAGES[1].check(st);
    if (r.ok) accepted++; else if (!r.msg) refusedWithoutReason++;
  }
  if (accepted === 1 && refusedWithoutReason === 0) ok('q8-free stage 2: one of six placements is accepted, the rest refused with a reason'); else bad(`q8-free stage 2: ${accepted} accepted, ${refusedWithoutReason} refused without a reason`);

  // Stage 6: every pair of the three cards; only atp + g6p reaches the wanted reaction.
  const cards = ['g6p', 'pcr', 'atp'];
  let good = 0;
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const st = q.stateFor(5, [cards[i], cards[j]].map(c => ({ place: { piece: c, to: 'tray:stack' } })));
    if (q.STAGES[5].check(st).ok) good++;
  }
  if (good === 1) ok('q8-free stage 6: only the ATP and glucose pair reaches the reaction wanted'); else bad(`q8-free stage 6: ${good} pairs pass`);
}
