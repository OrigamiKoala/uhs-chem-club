/**
 * q6-shape.js — Ligar, bench six: MOLECULAR SHAPE.
 *
 * The sixth bench on the world and its fourth TABLETOP (plan `bench-tabletop.md`, phase T3b). A hub stands on the plate and
 * arms are dropped on it: an arm carrying an atom, or a balloon for a lone pair. They push each other apart and settle
 * where `vsepr.planDomains` puts them, and the player lays a protractor on two arms to read the angle between them as a
 * number, so nothing is judged by eye. Two stages put the hub on a frame of sockets instead, so a lone pair can be put
 * somewhere and the strain read.
 *
 *   1  set the marker to the angle two arms settle at           -> electron domain, linear
 *   2  set the marker to the angle four arms settle at          -> trigonal planar, tetrahedral, VSEPR
 *   3  build ammonia's hub as a pyramid of atoms                -> trigonal pyramidal
 *   4  set the marker to the angle in water                     -> bent
 *   5  set the marker to the domains round carbon dioxide's carbon -> (a multiple bond is one domain)
 *   6  put the lone pair where a five-domain hub feels least strain -> trigonal bipyramidal, seesaw
 *   7  put two lone pairs where a six-domain hub feels least strain -> octahedral, square planar
 *   8  tray three hubs by the shape their atoms make            -> electron geometry, molecular geometry
 *
 * EVERY SETTLING COMES FROM THE PLANNERS. An arm settles where `planDomains` puts it (ammonia's 107 degrees and water's
 * 104.5 are the real measured angles; every other shape is the ideal one), the protractor reads `angleBetween`, and the
 * frame reads `domainStrain` of what stands in its sockets, so where a lone pair sits is whatever makes the strain least.
 * `verify:learn` holds the two to each other. Nothing says where a lone pair goes.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { RIG_MOLECULES, planDomains, bondAngles, angleBetween, SHAPES } from '../../engine/vsepr.js';
import {
  domainTable, hubSet, armPiece, balloonPiece, protractorPiece, marker, markerValue, hubRead, frame, frameRead, molCard, molRead, piecesIn
} from '../../table/kits/domain.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\b(?:electron|molecular) geometr(?:y|ies)\b/i, introducedAt: 8 },
  { term: /\bsquare planar\b/i, introducedAt: 7 },
  { term: /\boctahedral\b/i, introducedAt: 7 },
  { term: /\bseesaw\b/i, introducedAt: 6 },
  { term: /\btrigonal bipyramidal\b/i, introducedAt: 6 },
  { term: /\bbent\b/i, introducedAt: 4 },
  { term: /\btrigonal pyramidal\b/i, introducedAt: 3 },
  { term: /\btetrahedral\b/i, introducedAt: 2 },
  { term: /\btrigonal planar\b/i, introducedAt: 2 },
  { term: /\bvsepr\b/i, introducedAt: 2 },
  { term: /\blinear\b/i, introducedAt: 1 },
  { term: /\b(?:electron )?domains?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q4-dots', 'unit03/q3-distance', 'unit02/q4-cloud'];

const SPEAKER = 'Vess';

/** Every piece says what it is (an arm, a balloon, a protractor, a dial named "Turn"), so no key needs a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   A hub on its plate at the left, the pieces in a tray at the right, a marker under the tray. A frame stage has the
   frame at the left and the pieces in the tray.
   ------------------------------------------------------------------ */

const HUB_AT = { x: 40, y: 32 };

const binTray = (label = 'Arms') => ({ id: 'bin', label, at: { x: 106, y: 15 }, size: { w: 52, h: 15 }, cell: 13 });

/** A hub table: the hub, the pieces in the tray, the protractor, the dial that turns the view, a marker to set. */
function hubTable({ sym, arms, label = 'Hub A', marker: mk = null, gauge = false, protractor = true }) {
  const hs = hubSet('hub', sym, HUB_AT, { label, gauge, turner: { x: 108, y: 35 } });
  const inTray = arms.map(a => ({ ...a, zone: 'tray:bin' }));
  return domainTable({
    pieces: [hs.piece, ...inTray, ...(protractor ? [protractorPiece('pr', { x: 139.5, y: 15 }, 'Reads an angle')] : [])],
    zones: { trays: [binTray('Arms')] },
    fixtures: [hs.fixture, hs.turner, ...(mk ? [marker('mark', { x: 108, y: 54 }, mk)] : [])]
  });
}

