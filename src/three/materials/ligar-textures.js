/**
 * ligar-textures.js — Procedural PBR surfaces for Ligar, the basalt arch field.
 *
 * Ligar is the third place in this product and it has to read as none of the
 * other two. Erebus is an amber desert at low sun; Tallow is a bleached salt pan
 * under flat overcast; Ligar is dark volcanic stone under a smoke-brown sky, lit
 * along one edge by a dust-reddened sun near the horizon. Same SCOURED PLATE
 * world (CLAUDE.md §Aesthetic), a different rock and a different weather.
 *
 * EVERY MAP COMES OFF ONE HEIGHT FIELD. Albedo, normal, roughness and ambient
 * occlusion in each generator below are derived from the same field, so a
 * fracture is darker BECAUSE it is sunk, rougher BECAUSE it is broken, and
 * occluded BECAUSE it is a hollow. Drawing those four independently is the
 * single most reliable way to make stone read as plastic, and it is not done
 * here — the same contract `pbr-kit.js` holds every other surface to.
 *
 * Columnar basalt is not generic rock, and the difference is the whole look of
 * the place. A lava sheet cooling from its surface downward contracts into a
 * honeycomb of vertical prisms; each prism grows down as a column, and each
 * column's face carries horizontal CHISEL MARKS where the cooling front paused.
 * So the basalt generators below are anisotropic on purpose: strong horizontal
 * banding across a face, long vertical jointing between faces, and a rubbly
 * spall where a column has failed. Isotropic noise would give grey concrete.
 *
 * Nothing here is emissive. The only lit things on Ligar are the forge in the
 * tube mouth, the deck luminaires and one indicator per bench, and all three are
 * built as geometry in `ligar.js` rather than baked into a map (CLAUDE.md §4.2).
 */

import {
  canvas2d, texSize, heightField, readHeight,
  heightToAO, heightToRoughness, fbm, worley, ridged, makeRng, hashStr
} from './pbr-kit.js';

/* --------------------------------------------------------------- helpers */

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

