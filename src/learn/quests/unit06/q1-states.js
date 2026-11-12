/**
 * Unit 6 · Bench 1 — Three States (q1-states)
 *
 * A chart house on the canal, on the matter kit (`table/kits/matter.js`, instruments in `matter-window.js`). Vess has a jar of canal ice and
 * wants to know whether it is a different substance from the water under it. Eight stages and ONE click: the belief that when ice melts or water
 * boils, the bonds inside the molecules break. The prediction offers it (beside two other beliefs students hold), the READER and the WINDOW
 * contradict it, and only then does a card give the word "phase change".
 *
 *   1  three sealed jars sorted by what their contents do in the press and the tank            -> solid, liquid, gas
 *   2  three boxes of molecules matched to the jars                                           -> particles in three states
 *   3  PREDICT: what happens to the molecules when ice melts and boils
 *   4  TEST: heat the ice jar and read it; the jar of split water for contrast                -> phase change
 *   5  what holds the ice's molecules in place, with the window at three temperatures         -> intermolecular forces
 *   6  three equal jars on a balance, ordered by the room each molecule has                   -> density
 *   7  how many times as many molecules a jar of water holds as a jar of steam (typed)
 *   8  four sealed jars of other substances filed as solid, liquid or gas
 *
 * THE EVIDENCE IS ON THE BENCH. A jar prints a letter. The press and tank show what its contents do; the window shows its molecules, the same
 * eight, whole, in every state; the reader names the molecule the window really holds and never anything else; the balance prints a weight.
 * Every figure is `matterdata-window.js` (CRC and IAPWS rows). This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { matterTable, note, stmt, tag, whereIs, fixed, leadFixture } from '../../table/kits/matter.js';
import {
  jarCard, boxCard, pressFixture, windowFixture, scaleFixture, windowRead, scaleRead, jarStateOf
} from '../../table/kits/matter-window.js';
import {
  SAMPLES, HEATER_TEST, HEATER_LOOSE, SQUEEZE_ATM, jarMass, readerNames, WATER_G_PER_L
} from '../../engine/matterdata-window.js';

export const meta = { stageCount: 7 };


export const VOCABULARY = [
  { term: /\bsolid\b/i, introducedAt: 1 },
  { term: /\bliquid\b/i, introducedAt: 1 },
  { term: /\bgas\b/i, introducedAt: 1 },
  { term: /\bphase changes?\b/i, introducedAt: 4 },
  { term: /\bintermolecular forces?\b/i, introducedAt: 5 },
  { term: /\bdensity\b/i, introducedAt: 6 }
];

/** Molecules are Tallow's, bonds are Ligar's; nothing from Bellows is used. */
export const BUILDS_ON = ['unit01/q1-grain', 'unit03/q1-joins'];

const SPEAKER = 'Vess';
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit06/q1-states';
const GUESS_LABEL = { break: 'the bonds in each molecule break', whole: 'each molecule stays whole', melts: 'each molecule itself melts' };
const BOUNDS = { w: 150, h: 72 };
/** The paper strip is parked in the top right corner: nothing on this bench prints on it. */
const STRIP = { at: { x: 147.4, y: 1.9 }, size: { w: 5, h: 3.4 } };
const PRESS_AT = { x: 47, y: 22 };
const SLOT = 'slot:press.well';
const WSLOT = 'slot:window.well';
const PSLOT = 'slot:scale.pan';

/* ------------------------------------------------------------------
   WHAT A JAR DID (read from the jar's own memory, `props.did`)
   ------------------------------------------------------------------ */

const POUR_WORDS = { lump: 'stayed a lump in the tank', pool: 'lay flat in the bottom of the tank', spread: 'spread through the whole tank' };

/** What the press and tank showed for a jar, in words, or '' when it has not been tried. */
function saidOf(jar) {
  const did = jar.props.did || {};
  const bits = [];
  if (did.pour) bits.push(POUR_WORDS[did.pour]);
  if (did.sq != null) bits.push(did.sq < 1 ? `compressed to ${Math.round(did.sq * 100)} % of its volume` : 'did not compress smaller');
  return bits.join(' and ');
}

const jarName = j => `Jar ${j.label}`;

