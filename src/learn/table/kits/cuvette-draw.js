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

/** The tint of a solution: concentration sets color depth. Solvent is clear water. */
function tintOf(piece) {
  const conc = concOf(piece);
  if (conc <= 0 && !piece.props.blank) return 'rgba(210, 235, 250, 0.14)';
  const a = Math.min(0.88, 0.22 + (conc / 0.012) * 0.66);
  return `rgba(38, 140, 220, ${a.toFixed(2)})`;
}

function paintCuvette(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.cuvette);
  say(ctx, p.label, o.x, box.y0 + 1.9 * o.sc, Math.max(6.5, 1.9 * o.sc), { align: 'center', weight: 700, maxW: box.w - 2 });

  // Authentic cuvette proportions in 2D: slender column (aspect ratio ~2.2:1), clear optical walls, open top, thick glass floor.
  const cw = 5.2 * o.sc;
  const ch = 11.6 * o.sc;
  const tx = o.x - cw / 2;
  const ty = box.y0 + 3.4 * o.sc;
  const floorH = 1.6 * o.sc;

  // Hollow chamber background
  ctx.fillStyle = '#141718';
  ctx.fillRect(tx, ty, cw, ch);

  // Thick optical glass floor
  ctx.fillStyle = '#2a3336';
  ctx.fillRect(tx, ty + ch - floorH, cw, floorH);

  // In spectrophotometry, cuvettes are always filled to the standard optical mark (volume does not determine absorbance).
  const liquidH = (ch - floorH - 1.2 * o.sc) * 0.82;
  const ly = ty + ch - floorH - liquidH;

  // Liquid fill (color intensity represents solute concentration)
  ctx.fillStyle = tintOf(p);
  ctx.beginPath();
  ctx.moveTo(tx + 1, ly);
  ctx.quadraticCurveTo(o.x, ly + 1.0 * o.sc, tx + cw - 1, ly);
  ctx.lineTo(tx + cw - 1, ty + ch - floorH);
  ctx.lineTo(tx + 1, ty + ch - floorH);
  ctx.closePath();
  ctx.fill();

  // Meniscus surface tension highlight
  ctx.strokeStyle = concOf(p) > 0 ? 'rgba(180, 225, 255, 0.65)' : 'rgba(200, 220, 235, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx + 1, ly);
  ctx.quadraticCurveTo(o.x, ly + 1.0 * o.sc, tx + cw - 1, ly);
  ctx.stroke();

  // Clear optical walls (Left and Right) and open top U-frame
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx + 0.5, ty);
  ctx.lineTo(tx + 0.5, ty + ch);
  ctx.lineTo(tx + cw - 0.5, ty + ch);
  ctx.lineTo(tx + cw - 0.5, ty);
  ctx.stroke();

  // Open top lip ticks
  ctx.beginPath();
  ctx.moveTo(tx - 0.8 * o.sc, ty + 0.5);
  ctx.lineTo(tx + 1.2 * o.sc, ty + 0.5);
  ctx.moveTo(tx + cw - 1.2 * o.sc, ty + 0.5);
  ctx.lineTo(tx + cw + 0.8 * o.sc, ty + 0.5);
  ctx.stroke();

  // Etched optical path orientation mark "▽" near top
  ctx.fillStyle = '#e4edea';
  ctx.beginPath();
  ctx.moveTo(o.x - 1.2 * o.sc, ty + 1.2 * o.sc);
  ctx.lineTo(o.x + 1.2 * o.sc, ty + 1.2 * o.sc);
  ctx.lineTo(o.x, ty + 2.5 * o.sc);
  ctx.closePath();
  ctx.fill();

  // Solute concentration display on cuvette base (or absorbance for measured unknown)
  const c = concOf(p);
  const text = p.props.sealed
    ? (p.props.read != null ? `A = ${p.props.read.toFixed(3)}` : 'UNKNOWN')
    : `${(c * 1000).toFixed(1)} mmol/L`;
  const col = p.props.sealed && p.props.read != null ? PHOS : (c > 0 ? AMBER : DUST);
  say(ctx, text, o.x, box.y0 + box.h - 1.6 * o.sc, Math.max(6, 1.7 * o.sc), { align: 'center', color: col, weight: 600, maxW: box.w - 2 });
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

/** What the built table needs of a cuvette: full optical column height, and tint depth scaling with concentration. */
export function cuvetteLook(p) {
  const conc = concOf(p);
  const depth = Math.min(0.88, 0.2 + (conc / 0.012) * 0.7);
  return { level: 0.82, tint: conc > 0 ? { rgb: [38, 140, 220], depth } : { rgb: [210, 235, 250], depth: 0.06 } };
}

