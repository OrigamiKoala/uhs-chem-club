/**
 * verdigris-q1-checks.mjs — hand-worked checks for q1-handover (The Handover). Each expected value was worked on paper:
 *
 *   ammonia 1.0e-4 M, Kb 1.8e-5: x² + 1.8e-5 x − 1.8e-9 = 0, √(3.24e-10 + 7.2e-9) = 8.6741e-5, x = 3.4371e-5, share 34.37 %, window 8 × 0.3437 = 2.75 -> 3
 *   hydrochloric and nitric acid 0.10 M: fully ionized, 8 of 8
 *   pure water 25 °C: [H₃O⁺] = [OH⁻] = √1.0e-14 = 1.0e-7;  50 °C: √5.48e-14 = 2.3409e-7
 *   with 1.0e-3 M strong acid: [OH⁻] = 1e-14/1e-3 = 1e-11;  with 1.0e-2 M strong base: [H₃O⁺] = 1e-12
 *   hydrogens and charge, read off each formula by eye: H₂SO₄ 2/0, HSO₄⁻ 1/−1, H₂O 2/0, H₃O⁺ 3/+1, OH⁻ 1/−1, CH₃COOH 4/0, CH₃COO⁻ 3/−1,
 *   NH₃ 3/0, NH₄⁺ 4/+1, HCO₃⁻ 1/−1, CO₃²⁻ 0/−2, HNO₃ 1/0, NO₃⁻ 0/−1, HCN 1/0, CN⁻ 0/−1, NH₂⁻ 2/−1
 *   conjugate pairs of the three reactions: H₂SO₄/HSO₄⁻ and H₂O/H₃O⁺;  CH₃COOH/CH₃COO⁻ and NH₃/NH₄⁺;  HCO₃⁻/CO₃²⁻ and OH⁻/H₂O
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkVerdigrisQ1({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q1-handover ${msg}`); };
  const rel = (got, want, tol, label) => { if (Math.abs(got / want - 1) > tol) no(`${label}: got ${got}, expected ${want}`); };
  const holds = (c, label) => { if (!c) no(label); };

  installUiStub();
  const P = await import('../../src/learn/engine/phdata.js');
  const R = await import('../../src/learn/table/kits/ph-read.js');
  const { pourRead, pourFixture } = await import('../../src/learn/table/kits/ph.js');
  const Q = await import('../../src/learn/quests/unit09/q1-handover.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { paintScene } = await import('../../src/ui/story-scenes.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });

  /* ---- windows ---- */
  const cnt = (id, c) => R.windowOf({ solute: { id, c }, units: 8 }).ionized;
  holds(cnt('hcl', 0.1) === 8 && cnt('hno3', 0.1) === 8 && cnt('nh3', 1e-4) === 3, 'the pour windows are not 8, 8 and 3 of 8');
  rel(R.flaskSol({ solute: { id: 'nh3', c: 1e-4 } }).ionized, 0.34371, 1e-3, 'ammonia 1.0e-4 M share');
  ok('q1-handover windows: 8, 8 and 3 of 8 cells change, agreeing with the quadratic worked by hand');

  /* ---- the waters ---- */
  const w25 = P.waterIons({}); const w50 = P.waterIons({ T: 50 });
  rel(w25.h, 1e-7, 1e-9, 'pure water H'); rel(w25.oh, 1e-7, 1e-9, 'pure water OH'); rel(w50.h, 2.3409e-7, 1e-4, 'water at 50 °C');
  rel(P.waterIons({ acid: 1e-3 }).oh, 1e-11, 1e-6, 'OH with acid'); rel(P.waterIons({ base: 1e-2 }).h, 1e-12, 1e-6, 'H with base');
  ok('q1-handover waters: 1.0e-7 each at 25 °C, 2.34e-7 at 50 °C, 1e-11 and 1e-12 with acid and base added');

  /* ---- formulas and pairs ---- */
  const HAND = { 'H₂SO₄': [2, 0], 'HSO₄⁻': [1, -1], 'H₂O': [2, 0], 'H₃O⁺': [3, 1], 'OH⁻': [1, -1], 'CH₃COOH': [4, 0], 'CH₃COO⁻': [3, -1], 'NH₃': [3, 0], 'NH₄⁺': [4, 1], 'HCO₃⁻': [1, -1], 'CO₃²⁻': [0, -2], 'HNO₃': [1, 0], 'NO₃⁻': [0, -1], 'HCN': [1, 0], 'CN⁻': [0, -1], 'NH₂⁻': [2, -1] };
  for (const [f, [h, q]] of Object.entries(HAND)) { const s = P.formulaStats(f); holds(s.h === h && s.charge === q, `${f}: parsed ${s.h} H and ${s.charge}, expected ${h} and ${q}`); }
  const PAIRS = [['H₂SO₄', 'HSO₄⁻'], ['H₂O', 'H₃O⁺'], ['CH₃COOH', 'CH₃COO⁻'], ['NH₃', 'NH₄⁺'], ['HCO₃⁻', 'CO₃²⁻'], ['OH⁻', 'H₂O']];
  const acidOf = ([a, b]) => (HAND[a][0] === HAND[b][0] + 1 ? [a, b] : [b, a]);
  for (const p of PAIRS) { const [a, b] = acidOf(p); holds(P.isConjugate(a, b), `${a}/${b} is not a conjugate pair`); holds(!P.isConjugate(b, a), `${b}/${a} reads as a pair the wrong way`); }
  holds(!P.isConjugate('H₂O', 'H₂O') && !P.isConjugate('NH₄⁺', 'NH₂⁻') && !P.isConjugate('HNO₃', 'CN⁻'), 'a non-pair is accepted');
  ok('q1-handover pairs: hydrogens and charge parse as read by eye, and only the one-proton pairs are conjugate');

  /* ---- stage 4 and 8: every wrong laying is refused, the right one accepted, each with a reason ---- */
  const l = f => `l-${f.replace(/[^A-Za-z0-9]/g, m => `u${m.charCodeAt(0)}`)}`;
  const ans = { 0: 'NO₃⁻', 1: 'OH⁻', 2: 'NH₃', 3: 'CN⁻' };
  for (const [i, left] of Object.entries(Q.CHECKS.S4_LEFT)) void i, void left;
  for (const slot of [0, 1, 2, 3]) {
    for (const f of Q.CHECKS.S4_LEFT) {
      const script = Object.entries(ans).map(([k, v]) => put(l(Number(k) === slot ? f : v), `slot:p${k}`));
      // a chip cannot be in two places: skip a script that lays one chip twice
      if (new Set(script.map(s => s.place.piece)).size < 4) continue;
      const r = run(3, script);
      const right = f === ans[slot];
      if (Boolean(r.ok) !== right) no(`stage 4: ${f} beside ${Q.CHECKS.S4_ACIDS[slot]} is ${r.ok ? 'accepted' : 'refused'}`);
      if (!r.ok && !r.msg) no('stage 4: a refusal with no reason');
    }
  }
  holds(run(3, []).notYet, 'stage 4 does not wait for a chip');
  ok('q1-handover stage 4: only the conjugate leftover is accepted beside each acid');

  /* ---- stages 1, 3, 5, 7 ---- */

  const chip = f => `c-${f.replace(/[^A-Za-z0-9]/g, m => `u${m.charCodeAt(0)}`)}`;
  holds(run(0, [put(chip('H₃O⁺'), 'slot:holds')]).ok, 'stage 1 refuses H₃O⁺');
  for (const f of ['HCl', 'Cl⁻', 'H₂O', 'OH⁻']) { const r = run(0, [put(chip(f), 'slot:holds')]); holds(!r.ok && r.msg, `stage 1 accepts or gives no reason for ${f}`); }
  holds(run(2, [{ setDial: { fixture: 'verdict', dial: 'value', value: 2 } }]).ok && !run(2, [{ setDial: { fixture: 'verdict', dial: 'value', value: 1 } }]).ok && !run(2, [{ setDial: { fixture: 'verdict', dial: 'value', value: 3 } }]).ok, 'stage 3 verdicts');
  holds(run(4, [put(chip('H₂O'), 'slot:both')]).ok, 'stage 5 refuses water');
  for (const f of ['HNO₃', 'NH₃', 'NO₃⁻', 'NH₄⁺']) holds(!run(4, [put(chip(f), 'slot:both')]).ok, `stage 5 accepts ${f}`);
  holds(run(6, [{ setDial: { fixture: 'verdict', dial: 'value', value: 2 } }]).ok && !run(6, [{ setDial: { fixture: 'verdict', dial: 'value', value: 1 } }]).ok, 'stage 7 verdicts');
  ok('q1-handover stages 1, 3, 5 and 7: the one right answer is accepted, the others refused with a reading');

  /* ---- stage 6: only the product of the two ions (or its inverse) is steady ---- */
  const slots = ['slot:rig.t1', 'slot:rig.t2', 'slot:rig.b1', 'slot:rig.b2'];
  holds(run(5, [put('t-H', slots[0]), put('t-OH', slots[1])]).ok, 'stage 6 refuses the product');
  holds(run(5, [put('t-H', slots[2]), put('t-OH', slots[3])]).ok, 'stage 6 refuses the inverse product');
  for (const sc of [[put('t-H', slots[0])], [put('t-OH', slots[0])], [put('t-H', slots[0]), put('t-OH', slots[2])], [put('t-OH', slots[0]), put('t-H', slots[2])]]) {
    const r = run(5, sc); holds(!r.ok && /reads/.test(r.msg) && !/10⁻¹⁴/.test(r.msg), 'stage 6 accepts a wrong arrangement or leaks the answer');
  }
  ok('q1-handover stage 6: only H₃O⁺ × OH⁻ (or its inverse) reads one number in all three waters');

  /* ---- builders reach the fixture ---- */
  const pf = pourFixture('x', { x: 50, y: 30 }, { scene: 'base', solute: { id: 'nh3', c: 1e-4 }, w: 90, window: 30, mark: 'water', cols: 2, units: 12, label: 'L' });
  holds(pf.size.w === 90 && pf.props.wh === 30 && pf.props.cols === 2 && pf.props.units === 12 && pf.label === 'L' && pf.dials.mark.value === 3 && pf.props.hidden.includes('mark'), 'a pourFixture option does not reach the fixture');
  void pourRead;

  /* ---- rewards and story ---- */
  const body = i => Q.STAGES[i].reward.body;
  holds(/1\.0 × 10⁻⁷/.test(body(5)) && /1\.0 × 10⁻¹⁴/.test(body(5)), 'stage 6 reward misses 1.0 × 10⁻⁷ or 1.0 × 10⁻¹⁴');
  const st = QUEST_STORY['unit09/q1-handover'];
  const grab = t => { const out = []; const ctx = new Proxy({}, { get: (_, k) => (k === 'fillText' ? s => out.push(String(s)) : k === 'measureText' ? s => ({ width: String(s).length * 6 }) : () => ctx), set: () => true }); paintScene('handover', ctx, 1280, 720, t, 0); return out; };
  holds(grab(0.25).includes('8 of 8 hydrogens have reached a water molecule') && grab(0.5).includes('3 of 8 ammonia particles have taken a hydrogen'), 'story beats 1 and 2 do not draw 8 of 8 and 3 of 8');
  holds(grab(0.76).includes('2 H, charge 0') && grab(0.76).includes('1 H, charge −1'), 'story beat 3 does not draw the hydrogens and charges');
  holds(grab(0.94).filter(x => x === '= 1.0 × 10⁻¹⁴').length === 3, 'story beat 4 does not draw 1.0 × 10⁻¹⁴ three times');
  holds(/8 of 8/.test(st.beats[0].say) && /3 of 8/.test(st.beats[1].say) && /1\.0 × 10⁻⁷/.test(st.beats[3].say), 'a line of Vess quotes a number the scene does not draw');
  ok('q1-handover story: every number Vess quotes is drawn from the same windows and waters');

  /* ---- no refusal carries the rule ---- */
  const LEAK = /one proton|exactly one|differ by|conjugate|amphoteric|Kw|10⁻¹⁴/i;
  const texts = [run(0, [put(chip('HCl'), 'slot:holds')]), run(2, [{ setDial: { fixture: 'verdict', dial: 'value', value: 1 } }]), run(3, [put(l('H₃O⁺'), 'slot:p1')]), run(4, [put(chip('NH₃'), 'slot:both')]), run(6, [{ setDial: { fixture: 'verdict', dial: 'value', value: 1 } }])];
  for (const r of texts) if (r.msg && LEAK.test(r.msg)) no(`a refusal carries the rule: "${r.msg}"`);
  ok('q1-handover refusals: none carries the rule its stage asks for');
  return bad;
}
