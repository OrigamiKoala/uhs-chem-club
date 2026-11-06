/**
 * brinewire-boss-checks.mjs — hand-worked checks for boss-clamp (The Clamp). Every expected value was worked on paper, never produced by
 * the code under test.
 *
 *   phase 1  E° (V): Fe −0.44, Ni −0.26, Sn −0.138, Ag +0.80. A strip coats in a solution whose metal has the higher E°: iron coats in the
 *            nickel, tin and silver solutions (3), nickel in tin and silver (2), tin in silver (1), silver in none (0); order Fe, Ni, Sn, Ag
 *   phase 2  Ag|Mg: E°cell = 0.80 − (−2.37) = 3.17 V; the loop current is 3.17 / 2.2 = 1.4409 A; the electrons move toward the silver
 *            beaker (the higher E°), so they leave through magnesium, the anode; silver is on the left and magnesium on the right
 *   phase 3  Fe|Ag: E°cell = 0.80 − (−0.44) = 1.24 V; sum 0.36; reversed −1.24; silver counted twice 2 × 0.80 + 0.44 = 2.04; twice the gap 2.48
 *   phase 4  zinc, 0.010 M and 1.0 M: E = (0.0257 / 2) ln 100 = 0.012846 × 4.60517 = 0.05916 V; the dilute (0.010 M) side is the anode; here it is
 *            the left bar, so the electrons leave the left bar and the needle swings toward the right
 *   phase 5  zinc, 1.50 A for 1200 s: q = 1800 C; 1800 / 96485 = 0.018655 mol of electrons; / 2 = 0.0093276 mol of zinc; × 65.38 = 0.60986 g;
 *            minutes read as seconds: 1.50 × 20 = 30 C → 0.010164 g; one electron per atom: 1.2197 g; copper's 63.55 gives 0.5927 g,
 *            silver's 107.87 gives 1.0062 g, nickel's 58.69 gives 0.5475 g
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkBrinewireBoss({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`boss-clamp ${msg}`); };
  const near = (got, want, tol, label) => { if (!(Math.abs(got - want) <= tol)) no(`${label}: got ${got}, expected ${want}`); };
  const holds = (cond, label) => { if (!cond) no(label); };

  installUiStub();
  const C = await import('../../src/learn/engine/celldata.js');
  const G = await import('../../src/learn/engine/celldata-galvanic.js');
  const Q5 = await import('../../src/learn/engine/celldata-q5.js');
  const Q2 = await import('../../src/learn/engine/celldata-q2-activity.js');
  const B = await import('../../src/learn/quests/unit10/boss-clamp.js');
  const { planFoe, resolveEncounter, portraitSvg } = await import('../../src/learn/engine/foes.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const { CLUES, EPISODES } = await import('../../src/story/saga.js');
  const { paintScene } = await import('../../src/ui/story-scenes.js');
  const run = (i, script) => B.STAGES[i].check(B.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const typed = (entry, value) => ({ type: { entry, value: String(value) } });
  const seat = (strip, beaker) => put(`s-${strip}`, `slot:dip.b${B.CHECKS.P1_METALS.indexOf(beaker)}`);
  const rail = ids => ids.map((id, i) => put(`r-${id}`, `rail:${i}`));

  /* ---- phase 1 ---- */
  near(C.METALS.fe.E0, -0.44, 1e-9, 'Fe E°'); near(C.METALS.ni.E0, -0.26, 1e-9, 'Ni E°'); near(C.METALS.sn.E0, -0.138, 1e-9, 'Sn E°'); near(C.METALS.ag.E0, 0.80, 1e-9, 'Ag E°');
  holds(B.CHECKS.P1_WANT.join() === 'fe,ni,sn,ag', `the rank is Fe, Ni, Sn, Ag (${B.CHECKS.P1_WANT.join()})`);
  const counts = m => ['fe', 'ni', 'sn', 'ag'].filter(i => i !== m && Q2.dipResult(m, i).coats.length > 0).length;
  holds(counts('fe') === 3 && counts('ni') === 2 && counts('sn') === 1 && counts('ag') === 0, 'the strips coat in 3, 2, 1 and 0 of the other solutions');
  holds(B.CHECKS.P1_CARDS.join() !== B.CHECKS.P1_WANT.join() && B.CHECKS.P1_CARDS.join() !== [...B.CHECKS.P1_WANT].reverse().join() && B.CHECKS.P1_METALS.join() !== B.CHECKS.P1_WANT.join(), 'the cards and the beakers do not stand in the answer\'s order');
  const all = B.CHECKS.P1_METALS.flatMap(ion => B.CHECKS.P1_METALS.filter(m => m !== ion).map(m => seat(m, ion)));
  holds(run(0, [...all, ...rail(['fe', 'ni', 'sn', 'ag'])]).ok, 'phase 1 accepts the rank');
  holds(run(0, rail(['fe', 'ni', 'sn'])).notYet, 'phase 1 waits for four cards');
  const m1 = run(0, [seat('fe', 'ni'), ...rail(['ni', 'fe', 'sn', 'ag'])]);
  holds(!m1.ok && /Nickel sits left of iron/.test(m1.msg) && /silver-grey coating in the Ni²⁺ solution/.test(m1.msg), `phase 1 refuses the swapped pair naming the dip: "${m1.msg}"`);
  const m1b = run(0, rail(['ni', 'fe', 'sn', 'ag']));
  holds(!m1b.ok && /has not been dipped/.test(m1b.msg), 'phase 1 says when the dip has not been made');
  holds(!run(0, rail(['ag', 'sn', 'ni', 'fe'])).ok, 'phase 1 refuses the reversed rank');

  /* ---- phase 2 ---- */
  const E2 = C.cellE0('ag', 'mg');
  near(E2, 3.17, 1e-9, 'Ag|Mg E°cell'); near(G.loopCurrent('ag', 'mg'), 3.17 / 2.2, 1e-9, 'Ag|Mg loop current'); near(G.loopCurrent('ag', 'mg'), 1.4409, 5e-5, 'Ag|Mg loop current (hand)');
  holds(G.electronsToward('ag', 'mg') === 'left' && B.CHECKS.P2_ANODE === 'mg', 'the electrons move toward the silver beaker and magnesium is the anode');
  holds(run(1, [dial('pick', 'value', 2)]).ok, 'phase 2 accepts the right strip');
  const m2 = run(1, [{ run: 'rig' }, dial('pick', 'value', 1)]);
  holds(!m2.ok && /needle swung to the left and read 1\.44 A/.test(m2.msg), `phase 2 refuses the left strip naming the needle: "${m2.msg}"`);
  const m2b = run(1, [dial('pick', 'value', 1)]);
  holds(!m2b.ok && /has not been run/.test(m2b.msg), 'phase 2 says when the cell has not been run');
  holds(run(1, []).notYet, 'phase 2 waits for the dial');

  /* ---- phase 3 ---- */
  near(B.CHECKS.P3_WANT, 1.24, 1e-9, 'Fe|Ag E°cell');
  const SEAT = 'slot:board.seat';
  const r3 = v => run(2, [put('e-fe', SEAT), put('e-ag', SEAT), typed('e', v)]);
  holds(r3('1.24').ok && r3('1.23').ok && r3('1.26').ok && !r3('1.30').ok && !r3('1.20').ok, 'phase 3 accepts 1.24 within 0.02 V');
  const s3 = {
    sum: r3('0.36'), rev: r3('-1.24'), twice: r3('2.04'), one: r3('0.80'), gap2: r3('2.48'), odd: r3('0.70')
  };
  holds(!s3.sum.ok && /added together/.test(s3.sum.msg) && /−0\.44/.test(s3.sum.msg), `phase 3 names the sum: "${s3.sum.msg}"`);
  holds(!s3.rev.ok && /other way round/.test(s3.rev.msg), 'phase 3 refuses the reversed difference');
  holds(!s3.twice.ok && /silver reading twice/.test(s3.twice.msg) && /0\.80 V for silver/.test(s3.twice.msg), `phase 3 names silver counted twice: "${s3.twice.msg}"`);
  holds(!s3.one.ok && /one electrode/.test(s3.one.msg), 'phase 3 refuses one electrode\'s reading');
  holds(!s3.gap2.ok && /twice the gap/.test(s3.gap2.msg), 'phase 3 refuses twice the gap');
  holds(!s3.odd.ok && /iron and 0\.80 V for silver/.test(s3.odd.msg), `phase 3 names both readings otherwise: "${s3.odd.msg}"`);
  holds(run(2, []).notYet, 'phase 3 waits for a number');

  /* ---- phase 4 ---- */
  const cc = C.concentrationCell('zn', 0.010, 1.0);
  near(cc.E, 0.05916, 2e-5, 'zinc concentration cell voltage'); holds(cc.anodeSide === 'A', 'the dilute side (left) is the anode');
  near(Q5.concCellSigned('zn', 0.010, 1.0), 0.05916, 2e-5, 'the voltmeter reads the right bar against the left, positive');
  holds(run(3, [dial('pick', 'value', 1)]).ok, 'phase 4 accepts the left bar');
  const m4 = run(3, [{ run: 'cc' }, dial('pick', 'value', 2)]);
  holds(!m4.ok && /read 0\.059 V/.test(m4.msg) && /swung toward the right bar/.test(m4.msg), `phase 4 refuses the right bar naming the meter: "${m4.msg}"`);
  holds(!run(3, [dial('pick', 'value', 2)]).ok && /not been run/.test(run(3, [dial('pick', 'value', 2)]).msg), 'phase 4 says when the cell has not been run');
  holds(run(3, []).notYet, 'phase 4 waits for the dial');

  /* ---- phase 5 ---- */
  const g5 = C.faradayMass(1.5, 1200, 'zn');
  near(g5, 0.60986, 2e-5, 'zinc plated'); near(C.charge(1.5, 1200), 1800, 1e-9, 'charge');
  near(1800 / 96485.33212, 0.018655, 2e-6, 'moles of electrons');
  const r5 = v => run(4, [typed('g', v)]);
  holds(r5('0.61').ok && r5('0.60').ok && r5('0.62').ok && !r5('0.64').ok && !r5('0.58').ok, 'phase 5 accepts 0.61 g within 0.012 g and refuses copper\'s molar mass');
  const s5 = { min: r5('0.0102'), one: r5('1.22'), cu: r5('0.593'), ag: r5('1.006'), ni: r5('0.548'), coul: r5('1800'), mg: r5('610'), odd: r5('3.5') };
  holds(!s5.min.ok && /20\.0 minutes as 20\.0 s/.test(s5.min.msg), `phase 5 names minutes read as seconds: "${s5.min.msg}"`);
  holds(!s5.one.ok && /Zn²⁺ \+ 2 e⁻ → Zn/.test(s5.one.msg), 'phase 5 names one electron per atom');
  holds(!s5.cu.ok && /63\.5 g\/mol/.test(s5.cu.msg) && !s5.ag.ok && /107\.9 g\/mol/.test(s5.ag.msg) && !s5.ni.ok && /58\.7 g\/mol/.test(s5.ni.msg), 'phase 5 names the wrong molar mass');
  holds(!s5.coul.ok && /coulombs/.test(s5.coul.msg) && !s5.mg.ok && /milligrams/.test(s5.mg.msg), 'phase 5 names a charge and a milligram figure');
  holds(!s5.odd.ok && /Run the bench at 2\.00 A/.test(s5.odd.msg), 'phase 5 asks for a run before it quotes one');
  const m5 = run(4, [{ setDial: { fixture: 'sup', dial: 'cur', value: 2 } }, { setDial: { fixture: 'sup', dial: 'time', value: 2 } }, { run: 'sup' }, typed('g', '3.5')]);
  holds(!m5.ok && /mg of zinc in a 60 s run at 2\.00 A/.test(m5.msg), `phase 5 quotes the bench's own run: "${m5.msg}"`);
  holds(run(4, []).notYet && !r5('-1').ok, 'phase 5 waits for a number and refuses a negative one');

  /* ---- the Clamp's planner ---- */
  const enc = resolveEncounter(B.STAGES[0]);
  const foe = enc.foes[0];
  const pl = E => planFoe(enc, foe, { kind: 'cell', E });
  holds(pl(1.24).pose === 'live' && pl(0).pose === 'flat' && pl(0.0001).pose === 'flat' && pl(-0.3).pose === 'reversed', 'the Clamp stands high on a driven cell, hangs open at zero and lists when pushed back');
  holds(planFoe(enc, foe, { pose: 'live' }).pose === 'live' && planFoe(enc, foe, {}).pose === 'unmoved', 'on a table the Clamp takes the pose it is handed, and rests by default');
  holds(/<svg/.test(portraitSvg('the clamp', 'live')) && /<svg/.test(portraitSvg('the clamp', 'dispersed')), 'the Clamp has a portrait');

  /* ---- the shape of a boss ---- */
  holds(B.STAGES.length === 5 && B.meta.stageCount === 5 && B.SOLUTIONS.length === 5 && B.MISSES.length === 5, 'five phases, five solutions, five misses');
  const words = s => s.trim().split(/\s+/).length;
  B.STAGES.forEach((st, i) => {
    holds(Array.isArray(st.foes) && st.foes.length === 1 && st.encounter?.species === 'the clamp', `phase ${i + 1} names its one foe`);
    holds(!st.field && !st.predict && !(st.table.fetch || []).length, `phase ${i + 1} is no field stage and no prediction`);
    holds(st.hints.length === 3 && st.hints.every(h => !/[!]/.test(h) && (h.match(/[.?]/g) || []).length === 1), `phase ${i + 1} has exactly three one-sentence hints`);
    holds(words(st.prompt) <= 25 && !/!/.test(st.prompt), `phase ${i + 1}'s prompt is ${words(st.prompt)} words`);
    holds(!st.briefing && !st.story, `phase ${i + 1} has no lead line`);
    const r = st.check(B.stateFor(i, B.MISSES[i]));
    holds(!r.ok && !r.notYet && r.msg && r.msg.length > 20, `phase ${i + 1}'s miss is refused with a reason`);
    holds(st.check(B.stateFor(i, B.SOLUTIONS[i])).ok, `phase ${i + 1}'s solution is accepted`);
    const rw = st.reward;
    holds(rw && rw.body && (rw.body.match(/[.!?](\s|$)/g) || []).length <= 3, `phase ${i + 1}'s reward is at most three sentences`);
  });

  /* ---- the foe's corner is clear on every phase ---- */
  const MODEL = await import('../../src/learn/table/model.js');
  const LAYOUT = await import('../../src/learn/table/layout.js');
  const SNAP = await import('../../src/learn/table/snap.js');
  const REG = await import('../../src/learn/table/kits/registry.js');
  B.STAGES.forEach((st, i) => {
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
  const qs = QUEST_STORY['unit10/boss-clamp'];
  holds(Boolean(qs) && qs.scene === 'clamp-open' && qs.beats.length === 5 && /^Filed:/.test(qs.filed), 'the finale has five beats and a Filed line');
  holds(Boolean(CLUES.clue_brinewire_clamp) && EPISODES.unit10.bossId === 'boss-clamp' && EPISODES.unit10.clueId === 'clue_brinewire_clamp' && B.CLUE_ID === 'clue_brinewire_clamp' && B.DEBRIEF.clueAwarded === 'clue_brinewire_clamp', 'the clue is in the Case File and the episode names the boss');
  // The numbers in the beats are the planners'.
  const say = qs.beats.map(b => b.say).join(' ');
  const fmt = C.fmt;
  holds(say.includes(fmt(G.loopCurrent('ag', 'mg'), 2) + ' A') && say.includes(fmt(C.METALS.fe.E0, 2)) && say.includes(fmt(C.METALS.ag.E0, 2)) && say.includes(fmt(B.CHECKS.P3_WANT, 2) + ' V')
    && say.includes(fmt(cc.E, 3) + ' V') && say.includes(fmt(C.charge(1.5, 1200), 0) + ' C') && say.includes(fmt(C.molesElectrons(1800), 4) + ' mol') && say.includes(fmt(g5, 2) + ' g'), 'every figure in the beats is the planners\'');
  holds(say.includes('3 of the other 3') && say.includes('nickel in 2') && say.includes('tin in 1'), 'the dip counts in the first beat are the counted strips');
  const rec = () => new Proxy(function () {}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 10 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : rec()), apply: () => rec(), set: () => true });
  try { for (const t of [0.05, 0.19, 0.3, 0.5, 0.7, 0.9, 1]) paintScene('clamp-open', rec(), 960, 540, t, 0); } catch (e) { no(`the finale scene throws: ${e.message}`); }
  return bad;
}
