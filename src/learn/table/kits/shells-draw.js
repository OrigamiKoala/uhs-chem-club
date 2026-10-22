/**
 * kits/shells-draw.js — What the box rack's pieces and fixtures look like.
 *
 * The drawn tabletop (`engine/table2d.js` `drawTable`) and the built one (`engine/table3d.js`) call THESE functions with the same
 * arguments, so a box, an arrow and an address strip are one picture in both views. Every figure printed is read from
 * `shells-read.js`, which asks `electrons.js`; a painter decides nothing.
 *
 * SCOURED PLATE: phosphor arrows in milled boxes on a dark plate. Spin is told by the direction of the arrow and a label, never
 * by colour; a lit box is an amber rim, never a glow.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import {
  arrowsOf, readOf, finderLight, addressOfFinder, magnetRead, reachPm, rowOf, mlOf, fmtMl, groundConfig, LADDER, capacityOf, fmtMs, zOf
} from './shells-read.js';

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const RIM = PLATE_COLORS.rim;
const INK = '#0a0908';

function say(ctx, text, x, y, size, o = {}) {
  ctx.font = `${o.weight || 500} ${Math.max(6, size)}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  if (o.maxW) ctx.fillText(text, x, y, o.maxW); else ctx.fillText(text, x, y);
}

/** An arrow standing in a box: a shaft with its head, up or down. */
function arrow(ctx, x, y, len, up, color) {
  const h = len / 2;
  const tip = up ? y - h : y + h;
  const tail = up ? y + h : y - h;
  const d = up ? 1 : -1;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.3, len * 0.1);
  ctx.beginPath(); ctx.moveTo(x, tail); ctx.lineTo(x, tip); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, tip); ctx.lineTo(x - len * 0.22, tip + d * len * 0.32); ctx.lineTo(x + len * 0.22, tip + d * len * 0.32); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 1;
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

export const RECTS = Object.freeze({
  box: { hw: 3, hh: 3 },
  etok: { hw: 17, hh: 6.5 },
  ccard: { hw: 11, hh: 6.5 },
  tag: { hw: 8, hh: 6.5 },
  estrip: { hw: 8, hh: 8 }
});

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

/** Is a box lit by the address strip? (a whole floor, a suite's row, or the one box) */
function litBy(state, p) {
  const id = p.props.finder;
  if (!id || !state.fixtures[id]) return false;
  const lit = finderLight(state, id);
  if (lit.box) return lit.box.row === p.props.row && lit.box.idx === p.props.idx;
  if (lit.row) return lit.row === p.props.row;
  if (lit.floor != null) return rowOf(p.props.row).n === lit.floor;
  return false;
}

function paintBox(ctx, p, state, o) {
  const { hw, hh } = RECTS.box;
  const x0 = o.x - hw * o.sc;
  const y0 = o.y - hh * o.sc;
  const w = hw * 2 * o.sc;
  const h = hh * 2 * o.sc;
  const here = arrowsOf(state, p);
  const lit = litBy(state, p);
  ctx.fillStyle = lit ? '#2a2c1f' : INK;
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = lit ? AMBER : here ? STEEL : RIM;
  ctx.lineWidth = lit ? 2.5 : 1.4;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.lineWidth = 1;
  if (p.props.target) {
    // The box a stage asks for the address of, ringed.
    ctx.strokeStyle = AMBER;
    ctx.setLineDash?.([3, 3]);
    ctx.strokeRect(x0 - 3.5, y0 - 3.5, w + 7, h + 7);
    ctx.setLineDash?.([]);
  }
  const pre = p.props.pre || '';
  const len = h * 0.78;
  for (const spin of ['u', 'd']) {
    if (!here.includes(spin)) continue;
    const both = here.length === 2;
    const ax = both ? (spin === 'u' ? x0 + w * 0.3 : x0 + w * 0.7) : x0 + w / 2;
    arrow(ctx, ax, o.y, len, spin === 'u', pre.includes(spin) ? DIM : PHOS);
  }
}

