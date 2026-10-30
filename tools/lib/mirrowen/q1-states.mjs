/**
 * q1-states — held to the CRC Handbook and the IAPWS steam table, worked independently here (never from the code that made the figures).
 */

/** Refusals may not carry the rule a stage is asking for (1-based stages). */
export const LEAKS = {
  1: [/\bsolid\b/i, /\bliquid\b/i, /\bgas\b/i],
  2: [/\bfixed\b/i, /\bslid/i, /\bapart\b/i, /\border\b/i, /\brows?\b/i],
  4: [/\bphase change/i, /\bbonds?\b/i, /\bwhole\b/i],
  5: [/\bintermolecular\b/i, /\battract/i, /\bbonds?\b/i],
  6: [/\broom\b/i, /\bmore molecules\b/i, /\bheavier\b/i, /\bdensity\b/i],
  7: [/\bdivid/i, /\bratio\b/i, /\b1,?6\d\d\b/, /\b1,?7\d\d\b/],
  8: [/\bkeeps?\b/i, /\bfills?\b/i]
};

export async function check({ q, mod, near, same, holds, start, done }) {
  const W = await import('../../../src/learn/engine/matterdata-window.js');
  const NA = 6.02214076e23; void NA;

  // ---- the balance: CRC densities of ice and water at 0 degC, and the IAPWS-95 saturated vapour at 100 degC, by hand ----
  near(W.jarMass('solid'), 917, 0.5, `${q}: a litre of ice weighs 0.9168 kg/L = 917 g`);
  near(W.jarMass('liquid'), 1000, 0.5, `${q}: a litre of water at 0 degC weighs 999.84 g = 1000 g`);
  near(W.jarMass('gas'), 0.598, 0.0005, `${q}: a litre of steam at 100 degC and 1 atm weighs 1/1.672 g = 0.598 g`);
  // The ideal-gas figure P M / R T is within 2 % of the steam table (cross-check that the row is a gas and not a typo).
  const ideal = (101325 * 0.018015) / (8.314462 * 373.15); // kg/m3
  near(W.jarMass('gas'), ideal, ideal * 0.02, `${q}: the steam row against P M / R T`);
  // Stage 7: 999.84 / 0.598 = 1672; the typed field takes 5 %.
  near(mod.CHECKS.TIMES, 1000 / 0.598, 1e-9, `${q} stage 7 (the ratio of the two readings)`);
  holds(mod.CHECKS.TIMES > 1600 && mod.CHECKS.TIMES < 1750, `${q} stage 7: the ratio is outside what the typed field expects`);
  near(Math.cbrt(mod.CHECKS.TIMES), 11.87, 0.01, `${q} stage 7: the cube root of the ratio is the 12 times farther apart the reward states`);
  const typed = v => mod.STAGES[6].check(mod.stateFor(6, [
    { place: { piece: 'jw', to: 'slot:scale.pan' } }, { run: 'scale' }, { place: { piece: 'js', to: 'slot:scale.pan' } }, { run: 'scale' },
    { type: { entry: 'times', value: String(v) } }]));
  holds(typed(1672).ok && typed(1700).ok && typed(1600).ok, `${q} stage 7: the real ratio is refused`);
  for (const wrong of [1000, 917 / 0.598, 17, 1.67, 0.0006, 598]) holds(!typed(wrong).ok, `${q} stage 7: ${wrong} is accepted`);

  // ---- stage 6: ice weighs LESS than water (the click), steam least of all; the rank is the room per molecule ----
  holds(W.jarMass('solid') < W.jarMass('liquid') && W.jarMass('gas') < W.jarMass('solid'), `${q} stage 6: steam < ice < water`);
  same(mod.CHECKS.S6_ORDER.map(id => mod.CHECKS.S6_JARS.find(j => j.id === id).state).join(), 'gas,solid,liquid', `${q} stage 6 (the order: most room first)`);

  // ---- states: melting and boiling points from the CRC, worked by hand ----
  const st = (s, T) => W.stateAt(s, T);
  same(st('H2O', -10), 'solid', `${q}: water at -10 degC`);
  same(st('H2O', 20), 'liquid', `${q}: water at 20 degC`);
  same(st('H2O', 110), 'gas', `${q}: water at 110 degC`);
  same(st('H2O', 150), 'gas', `${q}: water at 150 degC`);
  same(st('Ar', -187), 'liquid', `${q}: argon liquid between -189.35 and -185.85 degC`);
  same(st('I2', 20), 'solid', `${q}: iodine melts at 113.7 degC`);
  same(st('CO2', 20), 'gas', `${q}: carbon dioxide sublimes at -78.5 degC`);
  same(st('ethanol', 20), 'liquid', `${q}: ethanol melts at -114.1 and boils at 78.4 degC`);
  for (const j of mod.CHECKS.S8_JARS) same(st(j.sample, j.T), j.tray, `${q} stage 8 (${j.label}'s tray)`);
  // The squeeze may not turn a jar of steam to liquid: 3 atm is below the 476 kPa saturation pressure of water at 150 degC.
  holds(3 * 101.325 < 476, `${q}: steam at 150 degC squeezed to a third is still a gas`);
  near(W.squeezeRatio('gas', 4), 1 / 3, 1e-9, `${q}: the hardest squeeze takes a gas to a third`);
  holds(W.squeezeRatio('solid', 4) === 1 && W.squeezeRatio('liquid', 4) === 1, `${q}: a solid or a liquid is squeezed smaller`);
  same(['solid', 'liquid', 'gas'].map(W.pourShape).join(), 'lump,pool,spread', `${q}: the tank`);

  // ---- the window: the same eight whole molecules in every state; the reader never invents a name ----
  for (const T of [-10, 5, 20, 110]) {
    const w = W.windowMolecules({ sample: 'H2O' }, T);
    same(w.mols.join(), Array(8).fill('H2O').join(), `${q}: the window at ${T} degC holds eight H2O`);
  }
  const sp = W.windowMolecules({ sample: 'H2O', split: true }, 20);
  const atoms = { H: 0, O: 0 };
  for (const m of sp.mols) { if (m === 'H2') atoms.H += 2; else if (m === 'O2') atoms.O += 2; }
  holds(atoms.H === 16 && atoms.O === 8, `${q}: the split-water jar holds the atoms of eight water molecules (16 H, 8 O), got ${atoms.H} H and ${atoms.O} O`);
  same(W.readerNames({ sample: 'H2O' }), 'H₂O', `${q}: the reader names water`);
  same(W.readerNames({ sample: 'H2O', split: true }), 'H₂ + O₂', `${q}: the reader names split water`);
  // Spacing: the same molecules, closer in a solid and a liquid than in a gas; no two overlap.
  const sA = W.spacing(W.arrange({ state: 'solid', T: -10 })); const lA = W.spacing(W.arrange({ state: 'liquid', T: 20 })); const gA = W.spacing(W.arrange({ state: 'gas', T: 110 }));
  holds(sA.min >= 3.3 && lA.min >= 2.5 && gA.min >= 3.0, `${q}: molecules overlap in a picture (solid ${sA.min.toFixed(2)}, liquid ${lA.min.toFixed(2)}, gas ${gA.min.toFixed(2)})`);
  holds(gA.mean > 1.25 * Math.max(sA.mean, lA.mean), `${q}: the gas is not drawn farther apart than the others (${gA.mean.toFixed(2)} against ${sA.mean.toFixed(2)} and ${lA.mean.toFixed(2)})`);
  holds(W.arrange({ state: 'solid', T: -10 }).every(p => p.ang === 0) && W.arrange({ state: 'liquid', T: 20 }).some(p => p.ang !== 0), `${q}: a solid is turned one way and a liquid is jumbled`);
  // A streak: a solid and a liquid near 270 K move about as far in a moment (same speed), a gas much further.
  holds(Math.abs(W.tailOf('solid', -10) - W.tailOf('liquid', 5)) < 0.05 && W.tailOf('gas', 110) > 3 * W.tailOf('liquid', 5), `${q}: the streaks`);

  // ---- the stages: what is on the bench, and what an untouched bench does ----
  holds(!Object.keys(start(mod, 2).fixtures).length, `${q} stage 3: the predict stage shows an instrument`);
  mod.STAGES.forEach((s, i) => { if (i !== 2) holds(s.check(mod.stateFor(i, {})).ok !== true, `${q} stage ${i + 1}: the untouched table passes`); });
  // Stage 1/2/8: every jar is sorted by what the press and tank show.
  same(mod.CHECKS.S1_TRAY.solid + mod.CHECKS.S1_TRAY.liquid + mod.CHECKS.S1_TRAY.gas, 'lumppoolfill', `${q} stage 1 (the trays)`);
  // Stage 4 evidence: at the end of the solution the ice jar has been read at all three heater settings and every line is H2O; the split jar is not.
  const end4 = done(mod, 3);
  const ja = end4.pieces.ja.props.reads; const jd = end4.pieces.jd.props.reads;
  holds(ja && ['-10', '20', '110'].every(k => ja[k] === 'H₂O'), `${q} stage 4: the ice jar was not read as H2O at every temperature`);
  holds(jd && jd['20'] === 'H₂ + O₂', `${q} stage 4: the split-water jar read ${JSON.stringify(jd)}`);
  const end5 = done(mod, 4);
  holds(end5.pieces.ja.props.reads['5'] === 'H₂O', `${q} stage 5: the ice jar was not read at 5 degC`);
  // The reader reads only a jar in the window: pressing it empty reads nothing.
  holds(mod.STAGES[3].table && !mod.windowRead(start(mod, 3), 'window').jar, `${q} stage 4: a jar is in the window at the start`);
  // Stage 1 evidence: after the solution each jar remembers what it did.
  const end1 = done(mod, 0);
  same(['a', 'b', 'c'].map(id => end1.pieces[id].props.did.pour).join(), 'pool,spread,lump', `${q} stage 1: what each jar did in the tank`);
  near(end1.pieces.b.props.did.sq, 1 / 3, 1e-9, `${q} stage 1: the gas jar squeezed to a third`);
  near(end1.pieces.c.props.did.sq, 1, 1e-9, `${q} stage 1: the ice jar did not squeeze`);
  // Stage 6/7: the balance writes the CRC masses on the jars.
  const end6 = done(mod, 5);
  same(['a', 'b', 'c'].map(id => end6.pieces[id].props.mass).join(), '1000,0.598,917', `${q} stage 6: the weights on the jars`);
  void same; void near;
}
