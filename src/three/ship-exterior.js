/**
 * ship-exterior.js — The Avalon seen from outside, and where it sets down.
 *
 * Aboard, the Avalon is its interior (`ship.js`): plating with rooms inside it
 * and nothing drawn on the outside, because nobody has ever stood out there.
 * The voyage changes that. The ship flies to a world, lands on it, and the
 * player walks out of the airlock onto the ground — at which point they can
 * turn round and look at what they arrived in. This file builds that.
 *
 * THE SAME SHIP, NOT A SECOND ONE. Every dimension is read from the deck plan
 * (`ship-rooms.js`): the hull's width and length, the raked shoulders, the
 * canopy's five panes from `canopyGeometry()`, the portholes on the port
 * side, and the airlock hatch at `AIRLOCK_HATCH`, which is where the ramp
 * comes down. Move the hatch in the deck plan and the ramp moves with it.
 *
 * SHIP-LOCAL COORDINATES, as aboard: +z is the bow, +x starboard, the deck at
 * y = 0. `landingTransform` places the whole thing in a world.
 *
 * THE SHELL IS NEVER DRAWN WHILE THE PLAYER IS INSIDE IT. Aboard, the
 * interior is the ship; the shell would only stand between the camera and the
 * canopy. The voyage shows it the moment the player has stepped out through
 * the hatch, with the ship behind them.
 */

import * as THREE from "three";
import { HULL, CANOPY, HULL_WINDOWS, AIRLOCK_HATCH } from "./ship-rooms.js";
import { canopyGeometry } from "./ship/hull.js";
import { applyWorldUVs } from "./ship/kit.js";

/** Outer faces of the plating, in ship-local metres. */
const OUT_X = HULL.maxX + HULL.plate;               // 6.1
const AFT_Z = HULL.minZ - HULL.plate;               // -11.5
const KEEL_Y = -1.15;                               // underside of the hull
const ROOF_Y = 3.35;                                // top of the plated body
const SILL_Y = CANOPY.sill;
const HEAD_Y = CANOPY.top;

/** Where the ramp meets the hull: the hatch sill, on the starboard plate. */
export const HATCH_SILL = {
  x: OUT_X,
  y: AIRLOCK_HATCH.y - AIRLOCK_HATCH.h / 2,
  z: AIRLOCK_HATCH.z
};

/** How far the ramp reaches out from the plate, and how wide it is. */
const RAMP_RUN = 4.2;
const RAMP_W = 1.6;

/** The deck stands this far above the highest ground under the ship. */
export const DECK_CLEARANCE = 1.45;

/**
 * Everything the ship occupies on the ground, in ship-local x/z: the hull with
 * its engines, and the ramp. `landingTransform` turns these into world boxes
 * for the walk, and `solveLanding` keeps them clear of the world.
 */
export const SHIP_FOOTPRINT = {
  body: { minX: -OUT_X - 0.2, maxX: OUT_X + 0.2, minZ: AFT_Z - 2.9, maxZ: HULL.maxZ + 0.6 },
  ramp: {
    minX: OUT_X, maxX: OUT_X + RAMP_RUN - 0.6,
    minZ: AIRLOCK_HATCH.z - RAMP_W / 2 - 0.1, maxZ: AIRLOCK_HATCH.z + RAMP_W / 2 + 0.1
  }
};

/**
 * Where a player stands once they have walked down the ramp: a pace clear of
 * its foot, square to the hatch.
 */
export const RAMP_FOOT = { x: OUT_X + RAMP_RUN + 0.9, z: AIRLOCK_HATCH.z };

/* ------------------------------------------------------------------ helpers */

/** Push a plan point away from the middle of the nose, by `d` metres. */
function pushOut(p, d) {
  const cx = 0, cz = 2.2;
  const dx = p[0] - cx, dz = p[1] - cz;
  const L = Math.hypot(dx, dz) || 1;
  return [p[0] + (dx / L) * d, p[1] + (dz / L) * d];
}

/**
 * A prism: the plan polygon `pts` ([x, z] pairs) extruded from `y0` up to
 * `y1`. Built as a Shape in (x, z) and turned to lie in the deck plane.
 */
