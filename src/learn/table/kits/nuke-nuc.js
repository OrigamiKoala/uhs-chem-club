/**
 * kits/nuke-nuc.js — Cinder Halo's nucleus view (`nnuc`).
 *
 * A nucleus drawn as its protons (rust) and neutrons (grey), every one a disc and every count printed the count of the discs. "Watch the
 * Nucleus" plays one decay: an alpha particle (two protons and two neutrons) leaves; or a neutron turns into a proton and an electron
 * leaves (beta); or a proton turns into a neutron and a positron leaves; or an inner electron falls in and a proton turns into a neutron
 * (electron capture); or the nucleus settles and a gamma ray leaves. What leaves is drawn and counted. The counts after may be hidden
 * (`hideAfter`), so the student works out what is left from what left.
 *
 * `follow: <chart id>` draws the nucleus of the square picked on that chart instead, with the repulsion between its protons (every pair)
 * and the strong force's hold between touching nucleons, and prints how many of each the drawing has.
 */

import { DECAY, decayOf, symbolOf, nameOf } from '../../engine/nucdata.js';
import { registerFixture } from './nuke-registry.js';
import { C, frameOf, say, title, foot, progress, clamp, lerp, ease, box, drawNucleus, nucleonPlace, protonSlots, nucleon, lepton, gammaWave } from './nuke-draw.js';
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
  const k = watched ? progress(`${f.id}:watch`, b, p.last.n, p.mode === 'alpha' ? 4.2 : 3.4) : 0;
  const clock = b.clock || 0;
  const skip = new Set(); const turn = new Map();
  const r = Math.max(0.35, (R / Math.sqrt(n)) * 0.95);
  const D = p.mode ? DECAY[p.mode] : null;
  let highlightTurn = null;
  if (watched && p.mode === 'alpha') {
    const leave = [...edgeIndices(isP, 'p', 2), ...edgeIndices(isP, 'n', 2)];
    for (const i of leave) skip.add(i);
    const t = ease(clamp((k - 0.12) / 0.78, 0, 1));
    const maxOx = f.size.w - 16;
    const ox = Math.min(maxOx, cx + R * 0.95 + t * (maxOx - (cx + R * 0.95)));
    const oy = cy;
    const nr = Math.max(r * 1.4, 2.0);
    [[-0.65, -0.65, 'p'], [0.65, 0.65, 'p'], [0.65, -0.65, 'n'], [-0.65, 0.65, 'n']].forEach(([dx, dy, kind]) => nucleon(ctx, F, ox + dx * nr, oy + dy * nr, nr, kind));
    if (t > 0.05) {
      const lx = clamp(ox, 16, f.size.w - 16);
      say(ctx, '2 protons + 2 neutrons', F.x(lx), F.y(oy + nr * 2.4 + 2.4), F.size(1.8, 7), { align: 'center', color: C.alpha, weight: 700, maxW: F.len(30) });
    }
  }
  if (watched && (p.mode === 'beta' || p.mode === 'positron' || p.mode === 'capture')) {
    const from = p.mode === 'beta' ? 'n' : 'p';
    const [i] = edgeIndices(isP, from, 1);
    const mixAt = p.mode === 'capture' ? 0.55 : 0.25;
    const mix = clamp((k - mixAt) / 0.2, 0, 1);
    const to = from === 'n' ? 'p' : 'n';
    turn.set(i, { to, k: mix });
    const q = nucleonPlace(i, n); const sx = cx + q.x * R; const sy = cy + q.y * R;
    highlightTurn = { sx, sy, kind: mix >= 0.5 ? to : from, flipped: mix >= 0.5 };
    if (p.mode === 'capture') {
      // The innermost shell, and one of its electrons falling in.
      ctx.strokeStyle = C.dust; ctx.lineWidth = 1.4; ctx.setLineDash?.([4, 3]);
      ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), F.len(R * 1.65), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash?.([]); ctx.lineWidth = 1;
      const t = ease(clamp(k / 0.55, 0, 1));
      const a = -Math.PI / 2 + t * Math.PI * 0.9;
      const ex = lerp(cx + Math.cos(a) * R * 1.65, sx, t);
      const ey = lerp(cy + Math.sin(a) * R * 1.65, sy, t);
      if (t < 1) {
        lepton(ctx, F, ex, ey, 1.35);
        say(ctx, 'e⁻', F.x(ex + 2.2), F.y(ey - 1.5), F.size(1.7, 6.5), { color: C.e, weight: 700 });
      }
      if (k < 0.3) say(ctx, 'Inner electron', F.x(cx), F.y(cy - R * 1.65 - 1.8), F.size(1.6, 6.2), { align: 'center', color: C.dust });
    } else {
      const t = ease(clamp((k - 0.32) / 0.62, 0, 1));
      if (k > 0.28) {
        const ex = lerp(sx, f.size.w - 13, t); const ey = lerp(sy, cy - 2, t);
        lepton(ctx, F, ex, ey, 1.35, p.mode === 'positron');
        const lx = clamp(ex, 13, f.size.w - 13);
        say(ctx, p.mode === 'positron' ? 'positron, ⁰₊₁e' : 'electron, ⁰₋₁e', F.x(lx), F.y(ey + 3.6), F.size(1.8, 7), { align: 'center', color: p.mode === 'positron' ? C.positron : C.e, weight: 700, maxW: F.len(24) });
      }
    }
  }
  const jitter = watched && p.mode === 'gamma' && k < 0.45 ? Math.max(0.15, r * 0.25) * (1 - k / 0.45) : 0;
  drawNucleus(ctx, F, cx, cy, R, isP, { skip, turn, jitter, clock });
  // Enlarged, ringed nucleon on top of the nucleus so the colour change is unmistakable even in 234-nucleon nuclei.
  if (highlightTurn) {
    const hr = Math.max(r * 2.2, 2.3);
    nucleon(ctx, F, highlightTurn.sx, highlightTurn.sy, hr, highlightTurn.kind);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(F.x(highlightTurn.sx), F.y(highlightTurn.sy), F.len(hr + 0.9), 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
  }
  if (watched && p.mode === 'gamma' && k > 0.3) {
    const t = clamp((k - 0.3) / 0.7, 0, 1);
    gammaWave(ctx, F, cx + R + 1, cy, 0, (f.size.w - cx - R - 5) * t, clock * 8);
    say(ctx, 'gamma ray', F.x(clamp(cx + R + 4 + (f.size.w - cx - R - 10) * t * 0.6, 12, f.size.w - 12)), F.y(cy + 3.6), F.size(1.8, 7), { align: 'center', color: C.gamma, weight: 700 });
  }
  // Counts: the parent's, then (unless hidden) what is left. Leave enough right margin for "Watch the Nucleus".
  const rightPad = p.mode ? Math.max(36, (f.runLabel?.length || 17) * 2.0 + 4) : 0;
  const after = D && watched && k >= 1 ? decayOf(p.Z, p.Z + p.N, p.mode) : null;
  if (!after) foot(ctx, f, F, counts(p.Z, p.N), C.text, rightPad);
  else if (p.hideAfter) foot(ctx, f, F, '? protons · ? neutrons left', C.dust, rightPad);
  else foot(ctx, f, F, `${counts(after.Z, after.A - after.Z)} left`, C.amber, rightPad);
  if (p.meta && (!watched || k < 0.3)) say(ctx, 'Extra energy (m)', F.x(cx), F.y(8.4), F.size(1.7, 6.5), { align: 'center', color: C.amber, weight: 600 });
}

