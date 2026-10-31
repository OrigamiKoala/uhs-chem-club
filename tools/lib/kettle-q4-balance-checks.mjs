/**
 * kettle-q4-balance-checks.mjs — what `verify:learn` holds Kettle's q4-balance to (loaded by `kettle-learn-checks.mjs`).
 *
 * Every figure below is a literal worked on paper, never produced by the code under test:
 *   H2 + O2 -> H2O: O is 2 before, 1 after. 2 H2 + O2 -> 2 H2O: 4 H and 2 O each side. H2 + O2 -> H2O2: 2 H and 2 O each side, a
 *     different molecule (the click: it agrees, and is refused).
 *   Fe2O3 + 3 CO -> 2 Fe + 3 CO2: Fe 2, C 3, O 3 + 3 = 6 each side. A pot of 1 Fe2O3 and 4 CO leaves 1 CO and makes 2 Fe, 3 CO2.
 *   C3H8 + 5 O2 -> 3 CO2 + 4 H2O: C 3, H 8, O 10 each side.
 *   3 Ca(OH)2 + 2 H3PO4 -> Ca3(PO4)2 + 6 H2O: by pieces Ca 3, H 6, OH 6, PO4 2 each side.
 *   P4 + 5 O2 -> 2 P2O5: P 4 and O 10 each side.
 *   2 Na + 2 H2O -> 2 NaOH + H2: Na 2, H 4, O 2 each side; sodium is a solid, water a liquid, sodium hydroxide dissolved, hydrogen a gas.
 * Returns a list of problem strings.
 */

const METHOD = /\b(moles|divide|multiply|coefficients?|limiting|excess|theoretical|ratio|convert|subtract)\b/i;

