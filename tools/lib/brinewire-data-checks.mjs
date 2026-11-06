/**
 * brinewire-data-checks.mjs — Phase 1 check of `engine/celldata.js` against INDEPENDENT values.
 * The expected values below were computed by a different route (a Python calculation from F = 96485.33, R = 8.314463, T = 298.15 and hand
 * arithmetic), never by the module under test.
 */
import * as D from '../../src/learn/engine/celldata.js';

const fails = [];
const near = (name, got, want, tol = 0.005) => { if (!(Math.abs(got - want) <= tol)) fails.push(`${name}: got ${got}, want ${want}`); };
const eq = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); };

export function checkBrinewireData() {
  fails.length = 0;
  // standard potentials and cell voltages (CRC series, cathode minus anode)
  near('Zn|Cu E0', D.cellE0('cu', 'zn'), 1.10, 1e-9);
  near('Mg|Ag E0', D.cellE0('ag', 'mg'), 3.17, 1e-9);
  near('Mg|Cu E0', D.cellE0('cu', 'mg'), 2.71, 1e-9);
  near('Fe|Ag E0', D.cellE0('ag', 'fe'), 1.24, 1e-9);
  near('Sn|Pb E0', D.cellE0('pb', 'sn'), 0.012, 1e-9);
  near('Cu|Zn E0 negative', D.cellE0('zn', 'cu'), -1.10, 1e-9);
  near('water back voltage', D.WATER_BACK_VOLTAGE, 1.23, 1e-9);
  // free energy and K (independent: Python from F, R, T)
  near('Zn|Cu dG0', D.deltaG0(1.10, 2), -212.268, 0.01);
  near('Mg|Cu dG0', D.deltaG0(2.71, 2), -522.950, 0.01);
  near('Zn|Cu logK', D.logK(1.10, 2), 37.1877, 0.001);
  near('Mg|Cu logK', D.logK(2.71, 2), 91.6170, 0.001);
  near('Mg|Cu lnK', D.lnK(2.71, 2), 210.9559, 0.001);
  near('Sn|Pb logK', D.logK(0.012, 2), 0.40568, 0.001);
  near('0.0592 V per decade', D.NERNST_LOG, 0.059159, 0.00001);
  // Nernst
  near('Zn|Cu Q=1000', D.nernst(1.10, 2, 1000), 1.01126, 0.0001);
  near('Zn|Cu Q=1e-3', D.nernst(1.10, 2, 1e-3), 1.18874, 0.0001);
  near('cell voltage 1.0 / 0.0010', D.cellVoltage('cu', 'zn', { cAnode: 1, cCathode: 0.001 }), 1.01126, 0.0001);
  near('conc cell Cu 1.0 vs 0.010', D.concentrationCell('cu', 1.0, 0.010).E, 0.059159, 0.0001);
  eq('conc cell anode is the dilute side', D.concentrationCell('cu', 1.0, 0.010).anodeSide, 'B');
  // a Sn|Pb cell run to balance: x with (1+x)/(1-x) = K, K = 10^0.40568 = 2.5453 -> x = (K-1)/(K+1)
  const Ksp = 10 ** 0.405684;
  near('Sn|Pb balance extent', D.balanceExtent('pb', 'sn'), (Ksp - 1) / (Ksp + 1), 1e-4);
  near('Sn|Pb at balance E', D.runCell('pb', 'sn', { x: D.balanceExtent('pb', 'sn') }).E, 0, 1e-6);
  near('Sn|Pb start E', D.runCell('pb', 'sn', { x: 0 }).E, 0.012, 1e-9);
  const mid = D.runCell('pb', 'sn', { x: 0.2 });
  near('Sn|Pb x=0.2 ions', mid.anodeIon + mid.cathodeIon, 2.0, 1e-9);
  near('Sn|Pb x=0.2 E (hand: 0.012 - 0.029580 log 1.5)', mid.E, 0.012 - 0.029580 * Math.log10(1.2 / 0.8), 0.0002);
  // Faraday
  near('Cu 2.00 A 1800 s', D.faradayMass(2.0, 1800, 'cu'), 1.18549, 0.0005);
  near('Ag 3.00 A 600 s', D.faradayMass(3.0, 600, 'ag'), 2.01235, 0.0005);
  near('Ni 2.00 A 1800 s', D.faradayMass(2.0, 1800, 'ni'), 1.09496, 0.0005);
  near('Zn 2.00 A 1800 s', D.faradayMass(2.0, 1800, 'zn'), 1.21971, 0.0005);
  near('current back from mass', D.faradayCurrent(D.faradayMass(2.0, 1800, 'cu'), 1800, 'cu'), 2.0, 1e-9);
  near('Cu slip: minutes as seconds', D.faradayMass(2.0, 30, 'cu'), 0.019758, 0.0001);
  near('charge', D.charge(2.5, 40), 100, 1e-9);
  near('mol e- from 96485 C', D.molesElectrons(96485.33212), 1, 1e-9);
  near('electrode mass change', D.electrodeMassChange('cathode', 'cu', 193), 193 / (2 * 96485.33212) * 63.546, 1e-9);
  eq('cells to exceed water', D.cellsToExceed(1.23, 1.10), 2);
  eq('one cell does not', D.cellsToExceed(1.0, 1.10), 1);
  // displacement and the order of the series
  eq('Zn into Cu2+', D.displaces('zn', 'cu'), true);
  eq('Cu into Zn2+', D.displaces('cu', 'zn'), false);
  eq('Fe into Cu2+ not Zn2+', [D.displaces('fe', 'cu'), D.displaces('fe', 'zn')], [true, false]);
  eq('Ni into Pb2+, not Fe2+', [D.displaces('ni', 'pb'), D.displaces('ni', 'fe')], [true, false]);
  eq('activity order', D.activityOrder(['cu', 'zn', 'pb', 'fe']), ['zn', 'fe', 'pb', 'cu']);
  eq('hydrogen from', ['mg', 'zn', 'fe', 'cu', 'ag', 'au'].filter(D.givesHydrogen), ['mg', 'zn', 'fe']);
  eq('protects iron', ['zn', 'cu', 'mg', 'sn'].filter(D.protectsIron), ['zn', 'mg']);
  eq('takes copper only', ['zn', 'fe', 'mg', 'ag'].filter(m => D.takesOutOnly(m, 'cu', 'fe')), ['fe', 'zn'].filter(m => m === 'fe'));
  // direction
  eq('Zn|Cu direction', D.cellDirection('cu', 'zn'), { anode: 'zn', cathode: 'cu', E0: 1.10 });
  eq('electrons moved Al|Cu', D.electronsMoved('al', 'cu'), 6);
  eq('electrons moved Zn|Cu', D.electronsMoved('zn', 'cu'), 2);
  // oxidation numbers (hand, by the rules)
  eq('Mn in MnO4-', D.oxNumber('MnO4', 'Mn'), 7);
  eq('S in SO4 2-', D.oxNumber('SO4', 'S'), 6);
  eq('N in NO3-', D.oxNumber('NO3', 'N'), 5);
  eq('Cl in AgCl', D.oxNumber('AgCl', 'Cl'), -1);
  eq('Ag in AgNO3', D.oxNumber('AgNO3', 'Ag'), 1);
  eq('Zn atom', D.oxNumber('Zn', 'Zn'), 0);
  eq('Fe3+', D.oxNumber('Fe3+', 'Fe'), 3);
  eq('H in H2', D.oxNumber('H2', 'H'), 0);
  // the ledger: MnO4- + 8 H+ + 5 e- -> Mn2+ + 4 H2O (hand), and that every row names its element
  const mn = D.balanceAcidHalf({ MnO4: 1 }, { 'Mn2+': 1 });
  eq('permanganate half', mn, { left: { MnO4: 1, 'H+': 8 }, right: { 'Mn2+': 1, H2O: 4 }, eLeft: 5, eRight: 0 });
  eq('permanganate balanced', D.halfBalanced(mn), true);
  const unbalanced = { left: { MnO4: 1 }, right: { 'Mn2+': 1 }, eLeft: 0, eRight: 0 };
  eq('unbalanced rows', D.ledgerRows(unbalanced), [
    { label: 'Mn', left: 1, right: 1, balanced: true },
    { label: 'O', left: 4, right: 0, balanced: false },
    { label: 'charge', left: -1, right: 2, balanced: false }
  ]);
  const fe = { left: { 'Fe2+': 1 }, right: { 'Fe3+': 1 }, eLeft: 0, eRight: 1 };
  eq('iron half balanced', D.halfBalanced(fe), true);
  eq('match 5 and 1 electrons', D.matchElectrons(5, 1), { a: 1, b: 5, electrons: 5 });
  eq('match 3 and 2 electrons (Al, Cu)', D.matchElectrons(3, 2), { a: 2, b: 3, electrons: 6 });
  // printing
  eq('fmt volts', D.fmt(3.17, 2), '3.17');
  eq('fmt negative zero prints plainly', D.fmt(-0.0004, 2), '0.00');
  eq('fmt true minus', D.fmt(-0.76, 2), '−0.76');
  eq('sci', D.sci(1.6e37), '1.6 × 10³⁷');
  return fails.slice();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const f = checkBrinewireData();
  if (f.length) { console.error(f.join('\n')); process.exit(1); }
  console.log('brinewire data checks: ok');
}
