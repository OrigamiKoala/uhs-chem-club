/**
 * lander.js — SANDSTALKER, the survey lander parked by the first pylon.
 *
 * It used to be a five-sided cone with two cylinders stuck to it. It is now a
 * small working craft built the way one is: a lofted hull of chamfered frames,
 * a glazed flight deck in the chin, two engine pods on pylons with intake lips
 * and nozzle bells burnt bronze by use, radiator fins along the spine, a sensor
 * mast, four articulated legs that each reach down to the ground under THEM
 * (the basin is not level here, so no two are the same length), and a bow ramp
 * lowered onto the sand toward where the player arrives.
 *
 * Everything stays inside a 4.3 m radius of the craft's centre, because the
 * first and last pylons' guy stakes stand five metres off it.
 */

import * as THREE from 'three';
import {
  treadPlate, buildMaterial, texSize, boltLine, cableRun, hazardStripe, mergeStatic
} from '../materials/pbr-kit.js';
import { hullMaterial } from './surfaces.js';

/**
 * Loft a hull through cross-sections. Each section is { z, pts: [[x, y], ...] }
 * with the same number of points, wound the same way; the ends are capped.
 * UVs are laid in metres so a plate texture keeps one scale across the hull.
 */
export function loft(sections, { capStart = true, capEnd = true, uvScale = 0.5 } = {}) {
  const n = sections[0].pts.length;
  const pos = [], uv = [], idx = [];
  const perim = pts => pts.reduce((t, p, i) => t + Math.hypot(p[0] - pts[(i + 1) % n][0], p[1] - pts[(i + 1) % n][1]), 0);
  // Plating runs along the hull: a seam that starts at a frame corner stays on
  // that corner to the nose, so u is the FRACTION of the way round each frame,
  // scaled by the widest frame. Narrow frames get narrower panels, as a real
  // tapering hull does.
  const ref = Math.max(...sections.map(sct => perim(sct.pts)));
  for (let s = 0; s < sections.length; s++) {
    const { z, pts } = sections[s];
    const P = perim(pts);
    let run = 0;
    for (let i = 0; i <= n; i++) {
      const p = pts[i % n];
      if (i > 0) {
        const q = pts[(i - 1) % n];
        run += Math.hypot(p[0] - q[0], p[1] - q[1]);
      }
      pos.push(p[0], p[1], z);
      uv.push((run / P) * ref * uvScale, z * uvScale);
    }
  }
  const row = n + 1;
  for (let s = 0; s < sections.length - 1; s++) {
    for (let i = 0; i < n; i++) {
      const a = s * row + i, b = a + 1, c = a + row, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const cap = (s, flip) => {
    const { z, pts } = sections[s];
    const cx = pts.reduce((t, p) => t + p[0], 0) / n;
    const cy = pts.reduce((t, p) => t + p[1], 0) / n;
    const base = pos.length / 3;
    pos.push(cx, cy, z); uv.push(0, 0);
    for (let i = 0; i < n; i++) { pos.push(pts[i][0], pts[i][1], z); uv.push(pts[i][0] * uvScale, pts[i][1] * uvScale); }
    for (let i = 0; i < n; i++) {
      const a = base + 1 + i, b = base + 1 + (i + 1) % n;
      if (flip) idx.push(base, b, a); else idx.push(base, a, b);
    }
  };
  // Frames wind counter-clockwise seen from +z, so the tail cap is flipped to face aft.
  if (capStart) cap(0, true);
  if (capEnd) cap(sections.length - 1, false);
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  return geo;
}

/** A chamfered-rectangle frame, `w` wide, from `y0` to `y1`, corners cut by `c`. */
export function frame(w, y0, y1, c, cb = c, belly = 0) {
  const h = w / 2;
  return [
    [-h + cb, y0 - belly], [h - cb, y0 - belly], [h, y0 + cb], [h, y1 - c], [h - c, y1],
    [-h + c, y1], [-h, y1 - c], [-h, y0 + cb]
  ];
}

/** A lathe about the z axis from an [r, z] profile. */
function latheZ(profile, segs = 20) {
  const g = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), segs);
  g.rotateX(Math.PI / 2);
  return g;
}

function cyl(r0, r1, len, segs, mat) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, segs), mat);
}

