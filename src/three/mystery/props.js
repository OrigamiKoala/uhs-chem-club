/**
 * props.js — the problem props a world shows: the thing a crew member walks the player to (`walkup.js`) and
 * the world's own trouble (`site.js`). Every prop is built from primitives with plain PBR materials, no
 * textures, so nothing uploads on the frame it first appears; it is built with the world and warmed with it.
 *
 * A builder takes (kit, opts) and returns `{ group, parts, focus, radius }`:
 *   group   built facing +z at the origin; `site.js` places and turns it
 *   parts   named meshes/points an effect drives (`effects.js`); each is `noMerge`
 *   focus   the point the camera looks at, in the group's frame
 *   radius  the footprint, for colliders and the spot picker
 *
 * Kinds are listed in `PROP_KINDS` (read by the checks). A prop's moving parts never cast a shadow, so an
 * effect never keeps the sun's shadow map redrawing (`shadow-pace.js`).
 */
import * as THREE from 'three';

/** The shared materials, one set per world. */
export function makeKit(own = o => o) {
  const cache = new Map();
  const mat = (key, make) => {
    if (!cache.has(key)) cache.set(key, own(make()));
    return cache.get(key);
  };
  const std = (color, rough = 0.7, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
  return {
    own,
    mat,
    steel: () => mat('steel', () => std(0x5d6168, 0.45, 0.8)),
    darkSteel: () => mat('darkSteel', () => std(0x2c2e33, 0.55, 0.75)),
    rust: () => mat('rust', () => std(0x6e3b22, 0.9, 0.25)),
    copper: () => mat('copper', () => std(0xb06a3e, 0.4, 0.9)),
    zinc: () => mat('zinc', () => std(0x9aa1a6, 0.5, 0.7)),
    verdigris: () => mat('verdigris', () => std(0x4f8f78, 0.85, 0.2)),
    wood: () => mat('wood', () => std(0x6b4f33, 0.85, 0)),
    canvas: () => mat('canvas', () => std(0x8a7c5e, 0.95, 0)),
    rubber: () => mat('rubber', () => std(0x1d1c1b, 0.9, 0)),
    concrete: () => mat('concrete', () => std(0x77736b, 0.95, 0)),
    rock: () => mat('rock', () => std(0x4a4541, 0.95, 0)),
    basaltCut: () => mat('basaltCut', () => std(0x16171a, 0.06, 0.15)),
    ice: () => mat('ice', () => std(0xbfd8e6, 0.15, 0, { transparent: true, opacity: 0.82 })),
    frost: () => mat('frost', () => std(0xe4eef2, 0.8, 0)),
    salt: () => mat('salt', () => std(0xe9e4da, 0.85, 0)),
    plastic: () => mat('plastic', () => std(0x2f4a3a, 0.25, 0, { transparent: true, opacity: 0.9 })),
    glass: () => mat('glass', () => std(0xcfe3ea, 0.05, 0, { transparent: true, opacity: 0.3 })),
    paint: color => mat(`paint:${color}`, () => std(color, 0.6, 0.3)),
    liquid: color => mat(`liquid:${color}`, () => std(color, 0.15, 0, { transparent: true, opacity: 0.88 })),
    // Lit parts: each its own material, so an effect can drive one prop's lamp without touching another's.
    lit: color => own(std(0x111111, 0.4, 0, { emissive: new THREE.Color(color), emissiveIntensity: 1.6 })),
    hot: () => own(std(0x3a2418, 0.7, 0.4, { emissive: new THREE.Color(0xc2501c), emissiveIntensity: 0 })),
    puffTexture: () => mat('puff', () => puffTexture())
  };
}

function puffTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g?.createRadialGradient) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* ---------------- helpers ---------------- */

