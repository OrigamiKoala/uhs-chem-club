/**
 * cutscene/plots-a.js — what happens after the Avalon arrives at Erebus, Tallow, Lanternfall, Ligar and Bellows.
 *
 * Each world's story runs its own way (see `story.js`); these are the shots after the opening incident.
 *   Erebus       — the lander's searchlight catches the saboteur at tower 20; the figure escapes in an unlit ship,
 *                  leaving its stamp behind; a test jumper across the cut cable sparks the emitter for one breath, then it dies.
 *   Tallow       — a low glide over the salt flat into a gold rush at the refinery; a prospector holds up the "gold";
 *                  it drops like lead into the salt; in the survey hand's glove it is a rainbow-skinned metal crystal.
 *   Lanternfall  — the camera tilts down from the aurora as an unlit ship blots it out; the keeper climbs the tower
 *                  and lights the lamp, but no beam comes out; through the new lens the light is all invisible.
 *   Ligar        — the lander cannot set down in the pit and winches the survey hand in; the rescue crew hears
 *                  knocking from behind the rubble, then gas hisses out and drives them back; a cut face mirrors the survey hand.
 *   Bellows      — docking under a floating rig over a sea of cloud; a jammed tank blows its relief valve and the
 *                  deck lurches; on the frozen deck a rigger warms bare hands at the one cylinder with no frost.
 */

import {
  C, W, H, TAU, win, span, lerp, clamp01, alpha, rng, person, fifthMark, held, shake, setLight, sky, stars, skyGlow,
  sunDisc, ridge, ground, haze, clouds, mix, brackets, scan, heatLines, drift, block
} from './kit.js';
import { scape, at } from './scape.js';
import {
  camera, handheld, smooth, light, grade, cone, pool, halo, flash, snow, fog, veil, plume, ripples, reflect, shimmer,
  craft, craftLamps, craftShadow, device, darkShip, glove, burst
} from './shot.js';
import { PROPS_A } from './worlds-a.js';

const GY = 560;
const LAMP = '240, 226, 196';
const {
  EREBUS, tower, TALLOW, refinery, saltBin, hopperCrystal, lighthouse, cliff, fuelTank, warmCyl
} = PROPS_A;

// ================================================================= EREBUS: the stamp

const erebus = [
  {
    // The lander's searchlight sweeps the dead towers and lands on the saboteur, who runs to a ship with no lights.
    dur: 5.0,
    paint(ctx, t, clock) {
      const camX = lerp(0, 160, t / 5);
      scape(ctx, camX, EREBUS, clock);
      for (let i = 0; i < 7; i++) tower(ctx, at(160 + i * 170, camX, 0.6), GY - 40, 0.62, 0);
      tower(ctx, at(980, camX), GY, 1.0, 0, 20);
      const caught = win(t, 2.4, 2.6);
      const run = span(t, 2.7, 4.2);
      const fx = at(lerp(1000, 1330, run), camX);
      const ship = span(t, 3.8, 5.0);
      if (t < 4.2) person(ctx, fx, GY, 0.6, { kind: 'hood', pose: t < 2.7 ? 'crouch' : 'run', phase: t * 12, f: 1, clock });
      darkShip(ctx, at(1380, camX), lerp(GY - 30, 230, ship), 0.7, caught * (1 - ship));
      // The lander holds high on the left, nose down a little, burners working.
      const lx = 260 + t * 30;
      const ly = 230 + Math.sin(t * 1.3) * 6;
      craft(ctx, lx, ly, 0.7, { tilt: 0.06, thrust: 0.55, clock });
      grade(ctx, '4, 5, 9', 0.5);
      // The searchlight: sweeps across the field, finds the crouched figure, then tracks it to the ship.
      const bx = lx + 40;
      const by = ly + 6;
      const tx = t < 2.5 ? lerp(300, at(1000, camX), span(t, 0.3, 2.5)) : fx;
      const ang = Math.atan2(GY - by, tx - bx);
      light(ctx, () => {
        cone(ctx, bx, by, ang, 0.05, Math.hypot(tx - bx, GY - by) + 120, LAMP, 0.28);
        pool(ctx, tx, GY, 90, LAMP, 0.4);
      });
      craftLamps(ctx, lx, ly, 0.7, 0.06, 0.6);
      drift(ctx, 1101, 50, clock, { color: '150, 146, 140', a: 0.2, vx: 40, vy: 4 });
    }
  },
  {
    // Down on the ground: the survey hand walks into the dark to where the figure crouched, and picks up what it dropped.
    dur: 4.8,
    paint(ctx, t, clock) {
      const [hx, hy] = handheld(clock, 0.8);
      ctx.save();
      ctx.translate(hx, hy);
      scape(ctx, 500, EREBUS, clock);
      for (let i = 0; i < 4; i++) tower(ctx, 420 + i * 230, GY - 40, 0.62, 0);
      tower(ctx, 900, GY, 1.3, 0, 20);
      craft(ctx, 170, GY, 1.0, { ramp: 1, clock });
      const walk = span(t, 0.2, 2.8);
      const px = lerp(330, 760, walk);
      const pick = win(t, 3.0, 3.5);
      const who = person(ctx, px, GY, 0.72, { kind: 'hand', pose: t < 2.8 ? 'walk' : 'stand', phase: t * 7.5, f: 1, clock, crouch: t < 3.0 ? 0 : 1 - win(t, 3.6, 4.1) * 0.9 });
      // The stamp: a short handle with a triangle die, lying on its side, then lifted.
      const sx = t < 3.3 ? 790 : who.hand[0];
      const sy = t < 3.3 ? GY - 4 : who.hand[1];
      ctx.fillStyle = '#5b554c';
      ctx.fillRect(sx - 3, sy - 16, 6, 16);
      ctx.fillStyle = '#3c3833';
      ctx.fillRect(sx - 8, sy - 4, 16, 6);
      grade(ctx, '4, 5, 9', 0.55);
      light(ctx, () => {
        cone(ctx, who.head[0] + 6, who.head[1], 0.35 + pick * 0.4, 0.2, 320, LAMP, 0.22);
        pool(ctx, who.head[0] + 220, GY, 120, LAMP, 0.25);
        pool(ctx, 300, GY, 220, '214, 190, 150', 0.2);
      });
      craftLamps(ctx, 170, GY, 1.0, 0, 0.7);
      // Raised in the lamp, its face shows the mark, struck into the die.
      alpha(ctx, win(t, 3.9, 4.4), () => fifthMark(ctx, sx, sy - 26, 9, C.amber, 2));
      // The open panel on tower 20 carries the same mark.
      alpha(ctx, 0.5 * win(t, 1.4, 2.4), () => fifthMark(ctx, 900, GY - 120, 14, C.rust, 3));
      ctx.restore();
    }
  },
  {
    // Inside the panel: the cut cable. A jumper bridges it, sparks, and far above the emitter blinks amber and dies.
    dur: 4.8,
    say: 'objective',
    paint(ctx, t, clock) {
      const pull = span(t, 2.6, 4.4);
      const z = lerp(2.6, 1.0, pull);
      const cy = lerp(GY - 140, 330, pull);
      camera(ctx, 640, cy, z, () => {
        scape(ctx, 300, EREBUS, clock);
        tower(ctx, 640, GY, 1.4, 0);
        // The panel, open, with the two cut ends of the main feed.
        ctx.fillStyle = '#0c0b09';
        ctx.fillRect(612, GY - 180, 56, 84);
        ctx.strokeStyle = '#3c3833';
        ctx.strokeRect(612, GY - 180, 56, 84);
        ctx.fillStyle = '#26221e';
        ctx.fillRect(634, GY - 180, 12, 30);
        ctx.fillRect(634, GY - 128, 12, 32);
        ctx.fillStyle = '#c47a3a';
        ctx.fillRect(636, GY - 152, 8, 3);
        ctx.fillRect(636, GY - 129, 8, 3);
        // The jumper comes in from the right and clips across the gap.
        const j = span(t, 0.4, 1.8);
        ctx.strokeStyle = '#8f887b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lerp(720, 646, j), lerp(GY - 170, GY - 151, j));
        ctx.quadraticCurveTo(lerp(730, 660, j), GY - 140, lerp(720, 646, j), lerp(GY - 110, GY - 128, j));
        ctx.stroke();
        grade(ctx, '4, 5, 9', 0.35);
        burst(ctx, Math.floor(clock * 14), 646, GY - 140, held(t, 1.8, 2.6, 0.1));
        light(ctx, () => halo(ctx, 646, GY - 140, 40, '255, 214, 150', 0.4 * held(t, 1.8, 2.6, 0.1)));
        // The emitter catches for a breath, flickers, and goes dark again.
        const on = held(t, 3.0, 4.0, 0.15) * (Math.sin(clock * 40) > -0.3 ? 1 : 0.2);
        const top = GY - 230 * 1.4 - 12 * 1.4;
        ctx.fillStyle = `rgba(229, 155, 36, ${on})`;
        ctx.fillRect(640 - 7 * 1.4, top, 14 * 1.4, 12 * 1.4);
        light(ctx, () => halo(ctx, 640, top + 8, 60, '229, 155, 36', 0.35 * on));
      });
    }
  }
];

