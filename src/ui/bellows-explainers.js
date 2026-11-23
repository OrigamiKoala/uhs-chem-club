/**
 * bellows-explainers.js — short looping 2D canvas particle-mechanism animations
 * for Bellows reward cards (Boyle's law, Charles's law, partial pressure, Graham's law).
 * Respects reduced motion (`still`: draws the final frame without looping).
 */

import { BELLOWS_SCENES } from './story-scenes-bellows.js';
import { C, disc, line, legacyText as text, ground } from './story-kit.js';
import { win, ease, integrate, crowdOf, placeOf, wallHits } from './story-sim.js';

const BOYLE_CROWD = crowdOf(28, 71);
const CHARLES_CROWD = crowdOf(24, 83);

function drawFrame(ctx, x, y, w, h) {
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

/** Boyle's law: piston halves volume, particle collisions with walls double. */
function boyleScene(ctx, w, h, t) {
  ground(ctx, w, h);
  const s = ease(win(t, 0.15, 0.65));
  const frac = 1 - 0.5 * s;
  const rate = u => 6 / (1 - 0.5 * ease(win(u, 0.15, 0.65)));
  const tau = integrate(rate, t);
  const tau0 = integrate(rate, Math.max(0, t - 0.06));
  const hits = wallHits(BOYLE_CROWD, tau0, tau);
  const bx = 90; const by = 140; const maxW = 460; const bh = 250;
  const curW = maxW * frac;
  drawFrame(ctx, bx, by, maxW, bh);
  // Piston plate and rod
  ctx.fillStyle = C.dust;
  ctx.fillRect(bx + curW - 5, by - 8, 10, bh + 16);
  line(ctx, bx + curW + 5, by + bh / 2, bx + maxW + 30, by + bh / 2, C.steel, 6);
  for (const p of BOYLE_CROWD) {
    const [u, v] = placeOf(p, tau);
    disc(ctx, bx + 5 + u * (curW - 14), by + 5 + v * (bh - 10), 4.5, C.pale);
  }
  for (const k of hits) {
    const a = 1 - k.age;
    if (a <= 0) continue;
    ctx.globalAlpha = Math.min(1, a * 1.3);
    ctx.fillStyle = C.amber;
    if (k.wall === 'L') ctx.fillRect(bx - 3, by + k.along * bh - 5, 6, 10);
    else if (k.wall === 'R') ctx.fillRect(bx + curW - 3, by + k.along * bh - 5, 6, 10);
    else if (k.wall === 'T') ctx.fillRect(bx + k.along * curW - 5, by - 3, 10, 6);
    else ctx.fillRect(bx + k.along * curW - 5, by + bh - 3, 10, 6);
  }
  ctx.globalAlpha = 1;
  const vol = 24 * frac;
  const p = 104 / frac;
  text(ctx, `VOLUME: ${vol.toFixed(1)} L`, 630, 190, { size: 22, color: C.dust, align: 'left' });
  text(ctx, `PRESSURE: ${Math.round(p)} kPa`, 630, 250, { size: 26, color: C.amber, align: 'left', weight: 700 });
  text(ctx, `COLLISIONS: ${(1 / frac).toFixed(1)}×`, 630, 310, { size: 22, color: C.text, align: 'left', weight: 700 });
  text(ctx, 'Half the volume → twice the collisions and pressure', w / 2, 460, { size: 22, color: C.amber });
}

/** Charles's law: doubling kelvin doubles volume at constant pressure. */
function charlesScene(ctx, w, h, t) {
  ground(ctx, w, h);
  const s = ease(win(t, 0.15, 0.7));
  const T = 293 + 293 * s;
  const frac = 0.5 + 0.5 * s;
  const rate = u => 5 * Math.sqrt((293 + 293 * ease(win(u, 0.15, 0.7))) / 293);
  const tau = integrate(rate, t);
  const bx = 90; const by = 140; const maxW = 460; const bh = 250;
  const curW = maxW * frac;
  drawFrame(ctx, bx, by, maxW, bh);
  ctx.fillStyle = C.dust;
  ctx.fillRect(bx + curW - 5, by - 8, 10, bh + 16);
  line(ctx, bx + curW + 5, by + bh / 2, bx + maxW + 30, by + bh / 2, C.steel, 6);
  for (const p of CHARLES_CROWD) {
    const [u, v] = placeOf(p, tau);
    disc(ctx, bx + 5 + u * (curW - 14), by + 5 + v * (bh - 10), 4.5, s > 0.4 ? C.amber : C.pale);
  }
  const vol = 24 * (T / 293);
  text(ctx, `KELVIN: ${Math.round(T)} K`, 630, 190, { size: 24, color: C.amber, align: 'left', weight: 700 });
  text(ctx, `VOLUME: ${vol.toFixed(1)} L`, 630, 250, { size: 26, color: C.text, align: 'left', weight: 700 });
  text(ctx, 'PRESSURE: 101 kPa (constant)', 630, 310, { size: 20, color: C.dim, align: 'left' });
  text(ctx, 'Twice the kelvin temperature → twice the volume', w / 2, 460, { size: 22, color: C.amber });
}

const SCENES = {
  boyle: boyleScene,
  charles: charlesScene,
  'mix-share': BELLOWS_SCENES['mix-share'],
  'leak-race': BELLOWS_SCENES['leak-race']
};

export function mountBellowsExplainer(view, spec, still = false) {
  const fn = SCENES[spec.scene];
  if (!fn) return () => {};
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  canvas.style.cssText = 'display:block;width:100%;height:auto;max-height:220px;object-fit:contain;background:#0d0c0a;border:1px solid #3a352e;';
  view.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (still) {
    fn(ctx, canvas.width, canvas.height, 0.95);
    return () => { canvas.remove(); };
  }
  let raf = 0;
  const t0 = performance.now();
  const PERIOD = 5500;
  const loop = now => {
    const t = ((now - t0) % PERIOD) / PERIOD;
    fn(ctx, canvas.width, canvas.height, t);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    canvas.remove();
  };
}
