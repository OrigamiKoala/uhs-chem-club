/** boss-eater: five phases, each on a table of a bench the player has worked, each answer read off the real planners. */
export default async function check(eater, { D, TABLE, near, same, holds, rig }) {
  const EL = await import('../../../src/learn/engine/electrons.js');
  const OPT = await import('../../../src/learn/table/kits/optics.js');
  const SHL = await import('../../../src/learn/table/kits/shells.js');
  const PESK = await import('../../../src/learn/table/kits/pes.js');
  const CUV = await import('../../../src/learn/table/kits/cuvette.js');
  const { start, end } = rig(eater);
  // 1. the 486 nm line is the drop from the fourth rung to the second, and no other drop makes a line within a nanometre of it
  {
    same(D.jumpsForLine(eater.LADDER_LINE).map(j => [j.hi, j.lo]), [[4, 2]], 'unit02/boss-eater phase 1 (the drop that makes the line)');
    near(OPT.ladderRead(end(0), 'lad').last.nm, D.planJump(4, 2).nm, 0.01, 'unit02/boss-eater phase 1 (the line the solution made)');
    for (let hi = 2; hi <= 6; hi++) for (let lo = 1; lo < hi; lo++) {
      if (!(hi === 4 && lo === 2)) holds(Math.abs(D.planJump(hi, lo).nm - eater.LADDER_LINE) >= 1, `unit02/boss-eater phase 1: the drop ${hi} to ${lo} also makes a line near ${eater.LADDER_LINE} nm`);
    }
  }
  // 2. every lamp frees cesium's electrons, each at its own speed, and the one in the marked place is the slowest
  {
    const speeds = eater.LAMPS.map(([id, , nm]) => [id, D.planPhotocell('Cs', nm, eater.CELL_BRIGHT)]);
    holds(speeds.every(([, r]) => r.freed), 'unit02/boss-eater phase 2: a lamp frees no electrons, so "slowest" is zero');
    const order = speeds.slice().sort((a, b) => a[1].speed - b[1].speed);
    holds(order.every(([, r], k) => !k || r.speed > order[k - 1][1].speed), 'unit02/boss-eater phase 2: two lamps free electrons at the same speed');
    same(Object.values(end(1).pieces).filter(p => p.zone === 'slot:slowest').map(p => p.id), [order[0][0]], 'unit02/boss-eater phase 2 (the lamp in the marked place)');
    const first = start(1);
    same(first.pieces.cs.props.metal, 'Cs', 'unit02/boss-eater phase 2 (the plate is cesium)');
    same(first.pieces.cs.zone, `slot:${first.fixtures.cell.props.holder}`, 'unit02/boss-eater phase 2 (fixed in the holder)');
  }
  // 3. oxygen is pulled by two lone electrons, the rack that pulls as hard has two alone, and a rack of pairs would not match
  {
    const t = end(2);
    same(SHL.readOf(t, 'rack').unpaired, SHL.MEASURED.O, 'unit02/boss-eater phase 3 (the rack that matches the sample)');
    same(SHL.rackPull(t, 'rack'), SHL.MEASURED.O, 'unit02/boss-eater phase 3 (the rack pulls as the sample does)');
    same(t.fixtures.alone.dials.n.value, SHL.readOf(t, 'rack').unpaired, 'unit02/boss-eater phase 3 (the marker)');
    const b = idx => `piece:${SHL.boxPieceId('rack', '2p', idx)}`;
    const paired = TABLE.runScript(start(2), [0, 1].flatMap(i => [{ place: { piece: 'up', to: b(i) } }, { place: { piece: 'down', to: b(i) } }]));
    holds(SHL.rackPull(paired, 'rack') !== SHL.MEASURED.O, 'unit02/boss-eater phase 3: pairing the p electrons first still matches the magnet');
    holds(start(2).fixtures.alone.dials.n.value !== SHL.MEASURED.O, 'unit02/boss-eater phase 3: the marker starts on the answer');
  }
  // 4. the sealed core is neon: peaks of 2, 2 and 6, and no other candidate has its electron count
  {
    same(EL.planPES(eater.CORE).map(p => p.height), [2, 2, 6], 'unit02/boss-eater phase 4 (the sealed core\'s piles)');
    const t = end(3);
    const b = PESK.buildRead(t, 'build');
    holds(b.whole && b.sym === eater.CORE, 'unit02/boss-eater phase 4: the solution does not build the sealed core\'s atom');
    same(t.pieces.x.props.sym, eater.CORE, 'unit02/boss-eater phase 4 (the specimen)');
    for (const sym of ['O', 'F', 'Na']) holds(EL.planPES(sym).reduce((n, p) => n + p.height, 0) !== 10, `unit02/boss-eater phase 4: ${sym} has as many electrons as the sealed core`);
  }
  // 5. the sealed copper solution is read back off the line the standards make
  {
    const t = end(4);
    const A = id => CUV.absorbOf(t.pieces[id], 630, 1);
    const C = id => CUV.concOf(t.pieces[id]) * 1000;
    const slope = (A('s3') - A('s1')) / (C('s3') - C('s1'));
    near((A('sealed') - A('s1')) / slope + C('s1'), eater.SEALED_CONC * 1000, 0.05, 'unit02/boss-eater phase 5 (the line gives the sealed strength back)');
    same(CUV.markerRead(t, 'conc'), eater.SEALED_CONC * 1000, 'unit02/boss-eater phase 5 (the marker)');
    holds(start(4).fixtures.conc.dials.value.max >= eater.SEALED_CONC * 1000, 'unit02/boss-eater phase 5: the marker cannot reach the answer');
    holds(A('sealed') > A('s1') && A('sealed') < A('s3'), 'unit02/boss-eater phase 5: the sealed reading lies outside the standards');
  }
  // Every phase is a fight: one eater, the species' own words, no field stage (verify:table holds the pad).
  eater.STAGES.forEach((st, i) => {
    same(st.encounter?.species, 'the lantern-eater', `boss-eater phase ${i + 1} (its species)`);
    same((st.foes || []).length, 1, `boss-eater phase ${i + 1} (its foes)`);
    holds(!(st.table.fetch || []).length && !st.field, `boss-eater phase ${i + 1}: a boss phase declares a field stage`);
    holds(st.widget.type === 'table', `boss-eater phase ${i + 1}: not a table`);
  });
}