// ================================================================= TALLOW: the gold rush

const SUNSET = [[0, '#1a1410'], [0.35, '#3a2a1e'], [0.7, '#7a5232'], [0.9, '#b07a44'], [1, '#d6a468']];

/** A salt flat in perspective from the horizon at hy: crust cells that grow toward the viewer, and the sun's glare on it. */
function saltFlat(ctx, hy, sunX) {
  const g = ctx.createLinearGradient(0, hy, 0, H);
  g.addColorStop(0, '#c8ad86');
  g.addColorStop(0.4, '#ddd2bf');
  g.addColorStop(1, '#bfb4a2');
  ctx.fillStyle = g;
  ctx.fillRect(0, hy, W, H - hy);
  const glare = ctx.createLinearGradient(sunX - 140, 0, sunX + 140, 0);
  glare.addColorStop(0, 'rgba(255, 228, 180, 0)');
  glare.addColorStop(0.5, 'rgba(255, 228, 180, 0.4)');
  glare.addColorStop(1, 'rgba(255, 228, 180, 0)');
  ctx.fillStyle = glare;
  ctx.fillRect(sunX - 140, hy, 280, H - hy);
  // Crust ridges: a net of low polygons, small at the horizon and wide underfoot.
  ctx.strokeStyle = 'rgba(120, 98, 72, 0.32)';
  ctx.lineWidth = 1;
  const rows = 16;
  const r = rng(1717);
  for (let j = 1; j <= rows; j++) {
    const u0 = (j - 1) / rows;
    const u1 = j / rows;
    const y0 = hy + (H - hy) * u0 * u0;
    const y1 = hy + (H - hy) * u1 * u1;
    const cw = 14 + 150 * u1 * u1;
    ctx.beginPath();
    for (let x = -cw + (j % 2) * cw * 0.5; x < W + cw; x += cw) {
      const jx = (r() - 0.5) * cw * 0.4;
      ctx.moveTo(x + jx, y0); ctx.lineTo(x + cw * 0.5 + jx, y1); ctx.lineTo(x + cw + jx, y0);
    }
    ctx.stroke();
  }
}