function paintDispenser(ctx, p, state, o) {
  ctx.fillStyle = STEEL;
  ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = o.lit ? AMBER : DUST;
  ctx.lineWidth = o.lit ? 2 : 1;
  ctx.stroke();
  ctx.lineWidth = 1;
  if (p.kind === 'lift') {
    ctx.strokeStyle = '#16140f';
    ctx.lineWidth = Math.max(1.5, o.r * 0.13);
    ctx.beginPath();
    ctx.moveTo(o.x - o.r * 0.26, o.y - o.r * 0.54); ctx.lineTo(o.x + o.r * 0.26, o.y + o.r * 0.02);
    ctx.moveTo(o.x + o.r * 0.26, o.y - o.r * 0.54); ctx.lineTo(o.x - o.r * 0.26, o.y + o.r * 0.02);
    ctx.stroke();
    ctx.lineWidth = 1;
  } else {
    arrow(ctx, o.x, o.y - o.r * 0.24, o.r * 0.9, p.kind === 'up', '#16140f');
  }
  say(ctx, p.label, o.x, o.y + o.r * 0.56, Math.max(7, o.r * (p.label.length > 5 ? 0.3 : 0.36)), { align: 'center', weight: 700, color: '#16140f' });
}

/** A text size that lets `label` fit the card without being squeezed: the height's share, or what the width allows. */
function fitSize(label, box, share) {
  return Math.max(6, Math.min(box.h * share, (box.w - 5) / (String(label).length * 0.62)));
}

function paintToken(ctx, p, state, o) {
  const { hw, hh } = RECTS.etok;
  const box = slab(ctx, o, hw, hh, p.props.placed ? '#1d1a15' : '#2a2620');
  say(ctx, p.label, o.x, o.y, fitSize(p.label, box, 0.4), { align: 'center', maxW: box.w - 4, weight: 700, color: p.props.placed ? DIM : PLATE_COLORS.text });
  if (p.props.placed) {
    ctx.strokeStyle = PHOS;
    ctx.lineWidth = Math.max(1.4, o.sc * 0.4);
    ctx.beginPath(); ctx.moveTo(box.x0 + 2, box.y0 + box.h - 2.5); ctx.lineTo(box.x0 + box.w - 2, box.y0 + box.h - 2.5); ctx.stroke();
    ctx.lineWidth = 1;
  }
}

function paintCard(ctx, p, state, o) {
  const { hw, hh } = RECTS[p.kind];
  const box = slab(ctx, o, hw, hh);
  say(ctx, p.label, o.x, o.y, fitSize(p.label, box, 0.4), { align: 'center', maxW: box.w - 4, weight: 700 });
}

/** An element strip: its symbol over a small ladder of bars, the row its last electron went into lit. */
function paintStrip(ctx, p, state, o) {
  const { hw, hh } = RECTS.estrip;
  const box = slab(ctx, o, hw, hh);
  const counts = groundConfig(zOf(p.props.sym));
  let last = null;
  for (const row of LADDER) if (counts[row.id]) last = row.id;
  say(ctx, p.label, o.x, box.y0 + box.h * 0.16, Math.max(8, box.h * 0.2), { align: 'center', weight: 700 });
  const rows = LADDER.slice(0, 12);
  const top = box.y0 + box.h * 0.3;
  const rh = (box.h * 0.64) / rows.length;
  rows.forEach((row, i) => {
    const y = box.y0 + box.h - 3 - (i + 1) * rh;
    const cap = capacityOf(row.id);
    const n = counts[row.id] || 0;
    const bw = box.w - 8;
    ctx.fillStyle = INK;
    ctx.fillRect(box.x0 + 4, y, bw, Math.max(1, rh - 1));
    if (n) {
      ctx.fillStyle = row.id === last ? AMBER : PHOS;
      ctx.fillRect(box.x0 + 4, y, bw * (n / cap), Math.max(1, rh - 1));
    }
  });
  void top;
}

function paintPiece(ctx, p, state, o) {
  switch (p.kind) {
    case 'box': paintBox(ctx, p, state, o); return true;
    case 'up': case 'down': case 'lift': paintDispenser(ctx, p, state, o); return true;
    case 'etok': paintToken(ctx, p, state, o); return true;
    case 'ccard': case 'tag': paintCard(ctx, p, state, o); return true;
    case 'estrip': paintStrip(ctx, p, state, o); return true;
    default: return false;
  }
}

