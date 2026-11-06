/**
 * kits/ph-transfer.js — the proton bench: the student carries a proton (a sphere, a real piece) from one particle to another.
 *
 *   PARTICLES  a row of molecules or ions, each drawn as a core with its hydrogens as spheres (they wobble; at 3D On they stand up as spheres, like every
 *              window of the ph kit). A particle that has a proton to give carries one, drawn as the loose piece `phproton` hovering at its shoulder.
 *   SEAT       under each particle, a seat that takes a proton. A proton dropped in a particle's seat has moved onto that particle.
 *
 * What the bench draws follows the pieces: the particle that gave its proton away is drawn as what it becomes (`lost`), the one that took one is drawn as
 * what it becomes (`gained`), and the names change with them. The stage's check reads where the proton went (`transferRead`), never a card or a dial. A bench
 * knows the answer (`goal`) only to say, on a wrong move, what the move would do: the proton comes straight back (replay).
 *
 * `spec.mols`: [{ key, label, ink, ink2, hs, gives, lost, gained }]; `spec.goal`: { from, to } (particle keys).
 */

import * as THREE from 'three';
import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, registerPiece } from './ph-registry.js';
import { frameOf } from './matter-draw.js';
import { put, ball, ionText } from './ph-flask.js';
import { wobble } from '../../engine/phmotion.js';
import { withProps } from './ph-replay.js';
import './ph-transfer-tour.js';

const DUST = PLATE_COLORS.dust;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;
const COL = 24; const H = 56; const CORE_Y = 17; const R = 4.4; const HR = 2.2;
export const PROTON_INK = '#f4f0e6';
const HYD_INK = '#7a7366';

const takeSlot = (fid, key) => `${fid}.take.${key}`;

/** Where each proton is: `moves` = [{ from, to }] for protons sitting in a particle's seat, and which particles gave and took. */
export function transferRead(state, fid) {
  const f = state.fixtures[fid];
  const moves = [];
  for (const p of Object.values(state.pieces)) {
    if (p.kind !== 'phproton' || p.props.fixture !== fid || !p.zone) continue;
    const m = /^slot:(.+)\.take\.(.+)$/.exec(p.zone);
    if (m && m[1] === fid) moves.push({ from: p.props.from, to: m[2] });
  }
  const gave = new Set(moves.map(m => m.from)); const took = new Set(moves.map(m => m.to));
  const goal = f.props.goal;
  const right = Boolean(goal) && moves.length === 1 && moves[0].from === goal.from && moves[0].to === goal.to;
  return { moves, gave, took, right, moved: moves.length > 0 };
}

const posOf = i => 3 + COL * (i + 0.5);

/** One particle: its core, its hydrogens (not the proton it can give: that is the loose piece), and its name. */
function drawMol(ctx, F, m, i, state, clock, fromRead, demoU) {
  const cx = posOf(i);
  const gave = fromRead.gave.has(m.key); const took = fromRead.took.has(m.key);
  const changed = gave || took || (demoU != null && demoU >= 1 && (m.key === fromRead.demoFrom || m.key === fromRead.demoTo));
  const wb = wobble(i * 7, clock);
  const x = cx + wb.wx * 0.6; const y = CORE_Y + wb.wy * 0.6;
  ball(ctx, F.x(x), F.y(y), F.len(R), changed ? m.ink2 : m.ink);
  const n = Math.max(0, m.hs - (m.gives ? 1 : 0));
  for (let k = 0; k < n; k++) {
    const a = ((20 + (n === 1 ? 70 : (140 * k) / (n - 1))) * Math.PI) / 180;
    const w2 = wobble(i * 7 + k + 1, clock);
    ball(ctx, F.x(x + Math.cos(a) * (R + HR * 0.7) + w2.wx * 0.4), F.y(y + Math.sin(a) * (R + HR * 0.7) + w2.wy * 0.4), F.len(HR), HYD_INK);
  }
  const name = gave ? m.lost : took ? m.gained : (demoU != null && demoU >= 1 && m.key === fromRead.demoFrom) ? m.lost : (demoU != null && demoU >= 1 && m.key === fromRead.demoTo) ? m.gained : m.label;
  put(ctx, ionText(name), F.x(cx), F.y(30), F.size(2.7, 6.6), { color: changed ? AMBER : TEXT, weight: 700, maxW: F.len(COL - 2) });
}

