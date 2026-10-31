/**
 * kits/pot-change.js — the instruments and pieces of Kettle's q3-change (Physical or Chemical): the change pot, its balance, its lamps
 * and the sample jar, registered on the pot kit (`pot-registry.js`).
 *
 * THE CHANGE POT (fixture `changepot`): a seat for a sample jar (or one change fixed on the pot), a Lid dial (Open or Sealed) where a
 * stage uses it, an amount dial where a stage uses it, a key, and a window of particles: one disc for each `unit` moles, what stands in
 * the pot before the key on the left and what stands in it after on the right. A gas an open pot loses is drawn leaving, in grey.
 * THE BALANCE (fixture `potscale`): weighs everything in the pot (the pot's own weight is left out) before the key and after it.
 * THE LAMPS (fixture `evidence`): gas given off, new colour, solid forms, temperature change. They light after a run, only from what
 * the planner says the pot did, and a lamp never says what kind of change it was.
 * THE SAMPLE JAR (piece `cjar`): holds one change to try; a jar may keep what it holds off its face (Sample A).
 *
 * A THIN WRAPPER over `engine/reactdata-change.js`; it authors nothing.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { addTourText } from '../tour.js';
import { registerFixture, registerPiece } from './pot-registry.js';
import { frameOf, say, slab } from './pot-draw.js';
import { seatedIn, dialAt } from './pot-read.js';
import { contentTop } from './heat-draw.js';
import { planChange, CASES } from '../../engine/reactdata-change.js';
import { pretty } from '../../engine/reactdata.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;

export { planChange, CASES };

/* ------------------------------------------------------------------
   READING
   ------------------------------------------------------------------ */

/**
 * What a change pot reads: which change stands in it, the lid, the amount, the planner's answer, and whether the key has been
 * pressed for exactly this set-up (a different jar, lid or amount is a new set-up).
 */
export function changeRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const jar = p.seat ? seatedIn(state, p.seat) : null;
  const caseId = p.caseId || jar?.props?.case || null;
  const sealed = p.lidDial ? dialAt(state, fid, 'lid') === 2 : p.lid === 'sealed';
  const scale = p.amounts ? p.amounts.scales[dialAt(state, fid, 'amount') - 1] : 1;
  const plan = caseId ? planChange(caseId, { sealed, scale }) : null;
  const sig = `${fid}|${caseId}|${sealed ? 1 : 0}|${scale}`;
  const ran = Boolean(plan) && state.recorder.rows.some(r => r.label === sig);
  return { f, jar, caseId, sealed, scale, plan, sig, ran, unit: p.unit ?? plan?.unit ?? 0.25 };
}

/** What the balance beside a pot reads: the pot's whole contents before the key and after it. */
export function scaleRead(state, fid) {
  const f = state.fixtures[fid];
  const r = changeRead(state, f.props.of);
  return { f, pot: r, has: Boolean(r.plan), before: r.plan?.massBefore ?? null, after: r.ran ? r.plan.massAfter : null };
}

/** What the lamps beside a pot show: nothing before the key, and after it the four lamps the planner lights. */
export function lampsRead(state, fid) {
  const f = state.fixtures[fid];
  const r = changeRead(state, f.props.of);
  return { f, pot: r, ran: r.ran, lamps: r.ran ? r.plan.lamps : null };
}

/* ------------------------------------------------------------------
   WHAT THE WINDOW DRAWS
   ------------------------------------------------------------------ */

const INK = {
  H2O: '#6f8fb0', O2: '#a0522d', CO2: '#7a746a', Fe: '#9aa0a6', Fe2O3: '#8a4a32', C12H22O11: '#d8d2c4', C: '#3a3631', Mg: '#b8bcc0',
  MgO: '#e0d8c8', C6H10O5: '#b89868', NaCl: '#d8d2c4', 'Na+': '#b0b6bc', 'Cl-': '#78a142'
};
const inkOf = f => INK[f] || '#b8afa0';

const CHARGE = { '+': '⁺', '-': '⁻' };
/** A formula as the window prints it: true subscripts, and an ion's charge. */
const label = f => (f.endsWith('+') || f.endsWith('-') ? `${pretty(f.slice(0, -1))}${CHARGE[f.slice(-1)]}` : pretty(f));

const SAMPLE_INK = { ice: '#e8e4dc', sugarwater: '#d8d2c4', saltwater: '#d8d2c4', dryice: '#eeeae0', sugarheat: '#d8d2c4', wool: '#9aa0a6', magnesium: '#b8bcc0', wood: '#b89868' };

/* ------------------------------------------------------------------
   THE SAMPLE JAR
   ------------------------------------------------------------------ */

