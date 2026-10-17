/**
 * kits/domain-hub.js — The domain kit's hub: arms clipped on by hand that push apart and settle, a protractor,
 * and a frame of sockets where a lone pair is put somewhere and the strain is read.
 *
 * A HUB (piece `hub`, fixed) is a join target. An ARM (piece `arm`, `props {sym, mult}`) or a BALLOON (piece `balloon`,
 * a lone pair) is a tool laid on it: dropped on the hub it is clipped, dragged away it comes off. Where an arm
 * stands is NOT where it was dropped: after every action `settle` poses every clipped arm at the vector
 * `vsepr.planDomains` gives it round its hub, seen from the angle the plate's `turn` dial is at, so the arms are
 * pushed apart by the same planner the old rig used and the table eases them there. The kit holds no angle: the
 * PROTRACTOR (tool, a pass) remembers the last two arms it touched and reads `vsepr.angleBetween` of them.
 *
 * A FRAME (fixture `sockets`) is the other way to build a hub: every socket of the polyhedron for n domains is a
 * slot, arms and balloons are put in whichever the hand likes, and the frame reads `vsepr.domainStrain` of what
 * stands there. Nothing puts a lone pair anywhere; the strain is the whole reading.
 *
 * Pure helpers (`hubRead`, `frameRead`, `protractorRead`) are what a stage's `check()` and `verify:learn` read.
 */

import {
  planDomains, angleBetween, domainStrain, bestStrain, socketAngle, hubHeight, IDEAL
} from '../../engine/vsepr.js';
import { PLATE_COLORS, plateText } from '../../engine/plates.js';
import {
  YAW0, PITCH, AMBER, project, atomDisc, rods, balloon
} from './domain-draw.js';

export const HUB_R = 7;
export const ARM_R = 6.3;
/** An arm's length on the table, in table units. */
export const POSE = 21.5;
export const SOCKET_POSE = 23;
const RAD = Math.PI / 180;
const round3 = v => Math.round(v * 1000) / 1000;

export const isArm = p => Boolean(p) && (p.kind === 'arm' || p.kind === 'balloon');
const live = p => p && !p.hidden;

/* ------------------------------------------------------------------
   READING A HUB
   ------------------------------------------------------------------ */

export const hubsOf = state => Object.values(state.pieces).filter(p => p.kind === 'hub' && live(p));

/** The arms clipped to a hub, in id order (so a drag and two taps stand them alike). */
export function armsOn(state, hubId) {
  return Object.values(state.pieces).filter(p => isArm(p) && live(p) && p.joinedTo.includes(hubId)).sort((a, b) => (a.id < b.id ? -1 : 1));
}

const toArm = p => (p.kind === 'balloon' ? { kind: 'lone' } : { kind: 'atom', sym: p.props.sym, mult: p.props.mult || 1 });

/** How far the plate's dial has turned the hub from the view it opens at, in radians. */
export function turnOf(state, hub) {
  const d = state.fixtures[hub.props.turner]?.dials.turn;
  return d ? d.value * RAD : 0;
}

/**
 * The view a set of arms opens at: of every turn and tilt the picture could take, the one that keeps the arms furthest
 * apart on the plate (and off the hub), so no arm hides another. A fixed scan, so a drag and two taps agree. The plate's
 * dial turns the hub from there.
 */
export function openingView(vectors, pose = POSE, box = 0) {
  if (vectors.length < 2) return { yaw: YAW0, pitch: PITCH };
  let best = null;
  for (let y = 0; y < 360; y += 5) {
    for (let pitch = 0.1; pitch < 1.15; pitch += 0.1) {
      const pts = vectors.map(a => project(a.v, y * RAD, pitch));
      let least = Infinity;
      for (let i = 0; i < pts.length; i++) {
        // An arm must stand a hub and an arm's radius from the hub, and two arms two radii apart: measured against what each needs.
        least = Math.min(least, Math.hypot(pts[i].x, pts[i].y) * pose / (HUB_R + ARM_R));
        for (let j = i + 1; j < pts.length; j++) {
          least = Math.min(least, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) * pose / (2 * ARM_R));
          // Sockets are boxes (slots): two must clear each other along one axis, not only in a straight line.
          if (box) least = Math.min(least, Math.max(Math.abs(pts[i].x - pts[j].x), Math.abs(pts[i].y - pts[j].y)) * pose / box);
        }
      }
      if (!best || least > best.least + 1e-9) best = { yaw: y * RAD, pitch, least };
    }
  }
  return { yaw: best.yaw, pitch: best.pitch };
}

