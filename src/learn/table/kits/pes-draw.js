/**
 * kits/pes-draw.js — What the photoelectron bench's pieces and fixtures look like.
 *
 * The drawn tabletop (`engine/table2d.js` `drawTable`) and the built one (`engine/table3d.js`) call THESE functions with the same
 * arguments, so a chamber, a specimen card and an atom under construction are one picture in both views. Every figure is read from
 * `pes-read.js`, which asks `electrons.js`; a painter decides nothing.
 *
 * THE PILES. The electrons that fall into the strip are the same circles in both views: the drawn table paints them here, and the
 * built one stands them up as instanced bodies on the very slots `chamberPiles` gives (`b.bodies` leaves them to it).
 *
 * SCOURED PLATE: phosphor dots on a recessed plate, hairline rims, nothing blooms. A peak and a ring are told apart by position and
 * size, never by colour alone.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import {
  BINS, STACK, TICKS, stripOf, tickAt, chamberRead, buildRead, printOf, binOf, writtenRead, markerRead, shellsOf, seatedIn
} from './pes-read.js';

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const RIM = PLATE_COLORS.rim;
const WELL = '#16140f';

function say(ctx, text, x, y, size, o = {}) {
  ctx.font = `${o.weight || 500} ${Math.max(6, size)}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  if (o.maxW) ctx.fillText(text, x, y, o.maxW); else ctx.fillText(text, x, y);
}

function well(ctx, x, y, w, h) {
  ctx.fillStyle = WELL;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
}

/** The rings of an atom with `shells` electrons per shell, round (cx, cy), `R` pixels to the outer ring. */
function rings(ctx, cx, cy, R, shells, dot) {
  const n = shells.length;
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 1;
  shells.forEach((cnt, i) => {
    const r = R * (i + 1) / n;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = DUST;
    for (let k = 0; k < cnt; k++) {
      const a = (k / Math.max(cnt, 1)) * Math.PI * 2 + i * 0.5;
      ctx.beginPath(); ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), dot, 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.fillStyle = STEEL;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, dot * 1.5), 0, Math.PI * 2); ctx.fill();
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

export const RECTS = Object.freeze({ spec: { hw: 11, hh: 7.2 } });

function paintSpec(ctx, p, state, o) {
  const { hw, hh } = RECTS.spec;
  const x0 = o.x - hw * o.sc;
  const y0 = o.y - hh * o.sc;
  const w = hw * 2 * o.sc;
  const h = hh * 2 * o.sc;
  ctx.fillStyle = '#2a2620';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : DUST;
  ctx.lineWidth = o.lit ? 2 : 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.lineWidth = 1;
  say(ctx, p.label, o.x, y0 + h * 0.2, Math.max(7, h * 0.2), { align: 'center', maxW: w - 3, weight: 700 });
  // The printout: the peaks this card was fired at, one bar to a bin, as tall as the pile was. Never printed before it is fired.
  const peaks = printOf(p);
  const base = y0 + h * 0.84;
  const colW = (w - 6) / BINS;
  if (peaks) {
    ctx.fillStyle = PHOS;
    for (const pk of peaks) {
      const b = binOf(pk.energy);
      const bh = Math.max(1, (h * 0.46) * (pk.height / STACK));
      ctx.fillRect(x0 + 3 + b * colW, base - bh, Math.max(1.4, colW * 0.8), bh);
    }
  }
  ctx.strokeStyle = peaks ? STEEL : DIM;
  ctx.beginPath(); ctx.moveTo(x0 + 3, base + 0.5); ctx.lineTo(x0 + w - 3, base + 0.5); ctx.stroke();
  if (p.props.note) say(ctx, p.props.note, o.x, y0 + h * 0.9, Math.max(6, h * 0.14), { align: 'center', color: DUST, maxW: w - 3 });
}

export function paintPiece(ctx, p, state, o) {
  if (p.kind === 'spec') { paintSpec(ctx, p, state, o); return true; }
  return false;
}

export function faceKey(p, state) {
  if (p.kind === 'spec') return `${p.label}|${p.props.printed ? p.props.printAt : 'x'}|${p.props.note || ''}`;
  return p.label;
}

/* ------------------------------------------------------------------
   FIXTURES
   ------------------------------------------------------------------ */

const frameOf = b => ({
  x: d => b.X(b.lay.box.x0 + d),
  y: d => b.Y(b.lay.box.y0 + d),
  len: d => d * b.sc,
  size: (k, min = 7) => Math.max(min, k * b.sc)
});

function paintChamber(ctx, f, state, b) {
  const F = frameOf(b);
  const strip = stripOf(f);
  const read = chamberRead(state, f.id);
  const sc = b.sc;
  const X = b.X;
  const Y = b.Y;
  // The strip's well, its baseline and the scale under it.
  well(ctx, X(strip.x0), Y(strip.top - 1.2), strip.pitch * BINS * sc, (strip.base - strip.top + 2.4) * sc);
  ctx.strokeStyle = STEEL;
  ctx.beginPath(); ctx.moveTo(X(strip.x0), Y(strip.base) + 0.5); ctx.lineTo(X(strip.x0 + strip.pitch * BINS), Y(strip.base) + 0.5); ctx.stroke();
  TICKS.forEach((e, i) => {
    const x = X(tickAt(strip, e));
    ctx.strokeStyle = STEEL;
    ctx.beginPath(); ctx.moveTo(x, Y(strip.base)); ctx.lineTo(x, Y(strip.base) + 3); ctx.stroke();
    if (i % 2 === 0) say(ctx, String(e), x, Y(strip.base + 4.6), F.size(2.2, 6), { align: 'center', color: DIM });
  });
  say(ctx, f.props.axisLabel || 'ENERGY TO REMOVE, MJ/mol', X(strip.x0), Y(strip.base + 8.2), F.size(2.3, 6), { color: DUST });
  // The electrons that have fallen: a column in every bin that has a peak. (The built table stands them up.)
  if (!b.bodies) {
    const r = Math.max(1.1, Math.min(strip.step, strip.pitch) * 0.4 * sc);
    ctx.fillStyle = PHOS;
    for (let bin = 0; bin < BINS; bin++) {
      for (let k = 0; k < (read.piles[bin] || 0); k++) {
        ctx.beginPath(); ctx.arc(X(strip.binX(bin)), Y(strip.base - (k + 0.5) * strip.step), r, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // The atom built to match, laid over the strip as outlines: a peak the build makes that the strip does not.
  const model = f.props.model ? buildRead(state, f.props.model) : null;
  if (model?.whole) {
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1;
    const half = Math.max(1.4, Math.min(strip.step, strip.pitch) * 0.46 * sc);
    for (const pk of model.peaks) {
      const bin = binOf(pk.energy);
      for (let k = 0; k < pk.height; k++) ctx.strokeRect(X(strip.binX(bin)) - half, Y(strip.base - (k + 0.5) * strip.step) - half, half * 2, half * 2);
    }
  }
  // What the strip shows, and why it is empty when it is.
  let caption = 'NOTHING FIRED YET';
  let colour = DIM;
  if (read.fired) {
    caption = read.electrons ? read.firedPiece.label : `${read.firedPiece.label}: NOTHING CAME OFF`;
    colour = read.electrons ? PHOS : AMBER;
  }
  say(ctx, caption, X(strip.x0 + 1), Y(strip.top - 3.6), F.size(2.6, 7), { color: colour, weight: 700, maxW: strip.pitch * BINS * sc - 2 });
  if (model && !model.whole) say(ctx, model.protons || model.electrons ? 'THE BUILD IS NO WHOLE ATOM' : 'NOTHING BUILT YET', X(strip.x0 + strip.pitch * BINS - 1), Y(strip.top - 3.6), F.size(2.3, 6), { align: 'right', color: AMBER });
  // The specimen's own rings, beside its holder, when the stage gives them.
  if (f.props.rings) {
    const sym = read.sym;
    const cx = F.x(13);
    const cy = F.y(strip.box.h - 7.6);
    if (sym) rings(ctx, cx, cy, F.len(5.6), shellsOf(sym), Math.max(1.2, F.len(0.55)));
    else say(ctx, 'NO SPECIMEN', cx, cy, F.size(2.1, 6), { align: 'center', color: DIM });
  }
}

function paintBuild(ctx, f, state, b) {
  const F = frameOf(b);
  const read = buildRead(state, f.id);
  const w = f.size.w;
  const cx = F.x(w / 2);
  const cy = F.y(f.size.h - 16);
  // (a build that is shorter than the usual 46 units draws a smaller atom, so its rings stay clear of the dials above them)
  const R = F.len(Math.max(6, Math.min(w * 0.4, 13, f.size.h - 32)));
  const shells = read.electrons ? ringsFor(read.electrons) : [];
  if (shells.length) rings(ctx, cx, cy, R, shells, Math.max(1.3, F.len(0.7)));
  else { ctx.strokeStyle = RIM; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); }
  const nucleus = Math.max(F.len(3), 8);
  ctx.fillStyle = read.protons ? STEEL : WELL;
  ctx.beginPath(); ctx.arc(cx, cy, nucleus, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = DUST;
  ctx.beginPath(); ctx.arc(cx, cy, nucleus, 0, Math.PI * 2); ctx.stroke();
  say(ctx, read.protons ? `+${read.protons}` : '0', cx, cy, F.size(2.8, 8), { align: 'center', weight: 700, color: PLATE_COLORS.text });
  const net = read.protons - read.electrons;
  say(ctx, net === 0 ? 'NEUTRAL' : net > 0 ? `+${net} OVERALL` : `${net} OVERALL`, F.x(w / 2), F.y(f.size.h - 2.4), F.size(2.2, 6), { align: 'center', color: net === 0 ? PHOS : AMBER });
}

/** Electrons per ring for a whole count, two and then eight: the bench's own plain picture of an atom. */
function ringsFor(n) {
  const out = [];
  let left = n;
  for (const cap of [2, 8, 8, 18]) {
    if (left <= 0) break;
    out.push(Math.min(left, cap));
    left -= cap;
  }
  return out;
}

function paintWriter(ctx, f, state, b) {
  const F = frameOf(b);
  const read = writtenRead(state, f.id);
  say(ctx, `${read.total} ELECTRONS WRITTEN`, F.x(f.size.w - 2), F.y(f.size.h - 3), F.size(2.3, 6), { align: 'right', color: read.total ? PHOS : DIM });
}

function paintPlaque(ctx, f, state, b) {
  const F = frameOf(b);
  (f.props.lines || []).forEach((line, i) => say(ctx, line, F.x(2.2), F.y(8.4 + i * 3.8), F.size(2.7, 7), { color: DUST, maxW: F.len(f.size.w - 4) }));
}

function paintMarker(ctx, f, state, b) {
  const F = frameOf(b);
  say(ctx, String(markerRead(state, f.id)), F.x(f.size.w - 3), F.y(f.size.h - 3.4), F.size(4.2, 9), { align: 'right', weight: 700, color: AMBER });
}

export function paintFixture(ctx, f, state, b) {
  if (f.kind === 'pes') paintChamber(ctx, f, state, b);
  else if (f.kind === 'build') paintBuild(ctx, f, state, b);
  else if (f.kind === 'writer') paintWriter(ctx, f, state, b);
  else if (f.kind === 'plaque') paintPlaque(ctx, f, state, b);
  else if (f.kind === 'tally') paintMarker(ctx, f, state, b);
}

export { seatedIn };
