/**
 * table-props.js — The solid things on a built tabletop: trays, slots, jars, dials, dishes, lenses, blades, atoms.
 *
 * WHY THIS FILE EXISTS. A tabletop built from a cylinder with a texture on it, a box with a texture on it and four
 * boxes for a tray reads as exactly that: "a bunch of squares with weird textures fitted on top". A bench object has
 * an edge that has been handled, a wall with a thickness, a lip, a handle, a hinge. This file builds each kind of
 * thing as the thing it is, from three families of shape and nothing more:
 *
 *   - rounded slabs (an extruded rounded rectangle with a small bevel): cards, deck plates, keys, trays' walls;
 *   - lathed bodies (a profile turned about the vertical): dishes, knobs, beads, pucks, bowls;
 *   - a few assembled tools (a lens in its ring, a blade in its handle), from those two.
 *
 * EVERY EDGE IS BROKEN. Nothing here has a sharp 90-degree edge: slabs carry a bevel, lathe profiles are rounded at
 * every corner. A sharp box is the single clearest sign of a toy, and the cure is geometry (the light catches a
 * bevel), not texture.
 *
 * NOTHING IS FACTORY-NEW. Colours of one kind of thing differ a little from one example to the next (a seeded jitter
 * on the id), and the painted faces are weathered (`weatherFace`) before they go on.
 *
 * THE PICTURE STAYS HONEST. A face the kit paints (an atom's symbol and lamp, a dish's scope picture) is the SAME
 * canvas the drawn table paints (`kit.paintPiece`); this file only decides what it is stuck to.
 *
 * Pure builders over THREE: they take what they need and return meshes. Ownership (disposing what a table made) is
 * the table's, through the `own`/`mine` hooks it passes in.
 */

import * as THREE from 'three';

/** The height of a sample dish's rim above the plate: a lens resting on it is raised by this much. */
export const DISH_H = 0.034;
/** The thickness of a coin-like piece (a token, a dispenser, a specimen). */
export const PUCK_H = 0.026;
/** The thickness of a card. */
export const CARD_H = 0.016;

/** A tint's jitter: the same id always weathers the same way, a different id a little differently. */
export function jitter(id, spread = 0.06) {
  let h = 2166136261;
  for (let i = 0; i < String(id).length; i++) { h ^= String(id).charCodeAt(i); h = Math.imul(h, 16777619); }
  const u = ((h >>> 0) % 10007) / 10007;
  return 1 + (u - 0.5) * 2 * spread;
}

/** `color` (a hex number) scaled in lightness by `k`, clamped. */
export function shade(color, k) {
  const c = new THREE.Color(color);
  c.multiplyScalar(k);
  return c;
}

/* ------------------------------------------------------------------ shapes */

/** A rounded rectangle, centred, as a path of `rad` corners. */
export function roundedRectShape(w, d, rad) {
  const x = -w / 2;
  const y = -d / 2;
  const r = Math.max(0.0005, Math.min(rad, w / 2 - 0.0005, d / 2 - 0.0005));
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function holePath(w, d, rad) {
  const x = -w / 2;
  const y = -d / 2;
  const r = Math.max(0.0005, Math.min(rad, w / 2 - 0.0005, d / 2 - 0.0005));
  const p = new THREE.Path();
  p.moveTo(x + r, y);
  p.quadraticCurveTo(x, y, x, y + r);
  p.lineTo(x, y + d - r);
  p.quadraticCurveTo(x, y + d, x + r, y + d);
  p.lineTo(x + w - r, y + d);
  p.quadraticCurveTo(x + w, y + d, x + w, y + d - r);
  p.lineTo(x + w, y + r);
  p.quadraticCurveTo(x + w, y, x + w - r, y);
  p.lineTo(x + r, y);
  return p;
}

/**
 * An extruded shape standing on y = 0, `h` tall, its edges broken by `bevel`. The shape is drawn in the plan (x, z);
 * the bevel stands outside it, so the footprint is the shape grown by `bevel` all round.
 */
export function slabGeometry(shape, h, bevel = 0.002) {
  const bt = Math.min(bevel, h / 3);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.0005, h - 2 * bt), bevelEnabled: bt > 0, bevelThickness: bt, bevelSize: bt, bevelSegments: 2, curveSegments: 6
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bt, 0);
  return geo;
}

