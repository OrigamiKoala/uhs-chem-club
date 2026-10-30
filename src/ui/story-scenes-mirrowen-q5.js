/**
 * story-scenes-mirrowen-q5.js — the story picture of Mirrowen's q5 bench (The Crossing): one heating curve drawn by a pen, up and back.
 * Same contract as `story-scenes-mirrowen.js`: pure functions of `t` on a 960-wide plate, SCOURED PLATE palette. Every figure on screen is read from the
 * drawn line itself (the width of each level stretch, the heat at the pen, the twelve molecules' states from `crowdOfTwelve`), never typed.
 */

import { startOf, traceOf, planThermal, crowdOfTwelve } from '../learn/engine/matterdata-curve.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
import { win, ease, lerp } from './story-sim.js';

const G = 18.015; // one mole of water
const START = startOf(-10, 'solid');
const TOP = traceOf(G, START, 0, 54929, 240);
const TOTAL = TOP[TOP.length - 1].q; // J, the way up

/** The level stretches of a trace: `{ from, to }` in joules where the temperature does not change. */
function flats(trace) {
  const out = [];
  let a = null;
  for (let i = 1; i < trace.length; i++) {
    const level = Math.abs(trace[i].T - trace[i - 1].T) < 1e-9;
    if (level && a == null) a = trace[i - 1].q;
    if ((!level || i === trace.length - 1) && a != null) { out.push({ from: a, to: level ? trace[i].q : trace[i - 1].q, T: trace[i - 1].T }); a = null; }
  }
  return out.filter(f => f.to - f.from > 500);
}
const FLATS = flats(TOP);

const PLOT = { x0: 130, x1: 880, y0: 80, y1: 390, xMax: 60, yMin: -20, yMax: 120 };
const px = q => lerp(PLOT.x0, PLOT.x1, q / 1000 / PLOT.xMax);
const py = T => lerp(PLOT.y1, PLOT.y0, (T - PLOT.yMin) / (PLOT.yMax - PLOT.yMin));

function crossingCurve(ctx, w, h, t) {
  ground(ctx, w, h);
  // axes
  ctx.fillStyle = '#100f0c'; ctx.fillRect(PLOT.x0, PLOT.y0, PLOT.x1 - PLOT.x0, PLOT.y1 - PLOT.y0);
  for (let k = 0; k <= PLOT.xMax; k += 10) { line(ctx, px(k * 1000), PLOT.y0, px(k * 1000), PLOT.y1, KIT.faint, 1); text(ctx, String(k), px(k * 1000), PLOT.y1 + 24, { size: 22, color: KIT.dust }); }
  for (let T = PLOT.yMin; T <= PLOT.yMax; T += 20) { line(ctx, PLOT.x0, py(T), PLOT.x1, py(T), KIT.faint, 1); text(ctx, T < 0 ? `−${-T}` : String(T), PLOT.x0 - 14, py(T), { size: 22, color: KIT.dust, align: 'right' }); }
  line(ctx, PLOT.x0, PLOT.y1, PLOT.x1, PLOT.y1, KIT.steel, 2);
  line(ctx, PLOT.x0, PLOT.y0, PLOT.x0, PLOT.y1, KIT.steel, 2);
  text(ctx, 'heat added (kJ)', (PLOT.x0 + PLOT.x1) / 2, PLOT.y1 + 52, { size: 24, color: KIT.dust });
  text(ctx, 'temperature (°C)', PLOT.x0, PLOT.y0 - 24, { size: 24, color: KIT.dust, align: 'left' });

  // The pen: up the curve through t = 0.62, then back down along it.
  const up = ease(win(t, 0.02, 0.6));
  const back = ease(win(t, 0.64, 0.9));
  const qUp = up * TOTAL;
  const qNow = qUp * (1 - back);
  const drawTo = (q, color, width) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    let first = true;
    for (const p of TOP) { if (p.q > q) break; if (first) { ctx.moveTo(px(p.q), py(p.T)); first = false; } else ctx.lineTo(px(p.q), py(p.T)); }
    ctx.stroke(); ctx.lineWidth = 1;
  };
  drawTo(qUp, KIT.green, 4);
  if (back > 0) drawTo(qUp, KIT.amber, 2);
  // Each level stretch is labelled with its own width once the pen has crossed it, on the way up.
  FLATS.forEach(f => {
    if (qUp < f.to - 1) return;
    const mid = (f.from + f.to) / 2;
    text(ctx, `${((f.to - f.from) / 1000).toFixed(2)} kJ`, px(mid), py(f.T) - 20, { size: 24, color: KIT.text, weight: 700 });
  });
  // The pen's tip, the temperature there and the twelve molecules as the heat stands.
  const here = planThermal(G, START, qNow);
  const tipX = px(qNow); const tipY = py(here.T);
  ctx.fillStyle = KIT.amber; ctx.fillRect(tipX - 6, tipY - 6, 12, 12);
  const crowd = crowdOfTwelve(here);
  const dots = [...Array(crowd.gas).fill('gas'), ...Array(crowd.liquid).fill('liquid'), ...Array(crowd.solid).fill('solid')];
  const ink = { solid: '#6f8fb0', liquid: KIT.green, gas: KIT.amber };
  dots.forEach((s, i) => disc(ctx, 180 + i * 34, 462, 12, ink[s], KIT.steel));
  text(ctx, 'twelve molecules', 180 - 14, 500, { size: 22, color: KIT.dust, align: 'left' });
  text(ctx, `${here.T < 0 ? '−' : ''}${Math.abs(here.T).toFixed(1)} °C`, 660, 462, { size: 34, color: KIT.text, weight: 700 });
  const heat = qNow / 1000;
  const shown = back > 0 && back >= 1 ? 0 : heat;
  text(ctx, `${shown.toFixed(1)} kJ added`, 820, 462, { size: 28, color: KIT.amber, weight: 700 });
  if (back > 0.98) text(ctx, `way down: ${(-(TOTAL / 1000)).toFixed(1).replace('-', '−')} kJ`, 660, 500, { size: 26, color: KIT.amber, weight: 700 });
}

export const Q5_SCENES = { 'crossing-curve': crossingCurve };