function prism(mat, pts, y0, y1) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false });
  // Shape (x, z) → (x, 0, z); extrusion (+z) → −y. Then lift so it spans y0..y1.
  g.rotateX(Math.PI / 2);
  g.translate(0, y1, 0);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function boxAt(parent, mat, w, h, d, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function cylAt(parent, mat, r0, r1, len, x, y, z, axis = 'y', seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, seg), mat);
  m.position.set(x, y, z);
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  else if (axis === 'x') m.rotation.z = Math.PI / 2;
  m.castShadow = true;
  parent.add(m);
  return m;
}

/** A quad (or a triangle, when `d` is omitted), double-sided. */
function facet(mat, a, b, c, d = null) {
  const v = d ? [...a, ...b, ...c, ...a, ...c, ...d] : [...a, ...b, ...c];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((v.length / 3) * 2), 2));
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

const _up = new THREE.Vector3(0, 1, 0);
/** Stand a unit-height cylinder between two points. */
function strut(mesh, a, b) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A);
  mesh.position.copy(A).add(B).multiplyScalar(0.5);
  mesh.scale.set(1, Math.max(0.01, dir.length()), 1);
  mesh.quaternion.setFromUnitVectors(_up, dir.normalize());
}

/* -------------------------------------------------------------------- build */

/**
 * Build the outside of the Avalon. `M` is the ship's own material set
 * (`ShipInterior` carries it), so the plating outside is the plating inside.
 *
 * Returns the group plus `fitToGround(localGroundAt)`, which reaches the four
 * legs and the ramp down to the ground the ship is standing over.
 * `localGroundAt(x, z)` answers in ship-local metres.
 */
