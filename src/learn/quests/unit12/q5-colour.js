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
const GUESS = { 'g-same': 'the same gap', 'g-change': 'a wider gap' };
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
      title: 'What Blue Absorbs',
      briefing: { speaker: SPEAKER, body: 'White light contains every colour of the rainbow. Drop the blue copper(II) vial in Sample to see which colours pass through and which are absorbed.' },
      prompt: 'Which colour of light does the blue copper(II) solution absorb?',
      widget,
      table: lodeTable({
        pieces: [vial('v-cu', 'cu-aq', { x: 10, y: 50 })],
        fixtures: [S.fixture, wheelFixture('wheel', { x: 138, y: 24 }, { size: 22 })],
        zones: { slots: [S.slot] }
      }),
      hints: [
        'Drop the vial in Sample and look for the dark region on the light strip.',
        'Compare the dark region on the strip with the six colours of white light.',
        'The colour you see is what passes through, which sits directly opposite the absorbed colour on the colour wheel.'
      ],
      check(state) {
        const r = specRead(state.table, 'spec');
        if (!r.chosen) return { ok: false, notYet: true, msg: 'Tap a colour on the strip.' };
        if (!r.complex) return { ok: false, msg: 'Drop the vial into the Sample slot first.' };
        if (r.chosen === 'orange' || r.chosen === 'red') return { ok: true };
        return { ok: false, msg: `The strip shows ${name(r.chosen)} light still passing through the sample.` };
      },
      reward: {
        log: 'Copper(II) absorbs orange and red.',
        title: 'Complementary Colour',
        body: 'The solution absorbs orange and red light, so the remaining light looks blue. Orange sits opposite blue on the wheel, making them complementary colours.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-split',
    title: 'Ligands Split the d Orbitals',
    briefing: { speaker: SPEAKER, body: 'A metal ion\'s five d orbitals have equal energy until ligands approach along the axes. Drag "Ligands" toward Bonded to see how their energies split.' },
    prompt: 'Which two d orbitals rise in energy as six ligands approach along the axes?',
    widget,
    table: lodeTable({ pieces: [], fixtures: [cfieldFixture('cf', { x: 75, y: 31 }, { w: 146, h: 56 })] }),
    hints: [
      'Drag the "Ligands" dial toward Bonded and watch where each orbital\'s lobes point.',
      'Compare where each orbital\'s lobes point relative to the blue ligand lone pairs.',
      'Orbitals whose lobes point straight at the incoming lone pairs feel the most repulsion and rise in energy.'
    ],
    check(state) {
      const r = cfieldRead(state.table, 'cf');
      if (r.marked.length < 2) return { ok: false, notYet: true, msg: `You marked ${r.marked.length} orbital${r.marked.length === 1 ? '' : 's'}; mark two.` };
      if (r.marked.length === 2 && r.marked.includes('x2y2') && r.marked.includes('z2')) return { ok: true };
      const wrong = r.marked.find(id => id !== 'x2y2' && id !== 'z2');
      const nm = { xy: 'dxy', xz: 'dxz', yz: 'dyz' }[wrong];
      return { ok: false, msg: wrong ? `The lobes of ${nm} point between the ligands rather than directly at them.` : 'Mark only two orbitals.' };
    },
    reward: {
      log: 'dz² and dx²−y² rise.',
      title: 'Crystal Field Splitting',
      body: 'dz² and dx²−y² point straight at the ligands and rise in energy, while the other three drop. This energy gap between the two sets is called crystal field splitting.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const D = dsplitFixture('ds', { x: 75, y: 31 }, { mode: 'ruler', cx: 'ti-aq', w: 122, h: 56, title: 'Ti³⁺ in water: its one d electron and the gap' });
    return {
      id: 's3-photon',
      title: 'Gap Meets Light',
      briefing: { speaker: SPEAKER, body: 'Light travels in energy packets called photons, with violet carrying the most energy and red the least. A complex absorbs a photon only when its energy matches the d-orbital gap.' },
      prompt: 'Which colour of light has photons that match titanium\'s d-orbital gap?',
      widget,
      table: lodeTable({ pieces: [], fixtures: [D.fixture] }),
      hints: [
        'Follow the dashed gap line across to the colour bars.',
        'Compare the height of the dashed gap line with the height of each colour bar.',
        'Only photons whose energy equals the gap height can lift the d electron.'
      ],
      check(state) {
        const r = dsplitRead(state.table, 'ds');
        if (!r.band) return { ok: false, notYet: true, msg: 'Tap a colour bar.' };
        if (r.band === 'green') return { ok: true };
        const b = BANDS.find(x => x.id === r.band);
        return { ok: false, msg: `${b.name} photons do not match the gap height. Follow the dashed line across to the bar it hits.` };
      },
      reward: {
        log: 'Green light matches titanium\'s gap.',
        title: 'Light That Fits the Gap',
        body: 'Green photons match the gap energy, so green light is absorbed. The red and violet light left behind makes the solution look purple.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict',
    title: 'Same Copper, New Ligand',
    predict: true,
    prompt: 'When ammonia replaces water around Cu²⁺, does the d-orbital gap stay the same or widen?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-same', 'Stays the same (copper sets the gap)', { x: 32, y: 20 }),
        note('g-change', 'Widens (ammonia splits the d orbitals more)', { x: 32, y: 44 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'metal-colours', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'Watch the clip showing two different metal ions in water.',
      'A complex\'s colour depends on the energy gap a d electron jumps across.',
      'Think about what causes the d orbitals to split in the first place.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is saved. Now test it with the lamp.' }
  },

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const S = specFixture('spec', { x: 78, y: 29 }, { w: 120, h: 50, taps: true, ammonia: true, gap: true });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's5-band',
      title: 'The Band Moves',
      briefing: { speaker: SPEAKER, body: 'Drop the copper vial in Sample, then press "Add Ammonia" and watch how both the dark band and the energy gap shift.' },
      get prompt() { const g = guess(); return `After adding ammonia, which colour is no longer absorbed and lights back up${g ? ` (you predicted ${g})` : ''}?`; },
      widget,
      table: lodeTable({ pieces: [vial('v-cu', 'cu-aq', { x: 9, y: 54 })], fixtures: [S.fixture], zones: { slots: [S.slot] } }),
      hints: [
        'Compare the light strip before and after pressing "Add Ammonia".',
        'Notice which colour stays dark and which colour lights back up as the gap widens.',
        'A wider gap absorbs higher-energy light nearer violet, letting lower-energy red light pass through.'
      ],
      check(state) {
        const r = specRead(state.table, 'spec');
        if (!r.chosen) return { ok: false, notYet: true, msg: 'Tap a colour on the strip.' };
        if (!r.complex) return { ok: false, msg: 'Drop the vial into the Sample slot first.' };
        if (!r.added) return { ok: false, msg: 'Press "Add Ammonia" first.' };
        if (r.chosen === 'red') return { ok: true };
        if (r.chosen === 'orange') return { ok: false, msg: 'Orange is still dark after adding ammonia. Look for the colour that lit back up.' };
        return { ok: false, msg: `${name(r.chosen)} light was already passing through before you added ammonia.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Ammonia widened the gap; red now passes through.',
          title: 'Ligands Set the Colour',
          body: `Red lights back up while orange stays dark${g ? ` (you predicted ${g})` : ''}. Ammonia widens the d-orbital gap compared with water, so the complex absorbs higher-energy orange light instead of red.`
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
        body: 'One photon\'s energy is E = hc ÷ λ (with λ in metres), and a mole has Avogadro\'s number of photons. For titanium absorbing 500 nm light:',
        worked: [
          `E = (6.63 × 10⁻³⁴ × 3.00 × 10⁸) ÷ (500 × 10⁻⁹) = ${(wJ * 1e19).toFixed(2)} × 10⁻¹⁹ J per photon`,
          `× 6.02 × 10²³ = ${Math.round(wKJ * 1000).toLocaleString('en-US')} J/mol, or ${Math.round(wKJ)} kJ/mol`
        ]
      },
      prompt: 'What is the d-orbital gap of the copper-ammonia complex in kJ/mol (to the nearest integer)?',
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
        'Read the wavelength at the center of the dark band, then enter your calculated gap.',
        'Follow the same steps as the worked 500 nm titanium example above.',
        'Compute E = hc ÷ λ with λ in metres, multiply by Avogadro\'s number, and divide by 1000 to convert J to kJ.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the gap in kJ/mol.' };
        if (Math.abs(v - GAP_KJ) <= 3) return { ok: true };
        if (Math.abs(v - GAP_KJ * 1000) <= 3000) return { ok: false, msg: `${v} is in J/mol, not kJ/mol. Divide by 1000.` };
        if (v < 1e-10) return { ok: false, msg: `${v} is the energy of a single photon. Multiply by Avogadro's number to get a mole.` };
        if (Math.abs(v - wKJ) <= 3) return { ok: false, msg: `${v} kJ/mol is titanium's 500 nm gap. Read the copper-ammonia band at ${GAP_NM} nm.` };
        return { ok: false, msg: `A gap of ${v} kJ/mol corresponds to ${Math.round(119627 / v)} nm, but this dark band is at ${GAP_NM} nm.` };
      },
      reward: {
        log: 'Copper-ammonia gap: 199 kJ/mol.',
        title: 'Gap From Wavelength',
        body: `One ${GAP_NM} nm photon carries ${(photonJ(GAP_NM) * 1e19).toFixed(2)} × 10⁻¹⁹ J, or ${Math.round(GAP_KJ)} kJ/mol. That is wider than copper in water, though narrower than titanium's 500 nm gap.`
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
      briefing: { speaker: SPEAKER, body: 'Drop each sealed vial in Sample and press "Shine Light" to see if a d electron can jump the gap, then sort the vials.' },
      prompt: 'Sort these four metal ions into coloured and colourless solutions.',
      widget,
      table: lodeTable({
        pieces: ids.map((id, i) => vial(`v-${id}`, id, { x: 8 + i * 14, y: 55 }, { sealedTint: true, name: COMPLEXES[id].formula.replace(/\[(\w+)\(H₂O\)₆\]/, '$1') })),
        fixtures: [D.fixture],
        zones: {
          slots: [D.slot],
          trays: [
            { id: 'coloured', label: 'Coloured', at: { x: 81, y: 55 }, size: { w: 40, h: 18 }, cell: 10, cellH: 18 },
            { id: 'clear', label: 'Colourless', at: { x: 125, y: 55 }, size: { w: 40, h: 18 }, cell: 10, cellH: 18 }
          ]
        }
      }),
      hints: [
        'Test each vial in Sample with "Shine Light", then drag it into a tray.',
        'Check whether the ion has both an electron in the lower level and an empty spot in the upper level.',
        'A solution absorbs visible light only if an electron can jump across the gap.'
      ],
      check(state) {
        const t = state.table;
        const off = ids.filter(id => !['tray:coloured', 'tray:clear'].includes(t.pieces[`v-${id}`].zone));
        if (off.length) return { ok: false, notYet: true, msg: `${off.length} vial${off.length > 1 ? 's still need' : ' still needs'} to be placed in a tray.` };
        const wrong = ids.find(id => (t.pieces[`v-${id}`].zone === 'tray:clear') !== COLOURLESS.has(id));
        if (!wrong) return { ok: true };
        const c = COMPLEXES[wrong];
        return { ok: false, msg: `Test ${c.formula} in Sample with "Shine Light" to see whether an electron can jump the gap.` };
      },
      reward: {
        log: 'Sc³⁺ and Zn²⁺ are colourless.',
        title: 'Nothing to Lift',
        body: 'Sc³⁺ has no d electrons to lift and Zn²⁺ has no empty upper spots to lift into, so neither absorbs visible light. Ti³⁺ and Cu²⁺ are coloured.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-drums',
    title: 'Two Cobalt Drums',
    prompt: 'Which of these two cobalt(III) drums has the wider d-orbital gap?',
    widget,
    table: lodeTable({
      pieces: [vial('v-y', 'co-nh3', { x: 22, y: 30 }, { name: 'Drum 1' }), vial('v-g', 'co-f', { x: 44, y: 30 }, { name: 'Drum 2' })],
      fixtures: [
        wheelFixture('wheel', { x: 84, y: 24 }, { size: 32 }),
        plaqueFixture('e', 'Photon energy', { x: 128, y: 22 }, ['violet: the most', 'blue, green, yellow', 'orange, red: the least'], { w: 38 })
      ],
      zones: { slots: [{ id: 'answer', label: 'The wider gap', at: { x: 33, y: 50 }, size: { w: 26, h: 18 } }] }
    }),
    hints: [
      'Note each drum\'s colour, then check the colour wheel and photon energy plate.',
      'Use the opposite side of the wheel to find which colour each drum absorbs.',
      'The wider gap absorbs the higher-energy photons.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Place a drum in the slot.' };
      if (card.id === 'v-y') return { ok: true };
      return { ok: false, msg: 'Find the colour Drum 2 absorbs on the wheel and compare its photon energy with Drum 1.' };
    },
    reward: {
      log: 'The yellow-orange drum has the wider gap.',
      title: 'Colour Reads the Gap',
      body: 'Drum 1 looks yellow-orange because it absorbs higher-energy blue light, while Drum 2 looks green because it absorbs lower-energy red light. Drum 1 has the wider gap.'
    }
  }
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Ligands split the five d orbitals into two energy levels. A complex absorbs photons matching that gap and shows the complementary colour, so changing the ligands changes both the gap and the colour.' }]
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const band = id => BANDS.findIndex(b => b.id === id) + 1;

export const SOLUTIONS = [
  [put('v-cu', 'slot:spec.holder'), dial('spec', 'band', band('orange'))],
  [dial('cf', 'near', 4), dial('cf', 'o1', 1), dial('cf', 'o2', 1)],
  [dial('ds', 'band', band('green'))],
  [put('g-same', 'slot:guess')],
  [put('v-cu', 'slot:spec.holder'), { run: 'spec' }, dial('spec', 'band', band('red'))],
  [{ type: { entry: 'kj', value: '199' } }],
  [put('v-sc-aq', 'tray:clear'), put('v-ti-aq', 'tray:coloured'), put('v-cu-aq', 'tray:coloured'), put('v-zn-aq', 'tray:clear')],
  [put('v-y', 'slot:answer')]
];

export const MISSES = [
  [put('v-cu', 'slot:spec.holder'), dial('spec', 'band', band('blue'))],
  [dial('cf', 'near', 4), dial('cf', 'o0', 1), dial('cf', 'o1', 1)],
  [dial('ds', 'band', band('red'))],
  [],
  [put('v-cu', 'slot:spec.holder'), { run: 'spec' }, dial('spec', 'band', band('orange'))],
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
