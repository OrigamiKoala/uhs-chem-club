/**
 * kettle-q5-ionic-checks.mjs — what `verify:learn` holds Kettle's `q5-ionic` to. Loaded by `kettle-learn-checks.mjs`.
 *
 * Every expected value is a literal worked on paper from the AP solubility rules and the formulas (never from the code under test):
 *   Pb(NO3)2 + 2 KI -> PbI2 + 2 KNO3: jars give Pb2+ 1, NO3- 2 | K+ 2, I- 2 (7 ions); the water keeps K+ 2, NO3- 2 (4 ions).
 *   AgNO3 + NaCl -> AgCl: 4 ions, 2 left.  BaCl2 + Na2SO4 -> BaSO4: Ba 1, Cl 2 | Na 2, SO4 1 (6), 4 left.
 *   FeCl3 + 3 NaOH -> Fe(OH)3: Fe 1, Cl 3 | Na 3, OH 3 (10), 6 left.   HCl + NaOH -> H2O: 4 ions, 2 left, one water.
 *   Pb(NO3)2 + K2SO4: Pb 1, NO3 2 | K 2, SO4 1 -> PbSO4; NH4Cl + KNO3 and (NH4)2SO4 + NaCl: nothing forms.
 *   AgNO3 + KBr -> AgBr (the sealed pair): before Ag 1, NO3 1, K 1, Br 1; after K 1, NO3 1.
 */

const METHOD = /\b(moles|divide|multiply|coefficients?|limiting|excess|theoretical|ratio|convert|spectators?|net ionic|solubility|rules?|always soluble|insoluble|precipitates?)\b/i;

