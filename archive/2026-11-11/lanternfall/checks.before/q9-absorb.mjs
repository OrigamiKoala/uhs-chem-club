/** q9-absorb: every reading is `planAbsorb`, every graded figure is recomputed. */
export default async function check(q9, { D, TABLE, near, same, holds, rig }) {
  const CUV = await import('../../../src/learn/table/kits/cuvette.js');
  const { start, end } = rig(q9);
  // A drop is a fixed strength: drops are concentration, and a cuvette holds no more than the bench's limit.
  same(CUV.concOf({ props: { drops: 3 } }), 0.006, 'unit02/q9-absorb (three drops)');
  {
    const t = start(3);
    let u = t;
    for (let k = 0; k < CUV.MAX_DROPS + 1; k++) u = TABLE.apply(u, { join: ['drop', 'b'] });
    same(u.pieces.b.props.drops, CUV.MAX_DROPS, 'unit02/q9-absorb (a full cuvette takes no more)');
    holds(u.last.ok === false || u.last.reason, 'unit02/q9-absorb: a seventh drop is not refused with a reason');
    const poured = TABLE.apply(TABLE.apply(t, { join: ['drop', 'b'] }), { join: ['empty', 'b'] });
    same(poured.pieces.b.props.drops, 0, 'unit02/q9-absorb (the empty tool pours a cuvette out)');
    const sealed = TABLE.apply(start(4), { join: ['drop', 'sealed'] });
    same(sealed.pieces.sealed.props.conc, 0.005, 'unit02/q9-absorb (a sealed sample takes no drops)');
  }
  // 1. the guess: three tokens and nothing else; the colour a blue solution looks is among them, and so is the one it takes out
  {
    const t = start(0);
    same(t.prediction.tokens, ['blue', 'orange', 'violet'], 'unit02/q9-absorb stage 1 (the guesses)');
    same(Object.keys(t.fixtures).length + Object.values(t.pieces).filter(p => !p.token).length, 0, 'unit02/q9-absorb stage 1 (nothing else on the bench)');
    same(end(0).prediction.token, 'orange', 'unit02/q9-absorb stage 1 (the guess the solution makes)');
    same(CUV.missingColour('cuso4').id, 'orange', 'unit02/q9-absorb stage 1 (the colour the strip shows missing is the guess)');
    holds(D.SOLUTES.cuso4.looks === 'blue', 'unit02/q9-absorb stage 1: copper must look blue');
  }
  // 2. the colour missing from copper's light is the one its peak sits in, and the strip is darkest there
  {
    const dark = [...Array(371)].map((_, i) => 380 + i).sort((x, y) => CUV.gotThrough('cuso4', 0.01, x) - CUV.gotThrough('cuso4', 0.01, y))[0];
    same(CUV.colourOfNm(dark).id, 'orange', 'unit02/q9-absorb stage 2 (the darkest part of the strip)');
    same(end(1).pieces['c-orange'].zone, 'slot:taken', 'unit02/q9-absorb stage 2 (the chip)');
    same(CUV.COLOURS.map(c => c.id), ['violet', 'blue', 'green', 'yellow', 'orange', 'red'], 'unit02/q9-absorb stage 2 (the six chips)');
  }
  // 3. the largest reading of the sweep is the graded setting
  {
    const sweep = CUV.COPPER_SWEEP.map(n => D.planAbsorb('cuso4', n, 1, q9.COPPER));
    same(Math.round(end(2).fixtures.sp.dials.nm.value), sweep.indexOf(Math.max(...sweep)) + 1, 'unit02/q9-absorb stage 3 (the setting)');
    same(CUV.COPPER_SWEEP[4], 630, 'unit02/q9-absorb stage 3 (the peak is at 630 nm)');
    same(end(2).recorder.rows.map(r => r.x), [550, 600, 630, 680], 'unit02/q9-absorb stage 3 (the sheet plots against wavelength)');
  }
  // 4. doubling the strength doubles the reading
  {
    const t = end(3);
    near(CUV.absorbOf(t.pieces.b), 2 * CUV.absorbOf(t.pieces.a), 1e-9, 'unit02/q9-absorb stage 4 (twice the reading)');
    same(t.pieces.b.props.drops, 4, 'unit02/q9-absorb stage 4 (Cuvette B)');
    same(t.recorder.rows.map(r => [r.x, r.y]), [[4, 0.1], [8, 0.2]], 'unit02/q9-absorb stage 4 (the sheet: A, B)');
    holds(!Object.keys(start(3).fetch || {}).length, 'unit02/q9-absorb stage 4: the stage sends the player to a field point');
  }
  // 5. the standards fall on a line through zero, the sealed reading is one more point on it, and the marker reads its concentration back
  {
    const t = end(4);
    const rows = t.recorder.rows;
    same(rows.map(r => r.x), [2, 4, 6], 'unit02/q9-absorb stage 5 (the standards)');
    const slope = rows[0].y / rows[0].x;
    holds(rows.every(r => Math.abs(r.y / r.x - slope) < 1e-6), 'unit02/q9-absorb stage 5: the standards are not on a line through zero');
    const sealed = D.planAbsorb('cuso4', 630, 1, q9.SEALED_CONC);
    near(sealed / slope, 5, 1e-3, 'unit02/q9-absorb stage 5 (the sealed reading read back off the line)');
    near(t.fixtures.conc.dials.value.value, 5, 1e-9, 'unit02/q9-absorb stage 5 (5 mmol/L)');
    holds(t.pieces.sealed.props.read === sealed, 'unit02/q9-absorb stage 5: the sealed cuvette\'s face does not keep its reading');
    holds(!t.recorder.rows.some(r => /SEALED/.test(r.label || '')), 'unit02/q9-absorb stage 5: the sealed sample is plotted, which would print its strength');
    holds(t.recorder.tool?.kind === 'straightedge', 'unit02/q9-absorb stage 5: the solution lays no straightedge');
  }
  // Permanganate takes in near 525 nm, as measured.
  {
    const pm = [450, 500, 525, 550, 600].map(n => D.planAbsorb('kmno4', n, 1, 0.001));
    same(pm.indexOf(Math.max(...pm)), 2, 'unit02/q9-absorb (permanganate peaks at 525 nm)');
  }
}