function add(group, geo, material, [x, y, z] = [0, 0, 0], { rot = null, shadow = true, kit } = {}) {
  const m = new THREE.Mesh(kit ? kit.own(geo) : geo, material);
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = shadow;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

/** A part an effect drives: kept out of the merge, never casting a shadow. */
function part(m) {
  m.userData.noMerge = true;
  m.castShadow = false;
  return m;
}

function drum(kit, g, [x, y, z], color, { band = null, lid = true, tilt = 0 } = {}) {
  const d = add(g, new THREE.CylinderGeometry(0.29, 0.29, 0.88, 14), kit.paint(color), [x, y + 0.44, z], { kit, rot: [tilt, 0, 0] });
  for (const h of [0.16, 0.72]) add(g, new THREE.TorusGeometry(0.29, 0.018, 4, 18), kit.darkSteel(), [x, y + h, z], { kit, rot: [Math.PI / 2, 0, 0] });
  if (band) add(g, new THREE.CylinderGeometry(0.295, 0.295, 0.12, 14, 1, true), kit.paint(band), [x, y + 0.5, z], { kit });
  if (lid) add(g, new THREE.CylinderGeometry(0.27, 0.27, 0.02, 14), kit.darkSteel(), [x, y + 0.89, z], { kit });
  return d;
}

/* ---------------- builders ---------------- */

const B = {};

/** A cluster of steel drums. opts: n, color, band, warm (a hot skin to glow), tags */
B.drums = (kit, { n = 4, color = 0x4d5b4a, band = 0xc9a23a, warm = false, tipped = false } = {}) => {
  const g = new THREE.Group();
  const spots = [[-0.34, 0.3], [0.34, 0.3], [0, -0.3], [-0.68, -0.3], [0.68, -0.3], [0.34, -0.9]].slice(0, n);
  const parts = { skins: [] };
  spots.forEach(([x, z], i) => {
    const d = drum(kit, g, [x, 0, z], color, { band });
    if (warm) {
      const skin = part(add(g, new THREE.CylinderGeometry(0.296, 0.296, 0.5, 14, 1, true), kit.hot(), [x, 0.42, z], { kit }));
      parts.skins.push(skin);
    }
    void d; void i;
  });
  if (tipped) add(g, new THREE.CylinderGeometry(0.29, 0.29, 0.88, 14), kit.paint(color), [1.0, 0.29, 0.35], { kit, rot: [0, 0, Math.PI / 2] });
  parts.top = new THREE.Object3D();
  parts.top.position.set(0, 1.0, 0);
  g.add(parts.top);
  return { group: g, parts, focus: [0, 0.6, 0], radius: 1.1 };
};

/** A tank on legs with a sight glass. opts: liquid (colour), level 0..1, tall */
B.tank = (kit, { liquid = 0x2f6fae, level = 0.7, tall = 1.9 } = {}) => {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) add(g, new THREE.BoxGeometry(0.08, 0.5, 0.08), kit.darkSteel(), [x, 0.25, z], { kit });
  add(g, new THREE.CylinderGeometry(0.62, 0.62, tall, 18), kit.steel(), [0, 0.5 + tall / 2, 0], { kit });
  add(g, new THREE.SphereGeometry(0.62, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), kit.steel(), [0, 0.5 + tall, 0], { kit });
  // Sight glass on the front: a clear tube with the liquid standing in it.
  add(g, new THREE.CylinderGeometry(0.05, 0.05, tall * 0.85, 8), kit.glass(), [0, 0.5 + tall / 2, 0.64], { kit, shadow: false });
  const h = tall * 0.85 * level;
  const fill = part(add(g, new THREE.CylinderGeometry(0.038, 0.038, h, 8), kit.liquid(liquid), [0, 0.5 + tall * 0.075 + h / 2, 0.64], { kit }));
  // A drip tray under the drain cock.
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8), kit.darkSteel(), [0.3, 0.62, 0.62], { kit, rot: [Math.PI / 2, 0, 0] });
  const tray = part(add(g, new THREE.CylinderGeometry(0.32, 0.32, 0.03, 16), kit.liquid(liquid), [0.3, 0.02, 0.95], { kit }));
  const spout = new THREE.Object3D();
  spout.position.set(0.3, 0.6, 0.76);
  g.add(spout);
  return { group: g, parts: { fill, tray, spout }, focus: [0, 1.2, 0.6], radius: 1.0 };
};

