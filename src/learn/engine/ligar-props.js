/**
 * ligar-props.js — The physical things on a Ligar bench: model atoms, ore blocks, a hammer, clip leads, tongs, tags, tiles, a hub
 * and its arms, and the boards and plates the instruments are set into.
 *
 * WHY THIS FILE EXISTS. Ligar's tables were built from the shared vocabulary (`table-props.js`): a coin with a symbol on it for an
 * atom, a flat card with a picture on it for a block, a tag, a molecule, an orbital. "A bunch of squares with weird textures fitted
 * on top." A miner's bench has things on it that were made to be handled: a ball you can pick up, a block of ore with a sawn face
 * you can look into, a hammer with a handle. This file builds each as what it is.
 *
 * THE RULES (the same as `table-props.js` and `lab-props.js`, which own the reasoning):
 *   - no sharp 90-degree edge except cut glass and a sawn face: slabs carry a bevel, bodies of revolution are lathed, stone is
 *     rounded and roughened;
 *   - nothing is factory-new: every colour below is weathered, a metal is the metal it is named for, and one example differs a
 *     little from the next (a seeded jitter on the piece's id);
 *   - the picture stays honest: a figure a piece prints (the lattice picture on a sawn face, a tag's name, a molecule's formula) is
 *     painted by the kit (`c.paint`, `c.face`) or set by `c.label`, never drawn here; this file only decides what it is stuck to;
 *   - nothing blooms: a lit lamp is an emissive surface with no light cast.
 *
 * Every builder takes the context `c` `Table3D` fills in: `{ hw, hh }` (the piece's half footprint in metres), `s` (metres per table
 * unit), `mats` (the table's shared materials plus `makeLabMaterials()` plus `makeLigarMaterials()`), `own(mat)` (a material only
 * this table uses), `label(text, w, h, opts)` (an engraved legend as a flat mesh), `paint(w, h, fn)` (a flat mesh painted by a kit
 * function) and `face(opts)` (the kit's painted face of this piece as a material). A builder returns a Group standing on y = 0,
 * centred on the piece, its footprint inside `hw` x `hh`, with `userData.height` set.
 *
 * Pure over THREE: no DOM except what `c` supplies, so `verify:bench` and a scratch script build these in Node.
 */

import * as THREE from 'three';
import { roundedSlab, wallGeometry, lathe, jitter } from './table-props.js';
import { mulberry32, hashId } from './plates.js';

/** The world these props belong to: a table asks for them when its quest's world is this one. */
export const LIGAR_SKIN = 'unit03';

/* ------------------------------------------------------------------ materials */

/** Materials shared by every Ligar prop, made once per table (they join the lab materials in `c.mats`). */
export function makeLigarMaterials() {
  const std = (color, roughness, metalness, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  return {
    ligTimber: std(0x7a5a38, 0.82, 0.02),
    ligTimberDark: std(0x4d3a26, 0.86, 0.02),
    ligIron: std(0x3a3a38, 0.58, 0.82),
    ligSteel: std(0x9a9c98, 0.34, 0.92),
    ligCopper: std(0xa05a38, 0.4, 0.88),
    ligBrassWorn: std(0x9a7c3a, 0.46, 0.86),
    ligRubber: std(0x1d1c1a, 0.9, 0.03),
    ligHazard: std(0xc79a1c, 0.55, 0.2),
    ligEnamelRed: std(0x8a3a2a, 0.36, 0.1),
    ligEnamelBlack: std(0x1c1b19, 0.4, 0.12),
    ligSlate: std(0x32343a, 0.78, 0.04),
    // The floor of a tray or a jar: pale cut stone, so what lies in it stands out of it.
    ligLining: std(0x6a675d, 0.9, 0.04)
  };
}

/* ------------------------------------------------------------------ small helpers */

const mesh = (geo, mat, { cast = true, receive = true } = {}) => {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
};
const at = (obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); return obj; };
const done = (g, height) => { g.userData.height = height; return g; };

/** A cylinder lying along x. */
function lying(rTop, rBot, len, mat, seg = 24, opts) {
  const m = mesh(new THREE.CylinderGeometry(rTop, rBot, len, seg), mat, opts);
  m.rotation.z = Math.PI / 2;
  return m;
}

/** A cylinder lying along z. */
function lyingZ(rTop, rBot, len, mat, seg = 24, opts) {
  const m = mesh(new THREE.CylinderGeometry(rTop, rBot, len, seg), mat, opts);
  m.rotation.x = Math.PI / 2;
  return m;
}

/** A material of the table's own, tinted. */
const tinted = (c, base, color, extra = {}) => {
  const m = c.own(base.clone());
  m.color = new THREE.Color(color);
  Object.assign(m, extra);
  return m;
};

/** A slotted or hex bolt head lying on a face. */
function bolt(mat, r = 0.0055, hex = false) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r * 1.06, 0.0045, hex ? 6 : 14), mat, { receive: false }));
  return g;
}

/**
 * A smooth value noise in 3 dimensions, seeded: the roughness of stone and the mottle of enamel. Cheap and continuous, so a
 * rounded box displaced by it has no seams.
 */
function makeNoise(seed) {
  const rnd = mulberry32(seed * 2654435761 + 11);
  const N = 32;
  const lattice = Array.from({ length: N * N * N }, () => rnd());
  const at3 = (x, y, z) => lattice[((x & (N - 1)) * N + (y & (N - 1))) * N + (z & (N - 1))];
  const sm = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const one = (x, y, z) => {
    const xi = Math.floor(x); const yi = Math.floor(y); const zi = Math.floor(z);
    const tx = sm(x - xi); const ty = sm(y - yi); const tz = sm(z - zi);
    return lerp(
      lerp(lerp(at3(xi, yi, zi), at3(xi + 1, yi, zi), tx), lerp(at3(xi, yi + 1, zi), at3(xi + 1, yi + 1, zi), tx), ty),
      lerp(lerp(at3(xi, yi, zi + 1), at3(xi + 1, yi, zi + 1), tx), lerp(at3(xi, yi + 1, zi + 1), at3(xi + 1, yi + 1, zi + 1), tx), ty),
      tz
    );
  };
  /** Fractal noise, 0 to 1. */
  return (x, y, z, oct = 3) => {
    let a = 0; let amp = 0.5; let f = 1; let norm = 0;
    for (let i = 0; i < oct; i++) { a += one(x * f, y * f, z * f) * amp; norm += amp; amp *= 0.5; f *= 2.07; }
    return a / norm;
  };
}

