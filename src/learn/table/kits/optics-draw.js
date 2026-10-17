/**
 * kits/optics-draw.js — What the optics kit's pieces and fixtures look like.
 *
 * The drawn tabletop (`engine/table2d.js` `drawTable`) and the built one (`engine/table3d.js`, which paints a piece's face and
 * the flat part of the plate) call THESE functions, with the same arguments, so a lamp, a tube, a screen or a ladder is one
 * picture in both views. Every figure a picture prints is read from `optics-read.js`, which asks the planners in
 * `lightdata.js`; a painter decides nothing.
 *
 * SCOURED PLATE: phosphor and amber on a recessed plate, hairline rims, nothing blooms and nothing is rounded. Colour is a
 * convenience on a wave or a band (the wavelength's own colour, `wavelengthRgb`), and every reading is also a number.
 */

import { PLATE_COLORS, plateText } from '../../engine/plates.js';
import { fmtLength } from '../../engine/lightbench.js';
import { wavelengthRgb, PRISM_RANGE, bohrJoules, METALS, fmtSig, TRACE_SPAN_NM, VISIBLE, isVisible } from '../../engine/lightdata.js';
import {
  seated, waveRead, lampNm, rulerRead, pulseRead, timedLast, bandRead, cellRead, ladderRead, probeJumps, litSource, marksOf,
  detectorsOn, TOP, WATER_SPAN_M, LINES
} from './optics-read.js';

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const RIM = PLATE_COLORS.rim;
const INK = '#0a0908';
const WELL = '#16140f';

const rgbCss = (rgb, a = 1) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
const colourOf = nm => { const rgb = wavelengthRgb(nm); return rgb ? rgbCss(rgb) : DUST; };

