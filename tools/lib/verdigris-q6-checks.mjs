/**
 * verdigris-q6-checks.mjs — hand-worked checks for q6-titrate (Titration Curves). Every expected value was worked on paper, never by the
 * code under test:
 *
 *   25.0 mL of 0.100 M HCl + 0.100 M NaOH (2.50 mmol acid):  12.5 mL  excess H₃O⁺ 1.25 mmol / 37.5 mL = 0.03333 M  pH 1.477
 *                                                              24.9 mL  0.01 mmol / 49.9 mL = 2.004e-4 M          pH 3.698
 *                                                              25.0 mL  equal amounts                              pH 7.000
 *                                                              25.1 mL  excess OH⁻ 0.01 mmol / 50.1 mL = 1.996e-4 pH 10.300
 *   acetic acid, same amounts (Ka 1.8e-5):  equivalence: 2.5 mmol acetate / 50 mL = 0.050 M, Kb = Kw/Ka = 5.556e-10,
 *                                           x = √(Kb c) = 5.270e-6, pOH 5.278, pH 8.722;   half way: pH = pKa + log(1.25/1.25) = 4.745
 *   formic acid 20.0 mL of 0.100 M (Ka 1.8e-4):  equivalence 2.0 mmol / 40 mL = 0.050 M, Kb = 5.556e-11, x = 1.667e-6, pH 8.222;
 *                                                half way (10.0 mL): pKa 3.745 plus the correction log((1 + h V/n)/(1 − h V/n)) = 0.0047 -> 3.749
 *   sulfurous acid 20.0 mL of 0.0500 M (Ka 1.5e-2, 6.4e-8):  first equivalence C = 1.00 mmol / 30 mL = 0.03333 M of HSO₃⁻,
 *        h = √(Ka1 (Ka2 C + Kw) / (Ka1 + C)) = 2.573e-5, pH 4.590;  second: 1.00 mmol / 40 mL = 0.025 M SO₃²⁻, Kb = 1.5625e-7, x = 6.25e-5, pH 9.796
 *   unknown strong acid 0.1256 M: 25.00 mL needs 3.14 mmol = 31.4 mL;  31.3 mL: 0.01 mmol / 56.3 mL = 1.776e-4 M  pH 3.751;  31.4 mL: 7.000
 *   unknown weak acid (Ka 7.0e-6, 0.0800 M): start x² + Ka x − Ka c = 0, x = 7.448e-4, pH 3.128;  equivalence 20.0 mL; half way pH 5.155 + 0.0002
 *   acetic acid 20.0 mL of 0.150 M (eq 30.0 mL): the buffer relation V = Veq r/(1 + r), r = 10^(pH − pKa):
 *        bromothymol blue starts at pH 6.0: r = 18.01, V = 28.42 mL;  phenolphthalein at pH 8.3: r = 3593, V = 29.992 mL
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkVerdigrisQ6({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q6-titrate ${msg}`); };
  const near = (got, want, tol, label) => { if (Math.abs(got - want) <= tol) return; no(`${label}: got ${got}, expected ${want}`); };
  const holds = (cond, label) => { if (!cond) no(label); };

  installUiStub();
  const D = await import('../../src/learn/engine/phdata.js');
  const { PH_KIT } = await import('../../src/learn/table/kits/ph.js');
  const { curveRows } = await import('../../src/learn/table/kits/ph-curve.js');
  const { fixtureLayout } = await import('../../src/learn/table/layout.js');
  const Q = await import('../../src/learn/quests/unit09/q6-titrate.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { paintScene } = await import('../../src/ui/story-scenes.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const C = Q.CHECKS;
  const pH = (spec, v) => D.titrationML(spec, v);

  /* ---- the planner against the numbers worked by hand ---- */
  near(pH(C.HCL, 12.5), 1.477, 0.001, 'HCl at 12.5 mL'); near(pH(C.HCL, 24.9), 3.698, 0.001, 'HCl at 24.9 mL');
  near(pH(C.HCL, 25), 7.0, 0.001, 'HCl at 25.0 mL'); near(pH(C.HCL, 25.1), 10.300, 0.001, 'HCl at 25.1 mL');
  near(pH(C.ACETIC, 25), 8.722, 0.001, 'acetic equivalence'); near(pH(C.ACETIC, 12.5), 4.745, 0.001, 'acetic half way');
  near(pH(C.FORMIC, 20), 8.222, 0.001, 'formic equivalence'); near(pH(C.FORMIC, 10), 3.749, 0.001, 'formic half way');
  near(pH(C.SULFUROUS, 10), 4.590, 0.002, 'sulfurous first equivalence'); near(pH(C.SULFUROUS, 20), 9.796, 0.002, 'sulfurous second equivalence');
  near(pH(C.UNKNOWN_STRONG, 31.3), 3.751, 0.002, 'unknown strong at 31.3 mL'); near(pH(C.UNKNOWN_STRONG, 31.4), 7.0, 0.001, 'unknown strong at 31.4 mL');
  near(pH(C.UNKNOWN_WEAK, 0), 3.128, 0.001, 'unknown weak start'); near(pH(C.UNKNOWN_WEAK, 10), 5.155, 0.002, 'unknown weak half way');
  near(D.equivalenceML(C.UNKNOWN_STRONG), 31.4, 1e-9, 'unknown strong equivalence'); near(D.equivalenceML(C.UNKNOWN_WEAK), 20.0, 1e-9, 'unknown weak equivalence');
  near(D.equivalenceML(C.ACETIC_DYES), 30.0, 1e-9, 'dye flask equivalence');
  const bt = D.indicatorWindowML(C.ACETIC_DYES, D.INDICATORS.bromothymol); const pp = D.indicatorWindowML(C.ACETIC_DYES, D.INDICATORS.phenolphthalein);
  near(bt.from, 28.42, 0.01, 'bromothymol blue starts'); near(pp.from, 29.992, 0.003, 'phenolphthalein starts');
  holds(C.RIGHT_DYE.length === 1 && C.RIGHT_DYE[0] === 'phenolphthalein', 'the right dye is not phenolphthalein alone');
  ok('q6-titrate planner: every titration reading agrees with the values worked by hand');

  /* ---- the burette writes only what was poured; the display, the plot and the strip agree ---- */
  const poured = Q.stateFor(3, [{ setDial: { fixture: 'bur', dial: 'size', value: 1 } }, { run: 'bur' }, { run: 'bur' }, { setDial: { fixture: 'bur', dial: 'size', value: 3 } }, { run: 'bur' }]).table;
  holds(poured.fixtures.bur.dials.v.value === 101, 'two 5 mL pours and a 0.1 mL pour are not 10.1 mL');
  const rows = curveRows(poured, 'bur', 0);
  holds(rows.length === 3 && rows[2].x === 10.1 && Math.abs(rows[2].y - Math.round(pH(C.ACETIC, 10.1) * 100) / 100) < 1e-9, 'the strip does not hold the planner reading for each pour');
  holds(curveRows(poured, 'bur', 1).length === 3, 'the second flask has no reading for a pour');
  holds(Q.stateFor(0, []).table.recorder.rows.length === 0, 'a plot holds readings before any pour');
  const texts = [];
  const rec = new Proxy({}, { get: (_, k) => (k === 'fillText' ? t => texts.push(String(t)) : k === 'measureText' ? t => ({ width: String(t).length * 6 }) : () => rec), set: () => true });
  const b = f => ({ sc: 4, X: v => v * 4, Y: v => v * 4, lay: fixtureLayout(f) });
  PH_KIT.paintFixture(rec, poured.fixtures.bur, poured, b(poured.fixtures.bur));
  holds(texts.includes('Poured 10.1 mL') && texts.includes(`pH ${D.fmt(pH(C.ACETIC, 10.1), 2)}`) && texts.includes(`pH ${D.fmt(pH(C.FORMIC, 10.1), 2)}`), 'the burette does not print the volume and both displays');
  texts.length = 0;
  PH_KIT.paintFixture(rec, poured.fixtures.curve, poured, b(poured.fixtures.curve));
  holds(texts.includes('10.0') && texts.includes(D.fmt(pH(C.ACETIC, 10), 2)), 'the list does not repeat the readings');
  const over = Q.stateFor(0, [{ setDial: { fixture: 'bur', dial: 'size', value: 1 } }, ...Array.from({ length: 11 }, () => ({ run: 'bur' }))]).table;
  holds(over.fixtures.bur.dials.v.value === 500, 'the burette poured past its 50 mL');
  const fx = (i, id) => Q.STAGES[i].table.fixtures.find(f => f.id === id);
  const plot = fx(0, 'curve');
  holds(plot.size.w - 12 >= 36 && plot.size.h - 22 >= 22, 'the curve plot is smaller than 36 by 22 units');
  ok('q6-titrate burette and plot: a pour writes the planner reading for every flask, a plot holds only what was poured');

  /* ---- stage 1: the mark ---- */
  const mark = v => run(0, [{ setDial: { fixture: 'curve', dial: 'mark', value: v } }]);
  for (const v of [24.5, 25, 25.5]) holds(mark(v).ok, `stage 1 refused a mark at ${v}`);
  for (const v of [12, 20, 24, 26, 35]) { const r = mark(v); holds(!r.ok && /meter reads/.test(r.msg), `stage 1 mark ${v}: accepted or no reading`); }
  holds(run(0, []).notYet, 'stage 1 does not wait for the mark');
  /* ---- stages 3, 4, 6: the verdict dials ---- */
  const dial = (i, v) => run(i, [{ setDial: { fixture: 'pick', dial: 'value', value: v } }]);
  holds(dial(2, 3).ok && !dial(2, 1).ok && !dial(2, 2).ok && dial(2, 4).notYet, 'stage 3 verdict dial is wrong');
  holds(dial(3, 1).ok && [2, 3, 4].every(v => !dial(3, v).ok) && dial(3, 5).notYet, 'stage 4 verdict dial is wrong');
  holds(dial(5, 2).ok && [1, 3].every(v => !dial(5, v).ok) && dial(5, 4).notYet, 'stage 6 verdict dial is wrong');
  holds(/7\.00/.test(dial(2, 2).msg) && /8\.72/.test(dial(2, 2).msg), 'stage 3 refusal does not name both readings');
  holds(/4\.75/.test(dial(3, 2).msg) && /3\.75/.test(dial(3, 2).msg), 'stage 4 refusal does not name the half way readings');
  /* ---- stage 5: only the dye whose whole change is at the steep rise ---- */
  for (const id of C.DYES) {
    const r = run(4, [{ place: { piece: `c-${id}`, to: 'slot:dye' } }]);
    holds(Boolean(r.ok) === (id === 'phenolphthalein'), `stage 5 dye ${id}: ${r.ok ? 'accepted' : 'refused'}`);
    if (!r.ok) holds(/mL/.test(r.msg), `stage 5 dye ${id}: refusal names no volume`);
  }
  ok('q6-titrate stages 1, 3 to 6: marks, verdicts and dyes accepted and refused as the readings show');

  /* ---- stages 7 and 8: typed figures ---- */
  const typed = (i, entry, v) => run(i, [{ type: { entry, value: v } }]);
  for (const v of ['0.126', '0.1256', '0.125', '0.1260']) holds(typed(6, 'c', v).ok, `stage 7 refused ${v}`);
  for (const v of ['3.14', '1.256', '0.0796', '0.100', '0.0314', '0.2']) { const r = typed(6, 'c', v); holds(!r.ok && r.msg, `stage 7 accepted or gave no reason for ${v}`); }
  holds(/times the volume/.test(typed(6, 'c', '3.14').msg) && /the 25\.00 mL/.test(typed(6, 'c', '1.256').msg) && /burette/.test(typed(6, 'c', '0.100').msg), 'stage 7 slips lack their own reasons');
  near(0.100 * 31.4, 3.14, 1e-9, 'stage 7 slip 3.14'); near(31.4 / 25, 1.256, 1e-9, 'stage 7 slip 1.256'); near(0.100 * 31.4 / 25, 0.1256, 1e-9, 'stage 7 answer');
  for (const v of ['7.0e-6', '6.9e-6', '6.3e-6', '7.5e-6']) holds(typed(7, 'ka', v).ok, `stage 8 refused ${v}`);
  for (const v of ['5.16', '3.13', '7.4e-4', '1e-9', '7e-5']) { const r = typed(7, 'ka', v); holds(!r.ok && r.msg, `stage 8 accepted or gave no reason for ${v}`); }
  holds(/pH reading/.test(typed(7, 'ka', '5.16').msg) && /no base poured/.test(typed(7, 'ka', '7.4e-4').msg), 'stage 8 slips lack their own reasons');
  holds(typed(6, 'c', '').notYet && typed(7, 'ka', '').notYet, 'a typed stage does not wait for a figure');
  near(Math.pow(10, -pH(C.UNKNOWN_WEAK, 10)), 6.99e-6, 0.05e-6, 'stage 8 half way reading gives Ka');
  ok('q6-titrate typed stages: right figures accepted, every slip refused for its own reason');

  /* ---- the meter is absent where the stage would be answered by it ---- */
  const s7 = fx(6, 'bur').props.samples[0]; const s8 = fx(7, 'bur').props.samples[0];
  holds(!s7.meter && s7.tint === 'bromothymol' && s8.meter, 'stage 7 shows the acid\'s pH or stage 8 does not');
  holds(!fx(6, 'curve') && !fx(4, 'curve'), 'a curve stands on stage 5 or 7');

  /* ---- rewards print what was worked out ---- */
  const body = i => Q.STAGES[i].reward.body;
  holds(/25\.0 mL/.test(body(0)) && /7\.00/.test(body(0)), 'stage 1 reward misses 25.0 mL or 7.00');
  holds(/7\.00/.test(body(2)) && /8\.72/.test(body(2)), 'stage 3 reward misses 7.00 or 8.72');
  holds(/4\.75/.test(body(3)) && /3\.75/.test(body(3)) && /4\.74/.test(body(3)), 'stage 4 reward misses 4.75, 3.75 or 4.74');
  holds(/29\.99/.test(body(4)) && /30\.10/.test(body(4)) && /28\.4/.test(body(4)), 'stage 5 reward misses its windows');
  holds(/10\.0 mL/.test(body(5)) && /20\.0 mL/.test(body(5)), 'stage 6 reward misses 10.0 and 20.0 mL');
  holds(/31\.4 mL/.test(body(6)) && /0\.126/.test(body(6)), 'stage 7 reward misses 31.4 or 0.126');
  holds(/5\.16/.test(body(7)) && /10\.0 mL/.test(body(7)), 'stage 8 reward misses 5.16 or 10.0 mL');
  ok('q6-titrate rewards: the figures printed are the ones worked by hand');

  /* ---- the story: the numbers Vess quotes are drawn from the traced curves ---- */
  const st = QUEST_STORY['unit09/q6-titrate'];
  const grab = t => {
    const out = [];
    const ctx = new Proxy({}, { get: (_, k) => (k === 'fillText' ? s => out.push(String(s)) : k === 'measureText' ? s => ({ width: String(s).length * 6 }) : () => ctx), set: () => true });
    paintScene('titration-reads', ctx, 960, 540, t, 0);
    return out;
  };
  const [one, two, three, four] = [0.26, 0.52, 0.76, 0.94].map(grab);
  holds(one.some(s => /25\.0 mL, pH 7\.00/.test(s)), 'story beat 1 does not draw 25.0 mL and pH 7.00');
  holds(two.some(s => /acetic acid 8\.72/.test(s)) && two.some(s => /hydrochloric acid 7\.00/.test(s)), 'story beat 2 does not draw 8.72 and 7.00');
  holds(three.some(s => /acetic acid: 4\.75 at 12\.5 mL, pKa 4\.74/.test(s)) && three.some(s => /formic acid: 3\.75 at 10\.0 mL, pKa 3\.74/.test(s)), 'story beat 3 does not draw the half way readings');
  holds(four.includes('10.0 mL') && four.includes('20.0 mL'), 'story beat 4 does not draw 10.0 and 20.0 mL');
  holds(/8\.72/.test(st.beats[1].say) && /7\.00/.test(st.beats[1].say) && /4\.75/.test(st.beats[2].say) && /3\.75/.test(st.beats[2].say) && /10\.0 mL and 20\.0 mL/.test(st.beats[3].say), 'a line of Vess quotes a number the scene does not draw');
  ok('q6-titrate story: every number Vess quotes is drawn from the same traced curves');

  /* ---- no refusal carries the rule its stage asks for ---- */
  const LEAKS = {
    0: /equal amount|moles|one for one|neutral/i, 2: /weak base|conjugate|hydroly|acetate/i, 3: /pKa|equals|Ka\b/i,
    4: /steep|equivalence/i, 5: /proton|polyprotic|twice/i, 6: /divide|multiply|moles|mmol/i, 7: /half|pKa|equivalence/i
  };
  const slips = {
    0: [[{ setDial: { fixture: 'curve', dial: 'mark', value: 12 } }], [{ setDial: { fixture: 'curve', dial: 'mark', value: 35 } }]],
    2: [[{ setDial: { fixture: 'pick', dial: 'value', value: 1 } }], [{ setDial: { fixture: 'pick', dial: 'value', value: 2 } }]],
    3: [2, 3, 4].map(v => [{ setDial: { fixture: 'pick', dial: 'value', value: v } }]),
    4: ['methylOrange', 'methylRed', 'bromothymol'].map(id => [{ place: { piece: `c-${id}`, to: 'slot:dye' } }]),
    5: [1, 3].map(v => [{ setDial: { fixture: 'pick', dial: 'value', value: v } }]),
    6: ['3.14', '1.256', '0.100', '0.2'].map(v => [{ type: { entry: 'c', value: v } }]),
    7: ['5.16', '7.4e-4', '1e-9'].map(v => [{ type: { entry: 'ka', value: v } }])
  };
  for (const [i, scripts] of Object.entries(slips)) {
    for (const script of scripts) {
      const r = run(Number(i), script);
      if (r.ok) continue;
      if (!r.msg) no(`stage ${Number(i) + 1}: a refusal has no reason`);
      else if (LEAKS[i].test(r.msg)) no(`stage ${Number(i) + 1}: a refusal carries the rule: "${r.msg}"`);
    }
  }
  ok('q6-titrate refusals: none carries the rule its stage asks for');

  return bad;
}