/**
 * A block of rock: a box with its edges and corners rounded off, then roughened by noise along its normals and coloured by strata
 * and grain (vertex colours), standing on y = 0. The top is left flat (`flatTop`) where a sawn face is set into it.
 *
 * @param {{w: number, h: number, d: number, seed: number, colour: number|string, round?: number, rough?: number, flatTop?: boolean,
 *          strata?: number, seg?: number[]}} o
 */
export function rockGeometry({ w, h, d, seed, colour, round = 0.02, rough = 0.006, flatTop = true, strata = 0.22, seg = [16, 4, 12] }) {
  const geo = new THREE.BoxGeometry(w, h, d, seg[0], seg[1], seg[2]);
  const noise = makeNoise(seed);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const base = new THREE.Color(colour);
  const hx = w / 2 - round; const hy = h / 2 - round; const hz = d / 2 - round;
  const v = new THREE.Vector3(); const inner = new THREE.Vector3(); const dir = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    // Round the box: pull every vertex onto a sphere of radius `round` about the clamped inner box.
    inner.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
    dir.subVectors(v, inner);
    if (dir.lengthSq() > 1e-12) { dir.normalize(); v.copy(inner).addScaledVector(dir, round); }
    // Roughen along the way the surface faces, less on the top when a sawn face is set into it.
    const top = flatTop && v.y > h / 2 - round * 0.6;
    const n = noise(v.x * 38 + 3, v.y * 38 + 7, v.z * 38 + 1, 3);
    const m = noise(v.x * 9 + 40, v.y * 9 + 2, v.z * 9 + 9, 2);
    const amp = top ? 0 : rough * (n * 1.6 - 0.55) + rough * 0.8 * (m - 0.5);
    v.addScaledVector(dir.lengthSq() > 0 ? dir : new THREE.Vector3(0, 1, 0), amp);
    pos.setXYZ(i, v.x, v.y + h / 2, v.z);
    // Strata run across the block; grain is fine speckle; both darken or lighten the colour, never change its hue.
    const band = Math.sin((v.y + h / 2) * 140 + m * 9) * strata * 0.35;
    const speck = (noise(v.x * 160 + 5, v.y * 160 + 5, v.z * 160 + 5, 1) - 0.5) * 0.28;
    const k = 1 + band + speck + (m - 0.5) * 0.3;
    col[i * 3] = base.r * k; col[i * 3 + 1] = base.g * k; col[i * 3 + 2] = base.b * k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.deleteAttribute('uv');
  geo.computeVertexNormals();
  return geo;
}

/** The colour a block's tint stands for, as stone: the kit's tints are muted tones of real minerals. */
const ORE = Object.freeze({
  bone: 0xc9c1ab,   // halite: a pale, translucent-looking salt
  sand: 0xc2a24e,   // sulfur: yellow
  iron: 0x565a5f,   // a hard dark network solid
  rust: 0x9b5a3a,   // copper-bearing rock
  pale: 0x8f8678
});
export const oreColour = tint => ORE[tint] ?? ORE.bone;
/** The balls inside a block, in the block's own muted tones (the kit's TINTS): the atoms of a halite, a sulfur, a network solid, a copper. */
const ORE_BALL = Object.freeze({ bone: 0xb8afa0, sand: 0xc39a63, iron: 0x6b625a, rust: 0x9c5423, pale: 0x8f8678 });

/* ------------------------------------------------------------------ atoms */

/**
 * A model atom: a polished ball in a turned collar, the kit's painted face printed on its crown. The face is the picture the drawn
 * table paints (the symbol, the outer electrons round its rim, the ring that lights when the shell is full); the ball is what it is
 * stuck to. `body` is the colour the painted disc carries, so the ball is of a piece with its face.
 */
export function buildAtomBall(c, { face, body, flat = false }) {
  const { hw, mats: m } = c;
  const g = new THREE.Group();
  const R = hw;
  // An atom fixed on a board stands lower (a squat ball): a tall one would hide the readings printed behind it from the leaned-in view.
  const ky = flat ? 0.55 : 0.9;
  const collarH = R * 0.16;
  // The collar it stands in: a turned iron ring with a bright lip, so a ball does not roll and is plainly a thing set down.
  g.add(mesh(lathe([[R * 0.46, 0], [R * 0.74, 0], [R * 0.8, collarH * 0.45], [R * 0.74, collarH], [R * 0.5, collarH * 1.1], [R * 0.46, collarH]], 28), m.ligIron, { receive: true }));
  const cy = collarH * 0.7 + R * ky * 0.96;
  const bodyMat = c.own(new THREE.MeshPhysicalMaterial({ color: body, roughness: 0.34, metalness: 0.04, clearcoat: 0.55, clearcoatRoughness: 0.28 }));
  const ball = mesh(new THREE.SphereGeometry(R, 32, 20), bodyMat);
  ball.scale.y = ky;
  ball.position.y = cy;
  g.add(ball);
  // The crown: a cap of the same sphere, a hair outside it, its top mapped flat onto the painted disc (undistorted from above).
  const capR = R * 0.9;
  const theta = Math.asin(capR / R);
  const capGeo = new THREE.SphereGeometry(R * 1.004, 32, 10, 0, Math.PI * 2, 0, theta);
  const p = capGeo.attributes.position;
  const uv = capGeo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + (p.getX(i) / capR) * 0.47, 0.5 - (p.getZ(i) / capR) * 0.47);
  uv.needsUpdate = true;
  const cap = mesh(capGeo, face, { cast: false });
  cap.scale.y = ky;
  cap.position.y = cy;
  g.add(cap);
  g.userData.joinY = cy;
  return done(g, cy + R * ky);
}

