/**
 * q3-boil — held to the CRC Handbook's vapor pressures, steam table, densities and surface tensions, worked independently here.
 */

/** Refusals may not carry the rule a stage is asking for (1-based stages). */
export const LEAKS = {
  1: [/\bweaker\b/i, /\bstronger\b/i, /\bgrip\b/i],
  2: [/\bhotter\b/i, /\bwarmer\b/i, /\bcolder\b/i, /\btemperature\b/i, /\bheat\b/i],
  4: [/\bequal/i, /\breach/i, /\bboils at\b/i],
  5: [/\bhydrogen bond/i, /\bheavier\b/i, /\blighter\b/i, /\bstronger\b/i, /\bweaker\b/i],
  6: [/\bfollows?\b/i, /\bmatch/i, /\bagree/i, /\bkeeps? (that|the) order\b/i],
  7: [/\bfewer\b/i, /\bless dense\b/i, /\blighter\b/i, /\bopen\b/i, /\blattice\b/i],
  8: [/\bsubtract/i, /\bminus\b/i, /\btake away\b/i, /\b95\b/, /\b5\.[0-9]\b/]
};

export async function check({ q, mod, MD, near, same, holds, start, done }) {
  const C = mod.CHECKS;

  // CRC Handbook vapor pressure of water, kPa (steam table): 25 °C 3.169, 30 °C 4.246, 35 °C 5.628, 40 °C 7.384, 80 °C 47.41, 100 °C 101.42.
  const CRC_WATER = { 25: 3.169, 30: 4.246, 35: 5.628, 40: 7.384, 80: 47.41, 100: 101.42 };
  for (const [T, v] of Object.entries(CRC_WATER)) near(MD.vaporPressure('H2O', Number(T)), v, v * 0.01 + 0.02, `${q}: water at ${T} °C (kPa)`);
  // CRC / NIST at 25 °C: ether 71.7, acetone 30.8, ethanol 7.87, water 3.17 kPa (the Antoine rows agree to 1 %).
  near(MD.vaporPressure('ether', 25), 71.7, 1.0, `${q}: ether at 25 °C`);
  near(MD.vaporPressure('acetone', 25), 30.8, 0.5, `${q}: acetone at 25 °C`);
  near(MD.vaporPressure('ethanol', 25), 7.87, 0.15, `${q}: ethanol at 25 °C`);

  // Stage 1: the order at 25 °C, worked from the four CRC figures.
  const CRC25 = { H2O: 3.17, ethanol: 7.87, acetone: 30.8, ether: 71.7 };
  same(C.VP25_ORDER.join(), ['H2O', 'ethanol', 'ether'].join(), `${q} stage 1 (the rank)`);
  holds(CRC25.H2O < CRC25.ethanol && CRC25.ethanol < CRC25.ether, `${q} stage 1: CRC order`);
  // The grip pattern the reward states: weaker grip, higher pressure, among the three.
  const SUB = MD.SUBSTANCES;
  holds(SUB.ether.grip < SUB.ethanol.grip && SUB.ethanol.grip < SUB.H2O.grip, `${q} stage 1: the grips run ether < ethanol < water`);

  // Stage 2: ethanol at 40 °C 17.9 kPa (CRC 17.9), ether at 0 °C 24.7, acetone at 25 °C 30.8, water at 80 °C 47.4.
  const CRC2 = { ethanol: 17.9, ether: 24.7, acetone: 30.8, h2o: 47.4 };
  same(C.WARM_ORDER.join(), Object.keys(CRC2).sort((a, b) => CRC2[a] - CRC2[b]).join(), `${q} stage 2 (the rank)`);
  same(C.S2.map(s => `${s.id}@${s.T}`).join(), 'h2o@80,ether@0,ethanol@40,acetone@25', `${q} stage 2 (the samples)`);
  holds(C.WARM_ORDER.join() !== C.WARM_SLIP.join(), `${q} stage 2: the slip order equals the answer`);
  holds(C.WARM_ORDER[C.WARM_ORDER.length - 1] === 'h2o', `${q} stage 2: the strongest grip must settle highest when hot`);

  // Stage 4: steam table, water at 65 kPa boils at 88.0 °C (60 kPa 85.95, 70 kPa 89.96). Typed within 3 °C; 100 °C is refused.
  near(C.BP_MOUNTAIN, 88.0, 0.3, `${q} stage 4 (boiling point at 65 kPa)`);
  near(MD.boilingPoint('H2O', 101.325), 100, 0.1, `${q} stage 4: sea level`);
  holds(C.BP_TOL <= 3, `${q} stage 4: tolerance too wide`);
  const heater = C.HEATER_STEPS;
  holds(!heater.some(T => Math.abs(T - 88) < 1), `${q} stage 4: a heater step sits at the answer`);
  // A straight line between the readings either side (80 and 90 °C) lands inside the tolerance; the middle of the bracket (85) does not.
  const a = MD.vaporPressure('H2O', 80); const b = MD.vaporPressure('H2O', 90);
  const lin = 80 + 10 * (65 - a) / (b - a);
  holds(Math.abs(lin - 88.0) <= C.BP_TOL, `${q} stage 4: reading the plot between steps does not pass`);
  const pass = v => mod.STAGES[3].check({ table: { ...start(mod, 3), entries: { bp: String(v) } } }).ok === true;
  holds(pass(88) && pass(86) && pass(90), `${q} stage 4: 86 to 90 should pass`);
  holds(!pass(100) && !pass(65) && !pass(80), `${q} stage 4: 100, 65 or 80 passes`);
  holds(!pass(84), `${q} stage 4: the bracket's low end passes`);

  // Stage 5: normal boiling points (CRC): butane −0.5, n-pentane 36.1, acetone 56.1, water 100.
  same(C.BP_ORDER.join(), ['C4H10', 'C5H12', 'acetone', 'H2O'].join(), `${q} stage 5 (the rank)`);
  holds(C.MASS_ORDER.join() !== C.BP_ORDER.join(), `${q} stage 5: the mass order equals the answer`);
  holds(SUB.H2O.M < SUB.C4H10.M && SUB.H2O.bp > SUB.C4H10.bp, `${q} stage 5: water is lighter than butane yet boils higher`);
  // The probe's grips run in the same order as the boiling points among the four, or the refusal would mislead.
  same(C.BP_ORDER.slice().sort((x, y) => SUB[x].grip - SUB[y].grip).join(), C.BP_ORDER.join(), `${q} stage 5: grip order equals boiling order`);

  // Stage 6: CRC surface tension at 20 °C (mN/m): water 72.8, ethanol 22.3, hexane 18.4. Kinematic viscosity (mm²/s): water 1.00, ethanol 1.52, hexane 0.47.
  const CRC_ST = { H2O: 72.8, ethanol: 22.3, hexane: 18.4 };
  const CRC_NU = { H2O: 1.002 / 0.9982, ethanol: 1.20 / 0.7893, hexane: 0.31 / 0.6603 };
  same(C.PULL_ORDER.join(), Object.keys(CRC_ST).sort((x, y) => CRC_ST[x] - CRC_ST[y]).join(), `${q} stage 6 (surface order)`);
  same(C.POUR_ORDER.join(), Object.keys(CRC_NU).sort((x, y) => CRC_NU[x] - CRC_NU[y]).join(), `${q} stage 6 (pour order)`);
  same(C.GRIP_ORDER.join(), 'hexane,ethanol,H2O', `${q} stage 6 (grip order)`);
  same(C.FOLLOWS, 1, `${q} stage 6 (only the surface pull follows the grip)`);
  same(C.S6_OPTIONS[C.FOLLOWS - 1], 'Surface pull', `${q} stage 6 (the dial's answer)`);
  const solved6 = mod.STAGES[5].check(mod.stateFor(5, mod.SOLUTIONS[5]));
  same(solved6.ok, true, `${q} stage 6 (solution passes)`);

  // Stage 7: CRC ice at 0 °C 0.9168, water at 0 °C 0.99984 g/cm³; the picture counts 11 : 12 stand in that ratio within 0.1 %.
  near(C.BOX_MASS.ice, 0.9168, 1e-9, `${q} stage 7 (ice)`);
  near(C.BOX_MASS.water, 0.99984, 1e-9, `${q} stage 7 (water)`);
  near(C.PICTURE_COUNT.ice / C.PICTURE_COUNT.water, 0.9168 / 0.99984, 0.001, `${q} stage 7 (counts against densities)`);
  const s7 = start(mod, 6);
  same(s7.pieces.pb.props.n, 11, `${q} stage 7 (box B)`);
  same(s7.pieces.pa.props.n, 12, `${q} stage 7 (box A)`);

  // Stage 8: Dalton. Water at 35 °C 5.628 kPa (CRC); 101.3 − 5.628 = 95.67 kPa. Slips: the whole gauge, the 30 °C and 40 °C steps, the sum.
  near(C.GAS_ALONE, 101.3 - 5.628, 0.1, `${q} stage 8 (the gas alone)`);
  const pass8 = v => mod.STAGES[7].check({ table: { ...start(mod, 7), entries: { gas: String(v) } } }).ok === true;
  holds(pass8(95.5) && pass8(95.7) && pass8(95.9), `${q} stage 8: 95.5 to 95.9 should pass`);
  holds(!pass8(101.3) && !pass8(97.1) && !pass8(93.9) && !pass8(106.9) && !pass8(5.6) && !pass8(96.2), `${q} stage 8: a slip passes`);
  holds(Math.abs((4.246 + 7.384) / 2 - 5.628) < 0.25, `${q} stage 8: the midpoint of the 30 and 40 °C readings strays from the CRC value by more than the plot can carry`);

  // The predict stage shows no instrument; no other stage passes untouched.
  holds(!Object.keys(start(mod, 2).fixtures).length, `${q} stage 3: the predict stage shows an instrument`);
  for (const i of [0, 1, 3, 4, 5, 6, 7]) holds(mod.STAGES[i].check(mod.stateFor(i, {})).ok !== true, `${q} stage ${i + 1}: the untouched table passes`);

  // Every stage's evidence is on the bench.
  const kinds = i => Object.values(start(mod, i).fixtures).map(f => f.kind);
  for (const i of [0, 1, 3, 7]) holds(kinds(i).includes('vapour'), `${q} stage ${i + 1}: no flask on the bench`);
  holds(kinds(4).includes('probe'), `${q} stage 5: no probe`);
  holds(kinds(5).includes('surface') && kinds(5).includes('selector'), `${q} stage 6: no plate or answer dial`);
  holds(kinds(6).includes('cell'), `${q} stage 7: no equal boxes`);
  holds(kinds(7).includes('jar'), `${q} stage 8: no jar`);
  // No plate prints the boiling point or the answer to the jar: the fixtures carry no such prop.
  holds(!JSON.stringify(start(mod, 3).fixtures).includes('88'), `${q} stage 4: a fixture carries the answer`);
  holds(!JSON.stringify(start(mod, 7).fixtures).match(/95\./), `${q} stage 8: a fixture carries the answer`);
  void done;
}
