/**
 * bench-bay.js — The one contract every Learn bench is built to, in every world.
 *
 * A bench is 4.8 x 1.3 m of plate at 0.95 m, because the instrument that deploys
 * on it lays out up to four stations at 0.92 m centres and a station is 0.72 m
 * across its tray (`bench3d.js`). What a world builds AROUND the bench is its own
 * business, so long as it leaves the BAY clear: the volume the plate, the
 * deployed instrument, the bench's screens and the camera need.
 *
 * THE BENCH FRAME. Origin on the floor under the middle of the plate; +z is the
 * FRONT (the side the player walks in from, derived from `approachPos`), +x is
 * to the player's right, y is up. A host that places the bench at site-frame
 * z = `BENCH_Z` is the older convention (room behind it for a shelter); a host
 * built round the bench places it wherever its equipment wants it.
 *
 * TWO THINGS LIVE HERE.
 *   - `BENCH_BAY` / `bayBoxes()`: the dimensions and the clearance volumes.
 *     `verify:bench` measures every world body against them, in all five worlds.
 *   - `buildBayBench()`: the one builder for the plate, its frame, the dormant
 *     (cased-up) instrument slot, the key rail and the completion indicator.
 *     A `skin` changes only the frame's dress; dimensions and anchor never vary.
 *     What the cased instrument looks like is the world's: it passes `dormant`.
 */

import * as THREE from 'three';
import { placard } from './materials/pbr-kit.js';

/** The plate. `BenchViewer3D` lays its stations and key bank out against these. */
export const BENCH_BAY = Object.freeze({
  width: 4.8,
  depth: 1.3,
  height: 0.95,
  /** Where the bench stands in a SHELTER-style site frame (local z), leaving room behind it. */
  benchZ: 1.5
});

/** The top of the plate above the floor (the plate is 0.09 thick, centred on `height`). */
export const PLATE_TOP = BENCH_BAY.height + 0.045;

/**
 * The frame the screens are expressed in sits this far above the floor under the
 * bench: `createBenchAnchor` puts it at `topY - 0.895`, and `topY` is `PLATE_TOP`.
 */
export const PANEL_FRAME_Y = PLATE_TOP - 0.895;

/**
 * The clearance volumes, in the bench frame: `{ min: [x, y, z], max: [x, y, z] }`.
 * No world body may enter one (bodies belonging to the bench itself are exempt).
 *
 *   plate     the bench body, floor to plate top.
 *   work      the cased instrument or the deployed stations, and the air over them.
 *             Measured, not guessed: across every instrument on every bench the
 *             deployed stations, key bank and readings board reach x +-2.63,
 *             z -0.53..0.65 and 1.82 m above the floor (`verify:bench` asserts the
 *             volume contains that), so it is 2.7 m either side and 2.4 m high.
 *             The shelters that stood here had roofs at 3.0-3.6 m; a host may
 *             put machinery above this, a lamp or a pipe run, but not into it.
 *   panels    the volume the frame's four CSS3D screens occupy (derived from
 *             `PANEL_LAYOUT`, which `verify:bench` asserts this contains). They draw
 *             over WebGL, so one never goes behind rock, but it would look as if
 *             it floated through a wall.
 *   behind    nothing nearer behind the plate than 1.95 m: the shelters' own limit
 *             (their back walls stood at z = -3.1), kept so the screens and the
 *             camera's far aspects have air behind them.
 *   approach  open ground in front of the plate where the camera stands and the
 *             player walks in, from the plate's front edge out ~4.4 m.
 */
export const WORK_TOP = 2.4;
/** Half the width of the work and behind volumes: the instrument's reach plus a hand's margin. */
const WORK_HALF = 2.7;

