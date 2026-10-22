/**
 * kits/cuvette-draw.js — What the cuvette kit's pieces and fixtures look like.
 *
 * The drawn tabletop (`engine/table2d.js` `drawTable`) and the built one (`engine/table3d.js`) call THESE functions with the same arguments, so a
 * cuvette, a colour chip and the spectrometer are one picture in both views. Every figure printed is read from `cuvette-read.js`, which asks
 * `lightdata.js`; a painter decides nothing.
 *
 * SCOURED PLATE: dust and phosphor on a recessed plate, hairline rims, nothing blooms. A solution's colour is a tint on a tube, never a glow.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import {
  spectroRead, regionRead, wavelengthRgb, concOf, colourOfNm, gotThrough, VISIBLE, fmtWave, markerRead, planAbsorb, SOLUTES, seatedIn
} from './cuvette-read.js';

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const RIM = PLATE_COLORS.rim;

function say(ctx, text, x, y, size, o = {}) {
  ctx.font = `${o.weight || 500} ${Math.max(6, size)}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  if (o.maxW) ctx.fillText(text, x, y, o.maxW); else ctx.fillText(text, x, y);
}

export const RECTS = Object.freeze({
  cuvette: { hw: 9, hh: 10 },
  chip: { hw: 8, hh: 6 },
  motion: { hw: 17, hh: 5.5 },
  reading: { hw: 12, hh: 6.5 },
  tool: { hw: 8, hh: 5.2 }
});

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

/** The tint of a solution: more of it, a deeper colour. Lake water is clear. */
function tintOf(piece) {
  const conc = concOf(piece);
  const a = Math.min(0.85, conc / 0.012);
  return `rgba(60, 120, 170, ${a.toFixed(2)})`;
}

function paintCuvette(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.cuvette);
  say(ctx, p.label, o.x, box.y0 + 1.9 * o.sc, Math.max(6.5, 1.9 * o.sc), { align: 'center', weight: 700, maxW: box.w - 2 });
  const tw = 7 * o.sc;
  const th = 10.4 * o.sc;
  const tx = o.x - tw / 2;
  const ty = box.y0 + 4 * o.sc;
  ctx.fillStyle = '#16140f';
  ctx.fillRect(tx, ty, tw, th);
  const level = p.props.sealed ? 0.8 : Math.min(1, (p.props.drops || 0) / 6);
  if (concOf(p) > 0 || p.props.blank) {
    const lv = p.props.blank ? 0.8 : (p.props.conc != null ? 0.8 : level);
    ctx.fillStyle = tintOf(p);
    ctx.fillRect(tx + 1, ty + th * (1 - lv), tw - 2, th * lv);
    if (p.props.blank) { ctx.strokeStyle = STEEL; ctx.strokeRect(tx + 1.5, ty + th * 0.2 + 0.5, tw - 3, th * 0.8 - 2); }
  }
  ctx.strokeStyle = DUST;
  ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
  if (!p.props.sealed && p.props.conc == null) say(ctx, `${p.props.drops || 0} DROPS`, o.x, box.y0 + box.h - 1.6 * o.sc, Math.max(6, 1.7 * o.sc), { align: 'center', color: DUST, maxW: box.w - 2 });
  else if (p.props.read != null) say(ctx, p.props.read.toFixed(3), o.x, box.y0 + box.h - 1.6 * o.sc, Math.max(6, 1.7 * o.sc), { align: 'center', color: PHOS, weight: 700, maxW: box.w - 2 });
}

function paintChip(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.chip);
  const rgb = wavelengthRgb(p.props.nm);
  ctx.fillStyle = rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : DIM;
  ctx.fillRect(box.x0 + 3, box.y0 + 3, box.w - 6, box.h * 0.4);
  say(ctx, p.label, o.x, box.y0 + box.h * 0.78, Math.max(7, 1.9 * o.sc), { align: 'center', weight: 700, maxW: box.w - 2 });
}

function paintMotion(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.motion);
  say(ctx, p.label, o.x, o.y, Math.max(7, 2.1 * o.sc), { align: 'center', weight: 700, maxW: box.w - 3 });
}

