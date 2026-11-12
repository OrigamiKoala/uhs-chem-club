/**
 * brinewire-q5-checks.mjs — hand-worked checks for q5-load (Under Load). Each expected value below was worked outside the code under test
 * (paper and an independent Python loop with R = 8.314462618, T = 298.15, F = 96485.33212, RT/F = 0.025693 V):
 *
 *   Sn|Pb: E° = −0.126 − (−0.138) = 0.012 V, n = 2, K = 10^(2 × 0.012 ÷ 0.059159) = 2.545, balance extent (K − 1) ÷ (1 + K) = 0.4358 M
 *   the load: each tick moves the reaction on by 4 × E mol/L (E ≥ 0), one dot is 0.02 M. Ticks 0, 8, 16, 24, 32, 40 give
 *     E = 0.012, 0.004897, 0.001832, 0.000646, 0.000221, 0.000075 V and dots (tin, lead) = (50, 50), (63, 37), (69, 31), (71, 29), (71, 29), (72, 28);
 *     the meter first reads 0.000 at tick 26, so after the fourth press (tick 32)
 *   Zn|Cu, E° 1.10 V, n = 2: Zn²⁺ 1.0 M with Cu²⁺ 0.0010 M gives Q = 1000 and E = 1.10 − 0.02963 × 3 = 1.0113 V; Q inverted 1.1887; log left
 *     out 1.10 − 0.0296 × 1000 = −28.5; one electron 1.10 − 0.0592 × 3 = 0.9224; natural log 1.10 − 0.0296 × 6.908 = 0.8955
 *   the stage 7 cells: Zn²⁺ 0.010 M, Cu²⁺ 1.0 M: 1.10 + 0.02963 × 2 = 1.1592 V; 1.0 M each: 1.10 V; Zn²⁺ 1.0 M, Cu²⁺ 0.010 M: 1.0408 V
 *   concentration cells: copper 1.0 M against 0.010 M: (0.025693 ÷ 2) × ln 100 = 0.05916 V; silver 0.010 M against 1.0 M: 0.025693 × ln 100 = 0.11832 V
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkBrinewireQ5({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q5-load ${msg}`); };
  const near = (got, want, tol, label) => { if (Math.abs(got - want) <= tol) return; no(`${label}: got ${got}, expected ${want}`); };
  const holds = (cond, label) => { if (!cond) no(label); };

  installUiStub();
  const Q = await import('../../src/learn/quests/unit10/q5-load.js');
  const L = await import('../../src/learn/table/kits/cell-load.js');
  await import('../../src/learn/table/kits/cell.js');
  const D = await import('../../src/learn/engine/celldata.js');
  const P = await import('../../src/learn/engine/celldata-q5.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { STAGE_STORY } = await import('../../src/learn/engine/stage-story.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const typed = (entry, value) => ({ type: { entry, value } });
  const START = { cAnode0: 1, cCathode0: 1 };

  /* ---- the planners behind the stages, against the numbers worked by hand ---- */
  near(D.cellE0('pb', 'sn'), 0.012, 1e-9, 'Sn|Pb E°cell');
  near(10 ** D.logK(0.012, 2), 2.545, 0.001, 'Sn|Pb K');
  near(P.balanceOf('pb', 'sn', START).x, 0.4358, 0.0001, 'Sn|Pb balance extent');
  const hand = [[0, 0.012, 50, 50], [8, 0.004897, 63, 37], [16, 0.001832, 69, 31], [24, 0.000646, 71, 29], [32, 0.000221, 71, 29], [40, 0.000075, 72, 28]];
  for (const [t, E, a, c] of hand) {
    const s = P.loadAt('pb', 'sn', START, t);
    near(s.E, E, 2e-6, `load voltage at tick ${t}`);
    holds(s.nAnode === a && s.nCathode === c, `load dots at tick ${t}: got ${s.nAnode} and ${s.nCathode}, expected ${a} and ${c}`);
  }
  holds(P.firstZeroTick('pb', 'sn', START) === 26, `the meter first reads zero at tick ${P.firstZeroTick('pb', 'sn', START)}, expected 26`);
  const tr = P.loadTrace('pb', 'sn', START, 40);
  holds(tr.every((p, i) => i === 0 || p.E <= tr[i - 1].E + 1e-12), 'the load voltage must never rise');
  holds(tr.every(p => p.E > 0), 'the load voltage must stay above zero (the extent never passes the balance point)');
  holds(P.loadAt('pb', 'sn', START, 40).nAnode > 0 && P.loadAt('pb', 'sn', START, 40).nCathode > 0, 'a dead cell must still hold both ions');
  near(P.readAt('cu', 'zn', 1, 0.001), 1.0113, 0.0002, 'Zn|Cu with Q = 1000');
  near(P.readAt('cu', 'zn', 0.01, 1), 1.1592, 0.0002, 'Zn 0.010 M, Cu 1.0 M');
  near(P.readAt('cu', 'zn', 1, 0.01), 1.0408, 0.0002, 'Zn 1.0 M, Cu 0.010 M');
  near(P.concCellRead('cu', 1, 0.01).E, 0.05916, 0.00002, 'copper concentration cell');
  near(P.concCellRead('ag', 0.01, 1).E, 0.11832, 0.00002, 'silver concentration cell');
  holds(P.concCellRead('cu', 1, 0.01).leaves === 'right' && P.concCellRead('ag', 0.01, 1).leaves === 'left', 'electrons leave the dilute beaker');
  near(P.concCellSigned('cu', 1, 0.01), -0.05916, 0.00002, 'signed copper cell, right against left');
  holds(P.concLabel(0.001) === '0.0010 M' && P.concLabel(0.01) === '0.010 M' && P.concLabel(1) === '1.0 M', 'concentration labels');
  holds(P.milliText(0.00003) === '0.000' && !P.milliText(-0.00001).includes('−'), 'a voltmeter near zero prints a plain 0.000');
  ok('q5-load planners: the load run, the Nernst voltages and both concentration cells agree with the values worked by hand');

  /* ---- the instruments: the run key, the plot reach, the read bench, the concentration cell ---- */
  const lf = L.loadFixture('x', { x: 0, y: 0 }, { anode: 'sn', cathode: 'pb', counts: true });
  const stateOf = f => ({ fixtures: { x: f } });
  const runKey = f => {
    const r = L.loadRead(stateOf(f), 'x');
    const out = f.dials.tick.value;
    return { r, out };
  };
  holds(runKey(lf).r.tick === 0 && !runKey(lf).r.ran && runKey(lf).r.trace.length === 0, 'a fresh cell has run no ticks and has no plot');
  lf.dials.tick.value = 8;
  holds(L.loadRead(stateOf(lf), 'x').trace.length === 9, 'the plot holds only the ticks reached (9 points at tick 8)');
  lf.dials.tick.value = 40;
  near(L.loadRead(stateOf(lf), 'x').now.E, 0.000075, 2e-6, 'run bench at the last tick');
  const rf = L.readFixture('x', { x: 0, y: 0 }, { aDial: true, aC: 0.01, cC: 1 });
  holds(Object.keys(rf.dials).filter(n => !rf.props.hidden.includes(n)).join() === 'a', 'the read bench shows only its zinc dial');
  const seven = L.readFixture('x', { x: 0, y: 0 }, { aC: 1, cC: 0.01 });
  seven.dials.last.value = 1; seven.dials.s1.value = 1;
  near(L.readRead({ fixtures: { x: seven } }, 'x').now.V, 1.0408, 0.0002, 'prepared cell reads');
  const cc = L.ccFixture('x', { x: 0, y: 0 }, { metal: 'cu', cLeft: 1, cRight: 0.01 });
  holds(L.ccRead({ fixtures: { x: cc } }, 'x').needle === 0, 'the ammeter needle is at rest before the run');
  cc.dials.ran.value = 1;
  holds(L.ccRead({ fixtures: { x: cc } }, 'x').needle === -1, 'the needle swings toward the bar the electrons go to (left, from the dilute right beaker)');
  ok('q5-load instruments: the plot reaches only the tick run, the meters read the planner and the needle swings the right way');

  /* ---- stage 2 to 7: right answers pass, every slip is refused with a reading ---- */
  const put = (piece, to) => ({ place: { piece, to } });
  for (const [i, k] of [[1, 'both ions'], [2, 'falls'], [3, 'Q = K'], [4, 'right bar'], [5, 'Nernst'], [6, 'rank']]) {
    holds(Q.STAGES[i].check(Q.stateFor(i, Q.SOLUTIONS[i])).ok, `stage ${i + 1} refuses its own solution (${k})`);
  }
  holds(run(3, [put('eq', 'slot:reason')]).ok && !run(3, [put('out', 'slot:reason')]).ok && !run(3, [put('equal', 'slot:reason')]).ok, 'stage 4 accepts eq, refuses out and equal');
  for (const [bad, w] of [['out', 'Both windows still hold ions'], ['equal', 'not equal']]) {
    const r = run(3, [put(bad, 'slot:reason')]);
    holds(!r.ok && r.msg && r.msg.includes(w) && r.msg.includes('72') && r.msg.includes('28'), `stage 4 slip ${bad} is not refused with the windows' counts naming "${w}" (${r.msg})`);
  }
  holds(run(5, [typed('v', '1.01')]).ok && !run(5, [typed('v', '1.10')]).ok, 'stage 6 grading');
  for (const [bad, w] of [['1.19', 'above the 1.10 V'], ['0.92', 'one electron'], ['0.90', 'natural log'], ['1.10', 'equal concentrations'], ['-28.5', 'far from']]) {
    const r = run(5, [typed('v', bad)]);
    holds(!r.ok && r.msg && r.msg.includes(w), `stage 6 slip ${bad} is not refused naming "${w}" (${r.msg})`);
  }
  holds(run(1, [{ run: 'load' }, { setDial: { fixture: 'scene', dial: 't0', value: 1 } }]).msg.includes('tin window held'), 'stage 2 miss names the windows');
  holds(run(2, [{ run: 'rig' }, { setDial: { fixture: 'rig', dial: 'a', value: 2 } }, { run: 'rig' }, { setDial: { fixture: 'pick', dial: 'value', value: 3 } }]).msg.includes('1.16 V'), 'stage 3 miss names both readings');
  holds(/ammeter needle is at rest/.test(run(4, [{ setDial: { fixture: 'pick', dial: 'value', value: 1 } }]).msg), 'stage 5 unrun miss names the needle');
  ok('q5-load stages: every right answer passes and every slip or miss is refused with a reading from the table');

  /* ---- a correct answer is accepted at once, with no run needed ---- */
  holds(run(1, [{ setDial: { fixture: 'scene', dial: 't0', value: 1 } }, { setDial: { fixture: 'scene', dial: 't1', value: 1 } }]).ok, 'stage 2: the right answer must be accepted without a run');
  holds(run(6, ['tb', 'ta', 'tc'].map((c, i) => ({ place: { piece: c, to: `rail:${i}` } }))).ok, 'stage 7: a right rank must be accepted without every cell read');

  /* ---- no Le Châtelier language, no Q before stage 4, no arrows in keys, and no refusal that carries the rule ---- */
  const all = [];
  Q.STAGES.forEach((s, i) => {
    const r = s.reward;
    all.push({ i, text: `${s.title} ${s.prompt} ${s.hints.join(' ')} ${r.title} ${r.body}` });
  });
  for (const { i, text } of all) {
    holds(!/shift|Le Ch|equilibrium position|favou?rs? the (reactants|products)/i.test(text), `stage ${i + 1} uses shift or Le Châtelier language`);
    holds(!/[+−-] ?electrode|positive electrode|negative electrode/i.test(text), `stage ${i + 1} labels an electrode + or −`);
    if (i < 3) holds(!/\bQ\b|reaction quotient|Nernst|concentration cell/.test(text.replace(/Prediction/, '')), `stage ${i + 1} uses a word that stage 4 or later earns`);
  }
  const rule = /\b(more product|farther from balance|log Q)\b|Q = K|multiply by 0\.0592|subtract|takes? the log/i;
  const msgs = [];
  Q.MISSES.forEach((m, i) => { const r = run(i, m); if (r.msg) msgs.push(r.msg); });
  for (const m of msgs) holds(!rule.test(m), `a refusal carries the rule: "${m}"`);
  ok('q5-load words: no shift or Le Châtelier language, no early Q, and no refusal carries its stage\'s rule');

  /* ---- the story's numbers are the planner's ---- */
  const story = JSON.stringify(QUEST_STORY['unit10/q5-load'].beats);
  const e = P.loadAt('pb', 'sn', START, 40);
  for (const n of ['0.012', `${e.nAnode} tin`, `${e.nCathode} lead`, '2.6', '2.5', '1.01', '0.059', '1000', '0.01']) holds(story.includes(n), `story is missing ${n}`);
  holds(Math.abs(e.nAnode / e.nCathode - 2.6) < 0.05, 'story ratio 72 over 28 is 2.6');
  holds(STAGE_STORY['q5-load']?.[1] === 'The marsh cells fade over a day, and Vess wants to find out what a cell does as it runs.', 'stage 1 lead line');
  holds(QUEST_STORY['unit10/q5-load'].filed === 'Filed: a cell does not run out, it runs down toward a balance; the Fifth\'s dead cells had reached it.', 'the Filed line');
  ok('q5-load story: every number Vess quotes is a planner figure');

  if (!bad) ok('Brinewire q5-load: every load run, Nernst voltage, concentration cell, slip, refusal and story number agrees with the values worked by hand');
  return bad;
}
