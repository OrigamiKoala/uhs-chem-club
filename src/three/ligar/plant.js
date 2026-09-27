/**
 * plant.js — the quarry's plant: everything built of steel that stands on the
 * flat and is not one of the four benches.
 *
 * Conveyors climbing out of the cut, ore skips on their trestle road, drum
 * stacks, the gate hut, the hauler, the sheds, the flue stacks, the water
 * tower, the cable masts, the landing pad and the survey stakes. Each builder
 * takes the `world` (its materials, `own`, `t4`, `buildRubbleField`, and
 * the lamp lists) and returns a group in the landmark's own frame, which
 * `LigarWorld.initLandmarks` bakes, places and turns.
 *
 * THESE ARE BUILT OUT OF THE PARTS THE REAL THING IS BUILT FROM. A conveyor is
 * a Warren truss of channel chords and angle lacing on braced H-section bents
 * founded on concrete, carrying troughing idlers, a belt that actually troughs,
 * a walkway with cleats, a handrail with stanchions, knee rail and toe plate,
 * a pull-wire, a head drive on a stool and a hood over the pulley. A tower is
 * battered H-section legs with tension rods, a grillage, a riveted tank, a
 * grated balcony and a caged ladder. None of it is a primitive standing in for
 * a shape. `mergeStatic` turns a thousand parts into a handful of draw calls,
 * so small parts are spent without apology: the eye reads scale from bolts,
 * rungs and rivets.
 *
 * Then forty years: dents, a sheet gone from a wall and another hanging off
 * one fixing, a replaced roof sheet that never matched, soot down the top of
 * a stack, conductors cut and left hanging from a dead crossarm.
 *
 * TEXTURES ARE LAID IN METRES (`Rig.finish`), so a rivet in the plate texture
 * is the same size on a bolt head and on a twenty-metre chord.
 *
 * PHYSICS lives in the world, not here: a landmark's collider is its
 * `ligar.json` radius, or, for an elevated structure, the feet `supportPoints`
 * in ligar.js lists — so a builder that moves a conveyor's trestles must move
 * them there too. Every prop stays inside its declared radius in plan.
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  cableRun, placard, hazardStripe, platedMetal, buildMaterial, texSize,
  heightField, readHeight, writeField, heightToAO, fbm, worley, canvas2d
} from '../materials/pbr-kit.js';

/** Sodium filament, the same one Tallow's lamps burn. */
const SODIUM = 0xd99423;
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const XAXIS = new THREE.Vector3(1, 0, 0);
const ZAXIS = new THREE.Vector3(0, 0, 1);

/* Deterministic layout noise: the quarry is the same quarry every visit. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An instanced field's instances as part boxes, for the overlap checker. */
function recordInstanceBoxes(mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const unit = mesh.geometry.boundingBox;
  const m = new THREE.Matrix4();
  const boxes = [];
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, m);
    boxes.push(unit.clone().applyMatrix4(m));
  }
  mesh.userData.partBoxes = boxes;
}

/* ==========================================================================
   SMALL GEOMETRY
   ========================================================================== */

const vec = p => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]));

/** A point on a circle, wound the way CylinderGeometry winds: angle 0 is +z, increasing toward +x. */
const polar = (r, a, y = 0) => new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);

const _bx = new THREE.Vector3();
const _by = new THREE.Vector3();
const _bz = new THREE.Vector3();
const _bm = new THREE.Matrix4();

/**
 * Stand a part built along +y between two points. `hint` says where the
 * part's own +x should face (projected square to its length), so a beam's web
 * stands the way a beam's web stands.
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

/** A flat-bottomed rail one metre long on +y: height along x (head at +x), foot across z. */
function railGeo() {
  return mergeParts([
    new THREE.BoxGeometry(0.014, 1, 0.1).translate(-0.043, 0, 0),
    new THREE.BoxGeometry(0.066, 1, 0.016).translate(0.0, 0, 0),
    new THREE.BoxGeometry(0.032, 1, 0.056).translate(0.044, 0, 0)
  ]);
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
  } else {
    const p = g.attributes.position;
    const others = Object.values(g.attributes);
    for (let i = 0; i < p.count; i += 3) {
      for (const at of others) {
        for (let c = 0; c < at.itemSize; c++) {
          const t = at.array[(i + 1) * at.itemSize + c];
          at.array[(i + 1) * at.itemSize + c] = at.array[(i + 2) * at.itemSize + c];
          at.array[(i + 2) * at.itemSize + c] = t;
        }
      }
    }
  }
  const n = g.attributes.normal;
  if (n) for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  return g;
}

/** Both faces of a single sheet in one geometry. */
function twoSided(geo) {
  const back = flipped(geo);
  const g = mergeParts([geo.index ? geo : geo, back]);
  return g;
}

/**
 * Sweep a circle along a polyline whose corners are filleted to `bend`.
 * Real pipe is straight, then a bend of a fixed radius, then straight.
 */
