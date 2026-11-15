/**
 * Unit 14 · Bench 1 — Still Warm (q1-still-warm)
 *
 * The drum store in Cinder Halo's first crater, on the nuke kit (`table/kits/nuke.js`). Eight stages and ONE click: the belief that
 * radioactivity behaves like a chemical reaction, slower when it is cold. The counter answers it: chilled to −40 °C the ore counts what
 * it counted at 20 °C, because heat and cold reach the atoms' motion and their electrons, never the nucleus. The bench also answers the
 * story's oldest clue (Bellows' Warm Cylinder): a sealed drum of this ore stays warm because the radiation stopped in it hands its energy
 * to the atoms there.
 *
 *   1  two ores and an empty slot on the counter                       -> ore A gives off radiation: radioactive
 *   2  the empty counter, with lead closed round its tube              -> the clicks come from outside: background radiation
 *   3  one uranium nucleus watched as it gives off radiation           -> 90 protons left: thorium; radioactive decay
 *   4  PREDICT: chilled to −40 °C, what does the count do?
 *   5  TEST: count at −40, 20 and 300 °C                               -> the same, within a count's scatter
 *   6  1 g and 2 g counted; type 5 g's count                           -> count rate in step with the number of nuclei
 *   7  two sealed drums, one of uranium ore, one of iron ore           -> radiation stopped in the drum warms it
 *   8  SEALED: three drums at three temperatures                       -> the counter, not the warmth, finds the ore
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  nukeTable, ncountFixture, keptCount, keptCounts, nsrc, nnucFixture, nchoiceFixture, chosenIndex, nleadFixture, ndrumFixture,
  note, plaqueFixture
} from '../../table/kits/nuke.js';
import { commas } from '../../table/kits/nuke-draw.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bradioactive\b/i, introducedAt: 1 },
  { term: /\bbackground radiation\b/i, introducedAt: 2 },
  { term: /\bradioactive decay\b/i, introducedAt: 3 },
  { term: /\bcount rate\b/i, introducedAt: 6 }
];

/** The nucleus, its protons and neutrons, the atomic number (Tallow `q2-core`); mass number and ions (Tallow `q4-ledger`). */
export const BUILDS_ON = ['unit01/q2-core', 'unit01/q4-ledger'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit14/q1-still-warm';
const GUESS = { 'g-falls': 'that it falls', 'g-same': 'that it stays the same', 'g-rises': 'that it rises' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;
const RIG_AT = { x: 98, y: 30 };

/** Slips a student makes on stage 6 (typed), each refused with a reason (`verify:cinderhalo`). */
export const SLIPS = { 6: [1860, 3696, 3720, 7440, 18600, 1840] };

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const R = ncountFixture('rig', RIG_AT);
    return {
      id: 's1-ore',
      title: 'The Clicking Ore',
      briefing: { speaker: SPEAKER, body: 'A counter clicks once for each bit of radiation, energy or a particle thrown out of an atom, that reaches its tube. A few clicks always come from the surroundings, even with nothing in front of it.' },
      prompt: 'Which ore sample gives off radiation of its own?',
      widget,
      table: nukeTable({
        pieces: [nsrc('ore-a', 'oreU', { x: 12, y: 12 }, { text: 'Ore A' }), nsrc('ore-b', 'oreFe', { x: 12, y: 28 }, { text: 'Ore B' })],
        fixtures: [R.fixture],
        zones: { slots: [R.slot, { id: 'gives', label: 'Gives off radiation', at: { x: 24, y: 52 }, size: { w: 40, h: 12 } }] }
      }),
      hints: [
        'Drag a card into the Sample slot and press "Count", then count the other card and the empty slot.',
        'Compare each ore\'s count with what the counter reads with nothing in the slot.',
        'A sample that adds nothing to the empty slot\'s count gives off no radiation of its own.'
      ],
      check(state) {
        const card = inSlot(state, 'gives');
        if (!card) return { ok: false, notYet: true, msg: 'Lay an ore card in the answer slot.' };
        if (card.props.src === 'oreU') return { ok: true };
        const c = keptCount(state.table, card.id);
        return { ok: false, msg: c != null ? `Ore B counted ${commas(c)} in a minute, about what the empty slot counts.` : 'Ore B has not been counted yet.' };
      },
      reward: {
        log: 'Ore A counted far above the empty slot: radioactive.',
        title: 'Radioactive',
        body: 'Ore A: it counted far above the empty slot, and ore B no more than it. A substance that gives off radiation on its own is radioactive.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const R = ncountFixture('rig', RIG_AT, { housing: true });
    return {
      id: 's2-background',
      title: 'Clicks From Nowhere',
      prompt: 'With nothing in the Sample slot, where does most of the counter\'s radiation come from?',
      widget,
      table: nukeTable({
        pieces: [],
        fixtures: [R.fixture, nchoiceFixture('ans', 'It comes from', { x: 25, y: 32 }, { options: ['The counter\'s own tube', 'Rock, air and space around it', 'The empty Sample slot'], w: 46 })]
      }),
      hints: [
        'Press "Count" with the housing open, then press "Lead Housing" and count again.',
        'Compare the two counts, and watch where the tracks come into the window from.',
        'Lead stops radiation coming from outside it, so ask what a closed housing could have kept out.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
        if (pick === 2) return { ok: true };
        const log = state.table.fixtures.rig.props.log || [];
        const open = [...log].reverse().find(l => !l.housed && !l.src); const shut = [...log].reverse().find(l => l.housed && !l.src);
        if (pick === 1) return { ok: false, msg: open && shut ? `Inside the lead the tube still counts, and its count fell from ${open.count} to ${shut.count}.` : 'The counter has not been counted with the lead both open and closed.' };
        return { ok: false, msg: 'The tracks come into the window from above and below, not from the Sample slot.' };
      },
      reward: {
        log: 'Lead round the tube cut the count from about 24 to 4.',
        title: 'Background Radiation',
        body: 'From outside: lead round the tube cut the count from about 24 to 4. Rock, air and space give off a steady trickle, background radiation, and every count includes it.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-element',
    title: 'Which Element Now',
    prompt: 'One uranium atom in the ore gives off radiation: what element is it afterwards?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nnucFixture('nuc', { x: 52, y: 31 }, { Z: 92, N: 146, mode: 'alpha', w: 96, h: 50, title: 'One uranium nucleus' }),
        plaqueFixture('ref', 'Atomic numbers', { x: 126, y: 16 }, ['88 Radium', '89 Actinium', '90 Thorium', '91 Protactinium', '92 Uranium'], { w: 42 }),
        nchoiceFixture('ans', 'Afterwards it is', { x: 126, y: 48 }, { options: ['Uranium still', 'Thorium', 'Uranium, as an ion'], w: 42 })
      ]
    }),
    hints: [
      'Press "Watch the Nucleus" and read the counts under it before and after.',
      'Compare how many protons the nucleus holds afterwards with the plate of atomic numbers.',
      'The number of protons in the nucleus decides which element an atom is.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
      if (pick === 2) return { ok: true };
      if (pick === 1) return { ok: false, msg: 'Afterwards the nucleus holds 90 protons, and uranium\'s atomic number is 92.' };
      return { ok: false, msg: 'The particle came out of the nucleus, and the count of protons changed, not of electrons.' };
    },
    reward: {
      log: 'Uranium-238 lost two protons and two neutrons: thorium.',
      title: 'Radioactive Decay',
      body: 'Thorium: the nucleus lost two protons, and the number of protons decides the element. A nucleus changing on its own and giving off radiation is radioactive decay.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict',
    title: 'The Cold Drum',
    predict: true,
    prompt: 'The ore is chilled from 20 °C to −40 °C: what do you expect its count in one minute to do?',
    widget,
    table: nukeTable({
      pieces: [
        note('g-falls', 'It falls a lot', { x: 30, y: 14 }),
        note('g-same', 'It stays about the same', { x: 30, y: 33 }),
        note('g-rises', 'It rises', { x: 30, y: 52 })
      ],
      fixtures: [nleadFixture('lead', { x: 112, y: 42 }, { scene: 'fizz', caption: 'A chemical reaction runs slower in the cold.', w: 64, h: 34 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 12 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip shows the same fizzing tablet in warm water and in ice-cold water.',
      'Ask whether the decay you watched happened among the electrons, where reactions happen, or somewhere else.',
      'Cold slows the motion of atoms; think about which part of the atom that motion could reach.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it on the counter.' }
  },

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const R = ncountFixture('rig', { x: 104, y: 27 }, { temps: [-40, 20, 300], w: 84, h: 46 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's5-cold',
      title: 'The Cold Count',
      get prompt() { const g = guess(); return `Does chilling the ore change how often its nuclei decay?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: nukeTable({
        pieces: [nsrc('ore', 'oreU', { x: 12, y: 12 }, { text: 'Uranium ore' })],
        fixtures: [R.fixture, nchoiceFixture('ans', 'Chilled, the count', { x: 21, y: 44 }, { options: ['Falls', 'Stays the same', 'Rises'], w: 36 })],
        zones: { slots: [R.slot] }
      }),
      hints: [
        'Lay the ore in the Sample slot, tap a temperature, and press "Count" at each one.',
        'Compare the counts at the three temperatures with how much two counts at one temperature differ.',
        'In the window, watch what the cold changes about the atoms and what it leaves alone.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
        if (pick === 2) return { ok: true };
        const cold = keptCount(state.table, 'ore', { temp: -40 }); const room = keptCount(state.table, 'ore', { temp: 20 }); const hot = keptCount(state.table, 'ore', { temp: 300 });
        if (pick === 1) return { ok: false, msg: cold != null && room != null ? `At −40 °C the ore counted ${commas(cold)} and at 20 °C ${commas(room)}: no more apart than two counts at one temperature.` : 'The ore has not been counted at both −40 °C and 20 °C.' };
        return { ok: false, msg: hot != null && room != null ? `At 300 °C the ore counted ${commas(hot)} and at 20 °C ${commas(room)}.` : 'The ore has not been counted at both 300 °C and 20 °C.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'The ore counted the same at −40, 20 and 300 °C.',
          title: 'The Nucleus Does Not Feel It',
          body: `It stays the same${g ? `; you predicted ${g}` : ''}. Cold slowed the atoms' motion, yet the nuclei decayed as often: heat and cold reach the atoms and electrons, not the nucleus.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const R = ncountFixture('rig', RIG_AT);
    return {
      id: 's6-twice',
      title: 'Twice the Ore',
      briefing: { speaker: SPEAKER, body: 'The count rate is the number of counts the counter makes each minute. Here it is checked against how much ore is in the slot.' },
      prompt: 'How many counts would 5 g of this ore make in one minute?',
      widget,
      entry: { id: 'count', label: 'Counts in a minute, 5 g', unit: '' },
      table: nukeTable({
        pieces: [nsrc('g1', 'oreU', { x: 12, y: 12 }, { text: 'Ore, 1 g', grams: 1 }), nsrc('g2', 'oreU', { x: 12, y: 28 }, { text: 'Ore, 2 g', grams: 2 })],
        fixtures: [R.fixture],
        zones: { slots: [R.slot] }
      }),
      hints: [
        'Count the 1 g card and the 2 g card, and watch how many atoms and tracks each shows.',
        'Compare the 2 g count with the 1 g count.',
        'Each gram holds the same number of uranium nuclei, and each nucleus is as likely to decay as any other.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'count');
        if (v == null) return { ok: false, notYet: true, msg: 'Type the count in the field.' };
        if (v >= 8990 && v <= 9460) return { ok: true };
        const one = keptCount(state.table, 'g1'); const two = keptCount(state.table, 'g2');
        if (Math.abs(v - 1860) < 60) return { ok: false, msg: `That is what 1 g counted${one != null ? `, ${commas(one)}` : ''}.` };
        if (Math.abs(v - 3700) < 80) return { ok: false, msg: `That is about what 2 g counted${two != null ? `, ${commas(two)}` : ''}.` };
        if (Math.abs(v - 7440) < 200) return { ok: false, msg: 'That is about what 4 g would count.' };
        if (v > 15000) return { ok: false, msg: `That is ten times what 1 g counted${one != null ? ` (${commas(one)})` : ''}.` };
        return { ok: false, msg: `The bench counted ${one != null ? commas(one) : 'about 1,860'} for 1 g and ${two != null ? commas(two) : 'about 3,700'} for 2 g.` };
      },
      reward: {
        log: 'Five grams: about 9,200 counts a minute.',
        title: 'Count Rate',
        body: 'About 9,200: five times the nuclei, five times the decays each minute. The count rate rises in step with the number of radioactive nuclei.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-warmth',
    title: 'Where the Warmth Comes From',
    prompt: 'Why does a sealed drum of uranium ore stay warmer than the deck around it?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        ndrumFixture('drums', { x: 41, y: 30 }, { drums: [{ name: 'Uranium ore', temp: 34, o2: '21 %', hot: true }, { name: 'Iron ore', temp: 9, o2: '21 %', hot: false }], w: 78, h: 50, title: 'Sealed 12 days ago' }),
        nchoiceFixture('ans', 'It stays warm because', { x: 114, y: 32 }, { options: ['Radiation stopped in it gives its atoms energy', 'The ore is burning slowly', 'It kept its heat from the mine'], w: 66 })
      ]
    }),
    hints: [
      'Tap each drum to look inside its wall.',
      'Compare what reaches the steel atoms in each drum, and how those atoms move.',
      'Atoms that move faster are hotter, so ask what makes the uranium drum\'s atoms move faster.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
      if (pick === 1) return { ok: true };
      if (pick === 2) return { ok: false, msg: 'The uranium drum still holds 21 % oxygen, as much as the air it was sealed with.' };
      return { ok: false, msg: 'The iron ore drum, sealed the same day, has cooled to the deck\'s 9 °C.' };
    },
    reward: {
      log: 'Radiation stopped in the drum warms it.',
      title: 'Warm From Within',
      body: 'Radiation stopped in the steel and the ore handed its energy to the atoms there. The drum stays warm for as long as its nuclei go on decaying.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const R = ncountFixture('rig', RIG_AT);
    return {
      id: 's8-drums',
      title: 'The Sealed Drums',
      prompt: 'Which of the three sealed drums holds radioactive ore?',
      widget,
      table: nukeTable({
        pieces: [
          nsrc('drum-a', 'oreFe', { x: 12, y: 10 }, { text: 'Drum A', temp: 62 }),
          nsrc('drum-b', 'oreU', { x: 12, y: 26 }, { text: 'Drum B', temp: 9 }),
          nsrc('drum-c', 'oreFe', { x: 12, y: 42 }, { text: 'Drum C', temp: 30 })
        ],
        fixtures: [R.fixture],
        zones: { slots: [R.slot, { id: 'ore', label: 'Radioactive ore', at: { x: 38, y: 51 }, size: { w: 22, h: 12 } }] }
      }),
      hints: [
        'Count each drum\'s card on the counter.',
        'Compare each drum\'s count with what the counter reads with nothing in its slot.',
        'Think about what a drum\'s warmth can come from besides decaying nuclei.'
      ],
      check(state) {
        const card = inSlot(state, 'ore');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a drum\'s card in the answer slot.' };
        if (card.id === 'drum-b') return { ok: true };
        const c = keptCount(state.table, card.id);
        return { ok: false, msg: c != null ? `${card.label} counted ${commas(c)}, about the background.` : `${card.label} has not been counted.` };
      },
      reward: {
        log: 'Drum B, the cold one, holds the uranium ore.',
        title: 'Not the Warm One',
        body: 'Drum B, the cold one. Warmth can come from a boiler or the sun; a decaying nucleus counts the same at any temperature.'
      }
    };
  })()
];

const NOTES = {
  1: ['Drag a card into the Sample slot and press "Count"; drag your answer into the answer slot.'],
  2: ['Press "Count"; "Lead Housing" closes lead round the tube. Tap a statement to answer.'],
  3: ['Press "Watch the Nucleus". Tap a statement to answer.'],
  4: ['Drag the card you choose into the slot.'],
  5: ['Tap a temperature, then press "Count".'],
  6: ['Count each card, then type your answer in the field.'],
  7: ['Tap a drum to look inside its wall. Tap a statement to answer.'],
  8: ['Drag a card into the Sample slot and press "Count"; drag your answer into the answer slot.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'A radioactive nucleus changes on its own and throws out radiation. Cold, heat and chemistry do not reach it, so the count stays the same, and the radiation\'s energy warms whatever stops it.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const run = id => ({ run: id });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const temp = i => ({ setDial: { fixture: 'rig', dial: 'temp', value: i } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const S = 'slot:rig.sample';

export const SOLUTIONS = [
  [put('ore-a', S), run('rig'), put('ore-b', S), run('rig'), put('ore-a', 'slot:gives')],
  [run('rig'), { setDial: { fixture: 'rig', dial: 'housed', value: 1 } }, run('rig'), choose(2)],
  [run('nuc'), choose(2)],
  [put('g-falls', 'slot:guess')],
  [put('ore', S), temp(0), run('rig'), temp(1), run('rig'), temp(2), run('rig'), choose(2)],
  [put('g1', S), run('rig'), put('g2', S), run('rig'), typed('count', 9200)],
  [{ setDial: { fixture: 'drums', dial: 'look', value: 1 } }, { setDial: { fixture: 'drums', dial: 'look', value: 2 } }, choose(1)],
  [put('drum-a', S), run('rig'), put('drum-b', S), run('rig'), put('drum-b', 'slot:ore')]
];

export const MISSES = [
  [put('ore-b', S), run('rig'), put('ore-b', 'slot:gives')],
  [run('rig'), { setDial: { fixture: 'rig', dial: 'housed', value: 1 } }, run('rig'), choose(1)],
  [run('nuc'), choose(1)],
  [],
  [put('ore', S), temp(0), run('rig'), temp(1), run('rig'), choose(1)],
  [put('g1', S), run('rig'), typed('count', 1860)],
  [choose(2)],
  [put('drum-a', S), run('rig'), put('drum-a', 'slot:ore')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { keptCounts };
