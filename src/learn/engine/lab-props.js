/**
 * lab-props.js — The physical things on a Lanternfall bench: lamps, tubes, bulbs, gas cells, metal plates, detectors, cuvettes,
 * droppers, instrument cases and the sockets they stand in.
 *
 * WHY THIS FILE EXISTS. `table-props.js` builds the shared tabletop vocabulary (trays, beads, dishes, cards). The optics, cloud,
 * spectrum, trends and cuvette kits had nothing of their own, so every lamp, every tube and every cuvette was the same thin card
 * with a picture on it, and every instrument was a flat bezel round a flat picture: "a bunch of squares with weird textures
 * fitted on top". A lamp is a housing with a lens in front of it. A discharge tube is a glass tube between two brass caps. A
 * cuvette is a glass cell with a liquid column in it, standing in a rack. This file builds each as what it is.
 *
 * THE RULES (the same as `table-props.js`, which owns the reasoning):
 *   - nothing has a sharp 90-degree edge except glass, which is cut: housings are rounded slabs, bodies of revolution are lathed;
 *   - nothing is factory-new: the colours below are weathered, and a metal is the metal it is named for;
 *   - the picture stays honest: a figure a piece prints is painted by the kit (`c.paint`) or set by `c.label`, never drawn here;
 *   - only lamps are lit. A lit source is an emissive surface with no light cast, and only the lamp, the tube and the filament
 *     (the things that make light) ever are.
 *
 * Every builder takes a context `c` that `Table3D` fills in: `{ hw, hh }` (the piece's half footprint in metres), `mats` (the
 * table's shared materials plus `makeLabMaterials()`), `own(mat)` (a material only this table uses), `label(text, w, h, opts)` (an
 * engraved legend as a flat mesh) and `paint(w, h, fn)` (a flat mesh painted by a kit function). A builder returns a Group
 * standing on y = 0, centred on the piece, with its footprint inside `hw` x `hh`, and sets `userData.height`.
 *
 * Pure over THREE: no DOM except what `c` supplies, so `verify:bench` and a scratch script build these in Node.
 */

import * as THREE from 'three';
import { roundedSlab, wallGeometry, lathe } from './table-props.js';

/* ------------------------------------------------------------------ materials */

/** Materials shared by every lab prop, made once per table. */
export function makeLabMaterials() {
  const std = (color, roughness, metalness, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const phys = (o) => new THREE.MeshPhysicalMaterial(o);
  return {
    labGlass: phys({ color: 0xd2e6e4, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }),
    // A pane over a picture: almost clear, so the screen under it keeps its contrast and only a sheen shows.
    labPane: phys({ color: 0xe6f0ee, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.07, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide }),
    labSmoke: phys({ color: 0x1b2321, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.6, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide }),
    labSteel: std(0x9a9d9b, 0.36, 0.9),
    labAnodised: std(0x2a2e33, 0.52, 0.55),
    labCast: std(0x505356, 0.66, 0.7),
    labBrass: std(0x8d7034, 0.44, 0.85),
    labRubber: std(0x232220, 0.92, 0.03),
    labCeramic: std(0xd2ccb8, 0.62, 0.04),
    labBakelite: std(0x2d2218, 0.55, 0.08),
    labWater: phys({ color: 0x9cc3cf, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.5, depthWrite: false })
  };
}

/** What a metal plate is made of, in colour: a sample is the metal it is named for, a little tarnished. */
const METAL_TINT = Object.freeze({
  Na: 0xb9b5a4, K: 0xb2ae9f, Cs: 0xc4b383, Zn: 0x8e9ba3, Cu: 0xa9643d, Fe: 0x77797a, Al: 0xaeb2b4, Mg: 0xa9aca9, Ag: 0xc1c3c4, Au: 0xbf9b45
});
export const metalTint = sym => METAL_TINT[sym] ?? 0xa0a3a4;

/* ------------------------------------------------------------------ small helpers */

const mesh = (geo, mat, { cast = true, receive = true } = {}) => {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
};

const at = (obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); return obj; };

/** A cylinder lying along x. */
function lying(rTop, rBot, len, mat, seg = 28, opts) {
  const m = mesh(new THREE.CylinderGeometry(rTop, rBot, len, seg), mat, opts);
  m.rotation.z = Math.PI / 2;
  return m;
}

/** A ring (torus) whose axis is x. */
function ringX(R, r, mat, seg = 24) {
  const m = mesh(new THREE.TorusGeometry(R, r, 8, seg), mat);
  m.rotation.y = Math.PI / 2;
  return m;
}

/** A tinted copy of a shared material, owned by the table (a piece's own colour, so a lit lamp differs from a dark one). */
const tinted = (c, base, color, extra = {}) => {
  const m = c.own(base.clone());
  m.color = new THREE.Color(color);
  Object.assign(m, extra);
  return m;
};

/** A material that glows with `rgb` (0-255 triple): a lit lamp, a hot filament. A mark of light, not a light. */
const glowing = (c, rgb, intensity = 0.9) => {
  const col = new THREE.Color(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  return c.own(new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.25), emissive: col, emissiveIntensity: intensity, roughness: 0.35, metalness: 0 }));
};

/** A row of `n` thin ribs (a vent, a heat sink) along x, over a width `w`, on the top at `y`. */
function ribs(g, n, w, d, y, mat, h = 0.006) {
  const geo = new THREE.BoxGeometry(w / (n * 2), h, d);
  for (let i = 0; i < n; i++) {
    const m = mesh(geo, mat, { receive: false });
    m.position.set(-w / 2 + (i + 0.5) * (w / n), y + h / 2, 0);
    g.add(m);
  }
}

