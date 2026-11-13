/**
 * q5-speed.js — Bellows, bench five: SPEED AND ESCAPE.
 *
 * The leak-test station at a vent stack, on the gas kit (`table/kits/gas.js`). Bench one found that the particles of a gas move at a
 * spread of speeds, and that a lighter gas is faster at one temperature. This one asks what that does when a gas finds a hole, and
 * when it has to push its way through other gas.
 *
 * THE CLICK. Players expect a heavy gas to be the one that gets away, or all gases to leak alike: a hole is a hole. Stage 1 asks which
 * of a helium chamber and a nitrogen chamber, each with a pinhole, will empty first (a predict stage, no instrument). Stage 2 sets four
 * chambers out, with the particles flying about in the glass, and the player ranks them by how soon each is empty. The lightest goes
 * first, the heaviest last, and the word for it is given only then. Stage 3 uses it to name an unknown leak by matching it against
 * a reference whose gas the player can change; stages 4 and 5 meet the same idea in a new case, two gases racing down a tube.
 *
 *   1  PREDICT: which of two chambers empties first
 *   2  TEST: rank four chambers by how soon each runs out        -> Effusion
 *   3  set a reference chamber to empty at the sample's pace      -> Naming by Leak
 *   4  PREDICT: where two gases let in at the two ends of a tube meet
 *   5  TEST: the race down the tube                              -> Diffusion
 *   6  the molar mass of an unknown gas, from how long it takes to half-empty -> Graham's law (a figure worked out)
 *   7  four speed snapshots at 300 K ordered from lightest to heaviest particles -> Mass and Speed
 *
 * (Cut as repeats or as past the idea: the speed-peak target, the particle-speed calculation at 300 K, the fast tail of a heated gas,
 * and the random walk of a smell. The unmarked sample stands on the bench.)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { gasTable, rig, pinhole, tube, chip, stmt, halfTime, tubeRead, pinholeRead, histCard, speedBins, GASES, front } from '../../table/kits/gas.js';
import { widget, put, dial, cardIn, predictStage, youPredicted, guessOf, typed } from './_shared.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\beffusion\b/i, introducedAt: 2 },
  { term: /\bdiffusion\b/i, introducedAt: 5 },
  { term: /\bgraham.?s law\b/i, introducedAt: 6 }
];

/** Pressure, kelvin, the speed screen and the gas laws are plain words here. */
export const BUILDS_ON = ['unit04/q1-knocks', 'unit04/q3-ideal'];

export const KEY_LEAK = 'unit04/q5-speed#leak';
export const KEY_TUBE = 'unit04/q5-speed#tube';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const PIN = 'pin';
const T0 = 300;
/** The seconds a stopwatch can be set to. */
const TIMES = [0, 1, 2, 3, 4, 5, 6];
/** The chambers of stage 2, in the order they stand on the bench (the lightest is not first), and their gases. */
export const CHAMBERS = [['a', 'N2'], ['b', 'H2'], ['c', 'CO2'], ['d', 'He']];
/** The reference chamber's gases and the sample's gas in stage 3. */
export const REFERENCE_GASES = ['Ne', 'Ar', 'Kr', 'Xe'];
export const SAMPLE = 'Kr';
/** Stage 6: the reference gases on its dial and the unknown (not on the dial). */
export const MASS_GASES = ['He', 'Ne', 'Ar', 'Kr'];
export const UNKNOWN = 'CH4';
/** The tube: its length in centimetres and the stopwatch's seconds. */
export const TUBE_CM = 100;
const TUBE_TIMES = [0, 15, 30, 45, 60, 75];

export const LEAK_GUESSES = [['he', 'The helium chamber'], ['n2', 'The nitrogen chamber'], ['same', 'Both together']];
export const TUBE_GUESSES = [['nh3', 'Nearer the ammonia end'], ['mid', 'Halfway'], ['hcl', 'Nearer the hydrogen chloride end']];

