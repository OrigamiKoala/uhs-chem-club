/**
 * kit.js — the structural stock Tallow's sheds and shelters are built from.
 *
 * A shelter made of boxes reads as a toy because real structure is never a
 * solid bar: a column is an I-section, a roof is corrugated sheet on purlins,
 * and the light rakes across the ribs of it. These return geometry in the
 * member's own frame, so a builder places a member by its centre.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * An I-section (H column / beam) running along +y, `len` long, centred.
 * `h` is the depth across the web (x), `w` the flange width (z).
 */
export function iBeamGeometry(len, { h = 0.2, w = 0.14, tf = 0.014, tw = 0.009 } = {}) {
  const web = new THREE.BoxGeometry(h - tf * 2, len, tw);
  const f1 = new THREE.BoxGeometry(tf, len, w);
  f1.translate(-(h - tf) / 2, 0, 0);
  const f2 = new THREE.BoxGeometry(tf, len, w);
  f2.translate((h - tf) / 2, 0, 0);
  const g = mergeGeometries([web, f1, f2]);
  web.dispose(); f1.dispose(); f2.dispose();
  return g;
}

/**
 * A corrugated sheet in the xz plane, `w` across the corrugations (x) and `d`
 * along them (z), with a thickness, so it has an underside and an edge.
 */
export function corrugatedGeometry(w, d, { pitch = 0.076, amp = 0.012, thick = 0.004 } = {}) {
  const nx = Math.max(8, Math.round(w / (pitch / 6)));
  const top = new THREE.PlaneGeometry(w, d, nx, 1);
  top.rotateX(-Math.PI / 2);
  const p = top.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setY(i, Math.sin((p.getX(i) / pitch) * Math.PI * 2) * amp);
  }
  const bottom = top.clone();
  const bp = bottom.attributes.position;
  for (let i = 0; i < bp.count; i++) bp.setY(i, bp.getY(i) - thick);
  // Flip the underside so it faces down.
  const idx = bottom.index.array;
  for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 1]; idx[i + 1] = t; }
  const g = mergeGeometries([top, bottom]);
  top.dispose(); bottom.dispose();
  g.computeVertexNormals();
  // Uvs by metre, so the plate texture lies at the same scale on every sheet.
  const gp = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < gp.count; i++) uv.setXY(i, gp.getX(i) / 2, gp.getZ(i) / 2);
  return g;
}
