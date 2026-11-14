/**
 * thorn-scenes/q6-polymers.js — the drawn chains of Thornmere's sixth bench (Long Chains), registered with `thorndata.addScenes` /
 * `addPlays`, built by small generators so every unit of a chain is drawn the same way.
 *
 *   chain-*   an electron-poor starter and three molecules of 2-methylpropene, CH₂=C(CH₃)₂, which join one at a time: each joins as the
 *             second pair of its double bond moves to the chain's electron-poor end, and its far carbon becomes the new end. (This
 *             monomer really does join this way; polyethene itself is made by other routes, and the bench does not claim otherwise.)
 *   cond-*    two-ended monomers, A (an acid at each end) and B (an alcohol at each end), joining in a row; each join gives off one
 *             water molecule, which stays where it fell.
 *   gly-*     two molecules of glycine joining through an amide link (proton moves left out, as on the ester bench).
 *   pvc, polyester, polyamide   stretches of chain to read or cut.
 */

import { addScenes, addPlays } from '../thorndata.js';

const H = (x, y) => ({ el: 'H', x, y });
const Cc = (x, y, o = {}) => ({ el: 'C', x, y, ...o });
const O = (x, y, o = {}) => ({ el: 'O', x, y, ...o });
const N = (x, y, o = {}) => ({ el: 'N', x, y, ...o });
const Cl = (x, y) => ({ el: 'Cl', x, y });
const G = (label, x, y, o = {}) => ({ el: 'C', x, y, label, ...o });

/* ------------------------------------------------------------------ addition: the chain grows */

const UNIT = 2.6; const WAIT = 3.0;
/** The chain after `joined` monomers have joined (0 to 3). */
function chainScene(joined) {
  const atoms = { r: G('R', -1.2, 0), c0: Cc(0, 0, { q: joined === 0 ? 1 : 0 }), s1: G('CH₃', 0, 1.05), s2: G('CH₃', 0, -1.05) };
  const bonds = [['r', 'c0', 1], ['c0', 's1', 1], ['c0', 's2', 1]];
  for (let k = 1; k <= 3; k++) {
    const on = k <= joined;
    const dy = on ? 0 : -WAIT;
    const ax = UNIT * k - 1.3; const bx = UNIT * k;
    atoms[`a${k}`] = G('CH₂', ax, dy);
    atoms[`b${k}`] = Cc(bx, dy, { q: on && k === joined ? 1 : 0 });
    atoms[`m${k}`] = G('CH₃', bx, dy + 1.05);
    atoms[`n${k}`] = G('CH₃', bx, dy - 1.05);
    bonds.push([`a${k}`, `b${k}`, on ? 1 : 2], [`b${k}`, `m${k}`, 1], [`b${k}`, `n${k}`, 1]);
    if (on) bonds.push([k === 1 ? 'c0' : `b${k - 1}`, `a${k}`, 1]);
  }
  return { atoms, bonds, lone: [] };
}
for (let j = 0; j <= 3; j++) addScenes({ [`chain-${j}`]: chainScene(j) });
const joinArrow = k => [{ src: `p:a${k}-b${k}`, dst: k === 1 ? 'c0' : `b${k - 1}` }];
addPlays({
  'chain-grow': { scenes: ['chain-0', 'chain-1', 'chain-2', 'chain-3'], arrows: [joinArrow(1), joinArrow(2), joinArrow(3)] },
  'chain-step2': { scenes: ['chain-1', 'chain-2'], arrows: [joinArrow(2)] }
});

/* ------------------------------------------------------------------ condensation: the maker */

/** Four two-ended monomers A, B, A, B; `links` of them joined, each join dropping one water molecule below the row. */
function condScene(links) {
  const atoms = {}; const bonds = [];
  for (let i = 0; i < 4; i++) {
    atoms[`u${i}`] = G(i % 2 ? 'B' : 'A', i * 2.2 + Math.max(0, i - links) * 0.9, 0);
    if (i > 0 && i <= links) bonds.push([`u${i - 1}`, `u${i}`, 1]);
  }
  // A water molecule not yet given off is part of the monomers' ends: it is drawn only once it has fallen.
  for (let w = 1; w <= links; w++) atoms[`w${w}`] = G('H₂O', (w - 1) * 2.2 + 1.1, -2.0);
  return { atoms, bonds, lone: [] };
}
for (let l = 0; l <= 3; l++) addScenes({ [`cond-${l}`]: condScene(l) });
addPlays({ 'cond-chain': { scenes: ['cond-0', 'cond-1', 'cond-2', 'cond-3'], arrows: [[], [], []] } });

