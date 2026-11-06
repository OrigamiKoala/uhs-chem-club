/**
 * kits/cell-rig.js — the ready-built cell, registered on the cell kit (`cell-registry.js`). Brinewire's `q4-potential` (and, later, the
 * galvanic and under-load benches).
 *
 *   RIG   two beakers, each holding one metal in a solution of its own ions at 1.00 M, a salt bridge between them and a wire over the top
 *         through a voltmeter and a lamp. The "Run" key wires the cell up and reads it. The voltmeter shows the RIGHT electrode against the
 *         LEFT one (printed on the rig), with its sign; the lamp is lit when the reading is above zero. With `energy` the rig also counts
 *         the energy the reaction releases (kJ for the equation as written); with `scalable` a dial writes the equation once or twice over,
 *         and every setting that has been run keeps a line, so two settings can be compared.
 *
 * A THIN WRAPPER over `engine/celldata.js`: the reading is `cellE0(right, left)`, the energy `-deltaG0(V, n)`. Flat, like the board; each beaker
 * stands in a low glass dish at `3D On`.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './cell-registry.js';
import { frameOf } from './matter-draw.js';
import { METALS, cellE0, electronsMoved, deltaG0, fmt } from '../../engine/celldata.js';
import { voltText } from './cell-read.js';
import { put, METAL_INK } from './cell-board.js';
import './cell-rig-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

export const RIG_UNIT = Object.freeze({ cup: { w: 12, h: 12 } });

/** The equation as arranged: the left metal gives its electrons to the right metal's ion, written `k` times over. */
export function equationOf(leftId, rightId, k = 1) {
  const L = METALS[leftId]; const R = METALS[rightId];
  const n = electronsMoved(leftId, rightId);
  const a = (n / L.n) * k; const c = (n / R.n) * k;
  const co = x => (x === 1 ? '' : String(x));
  return `${co(a)}${L.symbol} + ${co(c)}${R.ion} → ${co(a)}${L.ion} + ${co(c)}${R.symbol}`;
}

/** What the rig reads at a setting: the voltage of right against left, the electrons moved, the energy released, the lamp. */
export function rigAt(f, scale = 1) {
  const V = cellE0(f.props.right, f.props.left);
  const n = electronsMoved(f.props.left, f.props.right) * scale;
  const lit = V > 1e-9;
  const kJ = lit ? -deltaG0(V, n) : 0;
  return { V, n, lit, kJ, eqn: equationOf(f.props.left, f.props.right, scale) };
}

/** The rig's state: which settings have been run, and the last one. */
export function rigRead(state, fid) {
  const f = state.fixtures[fid];
  const rows = [];
  for (const s of [1, 2]) if (Math.round(f.dials[`r${s}`]?.value ?? 0) === 1) rows.push({ scale: s, ...rigAt(f, s) });
  const last = Math.round(f.dials.last?.value ?? 0);
  const now = last ? rigAt(f, last) : null;
  return { f, rows, last, now, scale: Math.round(f.dials.scale?.value ?? 1) };
}

function beakerAt(ctx, F, x, y, w, h, liquid) {
  ctx.fillStyle = liquid; ctx.fillRect(F.x(x + 0.5), F.y(y + h * 0.3), F.len(w - 1), F.len(h * 0.7 - 0.5));
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.35));
  ctx.beginPath(); ctx.moveTo(F.x(x), F.y(y)); ctx.lineTo(F.x(x), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y)); ctx.stroke();
  ctx.lineWidth = 1;
}