/** A slotted screw head: a short disc with a slot, lying on a face. */
function screw(mat, r = 0.0055, slotMat) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r * 1.08, 0.004, 12), mat, { receive: false }));
  const slot = mesh(new THREE.BoxGeometry(r * 1.7, 0.0012, r * 0.28), slotMat || mat, { cast: false, receive: false });
  slot.position.y = 0.0022;
  g.add(slot);
  return g;
}

const done = (g, height) => { g.userData.height = height; return g; };

/* ------------------------------------------------------------------ pieces: optics */

/**
 * A lamp: a cased housing with a lens barrel at the front. `lit` shows the lens glowing in the colour of its light (`rgb`); unlit
 * it is dark glass. The name is engraved on the top of the housing.
 */
export function buildLamp(c, { lit = false, rgb = null, text = '' } = {}) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const bodyH = Math.min(0.05, hh * 0.46);
  const bw = hw * 1.4;
  const bd = hh * 1.86;
  // The light leaves to the right, the way it runs on every bench (a source on the left, the instrument it feeds on the right).
  const bx = -hw + hw * 0.14 + bw / 2;
  g.add(at(mesh(roundedSlab(bw, bd, bodyH, hh * 0.3, 0.003), m.labAnodised), bx, 0, 0));
  // The barrel: a steel sleeve at the front, taller than the case, with a brass bezel and the lens in it.
  const br = Math.min(hh * 0.66, 0.05);
  const bl = hw * 0.62;
  const cy = br * 0.95;
  g.add(at(lying(br, br, bl, m.labSteel, 32), hw - bl / 2, cy, 0));
  g.add(at(ringX(br * 0.9, br * 0.08, m.labBrass, 32), hw - 0.002, cy, 0));
  const lensMat = lit && rgb ? glowing(c, rgb, 1.0) : m.labSmoke;
  const lens = mesh(new THREE.CircleGeometry(br * 0.84, 32), lensMat, { cast: false });
  lens.rotation.y = Math.PI / 2;
  lens.position.set(hw + 0.0004, cy, 0);
  g.add(lens);
  // A collar where the sleeve meets the case.
  g.add(at(lying(br * 1.08, br * 1.08, hw * 0.07, m.labCast, 32), hw - bl + hw * 0.02, cy, 0));
  // Vents along the back of the top, and the engraved name.
  const vents = new THREE.Group();
  ribs(vents, 5, bw * 0.46, bd * 0.12, bodyH, m.labRubber, 0.003);
  vents.position.set(bx - bw * 0.1, 0, -bd * 0.3);
  g.add(vents);
  if (text) {
    const tag = c.label(text, bw * 0.62, Math.min(hh * 0.62, 0.06));
    tag.position.set(bx - bw * 0.12, bodyH + 0.0006, bd * 0.06);
    g.add(tag);
  }
  // The lead out of the back.
  g.add(at(lying(0.006, 0.006, hw * 0.16, m.labRubber, 10), -hw + hw * 0.08, bodyH * 0.45, 0));
  return done(g, cy + br);
}

/**
 * A radiating source (a mast, an oven, an X-ray tube): a cast housing with heat fins along the top and a round window at one
 * end. It is what puts its light out; its name is engraved beside the fins.
 */
export function buildEmitter(c, { text = '' } = {}) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const bodyH = Math.min(0.055, hh * 0.52);
  const bw = hw * 1.9;
  const bd = hh * 1.8;
  g.add(at(mesh(roundedSlab(bw, bd, bodyH, hh * 0.26, 0.003), m.labCast), 0, 0, 0));
  const fins = new THREE.Group();
  ribs(fins, 8, bw * 0.4, bd * 0.7, bodyH, m.labCast, 0.014);
  fins.position.set(-bw * 0.2, 0, 0);
  g.add(fins);
  // The window: a steel flange and dark glass, at the right-hand end.
  const wr = Math.min(hh * 0.55, 0.05);
  g.add(at(lying(wr, wr, 0.012, m.labSteel, 28), bw / 2 - wr * 0.5, bodyH * 0.55, 0));
  const win = mesh(new THREE.CircleGeometry(wr * 0.72, 28), m.labSmoke, { cast: false });
  win.rotation.y = Math.PI / 2;
  win.position.set(bw / 2 - wr * 0.5 + 0.0066, bodyH * 0.55, 0);
  g.add(win);
  if (text) {
    const tag = c.label(text, bw * 0.44, Math.min(hh * 0.52, 0.05));
    tag.position.set(bw * 0.24, bodyH + 0.0006, bd * 0.18);
    g.add(tag);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const s = screw(m.labSteel, 0.005, m.labRubber);
    s.position.set(sx * (bw / 2 - 0.016), bodyH, sz * (bd / 2 - 0.016));
    g.add(s);
  }
  return done(g, bodyH + 0.014);
}

/**
 * A metal sample plate: a coupon of the metal itself (`sym`) on a dark bakelite carrier, a hanging eye at the back, the metal's name
 * stamped on a tag in front.
 */
