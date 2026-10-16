/**
 * q8-trends.js — Lanternfall, bench eight: PERIODIC TRENDS.
 *
 * The electron bench's atom head, with its pull meter. Bench seven showed that
 * rows exist; this one measures what holds an electron in one and follows the
 * answer across the table and down it. The whole bench is one law applied three
 * ways — charge pulls, distance weakens it, and other electrons in the way cancel
 * some of it — and every trend the course teaches falls out of that.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  what makes the pull on an electron stronger   -> Coulomb's law
 *   2  why sodium's outer electron feels +1, not +11  -> shielding, effective nuclear charge
 *   3  four atoms, by size                            -> atomic radius
 *   4  why potassium is bigger than sodium            -> (one more shell)
 *   5  Na+, Na and Cl-, by size                       -> ionic radius
 *   6  three atoms, by what it costs to strip one     -> ionization energy
 *   7  which charge magnesium takes                   -> successive ionization energies
 *   8  four atoms, by their pull on a shared pair     -> electronegativity, electron affinity
 *
 * EVERY FIGURE IS REAL. The radii (pm), the first ionization energies (kJ/mol)
 * and magnesium's successive ones come from `electrons.js`; the pull is
 * Coulomb's law over the declared nuclear charge, the electrons in the shells
 * below and the real radius (`planPull`), so the bench shows the trend without
 * being told it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { ElectronBench } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { planPull, shellsOf } from '../../engine/electronbench.js';
import { RADIUS, ION_RADIUS, IONIZATION, MG_SUCCESSIVE, zOf, nameOf } from '../../engine/electrons.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\belectron affinity\b/i, introducedAt: 8 },
  { term: /\belectronegativity\b/i, introducedAt: 8 },
  { term: /\bsuccessive ionization energies\b/i, introducedAt: 7 },
  { term: /\bionization energ(?:y|ies)\b/i, introducedAt: 6 },
  { term: /\bionic radi(?:us|i)\b/i, introducedAt: 5 },
  { term: /\batomic radi(?:us|i)\b/i, introducedAt: 3 },
  { term: /\beffective nuclear charge\b/i, introducedAt: 2 },
  { term: /\bshielding\b/i, introducedAt: 2 },
  { term: /\bcoulomb.?s law\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q7-pes', 'unit02/q6-filling'];

const SPEAKER = 'Vess';

const TOOL_TEXT = {};
export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

/** The words the meter panel prints, plain until the stage that names them. */
const L1 = { feel: 'CHARGE IT FEELS', feelText: 'charge it feels' };
const L2 = { feel: 'EFF. NUCLEAR CHARGE', feelText: 'effective nuclear charge' };

const atom = (sym, extra = {}) => ({
  id: extra.id || sym.toLowerCase(),
  label: extra.label || `${nameOf(sym).toUpperCase()} (${sym})`,
  head: 'atom', sym,
  radius: RADIUS[sym], ie: IONIZATION[sym],
  note: extra.note || '',
  ...extra
});

