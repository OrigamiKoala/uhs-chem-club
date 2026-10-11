/**
 * bonddata.js — The real numbers behind Ligar's bond bench.
 *
 * PURE. No DOM, no canvas, so `verify:learn` can import it and hold every figure
 * a stage grades against to this table, the way `lightdata.js` holds Lanternfall.
 *
 * WHAT IS MEASURED AND WHAT IS A MODEL. The bond length (`r0`, pm) and the bond
 * energy (`de`, kJ/mol) of each pair are measured quantities, the textbook
 * values. The CURVE between them is a Morse curve, the standard one-line model
 * of a bond: its depth and the place of its bottom are the measurements, and its
 * width (`k`) is a stiffness chosen to look right for each bond order (a stiffer
 * bond has a narrower well). The curve is never used to GRADE a width; stages
 * ask about the bottom, the depth and the order the wells come in.
 *
 * The ionic lattices carry real ion radii (Shannon, pm) and real lattice energies
 * and melting points, so the charge-and-size readout is the same evidence a
 * chemist reads.
 */

/** Covalent radius in pm, used only to size the discs on the plate. */
export const DISC_RADIUS = { H: 31, C: 76, N: 71, O: 66, F: 57, Cl: 102 };

/**
 * Bonded pairs. `order` is the number of shared pairs. `r0` in pm and `de` in
 * kJ/mol are measured; `k` (per pm) is the Morse width.
 */
export const PAIRS = {
  'H-H': { id: 'H-H', label: 'H–H', a: 'H', b: 'H', order: 1, r0: 74, de: 436, k: 0.0194 },
  'Cl-Cl': { id: 'Cl-Cl', label: 'Cl–Cl', a: 'Cl', b: 'Cl', order: 1, r0: 199, de: 242, k: 0.0150 },
  'F-F': { id: 'F-F', label: 'F–F', a: 'F', b: 'F', order: 1, r0: 143, de: 159, k: 0.0180 },
  'H-Cl': { id: 'H-Cl', label: 'H–Cl', a: 'H', b: 'Cl', order: 1, r0: 127, de: 431, k: 0.0170 },
  'C-C': { id: 'C-C', label: 'C–C', a: 'C', b: 'C', order: 1, r0: 154, de: 348, k: 0.0170 },
  'C=C': { id: 'C=C', label: 'C=C', a: 'C', b: 'C', order: 2, r0: 134, de: 614, k: 0.0200 },
  'C#C': { id: 'C#C', label: 'C≡C', a: 'C', b: 'C', order: 3, r0: 120, de: 839, k: 0.0225 },
  'N#N': { id: 'N#N', label: 'N≡N', a: 'N', b: 'N', order: 3, r0: 110, de: 945, k: 0.0245 },
  'O=O': { id: 'O=O', label: 'O=O', a: 'O', b: 'O', order: 2, r0: 121, de: 498, k: 0.0230 }
};

/** The potential energy of a pair at separation `r` (pm), in kJ/mol; zero when parted. */
export function morse(pair, r) {
  const p = typeof pair === 'string' ? PAIRS[pair] : pair;
  const x = 1 - Math.exp(-p.k * (r - p.r0));
  return p.de * (x * x - 1);
}

/** The bottom of the well: where it sits and how deep it goes. */
export function wellOf(pair) {
  const p = typeof pair === 'string' ? PAIRS[pair] : pair;
  return { r0: p.r0, depth: p.de };
}

/**
 * What the bench reports at one setting of the crank. `state` is the word the
 * trail and the readout use, derived from where the point sits on its own curve:
 * 'squeezed' inside the bottom, 'rest' at it, 'stretched' outside it, 'parted'
 * once the well has nearly emptied.
 */
export function planCurve(pair, r) {
  const p = typeof pair === 'string' ? PAIRS[pair] : pair;
  const energy = morse(p, r);
  let state;
  if (Math.abs(r - p.r0) <= 3) state = 'rest';
  else if (r < p.r0) state = 'squeezed';
  else if (energy > -0.04 * p.de) state = 'parted';
  else state = 'stretched';
  return { r, energy: Math.round(energy * 10) / 10, state };
}

/** The lowest energy among a list of settings, and the setting it is at. */
export function lowestOf(pair, settings) {
  let best = null;
  for (const r of settings) {
    const e = morse(pair, r);
    if (!best || e < best.energy) best = { r, energy: e };
  }
  return best;
}

/** The energy axis a plate draws for a pair: from just under the well to a little above zero. */
export function energySpan(pair) {
  const p = typeof pair === 'string' ? PAIRS[pair] : pair;
  return { lo: -p.de * 1.12, hi: p.de * 0.9 };
}

/* ------------------------------------------------------------------
   IONIC LATTICES
   ------------------------------------------------------------------ */

/** Ion radii in pm (Shannon) and charges. */
export const IONS = {
  'Na+': { sym: 'Na', charge: 1, radius: 102 },
  'K+': { sym: 'K', charge: 1, radius: 138 },
  'Mg2+': { sym: 'Mg', charge: 2, radius: 72 },
  'F-': { sym: 'F', charge: -1, radius: 133 },
  'Cl-': { sym: 'Cl', charge: -1, radius: 181 },
  'O2-': { sym: 'O', charge: -2, radius: 140 }
};

/** Real lattice energies (kJ/mol) and melting points (deg C). */
export const LATTICES = {
  NaF: { id: 'NaF', label: 'NaF', cation: 'Na+', anion: 'F-', energy: 923, melts: 996 },
  NaCl: { id: 'NaCl', label: 'NaCl', cation: 'Na+', anion: 'Cl-', energy: 787, melts: 801 },
  KCl: { id: 'KCl', label: 'KCl', cation: 'K+', anion: 'Cl-', energy: 715, melts: 770 },
  MgO: { id: 'MgO', label: 'MgO', cation: 'Mg2+', anion: 'O2-', energy: 3795, melts: 2852 }
};

/** Centre-to-centre distance of the touching ions, pm. */
export function centresOf(lat) {
  const l = typeof lat === 'string' ? LATTICES[lat] : lat;
  return IONS[l.cation].radius + IONS[l.anion].radius;
}

/** Charge product over centre distance: the Coulomb index the real energies follow. */
export function coulombIndex(lat) {
  const l = typeof lat === 'string' ? LATTICES[lat] : lat;
  return Math.abs(IONS[l.cation].charge * IONS[l.anion].charge) / centresOf(l);
}

/** Lattice ids from the most strongly held to the least. */
export function byLatticeEnergy(ids) {
  return ids.slice().sort((a, b) => LATTICES[b].energy - LATTICES[a].energy);
}