export function buildPlateSample(c, { sym = '', text = '' } = {}) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const cw = hw * 1.9;
  const cd = hh * 1.9;
  g.add(at(mesh(roundedSlab(cw, cd, 0.009, Math.min(hw, hh) * 0.16, 0.0025), m.labBakelite), 0, 0, 0));
  const metal = c.own(new THREE.MeshStandardMaterial({ color: metalTint(sym), roughness: 0.4, metalness: 0.92 }));
  const kw = cw * 0.82;
  const kd = cd * 0.6;
  g.add(at(mesh(roundedSlab(kw, kd, 0.009, Math.min(kw, kd) * 0.08, 0.002), metal), 0, 0.009, -cd * 0.12));
  // The hanging eye: a ring at the back edge of the coupon.
  const eye = mesh(new THREE.TorusGeometry(Math.min(hw, hh) * 0.13, 0.0028, 8, 20), m.labSteel);
  eye.rotation.x = Math.PI / 2;
  eye.position.set(0, 0.0185, -cd * 0.12 - kd / 2 + Math.min(hw, hh) * 0.2);
  g.add(eye);
  if (text) {
    const tag = c.label(text, cw * 0.68, Math.min(cd * 0.2, 0.05));
    tag.position.set(0, 0.0096, cd * 0.34);
    g.add(tag);
  }
  return done(g, 0.0185);
}

/**
 * A gas discharge tube: a glass tube between two brass caps with an electrode in each, on two rubber saddles over a name card.
 * Lit, a fine thread of gas glows along the middle (a mark of light, not a light).
 */
export function buildGasTube(c, { lit = false, rgb = null, text = '' } = {}) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const cardD = hh * 1.9;
  const cardW = hw * 1.9;
  g.add(at(mesh(roundedSlab(cardW, cardD, 0.008, hh * 0.18, 0.002), m.labBakelite), 0, 0, 0));
  const r = Math.min(hh * 0.34, 0.03);
  const L = hw * 1.7;
  const cy = 0.008 + r + 0.006;
  const cz = -cardD * 0.2;
  const glass = lying(r, r, L, m.labGlass, 32, { cast: false });
  glass.position.set(0, cy, cz);
  g.add(glass);
  for (const sx of [-1, 1]) {
    // A brass cap on each end, a ring round it, and the electrode running in.
    g.add(at(lying(r * 1.1, r * 1.1, hw * 0.24, m.labBrass, 28), sx * (L / 2 - hw * 0.05), cy, cz));
    g.add(at(ringX(r * 1.08, r * 0.1, m.labSteel, 28), sx * (L / 2 - hw * 0.18), cy, cz));
    g.add(at(lying(r * 0.1, r * 0.1, hw * 0.34, m.labSteel, 10), sx * (L / 2 - hw * 0.32), cy, cz));
    // A saddle under the glass.
    g.add(at(mesh(roundedSlab(hw * 0.2, r * 2.2, 0.01 + r * 0.7, 0.003, 0.001), m.labRubber), sx * (L * 0.3), 0.008, cz));
  }
  const gasMat = lit ? glowing(c, rgb || [255, 214, 176], 0.8) : c.own(new THREE.MeshStandardMaterial({ color: 0x2c3331, roughness: 0.5, transparent: true, opacity: 0.4, depthWrite: false }));
  g.add(at(lying(r * 0.2, r * 0.2, L * 0.62, gasMat, 12, { cast: false }), 0, cy, cz));
  if (text) {
    const tag = c.label(text, cardW * 0.7, Math.min(cardD * 0.24, 0.05));
    tag.position.set(0, 0.0086, cardD * 0.34);
    g.add(tag);
  }
  return done(g, cy + r);
}

/** A filament lamp on its own: a glass bulb on a screw base with a coil in it that glows amber when it is hot. */
export function buildBulb(c, { lit = false, text = '' } = {}) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const cardD = hh * 1.9;
  const cardW = hw * 1.9;
  g.add(at(mesh(roundedSlab(cardW, cardD, 0.008, hh * 0.18, 0.002), m.labBakelite), 0, 0, 0));
  const R = Math.min(hh * 0.4, 0.034);
  const cy = 0.008 + R + 0.004;
  const cz = -cardD * 0.18;
  const bx = -hw * 0.2;
  const bulb = mesh(new THREE.SphereGeometry(R, 24, 16), m.labGlass, { cast: false });
  bulb.position.set(bx, cy, cz);
  g.add(bulb);
  // The screw base: brass with turned grooves, then a black cap.
  const baseL = hw * 0.62;
  g.add(at(lying(R * 0.5, R * 0.5, baseL, m.labBrass, 20), bx + R + baseL * 0.38, cy, cz));
  for (let i = 0; i < 4; i++) g.add(at(ringX(R * 0.52, R * 0.05, m.labCast, 18), bx + R * 0.9 + i * baseL * 0.17, cy, cz));
  g.add(at(lying(R * 0.4, R * 0.34, hw * 0.1, m.labRubber, 16), bx + R + baseL * 0.9, cy, cz));
  // The coil: a stack of small rings along the axis between two posts.
  const hot = lit ? glowing(c, [255, 168, 64], 1.0) : m.labSteel;
  for (let i = 0; i < 7; i++) g.add(at(ringX(R * 0.28, R * 0.035, hot, 12), bx - R * 0.42 + i * (R * 0.14), cy + R * 0.05, cz));
  for (const dz of [-1, 1]) g.add(at(mesh(new THREE.CylinderGeometry(R * 0.025, R * 0.025, R * 0.8, 6), m.labSteel, { receive: false }), bx - R * 0.05, cy - R * 0.4, cz + dz * R * 0.26));
  if (text) {
    const tag = c.label(text, cardW * 0.7, Math.min(cardD * 0.24, 0.05));
    tag.position.set(0, 0.0086, cardD * 0.34);
    g.add(tag);
  }
  return done(g, cy + R);
}

/**
 * A cell of cool gas: a short fat glass cylinder with a steel flange and a window at each end and a stopcock on top, lying on a
 * name card.
 */
