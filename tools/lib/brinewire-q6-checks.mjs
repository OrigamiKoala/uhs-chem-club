/**
 * brinewire-q6-checks.mjs — hand-worked checks for q6-electrolysis (Electrolysis). Each expected value below was worked by an independent
 * route (paper and a Python session with F = 96485.33 C/mol, the IUPAC molar masses, 24.79 L/mol), never produced by the code under test:
 *
 *   zinc–copper cell wired to a supply, E = 1.10 V, circuit 2.0 Ω, 60 s, net = 1.10 ∓ Vs (supply against / with the cell), I = |net| / 2.0:
 *     0.5 V against: net 0.60, I 0.30 A, zinc strip loses 6.10 mg      1.5 V against: net −0.40, I 0.20 A, zinc GAINS 4.07 mg (plates)
 *     0.5 V with:    net 1.60, I 0.80 A, zinc loses 16.26 mg           1.5 V with:    net 2.60, I 1.30 A, zinc loses 26.43 mg
 *   silver (Ag⁺ + e⁻), m = q × 107.868 / 96485.33:  1 A 30 s = 30 C → 33.54 mg;  2 A 10 s = 20 C → 22.36 mg;  0.5 A 100 s = 50 C → 55.90 mg
 *   copper (Cu²⁺ + 2 e⁻), M 63.546:  1 A 30 s 9.88 mg;  1 A 60 s and 2 A 30 s both 60 C 19.76 mg;  2 A 60 s 120 C 39.52 mg;
 *     2.00 A × 1800 s = 3600 C = 0.03731 mol e⁻ = 0.018656 mol Cu = 1.1855 g   (minutes as seconds 0.01976; forgot n 2.371;
 *     silver's M 2.012; zinc's M 1.2197)
 *   silver, 3.00 A × 600 s = 1800 C = 0.018656 mol = 2.0124 g (minutes as seconds 0.03354; two electrons 1.0062; copper's M 1.1855)
 *   nickel (Ni²⁺ + 2 e⁻, M 58.693): 0.800 A × 1500 s = 1200 C → 0.36499 g;  from 0.365 g the current is 0.8000 A
 *     (minutes as seconds 48.0; forgot n 0.4000; copper's M 0.7389; zinc's M 0.7182)
 *   water, k cells of 1.10 V in series against 1.23 V, R 2.0 Ω, 60 s:  k = 1: 1.10 V, no gas;  k = 2: 2.20 V, I 0.485 A, H₂ 3.738 mL, O₂ 1.869 mL;
 *     k = 3: 3.30 V, I 1.035 A, H₂ 7.978 mL, O₂ 3.989 mL      (H₂ = q/2F mol, O₂ = q/4F mol)
 *   water and brine at 0.50 A for 60 s (q = 30 C, 3.109e-4 mol e⁻): H₂ 3.854 mL, O₂ 1.927 mL, Cl₂ 3.854 mL
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkBrinewireQ6({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q6-electrolysis ${msg}`); };
  const near = (got, want, tol, label) => { if (Math.abs(got - want) <= tol) return; no(`${label}: got ${got}, expected ${want}`); };
  const holds = (cond, label) => { if (!cond) no(label); };

  installUiStub();
  const Q = await import('../../src/learn/quests/unit10/q6-electrolysis.js');
  const K = await import('../../src/learn/table/kits/cell.js');
  const S = await import('../../src/learn/table/kits/cell-supply.js');
  const E = await import('../../src/learn/engine/celldata-electrolysis.js');
  const D = await import('../../src/learn/engine/celldata.js');
  const L = await import('../../src/learn/table/layout.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const typed = (entry, value) => ({ type: { entry, value } });
  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (fixture, d, value) => ({ setDial: { fixture, dial: d, value } });
  const go = fixture => ({ run: fixture });

  /* ---- the planners against the values worked by hand ---- */
  const zc = (Vs, dir) => E.driveZnCu(Vs, dir);
  near(zc(0.5, 'zn').I, 0.30, 1e-9, 'Zn|Cu 0.5 V against, current'); near(zc(0.5, 'zn').zn * 1000, -6.10, 0.01, 'Zn|Cu 0.5 V against, zinc');
  near(zc(1.5, 'zn').I, 0.20, 1e-9, 'Zn|Cu 1.5 V against, current'); near(zc(1.5, 'zn').zn * 1000, 4.07, 0.01, 'Zn|Cu 1.5 V against, zinc');
  near(zc(0.5, 'cu').zn * 1000, -16.26, 0.01, 'Zn|Cu 0.5 V with, zinc'); near(zc(1.5, 'cu').zn * 1000, -26.43, 0.01, 'Zn|Cu 1.5 V with, zinc');
  holds(zc(1.5, 'zn').zincPlates && !zc(0.5, 'zn').zincPlates && !zc(0.5, 'cu').zincPlates && !zc(1.5, 'cu').zincPlates, 'only 1.5 V against the cell plates zinc');
  for (const [m, I, t, mgWant] of [['ag', 1, 30, 33.54], ['ag', 2, 10, 22.36], ['ag', 0.5, 100, 55.90], ['cu', 1, 30, 9.88], ['cu', 1, 60, 19.76], ['cu', 2, 30, 19.76], ['cu', 2, 60, 39.52], ['ag', 3, 60, 201.24]]) {
    near(E.platingRun(m, I, t).g * 1000, mgWant, 0.01, `${m} ${I} A ${t} s`);
  }
  near(E.platingRun('cu', 2, 1800).g, 1.1855, 1e-4, 'copper 2.00 A 30 min'); near(E.platingRun('ag', 3, 600).g, 2.0124, 1e-4, 'silver 3.00 A 10 min');
  near(E.platingRun('ni', 0.8, 1500).g, 0.36499, 1e-5, 'nickel 0.800 A 25 min'); near(E.currentFor('ni', 0.365, 1500), 0.8000, 1e-3, 'nickel current from 0.365 g');
  near(E.platingRun('cu', 2, 1800).q, 3600, 1e-9, 'charge 2 A 1800 s');
  near(E.waterRun(2).V, 2.20, 1e-9, '2 cells'); near(E.waterRun(2).I, 0.485, 1e-9, '2 cells current');
  near(E.waterRun(2).h2, 3.738, 0.001, '2 cells H2'); near(E.waterRun(2).o2, 1.869, 0.001, '2 cells O2');
  near(E.waterRun(3).h2, 7.978, 0.001, '3 cells H2'); near(E.waterRun(3).o2, 3.989, 0.001, '3 cells O2');
  holds(!E.waterRun(1).goes && E.waterRun(1).h2 === 0 && E.waterRun(2).goes, 'one cell gives no gas, two give gas');
  holds(D.cellsToExceed(D.WATER_BACK_VOLTAGE, 1.10) === 2, 'two cells exceed 1.23 V');
  const cr = E.compareRun(0.5, 60);
  near(cr.water.cathode.mL, 3.854, 0.001, 'water H2'); near(cr.water.anode.mL, 1.927, 0.001, 'water O2');
  near(cr.brine.cathode.mL, 3.854, 0.001, 'brine H2'); near(cr.brine.anode.mL, 3.854, 0.001, 'brine Cl2');
  holds(cr.water.anode.gas === 'O₂' && cr.brine.anode.gas === 'Cl₂', 'water gives oxygen, brine gives chlorine at the anode');
  ok('q6-electrolysis planners: every driven strip, plating mass, charge, gas volume and current agrees with the values worked by hand');

  /* ---- the typed stages and their slips ---- */
  holds(run(3, [typed('g', '1.19')]).ok && run(3, [typed('g', '1.2')]).ok && run(3, [typed('g', '1.185')]).ok, 'stage 4 refuses 1.19, 1.2 or 1.185');
  for (const [v, w] of [['0.0198', 'minutes'], ['2.37', 'half-reaction'], ['2.01', 'silver'], ['1.22', 'zinc'], ['3600', 'coulombs'], ['1186', 'milligrams']]) {
    const r = run(3, [typed('g', v)]);
    holds(!r.ok && r.msg && r.msg.includes(w), `stage 4 slip ${v} is not refused naming "${w}" (${r.msg})`);
  }
  const seat7 = put('plate-x', 'slot:sup.pan');
  holds(run(6, [typed('i', '0.8')]).ok && run(6, [typed('i', '0.80')]).ok && run(6, [typed('i', '0.79')]).ok, 'stage 7 refuses 0.800 A');
  for (const [v, w] of [['48', 'minutes'], ['0.4', 'half-reaction'], ['0.74', 'copper'], ['0.72', 'zinc']]) {
    const r = run(6, [seat7, typed('i', v)]);
    holds(!r.ok && r.msg && r.msg.includes(w), `stage 7 slip ${v} is not refused naming "${w}" (${r.msg})`);
  }
  holds(run(6, [typed('i', '0.4')]).msg.includes('balance'), 'stage 7 with no plate on the balance names the balance');
  ok('q6-electrolysis typed stages: right figures pass, every slip is refused with a reason that names a reading');

  /* ---- the other stages ---- */
  holds(run(0, [dial('sup', 'v', 2), dial('sup', 'dir', 1), go('sup')]).ok, 'stage 1: 1.5 V into the zinc strip plates zinc');
  for (const [v, d] of [[1, 1], [1, 2], [2, 2]]) {
    const r = run(0, [dial('sup', 'v', v), dial('sup', 'dir', d), go('sup')]);
    holds(!r.ok && /\d mg/.test(r.msg || '') && /strip/.test(r.msg), `stage 1 setting ${v},${d} is not refused with a strip reading (${r.msg})`);
  }
  holds(run(0, []).notYet, 'stage 1 without a run is not an answer');
  holds(run(1, [go('sup'), dial('pick', 'value', 1)]).ok && !run(1, [go('sup'), dial('pick', 'value', 2)]).ok, 'stage 2 grading');
  holds(/silvery liquid/.test(run(1, [dial('sup', 'dir', 2), go('sup'), dial('pick', 'value', 1)]).msg), 'stage 2 refusal names the product and the electrode');
  const rank = (a) => a.map((id, i) => put(id, `rail:${i}`));
  const three = [dial('sup', 'sel', 1), go('sup'), dial('sup', 'sel', 2), go('sup'), dial('sup', 'sel', 3), go('sup')];
  holds(run(2, rank(['r2', 'r1', 'r3'])).ok, 'stage 3: a correct rank must be accepted without every run made');
  const badRank = run(2, [...three, ...rank(['r1', 'r2', 'r3'])]);
  holds(!badRank.ok && /mg/.test(badRank.msg), `stage 3 wrong rank is not refused with the plate's readings (${badRank.msg})`);
  holds(run(4, [put('p1', 'slot:sup.k1'), put('p2', 'slot:sup.k2'), go('sup')]).ok, 'stage 5: two cells give gas');
  holds(run(4, [put('p1', 'slot:sup.k1'), put('p2', 'slot:sup.k2'), put('p3', 'slot:sup.k3'), go('sup')]).ok, 'stage 5: three cells give gas');
  const one = run(4, [put('p1', 'slot:sup.k1'), go('sup')]);
  holds(!one.ok && /1\.10 V/.test(one.msg), `stage 5 one cell is not refused with the chain's voltage (${one.msg})`);
  const gases = ['h1', 'o1', 'h2', 'cl'].map((id, i) => put(id, `slot:sup.t${i + 1}`));
  holds(run(5, [go('sup'), ...gases]).ok, 'stage 6 right cards');
  holds(run(5, gases).ok, 'stage 6: right cards need no run');
  const swapped = run(5, [go('sup'), put('h1', 'slot:sup.t1'), put('o1', 'slot:sup.t2'), put('h2', 'slot:sup.t3'), put('o2', 'slot:sup.t4')]);
  holds(!swapped.ok && /brine, right tube/.test(swapped.msg) && /pale green/.test(swapped.msg), `stage 6 oxygen in the brine tube is refused with the tube's reading (${swapped.msg})`);
  ok('q6-electrolysis stages: right answers pass, every wrong one is refused with a reading from the table');

  /* ---- what the bench prints: the planner's numbers, no pole label, no answer before the run ---- */
  const paintTexts = (i, script) => {
    const state = Q.stateFor(i, script);
    const texts = [];
    const ctx = new Proxy({}, { get: (t, k) => (k === 'fillText' ? s => texts.push(String(s)) : (k in t ? t[k] : () => {})), set: (t, k, v) => { t[k] = v; return true; } });
    for (const f of Object.values(state.table.fixtures)) {
      if (f.kind !== 'cellsupply') continue;
      const lay = L.fixtureLayout(f);
      K.CELL_KIT.paintFixture(ctx, f, state.table, { x0: 0, y0: 0, x1: 1, y1: 1, sc: 1, X: v => v, Y: v => v, lay });
    }
    return texts.join(' | ');
  };
  const shows = (i, script, words, label) => { const t = paintTexts(i, script); for (const w of words) holds(t.includes(w), `${label} does not print "${w}": ${t}`); return t; };
  shows(0, [dial('sup', 'v', 2), dial('sup', 'dir', 1), go('sup')], ['Zinc strip gained 4.1 mg', 'Copper strip lost 4.0 mg', '0.20 A'], 'stage 1 after the plating run');
  shows(0, [dial('sup', 'v', 1), dial('sup', 'dir', 1), go('sup')], ['Zinc strip lost 6.1 mg', 'Copper strip gained 5.9 mg', '0.30 A'], 'stage 1 after the losing run');
  shows(1, [go('sup')], ['silvery liquid', 'pale green gas'], 'stage 2 after a run');
  shows(2, three, ['33.5 mg', '22.4 mg', '55.9 mg'], 'stage 3 after three runs');
  holds(!paintTexts(2, three).includes(' C'), 'stage 3 prints a charge though the coulomb is not earned yet');
  shows(3, [dial('sup', 'cur', 2), dial('sup', 'time', 2), go('sup')], ['39.5 mg', '120 C', 'Cu²⁺ + 2 e⁻ → Cu'], 'stage 4 after a run');
  shows(4, [put('p1', 'slot:sup.k1'), put('p2', 'slot:sup.k2'), go('sup')], ['Chain 2.20 V', '3.7 mL', '1.9 mL'], 'stage 5 after a run');
  shows(5, [go('sup')], ['3.9 mL', '1.9 mL', 'pale green, bleaches'], 'stage 6 after a run');
  shows(6, [seat7], ['0.365 g', 'Plated for 25.0 min'], 'stage 7 with the plate on the balance');
  for (const i of [0, 1, 2, 3, 4, 5, 6]) {
    for (const t of [paintTexts(i, []), paintTexts(i, Q.SOLUTIONS[i])]) {
      holds(!t.split(' | ').some(it => /^\(?[+−-]\)?$/.test(it.trim())) && !/positive|negative/i.test(t), `stage ${i + 1} prints a pole label: ${t}`);
    }
  }
  for (const a of ['1.19', '1.185', '2.01', '2.012', '0.800', '0.80 A']) {
    holds(!paintTexts(3, []).includes(a) && !paintTexts(6, []).includes(a), `a typed stage prints "${a}" before anything is done`);
  }
  ok('q6-electrolysis bench: the painted numbers match the planner, no stage prints a pole label or an answer before the work');

  /* ---- words: no pole label anywhere in the text, no rule in a refusal ---- */
  const all = JSON.stringify(Q.STAGES.map(s => [s.prompt, s.hints, s.reward, s.title]));
  holds(!/positive (electrode|terminal)|negative (electrode|terminal)|\(\+\)|\(−\)|\bpole\b/i.test(all), 'a prompt, hint or reward names a pole');
  holds(!/Le Ch/i.test(all), 'Le Châtelier language');
  const rule = /\bI ?t ?(\/|÷) ?n ?F\b|multiply the moles|divide the charge|charge is current times|current times time|q ?= ?I ?t/i;
  const allMsgs = [];
  Q.MISSES.forEach((m, i) => { const r = run(i, m); if (r.msg) allMsgs.push(r.msg); });
  for (const m of allMsgs) holds(!rule.test(m), `a refusal carries the rule: "${m}"`);
  ok('q6-electrolysis text: no pole label, and no refusal carries the rule its stage asks for');

  /* ---- the story's numbers are the planner's ---- */
  const story = JSON.stringify(QUEST_STORY['unit10/q6-electrolysis'].beats);
  for (const n of ['1.50 V', '1.10 V', '4.1 mg', '30 C', '20 C', '50 C', '3600 C', '0.0373', '0.0187', '1.19 g']) holds(story.includes(n), `story is missing ${n}`);
  ok('q6-electrolysis story: every number Vess quotes is a planner figure');

  if (!bad) ok('Brinewire q6-electrolysis: every driven strip, plated mass, charge, gas volume, slip, refusal and story number agrees with the values worked by hand');
  return bad;
}