/* ------------------------------------------------------------------ blocks of ore */

/**
 * A block of ore: a rough-hewn body of the rock its build is made of, a sawn and polished face on top with the kit's picture of
 * what is inside it (the magnified lattice, from `planSlab`), set in a worn brass bezel, and a stencilled tag. A SEALED block is
 * the same block shut in a steel case that hides it: the face is the case's lid (the kit paints it hatched).
 *
 * `molten` softens the block's outline, as a thing at heat is; the heat itself is on the hotplate under it.
 */
export function buildOreBlock(c, { tint = 'bone', sealed = false, molten = false, seedId = 'x', atoms = [], cols = 0, rows = 0, ions = false }) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const seed = (hashId(seedId) % 9973) + 1;
  const bodyH = 0.062;
  const w = hw * 1.96;
  const d = hh * 1.96;
  const k = jitter(seedId, 0.07);
  if (sealed) {
    // A steel crate: a rounded case with riveted straps and a hazard-yellow band, its lid the picture.
    g.add(at(mesh(roundedSlab(w, d, bodyH, 0.016, 0.003), m.ligIron), 0, 0, 0));
    g.add(at(mesh(roundedSlab(w * 0.985, d * 0.2, 0.006, 0.003, 0.0012), m.ligHazard), 0, bodyH, d * 0.4));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const b = bolt(m.labSteel, 0.0058, true);
      b.position.set(sx * (w / 2 - 0.016), bodyH + 0.0005, sz * (d / 2 - 0.016));
      g.add(b);
    }
  } else {
    const colour = new THREE.Color(oreColour(tint)).multiplyScalar(k);
    const rock = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: tint === 'rust' ? 0.12 : 0.02 });
    g.add(mesh(rockGeometry({ w, h: bodyH, d, seed, colour, round: 0.02, rough: molten ? 0.002 : 0.007 }), c.own(rock)));
  }
  // The sawn face: a flat window cut into the top, polished, with the kit's card on it (the lattice as it is now, the block's name,
  // what has been done to it, the lamp the leads light), set in a worn brass bezel under a pane of glass. The atoms of the picture stand
  // up under the glass as little balls, so what is drawn is also something seen from the side.
  const fw = w * 0.9;
  const fd = d * 0.88;
  const glassY = bodyH + 0.0125;
  const rim = mesh(wallGeometry(fw + 0.02, fd + 0.02, 0.008, 0.0125, 0.006, 0.0015), m.ligBrassWorn);
  rim.position.set(0, bodyH - 0.0005, 0);
  g.add(rim);
  const base = mesh(roundedSlab(fw + 0.012, fd + 0.012, 0.005, 0.005, 0.0015), m.ligEnamelBlack);
  base.position.set(0, bodyH - 0.001, 0);
  g.add(base);
  const pic = mesh(new THREE.PlaneGeometry(fw, fd), c.face(), { cast: false });
  pic.rotation.x = -Math.PI / 2;
  pic.position.set(0, bodyH + 0.0045, 0);
  g.add(pic);
  if (atoms.length && cols) {
    // The picture's own mapping (`paintSlabPicture`): the card is 756 x 576 px at the table's scale, the picture the top 72% of it, inset by
    // 7% of its smaller side; a ball's radius is a share of what a cell has to itself.
    const W = 756; const H = 576;
    const picW = W - 3; const picH = H * 0.72 - 1.5;
    const pad = Math.max(2, Math.min(picW, picH) * 0.07);
    const rPx = Math.max(1.4, Math.min((picW - pad * 2) / (cols * 2.7), (picH - pad * 2) / (rows * 2.7)));
    const r3 = rPx / W * fw * 1.05;
    const live = atoms.filter(a => !a.gone);
    const ballGeo = new THREE.SphereGeometry(1, 14, 10);
    const ballMat = c.own(new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.12 }));
    const balls = new THREE.InstancedMesh(ballGeo, ballMat, Math.max(1, live.length));
    balls.castShadow = false;
    const mtx = new THREE.Matrix4(); const col = new THREE.Color();
    const tintCol = new THREE.Color(ORE_BALL[tint] ?? ORE_BALL.bone);
    live.forEach((a, i) => {
      const u = (1.5 + pad + a.x * (picW - pad * 2)) / W;
      const v = (1.5 + pad + a.y * (picH - pad * 2)) / H;
      mtx.compose(new THREE.Vector3((u - 0.5) * fw, bodyH + 0.0045 + r3 * 0.9, (v - 0.5) * fd), new THREE.Quaternion(), new THREE.Vector3(r3, r3, r3));
      balls.setMatrixAt(i, mtx);
      // An ion is lighter for a plus and darker for a minus, and wears the sign; a molecule's atoms all one tone.
      col.copy(tintCol).multiplyScalar(ions ? (a.sign > 0 ? 1.25 : 0.7) : 1);
      balls.setColorAt(i, col);
    });
    balls.count = live.length;
    balls.instanceMatrix.needsUpdate = true;
    if (balls.instanceColor) balls.instanceColor.needsUpdate = true;
    g.add(balls);
    if (ions) {
      // The sign on top of each ion: a bar for a minus, a cross for a plus, in dark ink (never told by colour alone).
      const bar = new THREE.BoxGeometry(1, 0.0006, 0.22);
      const barMat = c.own(new THREE.MeshBasicMaterial({ color: 0x15130f }));
      const strokes = live.reduce((n, a) => n + (a.sign > 0 ? 2 : 1), 0);
      const marks = new THREE.InstancedMesh(bar, barMat, Math.max(1, strokes));
      let k = 0;
      live.forEach(a => {
        const u = (1.5 + pad + a.x * (picW - pad * 2)) / W;
        const v = (1.5 + pad + a.y * (picH - pad * 2)) / H;
        const x = (u - 0.5) * fw; const z = (v - 0.5) * fd; const y = bodyH + 0.0045 + r3 * 1.78;
        const put = rot => { mtx.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), new THREE.Vector3(r3 * 0.9, r3 * 0.9, r3 * 0.9)); marks.setMatrixAt(k++, mtx); };
        put(0);
        if (a.sign > 0) put(Math.PI / 2);
      });
      marks.count = k;
      marks.instanceMatrix.needsUpdate = true;
      g.add(marks);
    }
  }
  const pane = mesh(new THREE.PlaneGeometry(fw, fd), m.labPane, { cast: false, receive: false });
  pane.rotation.x = -Math.PI / 2;
  pane.position.set(0, glassY, 0);
  g.add(pane);
  return done(g, glassY + 0.001);
}