function sweepGeometry(points, r, { radial = 10, bend = r * 2.5 } = {}) {
  const P = points.map(vec);
  const path = [P[0]];
  for (let i = 1; i < P.length - 1; i++) {
    if (bend <= 0) { path.push(P[i]); continue; }
    const a = P[i - 1], p = P[i], c = P[i + 1];
    const d1 = p.clone().sub(a); const l1 = d1.length(); d1.divideScalar(l1);
    const d2 = c.clone().sub(p); const l2 = d2.length(); d2.divideScalar(l2);
    const turn = Math.acos(THREE.MathUtils.clamp(d1.dot(d2), -1, 1));
    if (turn < 1e-3) { path.push(p); continue; }
    const e = Math.min(bend * Math.tan(turn / 2), l1 * 0.49, l2 * 0.49);
    const A = p.clone().addScaledVector(d1, -e);
    const B = p.clone().addScaledVector(d2, e);
    const n = Math.max(3, Math.ceil(turn / 0.25));
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
  return g;
}

/** A flat ribbon along a path, lying across `side` at each point. */
function ribbonGeometry(points, side, widths) {
  const P = points.map(vec);
  const pos = [], uv = [], idx = [];
  let along = 0;
  const s = new THREE.Vector3();
  for (let i = 0; i < P.length; i++) {
    if (i > 0) along += P[i].distanceTo(P[i - 1]);
    const t = (i < P.length - 1 ? P[i + 1].clone().sub(P[i]) : P[i].clone().sub(P[i - 1])).normalize();
    const sd = typeof side === 'function' ? side(i) : side;
    s.copy(sd).addScaledVector(t, -sd.dot(t)).normalize();
    const w = (Array.isArray(widths) ? widths[i] : widths) / 2;
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

/** An annular sector extruded upward from y 0 to `th` (angles in the `polar` sense). */
function sectorSlab(r0, r1, a0, a1, th, step = 0.12) {
  const n = Math.max(3, Math.ceil(Math.abs(a1 - a0) / step));
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

/**
 * Box-profile sheeting: the trapezoidal corrugation every cheap shed in the
 * galaxy is clad in. Profile across x, sheet running along y, ribs standing
 * toward +z, both faces, one segment along its length — so a whole wall of
 * it costs a few hundred triangles and still throws a ribbed shadow.
 */
function sheetGeo(w, len, { pitch = 0.25, d = 0.03 } = {}) {
  const n = Math.max(1, Math.round(w / pitch));
  const p = w / n;
  const prof = [];
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + i * p;
    prof.push([x0, 0], [x0 + p * 0.3, 0], [x0 + p * 0.42, d], [x0 + p * 0.62, d], [x0 + p * 0.74, 0]);
  }
  prof.push([w / 2, 0]);
  const pos = [], nor = [], uv = [], idx = [];
  for (let k = 0; k < prof.length - 1; k++) {
    const [ax, az] = prof[k];
    const [bx, bz] = prof[k + 1];
    let nx = -(bz - az), nz = bx - ax;
    const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
    const base = pos.length / 3;
    for (const [x, z] of [[ax, az], [bx, bz]]) {
      for (const y of [-len / 2, len / 2]) {
        pos.push(x, y, z);
        nor.push(nx, 0, nz);
        uv.push(x + w / 2, y + len / 2);
      }
    }
    // a0 = base, a1 = base+1, b0 = base+2, b1 = base+3
    idx.push(base, base + 2, base + 1, base + 2, base + 3, base + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return twoSided(g);
}

/**
 * A strip swept through a list of frames: `section` is [[x, h], ...] across
 * each frame's X and N. The belt, which troughs over its idlers rather than
 * lying on them as a plank.
 */
function sectionStrip(section, frames) {
  const pos = [], uv = [], idx = [];
  const n = section.length;
  let along = 0;
  for (let k = 0; k < frames.length; k++) {
    const f = frames[k];
    if (k > 0) along += f.o.distanceTo(frames[k - 1].o);
    for (let j = 0; j < n; j++) {
      const [x, h] = section[j];
      pos.push(f.o.x + f.X.x * x + f.N.x * h, f.o.y + f.X.y * x + f.N.y * h, f.o.z + f.X.z * x + f.N.z * h);
      uv.push(j / (n - 1), along);
    }
    if (k > 0) {
      for (let j = 0; j < n - 1; j++) {
        const a = (k - 1) * n + j, b = k * n + j;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  for (let i = 1; i < uv.length; i += 2) uv[i] /= Math.max(along, 1e-6);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return twoSided(g);
}

/**
 * Push dents into a geometry: each dent moves every vertex within `r` of its
 * centre along `dir` by up to `depth`, smoothly. Applied to a segmented box,
 * both faces move together, so the plate keeps its thickness and simply
 * carries the knock it took.
 */
function dent(geo, dents) {
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    for (const d of dents) {
      const k = v.distanceTo(d.c) / d.r;
      if (k >= 1) continue;
      const f = (1 - k * k) * (1 - k * k);
      v.addScaledVector(d.dir, d.depth * f);
    }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Hex nuts / bolt heads at points, standing out along `normal`, in one geometry. */
function studsGeo(points, normal, size, seg = 6) {
  const base = new THREE.CylinderGeometry(size, size * 1.05, size * 0.8, seg);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, vec(normal).normalize());
  const m = new THREE.Matrix4();
  const one = new THREE.Vector3(1, 1, 1);
  const parts = points.map(pt => base.clone().applyMatrix4(m.compose(vec(pt), q, one)));
  base.dispose();
  return mergeParts(parts);
}

/** Snap-head rivets: four-sided domes, four triangles each, in one geometry. */
function rivetsGeo(points, normal, size) {
  const base = new THREE.ConeGeometry(size, size * 0.7, 4, 1, true).translate(0, size * 0.35, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, vec(normal).normalize());
  const m = new THREE.Matrix4();
  const one = new THREE.Vector3(1, 1, 1);
  const parts = points.map(pt => base.clone().applyMatrix4(m.compose(vec(pt), q, one)));
  base.dispose();
  return mergeParts(parts);
}

/* ==========================================================================
   SURFACES THE WORLD DOES NOT ALREADY HAVE
   ========================================================================== */

function hexRgb(hex) { return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255]; }

/** Open bar grating, drawn rather than cut: near-black slots between bearing bars. */
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
  const bar = hexRgb(0x6f685d), rust = hexRgb(0x70401f);
  for (let i = 0; i < S * S; i++) {
    const u = (i % S) / S, v = ((i / S) | 0) / S;
    const h = hf.data[i];
    const solid = h > 0.5 ? 1 : 0;
    const grime = fbm(u * 6, v * 6, { octaves: 4, period: 6, seed: seed + 7 });
    const rusty = Math.max(0, grime - 0.5) * 2.2;
    const k = solid ? 0.78 + h * 0.25 : 0.1;
    for (let c = 0; c < 3; c++) {
      img.data[i * 4 + c] = Math.min(255, (bar[c] * (1 - rusty) + rust[c] * rusty) * k);
    }
    img.data[i * 4 + 3] = 255;
    rough[i] = solid ? 0.64 + rusty * 0.3 : 1;
    metal[i] = solid ? 0.5 - rusty * 0.4 : 0;
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
 * Cast concrete with a basalt aggregate: darker than Tallow's, with the bug
 * holes and board seams of the shuttering it was poured in.
 */
function castConcrete(seed = 31) {
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
  const base = hexRgb(0x77726a);
  const rough = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const u = (i % S) / S, v = ((i / S) | 0) / S;
    const h = hf.data[i];
    const mott = fbm(u * 3, v * 3, { octaves: 4, period: 3, seed: seed + 11 });
    const stain = Math.max(0, fbm(u * 2, v * 5, { octaves: 3, period: 2, seed: seed + 5 }) - 0.55) * 1.4;
    const fleck = worley(u * 40, v * 40, 40, seed + 9).f1 < 0.08 ? 0.62 : 1;
    const k = (0.8 + mott * 0.3) * (0.55 + Math.min(1, h * 1.2) * 0.45) * (1 - stain * 0.35) * fleck;
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

function kitFor(world) {
  let kit = KITS.get(world);
  if (kit) return kit;
  const own = (...o) => world.own(...o);
  const dress = (mat, ns = 1.2) => {
    mat.normalScale.set(ns, ns);
    mat.aoMapIntensity = 0.85;
    own(mat, ...(mat.userData.surfaceMaps || []));
    return mat;
  };
  const plain = o => own(new THREE.MeshStandardMaterial(o));
  const K = {
    // Safety paint on ladders, rails and cleats, sun-bleached to ochre and
    // worn to the steel where hands and boots went.
    rail: dress(buildMaterial(platedMetal({
      paint: '#7a6440', metal: '#5b554b', rust: '#7a4526',
      panels: 1, rivets: false, seed: 131, weather: 0.92, size: texSize(128)
    }), { roughness: 1.0 }), 1.0),
    // Oxide primer: the drums and replacement sheets that were never top-coated.
    oxide: dress(buildMaterial(platedMetal({
      paint: '#5a3222', metal: '#56504a', rust: '#8a4a26',
      panels: 1, seed: 137, weather: 0.9, grain: 1.1, size: texSize(256)
    }), { roughness: 1.0 })),
    grate: dress(buildMaterial(barGrating(), { roughness: 1.0 }), 1.5),
    concrete: dress(buildMaterial(castConcrete(), { roughness: 1.0, metalness: 0.0 }), 1.1),
    glass: plain({ color: 0x121210, roughness: 0.2, metalness: 0.35 }),
    rubber: plain({ color: 0x221f1c, roughness: 0.95, metalness: 0 }),
    hole: plain({ color: 0x0e0c0b, roughness: 1, metalness: 0 }),
    ceramic: plain({ color: 0x5b4a3c, roughness: 0.34, metalness: 0 }),
    wire: plain({ color: 0x2c2825, roughness: 0.55, metalness: 0.7 }),
    soot: plain({ color: 0x1a1816, roughness: 1, metalness: 0.08 }),
    lens: plain({ color: 0x6a4424, roughness: 0.3, metalness: 0.1 }),
    cloth: plain({ color: 0x8f3a2b, roughness: 0.98, metalness: 0, side: THREE.DoubleSide }),
    tarp: plain({ color: 0x4a4636, roughness: 1, metalness: 0, side: THREE.DoubleSide })
  };
  K.concrete.userData.weather = { damp: 0.45, ash: 0.5 };
  const tile = new Map([
    [world.plateMat, 2.0], [world.darkSteelMat, 2.0], [world.drumMat, 2.4], [world.pipeMat, 3.0],
    [world.treadMat, 1.4], [K.rail, 1.6], [K.oxide, 2.4], [K.grate, 1.0], [K.concrete, 2.2]
  ]);
  const stain = own(new THREE.MeshStandardMaterial({
    color: 0x1f1812, transparent: true, opacity: 0.55, roughness: 0.5, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
  }));
  kit = { K, tile, stain, geos: new Map(), counts: new Map() };
  KITS.set(world, kit);
  return kit;
}

/* ==========================================================================
   THE RIG — a prop under construction
   ========================================================================== */

class Rig {
  constructor(world, name, seed = 1) {
    this.world = world;
    this.own = (...o) => world.own(...o);
    this.t4 = world.t4;
    this.M = {
      plate: world.plateMat, dark: world.darkSteelMat, drum: world.drumMat,
      pipe: world.pipeMat, tread: world.treadMat, belt: world.beltMat,
      timber: world.timberMat, basalt: world.basaltMat
    };
    this.kit = kitFor(world);
    this.K = this.kit.K;
    // Four conveyors of one design are still four conveyors: the build order
    // numbers each copy, and the number seeds what forty years did to it.
    const n = this.kit.counts.get(name) || 0;
    this.kit.counts.set(name, n + 1);
    this.index = n;
    this.rand = mulberry32((Math.imul(seed | 0, 2654435761) ^ (n * 0x9e3779b1) ^ 0x1a6a4) >>> 0);
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
    if (r) m.rotation.set(r[0], r[1], r[2], r[3] || 'XYZ');
    (parent || this.g).add(m);
    return m;
  }

  /** A one-off geometry, owned. */
  solo(parent, geo, mat, p = null, r = null) {
    this.own(geo);
    return this.mesh(parent, geo, mat, p, r);
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
      const back = this.mesh(parent, this.geo(`${key}|in`, () => flipped(geo)), mat, p, r);
      back.userData.uvs = m.userData.uvs;
    }
    return m;
  }

  /** A ring round +y at height `y`. */
  hoop(parent, R, y, tube, mat, seg = 32, radial = 4) {
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

  /** An open-ended rod (rungs, tension rods): no caps, fewer triangles. */
  rod(parent, a, b, r, mat, seg = 4) {
    const m = new THREE.Mesh(this.geo(`rod${r}|${seg}`, () => new THREE.CylinderGeometry(r, r, 1, seg, 1, true)), mat);
    const L = orient(m, vec(a), vec(b), UP);
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

  rail(parent, a, b, mat) {
    const m = new THREE.Mesh(this.geo('rail', railGeo), mat);
    orient(m, vec(a), vec(b), UP);
    (parent || this.g).add(m);
    return m;
  }

  /** Pipe along a path, bends filleted. */
  pipe(parent, points, r, mat, opts = {}) {
    const geo = this.own(sweepGeometry(points, r, opts));
    const m = this.mesh(parent, geo, mat);
    m.userData.uvs = [geo.userData.length, TAU * r];
    return m;
  }

  /** Nuts / bolt heads at points. */
  studs(parent, points, normal, size, mat = this.M.dark, seg = 6) {
    return this.solo(parent, studsGeo(points, normal, size, seg), mat);
  }

  /** A line of rivets from `a` to `b`. */
  rivets(parent, a, b, n, normal, mat = this.M.dark, size = 0.011) {
    if (!this.t4) return null;
    const A = vec(a), B = vec(b);
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(A.clone().lerp(B, n === 1 ? 0.5 : i / (n - 1)));
    return this.solo(parent, rivetsGeo(pts, normal, size), mat);
  }

  /** A slack cable on a real catenary. */
  cable(parent, from, to, { sag = 0.3, radius = 0.014, segments = 12, mat = this.K.wire } = {}) {
    const c = cableRun(from, to, mat, { sag, radius, segments });
    this.own(c.userData.ownGeometry);
    (parent || this.g).add(c);
    return c;
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

  /** A stencilled plate on a flat face, facing `rotY` (0 = +z). */
  plate(parent, text, p, rotY = 0, opts = {}) {
    const m = placard(text, opts);
    this.take(m, parent);
    m.position.copy(vec(p));
    m.rotation.y = rotY;
    return m;
  }

  /** A stencilled plate wrapped onto a cylinder of radius `r` round +y, centred on angle `a`. */
  curvedPlate(parent, text, r, y, a, { w = 0.3, h = 0.12, fg, bg } = {}) {
    const m = placard(text, { w, h, fg, bg });
    m.geometry.dispose();
    const tl = w / r;
    m.geometry = new THREE.CylinderGeometry(r + 0.004, r + 0.004, h, 8, 1, true, a - tl / 2, tl);
    m.userData.ownGeometry = m.geometry;
    this.take(m, parent);
    m.position.y = y;
    return m;
  }

  /** A lit face: its own material so it breathes on its own, never baked. */
  lamp(parent, geo, p, { color = 0x5c3a22, emissive = SODIUM, intensity = 1.25 } = {}) {
    const mat = this.own(new THREE.MeshStandardMaterial({
      color, emissive, emissiveIntensity: intensity, roughness: 0.5
    }));
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(vec(p));
    m.userData.noMerge = true;
    (parent || this.g).add(m);
    this.world.lamps.push(m);
    return m;
  }

  /** Where a pooled light comes from — never a PointLight of our own. */
  mark(parent, p, lamp) {
    const o = new THREE.Object3D();
    o.position.copy(vec(p));
    o.userData.lamp = lamp;
    (parent || this.g).add(o);
    this.world.lampMarks.push(o);
    return o;
  }

  /**
   * Handrail along a polyline [[x, z], ...] at deck height `y`: stanchions,
   * top rail at 1.07, knee rail at 0.53 and a toe plate.
   */
  handrail(parent, pts, y, { span = 1.6, h = 1.07, toe = true, mat = this.K.rail } = {}) {
    const P = pts.map(([x, z]) => new THREE.Vector3(x, y, z));
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
      const p = at(total * k / nPosts);
      this.strut(parent, p, p.clone().setY(y + h + 0.02), 0.022, mat, 6);
    }
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i];
      if (a.distanceTo(b) < 1e-3) continue;
      this.rod(parent, a.clone().setY(y + h), b.clone().setY(y + h), 0.021, mat, 6);
      this.rod(parent, a.clone().setY(y + 0.53), b.clone().setY(y + 0.53), 0.017, mat, 5);
      if (toe) this.bar(parent, a.clone().setY(y + 0.05), b.clone().setY(y + 0.05), 0.1, 0.008, mat, UP);
    }
  }

  /**
   * A fixed ladder, base at `base`, climbing +y, facing +z of a frame turned
   * by `a` (the structure it is bolted to is behind it, −z). `wallAt(y)` is
   * how far behind the ladder the structure is at height y, for the brackets.
   */
  ladder(parent, { base, a = 0, height, ext = 1.05, cageFrom = 2.4, cageTop = null, cage = true, wallAt = () => 0.2, mat = this.K.rail }) {
    const L = new THREE.Group();
    L.position.copy(vec(base));
    L.rotation.y = a;
    (parent || this.g).add(L);
    const top = height + ext;
    for (const x of [-0.23, 0.23]) {
      this.bar(L, [x, 0, 0], [x, top, 0], 0.014, 0.065, mat, XAXIS);
      for (let y = 1.4; y < height; y += 2.0) {
        this.bar(L, [x, y, 0], [x, y, -wallAt(y)], 0.06, 0.012, mat, UP);
      }
    }
    for (let y = 0.3; y <= height + 0.01; y += 0.3) this.rod(L, [-0.23, y, 0], [0.23, y, 0], 0.013, mat, 4);
    if (!cage || height < cageFrom + 0.5) return L;
    const hoopGeo = this.geo('ladderhoop', () => {
      const pts = [];
      for (let d = -40; d <= 220; d += 26) {
        const f = d * Math.PI / 180;
        pts.push([0.36 * Math.cos(f), 0, 0.33 + 0.36 * Math.sin(f)]);
      }
      return sweepGeometry(pts, 0.01, { radial: 3, bend: 0 });
    });
    const ct = cageTop ?? top;
    const n = Math.max(1, Math.ceil((ct - cageFrom) / 1.0));
    for (let k = 0; k <= n; k++) this.mesh(L, hoopGeo, mat, [0, cageFrom + (ct - cageFrom) * k / n, 0]);
    for (const d of [10, 60, 90, 120, 170]) {
      const f = d * Math.PI / 180;
      const x = 0.36 * Math.cos(f), z = 0.33 + 0.36 * Math.sin(f);
      this.bar(L, [x, cageFrom, z], [x, ct, z], 0.04, 0.008, mat, new THREE.Vector3(-Math.sin(f), 0, Math.cos(f)));
    }
    return L;
  }

  /** A gate valve on the +y axis of `parent` from y0, handwheel out along +x. */
  valve(parent, r, y0) {
    const M = this.M;
    const L = Math.max(0.26, r * 3.0);
    const rf = r * 1.6 + 0.03;
    for (const yy of [y0 + 0.012, y0 + L - 0.012]) this.cyl(parent, rf, rf, 0.024, 12, M.dark, [0, yy, 0]);
    this.cyl(parent, r * 1.25, r * 1.25, L - 0.05, 12, M.dark, [0, y0 + L / 2, 0]);
    const xb = r * 1.7;
    this.cyl(parent, r * 0.55, r * 0.8, xb + r * 2, 10, M.dark, [(xb + r * 2) / 2, y0 + L / 2, 0], [0, 0, -Math.PI / 2]);
    const xw = xb + r * 2 + 0.2;
    this.rod(parent, [xb, y0 + L / 2, 0], [xw + 0.05, y0 + L / 2, 0], 0.012, M.pipe, 5);
    const rw = 0.1 + r * 1.1;
    this.mesh(parent, this.geo(`wheel${rw}`, () => new THREE.TorusGeometry(rw, 0.014, 5, 18)), M.dark,
      [xw, y0 + L / 2, 0], [0, Math.PI / 2, 0]);
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * TAU + 0.3;
      this.rod(parent, [xw, y0 + L / 2, 0], [xw, y0 + L / 2 + Math.sin(a) * rw, Math.cos(a) * rw], 0.009, M.dark, 4);
    }
    return y0 + L;
  }

  /** A bolted flange pair across +y at `y`. */
  flange(parent, r, y, { n = 8, mat = this.M.dark } = {}) {
    const rf = r * 1.3 + 0.03;
    this.cyl(parent, rf, rf, 0.025, 20, mat, [0, y - 0.0125, 0]);
    this.cyl(parent, rf, rf, 0.025, 20, mat, [0, y + 0.0135, 0]);
    if (!this.t4) return;
    const rb = (r + rf) / 2 + 0.004;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) / n * TAU;
      pts.push([Math.sin(a) * rb, y + 0.034, Math.cos(a) * rb]);
    }
    this.studs(parent, pts, UP, Math.max(0.012, r * 0.05), this.M.dark);
  }

  /**
   * Lay textures in metres and cast shadows. Every part's UVs are re-mapped
   * so a tile is the same size on a bolt head and a twenty-metre chord —
   * cylinders round their own circumference, everything else by projection
   * onto whichever face of the prop's box it looks toward.
   */
  finish() {
    const g = this.g;
    g.updateMatrixWorld(true);
    const nm = new THREE.Matrix3();
    const p = new THREE.Vector3(), n = new THREE.Vector3();
    const rand = mulberry32(0x7a11 + this.index);
    const guarded = o => { for (let q = o; q && q !== g; q = q.parent) if (q.userData.noMerge) return true; return false; };
    g.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh) return;
      const mat = o.material;
      if (Array.isArray(mat)) return;
      if (mat.transparent) { o.receiveShadow = this.t4; return; }
      if (guarded(o)) return;
      o.castShadow = o.receiveShadow = this.t4;
      if (!mat.map) return;
      const T = this.kit.tile.get(mat);
      if (!T) return;
      const su = T * mat.map.repeat.x, sv = T * mat.map.repeat.y;
      const uv0 = o.geometry.attributes.uv;
      if (!uv0) return;
      const geo = o.geometry.clone();
      const uv = geo.attributes.uv;
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
  }
}

/* ==========================================================================
   THE CONVEYOR
   ========================================================================== */

/**
 * A belt conveyor climbing out of the cut.
 *
 * Built so that the TAIL is down in the pit and the HEAD is up on the flat,
 * because that is the direction stone travels: the loader fills the hopper on
 * the quarry floor and the head discharges onto the spoil outside. Placed
 * with `rotY: -PI/2` in the JSON, which swings local +z (the head) to world
 * -x, away from the excavation.
 *
 * The belt runs inside an open-topped Warren truss: channel chords, angle
 * lacing, plan bracing under it. Three braced H-section bents on concrete
 * piers carry it at exactly the feet `supportPoints` collides. A cleated
 * walkway with a handrail and a pull-wire runs up the +x side from a short
 * stair on the floor to a platform at the head, where the drive stands on a
 * stool beside a hooded pulley.
 */
export function buildConveyor(world, walk = null) {
  const R = new Rig(world, 'conveyor', 0x51c0);
  const { g, M, K } = R;
  const t4 = R.t4;

  const LEN = 22;          // along local z
  // The tail stand sits on the quarry floor, wherever the floor actually is.
  const TAIL_Y = (walk ? walk(0, -LEN / 2) : -5.0) - 0.1;
  const FLOOR = TAIL_Y + 0.1;
  const HEAD_Y = 6.2;      // clear of the lip, over the spoil
  // The belt leaves the tail pulley at working height on its stand, not
  // flush with the rock it is standing on.
  const BELT0 = TAIL_Y + 0.95;
  const rise = HEAD_Y - BELT0;
  const pitch = Math.atan2(rise, LEN);
  const span = Math.hypot(LEN, rise);
  const sp = Math.sin(pitch), cp = Math.cos(pitch);

  // The belt's own frame: D up the belt, N square to it, X across it.
  const D = new THREE.Vector3(0, sp, cp);
  const N = new THREE.Vector3(0, cp, -sp);
  const B0 = new THREE.Vector3(0, BELT0, -LEN / 2);
  const P = (x, h, s) => B0.clone().addScaledVector(D, s).addScaledVector(N, h).setX(x);
  // Where a line at height `h` in the belt frame passes over local z.
  const atZ = (h, z) => {
    const s = (z + LEN / 2 + h * sp) / cp;
    return { s, y: BELT0 + s * sp + h * cp };
  };

  const S0 = 1.6;              // where the truss starts, off the tail stand
  const S1 = span - 0.75;      // where it ends, into the head frame
  const HT = 0.32;             // top chord
  const HB = -0.78;            // bottom chord
  const XT = 0.62;             // truss sides

  /* THE TRUSS. Two Warren side frames with no top bracing — the belt runs
     inside it — and plan bracing between the bottom chords. */
  const nP = Math.max(4, Math.round((S1 - S0) / 1.55));
  const node = i => S0 + (S1 - S0) * i / nP;
  for (const sx of [-1, 1]) {
    const x = sx * XT;
    R.channel(g, P(x, HT, S0), P(x, HT, S1), 0.13, 0.05, M.dark, N);
    R.channel(g, P(x, HB, S0), P(x, HB, S1), 0.13, 0.05, M.dark, N);
    for (let i = 0; i <= nP; i++) {
      R.angle(g, P(x, HB, node(i)), P(x, HT, node(i)), 0.065, M.dark, D);
      if (i < nP) {
        const [a, b] = i % 2 ? [HT, HB] : [HB, HT];
        R.angle(g, P(x, a, node(i)), P(x, b, node(i + 1)), 0.06, M.dark, N);
      }
    }
  }
  for (let i = 0; i <= nP; i++) {
    R.angle(g, P(-XT, HB, node(i)), P(XT, HB, node(i)), 0.065, M.dark, N);
    if (i < nP) R.angle(g, P(i % 2 ? -XT : XT, HB, node(i)), P(i % 2 ? XT : -XT, HB, node(i + 1)), 0.05, M.dark, N);
  }
  // The cable tray the head drive is fed by, along the -x side.
  // (In lengths, bay by bay: a member twenty metres long on a slope is
  // measured by the box round it, and that box would reach the ground.)
  for (let i = 0; i < nP; i++) {
    R.channel(g, P(-XT - 0.13, -0.3, node(i)), P(-XT - 0.13, -0.3, node(i + 1)), 0.16, 0.05, M.dark, XAXIS.clone().negate());
    R.strut(g, P(-XT - 0.13, -0.26, node(i)), P(-XT - 0.13, -0.26, node(i + 1)), 0.022, K.rubber, 6);
  }

  /* THE IDLERS. Troughing sets on a channel base: a flat centre roll and two
     wing rolls canted up thirty degrees, which is what gives the belt its U;
     flat return rolls under it every third bay. */
  const idlers = Math.max(6, Math.round((S1 - S0 + 1.4) / 1.8));
  const c30 = Math.cos(Math.PI / 6), s30 = Math.sin(Math.PI / 6);
  for (let i = 0; i <= idlers; i++) {
    const s = 0.9 + (S1 - 0.2 - 0.9) * i / idlers;
    R.channel(g, P(-XT, -0.17, s), P(XT, -0.17, s), 0.1, 0.04, M.dark, N);
    R.rod(g, P(-0.19, -0.064, s), P(0.19, -0.064, s), 0.062, M.pipe, 7);
    for (const sx of [-1, 1]) {
      const a = P(sx * 0.21, -0.05, s);
      const b = a.clone().addScaledVector(XAXIS, sx * 0.38 * c30).addScaledVector(N, 0.38 * s30);
      R.rod(g, a, b, 0.062, M.pipe, 7);
      R.bar(g, P(sx * 0.2, -0.13, s), P(sx * 0.2, -0.06, s), 0.05, 0.012, M.dark, D);
      R.bar(g, P(sx * 0.58, -0.13, s), b.clone().addScaledVector(XAXIS, sx * 0.02), 0.05, 0.012, M.dark, D);
    }
    if (i % 3 === 1) {
      R.rod(g, P(-0.55, -0.66, s), P(0.55, -0.66, s), 0.055, M.pipe, 7);
      for (const sx of [-1, 1]) R.bar(g, P(sx * 0.58, HB, s), P(sx * 0.58, -0.64, s), 0.05, 0.012, M.dark, D);
    }
  }

  /* THE BELT. It troughs over the idlers, wraps the pulleys, and returns
     slack underneath. A belt is three millimetres of rubber: drawn as a
     sheet, never a slab. */
  const BELT = [[-0.6, 0.25], [-0.19, 0.004], [0.19, 0.004], [0.6, 0.25]];
  const frames = [];
  const nb = 12;
  for (let k = 0; k <= nb; k++) {
    const s = 0.25 + (span - 0.25) * k / nb;
    frames.push({ o: P(0, 0, s), X: XAXIS, N });
  }
  // Flattened at both ends where it meets the pulleys.
  const beltTop = sectionStrip([[-0.55, 0.004], [0.55, 0.004]], [frames[0], { o: P(0, 0, 0.9), X: XAXIS, N }]);
  R.solo(g, beltTop, M.belt);
  R.solo(g, sectionStrip(BELT, [{ o: P(0, 0, 0.9), X: XAXIS, N }, ...frames.filter(f => f.o.distanceTo(B0) > 1.0)
    .slice(0, -1), { o: P(0, 0, span - 0.5), X: XAXIS, N }]), M.belt);
  R.solo(g, sectionStrip([[-0.55, 0.004], [0.55, 0.004]], [{ o: P(0, 0, span - 0.5), X: XAXIS, N }, { o: P(0, 0, span), X: XAXIS, N }]), M.belt);
  const ret = [];
  for (let k = 0; k <= 10; k++) {
    const s = 0.25 + (span - 0.25) * k / 10;
    const sag = Math.sin((k % 2 ? 1 : 0) * Math.PI) * 0 + (k % 2 ? 0.04 : 0);
    ret.push({ o: P(0, -0.6 - sag, s), X: XAXIS, N });
  }
  R.solo(g, sectionStrip([[-0.55, 0], [0.55, 0]], ret), M.belt);

  /* THE TAIL. A pulley on a screw take-up, a stand on the floor, skirtboards
     and the receiving hopper the loader tips into. */
  const tailC = P(0, -0.3, 0.25);
  R.strut(g, tailC.clone().setX(-0.56), tailC.clone().setX(0.56), 0.27, M.pipe, 16, UP);
  R.mesh(g, R.geo('beltwrapT', () => twoSided(new THREE.CylinderGeometry(0.285, 0.285, 1.1, 14, 1, true, Math.PI * 0.5, Math.PI))),
    M.belt, tailC, [0, 0, Math.PI / 2]);
  for (const sx of [-1, 1]) {
    R.channel(g, P(sx * 0.7, -0.3, -0.15), P(sx * 0.7, -0.3, 1.2), 0.12, 0.05, M.dark, N);
    R.box(g, 0.14, 0.16, 0.24, M.dark, tailC.clone().setX(sx * 0.7), [-pitch, 0, 0]);
    R.rod(g, tailC.clone().setX(sx * 0.7).addScaledVector(D, 0.12), P(sx * 0.7, -0.3, 1.1), 0.014, M.pipe, 5);
    R.box(g, 0.14, 0.12, 0.03, M.dark, P(sx * 0.7, -0.3, 1.12), [-pitch, 0, 0]);
    R.channel(g, P(sx * 0.66, -0.2, -0.1), P(sx * 0.66, -0.2, S0 + 0.6), 0.14, 0.05, M.dark, N);
    for (const s of [0.3, 1.35]) {
      const top = P(sx * 0.66, -0.27, s);
      R.ibeam(g, [sx * 0.66, FLOOR + 0.02, top.z], top.clone().setY(top.y - 0.02), 0.14, 0.12, M.dark, ZAXIS);
      R.box(g, 0.3, 0.02, 0.3, M.dark, [sx * 0.66, FLOOR + 0.01, top.z]);
    }
    // Skirtboards, with the rubber seal along the belt.
    R.bar(g, P(sx * 0.31, 0.2, 0.45), P(sx * 0.31, 0.2, 2.5), 0.34, 0.014, M.plate, N);
    R.bar(g, P(sx * 0.3, 0.04, 0.45), P(sx * 0.3, 0.04, 2.5), 0.06, 0.02, K.rubber, N);
    for (const s of [0.8, 1.6, 2.4]) R.bar(g, P(sx * 0.33, 0.2, s), P(sx * 0.62, -0.18, s), 0.06, 0.012, M.dark, D);
  }
  for (const s of [0.3, 1.35]) {
    const y = P(0, -0.27, s);
    R.angle(g, [-0.66, FLOOR + 0.12, y.z], [0.66, y.y - 0.1, y.z], 0.05, M.dark, ZAXIS);
  }
  // The receiving hopper: a square frustum, both faces, with its rim angle.
  {
    const c = P(0, 0.42, 1.25);
    const hop = new THREE.Group();
    hop.position.copy(c).setY(c.y + 0.42);
    g.add(hop);
    R.cyl(hop, 0.98, 0.43, 0.84, 4, M.plate, null, [0, Math.PI / 4, 0], { open: true, inner: true });
    for (const [x, z, ry] of [[0, 0.69, 0], [0, -0.69, 0], [0.69, 0, Math.PI / 2], [-0.69, 0, Math.PI / 2]]) {
      R.box(hop, 1.42, 0.05, 0.05, M.dark, [x, 0.43, z], [0, ry, 0]);
    }
    for (const [x, z] of [[0.52, 0.52], [-0.52, 0.52], [0.52, -0.52], [-0.52, -0.52]]) {
      R.angle(hop, [x, 0.4, z], [x * 0.5, 0.0, z * 0.5], 0.05, M.dark, UP);
    }
  }

  /* THE WALKWAY. Grating on cantilever brackets off the bottom chord, cleats
     across it every half metre because it is a twenty-five degree slope,
     stanchions with top rail, knee rail and toe plate, and the pull-wire
     that stops the belt, sagging between the posts at hand height. */
  const XW0 = XT + 0.05, XW1 = 1.36, HW = HB + 0.04;
  const W0 = S0 + 0.3;
  const W1 = span - 2.5;
  {
    const cuts = [W0];
    for (let i = 0; i <= nP; i++) if (node(i) > W0 + 0.3 && node(i) < W1 - 0.3) cuts.push(node(i));
    cuts.push(W1);
    for (let i = 0; i < cuts.length - 1; i++) {
      R.bar(g, P((XW0 + XW1) / 2, HW, cuts[i] + 0.004), P((XW0 + XW1) / 2, HW, cuts[i + 1] - 0.004), XW1 - XW0, 0.03, K.grate, XAXIS);
    }
  }
  if (t4) {
    for (let s = W0 + 0.25; s < W1; s += 0.5) {
      R.bar(g, P(XW0 + 0.02, HW + 0.03, s), P(XW1 - 0.02, HW + 0.03, s), 0.03, 0.03, K.rail, N);
    }
  }
  for (let i = 0; i <= nP; i++) {
    const s = node(i);
    if (s < W0 - 0.1 || s > W1 + 0.1) continue;
    R.angle(g, P(XT, HB - 0.02, s), P(XW1 + 0.02, HB - 0.02, s), 0.07, M.dark, N);
    R.box(g, 0.012, 0.24, 0.24, M.dark, P(XT + 0.1, HB - 0.12, s), [-pitch, 0, 0]);
  }
  const postS = [];
  for (let s = W0; s <= W1 + 0.01; s += (W1 - W0) / Math.ceil((W1 - W0) / 1.8)) postS.push(s);
  const railTop = [], wire = [];
  postS.forEach((s, k) => {
    const foot = P(XW1 - 0.03, HW + 0.02, s);
    R.strut(g, foot, foot.clone().setY(foot.y + 1.07), 0.022, K.rail, 6);
    railTop.push(foot);
    if (t4) {
      wire.push(foot.clone().setY(foot.y + 0.82).setX(XW1 - 0.06));
      if (k < postS.length - 1) {
        const mid = P(XW1 - 0.06, HW + 0.02, (s + postS[k + 1]) / 2);
        wire.push(mid.setY(mid.y + 0.74));
      }
    }
  });
  for (let k = 0; k < railTop.length - 1; k++) {
    const a0 = railTop[k], a1 = railTop[k + 1];
    R.rod(g, a0.clone().setY(a0.y + 1.07), a1.clone().setY(a1.y + 1.07), 0.021, K.rail, 6);
    R.rod(g, a0.clone().setY(a0.y + 0.53), a1.clone().setY(a1.y + 0.53), 0.017, K.rail, 5);
    R.bar(g, P(XW1, HW + 0.07, postS[k]), P(XW1, HW + 0.07, postS[k + 1]), 0.1, 0.008, K.rail, N);
    if (t4 && wire.length > 2) R.pipe(g, wire.slice(k * 2, k * 2 + 3), 0.006, K.wire, { radial: 3, bend: 0 });
  }

  // A short stair from the floor up onto the foot of the walkway.
  {
    const top = P((XW0 + XW1) / 2, HW, W0);
    const foot = new THREE.Vector3(top.x, FLOOR + 0.02, top.z - Math.max(0.6, (top.y - FLOOR) * 0.9));
    for (const sx of [XW0 + 0.1, XW1]) {
      R.channel(g, [sx, foot.y + 0.08, foot.z], [sx, top.y, top.z], 0.14, 0.05, M.dark, UP);
    }
    const steps = Math.max(2, Math.round((top.y - foot.y) / 0.22));
    for (let k = 1; k < steps; k++) {
      const q = foot.clone().lerp(top, k / steps);
      R.box(g, XW1 - XW0 - 0.14, 0.03, 0.22, K.grate, [top.x + 0.05, q.y, q.z]);
    }
    for (const sx of [XW1]) {
      R.strut(g, [sx, foot.y, foot.z], [sx, foot.y + 1.0, foot.z], 0.022, K.rail, 6);
      R.strut(g, [sx, foot.y + 1.0, foot.z], [sx, top.y + 1.07, top.z], 0.021, K.rail, 6);
    }
  }

  /* THE BENTS. Three, at the same local coordinates `supportPoints`
     collides — one implementation of where the feet are, in two places that
     must agree. Each is a pair of H-section columns on base plates on
     concrete piers, a cap beam under the chords, and cross-bracing in every
     bay tall enough to need it. */
  const capOf = new Map();
  for (const lz of [-LEN * 0.38, 0, LEN * 0.38]) {
    const chord = atZ(HB - 0.07, lz);
    const topY = chord.y;
    // Founded on the ground actually under this trestle — the quarry floor or
    // the flat. Guessed from which end of the belt it was, the middle leg
    // stood on the flat's height in mid-air over the cut.
    const footY = (walk ? walk(0, lz) : (lz < -LEN * 0.1 ? TAIL_Y : 0)) - 0.1;
    const h = topY - footY;
    if (h <= 0.4) continue;
    const capY = topY - 0.1;
    const head = lz > 0;
    capOf.set(lz, capY);
    R.ibeam(g, [-0.86, capY, lz], [head ? 1.5 : 0.86, capY, lz], 0.2, 0.15, M.dark, UP);
    const pierTop = footY + 0.3;
    const colTop = capY - 0.1;
    for (const lx of [-0.7, 0.7]) {
      R.box(g, 0.46, 0.5, 0.46, K.concrete, [lx, footY + 0.05, lz]);
      R.box(g, 0.38, 0.025, 0.38, M.dark, [lx, pierTop + 0.0125, lz]);
      if (t4) R.studs(g, [[lx - 0.14, pierTop + 0.035, lz - 0.14], [lx + 0.14, pierTop + 0.035, lz - 0.14],
        [lx - 0.14, pierTop + 0.035, lz + 0.14], [lx + 0.14, pierTop + 0.035, lz + 0.14]], UP, 0.025);
      R.ibeam(g, [lx, pierTop + 0.025, lz], [lx * 0.94, colTop, lz], 0.2, 0.16, M.dark, ZAXIS);
      // Gussets where the column meets the cap.
      R.box(g, 0.012, 0.2, 0.18, M.dark, [lx * 0.94 - Math.sign(lx) * 0.16, colTop - 0.08, lz]);
    }
    const colH = colTop - pierTop;
    if (colH > 1.4) {
      const bays = Math.max(1, Math.round(colH / 2.3));
      const lv = k => pierTop + 0.35 + (colTop - pierTop - 0.45) * k / bays;
      for (let k = 0; k < bays; k++) {
        const y0 = lv(k), y1 = lv(k + 1);
        if (k > 0) R.angle(g, [-0.64, y0, lz], [0.64, y0, lz], 0.07, M.dark, ZAXIS);
        R.rod(g, [-0.62, y0, lz + 0.02], [0.62, y1, lz + 0.02], 0.016, M.dark, 5);
        R.rod(g, [0.62, y0, lz - 0.02], [-0.62, y1, lz - 0.02], 0.016, M.dark, 5);
      }
    }
  }

  /* THE HEAD. Pulley under a hood, on plummer blocks on the head frame; the
     drive on a stool on a railed platform off the last bent; the discharge
     chute below. */
  const headC = P(0, -0.34, span);
  R.strut(g, headC.clone().setX(-0.56), headC.clone().setX(0.56), 0.32, M.pipe, 18, UP);
  R.mesh(g, R.geo('beltwrapH', () => twoSided(new THREE.CylinderGeometry(0.335, 0.335, 1.1, 14, 1, true, -Math.PI * 0.5, Math.PI))),
    M.belt, headC, [0, 0, Math.PI / 2]);
  {
    const hood = new THREE.Group();
    hood.position.copy(headC);
    g.add(hood);
    R.cyl(hood, 0.56, 0.56, 1.28, 14, M.plate, null, [0, 0, -Math.PI / 2], { open: true, t0: Math.PI * 0.95, tl: Math.PI * 1.25, inner: true });
    for (const sx of [-1, 1]) {
      R.box(hood, 0.02, 0.9, 1.2, M.dark, [sx * 0.64, -0.12, -0.2]);
      R.box(hood, 0.2, 0.16, 0.3, M.dark, [sx * 0.74, 0, 0]);
      R.cyl(hood, 0.09, 0.09, 0.2, 10, M.dark, [sx * 0.76, 0.1, 0], [0, 0, Math.PI / 2]);
    }
    // The discharge chute, liner bolted, pointing down at the spoil.
    const chute = new THREE.Group();
    chute.position.set(0, -0.62, 0.52);
    chute.rotation.x = 0.18;
    hood.add(chute);
    R.box(chute, 1.08, 0.72, 0.03, M.plate, [0, 0, 0.28]);
    R.box(chute, 1.08, 0.72, 0.03, M.plate, [0, 0, -0.28]);
    for (const sx of [-1, 1]) R.box(chute, 0.03, 0.72, 0.56, M.plate, [sx * 0.54, 0, 0]);
    R.box(chute, 1.02, 0.02, 0.52, K.hole, [0, -0.2, 0]);
    for (const y of [-0.36, 0.36]) R.box(chute, 1.14, 0.05, 0.62, M.dark, [0, y, 0]);
    R.rivets(chute, [-0.44, 0.2, 0.3], [0.44, 0.2, 0.3], 6, ZAXIS, M.dark, 0.016);
    R.rivets(chute, [-0.44, -0.2, 0.3], [0.44, -0.2, 0.3], 6, ZAXIS, M.dark, 0.016);
    R.plate(chute, `CV-0${R.index + 1}`, [0, 0.02, 0.297], 0, { w: 0.38, h: 0.14 });
  }

  // The head platform, level, carried on stringers off the last bent's cap.
  const capH = capOf.get(LEN * 0.38);
  const platY = P(0, HW, W1).y;
  const pz0 = P(1, HW, W1).z, pz1 = LEN / 2 + 0.55;
  const px0 = XT + 0.05, px1 = 1.46;
  R.box(g, px1 - px0, 0.035, pz1 - pz0, K.grate, [(px0 + px1) / 2, platY - 0.018, (pz0 + pz1) / 2]);
  for (const sx of [px0 + 0.05, px1 - 0.05]) {
    R.channel(g, [sx, platY - 0.11, LEN * 0.38 - 0.2], [sx, platY - 0.11, pz1], 0.16, 0.05, M.dark, UP);
    if (capH != null) {
      R.ibeam(g, [sx, capH + 0.1, LEN * 0.38], [sx, platY - 0.19, LEN * 0.38], 0.12, 0.1, M.dark, ZAXIS);
      R.angle(g, [0.68, capH - 1.1, LEN * 0.38 + 0.12], [sx, platY - 0.2, pz1 - 0.3], 0.07, M.dark, XAXIS);
    }
  }
  R.handrail(g, [[px1 - 0.03, pz0], [px1 - 0.03, pz1 - 0.03], [px0 + 0.05, pz1 - 0.03]], platY, { span: 1.4 });
  // The drive: gearbox and motor on a stool, a guarded coupling to the shaft.
  {
    const shaftY = headC.y, shaftZ = headC.z;
    const stoolTop = shaftY - 0.34;
    const sxs = [0.84, 1.36], szs = [shaftZ - 0.9, shaftZ + 0.25];
    for (const x of sxs) for (const z of szs) R.angle(g, [x, platY, z], [x, stoolTop, z], 0.06, M.dark, UP);
    R.box(g, 0.62, 0.03, szs[1] - szs[0] + 0.1, M.dark, [1.1, stoolTop + 0.015, (szs[0] + szs[1]) / 2]);
    R.box(g, 0.46, 0.52, 0.5, M.dark, [1.1, stoolTop + 0.29, shaftZ]);
    R.box(g, 0.5, 0.04, 0.54, M.dark, [1.1, stoolTop + 0.37, shaftZ]);
    R.strut(g, [0.58, shaftY, shaftZ], [0.87, shaftY, shaftZ], 0.05, M.pipe, 10, UP);
    R.cyl(g, 0.11, 0.11, 0.16, 10, M.plate, [0.8, shaftY, shaftZ], [0, 0, Math.PI / 2]);
    const mz = shaftZ - 0.6;
    R.strut(g, [1.1, stoolTop + 0.24, mz - 0.36], [1.1, stoolTop + 0.24, mz + 0.3], 0.22, M.plate, 14, UP);
    for (let k = 0; k < 3; k++) R.hoop(g, 0.235, 0, 0.012, M.plate, 16, 3).position.set(1.1, stoolTop + 0.24, mz - 0.2 + k * 0.16);
    g.children.slice(-3).forEach(o => { o.rotation.set(0, 0, 0); });
    R.cyl(g, 0.2, 0.2, 0.16, 12, M.dark, [1.1, stoolTop + 0.24, mz - 0.44], [Math.PI / 2, 0, 0]);
    R.box(g, 0.18, 0.12, 0.2, M.dark, [1.1, stoolTop + 0.5, mz]);
    R.pipe(g, [[1.1, stoolTop + 0.56, mz - 0.05], [1.1, stoolTop + 0.62, mz - 0.5], [0.95, platY + 0.2, pz0 + 0.2],
      [-XT - 0.13, platY - 0.3, pz0 - 0.5]], 0.02, K.rubber, { radial: 5, bend: 0.25 });
  }

  /* THE LOAD. Stone riding up the belt, lying in the trough. Instanced, and
     kept to the flat of the trough so it reads as a load rather than as
     gravel glued to a plank. */
  const rand = mulberry32(0x51c0);
  const load = [];
  const n = world.t4 ? 52 : 28;
  for (let i = 0; i < n; i++) {
    const s = 1.4 + (span - 2.4) * rand();
    const x = (rand() - 0.5) * 0.5;
    const r = 0.06 + rand() * 0.09;
    const lift = Math.max(0, Math.abs(x) - 0.19) * 0.6;
    const p = P(x, 0.01 + lift + r * 0.5, s);
    load.push({ p, r, h: 0.1 + rand() * 0.14, rx: rand() * Math.PI, ry: rand() * Math.PI, rz: rand() * Math.PI });
  }
  const loadMesh = new THREE.InstancedMesh(world.hexGeo, world.basaltMat, load.length);
  {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const scl = new THREE.Vector3();
    load.forEach((c, i) => {
      e.set(c.rx, c.ry, c.rz);
      q.setFromEuler(e);
      scl.set(c.r * 2, c.h, c.r * 2);
      m.compose(c.p, q, scl);
      loadMesh.setMatrixAt(i, m);
    });
  }
  loadMesh.instanceMatrix.needsUpdate = true;
  loadMesh.castShadow = world.t4;
  loadMesh.frustumCulled = false;
  loadMesh.userData.noMerge = true;
  recordInstanceBoxes(loadMesh);
  g.add(loadMesh);

  // What spilled at the tail, where the loader missed the hopper.
  const spill = world.buildRubbleField({
    count: t4 ? 9 : 4, minX: -0.5, maxX: 0.5, minZ: -LEN / 2 - 0.2, maxZ: -LEN / 2 + 1.6,
    y: walk ? -0.02 : FLOOR - 0.02, seed: 0x5e1 + R.index * 7, scale: 0.34, ground: walk
  });
  spill.userData.noMerge = true;
  g.add(spill);

  return R.finish();
}

/* ==========================================================================
   THE ORE SKIP
   ========================================================================== */

/**
 * A V-skip on a length of raised track. Three of them stand north of the
 * cut, each on its own spur with a buffer stop at the end — which is why
 * each carries its own section of track.
 *
 * The skip is a riveted V body rocking on trunnions in two cradles, over an
 * underframe of channel sole bars with axleboxes, flanged wheels, a centre
 * buffer and a link-and-pin coupler. It is tipped a few degrees because it
 * was emptied and never righted.
 */
export function buildOreCart(world, sx = 0) {
  const R = new Rig(world, 'ore-cart', 0x2c17 ^ Math.round(sx * 97));
  const { g, M, K } = R;
  const t4 = R.t4;
  const rand = mulberry32((0x2c17 ^ Math.round(sx * 97)) >>> 0);

  /* THE TRACK. Concrete footings, H-section posts under cap beams, two
     stringers, timber sleepers, flat-bottomed rail on tie plates. */
  const RAIL_Y = 1.15;
  const HALF = 3.3;
  for (const pz of [-2.2, 0, 2.2]) {
    R.box(g, 1.4, 0.45, 0.46, K.concrete, [0, 0.0, pz]);
    for (const px of [-0.55, 0.55]) {
      R.box(g, 0.3, 0.02, 0.3, M.dark, [px, 0.235, pz]);
      R.ibeam(g, [px, 0.245, pz], [px, 0.55, pz], 0.16, 0.14, M.dark, ZAXIS);
    }
    R.ibeam(g, [-0.72, 0.63, pz], [0.72, 0.63, pz], 0.16, 0.12, M.dark, UP);
  }
  for (const x of [-0.46, 0.46]) {
    R.ibeam(g, [x, 0.83, -HALF], [x, 0.83, HALF], 0.24, 0.14, M.dark, UP);
    R.rail(g, [x, RAIL_Y - 0.06, -HALF], [x, RAIL_Y - 0.06, HALF], M.pipe);
  }
  for (let z = -HALF + 0.25; z < HALF; z += 0.55) {
    const kick = (rand() - 0.5) * 0.06;
    R.box(g, 1.45, 0.1, 0.2, M.timber, [kick, 1.0, z], [0, (rand() - 0.5) * 0.05, 0]);
    if (t4) for (const x of [-0.46, 0.46]) R.box(g, 0.2, 0.012, 0.16, M.dark, [x, 1.056, z]);
  }
  // A rail joint: fishplates both sides, four bolts through them.
  for (const x of [-0.46, 0.46]) {
    for (const e of [-1, 1]) R.box(g, 0.012, 0.06, 0.46, M.dark, [x + e * 0.016, RAIL_Y - 0.06, 0.55]);
    if (t4) R.studs(g, [-0.15, -0.05, 0.05, 0.15].map(dz => [x + 0.025, RAIL_Y - 0.06, 0.55 + dz]), XAXIS, 0.013);
  }
  // Buffer stop at the far end, a scotch block at the near one.
  for (const x of [-0.46, 0.46]) {
    R.channel(g, [x, RAIL_Y, HALF - 0.15], [x, RAIL_Y + 0.62, HALF - 0.15], 0.12, 0.05, M.dark, XAXIS);
    R.angle(g, [x, RAIL_Y, HALF - 1.05], [x, RAIL_Y + 0.5, HALF - 0.2], 0.07, M.dark, XAXIS);
    R.box(g, 0.1, 0.1, 0.22, M.dark, [x, RAIL_Y + 0.05, -HALF + 0.35]);
  }
  R.box(g, 1.2, 0.26, 0.2, M.timber, [0, RAIL_Y + 0.46, HALF - 0.3]);
  for (const x of [-0.56, 0.56]) R.box(g, 0.08, 0.3, 0.22, M.dark, [x, RAIL_Y + 0.46, HALF - 0.3]);
  R.plate(g, 'STOP', [0, RAIL_Y + 0.46, HALF - 0.4 - 0.002], Math.PI, { w: 0.34, h: 0.14, bg: '#a88f52' });

  /* THE UNDERFRAME. */
  const WR = 0.2;
  const wy = RAIL_Y + WR;
  const wheelGeo = R.geo('skipwheel', () => {
    const pts = [[0.05, -0.05], [0.17, -0.05], [WR, -0.042], [WR, 0.035], [0.232, 0.042], [0.232, 0.055], [0.17, 0.058], [0.05, 0.058]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 12);
  });
  for (const wz of [-0.42, 0.42]) {
    for (const wx of [-0.46, 0.46]) {
      const w = R.mesh(g, wheelGeo, M.dark, [wx, wy, wz], [0, 0, wx > 0 ? Math.PI / 2 : -Math.PI / 2]);
      w.userData.uvs = [TAU * WR, 0.3];
      R.cyl(g, 0.055, 0.055, 0.12, 8, M.pipe, [wx - Math.sign(wx) * 0.03, wy, wz], [0, 0, Math.PI / 2]);
    }
    R.strut(g, [-0.5, wy, wz], [0.5, wy, wz], 0.04, M.pipe, 8, UP);
    for (const x of [-0.34, 0.34]) R.box(g, 0.13, 0.16, 0.18, M.dark, [x, wy + 0.03, wz]);
  }
  const SOLE = wy + 0.13;
  for (const x of [-0.34, 0.34]) R.channel(g, [x, SOLE, -0.84], [x, SOLE, 0.84], 0.16, 0.05, M.dark, UP);
  for (const z of [-0.84, 0.84]) {
    R.channel(g, [-0.46, SOLE, z], [0.46, SOLE, z], 0.18, 0.05, M.dark, UP);
    R.box(g, 0.22, 0.16, 0.1, M.dark, [0, SOLE, z + Math.sign(z) * 0.08]);
    R.rod(g, [0, SOLE - 0.1, z + Math.sign(z) * 0.1], [0, SOLE + 0.1, z + Math.sign(z) * 0.1], 0.012, M.pipe, 5);
  }
  // One link hangs off the near end; nothing is coupled to it.
  const link = R.mesh(g, R.geo('link', () => new THREE.TorusGeometry(0.07, 0.014, 4, 12)), M.pipe,
    [0, SOLE - 0.08, -0.98], [0.3, Math.PI / 2, 0]);
  link.scale.set(1, 1.5, 1);

  /* THE CRADLES AND THE BODY. */
  const PIV = SOLE + 0.46;
  for (const z of [-0.72, 0.72]) {
    for (const x of [-0.34, 0.34]) R.angle(g, [x, SOLE + 0.08, z], [x * 0.2, PIV - 0.07, z], 0.06, M.dark, ZAXIS);
    R.box(g, 0.2, 0.1, 0.1, M.dark, [0, PIV - 0.05, z]);
  }
  const body = new THREE.Group();
  body.position.set(0, PIV, 0);
  body.rotation.z = (rand() - 0.5) * 0.22;
  g.add(body);
  const BL = 1.24;
  const sideA = new THREE.Vector2(0.2, -0.12), sideB = new THREE.Vector2(0.64, 0.5);
  const sideLen = sideA.distanceTo(sideB);
  const sideAng = Math.atan2(sideB.y - sideA.y, sideB.x - sideA.x);
  for (const e of [-1, 1]) {
    const geo = new THREE.BoxGeometry(sideLen, 0.02, BL, 5, 1, 6);
    const dents = [];
    const nd = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < nd; k++) {
      dents.push({
        c: new THREE.Vector3((rand() - 0.5) * sideLen * 0.8, 0, (rand() - 0.5) * BL * 0.8),
        r: 0.16 + rand() * 0.14, depth: -(0.02 + rand() * 0.035), dir: UP
      });
    }
    dent(geo, dents);
    const m = R.solo(body, geo, M.drum, [e * (sideA.x + sideB.x) / 2, (sideA.y + sideB.y) / 2, 0]);
    m.rotation.z = e > 0 ? sideAng : Math.PI - sideAng;
    // Stiffener ribs down the outside, rivets along the rim.
    const out = new THREE.Vector3(e * Math.sin(sideAng), -Math.cos(sideAng), 0).multiplyScalar(0.022);
    for (const z of [-0.36, 0, 0.36]) {
      R.bar(body, [e * sideA.x + out.x, sideA.y + out.y, z], [e * sideB.x + out.x, sideB.y + out.y, z], 0.05, 0.016, M.dark, ZAXIS);
    }
    R.angle(body, [e * 0.655, 0.5, -BL / 2], [e * 0.655, 0.5, BL / 2], 0.05, M.dark, e > 0 ? XAXIS : XAXIS.clone().negate());
    R.rivets(body, [e * 0.62 + out.x, 0.45, -0.56], [e * 0.62 + out.x, 0.45, 0.56], 9, new THREE.Vector3(e, -0.6, 0));
  }
  R.box(body, 0.42, 0.02, BL, M.drum, [0, -0.12, 0]);
  const endShape = new THREE.Shape([
    new THREE.Vector2(-0.21, -0.13), new THREE.Vector2(0.21, -0.13),
    new THREE.Vector2(0.66, 0.51), new THREE.Vector2(-0.66, 0.51)
  ]);
  const endGeo = R.geo('skipend', () => new THREE.ExtrudeGeometry(endShape, { depth: 0.025, bevelEnabled: false }));
  R.mesh(body, endGeo, M.drum, [0, 0, BL / 2 - 0.005]);
  R.mesh(body, endGeo, M.drum, [0, 0, -BL / 2 - 0.02]);
  for (const z of [-BL / 2 - 0.02, BL / 2 + 0.02]) {
    R.bar(body, [-0.66, 0.5, z], [0.66, 0.5, z], 0.05, 0.03, M.dark, UP);
    R.strut(body, [0, 0, z], [0, 0, z + Math.sign(z) * 0.12], 0.045, M.pipe, 8);
    R.cyl(body, 0.08, 0.08, 0.02, 10, M.dark, [0, 0, z + Math.sign(z) * 0.01], [Math.PI / 2, 0, 0]);
  }
  // The tipping latch and its lever on the near end.
  R.bar(body, [0.3, 0.1, -BL / 2 - 0.05], [0.55, 0.42, -BL / 2 - 0.05], 0.03, 0.02, M.pipe, ZAXIS);
  R.box(body, 0.08, 0.06, 0.05, M.dark, [0.3, 0.1, -BL / 2 - 0.05]);
  R.plate(body, `SK-1${R.index + 1}`, [0, 0.22, BL / 2 + 0.024], 0, { w: 0.3, h: 0.12 });
  // What is left in the bottom of it.
  const dregs = world.buildRubbleField({
    count: t4 ? 10 : 5,
    minX: -0.16, maxX: 0.16, minZ: -BL / 2 + 0.2, maxZ: BL / 2 - 0.2,
    y: -0.11, seed: 0x77c1 + Math.round(sx), scale: 0.32
  });
  dregs.userData.noMerge = true;
  body.add(dregs);

  return R.finish();
}

/* ==========================================================================
   THE DRUM STACK
   ========================================================================== */

/**
 * The profile of a 200-litre steel drum: rolled chimes top and bottom, two
 * swaged rolling hoops, recessed heads. `variant` knocks it about.
 */
function drumGeo(variant) {
  const r = 0.286, H = 0.88;
  const pts = [
    [0.001, 0.012], [0.27, 0.012], [0.28, 0.0], [0.294, 0.008], [0.294, 0.03], [r, 0.042],
    [r, 0.28], [0.297, 0.3], [r, 0.32], [r, 0.56], [0.297, 0.58], [r, 0.6], [r, 0.838],
    [0.294, 0.85], [0.294, 0.872], [0.28, H], [0.27, 0.866], [0.001, 0.866]
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(pts, 14);
  if (variant === 1) {
    dent(geo, [{ c: new THREE.Vector3(r, 0.44, 0.05), r: 0.2, depth: -0.05, dir: XAXIS }]);
  } else if (variant === 2) {
    dent(geo, [
      { c: new THREE.Vector3(-0.2, H, 0.2), r: 0.22, depth: -0.05, dir: UP },
      { c: new THREE.Vector3(0.05, 0.2, -r), r: 0.16, depth: 0.04, dir: ZAXIS }
    ]);
  }
  return geo;
}

/** A stack of drums on a pallet, banded, lidded and dented, one lying beside it. */
export function buildDrumStack(world, sx = 0, sz = 0) {
  const R = new Rig(world, 'drum-stack', ((sx * 374761393) ^ (sz * 668265263)) >>> 0);
  const { g, M, K } = R;
  const t4 = R.t4;
  const rand = mulberry32(((sx * 374761393) ^ (sz * 668265263)) >>> 0);

  /* THE PALLET: three stringers, seven deck boards, one of them broken. */
  const PT = 0.144;
  for (const z of [-0.54, 0, 0.54]) R.box(g, 1.95, 0.1, 0.1, M.timber, [0, 0.05, z]);
  for (let i = 0; i < 7; i++) {
    const x = -0.87 + i * 0.29;
    if (i === 5) {
      R.box(g, 0.13, 0.024, 0.6, M.timber, [x, 0.112, -0.32], [0.12, 0, 0]);
      continue;
    }
    R.box(g, 0.13, 0.024, 1.25, M.timber, [x, 0.112 + (rand() - 0.5) * 0.004, 0]);
  }
  const variants = [0, 1, 2].map(v => R.geo(`drum${v}`, () => drumGeo(v)));
  const bungGeo = R.geo('bung', () => new THREE.CylinderGeometry(0.03, 0.034, 0.02, 6));
  const place = (x, y, z, ry, mat, variant) => {
    const m = R.mesh(g, variants[variant], mat, [x, y, z], [0, ry, 0]);
    m.userData.uvs = [TAU * 0.29, 0.9];
    R.mesh(g, bungGeo, M.pipe, [x + Math.cos(ry) * 0.19, y + 0.872, z - Math.sin(ry) * 0.19]);
    if (t4) R.mesh(g, bungGeo, M.pipe, [x - Math.cos(ry) * 0.2, y + 0.872, z + Math.sin(ry) * 0.2]).scale.set(0.7, 1, 0.7);
    return m;
  };
  const layout = [[-0.6, -0.3], [0, -0.3], [0.6, -0.3], [-0.6, 0.3], [0, 0.3], [0.6, 0.3]];
  layout.forEach(([dx, dz], i) => {
    if (i === 2 && rand() < 0.5) return;          // one gone from the stack
    const mat = rand() < 0.35 ? K.oxide : M.drum;
    place(dx, PT, dz, rand() * TAU, mat, rand() < 0.3 ? 1 : 0);
  });
  // One drum stood on another, as they are, with a hand pump left in it.
  const topRy = rand() * TAU;
  place(0, PT + 0.88, 0.3, topRy, M.drum, 2);
  R.rod(g, [0.19 * Math.cos(topRy), PT + 1.7, 0.3 - 0.19 * Math.sin(topRy)],
    [0.19 * Math.cos(topRy), PT + 2.25, 0.3 - 0.19 * Math.sin(topRy)], 0.02, M.pipe, 6);
  R.bar(g, [0.19 * Math.cos(topRy), PT + 2.24, 0.3 - 0.19 * Math.sin(topRy)],
    [0.19 * Math.cos(topRy) + 0.28, PT + 2.3, 0.3 - 0.19 * Math.sin(topRy)], 0.025, 0.02, M.dark, ZAXIS);
  // The band round the bottom tier.
  R.pipe(g, [[-0.9, PT + 0.45, -0.3], [-0.9, PT + 0.45, 0.3], [-0.6, PT + 0.45, 0.6], [0.6, PT + 0.45, 0.6],
    [0.9, PT + 0.45, 0.3], [0.9, PT + 0.45, -0.3], [0.6, PT + 0.45, -0.6], [-0.6, PT + 0.45, -0.6], [-0.9, PT + 0.45, -0.3]],
    0.006, M.dark, { radial: 3, bend: 0.28 });
  R.curvedPlate(g, ['LB-04', 'CB-07', 'LB-11', 'FX-02'][R.index % 4], 0.286, PT + 0.46, 0, { w: 0.2, h: 0.09 })
    .position.set(-0.6, PT + 0.46, 0.3);

  // One drum on its side on the ground beside the pallet, leaking a stain.
  const tip = R.mesh(g, variants[1], K.oxide, [-1.3, 0.29, -0.45], [0, Math.PI / 2, Math.PI / 2, 'YXZ']);
  tip.userData.uvs = [TAU * 0.29, 0.9];
  const stain = R.solo(g, new THREE.CircleGeometry(0.45, 16), R.kit.stain, [-1.3, 0.012, 0.6], [-Math.PI / 2, 0, 0.3]);
  stain.scale.set(1, 1.3, 1);

  return R.finish();
}

/* ==========================================================================
   THE GATE HUT
   ========================================================================== */

/**
 * The gate hut: a riveted steel box on a plinth with one window, the thing
 * standing on the deck in the reference art. Small, built like a safe, and
 * lived in: a lamp over the door, a vent, a meter box, a whip aerial.
 */
export function buildGuardHut(world) {
  const R = new Rig(world, 'guard-hut', 0x6a7);
  const { g, M, K } = R;
  const t4 = R.t4;
  const W = 2.2, D = 1.9, Y0 = 0.25, H = 2.05;

  R.box(g, 2.6, 0.3, 2.3, K.concrete, [0, 0.1, 0]);
  R.box(g, W - 0.04, H, D - 0.04, M.drum, [0, Y0 + H / 2, 0]);
  // Corner angles, base channel, eaves channel — the frame the sheets are hung on.
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    R.angle(g, [x * W / 2, Y0, z * D / 2], [x * W / 2, Y0 + H, z * D / 2], 0.08, M.dark,
      new THREE.Vector3(-x, 0, 0));
  }
  for (const [a, b] of [[[-W / 2, -D / 2], [W / 2, -D / 2]], [[W / 2, -D / 2], [W / 2, D / 2]],
    [[W / 2, D / 2], [-W / 2, D / 2]], [[-W / 2, D / 2], [-W / 2, -D / 2]]]) {
    for (const y of [Y0 + 0.05, Y0 + H - 0.04]) R.bar(g, [a[0], y, a[1]], [b[0], y, b[1]], 0.09, 0.03, M.dark, UP);
  }
  // Seam straps and rivet lines on every face.
  const faces = [
    { n: ZAXIS, len: W, at: (u, y) => [u, y, D / 2] },
    { n: ZAXIS.clone().negate(), len: W, at: (u, y) => [u, y, -D / 2] },
    { n: XAXIS, len: D, at: (u, y) => [W / 2, y, u] },
    { n: XAXIS.clone().negate(), len: D, at: (u, y) => [-W / 2, y, u] }
  ];
  for (const f of faces) {
    const k = Math.round(f.len / 0.55);
    for (let i = 1; i < k; i++) {
      const u = -f.len / 2 + f.len * i / k;
      const a = vec(f.at(u, Y0 + 0.1)).addScaledVector(f.n, 0.008);
      const b = vec(f.at(u, Y0 + H - 0.08)).addScaledVector(f.n, 0.008);
      R.bar(g, a, b, 0.012, 0.05, M.drum, f.n);
      R.rivets(g, a.clone().addScaledVector(f.n, 0.006), b.clone().addScaledVector(f.n, 0.006), 9, f.n);
    }
  }

  /* THE WINDOW, front: frame, glass, sash bar, a security grille and a visor. */
  const wz = D / 2 + 0.01;
  R.box(g, 0.92, 0.66, 0.02, K.glass, [0, 1.5, wz]);
  for (const [x, y, w, h] of [[0, 1.86, 1.06, 0.07], [0, 1.14, 1.06, 0.07], [-0.5, 1.5, 0.07, 0.78], [0.5, 1.5, 0.07, 0.78], [0, 1.5, 0.035, 0.66]]) {
    R.box(g, w, h, 0.05, M.dark, [x, y, wz + 0.02]);
  }
  for (let i = 0; i < 6; i++) R.rod(g, [-0.4 + i * 0.16, 1.15, wz + 0.07], [-0.4 + i * 0.16, 1.85, wz + 0.07], 0.01, M.dark, 4);
  R.box(g, 1.14, 0.05, 0.2, M.pipe, [0, 1.09, wz + 0.08], [0.25, 0, 0]);
  R.box(g, 1.2, 0.025, 0.36, M.plate, [0, 1.98, wz + 0.16], [0.3, 0, 0]);
  R.plate(g, 'GATE 2', [0, 0.7, wz + 0.016], 0, { w: 0.46, h: 0.15 });

  /* THE DOOR, back: a braced leaf, three hinges, lever, hasp and padlock,
     kick plate, and the lamp over it. */
  const dz = -D / 2 - 0.012;
  const DX = 0.45;
  R.box(g, 0.82, 1.86, 0.04, M.plate, [DX, Y0 + 0.95, dz]);
  for (const [a, b] of [[[DX - 0.36, Y0 + 0.3], [DX + 0.36, Y0 + 0.3]], [[DX - 0.36, Y0 + 1.6], [DX + 0.36, Y0 + 1.6]],
    [[DX - 0.36, Y0 + 0.3], [DX + 0.36, Y0 + 1.6]]]) {
    R.bar(g, [a[0], a[1], dz - 0.03], [b[0], b[1], dz - 0.03], 0.06, 0.02, M.dark, ZAXIS);
  }
  for (const y of [Y0 + 0.25, Y0 + 0.95, Y0 + 1.65]) R.cyl(g, 0.022, 0.022, 0.14, 8, M.pipe, [DX + 0.43, y, dz - 0.02]);
  R.box(g, 0.8, 0.24, 0.012, M.tread, [DX, Y0 + 0.14, dz - 0.028]);
  R.bar(g, [DX - 0.3, Y0 + 1.0, dz - 0.07], [DX - 0.14, Y0 + 1.0, dz - 0.07], 0.03, 0.03, M.pipe, UP);
  R.box(g, 0.05, 0.05, 0.05, M.dark, [DX - 0.3, Y0 + 1.0, dz - 0.05]);
  R.box(g, 0.07, 0.09, 0.03, M.pipe, [DX - 0.34, Y0 + 0.86, dz - 0.07]);
  R.plate(g, 'NO ENTRY', [DX, Y0 + 1.35, dz - 0.004], Math.PI, { w: 0.4, h: 0.12, bg: '#a88f52' });
  {
    const lx = DX, ly = Y0 + 2.0, lz = dz - 0.12;
    R.box(g, 0.24, 0.16, 0.12, M.dark, [lx, ly, lz + 0.04]);
    R.lamp(g, R.geo('hutlens', () => new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12)), [lx, ly - 0.05, lz], {});
    for (let i = 0; i < 3; i++) R.rod(g, [lx - 0.08 + i * 0.08, ly - 0.02, lz - 0.06], [lx - 0.08 + i * 0.08, ly - 0.02, lz + 0.06], 0.006, M.dark, 4);
    R.mark(g, [lx, ly - 0.25, lz - 0.15], { color: 0xffc98a, intensity: 3.6, distance: 8, decay: 1.5 });
  }

  /* THE SIDES: a louvred vent on one, a meter box and conduit on the other. */
  {
    const x = W / 2 + 0.02;
    R.box(g, 0.04, 0.5, 0.62, M.dark, [x, 1.75, -0.3]);
    for (let i = 0; i < 6; i++) R.box(g, 0.08, 0.02, 0.56, M.plate, [x + 0.04, 1.56 + i * 0.075, -0.3], [0, 0, -0.6]);
    R.box(g, 0.2, 0.44, 0.34, M.plate, [x + 0.08, 1.2, 0.45]);
    R.box(g, 0.02, 0.1, 0.2, K.glass, [x + 0.185, 1.3, 0.45]);
    R.pipe(g, [[x + 0.08, 1.42, 0.45], [x + 0.08, 2.35, 0.45], [x - 0.3, 2.42, 0.45]], 0.025, M.pipe, { radial: 6, bend: 0.12 });
    R.plate(g, 'GH-2', [x + 0.182, 1.08, 0.45], Math.PI / 2, { w: 0.18, h: 0.07 });
  }

  /* THE ROOF: a low hip with a fascia, hip flashings, a mushroom vent and a
     whip aerial. */
  const RY = Y0 + H;
  R.box(g, 2.5, 0.12, 2.2, M.dark, [0, RY + 0.06, 0]);
  // Turned and squashed in the geometry, so the part is measured as it stands.
  R.mesh(g, R.geo('hutroof', () => new THREE.CylinderGeometry(0.02, 1.77, 0.42, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.88)),
    M.plate, [0, RY + 0.33, 0]);
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    R.bar(g, [x * 1.24, RY + 0.13, z * 1.09], [0, RY + 0.53, 0], 0.03, 0.05, M.dark, UP);
  }
  R.cyl(g, 0.06, 0.06, 0.3, 8, M.pipe, [0.4, RY + 0.55, 0.2]);
  R.cyl(g, 0.02, 0.16, 0.1, 8, M.dark, [0.4, RY + 0.73, 0.2]);
  R.rod(g, [-0.6, RY + 0.3, -0.5], [-0.6, RY + 1.9, -0.5], 0.008, M.dark, 4);
  R.cyl(g, 0.04, 0.05, 0.1, 6, M.dark, [-0.6, RY + 0.32, -0.5]);

  return R.finish();
}

/* ==========================================================================
   THE HAULER
   ========================================================================== */

/**
 * The site hauler: a cab-over six-wheel flatbed with a bar grille, parked on
 * the deck in the reference art. A chassis of channel rails on leaf springs,
 * lugged tyres on dished rims, a pressed cab with a raked screen, a cab guard,
 * dropsides and a load of column offcuts chained down.
 */
export function buildHauler(world) {
  const R = new Rig(world, 'hauler', 0x88e2);
  const { g, M, K } = R;
  const t4 = R.t4;

  /* WHEELS: a lugged tyre on a dished rim, built once, turned for each side. */
  const TR = 0.62, TW = 0.42;
  const tyreGeo = R.geo('tyre', () => new THREE.LatheGeometry([
    [0.36, -0.2], [0.5, -0.215], [0.585, -0.2], [TR, -0.15], [TR, 0.15], [0.585, 0.2], [0.5, 0.215], [0.36, 0.2]
  ].map(([r, y]) => new THREE.Vector2(r, y)), 18));
  const rimGeo = R.geo('rim', () => new THREE.LatheGeometry([
    [0.36, 0.19], [0.34, 0.14], [0.2, 0.1], [0.12, 0.16], [0.08, 0.19], [0.001, 0.19]
  ].map(([r, y]) => new THREE.Vector2(r, y)), 14));
  const lugGeo = R.geo('lugs', () => {
    const parts = [];
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU;
      for (const e of [-1, 1]) {
        const b = new THREE.BoxGeometry(0.14, 0.035, 0.16);
        b.rotateY(e * 0.4);
        b.translate(Math.sin(a + e * 0.08) * 0, 0, 0);
        const m = new THREE.Matrix4().makeRotationY(0);
        b.applyMatrix4(m);
        // Stand the lug on the tread: its y along the radius.
        b.rotateX(Math.PI / 2);
        b.translate(0, e * 0.085, TR + 0.012);
        b.rotateY(a + (e > 0 ? TAU / n / 2 : 0));
        parts.push(b);
      }
    }
    return mergeParts(parts);
  });
  const wheel = (x, z, side) => {
    const wg = new THREE.Group();
    wg.position.set(x, TR, z);
    wg.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(wg);
    R.mesh(wg, tyreGeo, K.rubber);
    // The lugs stand round the tread, which in the wheel's frame is round +y.
    R.mesh(wg, lugGeo, K.rubber);
    R.mesh(wg, rimGeo, M.dark).userData.uvs = [TAU * 0.36, 0.3];
    if (t4) {
      const pts = [];
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; pts.push([Math.sin(a) * 0.15, 0.17, Math.cos(a) * 0.15]); }
      R.studs(wg, pts, UP, 0.02, M.pipe);
    }
    R.cyl(wg, 0.07, 0.09, 0.05, 8, M.pipe, [0, 0.2, 0]);
  };
  const AXLES = [2.0, -1.0, -2.1];
  for (const z of AXLES) for (const s of [-1, 1]) wheel(s * 1.12, z, s);

  /* CHASSIS: two channel rails, cross members, springs, axles and a diff on each drive axle. */
  const CY = 1.02;
  for (const s of [-1, 1]) R.channel(g, [s * 0.5, CY, -3.2], [s * 0.5, CY, 2.95], 0.28, 0.08, M.dark, UP);
  for (const z of [-3.1, -1.55, 0.2, 1.3, 2.85]) R.channel(g, [-0.5, CY, z], [0.5, CY, z], 0.22, 0.06, M.dark, UP);
  for (const z of AXLES) {
    R.strut(g, [-0.95, TR, z], [0.95, TR, z], z > 0 ? 0.07 : 0.1, M.dark, 10, UP);
    if (z < 0) R.cyl(g, 0.2, 0.2, 0.32, 12, M.dark, [0, TR, z], [Math.PI / 2, 0, 0]);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) R.box(g, 0.08, 0.025, 1.1 - k * 0.2, M.dark, [s * 0.5, TR + 0.1 + k * 0.026, z]);
      if (t4) for (const e of [-1, 1]) R.rod(g, [s * 0.5 + e * 0.05, TR - 0.06, z + 0.06], [s * 0.5 + e * 0.05, TR + 0.22, z + 0.06], 0.01, M.pipe, 4);
    }
  }
  // Fuel tank, battery box, air tanks.
  R.strut(g, [-0.86, 0.76, -0.05], [-0.86, 0.76, 0.95], 0.26, M.plate, 14, UP);
  for (const z of [0.12, 0.78]) R.hoop(g, 0.265, 0, 0.012, M.dark, 18, 3).position.set(-0.86, 0.76, z);
  g.children.slice(-2).forEach(o => o.rotation.set(0, 0, 0));
  R.cyl(g, 0.06, 0.06, 0.06, 8, M.pipe, [-0.86, 1.04, 0.6]);
  R.box(g, 0.5, 0.42, 0.6, M.dark, [0.82, 0.74, 0.45]);
  R.box(g, 0.52, 0.03, 0.62, M.plate, [0.82, 0.965, 0.45]);
  R.strut(g, [0.78, 0.5, -0.4], [0.78, 0.5, 0.1], 0.1, M.plate, 10, UP);

  /* THE CAB, pressed from one profile, the screen raked back. */
  const CAB = new THREE.Shape([
    new THREE.Vector2(0.9, 1.38), new THREE.Vector2(2.95, 1.38), new THREE.Vector2(3.02, 1.95),
    new THREE.Vector2(2.96, 2.08), new THREE.Vector2(2.74, 2.86), new THREE.Vector2(2.62, 3.0),
    new THREE.Vector2(1.0, 3.0), new THREE.Vector2(0.9, 2.9)
  ]);
  const CW = 2.26;
  const cabGeo = R.geo('cab', () => {
    const e = new THREE.ExtrudeGeometry(CAB, { depth: CW, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
    e.rotateY(-Math.PI / 2);
    e.translate(CW / 2, 0, 0);
    return e;
  });
  R.mesh(g, cabGeo, M.plate);
  // Windscreen with a centre pillar, wipers and a visor.
  const scrA = new THREE.Vector3(0, 2.1, 2.99), scrB = new THREE.Vector3(0, 2.83, 2.78);
  const scrN = new THREE.Vector3(0, 0.21, 0.73).normalize();
  const scrLen = scrA.distanceTo(scrB);
  const scrAng = Math.atan2(scrB.z - scrA.z, scrB.y - scrA.y);
  const scrMid = scrA.clone().lerp(scrB, 0.5).addScaledVector(scrN, 0.02);
  R.box(g, 2.0, scrLen - 0.06, 0.02, K.glass, scrMid, [scrAng, 0, 0]);
  R.box(g, 0.06, scrLen, 0.03, M.dark, scrMid.clone().addScaledVector(scrN, 0.012), [scrAng, 0, 0]);
  for (const x of [-0.5, 0.5]) {
    R.bar(g, scrA.clone().setX(x).addScaledVector(scrN, 0.03).add(new THREE.Vector3(0, 0.04, 0)),
      scrA.clone().lerp(scrB, 0.7).setX(x + 0.2).addScaledVector(scrN, 0.035), 0.012, 0.012, M.dark, scrN);
  }
  R.box(g, 2.3, 0.03, 0.3, M.dark, [0, 2.9, 2.86], [0.12, 0, 0]);
  // Side glass, door seams, handle, grab rails and steps, both sides.
  for (const s of [-1, 1]) {
    const x = s * (CW / 2 + 0.045);
    R.box(g, 0.02, 0.62, 0.7, K.glass, [x, 2.45, 1.45]);
    R.box(g, 0.02, 0.5, 0.55, K.glass, [x, 2.4, 2.35]);
    for (const [a, b] of [[[0.98, 1.42], [0.98, 2.92]], [[1.86, 1.42], [1.86, 2.92]], [[0.98, 2.92], [1.86, 2.92]], [[0.98, 1.42], [1.86, 1.42]]]) {
      R.bar(g, [x + s * 0.005, a[1], a[0]], [x + s * 0.005, b[1], b[0]], 0.012, 0.012, M.dark, XAXIS);
    }
    R.bar(g, [x + s * 0.02, 2.0, 1.1], [x + s * 0.02, 2.0, 1.28], 0.03, 0.03, M.pipe, UP);
    R.pipe(g, [[x, 1.55, 0.92], [x + s * 0.07, 1.6, 0.92], [x + s * 0.07, 2.7, 0.92], [x, 2.75, 0.92]], 0.018, K.rail, { radial: 6, bend: 0.05 });
    for (const y of [0.62, 1.0]) R.box(g, 0.34, 0.04, 0.26, M.tread, [s * 1.1, y, 1.05]);
    R.bar(g, [s * 1.22, 0.58, 1.05], [s * 1.22, 1.36, 1.05], 0.04, 0.03, M.dark, ZAXIS);
    // Mirror on a tubular arm off the A-pillar.
    R.pipe(g, [[x, 2.6, 2.75], [x + s * 0.3, 2.62, 2.8], [x + s * 0.34, 2.5, 2.8]], 0.016, M.dark, { radial: 5, bend: 0.06 });
    R.box(g, 0.06, 0.38, 0.2, M.dark, [x + s * 0.34, 2.28, 2.8]);
    // Front wheel arch, dented on one side.
    const arch = new THREE.CylinderGeometry(0.76, 0.76, 0.5, 12, 1, true, -Math.PI * 0.05, Math.PI * 1.1);
    if (s > 0) dent(arch, [{ c: new THREE.Vector3(0.3, 0, 0.6), r: 0.3, depth: -0.06, dir: ZAXIS }]);
    R.solo(g, twoSided(arch), M.plate, [s * 1.12, TR, 2.0], [0, 0, Math.PI / 2]);
    // Mud flaps behind the last axle.
    R.box(g, 0.44, 0.5, 0.02, K.rubber, [s * 1.12, 0.62, -2.9]);
    if (s > 0) R.plate(g, 'HT-07', [x + s * 0.004, 1.8, 1.42], s * Math.PI / 2, { w: 0.34, h: 0.12 });
  }

  /* THE NOSE: a louvred fascia, a heavy bumper, the bar grille, lamps in guards. */
  for (let i = 0; i < 5; i++) R.box(g, 1.7, 0.03, 0.06, M.dark, [0, 1.52 + i * 0.09, 3.04], [0.4, 0, 0]);
  R.channel(g, [-1.2, 1.06, 3.12], [1.2, 1.06, 3.12], 0.3, 0.12, M.dark, UP);
  for (const s of [-1, 1]) R.cyl(g, 0.05, 0.05, 0.1, 6, M.pipe, [s * 0.7, 1.06, 3.24], [Math.PI / 2, 0, 0]);
  const bb = [[-0.95, 1.1, 3.28], [-0.95, 2.02, 3.3], [0.95, 2.02, 3.3], [0.95, 1.1, 3.28]];
  R.pipe(g, bb, 0.045, M.pipe, { radial: 8, bend: 0.14 });
  for (let i = 0; i < 5; i++) R.strut(g, [-0.6 + i * 0.3, 1.18, 3.29], [-0.6 + i * 0.3, 1.98, 3.3], 0.022, M.pipe, 6);
  R.strut(g, [-0.95, 1.55, 3.29], [0.95, 1.55, 3.29], 0.022, M.pipe, 6);
  for (const s of [-1, 1]) {
    R.cyl(g, 0.13, 0.13, 0.12, 12, M.dark, [s * 0.86, 1.28, 3.2], [Math.PI / 2, 0, 0]);
    R.cyl(g, 0.105, 0.105, 0.02, 12, K.lens, [s * 0.86, 1.28, 3.27], [Math.PI / 2, 0, 0]);
    for (const dx of [-0.05, 0, 0.05]) R.rod(g, [s * 0.86 + dx, 1.16, 3.33], [s * 0.86 + dx, 1.4, 3.33], 0.006, M.dark, 4);
    // Work lamps on the roof.
    R.box(g, 0.2, 0.14, 0.12, M.dark, [s * 0.7, 3.14, 2.5]);
    R.box(g, 0.16, 0.1, 0.01, K.lens, [s * 0.7, 3.14, 2.565]);
  }
  R.cyl(g, 0.09, 0.1, 0.14, 10, K.lens, [0, 3.13, 1.6]);
  R.cyl(g, 0.12, 0.12, 0.04, 10, M.dark, [0, 3.05, 1.6]);

  /* BEHIND THE CAB: exhaust with its shield, intake, and the cab guard. */
  R.pipe(g, [[-1.3, 1.0, 0.78], [-1.3, 3.35, 0.78], [-1.26, 3.55, 0.68]], 0.075, M.pipe, { radial: 10, bend: 0.2 });
  R.cyl(g, 0.11, 0.11, 0.9, 10, M.dark, [-1.3, 2.2, 0.78], null, { open: true, t0: -Math.PI, tl: Math.PI, inner: true });
  R.cyl(g, 0.11, 0.11, 1.9, 12, M.plate, [1.3, 2.05, 0.78]);
  R.cyl(g, 0.19, 0.14, 0.16, 12, M.dark, [1.3, 3.06, 0.78]);
  const GZ = 0.68, BED = 1.42;
  for (const s of [-1, 1]) R.channel(g, [s * 1.16, BED, GZ], [s * 1.16, 3.18, GZ], 0.1, 0.05, M.dark, XAXIS);
  R.channel(g, [-1.16, 3.18, GZ], [1.16, 3.18, GZ], 0.1, 0.05, M.dark, UP);
  for (let i = 0; i < 8; i++) R.rod(g, [-0.98 + i * 0.28, BED + 0.1, GZ], [-0.98 + i * 0.28, 3.12, GZ], 0.018, M.dark, 5);
  R.strut(g, [-1.16, 2.3, GZ], [1.16, 2.3, GZ], 0.022, M.dark, 6);

  /* THE BED: tread deck on bearers, dropsides on hinges, the tailgate down,
     two column offcuts chained to it. */
  R.box(g, 2.4, 0.06, 3.84, M.tread, [0, BED - 0.03, -1.28]);
  for (let z = -3.1; z < 0.6; z += 0.52) R.channel(g, [-1.2, BED - 0.12, z], [1.2, BED - 0.12, z], 0.12, 0.04, M.dark, UP);
  for (const s of [-1, 1]) {
    R.box(g, 0.04, 0.46, 3.8, M.plate, [s * 1.2, BED + 0.23, -1.28]);
    R.angle(g, [s * 1.2, BED + 0.47, -3.18], [s * 1.2, BED + 0.47, 0.62], 0.05, M.dark, s > 0 ? XAXIS : XAXIS.clone().negate());
    for (const z of [-2.8, -1.9, -1.0, -0.1]) R.bar(g, [s * 1.225, BED, z], [s * 1.225, BED + 0.46, z], 0.05, 0.02, M.dark, ZAXIS);
    for (const z of [-2.6, -1.3, 0.1]) R.cyl(g, 0.03, 0.03, 0.18, 6, M.pipe, [s * 1.23, BED - 0.01, z], [Math.PI / 2, 0, 0]);
  }
  {
    const tg = new THREE.Group();
    tg.position.set(0, BED - 0.02, -3.22);
    tg.rotation.x = -Math.PI * 0.94;
    g.add(tg);
    R.box(tg, 2.36, 0.46, 0.04, M.plate, [0, 0.23, 0]);
    R.bar(tg, [-1.15, 0.45, 0.03], [1.15, 0.45, 0.03], 0.05, 0.03, M.dark, UP);
    R.plate(tg, 'MAX 12T', [0, 0.25, 0.024], 0, { w: 0.44, h: 0.14, bg: '#a88f52' });
  }
  for (const [x, z, len] of [[-0.5, -1.6, 2.4], [0.46, -1.1, 1.9]]) {
    const col = R.mesh(g, world.hexGeo, M.basalt, [x, BED + 0.35, z], [Math.PI / 2, 0, Math.PI / 2, 'ZYX']);
    col.scale.set(0.8, len, 0.8);
  }
  for (const z of [-2.1, -0.9]) {
    R.pipe(g, [[-1.2, BED + 0.44, z], [-0.86, BED + 0.72, z], [-0.5, BED + 0.73, z], [0.1, BED + 0.73, z],
      [0.46, BED + 0.72, z], [0.82, BED + 0.72, z], [1.2, BED + 0.44, z]], 0.014, M.pipe, { radial: 4, bend: 0.12 });
  }
  R.box(g, 0.08, 0.05, 0.28, M.dark, [0.95, BED + 0.62, -2.1], [0, 0, 0.6]);
  const cargo = world.buildRubbleField({
    count: t4 ? 8 : 4, minX: -0.95, maxX: 0.95, minZ: -3.0, maxZ: -2.55,
    y: BED + 0.01, seed: 0x88e2, scale: 0.4
  });
  cargo.userData.noMerge = true;
  g.add(cargo);

  return R.finish();
}

/* ==========================================================================
   THE SHED
   ========================================================================== */

/**
 * A portal-framed shed clad in box-profile sheet: H-section columns and
 * rafters with haunches, channel purlins and girts, a slab, a roller door
 * half down, a turbine vent on the ridge — the buildings standing behind the
 * arches in the reference art. One wall sheet gone, one hanging by a fixing,
 * a replaced roof sheet in primer that never matched.
 */
export function buildShed(world, scale = 1) {
  const R = new Rig(world, 'shed', 0x5ed + Math.round(scale * 100));
  const { g, M, K } = R;
  const t4 = R.t4;
  const rand = R.rand;
  const W = 7.0 * scale, D = 5.2 * scale, H = 3.0 * scale, RISE = 0.9 * scale;
  const OFF = 0.13;      // sheet line outside the frame

  R.box(g, W + 0.5, 0.2, D + 0.7, K.concrete, [0, 0.0, 0.15]);
  const FY = 0.1;

  /* THE FRAME: three portals, eaves beams, purlins and girts. */
  const frames = [-D / 2 + 0.1, 0, D / 2 - 0.1];
  for (const z of frames) {
    for (const s of [-1, 1]) {
      R.box(g, 0.3, 0.02, 0.28, M.dark, [s * W / 2, FY + 0.01, z]);
      R.ibeam(g, [s * W / 2, FY + 0.02, z], [s * W / 2, FY + H, z], 0.2, 0.14, M.dark, XAXIS);
      R.ibeam(g, [s * W / 2, FY + H + 0.05, z], [0, FY + H + RISE, z], 0.22, 0.14, M.dark, UP);
      R.angle(g, [s * (W / 2 - 0.08), FY + H - 0.6, z], [s * (W / 2 - 0.8), FY + H + 0.12, z], 0.07, M.dark, ZAXIS);
    }
  }
  const slopeLen = Math.hypot(W / 2, RISE);
  const slope = Math.atan2(RISE, W / 2);
  const roofPt = (s, t, lift = 0) => new THREE.Vector3(s * (W / 2) * (1 - t), FY + H + RISE * t + 0.13 + lift, 0);
  for (const s of [-1, 1]) {
    R.channel(g, [s * W / 2, FY + H, -D / 2 - 0.1], [s * W / 2, FY + H, D / 2 + 0.1], 0.16, 0.06, M.dark, UP);
    for (const t of [0.04, 0.37, 0.7, 0.97]) {
      const p = roofPt(s, t, -0.06);
      R.channel(g, [p.x, p.y, -D / 2 - 0.2], [p.x, p.y, D / 2 + 0.2], 0.12, 0.05, M.dark, UP);
    }
    for (const y of [FY + 1.0, FY + 2.1 * scale]) {
      R.channel(g, [s * (W / 2 + 0.07), y, -D / 2], [s * (W / 2 + 0.07), y, D / 2], 0.12, 0.05, M.dark, UP);
    }
  }
  for (const y of [FY + 1.0, FY + 2.1 * scale]) {
    R.channel(g, [-W / 2, y, -D / 2 - 0.07], [W / 2, y, -D / 2 - 0.07], 0.12, 0.05, M.dark, UP);
  }

  /* THE CLADDING, sheet by sheet: some primer, one gone, one hanging. */
  const SW = 0.95;
  const sheetAt = (key, w, len) => R.geo(`sheet${key}|${w.toFixed(2)}|${len.toFixed(2)}`, () => sheetGeo(w, len));
  const wallRun = (len, place) => {
    const n = Math.ceil(len / SW);
    const w = len / n;
    for (let i = 0; i < n; i++) place(-len / 2 + (i + 0.5) * w, w, i, n);
  };
  let gone = Math.floor(rand() * 5);
  const side = s => wallRun(D, (u, w, i) => {
    if (s > 0 && i === gone) return;           // the missing sheet
    const mat = rand() < 0.15 ? K.oxide : M.plate;
    R.mesh(g, sheetAt('w', w + 0.05, H + 0.05), mat, [s * (W / 2 + OFF), FY + H / 2 + 0.02, u], [0, s * Math.PI / 2, 0]);
  });
  side(-1); side(1);
  wallRun(W, (u, w) => {
    R.mesh(g, sheetAt('w', w + 0.05, H + 0.05), rand() < 0.12 ? K.oxide : M.plate, [u, FY + H / 2 + 0.02, -D / 2 - OFF], [0, Math.PI, 0]);
  });
  // Front: sheeted either side of the door opening.
  const doorL = -W / 2 + W * 0.34, doorR = W / 2 - 0.95 * scale;
  for (const [a, b] of [[-W / 2, doorL], [doorR, W / 2]]) {
    const len = b - a;
    const n = Math.max(1, Math.round(len / SW));
    for (let i = 0; i < n; i++) {
      R.mesh(g, sheetAt('w', len / n + 0.05, H + 0.05), M.plate, [a + (i + 0.5) * len / n, FY + H / 2 + 0.02, D / 2 + OFF]);
    }
  }
  // Gables: a flat triangle of plate at each end.
  const gable = R.geo(`gable${W}|${RISE}`, () => {
    const sh = new THREE.Shape([new THREE.Vector2(-W / 2 - 0.1, 0), new THREE.Vector2(W / 2 + 0.1, 0), new THREE.Vector2(0, RISE + 0.08)]);
    return new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false });
  });
  R.mesh(g, gable, M.plate, [0, FY + H, D / 2 + OFF - 0.015]);
  R.mesh(g, gable, M.plate, [0, FY + H, -D / 2 - OFF - 0.015]);
  // The roof: sheets running down the slope, ridge flashing, barge boards.
  const roofRun = D + 0.4;
  const nR = Math.ceil(roofRun / SW);
  const missingRoof = rand() < 0.6 ? Math.floor(rand() * nR) : -1;
  for (const s of [-1, 1]) {
    const mid = roofPt(s, 0.5, 0.0);
    // Sheet width along z, its length down the slope, its ribs out of the roof.
    const ay = new THREE.Vector3(Math.cos(slope), -s * Math.sin(slope), 0);
    const an = new THREE.Vector3(s * Math.sin(slope), Math.cos(slope), 0);
    const qR = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(ZAXIS, ay, an));
    for (let i = 0; i < nR; i++) {
      if (s < 0 && i === missingRoof) continue;
      const z = -roofRun / 2 + (i + 0.5) * roofRun / nR;
      const mat = (s > 0 && i === (missingRoof + 2) % nR) ? K.oxide : M.plate;
      const m = R.mesh(g, sheetAt('r', roofRun / nR + 0.05, slopeLen + 0.35), mat, [mid.x, mid.y, z]);
      m.quaternion.copy(qR);
    }
    R.bar(g, roofPt(s, -0.05, 0.05).setZ(D / 2 + 0.2 + OFF), roofPt(s, 1, 0.06).setZ(D / 2 + 0.2 + OFF), 0.18, 0.03, M.dark, new THREE.Vector3(-s * Math.sin(slope), Math.cos(slope), 0));
    R.bar(g, roofPt(s, -0.05, 0.05).setZ(-D / 2 - 0.2 - OFF), roofPt(s, 1, 0.06).setZ(-D / 2 - 0.2 - OFF), 0.18, 0.03, M.dark, new THREE.Vector3(-s * Math.sin(slope), Math.cos(slope), 0));
    // The gutter and, on one corner, its downpipe.
    const ge = roofPt(s, -0.06, -0.08);
    R.channel(g, [ge.x + s * 0.06, ge.y, -D / 2 - 0.25], [ge.x + s * 0.06, ge.y, D / 2 + 0.25], 0.14, 0.1, M.plate, XAXIS.clone().multiplyScalar(s));
    if (s > 0) {
      R.pipe(g, [[ge.x + s * 0.08, ge.y, -D / 2 - 0.18], [ge.x + s * 0.08, ge.y - 0.3, -D / 2 - 0.18], [W / 2 + OFF + 0.08, ge.y - 0.5, -D / 2 - 0.18],
        [W / 2 + OFF + 0.08, FY + 0.25, -D / 2 - 0.18], [W / 2 + OFF + 0.2, FY + 0.12, -D / 2 - 0.18]], 0.05, M.plate, { radial: 8, bend: 0.1 });
    }
  }
  const ridge = new THREE.Vector3(0, FY + H + RISE + 0.18, 0);
  for (const s of [-1, 1]) {
    R.bar(g, ridge.clone().setX(s * 0.15).setZ(-D / 2 - 0.22), ridge.clone().setX(s * 0.15).setZ(D / 2 + 0.22), 0.32, 0.012,
      M.plate, new THREE.Vector3(s * Math.cos(slope), Math.sin(slope), 0));
  }
  // Turbine vent on the ridge.
  R.cyl(g, 0.16, 0.2, 0.2, 10, M.plate, [0, ridge.y + 0.12, -0.8]);
  R.cyl(g, 0.24, 0.2, 0.3, 12, M.drum, [0, ridge.y + 0.37, -0.8]);
  R.cyl(g, 0.02, 0.25, 0.12, 12, M.plate, [0, ridge.y + 0.58, -0.8]);

  /* THE DOOR: lintel, jambs, a roller shutter part-way down from its drum. */
  const dw = doorR - doorL, dc = (doorL + doorR) / 2;
  const dz = D / 2 + OFF;
  R.channel(g, [doorL, FY + H - 0.35, dz + 0.02], [doorR, FY + H - 0.35, dz + 0.02], 0.2, 0.06, M.dark, UP);
  for (const x of [doorL, doorR]) R.channel(g, [x, FY, dz + 0.02], [x, FY + H - 0.35, dz + 0.02], 0.14, 0.06, M.dark, XAXIS);
  R.strut(g, [doorL, FY + H - 0.12, dz + 0.2], [doorR, FY + H - 0.12, dz + 0.2], 0.24, M.plate, 14, UP);
  const shutterDrop = 0.9 + rand() * 0.6;
  const sh = R.mesh(g, R.geo(`shutter${dw.toFixed(2)}|${shutterDrop.toFixed(2)}`, () => sheetGeo(shutterDrop, dw - 0.1, { pitch: 0.1, d: 0.02 })),
    M.drum, [dc, FY + H - 0.35 - shutterDrop / 2, dz + 0.06]);
  sh.rotation.set(0, 0, Math.PI / 2);
  R.box(g, dw - 0.1, 0.06, 0.06, M.dark, [dc, FY + H - 0.35 - shutterDrop, dz + 0.06]);
  R.plate(g, `ST-0${R.index + 1}`, [doorL - 0.5 * scale, FY + 1.7, dz + 0.035], 0, { w: 0.44, h: 0.16 });

  // The loose sheet, hanging by one fixing off the +x side.
  {
    const pivot = new THREE.Group();
    pivot.position.set(W / 2 + OFF + 0.05, FY + H - 0.05, D * 0.18);
    pivot.rotation.set(0, Math.PI / 2 + 0.25, -0.35);
    g.add(pivot);
    R.mesh(pivot, sheetAt('w', 0.9, 1.7 * scale), M.plate, [0, -0.85 * scale, 0.04]);
  }

  /* WHAT IS KEPT IN IT: a bench, a stack of timber, a chain hoist off the ridge. */
  R.box(g, 2.4, 0.06, 0.8, M.timber, [W * 0.16, FY + 0.9, -D * 0.3]);
  for (const [x, z] of [[-1.1, -0.35], [1.1, -0.35], [-1.1, 0.35], [1.1, 0.35]]) {
    R.angle(g, [W * 0.16 + x, FY, -D * 0.3 + z], [W * 0.16 + x, FY + 0.87, -D * 0.3 + z], 0.05, M.dark, XAXIS);
  }
  R.box(g, 0.3, 0.2, 0.2, M.dark, [W * 0.16 - 0.8, FY + 1.03, -D * 0.3]);
  for (let i = 0; i < 5; i++) {
    R.box(g, 3.2, 0.1, 0.24, M.timber, [-W * 0.13 + (i % 2) * 0.05, FY + 0.12 + i * 0.105, -D * 0.34 + 0.5 + (i % 3) * 0.02]);
  }
  for (const x of [-1.2, 0, 1.2]) R.box(g, 0.1, 0.07, 0.9, M.timber, [-W * 0.13 + x, FY + 0.035, -D * 0.34 + 0.5]);
  {
    const hx = 0.4, top = FY + H + RISE * (1 - hx / (W / 2)) - 0.05;
    R.box(g, 0.14, 0.2, 0.14, M.dark, [hx, top - 0.15, 0]);
    R.rod(g, [hx, top - 0.25, 0.02], [hx, FY + 1.3, 0.02], 0.01, K.wire, 4);
    R.rod(g, [hx + 0.05, top - 0.25, -0.02], [hx + 0.05, FY + 1.9, -0.02], 0.01, K.wire, 4);
    R.box(g, 0.12, 0.18, 0.08, M.dark, [hx, FY + 1.22, 0.02]);
    R.mesh(g, R.geo('hook', () => new THREE.TorusGeometry(0.06, 0.014, 4, 10, Math.PI * 1.4)), M.pipe, [hx, FY + 1.06, 0.02], [0, 0, Math.PI * 0.8]);
  }

  return R.finish();
}

