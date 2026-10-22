/**
 * The second game on the Learn road, and the second on the TABLETOP (plan
 * `bench-tabletop.md`, phase T1). Eight stages in the instrument room under the
 * evaporators: a beam and a detector you place yourself, a handful of particles to
 * pick out, an atom you load with electrons while a charge needle reads it live, a
 * tester you drop a sample into, and trays to sort into. A stage is graded on what is
 * on the table when Commit is pressed.
 *
 * THE ORDER IS THE WHOLE DESIGN. Every stage is a thing the player does with their
 * hands, and the concept arrives immediately afterwards as a reward card, connecting
 * the player's observation to the real chemistry:
 *
 *   1  fire a beam at a foil, three detectors count it  -> The Nucleus · Mostly Empty Space
 *   2  mark the particles that carry a +                -> Protons & Neutrons
 *   3  load electrons until the needle rests on zero    -> Electrons & Electrical Neutrality
 *   4  load electrons onto shells                       -> Electron Shells & The Bohr Model
 *   5  test samples and tray them by what they do       -> Valence Electrons & Reactivity
 *   6  tray two specimens of equal weight               -> Atomic Number & Isotopes
 *   7  pull electrons off until the needle reads +2     -> Ions & Net Charge
 *   8  tray unknown specimens against a reference       -> The Subatomic Architecture of Matter
 *   -- debrief: subatomic model summary & preview of the periodic table.
 *
 * WORDS ARE FREE, PHENOMENA ARE DISCOVERED. Real words (proton, neutron, electron,
 * nucleus, shell) are used in play from the moment they help, and stage 2's card names
 * all three particles at once. The one exception is the particles themselves on stage 2,
 * which keep neutral labels (marked, blank) because telling those two apart IS the
 * discovery there; from stage 3 they are proton, neutron and electron outright.
 *
 * THE TABLE (`table/`, `kits/atoms.js`). The beam's counts are `corebench.js` `planBeam`,
 * the needle is protons against electrons on the table, the tester is the kit's model of
 * a ring with a spare or one short. A tray that holds more than it should prints the
 * stencilled `!` lamp. No stage declares an outcome; `SOLUTIONS` and `MISSES` are
 * scripts of the player's own actions, replayed by `verify:table`.
 *
 * WHAT THIS QUEST DOES NOT SAY. The core bench does not talk to the sampler scope's
 * catalogue. The player will finish this site holding a proton count for a dozen specimens
 * and no idea that the scope has been filing by exactly that number since site one. That
 * reveal belongs to `q3-catalogue`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings. It reports
 * through `ctx` and nothing else.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { atomTable, piecesIn, needleReading, behaviourOf } from '../../table/kits/atoms.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned.
 *
 * `introducedAt` is the stage whose REWARD CARD first names the term. That card may use it;
 * play copy may use it from the NEXT stage on. `verify:learn` reads this table; nothing
 * here is player-facing.
 */
export const VOCABULARY = [
  { term: /\bnucle(us|i|ar)\b/i, introducedAt: 1 },
  { term: /\bprotons?\b/i, introducedAt: 2 },
  { term: /\bneutrons?\b/i, introducedAt: 2 },
  { term: /\belectrons?\b/i, introducedAt: 2 },
  { term: /\bshells?\b/i, introducedAt: 4 },
  { term: /\bvalence\b/i, introducedAt: 5 },
  { term: /\bisotopes?\b/i, introducedAt: 6 },
  { term: /\bions?\b/i, introducedAt: 7 }
];

const SPEAKER = 'Vess';

/**
 * The legend lines. The keys of this table are pieces dragged and two keys pressed ("Fire Beam",
 * "Run Tester"), and a key whose label says what it does owes nothing. Kept so the quest
 * contract (`toolNoteFor`) holds.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE PARTS
   Three sorts of thing a needle can be put on. The codes are the instrument's own, the
   readings are real, and none of them is named until stage 2's card names them. The sealed
   bench's boss (`boss-hopper`) reads this table for its probe.
   ------------------------------------------------------------------ */
