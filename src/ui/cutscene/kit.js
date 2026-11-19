/**
 * cutscene/kit.js — the drawing kit behind the lore cutscenes (`cutscene/scenes-*.js`).
 *
 * The cutscenes are side-on, letterboxed 2D scenes on a 1280 x 720 canvas: skies and ridges in parallax, a lander, the
 * survey hand (the player), local crews, and the hooded figures of the Fifth. Everything is a pure function of the scene
 * time `T` (seconds), so the same `T` is the same frame: reduced motion shows a beat's last frame and loses nothing, and
 * `verify:story` can paint every scene on a stub context in Node. `clock` only drives ambient drift (dust, flicker).
 *
 * SCOURED PLATE: obsidian and titanium, one amber signal, hard edges, nothing blooms. A lamp beam is a flat wedge of low
 * alpha, never a glow.
 */

import { mulberry32 } from '../../learn/engine/plates.js';
import { C, clamp01, win, ease, lerp, alpha } from '../story-kit.js';

export { C, clamp01, win, ease, lerp, alpha };

export const W = 1280;
export const H = 720;
/** The letterbox bars, as a share of the height. The subtitles sit in the bottom one. */
export const BAR = 0.105;
export const TAU = Math.PI * 2;

/** `T` inside [a, b] as an eased 0..1. */
export const span = (T, a, b) => ease(win(T, a, b));
/** Up between a and b, fading in and out over `f`. */
export const held = (T, a, b, f = 0.3) => win(T, a, a + f) * (1 - win(T, b - f, b));

/** Seeded random numbers, so a scene never shimmers. */
export const rng = seed => mulberry32(seed >>> 0);

/** A vertical gradient sky. `stops` is a list of [offset, colour]. */
export function sky(ctx, stops, h = H) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, h);
}

/** Still stars with a faint, slow twinkle. */
export function stars(ctx, seed, n = 140, clock = 0, maxY = H * 0.7, drift = 0) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = ((r() * W - drift * (0.3 + r() * 0.7)) % W + W) % W;
    const y = r() * maxY;
    const s = r() < 0.08 ? 2 : 1.2;
    const tw = 0.55 + 0.45 * Math.sin(clock * (0.6 + r() * 1.4) + r() * TAU);
    ctx.fillStyle = `rgba(220, 214, 204, ${(0.18 + r() * 0.5) * tw})`;
    ctx.fillRect(x, y, s, s);
  }
}

/** A planet or moon low in the sky: a lit disc with a hard terminator. */
export function moon(ctx, x, y, r, lit = '#8f887b', dark = '#1d1b18') {
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, lit);
  g.addColorStop(0.55, dark);
  g.addColorStop(1, '#0c0b09');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/**
 * A silhouette ridge across the frame, from a seeded sum of sines. `camX` scrolls it by `par` (0 = fixed, 1 = with the
 * ground). `jag` adds sharp peaks (rock, ice); 0 is rolling.
 */
export function ridge(ctx, { y, amp, seed, color, camX = 0, par = 0.3, freq = 1, jag = 0, bottom = H }) {
  const r = rng(seed);
  const ph = [r() * TAU, r() * TAU, r() * TAU, r() * TAU];
  const off = camX * par;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, bottom);
  for (let x = 0; x <= W + 16; x += 16) {
    const u = (x + off) / W * freq;
    let v = Math.sin(u * 2.1 + ph[0]) * 0.5 + Math.sin(u * 4.7 + ph[1]) * 0.28 + Math.sin(u * 9.3 + ph[2]) * 0.14;
    if (jag) v += jag * (Math.abs(((u * 6 + ph[3]) % 2) - 1) - 0.5);
    ctx.lineTo(x, y - v * amp);
  }
  ctx.lineTo(W, bottom);
  ctx.closePath();
  ctx.fill();
}

/** Flat ground from `y` down, with a lit lip. */
export function ground(ctx, y, top = '#26221e', bot = '#100e0c', lip = 'rgba(214, 196, 168, 0.12)') {
  const g = ctx.createLinearGradient(0, y, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, y, W, H - y);
  ctx.fillStyle = lip;
  ctx.fillRect(0, y, W, 2);
}

