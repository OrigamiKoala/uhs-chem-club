/**
 * kits/thorn-groups.js — what Thornmere's fourth bench (Functional Groups, q4) adds to the thorn kit: the predict clip of sodium
 * hydroxide coming apart into its ions in water, the neighbouring case for "does ethanol's –OH make water basic?".
 */

import { addLeadScene } from './thorn-mol.js';
import { C, ATOM_INK, say, clamp, ease } from './thorn-draw.js';

function disc(ctx, F, x, y, r, el, label, q = 0) {
  const ink = ATOM_INK[el];
  ctx.fillStyle = ink.fill; ctx.beginPath(); ctx.arc(F.x(x), F.y(y), F.len(r), 0, Math.PI * 2); ctx.fill();
  say(ctx, label, F.x(x), F.y(y) + 0.5, Math.max(6.5, F.len(r * 0.8)), { align: 'center', color: ink.text, weight: 800, sans: true });
  if (q) say(ctx, q > 0 ? '+' : '−', F.x(x + r * 1.2), F.y(y - r * 1.1), Math.max(8, F.len(r * 0.9)), { align: 'center', color: q > 0 ? C.plus : C.minus, weight: 800, sans: true });
}
const line = (ctx, F, x0, y0, x1, y1) => { ctx.strokeStyle = C.bond; ctx.lineWidth = Math.max(1.4, F.len(0.45)); ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(y0)); ctx.lineTo(F.x(x1), F.y(y1)); ctx.stroke(); ctx.lineWidth = 1; };

/** Sodium hydroxide in water: a sodium ion and a hydroxide ion, held only by attraction, drawn apart as water molecules crowd round. */
addLeadScene('naoh-dissolves', (ctx, f, F, t) => {
  const period = 6.5; const tt = t > 1e5 ? period : t % period;
  const k = ease(clamp((tt - 1.2) / 3, 0, 1));
  const cx = f.size.w / 2; const cy = 6.5 + (f.size.h - 13) / 2; const r = Math.min(3.4, (f.size.h - 13) * 0.16);
  const gap = r * (1.05 + k * 3.2);
  // Water molecules close in on each ion as they part.
  for (const [sx, sy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    const wx = cx + sx * (gap + r * 1.3) ; const wy = cy + sy * r * lerp(2.8, 1.7, k);
    ctx.globalAlpha = 0.85;
    line(ctx, F, wx, wy, wx + r * 0.9, wy - r * 0.8); line(ctx, F, wx, wy, wx - r * 0.9, wy - r * 0.8);
    disc(ctx, F, wx, wy, r * 0.7, 'O', 'O'); disc(ctx, F, wx + r * 0.9, wy - r * 0.8, r * 0.42, 'H', 'H'); disc(ctx, F, wx - r * 0.9, wy - r * 0.8, r * 0.42, 'H', 'H');
    ctx.globalAlpha = 1;
  }
  line(ctx, F, cx + gap, cy, cx + gap + r * 1.5, cy);
  disc(ctx, F, cx - gap, cy, r, 'Na', 'Na', 1);
  disc(ctx, F, cx + gap, cy, r, 'O', 'O', -1);
  disc(ctx, F, cx + gap + r * 1.5, cy, r * 0.6, 'H', 'H');
});

function lerp(a, b, k) { return a + (b - a) * k; }
