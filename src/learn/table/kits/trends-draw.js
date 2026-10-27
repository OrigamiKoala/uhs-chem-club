/**
 * kits/trends-draw.js — What the trends bench's pieces and fixtures look like.
 *
 * The drawn tabletop (`engine/table2d.js` `drawTable`) and the built one (`engine/table3d.js`) call THESE functions with the same arguments,
 * so an atom card, a spring gauge and a size gauge are one picture in both views. Every figure printed is read from `trends-read.js`, which
 * asks `electronbench.js` and `electrons.js`; a painter decides nothing. An atom is drawn TO SCALE: one pixel per picometre everywhere, so a
 * bigger atom is a bigger circle on every card.
 *
 * SCOURED PLATE: dust and phosphor on a recessed plate, hairline rims, nothing blooms.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { itemOf, springRead, sizeRead, stripRead } from './trends-read.js';

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

export const RECTS = Object.freeze({ atom: { hw: 10, hh: 9.5 }, electron: { hw: 9, hh: 5.5 } });

/** Picometres to table units on a card: 240 pm (a little more than the biggest atom the bench holds) fills the card's picture. */
const PM_UNITS = 5.2 / 240;

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

function paintAtom(ctx, p, state, o) {
  const { hw, hh } = RECTS.atom;
  const box = slab(ctx, o, hw, hh);
  const item = itemOf(p);
  const k = PM_UNITS * o.sc;
  const cx = o.x;
  const cy = o.y + 1.2 * o.sc;
  const R = (item.radius ?? 100) * k;
  ctx.fillStyle = '#16140f';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = item.radius == null ? DIM : DUST;
  ctx.setLineDash?.(item.radius == null ? [3, 2] : []);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash?.([]);
  const n = item.shells.length;
  item.shells.forEach((cnt, i) => {
    const r = R * (i + 1) / n;
    if (i < n - 1) { ctx.strokeStyle = RIM; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = PHOS;
    for (let e = 0; e < cnt; e++) {
      const a = (e / Math.max(cnt, 1)) * Math.PI * 2 + i * 0.6;
      ctx.beginPath(); ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.max(1, 0.34 * o.sc), 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.fillStyle = STEEL;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(1.4, 0.5 * o.sc), 0, Math.PI * 2); ctx.fill();
  say(ctx, p.label, o.x - box.w / 2 + 0.7 * o.sc, box.y0 + 1.7 * o.sc, Math.max(6.5, 1.9 * o.sc), { weight: 700, maxW: box.w - 3.5 * o.sc });
  if (item.charge) say(ctx, item.charge > 0 ? `+${item.charge}` : String(item.charge), box.x0 + box.w - 0.8 * o.sc, box.y0 + 1.7 * o.sc, Math.max(6.5, 1.9 * o.sc), { align: 'right', weight: 700, color: AMBER });
  if (p.props.lastCost != null) say(ctx, String(p.props.lastCost), box.x0 + box.w - 0.8 * o.sc, box.y0 + box.h - 1.5 * o.sc, Math.max(6, 1.7 * o.sc), { align: 'right', color: DUST });
}

function paintElectron(ctx, p, state, o) {
  const { hw, hh } = RECTS.electron;
  slab(ctx, o, hw, hh, '#1d1a16');
  say(ctx, p.label, o.x, o.y, Math.max(7, hh * 0.95 * o.sc), { align: 'center', weight: 700, maxW: hw * 2 * o.sc - 3 });
}

export function paintPiece(ctx, p, state, o) {
  if (p.kind === 'atom') { paintAtom(ctx, p, state, o); return true; }
  if (p.kind === 'electron') { paintElectron(ctx, p, state, o); return true; }
  return false;
}

export function faceKey(p, state) {
  return `${p.label}|${p.props.charge || 0}|${p.props.lastCost ?? ''}`;
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

function paintSpring(ctx, f, state, b) {
  const F = frameOf(b);
  const r = springRead(state, f.id);
  const show = f.props.show || {};
  const x = 23;
  let y = 14.6;
  const line = (text, color = DUST, weight = 500) => { say(ctx, text, F.x(x), F.y(y), F.size(2.6, 7), { color, weight, maxW: F.len(f.size.w - x - 2) }); y += 3.5; };
  if (!r.piece) { line('NO ATOM IN THE HOLDER', DIM); return; }
  if (r.pull == null) { line('THE BENCH HAS NO SIZE FOR THIS ION', AMBER); return; }
  line(`PULL ${r.pull.toFixed(2)}`, PHOS, 700);
  line(`CORE CHARGE +${r.z}`);
  line(`DISTANCE ${r.distPm} pm`);
  if (show.between) line(`ELECTRONS BETWEEN ${r.between}`);
  if (show.feel) line(`${f.props.feelWord || 'CHARGE IT FEELS'} +${r.zeff}`, AMBER);
}

function paintSizer(ctx, f, state, b) {
  const F = frameOf(b);
  const r = sizeRead(state, f.id);
  const x0 = 22;
  const w = f.size.w - x0 - 2;
  if (!r.piece) { say(ctx, 'NO ATOM IN THE HOLDER', F.x(x0), F.y(13), F.size(2.6, 7), { color: DIM, maxW: F.len(w) }); return; }
  if (f.props.measure && !r.measured) { say(ctx, 'NOT MEASURED YET', F.x(x0), F.y(13), F.size(2.6, 7), { color: DIM, maxW: F.len(w) }); return; }
  if (r.radius == null) { say(ctx, 'THE BENCH HAS NO SIZE FOR THIS ION', F.x(x0), F.y(13), F.size(2.4, 6), { color: AMBER, maxW: F.len(w) }); return; }
  say(ctx, `RADIUS ${r.radius} pm`, F.x(x0), F.y(11.4), F.size(2.8, 7), { color: PHOS, weight: 700, maxW: F.len(w) });
  // A scale of picometres with the radius laid along it.
  const sc = w / 250;
  const y = F.y(18);
  ctx.strokeStyle = STEEL;
  ctx.beginPath(); ctx.moveTo(F.x(x0), y); ctx.lineTo(F.x(x0 + 250 * sc), y); ctx.stroke();
  for (let pm = 0; pm <= 250; pm += 50) { ctx.beginPath(); ctx.moveTo(F.x(x0 + pm * sc), y - 2); ctx.lineTo(F.x(x0 + pm * sc), y + 2); ctx.stroke(); }
  ctx.fillStyle = AMBER;
  ctx.fillRect(F.x(x0), y - 1.5, F.len(r.radius * sc), 3);
}

function paintStrip(ctx, f, state, b) {
  const F = frameOf(b);
  const r = stripRead(state, f.id);
  const x = 22;
  if (!r.piece) { say(ctx, 'NO ATOM IN THE HOLDER', F.x(x), F.y(12), F.size(2.6, 7), { color: DIM, maxW: F.len(f.size.w - x - 2) }); return; }
  say(ctx, `${Math.max(0, r.charge)} ELECTRONS TAKEN OFF`, F.x(x), F.y(11.6), F.size(2.6, 7), { color: DUST, maxW: F.len(f.size.w - x - 2) });
  say(ctx, r.last != null ? `REQUIRED ${r.last} kJ/mol` : 'NOTHING REMOVED YET', F.x(x), F.y(15.4), F.size(2.6, 7), { color: r.last != null ? PHOS : DIM, weight: 700, maxW: F.len(f.size.w - x - 2) });
}

export function paintFixture(ctx, f, state, b) {
  if (f.kind === 'spring') paintSpring(ctx, f, state, b);
  else if (f.kind === 'sizer') paintSizer(ctx, f, state, b);
  else if (f.kind === 'strip') paintStrip(ctx, f, state, b);
}
