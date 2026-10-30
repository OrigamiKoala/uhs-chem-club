/**
 * q5-crossing — held to values worked by hand from the CRC Handbook (c: ice 2.09, water 4.184, steam 1.97 J/(g·K); ΔHfus 6.01 and
 * ΔHvap 40.65 kJ/mol; M 18.015 g/mol), and to IAPWS reference values for the phase diagram. Nothing here calls the code it checks to
 * produce the figure it checks against.
 */

/** Refusals may not carry the rule a stage is asking for (1-based stages). */
export const LEAKS = {
  1: [/\bmelt/i, /\bchange of state\b/i, /\bheat of fusion\b/i],
  3: [/\bpull\b/i, /\bgrip\b/i, /\bmelt/i, /\bboil/i],
  4: [/\btwice\b/i, /\bdouble/i, /\b2\.00\b/, /\btwo moles\b/i, /\bmultipl/i],
  5: [/\bmelting\b.*\bforgot/i, /\bforgot/i, /\bflat\b/i, /\bheat of vaporization\b/i],
  6: [/\bnegative\b/i, /\bminus\b/i, /\bsign\b/i, /\bgiven out\b/i],
  7: [/\bcondens/i, /\bfreez/i, /\bburns?\b/i],
  8: [/\btriple\b/i, /\bcritical\b/i, /\bbelow\b/i]
};

