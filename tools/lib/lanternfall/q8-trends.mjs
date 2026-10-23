/** q8-trends: the pull is `planPull`, the sizes and costs are the measured tables. */
export default async function check(q8, { TABLE, same, holds, rig }) {
  const EL = await import('../../../src/learn/engine/electrons.js');
  const TRD = await import('../../../src/learn/table/kits/trends.js');
  const B = await import('../../../src/learn/engine/electronbench.js');
  const { start, end } = rig(q8);
  const item = sym => ({ z: EL.zOf(sym), shells: B.shellsOf(sym), radius: EL.RADIUS[sym] ?? EL.ION_RADIUS[sym] });
  // The radii run the way the trends do: shrinking across a row, growing down a group, an ion unlike its atom.
  const R = s => EL.RADIUS[s];
  holds(R('Li') > R('Be') && R('Be') > R('B') && R('B') > R('C'), 'unit02/q8-trends stage 2: the radii must shrink across the row');
  holds(EL.ION_RADIUS['Na+'] < EL.ION_RADIUS['Cl-'] && EL.ION_RADIUS['Cl-'] < EL.ION_RADIUS.Na, 'unit02/q8-trends stage 5: Na+ < Cl- < Na');
  // 1. the guess: three tokens and nothing else; the misconception (more protons, bigger) is the guess the bench contradicts
  {
    const t = start(0);
    same(t.prediction.tokens, ['li', 'c', 'same'], 'unit02/q8-trends stage 1 (the guesses)');
    same(Object.keys(t.fixtures).length + Object.values(t.pieces).filter(p => !p.token).length, 0, 'unit02/q8-trends stage 1 (nothing else on the bench)');
    same(end(0).prediction.token, 'li', 'unit02/q8-trends stage 1 (the guess the solution makes)');
    holds(EL.zOf('C') > EL.zOf('Li') && R('Li') > R('C'), 'unit02/q8-trends stage 1: carbon must have more protons and be the smaller atom');
  }
  // 2. the rail runs largest first, the card of each atom is drawn at its real radius, and the order is not the order of protons
  {
    const t = end(1);
    const sizes = t.zones.rail.order.map(id => TRD.sizeNow(t.pieces[id]));
    holds(sizes.every((v, i) => !i || v < sizes[i - 1]), 'unit02/q8-trends stage 2: the graded order is not largest radius first');
    same(t.zones.rail.order, ['li', 'be', 'b', 'c'], 'unit02/q8-trends stage 2 (the rail)');
    const protons = t.zones.rail.order.map(id => EL.zOf(t.pieces[id].props.sym));
    holds(protons.every((v, i) => !i || v > protons[i - 1]), 'unit02/q8-trends stage 2: the largest atom is not the one with the fewest protons');
    const g = TRD.sizeRead(TABLE.apply(start(1), { place: { piece: 'li', to: 'slot:sz.atom' } }), 'sz');
    same(g.radius, EL.RADIUS.Li, 'unit02/q8-trends stage 2 (the size gauge)');
    holds(start(1).zones.rail.order.length === 0, 'unit02/q8-trends stage 2: the rail starts with cards on it');
  }
  // 3. sodium's outer electron feels +1 of its +11 with ten between; lithium feels +1, beryllium and magnesium +2
  {
    const na = B.planPull({ z: 11, shells: [2, 8, 1], radius: 186 }, 2);
    holds(na.zeff === 1 && na.between === 10, 'unit02/q8-trends stage 3: sodium\'s outer electron should feel +1 with ten electrons between');
    same(['Li', 'Na', 'Be', 'Mg'].map(TRD.feelsOf), [1, 1, 2, 2], 'unit02/q8-trends stage 3 (the charges felt)');
    const t = end(2);
    same(['li', 'na', 'be', 'mg'].map(id => t.pieces[id].zone), ['tray:one', 'tray:one', 'tray:two', 'tray:two'], 'unit02/q8-trends stage 3 (the trays)');
    // the atom with the most protons of the four is not the one that feels the most
    holds(EL.zOf('Na') > EL.zOf('Mg') - 2 && TRD.feelsOf('Na') < TRD.feelsOf('Mg'), 'unit02/q8-trends stage 3: sodium must have many protons and feel little');
  }
  // 4. the costs are the measured first ionization energies; the rail is cheapest first and boron dips below beryllium
  {
    const ies = ['Li', 'B', 'Be'].map(s => EL.IONIZATION[s]);
    holds(ies.every((v, i) => !i || v > ies[i - 1]), 'unit02/q8-trends stage 4: the graded order is not the order of the real ionization energies');
    const t = end(3);
    same(t.zones.rail.order, ['li', 'b', 'be'], 'unit02/q8-trends stage 4 (the rail)');
    same(['li', 'be', 'b'].map(id => t.pieces[id].props.lastCost), [520, 899, 801], 'unit02/q8-trends stage 4 (what each strip read)');
    holds(EL.IONIZATION.B < EL.IONIZATION.Be, 'unit02/q8-trends stage 4: boron must dip below beryllium');
  }
  // 5. a stripped atom is its ion, a chlorine with one more is Cl-, and the three sort smallest first
  {
    const t = end(4);
    same(['na1', 'na2', 'cl'].map(id => TRD.itemOf(t.pieces[id]).charge), [0, 1, -1], 'unit02/q8-trends stage 5 (the charges)');
    same(t.zones.rail.order.map(id => TRD.sizeNow(t.pieces[id])), [EL.ION_RADIUS['Na+'], EL.ION_RADIUS['Cl-'], EL.ION_RADIUS.Na], 'unit02/q8-trends stage 5 (the sizes)');
    same(TRD.shellsNow('Na', 1), [2, 8], 'unit02/q8-trends stage 5 (Na+ has lost its outer shell)');
    same(TRD.shellsNow('Cl', -1), [2, 8, 8], 'unit02/q8-trends stage 5 (Cl- has a full outer shell)');
    const twice = TABLE.runScript(start(4), [{ join: ['e', 'cl'] }, { join: ['e', 'cl'] }]);
    holds(twice.last.ok === false || TRD.itemOf(twice.pieces.cl).charge === -1, 'unit02/q8-trends stage 5: a chlorine takes a second extra electron');
    void item;
  }
}
