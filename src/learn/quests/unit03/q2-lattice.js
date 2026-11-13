/**
 * q2-lattice.js — Ligar, bench two: STONE AND WIRE.
 *
 * The second bench on the world and its second TABLETOP (plan `bench-tabletop.md`, phase T3a). Bench one settled what a bond IS;
 * this one asks what a block of each kind actually DOES, because that is the only reason a bond type matters to anybody holding a
 * piece of salvage. The table is the ore drift's: blocks on the ledge, a hotplate that takes a block on its plate, a pair of leads
 * that clip across a block and light a lamp while a current passes, and a grid to build ions into.
 *
 * THE CLICK (2026-10-23 rollout). Almost everyone believes that salt, being made of charged particles, lets a current through. So the
 * quest opens on a prediction about a cold block of salt (the wrong idea is a card), and the next bench clips the leads on four
 * blocks, cold and molten: the salt stays dark until it is molten, the copper lights cold, and two more blocks never light. Only
 * then is the word "conduct" given, and the lattice is built by hand to show why the ions cannot move.
 *
 *   1  PREDICT: does a cold block of salt light the lamp?                   (no instrument; the wrong idea is a card)
 *   2  clip the leads on four blocks, cold and molten, and tray them        -> a current needs charged particles free to move
 *   3  heat the four blocks and rail them by melting point                  -> the four kinds of solid
 *   4  slide a layer of a built salt crystal and say what it does           -> why an ionic lattice is brittle
 *   5  find the one sealed block that holds at 900 degrees and passes none  -> a covalent network solid
 *   6  hammer a metal and two alloys                                        -> alloys are harder
 *   7  sort three alloys by where the added atoms sit                       -> substitutional and interstitial
 *   8  rail four new blocks by melting point from their pictures alone      -> structure predicts melting point
 *
 * Teaching pass 2026-11-12: "Alloys on the Hotplate" and "Do Alloys Conduct" (a third and fourth alloy stage, each a ranking of a
 * reading) were cut; the salt crystal of stage 4 stands built; stage 7 sorts the alloy blocks themselves, not name cards. The
 * pre-pass file is `archive/2026-11-11/ligar/q2-lattice.before.js`.
 *
 * THE TABLE (`table/`, `kits/bonds.js`). Nothing here is a switch with an outcome behind it. A block is MOLTEN exactly while it
 * stands on the hotplate at or past its melting point, so the temperature it gives way at is found by turning the dial and taking
 * the block off cools it; the leads' lamp is `conductionOf` for the block as it is right now. `SOLUTIONS` and `MISSES` are scripts
 * of the player's own actions, replayed by `verify:table` by drag and by two taps.
 *
 * `q1-joins` earned bond, ionic and covalent, so those are plain words here. What this quest has to earn is on `VOCABULARY`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { conductionOf } from '../../engine/joinbench.js';
import {
  bondsTable, slabPiece, hotplate, declOf, gridRead, piecesIn, guessCard, strikeOf
} from '../../table/kits/bonds.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned. Specific terms first: the schedule is
 * searched in order and the first match decides when a word becomes sayable.
 */
export const VOCABULARY = [
  { term: /\bsubstitutional\b/i, introducedAt: 7 },
  { term: /\binterstitial\b/i, introducedAt: 7 },
  { term: /\balloys?\b/i, introducedAt: 6 },
  { term: /\bmelting points?\b/i, introducedAt: 3 },
  { term: /\blattices?\b/i, introducedAt: 4 },
  { term: /\bbrittle\b/i, introducedAt: 4 },
  { term: /\bconduct\w*\b/i, introducedAt: 2 }
];

export const BUILDS_ON = ['unit03/q1-joins'];

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const SPEAKER = 'Vess';
const QUEST_KEY = 'unit03/q2-lattice';
const GUESSES = [
  ['lights', 'the lamp lights on the cold salt', ['The lamp lights', 'Salt has', 'charged particles']],
  ['dark', 'the lamp stays dark on the cold salt', ['The lamp stays dark', 'but would light if', 'the salt melted']],
  ['never', 'the lamp never lights on salt, cold or molten', ['The lamp never lights', 'on salt, cold', 'or molten']]
];

/**
 * The legend lines. A key whose label says what it does owes nothing, and this bench's tools are pieces you
 * lay on a block (a hammer, a pair of leads) and one key ("Slide a Layer"): every one says what it does.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE BLOCKS
   `melt` is the one thing the bench is simply told, because a temperature is a measurement; everything
   else a block does is derived from its build (`bonds.js`, `joinbench.js` `planSlab`).
   ------------------------------------------------------------------ */