/** A small panel lamp: a brass collar and a lens, lit amber while `on` (a mark of light, not a light). */
function lampMesh(c, r, on) {
  const g = new THREE.Group();
  g.add(mesh(lathe([[0, 0], [r * 1.35, 0], [r * 1.35, 0.004], [r * 1.05, 0.006], [0, 0.006]], 18), c.mats.ligBrassWorn));
  const lens = on
    ? c.own(new THREE.MeshStandardMaterial({ color: 0x4a3410, emissive: new THREE.Color(0xe59b24), emissiveIntensity: 0.95, roughness: 0.3 }))
    : c.own(new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.25, metalness: 0.1 }));
  const dome = mesh(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lens, { cast: false });
  dome.position.y = 0.004;
  g.add(dome);
  return g;
}

/**
 * A salt specimen: a tag standing on a brass foot, over a small cluster of crystal (cut glass: its edges are sharp, because a
 * crystal's are) on a rubber pad, the two ions painted to scale on the card face, named and measured.
 */
export function buildSaltSpecimen(c, { text = '', seedId = 'x', molten = false }) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const w = hw * 1.96;
  const d = hh * 1.96;
  const h = 0.014;
  g.add(at(mesh(roundedSlab(w, d, h, 0.012, 0.003), m.ligEnamelBlack), 0, 0, 0));
  g.add(at(mesh(roundedSlab(w * 0.96, d * 0.96, 0.003, 0.01, 0.001), m.ligBrassWorn), 0, h - 0.002, 0));
  const pic = mesh(new THREE.PlaneGeometry(w * 0.9, d * 0.9), c.face(), { cast: false });
  pic.rotation.x = -Math.PI / 2;
  pic.position.y = h + 0.0017;
  g.add(pic);
  // A crystal at the back corner: a few cut prisms, glassy.
  const rnd = mulberry32(hashId(seedId) + 5);
  const crystalMat = molten ? c.own(new THREE.MeshStandardMaterial({ color: 0xe59b24, roughness: 0.2, transparent: true, opacity: 0.55, emissive: 0x5a2c06, emissiveIntensity: 0.5 })) : m.labGlass;
  for (let i = 0; i < 4; i++) {
    const r = 0.007 + rnd() * 0.006;
    const L = 0.018 + rnd() * 0.02;
    const cr = mesh(new THREE.CylinderGeometry(r * 0.8, r, L, 6), crystalMat, { cast: false });
    cr.position.set(w * 0.38 + (rnd() - 0.5) * 0.03, h + L / 2, -d * 0.36 + (rnd() - 0.5) * 0.02);
    cr.rotation.set((rnd() - 0.5) * 0.5, rnd() * 3, (rnd() - 0.5) * 0.5);
    g.add(cr);
  }
  void text;
  return done(g, h + 0.03);
}

/** A pair tag: a cast tag with a brass edge, two rivets and the pair's picture on enamel, as hung on a sample. */
export function buildPairTag(c, { seedId = 'x' }) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const w = hw * 1.96;
  const d = hh * 1.96;
  g.add(at(mesh(roundedSlab(w, d, 0.011, 0.012, 0.003), m.ligBrassWorn), 0, 0, 0));
  g.add(at(mesh(roundedSlab(w * 0.9, d * 0.88, 0.004, 0.009, 0.0014), m.ligEnamelBlack), 0, 0.009, 0));
  const pic = mesh(new THREE.PlaneGeometry(w * 0.86, d * 0.82), c.face(), { cast: false });
  pic.rotation.x = -Math.PI / 2;
  pic.position.y = 0.0136;
  g.add(pic);
  for (const sx of [-1, 1]) {
    const r = bolt(m.labSteel, 0.0046);
    r.position.set(sx * (w / 2 - 0.012), 0.0105, -d / 2 + 0.012);
    g.add(r);
  }
  // The hanging hole, bound with a loop of wire.
  const loop = mesh(new THREE.TorusGeometry(0.008, 0.0018, 6, 18), m.labSteel);
  loop.rotation.x = Math.PI / 2;
  loop.position.set(0, 0.0125, d / 2 - 0.012);
  g.add(loop);
  void seedId;
  return done(g, 0.0145);
}

/* ------------------------------------------------------------------ tools of the block bench */

/**
 * A club hammer: a forged iron head with two faces on an ash handle bound with a wedge, lying along x, head at the left. Laid on a
 * block it is a blow.
 */
