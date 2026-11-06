/**
 * kits/pans-beaker.js — the solubility beaker and the expression form, registered on the pans kit (`pans-registry.js`). Teeter's seventh
 * bench (`q7-dissolve`).
 *
 *   BEAKER  a beaker of water seen from the side: a heap of solid on the floor, a sample of the ions that have dissolved, two ion meters
 *           (one per ion, in mol/L) and, where a stage asks, a "dissolved salt" line, the same figure for pure water, and a gauge of the ion
 *           product Q against Ksp. Its Run key drops in one scoop of the solid. Under the beaker two tallies count, in the last fifty ticks, the
 *           units that left the solid and the units that came back (the pans' idea, `pans-pan.js`: only a beaker with solid has any).
 *   FORM    three power dials, one for each substance in the dissolving equation, and the expression they build.
 *
 * A THIN WRAPPER over `engine/eqdata.js` (`dissolveState`, `molarSolubility`, `KSP`): every figure printed is the planner's answer for the
 * beaker's contents. Ideal solution (concentrations stand for activities, no ion pairs), 25 °C, volume fixed: said on the beaker.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './pans-registry.js';
import { say, frameOf } from './matter-draw.js';
import { A_INK, B_INK, driftOf } from './pans-pan.js';
import { KSP, rng, molarSolubility, dissolveState, simulatePan, tallyWindow } from '../../engine/eqdata.js';
import './pans-beaker-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const SOLID_INK = '#cfc8b8';

/** The mass of solid one press of "Add solid" drops in, as a share of the salt's solubility in pure water. */
export const SCOOP = 1 / 3.5;
export const MAX_SCOOPS = 12;

/* ------------------------------------------------------------------ text */

/** A concentration as the bench prints it and the player types it: 1.3e−5 (a true minus). */
export function sci(x, digits = 1) {
  if (!(x > 0)) return '0';
  let e = Math.floor(Math.log10(x) + 1e-12);
  let ms = (x / Math.pow(10, e) + 1e-9).toFixed(digits);
  if (parseFloat(ms) >= 10) { ms = (1).toFixed(digits); e += 1; }
  return `${ms}e${e < 0 ? '−' : ''}${Math.abs(e)}`;
}

/** An ion's name with a true minus (the plate font has no superscript minus). */
export const ionText = s => s.replace(/⁻/g, '−');

/** The dissolving equation as the beaker prints it. */
export function dissolveEquation(salt) {
  const S = KSP[salt];
  const [m, n] = S.ions;
  return `${S.formula}(s) ⇌ ${m > 1 ? `${m} ` : ''}${ionText(S.cation)} + ${n > 1 ? `${n} ` : ''}${ionText(S.anion)}`;
}

/* ------------------------------------------------------------------ what a beaker holds */

/** The beaker's reading: the planner's answer for its contents. */
export function beakerRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const S = KSP[p.salt];
  const s0 = molarSolubility(S.ksp, S.ions);
  const n = f.dials.n ? Math.round(f.dials.n.value) : 0;
  const total = (p.total ?? 0) + n * SCOOP * s0;
  let cat0 = p.cat0 || 0;
  let an0 = p.an0 || 0;
  if (f.dials.c) {
    const c = p.commonList[Math.round(f.dials.c.value) - 1] || 0;
    if (p.commonIon === 'cation') cat0 += c; else an0 += c;
  }
  return { S, s0, n, total, cat0, an0, ...dissolveState(S.ksp, S.ions, total, cat0, an0) };
}

const TALLIES = new Map();
/** Units that left the solid and units that came back in the last fifty ticks, for a beaker with solid (a sample of 24 surface units). */
function tallyOf(r, fid) {
  if (!(r.solid > r.total * 1e-9) || r.solid <= 0) return { fwd: 0, rev: 0 };
  const seed = 300 + r.n * 17 + [...fid].reduce((a, c) => a + c.charCodeAt(0), 0);
  let t = TALLIES.get(seed);
  if (!t) {
    t = tallyWindow(simulatePan({ n: 24, b0: 6, kf: 0.05, kr: 0.15, ticks: 100, seed }), 100, 50);
    TALLIES.set(seed, t);
  }
  return t;
}

/* ------------------------------------------------------------------ layout (shared by the factory and the painter) */

const ROW_BAR = 7.6;
const ROW_PLAIN = 4.8;

