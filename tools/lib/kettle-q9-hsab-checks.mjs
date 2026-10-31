/**
 * kettle-q9-hsab-checks.mjs — what `verify:learn` holds Kettle's q9-hsab to (loaded by `kettle-learn-checks.mjs`).
 *
 * Every expected value is a literal worked on paper (hard vs soft classification, precipitation outcomes,
 * bonding models, partner exchange products), never the code under test.
 */

const METHOD = /\b(moles|divide|multiply|coefficients?|limiting|excess|theoretical|ratio|convert|rule|rules)\b/i;

export async function check({ near }) {
  const bad = [];
  const q = await import('../../src/learn/quests/unit07/q9-hsab.js');
  const H = await import('../../src/learn/engine/reactdata-hsab.js');
  const same = (what, got, want) => {
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      bad.push(`${what}: got ${JSON.stringify(got)}, worked by hand ${JSON.stringify(want)}`);
    }
  };

  // Hard vs soft classification of test ions
  same('Ca is hard acid', H.isHard('Ca'), true);
  same('Mg is hard acid', H.isHard('Mg'), true);
  same('Ag is soft acid', H.isHard('Ag'), false);
  same('Pb2 is soft acid', H.isHard('Pb2'), false);
  same('F is hard base', H.isHard('F'), true);
  same('OH is hard base', H.isHard('OH'), true);
  same('I is soft base', H.isHard('I'), false);
  same('S is soft base', H.isHard('S'), false);

  // Precipitation outcomes:
  // CaF2 precipitates (hard-hard), CaI2 soluble (hard-soft)
  // AgF soluble (soft-hard), AgI precipitates (soft-soft)
  // Ag2S precipitates (soft-soft), CaS soluble (hard-soft)
  const caf = H.pairOutcome('Ca', 'F');
  same('CaF2 precipitates', caf.precipitates, true);
  same('CaF2 match', caf.match, 'hard-hard');
  same('CaF2 bond', caf.bondType, 'ionic');

  const cai = H.pairOutcome('Ca', 'I');
  same('CaI2 dissolves', cai.precipitates, false);
  same('CaI2 match', cai.match, 'hard-soft');

  const agf = H.pairOutcome('Ag', 'F');
  same('AgF dissolves', agf.precipitates, false);
  same('AgF match', agf.match, 'soft-hard');

  const agi = H.pairOutcome('Ag', 'I');
  same('AgI precipitates', agi.precipitates, true);
  same('AgI match', agi.match, 'soft-soft');
  same('AgI bond', agi.bondType, 'covalent');

  const ag2s = H.pairOutcome('Ag', 'S');
  same('Ag2S precipitates', ag2s.precipitates, true);
  same('Ag2S match', ag2s.match, 'soft-soft');

  const cas = H.pairOutcome('Ca', 'S');
  same('CaS dissolves', cas.precipitates, false);
  same('CaS match', cas.match, 'hard-soft');

  // Selective precipitation: sulfide selectively captures soft Pb2 while leaving hard Mg2+ dissolved
  const sel = H.selectivePrecipitation('Pb2', 'Mg', ['F', 'S']);
  const sSulfide = sel.find(x => x.reagent === 'S');
  const sFluoride = sel.find(x => x.reagent === 'F');
  same('sulfide is selective for lead over magnesium', sSulfide?.selective, true);
  same('fluoride is not selective for lead over magnesium', sFluoride?.selective, false);

  // Double displacement / partner swapping
  const swap = H.swapOutcome('Ca', 'I', 'Ag', 'F');
  same('swap products', swap.solids.map(p => p.formula).sort(), ['AgI', 'CaF2']);

  // Stage checks
  // Stage 3 must be a predict stage with no instruments
  const st3 = q.STAGES[2];
  if (!st3.predict) bad.push('stage 3 is not marked predict: true');
  if ((st3.table.fixtures || []).some(f => f.kind !== 'plaque')) bad.push('stage 3 shows an instrument on the table');

  // Verify solutions pass and misses are rejected
  q.STAGES.forEach((st, i) => {
    const solState = q.stateFor(i, q.SOLUTIONS[i]);
    const solRes = st.check(solState);
    if (!solRes || !solRes.ok) bad.push(`stage ${i + 1}: solution fails (${solRes?.msg || 'no ok'})`);

    const blankState = q.stateFor(i, []);
    const blankRes = st.check(blankState);
    if (blankRes && blankRes.ok) bad.push(`stage ${i + 1}: blank bench passes`);

    const missState = q.stateFor(i, q.MISSES[i]);
    const missRes = st.check(missState);
    if (!missRes || missRes.ok) bad.push(`stage ${i + 1}: miss was not rejected`);
    if (missRes && missRes.msg && METHOD.test(missRes.msg)) {
      bad.push(`stage ${i + 1}: miss refusal contains method ("${missRes.msg}")`);
    }
  });

  return bad;
}
