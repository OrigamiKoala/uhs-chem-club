/**
 * kits/domain-field.js — The domain kit's molecules and the charged plates they are put between.
 *
 * A MOLECULE CARD (piece `mol`, or `dmol` when it is meant to be put in a field) draws one molecule from
 * `vsepr.RIG_MOLECULES` (or, after a swap, the arms its props now hold): a hub and its arms from the vectors
 * `planDomains` settled, the same projection a hub on the table uses. The card reads: its formula, optionally how many
 * arms its hub holds or the angles between its atoms, and, with the ARROWS tool laid on it, an arrow across each bond
 * toward the atom that pulls harder, their sum, and the size of that sum (`planDipole`).
 *
 * THE PLATES (fixture `plates`): two charged bars with a gap. A `dmol` standing in the gap (its middle between the bars,
 * on open table) is IN THE FIELD, and while the field is on it is drawn swung round so that its net pull points at the
 * positive bar, exactly as `planDipole` says; a molecule whose pulls cancel is drawn as it stood. Nothing is stored:
 * switch the field off, or lift the card out, and the picture is the card as it was. "Switch Field" (the fixture's Run
 * key) throws a hidden dial.
 *
 * A STREAM (piece `stream`, a liquid of one kind of molecule) with a charged ROD laid on it bends toward the rod when the
 * molecules are polar, and runs straight when they are not.
 *
 * The SWAPPER (tool, a pass, `props.sym`) takes the first outer atom that is not its own element and makes it its own:
 * one atom of CCl4 swapped for hydrogen is CHCl3. What that does to the molecule is whatever `planDipole` says.
 */

import {
  RIG_MOLECULES, planDomains, planDipole, bondAngles
} from '../../engine/vsepr.js';
import { PLATE_COLORS, plateText } from '../../engine/plates.js';
import { rectOf, SIZES } from '../snap.js';
import {
  AMBER, paintStar, project, arrow, fitted, slab, YAW0, PITCH
} from './domain-draw.js';

export const MOL_RECT = Object.freeze({ hw: 13, hh: 11 });
export const STREAM_RECT = Object.freeze({ hw: 9, hh: 12.5 });
const live = p => p && !p.hidden;
/** A card meant to be put in a field: `dmol`, or `tmol` when it can also be turned over by hand. */
export const isFieldMol = p => Boolean(p) && (p.kind === 'dmol' || p.kind === 'tmol');
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = n => (n === 1 ? '' : String(n).split('').map(c => SUB[c]).join(''));
const ORDER = ['C', 'N', 'H', 'S', 'O', 'F', 'Cl', 'Br', 'I'];

/* ------------------------------------------------------------------
   WHAT A MOLECULE CARD HOLDS
   ------------------------------------------------------------------ */

/** The molecule a card stands for: its hub and arms, and the formula to print. */
export function molOf(p) {
  const base = RIG_MOLECULES[p.props.mol];
  if (p.props.arms) {
    const hub = p.props.hub || base.hub;
    const counts = { [hub]: 1 };
    for (const a of p.props.arms) if (a.kind === 'atom') counts[a.sym] = (counts[a.sym] || 0) + 1;
    const known = Object.keys(counts).filter(s => ORDER.includes(s)).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    const other = Object.keys(counts).filter(s => !ORDER.includes(s)).sort();
    const formula = [...other, ...known].map(s => `${s}${sub(counts[s])}`).join('');
    return { hub, arms: p.props.arms, label: formula };
  }
  return { hub: base.hub, arms: base.arms, label: base.label };
}

/** Everything a card shows, derived: the plan, the dipole, the angles. */
export function molRead(p) {
  const m = molOf(p);
  const plan = planDomains(m.arms);
  const dip = planDipole({ hub: m.hub, arms: m.arms });
  return {
    ...m, plan, dip, polar: dip.polar, net: dip.mag, shape: plan.shape,
    domains: plan.n, angles: bondAngles(plan)
  };
}

/** Does this card carry the arrows tool? */
export const arrowsOn = (state, p) => p.joinedTo.some(id => state.pieces[id]?.kind === 'arrows');
/** Is this stream under the charged rod? */
export const rodOn = (state, p) => p.joinedTo.some(id => state.pieces[id]?.kind === 'rod');

/* ------------------------------------------------------------------
   THE PLATES
   ------------------------------------------------------------------ */

