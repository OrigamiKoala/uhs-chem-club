/**
 * kettle-learn-checks.mjs — what `verify:learn` holds Kettle (unit07) to, beyond the rules every quest keeps.
 *
 * The planners (`engine/reactdata.js`) are held to values worked by hand (`kettle-data-checks.mjs`); every graded figure of a bench is held
 * to independent literals worked on paper in this file; the pot, jar and balance are replayed through the real table; no printed plate
 * carries a stage's answer; no dial stands at an asked amount; no refusal gives the method.
 *
 * Called once from `verify-learn.mjs`: `checkKettle({ fail, ok })`.
 */

import { checkKettleData } from './kettle-data-checks.mjs';

/** Words a refusal may not carry: the method a stage asks the player to find. */
const METHOD = /\b(moles|divide|multiply|coefficients?|limiting|excess|theoretical|ratio|convert)\b/i;

const near = (a, b, tol) => Math.abs(a - b) <= tol;

export async function checkKettle({ fail, ok }) {
  const before = [];
  const bad = msg => before.push(msg);

  for (const m of checkKettleData()) bad(`planner: ${m}`);

  const q6 = await import('../../src/learn/quests/unit07/q6-stoich.js');
  const K = await import('../../src/learn/table/kits/pot.js');
  const A = q6.CHECKS.answers;

  // Every figure the bench grades, against values worked on paper:
  //   2 H2 + O2 -> 2 H2O: 5.0 g H2 = 2.5 mol makes 2.5 mol water = 45.0 g.
  //   N2 + 3 H2 -> 2 NH3: 12 mol H2 makes 8 mol NH3.
  //   2 Na + Cl2 -> 2 NaCl: 21.3 g Cl2 = 0.30 mol makes 0.60 mol NaCl = 35.1 g.
  //   12.0 g H2 = 6.0 mol and 64.0 g O2 = 2.0 mol: O2 gives out, 4.0 mol H2 used, 2.0 mol left = 4.0 g.
  //   CaCO3 -> CaO + CO2: 50.0 g / 100.1 = 0.4995 mol; V = 0.4995 x 0.08206 x 298.15 = 12.22 L.
  //   79.8 g Fe2O3 = 0.5 mol makes 1.0 mol Fe = 55.8 g; the furnace keeps 62 %: 34.6 g; yield 62.0 %.
  //   2.00 g sample, 90 % NaCl = 1.80 g = 0.03077 mol makes 0.03077 mol AgCl = 4.41 g; purity 90 %.
  const want = [['water', 45.0, 0.01], ['nh3', 8, 1e-6], ['nacl', 35.1, 0.01], ['h2Left', 4.0, 0.01], ['co2', 12.22, 0.01], ['feAllowed', 55.8, 0.01], ['feMade', 34.6, 0.01], ['yieldPct', 62.0, 0.05], ['agcl', 4.41, 0.01], ['purity', 90.0, 0.3]];
  for (const [k, v, tol] of want) if (!near(A[k], v, tol)) bad(`q6-stoich: ${k} is ${A[k]}, worked by hand ${v}`);

  // No dial stands at an asked amount, and no trial amount is the asked one.
  const C = q6.CHECKS;
  if (C.H2_DIAL.includes(C.H2_ASKED)) bad('q6-stoich stage 2: the dial has a setting at the asked 5.0 g');
  if (C.H2_MOLES.includes(C.H2_ASKED_MOL)) bad('q6-stoich stage 3: the dial has a setting at the asked 12 mol');
  if (C.CL2_TRIAL === C.CL2_ASKED) bad('q6-stoich stage 4: the trial is the asked amount');
  if (C.LIME_TRIAL === C.LIME_ASKED) bad('q6-stoich stage 6: the trial is the asked amount');

  // No plate prints a stage's answer (a figure to be copied), and no jar's printed amount is one.
  const answers = { 1: null, 2: ['45'], 3: ['8'], 4: ['35.1'], 5: ['4.0', '4'], 6: ['12.2', '12'], 7: ['62'], 8: ['90'] };
  q6.STAGES.forEach((st, i) => {
    const printed = [];
    for (const f of st.table.fixtures || []) if (f.kind === 'plaque') printed.push(...f.props.lines);
    for (const p of st.table.pieces || []) if (p.props?.shown) printed.push(p.props.shown);
    for (const a of answers[i + 1] || []) {
      const rx = new RegExp(`(^|[^\\d.])${a.replace('.', '\\.')}([^\\d]|$)`);
      for (const line of printed) if (rx.test(line.replace(/g\/mol|g$/g, m => m)) && !/g\/mol/.test(line)) bad(`q6-stoich stage ${i + 1}: a plate or jar prints "${line}", which carries the answer ${a}`);
    }
  });

  // The pot, the catch jar and the balance, replayed through the real table.
  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const run = id => ({ run: id });
  const weigh = (stage, script) => K.weighRead(q6.stateFor(stage, script).table, 'bal').grams;
  const g2 = weigh(1, [put('catch', 'slot:pot.out'), dial('pot', 'pour', 2), run('pot'), put('catch', 'slot:bal.pan')]);
  if (!near(g2, 18.0, 0.01)) bad(`q6-stoich stage 2: 2 g of hydrogen weighs ${g2} g of water on the balance, worked by hand 18.0`);
  const g4 = weigh(1, [put('catch', 'slot:pot.out'), dial('pot', 'pour', 4), run('pot'), put('catch', 'slot:bal.pan')]);
  if (!near(g4, 36.0, 0.01)) bad(`q6-stoich stage 2: 4 g of hydrogen weighs ${g4} g of water, worked by hand 36.0`);
  const trial4 = weigh(3, [put('cl2', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan')]);
  if (!near(trial4, 11.7, 0.01)) bad(`q6-stoich stage 4: the 7.1 g trial weighs ${trial4} g of salt, worked by hand 11.7`);
  const w5 = weigh(4, [put('h2', 'slot:pot.in1'), put('o2', 'slot:pot.in2'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan')]);
  if (!near(w5, 72.0, 0.01)) bad(`q6-stoich stage 5: the catch jar weighs ${w5} g, worked by hand 72.0`);
  const w7 = weigh(6, [put('ore', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan')]);
  if (!near(w7, 34.6, 0.01)) bad(`q6-stoich stage 7: the catch jar weighs ${w7} g, worked by hand 34.6`);
  const w8 = weigh(7, [put('sample', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan')]);
  if (!near(w8, 4.41, 0.006)) bad(`q6-stoich stage 8: the dried solid weighs ${w8} g, worked by hand 4.41`);
  const gas = K.reactorRead(q6.stateFor(5, [put('lime', 'slot:pot.in1'), run('pot')]).table, 'pot').gas;
  if (!gas || !near(gas.L, 2.44, 0.006)) bad(`q6-stoich stage 6: the 10.0 g trial fills ${gas?.L} L, worked by hand 2.44`);
  // A pot that is not run weighs nothing; a jar that was never fed fills with nothing.
  const none = weigh(1, [put('catch', 'slot:pot.out'), put('catch', 'slot:bal.pan')]);
  if (none !== 0) bad(`q6-stoich stage 2: a catch jar that was never filled weighs ${none} g`);

  // No refusal gives the method.
  q6.MISSES.forEach((script, i) => {
    if (!script.length) return;
    const r = q6.STAGES[i].check(q6.stateFor(i, script));
    if (r && r.msg && METHOD.test(r.msg)) bad(`q6-stoich stage ${i + 1}: a refusal gives the method ("${r.msg}")`);
  });

  for (const m of before) fail(`Kettle: ${m}`);
  if (!before.length) ok('Kettle: every planner agrees with values worked by hand, every graded figure of q6-stoich is recomputed, the pot, jar and balance weigh what they should, no plate prints an answer, no dial stands at an asked amount, and no refusal carries the method');
}
