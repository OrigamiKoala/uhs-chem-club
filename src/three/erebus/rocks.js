/**
 * rocks.js — The stone of Erebus: one geology, three shapes, one surface.
 *
 * ONE GEOLOGY. The basin was a lake inside a plateau of layered sandstone, and
 * every rock on it is a remnant of the same beds. So there is one stack of
 * strata for the whole world (`STRATA`), indexed by ALTITUDE, and it decides
 * two things at once: the colour a rock is painted at a given height, and how
 * far that bed stands proud of the face. Hard beds make ledges, soft ones
 * recess; a butte's caprock overhangs because it is the hard layer that saved
 * it. Two rocks a hundred metres apart show the same bands at the same heights,
 * which is what a real canyon country looks like and what a set of random
 * props never does.
 *
 * THREE SHAPES.
 *   - `boulderGeometry` — a displaced icosphere, then CUT by a few random planes
 *     so it breaks along faces the way stone does, not like a potato.
 *   - `columnGeometry` — a lathe built ring by ring, for buttes, spires and
 *     hoodoos: strata ledges, vertical gullies where water ran down the face,
 *     a sandblasted notch at the foot, and a flat caprock.
 *   - `archGeometry` — a column bent over into a span, for the arch.
 *
 * ONE SURFACE. `createRockMaterial` paints stone in world space: strata by
 * altitude, a triplanar grain and normal from the bedded-rock texture, desert
 * varnish streaked down the steep faces, and sand settled on everything that
 * faces up. Instanced scree uses the same material.
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { noise2, fbm2, rng, smoothstep } from './noise.js';

/* ------------------------------------------------------------------ strata */

export const STRATA_Y0 = -40;
export const STRATA_SPAN = 256;

// Close in value, as real sandstone beds are: a formation reads as one rock
// with a grain, not as a stack of paint samples. The pale and the dark beds
// are rare markers.
const PALETTE = [
  [0.63, 0.42, 0.28],  // rust sandstone
  [0.66, 0.46, 0.31],  // buff
  [0.60, 0.40, 0.27],  // red-brown
  [0.68, 0.49, 0.34],  // ochre
  [0.64, 0.44, 0.30],
  [0.74, 0.58, 0.42],  // pale cross-bedded (marker)
  [0.52, 0.36, 0.26]   // mudstone (marker)
];

/** The beds, bottom to top: { y0, y1, hard 0…1, color [r,g,b] }. */
export const STRATA = (() => {
  const r = rng(0xbed5);
  const beds = [];
  let y = STRATA_Y0;
  while (y < STRATA_Y0 + STRATA_SPAN) {
    const thick = 0.9 + Math.pow(r(), 1.4) * 5.5;
    const roll = r();
    const idx = roll < 0.86 ? Math.floor(r() * 5) : roll < 0.94 ? 5 : 6;
    const hard = Math.pow(r(), 0.8);
    const c = PALETTE[idx];
    const j = 0.94 + r() * 0.12;
    beds.push({ y0: y, y1: y + thick, hard, color: [c[0] * j, c[1] * j, c[2] * j] });
    y += thick;
  }
  return beds;
})();

function bedAt(y) {
  // Beds are few (under a hundred); a linear walk is fine at build time.
  for (const b of STRATA) if (y < b.y1) return b;
  return STRATA[STRATA.length - 1];
}

/**
 * How far the face stands out at altitude y: +1 for the hardest bed, -1 for the
 * softest, eased across each contact so a ledge has a lip and not a step.
 */
export function ledgeAt(y) {
  const b = bedAt(y);
  const t = (y - b.y0) / (b.y1 - b.y0);
  // A hard bed rounds over at its top and undercuts at its base.
  const shape = b.hard > 0.55 ? (0.7 + 0.3 * Math.sin(t * Math.PI)) : (0.9 - 0.2 * Math.sin(t * Math.PI));
  return (b.hard * 2 - 1) * shape;
}

