/**
 * verdigris-q2-checks.mjs — hand-worked checks for q2-scale (Reading the Scale). Each expected value was worked on paper:
 *
 *   strong acid c: pH = −log c (c ≫ √Kw):  0.10 → 1.00, 0.010 → 2.00, 0.0010 → 3.00, 1.0e-4 → 4.00, 3.2e-4 → 4 − log 3.2 = 4 − 0.50515 = 3.49485
 *   with water: h² − c h − 1e-14 = 0:  1e-6 → h = (1e-6 + √(1e-12 + 4e-14))/2 = 1.0099e-6 → 5.9957, 1e-7 → h = (1e-7 + √(1e-14 + 4e-14))/2 = 1.618e-7 → 6.7910,
 *               1e-8 → h = (1e-8 + √(1e-16 + 4e-14))/2 = 1.0512e-7 → 6.9783, 1e-9 → h = (1e-9 + √(1e-18 + 4e-14))/2 = 1.005e-7 → 6.9978
 *   sodium hydroxide c: pOH = −log c, pH = 14 − pOH: 0.10 → 13/1, 0.010 → 12/2, 0.0010 → 11/3
 *   barium hydroxide 0.025 M: [OH⁻] = 0.050, pOH = 1.30103, pH = 12.69897;  one hydroxide only: pOH 1.60206, pH 12.39794
 *   pure water: 25 °C [H₃O⁺] = √1.00e-14 = 1.00e-7, pH 7;  50 °C Kw 5.48e-14: √ = 2.3409e-7, pH = −log 2.3409e-7 = 6.6306
 *   2.4e-3 M hydrochloric acid: pH = 3 − log 2.4 = 3 − 0.38021 = 2.61979
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkVerdigrisQ2({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q2-scale ${msg}`); };
  const near = (got, want, tol, label) => { if (Math.abs(got - want) > tol) no(`${label}: got ${got}, expected ${want}`); };
  const holds = (c, label) => { if (!c) no(label); };

  installUiStub();
  const P = await import('../../src/learn/engine/phdata.js');
  const { scaleFlask, scaleMeter, scaleWindow } = await import('../../src/learn/table/kits/ph.js');
  const { PH_KIT } = await import('../../src/learn/table/kits/ph.js');
  const { scaleRead, sampleCount } = await import('../../src/learn/table/kits/ph-scale.js');
  const { fixtureLayout } = await import('../../src/learn/table/layout.js');
  const Q = await import('../../src/learn/quests/unit09/q2-scale.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { paintScene } = await import('../../src/ui/story-scenes.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const typed = (entry, value) => ({ type: { entry, value } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const S = (id, c, T = 25) => P.scaleSolution({ id, c, T });

  /* ---- the flasks ---- */
  near(S('hcl', 0.1).pH, 1, 5e-4, 'HCl 0.10'); near(S('hcl', 0.01).pH, 2, 5e-4, 'HCl 0.010'); near(S('hcl', 1e-3).pH, 3, 5e-4, 'HCl 0.0010');
  near(S('hcl', 3.2e-4).pH, 3.49485, 5e-4, 'HCl 3.2e-4');
  near(S('hcl', 1e-6).pH, 5.9957, 5e-4, 'HCl 1e-6'); near(S('hcl', 1e-7).pH, 6.7910, 5e-4, 'HCl 1e-7'); near(S('hcl', 1e-8).pH, 6.9783, 5e-4, 'HCl 1e-8'); near(S('hcl', 1e-9).pH, 6.9978, 5e-4, 'HCl 1e-9');
  for (const [c, a, b] of [[0.1, 13, 1], [0.01, 12, 2], [1e-3, 11, 3]]) { near(S('naoh', c).pH, a, 5e-4, `NaOH ${c} pH`); near(S('naoh', c).pOH, b, 5e-4, `NaOH ${c} pOH`); }
  near(S('baoh2', 0.025).pOH, 1.30103, 5e-4, 'Ba(OH)2 pOH'); near(S('baoh2', 0.025).pH, 12.69897, 5e-4, 'Ba(OH)2 pH');
  near(S('naoh', 0.025).pH, 12.39794, 5e-4, 'one hydroxide only');
  near(S('water', 0, 25).pH, 7, 5e-4, 'water 25'); near(S('water', 0, 50).pH, 6.6306, 5e-4, 'water 50'); near(S('water', 0, 50).h, 2.3409e-7, 1e-10, 'water 50 h');
  near(S('hcl', 2.4e-3).pH, 2.61979, 5e-4, 'HCl 2.4e-3');
  holds(scaleWindow({ props: { solute: { id: 'hcl', c: 0.1 }, units: 200 }, dials: {} }).ionized === 200, 'a strong acid window is not 200 of 200');
  holds(scaleWindow({ props: { solute: { id: 'water', c: 0 }, units: 200 }, dials: {} }).ionized === 0, 'the water window shows a pair');
  ok('q2-scale flasks: pH, pOH and window counts agree with the logs worked by hand');

  /* ---- the two meters and the sealed flask ---- */
  const a = Q.stateFor(2, [put('meter', 'slot:f1.seat'), put('meterOH', 'slot:f1.seat'), put('meterOH', 'slot:f2.seat')]).table;
  holds(a.fixtures.f1.props.noted.pH === 13 && a.fixtures.f1.props.noted.pOH === 1 && a.fixtures.f2.props.noted.pOH === 2, 'a flask does not keep both readings');
  const b = Q.stateFor(1, []).table;
  holds(!b.fixtures.f3.props.seat, 'stage 2 gives the unknown flask a seat');
  holds(!Q.stateFor(3, []).table.fixtures.f3.props.seat, 'stage 4 gives the barium hydroxide flask a seat');
  const sealed = Q.stateFor(7, []).table.fixtures.f1;
  holds(sealed.label === 'Sealed flask' && sealed.props.sealed, 'stage 8 flask is not sealed');
  const texts = [];
  const rec = new Proxy({}, { get: (_, k) => (k === 'fillText' ? t => texts.push(String(t)) : k === 'measureText' ? t => ({ width: String(t).length * 6 }) : () => rec), set: () => true });
  const bx = f => ({ sc: 4, X: v => v * 4, Y: v => v * 4, lay: fixtureLayout(f) });
  PH_KIT.paintFixture(rec, sealed, Q.stateFor(7, []).table, bx(sealed));
  holds(!texts.some(t => /2\.4|0\.0024/.test(t)), 'the sealed flask prints its strength');
  texts.length = 0;
  const w = Q.stateFor(6, [dial('f1', 'T', 2), put('meter', 'slot:f1.seat')]).table;
  PH_KIT.paintFixture(rec, w.fixtures.f1, w, bx(w.fixtures.f1));
  holds(texts.includes('H₃O⁺ 2.3 × 10⁻⁷ M') && texts.includes('OH⁻ 2.3 × 10⁻⁷ M'), 'the lens does not print 2.3 × 10⁻⁷ at 50 °C');
  texts.length = 0;
  PH_KIT.paintPiece(rec, w.pieces.meter, w, { x: 10, y: 10, r: 8, sc: 4, lit: false });
  holds(texts.includes('6.63'), 'the meter does not read 6.63 at 50 °C');
  ok('q2-scale instruments: both meters keep their readings, the unknown flasks have no seat, the sealed flask hides its strength, the lens and meter follow the dial');

  /* ---- typed stages: right figures pass, each slip is refused for its own reason ---- */
  for (const v of ['3.49', '3.5', '3.48']) holds(run(1, [typed('ph', v)]).ok, `stage 2 refused ${v}`);
  for (const v of ['4', '-3.49', '3.6', '3.2', '4.51']) { const r = run(1, [typed('ph', v)]); holds(!r.ok && r.msg, `stage 2 accepted or gave no reason for ${v}`); }
  for (const v of ['14', '14.0', '14.04']) holds(run(2, [typed('sum', v)]).ok, `stage 3 refused ${v}`);
  for (const v of ['7', '13', '1', '10']) { const r = run(2, [typed('sum', v)]); holds(!r.ok && r.msg && !/14/.test(r.msg), `stage 3 accepted, gave no reason, or leaked for ${v}`); }
  for (const v of ['12.70', '12.7', '12.68']) holds(run(3, [typed('ph', v)]).ok, `stage 4 refused ${v}`);
  for (const v of ['1.30', '12.40', '13', '12']) holds(!run(3, [typed('ph', v)]).ok, `stage 4 accepted ${v}`);
  holds(/two OH/.test(run(3, [typed('ph', '12.40')]).msg) && /acid/.test(run(3, [typed('ph', '1.30')]).msg), 'stage 4 slips have no reason of their own');
  for (const v of ['2.4e-3', '0.0024', '2.3e-3', '2.5e-3']) holds(run(7, [typed('h', v)]).ok, `stage 8 refused ${v}`);
  for (const v of ['2.62', '416.9', '2.4e-2', '0', '-0.002']) { const r = run(7, [typed('h', v)]); holds(!r.ok && r.msg, `stage 8 accepted or gave no reason for ${v}`); }
  holds(/the number the meter shows/.test(run(7, [typed('h', '2.62')]).msg), 'stage 8: the pH slip has no reason of its own');
  holds(run(1, [typed('ph', '')]).notYet && run(7, [typed('h', '')]).notYet, 'a typed stage does not wait for a figure');
  near(-Math.log10(3.2e-4 * 1e4), -0.50515, 5e-4, 'the exponent-only slip is 4');
  ok('q2-scale typed stages: right figures accepted, every slip refused with its own reason');

  /* ---- the dials ---- */
  const D3 = [{ run: 'f1' }, { run: 'f1' }, { run: 'f1' }];
  { const r1 = run(0, [{ run: 'f1' }]); const r3 = run(0, D3);
    holds(run(0, D3.slice(0, 2)).ok && !r1.ok && /2\.00/.test(r1.msg) && !r3.ok && /4\.00/.test(r3.msg), 'stage 1: pH 3 is accepted at two dilutions only, and a miss reads the flask'); }
  { const a = run(4, [{ run: 'f1' }]); const b = run(4, D3);
    holds(run(4, D3.slice(0, 2)).ok && !a.ok && /0\.19/.test(a.msg) && !b.ok && /0\.02/.test(b.msg), 'stage 5: the dilution after which one more would change the pH by under 0.1 is the answer'); }
  holds(run(6, [dial('pick', 'value', 2)]).ok && /2\.3 × 10⁻⁷/.test(run(6, [dial('pick', 'value', 1)]).msg) && !run(6, [dial('pick', 'value', 3)]).ok, 'stage 7 dial');
  holds(run(0, []).notYet && run(4, []).notYet && run(6, []).notYet, 'a dial stage does not wait');
  holds(run(0, []).notYet && run(4, []).notYet, 'a dilution stage waits for the first dilution');
  { const t = Q.stateFor(0, D3).table; const f = t.fixtures.f1; holds(Math.round(f.dials.steps.value) === 3 && Math.abs(scaleRead(f).pH - 4) < 1e-6 && sampleCount(f) === 1, 'three dilutions of 0.10 M acid read pH 4 and 1 of 1000 sample dots'); }
  ok('q2-scale dials: the one right setting is accepted, the others refused with a reading');

  /* ---- builders reach the fixture ---- */
  const fl = scaleFlask('x', { x: 50, y: 30 }, { solute: { id: 'water', c: 0 }, label: 'N', w: 52, window: 18, meter: false, legend: false, temps: [25, 50], lens: true, sealed: true, units: 100, cols: 10 });
  const fp = fl.fixture.props;
  holds(fl.size.w === 52 && fp.wh === 18 && fp.seat === null && fl.slot === null && fp.legend === false && fp.lens === true && fp.sealed && fp.units === 100 && fp.cols === 10 && fp.temps.length === 2 && fl.fixture.dials.T.labels.length === 2, 'a scaleFlask option does not reach the fixture');
  const m = scaleMeter('m', { x: 1, y: 1 }, 'pOH');
  holds(m.props.scale === 'pOH' && m.label === 'pOH meter', 'scaleMeter option does not reach the piece');
  ok('q2-scale builders: every option reaches the fixture');

  /* ---- rewards and story ---- */
  const body = i => Q.STAGES[i].reward.body;
  holds(/3\.49/.test(body(1)) && /12\.70/.test(body(3)) && /1\.30/.test(body(3)) && /7\.00/.test(body(4)) && /2\.4 × 10⁻³/.test(body(7)), 'a reward misses its figure');
  const st = QUEST_STORY['unit09/q2-scale'];
  const grab = t => { const out = []; const ctx = new Proxy({}, { get: (_, k) => (k === 'fillText' ? s => out.push(String(s)) : k === 'measureText' ? s => ({ width: String(s).length * 6 }) : () => ctx), set: () => true }); paintScene('scale', ctx, 1280, 720, t, 0); return out; };
  holds(['pH 1.00', 'pH 2.00', 'pH 3.00'].every(s => grab(0.25).includes(s)), 'story beat 1 does not draw pH 1.00, 2.00 and 3.00');
  holds(['= 14.00'].every(s => grab(0.5).filter(x => x === s).length === 3), 'story beat 2 does not draw three sums of 14.00');
  holds(['6.00', '6.79', '6.98', '7.00'].every(s => grab(0.76).includes(s)), 'story beat 3 does not draw 6.00, 6.79, 6.98 and 7.00');
  holds(grab(0.94).includes('pH 6.63') && grab(0.94).includes('pH 7.00') && grab(0.94).includes('H₃O⁺ 2.3 × 10⁻⁷'), 'story beat 4 does not draw pH 6.63 and 2.3 × 10⁻⁷');
  holds(/1\.00, 2\.00, 3\.00/.test(st.beats[0].say) && /14\.00/.test(st.beats[1].say) && /6\.00, 6\.79, 6\.98 and 7\.00/.test(st.beats[2].say) && /6\.63/.test(st.beats[3].say), 'a line of Vess quotes a number the scene does not draw');
  ok('q2-scale story: every number Vess quotes is drawn from the same flasks');

  /* ---- no refusal carries the rule ---- */
  const LEAK = /log\b|logarithm|tenfold|factor of ten|power|Kw|floor|equal amounts|neutral/i;
  for (const r of [run(0, [...D3, dial('pick', 'value', 2)]), run(1, [typed('ph', '4')]), run(1, [typed('ph', '3.7')]), run(2, [typed('sum', '7')]), run(3, [typed('ph', '12.40')]), run(4, [...D3, dial('pick', 'value', 1)]), run(6, [dial('pick', 'value', 1)]), run(7, [typed('h', '2.62')])]) {
    if (!r.msg) no('a refusal has no reason'); else if (LEAK.test(r.msg)) no(`a refusal carries the rule: "${r.msg}"`);
  }
  ok('q2-scale refusals: none carries the rule its stage asks for');
  return bad;
}