export const CJAR_RECT = Object.freeze({ hw: 8.5, hh: 6.6 });

/** A sample jar holding change `caseId`. `shown` is the amount line printed on it (omit for none). */
export const cjar = (id, name, at, caseId, { shown = null } = {}, extra = {}) => ({
  id, kind: 'cjar', label: name, at, props: { case: caseId, ...(shown ? { shown } : {}) }, ...extra
});

function paintCjar(ctx, p, state, o) {
  const box = slab(ctx, o, CJAR_RECT, '#1d1a16');
  const sc = o.sc;
  const bx = o.x - 3.4 * sc; const by = box.y0 + 1.6 * sc; const bw = 6.8 * sc; const bh = 4.4 * sc;
  ctx.strokeStyle = DUST; ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(bx) + 0.5, Math.round(by) + 0.5, Math.round(bw), Math.round(bh));
  ctx.fillStyle = SAMPLE_INK[p.props.case] || '#b8afa0'; ctx.globalAlpha = 0.65;
  ctx.fillRect(bx + 1, by + bh * 0.35, bw - 2, bh * 0.65 - 1); ctx.globalAlpha = 1;
  ctx.fillStyle = STEEL; ctx.fillRect(bx - 0.4 * sc, by - 0.9 * sc, bw + 0.8 * sc, 0.9 * sc);
  const size = Math.max(6.2, 1.95 * sc);
  let y = box.y0 + box.h - 5.1 * sc;
  say(ctx, p.label, o.x, y, size, { align: 'center', weight: 700, maxW: box.w - 1.4 * sc });
  y += 2.5 * sc;
  if (p.props.shown) say(ctx, p.props.shown, o.x, y, Math.max(5.8, 1.8 * sc), { align: 'center', color: AMBER, weight: 700, maxW: box.w - 1.4 * sc });
}

registerPiece('cjar', {
  kind: { r: 7, rect: CJAR_RECT, nojoin: true },
  paint: paintCjar,
  faceKey: p => `cjar|${p.label}|${p.props.shown ?? ''}`,
  printed: p => String(p.label)
});

/* ------------------------------------------------------------------
   THE CHANGE POT
   ------------------------------------------------------------------ */

const SEAT = { w: 18, h: 13 };
const WINDOW_H = 26;

/**
 * The change pot. `caseId` fixes the change on the pot (no seat); otherwise `seat` gives a seat for a sample jar. `lid` is `'open'` or
 * `'sealed'` for a fixed lid, or `'dial'` for a Lid dial. `amounts` is `{ label, list: [grams...], scales: [...] }` for an amount dial.
 * `unit` is the moles one disc stands for (the change's own when omitted). Returns the fixture, its seat slot and its size.
 */
export function changePotFixture(id, at, o = {}) {
  const { caseId = null, seat = !caseId, lid = 'open', amounts = null, unit = null, title = 'Pot', runLabel = 'Run', w = 76 } = o;
  const dials = {};
  const lidDial = lid === 'dial';
  if (lidDial) dials.lid = { min: 1, max: 2, step: 1, value: 1, label: 'Lid', labels: ['Open', 'Sealed'] };
  if (amounts) dials.amount = { min: 1, max: amounts.list.length, step: 1, value: 1, label: amounts.label, labels: amounts.list.map(g => `${g} g`) };
  const nd = Object.keys(dials).length;
  const top = contentTop(nd);
  const seatH = seat ? 16.4 : 2.4;
  const h = Math.round((top + seatH + WINDOW_H + 7) * 10) / 10;
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  const slots = [];
  let seatId = null;
  if (seat) {
    seatId = `${id}.in`;
    slots.push({ id: seatId, label: ' ', at: { x: x0 + 11, y: y0 + top + 7.5 }, size: { ...SEAT } });
  }
  return {
    fixture: {
      id, kind: 'changepot', label: title, at: { ...at }, size: { w, h }, dials, runLabel,
      props: { backdrop: true, seat: seatId, caseId, lid, lidDial, amounts: amounts ? { ...amounts } : null, unit, panelTop: Math.round((top + seatH) * 10) / 10 }
    },
    slots, seatSlot: seatId, size: { w, h }
  };
}

const DISC_MAX = 12;
const STATE_WORD = { s: '(s)', l: '(l)', g: '(g)', aq: '(aq)' };