/** Where every jar of a sorting stage should be filed, and a refusal that names what the press and tank showed for the first that is not. */
function sortCheck(want, trayLabel, blank = 'Put every jar in a tray.') {
  return state => {
    const t = state.table;
    const jars = Object.keys(want).map(id => t.pieces[id]);
    if (jars.some(j => !t.zones.trays[whereIs(t, j.id)])) return { ok: false, notYet: true, msg: blank };
    const bad = jars.find(j => whereIs(t, j.id) !== want[j.id]);
    if (!bad) return { ok: true };
    const said = saidOf(bad);
    return { ok: false, msg: said ? `${jarName(bad)} sits in the "${trayLabel(whereIs(t, bad.id))}" tray, and its contents ${said}.` : `${jarName(bad)} sits in the "${trayLabel(whereIs(t, bad.id))}" tray, and has not been poured or compressed yet.` };
  };
}

/* ------------------------------------------------------------------
   SMALL BUILDERS
   ------------------------------------------------------------------ */

const jarsAt = (specs, y = 60) => specs.map((s, i) => jarCard(s.id, s.label, { x: 12.2 + i * 21.2, y }, s.props));
const tray = (id, label, x, y, w, h, cell, cellH, view = null) => ({ id, label, at: { x, y }, size: { w, h }, cell, cellH, ...(view ? { view } : {}) });

/** The three sealed jars of stages 1 and 2, in a different order each time. */
const STATE_JARS = {
  liquid: { sample: 'H2O', T: 20 },
  gas: { sample: 'H2O', T: 150 },
  solid: { sample: 'H2O', T: -10 }
};

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */

const S1_JARS = [{ id: 'a', label: 'A', state: 'liquid' }, { id: 'b', label: 'B', state: 'gas' }, { id: 'c', label: 'C', state: 'solid' }];
const S1_TRAY = { solid: 'lump', liquid: 'pool', gas: 'fill' };
const S1_TRAY_LABEL = { lump: 'Stays a lump', pool: 'Pools flat', fill: 'Fills the tank' };

const S2_JARS = [{ id: 'a', label: 'A', state: 'gas' }, { id: 'b', label: 'B', state: 'solid' }, { id: 'c', label: 'C', state: 'liquid' }];
const S2_BOXES = [{ id: 'b1', label: '1', state: 'liquid', seed: 'p' }, { id: 'b2', label: '2', state: 'gas', seed: 'q' }, { id: 'b3', label: '3', state: 'solid', seed: 'r' }];

const S4_CHANGES = { melt: 'same', boil: 'same', split: 'new' };
const S5_CARDS = { inside: 'Bonds inside each molecule', between: 'Pulls between one molecule and the next', slow: 'The molecules are only moving slowly' };

