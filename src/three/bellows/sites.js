/**
 * bellows/sites.js — The six benches and the gantries they stand in.
 *
 * Every site is the same bench under a different roof. The bench is the one the
 * instrument deploys onto (4.8 x 1.3 m, plate at 0.95 m, the dimensions the
 * viewer lays stations and keys out against), and what stands behind it says which
 * bench it is: a great dial on the wall behind the first, a piston in a glass
 * cylinder at the second, a beam balance at the third, twin tanks and a manifold
 * at the fourth, a sight tube with a pinhole plate at the fifth and a frosted
 * cold cabinet with its coil at the sixth. A player choosing a bench should not
 * have to enter it to find out what it is.
 *
 * THE SITE FRAME. A site group's local +z is its FRONT, the side a player walks
 * in from; the bench stands at local z = +1.5 so there is room behind it for the
 * gantry, and the group is turned to face its `approachPos` (the world derives the
 * angle, so moving an approach mark turns the site to meet it).
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the
 * gas rig, cased up. Pressing [E] hides the case and deploys the stations on the
 * same plate: one object, two states, never two objects in one place.
 */

import * as THREE from 'three';
import { BENCH_BAY, buildBayBench, ctxMats } from '../bench-bay.js';

/** Where the bench stands in the site frame (local z), leaving room behind it for the gantry. */
export const BENCH_Z = BENCH_BAY.benchZ;

const lampColor = 0xd99423;

function mesh(ctx, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(ctx.own(geo), mat);
  m.position.set(x, y, z);
  return m;
}

/** Add a mesh to a group, optionally rotated, and hand the MESH back (Object3D.add returns the parent). */
function put(group, m, rot = null) {
  group.add(m);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  return m;
}

/** The bench: the shared bay bench in the sampling-shelf skin, its dormant slot dressed as the cased gas rig. */
export function buildBwBench(ctx, { plate = 'BN-01' } = {}) {
  return buildBayBench(ctx, {
    skin: 'shelf',
    plate,
    mats: ctxMats(ctx),
    tagStyle: { fg: '#14223a', bg: '#d6e0ee' },
    dormant(dormant, { height }) {
      const housing = mesh(ctx, new THREE.BoxGeometry(1.2, 0.74, 0.5), ctx.M.steel, 0, height + 0.41, -0.16);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      // A glass barrel with its piston, and a gauge face: a bench for gas has a cylinder and a dial.
      put(dormant, mesh(ctx, new THREE.CylinderGeometry(0.15, 0.15, 0.82, 20, 1, true), ctx.M.glass, -0.05, height + 0.62, 0.17), [0, 0, Math.PI / 2]);
      put(dormant, mesh(ctx, new THREE.CylinderGeometry(0.14, 0.14, 0.05, 18), ctx.M.darkSteel, 0.1, height + 0.62, 0.17), [0, 0, Math.PI / 2]);
      put(dormant, mesh(ctx, new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), ctx.M.darkSteel, 0.34, height + 0.62, 0.17), [0, 0, Math.PI / 2]);
      put(dormant, mesh(ctx, new THREE.CylinderGeometry(0.17, 0.17, 0.04, 22), ctx.M.brass, -0.4, height + 0.44, 0.1), [Math.PI / 2, 0, 0]);
      dormant.add(mesh(ctx, new THREE.CircleGeometry(0.14, 22), ctx.M.glassDark, -0.4, height + 0.44, 0.125));
    }
  });
}

/* ------------------------------------------------------------------ gantry */

/**
 * The roof every site shares: four posts clear of the bench's ends, a frame of
 * beams, corrugated sheet over it and a back wall of grating. Dimensions in the
 * site frame; the bench stands at z = BENCH_Z.
 */
