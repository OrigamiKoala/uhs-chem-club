/**
 * verdigris-boss-checks.mjs — hand-worked checks for boss-leach (The Leach). Every expected value was worked on paper, never produced by the
 * code under test.
 *
 *   phase 1  Kw(60 °C) = 9.61e-14: neutral water reads -1/2 log Kw = 6.5086; HCl 2.8e-7 M at 25 °C: h = (c + sqrt(c² + 4e-14)) / 2 = 3.1205e-7, pH 6.5058,
 *            OH⁻ 3.2e-8; NaOH 8.6e-7 M at 60 °C: oh = (c + sqrt(c² + 3.844e-13)) / 2 = 9.601e-7, h = 1.0009e-7, pH 6.9996
 *   phase 2  x = (-Ka + sqrt(Ka² + 4 Ka c)) / 2: formic 0.050 M x = 2.9113e-3 (pH 2.536, 5.82 %), acetic 0.10 M x = 1.3327e-3 (2.875, 1.33 %),
 *            hydrofluoric 0.0010 M x = 5.5196e-4 (3.258, 55.2 %): windows of 200 show 12, 3 and 110 units
 *   phase 3  ammonium 0.20 M: x = sqrt(5.556e-10 × 0.20) = 1.054e-5, pH 4.977; carbonate 0.10 M: Kb = 1e-14 / 4.7e-11 = 2.1277e-4,
 *            x = 4.5075e-3, pOH 2.346, pH 11.654; potassium chloride 7.00
 *   phase 4  ammonia 25.0 mL of 0.100 M with 0.100 M acid: 25.00 mL, ammonium 0.0500 M, x = sqrt(5.556e-10 × 0.05) = 5.27e-6, pH 5.278; past
 *            equivalence by v mL the H₃O⁺ is 0.1 v / (50 + v): pH 4.1 at +0.04 mL, so methyl red (4.1 to 6.1) stays within 0.3 mL, while
 *            pH 2.7 (methyl orange) needs about +1.0 mL
 *   phase 5  pKa = -log 1.8e-5 = 4.7447; ratio = 10^(5.10 - 4.7447) = 2.266; 100 acetic acid with 226.6 acetate reads 5.1008
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkVerdigrisBoss({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`boss-leach ${msg}`); };
  const near = (got, want, tol, label) => { if (!(Math.abs(got - want) <= tol)) no(`${label}: got ${got}, expected ${want}`); };
  const holds = (cond, label) => { if (!cond) no(label); };

  installUiStub();
  const P = await import('../../src/learn/engine/phdata.js');
  const L = await import('../../src/learn/quests/unit09/boss-leach.js');
  const { planFoe, resolveEncounter, portraitSvg } = await import('../../src/learn/engine/foes.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { CLUES, EPISODES } = await import('../../src/story/saga.js');
  const { paintScene } = await import('../../src/ui/story-scenes.js');
  const run = (i, script) => L.STAGES[i].check(L.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const typed = (entry, value) => ({ type: { entry, value: String(value) } });
  const rail = ids => ids.map((id, i) => put(`c-${id}`, `rail:${i}`));

  /* ---- phase 1 ---- */
  const W = P.scaleSolution({ id: 'water', T: 60 }); const A = P.scaleSolution({ id: 'hcl', c: 2.8e-7 }); const B = P.scaleSolution({ id: 'naoh', c: 8.6e-7, T: 60 });
  near(W.pH, 6.5086, 0.0005, 'warm water pH'); near(A.pH, 6.5058, 0.0005, 'dilute acid pH'); near(A.oh, 3.2e-8, 5e-10, 'dilute acid OH⁻'); near(B.pH, 6.9996, 0.0005, 'dilute base pH');
  near(B.oh, 9.601e-7, 5e-10, 'dilute base OH⁻'); near(B.h, 1.0009e-7, 2e-10, 'dilute base H₃O⁺');
  holds(Math.abs(W.h - W.oh) < 1e-15 && A.h > 5 * A.oh && B.oh > 5 * B.h, 'only the warm water holds equal H₃O⁺ and OH⁻');
  holds(Math.abs(W.pH - A.pH) < 0.01, 'the meter alone cannot separate the water from the acid (both read 6.51)');
  holds(run(0, [dial('pick', 'value', 2)]).ok, 'phase 1 accepts the water');
  const m1 = run(0, [dial('pick', 'value', 1)]); const m3 = run(0, [dial('pick', 'value', 3)]);
  holds(!m1.ok && /reads 6\.51/.test(m1.msg) && /3\.1 × 10⁻⁷/.test(m1.msg), `phase 1 refuses the acid naming its lens: "${m1.msg}"`);
  holds(!m3.ok && /reads 7\.00/.test(m3.msg) && /9\.6 × 10⁻⁷/.test(m3.msg), `phase 1 refuses the base naming its lens: "${m3.msg}"`);
  holds(run(0, []).notYet, 'phase 1 waits for the dial');

  /* ---- phase 2 ---- */
  const ac = P.weakAcid(1.8e-5, 0.10); const hf = P.weakAcid(6.8e-4, 0.0010); const fo = P.weakAcid(1.8e-4, 0.050);
  near(fo.pH, 2.536, 0.001, 'formic pH'); near(ac.pH, 2.875, 0.001, 'acetic pH'); near(hf.pH, 3.258, 0.001, 'hydrofluoric pH');
  near(fo.h, 2.9113e-3, 2e-6, 'formic H₃O⁺'); near(hf.h, 5.5196e-4, 2e-7, 'hydrofluoric H₃O⁺');
  const win = f => Math.round(200 * f.ionized);
  holds(win(fo) === 12 && win(ac) === 3 && win(hf) === 110, `the windows show 12, 3 and 110 units (${win(fo)}, ${win(ac)}, ${win(hf)})`);
  holds(hf.percent > fo.percent && hf.percent > ac.percent && hf.pH > ac.pH && ac.pH > fo.pH, 'the largest share is not the lowest pH');
  holds(L.CHECKS.P2_WANT.join() === 'formic,acetic,hf', `the rank is formic, acetic, hydrofluoric (${L.CHECKS.P2_WANT.join()})`);
  holds(run(1, rail(['formic', 'acetic', 'hf'])).ok, 'phase 2 accepts the rank');
  const r2 = run(1, rail(['hf', 'acetic', 'formic']));
  holds(!r2.ok && /110 of 200/.test(r2.msg) && /0\.0010 M/.test(r2.msg) && !/pH/.test(r2.msg), `phase 2 refuses the swapped rank with the windows: "${r2.msg}"`);
  holds(!run(1, rail(['acetic', 'formic', 'hf'])).ok && run(1, rail(['acetic'])).notYet, 'phase 2 refuses a near rank and waits for three cards');

  /* ---- phase 3 ---- */
  const nh = P.weakAcid(P.ACIDS.nh4.Ka, 0.20); const co = P.weakBase(1e-14 / 4.7e-11, 0.10);
  near(nh.pH, 4.977, 0.001, 'ammonium nitrate pH'); near(co.pH, 11.654, 0.001, 'sodium carbonate pH'); near(co.oh, 4.5075e-3, 2e-6, 'carbonate OH⁻');
  holds(run(2, [put('c-nh4no3', 'tray:acidic'), put('c-na2co3', 'tray:basic'), put('c-kcl', 'tray:neutral')]).ok, 'phase 3 accepts the sort');
  const s3 = run(2, [put('c-nh4no3', 'tray:neutral'), put('c-na2co3', 'tray:basic'), put('c-kcl', 'tray:neutral')]);
  holds(!s3.ok && /ammonium nitrate reads 4\.98/.test(s3.msg), `phase 3 refuses a wrong tray with the reading: "${s3.msg}"`);
  holds(run(2, [put('c-kcl', 'tray:neutral')]).notYet, 'phase 3 waits for three cards');

  /* ---- phase 4 ---- */
  const S = L.CHECKS.P4_SPEC;
  near(P.equivalenceML(S), 25.0, 1e-9, 'ammonia equivalence volume'); near(P.titrationML(S, 25), 5.278, 0.001, 'ammonia equivalence pH');
  holds(L.CHECKS.P4_RIGHT.join() === 'methylRed', `only methyl red ends at the equivalence point (${L.CHECKS.P4_RIGHT.join()})`);
  const mr = P.indicatorWindowML(S, P.INDICATORS.methylRed); const mo = P.indicatorWindowML(S, P.INDICATORS.methylOrange);
  near(mr.from, 24.98, 0.03, 'methyl red from'); near(mr.to, 25.04, 0.03, 'methyl red to'); near(mo.to, 26.02, 0.05, 'methyl orange to');
  holds(run(3, [put('c-methylRed', 'slot:dye')]).ok, 'phase 4 accepts methyl red');
  const d = run(3, [put('c-bromothymol', 'slot:dye')]); const e = run(3, [put('c-phenolphthalein', 'slot:dye')]);
  holds(!d.ok && /bromothymol blue tube changed colour between 23\.7 mL and 25\.0 mL/.test(d.msg), `phase 4 refuses bromothymol blue naming its volumes: "${d.msg}"`);
  holds(!e.ok && /phenolphthalein tube/.test(e.msg), 'phase 4 refuses phenolphthalein with its volumes');
  holds(run(3, []).notYet, 'phase 4 waits for a card');

  /* ---- phase 5 ---- */
  const ratio = 10 ** (5.10 - -Math.log10(1.8e-5));
  near(ratio, 2.266, 0.001, 'ratio for 5.10');
  near(P.bufferState({ Ka: 1.8e-5, nHA: 0.01, nA: 0.01 * ratio, V: 0.1 }).pH, 5.1008, 0.003, 'the flask at that ratio');
  holds(run(4, [typed('ratio', '2.27')]).ok && run(4, [typed('ratio', '2.2')]).ok && run(4, [typed('ratio', '2.4')]).ok, 'phase 5 accepts 2.27, 2.2 and 2.4');
  holds(!run(4, [typed('ratio', '2.0')]).ok && !run(4, [typed('ratio', '2.6')]).ok, 'phase 5 refuses 2.0 and 2.6');
  const i5 = run(4, [typed('ratio', '0.44')]);
  holds(!i5.ok && /reads 4\.39/.test(i5.msg) && /target is 5\.10/.test(i5.msg), `phase 5 refuses the ratio turned over naming the flask: "${i5.msg}"`);
  holds(!run(4, [typed('ratio', '-1')]).ok && run(4, []).notYet, 'phase 5 refuses a negative ratio and waits for a number');

  /* ---- the Leach's planner ---- */
  const enc = resolveEncounter(L.STAGES[0]);
  const foe = enc.foes[0];
  const pl = (pH, T) => planFoe(enc, foe, { kind: 'ph', pH, T });
  holds(pl(6.5086, 60).pose === 'neutral' && pl(7.0, 60).pose === 'base' && pl(6.5, 25).pose === 'acid' && pl(7.0, 25).pose === 'neutral', 'the vats stand level on the neutral pH of the flask\'s own temperature');
  holds(planFoe(enc, foe, { pose: 'acid' }).pose === 'acid' && planFoe(enc, foe, {}).pose === 'unmoved', 'on a table the Leach takes the pose it is handed, and rests by default');
  holds(/<svg/.test(portraitSvg('the leach', 'acid')) && /<svg/.test(portraitSvg('the leach', 'dispersed')), 'the Leach has a portrait');

  /* ---- the shape of a boss ---- */
  holds(L.STAGES.length === 5 && L.meta.stageCount === 5 && L.SOLUTIONS.length === 5 && L.MISSES.length === 5, 'five phases, five solutions, five misses');
  const words = s => s.trim().split(/\s+/).length;
  L.STAGES.forEach((st, i) => {
    holds(Array.isArray(st.foes) && st.foes.length === 1 && st.encounter?.species === 'the leach', `phase ${i + 1} names its one foe`);
    holds(!st.field && !st.predict && !(st.table.fetch || []).length, `phase ${i + 1} is no field stage and no prediction`);
    holds(st.hints.length === 3 && st.hints.every(h => !/[!]/.test(h)), `phase ${i + 1} has exactly three hints`);
    holds(words(st.prompt) <= 25 && !/!/.test(st.prompt), `phase ${i + 1}'s prompt is ${words(st.prompt)} words`);
    holds(!st.briefing, `phase ${i + 1} has no lead line`);
    const r = st.check(L.stateFor(i, L.MISSES[i]));
    holds(!r.ok && !r.notYet && r.msg && r.msg.length > 20, `phase ${i + 1}'s miss is refused with a reason`);
    holds(st.check(L.stateFor(i, L.SOLUTIONS[i])).ok, `phase ${i + 1}'s solution is accepted`);
  });

  /* ---- the foe's corner is clear on every phase ---- */
  const MODEL = await import('../../src/learn/table/model.js');
  const LAYOUT = await import('../../src/learn/table/layout.js');
  const SNAP = await import('../../src/learn/table/snap.js');
  const REG = await import('../../src/learn/table/kits/registry.js');
  L.STAGES.forEach((st, i) => {
    const state = MODEL.createTable(st.table, st.title);
    const pad = LAYOUT.foePadOf(state.bounds).rect;
    const hit = r => r.x0 < pad.x1 && pad.x0 < r.x1 && r.y0 < pad.y1 && pad.y0 < r.y1;
    const inside = [];
    for (const z of Object.values(state.zones.slots)) if (hit(SNAP.rectOf(z, SNAP.SIZES.slot))) inside.push(`slot ${z.id}`);
    for (const z of Object.values(state.zones.trays)) if (hit(SNAP.rectOf(z, SNAP.SIZES.tray))) inside.push(`tray ${z.id}`);
    for (const f of Object.values(state.fixtures)) if (hit(LAYOUT.fixtureLayout(f).box)) inside.push(`fixture ${f.id}`);
    const kit = REG.getKit(state.kit);
    for (const p of Object.values(state.pieces)) { const r = REG.radiusOf(kit, p); if (hit({ x0: p.at.x - r, x1: p.at.x + r, y0: p.at.y - r, y1: p.at.y + r })) inside.push(`piece ${p.id}`); }
    holds(inside.length === 0, `phase ${i + 1} stands ${inside.join(', ')} in the foe's corner`);
  });

  /* ---- the story and the case file ---- */
  const qs = QUEST_STORY['unit09/boss-leach'];
  holds(Boolean(qs) && qs.scene === 'leach-open' && qs.beats.length === 4 && /^Filed:/.test(qs.filed), 'the finale has four beats and a Filed line');
  holds(Boolean(CLUES.clue_verdigris_leach) && EPISODES.unit09.bossId === 'boss-leach' && EPISODES.unit09.clueId === 'clue_verdigris_leach' && L.CLUE_ID === 'clue_verdigris_leach', 'the clue is in the Case File and the episode names the boss');
  // The numbers in the beats are the planners'.
  const say = qs.beats.map(b => b.say).join(' ');
  holds(say.includes(P.fmt(W.pH, 2)) && say.includes(P.fmt(B.pH, 2)) && say.includes(P.fmt(fo.pH, 2)) && say.includes(P.fmt(ac.pH, 2)) && say.includes(P.fmt(hf.pH, 2)) && say.includes('25.0 mL') && say.includes(P.fmt(P.titrationML(S, 25), 2)) && say.includes('227') && say.includes('5.10'), 'every figure in the beats is the planners\'');
  const calls = [];
  const rec = () => new Proxy(function () {}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 10 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : rec()), apply: () => rec(), set: () => true });
  try { for (const t of [0.1, 0.4, 0.6, 0.9, 1]) paintScene('leach-open', rec(), 960, 540, t, 0); calls.push('ok'); } catch (e) { no(`the finale scene throws: ${e.message}`); }
  return bad;
}
