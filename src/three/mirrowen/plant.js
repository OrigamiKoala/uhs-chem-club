/**
 * mirrowen/plant.js — Everything people built at Mirrowen, and what froze.
 *
 * The harbour's furniture: the work lamps, the mooring bollards, the stores, the portal crane and
 * the harbour light; the pad the Avalon lands on; and the Fifth's work, the stretch of canal frozen
 * at the ordinary temperature of the water: crystal ice standing in walls on the banks and across
 * the end of the canal, and the ships it trapped, listing in the sheet.
 *
 * Builders return ONE group in the landmark's own frame, with `userData.colliders` (circles, in that
 * frame) and `userData.vents` (steam mouths). ONLY LAMPS ARE LIT: a lamp is a `lampMark` the world
 * pools into three real lights, and nothing here owns a PointLight. No sign stands in the harbour.
 */

import * as THREE from 'three';
import { part, put, between, strut, rng, crystalGeometry, rockGeometry } from './kit.js';

/** A lamp: the glass that glows, and the mark the pool lights from. */
function lampAt(ctx, g, x, y, z, { intensity = 5, distance = 13, w = 0.15, h = 0.24 } = {}) {
  g.add(part(ctx, new THREE.CylinderGeometry(w / 2, w / 2, h, 8), ctx.M.lantern, x, y, z));
  const mark = new THREE.Object3D();
  mark.position.set(x, y, z);
  mark.userData.lamp = { color: 0xe6a443, intensity, distance, decay: 1.6 };
  g.add(mark);
  ctx.lamps.push(mark);
}

/* ------------------------------------------------------------ furniture */

/** A work lamp on a steel post with a hooded lantern on a short arm. Turned by its own layout. */
export function buildLampPost(ctx, index = 0) {
  const g = new THREE.Group();
  const H = 3.5;
  g.add(part(ctx, new THREE.CylinderGeometry(0.055, 0.08, H, 6), ctx.M.darkSteel, 0, H / 2, 0, { cast: true }));
  g.add(part(ctx, new THREE.BoxGeometry(0.36, 0.14, 0.36), ctx.M.concrete, 0, 0.07, 0));
  g.add(part(ctx, new THREE.BoxGeometry(0.6, 0.045, 0.045), ctx.M.darkSteel, 0.29, H - 0.12, 0));
  g.add(between(ctx, [0.05, H - 0.6, 0], [0.42, H - 0.14, 0], 0.02, ctx.M.darkSteel, 5));
  g.add(part(ctx, new THREE.ConeGeometry(0.2, 0.14, 8), ctx.M.clad, 0.55, H - 0.2, 0));
  lampAt(ctx, g, 0.55, H - 0.42, 0, { intensity: 5, distance: 13, w: 0.15, h: 0.26 });
  for (const a of [0, Math.PI / 2]) {
    const cage = part(ctx, new THREE.BoxGeometry(0.21, 0.3, 0.012), ctx.M.darkSteel, 0.55, H - 0.42, 0);
    cage.rotation.y = a;
    g.add(cage);
  }
  g.rotation.y = (index * 2.399) % (Math.PI * 2);
  g.userData.colliders = [{ x: 0, z: 0, r: 0.3 }];
  return g;
}

/** A mooring bollard: a cast-iron post on a foot, banded with rust. */
export function buildBollard(ctx) {
  const g = new THREE.Group();
  g.add(part(ctx, new THREE.CylinderGeometry(0.34, 0.4, 0.14, 12), ctx.M.concrete, 0, 0.07, 0));
  g.add(part(ctx, new THREE.CylinderGeometry(0.18, 0.24, 0.55, 12), ctx.M.rusted, 0, 0.4, 0, { cast: true }));
  g.add(part(ctx, new THREE.CylinderGeometry(0.27, 0.2, 0.12, 12), ctx.M.rusted, 0, 0.75, 0));
  g.userData.colliders = [{ x: 0, z: 0, r: 0.4 }];
  return g;
}

export function buildCrateStack(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0xc4a7e + seed * 19);
  g.add(part(ctx, new THREE.BoxGeometry(2.6, 0.14, 2.0), ctx.M.timber, 0, 0.07, 0));
  const spots = [[-0.62, -0.45], [0.62, -0.45], [-0.62, 0.48], [0.62, 0.48]];
  spots.forEach(([x, z], i) => {
    const s = 0.92 + r() * 0.18;
    const c = part(ctx, new THREE.BoxGeometry(s * 1.1, s * 0.9, s * 0.85), i % 2 ? ctx.M.crate : ctx.M.crateB, x, 0.14 + s * 0.45, z, { cast: true });
    c.rotation.y = (r() - 0.5) * 0.12;
    g.add(c);
  });
  g.add(part(ctx, new THREE.BoxGeometry(1.05, 0.86, 0.8), ctx.M.crateB, -0.3, 0.14 + 1.0 + 0.43, 0, { cast: true }));
  g.userData.colliders = [{ x: 0, z: 0, r: 1.55 }];
  return g;
}