/** The gap between a plates fixture's bars, in table units: where a molecule is in the field. */
export function gapArea(f) {
  const r = rectOf(f, SIZES.fixture);
  const bar = f.props.bar ?? 5;
  return { x0: r.x0 + (f.props.inset ?? 6) + bar, x1: r.x1 - (f.props.inset ?? 6) - bar, y0: r.y0 + (f.props.top ?? 9), y1: r.y1 - (f.props.bottom ?? 8) };
}

export const platesOf = state => Object.values(state.fixtures).filter(f => f.kind === 'plates');
export const fieldIsOn = f => f.dials.field.value >= 1;

/** The plates a card stands between, or null: on open table, its middle inside the gap. */
export function platesAround(p, state) {
  if (!live(p) || p.zone) return null;
  for (const f of platesOf(state)) {
    const g = gapArea(f);
    if (p.at.x >= g.x0 && p.at.x <= g.x1 && p.at.y >= g.y0 && p.at.y <= g.y1) return { fixture: f.id, on: fieldIsOn(f) };
  }
  return null;
}

/** Every molecule card in the field, with whether the field is on: what the stage grades from. */
export function inField(state) {
  return Object.values(state.pieces).filter(p => isFieldMol(p) && live(p)).map(p => ({ id: p.id, around: platesAround(p, state) })).filter(x => x.around);
}

/**
 * What a card in a field does, derived. `turns` is true when the field is on, the card is between the bars and its pulls
 * add up; `settled` when it is already the way the field would turn it.
 */
export function dmolBehaviour(p, state) {
  const read = molRead(p);
  const around = platesAround(p, state);
  const on = Boolean(around?.on);
  const restNet = restNetX(p, read);
  return { read, around, on, turns: on && read.polar, restNet, aligned: read.polar && restNet < -0.99 };
}

/* ------------------------------------------------------------------
   POSE
   ------------------------------------------------------------------ */

const turnY = v => [-v[0], v[1], -v[2]];

function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

/** Rotation taking unit vector `a` onto unit vector `b` (Rodrigues), as a function. */
function rotationBetween(a, b) {
  const v = cross(a, b);
  const c = dot(a, b);
  const s = Math.hypot(...v);
  if (s < 1e-6) return c > 0 ? (x => x) : (x => [-x[0], -x[1], x[2]]);
  const k = v.map(t => t / s);
  const ang = Math.atan2(s, c);
  return x => {
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const kx = cross(k, x);
    const kd = dot(k, x);
    return [x[0] * cos + kx[0] * sin + k[0] * kd * (1 - cos), x[1] * cos + kx[1] * sin + k[1] * kd * (1 - cos), x[2] * cos + kx[2] * sin + k[2] * kd * (1 - cos)];
  };
}

/** The view a molecule is seen from: side-on for two atoms (so the bond lies across the plate), the usual turn otherwise. */
export const viewFor = read => (read.plan.n === 1 ? { yaw: Math.PI / 2, pitch: 0 } : { yaw: YAW0, pitch: PITCH });

/** The vectors of a card at rest: the planner's, turned half a turn about the vertical if the card is flipped. */
export function restVectors(p, read) {
  return read.plan.vectors.map(a => ({ ...a, v: p.props.flipped ? turnY(a.v) : a.v }));
}

/** x of the unit net pull as the card stands at rest, seen from its view: -1 is the negative end toward the positive bar. */
function restNetX(p, read) {
  if (!read.polar) return 0;
  const net = read.dip.net.map(c => c / read.dip.mag);
  const v = p.props.flipped ? turnY(net) : net;
  const view = viewFor(read);
  const pr = project(v, view.yaw, view.pitch);
  const len = Math.hypot(pr.x, pr.y) || 1;
  return pr.x / len;
}

/** The vectors the card is drawn with, and the view: swung round if it is in a field that is on and its pulls add up. */
export function dmolPose(p, state) {
  const b = dmolBehaviour(p, state);
  const { read } = b;
  if (b.turns) {
    const net = read.dip.net.map(c => c / read.dip.mag);
    const swing = rotationBetween(net, [-1, 0, 0]);
    return { vectors: read.plan.vectors.map(a => ({ ...a, v: swing(a.v) })), view: { yaw: YAW0 * 0.3, pitch: PITCH * 0.4 }, turned: true, b };
  }
  return { vectors: restVectors(p, read), view: viewFor(read), turned: false, b };
}

/* ------------------------------------------------------------------
   JOINS
   ------------------------------------------------------------------ */

export const isCard = p => p && (p.kind === 'mol' || isFieldMol(p));

