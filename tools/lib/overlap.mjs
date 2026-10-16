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
 * Every drawn body in the scene as a box, with the top-level object that owns it.
 * Baked props contribute their recorded part boxes, instanced fields one box per
 * instance, everything else its own mesh. `frame` (a Matrix4, default identity)
 * is applied after each body's world matrix, so a caller can ask for the boxes in
 * another frame (the bench bay's): a body turned with its frame then boxes tight.
 *
 * @param {THREE.Object3D} root the scene
 * @param {{tolerance?: number, minVolume?: number, label?: Function, frame?: THREE.Matrix4,
 *          skip?: (obj: THREE.Object3D) => boolean}} opts `skip` drops a body (and, for a
 *          baked group, all its parts) by object
 * @returns {Array<{box: THREE.Box3, owner: THREE.Object3D, name: string, mesh?: THREE.Mesh}>}
 *   `mesh` is the source of an unbaked body (a baked part has none)
 */
export function collectBoxes(root, {
  tolerance = 0.06,
  minVolume = 1e-5,
  label = null,
  frame = null,
  skip = null
} = {}) {
  root.updateMatrixWorld(true);

  const boxes = [];
  const toFrame = obj => (frame ? new THREE.Matrix4().multiplyMatrices(frame, obj.matrixWorld) : obj.matrixWorld);
  const under = (obj, test) => {
    for (let n = obj; n && n !== root; n = n.parent) if (test(n)) return true;
    return false;
  };

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
    if (skip && under(obj, skip)) return;
    const owner = ownerOf(obj, root);
    bakedOwners.add(obj);
    obj.updateMatrixWorld(true);
    const m = toFrame(obj);
    for (const local of parts) {
      const box = local.clone().applyMatrix4(m);
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
  const isBaked = obj => under(obj, n => bakedOwners.has(n));

  root.traverse(obj => {
    if (!obj.isMesh || !obj.geometry) return;
    if (isBaked(obj)) return;
    if (EXEMPT.has(physTag(obj, root))) return;
    if (skip && under(obj, skip)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    if (mats.some(m => m && m.transparent)) return;

    // The mesh's OWN geometry, not `setFromObject` — that walks children too,
    // so a holo-table with an orrery floating above it would be measured as one
    // three-metre block and would report collisions with everything near the
    // pedestal. Every part is measured as the part it is.
    if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
    const m = toFrame(obj);
    const owner = ownerOf(obj, root);
    const push = box => {
      if (!isFinite(box.min.x) || box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3());
      if (size.x * size.y * size.z < minVolume) return;
      // Shrink by the tolerance so touching is not reported as overlapping.
      box.expandByScalar(-tolerance);
      if (box.isEmpty()) return;
      boxes.push({
        box,
        owner,
        mesh: obj,
        name: label ? label(owner, obj) : (owner.name || owner.uuid.slice(0, 6))
      });
    };
    if (frame && obj.isInstancedMesh) {
      // A field of instances is measured per instance, not as one block round them all.
      const im = new THREE.Matrix4();
      for (let i = 0; i < obj.count; i++) {
        obj.getMatrixAt(i, im);
        push(obj.geometry.boundingBox.clone().applyMatrix4(im.premultiply(m)));
      }
      return;
    }
    push(obj.geometry.boundingBox.clone().applyMatrix4(m));
  });

  return boxes;
}

/** Whether any triangle of `mesh` (carried into `frame`) passes through `box`. */
function surfaceTouches(mesh, frame, box) {
  mesh.updateMatrixWorld(true);
  const m = new THREE.Matrix4().multiplyMatrices(frame, mesh.matrixWorld);
  const pos = mesh.geometry.attributes.position;
  const index = mesh.geometry.index;
  const tri = new THREE.Triangle();
  const n = index ? index.count : pos.count;
  const vtx = k => new THREE.Vector3().fromBufferAttribute(pos, index ? index.getX(k) : k).applyMatrix4(m);
  for (let k = 0; k < n; k += 3) {
    tri.set(vtx(k), vtx(k + 1), vtx(k + 2));
    if (box.intersectsTriangle(tri)) return true;
  }
  return false;
}

/**
 * Which bodies stand inside a clearance volume. Bodies are measured in the
 * volume's own frame (`frame` takes world to that frame), so a bay that is turned
 * to face its approach is tested against bodies turned with it, not against the
 * loose world box round a turned body.
 *
 * @param {THREE.Object3D} root the scene
 * @param {THREE.Matrix4} frame world -> bay frame
 * @param {Record<string, {min: number[], max: number[]}>} volumes by name
 * @param {{skip?: Function, tolerance?: number, bodies?: object[]}} opts `skip` exempts the bench's own
 *        bodies; `bodies` are `collectBoxes(root, {frame, ...})` already taken, to share between checks
 * @returns {Array<{volume: string, body: string, depth: number, at: number[]}>}
 */
export function findBayIntrusions(root, frame, volumes, { skip = null, tolerance = 0.06, bodies: given = null } = {}) {
  const bodies = given || collectBoxes(root, { frame, skip, tolerance });
  const hits = [];
  for (const [volume, v] of Object.entries(volumes)) {
    const vb = new THREE.Box3(new THREE.Vector3(...v.min), new THREE.Vector3(...v.max));
    for (const { box, name, mesh } of bodies) {
      if (!box.intersectsBox(vb)) continue;
      // An OPEN SHELL (a vault, a rib, a tube) has no inside: its box is only a candidate and the
      // verdict is its surface. A closed body is solid and its box stands.
      if (mesh && (mesh.userData?.openShell || mesh.geometry?.type === 'TubeGeometry') &&
          !surfaceTouches(mesh, frame, vb)) continue;
      const overlap = box.clone().intersect(vb);
      const size = overlap.getSize(new THREE.Vector3());
      const c = overlap.getCenter(new THREE.Vector3());
      hits.push({
        volume,
        body: name,
        depth: Math.min(size.x, size.y, size.z),
        at: [+c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(2)]
      });
    }
  }
  hits.sort((x, y) => y.depth - x.depth);
  return hits;
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
  const boxes = collectBoxes(root, { tolerance, minVolume, label });

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
