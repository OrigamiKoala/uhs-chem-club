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

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bsquare planar\b/i, introducedAt: 7 },
  { term: /\boctahedral\b/i, introducedAt: 6 },
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
function hubTable({ sym, arms, label = 'Centre atom', marker: mk = null, gauge = false, protractor = true, roomy = false }) {
  const hs = hubSet('hub', sym, HUB_AT, { label, gauge, turner: roomy ? { x: 96, y: 31 } : { x: 108, y: 35 } });
  const inTray = arms.map(a => ({ ...a, zone: 'tray:bin' }));
  // Six or more pieces: a longer tray, and the protractor moves down beside the turn dial to make room for it.
  const tray = roomy ? { ...binTray('Arms'), at: { x: 111.3, y: 14 }, size: { w: 76.5, h: 15 }, cell: 12.7 } : binTray('Arms');
  return domainTable({
    pieces: [hs.piece, ...inTray, ...(protractor ? [protractorPiece('pr', roomy ? { x: 136, y: 33 } : { x: 139.5, y: 15 }, 'Reads an angle')] : [])],
    zones: { trays: [tray] },
    fixtures: [hs.fixture, hs.turner, ...(mk ? [marker('mark', roomy ? { x: 96, y: 50 } : { x: 108, y: 54 }, mk)] : [])]
  });
}

const at0 = { x: 0, y: 0 };
const A = (id, sym, mult = 1, label = null) => armPiece(id, sym, at0, mult, label);
const L = id => balloonPiece(id, at0);

const near = (a, b, tol) => Math.abs(a - b) <= tol;
const ANGLE_TOL = 1.5;

/** The fewest arms that cannot all lie flat on the plate: the hub's depth first reads above zero here. `verify:learn` holds it to the planner. */
const FIRST_UP = 4;

/** The smallest angle the protractor can read between two of the hub's arms that pass `keep`. */
function smallestAngle(read, keep) {
  const ids = read.arms.map((a, i) => [a, i]).filter(([a]) => keep(a)).map(([, i]) => i);
  let best = Infinity;
  for (let x = 0; x < ids.length; x++) for (let y = x + 1; y < ids.length; y++) best = Math.min(best, angleBetween(read.plan, ids[x], ids[y]));
  return best;
}

