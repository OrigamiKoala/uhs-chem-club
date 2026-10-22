/**
 * lean.js — Where the camera goes when the player leans in over a tabletop.
 *
 * The standing aim looks at a bench from a metre and a half back; a tabletop is
 * worked from above. Leaning in swaps that for a PITCHED view (about 55 degrees
 * down the plate) framed so the stage's USED ZONES fit the part of the glass the
 * chrome leaves free: below the HUD and the prompt strip, above the foot dock,
 * clear of a docked briefing. The default used zone is the whole 4.8 x 1.3 m
 * plate; a stage that uses less of it gets a closer, bigger view (a 28 px piece
 * on a 667 x 375 phone is the reason, plan §7).
 *
 * THIS FILE IS A SOLVER AND OWNS NO CAMERA. `planLeanIn` takes the zones, the
 * glass and the reserved chrome and answers with a pose in the bench frame, so
 * `BenchViewer3D.leanIn` flies the real camera there and `verify:bench` asks the
 * same function at the six aspects the product supports and then projects the
 * zones through a camera at that pose to check the answer for itself.
 *
 * THE BENCH FRAME (the viewer root's): x along the plate, +z the front (where the
 * player stands), y up with the plate's working surface at `PLATE_SURFACE_Y`.
 */

import * as THREE from 'three';

/** The plate's working surface in the viewer's own frame (see `bench3d.js`). */
export const PLATE_SURFACE_Y = 0.895;

/** The whole plate, 4.8 x 1.3 m, as a used zone. */
export const PLATE_ZONE = Object.freeze({ x0: -2.4, x1: 2.4, z0: -0.65, z1: 0.65 });

export const LEAN = Object.freeze({
  pitchDeg: 55,
  minDist: 0.8,
  maxDist: 9,
  /** Fraction of the free glass left empty round the zones. */
  margin: 0.03,
  /** Seconds to fly from the standing aim to the leaned pose. */
  tweenS: 0.45
});

/**
 * The chrome a leaned-in view reserves, in CSS px, when nothing can be measured
 * (Node, or before the strip is laid out). Kept in step with `.lq-tstrip` /
 * `.lq-tdock` in `learn.css`: `--hud-h` is 64 px on a desktop and 44 px on a
 * phone (`mobile.css`: a narrow window, or any short one); the strip and the dock
 * stand 4 and 8 px off the HUD and the foot, and 6 px of glass is left round each.
 */
export function chromeReserve(w, h) {
  const phone = w <= 768 || h <= 500;
  const hud = phone ? 44 : 64;
  const strip = phone ? 56 : 66;
  const dock = 64;
  const gutter = phone ? 8 : 16;
  return { top: hud + strip, bottom: dock, left: gutter, right: gutter, hud, strip, dock, gutter };
}

const DEG = Math.PI / 180;

/** The corners of every used zone, on the plate's surface. */
function cornersOf(zones, y) {
  const out = [];
  for (const z of zones) {
    for (const [x, zz] of [[z.x0, z.z0], [z.x1, z.z0], [z.x0, z.z1], [z.x1, z.z1]]) out.push(new THREE.Vector3(x, y, zz));
  }
  return out;
}

/** The point on the plate plane a ray through NDC (x, y) of `cam` reaches. */
function planeHit(cam, ndcX, ndcY, y) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);
  const o = ray.ray.origin;
  const d = ray.ray.direction;
  const t = (y - o.y) / d.y;
  return new THREE.Vector3(o.x + d.x * t, y, o.z + d.z * t);
}

/**
 * Solve the leaned-in pose.
 *
 * @param {{
 *   zones?: {x0: number, x1: number, z0: number, z1: number}[],
 *   viewport: {w: number, h: number},
 *   reserve?: {top: number, bottom: number, left: number, right: number},
 *   fov?: number, pitchDeg?: number, margin?: number, y?: number, minDist?: number, frontZ?: number
 * }} o
 * @returns {{
 *   position: number[], target: number[], pitch: number, dist: number,
 *   fov: number, aspect: number, fits: boolean,
 *   safe: {l: number, r: number, b: number, t: number},
 *   ndc: {minX: number, maxX: number, minY: number, maxY: number}
 * }}
 */
