/**
 * q9-orbitals.js — Ligar, bench nine: MOLECULAR ORBITALS.
 *
 * Rebuilt by the teaching pass of 2026-11-12 (the pre-pass file, with its three card sorts, is
 * `archive/2026-11-11/ligar/q9-orbitals.before.js`). The owner asked to see "how the atomic orbitals add up or subtract", with
 * "atoms transitioning between free and bonded": stages 3 to 5 are that, on the overlap track (`kits/mo.js` `overlapTrack`).
 *
 *   1  PREDICT: is oxygen gas attracted to a magnet?
 *   2  test four gases with the magnet                                   -> paramagnetic; Lewis structures cannot explain it
 *   3  bring two 1s orbitals of the same sign together                   -> density between the nuclei, lower energy: bonding
 *   4  turn one orbital's sign over and bring them together              -> a node between the nuclei, higher energy: antibonding
 *   5  bring two p orbitals together side by side                        -> density above and below the line: pi (and sigma named)
 *   6  fill He₂'s two levels and give its bond order                     -> bond order from orbitals (worked for H₂ first)
 *   7  place oxygen's last two electrons                                 -> two unpaired electrons, so O₂ is paramagnetic
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { DIATOMICS, fillMO, boxKeyMO } from '../../engine/mo.js';
import {
  moTable, moRack, moSupply, magnet, moCard, marker, overlapTrack, chooser, overlapRead, fillSteps, readOf, matchesGround
} from '../../table/kits/mo.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bparamagnetic\b/i, introducedAt: 2 },
  { term: /\bantibonding\b/i, introducedAt: 4 },
  { term: /\bbonding orbitals?\b/i, introducedAt: 3 },
  { term: /\bmolecular orbitals?\b/i, introducedAt: 3 }
];

export const BUILDS_ON = ['unit03/q8-hybrid', 'unit02/q6-filling', 'unit03/q3-distance'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit03/q9-orbitals';

const GUESSES = [
  ['pulled', 'the magnet attracts the oxygen', ['The magnet attracts', 'the oxygen']],
  ['nothing', 'the magnet does nothing to the oxygen', ['The magnet does', 'nothing to', 'the oxygen']],
  ['pushed', 'the magnet repels the oxygen', ['The magnet repels', 'the oxygen']]
];

export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const RACK_AT = { x: 74, y: 32 };
const SEATED = 10;
const JAR_AT = { x: 15, y: 40 };
const GASES = [['n2', 'N₂', 'N2'], ['o2', 'O₂', 'O2'], ['f2', 'F₂', 'F2'], ['b2', 'B₂', 'B2']];
const TRACK_AT = { x: 54, y: 32 };
const ANSWER_AT = { x: 128, y: 32 };
const answerOf = t => t.fixtures.ans.dials.n.value;

/** The three stages on the overlap track share one check: the atoms are brought together first, then the answer dial is read. */
function trackCheck(state, { right, needOpposite = false, wrong }) {
  const t = state.table;
  const r = overlapRead(t, 'ov');
  if (needOpposite && !r.opposite) return { ok: false, notYet: true, msg: 'Set the "Signs" dial to Opposite first.' };
  if (!r.close) return { ok: false, notYet: true, msg: 'Bring the two atoms together with the "Distance" dial first.' };
  const v = answerOf(t);
  if (!v) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
  if (v === right) return { ok: true };
  return { ok: false, msg: wrong };
}

