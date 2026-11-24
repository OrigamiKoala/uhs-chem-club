/**
 * cutscene/intro.js — the campaign's opening cutscene, over Vess's four opening lines (`CAMPAIGN_STORY`).
 *   1. The Avalon crosses the dark; then Vess, a silhouette in the comms bay window.
 *   2. Three things that have been turning up on the rim: metal in the salt, a tank that stays hot in the frost, a foundry
 *      that ships more iron than it took in ore. A hooded figure of the Fifth stands over them.
 *   3. A Fifth Guild engineer welds outpost machinery into a towering automated guardian; it stands up to block the hidden
 *      rig while a survey hand scans its chemical seams.
 *   4. The rim on the star map, and the Avalon's route lighting the worlds one by one.
 */

import {
  C, W, H, TAU, win, span, lerp, clamp01, alpha, rng, sky, stars, nebula, ridge, hauler, vessWindow, frame, block,
  heatLines, person, fifthMark, brackets, scan, shake, held, setLight
} from './kit.js';
import { light, cone, pool, halo } from './shot.js';

const B1 = 6.4;
const B2 = 7.6;
const B3 = 8.0;
const B4 = 6.4;

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
  const p = span(T, 0.6, B4 - 1.2) * (RIM.length - 1);
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

/** Draw an articulated industrial leg/arm segment from (x0, y0) through knee (mx, my) to (x1, y1). */
function strut(ctx, x0, y0, mx, my, x1, y1, w, color, rim) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(mx, my);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(1.5, w * 0.22);
  ctx.beginPath();
  ctx.moveTo(x0 - 1, y0 - 2);
  ctx.lineTo(mx - 1, my - 2);
  ctx.lineTo(x1 - 1, y1 - 2);
  ctx.stroke();
  // Riveted hinge pin at the joint.
  ctx.fillStyle = '#1b1815';
  ctx.beginPath();
  ctx.arc(mx, my, Math.max(2, w * 0.52), 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8d8579';
  ctx.beginPath();
  ctx.arc(mx, my, Math.max(1, w * 0.24), 0, TAU);
  ctx.fill();
}

/**
 * Beat 3: The Fifth Guild welds outpost machinery into an automated guardian.
 *   0.0 - 2.6 s: Hooded figure welds a dormant industrial hopper/furnace rig; sparks shower.
 *   2.6 - 5.2 s: The guardian stands up on jointed legs, flares its amber filament lens, stamps its guard stance.
 *   5.2 - 8.0 s: A survey hand approaches and scans the guardian's chemical/pressure seams.
 */
