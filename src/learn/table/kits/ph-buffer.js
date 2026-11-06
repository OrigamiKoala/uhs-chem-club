/**
 * kits/ph-buffer.js — the mixing flask (`phmix`), registered on the ph kit. Verdigris's buffer benches (`q7-buffer`, `q8-capacity`).
 *
 *   MIXING FLASK  a flask of 100 mL holding some of a weak acid (HA) and some of its salt (A⁻), or only water, with a window of spheres
 *                 (one sphere is 0.1 mmol), a built-in pH meter, and a Pour key. One press pours a fixed amount of strong acid or strong
 *                 base (the flask's reagent, or its "Pour in" dial). A pour is counted from `engine/phdata.js` `bufferState`: the exact
 *                 pH by charge balance, and the moles of HA and A⁻ after it. A sphere that took a proton or gave one away is drawn
 *                 ringed, so the window shows what caught the pour; a count under half a sphere shows none.
 *                 Options turn on a "build" mode (two dials set how much HA and A⁻ the flask holds), a sealed window (contents hidden),
 *                 and `meter: false` (the stage asks for the pH).
 *
 * A thin wrapper over the planner: a painter decides nothing. Pure readers (`mixRead`) are used by the quests' checks and story painters.
 */

import * as THREE from 'three';
import { PLATE_COLORS, mulberry32 } from '../../engine/plates.js';
import { registerFixture } from './ph-registry.js';
import { frameOf } from './matter-draw.js';
import { ACIDS, bufferState, fmt } from '../../engine/phdata.js';
import { wobble } from '../../engine/phmotion.js';
import { withDial } from './ph-replay.js';
import { cellGrid, H_INK, OH_INK, ACID_INK, BASE_INK, ionText } from './ph-read.js';
import { put, ball } from './ph-flask.js';
import './ph-buffer-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;

/** Moles one sphere stands for. */
export const U = 1e-4;
const DIAL_TOP = 10.5;

/** The flask's contents and its reading after the pours made so far. `ha0`/`a0` are sphere counts (a built flask reads them from its dials). */
export function mixRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const lv = i => p.levels[Math.round(f.dials[i].value) - 1];
  const ha0 = p.build ? lv('ha') : p.ha0;
  const a0 = p.build ? lv('a') : p.a0;
  const na = Math.round(f.dials.na.value); const nb = Math.round(f.dials.nb.value);
  const args = { Ka: p.Ka, nHA: ha0 * U, nA: a0 * U, V: p.V };
  const st = bufferState({ ...args, nH: na * p.acidSph * U, nOH: nb * p.baseSph * U, vAdd: (na + nb) * p.pourVol });
  const st0 = bufferState(args);
  const tot = ha0 + a0;
  const Au = tot ? Math.round(st.A / U) : 0;
  const HAu = tot - Au;
  const reagent = p.reagent === 'dial' ? (Math.round(f.dials.rg.value) === 1 ? 'acid' : 'base') : p.reagent;
  const H = Math.round((st.h * st.Vt) / U); const OH = Math.round((st.oh * st.Vt) / U);
  return {
    f, ha0, a0, na, nb, pours: na + nb, st, st0, reagent, pH: st.pH, pH0: st0.pH,
    HAu, Au, caughtHA: Math.max(0, HAu - ha0), caughtA: Math.max(0, Au - a0), H: tot ? H : H, OH
  };
}

