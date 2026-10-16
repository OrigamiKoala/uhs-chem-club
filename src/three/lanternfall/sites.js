/**
 * lanternfall/sites.js — The nine benches and the shelters they stand in.
 *
 * Every site is the same bench under a different roof. The bench is the one
 * the instrument deploys onto (4.8 x 1.3 m, plate at 0.95 m, the dimensions
 * `BenchViewer3D` lays its stations and key bank out against), and what stands
 * behind it says which bench it is: a wave drawn on the wall behind the first,
 * a lens mast at the second, a prism on its stand at the third, geodesic ribs
 * over the fourth, a board of boxes behind the fifth and the sixth, a detector
 * arc at the seventh, a stepped table of tiles at the eighth and a rack of
 * vials at the ninth. A player choosing a bench should not have to enter it to
 * find out what it is.
 *
 * THE SITE FRAME. A site group's local +z is its FRONT, the side a player walks
 * in from; the bench stands at local z = +1.5 so there is room behind it for the
 * shelter, and the group is turned to face its `approachPos` (the world derives
 * the angle, so moving an approach mark turns the site to meet it).
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is
 * the instrument, cased up. Pressing [E] hides the case and deploys the stations
 * on the same plate: one object, two states, never two objects in one place.
 * `kind` says which instrument it is (`light`, `cloud`, `rack` or `electron`).
 */

import * as THREE from 'three';
import { BENCH_BAY, buildBayBench, ctxMats } from '../bench-bay.js';

/** Where the bench stands in the site frame (local z), leaving room behind it for the shelter. */
export const BENCH_Z = BENCH_BAY.benchZ;

/** Which instrument stands cased up on each site's bench. */
export const BENCH_KIND = {
  'wave-hut': 'light', 'photon-hut': 'light', 'prism-hall': 'light', 'cuvette-lab': 'light',
  'cloud-dome': 'cloud',
  'number-board': 'rack', 'filling-gallery': 'rack',
  'spectrum-bay': 'electron', 'trend-table': 'electron'
};

const lanternColor = 0xd99423;

function mesh(ctx, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(ctx.own(geo), mat);
  m.position.set(x, y, z);
  return m;
}

/** Add a mesh to a group, optionally rotated, and hand the mesh back (Object3D.add returns the parent). */
function put(group, m, rot = null) {
  group.add(m);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  return m;
}

/** The bench: the shared bay bench in the sampling-shelf skin, its dormant slot dressed for `kind`. */
export function buildLfBench(ctx, { kind = 'light', plate = 'BN-01' } = {}) {
  return buildBayBench(ctx, {
    skin: 'shelf',
    plate,
    mats: ctxMats(ctx),
    tagStyle: { fg: '#1d2a33', bg: '#cfe0e8' },
    dormant(dormant, { height }) {
      const housing = mesh(ctx, new THREE.BoxGeometry(1.15, 0.78, 0.52), kind === 'rack' ? ctx.M.darkSteel : ctx.M.steel, 0, height + 0.43, -0.16);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);

      if (kind === 'light') {
        // A lamp housing and a slit: a bench for light has a lamp and a slot.
        put(dormant, mesh(ctx, new THREE.CylinderGeometry(0.17, 0.17, 0.12, 20), ctx.M.darkSteel, -0.28, height + 0.5, 0.14), [Math.PI / 2, 0, 0]);
        dormant.add(mesh(ctx, new THREE.CircleGeometry(0.135, 20), ctx.M.glassDark, -0.28, height + 0.5, 0.205));
        dormant.add(mesh(ctx, new THREE.BoxGeometry(0.34, 0.03, 0.02), ctx.M.darkSteel, 0.22, height + 0.5, 0.11));
        dormant.add(mesh(ctx, new THREE.BoxGeometry(0.34, 0.03, 0.02), ctx.M.darkSteel, 0.22, height + 0.38, 0.11));
      } else if (kind === 'cloud') {
        // A glass block on a plinth: the cloud plate's own shape.
        dormant.add(mesh(ctx, new THREE.CylinderGeometry(0.22, 0.26, 0.05, 8), ctx.M.darkSteel, 0, height + 0.5, 0.12));
        const cube = mesh(ctx, new THREE.BoxGeometry(0.36, 0.36, 0.36), ctx.M.glass, 0, height + 0.72, 0.12);
        dormant.add(cube);
      } else if (kind === 'rack') {
        // A board of milled boxes, each a dark square, and the tray under it.
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 5 - (r % 2); c++) {
            dormant.add(mesh(ctx, new THREE.BoxGeometry(0.1, 0.1, 0.012), ctx.M.glassDark, -0.38 + c * 0.17 + (r % 2) * 0.085, height + 0.28 + r * 0.16, 0.1));
          }
        }
      } else {
        // Rings of an atom, standing on a spindle: the electron bench's shape.
        for (const [rad, rot] of [[0.12, 0], [0.2, 0.7], [0.28, 1.4]]) {
          const ring = mesh(ctx, new THREE.TorusGeometry(rad, 0.012, 6, 28), ctx.M.darkSteel, 0, height + 0.52, 0.12);
          ring.rotation.set(Math.PI / 2 + rot * 0.15, 0, rot);
          dormant.add(ring);
        }
        dormant.add(mesh(ctx, new THREE.SphereGeometry(0.035, 10, 8), ctx.M.steel, 0, height + 0.52, 0.12));
      }
    }
  });
}

