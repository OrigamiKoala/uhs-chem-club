/**
 * story-scenes-brinewire-q2-activity.js — the story painter of Brinewire's `q2-activity`, registered in `story-scenes.js` through `legacy()`.
 *
 * `dip-order`: a pure function of `t` on the 960-wide plate. Every picture is `engine/celldata-q2-activity.js` (`celldata.js`
 * `displaces`, `givesHydrogen`, `protectsIron`), and every number printed is counted from what is drawn: the coated strips of a beaker are
 * the strips drawn with a coating, a metal's rank is the squares it earned from the beakers it coated in, the bubbled metals are the strips
 * drawn with bubbles, and the spots on a nail are the spots drawn on it. Beat one dips three strips in three solutions, beat two ranks four
 * metals by the beakers each coated in, beat three puts hydrogen among five metals, beat four wires four partners to iron nails.
 */

import { METALS, activityOrder } from '../learn/engine/celldata.js';
import { coated, nailSpots, dipResult } from '../learn/engine/celldata-q2-activity.js';
import { C, text, ground, win, ease, disc, line } from './story-kit.js';

const INK = { mg: '#b4b6b0', zn: '#8f9ca4', fe: '#7a7a78', ni: '#a8aba5', sn: '#b6b9bb', pb: '#7e7d84', cu: '#b66a3e', ag: '#cfd0cc' };
const COAT = { zn: '#8fa3b8', fe: '#6a6c72', pb: '#a8a8b0', cu: '#b4552d', ag: '#ecece6' };
const LIQ = { zn: '#2b3a44', cu: '#264559', ag: '#2c3a42', acid: '#3a3a2e' };
const cap = s => s[0].toUpperCase() + s.slice(1);

/** A beaker outline with liquid; returns nothing. */
function beaker(ctx, cx, top, w, h, liquid) {
  ctx.fillStyle = liquid; ctx.fillRect(cx - w / 2 + 2, top + h * 0.22, w - 4, h * 0.78 - 2);
  line(ctx, cx - w / 2, top, cx - w / 2, top + h, C.steel, 3);
  line(ctx, cx - w / 2, top + h, cx + w / 2, top + h, C.steel, 3);
  line(ctx, cx + w / 2, top + h, cx + w / 2, top, C.steel, 3);
}

/** A strip standing in a beaker; its coating grows with `p`. Returns true once the coating is fully drawn. */
function strip(ctx, x, top, h, metal, coatMetal, p) {
  const surface = top + h * 0.22;
  ctx.fillStyle = INK[metal]; ctx.fillRect(x - 5, top - 30, 10, surface - top + 30);
  if (coatMetal && p > 0) {
    const th = 5 + 8 * p;
    ctx.fillStyle = INK[metal]; ctx.fillRect(x - 3, surface, 6, h * 0.7);
    ctx.fillStyle = COAT[coatMetal]; ctx.fillRect(x - th, surface, th * 2, h * 0.7);
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + (i % 2 ? th : -th), surface + 12 + i * 22, 3.5 * p + 1, 0, Math.PI * 2); ctx.fill(); }
    return p > 0.95;
  }
  ctx.fillStyle = INK[metal]; ctx.fillRect(x - 5, surface, 10, h * 0.7);
  return false;
}