/** A 1 x 1024 strip of bed colours from STRATA_Y0 upward, for the shaders. */
export function createStrataTexture() {
  const N = 1024;
  const data = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) {
    const y = STRATA_Y0 + (i + 0.5) / N * STRATA_SPAN;
    const b = bedAt(y);
    const t = (y - b.y0) / (b.y1 - b.y0);
    // Each bed darkens a little toward its base, where the finer sediment settled.
    const k = 0.9 + 0.12 * t + noise2(i * 0.37, 3.3) * 0.06;
    data[i * 4] = Math.min(255, b.color[0] * k * 255);
    data[i * 4 + 1] = Math.min(255, b.color[1] * k * 255);
    data[i * 4 + 2] = Math.min(255, b.color[2] * k * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, 1, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/* --------------------------------------------------------------- 3D noise */

function noise3(x, y, z) {
  return (noise2(x + 0.31 * z, y - 0.17 * z) + noise2(y + 0.43 * x + 11.7, z + 5.3) + noise2(z - 0.29 * y + 3.1, x + 7.9)) / 2.1;
}
function fbm3(x, y, z, oct = 4) {
  let s = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * noise3(x, y, z); n += a;
    x = x * 2.02 + 1.7; y = y * 2.02 - 3.1; z = z * 2.02 + 0.9; a *= 0.5;
  }
  return s / n;
}

/* ---------------------------------------------------------------- boulders */

/**
 * A broken stone. Unit-ish size before `scale`. Its base is cut flat at y = -0.35
 * so it can be bedded into the ground without floating on a curved underside.
 */
export function boulderGeometry(seed, { detail = 3, scale = [1, 0.7, 1], cuts = 5, rough = 1 } = {}) {
  let geo = new THREE.IcosahedronGeometry(1, detail);
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  geo = BufferGeometryUtils.mergeVertices(geo, 1e-4);
  const r = rng(seed);
  const off = [r() * 50, r() * 50, r() * 50];
  const planes = [];
  for (let i = 0; i < cuts; i++) {
    const n = new THREE.Vector3(r() - 0.5, (r() - 0.3) * 0.8, r() - 0.5).normalize();
    planes.push({ n, d: 0.55 + r() * 0.3 });
  }
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + rough * (0.28 * fbm3(v.x * 1.1 + off[0], v.y * 1.1 + off[1], v.z * 1.1 + off[2], 3)
      + 0.07 * fbm3(v.x * 4.3 + off[1], v.y * 4.3, v.z * 4.3 + off[2], 2));
    v.multiplyScalar(k);
    // Fracture faces: anything beyond a plane is pushed back onto it.
    for (const pl of planes) {
      const e = v.dot(pl.n) - pl.d;
      if (e > 0) v.addScaledVector(pl.n, -e * 0.92);
    }
    // The part in the ground.
    if (v.y < -0.35) v.y = -0.35 - (v.y + 0.35) * 0.1;
    v.set(v.x * scale[0], v.y * scale[1], v.z * scale[2]);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  return geo;
}

/* ----------------------------------------------------------------- columns */

/**
 * A butte, spire or hoodoo, built from the ground up.
 *
 * @param {object} o
 *   height, radius — overall size (metres)
 *   baseY          — world altitude of the foot, so the ledges line up with the beds
 *   taper          — 0 straight-sided … 0.6 steep cone
 *   waist          — hoodoo pinch (0 none … 0.5 deep), at `waistAt` 0…1
 *   cap            — caprock overhang (0 … 0.25)
 *   squash         — [sx, sz] footprint ellipse
 *   bury           — metres below the foot, so it is founded in the ground
 */
export function columnGeometry(seed, o = {}) {
  const {
    height = 10, radius = 4, baseY = 0, taper = 0.2, waist = 0, waistAt = 0.35,
    cap = 0.08, squash = [1, 1], bury = 2.5, segs = 64, rings = null,
    gully = 0.16, ledge = 0.09, notch = 0.14, plan = 0.16, talus = 0, talusSpread = 0.5
  } = o;
  const r = rng(seed);
  const off = r() * 100;
  const ny = rings || Math.max(18, Math.round((height + bury) / 0.35));
  const verts = [];
  const H = height + bury;

  const radiusAt = (t, th) => {
    const y = -bury + t * H;          // local height above the foot
    const tt = Math.max(0, y / height);
    const cx = Math.cos(th), sx = Math.sin(th);
    let m = 1 - taper * tt;
    if (waist > 0) m *= 1 - waist * Math.exp(-(((tt - waistAt) / 0.18) ** 2));
    // The plan is never a circle: a butte is what is left between gullies
    // that cut back into it, so its outline is lobed and angular.
    m *= 1 + plan * fbm2(cx * 1.1 + off, sx * 1.1 - off, 3) * 1.6;
    m *= 1 + plan * 0.5 * Math.abs(fbm2(cx * 2.6 + off * 0.5, sx * 2.6, 2)) * 1.4;
    // Hard beds stand proud, soft beds recess — more in some places than others.
    m *= 1 + ledge * ledgeAt(baseY + y) * (0.45 + 0.9 * (fbm2(cx * 1.7 - off, sx * 1.7 + 3.3, 2) + 0.5));
    // Gullies: sharp V-notches where water ran down the face, nearly vertical.
    const gv = Math.abs(fbm2(cx * 3.2 + off, sx * 3.2 + tt * 0.35, 3));
    m *= 1 - gully * (1 - smoothstep(0.0, 0.14, gv)) * (0.35 + 0.65 * tt);
    m *= 1 + 0.045 * fbm2(cx * 9 + off, sx * 9 + tt * 6, 2);
    // Sandblasted at the foot, where the saltating grains fly.
    m *= 1 - notch * Math.exp(-Math.max(0, y) / 1.1) * smoothstep(-0.8, 0.2, y);
    // Caprock: the hard layer at the top that the rest was saved by.
    m *= 1 + cap * smoothstep(0.88, 0.96, tt) * (1 - smoothstep(0.985, 1.0, tt) * 0.5);
    // Talus: the apron of fallen rock the cliff stands in.
    if (talus > 0 && tt < talus) m *= 1 + talusSpread * Math.pow(1 - tt / talus, 1.7);
    return Math.max(0.15, m) * radius;
  };

  for (let j = 0; j <= ny; j++) {
    const t = j / ny;
    const y = -bury + t * H;
    for (let i = 0; i < segs; i++) {
      const th = (i / segs) * Math.PI * 2;
      const rr = radiusAt(t, th);
      verts.push(Math.cos(th) * rr * squash[0], y, Math.sin(th) * rr * squash[1]);
    }
  }
  // The top: a few rings inward, nearly flat, weathered into a shallow dish or dome.
  const topRings = 5;
  const topBase = verts.length / 3 - segs;
  for (let k = 1; k <= topRings; k++) {
    const f = 1 - k / (topRings + 1);
    for (let i = 0; i < segs; i++) {
      const th = (i / segs) * Math.PI * 2;
      const rr = radiusAt(1, th) * f;
      const x = Math.cos(th) * rr * squash[0], z = Math.sin(th) * rr * squash[1];
      const bump = fbm2(x * 0.3 + off, z * 0.3, 3) * Math.min(1.2, radius * 0.08) + (1 - f) * radius * 0.02;
      verts.push(x, height + bump - (1 - f * f) * 0.0, z);
    }
  }
  const centreIdx = verts.length / 3;
  verts.push(0, height + radius * 0.03, 0);

  const idx = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < segs; i++) {
      const a = j * segs + i, b = j * segs + (i + 1) % segs;
      const c = a + segs, d = b + segs;
      idx.push(a, c, b, b, c, d);
    }
  }
  let prev = topBase;
  for (let k = 1; k <= topRings; k++) {
    const cur = topBase + k * segs;
    for (let i = 0; i < segs; i++) {
      const a = prev + i, b = prev + (i + 1) % segs, c = cur + i, d = cur + (i + 1) % segs;
      idx.push(a, c, b, b, c, d);
    }
    prev = cur;
  }
  for (let i = 0; i < segs; i++) idx.push(prev + i, centreIdx, prev + (i + 1) % segs);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  return geo;
}