export function planFieldJoin(a, b, state) {
  if (a.kind === 'arrows') {
    if (!isCard(b)) return { holds: false, home: true, reason: 'The arrows lie on a molecule.' };
    return { holds: true, link: { tool: 'arrows' }, rest: { x: 12.5, y: -8 }, reason: 'The arrows are drawn across the bonds.' };
  }
  if (a.kind === 'rod') {
    if (b.kind !== 'stream') return { holds: false, home: true, reason: 'The rod is brought to a stream.' };
    return { holds: true, link: { tool: 'rod' }, rest: { x: 8.5, y: -7 }, reason: 'The charged rod stands beside the stream.' };
  }
  if (a.kind === 'swapper') {
    if (!isFieldMol(b)) return { holds: false, home: true, reason: 'The swap is made on a molecule.' };
    const m = molOf(b);
    const sym = a.props.sym;
    const at = m.arms.findIndex(x => x.kind === 'atom' && x.sym !== sym);
    if (at < 0) return { holds: false, home: true, reason: `Every outer atom of this molecule is ${sym} already.` };
    const arms = m.arms.map((x, i) => (i === at ? { ...x, sym } : { ...x }));
    return { holds: true, once: true, set: { b: { hub: m.hub, arms } }, reason: `One outer atom is swapped for ${sym}.` };
  }
  return undefined;
}

export function fieldPairable(me, o) {
  if (me.kind === 'arrows') return isCard(o);
  if (me.kind === 'rod') return o.kind === 'stream';
  if (me.kind === 'swapper') return isFieldMol(o);
  return undefined;
}

/** Switch Field: the hidden dial goes to the other end. */
export function runPlates(state, f) {
  return { dials: { [f.id]: { field: fieldIsOn(f) ? 0 : 1 } } };
}

/* ------------------------------------------------------------------
   PAINTING
   ------------------------------------------------------------------ */

function paintCard(ctx, p, state, o) {
  const hw = MOL_RECT.hw * o.sc;
  const hh = MOL_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  const w = hw * 2;
  const h = hh * 2;
  slab(ctx, x0, y0, w, h, o.lit);
  const read = molRead(p);
  const isD = isFieldMol(p);
  const pose = isD ? dmolPose(p, state) : { vectors: restVectors(p, read), view: viewFor(read), turned: false };
  const S = h * (read.plan.n === 1 ? 0.38 : 0.27);
  const cy = y0 + h * 0.38;
  // At `3D On` the tile carries the molecule itself as a solid (`engine/ligar-mol3d.js`), so the face keeps its words and leaves the picture to it.
  const solid = Boolean(o.flat);
  const star = solid ? null : paintStar(ctx, o.x, cy, S, read.hub, pose.vectors, pose.view);
  const size = Math.max(6, Math.round(h * 0.15));
  fitted(ctx, read.label, x0 + 3, y0 + h * 0.92, w * 0.5, { size, weight: 700, align: 'left', color: PLATE_COLORS.text });
  const shows = p.props.show || [];
  const note = text => fitted(ctx, text, x0 + w - 3, y0 + h * 0.79, w * 0.9, { size: Math.max(6, Math.round(h * 0.13)), align: 'right', color: PLATE_COLORS.dust });
  if (shows.includes('arms')) note(`ARMS ${read.domains}`);
  if (shows.includes('angles') && read.angles.length) note(`ATOMS ${read.angles.join(' ')}°`);
  if (arrowsOn(state, p)) {
    // An arrow across each bond toward the atom that pulls the pair harder, and the sum of them all.
    if (!solid) read.dip.arrows.forEach((a, k) => {
      const pv = pose.vectors.filter(v => v.kind === 'atom')[k];
      if (!pv) return;
      const sign = a.d >= 0 ? 1 : -1;
      const p0 = project(pv.v.map(c => c * (sign > 0 ? 0.28 : 0.86)), pose.view.yaw, pose.view.pitch);
      const p1 = project(pv.v.map(c => c * (sign > 0 ? 0.86 : 0.28)), pose.view.yaw, pose.view.pitch);
      if (Math.abs(a.d) > 0.01) arrow(ctx, o.x + p0.x * S, cy + p0.y * S, o.x + p1.x * S, cy + p1.y * S, 1.4, PLATE_COLORS.text, Math.max(3, h * 0.07));
    });
    if (read.polar && !solid) {
      const net = read.dip.net.map(c => c / read.dip.mag);
      const rot = pose.turned ? [-1, 0, 0] : (p.props.flipped ? turnY(net) : net);
      const pr = project(pose.turned ? rot : rot, pose.view.yaw, pose.view.pitch);
      const len = Math.hypot(pr.x, pr.y) || 1;
      const ux = pr.x / len;
      const uy = pr.y / len;
      const by = y0 + h * 0.68;
      arrow(ctx, o.x - ux * w * 0.14, by - uy * h * 0.04, o.x + ux * w * 0.14, by + uy * h * 0.04, 2.2, AMBER, Math.max(4, h * 0.09));
      void by;
    }
    fitted(ctx, `NET ${read.net.toFixed(2)}`, x0 + w - 3, y0 + h * 0.79, w * 0.6, { size: Math.max(6, Math.round(h * 0.13)), weight: 700, align: 'right', color: read.polar ? AMBER : PLATE_COLORS.dust });
  }
  void star;
}

