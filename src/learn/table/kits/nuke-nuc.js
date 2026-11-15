/**
 * kits/nuke-nuc.js — Cinder Halo's nucleus view (`nnuc`).
 *
 * A nucleus drawn as its protons (rust) and neutrons (grey), every one a disc and every count printed the count of the discs. "Watch the
 * Nucleus" plays one decay: an alpha particle (two protons and two neutrons) leaves; or a neutron turns into a proton and an electron
 * leaves (beta); or a proton turns into a neutron and a positron leaves; or an inner electron falls in and a proton turns into a neutron
 * (electron capture); or the nucleus settles and a gamma ray leaves. What leaves is drawn and counted. The counts after may be hidden
 * (`hideAfter`), so the student works out what is left from what left.
 *
 * `follow: <chart id>` draws the nucleus of the square picked on that chart instead, with the pushes between its protons (every pair) and
 * the holds between touching nucleons, and prints how many of each the drawing has.
 */

import { DECAY, decayOf, symbolOf, nameOf } from '../../engine/nucdata.js';
import { registerFixture } from './nuke-registry.js';
import { C, frameOf, say, title, foot, progress, clamp, lerp, ease, drawNucleus, nucleonPlace, protonSlots, nucleon, lepton, gammaWave } from './nuke-draw.js';
import { chartPick } from './nuke-chart-read.js';

/** @param {object} o `Z`, `N` the parent; `mode` a DECAY key; `hideAfter` hides the counts once it has decayed; `follow` a chart id. */
export function nnucFixture(id, at, { Z = 0, N = 0, mode = null, hideAfter = false, follow = null, w = 70, h = 46, title: ttl = 'Nucleus view', meta = false } = {}) {
  return {
    id, kind: 'nnuc', label: ttl, at: { ...at }, size: { w, h }, dials: {},
    ...(follow || !mode ? { noRun: true } : { runLabel: 'Watch the Nucleus' }),
    props: { Z, N, mode, hideAfter, follow, meta, last: { n: 0 } }
  };
}
export const nucRead = (state, id) => ({ watched: (state.fixtures[id]?.props?.last?.n || 0) > 0 });

function runNuc(state, fid) {
  const f = state.fixtures[fid];
  f.props.last = { n: f.props.last.n + 1 };
  return { stamp: {} };
}

/** Indices (in the packing) of the nucleons that leave or change, nearest the right edge so they leave toward the right. */
function edgeIndices(isP, want, count) {
  const n = isP.length; const idx = [];
  const order = Array.from({ length: n }, (_, k) => k).sort((a, b) => nucleonPlace(b, n).x - nucleonPlace(a, n).x);
  for (const k of order) if ((want === 'p') === isP[k] && idx.length < count) idx.push(k);
  return idx;
}

const counts = (Z, N) => `${Z} proton${Z === 1 ? '' : 's'} · ${N} neutron${N === 1 ? '' : 's'}`;