function paintMix(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = mixRead(state, f.id);
  const w = f.size.w;
  put(ctx, `${Math.round(p.V * 1000)} mL`, F.x(2), F.y(7.6), F.size(2.4, 6.4), { align: 'left', color: TEXTC, weight: 700 });
  put(ctx, 'one sphere is 0.1 mmol', F.x(w - 2), F.y(7.6), F.size(1.8, 5.6), { align: 'right', color: DIM });
  const x = 2; const y = p.winTop; const ww = w - 4; const wh = p.wh;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(ww), F.len(wh));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
  const cells = cellGrid(p.cols * p.rows, p.cols, x + 0.6, y + 0.6, ww - 1.2, wh - 1.2);
  const g = mulberry32(p.seed);
  const show = [];
  const kinds = [
    ['A', Math.max(0, r.Au - r.caughtA), BASE_INK, null], ['Ac', r.caughtA, BASE_INK, OH_INK],
    ['HA', Math.max(0, r.HAu - r.caughtHA), ACID_INK, null], ['HAc', r.caughtHA, ACID_INK, H_INK],
    ['H', r.H, H_INK, null], ['OH', r.OH, OH_INK, null]
  ];
  for (const [, n, ink, ring] of kinds) for (let i = 0; i < n && show.length < cells.length; i++) show.push({ ink, ring });
  if (p.sealed) {
    put(ctx, 'sealed', F.x(x + ww / 2), F.y(y + wh / 2), F.size(3, 7), { color: DIM, weight: 700 });
  } else {
    show.forEach((s, i) => {
      const c = cells[i];
      const R = Math.min(c.cw, c.ch) * 0.44;
      const wb = wobble(i, b.clock || 0); const jx = (g() - 0.5) * c.cw * 0.12 + wb.wx * c.cw * 0.5; const jy = (g() - 0.5) * c.ch * 0.12 + wb.wy * c.ch * 0.5;
      ball(ctx, F.x(c.x + jx), F.y(c.y + jy), Math.max(1.4, F.len(R)), s.ink);
      if (s.ring && !ctx.__ball && !ctx.__skip) { ctx.strokeStyle = s.ring; ctx.lineWidth = Math.max(1.4, F.len(0.32)); ctx.beginPath(); ctx.arc(F.x(c.x + jx), F.y(c.y + jy), Math.max(1.4, F.len(R)) + 0.8, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
    });
    // The legend: a swatch and a name for every species drawn.
    const items = [];
    const has = k => kinds.find(q => q[0] === k)[1] > 0;
    if (has('A') || has('Ac')) items.push([BASE_INK, p.names.A]);
    if (has('HA') || has('HAc')) items.push([ACID_INK, p.names.HA]);
    if (has('H')) items.push([H_INK, 'H₃O⁺']);
    if (has('OH')) items.push([OH_INK, 'OH⁻']);
    if (!items.length) items.push([DIM, p.empty]);
    const size = F.size(1.9, 5.8); const sw = F.len(1.7); const u = F.len(1);
    let cx = x; let cy = y + wh + 3;
    for (const [ink, name] of items) {
      const nm = ionText(name);
      ctx.font = `500 ${size}px "Quantico", "JetBrains Mono", sans-serif`;
      const tu = (ctx.measureText(nm).width + sw + F.len(2.4)) / u;
      if (cx + tu > x + ww && cx > x) { cx = x; cy += 3.3; }
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(F.x(cx) + sw / 2, F.y(cy), sw / 2, 0, Math.PI * 2); ctx.fill();
      put(ctx, nm, F.x(cx) + sw + F.len(0.6), F.y(cy), size, { align: 'left', color: DUST });
      cx += tu;
    }
    if (r.caughtA || r.caughtHA) put(ctx, 'ringed: caught the pour', F.x(w - 2), F.y(y + wh + 3), size, { align: 'right', color: DIM });
  }
  if (p.meter) {
    const by = f.size.h - 3.2;
    put(ctx, 'pH', F.x(2), F.y(by), F.size(2.2, 6), { align: 'left', color: DUST });
    put(ctx, fmt(r.pH, 2), F.x(6.2), F.y(by), F.size(3.8, 9), { align: 'left', color: AMBER, weight: 700 });
    if (r.pours) put(ctx, `was ${fmt(r.pH0, 2)}`, F.x(w - 14), F.y(by), F.size(1.9, 5.8), { align: 'right', color: DIM });
  }
}
const TEXTC = PLATE_COLORS.text;

function run(state, fid) {
  const r = mixRead(state, fid);
  const p = r.f.props;
  if (r.pours >= p.maxPour) return { noop: 'The flask is full.' };
  const dial = r.reagent === 'acid' ? 'na' : 'nb';
  return { x: r.pours + 1, y: r.pH, label: fid, dials: { [fid]: { [dial]: Math.round(r.f.dials[dial].value) + 1 } } };
}

function dressMix(f, state, c) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const p = f.props;
  const group = new T.Group();
  const w = f.size.w - 4; const h = p.wh;
  const cx = box.x0 + 2 + w / 2; const cy = box.y0 + p.winTop + h / 2;
  const t = 0.005; const H = 0.024;
  const wall = (lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    m.castShadow = false; m.receiveShadow = false;
    group.add(m);
  };
  wall(w * s + 2 * t, t, 0, -(h * s) / 2 - t / 2);
  wall(w * s + 2 * t, t, 0, (h * s) / 2 + t / 2);
  wall(t, h * s, -(w * s) / 2 - t / 2, 0);
  wall(t, h * s, (w * s) / 2 + t / 2, 0);
  return group;
}

