/**
 * kits/cell-scenes.js — builds the SPEC (`engine/cellscene.js`) of the mechanism view for each Brinewire instrument, from the instrument's own
 * read function. A builder decides nothing the planner has not: electrons flow because the planner says the circuit is closed and which metal
 * gives; coats grow because `dipResult` says they do. `specFor(state, scene)` picks among the watched fixtures and returns a spec or null.
 */

import { METALS, cellE0, givesHydrogen, protectsIron } from '../../engine/celldata.js';
import { dipResult } from '../../engine/celldata-q2-activity.js';
import { WINDOWS } from '../../engine/celldata-q1.js';
import { SPECIES } from '../../engine/celldata.js';
import { specLive } from '../../engine/cellscene.js';
import { halfOf } from './cell-ledger.js';
import { dipRead } from './cell-dip.js';
import { galvRead } from './cell-galv.js';
import { rigRead } from './cell-rig.js';
import { loadRead, ccRead, readRead } from './cell-load.js';
import { supplyRead, comboNow, resultOf } from './cell-supply.js';
import { boardRead } from './cell-board.js';
import { probeRead } from './cell-redox.js';
import { CONC_STEPS } from '../../engine/celldata-q5.js';

const INK = { mg: '#b4b6b0', al: '#bcc0c2', zn: '#8f9ca4', fe: '#7a7a78', ni: '#a8aba5', sn: '#b6b9bb', pb: '#7e7d84', cu: '#b66a3e', ag: '#cfd0cc', au: '#c9a43a', pt: '#9a9690' };
const ION = { cu: '#4f86a8', fe: '#8bb06a', zn: '#9aa3b8', mg: '#c9c4b4', ag: '#d8d8d2', pb: '#a8a8b0', ni: '#b8bcb8', sn: '#c8cacc', al: '#dfe2e3', h: '#d99423', na: '#e0b52c', cl: '#78a142', so4: '#8c8376', no3: '#8c8376', mno4: '#a04a8c', mn: '#d8a8c8' };
const LIQ = '#2f4a56';
const ionOf = id => ({ color: ION[id] || '#9aa3b8', label: METALS[id]?.ion.replace(/[²³]?⁺$/, '+') || '' });
const lg = c => Math.max(1, Math.min(10, Math.round(4 + 1.5 * Math.log10(c || 1))));
const two = (a = LIQ, b = LIQ) => [{ x0: 0.04, x1: 0.44, liquid: a }, { x0: 0.56, x1: 0.96, liquid: b }];
const ONE = [{ x0: 0.18, x1: 0.82, liquid: LIQ }];

/** Two vessels, a strip in each, a wire from the giver to the taker, and a bridge when the circuit is closed. */
function cell({ left, right, closed, bridge = 'bridge', progress = 0.6, flow = 3, trickle = false, lAmt, rAmt, sealed = false }) {
  const lGives = METALS[left].E0 < METALS[right].E0;
  const giver = lGives ? 0 : 1; const taker = 1 - giver;
  const ids = [left, right];
  // A sealed bench does not name its metals: grey bars, a letter, ions with no symbol.
  const strips = ids.map((m, i) => ({ x: i ? 0.76 : 0.24, color: sealed ? '#8a8780' : INK[m], label: sealed ? 'AB'[i] : METALS[m].symbol, loss: closed && i === giver ? progress : 0, gain: closed && i === taker ? progress : 0, coat: sealed ? '#8a8780' : INK[m] }));
  const ions = [];
  [0, 1].forEach(v => {
    const m = ids[v]; const isG = v === giver;
    const n = (v === 0 ? lAmt : rAmt) ?? 4;
    // the giver's own ions leave its strip; the taker's ions are drawn to its strip.
    const ion = sealed ? { color: '#9aa3b8', label: '' } : ionOf(m);
    if (closed) ions.push({ v, ...ion, n: Math.min(10, n), mode: isG ? 'from' : 'to', strip: v });
    else ions.push({ v, ...ion, n: Math.min(10, n), mode: 'wait', strip: v });
  });
  return {
    vessels: two(), strips,
    wire: { from: giver, to: taker, dir: 1, flow: closed ? flow : 0, queued: !closed && trickle ? 2 : 0 },
    bridge: bridge === 'none' ? null : { flow: closed ? 4 : 0, rod: bridge === 'rod' },
    ions
  };
}

