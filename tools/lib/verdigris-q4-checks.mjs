/**
 * verdigris-q4-checks.mjs — hand-worked checks for q4-structure (the proton race). Each count below was worked on paper from
 * K = 10^(pKa of the second acid − pKa of the first), share on the base = √K/(1+√K), times 100, rounded; never by the code under test.
 *
 *   HF + Cl⁻:      K = 10^-9.47  -> 0        HCl + F⁻:    K = 10^9.47   -> 100
 *   HBr + Cl⁻:     √K = 10^1.35 = 22.39, share 0.9573 -> 96        HCl + Br⁻: √K = 0.04467, share 0.0428 -> 4
 *   acetic + F⁻:   √K = 10^-0.785 = 0.1641, share 0.1410 -> 14      acetic + ClO⁻: √K = 10^1.38 = 24.0, share 0.9600 -> 96
 *   acetic + OH⁻:  -> 100      acetic + Cl⁻: -> 0      acetic + CCl₃COO⁻: √K = 10^-2.045 = 0.00902 -> 1      same acid both places -> 50
 *   strongest first (lowest pKa): HBr, HCl, HF;  HF, H₂O, NH₃, CH₄;  HClO₄, HClO₃, HClO₂, HClO;  formic, acetic, ethanol;
 *   Cl₃, Cl₂, Cl₁, acetic;  bases weakest first against acetic: Cl⁻ 0, F⁻ 14, ClO⁻ 96, OH⁻ 100.
 */
import { installUiStub } from './ui-stub.mjs';

export async function checkVerdigrisQ4({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q4-structure ${msg}`); };
  const holds = (c, label) => { if (!c) no(label); };
  installUiStub();
  const D = await import('../../src/learn/engine/phdata.js');
  const Q = await import('../../src/learn/quests/unit09/q4-structure.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { paintScene } = await import('../../src/ui/story-scenes.js');

  const want = { 'hf,hcl': 0, 'hcl,hf': 100, 'hbr,hcl': 96, 'hcl,hbr': 4, 'acetic,hf': 14, 'acetic,hclo': 96, 'acetic,h2o': 100, 'acetic,hcl': 0, 'acetic,cl3': 1, 'acetic,acetic': 50 };
  for (const [k, n] of Object.entries(want)) { const [a, b] = k.split(','); const g = D.raceCount(a, b); if (g !== n) no(`race ${k}: got ${g}, expected ${n}`); }
  const order = { 2: 'hbr,hcl,hf', 3: 'hf,h2o,nh3,ch4', 4: 'hclo4,hclo3,hclo2,hclo', 5: 'formic,acetic,ethanol', 6: 'cl3,cl2,cl1,acetic', 7: 'hcl,hf,hclo,h2o' };
  for (const [s, o] of Object.entries(order)) holds(Q.CHECKS.WANT[s].join() === o, `stage ${s}: the rank is ${Q.CHECKS.WANT[s].join()}, expected ${o}`);
  holds(Q.CHECKS.WANT[8].join() === 'x3,x4,x1,x5,x2', 'stage 8: the sealed rank is not C D A E B');
  ok('q4-structure race: counts and ranks agree with the values worked by hand');

  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const LEAK = /stronger|weaker|strength|conjugate|resonance|inductive|electroneg|pKa|bond|rule/i;
  for (let i = 0; i < 8; i++) {
    holds(run(i, Q.SOLUTIONS[i]).ok, `stage ${i + 1}: the scripted solution is refused`);
    const m = run(i, Q.MISSES[i]);
    holds(!m.ok && m.msg, `stage ${i + 1}: the scripted miss is accepted or has no reason`);
    if (m.msg && LEAK.test(m.msg)) no(`stage ${i + 1}: a refusal carries the rule: "${m.msg}"`);
  }
  holds(run(0, []).notYet, 'an empty predict rail is not "not yet"');
  // A correct rank is accepted without a single race having been run.
  holds(run(1, ['hbr', 'hcl', 'hf'].map((id, i) => ({ place: { piece: id, to: `rail:${i}` } }))).ok, 'stage 2 wants races before it accepts the right order');
  // Every wrong order of three is refused with a reason.
  const perms = [['hf', 'hcl', 'hbr'], ['hcl', 'hbr', 'hf'], ['hbr', 'hf', 'hcl'], ['hcl', 'hf', 'hbr'], ['hf', 'hbr', 'hcl']];
  for (const p of perms) { const r = run(1, p.map((id, i) => ({ place: { piece: id, to: `rail:${i}` } }))); holds(!r.ok && r.msg, `stage 2: order ${p} is accepted or has no reason`); }
  const t = Q.stateFor(1, [{ place: { piece: 'hf', to: 'slot:race.a' } }, { place: { piece: 'hcl', to: 'slot:race.b' } }, { run: 'race' }]).table;
  holds(t.recorder.rows.length === 1 && t.recorder.rows[0].y === 0, 'a race of HF with Cl⁻ does not record 0');
  const none = Q.stateFor(1, [{ run: 'race' }]);
  holds(none.table.recorder.rows.length === 0, 'a race with empty places records a result');
  // The cards print structure only, never a pKa.
  for (const i of [1, 2, 3, 4, 5, 6, 7]) for (const p of Object.values(Q.stateFor(i, []).table.pieces)) if (p.kind === 'phacid') holds(!/pKa|\bK\b/.test((p.props.rows || []).join(' ')), `stage ${i + 1}: a card prints a pKa`);
  // Stage 7 starts with the reference acid in the first place.
  holds(Q.stateFor(6, []).table.pieces.ref.zone === 'slot:race.a', 'stage 7: the reference acid is not in the first place');
  ok('q4-structure stages: every scripted solution passes, every miss names a reading, a right rank needs no race');

  const st = QUEST_STORY['unit09/q4-structure'];
  const grab = tt => {
    const out = [];
    const ctx = new Proxy({}, { get: (_, k) => (k === 'fillText' ? s => out.push(String(s)) : k === 'measureText' ? s => ({ width: String(s).length * 6 }) : () => ctx), set: () => true });
    paintScene('race-pairs', ctx, 960, 540, tt, 0);
    return out;
  };
  const b1 = grab(0.26); const b2 = grab(0.52);
  holds(b1.includes('0 of 100 reached the base') && b1.includes('100 of 100 reached the base'), 'story beat 1 does not draw 0 and 100 of 100');
  holds(b2.includes('96 of 100 reached the base') && b2.includes('4 of 100 reached the base'), 'story beat 2 does not draw 96 and 4 of 100');
  holds(/all 100/.test(st.beats[0].say) && /96 of 100/.test(st.beats[1].say) && /only 4/.test(st.beats[1].say), 'a line of Vess quotes a number the scene does not draw');
  ok('q4-structure story: the counts Vess quotes are the counts the scene draws');
  return bad;
}