/* ------------------------------------------------------------------ shelter */

/**
 * The roof every site shares: four posts clear of the bench's ends, a frame of
 * beams, frosted panels over it and a back wall of the same. Dimensions in the
 * site frame; the bench stands at z = BENCH_Z.
 */
function buildShelterFrame(ctx, g) {
  const postGeo = ctx.own(new THREE.BoxGeometry(0.18, 3.5, 0.18));
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
  // Roof beams, raked a little so the snow runs off to the back.
  for (const x of [-3.0, 3.0]) {
    const beam = mesh(ctx, new THREE.BoxGeometry(0.14, 0.14, 4.8), ctx.M.darkSteel, x, 3.45, 0.7);
    beam.rotation.x = -0.05;
    g.add(beam);
  }
  for (const z of [-1.55, 0.7, 2.95]) {
    g.add(mesh(ctx, new THREE.BoxGeometry(6.3, 0.12, 0.12), ctx.M.darkSteel, 0, 3.47 - (z + 1.55) * 0.04, z));
  }
  // Frosted roof and back wall.
  const roof = mesh(ctx, new THREE.BoxGeometry(6.2, 0.04, 4.7), ctx.M.frost, 0, 3.5, 0.7);
  roof.rotation.x = -0.05;
  g.add(roof);
  g.add(mesh(ctx, new THREE.BoxGeometry(6.0, 3.0, 0.05), ctx.M.frost, 0, 1.7, -1.55));
  // The two end panels, half height, so the wind stays out and a player can still step in at the sides.
  for (const x of [-3.0, 3.0]) {
    g.add(mesh(ctx, new THREE.BoxGeometry(0.05, 1.5, 3.2), ctx.M.frost, x, 0.8, -0.0));
  }
  return posts;
}

/* ---- what stands behind each bench ---- */