function guardiansShot(ctx, lt, clock) {
  const gy = 568;
  const rise = span(lt, 2.3, 4.6);
  const wake = span(lt, 3.3, 4.8);
  const stepThud = held(lt, 4.35, 4.85, 0.14);
  const [sx, sy] = shake(clock, stepThud * 0.7);

  setLight({ x: 840, y: 240, color: '229, 174, 110', power: 0.42 + wake * 0.22 });

  ctx.save();
  ctx.translate(sx, sy);

  // Dark industrial rim sky + distant ridges.
  sky(ctx, [[0, '#07070b'], [0.55, '#12100e'], [1, '#1c1713']]);
  stars(ctx, 19, 110, clock, gy * 0.65, 0);
  ridge(ctx, { y: gy - 120, amp: 54, seed: 31, color: '#14120f', top: '#241f1a', rim: 0.25, jag: 0.25 });
  ridge(ctx, { y: gy - 55, amp: 32, seed: 57, color: '#1b1814', top: '#2b251e', rim: 0.2, jag: 0.15 });

  // Outpost yard ground and riveted bulkhead gantry in the background.
  const gnd = ctx.createLinearGradient(0, gy, 0, H);
  gnd.addColorStop(0, '#231f1a');
  gnd.addColorStop(1, '#0e0c0a');
  ctx.fillStyle = gnd;
  ctx.fillRect(0, gy, W, H - gy);
  ctx.fillStyle = 'rgba(214, 196, 168, 0.14)';
  ctx.fillRect(0, gy, W, 2);

  // Distant station silos and gantry frame on the right.
  ctx.fillStyle = '#161411';
  ctx.fillRect(920, gy - 260, 74, 260);
  ctx.fillRect(1015, gy - 210, 58, 210);
  ctx.strokeStyle = '#26221d';
  ctx.lineWidth = 4;
  ctx.strokeRect(860, gy - 290, 260, 290);
  ctx.beginPath();
  ctx.moveTo(860, gy - 290); ctx.lineTo(1120, gy - 140);
  ctx.moveTo(1120, gy - 290); ctx.lineTo(860, gy - 140);
  ctx.stroke();

  // Hidden Fifth Guild extraction rig / sealed drum stack behind the guardian (what it protects).
  const rigX = 965;
  ctx.fillStyle = '#2c2722';
  ctx.fillRect(rigX - 58, gy - 118, 116, 118);
  ctx.strokeStyle = '#4a433b';
  ctx.lineWidth = 2;
  ctx.strokeRect(rigX - 58, gy - 118, 116, 118);
  // Glowing amber intake pipes on the hidden rig.
  ctx.fillStyle = `rgba(229, 155, 36, ${0.45 + 0.18 * Math.sin(clock * 3.1)})`;
  ctx.fillRect(rigX - 42, gy - 96, 84, 8);
  ctx.fillRect(rigX - 42, gy - 68, 84, 6);
  fifthMark(ctx, rigX, gy - 36, 14, C.rust, 2.5);
  heatLines(ctx, rigX, gy - 122, 70, 56, clock, 0.24);

  // Scattered outpost scrap / salt crates on the ground.
  block(ctx, 520, gy, 24, '#5a534a', '#24201c', '#3d3730');
  block(ctx, 548, gy, 18, '#4e4840', '#1f1c18', '#332e28');
  block(ctx, 882, gy, 26, '#625a50', '#26221e', '#413b33');

  // --- THE GUARDIAN MACHINE (centered around gx, rising from dormant to towering guard stance) ---
  const gx = 740;
  const bodyY = lerp(gy - 86, gy - 216, rise) + Math.sin(clock * 2.2) * 3 * wake;
  const tilt = lerp(0.14, 0, rise);

  // Ground shadow under the guardian.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(gx, gy + 4, lerp(110, 145, rise), 14, 0, 0, TAU);
  ctx.fill();

  // Far mechanical legs (mantis/hopper style).
  const farHipL = [gx - 42, bodyY + 34];
  const farHipR = [gx + 46, bodyY + 34];
  strut(ctx, farHipL[0], farHipL[1], gx - lerp(96, 128, rise), lerp(gy - 42, gy - 118, rise), gx - lerp(112, 134, rise), gy, 11, '#26221d', '#443e37');
  strut(ctx, farHipR[0], farHipR[1], gx + lerp(98, 130, rise), lerp(gy - 40, gy - 116, rise), gx + lerp(118, 136, rise), gy, 11, '#26221d', '#443e37');

  // Rear articulated clamp arm (swings outward as it wakes).
  const armOpen = span(lt, 3.0, 4.9);
  strut(
    ctx,
    gx + 54, bodyY - 12,
    gx + lerp(86, 138, armOpen), bodyY + lerp(28, -32, armOpen),
    gx + lerp(104, 178, armOpen), bodyY + lerp(62, 18, armOpen),
    12, '#2d2823', '#544d44'
  );

  // Main riveted industrial hopper/furnace torso.
  ctx.save();
  ctx.translate(gx, bodyY);
  ctx.rotate(tilt);

  const hull = ctx.createLinearGradient(-72, -74, 72, 66);
  hull.addColorStop(0, '#6a6257');
  hull.addColorStop(0.45, '#3b3630');
  hull.addColorStop(1, '#1b1815');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(-64, -68);
  ctx.lineTo(64, -68);
  ctx.lineTo(78, -14);
  ctx.lineTo(54, 56);
  ctx.lineTo(-54, 56);
  ctx.lineTo(-78, -14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(214, 196, 168, 0.24)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Industrial exhaust stacks & pressure tank welded onto its shoulders.
  ctx.fillStyle = '#2d2924';
  ctx.fillRect(-52, -98, 18, 32);
  ctx.fillRect(34, -94, 16, 28);
  ctx.fillStyle = '#4a433a';
  ctx.fillRect(-26, -86, 52, 18);

  // Glowing chemical/thermal pressure seams along its casing (what the survey hand scans).
  const seamA = 0.18 + wake * (0.62 + 0.16 * Math.sin(clock * 4.5));
  ctx.fillStyle = `rgba(229, 155, 36, ${clamp01(seamA)})`;
  ctx.fillRect(-52, -4, 104, 5);
  ctx.fillRect(-38, 22, 76, 4);

  // Sensor head / filament eye iris.
  ctx.fillStyle = '#181512';
  ctx.fillRect(-34, -52, 68, 32);
  ctx.strokeStyle = '#5e564c';
  ctx.lineWidth = 2;
  ctx.strokeRect(-34, -52, 68, 32);
  const eyeR = 11;
  ctx.fillStyle = wake > 0.05 ? `rgba(229, 155, 36, ${clamp01(0.25 + wake * 0.75)})` : '#2a241e';
  ctx.beginPath();
  ctx.arc(-8, -36, eyeR, 0, TAU);
  ctx.fill();
  if (wake > 0.2) {
    ctx.fillStyle = `rgba(255, 240, 200, ${clamp01(wake * 0.9)})`;
    ctx.beginPath();
    ctx.arc(-8, -36, eyeR * 0.42, 0, TAU);
    ctx.fill();
  }

  // The Fifth's triangle mark stamped onto the guardian's chest plate.
  alpha(ctx, clamp01(0.35 + win(lt, 1.4, 2.2) * 0.65), () => fifthMark(ctx, 22, 34, 14, C.rust, 2.5));
  ctx.restore();

  // Near mechanical legs (foreground, heavier).
  const nearHipL = [gx - 34, bodyY + 42];
  const nearHipR = [gx + 34, bodyY + 42];
  strut(ctx, nearHipL[0], nearHipL[1], gx - lerp(74, 92, rise), lerp(gy - 36, gy - 104, rise), gx - lerp(82, 98, rise), gy, 14, '#3a352f', '#736b60');
  strut(ctx, nearHipR[0], nearHipR[1], gx + lerp(72, 90, rise), lerp(gy - 34, gy - 102, rise), gx + lerp(80, 96, rise), gy, 14, '#3a352f', '#736b60');

  // Near articulated saw/clamp arm (facing left toward approaching survey hand).
  const clawX = gx - lerp(96, 174, armOpen);
  const clawY = bodyY + lerp(58, 10, armOpen);
  strut(
    ctx,
    gx - 56, bodyY - 8,
    gx - lerp(84, 134, armOpen), bodyY + lerp(24, -24, armOpen),
    clawX, clawY,
    14, '#433d36', '#7b7266'
  );
  // Twin industrial pincer jaws at the arm tip.
  ctx.strokeStyle = '#6c6459';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(clawX, clawY); ctx.lineTo(clawX - 24, clawY - 14);
  ctx.moveTo(clawX, clawY); ctx.lineTo(clawX - 24, clawY + 14);
  ctx.stroke();

  // --- HOODED FIFTH ENGINEER (welds the guardian 0..2.4s, then steps back into shadow) ---
  const weldOn = lt < 2.35;
  const retreat = span(lt, 2.5, 4.4);
  const hx = lerp(590, 910, retreat);
  const hoodAlpha = 1 - win(lt, 3.8, 4.5);
  if (hoodAlpha > 0.01) {
    alpha(ctx, hoodAlpha, () => {
      const h = person(ctx, hx, gy, 0.72, {
        kind: 'hood',
        pose: weldOn ? 'point' : 'walk',
        phase: lt * 7,
        f: 1,
        clock,
        crouch: weldOn ? 0.35 : 0
      });
      if (weldOn) {
        // Welding arc flash and flying sparks at the guardian's knee joint.
        const wx = h.hand[0] + 22;
        const wy = h.hand[1] - 6;
        const flicker = 0.65 + 0.35 * Math.sin(clock * 46);
        light(ctx, () => {
          halo(ctx, wx, wy, 48 * flicker, '255, 224, 160', 0.65);
          halo(ctx, wx, wy, 14, '255, 252, 240', 0.95);
        });
        const sr = rng(Math.floor(lt * 12) + 7);
        ctx.strokeStyle = 'rgba(255, 210, 120, 0.85)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const ang = -Math.PI * 0.9 + sr() * Math.PI * 1.3;
          const dist = 12 + sr() * 54;
          ctx.beginPath();
          ctx.moveTo(wx + Math.cos(ang) * dist * 0.35, wy + Math.sin(ang) * dist * 0.35);
          ctx.lineTo(wx + Math.cos(ang) * dist, wy + Math.sin(ang) * dist + 14);
          ctx.stroke();
        }
      }
    });
  }

  // --- SURVEY HAND (approaches from the left 4.2..6.0s and scans the guardian's chemical seams) ---
  const handIn = span(lt, 4.2, 6.0);
  if (lt > 4.1) {
    const px = lerp(120, 360, handIn);
    const scanning = lt > 5.7;
    const who = person(ctx, px, gy, 0.78, {
      kind: 'hand',
      pose: lt < 5.9 ? 'walk' : 'point',
      phase: lt * 7.2,
      f: 1,
      clock,
      lamp: true
    });
    if (scanning) {
      const scanP = win(lt, 5.7, 6.3);
      scan(ctx, who.hand[0] + 6, who.hand[1], gx - 4, bodyY + 12, 130, scanP, clock);
      brackets(ctx, gx, bodyY + 8, 176, 136, win(lt, 6.0, 6.8), C.amber);
    }
  }

  // Guardian's amber searchlight cone sweeping across the yard once awake.
  if (wake > 0.15) {
    const eyeX = gx - 8;
    const eyeY = bodyY - 36;
    const sweepAng = Math.PI - 0.34 + Math.sin(clock * 1.1) * 0.12;
    light(ctx, () => {
      cone(ctx, eyeX, eyeY, sweepAng, 0.18, 480, '229, 155, 36', 0.24 * wake);
      halo(ctx, eyeX, eyeY, 42 * wake, '229, 155, 36', 0.42 * wake);
      pool(ctx, gx - 260, gy, 150, '229, 155, 36', 0.2 * wake);
    });
  }

  ctx.restore();
}

export function introScene(lines) {
  const t2 = B1;
  const t3 = B1 + B2;
  const t4 = t3 + B3;
  const end = t4 + B4;
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
    if (T < t4) {
      // 3. The Fifth Guild's automated guardians.
      const lt = T - t3;
      guardiansShot(ctx, lt, clock);
      frame(ctx, 1 - win(lt, 0, 0.45), clock);
      return;
    }
    // 4. The rim on the star map.
    const lt = T - t4;
    starMap(ctx, lt, clock);
    frame(ctx, 1 - win(lt, 0, 0.5), clock);
  };
  return {
    id: 'intro',
    beats: [
      { dur: B1, say: lines[0] },
      { dur: B2, say: lines[1] },
      { dur: B3, say: lines[2] },
      { dur: B4, say: lines[3] }
    ],
    duration: end,
    paint
  };
}

export { held };
