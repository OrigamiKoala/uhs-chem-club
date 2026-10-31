/**
 * kettle-boss-golem-checks.mjs — the Recipe Golem's phases 4 and 5 (the pot), held to values worked on paper.
 *
 * Phase 4: Fe2O3 + 2 Al -> Al2O3 + 2 Fe with 79.8 g ore (0.500 mol) and 10.8 g aluminium (0.400 mol): aluminium runs out (0.400 / 2 = 0.200 < 0.500),
 *   0.400 mol of iron = 22.32 g is possible; the furnace keeps 80 %: 17.856 g, which the balance shows as 17.9; 17.9 / 22.32 = 80.2 %.
 * Phase 5: 79.8 g of ore makes 55.8 g of iron (0.500 mol -> 1.00 mol); the ledger's 39.9 t is half of that ore: 27.9 t is the most iron, not 50.0.
 */

export async function check({ near }) {
  const bad = [];
  const g = await import('../../src/learn/quests/unit07/boss-golem.js');
  const K = await import('../../src/learn/table/kits/pot.js');
  const C = g.CHECKS;
  if (!near(C.POSSIBLE_FE, 22.32, 0.01)) bad.push(`phase 4: the iron the limit allows is ${C.POSSIBLE_FE}, worked by hand 22.32`);
  if (!near(C.GOLEM_PCT, 80.2, 0.1)) bad.push(`phase 4: the percent is ${C.GOLEM_PCT}, worked by hand 80.2`);
  if (!near(C.LEDGER.possibleTons, 27.9, 0.01)) bad.push(`phase 5: the most iron is ${C.LEDGER.possibleTons} t, worked by hand 27.9`);
  const put = (piece, to) => ({ place: { piece, to } });
  const w4 = K.weighRead(g.stateFor(1, [put('ore', 'slot:pot.in1'), put('al', 'slot:pot.in2'), put('catch', 'slot:pot.out'), { run: 'pot' }, put('catch', 'slot:bal.pan')]).table, 'bal').grams;
  if (!near(w4, 17.9, 0.01)) bad.push(`phase 4: the catch jar weighs ${w4} g, worked by hand 17.9`);
  const w5 = K.weighRead(g.stateFor(2, [put('ore', 'slot:pot.in1'), put('catch', 'slot:pot.out'), { run: 'pot' }, put('catch', 'slot:bal.pan')]).table, 'bal').grams;
  if (!near(w5, 55.8, 0.01)) bad.push(`phase 5: the catch jar weighs ${w5} g, worked by hand 55.8`);
  // No plate prints an answer (a copyable figure).
  const printed = (i) => g.STAGES[i].table.fixtures.filter(f => f.kind === 'plaque').flatMap(f => f.props.lines).join(' | ');
  if (/\b80(\.\d)?\b/.test(printed(1)) || /\b22\.3\b/.test(printed(1))) bad.push('phase 4: a plate prints the answer');
  if (/\b27\.9\b/.test(printed(2))) bad.push('phase 5: a plate prints the answer');
  return bad;
}
