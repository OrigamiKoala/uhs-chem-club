/**
 * ligar/stations.js — The five later benches of Ligar, each under its own roof.
 *
 * Benches one to four have structures of their own, built by hand in `ligar.js`
 * (a portal, a forge, a batch house, a scale house). Benches five to nine
 * are shaped by what they teach, and share a plan so that nine places do not
 * become nine different pieces of carpentry:
 *
 *   - a low apron of treadplate the bench stands on, so feet are level with the
 *     plate and the walk knows about it (`world.raised`),
 *   - an open-fronted steel shelter: four posts, a pitched sheet roof, a back
 *     wall and a work lamp,
 *   - the cased instrument on a bench across the back, facing the way in,
 *   - and ONE signature piece behind or beside it that says which bench this
 *     is without a word on it: three slate boards with a double
 *     bond in a different place on each, a hub with six arms on a mast, two
 *     charged plates on insulators, a torsion frame, a ladder of boxes.
 *
 * Every builder takes the world (its materials, `own`, `buildBench`
 * and the luminaire) and returns what the world needs to register the site:
 * the group, the bench, and the colliders in site-local terms.
 */

import * as THREE from 'three';
import { tierAtLeast } from '../tier.js';
import { boltRing } from '../materials/pbr-kit.js';

/** Shelter dimensions, metres: across the bench, and front to back. */
export const SHELTER = { W: 7.0, D: 5.2, H: 3.6 };

/** The apron the shelter stands on, a hand proud of the pavement. */
export const APRON = { hx: 4.4, hz: 3.4, y: 0.3 };

/* A rod from a to b, as a thin box turned along it. */
function rod(world, g, a, b, thick, mat) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(world.own(new THREE.BoxGeometry(thick, len, thick)), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  g.add(m);
  return m;
}

function ball(world, g, p, r, mat) {
  const m = new THREE.Mesh(world.own(new THREE.SphereGeometry(r, 14, 10)), mat);
  m.position.set(...p);
  g.add(m);
  return m;
}

/** The shelter every station shares. */
function buildShelter(world, g, apronY) {
  const { W, D, H } = SHELTER;
  const T4 = tierAtLeast('T4');

  const apron = new THREE.Mesh(
    world.own(new THREE.BoxGeometry(APRON.hx * 2, 0.6, APRON.hz * 2)), world.treadMat
  );
  apron.position.set(0, APRON.y - 0.3, 0);
  apron.receiveShadow = T4;
  g.add(apron);
  // The step up onto it, on the approach side, so a boot does not meet a kerb.
  const step = new THREE.Mesh(
    world.own(new THREE.BoxGeometry(3.2, 0.5, 0.6)), world.treadMat
  );
  step.position.set(0, APRON.y / 2 - 0.25, APRON.hz + 0.3);
  step.receiveShadow = T4;
  g.add(step);

  // Four posts on footplates, and a tie across the top of the back pair.
  for (const [px, pz] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) {
    const post = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.22, H, 0.22)), world.darkSteelMat);
    post.position.set(px, APRON.y + H / 2, pz);
    post.castShadow = T4;
    g.add(post);
    const foot = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.46, 0.08, 0.46)), world.plateMat);
    foot.position.set(px, APRON.y + 0.04, pz);
    g.add(foot);
  }
  const rise = 0.7;
  const rafterLen = Math.hypot(D, rise);
  const slope = Math.atan2(rise, D);
  // A mono-pitch roof falling to the front: the weather comes from behind.
  const roof = new THREE.Mesh(world.own(new THREE.BoxGeometry(W + 0.6, 0.07, rafterLen + 0.4)), world.plateMat);
  roof.position.set(0, APRON.y + H + rise / 2 - 0.04, 0);
  roof.rotation.x = slope;
  roof.castShadow = roof.receiveShadow = T4;
  g.add(roof);
  for (let i = 0; i < 8; i++) {
    const rib = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.06, 0.06, rafterLen + 0.4)), world.darkSteelMat);
    rib.position.set(-W / 2 + 0.3 + i * ((W - 0.6) / 7), APRON.y + H + rise / 2 - 0.12, 0);
    rib.rotation.x = slope;
    g.add(rib);
  }

  // The back wall, in corrugated sheet.
  const wall = new THREE.Mesh(world.own(new THREE.BoxGeometry(W, H - 0.2, 0.08)), world.plateMat);
  wall.position.set(0, APRON.y + (H - 0.2) / 2 + 0.1, -D / 2 + 0.04);
  wall.castShadow = wall.receiveShadow = T4;
  g.add(wall);
  const n = Math.round(W / 0.45);
  for (let i = 0; i < n; i++) {
    const ribW = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.05, H - 0.2, 0.05)), world.darkSteelMat);
    ribW.position.set(-W / 2 + (i + 0.5) * (W / n), APRON.y + (H - 0.2) / 2 + 0.1, -D / 2 + 0.1);
    g.add(ribW);
  }
  void apronY;
}

