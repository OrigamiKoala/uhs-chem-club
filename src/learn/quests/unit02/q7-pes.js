/**
 * q7-pes.js — Lanternfall, bench seven: PHOTOELECTRON SPECTROSCOPY.
 *
 * The detector arc. Fire light of enough energy at a specimen and every electron it carries enough energy for is knocked loose; each lands
 * in a strip graded in energy, and they pile up. The result is the configuration drawn out, and it is the strongest evidence this world
 * offers that the rows you filled on the last bench are real: one peak per row, as tall as the row is full.
 *
 * The seventh of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4c), on the spectrum kit (`table/kits/pes.js`). A specimen
 * card is put in the chamber and "Fire Light" drops its electrons into the bins of a strip (instanced piles in the built view); the
 * card keeps a printout of what it showed, so several can be ranked on a rail or filed in trays; the light's energy is a dial from the
 * third stage, because the least energy that frees an electron is how tightly it was held; an atom is built to match a sealed spectrum
 * (its own peaks lie over the strip as outlines); a configuration is written row by row.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  hydrogen's and helium's spectra            -> photoelectron spectrum
 *   2  what the height of a peak counts           -> (height is a count)
 *   3  lithium's one loose electron               -> binding energy
 *   4  boron's outer ring, two peaks              -> subshells
 *   5  a sealed specimen, from its heights        -> (heights add to the atomic number)
 *   6  oxygen, fluorine and neon's inner peaks    -> (more protons, a tighter hold)
 *   7  three spectra, matched to three elements   -> (one electron more at a time)
 *   8  the configuration a sealed spectrum shows  -> the spectrum is the configuration
 *
 * THE ROWS' NAMES ARE NEVER ON THE BENCH until stage eight, whose answer they are. A peak is a position and a height and nothing
 * else; the strip's scale says "energy to remove" until the word for it is earned.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  pesTable, specimen, chamber, buildFixture, writerFixture, tallyFixture, plaqueFixture,
  chamberRead, buildRead, writtenRead, writerTarget, markerRead, freedBy, holdOf, electronsIn, spectrumOf, shellsOf,
  ENERGY_STEPS, TOP_STEP, WRITER_ROWS, BINS, binOf, pilesOf, energyAt, LADDER, groundConfig, zOf
} from '../../table/kits/pes.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bphotoelectron spectr(?:um|a)\b/i, introducedAt: 1 },
  { term: /\bbinding energy\b/i, introducedAt: 3 },
  { term: /\bsubshells?\b/i, introducedAt: 4 }
];

export const BUILDS_ON = ['unit02/q6-filling', 'unit02/q2-photon'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const CH = { x: 57, y: 25 };
const CHAMBER = 'ch';
const SLOT = `slot:${CHAMBER}.spec`;

const where = (t, id) => (t.pieces[id].zone || '').replace(/^(tray|slot):/, '');
const railOf = t => t.zones.rail.order.slice();
const inTray = (t, id) => (t.pieces[id].zone || '').startsWith('tray:');

/** The row ids of ring `ring` (0 is the innermost) of element `sym`: the rows whose electrons sit in that shell. */
export function ringRows(sym, ring) {
  const counts = groundConfig(zOf(sym));
  const ns = [...new Set(LADDER.filter(r => counts[r.id]).map(r => r.n))].sort((a, b) => a - b);
  return LADDER.filter(r => counts[r.id] && r.n === ns[ring]).map(r => r.id);
}

