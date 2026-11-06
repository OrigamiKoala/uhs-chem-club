/**
 * kits/cell-board.js — the potential board and its electrodes, registered on the cell kit (`cell-registry.js`). Brinewire's `q4-potential`.
 *
 *   BOARD      a hydrogen reference half-cell on the left and, beside it, a half-cell with a seat for an electrode. A voltmeter between them
 *              reads the seated metal against the reference, in volts, with its sign. Under the reading the board prints the half-reaction
 *              of the seated metal (so the electrons it carries are in the picture). A strip keeps every reading the board has taken, one
 *              line for each electrode that has been seated, so two readings can be compared after the first electrode is lifted out.
 *   ELECTRODE  a bar of one metal, named on its face (or "Metal A" on a sealed stage). Laid in the seat it is read.
 *
 * A THIN WRAPPER over `engine/celldata.js` through `cell-read.js`: a painter decides nothing. The face is flat (a meter reads a number);
 * at `3D On` the electrodes are metal bars and each half-cell stands in a low glass dish (`dress3d`).
 */

import * as THREE from 'three';
import { PLATE_COLORS } from '../../engine/plates.js';
import { roundedSlab } from '../../engine/table-props.js';
import { metalTint } from '../../engine/lab-props.js';
import { registerFixture, registerPiece } from './cell-registry.js';
import { frameOf } from './matter-draw.js';
import { seatedIn } from './heat-read.js';
import { METALS, HYDROGEN } from '../../engine/celldata.js';
import { voltText, halfText, halfCellReading } from './cell-read.js';
import './cell-board-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

function font(ctx, size, weight = 500) { ctx.font = `${weight} ${Math.max(6, size)}px "Quantico", "JetBrains Mono", sans-serif`; }
export function put(ctx, s, x, y, size, { color = TEXT, align = 'center', weight = 500, maxW = null } = {}) {
  font(ctx, size, weight);
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  if (maxW) ctx.fillText(s, x, y, maxW); else ctx.fillText(s, x, y);
}

/** Ink of each metal's bar, for the flat face. */
export const METAL_INK = Object.freeze({
  mg: '#b4b6b0', al: '#bcc0c2', zn: '#8f9ca4', fe: '#7a7a78', ni: '#a8aba5', sn: '#b6b9bb', pb: '#7e7d84', cu: '#b66a3e', ag: '#cfd0cc', au: '#c9a43a'
});

const RECT_BAR = { hw: 7.6, hh: 3.5 };

/** The metal of a seated electrode piece (or null). */
export const seatedMetal = (state, slotId) => {
  const p = seatedIn(state, slotId);
  return p ? { piece: p, id: p.props.metal } : null;
};

/** What the board reads: the seated electrode, its reading against the reference and the strip of readings taken. */
export function boardRead(state, fid) {
  const f = state.fixtures[fid];
  const s = seatedMetal(state, f.props.seat);
  const E = s ? halfCellReading(s.id) : null;
  return { f, seated: s, E, strip: f.props.noted || [] };
}

/* ------------------------------------------------------------------ the board */

function beaker(ctx, F, x, y, w, h, liquid) {
  ctx.fillStyle = liquid;
  ctx.fillRect(F.x(x + 0.5), F.y(y + h * 0.28), F.len(w - 1), F.len(h * 0.72 - 0.5));
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.35));
  ctx.beginPath(); ctx.moveTo(F.x(x), F.y(y)); ctx.lineTo(F.x(x), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y)); ctx.stroke();
  ctx.lineWidth = 1;
}

