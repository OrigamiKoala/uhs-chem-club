/**
 * q7-pes.js — Lanternfall, bench seven: PHOTOELECTRON SPECTROSCOPY.
 *
 * The electron bench's spectrum head. Fire light of enough energy at a specimen
 * and every electron is knocked loose; each lands on a strip graded in binding
 * energy, and the heights add up. The result is the configuration drawn out,
 * and it is the strongest evidence this world offers that the rows you filled
 * on the last bench are real: one peak per row, as tall as the row is full.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  hydrogen's and helium's spectra            -> photoelectron spectrum
 *   2  what the height of a peak counts           -> (height is a count)
 *   3  lithium's short peak far from its tall one -> binding energy
 *   4  boron's two peaks in one shell             -> subshells
 *   5  a sealed specimen, from its heights        -> (heights add to the atomic number)
 *   6  neon's inner peak against fluorine's       -> (more protons, a tighter hold)
 *   7  three spectra, matched to three elements   -> (one electron more at a time)
 *   8  the configuration a sealed spectrum shows  -> the spectrum is the configuration
 *
 * THE ROWS' NAMES ARE NEVER ON THE BENCH. A peak is a position and a height and
 * nothing else; stage eight asks the player to turn that into a configuration,
 * and a readout that said "2p" would be doing it for them.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { ElectronBench } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { spectrumOf } from '../../engine/electronbench.js';
import { esc } from '../../../ui/layout.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bphotoelectron spectr(?:um|a)\b/i, introducedAt: 1 },
  { term: /\bbinding energy\b/i, introducedAt: 3 },
  { term: /\bsubshells?\b/i, introducedAt: 4 }
];

export const BUILDS_ON = ['unit02/q6-filling', 'unit02/q2-photon'];

const SPEAKER = 'Vess';

const TOOL_TEXT = {
  fire: { key: 'Fire Light', what: 'Knocks electrons off each specimen with high-energy light and plots what comes out.' }
};

export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const PLAIN = { energy: 'ENERGY TO REMOVE' };
const EARNED = { energy: 'BINDING ENERGY' };

const spec = (id, sym, extra = {}) => ({ id, label: extra.label || `SAMPLE ${id.toUpperCase()}`, head: 'spectrum', sym, note: extra.note || '', ...extra });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Two Spectra',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench knocks electrons off a specimen and plots how many come out at each energy. Tap each tall line — a peak — to read its position and height.'
    },
    prompt: 'Find what Sample B\'s spectrum says beside Sample A\'s.',
    labels: PLAIN,
    controls: ['fire'],
    rigs: [spec('a', 'H', { note: 'an atom with one electron' }), spec('b', 'He', { note: 'an atom with two electrons' })],
    widget: {
      type: 'choice', label: 'What it says',
      options: [
        { id: 'tight', label: 'B has twice as many electrons, and holds them more tightly' },
        { id: 'loose', label: 'B has twice as many electrons, and holds them less tightly' },
        { id: 'few', label: 'A has twice as many electrons as B' },
        { id: 'same', label: 'The two are the same, only drawn at different sizes' }
      ]
    },
    hints: [
      'Press "Fire Light" and tap the peak on each plate.',
      'Compare the height of each peak, and where each one sits on the energy axis.',
      'Note which peak is taller and which sits further toward the high-energy end of the axis.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what it says.' };
      if (state.choice !== 'tight') {
        return { ok: false, msg: 'Fire the light and compare both the heights and the positions of the two peaks before you choose.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'A taller peak, further along the axis.',
      title: 'Photoelectron Spectrum',
      body: 'Counting how many electrons come out at each energy gives a photoelectron spectrum. The position of a peak says how much energy it takes to remove those electrons, and its height says how many of them there are.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What Height Counts',
    prompt: 'Find what the height of a peak counts.',
    labels: PLAIN,
    controls: ['fire'],
    rigs: [spec('a', 'He', { note: 'two electrons' }), spec('b', 'Li', { note: 'three electrons' })],
    widget: {
      type: 'choice', label: 'What the height counts',
      options: [
        { id: 'n', label: 'How many electrons came out at that energy' },
        { id: 'tight', label: 'How tightly each electron was held' },
        { id: 'fast', label: 'How fast the electrons left' },
        { id: 'big', label: 'How big the atom is' }
      ]
    },
    hints: [
      'Press "Fire Light" and tap every peak on both plates.',
      'Compare the heights of the peaks on each plate with the number of electrons the plate\'s note gives.',
      'Add up the heights of all the peaks on a plate and compare the total with its electrons.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what the height counts.' };
      if (state.choice !== 'n') {
        return { ok: false, msg: 'Add the heights on each plate and compare the total with the number of electrons in its note.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The heights add up to the electrons.',
      title: 'Height Is a Count',
      body: 'A peak is exactly as tall as the number of electrons that came out at its energy, so the heights on a plate always add up to all the electrons in the atom. Position says how tightly they were held, and height says how many there were.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Lithium\'s Short Peak',
    prompt: 'Explain lithium\'s short peak beside its tall one.',
    labels: EARNED,
    controls: ['fire'],
    rigs: [spec('a', 'Li', { label: 'LITHIUM', showRings: true, note: 'Li, its rings beside the spectrum' })],
    widget: {
      type: 'choice', label: 'Why',
      options: [
        { id: 'outer', label: 'One electron sits on the outer ring, farther from the nucleus and held less tightly' },
        { id: 'tight', label: 'One electron sits on the outer ring and is held more tightly than the other two' },
        { id: 'mix', label: 'The short peak is a second kind of atom mixed into the sample' },
        { id: 'weak', label: 'The lamp was too weak to knock the last electron off properly' }
      ]
    },
    hints: [
      'Press "Fire Light", tap both peaks and look at the rings drawn beside them.',
      'Compare the number of electrons on each ring with the height of each peak.',
      'Match the single electron on the outer ring to the short peak, and ask whether it is held more or less tightly than the other two.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the reason.' };
      if (state.choice !== 'outer') {
        return { ok: false, msg: 'Match each peak to the ring whose electrons it counts, then compare how far from the nucleus each ring is.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The outer electron is the loosely held one.',
      title: 'Binding Energy',
      body: 'The energy needed to remove an electron is its binding energy, and the closer an electron sits to the nucleus the more tightly it is bound. Spectra are often drawn with the energy running the other way, high at the left, but the peaks mean the same.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Boron\'s Second Shell',
    prompt: 'Explain why boron\'s second shell shows two peaks.',
    labels: EARNED,
    controls: ['fire'],
    rigs: [spec('a', 'B', { label: 'BORON', showRings: true, note: 'B, its rings beside the spectrum' })],
    widget: {
      type: 'choice', label: 'Why',
      options: [
        { id: 'sub', label: 'The second shell holds two kinds of row, 2s and 2p, whose electrons are held differently' },
        { id: 'two', label: 'Boron\'s second shell holds two different kinds of atom' },
        { id: 'first', label: 'One of the two peaks is the first shell showing through' },
        { id: 'same', label: 'All three outer electrons are held alike, so the peaks only overlap' }
      ]
    },
    hints: [
      'Press "Fire Light" and tap the two peaks that come from the second shell.',
      'Compare their heights with the number of electrons in the 2s and 2p rows you filled on the last bench.',
      'Match the taller of the two peaks to the row that holds two electrons and the shorter to the row that holds one.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the reason.' };
      if (state.choice !== 'sub') {
        return { ok: false, msg: 'Tap both peaks, compare their heights with how many electrons each row of the rack held, and see what the two positions have in common.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One shell, two rows, two peaks.',
      title: 'Subshells',
      body: 'Within one shell the electrons sit in rows of different shapes, called subshells, and each subshell gives its own peak. In boron the 2s subshell is held a little more tightly than 2p, so its two electrons make the taller peak, a little further along.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Name the Specimen',
    prompt: 'Identify the sealed specimen from its spectrum.',
    labels: EARNED,
    controls: ['fire'],
    reference: ['CAT 06: carbon', 'CAT 07: nitrogen', 'CAT 08: oxygen', 'CAT 09: fluorine'],
    rigs: [spec('b', 'O', { label: 'SEALED SPECIMEN', note: 'an atom whose element is not named' })],
    widget: {
      type: 'choice', label: 'The element',
      options: [
        { id: 'C', label: 'Carbon' },
        { id: 'N', label: 'Nitrogen' },
        { id: 'O', label: 'Oxygen' },
        { id: 'F', label: 'Fluorine' }
      ]
    },
    hints: [
      'Press "Fire Light" and tap every peak on the sealed specimen\'s plate.',
      'Add up the heights of all the peaks to count the electrons in the atom.',
      'A neutral atom has as many electrons as its atomic number, so find the element whose code matches your total.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the element.' };
      if (state.choice !== 'O') {
        return { ok: false, msg: 'Add up every peak\'s height and compare the total with the number of electrons in each candidate.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The heights summed to the atomic number.',
      title: 'Reading an Unknown',
      body: 'The heights add up to the number of electrons, and in a neutral atom that equals its atomic number. Peaks of 2, 2 and 4 therefore belong to the element with eight electrons, which is oxygen.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Neon and Fluorine',
    prompt: 'Explain why neon\'s innermost peak sits further along than fluorine\'s.',
    labels: EARNED,
    controls: ['fire'],
    rigs: [
      spec('a', 'F', { label: 'FLUORINE', showRings: true, showProtons: true, note: 'F' }),
      spec('b', 'Ne', { label: 'NEON', showRings: true, showProtons: true, note: 'Ne' })
    ],
    widget: {
      type: 'choice', label: 'Why',
      options: [
        { id: 'protons', label: 'Neon\'s nucleus holds one more proton, so it pulls its inner electrons harder' },
        { id: 'more', label: 'Neon has more electrons in its first shell' },
        { id: 'farther', label: 'Neon\'s inner electrons sit farther from its nucleus' },
        { id: 'noble', label: 'Noble gases hold every electron equally tightly' }
      ]
    },
    hints: [
      'Press "Fire Light" and compare the innermost peak on each plate.',
      'Compare the number of electrons in the first shell of each atom, and the number of protons each nucleus holds.',
      'Both atoms have the same two electrons in the first shell, so look at what differs in the nucleus pulling on them.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the reason.' };
      if (state.choice !== 'protons') {
        return { ok: false, msg: 'Compare the two plates: find what is the same about their first shells and what is different about the nuclei that hold them.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'A bigger nuclear charge holds the same shell harder.',
      title: 'More Charge, Tighter Hold',
      body: 'Neon\'s first-shell electrons feel ten protons and fluorine\'s feel nine, and the extra proton holds them noticeably tighter. The same two electrons in the same shell need more energy to remove from the atom with the bigger nuclear charge.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Three Neighbours',
    prompt: 'Match each spectrum to sodium, magnesium or aluminum.',
    labels: EARNED,
    controls: ['fire'],
    rigs: [
      spec('x', 'Mg', { note: 'an atom from the third row of the catalogue' }),
      spec('y', 'Al', { note: 'an atom from the third row of the catalogue' }),
      spec('z', 'Na', { note: 'an atom from the third row of the catalogue' })
    ],
    widget: {
      type: 'bins', label: 'Which element',
      rows: [{ id: 'x', label: 'Sample X' }, { id: 'y', label: 'Sample Y' }, { id: 'z', label: 'Sample Z' }],
      bins: [
        { id: 'na', label: 'Sodium', note: '' },
        { id: 'mg', label: 'Magnesium', note: '' },
        { id: 'al', label: 'Aluminum', note: '' }
      ]
    },
    hints: [
      'Press "Fire Light" and add up the heights on each plate to count its electrons.',
      'Compare the peaks furthest to the left, which come from the outermost electrons, across the three plates.',
      'The element with the fewest electrons has the single outer peak, and the one with the most has an extra peak beside it.'
    ],
    check(state) {
      const rows = ['x', 'y', 'z'];
      if (rows.some(r => !state.bins[r])) return { ok: false, notYet: true, msg: 'Match all three spectra.' };
      const want = { x: 'mg', y: 'al', z: 'na' };
      for (const r of rows) {
        if (state.bins[r] !== want[r]) {
          return { ok: false, msg: 'Count the electrons in each spectrum and look at how the outermost peak changes from one element to the next.' };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'One more electron each time; one more peak at the end.',
      title: 'One More at a Time',
      body: 'Across the third row each new element adds one electron to the outer row, so the last peak grows from one electron to two and then a new, separate peak appears beside it. The inner peaks barely change, which is why the outer ones carry the chemistry.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Sealed Specimen\'s Rows',
    prompt: 'Write the configuration that the sealed specimen\'s spectrum shows.',
    labels: EARNED,
    controls: ['fire'],
    rigs: [spec('c', 'N', { label: 'SEALED SPECIMEN', note: 'an atom whose element is not named' })],
    widget: {
      type: 'choice', label: 'The configuration',
      options: [
        { id: 'p3', label: '1s² 2s² 2p³' },
        { id: 'p4', label: '1s² 2s² 2p⁴' },
        { id: 's3', label: '1s² 2s³ 2p²' },
        { id: 'p2', label: '1s² 2s² 2p²' }
      ]
    },
    hints: [
      'Press "Fire Light" and tap every peak to read its height.',
      'Order the peaks from the one held most tightly to the one held least, which is the order the rows fill in.',
      'Write each peak\'s height as the number of electrons in the next row up the ladder, from the first row onward.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the configuration.' };
      if (state.choice !== 'p3') {
        return { ok: false, msg: 'List the peaks in order of how tightly they are held and write each height beside the next row of the ladder.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Peak by peak, the spectrum is the arrangement.',
      title: 'The Spectrum Is the Configuration',
      body: 'A photoelectron spectrum is the electron configuration drawn out: each peak is a row, and its height is how many electrons the row holds. Read from the most tightly held peak to the least, it spells the configuration row by row.',
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
      body: 'A photoelectron spectrum has one peak for every subshell: its height is how many electrons the subshell holds and its position is how tightly they are held. It is the configuration measured instead of written.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'This is the experiment that proved the rows you filled on the rack are real. Nobody drew the ladder in; the spectrum shows it.'
    },
    {
      heading: 'Next',
      body: 'Binding energy has a pattern across the whole table. The next bench measures the pull on an electron directly and follows it across and down.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'In a photoelectron spectrum, what does the height of a peak represent?',
    options: [
      { id: 'a', label: 'The number of electrons in that subshell' },
      { id: 'b', label: 'The energy of the electrons' },
      { id: 'c', label: 'The speed of the electrons' },
      { id: 'd', label: 'The size of the atom' }
    ],
    answer: 'a',
    explanation: 'Peak height is proportional to the number of electrons removed at that binding energy, which is the number in that subshell. Position gives the binding energy.'
  },
  {
    question: 'A photoelectron spectrum shows three peaks, with relative heights 2, 2 and 3. Which element is it?',
    options: [
      { id: 'a', label: 'Nitrogen' },
      { id: 'b', label: 'Carbon' },
      { id: 'c', label: 'Oxygen' },
      { id: 'd', label: 'Boron' }
    ],
    answer: 'a',
    explanation: 'The configuration 1s² 2s² 2p³ has 7 electrons, which is nitrogen.'
  },
  {
    question: 'Why is the 1s peak of neon at a higher binding energy than the 1s peak of fluorine?',
    options: [
      { id: 'a', label: 'Neon\'s nucleus has more protons, so it holds its 1s electrons more tightly' },
      { id: 'b', label: 'Neon has more shells' },
      { id: 'c', label: 'Neon\'s 1s electrons are farther from its nucleus' },
      { id: 'd', label: 'Fluorine has no 1s electrons' }
    ],
    answer: 'a',
    explanation: 'Both have two 1s electrons at about the same distance. Neon\'s nuclear charge is greater by one proton, so those electrons are bound more tightly.'
  },
  {
    question: 'The binding energy of the 2p electrons in an atom is lower than that of its 2s electrons. This is because:',
    options: [
      { id: 'a', label: 'The 2p electrons are on average farther from the nucleus and partly shielded by the 2s' },
      { id: 'b', label: 'The 2p electrons have no charge' },
      { id: 'c', label: 'The 2p electrons are in a lower shell' },
      { id: 'd', label: 'The 2s electrons are heavier' }
    ],
    answer: 'a',
    explanation: 'A 2p electron sits slightly farther out on average and feels some shielding from 2s electrons, so it is held less tightly than a 2s electron.'
  },
  {
    question: 'How many peaks would the photoelectron spectrum of sodium (1s² 2s² 2p⁶ 3s¹) show?',
    options: [
      { id: 'a', label: '4' },
      { id: 'b', label: '3' },
      { id: 'c', label: '11' },
      { id: 'd', label: '1' }
    ],
    answer: 'a',
    explanation: 'One peak for every occupied subshell: 1s, 2s, 2p and 3s make four peaks, with heights 2, 2, 6 and 1.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: 'tight' },
  { choice: 'n' },
  { choice: 'outer' },
  { choice: 'sub' },
  { choice: 'O' },
  { choice: 'protons' },
  { bins: { x: 'mg', y: 'al', z: 'na' } },
  { choice: 'p3' }
];

export const MISSES = [
  { choice: 'loose' },
  { choice: 'tight' },
  { choice: 'tight' },
  { choice: 'same' },
  { choice: 'F' },
  { choice: 'farther' },
  { bins: { x: 'na', y: 'mg', z: 'al' } },
  { choice: 'p4' }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

export { spectrumOf };

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let bench = null;
  let runner = null;

  function onProbe(hit) {
    if (hit.kind === 'peak') {
      runner.readout(`Peak // ${hit.rig.label}`, `${hit.energy} MJ/mol, ${hit.height} ${hit.height === 1 ? 'electron' : 'electrons'}.`);
    }
  }

  function onTool(tool) {
    if (tool === 'fire') {
      bench.fire();
      runner.readout('Light // fired', 'Every plate is filling in. Tap a peak to read it.');
    }
  }

  function onLoad(stage, i, r) {
    bench.setPlates(stage.rigs, { labels: stage.labels });
    bench.setSelectable(false);
    const parts = [
      '<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="fire">Fire Light</button>'
    ];
    if (stage.reference?.length) {
      parts.push(`
        <div class="assay-extract">
          <span class="form-label">Catalogue</span>
          <ul>${stage.reference.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
      `);
    }
    r.setControls(parts, onTool);
    r.readout(null, null, { idleHead: 'Bench // standby', idle: 'Fire the light, then tap a peak.' });
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { bench = ElectronBench(r.frame.instrumentHost, { onProbe }); },
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
