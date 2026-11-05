/**
 * kits/ph-mix.js — the mixing flask, registered on the ph kit (`ph-registry.js`). Verdigris's `q5-salts`.
 *
 *   MIX   a flask holding V mL of an acid or a base, and a jug of a strong reagent. "Pour" adds one measured step (a few mL). The window
 *         holds 100 units of what is in the flask: grey units are still there, green units have been used up by what was poured
 *         (`ph-read.js` `mixOf`, the charge-balance solver of `phdata.js`). The pH meter lies on the seat and reads the flask as it stands.
 *
 * A thin wrapper over the planner: the poured count is the only state (a hidden dial), every figure is `mixOf`.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './ph-registry.js';
import { frameOf } from './matter-draw.js';
import { put, ball, ionText } from './ph-flask.js';
import { mixOf, meterRead, flaskPH, cellGrid, ionizedCells, ACID_INK, BASE_INK } from './ph-read.js';
import { fmt } from '../../engine/phdata.js';
import './ph-mix-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

const W = 76; const H = 60;
const concT = c => `${Number(c).toPrecision(2)} M`;

function paintMix(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props; const m = p.neut;
  const r = mixOf(f);
  put(ctx, ionText(`${p.name} ${concT(m.c)}, ${m.V} mL`), F.x(2), F.y(7.4), F.size(2.2, 5.8), { align: 'left', color: TEXT, weight: 700, maxW: F.len(W - 4) });
  const x = 3; const y = 11; const s = 26;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(s), F.len(s));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(s)), Math.round(F.len(s)));
  const cells = cellGrid(100, 10, x + 0.6, y + 0.6, s - 1.2, s - 1.2);
  const gone = ionizedCells(100, r.used, 17);
  cells.forEach((c, i) => ball(ctx, F.x(c.x), F.y(c.y), Math.max(1.4, F.len(Math.min(c.cw, c.ch) * 0.42)), gone.has(i) ? BASE_INK : ACID_INK));
  const what = p.kind === 'base' ? 'base' : 'acid';
  [[ACID_INK, `${what} left`, 40.5], [BASE_INK, `${what} used up`, 44.5]].forEach(([ink, t, yy]) => {
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(F.x(4), F.y(yy), F.len(0.9), 0, Math.PI * 2); ctx.fill();
    put(ctx, t, F.x(6.2), F.y(yy), F.size(1.9, 5.6), { align: 'left', color: DUST });
  });
  put(ctx, ionText(`Jug: ${concT(m.ct)} ${p.reagent}`), F.x(33), F.y(14), F.size(2.2, 5.8), { align: 'left', color: DUST, maxW: F.len(W - 35) });
  put(ctx, 'Poured', F.x(33), F.y(20), F.size(2.0, 5.6), { align: 'left', color: DIM });
  put(ctx, `${r.mL} mL`, F.x(33), F.y(26), F.size(4, 9), { align: 'left', color: AMBER, weight: 700, maxW: F.len(W - 35) });
  if (p.seat) {
    const mt = meterRead(state, f.id);
    const sr = p.seatRel;
    if (!mt.meter) put(ctx, mt.noted != null ? `pH ${fmt(mt.noted, 2)}` : '', F.x(sr.x), F.y(sr.y), F.size(2.8, 6.8), { color: mt.noted != null ? DUST : DIM, weight: 700 });
  }
}

function run(state, fid) {
  const f = state.fixtures[fid];
  const r = mixOf(f);
  if (r.k >= f.props.neut.max) return { noop: 'The jug is empty.' };
  return { x: r.k + 1, y: Math.round(flaskPH(f) * 100) / 100, label: `pour:${fid}`, dials: { [fid]: { poured: r.k + 1 } } };
}

function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'phneut' || !f.props.seat) continue;
    const mt = meterRead(state, f.id);
    if (mt.meter) f.props.noted = Math.round(flaskPH(f) * 100) / 100;
  }
}

registerFixture('phneut', { paint: paintMix, run, settle });

/**
 * A mixing flask. `mix` is `{ type, id, c, V, ct, step, max }` (see `ph-read.js` `mixOf`); `poured` the pours already made; `name` what the
 * flask holds; `reagent` the jug's contents; `kind` 'acid' or 'base' (what the window counts); `meter: false` leaves no seat.
 * Returns `{ fixture, slot, size }`.
 */
export function neutParts(id, at, { mix, name, reagent, kind = 'acid', poured = 0, meter = true, title = 'Mixing flask' }) {
  const x0 = at.x - W / 2; const y0 = at.y - H / 2;
  const seatRel = { x: 17, y: 53, w: 22, h: 11 };
  const slot = meter ? { id: `${id}.seat`, label: ' ', at: { x: x0 + seatRel.x, y: y0 + seatRel.y }, size: { w: seatRel.w, h: seatRel.h } } : null;
  return {
    fixture: {
      id, kind: 'phneut', label: title, runLabel: 'Pour', at: { ...at }, size: { w: W, h: H },
      dials: { poured: { min: 0, max: mix.max, step: 1, value: poured, label: 'Poured' } },
      props: { hidden: ['poured'], backdrop: true, neut: { ...mix }, name, reagent, kind, seat: slot ? slot.id : null, seatRel, noted: null }
    },
    slot,
    size: { w: W, h: H }
  };
}