const DECOR = {
  /** A wave drawn across the back wall: a tube along a sine, and its ruler. */
  'wave-hut'(ctx, g) {
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      pts.push(new THREE.Vector3(-2.7 + t * 5.4, 1.95 + Math.sin(t * Math.PI * 7) * 0.45, -1.4));
    }
    g.add(mesh(ctx, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.03, 6, false), ctx.M.steel));
    for (let i = 0; i <= 24; i++) {
      g.add(mesh(ctx, new THREE.BoxGeometry(0.02, i % 4 === 0 ? 0.2 : 0.1, 0.02), ctx.M.darkSteel, -2.7 + i * 0.225, 1.2, -1.4));
    }
  },
  /** A lens mast: a tall pole with a collimating lens and a dark hood. */
  'photon-hut'(ctx, g) {
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.06, 0.09, 3.1, 8), ctx.M.darkSteel, -2.3, 1.55, -1.1));
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.3, 0.3, 0.14, 20), ctx.M.glassDark, -2.3, 2.9, -0.95), [Math.PI / 2, 0, 0]);
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.34, 0.2, 0.4, 14, 1, true), ctx.M.darkSteel, -2.3, 2.9, -1.2), [Math.PI / 2, 0, 0]);
    g.add(mesh(ctx, new THREE.BoxGeometry(0.9, 0.9, 0.4), ctx.M.darkSteel, 2.1, 1.3, -1.25));
  },
  /** A prism on its stand, and a strip of seven muted bands on the wall behind it. */
  'prism-hall'(ctx, g) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.45, 0); shape.lineTo(0.45, 0); shape.lineTo(0, 0.78); shape.closePath();
    const prism = mesh(ctx, new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: false }), ctx.M.glass, 2.1, 1.35, -0.8);
    g.add(prism);
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.08, 0.14, 1.35, 8), ctx.M.darkSteel, 2.1, 0.68, -0.55));
    const bands = [0x6a4a8f, 0x4a5f9f, 0x3f8f7a, 0x6a9a4a, 0xb0993f, 0xb06a3a, 0xa04a4a];
    bands.forEach((c, i) => {
      const m = ctx.own(new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
      g.add(mesh(ctx, new THREE.BoxGeometry(0.46, 0.5, 0.03), m, -2.3 + i * 0.5, 2.0, -1.5));
    });
  },
  /** Geodesic ribs over the bench, and a glass block on a plinth behind it. */
  'cloud-dome'(ctx, g) {
    for (let k = 0; k < 4; k++) {
      const rib = mesh(ctx, new THREE.TorusGeometry(2.55, 0.035, 6, 36, Math.PI), ctx.M.steel, 0, 0.4, BENCH_Z - 0.2);
      rib.rotation.set(0, (k / 4) * Math.PI, 0);
      rib.scale.y = 0.78;
      // An arch has an underside and no inside: the instrument stands UNDER it.
      rib.userData.openShell = true;
      g.add(rib);
    }
    g.add(mesh(ctx, new THREE.CylinderGeometry(0.3, 0.38, 0.9, 8), ctx.M.darkSteel, -2.2, 0.45, -0.9));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.7, 0.7, 0.7), ctx.M.glass, -2.2, 1.25, -0.9));
  },
  /** A wall board of milled boxes in ladder rows. */
  'number-board'(ctx, g) {
    g.add(mesh(ctx, new THREE.BoxGeometry(4.0, 2.2, 0.06), ctx.M.darkSteel, 0, 1.65, -1.45));
    const slot = ctx.own(new THREE.BoxGeometry(0.22, 0.22, 0.02));
    const rows = [1, 1, 3, 1, 3, 5];
    rows.forEach((n, r) => {
      for (let c = 0; c < n; c++) {
        { const m = new THREE.Mesh(slot, ctx.M.glassDark); m.position.set(-0.4 + (c - (n - 1) / 2) * 0.28, 0.75 + r * 0.32, -1.4); g.add(m); }
      }
    });
  },
  /** A tall ladder of shelves with an arrow-shaped token on each. */
  'filling-gallery'(ctx, g) {
    for (const x of [-2.2, 2.2]) g.add(mesh(ctx, new THREE.BoxGeometry(0.08, 3.0, 0.08), ctx.M.darkSteel, x, 1.5, -1.3));
    for (let r = 0; r < 7; r++) {
      g.add(mesh(ctx, new THREE.BoxGeometry(4.4, 0.04, 0.35), ctx.M.steel, 0, 0.55 + r * 0.38, -1.3));
      for (let c = 0; c < 6; c++) {
        g.add(mesh(ctx, new THREE.ConeGeometry(0.06, 0.2, 4), ctx.M.darkSteel, -1.6 + c * 0.64, 0.68 + r * 0.38, -1.3));
      }
    }
  },
  /** A detector arc standing behind the bench, and a lamp housing facing it. */
  'spectrum-bay'(ctx, g) {
    g.add(mesh(ctx, new THREE.TorusGeometry(1.75, 0.07, 8, 40, Math.PI), ctx.M.steel, 0, 1.0, -0.6));
    g.add(mesh(ctx, new THREE.BoxGeometry(0.7, 0.55, 0.55), ctx.M.darkSteel, -2.35, 0.85, -0.6));
    put(g, mesh(ctx, new THREE.CylinderGeometry(0.2, 0.2, 0.1, 18), ctx.M.glassDark, -2.0, 0.85, -0.6), [0, 0, Math.PI / 2]);
  },
  /** A stepped table of tiles, the periodic table's silhouette. */
  'trend-table'(ctx, g) {
    const tile = ctx.own(new THREE.BoxGeometry(0.34, 0.3, 0.06));
    const rows = [2, 8, 8, 18];
    let r = 0;
    for (const n of [1, 2, 3, 4]) {
      const cols = [2, 8, 8, 8][r];
      for (let c = 0; c < cols; c++) {
        const t = new THREE.Mesh(tile, c % 2 ? ctx.M.steel : ctx.M.darkSteel);
        t.position.set(-1.6 + c * 0.4 + (r === 0 ? 1.4 : 0), 0.6 + (3 - r) * 0.36, -1.3 + r * 0.08);
        g.add(t);
      }
      r++;
      void n; void rows;
    }
  },
  /** A rack of vials on a shelf, and a boxed spectrometer. */
  'cuvette-lab'(ctx, g) {
    g.add(mesh(ctx, new THREE.BoxGeometry(3.6, 0.05, 0.4), ctx.M.steel, 0, 1.2, -1.25));
    for (let i = 0; i < 12; i++) {
      g.add(mesh(ctx, new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), ctx.M.glass, -1.65 + i * 0.3, 1.36, -1.25));
    }
    g.add(mesh(ctx, new THREE.BoxGeometry(1.0, 0.6, 0.6), ctx.M.darkSteel, 2.1, 0.3, -1.0));
  }
};

