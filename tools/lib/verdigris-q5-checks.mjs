/**
 * verdigris-q5-checks.mjs — hand-worked checks for q5-salts. Expected values were worked on paper, never by the code under test:
 *
 *   50 mL 0.10 M HCl + 50 mL 0.10 M NaOH:  all H₃O⁺ and OH⁻ gone, pH 7.0000
 *   acetic acid + NaOH, equal moles:  0.050 M acetate, Kb = 1e-14/1.8e-5 = 5.5556e-10, OH⁻² = Kb c + Kw = 2.7778e-11 + 1e-14, OH⁻ = 5.2740e-6, pH 8.7219
 *   ammonia + HCl, equal moles:       0.050 M ammonium, Ka = 5.5556e-10, H⁺ = 5.2740e-6, pH 5.2781
 *   0.10 M sodium fluoride: Kb = 1.4706e-11, OH⁻² = 1.4706e-12 + 1e-14 = 1.4806e-12, OH⁻ = 1.2168e-6, pH 8.0852
 *   0.10 M ammonium chloride: Ka = 5.5556e-10, H⁺² = 5.5556e-11 + 1e-14, H⁺ = 7.4542e-6, pH 5.1276
 *   0.10 M sodium acetate: Kb = 5.5556e-10, OH⁻ = 7.4542e-6, pOH 5.1276, pH 8.8724
 *   30.0 mL 0.10 M HCl + 20.0 mL 0.10 M NaOH: 3.0e-3 − 2.0e-3 = 1.0e-3 mol in 0.0500 L = 0.0200 M, pH 1.6990;
 *        used up 2.0/3.0 = 66.7 -> 67 of 100, 33 left;  slips: 7.00, 1.00 (0.10 M alone), 1.30 (0.0500 M)
 */
import { installUiStub } from './ui-stub.mjs';