/** A pipe run that elbows down into the ground. opts: len, frost, valve */
B.pipe = (kit, { len = 3.2, frost = false, valve = true } = {}) => {
  const g = new THREE.Group();
  const m = frost ? kit.frost() : kit.steel();
  add(g, new THREE.CylinderGeometry(0.16, 0.16, len, 12), m, [0, 0.9, 0], { kit, rot: [0, 0, Math.PI / 2] });
  add(g, new THREE.CylinderGeometry(0.16, 0.16, 1.0, 12), m, [len / 2, 0.4, 0], { kit });
  for (const x of [-len / 2 + 0.3, 0, len / 2 - 0.3]) add(g, new THREE.BoxGeometry(0.1, 0.9, 0.1), kit.darkSteel(), [x, 0.45, -0.22], { kit });
  add(g, new THREE.CylinderGeometry(0.24, 0.24, 0.08, 12), kit.darkSteel(), [-len / 2, 0.9, 0], { kit, rot: [0, 0, Math.PI / 2] });
  // A collar where it goes into the ground.
  add(g, new THREE.CylinderGeometry(0.34, 0.4, 0.12, 12), kit.concrete(), [len / 2, 0.05, 0], { kit });
  if (valve) add(g, new THREE.TorusGeometry(0.2, 0.03, 6, 16), kit.paint(0x8c2a1e), [0, 1.18, 0], { kit, rot: [Math.PI / 2, 0, 0] });
  const ground = new THREE.Object3D();
  ground.position.set(len / 2, 0.15, 0);
  g.add(ground);
  const joint = new THREE.Object3D();
  joint.position.set(0, 0.9, 0.12);
  g.add(joint);
  return { group: g, parts: { ground, joint }, focus: [0.4, 0.8, 0], radius: len / 2 + 0.5 };
};

/** A lamp post whose head can go dark or flicker. */
B.lamp = (kit, { color = 0xe6a443 } = {}) => {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.05, 0.07, 3.2, 6), kit.darkSteel(), [0, 1.6, 0], { kit });
  add(g, new THREE.BoxGeometry(0.5, 0.04, 0.04), kit.darkSteel(), [0.24, 3.1, 0], { kit });
  const head = part(add(g, new THREE.BoxGeometry(0.18, 0.26, 0.18), kit.lit(color), [0.46, 2.9, 0], { kit }));
  return { group: g, parts: { head }, focus: [0.3, 2.4, 0], radius: 0.4 };
};

/** Crates, stacked. opts: n, tag (paint colour of the stencil band) */
B.crates = (kit, { n = 3, tag = 0xc9a23a, wrapped = false } = {}) => {
  const g = new THREE.Group();
  const at = [[-0.5, 0, 0], [0.5, 0, 0], [0, 0.8, 0], [0, 0, -0.85]].slice(0, n);
  for (const [x, y, z] of at) {
    add(g, new THREE.BoxGeometry(0.9, 0.8, 0.8), kit.wood(), [x, y + 0.4, z], { kit });
    add(g, new THREE.BoxGeometry(0.5, 0.18, 0.01), kit.paint(tag), [x, y + 0.45, z + 0.405], { kit, shadow: false });
    if (wrapped) add(g, new THREE.BoxGeometry(0.96, 0.86, 0.86), kit.plastic(), [x, y + 0.4, z], { kit, shadow: false });
  }
  return { group: g, parts: {}, focus: [0, 0.7, 0.3], radius: 1.2 };
};

/** A shallow pool in a kerb. opts: r, liquid, cloudy */
B.pond = (kit, { r = 1.6, liquid = 0x5d7d6c } = {}) => {
  const g = new THREE.Group();
  add(g, new THREE.TorusGeometry(r, 0.12, 6, 28), kit.concrete(), [0, 0.1, 0], { kit, rot: [Math.PI / 2, 0, 0] });
  const surface = part(add(g, new THREE.CircleGeometry(r, 28), kit.liquid(liquid), [0, 0.08, 0], { kit, rot: [-Math.PI / 2, 0, 0] }));
  const centre = new THREE.Object3D();
  centre.position.set(0, 0.1, 0);
  g.add(centre);
  return { group: g, parts: { surface, centre, r }, focus: [0, 0.1, 0], radius: r + 0.2 };
};

/** A pylon with two different metal plates bolted together, one corroding. */
B.pylon = (kit, { corroded = true } = {}) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.3, 3.6, 0.3), kit.darkSteel(), [0, 1.8, 0], { kit });
  add(g, new THREE.BoxGeometry(1.6, 0.12, 0.12), kit.darkSteel(), [0, 3.4, 0], { kit });
  add(g, new THREE.BoxGeometry(0.42, 0.7, 0.06), kit.copper(), [0, 1.3, 0.18], { kit });
  add(g, new THREE.BoxGeometry(0.42, 0.7, 0.06), corroded ? kit.verdigris() : kit.zinc(), [0, 1.3, 0.24], { kit });
  for (const [x, y] of [[-0.14, 1.55], [0.14, 1.55], [-0.14, 1.05], [0.14, 1.05]]) add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.14, 6), kit.steel(), [x, y, 0.25], { kit, rot: [Math.PI / 2, 0, 0] });
  for (const x of [-0.75, 0.75]) add(g, new THREE.CylinderGeometry(0.05, 0.08, 0.25, 8), kit.paint(0x7c6a4c), [x, 3.25, 0], { kit });
  const joint = new THREE.Object3D();
  joint.position.set(0, 1.3, 0.3);
  g.add(joint);
  return { group: g, parts: { joint }, focus: [0, 1.4, 0.2], radius: 0.6 };
};

