/**
 * Hand-worked checks for boss-tipper (The Tipper). Every expected value was worked on paper, never produced by the code under test.
 * Held here: the five phases' figures, the slips each typed phase refuses (with a reason that names the table), the Tipper's own
 * planner (`foes.js`), and the shape of a boss phase (one foe, no field, no prediction, three hints, a short prompt).
 */
import { K_SYSTEMS, Q5, simulatePan, tallyWindow, systemRatio, runMixture, gaugePos, settleAmounts, iceAmounts, kSlips } from '../../src/learn/engine/eqdata.js';
import { LEAN_RXNS, leanSettle, leanStress, leanK } from '../../src/learn/engine/eqdata.js';

export async function checkTeeterBoss(ok, bad) {
  const near = (got, want, rel, label) => (Math.abs(got - want) <= rel * Math.abs(want) ? ok(`boss ${label}: ${Number(got).toPrecision(4)} ≈ ${want}`) : bad(`boss ${label}: got ${got}, expected ${want}`));
  const yes = (cond, label) => (cond ? ok(`boss ${label}`) : bad(`boss ${label}`));

  const { installUiStub } = await import('./ui-stub.mjs');
  installUiStub();
  const T = await import('../../src/learn/quests/unit08/boss-tipper.js');
  const { planFoe, resolveEncounter } = await import('../../src/learn/engine/foes.js');
  const run = (i, script) => T.STAGES[i].check(T.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const typed = (entry, value) => ({ type: { entry, value: String(value) } });
  const runs = (fid, n) => Array.from({ length: n }, () => ({ run: fid }));

  /* ---- phase 1: three pans of A ⇌ B, each run to tick 60 ---- */
  // Pan 2: kf 0.09, kr 0.03 → B = 48 × 0.09 / 0.12 = 36, A = 12; the rates at that level are 12 × 0.09 = 36 × 0.03 = 1.08 per tick,
  // so 50 ticks count about 54 changes each way.
  const [a1, a2, a3] = T.CHECKS.P1_PANS.map(p => simulatePan({ n: 48, b0: 0, kf: p.kf, kr: p.kr, ticks: 200, seed: p.seed }));
  near(12 * 0.09, 36 * 0.03, 1e-12, 'pan 2 rates agree at its level');
  const mean = (h, from, to) => { let s = 0; for (let t = from; t <= to; t++) s += h.b[t]; return s / (to - from + 1); };
  near(mean(a2, 40, 200), 36, 0.06, 'pan 2 settles near 36 B');
  const t2 = tallyWindow(a2, 60, 50);
  yes(t2.fwd > 30 && t2.rev > 30 && Math.abs(t2.fwd - t2.rev) <= 0.35 * Math.max(t2.fwd, t2.rev), `pan 2's two counts run and are level at tick 60 (${t2.fwd} and ${t2.rev})`);
  // Pan 1: kr = 0, so B never turns back; every A has turned by tick 60 (1 − 0.88⁶⁰ ≈ 1) and the graph is at the top.
  yes(tallyWindow(a1, 60, 50).rev === 0 && a1.b[60] === 48, 'pan 1 has nothing turning back and sits at the top at tick 60');
  yes(tallyWindow(a1, 200, 50).fwd === 0, 'pan 1 stops changing altogether');
  // Pan 3: kf 0.005, kr 0.0025 → its level is B = 32 and it has only gone part of the way: 1 − (1 − 0.0075)^60 = 0.363, B ≈ 11.6 (scatter allowed).
  near(32 * (1 - Math.pow(1 - 0.0075, 60)), 11.6, 0.02, 'pan 3 expected B at tick 60');
  yes(a3.b[60] < 24 && a3.b[200] - a3.b[60] >= 8, `pan 3 is still rising (B ${a3.b[60]} at tick 60, ${a3.b[200]} at tick 200)`);
  yes(run(0, [dial('pick', 'value', 2)]).ok, 'phase 1 accepts Pan 2');
  const m1 = run(0, [dial('pick', 'value', 1)]); const m3 = run(0, [dial('pick', 'value', 3)]);
  yes(!m1.ok && /Isobutane to Butane/.test(m1.msg) && /count reads 0/.test(m1.msg), `phase 1 refuses Pan 1 naming its count: "${m1.msg}"`);
  yes(!m3.ok && /still falling/.test(m3.msg), `phase 1 refuses Pan 3 naming its graph: "${m3.msg}"`);
  yes(run(0, []).notYet, 'phase 1 waits for the dial');

  /* ---- phase 2: 2 SO₂ + O₂ ⇌ 2 SO₃, K = 280, from 1.00 SO₂ and 0.50 O₂ ---- */
  // x of O₂ used: SO₂ = 1 − 2x, O₂ = 0.5 − x, SO₃ = 2x. At SO₃ = 0.8299: x = 0.41496, SO₂ = 0.17008, O₂ = 0.08504.
  // Check by plugging in: 0.8299² / (0.17008² × 0.08504) = 0.68873 / 0.0024600 = 280.
  const so = K_SYSTEMS.so3;
  const eq = settleAmounts(so, { SO2: 1, O2: 0.5, SO3: 0 });
  near(eq.SO3, 0.8299, 1e-3, 'SO₃ at equilibrium'); near(eq.SO2, 0.17008, 1e-3, 'SO₂ at equilibrium'); near(eq.O2, 0.08504, 1e-3, 'O₂ at equilibrium');
  near(eq.SO2 + eq.SO3, 1, 1e-9, 'sulfur is conserved'); near(eq.O2 + eq.SO3 / 2, 0.5, 1e-9, 'oxygen is conserved');
  near(0.8299 ** 2 / (0.17008 ** 2 * 0.08504), 280, 2e-3, 'K by hand from the bars');
  // The slips: each substance once, 0.8299 / (0.17008 × 0.08504) = 57.4; turned over, 1/280 = 0.003571.
  const sl = kSlips(so, eq);
  near(sl.noPower, 0.8299 / (0.17008 * 0.08504), 2e-3, 'the figure with no powers'); near(sl.inverted, 1 / 280, 2e-3, 'the figure turned over');
  yes(run(1, [typed('k', '280')]).ok && run(1, [typed('k', '2.8e2')]).ok && run(1, [typed('k', '272')]).ok, 'phase 2 accepts 280, 2.8e2 and 272 (2.9 % low)');
  yes(!run(1, [typed('k', '290')]).ok && !run(1, [typed('k', '300')]).ok, 'phase 2 refuses 290 (3.6 % high) and 300');
  const s57 = run(1, [typed('k', '57')]); const s0 = run(1, [typed('k', '0.0036')]);
  yes(!s57.ok && /counts each substance once/.test(s57.msg), `phase 2 refuses the figure with no powers: "${s57.msg}"`);
  yes(!s0.ok && /below 1/.test(s0.msg) && /SO₃ bar/.test(s0.msg), `phase 2 refuses the figure turned over, naming the bars: "${s0.msg}"`);
  yes(run(1, []).notYet, 'phase 2 waits for a number');

  /* ---- phase 3: butane ⇌ isobutane, K = 2.0 ---- */
  const butane = K_SYSTEMS.butane;
  near(systemRatio(butane, { butane: 0.4, isobutane: 1.2 }), 3.0, 1e-9, 'Q of mixture 1');
  near(systemRatio(butane, { butane: 0.6, isobutane: 0.6 }), 1.0, 1e-9, 'Q of mixture 2');
  near(systemRatio(butane, { butane: 0.4, isobutane: 0.8 }), 2.0, 1e-9, 'Q of mixture 3');
  yes(['reverse', 'forward', 'none'].every((d, i) => runMixture(butane, T.CHECKS.P3_MIX[i].amounts).dir === d), 'the three mixtures go reverse, forward and not at all');
  yes(run(2, [put('m1', 'slot:tv.seat')]).ok, 'phase 3 accepts mixture 1');
  const r2 = run(2, [put('m2', 'slot:tv.seat')]); const r3 = run(2, [put('m3', 'slot:tv.seat')]);
  yes(!r2.ok && /Q = 1/.test(r2.msg) && /isobutane/.test(r2.msg), `phase 3 refuses mixture 2 with Q vs K: "${r2.msg}"`);
  yes(!r3.ok && /Q = 2/.test(r3.msg) && /does not change/.test(r3.msg), `phase 3 refuses mixture 3 with Q vs K: "${r3.msg}"`);
  yes(run(2, []).notYet, 'phase 3 waits for a card in the vessel');

  /* ---- phase 4: N₂O₄ ⇌ 2 NO₂, squeezed from 1 L to 0.5 L ---- */
  // Halving the volume doubles every pressure; Q = P(NO₂)² / P(N₂O₄) goes up by 2² / 2 = 2, so Q = 2K: Q is above K and the vessel moves toward N₂O₄.
  const rxn = LEAN_RXNS.n2o4; const P4 = T.CHECKS.P4;
  const base = leanSettle(rxn, P4.mix, P4.V0, P4.T0);
  const res = leanStress(rxn, { n: base.n, V: P4.V0, T: P4.T0 }, { V: 0.5 });
  near(res.post.Q / res.post.K, 2, 1e-9, 'Q is twice K just after the squeeze'); yes(res.dir === 'reverse', 'the squeezed vessel moves toward N₂O₄');
  // By hand, before: n(NO₂) = 0.014100, n(N₂O₄) = 0.032950 at 298 K in 1 L (0.082057 × 298 = 24.453 atm per mol/L): P = 0.34477 and 0.80574 atm,
  // Q = 0.11886 / 0.80574 = 0.14752 = K. After: the NO₂ amount falls (the vessel gives up NO₂ for N₂O₄) and the atoms are conserved: n(N₂O₄) + n(NO₂)/2 = 0.04.
  near((24.453 * 0.0141) ** 2 / (24.453 * 0.03295), leanK(rxn, 298), 5e-3, 'Q of the settled vessel is K, by hand');
  near(base.n.N2O4 + base.n.NO2 / 2, 0.04, 1e-9, 'nitrogen is conserved before'); near(res.eq.n.N2O4 + res.eq.n.NO2 / 2, 0.04, 1e-9, 'nitrogen is conserved after');
  yes(res.eq.n.NO2 < base.n.NO2 * 0.8, `NO₂ falls from ${base.n.NO2.toFixed(4)} to ${res.eq.n.NO2.toFixed(4)} mol`);
  const squeeze = [dial('v', 'vol', 0.5), ...runs('v', 6)];
  yes(run(3, [...squeeze, dial('ans', 'value', 2)]).ok, 'phase 4 accepts "Falls"');
  const f1 = run(3, [...squeeze, dial('ans', 'value', 1)]); const f3 = run(3, [...squeeze, dial('ans', 'value', 3)]);
  yes(!f1.ok && /NO₂ line reads 0\.01/.test(f1.msg) && /stood at 0\.0141/.test(f1.msg), `phase 4 refuses "Rises" with the line's readings: "${f1.msg}"`);
  yes(!f3.ok, 'phase 4 refuses "Stays the same"');
  yes(!run(3, [dial('ans', 'value', 1)]).ok && /piston has not moved/.test(run(3, [dial('ans', 'value', 1)]).msg), 'phase 4 says the piston has not moved when it has not');
  yes(run(3, []).notYet, 'phase 4 waits for the dial');

  /* ---- phase 5: H₂ + I₂ ⇌ 2 HI, K = 54, from equal 0.80 M H₂ and 0.80 M I₂ ---- */
  // 2x / (0.80 − x) = √54 = 7.34847 → x = 0.62885, HI = 1.2577, H₂ = I₂ = 0.17115.
  const ice = iceAmounts(Q5.hi.species, { 'H₂': 0.8, 'I₂': 0.8 }, 54);
  near(ice.x, 0.62885, 1e-4, 'x'); near(ice.amounts.HI, 1.2577, 1e-4, '[HI]'); near(ice.amounts['H₂'], 0.17115, 1e-3, '[H₂] left'); near(ice.amounts['I₂'], 0.17115, 1e-3, '[I₂] left');
  near(ice.amounts.HI ** 2 / (ice.amounts['H₂'] * ice.amounts['I₂']), 54, 2e-3, 'K from the settled amounts');
  yes(run(4, [{ run: 'bars' }, typed('hi', '1.26')]).ok && run(4, [typed('hi', '1.24')]).ok, 'phase 5 accepts 1.26 and 1.24');
  yes(!run(4, [typed('hi', '1.20')]).ok && !run(4, [typed('hi', '1.31')]).ok, 'phase 5 refuses 1.20 and 1.31');
  const x = run(4, [typed('hi', '0.629')]); const full = run(4, [typed('hi', '1.6')]); const lo = run(4, [typed('hi', '0.9')]);
  yes(!x.ok && /twice 0\.629/.test(x.msg), `phase 5 refuses x: "${x.msg}"`);
  yes(!full.ok && /H₂ as used up/.test(full.msg), `phase 5 refuses a pan that went to completion: "${full.msg}"`);
  yes(!lo.ok && /settles higher/.test(lo.msg), `phase 5 says which way a low figure is off: "${lo.msg}"`);
  yes(run(4, []).notYet, 'phase 5 waits for a number');

  /* ---- the Tipper's planner: the beam sits where the gauge puts Q against K ---- */
  const enc = resolveEncounter(T.STAGES[0]);
  const foe = enc.foes[0];
  const level = planFoe(enc, foe, { kind: 'gauge', Q: 1.2, K: 1.2 });
  const right = planFoe(enc, foe, { kind: 'gauge', Q: 2, K: 1.2 });
  const left = planFoe(enc, foe, { kind: 'gauge', Q: 0.5, K: 1.2 });
  // log10(2 / 1.2) = 0.22185 → over 1.5 decades 0.14790; log10(0.5 / 1.2) = −0.38021 → −0.25347.
  yes(level.pose === 'level' && level.lean === 0 && /level/.test(level.line), 'Q on K: the beam is level');
  yes(right.pose === 'tipped' && Math.abs(right.lean - 0.1479) < 1e-3 && /right/.test(right.line), 'Q above K: the beam tips right by the gauge\'s own place');
  yes(left.pose === 'tipped' && Math.abs(left.lean + 0.25347) < 1e-3 && /left/.test(left.line), 'Q below K: the beam tips left');
  near(gaugePos(2, 1.2, 1.5), 0.1479, 1e-3, 'the gauge place of Q = 2');
  yes(planFoe(enc, foe, { pose: 'unmoved' }).pose === 'unmoved' && planFoe(enc, foe, {}).pose === 'unmoved', 'on a table the Tipper takes the pose it is handed, and rests by default');

  /* ---- the shape of a boss ---- */
  yes(T.STAGES.length === 5 && T.meta.stageCount === 5 && T.SOLUTIONS.length === 5 && T.MISSES.length === 5, 'five phases, five solutions, five misses');
  const words = s => s.trim().split(/\s+/).length;
  T.STAGES.forEach((st, i) => {
    yes(Array.isArray(st.foes) && st.foes.length === 1 && st.encounter?.species === 'the tipper', `phase ${i + 1} names its one foe`);
    yes(!st.field && !st.predict && !(st.table.fetch || []).length, `phase ${i + 1} is no field stage and no prediction`);
    yes(st.hints.length === 3 && st.hints.every(h => !/[!]/.test(h)), `phase ${i + 1} has exactly three hints`);
    yes(words(st.prompt) <= 25 && !/!/.test(st.prompt), `phase ${i + 1}'s prompt is ${words(st.prompt)} words`);
    yes(!st.briefing, `phase ${i + 1} has no lead line`);
    const m = T.stateFor(i, T.MISSES[i]);
    const r = st.check(m);
    yes(!r.ok && !r.notYet && r.msg && r.msg.length > 20, `phase ${i + 1}'s miss is refused with a reason`);
    yes(st.check(T.stateFor(i, T.SOLUTIONS[i])).ok, `phase ${i + 1}'s solution is accepted`);
  });

  /* ---- the foe's corner is clear on every phase (x from 126.5, y to 23.5 on a 150-wide table) ---- */
  const MODEL = await import('../../src/learn/table/model.js');
  const LAYOUT = await import('../../src/learn/table/layout.js');
  const SNAP = await import('../../src/learn/table/snap.js');
  const REG = await import('../../src/learn/table/kits/registry.js');
  T.STAGES.forEach((st, i) => {
    const state = MODEL.createTable(st.table, st.title);
    const pad = LAYOUT.foePadOf(state.bounds).rect;
    const hit = r => r.x0 < pad.x1 && pad.x0 < r.x1 && r.y0 < pad.y1 && pad.y0 < r.y1;
    const inside = [];
    for (const z of Object.values(state.zones.slots)) if (hit(SNAP.rectOf(z, SNAP.SIZES.slot))) inside.push(`slot ${z.id}`);
    for (const z of Object.values(state.zones.trays)) if (hit(SNAP.rectOf(z, SNAP.SIZES.tray))) inside.push(`tray ${z.id}`);
    for (const f of Object.values(state.fixtures)) if (hit(LAYOUT.fixtureLayout(f).box)) inside.push(`fixture ${f.id}`);
    const kit = REG.getKit(state.kit);
    for (const p of Object.values(state.pieces)) { const r = REG.radiusOf(kit, p); if (hit({ x0: p.at.x - r, x1: p.at.x + r, y0: p.at.y - r, y1: p.at.y + r })) inside.push(`piece ${p.id}`); }
    yes(inside.length === 0, inside.length ? `phase ${i + 1} stands ${inside.join(', ')} in the foe's corner` : `phase ${i + 1} leaves the foe's corner clear`);
  });
}