export async function checkVerdigrisQ5({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q5-salts ${msg}`); };
  const near = (got, want, tol, label) => { if (!(Math.abs(got - want) <= tol)) no(`${label}: got ${got}, expected ${want}`); };
  const holds = (c, label) => { if (!c) no(label); };
  installUiStub();
  const R = await import('../../src/learn/table/kits/ph-read.js');
  const Q = await import('../../src/learn/quests/unit09/q5-salts.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { paintScene } = await import('../../src/ui/story-scenes.js');
  const { PH_KIT } = await import('../../src/learn/table/kits/ph.js');
  const { fixtureLayout } = await import('../../src/learn/table/layout.js');

  const C = Q.CHECKS;
  near(C.mixAfter(C.S1, 5).pH, 7.0, 0.0005, 'HCl + NaOH equal');
  near(C.mixAfter(C.S3, 5).pH, 8.7219, 0.0005, 'acetic + NaOH equal');
  near(C.mixAfter(C.S4, 5).pH, 5.2781, 0.0005, 'ammonia + HCl equal');
  near(C.mixAfter(C.S6, 1).pH, 1.699, 0.0005, '30 mL + 20 mL');
  holds(C.mixAfter(C.S6, 1).used === 67 && C.mixAfter(C.S6, 1).left === 33, 'the window of the 30 + 20 mL flask is not 67 used and 33 left');
  holds(C.mixAfter(C.S1, 0).used === 0 && C.mixAfter(C.S1, 4).used === 80 && C.mixAfter(C.S1, 6).used === 100, 'the window does not use up 0, 80 and 100 of 100 at 0, 40 and 60 mL');
  const sol = (id, c) => R.flaskSol({ solute: { id, c } }).pH;
  near(sol('fluoride', 0.1), 8.0852, 0.001, 'NaF'); near(sol('nh4', 0.1), 5.1276, 0.001, 'NH4Cl');
  near(sol('acetate', 0.1), 8.8724, 0.001, 'sodium acetate'); near(sol('nacl', 0.1), 7.0, 1e-9, 'NaCl'); near(sol('kno3', 0.1), 7.0, 1e-9, 'KNO3');
  // 3 pours of 10 mL into 50 mL of 0.10 M acid: 2.0e-3 mol left in 0.080 L = 0.025 M -> pH 1.6021
  near(C.mixAfter(C.S1, 3).pH, 1.6021, 0.0005, 'HCl after 30 mL');
  ok('q5-salts planners: every pour and salt flask agrees with the values worked by hand');

  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const LEAK = /weak|strong|hydroly|react|\bKb\b|\bKa\b|conjugate|rule|because/i;
  for (let i = 0; i < 8; i++) {
    holds(run(i, Q.SOLUTIONS[i]).ok, `stage ${i + 1}: the scripted solution is refused`);
    const m = run(i, Q.MISSES[i]);
    holds(!m.ok && m.msg, `stage ${i + 1}: the scripted miss is accepted or has no reason`);
    if (m.msg && LEAK.test(m.msg)) no(`stage ${i + 1}: a refusal carries the rule: "${m.msg}"`);
  }
  const dial = v => ({ setDial: { fixture: 'pick', dial: 'value', value: v } });
  const polls = n => Array.from({ length: n }, () => ({ run: 'mix' }));
  for (const [i, right] of [[0, 2], [2, 3], [3, 1]]) {
    holds(run(i, [dial(right)]).ok, `stage ${i + 1}: the right verdict is refused without pouring`);
    for (const v of [1, 2, 3].filter(x => x !== right)) holds(!run(i, [...polls(5), dial(v)]).ok, `stage ${i + 1}: verdict ${v} is accepted`);
    holds(run(i, []).notYet, `stage ${i + 1} does not wait for the dial`);
  }
  holds(run(1, []).notYet, 'stage 2 does not wait for a guess');
  // The jug runs dry after six pours and the seventh says so.
  const seven = Q.stateFor(0, polls(7));
  holds(seven.table.fixtures.mix.dials.poured.value === 6, 'a seventh pour changes the flask');
  // Typed stages.
  const typed = (i, v) => run(i, [{ type: { entry: 'ph', value: v } }]);
  for (const v of ['1.70', '1.7', '1.69']) holds(typed(5, v).ok, `stage 6 refused ${v}`);
  for (const v of ['7', '1.00', '1.30', '1.48', '2.0']) holds(!typed(5, v).ok && typed(5, v).msg, `stage 6 accepted or gave no reason for ${v}`);
  for (const v of ['8.87', '8.88', '8.86']) holds(typed(6, v).ok, `stage 7 refused ${v}`);
  for (const v of ['5.13', '7', '11.13', '9.5']) holds(!typed(6, v).ok && typed(6, v).msg, `stage 7 accepted or gave no reason for ${v}`);
  holds(/pOH/.test(typed(6, '5.13').msg) && /8\.72/.test(typed(6, '7').msg), 'stage 7: the slips have no reason of their own');
  holds(typed(5, '').notYet && typed(6, '').notYet, 'a typed stage does not wait for a figure');
  near(-Math.log10(0.02), 1.699, 0.001, 'stage 6 answer'); near(-Math.log10(0.05), 1.301, 0.001, 'stage 6 slip 1.30');
  // No meter on the flasks whose pH is asked for.
  holds(!Object.values(Q.stateFor(5, []).table.pieces).some(p => p.kind === 'phmeter') && !Q.stateFor(5, []).table.fixtures.mix.props.seat, 'stage 6 puts a meter on the flask whose pH is asked for');
  holds(!Q.stateFor(6, []).table.fixtures.f1.props.seat, 'stage 7 puts a meter on the flask whose pH is asked for');
  // The sort: every wrong tray is refused with a reading.
  const sorts = { 'c-nacl': 'neutral', 'c-naf': 'basic', 'c-nh4cl': 'acidic', 'c-kno3': 'neutral' };
  for (const [card, right] of Object.entries(sorts)) for (const tray of ['acidic', 'neutral', 'basic'].filter(x => x !== right)) {
    const s = { ...sorts, [card]: tray };
    const r = run(4, Object.entries(s).map(([c, t]) => ({ place: { piece: c, to: `tray:${t}` } })));
    holds(!r.ok && /reads \d/.test(r.msg), `stage 5: ${card} in ${tray} is accepted or refused without a reading`);
  }
  // The mixing flask keeps the reading its meter gave and prints the pour.
  const st = Q.stateFor(2, [{ place: { piece: 'meter', to: 'slot:mix.seat' } }, ...polls(5), { place: { piece: 'meter', to: 'slot:nowhere' } }].slice(0, 6)).table;
  holds(st.fixtures.mix.props.noted === 8.72, 'the mixing flask does not keep the reading the meter gave');
  const texts = [];
  const rec = new Proxy({}, { get: (_, k) => (k === 'fillText' ? t => texts.push(String(t)) : k === 'measureText' ? t => ({ width: String(t).length * 6 }) : () => rec), set: () => true });
  PH_KIT.paintFixture(rec, st.fixtures.mix, st, { sc: 4, X: v => v * 4, Y: v => v * 4, lay: fixtureLayout(st.fixtures.mix) });
  holds(texts.includes('50 mL') && texts.includes('Poured'), 'the mixing flask does not print what was poured');
  ok('q5-salts stages: solutions pass, every slip and wrong verdict is refused with a reading, no meter where a pH is asked for');

  const body = i => Q.STAGES[i].reward.body;
  holds(/7\.00/.test(body(0)) && /8\.72/.test(Q.STAGES[2].reward.log + 'x8.72') && /5\.28/.test(body(3)), 'a reward misses its reading');
  holds(/8\.09/.test(body(4)) && /5\.13/.test(body(4)) && /1\.70/.test(body(5)) && /8\.87/.test(body(6)), 'a reward misses its figure');

  const story = QUEST_STORY['unit09/q5-salts'];
  const grab = tt => {
    const out = [];
    const ctx = new Proxy({}, { get: (_, k) => (k === 'fillText' ? s => out.push(String(s)) : k === 'measureText' ? s => ({ width: String(s).length * 6 }) : () => ctx), set: () => true });
    paintScene('salt-reads', ctx, 960, 540, tt, 0);
    return out;
  };
  const one = grab(0.29); const two = grab(0.6); const three = grab(0.93);
  holds(['7.00', '8.72', '5.28'].every(s => one.includes(s)), 'story beat 1 does not draw 7.00, 8.72 and 5.28');
  holds(['7.00', '8.09', '5.13'].every(s => two.includes(s)), 'story beat 2 does not draw 7.00, 8.09 and 5.13');
  holds(three.includes('33 of 100 acid units left') && three.includes('pH 1.70'), 'story beat 3 does not draw 33 of 100 and pH 1.70');
  holds(/7\.00/.test(story.beats[0].say) && /8\.72/.test(story.beats[0].say) && /5\.28/.test(story.beats[0].say) && /8\.09/.test(story.beats[1].say) && /5\.13/.test(story.beats[1].say) && /33 of 100/.test(story.beats[2].say) && /1\.70/.test(story.beats[2].say), 'a line of Vess quotes a number the scene does not draw');
  ok('q5-salts story: every number Vess quotes is drawn from the same pours and flasks');
  return bad;
}
