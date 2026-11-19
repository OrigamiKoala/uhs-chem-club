/**
 * cutscene/scape.js — the landscape every world's cutscene stands on: sky, far and mid ridges in parallax, and ground.
 */

import { W, H, sky, stars, ridge, ground, haze, moon } from './kit.js';

/**
 * @param {object} P
 * @param {Array<[number, string]>} P.sky
 * @param {string} P.far   far ridge colour
 * @param {string} P.mid   mid ridge colour
 * @param {[string, string]} P.ground  top and bottom of the ground
 * @param {number} P.gy
 * @param {number} [P.seed]
 * @param {number} [P.stars]  how many
 * @param {number} [P.jag]
 * @param {number} [P.farAmp]
 * @param {number} [P.midAmp]
 * @param {[number, number, number, string, string]} [P.moon] x, y, r, lit, dark
 * @param {string} [P.haze]
 */
export function scape(ctx, camX, P, clock = 0) {
  const seed = P.seed || 1;
  sky(ctx, P.sky);
  if (P.stars) stars(ctx, seed * 7 + 1, P.stars, clock, P.gy - 120, camX * 0.02);
  if (P.moon) { const [x, y, r, lit, dark] = P.moon; moon(ctx, x - camX * 0.02, y, r, lit, dark); }
  ridge(ctx, { y: P.gy - 150, amp: P.farAmp ?? 70, seed: seed * 3 + 2, color: P.far, camX, par: 0.12, freq: 1.4, jag: P.jag || 0 });
  if (P.haze) haze(ctx, P.gy - 110, 70, P.haze);
  ridge(ctx, { y: P.gy - 70, amp: P.midAmp ?? 40, seed: seed * 5 + 3, color: P.mid, camX, par: 0.35, freq: 2.2, jag: (P.jag || 0) * 0.6 });
  ground(ctx, P.gy, P.ground[0], P.ground[1]);
}

/** A world x on screen for a layer moving at `par` of the camera. */
export const at = (wx, camX, par = 1) => wx - camX * par;

export { W, H };
