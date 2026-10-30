/**
 * q7-separate — held to hand-worked values and the CRC. The strip is a simulation, so its figures are held to the design values written
 * here (and to the one thing a polarity model must do: reverse the order when the solvent changes); the still to the CRC boiling points;
 * the boiling flask to dT = i Kb m with Kb(water) = 0.512 worked by hand; the plan board to a list worked by hand.
 */

/** Refusals may not carry the rule a stage is asking for (1-based stages). */
export const LEAKS = {
  2: [/\bdissolved\b/i, /\bpores?\b/i, /\bsmaller\b/i, /\bparticles?\b/i, /\btoo big\b/i],
  3: [/\bdivide/i, /\bRf\b/, /\bretention\b/i],
  4: [/\bnonpolar\b/i, /\bpolar\b/i, /\bpolarity\b/i],
  5: [/\bboiling point/i, /\bweaker\b/i, /\bgrip\b/i, /\blowest\b/i],
  6: [/\bparticles?\b/i, /\bions?\b/i, /\bmolal/i, /\bformula unit\b/i, /\bper kilogram\b/i],
  7: [/\bfilter first\b/i, /\bbefore\b/i, /\bdissolve/i, /\border\b/i]
};

export async function check({ q, mod, MD, near, same, holds, start, done }) {
  const S = await import('../../../src/learn/engine/matterdata-strip.js');

  /* ---- the strip: design values (two decimals), and the reversal a polarity model must show ---- */
  const RF = { water: [0.26, 0.51, 0.74], mix: [0.74, 0.89, 0.39], hexane: [0.95, 0.56, 0.09] }; // yellow, red, blue
  for (const [sol, vals] of Object.entries(RF)) ['yellow', 'red', 'blue'].forEach((d, i) => near(S.rfOf(d, sol), vals[i], 0.011, `${q}: Rf of ${d} in ${sol}`));
  same(mod.CHECKS.WATER_ORDER.join(), 'yellow,red,blue', `${q} stage 4 (the order in water)`);
  same(mod.CHECKS.HEXANE_ORDER.join(), 'blue,red,yellow', `${q} stage 4 (the rank in hexane and acetone)`);
  holds(mod.CHECKS.WATER_ORDER.join() === [...mod.CHECKS.HEXANE_ORDER].reverse().join(), `${q} stage 4: the order does not turn round between the two liquids`);
  near(mod.CHECKS.RF_RED, 0.51, 0.006, `${q} stage 3 (Rf of red in water)`);
  near(S.spotCm('red', 'water') / S.FRONT_CM, mod.CHECKS.RF_RED, 0.006, `${q} stage 3 (a spot's reading on the ruler gives its Rf)`);
  holds(S.FRONT_CM === 10, `${q} stage 3: the friendly front is 10 cm`);

  /* ---- the filter ---- */
  const WANT = { sand: 'filter', sawdust: 'filter', salt: 'boil', dye: 'boil' };
  for (const [m, w] of Object.entries(WANT)) same(S.methodFor(m), w, `${q} stage 2 (${m})`);
  holds(S.MIXTURES.salt.sizeUm < S.PAPER_PORE_UM / 1000 && S.MIXTURES.sand.sizeUm > S.PAPER_PORE_UM, `${q} stage 2: a salt must be far smaller than the pore, sand far larger`);
  same(S.pourThrough('salt').dried, 'crust', `${q} stage 2 (the dried drop of salty water)`);
  same(S.pourThrough('sand').dried, 'clean', `${q} stage 2 (the dried drop of sandy water)`);

  /* ---- the still: CRC boiling points, 56.1 < 78.4 < 100 ---- */
  const BP = { acetone: 56.1, ethanol: 78.4, H2O: 100 };
  for (const id of Object.keys(BP)) near(MD.SUBSTANCES[id].bp, BP[id], 0.05, `${q}: boiling point of ${id}`);
  same(mod.CHECKS.STILL_ORDER.join(), Object.keys(BP).sort((a, b) => BP[a] - BP[b]).join(), `${q} stage 5 (the rank)`);
  const cuts = S.stillCuts();
  holds(cuts.length === 3 && cuts.every(c => Math.abs(c.shares.reduce((a, b) => a + b, 0) - 1) < 1e-9 && c.cells.reduce((a, b) => a + b, 0) === 10), `${q} stage 5: a cut's shares or cells do not add up`);
  holds(cuts[0].T < cuts[1].T && cuts[1].T < cuts[2].T, `${q} stage 5: the top of the column does not warm cut by cut`);
  holds(cuts[0].T > BP.acetone - 1 && cuts[0].T < BP.ethanol && cuts[2].T < BP.H2O + 0.01 && cuts[2].T > BP.ethanol, `${q} stage 5: a cut's temperature is outside the boiling points of the liquids`);
  holds(cuts[0].shares[0] > 0.6 && cuts[2].shares[2] > 0.7 && cuts[1].shares[1] > cuts[1].shares[0] && cuts[1].shares[1] > cuts[1].shares[2], `${q} stage 5: the cuts do not enrich acetone, ethanol and water in turn`);
  holds(Math.max(...cuts.flatMap(c => c.shares)) < 0.97, `${q} stage 5: a cut is pure, which this simple still cannot give`);

  /* ---- the boiling flask: dT = i Kb m, worked by hand (Kb = 0.512 C kg/mol) ---- */
  near(mod.CHECKS.KB_WATER, 0.512, 1e-9, `${q} stage 6 (Kb)`);
  near(S.boilingRise('sugar', 1), 0.512, 1e-9, `${q} stage 6 (1.00 mol sugar in 1.00 kg)`);
  near(S.boilingRise('NaCl', 1), 1.024, 1e-9, `${q} stage 6 (1.00 mol NaCl in 1.00 kg)`);
  near(mod.CHECKS.RISE_ANSWER, 3 * 0.512 * (3 / 2), 1e-9, `${q} stage 6 (3.00 mol CaCl2 in 2.00 kg: 3 x 0.512 x 1.5 = 2.304)`);
  holds(mod.CHECKS.RISE_ANSWER > 2.25 && mod.CHECKS.RISE_ANSWER < 2.35, `${q} stage 6: the typed figure is not 2.30`);

  /* ---- the plan board, lists worked by hand ---- */
  const P = S.planSeparation;
  holds(P(['filter', 'boil']).separated, `${q} stage 7: filter then boil must leave each part alone`);
  holds(!P(['boil', 'filter']).separated && P(['boil', 'filter']).flask.join() === 'sand,salt', `${q} stage 7: boil then filter leaves sand and salt together in the flask`);
  holds(!P(['filter']).separated && P(['filter']).flask.join() === 'salt,water', `${q} stage 7: filter alone leaves salt and water together`);
  holds(!P(['boil']).separated && !P(['strip']).separated && P(['strip']).moved[0] === false, `${q} stage 7: a strip moves nothing here`);
  holds(P(['strip', 'filter', 'boil']).separated && P(['strip', 'filter', 'boil']).moved[0] === false, `${q} stage 7: a wasted step is visible`);

  /* ---- the predict stage shows no instrument; no untouched table passes; every solution passes; every miss is refused ---- */
  holds(!Object.keys(start(mod, 0).fixtures).length, `${q} stage 1: the predict stage shows an instrument`);
  for (let i = 1; i < 7; i++) holds(mod.STAGES[i].check(mod.stateFor(i, {})).ok !== true, `${q} stage ${i + 1}: the untouched table passes`);
  for (let i = 1; i < 7; i++) {
    const r = mod.STAGES[i].check(mod.stateFor(i, mod.SOLUTIONS[i]));
    holds(r.ok === true, `${q} stage ${i + 1}: the solution is refused (${r.msg})`);
    const m = mod.STAGES[i].check(mod.stateFor(i, mod.MISSES[i]));
    holds(m.ok !== true && m.msg, `${q} stage ${i + 1}: the miss passes or has no reason`);
  }

  /* ---- typed slips are refused, the right figure in either form passes ---- */
  const typedCheck = (i, id, v) => { const st = mod.stateFor(i, mod.SOLUTIONS[i]); st.table.entries = { ...st.table.entries, [id]: String(v) }; return mod.STAGES[i].check(st); };
  for (const v of ['5.1', '1.96', '0.2', '0.8']) holds(typedCheck(2, 'rf', v).ok !== true, `${q} stage 3: ${v} passes`);
  for (const v of ['0.51', '0.5', '0.52', '.5']) holds(typedCheck(2, 'rf', v).ok === true, `${q} stage 3: ${v} is refused`);
  for (const v of ['1.54', '0.77', '4.61', '3.07', '1.02']) holds(typedCheck(5, 'rise', v).ok !== true, `${q} stage 6: ${v} passes`);
  for (const v of ['2.30', '2.3', '2.304', '2,3']) holds(typedCheck(5, 'rise', v).ok === true, `${q} stage 6: ${v} is refused`);

  /* ---- the evidence is really on the bench after the solution ---- */
  const s2 = mod.stateFor(1, mod.SOLUTIONS[1]).table;
  holds(['sand', 'sawdust', 'salt', 'dye'].every(m => s2.pieces[m].props.poured), `${q} stage 2: a mixture was filed without a pour on the table`);
  const s3 = mod.stateFor(2, mod.SOLUTIONS[2]).table;
  holds(s3.pieces.ink.props.ran?.water === 10, `${q} stage 3: the ink has not run`);
  const s4 = mod.stateFor(3, mod.SOLUTIONS[3]).table;
  holds(s4.pieces.ink.props.ran?.hexane === 10 && s4.pieces.ink.props.ran?.water === 10, `${q} stage 4: both runs are not on the strip`);
  const s5 = mod.stateFor(4, mod.SOLUTIONS[4]).table;
  holds(Math.round(s5.fixtures.still.dials.cuts.value) === 3, `${q} stage 5: the receiver is not full`);
  const s6 = mod.stateFor(5, mod.SOLUTIONS[5]).table;
  holds(s6.pieces.cacl2.props.boiled && Object.keys(s6.pieces.cacl2.props.boiled).length === 2, `${q} stage 6: the readings are not on the card`);
  void done;
}
