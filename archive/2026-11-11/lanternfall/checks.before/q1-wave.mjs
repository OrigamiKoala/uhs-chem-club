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
  // 3. a pulse is timed between two detectors by the planner for the first lamp, and the reading is that speed
  {
    const e = end(2);
    const rows = e.recorder.rows;
    same(rows.map(r => r.label), ['Red lamp'], 'unit02/q1-wave stage 3 (a timing for the first lamp)');
    near(D.pulseNs(rows[0].x), rows[0].y, 1e-9, 'unit02/q1-wave stage 3 (the pulse time is the planner\'s)');
    near(rows[0].x / (rows[0].y * 1e-9) / 1e8, D.LIGHT_SPEED / 1e8, 0.05, 'unit02/q1-wave stage 3 (gap over time is the speed of light, x 10^8)');
    same(e.fixtures.speed.dials.n.value, 3, 'unit02/q1-wave stage 3 (the reading is that speed)');
    holds(start(2).fixtures.speed.dials.n.value !== 3, 'unit02/q1-wave stage 3: the reading starts on the answer');
    for (const m of start(2).fixtures.rail.props.marks) near(D.pulseNs(m.metres) * 1e-9 * D.LIGHT_SPEED, m.metres, 0.03, `unit02/q1-wave stage 3 (the pulse over ${m.metres} m)`);
    holds(TABLE.apply(start(2), { run: 'rail' }).last.ok === false, 'unit02/q1-wave stage 3: a pulse fires with no lamp and no detectors');
    const noLamp = TABLE.runScript(start(2), [{ place: { piece: 'd1', to: 'slot:rail.m0' } }, { place: { piece: 'd2', to: 'slot:rail.m3' } }, { run: 'rail' }]);
    holds(noLamp.last.ok === false && noLamp.recorder.rows.length === 0, 'unit02/q1-wave stage 3: a pulse fires with no lamp in the holder');
    // the guess comes back in the prompt, whichever it was
    const prompt = q1.STAGES[2].prompt;
    holds(typeof prompt === 'string' && prompt.split(/\s+/).length <= 25, 'unit02/q1-wave stage 3: the prompt is not a short sentence');
  }
  // 4. the other lamp is timed down the rail; red and violet cross the same gap in the same time
  {
    const e = end(3);
    const rows = e.recorder.rows;
    same(rows.map(r => r.label), ['Violet lamp'], 'unit02/q1-wave stage 4 (a timing for the other lamp)');
    near(D.pulseNs(rows[0].x), rows[0].y, 1e-9, 'unit02/q1-wave stage 4 (the pulse time is the planner\'s)');
    near(rows[0].x / (rows[0].y * 1e-9) / 1e8, D.LIGHT_SPEED / 1e8, 0.05, 'unit02/q1-wave stage 4 (gap over time is the speed of light, x 10^8)');
    same(e.fixtures.speed.dials.n.value, 3, 'unit02/q1-wave stage 4 (the reading is that speed)');
    holds(start(3).fixtures.speed.dials.n.value !== 3, 'unit02/q1-wave stage 4: the reading starts on the answer');
    const e2 = end(2);
    holds(e2.recorder.rows[0].x === rows[0].x && e2.recorder.rows[0].y === rows[0].y, 'unit02/q1-wave: red and violet are not timed over the same gap in the same time');
    const prompt = q1.STAGES[3].prompt;
    holds(typeof prompt === 'string' && prompt.split(/\s+/).length <= 25, 'unit02/q1-wave stage 4: the prompt is not a short sentence');
  }
  // 5. the rail runs from the lowest frequency to the highest, and each source's frequency is the planner's
  {
    const t = start(4);
    const ids = Object.values(t.pieces).map(p => p.id);
    same(ids.length, 5, 'unit02/q1-wave stage 5 (five sources)');
    const byHz = ids.slice().sort((a, b) => D.nmToHz(t.pieces[a].props.nm) - D.nmToHz(t.pieces[b].props.nm));
    same(end(4).zones.rail.order, byHz, 'unit02/q1-wave stage 5 (lowest frequency first)');
    same(byHz, q1.BY_FREQUENCY, 'unit02/q1-wave stage 5 (the quest\'s own order)');
    holds(t.zones.rail.order.join() !== byHz.join(), 'unit02/q1-wave stage 5: the rail starts in the answer\'s order');
    // the ruler reads every one of them, and the two visible lamps are among them (so the bench's misconception that invisible light is another thing fails)
    for (const id of ids) {
      const r = OPT.rulerRead(TABLE.runScript(t, [{ place: { piece: id, to: 'slot:ruler.src' } }], { strict: true }), 'ruler');
      same(r && r.nm, t.pieces[id].props.nm, `unit02/q1-wave stage 5 (the ruler reads ${id})`);
      const log = Math.log10(t.pieces[id].props.nm);
      holds(log >= -1 && log <= 10, `unit02/q1-wave stage 5: ${id} is off the ruler`);
    }
    const vis = ids.filter(id => D.isVisible(t.pieces[id].props.nm));
    same(vis.length, 2, 'unit02/q1-wave stage 5 (two lamps the eye can see)');
    holds(vis.every(id => byHz.indexOf(id) > 0 && byHz.indexOf(id) < byHz.length - 1), 'unit02/q1-wave stage 5: a visible lamp is at an end, so "violet is the highest" would pass');
  }
}
