/**
 * lodestone/data-checks.mjs — the planners of `lodedata.js` against values worked on paper, never produced by the code under test.
 *
 *   configurations: V 4s² 3d³, Fe 4s² 3d⁶, Fe²⁺ 3d⁶, Fe³⁺ 3d⁵, Co³⁺ 3d⁶, Mn²⁺ 3d⁵, Ni³⁺ 3d⁷, Mn³⁺ 3d⁴, Cu²⁺ 3d⁹, Zn²⁺ 3d¹⁰
 *   jumps (the first core electron): Ca after 2, Mn after 7, Ti after 4, V after 5, Sc after 3
 *   Fe²⁺'s third electron 2957 < Mn²⁺'s 3248 kJ/mol; Ti²⁺ 2652.5 < V²⁺ 2830
 *   split ladder, P 210: d⁶ wide (300) 0 unpaired, narrow (120) 4; d⁵ 1 and 5; d⁴ 2 and 4; d⁷ 1 and 3; d³ 3 and 3; d⁸ 2 and 2
 *   photons: 500 nm 239 kJ/mol (6.626e-34 × 2.998e8 / 5e-7 = 3.973e-19 J × 6.022e23 = 239,250 J); 600 nm 199.4; 700 nm 170.9; 475 nm 251.8
 *   isomers: MA2B2 square 6 placements, 2 different; MA4B2 octahedral 15 placements, 2 different; MA3B3 octahedral 20, 2 (fac, mer)
 *   pulls: n(n+2): 1 → 3, 4 → 24, 5 → 35, 3 → 15, 2 → 8
 *   charges: Fe³⁺ + 6 CN⁻ = −3; Co³⁺ + 4 NH₃ + 2 Cl⁻ = +1; Co³⁺ + 5 NH₃ + Cl⁻ = +2; Cr³⁺ + 4 H₂O + 2 Cl⁻ = +1
 */