/** A pressure gauge on a post, needle and all. */
B.gauge = (kit) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.08, 1.3, 0.08), kit.darkSteel(), [0, 0.65, 0], { kit });
  add(g, new THREE.CylinderGeometry(0.24, 0.24, 0.08, 20), kit.darkSteel(), [0, 1.45, 0.02], { kit, rot: [Math.PI / 2, 0, 0] });
  add(g, new THREE.CircleGeometry(0.2, 20), kit.salt(), [0, 1.45, 0.065], { kit, shadow: false });
  add(g, new THREE.BoxGeometry(0.07, 0.03, 0.005), kit.paint(0x8c2a1e), [0.12, 1.42, 0.068], { kit, shadow: false, rot: [0, 0, -0.6] });
  const needle = new THREE.Group();
  needle.position.set(0, 1.45, 0.075);
  const n = part(add(needle, new THREE.BoxGeometry(0.012, 0.17, 0.006), kit.rubber(), [0, 0.07, 0], { kit }));
  void n;
  needle.userData.noMerge = true;
  g.add(needle);
  return { group: g, parts: { needle }, focus: [0, 1.4, 0.05], radius: 0.3 };
};

/** A bank of battery cells with an indicator lamp. */
B.cells = (kit, { n = 4 } = {}) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(n * 0.5 + 0.2, 0.12, 0.7), kit.wood(), [0, 0.06, 0], { kit });
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.5;
    add(g, new THREE.BoxGeometry(0.42, 0.6, 0.55), kit.paint(0x2c3a33), [x, 0.42, 0], { kit });
    add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.08, 6), kit.copper(), [x - 0.1, 0.76, 0], { kit });
    add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.08, 6), kit.zinc(), [x + 0.1, 0.76, 0], { kit });
  }
  const lamp = part(add(g, new THREE.SphereGeometry(0.05, 10, 8), kit.lit(0x6fd06a), [n * 0.25 + 0.05, 0.85, 0.2], { kit }));
  add(g, new THREE.BoxGeometry(0.05, 0.75, 0.05), kit.darkSteel(), [n * 0.25 + 0.05, 0.42, 0.2], { kit });
  return { group: g, parts: { lamp }, focus: [0, 0.6, 0.1], radius: n * 0.25 + 0.4 };
};

/** A vent stack with a cowl. */
B.vent = (kit, { hot = false } = {}) => {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.42, 0.5, 0.3, 14), kit.concrete(), [0, 0.15, 0], { kit });
  const stack = add(g, new THREE.CylinderGeometry(0.26, 0.3, 2.2, 14), kit.darkSteel(), [0, 1.4, 0], { kit });
  void stack;
  add(g, new THREE.ConeGeometry(0.42, 0.3, 14, 1, true), kit.darkSteel(), [0, 2.75, 0], { kit });
  const parts = {};
  if (hot) parts.skin = part(add(g, new THREE.CylinderGeometry(0.31, 0.31, 0.9, 14, 1, true), kit.hot(), [0, 1.9, 0], { kit }));
  parts.mouth = new THREE.Object3D();
  parts.mouth.position.set(0, 2.55, 0);
  g.add(parts.mouth);
  return { group: g, parts, focus: [0, 2.0, 0], radius: 0.6 };
};

