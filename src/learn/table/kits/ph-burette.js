/**
 * kits/ph-burette.js — the burette over one or two flasks, registered on the ph kit (`ph-registry.js`). Verdigris's titration bench
 * (`q6-titrate`).
 *
 *   BURETTE  a graduated tube of sodium hydroxide over each flask. The "Pour" key lets one measure of it into every flask together (the
 *            dial "Pour size" picks 5 mL, 1 mL or 0.1 mL); the volume poured is kept in a hidden dial, in tenths of a mL. Each flask may
 *            carry a pH meter (its display), a row of indicator tubes (a rack), or a tint from one indicator.
 *   Every pour also writes one reading per flask on the paper strip (`label` "<fixture>|<flask>", x the mL poured, y the pH), which
 *   is what the curve plotter (`ph-curve.js`) draws, so a curve holds only the volumes that were poured.
 *
 * A THIN WRAPPER over `engine/phdata.js` (`titrationML`, `indicatorShare`): a painter decides nothing. Flat, like the flask's window.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './ph-registry.js';
import { frameOf } from './matter-draw.js';
import { put, ionText } from './ph-flask.js';
import { titrationML, indicatorShare, INDICATORS, fmt } from '../../engine/phdata.js';
import './ph-burette-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;

/** Pour sizes in tenths of a mL, in the order of the dial. */
export const POUR_STEPS = Object.freeze([50, 10, 1]);
export const POUR_LABELS = Object.freeze(['5 mL', '1 mL', '0.1 mL']);
const PANEL = 34;
const TUBE_PITCH = 12;

