/**
 * kits/nuke-scale.js — Cinder Halo's balance (`nscale`), binding-energy curve (`ncurve`) and chain chamber (`nchain`).
 *
 *   nscale   two pans and a beam. In build mode the left pan is loaded a proton or a neutron at a time ("Add Proton", "Add Neutron";
 *            Undo takes one off); otherwise each pan holds a named load. Each pan prints its mass in u to six decimals (`massOf` in `nucdata.js`) and
 *            the beam tips toward the heavier.
 *   ncurve   binding energy per nucleon against mass number, from `BE_PER_NUCLEON`. Tap a point to read it (and, where the stage asks,
 *            to answer with it). `marks` names the points shown; an unnamed mark carries only a letter.
 *   nchain   a block of uranium-235. In `split` mode "Fire Neutron" splits one nucleus into barium-141, krypton-92 and three neutrons; in
 *            `chain` mode it runs four generations of fission with the control rods soaking up the number of each fission's three
 *            neutrons the rod keys set, and prints the fissions in each generation.
 */

import { massOf, LOADS, BE_PER_NUCLEON, longName, generations, MASS } from '../../engine/nucdata.js';
import { registerFixture } from './nuke-registry.js';
import { C, frameOf, say, title, foot, box, key, keyRow, progress, clamp, lerp, ease, nucleon, drawNucleus, protonSlots } from './nuke-draw.js';

/* ------------------------------------------------------------------ the balance */

export function nscaleFixture(id, at, { build = false, left = null, right, leftLabel = '', rightLabel = '', w = 96, h = 40, title: ttl = 'Balance' } = {}) {
  const dials = build ? { np: { min: 0, max: 4, step: 1, value: 0, label: 'Protons' }, nn: { min: 0, max: 4, step: 1, value: 0, label: 'Neutrons' } } : {};
  return { id, kind: 'nscale', label: ttl, at: { ...at }, size: { w, h }, noRun: true, dials, props: { build, left, right, leftLabel, rightLabel, hidden: Object.keys(dials) } };
}
/** The two pans' loads and masses (u); the left is null while empty. */
export function scaleRead(state, id) {
  const f = state.fixtures[id];
  const p = f.props;
  const leftLoad = p.build ? { p: Math.round(f.dials.np.value), n: Math.round(f.dials.nn.value) } : LOADS[p.left];
  const empty = p.build && !leftLoad.p && !leftLoad.n;
  return { leftLoad, left: empty ? null : massOf(leftLoad), right: massOf(LOADS[p.right]) };
}
const scaleKeys = f => {
  if (!f.props.build) return [];
  const zs = keyRow(['Add Proton', 'Add Neutron'], 0, f.size.h - 6.2, { h: 4.6 });
  return zs.map((z, i) => ({ ...z, x0: z.x0 + 2, x1: z.x1 + 2, text: ['Add Proton', 'Add Neutron'][i], i }));
};
function paintScale(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  title(ctx, f, F, b);
  const r = scaleRead(state, f.id);
  for (const z of scaleKeys(f)) key(ctx, F, z, z.text);
  const cx = f.size.w / 2; const py = 9; const arm = f.size.w * 0.3;
  const tilt = r.left == null ? 0 : clamp((r.left - r.right) * 6, -0.16, 0.16);
  const k = progress(`${f.id}:tilt`, b, Math.round(tilt * 1000) + 1000, 0.8);
  const a = tilt * ease(k);
  // Post, beam, pans.
  box(ctx, F, cx - 0.6, py, 1.2, f.size.h * 0.42, '#55534c');
  const lx = cx - arm * Math.cos(a); const ly = py + 1 + arm * Math.sin(a);
  const rx = cx + arm * Math.cos(a); const ry = py + 1 - arm * Math.sin(a);
  ctx.strokeStyle = C.dust; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(F.x(lx), F.y(ly)); ctx.lineTo(F.x(rx), F.y(ry)); ctx.stroke(); ctx.lineWidth = 1;
  const pan = (x, y, label, mass, draw) => {
    ctx.strokeStyle = C.steel; ctx.beginPath(); ctx.moveTo(F.x(x), F.y(y)); ctx.lineTo(F.x(x), F.y(y + 7)); ctx.stroke();
    box(ctx, F, x - 10, y + 7, 20, 1.2, '#6b625a');
    draw(x, y + 5.4);
    say(ctx, label, F.x(x), F.y(y + 11), F.size(1.6, 6), { align: 'center', color: C.dust, maxW: F.len(arm * 1.1) });
    say(ctx, mass == null ? 'empty' : `${mass.toFixed(6)} u`, F.x(x), F.y(y + 14.4), F.size(2.1, 7), { align: 'center', color: mass == null ? C.dim : C.amber, weight: 700, sans: true });
  };
  const loadDraw = load => (x, y) => {
    const parts = [];
    for (const [kname, c] of Object.entries(load)) for (let i = 0; i < c; i++) parts.push(kname);
    parts.forEach((kname, i) => {
      const px = x - (parts.length - 1) * 1.6 + i * 3.2;
      if (kname === 'p' || kname === 'n') nucleon(ctx, F, px, y - 1, 1.3, kname);
      else { box(ctx, F, px - 1.4, y - 2.6, 2.8, 2.8, '#7b6a52', C.dust); }
    });
  };
  const nucDraw = (Z, N) => (x, y) => drawNucleus(ctx, F, x, y - 1.6, 2.4, protonSlots(Z, N, `${f.id}:${Z}`));
  const leftDraw = p.build ? loadDraw(r.leftLoad) : loadDraw(LOADS[p.left]);
  const rightLoad = LOADS[p.right];
  const rightDraw = rightLoad.He4n ? nucDraw(2, 2) : loadDraw(rightLoad);
  pan(lx, ly, p.leftLabel || (p.build ? 'Free protons and neutrons' : ''), r.left, leftDraw);
  pan(rx, ry, p.rightLabel, r.right, rightDraw);
}
registerFixture('nscale', {
  paint: paintScale,
  live: () => true,
  tapZones: f => scaleKeys(f).map(z => ({ x0: z.x0, x1: z.x1, y0: z.y0, y1: z.y1, dial: z.i ? 'nn' : 'np', step: 1 }))
});

