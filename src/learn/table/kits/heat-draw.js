/**
 * kits/heat-draw.js — What the heat kit's pieces and fixtures look like.
 *
 * The drawn tabletop (`engine/table2d.js` `drawTable`) and the built one (`engine/table3d.js`) call THESE functions with the same
 * arguments, so a block, an equation card and a cup are one picture in both views. Every figure printed is read from `heat-read.js`,
 * which asks `thermodata.js`; a painter decides nothing.
 *
 * THE PICTURE IS HONEST: a bath's thermometer column stands at the bath's temperature, a shelf stands as high as its energy, a well is
 * as deep as its bond, a cell holds the particle the table holds. SCOURED PLATE: phosphor and dust on a recessed plate, hairline rims,
 * nothing blooms, the warm and the cold are inks on a hairline.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import {
  blockRead, cupRead, shelvesRead, wellRead, ledgerRead, stackRead, cardTerms, fmtEqn, fmtSide, signedKJ, fixed, markerRead, plotRead, warmRead,
  cellsOpen, loggedArrangements, waysOf, shakesOf, occupiedCells, sig, WELL, LID_LOSS, whereIs, seededRng
} from './heat-read.js';
import { bondAtoms, inkOfElement, phaseDots } from './heat-parts.js';

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const WARM = '#c0652b';
const COLD = '#6f8fb0';

function say(ctx, text, x, y, size, o = {}) {
  ctx.font = `${o.weight || 500} ${Math.max(6, size)}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  if (o.maxW) ctx.fillText(text, x, y, o.maxW); else ctx.fillText(text, x, y);
}

/** The cards and slabs the kit's pieces are drawn as (half widths and heights, in table units). */
export const RECTS = Object.freeze({
  block: { hw: 10, hh: 7 },
  charge: { hw: 9.5, hh: 6 },
  eqn: { hw: 24, hh: 5.6 },
  bond: { hw: 13, hh: 5.6 },
  shelf: { hw: 12.5, hh: 9.5 },
  phase: { hw: 12.5, hh: 9.5 },
  stmt: { hw: 17, hh: 5 },
  shift: { hw: 17, hh: 10 },
  num: { hw: 8, hh: 4.6 },
  chip: { hw: 9, hh: 4.2 },
  tag: { hw: 13, hh: 5.6 },
  note: { hw: 22, hh: 8 },
  gcard: { hw: 15, hh: 10.5 }
});

/** Words broken into at most two lines of `cap` characters. */
export const STMT_CAP = 24;
export function wrap(text, cap = STMT_CAP) {
  const words = String(text).split(/\s+/);
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (!cur || (cur + ' ' + w).length <= cap) lines[lines.length - 1] = cur ? `${cur} ${w}` : w;
    else lines.push(w);
  }
  return lines.length <= 2 ? lines : [lines.slice(0, lines.length - 1).join(' ').slice(0, cap), lines[lines.length - 1]];
}

/** Words broken into at most `maxLines` lines of `cap` characters (the last line takes whatever is left). */
export function wrapN(text, cap = 30, maxLines = 3) {
  const words = String(text).split(/\s+/);
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (!cur || (cur + ' ' + w).length <= cap) lines[lines.length - 1] = cur ? `${cur} ${w}` : w;
    else lines.push(w);
  }
  return lines.length <= maxLines ? lines : [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(' ')];
}

/** The ink a temperature is printed in: warm over 45 °C, cold under 15 °C, the plate's amber between. */
const inkOf = T => (T > 45 ? WARM : T < 15 ? COLD : AMBER);

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

function slab(ctx, o, { hw, hh }, tone = '#2a2620') {
  const x0 = o.x - hw * o.sc;
  const y0 = o.y - hh * o.sc;
  const w = hw * 2 * o.sc;
  const h = hh * 2 * o.sc;
  ctx.fillStyle = tone;
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : DUST;
  ctx.lineWidth = o.lit ? 2 : 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.lineWidth = 1;
  return { x0, y0, w, h };
}

/** The temperature a block shows: its own while alone, the shared one while joined. */
export function blockFace(p, state) {
  const r = blockRead(state, p.id);
  return { T: r.T, joined: r.joined, label: p.label, mass: p.props.mass ?? `${sig(p.props.m, 4)} g ${p.props.mat || ''}`.trim() };
}

function paintBlock(ctx, p, state, o) {
  const f = blockFace(p, state);
  const hot = f.T > 45;
  const cold = f.T < 15;
  const box = slab(ctx, o, RECTS.block, hot ? '#321f15' : cold ? '#1b232b' : '#2a2620');
  const sc = o.sc;
  say(ctx, f.label, o.x, box.y0 + 2.2 * sc, Math.max(6.2, 2.0 * sc), { align: 'center', weight: 700, maxW: box.w - 2 * sc });
  say(ctx, f.mass, o.x, box.y0 + 5.0 * sc, Math.max(6, 1.7 * sc), { align: 'center', color: DUST, maxW: box.w - 2 * sc });
  // The thermometer: a short column that stands as high as the reading.
  const ink = inkOf(f.T);
  say(ctx, `${fixed(f.T, 1)} °C`, o.x, box.y0 + 9.6 * sc, Math.max(7, 2.9 * sc), { align: 'center', weight: 700, color: ink, maxW: box.w - 2 * sc });
  if (f.joined) {
    ctx.strokeStyle = AMBER;
    ctx.beginPath(); ctx.moveTo(box.x0 + 2, box.y0 + box.h - 2.5); ctx.lineTo(box.x0 + box.w - 2, box.y0 + box.h - 2.5); ctx.stroke();
  }
}