function paintReading(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.reading);
  say(ctx, p.label, o.x, box.y0 + 2.3 * o.sc, Math.max(6.5, 1.9 * o.sc), { align: 'center', weight: 700, maxW: box.w - 2 });
  say(ctx, fmtWave(p.props.nm), o.x, box.y0 + box.h * 0.66, Math.max(8, 2.8 * o.sc), { align: 'center', color: PHOS, weight: 700, maxW: box.w - 3 });
}

function paintTool(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.tool, '#1d1a16');
  say(ctx, p.label, o.x, o.y, Math.max(7, 2 * o.sc), { align: 'center', weight: 700, maxW: box.w - 3 });
}

/** What the built table needs of a cuvette: how full its column is and how deeply it is tinted (an rgb triple and a 0 to 1 depth). */
export function cuvetteLook(p) {
  const conc = concOf(p);
  const level = p.props.sealed || p.props.blank || p.props.conc != null ? 0.8 : Math.min(1, (p.props.drops || 0) / 6);
  const depth = Math.min(0.85, conc / 0.012);
  return { level: conc > 0 || p.props.blank ? level : 0, tint: conc > 0 ? { rgb: [60, 120, 170], depth } : null };
}

/** The words on a cuvette's foot: its name over its drops or its reading, painted on a flat legend of `W` x `H` pixels. */
export function paintLegend(ctx, p, W, H) {
  say(ctx, p.label, W / 2, H * 0.32, H * 0.38, { align: 'center', weight: 700, maxW: W - 8 });
  if (!p.props.sealed && p.props.conc == null) say(ctx, `${p.props.drops || 0} DROPS`, W / 2, H * 0.74, H * 0.3, { align: 'center', color: DUST, maxW: W - 8 });
  else if (p.props.read != null) say(ctx, p.props.read.toFixed(3), W / 2, H * 0.74, H * 0.3, { align: 'center', color: PHOS, weight: 700, maxW: W - 8 });
}

const PAINTERS = { cuvette: paintCuvette, chip: paintChip, motion: paintMotion, reading: paintReading, dropper: paintTool, rinse: paintTool };

export function paintPiece(ctx, p, state, o) {
  const fn = PAINTERS[p.kind];
  if (!fn) return false;
  fn(ctx, p, state, o);
  return true;
}