/* ------------------------------------------------------------------ amino acids */

/* Glycine 1 (acid end on the right) and glycine 2 (amine end on the left), facing each other. */
const gly0 = {
  atoms: {
    n1: N(-3.4, 0), a1: H(-4.1, 0.65), b1: H(-4.1, -0.65), ca1: G('CH₂', -2.25, 0.4),
    c1: Cc(-1.0, 0), o1: O(-0.5, 1.15), oh1: O(-0.4, -1.2), hh1: H(-1.1, -1.75),
    n2: N(1.0, 0.1), hn2: H(1.3, 1.0), hn3: H(1.15, -0.85), ca2: G('CH₂', 2.25, 0.45),
    c2: Cc(3.4, 0), o2: O(3.9, 1.15), oh2: O(4.0, -1.1), hh2: H(4.85, -1.3)
  },
  bonds: [
    ['n1', 'a1', 1], ['n1', 'b1', 1], ['n1', 'ca1', 1], ['ca1', 'c1', 1], ['c1', 'o1', 2], ['c1', 'oh1', 1], ['oh1', 'hh1', 1],
    ['n2', 'hn2', 1], ['n2', 'hn3', 1], ['n2', 'ca2', 1], ['ca2', 'c2', 1], ['c2', 'o2', 2], ['c2', 'oh2', 1], ['oh2', 'hh2', 1]
  ],
  lone: [['n1', 180], ['n2', 180], ['o1', 60], ['o1', 150], ['oh1', 0], ['oh1', 250], ['o2', 60], ['o2', 150], ['oh2', 250], ['oh2', 330]]
};
const gly1 = {
  atoms: { ...gly0.atoms, n2: N(0.35, 0.1, { q: 1 }), o1: O(-0.5, 1.15, { q: -1 }) },
  bonds: gly0.bonds.map(b => (b[0] === 'c1' && b[1] === 'o1' ? ['c1', 'o1', 1] : b)).concat([['c1', 'n2', 1]]),
  lone: [['n1', 180], ['o1', 60], ['o1', 150], ['o1', 250], ['oh1', 0], ['oh1', 250], ['o2', 60], ['o2', 150], ['oh2', 250], ['oh2', 330]]
};
const gly2 = {
  atoms: { ...gly0.atoms, n2: N(0.35, 0.1), oh1: O(-0.6, -2.6), hh1: H(-1.4, -3.0), hn3: H(0.2, -3.0) },
  bonds: gly0.bonds.filter(b => !(b[0] === 'c1' && b[1] === 'oh1') && !(b[0] === 'n2' && b[1] === 'hn3')).concat([['c1', 'n2', 1], ['oh1', 'hn3', 1]]),
  lone: [['n1', 180], ['o1', 60], ['o1', 150], ['oh1', 0], ['oh1', 180], ['o2', 60], ['o2', 150], ['oh2', 250], ['oh2', 330]]
};
addScenes({ 'gly-0': gly0, 'gly-1': gly1, 'gly-2': gly2 });
addPlays({
  'gly-join': {
    scenes: ['gly-0', 'gly-1', 'gly-2'],
    arrows: [
      [{ src: 'l:n2:0', dst: 'c1' }, { src: 'p:c1-o1', dst: 'o1' }],
      [{ src: 'l:o1:2', dst: 'c1', bond: true }, { src: 's:c1-oh1', dst: 'oh1' }]
    ]
  }
});

/* ------------------------------------------------------------------ stretches of chain */

/** A zigzag stretch: `units` of [carbon groups], each carbon `{ id, sub: [[el or label, dx, dy], ...] }`, with loose ends. */
function stretch(carbons) {
  const atoms = { e0: G('···', -1.0, 0.3) }; const bonds = [];
  let prev = 'e0';
  carbons.forEach((c, i) => {
    const x = i * 1.15; const y = i % 2 ? 0.45 : -0.05;
    atoms[c.id] = c.label ? G(c.label, x, y) : Cc(x, y);
    bonds.push([prev, c.id, c.order || 1]);
    (c.sub || []).forEach(([el, dx, dy, ord], k) => {
      const id = `${c.id}s${k}`;
      atoms[id] = el.length > 2 || el.includes('₃') ? G(el, x + dx, y + dy) : { el, x: x + dx, y: y + dy };
      bonds.push([c.id, id, ord || 1]);
    });
    prev = c.id;
  });
  const last = carbons.length;
  atoms.e1 = G('···', last * 1.15 - 0.15, last % 2 ? 0.45 : -0.05);
  bonds.push([prev, 'e1', 1]);
  return { atoms, bonds, lone: [] };
}

