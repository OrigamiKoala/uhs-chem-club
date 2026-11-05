/**
 * verdigris-data-checks.mjs — Phase 1 check of `engine/phdata.js` against INDEPENDENT values.
 * The expected values below were computed by a different route (numpy polynomial roots of the exact cubic/quadratic, closed forms
 * and hand arithmetic), never by the module under test.
 */
import * as D from '../../src/learn/engine/phdata.js';

const fails = [];
const near = (name, got, want, tol = 0.005) => { if (!(Math.abs(got - want) <= tol)) fails.push(`${name}: got ${got}, want ${want}`); };
const rel = (name, got, want, tol = 1e-3) => { if (!(Math.abs(got / want - 1) <= tol)) fails.push(`${name}: got ${got}, want ${want}`); };

export function checkVerdigrisData() {
  fails.length = 0;
  // strong acids and bases
  near('HCl 0.1', D.strongAcid(0.1).pH, 1.0);
  near('HCl 3.2e-4', D.strongAcid(3.2e-4).pH, 3.4949, 0.001);
  near('HCl 1e-8', D.strongAcid(1e-8).pH, 6.9783, 0.001);
  near('Ba(OH)2 0.025', D.strongBase(0.025, { n: 2 }).pH, 12.699, 0.001);
  near('NaOH 0.01 pOH', D.strongBase(0.01).pOH, 2.0, 0.001);
  near('pH+pOH', D.strongBase(0.01).pH + D.strongBase(0.01).pOH, 14, 1e-9);
  // water
  near('neutral 25', D.neutralPH(25), 7.0, 1e-9);
  near('neutral 50', D.neutralPH(50), 6.6306, 0.001);
  near('neutral 60', D.neutralPH(60), 6.5086, 0.001);
  // weak acids and bases
  const ac = D.weakAcid(1.8e-5, 0.10);
  near('acetic 0.10 pH', ac.pH, 2.8753, 0.001); near('acetic 0.10 pct', ac.percent, 1.3327, 0.002);
  near('acetic 0.15 pH', D.weakAcid(1.8e-5, 0.15).pH, 2.7867, 0.001);
  near('acetic 0.001 pct', D.weakAcid(1.8e-5, 0.001).percent, 12.5466, 0.01);
  near('HF 0.10 pH', D.weakAcid(6.8e-4, 0.10).pH, 2.1016, 0.001);
  near('NH3 0.10 pH', D.weakBase(1.8e-5, 0.10).pH, 11.1247, 0.001);
  near('acetate 0.10', D.saltOfWeakAcid(1.8e-5, 0.10).pH, 8.8724, 0.001);
  near('acetate 0.05', D.saltOfWeakAcid(1.8e-5, 0.05).pH, 8.7219, 0.001);
  near('NH4+ 0.05', D.saltOfWeakBase(1.8e-5, 0.05).pH, 5.2781, 0.001);
  // mixtures
  near('30 mL HCl + 20 mL NaOH', D.mixture({ V: 0.05, anions: 3e-3, cations: 2e-3 }).pH, 1.699, 0.001);
  near('HCl + NaOH equal', D.mixture({ V: 0.05, anions: 2.5e-3, cations: 2.5e-3 }).pH, 7.0, 0.001);
  near('equivalence acetic', D.titrationPH({ analyte: { type: 'weakAcid', Ka: 1.8e-5 }, c0: 0.1, V0: 0.025, ct: 0.1, vt: 0.025 }).pH, 8.7219, 0.001);
  // half-equivalence: pH = pKa (to the accuracy of the exact solution)
  near('half-eq acetic', D.titrationPH({ analyte: { type: 'weakAcid', Ka: 1.8e-5 }, c0: 0.1, V0: 0.025, ct: 0.1, vt: 0.0125 }).pH, -Math.log10(1.8e-5), 0.01);
  // buffers
  near('HH 3:1', D.hendersonHasselbalch(-Math.log10(1.8e-5), 0.30, 0.10), 5.2218, 0.001);
  near('buffer exact 3:1', D.bufferPH({ Ka: 1.8e-5, nHA: 0.01, nA: 0.03, V: 0.1 }).pH, 5.2218, 0.01);
  rel('ratio for 4.40', D.ratioForPH(-Math.log10(1.8e-5), 4.40), 0.4521);
  rel('ratio for 5.10', D.ratioForPH(-Math.log10(1.8e-5), 5.10), 2.2661);
  near('fractions at pKa', D.fractions(4.74, 4.74).HA, 0.5, 1e-9);
  near('fractions pH 3', D.fractions(4.745, 3).HA, 0.98245, 0.001);
  // race
  near('race equal', D.raceShare(5, 5), 0.5, 1e-9);
  if (D.raceShare(3.17, -6.3) > 0.01) fails.push('race: HF with Cl- should leave protons almost all on HF side? (K tiny)');
  // table sanity
  rel('Kb acetate', D.BASES.acetate.Kb, 5.556e-10);
  near('Ka * Kb = Kw for NH3', D.ACIDS.nh4.Ka * D.BASES.nh3.Kb, 1e-14, 1e-20);
  near('fmt epsilon', Number(D.fmt(40.65, 1)), 40.7, 1e-9);
  return fails.slice();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const f = checkVerdigrisData();
  if (f.length) { console.error(f.join('\n')); process.exit(1); }
  console.log('verdigris data checks: ok');
}