/* ------------------------------------------------------------------
   THE SEVEN STAGES
   ------------------------------------------------------------------ */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'A Magnet and a Gas',
    prompt: 'Is oxygen gas attracted to a magnet?',
    cards: GUESSES,
    hints: [
      'Lay one of the three cards in the slot.',
      'The Lewis structure of O₂ is a double bond with two lone pairs on each atom, every electron in a pair.',
      'A prediction is never graded, so lay the card you think most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage holds four gases, oxygen among them, beside a magnet.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Four Gases',
    briefing: {
      speaker: SPEAKER,
      body: 'An electron on its own in an orbital, with no partner, is called unpaired. A substance with unpaired electrons is attracted to a magnet and is called paramagnetic; one whose electrons are all paired is not attracted.'
    },
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'which of these four gases are attracted to the magnet?');
    },
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      pieces: GASES.map(([id, label, mol], i) => moCard(id, label, { x: 20 + i * 26, y: 52 }, { mol })),
      zones: {
        slots: [{ id: 'test', label: 'Gas to test', at: { x: 30, y: 21 }, size: { w: 32, h: 20 } }],
        trays: [
          { id: 'pulled', label: 'Attracted', at: { x: 118, y: 13 }, size: { w: 48, h: 14 }, cell: 22 },
          { id: 'ignored', label: 'Not attracted', at: { x: 118, y: 36 }, size: { w: 48, h: 14 }, cell: 22 }
        ]
      },
      fixtures: [magnet('magnet', { x: 76, y: 22 }, { slot: 'test', size: { w: 34, h: 30 }, label: 'Magnet' })]
    }),
    hints: [
      'Drag a gas card into the "Gas to test" slot and press "Test Sample"; the card keeps what the magnet did.',
      'Compare the gases the magnet attracted with what the briefing says about unpaired electrons.',
      'Draw the Lewis structure of O₂ in your head and ask whether it shows any electron without a partner.'
    ],
    check(state) {
      const t = state.table;
      const ids = GASES.map(g => g[0]);
      const where = Object.fromEntries(ids.map(id => [id, ['pulled', 'ignored'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all four gases into trays.' };
      const wrong = ids.find(id => where[id] !== (DIATOMICS[t.pieces[id].props.mol].unpaired > 0 ? 'pulled' : 'ignored'));
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is in a tray that does not match what the magnet did to it: test it again.` };
      return { ok: true };
    },
    get reward() {
      return {
        log: 'Oxygen and diboron were attracted. Nitrogen and fluorine were not.',
        title: 'Paramagnetic Gases',
        body: `${verdictLine(QUEST_KEY, 'pulled')}O₂ and B₂ are attracted, so they are paramagnetic and must have unpaired electrons. Their Lewis structures show every electron paired, so another picture of bonding is needed.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Two Orbitals Add',
    briefing: {
      speaker: SPEAKER,
      body: 'An orbital is a wave, and each part of it has a sign, + or −, like the crest and trough of a water wave; the sign is not an electric charge. When two atoms come together their orbitals overlap and combine into molecular orbitals, which belong to the whole molecule.'
    },
    prompt: 'When two 1s orbitals of the same sign overlap, where is the electron most likely to be found?',
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      fixtures: [overlapTrack('ov', TRACK_AT, { type: 's' }), chooser('ans', 'Most likely', ANSWER_AT, ['Between nuclei', 'Beyond nuclei', 'At one nucleus'])]
    }),
    hints: [
      'Drag the "Distance" dial to bring the two hydrogen atoms together; the brighter the picture, the more likely the electron is there.',
      'Compare the brightness between the two nuclei when the atoms are far apart and when they are close, and watch the amber energy mark labelled BOTH, which is the combined orbital.',
      'Two waves of the same sign add where they overlap, so ask where both atoms\' orbitals reach at once.'
    ],
    check(state) {
      return trackCheck(state, { right: 1, wrong: 'The picture is fainter there than it is somewhere else: look for the brightest part of the combined orbital.' });
    },
    reward: {
      log: 'Like signs add between the nuclei.',
      title: 'Bonding Orbital',
      body: 'Between the two nuclei, where the electron is attracted to both. That lowers the energy, as the level showed, so this molecular orbital is called a bonding orbital.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Two Orbitals Cancel',
    prompt: 'When two 1s orbitals of opposite sign overlap, where is the electron never found?',
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      fixtures: [overlapTrack('ov', TRACK_AT, { type: 's', flip: true }), chooser('ans', 'Never found', ANSWER_AT, ['Midway between', 'At each nucleus', 'Beyond nuclei'])]
    }),
    hints: [
      'Set the "Signs" dial to Opposite to turn one atom\'s orbital over, then bring the atoms together with the "Distance" dial.',
      'Compare the space between the nuclei with the last stage, and watch which way the energy level marked BOTH moves.',
      'A + wave and a − wave of equal size add up to nothing, so ask where the two orbitals are equally strong.'
    ],
    check(state) {
      return trackCheck(state, { right: 1, needOpposite: true, wrong: 'The picture is not dark there: look for the place where the combined orbital has faded to nothing.' });
    },
    reward: {
      log: 'Unlike signs cancel between the nuclei.',
      title: 'Antibonding Orbital',
      body: 'Midway between the nuclei, on a surface called a node. With almost no electron between them the nuclei repel, so the energy is higher: an antibonding orbital, marked with a star (*).'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Side by Side',
    briefing: {
      speaker: SPEAKER,
      body: 'A p orbital has two lobes of opposite sign, one on each side of its nucleus. Here two p orbitals stand side by side, across the line between the nuclei, with like signs on the same side.'
    },
    prompt: 'Where is the electron most likely to be found when two p orbitals overlap side by side?',
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      fixtures: [overlapTrack('ov', TRACK_AT, { type: 'p' }), chooser('ans', 'Most likely', ANSWER_AT, ['On the line', 'Above and below', 'Beyond nuclei'])]
    }),
    hints: [
      'Drag the "Distance" dial to bring the two atoms together; the dotted line runs through both nuclei.',
      'Compare the brightness on the dotted line with the brightness above it and below it.',
      'Each p orbital is zero at its own nucleus and all along the line, so ask where the two upper lobes, and the two lower, reach each other.'
    ],
    check(state) {
      return trackCheck(state, { right: 2, wrong: 'The picture is fainter there than it is somewhere else: look for the brightest parts of the combined orbital.' });
    },
    reward: {
      log: 'Side by side: above and below the line.',
      title: 'Sigma and Pi Orbitals',
      body: 'Above and below the line between the nuclei, with none on it: a pi orbital, π. Orbitals that overlap along the line, as the 1s orbitals did, make sigma orbitals, σ.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const rack = moRack('a', 'He2', RACK_AT, { counts: true });
    return {
      title: 'Filling the Levels',
      briefing: {
        speaker: SPEAKER,
        body: 'Electrons fill molecular orbitals from the lowest energy up, two to an orbital. Bond order is the number of electrons in bonding orbitals minus the number in antibonding orbitals, divided by two, which matches the count of shared pairs.',
        worked: [
          'H₂ has 2 electrons: both go into σ, the bonding orbital.',
          'Bond order = (2 − 0) ÷ 2 = 1, a single bond.'
        ]
      },
      prompt: 'What is the bond order of He₂, which has four electrons?',
      widget: { type: 'table', label: 'The bench' },
      table: moTable({
        zones: { containers: [moSupply('supply', 'Electrons', JAR_AT, DIATOMICS.He2.e), ...rack.containers] },
        fixtures: [rack.fixture, marker('bo', 'Bond order', { x: 134, y: 36 }, { max: 3, value: 1 })]
      }),
      hints: [
        'Drag the four electrons from the jar into the two molecular orbitals in the middle, then set the "Bond order" dial.',
        'Compare the count of electrons in the bonding orbital, σ, with the count in the antibonding orbital, σ*.',
        'The worked case for H₂ shows where the two counts go in the subtraction.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'a');
        if (r.total < DIATOMICS.He2.e) return { ok: false, notYet: true, msg: 'Place all four electrons in the molecular orbitals first.' };
        if (!matchesGround(t, 'a', DIATOMICS.He2.e)) return { ok: false, msg: 'An electron is in a higher orbital while a lower one still has a place.' };
        const v = t.fixtures.bo.dials.n.value;
        if (v === r.bondOrder) return { ok: true };
        return { ok: false, msg: `A bond order of ${v} needs ${2 * v} more electrons in bonding orbitals than in antibonding ones, and the diagram counts ${r.bonding} and ${r.anti}.` };
      },
      reward: {
        log: 'Two bonding, two antibonding.',
        title: 'Bond Order From Orbitals',
        body: '0: two electrons go into σ and two into σ*, and the antibonding pair undoes the bonding pair. With a bond order of zero, He₂ does not form.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const rack = moRack('a', 'O2', RACK_AT);
    const seated = fillMO(DIATOMICS.O2.order, SEATED);
    for (const c of rack.containers) c.contents = { electron: (seated[boxKeyMO(c.props.mo.row, c.props.mo.idx)] || '').length };
    return {
      title: 'Oxygen\'s Last Two',
      briefing: {
        speaker: SPEAKER,
        body: 'Two oxygen atoms make more molecular orbitals, from their 2s and 2p orbitals, each named σ or π with a star if it is antibonding. Ten of O₂\'s twelve valence electrons already stand in the lowest of them.'
      },
      prompt: 'Where do oxygen\'s last two electrons go?',
      widget: { type: 'table', label: 'The bench' },
      table: moTable({
        zones: { containers: [moSupply('supply', 'Electrons', JAR_AT, DIATOMICS.O2.e - SEATED), ...rack.containers] },
        fixtures: [rack.fixture, magnet('magnet', { x: 134, y: 36 }, { mol: 'O2' })]
      }),
      hints: [
        'Drag the two electrons from the jar into molecular orbitals; "Test Sample" shows what a magnet does to real oxygen.',
        'Compare a diagram with both electrons in one orbital with one that has them in two, and then with what the magnet shows.',
        'Electrons repel each other, so two orbitals of equal energy each take one electron before either takes a second.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'a');
        if (r.total !== DIATOMICS.O2.e) return { ok: false, notYet: true, msg: 'Place both electrons from the jar.' };
        if (matchesGround(t, 'a', DIATOMICS.O2.e)) return { ok: true };
        if (r.unpaired !== DIATOMICS.O2.unpaired) return { ok: false, msg: `The diagram counts ${r.unpaired} unpaired electrons, and a gas with none would not be attracted to a magnet as oxygen is.` };
        return { ok: false, msg: 'An electron is in a higher orbital while a lower one still has a place.' };
      },
      reward: {
        log: 'Two electrons stand unpaired.',
        title: 'Why Oxygen Is Paramagnetic',
        body: 'One into each of the two π* orbitals, which have the same energy. Those two unpaired electrons are why oxygen is attracted to a magnet, which its Lewis structure could not explain.',
        last: true
      }
    };
  })()
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'When two atoms meet, their orbitals combine. Like signs add between the nuclei and lower the energy: a bonding orbital. Unlike signs cancel there and raise it: an antibonding orbital.'
    },
    {
      heading: 'Filling Them',
      body: 'Electrons fill molecular orbitals from the lowest up. Bond order is bonding electrons minus antibonding electrons, divided by two, and unpaired electrons make a molecule paramagnetic, as in O₂.'
    },
    {
      heading: 'Next',
      body: 'The Basalt Warden tests what the benches of Ligar have taught.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES
   ------------------------------------------------------------------ */

const pour = (to, n = 1, from = 'supply') => ({ pour: { from, to: `a.${to}`, what: 'electron', amount: n } });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });
const test = id => [{ place: { piece: id, to: 'slot:test' } }, { run: 'magnet' }];
const file = (id, zone) => ({ place: { piece: id, to: `tray:${zone}` } });
const together = { setDial: { fixture: 'ov', dial: 'gap', value: 100 } };
const flip = { setDial: { fixture: 'ov', dial: 'sign', value: 1 } };
const answer = value => ({ setDial: { fixture: 'ans', dial: 'n', value } });
const order = value => ({ setDial: { fixture: 'bo', dial: 'n', value } });