export function buildHammer(c) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const L = hw * 1.9;
  const headL = L * 0.4;
  const hr = Math.min(hh * 0.32, 0.034);
  const cy = hr * 1.02;
  // The head: a turned barrel with chamfered faces, lying on its side; a collar round the eye.
  const head = mesh(lathe([[0, 0], [hr * 0.86, 0], [hr, hr * 0.14], [hr, headL - hr * 0.14], [hr * 0.86, headL], [0, headL]], 28), m.ligIron);
  head.rotation.z = Math.PI / 2;
  head.position.set(-L / 2 + headL, cy, 0);
  g.add(head);
  // Struck faces are bright where they have been used.
  for (const sx of [-1, 1]) g.add(at(lying(hr * 0.84, hr * 0.84, 0.0016, m.ligSteel, 24, { receive: false }), -L / 2 + headL / 2 + sx * (headL / 2 + 0.0004), cy, 0));
  // The handle: a long tapered ash shaft out of the eye, a swelling at the end, and an iron wedge in the eye.
  const hl = L - headL * 0.6;
  const shaft = mesh(lathe([[0, 0], [hr * 0.34, 0], [hr * 0.28, hl * 0.5], [hr * 0.3, hl * 0.86], [hr * 0.44, hl * 0.94], [hr * 0.38, hl], [0, hl]], 18), m.ligTimber);
  shaft.rotation.z = -Math.PI / 2;
  shaft.position.set(-L / 2 + headL * 0.5, cy, 0);
  g.add(shaft);
  g.add(at(mesh(new THREE.BoxGeometry(0.003, hr * 0.5, hr * 0.12), m.labSteel, { receive: false }), -L / 2 + headL * 0.5, cy + hr * 0.78, 0));
  return done(g, cy + hr);
}

/**
 * A pair of clip leads: a little cased meter with a lamp, and two insulated cables that run out of its ends to a crocodile clip
 * each. Laid on a block the clips bite its two ends (the table does not move them; they hang where the block is). The lamp is lit
 * while a current passes (`lit`).
 */
export function buildLeads(c, { lit = false, text = '' }) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const bw = hw * 0.9;
  const bd = hh * 0.8;
  g.add(at(mesh(roundedSlab(bw, bd, 0.026, 0.012, 0.003), m.labBakelite), 0, 0, 0));
  const lamp = lampMesh(c, 0.012, lit);
  lamp.position.set(0, 0.026, -bd * 0.12);
  g.add(lamp);
  if (text) {
    const tag = c.label(text, bw * 0.84, bd * 0.26, { bg: '#2a2620' });
    tag.position.set(0, 0.0266, bd * 0.26);
    g.add(tag);
  }
  // The cables: a thick rubber lead out of each end, curving down to a clip.
  for (const [sx, colour] of [[-1, 0x9a2e22], [1, 0x1b1a18]]) {
    const cable = c.own(new THREE.MeshStandardMaterial({ color: colour, roughness: 0.7, metalness: 0.02 }));
    const x0 = sx * bw / 2;
    const x1 = sx * hw * 0.78;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x0, 0.012, 0), new THREE.Vector3((x0 + x1) / 2, 0.016, sx * hh * 0.18), new THREE.Vector3(x1, 0.012, sx * hh * 0.34)
    ]);
    g.add(mesh(new THREE.TubeGeometry(curve, 16, 0.0048, 8), cable));
    // The crocodile clip: two steel jaws on a sleeve, jaws pointing outwards.
    const clip = new THREE.Group();
    clip.add(at(lying(0.0062, 0.0062, 0.02, cable, 12), 0, 0, 0));
    for (const jz of [-1, 1]) {
      const jaw = mesh(new THREE.BoxGeometry(0.026, 0.0035, 0.0075), m.labSteel, { receive: false });
      jaw.position.set(sx * 0.02, jz * 0.0035 + 0.0042, 0);
      jaw.rotation.z = jz * -0.1 * sx;
      clip.add(jaw);
    }
    clip.position.set(x1, 0.014, sx * hh * 0.34);
    clip.rotation.y = sx > 0 ? 0.2 : -0.2;
    g.add(clip);
  }
  return done(g, 0.04);
}

/**
 * A pair of tongs: two forged arms crossed at a rivet, rubber sleeves on the grips, serrated jaws at the front, lying along x with the
 * jaws to the left. Laid on a block the jaws close on its middle.
 */
export function buildTongs(c, { text = '' }) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const L = hw * 1.9;
  const t = 0.012;
  const jawL = L * 0.3;
  const pivotX = -L / 2 + L * 0.42;
  const wA = Math.min(0.022, hh * 0.26);
  for (const s of [-1, 1]) {
    // One arm: a flat bar from the jaw (on its own side of the axis) across the pivot to a grip on the far side; heavier at the jaw.
    const shape = new THREE.Shape();
    shape.moveTo(-L / 2, s * 0.002);
    shape.lineTo(-L / 2 + jawL * 0.5, s * (0.002 + wA * 0.5));
    shape.lineTo(-L / 2 + jawL, s * (wA * 0.34));
    shape.lineTo(pivotX, -s * wA * 0.1);
    shape.lineTo(L / 2, -s * hh * 0.5);
    shape.lineTo(L / 2, -s * hh * 0.5 - s * wA * 0.8);
    shape.lineTo(pivotX, -s * wA * 0.1 - s * wA * 0.8);
    shape.lineTo(-L / 2 + jawL, s * wA * 0.34 + s * wA * 0.8);
    shape.lineTo(-L / 2 + jawL * 0.5, s * (0.002 + wA * 0.5) + s * wA * 0.9);
    shape.lineTo(-L / 2, s * 0.002 + s * wA * 0.9);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelThickness: 0.0018, bevelSize: 0.0018, bevelSegments: 2 });
    geo.rotateX(-Math.PI / 2);
    const arm = mesh(geo, m.ligIron);
    arm.position.set(0, s > 0 ? 0.002 : 0.002 + t + 0.001, 0);
    g.add(arm);
    // The jaw's teeth: a short row of serrations on the inner face.
    for (let i = 0; i < 4; i++) {
      const tooth = mesh(new THREE.BoxGeometry(0.004, t * 0.9, 0.003), m.ligSteel, { receive: false });
      tooth.position.set(-L / 2 + 0.008 + i * 0.011, (s > 0 ? 0.002 : 0.002 + t + 0.001) + t / 2, -s * 0.0035);
      g.add(tooth);
    }
    // The grip: a rubber sleeve over the end of the handle.
    const sleeve = mesh(roundedSlab(L * 0.3, wA * 1.5, t + 0.006, 0.006, 0.0018), m.ligRubber);
    sleeve.position.set(L / 2 - L * 0.15, (s > 0 ? 0.002 : 0.002 + t + 0.001) - 0.003, s * (hh * 0.5 + wA * 0.4));
    g.add(sleeve);
  }
  // The rivet.
  g.add(at(mesh(new THREE.CylinderGeometry(0.008, 0.008, t * 2 + 0.008, 14), m.labBrass), pivotX, 0.002 + t, 0));
  void text;
  return done(g, 0.04);
}