/** The ledger cards in the order the scene draws them: the half whose species gains charge (gives electrons) on the left. */
export function ledgerOrder(state, ids) {
  const charge = side => Object.entries(side || {}).reduce((t, [id, n]) => t + n * (SPECIES[id]?.charge || 0), 0);
  const gain = fid => { const b = state.fixtures[fid]?.props?.base; return b ? charge(b.right) - charge(b.left) : 0; };
  return ids.length > 1 && gain(ids[1]) > gain(ids[0]) ? [ids[1], ids[0]] : ids.slice(0, 2);
}

/* ------------------------------------------------------------------ one builder per instrument kind */

const BUILD = {
  cellledger(state, f, scene) {
    const ids = ledgerOrder(state, scene.props.watch);
    const d = halfOf(state.fixtures[ids[0]]); const a = ids[1] ? halfOf(state.fixtures[ids[1]]) : null;
    const first = o => Object.keys(o).find(k => o[k] > 0);
    const sum = o => Object.values(o).reduce((s, n) => s + n, 0);
    const released = d.eRight; const taken = a ? a.eLeft : d.eLeft;
    const flow = a ? Math.min(released, taken) : taken;
    const label = id => (id ? SPECIES[id]?.text || '' : '');
    const col = id => ION[(id || '').replace(/[0-9+]/g, '').toLowerCase()] || '#9aa3b8';
    const outId = first(d.right); const inId = a ? first(a.left) : first(d.left);
    const ions = [];
    const donorMetal = (first(d.left) || 'Zn').replace(/[0-9+]/g, '').toLowerCase();
    const acceptorMetal = a ? (first(a.right) || 'Cu').replace(/[0-9+]/g, '').toLowerCase() : 'pt';
    if (released > 0) ions.push({ v: 0, color: col(outId), label: label(outId), n: Math.max(1, sum(d.right)), mode: 'from', strip: 0 });
    else ions.push({ v: 0, color: col(first(d.left)), label: label(first(d.left)), n: 2, mode: 'wait', strip: 0 });
    ions.push({ v: 1, color: col(inId), label: label(inId), n: Math.max(1, a ? sum(a.left) : sum(d.left)), mode: flow > 0 ? 'to' : 'wait', strip: 1, prob: taken > released });
    return {
      vessels: two(), strips: [
        { x: 0.24, color: INK[donorMetal] || INK.zn, loss: released > 0 ? 0.6 : 0, label: '' },
        { x: 0.76, color: INK[acceptorMetal] || INK.cu, gain: flow > 0 ? 0.6 : 0, coat: INK[acceptorMetal] || INK.cu, label: '' }],
      wire: { from: 0, to: 1, dir: 1, flow, queued: Math.max(0, released - taken) },
      bridge: flow > 0 ? { flow: 4 } : null, ions
    };
  },

  cellredox(state, f) {
    const w = WINDOWS[f.props.reaction];
    const m = Object.keys(METALS).find(k => METALS[k].symbol === w.strip) || 'zn';
    const c = Object.keys(METALS).find(k => METALS[k].symbol === w.coat) || 'cu';
    return {
      vessels: ONE, strips: [{ x: 0.5, color: INK[m], loss: 0.5, gain: 0.7, coat: INK[c], label: w.strip }],
      ions: [{ v: 0, ...ionOf(c), n: 4, mode: 'to', strip: 0 }, { v: 0, ...ionOf(m), n: 4, mode: 'from', strip: 0 }, { v: 0, color: ION.so4, label: '', n: 3, mode: 'wait', strip: 0 }]
    };
  },

  cellprobe(state, f) {
    const piece = probeRead(state, f.id).piece;
    const key = piece?.props?.reaction || piece?.props?.card || null;
    if (!key) return null;
    // The sealed reactions of the sort stage, drawn as they are.
    const r = { a: 'zn_cu', b: 'ppt', c: 'mg_h', d: 'neut' }[key];
    if (r === 'zn_cu') return BUILD.cellredox(state, { props: { reaction: 'zncu' } });
    if (r === 'mg_h') return { vessels: ONE, strips: [{ x: 0.5, color: INK.mg, loss: 0.6, label: 'Mg' }], ions: [{ v: 0, ...{ color: ION.h, label: 'H+' }, n: 5, mode: 'to', strip: 0 }, { v: 0, ...ionOf('mg'), n: 3, mode: 'from', strip: 0 }], bubbles: [{ strip: 0, n: 5, color: '#dcd6cc' }] };
    if (r === 'ppt') return { vessels: ONE, strips: [], ions: [{ v: 0, ...ionOf('ag'), n: 4, mode: 'wait' }, { v: 0, color: ION.cl, label: 'Cl−', n: 4, mode: 'wait' }, { v: 0, color: ION.na, label: 'Na+', n: 3, mode: 'wait' }] };
    if (r === 'neut') return { vessels: ONE, strips: [], ions: [{ v: 0, color: ION.h, label: 'H+', n: 4, mode: 'wait' }, { v: 0, color: '#8fb0c8', label: 'OH−', n: 4, mode: 'wait' }, { v: 0, color: ION.na, label: 'Na+', n: 3, mode: 'wait' }] };
    // a single element card (stage 1 and 5): the beaker it belongs to
    const reaction = { zinc: 'zncu', copper: 'zncu', sulfur: 'zncu', oxygen: 'zncu', cu: 'cuag', ag: 'cuag', mg: 'mgfe', fe: 'mgfe' }[key] || 'zncu';
    return BUILD.cellredox(state, { props: { reaction } });
  },

  celldip(state, f) {
    const rows = dipRead(state, f.id);
    const row = rows.find(r => r.now) || rows[0];
    const bk = row.bk;
    const ionId = bk.ion === 'acid' ? 'h' : bk.ion === 'mix' ? 'cu' : bk.ion;
    const ions = [];
    const strips = [];
    const bubbles = [];
    const baseIons = bk.ion === 'acid' ? { color: ION.h, label: 'H+' } : ionOf(ionId);
    if (!row.now) {
      ions.push({ v: 0, ...baseIons, n: 5, mode: 'wait' });
      if (bk.ion === 'mix') ions.push({ v: 0, ...ionOf('fe'), n: 4, mode: 'wait' });
      return { vessels: ONE, strips, ions };
    }
    const m = row.now.id; const res = row.res;
    const coat = res.coats[0];
    const sl = Boolean(row.now.piece.props.sealed);
    const hide = o => (sl ? { ...o, label: '' } : o);
    strips.push({ x: 0.5, color: sl ? '#8a8780' : INK[m], label: sl ? 'X' : METALS[m].symbol, loss: coat || res.gas ? 0.5 : 0, gain: coat ? 0.7 : 0, coat: coat ? INK[coat] : (sl ? '#8a8780' : INK[m]) });
    if (coat) {
      ions.push({ v: 0, ...ionOf(coat), n: 5, mode: 'to', strip: 0 }, { v: 0, ...hide(ionOf(m)), n: 5, mode: 'from', strip: 0 });
      if (bk.ion === 'mix') ions.push({ v: 0, ...ionOf('fe'), n: 3, mode: 'wait', strip: 0 });
    } else if (res.gas) {
      ions.push({ v: 0, ...baseIons, n: 5, mode: 'to', strip: 0 }, { v: 0, ...hide(ionOf(m)), n: 3, mode: 'from', strip: 0 });
      bubbles.push({ strip: 0, n: 6 });
    } else ions.push({ v: 0, ...baseIons, n: 5, mode: 'wait', strip: 0 });
    return { vessels: ONE, strips, ions, bubbles };
  },

  celldipnails(state, f) {
    const parts = f.props.partners;
    const n = parts.length;
    const vessels = parts.map((_, i) => ({ x0: 0.04 + i * (0.92 / n), x1: 0.04 + (i + 1) * (0.92 / n) - 0.02, liquid: '#33403a' }));
    const strips = []; const wires = []; const ions = [];
    parts.forEach((p, i) => {
      const cx = 0.04 + (i + 0.5) * (0.92 / n);
      const prot = protectsIron(p.metal);
      const a = strips.length;
      strips.push({ x: cx - 0.07, color: INK.fe, label: 'Fe', loss: prot ? 0 : 0.5, gain: 0 }, { x: cx + 0.07, color: INK[p.metal], label: METALS[p.metal].symbol, loss: prot ? 0.5 : 0, gain: 0 });
      wires.push({ from: prot ? a + 1 : a, to: prot ? a : a + 1, dir: 1, flow: 3, queued: 0 });
      ions.push({ v: i, ...ionOf(prot ? p.metal : 'fe'), n: 4, mode: 'from', strip: prot ? a + 1 : a });
    });
    return { vessels, strips, wires, ions };
  },

  cellgalv(state, f) {
    const r = galvRead(state, f.id);
    const p = f.props;
    const closed = (r.link === 'bridge') && (!p.wire2 || r.w2);
    return cell({ left: p.left, right: p.right, closed, bridge: r.link, trickle: r.link === 'rod' || r.link === 'none', sealed: Boolean(p.sealed) });
  },

  cellrig(state, f) {
    const r = rigRead(state, f.id);
    const lit = cellE0(f.props.right, f.props.left) > 1e-9 || cellE0(f.props.left, f.props.right) > 1e-9;
    return cell({ left: f.props.left, right: f.props.right, closed: lit, progress: 0.6, flow: r.scale >= 2 ? 6 : 3 });
  },

  cellloadrun(state, f) {
    const r = loadRead(state, f.id);
    const p = f.props;
    const prog = Math.min(1, r.tick / 6);
    return cell({ left: p.anode, right: p.cathode, closed: r.ran && r.now.E > 0.001, progress: prog, flow: 3, lAmt: r.now.nAnode, rAmt: r.now.nCathode });
  },

  cellloadread(state, f) {
    const r = readRead(state, f.id);
    return cell({ left: f.props.left, right: f.props.right, closed: f.props.wired && r.now ? r.now.V > 0 : false, lAmt: lg(r.aC), rAmt: lg(r.cC), flow: 3 });
  },

  cellloadcc(state, f) {
    const r = ccRead(state, f.id);
    const p = f.props;
    const dir = r.ran ? Math.sign(r.V) : 0;
    // Sealed beakers do not show their concentrations: equal crowds, and only the run says which way.
    const spec = cell({ left: p.metal, right: p.metal, closed: r.ran && dir !== 0, lAmt: p.sealed ? 4 : lg(p.cLeft), rAmt: p.sealed ? 4 : lg(p.cRight), flow: 3, bridge: 'bridge' });
    // the dilute side gives (its metal dissolves); direction follows the sign of the voltage
    if (dir) {
      const giver = dir > 0 ? 0 : 1;
      spec.wire = { from: giver, to: 1 - giver, dir: 1, flow: 3, queued: 0 };
      spec.strips.forEach((s, i) => { s.loss = i === giver ? 0.6 : 0; s.gain = i === giver ? 0 : 0.6; s.coat = INK[p.metal]; });
      spec.ions.forEach(g => { g.mode = g.v === giver ? 'from' : 'to'; });
    }
    return spec;
  },

  cellboard(state, f) {
    const r = boardRead(state, f.id);
    const vessels = two('#2f3a42', LIQ);
    const ref = { x: 0.24, color: INK.pt, label: 'H₂', loss: 0, gain: 0 };
    if (!r.seated) return { vessels, strips: [ref], bubbles: [{ strip: 0, n: 4 }], ions: [{ v: 0, color: ION.h, label: 'H+', n: 4, mode: 'wait' }] };
    const m = r.seated.id; const plus = r.E > 0; const sl = Boolean(r.seated.piece.props.sealed);
    const strip = { x: 0.76, color: sl ? '#8a8780' : INK[m], label: sl ? 'X' : METALS[m].symbol, loss: plus ? 0 : 0.6, gain: plus ? 0.6 : 0, coat: sl ? '#8a8780' : INK[m] };
    return {
      vessels, strips: [ref, strip], bubbles: [{ strip: 0, n: 4 }],
      wire: { from: plus ? 0 : 1, to: plus ? 1 : 0, dir: 1, flow: 3, queued: 0 }, bridge: { flow: 4 },
      ions: [{ v: 0, color: ION.h, label: 'H+', n: 4, mode: 'wait' }, { v: 1, ...(sl ? { color: '#9aa3b8', label: '' } : ionOf(m)), n: 5, mode: plus ? 'to' : 'from', strip: 1 }]
    };
  },

  cellsupply(state, f) {
    const p = f.props;
    const r = supplyRead(state, f.id);
    const c = comboNow(state, f);
    const res = c >= 0 ? resultOf(f, c) : r.now;
    if (p.scene === 'zncu') {
      if (!res) return cell({ left: 'zn', right: 'cu', closed: false });
      const flip = res.zincPlates; const natural = res.natural;
      const spec = cell({ left: 'zn', right: 'cu', closed: Boolean(flip || natural), flow: 4 });
      if (flip) { // supply wins: electrons are sent into zinc, copper gives
        spec.wire = { from: 1, to: 0, dir: 1, flow: 4, queued: 0 };
        spec.strips[0].loss = 0; spec.strips[0].gain = 0.6; spec.strips[0].coat = INK.zn; spec.strips[1].loss = 0.6; spec.strips[1].gain = 0;
        spec.ions.forEach(g => { g.mode = g.v === 0 ? 'to' : 'from'; });
      }
      return spec;
    }
    const gasElectrolyte = (gasL, gasR, on, nL = 4, nR = 2) => ({
      vessels: ONE, strips: [{ x: 0.36, color: INK.pt, label: '' }, { x: 0.64, color: INK.pt, label: '' }],
      wire: { from: 0, to: 1, dir: 1, flow: on ? 3 : 0, queued: 0 },
      bubbles: on ? [{ strip: 0, n: nL, color: gasL }, { strip: 1, n: nR, color: gasR }] : [],
      ions: [{ v: 0, color: ION.h, label: 'H+', n: 3, mode: on ? 'to' : 'wait', strip: 0 }, { v: 0, color: '#8fb0c8', label: 'OH−', n: 3, mode: on ? 'to' : 'wait', strip: 1 }]
    });
    if (p.scene === 'water') return gasElectrolyte('#8fb0c8', '#dcd6cc', Boolean(res?.goes), 6, 3);
    if (p.scene === 'compare') return gasElectrolyte('#8fb0c8', '#78a142', true, 6, 6);
    if (p.scene === 'melt') {
      const on = Boolean(res?.goes ?? true);
      const cat = (res?.into === 'left') ? 0 : 1; const an = 1 - cat;
      return {
        vessels: ONE, strips: [0, 1].map(i => ({ x: i ? 0.64 : 0.36, color: INK.pt, label: '', gain: on && i === cat ? 0.5 : 0, coat: ION.na })),
        wire: { from: an, to: cat, dir: 1, flow: on ? 3 : 0, queued: 0 },
        ions: [{ v: 0, color: ION.na, label: 'Na+', n: 4, mode: on ? 'to' : 'wait', strip: cat }, { v: 0, color: ION.cl, label: 'Cl−', n: 4, mode: on ? 'to' : 'wait', strip: an }],
        bubbles: on ? [{ strip: an, n: 5, color: ION.cl }] : []
      };
    }
    // plate / weigh: a metal plates from its solution at the cathode
    const m = p.metal || 'cu';
    const sealedPlate = p.scene === 'weigh';
    const combos = p.combos || p.runs || [];
    const gs = combos.map((_, i) => resultOf(f, i)?.g || 0);
    const gmax = Math.max(1e-9, ...gs);
    const g = res?.g ?? 0;
    const on = Boolean(res) && g > 0;
    return {
      vessels: ONE, strips: [{ x: 0.36, color: INK.pt, label: '' }, { x: 0.64, color: sealedPlate ? '#8a8780' : INK[m], label: sealedPlate ? '?' : METALS[m].symbol, gain: on ? Math.min(1, 0.2 + 0.8 * (g / gmax)) : 0, coat: sealedPlate ? '#8a8780' : INK[m] }],
      wire: { from: 0, to: 1, dir: 1, flow: on ? Math.max(1, Math.min(8, Math.round(2 + 6 * (res.I || 0.3) / Math.max(0.3, (res.I || 0.3))))) : 0, queued: 0 },
      ions: [{ v: 0, ...(sealedPlate ? { color: '#9aa3b8', label: '' } : ionOf(m)), n: 5, mode: on ? 'to' : 'wait', strip: 1 }],
      bubbles: on ? [{ strip: 0, n: 3, color: '#dcd6cc' }] : []
    };
  }
};