export function buildGasCell(c, { text = '' } = {}) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const cardD = hh * 1.9;
  const cardW = hw * 1.9;
  g.add(at(mesh(roundedSlab(cardW, cardD, 0.008, hh * 0.18, 0.002), m.labBakelite), 0, 0, 0));
  const r = Math.min(hh * 0.38, 0.033);
  const L = hw * 1.3;
  const cy = 0.008 + r + 0.004;
  const cz = -cardD * 0.2;
  const glass = lying(r, r, L, m.labGlass, 32, { cast: false });
  glass.position.set(0, cy, cz);
  g.add(glass);
  for (const sx of [-1, 1]) {
    g.add(at(lying(r * 1.12, r * 1.12, hw * 0.09, m.labSteel, 32), sx * (L / 2 + hw * 0.02), cy, cz));
    const win = mesh(new THREE.CircleGeometry(r * 0.86, 28), m.labGlass, { cast: false });
    win.rotation.y = sx * Math.PI / 2;
    win.position.set(sx * (L / 2 + hw * 0.07), cy, cz);
    g.add(win);
    g.add(at(mesh(roundedSlab(hw * 0.2, r * 2.2, 0.01 + r * 0.7, 0.003, 0.001), m.labRubber), sx * (L * 0.32), 0.008, cz));
  }
  // The stopcock: a brass stem up out of the top and a short lever across it.
  g.add(at(mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.2, r * 0.55, 14), m.labBrass), 0, cy + r + r * 0.2, cz));
  g.add(at(mesh(roundedSlab(r * 0.9, r * 0.2, 0.006, 0.002, 0.0008), m.labBrass), 0, cy + r + r * 0.5, cz));
  if (text) {
    const tag = c.label(text, cardW * 0.7, Math.min(cardD * 0.24, 0.05));
    tag.position.set(0, 0.0086, cardD * 0.34);
    g.add(tag);
  }
  return done(g, cy + r + r * 0.56);
}

/**
 * A reference strip: a slide of smoked glass with the gas's lines etched on it (the kit's own painted face, so the lines stand at
 * their true places), in a steel clip at each end.
 */
export function buildSlideStrip(c, { face }) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const h = 0.007;
  g.add(at(mesh(roundedSlab(hw * 1.98, hh * 1.98, h, 0.006, 0.0015), m.labSmoke), 0, 0, 0));
  const pic = mesh(new THREE.PlaneGeometry(hw * 2 * 0.86, hh * 2 * 0.86), face, { cast: false });
  pic.rotation.x = -Math.PI / 2;
  pic.position.y = h + 0.0005;
  g.add(pic);
  for (const sx of [-1, 1]) {
    const clip = mesh(roundedSlab(hw * 0.1, hh * 2.04, h + 0.006, 0.002, 0.001), m.labSteel);
    clip.position.set(sx * (hw - hw * 0.07), 0, 0);
    g.add(clip);
  }
  return done(g, h + 0.006);
}

/** A detector head: a cast body with a sensor snout at the front, a lead out of the back and its name engraved on top. */
export function buildDetectorHead(c, { text = '' } = {}) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const bodyH = Math.min(0.052, hh * 0.5);
  const bw = hw * 1.36;
  const bd = hh * 1.7;
  const bx = hw - hw * 0.14 - bw / 2;
  g.add(at(mesh(roundedSlab(bw, bd, bodyH, hh * 0.24, 0.003), m.labCast), bx, 0, 0));
  const sr = Math.min(hh * 0.5, 0.042);
  const sl = hw * 0.55;
  const cy = bodyH * 0.55;
  g.add(at(lying(sr, sr, sl, m.labAnodised, 28), -hw + sl / 2, cy, 0));
  g.add(at(ringX(sr * 0.86, sr * 0.1, m.labSteel, 28), -hw + 0.002, cy, 0));
  const eye = mesh(new THREE.CircleGeometry(sr * 0.7, 28), m.labSmoke, { cast: false });
  eye.rotation.y = -Math.PI / 2;
  eye.position.set(-hw - 0.0004, cy, 0);
  g.add(eye);
  if (text) {
    const tag = c.label(text, bw * 0.66, Math.min(hh * 0.6, 0.055));
    tag.position.set(bx + bw * 0.08, bodyH + 0.0006, 0);
    g.add(tag);
  }
  g.add(at(lying(0.006, 0.006, hw * 0.16, m.labRubber, 10), hw - hw * 0.08, bodyH * 0.45, 0));
  return done(g, Math.max(bodyH, cy + sr));
}

/** An electron: a small polished ball that sits on a rung. */
export function buildElectronBall(c) {
  const { hw, hh } = c;
  const g = new THREE.Group();
  const r = Math.min(hw, hh) * 0.95;
  const ball = mesh(new THREE.SphereGeometry(r, 24, 16), c.own(new THREE.MeshStandardMaterial({ color: 0x1d2630, roughness: 0.22, metalness: 0.85 })));
  ball.position.y = r;
  g.add(ball);
  const band = mesh(new THREE.TorusGeometry(r * 0.99, r * 0.07, 6, 28), c.own(new THREE.MeshStandardMaterial({ color: 0x78a142, roughness: 0.5, metalness: 0.2 })), { receive: false });
  band.rotation.x = Math.PI / 2;
  band.position.y = r;
  g.add(band);
  return done(g, r * 2);
}

/* ------------------------------------------------------------------ pieces: the cuvette bench */

/** How tall a cuvette stands, in metres: a dropper laid over it rests on this. */
export const CUVETTE_TOP = 0.108;

