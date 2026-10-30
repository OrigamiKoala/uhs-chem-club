/**
 * story-scenes-ligar-mech.js — Ligar's story pictures that show a mechanism: electrons moving between atoms, atoms riding a bond-energy well,
 * a molecule turning in a field, domains pushing apart, orbitals mixing.
 *
 * Same contract as `story-scenes.js` (a pure function of `t`; painters run on a 960-wide plate, scaled up by the registry). Each picture is
 * built so the thing the line says is the thing that moves: a count is a count of drawn dots, an angle is measured from the drawn arms,
 * an overlap is the overlap of the drawn lobes. Pure over a 2D context: importable in Node (`verify:story` draws every scene on a stub context).
 */

import { morse, PAIRS, DISC_RADIUS } from '../learn/engine/bonddata.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
import { win, ease, lerp, project, norm, mix3 } from './story-sim.js';
const C = KIT;

const TAU = Math.PI * 2;
const at = (cx, cy, R, a) => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
const move = (from, to, p) => [lerp(from[0], to[0], p), lerp(from[1], to[1], p)];

/** An electron: a small bright dot. */
const dot = (ctx, [x, y], color = C.pale, r = 5.5) => disc(ctx, x, y, r, color);

/** The outer shell of an atom: a ring with its label inside. */
function atomRing(ctx, x, y, R, label, color = C.steel, lw = 2, fill = '#16140f') {
  disc(ctx, x, y, R, fill);
  ctx.beginPath();
  ctx.arc(x, y, R, 0, TAU);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
  text(ctx, label, x, y, { size: 28, color: C.text, weight: 700 });
}

/* ---- q1-joins: an atom hands an electron over, or two atoms hold one pair between them; either way each outer shell ends full ---- */
function bondPairs(ctx, w, h, t) {
  ground(ctx, w, h);
  const y = 250; const R = 58;
  const go = ease(win(t, 0.2, 0.44));
  const full = ease(win(t, 0.46, 0.6));
  // Left pair, sodium and chlorine: sodium's one outer electron crosses to the empty place in chlorine's shell.
  const naX = 170 + 10 * go; const clX = 330 - 10 * go;
  const clSlots = [[-Math.PI / 2 - 0.2], [-Math.PI / 2 + 0.2], [Math.PI / 2 - 0.2], [Math.PI / 2 + 0.2], [-0.2], [0.2], [Math.PI + 0.2]].map(([a]) => a);
  const clCol = go > 0.5 ? C.amber : C.steel;
  atomRing(ctx, naX, y, R, go > 0.9 ? 'Na⁺' : 'Na', go > 0.9 ? C.dim : C.steel);
  atomRing(ctx, clX, y, R, go > 0.9 ? 'Cl⁻' : 'Cl', clCol, 2 + 2 * full);
  clSlots.forEach(a => dot(ctx, at(clX, y, R, a)));
  const from = at(170, y, R, 0); const to = at(clX, y, R, Math.PI - 0.2);
  dot(ctx, move(from, to, go), C.amber);
  // Right pair, two chlorines: each one's single unpaired electron goes to the middle, and the two are held there together.
  const a1 = 640 + 22 * go; const a2 = 780 - 22 * go;
  atomRing(ctx, a1, y, R, 'Cl', go > 0.5 ? C.amber : C.steel, 2 + 2 * full);
  atomRing(ctx, a2, y, R, 'Cl', go > 0.5 ? C.amber : C.steel, 2 + 2 * full);
  [-Math.PI / 2, Math.PI / 2, Math.PI].forEach(a => { [-0.2, 0.2].forEach(d => dot(ctx, at(a1, y, R, a + d))); });
  [-Math.PI / 2, Math.PI / 2, 0].forEach(a => { [-0.2, 0.2].forEach(d => dot(ctx, at(a2, y, R, a + d))); });
  dot(ctx, at(a1, y, R, 0.2));
  dot(ctx, at(a2, y, R, Math.PI - 0.2));
  const mid = (a1 + a2) / 2;
  const own1 = at(a1, y, R, -0.2); const own2 = at(a2, y, R, Math.PI + 0.2);
  dot(ctx, move(own1, [mid, y - 8], go), C.amber);
  dot(ctx, move(own2, [mid, y + 8], go), C.amber);
  // Each outer shell now holds eight, counted: the ones a chlorine keeps plus the one it received or shares.
  if (full > 0) {
    ctx.globalAlpha = full;
    text(ctx, '8', clX, y + R + 36, { size: 30, color: C.amber, weight: 700 });
    text(ctx, '8', a1, y + R + 36, { size: 30, color: C.amber, weight: 700 });
    text(ctx, '8', a2, y + R + 36, { size: 30, color: C.amber, weight: 700 });
    text(ctx, '8', naX, y + R + 36, { size: 30, color: C.amber, weight: 700 });
    ctx.globalAlpha = 1;
  }
  if (t > 0.18) text(ctx, 'handed over', 250, 140, { size: 24, color: C.amber });
  if (t > 0.18) text(ctx, 'held between them', 710, 140, { size: 24, color: C.amber });
  if (t > 0.5) {
    text(ctx, 'ionic', 250, 170, { size: 22, color: C.dust });
    text(ctx, 'covalent', 710, 170, { size: 22, color: C.dust });
  }
  // The rubble: grains that are ions in a lattice, each held to its neighbours.
  const grains = Math.round(win(t, 0.62, 0.95) * 18);
  for (let i = 0; i < grains; i++) {
    const gx = 240 + (i % 9) * 60; const gy = 440 + Math.floor(i / 9) * 44;
    disc(ctx, gx, gy, (i + Math.floor(i / 9)) % 2 ? 12 : 17, (i + Math.floor(i / 9)) % 2 ? C.amber : C.pale);
  }
}