export function buildDrumRack(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0xd7 + seed * 23);
  g.add(part(ctx, new THREE.BoxGeometry(2.0, 0.12, 1.4), ctx.M.timber, 0, 0.06, 0));
  for (const [x, z] of [[-0.62, -0.33], [0, -0.33], [0.62, -0.33], [-0.31, 0.33], [0.31, 0.33]]) {
    if (r() < 0.15) continue;
    g.add(part(ctx, new THREE.CylinderGeometry(0.29, 0.29, 0.88, 18), r() < 0.5 ? ctx.M.drum : ctx.M.drumB, x, 0.12 + 0.44, z, { cast: true }));
  }
  g.userData.colliders = [{ x: 0, z: 0.1, r: 1.2 }];
  return g;
}

/** A store: corrugated walls, a shallow pitched roof, a roller door and a row of high windows. 10.4 x 5.2 m. */
export function buildShed(ctx) {
  const g = new THREE.Group();
  const W = 10.4, D = 5.2, H = 3.4;
  g.add(part(ctx, new THREE.BoxGeometry(W, H, D), ctx.M.hallWall, 0, H / 2, 0, { cast: true }));
  for (const sx of [-1, 1]) {
    const roof = part(ctx, new THREE.BoxGeometry(W + 0.5, 0.16, D / 2 + 0.4), ctx.M.hallRoof, 0, H + 0.38, sx * (D / 4), { cast: true });
    roof.rotation.x = sx * 0.2;
    g.add(roof);
  }
  g.add(part(ctx, new THREE.BoxGeometry(3.2, 2.7, 0.08), ctx.M.darkSteel, -1.4, 1.4, D / 2 + 0.04));
  for (let i = 0; i < 9; i++) g.add(part(ctx, new THREE.BoxGeometry(3.2, 0.04, 0.12), ctx.M.steel, -1.4, 0.4 + i * 0.28, D / 2 + 0.1));
  for (const x of [2.2, 3.6]) g.add(part(ctx, new THREE.BoxGeometry(1.0, 0.6, 0.08), ctx.M.glassDark, x, 2.5, D / 2 + 0.04));
  g.userData.colliders = [-3.8, -1.9, 0, 1.9, 3.8].map(x => ({ x, z: 0, r: 2.7 }));
  return g;
}

/** A portal crane over the quay: four legs, two girders, a trolley and a hook. 10 x 6 m on the ground. */
export function buildGantryCrane(ctx) {
  const g = new THREE.Group();
  const TOP = 9.0;
  const spots = [[-5, -3], [5, -3], [-5, 3], [5, 3]];
  for (const [x, z] of spots) {
    g.add(part(ctx, new THREE.BoxGeometry(0.9, 0.3, 0.9), ctx.M.concrete, x, 0.15, z));
    g.add(part(ctx, new THREE.BoxGeometry(0.5, TOP, 0.5), ctx.M.rusted, x, TOP / 2 + 0.3, z, { cast: true }));
  }
  for (const sx of [-1, 1]) g.add(part(ctx, new THREE.BoxGeometry(0.6, 0.7, 7.0), ctx.M.rusted, sx * 5, TOP + 0.6, 0));
  for (const z of [-3, 3]) g.add(part(ctx, new THREE.BoxGeometry(11, 0.8, 0.6), ctx.M.darkSteel, 0, TOP + 1.2, z, { cast: true }));
  g.add(part(ctx, new THREE.BoxGeometry(1.6, 0.8, 2.2), ctx.M.paintYellow, 1.5, TOP + 1.2, 0));
  g.add(part(ctx, new THREE.CylinderGeometry(0.02, 0.02, 6.5, 5), ctx.M.darkSteel, 1.5, TOP - 2.1, 0));
  g.add(part(ctx, new THREE.BoxGeometry(0.5, 0.4, 0.5), ctx.M.darkSteel, 1.5, TOP - 5.4, 0));
  g.userData.colliders = spots.map(([x, z]) => ({ x, z, r: 0.55 }));
  return g;
}

