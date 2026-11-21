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

  // 1. interactive visual shielding lab for Sodium (+11 nucleus, 10 inner electrons -> +1 effective pull)
  {
    const e = end(0);
    same(e.fixtures.shield.dials.protons.value, 11, 'unit02/q8-trends stage 1 (sodium protons)');
    same(e.fixtures.shield.dials.inner.value, 10, 'unit02/q8-trends stage 1 (sodium inner shielding electrons)');
  }
  // 2. the guess (right before stage 3 tests it)
  {
    const t = start(1);
    same(t.prediction.tokens, ['li', 'c', 'same'], 'unit02/q8-trends stage 2 (the guesses)');
    holds(EL.RADIUS.Li > EL.RADIUS.C, 'unit02/q8-trends stage 2: lithium is not the bigger atom');
    same(end(1).prediction.token, 'li', 'unit02/q8-trends stage 2 (the guess the solution makes)');
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
  // 5. sodium, carbon and fluorine ordered directly from charge felt and size (no useless remover)
  {
    const t = start(4);
    const e = end(4);
    same(e.zones.rail.order, by(t, ['na', 'c', 'f'], s => EL.IONIZATION[s]), 'unit02/q8-trends stage 5 (lowest first)');
    holds(loose(e).every(p => p.props.lastCost == null), 'unit02/q8-trends stage 5: a ranked atom has a measured energy on it');
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
  // 7. chlorine gains an electron to form chloride, which is larger
  {
    holds(EL.ION_RADIUS['Na+'] < EL.ION_RADIUS.Na && EL.ION_RADIUS['Cl-'] > EL.ION_RADIUS.Cl, 'unit02/q8-trends stage 7: the ions do not go the way the stage says');
    const e = end(6);
    same(e.pieces.cl.props.charge, -1, 'unit02/q8-trends stage 7 (the chloride ion made)');
    same(TR.sizeNow(e.pieces.cl), EL.ION_RADIUS['Cl-'], 'unit02/q8-trends stage 7 (its card is the ion\'s size)');
    same(e.pieces.larger.zone, 'slot:answer', 'unit02/q8-trends stage 7 (the answer)');
    holds(q8.STAGES[6].check({ table: run(6, [{ place: { piece: 'larger', to: 'slot:answer' } }]) }).ok === false, 'unit02/q8-trends stage 7: passes without the chloride ion made');
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
}