function paintDecay(ctx, f, F, b) {
  const p = f.props;
  const n = p.Z + p.N;
  const cx = f.size.w * 0.33; const cy = 8 + (f.size.h - 16) / 2;
  const R = Math.min((f.size.h - 18) / 2, f.size.w * 0.22) * Math.min(1, Math.sqrt(n / 60) * 0.55 + 0.45);
  const isP = protonSlots(p.Z, p.N, `${f.id}:${p.Z}:${p.N}`);
  const watched = p.last.n > 0;
  const k = watched ? progress(`${f.id}:watch`, b, p.last.n, 3.2) : 0;
  const clock = b.clock || 0;
  const skip = new Set(); const turn = new Map();
  const r = Math.max(0.35, (R / Math.sqrt(n)) * 0.95);
  const D = p.mode ? DECAY[p.mode] : null;
  if (watched && p.mode === 'alpha') {
    const leave = [...edgeIndices(isP, 'p', 2), ...edgeIndices(isP, 'n', 2)];
    for (const i of leave) skip.add(i);
    const t = ease(clamp((k - 0.15) / 0.75, 0, 1));
    const ox = cx + R * 0.9 + t * (f.size.w * 0.6 - R); const oy = cy;
    [[-0.6, -0.6, 'p'], [0.6, 0.6, 'p'], [0.6, -0.6, 'n'], [-0.6, 0.6, 'n']].forEach(([dx, dy, kind]) => nucleon(ctx, F, ox + dx * Math.max(r, 1.1), oy + dy * Math.max(r, 1.1), Math.max(r, 1.1), kind));
    if (t > 0.05) say(ctx, '2 protons + 2 neutrons', F.x(ox), F.y(oy + 4.2), F.size(1.6, 6), { align: 'center', color: C.alpha });
  }
  if (watched && (p.mode === 'beta' || p.mode === 'positron' || p.mode === 'capture')) {
    const from = p.mode === 'beta' ? 'n' : 'p';
    const [i] = edgeIndices(isP, from, 1);
    const mixAt = p.mode === 'capture' ? 0.55 : 0.25;
    turn.set(i, { to: from === 'n' ? 'p' : 'n', k: clamp((k - mixAt) / 0.2, 0, 1) });
    const q = nucleonPlace(i, n); const sx = cx + q.x * R; const sy = cy + q.y * R;
    if (p.mode === 'capture') {
      // The innermost shell, and one of its electrons falling in.
      ctx.strokeStyle = C.dim; ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), F.len(R * 1.7), 0, Math.PI * 2); ctx.stroke();
      const t = ease(clamp(k / 0.55, 0, 1));
      const a = -Math.PI / 2 + t * Math.PI * 1.2;
      const rr = lerp(R * 1.7, 0.2, t);
      if (t < 1) lepton(ctx, F, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 0.7);
      if (!watched || k < 0.2) say(ctx, 'Innermost electron', F.x(cx), F.y(cy - R * 1.7 - 1.6), F.size(1.5, 5.6), { align: 'center', color: C.dust });
    } else {
      const t = ease(clamp((k - 0.35) / 0.6, 0, 1));
      if (k > 0.3) {
        const ex = lerp(sx, f.size.w - 6, t); const ey = lerp(sy, cy - 2, t);
        lepton(ctx, F, ex, ey, 0.75, p.mode === 'positron');
        say(ctx, p.mode === 'positron' ? 'positron, ⁰₊₁e' : 'electron, ⁰₋₁e', F.x(ex), F.y(ey + 3), F.size(1.6, 6), { align: 'center', color: p.mode === 'positron' ? C.positron : C.e });
      }
    }
    if (k > mixAt) say(ctx, from === 'n' ? 'a neutron became a proton' : 'a proton became a neutron', F.x(cx), F.y(cy + R + 3), F.size(1.6, 6), { align: 'center', color: C.amber });
  }
  const jitter = watched && p.mode === 'gamma' && k < 0.45 ? Math.max(0.15, r * 0.25) * (1 - k / 0.45) : 0;
  drawNucleus(ctx, F, cx, cy, R, isP, { skip, turn, jitter, clock });
  if (watched && p.mode === 'gamma' && k > 0.3) {
    const t = clamp((k - 0.3) / 0.7, 0, 1);
    gammaWave(ctx, F, cx + R + 1, cy, 0, (f.size.w - cx - R - 5) * t, clock * 8);
    say(ctx, 'gamma ray', F.x(cx + R + 4 + (f.size.w - cx - R - 10) * t * 0.6), F.y(cy + 3), F.size(1.6, 6), { align: 'center', color: C.gamma });
  }
  // Counts: the parent's, then (unless hidden) what is left.
  const after = D && watched && k >= 1 ? decayOf(p.Z, p.Z + p.N, p.mode) : null;
  if (!after) foot(ctx, f, F, counts(p.Z, p.N), C.text, p.mode ? 23 : 0);
  else if (p.hideAfter) foot(ctx, f, F, '? protons · ? neutrons left', C.dust, 23);
  else foot(ctx, f, F, `${counts(after.Z, after.A - after.Z)} left`, C.amber, 23);
  if (p.meta && (!watched || k < 0.3)) say(ctx, 'The m: this nucleus holds extra energy', F.x(cx), F.y(8.6), F.size(1.6, 6), { align: 'center', color: C.dust });
}

/** The nucleus of the picked square, with every push between two protons and every hold between two touching nucleons. */
function paintPushes(ctx, f, F, state, b) {
  const pick = chartPick(state, f.props.follow);
  if (!pick) { say(ctx, 'Tap a square on the chart', F.x(f.size.w / 2), F.y(f.size.h / 2), F.size(1.8, 6.2), { align: 'center', color: C.dim }); return; }
  const { Z, N } = pick; const n = Z + N;
  const cx = f.size.w * 0.5; const cy = 9 + (f.size.h - 17) / 2;
  const R = Math.min((f.size.h - 19) / 2, f.size.w * 0.3) * Math.min(1, Math.sqrt(n / 80) * 0.6 + 0.4);
  const isP = protonSlots(Z, N, `${f.id}:${Z}:${N}`);
  const r = Math.max(0.35, (R / Math.sqrt(n)) * 0.95);
  const pts = Array.from({ length: n }, (_, k) => { const q = nucleonPlace(k, n); return { x: cx + q.x * R, y: cy + q.y * R, p: isP[k] }; });
  // Holds: touching neighbours (centres closer than 2.3 disc radii).
  let holds = 0;
  ctx.strokeStyle = '#8f8a6a'; ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < r * 2.3) { holds++; ctx.beginPath(); ctx.moveTo(F.x(pts[i].x), F.y(pts[i].y)); ctx.lineTo(F.x(pts[j].x), F.y(pts[j].y)); ctx.stroke(); }
  }
  // Pushes: every pair of protons, drawn faint.
  const prot = pts.filter(q => q.p);
  const pushes = (Z * (Z - 1)) / 2;
  ctx.strokeStyle = 'rgba(192,101,43,0.16)';
  for (let i = 0; i < prot.length; i++) for (let j = i + 1; j < prot.length; j++) { ctx.beginPath(); ctx.moveTo(F.x(prot[i].x), F.y(prot[i].y)); ctx.lineTo(F.x(prot[j].x), F.y(prot[j].y)); ctx.stroke(); }
  drawNucleus(ctx, F, cx, cy, R, isP);
  say(ctx, `${nameOf(Z)}-${n}`, F.x(2.2), F.y(8.4), F.size(1.9, 6.4), { color: C.text, weight: 600 });
  foot(ctx, f, F, `${pushes} pushes between protons · ${holds} holds between touching nucleons`, C.text);
}

function paintNuc(ctx, f, state, b) {
  const F = frameOf(b);
  title(ctx, f, F, b);
  if (f.props.follow) paintPushes(ctx, f, F, state, b);
  else paintDecay(ctx, f, F, b);
}

registerFixture('nnuc', { paint: paintNuc, run: runNuc, live: () => true });

export { symbolOf };