/** The harbour light: a banded steel tower, a gallery and a glazed lantern room with a work lamp in it. */
export function buildHarbourLight(ctx) {
  const g = new THREE.Group();
  g.add(part(ctx, new THREE.CylinderGeometry(1.5, 1.7, 0.4, 14), ctx.M.concrete, 0, 0.2, 0));
  const bands = [ctx.M.paint2, ctx.M.paintRed, ctx.M.paint2, ctx.M.paintRed];
  bands.forEach((m, i) => {
    const r0 = 1.1 - i * 0.14, r1 = 1.1 - (i + 1) * 0.14;
    g.add(part(ctx, new THREE.CylinderGeometry(r1, r0, 4.2, 14), m, 0, 0.4 + i * 4.2 + 2.1, 0, { cast: true }));
  });
  g.add(part(ctx, new THREE.CylinderGeometry(1.1, 0.7, 0.3, 14), ctx.M.darkSteel, 0, 17.3, 0));
  g.add(part(ctx, new THREE.CylinderGeometry(0.62, 0.62, 1.4, 12), ctx.M.glassDark, 0, 18.15, 0));
  g.add(part(ctx, new THREE.ConeGeometry(0.8, 0.8, 12), ctx.M.darkSteel, 0, 19.25, 0));
  lampAt(ctx, g, 0, 18.15, 0, { intensity: 6, distance: 22, w: 0.5, h: 0.6 });
  g.userData.colliders = [{ x: 0, z: 0, r: 1.5 }];
  return g;
}

/** The pad the Avalon lands on: an octagon of concrete with painted rings, a hand above the shelf. */
export function buildLandingPad(ctx, field) {
  const g = new THREE.Group();
  const R = field.PAD_R;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#7f8887';
  x.fillRect(0, 0, 512, 512);
  x.strokeStyle = '#dfe6e4';
  x.lineWidth = 12;
  x.beginPath(); x.arc(256, 256, 205, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 6;
  x.beginPath(); x.arc(256, 256, 150, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#c9a14a';
  x.beginPath(); x.moveTo(256, 120); x.lineTo(320, 250); x.lineTo(256, 215); x.lineTo(192, 250); x.closePath(); x.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  ctx.own(tex);
  const mat = ctx.own(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.05 }));
  const geo = ctx.own(new THREE.CylinderGeometry(R, R + 0.4, field.PAD_TOP + 0.1, 8));
  geo.rotateY(Math.PI / 8);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (R * 2.2), 0.5 + pos.getZ(i) / (R * 2.2));
  const plate = new THREE.Mesh(geo, mat);
  plate.position.y = (field.PAD_TOP + 0.1) / 2 - 0.1;
  plate.receiveShadow = ctx.t4;
  plate.userData.phys = 'ground';
  g.add(plate);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const lamp = part(ctx, new THREE.BoxGeometry(0.24, 0.06, 0.24), ctx.M.lantern, Math.cos(a) * (R - 0.6), field.PAD_TOP + 0.02, Math.sin(a) * (R - 0.6));
    lamp.userData.phys = 'ground';
    g.add(lamp);
    const mark = new THREE.Object3D();
    mark.position.set(Math.cos(a) * (R - 0.6), field.PAD_TOP + 0.4, Math.sin(a) * (R - 0.6));
    mark.userData.lamp = { color: 0xe6a443, intensity: 3, distance: 9, decay: 1.6 };
    g.add(mark);
    ctx.lamps.push(mark);
  }
  g.userData.colliders = [];
  return g;
}

/* ------------------------------------------------------------ the Fifth's ice */

/**
 * A wall of crystal ice: a cluster of tall six-sided columns with pointed heads, leaning a little on
 * one another, round a mound of frost-heaved ice. Standing in its own landmark's circle (radius 4.4 times its scale).
 */
export function buildIceWall(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0x1ce + seed * 31);
  const scale = lm.scale || 1;
  g.add(part(ctx, rockGeometry(2.8 * scale, seed * 7 + 3, { squash: 0.5, rough: 0.2, sink: 0.3 }), ctx.M.iceDeep, 0, 0, 0, { cast: true }));
  const colliders = [];
  const N = 7;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + r() * 0.6;
    const d = i === 0 ? 0 : (1.3 + r() * 1.0) * scale;
    const cr = (i === 0 ? 1.3 : 0.6 + r() * 0.6) * scale;
    const ch = (i === 0 ? 8.5 + r() * 2.5 : 4.0 + r() * 4.2) * scale;
    const m = part(ctx, crystalGeometry(cr, ch, { seed: i + seed }), i % 3 === 2 ? ctx.M.iceDeep : ctx.M.ice, Math.sin(a) * d, 0.1, Math.cos(a) * d, { cast: true });
    m.rotation.set((r() - 0.5) * 0.16, 0, (r() - 0.5) * 0.16);
    g.add(m);
    colliders.push({ x: Math.sin(a) * d, z: Math.cos(a) * d, r: cr * 1.15 + 0.3 });
  }
  g.userData.colliders = colliders;
  return g;
}

