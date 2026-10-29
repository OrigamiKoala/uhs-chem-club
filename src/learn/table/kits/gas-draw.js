/**
 * kits/gas-draw.js — What the gas kit's pieces and fixtures look like.
 *
 * The drawn tabletop (`engine/table2d.js` `drawTable`) and the built one (`engine/table3d.js`) call THESE functions with the same
 * arguments, so a tank, a statement card and a cylinder are one picture in both views. Every figure printed is read from
 * `gas-read.js`, which asks `gasdata.js`; a painter decides nothing.
 *
 * THE PICTURE IS HONEST (it was the old gas rig's rule and it stays): the cylinder's barrel is as long as the room in it, so the
 * piston stands where the volume says; it holds one dot per twelfth of a mole, so twice the gas is twice the dots; a dot's streak
 * is as long as the gas's mean speed at that temperature; a gas in a common tank is told by a stencilled shape, never by colour.
 *
 * SCOURED PLATE: phosphor and dust on a recessed plate, hairline rims, nothing blooms.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import {
  rigRead, valueOf, speedScreen, tallestBar, shareAbove, tankRead, commonRead, partialOf, scaleRead, pinholeRead, tubeRead, walkRead,
  markerRead, seatedIn, GASES, sig, litres, speeds, speedBins, recordCurve, kPaToAtm, kPaToMmHg, ATM_KPA, secondsOf, boxRead
} from './gas-read.js';

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

/** The cards, tokens and tools the kit's pieces are drawn as (half widths and heights, in table units). */
export const RECTS = Object.freeze({
  stmt: { hw: 17, hh: 5 },
  num: { hw: 8, hh: 4.6 },
  curve: { hw: 12.5, hh: 9.5 },
  hist: { hw: 11, hh: 9.5 },
  pellet: { hw: 7.5, hh: 4.8 },
  chip: { hw: 8, hh: 4.2 }
});

/** The shape stencilled on a particle of each gas in a common tank, in the order the gases first appear. */
export const SHAPES = ['circle', 'square', 'triangle', 'diamond'];

function shape(ctx, kind, x, y, r) {
  ctx.beginPath();
  if (kind === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (kind === 'square') ctx.rect(x - r, y - r, r * 2, r * 2);
  else if (kind === 'triangle') { ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x + r * 1.1, y + r * 0.85); ctx.lineTo(x - r * 1.1, y + r * 0.85); ctx.closePath(); }
  else { ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r * 1.1, y); ctx.lineTo(x, y + r * 1.2); ctx.lineTo(x - r * 1.1, y); ctx.closePath(); }
  ctx.fill();
}

/** The same pseudo-random sequence every time for a name: a dot stays where it was. */
function seeded(name) {
  let a = 2166136261 >>> 0;
  for (const ch of String(name)) a = Math.imul(a ^ ch.charCodeAt(0), 16777619) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

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

/** What a tank's face shows: its name, its gas (unless it is sealed), its gauge and, once weighed, its mass. */
export function tankFace(p) {
  const pr = p.props;
  const rd = tankRead(p);
  const gas = Array.isArray(pr.parts) ? pr.parts.map(x => GASES[x.gas].sym).join('') : GASES[pr.gas].sym;
  return {
    name: p.label,
    gas: pr.sealed ? '?' : gas,
    gauge: pr.noGauge ? '' : `${sig(rd.P, 3)} kPa`,
    plate: pr.partsPlate && Array.isArray(pr.parts) ? pr.parts.map(x => `${GASES[x.gas].sym} ${sig(x.n, 2)}`).join(' · ') : pr.plate ? `${litres(rd.V)} L · ${Math.round(rd.T)} K` : '',
    mass: pr.mass != null ? `${sig(pr.mass, 3)} g` : '',
    amount: pr.showAmount ? `${sig(rd.n, 3)} mol` : ''
  };
}

function paintTank(ctx, p, state, o) {
  const f = tankFace(p);
  const r = o.r;
  // The body: a plate disc with a heavy rim, and a gauge arc round its top.
  ctx.fillStyle = '#2a2620';
  ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = o.lit ? AMBER : DUST;
  ctx.lineWidth = o.lit ? 2 : 1.4;
  ctx.stroke();
  ctx.strokeStyle = DIM;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(o.x, o.y, r * 0.8, Math.PI * 0.85, Math.PI * 2.15); ctx.stroke();
  const rd = tankRead(p);
  const frac = Math.min(1, rd.P / (p.props.gaugeMax || 600));
  ctx.strokeStyle = PHOS;
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  ctx.beginPath(); ctx.arc(o.x, o.y, r * 0.8, Math.PI * 0.85, Math.PI * (0.85 + 1.3 * frac)); ctx.stroke();
  ctx.lineWidth = 1;
  const big = Math.max(6.5, r * 0.34);
  say(ctx, f.name, o.x, o.y - r * 0.5, big, { align: 'center', weight: 700, maxW: r * 1.6 });
  say(ctx, f.gas, o.x, o.y - r * 0.12, Math.max(7, r * 0.4), { align: 'center', weight: 700, color: PHOS, maxW: r * 1.4 });
  if (f.gauge) say(ctx, f.gauge, o.x, o.y + r * 0.24, Math.max(6, r * 0.26), { align: 'center', color: DUST, maxW: r * 1.4 });
  const low = f.mass || f.amount || f.plate;
  if (low) say(ctx, low, o.x, o.y + r * 0.52, Math.max(6, r * 0.22), { align: 'center', color: f.mass ? AMBER : DIM, weight: f.mass ? 700 : 500, maxW: r * 1.35 });
}

/** Words broken into at most two lines of `cap` characters. */
export const STMT_CAP = 24;
export function wrap(text, cap = STMT_CAP) {
  const words = String(text).split(/\s+/);
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (!cur || (cur + ' ' + w).length <= cap) lines[lines.length - 1] = cur ? `${cur} ${w}` : w;
    else lines.push(w);
  }
  return lines.length <= 2 ? lines : [lines.slice(0, lines.length - 1).join(' ').slice(0, cap), lines[lines.length - 1]];
}