const SALT = { build: 'grid', melt: 801, tint: 'bone' };
const VENT = { build: 'clusters', melt: 115, tint: 'sand', cluster: 3, groups: 8 };
const ARCH = { build: 'web', melt: 1710, tint: 'iron' };
const COPPER = { build: 'metallic', melt: 1085, tint: 'rust' };
// The alloy blocks of stages 6 and 7 (`joinbench.js` `planSlab`): one kind of atom in rows, with a few atoms of another kind mixed in.
const BRASS = { build: 'metallic', alloy: 'sub', melt: 930, tint: 'rust' };
const IRON = { build: 'metallic', melt: 1538, tint: 'pale' };
const STEEL = { build: 'metallic', alloy: 'int', melt: 1450, tint: 'pale' };
const BRONZE = { build: 'metallic', alloy: 'sub', melt: 950, tint: 'rust' };
const sealed = (d, melt) => ({ ...d, melt, sealed: true });

/* ------------------------------------------------------------------
   THE TABLES
   One layout, so the furniture is always where the hand expects it (150 x 72 units): the hotplate across
   the top left, the blocks along y 44, the tools along y 61, and whatever a stage files things into down the right.
   ------------------------------------------------------------------ */

const PLATE_AT = { x: 49, y: 19 };
const PLATE_Y = 26;            // a block's middle when it lies on the plate
const BENCH_Y = 44;
const TOOLS_Y = 61;
const bench = (i, step = 24) => ({ x: 14 + i * step, y: BENCH_Y });
/** What each tool does, printed under the place it hangs (`caption`): a bench that has to be known before it can be used is a bad bench. */
const CAPTION = { hammer: 'Strikes a block', leads: 'Tests current' };
const toolAt = (id, label, i) => ({ id, kind: id, label, at: { x: 14 + i * 28, y: TOOLS_Y }, caption: CAPTION[id] });
const leads = i => toolAt('leads', 'Leads', i);
const plate = max => hotplate('hp', PLATE_AT, { max });
const tray = (id, label, y, h = 18) => ({ id, label, at: { x: 122, y }, size: { w: 44, h }, cell: 22 });
const heat = value => ({ setDial: { fixture: 'hp', dial: 'heat', value } });

/** The twelve ions of stage 4: six sodium ions and six chlorine ions in two rows, and a 4 x 3 grid of cells. */
const CELLS = Array.from({ length: 3 }, (_, r) => Array.from({ length: 4 }, (_, c) => `g${r}${c}`));
const GRID_SLOTS = CELLS.flatMap((row, r) => row.map((id, c) => ({ id, label: '', at: { x: 80 + c * 14, y: 12 + r * 14 }, size: { w: 13.4, h: 13.4 } })));
/** The crystal stands built (teaching pass 2026-11-12: placing twelve ions by hand came before the idea and taught nothing): a sodium ion where row + column is even. */
const IONS = (() => {
  let na = 0;
  let cl = 0;
  return GRID_SLOTS.map((slot, k) => {
    const plus = (Math.floor(k / 4) + (k % 4)) % 2 === 0;
    return { id: plus ? `na${++na}` : `cl${++cl}`, kind: 'ion', label: plus ? 'Na' : 'Cl', at: slot.at, fixed: true, zone: `slot:${slot.id}`, props: { el: plus ? 'Na' : 'Cl', charge: plus ? 1 : -1, disk: true } };
  });
})();
/** What the slid crystal does: the cards of stage 4 and the slot one is laid in. */
const SLIDE_CARDS = [
  guessCard('hold', 'it holds together as before', ['It holds together', 'as before'], { x: 18, y: 12 }),
  guessCard('bend', 'it bends and stays in one piece', ['It bends and stays', 'in one piece'], { x: 18, y: 32 }),
  guessCard('split', 'it splits along the layer', ['It splits along', 'the layer'], { x: 18, y: 52 })
];
const SLIDE_SLOT = { id: 'guess', label: 'What happens', at: { x: 52, y: 32 }, size: { w: 32, h: 20 } };

/** The block standing in a tray, as pieces. */
const trayOf = (t, id) => piecesIn(t, `tray:${id}`, 'slab');
/** Which way a block carries a current, from its build alone: cold and molten, only molten, or never. */
const carries = d => (conductionOf(d, false) ? 'both' : conductionOf(d, true) ? 'molten' : 'never');

