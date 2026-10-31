/**
 * kettle-data-checks.mjs — Kettle's planners (`engine/reactdata.js`) held against values worked out on paper.
 *
 * Every expected value below is a literal worked by hand from the periodic table (listed masses), the AP's solubility rules, the gas
 * law and stoichiometry; none is produced by the code it checks. `checkKettleData()` returns a list of failure strings.
 */

import {
  molarMass, parseFormula, ionicFormula, nameIonic, nameMolecular, nameAcid, parseEquation, balance, atomLedger, isBalanced, equationText,
  reactPlan, gasVolume, percentYield, planMix, netIonicText, titrate, indicatorColour, oxidationNumbers, kindsOf, netCharge, chargeText, pretty,
  withCoefficients
} from '../../src/learn/engine/reactdata.js';

export function checkKettleData() {
  const bad = [];
  const eq = (what, got, want) => {
    const norm = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(key => [key, x[key]])) : x));
    const same = typeof want === 'number' ? Math.abs(got - want) <= (Math.abs(want) * 1e-3 + 1e-9) : norm(got) === norm(want);
    if (!same) bad.push(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`);
  };

  // Formula masses (1.0 + 1.0 + 16.0 ...), added by hand.
  eq('M(H2O)', molarMass('H2O'), 18.0);
  eq('M(Fe2O3)', molarMass('Fe2O3'), 159.6);               // 2*55.8 + 3*16.0
  eq('M(CaCO3)', molarMass('CaCO3'), 100.1);               // 40.1 + 12.0 + 48.0
  eq('M(Ca(NO3)2)', molarMass('Ca(NO3)2'), 164.1);         // 40.1 + 2*(14.0 + 48.0)
  eq('M(NaCl)', molarMass('NaCl'), 58.5);
  eq('M(CO2)', molarMass('CO2'), 44.0);
  eq('parse Ca(NO3)2', parseFormula('Ca(NO3)2'), { Ca: 1, N: 2, O: 6 });
  eq('parse (NH4)3PO4', parseFormula('(NH4)3PO4'), { N: 3, H: 12, P: 1, O: 4 });
  eq('pretty', pretty('Ca(NO3)2'), 'Ca(NO₃)₂');

  // Smallest neutral groups (charges cancel).
  eq('Mg+Cl', ionicFormula('Mg', 'Cl').formula, 'MgCl2');
  eq('Al+O', ionicFormula('Al', 'O').formula, 'Al2O3');
  eq('Ca+NO3', ionicFormula('Ca', 'NO3').formula, 'Ca(NO3)2');
  eq('NH4+SO4', ionicFormula('NH4', 'SO4').formula, '(NH4)2SO4');
  eq('Fe3+O', ionicFormula('Fe3', 'O').formula, 'Fe2O3');
  eq('Fe2+O', ionicFormula('Fe2', 'O').formula, 'FeO');
  eq('Ca+PO4', ionicFormula('Ca', 'PO4').formula, 'Ca3(PO4)2');
  eq('Na+OH', ionicFormula('Na', 'OH').formula, 'NaOH');
  eq('Mg+O is not Mg2O2', ionicFormula('Mg', 'O').formula, 'MgO');
  eq('needle: Mg + 2 Cl', netCharge({ Mg: 1, Cl: 2 }), 0);
  eq('needle: Mg + Cl', netCharge({ Mg: 1, Cl: 1 }), 1);
  eq('charge text', chargeText(-1), '−');
  eq('charge text 2+', chargeText(2), '²+');

  // Names.
  eq('name NaCl', nameIonic('Na', 'Cl'), 'sodium chloride');
  eq('name MgO', nameIonic('Mg', 'O'), 'magnesium oxide');
  eq('name Fe2O3', nameIonic('Fe3', 'O'), 'iron(III) oxide');
  eq('name FeO', nameIonic('Fe2', 'O'), 'iron(II) oxide');
  eq('name CaNO3', nameIonic('Ca', 'NO3'), 'calcium nitrate');
  eq('name CO', nameMolecular('CO'), 'carbon monoxide');
  eq('name CO2', nameMolecular('CO2'), 'carbon dioxide');
  eq('name N2O4', nameMolecular('N2O4'), 'dinitrogen tetroxide');
  eq('name P2O5', nameMolecular('P2O5'), 'diphosphorus pentoxide');
  eq('name SO3', nameMolecular('SO3'), 'sulfur trioxide');
  eq('name HNO3', nameAcid('HNO3'), 'nitric acid');

  // Balancing: coefficients worked out on paper.
  const bal = t => balance(parseEquation(t));
  eq('H2+O2', bal('H2 + O2 -> H2O'), [[2, 1], [2]]);
  eq('N2+H2', bal('N2 + H2 -> NH3'), [[1, 3], [2]]);
  eq('CH4', bal('CH4 + O2 -> CO2 + H2O'), [[1, 2], [1, 2]]);
  eq('C3H8', bal('C3H8 + O2 -> CO2 + H2O'), [[1, 5], [3, 4]]);
  eq('ore', bal('Fe2O3 + CO -> Fe + CO2'), [[1, 3], [2, 3]]);
  eq('Al+O2', bal('Al + O2 -> Al2O3'), [[4, 3], [2]]);
  eq('phosphate', bal('Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O'), [[3, 2], [1, 6]]);
  eq('Mg+O2', bal('Mg + O2 -> MgO'), [[2, 1], [2]]);
  eq('unbalanceable', bal('H2 + O2 -> NaCl'), null);
  eq('ledger', atomLedger(parseEquation('H2 + O2 -> H2O')).rows, [{ el: 'H', left: 2, right: 2 }, { el: 'O', left: 2, right: 1 }]);
  eq('is balanced', isBalanced(parseEquation('2 H2 + O2 -> 2 H2O')), true);
  eq('is not balanced', isBalanced(parseEquation('H2 + O2 -> H2O')), false);
  eq('subscript trap: H2O2 on the right', atomLedger(parseEquation('H2 + O2 -> H2O2')).balanced, true);
  eq('equation text', equationText(parseEquation('2 H2(g) + O2(g) -> 2 H2O(l)')), '2 H₂(g) + O₂(g) → 2 H₂O(l)');
  eq('with coefficients', isBalanced(withCoefficients(parseEquation('H2 + O2 -> H2O'), [[2, 1], [2]])), true);

  // Stoichiometry. 10.0 g H2 = 5.0 mol; 64.0 g O2 = 2.0 mol; 2 H2 + O2 -> 2 H2O.
  const water = parseEquation('2 H2 + O2 -> 2 H2O');
  const p = reactPlan(water, { H2: 10 / 2.0, O2: 64 / 32.0 });
  eq('limiting is O2', p.limiting, ['O2']);
  eq('H2 left 1 mol', p.left.H2, 1);
  eq('H2 left 2.0 g', p.left.H2 * 2.0, 2.0);
  eq('water made 4 mol', p.made.H2O, 4);
  eq('water made 72 g', p.made.H2O * 18.0, 72);
  // 1.0 g H2 = 0.5 mol, makes 0.5 mol water = 9.0 g, and the dial's neighbours 18 g and 27 g.
  eq('1 g H2 -> water g', reactPlan(water, { H2: 1 / 2.0 }).made.H2O * 18.0, 9.0);
  eq('5 g H2 -> water g', reactPlan(water, { H2: 5 / 2.0 }).made.H2O * 18.0, 45.0);
  // N2 + 3 H2 -> 2 NH3 with 12 mol H2: 8 mol NH3.
  eq('12 mol H2', reactPlan(parseEquation('N2 + 3 H2 -> 2 NH3'), { H2: 12 }).made.NH3, 8);
  // Ore: 79.8 g Fe2O3 = 0.5 mol -> 1.0 mol Fe = 55.8 g.
  const ore = parseEquation('Fe2O3 + 3 CO -> 2 Fe + 3 CO2');
  eq('ore Fe g', reactPlan(ore, { Fe2O3: 79.8 / 159.6 }).made.Fe * 55.8, 55.8);
  eq('percent yield', percentYield(34.1, 55.8), 61.11);
  // CaCO3 -> CaO + CO2 : 50.0 g = 0.4995 mol; V = nRT/P = 0.4995 * 0.08206 * 298.15 / 1.00.
  eq('gas L', gasVolume(50.0 / 100.1, 25, 1.0), 12.22);
  eq('gas L at 0 C', gasVolume(1, 0, 1.0), 22.41);

  // Mixing: AP solubility.
  const mix = (a, b) => planMix({ cat: a[0], an: a[1] }, { cat: b[0], an: b[1] });
  const pb = mix(['Pb2', 'NO3'], ['K', 'I']);
  eq('PbI2 forms', pb.solids.map(s => s.formula), ['PbI2']);
  eq('Pb/I spectators', pb.spectators.sort(), ['K', 'NO3']);
  eq('Pb/I net', netIonicText(pb.net), 'Pb²+(aq) + 2 I−(aq) → PbI₂(s)');
  eq('NaCl+KNO3 nothing', mix(['Na', 'Cl'], ['K', 'NO3']).reacts, false);
  eq('AgCl', mix(['Ag', 'NO3'], ['Na', 'Cl']).solids.map(s => s.formula), ['AgCl']);
  eq('BaSO4', mix(['Ba', 'Cl'], ['Na', 'SO4']).solids.map(s => s.formula), ['BaSO4']);
  eq('Ba/SO4 spectators', mix(['Ba', 'Cl'], ['Na', 'SO4']).spectators.sort(), ['Cl', 'Na']);
  const ab = mix(['H', 'Cl'], ['Na', 'OH']);
  eq('acid + base water', ab.water, true);
  eq('acid + base spectators', ab.spectators.sort(), ['Cl', 'Na']);
  eq('acid + base net', netIonicText(ab.net), 'H+(aq) + OH−(aq) → H₂O(l)');
  eq('two solids (BaSO4 and Fe(OH)3)', mix(['Ba', 'OH'], ['Fe3', 'SO4']).solids.length, 2);
  eq('CuCO3', mix(['Cu2', 'NO3'], ['Na', 'CO3']).solids.map(s => s.formula), ['CuCO3']);
  eq('Fe(OH)3', mix(['Fe3', 'Cl'], ['Na', 'OH']).solids.map(s => s.formula), ['Fe(OH)3']);

  // Titration, strong acid with strong base. 25.0 mL of 0.100 M HCl, 0.100 M NaOH.
  const hcl = { M: 0.1, mL: 25 };
  const naoh = { M: 0.1 };
  eq('equivalence mL', titrate(hcl, naoh, 10).equivalenceMl, 25.0);
  eq('pH at 12.5 mL', titrate(hcl, naoh, 12.5).pH, 1.477);                 // [H+] = 1.25e-3 / 0.0375 = 0.03333
  eq('pH at equivalence', titrate(hcl, naoh, 25).pH, 7);
  eq('pH at 25.1 mL', titrate(hcl, naoh, 25.1).pH, 10.30);                  // [OH-] = 1.0e-5 / 0.0501 = 1.996e-4
  eq('H2SO4 needs twice', titrate({ M: 0.1, mL: 25, nH: 2 }, naoh, 10).equivalenceMl, 50.0);
  eq('phenolphthalein before', indicatorColour('phenolphthalein', 7), 'colourless');
  eq('phenolphthalein after', indicatorColour('phenolphthalein', 9), 'pink');

  // Oxidation numbers worked from the rules.
  eq('ON Fe2O3', oxidationNumbers('Fe2O3'), { Fe: 3, O: -2 });
  eq('ON MnO4-', oxidationNumbers('MnO4', -1), { Mn: 7, O: -2 });
  eq('ON SO4 2-', oxidationNumbers('SO4', -2), { S: 6, O: -2 });
  eq('ON CO2', oxidationNumbers('CO2'), { C: 4, O: -2 });
  eq('ON CH4', oxidationNumbers('CH4'), { C: -4, H: 1 });
  eq('ON NH3', oxidationNumbers('NH3'), { N: -3, H: 1 });
  eq('ON NaH', oxidationNumbers('NaH'), { Na: 1, H: -1 });
  eq('ON ClO3-', oxidationNumbers('ClO3', -1), { Cl: 5, O: -2 });
  eq('ON CuSO4', oxidationNumbers('CuSO4'), { Cu: 2, S: 6, O: -2 });
  eq('ON Fe2(SO4)3', oxidationNumbers('Fe2(SO4)3'), { Fe: 3, S: 6, O: -2 });
  eq('ON Cu', oxidationNumbers('Cu'), { Cu: 0 });
  eq('ON Zn2+', oxidationNumbers('Zn', 2), { Zn: 2 });

  // Kinds of reaction.
  const kinds = t => [...kindsOf(parseEquation(t))].sort();
  eq('Mg+O2', kinds('2 Mg + O2 -> 2 MgO'), ['redox', 'synthesis']);
  eq('methane', kinds('CH4 + 2 O2 -> CO2 + 2 H2O'), ['combustion', 'redox']);
  eq('water splits', kinds('2 H2O -> 2 H2 + O2'), ['decomposition', 'redox']);
  eq('limestone', kinds('CaCO3 -> CaO + CO2'), ['decomposition']);
  eq('lead iodide', kinds('Pb(NO3)2(aq) + 2 KI(aq) -> PbI2(s) + 2 KNO3(aq)'), ['precipitation']);
  eq('neutralise', kinds('HCl(aq) + NaOH(aq) -> NaCl(aq) + H2O(l)'), ['acid-base']);
  eq('zinc in copper', kinds('Zn + CuSO4 -> ZnSO4 + Cu'), ['redox']);
  eq('ore', kinds('Fe2O3 + 3 CO -> 2 Fe + 3 CO2'), ['redox']);
  eq('burning Mg is three', kinds('2 Mg + O2 -> 2 MgO'), ['redox', 'synthesis']);
  return bad;
}
