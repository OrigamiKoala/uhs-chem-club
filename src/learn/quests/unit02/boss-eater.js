/**
 * boss-eater.js — Learn world 2 Boss Encounter: The Lantern-Eater.
 *
 * An auroral entity feeding on the lamps of the Lanternfall ice field. Five phases, each on the TABLETOP of a bench the player
 * has worked (plan `bench-tabletop.md`, phase T4d), with a fresh specimen on the table and the eater standing in the table's
 * corner, watching it:
 *
 *   1  the energy ladder    which drop makes the eater lamp's 486 nm line        (bench 3 · optics kit)
 *   2  the photocell        which lamp frees cesium's electrons slowest          (bench 2 · optics kit)
 *   3  the box rack         how many electrons of oxygen stand alone             (bench 6 · address and filling kit)
 *   4  the chamber          the atom whose peaks match a sealed core             (bench 7 · spectrum kit)
 *   5  the cuvettes         the strength of a sealed copper solution             (bench 9 · cuvette kit)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung is one
 * sentence and never the answer. Nothing blocks a correct commit. A miss costs one point of Integrity and three knock the table
 * back, with every reading and hint still kept. The foe is the eater itself, in the corner pad of each table (`table/layout.js`
 * `FOE_PAD`): it only observes, and a boss phase never declares a field stage (the walk is suspended while the eater stands).
 *
 * Awards Case File clue: clue_lantern_lens. The boss pays no XP: the main story never does.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { planPhotocell, planAbsorb } from '../../engine/lightdata.js';
import {
  opticsTable, energyLadder, linesStrip, photocell, metalPlate, lamp, ladderRead
} from '../../table/kits/optics.js';
import {
  shellsTable, shelf, hand, magnet, marker as shellsMarker, rackFor, boxPieceId, rackPull, readOf, MEASURED
} from '../../table/kits/shells.js';
import { pesTable, specimen, chamber, buildFixture, buildRead } from '../../table/kits/pes.js';
import {
  cuvetteTable, cuvette, dropper, rinser, spectro, plaqueFixture, markerFixture, markerRead
} from '../../table/kits/cuvette.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit02/q1-wave', 'unit02/q2-photon', 'unit02/q3-lines',
  'unit02/q6-filling', 'unit02/q7-pes', 'unit02/q9-absorb'
];

const SPEAKER = 'Vess';

/** Every key on these tables says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The eater, as every phase's foe: one body, watching the table. It reads no probe, it only observes. */
const EATER_FOE = [{ id: 'eater', label: 'The Lantern-Eater' }];

const widget = { type: 'table', label: 'The bench' };

/* ------------------------------------------------------------------
   THE TABLES
   Each phase keeps the top-right corner clear for the foe (`FOE_PAD`: x from 126.5, y to 23.5 on a 150 x 64 table).
   ------------------------------------------------------------------ */

/** Phase 1: the ladder at the left and the strip its drops write on, between it and the foe's corner. */
const LADDER_LINE = 486;

/** Phase 2: the lamps' wavelengths, and the plate they shine on. */
const LAMPS = [['a', 'Lamp A', 540], ['b', 'Lamp B', 450], ['c', 'Lamp C', 350]];
const CELL_BRIGHT = 5;
const speedOf = nm => planPhotocell('Cs', nm, CELL_BRIGHT).speed;

/** Phase 4: the sealed core is neon's. */
const CORE = 'Ne';
const CH = { x: 57, y: 25 };
const CHAMBER = 'ch';

/** Phase 5: the standards are filled by the player; the sealed solution is a fixed strength (mol/L). */
export const SEALED_CONC = 0.007;
const SP = 'sp';
const BEAM = `slot:${SP}.cuv`;
const REC = { at: { x: 108, y: 13 }, size: { w: 30, h: 18 }, xLabel: 'Concentration', xUnit: 'mmol/L', yLabel: 'Reading', yUnit: '' };