/**
 * Build one site: the shelter and the bench under it.
 * @returns {{ group: THREE.Group, bench: object, benchLocal: number[], colliders: Array<{x:number,z:number,radius:number}> }}
 *   colliders are circles in the SITE frame (the world turns them to world axes).
 */
export function buildSite(ctx, site) {
  const g = new THREE.Group();
  g.name = `site@${site.id}`;
  const kind = BENCH_KIND[site.structure] || 'light';

  const posts = buildShelterFrame(ctx, g);
  DECOR[site.structure]?.(ctx, g);

  const bench = buildLfBench(ctx, { kind, plate: `BN-0${site.stage}` });
  bench.group.position.set(0, 0, BENCH_Z);
  g.add(bench.group);

  // The work lantern over the bench: the one real light here (pooled by the world).
  const lamp = new THREE.Object3D();
  lamp.position.set(0, 3.2, BENCH_Z);
  lamp.userData.lamp = { color: lanternColor, intensity: 9, distance: 12, decay: 1.7 };
  g.add(lamp);
  ctx.lamps.push(lamp);
  const fixture = mesh(ctx, new THREE.BoxGeometry(0.4, 0.1, 0.2), ctx.M.lantern, 0, 3.32, BENCH_Z);
  g.add(fixture);

  // Colliders in the site frame: the bench as a row of circles, a post each, the back wall as a row.
  const colliders = [];
  for (let i = -2; i <= 2; i++) colliders.push({ x: i * 1.05, z: BENCH_Z, radius: 0.72 });
  for (const [x, z] of posts) colliders.push({ x, z, radius: 0.22 });
  for (let i = -5; i <= 5; i++) colliders.push({ x: i * 0.58, z: -1.55, radius: 0.32 });

  return { group: g, bench, benchLocal: [0, 0, BENCH_Z], colliders };
}
