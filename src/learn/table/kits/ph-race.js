/**
 * kits/ph-race.js — the proton race and its acid cards, registered on the ph kit (`ph-registry.js`). Verdigris's `q4-structure`.
 *
 *   RACE   two places: an acid, and the base another acid leaves behind. The protons start on the acid (100 of them); "Race" lets them go
 *          to whichever side holds them better and the two windows show where they ended, 100 sites each (grey holds a proton, green
 *          holds none). The count is `phdata.js` `raceCount`; the race prints no pKa. Every race run is kept in a short list, so results
 *          can be compared when the cards are back on the rail.
 *   CARD   an acid, drawn with the structure facts a stage prints on it (never a pKa). In the first place it acts as the acid, in the
 *          second as the base it leaves. `face: 'base'` prints the base's formula large (the stage that ranks bases).
 *
 * A thin wrapper over the planner: a painter decides nothing, the recorder row is the only memory.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, registerPiece } from './ph-registry.js';
import { frameOf, slab } from './matter-draw.js';
import { seatedIn } from './heat-read.js';
import { put, ball, ionText } from './ph-flask.js';
import { ionizedCells, cellGrid, ACID_INK, BASE_INK } from './ph-read.js';
import { RACE, raceCount } from '../../engine/phdata.js';
import './ph-race-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

export const SITES = 100;
const CARD = { hw: 10.5, hh: 9 };
const W = 166; const H = 70;
const COL = { a: 23, b: 71 };
const WIN = { y: 36, s: 30 };

/** The words a card goes by in the first place and in the second. */
export const nameAcid = c => (c.props.anon ? String(c.label) : RACE[c.props.acid].acid);
export const nameBase = c => (c.props.anon ? `base of ${c.label}` : RACE[c.props.acid].base);
const baseShort = c => (c.props.anon ? `base ${c.label}` : RACE[c.props.acid].base);

/** An acid card. `rows` are the structure facts printed under the formula (strings). */
export const acidCard = (id, acid, at, { rows = [], face = 'acid', label = null, anon = false } = {}) => ({
  id, kind: 'phacid', label: label ?? (face === 'base' ? RACE[acid].base : RACE[acid].acid), at, props: { acid, rows, face, anon }
});

function paintCard(ctx, p, state, o) {
  const box = slab(ctx, o, CARD, '#1d1a16');
  const sc = o.sc; const rows = p.props.rows || [];
  const big = ionText(p.label);
  put(ctx, big, o.x, box.y0 + (rows.length ? 4.3 : 9) * sc, Math.max(8, Math.min(3.1 * sc, (box.w - 1.2 * sc) / (Math.max(2, big.length) * 0.58))), { weight: 700, maxW: box.w - 1 * sc });
  rows.slice(0, 3).forEach((r, i) => put(ctx, ionText(r), o.x, box.y0 + (8.4 + i * 3.1) * sc, Math.max(5.8, 1.62 * sc), { color: DUST, maxW: box.w - 1 * sc }));
}

registerPiece('phacid', {
  kind: { r: 9, rect: CARD, nojoin: true },
  paint: paintCard,
  faceKey: p => `phacid|${p.label}|${(p.props.rows || []).join('/')}`,
  printed: p => ionText(p.label)
});

/* ------------------------------------------------------------------ the race */

const keyOf = (fid, a, b) => `race:${fid}:${a.id}|${b.id}`;

/** What the race holds: the two cards, the result for this very pair if it has been run, and the list of races run (latest last). */
export function raceRead(state, fid) {
  const f = state.fixtures[fid];
  const a = seatedIn(state, f.props.slotA); const b = seatedIn(state, f.props.slotB);
  const rows = (state.recorder?.rows || []).filter(r => String(r.label).startsWith(`race:${fid}:`));
  const log = [];
  for (const r of rows) {
    const [ia, ib] = r.label.slice(`race:${fid}:`.length).split('|');
    const i = log.findIndex(l => l.a === ia && l.b === ib);
    if (i >= 0) log.splice(i, 1);
    log.push({ a: ia, b: ib, n: r.y });
  }
  const now = a && b ? log.find(l => l.a === a.id && l.b === b.id) : null;
  return { a, b, crossed: now ? now.n : null, log };
}

