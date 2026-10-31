/**
 * kettle-q8-kinds-checks.mjs — what `verify:learn` holds Kettle's q8-kinds to (loaded by `kettle-learn-checks.mjs`).
 *
 * Every expected value is a literal worked on paper (oxidation numbers by the AP's rules, the kinds of each reaction by reading its
 * equation, the electrons by the change in numbers), never the code under test. The bench is replayed through the real table.
 */

const METHOD = /\b(moles|divide|multiply|coefficients?|limiting|excess|theoretical|ratio|convert|rule|rules)\b/i;

export async function check() {
  const bad = [];
  const q = await import('../../src/learn/quests/unit07/q8-kinds.js');
  const P = await import('../../src/learn/engine/reactdata-kinds.js');
  const R = await import('../../src/learn/engine/reactdata.js');
  const K = await import('../../src/learn/table/kits/pot-kinds.js');
  const same = (what, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`${what}: got ${JSON.stringify(got)}, worked by hand ${JSON.stringify(want)}`); };
  const eq = t => R.parseEquation(t);
  const kinds = t => [...P.kindsFull(eq(t))].sort();

  // Oxidation numbers: MnO4-: Mn + 4(-2) = -1, so +7. NaOH keeps H at +1. NH4Cl: N -3, H +1, Cl -1.
  same('Mn in MnO4-', P.oxNumbers('MnO4', -1).Mn, 7);
  same('C in CO', P.oxNumbers('CO').C, 2);
  same('N in NO3-', P.oxNumbers('NO3', -1).N, 5);
  same('H in NaOH', P.oxNumbers('NaOH').H, 1);
  same('N in NH4Cl', P.oxNumbers('NH4Cl').N, -3);

  // The kinds of each of the eight reactions of the log, read from the equations.
  const log = {
    zn: ['redox'], mg: ['combustion', 'redox', 'synthesis'], acid: ['acid-base'], lime: ['decomposition'],
    ch4: ['combustion', 'redox'], nh3: ['acid-base', 'synthesis'], ore: ['redox'], h2o: ['decomposition', 'redox']
  };
  for (const c of q.CHECKS.S8_CARDS) same(`kinds of ${c.id}`, kinds(c.eq), log[c.id]);
  // The click needs a card in three kinds, and every kind used by at least two cards.
  same('Mg is three kinds', kinds('2 Mg + O2 -> 2 MgO').length, 3);
  for (const k of P.KINDS) if (q.CHECKS.S8_CARDS.filter(c => kinds(c.eq).includes(k)).length < 2) bad.push(`kind ${k} appears on fewer than two cards`);
  // The shapes of stage 1: A join, B split, C neither, D split, E join, F neither.
  same('shapes of stage 1', q.CHECKS.S1_POTS.map(p => P.shapeOf(eq(p.eq))), ['many-to-one', 'one-to-many', 'neither', 'one-to-many', 'many-to-one', 'neither']);
  // The protons of stage 3: A and C only (Mg with HCl is electrons, not a proton).
  same('protons of stage 3', q.CHECKS.S3_POTS.map(p => Boolean(P.protonTransfer(eq(p.eq)))), [true, false, true, false, false]);
  same('proton A', P.protonTransfer(eq('HCl + NaOH -> NaCl + H2O')).donor + '>' + P.protonTransfer(eq('HCl + NaOH -> NaCl + H2O')).acceptor, 'HCl>NaOH');
  // Electrons: zinc loses 2 as copper(II) gains 2; the ore: 2 Fe gain 3 each, 3 C lose 2 each.
  same('electrons, zinc', P.electronFlow(eq(q.CHECKS.S4_EQ)).total, 2);
  same('electrons, ore', P.electronFlow(eq('Fe2O3 + 3 CO -> 2 Fe + 3 CO2')).total, 6);
  same('no electrons in limestone', P.electronFlow(eq('CaCO3 -> CaO + CO2')), null);
  // Gas tests: oxygen relights, hydrogen pops, CO2 cloudy, water mists; nitrogen answers none.
  same('O2 glowing', P.gasTest('O2', 'glowing').result, 'relights');
  same('H2 lit', P.gasTest('H2', 'lit').result, 'pops');
  same('CO2 limewater', P.gasTest(['CO2', 'H2O'], 'limewater').result, 'cloudy');
  same('burnt methane cold glass', P.gasTest(['CO2', 'H2O'], 'glass').result, 'mist');
  same('N2 answers nothing', ['glowing', 'lit', 'limewater', 'glass'].map(t => P.gasTest('N2', t).result), ['goes out', 'goes out', 'clear', 'dry']);
  same('burn methane', P.burnPlan('CH4').gases, ['CO2', 'H2O']);

  // The asked figure is past everything the window shows, and nothing printed carries it.
  same('Mn answer', q.CHECKS.answers.mn, 7);
  const s5 = q.STAGES[4];
  const win5 = Object.values(s5.table.fixtures).find(f => f.kind === 'kwindow');
  for (const c of win5.props.cases) {
    if (c.species === 'MnO4') bad.push('stage 5: a worked case is the asked species');
    const wr = K.workedRows(c.species, c.charge);
    if (wr.rows.some(r => r.on === 7 || r.sum === 7)) bad.push(`stage 5: worked case ${c.name} prints the answer +7`);
  }
  for (const f of Object.values(s5.table.fixtures)) if (f.kind === 'plaque' && f.props.lines.some(l => /7/.test(l))) bad.push('stage 5: a plate prints the answer');
  // No stage prints an equation that gives the answer to the sort it asks: the cards of stage 8 print equations only, the board readings are raw.
  for (const c of q.STAGES[7].table.pieces) if (/synthesis|decomposition|combustion|acid|redox/i.test(c.label)) bad.push(`stage 8: card ${c.id} names a kind`);

  // The click: the predict stage shows no instrument; a blank bench never passes; a card lit under one kind only is refused.
  const predict = q.STAGES[6];
  if (!predict.predict) bad.push('stage 7 is not a predict stage');
  if ((predict.table.fixtures || []).some(f => f.kind !== 'plaque')) bad.push('stage 7 shows an instrument');
  q.STAGES.forEach((st, i) => { const r = st.check(q.stateFor(i, {})); if (r.ok) bad.push(`stage ${i + 1}: a blank bench passes`); });
  const lit = (i, script) => q.stateFor(i, script);
  const oneKind = lit(7, [{ setDial: { fixture: 'look', dial: 'look', value: 1 } }, { flip: 'mg' }]);
  if (q.STAGES[7].check(oneKind).ok) bad.push('stage 8: lighting Mg under synthesis only passes');
  // Lights are kept per kind: lit under redox, the card is dark under synthesis and lit again when the dial comes back.
  const keep = lit(7, [{ setDial: { fixture: 'look', dial: 'look', value: 5 } }, { flip: 'mg' }, { setDial: { fixture: 'look', dial: 'look', value: 1 } }]);
  same('Mg dark under synthesis', Boolean(keep.table.pieces.mg.props.flipped), false);
  const back = lit(7, [{ setDial: { fixture: 'look', dial: 'look', value: 5 } }, { flip: 'mg' }, { setDial: { fixture: 'look', dial: 'look', value: 1 } }, { setDial: { fixture: 'look', dial: 'look', value: 5 } }]);
  same('Mg lit again under redox', Boolean(back.table.pieces.mg.props.flipped), true);
  same('filed kinds of Mg', [...K.filedKinds(back.table).mg], ['redox']);
  // The rig reads only what has been tried, and hides the gas in an untested jar.
  const rig0 = K.rigRead(lit(5, [{ place: { piece: 'ga', to: 'slot:rig.seat' } }]).table, 'rig');
  same('untested jar shows nothing', Object.values(rig0.shown).filter(Boolean).length, 0);
  const rig1 = K.rigRead(lit(5, [{ place: { piece: 'ga', to: 'slot:rig.seat' } }, { setDial: { fixture: 'rig', dial: 'test', value: 3 } }, { run: 'rig' }]).table, 'rig');
  same('limewater on sample A', rig1.shown.limewater.result, 'cloudy');
  // An empty gas jar cannot be tested, and the burner fills only an empty jar.
  const empty = lit(1, [{ place: { piece: 'gas', to: 'slot:rig.seat' } }, { run: 'rig' }]);
  same('empty jar is not tested', empty.table.recorder.rows.length, 0);

  // No refusal gives the method.
  q.MISSES.forEach((script, i) => {
    if (!script.length) return;
    const r = q.STAGES[i].check(q.stateFor(i, script));
    if (r.ok) bad.push(`stage ${i + 1}: the miss passes`);
    else if (!r.msg) bad.push(`stage ${i + 1}: the miss has no reason`);
    else if (METHOD.test(r.msg)) bad.push(`stage ${i + 1}: a refusal gives the method ("${r.msg}")`);
  });
  return bad;
}