/**
 * Box-project a geometry's UVs: each vertex is mapped flat along the axis its normal points most along, 0 to 1 across the box
 * `w` x `h` x `d` centred on the origin. An extrusion's own UVs are in metres, which would smear a texture made for a box.
 */
export function boxUVs(geo, w, h, d) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    const x = pos.getX(i) / w + 0.5;
    const y = pos.getY(i) / h + 0.5;
    const z = pos.getZ(i) / d + 0.5;
    if (ax >= ay && ax >= az) uv.setXY(i, z, y);
    else if (ay >= az) uv.setXY(i, x, z);
    else uv.setXY(i, x, y);
  }
  uv.needsUpdate = true;
  return geo;
}

/** A rounded slab `w` x `d` in plan, `h` tall. */
export function roundedSlab(w, d, h, rad = 0.012, bevel = 0.002) {
  const b = Math.min(bevel, h / 3);
  return slabGeometry(roundedRectShape(Math.max(0.002, w - 2 * b), Math.max(0.002, d - 2 * b), Math.max(0.001, rad - b)), h, bevel);
}

/** A tray's walls: a rounded rectangle with the middle taken out. */
export function wallGeometry(w, d, wall, h, rad = 0.02, bevel = 0.0025) {
  const b = Math.min(bevel, h / 3);
  const shape = roundedRectShape(w - 2 * b, d - 2 * b, Math.max(0.002, rad - b));
  shape.holes.push(holePath(Math.max(0.01, w - 2 * wall + 2 * b), Math.max(0.01, d - 2 * wall + 2 * b), Math.max(0.001, rad - wall)));
  return slabGeometry(shape, h, bevel);
}

/** A body of revolution about the vertical from a profile of [radius, height] points (outside, bottom to top, then inside). */
export function lathe(points, segments = 40) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

/* ------------------------------------------------------------------ materials */

/**
 * The materials a table dresses its own pieces in, made once per table. A host's own metals (`mats.top`, `mats.dark`) are
 * used wherever a thing is the host's steel; these are for what the host does not supply: enamel, brass, rubber, glass.
 */