/* ------------------------------------------------------------------ the slate and the tool tiles */

/**
 * A tool from the slate's rack: a stamped brass cap with a turned, knurled grip and the tool's name enamelled on its face. These
 * are things you pick up and set down on a board (a pair of electrons, a lift, a stamp), so each is a chunky cap with weight.
 */
export function buildToolCap(c, { face }) {
  const { hw, mats: m } = c;
  const g = new THREE.Group();
  const R = hw;
  const H = 0.03;
  g.add(mesh(lathe([[0, 0], [R * 0.94, 0], [R, H * 0.1], [R, H * 0.74], [R * 0.93, H * 0.9], [R * 0.84, H], [0, H]], 36), m.ligBrassWorn));
  // Knurling: short ribs round the rim.
  const rib = new THREE.BoxGeometry(R * 0.06, H * 0.5, R * 0.1);
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    const r = mesh(rib, m.labBrass, { receive: false });
    r.position.set(Math.cos(a) * R * 1.0, H * 0.4, Math.sin(a) * R * 1.0);
    r.rotation.y = -a;
    g.add(r);
  }
  // The painted face (the tool's picture and its name) set in the top, flush.
  const disc = mesh(new THREE.CircleGeometry(R * 0.86, 36), face, { cast: false });
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = H + 0.0006;
  g.add(disc);
  return done(g, H + 0.001);
}

/** A socket in a board where a pair of electrons is set: empty in 3D so the slate's Lewis bond lines connect atoms directly. */
export function buildJointSocket(c) {
  return new THREE.Group();
}

/* ------------------------------------------------------------------ the hub of arms, balloons, the protractor */

/** The hub: a heavy cast ball floating above its turned emitter base on the plate, sockets all round it, the atom's symbol on a plate on its crown. */
export function buildHubBall(c, { face, body }) {
  const { hw, mats: m } = c;
  const g = new THREE.Group();
  const R = hw * 1.0;
  // Pedestal base anchored to the bench plate
  g.add(mesh(lathe([[R * 0.5, 0], [R * 0.9, 0], [R * 0.96, R * 0.12], [R * 0.7, R * 0.22], [R * 0.4, R * 0.26]], 32), m.ligIron));
  // Levitation emitter collar on the base
  const emitter = mesh(new THREE.TorusGeometry(R * 0.42, R * 0.04, 8, 24), m.ligBrassWorn);
  emitter.rotation.x = Math.PI / 2;
  emitter.position.y = R * 0.26;
  g.add(emitter);

  // The hub ball floats in the air above the bench plate
  const floatY = R * 2.4;
  const cy = floatY;
  const bodyMat = c.own(new THREE.MeshPhysicalMaterial({ color: body, roughness: 0.3, metalness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.26 }));
  const ball = mesh(new THREE.SphereGeometry(R * 0.7, 36, 24), bodyMat);
  ball.position.y = cy;
  g.add(ball);
  // Socket rings round the equator, where an arm clips on.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const ring = mesh(new THREE.TorusGeometry(R * 0.11, R * 0.03, 8, 16), m.ligBrassWorn);
    ring.position.set(Math.cos(a) * R * 0.69, cy, Math.sin(a) * R * 0.69);
    ring.lookAt(ring.position.x * 2, cy, ring.position.z * 2);
    g.add(ring);
  }
  const capR = R * 0.5;
  const capGeo = new THREE.SphereGeometry(R * 0.704, 32, 10, 0, Math.PI * 2, 0, Math.asin(capR / (R * 0.7)));
  const p = capGeo.attributes.position;
  const uv = capGeo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + (p.getX(i) / capR) * 0.47, 0.5 - (p.getZ(i) / capR) * 0.47);
  uv.needsUpdate = true;
  const cap = mesh(capGeo, face, { cast: false });
  cap.position.y = cy;
  g.add(cap);
  g.userData.joinY = cy;
  return done(g, cy + R * 0.7);
}

