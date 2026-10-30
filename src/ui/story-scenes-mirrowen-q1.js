/**
 * story-scenes-mirrowen-q1.js — the story picture of Mirrowen's q1 bench (`q1-states`): the same eight water molecules in a jar as a solid,
 * a liquid and a gas, then carried from one to the next with every bond counted, then a jar of water against a jar of steam.
 *
 * Same contract as `story-scenes-mirrowen.js`: pure functions of `t` on a 960-wide plate, SCOURED PLATE palette, no glow. Every number on
 * screen is counted from what is drawn (molecules, bonds, bond lengths) or read from `matterdata-window.js` (the balance's grams).
 */

import { arrange, FRAME, jarMass, SAMPLES } from '../learn/engine/matterdata-window.js';
import { GLYPHS, inkOf } from '../learn/table/kits/matter-parts.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
import { win, ease, lerp } from './story-sim.js';

const C = { ...KIT };

/** One water molecule turned by `ang`, `unit` pixels to a bond. Returns the drawn length of each bond, in bonds, so a scene can count them. */
function water(ctx, cx, cy, unit, ang) {
  const g = GLYPHS.H2O;
  const c = Math.cos(ang); const s = Math.sin(ang);
  const at = ([, x, y]) => [cx + (x * c - y * s) * unit, cy - (x * s + y * c) * unit];
  const lengths = [];
  for (const [i, j] of g.bonds) {
    const [x0, y0] = at(g.atoms[i]); const [x1, y1] = at(g.atoms[j]);
    line(ctx, x0, y0, x1, y1, C.dust, Math.max(2, unit * 0.14));
    lengths.push(Math.hypot(x1 - x0, y1 - y0) / unit);
  }
  for (const a of g.atoms) { const [x, y] = at(a); disc(ctx, x, y, unit * (a[0] === 'H' ? 0.3 : 0.44), inkOf(a[0]), C.steel); }
  return lengths;
}

const SOLID = arrange({ state: 'solid', T: -10, seed: 'story' });
const LIQUID = arrange({ state: 'liquid', T: 20, seed: 'story' });
const GAS = arrange({ state: 'gas', T: 110, seed: 'story' });
/** Where molecule `i` stands when the scene has carried the jar `s` of the way from solid (0) through liquid (1) to gas (2). */
function placeAt(i, s) {
  const [a, b, k] = s <= 1 ? [SOLID, LIQUID, s] : [LIQUID, GAS, s - 1];
  const e = ease(Math.max(0, Math.min(1, k)));
  return { x: lerp(a[i].x, b[i].x, e), y: lerp(a[i].y, b[i].y, e), ang: lerp(a[i].ang, b[i].ang, e) };
}

/** A framed jar of the eight molecules at (x, y), `w` wide, drawn at `s`; returns the bond lengths it drew. */
function jar(ctx, x, y, w, s) {
  const h = w * FRAME.h / FRAME.w; const k = w / FRAME.w;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  const lengths = [];
  for (let i = 0; i < SOLID.length; i++) { const p = placeAt(i, s); lengths.push(...water(ctx, x + p.x * k, y + p.y * k, k * 1.05, p.ang)); }
  return lengths;
}

const stateName = s => (s < 0.5 ? 'solid' : s < 1.5 ? 'liquid' : 'gas');

function statesThree(ctx, w, h, t) {
  ground(ctx, w, h);
  // 1. Three jars: the same eight molecules in each.
  const a = 1 - ease(win(t, 0.27, 0.33));
  if (a > 0) {
    ctx.globalAlpha = a * ease(win(t, 0, 0.05));
    const pw = 270;
    ['solid', 'liquid', 'gas'].forEach((name, i) => {
      const x = 45 + i * 300; const y = 150;
      const lens = jar(ctx, x, y, pw, i);
      text(ctx, name, x + pw / 2, y + 225, { size: 28, color: C.text, weight: 700 });
      text(ctx, `${SOLID.length} molecules, ${lens.length / 2} drawn whole`, x + pw / 2, y + 262, { size: 20, color: C.dust });
    });
    text(ctx, 'one jar of water, three ways', w / 2, 70, { size: 26, color: C.dust });
    ctx.globalAlpha = 1;
  }
  // 2. One jar carried from solid to liquid to gas, the bonds counted at every frame.
  const b = ease(win(t, 0.3, 0.36)) * (1 - ease(win(t, 0.62, 0.68)));
  if (b > 0) {
    ctx.globalAlpha = b;
    const s = 2 * ease(win(t, 0.36, 0.6));
    const pw = 470; const x = 60; const y = 120;
    const lens = jar(ctx, x, y, pw, s);
    const whole = lens.filter(l => Math.abs(l - 1) < 0.01).length;
    text(ctx, stateName(s), x + pw / 2, y + 340, { size: 34, color: C.text, weight: 700 });
    const rx = 640;
    text(ctx, 'READER', rx, 150, { size: 20, color: C.dim, align: 'left' });
    text(ctx, SAMPLES.H2O.formula, rx, 190, { size: 46, color: C.amber, weight: 700, align: 'left' });
    text(ctx, `molecules  ${lens.length / 2}`, rx, 270, { size: 28, color: C.text, align: 'left' });
    text(ctx, `bonds drawn whole  ${whole}`, rx, 320, { size: 28, color: C.text, align: 'left' });
    text(ctx, `bonds broken  ${lens.length - whole}`, rx, 370, { size: 28, color: C.amber, weight: 700, align: 'left' });
    ctx.globalAlpha = 1;
  }
  // 3. A jar of water against a jar of steam, equal in size: the grams on the balance.
  const c = ease(win(t, 0.66, 0.72));
  if (c > 0) {
    ctx.globalAlpha = c;
    const base = 420; const maxH = 270;
    const water1 = jarMass('liquid'); const steam1 = jarMass('gas');
    line(ctx, 160, base, 800, base, C.steel, 2);
    const grow = ease(win(t, 0.72, 0.88));
    [['water', water1, 300], ['steam', steam1, 660]].forEach(([name, g, x]) => {
      const bh = Math.max(2, (g / water1) * maxH * grow);
      ctx.fillStyle = C.amber; ctx.fillRect(x - 50, base - bh, 100, bh);
      text(ctx, name, x, base + 36, { size: 26, color: C.text, weight: 700 });
      text(ctx, `${(g * grow < 1 ? (g * grow).toFixed(3) : String(Math.round(g * grow)))} g`, x, base - bh - 24, { size: 26, color: C.text, weight: 700 });
    });
    text(ctx, 'one litre of each', w / 2, 70, { size: 26, color: C.dust });
    const ratio = Math.round(water1 / steam1 / 100) * 100;
    if (t > 0.86) text(ctx, `about ${ratio.toLocaleString('en-US')} times as many molecules in the water`, w / 2, 500, { size: 24, color: C.amber, weight: 700 });
    ctx.globalAlpha = 1;
  }
}

export const Q1_SCENES = { 'states-three': statesThree };