export function makeKitMaterials() {
  const std = (color, roughness, metalness, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  return {
    enamel: std(0xcfc8b4, 0.52, 0.06),
    enamelDark: std(0x3b4650, 0.5, 0.12),
    tin: std(0x8d887a, 0.46, 0.78),
    brass: std(0xa5813a, 0.38, 0.85),
    rubber: std(0x1f1d1a, 0.92, 0.02),
    lining: std(0x25241f, 0.95, 0.04),
    blade: std(0xb9bbb5, 0.28, 0.95),
    glass: std(0xb8cfd0, 0.06, 0.0, { transparent: true, opacity: 0.2, depthWrite: false }),
    bone: std(0xcdc3a8, 0.5, 0.04),
    paper: std(0xd9d1bb, 0.88, 0.0)
  };
}

/* ------------------------------------------------------------------ fixtures of the table: trays, slots, jars, decks */

function meshOf(geo, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

/**
 * A tray: pressed-metal walls with a rounded lip, a lining on the floor. `w` x `d` metres in plan, centred on the origin,
 * standing on y = 0. The walls are low (a hand reaches over them) and a piece in the tray stands on the lining.
 */
export function buildTray(w, d, { wallMat, liningMat, h = 0.016, wall = 0.012 } = {}) {
  const g = new THREE.Group();
  g.add(meshOf(wallGeometry(w, d, wall, h, 0.022), wallMat));
  const floor = meshOf(roundedSlab(w - wall, d - wall, 0.0026, 0.016, 0.0006), liningMat, { cast: false });
  g.add(floor);
  return g;
}

/** A slot: a shallow socket a card or a piece is set in. Lower and plainer than a tray. */
export function buildSlot(w, d, { wallMat, liningMat } = {}) {
  const g = new THREE.Group();
  g.add(meshOf(wallGeometry(w, d, 0.008, 0.009, 0.014, 0.0018), wallMat));
  if (liningMat) g.add(meshOf(roundedSlab(w - 0.006, d - 0.006, 0.002, 0.01, 0.0005), liningMat, { cast: false }));
  return g;
}

/** A jar: a tall-walled bin. The level a jar holds is a slab the table scales in it. */
export function buildJar(w, d, { wallMat, liningMat }) {
  const g = new THREE.Group();
  g.add(meshOf(wallGeometry(w, d, 0.014, 0.05, 0.03, 0.003), wallMat));
  g.add(meshOf(roundedSlab(w - 0.01, d - 0.01, 0.004, 0.02, 0.0008), liningMat, { cast: false }));
  return g;
}

/**
 * An instrument bezel: a low frame round a fixture's box, its edges broken. What the instrument shows (a needle, a beam, a
 * reading) is printed inside it on the mat, flat, so the frame is a ring and not a plate.
 */
export function buildDeck(w, d, { mat }) {
  return meshOf(wallGeometry(w, d, 0.01, 0.011, 0.02, 0.0025), mat);
}

/** A dial's knob: a turned cap with a grip edge and a pointer notch. `r` metres. */
export function buildKnob(r, { capMat, notchMat }) {
  const g = new THREE.Group();
  const prof = [[0, 0], [r * 1.0, 0], [r * 1.04, 0.003], [r * 1.0, 0.012], [r * 0.92, 0.021], [r * 0.7, 0.026], [0, 0.027]];
  g.add(meshOf(lathe(prof, 28), capMat));
  // The grip: a ring of small flats cut round the edge, as a knurl is, seen as a band of ribs.
  const rib = new THREE.BoxGeometry(r * 0.1, 0.012, r * 0.16);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const m = meshOf(rib, capMat, { receive: false });
    m.position.set(Math.cos(a) * r * 1.02, 0.008, Math.sin(a) * r * 1.02);
    m.rotation.y = -a;
    g.add(m);
  }
  const notch = meshOf(new THREE.BoxGeometry(r * 0.12, 0.002, r * 0.7), notchMat, { cast: false });
  notch.position.set(0, 0.0272, -r * 0.3);
  g.add(notch);
  return g;
}

/** A run key: a rounded cap that stands proud of its deck. */
export function buildKey(w, d, { capMat }) {
  return meshOf(roundedSlab(w, d, 0.016, 0.01, 0.003), capMat);
}

/* ------------------------------------------------------------------ the pieces */

/**
 * A bead (an atom, a particle): a dome standing on the table with the kit's painted face printed on its top, as a
 * stamped disc on a bead. `faceMat` carries the painted canvas; the dome's top is mapped flat onto it so the face
 * is the face the drawn table shows, undistorted from above.
 */
export function buildBead(r, faceMat, bodyMat) {
  const g = new THREE.Group();
  const ky = 0.62;
  const skirtH = r * 0.12;
  // The dome is the upper half of a squashed sphere, its top mapped flat onto the face (u, v from x, z).
  const geo = new THREE.SphereGeometry(r, 28, 9, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, 0.5 + pos.getX(i) / (2 * r), 0.5 - pos.getZ(i) / (2 * r));
  }
  uv.needsUpdate = true;
  geo.scale(1, ky, 1);
  geo.translate(0, skirtH, 0);
  g.add(meshOf(geo, faceMat));
  // A short skirt under the dome, in the body's own colour: the bead stands on the table and does not float on it.
  g.add(meshOf(lathe([[0, 0], [r * 0.985, 0], [r * 1.0, skirtH * 0.4], [r * 1.0, skirtH + 0.0005]], 28), bodyMat, { receive: false }));
  g.userData.height = skirtH + r * ky;
  return g;
}

/**
 * A ball: a full solid round sphere resting directly on the tabletop, with the painted face
 * mapped onto its surface.
 */