/** A heap of blast rubble, and a block sliced glass-smooth. */
B.rubble = (kit, { cut = false } = {}) => {
  const g = new THREE.Group();
  const rocks = [[0, 0.35, 0, 0.55], [0.7, 0.25, 0.3, 0.4], [-0.6, 0.3, 0.2, 0.45], [0.2, 0.2, 0.8, 0.3], [-0.3, 0.75, -0.1, 0.35], [0.5, 0.2, -0.5, 0.35]];
  for (const [x, y, z, r] of rocks) add(g, new THREE.IcosahedronGeometry(r, 0), kit.rock(), [x, y, z], { kit, rot: [x * 3, z * 2, y] });
  if (cut) {
    add(g, new THREE.BoxGeometry(1.2, 1.1, 0.9), kit.rock(), [-1.3, 0.55, -0.4], { kit });
    add(g, new THREE.BoxGeometry(1.21, 1.11, 0.02), kit.basaltCut(), [-1.3, 0.55, 0.06], { kit });
  }
  const crack = new THREE.Object3D();
  crack.position.set(0.15, 0.5, 0.35);
  g.add(crack);
  return { group: g, parts: { crack }, focus: [cut ? -0.6 : 0, 0.5, 0], radius: cut ? 2.0 : 1.2 };
};

/** A sealed glass tube on a stand; its gas glows when lit. */
B.tube = (kit, { color = 0xc8b6ff } = {}) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.9, 0.9, 0.5), kit.wood(), [0, 0.45, 0], { kit });
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.7, 10), kit.glass(), [0, 1.1, 0], { kit, shadow: false, rot: [0, 0, Math.PI / 2] });
  const gas = part(add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.64, 10), kit.lit(color), [0, 1.1, 0], { kit, rot: [0, 0, Math.PI / 2] }));
  for (const x of [-0.38, 0.38]) add(g, new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), kit.darkSteel(), [x, 1.1, 0], { kit, rot: [0, 0, Math.PI / 2] });
  return { group: g, parts: { gas }, focus: [0, 1.05, 0], radius: 0.6 };
};

/** A heap of powder or ore on a tray. opts: color, specks (a second colour scattered in) */
B.heap = (kit, { color = 0xe9e4da, specks = null, r = 0.8, h = 0.6 } = {}) => {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(r + 0.25, r + 0.25, 0.06, 20), kit.darkSteel(), [0, 0.03, 0], { kit });
  add(g, new THREE.ConeGeometry(r, h, 20), kit.paint(color), [0, 0.06 + h / 2, 0], { kit });
  if (specks) {
    const s = new THREE.IcosahedronGeometry(0.035, 0);
    for (let i = 0; i < 26; i++) {
      const a = i * 2.399, k = (i % 9) / 9;
      const rr = r * (0.2 + 0.75 * k);
      add(g, s.clone(), kit.paint(specks), [Math.cos(a) * rr, 0.06 + h * (1 - rr / r) + 0.01, Math.sin(a) * rr], { kit, shadow: false });
    }
  }
  return { group: g, parts: {}, focus: [0, 0.4, 0], radius: r + 0.3 };
};

/** A solar plate on a frame, tilted to the sky. opts: lamp (colour of a work lamp aimed at it) */
B.plate = (kit, { lamp = null } = {}) => {
  const g = new THREE.Group();
  for (const x of [-0.7, 0.7]) add(g, new THREE.BoxGeometry(0.07, 1.2, 0.07), kit.darkSteel(), [x, 0.6, 0], { kit });
  const cells = part(add(g, new THREE.BoxGeometry(1.8, 0.04, 1.1), kit.lit(0x1b2f5a), [0, 1.3, 0], { kit, rot: [-0.6, 0, 0] }));
  add(g, new THREE.BoxGeometry(1.9, 0.03, 1.2), kit.darkSteel(), [0, 1.27, -0.02], { kit, rot: [-0.6, 0, 0] });
  const parts = { cells };
  if (lamp !== null) {
    add(g, new THREE.CylinderGeometry(0.04, 0.05, 1.6, 6), kit.darkSteel(), [1.3, 0.8, 0.9], { kit });
    parts.lamp = part(add(g, new THREE.CylinderGeometry(0.14, 0.1, 0.22, 12), kit.lit(lamp), [1.2, 1.65, 0.8], { kit, rot: [0.9, 0.8, 0] }));
  }
  parts.edge = new THREE.Object3D();
  parts.edge.position.set(0.6, 1.45, 0.2);
  g.add(parts.edge);
  return { group: g, parts, focus: [0, 1.2, 0], radius: lamp !== null ? 1.6 : 1.0 };
};