export function buildShipExterior(M) {
  const group = new THREE.Group();
  group.name = 'avalon-exterior';

  const hullMat = M.durasteelMat;
  const darkMat = M.gunmetalMat;
  const trimMat = M.trimMat;
  const ribMat = M.ribMat || M.trimMat;
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x10151a, roughness: 0.08, metalness: 0.92, side: THREE.DoubleSide
  });
  // Filament light seen from outside: dim and local, never a bloom.
  const portGlowMat = new THREE.MeshBasicMaterial({ color: 0x8a6230 });
  const nozzleGlowMat = new THREE.MeshBasicMaterial({ color: 0x5b3615 });
  const hatchGlowMat = new THREE.MeshBasicMaterial({ color: 0x6e5130 });
  const redLamp = M.redLampMat || new THREE.MeshBasicMaterial({ color: 0xb8382c });
  const greenLamp = M.greenLampMat || new THREE.MeshBasicMaterial({ color: 0x6f9a3a });

  /* ---- the body: the deck plan, extruded ---- */
  const cg = canopyGeometry();
  const sill = cg.sill.map(p => pushOut(p, 0.42));
  const head = cg.head.map(p => pushOut(p, 0.42));
  const lower = [
    [-OUT_X, AFT_Z], [OUT_X, AFT_Z], [OUT_X, 3.2],
    ...sill.slice().reverse(),
    [-OUT_X, 3.2]
  ];
  // Above the sill the plan steps back to the head of the glass: the raked
  // panes fill the wedge between the two.
  const upper = [
    [-OUT_X, AFT_Z], [OUT_X, AFT_Z], [OUT_X, 3.2],
    sill[sill.length - 1],
    ...head.slice().reverse(),
    sill[0],
    [-OUT_X, 3.2]
  ];
  group.add(prism(hullMat, lower, KEEL_Y, SILL_Y));
  group.add(prism(hullMat, upper, SILL_Y, ROOF_Y));

  // The keel: a narrower plate under the belly, so the underside is not one
  // flat slab.
  group.add(prism(darkMat, [
    [-OUT_X + 1.2, AFT_Z + 0.6], [OUT_X - 1.2, AFT_Z + 0.6],
    [OUT_X - 1.2, 2.6], [2.2, 4.6], [-2.2, 4.6], [-OUT_X + 1.2, 2.6]
  ], KEEL_Y - 0.4, KEEL_Y));

  // Humps where the deckheads rise inside: over the bridge and the engine room.
  boxAt(group, hullMat, OUT_X * 2 - 0.6, 0.42, 3.0, 0, ROOF_Y + 0.21, 1.85);
  boxAt(group, hullMat, OUT_X * 2 - 0.4, 1.05, 3.7, 0, ROOF_Y + 0.52, AFT_Z + 1.85);

  /* ---- the canopy, from outside ---- */
  for (let i = 0; i < sill.length - 1; i++) {
    const a = [sill[i][0], SILL_Y, sill[i][1]];
    const b = [sill[i + 1][0], SILL_Y, sill[i + 1][1]];
    const c = [head[i + 1][0], HEAD_Y, head[i + 1][1]];
    const d = [head[i][0], HEAD_Y, head[i][1]];
    group.add(facet(glassMat, a, b, c, d));
  }
  // Cheeks closing the ends of the glass against the shoulders.
  for (const end of [0, sill.length - 1]) {
    const s = sill[end], h = head[end];
    group.add(facet(darkMat, [s[0], SILL_Y, s[1]], [s[0], ROOF_Y, s[1]], [h[0], ROOF_Y, h[1]], [h[0], HEAD_Y, h[1]]));
  }
  // Mullions over the joints of the panes.
  const mull = new THREE.CylinderGeometry(0.07, 0.07, 1, 6);
  for (let j = 0; j < sill.length; j++) {
    const m = new THREE.Mesh(mull, ribMat);
    strut(m, [sill[j][0], SILL_Y, sill[j][1]], [head[j][0], HEAD_Y + 0.02, head[j][1]]);
    group.add(m);
  }

  /* ---- ports: the portholes on the port side and the shoulder slots ---- */
  for (const w of HULL_WINDOWS) {
    const x = w.side * (OUT_X + 0.012);
    const geo = w.r ? new THREE.CircleGeometry(w.r, 20) : new THREE.PlaneGeometry(w.w, w.h);
    const m = new THREE.Mesh(geo, portGlowMat);
    m.position.set(x, w.y, w.z);
    m.rotation.y = w.side * Math.PI / 2;
    group.add(m);
    const rim = new THREE.Mesh(
      w.r ? new THREE.TorusGeometry(w.r + 0.05, 0.05, 6, 20) : new THREE.BoxGeometry(w.w + 0.16, w.h + 0.16, 0.04),
      trimMat
    );
    rim.position.copy(m.position);
    rim.rotation.y = m.rotation.y;
    group.add(rim);
  }

  /* ---- plating detail: seams, ribs, radiators and a mast ---- */
  for (const side of [-1, 1]) {
    // Horizontal rub strakes along the flanks.
    for (const y of [0.1, 2.35]) {
      boxAt(group, ribMat, 0.12, 0.14, 14.4, side * (OUT_X + 0.06), y, -4.3);
    }
    // Service panels between the strakes.
    for (let i = 0; i < 4; i++) {
      const z = -10.2 + i * 1.3;
      boxAt(group, darkMat, 0.08, 0.8, 1.0, side * (OUT_X + 0.04), 1.2, z);
    }
  }
  // Radiator fins across the aft roof.
  for (let i = 0; i < 9; i++) {
    boxAt(group, darkMat, 7.4, 0.36, 0.08, 0, ROOF_Y + 0.18, -6.8 + i * 0.36);
  }
  boxAt(group, trimMat, 7.8, 0.06, 3.3, 0, ROOF_Y + 0.02, -5.36);
  // Mast with the obstruction lamp.
  cylAt(group, trimMat, 0.05, 0.08, 1.6, -3.2, ROOF_Y + 1.25, -1.2);
  const mastLamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), redLamp);
  mastLamp.position.set(-3.2, ROOF_Y + 2.08, -1.2);
  group.add(mastLamp);
  // Navigation lamps on the shoulders: red to port, green to starboard.
  for (const [side, mat] of [[-1, redLamp], [1, greenLamp]]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mat);
    l.position.set(side * (OUT_X - 0.2), ROOF_Y + 0.05, 3.1);
    group.add(l);
  }

  /* ---- the engines, across the stern ---- */
  for (const side of [-1, 1]) {
    const x = side * 4.1;
    cylAt(group, hullMat, 1.25, 1.35, 5.2, x, 1.25, AFT_Z - 0.4, 'z', 24);
    cylAt(group, darkMat, 1.18, 1.42, 0.9, x, 1.25, AFT_Z - 3.2, 'z', 24);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.08, 6, 28), ribMat);
    ring.position.set(x, 1.25, AFT_Z - 2.3);
    group.add(ring);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.05, 24), nozzleGlowMat);
    glow.position.set(x, 1.25, AFT_Z - 3.1);
    glow.rotation.y = Math.PI;
    group.add(glow);
  }
  cylAt(group, hullMat, 1.4, 1.6, 2.4, 0, 1.9, AFT_Z - 0.6, 'z', 24);
  const mainGlow = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), nozzleGlowMat);
  mainGlow.position.set(0, 1.9, AFT_Z - 1.82);
  mainGlow.rotation.y = Math.PI;
  group.add(mainGlow);

  /* ---- the airlock hatch and its ramp ---- */
  const H = AIRLOCK_HATCH;
  const hatch = new THREE.Group();
  hatch.position.set(OUT_X, 0, H.z);
  group.add(hatch);
  // The open hatch: the lit lock seen through the opening.
  const opening = new THREE.Mesh(new THREE.PlaneGeometry(H.w, H.h), hatchGlowMat);
  opening.position.set(0.015, H.y, 0);
  opening.rotation.y = Math.PI / 2;
  hatch.add(opening);
  // The surround, proud of the plate.
  for (const sz of [-1, 1]) boxAt(hatch, darkMat, 0.16, H.h + 0.3, 0.16, 0.08, H.y, sz * (H.w / 2 + 0.08));
  boxAt(hatch, darkMat, 0.16, 0.16, H.w + 0.32, 0.08, H.y + H.h / 2 + 0.08, 0);
  boxAt(hatch, M.hazardMat || trimMat, 0.02, 0.1, H.w + 0.32, 0.17, H.y + H.h / 2 + 0.24, 0);
  // A warm lamp over the hatch, so the ramp is lit on a dark world.
  const hatchLamp = new THREE.PointLight(0xffc27a, 1.6, 9, 1.6);
  hatchLamp.position.set(OUT_X + 0.7, H.y + H.h / 2 + 0.3, H.z);
  group.add(hatchLamp);

  const rampMat = M.treadMat || M.floorMat || darkMat;
  const ramp = new THREE.Group();
  group.add(ramp);
  const rampDeck = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, RAMP_W), rampMat);
  rampDeck.castShadow = rampDeck.receiveShadow = true;
  ramp.add(rampDeck);
  const rails = [-1, 1].map(() => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.06), trimMat);
    ramp.add(r);
    return r;
  });
  const posts = [];
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6), trimMat);
    ramp.add(p);
    posts.push(p);
  }

  /* ---- landing legs ---- */
  const legMat = darkMat;
  const legs = [];
  const LEG_AT = [[-1, -9.2], [1, -9.2], [-1, 1.6], [1, 1.6]];
  for (const [sx, z] of LEG_AT) {
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 1, 10), legMat);
    const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1, 10), M.steelMat || trimMat);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.16, 16), legMat);
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 8), legMat);
    for (const m of [upper, lowerLeg, pad, brace]) { m.castShadow = true; group.add(m); }
    legs.push({ sx, z, upper, lowerLeg, pad, brace });
  }

  applyWorldUVs(group);

  /**
   * Reach the legs and the ramp down to the ground. `groundAt(x, z)` is the
   * ground height in ship-local metres (negative: below the deck).
   */
  function fitToGround(groundAt) {
    for (const L of legs) {
      const x0 = L.sx * (OUT_X - 0.9), x1 = L.sx * (OUT_X + 0.5);
      const gy = groundAt(x1, L.z);
      const top = [x0, KEEL_Y + 0.1, L.z];
      const knee = [L.sx * (OUT_X + 0.1), KEEL_Y - 0.3, L.z];
      const foot = [x1, gy + 0.16, L.z];
      strut(L.upper, top, knee);
      strut(L.lowerLeg, knee, foot);
      strut(L.brace, [L.sx * (OUT_X - 2.4), KEEL_Y - 0.4, L.z], [x1 - L.sx * 0.1, gy + 0.3, L.z]);
      L.pad.position.set(x1, gy + 0.08, L.z);
    }

    const top = [HATCH_SILL.x, HATCH_SILL.y, HATCH_SILL.z];
    const footX = HATCH_SILL.x + RAMP_RUN;
    const footY = groundAt(footX, HATCH_SILL.z) + 0.05;
    const dx = footX - top[0], dy = footY - top[1];
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    rampDeck.scale.set(len, 1, 1);
    rampDeck.position.set((top[0] + footX) / 2, (top[1] + footY) / 2 - 0.05, HATCH_SILL.z);
    rampDeck.rotation.set(0, 0, ang);
    rails.forEach((r, i) => {
      const sz = i ? 1 : -1;
      r.scale.set(len, 1, 1);
      r.position.set((top[0] + footX) / 2, (top[1] + footY) / 2 + 0.9, HATCH_SILL.z + sz * (RAMP_W / 2 - 0.04));
      r.rotation.set(0, 0, ang);
    });
    posts.forEach((p, i) => {
      const t = i < 2 ? 0.12 : 0.9;
      const sz = i % 2 ? 1 : -1;
      const px = top[0] + dx * t, py = top[1] + dy * t;
      strut(p, [px, py, HATCH_SILL.z + sz * (RAMP_W / 2 - 0.04)], [px, py + 0.92, HATCH_SILL.z + sz * (RAMP_W / 2 - 0.04)]);
    });
  }

  return { group, fitToGround };
}