/* ------------------------------------------------------------------
   THE FIVE PHASES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const lad = energyLadder('lad', 'Hydrogen', { x: 30, y: 32 });
    return {
      id: 'phase1',
      title: 'Phase 1 · The Eater\'s Lamp',
      briefing: {
        speaker: SPEAKER,
        body: 'This is the Lantern-Eater, and each phase puts one of the benches in front of it again. A miss costs the table a point of Integrity; three knock it back, and nothing you have read is lost.'
      },
      prompt: 'Make the eater lamp\'s hydrogen give out its 486 nm line.',
      widget,
      table: opticsTable({
        pieces: [lad.electron],
        fixtures: [lad.fixture, linesStrip('made', 'Lines made', { x: 92, y: 14 }, 'lad', { size: { w: 66, h: 24 }, list: false })],
        zones: { slots: lad.slots }
      }),
      foes: EATER_FOE,
      encounter: {
        species: 'the lantern-eater',
        act: 'Trace Line',
        intent: 'The eater drinks the lamp\'s glow, one coloured line at a time.',
        hit: 'The eater loses the line it was feeding on and scatters into cold aurora.'
      },
      hints: [
        'Drag the electron up to a higher rung, then drop it onto a lower one, and watch the strip.',
        'Compare the wavelength of the line each drop gives out with the one the eater lamp gives out.',
        'Drop the electron from each higher rung in turn, and keep the drop whose line the strip prints as 486 nm.'
      ],
      check(state) {
        const l = ladderRead(state.table, 'lad').last;
        if (!l) return { ok: false, notYet: true, msg: 'Move the electron to another rung.' };
        if (l.up || l.nm == null) return { ok: false, msg: 'Light is given out when an electron drops, so the move must run from a higher rung to a lower one.' };
        if (Math.abs(l.nm - LADDER_LINE) < 1) return { ok: true };
        return { ok: false, msg: 'The last line made is not the eater lamp\'s: read each line\'s wavelength on the strip, because two lines can look alike.' };
      },
      reward: {
        title: 'One Line, One Drop',
        body: 'Every line in a spectrum is one drop between two energy levels, and the bigger the drop, the shorter the wavelength of the light. The same drop always makes the same line.',
        log: 'The 486 nm line is one particular drop between two levels.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 24 }, { lamp: true, brightness: CELL_BRIGHT });
    const holder = cell.slots[0];
    return {
      id: 'phase2',
      title: 'Phase 2 · The Cesium Shell',
      prompt: 'Put the lamp that frees electrons from the eater\'s cesium plate at the lowest speed in the marked place.',
      widget,
      table: opticsTable({
        pieces: [
          metalPlate('cs', 'Cesium', holder.at, 'Cs', { fixed: true, zone: `slot:${holder.id}` }),
          ...LAMPS.map(([id, label, nm], i) => lamp(id, label, { x: 22 + i * 28, y: 55 }, nm))
        ],
        fixtures: [cell.fixture],
        zones: { slots: [...cell.slots, { id: 'slowest', label: 'Frees them slowest', at: { x: 124, y: 40 }, size: { w: 30, h: 14 } }] }
      }),
      foes: EATER_FOE,
      encounter: {
        species: 'the lantern-eater',
        act: 'Match Light',
        intent: 'The eater\'s shell clings to its electrons and gives them up only to the right light.',
        hit: 'The shell gives way and the eater\'s glow drains into the ice.'
      },
      hints: [
        'Drag a lamp into the lamp slot and read the speed meter under the tube.',
        'Compare the speed readings across the three lamps rather than the counter.',
        'Look for the lamp whose speed reading is the smallest one above zero.'
      ],
      check(state) {
        const t = state.table;
        const held = Object.values(t.pieces).find(p => p.kind === 'lamp' && p.zone === 'slot:slowest');
        if (!held) return { ok: false, notYet: true, msg: 'Put a lamp in the marked place.' };
        const lowest = LAMPS.map(l => l[2]).filter(nm => planPhotocell('Cs', nm, CELL_BRIGHT).freed).sort((p, q) => speedOf(p) - speedOf(q))[0];
        if (held.props.nm === lowest) return { ok: true };
        return { ok: false, msg: 'Put each lamp in the lamp slot and compare the speed meter before you choose: that lamp frees faster electrons than another does.' };
      },
      reward: {
        title: 'Spare Energy Becomes Speed',
        body: 'A photon pays the plate\'s work function to free an electron, and whatever energy is left over becomes the electron\'s speed. Light only just above the threshold frees electrons slowly.',
        log: 'Photons close to the threshold free the slowest electrons.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 34, y: 32 }, { pre: rackFor(4), locked: true });
    return {
      id: 'phase3',
      title: 'Phase 3 · The Magnet Shield',
      prompt: 'Set the marker to how many electrons in an oxygen atom stand alone in a box.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, hand('up', 'up', { x: 76, y: 8 }), hand('down', 'down', { x: 92, y: 8 }), hand('lift', 'lift', { x: 108, y: 8 })],
        fixtures: [
          rack.fixture,
          magnet('msample', { x: 88, y: 46 }, { sample: 'O' }),
          magnet('mrack', { x: 123, y: 46 }, { rack: 'rack' }),
          shellsMarker('alone', 'Alone in a box', { x: 96, y: 21 }, { min: 0, max: 8, step: 1, value: 0, size: { w: 40, h: 12 }, title: 'Oxygen' })
        ]
      }),
      foes: EATER_FOE,
      encounter: {
        species: 'the lantern-eater',
        act: 'Test Pull',
        intent: 'The eater hides behind a field that tugs at lone electrons.',
        hit: 'The field fails and the eater is left bare in the dark.'
      },
      hints: [
        'Press "Test Sample" to see how hard oxygen is pulled, then place four electrons in the p row and press "Test Rack".',
        'Compare the rack\'s pull with the sample\'s, and read how many electrons the board says stand alone.',
        'Count the electrons standing alone in their boxes on the rack that pulls exactly as hard as the sample.'
      ],
      check(state) {
        const v = state.table.fixtures.alone.dials.n.value;
        if (!v) return { ok: false, notYet: true, msg: 'Set the marker to the number you found.' };
        if (v === MEASURED.O) return { ok: true };
        return { ok: false, msg: 'Match the rack\'s pull to the sample\'s pull, then count the electrons that stand alone on that rack.' };
      },
      reward: {
        title: 'Lone Electrons Feel the Magnet',
        body: 'Electrons that stand alone in a box are pulled by a magnet, and paired electrons cancel each other out. Electrons spread across a row before they pair up, which is Hund\'s rule.',
        log: 'The sample\'s pull matches a rack with the right number of lone electrons.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['x'], { model: 'build', axisLabel: 'BINDING ENERGY, MJ/mol' });
    return {
      id: 'phase4',
      title: 'Phase 4 · The Sealed Core',
      prompt: 'Build the atom whose peaks match the eater\'s sealed core.',
      widget,
      table: pesTable({
        pieces: [specimen('x', 'SEALED CORE', CORE, { x: 0, y: 0 }, { zone: `slot:${CHAMBER}.spec` })],
        fixtures: [ch.fixture, buildFixture('build', { x: 129, y: 44.2 }, { max: 13, label: 'Build an atom', size: { w: 30, h: 39 } })],
        zones: { slots: ch.slots }
      }),
      foes: EATER_FOE,
      encounter: {
        species: 'the lantern-eater',
        act: 'Read Peaks',
        intent: 'The eater keeps its core sealed so nobody can say what it is made of.',
        hit: 'The core is named, and the eater has nothing left to hide behind.'
      },
      hints: [
        'Press "Fire Light" on the sealed core, then turn the build\'s dials and watch the outlines over the strip.',
        'Compare the outlines the build makes with the piles on the strip, and what the heights add up to.',
        'A whole atom has as many electrons as protons, so build the one whose outlines cover every pile.'
      ],
      check(state) {
        const b = buildRead(state.table, 'build');
        if (!b.protons && !b.electrons) return { ok: false, notYet: true, msg: 'Build an atom with the dials.' };
        if (b.whole && b.sym === CORE) return { ok: true };
        if (!b.whole) return { ok: false, msg: 'The build has a different number of protons and electrons, so it is no whole atom: make them equal and compare the outlines.' };
        return { ok: false, msg: 'The outlines of that atom do not cover the sealed core\'s piles: add up the heights of every pile and try another.' };
      },
      reward: {
        title: 'Peaks Add Up to the Atom',
        body: 'The heights of all the peaks add up to the number of electrons, and in a neutral atom that is the atomic number. A spectrum can therefore name an atom nobody has labelled.',
        log: 'The peak heights summed to one atomic number.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const sp = spectro(SP, { x: 39, y: 22 }, { xAxis: 'conc', word: 'ABSORBANCE', label: 'Spectrometer' });
    return {
      id: 'phase5',
      title: 'Phase 5 · The Dimmed Cell',
      prompt: 'Set the marker to the concentration of the eater\'s sealed copper solution, in mmol/L.',
      widget,
      table: cuvetteTable({
        pieces: [
          cuvette('s1', 'STANDARD 1', { x: 14, y: 53 }, { drops: 0 }), cuvette('s2', 'STANDARD 2', { x: 36, y: 53 }, { drops: 0 }), cuvette('s3', 'STANDARD 3', { x: 58, y: 53 }, { drops: 0 }),
          cuvette('sealed', 'SEALED SAMPLE', { x: 80, y: 53 }, { conc: SEALED_CONC, sealed: true }),
          dropper('drop', { x: 106, y: 56 }), rinser('empty', { x: 126, y: 56 })
        ],
        fixtures: [
          sp.fixture,
          plaqueFixture('drop-note', 'One drop = 2 mmol/L', { x: 122, y: 29 }, [], { w: 50 }),
          markerFixture('conc', 'Sealed sample (mmol/L)', { x: 122, y: 42 }, { max: 12, step: 0.5, w: 44 })
        ],
        zones: { slots: sp.slots },
        tools: ['straightedge']
      }, { recorder: REC }),
      foes: EATER_FOE,
      encounter: {
        species: 'the lantern-eater',
        act: 'Measure Dim',
        intent: 'The eater dims the light that passes through the cell.',
        hit: 'The dimming is measured, and the eater has no shadow left to hide in.'
      },
      hints: [
        'Fill the standards with drops, slide each into the beam and press "Record", then put the sealed sample in the beam and read it.',
        'Lay the straightedge across the standards\' points and find where the sealed sample\'s reading falls along the line.',
        'Read across from the sealed reading to the line, then straight down to the concentration scale, and set the marker there.'
      ],
      check(state) {
        const v = markerRead(state.table, 'conc');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the concentration you read off the line.' };
        if (v === SEALED_CONC * 1000) return { ok: true };
        return { ok: false, msg: 'Follow the sealed sample\'s reading across to the line through the standards, then down to the concentration scale.' };
      },
      reward: {
        title: 'Dimming Measures Amount',
        body: 'Standards of known concentration make a line of absorbance against concentration, and an unknown solution is read back off that line. More dissolved copper dims the light more.',
        log: 'The sealed solution\'s absorbance sat on the standards\' line.'
      }
    };
  })()
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct
   actions, by drag and by two taps. An electron is dragged from rung to rung, lamps are tried in their slot and one put in a
   place, arrows are dealt on boxes, the light is fired and dials are turned, cuvettes are filled and recorded. Nothing here
   says which rung, lamp or element it is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const rung = n => put('lad.e', `slot:lad.r${n}`);
const tryLamp = id => put(id, 'slot:cell.lamp');
const on = (piece, row, idx) => put(piece, `piece:${boxPieceId('rack', row, idx)}`);
const drops = (id, n) => Array.from({ length: n }, () => ({ join: ['drop', id] }));
const read = id => [put(id, BEAM), { run: SP }];

/** The bench state that solves each phase, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [rung(4), rung(2)],
  [tryLamp('a'), tryLamp('b'), tryLamp('c'), put('a', 'slot:slowest')],
  [{ run: 'msample' }, on('up', '2p', 0), on('up', '2p', 1), on('up', '2p', 2), on('down', '2p', 0), { run: 'mrack' }, dial('alone', 'n', 2)],
  [{ run: CHAMBER }, dial('build', 'protons', 10), dial('build', 'electrons', 10)],
  [
    ...drops('s1', 2), ...drops('s2', 3), ...drops('s3', 4), ...read('s1'), ...read('s2'), ...read('s3'),
    { lay: { kind: 'straightedge', through: [0, 2] } }, ...read('sealed'), dial('conc', 'value', 7)
  ]
];

/** A plausible wrong answer per phase. Each must be refused, and must say why. */
export const MISSES = [
  [rung(3), rung(2)],
  [tryLamp('b'), put('b', 'slot:slowest')],
  [on('up', '2p', 0), on('up', '2p', 1), on('up', '2p', 2), on('down', '2p', 0), dial('alone', 'n', 4)],
  [{ run: CHAMBER }, dial('build', 'protons', 9), dial('build', 'electrons', 9)],
  [
    ...drops('s1', 2), ...drops('s2', 3), ...drops('s3', 4), ...read('s1'), ...read('s2'), ...read('s3'),
    { lay: { kind: 'straightedge', through: [0, 2] } }, ...read('sealed'), dial('conc', 'value', 6)
  ]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export const DEBRIEF = {
  speaker: 'Vess',
  clueAwarded: 'clue_lantern_lens',
  sections: [
    {
      heading: 'What You Found',
      body: 'The Lantern-Eater has collapsed into shimmering ice. Among its remnants lies a precision lens ground from fluorite, proof that high-energy optics were deliberately deployed here.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase tested a core quantum phenomenon: quantized spectral lines, photoelectric work functions, Hund\'s rule paramagnetism, core PES energies, and Beer-Lambert absorbance.'
    },
    {
      heading: 'Next',
      body: 'The lens is catalogued in your Case File. Across the fog, the crystal lattices of Ligar rise, held together by the very electron pairs you have mapped.'
    }
  ]
};

export const PRACTICE = [
  {
    id: 'p1',
    question: 'Which electronic transition in a hydrogen atom emits a photon in the visible Balmer series?',
    options: [
      { id: 'a', label: 'n = 3 to n = 2' },
      { id: 'b', label: 'n = 1 to n = 2' },
      { id: 'c', label: 'n = 4 to n = 1' }
    ],
    answer: 'a',
    explanation: 'The Balmer series consists of transitions ending at n = 2, producing visible light such as the red 656 nm line from n = 3 to n = 2.'
  },
  {
    id: 'p2',
    question: 'In a photoelectric effect experiment, what determines whether electrons are ejected from a metal surface?',
    options: [
      { id: 'a', label: 'The frequency of the incident light must exceed the threshold frequency' },
      { id: 'b', label: 'The intensity of the light must exceed a threshold brightness' },
      { id: 'c', label: 'The light beam must be polarized parallel to the surface' }
    ],
    answer: 'a',
    explanation: 'Each photon must carry energy E = hf greater than the metal\'s work function; intensity only increases the number of ejected electrons, not their individual energy.'
  },
  {
    id: 'p3',
    question: 'How many unpaired electrons are present in an isolated neutral nitrogen atom (Z = 7)?',
    options: [
      { id: 'a', label: '3' },
      { id: 'b', label: '1' },
      { id: 'c', label: '0' }
    ],
    answer: 'a',
    explanation: 'Nitrogen has the configuration 1s² 2s² 2p³. By Hund\'s rule, the three 2p electrons each occupy separate degenerate orbitals with parallel spins.'
  },
  {
    id: 'p4',
    question: 'In photoelectron spectroscopy (PES), why does the 1s peak of neon appear at a much higher binding energy than that of oxygen?',
    options: [
      { id: 'a', label: 'Neon has a higher nuclear charge (10 protons vs. 8 protons)' },
      { id: 'b', label: 'Neon has more valence electrons shielding the core' },
      { id: 'c', label: 'Neon atoms are smaller and lighter than oxygen atoms' }
    ],
    answer: 'a',
    explanation: 'A greater nuclear charge exerts a stronger Coulombic attraction on core electrons, requiring more energy to eject them.'
  },
  {
    id: 'p5',
    question: 'A solution in a 1.0 cm cuvette has an absorbance of 0.60. If the path length is doubled to 2.0 cm with concentration unchanged, what is the new absorbance?',
    options: [
      { id: 'a', label: '1.20' },
      { id: 'b', label: '0.30' },
      { id: 'c', label: '0.60' }
    ],
    answer: 'a',
    explanation: 'By the Beer-Lambert law (A = εbc), absorbance is directly proportional to path length b; doubling b doubles A from 0.60 to 1.20.'
  }
];

/* ------------------------------------------------------------------
   MOUNT
   ------------------------------------------------------------------ */

export function mount(container, ctx) {
  // Clearing the last phase files the clue. The boss pays no XP, so this is not a rail.
  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };

  const runner = createRunner(container, bossCtx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { planPhotocell, planAbsorb, rackPull, readOf, MEASURED, LAMPS, CELL_BRIGHT, LADDER_LINE, CORE };