/* ==========================================================================
   THE FLUE STACK
   ========================================================================== */

/**
 * A guyed flue stack: a flared base can on anchor chairs over a concrete
 * plinth, flanged sections, a breeching duct blanked where the furnace it
 * served was taken away, a caged ladder with a rest landing and a sampling
 * platform, a guy collar, helical strakes, and forty years of soot down its
 * mouth.
 */
export function buildStack(world, scale = 1) {
  const R = new Rig(world, 'stack', 0x57ac + Math.round(scale * 100));
  const { g, M, K } = R;
  const t4 = R.t4;
  const H = 16 * scale;
  const B = 0.6;
  const RS = 0.55 * Math.max(0.9, scale);
  const RB = 0.95;
  const top = B + H;

  R.box(g, 2.8, 0.8, 2.8, K.concrete, [0, 0.2, 0]);
  R.cyl(g, 1.12, 1.12, 0.04, 24, M.dark, [0, B + 0.02, 0]);
  // Anchor chairs round the base ring.
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU;
    const f = new THREE.Group();
    f.position.copy(polar(RB, a, B + 0.04));
    f.rotation.y = a;
    g.add(f);
    for (const e of [-1, 1]) R.box(f, 0.02, 0.3, 0.16, M.dark, [e * 0.07, 0.15, 0.08]);
    R.box(f, 0.2, 0.025, 0.18, M.dark, [0, 0.31, 0.09]);
    R.cyl(f, 0.036, 0.036, 0.04, 6, M.dark, [0, 0.34, 0.1]);
    R.cyl(f, 0.018, 0.018, 0.1, 5, M.pipe, [0, 0.38, 0.1]);
  }
  // The flared can and the shell, in sections with bolted flange pairs.
  R.mesh(g, R.geo(`flare${RS}`, () => new THREE.LatheGeometry([
    new THREE.Vector2(RB, 0), new THREE.Vector2(RB, 0.3), new THREE.Vector2(RS + 0.08, 1.7), new THREE.Vector2(RS, 1.9)
  ], 24)), M.drum, [0, B + 0.04, 0]).userData.uvs = [TAU * RB, 2];
  const secs = [B + 1.94];
  for (let y = B + 1.94 + 4.0; y < top - 2.5; y += 4.0) secs.push(y);
  secs.push(top - 1.3);
  secs.push(top);
  for (let i = 0; i < secs.length - 1; i++) {
    const y0 = secs[i], y1 = secs[i + 1];
    const soot = i === secs.length - 2;
    R.cyl(g, RS, RS, y1 - y0, 20, soot ? K.soot : M.drum, [0, (y0 + y1) / 2, 0], null, { open: true });
    if (i > 0) R.flange(g, RS, y0, { n: 8 });
  }
  // The mouth: a lip, and the dark inside it.
  R.hoop(g, RS + 0.02, top, 0.03, K.soot, 24, 4);
  R.solo(g, new THREE.CircleGeometry(RS, 16), K.hole, [0, top - 0.5, 0], [-Math.PI / 2, 0, 0]);
  R.cyl(g, RS - 0.01, RS - 0.01, 0.5, 16, K.soot, [0, top - 0.25, 0], null, { open: true, inner: true });
  // Helical strakes over the top four metres.
  if (t4) {
    for (let k = 0; k < 3; k++) {
      const pts = [];
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        const a = k / 3 * TAU + t * TAU * 0.8;
        pts.push(polar(RS + 0.07, a, top - 4.4 + t * 3.0));
      }
      R.solo(g, twoSided(ribbonGeometry(pts, i => polar(1, k / 3 * TAU + (i / 30) * TAU * 0.8), 0.14)), M.drum);
    }
  }
  // The breeching duct, blanked, on a post.
  {
    const y = B + 2.6, len = 2.3;
    R.box(g, len, 0.72, 0.62, M.plate, [RS + len / 2 - 0.05, y, 0]);
    for (const x of [RS + 0.3, RS + 1.3, RS + len - 0.1]) R.box(g, 0.06, 0.82, 0.72, M.dark, [x, y, 0]);
    R.box(g, 0.03, 0.78, 0.68, M.dark, [RS + len + 0.02, y, 0]);
    if (t4) {
      const pts = [];
      for (const [dy, dz] of [[0.36, -0.3], [0.36, 0], [0.36, 0.3], [-0.36, -0.3], [-0.36, 0], [-0.36, 0.3], [0, -0.32], [0, 0.32]]) pts.push([RS + len + 0.04, y + dy, dz]);
      R.studs(g, pts, XAXIS, 0.02);
    }
    R.ibeam(g, [RS + len - 0.4, 0.2, 0], [RS + len - 0.4, y - 0.36, 0], 0.14, 0.12, M.dark, ZAXIS);
    R.plate(g, `FS-0${R.index + 1}`, [RS + 0.8, y, 0.316], 0, { w: 0.4, h: 0.15 });
  }
  // The cleanout door on the flare.
  {
    const f = new THREE.Group();
    f.position.copy(polar(0.86, Math.PI, B + 0.75));
    f.rotation.set(0, Math.PI, 0);
    g.add(f);
    R.box(f, 0.56, 0.5, 0.04, M.plate, [0, 0, 0.02], [-0.28, 0, 0]);
    for (const x of [-0.2, 0.2]) R.box(f, 0.05, 0.12, 0.06, M.dark, [x, 0.02, 0.05], [-0.28, 0, 0]);
  }

  /* THE LADDER, the landings and the collar. */
  const LA = -Math.PI / 2;
  const LR = RB + 0.22;
  const lb = polar(LR, LA, 0.25);
  const wallAt = y => (y < B + 2 ? Math.max(0.05, 0.3 + RB - LR - (y - B) * 0.2) : LR - RS);
  R.ladder(g, { base: [lb.x, 0.25, lb.z], a: LA, height: top - 1.8 - 0.25, wallAt, ext: 1.05, cageTop: top - 1.9 });
  const deck = (y, a0, a1, r1, full) => {
    R.solo(g, sectorSlab(RS + 0.03, r1, a0, a1, 0.035), K.grate, [0, y - 0.035, 0]);
    const pts = [];
    const n = Math.max(4, Math.ceil((a1 - a0) * r1 / 0.95));
    for (let i = 0; i <= n; i++) { const p = polar(r1 - 0.03, a0 + (a1 - a0) * i / n); pts.push([p.x, p.z]); }
    if (!full) {
      const pa = polar(RS + 0.1, a0), pb = polar(RS + 0.1, a1);
      pts.unshift([pa.x, pa.z]);
      pts.push([pb.x, pb.z]);
    }
    R.handrail(g, pts, y, { span: 1.3 });
    const nb = Math.max(2, Math.ceil((a1 - a0) * RS / 1.2));
    for (let i = 0; i <= nb; i++) {
      const a = a0 + 0.05 + (a1 - a0 - 0.1) * i / nb;
      R.strut(g, polar(RS, a, y - 0.7), polar(r1 - 0.12, a, y - 0.06), 0.022, M.dark, 5);
      R.angle(g, polar(RS, a, y - 0.04), polar(r1 - 0.04, a, y - 0.04), 0.06, M.dark, UP);
    }
  };
  const restY = B + Math.round(H * 0.5);
  deck(restY, LA + 0.55, LA + 1.6, RS + 0.95, false);
  const platY = top - 1.8;
  deck(platY, LA + 0.3, LA + TAU - 0.3, RS + 0.9, false);
  // Sampling ports over the platform, blinded.
  for (const a of [0.4, Math.PI + 0.4]) {
    const p = polar(RS, a, platY + 1.3);
    const q = polar(RS + 0.25, a, platY + 1.3);
    R.strut(g, p, q, 0.06, M.pipe, 10, UP);
    R.strut(g, q, polar(RS + 0.29, a, platY + 1.3), 0.11, M.dark, 12, UP);
  }
  // Obstruction lamp on the platform rail.
  {
    const p = polar(RS + 0.87, 0, platY + 1.12);
    R.cyl(g, 0.06, 0.07, 0.1, 8, M.dark, [p.x, p.y + 0.05, p.z]);
    R.lamp(g, R.geo('beacon', () => new THREE.SphereGeometry(0.075, 10, 6)), [p.x, p.y + 0.16, p.z]);
  }
  const guyY = B + H * 0.72;
  R.cyl(g, RS + 0.05, RS + 0.05, 0.22, 20, M.dark, [0, guyY, 0]);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.4;
    const ax = Math.cos(a) * 5.2, az = Math.sin(a) * 5.2;
    const lug = [Math.cos(a) * (RS + 0.14), guyY, Math.sin(a) * (RS + 0.14)];
    R.box(g, 0.2, 0.2, 0.02, M.dark, lug, [0, -a, 0]);
    const tb = [ax - Math.cos(a) * 0.9, 0.95, az - Math.sin(a) * 0.9];
    R.cable(g, lug, tb, { sag: 0.45, radius: 0.016, segments: 14 });
    R.strut(g, tb, [ax - Math.cos(a) * 0.35, 0.42, az - Math.sin(a) * 0.35], 0.03, M.pipe, 6);
    R.rod(g, [ax - Math.cos(a) * 0.35, 0.42, az - Math.sin(a) * 0.35], [ax, 0.2, az], 0.012, K.wire, 4);
    R.box(g, 0.5, 0.35, 0.5, K.concrete, [ax, 0.03, az], [0, -a, 0]);
    R.box(g, 0.14, 0.05, 0.1, M.dark, [ax, 0.23, az], [0, -a, 0]);
  }

  // The stack still draws: its smoke leaves at the mouth.
  g.userData.ventY = top + 0.2;
  return R.finish();
}

