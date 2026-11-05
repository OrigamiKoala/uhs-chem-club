/**
 * kits/pans-stress.js — the vessel, registered on the pans kit (`pans-registry.js`). Teeter's sixth bench (`q6-lean`).
 *
 *   VESSEL  a sealed vessel of gas, seen flat. Its WINDOW (where it has one) shows one sphere for every `unit` mol of each gas, in a box
 *           whose piston stands where the volume dial puts it; its GRAPH draws the moles of each gas against time, the time before the
 *           change on the left of a dotted line and the time after it on the right; under it a SCALE marks Q with a needle and K with a
 *           line, both on a scale that goes up by tens. The dials make the change (add a gas, take one out, volume, temperature, a gas
 *           that does not react, iron powder, a menu of changes); the Run key lets ten more ticks of time go by.
 *
 * Everything it shows is `engine/eqdata.js` (`leanStress`, `leanAt`, `leanSettleTick`, `leanYield`): the change is applied at time 0, so
 * the vessel's Q is off K the moment a dial is set, and the amounts then move the share 1 − e^(−k t) of their way to where Q is on K.
 * Simulation stated on the bench: ideal gases, K from the van 't Hoff relation with ΔH constant, every amount moving at one rate.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './pans-registry.js';
import { say, frameOf } from './matter-draw.js';
import { LEAN_RXNS, leanStress, leanAt, leanSettle, leanSettleTick, leanK, leanYield, fmtK, rng } from '../../engine/eqdata.js';
import { addTourText } from '../tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

/** The colour of each gas on the window and the graph. */
export const GAS_INK = Object.freeze({ N2: '#6f8fb0', H2: '#a8a090', NH3: '#c0652b', N2O4: '#6f8fb0', NO2: '#c0652b', Ar: '#5f594d' });
export const VESSEL_TICKS = 60;
export const VESSEL_STEP = 10;
const BEFORE = 12; // ticks of the time before the change drawn left of the dotted line

/** Layout of the vessel, in units from its top left. */
const PLOT_Y = 9; const PLOT_H = 20; const ROW_Y = 31.6; const TXT_Y = 34.6; const AXIS_Y = 39.6; const TICK_Y = 43.1; const DIALS_TOP = 48;
export const vesselHeight = nDials => DIALS_TOP + Math.max(0, nDials - 1) * 5 + 8;

const minus = s => String(s).replace(/-/g, '−');
/** A number as the scale and the graph print it: K's own e-form for the ends, a plain figure between. */
export const fmtQ = v => (v <= 0 ? '0' : minus(fmtK(v)));
export const amt = v => String(Number((v * (1 + 1e-9)).toFixed(2)));
const niceMax = v => [0.05, 0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].find(s => s >= v * 1.04) ?? Math.ceil(v);

/* ------------------------------------------------------------------ what a vessel reads (pure) */

/** The vessel as it stands before any change: the mixture settled at V0 and T0, or just mixed when `settled` is false. */
export function baseOf(f) {
  const p = f.props; const rxn = LEAN_RXNS[p.rxn];
  const mix = {}; for (const sp of Object.keys(rxn.species)) mix[sp] = p.mix[sp] || 0;
  const n = p.settled === false ? mix : leanSettle(rxn, mix, p.V0, p.T0).n;
  return { rxn, base: { n, V: p.V0, T: p.T0 } };
}

const mergeStress = (st, more) => {
  for (const [sp, d] of Object.entries(more.add || {})) st.add[sp] = (st.add[sp] || 0) + d;
  if (more.V != null) st.V = more.V;
  if (more.T != null) st.T = more.T;
  if (more.inert) st.inert = (st.inert || 0) + more.inert;
  if (more.catalyst) st.catalyst = true;
  return st;
};

/** The change the dials make. */
export function stressOf(f) {
  const p = f.props; const d = f.dials;
  const st = { add: {}, catalyst: Boolean(p.catalyst) };
  if (d.add) st.add[p.addSp] = (st.add[p.addSp] || 0) + d.add.value;
  if (d.take) st.add[p.takeSp] = (st.add[p.takeSp] || 0) - d.take.value;
  if (d.vol) st.V = d.vol.value;
  if (d.temp) st.T = d.temp.value;
  if (d.inert) st.inert = d.inert.value;
  if (d.cat) st.catalyst = st.catalyst || Math.round(d.cat.value) === 2;
  if (d.pick) mergeStress(st, p.picks[Math.round(d.pick.value) - 1]?.st || {});
  return st;
}

/** The change of a menu entry, for a stage's check. */
export function pickStress(f, index) { return mergeStress({ add: {}, catalyst: false }, f.props.picks[index]?.st || {}); }

