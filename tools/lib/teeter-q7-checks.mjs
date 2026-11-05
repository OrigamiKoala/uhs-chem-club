/**
 * Checks for Teeter's bench 7 (`q7-dissolve`, solubility equilibria). Every expected value below was worked on paper from the stated route
 * (never produced by the code under test); the tolerance is the rounding of the hand figure.
 *
 * Hand work (Ksp at 25 °C, ideal solution):
 *   CaF2     Ksp = 4 s^3 = 3.9e-11        -> s^3 = 9.75e-12  -> s = 2.136e-4 (2.136^3 = 9.746)
 *   Ag2CrO4  Ksp = 4 s^3 = 1.1e-12        -> s^3 = 2.75e-13  -> s = 6.50e-5  (6.5^3 = 274.6)
 *   AgCl     Ksp = s^2 = 1.8e-10          -> s = 1.342e-5
 *   BaSO4    Ksp = s^2 = 1.1e-10          -> s = 1.049e-5 ; in 0.10 mol/L sulfate s ~ 1.1e-10 / 0.10 = 1.1e-9
 *   AgCl     in 0.10 mol/L Cl-            -> s ~ 1.8e-10 / 0.10 = 1.8e-9
 *   PbI2     4 s^3 = 9.8e-9 -> s = 1.348e-3 ; in 0.10 mol/L I-: s (0.10)^2 ~ 9.8e-9 -> s = 9.8e-7
 *   Mixtures of Pb2+ and I- (mol/L):  Q = [Pb][I]^2
 *     Mix 1  5.0e-3, 1.0e-3 -> 5.0e-3 * 1.0e-6 = 5.0e-9   (below 9.8e-9)
 *     Mix 2  2.0e-3, 4.0e-3 -> 2.0e-3 * 1.6e-5 = 3.2e-8   (above)
 *     Mix 3  1.0e-3, 3.0e-3 -> 1.0e-3 * 9.0e-6 = 9.0e-9   (below)
 *   Mix 2 is a 1:2 mixture, so with p the mol/L that comes out, (2e-3 - p)(4e-3 - 2p)^2 = 4 (2e-3 - p)^3 = 9.8e-9 -> 2e-3 - p = 1.348e-3 -> p = 6.52e-4.
 *   Added ion 0.10 mol/L: AgCl 1.342e-5 -> 1.8e-9 (a factor of 7.46e3); PbI2 1.348e-3 -> 9.8e-7 (a factor of 1.38e3).
 */