export function faceKey(p) {
  return `${p.label}|${p.props.drops || 0}|${p.props.read ?? ''}`;
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

/** The molecule of the light dial: a diatomic, turning, stretching or with an electron moved up a level. */
function paintMolecule(ctx, f, state, b) {
  const F = frameOf(b);
  const r = regionRead(state, f.id);
  const cx = F.x(f.size.w * 0.62);
  const cy = F.y(f.size.h * 0.62);
  const R = F.len(2.6);
  const open = (x, y, rr, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = DUST; ctx.stroke(); };
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1;
  if (r.motion === 'spins') {
    // The whole molecule turns end over end: a tilted pair and an arrow round it.
    const a = -0.6, d = F.len(4.6);
    ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * d, cy - Math.sin(a) * d); ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); ctx.stroke();
    open(cx - Math.cos(a) * d, cy - Math.sin(a) * d, R, '#3a352e');
    open(cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * 1.25, '#2a2620');
    ctx.strokeStyle = AMBER;
    ctx.beginPath(); ctx.arc(cx, cy, d * 1.5, -2.4, 0.6); ctx.stroke();
  } else if (r.motion === 'vibrates') {
    // The bond stretches and shortens: two marks showing how far each atom goes.
    const d = F.len(4.6);
    ctx.beginPath(); ctx.moveTo(cx - d, cy); ctx.lineTo(cx + d, cy); ctx.stroke();
    open(cx - d, cy, R, '#3a352e');
    open(cx + d, cy, R * 1.25, '#2a2620');
    ctx.strokeStyle = AMBER;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * (d + R * 1.9), cy); ctx.lineTo(cx + s * (d + R * 3), cy); ctx.stroke(); }
  } else {
    // An electron moves up a level: two levels and one electron on the upper.
    const d = F.len(4.6);
    ctx.beginPath(); ctx.moveTo(cx - d, cy); ctx.lineTo(cx + d, cy); ctx.stroke();
    open(cx - d, cy + R * 0.2, R, '#3a352e');
    open(cx + d, cy + R * 0.2, R * 1.25, '#2a2620');
    ctx.strokeStyle = DIM;
    ctx.beginPath(); ctx.arc(cx + d, cy + R * 0.2, R * 2.1, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = AMBER;
    ctx.beginPath(); ctx.arc(cx + d, cy + R * 0.2, R * 3.4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = PHOS;
    ctx.beginPath(); ctx.arc(cx + d + R * 3.4, cy + R * 0.2, Math.max(1.6, R * 0.35), 0, Math.PI * 2); ctx.fill();
  }
  say(ctx, f.props.molecule || 'HCl', F.x(f.size.w * 0.62), F.y(f.size.h - 2.6), F.size(2.4, 6), { align: 'center', color: DIM });
}

/** The light that gets through the cuvette in the holder, 380 to 750 nm: white light with its missing colour dark. */
function paintStrip(ctx, f, state, b) {
  const F = frameOf(b);
  const piece = seatedIn(state, f.props.slot);
  const x0 = F.x(2.5);
  const w = F.len(f.size.w - 5);
  const y0 = F.y(f.size.h - 11.5);
  const h = F.len(5);
  const solute = piece?.props.solute || 'cuso4';
  const conc = piece ? concOf(piece) : 0;
  const steps = 74;
  for (let i = 0; i < steps; i++) {
    const nm = VISIBLE.min + (i + 0.5) * (VISIBLE.max - VISIBLE.min) / steps;
    const rgb = wavelengthRgb(nm);
    const k = piece ? gotThrough(solute, conc, nm) : 1;
    ctx.fillStyle = `rgb(${Math.round(rgb[0] * k)}, ${Math.round(rgb[1] * k)}, ${Math.round(rgb[2] * k)})`;
    ctx.fillRect(x0 + (i / steps) * w, y0, w / steps + 1, h);
  }
  ctx.strokeStyle = RIM;
  ctx.strokeRect(Math.round(x0) + 0.5, Math.round(y0) + 0.5, Math.round(w), Math.round(h));
  say(ctx, piece ? 'LIGHT THAT GETS THROUGH' : 'NO CUVETTE IN THE BEAM', x0, y0 - F.len(1.9), F.size(2.4, 6), { color: piece ? DUST : DIM });
}

function paintSpectro(ctx, f, state, b) {
  const F = frameOf(b);
  if (f.props.molecule && f.dials.region) { paintMolecule(ctx, f, state, b); return; }
  if (f.props.strip) { paintStrip(ctx, f, state, b); return; }
  const r = spectroRead(state, f.id);
  const x = 23;
  const top = f.props.readAt ?? 24;
  if (!r.piece) { say(ctx, 'NO CUVETTE IN THE BEAM', F.x(x), F.y(top), F.size(2.6, 7), { color: DIM, maxW: F.len(f.size.w - x - 2) }); return; }
  say(ctx, `${f.props.word || 'DIMMING'} ${r.A.toFixed(3)}`, F.x(x), F.y(top), F.size(3, 8), { color: PHOS, weight: 700, maxW: F.len(f.size.w - x - 2) });
  say(ctx, `${r.nm} nm, ${r.path} cm`, F.x(x), F.y(top + 4), F.size(2.5, 7), { color: DUST, maxW: F.len(f.size.w - x - 2) });
  // How much of the beam is left, as a bar.
  const left = Math.pow(10, -r.A);
  const bw = f.size.w - x - 2;
  ctx.strokeStyle = RIM;
  ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(top + 6.6)) + 0.5, Math.round(F.len(bw)), Math.round(F.len(1.8)));
  ctx.fillStyle = AMBER;
  ctx.fillRect(F.x(x) + 1, F.y(top + 6.6) + 1, Math.max(0, F.len(bw) * left - 1), Math.max(1, F.len(1.8) - 2));
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
  if (f.kind === 'spectro') paintSpectro(ctx, f, state, b);
  else if (f.kind === 'plaque') paintPlaque(ctx, f, state, b);
  else if (f.kind === 'marker') paintMarker(ctx, f, state, b);
}

export { colourOfNm, planAbsorb, SOLUTES };