export function bayBoxes() {
  const hw = BENCH_BAY.width / 2;
  const hd = BENCH_BAY.depth / 2;
  return {
    plate: { min: [-hw, 0, -hd], max: [hw, PLATE_TOP, hd] },
    work: { min: [-WORK_HALF, PLATE_TOP, -hd], max: [WORK_HALF, WORK_TOP, hd] },
    panels: { min: [-1.4, PANEL_FRAME_Y + 0.85, -0.9], max: [1.4, PANEL_FRAME_Y + 1.8, -0.38] },
    behind: { min: [-WORK_HALF, 0.3, -1.95], max: [WORK_HALF, WORK_TOP, -hd] },
    approach: { min: [-hw, 0.3, hd], max: [hw, 2.2, hd + 4.4] }
  };
}

/** The skins a bench can wear. The plate and the anchor are identical under all of them. */
export const BENCH_SKINS = Object.freeze(['shelf', 'desk', 'deck', 'ledge']);

/** The materials a world supplies. `ctxMats` reads them off a `ctx.M` world; Tallow and Ligar pass their own. */
export function ctxMats(ctx) {
  return { top: ctx.M.steel, dark: ctx.M.darkSteel };
}

/* ------------------------------------------------------------------ frames */

function box(k, w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(k.own(new THREE.BoxGeometry(w, h, d)), mat);
  m.position.set(x, y, z);
  return m;
}

/** The plated top and the lip along its back, shared by every skin. */
function plateTop(g, k, lip) {
  const { width, depth, height } = BENCH_BAY;
  const top = box(k, width, 0.09, depth, k.mats.top, 0, height, 0);
  top.castShadow = top.receiveShadow = k.t4;
  g.add(top);
  g.add(box(k, width, lip.h, 0.06, k.mats.dark, 0, height + lip.dy, -depth / 2 + 0.03));
}

/** Four braced legs on footplates, a cross brace and an under-bench shelf: the light frame. */
function lightFrame(g, k) {
  const { width, depth, height } = BENCH_BAY;
  const legGeo = k.own(new THREE.BoxGeometry(0.1, height, 0.1));
  for (const [lx, lz] of [
    [-width / 2 + 0.12, -depth / 2 + 0.1], [width / 2 - 0.12, -depth / 2 + 0.1],
    [-width / 2 + 0.12, depth / 2 - 0.1], [width / 2 - 0.12, depth / 2 - 0.1]
  ]) {
    const leg = new THREE.Mesh(legGeo, k.mats.dark);
    leg.position.set(lx, height / 2, lz);
    leg.castShadow = k.t4;
    g.add(leg);
    g.add(box(k, 0.2, 0.03, 0.2, k.mats.dark, lx, 0.015, lz));
  }
  g.add(box(k, width - 0.3, 0.06, 0.06, k.mats.dark, 0, height * 0.32, 0));
  g.add(box(k, width - 0.35, 0.05, depth - 0.3, k.mats.dark, 0, height * 0.42, 0));
}

/**
 * Dress per skin. Each adds to its own frame and nothing else, and none leaves the
 * plate's footprint by more than 0.1 m (`verify:bench` builds all four and measures).
 */
