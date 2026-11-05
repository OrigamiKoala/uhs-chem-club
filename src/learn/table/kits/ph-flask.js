/**
 * kits/ph-flask.js — the flask and the pH meter, registered on the ph kit (`ph-registry.js`). Verdigris's first instrument (`q3-weak`).
 *
 *   FLASK   a flask holding one solution (an acid or a base from the tables, at a concentration). Its WINDOW is a magnified square of
 *           200 formula units drawn as spheres: hydronium amber, hydroxide blue, an acid grey, a base or the leftover of an acid green.
 *           Each cell is one unit of the solute; a unit that has let go of a proton (or taken one) shows as the two spheres it made.
 *           Water is not drawn. The count of such units is `round(200 × the fraction)` from the planner, so a share under one unit in
 *           200 shows none. Under the window a seat takes the meter.
 *   METER   the pH meter (a piece). Laid in a flask's seat it reads that flask's pH to two places from `phdata.js`; a flask with no seat
 *           has none. The flask keeps the last reading it was given, printed in the seat once the meter is lifted.
 *
 * A THIN WRAPPER over `engine/phdata.js` through `ph-read.js`: a painter decides nothing. The window is flat (a layer of units seen from
 * above, as the pans kit's pan is), and at `3D On` stands in a low glass dish (`dress3d`); the meter is a brass-edged solid with its face
 * toward the player (`piece3d`).
 */

import * as THREE from 'three';
import { PLATE_COLORS, mulberry32 } from '../../engine/plates.js';
import { roundedSlab } from '../../engine/table-props.js';
import { registerFixture, registerPiece } from './ph-registry.js';
import { frameOf } from './matter-draw.js';
import { fmt } from '../../engine/phdata.js';
import {
  flaskSol, flaskPH, windowOf, meterRead, concText, UNITS, H_INK, OH_INK, ACID_INK, BASE_INK, ionText, windowSpecies, ionizedCells, cellGrid, seedOf
} from './ph-read.js';
import './ph-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

/** The window's top edge, in units from the top of the flask's box (the name and the strength stand above it). */
const WIN_TOP = 11;

export { H_INK, OH_INK, ACID_INK, BASE_INK, ionText };

function font(ctx, size, weight = 500) { ctx.font = `${weight} ${Math.max(6, size)}px "Quantico", "JetBrains Mono", sans-serif`; }
export function put(ctx, s, x, y, size, { color = TEXT, align = 'center', weight = 500, maxW = null } = {}) {
  font(ctx, size, weight);
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  if (maxW) ctx.fillText(s, x, y, maxW); else ctx.fillText(s, x, y);
}

/** A sphere: a disc with a lighter spot, so it reads as a solid ball on the plate. */
export function ball(ctx, x, y, r, ink) {
  ctx.fillStyle = ink;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.32, r * 0.34, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
}

/* ------------------------------------------------------------------ the window */

function paintWindow(ctx, F, f, x, y, w, h) {
  const p = f.props;
  const win = windowOf(p);
  const sp = windowSpecies(win);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
  const cells = cellGrid(win.units, p.cols, x + 0.6, y + 0.6, w - 1.2, h - 1.2);
  const gone = ionizedCells(win.units, win.ionized, seedOf(p));
  const g = mulberry32(seedOf(p) + 99);
  cells.forEach((c, i) => {
    const jx = (g() - 0.5) * c.cw * 0.14; const jy = (g() - 0.5) * c.ch * 0.14;
    const R = Math.min(c.cw, c.ch) * 0.44;
    if (!gone.has(i)) { ball(ctx, F.x(c.x + jx), F.y(c.y + jy), Math.max(1.6, F.len(R)), sp.whole.ink); return; }
    const r = Math.max(1.4, F.len(R * 0.62));
    ball(ctx, F.x(c.x + jx) - r * 0.95, F.y(c.y + jy), r, sp.parts[0].ink);
    ball(ctx, F.x(c.x + jx) + r * 0.95, F.y(c.y + jy), r, sp.parts[1].ink);
  });
  return { win, sp };
}

