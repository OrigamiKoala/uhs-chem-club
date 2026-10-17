/**
 * lean-check.mjs — What the camera sees, and what stands in the way, when a
 * bench is LEANED IN over its plate (`engine/lean.js`, plan §2.6).
 *
 * Two measurements, both in the bench BAY frame (`three/bench-bay.js`: origin on
 * the floor under the middle of the plate, +z the front), both against the bodies
 * `collectBoxes` finds (per instance, per baked part, tolerance-shrunk: the same
 * bodies the bay volumes are measured against):
 *
 *   sightBlockers  a grid of segments from the camera to the plate's surface;
 *                  any body they pass through is between the player and the table.
 *   behindCover    the rays through the free glass that land BEYOND the plate's
 *                  far edge: each must reach a world body or the terrain. A ray
 *                  that reaches neither is bare sky (or the back of nothing).
 */

import * as THREE from 'three';

const hit = new THREE.Vector3();

/** First body a ray enters within `far`, or null. */
function firstBody(ray, bodies, far) {
  let best = null;
  for (const b of bodies) {
    const p = ray.intersectBox(b.box, hit);
    if (!p) continue;
    const d = p.distanceTo(ray.origin);
    if (d <= far && (!best || d < best.d)) best = { d, name: b.name, at: p.toArray().map(n => +n.toFixed(2)) };
  }
  return best;
}

/** Bodies near the camera and the plate only: a few metres round them. */
export function nearBodies(bodies, centre, radius = 14) {
  return bodies.filter(b => b.box.distanceToPoint(centre) < radius);
}

/**
 * @param {object[]} bodies `collectBoxes` result in the bay frame
 * @param {number[]} cam camera position, bay frame
 * @param {{x0: number, x1: number, z0: number, z1: number}} zone the used part of the plate
 * @param {number} plateY the plate's top in the bay frame
 * @returns {{total: number, blocked: number, first: object|null}}
 */
export function sightBlockers(bodies, cam, zone, plateY) {
  const origin = new THREE.Vector3(...cam);
  const near = nearBodies(bodies, origin);
  let total = 0;
  let blocked = 0;
  let first = null;
  const ray = new THREE.Ray();
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 5; j++) {
      const p = new THREE.Vector3(zone.x0 + (zone.x1 - zone.x0) * i / 8, plateY, zone.z0 + (zone.z1 - zone.z0) * j / 4);
      const dir = p.clone().sub(origin);
      const dist = dir.length();
      ray.set(origin, dir.normalize());
      total++;
      const h = firstBody(ray, near, dist - 0.03);
      if (h) { blocked++; first = first || h; }
    }
  }
  return { total, blocked, first };
}

/**
 * @param {object} o
 * @param {object[]} o.bodies bay-frame bodies
 * @param {THREE.PerspectiveCamera} o.camera at the lean pose, in the bay frame
 * @param {number} o.plateY
 * @param {number} o.farZ the plate's far edge (z, bay frame)
 * @param {THREE.Matrix4} o.toWorld bay frame to world (for the terrain)
 * @param {(x: number, z: number) => number} o.terrain world terrain height
 * @param {{l: number, r: number, b: number, t: number}} o.safe the free glass, NDC
 */
export function behindCover({ bodies, camera, plateY, farZ, toWorld, terrain, safe }) {
  camera.updateMatrixWorld(true);
  const near = nearBodies(bodies, camera.position, 30);
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -plateY);
  let total = 0;
  let covered = 0;
  const p = new THREE.Vector3();
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 9; j++) {
      const ndc = new THREE.Vector2(safe.l + (safe.r - safe.l) * (i + 0.5) / 16, safe.b + (safe.t - safe.b) * (j + 0.5) / 9);
      ray.setFromCamera(ndc, camera);
      const at = ray.ray.intersectPlane(plane, p);
      if (at && p.z > farZ) continue;          // lands on the plate (or in front of it)
      total++;
      if (firstBody(ray.ray, near, 120)) { covered++; continue; }
      let ground = false;
      for (let t = 0.5; t < 120 && !ground; t += 0.5) {
        const q = ray.ray.at(t, new THREE.Vector3()).applyMatrix4(toWorld);
        if (q.y <= terrain(q.x, q.z)) ground = true;
      }
      if (ground) covered++;
    }
  }
  return { total, covered };
}