/** A band of low haze. */
export function haze(ctx, y, hh, color = 'rgba(184, 175, 160, 0.08)') {
  const g = ctx.createLinearGradient(0, y - hh, 0, y + hh);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.5, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y - hh, W, hh * 2);
}

/** Dust or snow drifting across the frame. */
export function drift(ctx, seed, n, clock, { color = '220, 206, 176', a = 0.18, vx = 14, vy = 4, size = 2, y0 = 0, y1 = H } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const sp = 0.4 + r() * 0.9;
    const x = ((r() * W + clock * vx * sp) % W + W) % W;
    const y = y0 + (((r() * (y1 - y0) + clock * vy * sp) % (y1 - y0)) + (y1 - y0)) % (y1 - y0);
    ctx.fillStyle = `rgba(${color}, ${a * (0.4 + r() * 0.6)})`;
    ctx.fillRect(x, y, size * (0.6 + r() * 0.8), size * (0.6 + r() * 0.8));
  }
}

/** A soft contact shadow under something standing on the ground. */
export function shadow(ctx, x, y, rx, a = 0.45) {
  ctx.fillStyle = `rgba(0, 0, 0, ${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(1, rx), Math.max(1, rx * 0.18), 0, 0, TAU);
  ctx.fill();
}

/** A rod with round ends. */
function rodLine(ctx, x0, y0, x1, y1, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

/** A two-joint limb from (x, y): angles from straight down, positive toward `f` (facing). Returns the end point. */
function limb(ctx, x, y, a1, l1, a2, l2, width, color, f) {
  const kx = x + Math.sin(a1) * l1 * f;
  const ky = y + Math.cos(a1) * l1;
  const ex = kx + Math.sin(a1 + a2) * l2 * f;
  const ey = ky + Math.cos(a1 + a2) * l2;
  rodLine(ctx, x, y, kx, ky, width, color);
  rodLine(ctx, kx, ky, ex, ey, width * 0.9, color);
  return [ex, ey];
}

const KINDS = {
  // The survey hand: the player, in a titanium suit, helmet and pack.
  hand: { body: '#4a453e', limb: '#3c3833', rim: '#8f887b', head: '#5b554c', visor: '#cfc8b8' },
  // A hooded figure of the Fifth: a dark cloak, no face.
  hood: { body: '#191613', limb: '#15130f', rim: '#544e46', head: '#191613', visor: null },
  // A local crew hand in a work coat and cap.
  local: { body: '#5a4a3a', limb: '#3a3128', rim: '#9a8a74', head: '#6b5a48', visor: null },
  // A local who keeps a hood up against the weather; not of the Fifth.
  cloak: { body: '#4a4036', limb: '#2e2822', rim: '#8a7c68', head: '#4a4036', visor: null }
};

/**
 * A person standing on (x, y), `s` = 1 is 150 px tall.
 * pose: 'stand' | 'walk' | 'run' | 'wave' | 'beckon' | 'point' | 'crouch' | 'kneel'
 * phase: the gait's phase in radians (advance it with time to walk). f: 1 faces right, -1 left.
 */
export function person(ctx, x, y, s, { kind = 'hand', pose = 'stand', phase = 0, f = 1, lamp = false, clock = 0, crouch = 0 } = {}) {
  const k = KINDS[kind] || KINDS.hand;
  const Hh = 150 * s;
  const run = pose === 'run';
  const moving = pose === 'walk' || run;
  const amp = run ? 0.85 : moving ? 0.45 : 0;
  const low = clamp01(pose === 'crouch' || pose === 'kneel' ? 1 : crouch);
  const bob = moving ? Math.abs(Math.sin(phase)) * Hh * (run ? 0.035 : 0.018) : 0;
  const lean = run ? 0.22 : moving ? 0.06 : low * 0.35;
  const hipY = y - Hh * lerp(0.5, 0.3, low) - bob;
  const hipX = x;
  const torso = Hh * 0.34;
  const shX = hipX + Math.sin(lean) * torso * f;
  const shY = hipY - Math.cos(lean) * torso;
  const thigh = Hh * 0.26;
  const shin = Hh * 0.25;
  const legW = Hh * 0.075;

  shadow(ctx, x, y, Hh * 0.2, 0.4);

  // Legs: far leg first, darker.
  const swing = Math.sin(phase) * amp;
  const kneeA = (p) => (moving ? Math.max(0, -Math.cos(p)) * (run ? 1.3 : 0.7) : 0);
  const legs = [
    [-swing, kneeA(phase + Math.PI)],
    [swing, kneeA(phase)]
  ];
  if (low > 0) {
    // Kneeling: the far knee down with its shin flat behind, the near thigh forward with its shin straight down.
    legs[0] = [lerp(-swing, 0.2, low), lerp(legs[0][1], 1.9, low)];
    legs[1] = [lerp(swing, 1.2, low), lerp(legs[1][1], 1.5, low)];
  }
  const legCol = (i) => (i === 0 ? shade(k.limb, -0.25) : k.limb);
  legs.forEach(([a1, a2], i) => {
    const [ex, ey] = limb(ctx, hipX, hipY, a1, thigh, -a2, shin, legW, legCol(i), f);
    // A boot.
    ctx.fillStyle = shade(k.limb, -0.4);
    ctx.fillRect(ex - legW * 0.5 + (f > 0 ? 0 : -legW * 0.6), ey - legW * 0.45, legW * 1.6, legW * 0.7);
  });

  // Far arm.
  const armSwing = moving ? -Math.sin(phase) * amp * 0.9 : 0;
  const upper = Hh * 0.2;
  const fore = Hh * 0.19;
  const armW = Hh * 0.06;
  limb(ctx, shX, shY + Hh * 0.02, armSwing - (low ? 0.3 : 0), upper, run ? 1.2 : 0.25, fore, armW, shade(k.limb, -0.3), f);

  // Body: a cloak for the hooded, a suit or coat for the rest. Rim first, offset toward the light (upper left).
  const drawBody = (dx, dy, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    if (kind === 'hood' || kind === 'cloak') {
      const hem = hipY + Hh * (kind === 'hood' ? 0.3 : 0.18);
      const flap = Math.sin(phase * 2 + clock * 3) * Hh * (moving ? 0.04 : 0.012);
      const back = -f * Hh * (moving ? 0.12 + amp * 0.08 : 0.05);
      ctx.moveTo(shX - Hh * 0.08 * f + dx, shY - Hh * 0.02 + dy);
      ctx.lineTo(shX + Hh * 0.08 * f + dx, shY + dy);
      ctx.lineTo(hipX + Hh * 0.12 * f + dx, hem + flap * 0.5 + dy);
      const teeth = 5;
      for (let i = 1; i <= teeth; i++) {
        const u = i / teeth;
        const hx = lerp(hipX + Hh * 0.12 * f, hipX + back, u);
        ctx.lineTo(hx + dx, hem + (i % 2 ? Hh * 0.03 : 0) + flap * (1 - u) + dy);
      }
      ctx.lineTo(shX - Hh * 0.1 * f + dx, shY + Hh * 0.05 + dy);
    } else {
      const wS = Hh * 0.1;
      const wH = Hh * 0.085;
      ctx.moveTo(shX - wS + dx, shY + dy);
      ctx.lineTo(shX + wS + dx, shY + dy);
      ctx.lineTo(hipX + wH + dx, hipY + Hh * (kind === 'local' ? 0.1 : 0.02) + dy);
      ctx.lineTo(hipX - wH + dx, hipY + Hh * (kind === 'local' ? 0.1 : 0.02) + dy);
    }
    ctx.closePath();
    ctx.fill();
  };
  // A pack on the survey hand's back.
  if (kind === 'hand') {
    ctx.fillStyle = shade(k.body, -0.2);
    const px = shX - f * Hh * 0.16;
    ctx.fillRect(Math.min(px, px + f * Hh * 0.08), shY + Hh * 0.02, Hh * 0.08, Hh * 0.2);
  }
  drawBody(-1.5, -1.5, k.rim);
  drawBody(0, 0, k.body);

  // Head.
  const hx = shX + Math.sin(lean) * Hh * 0.08 * f;
  const hy = shY - Hh * 0.09;
  const hr = Hh * 0.075;
  if (kind === 'hood' || kind === 'cloak') {
    ctx.fillStyle = k.rim;
    hoodPath(ctx, hx - 1.5, hy - 1.5, hr, f);
    ctx.fill();
    ctx.fillStyle = k.head;
    hoodPath(ctx, hx, hy, hr, f);
    ctx.fill();
    // The opening of the hood: no face, only dark.
    ctx.fillStyle = '#070605';
    ctx.beginPath();
    ctx.ellipse(hx + f * hr * 0.35, hy + hr * 0.15, hr * 0.42, hr * 0.62, 0, 0, TAU);
    ctx.fill();
  } else {
    ctx.fillStyle = k.rim;
    ctx.beginPath();
    ctx.arc(hx - 1.5, hy - 1.5, hr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = k.head;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, TAU);
    ctx.fill();
    if (k.visor) {
      ctx.fillStyle = k.visor;
      ctx.globalAlpha *= 0.75;
      ctx.fillRect(hx + (f > 0 ? hr * 0.05 : -hr * 0.95), hy - hr * 0.3, hr * 0.9, hr * 0.42);
      ctx.globalAlpha /= 0.75;
    } else {
      // A cap brim.
      ctx.fillStyle = shade(k.head, -0.35);
      ctx.fillRect(hx - hr * 0.9 + (f > 0 ? hr * 0.4 : -hr * 0.4), hy - hr * 0.75, hr * 1.8, hr * 0.32);
    }
  }

  // Near arm, by pose.
  let a1 = moving ? armSwing * -1 : 0.1;
  let a2 = run ? 1.2 : 0.25;
  if (pose === 'wave') { a1 = Math.PI * 0.85; a2 = 0.35 * Math.sin(clock * 9); }
  if (pose === 'beckon') { a1 = Math.PI * 0.45; a2 = 0.6 + 0.6 * (0.5 + 0.5 * Math.sin(clock * 7)); }
  if (pose === 'point') { a1 = Math.PI * 0.5; a2 = 0; }
  if (low > 0) { a1 = lerp(a1, 0.95, low); a2 = lerp(a2, 0.25, low); }
  const hand = limb(ctx, shX, shY + Hh * 0.02, a1, upper, a2, fore, armW, k.limb, f);

  if (lamp && kind === 'hand') helmetLamp(ctx, hx + f * hr, hy, f, Hh, low);
  return { hand, head: [hx, hy], hip: [hipX, hipY] };
}

function hoodPath(ctx, hx, hy, hr, f) {
  ctx.beginPath();
  ctx.moveTo(hx - f * hr * 1.15, hy + hr * 1.2);
  ctx.quadraticCurveTo(hx - f * hr * 1.3, hy - hr * 1.0, hx - f * hr * 0.2, hy - hr * 1.45);
  ctx.quadraticCurveTo(hx + f * hr * 1.2, hy - hr * 0.9, hx + f * hr * 1.0, hy + hr * 1.1);
  ctx.closePath();
}

/** The flat wedge of a helmet lamp. */
function helmetLamp(ctx, x, y, f, Hh, low) {
  const reach = Hh * 2.2;
  const down = lerp(0.18, 0.55, low);
  const g = ctx.createLinearGradient(x, y, x + f * reach, y + reach * down);
  g.addColorStop(0, 'rgba(240, 226, 196, 0.22)');
  g.addColorStop(1, 'rgba(240, 226, 196, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + f * reach, y + reach * (down - 0.22));
  ctx.lineTo(x + f * reach, y + reach * (down + 0.22));
  ctx.closePath();
  ctx.fill();
}

/** A hex colour lightened (k > 0) or darkened (k < 0). */
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k));
  return `rgb(${ch[0]}, ${ch[1]}, ${ch[2]})`;
}

/**
 * The Avalon's lander, standing on (x, y). `ramp` 0..1 lowers the ramp, `thrust` 0..1 lights the burners.
 */
export function lander(ctx, x, y, s, { ramp = 0, thrust = 0, clock = 0 } = {}) {
  const L = 260 * s;
  const hh = L * 0.36;
  const by = y - L * 0.14;
  // Legs.
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 6 * s;
  ctx.beginPath();
  ctx.moveTo(x - L * 0.3, by - hh * 0.2); ctx.lineTo(x - L * 0.42, y);
  ctx.moveTo(x + L * 0.3, by - hh * 0.2); ctx.lineTo(x + L * 0.42, y);
  ctx.stroke();
  ctx.fillStyle = '#3c3833';
  ctx.fillRect(x - L * 0.47, y - 4 * s, L * 0.1, 4 * s);
  ctx.fillRect(x + L * 0.37, y - 4 * s, L * 0.1, 4 * s);

  // Burners.
  if (thrust > 0.01) {
    for (const bx of [-0.22, 0.22]) {
      const fx = x + bx * L;
      const len = L * (0.28 + 0.06 * Math.sin(clock * 40 + bx * 9)) * thrust;
      const g = ctx.createLinearGradient(fx, by, fx, by + len);
      g.addColorStop(0, 'rgba(255, 236, 196, 0.95)');
      g.addColorStop(0.35, 'rgba(229, 155, 36, 0.8)');
      g.addColorStop(1, 'rgba(154, 74, 46, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(fx - L * 0.045, by);
      ctx.lineTo(fx + L * 0.045, by);
      ctx.lineTo(fx, by + len);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Hull: a riveted wedge, lit from the upper left.
  const g = ctx.createLinearGradient(x - L / 2, by - hh, x + L / 2, by);
  g.addColorStop(0, '#6b625a');
  g.addColorStop(0.5, '#3c3833');
  g.addColorStop(1, '#1d1b18');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - L * 0.5, by);
  ctx.lineTo(x - L * 0.42, by - hh * 0.75);
  ctx.lineTo(x - L * 0.18, by - hh);
  ctx.lineTo(x + L * 0.3, by - hh);
  ctx.lineTo(x + L * 0.5, by - hh * 0.4);
  ctx.lineTo(x + L * 0.5, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(214, 196, 168, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Seams and a cockpit slot.
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.moveTo(x - L * 0.1, by - hh); ctx.lineTo(x - L * 0.1, by);
  ctx.moveTo(x + L * 0.2, by - hh); ctx.lineTo(x + L * 0.2, by);
  ctx.stroke();
  ctx.fillStyle = '#b8afa0';
  ctx.globalAlpha *= 0.7;
  ctx.fillRect(x + L * 0.26, by - hh * 0.82, L * 0.14, hh * 0.16);
  ctx.globalAlpha /= 0.7;
  // Burner bells.
  ctx.fillStyle = '#26221e';
  for (const bx of [-0.22, 0.22]) ctx.fillRect(x + bx * L - L * 0.05, by, L * 0.1, 8 * s);

  // The ramp, hinged at the hull's right floor, dropping to the ground; the door it leaves is lit inside.
  if (ramp > 0.01) {
    const hx = x + L * 0.08;
    const dw = L * 0.2;
    ctx.fillStyle = `rgba(214, 190, 150, ${0.55 * ramp})`;
    ctx.fillRect(hx - dw, by - hh * 0.78, dw, hh * 0.78);
    const a = lerp(-Math.PI / 2, 0.42, ease(ramp));
    const rl = L * 0.3;
    ctx.strokeStyle = '#4a453e';
    ctx.lineWidth = 7 * s;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(hx, by);
    ctx.lineTo(hx + Math.cos(a) * rl, by + Math.sin(a) * rl);
    ctx.stroke();
  }
}

/** The hauler Avalon in profile, nose to the right. */
export function hauler(ctx, x, y, s, clock = 0) {
  const L = 700 * s;
  const hh = L * 0.12;
  const g = ctx.createLinearGradient(0, y - hh, 0, y + hh);
  g.addColorStop(0, '#6b625a');
  g.addColorStop(0.45, '#3c3833');
  g.addColorStop(1, '#141210');
  // Engine bells, then the long spine, cargo pods, and the bridge tower.
  ctx.fillStyle = '#26221e';
  for (const dy of [-0.5, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(x - L * 0.5, y + dy * hh * 0.9 - hh * 0.25);
    ctx.lineTo(x - L * 0.56, y + dy * hh * 0.9 - hh * 0.4);
    ctx.lineTo(x - L * 0.56, y + dy * hh * 0.9 + hh * 0.4);
    ctx.lineTo(x - L * 0.5, y + dy * hh * 0.9 + hh * 0.25);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = g;
  ctx.fillRect(x - L * 0.5, y - hh * 0.35, L * 0.9, hh * 0.7);
  for (let i = 0; i < 5; i++) {
    const px = x - L * 0.4 + i * L * 0.13;
    ctx.fillRect(px, y - hh, L * 0.11, hh * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, y - hh + 0.5, L * 0.11 - 1, hh * 2 - 1);
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x + L * 0.25, y - hh * 0.35);
  ctx.lineTo(x + L * 0.32, y - hh * 1.5);
  ctx.lineTo(x + L * 0.42, y - hh * 1.5);
  ctx.lineTo(x + L * 0.5, y - hh * 0.2);
  ctx.lineTo(x + L * 0.5, y + hh * 0.35);
  ctx.lineTo(x + L * 0.25, y + hh * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(214, 196, 168, 0.22)';
  ctx.stroke();
  // The bridge window, warm; a few hull lamps.
  ctx.fillStyle = 'rgba(229, 190, 120, 0.85)';
  ctx.fillRect(x + L * 0.345, y - hh * 1.25, L * 0.06, hh * 0.3);
  const r = rng(77);
  for (let i = 0; i < 14; i++) {
    const on = Math.sin(clock * 0.7 + i * 2.3) > -0.6;
    ctx.fillStyle = on ? 'rgba(220, 200, 160, 0.7)' : 'rgba(220, 200, 160, 0.15)';
    ctx.fillRect(x - L * 0.42 + r() * L * 0.8, y - hh * 0.8 + r() * hh * 1.6, 3, 2);
  }
  // Exhaust, a short flat flare.
  const eg = ctx.createLinearGradient(x - L * 0.56, 0, x - L * 0.7, 0);
  eg.addColorStop(0, 'rgba(229, 155, 36, 0.6)');
  eg.addColorStop(1, 'rgba(229, 155, 36, 0)');
  ctx.fillStyle = eg;
  for (const dy of [-0.5, 0.5]) ctx.fillRect(x - L * 0.7, y + dy * hh * 0.9 - hh * 0.2, L * 0.14, hh * 0.4);
}

/** Vess, as only ever seen: a backlit silhouette in the comms bay window. */
export function vessWindow(ctx, x, y, ww, wh, clock = 0) {
  ctx.fillStyle = '#0c0b09';
  ctx.fillRect(x - 10, y - 10, ww + 20, wh + 20);
  const g = ctx.createLinearGradient(x, y, x, y + wh);
  g.addColorStop(0, '#6b5a40');
  g.addColorStop(1, '#2e261c');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, ww, wh);
  // Mullions.
  ctx.fillStyle = '#15130f';
  ctx.fillRect(x + ww / 3 - 3, y, 6, wh);
  ctx.fillRect(x + (2 * ww) / 3 - 3, y, 6, wh);
  // The figure, still but for breath.
  const cx = x + ww * 0.5;
  const base = y + wh;
  const br = Math.sin(clock * 1.1) * 1.5;
  ctx.fillStyle = '#0a0908';
  ctx.beginPath();
  ctx.moveTo(cx - ww * 0.26, base);
  ctx.quadraticCurveTo(cx - ww * 0.22, base - wh * 0.42 + br, cx - ww * 0.08, base - wh * 0.5 + br);
  ctx.lineTo(cx + ww * 0.08, base - wh * 0.5 + br);
  ctx.quadraticCurveTo(cx + ww * 0.22, base - wh * 0.42 + br, cx + ww * 0.26, base);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, base - wh * 0.64 + br, wh * 0.13, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = C.rim;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 10, y - 10, ww + 20, wh + 20);
}

/** The Fifth's mark: a triangle with a bar struck down through it. */
export function fifthMark(ctx, x, y, r, color = C.rust, width = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'square';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + i * (TAU / 3);
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.moveTo(x, y - r * 1.25);
  ctx.lineTo(x, y + r * 0.85);
  ctx.stroke();
}

/** Amber brackets closing in on something that matters. `p` 0..1 draws them in. */
export function brackets(ctx, x, y, bw, bh, p = 1, color = C.amber) {
  if (p <= 0) return;
  const k = Math.min(bw, bh) * 0.22;
  const g = lerp(30, 0, ease(p));
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'square';
  ctx.save();
  ctx.globalAlpha *= clamp01(p * 2);
  ctx.beginPath();
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
    const cx = x + sx * (bw / 2 + g);
    const cy = y + sy * (bh / 2 + g);
    ctx.moveTo(cx - sx * k, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy - sy * k);
  });
  ctx.stroke();
  ctx.restore();
}

/** A scan sweep from the survey hand's tool onto a target. */
export function scan(ctx, fx, fy, tx, ty, tw, p, clock = 0) {
  if (p <= 0) return;
  const sweep = Math.sin(clock * 5) * tw * 0.4;
  ctx.fillStyle = `rgba(229, 155, 36, ${0.14 * clamp01(p * 3)})`;
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(tx + sweep - tw * 0.18, ty);
  ctx.lineTo(tx + sweep + tw * 0.18, ty);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(229, 155, 36, ${0.7 * clamp01(p * 3)})`;
  ctx.fillRect(tx + sweep - tw * 0.18, ty - 1, tw * 0.36, 2);
}

