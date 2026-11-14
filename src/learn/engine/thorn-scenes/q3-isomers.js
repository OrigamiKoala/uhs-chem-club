/**
 * thorn-scenes/q3-isomers.js — the drawn molecules of Thornmere's third bench (Isomers), registered with `thorndata.addScenes`.
 * Lactic acid is drawn with its lone pairs so the fourth bench can show it with its electrons as well.
 */

import { addScenes, addPlays } from '../thorndata.js';

const H = (x, y) => ({ el: 'H', x, y });
const Cc = (x, y) => ({ el: 'C', x, y });
const O = (x, y) => ({ el: 'O', x, y });

/* Butane as a skeletal formula, for the plate beside the board. */
const skelButane = {
  atoms: { c1: Cc(0, 0), c2: Cc(0.87, 0.5), c3: Cc(1.74, 0), c4: Cc(2.61, 0.5) },
  bonds: [['c1', 'c2', 1], ['c2', 'c3', 1], ['c3', 'c4', 1]],
  lone: []
};

/* Lactic acid, CH₃–CH(OH)–COOH, every atom drawn. c2 holds H, CH₃, OH and COOH. */
const lactic = {
  atoms: {
    c1: Cc(-1.3, 0), c2: Cc(0, 0), c3: Cc(1.3, 0),
    h1: H(-2.2, 0), h2: H(-1.3, 0.95), h3: H(-1.3, -0.95),
    h4: H(0, -0.95),
    o1: O(0, 1.3), h5: H(0.85, 1.75),
    o2: O(1.95, 1.1), o3: O(2.1, -0.95), h6: H(3.0, -0.95)
  },
  bonds: [
    ['c1', 'c2', 1], ['c2', 'c3', 1], ['c1', 'h1', 1], ['c1', 'h2', 1], ['c1', 'h3', 1], ['c2', 'h4', 1],
    ['c2', 'o1', 1], ['o1', 'h5', 1], ['c3', 'o2', 2], ['c3', 'o3', 1], ['o3', 'h6', 1]
  ],
  lone: [['o1', 180], ['o1', 90], ['o2', 30], ['o2', 120], ['o3', 240], ['o3', 300]]
};

addScenes({ 'skel-butane': skelButane, lactic });
addPlays({ 'lactic-still': { scenes: ['lactic'], arrows: [] } });