/**
 * A cuvette in its stand: a slender optical glass cell on a precision foot, with clear optical windows along the beam axis (x),
 * frosted handling faces front and back (z), an open top, an etched path mark, and a liquid column with a meniscus.
 */
export function buildCuvette(c, { level = 0, tint = null, legend = null } = {}) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const footH = 0.007;
  const baseW = hw * 1.55;
  const baseD = hh * 1.55;
  // Sleek weighted carrier foot.
  g.add(at(mesh(roundedSlab(baseW, baseD, footH, Math.min(baseW, baseD) * 0.12, 0.002), m.labCast), 0, 0, 0));

  // Authentic cuvette proportions: tall, slender vertical rectangular column (square cross-section, height ~3.3x width).
  const cw = 0.030;
  const cd = 0.030;
  const ch = CUVETTE_TOP - footH;
  const cz = -hh * 0.22;

  // A precision socket collar on the foot holding the cuvette base.
  const collarW = cw + 0.006;
  const collarD = cd + 0.006;
  const collarH = 0.008;
  g.add(at(mesh(wallGeometry(collarW, collarD, 0.0026, collarH, 0.002, 0.0008), m.labSteel), 0, footH, cz));
  g.add(at(mesh(new THREE.BoxGeometry(cw, 0.0012, cd), m.labRubber), 0, footH + 0.0006, cz));

  // Thick solid optical glass base (standard 4 mm floor).
  const floorH = 0.004;
  const floor = mesh(new THREE.BoxGeometry(cw, floorH, cd), m.labGlass, { cast: false });
  floor.position.set(0, footH + floorH / 2, cz);
  g.add(floor);

  // Four vertical walls forming the hollow cell:
  const wall = 0.0022;
  const wallH = ch - floorH;
  const iw = cw - 2 * wall;
  const id = cd - 2 * wall;

  // 1) Clear optical windows (Left at -x and Right at +x) for the light beam:
  const optMat = m.labGlass;
  const leftWall = mesh(new THREE.BoxGeometry(wall, wallH, cd), optMat, { cast: false });
  leftWall.position.set(-cw / 2 + wall / 2, footH + floorH + wallH / 2, cz);
  const rightWall = mesh(new THREE.BoxGeometry(wall, wallH, cd), optMat, { cast: false });
  rightWall.position.set(cw / 2 - wall / 2, footH + floorH + wallH / 2, cz);
  g.add(leftWall, rightWall);

  // 2) Frosted/ground glass handling faces (Front at +z and Back at -z) so fingers don't smudge the optical beam path:
  const frostedMat = c.own(new THREE.MeshPhysicalMaterial({
    color: 0xeef5f3,
    roughness: 0.58,
    metalness: 0.02,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    clearcoat: 0.15,
    clearcoatRoughness: 0.2
  }));
  const frontWall = mesh(new THREE.BoxGeometry(iw, wallH, wall), frostedMat, { cast: false });
  frontWall.position.set(0, footH + floorH + wallH / 2, cz + cd / 2 - wall / 2);
  const backWall = mesh(new THREE.BoxGeometry(iw, wallH, wall), frostedMat, { cast: false });
  backWall.position.set(0, footH + floorH + wallH / 2, cz - cd / 2 + wall / 2);
  g.add(frontWall, backWall);

  // 3) Polished open-top rim: open vessel, no steel collar.
  const rim = mesh(wallGeometry(cw, cd, wall, 0.0016, 0.001, 0.0003), m.labGlass, { cast: false });
  rim.position.set(0, CUVETTE_TOP - 0.0016, cz);
  g.add(rim);

  // 4) Etched optical path triangle orientation mark "▽" near the top of the front face:
  const triShape = new THREE.Shape();
  const tw = 0.0032, th = 0.0036;
  triShape.moveTo(-tw / 2, th / 2);
  triShape.lineTo(tw / 2, th / 2);
  triShape.lineTo(0, -th / 2);
  triShape.closePath();
  const markMat = c.own(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, transparent: true, opacity: 0.75 }));
  const tri = mesh(new THREE.ShapeGeometry(triShape), markMat, { cast: false, receive: false });
  tri.position.set(0, CUVETTE_TOP - 0.009, cz + cd / 2 + 0.0004);
  g.add(tri);

  // 5) Subtle etched graduation mark (10 mm path line):
  const grad = mesh(new THREE.PlaneGeometry(0.012, 0.0008), markMat, { cast: false, receive: false });
  grad.position.set(0, CUVETTE_TOP - 0.022, cz + cd / 2 + 0.0004);
  g.add(grad);

  // 6) Liquid column and meniscus inside the hollow chamber:
  if (level > 0) {
    const maxLh = wallH - 0.006;
    const lh = Math.max(0.018, maxLh * (0.22 + 0.78 * Math.min(1, level)));
    const colour = tint ? new THREE.Color(`rgb(${tint.rgb[0]}, ${tint.rgb[1]}, ${tint.rgb[2]})`) : new THREE.Color(0x9cc3cf);
    const liquidMat = c.own(new THREE.MeshPhysicalMaterial({
      color: colour,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.62,
      transparent: true,
      opacity: tint ? 0.35 + 0.58 * tint.depth : 0.42,
      depthWrite: false
    }));
    const col = mesh(new THREE.BoxGeometry(iw * 0.96, lh, id * 0.96), liquidMat, { cast: false });
    col.position.set(0, footH + floorH + lh / 2, cz);
    g.add(col);

    // Meniscus: curved top surface
    const menMat = c.own(new THREE.MeshPhysicalMaterial({
      color: colour.clone().multiplyScalar(1.2),
      roughness: 0.04,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    }));
    const men = mesh(new THREE.PlaneGeometry(iw * 0.95, id * 0.95), menMat, { cast: false });
    men.rotation.x = -Math.PI / 2;
    men.position.set(0, footH + floorH + lh, cz);
    g.add(men);

    // Meniscus wetting rim along glass walls
    const lipMat = c.own(new THREE.MeshStandardMaterial({
      color: colour.clone().multiplyScalar(1.4),
      roughness: 0.1,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    }));
    const lip = mesh(wallGeometry(iw * 0.96, id * 0.96, 0.0014, 0.0015, 0.0005, 0.0002), lipMat, { cast: false });
    lip.position.set(0, footH + floorH + lh - 0.0008, cz);
    g.add(lip);
  }

  if (legend) {
    legend.position.set(0, footH + 0.0006, hh * 0.46);
    g.add(legend);
  }
  return done(g, CUVETTE_TOP);
}

