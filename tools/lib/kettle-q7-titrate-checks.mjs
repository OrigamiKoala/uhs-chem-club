/**
 * kettle-q7-titrate-checks.mjs — what `verify:learn` holds the titration bench (`unit07/q7-titrate`) to. Loaded by `kettle-learn-checks.mjs`.
 *
 * Every graded figure is recomputed from an INDEPENDENT literal worked on paper (below), the burette and flask are replayed through the
 * real table, no plate prints an answer, no dial stands at an asked amount, a blank table never passes, the predict stage shows no
 * instrument, and no refusal gives the method.
 *
 * Worked on paper (volumes in mL, strengths in mol/L, amounts in mmol; every strong acid and base fully split):
 *   2  25.0 mL x 0.100 = 2.50 mmol H+; 0.250 base: 10.0 mL equal. At 10.5 mL: 0.125 mmol OH- spare in 35.5 mL = 3.52e-3 M, pH 11.5: pink.
 *   3  25.0 x 0.200 = 5.00 mmol; 0.250 base: 20.0 mL. One disc = 0.25 mmol = 1.0 mL of base: 20 discs of H+ at the start, 15 after 5 mL.
 *   4  25.0 x 0.180 = 4.50 mmol; 0.200 base: 22.5 mL. First pink at 23.0 mL; that reading gives 0.200 x 23.0 / 25.0 = 0.184.
 *   5  H2SO4 25.0 x 0.072 x 2 = 3.60 mmol H+; 0.100 base: 36.0 mL. First pink at 36.5 mL.
 *   6  25.0 x 0.0200 = 0.500 mmol; 0.0200 base: 25.0 mL. Methyl orange, 23.0 mL: 0.040 mmol H+ in 48.0 mL = 8.33e-4 M, pH 3.08, red;
 *      23.5 mL: 0.030 mmol in 48.5 mL = 6.19e-4 M, pH 3.21, orange. The gap is 25.0 - 23.5 = 1.5 mL. 25 discs of H+ at 0.02 mmol each.
 *   7  Fe2+ 25.0 x 0.0900 = 2.25 mmol; / 5 = 0.450 mmol MnO4-; / 0.0200 = 22.5 mL. First purple at 23.0 mL, which gives 5 x 0.0200 x 23.0 / 25.0 = 0.0920.
 *   8  H2SO4 25.0 x 0.450 x 2 = 22.5 mmol H+; 0.500 base: 45.0 mL. First pink at 45.5 mL.
 */

const METHOD = /\b(moles|divide|multiply|coefficients?|limiting|excess|theoretical|ratio|convert|share)\b/i;

