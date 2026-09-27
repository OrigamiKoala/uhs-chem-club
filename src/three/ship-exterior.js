/**
 * ship-exterior.js — The Avalon seen from outside, and where it sets down.
 *
 * Aboard, the Avalon is its interior (`ship.js`): plating with rooms inside it
 * and nothing drawn on the outside, because nobody has ever stood out there.
 * The voyage changes that. The ship flies to a world, lands on it, and the
 * player walks out of the airlock onto the ground — at which point they can
 * turn round and look at what they arrived in. This file builds that.
 *
 * WHAT IT IS. A long, low, forty-year-old freighter, sand-scoured and rusting:
 *   - a chiselled wedge NOSE, lofted from a handful of faceted cross-sections,
 *     with a channel run down each flank, armour plates bolted to its facets
 *     and a pair of chin guns poking forward under the blunt tip;
 *   - a raised faceted COCKPIT where the nose meets the body, with slit ports;
 *   - a boxy MID-BODY of panelled plate, strakes, vents and pipe runs, a dorsal
 *     spine, a turret hump aft with its mast, and deck cargo lashed on the
 *     roof — two tarped crates and a rack of canisters;
 *   - FOUR ENGINE NACELLES, two stacked on each flank at the stern, banded
 *     cowlings streaked with rust, dark intakes and nozzle bells past the hull;
 *   - three splayed LANDING LEGS a side on hydraulic rams, standing on skids,
 *     and the grated STAIR down from the airlock hatch.
 *
 * THE SAME SHIP, WHERE IT MATTERS. The flank plate is the interior's plate
 * (`OUT_X`), the hatch is `AIRLOCK_HATCH` cut through it, the portholes are
 * `HULL_WINDOWS`. The shell is longer than the rooms — a nose forward of the
 * bridge, engines aft of the engine room — because a freighter is, and because
 * it is never drawn while the player is inside it.
 *
 * SHIP-LOCAL COORDINATES, as aboard: +z is the bow, +x starboard, the deck at
 * y = 0. `landingMatrix` places the whole thing in a world.
 *
 * ONE MESH PER MATERIAL. Everything that never moves is built from shared
 * primitives and lofts, UV'd in metres, and baked with `mergeStatic`. The legs
 * and the stair are rebuilt by `fitToGround` for the ground under them, merged
 * the same way, into two more meshes.
 *
 * NO LIGHTS. `hatchLamp` is a description the voyage hands to the world's own
 * lamp pool; a PointLight appearing in a world recompiles every material in
 * view. Everything that glows here is an unlit material, and dim.
 */

import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HULL, HULL_WINDOWS, AIRLOCK_HATCH } from "./ship-rooms.js";
import { platedMetal, buildMaterial, texSize, mergeStatic, canvas2d, makeRng } from "./materials/pbr-kit.js";
import { addDustCover } from "./erebus/surfaces.js";

/** Outer face of the side plating, in ship-local metres. */
const OUT_X = HULL.maxX + HULL.plate;               // 6.1
/** The belly of the mid-body, and its roof. */
const BELLY_Y = -1.15;
const ROOF_Y = 4.85;
/** The body's stern plate, and the blunt tip of the nose. */
const STERN_Z = -12.6;
const TIP_Z = 16.0;
/** The chin guns reach a little past the tip. */
const BARREL_TIP_Z = 16.55;

/** Engine nacelles: two a side, stacked, their fronts level at `front`. */
const NAC = { x: 6.85, ys: [0.3, 3.35], r: 1.4, band: 1.47, front: -9.6, len: 8.32 };

/** Where the ramp meets the hull: the hatch sill, on the starboard plate. */
export const HATCH_SILL = {
  x: OUT_X,
  y: AIRLOCK_HATCH.y - AIRLOCK_HATCH.h / 2,
  z: AIRLOCK_HATCH.z
};

/** How far the ramp reaches out from the plate, and how wide it is. */
const RAMP_RUN = 4.2;
const RAMP_W = 1.6;

/**
 * The deck stands this far above the highest ground under the ship: the belly
 * rides about a metre and a half up on its legs, and the stair from the hatch
 * is a steep one.
 */
export const DECK_CLEARANCE = 2.6;

/**
 * Everything the ship occupies on the ground, in ship-local x/z: the hull with
 * its nose, nacelles and legs, and the ramp. `landingTransform` turns these
 * into world boxes for the walk, and `solveLanding` keeps them clear of the
 * world.
 */