/** An arm: a polished ball on a short steel stem with a clip at its foot, the atom's symbol painted on the crown. */
export function buildArmBall(c, { face, body, mult = 1 }) {
  const { hw, mats: m } = c;
  const g = new THREE.Group();
  const R = hw * 0.82;
  const stand = new THREE.Group();
  stand.name = 'arm-stand';
  const baseMesh = mesh(lathe([[0, 0], [R * 0.55, 0], [R * 0.6, R * 0.1], [R * 0.4, R * 0.18], [0, R * 0.2]], 24), m.ligIron);
  stand.add(baseMesh);
  // A bond to a neighbour, one brass band round the stem per shared pair.
  for (let i = 0; i < Math.min(3, mult); i++) {
    const band = at(mesh(new THREE.TorusGeometry(R * 0.5, R * 0.05, 6, 20), m.ligBrassWorn), 0, R * 0.22 + i * R * 0.1, 0);
    band.rotation.x = Math.PI / 2;
    stand.add(band);
  }
  g.add(stand);
  g.userData.baseMesh = stand;

  const cy = R * 0.2 + R * 0.88;
  const bodyMat = c.own(new THREE.MeshPhysicalMaterial({ color: body, roughness: 0.34, metalness: 0.04, clearcoat: 0.55, clearcoatRoughness: 0.28 }));
  const ball = mesh(new THREE.SphereGeometry(R, 32, 22), bodyMat);
  ball.scale.y = 0.88;
  ball.position.y = cy;
  g.add(ball);
  const capR = R * 0.9;
  const capGeo = new THREE.SphereGeometry(R * 1.004, 32, 12, 0, Math.PI * 2, 0, Math.asin(capR / R));
  const p = capGeo.attributes.position;
  const uv = capGeo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + (p.getX(i) / capR) * 0.47, 0.5 - (p.getZ(i) / capR) * 0.47);
  uv.needsUpdate = true;
  const cap = mesh(capGeo, face, { cast: false });
  cap.scale.y = 0.88;
  cap.position.y = cy;
  g.add(cap);
  g.userData.joinY = cy;
  return done(g, cy + R * 0.88);
}

/** A lone pair: a translucent lobe like a balloon held by a brass collar, standing on a short post. */
export function buildBalloonLobe(c) {
  const { hw, mats: m } = c;
  const g = new THREE.Group();
  const R = hw * 0.78;
  const stand = mesh(lathe([[0, 0], [R * 0.5, 0], [R * 0.54, R * 0.1], [R * 0.3, R * 0.2], [0, R * 0.2]], 24), m.ligIron);
  g.add(stand);
  g.userData.baseMesh = stand;

  const cy = R * 0.2 + R * 1.18 * 0.9;
  const lobe = c.own(new THREE.MeshPhysicalMaterial({ color: 0xb9a56a, roughness: 0.18, metalness: 0, transparent: true, opacity: 0.62, clearcoat: 1, clearcoatRoughness: 0.1 }));
  const geo = new THREE.SphereGeometry(R, 28, 18);
  geo.scale(1, 1.18, 0.82);
  const balloon = mesh(geo, lobe, { cast: false });
  balloon.position.y = cy;
  g.add(balloon);
  // A knot at the neck.
  const knot = at(mesh(new THREE.TorusGeometry(R * 0.2, R * 0.07, 6, 14), m.ligBrassWorn), 0, R * 0.2 + R * 0.12, 0);
  knot.rotation.x = Math.PI / 2;
  g.add(knot);
  g.userData.joinY = cy;
  return done(g, R * 0.2 + R * 2.1);
}

/** A protractor: a disc of clear acrylic, its degrees (the kit's painted face, with the reading) engraved in it, a brass pivot at the middle. */
export function buildProtractor(c, { face }) {
  const { hw, mats: m } = c;
  const g = new THREE.Group();
  const R = hw;
  g.add(mesh(new THREE.CylinderGeometry(R, R, 0.005, 40), m.labGlass, { cast: false }));
  const ring = mesh(new THREE.TorusGeometry(R * 0.99, 0.0025, 6, 40), m.labSteel);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.0025;
  g.add(ring);
  if (face) {
    const pic = mesh(new THREE.CircleGeometry(R * 0.94, 40), face, { cast: false });
    pic.rotation.x = -Math.PI / 2;
    pic.position.y = 0.0058;
    g.add(pic);
  }
  g.add(at(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.009, 16), m.ligBrassWorn), 0, 0.0025, 0));
  return done(g, 0.009);
}

/* ------------------------------------------------------------------ cards: molecules, streams, orbitals */

/**
 * A card of the kit's picture on an enamelled steel tile: a thick rounded tile with a pressed rim, two bolts, the kit's face
 * set in it. The shared shape of a molecule card, a stream tile and an orbital card. `slot` stands it in a cradle (a lip at the
 * foot).
 */
export function buildEnamelTile(c, { tone = 0x1c1b19, bolts = true, inset = 0.92, lip = false }) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const w = hw * 1.96;
  const d = hh * 1.96;
  const h = 0.014;
  g.add(at(mesh(roundedSlab(w, d, h, Math.min(hw, hh) * 0.2, 0.0035), m.ligIron), 0, 0, 0));
  const ename = tinted(c, m.ligEnamelBlack, tone, { roughness: 0.42, metalness: 0.1 });
  g.add(at(mesh(roundedSlab(w * 0.95, d * 0.93, 0.004, Math.min(hw, hh) * 0.16, 0.0014), ename), 0, h - 0.002, 0));
  const pic = mesh(new THREE.PlaneGeometry(w * inset, d * inset), c.face(), { cast: false });
  pic.rotation.x = -Math.PI / 2;
  pic.position.y = h + 0.0022;
  g.add(pic);
  if (bolts) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const b = bolt(m.labSteel, 0.0042);
      b.position.set(sx * (w / 2 - 0.0085), h - 0.0005, sz * (d / 2 - 0.0085));
      g.add(b);
    }
  }
  if (lip) g.add(at(mesh(roundedSlab(w * 0.9, 0.006, 0.01, 0.002, 0.0008), m.ligBrassWorn), 0, h - 0.002, d / 2 - 0.004));
  return done(g, h + 0.003);
}

