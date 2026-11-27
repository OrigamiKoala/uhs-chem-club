/**
 * kits/nuke-chart.js — Cinder Halo's chart of nuclides (`nchart`): protons across, neutrons up, one square per nucleus.
 *
 * Options: `band` fills the stable squares (from `nucdata.js` STABLE); `line` draws where protons equal neutrons; `marks` outline named
 * squares (an unnamed mark has no label); `eq` writes a nuclear equation whose unknown is the square picked; `legend` draws the three moves
 * of a decay as keys (the answer on stages that ask which decay); modes:
 *   pick     a tap on a square picks it (the answer, or a reading)
 *   columns  a tap on a column reads that element's stable nuclei (for a chart too fine to tap square by square)
 *   walk     "Alpha" and "Beta" keys move a marker from `start` one decay at a time and draw its path (`props.path`, kept by `dialed`)
 *   move     the legend's keys are the answer; the move chosen is drawn from the first mark (unless `preview: false`)
 */

import { stable, stableOf, symbolOf, nameOf, stepOf, DECAY } from '../../engine/nucdata.js';
import { registerFixture } from './nuke-registry.js';
import { C, frameOf, say, title, foot, box, key, keyRow, nucSym } from './nuke-draw.js';
import { chartDims, chartPick, chartMove, walkAt, MOVES } from './nuke-chart-read.js';

export function nchartFixture(id, at, { z, n, band = false, line = false, marks = [], eq = null, legend = false, mode = 'pick', start = null, w = 96, h = 50, title: ttl = 'Chart of nuclides', reading = true, preview = true } = {}) {
  const cells = (z[1] - z[0] + 1) * (n[1] - n[0] + 1);
  const dials = {};
  const hidden = [];
  if (mode === 'pick') { dials.pick = { min: 0, max: cells, step: 1, value: 0, label: 'Square' }; hidden.push('pick'); }
  if (mode === 'columns') { dials.pick = { min: 0, max: z[1] - z[0] + 1, step: 1, value: 0, label: 'Element' }; hidden.push('pick'); }
  if (mode === 'walk') { dials.na = { min: 0, max: 20, step: 1, value: 0, label: 'Alpha steps' }; dials.nb = { min: 0, max: 20, step: 1, value: 0, label: 'Beta steps' }; hidden.push('na', 'nb'); }
  if (legend || mode === 'move') { dials.move = { min: 0, max: 3, step: 1, value: 0, label: 'Move' }; hidden.push('move'); }
  return {
    id, kind: 'nchart', label: ttl, at: { ...at }, size: { w, h }, dials, noRun: true,
    props: { z, n, band, line, marks, eq, legend: legend || mode === 'move', mode, start, path: '', reading, preview, hidden }
  };
}

/** The geometry of the grid inside the fixture, in fixture units. */
function gridOf(f) {
  const d = chartDims(f);
  const right = f.props.legend ? 32 : 2.5;
  const top = 8.0; const bottom = f.props.eq || f.props.mode === 'walk' ? 13 : 10; const left = 8.5;
  const gw = f.size.w - left - right; const gh = f.size.h - top - bottom;
  const cell = Math.min(gw / d.cols, gh / d.rows);
  const x0 = left + (gw - cell * d.cols) / 2; const y0 = top + (gh - cell * d.rows) / 2;
  return { ...d, cell, x0, y0, X: Z => x0 + (Z - d.z0) * cell, Y: N => y0 + (d.n1 - N) * cell };
}
const legendKeys = f => {
  const x0 = f.size.w - 30; const out = [];
  ['Alpha', 'Beta', 'Positron'].forEach((t, i) => out.push({ x0, x1: f.size.w - 2, y0: 9.5 + i * 10, y1: 9.5 + i * 10 + 8.5, value: i + 1, text: t }));
  return out;
};
const walkKeys = f => keyRow(['Alpha', 'Beta'], f.size.w - 27, f.size.h - 11.6, { h: 5 }).map((z, i) => ({ ...z, dial: i ? 'nb' : 'na', text: i ? 'Beta' : 'Alpha' }));

