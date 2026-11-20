/**
 * cutscene/arrival.js — the shape every world's arrival cutscene shares.
 *
 * Four beats:
 *   1. What happened here: the world's own incident, drawn by the world (`incident`), with its name set low in the frame.
 *      Vess says the world's `arrival` line over it.
 *   2. The Avalon's lander sets down and the survey hand (the player) walks down the ramp.
 *   3. A local runs up, waves, beckons, and leads the survey hand across the ground to what was left behind.
 *   4. The survey hand kneels and scans it; amber brackets close on it. Vess says the world's `objective` line over it.
 *
 * A world supplies its ground (`backdrop`, drawn for a camera x), its incident, its evidence, and who meets the lander.
 */

import { W, H, span, win, lerp, clamp01, person, lander, brackets, scan, frame, placeCard, alpha } from './kit.js';

const LAND = 3.4;
const GUIDE = 6.2;
const LOOK = 4.2;
const FADE = 0.45;

/**
 * @param {object} spec
 * @param {string} spec.id
 * @param {string} spec.name        place name for the card
 * @param {string} [spec.sub]       one short descriptor under it
 * @param {number} spec.groundY     where feet stand
 * @param {(ctx, camX, T, clock) => void} spec.backdrop   sky, ridges, ground and props for a camera x
 * @param {number} [spec.incidentDur]
 * @param {(ctx, t, clock) => void} spec.incident         beat 1, own composition, t in seconds from 0
 * @param {number} spec.evidenceX   world x of what was left behind
 * @param {(ctx, sx, gy, reveal, clock) => void} spec.evidence   drawn at screen x, ground y; reveal 0..1
 * @param {(ctx, camX, T, clock) => void} [spec.front]    things in front of the people (foreground)
 * @param {string} [spec.guide]     'local' | 'cloak'
 * @param {boolean} [spec.lamp]     a dark world: the survey hand's helmet lamp is on
 * @param {[string, string]} lines  [arrival, objective]
 */