export async function check({ near }) {
  const bad = [];
  const Q = await import('../../src/learn/quests/unit07/q5-ionic.js');
  const D = await import('../../src/learn/engine/reactdata-ionic.js');
  const K = await import('../../src/learn/table/kits/pot.js');
  const P = await import('../../src/learn/table/kits/pot-ionic.js');
  const S = (cat, an) => ({ cat, an });
  const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

  const cases = [
    ['Pb(NO3)2 + KI', S('Pb2', 'NO3'), S('K', 'I'), { Pb2: 1, NO3: 2, K: 2, I: 2 }, { NO3: 2, K: 2 }, 'PbI2', 7, 4],
    ['AgNO3 + NaCl', S('Ag', 'NO3'), S('Na', 'Cl'), { Ag: 1, NO3: 1, Na: 1, Cl: 1 }, { NO3: 1, Na: 1 }, 'AgCl', 4, 2],
    ['BaCl2 + Na2SO4', S('Ba', 'Cl'), S('Na', 'SO4'), { Ba: 1, Cl: 2, Na: 2, SO4: 1 }, { Cl: 2, Na: 2 }, 'BaSO4', 6, 4],
    ['FeCl3 + NaOH', S('Fe3', 'Cl'), S('Na', 'OH'), { Fe3: 1, Cl: 3, Na: 3, OH: 3 }, { Cl: 3, Na: 3 }, 'Fe(OH)3', 10, 6],
    ['Pb(NO3)2 + K2SO4', S('Pb2', 'NO3'), S('K', 'SO4'), { Pb2: 1, NO3: 2, K: 2, SO4: 1 }, { NO3: 2, K: 2 }, 'PbSO4', 6, 4],
    ['NH4Cl + KNO3', S('NH4', 'Cl'), S('K', 'NO3'), { NH4: 1, Cl: 1, K: 1, NO3: 1 }, { NH4: 1, Cl: 1, K: 1, NO3: 1 }, null, 4, 4],
    ['(NH4)2SO4 + NaCl', S('NH4', 'SO4'), S('Na', 'Cl'), { NH4: 2, SO4: 1, Na: 1, Cl: 1 }, { NH4: 2, SO4: 1, Na: 1, Cl: 1 }, null, 5, 5],
    ['HCl + NaOH', S('H', 'Cl'), S('Na', 'OH'), { H: 1, Cl: 1, Na: 1, OH: 1 }, { Cl: 1, Na: 1 }, null, 4, 2],
    ['AgNO3 + KBr', S('Ag', 'NO3'), S('K', 'Br'), { Ag: 1, NO3: 1, K: 1, Br: 1 }, { NO3: 1, K: 1 }, 'AgBr', 4, 2]
  ];
  for (const [name, A, B, before, after, solid, l0, l1] of cases) {
    const o = D.mixOutcome(A, B);
    if (!same(o.before, before)) bad.push(`${name}: ions in the jars ${JSON.stringify(o.before)}, worked by hand ${JSON.stringify(before)}`);
    if (!same(o.after, after)) bad.push(`${name}: ions left in the water ${JSON.stringify(o.after)}, worked by hand ${JSON.stringify(after)}`);
    if ((o.solid?.formula ?? null) !== solid) bad.push(`${name}: solid ${o.solid?.formula}, worked by hand ${solid}`);
    if (o.lamp.before !== l0 || o.lamp.after !== l1) bad.push(`${name}: lamp counts ${o.lamp.before}/${o.lamp.after}, worked by hand ${l0}/${l1}`);
    // A jar's ions must fit the half of the window it is drawn in (6 discs), and the water panel (18).
    const half = n => (n[0] <= 6 && n[1] <= 6);
    const sa = D.solution(A.cat, A.an); const sb = D.solution(B.cat, B.an);
    if (!half([o.units.a * (sa.nCat + sa.nAn), o.units.b * (sb.nCat + sb.nAn)])) bad.push(`${name}: a jar has more ions than its half of the window can draw`);
    if (total(o.after) > 18) bad.push(`${name}: more ions in the water than the window can draw`);
  }
  function total(c) { return Object.values(c).reduce((a, b) => a + b, 0); }

  // Net ionic equations as chips are counted: Pb2+ 1 + I- 2 -> PbI2; H+ 1 + OH- 1 -> H2O.
  const n1 = D.netIonic(S('Pb2', 'NO3'), S('K', 'I'));
  if (!same(n1.ions, { Pb2: 1, I: 2 }) || n1.product !== 'PbI2') bad.push(`net ionic of Pb/I ${JSON.stringify(n1)}`);
  const n2 = D.netIonic(S('H', 'Cl'), S('Na', 'OH'));
  if (!same(n2.ions, { H: 1, OH: 1 }) || n2.product !== 'H2O') bad.push(`net ionic of acid and base ${JSON.stringify(n2)}`);
  if (D.netIonic(S('NH4', 'Cl'), S('K', 'NO3')) !== null) bad.push('a pair that does not react has a net ionic equation');

  // The ions that stayed in every one of the four mixtures: Na+, K+, NH4+, NO3- (the AP's always-soluble four).
  const stayed = [...Q.CHECKS.answers.stayed].sort().join(',');
  if (stayed !== 'K,NH4,NO3,Na') bad.push(`stage 6: the ions that never left the water are ${stayed}, worked by hand K,NH4,NO3,Na`);
  const leftOnce = [...Q.CHECKS.answers.leftOnce].sort().join(',');
  if (leftOnce !== 'Ag,Cl,Pb2,SO4') bad.push(`stage 6: the ions that left the water once are ${leftOnce}, worked by hand Ag,Cl,Pb2,SO4`);

  // A pair's dial never has two mixtures alike, and Cl- and SO4 2- each stay in the water in at least one mixture (so the stage is not a 'halides never' rule).
  const stays = id => Q.CHECKS.FOUR.some(([A, B]) => { const o = D.mixOutcome(A, B); return o.before[id] && !o.reacted[id]; });
  for (const id of ['Cl', 'SO4']) if (!stays(id)) bad.push(`stage 6: ${id} never stays in the water in any mixture`);

  // Replay the pot on the real table.
  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const run = id => ({ run: id });
  const pot1 = P.ionPotRead(Q.stateFor(0, [put('pb', 'slot:pot.in1'), put('ki', 'slot:pot.in2')]).table, 'pot');
  if (!pot1.ready || pot1.ran) bad.push('stage 1: seated jars are ready and the pot has not been run');
  const t1 = Q.stateFor(0, [put('pb', 'slot:pot.in1'), put('ki', 'slot:pot.in2'), run('pot'), run('filter')]).table;
  const fr = P.filterRead(t1, 'filter');
  if (!fr.done || fr.solid.formula !== 'PbI2') bad.push('stage 1: the filter did not catch lead(II) iodide');
  const t1b = Q.stateFor(0, [run('filter')]).table;
  if (P.filterRead(t1b, 'filter').done) bad.push('stage 1: a filter with nothing mixed caught a solid');
  const pot3 = P.ionPotRead(Q.stateFor(2, [run('pot')]).table, 'pot');
  if (!pot3.ran || pot3.out.lamp.before !== 7 || pot3.out.lamp.after !== 4) bad.push(`stage 3: the lamp reads ${pot3.out?.lamp.before}/${pot3.out?.lamp.after}, worked by hand 7/4`);
  // A pot with a jar missing refuses to run; a different pair is a different run.
  const pot4 = P.ionPotRead(Q.stateFor(2, [put('pb', 'free:60,58'), run('pot')]).table, 'pot');
  if (pot4.ran) bad.push('stage 3: the pot ran with a seat empty');
  const runs = P.mixesRun(Q.stateFor(5, [dial('pot', 'mix', 2), run('pot')]).table, 'pot');
  if (runs.join() !== 'false,true,false,false') bad.push(`stage 6: the mixtures run are ${runs.join()}, worked by hand false,true,false,false`);

  // Predict stages show no instrument; every blank bench is refused; no plate prints numbers.
  Q.STAGES.forEach((st, i) => {
    const fx = st.table.fixtures || [];
    if (st.predict && fx.length) bad.push(`stage ${i + 1}: a predict stage shows an instrument`);
    if (fx.some(f => f.kind === 'plaque')) bad.push(`stage ${i + 1}: a plate is printed (a figure to copy)`);
    const blank = Q.stateFor(i, []);
    if (!st.predict || true) { const r = st.check(blank); if (r.ok) bad.push(`stage ${i + 1}: a blank bench passes`); }
  });
  if (!(Q.STAGES[1].predict && Q.STAGES[4].predict)) bad.push('stages 2 and 5 are not predict stages');

  // The sealed jars carry no name; the filter and pot stand at the same set-up on every replay.
  const sealed = Q.STAGES[7].table.pieces.filter(p => p.kind === 'sol');
  if (!sealed.length || sealed.some(p => /Ag|K|Br|NO/.test(p.label))) bad.push('stage 8: a sealed jar prints its name');

  // No refusal carries the rule or the method; every miss is refused.
  Q.MISSES.forEach((script, i) => {
    if (!script.length) return;
    const r = Q.STAGES[i].check(Q.stateFor(i, script));
    if (r.ok) bad.push(`stage ${i + 1}: the miss passes`);
    else if (r.msg && METHOD.test(r.msg)) bad.push(`stage ${i + 1}: a refusal gives the rule or the method ("${r.msg}")`);
  });
  void K; void near;
  return bad;
}