const at0 = { x: 0, y: 0 };
const A = (id, sym, mult = 1, label = null) => armPiece(id, sym, at0, mult, label);
const L = id => balloonPiece(id, at0);

/** A frame table: the frame at the left, the pieces in the tray at the right. */
function frameTable({ sym, n, pieces }) {
  const fr = frame('fr', sym, n, { x: 42, y: 32 });
  return domainTable({
    pieces: pieces.map(p => ({ ...p, zone: 'tray:bin' })),
    zones: { trays: [{ id: 'bin', label: 'Pieces', at: { x: 112, y: 18 }, size: { w: 52, h: 26 }, cell: 13 }], slots: fr.slots },
    fixtures: [fr.fixture]
  });
}

const near = (a, b, tol) => Math.abs(a - b) <= tol;
const ANGLE_TOL = 1.5;

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Two Arms',
    briefing: {
      speaker: SPEAKER,
      body: 'Drop an arm on the hub and it pushes the others as far apart as they can get; lay the protractor on one arm and then another to read the angle between them. Press Submit when the table shows your answer.'
    },
    prompt: 'Set the angle marker to the angle two arms make when they push as far apart as they can.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'X', arms: [A('a1', 'A', 1, 'Arm'), A('a2', 'A', 1, 'Arm')], marker: { label: 'Angle' } }),
    hints: [
      'Drop both arms on the hub, then lay the protractor on one arm and on the other.',
      'Compare the angle the protractor reads with how far apart two arms could possibly get.',
      'Arms that push each other as far apart as they can end up on opposite sides of the hub.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to an angle you have read.' };
      if (r.n !== 2) return { ok: false, msg: 'Drop both arms on the hub and read the angle between them with the protractor.' };
      const real = angleBetween(r.plan, 0, 1);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: v < real ? 'Lay the protractor across the two arms: they push further apart than that.' : 'Lay the protractor across the two arms: they do not get as far apart as that.' };
    },
    reward: {
      log: 'Two arms settle opposite.',
      title: 'Electron Domain, Linear',
      body: 'Each arm is a region of electrons round the hub, an electron domain. Two domains settle opposite each other, 180 degrees apart, in a linear arrangement.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Four Arms',
    prompt: 'Set the angle marker to the angle any two of four arms make in three dimensions.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'X', arms: [1, 2, 3, 4].map(i => A(`a${i}`, 'A', 1, 'Arm')), marker: { label: 'Angle' } }),
    hints: [
      'Drop the arms on one at a time, laying the protractor on a pair after each.',
      'Compare the angle with three arms to the angle with four, and turn the hub to see which arm leaves the flat.',
      'With four arms every pair makes the same angle, and it is smaller than the angle with three.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to an angle you have read.' };
      if (r.n !== 4) return { ok: false, msg: 'Drop all four arms on the hub, then read the protractor on any pair.' };
      const real = angleBetween(r.plan, 0, 1);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      if (v > real) return { ok: false, msg: 'That is the angle the arms make while they lie flat. With the fourth on, they are closer than that.' };
      return { ok: false, msg: 'With all four on the hub, lay the protractor across a pair and read it again.' };
    },
    reward: {
      log: 'Four arms leave the plane.',
      title: 'Trigonal Planar, Tetrahedral, VSEPR',
      body: 'Three domains lie flat at 120 degrees, trigonal planar; four reach the corners of a tetrahedron — a pyramid with a triangle base — at 109.5 degrees, tetrahedral. Domains arranging themselves as far apart as they can get is the idea behind VSEPR.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'The Unseen Arm',
    prompt: 'Build ammonia\'s hub so that nitrogen sits at the peak of a low pyramid of its three hydrogen atoms.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'N', label: 'Hub N', arms: [A('h1', 'H'), A('h2', 'H'), A('h3', 'H'), L('l1')], gauge: true, protractor: false }),
    hints: [
      'Drop the three hydrogen atoms on the hub, then turn it and look at how they sit round the nitrogen.',
      'Compare the height reading with the three atoms alone and with everything in the tray on the hub.',
      'The atoms make a pyramid only when something else on the hub pushes them down to one side of the nitrogen.'
    ],
    check(state) {
      const r = hubRead(state.table, 'hub');
      if (r.atoms < 3) return { ok: false, notYet: true, msg: 'Drop all three hydrogen atoms on the hub.' };
      if (r.height > 0.1) return { ok: true };
      return { ok: false, msg: 'The three atoms lie flat round the nitrogen, with the hub in their plane. Look at what else the tray holds.' };
    },
    reward: {
      log: 'A lone pair is a domain you cannot see in the shape.',
      title: 'Trigonal Pyramidal',
      body: 'A lone pair takes a domain but no atom, so three atoms and a lone pair make a molecule with its atoms in a pyramid with a triangle base, trigonal pyramidal. The lone pair points away from the atoms, out of the shape.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Two Unseen Arms',
    prompt: 'Set the angle marker to the measured bond angle between the two hydrogen atoms in water.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'O', label: 'Hub O', arms: [A('h1', 'H'), A('h2', 'H'), L('l1'), L('l2')], marker: { label: 'Angle' } }),
    hints: [
      'Drop everything in the tray on the hub, then lay the protractor on the two hydrogen atoms.',
      'Compare the angle you read with the angle the hub with four atoms made.',
      'The more lone pairs on the hub, the further the angle between the atoms falls below the four-atom value.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to an angle you have read.' };
      const hs = r.arms.map((a, i) => [a, i]).filter(([a]) => a.kind === 'arm');
      if (r.lone < 2 || hs.length < 2) return { ok: false, msg: 'Drop everything in the tray on the hub, then lay the protractor on the two hydrogen atoms.' };
      const real = angleBetween(r.plan, hs[0][1], hs[1][1]);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      if (v > real + 3) return { ok: false, msg: 'That is the angle with four atoms. These arms are not all atoms.' };
      return { ok: false, msg: 'Lay the protractor across the two hydrogen atoms with both lone pairs on, and read it again.' };
    },
    reward: {
      log: 'Lone pairs push harder.',
      title: 'Bent',
      body: 'Two atoms and two lone pairs make a bent — V-shaped — molecule. Lone pairs push harder than bonding pairs, so the angle closes below 109.5 degrees: to 107 in ammonia and 104.5 in water.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Double Arms',
    prompt: 'Set the domains marker to the number of electron domains round the carbon in carbon dioxide.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({
      sym: 'C', label: 'Hub C', arms: [A('o1', 'O', 2, 'O double'), A('o2', 'O', 2, 'O double')], marker: { label: 'Domains', max: 6 }, protractor: false
    }),
    hints: [
      'Drop both oxygen atoms on the hub and read the arms the plate counts.',
      'Compare the number of arms on the hub with the number of pairs each oxygen atom shares.',
      'Count the arms on the hub, not the pairs in the bonds.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to a number you have counted.' };
      if (r.n !== 2) return { ok: false, msg: 'Drop both oxygen atoms on the hub and read how many arms the plate counts.' };
      if (v === r.n) return { ok: true };
      return { ok: false, msg: 'However many pairs a bond holds, they sit in the same region. Count the arms that settle.' };
    },
    reward: {
      log: 'A multiple bond is one domain.',
      title: 'A Multiple Bond Is One Domain',
      body: 'However many pairs a bond holds, they sit in the same region and push as one arm. Carbon dioxide has two domains, so it is linear.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Five Arms',
    briefing: {
      speaker: SPEAKER,
      body: 'Each place on the frame is one spot a domain can take. The strain reads how hard the domains crowd each other when every place is filled.'
    },
    prompt: 'Put the lone pair where the hub feels the least strain.',
    widget: { type: 'table', label: 'The bench' },
    table: frameTable({
      sym: 'S', n: 5, pieces: [A('f1', 'F'), A('f2', 'F'), A('f3', 'F'), A('f4', 'F'), L('l1')]
    }),
    hints: [
      'Fill all five places, then move the lone pair to another place and read the strain again.',
      'Compare the strain with the lone pair at an end and at the other kind of place, and how many atoms stand closest to it.',
      'The lone pair settles where it has the fewest close neighbours, and that is where the strain is lowest.'
    ],
    check(state) {
      const r = frameRead(state.table, 'fr');
      if (!r.full) return { ok: false, notYet: true, msg: 'Fill every place on the frame.' };
      if (r.lowest) return { ok: true };
      return { ok: false, msg: `The strain reads ${r.shown} here, and the pieces can stand so that it reads less. Count how many atoms are closest to the lone pair.` };
    },
    reward: {
      log: 'The lone pair takes the roomy place.',
      title: 'Trigonal Bipyramidal, Seesaw',
      body: 'Five domains make a trigonal bipyramid: three round the middle and one above and one below. A lone pair takes a place round the middle, where it has the most room, so SF₄ is a seesaw.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Six Arms',
    prompt: 'Put the two lone pairs where the hub feels the least strain.',
    widget: { type: 'table', label: 'The bench' },
    table: frameTable({
      sym: 'Xe', n: 6, pieces: [A('f1', 'F'), A('f2', 'F'), A('f3', 'F'), A('f4', 'F'), L('l1'), L('l2')]
    }),
    hints: [
      'Fill all six places, then try the two lone pairs in different places and read the strain each time.',
      'Compare the strain with the lone pairs side by side and with them further apart, and the angle printed between them.',
      'Two lone pairs settle as far from each other as the hub allows.'
    ],
    check(state) {
      const r = frameRead(state.table, 'fr');
      if (!r.full) return { ok: false, notYet: true, msg: 'Fill every place on the frame.' };
      if (r.lowest) return { ok: true };
      return { ok: false, msg: `The strain reads ${r.shown} here, and the pieces can stand so that it reads less. Read the angle printed between the lone pairs.` };
    },
    reward: {
      log: 'The lone pairs sit opposite.',
      title: 'Octahedral, Square Planar',
      body: 'Six domains point to the corners of an octahedron — two pyramids joined at their square bases —, octahedral. When two of them are lone pairs they sit opposite each other, leaving the four atoms in a flat square, square planar.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Three Shapes',
    prompt: 'Sort each hub into the tray for the shape its atoms make.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'XeF2', { x: 32, y: 14 }, { show: ['angles'] }),
        molCard('b', 'BF3', { x: 75, y: 14 }, { show: ['angles'] }),
        molCard('c', 'XeF4', { x: 118, y: 14 }, { show: ['angles'] })
      ],
      zones: {
        trays: [
          { id: 'linear', label: 'Linear', at: { x: 22, y: 48 }, size: { w: 32, h: 26 }, cell: 26 },
          { id: 'planar', label: 'Trigonal planar', at: { x: 57, y: 48 }, size: { w: 32, h: 26 }, cell: 26 },
          { id: 'square', label: 'Square planar', at: { x: 92, y: 48 }, size: { w: 32, h: 26 }, cell: 26 },
          { id: 'octa', label: 'Octahedral', at: { x: 127, y: 48 }, size: { w: 32, h: 26 }, cell: 26 }
        ]
      }
    }),
    hints: [
      'Read the angles printed on each card: they are the angles between its atoms alone.',
      'Compare those angles with the shape that all the domains on the card make.',
      'Name the shape the atoms make, not the shape the domains make.'
    ],
    check(state) {
      const t = state.table;
      const want = { a: 'linear', b: 'planar', c: 'square' };
      const placed = Object.fromEntries(Object.keys(want).map(id => [id, ['linear', 'planar', 'square', 'octa'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(placed).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort every hub into a tray.' };
      if (Object.keys(want).every(id => placed[id] === want[id])) return { ok: true };
      return { ok: false, msg: 'One hub is in the tray for the shape of all its domains. Look at where the atoms alone sit.' };
    },
    reward: {
      log: 'Domains and atoms name different shapes.',
      title: 'Electron Geometry, Molecular Geometry',
      body: 'The electron geometry names how all the domains are arranged, and the molecular geometry names only where the atoms are. XeF₂ has a trigonal bipyramidal electron geometry but a linear molecular geometry.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  3: ['The lone pair goes on the hub too.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Domains push apart until they are as far from each other as they can get, and the arrangement they settle in fixes the shape. Lone pairs take a domain but no atom, and they squeeze the angles because they push harder.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'From a Lewis structure you can now count the domains, say how they settle, and name the shape the atoms make. A few of those shapes are symmetrical and the rest are not, and that decides which way a molecule leans.'
    },
    {
      heading: 'Next',
      body: 'The next bench puts molecules between charged plates to see which ones swing round.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the electron geometry of a central atom with four electron domains?',
    options: [
      { id: 'a', label: 'Tetrahedral' },
      { id: 'b', label: 'Trigonal planar' },
      { id: 'c', label: 'Linear' },
      { id: 'd', label: 'Octahedral' }
    ],
    answer: 'a',
    explanation: 'Four domains push to the corners of a tetrahedron, with ideal angles of 109.5 degrees.'
  },
  {
    question: 'What is the molecular geometry of NH₃?',
    options: [
      { id: 'a', label: 'Trigonal pyramidal' },
      { id: 'b', label: 'Trigonal planar' },
      { id: 'c', label: 'Tetrahedral' },
      { id: 'd', label: 'Bent' }
    ],
    answer: 'a',
    explanation: 'Nitrogen has four domains, one of them a lone pair. With three atoms only, the shape is trigonal pyramidal.'
  },
  {
    question: 'Why is the H–O–H angle in water (104.5°) smaller than the tetrahedral angle?',
    options: [
      { id: 'a', label: 'Lone pairs repel bonding pairs more strongly than bonding pairs repel each other' },
      { id: 'b', label: 'Oxygen is larger than hydrogen' },
      { id: 'c', label: 'The O–H bonds are double bonds' },
      { id: 'd', label: 'Water has no lone pairs' }
    ],
    answer: 'a',
    explanation: 'The two lone pairs on oxygen take more room than bonding pairs, squeezing the bond angle below 109.5 degrees.'
  },
  {
    question: 'How many electron domains does the carbon atom in CO₂ have?',
    options: [
      { id: 'a', label: '2' },
      { id: 'b', label: '4' },
      { id: 'c', label: '3' },
      { id: 'd', label: '1' }
    ],
    answer: 'a',
    explanation: 'Each double bond is one region of electron density, so carbon has two domains and CO₂ is linear.'
  },
  {
    question: 'What is the molecular geometry of XeF₄?',
    options: [
      { id: 'a', label: 'Square planar' },
      { id: 'b', label: 'Tetrahedral' },
      { id: 'c', label: 'Octahedral' },
      { id: 'd', label: 'Seesaw' }
    ],
    answer: 'a',
    explanation: 'Xenon has six domains, two of them lone pairs placed opposite each other. The four fluorine atoms lie in a plane.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. An arm is dropped on the hub (`on`) or a piece in a place on the frame (`put`);
   nothing here says where an arm settles or which place a lone pair belongs in.
   ------------------------------------------------------------------ */

const on = (...ids) => ids.map(id => ({ join: [id, 'hub'] }));
const read = (a, b) => [{ join: ['pr', a] }, { join: ['pr', b] }];
const set = (value, id = 'mark') => ({ setDial: { fixture: id, dial: 'value', value } });
const put = (piece, k) => ({ place: { piece, to: `slot:fr-${k}` } });
const into = (piece, id) => ({ place: { piece, to: `tray:${id}` } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [...on('a1', 'a2'), ...read('a1', 'a2'), set(180)],
  [...on('a1', 'a2', 'a3', 'a4'), ...read('a1', 'a2'), set(110)],
  [...on('h1', 'h2', 'h3', 'l1')],
  [...on('h1', 'h2', 'l1', 'l2'), ...read('h1', 'h2'), set(104)],
  [...on('o1', 'o2'), set(2)],
  [put('l1', 2), put('f1', 0), put('f2', 1), put('f3', 3), put('f4', 4)],
  [put('l1', 0), put('l2', 1), put('f1', 2), put('f2', 3), put('f3', 4), put('f4', 5)],
  [into('a', 'linear'), into('b', 'planar'), into('c', 'square')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...on('a1', 'a2'), set(120)],
  [...on('a1', 'a2', 'a3', 'a4'), set(120)],
  [...on('h1', 'h2', 'h3')],
  [...on('h1', 'h2', 'l1', 'l2'), set(110)],
  [...on('o1', 'o2'), set(4)],
  [put('l1', 0), put('f1', 1), put('f2', 2), put('f3', 3), put('f4', 4)],
  [put('l1', 0), put('l2', 2), put('f1', 1), put('f2', 3), put('f3', 4), put('f4', 5)],
  [into('a', 'planar'), into('b', 'planar'), into('c', 'octa')]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { RIG_MOLECULES, planDomains, bondAngles, SHAPES, molRead, piecesIn };
