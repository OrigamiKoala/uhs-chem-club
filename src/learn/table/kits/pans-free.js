/**
 * kits/pans-free.js — the favourability plotter's two instruments, registered on the pans kit (`pans-registry.js`). Teeter bench 8 (`q8-free`).
 *
 *   SETTLING PAN (`kbars`)  a reaction drawn as bars: what a pan of it holds at the start (faint) and, once Run is pressed, where it settles.
 *                           The amounts are `engine/eqdata-free.js` `columnRead` (K from ΔG° and T, then `iceAmounts`). K itself is never
 *                           printed; the bars are the reading. Several columns put the same reaction at several temperatures side by side.
 *   TWO PULLS (`pulls`)     a change's ΔH and TΔS as two bars from a zero line, to one scale, and nothing else: the net is left for the
 *                           player. With `water` a Run key dissolves the salt in a beaker and reads the thermometer and what is left.
 *
 * Both are drawn flat; the drawn and the built table show the same picture. A painter prints what the planner says.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './pans-registry.js';
import { driftOf, A_INK, B_INK } from './pans-pan.js';
import { settleProgress } from './pans-ice.js';
import { say, frameOf } from './matter-draw.js';
import { columnRead, dGOf, pulls, coldPack, T_BENCH } from '../../engine/eqdata-free.js';
import { addTourText } from '../tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
/** The reactants are orange and the products blue, as on every pan of the bench before this one. */
const R_INK = '#c0652b';
const P_INK = '#6f8fb0';

const signed = (v, d = 1) => `${v < 0 ? '−' : '+'}${(Math.abs(v) + 1e-9).toFixed(d)}`;
const amt = v => (v >= 0.01 ? v.toPrecision(3) : v.toPrecision(2));

function frame(ctx, F, x, y, w, h) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
}

/* ------------------------------------------------------------------
   THE SETTLING PAN
   ------------------------------------------------------------------ */

/** What the pan reads: every column's ΔG°, K and settled amounts, and whether Run has been pressed. */
export function kbarsRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const cols = p.cols.map(c => columnRead(p.sys, c));
  const start = p.sys.order.map(s => p.sys.start[s] ?? 0);
  const max = Math.max(...start, ...cols.flatMap(c => p.sys.order.map(s => c.amounts[s])));
  return { shown: Math.round(f.dials.shown.value) === 1, cols, start, max, order: p.sys.order };
}

function paintKbars(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = kbarsRead(state, f.id);
  const w = f.size.w; const h = f.size.h;
  const n = r.cols.length; const ns = r.order.length;
  const colW = (w - 6) / n;
  const yTop = 15; const yBase = h - 11.5; const room = yBase - yTop - 3.6;
  const sz = F.size(2.1, 5.8);
  for (let c = 0; c < n; c++) {
    const x0 = 3 + c * colW;
    const col = r.cols[c];
    // The header: only what the stage lets the plotter print.
    const head = [p.showT ? `${p.cols[c].T ?? T_BENCH} K` : '', p.showDG ? `ΔG° ${signed(col.dG)} kJ/mol` : ''].filter(Boolean).join('  ');
    if (head) say(ctx, head, F.x(x0 + colW / 2), F.y(11.4), F.size(2.2, 5.8), { color: AMBER, weight: 700, align: 'center', maxW: F.len(colW - 1.5) });
    frame(ctx, F, x0 + 0.5, yTop - 1.2, colW - 1, h - 6.4 - (yTop - 1.2));
    const pitch = (colW - 3) / ns; const bw = pitch * 0.58;
    r.order.forEach((s, i) => {
      // After Run the bars glide from the starting amount to the settled one, and the bar is a crowd of particles drifting about.
      const e = settleProgress(`${b.scope || ""}${f.id}:${c}`, r.shown, b.clock || 0);
      const v = r.shown ? r.start[i] + (col.amounts[s] - r.start[i]) * e : r.start[i];
      const hgt = (v / r.max) * room;
      const bx = x0 + 1.5 + i * pitch + (pitch - bw) / 2;
      ctx.globalAlpha = r.shown ? 1 : 0.4;
      ctx.fillStyle = p.sys.species[s] < 0 ? R_INK : P_INK;
      ctx.fillRect(F.x(bx), F.y(yBase) - F.len(hgt), F.len(bw), F.len(hgt));
      ctx.globalAlpha = 1;
      if (b.clock) {
        ctx.fillStyle = 'rgba(16,15,12,0.78)';
        const nd = Math.max(0, Math.round((v / r.max) * 14));
        for (let k = 0; k < nd; k++) {
          const d = driftOf(c * 97 + i * 13 + k, b.clock, 2.2);
          const px = bx + bw * ((k % 2 + 0.5) / 2) + d.dx * bw * 0.14;
          const py = yBase - (hgt / Math.ceil(nd / 2)) * (Math.floor(k / 2) + 0.5) + d.dy * 0.8;
          ctx.beginPath(); ctx.arc(F.x(px), F.y(py), Math.max(1.2, F.len(0.55)), 0, Math.PI * 2); ctx.fill();
        }
      }
      say(ctx, amt(v), F.x(bx + bw / 2), F.y(yBase) - F.len(hgt) - F.len(1.9), sz, { color: r.shown ? DUST : DIM, align: 'center', weight: 700, maxW: F.len(pitch - 0.3) });
      say(ctx, p.sys.names[s], F.x(bx + bw / 2), F.y(yBase + 3.1), sz, { color: DIM, align: 'center', maxW: F.len(pitch - 0.4) });
    });
    ctx.strokeStyle = DIM; ctx.beginPath(); ctx.moveTo(F.x(x0 + 1), F.y(yBase)); ctx.lineTo(F.x(x0 + colW - 1), F.y(yBase)); ctx.stroke();
  }
  if (p.sub) say(ctx, p.sub, F.x(w - 13.5), F.y(h - 3.4), F.size(2.0, 5.8), { color: DIM, align: 'right', maxW: F.len(w - 38) });
  say(ctx, `${r.shown ? 'settled' : 'at the start'}, ${p.sys.unit}`, F.x(2.5), F.y(h - 3.4), F.size(2.2, 5.8), { color: r.shown ? AMBER : DIM, weight: 700, maxW: F.len(p.sub ? 22 : w - 17) });
}

