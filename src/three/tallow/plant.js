/**
 * plant.js — the refinery on the flat: evaporators, fractionating columns, the
 * pipe racks, the feed conveyor, the mast and the scatter round them.
 *
 * Every builder takes `ctx` ({ M, own, t4 }): M holds the world's shared
 * weathered metals (drum, plate, pipe, dark, bulk), `own` registers a
 * geometry/material/texture for disposal, and `t4` is the fidelity tier. Each
 * returns a Group in its own local frame, origin on the ground at its centre;
 * `tallow.js` places it, bakes it with `mergeStatic` and names it.
 *
 * THESE ARE BUILT THE WAY THE REAL THING IS BUILT, OUT OF THE PARTS IT IS
 * BUILT FROM. A vessel is a concrete plinth, a skirt with a door in it and a
 * ring of anchor chairs, a shell rolled in courses and welded round, a dished
 * head, and then everything that was ever bolted to it: nozzles with flanges
 * and a valve on each, a gauge on a siphon, a caged ladder with a rest
 * landing, a platform on knee brackets, cladding over insulation. A rack is
 * H-section portals with knee braces and base plates, pipe on shoes, a cable
 * tray and a walkway. None of it is a primitive standing in for a shape — a
 * cylinder is a cylinder only where the thing IS a cylinder. `mergeStatic`
 * turns a thousand parts into a handful of draw calls, so small parts are free
 * and are spent without apology: the eye reads scale from bolts and rungs.
 *
 * Then forty years: cladding sheets gone and the wool showing, one hanging by
 * its top edge; a grating panel missing out of a walkway; a conveyor belt torn
 * and hanging through its own frame; blind flanges where lines were cut.
 *
 * TEXTURES ARE LAID IN METRES. A primitive's own UVs stretch one tile over
 * whatever size it is, so a bolt and a 26 m beam would carry the same number of
 * rivets. `Rig.finish` re-maps every part — cylinders round their own
 * circumference, everything else by projection in the prop's frame — so a
 * plate is the same size on everything it is painted on.
 *
 * The collision footprint of each asset is declared in `tallow.json` (radius),
 * and for elevated structures by `SUPPORT_POINTS` below, which `tallow.js`
 * reads — they must stay in step with where the builders put piers and legs.
 * Everything stays inside its footprint in plan; the tower's guy anchors are
 * the one deliberate exception, and are placed as they always were.
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  weldBead, cableRun, placard, hazardStripe, dialGauge,
  platedMetal, buildMaterial, texSize, heightField, readHeight, writeField,
  heightToAO, fbm, worley, canvas2d
} from '../materials/pbr-kit.js';

/** Sodium filament, from inside a thing. */
const SODIUM = 0xd99423;
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const XAXIS = new THREE.Vector3(1, 0, 0);
const ZAXIS = new THREE.Vector3(0, 0, 1);

/**
 * THE FEET OF THE ELEVATED STRUCTURES, in each builder's own frame [x, z].
 * A pipe rack and a conveyor are twenty-odd metres long and carried in the air;
 * what is in the player's way is their legs, so those are what `tallow.js`
 * collides (each a disc of `radius`). Keep this in step with where the
 * builders below actually stand their piers.
 *
 *   pipe-bridge: four portal frames eight metres apart, columns at x ±1.5, and
 *                the access ladder up the outboard face of the last column.
 *   conveyor:    three bents at 0.12, 0.5 and 0.88 of its 22 m, legs at ±0.7,
 *                and the tail stand the loading end sits on.
 */
export const SUPPORT_POINTS = {
  'pipe-bridge': {
    radius: 0.55,
    points: [
      [-1.5, -12], [1.5, -12], [-1.5, -4], [1.5, -4],
      [-1.5, 4], [1.5, 4], [-1.5, 12], [1.5, 12], [2.35, 12]
    ]
  },
  'conveyor': {
    radius: 0.55,
    points: [
      [-0.7, -8.36], [0.7, -8.36], [-0.7, 0], [0.7, 0], [-0.7, 8.36], [0.7, 8.36],
      [-0.6, -10.35], [0.6, -10.35]
    ]
  }
};

/* Deterministic layout noise. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ==========================================================================
   SMALL GEOMETRY
   ========================================================================== */

const vec = p => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]));

/** A point on a circle, wound the way CylinderGeometry winds: angle 0 is +z, and it increases toward +x. */
const polar = (r, a, y = 0) => new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);

const _bx = new THREE.Vector3();
const _by = new THREE.Vector3();
const _bz = new THREE.Vector3();
const _bm = new THREE.Matrix4();

/**
 * Stand a part built along +y between two points. `hint` says where the
 * part's own +x should face (projected square to its length) — which way a
 * beam's web stands or a flat bar's broad face looks — so a member has a roll
 * that means something rather than whatever a quaternion happened to give.
 */
function orient(obj, a, b, hint = UP, stretch = true) {
  _by.subVectors(b, a);
  const L = _by.length();
  _by.divideScalar(L || 1);
  _bx.copy(hint).addScaledVector(_by, -hint.dot(_by));
  if (_bx.lengthSq() < 1e-6) {
    _bx.copy(Math.abs(_by.x) < 0.9 ? XAXIS : ZAXIS).addScaledVector(_by, -(Math.abs(_by.x) < 0.9 ? _by.x : _by.z));
  }
  _bx.normalize();
  _bz.crossVectors(_bx, _by);
  _bm.makeBasis(_bx, _by, _bz);
  obj.quaternion.setFromRotationMatrix(_bm);
  if (stretch) {
    obj.position.addVectors(a, b).multiplyScalar(0.5);
    obj.scale.set(1, L, 1);
  } else {
    obj.position.copy(a);
  }
  return L;
}

function mergeParts(parts) {
  const flat = parts.some(p => p.index) && parts.some(p => !p.index)
    ? parts.map(p => (p.index ? p.toNonIndexed() : p))
    : parts;
  const g = BufferGeometryUtils.mergeGeometries(flat, false);
  for (const p of parts) p.dispose();
  for (const p of flat) p.dispose();
  return g;
}

/** A rolled H-section one metre long on +y: depth along x, flanges across z. */
function ibeamGeo(h, b) {
  const tf = Math.max(0.012, h * 0.075);
  const tw = Math.max(0.008, h * 0.045);
  return mergeParts([
    new THREE.BoxGeometry(h - tf * 2, 1, tw),
    new THREE.BoxGeometry(tf, 1, b).translate(h / 2 - tf / 2, 0, 0),
    new THREE.BoxGeometry(tf, 1, b).translate(-h / 2 + tf / 2, 0, 0)
  ]);
}

/** An equal angle one metre long on +y, heel on the line, legs along +x and +z. */
function angleGeo(leg, t) {
  return mergeParts([
    new THREE.BoxGeometry(leg, 1, t).translate(leg / 2 - t / 2, 0, 0),
    new THREE.BoxGeometry(t, 1, leg).translate(0, 0, leg / 2 - t / 2)
  ]);
}

/** A channel one metre long on +y: web across x, flanges toward +z. */
function channelGeo(h, b, t) {
  return mergeParts([
    new THREE.BoxGeometry(h, 1, t).translate(0, 0, t / 2),
    new THREE.BoxGeometry(t, 1, b).translate(h / 2 - t / 2, 0, b / 2),
    new THREE.BoxGeometry(t, 1, b).translate(-h / 2 + t / 2, 0, b / 2)
  ]);
}

/**
 * A bolt circle: studs through a flange pair with a hex nut on each end,
 * baked into one geometry about +y. The studs are what make a flange a joint.
 */
function boltCircleGeo(rb, n, rs, len) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = (i + 0.5) / n * TAU;
    const x = Math.sin(a) * rb, z = Math.cos(a) * rb;
    // The stud's ends are inside its nuts, so it carries no caps.
    parts.push(new THREE.CylinderGeometry(rs, rs, len, 4, 1, true).translate(x, 0, z));
    for (const e of [-1, 1]) {
      parts.push(new THREE.CylinderGeometry(rs * 1.9, rs * 1.9, rs * 1.6, 6).translate(x, e * (len / 2 - rs * 0.8), z));
    }
  }
  return mergeParts(parts);
}

/** The same surface seen from the other side: winding reversed, normals negated. */
function flipped(geo) {
  const g = geo.clone();
  if (g.index) {
    const ix = g.index;
    for (let i = 0; i < ix.count; i += 3) {
      const b = ix.getX(i + 1);
      ix.setX(i + 1, ix.getX(i + 2));
      ix.setX(i + 2, b);
    }
  }
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  return g;
}

/**
 * Sweep a circle along a polyline whose corners are filleted to `bend`.
 *
 * `pipeRun`'s Catmull-Rom rounds a right angle into a lazy S and cannot hold a
 * straight between two elbows; real pipe is straight, then a bend of a fixed
 * radius, then straight. Frames are carried by parallel transport so the
 * section never twists round a corner.
 */
function sweepGeometry(points, r, { radial = 10, bend = r * 2.5 } = {}) {
  const P = points.map(vec);
  const path = [P[0]];
  for (let i = 1; i < P.length - 1; i++) {
    // A path that is already a fine polyline (a hoop, a cable) needs no fillets.
    if (bend <= 0) { path.push(P[i]); continue; }
    const a = P[i - 1], p = P[i], c = P[i + 1];
    const d1 = p.clone().sub(a); const l1 = d1.length(); d1.divideScalar(l1);
    const d2 = c.clone().sub(p); const l2 = d2.length(); d2.divideScalar(l2);
    const turn = Math.acos(THREE.MathUtils.clamp(d1.dot(d2), -1, 1));
    if (turn < 1e-3) { path.push(p); continue; }
    const e = Math.min(bend * Math.tan(turn / 2), l1 * 0.49, l2 * 0.49);
    const A = p.clone().addScaledVector(d1, -e);
    const B = p.clone().addScaledVector(d2, e);
    const n = Math.max(3, Math.ceil(turn / 0.2));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      path.push(new THREE.Vector3()
        .addScaledVector(A, (1 - t) * (1 - t))
        .addScaledVector(p, 2 * (1 - t) * t)
        .addScaledVector(B, t * t));
    }
  }
  path.push(P[P.length - 1]);
  const pts = path.filter((q, i) => i === 0 || q.distanceToSquared(path[i - 1]) > 1e-8);

  const N = pts.length;
  const tan = pts.map((q, i) => {
    const t = new THREE.Vector3();
    if (i > 0) t.add(q.clone().sub(pts[i - 1]).normalize());
    if (i < N - 1) t.add(pts[i + 1].clone().sub(q).normalize());
    return t.normalize();
  });
  const pick = Math.abs(tan[0].y) < 0.9 ? UP : XAXIS;
  const normal = new THREE.Vector3().crossVectors(tan[0], pick).normalize();
  const q = new THREE.Quaternion();
  const pos = [], nor = [], uv = [], idx = [];
  let along = 0;
  const bin = new THREE.Vector3(), dir = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    if (i > 0) {
      along += pts[i].distanceTo(pts[i - 1]);
      q.setFromUnitVectors(tan[i - 1], tan[i]);
      normal.applyQuaternion(q).normalize();
    }
    bin.crossVectors(tan[i], normal);
    for (let j = 0; j <= radial; j++) {
      const ang = (j / radial) * TAU;
      dir.copy(normal).multiplyScalar(Math.cos(ang)).addScaledVector(bin, Math.sin(ang));
      pos.push(pts[i].x + dir.x * r, pts[i].y + dir.y * r, pts[i].z + dir.z * r);
      nor.push(dir.x, dir.y, dir.z);
      uv.push(along, j / radial);
    }
  }
  for (let k = 0; k < uv.length; k += 2) uv[k] /= Math.max(along, 1e-6);
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.userData.length = along;
  g.userData.ends = [pts[0], tan[0], pts[N - 1], tan[N - 1]];
  return g;
}

/**
 * A flat ribbon along a path — a belt, a strip of torn tape. `widths` and
 * `twists` are per point; the ribbon lies across `side` at each point.
 */
function ribbonGeometry(points, side, widths, twists = null) {
  const P = points.map(vec);
  const pos = [], uv = [], idx = [];
  let along = 0;
  const s = new THREE.Vector3();
  for (let i = 0; i < P.length; i++) {
    if (i > 0) along += P[i].distanceTo(P[i - 1]);
    const t = (i < P.length - 1 ? P[i + 1].clone().sub(P[i]) : P[i].clone().sub(P[i - 1])).normalize();
    s.copy(side).addScaledVector(t, -side.dot(t)).normalize();
    if (twists) s.applyAxisAngle(t, twists[i]);
    const w = widths[i] / 2;
    pos.push(P[i].x - s.x * w, P[i].y - s.y * w, P[i].z - s.z * w);
    pos.push(P[i].x + s.x * w, P[i].y + s.y * w, P[i].z + s.z * w);
    uv.push(0, along, 1, along);
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * A grating deck or ring landing: an annular sector extruded upward from y 0
 * to `th`. Angles are in the `polar` sense so a platform and the shell it
 * wraps agree on where it is.
 */
function sectorSlab(r0, r1, a0, a1, th) {
  const n = Math.max(3, Math.ceil(Math.abs(a1 - a0) / 0.09));
  const shape = new THREE.Shape();
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    const x = Math.sin(a) * r1, y = -Math.cos(a) * r1;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  for (let i = n; i >= 0; i--) {
    const a = a0 + (a1 - a0) * i / n;
    shape.lineTo(Math.sin(a) * r0, -Math.cos(a) * r0);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  return g;
}

/** A 2:1 ellipsoidal head, dished DOWN from its rim at y 0 — the bottom of a vessel. */
function ellipsoidalBottom(R, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI / 2;
    pts.push(new THREE.Vector2(Math.max(1e-4, R * Math.sin(t)), -R / 2 * Math.cos(t)));
  }
  return pts;
}

/**
 * A torispherical ("flanged and dished") head in section, rim at y 0 rising to
 * the crown: a knuckle of radius `k` turning the shell in, then a spherical
 * crown of radius `L`. This is the shape every pressure vessel in the world
 * actually wears, and it is not a hemisphere.
 */
function torispherical(R, { L = 2 * R, k = 0.2 * R } = {}) {
  const yc = -Math.sqrt((L - k) ** 2 - (R - k) ** 2);
  const beta = Math.asin((R - k) / (L - k));
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const t = (i / 6) * (Math.PI / 2 - beta);
    pts.push(new THREE.Vector2(R - k + k * Math.cos(t), k * Math.sin(t)));
  }
  for (let i = 1; i <= 10; i++) {
    const u = beta * (1 - i / 10);
    pts.push(new THREE.Vector2(Math.max(1e-4, L * Math.sin(u)), yc + L * Math.cos(u)));
  }
  const heightAt = x => (x <= L * Math.sin(beta)
    ? yc + Math.sqrt(L * L - x * x)
    : Math.sqrt(Math.max(0, k * k - (x - (R - k)) ** 2)));
  return { pts, heightAt, top: yc + L };
}

/* ==========================================================================
   SURFACES THE WORLD DOES NOT ALREADY HAVE
   ========================================================================== */

function hexRgb(hex) { return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255]; }

/**
 * Open bar grating: bearing bars on a 30 mm pitch, cross rods every 100, and a
 * void under all of it. Drawn, not cut — alpha-tested grating shimmers into
 * nothing at distance and throws no honest shadow — so the gaps are near-black
 * with the occlusion of a deep slot, which from standing height is what open
 * grating looks like.
 */
function barGrating(seed = 17) {
  const S = texSize(256);
  const height = heightField(S, (u, v) => {
    const bu = (u * 32) % 1;
    const cv = (v * 10) % 1;
    let h = 0.06;
    if (Math.abs(bu - 0.5) > 0.38) h = 0.9;
    if (Math.abs(cv - 0.5) > 0.44) h = Math.max(h, 0.8);
    return h + (fbm(u * 16, v * 16, { octaves: 3, period: 16, seed }) - 0.5) * 0.08;
  });
  const hf = readHeight(height);
  const alb = canvas2d(S, S);
  const c2 = alb.getContext('2d');
  const img = c2.createImageData(S, S);
  const rough = new Float32Array(S * S);
  const metal = new Float32Array(S * S);
  const bar = hexRgb(0x8a8272), rust = hexRgb(0x7a4a2a);
  for (let i = 0; i < S * S; i++) {
    const u = (i % S) / S, v = ((i / S) | 0) / S;
    const h = hf.data[i];
    const solid = h > 0.5 ? 1 : 0;
    const grime = fbm(u * 6, v * 6, { octaves: 4, period: 6, seed: seed + 7 });
    const rusty = Math.max(0, grime - 0.55) * 2.2;
    const k = solid ? 0.8 + h * 0.25 : 0.12;
    for (let c = 0; c < 3; c++) {
      img.data[i * 4 + c] = Math.min(255, (bar[c] * (1 - rusty) + rust[c] * rusty) * k);
    }
    img.data[i * 4 + 3] = 255;
    rough[i] = solid ? 0.62 + rusty * 0.3 : 1;
    metal[i] = solid ? 0.55 - rusty * 0.4 : 0;
  }
  c2.putImageData(img, 0, 0);
  return {
    albedo: alb, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    metalness: writeField({ data: metal, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 6), strength: 1.4 }),
    normalStrength: 2.2
  };
}

/**
 * Cast concrete: aggregate mottle, bug holes where air was trapped against the
 * form, and the tie holes and board seams of the shuttering it was poured in.
 */