/** Two beacon lamps on one mast. opts: colors */
B.beacons = (kit, { colors = [0xd8352a, 0x7a4cf0] } = {}) => {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.08, 0.12, 4.2, 8), kit.darkSteel(), [0, 2.1, 0], { kit });
  add(g, new THREE.BoxGeometry(1.4, 0.08, 0.08), kit.darkSteel(), [0, 4.0, 0], { kit });
  const heads = colors.map((c, i) => part(add(g, new THREE.SphereGeometry(0.2, 14, 10), kit.lit(c), [i ? 0.6 : -0.6, 3.75, 0], { kit })));
  return { group: g, parts: { heads }, focus: [0, 3.4, 0], radius: 0.9 };
};

/** A block of canal ice the height of a wall. */
B.icewall = (kit) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(3.2, 1.8, 1.2), kit.ice(), [0, 0.9, 0], { kit, shadow: false });
  add(g, new THREE.BoxGeometry(3.22, 0.05, 1.22), kit.frost(), [0, 1.8, 0], { kit, shadow: false });
  add(g, new THREE.BoxGeometry(0.8, 0.5, 0.5), kit.ice(), [1.9, 0.25, 0.3], { kit, shadow: false, rot: [0, 0.4, 0.2] });
  return { group: g, parts: {}, focus: [0, 1.0, 0.6], radius: 1.9 };
};

/** A salt bin with its doors torn open. */
B.bin = (kit, { specks = null } = {}) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(2.0, 1.3, 1.4), kit.wood(), [0, 0.65, -0.1], { kit });
  add(g, new THREE.BoxGeometry(1.7, 0.5, 0.02), kit.salt(), [0, 1.0, 0.61], { kit, shadow: false });
  add(g, new THREE.BoxGeometry(0.9, 1.0, 0.05), kit.wood(), [-1.25, 0.6, 0.85], { kit, rot: [0, -1.2, 0] });
  add(g, new THREE.BoxGeometry(0.9, 1.0, 0.05), kit.wood(), [1.3, 0.55, 0.75], { kit, rot: [0, 1.4, 0.06] });
  add(g, new THREE.CylinderGeometry(1.2, 1.5, 0.12, 20), kit.salt(), [0, 0.06, 1.1], { kit, shadow: false });
  if (specks) {
    const s = new THREE.IcosahedronGeometry(0.04, 0);
    for (let i = 0; i < 30; i++) {
      const a = i * 2.399, r = 0.2 + 1.1 * ((i % 7) / 7);
      add(g, s.clone(), kit.paint(specks), [Math.cos(a) * r, 0.13, 1.1 + Math.sin(a) * r * 0.8], { kit, shadow: false });
    }
  }
  return { group: g, parts: {}, focus: [0, 0.5, 0.6], radius: 1.7 };
};

/** A gas cylinder on a cradle. opts: hot (a skin that glows and shimmers) */
B.cylinder = (kit, { hot = false, color = 0x3d4a5a } = {}) => {
  const g = new THREE.Group();
  for (const x of [-0.7, 0.7]) add(g, new THREE.BoxGeometry(0.12, 0.45, 0.7), kit.darkSteel(), [x, 0.22, 0], { kit });
  add(g, new THREE.CylinderGeometry(0.38, 0.38, 2.0, 16), kit.paint(color), [0, 0.68, 0], { kit, rot: [0, 0, Math.PI / 2] });
  add(g, new THREE.SphereGeometry(0.38, 16, 8), kit.paint(color), [1.0, 0.68, 0], { kit });
  add(g, new THREE.SphereGeometry(0.38, 16, 8), kit.paint(color), [-1.0, 0.68, 0], { kit });
  add(g, new THREE.CylinderGeometry(0.07, 0.07, 0.25, 8), kit.steel(), [1.42, 0.68, 0], { kit, rot: [0, 0, Math.PI / 2] });
  const parts = {};
  if (hot) parts.skin = part(add(g, new THREE.CylinderGeometry(0.385, 0.385, 1.6, 16, 1, true), kit.hot(), [0, 0.68, 0], { kit, rot: [0, 0, Math.PI / 2] }));
  parts.top = new THREE.Object3D();
  parts.top.position.set(0, 1.1, 0);
  g.add(parts.top);
  return { group: g, parts, focus: [0, 0.7, 0], radius: 1.5 };
};