/**
 * What a hub holds right now: its arms (pieces), the plan the planner settles them in, how many are atoms and how
 * many lone pairs, and (for three atoms) how far the hub sits above their plane.
 */
export function hubRead(state, hubId) {
  const arms = armsOn(state, hubId);
  const plan = planDomains(arms.map(toArm));
  return {
    id: hubId, arms, plan, n: arms.length,
    atoms: plan.bonds, lone: plan.lone,
    shape: plan.shape, height: hubHeight(plan),
    index: id => arms.findIndex(a => a.id === id)
  };
}

/** The angle the protractor reads between the last two arms it touched, on one hub; null if it has not touched two. */
export function protractorRead(state, protId) {
  const pr = state.pieces[protId];
  const t = pr?.props.touched || [];
  if (t.length < 2) return null;
  const a = state.pieces[t[0]];
  const b = state.pieces[t[1]];
  if (!live(a) || !live(b) || a.id === b.id) return null;
  const hubId = a.joinedTo.find(id => state.pieces[id]?.kind === 'hub' && b.joinedTo.includes(id));
  if (!hubId) return null;
  const r = hubRead(state, hubId);
  const angle = angleBetween(r.plan, r.index(a.id), r.index(b.id));
  return angle == null ? null : { hub: hubId, a: a.id, b: b.id, angle };
}

/** Every protractor reading on a table, one per protractor that holds one. */
export const protractorReadings = state => Object.values(state.pieces)
  .filter(p => p.kind === 'protractor' && live(p)).map(p => protractorRead(state, p.id)).filter(Boolean);

/* ------------------------------------------------------------------
   SETTLING (the kit's `settle`: arms pushed apart round their hub)
   ------------------------------------------------------------------ */

export function settleHubs(s) {
  for (const hub of hubsOf(s)) {
    const r = hubRead(s, hub.id);
    if (!r.n) continue;
    const view = openingView(r.plan.vectors);
    const yaw = view.yaw + turnOf(s, hub);
    r.plan.vectors.forEach((v, i) => {
      const p = project(v.v, yaw, view.pitch);
      const at = { x: round3(hub.at.x + p.x * POSE), y: round3(hub.at.y + p.y * POSE) };
      const arm = r.arms[i];
      arm.at = { x: Math.max(ARM_R, Math.min(s.bounds.w - ARM_R, at.x)), y: Math.max(ARM_R, Math.min(s.bounds.h - ARM_R, at.y)) };
    });
  }
}

/* ------------------------------------------------------------------
   THE FRAME
   ------------------------------------------------------------------ */

/** What a socket is called on the plate: the two on the axis are ends; the rest ring the middle. */
export const socketLabel = (n, k) => (k < 2 ? 'End' : n === 5 ? 'Middle' : 'Side');

/** Where the sockets of an n-domain polyhedron stand on the table round `at`. */
export function socketPoints(n, at, S = SOCKET_POSE) {
  const vs = (IDEAL[n] || IDEAL[6]).map(v => ({ v }));
  const view = openingView(vs, S, 11.6);
  return vs.map(({ v }) => {
    const p = project(v, view.yaw, view.pitch);
    return { x: Math.round((at.x + p.x * S) * 100) / 100, y: Math.round((at.y + p.y * S) * 100) / 100, z: p.z };
  });
}

/** The slots and the fixture of a frame for `n` domains round `at`. */
export function frame(id, hubSym, n, at, { size = { w: 70, h: 62 } } = {}) {
  const pts = socketPoints(n, at);
  const slots = pts.map((p, k) => ({ id: `${id}-${k}`, label: socketLabel(n, k), at: { x: p.x, y: p.y } }));
  return {
    slots,
    fixture: {
      id, kind: 'sockets', label: 'Hub', at: { x: at.x, y: at.y }, size, noRun: true, dials: {},
      props: { hub: hubSym, n, centre: { ...at }, slots: slots.map(s => s.id), backdrop: true }
    }
  };
}

const pieceInSlot = (state, slotId) => Object.values(state.pieces).find(p => live(p) && p.zone === `slot:${slotId}`) || null;

/**
 * What a frame holds: what stands at each socket, whether every socket is filled, the strain of the arrangement
 * (`vsepr.domainStrain`), the least strain any arrangement of these same domains can have, and, for the first lone
 * pair, how many atoms stand closest to it and how far, and how far apart two lone pairs are.
 */
