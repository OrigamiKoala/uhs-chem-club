/**
 * q5-assay.js — Tallow, site five: ATOMIC MASS.
 *
 * Five stages:
 *   1  Sorted by Mass (was 2)       -> Abundance
 *   2  Where the Atoms Balance (was 3) -> Average Atomic Mass
 *   3  Work Out the Average (was 4) -> Weighted average with worked case
 *   4  Reading a Spectrum (was 11)  -> Mass spectrum of magnesium (24, 25, 26)
 *   5  Name the Element (new)       -> Match silicon's mass spectrum to Al/Si/P/S cards
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { massTable, assayRead } from '../../table/kits/mass.js';
import { elementCard } from '../../table/kits/cards.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\babundances?\b/i, introducedAt: 1 },
  { term: /\baverage atomic mass\b/i, introducedAt: 2 },
  { term: /\bweighted averages?\b/i, introducedAt: 3 },
  { term: /\bmass spectrum\b/i, introducedAt: 4 }
];

const SPEAKER = 'Vess';

export const CARD_MASS = {
  'boron': 10.8,
  'fluorine': 19.0,
  'neon': 20.2,
  'chlorine': 35.5
};

export function toolNoteFor() { return null; }

export function averageOf(bins) {
  const count = (bins || []).reduce((n, b) => n + b.n, 0);
  if (!count) return 0;
  return Math.round(((bins || []).reduce((m, b) => m + b.mass * b.n, 0) / count) * 100) / 100;
}

const SAMPLE_X = 14;
const CHUTE = { id: 'chute', label: 'Chute', at: { x: SAMPLE_X, y: 12 }, size: { w: 20, h: 17 } };

const sample = (id, label, bins, at, props = {}) => ({
  id, kind: 'sample', label, at, props: { bins, note: `${bins.reduce((n, b) => n + b.n, 0)} atoms`, ...props }
});

const assayFixture = (box, extra = {}) => ({
  id: 'assay', kind: 'assay', label: 'Mass spectrometer', runLabel: 'Run sample', at: box.at, size: box.size, props: { slot: 'chute' }, ...extra
});

const fulcrum = (min, max, value, step = max - min > 6 ? 0.5 : 0.1) => ({
  pivot: { min, max, step, value, label: 'Pivot' }
});

const trayAt = (id, label, x, y, w, cell = 19, h = 22) => ({ id, label, at: { x, y }, size: { w, h }, cell });

const CL = [{ mass: 35, n: 30 }, { mass: 37, n: 10 }];
const B = [{ mass: 10, n: 8 }, { mass: 11, n: 32 }];
const MG_SPEC = [{ mass: 24, pct: 79 }, { mass: 25, pct: 10 }, { mass: 26, pct: 11 }];
const SI_SPEC = [{ mass: 28, pct: 92 }, { mass: 29, pct: 5 }, { mass: 30, pct: 3 }];

const trayOf = (t, id) => (t.pieces[id].zone || '').replace('tray:', '');
const chuteSample = t => assayRead(t, 'assay');

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Sorted by Mass',
    briefing: {
      speaker: SPEAKER,
      body: 'A mass spectrometer sorts the atoms of a sample by mass and counts how many land at each mass. The percent of an element\'s atoms that are one isotope is that isotope\'s abundance.'
    },
    prompt: 'What is the abundance of chlorine-35 in each sample?',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        sample('a', 'Chlorine sample A', CL, { x: SAMPLE_X, y: 34 }),
        sample('b', 'Chlorine sample B', [{ mass: 35, n: 60 }, { mass: 37, n: 20 }], { x: SAMPLE_X, y: 49 })
      ],
      zones: {
        slots: [CHUTE],
        trays: [
          trayAt('s25', '25%', 47, 56, 34, 17),
          trayAt('s50', '50%', 85, 56, 34, 17),
          trayAt('s75', '75%', 123, 56, 34, 17)
        ]
      },
      fixtures: [assayFixture({ at: { x: 87, y: 19 }, size: { w: 114, h: 34 } })]
    }),
    hints: [
      'Use "Run sample" on each sample.',
      'Read the atom counts at each mass and the total atoms on each sample.',
      'Turn the chlorine-35 count into a percent of the sample and place both samples in matching trays.'
    ],
    check(state) {
      const t = state.table;
      const mine = { a: trayOf(t, 'a'), b: trayOf(t, 'b') };
      const names = { a: 'Chlorine sample A', b: 'Chlorine sample B' };
      for (const id of ['a', 'b']) if (!['s25', 's50', 's75'].includes(mine[id])) return { ok: false, notYet: true, msg: `${names[id]} has no tray yet.` };
      for (const id of ['a', 'b']) {
        if (mine[id] === 's25') return { ok: false, msg: `More than 25% of ${names[id]} is at mass 35.` };
        if (mine[id] === 's50') return { ok: false, msg: `The two atom counts of ${names[id]} are not equal.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Both samples split 75% to 25%.',
      title: 'Abundance',
      body: 'Both samples are 75% chlorine-35 and 25% chlorine-37. The abundances are the same whatever the size of the sample.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Where the Atoms Balance',
    briefing: {
      speaker: SPEAKER,
      body: 'The beam tips toward the side with more atoms further from the pivot. Where it lies level is the average mass of one atom in the sample.'
    },
    prompt: 'What is the average mass of an atom in Chlorine sample A?',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [sample('a', 'Chlorine sample A', CL, { x: SAMPLE_X, y: 34 })],
      zones: { slots: [CHUTE] },
      fixtures: [assayFixture({ at: { x: 87, y: 24 }, size: { w: 114, h: 44 } }, { dials: fulcrum(34.5, 37.5, 36) })]
    }),
    hints: [
      'Use "Run sample" and the "Pivot" dial.',
      'Watch which end of the beam dips as the pivot moves, and stop where it lies level.',
      'More atoms sit at 35 than at 37, so the balance point sits closer to 35.'
    ],
    check(state) {
      const r = chuteSample(state.table);
      if (!r.sample || !r.poured) return { ok: false, notYet: true, msg: 'Drop Chlorine sample A in the chute, press "Run sample", and slide the pivot.' };
      if (!r.level) {
        return { ok: false, msg: r.net > 0
          ? 'The beam dips on the heavy side.'
          : 'The beam dips on the light side.' };
      }
      return { ok: true };
    },
    reward: {
      log: '35.5 sits a quarter of the way from 35 to 37.',
      title: 'Average Atomic Mass',
      body: 'The beam is level at 35.5, nearer 35 because three atoms in four are chlorine-35. This average atomic mass is the number printed on the periodic table.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Work Out the Average',
    briefing: {
      speaker: SPEAKER,
      body: 'The average is each mass times its fraction of the atoms, added together.',
      worked: ['35 × 0.75 = 26.25', '37 × 0.25 = 9.25', '26.25 + 9.25 = 35.5']
    },
    prompt: 'What is the average atomic mass of this boron sample?',
    entry: { id: 'ans', label: 'Average atomic mass', unit: 'u' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [sample('a', 'Boron sample', B, { x: SAMPLE_X, y: 34 }, { note: '40 atoms' })],
      zones: { slots: [CHUTE] },
      fixtures: [assayFixture({ at: { x: 87, y: 24 }, size: { w: 114, h: 44 } }, { dials: fulcrum(9.5, 11.5, 10.5, 0.5) })]
    }),
    hints: [
      'Use "Run sample" to count the atoms at each mass, and the "Pivot" dial to check which side your value tips toward.',
      'Find the fraction of the 40 atoms at each mass first.',
      'Follow the worked example in the briefing: multiply each mass by its fraction and add them.'
    ],
    check(state) {
      const r = chuteSample(state.table);
      if (!r.sample || !r.poured) return { ok: false, notYet: true, msg: 'Drop the boron sample in the chute and press "Run sample" first.' };
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type the average atomic mass.' };
      const want = averageOf(B);
      if (Math.abs(v - want) <= 0.051) return { ok: true };
      const middle = (B[0].mass + B[1].mass) / 2;
      if (Math.abs(v - middle) < 0.051) return { ok: false, msg: 'The two atom counts are not equal, so the beam does not balance halfway between 10 and 11.' };
      if (v < B[0].mass || v > B[1].mass) return { ok: false, msg: 'An average cannot lie outside the lightest and heaviest isotope masses.' };
      return { ok: false, msg: v < want ? 'At that mass, the beam tips toward the heavy side.' : 'At that mass, the beam tips toward the light side.' };
    },
    reward: {
      log: 'Boron averages 10.8 u.',
      title: 'Weighted Average',
      body: 'Boron is 20% mass 10 and 80% mass 11, so its average is 10.8. Listed atomic masses are weighted averages, which is why few are whole numbers.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Reading a Spectrum',
    briefing: {
      speaker: SPEAKER,
      body: 'A mass spectrum is the spectrometer\'s count drawn as bars: mass along the bottom, percent of the atoms up the side.'
    },
    prompt: 'What is the average atomic mass of this element, from its mass spectrum?',
    entry: { id: 'ans', label: 'Average atomic mass', unit: 'u' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [],
      fixtures: [
        { id: 'spec', kind: 'spectrum', label: 'Percent of atoms (%)', at: { x: 75, y: 34 }, size: { w: 100, h: 52 }, noRun: true, props: { peaks: MG_SPEC, axis: { min: 23, max: 27 } } }
      ]
    }),
    hints: [
      'Read the mass under each bar and the percent up the side.',
      'Most of the atoms are at 24, so the average sits just above 24.',
      'Multiply each mass by its percent as a decimal and add the three terms.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type the average atomic mass.' };
      const want = MG_SPEC.reduce((m, p) => m + p.mass * p.pct / 100, 0);
      if (Math.abs(v - want) <= 0.051) return { ok: true };
      if (Math.abs(v - 25) < 0.051) return { ok: false, msg: 'The three bars are not equal in height, so the average is not at the middle bar.' };
      return { ok: false, msg: 'That average does not match the heights of the three bars.' };
    },
    reward: {
      log: 'The magnesium spectrum averages 24.3 u.',
      title: 'Mass Spectrum',
      body: 'A mass spectrum with three isotopes is averaged the same way as two. Most of the atoms are at 24, so the average, 24.3, is just above it.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Name the Element',
    prompt: 'Which element gave this mass spectrum?',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        elementCard('al', 'Al', { x: 24, y: 58 }, { mass: 26.98 }),
        elementCard('si', 'Si', { x: 48, y: 58 }, { mass: 28.09 }),
        elementCard('p', 'P', { x: 72, y: 58 }, { mass: 30.97 }),
        elementCard('s', 'S', { x: 96, y: 58 }, { mass: 32.06 })
      ],
      zones: {
        slots: [{ id: 'match', label: 'Element', at: { x: 128, y: 34 }, size: { w: 18, h: 18 } }]
      },
      fixtures: [
        { id: 'spec', kind: 'spectrum', label: 'Percent of atoms (%)', at: { x: 60, y: 26 }, size: { w: 92, h: 42 }, noRun: true, props: { peaks: SI_SPEC, axis: { min: 27, max: 31 } } }
      ]
    }),
    hints: [
      'Use the element cards and the "Element" slot.',
      'Most of the atoms are at 28, with small bars at 29 and 30.',
      'Estimate where the average sits from the bars, and match it to the listed mass on the cards.'
    ],
    check(state) {
      const held = Object.values(state.table.pieces).find(p => p.zone === 'slot:match');
      if (!held) return { ok: false, notYet: true, msg: 'Place an element card in the Element slot.' };
      if (held.id !== 'si') {
        return { ok: false, msg: held.id === 'al'
          ? 'Aluminum\'s listed mass is below 28, the lightest bar on the spectrum.'
          : 'That element\'s listed mass is too high for a spectrum whose tallest bar is at 28.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The spectrum matches silicon (28.09).',
      title: 'Identifying an Element',
      body: 'The average sits just above 28, and silicon\'s listed mass is 28.09. A mass spectrum is enough to name an element.',
      last: true
    }
  }
];

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'A real sample of an element is a mixture of isotopes, and the proportions are fixed for that element. The mass listed for it is what one atom weighs on average across that mixture.'
    },
    {
      heading: 'Why It Has a Decimal',
      body: 'A single atom always has a whole-number mass, but an average over a mixture usually does not. The average leans toward the most common isotope, so the decimal tells you how the mix sits.'
    }
  ]
};

const to = (piece, target) => ({ place: { piece, to: target } });
const tip = piece => [to(piece, 'slot:chute'), { run: 'assay' }];
const typed = (id, value) => ({ type: { entry: id, value: String(value) } });
const slide = value => ({ setDial: { fixture: 'assay', dial: 'pivot', value } });

export const SOLUTIONS = [
  [...tip('a'), ...tip('b'), to('a', 'tray:s75'), to('b', 'tray:s75')],
  [...tip('a'), slide(35.5)],
  [...tip('a'), typed('ans', '10.8')],
  [typed('ans', '24.3')],
  [to('si', 'slot:match')]
];

export const MISSES = [
  [...tip('a'), ...tip('b'), to('a', 'tray:s75'), to('b', 'tray:s25')],
  [...tip('a'), slide(36)],
  [...tip('a'), typed('ans', '10.5')],
  [typed('ans', '25')],
  [to('p', 'slot:match')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}
