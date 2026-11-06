/**
 * Unit 10 · Bench 3 — Galvanic Cells (q3-galvanic)
 *
 * Brinewire's open-cell bench, on the cell kit (`table/kits/cell.js`; the cell, its plot, its balance and its loose parts are in
 * `cell-galv.js`, the numbers in `engine/celldata-galvanic.js`). Two beakers, two metals, a wire and an ammeter; what stands between the
 * beakers is the player's choice. Eight stages and TWO clicks: that a wire between the beakers is enough (it stops almost at once), and
 * that electrons swim through the bridge (they stay in the wire; ions carry the charge through the bridge).
 *
 *   1  PREDICT: a zinc–copper cell joined by a wire alone; what does the ammeter show?
 *   2  TEST: make the current last the whole run; a salt tube, a glass rod and a second wire to try        -> salt bridge
 *   3  which beaker do the electrons move toward, in three cells with new metals on new sides
 *   4  mark the strip where atoms leave and the strip where atoms join, from the counted windows          -> anode, cathode, galvanic cell
 *   5  which way the negative ions in the bridge move, from the beakers' counts and the bridge window
 *   6  weigh the strips before and after the run and say which gained mass
 *   7  write the zinc–copper cell in shorthand (beyond the exam)                                           -> cell notation
 *   8  the anode of a sealed cell, from the ammeter and the balance
 *
 * THE WRONG MODEL IS ON THE TABLE. With a wire alone the plot of the current falls to zero in three seconds; with the salt tube it holds
 * for the whole run. A glass rod fills the same gap and carries no ions, and a second wire is a second path for electrons only: neither
 * helps.
 *
 * Every figure is `engine/celldata.js` and `engine/celldata-galvanic.js`. The cell shows counted ions, never a verdict, and no electrode is
 * labelled with a plus or minus (the CED excludes it). This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  cellTable, selectorFixture, plaqueFixture, note, tag, chip, pieceIn, dialValue
} from '../../table/kits/cell.js';
import { galvFixture, plotFixture, balanceFixture, toolPiece, stripPiece, galvRead, weighed } from '../../table/kits/cell-galv.js';
import { METALS, cellDirection, fmt } from '../../engine/celldata.js';
import {
  electronsToward, windowCounts, sides, START_IONS, START_ATOMS, stripChange, stripMass, WEIGH_RUN_SECONDS, notationChips, notationText
} from '../../engine/celldata-galvanic.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bsalt bridge\b/i, introducedAt: 2 },
  { term: /\banode\b/i, introducedAt: 4 },
  { term: /\bcathode\b/i, introducedAt: 4 },
  { term: /\bgalvanic cells?\b/i, introducedAt: 4 },
  { term: /\boxidation\b/i, introducedAt: 4 },
  { term: /\breduction\b/i, introducedAt: 4 },
  { term: /\bcell notation\b/i, introducedAt: 7 }
];

/** Built quests whose words this bench uses: none yet (the redox words are earned again here, on stage 4). */
export const BUILDS_ON = [];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit10/q3-galvanic';
const GUESS = {
  steady: 'A steady current',
  brief: 'A brief current that dies',
  none: 'No current at all',
  thick: 'Current only if the wire is thick'
};

/* ---------------------------------------------------------------- what each stage puts on the table (inputs; every figure shown is the planner's) */

/** Stage 3's three cells: [id, left metal, right metal, name]. The electrons' side differs from cell to cell. */
const S3_CELLS = [['ra', 'fe', 'cu', 'Cell A'], ['rb', 'cu', 'mg', 'Cell B'], ['rc', 'ag', 'zn', 'Cell C']];
/** Stage 4 and 7: zinc on the left, copper on the right. Stage 5: copper on the left, zinc on the right (the anode changes sides). */
const S4 = { left: 'zn', right: 'cu' };
const S5 = { left: 'cu', right: 'zn' };
const S6 = { left: 'fe', right: 'cu', m0: { fe: 6, cu: 7 } };
const S8 = { left: 'ni', right: 'zn', m0: 6 };