registerFixture('phmix', {
  // The pours in the order they were made: all the acid, then the base.
  replay: { count: f => Math.round(f.dials.na.value + f.dials.nb.value), at: (f, i) => withDial(withDial(f, 'na', Math.min(i, Math.round(f.dials.na.value))), 'nb', Math.max(0, i - Math.round(f.dials.na.value))) },
  demo: (f, t) => ({ dials: { na: Math.floor(t / 0.9) % (Math.min(f.dials.na.max, 5) + 1) } }),
  bodies3d: true, paint: paintMix, run, dress3d: dressMix, live: () => true });
void THREE;

/**
 * A mixing flask. Options: `ha`, `a` (spheres of acid and of its salt, 0 for water), `Ka` (default acetic acid), `names` ({HA, A}),
 * `reagent` ('acid' | 'base' | 'dial'), `acidSph`/`baseSph` (spheres one press pours), `pourVol` (litres a press adds), `maxPour`,
 * `build` (+`levels`: dials set `ha` and `a`), `meter: false`, `sealed`, `pour: false` (no key), `rows` (of 20 cells), `w`, `title`, `runLabel`.
 */
export function mixFixture(id, at, o = {}) {
  const {
    ha = 0, a = 0, Ka = ACIDS.acetic.Ka, names = { HA: 'CH₃COOH', A: 'CH₃COO⁻' }, reagent = 'acid', acidSph = 10, baseSph = 10,
    pourVol = 0.010, maxPour = 12, build = false, levels = [0, 25, 50, 100], meter = true, sealed = false, rows = 10, cols = 20,
    w = 44, title = 'Flask', runLabel = 'Pour', V = 0.1, empty = 'water only', pour = true
  } = o;
  const dials = { na: { min: 0, max: maxPour, step: 1, value: 0, label: 'Acid poured' }, nb: { min: 0, max: maxPour, step: 1, value: 0, label: 'Base poured' } };
  if (reagent === 'dial') dials.rg = { min: 1, max: 2, step: 1, value: 1, label: 'Pour in', labels: ['Acid', 'Base'] };
  if (build) {
    dials.ha = { min: 1, max: levels.length, step: 1, value: 1, label: 'Acetic acid', labels: levels.map(String) };
    dials.a = { min: 1, max: levels.length, step: 1, value: 1, label: 'Acetate', labels: levels.map(String) };
  }
  const nd = (reagent === 'dial' ? 1 : 0) + (build ? 2 : 0);
  const winTop = nd ? Math.round((DIAL_TOP + (nd - 1) * 5 + 3.6) * 10) / 10 : 10.5;
  const wh = Math.round(rows * ((w - 5.2) / cols) * 10) / 10;
  const h = Math.round((winTop + wh + 3 + 3.3 * 2 + 9) * 10) / 10;
  return {
    fixture: {
      id, kind: 'phmix', label: title, at: { ...at }, size: { w, h }, ...(pour ? { runLabel } : { noRun: true }), dials,
      props: {
        hidden: ['na', 'nb'], backdrop: true, top: DIAL_TOP, Ka, ha0: ha, a0: a, names, reagent, acidSph, baseSph, pourVol, maxPour,
        build, levels, meter, sealed, rows, cols, wh, winTop, V, empty, seed: [...id].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 11)
      }
    },
    size: { w, h }
  };
}
