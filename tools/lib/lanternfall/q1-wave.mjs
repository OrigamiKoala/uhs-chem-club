/** q1-wave: every figure a stage grades is the planner's, read off the table. */
export default async function check(q1, { D, TABLE, near, same, holds, rig }) {
  const OPT = await import('../../../src/learn/table/kits/optics.js');
  const { start, end } = rig(q1);
  const ref = (t, id) => OPT.waveRead(t, id);
  // 1. the spare lamp on the dial the solution leaves it at makes more crests a second than Beacon 1; the dial it starts at does not
  {
    const e = end(0);
    holds(ref(e, 'l').plan.hz > ref(e, 'a').plan.hz, 'unit02/q1-wave stage 1: the lamp does not make more crests a second than Beacon 1');
    const placed = TABLE.runScript(start(0), [q1.SOLUTIONS[0][0]], { strict: true });
    holds(ref(placed, 'l').plan.hz <= ref(placed, 'a').plan.hz, 'unit02/q1-wave stage 1: the lamp already beats Beacon 1 on the dial it starts at');
    holds(ref(e, 'l').nm < ref(e, 'a').nm, 'unit02/q1-wave stage 1: more crests a second is not closer crests');
  }
  // 2. the guess: three tokens, no instrument, and the three guesses are the three things a player may believe
  {
    const t = start(1);
    same(t.prediction.tokens, ['red', 'violet', 'same'], 'unit02/q1-wave stage 2 (the guesses)');
    same(Object.keys(t.fixtures).length + Object.values(t.pieces).filter(p => !p.token).length, 0, 'unit02/q1-wave stage 2 (nothing else on the bench)');
    same(end(1).prediction.token, 'same', 'unit02/q1-wave stage 2 (the guess in the solution)');
  }
  // 3. both lamps are timed over one gap by the planner, the times are equal, and the answer is that neither is quicker
  {
    const e = end(2);
    const rows = e.recorder.rows;
    same(rows.map(r => r.label), ['Red lamp', 'Violet lamp'], 'unit02/q1-wave stage 3 (a timing for each lamp)');
    for (const r of rows) {
      near(D.pulseNs(r.x), r.y, 1e-9, 'unit02/q1-wave stage 3 (the pulse time is the planner\'s)');
      near(r.x / (r.y * 1e-9) / 1e8, D.LIGHT_SPEED / 1e8, 0.05, 'unit02/q1-wave stage 3 (gap over time is the speed of light, x 10^8)');
    }
    holds(rows[0].x === rows[1].x && rows[0].y === rows[1].y, 'unit02/q1-wave stage 3: red and violet are not timed over the same gap in the same time');
    same(q1.FIRST[e.fixtures.first.dials.n.value - 1], 'Same time', 'unit02/q1-wave stage 3 (the answer)');
    same(q1.FIRST[start(2).fixtures.first.dials.n.value - 1], 'Not set', 'unit02/q1-wave stage 3 (the answer dial starts unset)');
    for (const m of start(2).fixtures.rail.props.marks) near(D.pulseNs(m.metres) * 1e-9 * D.LIGHT_SPEED, m.metres, 0.03, `unit02/q1-wave stage 3 (the pulse over ${m.metres} m)`);
    holds(TABLE.apply(start(2), { run: 'rail' }).last.ok === false, 'unit02/q1-wave stage 3: a pulse fires with no lamp and no detectors');
    const noLamp = TABLE.runScript(start(2), [{ place: { piece: 'd1', to: 'slot:rail.m0' } }, { place: { piece: 'd2', to: 'slot:rail.m3' } }, { run: 'rail' }]);
    holds(noLamp.last.ok === false && noLamp.recorder.rows.length === 0, 'unit02/q1-wave stage 3: a pulse fires with no lamp in the holder');
    // the answer cannot be given before both lamps have been timed, nor from timings over two different gaps
    const st = q1.STAGES[2];
    const dial = { setDial: { fixture: 'first', dial: 'n', value: q1.FIRST.indexOf('Same time') + 1 } };
    const one = TABLE.runScript(start(2), [...q1.SOLUTIONS[2].slice(0, 4), dial], { strict: true });
    holds(st.check({ table: one }).ok === false, 'unit02/q1-wave stage 3: passes with one lamp timed');
    const twoGaps = TABLE.runScript(start(2), [...q1.SOLUTIONS[2].slice(0, 4), { place: { piece: 'd2', to: 'slot:rail.m2' } }, { place: { piece: 'violet', to: 'slot:rail.lamp' } }, { run: 'rail' }, dial], { strict: true });
    holds(st.check({ table: twoGaps }).ok === false, 'unit02/q1-wave stage 3: passes with the lamps timed over different gaps');
    const prompt = st.prompt;
    holds(typeof prompt === 'string' && prompt.split(/\s+/).length <= 25, 'unit02/q1-wave stage 3: the prompt is not a short sentence');
  }
  // 4. the rail runs from the lowest frequency to the highest, and each source's frequency is the planner's
  {
    const t = start(3);
    const ids = Object.values(t.pieces).map(p => p.id);
    same(ids.length, 5, 'unit02/q1-wave stage 4 (five sources)');
    const byHz = ids.slice().sort((a, b) => D.nmToHz(t.pieces[a].props.nm) - D.nmToHz(t.pieces[b].props.nm));
    same(end(3).zones.rail.order, byHz, 'unit02/q1-wave stage 4 (lowest frequency first)');
    same(byHz, q1.BY_FREQUENCY, 'unit02/q1-wave stage 4 (the quest\'s own order)');
    holds(t.zones.rail.order.join() !== byHz.join(), 'unit02/q1-wave stage 4: the rail starts in the answer\'s order');
    // the ruler reads every one of them, and the two visible lamps are among them (so the bench's misconception that invisible light is another thing fails)
    for (const id of ids) {
      const r = OPT.rulerRead(TABLE.runScript(t, [{ place: { piece: id, to: 'slot:ruler.src' } }], { strict: true }), 'ruler');
      same(r && r.nm, t.pieces[id].props.nm, `unit02/q1-wave stage 4 (the ruler reads ${id})`);
      const log = Math.log10(t.pieces[id].props.nm);
      holds(log >= -1 && log <= 10, `unit02/q1-wave stage 4: ${id} is off the ruler`);
    }
    const vis = ids.filter(id => D.isVisible(t.pieces[id].props.nm));
    same(vis.length, 2, 'unit02/q1-wave stage 4 (two lamps the eye can see)');
    holds(vis.every(id => byHz.indexOf(id) > 0 && byHz.indexOf(id) < byHz.length - 1), 'unit02/q1-wave stage 4: a visible lamp is at an end, so "violet is the highest" would pass');
  }
  // 5. the typed frequency is the speed of light over the lamp's wavelength; the worked case is another lamp and neither is on stage 1's dial
  {
    const t = start(4);
    const read = OPT.waveRead(t, 's');
    same(read.nm, q1.ASKED_NM, 'unit02/q1-wave stage 5 (the lamp on the screen)');
    near(Number(q1.SOLUTIONS[4][0].type.value), D.nmToHz(q1.ASKED_NM) / 1e14, 0.02, 'unit02/q1-wave stage 5 (the typed frequency)');
    holds(t.fixtures.s.props.rate === false, 'unit02/q1-wave stage 5: the screen prints the frequency that is asked for');
    const worked = q1.STAGES[4].briefing.worked.join(' ');
    holds(!worked.includes(String(q1.ASKED_NM)) && !worked.includes((D.nmToHz(q1.ASKED_NM) / 1e14).toFixed(2)), 'unit02/q1-wave stage 5: the worked case carries this bench\'s own numbers');
    const dial = start(0).fixtures.l.props.settings;
    holds(!dial.includes(q1.ASKED_NM) && !dial.includes(q1.WORKED_NM), 'unit02/q1-wave stage 5: a lamp whose frequency stage 1 printed');
  }
}
