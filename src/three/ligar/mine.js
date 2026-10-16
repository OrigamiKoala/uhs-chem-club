/**
 * mine.js — The workings under Ligar's hills, built from `mine-plan.js`.
 *
 * TWO GROUPS, BECAUSE THEY ARE TWO KINDS OF THING.
 *   mine-rock   the ground: floors, the walls in section (the same columns the quarry's faces are, a
 *               tunnel's standing a hand's breadth proud where the pit's stand half a metre), the
 *               roofs, the headwalls over each portal. `phys: 'ground'`, so everything that stands in
 *               the workings is measured against it as it is against the pavement.
 *   mine-sets   what people put in: steel and timber sets every 2.4 m, the rail down the main adit and
 *               the decline, the vent duct and the cable on its hangers, each portal's frame, and the
 *               lamps along the drifts. Bodies, baked into one mesh per material.
 *
 * A CHAMBER IS NOT FURNISHED HERE. Its bench is built into a host (`ligar/stations.js`), which also
 * hangs the chamber's lamps.
 *
 * THE LIGHT. Nothing under a hill is lit by the sun or the sky: `setLigarCover` (atmosphere.js) takes
 * both out of every fragment inside a working's box, so on a phone, with no shadow map, a drift is as
 * dark as it is on a desktop with one. Light underground is lamps, in the world's pool of three.
 */

import * as THREE from 'three';
import { RockBuilder, columnWall } from './basalt.js';
import { ROOF, PROUD, SIDE } from './mine-plan.js';
import { cableRun } from '../materials/pbr-kit.js';

/** Underground a lamp is the only light there is (the cover mask takes the sun and sky away), so it reaches further. */
export const UNDERGROUND_LAMP = { intensity: 12, distance: 14 };

const hash = str => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

/** A box with its texture laid in metres, not stretched over the face. */
function texturedBox(w, sx, sy, sz, scale = 2.5) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv;
  const n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [a, b] = ax > 0.5 ? [sz, sy] : ay > 0.5 ? [sx, sz] : [sx, sy];
    uv.setXY(i, uv.getX(i) * a / scale, uv.getY(i) * b / scale);
  }
  return w.own(g);
}

/** The floor of a volume: a graded plane in the scoria the quarry's yard is. */
function floorGeometry(plan, v) {
  const r = v.rect;
  const sx = r.maxX - r.minX, sz = r.maxZ - r.minZ;
  const nx = Math.max(1, Math.ceil(sx / 1.5)), nz = Math.max(1, Math.ceil(sz / 1.5));
  const g = new THREE.PlaneGeometry(sx, sz, nx, nz);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (r.minX + r.maxX) / 2;
    const z = p.getZ(i) + (r.minZ + r.maxZ) / 2;
    p.setXYZ(i, x, plan.floorOf(v, x, z), z);
    uv.setXY(i, x / 2.5, z / 2.5);
  }
  g.computeVertexNormals();
  g.setAttribute('uv1', g.attributes.uv.clone());
  return g;
}

/** The roof of a tunnel volume: a slab on the wall planes, tilted with its floor. */
function roofSlab(w, plan, v) {
  const r = v.rect;
  const sx = r.maxX - r.minX + 1.6, sz = r.maxZ - r.minZ + 1.6;
  const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
  const f = v.floor;
  const thick = 0.8;
  const slab = new THREE.Mesh(texturedBox(w, sx, thick, sz, 3.0), w.tubeMat);
  slab.position.set(cx, plan.floorOf(v, cx, cz) + ROOF + thick / 2, cz);
  if (f.y1 !== undefined && f.y1 !== f.y0) {
    const g = (f.y1 - f.y0) / (f.to - f.from);
    if (f.axis === 'x') slab.rotation.z = Math.atan(g); else slab.rotation.x = -Math.atan(g);
  }
  slab.castShadow = slab.receiveShadow = w.t4;
  slab.name = `roof-${v.id}`;
  return slab;
}

