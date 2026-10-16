/**
 * ember/sites.js — The seven benches and the shelters they stand in.
 *
 * Every site is the same bench under the same heat-shield shelter, and what
 * stands behind the bench says which one it is: two blocks clamped together
 * with a thermometer in each at the first; a lagged water bath with its
 * stirrer at the second; a cage of fuel canisters and a burner at the third; a
 * cracking coil over a vent grate at the fourth; a sealed straight shaft beside
 * a stepped route of pipe at the fifth; two glass bulbs and a stopcock at the
 * sixth; a furnace beside a balance at the seventh. A player choosing a bench
 * should not have to enter it to find out what it is.
 *
 * THE SITE FRAME, the same as every walkable world's: local +z is the FRONT,
 * the side a player walks in from; the bench stands at local z = +1.5 so there
 * is room behind it, and the world turns the group to face its `approachPos`.
 * The envelope (posts at x = +-3, z = -1.55 and 2.95, roof above 3.3 m, nothing
 * behind the bench nearer than z = -0.45) is the one the built instruments are
 * measured against on every other world, so they frame identically here.
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the
 * calorimeter, cased up: an insulated cup with a thermometer through its lid,
 * a stirrer, and the housing with its dial. Pressing [E] hides it and deploys
 * the stations on the same plate: one object, two states.
 */

import * as THREE from 'three';
import { placard } from '../materials/pbr-kit.js';
import { part, put, between, strut } from './kit.js';

export const BENCH = { width: 4.8, depth: 1.3, height: 0.95 };
/** Where the bench stands in the site frame (local z), leaving room behind it. */
export const BENCH_Z = 1.5;

const lampColor = 0xd99423;

function mesh(ctx, geo, mat, x = 0, y = 0, z = 0) {
  return part(ctx, geo, mat, x, y, z);
}

