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
const GUESS = { 'g-falls': 'it would drop sharply', 'g-same': 'it would stay about the same', 'g-rises': 'it would rise' };
const widget = { type: 'table', label: 'The bench' };
let lastS2 = { open: 25, shut: 5 };
let lastS6 = { one: 1850 };

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
      briefing: { speaker: SPEAKER, body: 'A radiation counter clicks each time radiation (energy or a particle thrown out of an atom) hits its tube. Even with nothing in the slot, it clicks a few times from the surroundings.' },
      prompt: 'Which ore sample gives off its own radiation?',
      widget,
      table: nukeTable({
        pieces: [
          nsrc('ore-a', 'oreU', { x: 12, y: 9 }, { text: 'Ore A' }),
          nsrc('ore-b', 'oreFe', { x: 12, y: 24 }, { text: 'Ore B' }),
          nsrc('ore-c', 'oreFe', { x: 12, y: 39 }, { text: 'Ore C' })
        ],
        fixtures: [R.fixture],
        zones: { slots: [R.slot, { id: 'gives', label: 'Gives off radiation', at: { x: 24, y: 52 }, size: { w: 40, h: 11 } }] }
      }),
      hints: [
        'Press "Count" with the Sample slot empty, then drag each ore card into the slot and count it.',
        'Compare each ore\'s count with the empty slot\'s count.',
        'An ore that does not raise the count above the empty slot gives off no radiation of its own.'
      ],
      check(state) {
        const card = inSlot(state, 'gives');
        if (!card) return { ok: false, notYet: true, msg: 'Place an ore card in the answer slot.' };
        const emptyLog = (state.table.fixtures.rig.props.log || []).find(l => !l.src);
        if (card.props.src === 'oreU') {
          if (!emptyLog) return { ok: false, notYet: true, msg: 'Count the empty Sample slot once too so you have a baseline to compare against.' };
          return { ok: true };
        }
        const c = keptCount(state.table, card.id);
        if (c == null) return { ok: false, msg: `${card.label} has not been counted yet.` };
        if (!emptyLog) return { ok: false, msg: `${card.label} counted ${commas(c)}. Count the empty Sample slot first to compare.` };
        return { ok: false, msg: `${card.label} counted ${commas(c)} in a minute, about the same as the empty slot (${commas(emptyLog.count)}).` };
      },
      reward: {
        log: 'Ore A counted far above the empty slot: radioactive.',
        title: 'Radioactive',
        body: 'Ore A counted far above the empty slot, while Ore B and Ore C matched it. A material that gives off radiation on its own is radioactive.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const R = ncountFixture('rig', RIG_AT, { housing: true });
    return {
      id: 's2-background',
      title: 'Clicks From Nowhere',
      prompt: 'With the Sample slot empty, where does most of the radiation reaching the counter come from?',
      widget,
      table: nukeTable({
        pieces: [],
        fixtures: [R.fixture, nchoiceFixture('ans', 'It comes from', { x: 25, y: 32 }, { options: ['The counter\'s own tube', 'Rock, air, and space around it', 'The ore in the drums'], w: 46 })]
      }),
      hints: [
        'Press "Count" with the housing open, then press "Lead Housing" to cover the tube and count again.',
        'Compare the two counts and notice where the tracks enter the window from.',
        'Lead blocks radiation coming from outside, so think about what disappeared when you closed the housing.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
        const log = state.table.fixtures.rig.props.log || [];
        const open = [...log].reverse().find(l => !l.housed && !l.src); const shut = [...log].reverse().find(l => l.housed && !l.src);
        if (open && shut) lastS2 = { open: open.count, shut: shut.count };
        if (pick === 2) return { ok: true };
        if (pick === 1) return { ok: false, msg: open && shut ? `Inside the lead, only ${shut.count} counts came from the tube itself; the other ${Math.max(1, open.count - shut.count)} that disappeared came from outside.` : 'Count the empty slot with the lead housing both open and closed first.' };
        return { ok: false, msg: 'The tracks enter from all around the room, not from any drum in the slot.' };
      },
      get reward() {
        return {
          log: `Lead round the tube cut the count from ${lastS2.open} to ${lastS2.shut}.`,
          title: 'Background Radiation',
          body: `Lead dropped the count from ${lastS2.open} to ${lastS2.shut}, showing most counts came from outside. Rock, air, and space produce this steady background radiation, which every measurement includes.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-element',
    title: 'Which Element Now',
    prompt: 'What element does a uranium atom become after giving off radiation?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nnucFixture('nuc', { x: 46, y: 31 }, { Z: 92, N: 146, mode: 'alpha', w: 84, h: 50, title: 'One uranium nucleus' }),
        plaqueFixture('ref', 'Atomic numbers', { x: 122, y: 16 }, ['88 Radium', '89 Actinium', '90 Thorium', '91 Protactinium', '92 Uranium'], { w: 44 }),
        nchoiceFixture('ans', 'Afterwards it is', { x: 122, y: 48 }, { options: ['Still uranium', 'Thorium', 'A lighter kind of uranium'], w: 44 })
      ]
    }),
    hints: [
      'Press "Watch the Nucleus" and check the proton and neutron counts before and after.',
      'Match the number of protons left in the nucleus to the atomic numbers list.',
      'An atom\'s proton count determines which element it is.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
      if (pick === 2) return { ok: true };
      if (pick === 1) return { ok: false, msg: 'Count the protons left after decay and match that number to the atomic numbers list.' };
      return { ok: false, msg: 'The nucleus lost 2 protons, so it is no longer uranium.' };
    },
    reward: {
      log: 'Uranium-238 lost 2 protons and 2 neutrons: thorium.',
      title: 'Radioactive Decay',
      body: 'Thorium: the nucleus lost 2 protons (leaving 90) and 2 neutrons, and proton count sets the element. When a nucleus changes on its own and gives off radiation, that is radioactive decay.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict',
    title: 'The Cold Drum',
    predict: true,
    prompt: 'If you chill the ore from 20 °C to −40 °C, what do you expect its one-minute count to do?',
    widget,
    table: nukeTable({
      pieces: [
        note('g-falls', 'Drop sharply', { x: 30, y: 14 }),
        note('g-same', 'Stay about the same', { x: 30, y: 33 }),
        note('g-rises', 'Rise', { x: 30, y: 52 })
      ],
      fixtures: [nleadFixture('lead', { x: 112, y: 43 }, { scene: 'fizz', caption: 'A chemical reaction slows down in the cold. Does radioactive ore do the same?', w: 72, h: 36 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 12 }, size: { w: 46, h: 14 } }] }
    }),
    hints: [
      'There is no wrong prediction, so drag the card you expect into the slot.',
      'Think about whether decay happens among the outer electrons or deep inside the nucleus.',
      'Cold slows down how fast atoms move, so ask whether that motion reaches inside the nucleus.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Drag a prediction card into the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Test your prediction on the counter next.' }
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
        fixtures: [R.fixture, nchoiceFixture('ans', 'Chilled, the count', { x: 21, y: 44 }, { options: ['Drops', 'Stays the same', 'Rises'], w: 36 })],
        zones: { slots: [R.slot] }
      }),
      hints: [
        'Place the ore in the Sample slot, pick a temperature, and press "Count" at each setting.',
        'Press "Count" twice at one temperature to see normal variation, then compare across temperatures.',
        'Watch what cooling changes about the atoms in the window and what it leaves unchanged.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
        if (pick === 2) return { ok: true };
        const cold = keptCount(state.table, 'ore', { temp: -40 }); const room = keptCount(state.table, 'ore', { temp: 20 }); const hot = keptCount(state.table, 'ore', { temp: 300 });
        if (pick === 1) return { ok: false, msg: cold != null && room != null ? `At −40 °C the ore counted ${commas(cold)} and at 20 °C it counted ${commas(room)}, within normal count-to-count variation.` : 'Count the ore at both −40 °C and 20 °C first.' };
        return { ok: false, msg: hot != null && room != null ? `At 300 °C the ore counted ${commas(hot)} and at 20 °C it counted ${commas(room)}, within normal variation.` : 'Count the ore at both 300 °C and 20 °C first.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'The ore counted the same at −40, 20 and 300 °C.',
          title: 'The Nucleus Does Not Feel It',
          body: `It stays the same.${g ? ` You predicted ${g}.` : ''} Cold slowed the atoms down, but the nuclei kept decaying at the same rate because temperature does not reach inside the nucleus.`
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
      briefing: { speaker: SPEAKER, body: 'Count rate is the number of counts per minute. Test how the count rate changes as you add more ore.' },
      prompt: 'How many counts would 5 g of this ore make in one minute?',
      widget,
      entry: { id: 'count', label: 'Counts per minute (5 g)', unit: '' },
      table: nukeTable({
        pieces: [
          nsrc('g1', 'oreU', { x: 12, y: 10 }, { text: '1 g ore', grams: 1 }),
          nsrc('g2', 'oreU', { x: 12, y: 26 }, { text: '2 g ore', grams: 2 }),
          nsrc('g3', 'oreU', { x: 12, y: 42 }, { text: '3 g ore', grams: 3 })
        ],
        fixtures: [R.fixture],
        zones: { slots: [R.slot] }
      }),
      hints: [
        'Count the 1 g, 2 g, and 3 g samples and watch how the tracks increase.',
        'Compare the 2 g and 3 g count rates with the 1 g count rate.',
        'Each gram holds the same number of uranium nuclei, so 5 g produces five times the counts of 1 g.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'count');
        if (v == null) return { ok: false, notYet: true, msg: 'Type the count in the box.' };
        const one = keptCount(state.table, 'g1'); const two = keptCount(state.table, 'g2');
        if (one != null) lastS6 = { one };
        if (v >= 8990 && v <= 9460) return { ok: true };
        if (Math.abs(v - 1860) < 60) return { ok: false, msg: `That is about what 1 g counted${one != null ? ` (${commas(one)})` : ''}.` };
        if (Math.abs(v - 3700) < 80) return { ok: false, msg: `That is about what 2 g counted${two != null ? ` (${commas(two)})` : ''}.` };
        if (Math.abs(v - 7440) < 200) return { ok: false, msg: 'That is about what 4 g would count.' };
        if (v > 15000) return { ok: false, msg: `That is closer to ten times what 1 g counted${one != null ? ` (${commas(one)})` : ''}.` };
        return { ok: false, msg: one != null && two != null ? `Your counter read ${commas(one)} for 1 g and ${commas(two)} for 2 g. Scale up to 5 g.` : 'Count the 1 g, 2 g, and 3 g samples first.' };
      },
      get reward() {
        const est = Math.round((lastS6.one * 5) / 10) * 10;
        return {
          log: `Five grams: about ${commas(est)} counts a minute.`,
          title: 'Count Rate',
          body: `About ${commas(est)} counts per minute: five times as many nuclei means five times as many decays. Count rate scales directly with the number of radioactive nuclei.`
        };
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
        nchoiceFixture('ans', 'It stays warm because', { x: 114, y: 32 }, { options: ['The ore is slowly burning in the trapped air', 'It kept its heat from the deep mine below', 'Radiation stopping in the drum heats its atoms'], w: 66 })
      ]
    }),
    hints: [
      'Tap each drum to look inside its steel wall.',
      'Compare what hits the steel atoms in each drum and how fast those atoms vibrate.',
      'Faster-moving atoms mean a higher temperature, so ask what makes the uranium drum\'s atoms move faster.'
    ],
    check(state) {
      const look = Math.round(state.table.fixtures.drums.dials.look.value);
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap each drum to look inside, then choose an answer.' };
      if (!look) return { ok: false, notYet: true, msg: 'Tap both drums to look inside their walls first.' };
      if (pick === 3) return { ok: true };
      if (pick === 1) return { ok: false, msg: 'Burning uses up oxygen, but the uranium drum still has 21% oxygen, the same as the air sealed inside it.' };
      return { ok: false, msg: 'The iron ore drum was sealed the same day and has already cooled to 9 °C.' };
    },
    reward: {
      log: 'Radiation stopped in the drum warms it.',
      title: 'Warm From Within',
      body: 'Radiation stops inside the steel wall and transfers its energy to the drum\'s atoms, heating them up. The drum stays warm as long as its nuclei keep decaying.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const R = ncountFixture('rig', RIG_AT);
    return {
      id: 's8-drums',
      title: 'The Sealed Drums',
      prompt: 'Which of these three freshly sealed drums near warm pipes holds radioactive ore?',
      widget,
      table: nukeTable({
        pieces: [
          nsrc('drum-a', 'oreFe', { x: 12, y: 10 }, { text: 'Drum A', temp: 62, sub: 'Fresh' }),
          nsrc('drum-b', 'oreU', { x: 12, y: 26 }, { text: 'Drum B', temp: 9, sub: 'Fresh' }),
          nsrc('drum-c', 'oreFe', { x: 12, y: 42 }, { text: 'Drum C', temp: 30, sub: 'Fresh' })
        ],
        fixtures: [R.fixture],
        zones: { slots: [R.slot, { id: 'ore', label: 'Radioactive ore', at: { x: 38, y: 52 }, size: { w: 22, h: 11 } }] }
      }),
      hints: [
        'Drag each drum card into the Sample slot and count it.',
        'Compare each drum\'s count with the empty-slot background count.',
        'Warm pipes can heat any drum, so only the counter tells you which one is radioactive.'
      ],
      check(state) {
        const card = inSlot(state, 'ore');
        if (!card) return { ok: false, notYet: true, msg: 'Drag a drum card into the answer slot.' };
        if (card.id === 'drum-b') return { ok: true };
        const c = keptCount(state.table, card.id);
        return { ok: false, msg: c != null ? `${card.label} counted ${commas(c)}, about the same as background.` : `${card.label} has not been counted yet.` };
      },
      reward: {
        log: 'Drum B, the cold one, holds the uranium ore.',
        title: 'Count, Not Warmth',
        body: 'Drum B: pipes can warm any drum, and a freshly sealed radioactive drum has not warmed up yet. Only a count above background proves radioactive ore.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'A radioactive nucleus decays on its own and gives off radiation. Temperature does not change how fast it decays, and radiation warms whatever stops it.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const run = id => ({ run: id });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const temp = i => ({ setDial: { fixture: 'rig', dial: 'temp', value: i } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const S = 'slot:rig.sample';

export const SOLUTIONS = [
  [run('rig'), put('ore-a', S), run('rig'), put('ore-b', S), run('rig'), put('ore-a', 'slot:gives')],
  [run('rig'), { setDial: { fixture: 'rig', dial: 'housed', value: 1 } }, run('rig'), choose(2)],
  [run('nuc'), choose(2)],
  [put('g-falls', 'slot:guess')],
  [put('ore', S), temp(0), run('rig'), temp(1), run('rig'), temp(2), run('rig'), choose(2)],
  [put('g1', S), run('rig'), put('g2', S), run('rig'), put('g3', S), run('rig'), typed('count', 9200)],
  [{ setDial: { fixture: 'drums', dial: 'look', value: 1 } }, { setDial: { fixture: 'drums', dial: 'look', value: 2 } }, choose(3)],
  [put('drum-a', S), run('rig'), put('drum-b', S), run('rig'), put('drum-b', 'slot:ore')]
];

export const MISSES = [
  [run('rig'), put('ore-b', S), run('rig'), put('ore-b', 'slot:gives')],
  [run('rig'), { setDial: { fixture: 'rig', dial: 'housed', value: 1 } }, run('rig'), choose(1)],
  [run('nuc'), choose(1)],
  [],
  [put('ore', S), temp(0), run('rig'), temp(1), run('rig'), choose(1)],
  [put('g1', S), run('rig'), typed('count', 1860)],
  [{ setDial: { fixture: 'drums', dial: 'look', value: 1 } }, choose(1)],
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