function runKbars(state, fid) {
  const r = kbarsRead(state, fid);
  if (r.shown) return { noop: 'The vessel has settled.' };
  const last = r.cols[r.cols.length - 1];
  const prod = r.order[r.order.length - 1];
  return { x: 1, y: Math.round(last.amounts[prod] * 1000) / 1000, label: fid, dials: { [fid]: { shown: 1 } } };
}

registerFixture('kbars', { paint: paintKbars, run: runKbars, live: () => true });

/**
 * A settling pan. `sys` is `{species, start, names, order, unit}` (`eqdata-free.js`); `cols` is a list of `{dG}` or `{dH, dS, T}` (K and the
 * amounts follow); `showDG` / `showT` choose what the header prints (nothing, by default).
 */
export function kbarsFixture(id, at, { title, sys, cols, showDG = false, showT = false, sub = '', w = 44, h = 44, runLabel = 'Run' } = {}) {
  return {
    id, kind: 'kbars', label: title, at: { ...at }, size: { w, h }, runLabel,
    dials: { shown: { min: 0, max: 1, step: 1, value: 0, label: 'Settled' } },
    props: { hidden: ['shown'], sys, cols, showDG, showT, sub }
  };
}

/* ------------------------------------------------------------------
   THE TWO PULLS
   ------------------------------------------------------------------ */

export function pullsRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const pl = pulls(p.change);
  const shown = p.water ? Math.round(f.dials.shown.value) === 1 : false;
  const pack = p.water ? coldPack({ dH: p.change.dH, dS: p.change.dS }, p.water) : null;
  return { ...pl, shown, pack };
}

