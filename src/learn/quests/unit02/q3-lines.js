/**
 * q3-lines.js — Lanternfall, bench three: LINE SPECTRA.
 *
 * The light bench's prism head, with gas tubes, and the energy-ladder plate.
 * The aurora over this ice field is the reason the bench exists: a glowing gas
 * does not give out a smear of colour but a handful of exact ones, and that is
 * the first thing anybody ever saw that said an atom's electrons are not free
 * to be anywhere. The quest goes from "which light is which" through "which
 * jump makes which line" to the one place the simple ladder fails.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  a hot filament beside a gas tube              -> continuous and line spectra
 *   2  name the gas in a sealed tube                 -> emission spectrum
 *   3  filament light through cool gas               -> absorption spectrum
 *   4  tap a line and see which rungs it joins       -> energy levels, ground and excited states
 *   5  the energy of one line                        -> the jump's energy leaves as one photon
 *   6  predict a line from the ladder                -> the Bohr model
 *   7  an electron given more than the whole ladder  -> ionization
 *   8  why the ladder fits hydrogen and not helium   -> the model's limit
 *
 * Every line is a real one (`lightdata.js`), every rung the real Bohr value
 * -2.18 x 10^-18 J / n^2, and every jump is asked of `planJump`, so the ladder
 * lights exactly the pair of rungs that makes the line the player tapped.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { LightBench } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { jumpForLine } from '../../engine/lightdata.js';
import { esc } from '../../../ui/layout.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bcontinuous spectrum\b/i, introducedAt: 1 },
  { term: /\bline spectrum\b/i, introducedAt: 1 },
  { term: /\bemission spectrum\b/i, introducedAt: 2 },
  { term: /\babsorption spectrum\b/i, introducedAt: 3 },
  { term: /\benergy levels?\b/i, introducedAt: 4 },
  { term: /\bground state\b/i, introducedAt: 4 },
  { term: /\bexcited states?\b/i, introducedAt: 4 },
  { term: /\bbohr\b/i, introducedAt: 6 },
  { term: /\bioniz\w*\b/i, introducedAt: 7 }
];

export const BUILDS_ON = ['unit02/q1-wave', 'unit02/q2-photon'];

const SPEAKER = 'Vess';

export function toolNoteFor() { return null; }

const LABELS = { band: 'Band', spacing: 'Wavelength', rate: 'Frequency' };

const TUBE = (id, gas, label, note = 'a glowing gas tube') => ({ id, label, head: 'prism', source: { type: 'tube', gas }, note });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Filament and Tube',
    briefing: {
      speaker: SPEAKER,
      body: 'Welcome to the optical spectrograph! Let\'s pass light from lamps and glowing aurora gases through our prisms to reveal the patterns they cast.'
    },
    prompt: 'Compare the lantern\'s glowing hot filament with the tube of excited gas. How does their light differ when spread across our scale?',
    labels: LABELS,
    controls: [],
    rigs: [
      { id: 'fil', label: 'FILAMENT', head: 'prism', source: { type: 'filament' }, note: 'a hot wire' },
      TUBE('tube', 'H', 'GAS TUBE')
    ],
    widget: {
      type: 'choice', label: 'The difference',
      options: [
        { id: 'right', label: 'The filament gives an unbroken band of every colour; the tube gives a few bright lines' },
        { id: 'flip', label: 'The filament gives a few bright lines; the tube gives an unbroken band of every colour' },
        { id: 'same', label: 'Both give the same unbroken band, the tube a little dimmer' },
        { id: 'dark', label: 'The tube gives dark lines on an unbroken band' }
      ]
    },
    hints: [
      'Look at the two plates side by side and tap a few positions on each band.',
      'Compare whether each band is filled from one end to the other or only lit in a few places.',
      'Note which plate lights every position on its scale and which lights only a few exact ones.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the difference.' };
      if (state.choice !== 'right') {
        return { ok: false, msg: 'Look at each band from end to end: which one is lit everywhere, and which one only in places?' };
      }
      return { ok: true };
    },
    reward: {
      log: 'A hot wire: every colour. A glowing gas: a few.',
      title: 'Line Spectrum',
      body: 'A hot solid gives off an unbroken band of every colour, a continuous spectrum, while a glowing gas gives off only a few bright lines, a line spectrum. The light from a gas is not a smear of colours but a set of exact ones.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Name the Gas',
    prompt: 'We recovered an unlabelled surveyor canister from the snowfields! Match its emission lines against our reference gases to identify what\'s inside.',
    labels: LABELS,
    controls: [],
    rigs: [
      TUBE('h', 'H', 'HYDROGEN', 'H, a reference tube'),
      TUBE('he', 'He', 'HELIUM', 'He, a reference tube'),
      TUBE('na', 'Na', 'SODIUM', 'Na, a reference tube'),
      TUBE('x', 'He', 'SEALED TUBE', 'a tube whose gas is not named')
    ],
    widget: {
      type: 'choice', label: 'The sealed gas',
      options: [
        { id: 'H', label: 'Hydrogen' },
        { id: 'He', label: 'Helium' },
        { id: 'Na', label: 'Sodium' }
      ]
    },
    hints: [
      'Tap the bright lines on the sealed tube\'s band and write down where each one sits.',
      'Compare the sealed tube\'s lines with the lines of each reference tube, position by position.',
      'Find the reference tube whose bright lines sit at exactly the same positions as every one of the sealed tube\'s.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the gas.' };
      if (state.choice !== 'He') {
        return { ok: false, msg: 'Match every line, not just one: the sealed tube\'s lines must sit exactly where that reference tube\'s do.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The sealed tube\'s lines matched one reference exactly.',
      title: 'Emission Spectrum',
      body: 'Every gas gives its own set of bright lines, so the lines work as a fingerprint that no other gas shares. The light a glowing gas gives out, read this way, is its emission spectrum.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Light Through Cool Gas',
    prompt: 'Now let\'s shine the continuous filament lamp through a cloud of cold hydrogen gas. What happens to the light on the bench?',
    labels: LABELS,
    controls: [],
    rigs: [
      { id: 'fil', label: 'FILAMENT', head: 'prism', source: { type: 'filament' }, note: 'a hot wire, nothing in front' },
      { id: 'cool', label: 'FILAMENT THROUGH GAS', head: 'prism', source: { type: 'cool', gas: 'H' }, note: 'the same wire behind a cool hydrogen tube' },
      TUBE('hot', 'H', 'HOT HYDROGEN', 'H, glowing')
    ],
    widget: {
      type: 'choice', label: 'What the cool gas does',
      options: [
        { id: 'takes', label: 'It removes the colours the hot gas gives out, at the same positions' },
        { id: 'adds', label: 'It adds bright lines to the unbroken band' },
        { id: 'dim', label: 'It dims every colour by the same amount' },
        { id: 'shift', label: 'It moves every colour toward red' }
      ]
    },
    hints: [
      'Compare the band behind the cool gas with the band of the bare filament.',
      'Tap the dark places in the band behind the gas and compare their positions with the hot hydrogen tube\'s bright lines.',
      'Note whether the dark places and the bright lines sit at the same positions on the nm scale.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what the cool gas does.' };
      if (state.choice !== 'takes') {
        return { ok: false, msg: 'Compare the band behind the gas with the bare filament\'s, then compare the places where they differ with the hot tube\'s lines.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Cool hydrogen takes out exactly what hot hydrogen gives.',
      title: 'Absorption Spectrum',
      body: 'Cool hydrogen takes out of the filament\'s light exactly the colours that hot hydrogen gives out, leaving dark lines in the band. That pattern of missing colours is the absorption spectrum, and its lines sit where the emission lines do.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Which Jump',
    prompt: 'Watch the atomic ladder beside the tube! Which electron drop between rungs produces the bright red emission line?',
    labels: LABELS,
    controls: [],
    ladder: 'ladder',
    rigs: [
      TUBE('tube', 'H', 'HYDROGEN', 'H, glowing'),
      { id: 'ladder', label: 'LADDER', head: 'ladder', note: 'the rungs of hydrogen' }
    ],
    widget: {
      type: 'choice', label: 'The jump',
      options: [
        { id: 'j32', label: 'From the third rung to the second' },
        { id: 'j42', label: 'From the fourth rung to the second' },
        { id: 'j21', label: 'From the second rung to the first' },
        { id: 'j23', label: 'From the second rung to the third' }
      ]
    },
    hints: [
      'Tap each bright line on the band and watch which two rungs light on the ladder.',
      'Find which line is the red one, then read the pair of rungs the ladder lights when you tap it.',
      'Note which rung the electron starts on and which it lands on, remembering that light leaves as it falls.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the jump.' };
      if (state.choice === 'j23') {
        return { ok: false, msg: 'Light is given out when an electron drops, so the jump must run from a higher rung to a lower one.' };
      }
      if (state.choice !== 'j32') {
        return { ok: false, msg: 'Tap the red line itself and read which rungs the ladder lights; do not judge from the colour alone.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The red line: down from the third rung to the second.',
      title: 'Energy Levels',
      body: 'An electron in hydrogen can only sit on certain rungs, called energy levels, and each line in the spectrum is a jump down between two of them. The lowest rung is the ground state, and any higher one is an excited state.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Energy of a Line',
    prompt: 'Let\'s measure the energy of that brilliant cyan 486 nm emission line! Use the worked 656 nm line on the bench to guide your calculation.',
    labels: LABELS,
    controls: [],
    ladder: 'ladder',
    reference: ['Worked line: 656 nm is 3.03 x 10^-19 J', 'Planck\'s constant 6.626 x 10^-34 J s, light speed 3.00 x 10^8 m/s'],
    rigs: [
      TUBE('tube', 'H', 'HYDROGEN', 'H, glowing'),
      { id: 'ladder', label: 'LADDER', head: 'ladder', note: 'the rungs of hydrogen' }
    ],
    widget: { type: 'decimal', label: 'Energy of the 486 nm line (x 10^-19 J)', min: 3.5, max: 4.5, step: 0.1 },
    hints: [
      'Use the worked figure for the 656 nm line to see how a wavelength turns into an energy.',
      'Turn 486 nm into a frequency with the speed of light, then multiply by Planck\'s constant.',
      'Convert 486 nm to metres with 10^-9, divide the speed of light by it, and multiply the result by 6.626 x 10^-34 J s.'
    ],
    check(state) {
      if (state.decimal === 3.5) return { ok: false, notYet: true, msg: 'Set the energy you worked out.' };
      if (state.decimal !== 4.1) {
        return { ok: false, msg: 'Check the method on the worked 656 nm line first, then apply it to this line.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The 486 nm line carries 4.09 x 10^-19 J.',
      title: 'Energy Out Equals Energy Lost',
      body: 'The energy given out in a jump is exactly the difference between the two rungs, and it leaves as one photon: ΔE = hν. A bigger drop gives a photon of higher frequency, which is why the blue line comes from a bigger drop than the red.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'A Line Not Yet Seen',
    prompt: 'The Bohr ladder predicts lines before we even measure them! Which wavelength matches an electron dropping from the 5th rung to the 2nd?',
    labels: LABELS,
    controls: [],
    ladder: 'ladder',
    reference: ['Rung n sits at -2.18 x 10^-18 J / n^2', 'Planck\'s constant 6.626 x 10^-34 J s, light speed 3.00 x 10^8 m/s'],
    rigs: [
      TUBE('tube', 'H', 'HYDROGEN', 'H, glowing'),
      { id: 'ladder', label: 'LADDER', head: 'ladder', note: 'the rungs of hydrogen' }
    ],
    widget: {
      type: 'choice', label: 'The line it makes',
      options: [
        { id: '410', label: '410 nm' },
        { id: '434', label: '434 nm' },
        { id: '486', label: '486 nm' },
        { id: '656', label: '656 nm' }
      ]
    },
    hints: [
      'Work out the energy of the fifth rung and of the second, using the formula on the plate.',
      'Subtract the lower rung\'s energy from the higher one\'s to get the energy given out in the jump.',
      'Turn that energy into a wavelength by dividing Planck\'s constant times the speed of light by it, turning metres into nm with 10^9, then find that wavelength on the band.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick a line.' };
      if (state.choice !== '434') {
        return { ok: false, msg: 'Work the jump through with the formula, and check your wavelength against the lines on the band.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The formula predicts a line the player never tapped.',
      title: 'The Bohr Model',
      body: 'The Bohr model puts hydrogen\'s electron on rungs at -2.18 x 10^-18 J divided by n squared, and from that one formula it predicts every line of hydrogen\'s visible spectrum to within a nanometre or two. A drop from the fifth rung to the second gives 434 nm, exactly as measured.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Past the Top',
    prompt: 'What happens if an electron absorbs an intense burst of energy that exceeds the very top of the ladder?',
    labels: LABELS,
    controls: [],
    ladderTop: 'gone',
    rigs: [
      TUBE('tube', 'H', 'HYDROGEN', 'H, glowing'),
      { id: 'ladder', label: 'LADDER', head: 'ladder', note: 'the top of the ladder is open' }
    ],
    widget: {
      type: 'choice', label: 'What happens',
      options: [
        { id: 'leaves', label: 'It leaves the atom altogether' },
        { id: 'top', label: 'It lands on the highest rung and stays there' },
        { id: 'drops', label: 'It drops back to the ground state at once' },
        { id: 'stays', label: 'It stays where it is, because only exact amounts are taken' }
      ]
    },
    hints: [
      'Look at the top of the ladder and read what the open edge says.',
      'Compare the energy given with the distance from the ground-state rung up to the open top.',
      'An electron given more than the whole climb has no rung left to land on.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what happens.' };
      if (state.choice !== 'leaves') {
        return { ok: false, msg: 'Compare the energy given with the whole height of the ladder, and read the label at its top.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The top of the ladder is open: the electron is gone.',
      title: 'Ionization',
      body: 'Give an electron more than the whole climb and it leaves the atom altogether, which is ionization. Hydrogen\'s electron needs exactly 2.18 x 10^-18 J to climb from its ground state to the open top.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Helium Does Not Fit',
    prompt: 'The Bohr model works wonders for hydrogen, but fails to predict helium\'s spectrum. Why doesn\'t the simple ladder fit helium?',
    labels: LABELS,
    controls: [],
    ladder: 'ladder',
    ladderTop: 'gone',
    rigs: [
      TUBE('h', 'H', 'HYDROGEN', 'H, glowing'),
      TUBE('he', 'He', 'HELIUM', 'He, glowing'),
      { id: 'ladder', label: 'LADDER', head: 'ladder', note: 'the rungs of hydrogen' }
    ],
    widget: {
      type: 'choice', label: 'Why it fails',
      options: [
        { id: 'two', label: 'Helium has two electrons pulling on each other, so its rungs do not follow the hydrogen ladder' },
        { id: 'many', label: 'Helium simply has too many lines to fit on a ladder' },
        { id: 'none', label: 'Helium\'s electrons are not on rungs at all' },
        { id: 'cold', label: 'The helium tube is not hot enough to show its true lines' }
      ]
    },
    hints: [
      'Tap each of helium\'s lines and watch what the ladder does compared with hydrogen\'s.',
      'Compare how many electrons helium has with how many hydrogen has, and what each electron feels.',
      'The ladder\'s formula was built for one electron alone, so ask what a second electron changes.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the reason.' };
      if (state.choice !== 'two') {
        return { ok: false, msg: 'Tap helium\'s lines and see what the ladder does with them, then ask what is different about helium\'s atom.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One electron fits the ladder; two do not.',
      title: 'Where the Model Stops',
      body: 'The ladder fits hydrogen because hydrogen\'s one electron has nothing else to feel. Helium\'s two electrons push on each other, so its rungs no longer follow the formula and the Bohr model cannot place its lines.',
      last: true
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
      body: 'An atom\'s electrons sit only on certain energy levels, and light is given out or taken in exactly when an electron moves between two of them. Each gas therefore has a line spectrum no other gas shares, and the Bohr model reads hydrogen\'s from one formula.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every aurora, every neon sign and every star is read this way. The colours say which atoms are there, and the dark lines say which cool atoms lie in front of them.'
    },
    {
      heading: 'Next',
      body: 'The ladder breaks for helium because an electron is not a bead on a rung. The next bench asks where an electron actually is.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A gas tube gives out a few bright lines on a dark background. This is:',
    options: [
      { id: 'a', label: 'An emission line spectrum' },
      { id: 'b', label: 'A continuous spectrum' },
      { id: 'c', label: 'An absorption spectrum' },
      { id: 'd', label: 'A white-light spectrum' }
    ],
    answer: 'a',
    explanation: 'A glowing gas gives out only certain wavelengths, so its spectrum is a few bright lines. A hot solid gives a continuous band, and cool gas in front of one gives dark absorption lines.'
  },
  {
    question: 'An electron in a hydrogen atom drops from n = 3 to n = 2. What happens?',
    options: [
      { id: 'a', label: 'A photon with energy equal to the difference between the two levels is given out' },
      { id: 'b', label: 'A photon is absorbed' },
      { id: 'c', label: 'Nothing, because the electron stays in the atom' },
      { id: 'd', label: 'The atom is ionized' }
    ],
    answer: 'a',
    explanation: 'Falling to a lower level gives up the energy difference, and it leaves as one photon. Absorbing a photon would raise the electron, and ionization needs the electron to leave altogether.'
  },
  {
    question: 'In the Bohr model of hydrogen, which jump gives out the photon of highest frequency?',
    options: [
      { id: 'a', label: 'n = 6 to n = 2' },
      { id: 'b', label: 'n = 3 to n = 2' },
      { id: 'c', label: 'n = 4 to n = 3' },
      { id: 'd', label: 'n = 5 to n = 4' }
    ],
    answer: 'a',
    explanation: 'The bigger the drop in energy, the higher the photon\'s frequency. The levels crowd closer together as n grows, so the drop from n = 6 to n = 2 is the largest of the four.'
  },
  {
    question: 'The Bohr levels of hydrogen are E = -2.18 x 10^-18 J / n^2. How much energy lifts an electron from n = 1 to n = 2?',
    options: [
      { id: 'a', label: '1.64 x 10^-18 J' },
      { id: 'b', label: '2.18 x 10^-18 J' },
      { id: 'c', label: '5.45 x 10^-19 J' },
      { id: 'd', label: '2.73 x 10^-18 J' }
    ],
    answer: 'a',
    explanation: 'E(1) = -2.18 x 10^-18 J and E(2) = -2.18 x 10^-18 / 4 = -5.45 x 10^-19 J. The difference is 2.18 x 10^-18 - 5.45 x 10^-19 = 1.64 x 10^-18 J.'
  },
  {
    question: 'Why does the Bohr model fail for atoms with more than one electron?',
    options: [
      { id: 'a', label: 'It ignores the repulsion between electrons, which changes the energy levels' },
      { id: 'b', label: 'It only works for gases' },
      { id: 'c', label: 'Larger atoms have no energy levels' },
      { id: 'd', label: 'Photons cannot be absorbed by larger atoms' }
    ],
    answer: 'a',
    explanation: 'The model was built for one electron attracted by one nucleus. With a second electron the two repel each other, and the simple 1/n^2 pattern no longer fits the levels.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: 'right' },
  { choice: 'He' },
  { choice: 'takes' },
  { choice: 'j32' },
  { decimal: 4.1 },
  { choice: '434' },
  { choice: 'leaves' },
  { choice: 'two' }
];

export const MISSES = [
  { choice: 'flip' },
  { choice: 'H' },
  { choice: 'adds' },
  { choice: 'j42' },
  { decimal: 4.4 },
  { choice: '486' },
  { choice: 'top' },
  { choice: 'many' }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let bench = null;
  let runner = null;

  function onProbe(hit) {
    if (hit.kind !== 'prism') return;
    const stage = runner.stage;
    const where = `Under the cursor: ${hit.nm} nm${hit.onLine ? ', on a line' : ''}.`;
    if (stage.ladder && hit.onLine) {
      const jump = jumpForLine(hit.nm);
      if (jump) {
        bench.showJump(stage.ladder, jump.hi, jump.lo);
        runner.readout(`Band // ${hit.plateLabel}`, `${where} The ladder lights the jump from rung ${jump.hi} to rung ${jump.lo}.`);
      } else {
        bench.clearJump();
        runner.readout(`Band // ${hit.plateLabel}`, `${where} No pair of rungs on this ladder gives that line.`);
      }
      return;
    }
    runner.readout(`Band // ${hit.plateLabel}`, where);
  }

  function onLoad(stage, i, r) {
    bench.setRigs(stage.rigs, { labels: stage.labels, ladderTop: stage.ladderTop || '' });
    bench.setSelectable(false);
    const parts = [];
    if (stage.reference?.length) {
      parts.push(`
        <div class="assay-extract">
          <span class="form-label">On the plate</span>
          <ul>${stage.reference.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
      `);
    }
    r.setControls(parts, null);
    r.readout(null, null, { idleHead: 'Band // standby', idle: 'Tap a position on a band to read it.' });
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { bench = LightBench(r.frame.instrumentHost, { onProbe }); },
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