const tallow = [
  {
    // A low glide over the salt flat at sunset, its shadow racing it in from the left, toward a refinery overrun.
    dur: 5.2,
    paint(ctx, t, clock) {
      const hy = 430;
      setLight({ x: 980, y: 400, color: '246, 196, 128', power: 1 });
      sky(ctx, SUNSET);
      clouds(ctx, 2171, 8, t * 30, hy, clock, '60, 40, 30');
      skyGlow(ctx, hy);
      sunDisc(ctx, 40);
      ridge(ctx, { y: hy - 4, amp: 16, seed: 2173, color: '#3a2c22', top: '#6a4a32', par: 0, freq: 1.3, rim: 0.9 });
      saltFlat(ctx, hy, 980);
      // The refinery far off, small on the horizon, with people swarming its bins.
      ctx.save();
      ctx.translate(300, hy + 6);
      ctx.scale(0.34, 0.34);
      refinery(ctx, 0, 0, 0.9);
      ctx.restore();
      for (let i = 0; i < 9; i++) {
        person(ctx, 470 + i * 14 + Math.sin(clock * 1.5 + i) * 4, hy + 8, 0.09, { kind: i % 3 ? 'local' : 'cloak', pose: i % 2 ? 'walk' : 'crouch', phase: clock * 6 + i, f: i % 2 ? 1 : -1, clock });
      }
      // The lander: in from the left, high, sinking, flaring at the end. Smaller the farther it is.
      const u = span(t, 0, 4.4);
      const lx = lerp(-180, 760, u);
      const alt = lerp(300, 0, Math.pow(u, 1.4));
      const groundY = lerp(620, 540, u);
      const s = lerp(0.62, 0.42, u);
      // Its shadow, thrown long to the left by the low sun, runs toward it as it comes down.
      craftShadow(ctx, lx - alt * 1.6, groundY, s, alt * 0.4, 1, 0.35);
      craft(ctx, lx, groundY - alt, s, { tilt: lerp(0.05, -0.16, smooth(3.2, 4.4, t)) * (1 - win(t, 4.4, 4.9)), thrust: smooth(3.4, 4.0, t) * (1 - win(t, 4.6, 5.0)), clock });
      plume(ctx, 2175, lx, groundY, span(t, 4.2, 5.2), win(t, 4.1, 4.4), { color: '236, 226, 206', reach: 260, rise: 50 });
      shimmer(ctx, hy - 14, hy + 16, clock, 2);
    }
  },
  {
    // At the bins, prospectors dig through the salt for gold. One holds up a dark lump; it drops into the salt like lead.
    dur: 5.4,
    paint(ctx, t, clock) {
      scape(ctx, 0, { ...TALLOW, light: { x: 1060, y: 410, color: '246, 196, 128', power: 1, sun: 44 } }, clock);
      refinery(ctx, 40, GY - 6);
      saltBin(ctx, 560, GY, 5);
      saltBin(ctx, 920, GY, 9);
      const lifted = win(t, 2.2, 2.5);
      const dropped = t > 3.6;
      const look = win(t, 2.5, 2.8);
      // Diggers fling salt; when the lump goes up, they stop and stare.
      const diggers = [[470, -1], [640, 1], [850, -1], [1000, 1]];
      diggers.forEach(([x, f], i) => {
        const dig = (1 - look) * (Math.sin(clock * 5 + i * 1.7) > 0 ? 1 : 0);
        person(ctx, x, GY, 0.6, { kind: i % 2 ? 'local' : 'cloak', pose: dig ? 'crouch' : 'stand', f: look > 0.5 ? (x < 730 ? 1 : -1) : f, clock });
        if (dig) {
          for (let k = 0; k < 4; k++) {
            const life = (clock * 1.6 + k / 4 + i * 0.3) % 1;
            ctx.fillStyle = `rgba(236, 230, 216, ${0.8 * (1 - life)})`;
            ctx.fillRect(x + f * (10 + life * 70), GY - 50 - Math.sin(life * Math.PI) * 60, 3, 3);
          }
        }
      });
      // The finder, between the bins, holds it up; then lets go.
      const who = person(ctx, 740, GY, 0.62, { kind: 'local', pose: lifted > 0.5 && !dropped ? 'wave' : 'crouch', f: 1, clock });
      const lumpY = dropped ? Math.min(GY - 46, who.hand[1] + Math.pow(t - 3.6, 2) * 900) : who.hand[1];
      const lumpX = dropped ? who.hand[0] : who.hand[0];
      if (t > 2.2) {
        ctx.fillStyle = '#5a5262';
        ctx.fillRect(lumpX - 8, lumpY - 8, 16, 14);
        ctx.fillStyle = 'rgba(255, 240, 210, 0.7)';
        ctx.fillRect(lumpX - 8, lumpY - 8, 16, 2);
      }
      // It hits the salt heap and sinks in with a puff.
      plume(ctx, 2181, 740, GY - 46, span(t, 3.75, 4.6), win(t, 3.7, 3.8) * (1 - win(t, 4.6, 5.2)), { color: '236, 230, 216', reach: 60, rise: 30 });
      // The survey hand walks in from the lander's side.
      person(ctx, lerp(-40, 330, span(t, 0.4, 4.0)), GY, 0.72, { kind: 'hand', pose: t < 4.0 ? 'walk' : 'stand', phase: t * 7.5, f: 1, clock });
      drift(ctx, 2183, 40, clock, { color: '236, 230, 216', a: 0.2, vx: -30, vy: 2, y0: GY - 120, y1: GY + 40 });
    }
  },
  {
    // In the survey hand's glove against the low sun: stepped, hollow, skinned in oxide colours. Not gold.
    dur: 4.8,
    say: 'objective',
    paint(ctx, t, clock) {
      setLight({ x: 980, y: 420, color: '246, 196, 128', power: 1 });
      sky(ctx, SUNSET);
      skyGlow(ctx, 470);
      sunDisc(ctx, 70);
      ctx.fillStyle = '#c8b494';
      ctx.fillRect(0, 470, W, H - 470);
      veil(ctx, 440, 70, '246, 210, 160', 0.5);
      // The glove dips under the weight as it takes it, then steadies.
      const dip = Math.exp(-t * 2.2) * Math.sin(t * 9) * 16;
      const gx = lerp(700, 620, span(t, 0, 1.2));
      const gy = 420 + dip;
      glove(ctx, 1200, 760, gx, gy, 1.6);
      hopperCrystal(ctx, gx, gy - 52, 46, clock);
      // Glints off the stepped faces.
      const r = rng(Math.floor(clock * 4));
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = `rgba(255, 246, 228, ${0.5 + r() * 0.5})`;
        ctx.fillRect(gx - 40 + r() * 80, gy - 90 + r() * 60, 2, 2);
      }
      drift(ctx, 2191, 30, clock, { color: '236, 230, 216', a: 0.25, vx: -40, vy: 3 });
    }
  }
];