/** Stage 6: three equal jars of water, in the order of the space each molecule has (least first). */
const S6_JARS = [{ id: 'a', label: 'A', state: 'liquid' }, { id: 'b', label: 'B', state: 'gas' }, { id: 'c', label: 'C', state: 'solid' }];
const S6_STATE_AT = { liquid: 0, solid: 0, gas: 100 };
const S6_MASS = Object.fromEntries(S6_JARS.map(j => [j.id, jarMass(j.state)]));
const S6_ORDER = [...S6_JARS].sort((x, y) => S6_MASS[y.id] - S6_MASS[x.id]).map(j => j.id);
const WATER_JAR = jarMass('liquid');
const STEAM_JAR = jarMass('gas');
/** Stage 7: a litre of water against a litre of steam, one kind of molecule in both. */
export const TIMES = WATER_JAR / STEAM_JAR;

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const press = pressFixture('press', PRESS_AT);
    const jars = jarsAt(S1_JARS.map(j => ({ id: j.id, label: j.label, props: STATE_JARS[j.state] })));
    const trays = Object.entries(S1_TRAY_LABEL).map(([id, label], i) => tray(id, label, 80 + i * 27, 60, 26, 22, 26, 22, id === 'fill' ? 'spread' : id));
    const want = Object.fromEntries(S1_JARS.map(j => [j.id, S1_TRAY[j.state]]));
    return {
      id: 's1-jars',
      title: 'Three Jars',
      prompt: 'Which jar holds a solid, which a liquid and which a gas?',
      widget,
      table: matterTable({ bounds: BOUNDS, recorder: STRIP, pieces: jars, fixtures: [press.fixture], zones: { slots: [press.slot], trays } }),
      hints: [
        'Use the "Piston" dial and the "Pour" key on each jar, then drag the jar into a tray.',
        'Compare what the contents of each jar do in the tube with what they do in the tank.',
        'File each jar under the picture its contents made in the tank.'
      ],
      check: sortCheck(want, id => S1_TRAY_LABEL[id]),
      reward: {
        log: 'One jar kept its shape, one kept its volume, one filled the tank.',
        title: 'Solid, Liquid, Gas',
        body: 'A solid keeps its own shape. A liquid keeps its volume but takes the shape of its container, and a gas fills its container and can be compressed into less volume.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const press = pressFixture('press', PRESS_AT);
    const jars = jarsAt(S2_JARS.map(j => ({ id: j.id, label: j.label, props: STATE_JARS[j.state] })));
    const boxes = S2_BOXES.map((b, i) => boxCard(b.id, b.label, i < 2 ? { x: 107 + i * 28, y: 12 } : { x: 107, y: 34 }, b.state, b.seed));
    const trays = S2_JARS.map((j, i) => tray(`j${j.id}`, `Jar ${j.label}`, 80 + i * 27, 60, 26.5, 22, 26.5, 22));
    return {
      id: 's2-boxes',
      title: 'Molecules in the Jars',
      briefing: { speaker: SPEAKER, body: 'A molecule is a group of atoms joined by bonds, moving as one.' },
      prompt: 'Which picture of molecules belongs to which jar?',
      widget,
      table: matterTable({ bounds: BOUNDS, recorder: STRIP, pieces: [...jars, ...boxes], fixtures: [press.fixture], zones: { slots: [press.slot], trays } }),
      hints: [
        'Try each jar in the piston and the tank, then drag each picture into the tray of the jar it shows.',
        'Compare how far apart the molecules in each picture are, and whether they stand in any order.',
        'Match what a jar did when it was poured and compressed with how the molecules in a picture are placed.'
      ],
      check(state) {
        const t = state.table;
        const put = S2_BOXES.filter(b => t.zones.trays[whereIs(t, b.id)]);
        if (put.length < S2_BOXES.length) return { ok: false, notYet: true, msg: 'Put every picture in a tray.' };
        for (const j of S2_JARS) {
          const box = S2_BOXES.find(b => whereIs(t, b.id) === `j${j.id}`);
          if (box && box.state === j.state) continue;
          const jar = t.pieces[j.id];
          const said = saidOf(jar);
          const n = box ? box.label : '?';
          return { ok: false, msg: said ? `${jarName(jar)} ${said}, and picture ${n} is in its tray.` : `${jarName(jar)} has not been poured or compressed yet, and picture ${n} is in its tray.` };
        }
        return { ok: true };
      },
      reward: {
        log: 'Closely packed and fixed, closely packed and sliding, and far apart.',
        title: 'Molecules in Three States',
        body: 'In a solid the molecules sit in fixed places. In a liquid they slide past one another, and in a gas they are far apart and move freely, so a gas can be compressed.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Melting and Boiling',
    // A PREDICT STAGE: no instrument. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'When ice melts and boils, what happens to the molecules of water?',
    widget,
    table: matterTable({
      pieces: [
        note('break', 'The bonds inside each molecule break and the atoms drift apart', { x: 30, y: 14 }),
        note('whole', 'Each molecule stays whole and the molecules move apart', { x: 78, y: 14 }),
        note('melts', 'Each molecule itself melts, then turns into a gas', { x: 30, y: 34 })
      ],
      fixtures: [leadFixture('lead', { x: 117, y: 52 }, { scene: 'heater', w: 44, h: 24 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Think of the same jar of water as ice, as water and as steam.',
      'Commit to what you expect to happen to each molecule itself, not to the sample.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, heat a jar of ice and let the analyzer name the molecules it finds.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const win = windowFixture('window', { x: 38, y: 25 }, { Ts: HEATER_TEST });
    const jars = [jarCard('ja', 'Ice', { x: 12, y: 60 }, { sample: 'H2O' }), jarCard('jd', 'Split water', { x: 36, y: 60 }, { sample: 'H2O', split: true, T: 20 })];
    const changes = [tag('melt', 'Ice melts', { x: 90, y: 53 }), tag('boil', 'Water boils', { x: 120, y: 53 }), tag('split', 'Electricity splits water', { x: 105, y: 64.5 })];
    const trays = [tray('same', 'Same molecule', 94, 27, 30, 36, 28, 12), tray('new', 'Different molecules', 128, 27, 30, 36, 28, 12)];
    return {
      id: 's4-reader',
      title: 'The Analyzer',
      briefing: { speaker: SPEAKER, body: 'In a phase change, molecules stay whole and only rearrange. The analyzer names the molecules in a jar.' },
      get prompt() {
        const g = recall(QUEST_KEY);
        return g && GUESS_LABEL[g]
          ? `You guessed ${GUESS_LABEL[g]}: which of these changes leave the water molecule whole?`
          : 'Which of these changes leave the water molecule whole?';
      },
      widget,
      table: matterTable({ bounds: BOUNDS, recorder: STRIP, pieces: [...jars, ...changes], fixtures: [win.fixture], zones: { slots: [win.slot], trays } }),
      hints: [
        'Put a jar in the window, turn the "Heater" dial, and press "Read Molecule" at each temperature.',
        'Compare what the analyzer names for the ice jar at each temperature with what it names for the jar of split water.',
        'If the molecules stayed whole, the analyzer still names H₂O.'
      ],
      check(state) {
        const t = state.table;
        const ids = Object.keys(S4_CHANGES);
        if (ids.some(id => !t.zones.trays[whereIs(t, id)])) return { ok: false, notYet: true, msg: 'Put all three changes in a tray.' };
        const bad = ids.find(id => whereIs(t, id) !== S4_CHANGES[id]);
        if (!bad) return { ok: true };
        const reads = t.pieces.ja.props.reads || {};
        const split = t.pieces.jd.props.reads || {};
        const ice = reads['-10']; const warm = reads['20']; const hot = reads['110']; const sp = split['20'];
        const tail = (a, b) => `the analyzer named ${a} at ${b}`;
        if (bad === 'melt') return { ok: false, msg: ice && warm ? `For the ice jar ${tail(ice, '−10 °C')} and ${warm} at 20 °C.` : 'The ice jar has not been read at both −10 °C and 20 °C yet.' };
        if (bad === 'boil') return { ok: false, msg: warm && hot ? `For the ice jar ${tail(warm, '20 °C')} and ${hot} at 110 °C.` : 'The ice jar has not been read at both 20 °C and 110 °C yet.' };
        return { ok: false, msg: ice && sp ? `The analyzer named ${ice} for the ice jar and ${sp} for the jar of split water.` : 'The analyzer has not been pressed on both the ice jar and the jar of split water yet.' };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g === 'whole' ? 'The analyzer agreed with your guess. ' : g && GUESS_LABEL[g] ? 'The analyzer disagreed with your guess. ' : '';
        return {
          log: 'The analyzer named H₂O at every temperature of the ice jar.',
          title: 'Phase Change',
          body: `${verdict}Melting and boiling are phase changes: the molecules stay whole and only rearrange. Splitting water makes new hydrogen and oxygen molecules.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const win = windowFixture('window', { x: 38, y: 25 }, { Ts: HEATER_LOOSE });
    const jars = [jarCard('ja', 'Ice', { x: 12, y: 60 }, { sample: 'H2O' })];
    const cards = Object.entries(S5_CARDS).map(([id, label], i) => stmt(id, label, { x: 97, y: 8 + i * 15 }));
    return {
      id: 's5-forces',
      title: 'What Holds the Ice',
      prompt: 'What holds the molecules of ice in their places?',
      widget,
      table: matterTable({
        bounds: BOUNDS, recorder: STRIP, pieces: [...jars, ...cards], fixtures: [win.fixture],
        zones: { slots: [win.slot, { id: 'holds', label: 'Holds the ice', at: { x: 132, y: 24 }, size: { w: 34, h: 14 } }] }
      }),
      hints: [
        'Heat the ice jar in the window and press "Read Molecule" at each setting.',
        'Compare how the molecules move at each setting, whether they stay together, and what the analyzer names.',
        'Rule out each card against what the window and the analyzer showed, and keep the one nothing contradicts.'
      ],
      check(state) {
        const t = state.table;
        const card = Object.keys(S5_CARDS).find(id => t.pieces[id].zone === 'slot:holds');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        if (card === 'between') return { ok: true };
        if (card === 'inside') {
          const n = (t.pieces.ja.props.reads || {})['5'];
          return { ok: false, msg: n ? `The analyzer named ${n} at 5 °C, where the molecules were already loose.` : 'The analyzer has not been pressed at 5 °C yet.' };
        }
        return { ok: false, msg: 'The streaks behind the molecules are about as long at 5 °C as at −10 °C.' };
      },
      reward: {
        log: 'Whole molecules were held in place by something between them.',
        title: 'Intermolecular Forces',
        body: 'Molecules attract one another through intermolecular forces: attractions between one molecule and the next. They are separate from the bonds inside a molecule, and melting and boiling only overcome them.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const sc = scaleFixture('scale', { x: 33, y: 22 }, { lines: ['EACH JAR HOLDS 1.00 L', 'OF WATER'] });
    const jars = S6_JARS.map((j, i) => jarCard(j.id, j.label, { x: 12.2 + i * 21.2, y: 60 }, { sample: 'H2O', state: j.state, T: S6_STATE_AT[j.state] }));
    return {
      id: 's6-room',
      title: 'Equal Jars',
      briefing: { speaker: SPEAKER, body: 'Each jar holds 1.00 L of water in a different state. Density is the mass in a given volume.' },
      prompt: 'In which jar does each molecule have the least space and in which the most?',
      widget,
      table: matterTable({
        bounds: BOUNDS, recorder: STRIP, pieces: jars, fixtures: [sc.fixture],
        zones: { slots: [sc.slot], rail: { at: { x: 107, y: 34 }, size: { w: 84, h: 16 }, first: 'Least space each', last: 'Most space each', items: jars.map(j => j.id), start: ['c', 'a', 'b'] } }
      }),
      hints: [
        'Weigh each jar on the balance with its "Weigh" key, then drag the jars onto the strip.',
        'Every jar has the same volume and holds the same kind of molecule.',
        'In jars of equal volume, greater mass means more molecules in the same space.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all 3 jars on the strip.' };
        if (order.join() === S6_ORDER.join()) return { ok: true };
        const cards = order.map(id => t.pieces[id]);
        if (cards.some(p => p.props.mass == null)) return { ok: false, msg: 'Not every jar on the strip has been weighed yet.' };
        const k = cards.findIndex((p, i) => i > 0 && cards[i - 1].props.mass < p.props.mass);
        const a = cards[k - 1]; const b = cards[k];
        return { ok: false, msg: `${jarName(a)} sits left of ${jarName(b)}, and the balance read ${fmt(a.props.mass)} g for the one and ${fmt(b.props.mass)} g for the other.` };
      },
      reward: {
        log: 'Ice had a little less mass than water, and steam almost none.',
        title: 'Density',
        body: 'In equal jars, greater mass means more molecules, so higher density means less space per molecule.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const sc = scaleFixture('scale', { x: 33, y: 22 }, { lines: ['EACH JAR HOLDS 1.00 L', 'OF WATER'] });
    const jars = [jarCard('jw', 'Water', { x: 84, y: 22 }, { sample: 'H2O', state: 'liquid', T: 0 }), jarCard('js', 'Steam', { x: 112, y: 22 }, { sample: 'H2O', state: 'gas', T: 100 })];
    return {
      id: 's7-count',
      title: 'Water and Steam',
      prompt: 'How many times as many molecules does the water jar hold as the steam jar?',
      entry: { id: 'times', label: 'Times as many', unit: '×' },
      widget,
      table: matterTable({ bounds: BOUNDS, recorder: STRIP, pieces: jars, fixtures: [sc.fixture], zones: { slots: [sc.slot] } }),
      hints: [
        'Weigh both jars on the balance with its "Weigh" key, then type your answer in the field at the bottom.',
        'Both jars have the same volume and hold the same kind of molecule, so compare their masses.',
        'The masses of equal jars are in the same proportion as their numbers of molecules, so compare the two masses as a ratio.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'times');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type your answer in the field at the bottom.' };
        if (Math.abs(v - TIMES) <= TIMES * 0.05) return { ok: true };
        const w = t.pieces.jw.props.mass; const s = t.pieces.js.props.mass;
        if (w == null || s == null) return { ok: false, msg: 'Both jars need weighing on the balance first.' };
        return { ok: false, msg: `The water jar read ${fmt(w)} g and the steam jar ${fmt(s)} g; ${fixed(v, v < 10 ? 2 : 0)} times does not fit the two.` };
      },
      reward: {
        log: 'A litre of water holds about 1,700 times the molecules of a litre of steam.',
        title: 'A Gas Is Mostly Empty',
        body: 'A jar of liquid water holds about 1,700 times as many molecules as an equal jar of steam. A gas is mostly empty space.'
      }
    };
  })()
];

const fmt = g => (g >= 100 ? String(Math.round(g)) : String(Number(Number(g).toPrecision(3))));

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'A solid keeps its shape, a liquid its volume, and a gas fills its container. Melting and boiling are phase changes in which the molecules stay whole and only intermolecular forces are overcome.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
/** Put a jar through the press (squeezed hard) and the tank, then file it. */
const tryJar = id => [put(id, SLOT), dial('press', 'squeeze', 4), { run: 'press' }];
const tryAll = ids => ids.flatMap(id => tryJar(id));
const readAt = (id, setting) => [put(id, WSLOT), dial('window', 'heat', setting), { run: 'window' }];

export const SOLUTIONS = [
  [...S1_JARS.flatMap(j => [...tryJar(j.id), put(j.id, `tray:${S1_TRAY[j.state]}`)])],
  [...tryAll(S2_JARS.map(j => j.id)), ...S2_BOXES.map(b => put(b.id, `tray:j${S2_JARS.find(j => j.state === b.state).id}`))],
  [put('whole', 'slot:guess')],
  [...readAt('ja', 1), ...readAt('ja', 2), ...readAt('ja', 3), ...readAt('jd', 2),
    put('melt', 'tray:same'), put('boil', 'tray:same'), put('split', 'tray:new')],
  [...readAt('ja', 1), ...readAt('ja', 2), ...readAt('ja', 3), put('between', 'slot:holds')],
  [...S6_JARS.flatMap(j => [put(j.id, PSLOT), { run: 'scale' }]), ...S6_ORDER.map((id, i) => put(id, `rail:${i}`))],
  [put('jw', PSLOT), { run: 'scale' }, put('js', PSLOT), { run: 'scale' }, typed('times', Math.round(TIMES))]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...S1_JARS.flatMap(j => [...tryJar(j.id), put(j.id, `tray:${j.state === 'gas' ? 'pool' : S1_TRAY[j.state]}`)])],
  [...tryAll(S2_JARS.map(j => j.id)), ...S2_BOXES.map(b => put(b.id, `tray:j${S2_JARS.find(j => j.state === (b.state === 'solid' ? 'liquid' : b.state === 'liquid' ? 'solid' : 'gas')).id}`))],
  [],
  [...readAt('ja', 1), ...readAt('ja', 2), ...readAt('ja', 3), ...readAt('jd', 2),
    put('melt', 'tray:same'), put('boil', 'tray:new'), put('split', 'tray:new')],
  [...readAt('ja', 1), ...readAt('ja', 2), ...readAt('ja', 3), put('inside', 'slot:holds')],
  [...S6_JARS.flatMap(j => [put(j.id, PSLOT), { run: 'scale' }]), ...['b', 'a', 'c'].map((id, i) => put(id, `rail:${i}`))],
  [put('jw', PSLOT), { run: 'scale' }, put('js', PSLOT), { run: 'scale' }, typed('times', 1000)]
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
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = {
  S1_TRAY, S2_JARS, S2_BOXES, S4_CHANGES, S6_JARS, S6_MASS, S6_ORDER, WATER_JAR, STEAM_JAR, TIMES,
  SQUEEZE_ATM, HEATER_TEST, HEATER_LOOSE, SAMPLES, WATER_G_PER_L
};
export { windowRead, scaleRead, jarStateOf, readerNames };