export function beakerLayout(p, w) {
  const rows = [{ id: 'cat', bar: true }, { id: 'an', bar: true }];
  if (p.showDissolved) rows.push({ id: 'dis' });
  if (p.showPure) rows.push({ id: 'pure' });
  if (p.gauge) rows.push({ id: 'q', bar: true }, { id: 'ksp' });
  let y = 12.4;
  for (const r of rows) { r.y = y; y += r.bar ? ROW_BAR : ROW_PLAIN; }
  const pictW = p.compact ? 13 : 26;
  const pict = { x: 3.5, y: 10.5, w: pictW, h: Math.max(18, Math.min(30, y - 11)) };
  const mx0 = pict.x + pict.w + 3.5;
  const mx1 = w - 3.5;
  let end = Math.max(y, pict.y + pict.h);
  let tallyY = null;
  if (p.tallies !== false) { tallyY = end + 3; end = tallyY + 1.8; }
  let trackY = null;
  if (p.commonList) { trackY = end + 4.8; end = trackY + 1.5; }
  const noteY = end + 3;
  // The Run key stands in the bottom right corner, on a row of its own below the note.
  return { rows, pict, mx0, mx1, tallyY, trackY, noteY, h: Math.round((noteY + 2.4 + (p.keyed ? 4.6 : 0)) * 10) / 10 };
}

/* ------------------------------------------------------------------ the picture */

/** Dots to draw for a concentration `c` against the reference `ref`: a sample, more as the figure is larger, never more than 12. */
const extraDots = (c, ref) => (c > 0 ? Math.min(12, Math.max(1, Math.round((c / ref) * 3))) : 0);

function paintJar(ctx, F, r, f, L, tallyKey, clock = 0) {
  const { x, y, w, h } = L.pict;
  const p = f.props;
  const ref = p.ref ?? r.s0;
  const [m, n] = r.S.ions;
  const surface = y + 2.2;
  // The water, then the glass (open at the top).
  ctx.fillStyle = '#1b2227'; ctx.fillRect(F.x(x), F.y(surface), F.len(w), F.len(y + h - surface));
  ctx.strokeStyle = DIM; ctx.beginPath(); ctx.moveTo(F.x(x), F.y(surface)); ctx.lineTo(F.x(x + w), F.y(surface)); ctx.stroke();
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.4));
  ctx.beginPath(); ctx.moveTo(F.x(x), F.y(y)); ctx.lineTo(F.x(x), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y)); ctx.stroke();
  ctx.lineWidth = 1;
  // The heap: squares of the solid on the floor, a row at a time.
  const sq = p.compact ? 1.5 : 2.0;
  const per = Math.max(1, Math.floor((w - 1.4) / (sq + 0.3)));
  const heap = r.solid > 0 ? Math.min(per * 3, Math.max(1, Math.round((r.solid / ref) * 3))) : 0;
  ctx.fillStyle = SOLID_INK;
  for (let i = 0; i < heap; i++) {
    const row = Math.floor(i / per);
    const inRow = Math.min(per, heap - row * per);
    const col = i - row * per;
    const x0 = x + (w - inRow * (sq + 0.3)) / 2 + col * (sq + 0.3);
    ctx.fillRect(F.x(x0), F.y(y + h - 0.4 - (row + 1) * (sq + 0.3) + 0.3), Math.max(2, F.len(sq)), Math.max(2, F.len(sq)));
  }
  const heapTop = y + h - 0.4 - Math.ceil(heap / per) * (sq + 0.3);
  // The dissolved ions and the ions that were already in the water, a sample of dots in the water above the heap.
  const dU = r.dissolved > 0 ? Math.min(6, Math.max(1, Math.round((r.dissolved / ref) * 3))) : 0;
  const nCat = Math.min(14, m * dU + extraDots(r.cat0, ref));
  const nAn = Math.min(14, n * dU + extraDots(r.an0, ref));
  const g = rng(41 + nCat * 7 + nAn * 13);
  const top = surface + 1.4; const bot = Math.max(top + 2, heapTop - 1.2);
  const dot = (ink, k) => {
    // Each ion wanders about its own spot; the spot is fixed by its number, so a still beaker holds still.
    const d = driftOf(k + (ink === B_INK ? 40 : 0), clock, 1.6);
    const cx = Math.min(x + w - 1.2, Math.max(x + 1.2, x + 1.2 + g() * (w - 2.4) + d.dx * 1.1));
    const cy = Math.min(bot, Math.max(top, top + g() * (bot - top) + d.dy * 1.1));
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), Math.max(1.8, F.len(p.compact ? 0.6 : 0.8)), 0, Math.PI * 2); ctx.fill();
    void k;
  };
  for (let i = 0; i < nCat; i++) dot(A_INK, i);
  for (let i = 0; i < nAn; i++) dot(B_INK, i);
  void tallyKey;
}

