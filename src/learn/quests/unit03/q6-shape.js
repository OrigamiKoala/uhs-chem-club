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
  domainTable, hubSet, armPiece, balloonPiece, protractorPiece, marker, markerValue, hubRead, molRead, molCard, piecesIn
} from '../../table/kits/domain.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 10 };

export const VOCABULARY = [
  { term: /\btrigonal bipyramidal\b/i, introducedAt: 8 },
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
  ['cross', 'the four domains lie flat, 90° apart', ['Flat cross', 'all four lie flat,', '90° apart']],
  ['solid', 'the four domains point out in three dimensions', ['Not flat', 'they point out in', 'three dimensions']],
  ['triangle', 'three domains lie flat and the fourth points straight up', ['Three flat, one up', 'three lie flat, one', 'points straight up']]
];

/** Every piece says what it is (an arm, a balloon, a protractor, a dial named "Turn"), so no key needs a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   A hub on its plate at the left, the pieces in a tray at the right, a marker under the tray.
   ------------------------------------------------------------------ */

const HUB_AT = { x: 40, y: 32 };

const binTray = (label = 'Electron domains') => ({ id: 'bin', label, at: { x: 106, y: 15 }, size: { w: 52, h: 15 }, cell: 13 });

/** A hub table: the hub, the pieces in the tray, the protractor, the dial that turns the view, a marker to set. */
function hubTable({ sym, arms, label = 'Central atom', marker: mk = null, gauge = false, protractor = true, roomy = false }) {
  const hs = hubSet('hub', sym, HUB_AT, { label, gauge, turner: roomy ? { x: 96, y: 31 } : { x: 108, y: 35 } });
  const inTray = arms.map(a => ({ ...a, zone: 'tray:bin' }));
  // Six or more pieces: a longer tray, and the protractor moves down beside the turn dial to make room for it.
  const tray = roomy ? { ...binTray(), at: { x: 111.3, y: 14 }, size: { w: 76.5, h: 15 }, cell: 12.7 } : binTray();
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


/** The smallest angle the protractor can read between two of the hub's arms that pass `keep`. */
function smallestAngle(read, keep) {
  const ids = read.arms.map((a, i) => [a, i]).filter(([a]) => keep(a)).map(([, i]) => i);
  let best = Infinity;
  for (let x = 0; x < ids.length; x++) for (let y = x + 1; y < ids.length; y++) best = Math.min(best, angleBetween(read.plan, ids[x], ids[y]));
  return best;
}

/* ------------------------------------------------------------------
   THE TEN STAGES
   ------------------------------------------------------------------ */
/** A bond to an unnamed atom X on an unnamed central atom A, and the pieces of a stage. */
const X = i => A(`a${i}`, 'X', 1, 'Bond');
const bonds = n => Array.from({ length: n }, (_, i) => X(i + 1));
const NOT_ALL = 'Not everything from the tray is attached to the central atom yet.';
const unread = 'Set the dial to an angle.';
const off = (v, real) => `The model's angle is not ${v}°: lay the protractor across the two bonds and read it again.`;

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Two Domains',
    briefing: {
      speaker: SPEAKER,
      body: 'An electron domain is a bond or a lone pair on the central atom of a molecule. Domains are all negative charge, so they repel each other and settle as far apart as they can.'
    },
    prompt: 'What is the angle between two electron domains?',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'A', arms: bonds(2), marker: { label: 'Angle' } }),
    hints: [
      'Drag both bonds onto the central atom, then drag the protractor onto one bond and then the other.',
      'Watch where the second bond settles when it is attached, and where the first one moves to.',
      'Two things that repel each other move until neither can get further from the other.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: unread };
      if (r.n !== 2) return { ok: false, msg: 'Both bonds are not attached to the central atom yet.' };
      const real = angleBetween(r.plan, 0, 1);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: off(v, real) };
    },
    reward: {
      log: 'Two domains settle opposite.',
      title: 'Linear',
      body: '180°: the two domains point opposite ways, as far apart as they can be. This shape is called linear.',
      model: { type: 'shape', mol: 'CO2', caption: 'CO₂ · Linear (180°)' }
    }
  },

  /* ---------------------------------------------------------------- 2 */
  predictStage({
    key: QUEST_KEY,
    title: 'Four Domains',
    prompt: 'How do four electron domains arrange themselves round a central atom?',
    cards: GUESSES,
    hints: [
      'Lay one of the three cards in the slot.',
      'The domains repel each other, and a molecule is not confined to a flat sheet.',
      'A prediction is never graded, so lay the card you think most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage attaches four bonds to a central atom, one at a time.'
    }
  }),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Leaving the Plane',
    briefing: { speaker: SPEAKER, body: 'Three electron domains lie flat, 120° apart, in a shape called trigonal planar. Attach the bonds one at a time and watch what the fourth one does to the other three.' },
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'what is the angle between any two of four electron domains?');
    },
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'A', arms: bonds(4), marker: { label: 'Angle' }, roomy: true }),
    hints: [
      'Attach the bonds one at a time and turn the view after each; the protractor reads the angle between two bonds.',
      'Compare the model with three bonds, which lies flat, with the model after the fourth is attached.',
      'Four domains kept flat would be 90° apart, so ask whether leaving the flat lets them get further from each other.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: unread };
      if (r.n !== 4) return { ok: false, msg: 'All four bonds are not attached to the central atom yet.' };
      const real = angleBetween(r.plan, 0, 1);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: off(v, real) };
    },
    get reward() {
      return {
        log: 'Two and three domains lie flat; four do not.',
        title: 'Tetrahedral',
        body: `${verdictLine(QUEST_KEY, 'solid')}109.5°, more than the 90° they would have if flat. This shape is tetrahedral, and the idea that domains settle as far apart as they can is called VSEPR (valence shell electron pair repulsion).`,
        model: { type: 'shape', mol: 'CH4', caption: 'CH₄ · Tetrahedral (109.5°)' }
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'A Lone Pair',
    briefing: { speaker: SPEAKER, body: 'A molecule\'s shape is named from where its atoms are. A lone pair is an electron domain, but it has no atom on it.' },
    prompt: 'Where do ammonia\'s three hydrogen atoms sit round a nitrogen atom that also has one lone pair?',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'N', label: 'Nitrogen', arms: [A('h1', 'H'), A('h2', 'H'), A('h3', 'H'), L('l1')], gauge: true, protractor: false }),
    hints: [
      'Build the molecule: drag the hydrogen atoms and the lone pair onto the nitrogen atom, and turn the view.',
      'Compare where the three hydrogen atoms sit before the lone pair is attached and after.',
      'A lone pair is an electron domain and repels the bonds, but the shape of a molecule is traced by its atoms only.'
    ],
    check(state) {
      const r = hubRead(state.table, 'hub');
      if (r.atoms < 3) return { ok: false, notYet: true, msg: 'Not all three hydrogen atoms are attached to the nitrogen atom.' };
      if (r.height > 0.1) return { ok: true };
      return { ok: false, msg: 'This model has only three electron domains, and its atoms lie flat: ammonia\'s nitrogen has four.' };
    },
    reward: {
      log: 'Three bonds and a lone pair.',
      title: 'Trigonal Pyramidal',
      body: 'The lone pair is one of four domains and repels the three bonds, so the atoms form a pyramid with nitrogen at the top. This shape is trigonal pyramidal.',
      model: { type: 'shape', mol: 'NH3', caption: 'NH₃ · Trigonal pyramidal (107°)' }
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Two Lone Pairs',
    prompt: 'What is the H–O–H bond angle in water?',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'O', label: 'Oxygen', arms: [A('h1', 'H'), A('h2', 'H'), L('l1'), L('l2')], marker: { label: 'Angle' } }),
    hints: [
      'Water\'s oxygen has two bonds and two lone pairs: attach all four, then lay the protractor across the two hydrogen atoms.',
      'Compare the angle you read with the 109.5° between four domains that are all bonds.',
      'A lone pair is held by one nucleus only and spreads wider than a bond, so ask what that does to the bonds beside it.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: unread };
      const hs = r.arms.map((a, i) => [a, i]).filter(([a]) => a.kind === 'arm');
      if (r.lone < 2 || hs.length < 2) return { ok: false, msg: NOT_ALL };
      const real = angleBetween(r.plan, hs[0][1], hs[1][1]);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: off(v, real) };
    },
    reward: {
      log: 'Lone pairs repel more strongly.',
      title: 'Bent',
      body: '104.5°: lone pairs repel more strongly than bonds do, so two of them close the angle between the bonds from 109.5°. The three atoms make a shape called bent.',
      model: { type: 'shape', mol: 'H2O', caption: 'H₂O · Bent (104.5°)' }
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Six Domains',
    prompt: 'What is the angle between neighbouring electron domains when there are six?',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'A', arms: bonds(6), marker: { label: 'Angle' }, roomy: true }),
    hints: [
      'Attach all six bonds, turn the view, and lay the protractor across two bonds that are next to each other.',
      'Compare the reading for two neighbouring bonds with the reading for two that point opposite ways.',
      'Each domain has settled as far from the other five as it can, so every bond has the same set of neighbours.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: unread };
      if (r.n !== 6) return { ok: false, msg: 'All six bonds are not attached to the central atom yet.' };
      const real = smallestAngle(r, a => a.kind === 'arm');
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: `Two neighbouring bonds on the model are not ${v}° apart: lay the protractor across two that are next to each other.` };
    },
    reward: {
      log: 'Six domains settle on the corners of an octahedron.',
      title: 'Octahedral',
      body: '90°: each domain has four neighbours at 90° and one opposite it at 180°. This shape is octahedral, as in sulfur hexafluoride, SF₆.',
      model: { type: 'shape', mol: 'SF6', caption: 'SF₆ · Octahedral (90°)' }
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Four Bonds, Two Lone Pairs',
    prompt: 'With four bonds and two lone pairs round an atom, what is the angle between neighbouring bonds?',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'A', arms: [...bonds(4), L('l1'), L('l2')], marker: { label: 'Angle' }, roomy: true }),
    hints: [
      'Attach the four bonds and the two lone pairs, then turn the view to see where the lone pairs have settled.',
      'Compare the places the two lone pairs took with the places left for the four bonds.',
      'Lone pairs repel more strongly than bonds, so they settle as far from each other as six places allow.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: unread };
      if (r.lone < 2 || r.atoms < 4) return { ok: false, msg: NOT_ALL };
      const real = smallestAngle(r, a => a.kind === 'arm');
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: `Two neighbouring bonds on the model are not ${v}° apart: turn the view until you look straight down on the four bonds.` };
    },
    reward: {
      log: 'Two lone pairs sit opposite, and the four atoms lie flat.',
      title: 'Square Planar',
      body: '90°. The two lone pairs sit opposite each other, leaving the four atoms in a flat square round the central atom: square planar, as in xenon tetrafluoride, XeF₄.',
      model: { type: 'shape', mol: 'XeF4', caption: 'XeF₄ · Square planar (90°)' }
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Five Domains',
    prompt: 'Of five electron domains, three settle in one flat ring: what is the angle between two of those three?',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'A', arms: bonds(5), marker: { label: 'Angle' }, roomy: true }),
    hints: [
      'Attach all five bonds and turn the view until you can pick out three that lie in one flat ring.',
      'Compare the angle between two bonds in the ring with the angle between a ring bond and one of the other two.',
      'Five places cannot all be alike, so sort the bonds into the three of the ring and the two that stand above and below it.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: unread };
      if (r.n !== 5) return { ok: false, msg: 'All five bonds are not attached to the central atom yet.' };
      const angles = bondAngles(r.plan);
      const middle = angles[Math.floor(angles.length / 2)];
      if (near(v, middle, ANGLE_TOL)) return { ok: true };
      if (angles.some(x => near(v, x, ANGLE_TOL))) return { ok: false, msg: `${v}° is an angle on this model, but not between two bonds that lie in the same flat ring.` };
      return { ok: false, msg: `No two bonds on the model are ${v}° apart.` };
    },
    reward: {
      log: 'Five domains make two kinds of position.',
      title: 'Trigonal Bipyramidal',
      body: '120°, with the other two domains above and below the ring at 90° to it. This shape is trigonal bipyramidal, as in phosphorus pentachloride, PCl₅.',
      model: { type: 'shape', mol: 'PCl5', caption: 'PCl₅ · Trigonal bipyramidal (90°, 120°, 180°)' }
    }
  },

  /* ---------------------------------------------------------------- 9 */
  {
    title: 'Two Bonds, Three Lone Pairs',
    prompt: 'With two bonds and three lone pairs round an atom, what is the angle between the two bonds?',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable({ sym: 'A', arms: [...bonds(2), L('l1'), L('l2'), L('l3')], marker: { label: 'Angle' }, protractor: false, roomy: true }),
    hints: [
      'There is no protractor here: attach the two bonds and three lone pairs, and turn the view to see the model from the side.',
      'Compare the places the three lone pairs took with the ring and the two other places of the last stage.',
      'In the ring three lone pairs are 120° from each other, further apart than any other three places would put them.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: unread };
      if (r.lone < 3 || r.atoms < 2) return { ok: false, msg: NOT_ALL };
      const hs = r.arms.map((a, i) => [a, i]).filter(([a]) => a.kind === 'arm');
      const real = angleBetween(r.plan, hs[0][1], hs[1][1]);
      if (near(v, real, ANGLE_TOL)) return { ok: true };
      return { ok: false, msg: `The two bonds on the model are not ${v}° apart: turn the view until both are seen from the side.` };
    },
    reward: {
      log: 'Three lone pairs leave the two atoms opposite.',
      title: 'Linear, From Five Domains',
      body: '180°. The three lone pairs take the ring, where they are furthest apart, so the two bonds point opposite ways and the atoms lie in a line, as in xenon difluoride, XeF₂.',
      model: { type: 'shape', mol: 'XeF2', caption: 'XeF₂ · Linear (180°)' }
    }
  },

  /* ---------------------------------------------------------------- 10 */
  {
    title: 'Count the Domains',
    prompt: 'How many electron domains surround the sulfur atom in SF₄?',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('sf', 'SF4', { x: 40, y: 32 })],
      fixtures: [marker('mark', { x: 104, y: 32 }, { label: 'Domains', max: 8 })]
    }),
    hints: [
      'The card shows sulfur bonded to four fluorine atoms; the dial sets your answer.',
      'Compare sulfur\'s six valence electrons with the number its four bonds to fluorine use.',
      'Electrons left on sulfur after bonding stay there in pairs, and every domain on the central atom counts, with an atom on it or not.'
    ],
    check(state) {
      const t = state.table;
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the dial to a number of domains.' };
      const n = planDomains(RIG_MOLECULES.SF4.arms).n;
      if (v === n) return { ok: true };
      return v === 4
        ? { ok: false, msg: 'Four counts the bonds only: two of sulfur\'s six valence electrons are not in a bond.' }
        : { ok: false, msg: `${v} is not the number of bonds and lone pairs on the sulfur atom.` };
    },
    reward: {
      log: 'Four bonds and one lone pair make five domains.',
      title: 'Counting Domains',
      body: 'Four bonds use four of sulfur\'s six valence electrons, and the other two are a lone pair: five domains.',
      model: { type: 'shape', mol: 'SF4', caption: 'SF₄ · 5 domains' },
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
      body: 'Electron domains repel and settle as far apart as they can: 180° for two, 109.5° for four, 90° for six, and a ring of three with two above and below for five.'
    },
    {
      heading: 'Lone Pairs',
      body: 'A lone pair is a domain but not part of the shape, which is traced by the atoms. Lone pairs repel more strongly than bonds, closing bond angles and taking the places furthest apart.'
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
const read = (a, b) => [{ join: ['pr', a] }, { join: ['pr', b] }];
const set = (value, id = 'mark') => ({ setDial: { fixture: id, dial: 'value', value } });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [...on('a1', 'a2'), ...read('a1', 'a2'), set(180)],
  [guess('solid')],
  [...on('a1', 'a2', 'a3', 'a4'), ...read('a1', 'a2'), set(109)],
  [...on('h1', 'h2', 'h3', 'l1')],
  [...on('h1', 'h2', 'l1', 'l2'), ...read('h1', 'h2'), set(105)],
  [...on('a1', 'a2', 'a3', 'a4', 'a5', 'a6'), ...read('a1', 'a3'), set(90)],
  [...on('a1', 'a2', 'a3', 'a4', 'l1', 'l2'), ...read('a1', 'a3'), set(90)],
  [...on('a1', 'a2', 'a3', 'a4', 'a5'), ...read('a3', 'a4'), set(120)],
  [...on('a1', 'a2', 'l1', 'l2', 'l3'), { setDial: { fixture: 'hub-turn', dial: 'turn', value: 90 } }, set(180)],
  [set(5)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...on('a1', 'a2'), set(120)],
  [],
  [...on('a1', 'a2', 'a3', 'a4'), set(90)],
  [...on('h1', 'h2', 'h3')],
  [...on('h1', 'h2', 'l1', 'l2'), set(109)],
  [...on('a1', 'a2', 'a3', 'a4', 'a5', 'a6'), set(109)],
  [...on('a1', 'a2', 'a3', 'a4', 'l1', 'l2'), set(180)],
  [...on('a1', 'a2', 'a3', 'a4', 'a5'), set(90)],
  [...on('a1', 'a2', 'l1', 'l2', 'l3'), set(120)],
  [set(4)]
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