function paintCharge(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.charge, '#1d1a16');
  const sc = o.sc;
  const tried = p.props.rise != null;
  say(ctx, p.label, o.x, box.y0 + (tried ? 2.5 : 3.0) * sc, Math.max(6.2, 2.0 * sc), { align: 'center', weight: 700, maxW: box.w - 2 * sc });
  say(ctx, p.props.shown ?? `${sig(p.props.moles, 3)} mol`, o.x, box.y0 + (tried ? 6.1 : 8.4) * sc, Math.max(6, 1.8 * sc), { align: 'center', color: DUST, maxW: box.w - 2 * sc });
  // A tin that has been in the cup keeps what the bath did, so the readings can be compared once the tins are out again.
  if (tried) say(ctx, `bath ${fixed(p.props.rise, 1, true)} °C`, o.x, box.y0 + 9.6 * sc, Math.max(6, 1.9 * sc), { align: 'center', weight: 700, color: p.props.rise > 0.05 ? WARM : p.props.rise < -0.05 ? COLD : DUST, maxW: box.w - 2 * sc });
}

function paintEqn(ctx, p, state, o) {
  const t = cardTerms(p);
  const marked = t.flipped || t.scale > 1;
  const box = slab(ctx, o, RECTS.eqn, marked ? '#2c2412' : '#2a2620');
  const sc = o.sc;
  const size = Math.max(6, 2.0 * sc);
  say(ctx, fmtEqn(t), o.x, box.y0 + 2.9 * sc, size, { align: 'center', weight: 600, maxW: box.w - 2.4 * sc });
  const shown = p.props.hideDH ? '' : `${p.props.symbol || 'ΔH'} ${signedKJ(t.dH)} kJ`;
  say(ctx, shown, o.x, box.y0 + 7.9 * sc, Math.max(6, 2.1 * sc), { align: 'center', weight: 700, color: AMBER, maxW: box.w - 3 * sc });
  if (t.flipped) say(ctx, 'FLIPPED', box.x0 + 1.2 * sc, box.y0 + 7.9 * sc, Math.max(5.2, 1.4 * sc), { color: DUST });
  if (t.scale > 1) say(ctx, `× ${t.scale}`, box.x0 + box.w - 1.2 * sc, box.y0 + 7.9 * sc, Math.max(6, 1.8 * sc), { align: 'right', weight: 700, color: AMBER });
}

/** The picture of a bond: two atoms with the rod (or rods) between them, flat. The built table stands the same two atoms up as solids. */
export function paintBondIcon(ctx, which, cx, cy, size) {
  const { a, b, order } = bondAtoms(which);
  const r = size * 0.2;
  const gap = size * 0.62;
  for (let k = 0; k < order; k++) {
    const off = (k - (order - 1) / 2) * r * 0.55;
    ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1, r * 0.3);
    ctx.beginPath(); ctx.moveTo(cx - gap / 2, cy + off); ctx.lineTo(cx + gap / 2, cy + off); ctx.stroke();
  }
  ctx.lineWidth = 1;
  for (const [x, el] of [[cx - gap / 2, a], [cx + gap / 2, b]]) {
    ctx.fillStyle = inkOfElement(el); ctx.strokeStyle = '#2e2a26';
    ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}

function paintBond(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.bond, '#1d1a16');
  const sc = o.sc;
  // The left third holds the two atoms: drawn here on the drawn table, stood up as solids on the built one (`o.flat`).
  if (!o.flat) paintBondIcon(ctx, p.props.which, box.x0 + box.w * 0.19, o.y, box.h * 0.9);
  const cx = o.x + box.w * 0.15;
  const maxW = box.w * 0.66;
  say(ctx, `${p.label}${(p.props.scale || 1) > 1 ? ` ×${p.props.scale}` : ''}`, cx, box.y0 + 3.0 * sc, Math.max(6.2, 2.1 * sc), { align: 'center', weight: 700, maxW });
  say(ctx, p.props.note || '', cx, box.y0 + 6.2 * sc, Math.max(5.6, 1.6 * sc), { align: 'center', color: DUST, maxW });
  say(ctx, `${p.props.dH} kJ`, cx, box.y0 + 9.0 * sc, Math.max(5.8, 1.7 * sc), { align: 'center', color: AMBER, maxW });
}

/** Two shelves drawn the way an energy diagram draws them: before on the left, after on the right, at their heights. */
function paintShelfPair(ctx, x0, y0, w, h, up, down) {
  const mid = y0 + h * 0.5;
  const rise = h * 0.3;
  const ya = mid + (up ? rise * 0.5 : down ? -rise * 0.5 : 0);
  const yb = mid + (up ? -rise * 0.5 : down ? rise * 0.5 : 0);
  const bw = w * 0.36;
  ctx.strokeStyle = STEEL; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.04, ya); ctx.lineTo(x0 + w * 0.04 + bw, ya); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.96 - bw, yb); ctx.lineTo(x0 + w * 0.96, yb); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = DIM; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.04 + bw, ya); ctx.lineTo(x0 + w * 0.96 - bw, yb); ctx.stroke();
  ctx.setLineDash([]);
}

function paintShelfCard(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.shelf, '#16140f');
  const sc = o.sc;
  const up = p.props.dH > 0;
  const down = p.props.dH < 0;
  say(ctx, p.label, box.x0 + 1.3 * sc, box.y0 + 1.9 * sc, Math.max(6, 1.8 * sc), { weight: 700, maxW: box.w - 2 * sc });
  paintShelfPair(ctx, box.x0 + 1 * sc, box.y0 + 3.4 * sc, box.w - 2 * sc, box.h - 8.4 * sc, up, down);
  say(ctx, `${p.props.from ?? ''} → ${p.props.to ?? ''}`, box.x0 + box.w / 2, box.y0 + box.h - 1.9 * sc, Math.max(5.5, 1.5 * sc), { align: 'center', color: DUST, maxW: box.w - 2 * sc });
}