/** The bench: plated top, braced legs, the cased calorimeter and its one indicator. */
export function buildErBench(ctx, { plate = 'CAL-01' } = {}) {
  const { width, depth, height } = BENCH;
  const g = new THREE.Group();

  const top = mesh(ctx, new THREE.BoxGeometry(width, 0.09, depth), ctx.M.steel, 0, height, 0);
  top.castShadow = top.receiveShadow = ctx.t4;
  g.add(top);
  g.add(mesh(ctx, new THREE.BoxGeometry(width, 0.12, 0.06), ctx.M.darkSteel, 0, height + 0.1, -depth / 2 + 0.03));

  const legGeo = ctx.own(new THREE.BoxGeometry(0.1, height, 0.1));
  for (const [lx, lz] of [
    [-width / 2 + 0.12, -depth / 2 + 0.1], [width / 2 - 0.12, -depth / 2 + 0.1],
    [-width / 2 + 0.12, depth / 2 - 0.1], [width / 2 - 0.12, depth / 2 - 0.1]
  ]) {
    const leg = new THREE.Mesh(legGeo, ctx.M.darkSteel);
    leg.position.set(lx, height / 2, lz);
    leg.castShadow = ctx.t4;
    g.add(leg);
    g.add(mesh(ctx, new THREE.BoxGeometry(0.2, 0.03, 0.2), ctx.M.darkSteel, lx, 0.015, lz));
  }
  g.add(mesh(ctx, new THREE.BoxGeometry(width - 0.3, 0.06, 0.06), ctx.M.darkSteel, 0, height * 0.32, 0));
  g.add(mesh(ctx, new THREE.BoxGeometry(width - 0.35, 0.05, depth - 0.3), ctx.M.darkSteel, 0, height * 0.42, 0));

  // THE DORMANT INSTRUMENT, cased up and held out of any bake: the whole subtree
  // is hidden while the instrument is deployed.
  const dormant = new THREE.Group();
  dormant.userData.noMerge = true;
  g.add(dormant);
  const housing = mesh(ctx, new THREE.BoxGeometry(1.2, 0.62, 0.46), ctx.M.steel, -0.35, height + 0.355, -0.2);
  housing.castShadow = housing.receiveShadow = ctx.t4;
  dormant.add(housing);
  // The dial on the housing's face.
  put(dormant, mesh(ctx, new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), ctx.M.brass, -0.62, height + 0.42, 0.05), Math.PI / 2, 0, 0);
  dormant.add(mesh(ctx, new THREE.CircleGeometry(0.13, 22), ctx.M.glassDark, -0.62, height + 0.42, 0.072));
  // The cup: lagged, banded, lidded, with the thermometer through the lid and the stirrer beside it.
  const cupY = height + 0.045;
  dormant.add(mesh(ctx, new THREE.CylinderGeometry(0.2, 0.2, 0.44, 22), ctx.M.insul, 0.55, cupY + 0.22, 0.12));
  for (const y of [0.08, 0.36]) dormant.add(mesh(ctx, new THREE.CylinderGeometry(0.208, 0.208, 0.035, 22), ctx.M.darkSteel, 0.55, cupY + y, 0.12));
  dormant.add(mesh(ctx, new THREE.CylinderGeometry(0.22, 0.22, 0.05, 22), ctx.M.darkSteel, 0.55, cupY + 0.465, 0.12));
  dormant.add(mesh(ctx, new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), ctx.M.glass, 0.5, cupY + 0.66, 0.08));
  dormant.add(mesh(ctx, new THREE.SphereGeometry(0.022, 8, 6), ctx.M.brass, 0.5, cupY + 0.88, 0.08));
  dormant.add(mesh(ctx, new THREE.CylinderGeometry(0.008, 0.008, 0.34, 6), ctx.M.darkSteel, 0.62, cupY + 0.62, 0.17));
  dormant.add(mesh(ctx, new THREE.TorusGeometry(0.04, 0.008, 5, 12).rotateX(Math.PI / 2), ctx.M.darkSteel, 0.62, cupY + 0.79, 0.17));
  // The key rail every instrument carries on its housing.
  const rail = mesh(ctx, new THREE.CylinderGeometry(0.016, 0.016, 0.9, 8), ctx.M.darkSteel, -0.58, height + 0.34, -0.3);
  rail.rotation.z = Math.PI / 2;
  g.add(rail);

  // The one indicator, set into the apron: dead until the site's quest is finished.
  const indicator = new THREE.Mesh(
    ctx.own(new THREE.SphereGeometry(0.035, 10, 8)),
    ctx.own(new THREE.MeshStandardMaterial({ color: 0x4a4038, emissive: lampColor, emissiveIntensity: 0, roughness: 0.6 }))
  );
  indicator.position.set(width / 2 - 0.42, height - 0.12, depth / 2 + 0.035);
  indicator.userData.noMerge = true;
  g.add(indicator);
  const well = mesh(ctx, new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12), ctx.M.darkSteel, width / 2 - 0.42, height - 0.12, depth / 2 + 0.018);
  well.rotation.x = Math.PI / 2;
  g.add(well);

  const tag = placard(plate, { w: 0.28, h: 0.11, fg: '#1e1a14', bg: '#d8c9a2' });
  tag.position.set(-width / 2 + 0.42, height - 0.12, depth / 2 + 0.005);
  g.add(tag);
  ctx.own(tag.geometry, tag.material, tag.material.map);

  return { group: g, indicator, dormant, topY: height + 0.045 };
}

/* ------------------------------------------------------------------ shelter */

/**
 * The shelter every site shares: four I-section posts clear of the bench's
 * ends, a raked heat-shield roof of ribbed sheet, a back wall of perforated
 * plate with an insulated header pipe along its top, half-height side shields
 * and a concrete slab under all of it. Returns the post positions.
 */