/** Text that fits a width (the canvas squeezes it rather than letting it run over). */
function say(ctx, text, x, y, size, o = {}) {
  ctx.font = `${o.weight || 500} ${Math.max(6, size)}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  if (o.maxW) ctx.fillText(text, x, y, o.maxW); else ctx.fillText(text, x, y);
}

/** A hairline-edged recessed well. */
function well(ctx, x, y, w, h, o = {}) {
  ctx.fillStyle = o.fill || WELL;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = o.stroke || RIM;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
}

/** A fixture's frame of reference: units measured from its box's top left, mapped to the picture. */
function frameOf(b) {
  const r = b.lay.box;
  return {
    r, sc: b.sc,
    x: d => b.X(r.x0 + d),
    y: d => b.Y(r.y0 + d),
    len: d => d * b.sc,
    size: (k, min = 7) => Math.max(min, k * b.sc)
  };
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

/** Sizes of the kit's rectangular pieces, in table units (half width, half height). */
export const RECTS = Object.freeze({
  lamp: { hw: 10.5, hh: 6.5 },
  plate: { hw: 8, hh: 8 },
  tube: { hw: 12, hh: 6.5 },
  strip: { hw: 14, hh: 6.5 },
  chip: { hw: 9, hh: 5.5 },
  detector: { hw: 11, hh: 6.5 },
  cell: { hw: 11, hh: 6.5 },
  filament: { hw: 11, hh: 6.5 },
  water: { hw: 11, hh: 6.5 },
  source: { hw: 13, hh: 6.5 }
});

/** The wavelength a lamp piece shines at where it stands now: its own, or its screen's dial for a tuned lamp. */
function nmNow(state, p) {
  if (p.props.tuned) {
    const slot = p.zone && p.zone.startsWith('slot:') ? p.zone.slice(5) : null;
    const f = slot ? Object.values(state.fixtures).find(x => x.props.slot === slot) : null;
    return f ? lampNm(f, p) : null;
  }
  return p.props.nm ?? null;
}

/** The slab every card-shaped piece is cut from: a dark face with a hairline edge, amber while held. */
function slab(ctx, o, hw, hh, tone = '#2a2620') {
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

function paintLamp(ctx, p, state, o) {
  const { hw, hh } = RECTS.lamp;
  const box = slab(ctx, o, hw, hh);
  const nm = nmNow(state, p);
  const lit = litSource(state, p) && nm != null;
  // The lens: a ring with the light behind it. Dark until the lamp stands in a screen.
  const lr = box.h * 0.32;
  const lx = box.x0 + lr + box.h * 0.18;
  ctx.fillStyle = lit ? colourOf(nm) : INK;
  ctx.beginPath();
  ctx.arc(lx, o.y, lr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = lit ? DUST : STEEL;
  ctx.beginPath();
  ctx.arc(lx, o.y, lr, 0, Math.PI * 2);
  ctx.stroke();
  say(ctx, p.label, lx + lr + box.h * 0.14, o.y, box.h * 0.26, { align: 'left', maxW: box.x0 + box.w - (lx + lr + box.h * 0.2) - 2, weight: 700, color: lit ? PLATE_COLORS.text : DUST });
}

function paintWaterStrip(ctx, p, state, o) {
  const { hw, hh } = RECTS.water;
  const box = slab(ctx, o, hw, hh);
  // A trace off the flume's recorder: a little wave drawn across the strip.
  ctx.strokeStyle = DIM;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const x = box.x0 + 3 + (i / 24) * (box.w - 6);
    const y = o.y - box.h * 0.2 + Math.sin(i * 0.9) * box.h * 0.1;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  say(ctx, p.label, o.x, o.y + box.h * 0.2, box.h * 0.34, { align: 'center', maxW: box.w - 4, weight: 700 });
}

/** A source that is not a lamp on the bench: a mast, an oven, a tube. Its light is read off a ruler. */
function paintSource(ctx, p, state, o) {
  const { hw, hh } = RECTS.source;
  const box = slab(ctx, o, hw, hh);
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(box.x0 + 3.5, box.y0 + 3.5, box.w - 7, box.h - 7);
  say(ctx, p.label, o.x, o.y, box.h * 0.27, { align: 'center', maxW: box.w - 9, weight: 700 });
}

function paintPlate(ctx, p, state, o) {
  const { hw, hh } = RECTS.plate;
  const box = slab(ctx, o, hw, hh, '#37332c');
  // A plate of metal: a few bright rules across its upper face.
  ctx.strokeStyle = STEEL;
  for (let i = 0; i < 3; i++) {
    const y = box.y0 + box.h * (0.16 + i * 0.1);
    ctx.beginPath();
    ctx.moveTo(box.x0 + 3, y);
    ctx.lineTo(box.x0 + box.w - 3, y);
    ctx.stroke();
  }
  say(ctx, p.label, o.x, o.y + box.h * 0.2, box.h * 0.2, { align: 'center', maxW: box.w - 3, weight: 700 });
}

function paintTube(ctx, p, state, o) {
  const { hw, hh } = RECTS.tube;
  const box = slab(ctx, o, hw, hh);
  const on = litSource(state, p);
  // The glass, between two brass caps.
  const cap = box.w * 0.12;
  ctx.fillStyle = on ? '#4a4034' : INK;
  ctx.fillRect(box.x0 + cap, box.y0 + box.h * 0.18, box.w - cap * 2, box.h * 0.64);
  ctx.fillStyle = STEEL;
  ctx.fillRect(box.x0 + 1, box.y0 + box.h * 0.12, cap - 1, box.h * 0.76);
  ctx.fillRect(box.x0 + box.w - cap, box.y0 + box.h * 0.12, cap - 1, box.h * 0.76);
  say(ctx, p.label, o.x, o.y, box.h * 0.27, { align: 'center', maxW: box.w - cap * 2 - 2, weight: 700, color: on ? PLATE_COLORS.text : DUST });
}

function paintFilament(ctx, p, state, o) {
  const { hw, hh } = RECTS.filament;
  const box = slab(ctx, o, hw, hh);
  const on = litSource(state, p);
  ctx.strokeStyle = on ? AMBER : STEEL;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const x = box.x0 + 4 + (i / n) * (box.w - 8);
    const y = o.y - box.h * 0.22 + (i % 2 ? -1 : 1) * box.h * 0.1;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
  say(ctx, p.label, o.x, o.y + box.h * 0.22, box.h * 0.27, { align: 'center', maxW: box.w - 4, weight: 700 });
}

function paintCell(ctx, p, state, o) {
  const { hw, hh } = RECTS.cell;
  const box = slab(ctx, o, hw, hh);
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(box.x0 + box.w * 0.1 + 0.5, box.y0 + box.h * 0.16 + 0.5, box.w * 0.8, box.h * 0.36);
  say(ctx, p.label, o.x, o.y + box.h * 0.22, box.h * 0.27, { align: 'center', maxW: box.w - 4, weight: 700 });
}

/** A strip of glass with a gas's lines printed on it, at their true places on the 380 to 750 nm scale. */
function paintStrip(ctx, p, state, o) {
  const { hw, hh } = RECTS.strip;
  const box = slab(ctx, o, hw, hh);
  const gas = p.props.gas;
  const x0 = box.x0 + 4;
  const w = box.w - 8;
  const y1 = box.y0 + box.h - 3;
  for (const nm of (LINES[gas] || []).filter(isVisible)) {
    const x = x0 + ((nm - PRISM_RANGE.lo) / (PRISM_RANGE.hi - PRISM_RANGE.lo)) * w;
    ctx.fillStyle = colourOf(nm);
    ctx.fillRect(x - 0.75, y1 - box.h * 0.36, 1.5, box.h * 0.36);
  }
  say(ctx, p.label, o.x, o.y - box.h * 0.16, box.h * 0.27, { align: 'center', maxW: box.w - 4, weight: 700 });
}

function paintChip(ctx, p, state, o) {
  const { hw, hh } = RECTS.chip;
  const box = slab(ctx, o, hw, hh);
  say(ctx, p.label, o.x, o.y, box.h * 0.36, { align: 'center', maxW: box.w - 3, weight: 700 });
}

function paintDetector(ctx, p, state, o) {
  const { hw, hh } = RECTS.detector;
  const box = slab(ctx, o, hw, hh);
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(box.x0 + 3.5, box.y0 + 3.5, box.h * 0.4, box.h * 0.4);
  say(ctx, p.label, o.x + box.h * 0.1, o.y + box.h * 0.14, box.h * 0.27, { align: 'center', maxW: box.w - 6, weight: 700 });
}

function paintElectron(ctx, p, state, o) {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = o.lit ? AMBER : PHOS;
  ctx.lineWidth = o.lit ? 2 : 1.5;
  ctx.stroke();
  ctx.lineWidth = 1;
  say(ctx, p.label, o.x, o.y, o.r * 0.9, { align: 'center', weight: 700, color: PHOS });
}

function paintPiece(ctx, p, state, o) {
  switch (p.kind) {
    case 'lamp': paintLamp(ctx, p, state, o); return true;
    case 'water': paintWaterStrip(ctx, p, state, o); return true;
    case 'source': paintSource(ctx, p, state, o); return true;
    case 'plate': paintPlate(ctx, p, state, o); return true;
    case 'tube': paintTube(ctx, p, state, o); return true;
    case 'filament': paintFilament(ctx, p, state, o); return true;
    case 'cell': paintCell(ctx, p, state, o); return true;
    case 'strip': paintStrip(ctx, p, state, o); return true;
    case 'chip': paintChip(ctx, p, state, o); return true;
    case 'detector': paintDetector(ctx, p, state, o); return true;
    case 'electron': paintElectron(ctx, p, state, o); return true;
    default: return false;
  }
}

/** What the face depends on, so the built table repaints it when (and only when) it changes. */
function faceKey(p, state) {
  if (p.kind === 'lamp') return `${p.label}|${litSource(state, p) ? 1 : 0}|${nmNow(state, p) ?? '-'}`;
  if (p.kind === 'tube' || p.kind === 'filament') return `${p.label}|${litSource(state, p) ? 1 : 0}`;
  return p.label;
}

/* ------------------------------------------------------------------
   FIXTURES
   ------------------------------------------------------------------ */

/** The frequency, as the screen prints it. */
const e14Text = e14 => `${e14.toFixed(2)} x 10^14 /s`;

/** A readout: a small recessed box with its name over its figure. */
function readout(ctx, F, x, y, w, h, name, value, o = {}) {
  well(ctx, F.x(x), F.y(y), F.len(w), F.len(h));
  say(ctx, name, F.x(x + 1.2), F.y(y + h * 0.28), F.size(h * 0.2, 6), { color: DIM, maxW: F.len(w - 2) });
  say(ctx, value, F.x(x + w - 1.2), F.y(y + h * 0.72), F.size(h * 0.3, 8), { align: 'right', color: o.color || PHOS, weight: 700, maxW: F.len(w - 2.4) });
}

function paintWave(ctx, f, state, b) {
  const F = frameOf(b);
  const w = f.size.w;
  const h = f.size.h;
  const read = waveRead(state, f.id);
  const hasDial = Boolean(f.dials.colour);
  const top = hasDial ? 13 : 6;
  const x0 = f.props.left ?? 24;
  const rw = w - x0 - 2;
  // The readouts.
  const showRate = f.props.rate !== false;
  const rh = 9;
  if (read) {
    if (read.kind === 'water') {
      readout(ctx, F, x0, top, showRate ? rw * 0.42 : rw, rh, 'WAVELENGTH', `${read.metres.toFixed(2)} m`);
      if (showRate) readout(ctx, F, x0 + rw * 0.44, top, rw * 0.56, rh, 'FREQUENCY', `${read.hz.toFixed(1)} /s`);
    } else {
      readout(ctx, F, x0, top, showRate ? rw * 0.4 : rw, rh, 'WAVELENGTH', `${fmtSig(read.nm)} nm`);
      if (showRate) readout(ctx, F, x0 + rw * 0.42, top, rw * 0.58, rh, 'FREQUENCY', e14Text(read.e14));
    }
  } else {
    well(ctx, F.x(x0), F.y(top), F.len(rw), F.len(rh));
    say(ctx, 'NO LAMP IN THE HOLDER', F.x(x0 + rw / 2), F.y(top + rh / 2), F.size(2.6, 7), { align: 'center', color: DIM, maxW: F.len(rw - 2) });
  }
  // The wave and its ruler.
  const wy0 = top + rh + 2;
  const wy1 = h - 7;
  const mid = (wy0 + wy1) / 2;
  const amp = (wy1 - wy0) * 0.4;
  well(ctx, F.x(x0), F.y(wy0), F.len(rw), F.len(wy1 - wy0));
  const span = read?.kind === 'water' ? WATER_SPAN_M : TRACE_SPAN_NM;
  ctx.strokeStyle = RIM;
  ctx.beginPath();
  ctx.moveTo(F.x(x0), F.y(mid));
  ctx.lineTo(F.x(x0 + rw), F.y(mid));
  ctx.stroke();
  if (read) {
    const per = read.kind === 'water' ? read.metres : read.nm;
    const lenPx = (per / span) * F.len(rw);
    ctx.strokeStyle = read.kind === 'water' ? DUST : colourOf(read.nm);
    ctx.lineWidth = Math.max(1.5, F.sc * 0.5);
    ctx.beginPath();
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const px = (i / steps) * F.len(rw);
      const py = F.y(mid) - Math.cos((2 * Math.PI * px) / lenPx) * F.len(amp);
      if (i === 0) ctx.moveTo(F.x(x0) + px, py); else ctx.lineTo(F.x(x0) + px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }
  // The ruler under it: a tick every sixth of the span.
  const ry = wy1 + 2;
  ctx.strokeStyle = STEEL;
  ctx.beginPath();
  ctx.moveTo(F.x(x0), F.y(ry));
  ctx.lineTo(F.x(x0 + rw), F.y(ry));
  for (let i = 0; i <= 6; i++) {
    ctx.moveTo(F.x(x0 + (i / 6) * rw), F.y(ry));
    ctx.lineTo(F.x(x0 + (i / 6) * rw), F.y(ry + 1.4));
  }
  ctx.stroke();
  say(ctx, read?.kind === 'water' ? '4.8 m' : `${TRACE_SPAN_NM} nm`, F.x(x0 + rw), F.y(ry + 3.8), F.size(2.2, 6), { align: 'right', color: DIM });
}

function paintRuler(ctx, f, state, b) {
  const F = frameOf(b);
  const w = f.size.w;
  const h = f.size.h;
  const read = rulerRead(state, f.id);
  const x0 = f.props.left ?? 24;
  const rw = w - x0 - 3;
  const LO = -1;
  const HI = 10;
  const xOf = d => x0 + ((d - LO) / (HI - LO)) * rw;
  const y = h * 0.62;
  ctx.strokeStyle = STEEL;
  ctx.beginPath();
  ctx.moveTo(F.x(x0), F.y(y));
  ctx.lineTo(F.x(x0 + rw), F.y(y));
  for (let d = LO; d <= HI; d++) {
    ctx.moveTo(F.x(xOf(d)), F.y(y));
    ctx.lineTo(F.x(xOf(d)), F.y(y + 1.8));
  }
  ctx.stroke();
  const marks = [[-1, '0.1 nm'], [3, '1 um'], [6, '1 mm'], [9, '1 m']];
  for (const [d, label] of marks) say(ctx, label, F.x(xOf(d)), F.y(y + 5), F.size(2.2, 6), { align: 'center', color: DIM });
  // The slice of it the eye answers to.
  ctx.fillStyle = 'rgba(184, 175, 160, 0.16)';
  ctx.fillRect(F.x(xOf(Math.log10(VISIBLE.min))), F.y(y - 5), F.len(xOf(Math.log10(VISIBLE.max)) - xOf(Math.log10(VISIBLE.min))), F.len(10));
  say(ctx, 'EACH TICK TEN TIMES THE LAST', F.x(x0 + rw / 2), F.y(h - 3), F.size(2.1, 6), { align: 'center', color: DIM });
  if (read) {
    const x = xOf(Math.log10(read.nm));
    ctx.fillStyle = PHOS;
    ctx.fillRect(F.x(x) - 1.5, F.y(y - 12), 3, F.len(12));
    say(ctx, fmtLength(read.nm), F.x(Math.min(x0 + rw - 1, Math.max(x0 + 1, x))), F.y(y - 15), F.size(3.2, 8), {
      align: x > x0 + rw * 0.7 ? 'right' : x < x0 + rw * 0.3 ? 'left' : 'center', color: PHOS, weight: 700
    });
  } else {
    say(ctx, 'NOTHING IN THE HOLDER', F.x(x0 + rw / 2), F.y(y - 9), F.size(2.6, 7), { align: 'center', color: DIM });
  }
}

function paintPulse(ctx, f, state, b) {
  const F = frameOf(b);
  const marks = marksOf(f);
  const lineY = f.props.lineY ?? 12;
  const lastDx = marks.length ? marks[marks.length - 1].dx : f.size.w - 24;
  // The lamp at the near end and the rail the pulse runs down.
  ctx.fillStyle = INK;
  ctx.fillRect(F.x(2), F.y(lineY - 4), F.len(8), F.len(8));
  ctx.strokeStyle = DUST;
  ctx.strokeRect(F.x(2) + 0.5, F.y(lineY - 4) + 0.5, F.len(8) - 1, F.len(8) - 1);
  say(ctx, 'LAMP', F.x(6), F.y(lineY + 7), F.size(2.2, 6), { align: 'center', color: DIM });
  ctx.strokeStyle = STEEL;
  ctx.beginPath();
  ctx.moveTo(F.x(10), F.y(lineY));
  ctx.lineTo(F.x(lastDx + 8), F.y(lineY));
  for (const m of marks) {
    ctx.moveTo(F.x(m.dx), F.y(lineY - 1.6));
    ctx.lineTo(F.x(m.dx), F.y(lineY + 1.6));
  }
  ctx.stroke();
  // The bracket between the detectors standing on it, and what the timer last read.
  const d = detectorsOn(state, f.id);
  if (d.length >= 2) {
    const xa = marks.find(m => m.slot === d[0].slot);
    const xb = marks.find(m => m.slot === d[d.length - 1].slot);
    if (xa && xb) {
      const ax = F.x(xa.dx);
      const bx = F.x(xb.dx);
      const by = F.y(lineY - 4.5);
      ctx.strokeStyle = AMBER;
      ctx.beginPath();
      ctx.moveTo(ax, by);
      ctx.lineTo(bx, by);
      ctx.moveTo(ax, by - 3);
      ctx.lineTo(ax, by + 3);
      ctx.moveTo(bx, by - 3);
      ctx.lineTo(bx, by + 3);
      ctx.stroke();
    }
  }
  const was = timedLast(state, f.id);
  const now = pulseRead(state, f.id);
  const rx = lastDx + 12;
  const rw = f.size.w - rx - 2;
  if (rw > 8) {
    readout(ctx, F, rx, 3, rw, 9, 'GAP', now ? `${now.gap.toFixed(1)} m` : '-- m');
    readout(ctx, F, rx, 13, rw, 9, 'PULSE TIME', was ? `${was.ns.toFixed(1)} ns` : '-- ns', { color: was ? AMBER : DIM });
  }
}

function paintBand(ctx, f, state, b) {
  const F = frameOf(b);
  const w = f.size.w;
  const read = bandRead(state, f.id);
  const bx = 14;
  const bw = w - bx - 14;
  const by = 6;
  const bh = 9;
  const xOf = nm => bx + ((nm - PRISM_RANGE.lo) / (PRISM_RANGE.hi - PRISM_RANGE.lo)) * bw;
  // The band.
  ctx.fillStyle = '#080706';
  ctx.fillRect(F.x(bx), F.y(by), F.len(bw), F.len(bh));
  const plan = read.plan;
  if (plan?.continuous) {
    const cols = Math.max(24, Math.round(F.len(bw) / 1.5));
    for (let i = 0; i < cols; i++) {
      const nm = PRISM_RANGE.lo + (i / cols) * (PRISM_RANGE.hi - PRISM_RANGE.lo);
      const rgb = wavelengthRgb(nm);
      if (!rgb) continue;
      ctx.fillStyle = rgbCss(rgb);
      ctx.fillRect(F.x(bx) + (i / cols) * F.len(bw), F.y(by), F.len(bw) / cols + 0.6, F.len(bh));
    }
    for (const nm of plan.dark) {
      ctx.fillStyle = '#080706';
      ctx.fillRect(F.x(xOf(nm)) - 1.5, F.y(by), 3, F.len(bh));
    }
  } else if (plan) {
    for (const nm of plan.bright) {
      ctx.fillStyle = colourOf(nm);
      ctx.fillRect(F.x(xOf(nm)) - 1.5, F.y(by), 3, F.len(bh));
    }
  } else {
    say(ctx, 'NOTHING IN THE SOCKET', F.x(bx + bw / 2), F.y(by + bh / 2), F.size(2.6, 7), { align: 'center', color: DIM });
  }
  ctx.strokeStyle = RIM;
  ctx.strokeRect(F.x(bx) + 0.5, F.y(by) + 0.5, F.len(bw) - 1, F.len(bh) - 1);
  // The scale in nm.
  ctx.strokeStyle = STEEL;
  ctx.beginPath();
  for (let nm = 400; nm <= 700; nm += 50) {
    ctx.moveTo(F.x(xOf(nm)), F.y(by + bh));
    ctx.lineTo(F.x(xOf(nm)), F.y(by + bh + (nm % 100 === 0 ? 2 : 1.2)));
  }
  ctx.stroke();
  for (const nm of [400, 500, 600, 700]) say(ctx, String(nm), F.x(xOf(nm)), F.y(by + bh + 4.4), F.size(2.2, 6), { align: 'center', color: DIM });
  say(ctx, 'nm', F.x(bx + bw + 1), F.y(by + bh + 4.4), F.size(2.2, 6), { align: 'left', color: DIM });
  for (const c of f.props.captions || []) say(ctx, c.text, F.x(c.dx), F.y(c.dy), F.size(2.2, 6), { align: 'center', color: DIM });
  // The detector strips past each end of the band (a stage that reads what the eye cannot).
  if (f.props.detectors) {
    const dw = 10;
    const strip = (x, label, lit) => {
      ctx.fillStyle = lit ? PHOS : '#17150f';
      ctx.fillRect(F.x(x), F.y(by), F.len(dw), F.len(bh));
      ctx.strokeStyle = RIM;
      ctx.strokeRect(F.x(x) + 0.5, F.y(by) + 0.5, F.len(dw) - 1, F.len(bh) - 1);
      say(ctx, label, F.x(x + dw / 2), F.y(by - 3), F.size(2.4, 7), { align: 'center', color: lit ? PHOS : DIM, weight: 700 });
    };
    strip(bx - dw - 1.2, 'UV', read.uv);
    strip(bx + bw + 1.2, 'IR', read.ir);
  }
  // The reference strip's lines, laid under the band, and the ones that fall on a line of the band.
  if (f.props.ref) {
    const ry = by + bh + 7;
    ctx.fillStyle = 'rgba(217, 148, 35, 0.12)';
    ctx.fillRect(F.x(bx), F.y(ry), F.len(bw), F.len(5));
    ctx.strokeStyle = RIM;
    ctx.strokeRect(F.x(bx) + 0.5, F.y(ry) + 0.5, F.len(bw) - 1, F.len(5) - 1);
    for (const nm of read.refLines) {
      const hit = read.matched.includes(nm);
      ctx.strokeStyle = hit ? AMBER : STEEL;
      ctx.lineWidth = hit ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(F.x(xOf(nm)), F.y(ry));
      ctx.lineTo(F.x(xOf(nm)), F.y(ry + 5));
      if (hit) {
        ctx.moveTo(F.x(xOf(nm)), F.y(by));
        ctx.lineTo(F.x(xOf(nm)), F.y(by + bh + 7));
      }
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    say(ctx, read.ref ? `LINES ON THE STRIP THAT FALL ON THE BAND: ${read.matched.length} OF ${read.refLines.length}` : 'NO STRIP ALONGSIDE', F.x(bx), F.y(ry + 8.4), F.size(2.3, 6), { color: read.matched.length && read.whole ? AMBER : DIM, maxW: F.len(bw) });
  }
}

/** Where the cup's electrons stand, per hundred freed a second: a pile of dots that grows with the count. */
function paintCup(ctx, F, x, y, w, h, count) {
  ctx.strokeStyle = DUST;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(F.x(x), F.y(y));
  ctx.lineTo(F.x(x), F.y(y + h));
  ctx.lineTo(F.x(x + w), F.y(y + h));
  ctx.lineTo(F.x(x + w), F.y(y));
  ctx.stroke();
  ctx.lineWidth = 1;
  const cols = 5;
  const total = Math.min(25, Math.round(count / 4));
  ctx.fillStyle = DUST;
  for (let i = 0; i < total; i++) {
    const cx = x + 1.6 + (i % cols) * ((w - 3.2) / (cols - 1));
    const cy = y + h - 1.8 - Math.floor(i / cols) * 2.4;
    ctx.beginPath();
    ctx.arc(F.x(cx), F.y(cy), Math.max(1.2, F.sc * 0.55), 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintCellFixture(ctx, f, state, b) {
  const F = frameOf(b);
  const w = f.size.w;
  const h = f.size.h;
  const read = cellRead(state, f.id);
  const dials = Object.keys(f.dials).filter(n => !f.props.hidden?.includes(n)).length;
  const top = 6 + (f.props.rowPitch ?? 5) * Math.max(1, dials) + 4;
  const tubeY = f.props.tubeTop ?? top;
  const tubeH = f.props.tubeH ?? 15;
  const mh = f.props.meterH ?? 10;
  const tx0 = 20;
  const tx1 = w - 24;
  const mid = tubeY + tubeH / 2;
  // The lamp's beam, from the left, as wide as the brightness and as coloured as the wavelength.
  well(ctx, F.x(tx0), F.y(tubeY), F.len(tx1 - tx0), F.len(tubeH), { stroke: STEEL });
  say(ctx, read.nm != null ? `LAMP ${fmtSig(read.nm)} nm` : 'LAMP OFF', F.x(2), F.y(tubeY - 2.4), F.size(2.3, 6), { color: read.nm != null ? colourOf(read.nm) : DIM, weight: 700 });
  if (read.nm != null) {
    ctx.fillStyle = rgbCss(wavelengthRgb(read.nm) || [184, 175, 160], 0.45 + read.brightness * 0.1);
    const bt = 0.8 + read.brightness * 0.7;
    const from = f.props.lamp ? 22 : 2;
    ctx.fillRect(F.x(from), F.y(mid - bt / 2), F.len(tx0 + 6 - from), F.len(bt));
  }
  // The collector at the far end, and the electrons crossing the tube from the plate to it.
  ctx.fillStyle = '#2d2924';
  ctx.fillRect(F.x(tx1 - 4), F.y(tubeY + 2), F.len(2.4), F.len(tubeH - 4));
  if (read.freed) {
    const n = Math.max(1, Math.round(read.count / 20));
    for (let i = 0; i < n * 2; i++) {
      const lane = tubeY + 2.5 + ((i * 5) % (tubeH - 5));
      const px = tx0 + 14 + ((i * 7.3) % (tx1 - tx0 - 20));
      ctx.fillStyle = DUST;
      ctx.beginPath();
      ctx.arc(F.x(px), F.y(lane), Math.max(1.2, F.sc * 0.55), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // The counting cup the collector empties into.
  paintCup(ctx, F, tx1 + 4, tubeY + 1, 11, tubeH - 1, read.count);
  say(ctx, 'CUP', F.x(tx1 + 9.5), F.y(tubeY - 2.2), F.size(2.2, 6), { align: 'center', color: DIM });
  // The two meters.
  const my = tubeY + tubeH + 3;
  const mw = (w - 6 - (f.noRun ? 0 : 18)) / 2;
  readout(ctx, F, 3, my, mw - 1, mh, 'FREED PER SECOND', String(read.count), { color: read.count ? PHOS : DIM });
  readout(ctx, F, 3 + mw + 1, my, mw - 1, mh, 'FASTEST ELECTRON', read.freed ? `${read.speed.toFixed(1)} x 10^5 m/s` : '0.0 x 10^5 m/s', { color: read.freed ? PHOS : DIM });
}

/** The rungs of the ladder, the open top, the move the electron last made and the jump a probe line asks for. */
function paintLadder(ctx, f, state, b) {
  const F = frameOf(b);
  const w = f.size.w;
  const read = ladderRead(state, f.id);
  const slots = f.props.rungs || {};
  const centre = n => {
    const s = state.zones.slots[slots[n]];
    return s ? s.at.y - f.at.y + f.size.h / 2 : null;
  };
  const sx = w / 2;
  const half = 14;
  const lit = new Set();
  const last = read.last;
  if (last && last.hi && last.lo) { lit.add(last.hi); lit.add(last.lo); }
  const probeJump = read.probe ? probeJumps(read.probe)[0] : null;
  if (probeJump) { lit.add(probeJump.hi); lit.add(probeJump.lo); }
  for (let n = 1; n <= 6; n++) {
    const y = centre(n);
    if (y == null) continue;
    const on = lit.has(n);
    ctx.strokeStyle = on ? AMBER : STEEL;
    ctx.lineWidth = on ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(F.x(sx - half), F.y(y));
    ctx.lineTo(F.x(sx + half), F.y(y));
    ctx.stroke();
    ctx.lineWidth = 1;
    say(ctx, `n = ${n}`, F.x(sx - half - 1.5), F.y(y), F.size(2.5, 6.5), { align: 'right', color: on ? AMBER : DIM });
    say(ctx, (bohrJoules(n) / 1e-18).toFixed(3), F.x(sx + half + 1.5), F.y(y), F.size(2.3, 6), { align: 'left', color: on ? AMBER : DIM });
  }
  // The open top: where the ladder ends.
  const ty = centre(TOP) ?? 9;
  ctx.setLineDash?.([4, 3]);
  ctx.strokeStyle = DIM;
  ctx.beginPath();
  ctx.moveTo(F.x(sx - half), F.y(ty));
  ctx.lineTo(F.x(sx + half), F.y(ty));
  ctx.stroke();
  ctx.setLineDash?.([]);
  say(ctx, f.props.topLabel || 'top', F.x(sx - half - 1.5), F.y(ty), F.size(2.5, 6.5), { align: 'right', color: DIM });
  say(ctx, '0', F.x(sx + half + 1.5), F.y(ty), F.size(2.3, 6), { align: 'left', color: DIM });
  say(ctx, '10^-18 J, NOT TO SCALE', F.x(w - 1.5), F.y(3.6), F.size(2.1, 6), { align: 'right', color: DIM });
  // The move the electron last made, as an arrow between its two rungs.
  const arrow = (hi, lo, up) => {
    const ya = centre(hi);
    const yb = centre(lo);
    if (ya == null || yb == null) return;
    const ax = F.x(sx + half - 3);
    ctx.strokeStyle = AMBER;
    ctx.fillStyle = AMBER;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ax, F.y(up ? yb : ya));
    ctx.lineTo(ax, F.y(up ? ya : yb) + (up ? 4 : -4));
    ctx.stroke();
    const tip = F.y(up ? ya : yb);
    const d = up ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(ax, tip);
    ctx.lineTo(ax - 3, tip + d * -4.5);
    ctx.lineTo(ax + 3, tip + d * -4.5);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1;
  };
  if (last && last.hi && last.lo) arrow(last.hi, last.lo, last.up);
  else if (probeJump) arrow(probeJump.hi, probeJump.lo, false);
}

/** The lines the ladder has made, laid on the band's scale and written out in nm; and the answer to a line put in the probe. */
function paintLines(ctx, f, state, b) {
  const F = frameOf(b);
  const w = f.size.w;
  const h = f.size.h;
  const lad = state.fixtures[f.props.ladder];
  const read = ladderRead(state, lad.id);
  const bx = 3;
  const bw = w - 6;
  const by = 7;
  const bh = 7;
  const xOf = nm => bx + ((nm - PRISM_RANGE.lo) / (PRISM_RANGE.hi - PRISM_RANGE.lo)) * bw;
  ctx.fillStyle = '#080706';
  ctx.fillRect(F.x(bx), F.y(by), F.len(bw), F.len(bh));
  ctx.strokeStyle = RIM;
  ctx.strokeRect(F.x(bx) + 0.5, F.y(by) + 0.5, F.len(bw) - 1, F.len(bh) - 1);
  for (const nm of read.lines.filter(isVisible)) {
    ctx.fillStyle = colourOf(nm);
    ctx.fillRect(F.x(xOf(nm)) - 1.5, F.y(by), 3, F.len(bh));
  }
  ctx.strokeStyle = STEEL;
  ctx.beginPath();
  for (let nm = 400; nm <= 700; nm += 100) {
    ctx.moveTo(F.x(xOf(nm)), F.y(by + bh));
    ctx.lineTo(F.x(xOf(nm)), F.y(by + bh + 1.4));
  }
  ctx.stroke();
  for (let nm = 400; nm <= 700; nm += 100) say(ctx, String(nm), F.x(xOf(nm)), F.y(by + bh + 3.8), F.size(2.1, 6), { align: 'center', color: DIM });
  let line = lad.props.probe ? 'PUT A LINE IN THE PROBE SLOT' : 'NO LINE MADE YET';
  let color = DIM;
  const probe = read.probe;
  if (probe) {
    const js = probeJumps(probe);
    line = js.length ? `A DROP FROM RUNG ${js[0].hi} TO RUNG ${js[0].lo} MAKES IT` : 'NO PAIR OF RUNGS MAKES THIS LINE';
    color = js.length ? AMBER : DUST;
  } else if (read.last && read.last.nm != null) {
    const l = read.last;
    line = l.up ? `CLIMB TO RUNG ${l.hi}: GIVES OUT NOTHING` : `LAST DROP GAVE OUT ${fmtSig(l.nm)} nm`;
    color = l.up ? DIM : AMBER;
  } else if (read.last && read.last.to === 'top') {
    line = 'CLIMBED PAST THE TOP RUNG';
    color = AMBER;
  }
  say(ctx, line, F.x(bx), F.y(by + bh + 8), F.size(2.3, 6.5), { color, maxW: F.len(bw), weight: 700 });
  if (f.props.list !== false) {
    const nms = read.lines.filter(n => n < 2000).map(n => `${fmtSig(n)} nm`).join('  ');
    say(ctx, nms || '', F.x(bx), F.y(h - 3.4), F.size(2.2, 6), { color: PHOS, maxW: F.len(bw) });
  }
}

function paintPlaque(ctx, f, state, b) {
  const F = frameOf(b);
  const lines = f.props.lines || [];
  const step = Math.min(5.2, (f.size.h - 9) / Math.max(1, lines.length));
  lines.forEach((t, i) => say(ctx, t, F.x(2.4), F.y(9 + i * step), F.size(Math.min(2.5, step * 0.5), 6.5), { color: DUST, maxW: F.len(f.size.w - 4.4) }));
}

function paintFixture(ctx, f, state, b) {
  switch (f.kind) {
    case 'wave': paintWave(ctx, f, state, b); return true;
    case 'ruler': paintRuler(ctx, f, state, b); return true;
    case 'pulse': paintPulse(ctx, f, state, b); return true;
    case 'band': paintBand(ctx, f, state, b); return true;
    case 'cell': paintCellFixture(ctx, f, state, b); return true;
    case 'ladder': paintLadder(ctx, f, state, b); return true;
    case 'lines': paintLines(ctx, f, state, b); return true;
    case 'plaque': paintPlaque(ctx, f, state, b); return true;
    default: return false;
  }
}

export { paintPiece, faceKey, paintFixture, seated, METALS };
