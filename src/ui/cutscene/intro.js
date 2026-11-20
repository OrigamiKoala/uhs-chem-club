/**
 * cutscene/intro.js — the campaign's opening cutscene, over Vess's three opening lines (`CAMPAIGN_STORY`).
 *   1. The Avalon crosses the dark; then Vess, a silhouette in the comms bay window.
 *   2. Three things that have been turning up on the rim: metal in the salt, a tank that stays hot in the frost, a foundry
 *      that ships more iron than it took in ore. A hooded figure of the Fifth stands over them.
 *   3. The rim on the star map, and the Avalon's route lighting the worlds one by one.
 */

import {
  C, W, H, TAU, win, span, lerp, alpha, rng, sky, stars, nebula, hauler, vessWindow, frame, block, heatLines, person, fifthMark, held
} from './kit.js';

const B1 = 6.4;
const B2 = 7.6;
const B3 = 6.4;

function space(ctx, T, clock) {
  sky(ctx, [[0, '#040408'], [0.6, '#0a0a10'], [1, '#14110e']]);
  nebula(ctx, 9, '130, 104, 120', 0.09, T * 12);
  stars(ctx, 5, 260, clock, H, T * 30);
}

function panel(ctx, x, y, pw, ph, a, draw) {
  if (a <= 0.01) return;
  alpha(ctx, a, () => {
    ctx.save();
    ctx.translate(x, y + (1 - a) * 30);
    ctx.fillStyle = '#100e0c';
    ctx.fillRect(0, 0, pw, ph);
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();
    draw(pw, ph);
    ctx.restore();
    ctx.strokeStyle = C.rim;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + (1 - a) * 30, pw, ph);
  });
}

function saltPanel(ctx, pw, ph, clock) {
  ctx.fillStyle = '#2a2420';
  ctx.fillRect(0, ph * 0.7, pw, ph);
  const r = rng(31);
  for (let i = 0; i < 40; i++) {
    const bx = 30 + r() * (pw - 60);
    const by = ph * 0.72 - Math.sin(((bx - 30) / (pw - 60)) * Math.PI) * 60 + r() * 8;
    block(ctx, bx, by, 12 + r() * 6, '#ece6d8', '#a69e90', '#cfc8b8');
  }
  block(ctx, pw * 0.52, ph * 0.5, 22, '#8a8274', '#2a2622', '#4a453e');
  ctx.fillStyle = `rgba(255, 250, 240, ${0.4 + 0.3 * Math.sin(clock * 2)})`;
  ctx.fillRect(pw * 0.52 - 8, ph * 0.5 - 26, 10, 2);
}

function tankPanel(ctx, pw, ph, clock) {
  ctx.fillStyle = '#3a3e44';
  ctx.fillRect(0, 0, pw, ph);
  const r = rng(41);
  ctx.fillStyle = 'rgba(236, 240, 244, 0.5)';
  for (let i = 0; i < 140; i++) ctx.fillRect(r() * pw, r() * ph, 2, 2);
  ctx.fillStyle = '#2a2622';
  ctx.fillRect(0, ph * 0.75, pw, ph);
  const g = ctx.createLinearGradient(pw / 2 - 30, 0, pw / 2 + 30, 0);
  g.addColorStop(0, '#9a8a74');
  g.addColorStop(1, '#3a3128');
  ctx.fillStyle = g;
  ctx.fillRect(pw / 2 - 28, ph * 0.3, 56, ph * 0.45);
  heatLines(ctx, pw / 2, ph * 0.3, 60, 70, clock, 0.45);
}

function foundryPanel(ctx, pw, ph) {
  ctx.fillStyle = '#1d1916';
  ctx.fillRect(0, 0, pw, ph);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 34px Quantico, monospace';
  ctx.fillStyle = C.dust;
  ctx.fillText('40 t', pw * 0.28, ph * 0.45);
  ctx.fillStyle = C.danger;
  ctx.fillText('50 t', pw * 0.74, ph * 0.45);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pw * 0.42, ph * 0.45); ctx.lineTo(pw * 0.58, ph * 0.45);
  ctx.moveTo(pw * 0.55, ph * 0.4); ctx.lineTo(pw * 0.58, ph * 0.45); ctx.lineTo(pw * 0.55, ph * 0.5);
  ctx.stroke();
  for (let i = 0; i < 8; i++) block(ctx, pw * 0.6 + (i % 4) * 26, ph * 0.85 - Math.floor(i / 4) * 14, 22, '#d9d0bd', '#5b554c', '#8d8579');
  const r = rng(51);
  for (let i = 0; i < 8; i++) block(ctx, pw * 0.15 + r() * pw * 0.25, ph * 0.86, 14 + r() * 8, '#5a4a3a', '#2a2018', '#4a3a2c');
}