function buildShelter(ctx, g) {
  const slab = mesh(ctx, new THREE.BoxGeometry(6.8, 0.06, 5.2), ctx.M.concrete, 0, 0.0, 0.7);
  slab.userData.phys = 'ground';
  slab.receiveShadow = ctx.t4;
  g.add(slab);

  const posts = [];
  for (const x of [-3.0, 3.0]) {
    for (const z of [-1.55, 2.95]) {
      const H = z > 0 ? 3.62 : 3.32;
      g.add(mesh(ctx, new THREE.BoxGeometry(0.06, H, 0.18), ctx.M.steel, x, H / 2, z));
      for (const dx of [-0.08, 0.08]) g.add(mesh(ctx, new THREE.BoxGeometry(0.03, H, 0.22), ctx.M.steel, x + dx, H / 2, z));
      g.add(mesh(ctx, new THREE.BoxGeometry(0.34, 0.04, 0.34), ctx.M.darkSteel, x, 0.05, z));
      posts.push([x, z]);
    }
  }
  // The beams and the roof, raked up toward the front so a player walking in sees under it.
  const rake = Math.atan2(0.3, 4.5);
  for (const x of [-3.0, 3.0]) {
    const beam = mesh(ctx, new THREE.BoxGeometry(0.16, 0.18, 4.9), ctx.M.darkSteel, x, 3.47 + 0.03, 0.7);
    beam.rotation.x = -rake;
    g.add(beam);
  }
  g.add(mesh(ctx, new THREE.BoxGeometry(6.3, 0.18, 0.16), ctx.M.darkSteel, 0, 3.31, -1.55));
  g.add(mesh(ctx, new THREE.BoxGeometry(6.3, 0.22, 0.16), ctx.M.darkSteel, 0, 3.62, 2.95));
  const roof = mesh(ctx, new THREE.BoxGeometry(6.5, 0.05, 5.0), ctx.M.roofSheet, 0, 3.62, 0.7);
  roof.rotation.x = -rake;
  roof.castShadow = ctx.t4;
  g.add(roof);
  for (let i = -6; i <= 6; i++) {
    const rib = mesh(ctx, new THREE.BoxGeometry(0.05, 0.06, 5.0), ctx.M.roofSheet, i * 0.5, 3.67, 0.7);
    rib.rotation.x = -rake;
    g.add(rib);
  }
  // The back wall: perforated plate in panels, with a rail at the top.
  for (let i = -2; i <= 2; i++) {
    g.add(mesh(ctx, new THREE.BoxGeometry(1.16, 2.7, 0.05), ctx.M.perf, i * 1.2, 1.45, -1.6));
  }
  g.add(mesh(ctx, new THREE.BoxGeometry(6.0, 0.12, 0.1), ctx.M.darkSteel, 0, 2.86, -1.6));
  // The header: an insulated steam line along the top of the back wall, with its flanges and a gauge.
  g.add(between(ctx, [-2.9, 3.06, -1.4], [2.9, 3.06, -1.4], 0.11, ctx.M.insul, 12));
  for (const x of [-2.0, 0, 2.0]) put(g, mesh(ctx, new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12), ctx.M.darkSteel, x, 3.06, -1.4), 0, 0, Math.PI / 2);
  g.add(between(ctx, [2.4, 3.0, -1.4], [2.4, 2.7, -1.4], 0.02, ctx.M.darkSteel, 6));
  put(g, mesh(ctx, new THREE.CylinderGeometry(0.09, 0.09, 0.04, 14), ctx.M.brass, 2.4, 2.62, -1.36), Math.PI / 2, 0, 0);
  // Side shields, half height, so a player can see in from the side and the sun stays off the plate.
  for (const x of [-3.0, 3.0]) {
    g.add(mesh(ctx, new THREE.BoxGeometry(0.04, 1.3, 2.9), ctx.M.perf, x, 0.85, -0.05));
  }
  return posts;
}

/* ---- what stands behind each bench ---- */

function dialOnWall(ctx, g, x, y, z, r = 0.6) {
  put(g, mesh(ctx, new THREE.CylinderGeometry(r, r, 0.1, 36), ctx.M.brass, x, y, z), Math.PI / 2, 0, 0);
  put(g, mesh(ctx, new THREE.CylinderGeometry(r * 0.88, r * 0.88, 0.04, 36), ctx.M.glassDark, x, y, z + 0.05), Math.PI / 2, 0, 0);
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * 0.8 + (i / 12) * Math.PI * 1.4;
    const tick = mesh(ctx, new THREE.BoxGeometry(0.025, i % 3 === 0 ? 0.13 : 0.07, 0.02), ctx.M.paint2, x + Math.cos(a) * r * 0.74, y - Math.sin(a) * r * 0.74, z + 0.08);
    tick.rotation.z = a + Math.PI / 2;
    g.add(tick);
  }
  const needle = mesh(ctx, new THREE.BoxGeometry(0.03, r * 0.7, 0.015), ctx.M.paintRed, x + r * 0.16, y + r * 0.16, z + 0.09);
  needle.rotation.z = -0.8;
  g.add(needle);
  g.add(mesh(ctx, new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10).rotateX(Math.PI / 2), ctx.M.darkSteel, x, y, z + 0.1));
}

