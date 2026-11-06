/**
 * verdigris-q7-checks.mjs — hand-worked checks for q7-buffer (Buffers). Every expected value below was worked on paper, never produced by
 * the code under test. One sphere is 1e-4 mol; the flask is 100 mL; one pour is 10 spheres (0.0010 mol) in 10 mL; acetic acid pKa = -log 1.8e-5 = 4.74473.
 *
 *   water + acid:   [H3O+] = 0.0010 / 0.110 = 9.0909e-3 M, pH 2.0414;  water + base: pOH 2.0414, pH 11.9586
 *   100 HA / 100 A-: pH = pKa + log(1) = 4.7447;  after acid 90 A- / 110 HA: pKa + log(90/110) = 4.6576;  after base 110/90: 4.8319
 *   50 HA / 150 A-:  pKa + log 3 = 5.2218;   10 HA / 100 A-: pKa + 1 = 5.7447;   ratio for pH 4.40: 10^(4.40 - pKa) = 0.45217
 *   HA only (100 spheres, 0.10 M) + acid: h = 0.0010/0.110 + [A-] with [A-] = Ka [HA]/h = 1.8e-4:  h = 9.27e-3, pH 2.033
 *   the HF buffer (pKa 3.1675), 60 / 60: 3.1675;  acid 50 A- / 70 HA: 3.0214;  base: 3.3136  (within 0.02: free hydronium is 2 % of the ions)
 * The planner is exact (charge balance), so the closed forms above agree to about 0.003 where the buffer is large.
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkVerdigrisQ7({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q7-buffer ${msg}`); };
  const near = (got, want, tol, label) => { if (Math.abs(got - want) <= tol) return; no(`${label}: got ${got}, expected ${want}`); };
  const holds = (cond, label) => { if (!cond) no(label); };

  installUiStub();
  const P = await import('../../src/learn/engine/phdata.js');
  const R = await import('../../src/learn/table/kits/ph-read.js');
  const { PH_KIT, mixFixture, mixRead } = await import('../../src/learn/table/kits/ph.js');
  const { fixtureLayout } = await import('../../src/learn/table/layout.js');
  const Q = await import('../../src/learn/quests/unit09/q7-buffer.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { paintScene } = await import('../../src/ui/story-scenes.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const typed = (entry, value) => ({ type: { entry, value } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const pour = f => ({ run: f });

  /* ---- the planner against the closed forms ---- */
  const KA = 1.8e-5; const U = 1e-4;
  const pKa = -Math.log10(KA);
  const st = (ha, a, na = 0, nb = 0, Ka = KA) => P.bufferState({ Ka, nHA: ha * U, nA: a * U, V: 0.1, nH: na * 10 * U, nOH: nb * 10 * U, vAdd: (na + nb) * 0.01 });
  near(pKa, 4.74473, 0.0001, 'pKa of acetic acid');
  near(st(0, 0, 1).pH, 2.0414, 0.001, 'water + acid');
  near(st(0, 0, 0, 1).pH, 11.9586, 0.001, 'water + base');
  near(st(100, 100).pH, 4.7447, 0.002, '100/100');
  near(st(100, 100, 1).pH, 4.6576, 0.003, '100/100 + acid');
  near(st(100, 100, 0, 1).pH, 4.8319, 0.003, '100/100 + base');
  near(st(50, 150).pH, 5.2218, 0.003, '50/150');
  near(st(10, 100).pH, 5.7447, 0.003, '10/100');
  near(st(100, 0, 1).pH, 2.033, 0.003, 'acetic acid alone + acid');
  const HF = 6.8e-4;
  near(st(60, 60, 0, 0, HF).pH, 3.1675, 0.01, 'HF buffer');
  near(st(60, 60, 1, 0, HF).pH, 3.0214, 0.02, 'HF buffer + acid');
  near(st(60, 60, 0, 1, HF).pH, 3.3136, 0.01, 'HF buffer + base');
  near(Math.pow(10, 4.40 - pKa), 0.45217, 0.0002, 'ratio for 4.40');
  // The species after the pour: 90 and 110 spheres, and the free hydronium is under half a sphere.
  const s1 = st(100, 100, 1);
  holds(Math.round(s1.A / U) === 90 && Math.round(s1.HA / U) === 110 && Math.round((s1.h * s1.Vt) / U) === 0, 'the buffer after an acid pour is not 90 and 110 spheres with no free hydronium');
  const w1 = st(0, 0, 1);
  holds(Math.round((w1.h * w1.Vt) / U) === 10, 'the water after an acid pour does not hold 10 spheres of hydronium');
  ok('q7-buffer planner: pH and sphere counts agree with the closed forms worked by hand');

  /* ---- the flask reads the planner through the table ---- */
  const t = Q.stateFor(1, [pour('fw'), pour('fm')]).table;
  const rw = mixRead(t, 'fw'); const rm = mixRead(t, 'fm');
  holds(rw.na === 1 && rm.na === 1 && Math.abs(rw.pH - 2.0414) < 0.001 && Math.abs(rm.pH - 4.6576) < 0.003 && Math.abs(rm.pH0 - 4.7447) < 0.002, 'a Pour does not move the flask to the hand-worked readings');
  holds(rm.Au === 90 && rm.HAu === 110 && rm.caughtHA === 10 && rm.caughtA === 0 && rw.H === 10, 'the window does not count 90, 110, 10 caught and 10 free');
  const t2 = Q.stateFor(7, [pour('fx'), pour('fx')]).table;
  holds(mixRead(t2, 'fx').na === 2, 'two presses do not make two pours');
  const full = Q.stateFor(7, Array.from({ length: 13 }, () => pour('fx'))).table;
  holds(mixRead(full, 'fx').pours === 12, 'the flask takes more pours than its limit');
  ok('q7-buffer flask: a Pour is the planner, counted, and capped');

  /* ---- stage 2 and the dial verdicts ---- */
  holds(run(1, [dial('pick', 'value', 1)]).ok, 'stage 2 refuses the water flask');
  for (const v of [2, 3]) { const r = run(1, [dial('pick', 'value', v)]); holds(!r.ok && /2\.04/.test(r.msg) && /4\.66/.test(r.msg) && /7\.00/.test(r.msg), `stage 2: dial ${v} is accepted or refused without the readings`); }
  holds(run(1, []).notYet, 'stage 2 does not wait for the dial');
  { const carry = to => ({ place: { piece: 'bench.h.h3o', to: `slot:bench.take.${to}` } });
    holds(run(3, [carry('a')]).ok && !run(3, [carry('ha')]).ok && !run(3, [carry('h3o')]).ok && run(3, []).notYet, 'stage 4 accepts the proton carried to the acetate only');
    holds(/90 acetate/.test(run(3, [carry('ha')]).msg) && /110 acetic/.test(run(3, [carry('ha')]).msg), 'stage 4: the refusal does not give the counts'); }
  holds(run(6, [dial('pick', 'value', 2)]).ok && [1, 3, 4].every(v => !run(6, [dial('pick', 'value', v)]).ok), 'stage 7 accepts "rises a little" only');
  holds(/4\.74/.test(run(6, [dial('pick', 'value', 4)]).msg) && /4\.83/.test(run(6, [dial('pick', 'value', 4)]).msg), 'stage 7: the refusal does not give the readings');
  ok('q7-buffer verdicts: only the right setting is accepted, each refusal names the readings');

  /* ---- stage 3: the build, every setting against a hand rule ---- */
  const L = Q.CHECKS.LEVELS;
  const handOK = (ha, a) => {
    if (ha < 10 || a < 10) return false; // one pour is 10 spheres: it uses up a member that holds fewer
    const base = Math.log10(a / ha);
    const acid = Math.log10((a - 10) / (ha + 10)) - base;
    const bas = Math.log10((a + 10) / (ha - 10 || 1e-9)) - base;
    return Math.abs(acid) < 0.5 && Math.abs(bas) < 0.5;
  };
  for (let i = 0; i < L.length; i++) for (let j = 0; j < L.length; j++) {
    const r = run(2, [dial('fb', 'ha', i + 1), dial('fb', 'a', j + 1)]);
    // a member of exactly 10 spheres is not in the levels, so the hand rule has no edge case here
    if (Boolean(r.ok) !== handOK(L[i], L[j])) no(`stage 3: ${L[i]} acetic acid and ${L[j]} acetate is ${r.ok ? 'accepted' : 'refused'}, the hand rule says ${handOK(L[i], L[j])}`);
    if (!r.ok && !r.msg) no('stage 3: a refusal with no reason');
  }
  holds(!run(2, []).ok, 'stage 3: an untouched flask is accepted');
  ok('q7-buffer stage 3: a flask is accepted when both pours move the pH under 0.5, as worked by hand for all 16 settings');

  /* ---- typed stages ---- */
  for (const v of ['5.22', '5.21', '5.24']) holds(run(4, [typed('ph', v)]).ok, `stage 5 refused ${v}`);
  for (const v of ['4.27', '4.74', '5.13', '5.74', '3']) { const r = run(4, [typed('ph', v)]); holds(!r.ok && r.msg, `stage 5 accepted or gave no reason for ${v}`); }
  holds(/below the 4\.74/.test(run(4, [typed('ph', '4.27')]).msg), 'stage 5: the inverted-ratio slip has no reason of its own');
  holds(/equal numbers|not equal|what the 100 and 100 flask reads/.test(run(4, [typed('ph', '4.74')]).msg), 'stage 5: the pKa-only slip has no reason of its own');
  holds(run(4, [typed('ph', '')]).notYet, 'stage 5 does not wait for a figure');
  for (const v of ['0.45', '0.44', '0.46', '0.452']) holds(run(5, [typed('ratio', v)]).ok, `stage 6 refused ${v}`);
  for (const v of ['2.2', '0.93', '0.34', '1', '0', '-1']) { const r = run(5, [typed('ratio', v)]); holds(!r.ok && r.msg, `stage 6 accepted or gave no reason for ${v}`); }
  holds(/reads 4\.7\d/.test(run(5, [typed('ratio', '0.93')]).msg) && /reads 5\.\d\d/.test(run(5, [typed('ratio', '2.2')]).msg), 'stage 6: a refusal does not name the reading of the ratio typed');
  ok('q7-buffer typed stages: right figures pass, every slip is refused with a reading');

  /* ---- stage 8: the sealed flasks ---- */
  holds(run(7, [dial('pick', 'value', 3)]).ok, 'stage 8 refuses flask Z');
  for (const v of [1, 2]) { const r = run(7, [dial('pick', 'value', v)]); holds(!r.ok && /2\.88/.test(r.msg) && /Flask/.test(r.msg), `stage 8: dial ${v} is accepted or refused without readings`); }
  const sealed = Q.CHECKS.SEALED;
  const shift = (s, na, nb) => st(s.ha, s.a, na, nb, s.Ka ?? KA).pH - st(s.ha, s.a, 0, 0, s.Ka ?? KA).pH;
  holds(Math.abs(shift(sealed[0], 1, 0)) < 0.1 && Math.abs(shift(sealed[1], 0, 1)) < 0.2 && Math.abs(shift(sealed[2], 1, 0)) > 0.5 && Math.abs(shift(sealed[2], 0, 1)) > 0.5, 'the sealed flasks do not separate by the readings');
  ok('q7-buffer stage 8: two flasks hold under 0.2, acetic acid alone moves over 0.5 for both pours');

  /* ---- the painter: the reading, the was-line, the sealed word ---- */
  const texts = [];
  const rec = new Proxy({}, { get: (_, k) => (k === 'fillText' ? tx => texts.push(String(tx)) : k === 'measureText' ? tx => ({ width: String(tx).length * 6 }) : () => rec), set: () => true });
  const b = f => ({ sc: 4, X: v => v * 4, Y: v => v * 4, lay: fixtureLayout(f) });
  PH_KIT.paintFixture(rec, t.fixtures.fm, t, b(t.fixtures.fm));
  holds(texts.includes('4.66') && texts.includes('was 4.74') && texts.includes('100 mL') && texts.includes('one sphere is 0.1 mmol'), 'a poured flask does not print its pH, its start and its scale');
  texts.length = 0;
  const sealedT = Q.stateFor(7, []).table;
  PH_KIT.paintFixture(rec, sealedT.fixtures.fz, sealedT, b(sealedT.fixtures.fz));
  holds(texts.includes('sealed') && texts.includes('2.88'), 'a sealed flask does not print the word sealed and its pH');
  texts.length = 0;
  const noMeter = Q.stateFor(4, []).table;
  PH_KIT.paintFixture(rec, noMeter.fixtures.f3, noMeter, b(noMeter.fixtures.f3));
  holds(!texts.includes('pH') && !texts.some(x => /^5\.2/.test(x)), 'the flask whose pH is asked for prints a meter reading');
  holds(!noMeter.fixtures.f3.runLabel && noMeter.fixtures.f3.noRun === true, 'a flask without a pour key has a Run key');
  const mf = mixFixture('x', { x: 50, y: 30 }, { ha: 7, a: 9, Ka: 6.8e-4, reagent: 'dial', build: true, levels: [0, 5], meter: false, sealed: true, rows: 6, w: 50, pour: false });
  const mp = mf.fixture.props;
  holds(mp.ha0 === 7 && mp.a0 === 9 && mp.Ka === 6.8e-4 && mp.reagent === 'dial' && mp.build && mp.levels.length === 2 && mp.meter === false && mp.sealed && mp.rows === 6 && mf.fixture.size.w === 50 && mf.fixture.noRun && mf.fixture.dials.rg && mf.fixture.dials.ha, 'a mixFixture option does not reach the fixture');
  holds(R.numText(0) === '0', 'numText prints a zero wrongly');
  ok('q7-buffer painters: the reading, the start, the sealed word, the absent meter, every builder option');

  /* ---- rewards and story ---- */
  const body = i => Q.STAGES[i].reward.body;
  holds(/7\.00|2\.04/.test(body(1)) && /4\.74/.test(body(1)) && /4\.66/.test(body(1)), 'stage 2 reward misses its readings');
  holds(/90/.test(body(3)) && /110/.test(body(3)), 'stage 4 reward misses 90 and 110');
  holds(/5\.22/.test(body(4)) && /0\.48/.test(body(4)), 'stage 5 reward misses 5.22 and 0.48');
  holds(/0\.45/.test(body(5)), 'stage 6 reward misses 0.45');
  holds(/4\.83/.test(body(6)) && /4\.74/.test(body(6)), 'stage 7 reward misses 4.74 and 4.83');
  ok('q7-buffer rewards: the figures printed are the ones worked by hand');

  const story = QUEST_STORY['unit09/q7-buffer'];
  const grab = tt => {
    const out = [];
    const ctx = new Proxy({}, { get: (_, k) => (k === 'fillText' ? s => out.push(String(s)) : k === 'measureText' ? s => ({ width: String(s).length * 6 }) : () => ctx), set: () => true });
    paintScene('buffer-catch', ctx, 1280, 720, tt, 0);
    return out;
  };
  const one = grab(0.27); const two = grab(0.5); const three = grab(0.75); const four = grab(0.93);
  holds(one.includes('pH 7.00 to 2.04') && one.includes('pH 4.74 to 4.66') && one.filter(x => x === '10 spheres of acid poured').length === 2, 'story beat 1 does not draw its two pH changes and its 10 spheres');
  holds(two.includes('acetate 90') && two.includes('acetic acid 110'), 'story beat 2 does not draw 90 and 110');
  holds(three.includes('acetate 110') && three.includes('acetic acid 90') && three.includes('pH 4.74 to 4.83'), 'story beat 3 does not draw 110, 90 and the pH 4.83');
  holds(['100 acetate', '100 acetic acid', '150 acetate', '50 acetic acid', '10 acetic acid', 'pH 4.74', 'pH 5.22', 'pH 5.74'].every(s => four.includes(s)), 'story beat 4 does not draw its three ratios and pH readings');
  const say = story.beats.map(x => x.say);
  holds(/7\.00 to 2\.04/.test(say[0]) && /4\.74 to 4\.66/.test(say[0]) && /to 90/.test(say[1]) && /110/.test(say[1]) && /4\.74 to 4\.83/.test(say[2]) && /5\.22/.test(say[3]) && /5\.74/.test(say[3]), 'a line of Vess quotes a number the scene does not draw');
  ok('q7-buffer story: every number Vess quotes is drawn from the same planner counts');

  /* ---- no refusal carries the rule ---- */
  const LEAKS = { 1: /buffer|conjugate|takes? up|both members/i, 3: /takes? up|caught|conjugate/i, 4: /Henderson|log\b|ratio|pKa plus/i, 5: /Henderson|log\b|power of ten|pKa/i, 6: /buffer|rises|falls/i, 7: /buffer|both members/i };
  const refusals = {
    1: [[dial('pick', 'value', 2)], [dial('pick', 'value', 3)]],
    3: [[dial('pick', 'value', 1)], [dial('pick', 'value', 3)]],
    4: ['4.27', '4.74', '5.13'].map(v => [typed('ph', v)]),
    5: ['2.2', '0.93', '0.34'].map(v => [typed('ratio', v)]),
    6: [[dial('pick', 'value', 1)], [dial('pick', 'value', 4)]],
    7: [[dial('pick', 'value', 1)], [dial('pick', 'value', 2)]]
  };
  for (const [i, scripts] of Object.entries(refusals)) for (const script of scripts) {
    const r = run(Number(i), script);
    if (r.ok) continue;
    if (!r.msg) no(`stage ${Number(i) + 1}: a refusal has no reason`);
    else if (LEAKS[i] && LEAKS[i].test(r.msg)) no(`stage ${Number(i) + 1}: a refusal carries the rule: "${r.msg}"`);
  }
  ok('q7-buffer refusals: none carries the rule its stage asks for');

  return bad;
}