export function arrivalScene(spec, lines) {
  const D1 = spec.incidentDur || 5.2;
  const t2 = D1;
  const t3 = t2 + LAND;
  const t4 = t3 + GUIDE;
  const end = t4 + LOOK;
  const gy = spec.groundY;
  const ex = spec.evidenceX;
  const panTo = Math.max(0, ex - 760);
  const landerX = 300;

  const paint = (ctx, T, clock) => {
    if (T < t2) {
      spec.incident(ctx, T, clock);
      frame(ctx, 1 - win(T, 0, 0.6), clock);
      placeCard(ctx, spec.name, spec.sub || '', win(T, 0.4, 1.2) * (1 - win(T, 3.6, 4.4)));
      return;
    }

    const lt = T - t2;
    const gt = T - t3;
    const kt = T - t4;
    const camX = T < t3 ? 0 : lerp(0, panTo, span(gt, 3.2, GUIDE));
    spec.backdrop(ctx, camX, T, clock);
    const sx = wx => wx - camX;

    // The lander: comes down from above, burners lit, settles, lowers its ramp.
    const drop = 1 - span(lt, 0, 2.0);
    const ly = gy - drop * 520;
    // The burners light the ground under the lander as it comes down.
    const burn = lt < 2.3 ? (1 - win(lt, 1.8, 2.3)) * (1 - drop * 0.8) : 0;
    if (burn > 0.01) {
      const pool = ctx.createRadialGradient(sx(landerX), gy, 0, sx(landerX), gy, 360);
      pool.addColorStop(0, `rgba(229, 155, 36, ${0.4 * burn})`);
      pool.addColorStop(1, 'rgba(229, 155, 36, 0)');
      ctx.save();
      ctx.translate(0, gy);
      ctx.scale(1, 0.25);
      ctx.fillStyle = pool;
      ctx.fillRect(sx(landerX) - 360, -360, 720, 720);
      ctx.restore();
    }
    lander(ctx, sx(landerX), ly, 1.6, { ramp: span(lt, 2.2, 2.9), thrust: lt < 2.3 ? 1 - win(lt, 1.8, 2.3) : 0, clock });
    if (lt < 2.4) {
      // Dust thrown up as it lands.
      const d = win(lt, 1.2, 2.0) * (1 - win(lt, 2.0, 3.2));
      alpha(ctx, d * 0.5, () => {
        ctx.fillStyle = 'rgba(184, 175, 160, 0.5)';
        for (let i = 0; i < 18; i++) {
          const u = i / 17;
          const r = 20 + u * 60;
          ctx.beginPath();
          ctx.ellipse(sx(landerX) + (u - 0.5) * 520, gy - 8, r, r * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    const evid = T < t4 ? 0.35 + 0.35 * win(gt, 4.2, GUIDE) : 0.7 + 0.3 * win(kt, 1.0, 2.6);
    spec.evidence(ctx, sx(ex), gy, evid, clock);

    // The survey hand: down the ramp, a few steps out, then follows the guide.
    const rampTop = [landerX + 33, gy - 58];
    const rampFoot = [landerX + 150, gy];
    let px; let py = gy; let pose = 'stand'; let pf = 1; let crouch = 0;
    if (T >= t3 - 0.6 || lt > 2.8) {
      if (T < t3) {
        const u = win(lt, 2.8, LAND);
        px = lerp(rampTop[0], rampFoot[0], u);
        py = lerp(rampTop[1], rampFoot[1], u);
        pose = 'walk';
      } else if (gt < 1.1) {
        px = lerp(rampFoot[0], 520, win(gt, 0, 1.1));
        pose = 'walk';
      } else if (gt < 3.4) {
        px = 520;
      } else if (T < t4) {
        px = lerp(520, ex - 80, span(gt, 3.4, GUIDE));
        pose = gt < GUIDE - 0.1 ? 'walk' : 'stand';
      } else {
        px = ex - 80;
        crouch = span(kt, 0, 0.7);
      }
      const ph = T * 7.5;
      const who = person(ctx, sx(px), py, 0.72, { kind: 'hand', pose, phase: ph, f: pf, lamp: spec.lamp, clock, crouch });
      if (T >= t4) {
        const sp = win(kt, 0.8, 1.2) * (1 - win(kt, 3.0, 3.4));
        scan(ctx, who.hand[0], who.hand[1], sx(ex), gy - 22, 120, sp, clock);
      }
    }

    // The guide: runs in from the right, waves, beckons, leads to the evidence, then points at it.
    if (T >= t3) {
      let gx; let gpose; let gf;
      if (gt < 2.0) { gx = lerp(1420, 680, win(gt, 0.2, 2.0)); gpose = gt < 1.95 ? 'run' : 'stand'; gf = -1; }
      else if (gt < 2.9) { gx = 680; gpose = 'wave'; gf = -1; }
      else if (gt < 3.5) { gx = 680; gpose = 'beckon'; gf = 1; }
      else if (T < t4) { gx = lerp(680, ex + 90, span(gt, 3.5, GUIDE - 0.4)); gpose = gt < GUIDE - 0.45 ? 'walk' : 'stand'; gf = gt < GUIDE - 0.45 ? 1 : -1; }
      else { gx = ex + 90; gpose = kt > 0.4 ? 'point' : 'stand'; gf = -1; }
      person(ctx, sx(gx), gy, 0.7, { kind: spec.guide || 'local', pose: gpose, phase: T * (gpose === 'run' ? 12 : 7.5), f: gf, clock });
    }

    if (T >= t4) brackets(ctx, sx(ex), gy - 34, 120, 70, win(kt, 1.6, 2.6));
    spec.front?.(ctx, camX, T, clock);
    frame(ctx, 1 - win(lt, 0, FADE), clock);
  };

  return {
    id: spec.id,
    beats: [
      { dur: D1, say: lines[0] },
      { dur: LAND },
      { dur: GUIDE },
      { dur: LOOK, say: lines[1] }
    ],
    duration: end,
    paint
  };
}

export { W, H, clamp01 };