function lastSteps() {
  const full = fillMO(DIATOMICS.O2.order, DIATOMICS.O2.e);
  const seated = fillMO(DIATOMICS.O2.order, SEATED);
  return Object.entries(full).map(([k, v]) => [k, v.length - (seated[k] || '').length]).filter(([, n]) => n > 0)
    .map(([k, n]) => ({ pour: { from: 'supply', to: `a.${k}`, what: 'electron', amount: n } }));
}

export const SOLUTIONS = [
  [guess('pulled')],
  [...test('n2'), file('n2', 'ignored'), ...test('o2'), file('o2', 'pulled'), ...test('f2'), file('f2', 'ignored'), ...test('b2'), file('b2', 'pulled')],
  [together, answer(1)],
  [flip, together, answer(1)],
  [together, answer(2)],
  [...fillSteps('a', DIATOMICS.He2.order, DIATOMICS.He2.e), order(0)],
  [...lastSteps(), { run: 'magnet' }]
];

export const MISSES = [
  [],
  [file('n2', 'pulled'), file('o2', 'ignored'), file('f2', 'ignored'), file('b2', 'pulled')],
  [together, answer(2)],
  [flip, together, answer(2)],
  [together, answer(1)],
  [...fillSteps('a', DIATOMICS.He2.order, DIATOMICS.He2.e), order(2)],
  [pour('q2p:0', 2), { run: 'magnet' }]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() {}
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { DIATOMICS };