/** The cards on a rail along the bottom, one per specimen. */
const cards = (list, y = 54, x0 = 24, pitch = 28) => list.map(([id, label, sym, note], i) => specimen(id, label, sym, { x: x0 + i * pitch, y }, { note }));

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['a', 'b']);
    return {
      title: 'Two Spectra',
      briefing: {
        speaker: SPEAKER,
        body: 'This bench fires light at a specimen to knock its electrons off and sorts them into a strip by the energy each was held with: put a specimen in the holder and press "Fire Light". Press Submit when the table shows your answer.'
      },
      prompt: 'Rank the two specimens by how much energy it takes to knock their electrons off, lowest first.',
      widget,
      table: pesTable({
        pieces: [specimen('a', 'SAMPLE A', 'H', { x: 0, y: 0 }), specimen('b', 'SAMPLE B', 'He', { x: 0, y: 0 })],
        fixtures: [ch.fixture],
        zones: { slots: ch.slots, rail: { id: 'rail', at: { x: 62, y: 54 }, size: { w: 84, h: 12 }, first: 'Comes off most easily', last: 'Comes off least easily', items: ['a', 'b'], start: ['b', 'a'] } }
      }),
      hints: [
        'Drag a specimen into the chamber and press "Fire Light", then do the same with the other.',
        'Compare where each specimen\'s pile stands along the strip, and how tall it is.',
        'Put on the rail first the specimen whose pile stands nearer the low-energy end of the strip.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 2) return { ok: false, notYet: true, msg: 'Put both specimens on the rail.' };
        const want = ['a', 'b'].slice().sort((p, q) => holdOf(t.pieces[p].props.sym) - holdOf(t.pieces[q].props.sym));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'The rail runs from the electrons that come off most easily: fire each specimen and see which pile stands further along the strip.' };
      },
      reward: {
        log: 'A taller pile, further along the strip.',
        title: 'Photoelectron Spectrum',
        body: 'Counting how many electrons come off at each energy gives a photoelectron spectrum. The position of a peak says how much energy it takes to remove those electrons, and its height says how many of them there are. Spectra are drawn with the highest energy at the left.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['a', 'b']);
    return {
      title: 'What Height Counts',
      prompt: 'Set the tally to the number of electrons in Sample B.',
      widget,
      table: pesTable({
        pieces: [specimen('a', 'SAMPLE A', 'He', { x: 22, y: 54 }, { note: 'two electrons' }), specimen('b', 'SAMPLE B', 'Li', { x: 54, y: 54 })],
        fixtures: [ch.fixture, tallyFixture('tally', 'Electrons in Sample B', { x: 131, y: 14 }, 8, { w: 36 })],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Fire both specimens and read the piles each one makes.',
        'Compare the heights of Sample A\'s piles with the two electrons its card says it holds.',
        'Add up the heights of every pile on Sample B\'s strip and set the tally to that total.'
      ],
      check(state) {
        const t = state.table;
        const n = markerRead(t, 'tally');
        if (n === 0) return { ok: false, notYet: true, msg: 'Set the tally.' };
        if (n === electronsIn(spectrumOf('Li'))) return { ok: true };
        return { ok: false, msg: 'The tally does not match the piles: compare Sample A\'s piles with its two electrons, then count Sample B\'s the same way.' };
      },
      reward: {
        log: 'The heights add up to the electrons.',
        title: 'Height Is a Count',
        body: 'A peak is exactly as tall as the number of electrons that came out at its energy, so the heights on a plate always add up to all the electrons in the atom. Position says how tightly they were held, and height says how many there were.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['a'], { energyDial: true, rings: true });
    return {
      title: 'Lithium\'s Loose Electron',
      briefing: {
        speaker: SPEAKER,
        body: 'You can now set the energy of the light. An electron only comes off if the light carries at least the energy it is held with.'
      },
      prompt: 'Set the light so that exactly one of lithium\'s electrons comes off.',
      widget,
      table: pesTable({
        pieces: [specimen('a', 'LITHIUM', 'Li', { x: 0, y: 0 }, { zone: SLOT })],
        fixtures: [ch.fixture],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Turn the light\'s energy down, press "Fire Light" and watch which piles are left.',
        'Compare the ring picture beside the chamber with the piles that appear at each setting.',
        'Step the energy down until the strip holds a single electron and stop on the setting that frees it.'
      ],
      check(state) {
        const t = state.table;
        const r = chamberRead(t, CHAMBER);
        if (r.electronsNow === 1) return { ok: true };
        if (r.electronsNow === 0) return { ok: false, msg: 'That light frees no electron at all: turn the energy up until one comes off.' };
        return { ok: false, msg: `That light frees ${r.electronsNow} electrons: turn the energy down and fire again until a single electron comes off.` };
      },
      reward: {
        log: 'The outer electron is the loosely held one.',
        title: 'Binding Energy',
        body: 'The energy needed to remove an electron is its binding energy, and the closer an electron sits to the nucleus the more tightly it is bound. The closer an electron sits to the nucleus, the further its peak sits toward the high-energy end.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['a'], { energyDial: true, rings: true, axisLabel: 'BINDING ENERGY, MJ/mol' });
    return {
      title: 'Boron\'s Second Shell',
      prompt: 'Set the light so that every electron of boron\'s outer ring comes off and none of the inner ring.',
      widget,
      table: pesTable({
        pieces: [specimen('a', 'BORON', 'B', { x: 0, y: 0 }, { zone: SLOT })],
        fixtures: [ch.fixture],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Turn the light\'s energy and press "Fire Light" at several settings, watching the piles.',
        'Compare the number of electrons on the outer ring with the number the strip shows, and count the piles they make.',
        'Raise the energy from the lowest setting until the strip holds all the outer ring\'s electrons, and stop before the inner ring joins them.'
      ],
      check(state) {
        const t = state.table;
        const r = chamberRead(t, CHAMBER);
        const outer = ringRows('B', 1);
        const rows = r.freedNow.map(p => p.row).sort();
        if (rows.join() === outer.slice().sort().join()) return { ok: true };
        const inner = ringRows('B', 0);
        if (rows.some(id => inner.includes(id))) return { ok: false, msg: 'That light is strong enough to free the inner ring as well: turn the energy down.' };
        return { ok: false, msg: 'Some of the outer ring\'s electrons are still held: turn the energy up, fire again and count what comes off.' };
      },
      reward: {
        log: 'One shell, two rows, two peaks.',
        title: 'Subshells',
        body: 'Within one shell the electrons sit in rows of different shapes, called subshells, and each subshell gives its own peak. In boron the 2s subshell is held a little more tightly than 2p, so its two electrons make the taller peak, a little further along.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['x'], { model: 'build', axisLabel: 'BINDING ENERGY, MJ/mol' });
    return {
      title: 'Name the Specimen',
      prompt: 'Build the atom whose peaks match the sealed specimen\'s.',
      widget,
      table: pesTable({
        pieces: [specimen('x', 'SEALED SPECIMEN', 'O', { x: 0, y: 0 }, { zone: SLOT })],
        fixtures: [ch.fixture, buildFixture('build', { x: 130.5, y: 25 }, { max: 13, label: 'Build an atom' })],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Press "Fire Light" on the sealed specimen, then turn the build\'s dials and watch the outlines over the strip.',
        'Compare the outlines the build makes with the piles on the strip, and what the heights add up to.',
        'A whole atom has as many electrons as protons, so build the one whose outlines cover every pile.'
      ],
      check(state) {
        const t = state.table;
        const b = buildRead(t, 'build');
        if (!b.protons && !b.electrons) return { ok: false, notYet: true, msg: 'Build an atom with the dials.' };
        if (b.whole && b.sym === 'O') return { ok: true };
        if (!b.whole) return { ok: false, msg: 'The build has a different number of protons and electrons, so it is no whole atom: make them equal and compare the outlines.' };
        return { ok: false, msg: 'The outlines of that atom do not cover the sealed specimen\'s piles: compare their heights and try another.' };
      },
      reward: {
        log: 'The heights summed to the atomic number.',
        title: 'Reading an Unknown',
        body: 'The heights add up to the number of electrons, and in a neutral atom that equals its atomic number. Peaks of 2, 2 and 4 therefore belong to the element with eight electrons, which is oxygen.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['o', 'f', 'n'], { axisLabel: 'BINDING ENERGY, MJ/mol' });
    return {
      title: 'Oxygen, Fluorine, Neon',
      prompt: 'Rank the three specimens by how tightly they hold their innermost electrons, loosest first.',
      widget,
      table: pesTable({
        pieces: [specimen('o', 'OXYGEN', 'O', { x: 0, y: 0 }, { note: '8 protons' }), specimen('f', 'FLUORINE', 'F', { x: 0, y: 0 }, { note: '9 protons' }), specimen('n', 'NEON', 'Ne', { x: 0, y: 0 }, { note: '10 protons' })],
        fixtures: [ch.fixture],
        zones: { slots: ch.slots, rail: { id: 'rail', at: { x: 62, y: 54 }, size: { w: 84, h: 12 }, first: 'Held loosest', last: 'Held tightest', items: ['o', 'f', 'n'], start: ['n', 'o', 'f'] } }
      }),
      hints: [
        'Fire each specimen and look at the pile that stands furthest to the left.',
        'Compare the position of that pile on each strip with the number of protons on each card.',
        'Lay the specimens on the rail in the order of their innermost piles, the one nearest the low-energy end first.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three specimens on the rail.' };
        const want = ['o', 'f', 'n'].slice().sort((p, q) => holdOf(t.pieces[p].props.sym) - holdOf(t.pieces[q].props.sym));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'The rail runs from the loosest hold: fire each specimen and compare how far along the strip its innermost pile stands.' };
      },
      reward: {
        log: 'A bigger nuclear charge holds the same shell harder.',
        title: 'More Charge, Tighter Hold',
        body: 'Neon\'s first-shell electrons feel ten protons and fluorine\'s feel nine, and the extra proton holds them noticeably tighter. The same two electrons in the same shell need more energy to remove from the atom with the bigger nuclear charge.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    // A shorter chamber leaves a band under it for the samples and the plate of electron counts; the answers are three trays down the right.
    const ch = chamber(CHAMBER, { x: 57, y: 21 }, ['x', 'y', 'z'], { axisLabel: 'BINDING ENERGY, MJ/mol', h: 38 });
    const tray = (id, label, y) => ({ id, label, at: { x: 131, y }, size: { w: 26, h: 15 }, cell: 22 });
    return {
      title: 'Three Neighbours',
      prompt: 'Match each spectrum to sodium, magnesium, or aluminum.',
      widget,
      table: pesTable({
        pieces: [
          specimen('x', 'SAMPLE X', 'Mg', { x: 14, y: 53 }), specimen('y', 'SAMPLE Y', 'Al', { x: 40, y: 53 }), specimen('z', 'SAMPLE Z', 'Na', { x: 66, y: 53 })
        ],
        fixtures: [ch.fixture, plaqueFixture('electrons', 'Electrons in an atom', { x: 98, y: 53 }, ['Sodium: 11', 'Magnesium: 12', 'Aluminum: 13'], { w: 34 })],
        zones: { slots: ch.slots, trays: [tray('na', 'Sodium', 14), tray('mg', 'Magnesium', 34), tray('al', 'Aluminum', 54)] }
      }),
      hints: [
        'Fire each sample and add up the heights of the piles on its strip.',
        'Compare the total for each sample with the electrons the plate gives for each element, and look at the pile at the low-energy end.',
        'The sample with the fewest electrons has a single electron in its loosest pile, and the one with the most has an extra pile beside it.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['x', 'y', 'z'];
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put every sample in a tray.' };
        const want = { x: 'mg', y: 'al', z: 'na' };
        for (const id of ids) {
          if (where(t, id) !== want[id]) return { ok: false, msg: 'Count the electrons in each spectrum and look at how the outermost pile changes from one element to the next.' };
        }
        return { ok: true };
      },
      reward: {
        log: 'One more electron each time; one more peak at the end.',
        title: 'One More at a Time',
        body: 'Across the third row each new element adds one electron to the outer row, so the last peak grows from one electron to two and then a new, separate peak appears beside it. The inner peaks barely change, which is why the outer ones carry the chemistry.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['c'], { axisLabel: 'BINDING ENERGY, MJ/mol' });
    return {
      title: 'The Sealed Specimen\'s Rows',
      prompt: 'Write down the ground-state electron configuration this sealed specimen\'s spectrum shows.',
      widget,
      table: pesTable({
        pieces: [specimen('c', 'SEALED SPECIMEN', 'N', { x: 0, y: 0 }, { zone: SLOT })],
        fixtures: [ch.fixture, writerFixture('write', { x: 130.5, y: 26 }, { label: 'Electrons in each row' })],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Press "Fire Light" and read the height of every pile on the strip.',
        'Order the piles from the one held most tightly to the one held least, which is the order the rows fill in.',
        'Set each row of the page to the height of the next pile along, starting with the most tightly held.'
      ],
      check(state) {
        const t = state.table;
        const w = writtenRead(t, 'write');
        if (w.total === 0) return { ok: false, notYet: true, msg: 'Write the electrons in each row.' };
        const want = writerTarget('N');
        if (WRITER_ROWS.every(r => w.counts[r] === want[r])) return { ok: true };
        return { ok: false, msg: 'The page does not match the strip: list the piles in order of how tightly they are held and write each height beside the next row.' };
      },
      reward: {
        log: 'Peak by peak, the spectrum is the arrangement.',
        title: 'The Spectrum Is the Configuration',
        body: 'A photoelectron spectrum is the electron configuration drawn out: each peak is a row, and its height is how many electrons the row holds. Read from the most tightly held peak to the least, it spells the configuration row by row.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Put a specimen in the holder.'],
  3: ['Turn the Light energy dial, then press Fire Light.'],
  5: ['Set the Protons and Electrons dials: your atom\'s peaks', 'appear on the strip as outlines.'],
  7: ['Fire each sample, then drag it to a tray.']
};
applyNotes(STAGES, NOTES);

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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Specimens are put in the chamber and fired, the light is turned, atoms are built, rows are written. Nothing
   here says what a strip shows or what a spectrum is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const fire = id => ({ run: id });
const load = id => [put(id, SLOT), fire(CHAMBER)];

/** The light's setting that frees exactly the electrons of `rows` of `sym`, or null (the lowest setting that does). */
export function settingFor(sym, rows) {
  for (let i = 1; i <= TOP_STEP; i++) {
    if (freedBy(sym, energyAt(i)).map(p => p.row).sort().join() === rows.slice().sort().join()) return i;
  }
  return null;
}

export const SOLUTIONS = [
  [...load('a'), ...load('b'), put('a', 'rail:0'), put('b', 'rail:1')],
  [...load('a'), ...load('b'), dial('tally', 'value', 3)],
  [dial(CHAMBER, 'energy', settingFor('Li', ['2s'])), fire(CHAMBER)],
  [dial(CHAMBER, 'energy', settingFor('B', ringRows('B', 1))), fire(CHAMBER)],
  [fire(CHAMBER), dial('build', 'protons', 8), dial('build', 'electrons', 8)],
  [...load('o'), ...load('f'), ...load('n'), put('o', 'rail:0'), put('f', 'rail:1'), put('n', 'rail:2')],
  [...load('x'), ...load('y'), ...load('z'), put('x', 'tray:mg'), put('y', 'tray:al'), put('z', 'tray:na')],
  [fire(CHAMBER), dial('write', '1s', 2), dial('write', '2s', 2), dial('write', '2p', 3)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...load('a'), ...load('b'), put('b', 'rail:0'), put('a', 'rail:1')],
  [...load('a'), ...load('b'), dial('tally', 'value', 2)],
  [fire(CHAMBER)],
  [dial(CHAMBER, 'energy', settingFor('B', ['2p'])), fire(CHAMBER)],
  [fire(CHAMBER), dial('build', 'protons', 7), dial('build', 'electrons', 7)],
  [...load('o'), ...load('f'), ...load('n'), put('n', 'rail:0'), put('f', 'rail:1'), put('o', 'rail:2')],
  [...load('x'), ...load('y'), ...load('z'), put('x', 'tray:na'), put('y', 'tray:mg'), put('z', 'tray:al')],
  [fire(CHAMBER), dial('write', '1s', 2), dial('write', '2s', 3), dial('write', '2p', 2)]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { chamberRead, buildRead, writtenRead, writerTarget, markerRead, freedBy, holdOf, electronsIn, spectrumOf, shellsOf, ENERGY_STEPS, TOP_STEP, WRITER_ROWS, BINS, binOf, pilesOf, energyAt };