const CACHE = new Map();
const keyOf = f => JSON.stringify([f.props.rxn, f.props.mix, f.props.V0, f.props.T0, f.props.settled, f.props.catalyst, f.props.addSp, f.props.takeSp, Object.entries(f.dials).filter(([n]) => n !== 't').map(([n, d]) => [n, d.value])]);

/** What a vessel reads at the tick it has been run to: the change, the vessel after it, where it settles, and the amounts and Q now. */
export function vesselRead(state, fid) {
  const f = state.fixtures[fid];
  const key = keyOf(f);
  let c = CACHE.get(key);
  if (!c) {
    const { rxn, base } = baseOf(f);
    const st = stressOf(f);
    const res = leanStress(rxn, base, st);
    const changed = Object.values(st.add).some(v => Math.abs(v) > 1e-12) || (st.V != null && st.V !== base.V) || (st.T != null && st.T !== base.T) || Boolean(st.inert) || Boolean(st.catalyst && !f.props.catalyst);
    c = { rxn, base, st, res, tick: leanSettleTick(res.k), changed, K0: leanK(rxn, base.T) };
    CACHE.set(key, c);
    if (CACHE.size > 200) CACHE.delete(CACHE.keys().next().value);
  }
  const t = Math.round(f.dials.t.value);
  const now = leanAt(c.rxn, c.res, t);
  return { f, ...c, t, now, settled: t >= c.tick };
}

/** What the "NH₃ made" vessel reports: the product made in all (in the vessel and taken out) at the dials' volume, temperature and take-out count. */
export function vesselYield(f, V, T, cycles) {
  const { rxn } = baseOf(f);
  return leanYield(rxn, f.props.mix, { V, T, cycles });
}

/* ------------------------------------------------------------------ painting */

function frame(ctx, F, x, y, w, h) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
}

const speciesOf = r => Object.keys(r.rxn.species);

/** The spheres the window draws: how many of each gas (and of a gas that does not react), their total, and the total before the change. */
export function spheres(r) {
  const unit = r.f.props.unit;
  const kinds = [...speciesOf(r).map(sp => [sp, Math.round(r.now.n[sp] / unit + 1e-9)]), ['Ar', Math.round(r.res.inert / unit + 1e-9)]];
  return {
    kinds, total: kinds.reduce((s, [, c]) => s + c, 0),
    before: speciesOf(r).reduce((s, sp) => s + Math.round(r.base.n[sp] / unit + 1e-9), 0)
  };
}