/** The dozen particles of a phase (`heat-parts.js`), seen a little from the side, each with the streak of how fast it is moving. */
function particles(ctx, p, x0, y0, w, h, sc) {
  const dots = phaseDots(p.props.phase, p.props.T ?? 20);
  const r = Math.max(1.2, sc * 0.55);
  ctx.fillStyle = PHOS;
  ctx.strokeStyle = PHOS;
  ctx.lineWidth = Math.max(1, sc * 0.2);
  for (const d of dots) {
    // Deeper into the box is a little up and to the right.
    const px = x0 + (d.u * 0.86 + d.w * 0.12) * w;
    const py = y0 + (d.v * 0.86 + (1 - d.w) * 0.12) * h;
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - d.tail * sc * 4.2, py + d.tail * sc * 1.8); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.lineWidth = 1;
}

function paintPhaseCard(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.phase, '#16140f');
  const sc = o.sc;
  if (!o.flat) particles(ctx, p, box.x0 + 1.4 * sc, box.y0 + 1.4 * sc, box.w - 2.8 * sc, box.h - 8 * sc, sc);
  say(ctx, p.label, box.x0 + box.w / 2, box.y0 + box.h - 3.2 * sc, Math.max(6, 1.9 * sc), { align: 'center', weight: 700, maxW: box.w - 2 * sc });
}

function paintStmt(ctx, p, state, o) {
  const marked = Boolean(p.props.flipped);
  const box = slab(ctx, o, RECTS.stmt, marked ? '#33290f' : '#2a2620');
  if (marked) { ctx.strokeStyle = AMBER; ctx.lineWidth = 2; ctx.strokeRect(box.x0 + 1.5, box.y0 + 1.5, box.w - 3, box.h - 3); ctx.lineWidth = 1; }
  const size = Math.max(6.2, 2.1 * o.sc);
  const lines = wrap(p.label, STMT_CAP);
  lines.forEach((ln, i) => say(ctx, ln, o.x, o.y + (i - (lines.length - 1) / 2) * size * 1.2, size, { align: 'center', weight: 600, maxW: box.w - 3 * o.sc, color: marked ? AMBER : PLATE_COLORS.text }));
}

/**
 * A change drawn as two small boxes of particles, before and after, one dot per particle: a solid sits in rows at the bottom, a liquid
 * in a loose heap, a gas spread over the whole box. `props.before` and `props.after` are lists of `[phase, count]`.
 */
function paintShift(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.shift, '#2a2620');
  const sc = o.sc;
  say(ctx, p.label, o.x, box.y0 + 2.6 * sc, Math.max(6, 1.9 * sc), { align: 'center', weight: 600, maxW: box.w - 2 * sc });
  const bw = box.w * 0.38;
  const bh = box.h * 0.56;
  const by = box.y0 + box.h - bh - 1.4 * sc;
  const side = (x0, groups, seed) => {
    ctx.strokeStyle = DUST; ctx.strokeRect(x0 + 0.5, by + 0.5, bw - 1, bh - 1);
    const rnd = seededRng(`${p.id}|${seed}`);
    const r = Math.max(2.2, 1.05 * sc);
    let row = 0;
    for (const [phase, n] of groups) {
      for (let k = 0; k < n; k++) {
        let x; let y;
        if (phase === 'gas') { x = x0 + r + 1 + rnd() * (bw - 2 * r - 2); y = by + r + 1 + rnd() * (bh - 2 * r - 2); } else {
          const per = Math.max(1, Math.floor((bw - 2) / (2.4 * r)));
          const cx = k % per; const cy = Math.floor(k / per) + row;
          x = x0 + 1 + r + cx * 2.4 * r + (phase === 'liquid' && cy % 2 ? r : 0) + (phase === 'liquid' ? (rnd() - 0.5) * r * 0.5 : 0);
          y = by + bh - 1 - r - cy * 2.2 * r;
        }
        ctx.fillStyle = phase === 'gas' ? PHOS : phase === 'liquid' ? COLD : AMBER;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      if (phase !== 'gas') row += Math.ceil(n / Math.max(1, Math.floor((bw - 2) / (2.4 * r))));
    }
  };
  side(box.x0 + box.w * 0.05, p.props.before || [], 'b');
  side(box.x0 + box.w * 0.57, p.props.after || [], 'a');
  say(ctx, '→', o.x, by + bh / 2, Math.max(7, 2.4 * sc), { align: 'center', color: DIM });
}

function paintTag(ctx, p, state, o) {
  const marked = Boolean(p.props.flipped);
  const box = slab(ctx, o, RECTS.tag, marked ? '#33290f' : '#2a2620');
  if (marked) { ctx.strokeStyle = AMBER; ctx.lineWidth = 2; ctx.strokeRect(box.x0 + 1.5, box.y0 + 1.5, box.w - 3, box.h - 3); ctx.lineWidth = 1; }
  const size = Math.max(5.8, 1.85 * o.sc);
  const lines = wrap(p.label, 17);
  lines.forEach((ln, i) => say(ctx, ln, o.x, o.y + (i - (lines.length - 1) / 2) * size * 1.2, size, { align: 'center', weight: 600, maxW: box.w - 2 * o.sc, color: marked ? AMBER : PLATE_COLORS.text }));
}

