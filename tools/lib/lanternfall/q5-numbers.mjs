/** q5-numbers: the rules are `electrons.js`'s, every graded figure is recomputed. */
export default async function check(q5, { TABLE, near, same, holds, rig }) {
  const EL = await import('../../../src/learn/engine/electrons.js');
  const SHL = await import('../../../src/learn/table/kits/shells.js');
  const { start, end } = rig(q5);
  const C = q5.CHECKS;
  // 1. the lit box is the ringed one, and it is reached only by the right three numbers
  {
    const room = EL.findRoom({ n: 2, l: 1, ml: 1 });
    same([room.row, room.idx], [C.TARGET.row, C.TARGET.idx], 'unit02/q5-numbers stage 1 (the box the graded address names)');
    const t = start(0);
    const ringed = Object.values(t.pieces).filter(p => p.props.target).map(p => [p.props.row, p.props.idx]);
    same(ringed, [[C.TARGET.row, C.TARGET.idx]], 'unit02/q5-numbers stage 1 (the ringed box)');
    same(SHL.addressOfFinder(end(0), 'addr'), { n: 2, l: 1, ml: 1, ms: 0.5 }, 'unit02/q5-numbers stage 1 (the address the solution sets)');
    // no other address in the strip's range lights the ringed box, and the strip starts on another box
    let hits = 0;
    for (let n = 1; n <= 3; n++) for (let l = 0; l <= 3; l++) for (let ml = -3; ml <= 3; ml++) {
      const r = EL.findRoom({ n, l, ml });
      if (r.exists && r.row === C.TARGET.row && r.idx === C.TARGET.idx) hits++;
    }
    same(hits, 1, 'unit02/q5-numbers stage 1 (exactly one address names the ringed box)');
    holds(!(SHL.addressOfFinder(t, 'addr').n === 2 && SHL.addressOfFinder(t, 'addr').l === 1), 'unit02/q5-numbers stage 1: the strip starts on the answer');
  }
  // 2. exactly one pair of the six shares all four numbers, every candidate has a room, and the rack refuses whichever comes second
  {
    const dup = Object.entries(C.CANDIDATES);
    same(dup.length, 6, 'unit02/q5-numbers stage 2 (six candidates)');
    const pair = dup.flatMap(([a, x], i) => dup.slice(i + 1).filter(([, y]) => EL.sameAddress(x, y)).map(([b]) => a + b));
    same(pair, ['ac'], 'unit02/q5-numbers stage 2 (the pair that shares all four numbers)');
    for (const [k, a] of dup) holds(EL.validAddress(a), `unit02/q5-numbers stage 2: candidate ${k} has no room, so the rack would refuse it for another reason`);
    const t = end(1);
    same(Object.keys(C.CANDIDATES).map(k => Boolean(t.pieces[`t${k}`].props.placed) && !t.pieces[`t${k}`].zone), [true, true, false, true, true, true], 'unit02/q5-numbers stage 2 (the five on the rack)');
    same(t.pieces.tc.zone, 'tray:no', 'unit02/q5-numbers stage 2 (the refused electron in the tray)');
    const swap = TABLE.runScript(start(1), [
      { place: { piece: 'tc', to: `piece:${SHL.boxPieceId('rack', '2p', 1)}` } }, { place: { piece: 'ta', to: `piece:${SHL.boxPieceId('rack', '2p', 1)}` } }
    ], { strict: true });
    holds(swap.last.joined === false && /four numbers/.test(swap.last.reason), 'unit02/q5-numbers stage 2: placing C first does not make A the refused one, with the rule as its reason');
  }
  // 3. the third shell is nine boxes of two, and the marker is what the board counts
  {
    const t = end(2);
    same(Object.values(t.pieces).filter(p => p.kind === 'box').length, 9, 'unit02/q5-numbers stage 3 (boxes in the third shell)');
    same(t.fixtures.count.dials.n.value, EL.shellCapacity(3), 'unit02/q5-numbers stage 3 (the marker)');
    holds(q5.STAGES[2].table.fixtures.find(f => f.id === 'count').dials.n.value !== 18, 'unit02/q5-numbers stage 3: the marker starts on the answer');
  }
  // 4 & 5. sorting electrons into exact boxes
  {
    const t4 = end(3);
    holds(['sa', 'sb', 'sc', 'sd'].every(id => t4.pieces[id].props.placed), 'unit02/q5-numbers stage 4 (all four sorted)');
    const t5 = end(4);
    holds(['sa', 'sb', 'sc', 'sd', 'se'].every(id => t5.pieces[id].props.placed), 'unit02/q5-numbers stage 5 (all five sorted)');
  }
}