/* ------------------------------------------------------------------ the curve */

/**
 * @param {object} o `marks` [{ name, label }] points to show named (`label` replaces the name; an empty label hides it); `all` draws every
 *   point (else only the marks, over a faint line of the whole curve); `pick` makes points tappable as the answer.
 */
export function ncurveFixture(id, at, { marks = null, all = true, pick = true, w = 96, h = 50, title: ttl = 'Binding energy per nucleon' } = {}) {
  const pts = marks ? marks.map(m => m.name) : BE_PER_NUCLEON.map(r => r.name);
  const dials = pick ? { pick: { min: 0, max: pts.length, step: 1, value: 0, label: 'Point' } } : {};
  return { id, kind: 'ncurve', label: ttl, at: { ...at }, size: { w, h }, noRun: true, dials, props: { marks, all, pts, hidden: Object.keys(dials) } };
}
const curveGeom = f => ({ x0: 8, x1: f.size.w - 3, y0: 8, y1: f.size.h - 10, Amax: 245, Emax: 9.5 });
const ptXY = (f, row) => { const G = curveGeom(f); return { x: G.x0 + (row.A / G.Amax) * (G.x1 - G.x0), y: G.y1 - (row.be / G.Emax) * (G.y1 - G.y0) }; };
/** The point picked (its row of `BE_PER_NUCLEON` and its mark), or null. */
export function curvePick(state, id) {
  const f = state.fixtures[id];
  const v = Math.round(f.dials.pick?.value || 0);
  if (!v) return null;
  const name = f.props.pts[v - 1];
  return { ...BE_PER_NUCLEON.find(r => r.name === name), mark: f.props.marks?.[v - 1] || null };
}
function paintCurve(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  title(ctx, f, F, b);
  const G = curveGeom(f);
  box(ctx, F, G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0, null, C.dim);
  for (const e of [2, 4, 6, 8]) { const y = G.y1 - (e / G.Emax) * (G.y1 - G.y0); say(ctx, String(e), F.x(G.x0 - 0.8), F.y(y), F.size(1.5, 5.6), { align: 'right', color: C.dim }); }
  for (const A of [50, 100, 150, 200]) say(ctx, String(A), F.x(G.x0 + (A / G.Amax) * (G.x1 - G.x0)), F.y(G.y1 + 1.8), F.size(1.5, 5.6), { align: 'center', color: C.dim });
  say(ctx, 'MeV per nucleon', F.x(G.x0 + 0.8), F.y(G.y0 + 1.8), F.size(1.5, 5.6), { color: C.dust });
  say(ctx, 'Mass number →', F.x(G.x1), F.y(G.y1 + 4.4), F.size(1.6, 6), { align: 'right', color: C.dust });
  // The whole curve, faint.
  ctx.strokeStyle = 'rgba(184,175,160,0.45)'; ctx.beginPath();
  [...BE_PER_NUCLEON].sort((a, c) => a.A - c.A).forEach((row, i) => { const q = ptXY(f, row); if (i) ctx.lineTo(F.x(q.x), F.y(q.y)); else ctx.moveTo(F.x(q.x), F.y(q.y)); });
  ctx.stroke();
  const picked = curvePick(state, f.id);
  if (p.all && !p.marks) for (const row of BE_PER_NUCLEON) { const q = ptXY(f, row); ctx.fillStyle = picked?.name === row.name ? C.amber : C.e; ctx.fillRect(F.x(q.x) - 2, F.y(q.y) - 2, 4, 4); }
  for (const m of p.marks || []) {
    const row = BE_PER_NUCLEON.find(r => r.name === m.name); const q = ptXY(f, row);
    const on = picked?.name === m.name;
    ctx.fillStyle = on ? C.amber : C.e; ctx.beginPath(); ctx.arc(F.x(q.x), F.y(q.y), on ? 4 : 3, 0, Math.PI * 2); ctx.fill();
    const lab = m.label ?? longName(m.name);
    if (lab) say(ctx, lab, F.x(q.x + 1.6), F.y(q.y + 2.6), F.size(1.7, 6.2), { color: on ? C.amber : C.text, weight: 600 });
  }
  if (picked) {
    const lab = picked.mark?.label ?? longName(picked.name);
    foot(ctx, f, F, `${lab}: mass number ${picked.A}, ${(Math.round((picked.be + 1e-9) * 10) / 10).toFixed(1)} MeV per nucleon`, C.amber);
  } else if (p.pts.length && f.dials.pick) foot(ctx, f, F, 'Tap a point to read it', C.dust);
}
registerFixture('ncurve', {
  paint: paintCurve,
  tapZones: f => (f.dials.pick ? f.props.pts.map((name, i) => { const q = ptXY(f, BE_PER_NUCLEON.find(r => r.name === name)); return { x0: q.x - 2.2, x1: q.x + 2.2, y0: q.y - 2.2, y1: q.y + 2.2, dial: 'pick', value: i + 1 }; }) : [])
});

