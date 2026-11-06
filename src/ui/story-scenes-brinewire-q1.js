/**
 * story-scenes-brinewire-q1.js — the story painter of Brinewire's `q1-halves`, registered in `story-scenes.js` through `legacy()`.
 *
 * `half-join`: a pure function of `t` on the 960-wide plate. Every number printed is counted from what is drawn. Beat one drags the electrons
 * of a zinc atom over to a copper ion: each atom's number is its electrons gone (or its vacancies left), counted from the discs that have
 * crossed. Beat two writes the zinc and copper halves and counts the charge on each side from the species and electron discs standing there.
 * Beat three sends 6 electrons from two aluminium atoms to three copper ions, and the given and taken tallies are the discs that left and
 * arrived. Beat four sends 5 electrons from five iron(II) ions to one permanganate ion; its number is 7 minus the electrons that arrived, and
 * the charge on each side is summed from the species of the overall equation (`celldata-q1.js` `overall`).
 */

import { SPECIES, matchElectrons } from '../learn/engine/celldata.js';
import { HALF, overall, oxText } from '../learn/engine/celldata-q1.js';
import { C, text, ground, win, ease, disc, line } from './story-kit.js';

const E_R = 9;

function electron(ctx, x, y) { disc(ctx, x, y, E_R, C.pale); }
const tagNum = (ctx, n, x, y, color = C.amber) => text(ctx, oxText(n), x, y, { size: 30, color, weight: 700 });
const arch = (a, b, p, lift = 90) => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p - Math.sin(Math.PI * p) * lift });

/** An atom or ion: a labelled disc. */
function body(ctx, id, x, y, r, fill) {
  disc(ctx, x, y, r, fill);
  text(ctx, SPECIES[id].text, x, y, { size: Math.round(r * 0.62), color: '#16140f', weight: 700 });
}