function castConcrete(seed = 29) {
  const S = texSize(256);
  const height = heightField(S, (u, v) => {
    let h = 0.55 + (fbm(u * 8, v * 8, { octaves: 5, period: 8, seed }) - 0.5) * 0.22;
    const w = worley(u * 22, v * 22, 22, seed + 3);
    if (w.f1 < 0.12) h -= (0.12 - w.f1) * 3.2;
    const seam = Math.abs(((v * 3) % 1) - 0.5);
    if (seam > 0.492) h -= 0.12;
    const tu = (u * 2) % 1 - 0.5, tv = (v * 3) % 1 - 0.25;
    if (tu * tu + tv * tv < 0.0006) h -= 0.3;
    return h;
  });
  const hf = readHeight(height);
  const alb = canvas2d(S, S);
  const c2 = alb.getContext('2d');
  const img = c2.createImageData(S, S);
  const base = hexRgb(0x8f887b);
  const rough = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const u = (i % S) / S, v = ((i / S) | 0) / S;
    const h = hf.data[i];
    const mott = fbm(u * 3, v * 3, { octaves: 4, period: 3, seed: seed + 11 });
    const stain = Math.max(0, fbm(u * 2, v * 5, { octaves: 3, period: 2, seed: seed + 5 }) - 0.55) * 1.4;
    const k = (0.82 + mott * 0.3) * (0.55 + Math.min(1, h * 1.2) * 0.45) * (1 - stain * 0.35);
    for (let c = 0; c < 3; c++) img.data[i * 4 + c] = Math.min(255, base[c] * k);
    img.data[i * 4 + 3] = 255;
    rough[i] = 0.9 + (1 - h) * 0.1;
  }
  c2.putImageData(img, 0, 0);
  return {
    albedo: alb, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 6), strength: 1.1 }),
    normalStrength: 1.8
  };
}

/* ==========================================================================
   THE KIT — built once per world, shared by every prop in it
   ========================================================================== */

const KITS = new WeakMap();

function kitFor(ctx) {
  const key = ctx.M.drum;
  let kit = KITS.get(key);
  if (kit) return kit;
  const { M, own } = ctx;
  const dress = (mat, ns = 1.2) => {
    mat.normalScale.set(ns, ns);
    mat.aoMapIntensity = 0.85;
    own(mat, ...(mat.userData.surfaceMaps || []));
    return mat;
  };
  const plain = o => own(new THREE.MeshStandardMaterial(o));
  const K = {
    // Aluminium jacketing over lagging: paler than any painted steel, lapped
    // and screwed, and it goes chalky rather than rusting.
    clad: dress(buildMaterial(platedMetal({
      paint: '#a39c8c', metal: '#8f8a80', rust: '#735a41',
      panels: 2, seed: 83, weather: 0.66, grain: 1.6, size: texSize(256)
    }), { roughness: 1.0 })),
    // Safety paint on ladders and handrails, sun-bleached down to ochre. The
    // one colour that says "people climbed this", held well short of a signal.
    rail: dress(buildMaterial(platedMetal({
      paint: '#7d6a45', metal: '#5f584d', rust: '#7a4526',
      panels: 1, rivets: false, seed: 101, weather: 0.9, size: texSize(128)
    }), { roughness: 1.0 }), 1.0),
    grate: dress(buildMaterial(barGrating(), { roughness: 1.0 }), 1.5),
    concrete: dress(buildMaterial(castConcrete(), { roughness: 1.0, metalness: 0.0 }), 1.1),
    wool: plain({ color: 0x9b917a, roughness: 1, metalness: 0 }),
    rubber: plain({ color: 0x2a2622, roughness: 0.93, metalness: 0, side: THREE.DoubleSide }),
    wire: plain({ color: 0x3f3a33, roughness: 0.6, metalness: 0.75 }),
    face: plain({ color: 0xb7af9b, roughness: 0.6, metalness: 0 }),
    flag: plain({ color: 0x96582a, roughness: 1, metalness: 0, side: THREE.DoubleSide }),
    // The inside of a thing: a cut pipe bore, a vent mouth, a skirt's dark.
    hole: plain({ color: 0x14120f, roughness: 1, metalness: 0 })
  };
  // Metres per texture tile, before the material's own repeat.
  const tile = new Map([
    [M.drum, 2.4], [M.plate, 2.0], [M.dark, 2.0], [M.pipe, 3.0],
    [K.clad, 2.0], [K.rail, 1.6], [K.grate, 1.0], [K.concrete, 2.2]
  ]);
  if (M.bulk) tile.set(M.bulk, 2.4);
  kit = { K, tile, geos: new Map(), counts: new Map() };
  KITS.set(key, kit);
  return kit;
}

/* ==========================================================================
   THE RIG — a prop under construction
   ========================================================================== */

class Rig {
  constructor(ctx, name, seed = 1) {
    this.ctx = ctx;
    this.own = ctx.own;
    this.t4 = ctx.t4;
    this.M = ctx.M;
    this.kit = kitFor(ctx);
    this.K = this.kit.K;
    // Two evaporators of the same size are still two evaporators: the build
    // order numbers each copy, and the number seeds what forty years did to it.
    const n = this.kit.counts.get(name) || 0;
    this.kit.counts.set(name, n + 1);
    this.index = n;
    this.rand = mulberry32((Math.imul(seed | 0, 2654435761) ^ (n * 0x9e3779b1) ^ 0x51f15e) >>> 0);
    this.g = new THREE.Group();
  }

  /** Geometry shared by every copy of a part in this world, built once and owned once. */
  geo(key, make) {
    let g = this.kit.geos.get(key);
    if (!g) { g = make(); this.own(g); this.kit.geos.set(key, g); }
    return g;
  }

  mesh(parent, geo, mat, p = null, r = null) {
    const m = new THREE.Mesh(geo, mat);
    if (p) m.position.copy(vec(p));
    if (r) m.rotation.set(r[0], r[1], r[2]);
    (parent || this.g).add(m);
    return m;
  }

