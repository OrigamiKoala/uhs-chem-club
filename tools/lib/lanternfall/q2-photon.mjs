/** q2-photon: the cup and the meters are `planPhotocell`, read off the table. */
export default async function check(q2, { D, near, same, holds, rig }) {
  const OPT = await import('../../../src/learn/table/kits/optics.js');
  const { start, end } = rig(q2);
  const sweep = (i, metal, brightness = 3) => q2.STAGES[i].table.fixtures[0].props.settings.map(n => D.planPhotocell(metal, n, brightness));
  const wake = ['Cs', 'Na', 'Zn'].map(m => D.thresholdNm(m));
  holds(wake[0] > wake[1] && wake[1] > wake[2], 'unit02/q2-photon: the work functions do not order cesium < sodium < zinc');
  // 1. the guess: three tokens and nothing else; the solution's guess is the true outcome
  {
    const t = start(0);
    same(t.prediction.tokens, ['many', 'few', 'none'], 'unit02/q2-photon stage 1 (the guesses)');
    same(Object.keys(t.fixtures).length + Object.values(t.pieces).filter(p => !p.token).length, 0, 'unit02/q2-photon stage 1 (nothing else on the bench)');
    const f = start(1).fixtures.cell;
    holds(!D.planPhotocell('Na', f.props.settings[0], 5).freed, 'unit02/q2-photon stage 1: the brightest red frees electrons, so "none" is not what the bench will show');
    same(end(0).prediction.token, 'none', 'unit02/q2-photon stage 1 (the guess the solution makes)');
  }
  // 2. red at full brightness frees nothing; the solution frees something, and it is neither the brightest nor the reddest setting
  {
    const t = start(1);
    const f = t.fixtures.cell;
    holds(!D.planPhotocell('Na', f.props.settings[f.dials.colour.value - 1], f.dials.brightness.value).freed, 'unit02/q2-photon stage 2: the lamp already frees electrons where it starts');
    const r = OPT.cellRead(end(1), 'cell');
    holds(r.freed && r.metal === 'Na', 'unit02/q2-photon stage 2: the solution does not free electrons from sodium');
    holds(r.brightness === 1 && r.nm < f.props.settings[0], 'unit02/q2-photon stage 2: the solution is not the lowest brightness at a bluer colour');
    // any colour that removes electrons at a higher brightness is refused: the answer is which dial decides it
    const bright = rig(q2).run(1, [q2.SOLUTIONS[1][0], q2.SOLUTIONS[1][1]]);
    holds(OPT.cellRead(bright, 'cell').freed && q2.STAGES[1].check({ table: bright }).ok === false, 'unit02/q2-photon stage 2: passes at full brightness');
  }
  // 3. exactly one first setting frees an electron, and the dial finds it
  {
    const p = sweep(2, 'Na');
    const first = p.findIndex(x => x.count > 0) + 1;
    same(end(2).fixtures.cell.dials.colour.value, first, 'unit02/q2-photon stage 3 (the first freeing setting)');
    holds(p.slice(0, first - 1).every(x => x.count === 0) && p.slice(first).every(x => x.count > 0), 'unit02/q2-photon stage 3: electrons do not leave at every setting from the threshold on');
  }
  // 4. brightness sets the number and not the speed; the answer needs two recorded settings and the card that says so
  {
    const f = start(3).fixtures.cell;
    const lo = D.planPhotocell('Na', 400, f.dials.brightness.value);
    const e = end(3);
    const rows = e.recorder.rows;
    holds(rows.length === 2 && rows[0].x !== rows[1].x, 'unit02/q2-photon stage 4: the solution does not record two brightness settings');
    holds(rows[1].y > rows[0].y && rows[0].label === rows[1].label, 'unit02/q2-photon stage 4: a brighter lamp does not give more electrons at the same speed');
    same(rows[0].y, lo.count, 'unit02/q2-photon stage 4 (the count is the planner\'s)');
    holds(lo.count > 0, 'unit02/q2-photon stage 4: the lamp removes nothing at the start');
    same(e.pieces.more.zone, 'slot:answer', 'unit02/q2-photon stage 4 (the card laid)');
    const blind = rig(q2).run(3, [{ place: { piece: 'more', to: 'slot:answer' } }]);
    holds(q2.STAGES[3].check({ table: blind }).ok === false, 'unit02/q2-photon stage 4: passes with nothing recorded');
  }
  // 5. the plate that wakes at the lowest frequency has the loosest grip, and the rail runs that way
  {
    const t = start(4);
    const settings = t.fixtures.cell.props.settings;
    const first = m => settings.findIndex(n => D.planPhotocell(m, n, 3).freed) + 1;
    const order = ['Cs', 'Na', 'Zn'].sort((x, y) => first(x) - first(y)).map(m => m.toLowerCase());
    same(end(4).zones.rail.order, order, 'unit02/q2-photon stage 5 (loosest grip first)');
    holds(['Cs', 'Na', 'Zn'].every(m => first(m) > 0), 'unit02/q2-photon stage 5: a plate never wakes on the dial');
    holds(new Set(['Cs', 'Na', 'Zn'].map(first)).size === 3, 'unit02/q2-photon stage 5: two plates wake at the same setting');
    same(end(4).recorder.rows.map(r => r.label), ['Cs', 'Na', 'Zn'], 'unit02/q2-photon stage 5 (a reading for each plate)');
    holds(t.zones.rail.order.join() !== order.join(), 'unit02/q2-photon stage 5: the rail starts in the answer\'s order');
  }
  // 6. the typed kinetic energy is the photon's energy less sodium's work function, and the worked case is another lamp on another metal
  {
    const photon = q2.H * q2.ASKED.hz14 * 1e14 / 1e-19;
    near(photon, D.photonJoules(q2.ASKED.nm) / 1e-19, 0.1, 'unit02/q2-photon stage 6 (the photon\'s energy)');
    near(q2.ASKED.work, D.METALS.Na.work * D.EV / 1e-19, 0.05, 'unit02/q2-photon stage 6 (sodium\'s work function)');
    near(q2.WORKED.work, D.METALS.Cs.work * D.EV / 1e-19, 0.05, 'unit02/q2-photon stage 6 (cesium\'s work function)');
    near(Number(q2.SOLUTIONS[5][0].type.value), photon - q2.ASKED.work, 0.1, 'unit02/q2-photon stage 6 (the typed energy)');
    const r = OPT.cellRead(start(5), 'cell');
    holds(r.freed && r.metal === 'Na' && r.nm === q2.ASKED.nm, 'unit02/q2-photon stage 6: the photocell is not drawing the case the plate describes');
    const worked = q2.STAGES[5].briefing.worked.join(' ');
    holds(!worked.includes('7.5') && !worked.includes('3.7') && !worked.includes('1.3'), 'unit02/q2-photon stage 6: the worked case carries this bench\'s own numbers');
  }
}