const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });
const run = fixture => ({ run: fixture });

const ion = id => METALS[id].ion;
const sideName = (l, r, id) => (id === l ? 'left' : 'right');

/* ---------------------------------------------------------------- stages */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'A Wire Between Beakers',
    // A PREDICT STAGE: no cell is on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'With a wire joining a zinc electrode in zinc sulfate to a copper electrode in copper sulfate, what does the ammeter show?',
    widget,
    table: cellTable({
      pieces: [
        tag('st1', 'Zn in ZnSO₄', { x: 24, y: 9 }),
        tag('st2', 'joined by a wire', { x: 74, y: 9 }),
        tag('st3', 'Cu in CuSO₄', { x: 124, y: 9 }),
        note('steady', GUESS.steady, { x: 30, y: 30 }),
        note('brief', GUESS.brief, { x: 80, y: 30 }),
        note('none', GUESS.none, { x: 30, y: 50 }),
        note('thick', GUESS.thick, { x: 80, y: 50 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 128, y: 40 }, size: { w: 36, h: 14 } }] }
    }, { w: 150, h: 62 }),
    hints: [
      'Use the four cards and the slot.',
      'Think about what the two beakers hold and what the wire links.',
      'Follow one electron from one strip through the wire, and ask what each beaker looks like afterwards.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, the zinc–copper cell is run with different parts between its beakers.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-link',
    title: 'Keep It Running',
    get prompt() { return guessLine('Make the ammeter keep a current for the whole run.', recall(QUEST_KEY)); },
    widget,
    table: (() => {
      const g = galvFixture('rig', { x: 44, y: 46 }, { left: 'zn', right: 'cu', link: 'seat', wire2: true, plot: true });
      const p = plotFixture('plot', { x: 131, y: 38 }, { rig: 'rig', yMax: 0.6, yTick: 0.2 });
      return cellTable({
        pieces: [toolPiece('tube', 'tube', { x: 28, y: 100 }), toolPiece('rod', 'rod', { x: 88, y: 100 }), toolPiece('wire', 'wire', { x: 148, y: 100 })],
        fixtures: [g.fixture, p],
        zones: { slots: g.slots }
      }, { w: 176, h: 116 });
    })(),
    hints: [
      'Drag a piece into a seat, press "Run", and read the plot; the key under it says what each run held.',
      'Compare the lines of runs with different pieces in place, and look at the last second of each.',
      'Run the cell with one piece at a time, so you can tell which piece changes the line.'
    ],
    check(state) {
      const r = galvRead(state.table, 'rig');
      if (!r.ran) return { ok: false, notYet: true, msg: 'Press "Run" to run the cell.' };
      const end = r.trace[r.trace.length - 1];
      if (end && end.I > 1e-9) return { ok: true };
      const last = r.past[r.past.length - 1];
      const with_ = last.link === 'rod' ? ' with the glass rod between the beakers' : last.w2 ? ' with the second wire in place' : '';
      return { ok: false, msg: `The current fell to zero at ${r.stop} s${with_}; the last run ended at ${fmt(end ? end.I : 0, 2)} A.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const verdict = g === 'brief' ? 'The current did die away without it, as you predicted. ' : g ? 'The current died away without it, not what you predicted. ' : '';
      return {
        log: 'Only the tube of salt solution kept the current going.',
        title: 'Salt Bridge',
        body: `${verdict}With the wire alone the current fell to zero in 3 s, and a glass rod or a second wire changed nothing. The tube of salt solution, a salt bridge, kept it steady: ions move through it and complete the circuit that the wire cannot.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-direction',
    title: 'Which Way the Electrons Go',
    prompt: 'Say which beaker the electrons move toward in each cell, from its ammeter.',
    widget,
    table: (() => {
      const rigs = S3_CELLS.map(([id, l, r, name], i) => galvFixture(id, { x: 31 + i * 61, y: 48 }, { left: l, right: r, compact: true, says: true, title: name }));
      return cellTable({ fixtures: rigs.map(g => g.fixture) }, { w: 184, h: 100 });
    })(),
    hints: [
      'Press "Run" on each cell, then set the "Electrons move toward" dial on it.',
      'Look at which way each needle swings and which metal stands in each beaker.',
      'Read the ammeter\'s own dial for what a needle on the left or on the right means, then match each cell.'
    ],
    check(state) {
      const t = state.table;
      const vals = S3_CELLS.map(([id]) => dialValue(t, id, 'says'));
      if (vals.some(v => v === 3)) return { ok: false, notYet: true, msg: 'Set the dial on every cell.' };
      for (const [id, l, r, name] of S3_CELLS) {
        const want = electronsToward(l, r) === 'left' ? 1 : 2;
        if (dialValue(t, id, 'says') === want) continue;
        const read = galvRead(t, id);
        if (!read.ran) return { ok: false, msg: `${name} has not been run yet.` };
        return { ok: false, msg: `${name}'s needle swung to the ${read.I > 0 ? 'right' : 'left'}.` };
      }
      return { ok: true };
    },
    get reward() {
      const to = S3_CELLS.map(([, l, r]) => METALS[electronsToward(l, r) === 'left' ? l : r].name);
      return {
        log: 'The electrons went to the same metal whichever side it stood on.',
        title: 'The Metals Decide',
        body: `In the three cells the electrons moved toward ${to.join(', ')}. The metals decide the direction, wherever the beakers stand; the left and right of the table do not.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-roles',
    title: 'Atoms Leave, Atoms Join',
    prompt: 'Mark the strip where atoms leave it and the strip where atoms join it, in the zinc–copper cell.',
    widget,
    table: (() => {
      const g = galvFixture('rig', { x: 44, y: 52 }, { ...S4, link: 'fixed', ammeter: false, windows: 'metal', marks: true });
      return cellTable({
        pieces: [tag('leave', 'Atoms leave the strip', { x: 134, y: 30 }), tag('join', 'Atoms join the strip', { x: 134, y: 52 })],
        fixtures: [g.fixture],
        zones: { slots: g.slots.map(s => ({ ...s, size: { w: 28, h: 11 } })) }
      }, { w: 176, h: 104 });
    })(),
    hints: [
      'Press "Run", then drag one card onto each of the two seats above the beakers.',
      'Compare each beaker\'s counts after the run with the counts it began with.',
      'Match the card that says atoms leave to the strip whose atoms went down, and the other card to the other strip.'
    ],
    check(state) {
      const t = state.table;
      const a = pieceIn(t, 'rig.mL'); const b = pieceIn(t, 'rig.mR');
      if (!a || !b) return { ok: false, notYet: true, msg: 'Lay a card on each seat.' };
      const roles = sides(S4.left, S4.right);
      const want = { left: roles.left === 'anode' ? 'leave' : 'join', right: roles.right === 'anode' ? 'leave' : 'join' };
      if (a.id === want.left && b.id === want.right) return { ok: true };
      const r = galvRead(t, 'rig');
      if (!r.ran) return { ok: false, msg: 'The cell has not been run yet.' };
      const c = windowCounts(S4.left, S4.right, { ran: true });
      const bad = a.id !== want.left ? 'left' : 'right';
      const m = METALS[bad === 'left' ? S4.left : S4.right];
      return { ok: false, msg: `After the run the ${bad} beaker held ${c[bad].metal} ${m.ion} ions, against ${START_IONS} at the start, and its strip held ${c[bad].atoms} atoms, against ${START_ATOMS}.` };
    },
    get reward() {
      const d = cellDirection(S4.left, S4.right);
      const A = METALS[d.anode]; const C = METALS[d.cathode];
      return {
        log: 'Atoms left one strip as ions and ions joined the other as atoms.',
        title: 'Anode and Cathode',
        body: `${A.name[0].toUpperCase()}${A.name.slice(1)} atoms left their strip as ${A.ion} ions, giving up electrons: that is oxidation, and the strip is the anode. ${C.ion} ions joined theirs as atoms, taking electrons: that is reduction, and that strip is the cathode. A cell that runs by itself is a galvanic cell.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-ions',
    title: 'What the Bridge Carries',
    prompt: 'Show which way the negative ions in the bridge move while the cell runs.',
    widget,
    table: (() => {
      const g = galvFixture('rig', { x: 44, y: 54 }, { ...S5, link: 'fixed', ammeter: false, windows: 'full', bridgeWindow: true });
      return cellTable({
        fixtures: [
          g.fixture,
          selectorFixture('pick', 'Negative ions move', { x: 134, y: 50 }, { options: ['Toward the anode beaker', 'Toward the cathode beaker', ' '], start: 3, w: 64, list: true })
        ],
        zones: { slots: g.slots }
      }, { w: 176, h: 108 });
    })(),
    hints: [
      'Press "Run", look at the beakers and the glass tube, and set the dial.',
      'Compare each beaker\'s ion counts after the run, and the short lines behind the ions in the tube.',
      'Ask which beaker gained positive charge from its strip, and which kind of ion in the tube would balance it.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 3) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      const r = galvRead(state.table, 'rig');
      if (!r.ran) return { ok: false, msg: 'The cell has not been run yet.' };
      const c = windowCounts(S5.left, S5.right, { ran: true });
      const d = cellDirection(S5.left, S5.right);
      const side = sideName(S5.left, S5.right, d.anode);
      return { ok: false, msg: `The ${ion(d.anode)} count rose from ${START_IONS} to ${c[side].metal} in the ${side} beaker.` };
    },
    get reward() {
      const d = cellDirection(S5.left, S5.right);
      const c = windowCounts(S5.left, S5.right, { ran: true });
      const aSide = sideName(S5.left, S5.right, d.anode); const cSide = aSide === 'left' ? 'right' : 'left';
      return {
        log: 'Negative ions moved toward the beaker that was gaining positive ions.',
        title: 'Ions Close the Circuit',
        body: `The ${ion(d.anode)} count rose to ${c[aSide].metal} at the anode while ${ion(d.cathode)} fell to ${c[cSide].metal} at the cathode. Negative ions moved through the bridge toward the anode and positive ions toward the cathode, keeping each beaker balanced; electrons stay in the wire.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-weigh',
    title: 'Weighing the Strips',
    prompt: 'Weigh each strip before and after the run, and say which one gained mass.',
    widget,
    table: (() => {
      const g = galvFixture('rig', { x: 44, y: 46 }, { left: S6.left, right: S6.right, link: 'fixed', ammeter: false, strips: true, minutes: true });
      const bal = balanceFixture('bal', { x: 110, y: 46 });
      return cellTable({
        pieces: [
          stripPiece(S6.left, S6.left, { x: 30, y: 98 }, { m0: S6.m0[S6.left] }),
          stripPiece(S6.right, S6.right, { x: 90, y: 98 }, { m0: S6.m0[S6.right] })
        ],
        fixtures: [
          g.fixture, bal.fixture,
          selectorFixture('pick', 'Gained mass', { x: 154, y: 46 }, { options: [`The ${METALS[S6.left].symbol} strip`, `The ${METALS[S6.right].symbol} strip`, ' '], start: 3, w: 36, list: true })
        ],
        zones: { slots: [...g.slots, bal.slot] }
      }, { w: 176, h: 112 });
    })(),
    hints: [
      'Lay a strip on the pan to read it, drag each strip into the beaker above its ions, press "Run", then weigh them again and use the dial.',
      'Compare each strip\'s two readings on the list under the balance.',
      'Subtract each strip\'s first reading from its second; a positive change is a gain.'
    ],
    check(state) {
      const t = state.table;
      const v = dialValue(t, 'pick');
      if (v === 3) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const name = `${METALS[S6.left].symbol} strip`;
      const w = weighed(t, 'bal', name);
      if (!w) return { ok: false, msg: `The ${name} has not been weighed yet.` };
      if (w.count < 2) return { ok: false, msg: `The ${name} has been weighed once, at ${w.first.toFixed(2)} g; weigh it again after the run.` };
      return { ok: false, msg: `The ${name} read ${w.first.toFixed(2)} g and then ${w.last.toFixed(2)} g.` };
    },
    get reward() {
      const dl = stripChange(S6.left, S6.right, S6.left, WEIGH_RUN_SECONDS);
      const dr = stripChange(S6.left, S6.right, S6.right, WEIGH_RUN_SECONDS);
      return {
        log: 'The strip that gave ions lost mass and the strip that took them gained it.',
        title: 'Mass Follows the Atoms',
        body: `The ${METALS[S6.right].symbol} strip gained ${fmt(dr, 2)} g and the ${METALS[S6.left].symbol} strip lost ${fmt(-dl, 2)} g. Atoms leave the anode as ions and join the cathode as atoms, so the anode loses mass and the cathode gains it.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-notation',
    title: 'Shorthand (Beyond the Exam)',
    prompt: 'Write the zinc–copper cell in shorthand.',
    widget,
    table: (() => {
      const chips = notationChips('zn', 'cu');
      const order = [4, 0, 6, 2, 5, 1, 3];
      const at = [[24, 46], [50, 46], [76, 46], [102, 46], [37, 61], [63, 61], [89, 61]];
      return cellTable({
        pieces: order.map((k, i) => chip(`k${k}`, chips[k], { x: at[i][0], y: at[i][1] })),
        fixtures: [plaqueFixture('plate', 'The cell, left to right', { x: 70, y: 20 }, ['zinc strip in zinc ions, salt bridge, copper ions with copper strip', 'one bar | between a solid and its ions', 'two bars || for the bridge'], { w: 130 })],
        zones: { rail: { at: { x: 70, y: 86 }, size: { w: 132, h: 12 }, first: 'Left end', last: 'Right end', items: [], start: [] } }
      }, { w: 140, h: 100 });
    })(),
    hints: [
      'Drag the seven chips onto the strip and put them in order.',
      'Compare the plaque\'s list of the cell with the order you read it, left to right.',
      'Each solid is written next to its own ions, and the two halves are joined by the bridge.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      const want = notationChips('zn', 'cu');
      if (order.length < want.length) return { ok: false, notYet: true, msg: `Put all ${want.length} chips on the strip.` };
      const got = order.map(id => t.pieces[id].label);
      if (got.join('\u0000') === want.join('\u0000')) return { ok: true };
      const k = got.findIndex((g, i) => g !== want[i]);
      return { ok: false, msg: `The strip reads ${got.join(' ')}, and place ${k + 1} does not match the cell on the plaque.` };
    },
    get reward() {
      return {
        log: 'The cell was written in shorthand.',
        title: 'Cell Notation',
        body: `${notationText('zn', 'cu')} is cell notation: the anode half on the left, the cathode half on the right, one bar between a solid and its ions and two bars for the salt bridge. This notation is beyond the exam.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'The Sealed Cell',
    prompt: 'Find the anode of the sealed cell.',
    widget,
    table: (() => {
      const g = galvFixture('rig', { x: 44, y: 52 }, { left: S8.left, right: S8.right, link: 'fixed', ammeter: true, strips: true, sealed: true, minutes: true });
      const bal = balanceFixture('bal', { x: 110, y: 52 });
      return cellTable({
        pieces: [
          stripPiece('sa', S8.left, { x: 30, y: 108 }, { label: 'Strip A', sealed: true, m0: S8.m0 }),
          stripPiece('sb', S8.right, { x: 90, y: 108 }, { label: 'Strip B', sealed: true, m0: S8.m0 }),
          note('ansA', 'Strip A is the anode', { x: 158, y: 34 }),
          note('ansB', 'Strip B is the anode', { x: 158, y: 56 })
        ],
        fixtures: [g.fixture, bal.fixture],
        zones: { slots: [...g.slots, bal.slot, { id: 'ans', label: 'My answer', at: { x: 158, y: 82 }, size: { w: 46, h: 16 } }] }
      }, { w: 184, h: 122 });
    })(),
    hints: [
      'Drag each strip into the beaker with its letter, press "Run", weigh the strips, and lay a card in the slot.',
      'Compare which way the needle swings with how each strip\'s mass changed.',
      'The ammeter\'s dial says which beaker the electrons move toward, so they left through the other one.'
    ],
    check(state) {
      const t = state.table;
      const card = pieceIn(t, 'ans');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      const anode = cellDirection(S8.left, S8.right).anode === S8.left ? 'ansA' : 'ansB';
      if (card.id === anode) return { ok: true };
      const r = galvRead(t, 'rig');
      if (!r.ran) return { ok: false, msg: 'The cell has not been run yet.' };
      const wa = weighed(t, 'bal', 'Strip A'); const wb = weighed(t, 'bal', 'Strip B');
      const tail = (n, w) => (w && w.count > 1 ? ` Strip ${n} read ${w.first.toFixed(2)} g and then ${w.last.toFixed(2)} g.` : '');
      return { ok: false, msg: `The needle swung to the ${r.I > 0 ? 'right' : 'left'}.${tail('A', wa)}${tail('B', wb)}` };
    },
    get reward() {
      const d = cellDirection(S8.left, S8.right);
      const to = electronsToward(S8.left, S8.right);
      const anodeLetter = d.anode === S8.left ? 'A' : 'B';
      return {
        log: 'The electrons left through the anode.',
        title: 'Sealed Cell',
        body: `The electrons moved toward the ${to} beaker, so they left through the other one, and Strip ${anodeLetter} lost mass: it is the anode. Strip A was ${METALS[S8.left].name} and Strip B was ${METALS[S8.right].name}.`
      };
    }
  }
];

export const DEBRIEF = {
  title: 'Galvanic Cells',
  body: 'A galvanic cell needs a wire for the electrons and a salt bridge for the ions. Atoms leave the anode as ions, the electrons travel through the wire to the cathode, and the ions in the bridge keep each beaker balanced.'
};

const seat = (id, to) => put(id, to);
const S6_FLOW = [seat('fe', 'slot:bal.pan'), seat('fe', 'slot:rig.L'), seat('cu', 'slot:bal.pan'), seat('cu', 'slot:rig.R'), run('rig'), seat('fe', 'slot:bal.pan'), seat('cu', 'slot:bal.pan')];
const S8_FLOW = [seat('sa', 'slot:bal.pan'), seat('sb', 'slot:bal.pan'), seat('sa', 'slot:rig.L'), seat('sb', 'slot:rig.R'), run('rig'), seat('sa', 'slot:bal.pan'), seat('sb', 'slot:bal.pan')];
const NOTE = notationChips('zn', 'cu');
/** Ids of the chips in the order the notation reads: the chips at index 1 and 5 are both "|". */
const railIds = want => want.map((label, i) => `k${i}`).map((id, i) => id);

export const SOLUTIONS = [
  [put('steady', 'slot:guess')],
  [put('tube', 'slot:rig.link'), run('rig')],
  [...S3_CELLS.flatMap(([id, l, r]) => [run(id), dial(id, 'says', electronsToward(l, r) === 'left' ? 1 : 2)])],
  [run('rig'), put('leave', 'slot:rig.mL'), put('join', 'slot:rig.mR')],
  [run('rig'), dial('pick', 'value', 1)],
  [...S6_FLOW, dial('pick', 'value', 2)],
  railIds(NOTE).map((id, i) => put(id, `rail:${i}`)),
  [...S8_FLOW, put('ansB', 'slot:ans')]
];

export const MISSES = [
  [],
  [run('rig')],
  [run('ra'), run('rb'), run('rc'), dial('ra', 'says', 2), dial('rb', 'says', 2), dial('rc', 'says', 1)],
  [run('rig'), put('join', 'slot:rig.mL'), put('leave', 'slot:rig.mR')],
  [run('rig'), dial('pick', 'value', 2)],
  [...S6_FLOW, dial('pick', 'value', 1)],
  [6, 1, 4, 3, 2, 5, 0].map((k, i) => put(`k${k}`, `rail:${i}`)),
  [...S8_FLOW, put('ansA', 'slot:ans')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { S3_CELLS, S4, S5, S6, S8, GUESS, stripMass };
