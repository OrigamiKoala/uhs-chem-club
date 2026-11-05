/** Hand-worked checks for q5-ice (Equilibrium Concentrations). Expected values were worked on paper. */
import { Q5, iceAmounts, approxExtent, reactedPercent, kFromPartial, iceChipLabel, iceExpression } from '../../src/learn/engine/eqdata.js';

export async function checkTeeterQ5(ok, bad) {
  const near = (got, want, rel, label) => (Math.abs(got - want) <= rel * Math.abs(want) ? ok(`q5 ${label}: ${got.toPrecision(4)} ≈ ${want}`) : bad(`q5 ${label}: got ${got}, expected ${want}`));
  // H2 + I2 ⇌ 2 HI, K = 54, 1.0 M each: 2x/(1−x) = √54 = 7.3485 → x = 7.3485/9.3485 = 0.78606; HI = 1.5721.
  const hi = iceAmounts(Q5.hi.species, { 'H₂': 1, 'I₂': 1 }, 54);
  near(hi.x, 0.78606, 1e-4, 'perfect-square x'); near(hi.amounts.HI, 1.5721, 1e-4, 'perfect-square [HI]');
  // Start 0.50 M each: x = 3.6742/9.3485 = 0.39304; HI = 0.78608; H2 = 0.10696; K back = (0.78608/0.10696)² = 54.0.
  const p = iceAmounts(Q5.hi.species, { 'H₂': 0.5, 'I₂': 0.5 }, 54);
  near(p.amounts.HI, 0.78608, 1e-4, 'half start [HI]');
  near(kFromPartial(Q5.hi.species, { 'H₂': 0.5, 'I₂': 0.5 }, { name: 'HI', value: 0.78608 }).K, 54, 5e-3, 'K from one reading');
  // The slip (HI over H2 and I2, no power): 0.78608 / 0.10696² = 68.7.
  near(0.78608 / (0.10696 * 0.10696), 68.7, 2e-3, 'slip value without the square');
  // N2O4 ⇌ 2 NO2, K = 0.0059, 1.0 M: 4x² + 0.0059x − 0.0059 = 0 → x = (−0.0059 + √(3.481e-5 + 0.0944))/8 = 0.037678; NO2 = 0.075356.
  const n = iceAmounts(Q5.n2o4.species, { 'N₂O₄': 1 }, 5.9e-3);
  near(n.x, 0.037678, 1e-3, 'N₂O₄ exact x'); near(n.amounts['NO₂'], 0.075356, 1e-3, 'N₂O₄ [NO₂]');
  // Small-x: x² = K c0 / 4 = 0.0014750 → x = 0.038406.
  near(approxExtent(Q5.n2o4.species, { 'N₂O₄': 1 }, 5.9e-3), 0.038406, 1e-4, 'small-x x');
  near(reactedPercent(Q5.n2o4.species, { 'N₂O₄': 1 }, 5.9e-3), 3.7678, 1e-3, 'percent reacted from 1.0 M');
  // From 0.020 M: 4x² + 0.0059x − 1.18e-4 = 0 → x = (−0.0059 + √(1.92281e-3))/8 = 0.0047438; NO2 = 0.0094875; the shortcut gives 2·√(1.18e-4/4) = 0.010863.
  const low = iceAmounts(Q5.n2o4.species, { 'N₂O₄': 0.02 }, 5.9e-3);
  near(low.amounts['NO₂'], 0.0094875, 1e-3, 'N₂O₄ from 0.020 M exact');
  near(2 * approxExtent(Q5.n2o4.species, { 'N₂O₄': 0.02 }, 5.9e-3), 0.010863, 1e-3, 'shortcut from 0.020 M');
  if (Math.abs(0.010863 - 0.0094875) / 0.0094875 > 0.03) ok('q5 the shortcut answer is refused at 0.020 M'); else bad('q5 shortcut would pass');
  near(reactedPercent(Q5.n2o4.species, { 'N₂O₄': 0.02 }, 5.9e-3), 23.72, 2e-3, 'percent reacted from 0.020 M');
  // The three fairness pans, A ⇌ 2B: (K 0.004, 1.0 M) x = 0.031128 → 3.1 %; (0.004, 0.010 M) x = 0.0027 → 27 %; (0.4, 1.0 M) x = 0.27015 → 27 %.
  near(reactedPercent(Q5.gen.species, { A: 1 }, 4e-3), 3.1128, 2e-3, 'pan 1 percent');
  near(reactedPercent(Q5.gen.species, { A: 0.01 }, 4e-3), 27.0, 5e-3, 'pan 2 percent');
  near(reactedPercent(Q5.gen.species, { A: 1 }, 0.4), 27.015, 2e-3, 'pan 3 percent');
  // Pan B of stage 8: same K, 1.0 M each; HI = 1.5721 and Pan A's 0.78608 is the slip.
  if (iceChipLabel(-1) === '−x' && iceChipLabel(2) === '+2x' && iceExpression(1, -1) === '1 − x' && iceExpression(0, 2) === '2x') ok('q5 chip labels and the board sum'); else bad('q5 chip labels');
}
