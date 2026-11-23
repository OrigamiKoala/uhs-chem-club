/**
 * q8-trends.js — Lanternfall, bench eight: PERIODIC TRENDS.
 *
 * The tile store. Bench seven showed that rows exist; this one measures what holds an electron in one and follows the answer across the table.
 * The whole bench is one law applied three ways: charge pulls, distance weakens it, and other electrons in the way cancel some of it.
 *
 * Rebuilt in the teaching pass of 2026-11-12 (the bench before it is `archive/2026-11-11/lanternfall/q8-trends.before.js`). Before, each
 * instrument printed the property being ranked for every card, and the cause arrived in the reward. Now:
 *
 * ONE MODEL ON EVERY CARD (`trends-draw.js` `paintAtom`): the nucleus and its charge, the inner shells as a dim band with their electron
 * count, the outermost electrons bright. Cards are drawn at one size (`plain`) while a stage asks which atom is bigger, and to scale after.
 * AN INSTRUMENT MEASURES ONE REFERENCE CASE, fixed in its holder (`seatedAtom`), or shows only the cause (the charge instrument prints the
 * nucleus's charge, the electrons between and the charge felt, never a size or an energy). The cards the stage asks about are reasoned.
 *
 *   1  PREDICT: lithium or carbon, which is bigger
 *   2  briefing: shielding. Lithium on the charge instrument; four other atoms sorted by charge felt   -> effective nuclear charge
 *   3  four atoms of one period, same shell, ordered by size from the charge felt                     -> atomic radius across a period
 *   4  three atoms of one group, same charge felt, ordered by size from their shells                  -> atomic radius down a group
 *   5  lithium's ionization energy measured; sodium, carbon and fluorine ordered from charge felt and distance
 *   6  beryllium and boron both measured; why boron's is lower, with both atoms' subshells drawn       -> the dip
 *   7  sodium loses an electron and is seen to shrink; chloride's size is reasoned                    -> ionic radius
 *   8  carbon's electron affinity measured; which of N, O, F releases the most
 *   9  four atoms ordered by electronegativity from charge felt and distance
 *
 * EVERY FIGURE IS REAL: radii, ionization energies, electron affinities and electronegativities come from `electrons.js`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  trendsTable, gainFixture, gainOf, atomCard, seatedAtom, springFixture, stripFixture, sizerFixture, electronPiece, levelsFixture,
  springRead, stripRead, pullOf, feelsOf, costOf, itemOf, sizeNow, planPull, shellsOf, outerShell,
  RADIUS, ION_RADIUS, IONIZATION, zOf, nameOf
} from '../../table/kits/trends.js';

export const meta = { stageCount: 9 };

/** The stage whose card confirms each term; each is defined in a briefing before it is needed. */
export const VOCABULARY = [
  { term: /\beffective nuclear charge\b/i, introducedAt: 1 },
  { term: /\batomic radi(?:us|i)\b/i, introducedAt: 3 },
  { term: /\bionization energ(?:y|ies)\b/i, introducedAt: 5 },
  { term: /\bionic radi(?:us|i)\b/i, introducedAt: 7 },
  { term: /\belectron affinity\b/i, introducedAt: 8 },
  { term: /\belectronegativity\b/i, introducedAt: 9 }
];

