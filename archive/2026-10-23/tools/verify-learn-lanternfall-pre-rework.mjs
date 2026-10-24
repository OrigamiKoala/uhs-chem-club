// Archived 2026-10-23. The Lanternfall block of tools/verify-learn.mjs as it stood before the rework (stages cut to one click each).
// Not imported or run. See archive/2026-10-23/README.md.
/* ------------------------------------------------------------------
   EVERY FIGURE A LANTERNFALL STAGE GRADES AGAINST IS RECOMPUTED FROM THE REAL
   TABLES. An answer authored as a literal can drift from the instrument that
   teaches it; one recomputed here from `lightdata.js` cannot.
   ------------------------------------------------------------------ */
{
  const before = failures;
  const D = await import('../src/learn/engine/lightdata.js');
  const q1 = getQuest('unit02', 'q1-wave') && await getQuest('unit02', 'q1-wave').module?.();
  const q2 = getQuest('unit02', 'q2-photon') && await getQuest('unit02', 'q2-photon').module?.();
  const q3 = getQuest('unit02', 'q3-lines') && await getQuest('unit02', 'q3-lines').module?.();
  const q9 = getQuest('unit02', 'q9-absorb') && await getQuest('unit02', 'q9-absorb').module?.();
  const near = (a, b, tol, what) => { if (Math.abs(a - b) > tol) fail(`${what}: graded ${a}, the real figure is ${b.toFixed(3)}`); };
  const COLOUR_NAMES = CUV => CUV.COLOURS.map(c => c.id);
  const STAGE_STATE = (q, i, script) => TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title) && { table: TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title), bins: {}, order: [] };

  if (q1) {
    // THE FIRST LANTERNFALL TABLE (`q1-wave`, the optics kit): every figure a stage grades is the planner's, read off the table.
    const OPT = await import('../src/learn/table/kits/optics.js');
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const start = i => TABLE.createTable(q1.STAGES[i].table, q1.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q1.SOLUTIONS[i], { strict: true });
    const ref = (t, id) => OPT.waveRead(t, id);
    // 1. the lamp on the dial the solution leaves it at makes more crests a second than Sample A; the dial it starts at does not
    {
      const e = end(0);
      holds(ref(e, 'l').plan.hz > ref(e, 'a').plan.hz, 'unit02/q1-wave stage 1: the lamp does not make more crests a second than Sample A');
      const placed = TABLE.runScript(start(0), [q1.SOLUTIONS[0][2]], { strict: true });
      holds(ref(placed, 'l').plan.hz <= ref(placed, 'a').plan.hz, 'unit02/q1-wave stage 1: the lamp already beats Sample A on the dial it starts at');
      holds(ref(e, 'l').plan.hz > ref(e, 'a').plan.hz && ref(e, 'l').nm < ref(e, 'a').nm, 'unit02/q1-wave stage 1: more crests a second is not closer crests');
      // the flume's strip is a water wave: its own crest spacing and count
      const f = TABLE.runScript(start(0), [{ fetch: 'flume' }, q1.SOLUTIONS[0][1]], { strict: true });
      same(ref(f, 'l').kind, 'water', 'unit02/q1-wave stage 1 (the flume strip reads as a water wave)');
    }
    // 2. twice the crest spacing is half the crests a second, and the dial offers exactly that setting
    {
      const e = end(1);
      same(ref(e, 'l').nm, ref(e, 'a').nm * 2, 'unit02/q1-wave stage 2 (twice the crest spacing)');
      near(ref(e, 'l').plan.hz * 2, ref(e, 'a').plan.hz, ref(e, 'a').plan.hz * 1e-9, 'unit02/q1-wave stage 2 (half the crests a second)');
      holds(q1.STAGES[1].table.fixtures[1].props.settings.includes(ref(e, 'a').nm * 2), 'unit02/q1-wave stage 2: the dial has no setting at twice the spacing');
    }
    // 3. a pulse is timed between two detectors by the planner, and the reading the solution sets is the speed that gap and time give
    {
      const e = end(2);
      const row = e.recorder.rows[0];
      holds(Boolean(row), 'unit02/q1-wave stage 3: firing the pulse recorded nothing');
      near(D.pulseNs(row.x), row.y, 1e-9, 'unit02/q1-wave stage 3 (the pulse time is the planner\'s)');
      near(row.x / (row.y * 1e-9) / 1e8, D.LIGHT_SPEED / 1e8, 0.05, 'unit02/q1-wave stage 3 (gap over time is the speed of light, x 10^8)');
      same(e.fixtures.speed.dials.n.value, 3, 'unit02/q1-wave stage 3 (the reading is that speed)');
      holds(start(2).fixtures.speed.dials.n.value !== 3, 'unit02/q1-wave stage 3: the reading starts on the answer');
      for (const m of start(2).fixtures.rail.props.marks) near(D.pulseNs(m.metres) * 1e-9 * D.LIGHT_SPEED, m.metres, 0.03, `unit02/q1-wave stage 3 (the pulse over ${m.metres} m)`);
    }
    // 4. the two reference lamps give one product, and the reading is the frequency that product gives at 600 nm
    {
      const t = start(3);
      for (const id of ['r1', 'r2']) near((D.nmToHz(t.pieces[id].props.nm) * t.pieces[id].props.nm * 1e-9) / 1e8, 3, 0.01, `unit02/q1-wave stage 4 (${id}'s product is the speed of light)`);
      same(end(3).fixtures.freq.dials.n.value, 5, 'unit02/q1-wave stage 4 (the reading)');
      near(5, D.nmToHz(600) / 1e14, 0.01, 'unit02/q1-wave stage 4 (frequency of 600 nm)');
      holds(start(3).fixtures.freq.dials.n.value !== 5, 'unit02/q1-wave stage 4: the reading starts on the answer');
    }
    // 5. the rail runs from the lowest frequency to the highest, and a lamp's frequency is the planner's
    {
      const t = start(4);
      const lamps = ['a', 'b', 'c', 'd'].map(id => [id, t.pieces[id].props.nm]);
      const lowest = lamps.slice().sort((x, y) => y[1] - x[1]).map(x => x[0]).join();
      same(end(4).zones.rail.order.join(), lowest, 'unit02/q1-wave stage 5 (lowest frequency first)');
      for (let k = 1; k < lamps.length; k++) holds(D.nmToHz(lamps.slice().sort((x, y) => y[1] - x[1])[k][1]) > D.nmToHz(lamps.slice().sort((x, y) => y[1] - x[1])[k - 1][1]), 'unit02/q1-wave stage 5: a shorter wavelength is not a higher frequency');
    }
    // 6. each lamp is under the strip the planner says picks it up, and each strip is the one the band lights
    {
      const t = start(5);
      const e = end(5);
      for (const id of ['a', 'b', 'c']) {
        const nm = t.pieces[id].props.nm;
        same(e.pieces[id].zone, `tray:${OPT.pickedUpBy(nm) === 'eye' ? 'eye' : OPT.pickedUpBy(nm) === 'infrared' ? 'ir' : 'uv'}`, `unit02/q1-wave stage 6 (lamp ${id} at ${nm} nm)`);
        const read = OPT.bandRead(TABLE.runScript(t, [{ place: { piece: id, to: 'slot:band.src' } }], { strict: true }), 'band');
        same([read.uv, read.ir, read.shape === 'lines'], [OPT.pickedUpBy(nm) === 'ultraviolet', OPT.pickedUpBy(nm) === 'infrared', OPT.pickedUpBy(nm) === 'eye'], `unit02/q1-wave stage 6 (what the band lights for ${nm} nm)`);
      }
    }
    // 7. a source's frequency is the speed of light over its wavelength, and it stands under the tray that figure is printed on
    {
      const t = start(6);
      const e = end(6);
      for (const id of ['radio', 'micro', 'xray']) {
        const hz = D.nmToHz(t.pieces[id].props.nm);
        const label = t.zones.trays[e.pieces[id].zone.slice(5)].label;
        const m = /^([\d.]+) x 10\^(\d+)/.exec(label);
        const printed = Number(m[1]) * 10 ** Number(m[2]);
        holds(Math.abs(printed / hz - 1) < 0.05, `unit02/q1-wave stage 7: ${id} is under "${label}" but its frequency is ${hz.toExponential(2)}`);
      }
      holds(['f8', 'f9', 'f18'].every(id => t.zones.trays[id]), 'unit02/q1-wave stage 7: a tray is missing');
    }
    // 8. the lamp in the slot makes 5.1 x 10^14 a second; the other does not
    {
      const t = start(7);
      const e = end(7);
      const chosen = e.pieces[OPT.seated(e, 'match').id];
      near(D.nmToHz(chosen.props.nm) / 1e14, 5.1, 0.06, 'unit02/q1-wave stage 8 (the chosen lamp\'s frequency)');
      const other = ['a', 'b'].find(id => id !== chosen.id);
      holds(Math.abs(D.nmToHz(t.pieces[other].props.nm) / 1e14 - 5.1) > 0.3, 'unit02/q1-wave stage 8: both lamps are near 5.1');
      holds(q1.STAGES[7].table.fixtures[0].props.rate === false, 'unit02/q1-wave stage 8: the screen prints the frequency, so the stage is only a reading');
    }
  }
  if (q2) {
    // THE SECOND LANTERNFALL TABLE (`q2-photon`, the optics kit): the cup and the meters are `planPhotocell`, read off the table.
    const OPT = await import('../src/learn/table/kits/optics.js');
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const start = i => TABLE.createTable(q2.STAGES[i].table, q2.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q2.SOLUTIONS[i], { strict: true });
    const sweep = (i, metal, brightness = 3) => q2.STAGES[i].table.fixtures[0].props.settings.map(n => D.planPhotocell(metal, n, brightness));
    const wake = ['cs', 'na', 'zn'].map(m => D.thresholdNm(m[0].toUpperCase() + m[1]));
    if (!(wake[0] > wake[1] && wake[1] > wake[2])) fail('unit02/q2-photon: the work functions do not order cesium < sodium < zinc');
    // 1. red at full brightness frees nothing; the solution frees something, and it is not the brightest lamp
    {
      const t = start(0);
      const f = t.fixtures.cell;
      holds(!D.planPhotocell('Na', f.props.settings[f.dials.colour.value - 1], f.dials.brightness.value).freed, 'unit02/q2-photon stage 1: the lamp already frees electrons where it starts');
      const r = OPT.cellRead(end(0), 'cell');
      holds(r.freed && r.metal === 'Na', 'unit02/q2-photon stage 1: the solution does not free electrons from sodium');
      holds(r.brightness < f.dials.brightness.value && r.nm < f.props.settings[0], 'unit02/q2-photon stage 1: the solution is not dimmer and bluer than the start');
    }
    // 2. exactly one first setting frees an electron, and the dial finds it
    {
      const p = sweep(1, 'Na');
      const first = p.findIndex(x => x.count > 0) + 1;
      same(end(1).fixtures.cell.dials.colour.value, first, 'unit02/q2-photon stage 2 (the first freeing setting)');
      holds(p.slice(0, first - 1).every(x => x.count === 0) && p.slice(first).every(x => x.count > 0), 'unit02/q2-photon stage 2: electrons do not leave at every setting from the threshold on');
    }
    // 3. brightness sets the number and not the speed
    {
      const f = start(2).fixtures.cell;
      const lo = D.planPhotocell('Na', 400, f.dials.brightness.value);
      const e = OPT.cellRead(end(2), 'cell');
      same(e.count, lo.count * 2, 'unit02/q2-photon stage 3 (twice the count)');
      same(e.speed, lo.speed, 'unit02/q2-photon stage 3 (the same speed)');
      holds(lo.count > 0, 'unit02/q2-photon stage 3: the lamp frees nothing at the start');
    }
    // 4. frequency sets the speed and not the number; one setting reads the speed the prompt names
    {
      const p = sweep(3, 'Na');
      const freeing = p.filter(x => x.count > 0);
      holds(freeing.every((x, k) => k === 0 || x.speed > freeing[k - 1].speed), 'unit02/q2-photon stage 4: the speed does not rise with frequency');
      holds(new Set(freeing.map(x => x.count)).size === 1, 'unit02/q2-photon stage 4: the count changes with frequency');
      const eights = p.map((x, k) => [Math.abs(x.speed - 8) < 0.05, k + 1]).filter(([ok]) => ok).map(([, k]) => k);
      same(eights, [end(3).fixtures.cell.dials.colour.value], 'unit02/q2-photon stage 4 (the one setting that reads 8 x 10^5 m/s)');
      holds(/8 x 10\^5/.test(q2.STAGES[3].prompt), 'unit02/q2-photon stage 4: the prompt does not name the speed the check grades');
      same(end(3).recorder.rows.length, 1, 'unit02/q2-photon stage 4 (a reading was recorded)');
    }
    // 5. the plaque's worked check is the real photon energy at 539 nm and the reading is the energy at 500 nm
    {
      const lines = start(4).fixtures.card.props.lines;
      const worked = D.photonJoules(539) / 1e-19;
      holds(lines.some(t => t.includes(worked.toFixed(2))), 'unit02/q2-photon stage 5: the worked check is not the real photon energy at 539 nm');
      holds(lines.some(t => t.includes(`${(D.PLANCK / 1e-34).toFixed(3)} x 10^-34`)), 'unit02/q2-photon stage 5: the plaque does not print the real h');
      holds(lines.some(t => t.includes(`${(D.nmToHz(500) / 1e14).toFixed(2)} x 10^14`)), 'unit02/q2-photon stage 5: the plaque does not print the frequency at 500 nm');
      near(end(4).fixtures.energy.dials.n.value, D.photonJoules(500) / 1e-19, 0.26, 'unit02/q2-photon stage 5 (photon energy at 500 nm)');
      holds(start(4).fixtures.energy.dials.n.value !== end(4).fixtures.energy.dials.n.value, 'unit02/q2-photon stage 5: the reading starts on the answer');
    }
    // 6. the plate that wakes at the lowest frequency has the loosest grip, and the rail runs that way
    {
      const t = start(5);
      const settings = t.fixtures.cell.props.settings;
      const first = m => D.planPhotocell(m, 1, 1) && settings.findIndex(n => D.planPhotocell(m, n, 3).freed) + 1;
      const order = ['Cs', 'Na', 'Zn'].sort((x, y) => first(x) - first(y)).map(m => m.toLowerCase());
      same(end(5).zones.rail.order, order, 'unit02/q2-photon stage 6 (loosest grip first)');
      holds(['Cs', 'Na', 'Zn'].every(m => first(m) > 0), 'unit02/q2-photon stage 6: a plate never wakes on the dial');
      holds(new Set(['Cs', 'Na', 'Zn'].map(first)).size === 3, 'unit02/q2-photon stage 6: two plates wake at the same setting');
      same(end(5).recorder.rows.map(r => r.label), ['Cs', 'Na', 'Zn'], 'unit02/q2-photon stage 6 (a reading for each plate)');
      for (const m of ['Cs', 'Na', 'Zn']) near(D.METALS[m].work, D.METALS[m].work, 0, `${m}'s work function is the table's`);
    }
    // 7. a lamp is in the first tray exactly when its photons carry the work function of zinc
    {
      const t = start(6);
      const e = end(6);
      for (const id of ['a', 'b', 'c']) {
        const frees = D.planPhotocell('Zn', t.pieces[id].props.nm, t.fixtures.cell.props.brightness).freed;
        same(e.pieces[id].zone, frees ? 'tray:yes' : 'tray:no', `unit02/q2-photon stage 7 (lamp ${id} at ${t.pieces[id].props.nm} nm)`);
        const read = OPT.cellRead(TABLE.runScript(t, [{ place: { piece: id, to: 'slot:cell.lamp' } }], { strict: true }), 'cell');
        same(read.freed, frees, `unit02/q2-photon stage 7 (what the cup does for lamp ${id})`);
      }
      holds(['a', 'b', 'c'].some(id => D.planPhotocell('Zn', t.pieces[id].props.nm, 5).freed) && ['a', 'b', 'c'].some(id => !D.planPhotocell('Zn', t.pieces[id].props.nm, 5).freed), 'unit02/q2-photon stage 7: every lamp is in one tray');
    }
    // 8. red frees nothing from zinc at any brightness, and the prediction is that
    {
      const t = start(7);
      const settings = t.fixtures.cell.props.settings;
      for (let b = 1; b <= 5; b++) holds(!D.planPhotocell('Zn', settings[0], b).freed, `unit02/q2-photon stage 8: red frees zinc at brightness ${b}`);
      holds(D.planPhotocell('Zn', settings[3], 3).freed, 'unit02/q2-photon stage 8: not even the shortest setting frees zinc');
      same(end(7).prediction.token, 'none', 'unit02/q2-photon stage 8 (the prediction)');
      holds(end(7).prediction.tested, 'unit02/q2-photon stage 8: the solution never ran the test');
    }
  }
  if (q3) {
    // THE THIRD LANTERNFALL TABLE (`q3-lines`, the optics kit): bands, strips and rungs are `planPrism`, `planJump` and `jumpsForLine`.
    const OPT = await import('../src/learn/table/kits/optics.js');
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const start = i => TABLE.createTable(q3.STAGES[i].table, q3.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q3.SOLUTIONS[i], { strict: true });
    near(D.planJump(3, 2).nm, 656, 1.5, 'the 3 to 2 jump is the red line');
    for (const [gas, lines] of Object.entries(D.LINES)) {
      if (gas !== 'Ne' && lines.some(n => n < 380 || n > 750)) fail(`${gas}: a listed line is outside the visible band`);
    }
    // 1. a filament lights the band end to end, a gas tube in a few places
    {
      const t = start(0);
      const shapeOf = id => OPT.bandRead(TABLE.runScript(t, [{ place: { piece: id, to: 'slot:sp.src' } }], { strict: true }), 'sp').shape;
      same([shapeOf('fil'), shapeOf('tube')], ['band', 'lines'], 'unit02/q3-lines stage 1 (what each source makes)');
      same([end(0).pieces.fil.zone, end(0).pieces.tube.zone], ['tray:band', 'tray:lines'], 'unit02/q3-lines stage 1 (the trays)');
    }
    // 2. the sealed tube is helium, and exactly the helium strip falls whole on its band
    {
      const t = start(1);
      const whole = id => OPT.bandRead(TABLE.runScript(t, [{ place: { piece: 'x', to: 'slot:sp.src' } }, { place: { piece: id, to: 'slot:sp.ref' } }], { strict: true }), 'sp');
      const full = ['h', 'he', 'na'].filter(id => { const r = whole(id); return r.whole && r.refLines.length === r.seen.length; });
      same(full, ['he'], 'unit02/q3-lines stage 2 (the one strip that matches the sealed tube)');
      same(t.pieces.x.props.gas, 'He', 'unit02/q3-lines stage 2 (the sealed tube is helium)');
      holds(OPT.bandRead(end(1), 'sp').ref.props.gas === 'He', 'unit02/q3-lines stage 2: the solution does not leave the helium strip alongside');
    }
    // 3. cool hydrogen cuts out of the filament's light exactly the lines hot hydrogen gives, and no other strip fits
    {
      const t = start(2);
      const tryStrip = id => OPT.bandRead(TABLE.runScript(t, [{ place: { piece: 'fil', to: 'slot:sp.src' } }, { place: { piece: 'cell', to: 'slot:sp.cell' } }, { place: { piece: id, to: 'slot:sp.ref' } }], { strict: true }), 'sp');
      const full = ['h', 'he', 'na'].filter(id => { const r = tryStrip(id); return r.whole && r.refLines.length === r.seen.length; });
      same(full, ['h'], 'unit02/q3-lines stage 3 (the one strip that matches the dark lines)');
      holds(tryStrip('h').plan.continuous && tryStrip('h').seen.length === D.LINES.H.length, 'unit02/q3-lines stage 3: the band behind the cell is not the filament with hydrogen\'s lines cut out');
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
    // 5. the line's energy is hc over its wavelength, and the marker is set to it
    {
      const v = end(4).fixtures.energy.dials.n.value;
      near(v, D.photonJoules(486) / 1e-19, 0.06, 'unit02/q3-lines stage 5 (486 nm line)');
      near(D.planJump(4, 2).nm, 486, 1.5, 'unit02/q3-lines stage 5 (the 4 to 2 drop makes the 486 nm line)');
      near(D.photonJoules(656) / 1e-19, 3.03, 0.01, 'unit02/q3-lines stage 5 (the worked line)');
      holds(start(4).fixtures.energy.dials.n.value !== v, 'unit02/q3-lines stage 5: the reading starts on the answer');
    }
    // 6. five to two makes 434 nm, and the solution made the drop it predicted
    {
      const e = end(5);
      near(Number(e.prediction.token), D.planJump(5, 2).nm, 1.5, 'unit02/q3-lines stage 6 (5 to 2 jump)');
      holds(OPT.ladderRead(e, 'lad').lines.some(n => Math.abs(n - D.planJump(5, 2).nm) < 1), 'unit02/q3-lines stage 6: the strip did not keep the drop the stage asks about');
      holds(q3.STAGES[5].table.prediction ? true : false, 'unit02/q3-lines stage 6: no prediction slot');
      const distinct = new Set(['410', '434', '486', '656'].map(Number).map(n => Math.round(D.planJump(n === 410 ? 6 : n === 434 ? 5 : n === 486 ? 4 : 3, 2).nm)));
      same(distinct.size, 4, 'unit02/q3-lines stage 6 (four tokens, four different drops)');
    }
    // 7. one electron on the top of the ladder has left: the top is above every rung
    {
      same(OPT.ladderRead(end(6), 'lad').out, true, 'unit02/q3-lines stage 7 (the electron is off the ladder)');
      near(-D.bohrJoules(1) / 1e-18, 2.18, 0.001, 'unit02/q3-lines stage 7 (the whole climb)');
    }
    // 8. a line goes in the first tray exactly when some pair of rungs makes it
    {
      const t = start(7);
      const e = end(7);
      for (const id of ['c486', 'c588', 'c447']) {
        const nm = t.pieces[id].props.nm;
        const makes = D.jumpsForLine(nm).length > 0;
        same(e.pieces[id].zone, makes ? 'tray:yes' : 'tray:no', `unit02/q3-lines stage 8 (the ${nm} nm line)`);
      }
      holds(['c486', 'c588', 'c447'].some(id => D.jumpsForLine(t.pieces[id].props.nm).length) && ['c486', 'c588', 'c447'].some(id => !D.jumpsForLine(t.pieces[id].props.nm).length), 'unit02/q3-lines stage 8: every line goes in one tray');
      for (const nm of D.LINES.He) holds(D.jumpsForLine(nm).length === 0, `unit02/q3-lines stage 8: a drop on hydrogen's ladder makes helium's ${nm} nm line`);
      holds(D.jumpsForLine(486).some(j => j.hi === 4 && j.lo === 2), 'unit02/q3-lines stage 8: the 4 to 2 drop does not make 486 nm');
    }
  }
  if (q9) {
    // THE NINTH LANTERNFALL TABLE (`q9-absorb`, the cuvette kit): every reading is `planAbsorb`, every graded figure is recomputed.
    const CUV = await import('../src/learn/table/kits/cuvette.js');
    const same9 = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds9 = (c, what) => { if (!c) fail(what); };
    const start9 = i => TABLE.createTable(q9.STAGES[i].table, q9.STAGES[i].title);
    const end9 = i => TABLE.runScript(start9(i), q9.SOLUTIONS[i], { strict: true });
    // A drop is a fixed strength: drops are concentration, and a cuvette holds no more than the bench's limit.
    same9(CUV.concOf({ props: { drops: 3 } }), 0.006, 'unit02/q9-absorb (three drops)');
    {
      const t = start9(4);
      let u = t;
      for (let k = 0; k < CUV.MAX_DROPS + 1; k++) u = TABLE.apply(u, { join: ['drop', 'b'] });
      same9(u.pieces.b.props.drops, CUV.MAX_DROPS, 'unit02/q9-absorb (a full cuvette takes no more)');
      holds9(u.last.ok === false || u.last.reason, 'unit02/q9-absorb: a seventh drop is not refused with a reason');
      const poured = TABLE.apply(TABLE.apply(t, { join: ['drop', 'b'] }), { join: ['empty', 'b'] });
      same9(poured.pieces.b.props.drops, 0, 'unit02/q9-absorb (the empty tool pours a cuvette out)');
      const sealed = TABLE.apply(start9(7), { join: ['drop', 'sealed'] });
      same9(sealed.pieces.sealed.props.conc, 0.005, 'unit02/q9-absorb (a sealed sample takes no drops)');
    }
    // 1. each kind of light does what the planner says to the molecule
    {
      const r = k => CUV.planRegion('HCl', k).motion;
      same9([r('microwave'), r('infrared'), r('uv-visible')], ['spins', 'vibrates', 'jumps'], 'unit02/q9-absorb stage 1 (the three motions)');
      const t = end9(0);
      same9(['microwave', 'infrared', 'uv'].map(k => Object.values(t.pieces).find(p => p.zone === `slot:${k}`).id), ['spins', 'stretches', 'jumps'], 'unit02/q9-absorb stage 1 (the slots)');
      same9([1, 2, 3].map(v => CUV.regionRead(TABLE.apply(start9(0), { setDial: { fixture: 'sp', dial: 'region', value: v } }), 'sp').motion), ['spins', 'vibrates', 'jumps'], 'unit02/q9-absorb stage 1 (the dial shows each motion)');
    }
    // 2. the readings are on the right sides of the visible band
    {
      const t = end9(1);
      for (const id of ['r1', 'r2', 'r3']) {
        const nm = t.pieces[id].props.nm;
        same9(t.pieces[id].zone, `tray:${{ microwave: 'microwave', infrared: 'infrared', ultraviolet: 'ultraviolet' }[D.regionOf(nm)]}`, `unit02/q9-absorb stage 2 (${id})`);
      }
      same9(['r1', 'r2', 'r3'].map(id => CUV.fmtWave(t.pieces[id].props.nm)), ['3 cm', '30 \u00b5m', '300 nm'], 'unit02/q9-absorb stage 2 (the printed wavelengths)');
      holds9(D.VISIBLE.min === 380 && D.VISIBLE.max === 750, 'unit02/q9-absorb stage 2: the plate prints the wrong visible band');
    }
    // 3. the colour missing from copper's light is the one its peak sits in, and the strip is darkest there
    {
      same9(CUV.missingColour('cuso4').id, 'orange', 'unit02/q9-absorb stage 3 (the missing colour)');
      const dark = [...Array(371)].map((_, i) => 380 + i).sort((x, y) => CUV.gotThrough('cuso4', 0.01, x) - CUV.gotThrough('cuso4', 0.01, y))[0];
      same9(CUV.colourOfNm(dark).id, 'orange', 'unit02/q9-absorb stage 3 (the darkest part of the strip)');
      same9(end9(2).pieces['c-orange'].zone, 'slot:taken', 'unit02/q9-absorb stage 3 (the chip)');
      same9(COLOUR_NAMES(CUV), ['violet', 'blue', 'green', 'yellow', 'orange', 'red'], 'unit02/q9-absorb stage 3 (the six chips)');
    }
    // 4. the largest reading of the sweep is the graded setting
    {
      const sweep = CUV.COPPER_SWEEP.map(n => D.planAbsorb('cuso4', n, 1, q9.COPPER));
      same9(Math.round(end9(3).fixtures.sp.dials.nm.value), sweep.indexOf(Math.max(...sweep)) + 1, 'unit02/q9-absorb stage 4 (the setting)');
      same9(CUV.COPPER_SWEEP[4], 630, 'unit02/q9-absorb stage 4 (the peak is at 630 nm)');
      same9(end9(3).recorder.rows.map(r => r.x), [550, 600, 630, 680], 'unit02/q9-absorb stage 4 (the sheet plots against wavelength)');
    }
    // 5. doubling the strength doubles the reading; the origin is the lake's
    {
      const t = end9(4);
      near(CUV.absorbOf(t.pieces.b), 2 * CUV.absorbOf(t.pieces.a), 1e-9, 'unit02/q9-absorb stage 5 (twice the reading)');
      same9(t.pieces.b.props.drops, 4, 'unit02/q9-absorb stage 5 (Cuvette B)');
      same9(t.recorder.rows.map(r => [r.x, r.y]), [[0, 0], [4, 0.1], [8, 0.2]], 'unit02/q9-absorb stage 5 (the sheet: lake water, A, B)');
      holds9(q9.STAGES[4].table.fetch.length === 1 && start9(4).pieces.lake.hidden, 'unit02/q9-absorb stage 5: the lake water is not a field item');
      holds9(q9.STAGES[4].check(STAGE_STATE(q9, 4, [[]])).ok === false, 'unit02/q9-absorb stage 5: an untouched bench passes without the field item');
    }
    // 6. twice the path doubles the reading
    {
      near(D.planAbsorb('cuso4', 630, 2, 0.008), 2 * D.planAbsorb('cuso4', 630, 1, 0.008), 1e-3, 'unit02/q9-absorb stage 6 (twice the path)');
      same9(CUV.PATHS[Math.round(end9(5).fixtures.sp.dials.path.value) - 1], 2, 'unit02/q9-absorb stage 6 (the path)');
    }
    // 7. both doubled makes the reading four times: a product, not a sum
    {
      const t = end9(6);
      near(CUV.absorbOf(t.pieces.b, 630, 2) / CUV.absorbOf(t.pieces.a, 630, 1), 4, 1e-6, 'unit02/q9-absorb stage 7 (four times)');
      same9(t.prediction.token, 'x4', 'unit02/q9-absorb stage 7 (the prediction)');
      holds9(t.prediction.tested, 'unit02/q9-absorb stage 7: the solution does not test its prediction');
    }
    // 8. the standards fall on a line through zero, the sealed reading is one more point on it, and the marker reads its concentration back
    {
      const t = end9(7);
      const rows = t.recorder.rows;
      same9(rows.map(r => r.x), [2, 4, 6], 'unit02/q9-absorb stage 8 (the standards)');
      const slope = rows[0].y / rows[0].x;
      holds9(rows.every(r => Math.abs(r.y / r.x - slope) < 1e-6), 'unit02/q9-absorb stage 8: the standards are not on a line through zero');
      const sealed = D.planAbsorb('cuso4', 630, 1, q9.SEALED_CONC);
      near(sealed / slope, 5, 1e-3, 'unit02/q9-absorb stage 8 (the sealed reading read back off the line)');
      near(t.fixtures.conc.dials.value.value, 5, 1e-9, 'unit02/q9-absorb stage 8 (5 mmol/L)');
      holds9(t.pieces.sealed.props.read === sealed, 'unit02/q9-absorb stage 8: the sealed cuvette\'s face does not keep its reading');
      holds9(!t.recorder.rows.some(r => r.label === 'SEALED SAMPLE'), 'unit02/q9-absorb stage 8: the sealed sample is plotted, which would print its strength');
      holds9(t.recorder.tool?.kind === 'straightedge', 'unit02/q9-absorb stage 8: the solution lays no straightedge');
    }
    // Permanganate takes in near 525 nm, as measured.
    {
      const pm = [450, 500, 525, 550, 600].map(n => D.planAbsorb('kmno4', n, 1, 0.001));
      same9(pm.indexOf(Math.max(...pm)), 2, 'unit02/q9-absorb (permanganate peaks at 525 nm)');
    }
  }
  const q4 = getQuest('unit02', 'q4-cloud') && await getQuest('unit02', 'q4-cloud').module?.();
  if (q4) {
    const O = await import('../src/learn/engine/orbitals.js');
    // The pictures are drawn from the real wavefunction: each radial density integrates to one.
    for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2]]) {
      let sum = 0;
      for (let r = 0; r < 140; r += 0.002) sum += O.radialPdf(n, l, r) * 0.002;
      near(sum, 1, 0.005, `orbitals: radial density of n=${n}, l=${l} integrates to one`);
    }
    const mean = id => { const p = O.sampleOrbital(id, 3000, 1); return p.reduce((a, q) => a + Math.hypot(q.x, q.y, q.z), 0) / p.length; };
    near(mean('1s'), 1.5, 0.08, 'orbitals: the 1s cloud\'s mean distance (bohr)');
    near(mean('2s'), 6, 0.3, 'orbitals: the 2s cloud\'s mean distance (bohr)');
    // The 2s cloud has an empty shell at its node; the 2pz cloud has an empty plane.
    const shell = O.sampleOrbital('2s', 3000, 1).filter(p => Math.abs(Math.hypot(p.x, p.y, p.z) - 2) < 0.1).length;
    const near1s = O.sampleOrbital('1s', 3000, 1).filter(p => Math.abs(Math.hypot(p.x, p.y, p.z) - 2) < 0.1).length;
    if (shell > near1s * 0.2) fail('orbitals: the 2s cloud is not empty at its node');
    const plane = O.sampleOrbital('2pz', 3000, 1).filter(p => Math.abs(p.z) < 0.05).length;
    if (plane > 12) fail(`orbitals: the 2pz cloud has ${plane} dots on its node plane`);
    // The ring: only whole numbers of wavelengths fit.
    for (const n of [1, 2, 3]) {
      if (!O.ringFits(O.RING_CIRCUMFERENCE_PM / n, O.RING_CIRCUMFERENCE_PM).fits) fail(`orbitals: ${n} whole wavelengths should fit the ring`);
    }
    if (O.ringFits(O.RING_CIRCUMFERENCE_PM / 2.5, O.RING_CIRCUMFERENCE_PM).fits) fail('orbitals: two and a half wavelengths must not fit the ring');
    // THE FOURTH LANTERNFALL TABLE (`q4-cloud`, the cloud kit): every count is the planner's, every graded figure is recomputed.
    const CLD = await import('../src/learn/table/kits/cloud.js');
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const start = i => TABLE.createTable(q4.STAGES[i].table, q4.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q4.SOLUTIONS[i], { strict: true });
    // 1. a ring that holds about nine in ten of fifty-plus shots, and a smaller one that does not
    {
      const r = CLD.ringRead(end(0), 'a');
      holds(r.fired === 500 && r.share >= q4.NINE_IN_TEN[0] && r.share <= q4.NINE_IN_TEN[1], 'unit02/q4-cloud stage 1: the solution\'s ring does not hold nine in ten of the shots');
      const small = CLD.ringRead(TABLE.apply(end(0), { setDial: { fixture: 'a', dial: 'ring', value: 40 } }), 'a');
      holds(small.share < q4.NINE_IN_TEN[0], 'unit02/q4-cloud stage 1: a ring a third as wide already holds nine in ten');
      const few = CLD.ringRead(TABLE.runScript(start(0), [{ run: 'a' }, { setDial: { fixture: 'a', dial: 'ring', value: 140 } }], { strict: true }), 'a');
      holds(few.fired === 1, 'unit02/q4-cloud stage 1: one press does not fire exactly one shot');
      const fifty = TABLE.runScript(start(0), [{ setDial: { fixture: 'a', dial: 'burst', value: 2 } }, { run: 'a' }], { strict: true });
      holds(CLD.shotsOf(fifty, 'a') === 50, 'unit02/q4-cloud stage 1: the middle exposure is not fifty shots');
      // the first fifty of five hundred are the same fifty (a plate builds, it does not reshuffle)
      const pts = CLD.pointsOf('1s', 1);
      same(O.sampleOrbital('1s', 50, 1), pts.slice(0, 50), 'unit02/q4-cloud stage 1 (the first fifty shots are the first fifty of five hundred)');
    }
    // 2. four films of one area; the round one catches the most, for any seed
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
    // 4. the shell with no shots is the 2s node, found among shots on both sides of it, and the first cloud has shots there
    {
      const t = end(3);
      const b = CLD.ringRead(t, 'b');
      const want = CLD.nodePm('2s');
      near(b.rpm, want, q4.NODE_TOLERANCE_PM, 'unit02/q4-cloud stage 4 (the ring at the node)');
      same(b.count, 0, 'unit02/q4-cloud stage 4 (shots in the node\'s shell)');
      holds(CLD.ringRead(t, 'a').count >= 1, 'unit02/q4-cloud stage 4: the first cloud is as empty at that distance as the second');
      const around = d => CLD.ringRead(TABLE.apply(t, { setDial: { fixture: 'b', dial: 'ring', value: b.rpm + d } }), 'b').count;
      holds(around(-30) > 0 && around(30) > 0, 'unit02/q4-cloud stage 4: the empty shell is not between shots');
      holds(O.nodeRadii('1s').length === 0, 'unit02/q4-cloud stage 4: the first cloud has a node');
    }
    // 5. exactly the views along the node plane leave a slice empty; the slab is across the line of sight
    {
      const c = end(4);
      const empty = [];
      for (let turn = 0; turn <= 11; turn++) for (let tilt = -3; tilt <= 3; tilt++) {
        let u = TABLE.apply(c, { setDial: { fixture: 'view', dial: 'turn', value: turn } });
        u = TABLE.apply(u, { setDial: { fixture: 'view', dial: 'tilt', value: tilt } });
        const r = CLD.plateRead(u, 'c');
        if (r.shown.length <= q4.EMPTY_SLICE * r.fired) empty.push(`${turn}:${tilt}`);
      }
      same(empty, ['0:0', '6:0'], 'unit02/q4-cloud stage 5 (the views whose slice is empty)');
      holds(CLD.plateRead(start(4), 'c').turn === 1 && CLD.plateRead(start(4), 'c').tilt === 1, 'unit02/q4-cloud stage 5: the view does not start oblique');
    }
    // 6. three axes, four clouds, one direction twice
    {
      const t = end(5);
      same(['c1', 'c2', 'c3', 'c4'].map(id => CLD.axisOf(t.pieces[id].props.orbital)).sort(), ['x', 'y', 'z', 'z'], 'unit02/q4-cloud stage 6 (the four clouds\' axes)');
      for (const a of ['x', 'y', 'z']) {
        const id = ['c1', 'c2', 'c3', 'c4'].find(x => t.pieces[x].zone === `slot:peg-${a}`);
        same(CLD.axisOf(t.pieces[id].props.orbital), a, `unit02/q4-cloud stage 6 (the cloud on the ${a} peg)`);
      }
    }
    // 7. every card is sorted by the shape `orbitals.js` names
    {
      const t = end(6);
      const binFor = { 'two lobes': 'two', 'four lobes': 'four', 'two lobes and a ring': 'ring' };
      for (const id of ['ka', 'kb', 'kc', 'kd', 'ke']) same(t.pieces[id].zone, `tray:${binFor[O.shapeOf(t.pieces[id].props.orbital)]}`, `unit02/q4-cloud stage 7 (${t.pieces[id].label})`);
      same(['ka', 'kb', 'kc', 'kd', 'ke'].map(id => O.shapeOf(t.pieces[id].props.orbital)), ['two lobes', 'four lobes', 'two lobes and a ring', 'four lobes', 'four lobes'], 'unit02/q4-cloud stage 7 (the shapes)');
    }
    // 8. the trade is a trade: the product of the two blurs is the same at every level, and it sits above the floor
    {
      const levels = [1, 2, 3, 4, 5].map(l => CLD.blurAt(l));
      for (const b of levels) near(b.dx * b.dv, levels[0].dx * levels[0].dv, 2500, 'unit02/q4-cloud stage 8 (the product of the blurs at every level)');
      holds(levels[4].dx < levels[0].dx && levels[4].dv > levels[0].dv, 'unit02/q4-cloud stage 8: a sharper position does not blur the speed more');
      // hbar / 2 m_e, in pm km/s: 1.0546e-34 / (2 * 9.109e-31) m^2/s = 5.79e-5 m^2/s = 5.79e4 pm km/s
      holds(levels[0].dx * levels[0].dv >= 5.79e4, 'unit02/q4-cloud stage 8: the gauge\'s product sits below the uncertainty floor');
      same(CLD.trackReason().includes('position and a speed'), true, 'unit02/q4-cloud stage 8 (the track key gives the bench\'s reason)');
      const t = TABLE.apply(start(7), { run: 'track' });
      holds(t.last.ok === false && t.last.reason === CLD.trackReason(), 'unit02/q4-cloud stage 8: Track Electron does not refuse with the reason');
    }
    // The turned cloud is the same cloud: a turn changes nothing but the side it is seen from.
    const CP = await import('../src/learn/engine/cloudplate.js');
    const pts = O.sampleOrbital('2pz', 400, 1);
    const flat = CP.projectDots(pts, 400, 'xy', false);
    const home = CP.projectDots(pts, 400, 'turn', false, { yaw: 0, pitch: 0 });
    if (!flat.every((q, i) => Math.abs(q.a - home[i].a) < 1e-9 && Math.abs(q.b - home[i].b) < 1e-9 && Math.abs(q.c - home[i].c) < 1e-9)) {
      fail('unit02/q4-cloud: a plate turned to zero does not show the xy view');
    }
    const turned = CP.projectDots(pts, 400, 'turn', false, CP.DEFAULT_VIEW);
    const r2 = q => q.a * q.a + q.b * q.b + q.c * q.c;
    if (!turned.every((q, i) => Math.abs(r2(q) - (pts[i].x ** 2 + pts[i].y ** 2 + pts[i].z ** 2)) < 1e-9)) {
      fail('unit02/q4-cloud: turning a cloud changed a dot\'s distance from the nucleus');
    }
    // A quarter turn about the vertical lays the x axis along the line of sight.
    const quarter = CP.turnPoint({ x: 1, y: 0, z: 0 }, { yaw: Math.PI / 2, pitch: 0 });
    if (Math.abs(quarter.a) > 1e-9 || Math.abs(Math.abs(quarter.c) - 1) > 1e-9) fail('unit02/q4-cloud: a quarter turn does not bring the x axis end-on');
    // Slicing a turned cloud keeps the slab across the line of sight.
    const sliced = CP.projectDots(pts, 400, 'turn', true, CP.DEFAULT_VIEW);
    if (!sliced.length || sliced.some(q => Math.abs(q.c) > CP.SLICE_HALF + 1e-9)) fail('unit02/q4-cloud: the slice of a turned cloud is not a slab across the view');
  }
  {
    // The lead lines: sparse by design. Every built bench has an opening stake, no boss has any, and none points at a stage that is not there.
    const { STAGE_STORY } = await import('../src/learn/engine/stage-story.js');
    for (const [id, lines] of Object.entries(STAGE_STORY)) {
      const q = quests.find(x => x.key.endsWith(`/${id}`));
      if (!q) { fail(`stage-story.js: "${id}" is not a quest on the road`); continue; }
      if (id.startsWith('boss-')) fail(`stage-story.js: ${id} is a boss, and a boss's nameplate and intent line are its whole story budget`);
      for (const n of Object.keys(lines)) {
        if (!(Number(n) >= 1 && Number(n) <= q.stageCount)) fail(`stage-story.js: ${id} has a line for stage ${n}, which does not exist`);
      }
    }
    for (const q of quests) {
      if (!q.module || q.key.includes('/boss-')) continue;
      const id = q.key.replace(/^.*\//, '');
      if (!STAGE_STORY[id] || !Object.keys(STAGE_STORY[id]).length) {
        // Not every bench needs a stake; the ones with none say so by name, so a new bench cannot slip through unread.
        if (!NO_LEAD.has(id)) fail(`stage-story.js: ${id} has no lead line and is not listed as a bench that deliberately has none`);
      }
    }
  }
  {
    // The readings board painted on the 3D bench is drawn off the frame's own log and canvases.
    const { paintReadings, readingsSignature, hasReadings, BOARD } = await import('../src/learn/engine/bench-readings.js');
    const { makeCtx } = await import('./lib/ctx-stub.mjs');
    const snap = {
      columns: [{ key: 'a', label: 'Molecules made' }, { key: 'b', label: 'Total weight' }],
      rows: Array.from({ length: 14 }, (_, i) => ({ a: i, b: `${(54 + i * 0).toFixed(1)}` })),
      pictures: [{ id: 'device', canvas: { width: 360, height: 120 } }, { id: 'trend', canvas: { width: 280, height: 140 } }]
    };
    for (const [name, sn] of [['log and pictures', snap], ['log only', { ...snap, pictures: [] }], ['pictures only', { ...snap, rows: [] }]]) {
      const ctx = makeCtx(BOARD.px, BOARD.py);
      try { paintReadings(ctx, BOARD.px, BOARD.py, sn); } catch (err) { fail(`readings board (${name}) throws while drawing: ${err && err.message}`); continue; }
      if (ctx.stats.calls < 4) fail(`readings board (${name}) drew almost nothing`);
      if (ctx.stats.nan) fail(`readings board (${name}) drew ${ctx.stats.nan} NaN coordinate(s)`);
      if (ctx.stats.maxX > BOARD.px * 1.5 || ctx.stats.maxY > BOARD.py * 1.5) fail(`readings board (${name}) drew off the board`);
    }
    // The newest row is always on the board, and nothing is invented: every figure drawn came from the log.
    const ctx = makeCtx(BOARD.px, BOARD.py);
    paintReadings(ctx, BOARD.px, BOARD.py, snap);
    if (!ctx.stats.text.includes('13')) fail('readings board: the newest log row is not on the board');
    if (hasReadings({ columns: [], rows: [], pictures: [] }) || readingsSignature({ rows: [] }) !== '') fail('readings board: an empty log should show nothing');
    ok('the readings board is drawn from the log and the cards\' canvases, and shows the newest row');
  }
  const q6 = getQuest('unit02', 'q6-filling') && await getQuest('unit02', 'q6-filling').module?.();
  const q7 = getQuest('unit02', 'q7-pes') && await getQuest('unit02', 'q7-pes').module?.();
  const q8 = getQuest('unit02', 'q8-trends') && await getQuest('unit02', 'q8-trends').module?.();
  const q5 = getQuest('unit02', 'q5-numbers') && await getQuest('unit02', 'q5-numbers').module?.();
  const EL = await import('../src/learn/engine/electrons.js');
  if (q5) {
    // THE FIFTH LANTERNFALL TABLE (`q5-numbers`, the address and filling kit): the rules are `electrons.js`'s, every graded figure is recomputed.
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const SHL = await import('../src/learn/table/kits/shells.js');
    const O5 = await import('../src/learn/engine/orbitals.js');
    const start = i => TABLE.createTable(q5.STAGES[i].table, q5.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), q5.SOLUTIONS[i], { strict: true });
    // every set the stage calls impossible is, and every other is possible; the finder and the rules agree
    for (const [k, set] of Object.entries(q5.CHECKS.SETS)) {
      if (EL.findRoom(set).exists !== EL.validAddress(set)) fail(`unit02/q5-numbers: the finder and the rules disagree about set ${k}`);
      const why = SHL.whyNoRoom(set);
      if ((why === null) !== EL.validAddress(set)) fail(`unit02/q5-numbers: the refusal's reason and the rules disagree about set ${k}`);
    }
    same(Object.entries(q5.CHECKS.SETS).filter(([, s]) => !EL.validAddress(s)).map(([k]) => k), ['b', 'c'], 'unit02/q5-numbers stage 8 (the sets that cannot exist)');
    // 1. the distance the lit row prints is the real mean distance of its cloud, and floor 2 is the one that reaches about 300 pm
    for (const [id, n, l] of [['1s', 1, 0], ['2s', 2, 0], ['2p', 2, 1], ['3s', 3, 0]]) {
      const pts = O5.sampleOrbital(id === '2p' ? '2pz' : id, 3000, 1);
      const mean = pts.reduce((a, q) => a + Math.hypot(q.x, q.y, q.z), 0) / pts.length * O5.BOHR_PM;
      near(SHL.reachPm(n, l), mean, mean * 0.08 + 10, `unit02/q5-numbers stage 1 (the ${id} cloud's reach in pm)`);
    }
    const reaches = [1, 2, 3].map(n => SHL.reachPm(n, 0));
    same(reaches.map(r => Math.abs(r - 300)).indexOf(Math.min(...reaches.map(r => Math.abs(r - 300)))) + 1, 2, 'unit02/q5-numbers stage 1 (the floor whose s row reaches about 300 pm)');
    same(SHL.addressOfFinder(end(0), 'addr').n, 2, 'unit02/q5-numbers stage 1 (the graded floor)');
    // 2. floor 2 offers s and p and nothing more
    for (let l = 0; l <= 3; l++) same(EL.findRoom({ n: 2, l, ml: 0 }).exists, l <= 1, `unit02/q5-numbers stage 2 (suite type ${l} on floor 2)`);
    same([0, 1, 2, 3].map(l => end(1).pieces[`l${l}`].zone), ['tray:lights', 'tray:lights', 'tray:none', 'tray:none'], 'unit02/q5-numbers stage 2 (the trays)');
    // 3. the address in the prompt lights the box the graded electron stands in
    {
      const room = EL.findRoom({ n: 3, l: 2, ml: 1 });
      same([room.row, room.idx], ['3d', 3], 'unit02/q5-numbers stage 3 (the room the address names)');
      same(SHL.rackOf(end(2), 'rack'), { '3d:3': 'u' }, 'unit02/q5-numbers stage 3 (what the rack holds)');
      const lit = SHL.finderLight(end(2), 'addr');
      same([lit.box.row, lit.box.idx], ['3d', 3], 'unit02/q5-numbers stage 3 (the box the finder lights)');
      holds(EL.boxesOf(2) === 5, 'unit02/q5-numbers: a d row does not have five boxes');
    }
    // 4. a box takes one arrow of each direction, and the rack refuses a second of the same
    {
      const t0 = start(3);
      const b = id => `piece:${SHL.boxPieceId('rack', '1s', 0)}`;
      const once = TABLE.apply(t0, { place: { piece: 'up', to: b() } });
      const twice = TABLE.apply(once, { place: { piece: 'up', to: b() } });
      holds(twice.last.joined === false && /one|each|most/i.test(twice.last.reason || ''), 'unit02/q5-numbers stage 4: a second arrow the same way is not refused with a reason');
      same(SHL.rackOf(twice, 'rack'), { '1s:0': 'u' }, 'unit02/q5-numbers stage 4 (the refused arrow stays out)');
      same(SHL.rackOf(end(3), 'rack'), { '1s:0': 'ud' }, 'unit02/q5-numbers stage 4 (a pair in one box)');
    }
    // 5. exactly one pair of the four shares all four numbers, and the rack refuses whichever of them comes second
    {
      const dup = Object.entries(q5.CHECKS.FOUR_ELECTRONS);
      const pair = dup.flatMap(([a, x], i) => dup.slice(i + 1).filter(([, y]) => EL.sameAddress(x, y)).map(([b]) => a + b));
      same(pair, ['ac'], 'unit02/q5-numbers stage 5 (the pair that shares all four numbers)');
      const t = end(4);
      same(['ta', 'tb', 'tc', 'td'].map(id => Boolean(t.pieces[id].props.placed) && !t.pieces[id].zone), [true, true, false, true], 'unit02/q5-numbers stage 5 (the three on the rack)');
      same(t.pieces.tc.zone, 'tray:no', 'unit02/q5-numbers stage 5 (the refused electron in the tray)');
      const swap = TABLE.runScript(start(4), [
        { place: { piece: 'tc', to: `piece:${SHL.boxPieceId('rack', '2p', 1)}` } }, { place: { piece: 'ta', to: `piece:${SHL.boxPieceId('rack', '2p', 1)}` } }
      ], { strict: true });
      holds(swap.last.joined === false && /four numbers/.test(swap.last.reason), 'unit02/q5-numbers stage 5: placing C first does not make A the refused one, with the rule as its reason');
    }
    // 6. the third shell is nine boxes of two, and the marker is what the board counts
    {
      const t = end(5);
      same(Object.values(t.pieces).filter(p => p.kind === 'box').length, 9, 'unit02/q5-numbers stage 6 (boxes in the third shell)');
      same(SHL.readOf(t, 'rack').total, EL.shellCapacity(3), 'unit02/q5-numbers stage 6 (electrons the full shell holds)');
      same(t.fixtures.count.dials.n.value, EL.shellCapacity(3), 'unit02/q5-numbers stage 6 (the marker)');
      holds(q5.STAGES[5].table.fixtures.find(f => f.id === 'count').dials.n.value !== 18, 'unit02/q5-numbers stage 6: the marker starts on the answer');
    }
    // 7. the ringed box is where the graded address points, and its arrow is the graded bunk
    {
      const ringed = q5.STAGES[6].table.pieces.find(p => p.props?.target);
      const room7 = EL.findRoom(q5.CHECKS.RINGED);
      same([room7.row, room7.idx], [ringed.props.row, ringed.props.idx], 'unit02/q5-numbers stage 7 (the ringed box)');
      same(SHL.rackOf(start(6), 'rack')[`${ringed.props.row}:${ringed.props.idx}`], 'u', 'unit02/q5-numbers stage 7 (the arrow in the ringed box)');
      same(q5.CHECKS.RINGED.ms, 0.5, 'unit02/q5-numbers stage 7 (the bunk the arrow names)');
      const n7 = EL.rackFor(7);
      for (const k of new Set([...Object.keys(n7), ...Object.keys(SHL.rackOf(start(6), 'rack'))])) same(SHL.rackOf(start(6), 'rack')[k], n7[k], `unit02/q5-numbers stage 7 (nitrogen's box ${k})`);
    }
    // 8. every listed electron that has a room stands, and every other is refused with the rule
    {
      const t = end(7);
      same(['ta', 'tb', 'tc', 'td'].map(id => Boolean(t.pieces[id].props.placed) && !t.pieces[id].zone), [true, false, false, true], 'unit02/q5-numbers stage 8 (the electrons that stand)');
      same(['tb', 'tc'].map(id => t.pieces[id].zone), ['tray:no', 'tray:no'], 'unit02/q5-numbers stage 8 (the electrons with no room)');
      const refused = TABLE.apply(start(7), { place: { piece: 'tb', to: `piece:${SHL.boxPieceId('rack', '3d', 0)}` } });
      holds(refused.last.joined === false && Boolean(refused.last.reason), 'unit02/q5-numbers stage 8: an address with no room is not refused with a reason');
    }
  }
  if (q6) {
    // The ground states the stages grade against, and the magnet's real counts.
    const r6 = EL.readRack(EL.rackFor(6));
    if (r6.config !== EL.configString(EL.groundConfig(6)) || !r6.laddered) fail('unit02/q6-filling stage 1: carbon\'s rack does not read as its ground state');
    if (EL.unpairedOfConfig(EL.groundConfig(6)) !== EL.MEASURED.C) fail('the magnet\'s count for carbon disagrees with Hund\'s rule');
    for (const [sym, m] of Object.entries(EL.MEASURED)) {
      if (/[+]/.test(sym)) continue;
      if (EL.unpairedOfConfig(EL.groundConfig(EL.zOf(sym))) !== m) fail(`the magnet's measured count for ${sym} disagrees with its ground-state configuration`);
    }
    // THE SIXTH LANTERNFALL TABLE (`q6-filling`, the address and filling kit): every graded rack is `electrons.js`'s own reading.
    const SHL = await import('../src/learn/table/kits/shells.js');
    const same6 = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds6 = (c, what) => { if (!c) fail(what); };
    const start6 = i => TABLE.createTable(q6.STAGES[i].table, q6.STAGES[i].title);
    const end6 = i => TABLE.runScript(start6(i), q6.SOLUTIONS[i], { strict: true });
    const miss6 = i => TABLE.runScript(start6(i), q6.MISSES[i], { strict: true });
    // 1. carbon's six electrons, lowest rows first
    same6(SHL.readOf(end6(0), 'rack').counts, EL.groundConfig(6), 'unit02/q6-filling stage 1 (carbon\'s rack)');
    holds6(SHL.readOf(end6(0), 'rack').laddered, 'unit02/q6-filling stage 1: the graded rack is not laddered');
    holds6(!SHL.readOf(miss6(0), 'rack').laddered && SHL.readOf(miss6(0), 'rack').total === 6, 'unit02/q6-filling stage 1: the miss is not six electrons with a lower row left open');
    // 2. Hund: carbon's p electrons in separate boxes pull as hard as the sample; paired in one box they do not
    {
      const t = end6(1);
      same6(SHL.rackPull(t, 'rack'), EL.MEASURED.C, 'unit02/q6-filling stage 2 (the rack\'s pull)');
      same6(EL.unpairedOfConfig(EL.groundConfig(6)), EL.MEASURED.C, 'unit02/q6-filling stage 2 (Hund\'s rule and the magnet agree for carbon)');
      holds6(SHL.rackPull(miss6(1), 'rack') !== EL.MEASURED.C, 'unit02/q6-filling stage 2: paired p electrons already match the magnet');
      same6(SHL.rackOf(start6(1), 'rack'), EL.rackFor(4), 'unit02/q6-filling stage 2 (the 1s and 2s electrons already in place)');
      holds6(TABLE.apply(start6(1), { place: { piece: 'lift', to: `piece:${SHL.boxPieceId('rack', '1s', 0)}` } }).last.joined === false, 'unit02/q6-filling stage 2: a locked electron can be lifted out');
      same6(TABLE.apply(t, { run: 'msample' }).fixtures.msample.dials.pull.value, 1 + EL.MEASURED.C, 'unit02/q6-filling stage 2 (Test Sample)');
    }
    // 3. oxygen's configuration, as the rack writes it
    {
      const t = end6(2);
      same6(SHL.readOf(t, 'rack').config, EL.configString(EL.groundConfig(8)), 'unit02/q6-filling stage 3 (oxygen\'s configuration)');
      same6(t.pieces.p4.label, SHL.readOf(t, 'rack').config, 'unit02/q6-filling stage 3 (the card in the slot)');
      same6(t.pieces.p4.zone, 'slot:reads', 'unit02/q6-filling stage 3 (the slot)');
      const cards = Object.values(start6(2).pieces).filter(p => p.kind === 'ccard').map(p => p.label);
      same6(cards.filter(c => c === EL.configString(EL.groundConfig(8))).length, 1, 'unit02/q6-filling stage 3 (exactly one card reads what the rack reads)');
    }
    // 4. potassium's last electron goes in 4s, below 3d
    same6(SHL.readOf(end6(3), 'rack').counts, EL.groundConfig(19), 'unit02/q6-filling stage 4 (potassium\'s rack)');
    holds6(EL.LADDER.findIndex(r => r.id === '4s') < EL.LADDER.findIndex(r => r.id === '3d'), 'unit02/q6-filling stage 4: 4s is not below 3d on the ladder');
    same6(q6.ROWS.indexOf('4s') < q6.ROWS.indexOf('3d'), true, 'unit02/q6-filling stage 4 (the rack\'s rows put 4s below 3d)');
    // 5. iron in short form
    {
      const t = end6(4);
      same6(SHL.readOf(t, 'rack').short, EL.shortString(EL.groundConfig(26)), 'unit02/q6-filling stage 5 (iron in short form)');
      same6(t.pieces.ar.label, '[Ar] 4s² 3d⁶', 'unit02/q6-filling stage 5 (the card)');
      same6(t.fixtures.core.dials.core.value, 1, 'unit02/q6-filling stage 5 (the core switch)');
      same6(SHL.readOf(t, 'rack').counts, EL.groundConfig(26), 'unit02/q6-filling stage 5 (iron\'s rack)');
    }
    // 6. every strip is sorted by where its last electron went
    for (const sym of q6.SYMS) {
      const want = EL.blockOf(EL.zOf(sym));
      same6(end6(5).pieces[`e-${sym.toLowerCase()}`].zone, `tray:${want}`, `unit02/q6-filling stage 6 (${sym} is in the ${want} block)`);
    }
    same6(q6.SYMS.map(s => EL.blockOf(EL.zOf(s))), ['s', 'p', 'd', 'f', 'p', 'd'], 'unit02/q6-filling stage 6 (the blocks)');
    // 7. Fe2+ loses its 4s electrons; the magnet measures the real ion and the rack agrees
    {
      const t = end6(6);
      same6(SHL.readOf(t, 'rack').counts, Object.fromEntries(Object.entries(EL.groundConfig(26)).filter(([k]) => k !== '4s')), 'unit02/q6-filling stage 7 (iron(II)\'s rack)');
      same6(SHL.rackPull(t, 'rack'), EL.MEASURED['Fe2+'], 'unit02/q6-filling stage 7 (the rack and the magnet agree for iron(II))');
      holds6(SHL.readOf(miss6(6), 'rack').counts['4s'] === 2, 'unit02/q6-filling stage 7: the miss does not leave the 4s electrons behind');
    }
    // 8. chromium: the rule's answer and the measured one differ, and the graded arrangement is the measured one
    {
      same6(SHL.rackPull(end6(7), 'rack'), EL.MEASURED.Cr, 'unit02/q6-filling stage 8 (the graded pull)');
      holds6(SHL.rackPull(miss6(7), 'rack') !== EL.MEASURED.Cr, 'unit02/q6-filling stage 8: the rule-following arrangement already matches the magnet, so the stage teaches nothing');
      same6(SHL.readOf(end6(7), 'rack').total, 24, 'unit02/q6-filling stage 8 (chromium has 24 electrons)');
      same6(SHL.readOf(miss6(7), 'rack').counts, { ...EL.groundConfig(24), '4s': 2, '3d': 4 }, 'unit02/q6-filling stage 8 (the rule\'s arrangement)');
    }
  }
  if (q7) {
    // THE SEVENTH LANTERNFALL TABLE (`q7-pes`, the spectrum kit): every peak is `electrons.js` `planPES`, every graded figure is recomputed.
    const PES = await import('../src/learn/table/kits/pes.js');
    const same7 = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds7 = (c, what) => { if (!c) fail(what); };
    const start7 = i => TABLE.createTable(q7.STAGES[i].table, q7.STAGES[i].title);
    const end7 = i => TABLE.runScript(start7(i), q7.SOLUTIONS[i], { strict: true });
    // Every spectrum on the bench adds up to the electrons its element has, and its peaks land in distinct bins of the strip.
    for (const sym of ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al']) {
      const peaks = EL.planPES(sym);
      const total = peaks.reduce((n, p) => n + p.height, 0);
      if (total !== EL.zOf(sym)) fail(`unit02/q7-pes: ${sym}'s peaks add up to ${total}, not ${EL.zOf(sym)}`);
      const bins = peaks.map(p => PES.binOf(p.energy));
      if (new Set(bins).size !== bins.length) fail(`unit02/q7-pes: two of ${sym}'s peaks fall in one bin of the strip`);
      if (peaks.some(p => p.height > PES.STACK)) fail(`unit02/q7-pes: a peak of ${sym} is taller than the strip's pile`);
      holds7(peaks[peaks.length - 1].energy >= PES.AXIS.lo && peaks[0].energy <= PES.AXIS.hi, `unit02/q7-pes: ${sym}'s peaks run off the strip's scale`);
      holds7(PES.freedBy(sym, PES.energyAt(PES.TOP_STEP)).length === peaks.length, `unit02/q7-pes: the strongest light does not free every electron of ${sym}`);
    }
    same7(EL.planPES('O').map(p => p.height), [2, 2, 4], 'unit02/q7-pes stage 5 (oxygen\'s heights)');
    holds7(EL.BINDING.Ne['1s'] > EL.BINDING.F['1s'] && EL.BINDING.F['1s'] > EL.BINDING.O['1s'], 'unit02/q7-pes stage 6: the inner peaks must run oxygen, fluorine, neon');
    holds7(EL.BINDING.B['2s'] > EL.BINDING.B['2p'], 'unit02/q7-pes stage 4: boron\'s 2s must be held tighter than its 2p');
    // Fire: the piles are the planner's, the printout is the same spectrum, and the strip's piles are one instanced body.
    {
      let t = start7(1);
      t = TABLE.runScript(t, [{ place: { piece: 'b', to: 'slot:ch.spec' } }, { run: 'ch' }], { strict: true });
      const r = PES.chamberRead(t, 'ch');
      same7(r.piles, PES.pilesOf(EL.planPES('Li')), 'unit02/q7-pes stage 2 (the piles Li makes)');
      same7(r.electrons, 3, 'unit02/q7-pes stage 2 (lithium\'s electrons)');
      holds7(t.pieces.b.props.printed && !t.pieces.a.props.printed, 'unit02/q7-pes stage 2: only the fired card keeps a printout');
      const piles = PES.chamberPiles(t);
      holds7(piles.length === 1 && piles[0].cap === PES.BINS * PES.STACK && piles[0].shown.filter(Boolean).length === 3, 'unit02/q7-pes: the strip does not stand exactly the electrons that fell');
      const empty = PES.chamberPiles(start7(1))[0];
      holds7(empty.shown.every(x => !x), 'unit02/q7-pes: an unfired strip already holds electrons');
      holds7(TABLE.apply(start7(1), { run: 'ch' }).last.ok === false, 'unit02/q7-pes: firing an empty chamber does not refuse');
    }
    // 1. rail: the specimen whose electrons are held with the least energy first
    same7(end7(0).zones.rail.order, ['a', 'b'], 'unit02/q7-pes stage 1 (the rail)');
    holds7(PES.holdOf('H') < PES.holdOf('He'), 'unit02/q7-pes stage 1: hydrogen must hold its electron more loosely than helium');
    // 2. the tally is the total of Sample B's heights, and Sample A's card says its own total
    same7(PES.markerRead(end7(1), 'tally'), PES.electronsIn(EL.planPES(q7.STAGES[1].table.pieces.find(p => p.id === 'b').props.sym)), 'unit02/q7-pes stage 2 (the tally)');
    same7(PES.electronsIn(EL.planPES('He')), 2, 'unit02/q7-pes stage 2 (Sample A\'s card says two electrons)');
    // 3. exactly one electron comes off lithium at the graded setting, and it is the loosest
    {
      const r = PES.chamberRead(end7(2), 'ch');
      same7(r.freedNow.map(p => p.row), ['2s'], 'unit02/q7-pes stage 3 (what comes off)');
      same7(r.electronsNow, 1, 'unit02/q7-pes stage 3 (electrons freed)');
      const settings = [];
      for (let i = 1; i <= PES.TOP_STEP; i++) if (PES.freedBy('Li', PES.energyAt(i)).length === 1) settings.push(i);
      holds7(settings.length >= 2, 'unit02/q7-pes stage 3: only one light setting frees one electron');
      holds7(PES.chamberRead(start7(2), 'ch').electronsNow === 3, 'unit02/q7-pes stage 3: the light starts already freeing one electron');
      same7(PES.shellsOf('Li'), [2, 1], 'unit02/q7-pes stage 3 (lithium\'s rings)');
    }
    // 4. boron's outer ring is two rows (a subshell each) and the graded light frees both and not the 1s
    {
      same7(q7.ringRows('B', 1).sort(), ['2p', '2s'], 'unit02/q7-pes stage 4 (the outer ring\'s rows)');
      const r = PES.chamberRead(end7(3), 'ch');
      same7(r.freedNow.map(p => p.row).sort(), ['2p', '2s'], 'unit02/q7-pes stage 4 (what comes off)');
      same7(r.electronsNow, PES.shellsOf('B')[1], 'unit02/q7-pes stage 4 (the outer ring has as many electrons as come off)');
      same7(Object.keys(PES.chamberRead(start7(3), 'ch').piles).length, 0, 'unit02/q7-pes stage 4 (nothing is on the strip until fired)');
      same7(Object.keys(r.piles).length, 2, 'unit02/q7-pes stage 4 (two piles from one ring)');
    }
    // 5. the build that matches is oxygen; its outlines are exactly the sealed specimen's piles
    {
      const t = TABLE.runScript(end7(4), [{ run: 'ch' }], { strict: true });
      const b = PES.buildRead(t, 'build');
      same7(b.sym, 'O', 'unit02/q7-pes stage 5 (the build)');
      holds7(b.whole, 'unit02/q7-pes stage 5: the graded build is no whole atom');
      holds7(PES.sameSpectrum(b.peaks, EL.planPES('O')) && JSON.stringify(PES.pilesOf(b.peaks)) === JSON.stringify(PES.chamberRead(t, 'ch').piles), 'unit02/q7-pes stage 5: the build\'s outlines are not the sealed piles');
      for (const [p, e] of [[8, 7], [7, 7], [9, 9]]) {
        const w = PES.buildRead(TABLE.runScript(start7(4), [{ setDial: { fixture: 'build', dial: 'protons', value: p } }, { setDial: { fixture: 'build', dial: 'electrons', value: e } }]), 'build');
        holds7(!(w.whole && w.sym === 'O'), `unit02/q7-pes stage 5: ${p} protons and ${e} electrons already pass`);
      }
    }
    // 6. the innermost peaks run oxygen, fluorine, neon; the cards print their protons
    {
      same7(end7(5).zones.rail.order, ['o', 'f', 'n'], 'unit02/q7-pes stage 6 (the rail)');
      const t = start7(5);
      for (const id of ['o', 'f', 'n']) holds7(t.pieces[id].props.note === `${EL.zOf(t.pieces[id].props.sym)} protons`, `unit02/q7-pes stage 6: ${id}'s card does not print its protons`);
    }
    // 7. Mg, Al, Na by their electrons and their last peak
    {
      const e = end7(6);
      for (const [id, tray] of [['x', 'mg'], ['y', 'al'], ['z', 'na']]) {
        same7(e.pieces[id].zone, `tray:${tray}`, `unit02/q7-pes stage 7 (${id})`);
        same7(EL.zOf(e.pieces[id].props.sym), { na: 11, mg: 12, al: 13 }[tray], `unit02/q7-pes stage 7 (${id}'s electrons)`);
      }
      same7(EL.planPES('Na').slice(-1)[0].height, 1, 'unit02/q7-pes stage 7 (sodium\'s loosest pile is a single electron)');
      same7(EL.planPES('Al').length, 5, 'unit02/q7-pes stage 7 (aluminum has an extra pile)');
    }
    // 8. the configuration written is nitrogen's, and the rows are the ladder's
    {
      same7(PES.writtenRead(end7(7), 'write').counts, { '1s': 2, '2s': 2, '2p': 3, '3s': 0, '3p': 0 }, 'unit02/q7-pes stage 8 (the page)');
      same7(PES.writerTarget('N'), EL.groundConfig(7) && { '1s': 2, '2s': 2, '2p': 3, '3s': 0, '3p': 0 }, 'unit02/q7-pes stage 8 (nitrogen\'s target)');
      same7(EL.planPES('N').map(p => `${p.row}${p.height}`), ['1s2', '2s2', '2p3'], 'unit02/q7-pes stage 8 (the strip)');
    }
  }
  if (q8) {
    // THE EIGHTH LANTERNFALL TABLE (`q8-trends`, the trends kit): the pull is `planPull`, the sizes and costs are the measured tables.
    const TRD = await import('../src/learn/table/kits/trends.js');
    const same8 = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds8 = (c, what) => { if (!c) fail(what); };
    const start8 = i => TABLE.createTable(q8.STAGES[i].table, q8.STAGES[i].title);
    const end8 = i => TABLE.runScript(start8(i), q8.SOLUTIONS[i], { strict: true });
    const B = await import('../src/learn/engine/electronbench.js');
    const item = sym => ({ z: EL.zOf(sym), shells: B.shellsOf(sym), radius: EL.RADIUS[sym] ?? EL.ION_RADIUS[sym] });
    // The radii run the way the trends do: shrinking across a row, growing down a group, an ion unlike its atom.
    const R = s => EL.RADIUS[s];
    holds8(R('Li') > R('Be') && R('Be') > R('B') && R('B') > R('C'), 'unit02/q8-trends stage 3: the radii must shrink across the row');
    holds8(R('K') > R('Na') && R('Na') > R('Li'), 'unit02/q8-trends stage 4: the radii must grow down the group');
    holds8(EL.ION_RADIUS['Na+'] < EL.ION_RADIUS['Cl-'] && EL.ION_RADIUS['Cl-'] < EL.ION_RADIUS.Na, 'unit02/q8-trends stage 5: Na+ < Cl- < Na');
    // 1. the electron held hardest of all is magnesium's innermost, and the best outermost electron is another atom's: the stage is about both
    {
      const hard = ['Li', 'Na', 'Be', 'Mg'].map(s => [s, TRD.hardestPull(s)]).sort((a, b) => b[1] - a[1]);
      same8(hard[0][0], 'Mg', 'unit02/q8-trends stage 1 (the hardest pull)');
      const outer = ['Li', 'Na', 'Be', 'Mg'].map(s => [s, B.planPull(item(s), B.shellsOf(s).length - 1).pull]).sort((a, b) => b[1] - a[1]);
      holds8(outer[0][0] !== 'Mg', 'unit02/q8-trends stage 1: the outermost electrons give the same answer as the innermost, so the stage teaches nothing about distance');
      const t = end8(0);
      same8(['li', 'na', 'be', 'mg'].filter(id => t.pieces[id].zone === 'tray:hard'), ['mg'], 'unit02/q8-trends stage 1 (the tray)');
      const r = TRD.springRead(TABLE.runScript(start8(0), [{ setDial: { fixture: 'sp', dial: 'which', value: 2 } }, { place: { piece: 'mg', to: 'slot:sp.atom' } }]), 'sp');
      same8(r.pull, B.planPull(item('Mg'), 0).pull, 'unit02/q8-trends stage 1 (the spring gauge reads the planner\'s pull)');
    }
    // 2. sodium's outer electron feels +1 of its +11 with ten between; lithium feels +1, beryllium and magnesium +2
    {
      const na = B.planPull({ z: 11, shells: [2, 8, 1], radius: 186 }, 2);
      holds8(na.zeff === 1 && na.between === 10, 'unit02/q8-trends stage 2: sodium\'s outer electron should feel +1 with ten electrons between');
      same8(['Li', 'Na', 'Be', 'Mg'].map(TRD.feelsOf), [1, 1, 2, 2], 'unit02/q8-trends stage 2 (the charges felt)');
      const t = end8(1);
      same8(['li', 'na', 'be', 'mg'].map(id => t.pieces[id].zone), ['tray:one', 'tray:one', 'tray:two', 'tray:two'], 'unit02/q8-trends stage 2 (the trays)');
    }
    // 3. the rail runs largest first, and the card of each atom is drawn at its real radius
    {
      const t = end8(2);
      const sizes = t.zones.rail.order.map(id => TRD.sizeNow(t.pieces[id]));
      holds8(sizes.every((v, i) => !i || v < sizes[i - 1]), 'unit02/q8-trends stage 3: the graded order is not largest radius first');
      same8(t.zones.rail.order, ['li', 'be', 'b', 'c'], 'unit02/q8-trends stage 3 (the rail)');
      const g = TRD.sizeRead(TABLE.apply(start8(2), { place: { piece: 'li', to: 'slot:sz.atom' } }), 'sz');
      same8(g.radius, EL.RADIUS.Li, 'unit02/q8-trends stage 3 (the size gauge)');
    }
    // 4. the prediction is the real comparison, and the gauge only reads once it is pressed
    {
      const t = end8(3);
      same8(t.prediction.token, 'larger', 'unit02/q8-trends stage 4 (the prediction)');
      holds8(t.prediction.tested, 'unit02/q8-trends stage 4: the solution does not test its prediction');
      holds8(TRD.sizeNow(t.pieces.k) > TRD.sizeNow(t.pieces.na), 'unit02/q8-trends stage 4: potassium is not larger than sodium');
      same8(B.shellsOf('K').length - B.shellsOf('Na').length, 1, 'unit02/q8-trends stage 4 (one more ring)');
      same8(TRD.feelsOf('K'), TRD.feelsOf('Na'), 'unit02/q8-trends stage 4 (the same charge felt)');
      holds8(q8.STAGES[3].table.prediction.tokens.length === 3, 'unit02/q8-trends stage 4: three predictions');
    }
    // 5. a stripped atom is its ion, a chlorine with one more is Cl-, and the three sort smallest first
    {
      const t = end8(4);
      same8(['na1', 'na2', 'cl'].map(id => TRD.itemOf(t.pieces[id]).charge), [0, 1, -1], 'unit02/q8-trends stage 5 (the charges)');
      same8(t.zones.rail.order.map(id => TRD.sizeNow(t.pieces[id])), [EL.ION_RADIUS['Na+'], EL.ION_RADIUS['Cl-'], EL.ION_RADIUS.Na], 'unit02/q8-trends stage 5 (the sizes)');
      same8(TRD.shellsNow('Na', 1), [2, 8], 'unit02/q8-trends stage 5 (Na+ has lost its outer shell)');
      same8(TRD.shellsNow('Cl', -1), [2, 8, 8], 'unit02/q8-trends stage 5 (Cl- has a full outer shell)');
      const twice = TABLE.runScript(start8(4), [{ join: ['e', 'cl'] }, { join: ['e', 'cl'] }]);
      holds8(twice.last.ok === false || TRD.itemOf(twice.pieces.cl).charge === -1, 'unit02/q8-trends stage 5: a chlorine takes a second extra electron');
    }
    // 6. the costs are the measured first ionization energies; the rail is cheapest first and boron dips below beryllium
    {
      const ies = ['Li', 'B', 'Be'].map(s => EL.IONIZATION[s]);
      holds8(ies.every((v, i) => !i || v > ies[i - 1]), 'unit02/q8-trends stage 6: the graded order is not the order of the real ionization energies');
      const t = end8(5);
      same8(t.zones.rail.order, ['li', 'b', 'be'], 'unit02/q8-trends stage 6 (the rail)');
      same8(['li', 'be', 'b'].map(id => t.pieces[id].props.lastCost), [520, 899, 801], 'unit02/q8-trends stage 6 (what each strip read)');
      holds8(EL.IONIZATION.B < EL.IONIZATION.Be, 'unit02/q8-trends stage 6: boron must dip below beryllium');
    }
    // 7. magnesium's successive energies jump after the second and the bench reads no further than the third
    {
      const jump = EL.MG_SUCCESSIVE;
      holds8(jump[2] / jump[1] > 4 && jump[1] / jump[0] < 3, 'unit02/q8-trends stage 7: magnesium\'s successive energies do not jump after the second');
      const t = end8(6);
      same8(t.pieces.mg.props.charge, 2, 'unit02/q8-trends stage 7 (magnesium stripped twice)');
      same8(t.recorder.rows.map(r => r.y), [738, 1451], 'unit02/q8-trends stage 7 (the sheet)');
      const more = TABLE.runScript(start8(6), [{ place: { piece: 'mg', to: 'slot:st.atom' } }, { run: 'st' }, { run: 'st' }, { run: 'st' }, { run: 'st' }]);
      holds8(more.last.ok === false && more.pieces.mg.props.charge === 3, 'unit02/q8-trends stage 7: the bench reads a fourth electron it has not measured');
      const back = TABLE.runScript(more, [{ place: { piece: 'mg', to: 'free:60,30' } }, { join: ['e', 'mg'] }], { strict: true });
      same8(back.pieces.mg.props.charge, 2, 'unit02/q8-trends stage 7 (an electron laid back)');
    }
    // 8. the pull on the outermost electron orders the atoms the way electronegativity does
    {
      const pulls = ['na', 'c', 'n', 'f'].map(k => {
        const s = k[0].toUpperCase() + k.slice(1);
        return B.planPull(item(s), B.shellsOf(s).length - 1).pull;
      });
      holds8(pulls.every((v, i) => !i || v > pulls[i - 1]), 'unit02/q8-trends stage 8: the pull meter does not order the atoms weakest first');
      const en = ['Na', 'C', 'N', 'F'].map(s => EL.ELECTRONEGATIVITY[s]);
      holds8(en.every((v, i) => !i || v > en[i - 1]), 'unit02/q8-trends stage 8: the real electronegativities do not order the atoms the same way');
      same8(end8(7).zones.rail.order, ['na', 'c', 'n', 'f'], 'unit02/q8-trends stage 8 (the rail)');
    }
  }
  // THE LANTERN-EATER: five phases, each on a table of a bench the player has worked, each answer read off the real planners.
  const eater = getQuest('unit02', 'boss-eater') && await getQuest('unit02', 'boss-eater').module?.();
  if (eater) {
    const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
    const holds = (c, what) => { if (!c) fail(what); };
    const nearE = (a, b, tol, what) => { if (Math.abs(a - b) > tol) fail(`${what}: graded ${a}, the real figure is ${b}`); };
    const OPT = await import('../src/learn/table/kits/optics.js');
    const SHL = await import('../src/learn/table/kits/shells.js');
    const PESK = await import('../src/learn/table/kits/pes.js');
    const CUV = await import('../src/learn/table/kits/cuvette.js');
    const start = i => TABLE.createTable(eater.STAGES[i].table, eater.STAGES[i].title);
    const end = i => TABLE.runScript(start(i), eater.SOLUTIONS[i], { strict: true });
    // 1. the 486 nm line is the drop from the fourth rung to the second, and no other drop makes a line within a nanometre of it
    {
      const jumps = LIGHT.jumpsForLine(eater.LADDER_LINE);
      same(jumps.map(j => [j.hi, j.lo]), [[4, 2]], 'unit02/boss-eater phase 1 (the drop that makes the line)');
      const last = OPT.ladderRead(end(0), 'lad').last;
      nearE(last.nm, LIGHT.planJump(4, 2).nm, 0.01, 'unit02/boss-eater phase 1 (the line the solution made)');
      for (let hi = 2; hi <= 6; hi++) for (let lo = 1; lo < hi; lo++) {
        if (!(hi === 4 && lo === 2)) holds(Math.abs(LIGHT.planJump(hi, lo).nm - eater.LADDER_LINE) >= 1, `unit02/boss-eater phase 1: the drop ${hi} to ${lo} also makes a line near ${eater.LADDER_LINE} nm`);
      }
    }
    // 2. every lamp frees cesium's electrons, each at its own speed, and the one in the marked place is the slowest
    {
      const speeds = eater.LAMPS.map(([id, , nm]) => [id, LIGHT.planPhotocell('Cs', nm, eater.CELL_BRIGHT)]);
      holds(speeds.every(([, r]) => r.freed), 'unit02/boss-eater phase 2: a lamp frees no electrons, so "slowest" is zero');
      const order = speeds.slice().sort((a, b) => a[1].speed - b[1].speed);
      holds(order.every(([, r], k) => !k || r.speed > order[k - 1][1].speed), 'unit02/boss-eater phase 2: two lamps free electrons at the same speed');
      const t = end(1);
      same(Object.values(t.pieces).filter(p => p.zone === 'slot:slowest').map(p => p.id), [order[0][0]], 'unit02/boss-eater phase 2 (the lamp in the marked place)');
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
      nearE((A('sealed') - A('s1')) / slope + C('s1'), eater.SEALED_CONC * 1000, 0.05, 'unit02/boss-eater phase 5 (the line gives the sealed strength back)');
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
  if (failures === before) ok('Lanternfall: every graded figure is recomputed from the real tables and agrees');
}