/** Where the ring has formed, as the card that says so: more than a twentieth of the tube from the middle is "nearer an end". */
export function ringCard(ringFromLeft, length = TUBE_CM) {
  return Math.abs(ringFromLeft - length / 2) < length * 0.05 ? 'mid' : ringFromLeft < length / 2 ? 'nh3' : 'hcl';
}

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
/** Stage 8: four gases at one temperature, shuffled; the snapshots share one height scale so the heavy gas's tall narrow curve is not clipped. */
export const SNAP_T = 300;
export const SNAP_GASES = [['a', 'N2'], ['b', 'Xe'], ['c', 'He'], ['d', 'CO2']];
export const SNAP_REF = Math.max(...SNAP_GASES.map(([, g]) => Math.max(...speedBins(g, SNAP_T, 24, 2400))));

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: KEY_LEAK,
    title: 'Effusion Prediction',
    prompt: 'A helium chamber and a nitrogen chamber each have a tiny hole in the wall: which one runs out of gas first?',
    items: LEAK_GUESSES,
    hints: [
      'Lay one card in the slot.',
      'Picture the particles of each gas flying at the wall and ask which kind reaches the hole more often.',
      'Ask whether speed at one temperature depends on how heavy a particle is.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Chambers with pinholes will now be tested to observe which gas escapes faster.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const p = pinhole(PIN, { x: 55, y: 25 }, {
      chambers: CHAMBERS.map(([id, gas]) => ({ id, gas, label: `CHAMBER ${id.toUpperCase()}` })), times: TIMES, timeStart: 1, w: 100, record: false,
      gate: { railChanged: CHAMBERS.map(([id]) => id) }, hideUntilCommit: ['left']
    });
    return {
      title: 'Effusion Rates',
      briefing: 'Four chambers hold different gases at 300 K, each with a tiny pinhole opening into vacuum.',
      get prompt() {
        return youPredicted(KEY_LEAK, LEAK_GUESSES, 'Rank the four chambers on the rail from earliest to empty to latest to empty.', 'Rank the four chambers on the rail from earliest to empty to latest to empty.');
      },
      widget,
      table: gasTable({
        pieces: CHAMBERS.map(([id]) => chip(id, `CHAMBER ${id.toUpperCase()}`, { x: 0, y: 0 })),
        fixtures: [p],
        zones: { rail: { id: 'rail', at: { x: 75, y: 56 }, size: { w: 84, h: 14 }, first: 'Empties first', last: 'Empties last', items: CHAMBERS.map(([id]) => id), start: CHAMBERS.map(([id]) => id) } }
      }),
      hints: [
        'Turn the Stopwatch dial to observe the chambers over time.',
        'Compare the remaining gas in each chamber at equal times.',
        'Set the stopwatch to one time and rank the chambers by how much gas each has left.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four chambers on the rail.' };
        const gasOf = id => CHAMBERS.find(c => c[0] === id)[1];
        const want = CHAMBERS.map(c => c[0]).sort((x, y) => halfTime(gasOf(x), T0) - halfTime(gasOf(y), T0));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two adjacent chambers on the rail are in the wrong order.' };
      },
      get reward() {
        return {
          log: 'The lightest gas emptied fastest.',
          title: 'Effusion',
          body: 'Gas escaping through a pinhole into a vacuum undergoes effusion. Lighter gas molecules have higher average speeds at a given temperature, reaching the hole more frequently and effusing faster.'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const p = pinhole(PIN, { x: 40, y: 30 }, {
      chambers: [{ id: 'a', label: 'REFERENCE', pick: 'ref' }, { id: 'b', gas: SAMPLE, label: 'STACK LEAK', sealed: true }],
      picks: { ref: { gases: REFERENCE_GASES, label: 'Gas', start: 1 } }, times: TIMES, timeStart: 1, showHalf: true, record: false,
      hideUntilCommit: ['half']
    });
    return {
      title: 'Identifying an Unknown Gas',
      prompt: 'Set the reference gas so its effusion rate matches the unknown sample.',
      widget,
      table: gasTable({ fixtures: [p] }),
      hints: [
        'Adjust the Gas dial and use the Stopwatch dial.',
        'Compare the time required for each chamber to reach half its initial amount.',
        'Change the reference gas until its half-empty time matches the sample\'s.'
      ],
      check(state) {
        const t = state.table;
        const r = pinholeRead(t, PIN);
        const ref = r.chambers[0];
        const leak = r.chambers[1];
        if (Math.round(t.fixtures[PIN].dials.ref.value) === 1) return { ok: false, notYet: true, msg: 'Turn the Gas dial to test different gases.' };
        if (ref.gas === leak.gas) return { ok: true };
        return { ok: false, msg: ref.half < leak.half ? 'The reference chamber empties faster than the unknown sample.' : 'The reference chamber empties more slowly than the unknown sample.' };
      },
      reward: {
        log: 'Effusion rate matched to reference gas.',
        title: 'Effusion Rate and Molar Mass',
        body: 'Gases with identical effusion rates at the same temperature have the same molar mass. Comparing an unknown gas to reference standards identifies its molar mass.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  predictStage({
    key: KEY_TUBE,
    title: 'Gas Meeting Point',
    prompt: 'Ammonia (NH₃, 17 g/mol) and hydrogen chloride (HCl, 36.5 g/mol) enter opposite ends of a tube: where do they meet?',
    items: TUBE_GUESSES,
    hints: [
      'Lay one card in the slot.',
      'Compare the speeds of the two gases in the tube as the last bench found them.',
      'Ask what the particles bump into on the way, and whether that slows both kinds equally.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'A tube with opposing gas inputs will test where the two gases meet.'
    }
  }),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const tb = tube('tube', { x: 42, y: 28 }, { ends: ['NH3', 'HCl'], times: TUBE_TIMES, timeStart: 1, length: TUBE_CM, gate: { slot: 'show' }, hideUntilCommit: ['ring'] });
    return {
      title: 'Diffusion Along a Tube',
      get prompt() {
        return youPredicted(KEY_TUBE, TUBE_GUESSES, 'Run the stopwatch until the gases meet and place the card for where the ring formed.', 'Run the stopwatch until the gases meet and place the card for where the ring formed.');
      },
      widget,
      table: gasTable({
        pieces: [stmt('nh3', 'Nearer the ammonia end', { x: 97, y: 45 }), stmt('mid', 'Halfway', { x: 131, y: 45 }), stmt('hcl', 'Nearer the hydrogen chloride end', { x: 114, y: 57.5 })],
        fixtures: [tb],
        zones: { slots: [{ id: 'show', label: 'Prediction', at: { x: 114, y: 26 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Advance the Stopwatch dial and press Check.',
        'Observe how far each gas migrates through the tube over time.',
        'Run the stopwatch to its last setting and read where the white ring sits along the tube.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const f = t.fixtures.tube;
        const end = { ...t, fixtures: { ...t.fixtures, tube: { ...f, dials: { ...f.dials, time: { ...f.dials.time, value: f.props.times.length } } } } };
        const want = ringCard(tubeRead(end, 'tube').ringFromLeft);
        if (card.id === want) return { ok: true };
        return { ok: false, msg: 'The reaction ring does not form at that position.' };
      },
      get reward() {
        return {
          log: 'The reaction ring formed closer to the heavier gas.',
          title: 'Diffusion',
          body: 'Gases disperse through other gases by diffusion. Frequent collisions slow net movement, but lighter particles travel faster on average, so the ring forms closer to the heavier gas.'
        };
      }
    };
  })()  ,

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const p = pinhole(PIN, { x: 40, y: 30 }, {
      chambers: [{ id: 'a', label: 'REFERENCE', pick: 'ref' }, { id: 'b', gas: UNKNOWN, label: 'UNKNOWN', sealed: true }],
      picks: { ref: { gases: MASS_GASES, label: 'Gas', start: 1, withMass: true } }, times: TIMES, timeStart: 1, showHalf: true, record: false
    });
    return {
      title: 'Graham\'s Law',
      briefing: 'An unknown gas and a selectable reference gas sit in identical pinhole chambers at the same temperature.',
      prompt: 'Type the mass of one mole of the unknown gas.',
      entry: { id: 'ans', label: 'Molar mass', unit: 'g/mol' },
      widget,
      table: gasTable({
        fixtures: [p],
      }),
      hints: [
        'Turn the Gas dial and read each reference gas\'s half-empty time.',
        'Compare how the half-empty time grows when the molar mass grows, from helium to neon and from neon to argon.',
        'The half-empty time scales with the square root of the molar mass.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the figure in g/mol.' };
        const want = GASES[UNKNOWN].M;
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        return { ok: false, msg: v > want ? 'The unknown gas has a smaller figure than that.' : 'The unknown gas has a larger figure than that.' };
      },
      reward: {
        log: 'Time grew as the square root of the mass.',
        title: 'Graham\'s Law',
        body: 'The half-empty time scales as the square root of molar mass (Graham\'s law), so twice the time means four times the mass: 4 × 4 = 16 g/mol, methane.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const snap = (id, label, gas) => histCard(id, label, { x: 0, y: 0 }, gas, SNAP_T, SNAP_REF);
    const speedRig = rig('speedRig', { x: 34, y: 29 }, {
      cyls: [{ id: 'a', label: 'Reference', gas: 'He', n: 1, hold: 'V', V: 20, T: SNAP_T }],
      vmax: 20, w: 60, speedScreen: true,
      show: { gauge: false, volume: false, temperature: false, kelvin: true },
      title: `Helium at ${SNAP_T} K`
    });
    return {
      title: 'Speed Distribution and Mass',
      prompt: `Put the four speed snapshots in order from the lightest particles to the heaviest, all taken at ${SNAP_T} K.`,
      widget,
      table: gasTable({
        pieces: SNAP_GASES.map(([id, gas]) => snap(id, `SNAPSHOT ${id.toUpperCase()}`, gas)),
        fixtures: [speedRig],
        zones: { rail: { id: 'rail', at: { x: 108, y: 32 }, size: { w: 76, h: 24 }, first: 'Lightest', last: 'Heaviest', items: ['a', 'b', 'c', 'd'], start: ['a', 'b', 'c', 'd'] } }
      }),
      hints: [
        'Drag the snapshots along the strip.',
        'Compare where each curve peaks and how wide it spreads.',
        'At one temperature every gas has the same average kinetic energy, so the particles of a heavier gas move more slowly.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four snapshots on the strip.' };
        const mass = id => GASES[t.pieces[id].props.gas].M;
        const want = ['a', 'b', 'c', 'd'].sort((x, y) => mass(x) - mass(y));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two neighbouring snapshots on the strip are the wrong way round.' };
      },
      reward: {
        log: 'At one temperature the heavier gas is slower.',
        title: 'Mass and Speed',
        body: 'At one temperature every gas has the same average kinetic energy, so heavier particles move more slowly. Their curve is taller and narrower at lower speeds, while a light gas spreads wider toward high speeds.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn the Stopwatch dial,', 'then rank the chips.'],
  3: ['Adjust the Gas and Stopwatch dials.'],
  4: ['Place a card in the slot.'],
  5: ['Advance the Stopwatch dial and press Check,', 'then place a card in the slot.'],
  6: ['Turn the Gas dial,', 'then type your answer in the field at the bottom.'],
  7: ['Drag the snapshots along the strip.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'Summary',
      body: 'Lighter gas molecules have higher average velocities at a given temperature, causing them to effuse through pinholes and diffuse through other gases more rapidly than heavier molecules.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('he', 'slot:predict')],
  [dial(PIN, 'time', 3), put('b', 'rail:0'), put('d', 'rail:1'), put('a', 'rail:2'), put('c', 'rail:3')],
  [dial(PIN, 'time', 2), dial(PIN, 'ref', 3)],
  [put('hcl', 'slot:predict')],
  [put('hcl', 'slot:show'), dial('tube', 'time', 6), { run: 'tube' }],
  [dial(PIN, 'ref', 2), typed('ans', "16")],
  [put('c', 'rail:0'), put('a', 'rail:1'), put('d', 'rail:2'), put('b', 'rail:3')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial(PIN, 'time', 3), put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2'), put('d', 'rail:3')],
  [dial(PIN, 'ref', 2)],
  [],
  [put('mid', 'slot:show'), dial('tube', 'time', 6), { run: 'tube' }],
  [dial(PIN, 'ref', 2), typed('ans', "20")],
  [put('b', 'rail:0'), put('d', 'rail:1'), put('a', 'rail:2'), put('c', 'rail:3')]
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
export { halfTime, tubeRead, pinholeRead, GASES, front };
