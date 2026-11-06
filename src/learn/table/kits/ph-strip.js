/**
 * kits/ph-strip.js — the fraction strip (`phstrip`), registered on the ph kit. Verdigris's `q8-capacity`.
 *
 *   STRIP  a flat plot of how much of a weak acid is in its acid form (HA) and how much in its base form (A⁻) at each pH, from
 *          `engine/phdata.js` `fractions(pKa, pH)`. A dial sets the pH (2 to 8, steps of a half); the strip draws each curve ONLY over the
 *          pH range the dial has been moved across (`dialed` keeps it), never the whole curve, and prints the two percentages at the
 *          dial. In indicator mode the two forms are two colours and a swatch shows the solution's colour, the two colours mixed in
 *          the proportion of the forms. A second dial picks between several acids when a stage lists them; each keeps its own range.
 *
 * Flat things are drawn flat: the strip has no 3D dress. A thin wrapper over the planner; a painter decides nothing.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './ph-registry.js';
import { frameOf } from './matter-draw.js';
import { fractions, fmt } from '../../engine/phdata.js';
import { windowAt, shuffle, scratch } from '../../engine/phmotion.js';
import { ACID_INK, BASE_INK, ionText } from './ph-read.js';
import { put, ball } from './ph-flask.js';
import './ph-strip-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;

export const PH_MIN = 2;
export const PH_MAX = 8;
const RED = [192, 80, 58];
const YELLOW = [212, 177, 60];
const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;

/** The strip's reading: the acid on the dial, the pH, the range painted so far and the percentages at the dial. */
export function stripRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const pH = f.dials.ph.value;
  const ai = f.dials.acid ? Math.round(f.dials.acid.value) - 1 : 0;
  const acid = p.acids[ai];
  const reach = p.reach[ai] || { lo: pH, hi: pH };
  const fr = fractions(acid.pKa, pH);
  const HA = Math.round(fr.HA * 100);
  return { f, pH, acid, ai, lo: reach.lo, hi: reach.hi, fr, pctHA: HA, pctA: 100 - HA };
}

