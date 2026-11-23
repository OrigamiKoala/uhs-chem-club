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

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { RIG_MOLECULES, planDomains, bondAngles, angleBetween, SHAPES } from '../../engine/vsepr.js';
import {
  domainTable, hubSet, armPiece, balloonPiece, hubRead, molRead, molCard, piecesIn
} from '../../table/kits/domain.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 11 };

export const VOCABULARY = [
  { term: /\btrigonal bipyramidal\b/i, introducedAt: 9 },
  { term: /\bsquare planar\b/i, introducedAt: 8 },
  { term: /\boctahedral\b/i, introducedAt: 7 },
  { term: /\bbent\b/i, introducedAt: 6 },
  { term: /\btrigonal pyramidal\b/i, introducedAt: 5 },
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
  ['cross', 'the four domains lie flat, 90° apart', ['Flat cross'], 'cross'],
  ['solid', 'the four domains point out in three dimensions', ['Not flat'], 'tetra'],
  ['triangle', 'three domains lie flat and the fourth points straight up', ['Three flat, one up'], 'pyramid3']
];

/** Every piece says what it is, so no key needs a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   A hub on its plate at the left, the pieces in a tray at the right (label below the tray so 3D spheres never hide it),
   and a smooth 3D joystick below the tray. Answers are typed into the entry field.
   ------------------------------------------------------------------ */

const HUB_AT = { x: 40, y: 32 };

const binTray = (label = 'Electron domains') => ({ id: 'bin', label, labelBelow: true, at: { x: 108, y: 14 }, size: { w: 56, h: 15 }, cell: 13 });

/** A hub table: the hub, the pieces in the tray, and the smooth 3D joystick. */
function hubTable({ sym, arms, label = 'Central atom', gauge = false, roomy = false }) {
  const hs = hubSet('hub', sym, HUB_AT, { label, gauge, turner: { x: 108, y: 44 } });
  const inTray = arms.map(a => ({ ...a, zone: 'tray:bin' }));
  const tray = roomy ? { ...binTray(), at: { x: 111.3, y: 14 }, size: { w: 76.5, h: 15 }, cell: 12.7 } : binTray();
  return domainTable({
    pieces: [hs.piece, ...inTray],
    zones: { trays: [tray] },
    fixtures: [hs.fixture, hs.turner]
  });
}

const at0 = { x: 0, y: 0 };
const A = (id, sym, mult = 1, label = null) => armPiece(id, sym, at0, mult, label);
const L = id => balloonPiece(id, at0);

const near = (a, b, tol) => Math.abs(a - b) <= tol;
const ANGLE_TOL = 1.5;
const ANGLE_ENTRY = { id: 'angle', label: 'Angle', unit: '°' };
const DOMAIN_ENTRY = { id: 'domains', label: 'Domains', unit: '' };


/** The smallest angle between two of the hub's arms that pass `keep`. */
function smallestAngle(read, keep) {
  const ids = read.arms.map((a, i) => [a, i]).filter(([a]) => keep(a)).map(([, i]) => i);
  let best = Infinity;
  for (let x = 0; x < ids.length; x++) for (let y = x + 1; y < ids.length; y++) best = Math.min(best, angleBetween(read.plan, ids[x], ids[y]));
  return best;
}

/* ------------------------------------------------------------------
   THE ELEVEN STAGES
   ------------------------------------------------------------------ */