function paintStmt(ctx, p, state, o) {
  const marked = Boolean(p.props.flipped);
  const box = slab(ctx, o, RECTS.stmt, marked ? '#33290f' : '#2a2620');
  if (marked) { ctx.strokeStyle = AMBER; ctx.lineWidth = 2; ctx.strokeRect(box.x0 + 1.5, box.y0 + 1.5, box.w - 3, box.h - 3); ctx.lineWidth = 1; }
  const size = Math.max(6.2, 2.1 * o.sc);
  const lines = wrap(p.label, STMT_CAP);
  lines.forEach((ln, i) => say(ctx, ln, o.x, o.y + (i - (lines.length - 1) / 2) * size * 1.2, size, { align: 'center', weight: 600, maxW: box.w - 3 * o.sc, color: marked ? AMBER : PLATE_COLORS.text }));
}

function paintNum(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.num);
  say(ctx, p.label, o.x, o.y, Math.max(7, 2.8 * o.sc), { align: 'center', weight: 700, maxW: box.w - 2 * o.sc });
}

function paintChip(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.chip, '#1d1a16');
  say(ctx, p.label, o.x, o.y, Math.max(6.5, 2.1 * o.sc), { align: 'center', weight: 700, maxW: box.w - 2 * o.sc });
}

function paintPellet(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.pellet, '#1d1a16');
  say(ctx, p.label, o.x, box.y0 + 2.1 * o.sc, Math.max(6, 1.9 * o.sc), { align: 'center', weight: 700, maxW: box.w - 2 * o.sc });
  ctx.fillStyle = '#6f6a5e';
  ctx.beginPath(); ctx.ellipse(o.x, o.y + 1.6 * o.sc, 2.6 * o.sc, 1.7 * o.sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = DUST;
  ctx.stroke();
}

/** A plotted curve on a card: the axes, the curve of the ideal law with the other quantities held, and what is on each axis. */
function paintCurve(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.curve, '#16140f');
  const spec = p.props.curve;
  const sc = o.sc;
  say(ctx, p.label, box.x0 + 1.3 * sc, box.y0 + 1.9 * sc, Math.max(6, 1.9 * sc), { weight: 700, maxW: box.w - 2 * sc });
  const px = box.x0 + 2.2 * sc;
  const py = box.y0 + 3.9 * sc;
  const pw = box.w - 4 * sc;
  const ph = box.h - 8.2 * sc;
  ctx.strokeStyle = STEEL;
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + ph); ctx.lineTo(px + pw, py + ph); ctx.stroke();
  const pts = recordCurve({ record: spec });
  const X = v => px + ((v - spec.xmin) / (spec.xmax - spec.xmin)) * pw;
  const Y = v => py + ph - ((v - (spec.ymin ?? 0)) / (spec.ymax - (spec.ymin ?? 0))) * ph;
  ctx.strokeStyle = PHOS;
  ctx.lineWidth = Math.max(1.2, sc * 0.3);
  ctx.beginPath();
  let started = false;
  for (const q of pts) {
    if (q.y > spec.ymax * 1.4 || q.y < (spec.ymin ?? 0)) continue;
    const x = X(q.x); const y = Math.max(py, Y(q.y));
    if (started) ctx.lineTo(x, y); else { ctx.moveTo(x, y); started = true; }
  }
  ctx.stroke();
  ctx.lineWidth = 1;
  say(ctx, `${spec.yName} against ${spec.xName}`, box.x0 + 1.3 * sc, box.y0 + box.h - 1.9 * sc, Math.max(6, 1.7 * sc), { color: DUST, maxW: box.w - 2 * sc });
}

/** A snapshot of a gas's speeds: the share of its particles in each of 24 bars, the same vertical scale on every card of a stage. */
function paintHist(ctx, p, state, o) {
  const box = slab(ctx, o, RECTS.hist, '#16140f');
  const sc = o.sc;
  const max = p.props.speedMax || 2400;
  const bins = speedBins(p.props.gas, p.props.T, 24, max);
  const ref = p.props.ref || Math.max(...bins);
  say(ctx, p.label, box.x0 + 1.3 * sc, box.y0 + 1.9 * sc, Math.max(6, 1.9 * sc), { weight: 700, maxW: box.w - 2 * sc });
  const px = box.x0 + 2 * sc; const pw = box.w - 4 * sc;
  const base = box.y0 + box.h - 4.4 * sc; const ph = box.h - 9 * sc;
  const bw = pw / 24;
  ctx.fillStyle = PHOS;
  for (let i = 0; i < 24; i++) { const h = Math.min(1, bins[i] / ref) * ph; ctx.fillRect(px + i * bw + 0.5, base - h, Math.max(1, bw - 1), h); }
  ctx.strokeStyle = STEEL;
  ctx.beginPath(); ctx.moveTo(px, base + 0.5); ctx.lineTo(px + pw, base + 0.5); ctx.stroke();
  say(ctx, `0 to ${max} m/s`, box.x0 + 1.3 * sc, box.y0 + box.h - 1.8 * sc, Math.max(6, 1.7 * sc), { color: DIM, maxW: box.w - 2 * sc });
}