function paintRig(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = rigRead(state, f.id);
  const { cup } = RIG_UNIT;
  const L = METALS[p.left]; const R = METALS[p.right];
  const lx = p.lx; const rx = p.rx; const cy = p.cy;
  beakerAt(ctx, F, lx, cy, cup.w, cup.h, '#2f4a47');
  beakerAt(ctx, F, rx, cy, cup.w, cup.h, '#2f4a47');
  // The electrodes: a bar of each metal standing in its beaker.
  for (const [x, id] of [[lx, p.left], [rx, p.right]]) {
    ctx.fillStyle = METAL_INK[id] || '#9a9690';
    ctx.fillRect(F.x(x + cup.w / 2 - 1.2), F.y(cy - 5), F.len(2.4), F.len(cup.h * 0.9 + 5));
  }
  // The salt bridge: a U of glass between the beakers.
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(2, F.len(0.9));
  ctx.beginPath(); ctx.moveTo(F.x(lx + cup.w - 2), F.y(cy + cup.h * 0.5)); ctx.lineTo(F.x(lx + cup.w - 2), F.y(cy - 1)); ctx.lineTo(F.x(rx + 2), F.y(cy - 1)); ctx.lineTo(F.x(rx + 2), F.y(cy + cup.h * 0.5)); ctx.stroke();
  ctx.lineWidth = 1;
  // The wire over the top through the voltmeter.
  const m = p.meter;
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.2, F.len(0.3));
  ctx.beginPath(); ctx.moveTo(F.x(lx + cup.w / 2), F.y(cy - 5)); ctx.lineTo(F.x(lx + cup.w / 2), F.y(m.y + m.h / 2)); ctx.lineTo(F.x(m.x), F.y(m.y + m.h / 2)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(F.x(rx + cup.w / 2), F.y(cy - 5)); ctx.lineTo(F.x(rx + cup.w / 2), F.y(m.y + m.h / 2)); ctx.lineTo(F.x(m.x + m.w), F.y(m.y + m.h / 2)); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(m.x), F.y(m.y), F.len(m.w), F.len(m.h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(m.x)) + 0.5, Math.round(F.y(m.y)) + 0.5, Math.round(F.len(m.w)), Math.round(F.len(m.h)));
  put(ctx, r.now ? `${voltText(r.now.V)} V` : '—', F.x(m.x + m.w / 2), F.y(m.y + m.h / 2), F.size(3.8, 9), { color: r.now ? AMBER : DIM, weight: 700, maxW: F.len(m.w - 2) });
  // The lamp.
  const lamp = { x: m.x + m.w + 4, y: m.y + m.h / 2 };
  ctx.fillStyle = r.now && r.now.lit ? AMBER : '#26231d';
  ctx.beginPath(); ctx.arc(F.x(lamp.x), F.y(lamp.y), Math.max(3, F.len(1.9)), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = STEEL; ctx.stroke();
  put(ctx, 'Lamp', F.x(lamp.x), F.y(lamp.y + 4), F.size(1.9, 5.6), { color: DUST });
  // The names under the beakers.
  put(ctx, L.symbol, F.x(lx + cup.w / 2), F.y(cy + cup.h + 2.6), F.size(2.8, 7), { color: TEXT, weight: 700 });
  put(ctx, R.symbol, F.x(rx + cup.w / 2), F.y(cy + cup.h + 2.6), F.size(2.8, 7), { color: TEXT, weight: 700 });
  put(ctx, `${L.ion} 1.00 M`, F.x(lx + cup.w / 2), F.y(cy + cup.h + 5.8), F.size(1.9, 5.6), { color: DUST, maxW: F.len(cup.w + 8) });
  put(ctx, `${R.ion} 1.00 M`, F.x(rx + cup.w / 2), F.y(cy + cup.h + 5.8), F.size(1.9, 5.6), { color: DUST, maxW: F.len(cup.w + 8) });
  put(ctx, 'right against left', F.x(m.x + m.w / 2), F.y(m.y - 2.2), F.size(1.9, 5.6), { color: DUST });
  // The written equation, the energy counter and the settings run so far.
  if (p.equation) {
    const e = r.rows.length && r.last ? rigAt(f, r.last).eqn : rigAt(f, r.scale).eqn;
    put(ctx, e, F.x(f.size.w / 2), F.y(p.eqY), F.size(2.6, 6.8), { color: TEXT, maxW: F.len(f.size.w - 3) });
  }
  if (p.energy) {
    r.rows.forEach((row, i) => {
      const y = p.logY + i * 4;
      put(ctx, `Written ×${row.scale}`, F.x(3), F.y(y), F.size(2.4, 6.4), { align: 'left', color: DUST });
      put(ctx, `${voltText(row.V)} V`, F.x(f.size.w * 0.52), F.y(y), F.size(2.6, 6.8), { align: 'center', color: AMBER, weight: 700 });
      put(ctx, `${fmt(row.kJ, 0)} kJ released`, F.x(f.size.w - 3), F.y(y), F.size(2.6, 6.8), { align: 'right', color: AMBER, weight: 700 });
    });
  }
}

