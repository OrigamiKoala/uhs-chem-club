/**
 * kettle-q3-change-checks.mjs — what `verify:learn` holds Kettle's q3-change bench to (loaded by `kettle-learn-checks.mjs`).
 *
 * Every expected figure is a literal worked on paper from the listed masses (H 1.0, C 12.0, O 16.0, Na 23.0, Cl 35.5, Mg 24.3, Fe 55.8), not
 * produced by the code under test:
 *   4 Fe + 3 O2 -> 2 Fe2O3:       1.00 mol Fe = 55.8 g, 0.75 mol O2 = 24.0 g, 0.50 mol Fe2O3 = 79.8 g (open +24.0 g; sealed 79.8 -> 79.8).
 *   2 Mg + O2 -> 2 MgO:           1.00 mol Mg = 24.3 g, 0.50 mol O2 = 16.0 g, 1.00 mol MgO = 40.3 g (open +16.0 g).
 *   C6H10O5 + 6 O2 -> 6 CO2 + 5 H2O: 0.100 mol wood = 16.2 g, O2 0.600 mol = 19.2 g, products 35.4 g; open: all gas leaves, pot reads 0.0.
 *   C12H22O11 -> 12 C + 11 H2O(g): 0.100 mol = 34.2 g; carbon 14.4 g, steam 19.8 g; open pot keeps the carbon.
 *   ice 1.00 mol = 18.0 g; dry ice 1.00 mol = 44.0 g; sugar 0.05 mol = 17.1 g in 90 g of water; salt 0.20 mol = 11.7 g in 90 g of water.
 *   past the dial: 1.5 mol Fe = 83.7 g with 1.125 mol O2 = 36.0 g makes 0.75 mol Fe2O3 = 119.7 g.
 */

const METHOD = /\b(moles|divide|multiply|coefficients?|limiting|excess|theoretical|ratio|convert|conservation)\b/i;