/** The letterbox bars and an optional fade to black (0 = clear, 1 = black). */
export function frame(ctx, fadeA = 0) {
  if (fadeA > 0.001) {
    ctx.fillStyle = `rgba(5, 4, 3, ${clamp01(fadeA)})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = '#050403';
  ctx.fillRect(0, 0, W, H * BAR);
  ctx.fillRect(0, H * (1 - BAR), W, H * BAR);
}

/** A place name set low in the frame as a scene opens. */
export function placeCard(ctx, name, sub, a) {
  if (a <= 0.01) return;
  alpha(ctx, a, () => {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.text;
    ctx.font = '700 44px Quantico, "JetBrains Mono", monospace';
    const y = H * (1 - BAR) - 40;
    ctx.fillText(name.toUpperCase(), 64, y);
    ctx.fillStyle = C.amber;
    ctx.fillRect(64, y + 12, 56, 3);
    if (sub) {
      ctx.fillStyle = C.dust;
      ctx.font = '400 20px Quantico, "JetBrains Mono", monospace';
      ctx.fillText(sub, 132, y + 18);
    }
  });
}

/** Screen shake, as an offset to translate by: strongest at `k` = 1. */
export function shake(clock, k) {
  if (k <= 0) return [0, 0];
  return [Math.sin(clock * 53) * 6 * k, Math.cos(clock * 47) * 4 * k];
}

/** A bright cube or chunk lying on the ground, lit from the upper left: salt, ore, rubble. */
export function block(ctx, x, y, s, top = '#d6cebd', side = '#8f887b', front = '#b4ab97') {
  ctx.fillStyle = front;
  ctx.fillRect(x - s / 2, y - s, s, s);
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x - s / 2, y - s);
  ctx.lineTo(x - s / 2 + s * 0.3, y - s * 1.25);
  ctx.lineTo(x + s / 2 + s * 0.3, y - s * 1.25);
  ctx.lineTo(x + s / 2, y - s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(x + s / 2, y - s);
  ctx.lineTo(x + s / 2 + s * 0.3, y - s * 1.25);
  ctx.lineTo(x + s / 2 + s * 0.3, y - s * 0.25);
  ctx.lineTo(x + s / 2, y);
  ctx.closePath();
  ctx.fill();
}

/** Wavy heat lines rising from (x, y). */
export function heatLines(ctx, x, y, wdt, hgt, clock, a = 0.35) {
  ctx.strokeStyle = `rgba(229, 190, 140, ${a})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const bx = x - wdt / 2 + (i + 0.5) * (wdt / 4);
    ctx.beginPath();
    for (let j = 0; j <= 12; j++) {
      const u = j / 12;
      const yy = y - u * hgt - ((clock * 30) % (hgt / 3));
      const xx = bx + Math.sin(u * 9 + clock * 4 + i) * 5;
      if (j === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
}