function paintStream(ctx, p, state, o) {
  const hw = STREAM_RECT.hw * o.sc;
  const hh = STREAM_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  const w = hw * 2;
  const h = hh * 2;
  slab(ctx, x0, y0, w, h, o.lit);
  const read = molRead({ ...p, props: { ...p.props } });
  // A nozzle, and the liquid falling from it: straight, or bent toward the rod when the molecules are polar.
  const nx = x0 + w * 0.3;
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.fillRect(nx - w * 0.12, y0 + h * 0.06, w * 0.24, h * 0.07);
  const bent = rodOn(state, p) && read.polar;
  const top = y0 + h * 0.14;
  const bottom = y0 + h * 0.72;
  const pull = bent ? w * 0.34 : 0;
  ctx.strokeStyle = PLATE_COLORS.text;
  ctx.lineWidth = Math.max(1.6, w * 0.06);
  ctx.beginPath();
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const x = nx + pull * t * t;
    const y = top + (bottom - top) * t;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // The line a straight stream would take, dashed, so a bend can be told from a stream that merely leans.
  ctx.strokeStyle = PLATE_COLORS.dim;
  ctx.lineWidth = 1;
  ctx.setLineDash?.([2, 3]);
  ctx.beginPath();
  ctx.moveTo(nx, top);
  ctx.lineTo(nx, bottom);
  ctx.stroke();
  ctx.setLineDash?.([]);
  const size = Math.max(6, Math.round(h * 0.1));
  fitted(ctx, read.label, o.x, y0 + h * 0.86, w * 0.92, { size, weight: 700, color: PLATE_COLORS.text });
  if (p.props.note) fitted(ctx, p.props.note, o.x, y0 + h * 0.95, w * 0.92, { size: Math.max(5, Math.round(h * 0.07)), color: PLATE_COLORS.dust });
}

function paintFieldTool(ctx, p, state, o) {
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = o.lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = o.lit ? 2 : 1;
  ctx.stroke();
  ctx.strokeStyle = '#16140f';
  ctx.fillStyle = '#16140f';
  ctx.lineWidth = Math.max(1.4, o.r * 0.14);
  if (p.kind === 'arrows') {
    arrow(ctx, o.x - o.r * 0.5, o.y - o.r * 0.1, o.x + o.r * 0.5, o.y - o.r * 0.1, Math.max(1.4, o.r * 0.14), '#16140f', Math.max(3, o.r * 0.3));
  } else if (p.kind === 'rod') {
    ctx.beginPath();
    ctx.moveTo(o.x - o.r * 0.5, o.y + o.r * 0.1);
    ctx.lineTo(o.x + o.r * 0.5, o.y - o.r * 0.3);
    ctx.stroke();
    plateText(ctx, '+', o.x - o.r * 0.55, o.y - o.r * 0.1, { size: Math.max(8, Math.round(o.r * 0.55)), weight: 700, align: 'center', base: 'middle', color: '#16140f' });
  } else {
    plateText(ctx, p.props.sym, o.x, o.y - o.r * 0.1, { size: Math.max(9, Math.round(o.r * 0.7)), weight: 700, align: 'center', base: 'middle', color: '#16140f' });
  }
  plateText(ctx, p.label, o.x, o.y + o.r * 0.55, { size: Math.max(6, Math.round(o.r * 0.33)), weight: 700, align: 'center', base: 'middle', color: '#16140f' });
}

export function paintFieldKind(ctx, p, state, o) {
  if (isCard(p)) { paintCard(ctx, p, state, o); return true; }
  if (p.kind === 'stream') { paintStream(ctx, p, state, o); return true; }
  if (p.kind === 'arrows' || p.kind === 'rod' || p.kind === 'swapper') { paintFieldTool(ctx, p, state, o); return true; }
  return false;
}

export function printedField(p, state) {
  if (isCard(p) || p.kind === 'stream') return molRead(p).label;
  if (p.kind === 'arrows' || p.kind === 'rod' || p.kind === 'swapper') return p.label;
  return undefined;
}