function zones(f) {
  const G = gridOf(f);
  const out = [];
  if (f.props.mode === 'pick') {
    for (let N = G.n0; N <= G.n1; N++) for (let Z = G.z0; Z <= G.z1; Z++) {
      const x = G.X(Z); const y = G.Y(N);
      out.push({ x0: x, x1: x + G.cell, y0: y, y1: y + G.cell, dial: 'pick', value: (N - G.n0) * G.cols + (Z - G.z0) + 1 });
    }
  }
  if (f.props.mode === 'columns') for (let Z = G.z0; Z <= G.z1; Z++) out.push({ x0: G.X(Z), x1: G.X(Z) + G.cell, y0: G.y0, y1: G.y0 + G.rows * G.cell, dial: 'pick', value: Z - G.z0 + 1 });
  if (f.props.legend) for (const z of legendKeys(f)) out.push({ x0: z.x0, x1: z.x1, y0: z.y0, y1: z.y1, dial: 'move', value: z.value });
  if (f.props.mode === 'walk') for (const z of walkKeys(f)) out.push({ x0: z.x0, x1: z.x1, y0: z.y0, y1: z.y1, dial: z.dial, step: 1 });
  return out;
}

/** The arrow of one move drawn in a small square diagram (the legend), or on the grid from a square. */
function arrow(ctx, F, x0, y0, x1, y1, color = C.amber) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(y0)); ctx.lineTo(F.x(x1), F.y(y1)); ctx.stroke(); ctx.lineWidth = 1;
  const a = Math.atan2(F.y(y1) - F.y(y0), F.x(x1) - F.x(x0)); const s = 8;
  ctx.beginPath(); ctx.moveTo(F.x(x1), F.y(y1)); ctx.lineTo(F.x(x1) - s * Math.cos(a - 0.45), F.y(y1) - s * Math.sin(a - 0.45)); ctx.lineTo(F.x(x1) - s * Math.cos(a + 0.45), F.y(y1) - s * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
}

