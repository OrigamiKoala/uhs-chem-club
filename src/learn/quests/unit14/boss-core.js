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
import { applyNotes } from '../../table/notes.js';
import {
  nukeTable, ncountFixture, keptCount, nsrc, nshield, nchoiceFixture, chosenIndex, nnucFixture, nchartFixture, chartPick, pickValue,
  ndecayFixture, nscaleFixture, plaqueFixture
} from '../../table/kits/nuke.js';
import { commas } from '../../table/kits/nuke-draw.js';
import { nameOf } from '../../engine/nucdata.js';

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
      briefing: { speaker: SPEAKER, body: 'The Core keeps three cans by its vents, one baking, one at deck temperature, one frozen. Only one holds a radioactive sample.' },
      prompt: 'Which of the Core\'s three vented cans holds a radioactive sample?',
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
        'Compare each can\'s count with the counter\'s background.',
        'A can\'s temperature can come from the vents; a decaying nucleus counts the same at any temperature.'
      ],
      check(state) {
        const card = inSlot(state, 'hot');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a can\'s card in the slot.' };
        if (card.id === 'can-c') return { ok: true };
        const c = keptCount(state.table, card.id);
        return { ok: false, msg: c != null ? `${card.label} counted ${commas(c)}, about the background.` : `${card.label} has not been counted.` };
      },
      reward: { log: 'Phase 1: the frozen can, C, is the radioactive one.', title: 'Found Frozen', body: 'Can C, the frozen one: it counted far above the background. The cold did nothing to slow its nuclei.' }
    };
  })(),

  /* ---------------------------------------------------------------- 2: The Leaking Cask */
  (() => {
    const R = ncountFixture('rig', { x: 76, y: 30 }, { shields: true, w: 56, h: 40 });
    return {
      id: 'p2-cask',
      title: 'Phase 2 · The Leaking Cask',
      prompt: 'Which radiations does the Core\'s leaking cask give off?',
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
        'Count the cask open, then behind each shield.',
        'See which shield takes the biggest bite out of the count, and what each leaves behind.',
        'Paper stops alpha, aluminium stops beta, and only thick lead slows gamma.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
        if (pick === 2) return { ok: true };
        const n = sh => keptCount(state.table, 'cask', { shield: sh });
        if (pick === 1) return { ok: false, msg: n('open') != null && n('paper') != null ? `Paper took the cask only from ${commas(n('open'))} to ${commas(n('paper'))}.` : 'The cask has not been counted open and behind paper.' };
        return { ok: false, msg: n('aluminium') != null ? `Behind aluminium the cask still counted ${commas(n('aluminium'))}.` : 'The cask has not been counted behind aluminium.' };
      },
      reward: { log: 'Phase 2: the cask gives off beta and gamma.', title: 'Cask Sealed', body: 'Beta and gamma: paper barely changed the count, aluminium took most of it, and what was left went on into the lead.' }
    };
  })(),

  /* ---------------------------------------------------------------- 3: The Coolant */
  {
    id: 'p3-coolant',
    title: 'Phase 3 · The Coolant',
    prompt: 'Which nucleus is left when sodium-24 in the Core\'s coolant gives off a beta particle?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nnucFixture('nuc', { x: 36, y: 34 }, { Z: 11, N: 13, mode: 'beta', hideAfter: true, w: 64, h: 50, title: 'Sodium-24' }),
        nchartFixture('chart', { x: 96, y: 38 }, { z: [9, 14], n: [10, 15], marks: [{ Z: 11, N: 13, label: '' }], eq: { parent: { Z: 11, A: 24 }, particle: { A: 0, Z: '−1', sym: 'e' } }, w: 56, h: 46 })
      ]
    }),
    foes: FOE,
    encounter: { species: 'the core', act: 'Drain Coolant', intent: 'The Core\'s sodium coolant has turned radioactive in its neutrons.' },
    hints: [
      'Press "Watch the Nucleus", then tap a square on the chart.',
      'Watch which of the nucleus\'s particles changes, and count the protons before and after.',
      'The electron carries −1 and almost no mass, so balance both numbers with that.'
    ],
    check(state) {
      const pk = chartPick(state.table, 'chart');
      if (!pk) return { ok: false, notYet: true, msg: 'Tap a square on the chart.' };
      if (pk.Z === 12 && pk.N === 12) return { ok: true };
      if (pk.Z + pk.N !== 24) return { ok: false, msg: `On the right the mass numbers add to ${pk.Z + pk.N}; on the left, 24.` };
      return { ok: false, msg: `On the right the atomic numbers add to ${pk.Z - 1}; on the left, 11.` };
    },
    reward: { log: 'Phase 3: sodium-24 becomes magnesium-24.', title: 'Coolant Drained', body: 'Magnesium-24: a neutron became a proton, so the mass number stayed 24 and the atomic number rose to 12.' }
  },

  /* ---------------------------------------------------------------- 4: The Burned-Out Source */
  {
    id: 'p4-source',
    title: 'Phase 4 · The Burned-Out Source',
    prompt: 'The Core\'s cobalt-60 source counted 3,200 per minute when sealed: how many years until it counts 400?',
    widget,
    entry: { id: 'years', label: 'Years', unit: 'years' },
    table: nukeTable({
      pieces: [],
      fixtures: [
        ndecayFixture('grid', { x: 62, y: 34 }, { grids: [{ N0: 256, seed: 19, label: 'Cobalt-60' }], half: 5.27, unit: 'year', step: 1, max: 10, plot: 'count', rate: 3200, title: 'The source', w: 112, h: 56 }),
        plaqueFixture('ref', 'Cobalt-60', { x: 137, y: 46 }, ['t½ 5.27 years'], { w: 22 })
      ]
    }),
    foes: FOE,
    encounter: { species: 'the core', act: 'Spend Source', intent: 'The Core runs its sensors on a cobalt-60 source that is wearing out.' },
    hints: [
      'Move the clock on year by year and watch the count rate.',
      'Compare 400 with 3,200: how many times smaller is it?',
      'Each halving of the count takes one half-life.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'years');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the number of years.' };
      if (v >= 15.5 && v <= 16.1) return { ok: true };
      return { ok: false, msg: `After ${v} years the source would count ${commas(3200 * Math.pow(2, -v / 5.27))} per minute.` };
    },
    reward: { log: 'Phase 4: 3,200 to 400 in three half-lives, 15.8 years.', title: 'Source Spent', body: '15.8 years: 3,200 halves to 1,600, 800, then 400, three half-lives of 5.27 years.' }
  },

  /* ---------------------------------------------------------------- 5: The Core Itself */
  {
    id: 'p5-core',
    title: 'Phase 5 · The Core Itself',
    prompt: 'How much energy, in MeV, does one fission of uranium-235 into barium-141, krypton-92 and three neutrons give out?',
    widget,
    entry: { id: 'mev', label: 'Energy, MeV', unit: 'MeV' },
    table: nukeTable({
      pieces: [],
      fixtures: [
        nscaleFixture('scale', { x: 60, y: 36 }, { left: 'U235-fuel', right: 'U235-split', leftLabel: 'Uranium-235 + a neutron', rightLabel: 'Barium + krypton + 3 neutrons', w: 108, h: 50 }),
        plaqueFixture('ref', 'Mass as energy', { x: 135, y: 46 }, ['1 u = 931.5 MeV'], { w: 26 })
      ]
    }),
    foes: FOE,
    encounter: { species: 'the core', act: 'Shut Down', intent: 'The Core splits uranium with its rods drawn out.' },
    hints: [
      'Read both pans of the balance.',
      'Find how much mass goes missing in the split.',
      'Turn the missing mass into energy with the plate, as you did for helium-4.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'mev');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the energy in MeV.' };
      if (v >= 172 && v <= 175) return { ok: true };
      if (v < 1) return { ok: false, msg: `${v} is the missing mass in u; the plate turns u into MeV.` };
      if (v > 10000) return { ok: false, msg: 'That turns a whole pan\'s mass into energy, not the part that goes missing.' };
      return { ok: false, msg: `${v} MeV is the energy of ${(v / 931.5).toFixed(6)} u; the pans differ by another amount.` };
    },
    reward: { log: 'Phase 5: one fission gives out 173 MeV.', title: 'Rods Home', body: 'About 173 MeV: 0.186 u goes missing in each fission. With the rods dropped home, each fission causes less than one more, and the Core goes quiet.' }
  }
];

applyNotes(STAGES, { 3: ['Press "Watch the Nucleus"; tap a square on the chart.'] });

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'The Core Is Down', body: 'Its sample, its cask, its coolant, its source and its fuel each answered to an idea you worked out on the benches.' }]
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
  [put('cask', S), run('rig'), put('sh-paper', SH), run('rig'), put('sh-al', SH), run('rig'), choose(2)],
  [run('nuc'), tap(12, 12)],
  [...clock(6), typed('years', 15.8)],
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
