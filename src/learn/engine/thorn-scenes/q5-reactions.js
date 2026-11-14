/**
 * thorn-scenes/q5-reactions.js — the drawn reactions of Thornmere's fifth bench (Making and Breaking), registered with
 * `thorndata.addScenes` / `addPlays`. Groups whose own hydrogens play no part are drawn as labels (CH₃, C₂H₅).
 *
 * SIMPLIFICATIONS, each said under the view that shows it: proton moves between oxygens are left out of the ester and hydrolysis
 * pictures; the hydrolysis is drawn as one move although it passes through a carbon holding four groups.
 */

import { addScenes, addPlays } from '../thorndata.js';

const H = (x, y) => ({ el: 'H', x, y });
const Cc = (x, y, o = {}) => ({ el: 'C', x, y, ...o });
const O = (x, y, o = {}) => ({ el: 'O', x, y, ...o });
const N = (x, y, o = {}) => ({ el: 'N', x, y, ...o });
const Br = (x, y, o = {}) => ({ el: 'Br', x, y, ...o });
const Cl = (x, y, o = {}) => ({ el: 'Cl', x, y, ...o });
const G = (label, x, y) => ({ el: 'C', x, y, label });

addScenes({
  /* The predict clip's neighbouring case: ammonia's lone pair takes the hydrogen of H–Cl. */
  'nh3-hcl-0': {
    atoms: { n: N(0, 0), a1: H(-0.6, 0.75), a2: H(-0.6, -0.75), a3: H(-0.95, 0), h: H(1.6, 0), cl: Cl(2.9, 0) },
    bonds: [['n', 'a1', 1], ['n', 'a2', 1], ['n', 'a3', 1], ['h', 'cl', 1]],
    lone: [['n', 0], ['cl', 0], ['cl', 90], ['cl', 270]]
  },
  'nh3-hcl-1': {
    atoms: { n: N(0, 0, { q: 1 }), a1: H(-0.6, 0.75), a2: H(-0.6, -0.75), a3: H(-0.95, 0), h: H(0.95, 0), cl: Cl(3.0, 0, { q: -1 }) },
    bonds: [['n', 'a1', 1], ['n', 'a2', 1], ['n', 'a3', 1], ['n', 'h', 1]],
    lone: [['cl', 0], ['cl', 90], ['cl', 270], ['cl', 180]]
  },

  /* Hydroxide meets bromoethane: the pair arrives opposite bromine and the C–Br pair leaves with bromine. */
  'sub-0': {
    atoms: { c: Cc(0, 0), br: Br(1.4, 0), m: G('CH₃', -0.6, 0.85), h1: H(-0.55, -0.8), h2: H(0.25, 0.95), o: O(-2.4, 0, { q: -1 }), ho: H(-3.3, 0) },
    bonds: [['c', 'br', 1], ['c', 'm', 1], ['c', 'h1', 1], ['c', 'h2', 1], ['o', 'ho', 1]],
    lone: [['o', 0], ['o', 90], ['o', 270], ['br', 0], ['br', 90], ['br', 270]]
  },
  'sub-1': {
    atoms: { c: Cc(0, 0), br: Br(2.9, 0, { q: -1 }), m: G('CH₃', 0.6, 0.85), h1: H(0.55, -0.8), h2: H(-0.25, 0.95), o: O(-1.35, 0), ho: H(-2.25, 0) },
    bonds: [['c', 'o', 1], ['c', 'm', 1], ['c', 'h1', 1], ['c', 'h2', 1], ['o', 'ho', 1]],
    lone: [['o', 90], ['o', 270], ['br', 0], ['br', 90], ['br', 270], ['br', 180]]
  },

  /* Ethanol meets ethanoic acid. Step one: ethanol's oxygen pair moves to the C=O carbon, and the C=O pair moves out onto oxygen. Step two:
     that pair moves back, and the acid's –OH leaves with a hydrogen as water. */
  'est-0': {
    atoms: {
      m: G('CH₃', -1.3, 0.2), c: Cc(0, 0), o1: O(0.6, 1.15), o2: O(0.2, -1.3), h2: H(-0.6, -1.75),
      oe: O(2.2, -0.1), e: G('C₂H₅', 3.35, 0.45), he: H(2.5, -1.0)
    },
    bonds: [['m', 'c', 1], ['c', 'o1', 2], ['c', 'o2', 1], ['o2', 'h2', 1], ['oe', 'e', 1], ['oe', 'he', 1]],
    lone: [['oe', 175], ['oe', 280], ['o1', 60], ['o1', 150], ['o2', 0], ['o2', 260]]
  },
  'est-1': {
    atoms: {
      m: G('CH₃', -1.3, 0.2), c: Cc(0, 0), o1: O(0.6, 1.15, { q: -1 }), o2: O(0.2, -1.3), h2: H(-0.6, -1.75),
      oe: O(1.35, -0.2, { q: 1 }), e: G('C₂H₅', 2.5, 0.35), he: H(1.65, -1.1)
    },
    bonds: [['m', 'c', 1], ['c', 'o1', 1], ['c', 'o2', 1], ['o2', 'h2', 1], ['c', 'oe', 1], ['oe', 'e', 1], ['oe', 'he', 1]],
    lone: [['oe', 280], ['o1', 60], ['o1', 150], ['o1', 250], ['o2', 0], ['o2', 260]]
  },
  'est-2': {
    atoms: {
      m: G('CH₃', -1.3, 0.2), c: Cc(0, 0), o1: O(0.6, 1.15), o2: O(0.5, -2.5), h2: H(-0.3, -2.95),
      oe: O(1.35, -0.2), e: G('C₂H₅', 2.5, 0.35), he: H(1.35, -2.95)
    },
    bonds: [['m', 'c', 1], ['c', 'o1', 2], ['c', 'oe', 1], ['oe', 'e', 1], ['o2', 'h2', 1], ['o2', 'he', 1]],
    lone: [['oe', 280], ['o1', 60], ['o1', 150], ['o2', 0], ['o2', 180]]
  },

  /* Hydroxide meets the ester: its pair moves to the C=O carbon and the link's C–O pair leaves with the alcohol's oxygen. */
  'hyd-0': {
    atoms: { m: G('CH₃', -1.3, 0.2), c: Cc(0, 0), o1: O(0.6, 1.15), oe: O(1.35, -0.2), e: G('C₂H₅', 2.5, 0.35), ox: O(0, -2.1, { q: -1 }), hx: H(-0.85, -2.5) },
    bonds: [['m', 'c', 1], ['c', 'o1', 2], ['c', 'oe', 1], ['oe', 'e', 1], ['ox', 'hx', 1]],
    lone: [['ox', 90], ['ox', 0], ['ox', 200], ['o1', 60], ['o1', 150], ['oe', 280], ['oe', 330]]
  },
  'hyd-1': {
    atoms: { m: G('CH₃', -1.3, 0.2), c: Cc(0, 0), o1: O(0.6, 1.15), oe: O(2.5, -0.9, { q: -1 }), e: G('C₂H₅', 3.6, -0.35), ox: O(0.1, -1.3), hx: H(-0.75, -1.7) },
    bonds: [['m', 'c', 1], ['c', 'o1', 2], ['c', 'ox', 1], ['oe', 'e', 1], ['ox', 'hx', 1]],
    lone: [['ox', 0], ['ox', 200], ['o1', 60], ['o1', 150], ['oe', 280], ['oe', 330], ['oe', 200]]
  },

  /* Three new reactions to sort (atoms only, no arrows). */
  'rx-add-0': {
    atoms: { a: G('CH₂', 0, 0), b: Cc(1.3, 0), bh: H(1.6, -0.9), m: G('CH₃', 2.45, 0.55), h: H(0.3, 1.9), cl: Cl(1.6, 1.9) },
    bonds: [['a', 'b', 2], ['b', 'bh', 1], ['b', 'm', 1], ['h', 'cl', 1]],
    lone: []
  },
  'rx-add-1': {
    atoms: { a: G('CH₂', 0, 0), b: Cc(1.3, 0), bh: H(1.6, -0.9), m: G('CH₃', 2.45, 0.55), h: H(-0.4, 0.95), cl: Cl(1.3, 1.35) },
    bonds: [['a', 'b', 1], ['b', 'bh', 1], ['b', 'm', 1], ['a', 'h', 1], ['b', 'cl', 1]],
    lone: []
  },
  'rx-sub-0': {
    atoms: { m: G('CH₃', 0, 0), cl: Cl(1.4, 0), o: O(-1.7, 0, { q: -1 }), h: H(-2.6, 0) },
    bonds: [['m', 'cl', 1], ['o', 'h', 1]],
    lone: []
  },
  'rx-sub-1': {
    atoms: { m: G('CH₃', 0, 0), cl: Cl(2.8, 0, { q: -1 }), o: O(-1.35, 0), h: H(-2.25, 0) },
    bonds: [['m', 'o', 1], ['o', 'h', 1]],
    lone: []
  },
  'rx-cond-0': {
    atoms: {
      m: G('CH₃', -1.3, 0.2), c: Cc(0, 0), o1: O(0.6, 1.15), o2: O(0.4, -1.2), h2: H(-0.3, -1.75),
      n: N(2.3, -0.1), mn: G('CH₃', 3.4, 0.45), hn: H(2.5, 0.85), hn2: H(2.6, -1.0)
    },
    bonds: [['m', 'c', 1], ['c', 'o1', 2], ['c', 'o2', 1], ['o2', 'h2', 1], ['n', 'mn', 1], ['n', 'hn', 1], ['n', 'hn2', 1]],
    lone: []
  },
  'rx-cond-1': {
    atoms: {
      m: G('CH₃', -1.3, 0.2), c: Cc(0, 0), o1: O(0.6, 1.15), o2: O(0.6, -2.5), h2: H(-0.2, -2.95),
      n: N(1.35, -0.2), mn: G('CH₃', 2.45, 0.35), hn: H(1.4, -1.15), hn2: H(1.4, -2.95)
    },
    bonds: [['m', 'c', 1], ['c', 'o1', 2], ['c', 'n', 1], ['n', 'mn', 1], ['n', 'hn', 1], ['o2', 'h2', 1], ['o2', 'hn2', 1]],
    lone: []
  },

  /* 1,2-Dibromo-2-methylpropane, with its pairs: two carbons bonded to bromine, one with two hydrogens, one with two CH₃ groups. */
  dibromo: {
    atoms: {
      c1: Cc(0, 0), b1: Br(-0.2, 1.35), h1: H(-0.9, -0.3), h2: H(0.2, -0.95),
      c2: Cc(1.4, 0.2), b2: Br(1.6, 1.6), m1: G('CH₃', 2.5, -0.5), m2: G('CH₃', 1.6, -1.2)
    },
    bonds: [['c1', 'c2', 1], ['c1', 'b1', 1], ['c1', 'h1', 1], ['c1', 'h2', 1], ['c2', 'b2', 1], ['c2', 'm1', 1], ['c2', 'm2', 1]],
    lone: [['b1', 90], ['b1', 180], ['b2', 90], ['b2', 20]]
  }
});