export const SHIP_FOOTPRINT = {
  body: {
    minX: -(NAC.x + NAC.band) - 0.1, maxX: NAC.x + NAC.band + 0.1,
    minZ: NAC.front - NAC.len - 0.15, maxZ: BARREL_TIP_Z + 0.1
  },
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

/* ------------------------------------------------------------ the hull loft */

/*
 * The hull is ONE loft: a faceted cross-section, the same ten points a side
 * everywhere, whose parameters are keyed along z. From the stern to z 3.2 it
 * is the mid-body — the interior's own plate on the flanks, chamfered at the
 * roof and the belly. Forward of that it narrows and drops into the nose, a
 * channel opens down each flank, and the belly rises into a chin.
 *
 * Half-profile, starboard, top to bottom:
 *   ridge · top shoulder · upper chine · channel top · channel back wall (2)
 *   · channel bottom · lower chine · belly shoulder · keel
 */
const BODY = {
  W: OUT_X, xTop: 5.2, yRidge: ROOF_Y, yTop: ROOF_Y, yCU: 4.3,
  yGT: 3.1, yGB: 2.9, gd: 0, yCL: -0.45, xBot: 4.9, yBot: BELLY_Y
};
const KEYS = [
  { z: STERN_Z, ...BODY },
  { z: 3.2, ...BODY },
  { z: 5.0, W: 5.35, xTop: 3.6, yRidge: 5.0, yTop: 4.72, yCU: 4.05, yGT: 2.95, yGB: 2.25, gd: 0.28, yCL: -0.3, xBot: 4.2, yBot: BELLY_Y },
  { z: 9.0, W: 3.25, xTop: 1.9, yRidge: 4.15, yTop: 3.95, yCU: 3.45, yGT: 2.75, yGB: 2.15, gd: 0.26, yCL: 0.8, xBot: 2.2, yBot: 0.4 },
  { z: 13.0, W: 1.8, xTop: 0.95, yRidge: 3.35, yTop: 3.2, yCU: 2.85, yGT: 2.5, yGB: 2.0, gd: 0.18, yCL: 1.3, xBot: 1.1, yBot: 0.95 },
  { z: TIP_Z, W: 0.75, xTop: 0.35, yRidge: 2.75, yTop: 2.65, yCU: 2.45, yGT: 2.25, yGB: 1.95, gd: 0.02, yCL: 1.5, xBot: 0.42, yBot: 1.28 }
];
const PARAMS = Object.keys(BODY);

/** The hull's cross-section parameters at `z`, interpolated between keys. */
function paramsAt(z) {
  const zc = Math.max(KEYS[0].z, Math.min(KEYS[KEYS.length - 1].z, z));
  let i = 0;
  while (i < KEYS.length - 2 && zc > KEYS[i + 1].z) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = (zc - a.z) / (b.z - a.z);
  const out = { z };
  for (const k of PARAMS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

function halfProfile(p) {
  return [
    [0, p.yRidge], [p.xTop, p.yTop], [p.W, p.yCU], [p.W, p.yGT],
    [p.W - p.gd, p.yGT - 0.08], [p.W - p.gd, p.yGB + 0.08], [p.W, p.yGB],
    [p.W, p.yCL], [p.xBot, p.yBot], [0, p.yBot]
  ];
}

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * A closed ring from a starboard half-profile, counter-clockwise seen from the
 * bow: the top centre, down the port side, the bottom centre, up starboard.
 * For a half of n points the starboard point i sits at index 2(n-1) - i.
 */
function ringFromHalf(h, z) {
  const out = [V3(h[0][0], h[0][1], z)];
  for (let i = 1; i < h.length - 1; i++) out.push(V3(-h[i][0], h[i][1], z));
  out.push(V3(0, h[h.length - 1][1], z));
  for (let i = h.length - 2; i >= 1; i--) out.push(V3(h[i][0], h[i][1], z));
  return out;
}

const hullRing = z => ringFromHalf(halfProfile(paramsAt(z)), z);

/** Starboard facets of the hull ring, by index (facet k runs ring[k] → ring[k+1]). */
const F = { lowChamfer: 10, lowFlank: 11, chanLow: 12, chanBack: 13, chanTop: 14, upFlank: 15, chine: 16, top: 17 };

/** The underside of the hull at (x, z): the belly, or its chamfer. */
function bottomAt(x, z) {
  const p = paramsAt(z);
  const ax = Math.abs(x);
  if (ax <= p.xBot) return p.yBot;
  return p.yBot + (Math.min(ax, p.W) - p.xBot) / Math.max(1e-3, p.W - p.xBot) * (p.yCL - p.yBot);
}

/* ------------------------------------------------------------ triangle kit */

function quadInto(tris, a, b, c, d) { tris.push([a, b, c], [a, c, d]); }

/** A six-sided solid from a base quad and a top quad, both CCW seen from outside the top. */
function hexaTris(b, t) {
  const tris = [];
  quadInto(tris, t[0], t[1], t[2], t[3]);
  quadInto(tris, b[0], b[3], b[2], b[1]);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    quadInto(tris, b[i], b[j], t[j], t[i]);
  }
  return tris;
}

/** Cap a ring (CCW in x/y) with a flat face whose normal points along ±z. */
function capTris(ring, facing) {
  const faces = THREE.ShapeUtils.triangulateShape(ring.map(p => new THREE.Vector2(p.x, p.y)), []);
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  return faces.map(([a, b, c]) => {
    const A = ring[a], B = ring[b], C = ring[c];
    const nz = e1.subVectors(B, A).cross(e2.subVectors(C, A)).z;
    return nz * facing >= 0 ? [A, B, C] : [A, C, B];
  });
}

/**
 * Loft consecutive rings (same point count, CCW, increasing z) into a closed
 * faceted solid. `skip(i, k)` leaves a facet out so the caller can cut it.
 */
function loftTris(rings, { capStart = true, capEnd = true, skip = null } = {}) {
  const tris = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i], B = rings[i + 1], n = A.length;
    for (let k = 0; k < n; k++) {
      if (skip && skip(i, k)) continue;
      const k1 = (k + 1) % n;
      quadInto(tris, A[k], A[k1], B[k1], B[k]);
    }
  }
  if (capStart) tris.push(...capTris(rings[0], -1));
  if (capEnd) tris.push(...capTris(rings[rings.length - 1], 1));
  return tris;
}

/** The same triangles on the port side: mirrored in x, wound the other way. */
function mirrorTris(tris) {
  const m = p => V3(-p.x, p.y, p.z);
  return tris.map(([a, b, c]) => [m(a), m(c), m(b)]);
}

/** Non-indexed geometry from triangles; flat normals, so every facet reads. */
function triGeo(tris) {
  const pos = new Float32Array(tris.length * 9);
  let o = 0;
  for (const t of tris) for (const p of t) { pos[o++] = p.x; pos[o++] = p.y; pos[o++] = p.z; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(tris.length * 6), 2));
  g.computeVertexNormals();
  return g;
}

/**
 * A plate bolted to facet `k` of a ring function, covering u (across the
 * facet, 0…1) and z. It stands `t` proud, its top edge chamfered in by
 * `inset` metres, and its foot is sunk a centimetre so no seam shows.
 */
function plateTris(ringFn, k, u0, u1, za, zb, t, inset = 0.05) {
  const at = (u, z) => { const r = ringFn(z); return r[k].clone().lerp(r[(k + 1) % r.length], u); };
  const base = [at(u0, za), at(u1, za), at(u1, zb), at(u0, zb)];
  const n = new THREE.Vector3().subVectors(base[1], base[0])
    .cross(new THREE.Vector3().subVectors(base[3], base[0])).normalize();
  const width = base[0].distanceTo(base[1]) / Math.max(1e-3, u1 - u0);
  const du = Math.min((u1 - u0) * 0.3, inset / Math.max(1e-3, width));
  const dz = Math.min((zb - za) * 0.3, inset);
  const top = [at(u0 + du, za + dz), at(u1 - du, za + dz), at(u1 - du, zb - dz), at(u0 + du, zb - dz)]
    .map(p => p.addScaledVector(n, t));
  return hexaTris(base.map(p => p.clone().addScaledVector(n, -0.012)), top);
}

/* ------------------------------------------------------------- UVs in metres */

/**
 * Box-project a geometry's UVs in the frame `matrix` puts it in, at `s`
 * metres a tile: the same texel density on every part, the way the interior
 * does it with `applyWorldUVs` (which is keyed on material, where this is
 * keyed on mesh so a lathe can keep its own cylindrical UVs).
 */