export function planLeanIn(o) {
  const zones = o.zones && o.zones.length ? o.zones : [PLATE_ZONE];
  const { w, h } = o.viewport;
  const res = o.reserve || chromeReserve(w, h);
  const fov = o.fov || 55;
  const pitch = (o.pitchDeg ?? LEAN.pitchDeg) * DEG;
  const margin = o.margin ?? LEAN.margin;
  // How near the camera may come: a small used zone is framed from no closer than the bay's lean air allows (the caller says).
  const minDist = Math.max(LEAN.minDist, o.minDist ?? 0);
  const frontZ = o.frontZ ?? null;
  const y = o.y ?? PLATE_SURFACE_Y;

  // The free glass, as NDC, shrunk by the margin.
  const free = {
    l: -1 + (2 * res.left) / w, r: 1 - (2 * res.right) / w,
    b: -1 + (2 * res.bottom) / h, t: 1 - (2 * res.top) / h
  };
  const mx = (free.r - free.l) * margin;
  const my = (free.t - free.b) * margin;
  const safe = { l: free.l + mx, r: free.r - mx, b: free.b + my, t: free.t - my };
  const wantW = safe.r - safe.l;
  const wantH = safe.t - safe.b;

  const dir = new THREE.Vector3(0, -Math.sin(pitch), -Math.cos(pitch));
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.05, 80);
  const corners = cornersOf(zones, y);
  const bounds = new THREE.Box3().setFromPoints(corners);
  const T = bounds.getCenter(new THREE.Vector3());
  T.y = y;
  let dist = 3;
  let ndc = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  const p = new THREE.Vector3();

  const place = () => {
    cam.position.copy(T).addScaledVector(dir, -dist);
    cam.lookAt(T);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
  };
  const measure = () => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of corners) {
      p.copy(c).project(cam);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    ndc = { minX, maxX, minY, maxY };
  };

  for (let i = 0; i < 60; i++) {
    place();
    measure();
    const gotW = ndc.maxX - ndc.minX;
    const gotH = ndc.maxY - ndc.minY;
    const k = Math.max(gotW / wantW, gotH / wantH);
    const cx = (ndc.minX + ndc.maxX) / 2;
    const cy = (ndc.minY + ndc.maxY) / 2;
    const sx = (safe.l + safe.r) / 2;
    const sy = (safe.b + safe.t) / 2;
    const settled = Math.abs(k - 1) < 0.002 && Math.abs(cx - sx) < 0.002 && Math.abs(cy - sy) < 0.002;
    if (settled) break;
    // Slide the view so the content's centre lands on the free glass's centre,
    // then back off (or close in) until the larger side just fits.
    const a = planeHit(cam, cx, cy, y);
    const b = planeHit(cam, sx, sy, y);
    T.x += a.x - b.x;
    T.z += a.z - b.z;
    // Never closer than the camera may stand: not nearer than `minDist`, and (`frontZ`) always in front of the plate, never over it.
    const front = frontZ == null ? 0 : (frontZ - T.z) / Math.cos(pitch);
    dist = Math.min(LEAN.maxDist, Math.max(minDist, front, dist * (1 + (k - 1) * 0.9)));
  }
  place();
  measure();
  const eps = 0.004;
  const fits = ndc.minX >= safe.l - eps && ndc.maxX <= safe.r + eps && ndc.minY >= safe.b - eps && ndc.maxY <= safe.t + eps;

  return {
    position: cam.position.toArray(),
    target: T.toArray(),
    pitch, dist, fov, aspect: w / h, fits, safe, ndc
  };
}

/** Do two poses frame the same view (within a few millimetres)? Used to avoid re-flying for nothing. */
export function samePose(a, b) {
  if (!a || !b) return false;
  return a.position.every((v, i) => Math.abs(v - b.position[i]) < 0.004) &&
    a.target.every((v, i) => Math.abs(v - b.target[i]) < 0.004);
}
