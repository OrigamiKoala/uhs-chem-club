/**
 * kits/matter-draw.js — What the matter kit's pieces and fixtures look like (Mirrowen).
 *
 * The drawn tabletop (`engine/table2d.js`) and the built one (`engine/table3d.js`) call THESE functions with the same arguments. Every
 * figure printed is read from `matter-read.js`, which asks `matterdata.js`; a painter decides nothing. A kind this file does not draw
 * is the heat kit's (`heat-draw.js`), which the matter kit extends.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { paintPiece as heatPiece, paintFixture as heatFixture, faceKey as heatFaceKey, RECTS as HEAT_RECTS, contentTop } from './heat-draw.js';
import { probeRead } from './matter-read.js';
import { fixtureHandler, pieceDef } from './matter-registry.js';
import { glyphOf, inkOf, cloudRadius, fmtKJ, markOf } from './matter-parts.js';
import { SUBSTANCES } from '../../engine/matterdata.js';

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;

export function say(ctx, text, x, y, size, o = {}) {
  ctx.font = `${o.weight || 500} ${Math.max(6, size)}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  if (o.maxW) ctx.fillText(text, x, y, o.maxW); else ctx.fillText(text, x, y);
}

export const RECTS = Object.freeze({ ...HEAT_RECTS, mol: { hw: 10.2, hh: 9.5 } });

export function slab(ctx, o, { hw, hh }, tone = '#2a2620') {
  const x0 = o.x - hw * o.sc; const y0 = o.y - hh * o.sc; const w = hw * 2 * o.sc; const h = hh * 2 * o.sc;
  ctx.fillStyle = tone; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : DUST; ctx.lineWidth = o.lit ? 2 : 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  return { x0, y0, w, h };
}

/** A molecule's atoms as discs and rods inside a box centred on (cx, cy), `unit` pixels to a bond. */
export function paintGlyph(ctx, id, cx, cy, unit, { alpha = 1, cloud = false, marks = false } = {}) {
  const g = glyphOf(id);
  ctx.globalAlpha = alpha;
  if (g.atoms.length === 1) {
    const r = (cloud ? cloudRadius(id) : 0.34) * unit;
    ctx.fillStyle = cloud ? 'rgba(184,175,160,0.22)' : inkOf(g.atoms[0][0]);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = cloud ? DUST : STEEL; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = inkOf(g.atoms[0][0]);
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(1.5, unit * 0.08), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.2, unit * 0.1);
  for (const [i, j] of g.bonds) {
    ctx.beginPath(); ctx.moveTo(cx + g.atoms[i][1] * unit, cy - g.atoms[i][2] * unit); ctx.lineTo(cx + g.atoms[j][1] * unit, cy - g.atoms[j][2] * unit); ctx.stroke();
  }
  for (const [el, x, y] of g.atoms) {
    const r = el === 'H' ? unit * 0.2 : unit * 0.3;
    ctx.fillStyle = inkOf(el);
    ctx.beginPath(); ctx.arc(cx + x * unit, cy - y * unit, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = STEEL; ctx.lineWidth = 1; ctx.stroke();
  }
  // The partial charges of a polar molecule: a small + or − beside each atom that carries one.
  if (marks && SUBSTANCES[id]?.polar) {
    for (const a of g.atoms) {
      const m = markOf(a);
      if (m) say(ctx, m, cx + a[1] * unit, cy - a[2] * unit - unit * 0.62, Math.max(7, unit * 0.72), { align: 'center', weight: 700, color: m === '+' ? AMBER : PLATE_COLORS.text });
    }
  }
  ctx.lineWidth = 1;
  ctx.globalAlpha = 1;
}

function paintMol(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.mol, '#1d1a16');
  const sc = o.sc;
  const id = p.props.ion ? null : p.props.substance;
  if (p.props.ion) {
    // An ion is a disc as wide as its radius; the sign is its charge.
    const r = (p.props.r / 140) * 3.2 * sc;
    ctx.fillStyle = '#2f3d4a'; ctx.beginPath(); ctx.arc(o.x, box.y0 + 4.8 * sc, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = DUST; ctx.stroke();
  } else {
    paintGlyph(ctx, id, o.x, box.y0 + 4.8 * sc, 3.4 * sc, { cloud: Boolean(p.props.cloud), marks: Boolean(p.props.dipoles) });
  }
  // Up to three lines: its name, a second line (the mass), and what the probe read, each on a row of its own.
  const hasSecond = Boolean(p.props.shown);
  const hasReading = p.props.grip != null;
  const name = p.label;
  const rows = (hasSecond ? 1 : 0) + (hasReading ? 1 : 0);
  const size = Math.max(6.2, 2.0 * sc);
  let y = box.y0 + box.h - (1.9 + rows * 3.1 + (name ? 1.2 : 0)) * sc;
  if (name) { say(ctx, name, o.x, y, size, { align: 'center', weight: 700, maxW: box.w - 2 * sc }); y += 3.4 * sc; }
  if (hasSecond) { say(ctx, p.props.shown, o.x, y, Math.max(5.8, 1.7 * sc), { align: 'center', color: DUST, maxW: box.w - 2 * sc }); y += 3.1 * sc; }
  // A card that has been in the probe keeps what it read.
  if (hasReading) say(ctx, `${fmtKJ(p.props.grip)} kJ`, o.x, y, Math.max(6, 1.9 * sc), { align: 'center', weight: 700, color: AMBER, maxW: box.w - 2 * sc });
}

export function paintPiece(ctx, p, state, o) {
  if (p.kind === 'mol') { paintMol(ctx, p, state, o); return true; }
  const def = pieceDef(p.kind);
  if (def?.paint) { def.paint(ctx, p, state, o); return true; }
  return heatPiece(ctx, p, state, o);
}

export function faceKey(p, state) {
  const def = pieceDef(p.kind);
  if (def?.faceKey) return def.faceKey(p, state);
  if (p.kind === 'mol') return `mol|${p.label}|${p.props.substance ?? p.props.ion}|${p.props.grip ?? ''}|${p.props.shown ?? ''}|${p.props.cloud ? 1 : 0}|${p.props.dipoles ? 1 : 0}`;
  return heatFaceKey(p, state);
}

/* ------------------------------------------------------------------
   THE FIXTURES
   ------------------------------------------------------------------ */

export const frameOf = b => ({
  x: d => b.X(b.lay.box.x0 + d),
  y: d => b.Y(b.lay.box.y0 + d),
  len: d => d * b.sc,
  size: (k, min = 6.5) => Math.max(min, k * b.sc)
});

export const topOf = (f, lay) => (lay.dials.length ? lay.dials.reduce((a, d) => Math.max(a, d.y), 0) - lay.box.y0 + 3.6 : 10);

/**
 * The probe: the card in its slot, four of its molecules in a glass window at the right held to one another, and, once the key is
 * pressed, pulled apart; under it the heat the pull took, per mole. The molecules in the window are the card's own glyph.
 */
function paintProbe(ctx, f, state, b) {
  const F = frameOf(b);
  const r = probeRead(state, f.id);
  const p = f.props;
  const top = topOf(f, b.lay);
  const wx = 28; const wy = top + 1; const ww = f.size.w - wx - 3; const wh = 17;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(wx), F.y(wy), F.len(ww), F.len(wh));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
  if (r.item) {
    const id = r.item.props.ion ? null : r.item.props.substance;
    const unit = F.len(2.1);
    // Four molecules in two rows; pulled, they stand at the corners of the window.
    const near = [[-1.5, -1.9], [1.5, -1.9], [-1.5, 1.9], [1.5, 1.9]];
    const far = [[-ww * 0.38, -wh * 0.3], [ww * 0.38, -wh * 0.3], [-ww * 0.38, wh * 0.3], [ww * 0.38, wh * 0.3]];
    const cx = F.x(wx + ww / 2); const cy = F.y(wy + wh / 2);
    for (let i = 0; i < 4; i++) {
      const [dx, dy] = r.pulled ? far[i] : [near[i][0] * 3.2, near[i][1] * 3.2];
      if (id) paintGlyph(ctx, id, cx + F.len(dx), cy + F.len(dy), unit * 0.62, { cloud: Boolean(r.item.props.cloud) });
      else { ctx.fillStyle = '#2f3d4a'; ctx.beginPath(); ctx.arc(cx + F.len(dx), cy + F.len(dy), F.len((r.item.props.r / 140) * 1.5), 0, Math.PI * 2); ctx.fill(); }
    }
    if (p.mode === 'ion') {
      // Water molecules close round the ion: two small bent glyphs that come in when it is dropped.
      ctx.globalAlpha = r.pulled ? 1 : 0.35;
      for (const [dx, dy] of [[-0.8, -0.5], [0.8, -0.5], [0, 0.7]]) paintGlyph(ctx, 'H2O', cx + F.len(dx * 6), cy + F.len(dy * 5), unit * 0.4);
      ctx.globalAlpha = 1;
    }
  }
  const y = f.size.h - 3.6;
  say(ctx, p.mode === 'ion' ? 'HEAT GIVEN OUT, PER MOLE' : 'HEAT TO PULL ONE MOLE APART', F.x(3), F.y(y - 4.2), F.size(1.9, 5.8), { color: DIM });
  say(ctx, r.pulled ? `${fmtKJ(r.value)} kJ` : r.item ? '—' : '', F.x(3), F.y(y), F.size(3.4, 8), { color: r.pulled ? AMBER : DUST, weight: 700 });
}

export function paintFixture(ctx, f, state, b) {
  if (f.kind === 'probe') return paintProbe(ctx, f, state, b);
  const h = fixtureHandler(f.kind);
  if (h?.paint) return h.paint(ctx, f, state, b);
  return heatFixture(ctx, f, state, b);
}

export { contentTop };