function paintNote(ctx, p, state, o) {
  const marked = Boolean(p.props.flipped);
  const box = slab(ctx, o, RECTS.note, marked ? '#33290f' : '#2a2620');
  if (marked) { ctx.strokeStyle = AMBER; ctx.lineWidth = 2; ctx.strokeRect(box.x0 + 1.5, box.y0 + 1.5, box.w - 3, box.h - 3); ctx.lineWidth = 1; }
  const size = Math.max(5.8, 1.95 * o.sc);
  const lines = wrapN(p.label, 30, 3);
  lines.forEach((ln, i) => say(ctx, ln, o.x, o.y + (i - (lines.length - 1) / 2) * size * 1.25, size, { align: 'center', weight: 600, maxW: box.w - 3 * o.sc, color: marked ? AMBER : PLATE_COLORS.text }));
}

/** A free-energy card: the line of ΔG against temperature, with the stretch where it is below zero marked. */
function paintGCard(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.gcard, '#16140f');
  const sc = o.sc;
  const { dH, dS, Tmin, Tmax } = p.props;
  say(ctx, p.label, box.x0 + 1.3 * sc, box.y0 + 1.9 * sc, Math.max(5.8, 1.8 * sc), { weight: 700, maxW: box.w - 2 * sc });
  const px = box.x0 + 2 * sc; const py = box.y0 + 4.2 * sc; const pw = box.w - 4 * sc; const ph = box.h - 7.2 * sc;
  const dG = T => dH - (T * dS) / 1000;
  const lo = Math.min(dG(Tmin), dG(Tmax), 0); const hi = Math.max(dG(Tmin), dG(Tmax), 0);
  const span = Math.max(1e-6, hi - lo);
  const X = T => px + ((T - Tmin) / (Tmax - Tmin)) * pw;
  const Y = v => py + ph - ((v - lo) / span) * ph;
  ctx.strokeStyle = DIM;
  ctx.beginPath(); ctx.moveTo(px, Y(0)); ctx.lineTo(px + pw, Y(0)); ctx.stroke();
  // Where ΔG is below zero, the strip under the zero line is shaded.
  ctx.fillStyle = 'rgba(111,143,63,0.28)';
  const n = 24;
  for (let i = 0; i < n; i++) {
    const T = Tmin + ((i + 0.5) / n) * (Tmax - Tmin);
    if (dG(T) < 0) ctx.fillRect(X(Tmin + (i / n) * (Tmax - Tmin)), Y(0), pw / n + 0.5, 2.2 * sc);
  }
  ctx.strokeStyle = PHOS; ctx.lineWidth = Math.max(1.3, sc * 0.3);
  ctx.beginPath(); ctx.moveTo(X(Tmin), Y(dG(Tmin))); ctx.lineTo(X(Tmax), Y(dG(Tmax))); ctx.stroke(); ctx.lineWidth = 1;
  say(ctx, 'ΔG against T', box.x0 + box.w / 2, box.y0 + box.h - 1.6 * sc, Math.max(5.5, 1.5 * sc), { align: 'center', color: DUST });
}

function paintNum(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.num);
  say(ctx, p.label, o.x, o.y, Math.max(7, 2.8 * o.sc), { align: 'center', weight: 700, maxW: box.w - 2 * o.sc });
}

function paintChip(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.chip, '#1d1a16');
  say(ctx, p.label, o.x, o.y, Math.max(6.5, 2.1 * o.sc), { align: 'center', weight: 700, maxW: box.w - 2 * o.sc });
}

function paintParticle(ctx, p, state, o) {
  ctx.fillStyle = '#2a2620';
  ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = o.lit ? AMBER : DUST; ctx.lineWidth = o.lit ? 2 : 1.2; ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = PHOS;
  ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.45, 0, Math.PI * 2); ctx.fill();
}

const PAINTERS = { block: paintBlock, charge: paintCharge, eqn: paintEqn, bond: paintBond, shelf: paintShelfCard, phase: paintPhaseCard, stmt: paintStmt, shift: paintShift, tag: paintTag, note: paintNote, gcard: paintGCard, num: paintNum, chip: paintChip, ptc: paintParticle };

export function paintPiece(ctx, p, state, o) {
  const fn = PAINTERS[p.kind];
  if (!fn) return false;
  fn(ctx, p, state, o);
  return true;
}

export function faceKey(p, state) {
  const pr = p.props;
  let extra = '';
  if (p.kind === 'block') { const r = blockRead(state, p.id); extra = `${r.T.toFixed(1)}|${r.joined ? 1 : 0}`; }
  return `${p.kind}|${p.label}|${pr.flipped ? 1 : 0}|${pr.scale || 1}|${pr.shown ?? ''}|${pr.rise ?? ''}|${pr.T ?? ''}|${extra}`;
}

/* ------------------------------------------------------------------
   THE FIXTURES
   ------------------------------------------------------------------ */

const frameOf = b => ({
  x: d => b.X(b.lay.box.x0 + d),
  y: d => b.Y(b.lay.box.y0 + d),
  len: d => d * b.sc,
  size: (k, min = 6.5) => Math.max(min, k * b.sc)
});

/** Where a fixture's own picture starts, below its dial tracks, in units from its top edge. */
export const contentTop = nd => (nd ? 8 + (nd - 1) * 5 + 3.6 : 10);

function cupGeometry(f, lay) {
  const top = lay.dials.length ? lay.dials.reduce((a, d) => Math.max(a, d.y), 0) - lay.box.y0 + 3.6 : 10;
  return { top };
}