/** An electromagnet on a jib with a drum hanging from it. */
B.magnet = (kit) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.4, 4.2, 0.4), kit.paint(0x8a6a2a), [-1.4, 2.1, 0], { kit });
  add(g, new THREE.BoxGeometry(2.4, 0.3, 0.3), kit.paint(0x8a6a2a), [-0.3, 4.1, 0], { kit });
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), kit.darkSteel(), [0.6, 3.4, 0], { kit });
  const disc = part(add(g, new THREE.CylinderGeometry(0.5, 0.5, 0.25, 18), kit.lit(0x2a2a2a), [0.6, 2.7, 0], { kit }));
  drum(kit, g, [0.6, 1.7, 0], 0x5b6a7a, { band: 0xc9a23a });
  return { group: g, parts: { disc }, focus: [0.4, 2.2, 0], radius: 1.7 };
};

/** Iron bars stacked by an ore pile. */
B.ingots = (kit, { rows = 4 } = {}) => {
  const g = new THREE.Group();
  const bar = new THREE.BoxGeometry(0.6, 0.12, 0.18);
  for (let r = 0; r < rows; r++) for (let i = 0; i < 5; i++) {
    const turn = r % 2 ? Math.PI / 2 : 0;
    const x = r % 2 ? 0 : (i - 2) * 0.2, z = r % 2 ? (i - 2) * 0.2 : 0;
    add(g, bar.clone(), kit.steel(), [x - 0.6, 0.06 + r * 0.12, z], { kit, rot: [0, turn, 0] });
  }
  add(g, new THREE.ConeGeometry(0.6, 0.5, 14), kit.rust(), [0.6, 0.25, 0], { kit });
  return { group: g, parts: {}, focus: [0, 0.4, 0], radius: 1.2 };
};

/** A beam pump nodding on a pond's edge. */
B.pump = (kit) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(1.6, 0.2, 0.8), kit.concrete(), [0, 0.1, 0], { kit });
  add(g, new THREE.BoxGeometry(0.14, 1.5, 0.14), kit.darkSteel(), [0, 0.95, 0], { kit });
  const beam = new THREE.Group();
  beam.position.set(0, 1.7, 0);
  beam.userData.noMerge = true;
  part(add(beam, new THREE.BoxGeometry(2.0, 0.14, 0.14), kit.paint(0x8c5a2a), [0, 0, 0], { kit }));
  part(add(beam, new THREE.BoxGeometry(0.3, 0.4, 0.2), kit.darkSteel(), [0.95, -0.15, 0], { kit }));
  g.add(beam);
  add(g, new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), kit.steel(), [0.95, 0.6, 0], { kit });
  return { group: g, parts: { beam }, focus: [0, 1.2, 0], radius: 1.2 };
};

/** A cable clamped onto a line with a crude tap box. */
B.clamp = (kit) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.14, 2.6, 0.14), kit.wood(), [0, 1.3, 0], { kit });
  add(g, new THREE.CylinderGeometry(0.03, 0.03, 3.2, 6), kit.rubber(), [0, 2.4, 0], { kit, rot: [0, 0, Math.PI / 2] });
  add(g, new THREE.BoxGeometry(0.22, 0.14, 0.14), kit.copper(), [0.25, 2.4, 0], { kit });
  add(g, new THREE.BoxGeometry(0.5, 0.6, 0.3), kit.paint(0x3a3f36), [0.6, 0.3, 0.3], { kit });
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 2.2, 5), kit.rubber(), [0.42, 1.3, 0.15], { kit, rot: [0.1, 0, 0.12] });
  const jaw = new THREE.Object3D();
  jaw.position.set(0.25, 2.4, 0.08);
  g.add(jaw);
  return { group: g, parts: { jaw }, focus: [0.3, 1.6, 0], radius: 0.8 };
};

/** A skiff frozen into a slab of ice. */
B.iceboat = (kit) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(3.6, 0.5, 2.0), kit.ice(), [0, 0.25, 0], { kit, shadow: false });
  add(g, new THREE.BoxGeometry(2.6, 0.5, 0.9), kit.wood(), [0, 0.5, 0], { kit, rot: [0, 0, 0.08] });
  add(g, new THREE.ConeGeometry(0.45, 0.8, 4), kit.wood(), [1.6, 0.52, 0], { kit, rot: [0, Math.PI / 4, -Math.PI / 2] });
  add(g, new THREE.BoxGeometry(3.6, 0.04, 2.0), kit.frost(), [0, 0.51, 0], { kit, shadow: false });
  return { group: g, parts: {}, focus: [0, 0.5, 0], radius: 2.0 };
};