/* ------------------------------------------------------------------
   THE SIGNATURE PIECES
   ------------------------------------------------------------------ */

/** Bench five: three slate boards, each a drawing of nitrate with its double bond somewhere else. */
function signatureResonance(world, g) {
  const { D } = SHELTER;
  const slate = new THREE.MeshStandardMaterial({ color: 0x1c1b1e, roughness: 0.82, metalness: 0.05 });
  world.own(slate);
  const chalk = new THREE.MeshStandardMaterial({ color: 0xb8afa0, roughness: 0.9 });
  world.own(chalk);
  [-2.3, 0, 2.3].forEach((x, k) => {
    const board = new THREE.Group();
    board.position.set(x, 2.35, -D / 2 + 0.17);
    const slab = new THREE.Mesh(world.own(new THREE.BoxGeometry(1.5, 1.2, 0.05)), slate);
    board.add(slab);
    for (const [bx, by, bw, bh] of [[0, 0.62, 1.58, 0.05], [0, -0.62, 1.58, 0.05], [-0.77, 0, 0.05, 1.3], [0.77, 0, 0.05, 1.3]]) {
      const f = new THREE.Mesh(world.own(new THREE.BoxGeometry(bw, bh, 0.06)), world.darkSteelMat);
      f.position.set(bx, by, 0);
      board.add(f);
    }
    // A centre and three arms; the double bond is a second rod beside the arm at slot k.
    ball(world, board, [0, 0, 0.04], 0.07, chalk);
    [[0, 0.4], [-0.36, -0.22], [0.36, -0.22]].forEach(([ax, ay], i) => {
      rod(world, board, [0, 0, 0.04], [ax, ay, 0.04], 0.018, chalk);
      ball(world, board, [ax, ay, 0.04], 0.045, chalk);
      if (i === k) {
        const nx = -ay * 0.07 / Math.hypot(ax, ay); const ny = ax * 0.07 / Math.hypot(ax, ay);
        rod(world, board, [nx, ny, 0.04], [ax + nx, ay + ny, 0.04], 0.016, chalk);
      }
    });
    g.add(board);
  });
  return { colliders: [], radius: 5.4 };
}

/** Bench six: a hub on a mast with six arms along three axes. */
function signatureShape(world, g) {
  const { W, D } = SHELTER;
  const steel = world.pipeMat;
  const mast = new THREE.Mesh(world.own(new THREE.CylinderGeometry(0.1, 0.14, 1.6, 12)), world.darkSteelMat);
  mast.position.set(W / 2 + 1.5, APRON.y + 0.8, -D / 2 + 1.0);
  mast.castShadow = tierAtLeast('T4');
  g.add(mast);
  const base = new THREE.Mesh(world.own(new THREE.CylinderGeometry(0.5, 0.6, 0.18, 14)), world.plateMat);
  base.position.set(W / 2 + 1.5, APRON.y + 0.09, -D / 2 + 1.0);
  g.add(base);
  const hub = new THREE.Group();
  hub.position.set(W / 2 + 1.5, APRON.y + 2.35, -D / 2 + 1.0);
  ball(world, hub, [0, 0, 0], 0.2, world.darkSteelMat);
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    rod(world, hub, [dx * 0.2, dy * 0.2, dz * 0.2], [dx * 0.95, dy * 0.95, dz * 0.95], 0.05, steel);
    ball(world, hub, [dx * 1.05, dy * 1.05, dz * 1.05], 0.12, world.plateMat);
  }
  g.add(hub);
  return { colliders: [{ lx: W / 2 + 1.5, lz: -D / 2 + 1.0, r: 0.62 }], radius: 6.2 };
}

