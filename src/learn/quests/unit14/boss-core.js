/**
 * Unit 14 · Boss — The Transmutation Core (boss-core)
 *
 * The Fifth's reactor on the great crater's floor, on the nuke kit. Five phases, each a new case of an idea a bench already taught, never a
 * new one: the counter finds the radioactive can whatever its temperature (bench 1), shields tell what a leaking cask gives off (bench 2),
 * a beta decay balanced on the chart (bench 3), the years until a source has fallen to an eighth (bench 5), and the energy of one fission
 * from the balance (bench 6). The Core watches from the top-right corner of the table (x ≥ 126.5, y ≤ 23.5), which nothing on the table
 * uses. Clearing the last phase files `clue_cinderhalo_core`. Pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import {
  nukeTable, ncountFixture, keptCount, nsrc, nshield, nchoiceFixture, chosenIndex, nnucFixture, nchartFixture, chartPick, pickValue,
  ndecayFixture, nscaleFixture, plaqueFixture
} from '../../table/kits/nuke.js';
import { commas } from '../../table/kits/nuke-draw.js';
import { nameOf } from '../../engine/nucdata.js';
import { markFights } from '../../table/near.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = ['unit14/q1-still-warm', 'unit14/q2-what-comes-off', 'unit14/q3-equations', 'unit14/q4-stability', 'unit14/q5-half-gone', 'unit14/q6-shortfall'];

export const CLUE_ID = 'clue_cinderhalo_core';
const SPEAKER = 'Vess';
const FOE = [{ id: 'core', label: 'The Transmutation Core' }];
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;

/** Slips a student makes on the typed phases, each refused with a reason. */
export const SLIPS = { 4: [10.5, 21.1, 3, 8, 5.27], 5: [0.186, 219000, 1.73, 931.5, 28.3] };