function dipOrder(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t <= 0.26) {
    const p = ease(win(t, 0.03, 0.2));
    text(ctx, 'Three strips dipped in three solutions', w / 2, 34, { size: 24, color: C.dust });
    const ions = ['zn', 'cu', 'ag'];
    ions.forEach((ion, i) => {
      const cx = 170 + i * 310; const top = 140; const bh = 230;
      beaker(ctx, cx, top, 200, bh, LIQ[ion]);
      let n = 0;
      ions.filter(m => m !== ion).forEach((m, k) => {
        const got = coated(m, ion);
        if (strip(ctx, cx - 42 + k * 84, top, bh, m, got ? ion : null, got ? p : 0)) n++;
      });
      text(ctx, `${METALS[ion].ion} solution`, cx, top + bh + 36, { size: 22, color: C.text, weight: 700 });
      text(ctx, `${n} of 2 strips coated`, cx, top + bh + 70, { size: 21, color: n === 2 ? C.amber : C.dust });
    });
    return;
  }
  if (t <= 0.52) {
    const p = ease(win(t, 0.28, 0.46));
    text(ctx, 'Each metal ranked by the solutions it coated in', w / 2, 34, { size: 24, color: C.dust });
    const ids = activityOrder(['zn', 'fe', 'pb', 'cu']);
    ids.forEach((m, i) => {
      const x = 170 + i * 207;
      ctx.fillStyle = INK[m]; ctx.fillRect(x - 55, 150, 110, 24);
      text(ctx, cap(METALS[m].name), x, 120, { size: 24, color: C.text, weight: 700 });
      const others = ids.filter(o => o !== m);
      let n = 0;
      others.forEach((o, k) => {
        const on = ease(win(p, 0.12 * k, 0.12 * k + 0.5));
        const hit = coated(m, o);
        const sx = x - 44 + k * 44;
        if (hit && on > 0.5) { ctx.fillStyle = COAT[o]; ctx.fillRect(sx - 15, 230, 30, 30); n++; }
        else { ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(sx - 15, 230, 30, 30); }
      });
      text(ctx, `coated in ${n} of 3`, x, 300, { size: 21, color: n ? C.amber : C.dust });
    });
    text(ctx, 'most readily gives', 170, 380, { size: 20, color: C.dim });
    text(ctx, 'least readily gives', 790, 380, { size: 20, color: C.dim });
    line(ctx, 250, 380, 700, 380, C.steel, 2);
    return;
  }
  if (t <= 0.76) {
    const p = ease(win(t, 0.54, 0.7));
    text(ctx, 'Five strips in acid', w / 2, 34, { size: 24, color: C.dust });
    const ids = ['mg', 'zn', 'fe', 'cu', 'ag'];
    let bubbled = 0;
    ids.forEach((m, i) => {
      const cx = 100 + i * 190; const top = 130; const bh = 210;
      beaker(ctx, cx, top, 140, bh, LIQ.acid);
      strip(ctx, cx, top, bh, m, null, 0);
      const gas = dipResult(m, 'acid').gas;
      if (gas && p > 0.3) {
        bubbled++;
        for (let k = 0; k < 6; k++) { ctx.strokeStyle = C.dust; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx + (k % 2 ? 26 : -26), top + 40 + k * 26 - p * 8, 6, 0, Math.PI * 2); ctx.stroke(); }
      }
      text(ctx, cap(METALS[m].name), cx, top + bh + 34, { size: 21, color: C.text, weight: 700 });
    });
    text(ctx, `${bubbled} of ${ids.length} strips bubbled`, w / 2, 440, { size: 24, color: C.amber, weight: 700 });
    if (p > 0.8) {
      // Hydrogen takes the place after the last metal that bubbled.
      const x = 100 + 2 * 190 + 95;
      disc(ctx, x, 480, 16, C.pale);
      text(ctx, 'H', x, 481, { size: 20, color: '#16140f', weight: 700 });
      text(ctx, 'hydrogen sits here', x, 515, { size: 18, color: C.dust });
    }
    return;
  }
  const p = ease(win(t, 0.78, 0.9));
  text(ctx, 'An iron nail wired to four partners', w / 2, 34, { size: 24, color: C.dust });
  ['zn', 'cu', 'mg', 'sn'].forEach((m, i) => {
    const cx = 130 + i * 230; const top = 130; const bh = 230;
    beaker(ctx, cx, top, 170, bh, '#33403a');
    ctx.fillStyle = INK.fe; ctx.fillRect(cx - 38, top - 30, 12, bh * 0.92);
    ctx.fillStyle = INK[m]; ctx.fillRect(cx + 26, top - 30, 12, bh * 0.92);
    line(ctx, cx - 32, top - 30, cx - 32, top - 52, C.dust, 3); line(ctx, cx - 32, top - 52, cx + 32, top - 52, C.dust, 3); line(ctx, cx + 32, top - 52, cx + 32, top - 30, C.dust, 3);
    const want = nailSpots(m);
    let n = 0;
    for (let k = 0; k < want; k++) {
      if (p < (k + 1) / (want + 1)) continue;
      disc(ctx, cx - 32 + (k % 2 ? 9 : -9) * 0.6, top + 40 + k * 32, 6, '#3d7bbd'); n++;
    }
    text(ctx, cap(METALS[m].name), cx, top + bh + 34, { size: 22, color: C.text, weight: 700 });
    text(ctx, `${n} blue spots`, cx, top + bh + 68, { size: 20, color: n ? C.amber : C.dust });
  });
}

export const BRINEWIRE_Q2_SCENES = { 'dip-order': dipOrder };
