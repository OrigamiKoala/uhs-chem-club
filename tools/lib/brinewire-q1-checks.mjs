/**
 * brinewire-q1-checks.mjs — hand-worked checks for q1-halves (Half-Reactions). Each expected value below was worked on paper (and the
 * balancing by a Python nullspace of the element-and-charge matrix, `sympy`), never produced by the code under test:
 *
 *   oxidation numbers (oxygen -2, hydrogen +1, alkali metal +1, chlorine -1, sum = charge):
 *     Zn 0 -> Zn2+ +2;  Cu2+ +2 -> Cu 0;  SO4 2-: S + 4(-2) = -2, so S +6, O -2 in both windows
 *     MnO4-: Mn + 4(-2) = -1, so Mn +7;  Mn2+ +2;  Fe2+ +2 -> Fe3+ +3;  Ag+ +1;  Mg 0 -> Mg2+ +2
 *     AgNO3: Ag +1, N + 3(-2) = -1 + ... N +5;  NaCl Na +1 Cl -1;  AgCl Ag +1 Cl -1;  NaNO3 Na +1 N +5 O -2
 *     HCl H +1 Cl -1;  MgCl2 Mg +2 Cl -1;  H2 0;  NaOH Na +1 O -2 H +1;  H2O H +1 O -2
 *   the four sealed reactions: A Zn + CuSO4 moves Zn (0 -> +2) and Cu (+2 -> 0); B moves nothing; C moves Mg (0 -> +2) and H (+1 -> 0); D moves nothing
 *   half-reactions in acid:  Zn -> Zn2+ + 2e-;  Cu2+ + 2e- -> Cu;  Al -> Al3+ + 3e-;  Fe2+ -> Fe3+ + e-
 *     MnO4- + 8H+ + 5e- -> Mn2+ + 4H2O  (nullspace of [Mn,O,H,charge], scaled by 5)
 *   joining: Al and Cu: lcm(3,2) = 6 electrons, 2 Al and 3 Cu2+;  MnO4- + 8H+ + 5Fe2+ -> Mn2+ + 4H2O + 5Fe3+, charge -1 + 8 + 10 = 17 = 2 + 0 + 15
 *   windows: Zn/Cu x2: 2 Zn leave the strip, 2 Cu coat, 2 Zn2+ appear, 2 of 4 Cu2+ remain, 4 SO4 stay;  Cu/Ag x2: 2 Cu leave, 4 Ag coat, 2 Cu2+, 2 of 6 Ag+, 6 NO3;
 *     Mg/Fe x2: 2 Mg leave, 2 Fe coat, 2 Mg2+, 2 of 4 Fe2+, 4 SO4. Dissolved charge is conserved: Zn/Cu 8 both windows, Cu/Ag 6, Mg/Fe 8.
 *   dichromate (the worked bank problem): Cr2O7 2- + 14 H+ + 6 e- -> 2 Cr3+ + 7 H2O  (nullspace scaled by 7)
 */

import { installUiStub } from './ui-stub.mjs';
import { makeCtx } from './ctx-stub.mjs';