/** One row of the window: the species and its state, then as many discs as it has `unit` moles. `dim` draws it as something that left. */
function row(ctx, F, item, unit, x0, x1, y, size, dim = false, prefix = '') {
  const text = `${prefix}${label(item.f)}${STATE_WORD[item.st] || ''}`;
  say(ctx, text, F.x(x0), F.y(y), size, { color: dim ? DIM : DUST, weight: 700, maxW: F.len(15.2) });
  const n = Math.max(1, Math.round(item.mol / unit));
  const r = F.len(0.62);
  const step = F.len(Math.min(1.7, (x1 - x0 - 16.4) / DISC_MAX));
  ctx.fillStyle = dim ? '#4a463f' : inkOf(item.f);
  for (let i = 0; i < Math.min(n, DISC_MAX); i++) {
    ctx.beginPath(); ctx.arc(F.x(x0 + 16.2) + i * step + r, F.y(y), r, 0, Math.PI * 2); ctx.fill();
  }
  if (n > DISC_MAX) say(ctx, `+${n - DISC_MAX}`, F.x(x1), F.y(y), size, { align: 'right', color: DIM });
}

function paintChangePot(ctx, f, state, b) {
  const F = frameOf(b);
  const r = changeRead(state, f.id);
  const p = f.props;
  const px = 2.5; const pw = f.size.w - 5; const py = p.panelTop; const ph = f.size.h - py - 7;
  // A change fixed on the pot is named on it.
  if (p.caseId) say(ctx, CASES[p.caseId].name, F.x(px + 1), F.y(py - 1.2), F.size(2.3, 6.5), { color: DUST, weight: 700 });
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(px), F.y(py), F.len(pw), F.len(ph));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(px)) + 0.5, Math.round(F.y(py)) + 0.5, Math.round(F.len(pw)), Math.round(F.len(ph)));
  const size = F.size(2.2, 6.2);
  const midx = px + pw / 2;
  ctx.strokeStyle = STEEL; ctx.beginPath(); ctx.moveTo(F.x(midx), F.y(py + 1)); ctx.lineTo(F.x(midx), F.y(py + ph - 1)); ctx.stroke();
  say(ctx, 'BEFORE', F.x(px + 1.5), F.y(py + 2.1), F.size(2.1, 6), { color: DIM });
  say(ctx, 'AFTER', F.x(midx + 1.5), F.y(py + 2.1), F.size(2.1, 6), { color: DIM });
  const plan = r.plan;
  if (!plan) {
    say(ctx, 'nothing in the pot', F.x(px + pw / 2), F.y(py + ph / 2), F.size(2.1, 6), { align: 'center', color: DIM });
    return;
  }
  const rowY = i => py + 6.6 + i * 4.9;
  const left = [...plan.before];
  if (r.ran) left.push(...plan.air);
  left.forEach((it, i) => row(ctx, F, it, r.unit, px + 1.5, midx - 1.5, rowY(i), size, it.from === 'air', it.from === 'air' ? '+' : ''));
  if (r.ran) {
    const right = [...plan.after, ...plan.escaped];
    right.forEach((it, i) => row(ctx, F, it, r.unit, midx + 1.5, px + pw - 1.5, rowY(i), size, it.from === 'escaped', it.from === 'escaped' ? 'out ' : ''));
  } else {
    say(ctx, 'press Run', F.x(midx + pw / 4), F.y(py + ph / 2), F.size(2.1, 6), { align: 'center', color: DIM });
  }
  // The foot: what the pot is open to or shut from, what it stands in, and what a disc is.
  const foot = py + ph - 1.8;
  const bits = [];
  if (plan.sealed) bits.push('SEALED'); else if (CASES[r.caseId]?.air?.length) bits.push('OPEN TO AIR');
  if (plan.solvent) bits.push('IN WATER');
  if (bits.length) say(ctx, bits.join(' · '), F.x(px + 1.5), F.y(foot), F.size(1.9, 5.8), { color: DIM });
  say(ctx, `1 disc = ${r.unit} mol`, F.x(px + pw - 1.5), F.y(foot), F.size(1.8, 5.6), { align: 'right', color: DIM });
}

function runChangePot(state, fid) {
  const r = changeRead(state, fid);
  if (!r.plan) return { noop: 'Put a sample jar in the pot first.' };
  return { x: r.plan.massBefore, y: r.plan.massAfter, label: r.sig };
}

registerFixture('changepot', { paint: paintChangePot, run: runChangePot });

/* ------------------------------------------------------------------
   THE BALANCE
   ------------------------------------------------------------------ */

/** A balance that weighs the whole of the pot `of`: its contents before the key and after it. */
export function potScaleFixture(id, of, at, { title = 'Balance', w = 34 } = {}) {
  return { id, kind: 'potscale', label: title, at: { ...at }, size: { w, h: 21 }, dials: {}, noRun: true, props: { of } };
}

