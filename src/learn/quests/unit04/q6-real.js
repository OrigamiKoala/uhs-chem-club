/**
 * q6-real.js — Bellows, bench six: REAL GASES.
 *
 * Every bench so far held a gas to the gas law, and the gas law held. This one
 * squeezes and chills until it stops. The reading PV over nRT, which is one for an
 * ideal gas, is drawn on the plate; it is pushed above one by the room the
 * particles take and below one by the pull between them, and the window shows
 * the particles crowding as the room runs out.
 *
 *   1  PV over nRT as helium is squeezed hard                -> (it rises above one)
 *   2  why it rises                                           -> (the particles take up room)
 *   3  PV over nRT as carbon dioxide is cooled               -> (it falls below one)
 *   4  why it falls                                           -> ideal gas, real gas
 *   5  three gases ordered by how far they stray              -> (the stronger the pull, the further)
 *   6  which cylinder behaves most like an ideal gas          -> (low pressure and high temperature)
 *   7  which correction matters when the gas is cold          -> van der Waals equation (beyond the exam)
 *   8  why a real gas can be made a liquid                    -> (pulls that win over motion)
 *
 * THE EVIDENCE IS ON THE BENCH. Every reading comes from the van der Waals
 * equation over each gas's measured constants (`gasdata.js`), and the two
 * corrections are printed one beside the other (`PULL TAKES OFF`, `SIZE PUTS ON`),
 * in kilopascals, so which one wins at a setting is read, not argued. The three
 * gases of stage 5 stray in the order of their measured pulls at every setting of
 * both dials (`verify:learn` holds the whole grid to it).
 *
 * EVERY STAGE IS A FIGHT against gas bladders. This bench's bladders strain at
 * their seams when squeezed; none of them is ever made to burst.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountGas, gasState } from '../../engine/gasmount.js';
import { blankAnswer } from '../../engine/stagerunner.js';
import { readOf, GASES, pressureVdw, compression } from '../../engine/gasdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bideal gas(?:es)?\b/i, introducedAt: 4 },
  { term: /\breal gas(?:es)?\b/i, introducedAt: 4 },
  { term: /\bvan der waals\b/i, introducedAt: 7 }
];

/** The gas laws, pressure and the speed screen are plain words here. */
export const BUILDS_ON = ['unit04/q3-ideal', 'unit04/q5-speed'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE PLATES
   ------------------------------------------------------------------ */

const cyl = (id, label, gas, extra = {}) => ({
  id, label, head: 'cylinder', gas, n: 1, T: 300, V: 1, hold: 'dial', vdw: true, ...extra
});
const choice = (id, label) => ({ id, label });

const BASE = { units: true, labels: { gauge: 'PRESSURE' }, tempUnit: 'both' };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Squeezed Hard',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench squeezes and cools a gas past where the gas law holds, and prints PV over nRT — pressure times room over amount times R times temperature — which reads one while the law is true. The window draws the particles to scale, so you can see when they begin to crowd.'
    },
    prompt: 'We\'re testing severe compression on helium in the high-pressure rig. What happens to the ratio PV / (nRT) as helium is squeezed into tighter and tighter volumes?',
    controls: ['volume'],
    volumes: [24.6, 2.5, 0.5, 0.2, 0.1, 0.06], volumeStart: 1,
    scale: 'atm',
    ...BASE,
    show: { z: true, knocks: false },
    vmax: 24.6, gaugeMax: 112000,
    rigs: [cyl('a', 'CYLINDER A', 'He', { note: 'a cylinder of helium, squeezable' })],
    widget: {
      type: 'choice', label: 'PV over nRT',
      options: [
        choice('above', 'It climbs above one'),
        choice('one', 'It stays at one'),
        choice('below', 'It falls below one'),
        choice('zero', 'It falls to zero')
      ]
    },
    hints: [
      'Turn the volume dial from the largest room to the smallest and read PV over nRT at each setting.',
      'Compare the reading at the largest room with the readings at the smallest few.',
      'Note whether the readings at the smallest rooms sit above or below the reading of one the large room gave.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what the reading does.' };
      if (state.choice === 'above') return { ok: true };
      if (state.choice === 'one') return { ok: false, msg: 'The reading is one at the largest room, but look at the smallest few rooms.' };
      if (state.choice === 'below') return { ok: false, msg: 'Compare the reading at the smallest room with the one at the largest room; it has moved the other way.' };
      return { ok: false, msg: 'The reading stays well above nothing at every setting the dial has.' };
    },
    reward: {
      log: 'Squeezed hard, the reading climbs above one.',
      title: 'Above One',
      body: 'Squeezed hard, helium reads above one: it pushes harder than the gas law says it should. The law counts on the particles being points, and these are not.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Particles Take Room',
    prompt: 'Under extreme compression, the measured pressure climbs noticeably higher than expected. Why does the physical volume of the gas particles cause the pressure to spike?',
    controls: ['volume'],
    volumes: [24.6, 2.5, 0.5, 0.2, 0.1, 0.06], volumeStart: 1,
    scale: 'atm',
    ...BASE,
    show: { z: true, room: true, knocks: false },
    vmax: 24.6, gaugeMax: 112000,
    rigs: [cyl('a', 'CYLINDER A', 'He', { note: 'a cylinder of helium, squeezable' })],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        choice('room', 'The particles take up room themselves, so the gas has less space to move in than the cylinder suggests'),
        choice('heavy', 'The particles get heavier when they are squeezed'),
        choice('slow', 'The particles slow down when they are squeezed'),
        choice('pull', 'The particles pull on each other, and the reading rises')
      ]
    },
    hints: [
      'Turn the volume dial and watch the particles in the window and the line for size on the plate.',
      'Compare the particles with the space around them at the largest room and at the smallest.',
      'Ask what happens to the space a particle has to move in once the particles themselves fill a good part of the cylinder.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'room') return { ok: true };
      if (state.choice === 'heavy') return { ok: false, msg: 'The mass of the helium in the cylinder does not change when the piston moves.' };
      if (state.choice === 'slow') return { ok: false, msg: 'The temperature is the same at every setting of the piston, and so is the speed of the particles.' };
      return { ok: false, msg: 'Pulls would hold the pressure down, and the reading here is pushed up.' };
    },
    reward: {
      log: 'The particles fill some of the room.',
      title: 'Particles Take Room',
      body: 'At high pressure the size of the particles is no longer small next to the space between them. They take room themselves, so the room left to move in is less than the volume, and the pressure comes out higher than the gas law says.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Cooled Toward a Liquid',
    prompt: 'Our cooling coils drop the temperature of carbon dioxide toward condensation. What happens to the ratio PV / (nRT) as the CO₂ chills down?',
    controls: ['temp'],
    temps: [300, 280, 260, 240, 230], tempStart: 1, tempList: 'K',
    scale: 'kpa',
    ...BASE,
    show: { z: true, knocks: false },
    thermoLo: -80, thermoHi: 50, vmax: 1, gaugeMax: 4500,
    rigs: [cyl('a', 'CYLINDER A', 'CO2', { V: 0.5, hold: 'V', note: 'a cylinder of carbon dioxide, coolable' })],
    widget: {
      type: 'choice', label: 'PV over nRT',
      options: [
        choice('below', 'It falls below one'),
        choice('above', 'It climbs above one'),
        choice('one', 'It stays at one'),
        choice('jump', 'It jumps up and down')
      ]
    },
    hints: [
      'Turn the temperature dial from the warmest setting to the coldest and read PV over nRT at each.',
      'Compare the reading at the warmest setting with the readings at the coldest.',
      'Note on which side of one the readings fall as the gas cools.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what the reading does.' };
      if (state.choice === 'below') return { ok: true };
      if (state.choice === 'above') return { ok: false, msg: 'The squeezed helium read above one; compare the carbon dioxide readings with that one.' };
      if (state.choice === 'one') return { ok: false, msg: 'The reading is not the same at every setting of the cooler.' };
      return { ok: false, msg: 'The readings step steadily one way along the dial.' };
    },
    reward: {
      log: 'Cooled, the reading falls below one.',
      title: 'Below One',
      body: 'Cooled toward its condensing point, carbon dioxide reads below one: its pressure is lower than the gas law says. Something other than size is acting on the particles.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Pull',
    prompt: 'Watch the intermolecular forces in the chilling cylinder. What effect do attractive pulls between slow-moving particles have on the pressure?',
    controls: ['temp'],
    temps: [300, 280, 260, 240, 230], tempStart: 1, tempList: 'K',
    scale: 'kpa',
    ...BASE,
    show: { z: true, pullShare: true, knocks: false },
    thermoLo: -80, thermoHi: 50, vmax: 1, gaugeMax: 4500,
    rigs: [cyl('a', 'CYLINDER A', 'CO2', { V: 0.5, hold: 'V', note: 'a cylinder of carbon dioxide, coolable' })],
    widget: {
      type: 'choice', label: 'The pull',
      options: [
        choice('softer', 'The particles linger near one another and hit the wall more softly, so the pressure comes out lower'),
        choice('harder', 'The particles hit the wall harder, so the pressure comes out higher'),
        choice('none', 'There is no pull between the particles'),
        choice('stick', 'The particles stick to the wall and stop')
      ]
    },
    hints: [
      'Turn the temperature dial down and read the share of the push that the pull takes off.',
      'Compare that share at the warmest setting with the share at the coldest, and the reading of PV over nRT beside it.',
      'Ask what a pull between neighbours does to the knock each particle makes on the wall.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what the pull does.' };
      if (state.choice === 'softer') return { ok: true };
      if (state.choice === 'harder') return { ok: false, msg: 'The pull takes a share of the push off, and the reading falls as that share grows.' };
      if (state.choice === 'none') return { ok: false, msg: 'The plate prints a share of the push that the pull takes off, and it grows as the gas cools.' };
      return { ok: false, msg: 'The gas still moves and knocks at every setting of the cooler.' };
    },
    reward: {
      log: 'A cold gas is held back by a pull.',
      title: 'Ideal Gas, Real Gas',
      body: 'A gas of particles with no size and no pull, which the gas law describes exactly, is an ideal gas. Every actual gas is a real gas: it drifts from the law where its particles are crowded, and where they are cold enough to cling a little.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Who Strays Furthest',
    prompt: 'We have nitrogen, ammonia, and helium at low temperature and high density. Rank these three gases from greatest deviation from ideal behavior (PV / nRT = 1) to least!',
    controls: ['temp'],
    temps: [200, 220, 240], tempStart: 1, tempList: 'K',
    scale: 'kpa',
    ...BASE,
    show: { z: true, knocks: false },
    thermoLo: -100, thermoHi: 0, vmax: 2, gaugeMax: 1500,
    rigs: [
      cyl('a', 'CYLINDER A', 'N2', { V: 2, hold: 'V', note: 'a cylinder of nitrogen' }),
      cyl('b', 'CYLINDER B', 'NH3', { V: 2, hold: 'V', note: 'a cylinder of ammonia' }),
      cyl('c', 'CYLINDER C', 'He', { V: 2, hold: 'V', note: 'a cylinder of helium' })
    ],
    widget: {
      type: 'order', label: 'Furthest from one first',
      items: [{ id: 'a', label: 'Cylinder A' }, { id: 'b', label: 'Cylinder B' }, { id: 'c', label: 'Cylinder C' }]
    },
    hints: [
      'Read PV over nRT on all three plates and turn the temperature dial.',
      'Compare how far each reading sits from one, whichever side of one it is on.',
      'Put first the plate whose reading is furthest from one at every setting of the dial.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Put all three cylinders in order.' };
      const dev = id => Math.abs(readOf(STAGES[4], id, {}).Z - 1);
      const want = ['a', 'b', 'c'].sort((x, y) => dev(y) - dev(x));
      if (state.order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Judge by the distance from one, and not by which side of it a reading is on.' };
    },
    reward: {
      log: 'The stronger the pull, the further a gas strays.',
      title: 'Strong Pulls Stray Furthest',
      body: 'Gases whose particles pull harder on one another stray furthest from the gas law: ammonia far more than nitrogen, and helium, whose particles barely attract at all, hardly any.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'When a Gas Behaves',
    prompt: 'Four cylinders hold carbon dioxide under differing conditions. Which cylinder\'s gas behaves most closely like an ideal gas?',
    controls: ['temp'],
    temps: [250, 350, 450, 550], tempStart: 1, tempList: 'K',
    scale: 'kpa',
    ...BASE,
    show: { z: true, knocks: false },
    thermoLo: -50, thermoHi: 350, vmax: 50, gaugeMax: 11000,
    rigs: [
      cyl('a', 'CYLINDER A', 'CO2', { V: 0.4, hold: 'V', note: 'a small cylinder of carbon dioxide' }),
      cyl('b', 'CYLINDER B', 'CO2', { V: 2, hold: 'V', note: 'a middling cylinder of carbon dioxide' }),
      cyl('c', 'CYLINDER C', 'CO2', { V: 10, hold: 'V', note: 'a large cylinder of carbon dioxide' }),
      cyl('d', 'CYLINDER D', 'CO2', { V: 50, hold: 'V', note: 'a very large cylinder of carbon dioxide' })
    ],
    widget: { type: 'pick', label: 'The most ideal', help: 'Tap a cylinder on the bench to pick it.' },
    hints: [
      'Read PV over nRT on all four plates, then turn the temperature dial.',
      'Compare each plate with one at every setting of the dial, and compare what the plates have in common that sits close to it.',
      'Choose the plate whose reading stays closest to one whichever way the heater is set.'
    ],
    check(state) {
      if (!state.sample) return { ok: false, notYet: true, msg: 'Tap a cylinder to pick it.' };
      const dev = id => Math.abs(readOf(STAGES[5], id, {}).Z - 1);
      const best = ['a', 'b', 'c', 'd'].sort((x, y) => dev(x) - dev(y))[0];
      if (state.sample === best) return { ok: true };
      return { ok: false, msg: 'Compare how close each reading is to one at the coldest setting and at the hottest; a good gas stays close at both.' };
    },
    reward: {
      log: 'Low pressure and high temperature.',
      title: 'When a Gas Behaves',
      body: 'A real gas comes closest to ideal at low pressure and high temperature: its particles are far apart and moving too fast for their pulls to matter.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Two Corrections',
    prompt: 'The display tracks two van der Waals corrections: particle attraction and particle volume. When the gas is cold and only lightly compressed, which correction dominates?',
    controls: ['volume', 'temp'],
    volumes: [1, 0.5, 0.25], volumeStart: 1,
    temps: [250, 500, 1000], tempStart: 1, tempList: 'K',
    scale: 'kpa',
    ...BASE,
    show: { z: true, pull: true, room: true, knocks: false },
    thermoLo: -50, thermoHi: 800, vmax: 1, gaugeMax: 36000,
    rigs: [cyl('a', 'CYLINDER A', 'CO2', { note: 'a cylinder of carbon dioxide' })],
    widget: {
      type: 'choice', label: 'The bigger correction',
      options: [
        choice('pull', 'The pull between the particles, which takes pressure off'),
        choice('size', 'The room the particles take, which puts pressure on'),
        choice('equal', 'They are always equal'),
        choice('neither', 'Neither does anything to the reading')
      ]
    },
    hints: [
      'Read the two lines on the plate at the coldest and roomiest setting.',
      'Compare the line for the pull with the line for the size, and then turn the dials toward hot and crushed.',
      'Give the answer for the cold and roomy setting, since the two lines trade places elsewhere.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a correction.' };
      if (state.choice === 'pull') return { ok: true };
      if (state.choice === 'size') return { ok: false, msg: 'Read the two lines at the coldest setting with the most room; one of them dwarfs the other.' };
      if (state.choice === 'equal') return { ok: false, msg: 'The two lines are not the same figure at the setting the question asks about.' };
      return { ok: false, msg: 'The plate prints a figure for each correction, and neither is nothing.' };
    },
    reward: {
      log: 'A pull and a size, one to a side.',
      title: 'The van der Waals Equation',
      body: 'Two corrections turn the gas law into the van der Waals equation: the pull between particles takes pressure off, and the room the particles take puts pressure on. In a cold, roomy gas the pull matters more, and in a hot, crushed one the size does, which goes beyond the exam.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Why It Condenses',
    prompt: 'Our refrigeration unit can condense real gases into liquid fuel, but an ideal gas could never condense. Why is that?',
    controls: ['temp'],
    temps: [300, 260, 240, 230], tempStart: 1, tempList: 'K',
    scale: 'kpa',
    ...BASE,
    show: { z: true, pullShare: true, knocks: false },
    thermoLo: -80, thermoHi: 50, vmax: 1, gaugeMax: 4500,
    rigs: [cyl('a', 'CYLINDER A', 'CO2', { V: 0.5, hold: 'V', note: 'a cylinder of carbon dioxide, coolable' })],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        choice('pull', 'Real particles pull on one another, so cooled and squeezed enough they cling together; ideal particles never pull'),
        choice('size', 'Real particles are bigger, and big particles stay together'),
        choice('slow', 'Real particles move more slowly than ideal ones'),
        choice('heavy', 'Real particles are heavier than ideal ones')
      ]
    },
    hints: [
      'Turn the temperature dial down and watch the share of the push that the pull takes off.',
      'Compare what the pull is doing at the coldest setting with what the motion of the particles is doing there.',
      'Ask which of the properties a real gas has and an ideal gas lacks could hold particles together once they slow down.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'pull') return { ok: true };
      if (state.choice === 'size') return { ok: false, msg: 'The size of the particles puts pressure on, which pushes particles apart and does not hold them together.' };
      if (state.choice === 'slow') return { ok: false, msg: 'Slower motion alone does not make particles stay together; ask what could hold them once they slow.' };
      return { ok: false, msg: 'The mass of the gas does not change as the cooler is turned.' };
    },
    reward: {
      log: 'A pull that wins over motion makes a liquid.',
      title: 'From Gas to Liquid',
      body: 'Where the pull between particles beats their motion, they stay together and the gas becomes a liquid. An ideal gas has no pull, so it could be cooled for ever and stay a gas.'
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
      body: 'A real gas reads above one where its particles crowd and below one where they cling, so it is closest to ideal when it is thin and hot, and furthest from it when it is dense and cold. The same pull that holds it back is what turns it into a liquid.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every pressure vessel on the cloud deck is designed with the corrections in mind. The gas law is a very good first answer, and now you know exactly where it stops being one.'
    },
    {
      heading: 'Next',
      body: 'Something at the heart of the deck is running every pump at once, and it is reading you as closely as you have read the gas.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'At very high pressure, a real gas has PV/nRT greater than 1. What is the main cause?',
    options: [
      { id: 'a', label: 'The particles take up a significant part of the volume' },
      { id: 'b', label: 'The attractions between the particles become stronger' },
      { id: 'c', label: 'The particles slow down' },
      { id: 'd', label: 'The particles lose mass' }
    ],
    answer: 'a',
    explanation: 'When the gas is compressed, the volume of the particles themselves is no longer negligible, so the free volume is smaller and the pressure higher than the ideal gas law predicts.'
  },
  {
    question: 'Near its condensing point, a real gas has PV/nRT less than 1. What is the main cause?',
    options: [
      { id: 'a', label: 'Attractions between the particles reduce the force of their collisions with the walls' },
      { id: 'b', label: 'The particles take up less volume' },
      { id: 'c', label: 'The particles move faster' },
      { id: 'd', label: 'The gas gains mass' }
    ],
    answer: 'a',
    explanation: 'Attractions pull the particles toward each other, so they strike the walls more softly and the pressure is lower than the ideal gas law predicts.'
  },
  {
    question: 'Which of these gases is expected to deviate most from ideal behaviour at the same temperature and pressure?',
    options: [
      { id: 'a', label: 'NH₃' },
      { id: 'b', label: 'N₂' },
      { id: 'c', label: 'He' },
      { id: 'd', label: 'H₂' }
    ],
    answer: 'a',
    explanation: 'Ammonia has the strongest attractions between its particles of these four, and so strays furthest from the ideal gas law.'
  },
  {
    question: 'Under which conditions does a real gas behave most ideally?',
    options: [
      { id: 'a', label: 'High temperature and low pressure' },
      { id: 'b', label: 'Low temperature and high pressure' },
      { id: 'c', label: 'High temperature and high pressure' },
      { id: 'd', label: 'Low temperature and low pressure' }
    ],
    answer: 'a',
    explanation: 'At high temperature the particles move too fast for attractions to matter, and at low pressure they are far enough apart for their own volume not to matter.'
  },
  {
    question: 'Why can a real gas be liquefied but an ideal gas could not?',
    options: [
      { id: 'a', label: 'Real particles attract one another, so they can cling together when cooled' },
      { id: 'b', label: 'Real particles have mass and ideal particles do not' },
      { id: 'c', label: 'Real particles are slower' },
      { id: 'd', label: 'Ideal particles are too big to condense' }
    ],
    answer: 'a',
    explanation: 'An ideal gas has no attractions between its particles, so nothing can hold them together when they slow down. Real particles do attract, and below a certain temperature the attraction wins.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: 'above' },
  { choice: 'room' },
  { choice: 'below' },
  { choice: 'softer' },
  { order: ['b', 'a', 'c'] },
  { sample: 'd' },
  { choice: 'pull' },
  { choice: 'pull' }
];

export const MISSES = [
  { choice: 'below' },
  { choice: 'heavy' },
  { choice: 'above' },
  { choice: 'harder' },
  { order: ['c', 'a', 'b'] },
  { sample: 'a' },
  { choice: 'size' },
  { choice: 'size' }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...gasState(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  return mountGas(container, ctx, { STAGES, DEBRIEF, toolNoteFor, blankState });
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { readOf, pressureVdw, compression, GASES };