/** The nucleus of the picked square, with clear bars comparing proton repulsion against strong-force hold. */
function paintPushes(ctx, f, F, state, b) {
  const pick = chartPick(state, f.props.follow);
  if (!pick || pick.N == null) { say(ctx, 'Tap an element on the chart', F.x(f.size.w / 2), F.y(f.size.h / 2), F.size(1.9, 7), { align: 'center', color: C.dim }); return; }
  const { Z, N } = pick; const n = Z + N;
  const cx = f.size.w * 0.28; const cy = 14.5;
  const R = Math.min(7.5, f.size.w * 0.19) * Math.min(1, Math.sqrt(n / 80) * 0.55 + 0.45);
  const isP = protonSlots(Z, N, `${f.id}:${Z}:${N}`);
  drawNucleus(ctx, F, cx, cy, R, isP);
  say(ctx, `${nameOf(Z)}-${n}`, F.x(f.size.w * 0.54), F.y(10.5), F.size(2.0, 7.5), { color: C.text, weight: 700 });
  say(ctx, `${Z}p · ${N}n`, F.x(f.size.w * 0.54), F.y(14.5), F.size(1.8, 6.8), { color: C.amber, weight: 600 });
  // Normalized bars: repulsion scales as Z(Z-1), hold scales with nucleons N+Z.
  const repFrac = clamp((Z * (Z - 1)) / (82 * 81), 0.04, 1);
  const holdFrac = clamp(n / 208, 0.08, 1);
  const bx = 3; const bw = f.size.w - 6;
  say(ctx, 'Proton repulsion', F.x(bx), F.y(22.2), F.size(1.6, 6.2), { color: C.protonRim });
  box(ctx, F, bx, 23.4, bw, 2.0, '#221e1a', C.steel);
  box(ctx, F, bx, 23.4, bw * repFrac, 2.0, C.proton);
  say(ctx, 'Strong-force hold', F.x(bx), F.y(27.0), F.size(1.6, 6.2), { color: C.amber });
  box(ctx, F, bx, 28.2, bw, 2.0, '#221e1a', C.steel);
  box(ctx, F, bx, 28.2, bw * holdFrac, 2.0, C.alpha);
}

function paintNuc(ctx, f, state, b) {
  const F = frameOf(b);
  title(ctx, f, F, b);
  if (f.props.follow) paintPushes(ctx, f, F, state, b);
  else paintDecay(ctx, f, F, b);
}

registerFixture('nnuc', { paint: paintNuc, run: runNuc, live: () => true });

export { symbolOf };