export const PARTS = {
  marked: {
    code: '+ SPECK', mass: 1.0, charge: 1,
    note: 'Heavy, and it pushes the needle up every time.'
  },
  blank: {
    code: 'BLANK SPECK', mass: 1.0, charge: 0,
    note: 'Same size and weight as a + particle, but the needle does not move for it at all.'
  },
  light: {
    code: 'OUTER SPECK', mass: 0.0005, charge: -1,
    note: 'Almost weightless, and it pushes the needle the opposite way to a + particle.'
  },
  core: {
    code: 'MIDDLE // WHOLE', mass: null, charge: null,
    note: 'The whole center at once, packed too tight to separate from here.'
  },
  whole: {
    code: 'WHOLE ATOM', mass: null, charge: null,
    note: 'The whole atom, edge to edge. Almost all of that width is empty.'
  }
};

export { behaviourOf };

/* ------------------------------------------------------------------
   THE TABLES
   One layout (120 x 64 units): the work along the top, the trays and the needle in the
   middle, the scratch corner bottom left.
   ------------------------------------------------------------------ */

const NAMES = { proton: 'Proton', neutron: 'Neutron', electron: 'Electron' };
const SPECK = { proton: 'Marked', neutron: 'Blank', electron: 'Outer' };

const part = (id, kind, x, y, named = true, zone = null, props = null) => ({
  id, kind, label: (named ? NAMES : SPECK)[kind], at: { x, y }, ...(zone ? { zone } : {}), ...(props ? { props } : {})
});

/** `n` electrons ids `${prefix}1..n` stacked into a zone (the zone lays them out). */
const electrons = (prefix, n, zone, from = 1) =>
  Array.from({ length: n }, (_, i) => part(`${prefix}${from + i}`, 'electron', 0, 0, true, zone));

const trayAt = (id, label, x, y, w, h, cap) => ({ id, label, at: { x, y }, size: { w, h }, ...(cap != null ? { cap } : {}) });
/** A tray for specimens: wide pieces, so a wider pitch and a deeper tray. */
const specimenTray = (id, label, x, y = 38, w = 38) => ({ id, label, at: { x, y }, size: { w, h: 20 }, cell: 19 });

const specimen = (id, label, x, y, props) => ({ id, kind: 'specimen', label, at: { x, y }, props });
const nucleus = (id, label, x, y, p, n) => ({ id, kind: 'nucleus', label, at: { x, y }, fixed: true, props: { p, n } });

/** The shell trays of an atom with a nucleus at the top left: one per shell, closest in first. */
const SHELLS = [
  trayAt('sh1', 'Shell 1', 14, 46, 20, 16, 2),
  trayAt('sh2', 'Shell 2', 48, 46, 40, 20, 8),
  trayAt('sh3', 'Shell 3', 98, 54, 40, 20, 8)
];
const SOURCE_TRAY = (label, n) => trayAt('src', label, 98, 24, 40, 30, n);

const needleFixture = (zones, nuc, at, range) => ({
  id: 'needle', kind: 'needle', label: 'Charge needle', at, size: { w: 40, h: 16 }, noRun: true, props: { zones, nucleus: nuc, range }
});

const inZone = (t, zone, kind) => piecesIn(t, zone, kind).length;
const placedOn = (t, zones) => zones.reduce((n, z) => n + inZone(t, z, 'electron'), 0);

