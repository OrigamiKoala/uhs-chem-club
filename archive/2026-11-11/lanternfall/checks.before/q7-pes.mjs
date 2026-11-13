/** q7-pes: every peak is `electrons.js` `planPES`, every graded figure is recomputed. */
export default async function check(q7, { TABLE, near, same, holds, rig }) {
  const EL = await import('../../../src/learn/engine/electrons.js');
  const PES = await import('../../../src/learn/table/kits/pes.js');
  const { start, end } = rig(q7);
  // Every spectrum on the bench adds up to the electrons its element has, and its peaks land in distinct bins of the strip.
  for (const sym of ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al']) {
    const peaks = EL.planPES(sym);
    const total = peaks.reduce((n, p) => n + p.height, 0);
    same(total, EL.zOf(sym), `unit02/q7-pes: ${sym}'s peaks add up to the electrons it has`);
    const bins = peaks.map(p => PES.binOf(p.energy));
    holds(new Set(bins).size === bins.length, `unit02/q7-pes: two of ${sym}'s peaks fall in one bin of the strip`);
    holds(!peaks.some(p => p.height > PES.STACK), `unit02/q7-pes: a peak of ${sym} is taller than the strip's pile`);
    holds(peaks[peaks.length - 1].energy >= PES.AXIS.lo && peaks[0].energy <= PES.AXIS.hi, `unit02/q7-pes: ${sym}'s peaks run off the strip's scale`);
    holds(PES.freedBy(sym, PES.energyAt(PES.TOP_STEP)).length === peaks.length, `unit02/q7-pes: the strongest light does not free every electron of ${sym}`);
  }
  holds(EL.BINDING.Ne['1s'] > EL.BINDING.F['1s'] && EL.BINDING.F['1s'] > EL.BINDING.O['1s'], 'unit02/q7-pes stage 4: the inner peaks must run oxygen, fluorine, neon');
  // Fire: the piles are the planner's, the printout is the same spectrum, and the strip's piles are one instanced body.
  {
    let t = TABLE.createTable({ ...q7.STAGES[1].table, pieces: [...q7.STAGES[1].table.pieces] }, 'x');
    t = TABLE.runScript(t, [{ run: 'ch' }], { strict: true });
    const r = PES.chamberRead(t, 'ch');
    same(r.piles, PES.pilesOf(EL.planPES('Li')), 'unit02/q7-pes (the piles Li makes at the top setting)');
    same(r.electrons, 3, 'unit02/q7-pes (lithium\'s electrons)');
    holds(t.pieces.a.props.printed, 'unit02/q7-pes: the fired card keeps no printout');
    const piles = PES.chamberPiles(t);
    holds(piles.length === 1 && piles[0].cap === PES.BINS * PES.STACK && piles[0].shown.filter(Boolean).length === 3, 'unit02/q7-pes: the strip does not stand exactly the electrons that fell');
    holds(PES.chamberPiles(start(1))[0].shown.every(x => !x), 'unit02/q7-pes: an unfired strip already holds electrons');
  }
  // 1. the guess: three tokens and nothing else
  {
    const t = start(0);
    same(t.prediction.tokens, ['all', 'two', 'one'], 'unit02/q7-pes stage 1 (the guesses)');
    same(Object.keys(t.fixtures).length + Object.values(t.pieces).filter(p => !p.token).length, 0, 'unit02/q7-pes stage 1 (nothing else on the bench)');
    same(end(0).prediction.token, 'one', 'unit02/q7-pes stage 1 (the guess the solution makes)');
  }
  // 2. the weakest light that frees anything frees exactly the one loose electron, and only that setting grades
  {
    const want = q7.weakestStep('Li');
    const r = PES.chamberRead(end(1), 'ch');
    same(r.freedNow.map(p => p.row), ['2s'], 'unit02/q7-pes stage 2 (what comes off)');
    same(r.electronsNow, 1, 'unit02/q7-pes stage 2 (electrons freed)');
    holds(want > 1 && PES.freedBy('Li', PES.energyAt(want - 1)).length === 0, 'unit02/q7-pes stage 2: a weaker setting also frees an electron, so the grade is not the weakest');
    holds(PES.chamberRead(start(1), 'ch').electronsNow === 3, 'unit02/q7-pes stage 2: the light starts already at the weakest setting');
    holds(PES.freedBy('Li', PES.energyAt(want + 1)).length === 1 && PES.freedBy('Li', PES.energyAt(PES.TOP_STEP)).length === 2, 'unit02/q7-pes stage 2: the strong light does not free everything');
    same(PES.shellsOf('Li'), [2, 1], 'unit02/q7-pes stage 2 (lithium\'s rings)');
  }
  // 3. the build that matches is oxygen; its outlines are exactly the sealed specimen's piles
  {
    const t = end(2);
    const b = PES.buildRead(t, 'build');
    same(b.sym, 'O', 'unit02/q7-pes stage 3 (the build)');
    holds(b.whole, 'unit02/q7-pes stage 3: the graded build is no whole atom');
    holds(PES.sameSpectrum(b.peaks, EL.planPES('O')) && JSON.stringify(PES.pilesOf(b.peaks)) === JSON.stringify(PES.chamberRead(t, 'ch').piles), 'unit02/q7-pes stage 3: the build\'s outlines are not the sealed piles');
    for (const [p, e] of [[8, 7], [7, 7], [9, 9]]) {
      const w = PES.buildRead(TABLE.runScript(start(2), [{ setDial: { fixture: 'build', dial: 'protons', value: p } }, { setDial: { fixture: 'build', dial: 'electrons', value: e } }]), 'build');
      holds(!(w.whole && w.sym === 'O'), `unit02/q7-pes stage 3: ${p} protons and ${e} electrons already pass`);
    }
  }
  // 4. the innermost peaks run oxygen, fluorine, neon; the cards print their protons
  {
    same(end(3).zones.rail.order, ['o', 'f', 'n'], 'unit02/q7-pes stage 4 (the rail)');
    const t = start(3);
    for (const id of ['o', 'f', 'n']) holds(t.pieces[id].props.note === `${EL.zOf(t.pieces[id].props.sym)} protons`, `unit02/q7-pes stage 4: ${id}'s card does not print its protons`);
    holds(t.zones.rail.order.join() !== 'o,f,n', 'unit02/q7-pes stage 4: the rail starts in the answer\'s order');
  }
  // 5. the configuration written is nitrogen's, and the rows are the ladder's
  {
    same(PES.writtenRead(end(4), 'write').counts, { '1s': 2, '2s': 2, '2p': 3, '3s': 0, '3p': 0 }, 'unit02/q7-pes stage 5 (the page)');
    same(PES.writerTarget('N'), { '1s': 2, '2s': 2, '2p': 3, '3s': 0, '3p': 0 }, 'unit02/q7-pes stage 5 (nitrogen\'s target)');
    same(EL.planPES('N').map(p => `${p.row}${p.height}`), ['1s2', '2s2', '2p3'], 'unit02/q7-pes stage 5 (the strip)');
  }
}