const PAINTERS = { tank: paintTank, stmt: paintStmt, num: paintNum, curve: paintCurve, hist: paintHist, pellet: paintPellet, chip: paintChip };

export function paintPiece(ctx, p, state, o) {
  const fn = PAINTERS[p.kind];
  if (!fn) return false;
  fn(ctx, p, state, o);
  return true;
}

export function faceKey(p) {
  const pr = p.props;
  return `${p.label}|${pr.mass ?? ''}|${pr.sealed ? 1 : 0}|${pr.n ?? ''}|${pr.P ?? ''}|${pr.flipped ? 1 : 0}`;
}

/* ------------------------------------------------------------------
   THE FIXTURES
   ------------------------------------------------------------------ */

const frameOf = b => ({
  x: d => b.X(b.lay.box.x0 + d),
  y: d => b.Y(b.lay.box.y0 + d),
  len: d => d * b.sc,
  size: (k, min = 6.5) => Math.max(min, k * b.sc)
});

/**
 * Where a rig's pictures stand, in table units, from its box and its dials: the barrel of each cylinder and the room for the
 * words under it. The painter and the built table's glass tube both read this, so the glass is exactly over the barrel.
 */
export function rigGeometry(f, lay) {
  const b = lay.box;
  const cyls = f.props.cyls || [];
  const compact = Boolean(f.props.compact);
  const lastDial = lay.dials.length ? Math.max(...lay.dials.map(d => d.y)) : b.y0 + 6;
  // The glass tube stands up from the plate and leans over what is behind it, so it starts clear of the dial row.
  const top = Math.max(lastDial + 7, b.y0 + 14);
  const screenW = f.props.speedScreen ? (f.props.screenW ?? Math.min(30, (b.x1 - b.x0) * 0.46)) : 0;
  const bl = b.x0 + 2 + 1.4;
  const br = b.x1 - 2 - (screenW ? screenW + 2.5 : 0);
  const BH = compact ? 5.6 : 7;
  const pitch = f.props.rowH ?? (compact ? 12 : 20);
  return {
    top, compact, BH, pitch, screenW, bl, br,
    cyls: cyls.map((c, j) => ({ c, barrel: { x0: bl, x1: br, y0: top + j * pitch, y1: top + j * pitch + BH } }))
  };
}

export const KEYS = ['gauge', 'ideal', 'off', 'volume', 'temperature', 'kelvin', 'amount', 'knocks', 'speed', 'energy', 'z', 'mass', 'room', 'pull', 'pullShare'];

/** The readouts a cylinder prints, in order, as `[label, value, tone]`. A stage turns each on with `show` (gauge, volume, temperature, amount are on). */
export function rigLines(q, f) {
  const show = f.props.show || {};
  const w = { gauge: 'GAUGE', ideal: 'GAS LAW SAYS', off: 'OFF THE LAW', volume: 'VOLUME', temperature: 'TEMPERATURE', kelvin: 'KELVIN', amount: 'AMOUNT', knocks: 'KNOCKS', speed: 'SPEED', energy: 'ENERGY OF MOTION', z: 'PV / nRT', mass: 'GAS MASS', room: 'ROOM TAKEN', pull: 'PULL', pullShare: 'PULL SHARE', ...(f.props.words || {}) };
  const on = k => (k === 'gauge' || k === 'volume' || k === 'temperature' || k === 'amount' ? show[k] !== false : Boolean(show[k]));
  const units = f.props.units || 'kpa';
  const out = [];
  for (const k of KEYS) {
    if (!on(k)) continue;
    let v;
    let tone = PHOS;
    if (k === 'gauge') {
      v = units === 'atm' ? `${sig(q.atm, 3)} atm` : units === 'both' ? `${sig(q.P, 3)} kPa` : `${sig(q.P, 3)} kPa`;
      if (units === 'rings') v = `${sig(q.atm, 3)} atm`;
      // Until a card has named the unit, a gauge prints its figure and nothing else.
      if (units === 'plain') v = `${sig(q.P, 3)}`;
    } else if (k === 'off') {
      // How far the real gauge sits from what the gas law says, as a share of it; the sign says which side.
      const pct = q.ideal > 0 ? ((q.P - q.ideal) / q.ideal) * 100 : 0;
      v = `${pct > 0.05 ? '+' : pct < -0.05 ? '−' : ''}${Math.round(Math.abs(pct))} %`;
    } else if (k === 'ideal') v = units === 'plain' ? `${sig(q.ideal, 3)}` : `${sig(q.ideal, 3)} kPa`;
    else if (k === 'volume') v = `${litres(q.V)} L`;
    else if (k === 'temperature') v = `${Math.round(q.tC)} °C`;
    else if (k === 'kelvin') v = `${Math.round(q.T)} K`;
    else if (k === 'amount') v = `${sig(q.n, 3)} mol`;
    else if (k === 'knocks') v = sig(q.knocks, 3);
    else if (k === 'speed') v = `${Math.round(q.mean)} m/s`;
    else if (k === 'energy') v = sig(q.energy, 3);
    else if (k === 'z') v = sig(q.Z, 4);
    else if (k === 'mass') v = `${sig(q.mass, 3)} g`;
    else if (k === 'room') { v = `+${sig(Math.max(0, q.room), 3)} kPa`; tone = DUST; }
    else if (k === 'pull') { v = `-${sig(Math.max(0, q.pull), 3)} kPa`; tone = DUST; }
    else v = `${Math.round(q.pullShare * 100)} %`;
    out.push([w[k], v, tone]);
  }
  return out;
}