const SKINS = {
  /** Today's bench on four worlds: a sampling shelf, light frame, bare. */
  shelf(g, k) {
    plateTop(g, k, { h: 0.12, dy: 0.1 });
    lightFrame(g, k);
  },

  /** A control desk: the light frame behind a closed front, with cheek panels at the ends. */
  desk(g, k) {
    const { width, depth, height } = BENCH_BAY;
    plateTop(g, k, { h: 0.12, dy: 0.1 });
    lightFrame(g, k);
    g.add(box(k, width - 0.6, 0.5, 0.03, k.mats.dark, 0, height - 0.32, depth / 2 - 0.04));
    for (const sx of [-1, 1]) g.add(box(k, 0.03, 0.62, depth - 0.34, k.mats.dark, sx * (width / 2 - 0.3), height * 0.55, 0));
    // The sloped fascia under the plate's front edge, where the controls would sit. It stays
    // below the plate's top: a deployed instrument's trays come down to the plate's front edge.
    const fascia = box(k, width - 0.9, 0.3, 0.03, k.mats.top, 0, height - 0.22, depth / 2 - 0.02);
    fascia.rotation.x = -0.35;
    g.add(fascia);
  },

  /** A grated inspection deck: the light frame on a floor of grating, toe boards on the open edges. */
  deck(g, k) {
    const { width, depth, height } = BENCH_BAY;
    plateTop(g, k, { h: 0.12, dy: 0.1 });
    lightFrame(g, k);
    g.add(box(k, width, 0.03, depth + 0.2, k.mats.dark, 0, 0.015, 0));
    for (let i = 0; i < 12; i++) g.add(box(k, 0.03, 0.03, depth + 0.2, k.mats.top, -width / 2 + 0.2 + i * (width - 0.4) / 11, 0.045, 0));
    for (const sz of [-1, 1]) g.add(box(k, width, 0.12, 0.025, k.mats.dark, 0, 0.09, sz * (depth / 2 + 0.07)));
  },

  /**
   * A rock-bolted steel ledge: channel legs bolted down onto two cut stone plinths,
   * gussets at the knee, and two crates of sample stone on the lower shelf. Needs
   * `mats.stone` and `mats.timber`. Today's Ligar bench.
   */
  ledge(g, k) {
    const { width, depth, height } = BENCH_BAY;
    for (const px of [-width / 2 + 0.55, width / 2 - 0.55]) {
      const block = box(k, 0.72, 0.34, depth + 0.16, k.mats.stone, px, 0.17, 0);
      block.receiveShadow = block.castShadow = k.t4;
      g.add(block);
    }
    plateTop(g, k, { h: 0.14, dy: 0.11 });
    const legGeo = k.own(new THREE.BoxGeometry(0.14, height - 0.34, 0.14));
    for (const [lx, lz] of [
      [-width / 2 + 0.16, -depth / 2 + 0.12], [width / 2 - 0.16, -depth / 2 + 0.12],
      [-width / 2 + 0.16, depth / 2 - 0.12], [width / 2 - 0.16, depth / 2 - 0.12]
    ]) {
      const leg = new THREE.Mesh(legGeo, k.mats.dark);
      leg.position.set(lx, 0.34 + (height - 0.34) / 2, lz);
      leg.castShadow = k.t4;
      g.add(leg);
      g.add(box(k, 0.26, 0.04, 0.26, k.mats.top, lx, 0.36, lz));
      // The gusset where the leg meets the top: a triangle, so it is bracing rather than decoration.
      const gusset = box(k, 0.02, 0.2, 0.2, k.mats.dark, lx, height - 0.14, lz);
      gusset.rotation.x = Math.sign(lz) * 0.78;
      g.add(gusset);
    }
    g.add(box(k, width - 0.36, 0.08, 0.08, k.mats.dark, 0, height * 0.42, 0));
    g.add(box(k, width - 0.4, 0.05, depth - 0.3, k.mats.dark, 0, height * 0.52, 0));
    for (const sx of [-width * 0.28, width * 0.22]) {
      g.add(box(k, 0.44, 0.3, 0.44, k.mats.timber, sx, height * 0.52 + 0.18, 0));
      g.add(box(k, 0.46, 0.05, 0.46, k.mats.dark, sx, height * 0.52 + 0.3, 0));
    }
  }
};

/* ------------------------------------------------------------------- bench */