export async function checkTeeterQ7(ok, bad) {
  const near = (got, want, rel, label) => {
    if (Math.abs(got - want) <= rel * Math.abs(want)) ok(`q7 ${label}: ${got.toPrecision(4)} ≈ ${want}`);
    else bad(`q7 ${label}: got ${got}, expected ${want}`);
  };
  const is = (cond, label) => (cond ? ok(`q7 ${label}`) : bad(`q7 ${label}`));

  const E = await import('../../src/learn/engine/eqdata.js');
  const { KSP, dissolveCap, dissolveState, settleMixture, molarSolubility } = E;

  // The planners against the hand values.
  near(molarSolubility(KSP.CaF2.ksp, KSP.CaF2.ions), 2.136e-4, 2e-3, 'CaF2 molar solubility');
  near(dissolveCap(KSP.Ag2CrO4.ksp, KSP.Ag2CrO4.ions), 6.50e-5, 3e-3, 'Ag2CrO4 cap in water');
  near(dissolveCap(KSP.BaSO4.ksp, KSP.BaSO4.ions, 0, 0.10), 1.1e-9, 1e-3, 'BaSO4 in 0.10 mol/L sulfate');
  near(dissolveCap(KSP.AgCl.ksp, KSP.AgCl.ions, 0, 0.10), 1.8e-9, 1e-3, 'AgCl in 0.10 mol/L chloride');
  near(dissolveCap(KSP.PbI2.ksp, KSP.PbI2.ions, 0, 0.10), 9.8e-7, 1e-3, 'PbI2 in 0.10 mol/L iodide');
  is(dissolveCap(KSP.AgCl.ksp, KSP.AgCl.ions, 1e-4, 1e-4) === 0, 'ions already past Ksp leave room for nothing (Q = 1e-8 > 1.8e-10)');
  // A cation and an anion both present: [Ag+] = 1.0e-6, so s (1.0e-6 + s)... for [Cl-] = 1.0e-6 -> s^2 + 2e-6 s - 1.8e-10 + 1e-12 = 0 -> s = 1.0e-6*(-1 + sqrt(1 + 179))... hand: sqrt(1+179)=13.416 -> s = 1.2416e-5
  near(dissolveCap(KSP.AgCl.ksp, KSP.AgCl.ions, 1e-6, 1e-6), 1.2416e-5, 2e-3, 'AgCl with 1e-6 of each ion already there');

  // A beaker below its limit holds everything dissolved; above it, the limit and a floor of solid.
  const under = dissolveState(KSP.AgCl.ksp, KSP.AgCl.ions, 5e-6);
  is(under.solid === 0 && Math.abs(under.cat - 5e-6) < 1e-15 && !under.saturated, 'below the limit all of the salt is dissolved');
  const over = dissolveState(KSP.AgCl.ksp, KSP.AgCl.ions, 5e-5);
  near(over.dissolved, 1.342e-5, 2e-3, 'above the limit the beaker holds the limit');
  near(over.solid, 5e-5 - 1.342e-5, 2e-3, 'the rest lies on the floor');
  near(over.Q, 1.8e-10, 1e-6, 'a saturated beaker has Q = Ksp');

  // The scoops of stage 1: 0.2857, 0.5714, 0.857, then the limit, then the limit again.
  const s0 = molarSolubility(KSP.CaF2.ksp, KSP.CaF2.ions);
  const scoop = k => dissolveState(KSP.CaF2.ksp, KSP.CaF2.ions, (k / 3.5) * s0).dissolved / s0;
  near(scoop(1), 1 / 3.5, 1e-9, 'scoop 1');
  near(scoop(3), 3 / 3.5, 1e-9, 'scoop 3');
  is(Math.abs(scoop(4) - 1) < 1e-9 && scoop(4) === scoop(5), 'scoops 4 and 5 hold the limit');

  // Mixtures.
  const Q = (c, a) => E.ionProduct([1, 2], c, a);
  near(Q(5.0e-3, 1.0e-3), 5.0e-9, 1e-9, 'Mix 1 Q');
  near(Q(2.0e-3, 4.0e-3), 3.2e-8, 1e-9, 'Mix 2 Q');
  near(Q(1.0e-3, 3.0e-3), 9.0e-9, 1e-9, 'Mix 3 Q');
  const m = [[5.0e-3, 1.0e-3], [2.0e-3, 4.0e-3], [1.0e-3, 3.0e-3]].map(([c, a]) => settleMixture(KSP.PbI2.ksp, KSP.PbI2.ions, c, a));
  is(!m[0].forms && m[1].forms && !m[2].forms, 'only Mix 2 forms a precipitate');
  near(m[1].precipitate, 6.52e-4, 3e-3, 'Mix 2 precipitate');
  is(m[0].precipitate === 0 && m[2].precipitate === 0, 'a mixture below Ksp precipitates nothing');

  // The bench itself.
  const Q7 = await import('../../src/learn/quests/unit08/q7-dissolve.js');
  const K = await import('../../src/learn/table/kits/pans-beaker.js');
  const { stateFromScript } = await import('../../src/learn/engine/stagerunner.js');
  const stage = i => Q7.STAGES[i];
  const run = (i, script) => stateFromScript(stage(i), script);
  const verdict = (i, script) => stage(i).check(run(i, script));
  const rejects = (i, script, label) => {
    const v = verdict(i, script);
    if (!v.ok && v.msg) ok(`q7 stage ${i + 1} refuses ${label}: "${v.msg}"`); else bad(`q7 stage ${i + 1} should refuse ${label}`);
  };
  const accepts = (i, script, label) => (verdict(i, script).ok ? ok(`q7 stage ${i + 1} accepts ${label}`) : bad(`q7 stage ${i + 1} should accept ${label}: ${verdict(i, script).msg}`));
  const type = v => [{ type: { entry: 's', value: v } }];
  const form = (a, b, c) => [{ setDial: { fixture: 'form', dial: 'e1', value: a } }, { setDial: { fixture: 'form', dial: 'e2', value: b } }, { setDial: { fixture: 'form', dial: 'e3', value: c } }];
  const runs = k => Array.from({ length: k }, () => ({ run: 'jar' }));

  // Stage 1: scoops.
  is(verdict(0, []).notYet === true, 'stage 1 waits on an empty beaker');
  for (const k of [1, 2, 3, 4]) rejects(0, runs(k), `${k} scoop${k > 1 ? 's' : ''} (the last one still moved a meter)`);
  accepts(0, runs(5), 'five scoops (the fifth changed nothing)');
  accepts(0, runs(7), 'seven scoops');
  const r4 = verdict(0, runs(4)).msg;
  is(/\[Ca²⁺\].*8\.[0-9]e−5.*to 2\.[0-9]e−4|from 1\.8e−4 to 2\.1e−4/.test(r4) || /from .* to 2\.1e−4/.test(r4), 'stage 1 names the meter reading the last scoop moved');

  // Stage 2: the expression for Ag2CrO4 is [Ag+]^2 [CrO4 2-]^1 with the solid left out.
  accepts(1, form(2, 1, 0), 'Ag⁺ squared, CrO₄²⁻ once, solid out');
  rejects(1, form(1, 1, 0), 'Ag⁺ to the power 1');
  rejects(1, form(2, 2, 0), 'CrO₄²⁻ to the power 2');
  rejects(1, form(2, 1, 1), 'the solid left in');
  rejects(1, form(1, 1, 1), 'the opening form');
  rejects(1, form(0, 1, 0), 'Ag⁺ left out');
  const f = run(1, form(2, 1, 0)).table;
  is(K.formExpression(f, 'form').text === 'K = [Ag⁺]² [CrO₄²−]', 'the form prints the expression its dials make');

  // Stage 3: AgCl, s = 1.342e-5; accepted within 5 %.
  is(verdict(2, []).notYet === true, 'stage 3 waits on an empty field');
  for (const v of ['1.3e-5', '1.34e-5', '1.4e-5', '1.3e−5', '0.000013']) accepts(2, type(v), `${v}`);
  for (const [v, why] of [['1.8e-10', 'the Ksp itself (forgot the square root)'], ['9e-11', 'half the Ksp'], ['1.0e-5', 'the picture beaker\'s figure copied'], ['3.6e-10', 'twice the Ksp'], ['1.5e-5', 'a figure 12 % high'], ['0.00001', 'a decimal for the picture\'s figure'], ['1.3e5', 'the wrong sign of the exponent'], ['-1.3e-5', 'a negative figure']]) {
    if (v === '-1.3e-5') { is(verdict(2, type(v)).notYet === true || !verdict(2, type(v)).ok, 'stage 3 does not accept a negative figure'); continue; }
    rejects(2, type(v), why);
  }
  const m3 = verdict(2, type('1.8e-10')).msg;
  is(!/1\.3e|1\.34e/.test(m3) && !/1\.3e|1\.34e/.test(verdict(2, type('1.0e-5')).msg), 'stage 3 refusals do not carry the answer');

  // Stage 4: a card in the slot.
  is(verdict(3, []).notYet === true, 'stage 4 (predict) waits for a card');
  accepts(3, [{ place: { piece: 'agcl', to: 'slot:guess' } }], 'any card in the slot');

  // Stage 5: the click. Ag2CrO4 has the smaller Ksp and the larger molar solubility; both beakers hold the same total.
  const t5 = run(4, []).table;
  const a5 = K.beakerRead(t5, 'agcl'); const b5 = K.beakerRead(t5, 'ag2');
  near(a5.dissolved, 1.342e-5, 2e-3, 'stage 5 AgCl beaker');
  near(b5.dissolved, 6.50e-5, 3e-3, 'stage 5 Ag2CrO4 beaker');
  is(KSP.Ag2CrO4.ksp < KSP.AgCl.ksp && b5.dissolved > a5.dissolved, 'stage 5: the smaller Ksp is the larger solubility');
  is(b5.cat > a5.cat && Math.abs(b5.an - b5.dissolved) < 1e-12 && Math.abs(a5.cat - a5.dissolved) < 1e-12, 'stage 5: Ag2CrO4\'s Ag⁺ meter reads high (two Ag⁺ a unit) while its CrO₄²⁻ meter equals what is dissolved');
  is(b5.solid > 0 && a5.solid > 0, 'stage 5: both beakers have solid on the floor');
  accepts(4, [{ setDial: { fixture: 'pick', dial: 'value', value: 2 } }], 'Ag₂CrO₄');
  rejects(4, [{ setDial: { fixture: 'pick', dial: 'value', value: 1 } }], 'AgCl (the ranking by Ksp)');
  rejects(4, [{ setDial: { fixture: 'pick', dial: 'value', value: 3 } }], 'the same');

  // Stage 6: BaSO4 in water and in 0.10 mol/L sulfate.
  const t6 = run(5, []).table;
  const w1 = K.beakerRead(t6, 'b1'); const w2 = K.beakerRead(t6, 'b2');
  near(w1.dissolved, 1.049e-5, 2e-3, 'stage 6 beaker 1');
  near(w2.dissolved, 1.1e-9, 1e-3, 'stage 6 beaker 2');
  near(w2.an, 0.10, 1e-3, 'stage 6 beaker 2 sulfate meter');
  is(w2.solid > w1.solid, 'stage 6: more solid lies on the floor of the sulfate beaker');
  accepts(5, [{ setDial: { fixture: 'pick', dial: 'value', value: 1 } }], 'Beaker 1');
  rejects(5, [{ setDial: { fixture: 'pick', dial: 'value', value: 2 } }], 'Beaker 2');

  // Stage 7: three mixtures.
  const t7 = run(6, []).table;
  const q7 = [1, 2, 3].map(i => K.beakerRead(t7, `m${i}`));
  near(q7[0].Q, 5.0e-9, 1e-6, 'stage 7 Mix 1 gauge');
  near(q7[1].Q, 3.2e-8, 1e-6, 'stage 7 Mix 2 gauge');
  near(q7[2].Q, 9.0e-9, 1e-6, 'stage 7 Mix 3 gauge');
  is(q7.every(r => r.solid === 0), 'stage 7: no mixture starts with solid');
  accepts(6, [{ setDial: { fixture: 'pick', dial: 'value', value: 2 } }], 'Mix 2');
  rejects(6, [{ setDial: { fixture: 'pick', dial: 'value', value: 1 } }], 'Mix 1 (the biggest [Pb²⁺])');
  rejects(6, [{ setDial: { fixture: 'pick', dial: 'value', value: 3 } }], 'Mix 3 (just under Ksp)');

  // Stage 8: the same added ion, two salts. The dial lists are 'none', 0.01 and 0.10 mol/L.
  const set8 = v => [{ setDial: { fixture: 'agcl', dial: 'c', value: 3 } }, { setDial: { fixture: 'pbi2', dial: 'c', value: 3 } }, { setDial: { fixture: 'pick', dial: 'value', value: v } }];
  const t8 = run(7, set8(1)).table;
  const a8 = K.beakerRead(t8, 'agcl'); const p8 = K.beakerRead(t8, 'pbi2');
  near(a8.dissolved, 1.8e-9, 1e-3, 'stage 8 AgCl with 0.10 mol/L chloride');
  near(p8.dissolved, 9.8e-7, 1e-3, 'stage 8 PbI2 with 0.10 mol/L iodide');
  near(a8.s0 / a8.dissolved, 7.46e3, 5e-3, 'stage 8 AgCl factor');
  near(p8.s0 / p8.dissolved, 1.376e3, 5e-3, 'stage 8 PbI2 factor');
  is(a8.s0 / a8.dissolved > p8.s0 / p8.dissolved, 'stage 8: AgCl falls by the larger factor');
  accepts(7, set8(1), 'AgCl');
  rejects(7, set8(2), 'PbI₂ (the larger solubility)');
  rejects(7, set8(3), 'the same');

  // Every scripted solution passes its own check and every scripted miss is refused, with a reason.
  Q7.STAGES.forEach((st, i) => {
    const sol = st.check(stateFromScript(st, Q7.SOLUTIONS[i]));
    if (sol.ok) ok(`q7 stage ${i + 1} solution passes`); else bad(`q7 stage ${i + 1} solution fails: ${sol.msg}`);
    if (Q7.MISSES[i].length) {
      const miss = st.check(stateFromScript(st, Q7.MISSES[i]));
      if (!miss.ok && miss.msg && !miss.notYet) ok(`q7 stage ${i + 1} miss refused`); else bad(`q7 stage ${i + 1} miss not refused with a reason`);
    }
  });

  // Printing: a true minus, one decimal, half-up.
  const sci = K.sci;
  is(sci(1.8e-10) === '1.8e−10' && sci(1.0488e-5) === '1.0e−5' && sci(9.95e-6) === '1.0e−5' && sci(0) === '0' && sci(2.5e-3) === '2.5e−3', 'sci prints a true minus and rounds half up');
  is(K.dissolveEquation('Ag2CrO4') === 'Ag₂CrO₄(s) ⇌ 2 Ag⁺ + CrO₄²−' && K.dissolveEquation('PbI2') === 'PbI₂(s) ⇌ Pb²⁺ + 2 I−', 'the beaker prints the dissolving equation of its salt');
}
