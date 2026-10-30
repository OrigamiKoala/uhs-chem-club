/**
 * q2-grip — held to the CRC Handbook's enthalpies of vaporization and the bond table, worked independently here.
 */

/** Refusals may not carry the rule a stage is asking for (1-based stages). */
export const LEAKS = {
  1: [/\bbigger\b/i, /\blarger\b/i, /\bcloud\b/i, /\bsize\b/i],
  2: [/\bpolar\b/i, /\bcharge\b/i, /\bdipole\b/i],
  4: [/\bhydrogen bond/i, /\blighter\b/i, /\bheavier\b/i, /\bmass\b/i],
  5: [/\bsmaller\b/i, /\bcharge\b/i, /\bradius\b/i],
  6: [/\bshape\b/i, /\bcontact\b/i, /\bsurface\b/i],
  7: [/\b23\b/, /\btwo bonds?\b/i, /\bmultiply\b/i],
  8: [/\bhydrogen on\b/i, /\bpolar\b/i, /\bN, O or F\b/i]
};

export async function check({ q, mod, MD, near, same, holds, start, done }) {
  const SUB = MD.SUBSTANCES;
  // CRC, kJ/mol at the normal boiling point, as worked here by hand.
  const CRC = { He: 0.083, Ne: 1.71, Ar: 6.43, Kr: 9.08, Xe: 12.57, HCl: 16.15, H2S: 18.67, PH3: 14.6, H2O: 40.65, NH3: 23.35, C4H10: 22.4, C5H12: 25.8, neoC5: 22.7 };
  for (const [id, v] of Object.entries(CRC)) near(SUB[id].grip, v, 0.05, `${q}: ${id} grip`);
  const ORD = (ids) => [...ids].sort((a, b) => CRC[a] - CRC[b]).join();

  same(mod.CHECKS.NOBLE_BY_GRIP.join(), ORD(['He', 'Ne', 'Ar', 'Xe']), `${q} stage 1 (the rank)`);
  same(mod.CHECKS.POLAR_BY_GRIP.join(), ORD(['Ar', 'Kr', 'HCl']), `${q} stage 2 (the rank)`);
  same(mod.CHECKS.HYDRIDES_BY_GRIP.join(), ORD(['H2O', 'H2S', 'NH3', 'PH3']), `${q} stage 4 (the rank)`);
  same(mod.CHECKS.SHAPES_BY_GRIP.join(), ORD(['C4H10', 'C5H12', 'neoC5']), `${q} stage 6 (the rank)`);

  // The click: the heavier molecule is NOT the one that holds harder, among the hydrides.
  holds(SUB.H2S.M > SUB.H2O.M && SUB.H2O.grip > SUB.H2S.grip, `${q} stage 4: water is not lighter and still the stronger`);
  holds(SUB.NH3.M < SUB.PH3.M && SUB.NH3.grip > SUB.PH3.grip, `${q} stage 4: ammonia is not lighter and still the stronger`);
  // Hydrogen chloride out-grips krypton though much lighter (stage 2).
  holds(SUB.HCl.M < SUB.Kr.M / 2 && SUB.HCl.grip > SUB.Kr.grip, `${q} stage 2: hydrogen chloride does not beat krypton`);
  // The stage 7 answer: both O–H bonds of every molecule, 463 kJ each, against 40.65 kJ.
  near(mod.CHECKS.BOND_VS_GRIP, (2 * 463) / 40.65, 1e-6, `${q} stage 7 (the ratio)`);
  holds(mod.CHECKS.BOND_VS_GRIP > 20 && mod.CHECKS.BOND_VS_GRIP < 25, `${q} stage 7: the ratio is outside what the typed field expects`);
  // Ions: charge density orders them (Marcus 1997).
  same(mod.CHECKS.IONS_BY_OUT.join(), 'K+,Na+,Li+,Mg2+', `${q} stage 5 (the rank)`);
  // The sealed samples: each is a real substance and its tray is its strongest force.
  for (const s of mod.CHECKS.SEALED) {
    const force = SUB[s.sub].force;
    same(force === 'dipole' ? 'dipole' : force, s.tray, `${q} stage 8 (${s.id}'s tray)`);
  }
  // The predict stage shows no instrument; a rank stage is not solved by its start order.
  holds(!Object.keys(start(mod, 2).fixtures).length, `${q} stage 3: the predict stage shows an instrument`);
  for (const i of [0, 1, 3, 4, 5]) holds(mod.STAGES[i].check(mod.stateFor(i, {})).ok !== true, `${q} stage ${i + 1}: the untouched table passes`);
  void done;
}
