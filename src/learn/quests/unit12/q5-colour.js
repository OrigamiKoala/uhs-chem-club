/**
 * Unit 12 · Bench 5 — Colour (q5-colour)
 *
 * The colour-check booth, on the lode kit. White light through a sample and a prism; the five d orbitals with six ligands closing in; the
 * split ladder with a ruler of photon energies. Eight stages and ONE click: the belief that a copper solution is blue because copper is blue,
 * as paint is. Swap the water round the same Cu²⁺ for ammonia and the dark band moves: the gap the ligands make decides the colour.
 *
 *   1  what the blue copper solution takes out of white light                  -> complementary colour
 *   2  which d orbitals rise as six ligands close in                           -> crystal field splitting
 *   3  which colour's photons match titanium's gap                            -> a photon is absorbed when its energy equals the gap
 *   4  PREDICT: same Cu²⁺, ammonia for water: does the colour change?
 *   5  TEST: add ammonia and read the strip                                    -> a wider gap takes out light of more energy
 *   6  the gap in kJ for each mole, from the band's 600 nm (typed)             -> E = hc ÷ λ, × Avogadro
 *   7  which ions give colourless solutions                                    -> d⁰ and d¹⁰
 *   8  SEALED: which of two cobalt(III) drums has the wider gap
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { lodeTable, specFixture, specRead, wheelFixture, cfieldFixture, cfieldRead, dsplitFixture, dsplitRead, vial, note, plaqueFixture, lodeLeadFixture } from '../../table/kits/lode.js';
import { COMPLEXES, BANDS, photonKJ, photonJ } from '../../engine/lodedata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bcomplementary\b/i, introducedAt: 1 },
  { term: /\bcrystal field splitting\b/i, introducedAt: 2 }
];

/** Photon energy is Lanternfall's; complexes and ligands this world's third bench. */
export const BUILDS_ON = ['unit12/q4-shapes', 'unit02/q2-photon'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit12/q5-colour';
const GUESS = { 'g-same': 'no change', 'g-change': 'a change' };
const widget = { type: 'table', label: 'The bench' };
const name = id => BANDS.find(b => b.id === id)?.name.toLowerCase();

export function toolNoteFor() { return null; }

/** Stage 6: the gap of the copper-ammonia complex from its band at 600 nm. Worked case in the briefing: titanium at 500 nm. */
const GAP_NM = COMPLEXES['cu-nh3'].nm;
const GAP_KJ = photonKJ(GAP_NM);
const WORKED_NM = 500;

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const S = specFixture('spec', { x: 72, y: 27 }, { w: 100, h: 46, taps: true });
    return {
      id: 's1-blue',
      title: 'What Blue Takes Out',
      briefing: { speaker: SPEAKER, body: 'White light holds every colour. A solution looks the colour of the light that gets through, and the colour opposite it on the wheel, the one taken out, is its complementary colour.' },
      prompt: 'Which colour of light does the blue copper(II) solution take out?',
      widget,
      table: lodeTable({
        pieces: [vial('v-cu', 'cu-aq', { x: 10, y: 50 })],
        fixtures: [S.fixture, wheelFixture('wheel', { x: 138, y: 24 }, { size: 22 })],
        zones: { slots: [S.slot] }
      }),
      hints: [
        'Drag the vial into the holder, then tap a colour on the strip.',
        'Compare the strip with the six colours of white light: look for the dark part.',
        'The colour you see is what gets through; find it on the wheel and look opposite.'
      ],
      check(state) {
        const r = specRead(state.table, 'spec');
        if (!r.chosen) return { ok: false, notYet: true, msg: 'Tap a colour on the strip.' };
        if (!r.complex) return { ok: false, msg: 'There is no sample in the holder yet.' };
        if (r.chosen === 'orange' || r.chosen === 'red') return { ok: true };
        return { ok: false, msg: `The strip still shows ${name(r.chosen)} light after the sample.` };
      },
      reward: {
        log: 'Copper(II) takes out orange and red.',
        title: 'Complementary Colour',
        body: 'Orange and red are taken out, and the blue left over is what you see. Orange sits opposite blue on the wheel: they are complementary colours.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-split',
    title: 'Ligands Split the d Orbitals',
    briefing: { speaker: SPEAKER, body: 'A ligand\'s lone pair repels the electrons of a metal ion\'s d orbitals. The more an orbital points at the ligands, the more its energy rises.' },
    prompt: 'Which two d orbitals rise in energy as six ligands close in along the axes?',
    widget,
    table: lodeTable({ pieces: [], fixtures: [cfieldFixture('cf', { x: 75, y: 31 }, { w: 146, h: 56 })] }),
    hints: [
      'Turn the "Ligands" dial, then tap two orbitals.',
      'Look at where each orbital\'s lobes point compared with the blue lone pairs.',
      'Lobes that point straight at a lone pair are repelled most.'
    ],
    check(state) {
      const r = cfieldRead(state.table, 'cf');
      if (r.marked.length < 2) return { ok: false, notYet: true, msg: `${r.marked.length} orbital${r.marked.length === 1 ? ' is' : 's are'} marked; mark two.` };
      if (r.marked.length === 2 && r.marked.includes('x2y2') && r.marked.includes('z2')) return { ok: true };
      const wrong = r.marked.find(id => id !== 'x2y2' && id !== 'z2');
      const nm = { xy: 'dxy', xz: 'dxz', yz: 'dyz' }[wrong];
      return { ok: false, msg: wrong ? `The lobes of ${nm} point between the lone pairs on its axes.` : 'More than two orbitals are marked.' };
    },
    reward: {
      log: 'dz² and dx²−y² rise.',
      title: 'Crystal Field Splitting',
      body: 'dz² and dx²−y², whose lobes point at the ligands, rise; the other three fall. The gap that opens between the two sets is the crystal field splitting.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const D = dsplitFixture('ds', { x: 75, y: 31 }, { mode: 'ruler', cx: 'ti-aq', w: 122, h: 56, title: 'Ti³⁺ in water: its one d electron and the gap' });
    return {
      id: 's3-photon',
      title: 'Gap Meets Light',
      briefing: { speaker: SPEAKER, body: 'Light comes in tiny packets of energy called photons; violet photons carry the most energy and red the least. A photon is absorbed only if its energy exactly lifts an electron to an empty place above.' },
      prompt: 'Which colour of light has photons that can lift titanium\'s d electron across the gap?',
      widget,
      table: lodeTable({ pieces: [], fixtures: [D.fixture] }),
      hints: [
        'Tap a colour on the ruler beside the ladder.',
        'Compare the height of the gap with the height of each colour\'s bar.',
        'A photon is absorbed only when its energy matches the gap exactly.'
      ],
      check(state) {
        const r = dsplitRead(state.table, 'ds');
        if (!r.band) return { ok: false, notYet: true, msg: 'Tap a colour on the ruler.' };
        if (r.band === 'green') return { ok: true };
        const b = BANDS.find(x => x.id === r.band);
        const lo = Math.round(photonKJ(b.hi)); const hi = Math.round(photonKJ(b.lo));
        return { ok: false, msg: `${b.name} photons carry ${lo} to ${hi} kJ for each mole, and the gap line crosses the ruler elsewhere.` };
      },
      reward: {
        log: 'Green light matches titanium\'s gap.',
        title: 'Light That Fits the Gap',
        body: 'Green: its photons carry the gap\'s energy, so green light is taken out. Red and violet are left, so the solution looks purple.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict',
    title: 'Same Copper, New Ligand',
    predict: true,
    prompt: 'If the water round each Cu²⁺ is swapped for ammonia, will the colour of the solution change?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-same', 'No: copper is blue whatever it bonds to', { x: 32, y: 20 }),
        note('g-change', 'Yes: the colour changes', { x: 32, y: 44 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'metal-colours', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip shows two different metal ions in water.',
      'The colour comes from light lifting a d electron across a gap.',
      'Think about what makes the gap in the first place.'
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
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it with the lamp.' }
  },

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const S = specFixture('spec', { x: 78, y: 29 }, { w: 120, h: 50, taps: true, ammonia: true, gap: true });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's5-band',
      title: 'The Band Moves',
      get prompt() { const g = guess(); return `Which colour does the copper solution take out once ammonia is bonded?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: lodeTable({ pieces: [vial('v-cu', 'cu-aq', { x: 9, y: 54 })], fixtures: [S.fixture], zones: { slots: [S.slot] } }),
      hints: [
        'Put the vial in the holder, press "Add Ammonia", then tap the dark colour.',
        'Compare the dark part of the strip and the gap before and after the ammonia.',
        'A wider gap needs photons of more energy, nearer the violet end.'
      ],
      check(state) {
        const r = specRead(state.table, 'spec');
        if (!r.chosen) return { ok: false, notYet: true, msg: 'Tap a colour on the strip.' };
        if (!r.complex) return { ok: false, msg: 'There is no sample in the holder yet.' };
        if (!r.added) return { ok: false, msg: 'No ammonia has been added yet.' };
        if (r.chosen === 'orange') return { ok: true };
        return { ok: false, msg: `After the ammonia, the strip shows ${name(r.chosen)} light getting through.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Ammonia moved the band to orange.',
          title: 'Ligands Set the Colour',
          body: `The dark band moved from red to orange${g ? ` (you predicted ${g})` : ''}: ammonia widens the gap, so light of more energy is taken out. The same copper ion turned deep blue-violet.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const S = specFixture('spec', { x: 52, y: 25 }, { w: 100, h: 46, fixed: 'cu-nh3', gap: true, cursor: true, title: 'Copper(II) with ammonia' });
    const wJ = photonJ(WORKED_NM); const wKJ = photonKJ(WORKED_NM);
    return {
      id: 's6-kj',
      title: 'The Gap in Kilojoules',
      briefing: {
        speaker: SPEAKER,
        body: 'The energy of one photon is E = hc ÷ λ, with λ in metres; a mole of photons has Avogadro\'s number of them. Titanium\'s complex takes out light of 500 nm, so its gap is:',
        worked: [
          `E = (6.63 × 10⁻³⁴ × 3.00 × 10⁸) ÷ (500 × 10⁻⁹) = ${(wJ * 1e19).toFixed(2)} × 10⁻¹⁹ J for one photon`,
          `× 6.02 × 10²³ = ${Math.round(wKJ * 1000).toLocaleString('en-US')} J, so ${Math.round(wKJ)} kJ for each mole`
        ]
      },
      prompt: 'How wide is the gap in the copper-ammonia complex, in kJ for each mole?',
      entry: { id: 'kj', label: 'Gap', unit: 'kJ/mol' },
      widget,
      table: lodeTable({
        pieces: [],
        fixtures: [
          S.fixture,
          plaqueFixture('k', 'Constants', { x: 126, y: 24 }, ['h = 6.63 × 10⁻³⁴ J s', 'c = 3.00 × 10⁸ m/s', 'Nₐ = 6.02 × 10²³ /mol', '1 nm = 10⁻⁹ m'], { w: 42 })
        ]
      }),
      hints: [
        'Read the wavelength at the middle of the dark band, then type your answer.',
        'Compare this wavelength with the worked titanium case at 500 nm.',
        'Find one photon\'s energy with E = hc ÷ λ, with λ in metres, then multiply by Avogadro\'s number and turn joules into kilojoules.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the gap in kJ/mol.' };
        if (Math.abs(v - GAP_KJ) <= 3) return { ok: true };
        if (Math.abs(v - GAP_KJ * 1000) <= 3000) return { ok: false, msg: `${v} is the gap in joules for a mole, not kilojoules.` };
        if (v < 1e-10) return { ok: false, msg: `${v} is the energy of one photon, not of a mole of them.` };
        if (Math.abs(v - wKJ) <= 3) return { ok: false, msg: `${v} kJ/mol is titanium's gap, from light of 500 nm; this band sits at ${GAP_NM} nm.` };
        return { ok: false, msg: `A gap of ${v} kJ/mol would take out light of ${Math.round(119627 / v)} nm; the band sits at ${GAP_NM} nm.` };
      },
      reward: {
        log: 'Copper-ammonia gap: 199 kJ/mol.',
        title: 'Gap From Wavelength',
        body: `One photon of ${GAP_NM} nm carries ${(photonJ(GAP_NM) * 1e19).toFixed(2)} × 10⁻¹⁹ J, so a mole carries ${Math.round(GAP_KJ)} kJ. The longer wavelength than titanium's 500 nm means a narrower gap.`
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const D = dsplitFixture('ds', { x: 68, y: 20 }, { mode: 'vial', w: 84, h: 38, title: 'd electrons and the light' });
    const ids = ['sc-aq', 'ti-aq', 'cu-aq', 'zn-aq'];
    const COLOURLESS = new Set(['sc-aq', 'zn-aq']);
    return {
      id: 's7-colourless',
      title: 'No Colour',
      prompt: 'Which of these four ions give colourless solutions?',
      widget,
      table: lodeTable({
        pieces: ids.map((id, i) => vial(`v-${id}`, id, { x: 9 + i * 14, y: 55 }, { name: COMPLEXES[id].formula.replace(/\[(\w+)\(H₂O\)₆\]/, '$1') })),
        fixtures: [D.fixture],
        zones: {
          slots: [D.slot],
          trays: [
            { id: 'coloured', label: 'Coloured', at: { x: 86, y: 55 }, size: { w: 26, h: 18 }, cell: 12, cellH: 18 },
            { id: 'clear', label: 'Colourless', at: { x: 118, y: 55 }, size: { w: 26, h: 18 }, cell: 12, cellH: 18 }
          ]
        }
      }),
      hints: [
        'Drop each vial on the ladder\'s square and press "Shine Light", then drag it to a tray.',
        'Look for an electron in the lower set and an empty place in the upper set.',
        'Light is taken out only when an electron can be lifted across the gap.'
      ],
      check(state) {
        const t = state.table;
        const off = ids.filter(id => !['tray:coloured', 'tray:clear'].includes(t.pieces[`v-${id}`].zone));
        if (off.length) return { ok: false, notYet: true, msg: `${off.length} vial${off.length > 1 ? 's are' : ' is'} not in a tray yet.` };
        const wrong = ids.find(id => (t.pieces[`v-${id}`].zone === 'tray:clear') !== COLOURLESS.has(id));
        if (!wrong) return { ok: true };
        const c = COMPLEXES[wrong];
        return { ok: false, msg: `${c.formula} has ${c.d} d electron${c.d === 1 ? '' : 's'}: ${c.d === 0 ? 'the lower set is empty' : c.d === 10 ? 'the upper set is full' : 'one can be lifted into the upper set'}.` };
      },
      reward: {
        log: 'Sc³⁺ and Zn²⁺ are colourless.',
        title: 'Nothing to Lift',
        body: 'Sc³⁺ has no d electron to lift and Zn²⁺ no empty place to lift one into, so neither takes out visible light. Ti³⁺ and Cu²⁺ are coloured.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-drums',
    title: 'Two Cobalt Drums',
    prompt: 'Which of these two cobalt(III) drums has the wider gap between its d orbitals?',
    widget,
    table: lodeTable({
      pieces: [vial('v-y', 'co-nh3', { x: 22, y: 30 }, { name: 'Drum 1' }), vial('v-g', 'co-f', { x: 44, y: 30 }, { name: 'Drum 2' })],
      fixtures: [
        wheelFixture('wheel', { x: 84, y: 24 }, { size: 32 }),
        plaqueFixture('e', 'Photon energy', { x: 128, y: 22 }, ['violet: the most', 'blue, green, yellow', 'orange, red: the least'], { w: 38 })
      ],
      zones: { slots: [{ id: 'answer', label: 'The wider gap', at: { x: 33, y: 49 }, size: { w: 22, h: 16 } }] }
    }),
    hints: [
      'Read each drum\'s colour, then use the wheel and the photon plate.',
      'Find the colour each drum takes out of white light.',
      'The wider gap takes out the photons that carry more energy.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a drum in the slot.' };
      if (card.id === 'v-y') return { ok: true };
      return { ok: false, msg: 'Drum 2 looks green, so it takes out red light, whose photons carry the least energy.' };
    },
    reward: {
      log: 'The yellow-orange drum has the wider gap.',
      title: 'Colour Reads the Gap',
      body: 'Drum 1 looks yellow-orange, so it takes out blue light, whose photons carry more energy than the red Drum 2 takes out. Ammonia gives cobalt(III) a wider gap than fluoride.'
    }
  }
];

const NOTES = {
  1: ['Drag the vial into the holder, then tap a colour.'],
  2: ['Turn the dial, then tap two orbitals.'],
  3: ['Tap a colour on the ruler.'],
  4: ['Drag the card you choose into the slot.'],
  5: ['Holder, then "Add Ammonia", then tap a colour.'],
  6: ['Type your answer in the field at the bottom.'],
  7: ['Vial on the square, "Shine Light", then a tray.'],
  8: ['Drag the drum you choose into the slot.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Ligands split the d orbitals; a photon whose energy matches the gap is absorbed, and the solution shows the complementary colour. Change the ligand and the gap, and the colour, change.' }]
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const band = id => BANDS.findIndex(b => b.id === id) + 1;

export const SOLUTIONS = [
  [put('v-cu', 'slot:spec.holder'), dial('spec', 'band', band('orange'))],
  [dial('cf', 'near', 4), dial('cf', 'o1', 1), dial('cf', 'o2', 1)],
  [dial('ds', 'band', band('green'))],
  [put('g-same', 'slot:guess')],
  [put('v-cu', 'slot:spec.holder'), { run: 'spec' }, dial('spec', 'band', band('orange'))],
  [{ type: { entry: 'kj', value: '199' } }],
  [put('v-sc-aq', 'tray:clear'), put('v-ti-aq', 'tray:coloured'), put('v-cu-aq', 'tray:coloured'), put('v-zn-aq', 'tray:clear')],
  [put('v-y', 'slot:answer')]
];

export const MISSES = [
  [put('v-cu', 'slot:spec.holder'), dial('spec', 'band', band('blue'))],
  [dial('cf', 'near', 4), dial('cf', 'o0', 1), dial('cf', 'o1', 1)],
  [dial('ds', 'band', band('red'))],
  [],
  [put('v-cu', 'slot:spec.holder'), { run: 'spec' }, dial('spec', 'band', band('red'))],
  [{ type: { entry: 'kj', value: '199400' } }],
  [put('v-sc-aq', 'tray:clear'), put('v-ti-aq', 'tray:coloured'), put('v-cu-aq', 'tray:coloured'), put('v-zn-aq', 'tray:coloured')],
  [put('v-g', 'slot:answer')]
];

function blankState() { return {}; }
export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { GAP_KJ, GAP_NM, WORKED_NM };