export async function check({ near }) {
  const bad = [];
  const q = await import('../../src/learn/quests/unit07/q3-change.js');
  const D = await import('../../src/learn/engine/reactdata-change.js');
  const K = await import('../../src/learn/table/kits/pot-change.js');

  // The planner against the figures worked by hand: [case, open before, open after, sealed before, sealed after].
  const want = [
    ['ice', 18.0, 18.0, 18.0, 18.0],
    ['sugarwater', 107.1, 107.1, 107.1, 107.1],
    ['saltwater', 101.7, 101.7, 101.7, 101.7],
    ['dryice', 44.0, 0.0, 44.0, 44.0],
    ['sugarheat', 34.2, 14.4, 34.2, 34.2],
    ['wool', 55.8, 79.8, 79.8, 79.8],
    ['magnesium', 24.3, 40.3, 40.3, 40.3],
    ['wood', 16.2, 0.0, 35.4, 35.4]
  ];
  for (const [id, ob, oa, sb, sa] of want) {
    const o = D.planChange(id);
    const s = D.planChange(id, { sealed: true });
    if (!near(o.massBefore, ob, 0.011) || !near(o.massAfter, oa, 0.011)) bad.push(`${id} open weighs ${o.massBefore} -> ${o.massAfter}, worked by hand ${ob} -> ${oa}`);
    if (!near(s.massBefore, sb, 0.011) || !near(s.massAfter, sa, 0.011)) bad.push(`${id} sealed weighs ${s.massBefore} -> ${s.massAfter}, worked by hand ${sb} -> ${sa}`);
    if (!near(s.massBefore, s.massAfter, 1e-6)) bad.push(`${id}: a sealed pot changed weight`);
  }

  // The lamps, worked by hand from what each change does: [case, gas, colour, solid, temperature, new substance].
  const lamps = [
    ['ice', 0, 0, 0, 1, 0], ['sugarwater', 0, 0, 0, 0, 0], ['saltwater', 0, 0, 0, 0, 0], ['dryice', 1, 0, 0, 1, 0],
    ['sugarheat', 1, 1, 1, 0, 1], ['wool', 0, 1, 1, 1, 1], ['magnesium', 0, 1, 1, 1, 1], ['wood', 1, 0, 0, 1, 1]
  ];
  for (const [id, g, c, s, t, n] of lamps) {
    const p = D.planChange(id);
    const got = [p.lamps.gas, p.lamps.colour, p.lamps.solid, p.lamps.temp, p.newSubstance].map(Number);
    if (got.join() !== [g, c, s, t, n].join()) bad.push(`${id}: lamps and new substance read ${got.join('')}, worked by hand ${[g, c, s, t, n].join('')}`);
  }
  // A lamp lit is not a new substance: dry ice and wood chips light the same lamps and differ in the window.
  const di = D.planChange('dryice'); const wd = D.planChange('wood');
  if (JSON.stringify(di.lamps) !== JSON.stringify(wd.lamps) || di.newSubstance === wd.newSubstance) bad.push('dry ice and wood chips do not light the same lamps while differing in the window');

  // The asked figure.
  const A = q.CHECKS.answers;
  if (!near(A.askedIron, 83.7, 0.011) || !near(A.askedOxygen, 36.0, 0.011) || !near(A.askedTotal, 119.7, 0.011)) bad.push(`stage 6 asks ${A.askedIron} + ${A.askedOxygen} = ${A.askedTotal}, worked by hand 83.7 + 36.0 = 119.7`);
  if (q.CHECKS.WOOL_DIAL.list.includes(83.7)) bad.push('stage 6: the dial has a setting at the asked 83.7 g');

  // No lamp says what kind of change it was.
  for (const [, name] of K.LAMPS) if (/chemical|physical|reaction|new substance/i.test(name)) bad.push(`a lamp says "${name}"`);

  // The pot replayed through the real table.
  const put = (piece, to) => ({ place: { piece, to } });
  const run = id => ({ run: id });
  const weigh = (stage, script, fid = 'bal') => K.scaleRead(q.stateFor(stage, script).table, fid);
  const w4 = weigh(3, [put('wool', 'slot:pot.in'), run('pot')]);
  if (!near(w4.before, 55.8, 0.011) || !near(w4.after, 79.8, 0.011)) bad.push(`stage 4: the balance reads ${w4.before} -> ${w4.after}, worked by hand 55.8 -> 79.8`);
  const w4b = weigh(3, [put('wool', 'slot:pot.in')]);
  if (w4b.after !== null) bad.push('stage 4: the balance reads an after weight before the pot is run');
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const w6 = weigh(5, [dial('pot', 'lid', 2), dial('pot', 'amount', 3), run('pot')]);
  if (!near(w6.before, 47.88, 0.06) || !near(w6.after, 47.88, 0.06)) bad.push(`stage 6: the sealed pot at 33.5 g reads ${w6.before} -> ${w6.after}, worked by hand 47.9 -> 47.9`);
  const w6o = weigh(5, [dial('pot', 'amount', 3), run('pot')]);
  if (!(w6o.after > w6o.before)) bad.push('stage 6: the open pot of steel wool does not gain weight');
  // A different set-up is a new set-up: the lid turned after a run is not yet run.
  const turned = K.changeRead(q.stateFor(5, [dial('pot', 'amount', 3), run('pot'), dial('pot', 'lid', 2)]).table, 'pot');
  if (turned.ran) bad.push('stage 6: turning the lid after a run still reads as run');

  // Lamps light only after a run, and only from the planner.
  const lampsStage = 1;
  const before = K.lampsRead(q.stateFor(lampsStage, [put('dryice', 'slot:pot.in')]).table, 'lamps');
  const after = K.lampsRead(q.stateFor(lampsStage, [put('dryice', 'slot:pot.in'), run('pot')]).table, 'lamps');
  if (before.lamps) bad.push('stage 2: a lamp is lit before the pot is run');
  if (!after.lamps || after.lamps.gas !== true || after.lamps.colour !== false) bad.push('stage 2: the lamps after dry ice are not gas and temperature');

  // A blank bench never passes; a predict stage shows no instrument and nothing runnable.
  q.STAGES.forEach((st, i) => {
    const r = st.check(q.stateFor(i, []));
    if (r.ok) bad.push(`stage ${i + 1}: a blank bench passes`);
    if (!r.notYet) bad.push(`stage ${i + 1}: a blank bench is not answered "not yet"`);
  });
  const pr = q.STAGES[2];
  if (!pr.predict) bad.push('stage 3 is not a predict stage');
  for (const f of pr.table.fixtures || []) if (f.kind !== 'plaque') bad.push(`stage 3 (predict) shows an instrument (${f.kind})`);
  for (const p of pr.table.pieces || []) if (p.kind === 'cjar') bad.push('stage 3 (predict) shows a sample jar');

  // The unlabelled samples carry no name or amount.
  q.STAGES[7].table.pieces.forEach(p => { if (!/^Sample [ABC]$/.test(p.label) || p.props.shown) bad.push(`stage 8: jar ${p.id} shows what it holds`); });

  // No plate, jar or dial prints a stage's answer.
  const answers = { 6: ['119.7'] };
  q.STAGES.forEach((st, i) => {
    const printed = [];
    for (const f of st.table.fixtures || []) {
      if (f.kind === 'plaque') printed.push(...f.props.lines);
      for (const d of Object.values(f.dials || {})) printed.push(...(d.labels || []));
    }
    for (const p of st.table.pieces || []) { if (p.props?.shown) printed.push(p.props.shown); printed.push(p.label); }
    for (const a of answers[i + 1] || []) for (const line of printed) if (line.includes(a)) bad.push(`stage ${i + 1}: "${line}" prints the answer ${a}`);
  });

  // Every miss is refused with a reason that names what the table shows and carries no method, and never the answer.
  q.MISSES.forEach((script, i) => {
    if (!script.length) return;
    const r = q.STAGES[i].check(q.stateFor(i, script));
    if (r.ok) bad.push(`stage ${i + 1}: its miss passes`);
    else if (!r.msg || r.notYet) bad.push(`stage ${i + 1}: its miss is not refused with a reason`);
    else {
      if (METHOD.test(r.msg)) bad.push(`stage ${i + 1}: a refusal gives the method ("${r.msg}")`);
      if (i === 5 && r.msg.includes('119.7')) bad.push(`stage 6: a refusal carries the answer ("${r.msg}")`);
    }
  });

  return bad;
}
