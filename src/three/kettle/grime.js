/**
 * kettle/grime.js — Dirt that follows the building, baked once (the realism pass, `docs/plans/realism-kettle.md`).
 *
 * TWO THINGS, BOTH BAKED, NEITHER A LIGHT.
 *
 *   WALL GRIME (vertex colour). A works wall is darkest at its foot, where the floor's wet and dust lie against it,
 *   and under its roof, where a century of smoke has hung. Every wall slab is built here as a box in the world's own
 *   frame, its rows packed close at the floor and under the roof, and each vertex carries how dirty it is: a damp
 *   band measured from the floor on THAT side of the wall (the room's floor inside, the yard outside), soot measured
 *   down from the roof. The wall materials are clones with `vertexColors` (`wallMaterial`), and the bake keeps the
 *   colour (`mergeStatic(..., { keep: ['color'] })`).
 *
 *   CONTACT (one map). Inside the works there is no sun, so nothing a lamp lights is ever seated on the floor by a
 *   shadow. The contact map is the works' footprint at 0.25 m: every wall, column, and host's body rasterised in, then
 *   blurred at two radii (a tight dark line where a thing meets the floor, a broad dimming in corners and under
 *   machinery). The floors and the yard's ground read it in world x, z (`addContact`); nothing else changes. Rooms
 *   never stand over one another, so one 2D map serves every level.
 */

import * as THREE from 'three';

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

/* ------------------------------------------------------------------ wall grime */

/** How dirty a wall is at height `h` over the floor in front of it, `d` under its roof. 1 is clean. */
export function wallShade(h, d, inside) {
  const damp = 1 - 0.4 * Math.exp(-Math.max(0, h) / 0.3) - 0.12 * Math.exp(-Math.max(0, h) / 1.4);
  const soot = 1 - (inside ? 0.32 : 0.14) * (1 - smooth(0, 3.2, d));
  return Math.max(0.35, damp * soot);
}

/**
 * One wall slab in world coordinates, with its grime.
 *
 * @param {object} o
 * @param {number[]} o.centre [x, y, z]
 * @param {number[]} o.size [sx, sy, sz]
 * @param {(x: number, z: number) => number} o.floorAt the ground's height at a point (rooms' floors and the yard)
 * @param {number} o.roof the roof's underside over this wall (soot hangs from it)
 * @param {number[]} o.into the unit [dx, dz] pointing into the room this slab belongs to
 */
