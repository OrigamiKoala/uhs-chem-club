/**
 * overlap.mjs — Does anything in this world occupy the same space as anything
 * else in it?
 *
 * THE RULE. Two separate objects may touch, may be bolted together and may be
 * bedded into the ground, but they may not be drawn through each other. A prop
 * standing inside another prop is the single most obvious sign that a world was
 * assembled by typing coordinates rather than by placing things.
 *
 * HOW IT IS MEASURED. A built scene is walked and every drawn mesh is assigned
 * to the top-level object it belongs to — one crate, one bench, one evaporator.
 * Parts INSIDE an object are expected to interpenetrate, because that is what a
 * bolt through a plate is; parts belonging to DIFFERENT objects are not. Every
 * cross-object pair of world-space bounding boxes is then tested, through a
 * uniform grid so the cost stays linear rather than quadratic in prop count.
 *
 * WHAT IS EXEMPT, AND WHY.
 *   phys: 'ground'  — terrain, evaporation pans, landing aprons. Surfaces that
 *                     everything else legitimately sits in or on.
 *   phys: 'ambient' — the sky dome and the horizon mesas. Not places.
 *   transparent     — painted stains, hazard striping, placards. A decal is a
 *                     mark ON a surface, not a body beside it.
 *
 * The tolerance is the depth of interpenetration treated as contact rather than
 * as a fault: a bounding box is a loose fit around a rotated or round object,
 * so two adjacent props routinely share a couple of centimetres of empty box.
 */

import * as THREE from 'three';

const EXEMPT = new Set(['ground', 'ambient', 'decal']);

/** The `phys` tag on an object or the nearest ancestor that carries one. */
function physTag(obj, root) {
  let n = obj;
  while (n && n !== root) {
    if (n.userData?.phys) return n.userData.phys;
    n = n.parent;
  }
  return null;
}

/** The top-level child of `root` that this object hangs under. */
function ownerOf(obj, root) {
  let n = obj;
  while (n && n.parent && n.parent !== root) n = n.parent;
  return n;
}

/**
 * @param {THREE.Object3D} root the scene
 * @param {{tolerance?: number, minVolume?: number, label?: Function}} opts
 * @returns {Array<{a: string, b: string, depth: number, at: number[]}>}
 */
export function findOverlaps(root, {
  tolerance = 0.06,
  minVolume = 1e-5,
  label = null
} = {}) {
  root.updateMatrixWorld(true);

  const boxes = [];

  /*
   * A prop that has been baked into one mesh per material carries the boxes
   * its parts had before the bake (`mergeStatic` records them). Reading those
   * keeps the check as precise as it was on the unbaked prop — otherwise a
   * long, thin, mostly-empty object like a pipe bridge would be tested as the
   * single enormous box that encloses it.
   */
  const bakedOwners = new Set();
  root.traverse(obj => {
    const parts = obj.userData?.partBoxes;
    if (!parts || !parts.length) return;
    if (EXEMPT.has(physTag(obj, root))) return;
    const owner = ownerOf(obj, root);
    bakedOwners.add(obj);
    obj.updateMatrixWorld(true);
    for (const local of parts) {
      const box = local.clone().applyMatrix4(obj.matrixWorld);
      const size = box.getSize(new THREE.Vector3());
      if (size.x * size.y * size.z < minVolume) continue;
      box.expandByScalar(-tolerance);
      if (box.isEmpty()) continue;
      boxes.push({
        box,
        owner,
        name: label ? label(owner, obj) : (owner.name || owner.uuid.slice(0, 6))
      });
    }
  });

  /** True when this mesh's shape is already covered by a recorded part list. */
  const isBaked = obj => {
    let n = obj;
    while (n && n !== root) {
      if (bakedOwners.has(n)) return true;
      n = n.parent;
    }
    return false;
  };

  root.traverse(obj => {
    if (!obj.isMesh || !obj.geometry) return;
    if (isBaked(obj)) return;
    if (EXEMPT.has(physTag(obj, root))) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    if (mats.some(m => m && m.transparent)) return;

    // The mesh's OWN geometry, not `setFromObject` — that walks children too,
    // so a holo-table with an orrery floating above it would be measured as one
    // three-metre block and would report collisions with everything near the
    // pedestal. Every part is measured as the part it is.
    if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
    const box = obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld);
    if (!isFinite(box.min.x) || box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    if (size.x * size.y * size.z < minVolume) return;

    // Shrink by the tolerance so touching is not reported as overlapping.
    box.expandByScalar(-tolerance);
    if (box.isEmpty()) return;

    const owner = ownerOf(obj, root);
    boxes.push({
      box,
      owner,
      name: label ? label(owner, obj) : (owner.name || owner.uuid.slice(0, 6))
    });
  });

  // Uniform grid broad phase: at ~500 boxes over a 240 m world a quadratic
  // sweep is affordable, but this file is also aimed at the ship and at
  // whatever is built next, so it is written to stay linear.
  const CELL = 4;
  const grid = new Map();
  const key = (i, j, k) => `${i}|${j}|${k}`;
  boxes.forEach((entry, idx) => {
    const { min, max } = entry.box;
    for (let i = Math.floor(min.x / CELL); i <= Math.floor(max.x / CELL); i++) {
      for (let j = Math.floor(min.y / CELL); j <= Math.floor(max.y / CELL); j++) {
        for (let k = Math.floor(min.z / CELL); k <= Math.floor(max.z / CELL); k++) {
          const g = key(i, j, k);
          if (!grid.has(g)) grid.set(g, []);
          grid.get(g).push(idx);
        }
      }
    }
  });

  const seen = new Set();
  const hits = [];
  for (const bucket of grid.values()) {
    for (let a = 0; a < bucket.length; a++) {
      for (let b = a + 1; b < bucket.length; b++) {
        const ia = bucket[a], ib = bucket[b];
        const A = boxes[ia], B = boxes[ib];
        if (A.owner === B.owner) continue;          // one object's own parts
        const pairKey = ia < ib ? `${ia}:${ib}` : `${ib}:${ia}`;
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        if (!A.box.intersectsBox(B.box)) continue;

        const overlap = A.box.clone().intersect(B.box);
        const size = overlap.getSize(new THREE.Vector3());
        const depth = Math.min(size.x, size.y, size.z);
        const centre = overlap.getCenter(new THREE.Vector3());
        hits.push({
          a: A.name,
          b: B.name,
          boxA: [A.box.min.toArray().map(n=>+n.toFixed(2)), A.box.max.toArray().map(n=>+n.toFixed(2))],
          boxB: [B.box.min.toArray().map(n=>+n.toFixed(2)), B.box.max.toArray().map(n=>+n.toFixed(2))],
          depth,
          at: [+centre.x.toFixed(2), +centre.y.toFixed(2), +centre.z.toFixed(2)]
        });
      }
    }
  }

  // Deepest first: the worst intersection is the one worth reading about.
  hits.sort((x, y) => y.depth - x.depth);
  return hits;
}