function paintBarrel(ctx, F, g, cj, q, f, b) {
  const { barrel } = cj;
  const L = barrel.x1 - barrel.x0;
  const vmax = f.props.vmax || 40;
  const frac = Math.max(0.02, Math.min(1, q.V / vmax));
  const px = barrel.x0 + frac * L;
  // The cylinder: a wall at the left, the room the gas has, the piston, and what holds it (a rod, or a fixed wall).
  const bx0 = b.X(barrel.x0); const bx1 = b.X(barrel.x1);
  const by0 = b.Y(barrel.y0); const by1 = b.Y(barrel.y1);
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.round(bx0) + 0.5, Math.round(by0) + 0.5, Math.round(bx1 - bx0), Math.round(by1 - by0));
  ctx.lineWidth = 1;
  ctx.fillStyle = STEEL;
  ctx.fillRect(bx0 - F.len(1.4), by0, F.len(1.4), by1 - by0);
  const pxp = b.X(px);
  // The gas: dots in the room between the wall and the piston, a streak as long as the mean speed.
  const rnd = seeded(`${f.id}|${q.id}`);
  const dr = Math.max(1.1, F.len(0.55));
  const streak = Math.min(F.len(3.2), F.len(0.5 + (q.mean / 2400) * 5));
  const room = Math.max(1, pxp - bx0 - 2);
  ctx.fillStyle = PHOS;
  ctx.strokeStyle = PHOS;
  // The built table stands the particles up as bodies in the glass (`gas-3d.js`); the same count is drawn here when it does not.
  for (let i = 0; i < (b.bodies ? 0 : q.dots); i++) {
    const x = bx0 + 1.5 + rnd() * room;
    const y = by0 + 1.2 + rnd() * Math.max(1, by1 - by0 - 2.4);
    ctx.beginPath(); ctx.arc(x, y, dr, 0, Math.PI * 2); ctx.fill();
    if (streak > 2) { ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(Math.max(bx0 + 1, x - streak), y); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  // The piston: a plate across the barrel; free ones carry a weight on the rod, driven ones a plain rod to the edge.
  ctx.fillStyle = DUST;
  ctx.fillRect(pxp - F.len(0.8), by0 - F.len(0.5), F.len(1.6), by1 - by0 + F.len(1.0));
  if (cj.c.hold !== 'V') {
    ctx.strokeStyle = DUST;
    ctx.beginPath(); ctx.moveTo(pxp, (by0 + by1) / 2); ctx.lineTo(bx1 + F.len(0.5), (by0 + by1) / 2); ctx.stroke();
    if (cj.c.hold === 'P') {
      ctx.fillStyle = STEEL;
      ctx.fillRect(Math.min(bx1 - F.len(3), pxp + F.len(2)), (by0 + by1) / 2 - F.len(1.7), F.len(3), F.len(3.4));
    }
  }
  // Above the barrel (clear of the glass that leans over it) the cylinder's name, and the gas it holds.
  const sealed = cj.c.sealed;
  if (!f.props.titled) say(ctx, `${q.label}${sealed ? '' : `  ${q.sym}`}`, bx0, by0 - F.len(5), F.size(2.3, 6), { color: DUST, weight: 700, maxW: bx1 - bx0 });
}

function paintScreen(ctx, F, g, q, f, b) {
  const lay = b.lay.box;
  const sx1 = lay.x1 - 2;
  const sx0 = sx1 - g.screenW;
  const sy0 = g.top;
  const H = f.props.screenH ?? 15;
  const max = f.props.speedMax || 2400;
  const bins = speedScreen(q, max);
  // The vertical scale is the coldest setting's tallest bar, so a hotter gas is seen to spread and sink.
  const ref = f.props.screenRef ?? Math.max(...speedBins(q.gas, f.props.temps?.length ? Math.min(...f.props.temps.map(t => (f.props.tempList === 'K' ? t : t + 273.15))) : q.T, 24, max));
  const bw = (sx1 - sx0) / 24;
  const X0 = b.X(sx0); const Y1 = b.Y(sy0 + H);
  ctx.strokeStyle = RIM;
  ctx.strokeRect(Math.round(X0) + 0.5, Math.round(b.Y(sy0)) + 0.5, Math.round(F.len(sx1 - sx0)), Math.round(F.len(H)));
  const bar = f.props.bar;
  for (let i = 0; i < 24; i++) {
    const h = Math.min(1, bins[i] / ref) * (H - 1);
    const lo = i * (max / 24);
    ctx.fillStyle = bar != null && lo >= bar ? AMBER : PHOS;
    ctx.fillRect(X0 + i * F.len(bw) + 0.5, Y1 - F.len(h), Math.max(1, F.len(bw) - 1), F.len(h));
  }
  if (bar != null) {
    const bx = X0 + (bar / max) * F.len(sx1 - sx0);
    ctx.strokeStyle = AMBER;
    ctx.setLineDash?.([2, 2]);
    ctx.beginPath(); ctx.moveTo(bx, b.Y(sy0)); ctx.lineTo(bx, Y1); ctx.stroke();
    ctx.setLineDash?.([]);
    say(ctx, `ABOVE ${bar} m/s  ${sig(shareAbove(q, bar) * 100, 2)} %`, X0, Y1 + F.len(2.2), F.size(2.2, 6), { color: AMBER, maxW: F.len(sx1 - sx0) });
  } else {
    say(ctx, `0 to ${max} m/s`, X0, Y1 + F.len(2.2), F.size(2.2, 6), { color: DIM, maxW: F.len(sx1 - sx0) });
  }
  if (f.props.target != null) {
    const tx = X0 + (f.props.target / max) * F.len(sx1 - sx0);
    ctx.fillStyle = AMBER;
    ctx.beginPath(); ctx.moveTo(tx, b.Y(sy0) - F.len(0.4)); ctx.lineTo(tx - F.len(1.2), b.Y(sy0) - F.len(2.2)); ctx.lineTo(tx + F.len(1.2), b.Y(sy0) - F.len(2.2)); ctx.closePath(); ctx.fill();
    say(ctx, `MARK ${f.props.target} m/s`, X0, b.Y(sy0) - F.len(3.2), F.size(2.2, 6), { color: AMBER, maxW: F.len(sx1 - sx0) });
  }
}

/**
 * Where a sealed box's picture stands, in table units, from its box and its dials: the vessel (a square), and the words that name each
 * wall's gauge. The painter and the built table's glass cube both read this, so the glass is exactly over the vessel.
 */
export function boxGeometry(f, lay) {
  const b = lay.box;
  const lastDial = lay.dials.length ? Math.max(...lay.dials.map(d => d.y)) : b.y0 + 6;
  const side = f.props.side ?? 17;
  // The glass cube stands up from the plate and leans over what is behind it, so it starts a cube's height below the dials.
  const y0 = lastDial + 18;
  const x0 = b.x0 + 4;
  return { vessel: { x0, x1: x0 + side, y0, y1: y0 + side }, side, roofAt: y0 - 1.6, floorAt: y0 + side + 3.8, sideAt: x0 + side + 3 };
}

/** The sealed box: a vessel of gas, and a gauge on its roof, its side wall and its floor, each reading printed beside its wall. */
function paintBox(ctx, f, state, b) {
  const F = frameOf(b);
  const q = boxRead(state, f.id);
  const g = boxGeometry(f, b.lay);
  const box = b.lay.box;
  const v = g.vessel;
  const vx0 = b.X(v.x0); const vx1 = b.X(v.x1); const vy0 = b.Y(v.y0); const vy1 = b.Y(v.y1);
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.round(vx0) + 0.5, Math.round(vy0) + 0.5, Math.round(vx1 - vx0), Math.round(vy1 - vy0));
  // Each gauge sits in a port on its wall: a short thick bar.
  ctx.strokeStyle = DUST;
  ctx.lineWidth = Math.max(2, F.len(0.7));
  const mx = (vx0 + vx1) / 2; const my = (vy0 + vy1) / 2;
  ctx.beginPath(); ctx.moveTo(mx - F.len(2.4), vy0); ctx.lineTo(mx + F.len(2.4), vy0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(vx1, my - F.len(2.4)); ctx.lineTo(vx1, my + F.len(2.4)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx - F.len(2.4), vy1); ctx.lineTo(mx + F.len(2.4), vy1); ctx.stroke();
  ctx.lineWidth = 1;
  if (!b.bodies) {
    const rnd = seeded(`${f.id}|box`);
    ctx.fillStyle = PHOS;
    for (let i = 0; i < q.dots; i++) {
      ctx.beginPath();
      ctx.arc(vx0 + F.len(1.2) + rnd() * (vx1 - vx0 - F.len(2.4)), vy0 + F.len(1.2) + rnd() * (vy1 - vy0 - F.len(2.4)), Math.max(1.1, F.len(0.55)), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const plain = (f.props.units || 'kpa') === 'plain';
  const val = P => (plain ? `${sig(P, 3)}` : `${sig(P, 3)} kPa`);
  const size = F.size(2.5, 6.5);
  const word = F.size(2.3, 6);
  const wall = id => q.walls.find(w => w.id === id);
  // The three readings stand in a column beside the vessel: the glass cube at 3D On would hide a figure printed behind or above it.
  const col = F.x(g.sideAt - box.x0);
  const colW = F.len(box.x1 - g.sideAt - 2);
  [['roof', v.y0 + 2.6], ['side', (v.y0 + v.y1) / 2], ['floor', v.y1 - 2.6]].forEach(([id, y]) => {
    const yy = F.y(y - box.y0);
    say(ctx, wall(id).label, col, yy - F.len(1.5), word, { color: DIM, maxW: colW });
    say(ctx, val(wall(id).P), col, yy + F.len(1.5), size, { weight: 700, color: PHOS, maxW: colW });
  });
}

function paintRig(ctx, f, state, b) {
  const F = frameOf(b);
  const reads = rigRead(state, f.id);
  const g = rigGeometry(f, b.lay);
  reads.forEach((q, j) => {
    const cj = g.cyls[j];
    paintBarrel(ctx, F, g, cj, q, f, { ...b, X: b.X, Y: b.Y });
    const lines = rigLines(q, f);
    const cols = f.props.cols ?? (g.compact || g.screenW ? 1 : 2);
    const colW = (b.lay.box.x1 - b.lay.box.x0 - 4 - (g.screenW ? g.screenW + 2.5 : 0)) / cols;
    const y0 = cj.barrel.y1 + 3.4;
    const per = Math.ceil(lines.length / cols);
    lines.forEach(([label, value, tone], k) => {
      const col = Math.floor(k / per);
      const row = k % per;
      const x = b.lay.box.x0 + 2 + col * colW;
      const y = y0 + row * 3.3;
      say(ctx, label, F.x(x - b.lay.box.x0), F.y(y - b.lay.box.y0), F.size(2.3, 6), { color: DIM, maxW: F.len(colW * 0.56) });
      say(ctx, value, F.x(x - b.lay.box.x0 + colW - 1.2), F.y(y - b.lay.box.y0), F.size(2.5, 6.5), { color: tone, weight: 700, align: 'right', maxW: F.len(colW * 0.46) });
    });
    if (g.screenW && j === 0) paintScreen(ctx, F, g, q, f, b);
  });
}

/** The three rings of a pressure gauge: one pressure, three scales, each ring printed on its own line. */
function paintRings(ctx, f, state, b) {
  const F = frameOf(b);
  const atm = f.props.atms[Math.round(f.dials.pressure.value) - 1];
  const rows = [['ATMOSPHERES', `${sig(atm, 3)}`, 'atm'], ['KILOPASCALS', `${sig(atm * ATM_KPA, 3)}`, 'kPa'], ['MM OF MERCURY', `${sig(atm * 760, 3)}`, 'mmHg']];
  const cx = f.size.w * 0.32;
  const cy = f.props.ringsAt ?? 24;
  rows.forEach((r, i) => {
    const rad = 7.6 - i * 2.3;
    ctx.strokeStyle = i === 0 ? STEEL : DIM;
    ctx.lineWidth = Math.max(1, F.len(0.3));
    ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), F.len(rad), Math.PI * 0.8, Math.PI * 2.2); ctx.stroke();
    const frac = Math.min(1, atm / f.props.max);
    ctx.strokeStyle = i === 0 ? PHOS : DUST;
    ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), F.len(rad), Math.PI * 0.8, Math.PI * (0.8 + 1.4 * frac)); ctx.stroke();
  });
  ctx.lineWidth = 1;
  rows.forEach((r, i) => {
    const y = cy - 8 + i * 7;
    say(ctx, r[0], F.x(f.size.w * 0.58), F.y(y), F.size(2.2, 6), { color: DIM, maxW: F.len(f.size.w * 0.4) });
    say(ctx, `${r[1]} ${r[2]}`, F.x(f.size.w * 0.58), F.y(y + 2.3), F.size(2.6, 6.5), { color: i === 0 ? PHOS : DUST, weight: 700, maxW: F.len(f.size.w * 0.4) });
  });
}

