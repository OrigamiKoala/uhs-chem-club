/**
 * verdigris-q3-checks.mjs — hand-worked checks for q3-weak (Weak Acids and Bases). Each expected value below was worked on paper from
 * the quadratic x² + K x − K c = 0 (a weak acid or base at strength c) or from a closed form, never produced by the code under test:
 *
 *   acetic acid, Ka 1.8 × 10⁻⁵:  c = 0.10   x = (−Ka + √(Ka² + 4 Ka c))/2 = 1.33267e-3  pH 2.8753  1.3327 %  window 200 × 0.013327 = 2.67 -> 3
 *                                c = 0.010  x = 4.1536e-4   pH 3.3816  4.1536 %  window 8.31 -> 8
 *                                c = 0.0010 x = 1.25466e-4  pH 3.9015  12.547 %  window 25.09 -> 25
 *                                c = 0.15   x = 1.634415e-3 pH 2.7866  window 2.18 -> 2
 *   hydrofluoric acid, Ka 6.8e-4, c = 0.10: x = 7.9132e-3  pH 2.1016  window 15.83 -> 16
 *   hydrochloric acid, strong, c = 0.10: pH 1.0000, window 200 of 200
 *   ammonia, Kb 1.8e-5, c = 0.10: the same x as acetic acid, pH 11.1248; the windows 3, 8, 25 as for acetic acid
 *   no square root: −log(Ka c) = −log(2.7e-6) = 5.5686;  fully ionized: −log 0.15 = 0.8239
 *   rig readings: H₃O⁺ × CH₃COO⁻ ÷ CH₃COOH = x²/(c − x) = 1.8000e-5 for every strength (the ratio is Ka by definition);
 *                 H₃O⁺ ÷ CH₃COO⁻ = 1.0000 (the two ions come in equal numbers).
 *   Ka × Kb = Kw = 1.0e-14 for each conjugate pair (Kb = Kw/Ka by the table; Ka = Kw/Kb for ammonium).
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkVerdigrisQ3({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q3-weak ${msg}`); };
  const near = (got, want, tol, label) => { if (Math.abs(got - want) <= tol) return; no(`${label}: got ${got}, expected ${want}`); };
  const rel = (got, want, tol, label) => { if (Math.abs(got / want - 1) <= tol) return; no(`${label}: got ${got}, expected ${want}`); };
  const holds = (cond, label) => { if (!cond) no(label); };

  installUiStub();
  const R = await import('../../src/learn/table/kits/ph-read.js');
  const { PH_KIT, flaskFixture, rigParts } = await import('../../src/learn/table/kits/ph.js');
  const { fixtureLayout } = await import('../../src/learn/table/layout.js');
  const Q = await import('../../src/learn/quests/unit09/q3-weak.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { paintScene } = await import('../../src/ui/story-scenes.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const typed = (entry, value) => ({ type: { entry, value } });

  /* ---- the flasks, against the numbers worked by hand ---- */
  const sol = (id, c) => R.flaskSol({ solute: { id, c } });
  near(sol('acetic', 0.10).pH, 2.8753, 0.0005, 'acetic 0.10 pH');
  near(sol('acetic', 0.10).percent, 1.3327, 0.001, 'acetic 0.10 percent');
  near(sol('acetic', 0.010).pH, 3.3816, 0.0005, 'acetic 0.010 pH');
  near(sol('acetic', 0.010).percent, 4.1536, 0.001, 'acetic 0.010 percent');
  near(sol('acetic', 0.0010).pH, 3.9015, 0.0005, 'acetic 0.0010 pH');
  near(sol('acetic', 0.0010).percent, 12.547, 0.005, 'acetic 0.0010 percent');
  near(sol('acetic', 0.15).pH, 2.7866, 0.0005, 'acetic 0.15 pH');
  near(sol('hf', 0.10).pH, 2.1016, 0.0005, 'HF 0.10 pH');
  near(sol('hcl', 0.10).pH, 1.0, 0.0005, 'HCl 0.10 pH');
  near(sol('nh3', 0.10).pH, 11.1248, 0.0005, 'NH3 0.10 pH');
  const count = (id, c) => R.windowOf({ solute: { id, c } }).ionized;
  holds(count('acetic', 0.10) === 3 && count('acetic', 0.010) === 8 && count('acetic', 0.0010) === 25, 'the acetic acid windows are not 3, 8 and 25 of 200');
  holds(count('hf', 0.10) === 16 && count('hcl', 0.10) === 200 && count('acetic', 0.15) === 2, 'the HF, HCl and 0.15 M windows are not 16, 200 and 2 of 200');
  holds(count('nh3', 0.10) === 3 && count('nh3', 0.010) === 8 && count('nh3', 0.0010) === 25, 'the ammonia windows are not 3, 8 and 25 of 200');
  ok('q3-weak flasks: pH, percent and window counts agree with the quadratic worked by hand');

  /* ---- the rig: every arrangement of the three tiles, held to what each product is ---- */
  const species = c => R.speciesOf({ solute: { id: 'acetic', c } });
  for (const c of [0.10, 0.010, 0.0010]) {
    const s = species(c);
    rel((s.H * s.A) / s.HA, 1.8e-5, 5e-4, `H₃O⁺ × CH₃COO⁻ ÷ CH₃COOH at ${c} M`);
    near(s.H / s.A, 1, 1e-6, `H₃O⁺ ÷ CH₃COO⁻ at ${c} M`);
  }
  const TILES = [['H', 'H₃O⁺'], ['A', 'CH₃COO⁻'], ['HA', 'CH₃COOH']];
  const slots = ['slot:rig.t1', 'slot:rig.t2', 'slot:rig.b1', 'slot:rig.b2'];
  let accepted = 0;
  for (const stageIndex of [3, 6]) {
    const names = stageIndex === 3 ? ['H', 'A', 'HA'] : ['OH', 'BH', 'B'];
    // Expected (worked by hand): the product of the two ions over the whole acid, or its inverse; the single ratio of the two ions is 1 and is refused.
    const [ion1, ion2, whole] = names;
    for (let a = 0; a < 3 ** 3; a++) {
      const side = [Math.floor(a / 9) % 3, Math.floor(a / 3) % 3, a % 3]; // 0 off, 1 top, 2 bottom
      const script = []; const used = { 1: 0, 2: 0 };
      names.forEach((n, i) => { if (side[i]) { used[side[i]]++; script.push(put(`t-${n}`, side[i] === 1 ? slots[used[1] - 1] : slots[1 + used[2]])); } });
      const top = names.filter((_, i) => side[i] === 1); const bottom = names.filter((_, i) => side[i] === 2);
      if (top.length > 2 || bottom.length > 2) continue; // the rig has two places a row
      const set = x => [...x].sort().join();
      const wantOk = (set(top) === set([ion1, ion2]) && set(bottom) === set([whole])) || (set(bottom) === set([ion1, ion2]) && set(top) === set([whole]));
      const r = run(stageIndex, script);
      if (!script.length) { holds(!r.ok && r.notYet, `stage ${stageIndex + 1}: an empty rig is not "not yet"`); continue; }
      if (Boolean(r.ok) !== wantOk) no(`stage ${stageIndex + 1}: arrangement ${top.join('+') || '-'} over ${bottom.join('+') || '-'} is ${r.ok ? 'accepted' : 'refused'} but should be ${wantOk ? 'accepted' : 'refused'}`);
      else if (wantOk) accepted++;
      if (!r.ok && !r.msg) no(`stage ${stageIndex + 1}: a refusal with no reason`);
    }
  }
  holds(accepted === 4, `the rig accepts ${accepted} arrangements over stages 4 and 7, expected 4 (a ratio and its inverse on each)`);
  void TILES;
  const trivial = run(3, [put('t-H', slots[0]), put('t-A', slots[2])]);
  holds(!trivial.ok && /1\.00/.test(trivial.msg), 'the ion-over-ion ratio is not refused with its reading 1.00');
  ok('q3-weak rig: only the product of the ions over the whole acid, or its inverse, is accepted on the acid and the base flasks');

  /* ---- stage 8: Ka and Kb of a pair ---- */
  const pairs = Q.CHECKS.PAIRS;
  const KW = 1e-14;
  for (const p of pairs) rel(p.Ka * p.Kb, KW, 1e-9, `${p.title}: Ka × Kb`);
  rel(pairs[0].Ka, 1.8e-5, 1e-9, 'acetic Ka'); rel(pairs[1].Kb, 1.8e-5, 1e-9, 'ammonia Kb'); rel(pairs[2].Ka, 6.8e-4, 1e-9, 'HF Ka');
  rel(pairs[0].Kb, 5.5556e-10, 1e-4, 'acetate Kb'); rel(pairs[1].Ka, 5.5556e-10, 1e-4, 'ammonium Ka'); rel(pairs[2].Kb, 1.4706e-11, 1e-4, 'fluoride Kb');
  const eight = (...tiles) => run(7, tiles.map(([t, s]) => put(t, s)));
  holds(eight(['t-Ka', slots[0]], ['t-Kb', slots[1]]).ok, 'stage 8 refuses Ka × Kb');
  for (const [name, r] of [['Ka alone', eight(['t-Ka', slots[0]])], ['Kb alone', eight(['t-Kb', slots[0]])], ['Ka over Kb', eight(['t-Ka', slots[0]], ['t-Kb', slots[2]])], ['Kb over Ka', eight(['t-Kb', slots[0]], ['t-Ka', slots[2]])]]) {
    holds(!r.ok && r.msg && /reads/.test(r.msg), `stage 8 ${name} is accepted or refused with no reading`);
  }
  holds(!/Kw|1\.0 × 10⁻¹⁴/.test(eight(['t-Ka', slots[0]]).msg), 'stage 8 refusal carries the answer');
  ok('q3-weak stage 8: Ka × Kb is the one steady product, for all three pairs');

  /* ---- typed stages: the right figures pass, each slip is refused for its own reason ---- */
  for (const v of ['1.3', '1.33', '1.5', '1.1']) holds(run(2, [typed('pct', v)]).ok, `stage 3 refused ${v} %`);
  for (const v of ['2.88', '0.0013', '0.013', '13', '0.13']) { const r = run(2, [typed('pct', v)]); holds(!r.ok && r.msg, `stage 3 accepted or gave no reason for ${v}`); }
  holds(/pH this flask reads/.test(run(2, [typed('pct', '2.88')]).msg), 'stage 3: the pH slip has no reason of its own');
  holds(/hydronium in mol\/L/.test(run(2, [typed('pct', '0.0013')]).msg), 'stage 3: the mol/L slip has no reason of its own');
  holds(/fraction of 1/.test(run(2, [typed('pct', '0.013')]).msg), 'stage 3: the fraction slip has no reason of its own');
  holds(run(2, [typed('pct', '')]).notYet, 'stage 3 does not wait for a figure');
  for (const v of ['2.79', '2.78', '2.8']) holds(run(4, [typed('ph', v)]).ok, `stage 5 refused ${v}`);
  for (const v of ['5.57', '0.82', '2.88', '3.5', '2.7']) holds(!run(4, [typed('ph', v)]).ok, `stage 5 accepted ${v}`);
  holds(/none/.test(run(4, [typed('ph', '5.57')]).msg), 'stage 5: the no-square-root slip is not refused for the window');
  holds(/every molecule/.test(run(4, [typed('ph', '0.82')]).msg), 'stage 5: the fully-ionized slip is not refused for the window');
  holds(/0\.10 M flask/.test(run(4, [typed('ph', '2.88')]).msg), 'stage 5: the nearest reference is not named');
  near(-Math.log10(1.8e-5 * 0.15), 5.5686, 0.0005, 'stage 5 slip: no square root');
  near(-Math.log10(0.15), 0.8239, 0.0005, 'stage 5 slip: fully ionized');
  ok('q3-weak typed stages: right figures accepted, every slip refused with its own reason');

  /* ---- stage 2: the sort ---- */
  const S2 = { 'c-hcl': 'tray:all', 'c-acetic': 'tray:some', 'c-hf': 'tray:some' };
  const sort = m => run(1, Object.entries(m).map(([c, t]) => put(c, t)));
  holds(sort(S2).ok, 'stage 2 refuses the right sort');
  holds(run(1, [put('c-hcl', 'tray:all')]).notYet, 'stage 2 does not wait for the other cards');
  const names = Object.keys(S2);
  for (let a = 0; a < 8; a++) {
    const m = Object.fromEntries(names.map((n, i) => [n, (a >> i) & 1 ? 'tray:all' : 'tray:some']));
    const want = m['c-hcl'] === 'tray:all' && m['c-acetic'] === 'tray:some' && m['c-hf'] === 'tray:some';
    const r = sort(m);
    if (Boolean(r.ok) !== want) no(`stage 2: sort ${JSON.stringify(m)} gives ok=${r.ok}`);
    if (!r.ok && !/meter reads \d/.test(r.msg)) no(`stage 2: a refusal does not name a reading: "${r.msg}"`);
  }
  const wrong = sort({ 'c-hcl': 'tray:all', 'c-acetic': 'tray:all', 'c-hf': 'tray:some' }).msg;
  holds(/3 of 200/.test(wrong) && /2\.88/.test(wrong), 'stage 2: the refusal for acetic acid does not give its window and its pH');
  ok('q3-weak stage 2: the sort is accepted only as the windows and the meter show it');

  /* ---- stage 6: the dial and card ---- */
  { const D2 = [{ run: 'f1' }, { run: 'f1' }]; const one = run(5, [{ run: 'f1' }, put('larger', 'slot:ans')]);
    const wrongCard = run(5, [...D2, put('smaller', 'slot:ans')]);
    holds(run(5, [...D2, put('larger', 'slot:ans')]).ok && one.notYet && !wrongCard.ok && /\d+ of 200/.test(wrongCard.msg) && run(5, []).notYet, 'stage 6: requires two dilutions and the right card'); }
  holds(run(5, []).notYet, 'stage 6 does not wait for the dial');
  ok('q3-weak stage 6: rises is right, the others are refused for the windows');

  /* ---- the meter: absent where a pH is asked for, and the flask keeps its last reading ---- */
  const s5 = Q.stateFor(4, []).table;
  holds(!Object.values(s5.pieces).some(p => p.kind === 'phmeter') && !s5.fixtures.f1.props.seat, 'stage 5 puts a meter on the flask whose pH is asked for');
  const two = Q.stateFor(1, [put('meter', 'slot:f2.seat'), put('meter', 'slot:f1.seat')]).table;
  holds(two.fixtures.f2.props.noted === 2.88 && two.fixtures.f1.props.noted === 1, 'a flask does not keep the reading the meter gave it');
  const texts = [];
  const rec = new Proxy({}, { get: (_, k) => (k === 'fillText' ? t => texts.push(String(t)) : k === 'measureText' ? t => ({ width: String(t).length * 6 }) : () => rec), set: () => true });
  const b = f => ({ sc: 4, X: v => v * 4, Y: v => v * 4, lay: fixtureLayout(f) });
  PH_KIT.paintFixture(rec, two.fixtures.f2, two, b(two.fixtures.f2));
  holds(texts.includes('pH 2.88'), 'a flask whose meter was lifted does not print its last reading');
  holds(texts.includes('0.10 M') && texts.includes('water not drawn'), 'a flask does not print its strength and the note that water is not drawn');
  texts.length = 0;
  PH_KIT.paintPiece(rec, two.pieces.meter, two, { x: 10, y: 10, r: 8, sc: 4, lit: false });
  holds(texts.includes('1.00'), 'the meter does not print the pH of the flask it lies on');
  ok('q3-weak meter: absent on the flask whose pH is asked for, reads the planner, the flask keeps the last reading');

  /* ---- every builder option reaches the painter (ledger: an option object silently drops keys) ---- */
  const fl = flaskFixture('x', { x: 50, y: 30 }, { solute: { id: 'hf', c: 0.02 }, label: 'Name', w: 52, window: 18, meter: false, legend: false, waterNote: false, units: 120, cols: 12 });
  const fp = fl.fixture.props;
  holds(fl.fixture.size.w === 52 && fp.wh === 18 && fp.seat === null && fl.slot === null && fp.legend === false && fp.waterNote === false && fp.units === 120 && fp.cols === 12 && fp.solute.c === 0.02 && fl.fixture.label === 'Name', 'a flaskFixture option does not reach the fixture');
  const rg = rigParts('r', { x: 80, y: 40 }, { cols: [{ values: { Ka: 1 }, title: 'T', lines: ['a'] }, { flask: 'f1', title: 'U' }], top: 3, bottom: 1, pitch: 30, h: 32, title: 'Rig' });
  holds(rg.fixture.props.top.length === 3 && rg.fixture.props.bottom.length === 1 && rg.fixture.props.cols.length === 2 && rg.fixture.size.h === 32 && rg.slots.length === 4 && rg.fixture.label === 'Rig', 'a rigParts option does not reach the fixture');
  const units = R.windowOf({ solute: { id: 'acetic', c: 0.1 }, units: 120 });
  holds(units.units === 120 && units.ionized + units.whole === 120, 'the window ignores its unit count');
  ok('q3-weak builders: every option reaches the fixture, and the window counts add up');

  /* ---- zero prints plainly ---- */
  holds(R.numText(0) === '0' && R.numText(NaN) === '—' && R.numText(1.8e-5) === '1.80 × 10⁻⁵' && R.numText(1) === '1.00', 'numText prints a zero, a dash, a small number or one wrongly');

  /* ---- the rewards print what was worked out ---- */
  const body = i => Q.STAGES[i].reward.body;
  holds(/2\.88/.test(body(2)) && /1\.3 percent/.test(body(2)), 'stage 3 reward misses 2.88 or 1.3 percent');
  holds(/1\.8 × 10⁻⁵/.test(body(3)), 'stage 4 reward misses 1.8 × 10⁻⁵');
  holds(/2\.79/.test(body(4)) && /1\.6 × 10⁻³/.test(body(4)), 'stage 5 reward misses 2.79 or 1.6 × 10⁻³');
  holds(/1\.3 percent/.test(body(5)) && /4\.2 percent/.test(body(5)) && /12\.5 percent/.test(body(5)), 'stage 6 reward misses 1.3, 4.2 or 12.5 percent');
  holds(/1\.8 × 10⁻⁵/.test(body(6)), 'stage 7 reward misses 1.8 × 10⁻⁵');
  holds(/1\.0 × 10⁻¹⁴/.test(body(7)), 'stage 8 reward misses 1.0 × 10⁻¹⁴');
  ok('q3-weak rewards: the figures printed are the ones worked by hand');

  /* ---- the story animation: the numbers in Vess's lines are the numbers the scene draws ---- */
  const st = QUEST_STORY['unit09/q3-weak'];
  const grab = t => {
    const out = [];
    const ctx = new Proxy({}, { get: (_, k) => (k === 'fillText' ? s => out.push(String(s)) : k === 'measureText' ? s => ({ width: String(s).length * 6 }) : () => ctx), set: () => true });
    paintScene('weak-windows', ctx, 1280, 720, t, 0);
    return out;
  };
  const one = grab(0.26); const two2 = grab(0.54); const three = grab(0.76); const four = grab(0.94);
  holds(one.includes('200 of 200 have handed over a proton') && one.includes('3 of 200 have handed over a proton') && one.includes('pH 1.00') && one.includes('pH 2.88'), 'story beat 1 does not draw 200 and 3 of 200 and the pH 1.00 and 2.88');
  holds(['3 of 200', '8 of 200', '25 of 200'].every(s => two2.some(x => x.startsWith(s))), 'story beat 2 does not draw 3, 8 and 25 of 200');
  holds(three.filter(x => x === '1.80 × 10⁻⁵').length === 3, 'story beat 3 does not draw 1.80 × 10⁻⁵ three times');
  holds(four.filter(x => x === '1.0 × 10⁻¹⁴').length === 3, 'story beat 4 does not draw 1.0 × 10⁻¹⁴ three times');
  holds(/1\.00 against 2\.88/.test(st.beats[0].say) && /3 of 200 units at 0\.10 M, 8 at 0\.010 M and 25 at 0\.0010 M/.test(st.beats[1].say) && /1\.0 × 10⁻¹⁴/.test(st.beats[3].say), 'a line of Vess quotes a number the scene does not draw');
  ok('q3-weak story: every number Vess quotes is drawn from the same windows, species and constants');

  /* ---- no refusal carries the rule a stage is asking for (the pitfall ledger: a miss names what the table shows, never the reasoning) ---- */
  const LEAKS = {
    1: /weak|strong|only in part|share/i,
    2: /square root|quadratic|divide|multiply|ratio|log\b/i,
    4: /Ka\b|Kb\b|constant|equilibrium/i,
    5: /square root|quadratic|ICE|solve|Ka\b/i,
    7: /Kb\b|constant|equilibrium/i
  };
  const refusals = {
    1: [[put('c-hcl', 'tray:all'), put('c-acetic', 'tray:all'), put('c-hf', 'tray:some')], [put('c-hcl', 'tray:some'), put('c-acetic', 'tray:some'), put('c-hf', 'tray:some')]],
    2: ['2.88', '0.0013', '0.013', '13', '0.5'].map(v => [typed('pct', v)]),
    4: ['5.57', '0.82', '2.88', '3.5'].map(v => [typed('ph', v)]),
    3: [[put('t-H', slots[0])], [put('t-A', slots[0]), put('t-HA', slots[2])], [put('t-H', slots[0]), put('t-A', slots[2])]],
    6: [[put('t-OH', slots[0])], [put('t-OH', slots[0]), put('t-BH', slots[2])]]
  };
  for (const [i, scripts] of Object.entries(refusals)) {
    for (const script of scripts) {
      const r = run(Number(i), script);
      if (r.ok) continue;
      if (!r.msg) no(`stage ${Number(i) + 1}: a refusal has no reason`);
      else if (LEAKS[i] && LEAKS[i].test(r.msg)) no(`stage ${Number(i) + 1}: a refusal carries the rule: "${r.msg}"`);
    }
  }
  ok('q3-weak refusals: none carries the rule its stage asks for');

  return bad;
}