/** A bond to an unnamed atom X on an unnamed central atom A, and the pieces of a stage. */
const X = i => A(`a${i}`, 'X', 1, 'Bond');
const bonds = n => Array.from({ length: n }, (_, i) => X(i + 1));
const NOT_ALL = 'Not everything from the tray is attached to the central atom yet.';
const unread = 'Type your angle measurement in the field below.';
const off = (v) => `The model's angle is not ${v}°: click two attached atoms to measure the angle between them.`;

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Two Domains',
    briefing: {
      speaker: SPEAKER,
      body: 'An electron domain is a bond or a lone pair on the central atom. Domains repel each other and spread as far apart as they can. Click two attached atoms to measure the angle between them.'
    },
    prompt: 'What is the angle between two electron domains?',
    widget: { type: 'table', label: 'The bench' },
    entry: ANGLE_ENTRY,
    table: hubTable({ sym: 'A', arms: bonds(2) }),
    hints: [
      'Drag both bonds onto the central atom, then click the two attached atoms to read the angle between them.',
      'Watch where the second bond settles when attached, and where the first one moves.',
      'Two domains that repel each other move until they point in opposite directions.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = entryNumber(t, 'angle');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: unread };
      if (r.n !== 2) return { ok: false, msg: 'Both bonds are not attached to the central atom yet.' };
      const real = angleBetween(r.plan, 0, 1);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: off(v) };
    },
    reward: {
      log: 'Two domains settle opposite.',
      title: 'Linear',
      body: '180°: the two domains point in opposite directions, as far apart as they can be. This shape is linear.',
      model: { type: 'shape', mol: 'CO2', angleLabel: '180°', caption: 'CO₂ · Linear (180°)' }
    }
  },

  /* ---------------------------------------------------------------- 2 */
  predictStage({
    key: QUEST_KEY,
    title: 'Four Domains',
    prompt: 'How do four electron domains arrange themselves around a central atom?',
    cards: GUESSES,
    hints: [
      'Drag one of the three 3D models into the slot.',
      'Domains repel each other in 3D space, not just on a flat sheet.',
      'Predictions are never graded, so pick the model you think is most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage attaches four bonds to a central atom, one at a time.'
    }
  }),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Leaving the Plane',
    briefing: { speaker: SPEAKER, body: 'Three electron domains lie flat, 120° apart (trigonal planar). Attach the four bonds one at a time and watch how the fourth changes the shape.' },
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'what is the angle between any two of four electron domains?');
    },
    widget: { type: 'table', label: 'The bench' },
    entry: ANGLE_ENTRY,
    table: hubTable({ sym: 'A', arms: bonds(4), roomy: true }),
    hints: [
      'Attach the bonds one at a time, rotate the 3D view with the joystick, and click two attached atoms to measure the angle.',
      'Compare the flat three-bond model with the model after the fourth bond is attached.',
      'Four flat domains would be 90° apart, so check whether spreading into 3D lets them get farther apart.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = entryNumber(t, 'angle');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: unread };
      if (r.n !== 4) return { ok: false, msg: 'All four bonds are not attached to the central atom yet.' };
      const real = angleBetween(r.plan, 0, 1);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: off(v) };
    },
    get reward() {
      return {
        log: 'Two and three domains lie flat; four do not.',
        title: 'Tetrahedral',
        body: `${verdictLine(QUEST_KEY, 'solid')}109.5°, wider than 90° in a flat cross. This shape is tetrahedral, and the rule that domains spread as far apart as possible is VSEPR (valence shell electron pair repulsion).`,
        model: { type: 'shape', mol: 'CH4', angleLabel: '109.5°', caption: '4 domains · Tetrahedral (109.5°)' }
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Methane',
    briefing: { speaker: SPEAKER, body: 'Methane, CH₄, has four single bonds and no lone pairs on carbon. Build methane and measure the angle between any two hydrogen atoms.' },
    prompt: 'What is the H–C–H bond angle in methane, CH₄?',
    widget: { type: 'table', label: 'The bench' },
    entry: ANGLE_ENTRY,
    table: hubTable({ sym: 'C', label: 'Carbon', arms: [A('h1', 'H'), A('h2', 'H'), A('h3', 'H'), A('h4', 'H')], roomy: true }),
    hints: [
      'Attach all four hydrogen atoms to carbon, then click any two hydrogens to measure the H–C–H bond angle.',
      'All four domains around carbon are identical C–H bonds, with no lone pairs.',
      'Four equal domains settle into a symmetric tetrahedron with 109.5° between every pair of bonds.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = entryNumber(t, 'angle');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: unread };
      if (r.atoms < 4) return { ok: false, msg: 'Attach all four hydrogen atoms to carbon first.' };
      const real = angleBetween(r.plan, 0, 1);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: off(v) };
    },
    reward: {
      log: 'Methane: four bonds, 109.5°.',
      title: 'Methane (109.5°)',
      body: '109.5°: with four identical C–H bonds and zero lone pairs, methane is a symmetric tetrahedron. Watch how this angle changes as bonds are replaced by lone pairs.',
      model: { type: 'shape', mol: 'CH4', angleLabel: '109.5°', caption: 'CH₄ · Tetrahedral (109.5°)' }
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'A Lone Pair',
    briefing: { speaker: SPEAKER, body: 'A molecule\'s shape is named only from its atoms. A lone pair still counts as an electron domain, even though it has no atom attached.' },
    prompt: 'How do ammonia\'s three hydrogen atoms arrange around nitrogen with one lone pair?',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'N', label: 'Nitrogen', arms: [A('h1', 'H'), A('h2', 'H'), A('h3', 'H'), L('l1')], gauge: true }),
    hints: [
      'Drag the three hydrogen atoms and the lone pair onto nitrogen, then rotate the 3D view with the joystick.',
      'Compare where the three hydrogen atoms sit before and after the lone pair is attached.',
      'A lone pair repels the bonds just like any electron domain, but molecular shape is traced only by the atoms.'
    ],
    check(state) {
      const r = hubRead(state.table, 'hub');
      if (r.atoms < 3) return { ok: false, notYet: true, msg: 'Not all three hydrogen atoms are attached to nitrogen yet.' };
      if (r.height > 0.1) return { ok: true };
      return { ok: false, msg: 'This model has only three electron domains, so its atoms lie flat; ammonia\'s nitrogen has four.' };
    },
    reward: {
      log: 'Three bonds and a lone pair.',
      title: 'Trigonal Pyramidal',
      body: '107°: the lone pair is one of four domains and repels the three bonds more strongly, forming a pyramid with nitrogen at the top. This shape is trigonal pyramidal.',
      model: { type: 'shape', mol: 'NH3', angleLabel: '107°', caption: 'NH₃ · Trigonal pyramidal (107°)' }
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Two Lone Pairs',
    prompt: 'What is the H–O–H bond angle in water?',
    widget: { type: 'table', label: 'The bench' },
    entry: ANGLE_ENTRY,
    table: hubTable({ sym: 'O', label: 'Oxygen', arms: [A('h1', 'H'), A('h2', 'H'), L('l1'), L('l2')] }),
    hints: [
      'Water\'s oxygen has two bonds and two lone pairs: attach all four, then click the two hydrogen atoms to read the angle.',
      'Compare this angle with the 109.5° in methane, where all four domains were bonds.',
      'A lone pair is held by only one nucleus and spreads wider than a bond, so it repels neighboring bonds more strongly.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = entryNumber(t, 'angle');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: unread };
      const hs = r.arms.map((a, i) => [a, i]).filter(([a]) => a.kind === 'arm');
      if (r.lone < 2 || hs.length < 2) return { ok: false, msg: NOT_ALL };
      const real = angleBetween(r.plan, hs[0][1], hs[1][1]);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: off(v) };
    },
    reward: {
      log: 'Lone pairs repel more strongly.',
      title: 'Bent',
      body: '104.5°: lone pairs repel more strongly than bonds, narrowing the bond angle from 109.5° to 104.5°. With two bonds and two lone pairs, the molecule\'s shape is bent.',
      model: { type: 'shape', mol: 'H2O', morphFrom: 'CH4', angleLabel: '104.5°', caption: 'H₂O · Bent (104.5°)' }
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Six Domains',
    prompt: 'What is the angle between neighboring electron domains when there are six?',
    widget: { type: 'table', label: 'The bench' },
    entry: ANGLE_ENTRY,
    table: hubTable({ sym: 'A', arms: bonds(6), roomy: true }),
    hints: [
      'Attach all six bonds, rotate with the joystick, and click two neighboring atoms to read the angle.',
      'Compare the angle between two neighboring bonds with the angle between two opposite bonds.',
      'All six domains spread as far apart as possible, so every bond has the same symmetric arrangement of neighbors.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = entryNumber(t, 'angle');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: unread };
      if (r.n !== 6) return { ok: false, msg: 'All six bonds are not attached to the central atom yet.' };
      const real = smallestAngle(r, a => a.kind === 'arm');
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: `Two neighboring bonds on the model are not ${v}° apart: click two that are next to each other.` };
    },
    reward: {
      log: 'Six domains settle on the corners of an octahedron.',
      title: 'Octahedral',
      body: '90°: each domain has four neighbors at 90° and one directly opposite at 180°. This shape is octahedral, as in sulfur hexafluoride (SF₆).',
      model: { type: 'shape', mol: 'SF6', angleLabel: '90°', caption: 'SF₆ · Octahedral (90°)' }
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Four Bonds, Two Lone Pairs',
    prompt: 'With four bonds and two lone pairs around a central atom, what is the angle between neighboring bonds?',
    widget: { type: 'table', label: 'The bench' },
    entry: ANGLE_ENTRY,
    table: hubTable({ sym: 'A', arms: [...bonds(4), L('l1'), L('l2')], roomy: true }),
    hints: [
      'Attach the four bonds and two lone pairs, then rotate with the joystick to see where the lone pairs sit.',
      'Compare where the two lone pairs settle with the positions left for the four bonds.',
      'Lone pairs repel more strongly than bonds, so they settle as far from each other as six positions allow.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = entryNumber(t, 'angle');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: unread };
      if (r.lone < 2 || r.atoms < 4) return { ok: false, msg: NOT_ALL };
      const real = smallestAngle(r, a => a.kind === 'arm');
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: `Two neighboring bonds on the model are not ${v}° apart: click two neighboring bonded atoms.` };
    },
    reward: {
      log: 'Two lone pairs sit opposite, and the four atoms lie flat.',
      title: 'Square Planar',
      body: '90°: the two lone pairs sit opposite each other, leaving the four bonds in a flat square around the central atom. This shape is square planar, as in xenon tetrafluoride (XeF₄).',
      model: { type: 'shape', mol: 'XeF4', angleLabel: '90°', caption: 'XeF₄ · Square planar (90°)' }
    }
  },

  /* ---------------------------------------------------------------- 9 */
  {
    title: 'Five Domains',
    prompt: 'With five electron domains, three form a flat ring: what is the angle between two domains in that ring?',
    widget: { type: 'table', label: 'The bench' },
    entry: ANGLE_ENTRY,
    table: hubTable({ sym: 'A', arms: bonds(5), roomy: true }),
    hints: [
      'Attach all five bonds, rotate with the joystick until you see the flat ring of three, and click two atoms in that ring.',
      'Compare the angle between two bonds in the ring with the angle between a ring bond and one of the top or bottom bonds.',
      'Five domains cannot all be equivalent: three form a flat ring around the middle, and two sit directly above and below it.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = entryNumber(t, 'angle');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: unread };
      if (r.n !== 5) return { ok: false, msg: 'All five bonds are not attached to the central atom yet.' };
      const angles = bondAngles(r.plan);
      const middle = angles[Math.floor(angles.length / 2)];
      if (near(v, middle, ANGLE_TOL)) return { ok: true };
      if (angles.some(x => near(v, x, ANGLE_TOL))) return { ok: false, msg: `${v}° is an angle on this model, but not between two bonds in the flat ring.` };
      return { ok: false, msg: `No two bonds on the model are ${v}° apart.` };
    },
    reward: {
      log: 'Five domains make two kinds of position.',
      title: 'Trigonal Bipyramidal',
      body: '120° between domains in the flat ring, and 90° to the two domains above and below it. This shape is trigonal bipyramidal, as in phosphorus pentachloride (PCl₅).',
      model: { type: 'shape', mol: 'PCl5', angleLabel: '120° / 90°', caption: 'PCl₅ · Trigonal bipyramidal (90°, 120°, 180°)' }
    }
  },

  /* ---------------------------------------------------------------- 10 */
  {
    title: 'Two Bonds, Three Lone Pairs',
    prompt: 'With two bonds and three lone pairs around a central atom, what is the angle between the two bonds?',
    widget: { type: 'table', label: 'The bench' },
    entry: ANGLE_ENTRY,
    table: hubTable({ sym: 'A', arms: [...bonds(2), L('l1'), L('l2'), L('l3')], roomy: true }),
    hints: [
      'Attach the two bonds and three lone pairs, rotate with the joystick, and click the two bonded atoms to check the angle.',
      'Compare where the three lone pairs settled with the ring and top/bottom positions from the last stage.',
      'In the flat ring, the three lone pairs sit 120° apart, farther from each other than any other arrangement allows.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = entryNumber(t, 'angle');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: unread };
      if (r.lone < 3 || r.atoms < 2) return { ok: false, msg: NOT_ALL };
      const hs = r.arms.map((a, i) => [a, i]).filter(([a]) => a.kind === 'arm');
      const real = angleBetween(r.plan, hs[0][1], hs[1][1]);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: `The two bonds on the model are not ${v}° apart: click both bonded atoms to measure.` };
    },
    reward: {
      log: 'Three lone pairs leave the two atoms opposite.',
      title: 'Linear, From Five Domains',
      body: '180°: the three lone pairs take the flat ring where they are farthest apart, leaving the two bonds pointing opposite ways in a straight line (linear), as in XeF₂.',
      model: { type: 'shape', mol: 'XeF2', angleLabel: '180°', caption: 'XeF₂ · Linear (180°)' }
    }
  },

  /* ---------------------------------------------------------------- 11 */
  {
    title: 'Count the Domains',
    prompt: 'How many electron domains surround the sulfur atom in SF₄?',
    widget: { type: 'table', label: 'The bench' },
    entry: DOMAIN_ENTRY,
    table: domainTable({
      pieces: [molCard('sf', 'SF4', { x: 75, y: 32 })]
    }),
    hints: [
      'The card shows sulfur bonded to four fluorine atoms; type the total number of electron domains in the field.',
      'Compare sulfur\'s 6 valence electrons with the 4 electrons used in its bonds to fluorine.',
      'Leftover electrons on sulfur form a lone pair, and every bond or lone pair on the central atom counts as one electron domain.'
    ],
    check(state) {
      const t = state.table;
      const v = entryNumber(t, 'domains');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type the number of electron domains.' };
      const n = planDomains(RIG_MOLECULES.SF4.arms).n;
      if (v === n) return { ok: true };
      return v === 4
        ? { ok: false, msg: 'Four counts only the bonds: two of sulfur\'s six valence electrons form a lone pair.' }
        : { ok: false, msg: `${v} is not the total number of bonds and lone pairs on sulfur.` };
    },
    reward: {
      log: 'Four bonds and one lone pair make five domains.',
      title: 'Counting Domains',
      body: 'Four bonds use four of sulfur\'s six valence electrons, and the remaining two form a lone pair: five electron domains.',
      model: { type: 'shape', mol: 'SF4', angleLabel: '90° / 120°', caption: 'SF₄ · 5 domains (Seesaw)' },
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
      heading: 'What You Found',
      body: 'Electron domains repel and spread as far apart as they can: 180° for two, 120° for three, 109.5° for four, 90° for six, and a 120° ring with two at 90° for five.'
    },
    {
      heading: 'Lone Pairs',
      body: 'A lone pair counts as an electron domain, but molecular shape is named only from the atoms. Lone pairs repel more strongly than bonds, narrowing bond angles and taking the farthest-apart positions.'
    },
    {
      heading: 'Next',
      body: 'The next bench asks which molecules have a positive end and a negative end.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. An arm is dropped on the hub (`on`); nothing here says where an arm settles.
   ------------------------------------------------------------------ */

const on = (...ids) => ids.map(id => ({ join: [id, 'hub'] }));
const typeAng = value => ({ type: { entry: 'angle', value: String(value) } });
const typeDom = value => ({ type: { entry: 'domains', value: String(value) } });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [...on('a1', 'a2'), typeAng(180)],
  [guess('solid')],
  [...on('a1', 'a2', 'a3', 'a4'), typeAng(109.5)],
  [...on('h1', 'h2', 'h3', 'h4'), typeAng(109.5)],
  [...on('h1', 'h2', 'h3', 'l1')],
  [...on('h1', 'h2', 'l1', 'l2'), typeAng(104.5)],
  [...on('a1', 'a2', 'a3', 'a4', 'a5', 'a6'), typeAng(90)],
  [...on('a1', 'a2', 'a3', 'a4', 'l1', 'l2'), typeAng(90)],
  [...on('a1', 'a2', 'a3', 'a4', 'a5'), typeAng(120)],
  [...on('a1', 'a2', 'l1', 'l2', 'l3'), typeAng(180)],
  [typeDom(5)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...on('a1', 'a2'), typeAng(120)],
  [],
  [...on('a1', 'a2', 'a3', 'a4'), typeAng(90)],
  [...on('h1', 'h2', 'h3', 'h4'), typeAng(90)],
  [...on('h1', 'h2', 'h3')],
  [...on('h1', 'h2', 'l1', 'l2'), typeAng(109.5)],
  [...on('a1', 'a2', 'a3', 'a4', 'a5', 'a6'), typeAng(109.5)],
  [...on('a1', 'a2', 'a3', 'a4', 'l1', 'l2'), typeAng(180)],
  [...on('a1', 'a2', 'a3', 'a4', 'a5'), typeAng(90)],
  [...on('a1', 'a2', 'l1', 'l2', 'l3'), typeAng(120)],
  [typeDom(4)]
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
