/**
 * Checks for Teeter bench 6 (`q6-lean`, Le Chatelier). Every expected value was worked on paper from the stated route, never produced by the
 * code under test. R = 8.314 J/(mol·K), R(atm) = 0.082057 L·atm/(mol·K).
 *
 * Haber, 1 mol N2 + 3 H2 in 1 L at 673 K, Kp = 1.64e-4 at 673.15 K (K at 673 K is 1.646e-4: e^(11089 × 3.3e-7) = 1.0037 × 1.64e-4):
 *   RT = 55.24 L·atm/mol. With x mol reacted, Q = (2x)²/((1−x)(3−3x)³) / RT² = 4x² / (27 (1−x)⁴ · 3051.4).
 *   x/(1−x)² = √(27 × 1.646e-4 × 3051.4 / 4) = √3.390 = 1.841, so 1.841x² − 4.682x + 1.841 = 0, x = (4.682 − √(21.92 − 13.56))/3.682 = 0.4861.
 *   N2 0.514, H2 1.542, NH3 0.972.
 *   Add 1.0 mol H2: Q = (0.972)² / (0.514 × 2.542³) / 55.24² ... in moles 0.9449/(0.514 × 16.42) = 0.1120, ÷ 3051.4 = 3.67e-5 (K 1.646e-4: Q below K, 0.223 K).
 *   Squeeze to 0.5 L: every pressure doubles, Q × 2²/2⁴ = Q/4: 0.25 K.
 *   Argon: no pressure of N2, H2, NH3 changes: Q = K.
 *   Heat to 773 K: ln(K773/K673) = 11089 × (1/773 − 1/673) = 11089 × (−1.922e-4) = −2.131, K = 1.646e-4 × 0.1187 = 1.95e-5.
 * N2O4 ⇌ 2 NO2, K = 1/6.7 = 0.1493 at 298.15 K, ΔH = +57.2 kJ: at 398 K ln ratio = 6879.8 × (1/298.15 − 1/398.15) = 6879.8 × 8.424e-4 = 5.796, e^5.796 = 329.0, K = 49.1.
 * Catalyst: k = 0.1 per tick, ×5 = 0.5; within 2 %: ln 50 / k = 3.912/0.1 = 39.1 → 40 ticks, and 7.82 → 8 ticks.
 * Most NH3 (1 mol N2, 3 mol H2 mixed): 0.5 L and 573 K with NH3 taken out three times beats 1 L at 673 K with none (0.972 mol).
 */
import { LEAN_RXNS, leanK, leanSettle, leanStress, leanAt, leanSettleTick, leanYield, leanQ } from '../../src/learn/engine/eqdata.js';

export async function checkTeeterQ6(ok, bad) {
  const near = (got, want, rel, label) => (Math.abs(got - want) <= rel * Math.abs(want) ? ok(`q6 ${label}: ${got.toPrecision(4)} ≈ ${want}`) : bad(`q6 ${label}: got ${got}, expected ${want}`));
  const H = LEAN_RXNS.haber; const N = LEAN_RXNS.n2o4;
  const s0 = leanSettle(H, { N2: 1, H2: 3, NH3: 0 }, 1, 673);
  near(s0.n.NH3, 0.972, 3e-3, 'settled NH3 at 673 K, 1 L');
  near(s0.n.N2, 0.514, 3e-3, 'settled N2');
  const base = { n: s0.n, V: 1, T: 673 };
  const add = leanStress(H, base, { add: { H2: 1 } });
  near(add.post.Q, 3.67e-5, 5e-3, 'Q right after 1 mol H2');
  near(add.post.Q / add.post.K, 0.223, 5e-3, 'Q / K after adding H2');
  if (add.dir === 'forward' && add.eq.n.N2 < base.n.N2 && add.eq.n.NH3 > base.n.NH3) ok('q6 adding H2 makes N2 fall and NH3 rise'); else bad('q6 adding H2 direction');
  near(leanStress(H, base, { V: 0.5 }).post.Q / s0.K, 0.25, 1e-9, 'Q / K after halving the volume');
  const ar = leanStress(H, base, { inert: 2 });
  near(ar.post.Q / s0.K, 1, 1e-9, 'Q / K with argon added');
  if (ar.dir === 'none' && Math.abs(ar.eq.n.NH3 - base.n.NH3) < 1e-9) ok('q6 argon at a fixed volume moves nothing'); else bad('q6 argon shifted');
  if (ar.post.P > base.n.N2 * 0 + leanStress(H, base, {}).post.P) ok('q6 argon raises the total pressure'); else bad('q6 argon pressure');
  near(leanK(H, 773.15) / leanK(H, 673.15), 0.1187, 3e-3, 'K(773)/K(673) for the Haber vessel');
  near(leanK(N, 398.15), 49.1, 5e-3, 'K of N2O4 at 398 K');
  if (leanK(H, 773) < leanK(H, 673) && leanK(N, 398) > leanK(N, 298)) ok('q6 heat lowers K for the exothermic and raises it for the endothermic'); else bad('q6 K with temperature');
  const heated = leanStress(H, base, { T: 773 });
  if (heated.dir === 'reverse' && heated.eq.n.NH3 < base.n.NH3) ok('q6 heating the Haber vessel moves it toward N2 and H2'); else bad('q6 heating direction');
  if (leanSettleTick(0.1) === 40 && leanSettleTick(0.5) === 8) ok('q6 settle ticks 40 and 8'); else bad(`q6 settle ticks ${leanSettleTick(0.1)}, ${leanSettleTick(0.5)}`);
  const cat = leanStress(H, { n: { N2: 1, H2: 3, NH3: 0 }, V: 1, T: 673 }, { catalyst: true });
  const plain = leanStress(H, { n: { N2: 1, H2: 3, NH3: 0 }, V: 1, T: 673 }, {});
  if (cat.eq.n.NH3 === plain.eq.n.NH3 && cat.post.K === plain.post.K && cat.k === 5 * plain.k) ok('q6 a catalyst changes the rate only'); else bad('q6 catalyst');
  const mid = leanAt(H, plain, 20);
  if (Math.abs(leanQ(H, mid.n, 1, 673) - mid.Q) < 1e-15 && mid.Q < mid.K) ok('q6 Q climbs toward K from below'); else bad('q6 Q along the way');
  const mix = { N2: 1, H2: 3, NH3: 0 };
  const a = leanYield(H, mix, { V: 1, T: 673, cycles: 0 }).made; const b = leanYield(H, mix, { V: 0.5, T: 573, cycles: 3 }).made;
  near(a, 0.972, 3e-3, 'NH3 made at the start dials');
  if (b > a && b <= 2 + 1e-9) ok(`q6 the best dials make ${b.toFixed(3)} mol, under the 2 mol the N2 allows`); else bad('q6 yield');
  // Slips the stages refuse are read from the table: the stage-7 sort must put argon and the catalyst on K.
  const Q = await import('../../src/learn/quests/unit08/q6-lean.js');
  const hand = ['forward', 'forward', 'reverse', 'reverse', 'none', 'none'];
  const got = Q.LEAN.PICKS.slice(1).map(p => leanStress(H, base, { add: p.st.add, V: p.st.V, inert: p.st.inert, catalyst: p.st.catalyst }).dir);
  if (JSON.stringify(got) === JSON.stringify(hand)) ok('q6 the six changes of the sort point the way the hand reading says'); else bad(`q6 sort directions ${got}`);
}