/** The key wires the cell and records the setting that was run: the reading is the planner's, so it is the same at every setting it should be. */
function run(state, fid) {
  const f = state.fixtures[fid];
  const scale = Math.round(f.dials.scale?.value ?? 1);
  const a = rigAt(f, scale);
  const dials = { last: scale, [`r${scale}`]: 1 };
  return { x: scale, y: Math.round(a.V * 100) / 100, label: fid, dials: { [fid]: dials } };
}

function dressRig(f, state, c) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const p = f.props; const { cup } = RIG_UNIT;
  const group = new T.Group();
  const H = 0.024; const t = 0.005;
  const wall = (cx, cy, lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    m.castShadow = false; m.receiveShadow = false;
    group.add(m);
  };
  for (const x of [p.lx, p.rx]) {
    const w = cup.w * s; const d = cup.h * s;
    const cx = box.x0 + x + cup.w / 2; const cy = box.y0 + p.cy + cup.h / 2;
    wall(cx, cy, w + 2 * t, t, 0, -d / 2 - t / 2);
    wall(cx, cy, w + 2 * t, t, 0, d / 2 + t / 2);
    wall(cx, cy, t, d, -w / 2 - t / 2, 0);
    wall(cx, cy, t, d, w / 2 + t / 2, 0);
  }
  return group;
}

registerFixture('cellrig', { paint: paintRig, run, dress3d: dressRig });

/**
 * A ready-built cell with metal ids `left` and `right` (keys of `METALS`). Options: `energy` (count the energy released), `equation` (print the
 * equation as arranged), `scalable` (a dial writes it once or twice over), `w`, `title`. Layout is fixed; `w` 44 is the smallest.
 */
export function rigFixture(id, at, { left, right, energy = false, equation = false, scalable = false, w = null, title = null } = {}) {
  const { cup } = RIG_UNIT;
  const width = w ?? (energy ? 70 : 46);
  const oy = scalable ? 11 : 0;
  const cy = (equation ? 24 : 20) + oy;
  const extra = (equation ? 6 : 0) + (energy ? 13 : 0);
  const h = Math.round((cy + cup.h + 9 + extra + 8) * 10) / 10;
  const lx = 4; const rx = width - 4 - cup.w;
  const mw = Math.min(22, width - 2 * 4 - 2 * 8);
  const meter = { x: (width - mw) / 2 - 3, y: 4 + oy, w: mw, h: 7.4 };
  const dials = {
    last: { min: 0, max: 2, step: 1, value: 0, label: 'Last run' },
    r1: { min: 0, max: 1, step: 1, value: 0, label: 'Run at 1' },
    r2: { min: 0, max: 1, step: 1, value: 0, label: 'Run at 2' },
    ...(scalable ? { scale: { min: 1, max: 2, step: 1, value: 1, label: 'Equation written', labels: ['once', 'twice over'] } } : {})
  };
  return {
    id, kind: 'cellrig', label: title ?? `${METALS[left].symbol} and ${METALS[right].symbol}`, at: { ...at }, size: { w: width, h }, runLabel: 'Run',
    dials,
    props: { hidden: ['last', 'r1', 'r2'], backdrop: true, left, right, lx, rx, cy, meter, equation, energy, eqY: cy + cup.h + 11, logY: cy + cup.h + 16, scalable }
  };
}
