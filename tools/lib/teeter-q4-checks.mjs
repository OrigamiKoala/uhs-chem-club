/** Hand-worked checks for q4-properties (Combining K). Each expected value was worked on paper, never produced by the code under test. */
import { kpFromKc, Q4, kOfNet, netOfCards, fmtK, chainEquilibrium, iceAmounts, kReverse, kScale, kAdd } from '../../src/learn/engine/eqdata.js';

export async function checkTeeterQ4(ok, bad) {
  const near = (got, want, rel, label) => (Math.abs(got - want) <= rel * Math.abs(want) ? ok(`q4 ${label}: ${got.toPrecision(4)} ≈ ${want}`) : bad(`q4 ${label}: got ${got}, expected ${want}`));
  // Pan P: A + B ⇌ C, K = 4, from 1.0 M each: 4(1−x)² = x → 4x² − 9x + 4 = 0 → x = (9 − √17)/8 = 0.60961; A = B = 0.39039.
  near(Q4.mixP.C, 0.60961, 1e-4, 'mixture C');
  near(Q4.mixP.A, 0.39039, 1e-4, 'mixture A');
  const P = { lhs: Q4.P.lhs, rhs: Q4.P.rhs };
  const a = Q4.mixP.A, c = Q4.mixP.C;
  near(kOfNet(netOfCards([P]), Q4.mixP), c / (a * a), 1e-9, 'K as written = C / (A·B)');
  near(kOfNet(netOfCards([{ ...P, flipped: true }]), Q4.mixP), (a * a) / c, 1e-9, 'flipped = A·B / C');
  near(kOfNet(netOfCards([{ ...P, scale: 2 }]), Q4.mixP), (c * c) / (a * a * a * a), 1e-9, 'twice as large = C² / (A²B²)');
  near(kOfNet(netOfCards([{ ...P, scale: 2 }]), Q4.mixP), 16, 1e-9, 'twice as large is 4² = 16 (hand)');
  near(kOfNet(netOfCards([{ ...P, flipped: true, scale: 2 }]), Q4.mixP), 1 / 16, 1e-9, 'flipped and doubled is 1/16 (hand)');
  // Chain: K1 = 0.5, K2 = 3, total 2.4 → A = 2.4/(1 + 0.5 + 1.5) = 0.8, B = 0.4, C = 1.2.
  near(Q4.mixChain.A, 0.8, 1e-9, 'chain A'); near(Q4.mixChain.B, 0.4, 1e-9, 'chain B'); near(Q4.mixChain.C, 1.2, 1e-9, 'chain C');
  const pair = netOfCards([{ lhs: Q4.chain1.lhs, rhs: Q4.chain1.rhs }, { lhs: Q4.chain2.lhs, rhs: Q4.chain2.rhs }]);
  near(kOfNet(pair, Q4.mixChain), 1.5, 1e-9, 'pair reads 1.2 / 0.8 = 1.5');
  if (Object.keys(pair).sort().join() === 'A,C') ok('q4 the middle substance cancels'); else bad('q4 pair did not cancel B');
  // A second chain from the planner: K1 = 2, K2 = 0.3, total 1 → shares 1 : 2 : 0.6.
  const ch = chainEquilibrium([2, 0.3], ['X', 'Y', 'Z'], 3.6);
  near(ch.Z / ch.X, 0.6, 1e-9, 'chain ratio Z / X = 2 × 0.3');
  // The tiles' right values, worked by hand.
  near(kReverse(0.8), 1.25, 1e-12, 'flip tile 1/0.80');
  near(kScale(5, 2), 25, 1e-12, 'double tile 5²');
  near(kScale(kReverse(0.4), 2), 6.25, 1e-12, 'flip and double tile (1/0.4)²');
  near(kAdd(2, 0.3), 0.6, 1e-12, 'pair tile 2 × 0.3');
  near(kAdd(kScale(3, 2), kReverse(0.4)), 22.5, 1e-12, 'built stack 9 × 2.5');
  near(kAdd(kScale(0.08, 2), kReverse(20)), 3.2e-4, 1e-9, 'typed answer 0.0064 × 0.05');
  // Slips differ from the answers by more than the typed tolerance.
  for (const [v, l] of [[0.0064 * 20, 'forgot to invert'], [0.08 * 0.05, 'forgot to double'], [0.0064 + 0.05, 'added']]) {
    if (Math.abs(v - 3.2e-4) > 0.03 * 3.2e-4) ok(`q4 slip "${l}" (${v}) is refused`); else bad(`q4 slip "${l}" would pass`);
  }
  if (fmtK(3.2e-4) === '3.20e-4' && fmtK(4) === '4.00' && fmtK(0.25) === '0.250') ok('q4 K prints to three figures'); else bad('q4 fmtK');
  // The mixture really is at equilibrium by an independent route.
  near(iceAmounts({ A: -1, B: -1, C: 1 }, { A: 1, B: 1, C: 0 }, 4).amounts.C, 0.60961, 1e-4, 'ICE agrees with the quadratic');
  // Kp = Kc (RT)^dn, by hand: RT = 0.082057 × 298 = 24.455; N2O4 <-> 2 NO2 (dn +1): 0.0059 × 24.455 = 0.14428; 2 C <-> D (dn −1): 100 / 24.455 = 4.0892; dn 0: unchanged.
  near(kpFromKc(0.0059, 1, 298), 0.14428, 1e-4, 'Kp of N2O4 <-> 2 NO2 from Kc 0.0059 at 298 K');
  near(kpFromKc(100, -1, 298), 4.0892, 1e-4, 'Kp of 2 C <-> D from Kc 100');
  near(kpFromKc(4, 0, 298), 4, 1e-12, 'Kp = Kc when the gas count does not change');
}