function paintStrip(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = stripRead(state, f.id);
  const w = f.size.w;
  const x0 = 12; const pw = w - 16; const y0 = p.plotTop; const ph = p.plotH;
  const X = v => x0 + ((v - PH_MIN) / (PH_MAX - PH_MIN)) * pw;
  const Y = v => y0 + ph - (v / 100) * ph;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x0), F.y(y0), F.len(pw), F.len(ph));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x0)) + 0.5, Math.round(F.y(y0)) + 0.5, Math.round(F.len(pw)), Math.round(F.len(ph)));
  const size = F.size(2.1, 6);
  for (const v of [0, 50, 100]) {
    ctx.strokeStyle = '#2a2622'; ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(Y(v))); ctx.lineTo(F.x(x0 + pw), F.y(Y(v))); ctx.stroke();
    put(ctx, String(v), F.x(x0 - 1.2), F.y(Y(v)), size, { align: 'right', color: DIM });
  }
  for (let v = PH_MIN; v <= PH_MAX; v++) put(ctx, String(v), F.x(X(v)), F.y(y0 + ph + 2.6), size, { color: DIM });
  put(ctx, 'pH', F.x(x0 + pw), F.y(y0 + ph + 5.6), size, { align: 'right', color: DIM });
  put(ctx, '% of the acid', F.x(1.6), F.y(y0 - 2.1), size, { align: 'left', color: DIM });
  const inkHA = p.indicator ? mix(RED, RED, 0) : ACID_INK;
  const inkA = p.indicator ? mix(YELLOW, YELLOW, 0) : BASE_INK;
  // Each curve only over the pH range the dial has been moved across.
  const curve = (key, ink) => {
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.6, F.len(0.5)); ctx.beginPath();
    let first = true;
    for (let v = r.lo; v <= r.hi + 1e-9; v += 0.1) {
      const q = fractions(r.acid.pKa, Math.min(v, r.hi));
      const px = F.x(X(Math.min(v, r.hi))); const py = F.y(Y(q[key] * 100));
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    if (r.hi === r.lo) { ctx.lineTo(F.x(X(r.hi)) + 0.01, F.y(Y(fractions(r.acid.pKa, r.hi)[key] * 100))); }
    ctx.stroke(); ctx.lineWidth = 1;
  };
  curve('HA', inkHA); curve('A', inkA);
  // The dial's pH: a line, and a dot on each curve.
  ctx.strokeStyle = AMBER; ctx.beginPath(); ctx.moveTo(F.x(X(r.pH)), F.y(y0)); ctx.lineTo(F.x(X(r.pH)), F.y(y0 + ph)); ctx.stroke();
  for (const [key, ink] of [['HA', inkHA], ['A', inkA]]) {
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(F.x(X(r.pH)), F.y(Y(r.fr[key] * 100)), Math.max(2, F.len(0.7)), 0, Math.PI * 2); ctx.fill();
  }
  const nameHA = ionText(p.indicator ? 'red form' : r.acid.HA); const nameA = ionText(p.indicator ? 'yellow form' : r.acid.A);
  const by = y0 + ph + 9.4;
  put(ctx, `${nameHA} ${r.pctHA} %`, F.x(2), F.y(by), F.size(2.7, 7), { align: 'left', color: inkHA, weight: 700 });
  put(ctx, `${nameA} ${r.pctA} %`, F.x(w - 2), F.y(by), F.size(2.7, 7), { align: 'right', color: inkA, weight: 700 });
  if (p.indicator) {
    ctx.fillStyle = mix(RED, YELLOW, r.fr.A); ctx.fillRect(F.x(2), F.y(by + 3), F.len(9), F.len(4));
    ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(2)) + 0.5, Math.round(F.y(by + 3)) + 0.5, Math.round(F.len(9)), Math.round(F.len(4)));
    put(ctx, 'colour of the solution', F.x(12.5), F.y(by + 5), F.size(2.1, 6), { align: 'left', color: DUST });
  }
  // Below the curves: 40 molecules of the acid in a row. The share in the second form is the curve's at the dial's pH; the molecules trade a proton
  // while that share holds, so the row keeps changing and the count of each form stays.
  const rowY = f.size.h - 4.2;
  const nA = Math.round(r.fr.A * 40);
  const now = windowAt(40, nA, 5 + r.ai, b.clock || 0, (scratch(f).order ||= shuffle(40, 5 + r.ai)));
  const pitch = (w - 4) / 40;
  now.forEach((m, i) => {
    const asA = m.dir === 0 ? m.ion : (m.p > 0.5 ? m.dir === 1 : m.dir === -1);
    ball(ctx, F.x(2 + (i + 0.5) * pitch + m.wx * pitch * 0.4), F.y(rowY + m.wy * 1.2), Math.max(1.3, F.len(Math.min(pitch * 0.4, 1.1))), asA ? inkA : inkHA);
  });
  void fmt;
}

/** Keep the pH range the hand has moved the dial across, per acid. */
function dialed(state, f) {
  const r = stripRead(state, f.id);
  const reach = { ...f.props.reach };
  const cur = reach[r.ai];
  reach[r.ai] = cur ? { lo: Math.min(cur.lo, r.pH), hi: Math.max(cur.hi, r.pH) } : { lo: r.pH, hi: r.pH };
  return { props: { reach } };
}

registerFixture('phstrip', { bodies3d: true, paint: paintStrip, dialed, live: () => true });

/**
 * A fraction strip. `acids`: `[{ name, pKa, HA, A }]` (one for a plain strip; several add an "Acid" dial); `indicator` draws the two forms as
 * two colours with a swatch; `start` is the pH the dial begins at (and the first point painted).
 */
export function stripFixture(id, at, { acids, indicator = false, start = 5, w = 84, title = 'Fraction strip', acidDial = null } = {}) {
  const dials = { ph: { min: PH_MIN, max: PH_MAX, step: 0.5, value: start, label: 'pH' } };
  if (acids.length > 1) dials.acid = { min: 1, max: acids.length, step: 1, value: 1, label: acidDial || 'Acid', labels: acids.map(a => a.name) };
  const nd = Object.keys(dials).length;
  const plotTop = Math.round((10.5 + (nd - 1) * 5 + 3.6 + 3) * 10) / 10;
  const plotH = 22;
  const h = Math.round((plotTop + plotH + 9.4 + 4 + (indicator ? 6 : 0) + 5) * 10) / 10;
  return {
    fixture: {
      id, kind: 'phstrip', label: title, at: { ...at }, size: { w, h }, noRun: true, dials,
      props: { backdrop: true, top: 10.5, acids, indicator, plotTop, plotH, reach: { 0: { lo: start, hi: start } } }
    },
    size: { w, h }
  };
}