/** Bench seven: two charged plates standing on insulators either side of the shelter. */
function signaturePolarity(world, g) {
  const { W } = SHELTER;
  const porcelain = new THREE.MeshStandardMaterial({ color: 0x8a8272, roughness: 0.4, metalness: 0.0 });
  world.own(porcelain);
  const colliders = [];
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 + 1.5);
    const plate = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.1, 2.4, 1.8)), world.plateMat);
    plate.position.set(x, APRON.y + 1.9, -0.3);
    plate.castShadow = tierAtLeast('T4');
    g.add(plate);
    for (const sz of [-0.8, 0.2]) {
      const ins = new THREE.Mesh(world.own(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 10)), porcelain);
      ins.position.set(x, APRON.y + 0.38, -0.3 + sz + 0.1);
      g.add(ins);
      for (let k = 0; k < 3; k++) {
        const disc = new THREE.Mesh(world.own(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 10)), porcelain);
        disc.position.set(x, APRON.y + 0.18 + k * 0.15, -0.3 + sz + 0.1);
        g.add(disc);
      }
    }
    colliders.push({ lx: x, lz: -0.3, r: 1.0 });
    // The sign of the plate, stencilled as a bar: one bar for plus, a cross for minus is not needed.
    const mark = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.02, 0.5, 0.08)), world.darkSteelMat);
    mark.position.set(x - sx * 0.07, APRON.y + 2.9, -0.3);
    g.add(mark);
    if (sx < 0) {
      const mark2 = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.02, 0.08, 0.5)), world.darkSteelMat);
      mark2.position.set(x - sx * 0.07, APRON.y + 2.9, -0.3);
      g.add(mark2);
    }
  }
  return { colliders, radius: 6.6 };
}

/** Bench eight: a torsion frame, two posts joined by a rod with a hand wheel and a ring of pegs. */
function signatureHybrid(world, g) {
  const { D } = SHELTER;
  const y = APRON.y + 2.4;
  const z = -D / 2 + 0.7;
  for (const x of [-1.5, 1.5]) {
    const post = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.18, 2.7, 0.18)), world.darkSteelMat);
    post.position.set(x, APRON.y + 1.35, z);
    g.add(post);
    const block = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.3, 0.3, 0.3)), world.plateMat);
    block.position.set(x, y, z);
    g.add(block);
  }
  const shaft = new THREE.Mesh(world.own(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 10)), world.pipeMat);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(0, y, z);
  g.add(shaft);
  const wheel = new THREE.Mesh(world.own(new THREE.TorusGeometry(0.34, 0.03, 6, 20)), world.darkSteelMat);
  wheel.rotation.y = Math.PI / 2;
  wheel.position.set(-1.95, y, z);
  g.add(wheel);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const spoke = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.02, 0.68, 0.02)), world.darkSteelMat);
    spoke.position.set(-1.95, y, z);
    spoke.rotation.x = a;
    g.add(spoke);
  }
  // Three pegs round the far end, where the twist is read.
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    rod(world, g, [1.85, y, z], [2.0, y + Math.cos(a) * 0.3, z + Math.sin(a) * 0.3], 0.03, world.pipeMat);
    ball(world, g, [2.0, y + Math.cos(a) * 0.3, z + Math.sin(a) * 0.3], 0.06, world.plateMat);
  }
  return { colliders: [{ lx: -1.5, lz: z, r: 0.2 }, { lx: 1.5, lz: z, r: 0.2 }], radius: 5.6 };
}