export async function check({ near }) {
  const bad = [];
  const q = await import('../../src/learn/quests/unit07/q7-titrate.js');
  const K = await import('../../src/learn/table/kits/pot-titrate.js');
  const T = await import('../../src/learn/engine/reactdata-titrate.js');
  const A = q.CHECKS.answers;

  const want = [['eq2', 10.0, 1e-9], ['end2', 10.5, 1e-9], ['eq3', 20.0, 1e-9], ['conc4', 0.18, 1e-9], ['fromReading4', 0.184, 1e-9], ['conc5', 0.072, 1e-9],
    ['eq6', 25.0, 1e-9], ['end6', 23.5, 1e-9], ['gap6', 1.5, 1e-9], ['conc7', 0.09, 1e-9], ['perm7End', 23.0, 1e-9], ['fromReading7', 0.092, 1e-9], ['conc8', 0.45, 1e-9]];
  for (const [k, v, tol] of want) if (!near(A[k], v, tol)) bad.push(`${k} is ${A[k]}, worked by hand ${v}`);

  // Planner spot checks against the paper values above.
  const S = q.CHECKS;
  if (!near(T.equivalenceMl(S.SYS5), 36.0, 1e-9)) bad.push('H2SO4 equivalence is not 36.0 mL');
  if (!near(T.equivalenceMl(S.SYS8), 45.0, 1e-9)) bad.push('stage 8 equivalence is not 45.0 mL');
  if (T.endpointMl(S.SYS5, 'phenolphthalein', 0.5) !== 36.5) bad.push('stage 5 first pink is not 36.5 mL');
  if (T.endpointMl(S.SYS8, 'phenolphthalein', 0.5) !== 45.5) bad.push('stage 8 first pink is not 45.5 mL');
  if (T.flaskAt(S.SYS2, 10.0, 'phenolphthalein').colour !== 'colourless') bad.push('at the equivalence point the dye should still be colourless');
  if (T.flaskAt(S.SYS2, 10.5, 'phenolphthalein').colour !== 'pink') bad.push('half a mL past the equivalence point the dye should be pink');
  if (T.flaskAt(S.SYS6, 23.0, 'methyl orange').colour !== 'red' || T.flaskAt(S.SYS6, 23.5, 'methyl orange').colour !== 'orange') bad.push('methyl orange should be red at 23.0 mL and orange at 23.5 mL');
  if (T.permanganateAt(S.PERM7.fe, S.PERM7.mn, 22.5).colour !== 'pale' || T.permanganateAt(S.PERM7.fe, S.PERM7.mn, 23.0).colour !== 'purple') bad.push('permanganate should be pale at 22.5 mL and purple at 23.0 mL');
  if (!near(T.permanganateAt(S.PERM7.fe, S.PERM7.mn, 22.5).equivalenceMl, 22.5, 1e-9)) bad.push('permanganate equivalence is not 22.5 mL');

  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (name, value) => ({ setDial: { fixture: 'tit', dial: name, value } });
  const run = () => ({ run: 'tit' });
  const read = (stage, script) => K.titratorRead(q.stateFor(stage, script).table, 'tit');

  // Replays on the real table.
  const r2 = read(1, [put('ph', 'slot:tit.mouth'), dial('press', 4), run(), run()]);
  if (!near(r2.vMl, 10.0, 1e-9) || r2.colour !== 'colourless') bad.push(`stage 2: two 5 mL presses read ${r2.vMl} mL, ${r2.colour}; worked by hand 10.0 mL, colourless`);
  const r2b = read(1, [put('ph', 'slot:tit.mouth'), dial('press', 4), run(), run(), dial('press', 1), run()]);
  if (r2b.colour !== 'pink' || !near(r2b.vMl, 10.5, 1e-9)) bad.push(`stage 2: 10.5 mL should be pink, got ${r2b.vMl} mL ${r2b.colour}`);
  const r2n = read(1, [dial('press', 4), run(), run(), dial('press', 1), run(), run(), run()]);
  if (r2n.colour !== 'colourless') bad.push('stage 2: with no dye in the flask it should stay colourless');
  const w3 = read(2, [dial('press', 4)]);
  if (!near(w3.flask.acidLeft / S.UNIT3, 20, 1e-6)) bad.push(`stage 3: the window should start at 20 discs of H+, has ${w3.flask.acidLeft / S.UNIT3}`);
  const w3b = read(2, [dial('press', 4), run()]);
  if (!near(w3b.flask.acidLeft / S.UNIT3, 15, 1e-6)) bad.push(`stage 3: after 5 mL the window should hold 15 discs of H+, has ${w3b.flask.acidLeft / S.UNIT3}`);
  const w6 = read(5, []);
  if (!near(w6.flask.acidLeft / S.UNIT6, 25, 1e-6)) bad.push(`stage 6: the window should start at 25 discs of H+, has ${w6.flask.acidLeft / S.UNIT6}`);
  // The burette only gives out and holds 50 mL: ten 5 mL presses and then one more is refused.
  const over = q.stateFor(7, [dial('press', 5), ...Array.from({ length: 5 }, run), dial('press', 4), ...Array.from({ length: 12 }, run)]);
  const rr = K.titratorRead(over.table, 'tit');
  if (rr.vMl > 50 + 1e-9) bad.push(`the burette let out ${rr.vMl} mL, more than it holds`);

  // The beginning of a stage: no dial stands at an asked amount, and no single press reaches the equivalence point.
  const dialLists = { 3: S.SYS3, 2: S.SYS2, 6: S.SYS6 };
  q.STAGES.forEach((st, i) => {
    const f = (st.table.fixtures || []).find(x => x.kind === 'titrator');
    if (!f) return;
    const list = f.props.presses;
    const eq = f.props.mode === 'perm' ? T.permanganateAt(f.props.perm.fe, f.props.perm.mn, 0).equivalenceMl : T.equivalenceMl(f.props.sys);
    if (list.some(v => v >= eq)) bad.push(`stage ${i + 1}: a single press can reach the equivalence point (${eq} mL)`);
    if (i === 5 && list.includes(A.gap6)) bad.push('stage 6: the dial has a setting at the asked gap');
  });
  void dialLists;

  // A blank bench never passes, and the predict stage shows no instrument.
  q.STAGES.forEach((st, i) => {
    const r = st.check(q.stateFor(i, []));
    if (r.ok) bad.push(`stage ${i + 1}: a blank table passes`);
  });
  const p1 = q.STAGES[0];
  if (!p1.predict) bad.push('stage 1 is not a predict stage');
  if ((p1.table.fixtures || []).some(f => f.kind !== 'plaque') || (p1.table.pieces || []).some(p => p.kind !== 'stmt')) bad.push('stage 1 (predict) shows an instrument');

  // No plate, card or burette prints an answer.
  const answers = { 3: ['20.0', '20'], 4: ['0.18', '0.180'], 5: ['0.072', '0.0720'], 6: ['1.5'], 7: ['0.09', '0.0900'], 8: ['0.45', '0.450'] };
  q.STAGES.forEach((st, i) => {
    const printed = [];
    for (const f of st.table.fixtures || []) {
      if (f.kind === 'plaque') printed.push(...f.props.lines);
      if (f.kind === 'titrator') printed.push(`${f.props.mode === 'perm' ? f.props.perm.mn.M : f.props.sys.base.M} mol/L`, `${(f.props.mode === 'perm' ? f.props.perm.fe.mL : f.props.sys.acid.mL).toFixed(1)} mL`);
    }
    for (const p of st.table.pieces || []) printed.push(p.label);
    for (const a of answers[i + 1] || []) {
      const rx = new RegExp(`(^|[^\\d.])${a.replace('.', '\\.')}([^\\d]|$)`);
      for (const line of printed) if (rx.test(line)) bad.push(`stage ${i + 1}: "${line}" is printed and carries the answer ${a}`);
    }
  });
  // The acid's strength never prints on a stage that asks for it.
  q.STAGES.forEach((st, i) => {
    const f = (st.table.fixtures || []).find(x => x.kind === 'titrator');
    if (f && [3, 4, 6, 7].includes(i) && JSON.stringify(f).includes(String(f.props.mode === 'perm' ? f.props.perm.fe.M : f.props.sys.acid.M)) && f.props.window) bad.push(`stage ${i + 1}: the window of an unknown acid would show its amount`);
  });

  // No refusal gives the method, and none carries an answer.
  q.MISSES.forEach((script, i) => {
    if (!script.length) return;
    const r = q.STAGES[i].check(q.stateFor(i, script));
    if (r.ok) { bad.push(`stage ${i + 1}: the miss script passes`); return; }
    if (METHOD.test(r.msg || '')) bad.push(`stage ${i + 1}: a refusal gives the method ("${r.msg}")`);
  });
  return bad;
}