addPlays({
  'nh3-hcl': { scenes: ['nh3-hcl-0', 'nh3-hcl-1'], arrows: [[{ src: 'l:n:0', dst: 'h' }, { src: 's:h-cl', dst: 'cl' }]] },
  'sub-oh': { scenes: ['sub-0', 'sub-1'], arrows: [[{ src: 'l:o:0', dst: 'c' }, { src: 's:c-br', dst: 'br' }]] },
  'ester-make': {
    scenes: ['est-0', 'est-1', 'est-2'],
    arrows: [
      [{ src: 'l:oe:0', dst: 'c' }, { src: 'p:c-o1', dst: 'o1' }],
      [{ src: 'l:o1:2', dst: 'c', bond: true }, { src: 's:c-o2', dst: 'o2' }]
    ]
  },
  'ester-break': { scenes: ['hyd-0', 'hyd-1'], arrows: [[{ src: 'l:ox:0', dst: 'c' }, { src: 's:c-oe', dst: 'oe' }]] },
  'rx-add': { scenes: ['rx-add-0', 'rx-add-1'], arrows: [[]] },
  'rx-sub': { scenes: ['rx-sub-0', 'rx-sub-1'], arrows: [[]] },
  'rx-cond': { scenes: ['rx-cond-0', 'rx-cond-1'], arrows: [[]] }
});