function paintPulls(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = pullsRead(state, f.id);
  const w = f.size.w; const h = f.size.h;
  const hasWater = Boolean(p.water);
  const bw = hasWater ? w * 0.5 - 6 : w - 8;
  const [lo, hi] = p.range;
  const X = v => 4 + ((v - lo) / (hi - lo)) * bw;
  const sz = F.size(2.3, 5.8);
  frame(ctx, F, 3, 10, bw + 2, 19);
  const row = (label, v, y, ink) => {
    say(ctx, `${label} ${signed(v)} kJ/mol`, F.x(4.5), F.y(y), sz, { color: DUST, weight: 700, maxW: F.len(bw - 1) });
    const x0 = Math.min(X(0), X(v)); const x1 = Math.max(X(0), X(v));
    ctx.fillStyle = ink; ctx.fillRect(F.x(x0), F.y(y + 2), Math.max(1, F.len(x1 - x0)), F.len(3.4));
  };
  row('ΔH', r.dH, 13.6, AMBER);
  row('TΔS', r.TdS, 21.2, PHOS);
  ctx.strokeStyle = DIM; ctx.beginPath(); ctx.moveTo(F.x(X(0)), F.y(11)); ctx.lineTo(F.x(X(0)), F.y(28.5)); ctx.stroke();
  say(ctx, `bars to one scale, at ${r.T} K`, F.x(2.5), F.y(h - 3.4), F.size(2.0, 5.8), { color: DIM, maxW: F.len(hasWater ? bw : w - 17) });
  if (hasWater) {
    // The beaker: 500 g of water with a thermometer; the thermometer reads the water's start until Run is pressed.
    const bx = w * 0.5 + 1; const bwid = w * 0.5 - 4;
    frame(ctx, F, bx, 10, bwid, 19);
    const T = r.pack.T0 + (r.shown ? (r.pack.T1 - r.pack.T0) * settleProgress(`${b.scope || ""}${f.id}:T`, true, b.clock || 0) : 0);
    say(ctx, `water ${T.toFixed(1)} °C`, F.x(bx + 2), F.y(13.6), sz, { color: r.shown ? AMBER : DUST, weight: 700, maxW: F.len(bwid - 9) });
    say(ctx, r.shown ? `salt left ${r.pack.left.toFixed(2)} mol` : `salt ${r.pack.mol.toFixed(2)} mol, ${p.water.waterG} g water`, F.x(bx + 2), F.y(21.2), sz, { color: DUST, maxW: F.len(bwid - 9) });
    // The salt dissolving: crystals at the foot go into the water as ions, and the ions slow as the water cools (the speed follows the reading).
    {
      const prog = r.shown ? settleProgress(`${b.scope || ""}${f.id}:T`, true, b.clock || 0) : 0;
      const nIon = Math.round(prog * 14); const nSolid = 14 - nIon;
      const wx = bx + 1.6; const ww2 = bwid - 9; const wy = 24; const wh = 4.2;
      if (b.clock) {
        for (let k = 0; k < 14; k++) {
          const d = driftOf(300 + k, b.clock, 0.6 + Math.max(0, T) / 25);
          if (k < nSolid) { ctx.fillStyle = '#d6cfb8'; ctx.fillRect(F.x(wx + (k % 7) * (ww2 / 7) + d.dx * 0.25), F.y(wy + 1.6 + Math.floor(k / 7) * 1.4 + d.dy * 0.15), Math.max(2, F.len(ww2 / 7 - 0.4)), Math.max(1.5, F.len(1.1))); }
          else {
            ctx.fillStyle = k % 2 ? B_INK : A_INK;
            ctx.beginPath(); ctx.arc(F.x(wx + ww2 * ((k * 0.137) % 1) + d.dx * 1.3), F.y(wy - 1.8 + d.dy * 1.6), Math.max(1.6, F.len(0.6)), 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      void wh;
    }
    // The thermometer tube: 0 to 40 °C, the mercury as high as the reading.
    const tx = bx + bwid - 4.5; const ty0 = 15.5; const ty1 = 27.5;
    ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(tx)) + 0.5, F.y(ty0), F.len(1.6), F.len(ty1 - ty0));
    const hg = Math.max(0, Math.min(1, T / 40)) * (ty1 - ty0);
    ctx.fillStyle = AMBER; ctx.fillRect(F.x(tx) + 1, F.y(ty1) - F.len(hg), Math.max(1.5, F.len(1.6)) - 1, F.len(hg));
  }
}

function runPulls(state, fid) {
  const f = state.fixtures[fid];
  if (!f.props.water) return null;
  const r = pullsRead(state, fid);
  if (r.shown) return { noop: 'The salt has dissolved.' };
  return { x: 1, y: Math.round(r.pack.T1 * 10) / 10, label: fid, dials: { [fid]: { shown: 1 } } };
}

registerFixture('pulls', { paint: paintPulls, run: runPulls, live: f => Boolean(f.props.water) });

/**
 * The two pulls of a change: `change` is `{dH, dS, T}` (kJ/mol, J/(mol·K), K). `range` is the shared scale in kJ/mol, `[lo, hi]`, so
 * several fixtures can be compared. With `water` ({waterG, T0, mol}) the fixture has a Run key that dissolves the salt in a beaker.
 */
export function pullsFixture(id, at, { title, change, range, water = null, w = 44, h = 36 } = {}) {
  const base = { id, kind: 'pulls', label: title, at: { ...at }, size: { w, h }, props: { change: { T: T_BENCH, ...change }, range, ...(water ? { water } : {}) } };
  if (!water) return { ...base, noRun: true, dials: {} };
  return { ...base, runLabel: 'Run', dials: { shown: { min: 0, max: 1, step: 1, value: 0, label: 'Dissolved' } }, props: { ...base.props, hidden: ['shown'] } };
}

export { dGOf };

/* ------------------------------------------------------------------
   THE TOUR: three beats a step, in earned words
   ------------------------------------------------------------------ */

addTourText({
  'pans:kbars': {
    title: 'Settling vessel', dials: false,
    text: 'A vessel of one reaction, drawn as bars. The orange bars are what the reaction starts from and the blue bars are what it makes, in the unit printed under the vessel. Faint bars show the start. Press "Run" to let the vessel settle, and the bars become solid at the amounts it holds once they stop changing.'
  },
  'pans:pulls': {
    title: 'Two pulls', dials: false,
    text: 'Two bars for one change, drawn from a zero line to one scale. The amber bar is ΔH, the heat the change takes in, and the green bar is TΔS, the entropy term, both in kJ per mole. A bar to the right is positive and a bar to the left is negative. Where a beaker stands beside the bars, press "Run" to dissolve the salt in the water and read the thermometer and the salt that is left.'
  }
}, {});