function paintRace(ctx, f, state, bx) {
  const F = frameOf(bx);
  const r = raceRead(state, f.id);
  const sz = (k, m = 6) => F.size(k, m);
  put(ctx, 'Acid', F.x(COL.a), F.y(7), sz(2.4), { color: DUST, weight: 700 });
  put(ctx, 'Base it leaves', F.x(COL.b), F.y(7), sz(2.4), { color: DUST, weight: 700, maxW: F.len(40) });
  if (r.a) put(ctx, ionText(nameAcid(r.a)), F.x(COL.a), F.y(31), sz(2.8), { color: TEXT, weight: 700, maxW: F.len(40) });
  if (r.b) put(ctx, ionText(nameBase(r.b)), F.x(COL.b), F.y(31), sz(2.8), { color: TEXT, weight: 700, maxW: F.len(40) });
  const ready = r.a && r.b;
  const n = r.crossed ?? 0;
  const seeds = [3, 11];
  [[COL.a, SITES - n, 'On the acid'], [COL.b, n, 'On the base']].forEach(([cx, held, cap], k) => {
    const x = cx - WIN.s / 2;
    ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(WIN.y), F.len(WIN.s), F.len(WIN.s));
    ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(WIN.y)) + 0.5, Math.round(F.len(WIN.s)), Math.round(F.len(WIN.s)));
    const cells = cellGrid(SITES, 10, x + 0.6, WIN.y + 0.6, WIN.s - 1.2, WIN.s - 1.2);
    const without = ionizedCells(SITES, SITES - held, seeds[k]);
    cells.forEach((c, i) => ball(ctx, F.x(c.x), F.y(c.y), Math.max(1.4, F.len(Math.min(c.cw, c.ch) * 0.42)), without.has(i) ? BASE_INK : ACID_INK));
    put(ctx, ready || k === 0 ? `${cap}: ${held}` : `${cap}: 0`, F.x(cx), F.y(WIN.y + WIN.s + 3.4), sz(2.6), { color: ready && r.crossed != null ? AMBER : DIM, weight: 700, maxW: F.len(WIN.s + 12) });
  });
  // The list of races run, and what the colours mean.
  put(ctx, 'Races run', F.x(100), F.y(7), sz(2.4), { align: 'left', color: DUST, weight: 700 });
  put(ctx, 'Protons on the base, of 100', F.x(100), F.y(11), sz(1.9, 5.6), { align: 'left', color: DIM, maxW: F.len(64) });
  const names = id => { const c = state.pieces[id]; return c ? c : null; };
  r.log.slice(-6).forEach((l, i) => {
    const ca = names(l.a); const cb = names(l.b);
    if (!ca || !cb) return;
    put(ctx, `${ionText(nameAcid(ca))} + ${ionText(baseShort(cb))}`, F.x(100), F.y(16 + i * 4.2), sz(2.1, 5.8), { align: 'left', color: DUST, maxW: F.len(48) });
    put(ctx, String(l.n), F.x(163), F.y(16 + i * 4.2), sz(2.3, 6), { align: 'right', color: AMBER, weight: 700 });
  });
  ctx.fillStyle = ACID_INK; ctx.beginPath(); ctx.arc(F.x(100.8), F.y(47.5), F.len(0.9), 0, Math.PI * 2); ctx.fill();
  put(ctx, 'holds a proton', F.x(103), F.y(47.5), sz(1.9, 5.6), { align: 'left', color: DUST });
  ctx.fillStyle = BASE_INK; ctx.beginPath(); ctx.arc(F.x(100.8), F.y(51.5), F.len(0.9), 0, Math.PI * 2); ctx.fill();
  put(ctx, 'holds none', F.x(103), F.y(51.5), sz(1.9, 5.6), { align: 'left', color: DUST });
}

function run(state, fid) {
  const r = raceRead(state, fid);
  if (!r.a || !r.b) return { noop: 'Put a card in each place first.' };
  const n = raceCount(r.a.props.acid, r.b.props.acid, SITES);
  const label = keyOf(fid, r.a, r.b);
  return { x: (state.recorder?.rows || []).length + 1, y: n, label };
}

registerFixture('phrace', { paint: paintRace, run });

/** The proton race: returns `{ fixture, slots, size }`; add the slots to the stage's `zones.slots`. */
export function raceParts(id, at, { title = 'Proton race' } = {}) {
  const x0 = at.x - W / 2; const y0 = at.y - H / 2;
  const slotA = `${id}.a`; const slotB = `${id}.b`;
  const slot = (sid, cx) => ({ id: sid, label: ' ', at: { x: x0 + cx, y: y0 + 19.5 }, size: { w: 25, h: 19 } });
  return {
    fixture: {
      id, kind: 'phrace', label: title, runLabel: 'Race', at: { ...at }, size: { w: W, h: H }, dials: {},
      props: { backdrop: true, slotA, slotB }
    },
    slots: [slot(slotA, COL.a), slot(slotB, COL.b)],
    size: { w: W, h: H }
  };
}
