/**
 * cutscene/scape.js — the landscape every world's cutscene stands on, painted back to front in aerial perspective: sky
 * lit round the world's key light (a sun, a moon, or the glow of something below the horizon), clouds, shafts of light,
 * four ranges of ridges that fade into the air the farther they are, mist between them, and textured ground.
 */

import {
  W, H, sky, stars, nebula, ridge, ground, haze, moon, setLight, keyLight, skyGlow, sunDisc, rays, clouds, mix, rgbOf
} from './kit.js';

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
 * @param {{ x: number, y: number, color: string, power: number, sun?: number }} [P.light]  the key light; `sun` is a disc radius
 * @param {number} [P.clouds]  how many
 * @param {string} [P.nebula]  colour ('r, g, b') of a band of far dust across a night sky
 * @param {number} [P.rays]    strength of the light shafts (0 = none)
 * @param {number} [P.strata]  how strongly the rock bands show (default 1)
 */
export function scape(ctx, camX, P, clock = 0) {
  const seed = P.seed || 1;
  const gy = P.gy;
  const lightX = P.light ? P.light.x - camX * 0.02 : (P.moon ? P.moon[0] - camX * 0.02 : 300);
  setLight({ ...(P.light || (P.moon ? { y: P.moon[1], color: '196, 200, 210', power: 0.4 } : {})), x: lightX });
  const L = keyLight();
  const horizon = P.sky[P.sky.length - 1][1];
  const air = mix(horizon, L.color, 0.25 * L.power);
  const strata = P.strata ?? 1;

  sky(ctx, P.sky);
  if (P.nebula) nebula(ctx, seed * 17 + 3, P.nebula, 0.08, camX * 0.02);
  if (P.stars) stars(ctx, seed * 7 + 1, P.stars, clock, gy - 120, camX * 0.02);
  skyGlow(ctx, gy);
  if (P.light?.sun) sunDisc(ctx, P.light.sun);
  if (P.moon) {
    const [x, y, r, lit, dark] = P.moon;
    moon(ctx, x - camX * 0.02, y, r, lit, dark);
    // Earthshine on the dark side and a thin lit limb.
    ctx.strokeStyle = `rgba(${L.color}, 0.35)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x - camX * 0.02, y, r, Math.PI * 0.75, Math.PI * 1.75);
    ctx.stroke();
  }
  if (P.clouds) clouds(ctx, seed * 11 + 7, P.clouds, camX, gy, clock, rgbOf(mix(P.sky[0][1], '0, 0, 0', 0.2)).join(', '));
  if (P.rays) rays(ctx, gy, clock, P.rays);

  // Four ranges, each one less lost in the air than the one behind it.
  const farAmp = P.farAmp ?? 70;
  const midAmp = P.midAmp ?? 40;
  const jag = P.jag || 0;
  ridge(ctx, {
    y: gy - 205, amp: farAmp * 0.8, seed: seed * 2 + 9, color: mix(P.far, air, 0.55), top: mix(P.far, air, 0.75),
    camX, par: 0.05, freq: 1.1, jag: jag * 1.1, rim: 0.5
  });
  haze(ctx, gy - 160, 80, `rgba(${rgbOf(air).join(', ')}, 0.35)`);
  ridge(ctx, {
    y: gy - 150, amp: farAmp, seed: seed * 3 + 2, color: P.far, top: mix(P.far, air, 0.4), camX, par: 0.12, freq: 1.4, jag,
    rim: 0.8, strata: strata * 0.6
  });
  haze(ctx, gy - 110, 70, P.haze || `rgba(${rgbOf(air).join(', ')}, 0.18)`);
  ridge(ctx, {
    y: gy - 70, amp: midAmp, seed: seed * 5 + 3, color: mix(P.mid, '0, 0, 0', 0.25), top: mix(P.mid, air, 0.18), camX, par: 0.35,
    freq: 2.2, jag: jag * 0.6, rim: 1, strata
  });
  haze(ctx, gy - 18, 34, `rgba(${rgbOf(air).join(', ')}, 0.2)`);
  ridge(ctx, {
    y: gy - 14, amp: Math.max(8, midAmp * 0.35), seed: seed * 7 + 5, color: mix(P.ground[0], '0, 0, 0', 0.35),
    top: mix(P.ground[0], L.color, 0.08), camX, par: 0.7, freq: 3.4, rim: 0.7, bottom: gy + 2
  });
  ground(ctx, gy, P.ground[0], P.ground[1], `rgba(${L.color}, ${0.1 + 0.15 * L.power})`, camX, seed);
}

/** A world x on screen for a layer moving at `par` of the camera. */
export const at = (wx, camX, par = 1) => wx - camX * par;

export { W, H };