/* ==========================================================================
   THE WATER TOWER
   ========================================================================== */

/**
 * A riveted tank on a battered steel tower: H-section legs on concrete piers,
 * struts and tension rods in every bay, a grillage, a grated balcony with a
 * handrail, a caged ladder up through a hatch, the rising main with its gate
 * valve, an overflow, and a float gauge board on the shell.
 */
export function buildWaterTower(world) {
  const R = new Rig(world, 'water-tower', 0x3a7e);
  const { g, M, K } = R;
  const t4 = R.t4;
  const H = 8.4;
  const TR = 1.9;
  const F = 1.68, T = 1.3;                 // leg positions at the foot and the head
  const at = y => F + (T - F) * (y / H);

  /* THE TOWER. */
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    R.box(g, 0.6, 0.55, 0.6, K.concrete, [sx * F, 0.03, sz * F]);
    R.box(g, 0.4, 0.025, 0.4, M.dark, [sx * F, 0.31, sz * F]);
    if (t4) R.studs(g, [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [sx * F + a * 0.14, 0.33, sz * F + b * 0.14]), UP, 0.025);
    R.ibeam(g, [sx * F, 0.32, sz * F], [sx * T, H, sz * T], 0.22, 0.2, M.dark, new THREE.Vector3(sx, 0, -sz));
  }
  const levels = [0.9, 3.4, 5.9, H - 0.15];
  const faces = [[XAXIS, ZAXIS], [XAXIS.clone().negate(), ZAXIS], [ZAXIS, XAXIS], [ZAXIS.clone().negate(), XAXIS]];
  for (const [n, t] of faces) {
    const pt = (y, e) => n.clone().multiplyScalar(at(y)).addScaledVector(t, e * at(y)).setY(y);
    for (let k = 0; k < levels.length; k++) {
      const y = levels[k];
      R.angle(g, pt(y, -1), pt(y, 1), 0.08, M.dark, n);
      if (k < levels.length - 1) {
        const y1 = levels[k + 1];
        R.rod(g, pt(y + 0.05, -0.95), pt(y1 - 0.05, 0.95), 0.018, M.dark, 5);
        R.rod(g, pt(y + 0.05, 0.95), pt(y1 - 0.05, -0.95), 0.018, M.dark, 5);
        if (t4) R.cyl(g, 0.03, 0.03, 0.16, 6, M.pipe, pt((y + y1) / 2, 0).addScaledVector(n, 0.02));
      }
    }
  }
  // Grillage under the tank.
  for (const e of [-1, 1]) {
    R.ibeam(g, [-T - 0.2, H + 0.12, e * T], [T + 0.2, H + 0.12, e * T], 0.24, 0.16, M.dark, UP);
    R.ibeam(g, [e * T, H + 0.12, -T - 0.2], [e * T, H + 0.12, T + 0.2], 0.24, 0.16, M.dark, UP);
    R.ibeam(g, [e * 0.45, H + 0.12, -T], [e * 0.45, H + 0.12, T], 0.2, 0.12, M.dark, UP);
  }

  /* THE TANK: a riveted shell in three courses, a dished bottom and a coned roof. */
  const TB = H + 0.26, TH = 3.0;
  R.cyl(g, TR, TR, TH, 28, M.drum, [0, TB + TH / 2, 0]);
  R.cyl(g, TR + 0.04, TR + 0.04, 0.08, 28, M.dark, [0, TB + 0.04, 0], null, { open: true });
  for (const k of [1, 2]) {
    R.hoop(g, TR + 0.006, TB + TH * k / 3, 0.014, M.drum, 40, 3);
  }
  if (t4) {
    for (const k of [0, 1, 2, 3]) {
      const y = TB + 0.05 + (TH - 0.1) * k / 3;
      const pts = [];
      for (let i = 0; i < 40; i++) pts.push(polar(TR + 0.004, i / 40 * TAU, y));
      const geo = mergeParts(pts.map(p => rivetsGeo([p], p.clone().setY(0), 0.013)));
      R.solo(g, geo, M.dark);
    }
    for (let v = 0; v < 6; v++) {
      const a = v / 6 * TAU + (v % 2) * 0.2;
      const n = polar(1, a);
      for (let k = 0; k < 3; k++) {
        R.rivets(g, polar(TR + 0.004, a, TB + TH * k / 3 + 0.12), polar(TR + 0.004, a, TB + TH * (k + 1) / 3 - 0.12), 7, n);
      }
    }
  }
  const RT = TB + TH;
  R.cyl(g, 0.02, TR + 0.1, 0.62, 28, M.plate, [0, RT + 0.31, 0]);
  R.hoop(g, TR + 0.06, RT + 0.01, 0.03, M.dark, 40, 4);
  R.cyl(g, 0.12, 0.12, 0.3, 10, M.pipe, [0, RT + 0.75, 0]);
  R.cyl(g, 0.02, 0.26, 0.16, 10, M.dark, [0, RT + 0.95, 0]);
  {
    const hp = polar(1.0, Math.PI * 0.2, RT + 0.34);
    R.box(g, 0.6, 0.06, 0.6, M.plate, [hp.x, hp.y, hp.z], [0.3, Math.PI * 0.2, 0]);
  }
  R.curvedPlate(g, 'WT-1', TR, TB + TH * 0.62, 0.35, { w: 0.7, h: 0.3 });
  // The float gauge: a board on the shell and a pointer on it.
  {
    const a = -0.9;
    const f = new THREE.Group();
    f.position.copy(polar(TR + 0.08, a, TB + 1.4));
    f.rotation.y = a;
    g.add(f);
    R.box(f, 0.16, 2.4, 0.03, M.plate, [0, 0, 0]);
    for (let k = 0; k < 7; k++) R.box(f, 0.1, 0.012, 0.01, M.dark, [0, -1.0 + k * 0.33, 0.02]);
    R.box(f, 0.22, 0.05, 0.03, K.rail, [0, 0.35, 0.04]);
    R.rod(f, [0, 0.4, 0.05], [0, 1.9, 0.05], 0.004, K.wire, 3);
  }

  /* THE BALCONY. */
  const BY = H + 0.24;
  const BR0 = TR + 0.03, BR1 = TR + 0.72;
  const hatchA = 0.0, hatchW = 0.3;
  R.solo(g, sectorSlab(BR0, BR1, hatchA + hatchW, hatchA + TAU - hatchW, 0.035), K.grate, [0, BY - 0.035, 0]);
  {
    const pts = [];
    for (let i = 0; i <= 44; i++) { const p = polar(BR1 - 0.03, i / 44 * TAU); pts.push(p); }
    const top = pts.map(p => p.clone().setY(BY + 1.07));
    const knee = pts.map(p => p.clone().setY(BY + 0.53));
    R.pipe(g, top, 0.022, K.rail, { radial: 5, bend: 0 });
    R.pipe(g, knee, 0.017, K.rail, { radial: 4, bend: 0 });
    R.cyl(g, BR1, BR1, 0.1, 44, K.rail, [0, BY + 0.05, 0], null, { open: true, inner: true });
    for (let i = 0; i < 14; i++) {
      const p = polar(BR1 - 0.03, (i + 0.5) / 14 * TAU, BY);
      R.strut(g, p, p.clone().setY(BY + 1.08), 0.022, K.rail, 6);
    }
    for (let i = 0; i < 10; i++) {
      const a = (i + 0.5) / 10 * TAU;
      R.angle(g, polar(TR - 0.3, a, BY - 0.05), polar(BR1 - 0.03, a, BY - 0.05), 0.07, M.dark, UP);
    }
    R.cyl(g, BR1 - 0.02, BR1 - 0.02, 0.12, 44, M.dark, [0, BY - 0.1, 0], null, { open: true, inner: true });
  }
  // The ladder, from the ground through the hatch in the balcony.
  const LZ = TR + 0.36;
  R.ladder(g, {
    base: [0, 0.05, LZ], a: 0, height: BY - 0.05, ext: 1.1,
    wallAt: y => LZ - at(y) - 0.02, cageFrom: 2.4, cageTop: BY - 0.15
  });

  /* THE PIPEWORK: the rising main down the middle, its valve, the overflow. */
  R.pipe(g, [[0, TB, 0], [0, 0.9, 0], [0.9, 0.55, 0], [2.3, 0.55, 0], [2.45, -0.1, 0]], 0.11, M.pipe, { radial: 12, bend: 0.35 });
  {
    const f = new THREE.Group();
    f.position.set(0, 2.6, 0);
    g.add(f);
    R.flange(f, 0.11, 0, { n: 8 });
    R.valve(f, 0.11, 0.02);
  }
  R.box(g, 0.4, 0.35, 0.4, K.concrete, [1.7, 0.1, 0]);
  R.pipe(g, [polar(TR, 2.4, RT - 0.3), polar(TR + 0.25, 2.4, RT - 0.3), polar(TR + 0.25, 2.4, RT - 1.0),
    [Math.sin(2.4) * 1.8, H - 0.3, Math.cos(2.4) * 1.8], [Math.sin(2.4) * 2.2, 0.4, Math.cos(2.4) * 2.2], [Math.sin(2.4) * 2.5, 0.15, Math.cos(2.4) * 2.5]],
  0.05, M.pipe, { radial: 8, bend: 0.25 });

  return R.finish();
}