function halfJoin(ctx, w, h, t) {
  ground(ctx, w, h);
  /* ---- beat one: zinc's two electrons cross to copper; numbers are counted from the discs ---- */
  if (t <= 0.26) {
    text(ctx, 'Zinc into copper(II) sulfate', w / 2, 36, { size: 24, color: C.dust });
    const zn = { x: 230, y: 300 }; const cu = { x: 730, y: 300 };
    const ps = [0, 1].map(i => ease(win(t, 0.03 + i * 0.07, 0.16 + i * 0.07)));
    const crossed = ps.filter(p => p >= 0.5).length;
    body(ctx, 'Zn', zn.x, zn.y, 58, '#8f9ca4');
    body(ctx, 'Cu2+', cu.x, cu.y, 58, '#b66a3e');
    ps.forEach((p, i) => {
      const home = { x: zn.x + 78, y: zn.y - 34 + i * 68 };
      const away = { x: cu.x - 78, y: cu.y - 34 + i * 68 };
      const q = arch(home, away, p, 70);
      electron(ctx, q.x, q.y);
    });
    text(ctx, 'zinc', zn.x, zn.y + 96, { size: 22, color: C.dust });
    text(ctx, 'copper ion', cu.x, cu.y + 96, { size: 22, color: C.dust });
    tagNum(ctx, 0 + crossed, zn.x, zn.y - 100);
    tagNum(ctx, 2 - crossed, cu.x, cu.y - 100);
    text(ctx, 'oxidation number', w / 2, 120, { size: 20, color: C.dim });
    text(ctx, `${crossed} electron${crossed === 1 ? '' : 's'} crossed`, w / 2, 470, { size: 22, color: C.dust });
    return;
  }
  /* ---- beat two: the two halves, each counting its own charge ---- */
  if (t <= 0.5) {
    const p = ease(win(t, 0.28, 0.44));
    text(ctx, 'Each half counts its own charge', w / 2, 36, { size: 24, color: C.dust });
    const n = Math.round(p * 2);
    const halves = [
      { x: 250, name: 'oxidation: zinc loses electrons', l: [['Zn', 1]], r: [['Zn2+', 1]], eSide: 'right' },
      { x: 710, name: 'reduction: copper gains electrons', l: [['Cu2+', 1]], r: [['Cu', 1]], eSide: 'left' }
    ];
    halves.forEach(hf => {
      text(ctx, hf.name, hf.x, 100, { size: 21, color: C.dust });
      const xs = { l: hf.x - 130, r: hf.x + 130 };
      line(ctx, hf.x - 40, 230, hf.x + 40, 230, C.steel, 3);
      let qL = 0; let qR = 0;
      for (const [id] of hf.l) { body(ctx, id, xs.l - (hf.eSide === 'left' ? 52 : 0), 230, 42, id === 'Zn' ? '#8f9ca4' : '#b66a3e'); qL += SPECIES[id].charge; }
      for (const [id] of hf.r) { body(ctx, id, xs.r + (hf.eSide === 'right' ? -52 : 0), 230, 42, id === 'Zn2+' ? '#8f9ca4' : '#b66a3e'); qR += SPECIES[id].charge; }
      for (let i = 0; i < n; i++) {
        const ex = hf.eSide === 'left' ? xs.l + 14 + i * 28 : xs.r + 38 + i * 28;
        electron(ctx, ex, 230);
        if (hf.eSide === 'left') qL -= 1; else qR -= 1;
      }
      text(ctx, `charge ${oxText(qL)}`, xs.l, 330, { size: 28, color: C.amber, weight: 700 });
      text(ctx, `charge ${oxText(qR)}`, xs.r, 330, { size: 28, color: C.amber, weight: 700 });
    });
    if (p > 0.95) text(ctx, '2 electrons lost, 2 electrons gained', w / 2, 450, { size: 26, color: C.green, weight: 700 });
    return;
  }
  /* ---- beat three: aluminium and copper, written enough times that the electrons match ---- */
  if (t <= 0.76) {
    const p = win(t, 0.53, 0.72);
    const m = matchElectrons(3, 2);
    text(ctx, 'Aluminium and copper(II) ions', w / 2, 36, { size: 24, color: C.dust });
    const als = Array.from({ length: m.a }, (_, i) => ({ x: 170, y: 190 + i * 150 }));
    const cus = Array.from({ length: m.b }, (_, i) => ({ x: 790, y: 130 + i * 120 }));
    als.forEach(a => body(ctx, 'Al', a.x, a.y, 48, '#bcc0c2'));
    cus.forEach(c => body(ctx, 'Cu2+', c.x, c.y, 48, '#b66a3e'));
    const total = m.electrons;
    let left = 0; let arrived = 0;
    for (let k = 0; k < total; k++) {
      const from = als[Math.floor(k / 3)]; const to = cus[Math.floor(k / 2)];
      const pk = ease(win(p, (k / total) * 0.7, (k / total) * 0.7 + 0.3));
      const a = { x: from.x + 64, y: from.y - 20 + (k % 3) * 22 };
      const b = { x: to.x - 64, y: to.y - 12 + (k % 2) * 24 };
      const q = arch(a, b, pk, 40);
      electron(ctx, q.x, q.y);
      if (pk > 0.02) left++;
      if (pk >= 0.98) arrived++;
    }
    text(ctx, `${als.length} Al`, 170, 480, { size: 24, color: C.dust });
    text(ctx, `${cus.length} Cu²⁺`, 790, 480, { size: 24, color: C.dust });
    text(ctx, `electrons given ${left}`, w / 2, 400, { size: 26, color: C.amber, weight: 700 });
    text(ctx, `electrons taken ${arrived}`, w / 2, 444, { size: 26, color: C.amber, weight: 700 });
    return;
  }
  /* ---- beat four: permanganate takes five electrons from five iron(II) ions ---- */
  const p = win(t, 0.79, 0.92);
  const mn = HALF.mn(); const fe = HALF.fe();
  const m = matchElectrons(mn.eLeft, 1);
  const o = overall(fe, m.b, mn, m.a);
  text(ctx, 'Permanganate in acid with iron(II)', w / 2, 36, { size: 24, color: C.dust });
  const mnPos = { x: 760, y: 280 };
  body(ctx, 'MnO4', mnPos.x, mnPos.y, 66, '#9a4a2e');
  let arrived = 0;
  for (let k = 0; k < m.b; k++) {
    const pos = { x: 150, y: 110 + k * 82 };
    const pk = ease(win(p, k * 0.14, k * 0.14 + 0.3));
    const gone = pk >= 0.5;
    body(ctx, gone ? 'Fe3+' : 'Fe2+', pos.x, pos.y, 30, gone ? '#7a5a40' : '#7a7a78');
    const q = arch({ x: pos.x + 40, y: pos.y }, { x: mnPos.x - 80, y: mnPos.y + (k - 2) * 12 }, pk, 20);
    electron(ctx, q.x, q.y);
    if (pk >= 0.98) arrived++;
  }
  text(ctx, `Mn ${oxText(7 - arrived)}`, mnPos.x, mnPos.y - 100, { size: 32, color: C.amber, weight: 700 });
  if (p > 0.9) {
    text(ctx, `charge ${o.charge.left} on the left, ${o.charge.right} on the right`, w / 2, 470, { size: 26, color: C.green, weight: 700 });
  }
}

export const BRINEWIRE_Q1_SCENES = { 'half-join': halfJoin };
