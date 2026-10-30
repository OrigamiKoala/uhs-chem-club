/**
 * kits/matter-tester.js — the instruments and pieces of Mirrowen's q4 bench ("Kinds of Solid"), registered on the matter kit.
 *
 * THE TESTER: a slot for a sample of a solid, a "Test" dial with up to three positions (Melt, Strike, Current) and a key, and a panel
 * that shows what the test found:
 *   Melt     the sample is heated and the panel traces how rigid it stays against temperature (a step for a crystal, a slope for a glass);
 *   Strike   one hammer blow, and what is left (shards, a flat disc, powder);
 *   Current  two leads and a lamp, cold and then molten.
 * A stage may take the heater only (no dial), or swap the panel for a WINDOW that draws the particles of the sample in the slot (the
 * same arrangement `matterdata-tester.js` `arrangementOf` returns, atom by atom). The SOLID card keeps what each test showed, as a card
 * that has been in the probe keeps its reading, so the readings can be compared once the cards are in trays.
 *
 * A THIN WRAPPER over `engine/matterdata-tester.js`; it authors nothing. A reading is the planner's answer, shown as the picture.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { addTourText } from '../tour.js';
import { registerFixture, registerPiece } from './matter-registry.js';
import { frameOf, topOf, say, slab } from './matter-draw.js';
import { seatedIn, dialAt } from './heat-read.js';
import {
  SOLIDS, STRIKE_WORD, PIC, arrangementOf, meltReading, currentReading, meltTrace, meltText, fmtT
} from '../../engine/matterdata-tester.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const TEXT = PLATE_COLORS.text;

/** The cards: a sample of a solid. */
export const SOLID_RECT = Object.freeze({ hw: 11.5, hh: 9.5 });

/** The inks the window draws particles in. */
const INK = Object.freeze({
  Si: '#8d99a6', O: '#9a4a2e', H: '#d6cebd', I: '#6a5a7a', C: '#4b4741', metal: '#b87a4b', cation: '#b4ab97', anion: '#5b7a32'
});

export const TESTS = Object.freeze(['melt', 'strike', 'current']);
const TEST_WORD = Object.freeze({ melt: 'Melt', strike: 'Strike', current: 'Current' });

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

/** A sample of a solid. `solidId` is a `SOLIDS` id; `label` what is printed on it (its name, or a letter for a sealed sample). */
export const solidCard = (id, solidId, label, at, extra = {}) => ({ id, kind: 'solid', label, at, props: { solid: solidId }, ...extra });

const yn = v => (v === true ? 'yes' : v === false ? 'no' : '—');

/** The lines a card prints, from what its tests have shown: `[text, tone]`. */
export function cardRows(p) {
  const rows = [];
  const pr = p.props;
  if (pr.melt) rows.push([meltText(pr.melt), 'v']);
  if (pr.strike) rows.push([STRIKE_WORD[pr.strike], 'v']);
  if (pr.cur) {
    rows.push([`lamp cold: ${yn(pr.cur.cold)}`, 'v']);
    rows.push([`lamp molten: ${yn(pr.cur.molten)}`, 'v']);
  }
  return rows;
}

function paintSolid(ctx, p, state, o) {
  const box = slab(ctx, o, SOLID_RECT, '#1d1a16');
  const sc = o.sc;
  say(ctx, p.label, o.x, box.y0 + 3.3 * sc, Math.max(6.2, 2.1 * sc), { align: 'center', weight: 700, maxW: box.w - 2 * sc });
  const rows = cardRows(p);
  if (!rows.length) {
    // An untested sample is a small chunk.
    const cx = o.x; const cy = box.y0 + 11.6 * sc;
    ctx.fillStyle = '#3a3732'; ctx.strokeStyle = STEEL;
    ctx.beginPath();
    [[-4.6, 1.8], [-2.8, -2.4], [0.8, -3.2], [4.4, -1.2], [4.8, 2.2], [1.2, 3.4], [-2.6, 3.2]].forEach(([dx, dy], i) => (i ? ctx.lineTo(cx + dx * sc, cy + dy * sc) : ctx.moveTo(cx + dx * sc, cy + dy * sc)));
    ctx.closePath(); ctx.fill(); ctx.stroke();
    return;
  }
  const size = Math.max(5.8, 1.78 * sc);
  rows.forEach(([txt], i) => say(ctx, txt, o.x, box.y0 + (6.9 + i * 3.1) * sc, size, { align: 'center', color: AMBER, weight: 700, maxW: box.w - 1.6 * sc }));
}