/* ==========================================================================
   THE CABLE MAST
   ========================================================================== */

/**
 * A triangular lattice mast: tube legs, zig-zag lacing, a braced crossarm on
 * which the feeder's conductors were cut and left to hang, a pole-mounted
 * transformer on a platform, a down-lead to a junction box, an anti-climb
 * band with its warning, a floodlight, and the obstruction lamp on top.
 */
export function buildCableMast(world) {
  const R = new Rig(world, 'cable-mast', 0xca61);
  const { g, M, K } = R;
  const t4 = R.t4;
  const H = 9.0;
  const RL = 0.42;
  const legs = [0, 1, 2].map(i => i / 3 * TAU);

  R.box(g, 1.3, 0.5, 1.3, K.concrete, [0, 0.0, 0]);
  for (const a of legs) {
    const p = polar(RL, a);
    R.box(g, 0.24, 0.02, 0.24, M.dark, [p.x, 0.26, p.z]);
    R.strut(g, [p.x, 0.26, p.z], [p.x, H, p.z], 0.036, M.dark, 8);
  }
  const PANEL = 0.6;
  for (let i = 0; i < 3; i++) {
    const a = polar(RL, legs[i]), b = polar(RL, legs[(i + 1) % 3]);
    for (let y = 0.4, k = 0; y + PANEL <= H - 0.2; y += PANEL, k++) {
      const [p0, p1] = k % 2 ? [a, b] : [b, a];
      R.rod(g, p0.clone().setY(y), p1.clone().setY(y + PANEL), 0.012, M.dark, 4);
      if (k % 3 === 0) R.rod(g, a.clone().setY(y), b.clone().setY(y), 0.014, M.dark, 4);
    }
    R.rod(g, a.clone().setY(H - 0.05), b.clone().setY(H - 0.05), 0.016, M.dark, 4);
  }
  // Anti-climb plates round the legs, and the warning on them.
  for (let i = 0; i < 3; i++) {
    const a = polar(RL + 0.03, legs[i]), b = polar(RL + 0.03, legs[(i + 1) % 3]);
    const m = a.clone().lerp(b, 0.5);
    const ry = Math.atan2(b.x - a.x, b.z - a.z) - Math.PI / 2;
    R.box(g, a.distanceTo(b) + 0.04, 0.6, 0.012, M.plate, [m.x, 2.6, m.z], [0, ry, 0]);
    if (i === 0) R.plate(g, 'DANGER 11KV', [m.x + Math.sin(ry) * 0.012, 2.62, m.z + Math.cos(ry) * 0.012], ry, { w: 0.62, h: 0.2, bg: '#a88f52' });
  }

  /* THE CROSSARM, and what is left of the line on it. */
  const AY = H - 0.8;
  R.channel(g, [-1.25, AY, 0], [1.25, AY, 0], 0.12, 0.05, M.dark, UP);
  for (const s of [-1, 1]) R.angle(g, [s * 1.0, AY - 0.02, 0], [s * 0.25, AY - 1.1, 0.1], 0.05, M.dark, ZAXIS);
  const insGeo = R.geo('insulator', () => mergeParts([0, 1, 2].map(k => new THREE.CylinderGeometry(0.07 - k * 0.012, 0.08 - k * 0.012, 0.045, 8).translate(0, k * 0.06, 0))));
  for (const [i, ix] of [-1.1, -0.45, 0.45, 1.1].entries()) {
    R.mesh(g, insGeo, K.ceramic, [ix, AY + 0.09, 0]);
    R.rod(g, [ix, AY + 0.05, 0], [ix, AY + 0.25, 0], 0.008, M.pipe, 4);
    // The conductor, cut and hanging, tied back to the mast.
    const end = [Math.sign(ix) * 0.35, AY - 1.6 - i * 0.2, i % 2 ? 0.3 : -0.3];
    R.cable(g, [ix, AY + 0.23, 0], end, { sag: 0.5 + i * 0.1, radius: 0.01, segments: 10 });
  }

  /* THE TRANSFORMER, on a platform off one face. */
  {
    const a = legs[0];
    const TY = 4.2;
    const out = polar(1, a), side = polar(1, a + Math.PI / 2);
    const c = polar(RL + 0.42, a, TY);
    for (const e of [-1, 1]) {
      R.channel(g, polar(RL, a, TY).addScaledVector(side, e * 0.3), c.clone().addScaledVector(out, 0.35).addScaledVector(side, e * 0.3), 0.1, 0.04, M.dark, UP);
      R.angle(g, polar(RL, a, TY - 0.8).addScaledVector(side, e * 0.3), c.clone().addScaledVector(out, 0.3).addScaledVector(side, e * 0.3).setY(TY - 0.05), 0.05, M.dark, UP);
    }
    R.box(g, 0.78, 0.035, 0.7, K.grate, [c.x, TY + 0.06, c.z], [0, a, 0]);
    R.box(g, 0.52, 0.72, 0.4, M.plate, [c.x, TY + 0.45, c.z], [0, a, 0]);
    for (let k = 0; k < 5; k++) {
      for (const e of [-1, 1]) {
        const p = c.clone().addScaledVector(side, e * 0.27).addScaledVector(out, -0.16 + k * 0.08);
        R.box(g, 0.012, 0.56, 0.14, M.plate, [p.x, TY + 0.44, p.z], [0, a + Math.PI / 2, 0]);
      }
    }
    for (let k = -1; k <= 1; k++) {
      const p = c.clone().addScaledVector(side, k * 0.14);
      R.mesh(g, insGeo, K.ceramic, [p.x, TY + 0.83, p.z]).scale.set(0.6, 1, 0.6);
      R.cable(g, [p.x, TY + 0.98, p.z], [k * 0.3, AY - 0.05, 0], { sag: 0.25, radius: 0.008, segments: 8 });
    }
    const leg = polar(RL + 0.06, a);
    R.pipe(g, [[c.x, TY + 0.2, c.z], [leg.x, TY, leg.z], [leg.x, 1.3, leg.z]], 0.025, K.rubber, { radial: 5, bend: 0.2 });
    R.box(g, 0.34, 0.46, 0.2, M.plate, [leg.x + out.x * 0.12, 1.05, leg.z + out.z * 0.12], [0, a, 0]);
    if (t4) for (let y = 1.8; y < TY; y += 0.7) R.box(g, 0.06, 0.03, 0.08, M.dark, [leg.x, y, leg.z]);
  }

  /* THE FLOODLIGHT and THE OBSTRUCTION LAMP — the two things on it that glow. */
  {
    const a = legs[2];
    const p = polar(RL + 0.5, a, 6.5);
    R.bar(g, polar(RL, a, 6.5), p, 0.05, 0.05, M.dark, UP);
    R.box(g, 0.36, 0.18, 0.26, M.dark, [p.x, p.y - 0.06, p.z], [0.5, a, 0]);
    R.lamp(g, R.geo('floodlens', () => new THREE.BoxGeometry(0.3, 0.02, 0.2)), [p.x, p.y - 0.15, p.z], {}).rotation.set(0.5, a, 0);
    R.mark(g, [p.x, p.y - 0.4, p.z], { color: 0xffc98a, intensity: 5.5, distance: 13, decay: 1.4 });
  }
  R.cyl(g, 0.06, 0.08, 0.14, 8, M.dark, [0, H + 0.07, 0]);
  R.lamp(g, R.geo('mastlamp', () => new THREE.SphereGeometry(0.12, 12, 8)), [0, H + 0.24, 0], { color: 0x6b3a20, intensity: 1.3 });
  R.hoop(g, 0.16, H + 0.24, 0.014, M.dark, 12, 4);
  R.rod(g, [0, H + 0.1, 0], [0, H + 0.4, 0], 0.01, M.dark, 4);
  R.rod(g, [0.3, H - 0.1, 0], [0.3, H + 1.2, 0], 0.008, M.dark, 4);

  return R.finish();
}

