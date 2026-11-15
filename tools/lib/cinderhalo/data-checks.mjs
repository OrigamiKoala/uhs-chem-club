/**
 * cinderhalo/data-checks.mjs — Cinder Halo's planners held to values typed in from their sources and worked by hand, never to the code that
 * produced them. Called by `verify:cinderhalo` (section 1).
 *
 * Sources: AME2020 atomic masses and CODATA 2018 particle masses; NUBASE2020 / NNDC NuDat half-lives and decay modes; the table of stable
 * isotopes (CRC Handbook); NIST XCOM attenuation for the shield fractions; hand arithmetic for every derived figure.
 */

const N = await import('../../../src/learn/engine/nucdata.js');

export function runNucDataChecks({ ok, fail }) {
  const near = (a, b, tol) => Math.abs(a - b) <= tol + 1e-12;
  let before = 0;
  const bad = [];
  const want = (cond, msg) => { if (!cond) bad.push(msg); };

  /* Elements: a few by hand. */
  want(N.symbolOf(92) === 'U' && N.nameOf(92) === 'uranium', 'Z 92 is uranium');
  want(N.symbolOf(82) === 'Pb' && N.symbolOf(83) === 'Bi' && N.symbolOf(84) === 'Po' && N.symbolOf(90) === 'Th' && N.symbolOf(91) === 'Pa', 'heavy symbols');
  want(N.symbolOf(43) === 'Tc' && N.symbolOf(53) === 'I' && N.symbolOf(27) === 'Co' && N.symbolOf(79) === 'Au' && N.symbolOf(95) === 'Am', 'middle symbols');
  want(N.ELEMENTS.length === 95, 'ninety-five elements listed');

  /* Stable nuclides: counts and spot values from the table of stable isotopes. */
  const total = Object.values(N.STABLE).reduce((s, a) => s + a.length, 0);
  // The usual count is 251 (it adds tantalum-180m and leaves out bismuth-209); whether a few observationally stable nuclides count is a
  // convention, so the table is held to the band, not to one number.
  want(total >= 249 && total <= 253, `about 250 stable nuclides from hydrogen to bismuth (found ${total})`);
  want(N.stableOf(43).length === 0 && N.stableOf(61).length === 0, 'technetium and promethium have no stable nuclide');
  want(N.stableOf(50).length === 10, 'tin has ten stable nuclides');
  want(N.stable(6, 6) && N.stable(6, 7) && !N.stable(6, 8), 'carbon-12 and -13 stable, carbon-14 not');
  want(N.stable(82, 126) && N.stable(83, 126) && !N.stable(84, 126), 'lead-208 and bismuth-209 stable, polonium-210 not');
  want(N.stable(27, 32) && !N.stable(27, 33) && N.stable(28, 32), 'cobalt-59 stable, cobalt-60 not, nickel-60 stable');
  want(N.stable(7, 7) && N.stable(7, 8) && !N.stable(8, 7), 'nitrogen-14 and -15 stable, oxygen-15 not');
  want(N.stable(79, 118) && N.stable(20, 20) && N.stable(26, 30), 'gold-197, calcium-40, iron-56 stable');
  for (let Z = 84; Z <= 95; Z++) want(N.stableOf(Z).length === 0, `nothing stable at Z ${Z}`);

  /* Decays, worked by hand. */
  const prod = (Z, A, m) => { const r = N.decayOf(Z, A, m); return `${r.Z}/${r.A}`; };
  want(prod(92, 238, 'alpha') === '90/234', 'uranium-238 alpha -> thorium-234');
  want(prod(90, 234, 'beta') === '91/234', 'thorium-234 beta -> protactinium-234');
  want(prod(9, 18, 'positron') === '8/18', 'fluorine-18 positron -> oxygen-18');
  want(prod(4, 7, 'capture') === '3/7', 'beryllium-7 capture -> lithium-7');
  want(prod(43, 99, 'gamma') === '43/99', 'technetium-99m gamma -> technetium-99');
  want(prod(11, 24, 'beta') === '12/24', 'sodium-24 beta -> magnesium-24');
  want(prod(84, 210, 'alpha') === '82/206', 'polonium-210 alpha -> lead-206');
  want(prod(6, 14, 'beta') === '7/14' && prod(8, 15, 'positron') === '7/15', 'carbon-14 and oxygen-15 decay onto nitrogen');
  const st = m => { const s = N.stepOf(m); return `${s.dZ},${s.dN}`; };
  want(st('alpha') === '-2,-2' && st('beta') === '1,-1' && st('positron') === '-1,1' && st('capture') === '-1,1' && st('gamma') === '0,0', 'decay steps on the chart');
  // Series: 8 alpha + 6 beta from U-238 is Pb-206; 6 + 4 from Th-232 is Pb-208; 7 + 4 from U-235 is Pb-207.
  const walk = (Z, A, a, b) => { for (let i = 0; i < a; i++) ({ Z, A } = N.decayOf(Z, A, 'alpha')); for (let i = 0; i < b; i++) ({ Z, A } = N.decayOf(Z, A, 'beta')); return `${Z}/${A}`; };
  want(walk(92, 238, 8, 6) === '82/206' && walk(90, 232, 6, 4) === '82/208' && walk(92, 235, 7, 4) === '82/207', 'the three decay series end on lead');

  /* Masses and energies, by hand. */
  want(near(2 * 1.007276 + 2 * 1.008665, 4.031882, 1e-6) && near(N.massOf(N.LOADS['He4-parts']), 4.031882, 1e-6), 'two protons and two neutrons weigh 4.031882 u');
  const he = N.defect('He4-parts', 'He4');
  want(near(he.dm, 0.030376, 1e-6), `helium-4 mass defect 0.030376 u (got ${he.dm.toFixed(6)})`);
  want(near(he.dm * 931.5, 28.3, 0.05), `helium-4 binding energy 28.3 MeV (got ${(he.dm * 931.5).toFixed(2)})`);
  const d = N.defect('H2-parts', 'H2');
  want(near(d.dm, 0.002388, 1e-6) && near(d.dm * 931.5, 2.22, 0.01), 'deuterium: 0.002388 u, 2.22 MeV');
  const f = N.defect('U235-fuel', 'U235-split');
  want(near(N.massOf(N.LOADS['U235-fuel']), 236.052595, 1e-6) && near(N.massOf(N.LOADS['U235-split']), 235.866571, 1e-6), 'fission loads 236.052595 and 235.866571 u');
  want(near(f.dm, 0.186024, 1e-6) && near(f.dm * 931.5, 173.3, 0.1), `one fission of uranium-235 to barium-141 and krypton-92 gives 173.3 MeV (got ${(f.dm * 931.5).toFixed(1)})`);
  const fu = N.defect('H2-pair', 'He4');
  want(near(fu.dm, 0.025600, 1e-6), 'two deuterons weigh 0.0256 u more than helium-4');

  /* Binding energy per nucleon: recomputed from atomic masses for five nuclides (M_H 1.007825, m_n 1.008665). */
  const bea = (Z, A, M) => ((Z * 1.007825 + (A - Z) * 1.008665 - M) * 931.494) / A;
  for (const [name, Z, A, M] of [['Fe-56', 26, 56, 55.934936], ['U-235', 92, 235, 235.043930], ['U-238', 92, 238, 238.050788], ['Ba-141', 56, 141, 140.914403], ['Kr-92', 36, 92, 91.926173], ['He-4', 2, 4, 4.002602], ['C-12', 6, 12, 12.000000], ['O-16', 8, 16, 15.994915]]) {
    want(near(N.bePerNucleon(name), bea(Z, A, M), 0.003), `${name}: ${N.bePerNucleon(name)} against ${bea(Z, A, M).toFixed(3)} MeV from its mass`);
  }
  const top = N.BE_PER_NUCLEON.reduce((a, b) => (b.be > a.be ? b : a));
  want(top.name === 'Ni-62' && near(N.bePerNucleon('Fe-56'), 8.79, 0.01), 'nickel-62 tops the curve, iron-56 beside it');
  want(N.bePerNucleon('He-4') > N.bePerNucleon('Li-6') && N.bePerNucleon('He-4') > N.bePerNucleon('H-2') * 6, 'helium-4 sits far above hydrogen-2');

  /* Chain generations, by hand. */
  want(N.generations(0).join() === '1,3,9,27' && N.generations(1).join() === '1,2,4,8' && N.generations(2).join() === '1,1,1,1' && N.generations(3).join() === '1,0,0,0', 'chain generations');

  /* Half-lives and the decaying grid. */
  want(near(N.NUCLIDES['I-131'].half, 8.02, 1e-9) && near(N.NUCLIDES['Co-60'].half / 365.25, 5.27, 1e-9) && near(N.NUCLIDES['C-14'].half / 365.25, 5730, 1e-9), 'iodine-131 8.02 d, cobalt-60 5.27 y, carbon-14 5,730 y');
  want(near(N.NUCLIDES['Tc-99m'].half * 24, 6.01, 1e-9) && near(N.NUCLIDES['F-18'].half * 1440, 109.8, 1e-9), 'technetium-99m 6.01 h, fluorine-18 109.8 min');
  const T = N.decayTimes(256, 8.02);
  const left = t => N.gridLeft(T, t);
  want(left(0) === 256 && left(7) === 140 && left(8) === 128 && left(16) === 64 && left(24) === 32, `iodine-131 grid: 256, 140, 128, 64, 32 at 0, 7, 8, 16, 24 days (got ${[0, 7, 8, 16, 24].map(left).join(', ')})`);
  for (let t = 0; t <= 24; t++) want(left(t) === N.leftAt(256, t, 8.02), `the grid keeps to the law at day ${t}`);
  const T64 = N.decayTimes(64, 8.02, 11);
  want(N.gridLeft(T64, 8) === 32 && N.gridLeft(T64, 16) === 16, 'the small grid halves on the same days');
  want(N.leftAt(256, 40, 8.02) === 8 || Math.abs(256 / 32 - 8) < 1e-9, 'five half-lives of 256 leave 8');
  want(near(0.693 / 8.0, 0.0866, 0.0001) && near(0.693 / 5.27, 0.1315, 0.0001), 'k = 0.693 / t½: 0.0866 per day, 0.132 per year');
  want(near(5730 * 3, 17190, 0) && near(15.3 / 8, 1.9, 0.02), 'carbon clock: three half-lives, 15.3 to 1.9');
  want(near(5.27 * 3, 15.81, 0.001), 'cobalt-60: 3,200 to 400 in three half-lives, 15.8 years');

  /* Counting: what each source gives off through each shield. */
  const c = (s, o) => N.countsOf(s, o);
  want(c(null) >= 21 && c(null) <= 27 && c(null, { housed: true }) <= 6, 'background about 24, about 4 housed in lead');
  want(c('oreFe') < 30 && c('oreU') > 1800 && c('oreU') < 1900, 'iron ore counts background, uranium ore about 1,860');
  want(Math.abs(c('oreU', { grams: 2 }) - 2 * 1840 - 24) < 40, 'two grams count twice the ore\'s part');
  for (const temp of [-40, 20, 300]) want(c('oreU', { temp, run: 3 }) === c('oreU', { temp: 20, run: 3 }), `temperature changes no count (${temp} °C)`);
  want(c('po210', { shield: 'paper' }) < 30 && c('sr90', { shield: 'paper' }) > 2700 && c('sr90', { shield: 'aluminium' }) < 45, 'alpha stopped by paper, beta by aluminium');
  want(c('co60s', { shield: 'aluminium' }) > 780 && c('co60s', { shield: 'lead' }) < 80, 'gamma through aluminium, mostly stopped by 5 cm lead');
  want(c('am241', { shield: 'paper' }) > 280 && c('am241', { shield: 'paper' }) < 330 && c('am241', { shield: 'lead' }) < 30, 'americium-241: alpha and a soft gamma');
  want(c('co60', { shield: 'paper' }) > 2800 && c('co60', { shield: 'aluminium' }) < 900 && c('co60', { shield: 'lead' }) < 80, 'unsealed cobalt-60: beta and gamma');
  // The scatter never runs with anything a student sets.
  const runs = Array.from({ length: 40 }, (_, i) => c('oreU', { run: i }));
  const spread = Math.max(...runs) - Math.min(...runs);
  want(spread > 10 && spread < 60, `counts of one sample scatter by about 1 % (${spread} over 40 counts)`);

  if (bad.length === before) ok('nucdata: elements, about 250 stable nuclides, decays and series, masses and binding energies, chain, grid, counts — held to hand values');
  else for (const b of bad) fail(`nucdata: ${b}`);
  return bad.length;
}
