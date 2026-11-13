/**
 * verdigris-q8-checks.mjs — hand-worked checks for q8-capacity (pKa, Protonation and Capacity). Every expected value below was worked on
 * paper, never produced by the code under test. pKa(acetic acid) = -log 1.8e-5 = 4.74473; one sphere is 1e-4 mol; the flask is 100 mL.
 *
 *   fraction as HA = 1/(1 + 10^(pH - pKa)):  acetic acid pH 3: 1/(1 + 0.01800) = 0.9823 -> 98 %;  pH 6: 1/(1 + 18.00) = 0.0526 -> 5 %
 *   methyl red (pKa 5.1):  pH 4.5: 1/(1 + 10^-0.6) = 0.7992 -> 80;  pH 5.0: 0.5575 -> 56;  pH 5.5: 1/(1 + 10^0.4) = 0.2847 -> 28
 *   the sealed acids at pH 4.5:  X (HF, pKa 3.1675) 1/(1 + 10^1.3325) = 0.0444 -> 4;  Y (acetic) 1/(1 + 10^-0.2447) = 0.6372 -> 64;  Z (HCN, pKa 9.3098) -> 100
 *   a pour of 5 spheres of acid: 10/10 -> 5/15: pKa + log(1/3) = 4.2675;  100/100 -> 95/105: pKa + log(95/105) = 4.7013
 *   flask 1 of the limit stage (40/40, 5-sphere pours, 180 mL after 8): after 4 pours 20/60: 4.2675;  after 8 pours the 40 acetate are used
 *     up exactly, leaving 0.0080 mol of acetic acid in 0.180 L = 0.04444 M: x = (-Ka + sqrt(Ka^2 + 4 Ka c))/2 = 8.855e-4, pH 3.0528, [A-] V = 1.59e-4 mol = 1.6 spheres
 *   the three ratios and one 10-sphere pour of base: 1:1 -> +log(110/90) = 0.0872;  10:1 (182/18 -> 172/28): +0.2163;
 *     100:1 (198/2): h^2 + 0.002 h - 3.564e-6 = 0 -> h = 1.135e-3, pH 2.945;  after the pour (188/12 in 0.110 L): h^2 + 0.01091 h - 3.076e-6 = 0 -> 2.79e-4, pH 3.554
 *   Ksp: Mg(OH)2 5.6e-12: s = (Ksp/4)^(1/3) = 1.119e-4 M = 0.1119 spheres in 100 mL;  AgCl 1.8e-10: s = 1.342e-5 M = 0.01342 spheres
 *     one pour of 10 spheres of acid takes 10 OH-, so 5 units of Mg(OH)2 more dissolve: 5.11 -> 5 spheres, 35 left;  after two, 10 and 30;  AgCl stays at 0 and 40
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkVerdigrisQ8({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q8-capacity ${msg}`); };
  const near = (got, want, tol, label) => { if (Math.abs(got - want) <= tol) return; no(`${label}: got ${got}, expected ${want}`); };
  const holds = (cond, label) => { if (!cond) no(label); };

  installUiStub();
  const P = await import('../../src/learn/engine/phdata.js');
  const { PH_KIT, stripRead, solidRead, solidAfter, saturatedSpheres, stripFixture, solidFixture, mixRead } = await import('../../src/learn/table/kits/ph.js');
  const { fixtureLayout } = await import('../../src/learn/table/layout.js');
  const Q = await import('../../src/learn/quests/unit09/q8-capacity.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { paintScene } = await import('../../src/ui/story-scenes.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const typed = (entry, value) => ({ type: { entry, value } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const pour = f => ({ run: f });

  const KA = 1.8e-5; const U = 1e-4;
  const pKa = -Math.log10(KA);
  const hand = (pk, pH) => 1 / (1 + Math.pow(10, pH - pk));

  /* ---- the strip against the closed forms ---- */
  near(hand(pKa, 3), 0.9823, 0.0002, 'hand: acetic acid at pH 3');
  near(P.fractions(pKa, 3).HA, 0.9823, 0.0002, 'planner: acetic acid at pH 3');
  near(P.fractions(pKa, 6).HA, 0.0526, 0.0002, 'planner: acetic acid at pH 6');
  near(P.fractions(5.1, 4.5).HA, 0.7992, 0.0002, 'planner: methyl red at 4.5');
  near(P.fractions(5.1, 5.0).HA, 0.5575, 0.0002, 'planner: methyl red at 5.0');
  near(P.fractions(5.1, 5.5).HA, 0.2847, 0.0002, 'planner: methyl red at 5.5');
  const C = Q.CHECKS;
  holds(C.pct(C.ACETIC, 3).join() === '98,2' && C.pct(C.ACETIC, 6).join() === '5,95', 'the acetic acid percentages are not 98/2 and 5/95');
  holds(C.pct(C.SEALED[0], 4.5)[0] === 4 && C.pct(C.SEALED[1], 4.5)[0] === 64 && C.pct(C.SEALED[2], 4.5)[0] === 100, 'the sealed acids at pH 4.5 are not 4, 64 and 100 percent acid form');
  near(C.SEALED[0].pKa, 3.1675, 0.0005, 'acid X pKa'); near(C.SEALED[2].pKa, 9.3098, 0.0005, 'acid Z pKa'); near(C.METHYL_RED.pKa, 5.1, 1e-9, 'methyl red pKa');
  ok('q8-capacity strip: fractions and percentages agree with 1/(1 + 10^(pH - pKa)) worked by hand');

  /* ---- the strip paints only the range the dial has crossed ---- */
  const t0 = Q.stateFor(1, []).table;
  holds(t0.fixtures.st.props.reach[0].lo === 5 && t0.fixtures.st.props.reach[0].hi === 5, 'a fresh strip has painted more than its start');
  const t1 = Q.stateFor(1, [dial('st', 'ph', 3)]).table;
  const r1 = stripRead(t1, 'st');
  holds(r1.lo === 3 && r1.hi === 5 && r1.pctHA === 98, 'moving the dial to 3 does not paint 3 to 5 and read 98');
  const t2 = Q.stateFor(1, [dial('st', 'ph', 3), dial('st', 'ph', 6), dial('st', 'ph', 4)]).table;
  holds(stripRead(t2, 'st').lo === 3 && stripRead(t2, 'st').hi === 6 && stripRead(t2, 'st').pH === 4, 'the strip forgets the range it crossed');
  const t7 = Q.stateFor(6, [dial('st', 'ph', 4.5), dial('st', 'acid', 2)]).table;
  holds(stripRead(t7, 'st').ai === 1 && stripRead(t7, 'st').lo === 4.5 && stripRead(t7, 'st').hi === 4.5 && t7.fixtures.st.props.reach[0].lo === 4.5, 'a second acid shares the first acid\'s painted range');
  const texts = [];
  const rec = new Proxy({}, { get: (_, k) => (k === 'fillText' ? tx => texts.push(String(tx)) : k === 'measureText' ? tx => ({ width: String(tx).length * 6 }) : () => rec), set: () => true });
  const b = f => ({ sc: 4, X: v => v * 4, Y: v => v * 4, lay: fixtureLayout(f) });
  PH_KIT.paintFixture(rec, t1.fixtures.st, t1, b(t1.fixtures.st));
  holds(texts.includes('CH₃COOH 98 %') && texts.includes('CH₃COO− 2 %'), 'the strip does not print 98 % and 2 % at the dial');
  ok('q8-capacity strip: it paints only over the pH range the dial has crossed, per acid');

  /* ---- stages 2 and 3 ---- */
  holds(run(1, [dial('pick', 'value', 2)]).ok, 'stage 2 refuses the right form pair');
  for (const v of [1, 3, 4]) { const r = run(1, [dial('pick', 'value', v)]); holds(!r.ok && /98 percent acetic acid/.test(r.msg) && /5 and 95/.test(r.msg), `stage 2: dial ${v} is accepted or refused without the readings`); }
  holds(run(1, []).notYet, 'stage 2 does not wait for the dial');
  for (const v of ['5.1', '5.0', '5.2', '4.95', '5.25']) holds(run(2, [typed('pka', v)]).ok, `stage 3 refused ${v}`);
  for (const v of ['5.5', '4.5', '7', '5.4']) { const r = run(2, [typed('pka', v)]); holds(!r.ok && /percent red form/.test(r.msg), `stage 3 accepted or gave no reading for ${v}`); }
  holds(/80 percent red form and 20 percent yellow/.test(run(2, [typed('pka', '4.5')]).msg) && /28 percent red form and 72/.test(run(2, [typed('pka', '5.5')]).msg), 'stage 3: the readings of the refusals are not 80/20 and 28/72');
  holds(run(2, [typed('pka', '')]).notYet && !run(2, [typed('pka', '12')]).ok, 'stage 3 waits or accepts out of range');
  ok('q8-capacity stages 2 and 3: the right pair and the crossing pass, refusals name the strip\'s percentages');

  /* ---- stage 4 and 6: the planner against hand values, through the flasks ---- */
  near(C.phOf(10, 10, 1, 0, 5), 4.2675, 0.008, '0.010 M after a 5-sphere pour');
  near(C.phOf(100, 100, 1, 0, 5), 4.7013, 0.004, '0.10 M after a 5-sphere pour');
  holds(run(3, [dial('pick', 'value', 2)]).ok && !run(3, [dial('pick', 'value', 1)]).ok && !run(3, [dial('pick', 'value', 3)]).ok, 'stage 4 accepts the 0.10 M flask only');
  holds(/4\.27/.test(run(3, [dial('pick', 'value', 1)]).msg) && /4\.70/.test(run(3, [dial('pick', 'value', 1)]).msg), 'stage 4: the refusal does not give the readings');
  const mv = r => C.phOf(r.ha, r.a, 0, 1) - C.phOf(r.ha, r.a);
  near(mv(C.RATIOS[0]), 0.0872, 0.003, '1:1 step'); near(mv(C.RATIOS[1]), 0.2163, 0.006, '10:1 step');
  near(C.phOf(198, 2), 2.945, 0.006, '100:1 start'); near(C.phOf(198, 2, 0, 1), 3.554, 0.01, '100:1 after the pour');
  holds(run(5, [dial('pick', 'value', 1)]).ok && !run(5, [dial('pick', 'value', 2)]).ok && !run(5, [dial('pick', 'value', 3)]).ok, 'stage 6 accepts 1 : 1 only');
  holds(/3\.7\d/.test(run(5, [dial('pick', 'value', 2)]).msg) && /4\.74/.test(run(5, [dial('pick', 'value', 2)]).msg), 'stage 6: the refusal does not give the readings');
  ok('q8-capacity stages 4 and 6: the pours agree with the closed forms and only the better buffer is accepted');

  /* ---- stage 5: the limit ---- */
  near(C.phOf(40, 40, 4, 0, 5), 4.2675, 0.006, 'flask 1 after 4 pours');
  near(C.phOf(40, 40, 8, 0, 5), 3.0528, 0.004, 'flask 1 after 8 pours');
  const fl = C.read(40, 40, 8, 0, 5);
  near(fl.A / U, 1.59, 0.1, 'flask 1 acetate after 8 pours');
  for (const v of ['24', '23', '25']) holds(run(4, [typed('n', v)]).ok, `stage 5 refused ${v}`);
  for (const v of ['8', '3', '16', '30', '120']) { const r = run(4, [typed('n', v)]); holds(!r.ok && /spheres of acid/.test(r.msg) && /120 spheres of acetate/.test(r.msg), `stage 5 accepted or gave no reading for ${v}`); }
  holds(run(4, [typed('n', '')]).notYet, 'stage 5 does not wait for a figure');
  const live = Q.stateFor(4, [pour('f1'), pour('f1')]).table;
  holds(mixRead(live, 'f1').na === 2 && live.fixtures.f2.noRun === true, 'flask 1 does not pour or flask 2 does');
  ok('q8-capacity stage 5: flask 1 is spent after 8 pours (3.05), flask 2 takes 24, each slip is refused with the counts');

  /* ---- stage 7 ---- */
  holds(run(6, [dial('pick', 'value', 2)]).ok && [1, 3].every(v => !run(6, [dial('pick', 'value', v)]).ok), 'stage 7 accepts acid Y only');
  holds(/4 percent acid form and 96 percent base/.test(run(6, [dial('pick', 'value', 1)]).msg) && /64 and 36/.test(run(6, [dial('pick', 'value', 1)]).msg), 'stage 7: the refusal does not give the readings');
  ok('q8-capacity stage 7: acid Y is the nearest to even at pH 4.5');

  /* ---- builders reach the fixture ---- */
  const sf = stripFixture('s', { x: 50, y: 30 }, { acids: [C.ACETIC, C.METHYL_RED], indicator: true, start: 3, w: 70, title: 'T' });
  holds(sf.fixture.props.indicator && sf.fixture.dials.ph.value === 3 && sf.fixture.dials.acid && sf.fixture.size.w === 70 && sf.fixture.props.reach[0].lo === 3 && sf.fixture.noRun, 'a stripFixture option does not reach the fixture');
  const so = solidFixture('b', { x: 50, y: 30 }, { salt: 'AgCl', solid: 20, basic: false, acidSph: 4, maxPour: 3, w: 50, title: 'T' });
  holds(so.fixture.props.solid === 20 && so.fixture.props.acidSph === 4 && so.fixture.dials.n.max === 3 && so.fixture.size.w === 50 && so.fixture.props.formula === 'AgCl', 'a solidFixture option does not reach the fixture');
  ok('q8-capacity builders: every option reaches the fixture');

  /* ---- rewards and story ---- */
  const body = i => Q.STAGES[i].reward.body;
  holds(/98 percent/.test(body(1)) && /95 percent/.test(body(1)) && /4\.74/.test(body(1)), 'stage 2 reward misses 98, 95 or 4.74');
  holds(/5\.1/.test(body(2)), 'stage 3 reward misses 5.1');
  holds(/4\.27/.test(body(3)) && /4\.70/.test(body(3)), 'stage 4 reward misses 4.27 or 4.70');
  holds(/40 spheres/.test(body(4)) && /8 pours/.test(body(4)) && /takes 24/.test(body(4)), 'stage 5 reward misses 40, 8 or 24');
  holds(/0\.09/.test(body(5)) && /0\.21/.test(body(5)) && /0\.61/.test(body(5)), 'stage 6 reward misses 0.09, 0.21 or 0.61');
  holds(/64 percent/.test(body(6)) && /36 percent/.test(body(6)), 'stage 7 reward misses 64 and 36');
  ok('q8-capacity rewards: the figures printed are the ones worked by hand');

  const story = QUEST_STORY['unit09/q8-capacity'];
  const grab = tt => {
    const out = [];
    const ctx = new Proxy({}, { get: (_, k) => (k === 'fillText' ? s => out.push(String(s)) : k === 'measureText' ? s => ({ width: String(s).length * 6 }) : () => ctx), set: () => true });
    paintScene('capacity-limit', ctx, 1280, 720, tt, 0);
    return out;
  };
  const one = grab(0.25); const two = grab(0.49); const three = grab(0.75); const four = grab(0.93);
  holds(['98 acetic acid', '2 acetate', '5 acetic acid', '95 acetate'].every(s => one.includes(s)), 'story beat 1 does not draw 98/2 and 5/95');
  holds(two.includes('pH 4.75 to 4.27') && two.includes('pH 4.74 to 4.70'), 'story beat 2 does not draw 4.75 to 4.27 and 4.74 to 4.70');
  holds(three.includes('40 acetate left') && three.includes('20 acetate left') && three.includes('2 acetate left') && three.includes('pH 3.05') && three.includes('pH 4.75'), 'story beat 3 does not draw 40, 20 and 2 acetate and pH 3.05');
  holds(four.includes('10 dissolved, 30 solid') && four.includes('0 dissolved, 40 solid'), 'story beat 4 does not draw 10/30 and 0/40');
  const say = story.beats.map(x => x.say);
  holds(/98 acetic acid to 2 acetate/.test(say[0]) && /5 to 95/.test(say[0]) && /4\.75 to 4\.27/.test(say[1]) && /4\.74 to 4\.70/.test(say[1]) && /40 spheres/.test(say[2]) && /8 pours 2 were left/.test(say[2]) && /4\.75 to 3\.05/.test(say[2]) && /10 spheres of magnesium/.test(say[3]), 'a line of Vess quotes a number the scene does not draw');
  ok('q8-capacity story: every number Vess quotes is drawn from the same planner counts');

  /* ---- no refusal carries the rule ---- */
  const LEAKS = {
    1: /protonation|below the pKa|above the pKa|pKa/i, 2: /pKa|crosses|equal/i, 3: /capacity|more concentrated|amount of/i,
    4: /spent|used up|divide|ratio|times/i, 5: /near equal|factor of ten|ratio/i, 6: /pKa|closest|nearest/i
  };
  const refusals = {
    1: [[dial('pick', 'value', 1)], [dial('pick', 'value', 3)], [dial('pick', 'value', 4)]],
    2: ['5.5', '4.5', '7'].map(v => [typed('pka', v)]),
    3: [[dial('pick', 'value', 1)], [dial('pick', 'value', 3)]],
    4: ['8', '3', '16'].map(v => [typed('n', v)]),
    5: [[dial('pick', 'value', 2)], [dial('pick', 'value', 3)]],
    6: [[dial('pick', 'value', 1)], [dial('pick', 'value', 3)]]
  };
  for (const [i, scripts] of Object.entries(refusals)) for (const script of scripts) {
    const r = run(Number(i), script);
    if (r.ok) continue;
    if (!r.msg) no(`stage ${Number(i) + 1}: a refusal has no reason`);
    else if (LEAKS[i] && LEAKS[i].test(r.msg)) no(`stage ${Number(i) + 1}: a refusal carries the rule: "${r.msg}"`);
  }
  void put;
  ok('q8-capacity refusals: none carries the rule its stage asks for');

  return bad;
}
