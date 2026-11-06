/**
 * brinewire-q3-checks.mjs — hand-worked checks for q3-galvanic (Galvanic Cells). Each expected value below was worked on paper (or in a
 * separate Python calculation), never produced by the code under test:
 *
 *   E°cell = E°(higher) − E°(lower), from the CRC reduction potentials (Zn −0.76, Cu +0.34, Mg −2.37, Ag +0.80, Fe −0.44, Ni −0.26 V):
 *     Zn|Cu 1.10 V;  Cu|Mg 2.71 V;  Ag|Zn 1.56 V;  Fe|Cu 0.78 V;  Ni|Zn 0.50 V
 *   loop current I = E° / 2.2 ohm:  Zn|Cu 0.5000 A;  Cu|Mg 1.2318 A;  Ag|Zn 0.7091 A;  Fe|Cu 0.3545 A;  Ni|Zn 0.2273 A
 *   a cell with nothing carrying ions falls in a straight line to zero at 3 s: Zn|Cu reads 0.500, 0.333, 0.167, 0, 0 ... at 0, 1, 2, 3, 4 s
 *   electrons move toward the cathode: Zn|Cu (Zn left) right;  Cu|Mg left;  Ag|Zn left;  Ni|Zn left
 *   windows after a run (4 electrons): 8 metal ions -> anode 10, cathode 6; strip atoms 6 -> anode 4, cathode 8; 4 bridge anions to the anode
 *     beaker and 4 bridge cations to the cathode one; each beaker's charge is 2 x 10 - 2 x 8 - 4 = 0 and 2 x 6 - 2 x 8 + 4 = 0
 *   mass after one hour, m = I t M / (n F):  Fe|Cu: Fe 1276.36 C -> -0.3694 g, Cu +0.4203 g;  Ni|Zn: Ni +0.2489 g, Zn -0.2772 g
 *     so a 6.00 g and a 7.00 g strip weigh 5.63 g and 7.42 g, and two 6.00 g sealed strips weigh 6.25 g and 5.72 g
 *   the notation: Zn | Zn²⁺ || Cu²⁺ | Cu
 */

import { installUiStub } from './ui-stub.mjs';