/* ------------------------------------------------------------------ whole-scene specs for the stages that show several reactions at once */

const SPECS = {
  // `q1-halves` stage 5: copper in silver nitrate, magnesium in iron(II) sulfate
  'two-displace': () => ({
    vessels: two(), strips: [
      { x: 0.24, color: INK.cu, loss: 0.5, gain: 0.7, coat: INK.ag, label: 'Cu' }, { x: 0.76, color: INK.mg, loss: 0.5, gain: 0.7, coat: INK.fe, label: 'Mg' }],
    ions: [
      { v: 0, ...ionOf('ag'), n: 5, mode: 'to', strip: 0 }, { v: 0, ...ionOf('cu'), n: 4, mode: 'from', strip: 0 },
      { v: 1, ...ionOf('fe'), n: 5, mode: 'to', strip: 1 }, { v: 1, ...ionOf('mg'), n: 4, mode: 'from', strip: 1 }]
  }),
  // `q1-halves` stage 8: four sealed reactions side by side (A zinc in copper(II), B silver chloride forming, C magnesium in acid, D acid with base)
  'four-reactions': () => ({
    vessels: [[0.01, 0.245], [0.255, 0.49], [0.51, 0.745], [0.755, 0.99]].map(([x0, x1]) => ({ x0, x1, liquid: LIQ })),
    strips: [{ x: 0.1275, color: INK.zn, loss: 0.5, gain: 0.7, coat: INK.cu, label: '' }, { x: 0.6225, color: INK.mg, loss: 0.6, label: '' }],
    ions: [
      { v: 0, ...ionOf('cu'), n: 4, mode: 'to', strip: 0 }, { v: 0, ...ionOf('zn'), n: 4, mode: 'from', strip: 0 },
      { v: 1, ...ionOf('ag'), n: 4, mode: 'wait' }, { v: 1, color: ION.cl, label: 'Cl−', n: 4, mode: 'wait' }, { v: 1, color: ION.na, label: 'Na+', n: 3, mode: 'wait' },
      { v: 2, color: ION.h, label: 'H+', n: 5, mode: 'to', strip: 1 }, { v: 2, ...ionOf('mg'), n: 3, mode: 'from', strip: 1 },
      { v: 3, color: ION.h, label: 'H+', n: 4, mode: 'wait' }, { v: 3, color: '#8fb0c8', label: 'OH−', n: 4, mode: 'wait' }, { v: 3, color: ION.na, label: 'Na+', n: 3, mode: 'wait' }],
    bubbles: [{ strip: 1, n: 5 }]
  })
};