export async function checkBrinewireQ1({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q1-halves ${msg}`); };
  const holds = (cond, label) => { if (!cond) no(label); };
  const same = (got, want, label) => { if (JSON.stringify(got) !== JSON.stringify(want)) no(`${label}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`); };

  installUiStub();
  const Q = await import('../../src/learn/quests/unit10/q1-halves.js');
  await import('../../src/learn/table/kits/cell.js');
  const R = await import('../../src/learn/table/kits/cell-registry.js');
  const L = await import('../../src/learn/table/kits/cell-ledger.js');
  const P = await import('../../src/learn/table/kits/cell-redox.js');
  const D = await import('../../src/learn/engine/celldata.js');
  const X = await import('../../src/learn/engine/celldata-q1.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { BRINEWIRE_Q1_SCENES } = await import('../../src/ui/story-scenes-brinewire-q1.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const seat = 'slot:probe.seat';

  /* ---- oxidation numbers against the values worked by hand ---- */
  const ox = [['Zn', 'Zn', 0], ['Zn2+', 'Zn', 2], ['Cu2+', 'Cu', 2], ['Cu', 'Cu', 0], ['SO4', 'S', 6], ['SO4', 'O', -2], ['MnO4', 'Mn', 7], ['Mn2+', 'Mn', 2],
    ['Fe2+', 'Fe', 2], ['Fe3+', 'Fe', 3], ['Ag+', 'Ag', 1], ['Mg', 'Mg', 0], ['Mg2+', 'Mg', 2], ['AgNO3', 'N', 5], ['AgNO3', 'Ag', 1], ['NaCl', 'Cl', -1],
    ['HCl', 'H', 1], ['MgCl2', 'Cl', -1], ['H2', 'H', 0], ['NaOH', 'O', -2], ['NaOH', 'H', 1], ['H2O', 'H', 1], ['NaNO3', 'N', 5], ['AgCl', 'Ag', 1]];
  for (const [sp, el, n] of ox) same(D.oxNumber(sp, el), n, `oxidation number of ${el} in ${sp}`);
  ok('q1-halves oxidation numbers: every species used agrees with the values worked by hand');

  /* ---- the cards, the four sealed reactions ---- */
  same(['zinc', 'copper', 'sulfur', 'oxygen'].map(c => X.cardChanged(c)), [true, true, false, false], 'stage 1 cards that change');
  same(X.cardReading('zinc'), { el: 'Zn', before: 0, after: 2 }, 'zinc card');
  same(X.cardReading('copper'), { el: 'Cu', before: 2, after: 0 }, 'copper card');
  same(['cu', 'ag', 'mg', 'fe'].map(c => X.cardGives(c)), [true, false, true, false], 'stage 5 cards that give up electrons');
  same(['a', 'b', 'c', 'd'].map(id => X.isRedox(id)), [true, false, true, false], 'stage 8 redox flags');
  same(X.movers('a').map(m => [m.el, m.before, m.after]), [['Zn', 0, 2], ['Cu', 2, 0]], 'reaction A movers');
  same(X.movers('c').map(m => [m.el, m.before, m.after]), [['Mg', 0, 2], ['H', 1, 0]], 'reaction C movers');
  same(X.movers('b'), [], 'reaction B movers'); same(X.movers('d'), [], 'reaction D movers');
  same(X.reactionStates('b').map(r => r.el), ['Ag', 'N', 'O', 'Na', 'Cl'], 'reaction B elements');
  ok('q1-halves cards and sealed reactions: the numbers agree with the values worked by hand');

  /* ---- the windows are counted from the electrons, and dissolved charge is conserved ---- */
  const win = id => X.windowOf(id);
  same([win('zncu').A, win('zncu').B, win('zncu').after.ions, win('zncu').after.stripIons, win('zncu').after.strip], [2, 2, 2, 2, 6], 'Zn/Cu window');
  same([win('cuag').A, win('cuag').B, win('cuag').after.ions, win('cuag').after.stripIons, win('cuag').spec], [2, 4, 2, 2, 6], 'Cu/Ag window');
  same([win('mgfe').A, win('mgfe').B, win('mgfe').after.ions, win('mgfe').after.stripIons, win('mgfe').spec], [2, 2, 2, 2, 4], 'Mg/Fe window');
  for (const [id, q] of [['zncu', 8], ['cuag', 6], ['mgfe', 8]]) {
    for (const side of ['before', 'after']) {
      const c = X.windowCharge(id, side);
      holds(c.plus === q && c.minus === q, `${id} ${side}: dissolved charge ${c.plus}/${c.minus}, expected ${q} each`);
    }
    const w = win(id);
    const nM = D.SPECIES[w.stripIon].charge; const nI = D.SPECIES[w.ion].charge;
    holds(w.A * nM === w.B * nI, `${id}: electrons given ${w.A * nM} are not the electrons taken ${w.B * nI}`);
    const parts = P.windowParticles(id, 'before'); const after = P.windowParticles(id, 'after');
    holds(parts.length === w.strip0 + w.ion0 + w.spec, `${id}: before window draws ${parts.length} particles`);
    holds(after.length === w.after.strip + w.after.coat + w.after.ions + w.after.stripIons + w.spec, `${id}: after window draws ${after.length} particles`);
    const slots = new Set(after.filter(p => p.kind !== 'atom').map(p => `${p.x},${p.y}`));
    holds(slots.size === after.filter(p => p.kind !== 'atom').length, `${id}: two ions share a slot in the After window`);
  }
  ok('q1-halves windows: atoms and ions counted from the electrons, charge conserved, no two particles in one place');

  /* ---- the halves and the joins ---- */
  same([X.HALF.zn().eRight, X.HALF.zn().eLeft, X.HALF.cu().eLeft, X.HALF.cu().eRight, X.HALF.al().eRight, X.HALF.fe().eRight], [2, 0, 2, 0, 3, 1], 'electrons of the halves');
  const mn = X.HALF.mn();
  same([mn.left['H+'], mn.right.H2O, mn.eLeft, mn.eRight], [8, 4, 5, 0], 'permanganate half');
  holds(X.firstOff(mn, Q.CHECKS.S6_ROWS) === null, 'the balanced permanganate half has an unbalanced row');
  const m1 = X.matchedHalves(X.HALF.al(), X.HALF.cu());
  same([m1.a, m1.b, m1.electrons], [2, 3, 6], 'Al and Cu multipliers');
  const o1 = X.overall(X.HALF.al(), 2, X.HALF.cu(), 3);
  same([o1.left, o1.right], [{ 'Cu2+': 3, Al: 2 }, { Cu: 3, 'Al3+': 2 }], 'Al and Cu overall');
  const m2 = X.matchedHalves(X.HALF.mn(), X.HALF.fe());
  same([m2.a, m2.b, m2.electrons], [1, 5, 5], 'Mn and Fe multipliers');
  const o2 = X.overall(X.HALF.fe(), 5, X.HALF.mn(), 1);
  same(o2.left, { MnO4: 1, 'H+': 8, 'Fe2+': 5 }, 'overall left'); same(o2.right, { 'Mn2+': 1, H2O: 4, 'Fe3+': 5 }, 'overall right');
  same([o2.charge.left, o2.charge.right], [17, 17], 'overall charge');
  same(X.equationText(o2.left, o2.right), 'MnO₄⁻ + 8 H⁺ + 5 Fe²⁺ → Mn²⁺ + 4 H₂O + 5 Fe³⁺', 'overall text');
  ok('q1-halves halves: every balanced half, multiplier and the overall equation agrees with the values worked by hand');

  /* ---- the instruments, driven through the real action path ---- */
  const half = (i, script) => { const t = Q.stateFor(i, script).table; return t; };
  // stage 6: the ledger rows at each step
  const rowsAt = script => L.ledgerRead(half(5, script), 'hm').rows.map(r => `${r.label}:${r.left}/${r.right}`).join(' ');
  same(rowsAt([]), 'Mn:1/1 O:4/0 H:0/0 charge:-1/2', 'permanganate rows at the start');
  same(rowsAt([dial('hm', 'wR', 4)]), 'Mn:1/1 O:4/4 H:0/8 charge:-1/2', 'rows with 4 water on the right');
  same(rowsAt([dial('hm', 'wR', 4), dial('hm', 'hL', 8)]), 'Mn:1/1 O:4/4 H:8/8 charge:7/2', 'rows with the water and 8 H+');
  same(rowsAt(Q.SOLUTIONS[5]), 'Mn:1/1 O:4/4 H:8/8 charge:2/2', 'rows once balanced');
  // stage 7: the tally
  const tl = script => { const t = half(6, script); return [L.halfOf(t.fixtures.hm).eLeft, L.halfOf(t.fixtures.hf).eRight]; };
  same(tl([]), [5, 1], 'tally at the start'); same(tl([dial('hf', 'k', 5)]), [5, 5], 'tally at 1 and 5');
  same(tl([dial('hm', 'k', 2), dial('hf', 'k', 5)]), [10, 5], 'tally at 2 and 5');
  // stage 4: Al x2 and Cu x3
  const t4 = half(3, Q.SOLUTIONS[3]);
  same([L.halfOf(t4.fixtures.ha).eRight, L.halfOf(t4.fixtures.hb).eLeft, L.tallyRead(t4, 'tl').given, L.tallyRead(t4, 'tl').taken], [6, 6, 6, 6], 'stage 4 tally');
  // the probe reads what the planner says
  const t1 = half(0, [put('k-zinc', seat)]);
  same(P.probeRead(t1, 'probe').rows, [{ name: 'Zn', before: 0, after: 2 }], 'probe on the zinc card');
  const t8 = half(7, [put('r-b', seat)]);
  same(P.probeRead(t8, 'probe').rows.map(r => `${r.name}${r.before}/${r.after}`), ['Ag1/1', 'N5/5', 'O-2/-2', 'Na1/1', 'Cl-1/-1'], 'probe on reaction B');
  ok('q1-halves instruments: the ledger rows, tally and probe read what the planners say through the real action path');

  /* ---- every option reaches the painter, and nothing printed is the answer ---- */
  const paint = (f, state) => {
    const ctx = makeCtx(900, 600);
    const h = R.fixtureHandler(f.kind);
    h.paint(ctx, f, state, { X: v => v, Y: v => v, sc: 1, lay: { box: { x0: 0, y0: 0 } } });
    return ctx.stats;
  };
  const s6 = half(5, []);
  const st = paint(s6.fixtures.hm, s6);
  holds(['Left', 'Right', 'Mn', 'O', 'H', 'charge', 'MnO₄⁻', 'Mn²⁺'].every(w => st.text.includes(w)), 'the permanganate ledger does not print its rows and lines');
  holds(!st.text.some(x => /^(5|8)$/.test(x)), 'the permanganate ledger prints a target count (5 or 8) with every dial at 0');
  holds(!st.text.some(x => /balanced|correct|wrong|right answer/i.test(x)), 'the ledger prints a verdict');
  holds(st.nan === 0, 'the ledger paints NaN');
  const s3 = half(2, []);
  const st3 = paint(s3.fixtures.hz, s3);
  holds(st3.text.includes('charge') && st3.text.includes('Zn'), 'the zinc ledger does not print its charge row');
  holds(!st3.text.includes('O') && !st3.text.includes('H'), 'the zinc ledger prints element rows it should not');
  for (const [i, fid] of [[0, 'beaker'], [4, 'b1'], [4, 'b2']]) {
    const s = half(i, []);
    const t = paint(s.fixtures[fid], s);
    holds(t.text.includes('Before') && t.text.includes('After') && t.nan === 0, `${fid} does not paint both windows`);
  }
  const pb = half(0, [put('k-copper', seat)]);
  const pt = paint(pb.fixtures.probe, pb);
  holds(pt.text.includes('+2') && pt.text.includes('0') && pt.text.includes('Cu'), 'the probe does not print copper +2 and 0');
  const none = paint(half(0, []).fixtures.probe, half(0, []));
  holds(none.text.includes('Nothing on the seat'), 'an empty probe does not say so');
  ok('q1-halves painters: every option reaches the picture, no target count and no verdict is printed');

  /* ---- stage 1 ---- */
  const solve1 = Q.SOLUTIONS[0];
  holds(run(0, solve1).ok, 'stage 1 refuses its own solution');
  const blank1 = run(0, []);
  holds(!blank1.ok && blank1.notYet, 'stage 1 accepts a blank table');
  const noProbe = run(0, Q.CHECKS.S1_CARDS.map(c => put(`k-${c}`, X.cardChanged(c) ? 'tray:same' : 'tray:changed')));
  holds(!noProbe.ok && /has not read/.test(noProbe.msg), `stage 1 wrong sort without a reading is not told to read (${noProbe.msg})`);
  const wrong1 = run(0, Q.MISSES[0]);
  holds(!wrong1.ok && /\+6 before and \+6 after/.test(wrong1.msg), `stage 1 slip on sulfate does not name the probe's reading (${wrong1.msg})`);
  ok('q1-halves stage 1: a right sort needs no extra pull, a wrong one names the probe\'s two numbers');

  /* ---- stages 3, 4, 6, 7: slips named by a reading ---- */
  holds(run(2, Q.SOLUTIONS[2]).ok, 'stage 3 refuses 2 electrons on the right of Zn and 2 on the left of Cu');
  const s3a = run(2, [dial('hz', 'eR', 1), dial('hc', 'eL', 2)]);
  holds(!s3a.ok && /zinc half reads charge 0 on the left and \+1 on the right/.test(s3a.msg), `stage 3 slip (${s3a.msg})`);
  const s3b = run(2, [dial('hz', 'eL', 2), dial('hc', 'eL', 2)]);
  holds(!s3b.ok && /zinc half reads charge −2 on the left and \+2 on the right/.test(s3b.msg), `stage 3 wrong side (${s3b.msg})`);
  const s3c = run(2, [dial('hz', 'eL', 1), dial('hz', 'eR', 3), dial('hc', 'eL', 2)]);
  holds(!s3c.ok && /electrons? on its left side/.test(s3c.msg), `stage 3 electrons on both sides (${s3c.msg})`);
  holds(run(2, []).notYet, 'stage 3 accepts or scores an untouched ledger');
  const s4 = run(3, []);
  holds(!s4.ok && /Aluminium gives 3 electrons and copper takes 2/.test(s4.msg), `stage 4 slip (${s4.msg})`);
  holds(!run(3, [dial('ha', 'k', 4), dial('hb', 'k', 4)]).ok && run(3, Q.SOLUTIONS[3]).ok, 'stage 4 grading');
  holds(run(5, Q.SOLUTIONS[5]).ok, 'stage 6 refuses the balanced half');
  const s6a = run(5, [dial('hm', 'eL', 5)]);
  holds(!s6a.ok && /The O row reads 4 on the left and 0 on the right/.test(s6a.msg), `stage 6 forgot water (${s6a.msg})`);
  const s6b = run(5, [dial('hm', 'wR', 4)]);
  holds(!s6b.ok && /The H row reads 0 on the left and 8 on the right/.test(s6b.msg), `stage 6 forgot hydrogen ions (${s6b.msg})`);
  const s6c = run(5, [dial('hm', 'wR', 4), dial('hm', 'hL', 8)]);
  holds(!s6c.ok && /The charge row reads \+7 on the left and \+2 on the right/.test(s6c.msg), `stage 6 forgot electrons (${s6c.msg})`);
  const s6d = run(5, [dial('hm', 'wR', 4), dial('hm', 'hL', 8), dial('hm', 'eR', 5)]);
  holds(!s6d.ok && /charge row reads \+7 on the left and \+7 on the right/.test(s6d.msg) === false && /charge row/.test(s6d.msg), `stage 6 electrons on the wrong side (${s6d.msg})`);
  const s7 = run(6, []);
  holds(!s7.ok && /take 5 electrons and give 1/.test(s7.msg), `stage 7 slip (${s7.msg})`);
  holds(run(6, Q.SOLUTIONS[6]).ok && !run(6, [dial('hm', 'k', 2), dial('hf', 'k', 5)]).ok, 'stage 7 grading');
  ok('q1-halves stages 3 to 7: right settings pass, every slip is refused with a reading');

  /* ---- stages 5 and 8 ---- */
  holds(run(4, Q.SOLUTIONS[4]).ok, 'stage 5 refuses its own solution');
  const s5a = run(4, Q.MISSES[4]);
  holds(!s5a.ok && /Ag⁺ ions became Ag atoms/.test(s5a.msg), `stage 5 marks the ion (${s5a.msg})`);
  const s5b = run(4, [put('k-mg', 'slot:s5a'), put('k-cu', 'slot:s5b')]);
  holds(!s5b.ok && /not in the first beaker/.test(s5b.msg), `stage 5 wrong beaker (${s5b.msg})`);
  holds(run(4, []).notYet, 'stage 5 accepts an empty table');
  holds(run(7, Q.SOLUTIONS[7]).ok && !run(7, Q.MISSES[7]).ok, 'stage 8 grading');
  const s8a = run(7, [put('r-a', seat), put('r-a', 'tray:not'), put('r-b', 'tray:not'), put('r-c', 'tray:redox'), put('r-d', 'tray:not')]);
  holds(!s8a.ok && /read Zn as 0 before and \+2 after in Reaction A/.test(s8a.msg), `stage 8 redox in the wrong tray (${s8a.msg})`);
  const s8b = run(7, [put('r-b', seat), put('r-b', 'tray:redox'), put('r-a', 'tray:redox'), put('r-c', 'tray:redox'), put('r-d', 'tray:not')]);
  holds(!s8b.ok && /same number before and after on every element of Reaction B/.test(s8b.msg), `stage 8 not-redox in the redox tray (${s8b.msg})`);
  const s8c = run(7, [put('r-a', 'tray:redox'), put('r-b', 'tray:not'), put('r-c', 'tray:redox'), put('r-d', 'tray:redox')]);
  holds(!s8c.ok && /has not been laid on the probe/.test(s8c.msg), `stage 8 unread card (${s8c.msg})`);
  ok('q1-halves stages 5 and 8: right answers pass, wrong ones are refused with the window or the probe\'s reading');

  /* ---- no refusal carries the rule its stage asks for ---- */
  const rule = /must be equal|should be equal|has to equal|to balance (the )?charge|rises?|goes up|number that changes|differs? is redox|lowest common|scale (the )?halves/i;
  const msgs = [];
  Q.MISSES.forEach((m, i) => { const r = run(i, m); if (r.msg) msgs.push(r.msg); });
  for (const m of [s3a, s3b, s3c, s4, s5a, s5b, s6a, s6b, s6c, s7, s8a, s8b, s8c, wrong1, noProbe].map(r => r.msg)) msgs.push(m);
  for (const m of msgs) holds(!rule.test(m), `a refusal carries the rule: "${m}"`);
  // a refusal never carries its stage's answer (the balanced coefficients)
  holds(!/\b8 H|4 H₂O|5 e/.test(s6a.msg + s6b.msg + s6c.msg), 'a stage 6 refusal carries the balanced half');
  ok('q1-halves refusals: none carries the rule or the answer its stage asks for');

  /* ---- the story's numbers are what is drawn ---- */
  const story = QUEST_STORY['unit10/q1-halves'];
  const beats = JSON.stringify(story.beats);
  for (const n of ['0 to +2', '+2 to 0', '2 electrons', '3 electrons', 'takes 2', '2 and 3 times', '6 electrons given and 6 taken', '5 electrons', '5 iron(II)', '17']) holds(beats.includes(n), `story is missing ${n}`);
  const paintScene = t => { const ctx = makeCtx(960, 540); BRINEWIRE_Q1_SCENES['half-join'](ctx, 960, 540, t); return ctx.stats; };
  const has = (t, ...ws) => { const s = paintScene(t); return ws.every(w => s.text.includes(w)); };
  holds(has(0.25, '+2', '0'), 'scene beat 1 does not end on zinc +2 and copper 0');
  holds(has(0.49, 'charge 0') && !has(0.49, 'charge +2'), 'scene beat 2 does not end with both halves at charge 0');
  holds(has(0.75, 'electrons given 6', 'electrons taken 6'), 'scene beat 3 does not end on 6 given and 6 taken');
  holds(has(0.93, 'Mn +2', 'charge 17 on the left, 17 on the right'), 'scene beat 4 does not end on Mn +2 and charge 17 each side');
  for (let t = 0; t <= 1.0001; t += 0.05) holds(paintScene(t).nan === 0, `the scene paints NaN at t = ${t.toFixed(2)}`);
  holds(Math.abs(story.beats.at(-1).to - 0.94) < 1e-9 && /^Filed: /.test(story.filed), 'story ends at 0.94 with a Filed line');
  ok('q1-halves story: every number Vess quotes is counted from the discs, species and charges drawn');

  /* ---- the bank ---- */
  const bank = (await import('../../src/learn/bank/unit10/q1-halves.json', { with: { type: 'json' } })).default;
  same(bank.problems.map(p => p.id), ['q1-halves#b1', 'q1-halves#b2'], 'bank ids');
  holds(bank.problems[1].options.find(o => o.id === bank.problems[1].answer).label === `+${D.oxNumber('MnO4', 'Mn')}`, 'bank b2 answer is not the manganese number');
  holds(bank.worked.id === 'q1-halves#w' && bank.worked.steps.length === 6, 'worked problem shape');
  ok('q1-halves bank: two problems and a worked problem, answers agree with the values worked by hand');

  if (!bad) ok('Brinewire q1-halves: every oxidation number, window count, half, join, probe reading, ledger row, slip, refusal and story number agrees with the values worked by hand');
  return bad;
}