/**
 * A dropper: a glass pipette with a drawn-out tip and a rubber bulb, lying along x, tip toward -x. Laid over a cuvette it rests on
 * the cell's rim (the table lifts it by `CUVETTE_TOP`).
 */
export function buildDropper(c) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const r = Math.min(hh * 0.22, 0.016);
  const y = r + 0.003;
  // Tip to bulb along +x: a drawn-out tip, a glass barrel, a brass collar, then the bulb.
  const barrel = lathe([[0, 0], [r * 0.18, 0], [r * 0.22, hw * 0.5], [r, hw * 0.72], [r, hw * 1.3], [0, hw * 1.3]], 22);
  const bar = mesh(barrel, m.labGlass, { cast: false });
  bar.rotation.z = -Math.PI / 2;
  bar.position.set(-hw, y, 0);
  g.add(bar);
  g.add(at(lying(r * 1.14, r * 1.14, hw * 0.12, m.labBrass, 20), hw * 0.24, y, 0));
  const bulb = mesh(lathe([[0, 0], [r * 0.9, 0], [r * 1.5, hw * 0.08], [r * 1.7, hw * 0.24], [r * 1.4, hw * 0.4], [r * 0.6, hw * 0.46], [0, hw * 0.47]], 22), m.labRubber);
  bulb.rotation.z = -Math.PI / 2;
  bulb.position.set(hw * 0.3, y, 0);
  g.add(bulb);
  // A little liquid in the tip, so it reads as a pipette that has drawn something up.
  g.add(at(lying(r * 0.16, r * 0.2, hw * 0.4, m.labWater, 8, { cast: false }), -hw * 0.78, y, 0));
  return done(g, y + r * 1.7);
}

/** A rinse tool: a squat bottle with a shoulder, a cap and a spout bent toward -x. */
export function buildRinseBottle(c) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const r = Math.min(hh * 0.5, hw * 0.4, 0.04);
  const H = r * 2.1;
  const body = lathe([[0, 0], [r * 0.92, 0], [r, 0.004], [r, H * 0.55], [r * 0.8, H * 0.8], [r * 0.38, H * 0.92], [r * 0.34, H], [0, H]], 28);
  g.add(at(mesh(body, m.labGlass, { cast: false }), hw * 0.12, 0, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.006, 18), m.labBrass), hw * 0.12, H + 0.001, 0));
  const spout = lying(r * 0.07, r * 0.12, hw * 0.55, m.labRubber, 10);
  spout.position.set(hw * 0.12 - hw * 0.28, H + 0.004, 0);
  g.add(spout);
  g.add(at(mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.88, H * 0.42, 24), m.labWater, { cast: false }), hw * 0.12, H * 0.22, 0));
  return done(g, H + 0.007);
}

/* ------------------------------------------------------------------ plates and frames */

/**
 * A photographic plate or a film: a dark acrylic slab with a bright bezel and four corner clips, the kit's picture on it. `frame`
 * false makes a bare acetate film (transparent edge, no clips).
 */
export function buildPlateFrame(c, { face, frame = true }) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const h = frame ? 0.012 : 0.004;
  g.add(at(mesh(roundedSlab(hw * 2, hh * 2, h, Math.min(hw, hh) * 0.1, 0.002), frame ? m.labAnodised : m.labSmoke), 0, 0, 0));
  const pic = mesh(new THREE.PlaneGeometry(hw * 2 * 0.92, hh * 2 * 0.92), face, { cast: false });
  pic.rotation.x = -Math.PI / 2;
  pic.position.y = h + 0.0006;
  g.add(pic);
  if (frame) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const clip = mesh(roundedSlab(hw * 0.14, hh * 0.14, 0.004, 0.002, 0.0008), m.labSteel);
      clip.position.set(sx * (hw * 0.9), h, sz * (hh * 0.88));
      g.add(clip);
    }
  }
  return done(g, h + 0.004);
}

/**
 * An instrument's case: a rounded cast bezel round a flat picture, a chamfered lip, four corner screws and a sheet of glass over the
 * window. The picture is the table's own flat ground; this is what is built round it.
 */
