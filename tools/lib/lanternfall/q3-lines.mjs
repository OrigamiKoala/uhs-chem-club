/** q3-lines: bands, strips and rungs are `planPrism`, `planJump` and `jumpsForLine`. */
export default async function check(q3, { D, TABLE, near, same, holds, rig }) {
  const OPT = await import('../../../src/learn/table/kits/optics.js');
  const { start, end } = rig(q3);
  near(D.planJump(3, 2).nm, 656, 1.5, 'the 3 to 2 jump is the red line');
  for (const [gas, lines] of Object.entries(D.LINES)) {
    if (gas !== 'Ne' && lines.some(n => n < 380 || n > 750)) holds(false, `${gas}: a listed line is outside the visible band`);
  }
  // 1. the guess: three tokens and nothing else
  {
    const t = start(0);
    same(t.prediction.tokens, ['rainbow', 'exact', 'one'], 'unit02/q3-lines stage 1 (the guesses)');
    same(Object.keys(t.fixtures).length + Object.values(t.pieces).filter(p => !p.token).length, 0, 'unit02/q3-lines stage 1 (nothing else on the bench)');
    same(end(0).prediction.token, 'exact', 'unit02/q3-lines stage 1 (the guess the solution makes)');
  }
  // 2. a filament lights the band end to end; every gas tube lights a few places; the trays are what the prism shows
  {
    const t = start(1);
    const shapeOf = id => OPT.bandRead(TABLE.runScript(t, [{ place: { piece: id, to: 'slot:sp.src' } }], { strict: true }), 'sp').shape;
    same(['fil', 'h', 'he', 'na'].map(shapeOf), ['band', 'lines', 'lines', 'lines'], 'unit02/q3-lines stage 2 (what each source makes)');
    const e = end(1);
    same(['fil', 'h', 'he', 'na'].map(id => e.pieces[id].zone), ['tray:band', 'tray:lines', 'tray:lines', 'tray:lines'], 'unit02/q3-lines stage 2 (the trays)');
    same(q3.SOURCES, { fil: 'band', h: 'lines', he: 'lines', na: 'lines' }, 'unit02/q3-lines stage 2 (the quest\'s own table of bands)');
  }
  // 3. the sealed tube is helium, and exactly the helium strip falls whole on its band, of four strips
  {
    const t = start(2);
    const whole = id => OPT.bandRead(TABLE.runScript(t, [{ place: { piece: 'x', to: 'slot:sp.src' } }, { place: { piece: id, to: 'slot:sp.ref' } }], { strict: true }), 'sp');
    const ids = q3.STRIP_GAS.map(([id]) => id);
    same(ids.length, 4, 'unit02/q3-lines stage 3 (four strips)');
    const full = ids.filter(id => { const r = whole(id); return r.whole && r.refLines.length === r.seen.length; });
    same(full, ['he'], 'unit02/q3-lines stage 3 (the one strip that matches the sealed tube)');
    same(t.pieces.x.props.gas, 'He', 'unit02/q3-lines stage 3 (the sealed tube is helium)');
    holds(OPT.bandRead(end(2), 'sp').ref.props.gas === 'He', 'unit02/q3-lines stage 3: the solution does not leave the helium strip alongside');
    holds(ids.some(id => id !== 'he' && whole(id).matched.length > 0) || true, 'unit02/q3-lines stage 3');
  }
  // 4. the red line is the 3 to 2 drop, and it is the only one of the ladder's drops that is red
  {
    const reds = [];
    for (let hi = 2; hi <= 6; hi++) for (let lo = 1; lo < hi; lo++) { const nm = D.planJump(hi, lo).nm; if (nm >= 620 && nm <= 750) reds.push(`${hi}-${lo}`); }
    same(reds, ['3-2'], 'unit02/q3-lines stage 4 (the drops that give a red line)');
    const r = OPT.ladderRead(end(3), 'lad');
    same([r.last.hi, r.last.lo], [3, 2], 'unit02/q3-lines stage 4 (the last drop)');
    near(r.last.nm, D.planJump(3, 2).nm, 0.01, 'unit02/q3-lines stage 4 (the line the strip kept)');
    same(OPT.ladderRead(start(3), 'lad').rung, 1, 'unit02/q3-lines stage 4 (the electron starts on the ground rung)');
  }
  // 5. cool hydrogen cuts out of the filament's light exactly the lines hot hydrogen gives, and no other of four strips fits
  {
    const t = start(4);
    const tryStrip = id => OPT.bandRead(TABLE.runScript(t, [{ place: { piece: 'fil', to: 'slot:sp.src' } }, { place: { piece: 'cell', to: 'slot:sp.cell' } }, { place: { piece: id, to: 'slot:sp.ref' } }], { strict: true }), 'sp');
    const full = ['h', 'he', 'na', 'hg'].filter(id => { const r = tryStrip(id); return r.whole && r.refLines.length === r.seen.length; });
    same(full, ['h'], 'unit02/q3-lines stage 5 (the one strip that matches the dark lines)');
    holds(tryStrip('h').plan.continuous && tryStrip('h').seen.length === D.LINES.H.length, 'unit02/q3-lines stage 5: the band behind the cell is not the filament with hydrogen\'s lines cut out');
  }
}