export function buildBall(r, faceMat, bodyMat, { showCap = true, collar = false } = {}) {
  const g = new THREE.Group();
  if (collar) {
    const collarH = r * 0.14;
    const collarProf = [
      [r * 0.35, 0], [r * 0.62, 0], [r * 0.66, collarH * 0.35],
      [r * 0.62, collarH], [r * 0.44, collarH * 1.08], [r * 0.35, collarH]
    ];
    g.add(meshOf(lathe(collarProf, 28), bodyMat, { receive: false }));
  }
  const cy = r;
  const sphereGeo = new THREE.SphereGeometry(r, 32, 24);
  const pos = sphereGeo.attributes.position;
  const uv = sphereGeo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    uv.setXY(i, 0.5 + (x / r) * 0.46, 0.5 - (z / r) * 0.46);
  }
  uv.needsUpdate = true;
  const mat = (showCap && faceMat) ? faceMat : (bodyMat || faceMat);
  const ball = meshOf(sphereGeo, mat);
  ball.position.y = cy;
  g.add(ball);
  g.userData.height = cy + r;
  return g;
}

/** A puck: a turned disc with a bevelled edge, the face printed on its top. */
export function buildPuck(r, thick, faceMat, bodyMat) {
  const g = new THREE.Group();
  const prof = [[0, 0], [r * 0.97, 0], [r * 1.02, thick * 0.12], [r * 1.02, thick * 0.78], [r * 0.97, thick], [0, thick]];
  g.add(meshOf(lathe(prof, 28), bodyMat));
  const face = new THREE.Mesh(new THREE.CircleGeometry(r * 0.94, 28), faceMat);
  face.rotation.x = -Math.PI / 2;
  face.position.y = thick + 0.0007;
  face.receiveShadow = true;
  g.add(face);
  g.userData.height = thick;
  return g;
}

/**
 * A sample dish: an enamelled pan with a rolled iron rim, a sloped wall and a floor the sample lies on. The painted
 * face (the scope's picture of what the dish holds) is the floor.
 */
export function buildDish(r, faceMat, { enamel, rim }) {
  const g = new THREE.Group();
  const h = DISH_H;
  const floorY = h * 0.22;
  const body = lathe([
    [0, 0], [r * 0.9, 0], [r * 0.985, h * 0.1], [r * 1.0, h * 0.5], [r * 0.99, h * 0.9],
    [r * 0.95, h * 0.98], [r * 0.9, h * 0.94], [r * 0.88, h * 0.72], [r * 0.86, floorY + h * 0.06], [r * 0.82, floorY], [0, floorY]
  ], 40);
  g.add(meshOf(body, enamel));
  // The rolled rim, in dark iron where the enamel has chipped away: a ring on the lip.
  const ring = meshOf(new THREE.TorusGeometry(r * 0.955, h * 0.07, 6, 40), rim);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = h * 0.965;
  g.add(ring);
  const face = new THREE.Mesh(new THREE.CircleGeometry(r * 0.8, 36), faceMat);
  face.rotation.x = -Math.PI / 2;
  face.position.y = floorY + 0.0009;
  face.receiveShadow = true;
  g.add(face);
  g.userData.height = h;
  return g;
}

/**
 * A magnifier: a brass ring round a glass, a handle that points at the player. With a picture (`faceMat`, the scope's
 * magnified view) the glass is the picture; without one it is clear, and the table under it shows through.
 */