const solidKey = p => `solid|${p.label}|${p.props.solid}|${JSON.stringify(p.props.melt ?? null)}|${p.props.strike ?? ''}|${JSON.stringify(p.props.cur ?? null)}`;

registerPiece('solid', {
  kind: { r: 7.5, rect: SOLID_RECT, nojoin: true },
  paint: paintSolid,
  faceKey: solidKey,
  printed: p => String(p.label)
});

/* ------------------------------------------------------------------
   THE TESTER
   ------------------------------------------------------------------ */

/**
 * The tester. `tests` is the list of tests this stage offers (one test has no dial, the key is named for it); `T0` and `maxT` the heater's
 * range in °C; `view` 'window' swaps the test panel for a picture of the particles and takes the dial and the key away. Returns the fixture
 * and the slot (stand it where it says).
 */
export function solidTestFixture(id, at, { tests = TESTS, T0 = 0, maxT = 2000, view = 'tests', title = 'Tester', w = 68 } = {}) {
  const window = view === 'window';
  const list = window ? [] : [...tests];
  const dials = list.length > 1 ? { test: { min: 1, max: list.length, step: 1, value: 1, label: 'Test', labels: list.map(t => TEST_WORD[t]) } } : {};
  const top = list.length > 1 ? 13.2 : 10;
  const h = Math.round((top + 31) * 10) / 10;
  const slotId = `${id}.slot`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const runLabel = list.length === 1 ? { melt: 'Heat', strike: 'Strike', current: 'Test' }[list[0]] : 'Test';
  return {
    fixture: {
      id, kind: 'solidtest', label: title, at: { ...at }, size: { w, h }, dials, ...(window ? { noRun: true } : { runLabel }),
      props: { backdrop: true, slot: slotId, tests: list, T0, maxT, view, top }
    },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 9.5 }, size: { w: 24, h: 17 } },
    slotId,
    size: { w, h }
  };
}

/** The test the dial points at (or the only one), and the sample in the slot. */
export function testerRead(state, fid) {
  const f = state.fixtures[fid];
  const item = seatedIn(state, f.props.slot);
  const list = f.props.tests;
  const test = list.length > 1 ? list[Math.max(0, Math.min(list.length - 1, dialAt(state, fid, 'test') - 1))] : list[0] || null;
  const s = item ? SOLIDS[item.props.solid] : null;
  return { f, item, test, solid: s, range: { T0: f.props.T0, maxT: f.props.maxT } };
}

/** What a press of the key writes on the card: the planner's answer for the test the dial points at. */
function runTester(state, fid) {
  const r = testerRead(state, fid);
  if (!r.item) return { noop: 'Put a sample in the tester first.' };
  if (!r.test) return null;
  const set = {};
  if (r.test === 'melt') set.melt = meltReading(r.solid, r.range);
  else if (r.test === 'strike') set.strike = r.solid.strike;
  else if (r.test === 'current') set.cur = currentReading(r.solid, r.range);
  return { stamp: { [r.item.id]: set } };
}

/* ---- the panel ---- */

const PANEL = { x: 29, w: 36, h: 21 };

function paintPlot(ctx, F, py, r) {
  const px = PANEL.x; const { T0, maxT } = r.range;
  const L = px + 3.2; const R = px + PANEL.w - 2.2; const Tp = py + 2.2; const B = py + PANEL.h - 6.4;
  const X = T => F.x(L + ((T - T0) / (maxT - T0)) * (R - L));
  const Y = s => F.y(B - s * (B - Tp));
  ctx.strokeStyle = DIM; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(F.x(L), F.y(Tp)); ctx.lineTo(F.x(L), F.y(B)); ctx.lineTo(F.x(R), F.y(B)); ctx.stroke();
  const ticks = [T0, Math.round((T0 + maxT) / 2), maxT];
  ticks.forEach((T, i) => {
    ctx.beginPath(); ctx.moveTo(X(T), F.y(B)); ctx.lineTo(X(T), F.y(B + 0.9)); ctx.stroke();
    say(ctx, fmtT(T), X(T), F.y(B + 2.9), F.size(2.2, 6), { align: i === 0 ? 'left' : i === 2 ? 'right' : 'center', color: DUST });
  });
  say(ctx, '°C', F.x(R), F.y(B - 1.6), F.size(2.2, 6), { align: 'right', color: DIM });
  say(ctx, 'rigid', F.x(L + 1), F.y(B - 2.1), F.size(2.2, 6), { color: DIM });
  say(ctx, 'runs', F.x(R - 0.5), F.y(Tp + 1.1), F.size(2.2, 6), { align: 'right', color: DIM });
  if (!r.item || r.item.props.melt == null) return;
  ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(1.6, F.len(0.45));
  ctx.beginPath();
  meltTrace(r.solid, r.range).forEach(([T, s], i) => (i ? ctx.lineTo(X(T), Y(s)) : ctx.moveTo(X(T), Y(s))));
  ctx.stroke(); ctx.lineWidth = 1;
}

