/**
 * thorn-scenes/q4-groups.js — the drawn molecules and reactions of Thornmere's fourth bench (Functional Groups), registered with
 * `thorndata.addScenes` / `addPlays`. CH₃ is drawn as a labelled group where its own hydrogens play no part.
 */

import { addScenes, addPlays } from '../thorndata.js';

const H = (x, y) => ({ el: 'H', x, y });
const Cc = (x, y, o = {}) => ({ el: 'C', x, y, ...o });
const O = (x, y, o = {}) => ({ el: 'O', x, y, ...o });
const N = (x, y, o = {}) => ({ el: 'N', x, y, ...o });
const CH3 = (x, y) => ({ el: 'C', x, y, label: 'CH₃' });

/* Ethanol, every atom drawn (the first stage's picture to tap). */
const ethanol = {
  atoms: {
    c1: Cc(0, 0), c2: Cc(1.3, 0), o: O(2.4, 0.6), ho: H(3.25, 0.15),
    h1: H(-0.9, 0), h2: H(0, 0.95), h3: H(0, -0.95), h4: H(1.3, -0.95), h5: H(1.0, 0.95)
  },
  bonds: [['c1', 'c2', 1], ['c2', 'o', 1], ['o', 'ho', 1], ['c1', 'h1', 1], ['c1', 'h2', 1], ['c1', 'h3', 1], ['c2', 'h4', 1], ['c2', 'h5', 1]],
  lone: [['o', 90], ['o', 200]]
};

/* Propanone, (CH₃)₂C=O, with its pairs. */
const propanone = {
  atoms: { m1: CH3(-1.2, -0.7), c: Cc(0, 0), m2: CH3(1.2, -0.7), o: O(0, 1.3) },
  bonds: [['m1', 'c', 1], ['c', 'm2', 1], ['c', 'o', 2]],
  lone: [['o', 45], ['o', 135]]
};

/* The ethanoate ion, before and after its charged oxygen's spare pair moves in (and the C=O pair moves out onto the other oxygen). */
const ethanoate0 = {
  atoms: { m: CH3(-1.3, 0), c: Cc(0, 0), o1: O(0.75, 1.1), o2: O(0.75, -1.1, { q: -1 }) },
  bonds: [['m', 'c', 1], ['c', 'o1', 2], ['c', 'o2', 1]],
  lone: [['o1', 60], ['o1', 150], ['o2', -10], ['o2', -90], ['o2', 200]]
};
const ethanoate1 = {
  atoms: { m: CH3(-1.3, 0), c: Cc(0, 0), o1: O(0.75, 1.1, { q: -1 }), o2: O(0.75, -1.1) },
  bonds: [['m', 'c', 1], ['c', 'o1', 1], ['c', 'o2', 2]],
  lone: [['o1', 60], ['o1', 150], ['o1', 10], ['o2', -10], ['o2', -90]]
};

/* Methylamine meets a water molecule: nitrogen's lone pair takes a proton, and the O–H pair stays on oxygen. */
const amine0 = {
  atoms: {
    m: CH3(-1.3, 0), n: N(0, 0), hn1: H(0, -0.95), hn2: H(-0.35, 0.9),
    o: O(2.6, 0), hw1: H(1.65, 0.15), hw2: H(3.1, 0.8)
  },
  bonds: [['m', 'n', 1], ['n', 'hn1', 1], ['n', 'hn2', 1], ['o', 'hw1', 1], ['o', 'hw2', 1]],
  lone: [['n', 30], ['o', -40], ['o', -120]]
};
const amine1 = {
  atoms: {
    m: CH3(-1.3, 0), n: N(0, 0, { q: 1 }), hn1: H(0, -0.95), hn2: H(-0.35, 0.9),
    o: O(2.9, 0.1, { q: -1 }), hw1: H(0.85, 0.5), hw2: H(3.4, 0.9)
  },
  bonds: [['m', 'n', 1], ['n', 'hn1', 1], ['n', 'hn2', 1], ['n', 'hw1', 1], ['o', 'hw2', 1]],
  lone: [['o', -40], ['o', -120], ['o', 180]]
};

addScenes({
  ethanol, propanone, 'ethanoate-0': ethanoate0, 'ethanoate-1': ethanoate1, 'amine-0': amine0, 'amine-1': amine1
});

addPlays({
  'ethanoate-shift': { scenes: ['ethanoate-0', 'ethanoate-1'], arrows: [[{ src: 'l:o2:2', dst: 'c' }, { src: 'p:c-o1', dst: 'o1' }]] },
  'amine-water': { scenes: ['amine-0', 'amine-1'], arrows: [[{ src: 'l:n:0', dst: 'hw1' }, { src: 's:o-hw1', dst: 'o' }]] }
});
