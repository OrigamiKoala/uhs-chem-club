/**
 * kettle-q2-names-checks.mjs — what `verify:learn` holds Kettle's q2-names bench to (loaded by `kettle-learn-checks.mjs`).
 *
 * Every expected value is a literal worked on paper (charges added by hand, atoms counted from the formula), never produced by the code
 * under test: the smallest neutral groups, the names, the needle's total on each table the stages build, the atoms the window draws, the
 * formula a row of cards spells. The bench is replayed through the real table (`stateFor` scripts); no plaque prints an answer; a blank
 * table never passes; the predict stage shows no instrument; no refusal carries the method or the answer.
 */

/** Words a refusal may not carry: the method a stage asks the player to find. */
const METHOD = /\b(cancel|cancels|brackets?|prefix(es)?|divide|multiply|rule|because|so each|means)\b/i;

export async function check({ near }) {
  const bad = [];
  const q = await import('../../src/learn/quests/unit07/q2-names.js');
  const R = await import('../../src/learn/engine/reactdata.js');
  const N = await import('../../src/learn/engine/reactdata-names.js');
  const K = await import('../../src/learn/table/kits/pot-names.js');
  const A = q.CHECKS.answers;

  // The graded answers against paper: Mg2+ with 2 Cl-; MgO; FeO (Fe2+ against one O2-); Fe2O3 (2 Fe3+ against 3 O2-); Ca(NO3)2; N2O4; the two acids; Fe2(SO4)3.
  const same = (what, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`${what}: got ${JSON.stringify(got)}, worked by hand ${JSON.stringify(want)}`); };
  same('Mg + Cl group', A.mgcl, [1, 2]);
  same('name MgO', A.mgo, 'magnesium oxide');
  same('name FeO', A.feo, 'iron(II) oxide');
  same('name Fe2O3', A.fe2o3, 'iron(III) oxide');
  same('formula calcium nitrate', A.caNo3, 'Ca(NO3)2');
  same('name N2O4', A.n2o4, 'dinitrogen tetroxide');
  same('name HCl', A.hcl, 'hydrochloric acid');
  same('name HNO3', A.hno3, 'nitric acid');
  same('name Fe2(SO4)3', A.sealed, 'iron(III) sulfate');
  same('roman 2', N.romanOf(2), 'II');
  same('roman 3', N.romanOf(3), 'III');
  same('iron charge from -6 over 2', N.metalChargeFrom(-6, 2), 3);
  same('iron charge from -2 over 1', N.metalChargeFrom(-2, 1), 2);
  same('spell Ca(NO3)2', N.spell(['Ca', '(', 'NO₃', ')', '₂']), 'Ca(NO3)2');
  same('spell without brackets', N.spell(['Ca', 'NO₃', '₂']), 'CaNO32');
  same('squash tetraoxide = tetroxide', N.squashName('dinitrogen tetraoxide'), N.squashName('dinitrogen tetroxide'));
  // What a salt breaks into, counted by hand: Ca(NO3)2 is 1 Ca, 2 N, 6 O; Fe2(SO4)3 is 2 Fe, 3 S, 12 O; NaCl is 1 Na, 1 Cl.
  same('atoms of Ca(NO3)2', N.saltInWater('Ca', 'NO3').atoms, { Ca: 1, N: 2, O: 6 });
  same('atoms of Fe2(SO4)3', N.saltInWater('Fe3', 'SO4').atoms, { Fe: 2, S: 3, O: 12 });
  same('pieces of Ca(NO3)2', N.saltInWater('Ca', 'NO3').pieces, [{ ion: 'Ca', count: 1 }, { ion: 'NO3', count: 2 }]);
  // The molecules drawn hold the atoms their formulas say.
  same('N2O4 picture', N.countDrawn(N.moleculeAtoms('N2O4')), { N: 2, O: 4 });
  same('CO2 picture', N.countDrawn(N.moleculeAtoms('CO2')), { C: 1, O: 2 });
  same('CO picture', N.countDrawn(N.moleculeAtoms('CO')), { C: 1, O: 1 });
  // The pictures of the polyatomic ions draw their own atoms: NO3 is 1 N and 3 O; SO4 is 1 S and 4 O; NH4 is 1 N and 4 H.
  same('NO3 atoms', N.countDrawn(N.ionPicture('NO3')), { N: 1, O: 3 });
  same('SO4 atoms', N.countDrawn(N.ionPicture('SO4')), { S: 1, O: 4 });
  same('NH4 atoms', N.countDrawn(N.ionPicture('NH4')), { N: 1, H: 4 });

  const put = (piece, to) => ({ place: { piece, to } });
  const run = id => ({ run: id });
  const read = (stage, script, fid) => K.needleRead(q.stateFor(stage, script).table, fid).charge;

  // The needle on the table, replayed: stage 2 (index 1).
  if (read(1, [put('m1', 'tray:cell'), put('c1', 'tray:cell'), put('c2', 'tray:cell')], 'needle') !== 0) bad.push('stage 2: 1 Mg and 2 Cl do not read 0');
  if (read(1, [put('m1', 'tray:cell'), put('c1', 'tray:cell')], 'needle') !== 1) bad.push('stage 2: 1 Mg and 1 Cl do not read +1');
  if (read(1, [put('m1', 'tray:cell'), put('m2', 'tray:cell'), put('c1', 'tray:cell'), put('c2', 'tray:cell'), put('c3', 'tray:cell'), put('c4', 'tray:cell')], 'needle') !== 0) bad.push('stage 2: 2 Mg and 4 Cl do not read 0');
  if (read(1, [put('m1', 'tray:cell'), put('c1', 'tray:cell'), put('c2', 'tray:cell'), put('c3', 'tray:cell')], 'needle') !== -1) bad.push('stage 2: 1 Mg and 3 Cl do not read -1');
  if (read(1, [], 'needle') !== 0) bad.push('stage 2: an empty cell does not read 0');
  // Stage 4 (index 3): the iron chips print no charge, so each needle adds only the oxide chips: one O2- is -2, three are -6.
  if (read(3, [], 'na') !== -2) bad.push('stage 4: cell A reads other than -2');
  if (read(3, [], 'nb') !== -6) bad.push('stage 4: cell B reads other than -6');
  const t4 = q.stateFor(3, []).table;
  const hidden = Object.values(t4.pieces).filter(p => p.kind === 'ionchip' && p.props.ion.startsWith('Fe'));
  if (hidden.length !== 3 || hidden.some(p => !p.props.hide)) bad.push('stage 4: an iron chip prints its charge, or there are not 3 irons in the two cells');

  // The window (stage 5, index 4): a crate on the seat, the key pressed, then the window has read it.
  const w5 = q.stateFor(4, [put('crb', 'slot:win.seat'), run('win')]).table;
  const r5 = K.windowRead(w5, 'win');
  if (!r5.ran || r5.content?.cat !== 'Ca' || r5.content?.an !== 'NO3') bad.push('stage 5: the window did not read crate B after the key');
  if (K.windowRead(q.stateFor(4, [put('crb', 'slot:win.seat')]).table, 'win').ran) bad.push('stage 5: the window reads before the key is pressed');
  if (q.stateFor(4, [run('win')]).table.recorder.rows.length) bad.push('stage 5: the key reads with no crate on the seat');
  const w8 = K.windowRead(q.stateFor(7, [put('crx', 'slot:win.seat'), run('win')]).table, 'win');
  if (!w8.ran) bad.push('stage 8: the window did not read the unmarked crate');
  if (!(w8.content?.hide || []).includes('Fe3')) bad.push('stage 8: the iron charge is not hidden in the window');

  // Each stage: a blank table never passes; the solution passes; every miss is refused with a reason that carries neither the method nor the answer.
  const answerWords = [
    [], ['magnesium oxide'], ['(II)', '(III)'], ['Ca(NO3)2', 'Ca(NO₃)₂', 'CaNO'], ['dinitrogen tetroxide'], ['hydrochloric', 'nitric'], ['iron(III) sulfate']
  ];
  q.STAGES.forEach((st, i) => {
    const blank = st.check(q.stateFor(i, []));
    if (blank.ok) bad.push(`stage ${i + 1}: a blank table passes`);
    if (!st.check(q.stateFor(i, q.SOLUTIONS[i])).ok) bad.push(`stage ${i + 1}: the solution does not pass`);
    const miss = q.MISSES[i];
    if (miss.length) {
      const r = st.check(q.stateFor(i, miss));
      if (r.ok) bad.push(`stage ${i + 1}: the wrong answer passes`);
      else if (!r.msg) bad.push(`stage ${i + 1}: the wrong answer is refused with no reason`);
      else {
        if (METHOD.test(r.msg)) bad.push(`stage ${i + 1}: a refusal gives the method ("${r.msg}")`);
        for (const a of answerWords[i] || []) if (i !== 3 && r.msg.includes(a)) bad.push(`stage ${i + 1}: a refusal carries the answer "${a}"`);
      }
    }
  });

  // The predict stage holds the guess alone: no runnable or adjustable instrument and no tool.
  {
    const t = q.stateFor(0, []).table;
    if (Object.values(t.fixtures).some(f => !f.noRun || Object.keys(f.dials).length)) bad.push('stage 1: the predict stage has an instrument');
    if (t.tools.length) bad.push('stage 1: the predict stage has a tool');
  }

  // No plaque or crate prints an answer.
  const printedAnswers = [/magnesium oxide/i, /iron\(III\)/i, /Ca\(NO/i, /dinitrogen tetroxide/i, /hydrochloric acid/i, /nitric acid/i, /sulfate.*iron/i];
  q.STAGES.forEach((st, i) => {
    const lines = [];
    for (const f of st.table.fixtures || []) { if (f.kind === 'plaque') lines.push(...f.props.lines); if (f.kind === 'labeler') lines.push(...f.props.words.map(w => w.text)); }
    for (const p of st.table.pieces || []) if (p.props?.shown) lines.push(p.props.shown);
    for (const line of lines) for (const rx of printedAnswers) if (rx.test(line)) bad.push(`stage ${i + 1}: a plaque, label or crate prints "${line}", which is an answer`);
  });
  // The stage-6 example crate must not be the crate to be named, and no label word is the molecule's own name.
  const s6 = q.STAGES[5].table.pieces.find(p => p.id === 'cra');
  if (s6.props.content.formula === q.CHECKS.MOL_B) bad.push('stage 6: the example crate holds the molecule to be named');
  // The needle's tray exists for each gauge.
  for (const [i, st] of q.STAGES.entries()) for (const f of st.table.fixtures || []) if (f.kind === 'ionneedle' && !(st.table.zones.trays || []).some(t => t.id === f.props.tray)) bad.push(`stage ${i + 1}: gauge ${f.id} reads a tray that is not there`);
  // Numbers: no supply of chips is the smallest group (3 Mg and 5 Cl, not 1 and 2), and the numeral cards run I to IV so a subscript is a card.
  const s2 = q.STAGES[1].table.pieces;
  if (s2.filter(p => p.props.ion === 'Mg').length !== 3 || s2.filter(p => p.props.ion === 'Cl').length !== 5) bad.push('stage 2: the supply is not 3 Mg and 5 Cl');
  if (near(0, 1, 0.5)) bad.push('near is broken');
  void R;
  return bad;
}
