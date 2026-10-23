/**
 * ember-learn-checks.mjs — what `verify:learn` holds Ember Reach (unit05) to, beyond the rules every quest keeps.
 *
 * Every graded figure is recomputed from the real tables (`thermodata.js` through the heat kit), every claim a stage teaches is
 * checked on the table that teaches it, and every refusal is searched for the discriminating feature of its stage (a miss may name what
 * the table shows, never the rule that reads it).
 *
 * Called once from `verify-learn.mjs` with the shared helpers:
 *   { TABLE, getQuest, fail, ok, sentenceLiterals }
 */

/** Words a refusal may not carry on a stage: the rule or the answer the stage is asking the player to find. Per quest, per stage (1-based). */
const LEAKS = {
  'q1-flow': {
    1: [/halfway/i, /\baverage\b/i, /\bmiddle\b/i],
    3: [/\bmass\b/i, /\bweight\b/i, /particles/i, /amount/i, /\btank\b.*\b(more|most)\b/i],
    4: [/exothermic|endothermic/i, /\bgave\b|\btook\b/i, /fizz/i]
  }
};

export async function checkEmber({ TABLE, getQuest, fail, ok, sentenceLiterals }) {
  let bad = 0;
  const f = msg => { bad++; fail(msg); };
  const HK = await import('../../src/learn/table/kits/heat.js');
  const TD = await import('../../src/learn/engine/thermodata.js');
  const get = async id => { const q = getQuest('unit05', id); return q && q.status === 'live' ? q.module() : null; };
  const ids = ['q1-flow', 'q2-calorimetry', 'q3-enthalpy', 'q4-bonds', 'q5-hess', 'q6-entropy', 'q7-gibbs', 'boss-crucible'];
  const mods = Object.fromEntries(await Promise.all(ids.map(async id => [id, await get(id)])));
  const near = (a, b, tol, what) => { if (!(Math.abs(a - b) <= tol)) f(`${what}: graded ${a}, the real figure is ${Number(b).toFixed(4)}`); };
  const same = (a, b, what) => { if (String(a) !== String(b)) f(`${what}: graded ${a}, the real answer is ${b}`); };
  const holds = (cond, what) => { if (!cond) f(what); };
  const start = (q, i) => TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title);
  const done = (q, i) => TABLE.runScript(start(q, i), q.SOLUTIONS[i], { strict: true });
  const run = (t, script) => TABLE.runScript(t, script);

  /* ---- the tables themselves ---- */
  near(TD.SPECIFIC_HEAT_WATER, 4.184, 1e-9, 'thermodata: the specific heat of water');
  near(TD.equilibriumTemp(100, 0.449, 80, 100, 0.449, 20), 50, 1e-9, 'thermodata: equal blocks meet halfway');
  near(TD.bondEnthalpySum([{ bond: 'C-H', count: 4 }, { bond: 'O=O', count: 2 }], [{ bond: 'C=O', count: 2 }, { bond: 'O-H', count: 4 }]).net, -802, 1e-9, 'thermodata: the methane ledger');
  near(TD.gibbsFreeEnergy(-100, -200, 300), -40, 1e-9, 'thermodata: ΔG at 300 K');
  near(TD.crossingTemperature(6.01, 22.0), 273.2, 0.2, 'thermodata: ice melts at 273 K');

  /* ---- every refusal is searched for the feature of its stage ---- */
  for (const [qid, byStage] of Object.entries(LEAKS)) {
    const q = mods[qid];
    if (!q) continue;
    for (const [n, rxs] of Object.entries(byStage)) {
      const i = Number(n) - 1;
      const st = q.STAGES[i];
      const texts = new Set(sentenceLiterals(st.check));
      const miss = st.check(q.stateFor(i, q.MISSES[i] || []));
      if (miss?.msg) texts.add(miss.msg);
      const blank = st.check(q.stateFor(i, {}));
      if (blank?.msg) texts.add(blank.msg);
      for (const t of texts) for (const rx of rxs) if (rx.test(t)) f(`unit05/${qid} stage ${n}: a refusal carries the rule the stage is asking for (${rx}) in "${t.slice(0, 80)}"`);
    }
  }

  /* ---- q1-flow ---- */
  const e1 = mods['q1-flow'];
  if (e1) {
    const q = 'unit05/q1-flow';
    holds(e1.STAGES.length === 4, `${q} should have four stages`);
    {
      // Exactly one pair of the four blocks finishes at 50 degrees, and it is the solution.
      const t = start(e1, 0);
      const ids4 = ['a', 'b', 'c', 'd'];
      const pairs = [];
      for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) {
        const u = run(t, [{ place: { piece: ids4[x], to: `piece:${ids4[y]}` } }]);
        if (Math.abs(HK.blockRead(u, ids4[x]).T - 50) < 0.5) pairs.push(ids4[x] + ids4[y]);
      }
      same(pairs.join(), 'ab', `${q} stage 1 (the pairs that finish at 50)`);
      const all = run(t, ids4.slice(1).map(id => ({ place: { piece: id, to: 'piece:a' } })));
      holds(Math.abs(HK.blockRead(all, 'a').T - 50) > 0.5, `${q} stage 1: all four blocks also finish at 50`);
      holds(e1.STAGES[0].check(e1.stateFor(0, e1.SOLUTIONS[0])).ok, `${q} stage 1: the solution does not pass`);
    }
    {
      const t = start(e1, 1);
      holds(e1.STAGES[1].predict === true && !Object.values(t.fixtures).length, `${q} stage 2: the predict stage shows an instrument`);
    }
    {
      // The spark is far the hotter body, the tank holds far the more energy, and the valve is warmed by the tank only.
      const t = start(e1, 2);
      const cap = id => t.pieces[id].props.m * t.pieces[id].props.c;
      holds(t.pieces.spark.props.T > 10 * t.pieces.tank.props.T, `${q} stage 3: the spark is not the far hotter body`);
      holds(cap('tank') * (t.pieces.tank.props.T - t.pieces.valve.props.T) > 1e4 * cap('spark') * (t.pieces.spark.props.T - t.pieces.valve.props.T), `${q} stage 3: the tank does not hold far more energy than the spark`);
      const withSpark = run(t, [{ place: { piece: 'valve', to: 'piece:spark' } }]);
      holds(HK.blockRead(withSpark, 'valve').T < 1, `${q} stage 3: the spark warms the valve by more than a degree`);
      holds(HK.blockRead(done(e1, 2), 'valve').T >= 30, `${q} stage 3: the tank does not warm the valve`);
    }
    {
      // Two tins warm the bath and two cool it, and the fizzing tablet is one that cools it.
      const dT = id => HK.cupRead(run(start(e1, 3), [{ place: { piece: id, to: 'slot:cup.mouth' } }]), 'cup').dT;
      holds(dT('warmer') > 0.5 && dT('lime') > 0.5 && dT('cold') < -0.5 && dT('fizz') < -0.5, `${q} stage 4: the tins do not split two and two`);
      const t = done(e1, 3);
      holds(['warmer', 'cold', 'fizz', 'lime'].every(id => t.pieces[id].props.rise != null), `${q} stage 4: a tin that has been in the cup does not keep its reading`);
      holds(t.pieces.fizz.props.rise < 0, `${q} stage 4: the fizzing tablet does not cool the bath`);
    }
  }

  void bad;
  return bad;
}