  box(parent, w, h, d, mat, p, r) {
    return this.mesh(parent, this.geo(`box${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), mat, p, r);
  }

  cyl(parent, rt, rb, h, seg, mat, p, r, { open = false, t0 = 0, tl = TAU, inner = false } = {}) {
    const key = `cyl${rt}|${rb}|${h}|${seg}|${open}|${t0}|${tl}`;
    const geo = this.geo(key, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, t0, tl));
    const m = this.mesh(parent, geo, mat, p, r);
    m.userData.uvs = [Math.max(rt, rb) * tl, h];
    if (inner) {
      // A single sheet seen from inside — a skirt, a toe plate — needs its
      // other face, or you look straight through it from the wrong side.
      const back = this.mesh(parent, this.geo(`${key}|in`, () => flipped(geo)), mat, p, r);
      back.userData.uvs = m.userData.uvs;
    }
    return m;
  }

  /** A ring round +y at height `y`: a weld, a strap, a flashing. Segments follow the radius. */
  hoop(parent, R, y, tube, mat, seg = 64, radial = 4) {
    seg = Math.min(seg, Math.max(16, Math.round(R * 20)));
    return this.mesh(parent,
      this.geo(`hoop${R}|${tube}|${seg}|${radial}`, () => new THREE.TorusGeometry(R, tube, radial, seg)),
      mat, [0, y, 0], [Math.PI / 2, 0, 0]);
  }

  strut(parent, a, b, r, mat, seg = 6, hint = UP) {
    const m = new THREE.Mesh(this.geo(`strut${r}|${seg}`, () => new THREE.CylinderGeometry(r, r, 1, seg)), mat);
    const L = orient(m, vec(a), vec(b), hint);
    m.userData.uvs = [TAU * r, L];
    (parent || this.g).add(m);
    return m;
  }

  /** A rectangular member between two points: `w` across its +x (see `orient`), `d` across its +z. */
  bar(parent, a, b, w, d, mat, hint = UP) {
    const m = new THREE.Mesh(this.geo(`box${w}|1|${d}`, () => new THREE.BoxGeometry(w, 1, d)), mat);
    orient(m, vec(a), vec(b), hint);
    (parent || this.g).add(m);
    return m;
  }

  ibeam(parent, a, b, h, bw, mat, hint = UP) {
    const m = new THREE.Mesh(this.geo(`ib${h}|${bw}`, () => ibeamGeo(h, bw)), mat);
    orient(m, vec(a), vec(b), hint);
    (parent || this.g).add(m);
    return m;
  }

  angle(parent, a, b, leg, mat, hint = UP) {
    const m = new THREE.Mesh(this.geo(`ang${leg}`, () => angleGeo(leg, Math.max(0.006, leg * 0.1))), mat);
    orient(m, vec(a), vec(b), hint);
    (parent || this.g).add(m);
    return m;
  }

  channel(parent, a, b, h, bw, mat, hint = UP) {
    const m = new THREE.Mesh(this.geo(`ch${h}|${bw}`, () => channelGeo(h, bw, Math.max(0.006, h * 0.06))), mat);
    orient(m, vec(a), vec(b), hint);
    (parent || this.g).add(m);
    return m;
  }

  lathe(parent, pts, seg, mat, p, r = null, key = null) {
    const make = () => new THREE.LatheGeometry(pts, seg);
    const geo = key ? this.geo(key, make) : this.own(make());
    const m = this.mesh(parent, geo, mat, p, r);
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
    m.userData.uvs = [TAU * Math.max(...pts.map(q => q.x)), len];
    return m;
  }

  /** Pipe along a path, bends filleted. Returns the mesh; its ends are in `userData.ends`. */
  pipe(parent, points, r, mat, opts = {}) {
    const geo = this.own(sweepGeometry(points, r, opts));
    const m = this.mesh(parent, geo, mat);
    m.userData.uvs = [geo.userData.length, TAU * r];
    m.userData.ends = geo.userData.ends;
    return m;
  }

  /** A disc across the end of a bore, facing `normal` — so a pipe is not seen through. */
  plug(parent, at, normal, r, mat = this.K.hole) {
    const m = this.mesh(parent, this.geo(`disc${r}`, () => new THREE.CircleGeometry(r, 12)), mat);
    m.position.copy(vec(at));
    m.quaternion.setFromUnitVectors(ZAXIS, vec(normal).normalize());
    return m;
  }

  /** Adopt a pbr-kit greeble: parent it and own what it says it owns. */
  take(obj, parent = null) {
    obj.traverse(o => {
      if (o.userData.ownGeometry) this.own(o.userData.ownGeometry);
      if (o.userData.ownMaterial) this.own(o.userData.ownMaterial);
      if (o.userData.ownTexture) this.own(o.userData.ownTexture);
    });
    (parent || this.g).add(obj);
    return obj;
  }

  /** A frame at `pos` whose +y runs along `dir` and whose +x leans toward `hint`. */
  frame(parent, pos, dir, hint = UP) {
    const f = new THREE.Group();
    orient(f, vec(pos), vec(pos).add(vec(dir).normalize()), hint, false);
    (parent || this.g).add(f);
    f.updateMatrixWorld(true);
    return f;
  }

  /** A frame on a circle: +z points out along the radius, +x runs with increasing angle. */
  site(parent, r, a, y = 0) {
    const f = new THREE.Group();
    f.position.copy(polar(r, a, y));
    f.rotation.y = a;
    (parent || this.g).add(f);
    f.updateMatrixWorld(true);
    return f;
  }

  /** A point in a sub-frame, expressed in the prop's own frame. */
  local(frame, p) {
    frame.updateMatrixWorld(true);
    this.g.updateMatrixWorld(true);
    return this.g.worldToLocal(frame.localToWorld(vec(p)));
  }

  decal(obj, parent, p, rotY = 0) {
    this.take(obj, parent);
    obj.position.copy(vec(p));
    obj.rotation.y = rotY;
    return obj;
  }

  /* ---- assemblies ---- */

  /**
   * A flange pair on the +y axis of `parent`, its joint face at `y`: the
   * nozzle's collar below, the mating collar (or a blind) above, studs and
   * nuts through both. Returns the y the next thing starts at.
   */
  flange(parent, r, y, { blind = false, mat = this.M.dark } = {}) {
    const rf = r * 1.6 + 0.03;
    const t = Math.max(0.022, r * 0.16);
    const n = r < 0.07 ? 4 : r < 0.18 ? 8 : r < 0.3 ? 12 : 16;
    this.cyl(parent, rf, rf, t, 20, mat, [0, y - t / 2, 0]);
    this.cyl(parent, rf, rf, t, 20, mat, [0, y + t / 2 + 0.003, 0]);
    const rb = (r + rf) / 2 + 0.005;
    const rs = Math.max(0.007, r * 0.07);
    this.mesh(parent, this.geo(`bolts${rb}|${n}|${rs}|${t}`, () => boltCircleGeo(rb, n, rs, t * 2 + rs * 5)), this.M.dark, [0, y, 0]);
    if (blind) {
      // A blind carries a lifting lug, because somebody had to swing it in.
      this.box(parent, 0.012, Math.max(0.04, r * 0.4), r * 0.6, mat, [0, y + t + Math.max(0.02, r * 0.2), 0]);
    }
    return y + t;
  }

  /**
   * A nozzle: reinforcing pad on the shell, neck, fillet weld, flange. In the
   * frame it returns, +y runs out along the nozzle and the joint face is at
   * `end`, so a valve or a pipe is simply added further up +y.
   */
  nozzle(parent, pos, dir, r, len, { hint = UP, blind = false, pad = true, mat = this.M.pipe } = {}) {
    const f = this.frame(parent, pos, dir, hint);
    if (pad) this.cyl(f, r * 1.9 + 0.02, r * 1.9 + 0.03, 0.02, 20, this.M.drum, [0, 0.005, 0]);
    this.cyl(f, r, r, len + 0.06, 14, mat, [0, (len - 0.06) / 2, 0]);
    this.hoop(f, r + 0.004, 0.03, 0.012, this.M.pipe, 20, 4);
    const end = this.flange(f, r, len, { blind });
    return { frame: f, end };
  }

  /**
   * A gate valve on the +y axis of `parent`, flowing +y from `y0`, bonnet and
   * handwheel out along +x. Returns the y it ends at.
   */
  valve(parent, r, y0, { wheel = true, stemOut = 0.3 } = {}) {
    const M = this.M;
    const L = Math.max(0.26, r * 3.0);
    const t = Math.max(0.022, r * 0.16);
    const rf = r * 1.6 + 0.03;
    for (const yy of [y0 + t / 2, y0 + L - t / 2]) this.cyl(parent, rf, rf, t, 18, M.dark, [0, yy, 0]);
    const rb = (r + rf) / 2 + 0.005;
    const n = r < 0.07 ? 4 : r < 0.18 ? 8 : 12;
    const rs = Math.max(0.007, r * 0.07);
    const bolts = this.geo(`vbolts${rb}|${n}|${rs}`, () => boltCircleGeo(rb, n, rs, t * 1.6));
    this.mesh(parent, bolts, M.dark, [0, y0 + t / 2, 0]);
    this.mesh(parent, bolts, M.dark, [0, y0 + L - t / 2, 0]);
    this.cyl(parent, r * 1.25, r * 1.25, L - t * 2, 16, M.dark, [0, y0 + L / 2, 0]);
    // The wedge chest, standing out of the body along +x.
    const xb = r * 1.7;
    this.cyl(parent, r * 1.05, r * 1.15, xb, 14, M.dark, [xb / 2, y0 + L / 2, 0], [0, 0, -Math.PI / 2]);
    this.cyl(parent, r * 1.25, r * 1.25, 0.03, 14, M.dark, [xb, y0 + L / 2, 0], [0, 0, -Math.PI / 2]);
    const xbon = r * 2.2 + 0.05;
    this.cyl(parent, r * 0.5, r * 0.75, xbon, 12, M.dark, [xb + xbon / 2, y0 + L / 2, 0], [0, 0, -Math.PI / 2]);
    const xTop = xb + xbon;
    if (!wheel) return y0 + L;
    // Yoke, stem and handwheel. The stem stands proud: the valve is open.
    for (const e of [-1, 1]) {
      this.bar(parent, [xTop, y0 + L / 2, e * r * 0.45], [xTop + 0.2, y0 + L / 2, e * r * 0.3], 0.01, 0.035, M.dark, ZAXIS);
    }
    this.strut(parent, [xTop, y0 + L / 2, 0], [xTop + 0.2 + stemOut, y0 + L / 2, 0], 0.012, M.pipe, 6);
    const rw = 0.1 + r * 1.1;
    const xw = xTop + 0.21;
    this.mesh(parent, this.geo(`wheel${rw}`, () => new THREE.TorusGeometry(rw, 0.014, 6, 24)), M.dark,
      [xw, y0 + L / 2, 0], [0, Math.PI / 2, 0]);
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * TAU + 0.3;
      this.strut(parent, [xw, y0 + L / 2, 0],
        [xw, y0 + L / 2 + Math.sin(a) * rw, Math.cos(a) * rw], 0.009, M.dark, 4);
    }
    this.cyl(parent, 0.03, 0.03, 0.05, 8, M.dark, [xw, y0 + L / 2, 0], [0, 0, -Math.PI / 2]);
    return y0 + L;
  }

  /** A pressure gauge on a siphon off a tapping, face looking out along `dir`. */
  gauge(parent, pos, dir, { r = 0.075 } = {}) {
    const f = this.frame(parent, pos, dir, UP);
    this.cyl(f, 0.02, 0.02, 0.2, 6, this.M.pipe, [0, 0.08, 0]);
    this.box(f, 0.055, 0.055, 0.075, this.M.dark, [0, 0.12, 0]);
    this.strut(f, [0, 0.17, 0], [0.18, 0.17, 0], 0.011, this.M.pipe, 5);
    const dial = this.take(dialGauge(r, this.K.face, this.M.dark), f);
    dial.position.set(0.18 + r, 0.17, 0);
    dial.rotation.set(-Math.PI / 2, 0, 0);
    return f;
  }

  /**
   * Handrail along a polyline [[x, z], ...] at deck height `y`: posts at even
   * spacing, top rail at 1.07, knee rail at 0.53 and a toe plate — the three
   * members every rail at height has, and the reason a platform reads as one.
   */
  rail(parent, pts, y, { closed = false, span = 1.6, h = 1.07, toe = true, mat = this.K.rail } = {}) {
    const P = pts.map(([x, z]) => new THREE.Vector3(x, y, z));
    if (closed) P.push(P[0].clone());
    const cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + P[i].distanceTo(P[i - 1]));
    const total = cum[cum.length - 1];
    const nPosts = Math.max(1, Math.ceil(total / span));
    const at = s => {
      let i = 1;
      while (i < cum.length - 1 && cum[i] < s) i++;
      const t = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
      return P[i - 1].clone().lerp(P[i], THREE.MathUtils.clamp(t, 0, 1));
    };
    for (let k = 0; k <= nPosts; k++) {
      if (closed && k === nPosts) break;
      const p = at(total * k / nPosts);
      this.strut(parent, p, p.clone().setY(y + h + 0.02), 0.024, mat, 6);
      this.box(parent, 0.08, 0.012, 0.08, mat, [p.x, y + 0.006, p.z]);
    }
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i];
      if (a.distanceTo(b) < 1e-3) continue;
      this.strut(parent, a.clone().setY(y + h), b.clone().setY(y + h), 0.022, mat, 6, UP);
      this.strut(parent, a.clone().setY(y + 0.53), b.clone().setY(y + 0.53), 0.018, mat, 5, UP);
      if (toe) this.bar(parent, a.clone().setY(y + 0.05), b.clone().setY(y + 0.05), 0.1, 0.008, mat, UP);
    }
  }

  /**
   * A fixed ladder with a safety cage, built with its base at `base`, facing
   * out along the angle `a` (the wall it is bolted to is behind it, −z).
   * Stiles run `ext` above the landing so there is something to hold while
   * stepping off; the cage starts above head height.
   */
  ladder(parent, { base, a, height, ext = 1.05, standoff = 0.2, cageFrom = 2.3, cage = true, mat = this.K.rail }) {
    const L = new THREE.Group();
    L.position.copy(vec(base));
    L.rotation.y = a;
    (parent || this.g).add(L);
    const top = height + ext;
    for (const x of [-0.23, 0.23]) {
      this.bar(L, [x, 0, 0], [x, top, 0], 0.014, 0.065, mat, XAXIS);
      this.box(L, 0.1, 0.012, 0.12, mat, [x, 0.006, -0.02]);
      for (let y = 1.2; y < height; y += 1.8) {
        this.bar(L, [x, y, 0], [x, y, -standoff], 0.06, 0.01, mat, UP);
        this.box(L, 0.1, 0.12, 0.012, mat, [x, y, -standoff]);
      }
    }
    for (let y = 0.3; y <= height + 0.01; y += 0.3) this.strut(L, [-0.23, y, 0], [0.23, y, 0], 0.013, mat, 6, UP);
    if (!cage || height < cageFrom + 0.5) return L;
    const hoopGeo = this.geo('ladderhoop', () => {
      const pts = [];
      for (let d = -50; d <= 230; d += 20) {
        const f = d * Math.PI / 180;
        pts.push([0.36 * Math.cos(f), 0, 0.33 + 0.36 * Math.sin(f)]);
      }
      return sweepGeometry(pts, 0.009, { radial: 3, bend: 0 });
    });
    for (let y = cageFrom; y <= top + 0.01; y += Math.min(0.75, (top - cageFrom) / Math.ceil((top - cageFrom) / 0.75))) {
      this.mesh(L, hoopGeo, mat, [0, y, 0]);
    }
    for (const d of [0, 45, 90, 135, 180]) {
      const f = d * Math.PI / 180;
      const x = 0.36 * Math.cos(f), z = 0.33 + 0.36 * Math.sin(f);
      this.bar(L, [x, cageFrom, z], [x, top, z], 0.04, 0.008, mat, new THREE.Vector3(-Math.sin(f), 0, Math.cos(f)));
    }
    return L;
  }

  /**
   * A grated landing round a shell: annular deck on knee brackets, a toe plate
   * and handrail on the outside edge, and a closing rail across whichever end
   * is not the ladder's side-step.
   */
  ringPlatform(parent, { R, y, a0, a1, width = 0.95, openStart = true, openEnd = false, shellR = null, brackets = true }) {
    const { M, K } = this;
    const r0 = R + 0.03, r1 = R + width;
    const th = 0.035;
    this.mesh(parent, this.own(sectorSlab(r0, r1, a0, a1, th)), K.grate, [0, y - th, 0]);
    // Edge channel under the deck and a toe plate standing proud of it.
    this.cyl(parent, r1, r1, 0.12, Math.max(8, Math.ceil((a1 - a0) / 0.08)), M.dark, [0, y - 0.07, 0], null,
      { open: true, t0: a0, tl: a1 - a0, inner: true });
    const ptsOut = [];
    const n = Math.max(3, Math.ceil((a1 - a0) * (r1) / 0.6));
    for (let i = 0; i <= n; i++) {
      const p = polar(r1 - 0.03, a0 + (a1 - a0) * i / n);
      ptsOut.push([p.x, p.z]);
    }
    const rail = ptsOut.slice();
    if (!openEnd) {
      const p = polar(r0 + 0.08, a1);
      rail.push([p.x, p.z]);
    }
    if (!openStart) {
      const p = polar(r0 + 0.08, a0);
      rail.unshift([p.x, p.z]);
    }
    this.rail(parent, rail, y, { toe: true });
    if (!brackets) return;
    const sr = shellR ?? R;
    const nb = Math.max(2, Math.ceil((a1 - a0) * R / 1.5));
    for (let i = 0; i <= nb; i++) {
      const a = a0 + 0.06 + (a1 - a0 - 0.12) * i / nb;
      const s = this.site(parent, 0, a, 0);
      this.angle(s, [0, y - th - 0.005, sr - 0.02], [0, y - th - 0.005, r1 - 0.04], 0.07, M.dark, UP);
      this.strut(s, [0, y - 0.85, sr], [0, y - 0.1, r1 - 0.12], 0.028, M.dark, 6);
      this.box(s, 0.16, 0.3, 0.02, M.dark, [0, y - 0.75, sr + 0.005]);
    }
  }

  /**
   * A cylindrical skirt with its access door: the arc of the skirt, the sill
   * and lintel pieces over the opening, a flat-bar frame round it, and the
   * inside faces so the dark within is a place and not a hole in the world.
   */
  skirt(parent, { R, y0, h, at, door = 0.9, doorH = 1.2, sill = 0.28, mat = this.M.drum }) {
    const ha = door / (2 * R);
    const seg = 64;
    this.cyl(parent, R, R, h, seg, mat, [0, y0 + h / 2, 0], null, { open: true, t0: at + ha, tl: TAU - 2 * ha, inner: true });
    this.cyl(parent, R, R, sill, 4, mat, [0, y0 + sill / 2, 0], null, { open: true, t0: at - ha, tl: 2 * ha, inner: true });
    const hl = h - sill - doorH;
    this.cyl(parent, R, R, hl, 4, mat, [0, y0 + sill + doorH + hl / 2, 0], null, { open: true, t0: at - ha, tl: 2 * ha, inner: true });
    const s = this.site(parent, R, at, 0);
    for (const e of [-1, 1]) this.box(s, 0.03, doorH + 0.06, 0.16, this.M.dark, [e * (door / 2 + 0.012), y0 + sill + doorH / 2, -0.02]);
    this.box(s, door + 0.08, 0.03, 0.16, this.M.dark, [0, y0 + sill + doorH + 0.012, -0.02]);
    this.box(s, door + 0.08, 0.03, 0.16, this.M.dark, [0, y0 + sill - 0.012, -0.02]);
    return s;
  }

  /** Anchor chairs round a base ring: gusset pair, top plate, stud, washer and nut. */
  anchorChairs(parent, R, y, n, rot = 0) {
    const M = this.M;
    for (let i = 0; i < n; i++) {
      const s = this.site(parent, R, rot + i / n * TAU, y);
      for (const e of [-1, 1]) this.box(s, 0.018, 0.3, 0.17, M.dark, [e * 0.07, 0.15, 0.085]);
      this.box(s, 0.2, 0.025, 0.18, M.dark, [0, 0.312, 0.09]);
      this.cyl(s, 0.019, 0.019, 0.16, 6, M.pipe, [0, 0.33, 0.11]);
      this.box(s, 0.075, 0.012, 0.075, M.dark, [0, 0.331, 0.11]);
      this.cyl(s, 0.036, 0.036, 0.035, 6, M.dark, [0, 0.354, 0.11]);
    }
  }

  /**
   * Insulation under aluminium jacketing, in tiers of lapped sheets with a
   * strap round each lap. `missing` lists [tier, sheet] pairs gone to the wind;
   * where a sheet has gone the wool shows, and `hang` leaves one swinging from
   * its top edge.
   */
  cladding(parent, { R, ya, yb, t = 0.075, sheet = 1.15, tierH = 1.7, missing = [], hang = null, seg = 5 }) {
    const { K, M } = this;
    const Rc = R + t;
    const nP = Math.max(6, Math.round(TAU * Rc / sheet));
    const da = TAU / nP;
    const nT = Math.max(1, Math.round((yb - ya) / tierH));
    const th = (yb - ya) / nT;
    const gone = new Set(missing.map(([ti, i]) => `${ti}|${(i % nP + nP) % nP}`));
    for (let ti = 0; ti < nT; ti++) {
      const yc = ya + th * (ti + 0.5);
      for (let i = 0; i < nP; i++) {
        const a0 = i * da;
        if (gone.has(`${ti}|${i}`)) {
          this.cyl(parent, R + t * 0.6, R + t * 0.6, th, seg, K.wool, [0, yc, 0], null, { open: true, t0: a0, tl: da });
          continue;
        }
        this.cyl(parent, Rc, Rc, th + 0.03, seg, K.clad, [0, yc, 0], null, { open: true, t0: a0 + 0.002, tl: da - 0.004 });
        const s = this.site(parent, Rc + 0.003, a0 + 0.002, yc);
        this.box(s, 0.035, th, 0.008, K.clad, [0.012, 0, 0]);
      }
      this.hoop(parent, Rc + 0.008, ya + th * ti + 0.06, 0.007, M.pipe, 96, 3);
      this.hoop(parent, Rc + 0.008, yc, 0.006, M.pipe, 96, 3);
    }
    // Rain flashing over the top, so water sheds off the jacket, not into it.
    this.lathe(parent, [new THREE.Vector2(Rc + 0.02, -0.03), new THREE.Vector2(Rc + 0.02, 0), new THREE.Vector2(R + 0.004, 0.09)],
      64, K.clad, [0, yb, 0], null, `flash${R}|${t}`);
    this.hoop(parent, Rc + 0.012, ya + 0.02, 0.012, M.pipe, 96, 3);
    if (hang) {
      const [ti, i, swing] = hang;
      const amid = ((i % nP + nP) % nP + 0.5) * da;
      const top = ya + th * (ti + 1) - 0.08;
      const s = this.site(parent, Rc + 0.02, amid, top);
      const sw = new THREE.Group();
      sw.rotation.x = -swing;
      sw.rotation.z = swing * 0.3;
      s.add(sw);
      const w = TAU * Rc / nP * 0.94;
      this.box(sw, w, th * 0.62, 0.01, K.clad, [0, -th * 0.31, 0]);
      this.box(sw, w, 0.03, 0.012, K.clad, [0, -0.015, 0.004]);
    }
    return { nP, nT, da, th };
  }
}

/* ==========================================================================
   THE EVAPORATOR
   ========================================================================== */

/**
 * A brine crystalliser: a nine-metre vessel on a skirt on a plinth. The ladder
 * side faces the yard (+z, before the landmark's small turn), because that is
 * the side a student walks up to; the door in the skirt and the drain it
 * carries face away along the row.
 */
export function buildEvaporator(ctx, scale = 1) {
  const rig = new Rig(ctx, 'evaporator', Math.round(scale * 1000));
  const { g, M, K, rand } = rig;
  const R = 3.1 * scale;
  const y0 = 0.32;                 // plinth top
  const skH = 1.9;                 // skirt
  const yS = y0 + skH;             // bottom tangent line
  const shH = 6.2 * scale;
  const yT = yS + shH;             // top tangent line
  const yD = yT + 0.12;            // top landing
  const aLad = (rand() - 0.5) * 0.8;
  const aDoor = aLad - (1.5 + rand() * 0.35);
  const head = torispherical(R);

  /* ---- foundation ---- */
  // Octagonal, turned by its own geometry rather than by a mesh rotation: a
  // rotated part is measured by the box round its box, and grows a third.
  rig.cyl(g, R + 0.5, R + 0.66, 0.62, 8, K.concrete, [0, y0 - 0.31, 0], null, { t0: Math.PI / 8 });
  rig.cyl(g, R + 0.28, R + 0.33, 0.05, 48, K.concrete, [0, y0 + 0.02, 0]);
  rig.cyl(g, R + 0.2, R + 0.2, 0.035, 64, M.dark, [0, y0 + 0.06, 0]);
  rig.anchorChairs(g, R, y0 + 0.078, 16, aLad + 0.2);

  /* ---- skirt, bottom head, drain ---- */
  const skirtY = y0 + 0.078;
  rig.skirt(g, { R, y0: skirtY, h: skH - 0.078, at: aDoor, door: 0.9, doorH: 1.15, sill: 0.3 });
  rig.lathe(g, ellipsoidalBottom(R), 48, M.dark, [0, yS, 0], null, `ebot${R}`);
  // Skirt vents: a vessel skirt that cannot breathe collects gas at its crown.
  for (const off of [Math.PI - 0.7, Math.PI, Math.PI + 0.7]) {
    const a = aLad + off;
    const p0 = polar(R - 0.04, a, yS - 0.28), p1 = polar(R + 0.12, a, yS - 0.28);
    rig.strut(g, p0, p1, 0.055, M.pipe, 12);
    rig.plug(g, polar(R + 0.121, a, yS - 0.28), polar(1, a), 0.05);
  }
  // Bottom outlet down through the skirt and out of the door to a drain hub.
  const out = polar(1, aDoor);
  const yDr = y0 + 0.62;
  const drain = rig.pipe(g, [
    [0, yS - R / 2 + 0.06, 0], [0, yDr, 0],
    [out.x * (R + 0.85), yDr, out.z * (R + 0.85)],
    [out.x * (R + 0.85), 0.14, out.z * (R + 0.85)]
  ], 0.075, M.pipe, { bend: 0.25 });
  void drain;
  {
    const f = rig.frame(g, polar(R + 0.22, aDoor, yDr), out, UP);
    rig.valve(f, 0.075, 0, { stemOut: 0.2 });
  }
  const hub = rig.site(g, R + 0.85, aDoor, 0);
  rig.box(hub, 0.55, 0.3, 0.55, K.concrete, [0, 0.03, 0]);
  rig.box(hub, 0.44, 0.025, 0.44, K.grate, [0, 0.19, 0]);

  /* ---- shell, heads, seams ---- */
  rig.cyl(g, R, R, shH, 72, M.drum, [0, yS + shH / 2, 0], null, { open: true });
  rig.lathe(g, head.pts, 64, M.drum, [0, yT, 0], null, `toris${R}`);
  const nC = Math.max(2, Math.round(shH / 2.1));
  const ch = shH / nC;
  for (let k = 0; k <= nC; k++) rig.hoop(g, R + 0.003, yS + k * ch, 0.013, M.pipe, 96, 4);
  for (let k = 0; k < nC; k++) {
    const a = aLad + 0.9 + k * 2.3 + rand() * 0.4;
    const bead = rig.take(weldBead(ch - 0.04, M.pipe, { radius: 0.013, seed: k + rig.index * 7 }));
    bead.position.copy(polar(R + 0.004, a, yS + (k + 0.5) * ch));
  }

  // Stiffening rings: a T in section, flat ring welded on with a standing lip.
  const tRing = [
    [R, -0.012], [R + 0.13, -0.012], [R + 0.13, -0.06], [R + 0.145, -0.06],
    [R + 0.145, 0.06], [R + 0.13, 0.06], [R + 0.13, 0.012], [R, 0.012]
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const ya = yS + 1.72, yb = yT - 1.02;
  rig.lathe(g, tRing, 72, M.dark, [0, ya - 0.14, 0], null, `tring${R}`);
  rig.lathe(g, tRing, 72, M.dark, [0, yb + 0.16, 0], null, `tring${R}`);

  /* ---- cladding over the middle courses, with the weather in it ---- */
  {
    const nP = Math.max(6, Math.round(TAU * (R + 0.075) / 1.15));
    const face = Math.round(((aLad + 0.6) / TAU) * nP);   // sheet index near the yard side
    const missing = [];
    const k = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < k; i++) missing.push([Math.floor(rand() * 2), face + Math.floor(rand() * 7) - 1]);
    const hang = rand() > 0.35 ? [missing[0][0], missing[0][1], 0.3 + rand() * 0.35] : null;
    rig.cladding(g, { R, ya, yb, missing, hang, tierH: 1.9 });
  }
  // A sheet that came down in a gale, on the crust beside the plinth.
  {
    const a = aLad + 2.2 + rand() * 1.4;
    const s = rig.site(g, R + 1.2, a, 0.03);
    rig.box(s, 1.3, 0.012, 1.0, K.clad, [0, 0, 0], [0.05, rand() * 0.4 - 0.2, -0.06]);
  }

  /* ---- ladders and landings ---- */
  // Split ladder: a rest landing half way, the upper flight side-stepped, as
  // any climb over about six metres has to be.
  const yR = y0 + Math.round((yD - y0) * 0.5 / 0.3) * 0.3;
  const ls = rig.site(g, R, aLad, 0);
  const zc = x => Math.sqrt(R * R - x * x) - R;
  rig.ladder(ls, { base: [-0.95, y0, zc(0.95) + 0.22], a: 0, height: yR - y0, standoff: 0.22 });
  rig.ladder(ls, { base: [0, yR, 0.22], a: 0, height: yD - yR, standoff: 0.22 });
  rig.box(ls, 1.03, 0.035, 0.98, K.grate, [-0.065, yR - 0.0175, 0.49]);
  rig.channel(ls, [-0.58, yR - 0.1, 0.98], [0.45, yR - 0.1, 0.98], 0.12, 0.04, M.dark, UP);
  for (const x of [-0.5, 0.38]) {
    rig.angle(ls, [x, yR - 0.04, zc(x)], [x, yR - 0.04, 0.96], 0.07, M.dark, UP);
    rig.strut(ls, [x, yR - 0.8, zc(x)], [x, yR - 0.08, 0.85], 0.026, M.dark);
  }
  rig.rail(ls, [[-0.58, 0.96], [0.45, 0.96], [0.45, 0.1]], yR);

  const dL = 0.46 / (R + 0.4);
  const aP0 = aLad + dL, aP1 = aP0 + 3.4;
  rig.ringPlatform(g, { R, y: yD, a0: aP0, a1: aP1, width: 0.95, openStart: true });

  /* ---- shell nozzles and what hangs off them ---- */
  // Feed inlet: nozzle, valve, then down to grade and away, cut and blanked.
  {
    const aIn = aLad + 0.98, yIn = yS + 0.95;
    const n = rig.nozzle(g, polar(R, aIn, yIn), polar(1, aIn), 0.13, 0.36);
    const e = rig.valve(n.frame, 0.13, n.end);
    const down = yIn - 0.55;
    const p = rig.pipe(n.frame, [[0, e, 0], [0, e + 0.3, 0], [-down, e + 0.3, 0], [-down, e + 0.3, 1.2]], 0.13, M.pipe, { bend: 0.32 });
    const endF = rig.frame(n.frame, [-down, e + 0.3, 1.2], [0, 0, 1], XAXIS);
    rig.flange(endF, 0.13, 0.0, { blind: true });
    void p;
    const st = rig.local(n.frame, [-down - 0.13, e + 0.3, 0.75]);
    rig.strut(g, [st.x, 0, st.z], st, 0.045, M.dark, 8);
    rig.box(g, 0.3, 0.02, 0.24, M.dark, [st.x, st.y + 0.01, st.z]);
    rig.box(g, 0.34, 0.02, 0.34, M.dark, [st.x, 0.01, st.z]);
  }
  // Level bridle: two tappings, a standpipe between them, a transmitter.
  {
    const aLv = aLad + 0.55;
    const rB = R + 0.38;
    for (const y of [yS + 0.7, yb + 0.5]) {
      const n = rig.nozzle(g, polar(R, aLv, y), polar(1, aLv), 0.035, 0.3, { pad: true });
      void n;
    }
    rig.cyl(g, 0.05, 0.05, (yb + 0.5) - (yS + 0.7) + 0.3, 10, M.pipe, polar(rB, aLv, (yS + 0.7 + yb + 0.5) / 2));
    for (const y of [yS + 0.55, yb + 0.65]) rig.cyl(g, 0.065, 0.065, 0.06, 10, M.dark, polar(rB, aLv, y));
    const tx = rig.site(g, rB + 0.05, aLv, yS + 2.4);
    rig.box(tx, 0.16, 0.22, 0.12, M.dark, [0, 0, 0.06]);
    rig.cyl(tx, 0.07, 0.07, 0.1, 12, M.plate, [0, 0.15, 0.06]);
    rig.cyl(tx, 0.012, 0.012, 0.08, 6, M.pipe, [0, -0.15, 0.06]);
    // Drain valve at the foot of the standpipe.
    const dv = rig.frame(g, polar(rB, aLv, yS + 0.52), [0, -1, 0], polar(1, aLv));
    rig.valve(dv, 0.03, 0.02, { stemOut: 0.08 });
  }
  // Pressure gauge at chest height beside the ladder, temperature well above it.
  rig.gauge(g, polar(R, aLad + 0.21, yS + 1.45), polar(1, aLad + 0.21));
  {
    const a = aLad + 0.72;
    const n = rig.nozzle(g, polar(R, a, yS + 3.0), polar(1, a), 0.03, 0.22, { pad: false });
    rig.box(n.frame, 0.1, 0.09, 0.12, M.dark, [0, n.end + 0.045, 0]);
    rig.cyl(n.frame, 0.045, 0.045, 0.05, 10, M.dark, [0, n.end + 0.11, 0]);
  }
  // Side manway, with the davit that swings its cover.
  {
    const a = aLad - 0.85, y = yS + 0.85;
    const n = rig.nozzle(g, polar(R, a, y), polar(1, a), 0.3, 0.3, { blind: true });
    const f = n.frame;
    const zD = 0.3 * 1.6 + 0.12;
    rig.strut(f, [-0.35, 0.02, zD], [0.55, 0.02, zD], 0.03, M.dark, 8, UP);
    rig.box(f, 0.12, 0.2, 0.12, M.dark, [-0.35, 0.1, zD]);
    rig.box(f, 0.12, 0.2, 0.12, M.dark, [0.4, 0.1, zD]);
    rig.pipe(f, [[0.5, 0.02, zD], [0.5, n.end + 0.12, zD], [0.5, n.end + 0.12, 0], [0.12, n.end + 0.12, 0]], 0.025, M.dark, { bend: 0.1, radial: 6 });
    for (const e of [-1, 1]) rig.strut(f, [-0.1, n.end + 0.05, e * 0.12], [-0.1, n.end + 0.14, e * 0.12], 0.012, M.dark, 5);
    rig.strut(f, [-0.1, n.end + 0.14, -0.12], [-0.1, n.end + 0.14, 0.12], 0.012, M.dark, 5, UP);
  }
  // Nameplate, riveted to the shell where an inspector could read it.
  {
    const s = rig.site(g, R + 0.012, aLad - 0.42, yS + 1.4);
    rig.box(s, 0.36, 0.24, 0.012, M.plate, [0, 0, 0]);
    for (const [x, y] of [[-0.16, -0.1], [0.16, -0.1], [-0.16, 0.1], [0.16, 0.1]]) {
      rig.cyl(s, 0.009, 0.009, 0.012, 6, M.dark, [x, y, 0.01], [Math.PI / 2, 0, 0]);
    }
    rig.decal(placard(`${4471 + rig.index * 13}-B`, { w: 0.28, h: 0.1, bg: '#a79a80' }), s, [0, 0.02, 0.008]);
  }
  // A doubler plate welded over a thin spot, lower on the far side.
  {
    const s = rig.site(g, R + 0.006, aLad + 1.9 + rand() * 1.8, yS + 0.55 + rand() * 0.6);
    rig.box(s, 0.72, 0.46, 0.016, M.drum, [0, 0, 0]);
    for (const [a, b, len] of [[[0, 0.235, 0.01], [0, 0, Math.PI / 2], 0.72], [[0, -0.235, 0.01], [0, 0, Math.PI / 2], 0.72],
      [[0.365, 0, 0.01], [0, 0, 0], 0.46], [[-0.365, 0, 0.01], [0, 0, 0], 0.46]]) {
      const w = rig.take(weldBead(len, M.pipe, { radius: 0.011, seed: 3 + rig.index }), s);
      w.position.set(...a);
      w.rotation.set(...b);
    }
  }

  /* ---- the head ---- */
  // Top manway on the platform side, blanked, with its handle.
  {
    const a = aP0 + 0.95, x = R * 0.56;
    const y = yT + head.heightAt(x);
    const n = rig.nozzle(g, polar(x, a, y), UP, 0.28, 0.32, { hint: polar(1, a), blind: true });
    for (const e of [-1, 1]) rig.strut(n.frame, [0, n.end + 0.05, e * 0.14], [0, n.end + 0.15, e * 0.14], 0.013, M.dark, 5);
    rig.strut(n.frame, [0, n.end + 0.15, -0.14], [0, n.end + 0.15, 0.14], 0.013, M.dark, 5, UP);
  }
  // Vent stack with a gooseneck, so rain cannot fall straight in.
  {
    const a = aP0 + 2.4, x = R * 0.2;
    const y = yT + head.heightAt(x);
    const n = rig.nozzle(g, polar(x, a, y), UP, 0.1, 0.3, { hint: polar(1, a) });
    const e = n.end;
    const pipe = rig.pipe(n.frame, [[0, e, 0], [0, e + 2.6, 0], [0.34, e + 2.6, 0], [0.34, e + 2.25, 0]], 0.1, M.pipe, { bend: 0.16 });
    rig.plug(n.frame, [0.34, e + 2.249, 0], [0, -1, 0], 0.095);
    void pipe;
    rig.hoop(n.frame, 0.13, e + 1.3, 0.02, M.dark, 20, 4);
  }
  // Relief valve with its tail pipe, and two nozzles blanked off long ago.
  {
    const a = aP0 + 1.7, x = R * 0.4;
    const y = yT + head.heightAt(x);
    const n = rig.nozzle(g, polar(x, a, y), UP, 0.06, 0.2, { hint: polar(1, a) });
    const f = n.frame, e = n.end;
    rig.cyl(f, 0.085, 0.085, 0.2, 12, M.dark, [0, e + 0.1, 0]);
    rig.cyl(f, 0.05, 0.07, 0.34, 10, M.dark, [0, e + 0.37, 0]);
    rig.cyl(f, 0.03, 0.03, 0.06, 8, M.dark, [0, e + 0.57, 0]);
    rig.bar(f, [0, e + 0.5, 0.04], [0.02, e + 0.3, 0.2], 0.015, 0.01, M.dark, XAXIS);
    rig.pipe(f, [[0, e + 0.1, 0], [0.36, e + 0.1, 0], [0.36, e + 1.4, 0]], 0.05, M.pipe, { bend: 0.1 });
    rig.plug(f, [0.36, e + 1.401, 0], [0, 1, 0], 0.048);
  }
  for (const [off, r] of [[0.7, 0.12], [3.0, 0.09]]) {
    const a = aP0 + off, x = R * 0.66;
    const y = yT + head.heightAt(x);
    rig.nozzle(g, polar(x, a, y), UP, r, 0.28, { hint: polar(1, a), blind: true });
  }
  // Lifting lugs, still on after forty years because nobody cuts them off.
  for (const off of [1.35, 1.35 + Math.PI]) {
    const a = aLad + off, x = R * 0.74;
    const s = rig.site(g, x, a, yT + head.heightAt(x));
    rig.box(s, 0.035, 0.34, 0.36, M.dark, [0, 0.12, 0], [0.18, 0, 0]);
    rig.mesh(s, rig.geo('lugeye', () => new THREE.TorusGeometry(0.07, 0.022, 6, 14)), M.dark, [0, 0.3, 0], [0, Math.PI / 2, 0]);
  }

  /* ---- power and signal ---- */
  {
    const aT = aLad + 0.36;
    const s = rig.site(g, R, aT, 0);
    const yb0 = skirtY + 1.25, yt0 = yD - 0.35;
    for (const x of [-0.16, 0.16]) {
      rig.bar(s, [x, yb0, 0.2], [x, yt0, 0.2], 0.012, 0.08, M.dark, XAXIS);
      for (let y = yb0 + 0.4; y < yt0; y += 1.5) rig.bar(s, [x, y, 0.16], [x, y, -0.005], 0.05, 0.01, M.dark, UP);
    }
    for (let y = yb0 + 0.1; y < yt0; y += 0.3) rig.bar(s, [-0.16, y, 0.2], [0.16, y, 0.2], 0.03, 0.012, M.dark, UP);
    for (const [x, r] of [[-0.075, 0.016], [0, 0.021], [0.07, 0.012]]) {
      rig.strut(s, [x, yb0 - 0.35, 0.24], [x, yt0 + 0.1, 0.24], r, K.rubber, 6);
    }
    // Junction box on the skirt with its glands, and conduit into the plinth.
    rig.box(s, 0.42, 0.52, 0.2, M.dark, [0, skirtY + 0.72, 0.11]);
    rig.box(s, 0.44, 0.54, 0.02, M.plate, [0, skirtY + 0.72, 0.22]);
    for (const x of [-0.12, 0, 0.12]) rig.cyl(s, 0.022, 0.022, 0.05, 6, M.dark, [x, skirtY + 0.44, 0.11]);
    rig.pipe(s, [[0.12, skirtY + 0.42, 0.11], [0.12, y0 + 0.1, 0.11], [0.12, y0 + 0.1, 0.4], [0.12, y0 - 0.05, 0.4]], 0.022, M.pipe, { bend: 0.06, radial: 6 });
    // Signal cable off the tray to the level transmitter, slack as it was left.
    const from = rig.local(s, [0.16, yS + 2.5, 0.24]);
    const to = polar(R + 0.43, aLad + 0.55, yS + 2.28);
    rig.take(cableRun(from.toArray(), to.toArray(), K.rubber, { sag: 0.35, radius: 0.012, segments: 14 }));
  }
  // Earthing strap from a boss on the skirt to a rod in the crust.
  {
    const a = aLad - 0.2;
    const boss = polar(R + 0.03, a, skirtY + 0.35);
    rig.box(rig.site(g, R + 0.02, a, skirtY + 0.35), 0.08, 0.08, 0.04, M.dark, [0, 0, 0]);
    const rod = polar(R + 0.62, a - 0.05, 0.14);
    rig.cyl(g, 0.012, 0.012, 0.35, 5, M.pipe, [rod.x, 0.0, rod.z]);
    rig.take(cableRun(boss.toArray(), rod.toArray(), K.wire, { sag: 0.12, radius: 0.009, segments: 10 }));
  }

  /* ---- paint ---- */
  {
    const s = rig.site(g, R + 0.012, aDoor, 0);
    const stripe = hazardStripe(1.0, 0.16);
    rig.decal(stripe, s, [0, skirtY + 0.3 + 1.15 + 0.12, 0.004]);
    const tag = placard(`EV-${rig.index + 1}7`, { w: 0.5, h: 0.19 });
    rig.decal(tag, rig.site(g, R + 0.012, aDoor + 0.28, 0), [0, skirtY + 1.1, 0.002]);
  }

  return rig.finish();
}

/* ==========================================================================
   THE FRACTIONATING COLUMN
   ========================================================================== */

/**
 * A twenty-metre column: a bare stripping section on a skirt, a swage, and an
 * insulated rectifying section above it. Four landings, the ladder between
 * each side-stepped round the shell, a davit over the top for lifting trays
 * out, the overhead line down one side to grade, a reboiler and a knockout
 * pot at the foot, and three guys.
 */
export function buildCrackingTower(ctx, scale = 1) {
  const rig = new Rig(ctx, 'tower', Math.round(scale * 1000));
  const { g, M, K, rand } = rig;
  const s = scale;
  const R1 = 1.3 * s, R2 = 0.95 * s;
  const y0 = 0.32, skH = 2.6;
  const yS = y0 + skH;
  const yC = yS + 6.4 * s;
  const yC2 = yC + 1.1;
  const yT = y0 + 19.6 * s;
  const head = torispherical(R2);
  const shellAt = y => (y < yC ? R1 : y > yC2 ? R2 : R1 + (R2 - R1) * (y - yC) / (yC2 - yC));
  const A0 = (rand() - 0.5) * 0.7;
  const aDoor = A0 - 1.9;

  /* ---- foundation and skirt ---- */
  rig.cyl(g, R1 + 0.6, R1 + 0.78, 0.62, 8, K.concrete, [0, y0 - 0.31, 0], null, { t0: Math.PI / 8 });
  rig.cyl(g, R1 + 0.2, R1 + 0.2, 0.035, 48, M.dark, [0, y0 + 0.02, 0]);
  rig.anchorChairs(g, R1, y0 + 0.04, 12, A0 + 0.26);
  rig.skirt(g, { R: R1, y0: y0 + 0.04, h: skH - 0.04, at: aDoor, door: 0.8, doorH: 1.2, sill: 0.3 });
  rig.lathe(g, ellipsoidalBottom(R1), 40, M.dark, [0, yS, 0], null, `ebot${R1}`);

  /* ---- shell ---- */
  rig.cyl(g, R1, R1, yC - yS, 48, M.drum, [0, (yS + yC) / 2, 0], null, { open: true });
  rig.cyl(g, R2, R1, yC2 - yC, 48, M.drum, [0, (yC + yC2) / 2, 0], null, { open: true });
  rig.cyl(g, R2, R2, yT - yC2, 40, M.drum, [0, (yC2 + yT) / 2, 0], null, { open: true });
  rig.lathe(g, head.pts, 40, M.drum, [0, yT, 0], null, `toris${R2}`);
  for (let y = yS; y < yC; y += 1.8) rig.hoop(g, R1 + 0.003, y, 0.012, M.pipe, 72, 4);
  rig.hoop(g, R1 + 0.003, yC, 0.012, M.pipe, 72, 4);
  rig.hoop(g, R2 + 0.003, yC2, 0.012, M.pipe, 64, 4);
  rig.hoop(g, R2 + 0.003, yT, 0.012, M.pipe, 64, 4);
  {
    const nP = Math.max(6, Math.round(TAU * (R2 + 0.07) / 1.05));
    const missing = [];
    for (let i = 0; i < 2 + Math.floor(rand() * 2); i++) missing.push([Math.floor(rand() * 4), Math.floor(rand() * nP)]);
    rig.cladding(g, { R: R2, ya: yC2 + 0.25, yb: yT - 0.3, t: 0.07, sheet: 1.05, tierH: 1.5, missing, hang: [missing[0][0], missing[0][1], 0.35] });
  }
  // A patch low on the bare section, where a nozzle was cut out and plated over.
  {
    const st = rig.site(g, R1 + 0.006, A0 + 2.6 + rand(), yS + 1.2 + rand() * 1.5);
    rig.cyl(st, 0.34, 0.34, 0.016, 20, M.drum, [0, 0, 0], [Math.PI / 2, 0, 0]);
    rig.mesh(st, rig.geo('patchweld', () => new THREE.TorusGeometry(0.34, 0.011, 4, 32)), M.pipe, [0, 0, 0.008]);
  }

  /* ---- landings and the climb ---- */
  const yP = [yS + 4.0, yC2 + 2.4, yC2 + 6.0, yT + 0.1];
  const lad = [A0];
  const arcs = [];
  for (let i = 0; i < yP.length; i++) {
    const y = yP[i];
    const Rs = shellAt(y);
    const dl = 0.46 / (Rs + 0.4);
    const a0 = lad[i] + dl;
    const span = i === yP.length - 1 ? TAU - 2 * dl : 4.2;
    arcs.push([a0, a0 + span]);
    rig.ringPlatform(g, { R: Rs, y, a0, a1: a0 + span, width: 0.95, openStart: true });
    if (i < yP.length - 1) lad.push(a0 + 1.9 + rand() * 0.5);
  }
  // Each flight stands off the shell at the radius of the section it starts
  // on; where the column narrows above the swage the brackets simply get longer.
  const yFrom = [y0, ...yP.slice(0, -1)];
  for (let i = 0; i < yP.length; i++) {
    const Rs = shellAt(yFrom[i] + 0.1);
    rig.ladder(g, {
      base: polar(Rs + 0.22, lad[i], yFrom[i]), a: lad[i],
      height: yP[i] - yFrom[i], standoff: 0.22 + (Rs - shellAt(yP[i] - 0.1))
    });
  }
  // A manway above each of the lower three landings, and a gauge beside it.
  for (let i = 0; i < 3; i++) {
    const a = arcs[i][0] + 0.9;
    const y = yP[i] + 0.85;
    const Rs = shellAt(y);
    const n = rig.nozzle(g, polar(Rs, a, y), polar(1, a), 0.27, 0.3 + (i === 0 ? 0 : 0.07), { blind: true });
    const zD = 0.27 * 1.6 + 0.1;
    rig.strut(n.frame, [-0.3, 0.02, zD], [0.5, 0.02, zD], 0.026, M.dark, 8, UP);
    rig.pipe(n.frame, [[0.45, 0.02, zD], [0.45, n.end + 0.1, zD], [0.45, n.end + 0.1, 0], [0.1, n.end + 0.1, 0]], 0.022, M.dark, { bend: 0.08, radial: 6 });
    rig.gauge(g, polar(Rs + (i === 0 ? 0 : 0.07), a + 0.55, y + 0.35), polar(1, a + 0.55));
  }
  // Temperature wells up the rectifying section.
  for (let i = 0; i < 3; i++) {
    const a = A0 + 0.5 + i * 0.3, y = yC2 + 1.4 + i * 2.6;
    const n = rig.nozzle(g, polar(R2, a, y), polar(1, a), 0.03, 0.26, { pad: false });
    rig.box(n.frame, 0.1, 0.09, 0.12, M.dark, [0, n.end + 0.045, 0]);
  }
  // Level bridle on the stripping section.
  {
    const a = A0 + 0.62, rB = R1 + 0.36;
    for (const y of [yS + 0.6, yS + 3.2]) rig.nozzle(g, polar(R1, a, y), polar(1, a), 0.035, 0.28);
    const c = polar(rB, a, yS + 1.9);
    rig.cyl(g, 0.05, 0.05, 2.9, 10, M.pipe, c);
    const tx = rig.site(g, rB + 0.05, a, yS + 1.7);
    rig.box(tx, 0.16, 0.22, 0.12, M.dark, [0, 0, 0.06]);
    rig.cyl(tx, 0.07, 0.07, 0.1, 12, M.plate, [0, 0.15, 0.06]);
  }

  /* ---- davit over the top ---- */
  {
    const a = lad[3] + Math.PI;
    const st = rig.site(g, R2 + 0.4, a, yP[3]);
    const top = 2.35;
    rig.cyl(st, 0.08, 0.08, top, 12, M.dark, [0, top / 2, 0]);
    rig.cyl(st, 0.14, 0.14, 0.03, 12, M.dark, [0, 0.015, 0]);
    rig.ibeam(st, [0, top, -0.05], [0, top, 1.65], 0.16, 0.09, M.dark, UP);
    rig.angle(st, [0, top - 0.8, 0.05], [0, top - 0.1, 0.7], 0.06, M.dark, UP);
    rig.box(st, 0.16, 0.14, 0.12, M.dark, [0, top - 0.14, 1.5]);
    rig.strut(st, [0, top - 0.2, 1.5], [0, top - 1.05, 1.5], 0.008, K.wire, 4);
    rig.mesh(st, rig.geo('hook', () => new THREE.TorusGeometry(0.06, 0.018, 6, 12, Math.PI * 1.4)), M.dark, [0, top - 1.12, 1.5], [0, 0, Math.PI * 0.8]);
    rig.box(st, 0.12, 0.16, 0.1, M.dark, [0, top - 1.0, 1.5]);
  }

  /* ---- overhead line ---- */
  const aV = A0 + 2.9 + rand() * 0.6;
  const rv = R1 + 1.25;
  {
    const top = yT + head.top;
    const n = rig.nozzle(g, [0, top, 0], UP, 0.22 * s, 0.35, { hint: polar(1, aV) });
    const e = rig.local(n.frame, [0, n.end, 0]).y;
    const out = polar(1, aV);
    const r = 0.22 * s;
    const yLow = 0.95;
    rig.pipe(g, [
      [0, e, 0], [0, e + 0.55, 0], [out.x * rv, e + 0.55, out.z * rv],
      [out.x * rv, yLow, out.z * rv], [out.x * (rv + 0.75), yLow, out.z * (rv + 0.75)]
    ], r, M.pipe, { bend: r * 3 });
    // A spectacle blind swung shut at the end of the line: this column's
    // product has gone nowhere for a long time.
    const f = rig.frame(g, polar(rv + 0.75, aV, yLow), out, UP);
    const y1 = rig.flange(f, r, 0);
    rig.cyl(f, r * 1.6, r * 1.6, 0.03, 20, M.dark, [0, y1 + 0.015, 0]);
    rig.box(f, 0.03, 0.05, r * 1.6, M.dark, [r * 2.1, y1 + 0.015, 0]);
    rig.cyl(f, r * 1.2, r * 1.2, 0.03, 20, M.dark, [r * 3.4, y1 + 0.015, 0]);
    // Guides down the column every three metres: a cantilever arm and a clamp.
    for (let y = yS + 1.5; y < yT - 0.5; y += 3.0) {
      const Rs = shellAt(y);
      const st = rig.site(g, 0, aV, y);
      rig.angle(st, [0, 0, Rs - 0.01], [0, 0, rv - r - 0.02], 0.08, M.dark, UP);
      rig.strut(st, [0, -0.7, Rs], [0, -0.05, rv - r - 0.15], 0.025, M.dark);
      rig.mesh(st, rig.geo(`clamp${r}`, () => new THREE.TorusGeometry(r + 0.015, 0.012, 4, 16, Math.PI)), M.dark,
        [0, 0.02, rv], [Math.PI / 2, 0, Math.PI / 2]);
      rig.box(st, 0.18, 0.02, 0.06, M.dark, [0, 0, rv - r - 0.03]);
    }
    // Its foot: a shoe on a concrete pier.
    const pier = rig.site(g, rv + 0.35, aV, 0);
    rig.box(pier, 0.5, 0.55, 0.5, K.concrete, [0, 0.16, 0]);
    rig.box(pier, 0.1, yLow - r - 0.44, 0.3, M.dark, [0, 0.44 + (yLow - r - 0.44) / 2, 0]);
  }

  /* ---- reboiler ---- */
  {
    const aR = aDoor - 0.85;
    const st = rig.site(g, R1 + 1.35, aR, 0);
    const rr = 0.46, half = 1.2, ya = 1.16;
    rig.cyl(st, rr, rr, half * 2, 32, M.drum, [0, ya, 0], [0, 0, Math.PI / 2], { open: true });
    rig.lathe(st, ellipsoidalBottom(rr, 8), 32, M.drum, [-half, ya, 0], [0, 0, -Math.PI / 2], `ebot${rr}`);
    // Channel end: girth flange, bonnet and nozzles.
    const cf = rig.frame(st, [half, ya, 0], [1, 0, 0], UP);
    rig.flange(cf, rr / 1.6, 0.0);
    rig.cyl(cf, rr, rr, 0.35, 32, M.dark, [0, 0.2, 0], null, { open: true });
    rig.lathe(cf, ellipsoidalBottom(rr, 8), 32, M.dark, [0, 0.375, 0], [Math.PI, 0, 0], `ebot${rr}`);
    for (const x of [-0.75, 0.75]) {
      rig.box(st, 0.02, 0.62, 0.78, M.dark, [x, 0.72, 0]);
      rig.box(st, 0.26, 0.02, 0.84, M.dark, [x, 0.42, 0]);
      rig.box(st, 0.46, 0.46, 1.0, K.concrete, [x, 0.18, 0]);
      rig.cyl(st, rr + 0.012, rr + 0.012, 0.2, 16, M.dark, [x, ya, 0], [0, 0, Math.PI / 2], { open: true, t0: Math.PI * 0.6, tl: Math.PI * 0.8 });
    }
    // Vapour back into the column.
    const p0 = rig.local(st, [-0.4, ya + rr, 0]);
    const yRet = yS + 0.8;
    const dirIn = new THREE.Vector3(p0.x, 0, p0.z).normalize();
    const sh = dirIn.clone().multiplyScalar(R1).setY(yRet);
    rig.nozzle(g, rig.local(st, [-0.4, ya + rr - 0.02, 0]), UP, 0.14, 0.18, { hint: dirIn });
    rig.pipe(g, [[p0.x, ya + rr + 0.2, p0.z], [p0.x, yRet, p0.z], sh.clone().addScaledVector(dirIn, 0.4)], 0.14, M.pipe, { bend: 0.35 });
    const cn = rig.nozzle(g, sh, dirIn, 0.14, 0.4);
    void cn;
    // Bottom draw, blanked below a valve.
    const bd = rig.frame(st, [0.5, ya - rr, 0], [0, -1, 0], XAXIS);
    rig.cyl(bd, 0.08, 0.08, 0.14, 12, M.pipe, [0, 0.07, 0]);
    const ye = rig.flange(bd, 0.08, 0.14);
    const ve = rig.valve(bd, 0.08, ye, { stemOut: 0.15 });
    rig.flange(bd, 0.08, ve + 0.004, { blind: true });
  }

  /* ---- knockout pot ---- */
  {
    const aK = A0 - 3.3;
    const st = rig.site(g, R1 + 1.15, aK, 0);
    const rk = 0.38, yb0 = 0.75, hk = 1.7;
    rig.cyl(st, rk, rk, hk, 24, M.drum, [0, yb0 + hk / 2, 0], null, { open: true });
    rig.lathe(st, ellipsoidalBottom(rk, 8), 24, M.drum, [0, yb0, 0], null, `ebot${rk}`);
    rig.lathe(st, ellipsoidalBottom(rk, 8), 24, M.drum, [0, yb0 + hk, 0], [Math.PI, 0, 0], `ebot${rk}`);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * TAU + 0.5;
      const p = polar(rk - 0.02, a);
      rig.angle(st, [p.x, 0.02, p.z], [p.x, yb0 + 0.25, p.z], 0.07, M.dark, polar(1, a + Math.PI * 0.75));
      rig.box(st, 0.18, 0.015, 0.18, M.dark, [p.x, 0.008, p.z]);
    }
    const top = rig.local(st, [0, yb0 + hk + rk / 2, 0]);
    const inw = new THREE.Vector3(-top.x, 0, -top.z).normalize();
    const y1 = yS + 1.6;
    const sh = inw.clone().multiplyScalar(-R1).setY(y1);
    rig.pipe(g, [[top.x, top.y, top.z], [top.x, y1, top.z], sh.clone().addScaledVector(inw, -0.3)], 0.07, M.pipe, { bend: 0.18 });
    rig.nozzle(g, sh, inw.clone().negate(), 0.07, 0.3);
    rig.gauge(st, [0, yb0 + 0.9, rk], ZAXIS);
  }

  /* ---- cable tray to the second landing ---- */
  {
    const aT = A0 - 0.52;
    const rt = R1 + 0.28;
    const st = rig.site(g, rt, aT, 0);
    const yb0 = y0 + 0.9, yt0 = yP[1] - 0.3;
    for (const x of [-0.14, 0.14]) {
      rig.bar(st, [x, yb0, 0], [x, yt0, 0], 0.012, 0.07, M.dark, XAXIS);
      for (let y = yb0 + 0.5; y < yt0; y += 1.6) {
        const Rs = shellAt(y);
        rig.bar(st, [x, y, -0.03], [x, y, -(rt - Rs) + 0.005], 0.05, 0.01, M.dark, UP);
      }
    }
    for (let y = yb0 + 0.1; y < yt0; y += 0.3) rig.bar(st, [-0.14, y, 0], [0.14, y, 0], 0.03, 0.012, M.dark, UP);
    for (const [x, r] of [[-0.06, 0.017], [0.03, 0.013], [0.09, 0.01]]) rig.strut(st, [x, yb0 - 0.5, 0.035], [x, yt0 + 0.1, 0.035], r, K.rubber, 6);
    rig.box(st, 0.4, 0.5, 0.2, M.dark, [0, y0 + 0.62, -0.05]);
  }

  /* ---- guys ---- */
  // The one part that reaches past the footprint: a guy anchors where it must.
  {
    const yg = yT - 2.6;
    rig.cyl(g, R2 + 0.12, R2 + 0.12, 0.22, 32, M.dark, [0, yg, 0], null, { open: true });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.4;
      const lug = polar(R2 + 0.26, a, yg);
      rig.box(rig.site(g, R2 + 0.19, a, yg), 0.03, 0.2, 0.16, M.dark, [0, 0, 0]);
      const anchor = polar(8.5 * s, a, 0.55);
      const dir = lug.clone().sub(anchor).normalize();
      const tbA = anchor.clone().addScaledVector(dir, 0.35);
      const tbB = anchor.clone().addScaledVector(dir, 1.95);
      rig.strut(g, tbB, lug, 0.011, K.wire, 4);
      rig.strut(g, anchor.clone().addScaledVector(dir, 0.12), tbA, 0.011, K.wire, 4);
      // Turnbuckle: body, and an eye bolt out of each end.
      const tb = new THREE.Group();
      orient(tb, tbA.clone().addScaledVector(dir, 0.55), tbA.clone().addScaledVector(dir, 1.05), XAXIS);
      tb.scale.set(1, 1, 1);
      g.add(tb);
      rig.cyl(tb, 0.028, 0.028, 0.5, 8, M.dark, [0, 0, 0]);
      for (const e of [-1, 1]) {
        rig.strut(tb, [0, e * 0.25, 0], [0, e * 0.5, 0], 0.012, M.pipe, 5);
        rig.mesh(tb, rig.geo('guyeye', () => new THREE.TorusGeometry(0.035, 0.01, 4, 10)), M.dark, [0, e * 0.53, 0]);
      }
      rig.strut(g, tbA, tbA.clone().addScaledVector(dir, 0.1), 0.011, K.wire, 4);
      // Deadman: a concrete block in the crust, an anchor rod up out of it.
      const dm = rig.site(g, 8.5 * s + 0.2, a, 0);
      rig.box(dm, 0.8, 0.42, 0.8, K.concrete, [0, -0.06, 0]);
      rig.strut(g, polar(8.5 * s + 0.2, a, 0.1), anchor.clone().addScaledVector(dir, 0.05), 0.022, M.pipe, 6);
      rig.mesh(g, rig.geo('shackle', () => new THREE.TorusGeometry(0.05, 0.014, 5, 12)), M.dark, anchor.toArray(), [0, a, 0]);
    }
  }

  const tag = placard('FR-04', { w: 0.5, h: 0.19 });
  rig.decal(tag, rig.site(g, R1 + 0.014, A0 - 0.3, 0), [0, yS + 1.3, 0.002]);
  rig.decal(hazardStripe(0.9, 0.14), rig.site(g, R1 + 0.012, aDoor, 0), [0, y0 + 0.04 + 0.3 + 1.2 + 0.1, 0.004]);

  return rig.finish();
}

/* ==========================================================================
   THE PIPE RACK
   ========================================================================== */

/**
 * A 26 m pipe rack: four H-section portals eight metres apart on grouted base
 * plates, longitudinal ties at both tiers and a braced bay. Six lines on the
 * lower tier on shoes, one lagged and torn, one with bellows, one dropped into
 * an expansion loop below the rack; a ladder-type cable tray, small bore and a
 * grated walkway with its handrail on the upper tier, reached by a caged
 * ladder up the last column.
 */
export function buildPipeBridge(ctx) {
  const rig = new Rig(ctx, 'bridge', 26);
  const { g, M, K, rand } = rig;
  // Eight-metre bays, not six: a debris field lies against the east rack's
  // south bay, and a portal there would stand in it.
  const frames = [-12, -4, 4, 12];
  const cx = 1.5;
  const y1 = 4.5, y2 = 6.3;          // beam centre lines
  const t1 = y1 + 0.15, t2 = y2 + 0.15; // beam tops
  const zEnd = 13.3;

  /* ---- portals ---- */
  for (const z of frames) {
    for (const x of [-cx, cx]) {
      rig.box(g, 0.72, 0.3, 0.72, K.concrete, [x, 0.0, z]);
      rig.box(g, 0.5, 0.03, 0.5, M.dark, [x, 0.165, z]);
      for (const [bx, bz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
        rig.cyl(g, 0.016, 0.016, 0.12, 6, M.pipe, [x + bx, 0.21, z + bz]);
        rig.cyl(g, 0.03, 0.03, 0.03, 6, M.dark, [x + bx, 0.195, z + bz]);
      }
      rig.ibeam(g, [x, 0.18, z], [x, t2, z], 0.26, 0.26, M.plate, XAXIS);
      rig.box(g, 0.3, 0.02, 0.3, M.dark, [x, t2 - 0.01, z]);
      // Stiffeners and gussets at the beam seats.
      for (const yy of [y1, y2]) {
        for (const e of [-1, 1]) for (const f of [-1, 1]) rig.box(g, 0.24, 0.012, 0.12, M.dark, [x, yy + f * 0.14, z + e * 0.07]);
      }
      // Knee brace into the lower beam.
      rig.angle(g, [x, y1 - 0.95, z], [x * 0.55, y1 - 0.16, z], 0.08, M.dark, ZAXIS);
    }
    rig.ibeam(g, [-1.95, y1, z], [1.95, y1, z], 0.3, 0.18, M.plate, UP);
    rig.ibeam(g, [-1.95, y2, z], [1.95, y2, z], 0.3, 0.18, M.plate, UP);
    for (const x of [-1.95, 1.95]) for (const yy of [y1, y2]) rig.box(g, 0.012, 0.3, 0.18, M.dark, [x, yy, z]);
  }
  // Longitudinal ties, framed in at both tiers.
  for (let i = 0; i < frames.length - 1; i++) {
    const za = frames[i] + 0.14, zb = frames[i + 1] - 0.14;
    for (const x of [-cx, cx]) {
      rig.ibeam(g, [x, y1, za], [x, y1, zb], 0.2, 0.12, M.plate, UP);
      rig.ibeam(g, [x, y2 - 0.05, za], [x, y2 - 0.05, zb], 0.2, 0.12, M.plate, UP);
    }
  }
  // One braced bay, above head height, both sides.
  for (const x of [-cx, cx]) {
    rig.angle(g, [x, 2.4, 4.14], [x, y1 - 0.12, 11.86], 0.08, M.dark, XAXIS);
    rig.angle(g, [x, y1 - 0.12, 4.14], [x, 2.4, 11.86], 0.08, M.dark, XAXIS);
    rig.box(g, 0.012, 0.22, 0.22, M.dark, [x, (2.4 + y1) / 2 - 0.06, 8.0]);
    rig.ibeam(g, [x, 2.4, 4.14], [x, 2.4, 11.86], 0.16, 0.1, M.plate, UP);
  }

  /* ---- lower tier ---- */
  const lines = [
    { x: -0.95, r: 0.3, lag: true },
    { x: -0.3, r: 0.2, bellows: -8.6 },
    { x: 0.2, r: 0.16, valve: true },
    { x: 0.62, r: 0.11, loop: true },
    { x: 1.02, r: 0.085 },
    { x: 1.3, r: 0.05 },
    { x: -1.8, r: 0.045 }
  ];
  const shoeH = 0.1;
  for (const L of lines) {
    const yc = t1 + shoeH + L.r;
    if (L.loop) {
      rig.pipe(g, [
        [L.x, yc, -zEnd], [L.x, yc, -1.6], [L.x, 3.55, -1.6], [1.8, 3.55, -1.6],
        [1.8, 3.55, 1.6], [L.x, 3.55, 1.6], [L.x, yc, 1.6], [L.x, yc, zEnd]
      ], L.r, M.pipe, { bend: 0.34 });
      // Hung off the tie beam at the bottom of the loop.
      for (const z of [-0.6, 0.6]) rig.strut(g, [1.5, y1 - 0.1, z], [1.8, 3.55 + L.r, z], 0.012, M.dark, 4);
    } else {
      rig.strut(g, [L.x, yc, -zEnd], [L.x, yc, zEnd], L.r, M.pipe, L.r > 0.1 ? 16 : 10, UP);
    }
    // Shoes on every beam; guides clipped either side on the middle and ends.
    for (const z of frames) {
      rig.box(g, 0.012, shoeH, 0.3, M.dark, [L.x, t1 + shoeH / 2, z]);
      rig.box(g, Math.max(0.1, L.r * 1.2), 0.012, 0.3, M.dark, [L.x, t1 + shoeH - 0.006, z]);
      rig.box(g, 0.2, 0.012, 0.32, M.dark, [L.x, t1 + 0.006, z]);
      if (Math.abs(z) === 12) for (const e of [-1, 1]) rig.box(g, 0.05, 0.08, 0.12, M.dark, [L.x + e * 0.13, t1 + 0.04, z]);
      if (L.r < 0.12 && !L.lag) {
        rig.mesh(g, rig.geo(`ubolt${L.r}`, () => new THREE.TorusGeometry(L.r + 0.01, 0.008, 4, 12, Math.PI)), M.dark,
          [L.x, yc, z], [0, Math.PI / 2, 0]);
      }
    }
    // Ends: blanked, except the one that finishes in a valve.
    for (const e of [-1, 1]) {
      if (L.lag) continue;
      const f = rig.frame(g, [L.x, yc, e * zEnd], [0, 0, e], UP);
      if (L.valve && e > 0) {
        const ve = rig.valve(f, L.r, rig.flange(f, L.r, 0) + 0.003);
        rig.flange(f, L.r, ve + 0.004, { blind: true });
      } else if (L.r < 0.06 && e > 0) {
        // Cut with a torch and left open.
        rig.plug(f, [0, 0.001, 0], [0, 1, 0], L.r * 0.92);
      } else {
        rig.flange(f, L.r, 0, { blind: true });
      }
    }
    if (L.bellows !== undefined) {
      const b = rig.frame(g, [L.x, yc, L.bellows - 0.3], [0, 0, 1], UP);
      const pts = [];
      for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector2(L.r * (i % 2 ? 1.34 : 1.1), 0.08 + i * 0.037));
      rig.lathe(b, pts, 28, M.pipe, [0, 0, 0], null, `bellows${L.r}`);
      rig.flange(b, L.r, 0.04);
      rig.flange(b, L.r, 0.56);
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * TAU + 0.5;
        const p = polar(L.r * 1.6 + 0.05, a);
        rig.strut(b, [p.x, -0.05, p.z], [p.x, 0.65, p.z], 0.012, M.dark, 5);
      }
    }
    if (L.lag) {
      // Aluminium over wool, in one-metre sections with a band at each lap.
      // Two sections have gone; one hangs by its band under the pipe.
      const rc = L.r + 0.07;
      const torn = [10, 11];
      for (let i = 0; i < 26; i++) {
        const za = -13 + i, zc = za + 0.5;
        if (torn.includes(i)) continue;
        rig.cyl(g, rc, rc, 1.02, 24, K.clad, [L.x, yc, zc], [Math.PI / 2, 0, 0], { open: true });
        rig.mesh(g, rig.geo(`lagband${rc}`, () => new THREE.TorusGeometry(rc + 0.004, 0.008, 3, 20)), M.pipe, [L.x, yc, za]);
      }
      for (const z of [-3 - 0.04, -1 + 0.04]) rig.cyl(g, L.r + 0.055, L.r + 0.055, 0.08, 24, K.wool, [L.x, yc, z], [Math.PI / 2, 0, 0]);
      for (const e of [-1, 1]) {
        rig.lathe(g, [new THREE.Vector2(L.r + 0.01, 0), new THREE.Vector2(rc, 0.06)], 24, K.clad, [L.x, yc, e * 13.06], [e > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0], `lagcap${rc}`);
        const f = rig.frame(g, [L.x, yc, e * 13.06], [0, 0, e], UP);
        rig.flange(f, L.r, zEnd - 13.06, { blind: true });
      }
      const hang = new THREE.Group();
      hang.position.set(L.x, yc, -2.0);
      hang.rotation.set(0.22, 0, 0);
      g.add(hang);
      rig.cyl(hang, rc + 0.02, rc + 0.02, 0.95, 12, K.clad, [0.12, -0.36, 0], [Math.PI / 2, 0.1, 0], { open: true, t0: Math.PI * 0.6, tl: Math.PI * 0.9, inner: true });
    }
  }

  /* ---- upper tier ---- */
  // Ladder-type cable tray.
  {
    const x0 = -1.75, x1 = -1.15, y = t2 + 0.05;
    for (const x of [x0, x1]) rig.bar(g, [x, y, -12.8], [x, y, 12.8], 0.1, 0.012, M.dark, UP);
    for (let z = -12.6; z <= 12.6; z += 0.3) rig.bar(g, [x0, y - 0.04, z], [x1, y - 0.04, z], 0.02, 0.04, M.dark, UP);
    for (const [x, r] of [[-1.66, 0.024], [-1.58, 0.018], [-1.5, 0.02], [-1.41, 0.014], [-1.33, 0.022], [-1.25, 0.012]]) {
      rig.strut(g, [x, y - 0.03 + r, -12.8], [x, y - 0.03 + r, 12.8], r, K.rubber, 6, UP);
    }
    // One cable has slipped the tray and hangs in a bight over the side.
    rig.take(cableRun([-1.8, y + 0.02, -2.6], [-1.8, y + 0.02, 2.4], K.rubber, { sag: 1.25, radius: 0.02, segments: 20 }));
  }
  // Small bore and conduit.
  for (const [x, r] of [[-0.85, 0.05], [-0.6, 0.04], [-0.3, 0.03], [-0.2, 0.03], [-0.1, 0.03], [0.35, 0.045]]) {
    const yc = t2 + 0.05 + r;
    rig.strut(g, [x, yc, -12.9], [x, yc, 12.9], r, M.pipe, 8, UP);
    for (const z of frames) rig.box(g, 0.08, 0.05, 0.14, M.dark, [x, t2 + 0.025, z]);
  }
  // Walkway: grating on stringers, one panel gone, rails both sides.
  {
    const xa = 1.0, xb = 1.9, yDeck = t2 + 0.035;
    for (const x of [xa, xb]) rig.channel(g, [x, t2 - 0.075, -12.6], [x, t2 - 0.075, 12.6], 0.15, 0.05, M.dark, UP);
    const gone = 1 + Math.floor(rand() * 6);
    for (let i = 0; i < 8; i++) {
      if (i === gone) continue;
      const za = -12.6 + i * 3.15;
      rig.box(g, xb - xa, 0.035, 3.13, K.grate, [(xa + xb) / 2, t2 + 0.0175, za + 1.575]);
      for (const z of [za + 1.05, za + 2.1]) rig.bar(g, [xa, t2 - 0.03, z], [xb, t2 - 0.03, z], 0.06, 0.04, M.dark, UP);
    }
    rig.rail(g, [[xb, -12.6], [xb, 11.55]], yDeck);
    rig.rail(g, [[xa, 12.6], [xa, -12.6], [xb, -12.6]], yDeck);
    // The way up: a caged ladder on the outboard face of the last column,
    // stood off far enough that the beam ends pass behind its rungs.
    rig.ladder(g, { base: [2.02, 0.18, 12], a: Math.PI / 2, height: yDeck - 0.18, standoff: 2.02 - cx - 0.13 });
  }

  const tag = placard('PR-2', { w: 0.34, h: 0.14 });
  rig.decal(tag, g, [cx - 0.137, 2.2, 12], -Math.PI / 2);

  return rig.finish();
}

/* ==========================================================================
   THE CONVEYOR
   ========================================================================== */

/**
 * A 22 m inclined belt conveyor at about fifteen degrees: two lattice
 * trusses, troughed idlers every 1.2 m and returns every 3 m, a walkway up the
 * +x side, a drive at the head, a feed hopper at the tail, three bents under
 * it. The belt tore long ago: it ends ragged two thirds of the way up, a
 * strip of it hangs down through the frame, the return strand lies slack
 * between its rollers, and only a stub is still wrapped round the head pulley.
 */
export function buildConveyor(ctx) {
  const rig = new Rig(ctx, 'conveyor', 22);
  const { g, M, K, rand } = rig;
  const zT = -10.6, zH = 10.6;
  // The tail stands clear of the lab's rim wall, which runs under it at
  // z −18 and stands 0.6 m out of the crust.
  const yTl = 1.95, yHd = 7.6;
  const th = Math.atan2(yHd - yTl, zH - zT);
  const Lr = Math.hypot(yHd - yTl, zH - zT);
  const cosT = Math.cos(th), sinT = Math.sin(th);
  // Everything along the belt is built in the run frame: +z up the incline,
  // +y square to it, origin at the tail pulley centre line.
  const run = new THREE.Group();
  run.position.set(0, yTl, zT);
  run.rotation.x = -th;
  g.add(run);
  run.updateMatrixWorld(true);
  const toG = (x, y, s) => new THREE.Vector3(x, yTl + s * sinT + y * cosT, zT + s * cosT - y * sinT);
  const xs = 0.62, yTop = -0.25, yBot = -1.05;

  /* ---- trusses ---- */
  const panel = 1.5;
  const nPan = Math.ceil((Lr + 0.4) / panel);
  const s0 = -0.3, pl = (Lr + 0.6) / nPan;
  for (const x of [-xs, xs]) {
    const out = x > 0 ? XAXIS : XAXIS.clone().negate();
    rig.angle(run, [x, yTop, s0], [x, yTop, s0 + nPan * pl], 0.09, M.plate, out);
    rig.angle(run, [x, yBot, s0], [x, yBot, s0 + nPan * pl], 0.09, M.plate, out);
    for (let i = 0; i <= nPan; i++) {
      const s = s0 + i * pl;
      rig.angle(run, [x, yBot, s], [x, yTop, s], 0.065, M.dark, out);
      if (i < nPan) {
        const sa = i % 2 ? s : s + pl;
        const sb = i % 2 ? s + pl : s;
        rig.angle(run, [x, yBot + 0.04, sa], [x, yTop - 0.04, sb], 0.06, M.dark, out);
      }
    }
  }
  // Plan bracing between the bottom chords, the thing you see from under it.
  for (let i = 0; i < nPan; i++) {
    const s = s0 + i * pl;
    rig.angle(run, [-xs, yBot, s], [xs, yBot, s], 0.05, M.dark, UP);
    rig.angle(run, [-xs, yBot + 0.02, i % 2 ? s : s + pl], [xs, yBot + 0.02, i % 2 ? s + pl : s], 0.045, M.dark, UP);
  }

  /* ---- idlers ---- */
  const sTear = Lr * (0.6 + rand() * 0.08);
  const trough = 35 * Math.PI / 180;
  const rr = 0.063;
  const rollerGeo = rig.geo('idler', () => {
    const c = new THREE.CylinderGeometry(rr, rr, 1, 12);
    return c;
  });
  const roller = (parent, a, b) => {
    const m = new THREE.Mesh(rollerGeo, M.dark);
    const L = orient(m, vec(a), vec(b), UP);
    m.userData.uvs = [TAU * rr, L];
    parent.add(m);
  };
  for (let s = 0.9; s < Lr - 0.7; s += 1.2) {
    rig.channel(run, [-xs, yTop + 0.03, s], [xs, yTop + 0.03, s], 0.08, 0.04, M.dark, new THREE.Vector3(0, 1, 0));
    const yc = -0.075;
    const missing = rand() < 0.12 ? Math.floor(rand() * 3) : -1;
    const wing = [Math.cos(trough), Math.sin(trough)];
    const segs = [
      [[-0.22, yc], [0.22, yc]],
      [[-0.26, yc + 0.01], [-0.26 - 0.36 * wing[0], yc + 0.01 + 0.36 * wing[1]]],
      [[0.26, yc + 0.01], [0.26 + 0.36 * wing[0], yc + 0.01 + 0.36 * wing[1]]]
    ];
    segs.forEach(([p, q], k) => {
      if (k === missing) return;
      roller(run, [p[0], p[1], s], [q[0], q[1], s]);
    });
    for (const x of [-0.24, 0.24]) rig.box(run, 0.012, 0.13, 0.06, M.dark, [x, yTop + 0.1, s]);
    for (const e of [-1, 1]) rig.box(run, 0.012, 0.36, 0.06, M.dark, [e * 0.57, yTop + 0.2, s]);
  }
  // Returns, hung under the carry side.
  const yRet = -0.62;
  const returns = [];
  for (let s = 1.5; s < Lr - 1; s += 3.0) {
    returns.push(s);
    roller(run, [-0.58, yRet, s], [0.58, yRet, s]);
    for (const e of [-1, 1]) rig.bar(run, [e * 0.6, yTop, s], [e * 0.6, yRet - 0.02, s], 0.05, 0.01, M.dark, ZAXIS);
  }

  /* ---- pulleys, head and tail ---- */
  const pulley = (sAt, r, lagged) => {
    rig.cyl(run, r, r, 1.3, 20, lagged ? K.rubber : M.dark, [0, -0.3, sAt], [0, 0, Math.PI / 2]);
    for (const e of [-1, 1]) rig.cyl(run, r * 0.96, r * 0.96, 0.03, 20, M.dark, [e * 0.66, -0.3, sAt], [0, 0, Math.PI / 2]);
    rig.strut(run, [-0.9, -0.3, sAt], [0.9, -0.3, sAt], 0.045, M.pipe, 8);
    for (const e of [-1, 1]) {
      rig.box(run, 0.14, 0.14, 0.24, M.dark, [e * 0.78, -0.3, sAt]);
      rig.cyl(run, 0.075, 0.075, 0.16, 12, M.dark, [e * 0.78, -0.22, sAt]);
      rig.box(run, 0.02, 0.9, 1.1, M.dark, [e * 0.68, -0.55, sAt - 0.2]);
    }
  };
  pulley(0, 0.28, false);
  pulley(Lr, 0.3, true);
  // Screw take-up at the tail.
  for (const e of [-1, 1]) {
    rig.bar(run, [e * 0.78, -0.4, -0.5], [e * 0.78, -0.4, 0.8], 0.04, 0.08, M.dark, UP);
    rig.strut(run, [e * 0.78, -0.3, -0.55], [e * 0.78, -0.3, 0.9], 0.016, M.pipe, 6);
  }
  // Head hood over the pulley and a discharge chute under it.
  {
    rig.cyl(run, 0.55, 0.55, 1.4, 16, M.plate, [0, -0.25, Lr + 0.05], [0, 0, Math.PI / 2], { open: true, t0: -Math.PI * 0.05, tl: Math.PI * 0.8, inner: true });
    const hc = toG(0, -0.4, Lr + 0.5);
    rig.cyl(g, 0.55, 0.36, 1.5, 4, M.plate, [0, hc.y - 0.95, hc.z], [0, Math.PI / 4, 0], { open: true, inner: true });
    rig.cyl(g, 0.6, 0.6, 0.05, 4, M.dark, [0, hc.y - 0.22, hc.z], [0, Math.PI / 4, 0], { open: true });
  }
  // The drive: reducer on the shaft, motor on a base, a guard over the coupling.
  {
    const hs = Lr;
    rig.box(run, 0.36, 0.44, 0.52, M.plate, [1.1, -0.3, hs]);
    rig.box(run, 0.4, 0.06, 0.56, M.dark, [1.1, -0.06, hs]);
    rig.cyl(run, 0.12, 0.12, 0.1, 14, M.dark, [0.93, -0.3, hs], [0, 0, Math.PI / 2]);
    rig.box(run, 0.5, 0.03, 0.9, M.dark, [1.1, -0.66, hs - 0.55]);
    rig.cyl(run, 0.17, 0.17, 0.5, 16, M.plate, [1.1, -0.47, hs - 0.72], [Math.PI / 2, 0, 0]);
    for (let k = 0; k < 7; k++) rig.cyl(run, 0.19, 0.19, 0.012, 16, M.plate, [1.1, -0.47, hs - 0.93 + k * 0.07], [Math.PI / 2, 0, 0]);
    rig.box(run, 0.14, 0.12, 0.14, M.dark, [1.1, -0.26, hs - 0.7]);
    rig.cyl(run, 0.1, 0.1, 0.3, 12, M.plate, [1.1, -0.47, hs - 0.32], [Math.PI / 2, 0, 0], { open: true, inner: true });
    for (const e of [-1, 1]) rig.angle(run, [0.72, -0.66, hs - 0.2 + e * 0.35], [1.34, -0.66, hs - 0.2 + e * 0.35], 0.05, M.dark, UP);
    rig.take(cableRun(toG(1.1, -0.26, hs - 0.7).toArray(), toG(1.3, -1.05, hs - 3.0).toArray(), K.rubber, { sag: 0.4, radius: 0.016 }));
  }
  // Feed hopper and skirt boards at the tail.
  {
    rig.cyl(run, 0.75, 0.3, 0.8, 4, M.plate, [0, 0.62, 1.6], [0, Math.PI / 4, 0], { open: true, inner: true });
    for (const e of [-1, 1]) rig.box(run, 0.012, 0.25, 2.4, M.dark, [e * 0.4, 0.14, 1.7]);
  }

  /* ---- the belt ---- */
  {
    const w = [Math.cos(trough), Math.sin(trough)];
    const prof = [[-0.26 - 0.34 * w[0], -0.01 + 0.34 * w[1]], [-0.24, -0.01], [0.24, -0.01], [0.26 + 0.34 * w[0], -0.01 + 0.34 * w[1]]];
    const across = [];
    for (let i = 0; i < prof.length - 1; i++) for (let k = 0; k < 3; k++) {
      const t = k / 3;
      across.push([prof[i][0] + (prof[i + 1][0] - prof[i][0]) * t, prof[i][1] + (prof[i + 1][1] - prof[i][1]) * t]);
    }
    across.push(prof[prof.length - 1]);
    const ragged = across.map(() => sTear - rand() * 0.5);
    const rows = [];
    for (let s = 0.02; s < sTear - 0.5; s += 1.2) rows.push(across.map(() => s));
    rows.push(ragged);
    const pos = [], idx = [], uv = [];
    const nA = across.length;
    rows.forEach((row, j) => {
      across.forEach(([x, y], i) => {
        pos.push(x, y + 0.004, row[i]);
        uv.push(i / (nA - 1), row[i]);
      });
      if (j > 0) for (let i = 0; i < nA - 1; i++) {
        const a = (j - 1) * nA + i, b = j * nA + i;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    });
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    bg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    bg.setIndex(idx);
    bg.computeVertexNormals();
    rig.mesh(run, rig.own(bg), K.rubber);
    // The torn strip, hanging down through the frame and twisting as it goes.
    const e0 = toG(0, 0, sTear - 0.3);
    const pts = [
      toG(-0.05, 0, sTear - 0.3), toG(-0.05, -0.35, sTear - 0.1), toG(0.05, -0.9, sTear - 0.15)
    ];
    const bottom = pts[2].clone();
    for (let k = 1; k <= 5; k++) pts.push(new THREE.Vector3(bottom.x + Math.sin(k * 0.9) * 0.12, bottom.y - k * 0.52, bottom.z + k * 0.05));
    void e0;
    const widths = pts.map((_, i) => 0.62 - i * 0.05);
    const twists = pts.map((_, i) => i * 0.22);
    rig.mesh(g, rig.own(ribbonGeometry(pts, XAXIS, widths, twists)), K.rubber);
    // The return strand, slack between its rollers.
    const rp = [[0, yRet + rr + 0.006, -0.02]];
    for (let i = 0; i < returns.length; i++) {
      const sa = i === 0 ? 0 : returns[i - 1];
      const sb = returns[i];
      rp.push([0, yRet + rr + 0.004 - 0.18 - rand() * 0.1, (sa + sb) / 2]);
      rp.push([0, yRet + rr + 0.006, sb]);
    }
    rp.push([0, yRet + rr - 0.25, (returns[returns.length - 1] + Lr) / 2]);
    rp.push([0, -0.3 - 0.3, Lr]);
    rig.mesh(run, rig.own(ribbonGeometry(rp, XAXIS, rp.map(() => 1.1))), K.rubber);
    // A stub still wrapped over the head pulley, torn off a metre down.
    rig.cyl(run, 0.31, 0.31, 1.1, 14, K.rubber, [0, -0.3, Lr], [0, 0, Math.PI / 2], { open: true, t0: -Math.PI / 2, tl: Math.PI * 1.05 });
    rig.mesh(run, rig.own(ribbonGeometry([[0, 0.012, Lr - 1.1], [0, 0.012, Lr]], XAXIS, [1.05, 1.1])), K.rubber);
  }

  /* ---- walkway up the +x side ---- */
  {
    const xa = 0.7, xb = 1.42, yw = -0.4;
    const sa = 0.8, sb = Lr - 0.9;
    rig.box(run, xb - xa, 0.035, sb - sa, K.grate, [(xa + xb) / 2, yw - 0.0175, (sa + sb) / 2]);
    for (let s = sa; s <= sb; s += 0.4) rig.box(run, xb - xa, 0.025, 0.025, M.dark, [(xa + xb) / 2, yw + 0.012, s]);
    rig.angle(run, [xb, yw - 0.04, sa], [xb, yw - 0.04, sb], 0.06, M.dark, XAXIS);
    for (let s = sa; s <= sb + 0.01; s += 2.4) {
      rig.angle(run, [xs, yw - 0.045, s], [xb, yw - 0.045, s], 0.06, M.dark, UP);
      rig.strut(run, [xs, yBot + 0.05, s], [xb - 0.1, yw - 0.08, s], 0.02, M.dark);
    }
    // Posts stand plumb, not square to the incline: built in the prop's frame.
    const n = Math.ceil((sb - sa) / 1.6);
    const tops = [];
    for (let k = 0; k <= n; k++) {
      const s = sa + (sb - sa) * k / n;
      const p = toG(xb - 0.03, yw, s);
      rig.strut(g, p, p.clone().setY(p.y + 1.1), 0.024, K.rail, 6);
      tops.push(p);
    }
    for (let k = 1; k < tops.length; k++) {
      for (const hgt of [1.07, 0.53]) {
        rig.strut(g, tops[k - 1].clone().setY(tops[k - 1].y + hgt), tops[k].clone().setY(tops[k].y + hgt), hgt > 1 ? 0.022 : 0.018, K.rail, 6);
      }
    }
  }

  /* ---- bents and the tail stand ---- */
  // Where the bottom chord crosses a plumb line at z, in the prop's frame.
  const chordY = z => yTl + (z - zT) * Math.tan(th) + yBot / cosT;
  for (const z of [-8.36, 0, 8.36]) {
    const yb = chordY(z) - 0.3;
    for (const x of [-0.7, 0.7]) {
      rig.box(g, 0.6, 0.3, 0.6, K.concrete, [x, 0.0, z]);
      rig.box(g, 0.42, 0.025, 0.42, M.dark, [x, 0.16, z]);
      for (const [bx, bz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) rig.cyl(g, 0.026, 0.026, 0.04, 6, M.dark, [x + bx, 0.19, z + bz]);
      rig.ibeam(g, [x, 0.17, z], [x, yb, z], 0.2, 0.2, M.plate, XAXIS);
    }
    rig.ibeam(g, [-0.85, yb + 0.1, z], [0.85, yb + 0.1, z], 0.2, 0.14, M.plate, UP);
    for (const x of [-xs, xs]) rig.box(g, 0.16, 0.02, 0.3, M.dark, [x, yb + 0.21, z]);
    if (yb > 2.2) {
      const ym = yb * 0.45;
      rig.angle(g, [-0.62, ym, z], [0.62, ym, z], 0.07, M.dark, UP);
      rig.angle(g, [-0.62, 0.4, z], [0.62, ym - 0.05, z], 0.07, M.dark, ZAXIS);
      rig.angle(g, [0.62, 0.4, z], [-0.62, ym - 0.05, z], 0.07, M.dark, ZAXIS);
      rig.angle(g, [-0.62, ym + 0.05, z], [0.62, yb - 0.05, z], 0.07, M.dark, ZAXIS);
      rig.angle(g, [0.62, ym + 0.05, z], [-0.62, yb - 0.05, z], 0.07, M.dark, ZAXIS);
    }
  }
  {
    const z = -10.35;
    const yb = chordY(z) - 0.05;
    for (const x of [-0.6, 0.6]) {
      rig.box(g, 0.5, 0.2, 0.5, K.concrete, [x, 0.02, z]);
      rig.channel(g, [x, 0.12, z], [x, Math.max(0.3, yb), z], 0.12, 0.05, M.plate, XAXIS);
    }
  }


  return rig.finish();
}

/* ==========================================================================
   THE MAST
   ========================================================================== */

/**
 * A self-supporting triangular lattice mast, seventeen metres: tapered legs
 * with flanged splices, zig-zag bracing, an anti-climb barrier round its foot,
 * a climbing ladder and a feeder ladder of coax up two faces, a work platform,
 * sector panels and whips at the top, a dish on a side arm, and a cabinet at
 * the base. It is guyed by nothing: a mast this height stands on its own legs.
 * The obstruction lamp is the only lit thing on it.
 */
export function buildCommsMast(ctx) {
  const rig = new Rig(ctx, 'mast', 17);
  const { g, M, K, rand } = rig;
  const H = 17;
  const rB = 0.72, rT = 0.3;
  const legR = y => rB + (rT - rB) * (y / H);
  const legA = [0, TAU / 3, 2 * TAU / 3].map(a => a + Math.PI / 3);
  const legAt = (i, y) => polar(legR(y), legA[i], y);

  /* ---- foundations and legs ---- */
  for (let i = 0; i < 3; i++) {
    const b = legAt(i, 0.25);
    rig.box(g, 0.5, 0.45, 0.5, K.concrete, [b.x, 0.02, b.z], [0, legA[i], 0]);
    rig.box(g, 0.3, 0.025, 0.3, M.dark, [b.x, 0.26, b.z], [0, legA[i], 0]);
    for (let k = 0; k < 4; k++) {
      const p = b.clone().add(polar(0.1, legA[i] + k * Math.PI / 2 + Math.PI / 4));
      rig.cyl(g, 0.022, 0.022, 0.05, 6, M.dark, [p.x, 0.29, p.z]);
    }
    rig.strut(g, legAt(i, 0.25), legAt(i, H), 0.05, M.dark, 8);
    for (const y of [5.6, 11.2]) {
      const p = legAt(i, y);
      rig.cyl(g, 0.1, 0.1, 0.05, 10, M.dark, p);
    }
  }
  /* ---- bracing ---- */
  const nPan = 16;
  const py = y => 0.25 + (H - 0.5) * y / nPan;
  for (let f = 0; f < 3; f++) {
    const i = f, j = (f + 1) % 3;
    for (let k = 0; k < nPan; k++) {
      const a = k % 2 ? legAt(i, py(k)) : legAt(j, py(k));
      const b = k % 2 ? legAt(j, py(k + 1)) : legAt(i, py(k + 1));
      rig.strut(g, a, b, 0.018, M.dark, 5);
      if (k % 2 === 0) rig.strut(g, legAt(i, py(k)), legAt(j, py(k)), 0.018, M.dark, 5);
    }
    rig.strut(g, legAt(i, py(nPan)), legAt(j, py(nPan)), 0.02, M.dark, 5);
  }
  // Plan bracing at each splice, so the section cannot rack.
  for (const y of [5.6, 11.2]) {
    for (let i = 0; i < 3; i++) {
      const a = legAt(i, y), b = legAt((i + 1) % 3, y);
      rig.strut(g, a, new THREE.Vector3((a.x + b.x) / 2 * 0.2, y, (a.z + b.z) / 2 * 0.2), 0.016, M.dark, 5);
    }
  }

  /* ---- anti-climb barrier ---- */
  for (let f = 0; f < 3; f++) {
    const i = f, j = (f + 1) % 3;
    const out = polar(0.09, (legA[i] + legA[j]) / 2 + (f === 2 ? Math.PI : 0));
    for (const y of [0.5, 3.0]) rig.strut(g, legAt(i, y).add(out), legAt(j, y).add(out), 0.016, M.dark, 5);
    for (let k = 1; k < 11; k++) {
      const t = k / 11;
      const a = legAt(i, 0.5).lerp(legAt(j, 0.5), t).add(out);
      const b = legAt(i, 3.0).lerp(legAt(j, 3.0), t).add(out);
      rig.bar(g, a, b, 0.03, 0.006, M.dark, legAt(j, 0.5).sub(legAt(i, 0.5)).normalize());
    }
  }

  /* ---- climbing ladder and feeder ---- */
  {
    const i = 0, j = 1;
    const mid = y => legAt(i, y).lerp(legAt(j, y), 0.5);
    const outDir = mid(0).setY(0).normalize();
    const along = legAt(j, 0).sub(legAt(i, 0)).setY(0).normalize();
    const off = y => mid(y).addScaledVector(outDir, 0.12);
    for (const e of [-0.2, 0.2]) {
      rig.strut(g, off(0.3).addScaledVector(along, e), off(14.2).addScaledVector(along, e), 0.016, K.rail, 5);
    }
    for (let y = 0.6; y < 14.2; y += 0.3) {
      rig.strut(g, off(y).addScaledVector(along, -0.2), off(y).addScaledVector(along, 0.2), 0.011, K.rail, 5, UP);
    }
    // Barrier gate over the ladder, padlocked.
    rig.box(g, 0.08, 0.1, 0.06, M.dark, off(1.3).addScaledVector(outDir, 0.09));
  }
  {
    const i = 1, j = 2;
    const mid = y => legAt(i, y).lerp(legAt(j, y), 0.5);
    const outDir = mid(0).setY(0).normalize();
    const along = legAt(j, 0).sub(legAt(i, 0)).setY(0).normalize();
    const off = y => mid(y).addScaledVector(outDir, -0.08);
    for (const e of [-0.14, 0.14]) rig.strut(g, off(1.2).addScaledVector(along, e), off(15.5).addScaledVector(along, e), 0.012, M.dark, 4);
    for (let y = 1.4; y < 15.5; y += 0.6) rig.strut(g, off(y).addScaledVector(along, -0.14), off(y).addScaledVector(along, 0.14), 0.01, M.dark, 4, UP);
    for (let k = 0; k < 4; k++) {
      const e = -0.09 + k * 0.06;
      rig.strut(g, off(1.2).addScaledVector(along, e).addScaledVector(outDir, 0.025), off(15.6).addScaledVector(along, e).addScaledVector(outDir, 0.025), 0.013 + (k % 2) * 0.004, K.rubber, 6);
    }
  }

  /* ---- platform ---- */
  const yPf = 14.2;
  {
    const shape = new THREE.Shape();
    const corners = [0, 1, 2].map(i => polar(0.95, legA[i]));
    shape.moveTo(corners[0].x, -corners[0].z);
    shape.lineTo(corners[1].x, -corners[1].z);
    shape.lineTo(corners[2].x, -corners[2].z);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    rig.mesh(g, rig.own(geo), K.grate, [0, yPf - 0.035, 0]);
    for (let i = 0; i < 3; i++) {
      rig.angle(g, [0, yPf - 0.04, 0], corners[i].clone().setY(yPf - 0.04), 0.06, M.dark, UP);
      rig.strut(g, legAt(i, yPf - 1.0), corners[i].clone().setY(yPf - 0.07), 0.02, M.dark);
    }
    const pts = corners.map(c => [c.x * 0.97, c.z * 0.97]);
    rig.rail(g, pts, yPf, { closed: true, span: 1.2 });
  }

  /* ---- antennas ---- */
  // Sector panels on pipe mounts at the platform rail, one per face.
  for (let f = 0; f < 3; f++) {
    const a = (legA[f] + legA[(f + 1) % 3]) / 2 + (f === 2 ? Math.PI : 0);
    const st = rig.site(g, 0.72, a, yPf);
    rig.strut(st, [0, 0.2, 0], [0, 2.4, 0], 0.035, M.pipe, 8);
    // Outrigger arms back to the rail, since the mount stands past its edge.
    for (const y of [0.3, 1.07]) rig.strut(st, [0, y, 0], [0, y, -0.28], 0.02, M.dark, 5);
    rig.box(st, 0.3, 1.3, 0.11, M.plate, [0, 1.55, 0.12], [-0.05 - rand() * 0.08, 0, 0]);
    for (const y of [1.05, 2.05]) rig.box(st, 0.05, 0.05, 0.12, M.dark, [0, y, 0.05]);
  }
  // Whips off two leg tops, the lightning spike off the third, and a short
  // pipe up the middle that the lamp stands on.
  for (let i = 0; i < 3; i++) {
    const p = legAt(i, H);
    if (i === 0) {
      rig.strut(g, [p.x, H, p.z], [p.x, H + 2.2, p.z], 0.014, M.pipe, 5);
      continue;
    }
    rig.cyl(g, 0.012, 0.028, 2.6, 6, M.dark, [p.x * 1.05, H + 1.3, p.z * 1.05]);
    rig.cyl(g, 0.05, 0.05, 0.12, 8, M.dark, [p.x * 1.05, H + 0.02, p.z * 1.05]);
  }
  rig.strut(g, [0, H - 0.6, 0], [0, H, 0], 0.045, M.pipe, 8);
  for (let i = 0; i < 3; i++) rig.strut(g, legAt(i, H - 0.4), [0, H - 0.4, 0], 0.02, M.dark, 5);
  // Microwave drum.
  {
    const a = legA[2] + 0.35;
    const st = rig.site(g, legR(12.8) + 0.2, a, 12.8);
    rig.cyl(st, 0.3, 0.3, 0.26, 20, M.plate, [0, 0, 0.14], [Math.PI / 2, 0, 0]);
    rig.cyl(st, 0.29, 0.29, 0.02, 20, K.face, [0, 0, 0.28], [Math.PI / 2, 0, 0]);
    rig.strut(st, [0, 0, 0], [0, 0, -0.25], 0.03, M.dark, 6);
  }
  // The dish, on a side arm off the fourth splice, canted off true.
  {
    const a = legA[1] + 0.2;
    const leg = legAt(1, 11.0);
    const mountR = legR(11.0) + 0.42;
    const mp = polar(mountR, a, 11.0);
    rig.strut(g, mp.clone().setY(10.2), mp.clone().setY(11.8), 0.045, M.pipe, 8);
    for (const y of [10.5, 11.5]) rig.strut(g, legAt(1, y), mp.clone().setY(y), 0.025, M.dark, 6);
    void leg;
    const aim = a + 0.35 + rand() * 0.3;
    const dishFrame = rig.frame(g, mp.clone().add(polar(0.2, aim, 0)), polar(1, aim).setY(0.12).normalize(), UP);
    const D = 0.62, depth = 0.2;
    const prof = [];
    for (let k = 0; k <= 8; k++) {
      const x = D * k / 8;
      prof.push(new THREE.Vector2(Math.max(1e-4, x), depth * (x / D) ** 2));
    }
    rig.lathe(dishFrame, prof, 32, M.plate, [0, 0.05, 0], null, 'dishback');
    rig.mesh(dishFrame, rig.geo('dishfront', () => flipped(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p.x, p.y + 0.008)), 32))), K.face, [0, 0.05, 0]);
    rig.hoop(dishFrame, D, depth + 0.05, 0.015, M.dark, 32, 4);
    rig.cyl(dishFrame, 0.1, 0.12, 0.12, 12, M.dark, [0, 0, 0]);
    for (let k = 0; k < 3; k++) {
      const pa = polar(D * 0.95, k / 3 * TAU, depth + 0.05);
      rig.strut(dishFrame, [pa.x, pa.y, pa.z], [0, 0.5, 0], 0.01, M.dark, 4);
    }
    rig.cyl(dishFrame, 0.04, 0.05, 0.12, 8, M.dark, [0, 0.52, 0]);
    rig.bar(dishFrame, [0, -0.05, 0], [0, -0.2, 0], 0.08, 0.08, M.dark, UP);
  }

  /* ---- cabinet at the foot ---- */
  {
    const a = (legA[2] + legA[0]) / 2 + Math.PI;
    const st = rig.site(g, 0.45, a, 0);
    rig.box(st, 0.95, 0.2, 0.62, K.concrete, [0, 0.05, 0.3]);
    rig.box(st, 0.8, 1.45, 0.52, M.plate, [0, 0.9, 0.3]);
    rig.box(st, 0.92, 0.04, 0.66, M.dark, [0, 1.66, 0.34], [-0.06, 0, 0]);
    rig.box(st, 0.012, 1.3, 0.012, M.dark, [0, 0.9, 0.565]);
    for (const y of [0.4, 0.9, 1.4]) rig.cyl(st, 0.018, 0.018, 0.08, 6, M.dark, [-0.39, y, 0.56]);
    rig.box(st, 0.03, 0.14, 0.04, M.dark, [0.3, 0.95, 0.58]);
    for (let k = 0; k < 5; k++) rig.box(st, 0.28, 0.012, 0.02, M.dark, [0.2, 0.35 + k * 0.05, 0.565], [0.4, 0, 0]);
    rig.take(cableRun(rig.local(st, [0, 1.6, 0.1]).toArray(), legAt(1, 1.3).lerp(legAt(2, 1.3), 0.5).toArray(), K.rubber, { sag: 0.3, radius: 0.02 }));
    rig.decal(placard('TX-9', { w: 0.24, h: 0.1 }), st, [-0.15, 1.3, 0.563]);
  }

  /* ---- the lamp ---- */
  const lampBase = rig.cyl(g, 0.11, 0.13, 0.12, 12, M.dark, [0, H + 0.06, 0]);
  void lampBase;
  for (let k = 0; k < 4; k++) rig.strut(g, polar(0.11, k * Math.PI / 2, H + 0.12), polar(0.11, k * Math.PI / 2, H + 0.42), 0.008, M.dark, 4);
  const lens = [];
  for (let k = 0; k <= 6; k++) {
    const t = k / 6 * Math.PI / 2;
    lens.push(new THREE.Vector2(Math.max(1e-4, 0.1 * Math.cos(t)), 0.14 + 0.12 * Math.sin(t)));
  }
  lens.unshift(new THREE.Vector2(0.1, 0));
  const lampBody = new THREE.Mesh(
    ctx.own(new THREE.LatheGeometry(lens, 14)),
    ctx.own(new THREE.MeshStandardMaterial({
      color: 0xd99423, emissive: SODIUM, emissiveIntensity: 1.6, roughness: 0.55
    }))
  );
  lampBody.position.y = H + 0.12;
  // Kept out of the static bake: the obstruction lamp flickers, and a baked
  // one would be a painted dot.
  lampBody.userData.noMerge = true;
  g.add(lampBody);
  g.userData.lamp = lampBody;

  return rig.finish();
}

/* ==========================================================================
   THE SCATTER
   ========================================================================== */

/** Bend a plate along its x: everything past `at` folds up by `angle`, with a ripple. */
function bentPlateGeo(w, d, t, at, angle, seed) {
  const g = new THREE.BoxGeometry(w, t, d, 10, 1, 4);
  const p = g.attributes.position;
  const rand = mulberry32(seed);
  const ripple = [rand(), rand(), rand()];
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (x > at) {
      const dx = x - at;
      x = at + dx * Math.cos(angle) - y * Math.sin(angle);
      y = dx * Math.sin(angle) + y * Math.cos(angle);
    }
    y += Math.sin(z * 4 + ripple[0] * 6) * 0.015 + Math.sin(x * 3 + ripple[1] * 6) * 0.02;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** A 200-litre drum, rolled hoops and chimes, crushed flat on one side. */
function crushedDrumGeo(seed) {
  const r = 0.29, h = 0.88;
  const prof = [];
  const Y = [0, 0.012, 0.03, 0.28, 0.3, 0.32, 0.56, 0.58, 0.6, 0.85, 0.868, 0.88];
  const Rr = [r * 0.97, r + 0.012, r, r, r + 0.012, r, r, r + 0.012, r, r, r + 0.012, r * 0.97];
  for (let i = 0; i < Y.length; i++) prof.push(new THREE.Vector2(Rr[i], Y[i] - h / 2));
  const g = new THREE.LatheGeometry(prof, 20);
  const p = g.attributes.position;
  const rand = mulberry32(seed);
  const dents = [0, 1, 2].map(() => [rand() * TAU, (rand() - 0.5) * h * 0.8, 0.05 + rand() * 0.07]);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 - 0.42 * Math.exp(-((y / (h * 0.3)) ** 2));
    if (x > 0) x *= k;
    const a = Math.atan2(x, z);
    for (const [da, dy, dd] of dents) {
      const f = Math.exp(-(((a - da) * 3) ** 2) - ((y - dy) / 0.12) ** 2);
      const rr = Math.hypot(x, z) || 1;
      x -= x / rr * dd * f; z -= z / rr * dd * f;
    }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** T4 decoration: offcuts, a crushed drum, pipe, a broken valve, cable. Never blocks a route. */
export function buildDebrisField(ctx, scale = 1, sx = 0, sz = 0) {
  const rig = new Rig(ctx, 'debris', ((sx * 73856093) ^ (sz * 19349663)) >>> 0);
  const { g, M, K } = rig;
  const rand = mulberry32(((sx * 73856093) ^ (sz * 19349663)) >>> 0);
  const within = 1.55;
  const spot = () => {
    const a = rand() * TAU, r = Math.sqrt(rand()) * within;
    return [Math.sin(a) * r * scale, Math.cos(a) * r * scale];
  };
  // Plate offcuts, some flat, some folded where they were torn off.
  for (let i = 0; i < 4; i++) {
    const w = (0.5 + rand() * 0.8) * scale, d = (0.35 + rand() * 0.6) * scale;
    const [x, z] = spot();
    const geo = rig.own(bentPlateGeo(w, d, 0.012, (rand() - 0.2) * w * 0.4, rand() > 0.5 ? 0.3 + rand() * 0.9 : 0.05, i + sx));
    rig.mesh(g, geo, i % 2 ? M.plate : M.drum, [x, 0.01, z], [(rand() - 0.5) * 0.12, rand() * TAU, (rand() - 0.5) * 0.12]);
  }
  // The drum, on its side, half in the crust.
  {
    const [x, z] = spot();
    rig.mesh(g, rig.own(crushedDrumGeo(sx * 31 + sz)), M.drum, [x * 0.6, 0.18 * scale, z * 0.6], [0.1, rand() * TAU, Math.PI / 2]).scale.setScalar(scale);
  }
  // Lengths of pipe, one still flanged, one bent where something hit it.
  {
    const [x, z] = spot();
    const a = rand() * TAU;
    const L = 1.5 * scale;
    const d = polar(L / 2, a);
    rig.strut(g, [x - d.x, 0.06, z - d.z], [x + d.x, 0.1, z + d.z], 0.09, M.pipe, 12);
    const f = rig.frame(g, [x + d.x, 0.1, z + d.z], polar(1, a).setY(0.03), UP);
    rig.flange(f, 0.09, 0.0);
    rig.plug(g, [x - d.x, 0.06, z - d.z], polar(-1, a), 0.085);
  }
  {
    const [x, z] = spot();
    const a = rand() * TAU;
    const p0 = new THREE.Vector3(x, 0.04, z);
    const p1 = p0.clone().add(polar(0.7 * scale, a, 0.03));
    const p2 = p1.clone().add(polar(0.5 * scale, a + 0.8, 0.02));
    rig.pipe(g, [p0, p1, p2], 0.05, M.pipe, { bend: 0.2 });
    rig.plug(g, p2, p2.clone().sub(p1), 0.048);
  }
  // A valve body with the wheel broken off beside it.
  {
    const [x, z] = spot();
    const f = rig.frame(g, [x, 0.12, z], polar(1, rand() * TAU).setY(0.1), UP);
    rig.valve(f, 0.08, -0.13, { wheel: false });
    rig.mesh(g, rig.geo('wheel0.188', () => new THREE.TorusGeometry(0.188, 0.014, 6, 24)), M.dark,
      [x + 0.4 * scale, 0.02, z - 0.2 * scale], [Math.PI / 2 + 0.1, 0, rand()]);
  }
  // Angle iron and a length of cable, snaking over the crust into it.
  {
    const [x, z] = spot();
    const a = rand() * TAU;
    rig.angle(g, [x, 0.04, z], [x + Math.sin(a) * 1.1 * scale, 0.02, z + Math.cos(a) * 1.1 * scale], 0.06, M.dark, UP);
  }
  {
    const pts = [];
    const [x, z] = spot();
    let a = rand() * TAU;
    let p = new THREE.Vector3(x * 0.5, 0.01, z * 0.5);
    for (let k = 0; k < 8; k++) {
      pts.push(p.clone().setY(k === 0 || k === 7 ? -0.03 : 0.012));
      a += (rand() - 0.5) * 1.4;
      p = p.clone().add(polar(0.3 * scale, a));
      if (p.length() > within * scale) p.multiplyScalar(within * scale / p.length());
    }
    rig.pipe(g, pts, 0.014, K.rubber, { bend: 0.15, radial: 6 });
  }
  return rig.finish();
}

/** T4 decoration: a survey stake with a wind-shredded flag and a tag. */
export function buildStakeMarker(ctx) {
  const rig = new Rig(ctx, 'stake', 3);
  const { g, M, K, rand } = rig;
  const lean = (rand() - 0.5) * 0.08;
  const s = new THREE.Group();
  s.rotation.set(lean, 0, (rand() - 0.5) * 0.08);
  g.add(s);
  rig.angle(s, [-0.02, -0.25, -0.02], [-0.02, 1.35, -0.02], 0.04, M.dark, UP);
  rig.box(s, 0.045, 0.2, 0.045, K.flag, [0, 1.22, 0]);
  // The hub beside it: the actual survey point, a nail in a short square post.
  rig.box(g, 0.05, 0.1, 0.05, M.plate, [0.16, 0.02, 0.05]);
  rig.cyl(g, 0.006, 0.006, 0.05, 5, M.pipe, [0.16, 0.08, 0.05]);
  // Flagging tape, three strips streaming downwind and shredded short.
  for (let k = 0; k < 3; k++) {
    const pts = [];
    const n = 5;
    const len = 0.28 + rand() * 0.3;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([0.03 + t * len, 1.3 - k * 0.02 - t * t * 0.12, Math.sin(t * 5 + k) * 0.04]);
    }
    rig.mesh(s, rig.own(ribbonGeometry(pts, UP, pts.map((_, i) => 0.03 * (1 - i / (n + 2))), pts.map((_, i) => i * 0.3 + k))), K.flag);
  }
  rig.box(s, 0.07, 0.05, 0.003, M.plate, [0.02, 0.95, 0.025]);
  rig.decal(placard(`SV-${117 + rig.index * 4}`, { w: 0.066, h: 0.046, bg: '#9f9a8e' }), s, [0.02, 0.95, 0.0275]);
  return rig.finish();
}

/* ==========================================================================
   FINISHING
   ========================================================================== */

/**
 * Lay textures in metres and cast shadows. Run last, once the prop is in its
 * own frame: every part's UVs are re-mapped so a tile is the same size on a
 * bolt head and a 26 m beam — cylinders round their own circumference, sweeps
 * along their length, everything else by projection onto whichever face of
 * the prop's box it looks toward.
 */
Rig.prototype.finish = function finish() {
  const g = this.g;
  g.updateMatrixWorld(true);
  const nm = new THREE.Matrix3();
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  const rand = mulberry32(0x7a11 + this.index);
  g.traverse(o => {
    if (!o.isMesh) return;
    const mat = o.material;
    if (mat.transparent) { o.receiveShadow = this.t4; return; }
    o.castShadow = o.receiveShadow = this.t4;
    if (!mat.map || o.userData.noMerge) return;
    const T = this.kit.tile.get(mat);
    if (!T) return;
    const su = T * mat.map.repeat.x, sv = T * mat.map.repeat.y;
    const geo = o.geometry.clone();
    const uv = geo.attributes.uv;
    if (!uv) return;
    if (o.userData.uvs) {
      const [a, b] = o.userData.uvs;
      const off = rand();
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * a / su + off, uv.getY(i) * b / sv);
    } else {
      const pos = geo.attributes.position, nor = geo.attributes.normal;
      if (!nor) return;
      nm.getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        n.fromBufferAttribute(nor, i).applyMatrix3(nm);
        const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
        let u, v;
        if (ax >= ay && ax >= az) { u = p.z * Math.sign(n.x || 1); v = p.y; }
        else if (ay >= az) { u = p.x; v = p.z * Math.sign(n.y || 1); }
        else { u = -p.x * Math.sign(n.z || 1); v = p.y; }
        uv.setXY(i, u / su, v / sv);
      }
    }
    o.geometry = geo;
  });
  return g;
};