function faceKey(p, state) {
  if (p.kind === 'box') return `${arrowsOf(state, p)}|${litBy(state, p) ? 1 : 0}|${p.props.pre || ''}|${p.props.target ? 1 : 0}`;
  if (p.kind === 'etok') return `${p.label}|${p.props.placed ? 1 : 0}`;
  return p.label;
}

/* ------------------------------------------------------------------
   FIXTURES
   ------------------------------------------------------------------ */

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

/** The rows of a rack as the boxes standing on the table lay them out, lowest first: `{id, y, x0, x1}` in table units. */
export function rowsOnTable(state, rackId) {
  const rows = new Map();
  for (const p of Object.values(state.pieces)) {
    if (p.kind !== 'box' || p.props.rack !== rackId) continue;
    const r = rows.get(p.props.row) || { id: p.props.row, y: p.at.y, x0: Infinity, x1: -Infinity };
    r.x0 = Math.min(r.x0, p.at.x - RECTS.box.hw);
    r.x1 = Math.max(r.x1, p.at.x + RECTS.box.hw);
    rows.set(p.props.row, r);
  }
  return [...rows.values()].sort((a, b) => b.y - a.y);
}

/** The board a rack stands on: its readings, its energy axis, its row labels, the lit floor and the clouds beside the rows. */
function paintShelf(ctx, f, state, b) {
  const F = frameOf(b);
  const rackId = f.props.rack;
  const read = readOf(state, rackId);
  const rows = rowsOnTable(state, rackId);
  const x0 = F.r.x0;
  const y0 = F.r.y0;
  const sz = F.size(2.5, 7);
  // The reading, always on the plate.
  if (f.props.readout !== false) {
    const core = f.props.core && state.fixtures[f.props.core]?.dials.core.value >= 1;
    say(ctx, `PLACED ${read.total}`, F.x(2), F.y(4.2), sz, { color: PHOS, weight: 700 });
    say(ctx, `ALONE IN A BOX ${read.unpaired}`, F.x(f.size.w - 2), F.y(4.2), sz, { align: 'right', color: PHOS, weight: 700 });
    const written = core ? read.short : read.config;
    say(ctx, written || 'NOTHING PLACED', F.x(f.size.w / 2), F.y(8.4), F.size(2.6, 7), { align: 'center', color: written ? DUST : DIM, weight: 600, maxW: F.len(f.size.w - 4) });
  }
  if (f.props.finder) {
    const lit = finderLight(state, f.props.finder);
    if (lit.none) say(ctx, 'NO ORBITAL HAS THIS ADDRESS', F.x(f.size.w / 2), F.y(5.6), sz, { align: 'center', color: AMBER, weight: 700, maxW: F.len(f.size.w - 4) });
  }
  if (!rows.length) return;
  // The energy arrow up the left edge.
  const top = rows[rows.length - 1].y - 5;
  const bottom = rows[0].y + 4;
  ctx.strokeStyle = DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(F.x(3.5), F.y(bottom - y0)); ctx.lineTo(F.x(3.5), F.y(top - y0 + 2));
  ctx.moveTo(F.x(3.5), F.y(top - y0)); ctx.lineTo(F.x(2.2), F.y(top - y0 + 2.6)); ctx.lineTo(F.x(4.8), F.y(top - y0 + 2.6)); ctx.closePath();
  ctx.stroke();
  say(ctx, 'ENERGY', F.x(3.5), F.y(top - y0 - 2), F.size(2.1, 6), { align: 'center', color: DIM });
  const show = f.props.show || null;
  const lit = f.props.finder ? finderLight(state, f.props.finder) : null;
  for (const r of rows) {
    const row = rowOf(r.id);
    const label = show
      ? [show.n ? `n=${row.n}` : '', show.l ? `l=${row.l}` : ''].filter(Boolean).join(' ')
      : (f.props.labels === false ? '' : r.id);
    say(ctx, label, F.x(r.x0 - x0 - 1.4), F.y(r.y - y0), F.size(2.4, 7), { align: 'right', color: DIM });
    if (lit && lit.floor === row.n) {
      ctx.fillStyle = AMBER;
      ctx.fillRect(F.x(5.4), F.y(r.y - y0 - 3.2), F.len(1.2), F.len(6.4));
    }
    // The ml of each box and the cloud this row's electrons make, drawn to scale beside it.
    if (show?.ml && rows.length <= 4) {
      for (let i = 0; i < 2 * row.l + 1; i++) {
        const bx = r.x0 + RECTS.box.hw + i * ((r.x1 - r.x0) / (2 * row.l + 1));
        say(ctx, `ml ${fmtMl(mlOf(r.id, i))}`, F.x(bx - x0), F.y(r.y - y0 - 5.4), F.size(1.9, 6), { align: 'center', color: DIM });
      }
    }
    if (f.props.reach) {
      const lightRow = lit && (lit.floor === row.n || lit.row === r.id);
      const cx = F.x(f.size.w - 11);
      const rad = Math.min(F.len(3.1), F.len(0.5 + row.n * 0.9));
      ctx.strokeStyle = lightRow ? AMBER : DIM;
      ctx.beginPath(); ctx.arc(cx - F.len(5), F.y(r.y - y0), rad, 0, Math.PI * 2); ctx.stroke();
      say(ctx, `${reachPm(row.n, row.l)} pm`, F.x(f.size.w - 2), F.y(r.y - y0), F.size(2.2, 6), { align: 'right', color: lightRow ? AMBER : DIM, weight: 700 });
    }
  }
  void fmtMs;
}