/* ---------------------------------------------------------------- placement */

/**
 * The transform that stands the ship at `landing`: ship-local → world.
 * Rotation is about y only, which is how a ship sits on the ground.
 */
export function landingMatrix(landing, out = new THREE.Matrix4()) {
  const q = new THREE.Quaternion().setFromAxisAngle(_up, landing.yaw);
  return out.compose(new THREE.Vector3(landing.x, landing.deckY, landing.z), q, new THREE.Vector3(1, 1, 1));
}

/** A ship-local point in world coordinates (x, z only, plus y). */
export function localToWorld(landing, x, y, z) {
  const c = Math.cos(landing.yaw), s = Math.sin(landing.yaw);
  return { x: landing.x + x * c + z * s, y: landing.deckY + y, z: landing.z - x * s + z * c };
}

/** A ship-local rectangle as a world-axis box. Exact for a yaw on the quarter turn. */
export function localRectToWorld(landing, r) {
  const pts = [[r.minX, r.minZ], [r.maxX, r.minZ], [r.maxX, r.maxZ], [r.minX, r.maxZ]]
    .map(([x, z]) => localToWorld(landing, x, 0, z));
  return {
    minX: Math.min(...pts.map(p => p.x)), maxX: Math.max(...pts.map(p => p.x)),
    minZ: Math.min(...pts.map(p => p.z)), maxZ: Math.max(...pts.map(p => p.z))
  };
}

