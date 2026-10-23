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
    holds(r.brightness < f.dials.brightness.value && r.nm < f.props.settings[0], 'unit02/q2-photon stage 2: the solution is not dimmer and bluer than the start');
  }
  // 3. exactly one first setting frees an electron, and the dial finds it
  {
    const p = sweep(2, 'Na');
    const first = p.findIndex(x => x.count > 0) + 1;
    same(end(2).fixtures.cell.dials.colour.value, first, 'unit02/q2-photon stage 3 (the first freeing setting)');
    holds(p.slice(0, first - 1).every(x => x.count === 0) && p.slice(first).every(x => x.count > 0), 'unit02/q2-photon stage 3: electrons do not leave at every setting from the threshold on');
  }
  // 4. brightness sets the number and not the speed
  {
    const f = start(3).fixtures.cell;
    const lo = D.planPhotocell('Na', 400, f.dials.brightness.value);
    const e = OPT.cellRead(end(3), 'cell');
    same(e.count, lo.count * 2, 'unit02/q2-photon stage 4 (twice the count)');
    same(e.speed, lo.speed, 'unit02/q2-photon stage 4 (the same speed)');
    holds(lo.count > 0, 'unit02/q2-photon stage 4: the lamp frees nothing at the start');
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
}