/** The legend under the window: a swatch and a name for every species the window holds, wrapped to the flask's width. */
function paintLegend(ctx, F, f, sp, win, x, y, w) {
  const items = win.ionized > 0 ? [sp.parts[0], sp.parts[1]] : [];
  if (win.whole > 0) items.push(sp.whole);
  const size = F.size(1.9, 5.8);
  const sw = F.len(1.7);
  const u = F.len(1);
  let cx = x; let cy = y;
  for (const it of items) {
    const name = ionText(it.name);
    font(ctx, size, 500);
    const tu = (ctx.measureText(name).width + sw + F.len(2.4)) / u;
    if (cx + tu > x + w && cx > x) { cx = x; cy += 3.3; }
    ctx.fillStyle = it.ink; ctx.beginPath(); ctx.arc(F.x(cx) + sw / 2, F.y(cy), sw / 2, 0, Math.PI * 2); ctx.fill();
    put(ctx, name, F.x(cx) + sw + F.len(0.6), F.y(cy), size, { align: 'left', color: DUST });
    cx += tu;
  }
}

function paintFlask(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const w = f.size.w;
  // The strength of the solution, under the name the frame prints at the top left.
  put(ctx, concText(p.solute.c), F.x(2), F.y(8.2), F.size(2.7, 6.6), { align: 'left', color: TEXT, weight: 700 });
  const { win, sp } = paintWindow(ctx, F, f, 2, WIN_TOP, w - 4, p.wh);
  if (p.waterNote) put(ctx, 'water not drawn', F.x(w - 2), F.y(8.2), F.size(1.8, 5.6), { align: 'right', color: DIM });
  if (p.legend) paintLegend(ctx, F, f, sp, win, 2, WIN_TOP + p.wh + 3.2, w - 4);
  // The seat: the last reading the flask was given, until the meter is laid there.
  if (p.seat) {
    const m = meterRead(state, f.id);
    const s = p.seatRel;
    if (!m.meter) put(ctx, m.noted != null ? `pH ${fmt(m.noted, 2)}` : '', F.x(s.x), F.y(s.y), F.size(2.8, 6.8), { color: m.noted != null ? DUST : DIM, weight: 700 });
  }
}

/** The flask keeps the pH it was last read at (the planner's, to two places). Run after every action, from the table as it stands. */
function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'phflask' || !f.props.seat) continue;
    const m = meterRead(state, f.id);
    if (m.meter) f.props.noted = Math.round(flaskPH(f) * 100) / 100;
  }
}

registerFixture('phflask', { paint: paintFlask, settle, dress3d: dressFlask });

/** A low glass dish round the window at `3D On`: four thin walls, the particles seen through the open top. */
function dressFlask(f, state, c) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const p = f.props;
  const group = new T.Group();
  const w = f.size.w - 4; const h = p.wh;
  const cx = box.x0 + 2 + w / 2; const cy = box.y0 + WIN_TOP + h / 2;
  const t = 0.005; const H = 0.024;
  const wall = (lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    m.castShadow = false; m.receiveShadow = false;
    group.add(m);
  };
  wall(w * s + 2 * t, t, 0, -(h * s) / 2 - t / 2);
  wall(w * s + 2 * t, t, 0, (h * s) / 2 + t / 2);
  wall(t, h * s, -(w * s) / 2 - t / 2, 0);
  wall(t, h * s, (w * s) / 2 + t / 2, 0);
  return group;
}

/**
 * A flask for a stage. `solute` is `{ id, c, T? }` (`id` a key of `ACIDS` or `BASES`). Options: `label` (the name the frame prints),
 * `w`, `window` (the window's height in units), `meter: false` (no seat, no meter: the stage asks the player to work the pH out),
 * `legend: false`, `waterNote: false`. Returns `{ fixture, slot, size }`; add the slot (null without a meter) to the stage's slots.
 */
