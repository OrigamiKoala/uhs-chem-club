/** q6-filling: every graded diagram is `electrons.js`'s own reading. */
export default async function check(q6, { TABLE, same, holds, rig }) {
  const EL = await import('../../../src/learn/engine/electrons.js');
  const SHL = await import('../../../src/learn/table/kits/shells.js');
  const { start, end, miss } = rig(q6);
  const read = t => SHL.readOf(t, 'rack');
  const tested = t => TABLE.apply(t, { run: 'well' }).fixtures.well.dials.state.value;

  // 1. boron: lowest subshells first, and the diagram itself does not print a verdict
  {
    const t = end(0);
    same(read(t).counts, EL.groundConfig(5), 'unit02/q6-filling stage 1 (boron)');
    holds(!read(miss(0)).laddered && read(miss(0)).total === 5, 'unit02/q6-filling stage 1: the miss is not five electrons with a lower subshell left open');
    same(tested(t), 1, 'unit02/q6-filling stage 1 (Test Energy reads lowest energy)');
    holds(start(0).fixtures['shelf-rack'].props.verdict === false, 'unit02/q6-filling stage 1: the diagram prints GROUND STATE, so the stage is passed by adding electrons until it does');
  }
  // 2. carbon: five electrons stand placed; the sixth goes in its own 2p orbital with the same spin, and both other choices test higher
  {
    same(read(start(1)).counts, EL.groundConfig(5), 'unit02/q6-filling stage 2 (the five already placed)');
    const t = end(1);
    same(read(t).counts, EL.groundConfig(6), 'unit02/q6-filling stage 2 (carbon)');
    holds(read(t).ruleHolds && tested(t) === 1, 'unit02/q6-filling stage 2: the solution is not the lowest energy');
    holds(read(miss(1)).doubledWhileEmpty && tested(miss(1)) === 3, 'unit02/q6-filling stage 2: a pair in one 2p orbital does not test higher');
    const anti = rig(q6).run(1, [{ place: { piece: 'down', to: `piece:${SHL.boxPieceId('rack', '2p', 1)}` } }]);
    holds(read(anti).mixedSingles && q6.STAGES[1].check({ table: anti }).ok === false, 'unit02/q6-filling stage 2: opposite spins in separate orbitals pass');
  }
  // 3. oxygen stands built; exactly one card reads it; nothing is printed that gives the configuration
  {
    const t0 = start(2);
    same(read(t0).config, EL.configString(EL.groundConfig(8)), 'unit02/q6-filling stage 3 (oxygen on the diagram)');
    holds(t0.fixtures['shelf-rack'].props.readout === false, 'unit02/q6-filling stage 3: the diagram prints the configuration');
    const cards = Object.values(t0.pieces).filter(p => p.kind === 'ccard').map(p => p.label);
    same(cards.filter(c => c === read(t0).config).length, 1, 'unit02/q6-filling stage 3 (exactly one card reads what the diagram shows)');
    same(end(2).pieces.p4.zone, 'slot:reads', 'unit02/q6-filling stage 3 (the slot)');
  }
  // 4. the guess: two tokens and nothing else
  {
    const t = start(3);
    same(t.prediction.tokens, ['d3', 's4'], 'unit02/q6-filling stage 4 (the guesses)');
    same(Object.keys(t.fixtures).length + Object.values(t.pieces).filter(p => !p.token).length, 0, 'unit02/q6-filling stage 4 (nothing else on the bench)');
    same(end(3).prediction.token, 's4', 'unit02/q6-filling stage 4 (the guess the solution makes)');
  }
  // 5. potassium's last electron goes in 4s, drawn below 3d, and 3d is a real place to put it
  {
    same(read(end(4)).counts, EL.groundConfig(19), 'unit02/q6-filling stage 5 (potassium)');
    holds(EL.LADDER.findIndex(r => r.id === '4s') < EL.LADDER.findIndex(r => r.id === '3d'), 'unit02/q6-filling stage 5: 4s is not below 3d on the ladder');
    same(q6.ROWS.indexOf('4s') < q6.ROWS.indexOf('3d'), true, 'unit02/q6-filling stage 5 (the diagram draws 4s below 3d)');
    holds(read(miss(4)).counts['3d'] === 1 && !read(miss(4)).laddered, 'unit02/q6-filling stage 5: the miss does not put the electron in 3d, out of order');
  }
  // 6. scandium: 4s fills with two, then 3d takes the third
  {
    const t = end(5);
    same(read(t).counts, EL.groundConfig(21), 'unit02/q6-filling stage 6 (scandium)');
    holds(!read(miss(5)).laddered, 'unit02/q6-filling stage 6: the miss is laddered');
    same(tested(t), 1, 'unit02/q6-filling stage 6 (Test Energy reads lowest energy)');
  }
  // 7. chloride: eighteen electrons, argon's configuration
  {
    same(read(end(6)).counts, EL.groundConfig(18), 'unit02/q6-filling stage 7 (chloride)');
    holds(read(miss(6)).total === 17, 'unit02/q6-filling stage 7: the miss is not the neutral atom');
  }
}
