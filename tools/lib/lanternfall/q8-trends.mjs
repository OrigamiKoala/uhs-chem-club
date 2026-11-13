/** q8-trends: every graded order is the measured tables', and no instrument prints the property a stage ranks. */
export default async function check(q8, { TABLE, same, holds, rig }) {
  const EL = await import('../../../src/learn/engine/electrons.js');
  const TR = await import('../../../src/learn/table/kits/trends.js');
  const { start, end, run } = rig(q8);
  const symOf = (t, id) => t.pieces[id].props.sym;
  const by = (t, ids, value) => ids.slice().sort((a, b) => value(symOf(t, a)) - value(symOf(t, b)));
  const atoms = t => Object.values(t.pieces).filter(p => p.kind === 'atom');
  const loose = t => atoms(t).filter(p => !p.fixed);
  const kinds = t => Object.values(t.fixtures).map(f => f.kind);

  // 1. the guess
  {
    const t = start(0);
    same(t.prediction.tokens, ['li', 'c', 'same'], 'unit02/q8-trends stage 1 (the guesses)');
    holds(EL.RADIUS.Li > EL.RADIUS.C, 'unit02/q8-trends stage 1: lithium is not the bigger atom');
    same(end(0).prediction.token, 'li', 'unit02/q8-trends stage 1 (the guess the solution makes)');
  }
  // 2. lithium alone is measured; every other card goes in the tray of its nuclear charge less its inner electrons
  {
    const t = start(1);
    const li = TR.springRead(t, 'sp');
    same([li.piece.id, li.z, li.between, li.zeff], ['li', 3, 2, 1], 'unit02/q8-trends stage 2 (the instrument reads lithium)');
    holds(t.pieces.li.fixed, 'unit02/q8-trends stage 2: lithium can be taken out, so another atom can be read off the instrument');
    const e = end(1);
    const trayOf = { 1: 'tray:one', 2: 'tray:two', 3: 'tray:three' };
    for (const p of loose(e)) same(p.zone, trayOf[TR.feelsOf(p.props.sym)], `unit02/q8-trends stage 2 (${p.props.sym})`);
    holds(new Set(loose(e).map(p => TR.feelsOf(p.props.sym))).size === 3, 'unit02/q8-trends stage 2: the cards do not cover three different charges');
  }
  // 3 and 4. size is never printed and never drawn: the cards are plain, the instrument shows charge only, the rail is the measured radii
  for (const [i, ids, what] of [[2, ['li', 'be', 'b', 'c'], 'across a period'], [3, ['li', 'na', 'k'], 'down a group']]) {
    const t = start(i);
    holds(loose(t).every(p => p.props.plain), `unit02/q8-trends stage ${i + 1}: an atom card is drawn to scale while the stage asks which is bigger`);
    same(kinds(t), ['spring'], `unit02/q8-trends stage ${i + 1} (the only instrument)`);
    holds(!t.fixtures.sp.props.show.dist, `unit02/q8-trends stage ${i + 1}: the instrument prints a distance, which is the size`);
    same(end(i).zones.rail.order, by(t, ids, s => EL.RADIUS[s]), `unit02/q8-trends stage ${i + 1} (smallest first, ${what})`);
    holds(q8.STAGES[i].check({ table: run(i, q8.MISSES[i]) }).ok === false, `unit02/q8-trends stage ${i + 1}: the miss passes`);
  }
  holds(new Set(['li', 'be', 'b', 'c'].map(id => TR.feelsOf(symOf(start(2), id)))).size === 4, 'unit02/q8-trends stage 3: two atoms of the period feel the same charge');
  holds(new Set(['li', 'na', 'k'].map(id => TR.feelsOf(symOf(start(3), id)))).size === 1, 'unit02/q8-trends stage 4: the atoms of the group do not feel one charge');
  // 5. only lithium's ionization energy is measured; the rail is the measured energies; unmeasured is refused
  {
    const t = start(4);
    holds(t.pieces.li.fixed && TR.stripRead(t, 'st').piece.id === 'li', 'unit02/q8-trends stage 5: the remover does not hold lithium, fixed');
    const e = end(4);
    same(e.pieces.li.props.lastCost, EL.IONIZATION.Li, 'unit02/q8-trends stage 5 (lithium\'s measured energy)');
    same(e.zones.rail.order, by(t, ['na', 'c', 'f'], s => EL.IONIZATION[s]), 'unit02/q8-trends stage 5 (lowest first)');
    holds(loose(e).every(p => p.props.lastCost == null), 'unit02/q8-trends stage 5: a ranked atom has a measured energy on it');
    holds(q8.STAGES[4].check({ table: run(4, q8.SOLUTIONS[4].slice(1)) }).ok === false, 'unit02/q8-trends stage 5: passes without lithium measured');
  }
  // 6. boron's energy is below beryllium's although its nucleus is larger and its radius smaller; the diagram shows both atoms
  {
    holds(EL.IONIZATION.B < EL.IONIZATION.Be && EL.zOf('B') > EL.zOf('Be') && EL.RADIUS.B < EL.RADIUS.Be, 'unit02/q8-trends stage 6: the two wrong answers are not both false of boron');
    const t = start(5);
    same(t.fixtures.lv.props.atoms, ['Be', 'B'], 'unit02/q8-trends stage 6 (the subshell diagram)');
    const e = end(5);
    same([e.pieces.be.props.lastCost, e.pieces.b.props.lastCost], [EL.IONIZATION.Be, EL.IONIZATION.B], 'unit02/q8-trends stage 6 (both measured)');
    same(e.pieces.p.zone, 'slot:answer', 'unit02/q8-trends stage 6 (the answer)');
    holds(q8.STAGES[5].check({ table: run(5, [{ place: { piece: 'p', to: 'slot:answer' } }]) }).ok === false, 'unit02/q8-trends stage 6: passes with nothing measured');
  }
  // 7. sodium's ion is smaller than the atom, chloride is larger; there is no way to make chloride on the table
  {
    holds(EL.ION_RADIUS['Na+'] < EL.RADIUS.Na && EL.ION_RADIUS['Cl-'] > EL.ION_RADIUS.Cl, 'unit02/q8-trends stage 7: the ions do not go the way the stage says');
    const t = start(6);
    holds(!Object.values(t.pieces).some(p => p.kind === 'electron'), 'unit02/q8-trends stage 7: an electron piece is on the table, so chloride can be made and looked at');
    const e = end(6);
    same(e.pieces.na.props.charge, 1, 'unit02/q8-trends stage 7 (the sodium ion made)');
    same(TR.sizeNow(e.pieces.na), EL.ION_RADIUS['Na+'], 'unit02/q8-trends stage 7 (its card is the ion\'s size)');
    same(e.pieces.larger.zone, 'slot:answer', 'unit02/q8-trends stage 7 (the answer)');
    holds(q8.STAGES[6].check({ table: run(6, [{ place: { piece: 'larger', to: 'slot:answer' } }]) }).ok === false, 'unit02/q8-trends stage 7: passes without the sodium ion made');
  }
  // 8. only carbon is measured; fluorine releases the most of the three cards
  {
    const t = start(7);
    holds(t.pieces.c.fixed, 'unit02/q8-trends stage 8: carbon can be taken out of the adder');
    const ids = loose(t).map(p => p.id);
    same(by(t, ids, s => -EL.ELECTRON_AFFINITY[s])[0], 'f', 'unit02/q8-trends stage 8 (the atom that releases the most)');
    const e = end(7);
    same(e.pieces.c.props.lastGain, EL.ELECTRON_AFFINITY.C, 'unit02/q8-trends stage 8 (carbon measured)');
    same(e.pieces.f.zone, 'slot:most', 'unit02/q8-trends stage 8 (the answer)');
  }
  // 9. no instrument prints electronegativity; the rail is Pauling's order
  {
    const t = start(8);
    holds(!kinds(t).includes('gain'), 'unit02/q8-trends stage 9: an instrument prints the property being ranked');
    same(end(8).zones.rail.order, by(t, ['na', 'c', 'o', 'f'], s => EL.ELECTRONEGATIVITY[s]), 'unit02/q8-trends stage 9 (lowest first)');
  }
  // no stage of the bench carries the size meter, and no reward introduces a term its briefing or an earlier stage did not
  q8.STAGES.forEach((st, i) => holds(!kinds(start(i)).includes('sizer'), `unit02/q8-trends stage ${i + 1}: the size meter prints the radius`));
}