/* ==========================================================================
   THE LANDING PAD
   ========================================================================== */

/**
 * The landing apron: where the shuttle sets down, and the way off Ligar.
 * A surface, not a body — everything on it stands ON it, and nothing stands
 * more than a hand or two above it.
 */
export function buildLandingPad(world) {
  const R = new Rig(world, 'landing-pad', 0x1a9d);
  const { g, M, K } = R;
  const t4 = R.t4;
  g.userData.phys = 'ground';
  const TOP = 0.22;

  R.cyl(g, 7.4, 7.6, 0.24, 48, M.plate, [0, 0.1, 0]).userData.uvs = null;
  // Plate seams: radial flush bars and two rings, bolted.
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + TAU / 16;
    R.bar(g, polar(0.9, a, TOP + 0.004), polar(7.3, a, TOP + 0.004), 0.06, 0.008, M.dark, polar(1, a + Math.PI / 2));
    if (t4) R.rivets(g, polar(1.2, a, TOP + 0.008), polar(7.1, a, TOP + 0.008), 12, UP, M.dark, 0.016);
  }
  for (const r of [3.0, 5.9]) R.solo(g, sectorSlab(r, r + 0.06, 0, TAU, 0.008, 0.1), M.dark, [0, TOP, 0]);
  R.cyl(g, 0.9, 0.9, 0.012, 24, M.dark, [0, TOP + 0.006, 0]);

  // The markings: one decal geometry, one draw.
  {
    const parts = [new THREE.RingGeometry(4.4, 5.1, 48)];
    for (let i = 0; i < 4; i++) parts.push(new THREE.RingGeometry(2.1, 2.45, 6, 1, i / 4 * TAU + 0.35, TAU / 4 - 0.7));
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU;
      const b = new THREE.PlaneGeometry(0.1, 0.55).translate(0, 6.35, 0).rotateZ(a);
      parts.push(b);
    }
    const geo = mergeParts(parts.map(p => (p.index ? p.toNonIndexed() : p)));
    const paint = R.own(new THREE.MeshStandardMaterial({
      color: 0xb08a2c, transparent: true, opacity: 0.55, roughness: 0.85,
      side: THREE.DoubleSide, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
    }));
    R.solo(g, geo, paint, [0, TOP + 0.012, 0], [-Math.PI / 2, 0, 0]);
  }
  // Hazard band round the lip.
  {
    const band = hazardStripe(1.0, 0.2);
    band.geometry.dispose();
    band.geometry = new THREE.CylinderGeometry(7.405, 7.605, 0.2, 64, 1, true);
    band.userData.ownGeometry = band.geometry;
    const tex = band.material.map;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(46, 1);
    R.take(band, g);
    band.position.y = 0.1;
  }

  /* THE BLAST SHIELDS: raked plate on braced frames, a beacon on each. */
  const lenses = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    const f = new THREE.Group();
    f.position.copy(polar(6.5, a, TOP));
    f.rotation.y = a;
    g.add(f);
    R.box(f, 2.4, 1.05, 0.05, M.dark, [0, 0.56, 0.12], [-0.3, 0, 0]);
    for (const x of [-1.05, 0, 1.05]) {
      R.channel(f, [x, 0.03, -0.3], [x, 0.03, 0.55], 0.1, 0.04, M.dark, UP);
      R.angle(f, [x, 0.05, -0.28], [x, 0.9, 0.2], 0.06, M.dark, XAXIS);
      if (t4) R.studs(f, [[x, 0.06, -0.24], [x, 0.06, 0.5]], UP, 0.02);
    }
    R.bar(f, [-1.2, 1.06, 0.3], [1.2, 1.06, 0.3], 0.05, 0.08, M.dark, UP);
    if (i % 2 === 0) R.plate(f, `P${i + 1}`, [0, 0.626, 0.133], 0, { w: 0.3, h: 0.3 }).rotation.x = -0.3;
    R.cyl(f, 0.07, 0.08, 0.1, 8, M.dark, [0, 1.13, 0.3]);
    lenses.push(new THREE.SphereGeometry(0.08, 10, 6).translate(0, 1.24, 0.3)
      .applyMatrix4(new THREE.Matrix4().makeRotationY(a))
      .translate(Math.sin(a) * 6.5, TOP, Math.cos(a) * 6.5));
    if (i % 2 === 0) R.mark(f, [0, 1.6, 0.8], { color: 0xffc98a, intensity: 3.6, distance: 9, decay: 1.5 });
  }
  // Flush perimeter lights, between the shields.
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    const p = polar(7.15, a, TOP);
    R.cyl(g, 0.1, 0.12, 0.03, 10, M.dark, [p.x, TOP + 0.015, p.z]);
    lenses.push(new THREE.SphereGeometry(0.07, 8, 4, 0, TAU, 0, Math.PI / 2).translate(p.x, TOP + 0.025, p.z));
  }
  R.lamp(g, R.own(mergeParts(lenses)), [0, 0, 0], {});

  // Tie-down rings, drain grates and a service hatch.
  if (t4) {
    const ringGeo = R.geo('tiedown', () => new THREE.TorusGeometry(0.08, 0.014, 4, 10));
    for (let i = 0; i < 8; i++) {
      const p = polar(4.0, i / 8 * TAU + 0.2, TOP);
      R.cyl(g, 0.12, 0.12, 0.012, 10, M.dark, [p.x, TOP + 0.006, p.z]);
      R.mesh(g, ringGeo, M.pipe, [p.x, TOP + 0.03, p.z], [Math.PI / 2 - 0.25, 0, i]);
    }
  }
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU;
    const p = polar(6.9, a, TOP);
    R.box(g, 0.5, 0.012, 0.3, K.grate, [p.x, TOP + 0.006, p.z], [0, a, 0]);
  }
  {
    const p = polar(5.4, 2.0, TOP);
    R.box(g, 0.8, 0.02, 0.6, M.tread, [p.x, TOP + 0.01, p.z], [0, 2.0, 0]);
    R.bar(g, [p.x - 0.1, TOP + 0.03, p.z], [p.x + 0.1, TOP + 0.03, p.z], 0.02, 0.02, M.pipe, UP);
  }

  return R.finish();
}