/* ------------------------------------------------------------------ the chain chamber */

const ROD = ['None', 'One', 'All three'];
const ROD_N = [0, 1, 3];
export function nchainFixture(id, at, { mode = 'chain', w = 96, h = 40, title: ttl = null } = {}) {
  const dials = mode === 'chain' ? { rods: { min: 0, max: 2, step: 1, value: 0, label: 'Rods soak up' } } : {};
  return { id, kind: 'nchain', label: ttl || (mode === 'chain' ? 'Chain chamber' : 'One uranium-235 nucleus'), at: { ...at }, size: { w, h }, dials, runLabel: 'Fire Neutron', props: { mode, hidden: Object.keys(dials), last: { n: 0, absorbed: 0 } } };
}
/** The last firing: the generations it ran (chain) or that it split (split). */
export const chainRead = (state, id) => { const f = state.fixtures[id]; return { fired: f.props.last.n, absorbed: f.props.last.absorbed, gens: generations(f.props.last.absorbed, 4) }; };
const rodKeys = f => {
  if (f.props.mode !== 'chain') return [];
  const zs = keyRow(ROD.map(r => `Soak up ${r.toLowerCase()}`), 0, 1.0, { h: 4.6, per: 1.6 });
  const width = zs[zs.length - 1].x1;
  return zs.map((z, i) => ({ ...z, x0: z.x0 + f.size.w - width - 2, x1: z.x1 + f.size.w - width - 2, value: i, text: `Soak up ${ROD[i].toLowerCase()}` }));
};
function runChain(state, fid) {
  const f = state.fixtures[fid];
  f.props.last = { n: f.props.last.n + 1, absorbed: f.props.mode === 'chain' ? ROD_N[Math.round(f.dials.rods.value)] : 0 };
  return { stamp: {} };
}
function paintChain(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  title(ctx, f, F, b);
  const rods = p.mode === 'chain' ? Math.round(f.dials.rods.value) : 0;
  for (const z of rodKeys(f)) key(ctx, F, z, z.text, rods === z.value);
  const right = Math.max(9, f.runLabel.length * 1.9 + 3) + 3;
  const k = p.last.n ? progress(`${f.id}:fire`, b, p.last.n, p.mode === 'chain' ? 4 : 2.6) : 0;
  const wy = 7.5; const wh = f.size.h - 15.5;
  box(ctx, F, 2, wy, f.size.w - 4, wh, C.win, C.steel);
  if (p.mode === 'split') {
    const cx = f.size.w * 0.42; const cy = wy + wh / 2;
    const t = ease(clamp((k - 0.25) / 0.5, 0, 1));
    const nx = lerp(6, cx - 4, clamp(k / 0.25, 0, 1));
    if (!p.last.n || k < 0.25) { nucleon(ctx, F, nx, cy, 0.9, 'n'); drawNucleus(ctx, F, cx, cy, 4.2, protonSlots(92, 143, 'u235')); say(ctx, 'uranium-235', F.x(cx), F.y(cy + 6.4), F.size(1.6, 6), { align: 'center', color: C.dust }); }
    else {
      drawNucleus(ctx, F, cx - t * 14, cy - t * 3, 3.4, protonSlots(56, 85, 'ba')); drawNucleus(ctx, F, cx + t * 14, cy + t * 3, 2.9, protonSlots(36, 56, 'kr'));
      for (let i = 0; i < 3; i++) nucleon(ctx, F, cx + t * (10 + i * 4), cy - 6 + i * 6 * t, 0.9, 'n');
      if (k >= 1) { say(ctx, 'barium-141', F.x(cx - 14), F.y(cy + 3.2), F.size(1.6, 6), { align: 'center', color: C.text }); say(ctx, 'krypton-92', F.x(cx + 14), F.y(cy + 7), F.size(1.6, 6), { align: 'center', color: C.text }); }
    }
    foot(ctx, f, F, p.last.n && k >= 1 ? 'Split: barium-141, krypton-92 and 3 neutrons' : `Press "${f.runLabel}"`, p.last.n && k >= 1 ? C.text : C.dust, right);
    return;
  }
  // Chain: four generations as columns; each fission a nucleus, each freed neutron a dot that goes on, or stops in a rod.
  const gens = generations(p.last.absorbed, 4);
  const shown = p.last.n ? Math.min(4, Math.floor(k * 4.2) + 1) : 0;
  const colW = (f.size.w - 8) / 4;
  for (let g = 0; g < shown; g++) {
    const x = 4 + colW * (g + 0.5); const n = gens[g];
    const draw = Math.min(n, 27); const rows = Math.ceil(Math.sqrt(draw)) || 1; const step = Math.min(3.2, (wh - 8) / rows);
    for (let i = 0; i < draw; i++) nucleon(ctx, F, x - (rows - 1) * step / 2 + (i % rows) * step, wy + 3 + Math.floor(i / rows) * step, Math.min(1.1, step * 0.38), 'n', '#7b6a52');
    say(ctx, `${n} fission${n === 1 ? '' : 's'}`, F.x(x), F.y(wy + wh - 2.2), F.size(1.7, 6.2), { align: 'center', color: C.amber, weight: 600 });
    if (g < 3 && p.last.absorbed) box(ctx, F, x + colW / 2 - 0.4, wy + 1, 0.8, wh - 6, '#3e4248');
  }
  foot(ctx, f, F, p.last.n ? `Rods soak up ${p.last.absorbed} of each fission's 3 neutrons` : `Set the rods, then press "${f.runLabel}"`, C.dust, right);
}
registerFixture('nchain', {
  paint: paintChain,
  run: runChain,
  live: () => true,
  tapZones: f => rodKeys(f).map(z => ({ x0: z.x0, x1: z.x1, y0: z.y0, y1: z.y1, dial: 'rods', value: z.value }))
});

export { MASS };