function buildGantryFrame(ctx, g) {
  const postGeo = ctx.own(new THREE.BoxGeometry(0.2, 3.5, 0.2));
  const posts = [];
  for (const x of [-3.0, 3.0]) {
    for (const z of [-1.55, 2.95]) {
      const p = new THREE.Mesh(postGeo, ctx.M.steel);
      p.position.set(x, 1.75, z);
      p.castShadow = ctx.t4;
      g.add(p);
      posts.push([x, z]);
    }
  }
  // Roof beams, raked a little so the rain runs off to the back.
  for (const x of [-3.0, 3.0]) {
    const beam = mesh(ctx, new THREE.BoxGeometry(0.16, 0.16, 4.8), ctx.M.darkSteel, x, 3.45, 0.7);
    beam.rotation.x = -0.05;
    g.add(beam);
  }
  for (const z of [-1.55, 0.7, 2.95]) {
    g.add(mesh(ctx, new THREE.BoxGeometry(6.3, 0.14, 0.14), ctx.M.darkSteel, 0, 3.47 - (z + 1.55) * 0.04, z));
  }
  // The roof, in sheets with a rib between them, and a back wall of the same plate as the benches.
  const roof = mesh(ctx, new THREE.BoxGeometry(6.2, 0.05, 4.7), ctx.M.cladding, 0, 3.52, 0.7);
  roof.rotation.x = -0.05;
  roof.castShadow = ctx.t4;
  g.add(roof);
  for (let i = -2; i <= 2; i++) {
    const rib = mesh(ctx, new THREE.BoxGeometry(0.06, 0.1, 4.7), ctx.M.darkSteel, i * 1.2, 3.58, 0.7);
    rib.rotation.x = -0.05;
    g.add(rib);
  }
  g.add(mesh(ctx, new THREE.BoxGeometry(6.0, 3.0, 0.06), ctx.M.pane, 0, 1.7, -1.55));
  for (let i = -3; i <= 3; i++) g.add(mesh(ctx, new THREE.BoxGeometry(0.06, 3.0, 0.1), ctx.M.darkSteel, i, 1.7, -1.55));
  // The two end panels, half height, so the wind stays out and a player can still step in at the sides.
  for (const x of [-3.0, 3.0]) {
    g.add(mesh(ctx, new THREE.BoxGeometry(0.05, 1.4, 3.2), ctx.M.pane, x, 0.75, 0));
  }
  return posts;
}

/* ---- what stands behind each bench ---- */