function thermometerStem(ctx, g, x, y0, z, h = 0.9) {
  g.add(mesh(ctx, new THREE.CylinderGeometry(0.022, 0.022, h, 8), ctx.M.glass, x, y0 + h / 2, z));
  g.add(mesh(ctx, new THREE.CylinderGeometry(0.008, 0.008, h * 0.6, 6), ctx.M.paintRed, x, y0 + h * 0.3, z));
  g.add(mesh(ctx, new THREE.CylinderGeometry(0.04, 0.04, 0.06, 10), ctx.M.brass, x, y0 + h + 0.03, z));
}

const DECOR = {
  /** Two blocks clamped face to face, a thermometer in each, and a wall dial behind them. */
  'contact-hut'(ctx, g) {
    g.add(mesh(ctx, new THREE.BoxGeometry(2.4, 0.07, 0.8), ctx.M.darkSteel, -1.4, 0.85, -0.95));
    for (const [x, z] of [[-2.5, -1.25], [-0.3, -1.25], [-2.5, -0.65], [-0.3, -0.65]]) g.add(mesh(ctx, new THREE.BoxGeometry(0.07, 0.85, 0.07), ctx.M.darkSteel, x, 0.42, z));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.7, 0.5, 0.5), ctx.M.rusted, -1.75, 1.14, -0.95));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.7, 0.5, 0.5), ctx.M.copper, -1.05, 1.14, -0.95));
    // The clamp across both.
    g.add(mesh(ctx, new THREE.BoxGeometry(1.6, 0.06, 0.08), ctx.M.steel, -1.4, 1.43, -0.95));
    for (const x of [-2.18, -0.62]) g.add(mesh(ctx, new THREE.BoxGeometry(0.06, 0.36, 0.08), ctx.M.steel, x, 1.25, -0.95));
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), ctx.M.darkSteel, -1.4, 1.58, -0.95), 0, 0, 0);
    thermometerStem(ctx, g, -1.85, 1.39, -1.05);
    thermometerStem(ctx, g, -0.95, 1.39, -1.05);
    dialOnWall(ctx, g, 1.5, 1.85, -1.55, 0.62);
  },
  /** A lagged water bath with its stirrer, and a weighing platform with a jug on it. */
  'bath-house'(ctx, g) {
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.62, 0.62, 1.25, 28), ctx.M.insul, -1.7, 0.66, -0.95));
    for (const y of [0.18, 0.66, 1.14]) g.add(mesh(ctx, new THREE.CylinderGeometry(0.635, 0.635, 0.06, 28), ctx.M.darkSteel, -1.7, y, -0.95));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.66, 0.66, 0.08, 28), ctx.M.darkSteel, -1.7, 1.33, -0.95));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.14, 0.16, 0.34, 14), ctx.M.steel, -1.85, 1.54, -0.95));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), ctx.M.darkSteel, -1.85, 1.9, -0.95));
    thermometerStem(ctx, g, -1.45, 1.37, -0.85, 0.8);
    g.add(mesh(ctx, new THREE.BoxGeometry(0.9, 0.12, 0.7), ctx.M.steel, 1.4, 0.06, -0.95));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.8, 0.04, 0.6), ctx.M.darkSteel, 1.4, 0.14, -0.95));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), ctx.M.darkSteel, 1.85, 0.6, -1.25));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.28, 0.2, 0.08), ctx.M.steel, 1.85, 1.1, -1.25));
    g.add(mesh(ctx, new THREE.CircleGeometry(0.08, 14), ctx.M.glassDark, 1.85, 1.1, -1.205));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.17, 0.15, 0.4, 16), ctx.M.glass, 1.3, 0.36, -0.95));
    g.add(between(ctx, [-2.6, 2.4, -1.45], [-2.6, 1.0, -1.45], 0.05, ctx.M.steel));
    g.add(between(ctx, [-2.6, 1.0, -1.45], [-2.25, 1.0, -1.1], 0.05, ctx.M.steel));
  },
  /** A cage of three fuel canisters, and a burner on a tripod under a pot. */
  'fuel-store'(ctx, g) {
    for (const [i, x] of [-2.4, -1.75, -1.1].entries()) {
      const mat = [ctx.M.paintYellow, ctx.M.paintRed, ctx.M.steel][i];
      g.add(mesh(ctx, new THREE.CylinderGeometry(0.26, 0.26, 1.15, 20), mat, x, 0.6, -1.0));
      g.add(mesh(ctx, new THREE.SphereGeometry(0.26, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, 1.17, -1.0));
      g.add(mesh(ctx, new THREE.CylinderGeometry(0.06, 0.07, 0.16, 10), ctx.M.brass, x, 1.48, -1.0));
      g.add(mesh(ctx, new THREE.CylinderGeometry(0.27, 0.27, 0.05, 20), ctx.M.darkSteel, x, 0.9, -1.0));
    }
    // The cage.
    for (const x of [-2.75, -0.75]) for (const z of [-1.4, -0.6]) g.add(mesh(ctx, new THREE.BoxGeometry(0.05, 1.7, 0.05), ctx.M.darkSteel, x, 0.85, z));
    for (const y of [0.4, 1.0, 1.65]) {
      g.add(mesh(ctx, new THREE.BoxGeometry(2.05, 0.04, 0.04), ctx.M.darkSteel, -1.75, y, -0.6));
      g.add(mesh(ctx, new THREE.BoxGeometry(2.05, 0.04, 0.04), ctx.M.darkSteel, -1.75, y, -1.4));
    }
    // The burner.
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      g.add(between(ctx, [1.5 + Math.cos(a) * 0.4, 0.02, -1.0 + Math.sin(a) * 0.4], [1.5 + Math.cos(a) * 0.22, 0.85, -1.0 + Math.sin(a) * 0.22], 0.025, ctx.M.darkSteel, 6));
    }
    g.add(mesh(ctx, new THREE.TorusGeometry(0.24, 0.025, 6, 18).rotateX(Math.PI / 2), ctx.M.darkSteel, 1.5, 0.86, -1.0));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.2, 0.18, 0.3, 18), ctx.M.copper, 1.5, 1.04, -1.0));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), ctx.M.rusted, 1.5, 0.6, -1.0));
    g.add(between(ctx, [1.5, 0.6, -1.0], [2.4, 0.3, -1.3], 0.02, ctx.M.rubber, 6));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.5, 0.35, 0.2), ctx.M.steel, 2.4, 0.3, -1.38));
  },
  /** A coil of tube over a vent grate, under a hood, and two gauges on the wall. */
  'cracking-coil'(ctx, g) {
    const cx = -1.3, cz = -0.95, R = 0.42;
    let prev = null;
    for (let i = 0; i <= 96; i++) {
      const t = i / 96;
      const a = t * Math.PI * 2 * 6;
      const p = [cx + Math.cos(a) * R, 0.7 + t * 1.0, cz + Math.sin(a) * R];
      if (prev) g.add(between(ctx, prev, p, 0.035, ctx.M.copper, 6));
      prev = p;
    }
    for (const [x, z] of [[cx - 0.55, cz - 0.4], [cx + 0.55, cz - 0.4], [cx - 0.55, cz + 0.4], [cx + 0.55, cz + 0.4]]) {
      g.add(mesh(ctx, new THREE.BoxGeometry(0.05, 2.2, 0.05), ctx.M.darkSteel, x, 1.1, z));
    }
    // The grate it hangs over.
    g.add(mesh(ctx, new THREE.BoxGeometry(1.3, 0.1, 0.9), ctx.M.rusted, cx, 0.05, cz));
    for (let k = 0; k < 7; k++) g.add(mesh(ctx, new THREE.BoxGeometry(1.2, 0.03, 0.05), ctx.M.darkSteel, cx, 0.12, cz - 0.36 + k * 0.12));
    // The hood and its flue.
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.22, 0.62, 0.45, 20, 1, true), ctx.M.steel, cx, 2.45, cz));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.16, 0.16, 0.6, 12), ctx.M.rusted, cx, 2.95, cz));
    dialOnWall(ctx, g, 0.9, 1.9, -1.55, 0.36);
    dialOnWall(ctx, g, 1.9, 1.9, -1.55, 0.36);
    g.add(between(ctx, [0.9, 1.5, -1.45], [1.9, 1.5, -1.45], 0.03, ctx.M.brass, 6));
  },
  /** A straight shaft, capped and sealed, beside a stepped route of pipe to the same depth. */
  'flue-route'(ctx, g) {
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.28, 0.28, 2.9, 18), ctx.M.rusted, -2.35, 1.45, -1.05));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.4, 0.4, 0.1, 18), ctx.M.paintRed, -2.35, 2.95, -1.05));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.2, 0.22, 0.1), ctx.M.brass, -2.35, 2.6, -0.73));
    const route = [[2.6, 2.75], [2.6, 2.15], [1.3, 2.15], [1.3, 1.45], [0.0, 1.45], [0.0, 0.75], [-1.3, 0.75], [-1.3, 0.15]];
    for (let i = 0; i < route.length - 1; i++) {
      const [ax, ay] = route[i], [bx, by] = route[i + 1];
      g.add(between(ctx, [ax, ay, -1.2], [bx, by, -1.2], 0.1, ctx.M.clad, 12));
      g.add(mesh(ctx, new THREE.SphereGeometry(0.105, 10, 8), ctx.M.clad, bx, by, -1.2));
    }
    // Level plates on the wall at each landing.
    for (const [x, y] of [[2.6, 2.15], [1.3, 1.45], [0.0, 0.75]]) {
      g.add(mesh(ctx, new THREE.BoxGeometry(0.5, 0.05, 0.02), ctx.M.paint2, x - 0.65, y + 0.2, -1.56));
    }
    for (let k = 0; k < 9; k++) g.add(mesh(ctx, new THREE.BoxGeometry(k % 2 ? 0.12 : 0.22, 0.025, 0.02), ctx.M.paint2, 2.95, 0.3 + k * 0.3, -1.56));
  },
  /** Two glass bulbs joined through a stopcock on a stand, a pump and its gauge beside them. */
  'expansion-cell'(ctx, g) {
    g.add(mesh(ctx, new THREE.BoxGeometry(2.4, 0.07, 0.7), ctx.M.darkSteel, -1.3, 0.95, -0.95));
    for (const [x, z] of [[-2.4, -1.22], [-0.2, -1.22], [-2.4, -0.68], [-0.2, -0.68]]) g.add(mesh(ctx, new THREE.BoxGeometry(0.06, 0.95, 0.06), ctx.M.darkSteel, x, 0.47, z));
    for (const x of [-1.95, -0.65]) {
      g.add(mesh(ctx, new THREE.SphereGeometry(0.42, 22, 16), ctx.M.glass, x, 1.62, -0.95));
      g.add(mesh(ctx, new THREE.CylinderGeometry(0.1, 0.12, 0.2, 12), ctx.M.brass, x, 1.1, -0.95));
      g.add(mesh(ctx, new THREE.TorusGeometry(0.43, 0.02, 5, 24).rotateX(Math.PI / 2), ctx.M.darkSteel, x, 1.62, -0.95));
    }
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.05, 0.05, 0.5, 10), ctx.M.glass, -1.3, 1.62, -0.95), 0, 0, Math.PI / 2);
    g.add(mesh(ctx, new THREE.BoxGeometry(0.16, 0.16, 0.16), ctx.M.brass, -1.3, 1.62, -0.95));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.04, 0.3, 0.04), ctx.M.paintRed, -1.3, 1.82, -0.95));
    // The pump.
    g.add(mesh(ctx, new THREE.BoxGeometry(0.8, 0.55, 0.5), ctx.M.steel, 1.4, 0.28, -1.0));
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.2, 0.2, 0.55, 14), ctx.M.darkSteel, 1.95, 0.32, -1.0), 0, 0, Math.PI / 2);
    g.add(between(ctx, [1.2, 0.56, -1.0], [-0.6, 1.08, -0.95], 0.02, ctx.M.rubber, 6));
    dialOnWall(ctx, g, 1.5, 1.6, -1.55, 0.34);
  },
  /** A small brick furnace with its door and dial, and a beam balance beside it. */
  'furnace-balance'(ctx, g) {
    g.add(mesh(ctx, new THREE.BoxGeometry(1.2, 1.3, 0.95), ctx.M.brick, -1.75, 0.65, -0.98));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.6, 0.55, 0.06), ctx.M.darkSteel, -1.75, 0.7, -0.48));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.08, 0.08, 0.1), ctx.M.brass, -1.5, 0.7, -0.44));
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.13, 0.13, 0.04, 18), ctx.M.brass, -2.15, 1.15, -0.49), Math.PI / 2, 0, 0);
    g.add(mesh(ctx, new THREE.CircleGeometry(0.1, 18), ctx.M.glassDark, -2.15, 1.15, -0.465));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.15, 0.17, 1.9, 12), ctx.M.rusted, -1.9, 2.25, -1.15));
    // The balance.
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.08, 0.14, 1.6, 10), ctx.M.darkSteel, 1.3, 0.8, -1.0));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.6, 0.06, 0.6), ctx.M.darkSteel, 1.3, 0.03, -1.0));
    const beam = mesh(ctx, new THREE.BoxGeometry(2.2, 0.07, 0.08), ctx.M.brass, 1.3, 1.64, -1.0);
    beam.rotation.z = 0.08;
    g.add(beam);
    for (const [x, y] of [[0.3, 1.56], [2.3, 1.72]]) {
      g.add(between(ctx, [x, y, -1.0], [x - 0.2, y - 0.5, -1.0], 0.008, ctx.M.darkSteel, 4));
      g.add(between(ctx, [x, y, -1.0], [x + 0.2, y - 0.5, -1.0], 0.008, ctx.M.darkSteel, 4));
      g.add(mesh(ctx, new THREE.CylinderGeometry(0.3, 0.25, 0.05, 18), ctx.M.brass, x, y - 0.52, -1.0));
    }
    g.add(mesh(ctx, new THREE.ConeGeometry(0.04, 0.12, 4), ctx.M.darkSteel, 1.3, 1.73, -1.0));
  }
};