export async function check({ q, mod, TABLE, MD, near, same, holds, start, done, fail }) {
  const C = await import('../../../src/learn/engine/matterdata-curve.js');
  const g = 18.015;

  /* ---- the curve, worked by hand ---- */
  // 18.015 g is exactly 1 mol. Ice -20 -> 0: 18.015 * 2.09 * 20 = 753.0 J. Melting: 6010 J. Water 0 -> 100: 18.015 * 4.184 * 100 = 7537.2 J.
  // Boiling: 40650 J. Steam 100 -> 110: 18.015 * 1.97 * 10 = 354.9 J.
  const ice20 = 18.015 * 2.09 * 20; const water = 18.015 * 4.184 * 100; const steam10 = 18.015 * 1.97 * 10;
  near(mod.CHECKS.FLAT_START, ice20 / 1000, 0.002, `${q} stage 1 (where the level stretch starts, kJ)`);
  near(mod.CHECKS.FLAT_END, (ice20 + 6010) / 1000, 0.002, `${q} stage 1 (where the level stretch ends, kJ)`);
  holds(Math.abs(mod.CHECKS.FLAT_END - 6.763) < 0.01, `${q} stage 1: the level stretch should end at 6.76 kJ`);
  // Stage 4: 36.0 g / 18.015 = 1.998 mol * 6.01 = 12.01 kJ.
  near(mod.CHECKS.MELT_36, (36.0 / 18.015) * 6.01, 0.001, `${q} stage 4 (kJ)`);
  holds(Math.abs(mod.CHECKS.MELT_36 - 12.0) < 0.05, `${q} stage 4: the answer should be 12.0 kJ`);
  // Stage 5: 18.0 g = 0.99917 mol. Ice -10 -> 0: 18.0*2.09*10 = 376.2 J; melt 6010*0.99917 = 6005; water 18.0*4.184*100 = 7531.2; boil 40650*0.99917 = 40616; steam 18.0*1.97*10 = 354.6.
  const n = 18.0 / 18.015;
  const up = (376.2 + 6010 * n + 7531.2 + 40650 * n + 354.6) / 1000;
  near(mod.CHECKS.UP, up, 0.005, `${q} stage 5 (kJ)`);
  near(mod.CHECKS.UP, 54.9, 0.05, `${q} stage 5 (the figure the reward card prints)`);
  near(mod.CHECKS.DOWN, -up, 0.005, `${q} stage 6 (kJ, the negative of the way up)`);
  // The planner agrees with the older one in matterdata.js on a heating run from ice, at corners and between them.
  for (const Q of [0, 500, 753, 3000, 6763, 7000, 15000, 50000, 54929, 60000]) {
    const a = C.planThermal(g, C.startOf(-20, 'solid'), Q); const b = MD.planHeating(g, -20, Q);
    near(a.T, b.T, 1e-6, `${q}: planThermal against planHeating at ${Q} J`);
  }
  // Cooling is heating run backwards: the way down from steam at 110 returns the same heat, flats included.
  near(C.heatBetween(g, C.startOf(110, 'gas'), C.startOf(-10, 'solid')), -MD.heatToReach(g, -10, 110), 1e-6, `${q}: down is the negative of up`);
  near(C.planThermal(g, C.startOf(110, 'gas'), -(steam10 + 40650) + 1).T, 100, 1e-6, `${q}: cooling steam stands at 100 °C while it condenses`);
  near(C.planThermal(g, C.startOf(110, 'gas'), -(steam10 + 40650 + water + 3000)).T, 0, 1e-6, `${q}: and at 0 °C while it freezes`);

  /* ---- the click and the window ---- */
  // The line is level at 0 °C for 6.01 kJ and at 100 °C for 40.65 kJ (the heat of the flats, per mole of 18.015 g).
  const flat0 = [C.planThermal(g, C.startOf(-20, 'solid'), 1000).T, C.planThermal(g, C.startOf(-20, 'solid'), 5000).T];
  holds(flat0.every(T => Math.abs(T) < 1e-9), `${q} stage 1: the pen should stand at 0 °C between 1 and 5 kJ`);
  const crowd = C.crowdOfTwelve(C.planThermal(g, C.startOf(0, 'solid'), 3005));
  holds(crowd.solid === 6 && crowd.gas === 0, `${q} stage 3: half melted should leave 6 of 12 in the ice`);
  holds(C.crowdOfTwelve(C.planThermal(g, C.startOf(-20, 'solid'), 60000)).gas === 12, `${q} stage 3: 60 kJ should free all twelve`);
  holds(C.crowdOfTwelve(C.planThermal(g, C.startOf(-20, 'solid'), 2000)).gas === 0, `${q} stage 3: 2 kJ should free none`);

  /* ---- the burn: 1.00 g, hand-worked ---- */
  // Water 60 -> 37: 4.184 * 23 = 96.2 J. Water 100 -> 37: 4.184 * 63 = 263.6 J. Steam 100: 40650/18.015 = 2256.5 + 263.6 = 2520.1 J.
  // Steam 120: 1.97 * 20 = 39.4 J more = 2559.5 J.
  const hand = { w60: 4.184 * 23, w100: 4.184 * 63, s100: 40650 / 18.015 + 4.184 * 63, s120: 1.97 * 20 + 40650 / 18.015 + 4.184 * 63 };
  for (const s of mod.CHECKS.HAND) near(mod.CHECKS.gaveOf(s), hand[s.id] / 1000, 0.002, `${q} stage 7 (${s.label}, kJ)`);
  same(mod.CHECKS.HAND_BY_HEAT.join(), 'w60,w100,s100,s120', `${q} stage 7 (the rank)`);
  holds(hand.s100 / hand.w100 > 9 && hand.s100 / hand.w100 < 10, `${q} stage 7: the reward card says steam gives about ten times the heat of water at 100 °C`);

  /* ---- the phase diagram, against IAPWS / CRC reference values ---- */
  near(C.vapourPressure(100), 101.42, 0.05, `${q}: vapour pressure at 100 °C (IF97, kPa)`);
  near(C.vapourPressure(25), 3.169, 0.01, `${q}: vapour pressure at 25 °C (CRC, kPa)`);
  near(C.vapourPressure(200) / 1000, 1.5549, 0.002, `${q}: vapour pressure at 200 °C (MPa)`);
  near(C.vapourPressure(300) / 1000, 8.588, 0.005, `${q}: vapour pressure at 300 °C (MPa)`);
  near(C.sublimationPressure(-10), 0.260, 0.002, `${q}: sublimation pressure at −10 °C (kPa)`);
  near(C.meltingPressure(-10) / 1000, 110, 1.5, `${q}: ice melts at about 110 MPa at −10 °C`);
  near(C.boilingAt(101.325), 99.97, 0.02, `${q}: water boils at 99.97 °C at 1 atm`);
  holds(C.WATER_TRIPLE.P === 0.611657 && C.WATER_TRIPLE.T === 0.01, `${q}: triple point should be 0.01 °C and 0.611657 kPa`);
  holds(C.WATER_CRITICAL.P === 22064 && Math.abs(C.WATER_CRITICAL.T - 373.946) < 1e-9, `${q}: critical point should be 373.946 °C and 22.064 MPa`);
  holds(C.meltingAt(100000) < C.meltingAt(101.325), `${q}: water's melting line leans back (ice melts colder at high pressure)`);
  const dial = [0.1, 0.3, 1, 101.325, 30000, 100000];
  for (const P of dial) {
    const direct = C.sweepAt(P).changes.some(c => c.from === 'solid' && c.to === 'gas');
    holds(direct === (P < 0.611657), `${q} stage 8: sweep at ${P} kPa should ${P < 0.611657 ? '' : 'not '}skip the liquid`);
  }
  holds(!C.sweepAt(30000).changes.some(c => c.to === 'gas'), `${q}: no boiling above the critical pressure`);

  /* ---- the stages: predict shows no instrument, untouched tables never pass, the evidence is on the bench ---- */
  holds(!Object.keys(start(mod, 1).fixtures).length, `${q} stage 2: the predict stage shows an instrument`);
  for (const i of [0, 2, 3, 4, 5, 6, 7]) holds(mod.STAGES[i].check(mod.stateFor(i, {})).ok !== true, `${q} stage ${i + 1}: the untouched table passes`);
  holds(Object.values(start(mod, 0).fixtures).some(f => f.kind === 'heatcurve' && !f.props.window), `${q} stage 1: the recorder should show no window (the window is the test)`);
  holds(Object.values(start(mod, 2).fixtures).some(f => f.kind === 'heatcurve' && f.props.window), `${q} stage 3: the test needs the window`);
  // The plots are at least 36 x 22 units.
  const K = await import('../../../src/learn/table/kits/matter-curve.js');
  holds(K.CURVE_BOX.w >= 90, `${q}: fixture too narrow for a 54 x 22 plot`);
  // Stage 4: the cup holds 18.0 g, half of what the question melts; stage 5 and 6 print no heat total.
  holds(Object.values(start(mod, 3).fixtures).find(f => f.kind === 'heatcurve').props.grams < 36, `${q} stage 4: the cup should hold less than the question asks about`);
  for (const i of [4, 5]) holds(Object.values(start(mod, i).fixtures).find(f => f.kind === 'heatcurve').props.showHeat === false, `${q} stage ${i + 1}: the heat total is printed`);
  // Slip answers are refused: forgotten melting (stage 5), the sign (stage 6), one cup's worth (stage 4).
  const typed = (i, v) => mod.STAGES[i].check(mod.stateFor(i, [{ type: { entry: 'kj', value: v } }]));
  holds(typed(4, '48.9').ok === false, `${q} stage 5: 48.9 kJ (no melting) should be refused`);
  holds(typed(3, '6.0').ok === false, `${q} stage 4: 6.0 kJ (one cup) should be refused`);
  holds(typed(5, '54.9').ok === false, `${q} stage 6: +54.9 should be refused`);
  holds(typed(5, '-54.9').ok === true && typed(5, '−54.9').ok === true, `${q} stage 6: −54.9 should be accepted, with either minus`);
  holds(typed(4, '54.9').ok === true && typed(3, '12').ok === true, `${q}: the right figures should pass`);
  // The windowed molecules never overlap in any state (spacing in window units on the 18-wide inner box).
  for (const k of ['lattice', 'liquid', 'gas']) {
    let min = 1e9;
    for (let a = 0; a < 12; a++) for (let b = a + 1; b < 12; b++) min = Math.min(min, Math.hypot((K.CROWDS[k][a][0] - K.CROWDS[k][b][0]) * 18, (K.CROWDS[k][a][1] - K.CROWDS[k][b][1]) * 18));
    holds(min > 3.3, `${q}: molecules in the window's ${k} state are too close (${min.toFixed(2)})`);
  }
  void done; void fail;
}