/** The spec a scene fixture shows now: the first watched fixture that is moving, else the first one. */
export function specFor(state, scene) {
  const p = scene.props;
  if (p.demo) return p.demo;
  if (p.specName && SPECS[p.specName]) return SPECS[p.specName](state, scene);
  const watch = p.watch || [];
  if (watch.length && state.fixtures[watch[0]]?.kind === 'cellledger') return BUILD.cellledger(state, null, scene);
  let first = null;
  for (const id of watch) {
    const f = state.fixtures[id];
    const b = f && BUILD[f.kind];
    if (!b) continue;
    const spec = b(state, f, scene);
    if (!spec) continue;
    if (!first) first = spec;
    if (specLive(spec)) return spec;
  }
  return first || { vessels: ONE, strips: [], ions: [{ v: 0, color: ION.cu, label: '', n: 3, mode: 'wait' }] };
}

export const hasBuilder = kind => Boolean(BUILD[kind]);

/** The fixed lead-in of a predict stage: what the student is about to be asked about, shown with no controls and no answer. */
export function demoSpec(name) {
  switch (name) {
    case 'zn-in-cu': return BUILD.cellredox(null, { props: { reaction: 'zncu' } });
    case 'unwired': return cell({ left: 'zn', right: 'cu', closed: false, bridge: 'none' });
    case 'running': return cell({ left: 'zn', right: 'cu', closed: true });
    default: return null;
  }
}