// ================================================================= LANTERNFALL: the beam that never comes

/** Curtains of aurora across the top of a tall sky, folding slowly. */
function aurora(ctx, y, clock, a = 1) {
  const bands = [['140, 186, 156', 0], ['168, 150, 190', 1.7], ['140, 186, 156', 3.1]];
  ctx.lineWidth = 7;
  bands.forEach(([col, ph], k) => {
    for (let x = -20; x < W + 20; x += 7) {
      const top = y + k * 50 + Math.sin(x * 0.006 + ph + clock * 0.2) * 50 + Math.sin(x * 0.019 + clock * 0.5) * 14;
      const len = 120 + 60 * Math.sin(x * 0.011 + ph);
      const s = (0.5 + 0.5 * Math.sin(x * 0.03 + clock * 0.8 + ph)) * 0.12 * a;
      const g = ctx.createLinearGradient(0, top, 0, top + len);
      g.addColorStop(0, `rgba(${col}, 0)`);
      g.addColorStop(0.25, `rgba(${col}, ${s})`);
      g.addColorStop(1, `rgba(${col}, 0)`);
      ctx.strokeStyle = g;
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + len); ctx.stroke();
    }
  });
}

function glacier(ctx, gy, clock, camX = 0) {
  setLight({ x: 640, y: -100, color: '190, 206, 200', power: 0.45 });
  ridge(ctx, { y: gy - 150, amp: 120, seed: 3101, color: '#1c2129', top: '#4a5462', camX, par: 0.1, jag: 1.6, rim: 0.7 });
  haze(ctx, gy - 110, 70, 'rgba(170, 190, 196, 0.12)');
  ridge(ctx, { y: gy - 60, amp: 50, seed: 3103, color: '#2a313a', top: '#6a7682', camX, par: 0.4, jag: 1.0, rim: 0.6, strata: 0.5 });
  ground(ctx, gy, '#77808a', '#262b32', 'rgba(220, 230, 236, 0.25)', camX, 31);
}

