/**
 * Unit 12 · Boss — The Coil (boss-coil)
 *
 * The Fifth's sorting magnet at the end of Lodestone's iron canyon, on the lode kit. Five phases re-testing each bench's core idea on a
 * fresh case: ion configurations, ionization jumps, complex-ion charges, complementary colour, and magnetic pull. Clearing the last phase
 * files `clue_lodestone_coil`. Pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import {
  lodeTable, dshellFixture, dshellRead, iestripFixture, iestripRead,
  specFixture, wheelFixture, wheelRead, magnetFixture, vial, numCard, plaqueFixture
} from '../../table/kits/lode.js';
import { BANDS } from '../../engine/lodedata.js';
import { markFights } from '../../table/near.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit12/q1-dblock',
  'unit12/q2-charges',
  'unit12/q3-complex',
  'unit12/q4-shapes',
  'unit12/q5-colour',
  'unit12/q6-spin'
];

export const CLUE_ID = 'clue_lodestone_coil';
const SPEAKER = 'Vess';
const COIL_FOE = [{ id: 'coil', label: 'The Coil' }];
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

export const STAGES = [
  /* ---------------------------------------------------------------- 1: The Ion */
  (() => {
    const L = dshellFixture('ladder', { x: 64, y: 29 }, { mode: 'remove', el: 'Mn', test: true, w: 94, h: 48, title: 'Manganese, losing electrons' });
    return {
      id: 'p1-ion',
      title: 'Phase 1 · The Ion',
      prompt: 'Remove two electrons from manganese to make Mn²⁺.',
      widget,
      table: lodeTable({ pieces: [], fixtures: [L.fixture] }),
      foes: COIL_FOE,
      encounter: { species: 'the coil', act: 'Weaken', intent: 'The Coil pulls on unpaired electrons, so strip Mn down to Mn²⁺ to match its field.' },
      hints: [
        'Watch which level sits highest once manganese takes a positive charge.',
        'At +1 and above, the 4s orbital sits higher in energy than 3d.',
        'Remove electrons from the highest level first until the charge is +2.'
      ],
      check(state) {
        const r = dshellRead(state.table, 'ladder');
        if (r.charge !== 2) return { ok: false, notYet: true, msg: `The charge is ${r.charge > 0 ? `+${r.charge}` : r.charge}. Remove electrons until it reaches +2.` };
        if (r.occ[0] === 0 && r.occ.slice(1).every(x => x === 1)) return { ok: true };
        return { ok: false, msg: 'An electron is still in 4s while a 3d orbital is empty. In an ion, 4s is higher in energy than 3d.' };
      },
      reward: {
        log: 'Phase 1: Mn²⁺ is 3d⁵.',
        title: 'Phase 1 Cleared: Mn²⁺',
        body: 'Both 4s electrons leave first, leaving Mn²⁺ with five unpaired 3d electrons.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2: The Charges */
  (() => {
    const S = iestripFixture('ie', { x: 64, y: 20 }, { el: 'V', sealed: true, n: 7, w: 108, h: 34, title: 'Successive removals (sealed sample)' });
    return {
      id: 'p2-charges',
      title: 'Phase 2 · The Charges',
      prompt: 'What is the highest oxidation state this sealed metal reaches before ionization energy jumps?',
      widget,
      table: lodeTable({
        pieces: ['+3', '+4', '+5', '+6'].map((lbl, i) => numCard(`n-${lbl.slice(1)}`, lbl, { x: 18 + i * 20, y: 49 }, Number(lbl))),
        fixtures: [S],
        zones: { slots: [{ id: 'answer', label: 'Highest oxidation state', at: { x: 118, y: 49 }, size: { w: 28, h: 16 } }] }
      }),
      foes: COIL_FOE,
      encounter: { species: 'the coil', act: 'Pulse', intent: 'The Coil measures how many outer electrons leave before the inner shell.' },
      hints: [
        'Press "Remove an Electron" until the bar height jumps sharply.',
        'Count how many electrons left before the jump into the inner shell.',
        'The highest oxidation state equals the number of outer electrons removed before the jump.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a number card in the slot.' };
        if (card.id === 'n-5') return { ok: true };
        return { ok: false, msg: 'Find the sharp jump between bars on the strip and count how many electrons left before it.' };
      },
      reward: {
        log: 'Phase 2: vanadium reaches +5.',
        title: 'Core Jump Read',
        body: 'Five outer electrons leave in steady steps before the jump into the inner 3p shell, so vanadium reaches +5.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3: The Whole */
  {
    id: 'p3-whole',
    title: 'Phase 3 · The Whole',
    prompt: 'What is the overall charge of a complex made of Co³⁺, five NH₃, and one Cl−?',
    entry: { id: 'charge', label: 'Complex charge', unit: '' },
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        plaqueFixture('spec', 'Complex ion', { x: 64, y: 26 }, [
          'Metal ion: Co³⁺ (+3)',
          'Ligands: 5 × NH₃ (0 each), 1 × Cl− (−1)',
          'Type the overall charge below'
        ], { w: 88 })
      ]
    }),
    foes: COIL_FOE,
    encounter: { species: 'the coil', act: 'Bind', intent: 'The Coil binds six ligands around cobalt(III).' },
    hints: [
      'Add the metal ion\'s charge and the charges of all six ligands.',
      'NH₃ is neutral (0); Cl− carries a charge of −1.',
      'Combine +3 from Co³⁺ with −1 from the single Cl−.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'charge');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Enter the overall charge of the complex ion.' };
      if (Math.abs(val - 2) < 0.05) return { ok: true };
      return { ok: false, msg: 'Add +3 for Co³⁺ and −1 for Cl−; the five NH₃ ligands are neutral.' };
    },
    reward: {
      log: 'Phase 3: [Co(NH₃)₅Cl]²⁺ has charge +2.',
      title: 'Charge Balanced',
      body: 'Five neutral NH₃ molecules and one Cl− ion around Co³⁺ give [Co(NH₃)₅Cl]²⁺, with an overall charge of +2.'
    }
  },

  /* ---------------------------------------------------------------- 4: The Colour */
  (() => {
    const S = specFixture('spec', { x: 46, y: 29 }, { w: 78, h: 42, fixed: 'co-nh3' });
    const W = wheelFixture('wheel', { x: 108, y: 31 }, { size: 34, taps: true });
    return {
      id: 'p4-colour',
      title: 'Phase 4 · The Colour',
      prompt: 'Which colour does [Co(NH₃)₆]³⁺ look when it absorbs the dark colour on the strip?',
      widget,
      table: lodeTable({ pieces: [], fixtures: [S.fixture, W] }),
      foes: COIL_FOE,
      encounter: { species: 'the coil', act: 'Filter', intent: 'The Coil shines white light through the cobalt(III) drum.' },
      hints: [
        'Find which colour is dark on the strip, then locate it on the colour wheel.',
        'The colour a solution looks sits directly opposite the colour it absorbs on the wheel.',
        'Look directly across the wheel from the dark colour on the strip.'
      ],
      check(state) {
        const picked = wheelRead(state.table, 'wheel');
        if (!picked) return { ok: false, notYet: true, msg: 'Tap a colour on the wheel.' };
        if (picked === 'orange') return { ok: true };
        return { ok: false, msg: `The strip shows blue light is absorbed, and ${picked} is not opposite blue on the wheel.` };
      },
      reward: {
        log: 'Phase 4: blue absorbed, orange seen.',
        title: 'Complementary Match',
        body: 'Absorbing blue light leaves its complementary colour, orange (yellow-orange), on the colour wheel.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5: The Pull */
  (() => {
    const M = magnetFixture('mag', { x: 76, y: 20 }, { w: 70, h: 34 });
    return {
      id: 'p5-pull',
      title: 'Phase 5 · The Pull',
      prompt: 'Which iron(III) complex is pulled harder by the Coil\'s magnet?',
      widget,
      table: lodeTable({
        pieces: [
          vial('v-fe3-aq', 'fe3-aq', { x: 20, y: 49 }, { name: 'Fe(H₂O)₆³⁺' }),
          vial('v-fe3-cn', 'fe3-cn', { x: 44, y: 49 }, { name: 'Fe(CN)₆³−' })
        ],
        fixtures: [M.fixture],
        zones: { slots: [M.slot, { id: 'answer', label: 'Pulled harder', at: { x: 124, y: 46 }, size: { w: 28, h: 16 } }] }
      }),
      foes: COIL_FOE,
      encounter: { species: 'the coil', act: 'Shut Down', intent: 'The Coil swings toward whichever complex has more unpaired electrons.' },
      hints: [
        'Test both vials in the Magnet balance and press "Switch On".',
        'Both hold Fe³⁺ (d⁵), but water makes a narrow gap while cyanide makes a wide gap.',
        'High-spin Fe³⁺ has five unpaired electrons, while low-spin Fe³⁺ has only one.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place the more strongly pulled vial in the slot.' };
        if (card.id === 'v-fe3-aq') return { ok: true };
        return { ok: false, msg: 'Test both vials on the Magnet balance and compare their pull bars.' };
      },
      reward: {
        log: 'Phase 5: [Fe(H₂O)₆]³⁺ pulls harder; the Coil is shut down.',
        title: 'The Coil Silenced',
        body: 'Water\'s narrow gap leaves all five d electrons of Fe³⁺ unpaired, pulling far harder than cyanide\'s low-spin complex. The Coil powers down.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  clue: CLUE_ID,
  sections: [{
    heading: 'The Coil Shut Down',
    body: 'Every drum in the canyon is accounted for: 4s electrons leave before 3d, core jumps reveal oxidation states, and ligands control coordination number, colour, and spin. A decoded relay chip from the Coil points straight to Cinder Halo.'
  }]
};

const put = (piece, to) => ({ place: { piece, to } });
const box = (i, v) => ({ setDial: { fixture: 'ladder', dial: `b${i}`, value: v } });
const band = id => BANDS.findIndex(b => b.id === id) + 1;

export const SOLUTIONS = [
  [box(0, 0), { run: 'ladder' }],
  [{ run: 'ie' }, { run: 'ie' }, { run: 'ie' }, { run: 'ie' }, { run: 'ie' }, { run: 'ie' }, put('n-5', 'slot:answer')],
  [{ type: { entry: 'charge', value: '+2' } }],
  [{ setDial: { fixture: 'wheel', dial: 'colour', value: band('orange') } }],
  [put('v-fe3-aq', 'slot:mag.holder'), { run: 'mag' }, put('v-fe3-aq', 'slot:answer')]
];

export const MISSES = [
  [box(1, 0), box(2, 0)],
  [put('n-4', 'slot:answer')],
  [{ type: { entry: 'charge', value: '+3' } }],
  [{ setDial: { fixture: 'wheel', dial: 'colour', value: band('blue') } }],
  [put('v-fe3-cn', 'slot:answer')]
];

function blankState() { return {}; }
export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

markFights(STAGES);
