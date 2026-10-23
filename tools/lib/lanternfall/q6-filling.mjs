/** q6-filling: every graded rack is `electrons.js`'s own reading. */
export default async function check(q6, { TABLE, same, holds, rig }) {
  const EL = await import('../../../src/learn/engine/electrons.js');
  const SHL = await import('../../../src/learn/table/kits/shells.js');
  const { start, end, miss } = rig(q6);
  // The ground states the stages grade against, and the magnet's real counts.
  const r6 = EL.readRack(EL.rackFor(6));
  holds(r6.config === EL.configString(EL.groundConfig(6)) && r6.laddered, 'unit02/q6-filling stage 1: carbon\'s rack does not read as its ground state');
  holds(EL.unpairedOfConfig(EL.groundConfig(6)) === EL.MEASURED.C, 'the magnet\'s count for carbon disagrees with Hund\'s rule');
  for (const [sym, m] of Object.entries(EL.MEASURED)) {
    if (/[+]/.test(sym)) continue;
    holds(EL.unpairedOfConfig(EL.groundConfig(EL.zOf(sym))) === m, `the magnet's measured count for ${sym} disagrees with its ground-state configuration`);
  }
  // 1. carbon, lowest rows first, pulling as the sample does; paired p electrons do not
  {
    const t = end(0);
    same(SHL.readOf(t, 'rack').counts, EL.groundConfig(6), 'unit02/q6-filling stage 1 (carbon\'s rack)');
    same(SHL.rackPull(t, 'rack'), EL.MEASURED.C, 'unit02/q6-filling stage 1 (the rack\'s pull)');
    holds(SHL.readOf(t, 'rack').laddered, 'unit02/q6-filling stage 1: the graded rack is not laddered');
    holds(!SHL.readOf(miss(0), 'rack').laddered && SHL.readOf(miss(0), 'rack').total === 6, 'unit02/q6-filling stage 1: the miss is not six electrons with a lower row left open');
    // paired in one 2p box (laddered, six electrons) must not match the magnet: Hund's rule is the discovery
    const paired = TABLE.runScript(start(0), [
      { place: { piece: 'up', to: `piece:${SHL.boxPieceId('rack', '1s', 0)}` } }, { place: { piece: 'down', to: `piece:${SHL.boxPieceId('rack', '1s', 0)}` } },
      { place: { piece: 'up', to: `piece:${SHL.boxPieceId('rack', '2s', 0)}` } }, { place: { piece: 'down', to: `piece:${SHL.boxPieceId('rack', '2s', 0)}` } },
      { place: { piece: 'up', to: `piece:${SHL.boxPieceId('rack', '2p', 0)}` } }, { place: { piece: 'down', to: `piece:${SHL.boxPieceId('rack', '2p', 0)}` } }
    ], { strict: true });
    holds(SHL.rackPull(paired, 'rack') !== EL.MEASURED.C && SHL.readOf(paired, 'rack').laddered, 'unit02/q6-filling stage 1: paired p electrons already match the magnet');
    same(TABLE.apply(t, { run: 'msample' }).fixtures.msample.dials.pull.value, 1 + EL.MEASURED.C, 'unit02/q6-filling stage 1 (Test Sample)');
  }
  // 2. oxygen's configuration, as the rack writes it, and exactly one card reads it
  {
    const t = end(1);
    same(SHL.readOf(t, 'rack').config, EL.configString(EL.groundConfig(8)), 'unit02/q6-filling stage 2 (oxygen\'s configuration)');
    same(t.pieces.p4.label, SHL.readOf(t, 'rack').config, 'unit02/q6-filling stage 2 (the card in the slot)');
    same(t.pieces.p4.zone, 'slot:reads', 'unit02/q6-filling stage 2 (the slot)');
    const cards = Object.values(start(1).pieces).filter(p => p.kind === 'ccard').map(p => p.label);
    same(cards.filter(c => c === EL.configString(EL.groundConfig(8))).length, 1, 'unit02/q6-filling stage 2 (exactly one card reads what the rack reads)');
  }
  // 3. the guess: two tokens and nothing else
  {
    const t = start(2);
    same(t.prediction.tokens, ['d3', 's4'], 'unit02/q6-filling stage 3 (the guesses)');
    same(Object.keys(t.fixtures).length + Object.values(t.pieces).filter(p => !p.token).length, 0, 'unit02/q6-filling stage 3 (nothing else on the bench)');
    same(end(2).prediction.token, 's4', 'unit02/q6-filling stage 3 (the guess the solution makes)');
  }
  // 4. potassium's last electron goes in 4s, below 3d, and 3d is a real place to put it (the rack takes it there)
  {
    same(SHL.readOf(end(3), 'rack').counts, EL.groundConfig(19), 'unit02/q6-filling stage 4 (potassium\'s rack)');
    holds(EL.LADDER.findIndex(r => r.id === '4s') < EL.LADDER.findIndex(r => r.id === '3d'), 'unit02/q6-filling stage 4: 4s is not below 3d on the ladder');
    same(q6.ROWS.indexOf('4s') < q6.ROWS.indexOf('3d'), true, 'unit02/q6-filling stage 4 (the rack\'s rows put 4s below 3d)');
    holds(SHL.readOf(miss(3), 'rack').counts['3d'] === 1, 'unit02/q6-filling stage 4: the miss does not put the electron in 3d');
    holds(!SHL.readOf(miss(3), 'rack').laddered, 'unit02/q6-filling stage 4: the electron in 3d is not out of the ladder\'s order');
  }
  // 5. chromium: the rule's answer and the measured one differ, and the graded arrangement is the measured one
  {
    same(SHL.rackPull(end(4), 'rack'), EL.MEASURED.Cr, 'unit02/q6-filling stage 5 (the graded pull)');
    holds(SHL.rackPull(miss(4), 'rack') !== EL.MEASURED.Cr, 'unit02/q6-filling stage 5: the rule-following arrangement already matches the magnet, so the stage teaches nothing');
    same(SHL.readOf(end(4), 'rack').total, 24, 'unit02/q6-filling stage 5 (chromium has 24 electrons)');
    holds(q6.STAGES[4].beyondExam === true, 'unit02/q6-filling stage 5: the beyond-the-exam stage does not say so');
  }
}
