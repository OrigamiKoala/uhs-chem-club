/**
 * Data checks for Teeter (unit08). Each expected value below was worked on paper from the stated route, never produced by
 * the code under test (independence: the tolerance is the rounding of the hand figure).
 */
import {
  KSP, molarSolubility, solubilityWithCommon, ionProduct, kFromDeltaG, deltaGFromK, coupledDeltaG, COUPLED,
  iceAmounts, ratio, direction, kReverse, kScale, kAdd, simulatePan, pansEquilibriumB, pansExpectedB, tallyWindow, REACTIONS
} from '../../src/learn/engine/eqdata.js';

export function checkTeeterData(ok, bad) {
  const near = (got, want, rel, label) => {
    if (Math.abs(got - want) <= rel * Math.abs(want)) ok(`${label}: ${got.toPrecision(4)} ≈ ${want}`);
    else bad(`${label}: got ${got}, expected ${want}`);
  };

  // AgCl: s = sqrt(1.8e-10) = 1.342e-5 (1.342^2 = 1.801).
  near(molarSolubility(KSP.AgCl.ksp, KSP.AgCl.ions), 1.342e-5, 2e-3, 'AgCl molar solubility');
  // PbI2: 4 s^3 = 9.8e-9 → s^3 = 2.45e-9 → s = 1.348e-3 (1.348^3 = 2.449).
  near(molarSolubility(KSP.PbI2.ksp, KSP.PbI2.ions), 1.348e-3, 2e-3, 'PbI2 molar solubility');
  // Ag2CrO4: 4 s^3 = 1.1e-12 → s^3 = 2.75e-13 → s = 6.50e-5 (6.5^3 = 274.6).
  near(molarSolubility(KSP.Ag2CrO4.ksp, KSP.Ag2CrO4.ions), 6.50e-5, 3e-3, 'Ag2CrO4 molar solubility');
  // The click: Ag2CrO4 has the smaller Ksp but the larger solubility than AgCl.
  if (KSP.Ag2CrO4.ksp < KSP.AgCl.ksp && molarSolubility(KSP.Ag2CrO4.ksp, [2, 1]) > molarSolubility(KSP.AgCl.ksp, [1, 1])) ok('Ksp order differs from solubility order (Ag2CrO4 vs AgCl)');
  else bad('Ag2CrO4 vs AgCl click does not hold');
  // AgCl in 0.10 M Cl-: s ≈ Ksp / 0.10 = 1.8e-9 (x << 0.10, so 0.10 + s = 0.10 to four figures).
  near(solubilityWithCommon(KSP.AgCl.ksp, [1, 1], 'anion', 0.10), 1.8e-9, 1e-3, 'AgCl in 0.10 M Cl⁻');
  // PbI2 in 0.10 M I-: s (0.10)^2 ≈ 9.8e-9 → s = 9.8e-7.
  near(solubilityWithCommon(KSP.PbI2.ksp, [1, 2], 'anion', 0.10), 9.8e-7, 2e-2, 'PbI2 in 0.10 M I⁻');
  // Ion product of 1.0e-5 M Ag+ and 1.0e-4 M Cl- is 1.0e-9, above 1.8e-10 → precipitate (Q > Ksp).
  if (ionProduct([1, 1], 1e-5, 1e-4) > KSP.AgCl.ksp) ok('Q > Ksp for 1e-5 · 1e-4'); else bad('ion product');

  // ΔG° = −10 kJ at 298.15 K: K = e^(10000/(8.314·298.15)) = e^4.0341 = 56.5 (e^4 = 54.60, e^0.0341 = 1.0347).
  near(kFromDeltaG(-10), 56.5, 3e-3, 'K from ΔG° = −10 kJ');
  // ΔG° = +20 kJ: K = e^(−8.068) = 3.1e-4 (e^-8 = 3.355e-4, e^-0.068 = 0.934 → 3.13e-4).
  near(kFromDeltaG(20), 3.13e-4, 5e-3, 'K from ΔG° = +20 kJ');
  // Round trip K = 1 gives ΔG° = 0.
  near(deltaGFromK(1) + 1, 1, 1e-12, 'ΔG° at K = 1 is zero');
  // The unit slip: using kJ with R in J gives K = e^(−10/(8.314·298.15)) = 0.996; the checker must see it differs hugely.
  near(Math.exp(-10 / (8.314 * 298.15)), 0.99597, 1e-4, 'unit slip value (kJ with R in J)');
  // Coupling: −30.5 + 13.8 = −16.7.
  near(coupledDeltaG(COUPLED.atp.dG, COUPLED.g6p.dG), -16.7, 1e-12, 'ATP drives glucose-6-phosphate');
  // The N2O4 constant from ΔGf: 97.9 − 2·51.3 = −4.7 kJ, K = e^(4700/2478.8) = e^1.896 = 6.66.
  near(kFromDeltaG(97.9 - 2 * 51.3), 6.66, 5e-3, 'K(2NO2 ⇌ N2O4) from ΔGf°');
  near(REACTIONS.n2o4.Kp, 6.7, 1e-2, 'stored Kp for N2O4');

  // ICE: H2 + I2 ⇌ 2 HI, K = 54, start 1.0 M each: 2x/(1−x) = √54 = 7.348 → x = 7.348/9.348 = 0.7861. HI = 1.572, H2 = 0.2139.
  const ice = iceAmounts(REACTIONS.hi.species, { H2: 1, I2: 1, HI: 0 }, 54);
  near(ice.x, 0.7861, 1e-3, 'ICE extent, HI');
  near(ice.amounts.HI, 1.572, 1e-3, 'ICE [HI]');
  near(ice.amounts.H2, 0.2139, 2e-3, 'ICE [H2]');
  // Round trip: the ratio at those amounts is K.
  near(ratio(REACTIONS.hi.species, ice.amounts), 54, 1e-6, 'ratio at the ICE amounts is K');
  // Perfect-square check from the other end: start with HI only, 1.0 M. 2HI ⇌ H2 + I2 has K = 1/54. x²/(1−2x)² = 1/54
  // → x/(1−2x) = 1/7.348 = 0.13608 → x = 0.13608/1.27217 = 0.10697.
  const rev = iceAmounts({ HI: -2, H2: 1, I2: 1 }, { HI: 1, H2: 0, I2: 0 }, 1 / 54);
  near(rev.x, 0.10697, 1e-3, 'ICE extent from HI alone');
  // Small-x: 2A ⇌ B+... N2O4 ⇌ 2NO2, Kc = 5.9e-3 from 0.50 M N2O4: x ≈ ... full solution 4x²/(0.5−x) = 5.9e-3 → 4x² + 5.9e-3 x − 2.95e-3 = 0
  // → x = (−5.9e-3 + √(3.48e-5 + 4.72e-2))/8 = (−5.9e-3 + 0.21766)/8 = 0.02647.
  const n2o4 = iceAmounts({ N2O4: -1, NO2: 2 }, { N2O4: 0.5, NO2: 0 }, 5.9e-3);
  near(n2o4.x, 0.02647, 2e-3, 'ICE extent for N2O4 ⇌ 2 NO2');

  // K rules: reverse of 54 is 0.01852; doubling the equation squares it (2916); halving takes the root (7.348); adding multiplies.
  near(kReverse(54), 0.018519, 1e-4, 'reverse K');
  near(kScale(54, 2), 2916, 1e-12, 'doubled K');
  near(kScale(54, 0.5), 7.3485, 1e-4, 'halved K');
  near(kAdd(2.0, 3.0, 0.5), 3.0, 1e-12, 'added reactions multiply');

  // Q vs K direction: Q = 10 against K = 54 goes forward, Q = 100 reverse, Q = 54 none.
  const d = [direction(10, 54), direction(100, 54), direction(54, 54)].join();
  if (d === 'forward,reverse,none') ok('Q vs K direction'); else bad(`Q vs K direction ${d}`);

  // The pan: n = 48, kf = 0.10, kr = 0.05 → equilibrium B = 48·0.10/0.15 = 32 (two thirds), K = 2.
  near(pansEquilibriumB(48, 0.1, 0.05), 32, 1e-12, 'pan equilibrium B');
  near(pansExpectedB(48, 0.1, 0.05, 0, 0) + 1, 1, 1e-12, 'pan starts at zero B');
  // Relaxation after 10 ticks: 32 − 32·0.85^10 = 32 − 32·0.19687 = 25.70.
  near(pansExpectedB(48, 0.1, 0.05, 0, 10), 25.70, 2e-3, 'pan expected B after 10 ticks');
  // The simulated pan scatters around it: average of settled B over ticks 80 to 400 is within 1.5 of 32, both tallies stay positive,
  // and the two tallies agree within 15 % over 200 ticks (rates equal at equilibrium).
  const h = simulatePan({ n: 48, b0: 0, kf: 0.1, kr: 0.05, ticks: 400, seed: 7 });
  let sum = 0;
  for (let t = 80; t <= 400; t++) sum += h.b[t];
  const mean = sum / 321;
  if (Math.abs(mean - 32) < 1.5) ok(`pan settles near 32 (${mean.toFixed(2)})`); else bad(`pan mean ${mean}`);
  const tw = tallyWindow(h, 400, 200);
  if (tw.fwd > 0 && tw.rev > 0 && Math.abs(tw.fwd - tw.rev) / tw.fwd < 0.15) ok(`tallies agree at equilibrium (${tw.fwd}, ${tw.rev})`); else bad(`tallies ${tw.fwd}, ${tw.rev}`);
  // From B alone the pan reaches the same level.
  const h2 = simulatePan({ n: 48, b0: 48, kf: 0.1, kr: 0.05, ticks: 400, seed: 9 });
  let s2 = 0;
  for (let t = 80; t <= 400; t++) s2 += h2.b[t];
  if (Math.abs(s2 / 321 - 32) < 1.5) ok('pan from B alone settles at the same level'); else bad('pan from B alone');
}