function paintChart(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  title(ctx, f, F, b);
  const G = gridOf(f);
  const big = G.cell >= 4.2;
  // Shade region past Z = 83 when showing the band beyond bismuth.
  if (p.band && G.z1 > 83 && G.z0 <= 83) {
    const sx = G.X(84);
    box(ctx, F, sx, G.y0, G.x0 + G.cols * G.cell - sx, G.rows * G.cell, 'rgba(180,70,40,0.12)');
  }
  // Grid and squares.
  for (let N = G.n0; N <= G.n1; N++) for (let Z = G.z0; Z <= G.z1; Z++) {
    const x = G.X(Z); const y = G.Y(N);
    const st = p.band && stable(Z, N);
    if (st) box(ctx, F, x + 0.08, y + 0.08, Math.max(0.5, G.cell - 0.16), Math.max(0.5, G.cell - 0.16), '#c9933e');
    else if (big || G.cell > 2.0) box(ctx, F, x, y, G.cell, G.cell, null, '#2e2a24');
    if (big) {
      say(ctx, symbolOf(Z), F.x(x + G.cell / 2), F.y(y + G.cell * 0.36), F.size(G.cell * 0.32, 7.5), { align: 'center', color: st ? '#12100d' : C.text, sans: true, weight: 700 });
      say(ctx, String(Z + N), F.x(x + G.cell / 2), F.y(y + G.cell * 0.74), F.size(G.cell * 0.25, 6.5), { align: 'center', color: st ? '#261f16' : C.dust, sans: true });
    }
  }
  if (!big && G.cell > 0.3) {
    box(ctx, F, G.x0, G.y0, G.cols * G.cell, G.rows * G.cell, null, '#4a443b');
  }
  // Vertical end-of-band marker at Z = 83.
  if (p.band && G.z1 > 83 && G.z0 <= 83) {
    const ex = G.X(84);
    ctx.strokeStyle = C.protonRim; ctx.lineWidth = 1.6; ctx.setLineDash?.([4, 3]);
    ctx.beginPath(); ctx.moveTo(F.x(ex), F.y(G.y0)); ctx.lineTo(F.x(ex), F.y(G.y0 + G.rows * G.cell)); ctx.stroke();
    ctx.setLineDash?.([]); ctx.lineWidth = 1;
    say(ctx, 'No stable nuclei beyond 83', F.x(ex + 0.8), F.y(G.y0 + 2.2), F.size(1.7, 7), { color: C.protonRim, weight: 700, maxW: F.len(G.x0 + G.cols * G.cell - ex - 1) });
  }
  // Axes: protons along the bottom, neutrons up the left.
  const every = Math.max(1, Math.ceil(9 / G.cell));
  for (let Z = G.z0; Z <= G.z1; Z += every) say(ctx, String(Z), F.x(G.X(Z) + G.cell / 2), F.y(G.y0 + G.rows * G.cell + 2.2), F.size(2.0, 9), { align: 'center', color: C.dust, weight: 600 });
  for (let N = G.n0; N <= G.n1; N += every) say(ctx, String(N), F.x(G.x0 - 1.0), F.y(G.Y(N) + G.cell / 2), F.size(2.0, 9), { align: 'right', color: C.dust, weight: 600 });
  say(ctx, 'Protons →', F.x(G.x0 + G.cols * G.cell), F.y(G.y0 + G.rows * G.cell + 5.2), F.size(2.0, 9), { align: 'right', color: C.text, weight: 600 });
  say(ctx, 'Neutrons ↑', F.x(1.2), F.y(G.y0 - 1.8), F.size(2.0, 9), { align: 'left', color: C.text, weight: 600 });
  // Protons equal neutrons.
  if (p.line) {
    const lo = Math.max(G.z0, G.n0); const hi = Math.min(G.z1 + 1, G.n1 + 1);
    if (hi > lo) {
      ctx.strokeStyle = '#9aa3ab'; ctx.lineWidth = 1.4; ctx.setLineDash?.([4, 3]);
      ctx.beginPath(); ctx.moveTo(F.x(G.X(lo)), F.y(G.Y(lo) + G.cell)); ctx.lineTo(F.x(G.X(hi)), F.y(G.Y(hi) + G.cell)); ctx.stroke();
      ctx.setLineDash?.([]); ctx.lineWidth = 1;
      const lx = Math.min(G.x0 + G.cols * G.cell - 1.5, G.X(hi) - 1);
      const ly = Math.max(G.y0 + 3, Math.min(G.y0 + G.rows * G.cell - 2, G.Y(hi) + G.cell + 2.6));
      say(ctx, 'protons = neutrons', F.x(lx), F.y(ly), F.size(1.8, 8), { align: 'right', color: '#b8c2cc', maxW: F.len(G.cols * G.cell * 0.7) });
    }
  }
  // Marks.
  for (const m of p.marks) {
    if (m.Z < G.z0 || m.Z > G.z1 || m.N < G.n0 || m.N > G.n1) continue;
    const x = G.X(m.Z); const y = G.Y(m.N);
    ctx.strokeStyle = C.e; ctx.lineWidth = 2.2; ctx.strokeRect(F.x(x) + 1, F.y(y) + 1, F.len(G.cell) - 2, F.len(G.cell) - 2); ctx.lineWidth = 1;
    if (m.label) say(ctx, m.label, F.x(x + G.cell + 0.8), F.y(y + G.cell / 2), F.size(1.9, 7.5), { color: C.e, weight: 700 });
  }
  // The walk.
  if (p.mode === 'walk') {
    const W = walkAt(f);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 1.8;
    ctx.beginPath();
    W.path.forEach((q, i) => { const x = F.x(G.X(q.Z) + G.cell / 2); const y = F.y(G.Y(q.N) + G.cell / 2); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.stroke(); ctx.lineWidth = 1;
    const inside = W.Z >= G.z0 && W.Z <= G.z1 && W.N >= G.n0 && W.N <= G.n1;
    if (inside) { ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(F.x(G.X(W.Z) + G.cell / 2), F.y(G.Y(W.N) + G.cell / 2), Math.max(3.5, F.len(G.cell * 0.42)), 0, Math.PI * 2); ctx.fill(); }
    for (const z of walkKeys(f)) key(ctx, F, z, z.text);
    say(ctx, inside ? `Marker: ${nameOf(W.Z)}-${W.Z + W.N}` : 'The marker has left the chart', F.x(2.2), F.y(f.size.h - 9.2), F.size(1.9, 7), { color: inside ? C.text : C.amber, weight: 600, maxW: F.len(f.size.w - 32) });
    foot(ctx, f, F, `${W.alphas} alpha and ${W.betas} beta step${W.betas === 1 ? '' : 's'}`, C.dust, 28);
  }
  // The legend of moves: each a key with its arrow drawn clearly, and a live preview arrow on the chart when tapped.
  if (p.legend) {
    const mv = chartMove(state, f.id);
    say(ctx, 'Moves on the chart', F.x(f.size.w - 30), F.y(7.4), F.size(1.8, 7), { color: C.dust, weight: 600 });
    legendKeys(f).forEach((z, i) => {
      const on = mv === MOVES[i];
      key(ctx, F, { ...z, x1: z.x1 }, '', on);
      const s = stepOf(MOVES[i]);
      const cx = z.x0 + 5.8; const cy = (z.y0 + z.y1) / 2; const u = 2.0;
      arrow(ctx, F, cx, cy, cx + s.dZ * u, cy - s.dN * u, on ? C.amber : C.text);
      say(ctx, z.text, F.x(z.x0 + 11.5), F.y(cy), F.size(2.0, 7.5), { color: on ? C.amber : C.text, weight: on ? 700 : 600 });
    });
    const from = p.marks[0];
    if (mv && from) {
      const s = stepOf(mv);
      const to = { Z: from.Z + s.dZ, N: from.N + s.dN };
      arrow(ctx, F, G.X(from.Z) + G.cell / 2, G.Y(from.N) + G.cell / 2, G.X(to.Z) + G.cell / 2, G.Y(to.N) + G.cell / 2);
      foot(ctx, f, F, `${DECAY[mv].name}: ${nameOf(from.Z)}-${from.Z + from.N} → ${nameOf(to.Z)}-${to.Z + to.N}`, C.amber, 32);
    }
  }
  // The square picked: outlined; its reading; the equation.
  const pk = p.mode === 'pick' || p.mode === 'columns' ? chartPick(state, f.id) : null;
  if (pk && p.mode === 'pick') {
    const x = G.X(pk.Z); const y = G.Y(pk.N);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 2.4; ctx.strokeRect(F.x(x) + 0.5, F.y(y) + 0.5, F.len(G.cell) - 1, F.len(G.cell) - 1); ctx.lineWidth = 1;
  }
  if (pk && p.mode === 'columns') {
    ctx.strokeStyle = C.amber; ctx.lineWidth = 1.5; ctx.strokeRect(F.x(G.X(pk.Z)), F.y(G.y0), Math.max(2, F.len(G.cell)), F.len(G.rows * G.cell)); ctx.lineWidth = 1;
  }
  if (p.reading && pk) {
    let text;
    if (p.mode === 'columns') {
      const st = stableOf(pk.Z).map(A => A - pk.Z);
      text = st.length ? `${nameOf(pk.Z)}, ${pk.Z} protons: stable with ${st.length === 1 ? st[0] : `${st.slice(0, -1).join(', ')} or ${st[st.length - 1]}`} neutrons` : `${nameOf(pk.Z)}, ${pk.Z} protons: none stable`;
    } else text = `${nameOf(pk.Z)}-${pk.Z + pk.N}: ${pk.Z} protons, ${pk.N} neutrons${p.band ? (stable(pk.Z, pk.N) ? ', stable' : ', not stable') : ''}`;
    if (!p.eq && !p.legend) foot(ctx, f, F, text, C.amber);
    else if (!p.eq) say(ctx, text, F.x(2.2), F.y(f.size.h - 7.2), F.size(1.8, 6.2), { color: C.amber, maxW: F.len(f.size.w - 32) });
  }
  if (p.eq) {
    // parent → ? + particle (or particle in front for capture), the unknown written in from the pick.
    const y = f.size.h - 4.2; let x = 3;
    const P = p.eq.parent;
    x += nucSym(ctx, F, x, y, P.A, P.Z, symbolOf(P.Z), 2.4) + 1.2;
    if (p.eq.capture) { say(ctx, '+', F.x(x), F.y(y), F.size(2.4, 7), { sans: true }); x += 2.4; x += nucSym(ctx, F, x, y, 0, '−1', 'e', 2.4) + 1.2; }
    say(ctx, '→', F.x(x), F.y(y), F.size(2.4, 7), { sans: true }); x += 3.4;
    if (pk) x += nucSym(ctx, F, x, y, pk.Z + pk.N, pk.Z, symbolOf(pk.Z), 2.4, { color: C.amber }) + 1.2;
    else { say(ctx, '?', F.x(x), F.y(y), F.size(2.6, 7.5), { color: C.amber, weight: 700, sans: true }); x += 2.6; }
    if (p.eq.particle) {
      say(ctx, '+', F.x(x), F.y(y), F.size(2.4, 7), { sans: true }); x += 2.4;
      const q = p.eq.particle;
      nucSym(ctx, F, x, y, q.A, q.Z, q.sym, 2.4);
    }
  }
}

registerFixture('nchart', {
  paint: paintChart,
  tapZones: zones,
  // A walk keeps the order of its steps: each step a key takes is written on the chart's path.
  dialed: (state, f, dial) => (f.props.mode === 'walk' && (dial === 'na' || dial === 'nb') ? { props: { path: `${f.props.path || ''}${dial === 'na' ? 'a' : 'b'}` } } : null)
});