const UNTRAYED = 'Sort every block into a tray before you submit.';
const name = p => p.label.charAt(0) + p.label.slice(1).toLowerCase();

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Salt and the Lamp',
    prompt: 'A cold block of salt is wired to a lamp: does the lamp light?',
    cards: GUESSES,
    hints: [
      'Lay one of the three cards in the slot.',
      'Salt is made of sodium ions and chloride ions, which carry charge, packed tightly in a solid.',
      'A prediction is never graded, so lay the card you think most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage wires four blocks to the lamp, salt among them.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Wire Each Block',
    briefing: {
      speaker: SPEAKER,
      body: 'A material conducts electricity only if it holds charged particles that are free to move. Each block\'s picture shows its particles, with a + or − on the ones that carry a charge.'
    },
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'which blocks conduct cold, which only when molten, and which never?');
    },
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s1', 'BLOCK A', SALT, bench(0)),
        slabPiece('s2', 'BLOCK B', VENT, bench(1)),
        slabPiece('s3', 'BLOCK C', COPPER, bench(2)),
        slabPiece('s4', 'BLOCK D', ARCH, bench(3)),
        leads(0)
      ],
      zones: { trays: [tray('both', 'Conducts cold', 14), tray('molten', 'Only when molten', 37), tray('never', 'Never conducts', 60)] },
      fixtures: [plate(2000)]
    }),
    hints: [
      'Drag the leads onto a block to test it cold, then put the block on the hotplate and raise the heat until it is molten.',
      'Compare the pictures of a block whose lamp lit and one whose lamp stayed dark: look for charged particles and for streaks behind them.',
      'A current is charge on the move, so ask what each block has that carries a charge and whether anything holds it in place.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['s1', 's2', 's3', 's4'];
      const where = Object.fromEntries(ids.map(id => [id, ['both', 'molten', 'never'].find(k => trayOf(t, k).some(p => p.id === id)) || null]));
      if (ids.some(id => !where[id])) return { ok: false, notYet: true, msg: UNTRAYED };
      const wrong = ids.find(id => where[id] !== carries(declOf(t.pieces[id])));
      if (wrong) return { ok: false, msg: `${name(t.pieces[wrong])} is in a tray that does not match its lamp: test it with the leads again, cold and then molten.` };
      return { ok: true };
    },
    get reward() {
      return {
        log: 'Salt conducted only when molten. Copper conducted cold and molten. The other two never conducted.',
        title: 'What Conducts',
        body: `${verdictLine(QUEST_KEY, 'dark')}Block A has mobile − charges so it conducts cold; Block B's ions are held in place until it melts. The other two blocks have no charged particles free to move, so they never conduct.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Heat All Four',
    briefing: {
      speaker: SPEAKER,
      body: 'These blocks are the four kinds of solid: a molecular solid is separate molecules, an ionic solid is ions, a metal is positive ions among loose electrons, and a covalent network solid is atoms covalently bonded throughout. The melting point is the temperature at which a solid\'s particles come free of their places.'
    },
    prompt: 'Which block has the lowest melting point and which the highest?',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s1', 'BLOCK A', SALT, bench(0)),
        slabPiece('s2', 'BLOCK B', VENT, bench(1)),
        slabPiece('s3', 'BLOCK C', COPPER, bench(2)),
        slabPiece('s4', 'BLOCK D', ARCH, bench(3))
      ],
      zones: { rail: { id: 'rail', at: { x: 56, y: 55 }, size: { w: 104, h: 14 }, first: 'Melts lowest', last: 'Melts highest', items: ['s1', 's2', 's3', 's4'], start: ['s1', 's4', 's2', 's3'] } },
      fixtures: [plate(2000)]
    }),
    hints: [
      'Drag the blocks onto the hotplate and raise the heat dial; a block shows MOLTEN once the plate reaches its melting point.',
      'Compare the pictures: in which block are the particles separate groups, and in which is every atom bonded to its neighbours?',
      'Melting has to free the particles from each other, so ask what holds one particle to the next in each picture.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      const melt = id => declOf(t.pieces[id]).melt;
      const want = order.slice().sort((a, b) => melt(a) - melt(b));
      if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four blocks back on the rail in order.' };
      if (order.join() === want.join()) return { ok: true };
      const k = order.findIndex((id, i) => id !== want[i]);
      return { ok: false, msg: `${name(t.pieces[order[k]])} is out of place on the rail: heat it beside its neighbour and see which turns molten first.` };
    },
    reward: {
      log: 'Block B 115 C. Block A 801 C. Block C 1085 C. Block D 1710 C.',
      title: 'Melting Point',
      body: 'Separate molecules part easily, so the molecular solid has the lowest melting point. The ionic solid and the metal need far more heat, and the covalent network solid, bonded throughout, needs the most.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Slide a Layer',
    prompt: 'What happens to a salt crystal when one layer of ions slides one place along?',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [...IONS, ...SLIDE_CARDS],
      zones: { slots: [...GRID_SLOTS, SLIDE_SLOT] },
      fixtures: [{
        id: 'grid', kind: 'lattice', label: 'Salt crystal', at: { x: 101, y: 59 }, size: { w: 62, h: 16 }, runLabel: 'Slide a Layer',
        props: { cells: CELLS, layer: 0 }
      }],
      opts: { diskAtoms: true }
    }),
    hints: [
      'Press "Slide a Layer" to move the top row of ions one place along, then lay a card in the slot.',
      'Compare the charges that sit side by side across the slid layer before the slide and after it.',
      'Opposite charges attract and like charges repel, so ask what the top row and the row under it now do to each other.'
    ],
    check(state) {
      const t = state.table;
      const g = gridRead(t, 'grid');
      const card = piecesIn(t, `slot:${SLIDE_SLOT.id}`)[0];
      if (!g.slid) return { ok: false, notYet: true, msg: 'Press "Slide a Layer" first.' };
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      if (card.id === 'split') return { ok: true };
      return { ok: false, msg: `${g.faced} pairs of ions with the same charge now sit side by side across the slid layer, and like charges repel.` };
    },
    reward: {
      log: 'The slid layer put like charges side by side.',
      title: 'Why Salt Is Brittle',
      body: 'After the slide, ions of the same charge sat side by side and repelled, so the crystal split. This is why an ionic lattice, the regular arrangement of ions in the solid, is brittle.',
      model: { type: 'crystal', cation: 'Na', anion: 'Cl', n: 3, caption: 'Sodium and chloride ions alternating in a crystal.' }
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Solid at 900 °C',
    prompt: 'Which sealed block stays solid at 900 °C and never conducts?',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('x1', 'BLOCK A', sealed(SALT, 770), bench(0)),
        slabPiece('x2', 'BLOCK B', sealed(VENT, 80), bench(1)),
        slabPiece('x3', 'BLOCK C', sealed(COPPER, 1085), bench(2)),
        slabPiece('x4', 'BLOCK D', sealed(ARCH, 3550), bench(3)),
        leads(0)
      ],
      zones: { slots: [{ id: 'liner', label: 'My answer', at: { x: 122, y: 30 }, size: { w: 26, h: 20 } }] },
      fixtures: [plate(1000)]
    }),
    hints: [
      'The blocks are sealed, so test them: heat them on the hotplate and drag the leads onto them.',
      'Look at both the particle pictures and what happens on the hotplate and leads.',
      'Go through the four kinds of solid and ask which one neither melts at that temperature nor has charged particles free to move.'
    ],
    check(state) {
      const t = state.table;
      const held = Object.values(t.pieces).find(p => p.kind === 'slab' && p.zone === 'slot:liner');
      if (!held) return { ok: false, notYet: true, msg: 'Put a block in the slot.' };
      const d = declOf(held);
      if (d.melt <= 900) return { ok: false, msg: `${name(held)} is molten on the hotplate at 900 °C.` };
      if (conductionOf(d, false) || conductionOf(d, true)) return { ok: false, msg: `${name(held)} lights the lamp.` };
      return { ok: true };
    },
    reward: {
      log: 'Block D: still solid at 900 °C, no current.',
      title: 'Covalent Network Solid',
      body: 'Block D is a covalent network solid. It melts only when covalent bonds break, and it has no charged particles free to move, so it stays solid and never conducts.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Hammer the Metals',
    briefing: {
      speaker: SPEAKER,
      body: 'An alloy is a metal with atoms of another element mixed in. Two of these three blocks are alloys.'
    },
    prompt: 'Which block changes shape most when hammered and which least?',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('m1', 'BLOCK A', COPPER, bench(0)),
        slabPiece('m2', 'BLOCK B', STEEL, bench(1)),
        slabPiece('m3', 'BLOCK C', BRASS, bench(2)),
        toolAt('hammer', 'Hammer', 0)
      ],
      zones: { trays: [tray('bends', 'Bends a lot', 14), tray('dents', 'Dents a little', 37), tray('holds', 'Does not give', 60)] }
    }),
    hints: [
      'Drag the hammer onto each block to strike it, then look at its picture again.',
      'Compare how far the rows of atoms have shifted in each struck block, and what else sits among those rows.',
      'A metal changes shape when its rows of atoms slide past each other, so ask what could stop a row from sliding.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['m1', 'm2', 'm3'];
      const word = { bent: 'bends', dented: 'dents', held: 'holds' };
      const want = id => word[strikeOf(declOf(t.pieces[id]).build, declOf(t.pieces[id]).alloy)];
      const where = Object.fromEntries(ids.map(id => [id, ['bends', 'dents', 'holds'].find(k => trayOf(t, k).some(p => p.id === id)) || null]));
      if (ids.some(id => !where[id])) return { ok: false, notYet: true, msg: UNTRAYED };
      if (ids.some(id => !t.pieces[id].props.struck)) return { ok: false, notYet: true, msg: 'Strike every block before you submit.' };
      const wrong = ids.find(id => where[id] !== want(id));
      if (wrong) return { ok: false, msg: `${name(t.pieces[wrong])} is in a tray that does not match the word printed on it after the blow.` };
      return { ok: true };
    },
    reward: {
      log: 'Block A bent most. Block C dented a little. Block B did not give.',
      title: 'Alloys',
      body: 'In the pure metal the rows of atoms slid, so it bent. In each alloy the atoms of the other element blocked the sliding, which makes an alloy harder than the pure metal.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Where the Atoms Go',
    briefing: {
      speaker: SPEAKER,
      body: 'An alloy is substitutional if the added atoms take the places of metal atoms, and interstitial if they sit in the gaps between them.'
    },
    prompt: 'Which of these alloys are substitutional and which interstitial?',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('y1', 'BRASS', BRASS, bench(0, 30)),
        slabPiece('y2', 'STEEL', STEEL, bench(1, 30)),
        slabPiece('y3', 'BRONZE', BRONZE, bench(2, 30))
      ],
      zones: { trays: [tray('sub', 'Substitutional', 17, 24), tray('int', 'Interstitial', 52, 24)] }
    }),
    hints: [
      'Each block\'s picture shows the metal atoms in rows and the added atoms in another colour.',
      'Compare the size of the added atoms with the size of the metal atoms in each picture.',
      'An atom can only take a metal atom\'s place if it is close to that size, so ask where a much smaller atom could fit.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['y1', 'y2', 'y3'];
      const where = Object.fromEntries(ids.map(id => [id, ['sub', 'int'].find(k => trayOf(t, k).some(p => p.id === id)) || null]));
      if (ids.some(id => !where[id])) return { ok: false, notYet: true, msg: UNTRAYED };
      const wrong = ids.find(id => where[id] !== declOf(t.pieces[id]).alloy);
      if (wrong) return { ok: false, msg: where[wrong] === 'sub' ? `${name(t.pieces[wrong])}'s added atoms are drawn between the rows of metal atoms, not in the rows.` : `${name(t.pieces[wrong])}'s added atoms are drawn in the rows, where metal atoms would stand.` };
      return { ok: true };
    },
    reward: {
      log: 'Brass and bronze: in the rows. Steel: in the gaps.',
      title: 'Substitutional and Interstitial Alloys',
      body: 'In brass and bronze the added atoms are close in size to the host metal atoms and take their places: substitutional alloys. In steel the added atoms are far smaller and sit in the gaps: an interstitial alloy.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Blocks Not Yet Heated',
    prompt: 'Which of these four new blocks will have the lowest melting point and which the highest?',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('r1', 'BLOCK A', { build: 'web', melt: 2200, tint: 'iron' }, bench(0)),
        slabPiece('r2', 'BLOCK B', { build: 'clusters', melt: 60, tint: 'sand', cluster: 3, groups: 8 }, bench(1)),
        slabPiece('r3', 'BLOCK C', { build: 'grid', melt: 993, tint: 'bone' }, bench(2)),
        slabPiece('r4', 'BLOCK D', { build: 'metallic', melt: 1085, tint: 'rust' }, bench(3))
      ],
      zones: { rail: { id: 'rail', at: { x: 56, y: 55 }, size: { w: 104, h: 14 }, first: 'Melts lowest', last: 'Melts highest', items: ['r1', 'r2', 'r3', 'r4'], start: ['r1', 'r2', 'r3', 'r4'] } }
    }),
    hints: [
      'There is no hotplate here: each block\'s picture shows its particles, and the blocks go on the rail.',
      'Decide which of the four kinds of solid each picture shows, and compare with the blocks you melted earlier.',
      'Melting has to free the particles from each other, so ask what holds one particle to the next in each picture.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      const melt = id => declOf(t.pieces[id]).melt;
      const want = order.slice().sort((a, b) => melt(a) - melt(b));
      if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four blocks back on the rail in order.' };
      if (order.join() === want.join()) return { ok: true };
      const k = order.findIndex((id, i) => id !== want[i]);
      return { ok: false, msg: `${name(t.pieces[order[k]])} is out of place on the rail: look again at what holds its particles to each other.` };
    },
    reward: {
      log: 'Molecular, ionic, metallic, then network.',
      title: 'Predicting From Structure',
      body: 'The pictures were enough: the molecular solid melts lowest, then the ionic solid and the metal, and the covalent network solid highest.',
      last: true
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['A streak behind a particle', 'shows that it is moving.'],
  3: ['Drag a block onto the hotplate,', 'then turn the heat dial.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'A solid conducts only if it has charged particles free to move: a metal\'s electrons always are, and an ionic solid\'s ions only once it melts. Molecular and covalent network solids have none.'
    },
    {
      heading: 'Melting and Breaking',
      body: 'Melting point follows what holds the particles together: weakest between separate molecules, strongest in a covalent network. An ionic lattice splits when a layer slides, and a metal bends unless an alloy\'s added atoms block its rows.'
    },
    {
      heading: 'Next',
      body: 'The next bench measures how far apart two bonded atoms sit and how much energy holds them.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the
   reducer by direct actions, by drag and by two taps. A block is slid onto the hotplate by setting it down
   inside the plate (`free:X,Y`), and the dial is turned to a setting; nothing here says what a block does.
   ------------------------------------------------------------------ */

const SPOTS = [16, 39, 62, 85];
const onPlate = (id, i) => ({ place: { piece: id, to: `free:${SPOTS[i]},${PLATE_Y}` } });
const into = (piece, trayId) => ({ place: { piece, to: `tray:${trayId}` } });
const clip = (block) => ({ join: ['leads', block] });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });
/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [guess('dark')],
  [
    clip('s1'), onPlate('s1', 0), heat(825), into('s1', 'molten'),
    clip('s2'), onPlate('s2', 1), into('s2', 'never'),
    heat(0), clip('s3'), onPlate('s3', 2), heat(1100), into('s3', 'both'),
    clip('s4'), onPlate('s4', 3), heat(1725), into('s4', 'never')
  ],
  [
    onPlate('s1', 0), onPlate('s2', 1), onPlate('s3', 2), onPlate('s4', 3), heat(125), heat(825), heat(1100), heat(1725),
    { place: { piece: 's2', to: 'rail:0' } }, { place: { piece: 's1', to: 'rail:1' } }, { place: { piece: 's3', to: 'rail:2' } }, { place: { piece: 's4', to: 'rail:3' } }
  ],
  [{ run: 'grid' }, guess('split')],
  [onPlate('x1', 0), onPlate('x2', 1), onPlate('x3', 2), onPlate('x4', 3), heat(900), clip('x4'), { place: { piece: 'x4', to: 'slot:liner' } }],
  [
    { join: ['hammer', 'm1'] }, { join: ['hammer', 'm2'] }, { join: ['hammer', 'm3'] },
    into('m1', 'bends'), into('m3', 'dents'), into('m2', 'holds')
  ],
  [into('y1', 'sub'), into('y2', 'int'), into('y3', 'sub')],
  [{ place: { piece: 'r2', to: 'rail:0' } }, { place: { piece: 'r3', to: 'rail:1' } }, { place: { piece: 'r4', to: 'rail:2' } }, { place: { piece: 'r1', to: 'rail:3' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [into('s1', 'both'), into('s2', 'never'), into('s3', 'both'), into('s4', 'never')],
  [{ place: { piece: 's4', to: 'rail:0' } }],
  [{ run: 'grid' }, guess('bend')],
  [{ place: { piece: 'x3', to: 'slot:liner' } }],
  [{ join: ['hammer', 'm1'] }, { join: ['hammer', 'm2'] }, { join: ['hammer', 'm3'] }, into('m1', 'dents'), into('m3', 'bends'), into('m2', 'holds')],
  [into('y1', 'int'), into('y2', 'int'), into('y3', 'sub')],
  [{ place: { piece: 'r1', to: 'rail:0' } }]
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