/**
 * Build one site: the shelter, the bench under it and the sign over it.
 * @returns {{ group: THREE.Group, bench: object, benchLocal: number[], colliders: Array<{x:number,z:number,radius:number}> }}
 *   colliders are circles in the SITE frame (the world turns them to world axes).
 */
export function buildSite(ctx, site) {
  const g = new THREE.Group();
  g.name = `site@${site.id}`;

  const posts = buildShelter(ctx, g);
  DECOR[site.structure]?.(ctx, g);

  const bench = buildErBench(ctx, { plate: `CAL-0${site.stage}` });
  bench.group.position.set(0, 0, BENCH_Z);
  g.add(bench.group);

  // The sign: the bench's name, on the front beam where a player walking in reads it.
  const sign = placard(site.label, { w: 3.4, h: 0.5, fg: '#1e1a14', bg: '#d8c9a2' });
  sign.position.set(0, 3.26, 3.04);
  g.add(sign);
  ctx.own(sign.geometry, sign.material, sign.material.map);

  // The work lamp over the bench, hung from a bar between the side beams.
  g.add(strut(ctx, [-2.9, 3.3, BENCH_Z], [2.9, 3.3, BENCH_Z], 0.06, 0.06, ctx.M.darkSteel));
  const lamp = new THREE.Object3D();
  lamp.position.set(0, 3.1, BENCH_Z);
  lamp.userData.lamp = { color: lampColor, intensity: 8, distance: 12, decay: 1.7 };
  g.add(lamp);
  ctx.lamps.push(lamp);
  g.add(mesh(ctx, new THREE.BoxGeometry(0.42, 0.1, 0.2), ctx.M.lantern, 0, 3.2, BENCH_Z));

  // Colliders in the site frame: the bench as a row of circles, a post each, the back wall as a row.
  const colliders = [];
  for (let i = -2; i <= 2; i++) colliders.push({ x: i * 1.05, z: BENCH_Z, radius: 0.72 });
  for (const [x, z] of posts) colliders.push({ x, z, radius: 0.24 });
  for (let i = -5; i <= 5; i++) colliders.push({ x: i * 0.58, z: -1.6, radius: 0.32 });
  for (const x of [-3.0, 3.0]) for (const z of [-1.0, -0.2, 0.6]) colliders.push({ x, z, radius: 0.3 });

  return { group: g, bench, benchLocal: [0, 0, BENCH_Z], colliders };
}