export function flaskFixture(id, at, { solute, label, w = 38, window = 14, meter = true, legend = true, waterNote = true, units = UNITS, cols = 20 } = {}) {
  const wh = window;
  // The legend takes one row on a flask wide enough for its three names, two on a narrow one.
  const legendRows = legend ? (w >= 40 ? 3.6 : 6.6) : 0;
  const seatH = meter ? 12.5 : 0;
  const h = Math.round((WIN_TOP + wh + 3.2 + legendRows + (meter ? 2 + seatH : 1)) * 10) / 10;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const seatRel = { x: w / 2, y: h - 1 - seatH / 2, w: Math.min(22, w - 4), h: seatH };
  const slot = meter ? { id: `${id}.seat`, label: ' ', at: { x: x0 + seatRel.x, y: y0 + seatRel.y }, size: { w: seatRel.w, h: seatRel.h } } : null;
  return {
    fixture: {
      id, kind: 'phflask', label: label ?? `${solute.id}`, at: { ...at }, size: { w, h }, noRun: true,
      dials: { x: { min: 0, max: 1, step: 1, value: 0, label: 'Flask' } },
      props: { hidden: ['x'], backdrop: true, solute: { ...solute }, units, cols, wh, legend, waterNote, seat: slot ? slot.id : null, seatRel, noted: null }
    },
    slot,
    size: { w, h }
  };
}

/* ------------------------------------------------------------------ the pH meter (a piece) */

const RECT_METER = { hw: 9.5, hh: 5.4 };

/** The flask a meter lies in (its seat's fixture id), or null. */
const seatFlask = (p, state) => {
  const m = /^slot:(.+)\.seat$/.exec(p.zone || '');
  return m ? state.fixtures[m[1]] : null;
};

function paintMeter(ctx, p, state, o) {
  const sc = o.sc;
  const x0 = o.x - RECT_METER.hw * sc; const y0 = o.y - RECT_METER.hh * sc; const w = RECT_METER.hw * 2 * sc; const h = RECT_METER.hh * 2 * sc;
  ctx.fillStyle = '#2a2620'; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : DUST; ctx.lineWidth = o.lit ? 2 : 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  put(ctx, 'pH meter', o.x, y0 + 2.1 * sc, Math.max(6.4, 1.9 * sc), { color: DUST, weight: 700, maxW: w - 1.6 * sc });
  const fl = seatFlask(p, state);
  const reading = fl ? fmt(flaskPH(fl), 2) : '—';
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x0 + 1.2 * sc, y0 + 3.9 * sc, w - 2.4 * sc, h - 5.1 * sc);
  put(ctx, reading, o.x, y0 + 7.4 * sc, Math.max(9, 3.8 * sc), { color: fl ? AMBER : DIM, weight: 700, maxW: w - 3.4 * sc });
}

/** The meter: a brass-edged case with a probe, its display facing the player. */
function pieceMeter3d(p, state, c) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const H = 0.03;
  const body = new THREE.Mesh(roundedSlab(hw * 2, hh * 2, H, Math.min(hw, hh) * 0.2, 0.003), m.labCast);
  body.castShadow = true; body.receiveShadow = true; g.add(body);
  const rim = new THREE.Mesh(roundedSlab(hw * 2 * 0.97, hh * 2 * 0.94, 0.006, Math.min(hw, hh) * 0.18, 0.002), m.labBrass);
  rim.position.y = H; rim.castShadow = true; g.add(rim);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.9, hh * 2 * 0.84), c.face());
  face.rotation.x = -Math.PI / 2; face.position.y = H + 0.0068; face.receiveShadow = true; g.add(face);
  const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, hw * 1.1, 10), m.labBrass);
  probe.rotation.z = Math.PI / 2; probe.position.set(-hw - hw * 0.5, 0.008, 0); probe.castShadow = true; g.add(probe);
  g.userData.height = H + 0.007;
  return g;
}

registerPiece('phmeter', {
  kind: { r: 8, rect: RECT_METER, nojoin: true },
  paint: paintMeter,
  faceKey: (p, state) => { const fl = seatFlask(p, state); return `phmeter|${fl ? fmt(flaskPH(fl), 2) : '-'}`; },
  piece3d: pieceMeter3d,
  printed: () => 'pH meter'
});

/** The pH meter, loose on the table at `at`. It carries the caption that says what it does. */
export const meterPiece = (id, at, extra = {}) => ({ id, kind: 'phmeter', label: 'pH meter', at, props: {}, caption: 'Lay it on a flask to read its pH.', ...extra });

export { flaskSol };