/** The beam's three detectors (fixed pieces), with the angle each one sits at from the beam's line. */
const BEAM_DETECTORS = { detAhead: 0, detSide: 35, detBack: 180 };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Fire Through It',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench probes inside a single atom: press "Fire Beam" to send shots at the foil, and each detector counts the shots that reach it. Lay the model card that fits what you see in the slot, then press Submit.'
    },
    prompt: 'Which model of the atom fits where the shots go?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      recorder: { at: { x: 98, y: 20 }, size: { w: 36, h: 24 }, xLabel: 'Angle', yLabel: 'Hits' },
      pieces: [
        // Three detectors, one at every angle the beam is read at: nothing to carry about the table.
        { id: 'detBack', kind: 'detector', label: 'Back', at: { x: 28, y: 36 }, fixed: true },
        { id: 'detSide', kind: 'detector', label: 'Side', at: { x: 62, y: 15 }, fixed: true },
        { id: 'detAhead', kind: 'detector', label: 'Ahead', at: { x: 64, y: 29 }, fixed: true },
        { id: 'solid', kind: 'model', label: 'Solid all through', at: { x: 16, y: 54 }, props: { model: 'solid' } },
        { id: 'hollow', kind: 'model', label: 'Hollow shell', at: { x: 40, y: 54 }, props: { model: 'shell' } },
        { id: 'core', kind: 'model', label: 'Tiny dense center', at: { x: 64, y: 54 }, props: { model: 'core' } }
      ],
      zones: {
        slots: [{ id: 'model', label: 'Your model', at: { x: 98, y: 46 }, size: { w: 28, h: 20 } }]
      },
      fixtures: [{
        id: 'beam', kind: 'beam', label: 'Beam and foil', runLabel: 'Fire Beam', at: { x: 38, y: 26 }, size: { w: 68, h: 38 },
        props: { specimen: 'a', detectors: BEAM_DETECTORS, source: { x: 10, y: 26 }, foil: { x: 46, y: 26 } }
      }]
    }),
    hints: [
      'Press "Fire Beam" and read the count on each detector and on the strip.',
      'Compare how many shots go straight on with how many are turned aside or come back.',
      'Consider what arrangement of matter lets nearly every shot through while an occasional shot rebounds, then lay the matching card in the slot.'
    ],
    check(state) {
      const model = piecesIn(state.table, 'slot:model')[0];
      if (!model) return { ok: false, notYet: true, msg: 'Lay a model card in the slot.' };
      if (model.id === 'core') return { ok: true };
      if (model.id === 'solid') return { ok: false, msg: 'Solid matter would have stopped the beam. Most of the shots went straight through.' };
      return { ok: false, msg: 'A hollow shell would have turned shots aside at its edges. These passed clean through the edges, and one bounced off the dead center.' };
    },
    reward: {
      log: 'Most shots through, 2 deflected, 1 straight back.',
      title: 'The Nucleus',
      body: 'An atom is almost entirely empty space. Nearly everything it weighs is packed into a tiny lump at its center called the nucleus, which is what the one rebound hit.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What Is in the Middle',
    briefing: {
      speaker: SPEAKER,
      body: 'The middle of the atom is laid out flat, so every particle is in view and none hides behind another. Tap a particle to mark it, and tap it again to unmark it.'
    },
    prompt: 'Mark every particle in the middle that carries a +.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        ...[
          'proton', 'neutron', 'proton', 'neutron',
          'neutron', 'proton', 'proton', 'proton',
          'neutron', 'neutron', 'proton', 'neutron'
        ].map((kind, i) => part(`sp${i + 1}`, kind, 34 + (i % 4) * 15, 14 + Math.floor(i / 4) * 15, false, null, { markable: true }))
      ]
    }),
    hints: [
      'Tap a particle to mark it with a ring, and tap it again to take the ring off.',
      'Look at each particle\'s face: some carry a stencilled + and some are blank.',
      'Go across the huddle row by row and mark only the particles with a +, then check that no blank one is marked.'
    ],
    check(state) {
      const t = state.table;
      const parts = Object.values(t.pieces).filter(p => (p.kind === 'proton' || p.kind === 'neutron') && !p.props.scratch);
      const marked = parts.filter(p => p.props.flipped);
      if (!marked.length) return { ok: false, notYet: true, msg: 'Nothing is marked yet. Tap the particles that carry a +.' };
      if (marked.some(p => p.kind !== 'proton')) return { ok: false, msg: 'A blank particle is marked. Mark only the ones that carry a +.' };
      if (parts.some(p => p.kind === 'proton' && !p.props.flipped)) return { ok: false, msg: 'A + particle is still unmarked. Every one that carries a + needs a ring.' };
      return { ok: true };
    },
    reward: {
      log: 'Center holds 12 particles, 6 with a + charge.',
      title: 'Protons, Neutrons and Electrons',
      body: 'The particles with a + are protons, each with a charge of +1, and the blank ones are neutrons, with no charge at all. Much further out, so light they barely weigh anything, sit the electrons, each with a charge of -1.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'The Charge Balance',
    briefing: {
      speaker: SPEAKER,
      body: 'A charge needle is clipped to the atom: it reads the atom\'s total electric charge, leaning to + when protons outnumber electrons and to − when electrons do. Move electrons into the outside tray and watch it.'
    },
    prompt: 'Make Sample D electrically neutral.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        nucleus('nuc', 'SAMPLE D', 22, 14, 8, 8),
        ...electrons('e', 10, 'tray:src')
      ],
      zones: {
        trays: [SOURCE_TRAY('Electrons', 12), trayAt('out', 'Outside the nucleus', 80, 54, 52, 20)]
      },
      fixtures: [needleFixture(['tray:out'], 'nuc', { x: 30, y: 38 }, 10)]
    }),
    hints: [
      'Drag electrons from the tray to the outside of the atom and watch the needle.',
      'Each electron you add moves the needle one step, and neutral means the needle rests at zero.',
      'Keep adding electrons until the needle sits on zero, then count what you have placed against what the middle holds.'
    ],
    check(state) {
      const q = needleReading(state.table, 'needle');
      if (q === 0) return { ok: true };
      if (q > 0) return { ok: false, msg: 'The needle still leans plus. The middle holds more charge than the electrons outside cancel.' };
      return { ok: false, msg: 'The needle leans minus. There are more electrons outside than the middle can balance.' };
    },
    reward: {
      log: 'Sample D carries 8 electrons.',
      title: 'Neutral Atoms Balance',
      body: 'The needle reads the total charge on the atom - a neutral atom has a charge of 0, so it has the same number of protons as electrons.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Where the Electrons Sit',
    prompt: 'Place all 11 electrons of Sample D into their shells.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        nucleus('nuc', 'SAMPLE D', 14, 12, 11, 12),
        { ...specimen('r1', 'SAMPLE A', 33, 12, { p: 2, n: 2, rings: [2] }), fixed: true },
        { ...specimen('r2', 'SAMPLE B', 51, 12, { p: 10, n: 10, rings: [2, 8] }), fixed: true },
        { ...specimen('r3', 'SAMPLE C', 69, 12, { p: 13, n: 14, rings: [2, 8, 3] }), fixed: true },
        ...electrons('e', 11, 'tray:src')
      ],
      zones: { trays: [SOURCE_TRAY('Electrons', 12), ...SHELLS] }
    }),
    hints: [
      'Count how many electrons the open samples keep on each shell, then drag this sample\'s electrons from the tray onto its shells.',
      'No sample here holds more than 2 on the first shell or more than 8 on the second, and none of them starts a new shell while a closer one still has room.',
      'Put electrons on the first shell until it holds as many as the first shell does on the open samples, fill the second shell the same way, and only then put what is left on the third shell.'
    ],
    check(state) {
      const t = state.table;
      const rings = ['tray:sh1', 'tray:sh2', 'tray:sh3'].map(z => inZone(t, z, 'electron'));
      const placed = rings.reduce((n, r) => n + r, 0);
      if (placed !== 11) {
        return { ok: false, notYet: true, msg: `${placed} of the 11 electrons are on a shell. Drag the rest from the tray.` };
      }
      if (rings[0] > 2) {
        return { ok: false, msg: 'Too many on the first shell. Count what the open samples hold on their first shell, since none of them holds more.' };
      }
      if (rings[1] > 8) {
        return { ok: false, msg: 'Too many on the second shell. Count what the open samples hold on their second shell, since that is as full as it gets.' };
      }
      if (rings[0] < 2 || (rings[2] > 0 && rings[1] < 8)) {
        return { ok: false, msg: 'A shell further out has electrons while a closer shell still has room. The open samples fill each shell before they start the next one.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample D loaded 2 / 8 / 1.',
      title: 'Electron Shells',
      body: 'Each shell holds a fixed number: 2 in the first, 8 in the second and third. A shell fills up before the next one starts, which is why 11 electrons come out as 2, 8 and 1.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Outer Shell Decides',
    briefing: {
      speaker: SPEAKER,
      body: 'The bench is now equipped with a reaction tester. Drop a sample in its slot and press "Run Tester" to see if it trades electrons.'
    },
    prompt: 'Sort the two cased samples by whether they give, take, or keep their electrons.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        specimen('s1', 'SAMPLE A', 12, 12, { p: 3, n: 4, rings: [2, 1] }),
        specimen('s2', 'SAMPLE B', 32, 12, { p: 17, n: 18, rings: [2, 8, 7] }),
        specimen('s3', 'SAMPLE C', 52, 12, { p: 10, n: 10, rings: [2, 8] }),
        specimen('s4', 'SAMPLE D', 72, 12, { p: 19, n: 20, rings: [2, 8, 8, 1], casing: true }),
        specimen('s5', 'SAMPLE E', 92, 12, { p: 9, n: 10, rings: [2, 7], casing: true })
      ],
      zones: {
        slots: [{ id: 'tester', label: 'Sample', at: { x: 66, y: 53 } }],
        trays: [
          specimenTray('gives', 'Gives one away', 21, 36),
          specimenTray('takes', 'Takes one on', 60, 36),
          specimenTray('inert', 'Will not trade', 99, 36)
        ]
      },
      fixtures: [{ id: 'tester', kind: 'tester', label: 'Tester', runLabel: 'Run Tester', at: { x: 96, y: 55 }, size: { w: 34, h: 14 }, props: { slot: 'tester' } }]
    }),
    hints: [
      'Drop a sample in the tester slot and press "Run Tester" to see how it trades.',
      'Test the open samples first and compare what each one does with its outer ring.',
      'Compare what each cased sample does with the open samples to work out how its outer shell behaves.'
    ],
    check(state) {
      const t = state.table;
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      const d = where('s4');
      const e = where('s5');
      if (!['gives', 'takes', 'inert'].includes(d) || !['gives', 'takes', 'inert'].includes(e)) {
        return { ok: false, notYet: true, msg: 'Both cased samples need a tray.' };
      }
      if (!t.pieces.s4.props.tested || !t.pieces.s5.props.tested) {
        return { ok: false, msg: 'Only one cased sample has been tested. Run the tester on both cased samples first.' };
      }
      if (d === 'inert' || e === 'inert') {
        return { ok: false, msg: 'One of them is in the tray for a full shell, which is not what a cased sample here has. Compare how each sample traded with the open samples.' };
      }
      if (d !== 'gives') return { ok: false, msg: 'Sample D is in the wrong tray. Compare what it did in the tester with the open samples.' };
      if (e !== 'takes') return { ok: false, msg: 'Sample E is in the wrong tray. Compare what it did in the tester with the open samples.' };
      return { ok: true };
    },
    reward: {
      log: 'Both cased samples tested and filed.',
      title: 'Valence Electrons',
      body: 'Atoms achieve stability when their outer shells are full. The electrons in the outermost shell are the valence electrons, and they decide how an atom reacts: one valence electron gets given away, seven takes one to make eight, and a full shell of eight trades nothing at all.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Same Weight, Different Atom',
    prompt: 'Sort Samples B and C as the same element as Sample A or a different one.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('sa', 'SAMPLE A', 24, 12, { p: 6, n: 6, rings: [2, 4], counts: true }), fixed: true },
        specimen('sb', 'SAMPLE B', 54, 12, { p: 6, n: 7, rings: [2, 4], counts: true }),
        specimen('sc', 'SAMPLE C', 84, 12, { p: 7, n: 6, rings: [2, 5], counts: true })
      ],
      zones: {
        trays: [
          specimenTray('same', 'Same element as Sample A', 30, 38, 44),
          specimenTray('other', 'A different element', 82, 38, 44)
        ]
      }
    }),
    hints: [
      'Compare each of the other two with Sample A, count for count.',
      'Both suspects hold 13 particles, so the total will not separate them, but their proton counts and outer shells differ.',
      'Set each suspect beside the reference sample and compare two things, the proton count and the outer shell: the one that matches on both is the same element, whatever it weighs.'
    ],
    check(state) {
      const t = state.table;
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      const b = where('sb');
      const c = where('sc');
      if (!['same', 'other'].includes(b) || !['same', 'other'].includes(c)) return { ok: false, notYet: true, msg: 'Both samples need a tray.' };
      if (b !== 'same') {
        return { ok: false, msg: 'Sample B is in the wrong tray. Compare its protons and its outer shell with Sample A\'s — those decide how an atom behaves, and its weight does not.' };
      }
      if (c !== 'other') {
        return { ok: false, msg: 'Sample C is in the wrong tray. Count its protons and its outer-shell electrons, and compare both with Sample A\'s.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B matches Sample A. Sample C does not.',
      title: 'Elements and Isotopes',
      body: 'What kind of atom you have depends only on the number of protons, which is called the atomic number. Samples A and B both have 6 protons (carbon), while Sample C has 7 protons (nitrogen, a different element). Samples A and B have the same number of protons but different numbers of neutrons, which makes them isotopes.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Take Electrons Off',
    briefing: {
      speaker: SPEAKER,
      body: 'Drag an electron off its shell and out of the atom, and the needle follows. Drag it back and the atom is whole again.'
    },
    prompt: 'Bring Sample A to a charge of +2.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        nucleus('nuc', 'SAMPLE A', 14, 12, 11, 12),
        ...electrons('e', 2, 'tray:sh1'),
        ...electrons('e', 8, 'tray:sh2', 3),
        ...electrons('e', 1, 'tray:sh3', 11)
      ],
      zones: { trays: [SOURCE_TRAY('Taken off', 12), ...SHELLS] },
      fixtures: [needleFixture(['tray:sh1', 'tray:sh2', 'tray:sh3'], 'nuc', { x: 50, y: 13 }, 4)]
    }),
    hints: [
      'Drag electrons out of the shells and into the tray, and watch the needle.',
      'Every electron you take off leaves one proton with nothing to cancel it, so the needle climbs by one each time.',
      'Take electrons off one at a time, reading the needle after each, and stop when it reads the charge you were asked for.'
    ],
    check(state) {
      const q = needleReading(state.table, 'needle');
      if (q === 2) return { ok: true };
      if (q === 0) return { ok: false, msg: 'Sample A is still neutral. Take electrons off it until the needle shows the charge you were asked for.' };
      return { ok: false, msg: 'The needle is not at the charge you were asked for. Put electrons back or take more off until it matches.' };
    },
    reward: {
      log: 'Sample A brought to +2.',
      title: 'Ions',
      body: 'An atom that has gained or lost electrons is called an ion. Taking 2 electrons off left 2 protons with nothing to cancel them, so this is now a +2 ion — the same element, carrying a charge.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Tell Them Apart',
    prompt: 'Sort each sample as an isotope, an ion or a different element from reference Sample D.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('sd', 'SAMPLE D', 14, 12, { p: 7, n: 7, rings: [2, 5], counts: true, needle: true }), fixed: true },
        specimen('n1', 'SAMPLE A', 42, 12, { p: 7, n: 8, rings: [2, 5], counts: true, needle: true }),
        specimen('n2', 'SAMPLE B', 68, 12, { p: 7, n: 7, rings: [2, 4], counts: true, needle: true }),
        specimen('n3', 'SAMPLE C', 94, 12, { p: 8, n: 8, rings: [2, 6], counts: true, needle: true })
      ],
      zones: {
        trays: [
          specimenTray('heavy', 'Isotope', 21, 38),
          specimenTray('charged', 'Ion', 60, 38),
          specimenTray('other', 'Different element', 99, 38)
        ]
      }
    }),
    hints: [
      'Compare each of the three with Sample D, looking at its protons, its neutrons and its needle.',
      'Line each sample up against the reference\'s protons, neutrons and needle, and find the one of those three it does not match.',
      'A different proton count is a different element; the same protons with a different neutron count is an extra neutron; the same protons and neutrons with the needle off zero is a missing electron.'
    ],
    check(state) {
      const t = state.table;
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      const want = { n1: 'heavy', n2: 'charged', n3: 'other' };
      const labels = { n1: 'Sample A', n2: 'Sample B', n3: 'Sample C' };
      for (const id of ['n1', 'n2', 'n3']) {
        if (!['heavy', 'charged', 'other'].includes(where(id))) return { ok: false, notYet: true, msg: `${labels[id]} has no tray yet.` };
      }
      if (where('n1') !== want.n1) {
        return { ok: false, msg: 'Sample A is in the wrong tray. Check its protons, its neutrons and its needle against the reference, one at a time, and find the one that differs.' };
      }
      if (where('n2') !== want.n2) {
        return { ok: false, msg: 'Sample B is in the wrong tray. Check its protons, its neutrons and its needle against the reference, one at a time, and find the one that differs.' };
      }
      if (where('n3') !== want.n3) {
        return { ok: false, msg: 'Sample C is in the wrong tray. Count its protons and compare them with the reference\'s.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'All three identified.',
      title: 'Three Ways to Differ',
      body: 'Change the neutrons and you get an isotope. Change the electrons and you get an ion. Change the protons and you get a different element altogether.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   Three short cards: what the player found, the model it adds up to, and
   what the next bench is about.
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'An atom is mostly empty space with a nucleus at the center. The nucleus holds protons and neutrons, and electrons sit outside it in shells.'
    },
    {
      heading: 'What Each One Does',
      body: 'Protons (+1) decide which element you have. Neutrons (0) only add weight. Electrons (-1) cancel the protons, and the ones in the outer shell decide how the atom reacts.'
    },
    {
      heading: 'Next',
      body: 'You have now counted protons for a dozen atoms. Next, we\'ll look at how to sort atoms!'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   Five questions covering nucleus, protons, neutrons, electrons, shells,
   and ions. Appear after the debrief, before the player exits.
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'You fire 40 shots at an atom. 39 go straight through and 1 bounces back. What does that tell you?',
    options: [
      { id: 'a', label: 'The atom is solid all the way through' },
      { id: 'b', label: 'The atom is mostly empty space with a tiny dense nucleus' },
      { id: 'c', label: 'The atom is a hollow ball' },
      { id: 'd', label: 'The atom has nothing inside it' }
    ],
    answer: 'b',
    explanation: 'Almost everything passes through because the atom is mostly empty. The one rebound hit the tiny, very dense nucleus.'
  },
  {
    question: 'A nucleus holds 8 protons and 8 neutrons. Which element is it?',
    options: [
      { id: 'a', label: 'Carbon (6 protons)' },
      { id: 'b', label: 'Nitrogen (7 protons)' },
      { id: 'c', label: 'Oxygen (8 protons)' },
      { id: 'd', label: 'Neon (10 protons)' }
    ],
    answer: 'c',
    explanation: 'The proton count decides the element. 8 protons is oxygen, whatever the neutron count is.'
  },
  {
    question: 'An atom has 6 protons and 6 electrons. What is its charge?',
    options: [
      { id: 'a', label: '+6' },
      { id: 'b', label: '−6' },
      { id: 'c', label: '0 (electrically neutral)' },
      { id: 'd', label: '+12' }
    ],
    answer: 'c',
    explanation: 'Protons are +1 and electrons are −1, so equal numbers of them cancel out to zero.'
  },
  {
    question: 'Carbon has 6 electrons: 2 in the first shell and 4 in the second. How many valence electrons is that?',
    options: [
      { id: 'a', label: '2' },
      { id: 'b', label: '4' },
      { id: 'c', label: '6' },
      { id: 'd', label: '8' }
    ],
    answer: 'b',
    explanation: 'Valence electrons are the ones in the outermost shell, and carbon keeps 4 there.'
  },
  {
    question: 'You knock 2 electrons off a sodium atom that had 11 protons and 11 electrons. What have you made?',
    options: [
      { id: 'a', label: 'Na⁻ (charge −1)' },
      { id: 'b', label: 'Na⁺ (charge +1)' },
      { id: 'c', label: 'Na²⁺ (charge +2)' },
      { id: 'd', label: 'Na²⁻ (charge −2)' }
    ],
    answer: 'c',
    explanation: '11 protons and 9 electrons left, so the charge is +2. An atom that has lost electrons is an ion.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const to = (piece, target) => ({ place: { piece, to: target } });
const run = id => ({ run: id });

/** Every electron id in `ids` into a zone. */
const moveAll = (ids, zone) => ids.map(id => to(id, zone));
const ids = (prefix, from, upto) => Array.from({ length: upto - from + 1 }, (_, i) => `${prefix}${from + i}`);

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [run('beam'), to('core', 'slot:model')],
  [1, 3, 6, 7, 8, 11].map(i => ({ flip: `sp${i}` })),
  moveAll(ids('e', 1, 8), 'tray:out'),
  [...moveAll(ids('e', 1, 2), 'tray:sh1'), ...moveAll(ids('e', 3, 10), 'tray:sh2'), to('e11', 'tray:sh3')],
  [
    to('s1', 'slot:tester'), run('tester'), to('s2', 'slot:tester'), run('tester'), to('s3', 'slot:tester'), run('tester'),
    to('s4', 'slot:tester'), run('tester'), to('s5', 'slot:tester'), run('tester'),
    to('s4', 'tray:gives'), to('s5', 'tray:takes')
  ],
  [to('sb', 'tray:same'), to('sc', 'tray:other')],
  [to('e11', 'tray:src'), to('e10', 'tray:src')],
  [to('n1', 'tray:heavy'), to('n2', 'tray:charged'), to('n3', 'tray:other')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [run('beam'), to('hollow', 'slot:model')],
  [1, 3, 6, 7, 8, 9].map(i => ({ flip: `sp${i}` })),
  moveAll(ids('e', 1, 5), 'tray:out'),
  [...moveAll(ids('e', 1, 3), 'tray:sh1'), ...moveAll(ids('e', 4, 11), 'tray:sh2')],
  [to('s4', 'slot:tester'), run('tester'), to('s5', 'slot:tester'), run('tester'), to('s4', 'tray:inert'), to('s5', 'tray:takes')],
  [to('sb', 'tray:other'), to('sc', 'tray:other')],
  [to('e11', 'tray:src')],
  [to('n1', 'tray:heavy'), to('n2', 'tray:other'), to('n3', 'tray:other')]
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