/** The boxes the walk collides with once the ship is down. */
export function shipWorldColliders(landing) {
  return [
    localRectToWorld(landing, SHIP_FOOTPRINT.body),
    localRectToWorld(landing, SHIP_FOOTPRINT.ramp)
  ];
}

/* ------------------------------------------------------------ landing solver */

function boxHitsCollider(b, c, margin) {
  if (c.radius !== undefined) {
    const cx = Math.max(b.minX, Math.min(c.x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(c.z, b.maxZ));
    return Math.hypot(cx - c.x, cz - c.z) < c.radius + margin;
  }
  if (c.minX === undefined) return false;
  return b.minX - margin < c.maxX && b.maxX + margin > c.minX &&
         b.minZ - margin < c.maxZ && b.maxZ + margin > c.minZ;
}

/**
 * Pick where the Avalon sets down on `world`, and which way it faces.
 *
 * WHAT THE WORLD ALREADY HAS DECIDES IT. The ship is built to stand on its
 * legs on open ground, so the solver starts at `prefer` (a landing pad, where
 * a world has one) and spirals outward until it finds a spot where:
 *   - nothing the walk collides with, and no landmark's declared footprint,
 *     is under the hull, the ramp or the patch of ground at the ramp's foot;
 *   - the ground under the hull is level enough for the legs to take up
 *     (it is never pitched; a ship stands level and its legs reach down);
 *   - the ramp's foot is inside the walkable bounds.
 * The heading is chosen so the ramp comes down facing `faceToward` — the
 * benches, or the first pylon — on the quarter turn, so the hull's collider
 * box is exact. Every quarter turn is tried before the solver moves on.
 */
export function solveLanding(world, { prefer, faceToward, bounds = 96 } = {}) {
  const colliders = world.colliders || [];
  const landmarks = (world.data?.landmarks || []).filter(l => l.radius && l.asset !== 'landing-pad');
  const sites = world.data?.sites || [];
  const obstacles = [
    ...colliders,
    ...landmarks.map(l => ({ x: l.pos[0], z: l.pos[2], radius: l.radius * (l.scale || 1) })),
    ...sites.map(s => ({ x: s.pos[0], z: s.pos[2], radius: 3.2 }))
  ];
  const heightAt = (x, z) => world.getTerrainHeight(x, z);

  const px = prefer?.x ?? 0, pz = prefer?.z ?? 0;
  const tx = faceToward?.x ?? 0, tz = faceToward?.z ?? 0;
  // Starboard is ship-local +x, which a yaw of θ turns to world (cos θ, −sin θ).
  const want = Math.atan2(-(tz - pz), tx - px);
  const snapped = Math.round(want / (Math.PI / 2)) * (Math.PI / 2);
  const yaws = [0, 1, -1, 2].map(k => snapped + k * Math.PI / 2);

  // Room to step off the ramp and look about: a player should not walk down
  // it face-first into a stockpile.
  const standClear = {
    minX: RAMP_FOOT.x - 1.4, maxX: RAMP_FOOT.x + 4.5,
    minZ: RAMP_FOOT.z - 2.2, maxZ: RAMP_FOOT.z + 2.2
  };

  const tryAt = (x, z, yaw) => {
    const probe = { x, z, yaw, deckY: 0 };
    const rects = [SHIP_FOOTPRINT.body, SHIP_FOOTPRINT.ramp, standClear].map(r => localRectToWorld(probe, r));
    for (const r of rects) {
      if (r.minX < -bounds || r.maxX > bounds || r.minZ < -bounds || r.maxZ > bounds) return null;
      for (const c of obstacles) if (boxHitsCollider(r, c, 0.6)) return null;
    }
    // Level enough? Sample the ground under the hull.
    let lo = Infinity, hi = -Infinity;
    const B = SHIP_FOOTPRINT.body;
    for (let i = 0; i <= 6; i++) {
      for (let j = 0; j <= 10; j++) {
        const lx = B.minX + (B.maxX - B.minX) * (i / 6);
        const lz = B.minZ + (B.maxZ - B.minZ) * (j / 10);
        const w = localToWorld(probe, lx, 0, lz);
        const h = heightAt(w.x, w.z);
        lo = Math.min(lo, h); hi = Math.max(hi, h);
      }
    }
    if (hi - lo > 2.2) return null;
    const foot = localToWorld(probe, RAMP_FOOT.x, 0, RAMP_FOOT.z);
    const footY = heightAt(foot.x, foot.z);
    const deckY = hi + DECK_CLEARANCE;
    // The ramp must come DOWN to the ground, and not by a cliff.
    if (deckY + HATCH_SILL.y - footY > 4.2) return null;
    return { x, z, yaw, deckY, groundHi: hi, groundLo: lo };
  };

  // Facing the way it should matters more than a few metres: each heading is
  // tried near the preferred spot before any heading is tried further out.
  const search = (yawList, r0, r1) => {
    for (let r = r0; r <= r1; r += 2) {
      const n = r === 0 ? 1 : Math.max(8, Math.round((2 * Math.PI * r) / 4));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
        for (const yaw of yawList) {
          const hit = tryAt(x, z, yaw);
          if (hit) return hit;
        }
      }
    }
    return null;
  };
  for (const yaw of yaws) {
    const hit = search([yaw], 0, 12);
    if (hit) return hit;
  }
  const far = search(yaws, 14, 44);
  if (far) return far;
  // Nowhere clear: stand it at the preferred spot anyway rather than nowhere.
  const deckY = heightAt(px, pz) + DECK_CLEARANCE;
  return { x: px, z: pz, yaw: snapped, deckY, groundHi: deckY - DECK_CLEARANCE, groundLo: deckY - DECK_CLEARANCE };
}

/**
 * Where the ship sets down on each place it can fly to, and which way its
 * ramp faces. A world with a landing pad lands on the pad; Erebus, which has
 * only the survey lander, sets down in the basin near where a player has
 * always arrived, with the ramp toward the first pylon.
 */
export function landingPrefsFor(world) {
  const pad = world.data?.landmarks?.find(l => l.asset === 'landing-pad');
  if (pad) {
    const sites = world.data.sites || [];
    const cx = sites.reduce((s, v) => s + v.pos[0], 0) / Math.max(1, sites.length);
    const cz = sites.reduce((s, v) => s + v.pos[2], 0) / Math.max(1, sites.length);
    return { prefer: { x: pad.pos[0], z: pad.pos[2] }, faceToward: { x: cx, z: cz } };
  }
  const first = world.data?.sites?.[0];
  const spawn = world.data?.spawn?.pos || [0, 0, 0];
  return {
    prefer: { x: spawn[0] * 0.55, z: spawn[2] * 0.55 },
    faceToward: first ? { x: first.pos[0], z: first.pos[2] } : { x: 0, z: 0 }
  };
}