export function frameRead(state, fid) {
  const f = state.fixtures[fid];
  const ids = f.props.slots;
  const n = ids.length;
  const occ = ids.map(id => pieceInSlot(state, id));
  const kinds = occ.map(p => (p ? (p.kind === 'balloon' ? 'lone' : 'atom') : null));
  const full = kinds.every(Boolean);
  const atoms = kinds.filter(k => k === 'atom').length;
  const lone = kinds.filter(k => k === 'lone').length;
  const loneAt = kinds.map((k, i) => (k === 'lone' ? i : -1)).filter(i => i >= 0);
  const atomAt = kinds.map((k, i) => (k === 'atom' ? i : -1)).filter(i => i >= 0);
  const strain = full ? domainStrain(kinds) : null;
  const best = full ? bestStrain(atoms, lone) : null;
  let nearest = null;
  if (full && loneAt.length && atomAt.length) {
    const angles = atomAt.map(i => socketAngle(n, loneAt[0], i));
    const least = Math.min(...angles);
    nearest = { angle: least, count: angles.filter(a => a === least).length };
  }
  const apart = full && loneAt.length >= 2 ? socketAngle(n, loneAt[0], loneAt[1]) : null;
  return {
    id: fid, n, occ, kinds, full, atoms, lone, loneAt, strain, best, nearest, apart,
    // The reading as a whole number, the way the plate prints it.
    shown: strain == null ? null : Math.round(strain * 100),
    lowest: full && strain - best < 1e-3
  };
}

/* ------------------------------------------------------------------
   JOINS
   ------------------------------------------------------------------ */

const hubCount = (state, hub, except) => armsOn(state, hub.id).filter(a => a.id !== except).length;

/** The planner for the hub's pieces; undefined for any pair that is not this module's. */
export function planHubJoin(a, b, state) {
  if (isArm(a)) {
    if (b.kind !== 'hub') return { holds: false, home: true, reason: 'An arm clips to the hub.' };
    if (hubCount(state, b, a.id) >= 6) return { holds: false, home: true, reason: 'The hub has room for six arms and no more.' };
    return {
      holds: true, link: { hub: true, lone: a.kind === 'balloon', mult: a.props.mult || 1 },
      rest: { x: 0, y: 0 }, reason: 'The arm clips onto the hub and the arms settle.'
    };
  }
  if (a.kind === 'protractor') {
    if (!isArm(b)) return { holds: false, home: true, reason: 'The protractor reads the angle between two arms.' };
    if (!b.joinedTo.some(id => state.pieces[id]?.kind === 'hub')) return { holds: false, home: true, reason: 'Lay it on an arm that is clipped to a hub.' };
    const prev = a.props.touched || [];
    const next = prev[prev.length - 1] === b.id ? prev : [...prev, b.id].slice(-2);
    return { holds: true, once: true, set: { a: { touched: next } }, reason: next.length < 2 ? 'The protractor rests on the first arm.' : 'The protractor lies across the two arms.' };
  }
  return undefined;
}

export function hubPairable(me, o) {
  if (isArm(me)) return o.kind === 'hub';
  if (me.kind === 'protractor') return isArm(o);
  return undefined;
}

/* ------------------------------------------------------------------
   PAINTING
   ------------------------------------------------------------------ */

const suffix = mult => (mult === 2 ? '=' : mult === 3 ? '≡' : '');

function paintHubPiece(ctx, p, state, o) {
  atomDisc(ctx, o.x, o.y, o.r, p.props.sym, { lit: o.lit });
}

function paintArm(ctx, p, state, o) {
  if (p.kind === 'balloon') {
    // A lone pair in the hand or in the tray: a dashed outline and its two electrons. On a hub the link draws the balloon.
    const on = p.joinedTo.length > 0;
    ctx.fillStyle = '#16140f';
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
    if (on) {
      // On a hub the link draws the balloon from the hub out to here; this is its tip, the two electrons.
      ctx.fillStyle = PLATE_COLORS.phosphor;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(o.x + s * o.r * 0.26, o.y, Math.max(1.6, o.r * 0.14), 0, Math.PI * 2); ctx.fill(); }
      return;
    }
    balloon(ctx, o.x - o.r * 0.55, o.y, o.x + o.r * 0.55, o.y, o.r * 0.62, o.lit ? AMBER : PLATE_COLORS.dust);
    if (!on && !p.zone && o.r >= 12) plateText(ctx, 'Lone Pair', o.x, o.y + o.r * 1.5, { size: Math.max(7, Math.round(o.r * 0.42)), weight: 700, align: 'center', base: 'middle', color: PLATE_COLORS.dust });
    return;
  }
  atomDisc(ctx, o.x, o.y, o.r, p.props.sym, { lit: o.lit });
  const m = suffix(p.props.mult || 1);
  if (m) plateText(ctx, m, o.x + o.r * 0.92, o.y - o.r * 0.55, { size: Math.max(8, Math.round(o.r * 0.7)), weight: 700, align: 'center', base: 'middle', color: AMBER });
}