const DECOR = {
  /** A great dial on the wall behind the bench: the whole bench is about what it reads. */
  'knock-hut'(ctx, g) {
    put(g, mesh(ctx, new THREE.CylinderGeometry(1.05, 1.05, 0.12, 36), ctx.M.brass, -1.4, 1.95, -1.42), [Math.PI / 2, 0, 0]);
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.92, 0.92, 0.04, 36), ctx.M.glassDark, -1.4, 1.95, -1.35), [Math.PI / 2, 0, 0]);
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * 0.8 + (i / 12) * Math.PI * 1.4;
      const tick = mesh(ctx, new THREE.BoxGeometry(0.03, i % 3 === 0 ? 0.2 : 0.1, 0.02), ctx.M.paint2, -1.4 + Math.cos(a) * 0.78, 1.95 - Math.sin(a) * 0.78, -1.32);
      tick.rotation.z = a + Math.PI / 2;
      g.add(tick);
    }
    const needle = mesh(ctx, new THREE.BoxGeometry(0.04, 0.8, 0.02), ctx.M.lantern, -1.4, 1.95, -1.31);
    needle.rotation.z = -0.5;
    needle.position.x += 0.19; needle.position.y += 0.18;
    g.add(needle);
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12), ctx.M.darkSteel, -1.4, 1.95, -1.3));
    // A hung bladder, slack, off the side: what the gauge is read for.
    const bag = mesh(ctx, new THREE.SphereGeometry(1, 16, 12), ctx.M.skin, 1.9, 1.3, -1.1);
    bag.scale.set(0.5, 0.75, 0.4);
    g.add(bag);
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), ctx.M.darkSteel, 1.9, 2.55, -1.1));
  },
  /** A piston in a tall glass cylinder with its weights stacked on the rod. */
  'piston-bay'(ctx, g) {
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.55, 0.55, 2.7, 24, 1, true), ctx.M.glass, -2.1, 1.45, -1.0));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.6, 0.65, 0.2, 24), ctx.M.darkSteel, -2.1, 0.1, -1.0));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.52, 0.52, 0.12, 24), ctx.M.steel, -2.1, 1.7, -1.0));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), ctx.M.darkSteel, -2.1, 2.7, -1.0));
    for (let k = 0; k < 4; k++) g.add(mesh(ctx, new THREE.CylinderGeometry(0.32, 0.32, 0.12, 18), ctx.M.darkSteel, -2.1, 3.0 + k * 0.14, -1.0));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.62, 0.62, 0.1, 24), ctx.M.darkSteel, -2.1, 2.9, -1.0));
    // A second, shorter one beside it, at rest.
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.4, 0.4, 1.5, 20, 1, true), ctx.M.glass, 2.2, 0.85, -1.0));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.4, 0.45, 0.14, 20), ctx.M.darkSteel, 2.2, 0.07, -1.0));
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.38, 0.38, 0.1, 20), ctx.M.steel, 2.2, 0.7, -1.0));
  },
  /** A beam balance: an upright, a beam, two pans and a tank on one of them. */
  'scale-hall'(ctx, g) {
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.12, 0.2, 2.5, 10), ctx.M.darkSteel, 0, 1.25, -1.1));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.9, 0.12, 0.9), ctx.M.darkSteel, 0, 0.06, -1.1));
    const beam = mesh(ctx, new THREE.BoxGeometry(3.8, 0.1, 0.12), ctx.M.steel, 0, 2.55, -1.1);
    beam.rotation.z = 0.05;
    g.add(beam);
    for (const [x, y] of [[-1.8, 2.45], [1.8, 2.65]]) {
      g.add(between(ctx, [x - 0.4, y - 0.05, -1.1], [x, 1.2, -1.1], 0.012, ctx.M.darkSteel));
      g.add(between(ctx, [x + 0.4, y - 0.05, -1.1], [x, 1.2, -1.1], 0.012, ctx.M.darkSteel));
      g.add(mesh(ctx, new THREE.CylinderGeometry(0.55, 0.45, 0.1, 22), ctx.M.brass, x, 1.15, -1.1));
    }
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.28, 0.28, 0.8, 16), ctx.M.cladding, -1.8, 1.6, -1.1));
    for (let i = 0; i < 5; i++) g.add(mesh(ctx, new THREE.CylinderGeometry(0.1, 0.1, 0.07, 10), ctx.M.darkSteel, 1.8, 1.25 + i * 0.075, -1.1));
  },
  /** Two tanks and the manifold that joins them, with a valve on each leg. */
  'blend-house'(ctx, g) {
    for (const x of [-1.7, 1.7]) {
      g.add(mesh(ctx, new THREE.CylinderGeometry(0.6, 0.6, 2.0, 20), ctx.M.cladding, x, 1.1, -1.0));
      g.add(mesh(ctx, new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), ctx.M.cladding, x, 2.1, -1.0));
      put(g, mesh(ctx, new THREE.TorusGeometry(0.62, 0.05, 5, 22), ctx.M.darkSteel, x, 0.5, -1.0), [Math.PI / 2, 0, 0]);
    }
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.07, 0.07, 3.4, 10), ctx.M.brass, 0, 2.4, -1.0), [0, 0, Math.PI / 2]);
    for (const x of [-1.7, 1.7]) {
      g.add(mesh(ctx, new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8), ctx.M.brass, x, 2.55, -1.0));
      put(g, mesh(ctx, new THREE.TorusGeometry(0.1, 0.02, 5, 14), ctx.M.darkSteel, x, 2.8, -1.0), [Math.PI / 2, 0, 0]);
    }
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.07, 0.07, 0.8, 8), ctx.M.brass, 0, 2.0, -1.0));
    put(g, mesh(ctx, new THREE.TorusGeometry(0.12, 0.02, 5, 14), ctx.M.darkSteel, 0, 1.55, -1.0), [Math.PI / 2, 0, 0]);
  },
  /** A long sight tube along the back wall, with a pinhole plate at its end and a rule below it. */
  'pinhole-gallery'(ctx, g) {
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.16, 0.16, 4.8, 18, 1, true), ctx.M.glass, 0, 1.75, -1.35), [0, 0, Math.PI / 2]);
    for (const x of [-2.5, 2.5]) put(g, mesh(ctx, new THREE.CylinderGeometry(0.2, 0.2, 0.1, 18), ctx.M.darkSteel, x, 1.75, -1.35), [0, 0, Math.PI / 2]);
    g.add(mesh(ctx, new THREE.BoxGeometry(0.1, 0.5, 0.5), ctx.M.steel, 2.35, 1.75, -1.35));
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), ctx.M.glassDark, 2.4, 1.75, -1.35), [0, 0, Math.PI / 2]);
    for (let i = 0; i <= 24; i++) g.add(mesh(ctx, new THREE.BoxGeometry(0.02, i % 4 === 0 ? 0.22 : 0.12, 0.02), ctx.M.paint2, -2.4 + i * 0.2, 1.3, -1.45));
    for (const x of [-1.2, 1.2]) g.add(mesh(ctx, new THREE.BoxGeometry(0.14, 1.5, 0.14), ctx.M.darkSteel, x, 0.95, -1.35));
  },
  /** A frosted cabinet with its cooling coil and a tall thermometer bar beside it. */
  'cold-room'(ctx, g) {
    g.add(mesh(ctx, new THREE.BoxGeometry(2.4, 2.3, 0.9), ctx.M.rime, -1.1, 1.2, -1.0));
    g.add(mesh(ctx, new THREE.BoxGeometry(2.1, 1.9, 0.06), ctx.M.pane, -1.1, 1.2, -0.52));
    for (let k = 0; k < 6; k++) {
      put(g, mesh(ctx, new THREE.TorusGeometry(0.36, 0.035, 6, 24), ctx.M.brass, 1.7, 0.7 + k * 0.28, -1.0), [Math.PI / 2, 0, 0]);
    }
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6), ctx.M.brass, 1.7, 1.4, -1.0));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.16, 2.4, 0.08), ctx.M.glassDark, 2.6, 1.3, -1.2));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.05, 1.0, 0.04), ctx.M.paint2, 2.6, 0.95, -1.15));
  }
};