/* ==========================================================================
   THE SURVEY STAKE
   ========================================================================== */

/** T4 decoration: an angle-iron survey picket with a wind-shredded flag. */
export function buildStakeMarker(world, sx = 0, ground = null) {
  const R = new Rig(world, 'stake-marker', 0x4c21 + Math.round(sx * 11));
  const { g, M, K } = R;
  const rand = R.rand;
  R.angle(g, [-0.02, -0.05, -0.02], [-0.02, 1.62, -0.02], 0.05, M.dark, XAXIS);
  for (const y of [0.4, 0.9, 1.4]) R.box(g, 0.07, 0.2, 0.07, K.rail, [0.0, y, 0.0]);
  // The flag: a rag, rippled and torn along its free edge.
  const flagGeo = new THREE.PlaneGeometry(0.34, 0.22, 6, 3);
  {
    const p = flagGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + 0.17;
      const y = p.getY(i);
      const tear = x > 0.28 ? (rand() - 0.2) * 0.07 : 0;
      p.setXYZ(i, x - tear, y - x * 0.12 + (x > 0.3 ? (rand() - 0.5) * 0.04 : 0), Math.sin(x * 16 + sx) * 0.035 * x / 0.34);
    }
    flagGeo.computeVertexNormals();
  }
  R.solo(g, flagGeo, K.cloth, [0.03, 1.48, 0], [0, 0.4 + (sx % 3) * 0.2, 0]);
  R.rod(g, [0.02, 1.36, 0], [0.02, 1.6, 0], 0.006, K.wire, 3);
  // A heap of stones holding the stake up, the way a survey mark is set on
  // rock you cannot drive anything into.
  const cairn = world.buildRubbleField({
    count: 9, minX: -0.32, maxX: 0.32, minZ: -0.32, maxZ: 0.32,
    y: -0.02, seed: 0x4c21 + Math.round(sx * 11), scale: 0.3, mound: 0.16, ground
  });
  cairn.userData.noMerge = true;
  g.add(cairn);
  return R.finish();
}
