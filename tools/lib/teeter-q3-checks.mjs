/** Hand-worked checks for q3-q (Which Way It Goes). Each expected value was worked on paper, never produced by the code under test. */
import { K_SYSTEMS, systemRatio, runMixture, settleAmounts, gaugePos } from '../../src/learn/engine/eqdata.js';

export async function checkTeeterQ3(ok, bad) {
  const near = (got, want, rel, label) => (Math.abs(got - want) <= rel * Math.abs(want) ? ok(`q3 ${label}: ${Number(got).toPrecision(4)} ≈ ${want}`) : bad(`q3 ${label}: got ${got}, expected ${want}`));
  const S = K_SYSTEMS;
  const way = (sys, a) => runMixture(sys, a).dir;
  // A ⇌ B, K = 2. (0.1, 1.9): Q = 19 → reverse. (0.6, 0.6): Q = 1 → forward. (0.5, 1.0): Q = 2 → none. (0.35, 0.7): 2 → none.
  near(systemRatio(S.ab, { A: 0.1, B: 1.9 }), 19, 1e-9, 'Q of the click mixture');
  if (way(S.ab, { A: 0.1, B: 1.9 }) === 'reverse' && way(S.ab, { A: 0.6, B: 0.6 }) === 'forward' && way(S.ab, { A: 0.5, B: 1 }) === 'none' && way(S.ab, { A: 0.35, B: 0.7 }) === 'none') ok('q3 A ⇌ B directions'); else bad('q3 A ⇌ B directions');
  // It settles at the same total 2.0 split 1 : 2 → A = 0.6667, B = 1.3333.
  const after = runMixture(S.ab, { A: 0.1, B: 1.9 }).after;
  near(after.A, 2 / 3, 1e-6, 'A after the click run'); near(after.B, 4 / 3, 1e-6, 'B after the click run');
  // H₂ + I₂ ⇌ 2 HI, K = 54: (0.4, 0.4, 1.0) → 1 / 0.16 = 6.25 → forward, though HI is the largest amount.
  near(systemRatio(S.hi, { H2: 0.4, I2: 0.4, HI: 1 }), 6.25, 1e-9, 'Q of the HI mixture'); if (way(S.hi, { H2: 0.4, I2: 0.4, HI: 1 }) === 'forward') ok('q3 HI mixture goes forward'); else bad('q3 HI direction');
  // 2 NO₂ ⇌ N₂O₄, K = 6.7: (0.1, 0.1) → 0.1 / 0.01 = 10 → reverse; (0.5, 0.5) → 0.5 / 0.25 = 2 → forward; (0.2, 0.268) → 0.268 / 0.04 = 6.7 → none.
  near(systemRatio(S.n2o4, { NO2: 0.1, N2O4: 0.1 }), 10, 1e-9, 'Q of the equal 0.1 mixture');
  if (way(S.n2o4, { NO2: 0.1, N2O4: 0.1 }) === 'reverse' && way(S.n2o4, { NO2: 0.5, N2O4: 0.5 }) === 'forward' && way(S.n2o4, { NO2: 0.2, N2O4: 0.268 }) === 'none') ok('q3 equal pressures go opposite ways, the third stays'); else bad('q3 N₂O₄ directions');
  // 2 SO₂ + O₂ ⇌ 2 SO₃, K = 280: (0.1, 0.2, 0.4) → 0.16 / 0.002 = 80 forward; (0.1, 0.02, 0.4) → 0.16 / 0.0002 = 800 reverse; (0.1, 0.175, 0.7) → 0.49 / 0.00175 = 280 none.
  near(systemRatio(S.so3, { SO2: 0.1, O2: 0.2, SO3: 0.4 }), 80, 1e-9, 'Q sealed 1'); near(systemRatio(S.so3, { SO2: 0.1, O2: 0.02, SO3: 0.4 }), 800, 1e-9, 'Q sealed 2'); near(systemRatio(S.so3, { SO2: 0.1, O2: 0.175, SO3: 0.7 }), 280, 1e-9, 'Q sealed 3');
  if (way(S.so3, { SO2: 0.1, O2: 0.2, SO3: 0.4 }) === 'forward' && way(S.so3, { SO2: 0.1, O2: 0.02, SO3: 0.4 }) === 'reverse' && way(S.so3, { SO2: 0.1, O2: 0.175, SO3: 0.7 }) === 'none') ok('q3 sealed directions'); else bad('q3 sealed directions');
  // A mixture settles where Q = K: from the click mixture, B / A = 1.3333 / 0.6667 = 2.
  near(systemRatio(S.ab, settleAmounts(S.ab, { A: 0.1, B: 1.9 })), 2, 1e-9, 'Q after settling is K');
  // The marker: Q = 80 against K = 280 is log10(0.2857) = −0.544 decades → −0.363 of the half scale (1.5 decades).
  near(gaugePos(80, 280, 1.5), -0.5441 / 1.5, 2e-3, 'marker place'); near(gaugePos(280, 280, 1.5) + 1, 1, 1e-12, 'marker on the line');

  const { installUiStub } = await import('./ui-stub.mjs');
  installUiStub();
  const Q = await import('../../src/learn/quests/unit08/q3-q.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const m = run(0, [put('c2', 'slot:tv.seat')]);
  if (!m.ok && /marker stands at/.test(m.msg)) ok(`q3 s1 refuses a moving mixture: "${m.msg}"`); else bad(`q3 s1: ${m.msg}`);
  const m2 = run(0, [put('c2', 'slot:tv.seat'), { run: 'tv' }]);
  if (!m2.ok && /moved when it was run/.test(m2.msg)) ok('q3 s1 after Run says what moved'); else bad(`q3 s1 after run: ${m2.msg}`);
  const m4 = run(3, [put('m3', 'slot:tv.seat')]);
  if (!m4.ok && /When run/.test(m4.msg)) ok(`q3 s4 refuses the mixture at rest: "${m4.msg}"`); else bad('q3 s4 refusal');
  if (run(3, [put('m1', 'slot:tv.seat')]).ok && run(6, [put('n1', 'slot:tv.seat')]).ok && !run(6, [put('n3', 'slot:tv.seat')]).ok) ok('q3 s4 and s7 accept only the mixture that goes the asked way'); else bad('q3 s4/s7 answers');
  if (!run(7, [put('q1', 'slot:go-p'), put('q2', 'slot:stay')]).ok && run(7, [put('q1', 'slot:go-p')]).notYet) ok('q3 s8 waits for all three'); else bad('q3 s8 partial');
}