/** The common tank: the gases the open valves have let in, each by its stencilled shape, with the gauge and its parts. */
function paintCommon(ctx, f, state, b) {
  const F = frameOf(b);
  const rd = commonRead(state, f.id);
  const show = f.props.show || {};
  const box = b.lay.box;
  const top = f.props.top ?? 8.5;
  const x0 = box.x0 + f.size.w * 0.52;
  const w = f.size.w * 0.44;
  const y0 = box.y0 + top;
  const h = f.props.tankH ?? 17;
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(b.X(x0), b.Y(y0), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.round(b.X(x0)) + 0.5, Math.round(b.Y(y0)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
  ctx.lineWidth = 1;
  const kinds = rd.parts.map((p, i) => ({ gas: p.gas, n: p.n, shape: SHAPES[i % SHAPES.length] }));
  ctx.fillStyle = PHOS;
  kinds.forEach(k => {
    const rnd = seeded(`${f.id}|${k.gas}`);
    const dots = b.bodies ? 0 : Math.max(1, Math.round(k.n * 12));
    for (let i = 0; i < dots; i++) shape(ctx, k.shape, b.X(x0 + 1.5 + rnd() * (w - 3)), b.Y(y0 + 1.5 + rnd() * (h - 3)), Math.max(1.4, F.len(0.55)));
  });
  const lines = [['GAUGE', `${sig(rd.P, 3)} kPa`], ['ROOM', `${litres(rd.V)} L`], ['TEMPERATURE', `${Math.round(rd.T - 273.15)} °C`]];
  lines.forEach(([l, v], i) => {
    say(ctx, l, F.x(2), F.y(top + 2.2 + i * 3.4), F.size(2.3, 6), { color: DIM, maxW: F.len(f.size.w * 0.24) });
    say(ctx, v, F.x(f.size.w * 0.5), F.y(top + 2.2 + i * 3.4), F.size(2.6, 6.5), { color: PHOS, weight: 700, align: 'right', maxW: F.len(f.size.w * 0.26) });
  });
  if (show.partials) {
    say(ctx, 'EACH GAS PUSHES', F.x(2), F.y(top + 12.6), F.size(2.1, 6), { color: DIM, maxW: F.len(f.size.w * 0.3) });
    if (show.share) say(ctx, 'SHARE', F.x(f.size.w * 0.5), F.y(top + 12.6), F.size(2.1, 6), { color: DIM, align: 'right', maxW: F.len(f.size.w * 0.12) });
    kinds.forEach((k, i) => {
      const y = top + 15.2 + i * 3.4;
      ctx.fillStyle = DUST;
      shape(ctx, k.shape, F.x(3), F.y(y), Math.max(1.4, F.len(0.7)));
      say(ctx, GASES[k.gas].sym, F.x(5.2), F.y(y), F.size(2.4, 6), { color: DUST, maxW: F.len(10) });
      say(ctx, `${sig(partialOf(rd, k.gas), 3)} kPa`, F.x(f.size.w * (show.share ? 0.38 : 0.5)), F.y(y), F.size(2.6, 6.5), { color: PHOS, weight: 700, align: 'right', maxW: F.len(f.size.w * 0.26) });
      if (show.share) say(ctx, `${Math.round((rd.rows.find(r => r.gas === k.gas)?.P ?? 0) / (rd.P || 1) * 100)} %`, F.x(f.size.w * 0.5), F.y(y), F.size(2.5, 6.5), { color: AMBER, weight: 700, align: 'right', maxW: F.len(f.size.w * 0.12) });
    });
  } else if (kinds.length) {
    // The legend of shapes without the figures: which shape is which gas.
    kinds.forEach((k, i) => {
      const y = top + 12.5 + i * 3.4;
      ctx.fillStyle = DUST;
      shape(ctx, k.shape, F.x(3), F.y(y), Math.max(1.4, F.len(0.7)));
      say(ctx, GASES[k.gas].sym, F.x(5.2), F.y(y), F.size(2.4, 6), { color: DUST, maxW: F.len(10) });
    });
  }
}

/** The scale: a pan under a tank, and what the tank weighs. */
function paintScale(ctx, f, state, b) {
  const F = frameOf(b);
  const r = scaleRead(state, f.id);
  const pw = f.size.w - 6;
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(Math.round(F.x(3)) + 0.5, Math.round(F.y(f.size.h - 9)) + 0.5, Math.round(F.len(pw)), Math.round(F.len(2.4)));
  say(ctx, r.tank ? 'WEIGHS' : 'NOTHING ON THE PAN', F.x(3), F.y(9.8), F.size(2.3, 6), { color: DIM, maxW: F.len(pw) });
  if (r.tank) say(ctx, `${sig(r.grams, 3)} g`, F.x(f.size.w - 3), F.y(9.8), F.size(3.4, 7.5), { color: AMBER, weight: 700, align: 'right', maxW: F.len(pw * 0.6) });
}

/** The pinhole: one chamber to a gas, a hole in its wall, and how much is left after the seconds the dial stands at. */
function paintPinhole(ctx, f, state, b) {
  const F = frameOf(b);
  const r = pinholeRead(state, f.id);
  const n = r.chambers.length;
  const lastDial = b.lay.dials.length ? Math.max(...b.lay.dials.map(d => d.y)) : 8;
  const top = lastDial - b.lay.box.y0 + 4;
  const cw = (f.size.w - 4) / n;
  r.chambers.forEach((c, i) => {
    const x0 = 2 + i * cw;
    const w = cw - 2;
    const h = f.props.chamberH ?? 12;
    ctx.fillStyle = '#100f0c';
    ctx.fillRect(F.x(x0), F.y(top), F.len(w), F.len(h));
    ctx.strokeStyle = STEEL;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(Math.round(F.x(x0)) + 0.5, Math.round(F.y(top)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
    ctx.lineWidth = 1;
    // The hole: a gap in the right-hand wall.
    ctx.fillStyle = PLATE_COLORS.bg;
    ctx.fillRect(F.x(x0 + w) - 1.5, F.y(top + h * 0.4), 3, F.len(h * 0.2));
    const rnd = seeded(`${f.id}|${c.id}`);
    const dots = Math.round(24 * c.left);
    ctx.fillStyle = PHOS;
    for (let k = 0; k < 24; k++) {
      const x = F.x(x0 + 1 + rnd() * (w - 2)); const y = F.y(top + 1 + rnd() * (h - 2));
      if (k < dots && !b.bodies) { ctx.beginPath(); ctx.arc(x, y, Math.max(1.1, F.len(0.5)), 0, Math.PI * 2); ctx.fill(); }
    }
    say(ctx, `${c.label}${c.sealed ? '' : `  ${c.sym}`}`, F.x(x0), F.y(top - 1.3), F.size(2.3, 6), { color: DUST, weight: 700, maxW: F.len(w) });
    say(ctx, 'LEFT', F.x(x0), F.y(top + h + 2.6), F.size(2.3, 6), { color: DIM });
    say(ctx, `${Math.round(c.left * 100)} %`, F.x(x0 + w), F.y(top + h + 2.6), F.size(2.7, 6.5), { color: PHOS, weight: 700, align: 'right' });
    if (f.props.showHalf) {
      say(ctx, 'HALF EMPTY AFTER', F.x(x0), F.y(top + h + 5.8), F.size(2.2, 6), { color: DIM, maxW: F.len(w * 0.62) });
      say(ctx, `${sig(c.half, 3)} s`, F.x(x0 + w), F.y(top + h + 5.8), F.size(2.6, 6.5), { color: AMBER, weight: 700, align: 'right' });
    }
  });
}

/** The tube: air at rest, a gas let in at each end, and a ring of white where the two meet. */
function paintTube(ctx, f, state, b) {
  const F = frameOf(b);
  const r = tubeRead(state, f.id);
  const lastDial = b.lay.dials.length ? Math.max(...b.lay.dials.map(d => d.y)) : 8;
  const top = lastDial - b.lay.box.y0 + 5;
  const x0 = 4; const w = f.size.w - 8; const h = 5.4;
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(F.x(x0), F.y(top), F.len(w), F.len(h));
  const px = d => F.x(x0 + (d / r.length) * w);
  // Each gas has crept in from its own end; the shade deepens toward the source.
  r.fronts.forEach((fr, i) => {
    const left = i === 0;
    const a = left ? px(0) : px(r.length - fr);
    const bb = left ? px(fr) : px(r.length);
    ctx.fillStyle = left ? 'rgba(120,161,66,0.45)' : 'rgba(229,155,36,0.4)';
    ctx.fillRect(Math.min(a, bb), F.y(top), Math.abs(bb - a), F.len(h));
  });
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.round(F.x(x0)) + 0.5, Math.round(F.y(top)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
  ctx.lineWidth = 1;
  if (r.met) {
    ctx.fillStyle = '#e8e2d4';
    ctx.fillRect(px(r.ringFromLeft) - F.len(0.5), F.y(top), Math.max(2, F.len(1)), F.len(h));
    say(ctx, `RING AT ${Math.round(r.ringFromLeft)} cm`, F.x(x0 + w / 2), F.y(top + h + 3.3), F.size(2.6, 6.5), { align: 'center', color: AMBER, weight: 700, maxW: F.len(w) });
  } else {
    say(ctx, 'NO RING YET', F.x(x0 + w / 2), F.y(top + h + 3.3), F.size(2.4, 6), { align: 'center', color: DIM });
  }
  for (let d = 0; d <= r.length; d += 10) {
    ctx.strokeStyle = RIM;
    ctx.beginPath(); ctx.moveTo(px(d), F.y(top + h)); ctx.lineTo(px(d), F.y(top + h + (d % 50 === 0 ? 1.6 : 0.9))); ctx.stroke();
  }
  say(ctx, `${GASES[r.ends[0]].sym}  FROM THIS END`, F.x(x0), F.y(top - 1.3), F.size(2.3, 6), { color: DUST, maxW: F.len(w * 0.48) });
  say(ctx, `${GASES[r.ends[1]].sym}  FROM THIS END`, F.x(x0 + w), F.y(top - 1.3), F.size(2.3, 6), { color: DUST, align: 'right', maxW: F.len(w * 0.48) });
}

/** One particle's track through a crowd, with how far it ran and how far it has got from where it started. */
function paintWalk(ctx, f, state, b) {
  const F = frameOf(b);
  const r = walkRead(state, f.id);
  const lastDial = b.lay.dials.length ? Math.max(...b.lay.dials.map(d => d.y)) : 8;
  const top = lastDial - b.lay.box.y0 + 4;
  const w = f.size.w * 0.56; const h = f.size.h - top - 4;
  const x0 = 2;
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(F.x(x0), F.y(top), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(Math.round(F.x(x0)) + 0.5, Math.round(F.y(top)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
  const rnd = seeded(`${f.id}|crowd`);
  ctx.fillStyle = DIM;
  for (let i = 0; i < 60; i++) ctx.fillRect(F.x(x0 + 1 + rnd() * (w - 2)), F.y(top + 1 + rnd() * (h - 2)), 2, 2);
  const k = Math.min(w, h) / 220;
  const cx = x0 + w / 2; const cy = top + h / 2;
  const clampX = v => Math.max(x0 + 0.6, Math.min(x0 + w - 0.6, v));
  const clampY = v => Math.max(top + 0.6, Math.min(top + h - 0.6, v));
  ctx.strokeStyle = PHOS;
  ctx.beginPath();
  r.points.forEach((p, i) => {
    const X = F.x(clampX(cx + p.x * k)); const Y = F.y(clampY(cy + p.y * k));
    if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
  });
  ctx.stroke();
  ctx.fillStyle = DUST;
  ctx.fillRect(F.x(cx) - 2, F.y(cy) - 2, 4, 4);
  const last = r.points[r.points.length - 1];
  ctx.fillStyle = AMBER;
  ctx.beginPath(); ctx.arc(F.x(clampX(cx + last.x * k)), F.y(clampY(cy + last.y * k)), 3, 0, Math.PI * 2); ctx.fill();
  const lx = x0 + w + 2.4;
  const rows = [['TIME', `${sig(r.seconds, 3)} s`, PHOS], ['DISTANCE RUN', `${Math.round(r.length)}`, PHOS], ['FROM THE START', `${Math.round(r.net)}`, AMBER]];
  rows.forEach(([l, v, c], i) => {
    say(ctx, l, F.x(lx), F.y(top + 3 + i * 7), F.size(2.2, 6), { color: DIM, maxW: F.len(f.size.w - lx - 1) });
    say(ctx, v, F.x(lx), F.y(top + 5.8 + i * 7), F.size(3, 7), { color: c, weight: 700, maxW: F.len(f.size.w - lx - 1) });
  });
}

function paintPlaque(ctx, f, state, b) {
  const F = frameOf(b);
  (f.props.lines || []).forEach((line, i) => say(ctx, line, F.x(2.2), F.y(8.4 + i * 3.8), F.size(2.7, 6.5), { color: DUST, maxW: F.len(f.size.w - 4) }));
}

function paintMarker(ctx, f, state, b) {
  const F = frameOf(b);
  const v = markerRead(state, f.id);
  const shown = f.props.unit ? `${v} ${f.props.unit}` : String(v);
  say(ctx, shown, F.x(f.size.w - 3), F.y(f.size.h - 3.4), F.size(4.2, 9), { align: 'right', weight: 700, color: AMBER });
}

export function paintFixture(ctx, f, state, b) {
  if (f.kind === 'rig') paintRig(ctx, f, state, b);
  else if (f.kind === 'box') paintBox(ctx, f, state, b);
  else if (f.kind === 'rings') paintRings(ctx, f, state, b);
  else if (f.kind === 'common') paintCommon(ctx, f, state, b);
  else if (f.kind === 'scale') paintScale(ctx, f, state, b);
  else if (f.kind === 'pinhole') paintPinhole(ctx, f, state, b);
  else if (f.kind === 'tube') paintTube(ctx, f, state, b);
  else if (f.kind === 'walk') paintWalk(ctx, f, state, b);
  else if (f.kind === 'plaque') paintPlaque(ctx, f, state, b);
  else if (f.kind === 'marker') paintMarker(ctx, f, state, b);
}

/** A tank's legend, painted flat for the built tank's lid. */
export function paintLegend(ctx, p, W, H) {
  const f = tankFace(p);
  say(ctx, f.name, W / 2, H * 0.22, H * 0.2, { align: 'center', weight: 700, maxW: W - 8 });
  say(ctx, f.gas, W / 2, H * 0.5, H * 0.26, { align: 'center', weight: 700, color: PHOS, maxW: W - 8 });
  say(ctx, f.mass || f.gauge || f.plate, W / 2, H * 0.78, H * 0.17, { align: 'center', color: f.mass ? AMBER : DUST, weight: f.mass ? 700 : 500, maxW: W - 8 });
}

export { kPaToAtm, kPaToMmHg, seatedIn, secondsOf, speeds, valueOf, tallestBar };
