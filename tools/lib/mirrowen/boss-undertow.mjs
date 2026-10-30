/**
 * boss-undertow — held to hand-worked values (NIST ethanol, CRC water) and the rules a boss keeps.
 */

export const LEAKS = {
  1: [/\bbecause\b/i, /\bkeeps its shape\b/i, /\bfills\b/i],
  2: [/\bhydrogen bond/i, /\blighter\b/i, /\bheavier\b/i, /\bmass\b/i],
  3: [/\b59\b/, /\bsubtract\b/i, /\blower\b/i],
  4: [/\b40\.6\b/, /\bmultiply\b/i, /\badd\b/i],
  5: [/(?<![.\d])50 mL/, /\bM1V1\b/i, /\bmoles\b/i]
};

export async function check({ q, mod, MD, near, same, holds, start }) {
  // Ethanol at 45 kPa, worked by hand from the Antoine fit: 337.5 mmHg, log 2.5283, 1642.89 / 5.6759 - 230.3 = 59.15 °C.
  near(mod.CHECKS.P3_BP, 59.15, 0.2, `${q} phase 3 (ethanol at 45 kPa)`);
  holds(Math.abs(mod.CHECKS.P3_BP - 78.3) > 15, `${q} phase 3: the answer is near the sea-level boiling point`);
  // 3.00 mol x 6.01 kJ + 54.0 g x 4.184 J/(g·°C) x 100 °C = 18.03 + 22.59.
  near(mod.CHECKS.P4_KJ, 18.03 + 22.5936, 0.03, `${q} phase 4 (the heat)`);
  // 1.50 M x V = 0.300 M x 250 mL.
  near(mod.CHECKS.P5_ML, 50, 1e-9, `${q} phase 5 (the stock)`);
  // Phase 2: the order by grip is the reverse of the order by mass, for the four liquids chosen.
  const SUB = MD.SUBSTANCES;
  const byMass = [...mod.CHECKS.P2_BY_GRIP].sort((a, b) => SUB[a].M - SUB[b].M);
  same(byMass.join(), [...mod.CHECKS.P2_BY_GRIP].reverse().join(), `${q} phase 2 (grip is the reverse of mass)`);
  // Phase 1: three jars, one of each state.
  same(mod.CHECKS.P1_JARS.map(j => j.tray).sort().join(), 'gas,liquid,solid', `${q} phase 1 (one jar of each state)`);
  // A boss has no prediction and no field stage; each phase declares an encounter and its one foe.
  mod.STAGES.forEach((st, i) => {
    holds(!st.predict, `${q} phase ${i + 1}: a boss asks no prediction`);
    holds(st.encounter && st.foes && st.foes.length === 1, `${q} phase ${i + 1}: no encounter or foe`);
    holds(st.check(mod.stateFor(i, {})).ok !== true, `${q} phase ${i + 1}: the untouched table passes`);
  });
  void start;
}