/* ------------------------------------------------------------------
   THE SEVEN STAGES
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
      model: { type: 'shape', mol: 'CO2', caption: 'CO₂ · Linear (180°)' }
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
    title: 'Leaving the Plate',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'add arms one at a time and set the marker to the fewest arms that cannot all lie flat on the plate.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'X', arms: [1, 2, 3, 4, 5].map(i => A(`a${i}`, 'A', 1, 'Arm')), marker: { label: 'Arms', max: 6 }, gauge: 'thick', protractor: false, roomy: true }),
    hints: [
      'Use the arms, the turn dial and the marker; the plate reads the depth of the arms.',
      'Add the arms one at a time and note the depth reading after each one.',
      'The answer is the number of arms at which the depth first rises above zero.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to a number of arms.' };
      if (r.n < FIRST_UP) return { ok: false, msg: 'Add more arms and watch the depth reading before you answer.' };
      if (v === FIRST_UP) return { ok: true };
      return v < FIRST_UP
        ? { ok: false, msg: 'With that many arms the depth still reads zero: they lie flat.' }
        : { ok: false, msg: 'The depth already rose above zero with fewer arms than that.' };
    },
    get reward() {
      return {
        log: 'Two and three arms lie flat; four leave the plate.',
        title: 'Tetrahedral Geometry and VSEPR',
        body: `${verdictLine(QUEST_KEY, 'solid')}Two arms lie opposite and three spread flat at 120 degrees, but four cannot: the arms leave the plane and reach the corners of a tetrahedron, 109.5 degrees apart. Laid flat they would crowd to 90 degrees. This is the idea behind VSEPR theory.`,
        model: { type: 'shape', mol: 'CH4', caption: 'CH₄ · Tetrahedral (109.5°)' }
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
      model: { type: 'shape', mol: 'NH3', caption: 'NH₃ · Trigonal pyramidal (107°)' }
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
      model: { type: 'shape', mol: 'H2O', caption: 'H₂O · Bent (104.5°)' }
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Six on the Hub',
    prompt: 'Set the angle marker to the smallest angle between two of six arms on the hub.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'X', arms: [1, 2, 3, 4, 5, 6].map(i => A(`a${i}`, 'A', 1, 'Arm')), marker: { label: 'Angle' }, roomy: true }),
    hints: [
      'Use the arms, the protractor and the angle marker.',
      'Read the angle between several different pairs of arms; the pairs do not all read the same.',
      'Attach all six arms, then compare readings between neighbouring arms and between opposite ones.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to an angle you have read.' };
      if (r.n !== 6) return { ok: false, msg: 'All six arms are not on the hub yet.' };
      const real = smallestAngle(r, a => a.kind === 'arm');
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: 'The marker does not match the smallest angle the protractor reads between two of the six arms.' };
    },
    reward: {
      log: 'Six arms settle on the corners of an octahedron.',
      title: 'Octahedral Geometry',
      body: 'Six electron domains push apart to the corners of an octahedron: every arm has four neighbours at 90° and one opposite at 180°. Sulfur hexafluoride, SF₆, has this shape and holds twelve electrons round sulfur, more than an octet.',
      model: { type: 'shape', mol: 'SF6', caption: 'SF₆ · Octahedral (90°)' }
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Two Unseen Arms on Six',
    prompt: 'Put four arms and two lone pairs on the hub, then set the marker to the smallest angle between two arms.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'X', arms: [...[1, 2, 3, 4].map(i => A(`a${i}`, 'A', 1, 'Arm')), L('l1'), L('l2')], marker: { label: 'Angle' }, roomy: true }),
    hints: [
      'Use the arms, the balloons, the protractor and the angle marker.',
      'Turn the view to see which way the two balloons point, then read angles between pairs of arms.',
      'Two balloons settle as far from each other as they can, which decides where the four arms sit.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to an angle you have read.' };
      if (r.lone < 2 || r.atoms < 4) return { ok: false, msg: 'Not everything from the tray is on the hub yet.' };
      const real = smallestAngle(r, a => a.kind === 'arm');
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: 'The marker does not match the smallest angle the protractor reads between two of the four arms.' };
    },
    reward: {
      log: 'Two lone pairs sit opposite, and the four atoms lie flat.',
      title: 'Square Planar Geometry',
      body: 'Of six domains, two lone pairs take opposite corners, leaving the four atoms in one flat square with 90° between neighbours. Xenon tetrafluoride, XeF₄, has this square planar shape.',
      model: { type: 'shape', mol: 'XeF4', caption: 'XeF₄ · Square planar (90°)' },
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
  [...on('a1', 'a2', 'a3', 'a4'), set(4)],
  [...on('h1', 'h2', 'h3', 'l1')],
  [...on('h1', 'h2', 'l1', 'l2'), ...read('h1', 'h2'), set(104)],
  [...on('a1', 'a2', 'a3', 'a4', 'a5', 'a6'), ...read('a1', 'a3'), set(90)],
  [...on('a1', 'a2', 'a3', 'a4', 'l1', 'l2'), ...read('a1', 'a3'), set(90)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...on('a1', 'a2'), set(120)],
  [],
  [...on('a1', 'a2', 'a3', 'a4'), set(3)],
  [...on('h1', 'h2', 'h3')],
  [...on('h1', 'h2', 'l1', 'l2'), set(110)],
  [...on('a1', 'a2', 'a3', 'a4', 'a5', 'a6'), set(109)],
  [...on('a1', 'a2', 'a3', 'a4', 'l1', 'l2'), set(180)]
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