/** A flat-tipped probe lying on the table with a rubber handle: the arrows tool and the charged rod share it. */
export function buildProbe(c, { text = '', colour = 0x8a3a2a, rod = false }) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const L = hw * 1.9;
  const r = Math.min(hh * 0.2, 0.014);
  const cy = r + 0.002;
  if (rod) {
    // A charged rod: an ebonite rod with a brass cap at one end, resting on two small feet.
    g.add(at(lying(r, r, L * 0.78, m.labBakelite, 18), 0, cy, 0));
    g.add(at(lying(r * 1.2, r * 1.2, L * 0.12, m.ligBrassWorn, 18), L * 0.4, cy, 0));
    g.add(at(lying(r * 1.0, r * 0.7, L * 0.08, m.ligBrassWorn, 18), -L * 0.42, cy, 0));
    for (const sx of [-0.28, 0.28]) g.add(at(mesh(roundedSlab(0.014, r * 2.6, cy * 0.9, 0.003, 0.001), m.ligRubber), sx * L, 0, 0));
  } else {
    // The arrows tool: a hand-held pointer with a rubber grip and a flat steel arrowhead.
    g.add(at(lying(r * 1.1, r * 1.1, L * 0.5, m.ligRubber, 18), L * 0.2, cy, 0));
    g.add(at(mesh(roundedSlab(L * 0.34, r * 0.8, 0.004, 0.003, 0.001), tinted(c, m.ligEnamelRed, colour)), -L * 0.28, cy - r + 0.003, 0));
    const head = mesh(new THREE.ConeGeometry(r * 1.5, L * 0.16, 4), m.labSteel);
    head.rotation.z = Math.PI / 2;
    head.position.set(-L * 0.5, cy - r + 0.006, 0);
    g.add(head);
  }
  if (text) {
    const tag = c.label(text, L * 0.4, r * 1.8, { bg: '#1c1b19' });
    tag.position.set(rod ? 0 : L * 0.2, cy + r * 1.15, 0);
    g.add(tag);
  }
  return done(g, cy + r * 1.3);
}

/* ------------------------------------------------------------------ the boards and plates instruments are set into */

/**
 * A survey board: a heavy timber frame round a flat picture, strapped at the corners with iron and bolted, a sheet of glass over
 * the window. The slates, the plots and the plates of Ligar's benches are set into these. The picture is the table's own flat
 * ground; this is what is built round it.
 */
export function buildBoardDeck(w, d, { mats: m }) {
  const g = new THREE.Group();
  const h = 0.02;
  const rim = Math.min(0.022, Math.min(w, d) * 0.08);
  g.add(mesh(wallGeometry(w, d, rim, h, Math.min(0.03, Math.min(w, d) * 0.12), 0.003), m.ligTimberDark));
  // A raised inner lip, in steel, so the glass has a seat.
  g.add(mesh(wallGeometry(w - rim * 1.5, d - rim * 1.5, 0.0035, h + 0.003, Math.min(0.02, Math.min(w, d) * 0.09), 0.0012), m.ligSteel));
  // Iron corner straps, each with two bolts.
  const sw = rim * 2.3;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const strap = mesh(roundedSlab(sw, sw, 0.004, 0.003, 0.001), m.ligIron);
    strap.position.set(sx * (w / 2 - sw / 2 + 0.001), h - 0.0008, sz * (d / 2 - sw / 2 + 0.001));
    g.add(strap);
    for (const k of [-0.28, 0.28]) {
      const b = bolt(m.labSteel, 0.0036, true);
      b.position.set(strap.position.x + k * sw, h + 0.0026, strap.position.z + k * sw);
      g.add(b);
    }
  }
  const glass = mesh(new THREE.PlaneGeometry(w - rim * 2, d - rim * 2), m.labPane, { cast: false, receive: false });
  glass.rotation.x = -Math.PI / 2;
  glass.position.y = h + 0.0026;
  g.add(glass);
  return done(g, h + 0.004);
}

/**
 * A hotplate's frame: a cast-iron plate with a broken edge on four stub feet, a ring of coil seated in a groove, and a control
 * housing at the front. The picture the kit prints (the plate's heat, its name, its dial) is what it is set round.
 */
export function buildHotplateDeck(w, d, { mats: m }) {
  const g = new THREE.Group();
  const h = 0.026;
  const rim = Math.min(0.026, Math.min(w, d) * 0.07);
  g.add(mesh(wallGeometry(w, d, rim, h, Math.min(0.03, Math.min(w, d) * 0.1), 0.0035), m.ligIron));
  g.add(mesh(wallGeometry(w - rim * 1.7, d - rim * 1.7, 0.004, h + 0.004, Math.min(0.02, Math.min(w, d) * 0.08), 0.0014), m.ligCopper));
  for (const sx of [-1, 1]) {
    const lug = mesh(roundedSlab(0.03, 0.02, h * 0.9, 0.006, 0.002), m.ligIron);
    lug.position.set(sx * (w / 2 + 0.006), 0, d * 0.12);
    g.add(lug);
  }
  const glass = mesh(new THREE.PlaneGeometry(w - rim * 2, d - rim * 2), m.labPane, { cast: false, receive: false });
  glass.rotation.x = -Math.PI / 2;
  glass.position.y = h + 0.0042;
  g.add(glass);
  return done(g, h + 0.005);
}

/** The frame a Ligar instrument is set in: a hotplate in cast iron, everything else a survey board. Null for another world's table. */
export function ligarDeck(f, c) {
  if (c.skin !== LIGAR_SKIN) return null;
  return f.kind === 'hotplate' ? buildHotplateDeck(c.w, c.d, { mats: c.mats }) : buildBoardDeck(c.w, c.d, { mats: c.mats });
}

/** A basalt tray: thick rough-cut walls and a cut-stone floor, for the host's own stone. */
export function buildStoneTray(w, d, { wallMat, liningMat, h = 0.022, wall = 0.016, c = null }) {
  const g = new THREE.Group();
  g.add(mesh(wallGeometry(w, d, wall, h, 0.018, 0.0035), wallMat));
  g.add(at(mesh(roundedSlab(w - wall * 0.9, d - wall * 0.9, 0.003, 0.012, 0.0008), liningMat, { cast: false }), 0, 0, 0));
  void c;
  return g;
}
