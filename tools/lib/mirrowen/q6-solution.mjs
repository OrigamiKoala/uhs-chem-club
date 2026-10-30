/**
 * q6-solution — every graded figure re-derived here by hand, with no code from the bench. Sources: molar masses from the periodic table
 * (NaCl 58.44, CaCl2 110.98, sucrose 342.30 g/mol), enthalpies of solution from the CRC Handbook (NaCl +3.9, KCl +17.2, CaCl2 -81.3,
 * NH4NO3 +25.7 kJ/mol), c of water 4.184 J/(g K), N_A = 6.022e23, and the solubility table of the CRC.
 */

/** Refusals may not carry the rule a stage is asking for (1-based stages). */
export const LEAKS = {
  1: [/\bsolut/i, /\bsolvent\b/i, /\bhomogeneous\b/i, /\buniform/i, /\bdissolve/i],
  2: [/\b0\.4\d*\b/, /\bdivide\b/i, /\bper litre\b/i],
  3: [/\b25(\.0)?\b/, /\bM1V1\b/i, /\bmultiply\b/i, /\bdivide\b/i],
  5: [/\bthree\b/i, /\b3\b/, /\b1\.8\d?\b/, /\bions?\b/i],
  6: [/\blike\b/i, /\bpolar/i, /\bcharge/i, /\bmiscible\b/i],
  7: [/\bexothermic\b/i, /\bendothermic\b/i, /\bstronger\b/i],
  8: [/\bunits?\b/i, /\bformula\b/i, /\bper\b/i, /\bthree (particles|ions)\b/i]
};