/* PVC: –CH₂–CHCl– repeated. */
const pvc = stretch([
  { id: 'k1', label: 'CH₂' }, { id: 'k2', label: 'CH', sub: [['Cl', 0, 1.0]] },
  { id: 'k3', label: 'CH₂' }, { id: 'k4', label: 'CH', sub: [['Cl', 0, 1.0]] },
  { id: 'k5', label: 'CH₂' }, { id: 'k6', label: 'CH', sub: [['Cl', 0, 1.0]] }
]);

/* A polyester: –CO–O–CH₂–CH₂–O–CO–C₆H₄– drawn as ...–C(=O)–O–CH₂CH₂–O–C(=O)–R–... */
const polyester = (() => {
  const atoms = {
    e0: G('···', -1.1, 0), r1: G('C₆H₄', 0, 0), c1: Cc(1.35, 0.25), o1: O(1.35, 1.45), x1: O(2.6, -0.2),
    p1: G('CH₂', 3.75, 0.25), p2: G('CH₂', 4.95, -0.2), x2: O(6.1, 0.25), c2: Cc(7.3, -0.2), o2: O(7.3, -1.4), r2: G('C₆H₄', 8.6, 0.2), e1: G('···', 9.8, 0)
  };
  const bonds = [['e0', 'r1', 1], ['r1', 'c1', 1], ['c1', 'o1', 2], ['c1', 'x1', 1], ['x1', 'p1', 1], ['p1', 'p2', 1], ['p2', 'x2', 1], ['x2', 'c2', 1], ['c2', 'o2', 2], ['c2', 'r2', 1], ['r2', 'e1', 1]];
  return { atoms, bonds, lone: [['o1', 60], ['o1', 120], ['x1', 270], ['x1', 300], ['x2', 90], ['x2', 60], ['o2', 240], ['o2', 300]] };
})();

/* A polyamide (the armour of the gate): ...–C(=O)–NH–R–NH–C(=O)–R–... */
const polyamide = (() => {
  const atoms = {
    e0: G('···', -1.1, 0), r1: G('C₄H₈', 0, 0), c1: Cc(1.35, 0.25), o1: O(1.35, 1.45), n1: N(2.6, -0.2), h1: H(2.6, -1.15),
    p1: G('C₆H₁₂', 3.95, 0.25), n2: N(5.3, -0.2), h2: H(5.3, -1.15), c2: Cc(6.55, 0.25), o2: O(6.55, 1.45), r2: G('C₄H₈', 7.9, 0), e1: G('···', 9.1, 0)
  };
  const bonds = [['e0', 'r1', 1], ['r1', 'c1', 1], ['c1', 'o1', 2], ['c1', 'n1', 1], ['n1', 'h1', 1], ['n1', 'p1', 1], ['p1', 'n2', 1], ['n2', 'h2', 1], ['n2', 'c2', 1], ['c2', 'o2', 2], ['c2', 'r2', 1], ['r2', 'e1', 1]];
  return { atoms, bonds, lone: [['o1', 60], ['o1', 120], ['n1', 330], ['n2', 210], ['o2', 60], ['o2', 120]] };
})();

/* An amide link alone, with its pairs: CH₃–C(=O)–NH–CH₃ (the boss's fourth phase). */
const amide = {
  atoms: { m1: G('CH₃', -1.3, 0.2), c: Cc(0, 0), o: O(0.6, 1.15), n: N(1.25, -0.35), h: H(1.2, -1.3), m2: G('CH₃', 2.5, 0.2) },
  bonds: [['m1', 'c', 1], ['c', 'o', 2], ['c', 'n', 1], ['n', 'h', 1], ['n', 'm2', 1]],
  lone: [['o', 60], ['o', 150], ['n', 30]]
};

addScenes({ pvc, polyester, polyamide, amide });
