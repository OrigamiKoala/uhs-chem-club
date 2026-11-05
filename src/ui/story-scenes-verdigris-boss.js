/**
 * story-scenes-verdigris-boss.js — the finale painter of `boss-leach` (Verdigris), spread into `SCENES` (`story-scenes.js`) through `legacy()`.
 * A 960-wide plate, a pure function of `t`; every number on screen is worked out from what is drawn by `engine/phdata.js`.
 *
 * `leach-open`: beat one reads the three warm flasks (bars of H₃O⁺ and OH⁻ on a log scale, each length the planner's concentration) and tags
 * the flask where the two bars are equal; beat two draws the three acids' H₃O⁺ as bars (linear) with the pH each gives; beat three traces
 * ammonia titrated with acid to its steep fall and shades the methyl red window; beat four fills a flask with acetate beside 100 acetic
 * acid spheres until the pH reaches the target, counting the spheres drawn.
 */

import { scaleSolution, weakAcid, ACIDS, INDICATORS, titrationML, equivalenceML, indicatorWindowML, bufferState, fmt, sci, BASES } from '../learn/engine/phdata.js';
import { cellGrid, ACID_INK, BASE_INK } from '../learn/table/kits/ph-read.js';
import { C, text, ground, win, ease, disc, line, tag, alpha } from './story-kit.js';

const H_INK = '#d99423'; const OH_INK = '#6f8fb0';
const FLASKS = [
  { name: 'HCl, 25 °C', solute: { id: 'hcl', c: 2.8e-7, T: 25 } },
  { name: 'Water, 60 °C', solute: { id: 'water', c: 0, T: 60 } },
  { name: 'NaOH, 60 °C', solute: { id: 'naoh', c: 8.6e-7, T: 60 } }
];
const ACIDSET = [['Formic acid', 'formic', 0.050], ['Acetic acid', 'acetic', 0.10], ['Hydrofluoric acid', 'hf', 0.0010]];
const AMMONIA = { analyte: { type: 'weakBase', Kb: BASES.nh3.Kb }, c0: 0.100, V0: 25, ct: 0.100 };
const U = 1e-4;
const KA = ACIDS.acetic.Ka;

