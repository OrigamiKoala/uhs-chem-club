/**
 * Unit 12 · Boss — The Coil (boss-coil)
 *
 * The Fifth's sorting magnet at the end of Lodestone's iron canyon, on the lode kit. Five phases re-testing each bench's core idea on a
 * fresh case: ion configurations, ionization jumps, complex-ion charges, complementary colour, and magnetic pull. Clearing the last phase
 * files `clue_lodestone_coil`. Pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  lodeTable, dshellFixture, dshellRead, iestripFixture, iestripRead,
  specFixture, wheelFixture, wheelRead, magnetFixture, vial, numCard, plaqueFixture
} from '../../table/kits/lode.js';
import { BANDS } from '../../engine/lodedata.js';

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
      encounter: { species: 'the coil', act: 'Weaken', intent: 'The Coil leans toward unpaired electrons; its stance is the ion charge.' },
      hints: [
        'Tap electrons on the ladder to remove them until the charge reads +2.',
        'At +1 and above, the 4s orbital sits higher in energy than 3d.',
        'Remove both 4s electrons and leave the five 3d electrons singly in their boxes.'
      ],
      check(state) {
        const r = dshellRead(state.table, 'ladder');
        if (r.charge !== 2) return { ok: false, notYet: true, msg: `Charge is ${r.charge > 0 ? `+${r.charge}` : r.charge}; remove electrons until it is +2.` };
        if (r.occ[0] === 0 && r.occ.slice(1).every(x => x === 1)) return { ok: true };
        return { ok: false, msg: 'An electron sits in 4s while a 3d orbital is empty; 4s sits above 3d in the ion.' };
      },
      reward: {
        log: 'Phase 1: Mn²⁺ is 3d⁵.',
        title: 'First Coil Unlocked',
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
      prompt: 'What is the highest oxidation state this sealed vanadium drum reaches before its core jumps?',
      widget,
      table: lodeTable({
        pieces: ['+3', '+4', '+5', '+6'].map((lbl, i) => numCard(`n-${lbl.slice(1)}`, lbl, { x: 18 + i * 20, y: 49 }, Number(lbl))),
        fixtures: [S],
        zones: { slots: [{ id: 'answer', label: 'Highest oxidation state', at: { x: 118, y: 49 }, size: { w: 28, h: 16 } }] }
      }),
      foes: COIL_FOE,
      encounter: { species: 'the coil', act: 'Pulse', intent: 'The Coil pulses with each successive ionization bar.' },
      hints: [
        'Press "Remove an Electron" until the bar jumps, then mark the jump and lay a card in the slot.',
        'Count how many electrons left before the jump into the inner shell.',
        'Vanadium has five outer electrons (4s² 3d³).'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a number card in the slot.' };
        if (card.id === 'n-5') return { ok: true };
        return { ok: false, msg: `Count the bars before the large jump on the strip: five electrons leave before the 3p core.` };
      },
      reward: {
        log: 'Phase 2: vanadium reaches +5.',
        title: 'Core Jump Read',
        body: 'Five outer electrons leave in steady steps before the jump into the 3p core, so vanadium reaches +5.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3: The Whole */
  {
    id: 'p3-whole',
    title: 'Phase 3 · The Whole',
    prompt: 'What is the overall charge of the complex ion [Co(NH₃)₅Cl] formed by Co³⁺ with five NH₃ and one Cl−?',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        plaqueFixture('spec', 'Complex [Co(NH₃)₅Cl]', { x: 64, y: 26 }, [
          'Metal ion: Co³⁺ (charge +3)',
          'Ligands: 5 × NH₃ (0 each), 1 × Cl− (−1)',
          'Type the overall charge below'
        ], { w: 88 })
      ],
      entries: [{ id: 'charge', label: 'Complex charge', placeholder: '+2', unit: '' }]
    }),
    foes: COIL_FOE,
    encounter: { species: 'the coil', act: 'Bind', intent: 'The Coil holds six ligand beads round cobalt(III).' },
    hints: [
      'Add the metal ion\'s charge and the charges of all six ligands.',
      'NH₃ is neutral (0); Cl− carries a charge of −1.',
      '+3 + 5(0) + (−1) = +2.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'charge');
      if (val == null) return { ok: false, notYet: true, msg: 'Type the charge of the complex ion.' };
      if (Math.abs(val - 2) < 0.05) return { ok: true };
      return { ok: false, msg: 'Add Co³⁺ (+3) and one Cl− (−1); the five NH₃ ligands are neutral.' };
    },
    reward: {
      log: 'Phase 3: [Co(NH₃)₅Cl]²⁺ has charge +2.',
      title: 'Charge Balanced',
      body: 'Five neutral NH₃ molecules and one Cl− ion around Co³⁺ give [Co(NH₃)₅Cl]²⁺, with overall charge +2.'
    }
  },

  /* ---------------------------------------------------------------- 4: The Colour */
  (() => {
    const S = specFixture('spec', { x: 46, y: 29 }, { w: 78, h: 42, fixed: 'co-nh3' });
    const W = wheelFixture('wheel', { x: 108, y: 31 }, { size: 34, taps: true });
    return {
      id: 'p4-colour',
      title: 'Phase 4 · The Colour',
      prompt: 'Which complementary colour on the wheel is seen when [Co(NH₃)₆]³⁺ takes out the dark colour on the strip?',
      widget,
      table: lodeTable({ pieces: [], fixtures: [S.fixture, W] }),
      foes: COIL_FOE,
      encounter: { species: 'the coil', act: 'Filter', intent: 'The Coil shines white light through the cobalt(III) drum.' },
      hints: [
        'Read which colour is dark on the strip, then tap the opposite colour on the wheel.',
        'The strip takes out blue light.',
        'Orange sits opposite blue on the six-colour wheel.'
      ],
      check(state) {
        const picked = wheelRead(state.table, 'wheel');
        if (!picked) return { ok: false, notYet: true, msg: 'Tap a colour on the wheel.' };
        if (picked === 'orange') return { ok: true };
        return { ok: false, msg: `The strip takes out blue light; ${picked} is not opposite blue on the wheel.` };
      },
      reward: {
        log: 'Phase 4: blue absorbed, orange seen.',
        title: 'Complementary Match',
        body: 'Taking out blue leaves its complement, orange (yellow-orange), on the colour wheel.'
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
        'Test both vials in the magnet holder and press "Switch On".',
        'Both complexes hold Fe³⁺ (d⁵), but water makes a narrow gap and cyanide makes a wide gap.',
        'High-spin Fe³⁺ leaves five unpaired electrons; low-spin leaves only one.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Lay the stronger-pulled vial in the slot.' };
        if (card.id === 'v-fe3-aq') return { ok: true };
        return { ok: false, msg: 'Cyanide pairs four of the five d electrons, leaving only one unpaired; water leaves all five unpaired.' };
      },
      reward: {
        log: 'Phase 5: [Fe(H₂O)₆]³⁺ pulls harder; the Coil is shut down.',
        title: 'The Coil Silenced',
        body: 'Water\'s narrow gap leaves all five d electrons of Fe³⁺ unpaired (high spin), giving a far stronger pull than cyanide\'s low-spin complex. With the Coil shut down, the canyon\'s manifest is clear.'
      }
    };
  })()
];

const NOTES = {
  1: ['Tap orbital boxes to remove two 4s electrons.'],
  2: ['Remove electrons to find the jump, then lay a card.'],
  3: ['Type the overall charge in the field below.'],
  4: ['Tap the complementary colour on the wheel.'],
  5: ['Test both vials on the magnet, then lay the winner.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  clue: CLUE_ID,
  sections: [{
    heading: 'The Coil Shut Down',
    body: 'Every drum in the Fifth\'s canyon is accounted for: 4s leaves before 3d, core jumps mark oxidation states, ligands set coordination number, colour, and spin. A decoded relay chip from the Coil points straight to Cinder Halo.'
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
