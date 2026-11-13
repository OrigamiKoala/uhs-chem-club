/**
 * story-scenes-lodestone.js — Vess's debrief painters for Lodestone (unit12), authored on 960 × 540 and registered in `story-scenes.js`
 * through `legacy()`. Every number on screen is counted from what is drawn or read from `lodedata.js`.
 */

import { C, text, ground, win, ease } from './story-kit.js';
import { fillLevel, shellLevels, IE, removalOrder } from '../learn/engine/lodedata.js';

const S4 = '#c9a35a'; const D3 = '#6f8fb0';

/** One orbital box with 0, 1 or 2 electrons, on the scene's 960 × 540 plate. */
function box(ctx, x, y, n, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(x, y, 44, 38);
  const arrow = (cx, up) => {
    ctx.strokeStyle = C.text; ctx.fillStyle = C.text; ctx.lineWidth = 3;
    const t = y + 8; const b = y + 30;
    ctx.beginPath(); ctx.moveTo(cx, up ? b : t); ctx.lineTo(cx, up ? t : b); ctx.stroke();
    const tip = up ? t : b; const s = up ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(cx, tip); ctx.lineTo(cx - 6, tip + s * 8); ctx.lineTo(cx + 6, tip + s * 8); ctx.closePath(); ctx.fill();
  };
  if (n >= 1) arrow(n === 2 ? x + 15 : x + 22, true);
  if (n >= 2) arrow(x + 29, false);
  ctx.lineWidth = 1;
}

/** A ladder: 4s and five 3d boxes at the energies of `charge`, holding `s` and `d`. */
function ladder(ctx, x0, yBase, charge, s, d, label) {
  const L = shellLevels(charge);
  const yOf = e => yBase - (e + 0.8) * 110;
  const y4s = yOf(L[0].e); const y3d = yOf(L[1].e);
  box(ctx, x0, y4s, s, S4);
  text(ctx, '4s', x0 - 12, y4s + 19, { size: 22, color: S4, align: 'right', weight: 700 });
  fillLevel(5, d).forEach((n, i) => box(ctx, x0 + 80 + i * 52, y3d, n, D3));
  text(ctx, '3d', x0 + 68, y3d + 19, { size: 22, color: D3, align: 'right', weight: 700 });
  text(ctx, label, x0 + 170, yBase + 78, { size: 24, color: C.text, weight: 700 });
}

/** q1-dblock: iron fills 4s then 3d; as Fe²⁺ the 3d level drops below 4s and the 4s pair leaves; Fe³⁺ keeps five 3d electrons. */
function dblock(ctx, w, h, t) {
  ground(ctx, w, h);
  const fill = Math.min(8, Math.floor(ease(win(t, 0.02, 0.3)) * 8.999));
  if (t < 0.36) {
    ladder(ctx, 260, 330, 0, Math.min(2, fill), Math.max(0, fill - 2), `Iron: ${fill} of 8 outer electrons`);
    return;
  }
  // The charge rises to +2: the levels glide, then the two 4s electrons leave.
  const q = t < 0.7 ? 2 * ease(win(t, 0.36, 0.5)) : 2 + ease(win(t, 0.72, 0.85));
  const s = t < 0.55 ? 2 : 0;
  const d = t < 0.86 ? 6 : 5;
  const name = t < 0.55 ? 'Iron, taking a charge' : t < 0.86 ? 'Fe²⁺: 3d⁶' : 'Fe³⁺: 3d⁵, the sealed drum';
  ladder(ctx, 260, 330, Math.min(1, q), s, d, name);
  if (t > 0.5 && t < 0.7) {
    const p = win(t, 0.55, 0.68);
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(282, 140 - p * 90, 9, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

const SUB = { '4s': S4, '3d': D3, '3p': '#8f6a8a' };

/** A strip of successive ionization energies for `el`, the first `n` bars grown by `p`, coloured by the level each electron left. */
function strip(ctx, x0, y0, w, h, el, n, p, label, q0 = 0) {
  const from = removalOrder(el, q0, n); const bw = w / n;
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke(); ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const g = Math.max(0, Math.min(1, p * n - i));
    if (!g) continue;
    const v = IE[el][q0 + i]; const hh = (v / 20000) * h * g;
    ctx.fillStyle = SUB[from[i]]; ctx.fillRect(x0 + i * bw + bw * 0.15, y0 + h - hh, bw * 0.7, hh);
    if (g >= 1) text(ctx, Math.round(v).toLocaleString('en-US'), x0 + i * bw + bw * 0.5, y0 + h - hh - 12, { size: 13, color: C.text });
  }
  text(ctx, label, x0 + w / 2, y0 + h + 26, { size: 22, color: C.text, weight: 700 });
}

/** q2-charges: calcium's jump after two, manganese's after seven, then the third electron of Mn²⁺ and Fe²⁺. */
function charges(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.66) {
    strip(ctx, 90, 90, 340, 260, 'Ca', 8, ease(win(t, 0.02, 0.28)), 'Calcium');
    if (t > 0.33) strip(ctx, 530, 90, 340, 260, 'Mn', 8, ease(win(t, 0.34, 0.6)), 'Manganese');
    return;
  }
  const p = ease(win(t, 0.68, 0.9));
  const bars = [['Mn²⁺', IE.Mn[2], 300], ['Fe²⁺', IE.Fe[2], 560]];
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(220, 400); ctx.lineTo(740, 400); ctx.stroke(); ctx.lineWidth = 1;
  for (const [name, v, x] of bars) {
    const hh = (v / 4000) * 280 * p;
    ctx.fillStyle = D3; ctx.fillRect(x, 400 - hh, 100, hh);
    if (p >= 1) text(ctx, `${Math.round(v).toLocaleString('en-US')} kJ/mol`, x + 50, 400 - hh - 18, { size: 20, color: C.text, weight: 700 });
    text(ctx, `${name}: third electron`, x + 50, 432, { size: 20, color: C.text });
  }
}

export const LODESTONE_SCENES = {
  'lode-charges': charges,
  'lode-dblock': dblock
};