const lanternfall = [
  {
    // Tilt down from the aurora to the ice. Overhead, something dark slides across the lights; then the lander comes in.
    dur: 5.2,
    paint(ctx, t, clock) {
      const cy = lerp(-150, 360, span(t, 0.6, 3.8));
      camera(ctx, 640, cy, 1, () => {
        const g = ctx.createLinearGradient(0, -520, 0, GY);
        g.addColorStop(0, '#020308');
        g.addColorStop(0.6, '#0c1220');
        g.addColorStop(1, '#2a3240');
        ctx.fillStyle = g;
        ctx.fillRect(-200, -620, W + 400, GY + 620);
        ctx.save();
        ctx.translate(0, -520);
        stars(ctx, 3111, 260, clock, 820);
        ctx.restore();
        aurora(ctx, -420, clock);
        // The unlit ship: no lamp, no glow; it only hides the aurora and the stars as it passes.
        darkShip(ctx, lerp(1500, -400, span(t, 0.2, 4.6)), -260, 1.3);
        glacier(ctx, GY, clock);
        lighthouse(ctx, 1000, GY, 0.9, 0, 0, clock);
        const land = span(t, 2.6, 5.0);
        craft(ctx, 420, lerp(GY - 520, GY, land), 0.95, { tilt: lerp(0.12, 0, land), thrust: (1 - win(t, 4.8, 5.2)) * win(t, 2.6, 3.0), clock });
        grade(ctx, '4, 6, 12', 0.35);
        craftLamps(ctx, 420, lerp(GY - 520, GY, land), 0.95, lerp(0.12, 0, land), win(t, 2.6, 3.2));
        plume(ctx, 3115, 420, GY, span(t, 4.4, 5.2), win(t, 4.3, 4.6), { color: '220, 228, 236', reach: 380 });
      });
      snow(ctx, 3117, clock, { n: 260, wind: -120, fall: 70, a: 0.7 });
    }
  },
  {
    // The keeper climbs the dark tower with a hand lamp, window by window, and lights the great lamp. No beam comes out.
    dur: 5.2,
    paint(ctx, t, clock) {
      const tx = 760;
      const s = 1.35;
      const h = 260 * s;
      camera(ctx, 640, lerp(360, 300, t / 5.2), 1, () => {
        const g = ctx.createLinearGradient(0, -100, 0, GY);
        g.addColorStop(0, '#04060c');
        g.addColorStop(1, '#283040');
        ctx.fillStyle = g;
        ctx.fillRect(-100, -200, W + 200, GY + 200);
        stars(ctx, 3121, 160, clock, GY - 160);
        aurora(ctx, 40, clock, 0.6);
        glacier(ctx, GY, clock, 300);
        lighthouse(ctx, tx, GY, s, 0, 0, clock);
        // The survey hand at the foot, looking up.
        const who = person(ctx, 470, GY, 0.72, { kind: 'hand', pose: 'stand', f: 1, clock });
        grade(ctx, '4, 6, 12', 0.45);
        // The keeper's lamp, up the stair inside; each window lights as it passes.
        const climb = span(t, 0.2, 3.0);
        const ky = lerp(GY - 30, GY - h + 10, climb);
        for (let i = 1; i < 6; i++) {
          const wy = GY - (h * i) / 6;
          const lit = ky < wy + 10 ? clamp01((wy + 10 - ky) / 30) * (0.35 + 0.65 * clamp01(1 - (wy - ky) / 120)) : 0;
          ctx.fillStyle = `rgba(229, 190, 120, ${0.7 * lit})`;
          ctx.fillRect(tx - 4, wy - 6, 8, 10);
        }
        light(ctx, () => {
          halo(ctx, tx + Math.sin(climb * 18) * 10, ky, 50, '229, 190, 120', 0.3 * (1 - win(t, 3.0, 3.3)));
          cone(ctx, who.head[0] + 6, who.head[1], -0.9, 0.18, 300, LAMP, 0.18);
        });
        // The great lamp comes on in the lantern room: the glass glows, but the air in front of it stays dark.
        const on = win(t, 3.3, 3.6);
        const ly = GY - h - 14 * s;
        ctx.fillStyle = `rgba(250, 236, 204, ${0.95 * on})`;
        ctx.fillRect(tx - 14 * s, ly - 12 * s, 28 * s, 24 * s);
        light(ctx, () => {
          halo(ctx, tx, ly, 40, '250, 236, 204', 0.35 * on);
          // What does leave the lens is a faint violet smear, nothing a ship could see by.
          cone(ctx, tx, ly, Math.PI * 0.03 + Math.sin(clock * 0.9) * 0.3, 0.07, 700, '120, 100, 160', 0.05 * on);
        });
      });
      snow(ctx, 3123, clock, { n: 200, wind: -90, fall: 60, a: 0.6 });
    }
  },
  {
    // In the lantern room: the lamp blazes behind the new lens, and the card held in front of it stays dark.
    dur: 4.8,
    say: 'objective',
    paint(ctx, t, clock) {
      ctx.fillStyle = '#0e1016';
      ctx.fillRect(0, 0, W, H);
      // Window panes behind, and snow beyond them.
      ctx.strokeStyle = '#2a2e34';
      ctx.lineWidth = 6;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(i * 320, 80); ctx.lineTo(i * 320 + 40, 640); ctx.stroke(); }
      snow(ctx, 3131, clock, { n: 90, wind: -140, fall: 40, a: 0.25 });
      // The lamp, very bright.
      light(ctx, () => halo(ctx, 300, 360, 220, '250, 236, 204', 0.55));
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath(); ctx.arc(300, 360, 26, 0, TAU); ctx.fill();
      // The lens: rings of glass, ground with a faint violet cast.
      for (let i = 6; i >= 1; i--) {
        ctx.fillStyle = i % 2 ? 'rgba(170, 160, 196, 0.22)' : 'rgba(110, 104, 140, 0.25)';
        ctx.beginPath(); ctx.ellipse(560, 360, 26 + i * 10, 40 + i * 24, 0, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(220, 214, 236, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(560, 360, 86, 184, 0, 0, TAU); ctx.stroke();
      // The light that should pour through to the card: almost none of it can be seen.
      light(ctx, () => cone(ctx, 600, 360, 0, 0.12, 420, '130, 110, 170', 0.07));
      // The survey hand's glove holds a white card in the path; it barely lights.
      const cx = lerp(1100, 920, span(t, 0.2, 1.2));
      ctx.fillStyle = '#d6d0c4';
      ctx.fillRect(cx - 4, 250, 10, 220);
      light(ctx, () => halo(ctx, cx, 360, 40, '120, 100, 160', 0.12));
      glove(ctx, 1300, 600, cx + 30, 420, 1.1);
      // The scanner on the wrist reads the same light: nothing in the visible band, a tall spike past violet.
      device(ctx, 900, 110, 260, 110, win(t, 1.6, 2.2), () => {
        const sp = ctx.createLinearGradient(40, 0, 240, 0);
        ['#5a3a7a', '#3a5a9a', '#4a8a5a', '#c4b44a', '#c47a3a', '#9a3a2e'].forEach((c, i) => sp.addColorStop(i / 5, c));
        ctx.fillStyle = sp;
        ctx.globalAlpha *= 0.35;
        ctx.fillRect(40, 92, 200, 8);
        ctx.globalAlpha /= 0.35;
        const k = span(t, 2.0, 3.0);
        ctx.fillStyle = C.amber;
        ctx.fillRect(12, 90 - 76 * k, 16, 76 * k);
        for (let i = 0; i < 10; i++) ctx.fillRect(48 + i * 19, 88, 12, 2);
        ctx.fillStyle = C.dust;
        ctx.font = '400 13px Quantico, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('UV', 8, 108);
      });
      brackets(ctx, 560, 360, 190, 390, win(t, 3.0, 3.8));
    }
  }
];

// ================================================================= LIGAR: knocking

const PIT_SKY = [[0, '#2e1a14'], [0.6, '#6a3420'], [1, '#a2522c']];

/** The quarry pit: stepped basalt benches down both sides to the floor at gy. */
function pit(ctx, gy, clock) {
  const benches = 5;
  const sideL = [];
  const sideR = [];
  for (let i = 0; i <= benches; i++) {
    const y = gy - 640 + i * 128;
    sideL.push([60 + i * 46, y]);
    sideR.push([W - 60 - i * 46, y]);
  }
  for (const [side, dir] of [[sideL, 1], [sideR, -1]]) {
    for (let i = 0; i < benches; i++) {
      const [x0, y0] = side[i];
      const [x1, y1] = side[i + 1];
      const outer = dir > 0 ? -400 : W + 400;
      // The wall face of this bench, columns of basalt, then the lit top of the bench below it.
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, '#2a231e');
      g.addColorStop(1, '#141210');
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(outer, x1), y0, Math.abs(x1 - outer), y1 - y0 + 2);
      ctx.strokeStyle = 'rgba(214, 196, 168, 0.06)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = Math.min(outer, x1); x < Math.max(outer, x1); x += 22) { ctx.moveTo(x, y0 + 8); ctx.lineTo(x, y1 - 4); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(236, 140, 80, 0.25)';
      ctx.fillRect(Math.min(outer, x1), y1 - 2, Math.abs(x1 - outer), 3);
    }
  }
  ctx.fillStyle = '#1d1916';
  ctx.fillRect(-200, gy, W + 400, 300);
}