function paintTransfer(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props; const clock = b.clock || 0;
  const read = transferRead(state, f.id);
  let demoU = null;
  if (p.demo) {
    // The Tour clip: the first particle that can give hands its proton to the one the goal names.
    const goal = p.goal; const u = (clock % 3.6) / 1.4; demoU = Math.min(1, u);
    read.demoFrom = goal.from; read.demoTo = goal.to;
    const i0 = p.mols.findIndex(m => m.key === goal.from); const i1 = p.mols.findIndex(m => m.key === goal.to);
    const ease = demoU * demoU * (3 - 2 * demoU);
    ball(ctx, F.x(posOf(i0) + 6.5 + (posOf(i1) - posOf(i0) - 6.5) * ease), F.y(11 + (36 - 11) * ease - Math.sin(ease * Math.PI) * 6), F.len(2.4), PROTON_INK);
  }
  p.mols.forEach((m, i) => {
    drawMol(ctx, F, m, i, state, clock, read, demoU);
    // The seat's line to its particle.
    ctx.strokeStyle = STEEL; ctx.beginPath(); ctx.moveTo(F.x(posOf(i)), F.y(CORE_Y + 15)); ctx.lineTo(F.x(posOf(i)), F.y(37)); ctx.stroke();
  });
  // A replay of a wrong move: the proton goes straight back to where it came from.
  if (p.rv === 2 && read.moved) {
    const mv = read.moves[0];
    const i0 = p.mols.findIndex(m => m.key === mv.from); const i1 = p.mols.findIndex(m => m.key === mv.to);
    const u = (b.clock % 1.1) / 1.1; const e = u * u * (3 - 2 * u);
    ball(ctx, F.x(posOf(i1) + (posOf(i0) + 6.5 - posOf(i1)) * e), F.y(42 + (11 - 42) * e - Math.sin(e * Math.PI) * 6), F.len(2.4), AMBER);
  }
}

/** Settled after every action: what the bench last read, for the replay (`count` below needs only the fixture). */
function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'phtransfer') continue;
    const r = transferRead(state, f.id);
    f.props.wrong = r.moved && !r.right;
  }
}

registerFixture('phtransfer', {
  paint: paintTransfer, settle, bodies3d: true, live: () => true,
  // A wrong move is replayed: the move as the student made it, then the proton coming straight back.
  replay: { count: f => (f.props.wrong ? 1 : 0), at: (f, i) => withProps(f, { rv: i + 1 }) },
  demo: () => ({ props: { demo: true } })
});

/* ------------------------------------------------------------------ the proton (a piece) */

const RECT = { r: 8.2, nojoin: true };
function paintProton(ctx, p, state, o) {
  const r = 4.4 * o.sc;
  ctx.fillStyle = PROTON_INK; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(o.x - r * 0.3, o.y - r * 0.32, r * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = o.lit ? AMBER : 'rgba(0,0,0,0.55)'; ctx.lineWidth = o.lit ? 2 : 1; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
  put(ctx, 'H⁺', o.x, o.y, Math.max(8, 3.4 * o.sc), { color: '#17140f', weight: 700 });
}

/** A white sphere on a low dark base. */
function protonSolid(p, state, c) {
  const g = new THREE.Group();
  const r = Math.min(c.hw || 0.02, c.hh || 0.02) * 0.5;
  const mat = c.mats?.labSteel ? c.mats.labSteel.clone() : null; // the host's own steel, whitened
  if (mat) mat.color = new THREE.Color(PROTON_INK);
  const m = mat || new THREE.MeshStandardMaterial({ color: PROTON_INK, roughness: 0.4 });
  const ball3 = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), c.own ? c.own(m) : m);
  ball3.position.y = r * 1.05; ball3.castShadow = true;
  g.add(ball3);
  g.userData.height = r * 2.1;
  return g;
}

registerPiece('phproton', {
  kind: RECT,
  paint: paintProton,
  faceKey: p => `phproton|${p.zone || ''}`,
  piece3d: protonSolid,
  printed: () => 'H⁺'
});

/* ------------------------------------------------------------------ the builder */

/**
 * The bench for a stage. Returns `{ fixture, slots, pieces, size }`: add the slots to `zones.slots` and the pieces to `pieces`.
 * `mols`: [{ key, label, ink, ink2, hs, gives, lost, gained }]; `goal`: { from, to }.
 */
export function transferParts(id, at, { mols, goal, title = 'Proton bench' }) {
  const W = mols.length * COL + 6;
  const x0 = at.x - W / 2; const y0 = at.y - H / 2;
  const slots = mols.map((m, i) => ({ id: takeSlot(id, m.key), label: ' ', at: { x: x0 + posOf(i), y: y0 + 44 }, size: { w: 17, h: 11 } }));
  const pieces = mols.filter(m => m.gives).map(m => {
    const i = mols.indexOf(m);
    return { id: `${id}.h.${m.key}`, kind: 'phproton', label: 'H⁺', at: { x: x0 + posOf(i) + 6.5, y: y0 + 11 }, props: { from: m.key, fixture: id } };
  });
  return {
    fixture: {
      id, kind: 'phtransfer', label: title, at: { ...at }, size: { w: W, h: H }, noRun: true, dials: {},
      props: { hidden: [], backdrop: true, mols: mols.map(m => ({ ...m })), goal: { ...goal }, wrong: false }
    },
    slots, pieces, size: { w: W, h: H }
  };
}
export { takeSlot };
