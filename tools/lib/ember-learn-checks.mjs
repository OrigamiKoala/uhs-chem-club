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
  'boss-crucible': {
    2: [/\bsubtract|minus/i, /\bpays? back|gives? back/i],
    5: [/\b1100\b/, /zero/i]
  },
  'q7-gibbs': {
    2: [/\b250\b/, /lowest/i, /spreading|spread/i, /sign/i],
    3: [/cross/i, /flips?/i],
    4: [/32\.7/, /\b59\.3\b/, /convert/i],
    5: [/\b273\b/, /zero/i, /divid/i]
  },
  'q6-entropy': {
    2: [/outnumber/i, /\bmost\b/i, /\bspread\b/i, /\b70\b|\b68\b/],
    3: [/\bgas\b/i, /\bmoles?\b/i, /room/i],
    4: [/room|faster|motion|streak/i]
  },
  'q5-hess': {
    2: [/state function/i, /\bsame total\b/i, /path|route.*(cannot|never)/i],
    3: [/\bflip|turn|double|scale|larger/i, /cancel/i],
    4: [/products? (less|minus)/i, /\bsubtract/i, /elements/i]
  },
  'q4-bonds': {
    2: [/\b436\b/, /positive/i, /\bplus\b/i, /\+/],
    3: [/starting/i, /reactant/i, /product/i],
    5: [/larger|bigger|greater/i, /\bcool/i, /\bsubtract|minus/i]
  },
  'q3-enthalpy': {
    1: [/\b160\b/, /divid/i, /per mole.*8,?000/i],
    2: [/\b48\b/, /six|6 ?×|times/i, /proportion/i],
    4: [/per gram/i, /weigh/i, /lightest/i, /\bmass\b/i],
    5: [/\b858\b|\b860\b/, /1\.5/, /times/i, /coefficient/i]
  },
  'q2-calorimetry': {
    2: [/tenth/i, /less energy/i, /\bsmaller\b/i, /needs? (a )?(smaller|lower)/i],
    3: [/multipl/i, /4\.184/, /2092/i],
    4: [/334/, /fusion/i, /\bmelting (takes|costs)/i],
    5: [/\bcopper\b/i, /\bc\b.*\b0\.\d/i, /\bmass\b/i],
    6: [/multipl/i, /4\.184/, /\bmass\b/i]
  },
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

  /* ---- q2-calorimetry ---- */
  const e2 = mods['q2-calorimetry'];
  if (e2) {
    const q = 'unit05/q2-calorimetry';
    holds(e2.STAGES.length === 6, `${q} should have six stages`);
    {
      const t = done(e2, 1);
      near(HK.cupRead(t, 'iron').dT, HK.cupRead(t, 'water').dT, 0.1, `${q} stage 2 (equal rises)`);
      holds(HK.cupRead(t, 'iron').joules < HK.cupRead(t, 'water').joules / 5, `${q} stage 2: the iron does not need far less heat than the water`);
      // The wrong model is on the table: the same heat in both cups raises the iron far further than the water.
      const s0 = start(e2, 1);
      holds(HK.cupRead(s0, 'iron').dT > 5 * HK.cupRead(s0, 'water').dT, `${q} stage 2: at the same heat the iron does not rise far further than the water`);
      holds(Boolean(e2.STAGES[0].predict) && !Object.values(start(e2, 0).fixtures).length, `${q} stage 1: the predict stage shows an instrument`);
    }
    {
      const t = done(e2, 2);
      near(HK.markerRead(t, 'joules'), e2.CHECKS.Q_WATER, 35, `${q} stage 3 (the heat absorbed)`);
      same(e2.STAGES[2].check(e2.stateFor(2, e2.SOLUTIONS[2])).ok, true, `${q} stage 3 (the solution)`);
    }
    {
      // Ice in the bath: the bath's heat splits into the melting and the meltwater's warming, and mixing alone would end far warmer.
      const t = run(start(e2, 3), [{ place: { piece: 'ice', to: 'slot:cup.mouth' } }]);
      const r = HK.cupRead(t, 'cup'); const b = t.pieces.ice.props;
      near(r.melted, b.m, 1e-9, `${q} stage 4 (all the ice melts)`);
      near(-r.q - b.m * TD.SPECIFIC_HEAT_WATER * r.Tf, b.m * b.latent, 1e-6, `${q} stage 4 (the bath's heat is the melting plus the meltwater's warming)`);
      near(e2.CHECKS.Q_MELT, b.m * b.latent, 1e-9, `${q} stage 4 (the graded heat)`);
      holds(TD.equilibriumTemp(r.mWater, r.c, r.T0, b.m, TD.SPECIFIC_HEAT_WATER, 0) - r.Tf > 8, `${q} stage 4: the bath does not end far colder than mixing alone`);
      same(e2.STAGES[3].check(e2.stateFor(3, e2.SOLUTIONS[3])).ok, true, `${q} stage 4 (the solution)`);
    }
    {
      // The fitting is copper: the c the bath's rise gives is the listed copper value, and no other metal on the plate is as near.
      const t = run(start(e2, 4), [{ place: { piece: 'fitting', to: 'slot:cup.mouth' } }]);
      const r = HK.cupRead(t, 'cup'); const b = t.pieces.fitting.props;
      const c = TD.blockSpecificHeat(b.m, b.T, r.mWater, r.T0, r.Tf);
      const list = { al: TD.SPECIFIC_HEATS.aluminum.c, fe: TD.SPECIFIC_HEATS.iron.c, cu: TD.SPECIFIC_HEATS.copper.c, ag: TD.SPECIFIC_HEATS.silver.c };
      const nearest = Object.keys(list).sort((x, y) => Math.abs(list[x] - c) - Math.abs(list[y] - c))[0];
      same(nearest, 'cu', `${q} stage 5 (the metal the measured c names)`);
      holds(Math.abs(list.fe - c) > 0.04, `${q} stage 5: iron is too near copper to tell apart`);
      holds(Boolean(t.pieces.fitting.props.trial), `${q} stage 5: a block that has been in the bath does not keep its trial`);
      same(e2.STAGES[4].check(e2.stateFor(4, e2.SOLUTIONS[4])).ok, true, `${q} stage 5 (the solution)`);
    }
    {
      const t = run(start(e2, 5), [{ place: { piece: 'mix', to: 'slot:cup.mouth' } }]);
      near(e2.CHECKS.Q_STAGE4, HK.cupRead(t, 'cup').q, 1, `${q} stage 6 (the heat the bath caught)`);
      near(HK.markerRead(done(e2, 5), 'joules'), HK.cupRead(t, 'cup').q, 25, `${q} stage 6 (the marker)`);
    }
  }

  /* ---- q3-enthalpy ---- */
  const e3 = mods['q3-enthalpy'];
  if (e3) {
    const q = 'unit05/q3-enthalpy';
    {
      // The cup caught 8 kJ from 0.05 mol: 160 kJ for every mole, and the chart that is right drops by exactly that.
      const t = run(start(e3, 0), [{ place: { piece: 'powder', to: 'slot:cup.mouth' } }]);
      const r = HK.cupRead(t, 'cup');
      near(-r.q / 1000 / r.moles, -160, 0.5, `${q} stage 1 (ΔH from the bath's gain)`);
      near(HK.shelvesRead(done(e3, 0), 'chart').dH, -r.q / 1000 / r.moles * -1 * -1, 0.5, `${q} stage 1 (the chart set)`);
      holds(Boolean(e3.CHECKS.AFTER.includes(-160)) && HK.shelvesRead(done(e3, 0), 'chart').down, `${q} stage 1: the chart set does not drop`);
    }
    {
      // The prediction's cards print heat per mole, and the biggest per mole is not the biggest per gram.
      const perMole = id => -TD.FUELS[id].dHc;
      const perGram = id => -TD.FUELS[id].dHc / TD.FUELS[id].molarMass;
      const ids = e3.CHECKS.FUEL_IDS;
      const top = f => [...ids].sort((x, y) => f(y) - f(x))[0];
      same(top(perMole), 'methane', `${q} stage 4 (the biggest figure per mole)`);
      same(top(perGram), 'hydrogen', `${q} stage 4 (the biggest figure per gram)`);
      holds(e3.CHECKS.BY_GRAM.join() === [...ids].sort((x, y) => perGram(x) - perGram(y)).join(), `${q} stage 4 (the order by the gram)`);
      holds(e3.CHECKS.BY_GRAM.join() !== [...ids].sort((x, y) => perMole(x) - perMole(y)).join(), `${q} stage 4: the order by the gram is the order by the mole`);
      holds(Boolean(e3.STAGES[2].predict) && !Object.values(start(e3, 2).fixtures).length, `${q} stage 4: the predict stage shows an instrument`);
      // Each tin's reading in the tank is the planner's, and the tank stays on the thermometer's scale.
      let t = start(e3, 3);
      for (const id of ids) {
        t = run(t, [{ place: { piece: id, to: 'slot:cup.mouth' } }]);
        const r = HK.cupRead(t, 'cup');
        near(t.pieces[id].props.rise, r.dT, 0.06, `${q} stage 4 (${id}'s reading kept on its tin)`);
        near(r.dT, e3.CHECKS.riseOf(id), 0.01, `${q} stage 4 (${id}'s rise)`);
        holds(r.Tf < 100, `${q} stage 4: ${id} takes the thermometer off its scale`);
      }
      const hi = HK.cupRead(run(start(e3, 3), [{ place: { piece: 'hydrogen', to: 'slot:cup.mouth' } }]), 'cup').dT;
      holds(hi > 2 * e3.CHECKS.riseOf('methanol'), `${q} stage 4: the readings are too close to rank by eye`);
      same(done(e3, 3).zones.rail.order.join(), e3.CHECKS.BY_GRAM.join(), `${q} stage 4 (the rail)`);
    }
    {
      // Heat scales with the moles: three settings of the dial, and the marker's answer is the same ΔH times 0.30 mol.
      let t = run(start(e3, 1), [{ place: { piece: 'powder', to: 'slot:cup.mouth' } }]);
      const hs = e3.CHECKS.SCALE_MOLES.map((n, k) => { const u = run(t, [{ setDial: { fixture: 'cup', dial: 'moles', value: k + 1 } }]); return HK.cupRead(u, 'cup'); });
      near(hs[1].q / hs[0].q, 2, 1e-9, `${q} stage 2 (twice the moles, twice the heat)`);
      near(hs[2].q / hs[0].q, 4, 1e-9, `${q} stage 2 (four times the moles, four times the heat)`);
      holds(0.3 > Math.max(...e3.CHECKS.SCALE_MOLES), `${q} stage 2: the asked amount is on the dial`);
      near(e3.CHECKS.Q_ASKED, 0.3 * hs[0].q / 1000 / hs[0].moles, 1e-6, `${q} stage 2 (the graded kJ)`);
      same(e3.STAGES[1].check(e3.stateFor(1, e3.SOLUTIONS[1])).ok, true, `${q} stage 2 (the solution)`);
    }
    {
      near(e3.CHECKS.Q_EQN, (6 / 2.0 / 2) * -e3.CHECKS.EQN_DH, 1e-9, `${q} stage 5 (the heat for the amount burned)`);
      holds(Math.abs(e3.CHECKS.Q_EQN - 6 / 2.016 * -TD.FUELS.hydrogen.dHc) < 10, `${q} stage 5: the equation's ΔH is not twice hydrogen's heat of combustion`);
      same(e3.STAGES[4].check(e3.stateFor(4, e3.SOLUTIONS[4])).ok, true, `${q} stage 5 (the solution)`);
    }
  }

  /* ---- q4-bonds ---- */
  const e4 = mods['q4-bonds'];
  if (e4) {
    const q = 'unit05/q4-bonds';
    holds(e4.STAGES.length === 5, `${q} should have five stages`);
    {
      const t = run(start(e4, 1), [{ setDial: { fixture: 'crank', dial: 'pull', value: 7 } }]);
      near(HK.wellRead(t, 'crank').E, TD.BOND_ENTHALPIES['H-H'].dH, 1e-9, `${q} stage 2 (the cost of H–H)`);
      near(HK.markerRead(done(e4, 1), 'change'), TD.BOND_ENTHALPIES['H-H'].dH, 1e-9, `${q} stage 2 (the energy change set)`);
      const fall = run(start(e4, 1), []);
      holds(fall.fixtures.crank.props.forming !== true, `${q} stage 2: the crank is the falling one`);
      const back = TABLE.createTable({ ...e4.STAGES[1].table, fixtures: [{ ...e4.STAGES[1].table.fixtures[0], props: { ...e4.STAGES[1].table.fixtures[0].props, forming: true } }] }, 'x');
      near(HK.wellRead(run(back, [{ setDial: { fixture: 'crank', dial: 'pull', value: 7 } }]), 'crank').released, TD.BOND_ENTHALPIES['H-H'].dH, 1e-9, `${q}: falling back gives out what pulling took in`);
      holds(Boolean(e4.STAGES[0].predict) && !Object.values(start(e4, 0).fixtures).length, `${q} stage 1: the predict stage shows an instrument`);
    }
    {
      const t = done(e4, 2);
      near(HK.ledgerRead(t, 'ledger').net, e4.CHECKS.CH4_SUMS.net, 1e-9, `${q} stage 3 (the sorted ledger's net)`);
      near(e4.CHECKS.CH4_SUMS.net, -802, 1e-9, `${q} stage 3 (burning methane)`);
      holds(HK.ledgerRead(t, 'ledger').formed > HK.ledgerRead(t, 'ledger').broken, `${q} stage 3: the new bonds do not pay back more than the old cost`);
    }
    {
      const t = start(e4, 4);
      const r = HK.ledgerRead(t, 'ledger');
      near(r.net, e4.CHECKS.NO_SUMS.net, 1e-9, `${q} stage 5 (the ledger as laid)`);
      holds(r.net > 0 && r.broken > r.formed, `${q} stage 5: the reaction in air does not climb`);
      same(e4.STAGES[4].check(e4.stateFor(4, e4.SOLUTIONS[4])).ok, true, `${q} stage 5 (the solution)`);
      holds(Boolean(e4.STAGES[3].predict) && !Object.values(start(e4, 3).fixtures).length, `${q} stage 4: the predict stage shows an instrument`);
    }
  }

  /* ---- q5-hess ---- */
  const e5 = mods['q5-hess'];
  if (e5) {
    const q = 'unit05/q5-hess';
    const num = label => Number(String(label).replace('−', '-').replace('+', ''));
    const picked = t => num(t.fixtures.answer.props.options[Math.round(t.fixtures.answer.dials.value.value) - 1]);
    holds(Boolean(e5.STAGES[0].predict) && !Object.values(start(e5, 0).fixtures).length, `${q} stage 1: the predict stage shows an instrument`);
    {
      const t = done(e5, 1);
      const A = HK.stackRead(t, 'routeA'); const B = HK.stackRead(t, 'routeB');
      holds(A.matches && B.matches, `${q} stage 2: a route does not add up to the reaction wanted`);
      near(A.dH, B.dH, 1e-9, `${q} stage 2: the two routes do not share a total`);
      near(A.dH, TD.FORMATION_TABLE['CO2(g)'].dHf, 0.05, `${q} stage 2 (the total is the formation of CO2)`);
      holds(A.cards.length !== B.cards.length, `${q} stage 2: the two routes use the same number of steps`);
    }
    {
      const t = done(e5, 2);
      const r = HK.stackRead(t, 'wanted');
      holds(r.matches, `${q} stage 3: the solution's stack does not add up to the reaction wanted`);
      near(r.dH, TD.FORMATION_TABLE['CH4(g)'].dHf, 0.1, `${q} stage 3 (building methane)`);
      near(picked(t), r.dH, 0.05, `${q} stage 3 (the number set)`);
      holds(t.pieces.c3.props.flipped && t.pieces.c2.props.scale === 2, `${q} stage 3: the solution does not turn one card and double another`);
    }
    {
      const t = done(e5, 3);
      const r = HK.stackRead(t, 'wanted');
      holds(r.matches, `${q} stage 4: the solution's stack does not add up to the reaction wanted`);
      near(r.dH, TD.standardReactionChange([{ id: 'CaO(s)' }, { id: 'CO2(g)' }], [{ id: 'CaCO3(s)' }], 'dHf'), 0.05, `${q} stage 4 (products less reactants)`);
      near(picked(t), r.dH, 0.05, `${q} stage 4 (the number set)`);
    }
  }

  /* ---- q6-entropy ---- */
  const e6 = mods['q6-entropy'];
  if (e6) {
    const q = 'unit05/q6-entropy';
    const P = await import('../../src/learn/table/kits/heat-parts.js');
    holds(Boolean(e6.STAGES[0].predict) && !Object.values(start(e6, 0).fixtures).length, `${q} stage 1: the predict stage shows an instrument`);
    {
      // After many shakes the particles are spread over both halves far more often than crowded into one.
      const t = run(start(e6, 1), Array.from({ length: 60 }, () => ({ run: 'chamber' })));
      const counts = [0, 0, 0, 0, 0];
      for (const sh of HK.shakesOf(t, 'chamber')) counts[sh.filter(c => c <= 4).length]++;
      holds(counts[2] > counts[4] * 2 && counts[2] > counts[0] * 2 && counts[1] + counts[2] + counts[3] >= 54, `${q} stage 2: the shakes do not favour the spread-out arrangements (${counts.join(' ')})`);
      near(e6.CHECKS.TOTAL_WAYS, HK.waysOf(8, 4), 0, `${q} stage 2 (the arrangements of four in eight)`);
      holds(e6.STAGES[1].check(e6.stateFor(1, e6.SOLUTIONS[1])).ok === true, `${q} stage 2: the solution does not pass`);
    }
    {
      // The gas decides: the equations on the cards, counted.
      const gas = eq => (eq.match(/\(g\)/g) || []).length;
      const t = start(e6, 2);
      holds(gas('CaO(s) + CO₂(g)') > gas('CaCO₃(s)') && gas('2 NH₃(g)') < gas('N₂(g) + 3 H₂(g)'), `${q} stage 3: the gas count does not decide the signs`);
      holds(t.pieces.lime.label.includes('CO₂(g)') && t.pieces.haber.label.includes('NH₃(g)'), `${q} stage 3: the equations on the cards are not the ones counted`);
      holds(TD.standardReactionChange([{ id: 'CaO(s)' }, { id: 'CO2(g)' }], [{ id: 'CaCO3(s)' }], 'S0') > 0 && TD.standardReactionChange([{ id: 'NH3(g)', n: 2 }], [{ id: 'N2(g)' }, { id: 'H2(g)', n: 3 }], 'S0') < 0, `${q} stage 3: the entropy table disagrees with the gas count`);
    }
    {
      // The four boxes are ranked by the room each particle has and by its motion, and the real entropies agree.
      const t = done(e6, 3);
      same(t.zones.rail.order.join(), 'ice,cold,hot,steam', `${q} stage 4`);
      const vol = (ph, T) => { const d = P.phaseDots(ph, T); const span = k => Math.max(...d.map(p => p[k])) - Math.min(...d.map(p => p[k])); return span('u') * span('v') * span('w'); };
      holds(vol('solid', -10) < vol('liquid', 10) && vol('liquid', 10) < vol('gas', 110), `${q} stage 4: the boxes do not give more room from solid to liquid to gas`);
      holds(P.phaseDots('liquid', 10)[0].tail < P.phaseDots('liquid', 80)[0].tail, `${q} stage 4: the hot water's particles do not move faster than the cold water's`);
      holds(P.phaseDots('solid', -10).length === 12 && P.phaseDots('gas', 110).length === 12, `${q} stage 4: the boxes do not hold the same twelve particles`);
      const S = TD.FORMATION_TABLE;
      holds(S['H2O(s)'].S0 < S['H2O(l)'].S0 && S['H2O(l)'].S0 < S['H2O(g)'].S0, `${q} stage 4: the entropy table disagrees with the order`);
      holds(TD.entropyOfHeating(100, 4.184, 10, 80) > 0, `${q} stage 4: warming does not raise the entropy`);
    }
  }

  /* ---- q7-gibbs ---- */
  const e7 = mods['q7-gibbs'];
  if (e7) {
    const q = 'unit05/q7-gibbs';
    const { SALT, SALT_FIRST, ICE, T_ICE } = e7.CHECKS;
    holds(Boolean(e7.STAGES[0].predict) && !Object.values(start(e7, 0).fixtures).length, `${q} stage 1: the predict stage shows an instrument`);
    {
      // The salt takes heat in at every setting, and still its net goes below zero once it is warm enough.
      const t = start(e7, 1);
      const dGs = SALT.Ts.map((T, k) => HK.plotAt(t, 'plot', k + 1));
      holds(dGs.every(r => r.dH > 0), `${q} stage 2: the salt does not take heat in at every setting`);
      holds(dGs[0].dG > 0 && dGs[dGs.length - 1].dG < 0, `${q} stage 2: the net does not change sign across the dial`);
      holds(dGs.filter(r => r.dG < 0).length >= 2, `${q} stage 2: only one setting reads below zero`);
      same(SALT_FIRST, 250, `${q} stage 2 (the coldest setting below zero)`);
      holds(TD.crossingTemperature(SALT.dH, SALT.dS) < SALT_FIRST && TD.crossingTemperature(SALT.dH, SALT.dS) > SALT.Ts[1], `${q} stage 2: the crossing is not between two settings`);
      same(HK.plotRead(done(e7, 1), 'plot').T, SALT_FIRST, `${q} stage 2 (the setting graded)`);
      holds(HK.plotRead(done(e7, 1), 'plot').dG < 0, `${q} stage 2: the graded setting is not below zero`);
    }
    {
      const t = start(e7, 2);
      for (const [id, want] of Object.entries({ 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' })) {
        const { dH, dS } = t.pieces[id].props;
        const lo = TD.gibbsFreeEnergy(dH, dS, 100) < 0; const hi = TD.gibbsFreeEnergy(dH, dS, 600) < 0;
        same(lo && hi ? 'always' : !lo && !hi ? 'never' : hi ? 'high' : 'low', want, `${q} stage 3 (${id})`);
      }
    }
    {
      // ΔG at 298 K from ΔH and ΔS in different units: the right option is the one the units agree on, and every slip is a real slip.
      const { HABER, HABER_OPTIONS, HABER_RIGHT } = e7.CHECKS;
      const dG = HABER.dH - HABER.T * HABER.dS / 1000;
      near(dG, -32.7, 0.1, `${q} stage 4 (ΔG at 298 K)`);
      same(HABER_OPTIONS[HABER_RIGHT - 1], '−32.7 kJ', `${q} stage 4 (the option graded)`);
      near(HABER.dH + HABER.T * HABER.dS / 1000, -151.3, 0.1, `${q} stage 4 (the sign slip)`);
      near(HABER.dH - HABER.T * HABER.dS, 59210, 1, `${q} stage 4 (the unit slip)`);
      same(e7.STAGES[3].check(e7.stateFor(3, e7.SOLUTIONS[3])).ok, true, `${q} stage 4 (the solution)`);
      same(e7.STAGES[3].check(e7.stateFor(3, e7.MISSES[3])).ok, false, `${q} stage 4 (the miss)`);
    }
    {
      near(T_ICE, 273, 1, `${q} stage 5 (the melting point)`);
      near(HK.markerRead(done(e7, 4), 'T'), T_ICE, 2, `${q} stage 5 (the marker)`);
      holds(ICE.Ts.includes(273) && HK.plotAt(start(e7, 4), 'plot', ICE.Ts.indexOf(273) + 1).dG < 0.05, `${q} stage 5: the dial has no setting at the melting point`);
    }
  }

  /* ---- boss-crucible ---- */
  const eb = mods['boss-crucible'];
  if (eb) {
    const q = 'unit05/boss-crucible';
    const num = label => Number(String(label).replace('−', '-').replace('+', '').replace(/ kJ.*$/, ''));
    const picked = (t, id = 'answer') => num(t.fixtures[id].props.options[Math.round(t.fixtures[id].dials.value.value) - 1]);
    near(HK.markerRead(done(eb, 0), 'kj'), TD.heatTransfer(500, TD.SPECIFIC_HEAT_WATER, 20) / 1000, 1.1, `${q} phase 1 (the jacket)`);
    near(HK.cupRead(start(eb, 0), 'jacket').dT, 20, 0.01, `${q} phase 1: the jacket does not rise 20 degrees`);
    near(HK.ledgerRead(start(eb, 1), 'ledger').net, -93, 1e-9, `${q} phase 2 (ammonia's ledger, as laid)`);
    near(picked(done(eb, 1)), -93, 1e-9, `${q} phase 2 (the estimate set)`);
    {
      const t = done(eb, 2);
      holds(HK.stackRead(t, 'wanted').matches, `${q} phase 3: the stack does not add up to the splitting`);
      near(HK.stackRead(t, 'wanted').dH, 824.2, 0.05, `${q} phase 3 (the slag)`);
      near(picked(t), 824.2, 0.05, `${q} phase 3 (the number set)`);
    }
    near(picked(done(eb, 3)), 2 * TD.FORMATION_TABLE['H2(g)'].S0 + TD.FORMATION_TABLE['O2(g)'].S0 - 2 * TD.FORMATION_TABLE['H2O(g)'].S0, 0.05, `${q} phase 4 (the entropy change of splitting steam)`);
    near(HK.markerRead(done(eb, 4), 'T'), TD.crossingTemperature(176, 160), 1e-9, `${q} phase 5 (the seal)`);
    for (let i = 0; i < 5; i++) same((eb.STAGES[i].foes || []).length, 1, `${q} phase ${i + 1} (its foes)`);
    // The five phases are five different tools, one decision each, and none asks for a prediction.
    const kinds = eb.STAGES.map((st, i) => Object.values(start(eb, i).fixtures).map(f => f.kind).filter(k => !['plaque', 'marker', 'selector'].includes(k)).sort().join('+'));
    same(new Set(kinds).size, 5, `${q} (five distinct tools: ${kinds.join(' | ')})`);
    holds(eb.STAGES.every(st => !st.predict), `${q}: a boss phase asks for a prediction`);
  }

  void bad;
  return bad;
}