function paintBoard(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = boardRead(state, f.id);
  const w = f.size.w;
  // The reference half-cell (left): a platinum strip in acid with hydrogen bubbling over it.
  beaker(ctx, F, p.refAt.x, p.refAt.y, p.cup.w, p.cup.h, '#2f3d4a');
  ctx.fillStyle = '#d8d2c4'; ctx.fillRect(F.x(p.refAt.x + p.cup.w / 2 - 0.9), F.y(p.refAt.y - 3), F.len(1.8), F.len(p.cup.h * 0.8 + 3));
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(F.x(p.refAt.x + p.cup.w / 2 + 3 + (i % 2) * 2.6), F.y(p.refAt.y + p.cup.h * 0.6 - i * 3.2), Math.max(1.4, F.len(0.7)), 0, Math.PI * 2); ctx.stroke(); }
  put(ctx, 'Hydrogen reference', F.x(p.refAt.x + p.cup.w / 2), F.y(p.refAt.y + p.cup.h + 2.8), F.size(2.2, 6.2), { color: DUST, weight: 700, maxW: F.len(p.cup.w + 6) });
  put(ctx, 'H₂ gas, 1.00 M H⁺', F.x(p.refAt.x + p.cup.w / 2), F.y(p.refAt.y + p.cup.h + 6), F.size(2.0, 5.8), { color: DUST, maxW: F.len(p.cup.w + 8) });
  // The metal half-cell: an empty cup with the seat over it.
  beaker(ctx, F, p.metalAt.x, p.metalAt.y, p.cup.w, p.cup.h, '#2f4a47');
  put(ctx, 'Metal half-cell', F.x(p.metalAt.x + p.cup.w / 2), F.y(p.metalAt.y + p.cup.h + 2.8), F.size(2.2, 6.2), { color: DUST, weight: 700, maxW: F.len(p.cup.w + 6) });
  put(ctx, '1.00 M of its ions', F.x(p.metalAt.x + p.cup.w / 2), F.y(p.metalAt.y + p.cup.h + 6), F.size(2.0, 5.8), { color: DUST, maxW: F.len(p.cup.w + 8) });
  // A wire from each half-cell up to the voltmeter.
  const my = p.meter.y + p.meter.h;
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.2, F.len(0.3));
  ctx.beginPath(); ctx.moveTo(F.x(p.refAt.x + p.cup.w / 2), F.y(p.refAt.y - 3)); ctx.lineTo(F.x(p.refAt.x + p.cup.w / 2), F.y(my)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(F.x(p.metalAt.x + p.cup.w / 2), F.y(p.metalAt.y - 5)); ctx.lineTo(F.x(p.metalAt.x + p.cup.w / 2), F.y(my)); ctx.stroke();
  ctx.lineWidth = 1;
  // The voltmeter.
  const m = p.meter;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(m.x), F.y(m.y), F.len(m.w), F.len(m.h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(m.x)) + 0.5, Math.round(F.y(m.y)) + 0.5, Math.round(F.len(m.w)), Math.round(F.len(m.h)));
  put(ctx, 'Voltmeter', F.x(m.x + 2), F.y(m.y + 2.2), F.size(2.0, 6), { align: 'left', color: DUST, weight: 700 });
  put(ctx, r.E == null ? '—' : `${voltText(r.E)} V`, F.x(m.x + m.w / 2), F.y(m.y + m.h * 0.62), F.size(4.6, 11), { color: r.E == null ? DIM : AMBER, weight: 700, maxW: F.len(m.w - 3) });
  // The half-reaction of the seated metal, under the meter, unless the stage keeps the metal sealed.
  if (r.seated && !r.seated.piece.props.sealed) put(ctx, halfText(r.seated.id), F.x(m.x + m.w / 2), F.y(m.y + m.h + 3), F.size(2.2, 6.4), { color: DUST, maxW: F.len(m.w + 8) });
  // The strip of readings taken so far.
  if (p.strip) {
    const s = p.stripRect;
    ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(s.x), F.y(s.y), F.len(s.w), F.len(s.h));
    ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(s.x)) + 0.5, Math.round(F.y(s.y)) + 0.5, Math.round(F.len(s.w)), Math.round(F.len(s.h)));
    put(ctx, 'Readings taken', F.x(s.x + 2), F.y(s.y + 2.4), F.size(2.0, 6), { align: 'left', color: DUST, weight: 700 });
    r.strip.forEach((row, i) => {
      const y = s.y + 6.4 + i * 3.6;
      put(ctx, row.name, F.x(s.x + 2), F.y(y), F.size(2.4, 6.6), { align: 'left', color: TEXT });
      put(ctx, `${voltText(row.E)} V`, F.x(s.x + s.w - 2), F.y(y), F.size(2.4, 6.6), { align: 'right', color: AMBER, weight: 700 });
    });
  }
}

/** The board keeps the reading of every electrode it has had in the seat, one line each, in the order they were read. */
function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'cellboard') continue;
    const s = seatedMetal(state, f.props.seat);
    if (!s) continue;
    const name = s.piece.label;
    const E = Math.round(halfCellReading(s.id) * 100) / 100;
    const noted = f.props.noted || (f.props.noted = []);
    if (!noted.some(n => n.name === name)) noted.push({ name, E });
  }
}

/** Low glass dishes round the two half-cells at `3D On`. */
function dressBoard(f, state, c) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const p = f.props;
  const group = new T.Group();
  const H = 0.026; const t = 0.005;
  const wall = (cx, cy, lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    m.castShadow = false; m.receiveShadow = false;
    group.add(m);
  };
  for (const at of [p.refAt, p.metalAt]) {
    const w = p.cup.w * s; const d = p.cup.h * s;
    const cx = box.x0 + at.x + p.cup.w / 2; const cy = box.y0 + at.y + p.cup.h / 2;
    wall(cx, cy, w + 2 * t, t, 0, -d / 2 - t / 2);
    wall(cx, cy, w + 2 * t, t, 0, d / 2 + t / 2);
    wall(cx, cy, t, d, -w / 2 - t / 2, 0);
    wall(cx, cy, t, d, w / 2 + t / 2, 0);
  }
  return group;
}