function rgbLerp(a, b, t) {
  const k = Math.max(0, Math.min(1, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/** Write an albedo canvas from a per-texel colour function. */
function paint(S, fn) {
  const c = canvas2d(S, S);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const x = i % S;
    const y = (i / S) | 0;
    const rgb = fn(x / S, y / S, i);
    img.data[i * 4] = Math.max(0, Math.min(255, rgb[0]));
    img.data[i * 4 + 1] = Math.max(0, Math.min(255, rgb[1]));
    img.data[i * 4 + 2] = Math.max(0, Math.min(255, rgb[2]));
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/* ==========================================================================
   1. COLUMN FACE — the side of a standing basalt prism

   What a player is closest to for most of this world. The face of a column is
   near-flat, dark, and crossed by horizontal chisel marks a few centimetres
   apart where the cooling front advanced in steps. Between those the stone is
   almost glassy; along them it has flaked.
   ========================================================================== */

/**
 * @param {{size?: number, seed?: number, warm?: string, cool?: string}} opts
 * @returns {{albedo: HTMLCanvasElement, height: HTMLCanvasElement,
 *            roughness: HTMLCanvasElement, ao: HTMLCanvasElement,
 *            normalStrength: number}}
 */
export function basaltColumn(opts = {}) {
  const {
    size = texSize(512),
    seed = 11,
    warm = '#6b5f52',   // dust standing on a ledge, lit
    cool = '#2c2a28'    // the stone itself, in shade
  } = opts;
  const S = size;
  const sd = hashStr(`basalt${seed}`);

  const height = heightField(S, (u, v) => {
    // THE CHISEL MARKS. A cooling front that paused leaves a step across the
    // whole face, so the banding is a function of v alone plus a slow wander —
    // straight enough to read as a geological step, wandering enough not to
    // read as a ruled line.
    const wander = (fbm(u * 2.2, v * 0.9, { octaves: 3, period: 3, seed: sd ^ 0x31 }) - 0.5) * 0.07;
    const band = (v + wander) * 17;
    const step = Math.abs((band % 1) - 0.5) * 2;      // 0 at the step, 1 mid-plate
    let h = 0.42 + step * 0.2;

    // Glassy stone between the steps: fine, tight, low-amplitude tooth.
    h += (fbm(u * 26, v * 34, { octaves: 5, period: 26, seed: sd }) - 0.5) * 0.24;

    // Vertical hairline jointing — where this prism meets the next one.
    const joint = ridged(u * 3.5, v * 0.6, { octaves: 2, period: 4, seed: sd ^ 0x8d });
    h -= Math.pow(joint, 3) * 0.3;

    // Spall: flakes that have come off the face along a step.
    const sp = worley(u * 9, v * 11, 9, sd ^ 0x5c);
    if (sp.f1 < 0.1) h -= (0.1 - sp.f1) * 2.2;

    return h;
  });

  const hf = readHeight(height);
  const warmRgb = hexToRgb(warm);
  const coolRgb = hexToRgb(cool);
  const rand = makeRng(sd);

  const alb = paint(S, (u, v, i) => {
    const t = hf.data[i];
    // Dust and mineral bloom collect on the up-facing lip of every step, which
    // is why a basalt face reads as banded light even though the stone is one
    // colour. Below the step it stays black.
    let c = rgbLerp(coolRgb, warmRgb, Math.pow(t, 2.1));
    // A green-grey lichen crust, very sparse, only where water would sit.
    const lich = fbm(u * 5, v * 5, { octaves: 4, period: 5, seed: sd ^ 0xa1 });
    if (lich > 0.66 && t > 0.5) {
      c = rgbLerp(c, [0x6a, 0x6b, 0x52], (lich - 0.66) * 1.6);
    }
    // Iron weep out of a fracture, running down-face.
    const weep = fbm(u * 9, v * 2.2, { octaves: 3, period: 9, seed: sd ^ 0x4f });
    if (weep > 0.72) c = rgbLerp(c, [0x6d, 0x40, 0x22], (weep - 0.72) * 1.1);
    const grain = (rand() - 0.5) * 9;
    return [c[0] + grain, c[1] + grain, c[2] + grain];
  });

  return {
    albedo: alb,
    height,
    // Fresh basalt is nearly glassy; a broken or dusted surface is not. The
    // split follows the height, so the shine sits on the unbroken plate.
    roughness: heightToRoughness(height, { lo: 0.52, hi: 0.97 }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 1.35 }),
    normalStrength: 2.6
  };
}

/* ==========================================================================
   2. PAVEMENT — the sawn-off tops of a column field, walked on

   The foreground of the reference art: a flat plain that is the top of the
   colonnade, worn level, each polygon separated from the next by a grouted
   joint packed with grit. Walked at eye height, so it needs its detail at the
   millimetre and its variation at the metre.
   ========================================================================== */

export function basaltPavement(opts = {}) {
  const { size = texSize(512), seed = 12 } = opts;
  const S = size;
  const sd = hashStr(`pave${seed}`);
  const CELLS = 6;

  const height = heightField(S, (u, v) => {
    const w = worley(u * CELLS, v * CELLS, CELLS, sd);
    // Distance to the nearest cell WALL, not to the cell centre: that is what
    // makes a polygon with a sunk rim rather than a dome.
    const edge = Math.max(0, Math.min(1, (w.f2 - w.f1) * 2.2));
    // Each polygon sits at its own level — a pavement is worn, not machined.
    const tier = (worley(u * CELLS, v * CELLS, CELLS, sd ^ 0x777).f1 % 0.3) * 0.5;
    let h = 0.34 + edge * 0.44 + tier * 0.18;
    // Tooth across the top of each stone.
    h += (fbm(u * 40, v * 40, { octaves: 4, period: 40, seed: sd ^ 0x12 }) - 0.5) * 0.15;
    // Grit lying in the joints fills them part way back up.
    if (edge < 0.16) h += (0.16 - edge) * 0.55;
    return h;
  });

  const hf = readHeight(height);
  const rand = makeRng(sd ^ 0x99);
  const stone = hexToRgb('#3a3632');
  const dust = hexToRgb('#8a7b66');

  const alb = paint(S, (u, v, i) => {
    const t = hf.data[i];
    let c = rgbLerp(stone, dust, Math.pow(t, 2.4) * 0.9);
    // Grit in a joint is the same dust as the drift on the flat, so the joints
    // come out LIGHTER than the stone they separate. That inversion is what a
    // dusty pavement actually looks like, and it is the reading the art has.
    const w = worley(u * CELLS, v * CELLS, CELLS, sd);
    const edge = Math.max(0, Math.min(1, (w.f2 - w.f1) * 2.2));
    if (edge < 0.18) c = rgbLerp(c, [0x9c, 0x8c, 0x74], (0.18 - edge) * 3.6);
    const grain = (rand() - 0.5) * 11;
    return [c[0] + grain, c[1] + grain, c[2] + grain];
  });

  return {
    albedo: alb,
    height,
    roughness: heightToRoughness(height, { lo: 0.7, hi: 1.0 }),
    ao: heightToAO(height, { radius: Math.max(5, S >> 6), strength: 1.5 }),
    normalStrength: 2.2
  };
}

/* ==========================================================================
   3. SCORIA — the loose apron the yard is laid on

   Crushed column, walked and driven over until it is a fine dark grit with
   coarse angular fragments sitting proud of it.
   ========================================================================== */

export function scoriaGrit(opts = {}) {
  const { size = texSize(512), seed = 13 } = opts;
  const S = size;
  const sd = hashStr(`scoria${seed}`);

  const height = heightField(S, (u, v) => {
    let h = 0.5 + (fbm(u * 30, v * 30, { octaves: 5, period: 30, seed: sd }) - 0.5) * 0.5;
    // Angular fragments: a cell field thresholded hard, so a chip has an edge
    // rather than a shoulder.
    const w = worley(u * 16, v * 16, 16, sd ^ 0x2b);
    if (w.f1 < 0.22) h += (0.22 - w.f1) * 1.5;
    // Wheel ruts pressed through the loose stuff, one direction only.
    const rut = Math.sin((v + fbm(u * 2, v * 2, { octaves: 2, period: 2, seed: sd ^ 0x7 }) * 0.3) * 9.0);
    h -= Math.max(0, rut) * 0.06;
    return h;
  });

  const hf = readHeight(height);
  const rand = makeRng(sd ^ 0x3c);
  const fine = hexToRgb('#4a423a');
  const chip = hexToRgb('#262422');

  const alb = paint(S, (u, v, i) => {
    const t = hf.data[i];
    // A proud chip is fresh-broken stone and therefore DARKER than the dust
    // around it — the opposite of the pavement, where the joints hold the dust.
    let c = rgbLerp(fine, chip, Math.max(0, t - 0.55) * 2.0);
    const stain = fbm(u * 4, v * 4, { octaves: 3, period: 4, seed: sd ^ 0x51 });
    if (stain > 0.68) c = rgbLerp(c, [0x5e, 0x3c, 0x24], (stain - 0.68) * 1.2);
    const grain = (rand() - 0.5) * 13;
    return [c[0] + grain, c[1] + grain, c[2] + grain];
  });

  return {
    albedo: alb,
    height,
    roughness: heightToRoughness(height, { lo: 0.84, hi: 1.0 }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 7), strength: 1.1 }),
    normalStrength: 2.9
  };
}

/* ==========================================================================
   4. TUBE WALL — the inside of the lava tube the forge stands in

   The one surface on Ligar that is not a fracture. A tube is a pipe the lava
   drained out of: the walls are ROPY, glazed where the last flow licked them,
   and hung with drip stone. It reads completely differently from the columns,
   which is the point — the player should know they have gone inside.
   ========================================================================== */

export function lavaTubeWall(opts = {}) {
  const { size = texSize(512), seed = 14 } = opts;
  const S = size;
  const sd = hashStr(`tube${seed}`);

  const height = heightField(S, (u, v) => {
    // Ropes: long flow lines running one way, folded back on themselves.
    const fold = fbm(u * 1.6, v * 3.2, { octaves: 4, period: 4, seed: sd }) * 0.55;
    const rope = Math.sin((u * 7 + fold * 5) * Math.PI);
    let h = 0.5 + rope * 0.17;
    // Drip stone hanging off the ropes, vertical and sparse.
    const drip = ridged(u * 12, v * 1.4, { octaves: 2, period: 12, seed: sd ^ 0x9b });
    h += Math.pow(drip, 4) * 0.22;
    h += (fbm(u * 22, v * 22, { octaves: 4, period: 22, seed: sd ^ 0x44 }) - 0.5) * 0.18;
    return h;
  });

  const hf = readHeight(height);
  const rand = makeRng(sd ^ 0x71);
  const glaze = hexToRgb('#4a3a2c');
  const deep = hexToRgb('#1e1a18');

  const alb = paint(S, (u, v, i) => {
    const t = hf.data[i];
    let c = rgbLerp(deep, glaze, Math.pow(t, 1.7));
    // Oxidised skin on the ropes, the colour the reference art's tube mouth is.
    const ox = fbm(u * 6, v * 6, { octaves: 4, period: 6, seed: sd ^ 0x28 });
    if (ox > 0.55) c = rgbLerp(c, [0x7a, 0x4c, 0x26], (ox - 0.55) * 1.3 * t);
    const grain = (rand() - 0.5) * 8;
    return [c[0] + grain, c[1] + grain, c[2] + grain];
  });

  return {
    albedo: alb,
    height,
    // A glaze is the one shiny thing in this world, and it is shiny only on the
    // ropes that the last flow actually touched.
    roughness: heightToRoughness(height, { lo: 0.34, hi: 0.95 }),
    ao: heightToAO(height, { radius: Math.max(4, S >> 6), strength: 1.25 }),
    normalStrength: 2.4
  };
}

/* ==========================================================================
   5. CONVEYOR BELT — rubber run over rollers, carrying broken stone

   A belt is not plate: it is a woven carcass with a moulded cleat every so
   often, worn to a polish down the middle where the load rides and frayed at
   the edges where it has tracked against the frame for forty years.
   ========================================================================== */

export function conveyorBelt(opts = {}) {
  const { size = texSize(256), seed = 15 } = opts;
  const S = size;
  const sd = hashStr(`belt${seed}`);

  const height = heightField(S, (u, v) => {
    // Cleats across the belt: a raised bar every eighth of the tile.
    const cleat = Math.abs(((v * 8) % 1) - 0.5) * 2;
    let h = 0.44 + (cleat < 0.34 ? (0.34 - cleat) * 0.9 : 0);
    // The carcass weave, visible where the cover has worn through at the edges.
    const worn = Math.abs(u - 0.5) * 2;
    const weave = Math.sin(u * S * 0.5) * Math.sin(v * S * 0.5);
    h += weave * 0.05 * worn;
    h += (fbm(u * 24, v * 24, { octaves: 3, period: 24, seed: sd }) - 0.5) * 0.12;
    return h;
  });

  const hf = readHeight(height);
  const rand = makeRng(sd);
  const rubber = hexToRgb('#23201d');
  const polish = hexToRgb('#3c3631');

  const alb = paint(S, (u, v, i) => {
    const centre = 1 - Math.min(1, Math.abs(u - 0.5) * 2.6);
    let c = rgbLerp(rubber, polish, centre * 0.8 + hf.data[i] * 0.2);
    // Stone dust ground into the edges, where nothing rides to sweep it off.
    if (centre < 0.25) c = rgbLerp(c, [0x6b, 0x5e, 0x4c], (0.25 - centre) * 1.6);
    const grain = (rand() - 0.5) * 7;
    return [c[0] + grain, c[1] + grain, c[2] + grain];
  });

  return {
    albedo: alb,
    height,
    roughness: heightToRoughness(height, { lo: 0.6, hi: 0.95 }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 7), strength: 1.0 }),
    normalStrength: 1.8
  };
}

/** Every generator above, by name, so a caller can build a set in one loop. */
export const LIGAR_SURFACES = {
  'column': basaltColumn,
  'pavement': basaltPavement,
  'scoria': scoriaGrit,
  'tube': lavaTubeWall,
  'belt': conveyorBelt
};