/** A radiation counter on a tripod, its needle twitching. */
B.monitor = (kit) => {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = i * (Math.PI * 2 / 3);
    add(g, new THREE.CylinderGeometry(0.02, 0.02, 1.1, 5), kit.darkSteel(), [Math.cos(a) * 0.25, 0.52, Math.sin(a) * 0.25], { kit, rot: [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25] });
  }
  add(g, new THREE.BoxGeometry(0.4, 0.28, 0.2), kit.paint(0xb89a3a), [0, 1.15, 0], { kit });
  add(g, new THREE.CircleGeometry(0.1, 16), kit.salt(), [0, 1.17, 0.101], { kit, shadow: false });
  const needle = new THREE.Group();
  needle.position.set(0, 1.12, 0.105);
  needle.userData.noMerge = true;
  part(add(needle, new THREE.BoxGeometry(0.008, 0.09, 0.004), kit.rubber(), [0, 0.04, 0], { kit }));
  g.add(needle);
  const lamp = part(add(g, new THREE.SphereGeometry(0.025, 8, 6), kit.lit(0xd04a2a), [0.15, 1.25, 0.1], { kit }));
  return { group: g, parts: { needle, lamp }, focus: [0, 1.1, 0], radius: 0.4 };
};

/** A rack of sample jars. opts: colors */
B.jars = (kit, { colors = [0x5d8db0, 0x6aa07c, 0xc8c2a0] } = {}) => {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(1.3, 0.9, 0.5), kit.wood(), [0, 0.45, 0], { kit });
  colors.forEach((c, i) => {
    const x = (i - (colors.length - 1) / 2) * 0.36;
    add(g, new THREE.CylinderGeometry(0.11, 0.11, 0.3, 12), kit.glass(), [x, 1.05, 0], { kit, shadow: false });
    add(g, new THREE.CylinderGeometry(0.1, 0.1, 0.22, 12), kit.liquid(c), [x, 1.01, 0], { kit });
  });
  return { group: g, parts: {}, focus: [0, 1.0, 0], radius: 0.8 };
};

/** A slab of tar-black swamp oil seeping from a cut pipe. */
B.tar = (kit) => {
  const p = B.pond(kit, { r: 1.3, liquid: 0x141210 });
  const g = p.group;
  add(g, new THREE.CylinderGeometry(0.14, 0.14, 1.8, 10), kit.rust(), [-1.6, 0.25, 0], { kit, rot: [0, 0, Math.PI / 2 - 0.2] });
  return { ...p, focus: [0, 0.2, 0], radius: 2.4 };
};

/**
 * Marks on the ground along a path: boot prints, a spill of salt, a drag of tar. `points` are [x, z] in the
 * world; `ground(x, z)` is the terrain height. Returned as one group in world space.
 */
export function buildTrail(kit, points, ground, { kind = 'prints' } = {}) {
  const g = new THREE.Group();
  g.name = 'mystery-trail';
  const material = kind === 'tar' ? kit.liquid(0x141210) : kind === 'salt' ? kit.salt() : kit.paint(0x2a2622);
  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i];
    const [nx, nz] = points[Math.min(points.length - 1, i + 1)];
    const yaw = Math.atan2(nx - x, nz - z);
    const side = kind === 'prints' ? (i % 2 ? 0.13 : -0.13) : 0;
    const px = x + Math.cos(yaw) * side, pz = z - Math.sin(yaw) * side;
    const geo = kind === 'prints' ? new THREE.CircleGeometry(0.09, 8) : new THREE.CircleGeometry(kind === 'tar' ? 0.32 : 0.22, 10);
    const m = new THREE.Mesh(kit.own(geo), material);
    m.rotation.set(-Math.PI / 2, 0, yaw);
    if (kind === 'prints') m.scale.set(1, 2.4, 1);
    else m.scale.set(1, 1.6 + (i % 3) * 0.3, 1);
    m.position.set(px, ground(px, pz) + 0.015, pz);
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

export const PROP_KINDS = Object.freeze(Object.keys(B));

/** Build a prop of `kind`. Throws on an unknown kind (the checks catch it first). */
export function buildProp(kit, kind, opts = {}) {
  const make = B[kind];
  if (!make) throw new Error(`no problem prop "${kind}"`);
  const p = make(kit, opts);
  p.group.name = `mystery-prop:${kind}`;
  return p;
}
