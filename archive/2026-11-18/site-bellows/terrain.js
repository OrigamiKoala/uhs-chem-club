/**
 * bellows/terrain.js — The deck: one level plate on a sea of cloud.
 *
 * Bellows has no ground. What the player walks on is a circular steel deck, flat
 * to the millimetre because it was built that way, with a rail round its edge and
 * a hull of trusses and plating hanging under it into the cloud. `height(x, z)` is
 * therefore the simplest ground in the product: the deck's level inside its
 * rim, and the cloud sea's level (a drop no one can take, because the rail is a
 * wall of colliders) outside it.
 *
 * THE WALK, THE LANDING SOLVER AND EVERY NODE CHECK STAND ON EXACTLY THIS
 * FUNCTION. `solveLanding` samples it under the hull, so a spot straddling the
 * edge reads a 46 m drop and is refused; the ship can only land on plate.
 */

import * as THREE from 'three';

/** @param {{ deck: { radius: number, seaLevel: number } }} data */
export function makeBellowsField(data) {
  const R = data.deck.radius;
  const SEA = data.deck.seaLevel;
  const height = (x, z) => (Math.hypot(x, z) <= R + 0.05 ? 0 : SEA);
  return { height, R, SEA, RAIL_R: R - 1.9 };
}

/** The deck: a disc, UVs laid in metres so a tread plate is the same size everywhere. */
export function buildDeckGeometry(R, tile = 3) {
  const geo = new THREE.CircleGeometry(R, 160);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / tile, pos.getZ(i) / tile);
  geo.setAttribute('uv1', uv.clone());
  return geo;
}

/**
 * The rail round the deck's edge, in short segments (so the overlap check measures
 * each one, not a ring whose box is the whole deck), and the circles it collides
 * as. Returns the group and the colliders.
 */
export function buildRim(ctx, R) {
  const g = new THREE.Group();
  g.name = 'bellows-rim';
  const r = R - 1.6;                    // the rail's own radius
  const POSTS = 96;
  const postGeo = ctx.own(new THREE.BoxGeometry(0.08, 1.1, 0.08));
  const toeGeo = ctx.own(new THREE.BoxGeometry(1, 0.16, 0.025));
  const seg = (2 * Math.PI * r) / POSTS;
  const railGeo = ctx.own(new THREE.BoxGeometry(seg + 0.02, 0.055, 0.055));
  for (let i = 0; i < POSTS; i++) {
    const a = (i / POSTS) * Math.PI * 2;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    const post = new THREE.Mesh(postGeo, ctx.M.darkSteel);
    post.position.set(x, 0.55, z);
    g.add(post);
    // The two rails and the toe plate run from this post toward the next, along the chord.
    const b = ((i + 0.5) / POSTS) * Math.PI * 2;
    const mx = Math.sin(b) * r, mz = Math.cos(b) * r;
    for (const y of [1.07, 0.55]) {
      const rail = new THREE.Mesh(railGeo, ctx.M.steel);
      rail.position.set(mx, y, mz);
      rail.rotation.y = b;
      g.add(rail);
    }
    const toe = new THREE.Mesh(toeGeo, ctx.M.darkSteel);
    toe.scale.x = seg;
    toe.position.set(mx, 0.08, mz);
    toe.rotation.y = b;
    g.add(toe);
  }
  // Colliders: a closed ring of circles, so there is no gap anyone could take a step through.
  const colliders = [];
  const N = Math.ceil((2 * Math.PI * (r + 0.3)) / 1.3);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    colliders.push({ x: Math.sin(a) * (r + 0.3), z: Math.cos(a) * (r + 0.3), radius: 0.9 });
  }
  return { group: g, colliders };
}

/**
 * Paint on the deck: the lamp road's ring, a spoke to each bench's approach, and the
 * walk in from the spawn. Transparent decals, flat on the plate.
 */
export function buildMarkings(ctx, data) {
  const g = new THREE.Group();
  g.name = 'bellows-markings';
  const mat = ctx.M.paint;
  const road = data.landmarks.filter(l => l.asset === 'lamp-post');
  if (road.length) {
    const r = Math.hypot(road[0].pos[0], road[0].pos[2]);
    const ring = new THREE.Mesh(ctx.own(new THREE.RingGeometry(r + 1.3, r + 1.65, 128)), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.012;
    g.add(ring);
  }
  const stripe = (x0, z0, x1, z1, w = 0.32) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = new THREE.Mesh(ctx.own(new THREE.PlaneGeometry(w, len)), mat);
    // Laid flat its long axis runs along world z; turned about y it runs along the bearing.
    m.rotation.order = 'YXZ';
    m.rotation.set(-Math.PI / 2, Math.atan2(x1 - x0, z1 - z0), 0);
    m.position.set((x0 + x1) / 2, 0.013, (z0 + z1) / 2);
    g.add(m);
  };
  for (const s of data.sites) {
    const [ax, , az] = s.approachPos;
    const n = Math.hypot(ax, az) || 1;
    // From the lamp road out to the bench's approach mark.
    const roadR = road.length ? Math.hypot(road[0].pos[0], road[0].pos[2]) + 1.5 : 30;
    stripe((ax / n) * roadR, (az / n) * roadR, ax * 0.97, az * 0.97);
  }
  const sp = data.spawn.pos;
  const roadR = road.length ? Math.hypot(road[0].pos[0], road[0].pos[2]) + 1.5 : 30;
  stripe(sp[0], sp[2] - 6, 0, roadR);
  return g;
}

/**
 * The hull under the deck: a lathed shell of plating tapering into the cloud, with
 * ribs round it. It is part of the deck (`phys: 'ground'`), what you see when you
 * lean over the rail.
 */
export function buildUnderside(ctx, R, seaLevel) {
  const g = new THREE.Group();
  g.name = 'bellows-underside';
  g.userData.phys = 'ground';
  const prof = [
    [R, -0.35], [R - 0.6, -1.4], [R - 4, -3.4], [R - 16, -9], [R - 32, -17], [R - 52, -29], [R - 68, -39], [6, seaLevel + 4], [0, seaLevel + 3]
  ].map(([x, y]) => new THREE.Vector2(Math.max(0.01, x), y));
  const hull = new THREE.Mesh(ctx.own(new THREE.LatheGeometry(prof, 96)), ctx.M.darkSteel);
  hull.name = 'bellows-hull';
  g.add(hull);
  const ribGeo = ctx.own(new THREE.TorusGeometry(1, 0.28, 6, 96));
  for (const [rr, y] of [[R - 0.8, -1.0], [R - 8, -5.6], [R - 22, -12.6], [R - 42, -23]]) {
    const rib = new THREE.Mesh(ribGeo, ctx.M.steel);
    rib.rotation.x = Math.PI / 2;
    rib.scale.set(rr, rr, 1);
    rib.position.y = y;
    g.add(rib);
  }
  return g;
}