/**
 * The bench: plated top, a frame in the host's skin, the cased instrument slot,
 * the tool rail and the one completion indicator set into the apron.
 *
 * @param {{ own: Function, t4: boolean }} ctx
 * @param {object} opts
 * @param {'shelf'|'desk'|'deck'|'ledge'} [opts.skin]
 * @param {string} [opts.plate]       the plate number riveted to the apron
 * @param {{top: object, dark: object, stone?: object, timber?: object}} opts.mats
 * @param {(dormant: THREE.Group, bay: object) => void} [opts.dormant]
 *        dresses the cased instrument: the world's own, built into the group
 *        that is hidden while the instrument is deployed
 * @param {{len: number, x: number, y: number, r: number, tools?: number[][]}|null} [opts.rail]
 *        the key rail every instrument carries; `null` for none
 * @param {{inset: number, drop: number}} [opts.apron] where the indicator and plate number sit
 * @param {number} [opts.lampColor]   the indicator's emissive colour
 * @param {{fg: string, bg: string}} [opts.tagStyle]
 * @param {boolean} [opts.noWeather]  keep weathering passes off the indicator
 * @param {(g: THREE.Group, bay: object) => void} [opts.extras]
 *        a world's small parts (vice, rag, chips...), added last
 * @returns {{group: THREE.Group, indicator: THREE.Mesh, dormant: THREE.Group, topY: number}}
 */
export function buildBayBench(ctx, opts) {
  const {
    skin = 'shelf', plate = 'BN-01', mats, dormant: dress = null,
    rail = { len: 0.9, x: -0.58, y: 0.34, r: 0.016 },
    apron = { inset: 0.42, drop: 0.12 }, lampColor = 0xd99423, tagStyle = null, noWeather = false,
    extras = null
  } = opts;
  if (!SKINS[skin]) throw new Error(`buildBayBench: unknown skin "${skin}"`);
  const { width, depth, height } = BENCH_BAY;
  const k = { own: ctx.own, t4: ctx.t4, mats };
  const g = new THREE.Group();
  const bay = { ...BENCH_BAY, topY: PLATE_TOP, own: ctx.own, t4: ctx.t4, mats };

  SKINS[skin](g, k);

  // THE DORMANT INSTRUMENT, cased up and held out of any bake: the whole subtree
  // is hidden while the instrument is deployed, so the two are never drawn at once.
  const dormant = new THREE.Group();
  dormant.userData.noMerge = true;
  g.add(dormant);
  if (dress) dress(dormant, bay);

  if (rail) {
    const bar = new THREE.Mesh(k.own(new THREE.CylinderGeometry(rail.r, rail.r, rail.len, 8)), mats.dark);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(rail.x, height + rail.y, -0.3);
    g.add(bar);
    for (const [tx, tl] of rail.tools || []) {
      g.add(box(k, 0.05, tl, 0.035, mats.dark, tx, height + rail.y - tl / 2 - 0.02, -0.3));
    }
  }

  // THE ONE INDICATOR, set into the APRON, not the cabinet face: the cabinet is
  // cased up while the instrument is deployed, and a lamp that vanished the moment
  // you started working would be attached to nothing. Dead until the quest is done.
  const ix = width / 2 - apron.inset;
  const iy = height - apron.drop;
  const indicator = new THREE.Mesh(
    ctx.own(new THREE.SphereGeometry(0.035, 10, 8)),
    ctx.own(new THREE.MeshStandardMaterial({ color: 0x4a4038, emissive: lampColor, emissiveIntensity: 0, roughness: 0.6 }))
  );
  indicator.position.set(ix, iy, depth / 2 + 0.035);
  indicator.userData.noMerge = true;     // its emissive changes on completion
  if (noWeather) indicator.userData.noWeather = true;
  g.add(indicator);
  const well = new THREE.Mesh(ctx.own(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12)), mats.dark);
  well.rotation.x = Math.PI / 2;
  well.position.set(ix, iy, depth / 2 + 0.018);
  g.add(well);

  const tag = placard(plate, { w: 0.28, h: 0.11, ...(tagStyle || {}) });
  tag.position.set(-width / 2 + apron.inset, iy, depth / 2 + 0.005);
  g.add(tag);
  ctx.own(tag.geometry, tag.material, tag.material.map);

  if (extras) extras(g, bay);

  return { group: g, indicator, dormant, topY: PLATE_TOP };
}
