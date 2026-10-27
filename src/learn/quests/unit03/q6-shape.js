/**
 * q6-shape.js — Ligar, bench six: MOLECULAR SHAPE.
 *
 * The sixth bench on the world and its fourth TABLETOP (plan `bench-tabletop.md`, phase T3b). A hub stands on the plate and arms are
 * dropped on it: an arm carrying an atom, or a balloon for a lone pair. They push each other apart and settle where `vsepr.planDomains`
 * puts them, and the player lays a protractor on two arms to read the angle between them as a number, so nothing is judged by eye. A
 * dial turns the view of the hub, because the shape is the idea and a shape is a solid. Every reward card of this bench holds the
 * solid shape (`reward.model`, a `shape` model built from the same `planDomains`).
 *
 * THE CLICK (2026-10-23 rollout). A molecule is drawn flat on paper, so most students expect four things round a centre to lie flat like
 * a plus sign, 90 degrees apart. The quest asks for that prediction (the flat idea is two of the three cards), then lets four arms push
 * each other apart on the hub and reads the angle: they leave the flat and settle further apart than the flat cross would have them.
 *
 *   1  set the marker to the angle two arms settle at               -> arm, linear (a region of electrons round the hub is an electron domain)
 *   2  PREDICT: how far apart do four arms settle?                  (no instrument; the flat idea is a card)
 *   3  set the marker to the angle four arms settle at             -> tetrahedral, VSEPR
 *   4  build ammonia's hub as a pyramid of atoms                   -> trigonal pyramidal (a lone pair is an arm you cannot see in the shape)
 *   5  set the marker to the angle in water                        -> bent
 *
 * Cut (2026-10-23): "double arms" (a multiple bond is one arm: bench eight counts it again), the five and six arm frames (trigonal
 * bipyramidal, seesaw, octahedral, square planar: beyond a first course; the Warden still builds XeF4), and the sort by electron and
 * molecular geometry.
 *
 * EVERY SETTLING COMES FROM THE PLANNERS. An arm settles where `planDomains` puts it (ammonia's 107 degrees and water's 104.5 are the
 * real measured angles; every other shape is the ideal one), and the protractor reads `angleBetween`. `verify:learn` holds the two to
 * each other. Nothing says where a lone pair goes.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { RIG_MOLECULES, planDomains, bondAngles, angleBetween, SHAPES } from '../../engine/vsepr.js';
import {
  domainTable, hubSet, armPiece, balloonPiece, protractorPiece, marker, markerValue, hubRead, molRead, piecesIn
} from '../../table/kits/domain.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bbent\b/i, introducedAt: 5 },
  { term: /\btrigonal pyramidal\b/i, introducedAt: 4 },
  { term: /\btetrahedral\b/i, introducedAt: 3 },
  { term: /\bvsepr\b/i, introducedAt: 3 },
  { term: /\blinear\b/i, introducedAt: 1 },
  { term: /\b(?:electron )?domains?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q4-dots', 'unit03/q3-distance', 'unit02/q4-cloud'];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const QUEST_KEY = 'unit03/q6-shape';
const GUESSES = [
  ['cross', 'the four arms lie flat, 90 degrees apart', ['Flat cross', 'the arms lie flat,', '90 degrees apart']],
  ['solid', 'the four arms spread out in 3D, about 109 degrees apart', ['Spread in 3D', 'the arms leave the flat,', 'about 109 degrees']],
  ['triangle', 'the four arms lie flat, 120 degrees apart', ['Flat spread', 'the arms lie flat,', '120 degrees apart']]
];

/** Every piece says what it is (an arm, a balloon, a protractor, a dial named "Turn"), so no key needs a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   A hub on its plate at the left, the pieces in a tray at the right, a marker under the tray.
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

const near = (a, b, tol) => Math.abs(a - b) <= tol;
const ANGLE_TOL = 1.5;

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Two Arms',
    prompt: 'Set the angle marker to the bond angle between two electron domains pushing as far apart as possible.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'X', arms: [A('a1', 'A', 1, 'Arm'), A('a2', 'A', 1, 'Arm')], marker: { label: 'Angle' } }),
    hints: [
      'Use the arms, the protractor and the angle marker.',
      'Measure the angle between the two arms with the protractor.',
      'Attach both arms to the hub, measure the angle with the protractor, and set the marker to 180 degrees.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to an angle you have read.' };
      if (r.n !== 2) return { ok: false, msg: 'Both arms are not on the hub yet.' };
      const real = angleBetween(r.plan, 0, 1);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: 'The marker does not match the angle the protractor reads between the two arms.' };
    },
    reward: {
      log: 'Two arms settle opposite.',
      title: 'Linear Geometry',
      body: 'Each arm represents an electron domain around the central atom. Two electron domains orient in opposite directions at an angle of 180 degrees, producing a linear geometry.',
      model: { type: 'shape', mol: 'CO2', caption: 'Carbon dioxide: two electron domains around carbon adopt a linear geometry at 180 degrees.' }
    }
  },

  /* ---------------------------------------------------------------- 2 */
  predictStage({
    key: QUEST_KEY,
    title: 'Four Arms',
    prompt: 'What arrangement and bond angle do four electron domains adopt around a central atom?',
    cards: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Consider three-dimensional space rather than just a two-dimensional plane.',
      'Select the card matching your prediction.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'Your prediction is recorded. Attach four arms to the hub on the bench and measure the angle between them.'
    }
  }),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Four on the Hub',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'set the angle marker to the measured angle between any two of the four arms.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'X', arms: [1, 2, 3, 4].map(i => A(`a${i}`, 'A', 1, 'Arm')), marker: { label: 'Angle' } }),
    hints: [
      'Use the arms, the protractor, the turn dial and the angle marker.',
      'Rotate the hub to observe the three-dimensional arrangement of the four domains.',
      'Attach all four arms to the hub and measure the bond angle between any two arms with the protractor.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to an angle you have read.' };
      if (r.n !== 4) return { ok: false, msg: 'All four arms are not on the hub yet.' };
      const real = angleBetween(r.plan, 0, 1);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: 'The marker does not match the angle the protractor reads between two of the four arms.' };
    },
    get reward() {
      return {
        log: 'Four arms leave the plane.',
        title: 'Tetrahedral Geometry and VSEPR',
        body: `${verdictLine(QUEST_KEY, 'solid')}Four electron domains repel each other into the corners of a tetrahedron with bond angles of 109.5 degrees. This arrangement minimizes electron repulsion according to VSEPR theory.`,
        model: { type: 'shape', mol: 'CH4', caption: 'Methane molecule with tetrahedral geometry.' }
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Unseen Arm',
    prompt: 'Construct the geometry of ammonia with nitrogen at the apex and three hydrogen atoms forming the base.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'N', label: 'Hub N', arms: [A('h1', 'H'), A('h2', 'H'), A('h3', 'H'), L('l1')], gauge: true, protractor: false }),
    hints: [
      'Use the hydrogen atoms, the balloon and the turn dial.',
      'Attach the three hydrogen atoms and the lone pair balloon to the central nitrogen atom.',
      'The lone pair occupies a domain, repelling the three bonding pairs into a trigonal pyramidal shape.'
    ],
    check(state) {
      const r = hubRead(state.table, 'hub');
      if (r.atoms < 3) return { ok: false, notYet: true, msg: 'Not all three hydrogen atoms are on the hub.' };
      if (r.height > 0.1) return { ok: true };
      return { ok: false, msg: 'The three atoms lie flat round the nitrogen, and the height reads zero.' };
    },
    reward: {
      log: 'A lone pair is an arm you cannot see in the shape.',
      title: 'Trigonal Pyramidal Geometry',
      body: 'A lone pair occupies an electron domain without contributing an atom to the molecular geometry. Three bonding domains and one lone pair form a trigonal pyramidal shape with the central atom at the apex of a pyramid.',
      model: { type: 'shape', mol: 'NH3', caption: 'Ammonia molecule showing a trigonal pyramidal geometry with a lone pair on nitrogen.' }
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Two Unseen Arms',
    prompt: 'Set the angle marker to the measured bond angle between the two hydrogen atoms in water.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'O', label: 'Hub O', arms: [A('h1', 'H'), A('h2', 'H'), L('l1'), L('l2')], marker: { label: 'Angle' } }),
    hints: [
      'Use the arms, the balloons, the protractor and the angle marker.',
      'Attach two hydrogen arms and two lone pair balloons to oxygen, then measure the H-O-H angle.',
      'Lone pair repulsion reduces the bond angle below 109.5 degrees to 104.5 degrees.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to an angle you have read.' };
      const hs = r.arms.map((a, i) => [a, i]).filter(([a]) => a.kind === 'arm');
      if (r.lone < 2 || hs.length < 2) return { ok: false, msg: 'Not everything from the tray is on the hub yet.' };
      const real = angleBetween(r.plan, hs[0][1], hs[1][1]);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: 'The marker does not match the angle the protractor reads between the two hydrogen atoms.' };
    },
    reward: {
      log: 'Lone pairs push harder.',
      title: 'Bent Molecular Geometry',
      body: 'Two bonding domains and two lone pairs produce a bent molecular geometry. Because lone pair electrons exert stronger electrostatic repulsion than bonding pairs, the bond angle compresses to 104.5 degrees in water.',
      model: { type: 'shape', mol: 'H2O', caption: 'Water molecule with a bent molecular geometry and a 104.5 degree bond angle.' },
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'Summary',
      body: 'VSEPR theory explains molecular geometry based on electron domain repulsion. Nonbonding lone pairs repel more strongly than bonding pairs, compressing adjacent bond angles.'
    },
    {
      heading: 'Geometry Determination',
      body: 'Counting electron domains on the central atom gives the electron geometry, while the arrangement of bonded atoms determines the molecular geometry.'
    },
    {
      heading: 'Next',
      body: 'The next bench tests molecular polarity by observing how molecules behave in an electric field.'
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
   direct actions, by drag and by two taps. An arm is dropped on the hub (`on`); nothing here says where an arm settles.
   ------------------------------------------------------------------ */

const on = (...ids) => ids.map(id => ({ join: [id, 'hub'] }));
const read = (a, b) => [{ join: ['pr', a] }, { join: ['pr', b] }];
const set = (value, id = 'mark') => ({ setDial: { fixture: id, dial: 'value', value } });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [...on('a1', 'a2'), ...read('a1', 'a2'), set(180)],
  [guess('solid')],
  [...on('a1', 'a2', 'a3', 'a4'), ...read('a1', 'a2'), set(110)],
  [...on('h1', 'h2', 'h3', 'l1')],
  [...on('h1', 'h2', 'l1', 'l2'), ...read('h1', 'h2'), set(104)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...on('a1', 'a2'), set(120)],
  [],
  [...on('a1', 'a2', 'a3', 'a4'), set(90)],
  [...on('h1', 'h2', 'h3')],
  [...on('h1', 'h2', 'l1', 'l2'), set(110)]
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