registerFixture('cellboard', { paint: paintBoard, settle, dress3d: dressBoard });

/**
 * The potential board. `seat` is its slot id (the stage adds the returned `slot`); `strip: false` leaves the readings strip off. The
 * layout is fixed: reference cup and metal cup 14 by 15 units, voltmeter centred between them above the cups, strip at the right.
 * Returns `{ fixture, slot, size }`.
 */
export function boardFixture(id, at, { strip = true, title = 'Potential board' } = {}) {
  const w = strip ? 92 : 62; const h = 50;
  const cup = { w: 14, h: 15 };
  const refAt = { x: 5, y: 26 };
  const metalAt = { x: 34, y: 26 };
  const meter = { x: 8, y: 3, w: 38, h: 12 };
  const stripRect = { x: 62, y: 3, w: 28, h: 44 };
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const slot = { id: `${id}.seat`, label: ' ', at: { x: x0 + metalAt.x + cup.w / 2, y: y0 + metalAt.y - 1 }, size: { w: 18, h: 9 } };
  return {
    fixture: {
      id, kind: 'cellboard', label: title, at: { ...at }, size: { w, h }, noRun: true,
      dials: { x: { min: 0, max: 1, step: 1, value: 0, label: 'Board' } },
      props: { hidden: ['x'], backdrop: true, seat: slot.id, refAt, metalAt, cup, meter, strip, stripRect, noted: [] }
    },
    slot,
    size: { w, h }
  };
}

/* ------------------------------------------------------------------ the electrode */

function paintBar(ctx, p, state, o) {
  const sc = o.sc;
  const x0 = o.x - RECT_BAR.hw * sc; const y0 = o.y - RECT_BAR.hh * sc; const w = RECT_BAR.hw * 2 * sc; const h = RECT_BAR.hh * 2 * sc;
  ctx.fillStyle = p.props.sealed ? '#8a8780' : (METAL_INK[p.props.metal] || '#9a9690'); ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : STEEL; ctx.lineWidth = o.lit ? 2 : 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  put(ctx, p.label, o.x, o.y, Math.max(8, Math.min(3.4 * sc, (w - 1.4 * sc) / (Math.max(2, p.label.length) * 0.6))), { color: '#16140f', weight: 700, maxW: w - 1.2 * sc });
}

const BAR_MATS = new WeakMap();
function barMaterial(mats, id, sealed) {
  let byId = BAR_MATS.get(mats);
  if (!byId) { byId = new Map(); BAR_MATS.set(mats, byId); }
  const key = sealed ? 'sealed' : id;
  if (!byId.has(key)) {
    const m = mats.labSteel.clone();
    m.color = new THREE.Color(sealed ? 0x8a8780 : metalTint(METALS[id].symbol));
    byId.set(key, m);
  }
  return byId.get(key);
}

/** An electrode at `3D On`: a bar of the metal with a flat face for its name, lying on the plate. */
function pieceBar3d(p, state, c) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const H = 0.018;
  const body = new THREE.Mesh(roundedSlab(hw * 2, hh * 2, H, Math.min(hw, hh) * 0.2, 0.002), barMaterial(m, p.props.metal, p.props.sealed));
  body.castShadow = true; body.receiveShadow = true; g.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.92, hh * 2 * 0.8), c.face());
  face.rotation.x = -Math.PI / 2; face.position.y = H + 0.0012; face.receiveShadow = true; g.add(face);
  g.userData.height = H + 0.002;
  return g;
}

registerPiece('cellelectrode', {
  kind: { r: 7.6, rect: RECT_BAR, nojoin: true },
  paint: paintBar,
  faceKey: p => `cellelectrode|${p.label}|${p.props.metal}|${p.props.sealed ? 1 : 0}`,
  piece3d: pieceBar3d,
  printed: p => p.label
});

/**
 * An electrode of one metal (a key of `METALS`). `label` is what its face says (its symbol by default, "Metal A" when `sealed`, which also
 * keeps the board from printing the metal's half-reaction).
 */
export const electrodePiece = (id, metal, at, { label = null, sealed = false, caption = null } = {}) => ({
  id, kind: 'cellelectrode', label: label ?? METALS[metal].symbol, at, props: { metal, sealed },
  caption: caption ?? 'Lay it in the seat.'
});

export { HYDROGEN };