function paintPotScale(ctx, f, state, b) {
  const F = frameOf(b);
  const r = scaleRead(state, f.id);
  const w = f.size.w;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(2.5), F.y(5.2), F.len(w - 5), F.len(10.2));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(2.5)) + 0.5, Math.round(F.y(5.2)) + 0.5, Math.round(F.len(w - 5)), Math.round(F.len(10.2)));
  const line = (name, v, y) => {
    say(ctx, name, F.x(4), F.y(y), F.size(2, 6), { color: DIM });
    say(ctx, v == null ? '— g' : `${v.toFixed(1)} g`, F.x(w - 4), F.y(y), F.size(3, 7.5), { align: 'right', color: v == null ? DIM : AMBER, weight: 700 });
  };
  line('BEFORE', r.before, 8.2);
  line('AFTER', r.after, 13);
  say(ctx, 'pot weight left out', F.x(w / 2), F.y(f.size.h - 2.2), F.size(1.8, 5.6), { align: 'center', color: DIM });
}

registerFixture('potscale', { paint: paintPotScale });

/* ------------------------------------------------------------------
   THE LAMPS
   ------------------------------------------------------------------ */

export const LAMPS = Object.freeze([['gas', 'Gas given off'], ['colour', 'New colour'], ['solid', 'Solid forms'], ['temp', 'Temperature change']]);

/** Four lamps that light from what the pot `of` did. */
export function evidenceFixture(id, of, at, { title = 'Lamps', w = 40, grid = false } = {}) {
  const size = grid ? { w: 66, h: 21 } : { w, h: 33 };
  return { id, kind: 'evidence', label: title, at: { ...at }, size, dials: {}, noRun: true, props: { of, grid } };
}

function paintEvidence(ctx, f, state, b) {
  const F = frameOf(b);
  const r = lampsRead(state, f.id);
  LAMPS.forEach(([key, name], i) => {
    const grid = f.props.grid;
    const y = grid ? 9 + Math.floor(i / 2) * 5.2 : 10 + i * 5.6;
    const x = grid ? 5.5 + (i % 2) * 32 : 5.5;
    const lit = Boolean(r.lamps && r.lamps[key]);
    const cx = F.x(x); const cy = F.y(y); const rad = F.len(1.6);
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    if (lit) { ctx.fillStyle = AMBER; ctx.fill(); }
    ctx.strokeStyle = lit ? AMBER : STEEL; ctx.lineWidth = 1; ctx.stroke();
    say(ctx, name, F.x(x + 4), cy, F.size(2.2, 6.2), { color: lit ? PLATE_COLORS.text : DIM, weight: lit ? 700 : 500, maxW: F.len(grid ? 26 : f.size.w - 11) });
  });
  say(ctx, r.ran ? 'lit: the pot did this' : 'run the pot', F.x(f.size.w / 2), F.y(f.size.h - 2.2), F.size(1.8, 5.6), { align: 'center', color: DIM });
}

registerFixture('evidence', { paint: paintEvidence });

/* ------------------------------------------------------------------
   TOUR WORDS
   ------------------------------------------------------------------ */

const POT_TEXT = f => {
  const p = f.props;
  const bits = [];
  if (p.seat) bits.push('Drag a sample jar into the seat at the top left. What is in the jar is what the pot is asked to change.');
  else if (p.caseId) bits.push(`The pot holds ${CASES[p.caseId].name.toLowerCase()}.`);
  if (p.lidDial) bits.push('The "Lid" dial either leaves the pot open to the air or seals it shut.');
  else if (p.lid === 'sealed') bits.push('This pot is sealed shut.');
  if (p.amounts) bits.push(`The "${p.amounts.label}" dial sets how much goes in the pot.`);
  bits.push(`Press "${f.runLabel || 'Run'}" to make the change happen.`);
  bits.push('The window shows what is in the pot before on the left and after on the right, one disc for each amount it says. A grey row marked "out" is something that left the pot.');
  return bits.join(' ');
};

addTourText({
  'pot:changepot': { title: 'Pot', dials: false, text: POT_TEXT },
  'pot:potscale': { title: 'Balance', text: 'The balance weighs everything in the pot and leaves out the weight of the pot itself. The first line is the weight before you press the pot\'s key and the second is the weight after it.' },
  'pot:evidence': { title: 'Lamps', text: 'There are four lamps, one for each thing you might notice in a pot. After you press the pot\'s key, a lamp lights if the pot did what it names, and stays dark if it did not.' }
}, {
  cjar: ['Sample jars', 'Each jar holds something to try. Drag a jar into the seat on the pot, or tap it and then tap the seat. A jar named with a letter keeps what it holds off its face.']
});