export async function checkLodestoneData({ ok, fail }) {
  const L = await import('../../../src/learn/engine/lodedata.js');
  let bad = 0;
  const same = (got, want, what) => { if (JSON.stringify(got) !== JSON.stringify(want)) { bad++; fail(`Lodestone data ${what}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`); } };
  const near = (got, want, tol, what) => { if (!(Math.abs(got - want) <= tol)) { bad++; fail(`Lodestone data ${what}: got ${got}, expected ${want}`); } };

  const atom = (el) => { const e = L.ELEMENTS[el]; const lv = L.shellLevels(0); return L.lowestOcc(lv, e.s + e.d, L.PAIR_ATOM).occ; };
  same(atom('V'), [2, 1, 1, 1, 0, 0], 'vanadium lowest');
  same(atom('Fe'), [2, 2, 1, 1, 1, 1], 'iron lowest');
  same(atom('Mn'), [2, 1, 1, 1, 1, 1], 'manganese lowest');
  const ion = (el, q) => { const e = L.ELEMENTS[el]; return L.perLevel(L.shellLevels(q), L.lowestOcc(L.shellLevels(q), e.s + e.d - q, L.PAIR_ATOM).occ); };
  same(ion('Fe', 2), { '4s': 0, '3d': 6 }, 'Fe2+ lowest');
  same(ion('Fe', 3), { '4s': 0, '3d': 5 }, 'Fe3+ lowest');
  same(ion('Co', 3), { '4s': 0, '3d': 6 }, 'Co3+ lowest');
  same(ion('Mn', 2), { '4s': 0, '3d': 5 }, 'Mn2+ lowest');
  same(L.ionOf('Ni', 3), { s: 0, d: 7, core: 0 }, 'Ni3+');
  same(L.ionOf('Mn', 3), { s: 0, d: 4, core: 0 }, 'Mn3+');
  same(L.ionOf('Cu', 2), { s: 0, d: 9, core: 0 }, 'Cu2+');
  same(L.ionOf('Zn', 2), { s: 0, d: 10, core: 0 }, 'Zn2+');
  same(['Ca', 'Mn', 'Ti', 'V', 'Sc'].map(L.jumpAfter), [2, 7, 4, 5, 3], 'jumps');
  same([L.ieOf('Fe', 3), L.ieOf('Mn', 3), L.ieOf('Ti', 3), L.ieOf('V', 3)], [2957, 3248, 2652.5, 2830], 'third ionization energies');
  // Test Energy: a pair beside an empty 3d orbital is not lowest; one electron moves within 3d
  const t = L.testEnergy(L.shellLevels(0), [2, 2, 1, 1, 0, 0], L.PAIR_ATOM);
  same([t.lowest, t.moves.length], [false, 1], 'vanadium with a 3d pair');
  same(L.testEnergy(L.shellLevels(0), [2, 1, 1, 1, 0, 0], L.PAIR_ATOM).lowest, true, 'vanadium lowest is lowest');
  const t2 = L.testEnergy(L.shellLevels(2), [2, 1, 1, 1, 1, 0], L.PAIR_ATOM);
  same([t2.lowest, t2.moves.length], [false, 2], 'Fe2+ that kept 4s');
  const sp = (N, g) => L.unpaired(L.fillSplit(N, L.GAPS[g]));
  same([3, 4, 5, 6, 7, 8].map(N => [sp(N, 'narrow'), sp(N, 'wide')]), [[3, 3], [4, 2], [5, 1], [4, 0], [3, 1], [2, 2]], 'split ladder unpaired');
  near(L.photonKJ(500), 239.25, 0.3, '500 nm');
  near(L.photonKJ(600), 199.4, 0.3, '600 nm');
  near(L.photonKJ(700), 170.9, 0.3, '700 nm');
  near(L.photonJ(600) * 1e19, 3.311, 0.005, 'one 600 nm photon');
  same([L.isomerCount('sq', { nh3: 2, cl: 2 }), L.isomerCount('oct', { nh3: 4, cl: 2 }), L.isomerCount('oct', { nh3: 3, cl: 3 })],
    [{ placements: 6, distinct: 2 }, { placements: 15, distinct: 2 }, { placements: 20, distinct: 2 }], 'isomer counts');
  same([L.OCT_TURNS.length, L.SQ_TURNS.length], [24, 8], 'turns of the frames');
  same([1, 4, 5, 3, 2, 0].map(L.pull), [3, 24, 35, 15, 8, 0], 'pulls');
  same([L.complexCharge(3, Array(6).fill('cn')), L.complexCharge(3, ['nh3', 'nh3', 'nh3', 'nh3', 'cl', 'cl']), L.complexCharge(3, ['nh3', 'nh3', 'nh3', 'nh3', 'nh3', 'cl']), L.complexCharge(3, ['h2o', 'h2o', 'h2o', 'h2o', 'cl', 'cl'])], [-3, 1, 2, 1], 'charges');
  same(['h2o', 'cl', 'en'].map(L.fitCount), [6, 4, 3], 'how many fit');
  same(['cu-aq', 'cu-nh3', 'co-nh3', 'co-f'].map(id => L.COMPLEMENT[L.bandOf(L.COMPLEXES[id].nm > 700 ? 660 : L.COMPLEXES[id].nm).id]), ['green', 'blue', 'orange', 'green'], 'complements of the bands');
  same(L.cisTrans('sq', ['cl', 'cl', 'nh3', 'nh3'], 'cl'), 'cis', 'cis square');
  same(L.cisTrans('sq', ['cl', 'nh3', 'cl', 'nh3'], 'cl'), 'trans', 'trans square');
  if (!bad) ok('Lodestone planners (lodedata.js): configurations, ions, jumps, ionization energies, split-ladder spins, photon energies, isomer counts, pulls and charges agree with the values worked by hand');
}