const RIM = [[200, 470], [300, 390], [410, 330], [530, 290], [650, 275], [770, 285], [880, 320], [980, 370], [1070, 440]];

function starMap(ctx, T, clock) {
  space(ctx, 0, clock);
  ctx.strokeStyle = 'rgba(107, 98, 90, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  RIM.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.setLineDash([]);
  const p = span(T, 0.6, B3 - 1.2) * (RIM.length - 1);
  // The lit route so far.
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(RIM[0][0], RIM[0][1]);
  const k = Math.floor(p);
  for (let i = 1; i <= k; i++) ctx.lineTo(RIM[i][0], RIM[i][1]);
  const head = k < RIM.length - 1 ? [lerp(RIM[k][0], RIM[k + 1][0], p - k), lerp(RIM[k][1], RIM[k + 1][1], p - k)] : RIM[RIM.length - 1];
  ctx.lineTo(head[0], head[1]);
  ctx.stroke();
  RIM.forEach(([x, y], i) => {
    const lit = i <= p;
    const r = 12 + (i % 3) * 4;
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, lit ? '#b8afa0' : '#544e46');
    g.addColorStop(1, '#15130f');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (lit) { ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 6, 0, TAU); ctx.stroke(); }
  });
  // The Avalon at the head of the route.
  ctx.save();
  ctx.translate(head[0], head[1] - 26);
  hauler(ctx, 0, 0, 0.09, clock);
  ctx.restore();
  // The mark of the Fifth, faint, at the far edge of the rim, where the trail leads.
  alpha(ctx, 0.25 + 0.15 * Math.sin(clock * 1.5), () => fifthMark(ctx, 1150, 250, 30, C.rust, 3));
}

export function introScene(lines) {
  const t2 = B1;
  const t3 = B1 + B2;
  const end = t3 + B3;
  const paint = (ctx, T, clock) => {
    if (T < t2) {
      // 1. The hauler crosses, then the comms bay window.
      const cut = win(T, 3.0, 3.6);
      if (cut < 1) {
        space(ctx, T, clock);
        hauler(ctx, lerp(-420, 1700, T / 8), 360 + Math.sin(T * 0.6) * 6, 1.0, clock);
      }
      if (cut > 0) alpha(ctx, cut, () => {
        ctx.fillStyle = '#0c0b09';
        ctx.fillRect(0, 0, W, H);
        // Bulkhead plates round the window.
        ctx.fillStyle = '#15130f';
        for (let i = 0; i < 8; i++) ctx.fillRect(i * 160 + 2, H * 0.12, 156, H * 0.76);
        const zoom = lerp(1, 1.12, win(T, 3.0, B1));
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(zoom, zoom);
        vessWindow(ctx, -220, -150, 440, 300, clock);
        ctx.restore();
      });
      frame(ctx, 1 - win(T, 0, 0.8), clock);
      return;
    }
    if (T < t3) {
      // 2. What has been turning up on the rim.
      const lt = T - t2;
      sky(ctx, [[0, '#0a0908'], [1, '#14120f']]);
      const pw = 360;
      const ph = 300;
      const y = 190;
      panel(ctx, 60, y, pw, ph, win(lt, 0.4, 1.0), (a, b) => saltPanel(ctx, a, b, clock));
      panel(ctx, 460, y, pw, ph, win(lt, 1.8, 2.4), (a, b) => tankPanel(ctx, a, b, clock));
      panel(ctx, 860, y, pw, ph, win(lt, 3.2, 3.8), (a, b) => foundryPanel(ctx, a, b));
      // A hooded figure walks across in front of them and stops.
      const fx = lerp(1400, 640, span(lt, 4.4, 6.6));
      alpha(ctx, win(lt, 4.4, 4.8), () => person(ctx, fx, 640, 1.25, { kind: 'hood', pose: lt < 6.5 ? 'walk' : 'stand', phase: lt * 6, f: -1, clock }));
      frame(ctx, 1 - win(lt, 0, 0.4), clock);
      return;
    }
    // 3. The rim on the star map.
    const lt = T - t3;
    starMap(ctx, lt, clock);
    frame(ctx, 1 - win(lt, 0, 0.5), clock);
  };
  return {
    id: 'intro',
    beats: [{ dur: B1, say: lines[0] }, { dur: B2, say: lines[1] }, { dur: B3, say: lines[2] }],
    duration: end,
    paint
  };
}

export { held };
