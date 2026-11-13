/** q4-cloud: every count is the planner's, every graded figure is recomputed. */
export default async function check(q4, { TABLE, near, same, holds, rig }) {
  const O = await import('../../../src/learn/engine/orbitals.js');
  const CLD = await import('../../../src/learn/table/kits/cloud.js');
  const { start, end } = rig(q4);
  // 1. the guess: three tokens and nothing else
  {
    const t = start(0);
    same(t.prediction.tokens, ['ring', 'ball', 'lobes'], 'unit02/q4-cloud stage 1 (the guesses)');
    same(Object.keys(t.fixtures).length + Object.values(t.pieces).filter(p => !p.token).length, 0, 'unit02/q4-cloud stage 1 (nothing else on the bench)');
    same(end(0).prediction.token, 'ball', 'unit02/q4-cloud stage 1 (the guess the solution makes)');
  }
  // 2. four films of one area; the round one catches the most, for any seed, and the planet's ring catches the least of the three that are not the ball
  {
    for (const k of Object.keys(CLD.FILMS)) near(CLD.filmArea(k), CLD.FILM_AREA_PM2, CLD.FILM_AREA_PM2 * 0.03, `unit02/q4-cloud stage 2 (the ${k} film's area)`);
    for (const seed of [1, 2, 3, 4, 5]) {
      const pts = CLD.pointsOf('1s', seed).map(p => ({ a: p.x, b: p.y }));
      const caught = k => pts.filter(p => CLD.filmHolds(k, p.a * CLD.BOHR_PM, p.b * CLD.BOHR_PM)).length;
      const disc = caught('disc');
      for (const k of ['ring', 'lobes', 'hollow']) holds(disc >= caught(k) + 20, `unit02/q4-cloud stage 2: with seed ${seed} the round film does not clearly beat the ${k} film (${disc} v ${caught(k)})`);
    }
    const t = end(1);
    same(t.pieces.f2.zone, 'slot:a.film', 'unit02/q4-cloud stage 2 (the film on the plate)');
    same(t.pieces.f2.props.shape, 'disc', 'unit02/q4-cloud stage 2 (the film that is laid)');
    const caught = Object.keys(CLD.FILMS).map(k => CLD.catchOf(t, 'a', k));
    holds(CLD.filmRead(t, 'a').caught === Math.max(...caught), 'unit02/q4-cloud stage 2: the solution does not catch the most');
    holds(q4.STAGES[1].table.pieces.some(p => p.props.shape === 'ring'), 'unit02/q4-cloud stage 2: the planet\'s ring is not one of the outlines');
    // a plate builds and does not reshuffle: the first fifty of five hundred are the same fifty
    same(O.sampleOrbital('1s', 50, 1), CLD.pointsOf('1s', 1).slice(0, 50), 'unit02/q4-cloud stage 2 (the first fifty shots are the first fifty of five hundred)');
  }
  // 3. the strings that close are the ones a whole number of whose wavelengths go round
  {
    const t = end(2);
    for (const pm of q4.RING_STRINGS) {
      const fits = O.ringFits(pm, O.RING_CIRCUMFERENCE_PM).fits;
      same(t.pieces[`s${pm}`].zone, fits ? 'tray:closes' : 'tray:smears', `unit02/q4-cloud stage 3 (the ${pm} pm string)`);
    }
    same(q4.RING_STRINGS.filter(pm => O.ringFits(pm, O.RING_CIRCUMFERENCE_PM).fits), [332, 166, 111], 'unit02/q4-cloud stage 3 (the strings that close)');
    const on = TABLE.apply(start(2), { place: { piece: 's332', to: 'slot:track.tile' } });
    same(CLD.trackRead(on, 'track').fits, true, 'unit02/q4-cloud stage 3 (a string put on the track reads its own fit)');
  }
  // 4. exactly the views along the node plane leave a slice empty; the slab is across the line of sight
  {
    const c = end(3);
    const empty = [];
    for (let turn = 0; turn <= 11; turn++) for (let tilt = -3; tilt <= 3; tilt++) {
      let u = TABLE.apply(c, { setDial: { fixture: 'view', dial: 'turn', value: turn } });
      u = TABLE.apply(u, { setDial: { fixture: 'view', dial: 'tilt', value: tilt } });
      const r = CLD.plateRead(u, 'c');
      if (r.shown.length <= q4.EMPTY_SLICE * r.fired) empty.push(`${turn}:${tilt}`);
    }
    same(empty, ['0:0', '6:0'], 'unit02/q4-cloud stage 4 (the views whose slice is empty)');
    holds(CLD.plateRead(start(3), 'c').turn === 1 && CLD.plateRead(start(3), 'c').tilt === 1, 'unit02/q4-cloud stage 4: the view does not start oblique');
    holds(O.nodeRadii('1s').length === 0, 'unit02/q4-cloud stage 4: the first cloud has a node');
  }
  // 5. every card is sorted by the shape `orbitals.js` names
  {
    const t = end(4);
    const binFor = { 'two lobes': 'two', 'four lobes': 'four', 'two lobes and a ring': 'ring' };
    for (const id of ['ka', 'kb', 'kc', 'kd', 'ke']) same(t.pieces[id].zone, `tray:${binFor[O.shapeOf(t.pieces[id].props.orbital)]}`, `unit02/q4-cloud stage 5 (${t.pieces[id].label})`);
    same(['ka', 'kb', 'kc', 'kd', 'ke'].map(id => O.shapeOf(t.pieces[id].props.orbital)), ['two lobes', 'four lobes', 'two lobes and a ring', 'four lobes', 'four lobes'], 'unit02/q4-cloud stage 5 (the shapes)');
  }
}
