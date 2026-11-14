/**
 * thorn-scenes/q1-chains.js — the drawn molecules of Thornmere's first bench (Carbon Chains), registered with `thorndata.addScenes`.
 * One unit is one bond length. Skeletal scenes hold carbons only, on a zigzag, and are drawn with `skeletal: true`.
 */

import { addScenes, addPlays } from '../thorndata.js';

const H = (x, y) => ({ el: 'H', x, y });
const Cc = (x, y) => ({ el: 'C', x, y });

/** A skeletal zigzag of carbons `ids`, starting at (x0, y0), stepping right; returns atoms and bonds. */
function zigzag(ids, x0 = 0, y0 = 0, dir = 1) {
  const atoms = {}; const bonds = [];
  ids.forEach((id, i) => { atoms[id] = Cc(x0 + i * 0.87 * dir, y0 + (i % 2 ? 0.5 : 0)); if (i) bonds.push([ids[i - 1], id, 1]); });
  return { atoms, bonds };
}

/* Methane: one carbon alone, four hydrogens. The predict clip's neighbouring case. */
const methane = {
  atoms: { c: Cc(0, 0), h1: H(0, 1), h2: H(0, -1), h3: H(-1, 0), h4: H(1, 0) },
  bonds: [['c', 'h1', 1], ['c', 'h2', 1], ['c', 'h3', 1], ['c', 'h4', 1]],
  lone: []
};

/* Pentane as a skeletal formula: five corners and ends. */
const pentaneSkel = { ...zigzag(['c1', 'c2', 'c3', 'c4', 'c5']), lone: [] };

/* 3-Methylpentane drawn so that its longest chain is NOT the straight line: a line of four with a branch of two off the second carbon. */
const methylpentaneSkel = (() => {
  const z = zigzag(['c1', 'c2', 'c3', 'c4']);
  z.atoms.c5 = Cc(0.87, -1.0);
  z.atoms.c6 = Cc(1.74, -1.5);
  z.bonds.push(['c2', 'c5', 1], ['c5', 'c6', 1]);
  return { ...z, lone: [] };
})();
/* The briefing's case: 2-methylpropane. */
const methylpropaneSkel = (() => {
  const z = zigzag(['c1', 'c2', 'c3']);
  z.atoms.c4 = Cc(0.87, 1.5);
  z.bonds.push(['c2', 'c4', 1]);
  return { ...z, lone: [] };
})();

/* Full drawings for the debrief: ethane, propane, cyclohexane. */
const ethane = {
  atoms: { c1: Cc(0, 0), c2: Cc(1.3, 0), h1: H(-0.9, 0), h2: H(0, 0.95), h3: H(0, -0.95), h4: H(2.2, 0), h5: H(1.3, 0.95), h6: H(1.3, -0.95) },
  bonds: [['c1', 'c2', 1], ['c1', 'h1', 1], ['c1', 'h2', 1], ['c1', 'h3', 1], ['c2', 'h4', 1], ['c2', 'h5', 1], ['c2', 'h6', 1]],
  lone: []
};
const propane = {
  atoms: {
    c1: Cc(0, 0), c2: Cc(1.3, 0), c3: Cc(2.6, 0),
    h1: H(-0.9, 0), h2: H(0, 0.95), h3: H(0, -0.95), h5: H(1.3, 0.95), h6: H(1.3, -0.95), h4: H(3.5, 0), h7: H(2.6, 0.95), h8: H(2.6, -0.95)
  },
  bonds: [['c1', 'c2', 1], ['c2', 'c3', 1], ['c1', 'h1', 1], ['c1', 'h2', 1], ['c1', 'h3', 1], ['c2', 'h5', 1], ['c2', 'h6', 1], ['c3', 'h4', 1], ['c3', 'h7', 1], ['c3', 'h8', 1]],
  lone: []
};
const cyclohexane = (() => {
  const atoms = {}; const bonds = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    atoms[`c${i}`] = Cc(1.3 * Math.cos(a), 1.3 * Math.sin(a));
    atoms[`h${i}a`] = H(2.2 * Math.cos(a - 0.22), 2.2 * Math.sin(a - 0.22));
    atoms[`h${i}b`] = H(2.2 * Math.cos(a + 0.22), 2.2 * Math.sin(a + 0.22));
    bonds.push([`c${i}`, `c${(i + 1) % 6}`, 1], [`c${i}`, `h${i}a`, 1], [`c${i}`, `h${i}b`, 1]);
  }
  return { atoms, bonds, lone: [] };
})();

addScenes({
  methane,
  'skel-pentane': pentaneSkel,
  'skel-3-methylpentane': methylpentaneSkel,
  'skel-2-methylpropane': methylpropaneSkel,
  ethane, propane, cyclohexane
});

addPlays({
  'methane-still': { scenes: ['methane'], arrows: [] }
});

/** The skeletal drawings the bench asks about, as skeletons on the board's graph (for checks). */
export const SKELETAL_TARGETS = Object.freeze({ 'skel-pentane': 'pentane', 'skel-3-methylpentane': 'methylpentane3' });