export function wallGeometry({ centre, size, floorAt, roof, into }) {
  const [cx, cy, cz] = centre, [sx, sy, sz] = size;
  const y0 = cy - sy / 2, y1 = cy + sy / 2;
  const alongX = sx >= sz;
  const len = alongX ? sx : sz;
  // The rows: close together at the floor (on both sides) and under the roof, two metres apart between.
  const lo = Math.min(floorAt(cx + into[0] * 0.8, cz + into[1] * 0.8), floorAt(cx - into[0] * 0.8, cz - into[1] * 0.8));
  const keys = [lo - 0.02, lo + 0.12, lo + 0.3, lo + 0.6, lo + 1.1, lo + 1.9, roof - 2.6, roof - 1.4, roof - 0.6];
  let rows = [y0, y1, ...keys.filter(k => k > y0 + 0.04 && k < y1 - 0.04)].sort((a, b) => a - b);
  const filled = [rows[0]];
  for (let i = 1; i < rows.length; i++) {
    const gap = rows[i] - filled[filled.length - 1];
    const n = Math.ceil(gap / 2.2);
    for (let k = 1; k < n; k++) filled.push(filled[filled.length - 1] + gap / n);
    if (rows[i] - filled[filled.length - 1] > 0.03) filled.push(rows[i]);
  }
  rows = filled;
  const along = Math.max(1, Math.ceil(len / 3));
  const g = new THREE.BoxGeometry(sx, sy, sz, alongX ? along : 1, rows.length - 1, alongX ? 1 : along);
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = g.attributes.uv;
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const t = Math.round(((p.getY(i) + sy / 2) / sy) * (rows.length - 1));
    const x = p.getX(i) + cx, y = rows[Math.max(0, Math.min(rows.length - 1, t))], z = p.getZ(i) + cz;
    p.setXYZ(i, x, y, z);
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
    // Metric uvs in the world's frame: a wall's courses run level with every other wall's.
    const ax = Math.abs(nx), ay = Math.abs(ny);
    uv.setXY(i, ay > 0.7 ? x : (ax > 0.7 ? z : x), ay > 0.7 ? z : y);
    // Which floor this face looks at: the one a short step out from it.
    const fx = x + nx * 0.6, fz = z + nz * 0.6;
    const inside = nx * into[0] + nz * into[1] > 0.5;
    const c = ay > 0.7 ? 1 : wallShade(y - floorAt(fx, fz), roof - y, inside);
    col[i * 3] = c; col[i * 3 + 1] = c * 0.985; col[i * 3 + 2] = c * 0.97;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

const WALL_MATS = new WeakMap();
/** The wall's own copy of a surface material, reading vertex colour (the grime). Shares every map. */
export function wallMaterial(m, own) {
  if (!m) return m;
  if (!WALL_MATS.has(m)) {
    const c = m.clone();
    c.vertexColors = true;
    c.name = `${m.name || 'wall'}-grimed`;
    c.userData = { ...m.userData, grimeOf: m };
    own?.(c);
    WALL_MATS.set(m, c);
  }
  return WALL_MATS.get(m);
}

/* ------------------------------------------------------------------ contact */

/**
 * The contact map over the works.
 *
 * @param {{ minX, maxX, minZ, maxZ }} bounds the works' footprint (padded here)
 * @param {Array<{ minX, maxX, minZ, maxZ }>} boxes wall and body footprints
 * @param {Array<{ x, z, radius }>} discs column and machine footprints
 * @returns {{ texture: THREE.DataTexture, rect: THREE.Vector4, sample: (x, z) => number }}
 *   `rect` is (x0, z0, 1/width, 1/depth); `sample` reads the same value the shader does (1 open floor, less in contact)
 */
export function buildContactMap(bounds, boxes, discs, { res = 0.25, pad = 6 } = {}) {
  const x0 = bounds.minX - pad, z0 = bounds.minZ - pad;
  const W = Math.ceil((bounds.maxX + pad - x0) / res), H = Math.ceil((bounds.maxZ + pad - z0) / res);
  const mask = new Float32Array(W * H);
  const px = x => (x - x0) / res, pz = z => (z - z0) / res;
  for (const b of boxes) {
    const i0 = Math.max(0, Math.floor(px(b.minX))), i1 = Math.min(W - 1, Math.ceil(px(b.maxX)) - 1);
    const j0 = Math.max(0, Math.floor(pz(b.minZ))), j1 = Math.min(H - 1, Math.ceil(pz(b.maxZ)) - 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) mask[j * W + i] = 1;
  }
  for (const d of discs) {
    const r = d.radius ?? d.r;
    const i0 = Math.max(0, Math.floor(px(d.x - r))), i1 = Math.min(W - 1, Math.ceil(px(d.x + r)));
    const j0 = Math.max(0, Math.floor(pz(d.z - r))), j1 = Math.min(H - 1, Math.ceil(pz(d.z + r)));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = x0 + (i + 0.5) * res - d.x, dz = z0 + (j + 0.5) * res - d.z;
      if (dx * dx + dz * dz <= r * r) mask[j * W + i] = 1;
    }
  }
  /** Three box passes each way: close to a gaussian of the given radius (in cells). */
  const blur = (src, rad) => {
    let a = src.slice(), b = new Float32Array(W * H);
    for (let pass = 0; pass < 3; pass++) {
      for (let j = 0; j < H; j++) {
        let acc = 0;
        for (let i = -rad; i <= rad; i++) acc += a[j * W + Math.max(0, Math.min(W - 1, i))];
        for (let i = 0; i < W; i++) {
          b[j * W + i] = acc / (2 * rad + 1);
          acc += a[j * W + Math.min(W - 1, i + rad + 1)] - a[j * W + Math.max(0, i - rad)];
        }
      }
      for (let i = 0; i < W; i++) {
        let acc = 0;
        for (let j = -rad; j <= rad; j++) acc += b[Math.max(0, Math.min(H - 1, j)) * W + i];
        for (let j = 0; j < H; j++) {
          a[j * W + i] = acc / (2 * rad + 1);
          acc += b[Math.min(H - 1, j + rad + 1) * W + i] - b[Math.max(0, j - rad) * W + i];
        }
      }
    }
    return a;
  };
  const tight = blur(mask, 1);     // about 0.3 m
  const broad = blur(mask, 4);     // about 1.2 m
  const data = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) {
    // Under a body the floor is never seen; at its edge the tight term makes the contact line, the broad one the pool.
    const occ = Math.min(1, tight[k] * 0.55 + broad[k] * 0.55);
    data[k] = Math.round(255 * (1 - 0.62 * occ));
  }
  const texture = new THREE.DataTexture(data, W, H, THREE.RedFormat, THREE.UnsignedByteType);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  const rect = new THREE.Vector4(x0, z0, 1 / (W * res), 1 / (H * res));
  const sample = (x, z) => {
    const i = Math.floor(px(x)), j = Math.floor(pz(z));
    if (i < 0 || j < 0 || i >= W || j >= H) return 1;
    return data[j * W + i] / 255;
  };
  return { texture, rect, sample, size: [W, H] };
}

/**
 * Put the contact map on a material (a floor, the ground): its albedo is multiplied by the map in world x, z, which
 * darkens it at every foot and in every corner, whatever lights it. Chains any earlier patch; opt-in.
 */
export function addContact(material, contact, { strength = 1 } = {}) {
  if (!material || !contact || material.userData.ktContact) return material;
  material.userData.ktContact = true;
  const prev = material.onBeforeCompile;
  const prevKey = material.customProgramCacheKey ? material.customProgramCacheKey() : '';
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.uniforms.uKtContact = { value: contact.texture };
    shader.uniforms.uKtContactRect = { value: contact.rect };
    shader.uniforms.uKtContactK = { value: strength };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vKtCPos;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vKtCPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uKtContact;
        uniform vec4 uKtContactRect;
        uniform float uKtContactK;
        varying vec3 vKtCPos;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec2 cuv = (vKtCPos.xz - uKtContactRect.xy) * uKtContactRect.zw;
          float occ = texture2D(uKtContact, cuv).r;
          diffuseColor.rgb *= mix(1.0, occ, uKtContactK);
        }`);
  };
  const key = `${prevKey}|ktcontact`;
  material.customProgramCacheKey = () => key;
  material.needsUpdate = true;
  return material;
}