export function buildLens(r, faceMat, { brass, glass, grip }) {
  const g = new THREE.Group();
  const t = 0.026;
  const ring = meshOf(new THREE.TorusGeometry(r * 0.93, r * 0.075, 8, 40), brass);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = t * 0.5;
  g.add(ring);
  const glassDisc = meshOf(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.006, 36), glass, { cast: false });
  glassDisc.position.y = t * 0.5;
  g.add(glassDisc);
  if (faceMat) {
    const pic = new THREE.Mesh(new THREE.CircleGeometry(r * 0.87, 36), faceMat);
    pic.rotation.x = -Math.PI / 2;
    pic.position.y = t * 0.5 + 0.0035;
    g.add(pic);
  }
  // The handle: a brass neck out of the ring, then a turned grip, pointing at the player (+z).
  const neck = meshOf(roundedSlab(r * 0.18, r * 0.34, 0.012, 0.006, 0.0015), brass);
  neck.position.set(0, t * 0.5 - 0.006, r * 1.08);
  g.add(neck);
  const gripGeo = lathe([[0, 0], [r * 0.085, 0], [r * 0.12, r * 0.05], [r * 0.12, r * 0.55], [r * 0.085, r * 0.62], [0, r * 0.62]], 16);
  const handle = meshOf(gripGeo, grip);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0, t * 0.5, r * 1.2);
  g.add(handle);
  g.userData.height = t;
  return g;
}

/**
 * A craft knife: a ridged rubber handle and a steel blade with a ground edge, pointing away from the player (-z).
 * `r` is the kit's grab radius in metres; the whole tool is about 2.4 r long.
 */
export function buildCutter(r, { rubber, blade, brass }) {
  const g = new THREE.Group();
  const hl = r * 1.25;
  const handle = meshOf(roundedSlab(r * 0.34, hl, 0.026, 0.01, 0.003), rubber);
  handle.position.set(0, 0, r * 0.62);
  g.add(handle);
  // Finger ridges across the grip.
  const ridge = new THREE.BoxGeometry(r * 0.38, 0.003, 0.006);
  for (let i = 0; i < 6; i++) {
    const m = meshOf(ridge, rubber, { receive: false });
    m.position.set(0, 0.0275, r * (0.28 + i * 0.12));
    g.add(m);
  }
  const collar = meshOf(roundedSlab(r * 0.3, r * 0.14, 0.018, 0.006, 0.002), brass);
  collar.position.set(0, 0.002, -r * 0.08);
  g.add(collar);
  // The blade: a long flat triangle with a bevelled edge, standing a little off the table.
  const s = new THREE.Shape();
  s.moveTo(-r * 0.13, 0);
  s.lineTo(r * 0.13, 0);
  s.lineTo(r * 0.13, -r * 0.5);
  s.lineTo(-r * 0.02, -r * 1.12);
  s.lineTo(-r * 0.13, -r * 0.5);
  s.closePath();
  const bg = new THREE.ExtrudeGeometry(s, { depth: 0.0016, bevelEnabled: true, bevelThickness: 0.0008, bevelSize: 0.0012, bevelSegments: 1 });
  bg.rotateX(-Math.PI / 2);
  const b = meshOf(bg, blade);
  b.position.set(0, 0.012, -r * 0.14);
  g.add(b);
  g.userData.height = 0.03;
  return g;
}

/** A card: a rounded slab with the kit's painted face on top and a worn edge. */
export function buildCard(hw, hh, faceMat, bodyMat) {
  const g = new THREE.Group();
  g.add(meshOf(roundedSlab(hw * 2, hh * 2, CARD_H, Math.min(hw, hh) * 0.16, 0.0025), bodyMat));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.95, hh * 2 * 0.95), faceMat);
  face.rotation.x = -Math.PI / 2;
  face.position.y = CARD_H + 0.0006;
  face.receiveShadow = true;
  g.add(face);
  g.userData.height = CARD_H;
  return g;
}

/** A readout box (a detector, a counter): a cased slab with a window for the painted face. */
export function buildCase(hw, hh, faceMat, bodyMat) {
  const g = new THREE.Group();
  const t = 0.034;
  g.add(meshOf(roundedSlab(hw * 2, hh * 2, t, Math.min(hw, hh) * 0.14, 0.003), bodyMat));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.82, hh * 2 * 0.82), faceMat);
  face.rotation.x = -Math.PI / 2;
  face.position.y = t + 0.0007;
  face.receiveShadow = true;
  g.add(face);
  g.userData.height = t;
  return g;
}

export { buildAtom3D, buildAtom3D as buildAtom, buildModel3D, buildNucleus3D, buildSpecimen3D } from './atom3d.js';

