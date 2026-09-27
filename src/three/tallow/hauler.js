/**
 * hauler.js — the derelict ore crawler, sunk to its axles in the crust west of
 * the yard. `buildHauler(ctx, lm)` returns it in its own frame (origin on the
 * ground at its centre, +z its nose); tallow.js places, turns and beds it,
 * reading how deep and how far over from `userData.sink` and `userData.list`.
 *
 * It used to be five boxes and six wheels. It is now a machine built the way
 * one is: two track assemblies of real pads round a sprocket, an idler and
 * five pairs of road wheels; a chassis lofted over them with fenders and bolted
 * skirt plates; a cab whose sides lean in to a flat roof and whose nose is one
 * raked glacis with the viewports set deep under a brow; a raised ore bed with
 * the last load still in it under a tarp the wind has torn open; two stacks, a
 * roof hatch left open, a ladder up the flank. Then forty years: a skirt plate
 * hanging off one bolt with its corner in the crust, another lying beside it,
 * ore spilled through a rotten seam, and salt drifted up the windward quarter.
 *
 * EVERYTHING STAYS INSIDE THE FOOTPRINT. The collider is a disc of `lm.radius`
 * (6.2 m) and the overlap check measures the real parts, so the hull is laid
 * out to reach no further than REACH in plan: eleven metres long, five and a
 * half wide, corners pulled in, the drift feathered to nothing before the rim.
 */

import * as THREE from 'three';
import {
  buildMaterial, texSize, boltLine, boltRing, weldBead, cableRun, hazardStripe, placard, mergeStatic
} from '../materials/pbr-kit.js';
import { hullPlate } from '../erebus/surfaces.js';
import { loft } from '../erebus/lander.js';
import { rng, fbm2, noise2, lerp, smoothstep } from '../erebus/noise.js';

/** How far below the crust its tracks ride: to the axles. */
const SINK = 0.55;
/** It has settled onto its windward (−x) side, which the drift has buried deeper. */
const LIST = 0.05;
/** Nothing reaches further than this from the centre in plan. */
const REACH = 6.0;

/** Box whose UVs are laid in metres, so a plate texture keeps one scale across the hull. */
function box(w, h, d, uv = 0.35) {
  const g = new THREE.BoxGeometry(w, h, d);
  const a = g.attributes.uv;
  // Face order is +x, -x, +y, -y, +z, -z; four vertices each.
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      a.setXY(i, a.getX(i) * dims[f][0] * uv, a.getY(i) * dims[f][1] * uv);
    }
  }
  return g;
}

/** Point a mesh built along +y from `a` to `b`. */
function strut(mesh, a, b) {
  const d = b.clone().sub(a);
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return mesh;
}

/** A round bar of radius r from a to b. */
function bar(a, b, r, mat, segs = 6) {
  const len = a.distanceTo(b);
  return strut(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, segs), mat), a, b);
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * A sheet from a grid, keeping only the vertices its surviving triangles use.
 * A torn tarp or a drift feathered out to nothing leaves most of its grid
 * unused, and an unused vertex still widens the box the overlap check reads.
 */