/** The two colours of each indicator: [its acid form, its base form]. */
export const INDICATOR_INK = Object.freeze({
  methylOrange: ['#b8382c', '#d3b02e'],
  methylRed: ['#b8382c', '#d7c040'],
  bromothymol: ['#d7c040', '#4a78b8'],
  phenolphthalein: ['#5b5a55', '#c4457c']
});

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
/** The colour of an indicator at a pH: its two forms mixed by the share in the second form. */
export function indicatorColour(id, pH) {
  const s = indicatorShare(INDICATORS[id], pH);
  const [a, b] = INDICATOR_INK[id].map(hex);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * s)).join(',')})`;
}

/** What the burette reads: the volume poured and each flask's pH from the planner. */
export function buretteRead(state, fid) {
  const f = state.fixtures[fid];
  const tenths = Math.round(f.dials.v.value);
  const mL = tenths / 10;
  const samples = f.props.samples.map(s => ({ ...s, pH: titrationML(s, mL) }));
  return { f, tenths, mL, cap: f.props.cap, samples, size: Math.round(f.dials.size.value) };
}

/** The mL text of a volume, one decimal. */
export const mlText = v => `${(Math.round(v * 10) / 10).toFixed(1)}`;

function flaskShape(ctx, F, cx, top, bodyTop, liquid) {
  const nw = 2.6; const bw = 11;
  ctx.fillStyle = liquid;
  ctx.beginPath();
  ctx.moveTo(F.x(cx - nw), F.y(bodyTop - 3)); ctx.lineTo(F.x(cx + nw), F.y(bodyTop - 3));
  ctx.lineTo(F.x(cx + bw), F.y(bodyTop + 14)); ctx.lineTo(F.x(cx - bw), F.y(bodyTop + 14)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.35));
  ctx.beginPath();
  ctx.moveTo(F.x(cx - nw), F.y(top)); ctx.lineTo(F.x(cx - nw), F.y(bodyTop - 3));
  ctx.lineTo(F.x(cx - bw), F.y(bodyTop + 14)); ctx.lineTo(F.x(cx + bw), F.y(bodyTop + 14));
  ctx.lineTo(F.x(cx + nw), F.y(bodyTop - 3)); ctx.lineTo(F.x(cx + nw), F.y(top)); ctx.stroke();
  ctx.lineWidth = 1;
}

function paintBurette(ctx, f, state, b) {
  const F = frameOf(b);
  const r = buretteRead(state, f.id);
  const p = f.props;
  r.samples.forEach((s, k) => {
    const x0 = 2 + k * PANEL;
    const tx = x0 + 2.5; const tw = 5; const ty = 17; const th = 25;
    put(ctx, ionText(s.title), F.x(x0 + PANEL / 2), F.y(13.6), F.size(2.2, 6.4), { color: DUST, weight: 700, maxW: F.len(PANEL - 2) });
    // The burette: the titrant down to the level the pouring has reached, with a mark every tenth of its length.
    ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(tx), F.y(ty), F.len(tw), F.len(th));
    const level = ty + th * Math.min(1, r.mL / r.cap);
    ctx.fillStyle = '#5c6e80'; ctx.fillRect(F.x(tx) + 1, F.y(level), F.len(tw) - 2, F.len(ty + th - level));
    ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(tx)) + 0.5, Math.round(F.y(ty)) + 0.5, Math.round(F.len(tw)), Math.round(F.len(th)));
    ctx.strokeStyle = DUST;
    for (let i = 0; i <= 5; i++) { const y = ty + (th * i) / 5; ctx.beginPath(); ctx.moveTo(F.x(tx + tw), F.y(y)); ctx.lineTo(F.x(tx + tw + 1.4), F.y(y)); ctx.stroke(); }
    put(ctx, '0', F.x(tx + tw + 2.2), F.y(ty), F.size(1.9, 6), { align: 'left', color: DIM });
    put(ctx, String(r.cap), F.x(tx + tw + 2.2), F.y(ty + th), F.size(1.9, 6), { align: 'left', color: DIM });
    ctx.fillStyle = STEEL; ctx.fillRect(F.x(tx + 1.6), F.y(ty + th), F.len(1.8), F.len(3.4));
    // The flask under it, with its liquid.
    const cx = x0 + 21;
    const hue = s.tint ? indicatorColour(s.tint, s.pH) : '#2f3d4a';
    if (r.mL > 0) { ctx.fillStyle = '#7f95aa'; ctx.fillRect(F.x(tx + 2.2), F.y(ty + th + 3.4), Math.max(1.5, F.len(0.6)), F.len(3.2)); }
    flaskShape(ctx, F, cx, 47, 52, hue);
    let y = 68.6;
    if (s.meter) {
      ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(cx - 10), F.y(y - 2.6), F.len(20), F.len(5.2));
      ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(cx - 10)) + 0.5, Math.round(F.y(y - 2.6)) + 0.5, Math.round(F.len(20)), Math.round(F.len(5.2)));
      put(ctx, `pH ${fmt(s.pH, 2)}`, F.x(cx), F.y(y), F.size(3.3, 8), { color: AMBER, weight: 700, maxW: F.len(18) });
      y += 5.2;
    }
    [].concat(s.sub).forEach((line, i) => put(ctx, ionText(line), F.x(x0 + PANEL / 2), F.y(y + 1.2 + i * 3), F.size(1.95, 5.8), { color: DUST, maxW: F.len(PANEL - 1.5) }));
  });
  // The rack: one tube for each indicator, tinted by the first flask's pH.
  if (p.rack) {
    const s = r.samples[0];
    const x0 = 2 + r.samples.length * PANEL + 2;
    p.rack.forEach((id, j) => {
      const cx = x0 + 6 + j * TUBE_PITCH;
      ctx.fillStyle = indicatorColour(id, s.pH);
      ctx.fillRect(F.x(cx - 3.5), F.y(21), F.len(7), F.len(18));
      ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(cx - 3.5)) + 0.5, Math.round(F.y(21)) + 0.5, Math.round(F.len(7)), Math.round(F.len(18)));
      put(ctx, INDICATORS[id].name, F.x(cx), F.y(42 + (j % 2) * 3.4), F.size(1.8, 5.6), { color: DUST, maxW: F.len(TUBE_PITCH * 2 - 1) });
    });
  }
  put(ctx, `Poured ${mlText(r.mL)} mL`, F.x(2), F.y(f.size.h - 3.4), F.size(2.8, 7), { align: 'left', color: AMBER, weight: 700 });
}

function run(state, fid) {
  const r = buretteRead(state, fid);
  const next = r.tenths + POUR_STEPS[r.size - 1];
  if (next > r.cap * 10) return { noop: `The burette holds only ${r.cap} mL.` };
  const mL = next / 10;
  const rows = r.f.props.samples.map((s, k) => ({ x: mL, y: Math.round(titrationML(s, mL) * 100) / 100, label: `${fid}|${k}` }));
  return { x: rows[0].x, y: rows[0].y, label: fid, rows, dials: { [fid]: { v: next } } };
}

registerFixture('phburette', { paint: paintBurette, run });

/**
 * The burette over its flasks. `samples`: [{ title, sub, analyte, c0, V0, ct, meter?, tint?, rack? }] (`analyte` as `titrationPH`, volumes
 * in mL, strengths in M); `rack`: indicator ids to stand as tubes; `cap`: mL the burette holds.
 */
export function buretteFixture(id, at, { samples, cap = 50, rack = null, title = 'Burette' } = {}) {
  const w = 2 + samples.length * PANEL + (rack ? rack.length * TUBE_PITCH + 2 : 0) + 2;
  return {
    id, kind: 'phburette', label: title, at: { ...at }, size: { w, h: 88 }, runLabel: 'Pour',
    dials: {
      size: { min: 1, max: 3, step: 1, value: 1, label: 'Pour size', labels: [...POUR_LABELS] },
      v: { min: 0, max: cap * 10, step: 1, value: 0, label: 'Poured' }
    },
    props: { hidden: ['v'], backdrop: true, samples: samples.map(s => ({ ...s })), cap, rack: rack ? [...rack] : null }
  };
}