function leachOpen(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.25) {
    const p = ease(win(t, 0.02, 0.2));
    text(ctx, 'Three flasks, each at its own temperature', w / 2, 34, { size: 24, color: C.dust });
    FLASKS.forEach((f, i) => {
      const s = scaleSolution(f.solute);
      const x = 70 + i * 300; const base = 360; const W = 100;
      text(ctx, f.name, x + W, 84, { size: 22, color: C.text, weight: 700 });
      // Log scale: a bar is as long as the exponent above 10⁻⁹ M.
      [['H₃O⁺', s.h, H_INK, 0], ['OH⁻', s.oh, OH_INK, 1]].forEach(([n, v, ink, k]) => {
        const len = (Math.log10(v) + 9) * 38 * p;
        ctx.fillStyle = ink; ctx.fillRect(x + k * 110, base - len, 80, Math.max(1, len));
        text(ctx, n, x + k * 110 + 40, base + 20, { size: 18, color: C.dust });
        text(ctx, sci(v, 2), x + k * 110 + 40, base - len - 14, { size: 16, color: C.dust });
      });
      text(ctx, `pH ${fmt(s.pH, 2)}`, x + W, 420, { size: 24, color: C.amber, weight: 700 });
      const equal = Math.abs(Math.log10(s.h / s.oh)) < 0.01;
      alpha(ctx, equal && p > 0.9 ? 1 : 0, () => tag(ctx, 'the two bars are equal', x + W, 460, { size: 20, color: C.amber, edge: C.amber }));
    });
    return;
  }
  if (t < 0.5) {
    const p = ease(win(t, 0.28, 0.46));
    text(ctx, 'H₃O⁺ in three acids', w / 2, 34, { size: 24, color: C.dust });
    ACIDSET.forEach(([name, id, c], i) => {
      const r = weakAcid(ACIDS[id].Ka, c);
      const y = 120 + i * 120;
      text(ctx, `${name}, ${c} M`, 210, y, { size: 22, color: C.text, weight: 700, align: 'right' });
      const len = (r.h / 0.0035) * 480 * p;
      ctx.fillStyle = H_INK; ctx.fillRect(230, y - 22, Math.max(1, len), 44);
      text(ctx, `${sci(r.h, 2)} M, pH ${fmt(r.pH, 2)}`, 230 + len + 14, y, { size: 20, color: C.amber, weight: 700, align: 'left' });
    });
    return;
  }
  if (t < 0.76) {
    const p = ease(win(t, 0.54, 0.72));
    text(ctx, 'Ammonia, 25.0 mL, titrated with 0.100 M hydrochloric acid', w / 2, 34, { size: 22, color: C.dust });
    const x = 130; const y = 80; const W = 700; const H = 330; const maxV = 40;
    const X = v => x + (v / maxV) * W; const Y = pH => y + H - (pH / 14) * H;
    ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, W, H);
    ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, W - 1, H - 1);
    for (let pH = 0; pH <= 14; pH += 2) text(ctx, String(pH), x - 18, Y(pH), { size: 18, color: C.dust });
    for (let v = 0; v <= maxV; v += 10) text(ctx, String(v), X(v), y + H + 22, { size: 18, color: C.dust });
    const eq = equivalenceML(AMMONIA);
    const mr = indicatorWindowML(AMMONIA, INDICATORS.methylRed);
    ctx.fillStyle = 'rgba(229,155,36,0.22)'; ctx.fillRect(X(mr.from), y, Math.max(3, X(mr.to) - X(mr.from)), H);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.beginPath();
    for (let v = 0; v <= maxV * p + 1e-9; v += 0.1) { const q = titrationML(AMMONIA, v); if (v === 0) ctx.moveTo(X(v), Y(q)); else ctx.lineTo(X(v), Y(q)); }
    ctx.stroke(); ctx.lineWidth = 1;
    if (maxV * p >= eq) {
      text(ctx, `${eq.toFixed(1)} mL: pH ${fmt(titrationML(AMMONIA, eq), 2)}`, X(eq) + 20, Y(titrationML(AMMONIA, eq)) - 26, { size: 22, color: C.text, weight: 700, align: 'left' });
      text(ctx, `methyl red: ${mr.from.toFixed(1)} to ${mr.to.toFixed(1)} mL`, X(eq) + 20, y + H - 24, { size: 18, color: C.amber, align: 'left' });
    }
    return;
  }
  // The flask for pH 5.10: 100 spheres of acetic acid and acetate added until the planner's pH reaches the target.
  const target = 5.10;
  const p = ease(win(t, 0.78, 0.92));
  const nA = Math.round(p * 227);
  const st = bufferState({ Ka: KA, nHA: 100 * U, nA: nA * U, V: 0.1 });
  text(ctx, '100 acetic acid spheres, with acetate added', w / 2, 34, { size: 24, color: C.dust });
  const cells = cellGrid(340, 20, 90, 70, 520, 340);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(80, 60, 540, 360);
  ctx.strokeStyle = C.steel; ctx.strokeRect(80.5, 60.5, 539, 359);
  let drawnHA = 0; let drawnA = 0;
  for (let i = 0; i < 100; i++) { const c = cells[i]; disc(ctx, c.x, c.y, Math.min(c.cw, c.ch) * 0.4, ACID_INK); drawnHA++; }
  for (let i = 0; i < nA; i++) { const c = cells[100 + i]; disc(ctx, c.x, c.y, Math.min(c.cw, c.ch) * 0.4, BASE_INK); drawnA++; }
  text(ctx, `${drawnHA} acetic acid`, 760, 150, { size: 24, color: C.dust, weight: 700 });
  text(ctx, `${drawnA} acetate`, 760, 200, { size: 24, color: C.green, weight: 700 });
  text(ctx, `${drawnHA ? (drawnA / drawnHA).toFixed(2) : '0'} acetate per acetic acid`, 760, 260, { size: 20, color: C.dust });
  text(ctx, `pH ${fmt(st.pH, 2)}`, 760, 330, { size: 34, color: C.amber, weight: 700 });
  line(ctx, 700, 360, 820, 360, C.steel, 1);
  text(ctx, `target ${fmt(target, 2)}`, 760, 385, { size: 18, color: C.dim });
}

export const VERDIGRIS_BOSS_SCENES = { 'leach-open': leachOpen };