/** The words on a cuvette's foot: its name over its concentration (or absorbance once read). */
export function paintLegend(ctx, p, W, H) {
  say(ctx, p.label, W / 2, H * 0.32, H * 0.38, { align: 'center', weight: 700, maxW: W - 8 });
  const c = concOf(p);
  const text = p.props.sealed
    ? (p.props.read != null ? `A = ${p.props.read.toFixed(3)}` : 'UNKNOWN')
    : `${(c * 1000).toFixed(1)} mmol/L`;
  const col = p.props.sealed && p.props.read != null ? PHOS : (c > 0 ? AMBER : DUST);
  say(ctx, text, W / 2, H * 0.74, H * 0.3, { align: 'center', color: col, weight: 600, maxW: W - 8 });
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
  const x0 = F.x(24);
  const w = F.len(f.size.w - 26);
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
  say(ctx, piece ? 'LIGHT THAT GETS THROUGH' : 'NO CUVETTE IN THE BEAM', x0, y0 - F.len(1.9), F.size(2.4, 6), { color: piece ? DUST : DIM, maxW: w });
}

function paintSpectro(ctx, f, state, b) {
  const F = frameOf(b);
  if (f.props.molecule && f.dials.region) { paintMolecule(ctx, f, state, b); return; }
  if (f.props.strip) { paintStrip(ctx, f, state, b); return; }
  const r = spectroRead(state, f.id);

  // Optical compartment (Left: x = 1 to 24)
  const optX0 = F.x(1.5);
  const optY0 = F.y(4.5);
  const optW = F.len(23);
  const optH = F.len(f.size.h - 6);

  ctx.fillStyle = '#111415';
  ctx.fillRect(optX0, optY0, optW, optH);
  ctx.strokeStyle = '#1f2527';
  ctx.strokeRect(Math.round(optX0) + 0.5, Math.round(optY0) + 0.5, Math.round(optW), Math.round(optH));

  say(ctx, 'SOURCE', F.x(2.5), F.y(7.5), F.size(1.8, 6), { color: DUST, weight: 600 });
  say(ctx, 'SENSOR', F.x(23.5), F.y(7.5), F.size(1.8, 6), { align: 'right', color: DUST, weight: 600 });

  // Light beam guide in optical compartment
  const beamY = F.y(f.size.h - 14.7);
  ctx.strokeStyle = 'rgba(251, 146, 60, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(F.x(3.5), beamY);
  ctx.lineTo(F.x(22.5), beamY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Digital Display Panel (Right: x = 26 to 72, y = 4.5 to 26)
  const sx = 26;
  const sy = 4.5;
  const sw = f.size.w - sx - 2.5;
  const sh = 21.5;

  const scrX = F.x(sx);
  const scrY = F.y(sy);
  const scrW = F.len(sw);
  const scrH = F.len(sh);

  ctx.fillStyle = '#080c0e';
  ctx.fillRect(scrX, scrY, scrW, scrH);
  ctx.strokeStyle = '#1e282c';
  ctx.strokeRect(Math.round(scrX) + 0.5, Math.round(scrY) + 0.5, Math.round(scrW), Math.round(scrH));

  // Screen header
  say(ctx, 'SPECTROPHOTOMETER', F.x(sx + 2), F.y(sy + 3.0), F.size(2.0, 6), { color: DUST, weight: 600 });

  if (!r.piece) {
    say(ctx, 'CELL EMPTY', F.x(sx + 2), F.y(sy + 9.5), F.size(3.0, 8), { color: DIM, weight: 700 });
    say(ctx, `Wavelength ${r.nm} nm  |  Path 1.0 cm`, F.x(sx + 2), F.y(sy + 14.5), F.size(2.0, 6.5), { color: DUST });
    say(ctx, 'Slide cuvette into beam to read', F.x(sx + 2), F.y(sy + 18.0), F.size(1.8, 6), { color: '#4d483f' });
    return;
  }

  // Active reading
  say(ctx, `${f.props.word || 'ABSORBANCE'}  ${r.A.toFixed(3)}`, F.x(sx + 2), F.y(sy + 9.5), F.size(3.4, 9.5), { color: PHOS, weight: 700 });
  const left = Math.pow(10, -r.A);
  const tPct = (left * 100).toFixed(1);
  say(ctx, `T = ${tPct}%  |  ${r.nm} nm  |  ${r.path} cm`, F.x(sx + 2), F.y(sy + 14.2), F.size(2.1, 7), { color: DUST });

  // Transmittance bar
  const barX = F.x(sx + 2);
  const barY = F.y(sy + 17.2);
  const barW = F.len(sw - 4);
  const barH = F.len(2.0);
  ctx.strokeStyle = '#223035';
  ctx.strokeRect(Math.round(barX) + 0.5, Math.round(barY) + 0.5, Math.round(barW), Math.round(barH));
  ctx.fillStyle = AMBER;
  ctx.fillRect(barX + 1, barY + 1, Math.max(0, barW * left - 1), Math.max(1, barH - 2));
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