export const BUILDS_ON = ['unit02/q7-pes', 'unit02/q6-filling'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit02/q8-trends';
const GUESS_LABEL = { li: 'Lithium', c: 'Carbon', same: 'The same' };

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const SPRING = 'sp';
const STRIP = 'st';
const GAIN = 'ga';

const ROW_Y = 53;
const rowAt = i => ({ x: 14 + i * 24, y: ROW_Y });
const NAMES = { Li: 'LITHIUM', Na: 'SODIUM', Be: 'BERYLLIUM', Mg: 'MAGNESIUM', B: 'BORON', C: 'CARBON', N: 'NITROGEN', F: 'FLUORINE', K: 'POTASSIUM', Cl: 'CHLORINE', O: 'OXYGEN' };
/** Atom cards in a row along the bottom: `[id, sym]` each. `plain` draws every card at one size (a stage that asks which is bigger). */
const row = (list, opts = {}) => list.map(([id, sym], i) => atomCard(id, NAMES[sym], sym, rowAt(i), opts));

const railAt = (first, last) => ({ id: 'rail', at: { x: 108, y: 35 }, size: { w: 80, h: 17 }, first, last, items: [], labelLift: 1.6 });
const railOf = t => t.zones.rail.order.slice();
const where = (t, id) => (t.pieces[id].zone || '').replace(/^(tray|slot):/, '');
const sym = (t, id) => t.pieces[id].props.sym;
const name = (t, id) => nameOf(sym(t, id));
const cap = w => w.charAt(0).toUpperCase() + w.slice(1);

/** A tray that holds cards across, one row. */
const tray = (id, label, at, w) => ({ id, label, at, size: { w, h: 22 }, cell: 21 });

/** Answer cards along the bottom right, and the slot one of them goes in. */
const answers = list => list.map(([id, label], i) => ({ id, kind: 'card', label, at: { x: 72 + i * 32, y: ROW_Y }, r: 7, props: {} }));
const answerSlot = { id: 'answer', label: 'Answer', at: { x: 128, y: 16 }, size: { w: 40, h: 13 } };
const answered = t => Object.values(t.pieces).find(p => p.zone === 'slot:answer') || null;

/** A rail check: the cards in the order of `value`, lowest first; a miss names the first pair out of order by what the cards show. */
function ranked(t, ids, value, wrong) {
  const order = railOf(t);
  if (order.length < ids.length) return { ok: false, notYet: true, msg: `Put all ${ids.length} atoms on the rail.` };
  const want = ids.slice().sort((p, q) => value(sym(t, p)) - value(sym(t, q)));
  if (order.join() === want.join()) return { ok: true };
  for (let k = 0; k < order.length - 1; k++) {
    if (value(sym(t, order[k])) > value(sym(t, order[k + 1]))) return { ok: false, msg: wrong(order[k], order[k + 1]) };
  }
  return { ok: false, msg: 'The rail is not in order.' };
}

/** What a card shows about an atom: the charge its outermost electron feels, and how many shells it has. */
const felt = s => feelsOf(s);
const shellCount = s => shellsOf(s).length;

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const shieldRig = {
      id: 'shield',
      kind: 'shield',
      label: 'Electron Shielding',
      at: { x: 75, y: 31 },
      size: { w: 122, h: 52 },
      noRun: true,
      dials: {
        protons: { min: 3, max: 12, step: 1, value: 11, label: 'Nucleus protons (+Z)' },
        inner: { min: 0, max: 10, step: 1, value: 0, label: 'Inner electrons shielding' }
      },
      props: { backdrop: true }
    };
    return {
      title: 'Electron Shielding',
      briefing: {
        speaker: SPEAKER,
        body: 'Inner-shell electrons sit between the positive nucleus and the outer valence electron, blocking part of the nucleus\'s pull. This blocking is called shielding.'
      },
      prompt: 'Sodium has a +11 nucleus and 10 inner electrons: dial in its shielding electrons to see what net pull its outer electron feels.',
      widget,
      table: trendsTable({
        pieces: [],
        fixtures: [shieldRig],
        zones: {}
      }),
      hints: [
        'Use the "Inner electrons shielding" dial and watch the amber pull lines from the +11 nucleus.',
        'Each inner electron blocks one unit of nuclear charge from reaching the outer electron.',
        'Set Nucleus protons to +11 and Inner electrons shielding to 10 so the outer electron feels +1.'
      ],
      check(state) {
        const d = state.table.fixtures.shield.dials;
        const z = Math.round(d.protons.value);
        const s = Math.round(d.inner.value);
        if (s === 0) return { ok: false, notYet: true, msg: 'Add inner shielding electrons with the dial and watch how the pull lines change.' };
        if (z === 11 && s === 10) return { ok: true };
        if (z !== 11) return { ok: false, msg: `Sodium has 11 protons (+11), not +${z}.` };
        return { ok: false, msg: `Sodium has 10 inner electrons (2 in shell 1, 8 in shell 2), not ${s}.` };
      },
      reward: {
        log: 'Effective nuclear charge = nucleus charge minus inner shielding electrons.',
        title: 'Effective Nuclear Charge',
        body: 'Sodium\'s +11 nucleus is shielded by 10 inner electrons, so its outer electron feels a net pull of about +1. This net pull is the effective nuclear charge.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Bigger Atoms',
    // A PREDICT STAGE: right before stage 3, which tests it.
    predict: true,
    prompt: 'Carbon has six protons and six electrons, lithium has three of each: which atom is bigger?',
    widget,
    table: trendsTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 34, h: 14 } },
        tokens: [
          { id: 'li', label: 'Lithium', at: { x: 38, y: 48 }, r: 7 },
          { id: 'c', label: 'Carbon', at: { x: 75, y: 48 }, r: 7 },
          { id: 'same', label: 'The same', at: { x: 112, y: 48 }, r: 7 }
        ]
      }
    }),
    hints: [
      'Drag one of the three cards into the slot.',
      'Think what carbon has more of, and what each of those things does to the size of the atom.',
      'A prediction is not graded, so choose the one you think is most likely.'
    ],
    check(state) {
      if (!state.table.prediction?.token) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const token = state.table.prediction?.token;
      if (token) remember(QUEST_KEY, token);
    },
    reward: {
      log: 'Prediction made.',
      title: 'Prediction',
      body: 'Now test your prediction by putting the four atoms in order.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const sp = springFixture(SPRING, { x: 33, y: 19 }, { show: { feel: true } });
    const ids = ['li', 'be', 'b', 'c'];
    return {
      title: 'Across a Period',
      briefing: {
        speaker: SPEAKER,
        body: 'An atom\'s size is given as its atomic radius, the distance from the nucleus to its outermost electrons. A period is a row of the periodic table: lithium, beryllium, boron and carbon are neighbours in one.'
      },
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}" is bigger: what is the order of these four atoms from smallest to largest?`
          : 'What is the order of these four atoms from the smallest to the largest?';
      },
      widget,
      table: trendsTable({
        pieces: row([['c', 'C'], ['li', 'Li'], ['b', 'B'], ['be', 'Be']], { plain: true }),
        fixtures: [sp.fixture],
        zones: { slots: sp.slots, rail: railAt('Smallest', 'Largest') }
      }),
      hints: [
        'The cards are all drawn the same size; put any atom in the holder to see the charge its outermost electron feels.',
        'Compare the charge felt in the four atoms, and notice that all four have the same number of shells.',
        'The outermost electrons are in the same shell in all four, so think what a stronger attraction does to that shell.'
      ],
      check(state) {
        const t = state.table;
        return ranked(t, ids, s => RADIUS[s], (p, q) => `${cap(name(t, p))} stands left of ${name(t, q)}, and ${name(t, p)}'s outermost electrons feel +${felt(sym(t, p))} against +${felt(sym(t, q))} in the same shell.`);
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'li' ? 'Your prediction held. ' : 'This did not agree with your prediction. ';
        return {
          log: 'Across a period: more charge felt, same shell, smaller atom.',
          title: 'Atomic Radius Across a Period',
          body: `${verdict}Each step across adds a proton but no inner electrons, so the same shell is pulled closer. Atomic radius falls across a period: lithium 152 pm (picometres), carbon 77 pm.`,
          model: {
            type: 'radii',
            shrink: true,
            items: [{ sym: 'Li', pm: 152 }, { sym: 'Be', pm: 112 }, { sym: 'B', pm: 85 }, { sym: 'C', pm: 77 }]
          }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const sp = springFixture(SPRING, { x: 33, y: 19 }, { show: { feel: true } });
    const ids = ['li', 'na', 'k'];
    return {
      title: 'Down a Group',
      briefing: {
        speaker: SPEAKER,
        body: 'A group is a column of the periodic table. Lithium, sodium and potassium stand one below another in the first group.'
      },
      prompt: 'What is the order of lithium, sodium and potassium from the smallest atom to the largest?',
      widget,
      table: trendsTable({
        pieces: row([['na', 'Na'], ['k', 'K'], ['li', 'Li']], { plain: true }),
        fixtures: [sp.fixture],
        zones: { slots: sp.slots, rail: railAt('Smallest', 'Largest') }
      }),
      hints: [
        'Put each atom in the holder to see the charge its outermost electron feels.',
        'Compare the charge felt in the three atoms, then count the shells drawn on each card.',
        'The charge felt does not tell these three apart, so think what one more shell of electrons does to the size of an atom.'
      ],
      check(state) {
        const t = state.table;
        return ranked(t, ids, s => RADIUS[s], (p, q) => `${cap(name(t, p))} stands left of ${name(t, q)}; both outermost electrons feel +${felt(sym(t, p))}, and ${name(t, p)} has ${shellCount(sym(t, p))} shells against ${shellCount(sym(t, q))}.`);
      },
      reward: {
        log: 'Down a group: same charge felt, one more shell each time, larger atom.',
        title: 'Atomic Radius Down a Group',
        body: 'All three outermost electrons feel about +1, but each atom has one more shell than the one above it. Atomic radius rises down a group.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const ids = ['na', 'c', 'f'];
    return {
      title: 'Removing an Electron',
      briefing: {
        speaker: SPEAKER,
        body: 'The energy needed to remove the outermost electron from an atom is its ionization energy. The more strongly the nucleus attracts that electron, the more energy it takes.'
      },
      prompt: 'What is the order of sodium, carbon and fluorine from the lowest ionization energy to the highest?',
      widget,
      table: trendsTable({
        pieces: [
          atomCard('c', NAMES.C, 'C', { x: 42, y: 52 }),
          atomCard('f', NAMES.F, 'F', { x: 75, y: 52 }),
          atomCard('na', NAMES.Na, 'Na', { x: 108, y: 52 })
        ],
        fixtures: [],
        zones: { rail: { id: 'rail', at: { x: 75, y: 24 }, size: { w: 112, h: 17 }, first: 'Lowest ionization energy', last: 'Highest ionization energy', items: [], labelLift: 1.6 } }
      }),
      hints: [
        'Drag the three cards onto the rail; the cards are drawn to scale.',
        'Compare the charge each atom\'s outermost electron feels and how far that electron sits from the nucleus.',
        'An electron is attracted more strongly when it feels a larger charge and when it is closer to the nucleus.'
      ],
      check(state) {
        const t = state.table;
        return ranked(t, ids, s => IONIZATION[s], (p, q) => `${cap(name(t, p))} stands left of ${name(t, q)}, but its outermost electron feels +${felt(sym(t, p))} at ${RADIUS[sym(t, p)] ?? 99} pm against +${felt(sym(t, q))} at ${RADIUS[sym(t, q)] ?? 99} pm.`);
      },
      reward: {
        log: 'Ionization energy: up across a period, down a group.',
        title: 'Ionization Energy',
        body: 'Sodium\'s outer electron feels +1 from far out; fluorine\'s feels +7 from close in. Ionization energy rises across a period and falls down a group.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const st = stripFixture(STRIP, { x: 27, y: 18 });
    return {
      title: 'Boron\'s Dip',
      prompt: 'Why does boron\'s outermost electron take less energy to remove than beryllium\'s?',
      widget,
      table: trendsTable({
        pieces: [...row([['be', 'Be'], ['b', 'B']]), ...answers([['p', '2p lies above 2s'], ['z', 'Fewer protons'], ['r', 'A larger atom']])],
        fixtures: [st.fixture, levelsFixture('lv', { x: 80, y: 18 }, ['Be', 'B'])],
        zones: { slots: [...st.slots, answerSlot] }
      }),
      hints: [
        'Remove an electron from each atom in turn, then drag one of the three answer cards into the slot.',
        'Compare the two cards and the subshell diagram: the nucleus, the size, and where each outermost electron is.',
        'Two of the three answers are not true of boron, so check each one against what the cards and the diagram show.'
      ],
      check(state) {
        const t = state.table;
        if (t.pieces.be.props.lastCost == null || t.pieces.b.props.lastCost == null) return { ok: false, notYet: true, msg: 'Remove an electron from both atoms first.' };
        const pick = answered(t);
        if (!pick) return { ok: false, notYet: true, msg: 'Put an answer card in the slot.' };
        if (pick.id === 'p') return { ok: true };
        if (pick.id === 'z') return { ok: false, msg: `Boron's nucleus is +${zOf('B')} and beryllium's is +${zOf('Be')}.` };
        return { ok: false, msg: `Boron's radius is ${RADIUS.B} pm and beryllium's is ${RADIUS.Be} pm.` };
      },
      reward: {
        log: 'Boron: outer electron in 2p, above 2s.',
        title: 'A Dip in the Trend',
        body: 'Boron\'s outermost electron is in a 2p orbital, which lies above 2s in energy, so it is easier to remove. The rise across a period has small dips like this one.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const sz = sizerFixture('sz', { x: 27, y: 18 }, { label: 'Size gauge' });
    return {
      title: 'Ions',
      briefing: {
        speaker: SPEAKER,
        body: 'An atom that has lost or gained electrons is an ion. Its size is its ionic radius.'
      },
      prompt: 'A chlorine atom gains one electron to form a chloride ion: is the chloride ion larger or smaller than the atom?',
      widget,
      table: trendsTable({
        pieces: [
          atomCard('cl', NAMES.Cl, 'Cl', { x: 24, y: ROW_Y }),
          electronPiece('addE', { x: 66, y: 18 }, 'Add Electron'),
          ...answers([['larger', 'Larger'], ['same', 'The same size'], ['smaller', 'Smaller']])
        ],
        fixtures: [sz.fixture],
        zones: { slots: [...sz.slots, answerSlot] }
      }),
      hints: [
        'Put Chlorine in the Size gauge to see its radius, then drag "Add Electron" onto Chlorine.',
        'Compare the radius of the neutral chlorine atom with the chloride ion after adding an electron.',
        'Chlorine\'s nucleus stays +17 while its outer shell gains an electron, and electrons repel one another.'
      ],
      check(state) {
        const t = state.table;
        if ((t.pieces.cl.props.charge || 0) >= 0) return { ok: false, notYet: true, msg: 'Drag "Add Electron" onto the chlorine atom first to form a chloride ion.' };
        const pick = answered(t);
        if (!pick) return { ok: false, notYet: true, msg: 'Put an answer card in the Answer slot.' };
        if (pick.id === 'larger') return { ok: true };
        return { ok: false, msg: 'Chloride has 18 electrons round the same nucleus of +17 that held 17, and the added one is in the outer shell.' };
      },
      reward: {
        log: 'Positive ions are smaller than their atoms; negative ions are larger.',
        title: 'Ionic Radius',
        body: 'Chloride\'s extra electron adds repulsion with no extra protons, so its ionic radius (181 pm) is larger than the neutral chlorine atom (99 pm).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const g = gainFixture(GAIN, { x: 27, y: 18 }, { mode: 'affinity' });
    return {
      title: 'Gaining an Electron',
      briefing: {
        speaker: SPEAKER,
        body: 'An atom usually releases energy when it gains an electron, and the energy released is its electron affinity. The more strongly the nucleus attracts the added electron, the more is released.'
      },
      prompt: 'Which of nitrogen, oxygen and fluorine releases the most energy when it gains an electron?',
      widget,
      table: trendsTable({
        pieces: [seatedAtom('c', NAMES.C, 'C', g), ...row([['o', 'O'], ['f', 'F'], ['n', 'N']])],
        fixtures: [g.fixture],
        zones: { slots: [...g.slots, { id: 'most', label: 'Releases the most', at: { x: 112, y: 20 }, size: { w: 22, h: 21 } }] }
      }),
      hints: [
        'Press "Add Electron" to measure carbon, then drag one atom card into the slot.',
        'Compare the charge the outermost electrons feel in each atom, and each atom\'s size.',
        'The added electron joins the outer shell, so think in which atom it would feel the largest charge from the shortest distance.'
      ],
      check(state) {
        const t = state.table;
        if (t.pieces.c.props.lastGain == null) return { ok: false, notYet: true, msg: 'Measure carbon first.' };
        const pick = Object.values(t.pieces).find(p => p.zone === 'slot:most');
        if (!pick) return { ok: false, notYet: true, msg: 'Put an atom card in the slot.' };
        if (pick.id === 'f') return { ok: true };
        return { ok: false, msg: `An electron added to ${name(t, pick.id)} would feel about +${felt(sym(t, pick.id))}, and another atom here offers a larger charge at a shorter distance.` };
      },
      reward: {
        log: 'Fluorine releases the most.',
        title: 'Electron Affinity',
        body: 'Fluorine: an added electron feels the largest charge from the shortest distance.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 9 */
  (() => {
    const sp = springFixture(SPRING, { x: 33, y: 19 }, { show: { feel: true, dist: true } });
    const ids = ['na', 'c', 'o', 'f'];
    return {
      title: 'Pull in a Bond',
      briefing: {
        speaker: SPEAKER,
        body: 'When two atoms join in a chemical bond, they share electrons at the edge of each atom. Electronegativity is how strongly an atom attracts the electrons it shares.'
      },
      prompt: 'What is the order of sodium, carbon, oxygen and fluorine from the lowest electronegativity to the highest?',
      widget,
      table: trendsTable({
        pieces: row([['o', 'O'], ['na', 'Na'], ['f', 'F'], ['c', 'C']]),
        fixtures: [sp.fixture],
        zones: { slots: sp.slots, rail: railAt('Lowest electronegativity', 'Highest electronegativity') }
      }),
      hints: [
        'Put each atom in the holder to see the charge its outermost electron feels and its distance from the nucleus.',
        'Compare the charge felt and the distance for the four atoms.',
        'A shared electron is attracted like an outermost one: most strongly by a large charge felt at a short distance.'
      ],
      check(state) {
        const t = state.table;
        return ranked(t, ids, s => gainOf(s, 'pauling'), (p, q) => `${cap(name(t, p))} stands left of ${name(t, q)}, but an electron at its edge feels +${felt(sym(t, p))} at ${RADIUS[sym(t, p)]} pm against +${felt(sym(t, q))} at ${RADIUS[sym(t, q)]} pm.`);
      },
      reward: {
        log: 'Electronegativity: up across a period, down a group.',
        title: 'Electronegativity',
        body: 'Across this row, electronegativity rises from sodium to fluorine as the outer charge felt rises and the atom gets smaller; a metal such as sodium is low.',
        model: { type: 'electronegativity-pull', left: 'H', right: 'F', enLeft: 2.2, enRight: 4.0, caption: 'More electronegative fluorine pulls the shared electrons closer.' },
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  3: ['Drag an atom into the holder, and onto the rail to order it.']
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
      body: 'An outermost electron is attracted by the effective nuclear charge, the nucleus\'s charge less the shielding of the inner electrons, from a distance set by its shell. Atomic radius, ionization energy, electron affinity and electronegativity all follow from those two things.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Across a period the charge felt rises and atoms shrink and hold their electrons harder. Down a group a shell is added and they grow and hold them less. That is most of the pattern of the periodic table.'
    },
    {
      heading: 'Next',
      body: 'Next: what a coloured solution does to the light that passes through it.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const SPRING_SLOT = `slot:${SPRING}.atom`;
const STRIP_SLOT = `slot:${STRIP}.atom`;
const strip = id => [put(id, STRIP_SLOT), { run: STRIP }];
const onRail = ids => ids.map((id, i) => put(id, `rail:${i}`));

export const SOLUTIONS = [
  [{ setDial: { fixture: 'shield', dial: 'protons', value: 11 } }, { setDial: { fixture: 'shield', dial: 'inner', value: 10 } }],
  [{ predict: 'li' }],
  [put('li', SPRING_SLOT), put('c', SPRING_SLOT), ...onRail(['c', 'b', 'be', 'li'])],
  [put('na', SPRING_SLOT), put('k', SPRING_SLOT), ...onRail(['li', 'na', 'k'])],
  [...onRail(['na', 'c', 'f'])],
  [...strip('be'), ...strip('b'), put('p', 'slot:answer')],
  [{ join: ['addE', 'cl'] }, put('cl', 'slot:sz.atom'), put('larger', 'slot:answer')],
  [{ run: GAIN }, put('f', 'slot:most')],
  [put('f', SPRING_SLOT), ...onRail(['na', 'c', 'o', 'f'])]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [{ setDial: { fixture: 'shield', dial: 'protons', value: 11 } }, { setDial: { fixture: 'shield', dial: 'inner', value: 4 } }],
  [],
  [...onRail(['li', 'be', 'b', 'c'])],
  [...onRail(['k', 'na', 'li'])],
  [...onRail(['c', 'na', 'f'])],
  [...strip('be'), ...strip('b'), put('z', 'slot:answer')],
  [{ join: ['addE', 'cl'] }, put('smaller', 'slot:answer')],
  [{ run: GAIN }, put('n', 'slot:most')],
  [...onRail(['f', 'o', 'c', 'na'])]
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
export { springRead, stripRead, pullOf, feelsOf, costOf, itemOf, sizeNow, planPull, shellsOf, outerShell, gainOf, RADIUS, ION_RADIUS, IONIZATION, zOf, nameOf, QUEST_KEY };