/**
 * A natural arch: two legs and a span, as one tube swept along a flattened
 * catenary and roughened like the columns. `span` is leg centre to leg centre.
 */
export function archGeometry(seed, { span = 16, rise = 11, thick = 2.6, depth = 3.4, baseY = 0, bury = 2.5 } = {}) {
  const r = rng(seed);
  const off = r() * 100;
  const half = span / 2;
  const pts = [];
  const N = 90;
  // A flattened arch: steep legs, broad crown.
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = Math.PI * t;
    const x = -Math.cos(a) * half;
    const y = Math.pow(Math.sin(a), 0.62) * rise - bury * (1 - Math.pow(Math.sin(a), 0.25));
    pts.push(new THREE.Vector3(x, y, 0));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const radial = 40;
  const verts = [];
  const tan = new THREE.Vector3(), nrm = new THREE.Vector3(), bin = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const c = curve.getPoint(t);
    curve.getTangent(t, tan);
    nrm.crossVectors(bin, tan).normalize();
    // Thicker at the feet, thinnest just off the crown, where it will one day break.
    const legs = Math.pow(Math.abs(t - 0.5) * 2, 3);
    const w = thick * (0.75 + 0.9 * legs) * (1 - 0.12 * Math.exp(-(((t - 0.42) / 0.06) ** 2)));
    const d = depth * (0.85 + 0.5 * legs);
    for (let k = 0; k < radial; k++) {
      const th = (k / radial) * Math.PI * 2;
      // A blocky section — sandstone breaks along its bedding and its joints —
      // rather than a pipe's ellipse.
      const c0 = Math.cos(th), s0 = Math.sin(th);
      const ca = Math.sign(c0) * Math.pow(Math.abs(c0), 0.55);
      const sa = Math.sign(s0) * Math.pow(Math.abs(s0), 0.55);
      const wy = c.y;
      const m = 1 + 0.08 * ledgeAt(baseY + wy) * Math.abs(sa)
        + 0.22 * fbm2(c0 * 1.6 + off + t * 2.2, s0 * 1.6 + t * 3.1, 3)
        + 0.06 * fbm2(c0 * 5 + off, s0 * 5 + t * 14, 2);
      const px = c.x + nrm.x * ca * w * m;
      const py = c.y + nrm.y * ca * w * m;
      const pz = sa * d * m;
      verts.push(px, py, pz);
    }
  }
  const idx = [];
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * radial + k, b = i * radial + (k + 1) % radial;
      const c = a + radial, dd = b + radial;
      idx.push(a, b, c, b, dd, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  return geo;
}