export function buildInstrumentCase(w, d, { mats: m }) {
  const g = new THREE.Group();
  const h = 0.016;
  const rim = Math.min(0.016, Math.min(w, d) * 0.07);
  g.add(mesh(wallGeometry(w, d, rim, h, Math.min(0.03, Math.min(w, d) * 0.12), 0.003), m.labCast));
  // A raised inner lip so the glass has something to sit on.
  const lip = mesh(wallGeometry(w - rim * 1.6, d - rim * 1.6, 0.0032, h + 0.003, Math.min(0.024, Math.min(w, d) * 0.1), 0.0012), m.labAnodised);
  g.add(lip);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const s = screw(m.labSteel, Math.min(0.0055, rim * 0.34), m.labRubber);
    s.position.set(sx * (w / 2 - rim * 0.55), h - 0.0005, sz * (d / 2 - rim * 0.55));
    g.add(s);
  }
  // The glass over the window: a faint sheet, so the picture reads as a screen under glass and not a print on a mat.
  const glass = mesh(new THREE.PlaneGeometry(w - rim * 2, d - rim * 2), m.labPane, { cast: false, receive: false });
  glass.rotation.x = -Math.PI / 2;
  glass.position.y = h + 0.002;
  g.add(glass);
  return done(g, h + 0.003);
}

/* ------------------------------------------------------------------ sockets: what a slot is when it holds a lamp, a plate, a tube */

/**
 * The sockets. `kind` says what the slot is for; `w` x `d` is its footprint in metres, centred on the origin, standing on y = 0.
 *   lamp      a round brass-ringed cup a lamp's barrel sits in, over a rubber pad
 *   holder    a base block with two spring clips that grip a plate
 *   cradle    a V-block with a brass contact at each end for a tube
 *   rung      a brass bar with an end bracket either side: one rung of the ladder
 *   well      a sample compartment: a black block with a slot cut down into it
 *   chamber   a round steel collar round a sample stub
 *   mark      a small post with a notch: a place on the rail a detector stands
 *   plain     a shallow socket (the shared slot)
 */
export function buildSocket(kind, w, d, { mats: m }) {
  const g = new THREE.Group();
  switch (kind) {
    case 'lamp': {
      g.add(at(mesh(roundedSlab(w * 0.96, d * 0.96, 0.006, Math.min(w, d) * 0.12, 0.0015), m.labRubber), 0, 0, 0));
      const R = Math.min(w, d) * 0.36;
      g.add(at(mesh(wallGeometry(R * 2, R * 2, R * 0.2, 0.012, R, 0.0015), m.labBrass), -w * 0.18, 0.006, 0));
      g.add(at(mesh(wallGeometry(w * 0.9, d * 0.9, 0.003, 0.009, Math.min(w, d) * 0.1, 0.001), m.labCast), 0, 0, 0));
      return g;
    }
    case 'holder': {
      g.add(at(mesh(roundedSlab(w * 0.96, d * 0.96, 0.008, Math.min(w, d) * 0.1, 0.002), m.labCast), 0, 0, 0));
      for (const sx of [-1, 1]) {
        g.add(at(mesh(roundedSlab(w * 0.12, d * 0.62, 0.02, 0.004, 0.0015), m.labSteel), sx * (w * 0.42), 0.008, 0));
        g.add(at(mesh(roundedSlab(w * 0.06, d * 0.5, 0.012, 0.003, 0.001), m.labBrass), sx * (w * 0.34), 0.008, 0));
      }
      g.add(at(mesh(roundedSlab(w * 0.56, d * 0.84, 0.002, 0.004, 0.0005), m.labRubber, { cast: false }), 0, 0.008, 0));
      return g;
    }
    case 'cradle': {
      g.add(at(mesh(roundedSlab(w * 0.96, d * 0.96, 0.008, Math.min(w, d) * 0.1, 0.002), m.labCast), 0, 0, 0));
      for (const sx of [-1, 1]) {
        g.add(at(mesh(roundedSlab(w * 0.12, d * 0.62, 0.02, 0.004, 0.0015), m.labBrass), sx * (w * 0.4), 0.008, 0));
        g.add(at(mesh(roundedSlab(w * 0.2, d * 0.34, 0.012, 0.004, 0.0012), m.labRubber), sx * (w * 0.2), 0.008, 0));
      }
      return g;
    }
    case 'rung': {
      g.add(at(mesh(roundedSlab(w * 0.96, d * 0.7, 0.006, 0.002, 0.001), m.labCast), 0, 0, 0));
      g.add(at(lying(d * 0.2, d * 0.2, w * 0.9, m.labBrass, 14), 0, 0.006 + d * 0.2, 0));
      for (const sx of [-1, 1]) g.add(at(mesh(roundedSlab(w * 0.05, d * 0.9, 0.014, 0.002, 0.001), m.labSteel), sx * (w * 0.46), 0.006, 0));
      return g;
    }
    case 'well': {
      g.add(at(mesh(roundedSlab(w * 0.96, d * 0.96, 0.02, Math.min(w, d) * 0.08, 0.003), m.labBakelite), 0, 0, 0));
      g.add(at(mesh(wallGeometry(w * 0.7, d * 0.7, 0.004, 0.024, Math.min(w, d) * 0.06, 0.0012), m.labSteel), 0, 0, 0));
      g.add(at(mesh(roundedSlab(w * 0.6, d * 0.6, 0.002, 0.003, 0.0006), m.labRubber, { cast: false }), 0, 0.02, 0));
      return g;
    }
    case 'chamber': {
      g.add(at(mesh(roundedSlab(w * 0.96, d * 0.96, 0.008, Math.min(w, d) * 0.1, 0.002), m.labCast), 0, 0, 0));
      const R = Math.min(w, d) * 0.4;
      g.add(at(mesh(lathe([[R * 0.7, 0], [R, 0], [R, 0.02], [R * 0.94, 0.022], [R * 0.7, 0.02]], 32), m.labSteel), 0, 0.008, 0));
      return g;
    }
    case 'mark': {
      g.add(at(mesh(roundedSlab(w * 0.9, d * 0.5, 0.006, 0.003, 0.001), m.labCast), 0, 0, d * 0.18));
      g.add(at(mesh(roundedSlab(w * 0.12, d * 0.22, 0.026, 0.003, 0.001), m.labSteel), 0, 0.006, d * 0.18));
      return g;
    }
    default:
      return null;
  }
}

