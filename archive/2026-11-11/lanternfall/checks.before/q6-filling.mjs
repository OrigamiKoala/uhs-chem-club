/** q6-filling: every graded rack is `electrons.js`'s own reading. */
export default async function check(q6, { TABLE, same, holds, rig }) {
  const EL = await import('../../../src/learn/engine/electrons.js');
  const SHL = await import('../../../src/learn/table/kits/shells.js');
  const { start, end, miss } = rig(q6);

  // The ground states the stages grade against.
  const r6 = EL.readRack(EL.rackFor(6));
  holds(r6.config === EL.configString(EL.groundConfig(6)) && r6.laddered, 'unit02/q6-filling stage 1: carbon\'s rack does not read as its ground state');

  // 1. carbon, lowest rows first, filling 1s and 2s before 2p; Hund's rule holds
  {
    const t = end(0);
    same(SHL.readOf(t, 'rack').counts, EL.groundConfig(6), 'unit02/q6-filling stage 1 (carbon\'s rack)');
    holds(SHL.readOf(t, 'rack').laddered, 'unit02/q6-filling stage 1: the graded rack is not laddered');
    holds(!SHL.readOf(miss(0), 'rack').laddered && SHL.readOf(miss(0), 'rack').total === 6, 'unit02/q6-filling stage 1: the miss is not six electrons with a lower row left open');

    // Paired in one 2p box violates Hund's rule
    const paired = TABLE.runScript(start(0), [
      { place: { piece: 'up', to: `piece:${SHL.boxPieceId('rack', '1s', 0)}` } },
      { place: { piece: 'down', to: `piece:${SHL.boxPieceId('rack', '1s', 0)}` } },
      { place: { piece: 'up', to: `piece:${SHL.boxPieceId('rack', '2s', 0)}` } },
      { place: { piece: 'down', to: `piece:${SHL.boxPieceId('rack', '2s', 0)}` } },
      { place: { piece: 'up', to: `piece:${SHL.boxPieceId('rack', '2p', 0)}` } },
      { place: { piece: 'down', to: `piece:${SHL.boxPieceId('rack', '2p', 0)}` } }
    ], { strict: true });
    holds(!SHL.readOf(paired, 'rack').ruleHolds, 'unit02/q6-filling stage 1: paired p electrons violate Hund\'s rule');
    same(TABLE.apply(t, { run: 'well' }).fixtures.well.dials.state.value, 1, 'unit02/q6-filling stage 1 (Test Energy reads ground state)');
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

  // 5. scandium: after 4s fills with two electrons, the 21st electron falls into 3d
  {
    const t = end(4);
    same(SHL.readOf(t, 'rack').total, 21, 'unit02/q6-filling stage 5 (scandium has 21 electrons)');
    same(SHL.readOf(t, 'rack').counts['4s'], 2, 'unit02/q6-filling stage 5 (4s is full with 2 electrons)');
    same(SHL.readOf(t, 'rack').counts['3d'], 1, 'unit02/q6-filling stage 5 (one electron in 3d)');
    holds(SHL.readOf(t, 'rack').laddered, 'unit02/q6-filling stage 5: scandium ground state is laddered');
    holds(!SHL.readOf(miss(4), 'rack').laddered, 'unit02/q6-filling stage 5: miss is not laddered');
    same(TABLE.apply(t, { run: 'well' }).fixtures.well.dials.state.value, 1, 'unit02/q6-filling stage 5 (Test Energy reads ground state)');
  }
}