/** The window: a box with a piston; the spheres of each gas (and of the gas that does not react) packed in the room under it. */
function paintWindow(ctx, F, r, x, y, w, h) {
  const p = r.f.props;
  frame(ctx, F, x, y, w, h);
  const frac = Math.min(1, r.res.post.V / p.Vmax);
  const gy = y + h * (1 - frac); const gh = y + h - gy;
  const { kinds, total } = spheres(r);
  if (gy > y + 0.2) {
    ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.5, F.len(0.5));
    ctx.beginPath(); ctx.moveTo(F.x(x), F.y(gy)); ctx.lineTo(F.x(x + w), F.y(gy)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(F.x(x + w / 2), F.y(y)); ctx.lineTo(F.x(x + w / 2), F.y(gy)); ctx.stroke(); ctx.lineWidth = 1;
  }
  if (total > 0) {
    const cell = Math.sqrt((w * gh) / total);
    const cols = Math.max(1, Math.floor(w / cell)); const rows = Math.ceil(total / cols);
    const cw = w / cols; const ch = gh / rows; const rad = Math.min(cw, ch) * 0.3;
    const g0 = rng(97);
    const order = Array.from({ length: cols * rows }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(g0() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let k = 0;
    for (const [sp, count] of kinds) {
      ctx.fillStyle = GAS_INK[sp];
      for (let c = 0; c < count; c++, k++) {
        const g = rng(k * 7919 + 17); const cell0 = order[k];
        const cx = x + ((cell0 % cols) + 0.5) * cw + (g() - 0.5) * cw * 0.34;
        const cy = gy + (Math.floor(cell0 / cols) + 0.5) * ch + (g() - 0.5) * ch * 0.34;
        ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), Math.max(1.6, F.len(rad)), 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  const sz = F.size(2.2, 5.8);
  say(ctx, `spheres ${total}`, F.x(x), F.y(y + h + 2.4), sz, { color: DUST, maxW: F.len(w + 3) });
  if (p.cap2 === 'pressure') say(ctx, `pressure ${Math.round(r.now.P)} atm`, F.x(x), F.y(y + h + 5.3), sz, { color: DUST, maxW: F.len(w + 3) });
  else {
    say(ctx, `before ${spheres(r).before}`, F.x(x), F.y(y + h + 5.3), sz, { color: DIM, maxW: F.len(w + 3) });
  }
}

/** The graph: moles of each gas against time. */
function paintGraph(ctx, F, r, x, y, w, h) {
  frame(ctx, F, x, y, w, h);
  const sp = speciesOf(r);
  const LAB = 15.5; const dw = w - LAB;
  let top = 0;
  for (const s of sp) top = Math.max(top, r.base.n[s], r.res.post.n[s], r.res.eq.n[s]);
  const ymax = r.f.props.ymax || niceMax(top);
  const X = t => x + ((t + BEFORE) / (VESSEL_TICKS + BEFORE)) * dw;
  const Y = v => y + h - 1.2 - (Math.max(0, v) / ymax) * (h - 3.4);
  const sz = F.size(2.2, 5.8);
  // The scale, in moles.
  ctx.strokeStyle = DIM; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(F.x(x), F.y(Y(ymax / 2))); ctx.lineTo(F.x(x + dw), F.y(Y(ymax / 2))); ctx.stroke(); ctx.setLineDash([]);
  say(ctx, amt(ymax), F.x(x) + 3, F.y(y) + sz * 0.8, sz, { color: DIM });
  say(ctx, amt(ymax / 2), F.x(x) + 3, F.y(Y(ymax / 2)) - sz * 0.7, sz, { color: DIM });
  say(ctx, '0', F.x(x) + 3, F.y(y + h) - sz * 0.8, sz, { color: DIM });
  // The moment of the change.
  ctx.strokeStyle = DIM; ctx.setLineDash([1, 3]);
  ctx.beginPath(); ctx.moveTo(F.x(X(0)), F.y(y)); ctx.lineTo(F.x(X(0)), F.y(y + h)); ctx.stroke(); ctx.setLineDash([]);
  say(ctx, 'change', F.x(X(0)) + 3, F.y(y) + sz * 0.8, F.size(2, 5.6), { color: DIM, maxW: F.len(14) });
  const { k, post, eq } = r.res;
  const frac = tt => 1 - Math.exp(-k * tt);
  // The level before the change, dashed, across the time after it.
  if (r.changed) {
    ctx.globalAlpha = 0.45; ctx.setLineDash([3, 3]);
    for (const s of sp) {
      ctx.strokeStyle = GAS_INK[s];
      ctx.beginPath(); ctx.moveTo(F.x(X(0)), F.y(Y(r.base.n[s]))); ctx.lineTo(F.x(X(VESSEL_TICKS)), F.y(Y(r.base.n[s]))); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  const ends = [];
  for (const s of sp) {
    const nu = r.rxn.species[s];
    ctx.strokeStyle = GAS_INK[s]; ctx.lineWidth = Math.max(1.6, F.len(0.3));
    ctx.beginPath(); ctx.moveTo(F.x(X(-BEFORE)), F.y(Y(r.base.n[s]))); ctx.lineTo(F.x(X(0)), F.y(Y(r.base.n[s])));
    ctx.lineTo(F.x(X(0)), F.y(Y(post.n[s])));
    for (let tt = 1; tt <= r.t; tt++) ctx.lineTo(F.x(X(tt)), F.y(Y(post.n[s] + nu * eq.x * frac(tt))));
    ctx.stroke(); ctx.lineWidth = 1;
    ends.push({ s, y: Y(r.now.n[s]), v: r.now.n[s] });
  }
  // The name and amount of each gas at the end of its line, pushed apart where they meet.
  ends.sort((a, b) => a.y - b.y);
  const gap = 3.6;
  for (let i = 0; i < ends.length; i++) ends[i].y = Math.min(y + h - 2, Math.max(y + 2.5, ends[i].y));
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < gap) ends[i].y = ends[i - 1].y + gap;
  for (let i = ends.length - 2; i >= 0; i--) if (ends[i + 1].y > y + h - 2) ends[i].y = Math.min(ends[i].y, ends[i + 1].y - gap);
  for (const e of ends) {
    say(ctx, `${r.rxn.names[e.s]} ${amt(e.v)}`, F.x(x + dw) + 3, F.y(e.y), F.size(2.3, 5.8), { color: GAS_INK[e.s], weight: 700, maxW: F.len(LAB - 2) });
  }
  say(ctx, 'time', F.x(x + dw) - 2, F.y(y + h) - sz * 0.8, sz, { color: DIM, align: 'right' });
}

/** The scale: Q as a needle, K as a line, on a log scale that goes up by tens. */
function paintScale(ctx, F, r, x0, x1) {
  const [lo, hi] = r.f.props.axis;
  const xOf = v => x0 + (Math.min(hi, Math.max(lo, v > 0 ? Math.log10(v) : lo)) - lo) / (hi - lo) * (x1 - x0);
  const sz = F.size(2.4, 6);
  const q = r.now.Q; const K = r.now.K;
  say(ctx, `Q ${fmtQ(q)}`, F.x(x0), F.y(TXT_Y), sz, { color: AMBER, weight: 700, maxW: F.len((x1 - x0) / 2 - 1) });
  say(ctx, `K ${fmtQ(K)}`, F.x(x1), F.y(TXT_Y), sz, { color: TEXT, weight: 700, align: 'right', maxW: F.len((x1 - x0) / 2 - 1) });
  ctx.strokeStyle = STEEL; ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(AXIS_Y)); ctx.lineTo(F.x(x1), F.y(AXIS_Y)); ctx.stroke();
  const every = hi - lo > 6 ? 2 : 1;
  for (let e = lo; e <= hi; e++) {
    const tx = F.x(xOf(10 ** e));
    ctx.beginPath(); ctx.moveTo(tx, F.y(AXIS_Y)); ctx.lineTo(tx, F.y(AXIS_Y + 1.1)); ctx.stroke();
    if ((e - lo) % every === 0) say(ctx, e === 0 ? '1' : minus(`1e${e}`), tx, F.y(TICK_Y), F.size(2, 5.8), { color: DIM, align: 'center' });
  }
  // Where K stood before any change of temperature, faint.
  if (Math.abs(Math.log(K / r.K0)) > 1e-9) {
    ctx.strokeStyle = DIM; ctx.lineWidth = Math.max(1, F.len(0.3));
    ctx.beginPath(); ctx.moveTo(F.x(xOf(r.K0)), F.y(AXIS_Y - 3)); ctx.lineTo(F.x(xOf(r.K0)), F.y(AXIS_Y + 1.5)); ctx.stroke(); ctx.lineWidth = 1;
  }
  ctx.strokeStyle = TEXT; ctx.lineWidth = Math.max(1.6, F.len(0.45));
  ctx.beginPath(); ctx.moveTo(F.x(xOf(K)), F.y(AXIS_Y - 3.4)); ctx.lineTo(F.x(xOf(K)), F.y(AXIS_Y + 1.5)); ctx.stroke(); ctx.lineWidth = 1;
  const nx = F.x(xOf(q)); const half = Math.max(2.5, F.len(1.1));
  ctx.fillStyle = AMBER;
  ctx.beginPath(); ctx.moveTo(nx, F.y(AXIS_Y - 0.2)); ctx.lineTo(nx - half, F.y(AXIS_Y - 3.6)); ctx.lineTo(nx + half, F.y(AXIS_Y - 3.6)); ctx.closePath(); ctx.fill();
}

function paintVessel(ctx, f, state, b) {
  const F = frameOf(b);
  const r = vesselRead(state, f.id);
  const p = f.props;
  const w = f.size.w;
  const hasWin = p.window !== false;
  const px = hasWin ? 31 : 3.5;
  if (hasWin) paintWindow(ctx, F, r, 3.5, PLOT_Y, 24, 17);
  paintGraph(ctx, F, r, px, PLOT_Y, w - px - 3.5, PLOT_H);
  const sz = F.size(2.3, 5.8);
  if (p.yield) {
    const y = vesselYield(f, r.res.post.V, r.res.post.T, Math.round(f.dials.cycles.value));
    if (r.t > 0) say(ctx, `NH₃ made ${amt(y.made)} mol, taken out ${amt(y.out)} mol`, F.x(px), F.y(ROW_Y), sz, { color: AMBER, weight: 700, maxW: F.len(w - px - 3.5) });
  } else if (r.t > 0) {
    say(ctx, r.settled ? `settled by tick ${r.tick}` : `tick ${r.t}, still changing`, F.x(px), F.y(ROW_Y), sz, { color: DUST, maxW: F.len(w - px - 3.5) });
  }
  paintScale(ctx, F, r, 3.5, w - 3.5);
}

function run(state, fid) {
  const r = vesselRead(state, fid);
  if (r.t >= VESSEL_TICKS) return { noop: 'The vessel has run for its full time.' };
  const t = r.t + VESSEL_STEP;
  const n = leanAt(r.rxn, r.res, t).n[r.rxn.product];
  return { x: t, y: Math.round(n * 1000) / 1000, label: fid, dials: { [fid]: { t } } };
}

/** A new change starts the clock over: the vessel is read from time zero again. */
function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'vessel') continue;
    const sig = JSON.stringify(Object.entries(f.dials).filter(([n]) => n !== 't').map(([n, d]) => [n, d.value]));
    if (f.props.sig !== undefined && f.props.sig !== sig) f.dials.t.value = 0;
    f.props.sig = sig;
  }
}

registerFixture('vessel', { paint: paintVessel, run, settle });

/* ------------------------------------------------------------------ the fixture a stage declares */

const DIAL_SPECS = {
  add: o => ({ min: 0, max: o.max ?? 2, step: o.step ?? 0.5, value: 0, label: `Add ${o.name}, _ mol` }),
  take: o => ({ min: 0, max: o.max ?? 0.5, step: o.step ?? 0.1, value: 0, label: `Take out ${o.name}, _ mol` }),
  vol: o => ({ min: o.min, max: o.max, step: o.step, value: o.value ?? o.max, label: 'Volume _ L' }),
  temp: o => ({ min: o.min, max: o.max, step: o.step, value: o.value ?? o.min, label: 'Temperature _ K' }),
  inert: o => ({ min: 0, max: o.max ?? 2, step: o.step ?? 0.5, value: 0, label: 'Add argon, _ mol' }),
  cat: o => ({ min: 1, max: 2, step: 1, value: 1, label: `${o.name || 'Iron powder'} _`, labels: ['Off', 'On'] }),
  cycles: o => ({ min: 0, max: o.max ?? 3, step: 1, value: o.value ?? 0, label: 'NH₃ taken out: _ times' }),
  pick: o => ({ min: 1, max: o.labels.length, step: 1, value: 1, label: 'Change _', labels: o.labels })
};

/**
 * A vessel. `rxn` is a key of `LEAN_RXNS`; `mix` the moles put in at `V0` litres and `T0` kelvin (settled first unless `settled: false`).
 * `dials` is `{add: {name, max, step}, take: {...}, vol: {min, max, step}, temp: {...}, inert: {...}, cat: {...}, cycles: {...}, pick: {labels}}`
 * (only the dials a stage needs); `addSp`/`takeSp` the gas the add/take dials work on; `picks` the menu a `pick` dial offers, each
 * `{label, st}`. `unit` is the moles one sphere stands for; `axis` the decades the scale spans; `catalyst: true` fits a vessel with iron powder
 * that no dial can take off.
 */
export function vesselFixture(id, at, o) {
  const rxn = LEAN_RXNS[o.rxn];
  const names = Object.fromEntries(Object.entries(o.dials || {}).map(([k, v]) => [k, v]));
  const dials = {};
  for (const [k, spec] of Object.entries(names)) dials[k] = DIAL_SPECS[k]({ ...spec, name: spec.name ?? rxn.names[k === 'take' ? o.takeSp : o.addSp] });
  dials.t = { min: 0, max: VESSEL_TICKS, step: VESSEL_STEP, value: o.start ?? 0, label: 'Time' };
  const nd = Object.keys(dials).length - 1;
  const window = o.window !== false;
  const w = o.w ?? (window ? 100 : 70);
  const Vs = [o.V0, o.dials?.vol?.max, o.dials?.vol?.min].filter(v => v != null);
  return {
    id, kind: 'vessel', label: o.title, at: { ...at }, size: { w, h: vesselHeight(nd) }, runLabel: 'Run', dials,
    props: {
      hidden: ['t'], top: DIALS_TOP, rxn: o.rxn, mix: o.mix, V0: o.V0, T0: o.T0, settled: o.settled !== false, unit: o.unit ?? 0.05, window,
      Vmax: o.Vmax ?? Math.max(...Vs), axis: o.axis, cap2: o.cap2 ?? 'before', addSp: o.addSp, takeSp: o.takeSp,
      picks: o.picks || [], yield: Boolean(o.yield), catalyst: Boolean(o.catalyst), ...(o.ymax ? { ymax: o.ymax } : {})
    }
  };
}

/* ------------------------------------------------------------------ Tour words */

addTourText({
  'pans:vessel': {
    title: 'Vessel', dials: false,
    text: 'A sealed vessel of gas, drawn flat. In the window, each sphere stands for a set amount of gas, and a piston shows the room it has. The graph counts the moles of each gas against time, with the time before a change left of the dotted line and the time after it right of the line. Under the graph a needle marks Q and a line marks K, both written with the pressure of each gas, on a scale that goes up by tens: 1e−4 means 1 × 10 to the power −4. Move a dial to change the vessel, then press "Run" to let ten more ticks of time go by.'
  }
}, {});