/**
 * Build the rock and the furniture of every working.
 * @param {object} w the LigarWorld (materials, `own`, `rockMesh`, `surfaceHeight`, `buildLuminaire`, `mine`)
 * @returns {{ rock: THREE.Group, sets: THREE.Group }}
 */
export function buildMine(w) {
  const plan = w.mine;
  const rock = new THREE.Group();
  rock.name = 'mine-rock';
  rock.userData.phys = 'ground';
  const sets = new THREE.Group();
  sets.name = 'mine-sets';

  w.mineFloorMat = w.own(w.scoriaSet.clone());
  w.mineFloorMat.userData.weather = { ash: 0.12, damp: 0.55, weep: 0.4 };

  const box = (g, [sx, sy, sz], mat, [x, y, z], rot = null, shadow = false) => {
    const m = new THREE.Mesh(w.own(new THREE.BoxGeometry(sx, sy, sz)), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (shadow) m.castShadow = m.receiveShadow = w.t4;
    g.add(m);
    return m;
  };

  for (const v of plan.volumes) {
    const tunnel = v.kind !== 'cutting';
    const floorAt = (x, z) => plan.floorOf(v, x, z);

    // THE FLOOR.
    const floor = new THREE.Mesh(w.own(floorGeometry(plan, v)), w.mineFloorMat);
    floor.name = `floor-${v.id}`;
    floor.receiveShadow = w.t4;
    rock.add(floor);

    // THE WALLS, in section: one merged mesh of real columns per volume.
    const rb = new RockBuilder();
    const lipAt = tunnel ? (x, z) => floorAt(x, z) + ROOF : (x, z) => w.surfaceHeight(x, z);
    const baseSeed = hash(v.id);
    let n = 0;
    for (const seg of plan.wallSegments(v)) {
      columnWall(rb, {
        ax: seg.ax, az: seg.az, bx: seg.bx, bz: seg.bz, dirX: seg.dirX, dirZ: seg.dirZ,
        floorY: plan.floorOf(v, seg.ax, seg.az), floorAt, lipAt,
        seed: (baseSeed + n++ * 0x9e37) >>> 0, pitch: tunnel ? 0.95 : 0.9, t4: w.t4,
        proud: PROUD
      });
    }
    // THE HEADWALL over a portal: the hill, in section, above the opening the adit leaves.
    if (!tunnel) {
      for (const o of v.openings.filter(op => op.to)) {
        const side = SIDE[o.side];
        const r = v.rect;
        const plane = o.side === 'minX' ? r.minX : o.side === 'maxX' ? r.maxX : o.side === 'minZ' ? r.minZ : r.maxZ;
        const a = side.along === 'z' ? [plane, o.lo, plane, o.hi] : [o.lo, plane, o.hi, plane];
        const above = plan.floorOf(v, a[0], a[1]) + ROOF + 0.4;
        columnWall(rb, {
          ax: a[0], az: a[1], bx: a[2], bz: a[3], dirX: side.dir[0], dirZ: side.dir[1],
          floorY: above, floorAt: () => above, lipAt: (x, z) => w.surfaceHeight(x, z),
          seed: (baseSeed ^ 0x51ed) >>> 0, pitch: 0.9, t4: w.t4, proud: PROUD
        });
      }
    }
    const walls = w.rockMesh(rb, `walls-${v.id}`);
    rock.add(walls);

    // THE ROOF.
    if (tunnel) rock.add(roofSlab(w, plan, v));
  }

  /* ---------------------------------------------------------- the furniture */
  const steel = w.darkSteelMat, pipe = w.pipeMat, timber = w.timberMat;
  const lampAt = (x, y, z) => sets.add(w.buildLuminaire(x, y, z, UNDERGROUND_LAMP));

  for (const v of plan.volumes) {
    const r = v.rect;
    const [length, axis] = (r.maxX - r.minX) >= (r.maxZ - r.minZ) ? [r.maxX - r.minX, 'x'] : [r.maxZ - r.minZ, 'z'];
    const across = axis === 'x' ? (r.minZ + r.maxZ) / 2 : (r.minX + r.maxX) / 2;
    const start = axis === 'x' ? r.minX : r.minZ;
    const at = s => axis === 'x' ? [start + s, across] : [across, start + s];   // (x, z) at s along the axis
    const y0 = s => plan.floorOf(v, ...at(s));
    const half = ((axis === 'x' ? r.maxZ - r.minZ : r.maxX - r.minX)) / 2;

    if (v.kind === 'drift') {
      const bearing = axis === 'x' ? [0, 0] : [0, Math.PI / 2];
      // Steel sets every 2.4 m, alternating with timber: two legs hugging the walls and a cap.
      const count = Math.max(1, Math.floor((length - 0.8) / 2.4));
      const pitch = length / count;
      for (let i = 0; i < count; i++) {
        const s = pitch * (i + 0.5);
        const [x, z] = at(s);
        const y = y0(s);
        const steelSet = i % 2 === 0;
        const mat = steelSet ? steel : timber;
        const leg = steelSet ? 0.2 : 0.26;
        for (const side of [-1, 1]) {
          const lx = axis === 'x' ? x : x + side * (half - 0.16);
          const lz = axis === 'x' ? z + side * (half - 0.16) : z;
          box(sets, [leg, ROOF - 0.2, leg], mat, [lx, y + (ROOF - 0.2) / 2, lz], null, true);
        }
        const capSize = axis === 'x' ? [leg, leg * 1.2, half * 2 - 0.1] : [half * 2 - 0.1, leg * 1.2, leg];
        box(sets, capSize, mat, [x, y + ROOF - 0.3, z], null, true);
        // Lagging between this set and the next, on timber ones: planks laid over the cap.
        if (!steelSet) {
          const plank = axis === 'x' ? [pitch - 0.3, 0.05, half * 2 - 0.2] : [half * 2 - 0.2, 0.05, pitch - 0.3];
          box(sets, plank, timber, [x, y + ROOF - 0.18, z]);
        }
        // Rock bolts in the roof between the legs, with their plates.
        for (const k of [-0.5, 0.5]) {
          const bx = axis === 'x' ? x + 1.2 : x + k * (half - 0.3);
          const bz = axis === 'x' ? z + k * (half - 0.3) : z + 1.2;
          box(sets, [0.16, 0.02, 0.16], steel, [bx, y + ROOF - 0.02, bz]);
          box(sets, [0.03, 0.3, 0.03], pipe, [bx, y + ROOF - 0.17, bz]);
        }
      }
      void bearing;

      // The vent duct along one side of the roof, on hangers; the cable on the other.
      const nSeg = Math.max(2, Math.round(length / 2.4));
      const duct = new THREE.Mesh(w.own(new THREE.CylinderGeometry(0.3, 0.3, length - 0.2, 14)), w.plateMat);
      const mid = at(length / 2);
      const slope = (y0(length) - y0(0)) / length;
      duct.position.set(mid[0] + (axis === 'x' ? 0 : -half + 0.65), y0(length / 2) + ROOF - 0.62, mid[1] + (axis === 'x' ? -half + 0.65 : 0));
      if (axis === 'x') { duct.rotation.z = Math.PI / 2 + Math.atan(slope); } else { duct.rotation.x = Math.PI / 2 - Math.atan(slope); }
      duct.castShadow = w.t4;
      sets.add(duct);
      for (let i = 0; i < nSeg; i++) {
        const s = length * (i + 0.5) / nSeg;
        const [x, z] = at(s);
        box(sets, [0.04, 0.34, 0.12], steel, [x + (axis === 'x' ? 0 : -half + 0.65), y0(s) + ROOF - 0.3, z + (axis === 'x' ? -half + 0.65 : 0)]);
      }
      for (let i = 0; i < nSeg; i++) {
        const a = at(length * i / nSeg), b = at(length * (i + 1) / nSeg);
        const lat = half - 0.5;
        const pa = axis === 'x' ? [a[0], y0(length * i / nSeg) + ROOF - 0.35, a[1] + lat] : [a[0] + lat, y0(length * i / nSeg) + ROOF - 0.35, a[1]];
        const pb = axis === 'x' ? [b[0], y0(length * (i + 1) / nSeg) + ROOF - 0.35, b[1] + lat] : [b[0] + lat, y0(length * (i + 1) / nSeg) + ROOF - 0.35, b[1]];
        const cable = cableRun(pa, pb, steel, { sag: 0.1, radius: 0.025, segments: 6 });
        w.own(cable.userData.ownGeometry);
        sets.add(cable);
      }

      // A lamp every 6 m along the middle of the roof.
      const lamps = Math.max(1, Math.round(length / 6));
      for (let i = 0; i < lamps; i++) {
        const s = length * (i + 0.5) / lamps;
        const [x, z] = at(s);
        lampAt(x, y0(s) + ROOF - 0.42, z);
      }
    }
  }

  // THE RAIL: two rails and their sleepers from the foot of each decline's cutting to the end of its adit.
  for (const run of [['cut-a1', 'adit-a1'], ['cut-b1', 'dr-b1']]) {
    const vs = run.map(id => plan.byId.get(id)).filter(Boolean);
    if (vs.length < 2) continue;
    const minX = Math.min(...vs.map(v => v.rect.minX)) + 0.6, maxX = Math.max(...vs.map(v => v.rect.maxX)) - 0.4;
    const zc = (vs[0].rect.minZ + vs[0].rect.maxZ) / 2;
    const yAt = x => plan.floorAt(x, zc) ?? 0;
    for (let x = minX; x <= maxX; x += 0.9) {
      box(sets, [0.14, 0.1, 1.3], timber, [x, yAt(x) + 0.05, zc]);
    }
    const g = (yAt(maxX) - yAt(minX)) / (maxX - minX);
    for (const dz of [-0.45, 0.45]) {
      const len = Math.hypot(maxX - minX, yAt(maxX) - yAt(minX));
      const rail = new THREE.Mesh(w.own(new THREE.BoxGeometry(len, 0.09, 0.07)), steel);
      rail.position.set((minX + maxX) / 2, (yAt(minX) + yAt(maxX)) / 2 + 0.14, zc + dz);
      rail.rotation.z = Math.atan(g);
      sets.add(rail);
    }
  }

  // EACH PORTAL'S FRAME: two legs and a header on the cutting side of the headwall, with a lamp on it.
  for (const c of plan.cuttings) {
    for (const o of c.openings.filter(op => op.to)) {
      const side = SIDE[o.side];
      const r = c.rect;
      const plane = o.side === 'minX' ? r.minX : o.side === 'maxX' ? r.maxX : o.side === 'minZ' ? r.minZ : r.maxZ;
      const alongMid = (o.lo + o.hi) / 2;
      const wid = o.hi - o.lo;
      const [ox, oz] = [plane + side.dir[0] * 0.3, plane + side.dir[1] * 0.3];
      const px = side.along === 'z' ? ox : alongMid;
      const pz = side.along === 'z' ? alongMid : oz;
      const y = plan.floorOf(c, px, pz);
      for (const k of [-1, 1]) {
        const lx = side.along === 'z' ? px : px + k * (wid / 2 - 0.2);
        const lz = side.along === 'z' ? pz + k * (wid / 2 - 0.2) : pz;
        box(sets, [0.45, ROOF, 0.45], steel, [lx, y + ROOF / 2, lz], null, true);
        box(sets, [0.7, 0.14, 0.7], w.plateMat, [lx, y + 0.07, lz]);
      }
      const hdr = side.along === 'z' ? [0.5, 0.5, wid] : [wid, 0.5, 0.5];
      box(sets, hdr, steel, [px, y + ROOF + 0.1, pz], null, true);
      lampAt(px + side.dir[0] * 0.9, y + ROOF - 0.5, pz + side.dir[1] * 0.9);
    }
  }

  return { rock, sets };
}