/** Point a mesh built along +y from `a` to `b`. */
function strut(mesh, a, b) {
  const d = b.clone().sub(a);
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return mesh;
}

/**
 * Build the lander. `groundAt(lx, lz)` gives ground height in the lander's own
 * frame (relative to its origin), so the legs can reach it.
 */
export function buildLander({ groundAt = () => 0 } = {}) {
  const group = new THREE.Group();
  group.name = 'sandstalker';

  // Sun-bleached field paint over a darker primer, scoured at every seam.
  const hullMat = hullMaterial({ tint: '#e2d4bc', dust: 0.55 });
  const darkMat = hullMaterial({ tint: '#5e554c', dust: 0.45 });
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0x241e1a, roughness: 0.88, metalness: 0.45 });
  const burntMat = new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: 0.42, metalness: 0.92 });
  const nozzleInMat = new THREE.MeshStandardMaterial({ color: 0x120f0d, roughness: 0.9, metalness: 0.3, side: THREE.DoubleSide });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x8a8278, roughness: 0.38, metalness: 0.95 });
  const pistonMat = new THREE.MeshStandardMaterial({ color: 0xb8b2a8, roughness: 0.22, metalness: 1.0 });
  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x191613, roughness: 0.95, metalness: 0.0 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x14100d, roughness: 0.06, metalness: 0.35, envMapIntensity: 1.4 });
  const treadMat = buildMaterial(treadPlate({ base: '#6a6254', seed: 12, weather: 0.8, size: texSize(256) }), { repeat: 1, roughness: 1.0 });

  /* ---- hull: frames from the tail (−z) to the nose (+z) ---- */
  const H0 = 1.55;                       // belly height above the pads' plane
  const sections = [
    { z: -4.25, pts: frame(2.3, H0 + 0.35, H0 + 1.75, 0.35) },
    { z: -3.9, pts: frame(2.8, H0 + 0.1, H0 + 2.05, 0.45) },
    { z: -2.6, pts: frame(3.1, H0, H0 + 2.25, 0.55, 0.4, 0.05) },
    { z: 0.2, pts: frame(3.2, H0, H0 + 2.3, 0.6, 0.45, 0.08) },
    { z: 1.6, pts: frame(3.0, H0 + 0.02, H0 + 2.1, 0.62, 0.45, 0.05) },
    { z: 2.7, pts: frame(2.6, H0 + 0.1, H0 + 1.7, 0.6, 0.4) },
    { z: 3.55, pts: frame(1.8, H0 + 0.25, H0 + 1.15, 0.45, 0.35) },
    { z: 4.05, pts: frame(0.9, H0 + 0.45, H0 + 0.78, 0.2, 0.15) }
  ];
  group.add(new THREE.Mesh(loft(sections), hullMat));

  // Heat shield under the belly: the burnt tiles that took every entry.
  const shield = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 5.6), shieldMat);
  shield.position.set(0, H0 - 0.02, -0.5);
  group.add(shield);

  // Flight deck glazing, raked back from the chin: five panes in heavy frames.
  const glass = loft([
    { z: 2.72, pts: [[-0.72, H0 + 1.72], [0.72, H0 + 1.72], [0.66, H0 + 1.78], [-0.66, H0 + 1.78]] },
    { z: 3.5, pts: [[-0.47, H0 + 1.2], [0.47, H0 + 1.2], [0.42, H0 + 1.26], [-0.42, H0 + 1.26]] }
  ], { capStart: false, capEnd: false });
  const glassMesh = new THREE.Mesh(glass, glassMat);
  glassMesh.userData.noMerge = true;
  group.add(glassMesh);
  // The frames: the pane edges, standing proud of the glass.
  for (const f of [-0.55, 0, 0.55]) {
    const a = new THREE.Vector3(f * 1.3, H0 + 1.8, 2.7);
    const b = new THREE.Vector3(f * 0.85, H0 + 1.28, 3.52);
    group.add(strut(new THREE.Mesh(new THREE.BoxGeometry(0.07, 1, 0.06), darkMat), a, b));
  }
  // Side windows either side of the deck.
  for (const s of [-1, 1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.7), glassMat);
    win.position.set(s * 1.41, H0 + 1.35, 2.3);
    win.rotation.y = s * -0.12;
    win.userData.noMerge = true;
    group.add(win);
  }

  // Spine: a raised dorsal housing with radiator fins.
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.36, 4.0), darkMat);
  spine.position.set(0, H0 + 2.36, -1.0);
  group.add(spine);
  for (let i = 0; i < 11; i++) {
    for (const s of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.035), steelMat);
      fin.position.set(s * 0.76, H0 + 2.46, -3.0 + i * 0.3);
      fin.rotation.z = s * -0.18;
      group.add(fin);
    }
  }
  // Sensor mast and a small dish.
  const mast = cyl(0.04, 0.05, 1.1, 8, steelMat);
  mast.position.set(0.25, H0 + 3.1, 0.7);
  group.add(mast);
  const dish = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.12, 0.012), new THREE.Vector2(0.25, 0.05), new THREE.Vector2(0.33, 0.1)
  ], 20), steelMat);
  dish.material = steelMat;
  dish.position.set(0.25, H0 + 3.55, 0.7);
  dish.rotation.set(-0.9, 0.6, 0);
  group.add(dish);
  const whip = cyl(0.008, 0.012, 1.6, 4, darkMat);
  whip.position.set(-0.3, H0 + 3.1, -3.3);
  whip.rotation.z = 0.08;
  group.add(whip);

  // Service panels, vents and a row of bolts along the waist.
  for (const s of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 1.2), darkMat);
    panel.position.set(s * 1.61, H0 + 1.15, -0.6);
    group.add(panel);
    for (let i = 0; i < 5; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.9), shieldMat);
      slat.position.set(s * 1.63, H0 + 0.95 + i * 0.09, -0.6);
      group.add(slat);
    }
    const bolts = boltLine([s * 1.61, H0 + 0.62, -3.2], [s * 1.61, H0 + 0.62, 1.5], 18, steelMat, { size: 0.022, normalAxis: 'x' });
    group.add(bolts);
  }

  /* ---- engine pods ---- */
  for (const s of [-1, 1]) {
    const pod = new THREE.Group();
    pod.position.set(s * 2.25, H0 + 1.05, -1.9);
    const body = new THREE.Mesh(latheZ([
      [0.0, -2.0], [0.46, -2.0], [0.55, -1.7], [0.62, -1.2], [0.64, 0.6], [0.6, 1.1], [0.52, 1.25], [0.42, 1.28]
    ], 24), hullMat);
    pod.add(body);
    // Intake: a lip round a dark throat with a grille of vanes.
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 8, 24), steelMat);
    lip.position.z = 1.3;
    pod.add(lip);
    const throat = new THREE.Mesh(new THREE.CircleGeometry(0.43, 24), nozzleInMat);
    throat.position.z = 1.2;
    pod.add(throat);
    for (let v = 0; v < 6; v++) {
      const vane = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.03, 0.08), darkMat);
      vane.position.z = 1.24;
      vane.rotation.z = (v / 6) * Math.PI;
      pod.add(vane);
    }
    // Nozzle: a burnt bell with a soot-black inside.
    const bell = new THREE.Mesh(latheZ([[0.44, -2.0], [0.5, -2.25], [0.6, -2.55], [0.66, -2.72]], 24), burntMat);
    pod.add(bell);
    const inner = new THREE.Mesh(latheZ([[0.6, -2.7], [0.46, -2.3], [0.2, -2.1], [0.0, -2.08]], 24), nozzleInMat);
    pod.add(inner);
    // Bands where the pod's sections bolt together.
    for (const z of [-1.4, 0.2]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.635, 0.025, 6, 28), darkMat);
      band.position.z = z;
      pod.add(band);
    }
    group.add(pod);
    // The pylon that carries it: a swept blade from the hull.
    const pyl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 1.9), darkMat);
    pyl.position.set(s * 1.85, H0 + 1.05, -1.95);
    pyl.rotation.z = s * 0.12;
    group.add(pyl);
  }

  /* ---- legs: each reaches its own ground ---- */
  const legs = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [sx, sz] of legs) {
    const hip = new THREE.Vector3(sx * 1.45, H0 + 0.35, sz > 0 ? 1.7 : -2.7);
    const pad = new THREE.Vector3(sx * 2.55, 0, sz > 0 ? 2.75 : -3.55);
    pad.y = groundAt(pad.x, pad.z) + 0.08;
    const knee = new THREE.Vector3(sx * 2.45, hip.y + 0.25, hip.z + sz * 0.35);
    const upper = strut(cyl(0.11, 0.13, 1, 10, darkMat), hip, knee);
    upper.scale.y = hip.distanceTo(knee);
    group.add(upper);
    // Lower leg: a cylinder the piston slides out of, the length the ground asks for.
    const lowerLen = knee.distanceTo(pad);
    const sleeveEnd = knee.clone().lerp(pad, 0.55);
    const sleeve = strut(cyl(0.12, 0.12, 1, 12, darkMat), knee, sleeveEnd);
    sleeve.scale.y = knee.distanceTo(sleeveEnd);
    group.add(sleeve);
    const rod = strut(cyl(0.065, 0.065, 1, 10, pistonMat), sleeveEnd, pad);
    rod.scale.y = Math.max(0.05, lowerLen * 0.45);
    group.add(rod);
    const kneeJ = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), steelMat);
    kneeJ.position.copy(knee);
    group.add(kneeJ);
    // Hydraulic line along the leg.
    group.add(cableRun(hip.clone().add(new THREE.Vector3(0.1, 0, 0)).toArray(), sleeveEnd.clone().add(new THREE.Vector3(0.12, 0, 0)).toArray(), rubberMat, { sag: 0.08, radius: 0.018, segments: 8 }));
    // Pad: a dished foot on a ball joint.
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.1, 16), darkMat);
    foot.position.copy(pad).setY(pad.y - 0.03);
    group.add(foot);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), steelMat);
    ball.position.copy(pad).setY(pad.y + 0.06);
    group.add(ball);
  }

  /* ---- bow ramp, lowered from under the flight deck onto the sand ---- */
  const hinge = new THREE.Vector3(0, H0 + 0.02, 2.05);
  const footZ = 5.35;
  const foot = new THREE.Vector3(0, groundAt(0, footZ) + 0.05, footZ);
  const rampLen = hinge.distanceTo(foot);
  const rampGrp = new THREE.Group();
  rampGrp.position.copy(hinge);
  rampGrp.rotation.x = Math.atan2(hinge.y - foot.y, foot.z - hinge.z);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, rampLen), treadMat);
  deck.position.set(0, 0, rampLen / 2);
  rampGrp.add(deck);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, rampLen), darkMat);
    rail.position.set(s * 0.8, 0.06, rampLen / 2);
    rampGrp.add(rail);
    const stripe = hazardStripe(rampLen * 0.96, 0.08);
    stripe.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    stripe.position.set(s * 0.64, 0.056, rampLen / 2);
    rampGrp.add(stripe);
  }
  group.add(rampGrp);
  // The rams that lowered it.
  for (const s of [-1, 1]) {
    const a = new THREE.Vector3(s * 0.55, H0 + 0.25, 1.6);
    const b = hinge.clone().add(new THREE.Vector3(s * 0.55, 0, 0)).add(
      new THREE.Vector3(0, -Math.sin(rampGrp.rotation.x), Math.cos(rampGrp.rotation.x)).multiplyScalar(1.1));
    const ram = strut(cyl(0.05, 0.05, 1, 8, pistonMat), a, b);
    ram.scale.y = a.distanceTo(b);
    group.add(ram);
  }
  // The open hold behind the ramp: a dark bay with a lit strip.
  const bay = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.2), nozzleInMat);
  bay.position.set(0, H0 + 0.05, 1.55);
  group.add(bay);

  /* ---- lamps (the only lit things on it) ---- */
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffa640 });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff5a2a });
  for (const s of [-1, 1]) {
    const nav = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), lampMat);
    nav.position.set(s * 1.62, H0 + 1.75, 1.2);
    nav.userData.noMerge = true;
    group.add(nav);
  }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), beaconMat);
  beacon.position.set(0, H0 + 2.62, -3.3);
  beacon.userData.noMerge = true;
  group.add(beacon);
  const bayLight = new THREE.PointLight(0xffb070, 1.6, 4.5, 2);
  bayLight.position.set(0, H0 + 0.6, 1.5);
  group.add(bayLight);

  group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  mergeStatic(group);

  return { group, beaconMat };
}