export function faceKeyField(p, state) {
  if (p.kind === 'mol') return `${molRead(p).label}|${p.props.flipped ? 1 : 0}|${arrowsOn(state, p) ? 1 : 0}|${(p.props.show || []).join()}`;
  if (isFieldMol(p)) {
    const pose = dmolPose(p, state);
    return `${molRead(p).label}|${p.props.flipped ? 1 : 0}|${pose.turned ? 1 : 0}|${arrowsOn(state, p) ? 1 : 0}|${(p.props.show || []).join()}`;
  }
  if (p.kind === 'stream') return `${molRead(p).label}|${rodOn(state, p) ? 1 : 0}`;
  if (p.kind === 'arrows' || p.kind === 'rod' || p.kind === 'swapper') return '';
  return undefined;
}

/** Two charged bars and the gap between: the sign is stencilled, and lit when the field is on. */
export function paintFieldFixture(ctx, f, state, b) {
  if (f.kind !== 'plates') return false;
  const on = fieldIsOn(f);
  const r = rectOf(f, SIZES.fixture);
  const bar = f.props.bar ?? 5;
  const inset = f.props.inset ?? 6;
  const y0 = b.Y(r.y0 + (f.props.top ?? 9));
  const y1 = b.Y(r.y1 - (f.props.bottom ?? 8));
  const size = Math.max(8, Math.round(4 * b.sc));
  for (const [x, sign] of [[r.x0 + inset, '+'], [r.x1 - inset - bar, '−']]) {
    ctx.fillStyle = on ? '#2a2c1f' : '#16140f';
    ctx.fillRect(b.X(x), y0, bar * b.sc, y1 - y0);
    ctx.strokeStyle = on ? PLATE_COLORS.phosphor : PLATE_COLORS.steel;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.X(x) + 0.5, y0 + 0.5, bar * b.sc - 1, y1 - y0 - 1);
    plateText(ctx, sign, b.X(x + bar / 2), y0 + (y1 - y0) * 0.1, { size, weight: 800, align: 'center', base: 'middle', color: on ? PLATE_COLORS.phosphor : PLATE_COLORS.dust });
  }
  const g = gapArea(f);
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.lineWidth = 1;
  ctx.setLineDash?.([3, 4]);
  ctx.strokeRect(b.X(g.x0) + 0.5, b.Y(g.y0) + 0.5, (g.x1 - g.x0) * b.sc - 1, (g.y1 - g.y0) * b.sc - 1);
  ctx.setLineDash?.([]);
  plateText(ctx, on ? 'FIELD ON' : 'FIELD OFF', b.x1 - 1.5 * b.sc, b.y0 + 3.6 * b.sc, { size: Math.max(7, Math.round(2.2 * b.sc)), weight: 700, align: 'right', base: 'middle', color: on ? PLATE_COLORS.phosphor : PLATE_COLORS.dim });
  return true;
}

/* ------------------------------------------------------------------
   TABLE FURNITURE
   ------------------------------------------------------------------ */

/** A pair of charged plates: the fixture (Run throws the field). `at` is the box's middle. */
export function plates(id, at, { size = { w: 100, h: 46 }, runLabel = 'Switch Field' } = {}) {
  return {
    id, kind: 'plates', label: 'Plates', at, size, runLabel,
    dials: { field: { min: 0, max: 1, step: 1, value: 0, label: 'Field' } },
    props: { hidden: ['field'], inset: 6, bar: 5, top: 9, bottom: 8 }
  };
}

/** A molecule card; `show` lists the readings it prints ('arms', 'angles'). */
export const molCard = (id, mol, at, { show = [], field = false, turn = false, extra = {} } = {}) => ({
  id, kind: turn ? 'tmol' : field ? 'dmol' : 'mol', label: RIG_MOLECULES[mol].label, at, props: { mol, show, ...extra }
});

/** A stream of a liquid of one molecule. */
export const streamPiece = (id, mol, at, extra = {}) => ({ id, kind: 'stream', label: RIG_MOLECULES[mol].label, at, props: { mol, ...extra } });

export const arrowsTool = (id, at) => ({ id, kind: 'arrows', label: 'Arrows', at, props: {}, caption: 'Shows each pull' });
export const rodTool = (id, at) => ({ id, kind: 'rod', label: 'Charged Rod', at, props: {}, caption: 'Holds a charge' });
export const swapTool = (id, sym, at) => ({ id, kind: 'swapper', label: `Swap ${sym}`, at, props: { sym }, caption: 'Swaps an atom' });