function paintFinder(ctx, f, state, b) {
  const F = frameOf(b);
  const a = addressOfFinder(state, f.id);
  const parts = [];
  for (const k of ['n', 'l', 'ml']) if (f.dials[k] || f.props.fixed?.[k] != null) parts.push(`${k} ${k === 'ml' ? fmtMl(a.ml) : a[k]}`);
  if (f.dials.ms) parts.push(`ms ${a.ms > 0 ? '+1/2' : '-1/2'}`);
  say(ctx, parts.join('   '), F.x(f.size.w / 2), F.y(f.size.h - 3.2), F.size(2.5, 7), { align: 'center', color: PHOS, weight: 700, maxW: F.len(f.size.w - 3) });
}

function paintMagnet(ctx, f, state, b) {
  const F = frameOf(b);
  const read = magnetRead(state, f.id);
  const w = f.size.w;
  const cx = F.x(w / 2);
  const top = F.y(7);
  const r = Math.min(F.len(w * 0.17), F.len(4.6));
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = Math.max(2, F.sc * 1.2);
  ctx.beginPath();
  ctx.moveTo(cx - r, top + r * 1.5); ctx.lineTo(cx - r, top + r);
  ctx.arc(cx, top + r, r, Math.PI, 0);
  ctx.lineTo(cx + r, top + r * 1.5);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = DUST;
  ctx.fillRect(cx - r - F.sc, top + r * 1.5, 2 * F.sc, 1.3 * F.sc);
  ctx.fillRect(cx + r - F.sc, top + r * 1.5, 2 * F.sc, 1.3 * F.sc);
  let l1 = read.target === 'sample' ? 'NOT TESTED' : 'NOT TESTED';
  let l2 = '';
  if (read.tested) {
    l1 = read.pull > 0 ? 'PULLED IN' : 'PUSHED OUT';
    l2 = read.pull > 0 ? `STRENGTH ${read.pull}` : 'SLIGHTLY';
  }
  say(ctx, l1, cx, F.y(18.2), F.size(2.4, 7), { align: 'center', color: read.tested ? AMBER : DIM, weight: 700, maxW: F.len(w - 3) });
  if (l2) say(ctx, l2, cx, F.y(22.4), F.size(2.4, 7), { align: 'center', color: AMBER, weight: 700, maxW: F.len(w - 3) });
}

function paintFixture(ctx, f, state, b) {
  if (f.kind === 'shelf') paintShelf(ctx, f, state, b);
  else if (f.kind === 'finder') paintFinder(ctx, f, state, b);
  else if (f.kind === 'magnet') paintMagnet(ctx, f, state, b);
}

export { paintPiece, paintFixture, faceKey, readOf };