const kjmol = n => `${n} kJ/mol`;

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'What Makes the Pull',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench models atoms to scale to measure distance and pull on each electron. Tapping an electron shows the charge at the center, the distance, and the pull felt.'
    },
    prompt: 'What physical factors make the electrostatic pull on an electron stronger?',
    labels: L1,
    show: { core: true },
    controls: [],
    rigs: [atom('Li', { id: 'a' }), atom('Na', { id: 'b' }), atom('Be', { id: 'c' }), atom('Mg', { id: 'd' })],
    widget: {
      type: 'choice', label: 'What strengthens it',
      options: [
        { id: 'cs', label: 'More charge at the middle, and a shorter distance to it' },
        { id: 'many', label: 'More electrons in the atom, whatever their distance' },
        { id: 'far', label: 'A longer distance from the middle' },
        { id: 'charge', label: 'More charge at the middle only; the distance makes no difference' }
      ]
    },
    hints: [
      'Tap the innermost electron of each atom and then its outermost, and compare the readings.',
      'Compare the pull with the charge at the middle and with the distance, changing one of those at a time.',
      'Compare two electrons of one atom, which share the core charge but not the distance, and then the innermost electrons of two atoms, which share a shell but not the charge.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what strengthens the pull.' };
      if (state.choice !== 'cs') {
        return { ok: false, msg: 'Change one thing at a time: compare two electrons in the same atom, then the innermost electrons of different atoms.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Closer and a bigger core: a harder pull.',
      title: 'Coulomb\'s Law',
      body: 'The pull between a nucleus and an electron grows with the charge on the nucleus and falls off with the square of the distance between them. This is Coulomb\'s law, and everything else on this bench is an application of it.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Plus One, Not Plus Eleven',
    prompt: 'What accounts for the missing charge on sodium\'s outermost electron?',
    labels: L2,
    show: { core: true, between: true, feel: true },
    controls: [],
    rigs: [atom('Na', { id: 'a' })],
    widget: {
      type: 'choice', label: 'Why',
      options: [
        { id: 'between', label: 'The electrons between it and the nucleus cancel most of the nucleus\'s charge' },
        { id: 'protons', label: 'Sodium\'s nucleus really only has one proton' },
        { id: 'far', label: 'The outer electron is too far away to feel any charge' },
        { id: 'moves', label: 'The outer electron moves too fast to be pulled' }
      ]
    },
    hints: [
      'Tap the outermost electron and read every line the meter prints.',
      'Compare the charge at the middle with the number of electrons the meter says lie between the electron and the middle.',
      'Subtract the number of electrons between from the nuclear charge and compare the result with the charge the electron feels.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the reason.' };
      if (state.choice !== 'between') {
        return { ok: false, msg: 'Read the meter for the outermost electron and compare the charge at the middle with the charge the electron actually feels.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Eleven protons, ten electrons in the way.',
      title: 'Shielding and Effective Nuclear Charge',
      body: 'The electrons between an outer electron and the nucleus cancel most of the charge, an effect called shielding. What is left is the effective nuclear charge, which is +1 for sodium\'s outer electron: eleven protons less ten shielding electrons.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Four in a Row',
    prompt: 'Order lithium, beryllium, boron, and carbon from largest atomic size to smallest.',
    labels: L2,
    show: { core: true, between: true, feel: true },
    trendMap: { metric: 'radius', title: 'Atomic radius, pm' },
    controls: [],
    rigs: [atom('C', { id: 'c' }), atom('Li', { id: 'li' }), atom('B', { id: 'b' }), atom('Be', { id: 'be' })],
    widget: {
      type: 'order', label: 'Largest first',
      rail: { first: 'Largest atom', last: 'Smallest atom' },
      items: [{ id: 'li', label: 'Li' }, { id: 'be', label: 'Be' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]
    },
    hints: [
      'Tap the outermost electron of each atom and read how far it sits from the middle.',
      'Compare the distances, and compare how much charge each outermost electron feels.',
      'Place the atom whose outermost electron is farthest from the middle first, and the one whose electron is closest last.'
    ],
    check(state) {
      if (state.order.length < 4) return { ok: false, notYet: true, msg: 'Put all four atoms in order.' };
      const want = ['li', 'be', 'b', 'c'];
      if (state.order.join() === want.slice().reverse().join()) {
        return { ok: false, msg: 'That order runs the wrong way: the atom at the left end of the rail must be the biggest.' };
      }
      if (state.order.join() !== want.join()) {
        return { ok: false, msg: 'Read the distance for each atom\'s outermost electron before you place it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Across the row, the outer electron comes closer.',
      title: 'Atomic Radius',
      body: 'How far an atom\'s outer electrons sit from its nucleus is its atomic radius. Across a period it shrinks, because each step adds a proton to pull the same shell in tighter while the extra electron goes into that same shell and shields almost nothing.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Down a Group',
    prompt: 'Why does potassium have a larger atomic radius than sodium?',
    labels: L2,
    show: { core: true, between: true, feel: true },
    trendMap: { metric: 'radius', title: 'Atomic radius, pm' },
    controls: [],
    rigs: [atom('Na', { id: 'a' }), atom('K', { id: 'b' })],
    widget: {
      type: 'choice', label: 'Why',
      options: [
        { id: 'shell', label: 'Potassium has one more shell of electrons, so its outer electron sits farther out' },
        { id: 'charge', label: 'Potassium\'s nucleus has a weaker charge' },
        { id: 'count', label: 'Potassium simply has more protons packed into the same shells' },
        { id: 'same', label: 'They are the same size; the bench draws them at different scales' }
      ]
    },
    hints: [
      'Tap the outermost electron of each atom and compare the distance and the charge it feels.',
      'Count the rings of electrons on each atom and compare the two counts.',
      'Compare the charge each outer electron feels, which barely changes, with the number of rings it has to sit outside.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the reason.' };
      if (state.choice !== 'shell') {
        return { ok: false, msg: 'Compare the number of rings on each atom and the charge each outermost electron feels.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One more ring, the same charge felt, a bigger atom.',
      title: 'Down a Group, Atoms Grow',
      body: 'Potassium\'s outer electron feels about the same effective nuclear charge as sodium\'s, but it sits outside one more full shell. Down a group every row of the table adds a shell, so atoms get bigger even as their nuclei grow stronger.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Plus, Minus and Neutral',
    briefing: {
      speaker: SPEAKER,
      body: 'You can now modify electron counts. Use "Strip Electron" to remove an electron or "Add Electron" to place one onto the sample.'
    },
    prompt: 'Order Na⁺, Na, and Cl⁻ from smallest size to largest.',
    labels: L2,
    show: { core: true, between: true, feel: true },
    controls: ['strip', 'add', 'reset'],
    rigs: [
      atom('Na', { id: 'na', stripRadii: [ION_RADIUS['Na+']] }),
      atom('Cl', { id: 'cl', radius: ION_RADIUS.Cl, ie: null, addRadius: ION_RADIUS['Cl-'] })
    ],
    widget: {
      type: 'order', label: 'Smallest first',
      rail: { first: 'Smallest size', last: 'Largest size' },
      start: ['clminus', 'na', 'naplus'],
      items: [{ id: 'na', label: 'Na' }, { id: 'naplus', label: 'Na⁺' }, { id: 'clminus', label: 'Cl⁻' }]
    },
    hints: [
      'Press "Strip Electron" on the sodium plate and "Add Electron" on the chlorine plate, then tap each outermost electron.',
      'Compare the distances you read for sodium before and after stripping, and for chlorine after adding.',
      'Place the smallest of Na⁺, Na and Cl⁻ first, using the distance read for each.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Put all three in order.' };
      const want = ['naplus', 'clminus', 'na'];
      if (state.order.join() !== want.join()) {
        return { ok: false, msg: 'Make each ion on its plate, read the distance to its outermost electron, and order the three by those readings.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Strip one electron and the atom shrinks; add one and it swells.',
      title: 'Ionic Radius',
      body: 'A positive ion is much smaller than its atom, because losing the outer shell leaves the remaining electrons pulled in by the same nucleus. A negative ion is bigger, since an extra electron adds repulsion without any extra pull. These sizes are the ionic radius.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Three Costs',
    prompt: 'Which order reflects the energy cost to strip an electron, and why does boron dip?',
    labels: L2,
    show: { core: true, between: true, feel: true },
    controls: ['strip', 'reset'],
    rigs: [atom('B', { id: 'b' }), atom('Li', { id: 'li' }), atom('Be', { id: 'be' })],
    widget: {
      type: 'choice', label: 'The order, and why',
      options: [
        { id: 'dip', label: 'Li, then B, then Be: boron\'s outer electron sits in a 2p row, higher on the ladder than beryllium\'s 2s, so it comes off more easily' },
        { id: 'rise', label: 'Li, then Be, then B: each atom holds its outer electron tighter than the last' },
        { id: 'bli', label: 'B, then Li, then Be: boron has the most electrons, so each is held loosest' },
        { id: 'bel', label: 'Be, then B, then Li: the smallest atom always holds on loosest' }
      ]
    },
    hints: [
      'Press "Strip Electron" on each plate and read what it costs.',
      'Put the three costs in order, then compare the order with the order of the elements across the row.',
      'Find the element that breaks the climb across the row and ask which row of the ladder its outer electron sits in.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the order and the reason.' };
      if (state.choice !== 'dip') {
        return { ok: false, msg: 'Strip each atom, put the three costs in order, and then ask why the order does not simply climb across the row.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Li 520, B 801, Be 899.',
      title: 'Ionization Energy',
      body: 'The energy it takes to strip the outermost electron from an atom is its ionization energy, and it generally rises across a period. Boron dips below beryllium because its outer electron is in a 2p row, which holds an electron less tightly than a 2s row does.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Magnesium\'s Three',
    prompt: 'Which stable ionic charge does magnesium form after its energy jump?',
    labels: L2,
    show: { core: true, between: true, feel: true },
    controls: ['strip', 'reset'],
    rigs: [atom('Mg', { id: 'mg', successive: MG_SUCCESSIVE })],
    widget: {
      type: 'choice', label: 'The charge',
      options: [
        { id: 'one', label: 'Plus one' },
        { id: 'two', label: 'Plus two' },
        { id: 'three', label: 'Plus three' },
        { id: 'four', label: 'Plus four' }
      ]
    },
    hints: [
      'Press "Strip Electron" on magnesium again and again, and read what each strip costs.',
      'Compare the cost of each strip with the one before it, and look for a cost that jumps enormously.',
      'The atom stops giving up electrons easily where the next one comes from a closed inner shell, so count the strips before that jump.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the charge.' };
      if (state.choice !== 'two') {
        return { ok: false, msg: 'Strip magnesium one electron at a time and find where the cost suddenly leaps.' };
      }
      return { ok: true };
    },
    reward: {
      log: '738, 1451, then 7733.',
      title: 'Successive Ionization Energies',
      body: 'Each further electron costs more than the last, because it leaves an ion that already carries a charge, and the cost leaps when the next electron comes from a closed inner shell. Magnesium\'s successive ionization energies jump after the second, so it gives up exactly two electrons and forms Mg²⁺.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Pull From Outside',
    prompt: 'Order Na, C, N, and F by their pulling strength on electrons, weakest first.',
    labels: L2,
    show: { core: true, between: true, feel: true },
    trendMap: { metric: 'pull', title: 'Pull on the outer electron' },
    controls: [],
    rigs: [atom('F', { id: 'f' }), atom('Na', { id: 'na' }), atom('N', { id: 'n' }), atom('C', { id: 'c' })],
    widget: {
      type: 'order', label: 'Weakest first',
      rail: { first: 'Weakest pull', last: 'Strongest pull' },
      items: [{ id: 'na', label: 'Na' }, { id: 'c', label: 'C' }, { id: 'n', label: 'N' }, { id: 'f', label: 'F' }]
    },
    hints: [
      'Tap the outermost electron of each atom and read the pull on it.',
      'An atom\'s pull on a pair it shares is the pull on its outermost electrons, so compare those four readings.',
      'Place the atom with the weakest outermost-electron pull first and the one with the strongest last.'
    ],
    check(state) {
      if (state.order.length < 4) return { ok: false, notYet: true, msg: 'Put all four atoms in order.' };
      const want = ['na', 'c', 'n', 'f'];
      if (state.order.join() === want.slice().reverse().join()) {
        return { ok: false, msg: 'That order runs the wrong way: the atom at the left end of the rail must pull weakest.' };
      }
      if (state.order.join() !== want.join()) {
        return { ok: false, msg: 'Read the pull on each atom\'s outermost electron before you place it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The outer pull climbs across the row and falls down a group.',
      title: 'Electronegativity and Electron Affinity',
      body: 'An atom\'s pull on a pair of electrons it shares is its electronegativity, and it rises across a period and falls down a group, just as the pull meter showed. Electron affinity, the energy released when an atom gains an electron, follows much the same trend.',
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
      body: 'One law explains the table: charge pulls, distance weakens the pull, and the electrons in between cancel some of the charge. Radius, ionization energy and electronegativity are that law measured three ways.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Nearly every property a chemist predicts about an element starts from where it sits on the table. You now know why.'
    },
    {
      heading: 'Next',
      body: 'That finishes the atoms of Lanternfall. The next world asks what happens when two of them come close enough to share what you have just measured.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Which has the larger atomic radius: sodium or magnesium?',
    options: [
      { id: 'a', label: 'Sodium, because it has one fewer proton pulling on the same shell' },
      { id: 'b', label: 'Magnesium, because it has more electrons' },
      { id: 'c', label: 'They are the same size' },
      { id: 'd', label: 'Magnesium, because it is further down the table' }
    ],
    answer: 'a',
    explanation: 'Both have their outer electrons in the third shell, but magnesium has one more proton pulling on them, so its radius is smaller. Moving across a period atoms shrink.'
  },
  {
    question: 'Why is the first ionization energy of oxygen lower than that of nitrogen?',
    options: [
      { id: 'a', label: 'Oxygen\'s outer electron is the second in a 2p box, and the repulsion of its partner makes it easier to remove' },
      { id: 'b', label: 'Oxygen has fewer protons than nitrogen' },
      { id: 'c', label: 'Oxygen has a larger atomic radius than nitrogen' },
      { id: 'd', label: 'Oxygen has a full 2p row' }
    ],
    answer: 'a',
    explanation: 'Nitrogen\'s 2p electrons are all unpaired. In oxygen two electrons share one 2p box, and their repulsion makes one of them easier to remove, so oxygen dips below nitrogen.'
  },
  {
    question: 'The successive ionization energies of an element are 496, 4562 and 6910 kJ/mol. In which group is it?',
    options: [
      { id: 'a', label: 'Group 1, because the second ionization energy is enormously higher than the first' },
      { id: 'b', label: 'Group 2' },
      { id: 'c', label: 'Group 13' },
      { id: 'd', label: 'Group 17' }
    ],
    answer: 'a',
    explanation: 'A huge jump after the first electron means the second must come from a closed inner shell. An atom with one electron outside a closed shell is in Group 1.'
  },
  {
    question: 'How does the radius of a sodium ion, Na⁺, compare with that of a sodium atom?',
    options: [
      { id: 'a', label: 'It is smaller, because the outer shell has been lost' },
      { id: 'b', label: 'It is larger, because it has a positive charge' },
      { id: 'c', label: 'It is the same' },
      { id: 'd', label: 'It cannot be compared' }
    ],
    answer: 'a',
    explanation: 'Sodium loses its single 3s electron to form Na⁺, leaving the compact second shell, and the same nucleus now holds fewer electrons more tightly.'
  },
  {
    question: 'Which of these elements has the highest electronegativity?',
    options: [
      { id: 'a', label: 'Fluorine' },
      { id: 'b', label: 'Oxygen' },
      { id: 'c', label: 'Chlorine' },
      { id: 'd', label: 'Sodium' }
    ],
    answer: 'a',
    explanation: 'Electronegativity rises across a period and falls down a group. Fluorine is furthest right and highest of those listed, at 3.98 on the Pauling scale.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { choice: 'cs' },
  { choice: 'between' },
  { order: ['li', 'be', 'b', 'c'] },
  { choice: 'shell' },
  { order: ['naplus', 'clminus', 'na'] },
  { choice: 'dip' },
  { choice: 'two' },
  { order: ['na', 'c', 'n', 'f'] }
];

export const MISSES = [
  { choice: 'far' },
  { choice: 'moves' },
  { order: ['c', 'b', 'be', 'li'] },
  { choice: 'charge' },
  { order: ['na', 'naplus', 'clminus'] },
  { choice: 'rise' },
  { choice: 'one' },
  { order: ['f', 'n', 'c', 'na'] }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

export { planPull, shellsOf, zOf, kjmol };

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let bench = null;
  let runner = null;

  function onProbe(hit) {
    if (hit.kind !== 'electron') return;
    const stage = runner.stage;
    const L = { ...L1, ...(stage.labels || {}) };
    const bits = [`Pull ${hit.pull.toFixed(2)}`];
    if (stage.show.core) bits.push(`core charge +${hit.z}`);
    bits.push(`distance ${hit.distPm} pm`);
    if (stage.show.between) bits.push(`${hit.between} electrons between`);
    if (stage.show.feel) bits.push(`${L.feelText} +${hit.zeff}`);
    runner.readout(`Electron // ${hit.rig.label}`, `${bits.join(', ')}.`);
  }

  function stripAll(id) {
    const res = bench.ionize(id);
    const item = bench.itemFor(id);
    if (!res || res.refused) { runner.readout('Strip // refused', res?.refused || 'Nothing to strip.'); return; }
    runner.readout(`Strip // ${item.label}`, res.energy != null
      ? `The outermost electron came off for ${kjmol(res.energy)}. The atom now carries +${res.charge}.`
      : `The outermost electron came off. The atom now carries +${res.charge}, beyond what this bench has measured.`);
  }

  function onTool(tool) {
    const stage = runner.stage;
    if (tool === 'reset') {
      bench.reset();
      runner.readout('Bench // reset', 'Every atom is back as it was.');
      return;
    }
    if (tool === 'strip' || tool === 'add') {
      // On a bench with one plate the key acts on it; with several, on the selected one.
      const id = runner.state.sample || (stage.rigs.length === 1 ? stage.rigs[0].id : null);
      if (tool === 'strip') {
        if (!id && stage.rigs.length > 1) {
          // Strip every plate that has an energy to report: the stage compares them side by side.
          for (const rig of stage.rigs) if (rig.ie || rig.successive) stripAll(rig.id);
          return;
        }
        stripAll(id);
      } else {
        const target = id || stage.rigs.find(r => r.addRadius)?.id;
        const res = bench.addElectron(target);
        const item = bench.itemFor(target);
        if (res) runner.readout(`Add // ${item.label}`, `One electron added. The atom now carries ${res.charge}.`);
      }
    }
  }

  function onSelect(id) {
    runner.state.sample = id;
    bench.setSelected(id);
  }

  function onLoad(stage, i, r) {
    bench.setPlates(stage.rigs, {
      labels: stage.labels, show: stage.show, maxPm: 240,
      trendMap: Boolean(stage.trendMap), trendMetric: stage.trendMap?.metric, trendTitle: stage.trendMap?.title
    });
    bench.setSelectable(stage.rigs.length > 1 && stage.controls.includes('add'));
    r.state.sample = null;

    const parts = [];
    const keys = [];
    if (stage.controls.includes('strip')) keys.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="strip">Strip Electron</button>');
    if (stage.controls.includes('add')) keys.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="add">Add Electron</button>');
    if (stage.controls.includes('reset')) keys.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="reset">Reset Atoms</button>');
    if (keys.length) parts.push(`<div class="cb-field" role="group" aria-label="Atom">${keys.join('')}</div>`);
    r.setControls(parts, onTool);
    r.readout(null, null, { idleHead: 'Bench // standby', idle: 'Tap an electron to read the pull on it.' });
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { bench = ElectronBench(r.frame.instrumentHost, { onProbe, onSelect }); },
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