function meterRow(ctx, F, row, L, label, value, frac, ink, o = {}) {
  const sz = F.size(2.3, 5.8);
  say(ctx, label, F.x(L.mx0), F.y(row.y), sz, { color: o.dim ? DIM : DUST, maxW: F.len((L.mx1 - L.mx0) * 0.55) });
  say(ctx, value, F.x(L.mx1), F.y(row.y), F.size(2.5, 6), { align: 'right', weight: 700, color: o.dim ? DUST : AMBER });
  if (row.bar) {
    const bx = L.mx0; const bw = L.mx1 - L.mx0; const by = row.y + 2.4;
    ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(bx), F.y(by), F.len(bw), Math.max(3, F.len(1.6)));
    ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(bx)) + 0.5, Math.round(F.y(by)) + 0.5, Math.round(F.len(bw)), Math.max(3, Math.round(F.len(1.6))));
    const fw = frac > 0 ? Math.max(1.5, F.len(bw) * Math.min(1, frac)) : 0;
    ctx.fillStyle = ink; ctx.fillRect(F.x(bx), F.y(by), fw, Math.max(3, F.len(1.6)));
    if (o.tick != null) {
      const tx = F.x(bx) + F.len(bw) * o.tick;
      ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(1.6, F.len(0.4));
      ctx.beginPath(); ctx.moveTo(tx, F.y(by) - F.len(0.7)); ctx.lineTo(tx, F.y(by) + Math.max(3, F.len(1.6)) + F.len(0.7)); ctx.stroke(); ctx.lineWidth = 1;
    }
  }
}

function paintBeaker(ctx, f, state, b) {
  const F = frameOf(b);
  const r = beakerRead(state, f.id);
  const p = f.props;
  const L = beakerLayout(p, f.size.w);
  const [m, n] = r.S.ions;
  if (p.eq !== false && !p.compact) say(ctx, dissolveEquation(p.salt), F.x(3.5), F.y(7.4), F.size(2.3, 5.8), { color: DUST, maxW: F.len(f.size.w - 7) });
  paintJar(ctx, F, r, f, L, f.id, b.clock || 0);
  const ref = p.ref ?? r.s0;
  const barMax = p.barMax || [m * ref * 1.15, n * ref * 1.15];
  const rowOf = id => L.rows.find(q => q.id === id);
  meterRow(ctx, F, rowOf('cat'), L, `[${ionText(r.S.cation)}]`, sci(r.cat), r.cat / barMax[0], A_INK);
  meterRow(ctx, F, rowOf('an'), L, `[${ionText(r.S.anion)}]`, sci(r.an), r.an / barMax[1], B_INK);
  if (p.showDissolved) meterRow(ctx, F, rowOf('dis'), L, 'Dissolved salt', sci(r.dissolved), 0, AMBER);
  if (p.showPure) meterRow(ctx, F, rowOf('pure'), L, 'In pure water', sci(r.s0), 0, AMBER, { dim: true });
  if (p.gauge) {
    const lo = p.gaugeDomain ? p.gaugeDomain[0] : Math.log10(r.S.ksp) - 3;
    const hi = p.gaugeDomain ? p.gaugeDomain[1] : Math.log10(r.S.ksp) + 3;
    const at = v => Math.max(0, Math.min(1, (Math.log10(v) - lo) / (hi - lo)));
    meterRow(ctx, F, rowOf('q'), L, 'Q', sci(r.Q), at(r.Q), '#9a8f7c', { tick: at(r.S.ksp) });
    meterRow(ctx, F, rowOf('ksp'), L, 'Ksp', sci(r.S.ksp), 0, AMBER, { dim: true });
  }
  if (L.tallyY != null) {
    const t = tallyOf(r, f.id);
    say(ctx, `at the solid, last 50 ticks: leaving ${t.fwd}, returning ${t.rev}`, F.x(3.5), F.y(L.tallyY), F.size(2.2, 5.8), { color: AMBER, weight: 700, maxW: F.len(f.size.w - 7) });
  }
  const noteW = f.size.w - 7;
  say(ctx, p.note ?? (p.compact ? 'mol/L, 25 °C, ideal' : 'mol/L, 25 °C, ideal solution, dots not to scale'), F.x(3.5), F.y(L.noteY), F.size(2.0, 5.8), { color: DIM, maxW: F.len(noteW) });
}