/** One hammer blow on the sample, and what is left. */
function paintStrike(ctx, F, py, r) {
  const px = PANEL.x;
  const cx = F.x(px + PANEL.w / 2); const base = F.y(py + PANEL.h - 7.4);
  const u = F.len(1);
  ctx.strokeStyle = STEEL; ctx.beginPath(); ctx.moveTo(F.x(px + 3), base); ctx.lineTo(F.x(px + PANEL.w - 3), base); ctx.stroke();
  const done = r.item && r.item.props.strike;
  // The hammer: a head and a handle, raised before the blow and down after it.
  const hx = cx + 7 * u; const hy = base - (done ? 4.2 : 9.5) * u;
  ctx.fillStyle = '#5b544b'; ctx.fillRect(hx - 2.6 * u, hy - 1.6 * u, 5.2 * u, 3.2 * u);
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.3, u * 0.5);
  ctx.beginPath(); ctx.moveTo(hx + 2.6 * u, hy); ctx.lineTo(hx + 9 * u, hy - 5 * u); ctx.stroke(); ctx.lineWidth = 1;
  if (!r.item) return;
  ctx.fillStyle = '#3a3732'; ctx.strokeStyle = DUST;
  if (!done) {
    ctx.fillRect(cx - 4 * u, base - 4.4 * u, 8 * u, 4.4 * u); ctx.strokeRect(cx - 4 * u + 0.5, base - 4.4 * u + 0.5, 8 * u, 4.4 * u);
  } else if (done === 'shatters') {
    const shards = [[-7.2, -1.2, -5.2, -3.6, -3.8, 0], [-3.4, 0, -2.2, -4.2, -0.6, 0], [0.6, 0, 1.8, -4.4, 3.6, 0], [4.2, 0, 5.4, -2.4, 7.2, -0.4], [-1.2, 0, -0.2, -1.8, 0.8, 0]];
    shards.forEach(([x1, y1, x2, y2, x3, y3]) => {
      ctx.beginPath(); ctx.moveTo(cx + x1 * u, base + y1 * u); ctx.lineTo(cx + x2 * u, base + y2 * u); ctx.lineTo(cx + x3 * u, base + y3 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  } else if (done === 'flattens') {
    ctx.beginPath(); ctx.ellipse(cx, base - 0.9 * u, 8.4 * u, 0.9 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = '#b8afa0';
    for (let i = 0; i < 22; i++) {
      const a = (i * 2.399) % (Math.PI * 2); const rad = 1 + (i % 7) * 0.9;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rad * 1.5 * u * 0.6 + (i % 3 - 1) * 1.4 * u, base - 0.5 * u - Math.abs(Math.sin(a)) * rad * 0.5 * u, Math.max(1, u * 0.34), 0, Math.PI * 2); ctx.fill();
    }
  }
  if (done) say(ctx, STRIKE_WORD[done], F.x(px + PANEL.w / 2), F.y(py + PANEL.h - 2.6), F.size(3, 7), { align: 'center', color: AMBER, weight: 700 });
}

/** Two leads and a lamp, cold and molten. */
function paintCurrent(ctx, F, py, r) {
  const px = PANEL.x;
  const cur = r.item && r.item.props.cur;
  [['Cold', cur?.cold, px + 10], ['Molten', cur?.molten, px + 26]].forEach(([name, on, x]) => {
    const cx = F.x(x); const cy = F.y(py + 8); const rad = F.len(4);
    ctx.fillStyle = on === true ? AMBER : '#1d1a16'; ctx.strokeStyle = on === true ? AMBER : DUST;
    ctx.lineWidth = Math.max(1.4, F.len(0.5));
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
    if (on === null) say(ctx, '—', cx, cy, F.size(3.4, 8), { align: 'center', color: DIM });
    ctx.strokeStyle = on === true ? '#1d1a16' : DIM;
    ctx.beginPath(); ctx.moveTo(cx - rad * 0.6, cy + rad * 0.6); ctx.lineTo(cx + rad * 0.6, cy - rad * 0.6); ctx.moveTo(cx - rad * 0.6, cy - rad * 0.6); ctx.lineTo(cx + rad * 0.6, cy + rad * 0.6); ctx.stroke();
    say(ctx, name, cx, F.y(py + PANEL.h - 3.6), F.size(2.9, 6.6), { align: 'center', color: cur ? DUST : DIM, weight: 600 });
  });
}

/** The window: the particles of the sample in the slot, from `arrangementOf`. */
function paintWindow(ctx, F, py, r) {
  if (!r.item) return;
  const a = arrangementOf(SOLIDS[r.item.props.solid].picture);
  const ox = PANEL.x + 2; const oy = py + 1.5;
  const k = Math.min((PANEL.w - 4) / PIC.w, (PANEL.h - 3) / PIC.h);
  const X = x => F.x(ox + x * k); const Y = y => F.y(oy + y * k);
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1, F.len(0.32));
  for (const [i, j] of a.bonds) { ctx.beginPath(); ctx.moveTo(X(a.atoms[i].x), Y(a.atoms[i].y)); ctx.lineTo(X(a.atoms[j].x), Y(a.atoms[j].y)); ctx.stroke(); }
  ctx.lineWidth = 1;
  for (const at of a.atoms) {
    ctx.fillStyle = INK[at.k] || DUST;
    ctx.beginPath(); ctx.arc(X(at.x), Y(at.y), Math.max(1.2, F.len(at.r * k)), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d1a16'; ctx.stroke();
  }
  ctx.fillStyle = AMBER;
  for (const d of a.dots) { ctx.beginPath(); ctx.arc(X(d.x), Y(d.y), Math.max(1, F.len(0.38 * k)), 0, Math.PI * 2); ctx.fill(); }
}

function paintTester(ctx, f, state, b) {
  const F = frameOf(b);
  const top = topOf(f, b.lay);
  const r = testerRead(state, f.id);
  const py = top + 1;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(PANEL.x), F.y(py), F.len(PANEL.w), F.len(PANEL.h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(PANEL.x)) + 0.5, Math.round(F.y(py)) + 0.5, Math.round(F.len(PANEL.w)), Math.round(F.len(PANEL.h)));
  if (f.props.view === 'window') paintWindow(ctx, F, py, r);
  else if (r.test === 'melt') paintPlot(ctx, F, py, r);
  else if (r.test === 'strike') paintStrike(ctx, F, py, r);
  else if (r.test === 'current') paintCurrent(ctx, F, py, r);
  // What the dial's test does, and nothing the reading says.
  const note = f.props.view === 'window' ? 'PARTICLES IN THE SAMPLE'
    : r.test === 'melt' ? `HEATED ${fmtT(f.props.T0)} TO ${fmtT(f.props.maxT)} °C`
      : r.test === 'strike' ? 'ONE HAMMER BLOW'
        : r.test === 'current' ? 'LAMP ON TWO LEADS' : '';
  say(ctx, note, F.x(3), F.y(f.size.h - 3.6), F.size(2.6, 6), { color: DIM, maxW: f.props.view === 'window' ? F.len(f.size.w - 6) : F.len(f.size.w - 20) });
  void TEXT;
}

registerFixture('solidtest', { paint: paintTester, run: runTester });

/* ------------------------------------------------------------------
   TOUR WORDS
   ------------------------------------------------------------------ */

const TESTER_TEXT = (f) => {
  if (f.props.view === 'window') {
    return 'The tester has a slot on the left and a window on the right. Drag a sample into the slot and the window draws the particles it is made of. Each disc is one particle, a line joins two that are bonded, and a small amber dot is an electron that is free to move.';
  }
  const list = f.props.tests || [];
  const parts = [];
  if (list.includes('melt')) parts.push('Heat warms the sample and the panel traces how rigid it stays as the temperature rises: a line that falls shows the sample going runny.');
  if (list.includes('strike')) parts.push('Strike drops a hammer once, and the panel shows what is left.');
  if (list.includes('current')) parts.push('Current clips two leads to the sample and lights a lamp if current passes, first cold and then molten.');
  const how = list.length > 1 ? 'Drag a sample into the slot on the left, turn the "Test" dial to a test, and press "Test". ' : `Drag a sample into the slot on the left and press "${{ melt: 'Heat', strike: 'Strike', current: 'Test' }[list[0]]}". `;
  return `${how}${list.length > 1 ? parts.join(' ').replace('Heat warms', 'Melt warms') : parts.join(' ')} The sample card keeps what each test showed.`;
};

addTourText({
  'matter:solidtest': { title: 'Tester', dials: false, text: TESTER_TEXT }
}, {
  solid: ['Solid samples', 'Each card is a sample of one solid. Drag it into the tester to test it, then into a tray. A card that has been tested keeps what each test showed, so you can compare samples once they are out again.']
});