function paintProtractor(ctx, p, state, o) {
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = o.lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = o.lit ? 2 : 1;
  ctx.stroke();
  // A half-circle scale with ticks, and the reading under it.
  ctx.strokeStyle = '#16140f';
  ctx.lineWidth = Math.max(1.2, o.r * 0.1);
  ctx.beginPath();
  ctx.arc(o.x, o.y + o.r * 0.1, o.r * 0.62, Math.PI, 0);
  ctx.moveTo(o.x - o.r * 0.62, o.y + o.r * 0.1);
  ctx.lineTo(o.x + o.r * 0.62, o.y + o.r * 0.1);
  ctx.stroke();
  for (let i = 1; i < 6; i++) {
    const a = Math.PI + (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(o.x + Math.cos(a) * o.r * 0.5, o.y + o.r * 0.1 + Math.sin(a) * o.r * 0.5);
    ctx.lineTo(o.x + Math.cos(a) * o.r * 0.62, o.y + o.r * 0.1 + Math.sin(a) * o.r * 0.62);
    ctx.stroke();
  }
  const r = protractorRead(state, p.id);
  plateText(ctx, r ? `${r.angle}°` : p.label, o.x, o.y + o.r * 0.55, { size: Math.max(7, Math.round(o.r * 0.4)), weight: 700, align: 'center', base: 'middle', color: r ? AMBER : '#16140f' });
}

const PAINTERS = { hub: paintHubPiece, arm: paintArm, balloon: paintArm, protractor: paintProtractor };

export function paintHubKind(ctx, p, state, o) {
  const fn = PAINTERS[p.kind];
  if (!fn) return false;
  fn(ctx, p, state, o);
  return true;
}

export function printedHub(p, state) {
  if (p.kind === 'hub' || p.kind === 'arm') return p.props.sym;
  if (p.kind === 'balloon') return '';
  if (p.kind === 'protractor') { const r = protractorRead(state, p.id); return r ? `${r.angle}°` : p.label; }
  return undefined;
}

export function faceKeyHub(p, state) {
  if (p.kind === 'hub') return p.props.sym;
  if (p.kind === 'arm') return `${p.props.sym}|${p.props.mult || 1}`;
  if (p.kind === 'balloon') return p.joinedTo.length ? 'on' : 'off';
  if (p.kind === 'protractor') { const r = protractorRead(state, p.id); return r ? `${r.angle}` : ''; }
  return undefined;
}

/** A clipped arm is a rod from the hub (one to three) or a balloon; the built table lays that many rods. */
export function paintHubLink(ctx, link, o) {
  if (!link?.hub) return false;
  const arm = isArm(o.a) ? o.a : o.b;
  const hubPt = arm === o.a ? { x: o.bx, y: o.by } : { x: o.ax, y: o.ay };
  const tip = arm === o.a ? { x: o.ax, y: o.ay } : { x: o.bx, y: o.by };
  if (link.lone) balloon(ctx, hubPt.x, hubPt.y, tip.x, tip.y, Math.max(5, o.sc * 2.4), PLATE_COLORS.dust);
  else rods(ctx, hubPt.x, hubPt.y, tip.x, tip.y, link.mult || 1, PLATE_COLORS.steel, Math.max(3, o.sc * 1.1));
  return true;
}

export const hubLinkRods = link => (link?.hub ? (link.lone ? 1 : link.mult || 1) : undefined);

/** The plate behind a hub: how many arms it holds and the angle the protractor last read. */
function paintHubPlate(ctx, f, state, b) {
  const hub = state.pieces[f.props.hub];
  const r = hub ? hubRead(state, hub.id) : null;
  const size = Math.max(7, Math.round(2.2 * b.sc));
  const x = b.x1 - 1.5 * b.sc;
  let row = b.y0 + 3.6 * b.sc;
  const line = (text, color = PLATE_COLORS.dust) => { plateText(ctx, text, x, row, { size, weight: 700, align: 'right', base: 'middle', color }); row += 2.9 * b.sc; };
  line(`ARMS ${r ? r.n : 0}`, PLATE_COLORS.phosphor);
  const read = protractorReadings(state).find(q => q.hub === f.props.hub);
  line(read ? `ANGLE ${read.angle}°` : 'ANGLE', read ? AMBER : PLATE_COLORS.dim);
  if (f.props.gauge && r) line(r.height == null ? 'HEIGHT' : `HEIGHT ${r.height.toFixed(2)}`, r.height ? AMBER : PLATE_COLORS.dim);
}

/** The frame: spokes to the sockets and the hub's own disc. */
function paintSockets(ctx, f, state, b) {
  const c = f.props.centre;
  const read = frameRead(state, f.id);
  const hx = b.X(c.x);
  const hy = b.Y(c.y);
  ctx.strokeStyle = PLATE_COLORS.dim;
  ctx.lineWidth = 1;
  f.props.slots.forEach(id => {
    const s = state.zones.slots[id];
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(b.X(s.at.x), b.Y(s.at.y));
    ctx.stroke();
  });
  atomDisc(ctx, hx, hy, HUB_R * b.sc, f.props.hub);
  const size = Math.max(7, Math.round(2.2 * b.sc));
  const x = b.x1 - 1.5 * b.sc;
  let row = b.y0 + 3.6 * b.sc;
  const line = (text, color = PLATE_COLORS.dust) => { plateText(ctx, text, x, row, { size, weight: 700, align: 'right', base: 'middle', color }); row += 2.9 * b.sc; };
  line(read.full ? `STRAIN ${read.shown}` : 'STRAIN', read.full ? AMBER : PLATE_COLORS.dim);
  if (read.nearest) line(`NEAREST ${read.nearest.angle}° x${read.nearest.count}`, PLATE_COLORS.dust);
  if (read.apart != null) line(`PAIRS ${read.apart}° APART`, PLATE_COLORS.dust);
}

export function paintHubFixture(ctx, f, state, b) {
  if (f.kind === 'hubplate') { paintHubPlate(ctx, f, state, b); return true; }
  if (f.kind === 'sockets') { paintSockets(ctx, f, state, b); return true; }
  return false;
}

/* ------------------------------------------------------------------
   TABLE FURNITURE (spread into a stage's declaration)
   ------------------------------------------------------------------ */

/**
 * A hub on its plate: the fixture that holds its readings and the hub piece at its middle, and (when `turner` names a place) a
 * small fixture with the dial that turns the view. `at` is the middle of the plate's box.
 */
export function hubSet(id, sym, at, { label = 'Hub', size = { w: 66, h: 60 }, gauge = false, turner = null } = {}) {
  const turnerId = turner ? `${id}-turn` : null;
  return {
    fixture: { id: `${id}-plate`, kind: 'hubplate', label, at, size, noRun: true, dials: {}, props: { hub: id, gauge, backdrop: true } },
    piece: { id, kind: 'hub', label: sym, at: { ...at }, fixed: true, props: { sym, plate: `${id}-plate`, turner: turnerId } },
    turner: turner ? {
      id: turnerId, kind: 'turner', label: 'View', at: turner, size: { w: 44, h: 16 }, noRun: true,
      dials: { turn: { min: 0, max: 355, step: 5, value: 0, label: 'Turn' } }, props: { margin: 4, top: 9 }
    } : null
  };
}

export const armPiece = (id, sym, at, mult = 1, label = null) => ({ id, kind: 'arm', label: label || sym, at, props: { sym, mult } });
export const balloonPiece = (id, at) => ({ id, kind: 'balloon', label: 'Lone Pair', at, props: {} });
export const protractorPiece = (id, at) => ({ id, kind: 'protractor', label: 'Protractor', at, props: {} });

/** An angle marker: one dial the player sets to a number they read off the protractor. */
export function marker(id, at, { label = 'Angle', max = 180, step = 1, size = { w: 44, h: 16 } } = {}) {
  return { id, kind: 'marker', label: 'Marker', at, size, noRun: true, dials: { value: { min: 0, max, step, value: 0, label } }, props: { margin: 4, top: 9 } };
}

export const markerValue = (state, id) => state.fixtures[id].dials.value.value;

