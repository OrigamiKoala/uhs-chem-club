/**
 * brinewire-q4-checks.mjs — hand-worked checks for q4-potential (Cell Potential). Each expected value below was worked on paper from the
 * CRC reduction potentials (Mg²⁺ −2.37, Zn²⁺ −0.76, Cu²⁺ +0.34, Ag⁺ +0.80, Fe²⁺ −0.44, Au³⁺ +1.50 V), never produced by the code under test:
 *
 *   E°cell = E°(higher) − E°(lower):  Mg|Ag 0.80 + 2.37 = 3.17 V;  Zn|Cu 0.34 + 0.76 = 1.10 V;  Cu|Ag 0.46 V;  Fe|Au 1.50 + 0.44 = 1.94 V
 *   energy = n × 96485 × E° / 1000:   Zn|Cu n = 2 → 212.27 kJ, written twice (n = 4) → 424.54 kJ;  Mg|Cu n = 2 → 2 × 96485 × 2.71 = 522.95 kJ
 *   log K = n E° / 0.05916:           Zn|Ag n = 2 (Zn + 2 Ag⁺), E° 1.56 → 2 × 1.56 / 0.05916 = 52.74;  forgetting n gives 26.37; ln K gives 121.4
 *   the four cells of stage 3: A Zn|Cu +1.10 (lit), B Ag|Cu −0.46 (dark), C Cu|Ag +0.46 (lit), D Ag|Zn −1.56 (dark)
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkBrinewireQ4({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q4-potential ${msg}`); };
  const near = (got, want, tol, label) => { if (Math.abs(got - want) <= tol) return; no(`${label}: got ${got}, expected ${want}`); };
  const holds = (cond, label) => { if (!cond) no(label); };

  installUiStub();
  const Q = await import('../../src/learn/quests/unit10/q4-potential.js');
  const K = await import('../../src/learn/table/kits/cell.js');
  const D = await import('../../src/learn/engine/celldata.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const typed = (entry, value) => ({ type: { entry, value } });
  const seat = 'slot:board.seat';

  /* ---- the planners behind the stages, against the numbers worked by hand ---- */
  near(D.cellE0('ag', 'mg'), 3.17, 1e-9, 'Mg|Ag E°cell');
  near(D.cellE0('cu', 'zn'), 1.10, 1e-9, 'Zn|Cu E°cell');
  near(D.cellE0('au', 'fe'), 1.94, 1e-9, 'Fe|Au E°cell');
  near(-D.deltaG0(1.10, 2), 212.27, 0.01, 'Zn|Cu energy once');
  near(-D.deltaG0(1.10, 4), 424.54, 0.02, 'Zn|Cu energy twice');
  near(-D.deltaG0(2.71, 2), 522.95, 0.01, 'Mg|Cu energy');
  near(D.logK(1.56, 2), 52.74, 0.01, 'Zn|Ag log K');
  ok('q4-potential planners: every voltage, energy and log K agrees with the values worked by hand');

  /* ---- the rig: stage 3's four cells and stage 5's two settings ---- */
  const rig = (l, r) => K.rigFixture('x', { x: 0, y: 0 }, { left: l, right: r });
  const reads = [['zn', 'cu', 1.10, true], ['ag', 'cu', -0.46, false], ['cu', 'ag', 0.46, true], ['ag', 'zn', -1.56, false]];
  for (const [l, r, V, lit] of reads) {
    const a = K.rigRead({ fixtures: { x: { ...rig(l, r), dials: { ...rig(l, r).dials, last: { value: 1 }, r1: { value: 1 }, r2: { value: 0 } } } } }, 'x');
    near(a.now.V, V, 1e-9, `rig ${l} ${r} reading`);
    holds(a.now.lit === lit, `rig ${l} ${r} lamp`);
  }
  const sc = K.rigFixture('s', { x: 0, y: 0 }, { left: 'zn', right: 'cu', energy: true, scalable: true });
  const sr = K.rigRead({ fixtures: { s: { ...sc, dials: { ...sc.dials, last: { value: 2 }, r1: { value: 1 }, r2: { value: 1 }, scale: { value: 2 } } } } }, 's');
  near(sr.rows[0].kJ, 212.27, 0.01, 'rig once kJ'); near(sr.rows[1].kJ, 424.54, 0.02, 'rig twice kJ');
  near(sr.rows[0].V, sr.rows[1].V, 1e-9, 'the voltage is the same at both settings');
  ok('q4-potential rig: the four lamps and the two settings agree with the values worked by hand');

  /* ---- the typed stages and their slips ---- */
  const seatBoth = (a, b) => [put(`e-${a}`, seat), put(`e-${b}`, seat)];
  holds(run(1, [...seatBoth('mg', 'ag'), typed('e', '3.17')]).ok, 'stage 2 refuses 3.17');
  for (const bad of ['-1.57', '1.57', '-3.17', '6.34', '0.8']) holds(!run(1, [...seatBoth('mg', 'ag'), typed('e', bad)]).ok && !!run(1, [typed('e', bad)]).msg, `stage 2 accepts or has no reason for ${bad}`);
  holds(run(5, [typed('kj', '523')]).ok && run(5, [typed('kj', '520')]).ok, 'stage 6 refuses 523 or 520');
  for (const [bad, w] of [['261', 'one mole'], ['522950', 'joules'], ['-523', 'size'], ['212', 'zinc']]) {
    const r = run(5, [typed('kj', bad)]);
    holds(!r.ok && r.msg && r.msg.includes(w), `stage 6 slip ${bad} is not refused with a reading naming "${w}" (${r.msg})`);
  }
  holds(run(6, [typed('logk', '53')]).ok && run(6, [typed('logk', '52.7')]).ok, 'stage 7 refuses 53 or 52.7');
  for (const [bad, w] of [['26', 'one electron'], ['121', 'natural']]) {
    const r = run(6, [typed('logk', bad)]);
    holds(!r.ok && r.msg && r.msg.includes(w), `stage 7 slip ${bad} is not refused naming "${w}" (${r.msg})`);
  }
  ok('q4-potential typed stages: right figures pass, every slip is refused with a reason');

  /* ---- stage 1: the rank, and a refusal that names a reading ---- */
  const rankBad = run(0, [...['mg', 'zn', 'cu', 'ag'].map(m => put(`e-${m}`, seat)), ...['mg', 'cu', 'zn', 'ag'].map((m, i) => put(`e-${m}`, `rail:${i}`))]);
  holds(!rankBad.ok && /V/.test(rankBad.msg), 'stage 1 wrong rank is not refused with a reading');
  holds(run(0, ['mg', 'zn', 'cu', 'ag'].map((m, i) => put(`e-${m}`, `rail:${i}`))).ok, 'stage 1: a correct rank must be accepted without every electrode read');
  ok('q4-potential stage 1: a right rank needs no readings, a wrong one is refused with the strip\'s numbers');

  /* ---- no refusal carries the rule its stage asks for ---- */
  const rule = /\b(higher|lower)\b[^.]*\b(minus|take|subtract)|cathode minus anode|n ?F ?E|multiply the|divide by 0\.0592|per electron|energy for each/i;
  const allMsgs = [];
  Q.MISSES.forEach((m, i) => { const r = run(i, m); if (r.msg) allMsgs.push(r.msg); });
  for (const m of allMsgs) holds(!rule.test(m), `a refusal carries the rule: "${m}"`);
  ok('q4-potential refusals: none carries the rule its stage asks for');

  /* ---- the story's numbers are the planner's ---- */
  const story = JSON.stringify(QUEST_STORY['unit10/q4-potential'].beats);
  for (const n of ['−2.37', '−0.76', '+0.34', '+0.80', '3.17', '1.10', '1.56']) holds(story.includes(n), `story is missing ${n}`);
  holds(story.includes('0.0592'), 'story is missing 0.0592');
  ok('q4-potential story: every number Vess quotes is a planner figure');

  if (!bad) ok('Brinewire q4-potential: every voltage, energy, log K, lamp, slip, refusal and story number agrees with the values worked by hand');
  return bad;
}
