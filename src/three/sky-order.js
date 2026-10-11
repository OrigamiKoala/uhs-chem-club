/**
 * sky-order.js — where a sky dome sits in the opaque pass.
 *
 * A dome is pinned to the far plane in its vertex shader and writes no depth,
 * so it can be drawn at any point in the opaque list and look the same. It is
 * drawn LAST, after everything that writes depth, so the GPU's early depth test
 * throws away every sky fragment the ground, the plant or a moon has already
 * covered. Drawn first, the most expensive shader in each world (cloud decks,
 * aurora, far ranges, haloes) ran under the whole screen and was then painted
 * over below the horizon. Every dome's z is 0.999999 w, so
 * anything nearer than ~99.5% of the far plane occludes it.
 */
export const SKY_RENDER_ORDER = 1000;
