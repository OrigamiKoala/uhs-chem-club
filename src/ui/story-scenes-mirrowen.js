/**
 * story-scenes-mirrowen.js — Mirrowen's story pictures: the mechanism each bench worked out, drawn from the bench's own tables.
 *
 * Same contract as `story-scenes.js`: pure functions of `t` on a 960-wide plate (scaled up by the registry), SCOURED PLATE palette, no
 * glow, every figure read from `matterdata.js`. Pure over a 2D context: importable in Node (`verify:story`).
 */

import { SUBSTANCES, HYDRATION } from '../learn/engine/matterdata.js';
import { BOND_ENTHALPIES } from '../learn/engine/thermodata.js';
import { GLYPHS, inkOf } from '../learn/table/kits/matter-parts.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
import { win, ease, lerp } from './story-sim.js';
import { Q1_SCENES } from './story-scenes-mirrowen-q1.js';
import { Q3_SCENES } from './story-scenes-mirrowen-q3.js';
import { Q4_SCENES } from './story-scenes-mirrowen-q4.js';
import { Q5_SCENES } from './story-scenes-mirrowen-q5.js';
import { Q6_SCENES } from './story-scenes-mirrowen-q6.js';
import { Q7_SCENES } from './story-scenes-mirrowen-q7.js';

const C = { ...KIT, cold: '#6f8fb0', warm: '#c0652b' };

/** A molecule from the kit's glyph: its atoms as discs and rods, `unit` pixels to a bond, centred on (cx, cy). */
function molecule(ctx, id, cx, cy, unit) {
  const g = GLYPHS[id];
  if (!g) { disc(ctx, cx, cy, unit * 0.34, inkOf(id)); return; }
  for (const [i, j] of g.bonds) line(ctx, cx + g.atoms[i][1] * unit, cy - g.atoms[i][2] * unit, cx + g.atoms[j][1] * unit, cy - g.atoms[j][2] * unit, C.dust, Math.max(2, unit * 0.1));
  for (const [el, x, y] of g.atoms) disc(ctx, cx + x * unit, cy - y * unit, el === 'H' ? unit * 0.2 : unit * 0.3, inkOf(el), C.steel);
}

const kj = v => (v < 1 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : String(Math.round(v)));

/* ---- q2-grip: a bigger cloud holds harder; light water out-grips heavier hydrogen sulfide; both are tiny beside a bond ---- */
const NOBLE = ['He', 'Ne', 'Ar', 'Xe'];
const OH2 = 2 * BOND_ENTHALPIES['O-H'].dH; // both O–H bonds of every molecule in a mole of water

function gripBars(ctx, w, h, t) {
  ground(ctx, w, h);
  const a = 1 - ease(win(t, 0.3, 0.36));
  if (a > 0) {
    // The four noble gases: the cloud is drawn at its van der Waals radius and the bar is what the probe reads.
    ctx.globalAlpha = a;
    const base = 400; const maxH = 260; const top = SUBSTANCES.Xe.grip;
    line(ctx, 80, base, 880, base, C.steel, 2);
    const grow = ease(win(t, 0.04, 0.26));
    NOBLE.forEach((id, i) => {
      const s = SUBSTANCES[id];
      const x = 170 + i * 200;
      const bh = Math.max(3, (s.grip / top) * maxH * grow);
      ctx.fillStyle = C.amber; ctx.fillRect(x - 34, base - bh, 68, bh);
      ctx.globalAlpha = a * 0.55; disc(ctx, x, base + 62, (s.r / 216) * 38, '#3a3a38', C.dust); ctx.globalAlpha = a;
      text(ctx, id, x, base + 62, { size: 24, color: C.text, weight: 700 });
      text(ctx, `${kj(s.grip * grow)}`, x, base - bh - 18, { size: 22, color: C.text, weight: 700 });
    });
    text(ctx, 'heat to pull one mole apart (kJ)', w / 2, 56, { size: 24, color: C.dust });
    ctx.globalAlpha = 1;
  }
  const b = ease(win(t, 0.34, 0.4)) * (1 - ease(win(t, 0.62, 0.68)));
  if (b > 0) {
    // Water and hydrogen sulfide: the lighter one holds harder.
    ctx.globalAlpha = b;
    const base = 400; const maxH = 270; const top = SUBSTANCES.H2O.grip;
    line(ctx, 160, base, 800, base, C.steel, 2);
    const grow = ease(win(t, 0.4, 0.58));
    [['H2O', 300], ['H2S', 660]].forEach(([id, x]) => {
      const s = SUBSTANCES[id];
      const bh = (s.grip / top) * maxH * grow;
      ctx.fillStyle = C.amber; ctx.fillRect(x - 40, base - bh, 80, bh);
      molecule(ctx, id, x, base + 56, 40);
      text(ctx, `${s.formula}   ${s.M.toFixed(0)} g/mol`, x, base + 112, { size: 22, color: C.text, weight: 700 });
      text(ctx, `${kj(s.grip * grow)}`, x, base - bh - 18, { size: 24, color: C.text, weight: 700 });
    });
    text(ctx, 'heat to pull one mole apart (kJ)', w / 2, 56, { size: 24, color: C.dust });
    ctx.globalAlpha = 1;
  }
  const c = ease(win(t, 0.66, 0.72));
  if (c > 0) {
    // A grip beside a bond: every O–H bond in a mole of water against the pull of the molecules from each other.
    ctx.globalAlpha = c;
    const x0 = 100; const full = 760; const gw = (SUBSTANCES.H2O.grip / OH2) * full;
    const grow = ease(win(t, 0.72, 0.9));
    text(ctx, 'one mole of water', x0, 150, { size: 24, color: C.dust, align: 'left' });
    ctx.fillStyle = C.amber; ctx.fillRect(x0, 220, gw * grow, 52);
    text(ctx, `pull the molecules apart  ${kj(SUBSTANCES.H2O.grip)} kJ`, x0, 304, { size: 22, color: C.text, align: 'left' });
    ctx.fillStyle = C.warm; ctx.fillRect(x0, 350, full * grow, 52);
    text(ctx, `break every O–H bond  ${kj(OH2)} kJ`, x0, 434, { size: 22, color: C.text, align: 'left' });
    ctx.globalAlpha = 1;
  }
  void lerp; void HYDRATION;
}

export const MIRROWEN_SCENES = {
  'grip-bars': gripBars,
  ...Q1_SCENES,
  ...Q3_SCENES,
  ...Q4_SCENES,
  ...Q5_SCENES,
  ...Q6_SCENES,
  ...Q7_SCENES,
};