/** A cylinder laid between two points (local to the site group). */
function between(ctx, a, b, radius, mat) {
  const from = new THREE.Vector3(...a); const to = new THREE.Vector3(...b);
  const len = from.distanceTo(to);
  const m = new THREE.Mesh(ctx.own(new THREE.CylinderGeometry(radius, radius, len, 6)), mat);
  m.position.copy(from).lerp(to, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  return m;
}

/**
 * Build one site: the gantry and the bench under it.
 * @returns {{ group: THREE.Group, bench: object, benchLocal: number[], colliders: Array<{x:number,z:number,radius:number}> }}
 *   colliders are circles in the SITE frame (the world turns them to world axes).
 */
export function buildSite(ctx, site) {
  const g = new THREE.Group();
  g.name = `site@${site.id}`;

  const posts = buildGantryFrame(ctx, g);
  DECOR[site.structure]?.(ctx, g);

  const bench = buildBwBench(ctx, { plate: `GR-0${site.stage}` });
  bench.group.position.set(0, 0, BENCH_Z);
  g.add(bench.group);

  // The work lamp over the bench: the one real light here (pooled by the world).
  const lamp = new THREE.Object3D();
  lamp.position.set(0, 3.2, BENCH_Z);
  lamp.userData.lamp = { color: lampColor, intensity: 8, distance: 12, decay: 1.7 };
  g.add(lamp);
  ctx.lamps.push(lamp);
  g.add(mesh(ctx, new THREE.BoxGeometry(0.4, 0.1, 0.2), ctx.M.lantern, 0, 3.32, BENCH_Z));

  // Colliders in the site frame: the bench as a row of circles, a post each, the back wall as a row.
  const colliders = [];
  for (let i = -2; i <= 2; i++) colliders.push({ x: i * 1.05, z: BENCH_Z, radius: 0.72 });
  for (const [x, z] of posts) colliders.push({ x, z, radius: 0.22 });
  for (let i = -5; i <= 5; i++) colliders.push({ x: i * 0.58, z: -1.55, radius: 0.32 });

  return { group: g, bench, benchLocal: [0, 0, BENCH_Z], colliders };
}