const ligar = [
  {
    // The pit is too tight to land in. The lander hangs over the rim and winches the survey hand down to the floor.
    dur: 5.2,
    paint(ctx, t, clock) {
      const cy = lerp(-160, 380, span(t, 0.8, 4.6));
      const [dx, dy] = handheld(clock, 1.2);
      camera(ctx, 640 + dx, cy + dy, 1, () => {
        const g = ctx.createLinearGradient(0, -520, 0, -80);
        PIT_SKY.forEach(([o, c]) => g.addColorStop(o, c));
        ctx.fillStyle = g;
        ctx.fillRect(-200, -700, W + 400, 700);
        clouds(ctx, 4101, 6, t * 20, -80, clock, '40, 24, 18');
        pit(ctx, GY, clock);
        cliff(ctx, 140, GY, 1, 0.2, clock);
        const ly = -330 + Math.sin(clock * 1.4) * 5;
        // The winch line, and the survey hand on it, turning a little as it comes down.
        const u = span(t, 0.6, 4.8);
        const hy = lerp(-250, GY, u);
        const hx = 680 + Math.sin(t * 2.2) * 16 * (1 - u);
        ctx.strokeStyle = '#8f887b';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(680, ly - 10); ctx.lineTo(hx, hy - 100); ctx.stroke();
        person(ctx, hx, hy, 0.72, { kind: 'hand', pose: 'stand', f: 1, clock });
        craft(ctx, 640, ly, 0.9, { tilt: Math.sin(clock * 0.9) * 0.03, thrust: 0.7, clock });
        // Grit blown off the rim by the burners, falling into the pit.
        drift(ctx, 4103, 80, clock, { color: '170, 140, 110', a: 0.35, vx: 6, vy: 120, y0: -160, y1: GY });
        light(ctx, () => cone(ctx, 1240, -200, Math.PI * 0.72, 0.1, 900, '236, 140, 80', 0.12));
      });
    }
  },
  {
    // The rescue crew digs. Knocking answers from inside the rubble; then a crack hisses gas and drives them back.
    dur: 5.6,
    paint(ctx, t, clock) {
      const quake = held(t, 3.6, 4.6, 0.2);
      const [qx, qy] = shake(clock, quake * 0.8);
      ctx.save();
      ctx.translate(qx, qy);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#120c0a');
      g.addColorStop(1, '#2a1c16');
      ctx.fillStyle = g;
      ctx.fillRect(-20, -20, W + 40, H + 40);
      cliff(ctx, 300, GY, 1, 0, clock);
      ctx.fillStyle = '#1d1916';
      ctx.fillRect(-20, GY, W + 40, H);
      const stop = win(t, 1.3, 1.5);
      const back = span(t, 3.7, 5.2);
      const crew = [[420, -1], [600, 1], [760, -1]];
      const heads = [];
      crew.forEach(([x, f], i) => {
        const dig = (1 - stop) * (Math.sin(clock * 6 + i * 2) > 0);
        const cheer = held(t, 2.6, 3.6, 0.1) && i === 1;
        const px = x + back * (220 + i * 60);
        const pose = back > 0.05 ? 'walk' : cheer ? 'wave' : dig ? 'crouch' : 'stand';
        const who = person(ctx, px, GY, 0.66, { kind: 'local', pose, phase: t * 8 + i, f: back > 0.05 ? 1 : f, clock });
        heads.push(who.head);
      });
      const hand = person(ctx, lerp(900, 560, span(t, 0.2, 1.2)) + back * 260, GY, 0.72, { kind: 'hand', pose: t < 1.2 || back > 0.05 ? 'walk' : 'crouch', phase: t * 7.5, f: back > 0.05 ? 1 : -1, clock });
      heads.push(hand.head);
      grade(ctx, '6, 4, 3', 0.35);
      light(ctx, () => heads.forEach(([hx, hy], i) => cone(ctx, hx, hy, i === 3 && back < 0.05 ? Math.PI * 0.85 : back > 0.05 ? 0.3 : Math.PI * 0.8, 0.2, 260, LAMP, 0.16)));
      // Knocks from inside: three rings, three times.
      [1.6, 2.0, 2.4].forEach(k => {
        const life = win(t, k, k + 0.5);
        if (life > 0 && life < 1) {
          ctx.strokeStyle = `rgba(229, 190, 120, ${0.6 * (1 - life)})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(500, GY - 60, 10 + life * 70, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke();
        }
      });
      // The gas: a yellow-grey jet from a crack low in the pile, spreading along the floor.
      plume(ctx, 4111, 470, GY - 20, span(t, 3.6, 5.6), win(t, 3.5, 3.8), { color: '176, 168, 112', reach: 520, rise: 140 });
      // Pebbles shaken loose from above.
      const r = rng(4113);
      for (let i = 0; i < 18; i++) {
        const u = win(t, 3.6 + r() * 0.8, 4.3 + r() * 0.8);
        if (u > 0 && u < 1) block(ctx, 300 + r() * 500, lerp(60, GY, u * u), 5 + r() * 6, '#4a443d', '#25201c', '#3a342e');
      }
      ctx.restore();
    }
  },
  {
    // The boulder the blast threw down: one face cut flat as glass. In it, the survey hand sees their own lamp.
    dur: 4.8,
    say: 'objective',
    paint(ctx, t, clock) {
      ctx.fillStyle = '#0e0b09';
      ctx.fillRect(0, 0, W, H);
      // Rough basalt round the cut.
      const r = rng(4121);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = r() > 0.5 ? '#1d1916' : '#2a231e';
        ctx.beginPath();
        const x = r() * W;
        const y = 80 + r() * 560;
        ctx.moveTo(x, y); ctx.lineTo(x + 60 + r() * 80, y + r() * 30); ctx.lineTo(x + 30, y + 70 + r() * 40); ctx.lineTo(x - 40, y + 40);
        ctx.fill();
      }
      // The cut face: a dark mirror.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(360, 140); ctx.lineTo(980, 180); ctx.lineTo(940, 600); ctx.lineTo(330, 560);
      ctx.closePath();
      const fg = ctx.createLinearGradient(360, 140, 940, 600);
      fg.addColorStop(0, '#2e2c2a');
      fg.addColorStop(0.5, '#0c0b0a');
      fg.addColorStop(1, '#1d1b1a');
      ctx.fillStyle = fg;
      ctx.fill();
      ctx.clip();
      // The reflection: dim, facing back out, the helmet lamp a hard point.
      const sway = Math.sin(t * 0.8) * 30;
      alpha(ctx, 0.5, () => {
        const who = person(ctx, 640 + sway, 640, 1.9, { kind: 'hand', pose: 'stand', f: -1, clock });
        light(ctx, () => halo(ctx, who.head[0] - 10, who.head[1], 50, LAMP, 0.5));
      });
      // A clean highlight sliding along the face as the lamp moves: only a polished surface does this.
      light(ctx, () => cone(ctx, 300 + sway * 4, 120, 0.9, 0.04, 700, '255, 246, 228', 0.14));
      ctx.restore();
      ctx.strokeStyle = 'rgba(255, 246, 228, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(360, 140); ctx.lineTo(980, 180); ctx.stroke();
      // The glove comes into frame and runs a finger along it.
      glove(ctx, 1300, 760, lerp(1100, 860, span(t, 0.4, 1.6)), lerp(700, 470, span(t, 0.4, 1.6)), 1.4);
      brackets(ctx, 655, 370, 600, 420, win(t, 2.4, 3.2));
    }
  }
];

// ================================================================= BELLOWS: the relief valve

/** A sea of cloud tops below y, in three rows that slide past at different speeds, lit from above. */
function cloudSea(ctx, y, clock, t, tint = '214, 218, 224') {
  [[0.35, 0, 70, 0.7], [0.7, 46, 90, 0.85], [1.2, 100, 120, 1]].forEach(([sp, dy, rad, k], row) => {
    const r = rng(5101 + row);
    const off = t * 40 * sp + clock * 4 * sp;
    for (let i = 0; i < 16; i++) {
      const x = ((((r() * (W + 400) - off) % (W + 400)) + (W + 400)) % (W + 400)) - 200;
      const cy = y + dy + r() * 20;
      const rr = rad * (0.7 + r() * 0.6);
      const g = ctx.createRadialGradient(x, cy - rr * 0.3, 0, x, cy, rr);
      g.addColorStop(0, `rgba(${tint}, ${0.95 * k})`);
      g.addColorStop(0.7, `rgba(${tint}, ${0.7 * k})`);
      g.addColorStop(1, `rgba(${tint}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, cy, rr * 1.6, rr, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = `rgba(150, 156, 166, ${0.6 * k})`;
    ctx.fillRect(-200, y + dy + 40, W + 400, H);
  });
}

/** The rig: a gas envelope with a deck slung under it on cables. Returns the deck's top y. */
function rig(ctx, x, y, clock, tanks = 3) {
  const bob = Math.sin(clock * 0.9) * 6;
  const ey = y - 170 + bob;
  const g = ctx.createLinearGradient(0, ey - 80, 0, ey + 80);
  g.addColorStop(0, '#8e9298');
  g.addColorStop(0.5, '#5a5e64');
  g.addColorStop(1, '#2e3034');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, ey, 360, 78, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(30, 32, 36, 0.5)';
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(x + i * 96, ey, 8, 76 * Math.sqrt(1 - (i / 3.8) ** 2), 0, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = '#2a2622';
  ctx.lineWidth = 2;
  const dy = y + bob;
  ctx.beginPath();
  for (const k of [-0.8, -0.3, 0.3, 0.8]) { ctx.moveTo(x + k * 300, ey + 60); ctx.lineTo(x + k * 200, dy); }
  ctx.stroke();
  ctx.fillStyle = '#26221e';
  ctx.fillRect(x - 240, dy, 480, 16);
  ctx.fillStyle = 'rgba(236, 240, 244, 0.5)';
  ctx.fillRect(x - 240, dy, 480, 2);
  for (let i = 0; i < tanks; i++) fuelTank(ctx, x - 140 + i * 140, dy, 0.55, 0.93, 0.6, clock);
  return dy;
}

const bellows = [
  {
    // Over a sea of cloud, the lander matches the floating rig's slow bob and the docking clamps close on it.
    dur: 5.2,
    paint(ctx, t, clock) {
      const jolt = held(t, 4.3, 4.7, 0.1);
      const [jx, jy] = shake(clock, jolt);
      ctx.save();
      ctx.translate(jx, jy);
      setLight({ x: 300, y: 150, color: '236, 234, 228', power: 0.7 });
      sky(ctx, [[0, '#2e3440'], [0.5, '#7a828e'], [1, '#c4c8cc']]);
      skyGlow(ctx, 500);
      sunDisc(ctx, 26);
      cloudSea(ctx, 520, clock, t);
      const dy = rig(ctx, 840, 420, clock);
      // In from the left, braking hard, then holding level with the deck.
      const u = span(t, 0, 3.8);
      const lx = lerp(-260, 520, u);
      const ly = dy + lerp(-80, 0, u);
      craft(ctx, lx, ly, 0.8, { tilt: lerp(0.04, -0.12, smooth(2.4, 3.6, t)) * (1 - win(t, 3.8, 4.4)), thrust: smooth(2.2, 2.8, t) * (1 - win(t, 4.0, 4.6)), clock });
      // The clamp arms drop from the rig's end onto the lander's roof.
      const c = span(t, 3.8, 4.4);
      ctx.strokeStyle = '#3c3833';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(610, dy - 90); ctx.lineTo(lerp(600, 570, c), lerp(dy - 90, ly - 96, c));
      ctx.moveTo(640, dy - 90); ctx.lineTo(lerp(640, 600, c), lerp(dy - 90, ly - 96, c));
      ctx.stroke();
      // Wind running past.
      ctx.strokeStyle = 'rgba(236, 240, 244, 0.25)';
      ctx.lineWidth = 1;
      const r = rng(5111);
      ctx.beginPath();
      for (let i = 0; i < 24; i++) { const x = ((r() * W * 2 - clock * 700) % (W * 2) + W * 2) % (W * 2) - W * 0.5; const y = 100 + r() * 520; ctx.moveTo(x, y); ctx.lineTo(x + 80 + r() * 120, y); }
      ctx.stroke();
      ctx.restore();
    }
  },
  {
    // On deck: the gauges are pinned in the red. One relief valve blows a white jet; the deck lurches; the crew holds on.
    dur: 5.4,
    paint(ctx, t, clock) {
      const blow = win(t, 1.4, 1.6);
      const lurch = Math.sin(span(t, 1.5, 3.5) * Math.PI) * 0.05;
      camera(ctx, 640, 360, 1.05, () => {
        setLight({ x: 300, y: 120, color: '236, 234, 228', power: 0.6 });
        sky(ctx, [[0, '#4a5058'], [1, '#a4a8ae']]);
        cloudSea(ctx, 600, clock, t, '200, 204, 210');
        ctx.fillStyle = '#26221e';
        ctx.fillRect(-200, GY, W + 400, 30);
        ctx.fillStyle = 'rgba(236, 240, 244, 0.55)';
        ctx.fillRect(-200, GY, W + 400, 3);
        for (let i = 0; i < 3; i++) fuelTank(ctx, 360 + i * 260, GY, 1.1, 0.96, 1, clock);
        // The rail along the deck edge.
        ctx.strokeStyle = '#3c3833';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-200, GY - 70); ctx.lineTo(W + 200, GY - 70); ctx.stroke();
        for (let x = -200; x < W + 200; x += 120) { ctx.beginPath(); ctx.moveTo(x, GY - 70); ctx.lineTo(x, GY); ctx.stroke(); }
        // Crew: one hauling on a valve wheel, one grabbing the rail when the deck goes over.
        person(ctx, 500, GY, 0.68, { kind: 'local', pose: blow ? 'crouch' : 'point', f: 1, clock });
        person(ctx, 1020, GY, 0.68, { kind: 'local', pose: blow ? 'beckon' : 'stand', f: -1, clock });
        person(ctx, lerp(-60, 220, span(t, 0, 2.0)), GY, 0.72, { kind: 'hand', pose: t < 2.0 ? 'walk' : 'crouch', phase: t * 7.5, f: 1, clock });
        // The jet from the middle tank's valve: a hard white stream that spreads and blows away downwind.
        const jet = blow * (1 - win(t, 4.0, 5.0));
        const vx = 620;
        const vy = GY - 18 - 1.1 * 150;
        light(ctx, () => cone(ctx, vx, vy, -Math.PI * 0.5 - 0.35, 0.12, 280 * jet, '236, 240, 244', 0.5 * jet));
        plume(ctx, 5121, vx - 60, vy - 120, span(t, 1.5, 5.0), jet, { color: '232, 236, 240', reach: 500, rise: 160 });
      }, lurch);
      snow(ctx, 5123, clock, { n: 120, wind: -420, fall: 30, a: 0.5, size: 2 });
    }
  },
  {
    // Everything on the deck is furred with frost but one small sealed cylinder. A rigger warms bare hands at it.
    dur: 4.8,
    say: 'objective',
    paint(ctx, t, clock) {
      camera(ctx, 640, 470, lerp(1.6, 1.8, t / 4.8), () => {
        setLight({ x: 300, y: 120, color: '236, 234, 228', power: 0.55 });
        sky(ctx, [[0, '#4a5058'], [1, '#a4a8ae']]);
        cloudSea(ctx, 520, clock, t, '200, 204, 210');
        ctx.fillStyle = '#2a2622';
        ctx.fillRect(-200, GY, W + 400, 200);
        // Frost over the deck plates, thinning to bare steel in a ring round the cylinder.
        const r = rng(5131);
        for (let i = 0; i < 260; i++) {
          const x = 300 + r() * 680;
          const y = GY + r() * 60;
          if (Math.hypot((x - 640) / 1.0, (y - GY - 6) * 4) < 90) continue;
          ctx.fillStyle = `rgba(236, 240, 244, ${0.3 + r() * 0.4})`;
          ctx.fillRect(x, y, 2 + r() * 3, 1.5);
        }
        fuelTank(ctx, 420, GY, 0.8, 0.95, 0, clock);
        warmCyl(ctx, 640, GY, 1, clock);
        const who = person(ctx, 740, GY, 0.62, { kind: 'local', pose: 'crouch', f: -1, clock });
        // Breath fogging in the cold, then the warm air rising off the cylinder.
        const life = (clock * 0.6) % 1;
        alpha(ctx, 0.35 * (1 - life), () => { ctx.fillStyle = '#e6eaee'; ctx.beginPath(); ctx.ellipse(who.head[0] - 12 - life * 20, who.head[1] + 4 - life * 10, 4 + life * 12, 3 + life * 6, 0, 0, TAU); ctx.fill(); });
        heatLines(ctx, 640, GY - 92, 50, 90, clock, 0.25);
      });
      shimmer(ctx, 200, 360, clock, 2.6, 560, 720);
      brackets(ctx, 640, 436, 110, 190, win(t, 2.4, 3.2));
    }
  }
];

export const PLOTS_A = { erebus, unit01: tallow, unit02: lanternfall, unit03: ligar, unit04: bellows };