/* ---- q3-distance: two atoms ride the energy curve: they settle at the bottom, and pulling them out costs the depth ---- */
function wellDepth(ctx, w, h, t) {
  ground(ctx, w, h);
  const P = PAIRS['H-Cl'];
  const x0 = 90; const x1 = 870; const zeroY = 120; const botY = 330;
  const X = r => x0 + (r / 330) * (x1 - x0);
  const Y = e => zeroY + (-e / P.de) * (botY - zeroY);
  const curveY = r => Math.min(Y(Math.min(morse('H-Cl', r), P.de * 0.45)), botY + 4);
  line(ctx, x0, zeroY, x1, zeroY, C.dim, 1, [4, 4]);
  text(ctx, 'energy', x0, zeroY - 40, { size: 18, color: C.dim, align: 'left' });
  text(ctx, 'apart', x1, zeroY - 14, { size: 18, color: C.dim, align: 'right' });
  ctx.beginPath();
  for (let r = 60; r <= 330; r += 3) { const x = X(r); const y = curveY(r); if (r === 60) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // The separation of the two atoms: they close in from far away, overshoot into the push, settle, and then are pulled back out.
  const u = win(t, 0.06, 0.4);
  const rIn = P.r0 + (330 - P.r0) * (1 - u) * (1 - u) * Math.cos(u * 2.5 * Math.PI);
  const r = t < 0.52 ? rIn : lerp(P.r0, 330, ease(win(t, 0.52, 0.9)));
  const rr = Math.max(62, r);
  // The atoms, drawn on a strip under the curve at the same horizontal scale.
  const sy = 455;
  const clR = DISC_RADIUS.Cl * 0.26; const hR = DISC_RADIUS.H * 0.26;
  const gap = X(rr) - x0;
  disc(ctx, x0, sy, clR, '#5b7a32', C.steel);
  disc(ctx, x0 + gap, sy, hR + 2, C.pale, C.steel);
  text(ctx, 'Cl', x0, sy, { size: 18, color: C.text, weight: 700 });
  text(ctx, 'H', x0 + gap, sy, { size: 16, color: '#16140f', weight: 700 });
  line(ctx, x0 + clR, sy + clR + 16, x0 + gap, sy + clR + 16, C.dim, 1);
  line(ctx, x0 + clR, sy + clR + 10, x0 + clR, sy + clR + 22, C.dim, 1);
  line(ctx, x0 + gap, sy + clR + 10, x0 + gap, sy + clR + 22, C.dim, 1);
  // The marker on the curve is the pair's energy at that separation.
  const mx = X(rr); const my = curveY(rr);
  line(ctx, mx, my, mx, sy - 30, C.dim, 1, [3, 5]);
  disc(ctx, mx, my, 9, C.amber);
  // Pushing in climbs the near wall; the bottom is where the push and the pull balance.
  if (t > 0.18 && t < 0.5) text(ctx, 'too close: they push apart', X(80), zeroY + 70, { size: 18, color: C.dust, align: 'left' });
  if (t > 0.3 && t < 0.52) text(ctx, 'rest here', X(P.r0), botY + 30, { size: 22, color: C.amber });
  // Taking them apart: the energy that must be put in is the height of the climb back to zero.
  const taken = Math.max(0, morse('H-Cl', rr) - morse('H-Cl', P.r0));
  if (t > 0.5) {
    const dep = ease(win(t, 0.5, 0.62));
    line(ctx, X(P.r0), zeroY, X(P.r0), zeroY + (botY - zeroY) * dep, C.amber, 2);
    text(ctx, `${P.de} kJ/mol`, X(P.r0) + 14, (zeroY + botY) / 2, { size: 24, color: C.amber, align: 'left', weight: 700 });
    text(ctx, `put in so far: ${Math.round(taken)}`, x1, botY + 30, { size: 20, color: C.dust, align: 'right' });
  }
  if (t > 0.92) text(ctx, 'a charge must give more than the depth', w / 2, 505, { size: 22, color: C.amber });
}

/* ---- q7-polarity: unequal pulls make a net pull; a field turns water until it lines up, and carbon dioxide, whose pulls cancel, does not move ---- */
function fieldSwing(ctx, w, h, t) {
  ground(ctx, w, h);
  const on = ease(win(t, 0.25, 0.7));
  const s = win(t, 0.25, 0.8);
  for (const [x, sign] of [[60, '+'], [880, '−']]) {
    ctx.fillStyle = C.iron;
    ctx.fillRect(x - 10, 90, 20, 360);
    ctx.strokeStyle = on > 0.05 ? C.amber : C.steel;
    ctx.strokeRect(x - 9.5, 90.5, 19, 359);
    text(ctx, sign, x, 70, { size: 32, color: C.text, weight: 700 });
  }
  if (on > 0.05) {
    ctx.globalAlpha = Math.min(1, on * 2);
    for (const fy of [150, 270, 390]) { line(ctx, 100, fy, 840, fy, C.dim, 1, [10, 12]); line(ctx, 840, fy, 826, fy - 6, C.dim, 1); line(ctx, 840, fy, 826, fy + 6, C.dim, 1); }
    ctx.globalAlpha = 1;
  }
  const arrow = (x0, y0, x1, y1, color, lw) => {
    line(ctx, x0, y0, x1, y1, color, lw);
    const a = Math.atan2(y1 - y0, x1 - x0);
    line(ctx, x1, y1, x1 - 12 * Math.cos(a - 0.45), y1 - 12 * Math.sin(a - 0.45), color, lw);
    line(ctx, x1, y1, x1 - 12 * Math.cos(a + 0.45), y1 - 12 * Math.sin(a + 0.45), color, lw);
  };
  const cy = 270; const arm = 100;
  // Water: it starts turned any way; the field turns it, with a little overshoot, until its positive end faces the negative plate.
  const wx = 330;
  const th = 2.4 * Math.exp(-3.2 * s) * Math.cos(6 * s);
  const half = 52.25 * Math.PI / 360;
  const hs = [th - half, th + half].map(a => [wx + arm * Math.cos(a), cy + arm * Math.sin(a)]);
  hs.forEach(([x, y]) => {
    line(ctx, wx, cy, x, y, C.steel, 4);
    disc(ctx, x, y, 18, C.pale, C.steel);
    text(ctx, 'δ+', x + 30 * Math.cos(th), y + 30 * Math.sin(th), { size: 18, color: C.dust });
    // Each bond's own pull is toward oxygen.
    arrow((wx + x) / 2 + 8 * Math.cos(th), (cy + y) / 2 + 8 * Math.sin(th), wx + (x - wx) * 0.32, cy + (y - cy) * 0.32, C.dust, 2);
  });
  disc(ctx, wx, cy, 28, C.rust, C.steel);
  text(ctx, 'O', wx, cy, { size: 22, color: C.text, weight: 700 });
  text(ctx, 'δ−', wx - 42 * Math.cos(th), cy - 42 * Math.sin(th) - 6, { size: 18, color: C.dust });
  // The net pull is the sum of the two, drawn beside the molecule: toward oxygen.
  const px = -Math.sin(th); const py = Math.cos(th);
  const bx = wx + px * 128; const by = cy + py * 128;
  arrow(bx + 60 * Math.cos(th), by + 60 * Math.sin(th), bx - 60 * Math.cos(th), by - 60 * Math.sin(th), C.amber, 4);
  text(ctx, 'water', wx, 470, { size: 24, color: C.dust });
  if (t > 0.85) text(ctx, 'net pull lines up with the field', wx, 505, { size: 18, color: C.amber });
  // Carbon dioxide: two equal pulls in opposite directions, so there is nothing for the field to turn.
  const cx = 640; const tilt = 2.4;
  const ends = [tilt, tilt + Math.PI].map(a => [cx + arm * Math.cos(a), cy + arm * Math.sin(a)]);
  ends.forEach(([x, y], i) => {
    line(ctx, cx, cy, x, y, C.steel, 4);
    disc(ctx, x, y, 22, C.rust, C.steel);
    text(ctx, 'δ−', x + 38 * Math.cos(tilt + i * Math.PI), y + 38 * Math.sin(tilt + i * Math.PI), { size: 18, color: C.dust });
    arrow(cx + (x - cx) * 0.9, cy + (y - cy) * 0.9 - 0, cx + (x - cx) * 0.58, cy + (y - cy) * 0.58, C.dust, 2);
  });
  disc(ctx, cx, cy, 24, C.iron, C.steel);
  text(ctx, 'C', cx, cy, { size: 22, color: C.text, weight: 700 });
  text(ctx, 'carbon dioxide', cx, 470, { size: 24, color: C.dust });
  if (t > 0.85) text(ctx, 'pulls cancel: net pull zero', cx, 505, { size: 18, color: C.dust });
}

/* ---- q4-dots: sixteen valence electrons, placed: bonds first, then lone pairs to fill the outer atoms, then the central atom still short borrows pairs ---- */
function lewisCount(ctx, w, h, t) {
  ground(ctx, w, h);
  const y = 345; const xs = [240, 480, 720]; const names = ['O', 'C', 'O'];
  const pool = Array.from({ length: 16 }, (_, i) => [330 + (i % 8) * 43, 110 + Math.floor(i / 8) * 40]);
  // Where each of the sixteen ends up at each step: 0-3 the two single bonds, 4-9 and 10-15 the lone pairs of each oxygen.
  const mids = [(xs[0] + xs[1]) / 2, (xs[2] + xs[1]) / 2];
  // A bond's pair sits mid-way; in a double bond the first pair gives way to the oxygen's pair, which arrives from the oxygen's side.
  const bondSlot = (k, i, second) => {
    const toC = k === 0 ? 1 : -1;
    const off = second ? -toC * 10 : toC * 10;
    return [mids[k] + off, y + (i ? 7 : -7)];
  };
  const lone = (k, j) => {
    const ox = xs[k]; const s = k === 0 ? -1 : 1;
    const slots = [[ox - 7, y - 70], [ox + 7, y - 70], [ox - 7, y + 70], [ox + 7, y + 70], [ox + s * 70, y - 7], [ox + s * 70, y + 7]];
    return slots[j];
  };
  const dots = pool.map((p, i) => {
    let pos = p; let col = C.pale;
    const appear = win(t, 0.02 + i * 0.008, 0.1 + i * 0.008);
    const p3 = ease(win(t, 0.78, 0.9));
    if (i < 4) {
      const k = i < 2 ? 0 : 1;
      const p1 = ease(win(t, 0.27 + i * 0.03, 0.4 + i * 0.03));
      pos = move(pool[i], [mids[k], y + (i % 2 ? 7 : -7)], p1);
      pos = move(pos, bondSlot(k, i % 2, false), p3);
      if (p1 > 0.5) col = C.amber;
    } else {
      const k = i < 10 ? 0 : 2; const j = i < 10 ? i - 4 : i - 10;
      const p2 = ease(win(t, 0.5 + j * 0.025, 0.62 + j * 0.025));
      pos = move(pool[i], lone(k, j), p2);
      if (j >= 4) {
        // The outer pair of each oxygen becomes the second pair of the bond it shares with carbon.
        pos = move(pos, bondSlot(k === 0 ? 0 : 1, j - 4, true), p3);
        if (p3 > 0.5) col = C.amber;
      }
    }
    return { pos, col, appear };
  });
  xs.forEach((x, k) => atomRing(ctx, x, y, 40, names[k], C.steel, 2));
  dots.forEach(d => { ctx.globalAlpha = d.appear; dot(ctx, d.pos, d.col); ctx.globalAlpha = 1; });
  if (t < 0.26) text(ctx, 'valence electrons: C 4 + O 6 + O 6 = 16', w / 2, 190, { size: 24, color: C.text });
  else if (t < 0.48) text(ctx, 'bonds first: 4 electrons, 12 left', w / 2, 190, { size: 24, color: C.text });
  else if (t < 0.74) text(ctx, 'lone pairs on the oxygens: all 12 used', w / 2, 190, { size: 24, color: C.text });
  else text(ctx, 'carbon has only 4: each oxygen shares a pair', w / 2, 190, { size: 24, color: C.text });
  // How many electrons surround each atom: its lone electrons plus both electrons of every bond it is in.
  const stage = t > 0.9 ? 3 : t > 0.68 ? 2 : t > 0.4 ? 1 : 0;
  if (stage > 0) {
    const counts = stage === 1 ? [2, 4, 2] : stage === 2 ? [8, 4, 8] : [8, 8, 8];
    xs.forEach((x, k) => {
      const done = counts[k] === 8;
      text(ctx, `${counts[k]} of 8`, x, y + 118, { size: 26, color: done ? C.amber : C.dim, weight: done ? 700 : 400 });
    });
  }
  if (t > 0.92) text(ctx, 'O = C = O', w / 2, 480, { size: 34, color: C.amber, weight: 700 });
}

/* ---- q5-resonance: two drawings each predict one short and one long bond; the measured molecule has two bonds of one in-between length ---- */
function resonanceHybrid(ctx, w, h, t) {
  ground(ctx, w, h);
  const cx = 480; const cy = 150; const k = 1.5;
  const L = (pm) => pm * k;
  const swap = ease(win(t, 0.3, 0.5));
  const hyb = ease(win(t, 0.55, 0.76));
  // Bond lengths in pm and bond orders for the left and right bond, through the three steps.
  const lenL = lerp(lerp(121, 148, swap), 128, hyb);
  const lenR = lerp(lerp(148, 121, swap), 128, hyb);
  const ordL = lerp(lerp(2, 1, swap), 1.5, hyb);
  const ordR = lerp(lerp(1, 2, swap), 1.5, hyb);
  const half = 58.5 * Math.PI / 180;
  const pos = (len, sgn) => [cx + sgn * L(len) * Math.sin(half), cy + L(len) * Math.cos(half)];
  const pl = pos(lenL, -1); const pr = pos(lenR, 1);
  const bondLine = (a, b, order, dashed) => {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = -Math.sin(ang) * 6; const ny = Math.cos(ang) * 6;
    const second = Math.max(0, Math.min(1, order - 1));
    line(ctx, a[0] + nx * second, a[1] + ny * second, b[0] + nx * second, b[1] + ny * second, C.text, 3);
    if (second > 0) {
      ctx.globalAlpha = second;
      line(ctx, a[0] - nx, a[1] - ny, b[0] - nx, b[1] - ny, C.text, 3, dashed ? [8, 6] : null);
      ctx.globalAlpha = 1;
    }
  };
  // The two drawings, faint, ghosted behind the measurement once it is made.
  const ghost = ease(win(t, 0.78, 0.9));
  if (ghost > 0) {
    ctx.globalAlpha = 0.28 * ghost;
    [[121, 148], [148, 121]].forEach(([a, b]) => {
      const ga = pos(a, -1); const gb = pos(b, 1);
      line(ctx, cx, cy, ga[0], ga[1], C.amber, 2);
      line(ctx, cx, cy, gb[0], gb[1], C.amber, 2);
      disc(ctx, ga[0], ga[1], 24, C.rust);
      disc(ctx, gb[0], gb[1], 24, C.rust);
    });
    ctx.globalAlpha = 1;
  }
  bondLine([cx, cy], pl, ordL, hyb > 0.5);
  bondLine([cx, cy], pr, ordR, hyb > 0.5);
  disc(ctx, cx, cy, 26, C.rust, C.steel);
  disc(ctx, pl[0], pl[1], 24, C.rust, C.steel);
  disc(ctx, pr[0], pr[1], 24, C.rust, C.steel);
  [[cx, cy], pl, pr].forEach(([x, y]) => text(ctx, 'O', x, y, { size: 20, color: C.text, weight: 700 }));
  // Formal charges on the drawn structures: one end carries the minus, and which end depends on the drawing; in the measured molecule each end carries half.
  const chL = lerp(lerp(0, 1, swap), 0.5, hyb);
  const chR = lerp(lerp(1, 0, swap), 0.5, hyb);
  const charge = (p, v) => { if (v > 0.05) text(ctx, v > 0.9 ? '−' : '½−', p[0], p[1] + 44, { size: 22, color: C.amber, weight: 700 }); };
  charge(pl, chL); charge(pr, chR);
  text(ctx, '+', cx, cy - 44, { size: 22, color: C.amber, weight: 700 });
  // The ruler: each bond's length printed under it.
  const row = 410;
  text(ctx, `${Math.round(lenL)} pm`, (cx + pl[0]) / 2 - 60, row, { size: 28, color: hyb > 0.5 ? C.amber : C.text, weight: 700 });
  text(ctx, `${Math.round(lenR)} pm`, (cx + pr[0]) / 2 + 60, row, { size: 28, color: hyb > 0.5 ? C.amber : C.text, weight: 700 });
  const cap = t < 0.28 ? 'one drawing: one short bond, one long' : t < 0.52 ? 'the other drawing: the same, reversed' : t < 0.78 ? 'measured: both bonds the same length' : 'between the two drawings';
  text(ctx, cap, w / 2, 470, { size: 24, color: hyb > 0.5 ? C.amber : C.dust });
  text(ctx, 'O=O 121 pm   O–O 148 pm', w / 2, 505, { size: 18, color: C.dim });
}

/* ---- q6-shape: domains of electrons push as far apart as they can; a lone pair takes a place and squeezes the bonds ---- */
const TET = [[0, 0, 1], [0.9428, 0, -0.3333], [-0.4714, 0.8165, -0.3333], [-0.4714, -0.8165, -0.3333]];
function shapeVectors(P, Q) {
  // Ammonia: three bonds below a lone pair, 107 degrees apart. Water: two bonds, 104.5 degrees, and two lone pairs.
  const cosA = Math.cos(107 * Math.PI / 180);
  const ca = Math.sqrt((cosA + 0.5) / 1.5); const sa = Math.sqrt(1 - ca * ca);
  const nh3 = TET.map((v, i) => (i === 0 ? v : [sa * Math.cos((i - 1) * TAU / 3), sa * Math.sin((i - 1) * TAU / 3), -ca]));
  const c2 = Math.cos(104.5 * Math.PI / 180);
  const y2 = Math.sqrt(0.3333 * (1 - c2) / (1 + c2));
  const h2o = [TET[0], TET[1], norm([-0.4714, y2, -0.3333]), norm([-0.4714, -y2, -0.3333])];
  return TET.map((v, i) => norm(mix3(mix3(v, nh3[i], P), h2o[i], Q)));
}
function domainShapes(ctx, w, h, t, clock = 0) {
  ground(ctx, w, h);
  const P = ease(win(t, 0.28, 0.42)); const Q = ease(win(t, 0.58, 0.72));
  const V = shapeVectors(P, Q);
  const yaw = 0.5 + t * 2.4 + clock * 0.3; const tilt = 0.4;
  const cx = 400; const cy = 285; const K = 150;
  // Lone-pair weight of each domain: 0 is a bonded atom, 1 is a lone pair.
  const lone = [P, Q, 0, 0];
  const parts = [];
  V.forEach((v, i) => {
    const ball = project(v, yaw, tilt, cx, cy, K);
    parts.push({ depth: ball[2], draw: () => {
      const tip = ball;
      const base = project([0, 0, 0], yaw, tilt, cx, cy, K);
      if (lone[i] < 0.98) {
        ctx.globalAlpha = 1 - lone[i];
        line(ctx, base[0], base[1], tip[0], tip[1], C.steel, 5);
        disc(ctx, tip[0], tip[1], 20 * tip[3], C.pale, C.steel);
        text(ctx, 'H', tip[0], tip[1], { size: 16 * tip[3], color: '#16140f', weight: 700 });
        ctx.globalAlpha = 1;
      }
      if (lone[i] > 0.02) {
        // A lone pair is a lobe of charge standing out from the central atom, bigger than a bond and not ending in an atom.
        const mid = project(v, yaw, tilt, cx, cy, K * 0.55);
        const ang = Math.atan2(tip[1] - base[1], tip[0] - base[0]);
        const len = Math.hypot(tip[0] - base[0], tip[1] - base[1]);
        ctx.save();
        ctx.globalAlpha = 0.85 * lone[i];
        ctx.translate(mid[0], mid[1]);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(34, len * 0.45), 36 * mid[3], 0, 0, TAU);
        ctx.fillStyle = 'rgba(229,155,36,0.3)';
        ctx.fill();
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    } });
  });
  const c = project([0, 0, 0], yaw, tilt, cx, cy, K);
  parts.push({ depth: 0, draw: () => {
    disc(ctx, c[0], c[1], 32, C.dust, C.steel);
    text(ctx, Q > 0.5 ? 'O' : P > 0.5 ? 'N' : 'C', c[0], c[1], { size: 26, color: '#16140f', weight: 700 });
  } });
  parts.sort((a, b) => a.depth - b.depth).forEach(p => p.draw());
  // The angle is measured from the two arms that stay bonded in every shape.
  const dotp = V[2][0] * V[3][0] + V[2][1] * V[3][1] + V[2][2] * V[3][2];
  const ang = Math.acos(Math.max(-1, Math.min(1, dotp))) * 180 / Math.PI;
  const lones = Math.round(P + Q);
  text(ctx, `${ang.toFixed(1)}°`, 790, 250, { size: 56, color: C.amber, weight: 700 });
  text(ctx, 'bond angle', 790, 296, { size: 20, color: C.dust });
  text(ctx, `${4} domains`, 790, 190, { size: 26, color: C.text });
  text(ctx, `${4 - lones} bonds, ${lones} lone pair${lones === 1 ? '' : 's'}`, 790, 222, { size: 20, color: C.dust });
  text(ctx, Q > 0.5 ? 'bent' : P > 0.5 ? 'trigonal pyramidal' : 'tetrahedral', 790, 340, { size: 24, color: C.text });
}

/* ---- q8-hybrid: an s and three p orbitals mix into four equal lobes; a double bond is a sigma on the axis plus a pi that a twist destroys ---- */
function lobe(ctx, x0, y0, x1, y1, wid, fill, stroke) {
  const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
  const len = Math.hypot(x1 - x0, y1 - y0);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(Math.atan2(y1 - y0, x1 - x0));
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(2, len / 2), Math.max(2, wid), 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
function hybridMix(ctx, w, h, t, clock = 0) {
  ground(ctx, w, h);
  if (t < 0.52) {
    const m = ease(win(t, 0.26, 0.46));
    const yaw = 0.7 + t * 1.6 + clock * 0.25; const tilt = 0.35;
    const cx = 480; const cy = 270; const K = 110;
    const o = project([0, 0, 0], yaw, tilt, cx, cy, K);
    const items = [];
    // The starting set: an s sphere and p lobes along x, y and z; they fade as the mixed set takes over.
    const p = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    p.forEach((d, i) => {
      const tip = project(d, yaw, tilt, cx, cy, K * 1.15);
      items.push({ depth: tip[2], draw: () => { ctx.globalAlpha = (1 - m); lobe(ctx, o[0], o[1], tip[0], tip[1], 26 * tip[3], i % 2 ? 'rgba(140,131,118,0.35)' : 'rgba(229,155,36,0.35)', i % 2 ? C.steel : C.amber); ctx.globalAlpha = 1; } });
    });
    items.push({ depth: -2, draw: () => { ctx.globalAlpha = 0.6 * (1 - m); disc(ctx, o[0], o[1], 34, 'rgba(207,200,184,0.35)', C.pale); ctx.globalAlpha = 1; } });
    // The mixed set: four equal lobes pointing to the corners of a tetrahedron, each with a small tail behind the nucleus.
    TET.forEach(d => {
      const tip = project(d, yaw, tilt, cx, cy, K * 1.5);
      const back = project(d.map(v => -v * 0.35), yaw, tilt, cx, cy, K * 0.6);
      items.push({ depth: tip[2], draw: () => {
        ctx.globalAlpha = m;
        lobe(ctx, o[0], o[1], tip[0], tip[1], 30 * tip[3], 'rgba(229,155,36,0.4)', C.amber);
        lobe(ctx, o[0], o[1], back[0], back[1], 9, 'rgba(140,131,118,0.4)', C.steel);
        ctx.globalAlpha = 1;
      } });
    });
    items.sort((a, b) => a.depth - b.depth).forEach(i => i.draw());
    disc(ctx, o[0], o[1], 9, C.dust);
    text(ctx, m < 0.5 ? '1 s + 3 p' : '4 sp³', cx, 70, { size: 34, color: m < 0.5 ? C.text : C.amber, weight: 700 });
    text(ctx, m < 0.5 ? 'four different orbitals' : 'four equal orbitals, 109.5° apart', cx, 480, { size: 24, color: C.dust });
  } else {
    // A double bond, side on: a sigma overlap on the axis, and a pi overlap above and below it.
    const twist = ease(win(t, 0.78, 0.92));
    const y = 270; const xa = 400; const xb = 400 + 124;
    const pi = ease(win(t, 0.56, 0.7));
    const rx = 66; const ry = 88;
    // Sigma: head-on lobes along the axis meeting between the nuclei.
    ctx.globalAlpha = 0.9;
    lobe(ctx, xa, y, xa + 150, y, 26, 'rgba(229,155,36,0.35)', C.amber);
    lobe(ctx, xb, y, xb - 150, y, 26, 'rgba(229,155,36,0.35)', C.amber);
    ctx.globalAlpha = 1;
    const c = Math.cos(twist * Math.PI / 2);
    // Pi: p lobes stand above and below each nucleus. The right-hand pair turns about the axis with the twist.
    [-1, 1].forEach(sg => {
      ctx.globalAlpha = pi;
      ctx.beginPath(); ctx.ellipse(xa, y + sg * ry * 0.95, rx * 0.62, ry * 0.9, 0, 0, TAU);
      ctx.fillStyle = 'rgba(207,200,184,0.3)'; ctx.fill(); ctx.strokeStyle = C.pale; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(xb, y + sg * ry * 0.95 * c, rx * 0.62, Math.max(8, ry * 0.9 * c), 0, 0, TAU);
      ctx.fillStyle = 'rgba(207,200,184,0.3)'; ctx.fill(); ctx.strokeStyle = C.pale; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = 1;
    });
    disc(ctx, xa, y, 22, C.dust, C.steel); disc(ctx, xb, y, 22, C.dust, C.steel);
    text(ctx, 'C', xa, y, { size: 20, color: '#16140f', weight: 700 }); text(ctx, 'C', xb, y, { size: 20, color: '#16140f', weight: 700 });
    if (pi > 0.8) {
      text(ctx, 'σ on the axis', (xa + xb) / 2 + 2, y + 62, { size: 20, color: C.amber });
      text(ctx, 'π above and below', (xa + xb) / 2, y - ry * 1.9, { size: 20, color: C.pale });
    }
    // The pi overlap is the overlap of the drawn lobes: full when they stand parallel, nothing when one pair is turned a quarter round.
    const bar = c;
    ctx.fillStyle = C.rim; ctx.fillRect(700, 230, 160, 18);
    ctx.fillStyle = C.pale; ctx.fillRect(700, 230, 160 * bar, 18);
    text(ctx, 'π overlap', 780, 210, { size: 20, color: C.dust });
    text(ctx, `${Math.round(bar * 100)} %`, 780, 272, { size: 26, color: bar < 0.1 ? C.amber : C.text, weight: 700 });
    if (twist > 0) text(ctx, twist > 0.95 ? 'turned 90°: π gone, σ unchanged' : 'turning one end', w / 2, 480, { size: 22, color: C.dust });
  }
}

export const LIGAR_MECHANISMS = {
  'bond-pairs': bondPairs,
  'well-depth': wellDepth,
  'field-swing': fieldSwing,
  'lewis-count': lewisCount,
  'resonance-hybrid': resonanceHybrid,
  'domain-shapes': domainShapes,
  'hybrid-mix': hybridMix
};