/** Bench nine: a ladder of shelves carrying boxes, energy rising up it. */
function signatureOrbitals(world, g) {
  const { D } = SHELTER;
  const frame = new THREE.Mesh(world.own(new THREE.BoxGeometry(5.4, 0.08, 0.1)), world.darkSteelMat);
  void frame;
  const boxMat = world.darkSteelMat;
  const rows = [1, 1, 3, 1, 3, 1];
  rows.forEach((n, ri) => {
    const y = APRON.y + 1.2 + ri * 0.42;
    const shelf = new THREE.Mesh(world.own(new THREE.BoxGeometry(5.0, 0.04, 0.3)), world.pipeMat);
    shelf.position.set(0, y, -D / 2 + 0.3);
    g.add(shelf);
    for (const cx of [-2.0, 0, 2.0]) {
      const boxes = cx === 0 ? Math.min(n, 2) : n;
      for (let b = 0; b < boxes; b++) {
        const bx = cx + (b - (boxes - 1) / 2) * 0.34;
        const box = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.26, 0.22, 0.2)), boxMat);
        box.position.set(bx, y + 0.13, -D / 2 + 0.3);
        g.add(box);
      }
    }
  });
  for (const sx of [-2.6, 2.6]) {
    const stile = new THREE.Mesh(world.own(new THREE.BoxGeometry(0.08, 3.1, 0.08)), world.darkSteelMat);
    stile.position.set(sx, APRON.y + 2.6, -D / 2 + 0.3);
    g.add(stile);
  }
  return { colliders: [], radius: 5.4 };
}

const SIGNATURES = {
  resonance: signatureResonance,
  shape: signatureShape,
  polarity: signaturePolarity,
  hybrid: signatureHybrid,
  orbitals: signatureOrbitals
};

/** The bench kind (which instrument is cased up) each station carries. */
export const STATION_KIND = { 'q5-resonance': 'pair', 'q6-shape': 'rig', 'q7-polarity': 'rig', 'q8-hybrid': 'rig', 'q9-orbitals': 'rack' };
/** The signature piece each station carries. */
export const STATION_SIGN = { 'q5-resonance': 'resonance', 'q6-shape': 'shape', 'q7-polarity': 'polarity', 'q8-hybrid': 'hybrid', 'q9-orbitals': 'orbitals' };

/**
 * Build one station into a new group (not yet added to the scene).
 * @returns {{group: THREE.Group, bench: object, local: number[], colliders: object[], radius: number}}
 */
export function buildStation(world, site) {
  const g = new THREE.Group();
  g.name = site.id;
  const { W, D, H } = SHELTER;

  buildShelter(world, g);

  const kind = STATION_KIND[site.questId] || 'rig';
  const bench = world.buildBench({ kind, plate: `LB-${String(site.stage).padStart(2, '0')}` });
  const benchZ = -0.4;
  bench.group.position.set(0, APRON.y, benchZ);
  g.add(bench.group);

  const sig = (SIGNATURES[STATION_SIGN[site.questId]] || signatureShape)(world, g);

  // The work lamp under the roof, and the rail it hangs the front of the roof from.
  g.add(world.buildLuminaire(0, APRON.y + H - 0.35, 0.6));
  const rail = new THREE.Mesh(world.own(new THREE.BoxGeometry(W - 0.6, 0.06, 0.06)), world.darkSteelMat);
  rail.position.set(0, APRON.y + 3.2, D / 2 + 0.15);
  g.add(rail);
  void boltRing;

  const colliders = [
    ...[[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]].map(([lx, lz]) => ({ lx, lz, r: 0.25 })),
    ...sig.colliders
  ];
  return {
    group: g, bench, local: [0, APRON.y, benchZ], colliders,
    walls: [{ lx: 0, lz: -D / 2 + 0.04, hw: W / 2, hd: 0.12 }],
    radius: sig.radius
  };
}
