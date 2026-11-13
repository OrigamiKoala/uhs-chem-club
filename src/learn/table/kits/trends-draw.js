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
import { itemOf, springRead, sizeRead, stripRead, gainRead, zOf, nameOf } from './trends-read.js';

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

/** The radius every card is drawn at when a stage asks which atom is bigger (`props.plain`): the picture then shows charges and shells, not size. */
const PLAIN_PM = 150;

/**
 * An atom card: the model the whole bench reasons from. The nucleus is the solid disc at the middle; the INNER shells are a dim band round it
 * with their electrons dim; the OUTER shell's electrons are bright. Under the picture are the two counts the outer electron's attraction
 * depends on: the charge of the nucleus and the number of inner electrons. Drawn to scale unless `props.plain`.
 */
function paintAtom(ctx, p, state, o) {
  const { hw, hh } = RECTS.atom;
  const box = slab(ctx, o, hw, hh);
  const item = itemOf(p);
  const k = PM_UNITS * o.sc;
  const cx = o.x;
  const cy = o.y - 0.2 * o.sc;
  const R = (p.props.plain ? PLAIN_PM : (item.radius ?? 100)) * k;
  const n = item.shells.length;
  const inner = item.shells.slice(0, n - 1).reduce((a, c) => a + c, 0);
  ctx.fillStyle = '#16140f';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  // The inner shells, as one band between the nucleus and the outer shell.
  if (n > 1) {
    ctx.fillStyle = 'rgba(184, 175, 160, 0.14)';
    ctx.beginPath(); ctx.arc(cx, cy, R * (n - 1) / n + R * 0.08, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = !p.props.plain && item.radius == null ? DIM : DUST;
  ctx.setLineDash?.(!p.props.plain && item.radius == null ? [3, 2] : []);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash?.([]);
  item.shells.forEach((cnt, i) => {
    const r = R * (i + 1) / n;
    const outer = i === n - 1;
    if (!outer) { ctx.strokeStyle = RIM; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = outer ? PHOS : DIM;
    for (let e = 0; e < cnt; e++) {
      const a = (e / Math.max(cnt, 1)) * Math.PI * 2 + i * 0.6;
      ctx.beginPath(); ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.max(1, (outer ? 0.36 : 0.28) * o.sc), 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.fillStyle = AMBER;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(1.4, 0.5 * o.sc), 0, Math.PI * 2); ctx.fill();
  const small = Math.max(6, 1.6 * o.sc);
  say(ctx, p.label, o.x - box.w / 2 + 0.7 * o.sc, box.y0 + 1.7 * o.sc, Math.max(6.5, 1.9 * o.sc), { weight: 700, maxW: box.w - 3.5 * o.sc });
  if (item.charge) say(ctx, item.charge > 0 ? `+${item.charge}` : `−${Math.abs(item.charge)}`, box.x0 + box.w - 0.8 * o.sc, box.y0 + 1.7 * o.sc, Math.max(6.5, 1.9 * o.sc), { align: 'right', weight: 700, color: AMBER });
  say(ctx, `NUCLEUS +${item.z}`, box.x0 + 0.7 * o.sc, box.y0 + box.h - 3.3 * o.sc, small, { color: AMBER, maxW: box.w - 1.4 * o.sc });
  say(ctx, `INNER e⁻ ${inner}`, box.x0 + 0.7 * o.sc, box.y0 + box.h - 1.4 * o.sc, small, { color: DUST, maxW: box.w - 1.4 * o.sc });
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
  return `${p.label}|${p.props.charge || 0}|${p.props.plain ? 1 : 0}`;
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

/** What the electron the dial names is attracted by: the nucleus's charge, the electrons between it and the nucleus, and (when shown) what is left. */
function paintSpring(ctx, f, state, b) {
  const F = frameOf(b);
  const r = springRead(state, f.id);
  const show = f.props.show || {};
  const x = 23;
  let y = 14.6;
  const line = (text, color = DUST, weight = 500) => { say(ctx, text, F.x(x), F.y(y), F.size(2.6, 7), { color, weight, maxW: F.len(f.size.w - x - 2) }); y += 3.8; };
  if (!r.piece) { line('NO ATOM IN THE HOLDER', DIM); return; }
  if (r.pull == null) { line('NO MEASURED SIZE FOR THIS ION', AMBER); return; }
  line(`NUCLEUS +${r.z}`, AMBER, 700);
  line(`ELECTRONS BETWEEN ${r.between}`);
  if (show.feel) line(`${f.props.feelWord || 'CHARGE FELT'} +${r.zeff}`, PHOS, 700);
  if (show.dist) line(`DISTANCE ${r.distPm} pm`);
}

/** Subshell rows for each atom, lowest at the bottom, electrons as arrows; the outermost electron (the one a remover takes) is amber. */
const LEVEL_ROWS = [['1s', 1], ['2s', 1], ['2p', 3]];
function paintLevels(ctx, f, state, b) {
  const F = frameOf(b);
  const atoms = f.props.atoms || [];
  const colW = (f.size.w - 4) / Math.max(1, atoms.length);
  atoms.forEach((sym, ai) => {
    const x0 = 2 + ai * colW;
    let left = zOf(sym);
    const fills = LEVEL_ROWS.map(([, boxes]) => { const take = Math.min(left, boxes * 2); left -= take; return take; });
    const last = fills.reduce((m, cnt, i) => (cnt > 0 ? i : m), 0);
    say(ctx, nameOf(sym).toUpperCase(), F.x(x0 + colW / 2), F.y(7.6), F.size(2.3, 6.5), { align: 'center', color: DUST, weight: 700, maxW: F.len(colW - 1) });
    LEVEL_ROWS.forEach(([id, boxes], ri) => {
      const y = f.size.h - 5 - ri * 7.2 - (ri === 2 ? 1.6 : 0);
      say(ctx, id, F.x(x0 + 1), F.y(y), F.size(2.2, 6), { color: DIM });
      for (let k = 0; k < boxes; k++) {
        const bx = x0 + 7 + k * 5.2;
        ctx.strokeStyle = STEEL;
        ctx.strokeRect(F.x(bx), F.y(y - 2.2), F.len(4.4), F.len(4.4));
        // Singly across the row first, then pairing: the order the electrons go in.
        const cnt = fills[ri];
        const here = (cnt > k ? 1 : 0) + (cnt > boxes + k ? 1 : 0);
        for (let e = 0; e < here; e++) {
          const isLast = ri === last && ((cnt <= boxes && k === cnt - 1) || (cnt > boxes && e === 1 && k === cnt - boxes - 1) || (cnt === boxes * 2 && e === 1 && k === boxes - 1));
          say(ctx, e === 0 ? '↑' : '↓', F.x(bx + 1.3 + e * 1.8), F.y(y), F.size(3, 7), { align: 'center', color: isLast ? AMBER : DUST, weight: 700 });
        }
      }
    });
  });
  say(ctx, 'ENERGY ↑', F.x(f.size.w - 1.5), F.y(f.size.h - 2), F.size(2, 6), { align: 'right', color: DIM });
}

function paintSizer(ctx, f, state, b) {
  const F = frameOf(b);
  const r = sizeRead(state, f.id);
  const x0 = 22;
  const w = f.size.w - x0 - 2;
  if (!r.piece) { say(ctx, 'NO ATOM IN THE HOLDER', F.x(x0), F.y(13), F.size(2.6, 7), { color: DIM, maxW: F.len(w) }); return; }
  if (f.props.measure && !r.measured) { say(ctx, 'NOT MEASURED YET', F.x(x0), F.y(13), F.size(2.6, 7), { color: DIM, maxW: F.len(w) }); return; }
  if (r.radius == null) { say(ctx, 'NO MEASURED SIZE FOR THIS ION', F.x(x0), F.y(13), F.size(2.4, 6), { color: AMBER, maxW: F.len(w) }); return; }
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
  say(ctx, `ELECTRONS REMOVED ${Math.max(0, r.charge)}`, F.x(x), F.y(11.6), F.size(2.6, 7), { color: DUST, maxW: F.len(f.size.w - x - 2) });
  say(ctx, r.last != null ? `ENERGY NEEDED ${r.last} kJ/mol` : 'NOTHING REMOVED YET', F.x(x), F.y(15.4), F.size(2.6, 7), { color: r.last != null ? PHOS : DIM, weight: 700, maxW: F.len(f.size.w - x - 2) });
}

function paintGain(ctx, f, state, b) {
  const F = frameOf(b);
  const r = gainRead(state, f.id);
  const x = 22;
  const maxW = F.len(f.size.w - x - 2);
  if (!r.piece) { say(ctx, 'NO ATOM IN THE HOLDER', F.x(x), F.y(12), F.size(2.6, 7), { color: DIM, maxW }); return; }
  if (r.last == null) { say(ctx, 'NOTHING MEASURED YET', F.x(x), F.y(12), F.size(2.6, 7), { color: DIM, maxW }); return; }
  if (r.mode === 'pauling') {
    say(ctx, 'PULL ON SHARED ELECTRONS', F.x(x), F.y(11.6), F.size(2.4, 6.5), { color: DUST, maxW });
    say(ctx, r.last.toFixed(2), F.x(x), F.y(15.6), F.size(3, 7.5), { color: PHOS, weight: 700, maxW });
    return;
  }
  say(ctx, 'ENERGY RELEASED', F.x(x), F.y(11.6), F.size(2.6, 7), { color: DUST, maxW });
  say(ctx, `${r.last < 0 ? '\u2212' : ''}${Math.abs(r.last)} kJ/mol`, F.x(x), F.y(15.6), F.size(2.8, 7), { color: PHOS, weight: 700, maxW });
}

export function paintFixture(ctx, f, state, b) {
  if (f.kind === 'spring') paintSpring(ctx, f, state, b);
  else if (f.kind === 'sizer') paintSizer(ctx, f, state, b);
  else if (f.kind === 'strip') paintStrip(ctx, f, state, b);
  else if (f.kind === 'gain') paintGain(ctx, f, state, b);
  else if (f.kind === 'levels') paintLevels(ctx, f, state, b);
}