function sheet(pos, uv, idx) {
  const map = new Map(), p = [], u = [], out = [];
  for (const i of idx) {
    if (!map.has(i)) {
      map.set(i, map.size);
      p.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      u.push(uv[i * 2], uv[i * 2 + 1]);
    }
    out.push(map.get(i));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
  geo.setIndex(out);
  geo.computeVertexNormals();
  return geo;
}

/** The derelict ore crawler. */
export function buildHauler(ctx, lm) {
  const { M, own, t4, heightAt } = ctx;
  const g = new THREE.Group();
  g.name = 'hauler';
  const r = rng(0x4a11);

  /*
   * The ground, in the crawler's own frame. It is lowered by SINK and rolled
   * by LIST before it is turned, so the crust stands SINK above the local
   * origin, higher on the −x side it has settled toward, plus whatever relief
   * the pan has across eleven metres.
   */
  const [cx, , cz] = lm.pos;
  const ry = lm.rotY ?? 0;
  const h0 = heightAt ? heightAt(cx, cz) : 0;
  const groundAt = (x, z) => {
    const wx = cx + x * Math.cos(ry) + z * Math.sin(ry);
    const wz = cz - x * Math.sin(ry) + z * Math.cos(ry);
    const dh = heightAt ? heightAt(wx, wz) - h0 : 0;
    return SINK - x * Math.sin(LIST) + dh;
  };

  /* ---- materials ---- */
  // Mining ochre, bleached nearly to bone and chipped to primer at every
  // seam. Its own plate set: the shared Erebus hull materials are cached and
  // Tallow patches every material it holds, which would leak salt onto Erebus.
  const surf = hullPlate({
    paint: '#b19c72', primer: '#5f564b', metal: '#8f897f', dust: '#d9d2c4',
    rows: 3, cols: 2, wear: 0.95, seed: 23, size: texSize(512)
  });
  const paint = buildMaterial(surf, { repeat: 1, roughness: 1.0 });
  paint.normalScale = new THREE.Vector2(0.9, 0.9);
  paint.aoMapIntensity = 0.9;
  // Forty years standing in brine: the crust climbs it further than a crate.
  paint.userData.salt = { creep: 0.8, top: 0.55, tide: 0.4 };
  own(paint, ...paint.userData.surfaceMaps);

  const dark = M.dark, bed = M.plate, pipe = M.pipe;
  const glass = own(new THREE.MeshStandardMaterial({ color: 0x0f0e0d, roughness: 0.2, metalness: 0.35 }));
  const black = own(new THREE.MeshStandardMaterial({ color: 0x0b0a09, roughness: 1.0, metalness: 0.1 }));
  const soot = own(new THREE.MeshStandardMaterial({ color: 0x25211d, roughness: 0.95, metalness: 0.3 }));
  const rubber = own(new THREE.MeshStandardMaterial({ color: 0x1d1a17, roughness: 0.95, metalness: 0.0 }));
  const oreMat = own(new THREE.MeshStandardMaterial({ color: 0x5b4d41, roughness: 1.0, metalness: 0.05 }));
  const tarpMat = own(new THREE.MeshStandardMaterial({
    color: 0x736a55, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide
  }));
  const saltMat = own(new THREE.MeshStandardMaterial({ color: 0xd8d1c3, roughness: 1.0, metalness: 0.0 }));
  // A lamp with nothing behind it: an amber lens, not a light.
  const deadLens = own(new THREE.MeshStandardMaterial({ color: 0x4a3a24, roughness: 0.3, metalness: 0.2 }));

  const add = (mesh, parent = g) => { parent.add(mesh); return mesh; };
  const put = (geo, mat, x, y, z, rx = 0, ry2 = 0, rz = 0, parent = g) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry2, rz);
    return add(m, parent);
  };

  /* ================================================================ tracks
     A stadium of pads round a sprocket (aft) and an idler (fore). The lower
     run is under the crust, so it is not built. */
  const TZ = 4.2, TY = 0.8, TR = 0.74, TX = 2.07, TW = 0.9;
  const straight = TZ * 2, arc = Math.PI * TR;
  const loop = straight * 2 + arc * 2;
  /** Position and heading (dz, dy) of the pad centreline at distance s round the loop. */
  const trackAt = s => {
    s = ((s % loop) + loop) % loop;
    if (s < straight) return { z: -TZ + s, y: TY - TR, dz: 1, dy: 0 };
    s -= straight;
    if (s < arc) {
      const a = -Math.PI / 2 + s / TR;
      return { z: TZ + Math.cos(a) * TR, y: TY + Math.sin(a) * TR, dz: -Math.sin(a), dy: Math.cos(a) };
    }
    s -= arc;
    if (s < straight) return { z: TZ - s, y: TY + TR, dz: -1, dy: 0 };
    s -= straight;
    const a = Math.PI / 2 + s / TR;
    return { z: -TZ + Math.cos(a) * TR, y: TY + Math.sin(a) * TR, dz: -Math.sin(a), dy: Math.cos(a) };
  };
  const padGeo = box(TW, 0.09, 0.24);
  const grouserGeo = box(TW * 0.96, 0.05, 0.06);
  const pitch = 0.27;

  for (const s of [-1, 1]) {
    const xc = s * TX;
    for (let d = 0; d < loop; d += pitch) {
      const p = trackAt(d);
      if (p.y < 0.28) continue;                         // under the crust
      // Local −y is always outward: the grouser bites the ground side.
      const a = Math.atan2(-p.dy, p.dz);
      const pad = put(padGeo, dark, xc, p.y, p.z, a);
      const gr = new THREE.Mesh(grouserGeo, dark);
      gr.position.set(0, -0.065, 0);
      pad.add(gr);
    }

    // Sprocket: two toothed rings on a hub, and the final drive housing inboard.
    const sp = new THREE.Group();
    sp.position.set(xc, TY, -TZ);
    g.add(sp);
    for (const dx of [-0.2, 0.2]) {
      put(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 20), dark, dx, 0, 0, 0, 0, Math.PI / 2, sp);
      for (let i = 0; i < 13; i++) {
        const a = (i / 13) * Math.PI * 2;
        put(box(0.12, 0.16, 0.12), dark, dx, Math.sin(a) * 0.63, Math.cos(a) * 0.63, Math.PI / 2 - a, 0, 0, sp);
      }
    }
    put(new THREE.CylinderGeometry(0.26, 0.26, 0.7, 12), dark, 0, 0, 0, 0, 0, Math.PI / 2, sp);
    put(new THREE.CylinderGeometry(0.46, 0.5, 0.42, 16), dark, -s * 0.62, 0, 0, 0, 0, Math.PI / 2, sp);
    const spBolts = boltRing(0.18, 8, dark, { axis: 'x', size: 0.03 });
    spBolts.position.x = s * 0.36;
    sp.add(spBolts);

    // Idler: a grooved wheel on a sprung yoke.
    const id = new THREE.Group();
    id.position.set(xc, TY, TZ);
    g.add(id);
    for (const dx of [-0.21, 0.21]) put(new THREE.CylinderGeometry(0.62, 0.62, 0.26, 20), dark, dx, 0, 0, 0, 0, Math.PI / 2, id);
    put(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 18), dark, 0, 0, 0, 0, 0, Math.PI / 2, id);
    put(new THREE.CylinderGeometry(0.2, 0.2, 0.78, 10), dark, 0, 0, 0, 0, 0, Math.PI / 2, id);
    add(bar(V(xc, TY, TZ - 0.3), V(xc, TY + 0.05, TZ - 1.6), 0.09, pipe));

    // Road wheels, doubled, on swing arms from a bogie beam.
    add(new THREE.Mesh(box(0.28, 0.3, 7.6), dark)).position.set(xc, 1.0, 0);
    for (const wz of [-2.9, -1.45, 0, 1.45, 2.9]) {
      for (const dx of [-0.22, 0.22]) {
        put(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 18), dark, xc + dx, 0.53, wz, 0, 0, Math.PI / 2);
      }
      put(new THREE.CylinderGeometry(0.15, 0.15, 0.64, 8), dark, xc, 0.53, wz, 0, 0, Math.PI / 2);
      const hub = boltRing(0.1, 6, dark, { axis: 'x', size: 0.025 });
      hub.position.set(xc + s * 0.33, 0.53, wz);
      g.add(hub);
      add(bar(V(xc, 0.53, wz), V(xc, 0.98, wz + 0.55), 0.08, dark));
    }
    // Return rollers under the upper run.
    for (const wz of [-2.1, 0, 2.1]) {
      put(new THREE.CylinderGeometry(0.14, 0.14, 0.62, 10), dark, xc, TY + TR - 0.2, wz, 0, 0, Math.PI / 2);
      add(new THREE.Mesh(box(0.12, 0.26, 0.12), dark)).position.set(xc - s * 0.36, TY + TR - 0.08, wz);
    }
  }

  /* =============================================================== chassis
     Lofted from tail to nose: a belly between the tracks, fenders over them,
     a deck on top. The last frames rake the nose up out of the crust. */
  const chassis = (z, k = 1, belly = 1.0, deck = 2.3) => ({
    z,
    pts: [
      [-1.5 * k, belly], [1.5 * k, belly], [1.56 * k, 1.7], [2.66 * k, 1.7], [2.72 * k, 2.1],
      [2.52 * k, deck], [-2.52 * k, deck], [-2.72 * k, 2.1], [-2.66 * k, 1.7], [-1.56 * k, 1.7]
    ]
  });
  add(new THREE.Mesh(loft([
    chassis(-5.3, 0.95, 1.35, 2.2), chassis(-5.05), chassis(4.6), chassis(5.05, 0.96, 1.25, 2.28), chassis(5.32, 0.9, 1.6, 2.2)
  ], { uvScale: 0.3 }), paint));

  // Bumper across the nose, its striping walked and scoured off.
  put(box(3.4, 0.4, 0.34), dark, 0, 1.6, 5.46);
  const stripe = hazardStripe(3.2, 0.3);
  own(stripe.userData.ownTexture, stripe.userData.ownMaterial);
  stripe.position.set(0, 1.6, 5.64);
  g.add(stripe);
  for (const x of [-1.2, 1.2]) {
    put(new THREE.TorusGeometry(0.14, 0.045, 6, 12), dark, x, 1.3, 5.55, Math.PI / 2, 0, 0);
  }

  // Skirt plates along both fenders, bolted along the top. On the lee side
  // one hangs off its forward bolt with its tail in the crust, and the one
  // behind it is gone — it lies on the salt where it fell.
  const skirtGeo = box(0.07, 0.52, 1.94);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const z0 = -5.0 + i * 2, zc = z0 + 1;
      if (s === 1 && i === 0) continue;                 // fell off
      if (s === 1 && i === 2) {
        const pivot = new THREE.Group();
        pivot.position.set(2.76, 2.1, zc + 0.95);
        pivot.rotation.set(-0.9, 0.08, -0.06);
        g.add(pivot);
        put(skirtGeo, paint, 0, -0.26, -0.97, 0, 0, 0, pivot);
        continue;
      }
      put(skirtGeo, paint, s * 2.72, 1.86, zc);
      g.add(boltLine([s * 2.757, 2.04, z0 + 0.12], [s * 2.757, 2.04, z0 + 1.88], 7, dark, { normalAxis: 'x', size: 0.032 }));
    }
  }
  {
    const fallen = put(skirtGeo, paint, 3.5, groundAt(3.5, -3.2) + 0.03, -3.2, 0.02, -0.2, Math.PI / 2 - 0.04);
    fallen.rotation.order = 'YXZ';
  }

  // The tail: a ladder from the crust to the deck, lamps with no bulbs, a hitch.
  for (const x of [-1.25, -0.7]) add(bar(V(x, 0.5, -5.42), V(x, 2.45, -5.42), 0.03, pipe));
  for (let y = 0.8; y < 2.4; y += 0.3) add(bar(V(-1.25, y, -5.44), V(-0.7, y, -5.44), 0.02, pipe));
  for (const x of [-2.1, 2.1]) {
    put(box(0.3, 0.2, 0.1), dark, x, 1.95, -5.33);
    put(box(0.22, 0.12, 0.04), deadLens, x, 1.95, -5.39);
  }
  put(box(0.5, 0.3, 0.3), dark, 0.9, 1.45, -5.38);
  put(new THREE.TorusGeometry(0.16, 0.05, 6, 12), dark, 0.9, 1.45, -5.55, Math.PI / 2, 0, 0);

  /* =================================================================== cab
     Sides that lean in to a flat roof, and one raked glacis from the roof to
     the bumper. The viewports sit deep under a brow, so from the ground they
     read as black slots rather than windows. */
  const Y0 = 2.25;
  const cabSec = (z, wb, wt, y1, c = 0.28) => ({
    z,
    pts: [[-wb / 2, Y0], [wb / 2, Y0], [wt / 2 + c, y1 - c], [wt / 2 - c * 0.3, y1], [-(wt / 2 - c * 0.3), y1], [-(wt / 2 + c), y1 - c]]
  });
  const CREST_Z = 2.6, CREST_Y = 5.0, NOSE_Z = 5.02, NOSE_Y = 2.55;
  add(new THREE.Mesh(loft([
    cabSec(0.6, 4.7, 3.1, 4.85), cabSec(0.78, 4.85, 3.25, CREST_Y), cabSec(CREST_Z, 4.85, 3.25, CREST_Y),
    cabSec(NOSE_Z, 4.4, 2.7, NOSE_Y, 0.2)
  ], { uvScale: 0.3 }), paint));
  const SIDE = Math.atan2(4.85 / 2 - (3.25 / 2 + 0.28), CREST_Y - 0.28 - Y0);   // lean of the flanks
  const sideX = y => 4.85 / 2 - (y - Y0) * Math.tan(SIDE);

  // Welded to the deck along both sides, and bolted where the weld let go.
  for (const s of [-1, 1]) {
    const w = weldBead(4.2, dark, { radius: 0.03, seed: s > 0 ? 3 : 4 });
    w.rotation.x = Math.PI / 2;
    w.position.set(s * 2.42, 2.28, 2.8);
    g.add(w);
    g.add(boltLine([s * 2.39, 2.42, 0.9], [s * 2.39, 2.42, 2.5], 8, dark, { normalAxis: 'x', size: 0.03 }));
  }

  // The glacis frame: origin at the crest, +z out of the plate, −y down it.
  const GL = Math.atan2(CREST_Y - NOSE_Y, NOSE_Z - CREST_Z);
  const gf = new THREE.Group();
  gf.position.set(0, CREST_Y, CREST_Z);
  gf.rotation.x = GL - Math.PI / 2;
  g.add(gf);
  for (let i = -1; i <= 1; i++) put(box(0.8, 0.62, 0.04), glass, i * 0.85, -0.72, 0.02, 0, 0, 0, gf);
  // Brow: a heavy visor over the band, dropped at its lip.
  put(box(3.1, 0.1, 0.62), paint, 0, -0.34, 0.3, -0.32, 0, 0, gf);
  for (const x of [-1.33, -0.425, 0.425, 1.33]) put(box(0.12, 0.8, 0.26), paint, x, -0.72, 0.13, 0, 0, 0, gf);
  put(box(2.9, 0.12, 0.26), paint, 0, -1.1, 0.13, 0, 0, 0, gf);
  for (const x of [-1.46, 1.46]) put(box(0.12, 0.92, 0.5), paint, x, -0.7, 0.24, 0, 0, 0, gf);
  // Armour ribs down the lower glacis, and two lamp cans with no bulbs in them.
  for (const y of [-1.75, -2.35, -2.95]) put(box(2.6, 0.08, 0.1), dark, 0, y, 0.05, 0, 0, 0, gf);
  for (const x of [-1.0, 1.0]) {
    put(new THREE.CylinderGeometry(0.2, 0.17, 0.3, 12), dark, x, -2.05, 0.16, Math.PI / 2, 0, 0, gf);
    put(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 12), deadLens, x, -2.05, 0.32, Math.PI / 2, 0, 0, gf);
  }
  {
    const p = placard('CR 22', { w: 0.7, h: 0.2, bg: '#a79470' });
    own(p.userData.ownTexture, p.userData.ownMaterial);
    p.position.set(0, -1.42, 0.02);
    gf.add(p);
  }

  // Slit ports in both flanks, each under its own brow.
  for (const s of [-1, 1]) {
    const y = 4.15;
    put(box(0.05, 0.28, 0.72), glass, s * (sideX(y) + 0.01), y, 2.12, 0, 0, s * SIDE);
    put(box(0.3, 0.06, 0.9), paint, s * (sideX(y + 0.2) + 0.1), y + 0.2, 2.12, 0, 0, s * SIDE);
  }
  // A louvred grille on the windward flank, over what was the engine.
  for (let i = 0; i < 6; i++) {
    const y = 2.75 + i * 0.14;
    put(box(0.1, 0.05, 1.2), dark, -(sideX(y) + 0.03), y, 1.35, 0, 0, -SIDE - 0.5);
  }
  put(box(0.06, 1.0, 1.36), dark, -(sideX(3.1) + 0.01), 3.1, 1.35, 0, 0, -SIDE);

  // A ladder up the lee flank, following its lean, to a grab rail on the roof.
  for (const z of [0.95, 1.45]) {
    add(bar(V(sideX(2.35) + 0.14, 2.35, z), V(sideX(4.8) + 0.14, 4.8, z), 0.028, pipe));
  }
  for (let y = 2.6; y < 4.75; y += 0.3) {
    add(bar(V(sideX(y) + 0.14, y, 0.95), V(sideX(y) + 0.14, y, 1.45), 0.02, pipe));
  }
  for (const s of [-1, 1]) {
    const x = s * 1.52;
    for (const z of [0.95, 2.35]) add(bar(V(x, CREST_Y, z), V(x, CREST_Y + 0.32, z), 0.025, pipe));
    add(bar(V(x, CREST_Y + 0.32, 0.95), V(x, CREST_Y + 0.32, 2.35), 0.025, pipe));
  }
  // Handholds beside the ladder: a grip on two standoffs.
  for (const y of [3.2, 4.1]) {
    const x = sideX(y), o = 0.12;
    add(bar(V(x, y, 1.62), V(x + o, y, 1.62), 0.018, pipe, 5));
    add(bar(V(x, y, 1.92), V(x + o, y, 1.92), 0.018, pipe, 5));
    add(bar(V(x + o, y, 1.6), V(x + o, y, 1.94), 0.02, pipe, 5));
  }

  /* ---- the roof ---- */
  // Two stacks: one straight, one knocked over at the top and soot-black.
  for (const s of [-1, 1]) {
    const x = s * 1.05, z = 1.02;
    put(new THREE.CylinderGeometry(0.32, 0.36, 0.4, 14), dark, x, CREST_Y + 0.15, z);
    put(new THREE.CylinderGeometry(0.19, 0.2, 1.7, 14), pipe, x, CREST_Y + 1.15, z);
    put(new THREE.CylinderGeometry(0.24, 0.24, 0.9, 14, 1, true), pipe, x, CREST_Y + 0.8, z);
    const top = new THREE.Group();
    top.position.set(x, CREST_Y + 2.0, z);
    top.rotation.set(s > 0 ? 0.08 : 0.42, 0, s > 0 ? 0.04 : -0.35);
    g.add(top);
    put(new THREE.CylinderGeometry(0.18, 0.19, 0.6, 14, 1, true), soot, 0, 0.3, 0, 0, 0, 0, top);
    put(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 14), black, 0, 0.58, 0, 0, 0, 0, top);
    // The rain flap, stuck half open.
    put(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 14), soot, 0, 0.72, -0.16, s > 0 ? -0.9 : -0.3, 0, 0, top);
  }
  // Roof hatch, lid thrown back on its hinge.
  put(new THREE.CylinderGeometry(0.44, 0.46, 0.14, 18), dark, 0.45, CREST_Y + 0.05, 1.95);
  put(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 18), black, 0.45, CREST_Y + 0.13, 1.95);
  put(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 18), paint, 0.45, CREST_Y + 0.5, 1.45, -1.9, 0, 0);
  put(box(0.12, 0.1, 0.18), dark, 0.45, CREST_Y + 0.14, 1.5);
  // An air cleaner lying along the roof, and a whip aerial bent over by wind.
  put(new THREE.CylinderGeometry(0.22, 0.22, 0.8, 12), pipe, -0.65, CREST_Y + 0.26, 2.05, Math.PI / 2, 0, 0);
  for (const z of [1.75, 2.35]) put(box(0.5, 0.14, 0.06), dark, -0.65, CREST_Y + 0.07, z);
  add(bar(V(1.2, CREST_Y, 2.4), V(1.45, CREST_Y + 1.1, 2.55), 0.02, dark, 5));
  add(bar(V(1.45, CREST_Y + 1.1, 2.55), V(2.05, CREST_Y + 1.35, 2.9), 0.012, dark, 5));
  // The beacon on the roof corner, long dead.
  put(new THREE.CylinderGeometry(0.14, 0.16, 0.1, 12), dark, -1.25, CREST_Y + 0.05, 2.45);
  put(new THREE.SphereGeometry(0.13, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), deadLens, -1.25, CREST_Y + 0.1, 2.45);

  // A cable from the roof edge down to the crust on the lee side.
  g.add(cableRun([1.7, 4.8, 3.0], [3.8, groundAt(3.8, 3.7) - 0.05, 3.7], rubber, { sag: 0.5, radius: 0.035, segments: 14 }));
  // Hoses across the gap between the cab and the bed.
  g.add(cableRun([-0.9, 3.6, 0.62], [-1.1, 3.2, 0.1], rubber, { sag: 0.25, radius: 0.05, segments: 8 }));
  g.add(cableRun([-0.4, 3.9, 0.62], [-0.2, 3.4, 0.1], rubber, { sag: 0.3, radius: 0.04, segments: 8 }));

  /* ================================================================ ore bed
     A hopper on a subframe over the aft deck, flared at the top, stiffened
     outside, and still full: ore heaped under a tarp whose aft end has been
     rolled back and whose middle the wind has torn through. */
  const HZ0 = -4.85, HZ1 = 0.15, HY0 = 2.55, HY1 = 4.5, HB = 1.9, HT = 2.35;
  const hLen = HZ1 - HZ0, hMid = (HZ0 + HZ1) / 2;
  const tilt = Math.atan2(HT - HB, HY1 - HY0);
  const inner = y => HB + (y - HY0) * Math.tan(tilt) - 0.05;
  for (const x of [-1.2, 1.2]) put(box(0.3, 0.3, hLen - 0.2), dark, x, 2.4, hMid);
  for (const s of [-1, 1]) {
    put(box(0.09, Math.hypot(HT - HB, HY1 - HY0), hLen), bed, s * (HB + HT) / 2, (HY0 + HY1) / 2, hMid, 0, 0, -s * tilt);
    // Top rail and the stiffeners down the outside.
    put(box(0.16, 0.16, hLen + 0.1), dark, s * (HT + 0.03), HY1 + 0.03, hMid);
    for (let z = HZ0 + 0.5; z < HZ1; z += 1.0) {
      put(box(0.12, 1.9, 0.14), bed, s * ((HB + HT) / 2 + 0.1), (HY0 + HY1) / 2, z, 0, 0, -s * tilt);
    }
  }
  const endShape = new THREE.Shape([
    new THREE.Vector2(-HB, 0), new THREE.Vector2(HB, 0), new THREE.Vector2(HT, HY1 - HY0), new THREE.Vector2(-HT, HY1 - HY0)
  ]);
  for (const z of [HZ0, HZ1 - 0.09]) {
    const e = new THREE.ExtrudeGeometry(endShape, { depth: 0.09, bevelEnabled: false });
    const uvA = e.attributes.uv;
    for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uvA.getX(i) * 0.35, uvA.getY(i) * 0.35);
    put(e, bed, 0, HY0, z);
    put(box(HT * 2 + 0.2, 0.16, 0.16), dark, 0, HY1 + 0.03, z + 0.045);
  }
  // Tipping rams at the forward end, never used again.
  for (const x of [-1.3, 1.3]) {
    add(bar(V(x, 2.32, 0.45), V(x, 2.62, 0.05), 0.09, dark));
  }

  // The ore: a mound inside the bed, lumpy, darker than anything round it.
  const oreY = (x, z) => {
    const zn = (z - hMid) / (hLen / 2);
    const xn = x / 2.1;
    return 3.72 + 0.5 * (1 - zn * zn) * (1 - 0.6 * xn * xn) + fbm2(x * 1.6, z * 1.6, 3) * 0.22;
  };
  {
    const nx = 18, nz = 22;
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= nz; j++) {
      for (let i = 0; i <= nx; i++) {
        const z = lerp(HZ0 + 0.1, HZ1 - 0.1, j / nz);
        const y0 = oreY(0, z);
        const x = lerp(-1, 1, i / nx) * inner(Math.min(y0, HY1 - 0.1));
        pos.push(x, oreY(x, z), z);
        uv.push(x * 0.4, z * 0.4);
      }
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    add(new THREE.Mesh(sheet(pos, uv, idx), oreMat));
    for (let i = 0; i < 14; i++) {
      const z = lerp(HZ0 + 0.3, -3.3, r());
      const x = (r() - 0.5) * 3.2;
      const s = 0.14 + r() * 0.2;
      const lump = put(new THREE.DodecahedronGeometry(s, 0), oreMat, x, oreY(x, z) + s * 0.3, z, r() * 3, r() * 3, r() * 3);
      lump.scale.set(1, 0.7 + r() * 0.4, 1);
    }
  }

  // The tarp: pulled over the rim at the sides and the front, lying on the
  // ore in the middle, one edge blown out over the lee side, torn open.
  {
    const X0 = -2.5, X1 = 3.55, Z0 = -3.5, Z1 = 0.42, RIM = HY1 + 0.1;
    const nx = 34, nz = 26;
    const pos = [], uv = [], idx = [], keep = [];
    for (let j = 0; j <= nz; j++) {
      for (let i = 0; i <= nx; i++) {
        const u = lerp(X0, X1, i / nx), v = lerp(Z0, Z1, j / nz);
        let x = u, y, z = v;
        const lie = oreY(Math.max(-2.1, Math.min(2.1, u)), Math.min(v, HZ1 - 0.1)) + 0.07;
        const taut = Math.max(smoothstep(1.6, HT, Math.abs(u)), smoothstep(-0.35, HZ1, v));
        y = lerp(lie, RIM, taut) + Math.sin(u * 6.5 + v * 2.1) * 0.035 * (1 - taut) + fbm2(u * 2, v * 2, 2) * 0.05;
        if (u > HT + 0.05) {
          // Over the lee rail and down the side, bellied out by the wind.
          const d = u - HT - 0.05;
          x = HT + 0.1 + d * 0.08 + Math.sin(d * 2.8) * 0.12;
          y = RIM - d;
        } else if (u < -HT - 0.05) {
          const d = -HT - 0.05 - u;
          x = -HT - 0.1;
          y = RIM - d;
        }
        if (v > HZ1 + 0.05) {
          const d = v - HZ1 - 0.05;
          z = HZ1 + 0.08;
          y = Math.min(y, RIM - d);
        }
        pos.push(x, y, z);
        uv.push(u * 0.5, v * 0.5);
        // What is left of it: a rip down the middle, a hole blown through,
        // a ragged hem on the flap and a frayed aft edge.
        const t = ((u + 1.2) * 2.1 + (v + 3.4) * 2.9) / (2.1 * 2.1 + 2.9 * 2.9);
        const lx = -1.2 + 2.1 * t, lz = -3.4 + 2.9 * t;
        const rip = Math.hypot(u - lx, v - lz) < 0.16 + 0.28 * (noise2(u * 3.1, v * 3.1) + 0.5) && t > 0.08 && t < 0.92;
        const hole = Math.hypot(u - 1.05, v + 2.45) < 0.42 + noise2(u * 4, v * 4) * 0.35;
        const hem = u > HT + 0.05 && (u - HT) > 0.8 + noise2(v * 2.3, 1.7) * 0.5;
        const aft = v < Z0 + 0.12 + (noise2(u * 2.7, 4.1) + 0.5) * 0.25;
        keep.push(!(rip || hole || hem || aft));
      }
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      if (keep[a] && keep[b] && keep[c]) idx.push(a, c, b);
      if (keep[b] && keep[c] && keep[d]) idx.push(b, c, d);
    }
    add(new THREE.Mesh(sheet(pos, uv, idx), tarpMat));

    // The aft end, rolled back and lying across the load.
    const roll = [];
    for (let i = 0; i <= 10; i++) {
      const x = lerp(-2.05, 2.05, i / 10);
      roll.push(V(x, oreY(x, -3.62) + 0.17, -3.62 + Math.sin(i * 1.3) * 0.05));
    }
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(roll), 20, 0.19, 8, false), tarpMat));
    // Tie-downs on the windward side, still holding.
    for (const z of [-2.6, -1.5, -0.4]) {
      g.add(cableRun([-HT - 0.1, RIM - 0.35, z], [-inner(3.2) - 0.14, 3.2, z + 0.2], rubber, { sag: 0.05, radius: 0.018, segments: 6 }));
    }
  }

  // Ore that ran out through a rotten seam at the foot of the bed, lee side.
  put(box(0.04, 0.32, 0.5), black, HB + 0.1, 2.75, -1.85, 0, 0, -tilt);
  for (let i = 0; i < 22; i++) {
    const x = 3.0 + r() * 1.3, z = -2.4 + r() * 1.1;
    const s = 0.08 + r() * 0.17;
    put(new THREE.DodecahedronGeometry(s, 0), oreMat, x, groundAt(x, z) + s * 0.2, z, r() * 3, r() * 3, r() * 3);
  }
  // Hull plating on the salt by the nose, bent where it came off.
  put(box(1.1, 0.04, 0.7), paint, 3.1, groundAt(3.1, 3.5) + 0.06, 3.5, 0.1, 0.9, -0.08);

  // Stencil on the lee fender.
  {
    const p = placard('TH 417', { w: 0.62, h: 0.2, bg: '#a79470' });
    p.position.set(2.724, 1.94, 3.6);
    p.rotation.y = Math.PI / 2;
    own(p.userData.ownTexture, p.userData.ownMaterial);
    g.add(p);
  }

  /* ================================================================ drift
     Salt blown up against the windward quarter. Tallow's wind comes from
     just south of west; turned into this frame that is the −x flank and the
     tail. It is highest against the hull and feathers out to nothing before
     the edge of the footprint. */
  {
    const [wx, wz] = [Math.cos(0.32), Math.sin(0.32)];
    // Windward in the local frame (the direction the wind comes FROM).
    const fx = -(wx * Math.cos(ry) - wz * Math.sin(ry));
    const fz = -(wx * Math.sin(ry) + wz * Math.cos(ry));
    const HX = 2.75, HZ = 5.35;
    const drift = (x, z) => {
      const dx = Math.max(Math.abs(x) - HX, 0), dz = Math.max(Math.abs(z) - HZ, 0);
      const d = Math.hypot(dx, dz);
      if (Math.abs(x) < HX && Math.abs(z) < HZ) return 0.9 * smoothstep(HX - 0.6, HX, -x);
      const nxv = dx > 0 ? Math.sign(x) * dx / d : 0, nzv = dz > 0 ? Math.sign(z) * dz / d : 0;
      const face = Math.max(0, nxv * fx + nzv * fz);
      const reach = 2.2 + noise2(x * 0.4, z * 0.4) * 1.2;
      const h = 1.25 * face * Math.pow(Math.max(0, 1 - d / reach), 1.5);
      return h * (1 + fbm2(x * 1.3, z * 1.3, 3) * 0.5) * smoothstep(REACH, REACH - 0.6, Math.hypot(x, z));
    };
    const X0 = -REACH, X1 = 1.0, Z0 = -REACH, Z1 = 5.2, nx = 36, nz = 56;
    const pos = [], uv = [], up = [];
    for (let j = 0; j <= nz; j++) {
      for (let i = 0; i <= nx; i++) {
        const x = lerp(X0, X1, i / nx), z = lerp(Z0, Z1, j / nz);
        const h = drift(x, z);
        pos.push(x, groundAt(x, z) - 0.1 + h, z);
        uv.push(x * 0.3, z * 0.3);
        up.push(h > 0.12);
      }
    }
    // Cut into bands along the hull, so each piece is measured by its own box
    // rather than one box round the whole windward quarter.
    const bands = 4, per = nz / bands;
    for (let k = 0; k < bands; k++) {
      const idx = [];
      for (let j = k * per; j < (k + 1) * per; j++) for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
        if (up[a] || up[b] || up[c]) idx.push(a, c, b);
        if (up[b] || up[c] || up[d]) idx.push(b, c, d);
      }
      if (idx.length) add(new THREE.Mesh(sheet(pos, uv, idx), saltMat));
    }
  }

  /* ---- bake ---- */
  g.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = t4 && o.material !== saltMat && o.material !== glass;
    o.receiveShadow = t4;
    own(o.geometry);
  });
  mergeStatic(g);
  g.traverse(o => { if (o.isMesh) own(o.geometry); });

  g.userData.sink = SINK;
  g.userData.list = LIST;
  return g;
}