export const STAGES = [
  /* ---------------------------------------------------------------- 1: The Vented Cans */
  (() => {
    const R = ncountFixture('rig', { x: 88, y: 34 }, { w: 76, h: 44 });
    return {
      id: 'p1-cans',
      title: 'Phase 1 · The Vented Cans',
      briefing: { speaker: SPEAKER, body: 'The Core keeps three cans near its vents. Only one holds a radioactive sample.' },
      prompt: 'Which of the three vented cans holds a radioactive sample?',
      widget,
      table: nukeTable({
        pieces: [
          nsrc('can-a', 'oreFe', { x: 12, y: 10 }, { text: 'Can A', temp: 300 }),
          nsrc('can-b', 'oreFe', { x: 12, y: 26 }, { text: 'Can B', temp: 20 }),
          nsrc('can-c', 'oreU', { x: 12, y: 42 }, { text: 'Can C', temp: -40 })
        ],
        fixtures: [R.fixture],
        zones: { slots: [R.slot, { id: 'hot', label: 'Radioactive', at: { x: 39, y: 52 }, size: { w: 19, h: 12 } }] }
      }),
      foes: FOE,
      encounter: { species: 'the core', act: 'Find Sample', intent: 'The Core hides its radioactive sample among cans at three temperatures.' },
      hints: [
        'Count each can on the counter.',
        'Compare each can\'s count rate with background.',
        'Vent heat changes a can\'s temperature, not how fast a radioactive nucleus decays.'
      ],
      check(state) {
        const card = inSlot(state, 'hot');
        if (!card) return { ok: false, notYet: true, msg: 'Drag a can card into the answer slot.' };
        if (card.id === 'can-c') return { ok: true };
        const c = keptCount(state.table, card.id);
        return { ok: false, msg: c != null ? `${card.label} counted ${commas(c)}, about the same as background.` : `${card.label} has not been counted yet.` };
      },
      reward: { log: 'Phase 1: the frozen can, C, is the radioactive one.', title: 'Found Frozen', body: 'Can C, the frozen one, counted far above background. Cold does not slow nuclear decay.' }
    };
  })(),

  /* ---------------------------------------------------------------- 2: The Leaking Cask */
  (() => {
    const R = ncountFixture('rig', { x: 76, y: 30 }, { shields: true, w: 56, h: 40 });
    return {
      id: 'p2-cask',
      title: 'Phase 2 · The Leaking Cask',
      prompt: 'Which types of radiation does the leaking cask give off?',
      widget,
      table: nukeTable({
        pieces: [
          nsrc('cask', 'co60', { x: 12, y: 8 }, { text: 'The cask' }),
          nshield('sh-paper', 'paper', { x: 12, y: 24 }), nshield('sh-al', 'aluminium', { x: 12, y: 40 }), nshield('sh-pb', 'lead', { x: 12, y: 56 })
        ],
        fixtures: [R.fixture, nchoiceFixture('ans', 'The cask gives off', { x: 122, y: 46 }, { options: ['Alpha and gamma', 'Beta and gamma', 'Beta only'], w: 34 })],
        zones: { slots: [R.slot, R.shieldSlot] }
      }),
      foes: FOE,
      encounter: { species: 'the core', act: 'Seal Cask', intent: 'The Core\'s fuel cask leaks through its lid.' },
      hints: [
        'Count the cask with no shield, then behind paper, aluminium, and lead.',
        'Notice which shield drops the count sharply and what gets through each one.',
        'Paper stops alpha, aluminium stops beta, and only thick lead slows gamma.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
        const n = sh => keptCount(state.table, 'cask', { shield: sh });
        if (pick === 2) {
          if (n('lead') == null) return { ok: false, notYet: true, msg: 'Test the cask behind lead too to confirm what slows the remaining counts.' };
          return { ok: true };
        }
        if (pick === 1) return { ok: false, msg: n('open') != null && n('paper') != null ? `Paper only changed the count from ${commas(n('open'))} to ${commas(n('paper'))}, so there is no alpha.` : 'Count the cask open and behind paper first.' };
        return { ok: false, msg: n('aluminium') != null ? `Behind aluminium, the cask still counted ${commas(n('aluminium'))}, so something passes aluminium.` : 'Count the cask behind aluminium first.' };
      },
      reward: { log: 'Phase 2: the cask gives off beta and gamma.', title: 'Cask Identified', body: 'Beta and gamma: paper barely changed the count, aluminium blocked the beta particles, and thick lead slowed the gamma rays.' }
    };
  })(),

  /* ---------------------------------------------------------------- 3: The Coolant */
  {
    id: 'p3-coolant',
    title: 'Phase 3 · The Coolant',
    prompt: 'Which nucleus forms when sodium-24 in the coolant gives off a beta particle?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nnucFixture('nuc', { x: 34, y: 34 }, { Z: 11, N: 13, mode: 'beta', hideAfter: true, w: 62, h: 50, title: 'Sodium-24' }),
        nchartFixture('chart', { x: 96, y: 37 }, { z: [9, 14], n: [10, 15], marks: [{ Z: 11, N: 13, label: '' }], eq: { parent: { Z: 11, A: 24 }, particle: { A: 0, Z: '−1', sym: 'e' } }, w: 60, h: 48 })
      ]
    }),
    foes: FOE,
    encounter: { species: 'the core', act: 'Drain Coolant', intent: 'Neutrons from the Core turned its sodium coolant radioactive.' },
    hints: [
      'Press "Watch the Nucleus", then tap the resulting square on the chart.',
      'Watch which particle changes and count the protons before and after.',
      'A beta particle carries −1 charge and zero mass number, so balance both numbers.'
    ],
    check(state) {
      const pk = chartPick(state.table, 'chart');
      if (!pk) return { ok: false, notYet: true, msg: 'Tap a square on the chart.' };
      if (pk.Z === 12 && pk.N === 12) return { ok: true };
      if (pk.Z + pk.N !== 24) return { ok: false, msg: `The mass numbers do not balance: left is 24, right adds to ${pk.Z + pk.N}.` };
      return { ok: false, msg: `The atomic numbers do not balance: left is 11, right adds to ${pk.Z - 1}.` };
    },
    reward: { log: 'Phase 3: sodium-24 becomes magnesium-24.', title: 'Coolant Drained', body: 'Magnesium-24: a neutron turned into a proton, keeping the mass number at 24 and raising the atomic number to 12.' }
  },

  /* ---------------------------------------------------------------- 4: The Burned-Out Source */
  {
    id: 'p4-source',
    title: 'Phase 4 · The Core Sensor Source',
    prompt: 'How many years will it take the Core\'s cobalt-60 source to drop from 3,200 to 400 counts per minute?',
    widget,
    entry: { id: 'years', label: 'Years', unit: 'years' },
    table: nukeTable({
      pieces: [],
      fixtures: [
        ndecayFixture('grid', { x: 60, y: 34 }, { grids: [{ N0: 256, seed: 19, label: 'Cobalt-60' }], half: 5.27, unit: 'year', step: 1, bigStep: 5, max: 20, plot: 'count', rate: 3200, title: 'The source', w: 110, h: 56 }),
        plaqueFixture('ref', 'Cobalt-60', { x: 136, y: 46 }, ['t½ 5.27 years'], { w: 24 })
      ]
    }),
    foes: FOE,
    encounter: { species: 'the core', act: 'Time Source', intent: 'The Core runs its sensors on a cobalt-60 source that is decaying.' },
    hints: [
      'Advance the clock and watch the count rate drop toward 400.',
      'Count how many times 3,200 must halve to reach 400.',
      'Each halving takes one half-life of 5.27 years.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'years');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the number of years.' };
      if (v >= 15.5 && v <= 16.1) return { ok: true };
      return { ok: false, msg: `After ${v} years, the source would count ${commas(3200 * Math.pow(2, -v / 5.27))} per minute.` };
    },
    reward: { log: 'Phase 4: 3,200 to 400 in three half-lives, 15.8 years.', title: 'Three Half-Lives', body: '15.8 years: 3,200 halves three times (1,600, 800, 400), taking three half-lives of 5.27 years.' }
  },

  /* ---------------------------------------------------------------- 5: The Core Itself */
  {
    id: 'p5-core',
    title: 'Phase 5 · The Core Itself',
    prompt: 'How much energy, in MeV, does one fission of uranium-235 release?',
    widget,
    entry: { id: 'mev', label: 'Energy, MeV', unit: 'MeV' },
    table: nukeTable({
      pieces: [],
      fixtures: [
        nscaleFixture('scale', { x: 60, y: 31 }, { left: 'U235-fuel', right: 'U235-split', leftLabel: 'Uranium-235 + a neutron', rightLabel: 'Barium + krypton + 3 neutrons', showDiff: true, w: 108, h: 46 }),
        plaqueFixture('ref', 'Mass as energy', { x: 135, y: 42 }, ['1 u = 931.5 MeV'], { w: 26 })
      ]
    }),
    foes: FOE,
    encounter: { species: 'the core', act: 'Shut Down', intent: 'The Core splits uranium with its rods drawn out.' },
    hints: [
      'Read both pans and the mass difference on the balance.',
      'Find how much mass disappears when the nucleus splits.',
      'Multiply the missing mass by 931.5 MeV/u, just as you did for helium-4.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'mev');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the energy in MeV.' };
      if (v >= 172 && v <= 175) return { ok: true };
      if (v < 1) return { ok: false, msg: `${v} is the missing mass in u; multiply by 931.5 to convert u to MeV.` };
      if (v > 10000) return { ok: false, msg: 'That converts an entire pan\'s mass into energy, not just the missing mass.' };
      return { ok: false, msg: `${v} MeV equals ${(v / 931.5).toFixed(4)} u; check the mass difference on the balance.` };
    },
    reward: { log: 'Phase 5: one fission gives out 173 MeV.', title: 'One Fission', body: 'About 173 MeV: each uranium-235 fission loses 0.186 u of mass, converting it directly into energy.' }
  }
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'The Core Is Down', body: 'Every part of the Core followed the same nuclear rules you uncovered on the benches: decay rates, shielding, nuclear equations, half-life, and fission energy.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const run = id => ({ run: id });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const S = 'slot:rig.sample'; const SH = 'slot:rig.shield';
const clock = steps => Array.from({ length: steps }, (_, i) => ({ setDial: { fixture: 'grid', dial: 't', value: i + 1 } }));
const tap = (Z, N) => ({ setDial: { fixture: 'chart', dial: 'pick', value: pickValue(STAGES[2].table.fixtures.find(f => f.id === 'chart'), Z, N) } });

export const SOLUTIONS = [
  [put('can-a', S), run('rig'), put('can-c', S), run('rig'), put('can-c', 'slot:hot')],
  [put('cask', S), run('rig'), put('sh-paper', SH), run('rig'), put('sh-al', SH), run('rig'), put('sh-pb', SH), run('rig'), choose(2)],
  [run('nuc'), tap(12, 12)],
  [...clock(16), typed('years', 15.8)],
  [typed('mev', 173.3)]
];

export const MISSES = [
  [put('can-a', S), run('rig'), put('can-a', 'slot:hot')],
  [put('cask', S), run('rig'), put('sh-paper', SH), run('rig'), choose(1)],
  [run('nuc'), tap(10, 14)],
  [typed('years', 10.5)],
  [typed('mev', 0.186)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { nameOf };

markFights(STAGES);
