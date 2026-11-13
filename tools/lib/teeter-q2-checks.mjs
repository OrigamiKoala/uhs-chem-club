/** Hand-worked checks for q2-k (The Number That Holds). Each expected value was worked on paper, never produced by the code under test. */
import {
  K_SYSTEMS, settleAmounts, systemRatio, rigReading, readingsAgree, rigOrientation, kSlips, gaugePos, fmtNum
} from '../../src/learn/engine/eqdata.js';

export async function checkTeeterQ2(ok, bad) {
  const near = (got, want, rel, label) => (Math.abs(got - want) <= rel * Math.abs(want) ? ok(`q2 ${label}: ${Number(got).toPrecision(4)} ≈ ${want}`) : bad(`q2 ${label}: got ${got}, expected ${want}`));
  const S = K_SYSTEMS;
  // A ⇌ B, K = 2, from 1.2 of A alone: B = 2A and A + B = 1.2 → A = 0.4, B = 0.8. From 1.8 of B: A = 0.6. From 0.3 + 0.3: total 0.6 → A = 0.2.
  near(settleAmounts(S.ab, { A: 1.2, B: 0 }).A, 0.4, 1e-9, 'A from A alone');
  near(settleAmounts(S.ab, { A: 0, B: 1.8 }).A, 0.6, 1e-9, 'A from B alone');
  const eq3 = settleAmounts(S.ab, { A: 0.3, B: 0.3 });
  near(eq3.A, 0.2, 1e-9, 'A from equal amounts'); near(eq3.B, 0.4, 1e-9, 'B from equal amounts (not equal)');
  // H₂ + I₂ ⇌ 2 HI, K = 54, from 1 + 1: 2x/(1−x) = √54 = 7.3485 → x = 7.3485/9.3485 = 0.78605; H₂ = 0.21395, HI = 1.5721.
  const hi = settleAmounts(S.hi, { H2: 1, I2: 1 });
  near(hi.H2, 0.21395, 1e-3, 'H₂ from 1 + 1'); near(hi.HI, 1.5721, 1e-3, 'HI from 1 + 1');
  // The typed pan: 0.200, 0.200, 1.47 → 1.47² / 0.04 = 2.1609 / 0.04 = 54.02.
  near((1.47 * 1.47) / (0.2 * 0.2), 54.02, 1e-4, 'typed pan figure for HI');
  // CaCO₃: n = P·V/(R·T) = 0.22 × 10 / (0.082057 × 1073) = 2.2 / 88.04 = 0.02499 mol; from 1.00 CaCO₃ → 0.97501 left and 0.02499 CaO.
  const ca = settleAmounts(S.caco3, { CaCO3: 1, CaO: 0 });
  near(ca.CaO, 0.02499, 2e-3, 'CaO made'); near(ca.CaCO3, 0.97501, 1e-4, 'CaCO₃ left'); near(ca.CO2, 0.22, 1e-12, 'CO₂ pressure');
  // Including the solids gives readings that differ: CaO·CO₂/CaCO₃ = 0.02499 × 0.22 / 0.97501 = 0.005639 on pan 1, 0.82499 × 0.22 / 0.17501 = 1.037 on pan 3.
  const ca3 = settleAmounts(S.caco3, { CaCO3: 0.2, CaO: 0.8 });
  const top = [{ sp: 'CaO', p: 1 }, { sp: 'CO2', p: 1 }]; const bot = [{ sp: 'CaCO3', p: 1 }];
  near(rigReading(top, bot, ca), 0.005639, 3e-3, 'solids in: pan 1'); near(rigReading(top, bot, ca3), 1.037, 3e-3, 'solids in: pan 3');
  if (!readingsAgree([rigReading(top, bot, ca), rigReading(top, bot, ca3)])) ok('q2 readings with the solids do not agree'); else bad('q2 solids readings agree');
  if (readingsAgree([0.22, 0.22, 0.22])) ok('q2 CO₂ alone agrees'); else bad('q2 CO₂ alone disagrees');
  // Orientation: B over A is K, A over B is the inverse, A alone is neither; HI² over H₂ I₂ is K for the HI system.
  if (rigOrientation(S.ab, [{ sp: 'B', p: 1 }], [{ sp: 'A', p: 1 }]) === 'K' && rigOrientation(S.ab, [{ sp: 'A', p: 1 }], [{ sp: 'B', p: 1 }]) === 'inverse' && rigOrientation(S.ab, [{ sp: 'A', p: 1 }], []) === null) ok('q2 orientation of B/A, A/B, A'); else bad('q2 orientation');
  if (rigOrientation(S.hi, [{ sp: 'HI', p: 2 }], [{ sp: 'H2', p: 1 }, { sp: 'I2', p: 1 }]) === 'K' && rigOrientation(S.hi, [{ sp: 'HI', p: 1 }], [{ sp: 'H2', p: 1 }, { sp: 'I2', p: 1 }]) === null) ok('q2 orientation: HI² yes, HI no'); else bad('q2 HI orientation');
  // Slips at 0.200 NO₂ and 0.268 N₂O₄: right 0.268/0.04 = 6.7; no power 0.268/0.2 = 1.34; inverted 1/6.7 = 0.14925; times 2: 0.268/0.4 = 0.67.
  const sl = kSlips(S.n2o4, { NO2: 0.2, N2O4: 0.268 });
  near(sl.right, 6.7, 1e-9, 'slip: right'); near(sl.noPower, 1.34, 1e-9, 'slip: no power'); near(sl.inverted, 0.14925, 1e-4, 'slip: inverted'); near(sl.multiplied, 0.67, 1e-9, 'slip: coefficient as multiplier');
  // The pan the quest hides: 0.736 NO₂ alone settles at 0.200 and 0.268 (0.2 + 2 × 0.268 = 0.736; 0.268 / 0.04 = 6.7).
  const no = settleAmounts(S.n2o4, { NO2: 0.736 });
  near(no.NO2, 0.2, 1e-6, 'NO₂ left'); near(no.N2O4, 0.268, 1e-6, 'N₂O₄ made');
  // Sealed pans: A ⇌ B 0.2/0.8 → 4.0; 2 A ⇌ B 0.5/0.3 → 0.3/0.25 = 1.2 (no power 0.6); A + B ⇌ 2 C 0.2, 0.5, 0.6 → 0.36/0.1 = 3.6 (no power 6.0).
  near(systemRatio(S.a2b, { A: 0.5, B: 0.3 }), 1.2, 1e-9, 'sealed 2A⇌B'); near(settleAmounts(S.a2b, { A: 1.1, B: 0 }).A, 0.5, 1e-6, 'sealed 2A⇌B settles at 0.5');
  near(kSlips(S.a2b, { A: 0.5, B: 0.3 }).noPower, 0.6, 1e-9, 'sealed slip 0.6'); near(kSlips(S.abc, { A: 0.2, B: 0.5, C: 0.6 }).noPower, 6, 1e-9, 'sealed slip 6.0');
  near(settleAmounts(S.abc, { A: 0.5, B: 0.8, C: 0 }).C, 0.6, 1e-6, 'sealed A+B⇌2C makes 0.6 of C');
  // Large and small K from 1.00 of A: A left = 1/(1 + K) = 5.0e-6 for K = 2e5; B made = K/(1 + K) = 3.0e-6 for K = 3e-6.
  near(settleAmounts(S.ab, { A: 1 }, 2e5).A, 5e-6, 1e-4, 'A left, K = 2e5'); near(settleAmounts(S.ab, { A: 1 }, 3e-6).B, 3e-6, 1e-4, 'B made, K = 3e-6');
  // The gauge: Q = K/ 10 sits one decade left, 1.5 decades wide → −2/3; clamped at the ends.
  near(gaugePos(0.2, 2, 1.5), -2 / 3, 1e-9, 'gauge a decade below'); near(gaugePos(2e5, 2, 1.5), 1, 1e-12, 'gauge clamps');
  if (fmtNum(54.02, 2) === '54' && fmtNum(6.7, 3) === '6.70' && fmtNum(2e5, 2) === '2.0 × 10^5' && fmtNum(3e-6, 2) === '3.0 × 10^−6') ok('q2 number formats'); else bad(`q2 number formats: ${fmtNum(54.02, 2)} ${fmtNum(2e5, 2)} ${fmtNum(3e-6, 2)}`);

  // The stages, through the module: the right tiles pass, the slips are refused with a reason that names the table.
  const { installUiStub } = await import('./ui-stub.mjs');
  installUiStub();
  const Q = await import('../../src/learn/quests/unit08/q2-k.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const st = [{ run: 'pans' }];
  const inverse = run(1, [...st, put('t-butane1', 'slot:rig.t1'), put('t-isobutane1', 'slot:rig.b1')]);
  if (inverse.ok) ok('q2 s2 accepts butane over isobutane too (it is a steady ratio)'); else bad(`q2 s2 refused butane over isobutane: ${inverse.msg}`);
  const unsettled = run(1, [put('t-isobutane1', 'slot:rig.t1'), put('t-butane1', 'slot:rig.b1')]);
  if (!unsettled.ok && unsettled.notYet) ok('q2 s2 waits for Settle'); else bad('q2 s2 did not wait for Settle');
  const bareHi = run(2, [...st, put('t-HI1', 'slot:rig.t1'), put('t-H21', 'slot:rig.b1'), put('t-I21', 'slot:rig.b2')]);
  if (!bareHi.ok && /reads/.test(bareHi.msg)) ok(`q2 s3 refuses HI without the square: "${bareHi.msg}"`); else bad('q2 s3 HI without the square');
  const withCaO = run(3, [...st, put('t-CaO1', 'slot:rig.t1'), put('t-CO21', 'slot:rig.t2'), put('t-CaCO31', 'slot:rig.b1')]);
  if (!withCaO.ok) ok(`q2 s4 refuses the solids: "${withCaO.msg}"`); else bad('q2 s4 accepted the solids');
  const typed = (v, why) => { const r = run(4, [{ type: { entry: 'k', value: v } }]); return [r, why]; };
  for (const [v, want] of [['6.7', true], ['6.6', true], ['1.3', false], ['0.15', false], ['0.67', false], ['', false]]) {
    const [r] = typed(v);
    if (Boolean(r.ok) === want && (want || r.msg)) ok(`q2 s5 typed "${v}" ${want ? 'accepted' : `refused: "${r.msg}"`}`); else bad(`q2 s5 typed "${v}"`);
  }
  if (/upside down/.test(typed('0.15')[0].msg) && /once/.test(typed('1.3')[0].msg) && /multiplies/.test(typed('0.67')[0].msg)) ok('q2 s5 each slip has its own reason'); else bad('q2 s5 slip reasons');
}
