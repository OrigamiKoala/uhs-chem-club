/**
 * brinewire-q2-checks.mjs — hand-worked checks for q2-activity (Which Metal Gives). Each expected value below was worked on paper from the
 * CRC reduction potentials (Mg²⁺ −2.37, Zn²⁺ −0.76, Fe²⁺ −0.44, Ni²⁺ −0.26, Sn²⁺ −0.138, Pb²⁺ −0.126, H⁺ 0.00, Cu²⁺ +0.34, Ag⁺ +0.80,
 * Au³⁺ +1.50 V), never produced by the code under test. A strip is coated in a solution exactly when the solution's metal has the higher E°:
 *
 *   Zn strip: coated in Fe, Pb, Cu, Ag, clean in Zn          Cu strip: coated in Ag only          Ag, Au strips: coated in nothing
 *   Fe strip: coated in Pb, Cu, Ag, clean in Zn, Fe          Pb strip: coated in Cu, Ag           Ni strip: coated in Pb, Cu, Ag, clean in Zn, Fe
 *   Mg strip: coated in every other solution                 bubbles in acid (E° below 0): Mg, Zn, Fe, Pb, Ni, Sn; not Cu, Ag, Au
 *   the activity order of Zn, Fe, Pb, Cu is that order (E° −0.76, −0.44, −0.126, +0.34); with Ni it is Zn, Fe, Ni, Pb, Cu
 *   mixed copper/iron beaker (6 ions of each): Zn strip takes out both (12 Zn²⁺ left), Mg both (12 Mg²⁺), Fe only the copper (12 Fe²⁺), Ag neither
 *   the iron nail: wired to Zn or Mg (E° below −0.44) it shows no spots; wired to Cu or Sn (−0.138 is above −0.44) it shows blue spots
 *   the worked problem: 6.54 g ÷ 65.4 = 0.100 mol Zn, 0.100 mol Cu = 6.35 g, the strip changes by 6.35 − 6.54 = −0.19 g
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkBrinewireQ2({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q2-activity ${msg}`); };
  const holds = (cond, label) => { if (!cond) no(label); };
  const same = (got, want, label) => { if (JSON.stringify(got) !== JSON.stringify(want)) no(`${label}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`); };

  installUiStub();
  const Q = await import('../../src/learn/quests/unit10/q2-activity.js');
  const K = await import('../../src/learn/table/kits/cell.js');
  const Dip = await import('../../src/learn/table/kits/cell-dip.js');
  const A = await import('../../src/learn/engine/celldata-q2-activity.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { default: bank } = await import('../../src/learn/bank/unit10/q2-activity.json', { with: { type: 'json' } });
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

  /* ---- the planners behind the windows, against the table worked by hand ---- */
  const solutions = ['zn', 'fe', 'pb', 'cu', 'ag'];
  const coatedIn = strip => solutions.filter(ion => A.coated(strip, ion));
  same(coatedIn('zn'), ['fe', 'pb', 'cu', 'ag'], 'zinc strip');
  same(coatedIn('fe'), ['pb', 'cu', 'ag'], 'iron strip');
  same(coatedIn('pb'), ['cu', 'ag'], 'lead strip');
  same(coatedIn('cu'), ['ag'], 'copper strip');
  same(coatedIn('ag'), [], 'silver strip');
  same(coatedIn('au'), [], 'gold strip');
  same(coatedIn('ni'), ['pb', 'cu', 'ag'], 'nickel strip');
  same(coatedIn('mg'), solutions, 'magnesium strip');
  same(['mg', 'zn', 'fe', 'pb', 'ni', 'sn', 'cu', 'ag', 'au'].filter(m => A.dipResult(m, 'acid').gas), ['mg', 'zn', 'fe', 'pb', 'ni', 'sn'], 'strips that bubble in acid');
  same(A.dipResult('zn', 'mix').ions, { zn: 12 }, 'zinc in the mixed beaker');
  same(A.dipResult('mg', 'mix').ions, { mg: 12 }, 'magnesium in the mixed beaker');
  same(A.dipResult('fe', 'mix').ions, { fe: 12 }, 'iron in the mixed beaker');
  same(A.dipResult('ag', 'mix').ions, { cu: 6, fe: 6 }, 'silver in the mixed beaker');
  same(A.dipResult('fe', 'mix').coats, ['cu'], 'iron coats with copper only');
  same(A.dipResult('zn', 'mix').coats, ['cu', 'fe'], 'zinc coats with both');
  same(['zn', 'cu', 'mg', 'sn'].map(A.nailSpots), [0, 5, 0, 5], 'blue spots on the four nails');
  same(A.activityOrder(['zn', 'fe', 'pb', 'cu', 'ni']), ['zn', 'fe', 'ni', 'pb', 'cu'], 'order with nickel');
  same(A.dipWords(A.dipResult('zn', 'cu')), 'red-brown', 'zinc in copper words');
  same(A.dipWords(A.dipResult('zn', 'mix')), 'red-brown and dark grey', 'zinc in the mixed beaker words');
  same(A.dipWords(A.dipResult('cu', 'zn')), 'clean', 'copper in zinc words');
  same(A.dipWords(A.dipResult('mg', 'acid')), 'bubbles', 'magnesium in acid words');
  ok('q2-activity planners: every coating, bubble, mixed ion count and nail agrees with the table worked by hand');

  /* ---- the answers of the stages follow from the planners ---- */
  same(Q.CHECKS.S1_ANSWER, 'ag', 'stage 1 answer');
  same(Q.CHECKS.S2_WANT, ['zn', 'fe', 'pb', 'cu'], 'stage 2 order');
  same(Q.CHECKS.S7_WANT, ['zn', 'fe', 'ni', 'pb', 'cu'], 'stage 7 order');
  same(Q.CHECKS.S8_ANSWER, 'fe', 'stage 8 answer');
  same(Q.CHECKS.S6_PARTNERS.filter(m => A.nailSpots(m) === 0), ['zn', 'mg'], 'stage 6 protecting partners');

  /* ---- the rack: marks are kept, the window is honest ---- */
  const dip = (stripId, ion, ions = Q.CHECKS.S2_METALS) => put(`s-${stripId}`, `slot:dip.b${ions.indexOf(ion)}`);
  const s2 = script => Q.stateFor(1, script).table;
  const t1 = s2([dip('zn', 'cu'), dip('cu', 'cu'), dip('fe', 'zn')]);
  holds(Dip.triedIn(t1, 'dip', 'b3', 'zn')?.coats.join() === 'cu', 'a lifted zinc strip leaves its mark on the copper beaker');
  holds(Dip.triedIn(t1, 'dip', 'b3', 'cu')?.coats.length === 0, 'the copper strip in its own solution is marked clean');
  holds(Dip.triedIn(t1, 'dip', 'b0', 'fe')?.coats.length === 0, 'iron in the zinc solution is marked clean');
  holds(Dip.triedIn(t1, 'dip', 'b1', 'zn') === null, 'a dip never made leaves no mark');
  // The window paints what the planner says: a recording context sees the coating colour only when the strip is coated.
  const record = (state, fid = 'dip') => {
    const calls = { fill: [], text: [] };
    const noop = () => {};
    const ctx = {
      fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
      fillRect() { calls.fill.push(this.fillStyle); },
      fillText(s) { calls.text.push(s); },
      measureText: s => ({ width: String(s).length * 5 }),
      fill() { calls.fill.push(this.fillStyle); },
      save: noop, restore: noop, beginPath: noop, moveTo: noop, lineTo: noop, arc: noop, stroke: noop, strokeRect: noop, closePath: noop, rect: noop, clip: noop
    };
    const f = state.fixtures[fid];
    K.CELL_KIT.paintFixture(ctx, f, state, { x0: 0, y0: 0, x1: f.size.w, y1: f.size.h, sc: 1, X: v => v, Y: v => v, lay: { box: { x0: 0, y0: 0 } } });
    return calls;
  };
  const coatInk = Dip.COAT_INK.cu;
  const painted = record(s2([dip('zn', 'cu')]));
  holds(painted.fill.includes(coatInk) && painted.text.some(s => /Zn: red-brown/.test(s)), 'a coated strip paints its coating colour and its words');
  const cleanPaint = record(s2([dip('cu', 'zn')]));
  holds(!cleanPaint.fill.includes(coatInk) && cleanPaint.text.some(s => /Cu: clean/.test(s)), 'a clean strip paints no coating');
  const acid = Q.stateFor(4, [put('s-mg', 'slot:dip.b0')]).table;
  holds(record(acid).text.some(s => /Mg: bubbles/.test(s)), 'a strip in acid paints bubbles in words');
  const mixed = Q.stateFor(7, [put('s-fe', 'slot:dip.b1')]).table;
  holds(record(mixed).text.some(s => /Fe: red-brown$/.test(s)), 'the iron strip in the mixed beaker is coated with copper only');
  const spots = state => record(state, 'nails').fill.filter(c => c === '#3d7bbd').length;
  holds(spots(Q.stateFor(5, []).table) === 0, 'the nails show blue spots before the week');
  holds(spots(Q.stateFor(5, [{ run: 'nails' }]).table) === 10, 'the nails after the week do not show 5 blue spots on each of copper and tin');
  ok('q2-activity rack: marks are kept for lifted strips and the window paints the planner\'s coating, bubbles or clean');

  /* ---- grading: a right answer is accepted at once, a wrong one is refused with a reading ---- */
  holds(run(0, [dial('pick', 'value', 3)]).ok, 'stage 1 refuses the right solution for want of dips');
  for (const v of [1, 2]) { const r = run(0, [dial('pick', 'value', v)]); holds(!r.ok && !!r.msg, `stage 1 wrong dial ${v} is not refused with a reason`); }
  holds(/clean/.test(run(0, [dip('cu', 'zn', Q.CHECKS.S1_METALS), dial('pick', 'value', 1)]).msg), 'stage 1 wrong pick after the dip does not name the clean strip');
  holds(run(1, Q.CHECKS.S2_WANT.map((m, i) => put(`r-${m}`, `rail:${i}`))).ok, 'stage 2 refuses a right rank for want of dips');
  const bad2 = run(1, [dip('zn', 'fe'), ...['fe', 'zn', 'pb', 'cu'].map((m, i) => put(`r-${m}`, `rail:${i}`))]);
  holds(!bad2.ok && /coating in the Fe²⁺ solution/.test(bad2.msg), `stage 2 wrong rank is not refused with the dip (${bad2.msg})`);
  holds(run(3, [dial('pick', 'value', 2)]).ok, 'stage 4 refuses the right verdict for want of a dip');
  for (const v of [1, 3, 4]) holds(!run(3, [dip('cu', 'zn', Q.CHECKS.S4_METALS), dial('pick', 'value', v)]).ok, `stage 4 accepts verdict ${v}`);
  holds(run(4, ['mg', 'zn', 'fe', 'h', 'cu', 'ag'].map((m, i) => put(`r-${m}`, `rail:${i}`))).ok, 'stage 5 refuses a right place for hydrogen for want of dips');
  holds(run(4, ['fe', 'mg', 'zn', 'h', 'ag', 'cu'].map((m, i) => put(`r-${m}`, `rail:${i}`))).ok, 'stage 5 grades the order inside each side of hydrogen');
  for (const order of [['h', 'mg', 'zn', 'fe', 'cu', 'ag'], ['mg', 'zn', 'h', 'fe', 'cu', 'ag'], ['mg', 'zn', 'fe', 'cu', 'h', 'ag']]) {
    const r = run(4, order.map((m, i) => put(`r-${m}`, `rail:${i}`)));
    holds(!r.ok && !!r.msg, `stage 5 accepts hydrogen at ${order.indexOf('h')}`);
  }
  holds(run(5, ['zn', 'mg'].map(m => put(`p-${m}`, 'tray:clean'))).ok, 'stage 6 refuses the right cards for want of a week');
  const w6 = run(5, ['zn', 'mg', 'sn'].map(m => put(`p-${m}`, 'tray:clean')));
  holds(!w6.ok && /week/.test(w6.msg), 'stage 6 wrong set before the week does not say the nails have not been left');
  const w6b = run(5, [{ run: 'nails' }, ...['zn', 'mg', 'sn'].map(m => put(`p-${m}`, 'tray:clean'))]);
  holds(!w6b.ok && /tin showed blue spots/.test(w6b.msg), `stage 6 wrong set after the week is not refused with the nail (${w6b.msg})`);
  const w6c = run(5, [{ run: 'nails' }, put('p-zn', 'tray:clean')]);
  holds(!w6c.ok && /magnesium showed no blue spots/.test(w6c.msg), `stage 6 a missing card is not refused with its nail (${w6c.msg})`);
  holds(run(6, [put('r-ni', 'rail:2')]).ok, 'stage 7 refuses the right place for want of dips');
  for (const at of [0, 1, 3, 4]) holds(!run(6, [put('r-ni', `rail:${at}`)]).ok, `stage 7 accepts X at ${at}`);
  for (const v of [1, 3, 4]) holds(!run(7, [dial('pick', 'value', v)]).ok, `stage 8 accepts strip ${v}`);
  holds(run(7, [dial('pick', 'value', 2)]).ok, 'stage 8 refuses the iron strip for want of a dip');
  holds(/red-brown and dark grey/.test(run(7, [put('s-zn', 'slot:dip.b0'), dial('pick', 'value', 1)]).msg), 'stage 8 zinc refusal does not name both coatings');
  holds(/clean/.test(run(7, [put('s-ag', 'slot:dip.b3'), dial('pick', 'value', 4)]).msg), 'stage 8 silver refusal does not say clean');
  ok('q2-activity grading: right answers pass at once, every wrong one is refused with a reading the table shows');

  /* ---- no refusal carries the rule its stage asks for ---- */
  const rule = /\b(more|less) active\b|activity series|gives? electrons more readily|above hydrogen|below hydrogen|sacrificial|displac/i;
  const msgs = [];
  Q.MISSES.forEach((m, i) => { const r = run(i, m); if (r.msg) msgs.push(r.msg); });
  for (const m of [bad2.msg, w6b.msg, w6c.msg]) msgs.push(m);
  for (const m of msgs) holds(!rule.test(m), `a refusal carries the rule: "${m}"`);
  ok('q2-activity refusals: none carries the rule its stage asks for');

  /* ---- the story's and the bank's numbers are the planner's ---- */
  const story = JSON.stringify(QUEST_STORY['unit10/q2-activity'].beats);
  holds(/3 of the other solutions/.test(story) && /iron in 2/.test(story) && /lead in 1/.test(story), 'story ranks do not match the 3, 2, 1, 0 coats');
  holds(['displacement', 'activity series', 'used up'].every(w => story.includes(w)), 'story is missing a word the bench earned');
  holds(story.includes('had 5'), 'story nail spots do not match the nails (5)');
  const w = bank.worked;
  holds(Math.abs(6.54 / 65.4 - 0.1) < 1e-9 && Math.abs(0.1 * 63.5 - 6.35) < 1e-9 && Math.abs(6.35 - 6.54 + 0.19) < 1e-9, 'worked problem arithmetic');
  holds(w.steps.filter(s => s.kind === 'number').every(s => Math.abs(eval(s.calc) - s.answer) <= s.tol), 'worked problem calc does not match the answers');
  ok('q2-activity story and bank: every number agrees with the values worked by hand');

  if (!bad) ok('Brinewire q2-activity: every coating, bubble, ion count, nail, refusal and story number agrees with the values worked by hand');
  return bad;
}