function run(state, fid) {
  const f = state.fixtures[fid];
  if (!f.dials.n) return null;
  const r = beakerRead(state, fid);
  if (r.n >= MAX_SCOOPS) return { noop: 'The beaker is full.' };
  const next = r.n + 1;
  const after = dissolveState(r.S.ksp, r.S.ions, (f.props.total ?? 0) + next * SCOOP * r.s0, r.cat0, r.an0);
  return { x: next, y: Math.round((after.dissolved / r.s0) * 1000) / 1000, label: fid, dials: { [fid]: { n: next } } };
}

registerFixture('beaker', { paint: paintBeaker, run, live: () => true });

/**
 * A beaker of `salt` (a key of `KSP`). Options:
 *   scoops       a hidden dial counts scoops dropped in by the Run key ("Add solid")
 *   total        mol/L of the salt already in the beaker, dissolved or not (absolute)
 *   cat0, an0    mol/L of the cation or anion already in the water from other sources
 *   common       {ion: 'cation'|'anion', list: [mol/L, ...], label, labels}: a visible dial that puts that much of an ion in the water
 *   showDissolved, showPure, gauge, tallies, compact, eq, note, ref, barMax, gaugeDomain, w, title
 */
export function beakerFixture(id, at, { salt, scoops = false, total = 0, cat0 = 0, an0 = 0, common = null, showDissolved = false, showPure = false, gauge = false, tallies = true, compact = false, eq = true, note = null, ref = null, barMax = null, gaugeDomain = null, w = null, title = 'Beaker' } = {}) {
  const props = { salt, total, cat0, an0, showDissolved, showPure, gauge, tallies, compact, eq, ...(note ? { note } : {}), ...(ref ? { ref } : {}), ...(barMax ? { barMax } : {}), ...(gaugeDomain ? { gaugeDomain } : {}) };
  const dials = {};
  if (scoops) { props.keyed = true; dials.n = { min: 0, max: MAX_SCOOPS, step: 1, value: 0, label: 'Scoops' }; props.hidden = ['n']; }
  if (common) {
    dials.c = { min: 1, max: common.list.length, step: 1, value: 1, label: common.label, labels: common.labels };
    props.commonList = common.list; props.commonIon = common.ion;
  }
  const width = w ?? (compact ? 47 : 70);
  const L = beakerLayout(props, width);
  if (L.trackY != null) props.top = L.trackY;
  props.margin = 3.6;
  return {
    id, kind: 'beaker', label: title, at: { ...at }, size: { w: width, h: L.h },
    ...(scoops ? { runLabel: 'Add solid' } : { noRun: true }),
    dials, props
  };
}

/* ------------------------------------------------------------------
   THE FORM: the powers of the substances in the dissolving equation, and the expression they make
   ------------------------------------------------------------------ */

const SUP = ['⁰', '¹', '²', '³'];

/** The substances a form lists, in the order of its dials: the cation, the anion, the solid. */
export function formSpecies(salt) {
  const S = KSP[salt];
  return [
    { id: 'e1', text: ionText(S.cation), power: S.ions[0] },
    { id: 'e2', text: ionText(S.anion), power: S.ions[1] },
    { id: 'e3', text: `${S.formula}(s)`, power: 0 }
  ];
}

/** The expression the form's dials make. */
export function formExpression(state, fid) {
  const f = state.fixtures[fid];
  const parts = formSpecies(f.props.salt).map(s => ({ ...s, set: Math.round(f.dials[s.id].value) }));
  const text = parts.filter(s => s.set > 0).map(s => `[${s.text}]${s.set > 1 ? SUP[s.set] : ''}`).join(' ');
  return { parts, text: `K = ${text || '1'}` };
}

function paintForm(ctx, f, state, b) {
  const F = frameOf(b);
  const e = formExpression(state, f.id);
  say(ctx, e.text, F.x(3.6), F.y(f.size.h - 4.6), F.size(3.2, 7.5), { weight: 700, color: AMBER, maxW: F.len(f.size.w - 7.2) });
}

registerFixture('kspform', { paint: paintForm });

/** The form for `salt`: one power dial per substance, each starting at 1, and the expression they build. */
export function kspFormFixture(id, at, { salt, title = 'Expression', w = 70 } = {}) {
  const dials = {};
  for (const s of formSpecies(salt)) dials[s.id] = { min: 0, max: 3, step: 1, value: 1, label: `Power of ${s.text}`, labels: ['0', '1', '2', '3'] };
  return { id, kind: 'kspform', label: title, at: { ...at }, size: { w, h: 40 }, noRun: true, dials, props: { salt, top: 13, rowPitch: 7, margin: 3.6 } };
}