/* ---------------------------------------------------------------- material */

/**
 * Stone, painted in world space.
 *
 * @param {object} maps { detail: {map, normalMap}, sand: THREE.Texture, macro, strata }
 */
export function createRockMaterial({ detail, sand, macro, strata }, { sandCover = 1.0, varnish = 1.0, tint = null, lite = false } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: tint || 0xffffff, roughness: 0.93, metalness: 0.0 });
  // The far buttes are hundreds of metres off and mostly haze: they keep the
  // beds, the varnish and the sand, and drop the per-pixel relief.
  if (lite) mat.defines = { ROCK_LITE: '' };
  const uniforms = {
    uRDetail: { value: detail.map },
    uRDetailN: { value: detail.normalMap },
    uRSand: { value: sand },
    uRMacro: { value: macro },
    uRStrata: { value: strata },
    uRSandCover: { value: sandCover },
    uRVarnish: { value: varnish }
  };
  mat.userData.rockUniforms = uniforms;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vRW;
        varying vec3 vRN;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          vec4 rp = vec4(transformed, 1.0);
          vec3 rn = objectNormal;
          #ifdef USE_INSTANCING
            rp = instanceMatrix * rp;
            rn = mat3(instanceMatrix) * rn;
          #endif
          vRW = (modelMatrix * rp).xyz;
          vRN = normalize(mat3(modelMatrix) * rn);
        }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uRDetail;
        uniform sampler2D uRDetailN;
        uniform sampler2D uRSand;
        uniform sampler2D uRMacro;
        uniform sampler2D uRStrata;
        uniform float uRSandCover;
        uniform float uRVarnish;
        varying vec3 vRW;
        varying vec3 vRN;
        vec3 rTriW;
        float rSandAmt;
        vec3 rTriBlend(vec3 n) {
          vec3 w = pow(abs(n), vec3(4.0));
          return w / (w.x + w.y + w.z);
        }`)
      .replace('#include <map_fragment>', `
        {
          vec3 N = normalize(vRN);
          rTriW = rTriBlend(N);
          const float S = 0.33;
          vec3 dx = texture2D(uRDetail, vRW.zy * S).rgb;
          vec3 dy = texture2D(uRDetail, vRW.xz * S).rgb;
          vec3 dz = texture2D(uRDetail, vRW.xy * S).rgb;
          vec3 det = dx * rTriW.x + dy * rTriW.y + dz * rTriW.z;
          float lum = dot(det, vec3(0.33));
          float m = texture2D(uRMacro, vRW.xz / 37.0 + vRW.y / 53.0).r;
          // Bed contacts wander a little, as real ones do across a face.
          float yb = vRW.y + (m - 0.5) * 1.1;
          vec3 bed = texture2D(uRStrata, vec2(0.5, (yb - (${STRATA_Y0.toFixed(1)})) / ${STRATA_SPAN.toFixed(1)})).rgb;
          vec3 c = bed * (0.55 + 0.9 * lum);
          // Desert varnish: manganese streaks down the steep faces.
          float steep = 1.0 - abs(N.y);
          float streak = texture2D(uRMacro, vec2((vRW.x + vRW.z) * 0.09, vRW.y * 0.006)).r;
          c *= 1.0 - uRVarnish * steep * smoothstep(0.45, 0.8, streak) * 0.45;
          // Sand lies on whatever faces up.
          vec3 sand = texture2D(uRSand, vRW.xz / 5.0).rgb;
          rSandAmt = uRSandCover * smoothstep(0.55, 0.85, N.y + (m - 0.5) * 0.5 + (lum - 0.5) * 0.3);
          c = mix(c, sand * 0.95, rSandAmt);
          diffuseColor.rgb *= c;
        }`)
      .replace('#include <normal_fragment_maps>', `
        #ifndef ROCK_LITE
        {
          vec3 N = normalize(vRN);
          const float S = 0.33;
          // Two scales of the same bedded grain; green flipped (pbr-kit's maps
          // carry it inverted against three's frame).
          vec3 tx = texture2D(uRDetailN, vRW.zy * S).xyz * 2.0 - 1.0;
          vec3 ty = texture2D(uRDetailN, vRW.xz * S).xyz * 2.0 - 1.0;
          vec3 tz = texture2D(uRDetailN, vRW.xy * S).xyz * 2.0 - 1.0;
          vec3 fx = texture2D(uRDetailN, vRW.zy * S * 3.7 + 0.31).xyz * 2.0 - 1.0;
          vec3 fy = texture2D(uRDetailN, vRW.xz * S * 3.7 + 0.31).xyz * 2.0 - 1.0;
          vec3 fz = texture2D(uRDetailN, vRW.xy * S * 3.7 + 0.31).xyz * 2.0 - 1.0;
          tx = vec3(tx.xy + fx.xy * 0.6, tx.z); ty = vec3(ty.xy + fy.xy * 0.6, ty.z); tz = vec3(tz.xy + fz.xy * 0.6, tz.z);
          tx.y = -tx.y; ty.y = -ty.y; tz.y = -tz.y;
          float k = 1.5 * (1.0 - rSandAmt * 0.7);
          tx.xy *= k; ty.xy *= k; tz.xy *= k;
          // Whiteout blend (Golus): each projection's normal swizzled back into world space.
          tx = vec3(tx.xy + N.zy, abs(tx.z) * N.x);
          ty = vec3(ty.xy + N.xz, abs(ty.z) * N.y);
          tz = vec3(tz.xy + N.xy, abs(tz.z) * N.z);
          vec3 wN = normalize(tx.zyx * rTriW.x + ty.xzy * rTriW.y + tz.xyz * rTriW.z);
          normal = normalize((viewMatrix * vec4(wN, 0.0)).xyz);
        }
        #endif`);
  };
  mat.customProgramCacheKey = () => (lite ? 'erebus-rock-lite-v1' : 'erebus-rock-v1');
  return mat;
}

/** Record an instanced field's instances as part boxes, for the overlap check. */
export function recordInstanceBoxes(mesh) {
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
