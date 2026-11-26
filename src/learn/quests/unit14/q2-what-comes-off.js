/**
 * Unit 14 · Bench 2 — What Comes Off (q2-what-comes-off)
 *
 * The shield cell in Cinder Halo's second crater, on the nuke kit. Eight stages and ONE click: the belief that the biggest, heaviest
 * particle punches through the most. The shields answer it: the heavy alpha particle stops in paper and gamma, with no mass, goes
 * furthest, because a charged particle pulls electrons off every atom it passes (the trail of ions in the window) and spends its energy
 * doing it. Charged plates sort the three radiations first; the names are earned one stage at a time.
 *
 *   1  three sources between charged plates                           -> R runs straight: no charge, a gamma ray
 *   2  the same three                                                  -> Q bends to the positive plate: beta particles
 *   3  three new sources, after a briefing on what an alpha particle is -> the one bent a little toward negative: alpha
 *   4  PREDICT: which passes paper and aluminium most easily?
 *   5  TEST: shields of paper, aluminium and lead                       -> gamma; the dense trail of ions stops alpha
 *   6  a swallowed source in a strip of cells                          -> alpha does most harm beside it
 *   7  a source of two radiations, by shields alone                    -> alpha and gamma
 *   8  SEALED: three sealed sources sorted by shields alone
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { nukeTable, ncountFixture, keptCount, nsrc, nshield, ntissueFixture, nchoiceFixture, chosenIndex, note } from '../../table/kits/nuke.js';
import { commas } from '../../table/kits/nuke-draw.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bgamma rays?\b/i, introducedAt: 1 },
  { term: /\bbeta particles?\b/i, introducedAt: 2 },
  { term: /\balpha particles?\b/i, introducedAt: 3 },
  { term: /\bionizing\b/i, introducedAt: 5 }
];

/** Radiation, counts and the counter (bench 1); ions (Tallow `q4-ledger`). */
export const BUILDS_ON = ['unit14/q1-still-warm', 'unit01/q4-ledger'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit14/q2-what-comes-off';
const GUESS = { 'g-alpha': 'alpha', 'g-beta': 'beta', 'g-gamma': 'gamma' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;
const seen = card => Boolean(card.props.seen);
const PLATES_AT = { x: 98, y: 28 };

/** Which way a source's tracks go between the plates, said as the table shows it. */
const BEND = {
  po210: 'tracks bend a little toward the negative plate',
  po210b: 'tracks bend a little toward the negative plate',
  sr90: 'tracks bend sharply toward the positive plate',
  co60s: 'tracks run straight between the plates'
};
const platesMiss = (card, ask) => (seen(card) ? `${card.label}'s ${BEND[card.props.src]}.` : `${card.label} has not been run between the plates yet; ${ask}`);

function platesStage({ id, title, prompt, briefing = null, cards, slotLabel, answer, hints, reward }) {
  const R = ncountFixture('rig', PLATES_AT, { plates: true, title: 'Counter, with charged plates' });
  return {
    id, title, prompt, widget,
    ...(briefing ? { briefing: { speaker: SPEAKER, body: briefing } } : {}),
    table: nukeTable({
      pieces: cards.map(([cid, src, text], i) => nsrc(cid, src, { x: 12, y: 10 + i * 16 }, { text })),
      fixtures: [R.fixture],
      zones: { slots: [R.slot, { id: 'ans', label: slotLabel, at: { x: 38, y: 51 }, size: { w: 22, h: 12 } }] }
    }),
    hints,
    check(state) {
      const card = inSlot(state, 'ans');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a source card in the answer slot.' };
      if (card.props.src === answer) return { ok: true };
      return { ok: false, msg: platesMiss(card, 'run it to see where its tracks go.') };
    },
    reward
  };
}

const SHIELD_ROW = (y = 56.5) => [nshield('sh-paper', 'paper', { x: 66, y }), nshield('sh-al', 'aluminium', { x: 90, y }), nshield('sh-pb', 'lead', { x: 114, y })];

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  platesStage({
    id: 's1-straight',
    title: 'Between the Plates',
    briefing: 'Two charged plates stand either side of the tracks: positive above, negative below. Opposite charges attract, and like charges repel.',
    prompt: 'Which source gives off radiation with no charge?',
    cards: [['src-p', 'po210', 'Source P'], ['src-q', 'sr90', 'Source Q'], ['src-r', 'co60s', 'Source R']],
    slotLabel: 'No charge',
    answer: 'co60s',
    hints: [
      'Lay a source in the Sample slot and press "Run", then try the other two.',
      'Compare which way each source\'s tracks turn between the plates.',
      'A charged track is pulled toward the plate of the opposite charge, so ask which track nothing pulls.'
    ],
    reward: { log: 'Source R: straight between the plates, no charge.', title: 'Gamma Rays', body: 'R: its tracks ran straight between the plates. Radiation with no charge and no mass, energy like light, is a gamma ray.' }
  }),

  /* ---------------------------------------------------------------- 2 */
  platesStage({
    id: 's2-negative',
    title: 'Toward the Positive Plate',
    prompt: 'Which source throws out negatively charged particles?',
    cards: [['src-p', 'po210', 'Source P'], ['src-q', 'sr90', 'Source Q'], ['src-r', 'co60s', 'Source R']],
    slotLabel: 'Negative',
    answer: 'sr90',
    hints: [
      'Run each source between the plates.',
      'Look at which plate each source\'s tracks turn toward.',
      'A negative particle is pulled toward the plate whose charge is opposite to its own.'
    ],
    reward: { log: 'Source Q: bent toward the positive plate, negative.', title: 'Beta Particles', body: 'Q: its particles bend toward the positive plate, so they are negative. Each is an electron thrown out of a nucleus: a beta particle.' }
  }),

  /* ---------------------------------------------------------------- 3 */
  platesStage({
    id: 's3-alpha',
    title: 'Heavy and Positive',
    briefing: 'An alpha particle is two protons and two neutrons bound together, over 7,000 times as heavy as an electron. Its charge is +2, so the plates pull on it, but its mass turns it far less.',
    prompt: 'Which of these three new sources throws out alpha particles?',
    cards: [['src-s', 'sr90', 'Source S'], ['src-t', 'po210b', 'Source T'], ['src-u', 'co60s', 'Source U']],
    slotLabel: 'Alpha',
    answer: 'po210b',
    hints: [
      'Run each of the three new sources between the plates.',
      'Compare both the plate each track turns toward and how far it turns.',
      'A positive particle turns toward the negative plate, and a heavy one turns only a little.'
    ],
    reward: { log: 'Source T: positive and bent a little, alpha particles.', title: 'Alpha Particles', body: 'T: positive, and bent only a little because it is heavy. Each alpha particle is a helium-4 nucleus, two protons and two neutrons, written ⁴₂He.' }
  }),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict',
    title: 'Through or Not',
    predict: true,
    prompt: 'Which radiation do you expect to pass most easily through a sheet of paper and a slab of aluminium?',
    widget,
    table: nukeTable({
      pieces: [
        note('g-alpha', 'Alpha: the heaviest, charge +2', { x: 34, y: 14 }),
        note('g-beta', 'Beta: a light electron, charge −1', { x: 34, y: 33 }),
        note('g-gamma', 'Gamma: no mass, no charge', { x: 34, y: 52 })
      ],
      fixtures: [],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 30 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'Each card says how heavy the radiation is and what charge it carries.',
      'A sheet of paper or metal is atoms, each with electrons round its nucleus.',
      'Think about what a charged particle does to every electron it passes close to, and what that costs it.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it with the shields.' }
  },

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const R = ncountFixture('rig', { x: 98, y: 26 }, { shields: true, h: 44, title: 'Counter, with a shield slot' });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's5-shields',
      title: 'Paper, Aluminium, Lead',
      briefing: { speaker: SPEAKER, body: 'A charged particle pulls on the electrons of every atom it passes and tears some off, leaving a trail of ions. Each one it makes costs it energy.' },
      get prompt() { const g = guess(); return `Which radiation gets through 5 mm of aluminium?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: nukeTable({
        pieces: [
          nsrc('src-a', 'po210', { x: 12, y: 8 }, { text: 'Alpha source' }),
          nsrc('src-b', 'sr90', { x: 12, y: 23 }, { text: 'Beta source' }),
          nsrc('src-g', 'co60s', { x: 12, y: 38 }, { text: 'Gamma source' }),
          ...SHIELD_ROW()
        ],
        fixtures: [R.fixture],
        zones: { slots: [R.slot, R.shieldSlot, { id: 'ans', label: 'Through aluminium', at: { x: 12, y: 52 }, size: { w: 20, h: 12 } }] }
      }),
      hints: [
        'Lay a source in the Sample slot and a shield in the Shield slot, then press "Count".',
        'In the window, compare how many ions each track leaves and where each one stops.',
        'Each ion a particle makes costs it energy, so ask which radiation makes fewest.'
      ],
      check(state) {
        const card = inSlot(state, 'ans');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a source card in the answer slot.' };
        if (card.props.src === 'co60s') return { ok: true };
        const c = keptCount(state.table, card.id, { shield: 'aluminium' });
        return { ok: false, msg: c != null ? `With aluminium in the Shield slot, the ${card.label.toLowerCase()} counted ${commas(c)}, the background.` : `The ${card.label.toLowerCase()} has not been counted behind aluminium.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Gamma passed aluminium; alpha stopped in paper, beta in aluminium.',
          title: 'Ionizing Radiation',
          body: `Gamma${g ? ` (you predicted ${g})` : ''}: alpha's dense trail of ions stopped it in paper and beta's in aluminium, while gamma rarely ionizes. Radiation that tears electrons off atoms is ionizing radiation.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-inside',
    title: 'Inside the Body',
    prompt: 'A source is swallowed: which radiation does most damage to the cells right beside it?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        ntissueFixture('cells', { x: 55, y: 31 }, { w: 104, h: 48 }),
        nchoiceFixture('ans', 'Most damage beside it', { x: 128, y: 32 }, { options: ['Alpha', 'Beta', 'Gamma'], w: 38 })
      ]
    }),
    hints: [
      'Tap Alpha, Beta and Gamma on the strip in turn.',
      'Count the broken molecules each trail leaves in the first few cells beside the source.',
      'Damage to a cell comes from the molecules broken inside it, so look for the trail that spends itself closest.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three.' };
      if (pick === 1) return { ok: true };
      if (pick === 3) return { ok: false, msg: 'The gamma ray broke one molecule in the whole strip.' };
      return { ok: false, msg: 'The beta trail broke a few molecules, spread over many cells.' };
    },
    reward: { log: 'Alpha breaks most molecules beside the source.', title: 'Close and Dense', body: 'Alpha: inside the body it spends all its energy in the first few cells, breaking many molecules there. Outside the body, the dead outer layer of skin stops it.' }
  },

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const R = ncountFixture('rig', { x: 80, y: 22 }, { shields: true, w: 70, h: 40, title: 'Counter, with a shield slot' });
    return {
      id: 's7-mixed',
      title: 'The Mixed Source',
      prompt: 'Which radiations does source M give off?',
      widget,
      table: nukeTable({
        pieces: [
          nsrc('src-m', 'am241', { x: 12, y: 8 }, { text: 'Source M' }),
          nshield('sh-paper', 'paper', { x: 12, y: 24 }), nshield('sh-al', 'aluminium', { x: 12, y: 40 }), nshield('sh-pb', 'lead', { x: 12, y: 56 })
        ],
        fixtures: [R.fixture, nchoiceFixture('ans', 'Source M gives off', { x: 131, y: 44 }, { options: ['Alpha only', 'Alpha and gamma', 'Beta and gamma', 'Alpha and beta'], w: 28 })],
        zones: { slots: [R.slot, R.shieldSlot] }
      }),
      hints: [
        'Count source M with no shield, then behind each shield in turn.',
        'Look at which shield takes the biggest bite out of the count, and what is left behind each.',
        'Paper stops alpha, aluminium stops beta, and only thick lead slows gamma.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the four statements.' };
        if (pick === 2) return { ok: true };
        const t = state.table;
        const cnt = sh => keptCount(t, 'src-m', { shield: sh });
        const open = cnt('open'); const paper = cnt('paper'); const al = cnt('aluminium');
        if (pick === 1) return { ok: false, msg: paper != null ? `Behind paper, source M still counted ${commas(paper)}.` : 'Source M has not been counted behind paper.' };
        if (pick === 3) return { ok: false, msg: open != null && paper != null ? `Paper took source M from ${commas(open)} to ${commas(paper)}.` : 'Source M has not been counted open and behind paper.' };
        return { ok: false, msg: al != null && paper != null ? `Behind aluminium source M counted ${commas(al)}, against ${commas(paper)} behind paper.` : 'Source M has not been counted behind paper and aluminium.' };
      },
      reward: { log: 'Source M: alpha and gamma.', title: 'Two at Once', body: 'Alpha and gamma: paper took most of the count, and what passed the paper also passed aluminium, stopped only by lead.' }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const R = ncountFixture('rig', { x: 98, y: 22 }, { shields: true, h: 40, title: 'Counter, with a shield slot' });
    const KIND = { co60s: 'gamma', sr90: 'beta', po210: 'alpha' };
    return {
      id: 's8-sealed',
      title: 'Three Sealed Sources',
      prompt: 'Which radiation does each of the sealed sources X, Y and Z give off?',
      widget,
      table: nukeTable({
        pieces: [
          nsrc('src-x', 'co60s', { x: 12, y: 8 }, { text: 'Source X' }), nsrc('src-y', 'sr90', { x: 12, y: 24 }, { text: 'Source Y' }), nsrc('src-z', 'po210', { x: 12, y: 40 }, { text: 'Source Z' }),
          nshield('sh-paper', 'paper', { x: 12, y: 56 }), nshield('sh-al', 'aluminium', { x: 36, y: 56 }), nshield('sh-pb', 'lead', { x: 60, y: 56 })
        ],
        fixtures: [R.fixture],
        zones: {
          slots: [R.slot, R.shieldSlot,
            { id: 'alpha', label: 'Alpha', at: { x: 88, y: 50 }, size: { w: 21, h: 12 } },
            { id: 'beta', label: 'Beta', at: { x: 112, y: 50 }, size: { w: 21, h: 12 } },
            { id: 'gamma', label: 'Gamma', at: { x: 136, y: 50 }, size: { w: 21, h: 12 } }]
        }
      }),
      hints: [
        'Count each sealed source with no shield, then behind paper and behind aluminium.',
        'For each source, find the first shield that brings its count down to the background.',
        'Paper stops alpha, aluminium stops beta, and gamma gets through both.'
      ],
      check(state) {
        const placed = ['alpha', 'beta', 'gamma'].map(k => [k, inSlot(state, k)]);
        if (placed.every(([, c]) => !c)) return { ok: false, notYet: true, msg: 'Lay each source card in the slot of the radiation it gives off.' };
        for (const [k, c] of placed) {
          if (!c) continue;
          if (KIND[c.props.src] !== k) {
            const shield = KIND[c.props.src] === 'alpha' ? 'paper' : KIND[c.props.src] === 'beta' ? (k === 'alpha' ? 'paper' : 'aluminium') : (k === 'alpha' ? 'paper' : 'aluminium');
            const n = keptCount(state.table, c.id, { shield });
            return { ok: false, msg: n != null ? `${c.label} counted ${commas(n)} behind ${shield}.` : `${c.label} has not been counted behind ${shield}.` };
          }
        }
        if (placed.some(([, c]) => !c)) return { ok: false, notYet: true, msg: 'One of the slots is still empty.' };
        return { ok: true };
      },
      reward: { log: 'X gamma, Y beta, Z alpha, by shields alone.', title: 'Told Apart by What Stops Them', body: 'X gamma, Y beta, Z alpha: paper stops alpha, aluminium stops beta, and only thick lead slows gamma.' }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Three radiations come off: alpha, heavy and positive; beta, a light negative electron; gamma, energy with no charge. The charged ones tear electrons off atoms as they go, so they stop soonest.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const run = id => ({ run: id });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const S = 'slot:rig.sample'; const SH = 'slot:rig.shield';
const look = id => [put(id, S), run('rig')];

export const SOLUTIONS = [
  [...look('src-p'), ...look('src-q'), ...look('src-r'), put('src-r', 'slot:ans')],
  [...look('src-p'), ...look('src-q'), put('src-q', 'slot:ans')],
  [...look('src-s'), ...look('src-t'), ...look('src-u'), put('src-t', 'slot:ans')],
  [put('g-alpha', 'slot:guess')],
  [put('sh-al', SH), ...look('src-a'), ...look('src-b'), ...look('src-g'), put('src-g', 'slot:ans')],
  [{ setDial: { fixture: 'cells', dial: 'kind', value: 1 } }, { setDial: { fixture: 'cells', dial: 'kind', value: 2 } }, choose(1)],
  [...look('src-m'), put('sh-paper', SH), run('rig'), put('sh-al', SH), run('rig'), put('sh-pb', SH), run('rig'), choose(2)],
  [put('sh-paper', SH), ...look('src-x'), ...look('src-y'), ...look('src-z'), put('sh-al', SH), ...look('src-x'), ...look('src-y'),
    put('src-z', 'slot:alpha'), put('src-y', 'slot:beta'), put('src-x', 'slot:gamma')]
];

export const MISSES = [
  [...look('src-p'), put('src-p', 'slot:ans')],
  [...look('src-p'), put('src-p', 'slot:ans')],
  [...look('src-u'), put('src-u', 'slot:ans')],
  [],
  [put('sh-al', SH), ...look('src-b'), put('src-b', 'slot:ans')],
  [choose(3)],
  [...look('src-m'), put('sh-paper', SH), run('rig'), choose(1)],
  [put('sh-paper', SH), ...look('src-y'), put('src-y', 'slot:alpha')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