const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
function boxUV(geo, matrix, s) {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  if (!pos || !nor) return geo;
  const uv = new Float32Array(pos.count * 2);
  _nm.getNormalMatrix(matrix);
  for (let i = 0; i < pos.count; i++) {
    _p.fromBufferAttribute(pos, i).applyMatrix4(matrix);
    _n.fromBufferAttribute(nor, i).applyMatrix3(_nm);
    const ax = Math.abs(_n.x), ay = Math.abs(_n.y), az = Math.abs(_n.z);
    let u, v;
    if (ax >= ay && ax >= az) { u = _p.z * Math.sign(_n.x || 1); v = _p.y; }
    else if (ay >= az) { u = _p.x; v = _p.z * Math.sign(_n.y || 1); }
    else { u = -_p.x * Math.sign(_n.z || 1); v = _p.y; }
    uv[i * 2] = u / s;
    uv[i * 2 + 1] = v / s;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

function projectUVs(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const m = new THREE.Matrix4();
  root.traverse(o => {
    if (!o.isMesh || o.userData.keepUV) return;
    const s = o.material?.userData?.tile;
    if (!s) return;
    o.geometry = boxUV(o.geometry.clone(), m.multiplyMatrices(inv, o.matrixWorld), s);
  });
}

/* --------------------------------------------------------------- materials */

/**
 * The outside of the ship has its own plate. The interior's materials are the
 * ship in service; this is the ship after forty years parked in the open:
 * paint chalked and scoured off the edges, rust bloomed out of the bare metal
 * and run down every flank, grime in every seam, sand on whatever faces up.
 */
function plate({ tile, dust = 0.4, color = 0xffffff, side, ...surf }) {
  const mat = buildMaterial(platedMetal({ size: texSize(512), ...surf }), { repeat: 1, roughness: 1.0 });
  mat.color.setHex(color);
  mat.aoMapIntensity = 0.85;
  mat.userData.tile = tile;
  if (side !== undefined) mat.side = side;
  return dust > 0 ? addDustCover(mat, { amount: dust, sharp: [0.55, 0.92], film: 0.05 }) : mat;
}

/** Olive-drab canvas: a coarse weave, stained and sun-bleached in patches. */
function tarpTexture() {
  const S = 128;
  const c = canvas2d(S, S);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  const rnd = makeRng(4417);
  const blot = [];
  for (let i = 0; i < 14; i++) blot.push([rnd() * S, rnd() * S, 8 + rnd() * 22, rnd() - 0.4]);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const weave = ((x >> 1) + (y >> 1)) % 2 ? 1.04 : 0.95;
      let k = weave * (0.93 + rnd() * 0.1);
      for (const [bx, by, br, bs] of blot) {
        const dx = Math.min(Math.abs(x - bx), S - Math.abs(x - bx));
        const dy = Math.min(Math.abs(y - by), S - Math.abs(y - by));
        const d = Math.hypot(dx, dy);
        if (d < br) k *= 1 + bs * 0.3 * (1 - d / br);
      }
      const i = (y * S + x) * 4;
      img.data[i] = Math.min(255, 104 * k);
      img.data[i + 1] = Math.min(255, 104 * k);
      img.data[i + 2] = Math.min(255, 72 * k);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** The lock seen through the open hatch: lamp-lit at the top, falling to shadow. */
function hatchGlowTexture() {
  const c = canvas2d(64, 128);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#9c6a36');
  g.addColorStop(0.3, '#6c4829');
  g.addColorStop(1, '#241912');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 128);
  // The far wall of the lock and the inner door in silhouette.
  ctx.fillStyle = 'rgba(22, 15, 10, 0.8)';
  ctx.fillRect(0, 0, 6, 128);
  ctx.fillRect(58, 0, 6, 128);
  ctx.fillStyle = 'rgba(34, 23, 14, 0.55)';
  ctx.fillRect(20, 34, 24, 94);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ build */

/**
 * Build the outside of the Avalon. `M` is the ship's interior (its material
 * set); the shell makes its own plate and borrows only the hazard stripe.
 *
 * Returns the group plus `fitToGround(localGroundAt)`, which reaches the legs
 * and the stair down to the ground the ship is standing over, and `hatchLamp`,
 * the light over the hatch as a description for the world's lamp pool.
 * `localGroundAt(x, z)` answers in ship-local metres (negative: below deck).
 */
export function buildShipExterior(M) {
  const group = new THREE.Group();
  group.name = 'avalon-exterior';
  const shell = new THREE.Group();
  shell.name = 'avalon-shell';
  group.add(shell);

  /* ---- materials ---- */
  const hullMat = plate({ tile: 3.0, paint: '#8d877b', metal: '#a39e94', rust: '#7c4526', panels: 2, seed: 17, weather: 0.9, dust: 0.42 });
  const plateMat = plate({ tile: 2.0, paint: '#8b7759', metal: '#9d968a', rust: '#74401f', panels: 2, seed: 23, weather: 0.88, dust: 0.38, size: texSize(256) });
  const engineMat = plate({ tile: 2.4, paint: '#837b6d', metal: '#958f84', rust: '#86461f', panels: 2, seed: 29, weather: 1.0, dust: 0.3 });
  const darkMat = plate({ tile: 1.5, paint: '#3d3b37', metal: '#6d6860', rust: '#613a21', panels: 3, seed: 41, weather: 0.75, dust: 0.22, size: texSize(256), side: THREE.DoubleSide });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x8e8a82, roughness: 0.38, metalness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0b0e11, roughness: 0.14, metalness: 0.85 });
  const tarpMat = new THREE.MeshStandardMaterial({ map: tarpTexture(), roughness: 0.96, metalness: 0.0 });
  tarpMat.userData.tile = 1.3;
  const canMat = new THREE.MeshStandardMaterial({ color: 0x4b5634, roughness: 0.6, metalness: 0.3 });
  const hazardMat = M?.hazardMat || darkMat;
  // Filament light seen from outside: dim and local, never a bloom.
  const hatchGlowMat = new THREE.MeshBasicMaterial({ map: hatchGlowTexture() });
  const portGlowMat = new THREE.MeshBasicMaterial({ color: 0x7a5630 });
  const nozzleGlowMat = new THREE.MeshBasicMaterial({ color: 0x3e2211 });
  const redLamp = new THREE.MeshBasicMaterial({ color: 0xa3301f });
  const greenLamp = new THREE.MeshBasicMaterial({ color: 0x4f7d2a });
  const amberLamp = new THREE.MeshBasicMaterial({ color: 0xa06c2c });

  /** Triangles collected per material, turned into one mesh each at the end. */
  const T = new Map();
  const tri = (mat, tris) => { if (!T.has(mat)) T.set(mat, []); T.get(mat).push(...tris); };
  const triBoth = (mat, tris) => { tri(mat, tris); tri(mat, mirrorTris(tris)); };

  const add = (geo, mat, opts = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = opts.cast !== false;
    m.receiveShadow = true;
    if (opts.keepUV) m.userData.keepUV = true;
    shell.add(m);
    return m;
  };
  const box = (mat, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = add(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    return m;
  };
  const up = new THREE.Vector3(0, 1, 0);
  const cylBetween = (mat, a, b, r, seg = 10, r2 = r) => {
    const A = a.isVector3 ? a : V3(...a), B = b.isVector3 ? b : V3(...b);
    const d = B.clone().sub(A);
    const m = add(new THREE.CylinderGeometry(r2, r, d.length(), seg), mat);
    m.position.copy(A).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(up, d.normalize());
    return m;
  };
  const rnd = makeRng(9127);

  /* ================================================================ HULL */

  /*
   * The hatch is a real hole in the loft: the starboard lower flank is cut
   * away between the hatch's jambs and rebuilt round the opening, with its
   * reveal lined back to the depth of the plate.
   */
  const H = AIRLOCK_HATCH;
  const hz0 = H.z - H.w / 2, hz1 = H.z + H.w / 2;
  const hy0 = H.y - H.h / 2, hy1 = H.y + H.h / 2;
  const REVEAL_X = OUT_X - 0.36;
  const zs = [STERN_Z, hz0, hz1, ...KEYS.slice(1).map(k => k.z)];
  const rings = zs.map(hullRing);
  const hatchSpan = 1;                       // ring interval hz0 → hz1
  tri(hullMat, loftTris(rings, { skip: (i, k) => i === hatchSpan && k === F.lowFlank }));
  {
    const W = OUT_X, p = paramsAt(H.z);
    const q = (a, b, c, d) => { const t = []; quadInto(t, a, b, c, d); return t; };
    // Plate below and above the opening.
    tri(hullMat, q(V3(W, p.yCL, hz0), V3(W, hy0, hz0), V3(W, hy0, hz1), V3(W, p.yCL, hz1)));
    tri(hullMat, q(V3(W, hy1, hz0), V3(W, p.yGB, hz0), V3(W, p.yGB, hz1), V3(W, hy1, hz1)));
    // The reveal: sill, head and the two jambs, facing into the opening.
    const R = REVEAL_X;
    tri(darkMat, q(V3(R, hy0, hz0), V3(R, hy0, hz1), V3(W, hy0, hz1), V3(W, hy0, hz0)));
    tri(darkMat, q(V3(R, hy1, hz0), V3(W, hy1, hz0), V3(W, hy1, hz1), V3(R, hy1, hz1)));
    tri(darkMat, q(V3(R, hy0, hz0), V3(W, hy0, hz0), V3(W, hy1, hz0), V3(R, hy1, hz0)));
    tri(darkMat, q(V3(R, hy0, hz1), V3(R, hy1, hz1), V3(W, hy1, hz1), V3(W, hy0, hz1)));
  }

  /* ---- armour on the nose: plates on its facets, two tones ---- */
  const noseSpans = [[5.0, 9.0], [9.0, 13.0]];
  for (const [za, zb] of noseSpans) {
    const mid = (za + zb) / 2;
    triBoth(plateMat, plateTris(hullRing, F.chine, 0.08, 0.92, za + 0.3, mid - 0.08, 0.07, 0.06));
    triBoth(hullMat, plateTris(hullRing, F.chine, 0.08, 0.92, mid + 0.08, zb - 0.35, 0.07, 0.06));
    triBoth(zb < 10 ? hullMat : plateMat, plateTris(hullRing, F.upFlank, 0.1, 0.9, za + 0.45, zb - 0.4, 0.06, 0.04));
    triBoth(plateMat, plateTris(hullRing, F.lowFlank, 0.12, 0.9, za + 0.35, mid - 0.1, 0.08, 0.07));
    triBoth(za < 6 ? hullMat : plateMat, plateTris(hullRing, F.lowFlank, 0.12, 0.9, mid + 0.1, zb - 0.3, 0.08, 0.07));
    triBoth(hullMat, plateTris(hullRing, F.top, 0.12, 0.8, za + 0.6, zb - 0.6, 0.05, 0.05));
  }
  // A pipe run along the back of each channel, on brackets.
  {
    const chanPt = z => {
      const r = hullRing(z);
      return r[F.chanBack].clone().lerp(r[F.chanBack + 1], 0.5).add(V3(0.09, 0, 0));
    };
    const pts = [5.4, 9.0, 12.6].map(chanPt);
    for (const s of [1, -1]) {
      const P = pts.map(p => V3(p.x * s, p.y, p.z));
      for (let i = 0; i < P.length - 1; i++) cylBetween(darkMat, P[i], P[i + 1], 0.075, 8);
      for (let z = 5.9; z < 12.4; z += 1.3) {
        const c = chanPt(z);
        box(darkMat, 0.16, 0.22, 0.1, s * (c.x - 0.02), c.y, z);
      }
    }
  }

  /* ---- chin guns and the sensor in the tip ---- */
  for (const s of [1, -1]) {
    const x0 = 0.68, x1 = 1.36, za = 8.9, zb = 12.3;
    const topY = z => bottomAt(1.0, z) + 0.1;
    const botY = z => bottomAt(1.0, z) - 0.36;
    const b = [V3(x0, botY(za), za), V3(x1, botY(za), za), V3(x1, botY(zb), zb), V3(x0, botY(zb), zb)];
    // Base CCW seen from below (outside the underside), top CCW seen from above.
    const podTris = hexaTris(
      [b[0], b[3], b[2], b[1]],
      [V3(x0, topY(za), za), V3(x0, topY(zb), zb), V3(x1, topY(zb), zb), V3(x1, topY(za), za)]
    );
    tri(darkMat, s > 0 ? podTris : mirrorTris(podTris));
    const by = (botY(zb) + bottomAt(1.0, zb)) / 2 - 0.06;
    cylBetween(darkMat, V3(s * 1.02, by, zb - 0.3), V3(s * 1.02, by, 13.5), 0.13, 10);
    cylBetween(steelMat, V3(s * 1.02, by, 13.5), V3(s * 1.02, by, 16.3), 0.065, 8);
    cylBetween(darkMat, V3(s * 1.02, by, 16.3), V3(s * 1.02, by, BARREL_TIP_Z), 0.1, 8);
  }
  cylBetween(darkMat, V3(0, 1.62, TIP_Z - 0.1), V3(0, 1.62, TIP_Z + 0.42), 0.11, 10);
  box(glassMat, 0.7, 0.16, 0.04, 0, 2.28, TIP_Z + 0.02);

  /* ---- the cockpit: a raised faceted block where the nose meets the body ---- */
  const cockHalf = (W, top, base) => [[0, top + 0.05], [0.55 * W, top], [W, top - 0.5], [W, base], [0, base]];
  const COCK = [
    { z: 0.9, W: 3.3, top: 5.75, base: 4.6 },
    { z: 3.8, W: 3.0, top: 5.75, base: 4.6 },
    { z: 7.4, W: 1.3, top: 4.35, base: 3.8 }
  ];
  const cockAt = z => {
    let i = z <= COCK[1].z ? 0 : 1;
    const a = COCK[i], b = COCK[i + 1];
    const t = Math.max(0, Math.min(1, (z - a.z) / (b.z - a.z)));
    const L = k => a[k] + (b[k] - a[k]) * t;
    return ringFromHalf(cockHalf(L('W'), L('top'), L('base')), z);
  };
  tri(hullMat, loftTris(COCK.map(c => cockAt(c.z))));
  // Cockpit ring: 0 top, 1-3 port, 4 keel, 5 base, 6 chine, 7 top shoulder (starboard).
  // Slit ports down the chamfers, and a pair raked forward as a windscreen.
  for (const [za, zb] of [[1.3, 1.95], [2.1, 2.75], [2.9, 3.5]]) {
    triBoth(darkMat, plateTris(cockAt, 6, 0.26, 0.78, za - 0.05, zb + 0.05, 0.02, 0.0));
    triBoth(glassMat, plateTris(cockAt, 6, 0.32, 0.72, za, zb, 0.035, 0.0));
  }
  triBoth(darkMat, plateTris(cockAt, 6, 0.36, 0.84, 3.95, 5.05, 0.02, 0.0));
  triBoth(glassMat, plateTris(cockAt, 6, 0.42, 0.78, 4.0, 5.0, 0.035, 0.0));
  triBoth(darkMat, plateTris(cockAt, 7, 0.08, 0.92, 3.95, 4.65, 0.02, 0.0));
  triBoth(glassMat, plateTris(cockAt, 7, 0.12, 0.88, 4.0, 4.6, 0.035, 0.0));
  // Armour over the cockpit sides, and a sensor blister on its roof.
  triBoth(plateMat, plateTris(cockAt, 5, 0.1, 0.9, 1.1, 3.4, 0.06, 0.05));
  triBoth(plateMat, plateTris(cockAt, 7, 0.15, 0.9, 1.2, 3.3, 0.05, 0.05));
  box(darkMat, 0.7, 0.24, 1.1, 0, 5.9, 2.0);
  cylBetween(darkMat, V3(0.2, 6.0, 1.8), V3(0.2, 6.65, 1.8), 0.03, 6);
  cylBetween(darkMat, V3(-0.25, 6.0, 2.3), V3(-0.25, 6.4, 2.3), 0.025, 6);

  /* ---- the dorsal spine and the turret hump aft ---- */
  const prismZ = (profile, z0, z1) => loftTris([profile.map(([x, y]) => V3(x, y, z0)), profile.map(([x, y]) => V3(x, y, z1))]);
  tri(hullMat, prismZ([[-1.0, ROOF_Y - 0.05], [1.0, ROOF_Y - 0.05], [0.72, ROOF_Y + 0.42], [-0.72, ROOF_Y + 0.42]], STERN_Z + 0.4, -4.8));
  // Rib plates across the spine.
  for (let z = -5.2; z > STERN_Z + 0.6; z -= 1.1) box(darkMat, 1.7, 0.36, 0.1, 0, ROOF_Y + 0.25, z);
  const humpHalf = (W, top, base) => [[0, top], [0.6 * W, top], [W, top - 0.4], [W, base], [0, base]];
  const HUMP = [
    { z: -11.2, W: 1.8, top: 5.6 }, { z: -10.4, W: 2.3, top: 5.95 },
    { z: -7.1, W: 2.3, top: 5.95 }, { z: -6.2, W: 1.7, top: 5.55 }
  ];
  tri(hullMat, loftTris(HUMP.map(h => ringFromHalf(humpHalf(h.W, h.top, ROOF_Y - 0.1), h.z))));
  triBoth(plateMat, plateTris(z => ringFromHalf(humpHalf(2.3, 5.95, ROOF_Y - 0.1), z), 6, 0.1, 0.9, -10.2, -7.3, 0.05, 0.05));
  // A squat turret on the hump: an eight-sided ring, a gun housing, twin barrels.
  {
    const tz = -8.6, ty = 5.95;
    const ring = add(new THREE.CylinderGeometry(0.95, 1.05, 0.42, 8), darkMat);
    ring.position.set(0, ty + 0.2, tz);
    ring.rotation.y = Math.PI / 8;
    box(hullMat, 1.1, 0.45, 1.3, 0, ty + 0.62, tz + 0.1);
    box(darkMat, 0.5, 0.3, 0.35, 0, ty + 0.62, tz + 0.85);
    for (const s of [-1, 1]) cylBetween(darkMat, V3(s * 0.16, ty + 0.62, tz + 0.9), V3(s * 0.16, ty + 0.62, tz + 2.5), 0.055, 8);
    // The mast and its obstruction lamp; a whip beside it.
    cylBetween(darkMat, V3(0.95, ty, -10.0), V3(0.95, ty + 2.3, -10.0), 0.05, 6, 0.03);
    const lamp = add(new THREE.SphereGeometry(0.08, 8, 6), redLamp, { cast: false });
    lamp.position.set(0.95, ty + 2.36, -10.0);
    cylBetween(darkMat, V3(-1.0, ty - 0.1, -10.5), V3(-1.0, ty + 1.5, -10.5), 0.02, 5, 0.012);
    box(darkMat, 0.5, 0.08, 0.5, -1.2, ty + 0.05, -7.6);
  }

  /* ---- deck cargo: two tarped crates with X-straps, a rack of canisters ---- */
  for (const cz of [-1.15, -3.45]) {
    const cx = 1.4, w = 2.0, h = 1.1, d = 2.05, y0 = ROOF_Y;
    box(tarpMat, w, h, d, cx, y0 + h / 2, cz);
    box(tarpMat, w + 0.12, 0.22, d + 0.12, cx, y0 + 0.11, cz);
    // Folds where the tarp is pulled tight over the top edges.
    box(tarpMat, w + 0.05, 0.08, 0.14, cx, y0 + h, cz - d / 2 + 0.06, 0.6, 0, 0);
    box(tarpMat, w + 0.05, 0.08, 0.14, cx, y0 + h, cz + d / 2 - 0.06, -0.6, 0, 0);
    const a = Math.atan2(h, d);
    for (const sx of [1, -1]) {
      // X across the long faces...
      for (const r of [a, -a]) box(darkMat, 0.03, 0.1, Math.hypot(h, d) - 0.1, cx + sx * (w / 2 + 0.012), y0 + h / 2, cz, r, 0, 0);
    }
    // ...and over the top.
    const b = Math.atan2(w, d);
    for (const r of [b, -b]) box(darkMat, 0.1, 0.03, Math.hypot(w, d) - 0.15, cx, y0 + h + 0.012, cz, 0, r, 0);
    // Tie-downs at the corners.
    for (const [ox, oz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) box(darkMat, 0.16, 0.12, 0.16, cx + ox * (w / 2 + 0.1), y0 + 0.06, cz + oz * (d / 2 + 0.1));
  }
  for (const [x, z] of [[0.6, 0.38], [1.25, 0.38], [1.9, 0.38]]) {
    const c = add(new THREE.CylinderGeometry(0.27, 0.27, 0.86, 12), canMat);
    c.position.set(x, ROOF_Y + 0.43, z);
    const cap = add(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 8), darkMat);
    cap.position.set(x, ROOF_Y + 0.9, z);
  }
  box(darkMat, 2.1, 0.06, 0.08, 1.25, ROOF_Y + 0.62, 0.7);
  box(darkMat, 2.1, 0.06, 0.08, 1.25, ROOF_Y + 0.62, 0.06);
  const lying = add(new THREE.CylinderGeometry(0.24, 0.24, 1.0, 12), canMat);
  lying.position.set(-0.9, ROOF_Y + 0.24, 0.35);
  lying.rotation.z = Math.PI / 2;

  /* ---- the roof: hatches, vents, a radiator bank ---- */
  box(darkMat, 1.2, 0.12, 1.2, -2.8, ROOF_Y + 0.06, -2.0);
  box(darkMat, 1.0, 0.1, 1.0, -2.8, ROOF_Y + 0.17, -2.0);
  box(darkMat, 1.4, 0.18, 2.2, -3.4, ROOF_Y + 0.09, -5.6);
  for (let i = 0; i < 7; i++) box(darkMat, 1.8, 0.3, 0.06, 3.4, ROOF_Y + 0.15, -5.2 - i * 0.3);
  box(hullMat, 2.1, 0.08, 2.2, 3.4, ROOF_Y + 0.02, -6.1);
  box(plateMat, 2.6, 0.06, 3.0, -3.3, ROOF_Y + 0.02, 1.6);

  /* ---- the flanks: strakes, panels, vents, pipes ---- */
  const hatchClear = z => z > H.z - 1.05 && z < H.z + 1.05;
  const portClear = (z, y0, y1) => HULL_WINDOWS.some(w => {
    const hw = (w.r ? w.r : w.w / 2) + 0.3, hh = (w.r ? w.r : w.h / 2) + 0.25;
    return Math.abs(z - w.z) < hw + 0.7 && y1 > w.y - hh && y0 < w.y + hh;
  });
  const FLANK_Z0 = NAC.front + 0.25, FLANK_Z1 = 2.95;
  for (const s of [1, -1]) {
    const x = s * OUT_X;
    // Rub strakes, broken round the hatch on the starboard side.
    const runs = s > 0 ? [[FLANK_Z0, H.z - 0.95], [H.z + 0.95, FLANK_Z1]] : [[FLANK_Z0, FLANK_Z1]];
    for (const [z0, z1] of runs) {
      for (const y of [0.1, 3.95]) box(darkMat, 0.16, 0.14, z1 - z0, x + s * 0.07, y, (z0 + z1) / 2);
    }
    // Panels: two courses of plate, some missing, some vents.
    const cols = 8, cw = (FLANK_Z1 - FLANK_Z0) / cols;
    for (let c = 0; c < cols; c++) {
      const z0 = FLANK_Z0 + c * cw + 0.06, z1 = z0 + cw - 0.12, zc = (z0 + z1) / 2;
      for (const [y0, y1] of [[0.34, 1.92], [2.04, 3.8]]) {
        if (s > 0 && (hatchClear(z0) || hatchClear(z1) || (z0 < H.z && z1 > H.z))) continue;
        if (s < 0 && portClear(zc, y0, y1)) continue;
        const roll = rnd();
        if (roll < 0.14) continue;                     // a plate long gone
        if (roll < 0.3) {
          // A louvred vent: a dark recess with slats across it.
          const vh = Math.min(0.9, y1 - y0 - 0.3), vw = Math.min(1.1, z1 - z0 - 0.2), vy = (y0 + y1) / 2;
          box(darkMat, 0.08, vh + 0.12, vw + 0.12, x + s * 0.04, vy, zc);
          for (let k = 0; k < 5; k++) box(hullMat, 0.1, 0.05, vw, x + s * 0.09, vy - vh / 2 + 0.1 + k * (vh - 0.2) / 4, zc, 0, 0, s * 0.5);
          continue;
        }
        box(roll < 0.62 ? plateMat : hullMat, 0.06, y1 - y0, z1 - z0, x + s * 0.03, (y0 + y1) / 2, zc);
      }
    }
    // A pipe run under the upper strake, on brackets.
    const pr = s > 0 ? [[FLANK_Z0 + 0.3, 2.4]] : [[FLANK_Z0 + 0.3, -7.2], [-5.6, 2.4]];
    for (const [z0, z1] of pr) {
      cylBetween(darkMat, V3(x + s * 0.2, 3.55, z0), V3(x + s * 0.2, 3.55, z1), 0.07, 8);
      for (let z = z0 + 0.4; z < z1; z += 1.5) box(darkMat, 0.24, 0.1, 0.1, x + s * 0.12, 3.55, z);
    }
    // Service boxes low on the flank, forward.
    box(darkMat, 0.3, 0.6, 1.0, x + s * 0.15, 0.95, 1.9);
    box(darkMat, 0.22, 0.34, 0.6, x + s * 0.11, 1.5, 0.9);
    cylBetween(darkMat, V3(x + s * 0.12, 0.65, 1.4), V3(x + s * 0.12, 0.65, -1.0), 0.045, 6);
  }

  /* ---- the belly: keel, housings ---- */
  box(darkMat, 2.6, 0.2, 13.6, 0, BELLY_Y - 0.1, -4.4);
  for (const [x, z] of [[-2.8, -9.0], [2.8, -9.0], [-2.6, 2.4], [2.6, 2.4], [0, -11.4]]) box(darkMat, 1.1, 0.22, 1.1, x, BELLY_Y - 0.11, z);
  for (const s of [-1, 1]) {
    const l = add(new THREE.CircleGeometry(0.12, 8), amberLamp, { cast: false });
    l.position.set(s * 2.6, BELLY_Y - 0.225, 2.4);
    l.rotation.x = Math.PI / 2;
  }

  /* ---- the stern plate, between the engines ---- */
  {
    const z = STERN_Z;
    box(darkMat, 3.6, 1.6, 0.14, 0, 2.1, z - 0.07);
    for (let k = 0; k < 7; k++) box(hullMat, 3.4, 0.08, 0.16, 0, 1.45 + k * 0.21, z - 0.16, 0.5, 0, 0);
    box(darkMat, 1.3, 1.0, 0.18, -2.6, 0.2, z - 0.09);
    box(darkMat, 1.3, 1.0, 0.18, 2.6, 0.2, z - 0.09);
    box(plateMat, 2.2, 0.9, 0.08, 0, 0.1, z - 0.04);
    box(plateMat, 4.4, 0.7, 0.08, 0, 3.8, z - 0.04);
    for (const s of [-1, 1]) {
      const l = add(new THREE.SphereGeometry(0.07, 8, 6), amberLamp, { cast: false });
      l.position.set(s * 4.9, 4.6, z - 0.05);
    }
  }

  /* ---- ports: the portholes on the port side ---- */
  for (const w of HULL_WINDOWS) {
    const x = w.side * (OUT_X + 0.012);
    const geo = w.r ? new THREE.CircleGeometry(w.r, 18) : new THREE.PlaneGeometry(w.w, w.h);
    const m = add(geo, portGlowMat, { cast: false });
    m.position.set(x, w.y, w.z);
    m.rotation.y = w.side * Math.PI / 2;
    if (w.r) {
      const rim = add(new THREE.TorusGeometry(w.r + 0.06, 0.06, 6, 18), darkMat);
      rim.position.set(w.side * (OUT_X + 0.03), w.y, w.z);
      rim.rotation.y = m.rotation.y;
    } else {
      // A slot: a frame of four bars round it.
      const fx = w.side * (OUT_X + 0.04);
      for (const s of [-1, 1]) {
        box(darkMat, 0.08, 0.09, w.w + 0.18, fx, w.y + s * (w.h / 2 + 0.045), w.z);
        box(darkMat, 0.08, w.h, 0.09, fx, w.y, w.z + s * (w.w / 2 + 0.045));
      }
    }
  }

  /* ---- navigation lamps: red to port, green to starboard ---- */
  {
    const p = paramsAt(5.0);
    for (const [s, mat] of [[-1, redLamp], [1, greenLamp]]) {
      const l = add(new THREE.SphereGeometry(0.1, 8, 6), mat, { cast: false });
      l.position.set(s * (p.W + 0.02), p.yCU + 0.02, 5.0);
    }
  }

  /* ---- the airlock hatch, from outside ---- */
  {
    const glow = add(new THREE.PlaneGeometry(H.w, H.h), hatchGlowMat, { cast: false });
    glow.position.set(REVEAL_X, H.y, H.z);
    glow.rotation.y = Math.PI / 2;
    // A surround proud of the plate, a sill plate for the stair to land on.
    const fx = OUT_X + 0.11;
    for (const s of [-1, 1]) box(darkMat, 0.22, H.h + 0.42, 0.18, fx, H.y + 0.05, H.z + s * (H.w / 2 + 0.09));
    box(darkMat, 0.22, 0.2, H.w + 0.36, fx, hy1 + 0.1, H.z);
    box(darkMat, 0.3, 0.08, H.w + 0.36, OUT_X + 0.15, hy0 - 0.04, H.z);
    box(hazardMat, 0.02, 0.1, H.w + 0.3, OUT_X + 0.225, hy1 + 0.1, H.z);
    // A hood over it, and the work lamp under the hood.
    box(hullMat, 0.5, 0.07, H.w + 0.9, OUT_X + 0.25, hy1 + 0.42, H.z, 0, 0, -0.12);
    box(darkMat, 0.14, 0.1, 0.4, OUT_X + 0.34, hy1 + 0.32, H.z);
    const lens = add(new THREE.PlaneGeometry(0.34, 0.1), amberLamp, { cast: false });
    lens.position.set(OUT_X + 0.34, hy1 + 0.268, H.z);
    lens.rotation.x = Math.PI / 2;
    // The cycle panel beside the hatch.
    box(darkMat, 0.1, 0.45, 0.32, OUT_X + 0.05, 1.35, H.z + H.w / 2 + 0.55);
    const key = add(new THREE.PlaneGeometry(0.06, 0.06), amberLamp, { cast: false });
    key.position.set(OUT_X + 0.102, 1.48, H.z + H.w / 2 + 0.55);
    key.rotation.y = Math.PI / 2;
  }
  const hatchLamp = {
    local: new THREE.Vector3(OUT_X + 0.7, H.y + H.h / 2 + 0.3, H.z),
    color: 0xffc27a, intensity: 1.6, distance: 9, decay: 1.6
  };

  /* ============================================================== ENGINES */

  /*
   * A nacelle is lathed from one profile: in at the throat, round the lip,
   * aft along a banded cowling, and in over the rear face. `a` is metres aft
   * of the lip. The nozzle bell and the intake are lathed the same way in the
   * dark, burnt plate.
   */
  const COWL = [
    [1.02, 0.55], [1.05, 0.2], [1.12, 0.04], [1.24, 0.0], [1.34, 0.05], [1.40, 0.2],
    [1.40, 0.95], [1.47, 1.0], [1.47, 1.35], [1.40, 1.4],
    [1.40, 2.75], [1.46, 2.8], [1.46, 3.05], [1.40, 3.1],
    [1.40, 4.4], [1.47, 4.45], [1.47, 4.8], [1.40, 4.85],
    [1.40, 5.5], [1.30, 5.95], [1.12, 6.35], [0.96, 6.45], [0.86, 6.4]
  ];
  const BELL = [
    [0.80, 6.2], [0.84, 6.6], [0.93, 7.3], [1.04, 8.05], [1.08, NAC.len - 0.02],
    [1.01, NAC.len], [0.95, 8.2], [0.78, 7.3], [0.6, 6.7], [0.42, 6.5]
  ];
  const INTAKE = [[1.0, 0.95], [1.02, 0.5]];
  const HUB = [[0.001, 0.42], [0.3, 0.72], [0.34, 0.95]];
  const SEG = 32;
  const lathe = (profile, cx, cy, { cylUV = 0 } = {}) => {
    const g = new THREE.LatheGeometry(profile.map(([r, a]) => new THREE.Vector2(r, a)), SEG, Math.PI, Math.PI * 2);
    if (cylUV) {
      // UVs in metres: u along the axis, v round the circumference, so rust
      // streaks run down the sides of the cowling the way the rain ran.
      const uv = g.attributes.uv, n = profile.length;
      for (let i = 0; i <= SEG; i++) {
        for (let j = 0; j < n; j++) {
          uv.setXY(i * n + j, profile[j][1] / cylUV, (i / SEG) * Math.PI * 2 * NAC.r / cylUV);
        }
      }
    }
    g.rotateX(-Math.PI / 2);
    g.translate(cx, cy, NAC.front);
    return g;
  };
  for (const s of [-1, 1]) {
    const cx = s * NAC.x;
    for (const cy of NAC.ys) {
      add(lathe(COWL, cx, cy, { cylUV: engineMat.userData.tile }), engineMat, { keepUV: true });
      add(lathe(BELL, cx, cy), darkMat);
      add(lathe(INTAKE, cx, cy), darkMat);
      add(lathe(HUB, cx, cy), darkMat);
      const fan = add(new THREE.CircleGeometry(1.01, SEG), darkMat, { cast: false });
      fan.position.set(cx, cy, NAC.front - 0.95);
      // Stator vanes across the throat.
      for (let k = 0; k < 3; k++) box(darkMat, 0.05, 2.0, 0.07, cx, cy, NAC.front - 0.8, 0, 0, k * Math.PI / 3);
      const glow = add(new THREE.CircleGeometry(0.44, 20), nozzleGlowMat, { cast: false });
      glow.position.set(cx, cy, NAC.front - 6.52);
      glow.rotation.y = Math.PI;
      // Actuators round the nozzle's neck.
      for (let k = 0; k < 4; k++) {
        const ang = Math.PI / 4 + k * Math.PI / 2;
        const ux = Math.cos(ang), uy = Math.sin(ang);
        cylBetween(steelMat, V3(cx + ux * 1.12, cy + uy * 1.12, NAC.front - 5.9), V3(cx + ux * 0.98, cy + uy * 0.98, NAC.front - 7.2), 0.05, 6);
      }
      // An access plate on the outboard side of the cowling.
      box(engineMat, 0.2, 1.1, 2.8, cx + s * (NAC.r - 0.02), cy, NAC.front - 2.1 - (cy > 1 ? 0.3 : 1.6));
    }
    // The saddle between the two nacelles and the hull.
    box(hullMat, 1.6, 0.5, 5.4, s * (OUT_X + 0.8), (NAC.ys[0] + NAC.ys[1]) / 2, NAC.front - 3.0);
    box(darkMat, 0.3, 4.6, 3.4, s * (OUT_X + 0.05), 1.85, NAC.front - 2.2);
  }

  /* ---- bake ---- */
  for (const [mat, tris] of T) add(triGeo(tris), mat);
  projectUVs(shell);
  mergeStatic(shell);

  /* ============================================================ LEGS, STAIR */

  /*
   * The legs and the stair are rebuilt for the ground under them each time
   * the ship sets down, merged into one mesh per material. They are left
   * out of the bake.
   */
  const rig = new THREE.Group();
  rig.name = 'avalon-rig';
  rig.userData.noMerge = true;
  group.add(rig);
  const rigDark = new THREE.Mesh(new THREE.BufferGeometry(), darkMat);
  const rigSteel = new THREE.Mesh(new THREE.BufferGeometry(), steelMat);
  for (const m of [rigDark, rigSteel]) { m.castShadow = true; m.receiveShadow = true; rig.add(m); }

  const nacBottom = NAC.ys[0] - NAC.r;
  const LEGS = [
    { z: 9.4, hipX: 1.8, footX: 3.3 },
    { z: 1.0, hipX: 4.2, footX: 6.5 },
    { z: -13.2, hipX: 6.45, footX: 7.5, hipY: nacBottom + 0.12 }
  ];

  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _one = new THREE.Vector3(1, 1, 1);
  const place = (geo, pos, rot) => geo.applyMatrix4(_m4.compose(pos, rot ? _q.setFromEuler(_e.set(...rot)) : _q.identity(), _one));
  const gBox = (w, h, d, pos, rot) => place(new THREE.BoxGeometry(w, h, d), pos, rot);
  const gCyl = (a, b, r, seg = 10, r2 = r) => {
    const d = b.clone().sub(a);
    const g = new THREE.CylinderGeometry(r2, r, d.length(), seg);
    return g.applyMatrix4(_m4.compose(a.clone().addScaledVector(d, 0.5), _q.setFromUnitVectors(up, d.normalize()), _one));
  };
  /** A square beam from a to b: `w` held horizontal, `d` in the vertical plane. */
  const gBeam = (a, b, w, d) => {
    const len = a.distanceTo(b);
    const y = b.clone().sub(a).normalize();
    let x = new THREE.Vector3(0, 1, 0).cross(y);
    if (x.lengthSq() < 1e-6) x.set(1, 0, 0);
    x.normalize();
    const z = new THREE.Vector3().crossVectors(x, y).normalize();
    _q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    return new THREE.BoxGeometry(w, len, d).applyMatrix4(_m4.compose(a.clone().add(b).multiplyScalar(0.5), _q, _one));
  };

  function buildLeg(parts, L, sx, groundAt) {
    const hipY = L.hipY ?? bottomAt(L.hipX, L.z);
    const hip = V3(sx * L.hipX, hipY, L.z);
    const g = groundAt(sx * L.footX, L.z);
    const ankle = V3(sx * L.footX, g + 0.36, L.z);
    const knee = V3(sx * (L.footX + 0.22), Math.max(hipY - 0.5, ankle.y + 0.6), L.z);
    const mid = knee.clone().lerp(ankle, 0.52);
    const D = parts.dark, S = parts.steel;
    D.push(gBox(0.55, 0.34, 0.8, V3(hip.x, hipY - 0.08, L.z)));
    D.push(gBeam(hip, knee, 0.32, 0.3));
    D.push(gCyl(V3(knee.x, knee.y, L.z - 0.3), V3(knee.x, knee.y, L.z + 0.3), 0.2, 10));
    D.push(gCyl(knee, mid, 0.17, 10));
    D.push(gCyl(mid.clone().addScaledVector(up, 0.02), mid.clone().addScaledVector(up, -0.06), 0.2, 10));
    S.push(gCyl(mid, ankle, 0.1, 10));
    D.push(gBox(0.34, 0.3, 0.42, ankle));
    // The skid: a plate, a rib, and toe plates turned up at both ends.
    D.push(gBox(0.8, 0.1, 1.9, V3(ankle.x, g + 0.05, L.z)));
    D.push(gBox(0.12, 0.22, 1.5, V3(ankle.x, g + 0.2, L.z)));
    D.push(gBox(0.8, 0.08, 0.5, V3(ankle.x, g + 0.18, L.z + 1.13), [-0.6, 0, 0]));
    D.push(gBox(0.8, 0.08, 0.5, V3(ankle.x, g + 0.18, L.z - 1.13), [0.6, 0, 0]));
    for (const dz of [-0.62, 0.62]) D.push(gCyl(ankle, V3(ankle.x, g + 0.12, L.z + dz), 0.045, 6));
    // The ram: from the hull outboard of the hip to the lower strut.
    const ax = L.hipX + 0.9;
    const aY = L.hipY !== undefined ? L.hipY + 0.05 : bottomAt(ax, L.z) + 0.02;
    const A = V3(sx * ax, aY, L.z + 0.34);
    const B = knee.clone().lerp(ankle, 0.35).add(V3(0, 0, 0.34));
    const Mr = A.clone().lerp(B, 0.55);
    D.push(gBox(0.3, 0.2, 0.3, V3(A.x, A.y - 0.05, A.z)));
    D.push(gCyl(A, Mr, 0.12, 10));
    S.push(gCyl(Mr, B, 0.055, 8));
  }

  function buildStair(parts, groundAt) {
    const D = parts.dark, S = parts.steel;
    const top = V3(HATCH_SILL.x + 0.02, HATCH_SILL.y, HATCH_SILL.z);
    const footX = HATCH_SILL.x + RAMP_RUN;
    const footY = groundAt(footX, HATCH_SILL.z) + 0.03;
    const foot = V3(footX, footY, HATCH_SILL.z);
    const drop = Math.max(0.3, top.y - footY);
    const hw = RAMP_W / 2;
    // Stringers.
    for (const s of [-1, 1]) {
      const dz = s * (hw - 0.05);
      D.push(gBeam(V3(top.x, top.y - 0.12, top.z + dz), V3(foot.x, foot.y + 0.02, foot.z + dz), 0.06, 0.28));
    }
    // Grated treads: three slats a step.
    const n = Math.max(4, Math.round(drop / 0.24));
    const run = RAMP_RUN / n;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.6) / n;
      const x = top.x + (foot.x - top.x) * t, y = top.y + (foot.y - top.y) * t + 0.04;
      for (let k = 0; k < 3; k++) {
        D.push(gBox(run * 0.24, 0.035, RAMP_W - 0.14, V3(x - run * 0.3 + k * run * 0.3, y, top.z)));
      }
    }
    D.push(gBox(0.6, 0.06, RAMP_W, V3(foot.x + 0.1, footY + 0.03, foot.z)));
    // Handrails: posts at the head, the middle and the foot, a top rail and a knee rail.
    const posts = [0.05, 0.5, 0.95];
    for (const s of [-1, 1]) {
      const dz = s * (hw - 0.02);
      const base = posts.map(t => V3(top.x + (foot.x - top.x) * t, top.y + (foot.y - top.y) * t, top.z + dz));
      for (const b of base) S.push(gCyl(b, b.clone().add(V3(0, 1.0, 0)), 0.026, 6));
      for (const hgt of [1.0, 0.52]) {
        S.push(gCyl(base[0].clone().add(V3(0, hgt, 0)), base[2].clone().add(V3(0, hgt, 0)), 0.024, 6));
      }
    }
  }

  function setRig(mesh, geos) {
    const flat = geos.map(g => {
      const f = g.index ? g.toNonIndexed() : g;
      if (f !== g) g.dispose();
      for (const k of Object.keys(f.attributes)) if (!['position', 'normal', 'uv'].includes(k)) f.deleteAttribute(k);
      return f;
    });
    const merged = BufferGeometryUtils.mergeGeometries(flat, false);
    for (const g of flat) g.dispose();
    if (!merged) return;
    if (mesh.material.userData.tile) boxUV(merged, new THREE.Matrix4(), mesh.material.userData.tile);
    merged.setAttribute('uv1', merged.attributes.uv);
    mesh.geometry.dispose();
    mesh.geometry = merged;
  }

  /**
   * Reach the legs and the stair down to the ground. `groundAt(x, z)` is the
   * ground height in ship-local metres (negative: below the deck).
   */
  function fitToGround(groundAt) {
    const parts = { dark: [], steel: [] };
    for (const L of LEGS) for (const sx of [-1, 1]) buildLeg(parts, L, sx, groundAt);
    buildStair(parts, groundAt);
    setRig(rigDark, parts.dark);
    setRig(rigSteel, parts.steel);
  }
  // Stand it on level ground until it is told otherwise.
  fitToGround(() => -DECK_CLEARANCE);

  return { group, fitToGround, hatchLamp };
}

/* ---------------------------------------------------------------- placement */

const _up = new THREE.Vector3(0, 1, 0);

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
