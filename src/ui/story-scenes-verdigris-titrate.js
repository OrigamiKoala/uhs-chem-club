/**
 * story-scenes-verdigris-titrate.js — the story painter of Verdigris bench 6 (`q6-titrate`), spread into `SCENES` (`story-scenes.js`)
 * through `legacy()`: a 960-wide plate, a pure function of `t`; every curve is traced point by point from `phdata.js` `titrationML` (the
 * planner the burette's display and the bench's plotter read) and every number on screen is read from that trace.
 *
 * `titration-reads`: beat one traces hydrochloric acid to its steep rise; beat two traces acetic acid beside it and prints both readings
 * at the equivalence volume; beat three marks half the equivalence volume on acetic and formic acid and prints the readings there beside
 * each acid's pKa; beat four traces sulfurous acid through both of its steep rises.
 */

import { ACIDS, fmt, pOf, titrationML, equivalenceML } from '../learn/engine/phdata.js';
import { C, text, ground, win, ease, line } from './story-kit.js';

const CT = 0.100;
const HCL = { analyte: { type: 'strongAcid' }, c0: 0.100, V0: 25, ct: CT };
const ACETIC = { analyte: { type: 'weakAcid', Ka: ACIDS.acetic.Ka }, c0: 0.100, V0: 25, ct: CT };
const FORMIC = { analyte: { type: 'weakAcid', Ka: ACIDS.formic.Ka }, c0: 0.100, V0: 20, ct: CT };
const SULFUROUS = { analyte: { type: 'diprotic', Ka: ACIDS.sulfurous.Ka }, c0: 0.0500, V0: 20, ct: CT };

/** A plot area: pH 0 to 14 up, mL across. Returns the mappers. */
function axes(ctx, x, y, w, h, xMax, xTick) {
  const X = v => x + (v / xMax) * w; const Y = p => y + h - (p / 14) * h;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  for (let p = 0; p <= 14; p += 2) { line(ctx, x, Y(p), x + w, Y(p), 'rgba(140,131,118,0.25)', 1); text(ctx, String(p), x - 18, Y(p), { size: 18, color: C.dust }); }
  for (let v = 0; v <= xMax; v += xTick) text(ctx, String(v), X(v), y + h + 22, { size: 18, color: C.dust });
  text(ctx, 'pH', x - 18, y - 16, { size: 20, color: C.dust, weight: 700 });
  text(ctx, 'mL of base poured', x + w / 2, y + h + 50, { size: 18, color: C.dim });
  return { X, Y };
}

/** Trace a titration from 0 to `upTo` mL in steps of 0.1; returns the last point drawn. */
function trace(ctx, A, spec, upTo, color, step = 0.1) {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
  let last = null;
  for (let v = 0; v <= upTo + 1e-9; v += step) {
    const p = titrationML(spec, v);
    if (v === 0) ctx.moveTo(A.X(v), A.Y(p)); else ctx.lineTo(A.X(v), A.Y(p));
    last = { v, p };
  }
  ctx.stroke(); ctx.lineWidth = 1;
  return last;
}

const dot = (ctx, x, y, color = C.amber, r = 7) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

function titrationReads(ctx, w, h, t) {
  ground(ctx, w, h);
  const px = 120; const py = 90; const pw = 740; const ph = 330;
  if (t < 0.28) {
    const k = ease(win(t, 0.02, 0.22));
    text(ctx, '25.0 mL of 0.100 M hydrochloric acid, titrated with 0.100 M sodium hydroxide', w / 2, 34, { size: 22, color: C.dust });
    const A = axes(ctx, px, py, pw, ph, 50, 10);
    const e = equivalenceML(HCL);
    const last = trace(ctx, A, HCL, 50 * k, C.text);
    if (50 * k >= e) {
      line(ctx, A.X(e), py, A.X(e), py + ph, C.amber, 2, [6, 6]);
      dot(ctx, A.X(e), A.Y(titrationML(HCL, e)));
      text(ctx, `${fmt(e, 1)} mL, pH ${fmt(titrationML(HCL, e), 2)}`, A.X(e) + 14, A.Y(titrationML(HCL, e)) + 40, { size: 22, color: C.amber, weight: 700, align: 'left' });
    }
    void last;
    return;
  }
  if (t < 0.54) {
    const k = ease(win(t, 0.3, 0.5));
    text(ctx, 'Acetic acid beside it, the same amount and the same base', w / 2, 34, { size: 22, color: C.dust });
    const A = axes(ctx, px, py, pw, ph, 50, 10);
    trace(ctx, A, HCL, 50 * k, C.text); trace(ctx, A, ACETIC, 50 * k, '#78a142');
    const e = equivalenceML(ACETIC);
    if (50 * k >= e) {
      line(ctx, A.X(e), py, A.X(e), py + ph, C.amber, 2, [6, 6]);
      const a = titrationML(HCL, e); const b = titrationML(ACETIC, e);
      dot(ctx, A.X(e), A.Y(a)); dot(ctx, A.X(e), A.Y(b));
      text(ctx, `acetic acid ${fmt(b, 2)}`, A.X(e) + 16, A.Y(b) - 6, { size: 22, color: '#78a142', weight: 700, align: 'left' });
      text(ctx, `hydrochloric acid ${fmt(a, 2)}`, A.X(e) + 16, A.Y(a) + 30, { size: 22, color: C.text, weight: 700, align: 'left' });
    }
    return;
  }
  if (t < 0.78) {
    const k = ease(win(t, 0.56, 0.74));
    text(ctx, 'Half way to each equivalence volume', w / 2, 34, { size: 22, color: C.dust });
    const A = axes(ctx, px, py, pw, ph, 40, 10);
    trace(ctx, A, ACETIC, 40 * k, '#78a142'); trace(ctx, A, FORMIC, 40 * k, C.text);
    [[ACETIC, '#78a142', 'acetic acid', ACIDS.acetic.Ka], [FORMIC, C.text, 'formic acid', ACIDS.formic.Ka]].forEach(([s, col, name, Ka], i) => {
      const half = equivalenceML(s) / 2;
      if (40 * k < half) return;
      const p = titrationML(s, half);
      line(ctx, A.X(half), A.Y(p), A.X(half), py + ph, C.amber, 2, [6, 6]);
      dot(ctx, A.X(half), A.Y(p));
      text(ctx, `${name}: ${fmt(p, 2)} at ${fmt(half, 1)} mL, pKa ${fmt(pOf(Ka), 2)}`, px + 20, py + 28 + i * 30, { size: 21, color: col, weight: 700, align: 'left' });
    });
    return;
  }
  const k = ease(win(t, 0.8, 0.94));
  text(ctx, '20.0 mL of 0.0500 M sulfurous acid', w / 2, 34, { size: 22, color: C.dust });
  const A = axes(ctx, px, py, pw, ph, 30, 5);
  trace(ctx, A, SULFUROUS, 30 * k, C.text);
  const e = equivalenceML(SULFUROUS);
  [1, 2].forEach(n => {
    if (30 * k < n * e) return;
    line(ctx, A.X(n * e), py, A.X(n * e), py + ph, C.amber, 2, [6, 6]);
    text(ctx, `${fmt(n * e, 1)} mL`, A.X(n * e), py + ph - 14, { size: 21, color: C.amber, weight: 700 });
  });
}

export const VERDIGRIS_TITRATE_SCENES = { 'titration-reads': titrationReads };