function paintCup(ctx, f, state, b) {
  const F = frameOf(b);
  const r = cupRead(state, f.id);
  const p = f.props;
  const { top } = cupGeometry(f, b.lay);
  // The cup under its mouth (the slot): a lagged wall, the bath inside it, a lid band when the lid is on.
  const cx0 = 3; const cx1 = 23;
  const cy0 = top + 15.5; const cy1 = top + 31.5;
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(F.x(cx0), F.y(cy0), F.len(cx1 - cx0), F.len(cy1 - cy0));
  const level = Math.min(1, 0.45 + (r.mWater / (p.vmax || 220)) * 0.5);
  ctx.fillStyle = Math.abs(r.c - 4.184) > 0.01 ? 'rgba(119,121,122,0.45)' : r.Tf > r.T0 + 0.05 ? 'rgba(192,101,43,0.30)' : r.Tf < r.T0 - 0.05 ? 'rgba(111,143,176,0.32)' : 'rgba(111,143,63,0.22)';
  ctx.fillRect(F.x(cx0), F.y(cy1 - (cy1 - cy0) * level), F.len(cx1 - cx0), F.len((cy1 - cy0) * level));
  ctx.strokeStyle = STEEL; ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(F.x(cx0)) + 0.5, Math.round(F.y(cy0)) + 0.5, Math.round(F.len(cx1 - cx0)), Math.round(F.len(cy1 - cy0)));
  ctx.lineWidth = 1;
  if (p.boundary) {
    // The line round what is being studied: the mouth and the charge in it.
    ctx.strokeStyle = AMBER; ctx.setLineDash([4, 3]);
    ctx.strokeRect(F.x(1.5), F.y(top - 0.5), F.len(23), F.len(16.5));
    ctx.setLineDash([]);
  }
  say(ctx, `${sig(r.mWater, 4)} g`, F.x((cx0 + cx1) / 2), F.y(cy1 - 3), F.size(2.4, 6), { align: 'center', color: DUST });
  // The thermometer column: its fill stands as high as the reading, between 0 and 100.
  const tx = 27; const ty0 = top + 1; const ty1 = top + 31;
  ctx.strokeStyle = DUST;
  ctx.strokeRect(Math.round(F.x(tx)) + 0.5, Math.round(F.y(ty0)) + 0.5, Math.round(F.len(3)), Math.round(F.len(ty1 - ty0)));
  const frac = Math.max(0.02, Math.min(1, r.Tf / 100));
  ctx.fillStyle = inkOf(r.Tf);
  ctx.fillRect(F.x(tx) + 1, F.y(ty1 - (ty1 - ty0) * frac), F.len(3) - 1, F.len((ty1 - ty0) * frac));
  // The readouts.
  let line = 0;
  const put = (k, v, color = PHOS) => { say(ctx, k, F.x(32), F.y(top + 3 + line * 6), F.size(1.9, 5.8), { color: DIM }); say(ctx, v, F.x(32), F.y(top + 5.7 + line * 6), F.size(2.7, 6.5), { color, weight: 700, maxW: F.len(f.size.w - 34) }); line++; };
  put('BATH', `${fixed(r.Tf, 1)} °C`, inkOf(r.Tf));
  put('RISE', `${fixed(r.dT, 1, true)} °C`, r.dT > 0.05 ? WARM : r.dT < -0.05 ? COLD : DUST);
  if (p.showHeat) put('HEAT', `${Math.round(r.q).toLocaleString('en-US')} J`, AMBER);
  if (p.showVerdict) put('BATH', r.dT > 0.05 ? 'WARMED' : r.dT < -0.05 ? 'COOLED' : 'SAME', DUST);
  if (p.showLid && r.lidOff) say(ctx, 'LID OFF', F.x(32), F.y(top + 29), F.size(2.2, 6), { color: AMBER, weight: 700 });
}

function paintShelves(ctx, f, state, b) {
  const F = frameOf(b);
  const r = shelvesRead(state, f.id);
  const p = f.props;
  const { top } = cupGeometry(f, b.lay);
  const x0 = b.X(b.lay.box.x0 + 2); const w = F.len(f.size.w - 4);
  const y0 = F.y(top + 1); const h = F.len(f.size.h - top - 10);
  // The shelves, as high as their energies: the scale is the stage's own, so two charts on one table are drawn alike.
  const scale = p.scale || Math.max(Math.abs(r.dH), 1);
  const mid = y0 + h * 0.5;
  const dy = Math.max(-0.42, Math.min(0.42, r.dH / (scale * 2.2))) * h;
  const ya = mid + dy * 0.5; const yb = mid - dy * 0.5;
  const bw = w * 0.34;
  ctx.strokeStyle = STEEL; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.03, ya); ctx.lineTo(x0 + w * 0.03 + bw, ya); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.97 - bw, yb); ctx.lineTo(x0 + w * 0.97, yb); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = DIM; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.03 + bw, ya); ctx.lineTo(x0 + w * 0.97 - bw, yb); ctx.stroke();
  ctx.setLineDash([]);
  say(ctx, r.from, x0 + w * 0.03, Math.min(y0 + h + F.len(1.8), ya + F.len(3)), F.size(2.1, 5.8), { color: DUST, maxW: bw + F.len(4) });
  say(ctx, r.to, x0 + w * 0.97, Math.min(y0 + h + F.len(1.8), yb + F.len(3)), F.size(2.1, 5.8), { color: DUST, align: 'right', maxW: bw + F.len(4) });
  const ty = F.y(f.size.h - 3.6);
  if (!p.hideValue) say(ctx, `ΔH ${signedKJ(r.dH)} kJ/mol`, F.x(f.size.w - 2), ty, F.size(2.7, 6.5), { color: AMBER, weight: 700, align: 'right' });
  if (!p.hideVerdict) say(ctx, r.up ? 'TAKES IN ENERGY' : r.down ? 'GIVES OUT ENERGY' : 'NO CHANGE', F.x(2), ty, F.size(2.2, 6), { color: DUST });
}