export async function checkBrinewireQ3({ ok, fail }) {
  let bad = 0;
  const no = msg => { bad++; fail(`q3-galvanic ${msg}`); };
  const near = (got, want, tol, label) => { if (Math.abs(got - want) <= tol) return; no(`${label}: got ${got}, expected ${want}`); };
  const holds = (cond, label) => { if (!cond) no(label); };

  installUiStub();
  const Q = await import('../../src/learn/quests/unit10/q3-galvanic.js');
  const G = await import('../../src/learn/engine/celldata-galvanic.js');
  const K = await import('../../src/learn/table/kits/cell-galv.js');
  const { QUEST_STORY } = await import('../../src/story/quest-story.js');
  const run = (i, script) => Q.STAGES[i].check(Q.stateFor(i, script));
  const put = (piece, to) => ({ place: { piece, to } });
  const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
  const go = fixture => ({ run: fixture });

  /* ---- the planners behind the stages, against the numbers worked by hand ---- */
  near(G.loopCurrent('zn', 'cu'), 0.5, 1e-9, 'Zn|Cu loop current');
  near(G.loopCurrent('mg', 'cu'), 1.2318, 5e-5, 'Cu|Mg loop current');
  near(G.loopCurrent('ag', 'zn'), 0.7091, 5e-5, 'Ag|Zn loop current');
  near(G.loopCurrent('fe', 'cu'), 0.3545, 5e-5, 'Fe|Cu loop current');
  near(G.loopCurrent('ni', 'zn'), 0.2273, 5e-5, 'Ni|Zn loop current');
  const none = G.currentTrace(0.5, 'none');
  [0.5, 0.333, 0.167, 0, 0].forEach((v, t) => near(none[t].I, v, 1e-9, `wire-only current at ${t} s`));
  holds(G.stopSecond(none) === 3, 'a cell with nothing carrying ions does not stop at 3 s');
  for (const link of ['rod', 'none']) holds(G.stopSecond(G.currentTrace(0.5, link)) === 3, `link ${link} does not stop at 3 s`);
  holds(G.stopSecond(G.currentTrace(0.5, 'bridge')) === null, 'a cell with a bridge stops');
  near(G.currentTrace(0.5, 'bridge')[10].I, 0.5, 1e-9, 'the bridged current at 10 s');
  holds(G.electronsToward('zn', 'cu') === 'right' && G.electronsToward('cu', 'mg') === 'left' && G.electronsToward('ag', 'zn') === 'left' && G.electronsToward('ni', 'zn') === 'left', 'electron directions');
  near(G.signedCurrent('zn', 'cu', 0.5), 0.5, 1e-9, 'a rightward current is positive');
  near(G.signedCurrent('cu', 'mg', 1.2318), -1.2318, 1e-9, 'a leftward current is negative');
  const c = G.windowCounts('zn', 'cu', { ran: true });
  holds(c.left.metal === 10 && c.right.metal === 6 && c.left.atoms === 4 && c.right.atoms === 8, 'window ion and atom counts');
  holds(c.left.anion === 4 && c.right.cation === 4 && c.left.cation === 0 && c.right.anion === 0, 'bridge ions arriving');
  holds(c.left.charge === 0 && c.right.charge === 0, 'each beaker is balanced after a run with a bridge');
  const c0 = G.windowCounts('zn', 'cu', { ran: false });
  holds(c0.left.metal === 8 && c0.right.metal === 8 && c0.left.charge === 0, 'counts before a run');
  const cr = G.windowCounts('cu', 'zn', { ran: true });
  holds(cr.right.metal === 10 && cr.left.metal === 6 && cr.right.anion === 4 && cr.left.cation === 4, 'counts with the anode on the right');
  near(G.stripChange('fe', 'cu', 'fe', 3600), -0.3694, 5e-4, 'Fe strip after an hour');
  near(G.stripChange('fe', 'cu', 'cu', 3600), 0.4203, 5e-4, 'Cu strip after an hour');
  near(G.stripChange('ni', 'zn', 'ni', 3600), 0.2489, 5e-4, 'Ni strip after an hour');
  near(G.stripChange('ni', 'zn', 'zn', 3600), -0.2772, 5e-4, 'Zn strip after an hour');
  near(G.stripMass(6, G.stripChange('fe', 'cu', 'fe', 3600)), 5.63, 1e-9, 'Fe strip mass');
  near(G.stripMass(7, G.stripChange('fe', 'cu', 'cu', 3600)), 7.42, 1e-9, 'Cu strip mass');
  holds(G.notationText('zn', 'cu') === 'Zn | Zn²⁺ || Cu²⁺ | Cu', 'the notation');
  ok('q3-galvanic planners: every current, trace, direction, count, mass and the notation agrees with the values worked by hand');

  /* ---- the rig: its run writes the planner's trace, the needle and the strips ---- */
  const t2 = Q.stateFor(1, [go('rig')]).table;
  const r2 = K.galvRead(t2, 'rig');
  holds(r2.runs === 1 && r2.stop === 3 && r2.trace.length === 11, 'a run with nothing between the beakers is not the 11-point trace that stops at 3 s');
  near(r2.I, 0, 1e-9, 'the needle rests at the end of a run that stopped');
  const tt = Q.stateFor(1, [put('tube', 'slot:rig.link'), go('rig')]).table;
  const rt = K.galvRead(tt, 'rig');
  holds(rt.stop === null && rt.link === 'bridge', 'the salt tube does not keep the current');
  near(rt.I, 0.5, 1e-9, 'the needle leans right at 0.50 A with the salt tube');
  const tr = Q.stateFor(1, [put('rod', 'slot:rig.link'), go('rig')]).table;
  holds(K.galvRead(tr, 'rig').stop === 3, 'a glass rod keeps the current');
  const tw = Q.stateFor(1, [put('wire', 'slot:rig.wire'), go('rig')]).table;
  holds(K.galvRead(tw, 'rig').stop === 3 && K.galvRead(tw, 'rig').w2, 'a second wire keeps the current');
  const t3 = Q.stateFor(2, [go('rb')]).table;
  near(K.galvRead(t3, 'rb').I, -1.2318, 5e-4, 'Cell B needle');
  const t6 = Q.stateFor(5, [put('fe', 'slot:bal.pan'), put('fe', 'slot:rig.L'), put('cu', 'slot:rig.R'), go('rig'), put('fe', 'slot:bal.pan')]).table;
  holds(t6.pieces.fe.props.dm < -0.36 && t6.pieces.fe.props.dm > -0.38, 'the Fe strip does not lose 0.37 g in the cell');
  holds(!Q.stateFor(5, [put('fe', 'slot:rig.R'), put('cu', 'slot:rig.L'), go('rig')]).table.pieces.fe.props.dm, 'swapped strips are run');
  holds(K.weighed(t6, 'bal', 'Fe strip').count === 2, 'the balance does not keep the Fe strip\'s two readings');
  ok('q3-galvanic rig: the run writes the planner\'s trace, the needle, the strips\' masses and the balance\'s list');

  /* ---- grading: right answers pass, every slip is refused with a reading ---- */
  holds(run(1, [put('tube', 'slot:rig.link'), go('rig')]).ok, 'stage 2 refuses the salt tube');
  for (const [script, want] of [[[go('rig')], 'zero at 3 s'], [[put('rod', 'slot:rig.link'), go('rig')], 'glass rod'], [[put('wire', 'slot:rig.wire'), go('rig')], 'second wire']]) {
    const r = run(1, script);
    holds(!r.ok && r.msg && r.msg.includes(want), `stage 2 refusal does not name "${want}" (${r.msg})`);
  }
  holds(run(1, []).notYet, 'stage 2 does not wait for a run');
  const s3 = (a, b, c3) => [go('ra'), go('rb'), go('rc'), dial('ra', 'says', a), dial('rb', 'says', b), dial('rc', 'says', c3)];
  holds(run(2, s3(2, 1, 1)).ok, 'stage 3 refuses the right sides');
  holds(!run(2, s3(1, 1, 1)).ok && run(2, s3(1, 1, 1)).msg.includes('Cell A'), 'stage 3 wrong side is not refused naming Cell A');
  holds(!run(2, s3(2, 2, 1)).ok && /swung to the left/.test(run(2, s3(2, 2, 1)).msg), 'stage 3 refusal does not name the needle');
  holds(run(2, [go('ra'), dial('ra', 'says', 2)]).notYet, 'stage 3 accepts unset cells');
  const m4 = (a, b) => [go('rig'), { setDial: { fixture: 'scene', dial: 'm0', value: a === 'leave' ? 1 : 2 } }, { setDial: { fixture: 'scene', dial: 'm1', value: b === 'leave' ? 1 : 2 } }];
  holds(run(3, m4('leave', 'join')).ok && !run(3, m4('join', 'leave')).ok, 'stage 4 grading');
  holds(/10 Zn²⁺ ions.*8.*4 atoms.*6/.test(run(3, m4('join', 'leave')).msg), `stage 4 refusal does not name the counts (${run(3, m4('join', 'leave')).msg})`);
  holds(run(4, [go('rig'), dial('pick', 'value', 1)]).ok && !run(4, [go('rig'), dial('pick', 'value', 2)]).ok, 'stage 5 grading');
  holds(/Zn²⁺ count rose from 8 to 10 in the right beaker/.test(run(4, [go('rig'), dial('pick', 'value', 2)]).msg), 'stage 5 refusal does not name the count');
  const w = [put('fe', 'slot:bal.pan'), put('fe', 'slot:rig.L'), put('cu', 'slot:bal.pan'), put('cu', 'slot:rig.R'), go('rig'), put('fe', 'slot:bal.pan')];
  holds(run(5, [...w, dial('pick', 'value', 2)]).ok && !run(5, [...w, dial('pick', 'value', 1)]).ok, 'stage 6 grading');
  holds(/read 6\.00 g and then 5\.63 g/.test(run(5, [...w, dial('pick', 'value', 1)]).msg), 'stage 6 refusal does not name the two readings');
  holds(/has not been weighed/.test(run(5, [dial('pick', 'value', 1)]).msg), 'stage 6 refusal for an unweighed strip');
  const chips = ['k0', 'k1', 'k2', 'k3', 'k4', 'k5', 'k6'];
  holds(run(6, chips.map((id, i) => put(id, `rail:${i}`))).ok, 'stage 7 refuses the shorthand');
  holds(run(6, chips.map((id, i) => put(id, `rail:${i}`)).concat([])).ok && run(6, ['k0', 'k5', 'k2', 'k3', 'k4', 'k1', 'k6'].map((id, i) => put(id, `rail:${i}`))).ok, 'stage 7 does not treat the two single bars alike');
  holds(!run(6, [...chips].reverse().map((id, i) => put(id, `rail:${i}`))).ok, 'stage 7 accepts the shorthand written backwards');
  const f8 = [put('sa', 'slot:bal.pan'), put('sb', 'slot:bal.pan'), put('sa', 'slot:rig.L'), put('sb', 'slot:rig.R'), go('rig'), put('sa', 'slot:bal.pan'), put('sb', 'slot:bal.pan')];
  holds(run(7, [...f8, put('ansB', 'slot:ans')]).ok && !run(7, [...f8, put('ansA', 'slot:ans')]).ok, 'stage 8 grading');
  holds(/swung to the left.*Strip B read 6\.00 g and then 5\.72 g/.test(run(7, [...f8, put('ansA', 'slot:ans')]).msg), `stage 8 refusal does not name the needle and the masses (${run(7, [...f8, put('ansA', 'slot:ans')]).msg})`);
  ok('q3-galvanic grading: right answers pass, every slip is refused with a reading');

  /* ---- no refusal carries the rule its stage asks for ---- */
  const rule = /\banode\b[^.]*\b(loses|gives)|negative ions (move|go) toward|salt tube keeps|electrons (move|go) toward the (cathode|anode)|oxidation happens/i;
  const allMsgs = [];
  Q.MISSES.forEach((m, i) => { const r = run(i, m); if (r.msg) allMsgs.push(r.msg); });
  for (const m of allMsgs) holds(!rule.test(m), `a refusal carries the rule: "${m}"`);
  ok('q3-galvanic refusals: none carries the rule its stage asks for');

  /* ---- the story's numbers are the planner's ---- */
  const story = JSON.stringify(QUEST_STORY['unit10/q3-galvanic'].beats);
  for (const n of ['0.50 A', '3 s', '10 s', 'Zn²⁺ rose from 8 to 10', 'Cu²⁺ fell from 8 to 6', '4 electrons', '4 negative ions', '4 positive ions', '0.37 g', '0.42 g']) holds(story.includes(n), `story is missing ${n}`);
  ok('q3-galvanic story: every number Vess quotes is a planner figure');

  if (!bad) ok('Brinewire q3-galvanic: every current, trace, direction, count, mass, slip, refusal and story number agrees with the values worked by hand');
  return bad;
}