/**
 * A hull frozen into the canal's sheet. `length` and `beam` in metres; the bow points to +z. It lists a
 * little to one side, as a ship does when the ice has taken it, and stands in the water to its
 * waterline: the sheet is round it.
 */
export function buildHull(ctx, { length = 28, beam = 8.6, roll = 0.05, freeboard = 4.2, tug = false } = {}) {
  const g = new THREE.Group();
  const L = length / 2, B = beam / 2;
  const draft = 1.3;
  const H = freeboard + draft;
  // The hull in plan: a blunt stern, straight sides, a pointed bow. Shape y runs opposite plan z.
  const plan = tug
    ? [[-B, -L], [B, -L], [B, L * 0.3], [B * 0.55, L * 0.8], [0, L], [-B * 0.55, L * 0.8], [-B, L * 0.3]]
    : [[-B * 0.92, -L], [B * 0.92, -L], [B, -L * 0.2], [B, L * 0.45], [B * 0.62, L * 0.82], [0, L], [-B * 0.62, L * 0.82], [-B, L * 0.45], [-B, -L * 0.2]];
  const shape = new THREE.Shape(plan.map(([x, z]) => new THREE.Vector2(x, -z)));
  const hullGeo = ctx.own(new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false }));
  hullGeo.rotateX(-Math.PI / 2);
  const hull = new THREE.Mesh(hullGeo, ctx.M.shipHull);
  hull.position.y = -draft;
  hull.castShadow = hull.receiveShadow = ctx.t4;
  g.add(hull);
  // The deck, the bulwark rail and the boot-topping stripe.
  const deckGeo = ctx.own(new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false }));
  deckGeo.rotateX(-Math.PI / 2);
  deckGeo.scale(0.97, 1, 0.985);
  const deck = new THREE.Mesh(deckGeo, ctx.M.darkSteel);
  deck.position.y = freeboard - 0.02;
  g.add(deck);
  // Deckhouse aft, a funnel behind it, two masts.
  const hz = -L * 0.55;
  g.add(part(ctx, new THREE.BoxGeometry(beam * 0.7, 2.6, length * 0.2), ctx.M.hallWall, 0, freeboard + 1.3, hz, { cast: true }));
  g.add(part(ctx, new THREE.BoxGeometry(beam * 0.74, 0.12, length * 0.22), ctx.M.hallRoof, 0, freeboard + 2.66, hz));
  g.add(part(ctx, new THREE.BoxGeometry(beam * 0.5, 1.7, length * 0.12), ctx.M.hallWall, 0, freeboard + 3.5, hz - 0.2));
  g.add(part(ctx, new THREE.BoxGeometry(beam * 0.5, 0.5, 0.06), ctx.M.glassDark, 0, freeboard + 3.7, hz - 0.2 + length * 0.06 + 0.02));
  g.add(part(ctx, new THREE.CylinderGeometry(0.7, 0.9, 3.2, 14), ctx.M.shipHull, 0, freeboard + 4.2, hz - length * 0.08, { cast: true }));
  g.add(part(ctx, new THREE.CylinderGeometry(0.75, 0.75, 0.5, 14), ctx.M.paintRed, 0, freeboard + 5.55, hz - length * 0.08));
  if (!tug) {
    for (const z of [L * 0.62, -L * 0.1]) {
      g.add(part(ctx, new THREE.CylinderGeometry(0.1, 0.14, 7.5, 8), ctx.M.darkSteel, 0, freeboard + 3.75, z));
      g.add(part(ctx, new THREE.BoxGeometry(beam * 0.6, 0.08, 0.08), ctx.M.darkSteel, 0, freeboard + 6.2, z));
    }
    // Hatch covers along the deck.
    for (const z of [L * 0.2, L * 0.42, -L * 0.28]) g.add(part(ctx, new THREE.BoxGeometry(beam * 0.55, 0.5, length * 0.14), ctx.M.darkSteel, 0, freeboard + 0.26, z));
    // A derrick on the foredeck.
    g.add(between(ctx, [0, freeboard, L * 0.7], [0, freeboard + 5.2, L * 0.66], 0.1, ctx.M.darkSteel, 7));
    g.add(between(ctx, [0, freeboard + 5.2, L * 0.66], [beam * 0.34, freeboard + 2.2, L * 0.9], 0.07, ctx.M.darkSteel, 6));
  }
  g.rotation.z = roll;
  g.userData.colliders = [];
  return g;
}