function paintWell(ctx, f, state, b) {
  const F = frameOf(b);
  const r = wellRead(state, f.id);
  const p = f.props;
  const { top } = cupGeometry(f, b.lay);
  // Two atoms, as far apart as the crank has pulled them, and the bond between while there is one.
  const ay = top + 6;
  const gap = 2 + r.frac * (f.size.w - 20);
  const cx = f.size.w / 2;
  const x1 = cx - gap / 2; const x2 = cx + gap / 2;
  ctx.strokeStyle = r.frac < 0.98 ? AMBER : DIM;
  ctx.lineWidth = Math.max(1, F.len(1.4 * (1 - r.frac)));
  ctx.beginPath(); ctx.moveTo(F.x(x1), F.y(ay)); ctx.lineTo(F.x(x2), F.y(ay)); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = '#2a2620'; ctx.strokeStyle = DUST;
  for (const [x, t] of [[x1, p.atoms?.[0] ?? ''], [x2, p.atoms?.[1] ?? '']]) {
    ctx.beginPath(); ctx.arc(F.x(x), F.y(ay), F.len(3.4), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    say(ctx, t, F.x(x), F.y(ay), F.size(2.6, 6.5), { align: 'center', weight: 700 });
  }
  // The well: the energy against the distance, at the crank's seven settings, and a dot where the atoms are.
  const wy0 = top + 12; const wy1 = top + 25; const wx0 = 4; const wx1 = f.size.w - 4;
  ctx.strokeStyle = DIM;
  ctx.beginPath(); ctx.moveTo(F.x(wx0), F.y(wy0)); ctx.lineTo(F.x(wx0), F.y(wy1)); ctx.lineTo(F.x(wx1), F.y(wy1)); ctx.stroke();
  const fracAt = k => (r.forming ? WELL[WELL.length - 1 - k] : WELL[k]);
  ctx.strokeStyle = PHOS; ctx.lineWidth = Math.max(1.2, b.sc * 0.3);
  ctx.beginPath();
  WELL.forEach((_, k) => { const x = wx0 + 1 + (k / (WELL.length - 1)) * (wx1 - wx0 - 2); const y = wy1 - fracAt(k) * (wy1 - wy0 - 1); if (k) ctx.lineTo(F.x(x), F.y(y)); else ctx.moveTo(F.x(x), F.y(y)); });
  ctx.stroke(); ctx.lineWidth = 1;
  const dx = wx0 + 1 + ((r.step - 1) / (WELL.length - 1)) * (wx1 - wx0 - 2);
  ctx.fillStyle = AMBER;
  ctx.beginPath(); ctx.arc(F.x(dx), F.y(wy1 - r.frac * (wy1 - wy0 - 1)), F.len(1.2), 0, Math.PI * 2); ctx.fill();
  say(ctx, p.bondLabel || '', F.x(2), F.y(f.size.h - 3.4), F.size(2.4, 6), { color: DUST, weight: 700 });
  const tested = state.recorder.rows.some(r => r.label === f.id);
  if (!p.hideCost || tested) {
    const word = r.forming ? 'ENERGY OUT' : 'ENERGY IN';
    const v = r.forming ? r.released : r.E;
    say(ctx, `${word} ${Math.round(v)} kJ/mol`, F.x(f.size.w - 2), F.y(f.size.h - 3.4), F.size(2.6, 6.4), { color: AMBER, weight: 700, align: 'right', maxW: F.len(f.size.w - 16) });
  }
}

function paintLedger(ctx, f, state, b) {
  const F = frameOf(b);
  const r = ledgerRead(state, f.id);
  const col = (x, name, n, total, color) => {
    say(ctx, name, F.x(x), F.y(5.5), F.size(2.2, 6), { color: DIM });
    if (!f.props.hideTotals) say(ctx, `${total} kJ`, F.x(x), F.y(10), F.size(3.4, 7.5), { color, weight: 700 });
    say(ctx, `${n} bond${n === 1 ? '' : 's'}`, F.x(x), F.y(14.4), F.size(2.2, 6), { color: DUST });
  };
  col(3, 'BROKEN', r.nBroken, r.broken, WARM);
  col(f.size.w / 2 + 2, 'FORMED', r.nFormed, r.formed, COLD);
  if (!f.props.hideNet) say(ctx, `BROKEN − FORMED = ${signedKJ(r.net)} kJ`, F.x(3), F.y(f.size.h - 3.2), F.size(2.7, 6.5), { color: AMBER, weight: 700, maxW: F.len(f.size.w - 6) });
}

function paintStack(ctx, f, state, b) {
  const F = frameOf(b);
  const r = stackRead(state, f.id);
  const p = f.props;
  const size = F.size(2.4, 5.8);
  const maxW = F.len(f.size.w - 4);
  // What is wanted, in the dust colour, in two lines (before the arrow and after it); a rule; what the stack adds up to, in the phosphor.
  say(ctx, p.targetText[0], F.x(2), F.y(8.6), size, { color: DUST, weight: 600, maxW });
  say(ctx, `→ ${p.targetText[1]}`, F.x(2), F.y(12.2), size, { color: DUST, weight: 600, maxW });
  ctx.strokeStyle = DIM;
  ctx.beginPath(); ctx.moveTo(F.x(2), F.y(14.9)); ctx.lineTo(F.x(f.size.w - 2), F.y(14.9)); ctx.stroke();
  if (r.empty) say(ctx, 'nothing stacked', F.x(2), F.y(18.4), size, { color: DIM, maxW });
  else {
    say(ctx, fmtSide(r.lhs) || '—', F.x(2), F.y(18.4), size, { color: PHOS, weight: 700, maxW });
    say(ctx, `→ ${fmtSide(r.rhs) || '—'}`, F.x(2), F.y(22), size, { color: PHOS, weight: 700, maxW });
  }
  if (!p.hideSum) say(ctx, `${p.symbol || 'ΔH'} ${r.empty ? '—' : signedKJ(r.dH)} kJ`, F.x(f.size.w - 2), F.y(f.size.h - 3.2), F.size(2.9, 6.5), { align: 'right', weight: 700, color: AMBER });
}

function paintCells(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const g = cellsOpen(state, f.id);
  const { top } = cupGeometry(f, b.lay);
  const cw = p.pitch ?? 13;
  const ch = p.ch ?? 13;
  const x0 = p.x0 ?? 4;
  const y0 = top + 1;
  for (let i = 1; i <= p.cells; i++) {
    const behind = i > g.count;
    ctx.fillStyle = behind ? '#0a0908' : '#16140f';
    ctx.fillRect(F.x(x0 + (i - 1) * cw), F.y(y0), F.len(cw - 0.8), F.len(ch));
    ctx.strokeStyle = behind ? DIM : STEEL;
    ctx.strokeRect(Math.round(F.x(x0 + (i - 1) * cw)) + 0.5, Math.round(F.y(y0)) + 0.5, Math.round(F.len(cw - 0.8)), Math.round(F.len(ch)));
  }
  if (!g.open) {
    const gx = x0 + p.leftCells * cw - 0.4;
    ctx.fillStyle = AMBER;
    ctx.fillRect(F.x(gx) - 1, F.y(y0 - 1.5), 3, F.len(ch + 3));
  }
  say(ctx, g.open ? 'GATE OPEN' : 'GATE SHUT', F.x(3), F.y(y0 + ch + 4.4), F.size(2.3, 6), { color: DUST });
  say(ctx, `ARRANGEMENTS LOGGED ${loggedArrangements(state, f.id)}`, F.x(f.size.w - 3), F.y(y0 + ch + 4.4), F.size(2.6, 6.4), { color: PHOS, weight: 700, align: 'right' });
  if (!p.hideWays) say(ctx, `W = ${waysOf(g.count, p.particles)}`, F.x(3), F.y(f.size.h - 2.6), F.size(3, 7), { color: AMBER, weight: 700 });
}

function paintChamber(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const shakes = shakesOf(state, f.id);
  const { top } = cupGeometry(f, b.lay);
  const cw = 8.2; const x0 = 3; const y0 = top + 1;
  const last = shakes[shakes.length - 1] || [];
  for (let i = 1; i <= p.cells; i++) {
    ctx.fillStyle = '#16140f';
    ctx.fillRect(F.x(x0 + (i - 1) * cw), F.y(y0), F.len(cw - 0.8), F.len(9));
    ctx.strokeStyle = STEEL;
    ctx.strokeRect(Math.round(F.x(x0 + (i - 1) * cw)) + 0.5, Math.round(F.y(y0)) + 0.5, Math.round(F.len(cw - 0.8)), Math.round(F.len(9)));
    if (last.includes(i)) { ctx.fillStyle = PHOS; ctx.beginPath(); ctx.arc(F.x(x0 + (i - 1) * cw + (cw - 0.8) / 2), F.y(y0 + 4.5), F.len(2.1), 0, Math.PI * 2); ctx.fill(); }
  }
  // Where the particles were, shake after shake: how many stood in the left half, 0 to all.
  const counts = Array.from({ length: p.particles + 1 }, () => 0);
  for (const s of shakes) counts[s.filter(c => c <= p.cells / 2).length]++;
  const hy1 = f.size.h - 7; const hh = f.size.h - top - 24;
  const bw = (f.size.w - 8) / counts.length;
  const mx = Math.max(1, ...counts);
  counts.forEach((n, i) => {
    ctx.fillStyle = i === p.particles ? WARM : PHOS;
    const hgt = (n / mx) * hh;
    ctx.fillRect(F.x(4 + i * bw), F.y(hy1) - F.len(hgt), F.len(bw - 1.2), F.len(hgt));
    say(ctx, String(i), F.x(4 + i * bw + (bw - 1.2) / 2), F.y(hy1 + 2.4), F.size(2.1, 5.8), { align: 'center', color: DUST });
  });
  say(ctx, `SHAKES ${shakes.length}`, F.x(2.5), F.y(top + 12.4), F.size(2.4, 6), { color: DUST });
  say(ctx, 'PARTICLES IN THE LEFT HALF', F.x(f.size.w - 2.5), F.y(top + 12.4), F.size(2.1, 5.8), { color: DIM, align: 'right' });
}

function paintPlot(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = plotRead(state, f.id);
  const { top } = cupGeometry(f, b.lay);
  const px = 6; const pw = f.size.w - 10; const py = top + 1; const ph = f.size.h - top - 12;
  const Tmin = p.Ts[0]; const Tmax = p.Ts[p.Ts.length - 1];
  const dGat = T => p.dH - (T * p.dS) / 1000;
  const lo = Math.min(dGat(Tmin), dGat(Tmax), 0) ; const hi = Math.max(dGat(Tmin), dGat(Tmax), 0);
  const span = Math.max(1e-6, hi - lo) * 1.1;
  const X = T => px + ((T - Tmin) / (Tmax - Tmin)) * pw;
  const Yv = v => py + ph - ((v - lo + (hi - lo) * 0.05) / span) * ph;
  ctx.strokeStyle = DIM;
  ctx.strokeRect(Math.round(F.x(px)) + 0.5, Math.round(F.y(py)) + 0.5, Math.round(F.len(pw)), Math.round(F.len(ph)));
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(F.x(px), F.y(Yv(0))); ctx.lineTo(F.x(px + pw), F.y(Yv(0))); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = PHOS; ctx.lineWidth = Math.max(1.4, b.sc * 0.3);
  ctx.beginPath(); ctx.moveTo(F.x(X(Tmin)), F.y(Yv(dGat(Tmin)))); ctx.lineTo(F.x(X(Tmax)), F.y(Yv(dGat(Tmax)))); ctx.stroke(); ctx.lineWidth = 1;
  if (r.cross != null && r.cross > Tmin && r.cross < Tmax && !p.hideCrossing) {
    ctx.fillStyle = AMBER; ctx.fillRect(F.x(X(r.cross)) - 1, F.y(Yv(0)) - F.len(1.6), 3, F.len(3.2));
    say(ctx, `${Math.round(r.cross)} K`, F.x(X(r.cross)), F.y(Yv(0)) + F.len(3.4), F.size(2.1, 5.8), { align: 'center', color: AMBER });
  }
  ctx.strokeStyle = AMBER;
  ctx.beginPath(); ctx.moveTo(F.x(X(r.T)), F.y(py)); ctx.lineTo(F.x(X(r.T)), F.y(py + ph)); ctx.stroke();
  const y = f.size.h - 3.6;
  say(ctx, `${Math.round(r.T)} K`, F.x(2.5), F.y(y), F.size(2.6, 6.4), { color: DUST, weight: 700 });
  // `words` prints the two pulls and their net in plain words, until the bench has earned the symbols.
  if (!p.hideTug) say(ctx, p.words ? `HEAT ${signedKJ(r.dH)}   SPREAD ${signedKJ(r.TdS)}` : `ΔH ${signedKJ(r.dH)}   TΔS ${signedKJ(r.TdS)}`, F.x(f.size.w / 2), F.y(y), F.size(2.2, 6), { color: DUST, align: 'center', maxW: F.len(f.size.w * 0.5) });
  if (!p.hideDG) say(ctx, `${p.words ? 'NET' : 'ΔG'} ${signedKJ(r.dG)} kJ`, F.x(f.size.w - 2.5), F.y(y), F.size(2.7, 6.5), { color: AMBER, weight: 700, align: 'right' });
}

function paintWarm(ctx, f, state, b) {
  const F = frameOf(b);
  const r = warmRead(state, f.id);
  const { top } = cupGeometry(f, b.lay);
  // A sample whose particles move faster as it is warmed: a streak as long as the temperature.
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(F.x(3), F.y(top + 1), F.len(f.size.w - 6), F.len(11));
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(Math.round(F.x(3)) + 0.5, Math.round(F.y(top + 1)) + 0.5, Math.round(F.len(f.size.w - 6)), Math.round(F.len(11)));
  const streak = F.len(0.8 + (r.T + 40) / 90 * 2.6);
  ctx.strokeStyle = PHOS; ctx.fillStyle = PHOS;
  for (let i = 0; i < 6; i++) {
    const x = F.x(8 + i * ((f.size.w - 16) / 5)); const y = F.y(top + 3.2 + (i % 2) * 5.2);
    ctx.beginPath(); ctx.arc(x, y, Math.max(1.2, F.len(0.55)), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - streak, y + streak * 0.35); ctx.stroke(); ctx.globalAlpha = 1;
  }
  say(ctx, `${Math.round(r.T)} °C`, F.x(3), F.y(top + 16), F.size(3, 7), { color: inkOf(r.T), weight: 700 });
  if (!f.props.hideS || state.recorder.rows.some(r => r.label === 'ΔS')) say(ctx, `ENTROPY GAINED ${fixed(r.dS, 1, true)} J/K`, F.x(f.size.w - 3), F.y(top + 16), F.size(2.4, 6), { color: AMBER, weight: 700, align: 'right', maxW: F.len(f.size.w - 20) });
}

function paintPlaque(ctx, f, state, b) {
  const F = frameOf(b);
  (f.props.lines || []).forEach((line, i) => say(ctx, line, F.x(2.2), F.y(8.4 + i * 3.8), F.size(2.7, 6.5), { color: DUST, maxW: F.len(f.size.w - 4) }));
}

function paintMarker(ctx, f, state, b) {
  const F = frameOf(b);
  const v = markerRead(state, f.id);
  const shown = f.props.unit ? `${v} ${f.props.unit}` : String(v);
  say(ctx, shown, F.x(f.size.w - 3), F.y(f.size.h - 3.4), F.size(4.2, 9), { align: 'right', weight: 700, color: AMBER });
}

function paintSelector(ctx, f, state, b) {
  const F = frameOf(b);
  const i = Math.round(f.dials.value.value) - 1;
  say(ctx, f.props.options[i] ?? '', F.x(f.size.w - 3), F.y(f.size.h - 3.4), F.size(3.4, 8), { align: 'right', weight: 700, color: AMBER, maxW: F.len(f.size.w - 6) });
}

export function paintFixture(ctx, f, state, b) {
  if (f.kind === 'cup') paintCup(ctx, f, state, b);
  else if (f.kind === 'shelves') paintShelves(ctx, f, state, b);
  else if (f.kind === 'well') paintWell(ctx, f, state, b);
  else if (f.kind === 'ledger') paintLedger(ctx, f, state, b);
  else if (f.kind === 'stack') paintStack(ctx, f, state, b);
  else if (f.kind === 'cells') paintCells(ctx, f, state, b);
  else if (f.kind === 'chamber') paintChamber(ctx, f, state, b);
  else if (f.kind === 'plot') paintPlot(ctx, f, state, b);
  else if (f.kind === 'warm') paintWarm(ctx, f, state, b);
  else if (f.kind === 'plaque') paintPlaque(ctx, f, state, b);
  else if (f.kind === 'marker') paintMarker(ctx, f, state, b);
  else if (f.kind === 'selector') paintSelector(ctx, f, state, b);
}

void whereIs; void occupiedCells; void LID_LOSS; void PHOS;