/** The post of a rail, a track along x: an aluminium extrusion with a groove and end stops. */
export function buildTrack(len, { mats: m, width = 0.026 }) {
  const g = new THREE.Group();
  g.add(at(mesh(roundedSlab(len, width, 0.014, 0.004, 0.0015), m.labSteel), 0, 0, 0));
  g.add(at(mesh(roundedSlab(len * 0.98, width * 0.3, 0.004, 0.002, 0.0006), m.labRubber, { cast: false }), 0, 0.012, 0));
  for (const sx of [-1, 1]) g.add(at(mesh(roundedSlab(0.012, width * 1.3, 0.026, 0.004, 0.0015), m.labCast), sx * (len / 2 - 0.006), 0, 0));
  return done(g, 0.026);
}

/**
 * A glass dome over a flat picture: a long low capsule of glass (`len` x `wid` in plan, `h` tall) with a brass cap at each end, the
 * picture showing through it. It is the vacuum tube of the photocell, drawn over the flat view of what happens inside it.
 */
export function buildGlassDome(len, wid, h, { mats: m }) {
  const g = new THREE.Group();
  const r = wid / 2;
  const geo = new THREE.CapsuleGeometry(r, Math.max(0.01, len - wid), 6, 24);
  geo.rotateZ(Math.PI / 2);
  geo.scale(1, h / r, 1);
  g.add(mesh(geo, m.labPane, { cast: false, receive: false }));
  for (const sx of [-1, 1]) {
    const cap = mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.02, 28), m.labBrass);
    cap.rotation.z = Math.PI / 2;
    cap.scale.set(h / r, 1, 1);
    cap.position.set(sx * (len / 2 - r - 0.004), 0, 0);
    g.add(cap);
  }
  return done(g, h);
}

/** Two uprights with a foot each, `spanX` apart and `spanZ` long, centred on the origin: the frame a ladder's rungs are fixed in. */
export function buildUprights(spanX, spanZ, { mats: m }) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    g.add(at(mesh(roundedSlab(0.016, spanZ, 0.07, 0.004, 0.0015), m.labSteel), sx * spanX / 2, 0, 0));
    g.add(at(mesh(roundedSlab(0.05, 0.05, 0.01, 0.01, 0.002), m.labCast), sx * spanX / 2, 0, spanZ / 2 - 0.02));
    g.add(at(mesh(roundedSlab(0.05, 0.05, 0.01, 0.01, 0.002), m.labCast), sx * spanX / 2, 0, -spanZ / 2 + 0.02));
  }
  return done(g, 0.07);
}


/* ------------------------------------------------------------------ the scattering rig (Tallow `q2-core`) */

/**
 * A foil standing edge-on to the beam: a steel frame, a clear pane, and in the pane a lattice of nuclei, each a tiny dense brass bead
 * set far apart from its neighbours. The spacing is the point: the picture the player is weighing a model against is mostly empty
 * space with small hard lumps in it, and a shot that goes through has the whole pane to go through. `span` is the frame's width
 * across the beam (m), `rise` its height. The foil lies in the x = 0 plane, so a beam travelling along x meets it face on.
 */
export function buildScatterFoil(span, rise, { mats: m }) {
  const g = new THREE.Group();
  const bar = 0.006;
  const depth = 0.012;
  for (const sy of [0, rise]) g.add(at(mesh(new THREE.BoxGeometry(depth, bar, span + bar), m.labSteel), 0, sy + bar / 2, 0));
  for (const sz of [-1, 1]) g.add(at(mesh(new THREE.BoxGeometry(depth, rise, bar), m.labSteel), 0, rise / 2 + bar / 2, sz * span / 2));
  g.add(at(mesh(new THREE.BoxGeometry(depth * 0.25, rise, span), m.labPane, { cast: false, receive: false }), 0, rise / 2 + bar / 2, 0));
  const cols = 6;
  const rows = 4;
  const bead = new THREE.SphereGeometry(Math.min(span, rise) * 0.018, 10, 8);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      g.add(at(mesh(bead, m.labBrass, { receive: false }), 0, bar + (j + 0.5) * (rise - bar) / rows, -span / 2 + (i + 0.5) * span / cols));
    }
  }
  return done(g, rise + bar);
}

/** The beam's source: a cast block with a bore, its muzzle facing +x. */
export function buildBeamSource(len, { mats: m }) {
  const g = new THREE.Group();
  g.add(at(mesh(roundedSlab(len, len * 0.7, len * 0.55, len * 0.12, 0.002), m.labCast), 0, 0, 0));
  g.add(at(lying(len * 0.12, len * 0.12, len * 0.5, m.labAnodised), len * 0.42, len * 0.3, 0));
  return done(g, len * 0.55);
}

/** A charged plate: a long standing bar, brass for the + plate and steel for the − plate, with a foot at each end. */
export function buildChargePlate(len, { mats: m, brass = false }) {
  const g = new THREE.Group();
  g.add(at(mesh(roundedSlab(len, 0.012, 0.05, 0.003, 0.0012), brass ? m.labBrass : m.labSteel), 0, 0, 0));
  for (const sx of [-1, 1]) g.add(at(mesh(roundedSlab(0.03, 0.03, 0.01, 0.004, 0.0015), m.labCast), sx * (len / 2 - 0.02), 0, 0));
  return done(g, 0.05);
}