export async function check({ q, mod, MD, near, same, holds, start, done }) {
  const CK = mod.CHECKS;
  const SOL = MD.SOLUTES;

  // Molar masses as worked from the periodic table (Na 22.990 + Cl 35.45; Ca 40.078 + 2 Cl; C12H22O11).
  near(SOL.NaCl.M, 22.990 + 35.45, 0.02, `${q}: M of NaCl`);
  near(SOL.CaCl2.M, 40.078 + 2 * 35.45, 0.02, `${q}: M of CaCl2`);
  near(SOL.sugar.M, 12 * 12.011 + 22 * 1.008 + 11 * 15.999, 0.05, `${q}: M of sucrose`);

  // Stage 2: 5.85 g / 58.44 g/mol = 0.1001 mol in 0.250 L = 0.4004 mol/L (worked by hand).
  near(CK.M_ASKED, (5.85 / 58.44) / 0.25, 1e-9, `${q} stage 2 (molarity)`);
  holds(CK.M_ASKED > 0.39 && CK.M_ASKED < 0.41, `${q} stage 2: the molarity is not 0.400`);
  // Stage 3: M1 V1 = M2 V2, 2.00 x V1 = 0.500 x 100.
  near(CK.V_ASKED, 0.5 * 100 / 2.0, 1e-9, `${q} stage 3 (dilution)`);
  holds(!CK.STOCKS.includes(CK.V_ASKED), `${q} stage 3: the answer is a step on the dial, so it could be found by hunting`);
  holds(CK.STOCKS.some(s => s < CK.V_ASKED) && CK.STOCKS.some(s => s > CK.V_ASKED), `${q} stage 3: the answer does not lie between two steps of the dial`);
  // Stage 5: 0.100 mol x 3 particles x 6.022e23 = 1.8066e23.
  near(CK.N_ASKED, 0.1 * 3 * 6.022, 1e-9, `${q} stage 5 (particles)`);
  holds(Math.abs(CK.N_ASKED - 0.1 * 6.022) > 0.5, `${q} stage 5: counting formula units alone passes`);
  // Stage 6: solubility (CRC): salt and sugar mix with water and not hexane; wax the reverse; acetone mixes with both.
  const WANT = { salt: 'water', sugar: 'water', wax: 'hexane', acetone: 'both' };
  for (const s of CK.LIKE) same(s.tray, WANT[s.id], `${q} stage 6 (${s.id}'s tray)`);
  // Stage 7: dT = -n dHsoln / (m c): NaCl -0.93, KCl -4.11, CaCl2 +19.43, NH4NO3 -6.14 (0.100 mol in 100 g, hand worked).
  const DH = { NaCl: 3.9, KCl: 17.2, CaCl2: -81.3, NH4NO3: 25.7 };
  const rise = id => (-DH[id] * 0.1 * 1000) / (100 * 4.184);
  near(rise('NaCl'), -0.932, 0.002, `${q} stage 7 (NaCl)`);
  near(rise('CaCl2'), 19.43, 0.01, `${q} stage 7 (CaCl2)`);
  near(rise('NH4NO3'), -6.142, 0.002, `${q} stage 7 (NH4NO3)`);
  same(CK.BY_BATH.join(), ['NH4NO3', 'KCl', 'NaCl', 'CaCl2'].join(), `${q} stage 7 (the rank)`);
  // The wrong ranking by size of change alone must differ from the right one.
  holds([...CK.BY_BATH].sort((a, b) => Math.abs(rise(a)) - Math.abs(rise(b))).join() !== CK.BY_BATH.join(), `${q} stage 7: ranking by size of change passes`);
  // Stage 8: 12 particles in every drop, molarities 0.200 (CaCl2), 0.300 (NaCl), 0.600 (sugar).
  const parts = { NaCl: 2, sugar: 1, CaCl2: 3 };
  for (const s of CK.SEALED) {
    near(s.grams / SOL[s.sub].M / 0.25, s.M, 1e-6, `${q} stage 8 (${s.id}'s molarity from its grams)`);
    near(s.M * 20 * parts[s.sub], 12, 1e-9, `${q} stage 8 (${s.id}'s particles in the drop)`);
  }
  same(CK.SEALED_BY_M.join(), 'z,x,y', `${q} stage 8 (the rank)`);

  // Every window at its stage is computed from the table it stands on, not authored: read the drop of each card in the mouth.
  const FL = await import('../../../src/learn/table/kits/matter-flask.js');
  const FD = await import('../../../src/learn/engine/matterdata-flask.js');
  void done;
  const T = mod.stateFor(1, [{ place: { piece: 'salt', to: 'slot:flask.pan' } }, { place: { piece: 'salt', to: 'slot:flask.mouth' } }, { setDial: { fixture: 'flask', dial: 'fill', value: 2 } }]).table;
  const r2 = FL.flaskRead(T, 'flask');
  near(r2.c, CK.M_ASKED, 1e-9, `${q} stage 2: the window's molarity`);
  same(FD.countsOf(FL.dropFor(r2)).total, 2 * Math.round(r2.c * 20), `${q} stage 2: the window's particles`);
  const T3 = mod.stateFor(2, [{ place: { piece: 'stock', to: 'slot:flask.mouth' } }, { setDial: { fixture: 'flask', dial: 'stock', value: 3 } }]).table;
  near(FL.flaskRead(T3, 'flask').c, 2.0 * 30 / 100, 1e-9, `${q} stage 3: the molarity at 30 mL`);
  // Stage 5: the drop holds four units of each, and 8, 12 and 4 particles.
  for (const [id, n] of [['nacl', 8], ['cacl2', 12], ['sugar', 4]]) {
    const T5 = mod.stateFor(4, [{ place: { piece: id, to: 'slot:flask.mouth' } }]).table;
    same(FD.countsOf(FL.dropFor(FL.flaskRead(T5, 'flask'))).total, n, `${q} stage 5 (${id}'s particles in the drop)`);
  }

  // The predict stage shows no instrument; every other stage's untouched table does not pass.
  holds(!Object.keys(start(mod, 3).fixtures).length, `${q} stage 4: the predict stage shows an instrument`);
  for (const i of [0, 1, 2, 4, 5, 6, 7]) holds(mod.STAGES[i].check(mod.stateFor(i, {})).ok !== true, `${q} stage ${i + 1}: the untouched table passes`);
  // Stage 1 evidence: the window shows spread for the two soluble powders and lumps for the others, at the time each is in the flask.
  for (const s of CK.POWDERS) {
    const T1 = mod.stateFor(0, [{ place: { piece: s.id, to: 'slot:flask.mouth' } }]).table;
    same(T1.pieces[s.id].props.saw_water, s.tray === 'spread' ? 'spreads' : 'lumps', `${q} stage 1 (${s.id} in the window)`);
  }
  // The prediction cards: the held belief is offered.
  holds(Object.keys(mod.STAGES[3].table.pieces ? Object.fromEntries(mod.STAGES[3].table.pieces.map(p => [p.id, 1])) : {}).includes('same'), `${q} stage 4: the belief is not a card`);
}