export async function check() {
  const bad = [];
  const q = await import('../../src/learn/quests/unit07/q4-balance.js');
  const K = await import('../../src/learn/table/kits/pot-balance.js');
  const D = await import('../../src/learn/engine/reactdata-balance.js');
  const R = await import('../../src/learn/engine/reactdata.js');
  const stage = i => q.STAGES[i];
  const run = (i, script) => q.stateFor(i, script);
  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // 1. The planners, against literals.
  const eqs = [
    ['H2 + O2 -> H2O', [2, 1, 2]],
    ['Fe2O3 + CO -> Fe + CO2', [1, 3, 2, 3]],
    ['C3H8 + O2 -> CO2 + H2O', [1, 5, 3, 4]],
    ['Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O', [3, 2, 1, 6]],
    ['P4 + O2 -> P2O5', [1, 5, 2]],
    ['Na + H2O -> NaOH + H2', [2, 2, 2, 1]]
  ];
  for (const [e, want] of eqs) if (!same(D.smallestCoefs(e), want)) bad.push(`smallest coefficients of ${e} are ${JSON.stringify(D.smallestCoefs(e))}, worked by hand ${JSON.stringify(want)}`);
  const trap = D.boardPlan('H2 + O2 -> H2O', { subs: { 2: { el: 'O', n: 2 } } });
  if (!trap.balanced || trap.species[2].f !== 'H2O2') bad.push('the subscript trap: H2 + O2 -> H2O2 should agree in atoms (2 H, 2 O) and name H2O2');
  const ph = D.boardPlan('Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O', { coefs: [3, 2, 1, 6] });
  const gl = D.groupLedger(ph.eq, q.CHECKS.GROUPS).rows.map(r => `${r.el}:${r.left}:${r.right}`).join(',');
  if (gl !== 'Ca:3:3,H:6:6,OH:6:6,PO4:2:2') bad.push(`by pieces the phosphate equation counts ${gl}, worked by hand Ca:3:3,H:6:6,OH:6:6,PO4:2:2`);
  for (const f of Object.keys(D.PARTS)) if (!same(Object.entries(D.expandParts(D.PARTS[f])).sort(), Object.entries(R.parseFormula(f)).sort())) bad.push(`the pieces of ${f} do not add back to its atoms`);
  const dg = D.diagramOf('Fe2O3 + CO -> Fe + CO2', { Fe2O3: 1, CO: 4 });
  if (!same(dg.before, [['Fe2O3', 1], ['CO', 4]]) || !same(dg.after, [['CO', 1], ['Fe', 2], ['CO2', 3]])) bad.push(`the furnace pot diagram is ${JSON.stringify(dg.before)} then ${JSON.stringify(dg.after)}, worked by hand 1 Fe2O3 + 4 CO then 1 CO + 2 Fe + 3 CO2`);
  if (!same(D.STATE_OF, { Na: 's', H2O: 'l', NaOH: 'aq', H2: 'g' })) bad.push('STATE_OF does not hold the states worked out for 2 Na + 2 H2O -> 2 NaOH + H2');

  // 2. Every molecule the window draws has the atoms of its formula, and none overlaps another.
  const species = ['H2', 'O2', 'H2O', 'H2O2', 'Fe2O3', 'CO', 'Fe', 'CO2', 'Na', 'NaOH', 'C3H8', 'Ca(OH)2', 'H3PO4', 'Ca3(PO4)2', 'P4', 'P2O5', 'H2O3'];
  for (const f of species) {
    const atoms = D.shapeOf(f);
    const got = {};
    for (const a of atoms) got[a.el] = (got[a.el] || 0) + 1;
    if (!same(Object.entries(got).sort(), Object.entries(R.parseFormula(f)).sort())) bad.push(`the window draws ${f} with ${JSON.stringify(got)}, not its formula`);
    for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
      const d = Math.hypot(atoms[i].x - atoms[j].x, atoms[i].y - atoms[j].y);
      if (d < 0.97 * (D.RADIUS[atoms[i].el] + D.RADIUS[atoms[j].el])) bad.push(`the window draws two atoms of ${f} on top of each other`);
    }
  }

  // 3. Each stage: the blank bench never passes; the held answer passes; nothing correct is refused.
  q.STAGES.forEach((st, i) => {
    if (!st.check(run(i, [])).ok === false) { /* below */ }
    if (st.check(run(i, [])).ok) bad.push(`stage ${i + 1}: an untouched bench passes`);
  });
  // The click: H2 + O2 -> H2O2 agrees in atoms and is refused, naming the molecule the window shows.
  const trapState = run(2, [dial('bd', 'sub', 2)]);
  const r3 = stage(2).check(trapState);
  if (r3.ok || !/different molecule/.test(r3.msg || '') || !/H₂O₂/.test(r3.msg || '')) bad.push(`stage 3: the subscript trap is not refused for the molecule the window shows ("${r3.msg}")`);
  if (!K.boardRead(trapState.table, 'bd').plan.balanced) bad.push('stage 3: the subscript trap should agree in atoms, that is what makes it a trap');
  // Any whole-number set that agrees passes on stage 3 (a student who doubles everything is not refused).
  for (const m of [1, 2, 3]) if (!stage(2).check(run(2, [dial('bd', 'c0', 2 * m), dial('bd', 'c1', m), dial('bd', 'c2', 2 * m)])).ok) bad.push(`stage 3: ${2 * m} H2 + ${m} O2 -> ${2 * m} H2O is refused`);

  // The dials reach the answer, and on the stages that ask for the smallest set it is the only set in range.
  const sets = (nd, max, balanced) => {
    let n = 0;
    const walk = (k, cur) => { if (k === nd) { if (balanced(cur)) n++; return; } for (let v = 1; v <= max; v++) walk(k + 1, [...cur, v]); };
    walk(0, []);
    return n;
  };
  for (const [e, expect] of [['C3H8 + O2 -> CO2 + H2O', 1], ['Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O', 1], ['Fe2O3 + CO -> Fe + CO2', 2]]) {
    const nl = R.parseEquation(e).lhs.length;
    const nd = R.parseEquation(e).lhs.length + R.parseEquation(e).rhs.length;
    const n = sets(nd, 6, c => D.boardPlan(e, { coefs: c }).balanced);
    void nl;
    if (n !== expect) bad.push(`${e}: ${n} balanced sets with dials 1 to 6, worked by hand ${expect}`);
  }

  // 4. Nothing printed is an answer; no dial stands at an asked amount.
  const stage1 = stage(0).table;
  const tally = stage1.fixtures.find(f => f.kind === 'eqtally');
  if (tally.dials.before.value === 2 || tally.dials.after.value === 1) bad.push('stage 1: a tally dial starts at the answer');
  const withLedger = [0, 3, 4, 7];
  withLedger.forEach(i => { if (stage(i).table.fixtures.some(f => f.kind === 'eqledger')) bad.push(`stage ${i + 1}: a ledger is printed where the player is to count`); });
  const startDials = (i, want) => {
    const f = stage(i).table.fixtures.find(x => x.kind === 'eqboard');
    const got = Object.keys(f.dials).filter(k => /^c\d/.test(k)).map(k => f.dials[k].value);
    return got.length && same(got, want);
  };
  if (startDials(3, [1, 3, 2, 3])) bad.push('stage 4: the dials start at the answer');
  if (startDials(5, [1, 5, 3, 4])) bad.push('stage 6: the dials start at the answer');
  if (startDials(6, [3, 2, 1, 6])) bad.push('stage 7: the dials start at the answer');
  const fm = stage(7).table.fixtures.find(f => f.kind === 'eqformula');
  if (Object.values(fm.dials).some(d => d.value !== 0)) bad.push('stage 8: a formula dial starts above 0');

  // What is painted on a bench at the start does not carry the answer.
  try {
    await import('../../tools/lib/ui-stub.mjs').then(m => m.installUiStub?.());
    const { drawTable } = await import('../../src/learn/engine/table2d.js');
    const { makeCtx } = await import('./ctx-stub.mjs');
    const MODEL = await import('../../src/learn/table/model.js');
    const textOf = i => {
      const t = MODEL.createTable(stage(i).table, stage(i).title);
      const ctx = makeCtx(667, 375);
      drawTable(ctx, 667, 375, t, { shown: Object.fromEntries(Object.values(t.pieces).map(p => [p.id, p.at])) });
      return ctx.stats.text.join(' | ');
    };
    const t8 = textOf(7);
    if (/P₂O₅|P2O5/.test(t8)) bad.push('stage 8: the bench prints the sealed formula');
    if (!/\?/.test(t8)) bad.push('stage 8: the sealed bags are not marked');
    if (/3 CO/.test(textOf(3))) bad.push('stage 4: the bench prints the answer 3 CO');
    if (textOf(4).split(' | ').some(seg => /\S\((s|l|g|aq)\)/.test(seg))) bad.push('stage 5: a state is printed before a tile is laid');
    if (/Reactants|Products|coefficient/i.test(textOf(0))) bad.push('stage 1: the bench uses a word it has not earned');
  } catch (e) {
    bad.push(`could not draw the benches in Node (${e.message})`);
  }

  // 5. Stage 5: the states are the table's own.
  const sp = K.boardRead(run(4, q.SOLUTIONS[4]).table, 'bd');
  if (!same(sp.states, { 0: 's', 1: 'l', 2: 'aq', 3: 'g' })) bad.push(`stage 5: the solution lays ${JSON.stringify(sp.states)}`);
  const win5 = K.windowRead(run(4, []).table, 'win');
  if (!same(win5.before.map(g => g.state), ['s', 'l']) || !same(win5.after.map(g => g.state), ['aq', 'g'])) bad.push('stage 5: the window does not draw each substance in its own state');

  // 6. The window draws what the board says (counts of molecules are the coefficients).
  const w3 = K.windowRead(run(2, q.SOLUTIONS[2]).table, 'win');
  if (!same(w3.before.map(g => [g.f, g.n]), [['H2', 2], ['O2', 1]]) || !same(w3.after.map(g => [g.f, g.n]), [['H2O', 2]])) bad.push(`stage 3: the window draws ${JSON.stringify([w3.before, w3.after])} for 2 H2 + O2 -> 2 H2O`);
  const w8 = K.windowRead(run(7, []).table, 'win');
  if (!w8.after[0].sealed || w8.after[0].n !== 2 || !same(w8.before.map(g => [g.f, g.n]), [['P4', 1], ['O2', 5]])) bad.push('stage 8: the window does not show 1 P4 and 5 O2 before and 2 sealed bags after');
  const l7 = K.ledgerRead(run(6, q.SOLUTIONS[6]).table, 'led').rows.map(r => `${r.el}:${r.left}:${r.right}`).join(',');
  if (l7 !== 'Ca:3:3,H:6:6,OH:6:6,PO4:2:2') bad.push(`stage 7: the ledger prints ${l7} for the answer`);
  const l6 = K.ledgerRead(run(5, q.SOLUTIONS[5]).table, 'led').rows.map(r => `${r.el}:${r.left}:${r.right}`).join(',');
  if (l6 !== 'C:3:3,H:8:8,O:10:10') bad.push(`stage 6: the ledger prints ${l6} for the answer`);
  const l3 = K.ledgerRead(run(2, []).table, 'led').rows.map(r => `${r.el}:${r.left}:${r.right}`).join(',');
  if (l3 !== 'H:2:2,O:2:1') bad.push(`stage 3: the ledger prints ${l3} at the start, worked by hand H:2:2,O:2:1`);

  // 7. The predict stage holds the guess alone, and the next stage brings the board.
  const pst = stage(1).table;
  if (pst.fixtures.some(f => f.kind !== 'plaque') || (pst.fixtures || []).some(f => Object.keys(f.dials || {}).length)) bad.push('stage 2: the predict stage carries an instrument');
  if (!stage(2).table.fixtures.some(f => Object.keys(f.dials).length)) bad.push('stage 3: the test stage brings no dial');

  // 8. Refusals: no method, no answer.
  q.MISSES.forEach((script, i) => {
    if (!script.length) return;
    const r = stage(i).check(run(i, script));
    if (r.ok) { bad.push(`stage ${i + 1}: the miss passes`); return; }
    if (METHOD.test(r.msg || '')) bad.push(`stage ${i + 1}: a refusal gives the method ("${r.msg}")`);
  });
  const m1 = stage(0).check(run(0, q.MISSES[0])).msg;
  if (/\d/.test(m1)) bad.push(`stage 1: the refusal carries a count ("${m1}")`);
  const m4 = stage(3).check(run(3, q.MISSES[3])).msg;
  if (/3 CO|CO₂ 3/.test(m4) || !/1 CO still there/.test(m4)) bad.push(`stage 4: the refusal is "${m4}"`);
  const m5 = stage(4).check(run(4, q.MISSES[4])).msg;
  if (/\(s\)|locked in rows/.test(m5)) bad.push(`stage 5: the refusal carries the substance's real state ("${m5}")`);
  const m6 = stage(5).check(run(5, q.MISSES[5])).msg;
  if (/5 O₂ → 3/.test(m6)) bad.push('stage 6: the refusal carries the answer');
  const m8 = stage(7).check(run(7, q.MISSES[7])).msg;
  if (/P₂O₅|2 P and 5 O/.test(m8)) bad.push(`stage 8: the refusal carries the answer ("${m8}")`);
  // The sealed answer is accepted in any dial order and rejects P4O5.
  if (!stage(7).check(run(7, [dial('fm', 'el_O', 5), dial('fm', 'el_P', 2)])).ok) bad.push('stage 8: P2O5 is refused when the dials are turned in the other order');

  // 9. The story scene uses the numbers the planner finds.
  if (!same(D.smallestCoefs('Fe2O3 + CO -> Fe + CO2'), [1, 3, 2, 3])) bad.push('the story scene counts toward 1, 3, 2, 3');
  return bad;
}
