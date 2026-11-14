/**
 * thornmere/stations.js — The six hosts: a room on each working mound, each with its Learn bench built in.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the front (toward the player and the door), +x to the
 * player's right. The room's centre is `ROOM.cz` in front of the plate and its inside radius is `ROOM.r`, so there is air on both sides of
 * the lean-in camera and behind the player. Nothing stands in the bay envelope (`bayBoxes()`): machinery is behind the plate (z < -2.2),
 * to the sides (|x| > 2.9) and above 4.8 m.
 *
 * A ROOM IS A PIECE OF THE FOREST, and no two are alike:
 *   1 tapped stump    a standing hollow stump, bark all round, its broken crown for a roof; pitch tapped from the wood into pails
 *   2 tar still       a stump cut level and roofed with plate; a retort and condenser in its back wall, a stack through the roof
 *   3 mirror vault    under the arched roots of a standing tree; three sides of root, the fourth open; a tall mirror behind the plate
 *   4 wood-acid pit   a floor dished into the mound under a deck of timbers on piles; a kiln and two receivers
 *   5 fallen trunk    a hollow trunk on its side, walked into through its broken end; two feed tanks and a mixing vessel
 *   6 plate works     between two stumps under one leaning armour plate; a press, and plates racked on edge for walls
 *
 * ONLY LAMPS ARE LIT. A room's lamps are `lampMark`s pooled by the world; nothing here owns a light. Every room is inside one of the
 * world's cover boxes (`coverBoxes()`), so the sun and sky do not light it.
 *
 * @returns {{ group, bench, benchLocal, colliders }}
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { HOST_PLAN, ROOM } from './site-plan.js';

const LAMP = 0xe8a440;
const UP = new THREE.Vector3(0, 1, 0);
const CZ = ROOM.cz;

/* ----------------------------------------------------------------- the bench */

function buildTmBench(ctx, { plate, skin }) {
  const M = ctx.M;
  return buildBayBench(ctx, {
    skin, plate,
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.catwalk },
    tagStyle: { fg: '#1a1e24', bg: '#cfd4dc' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (geo, mat, x, y, z, rot = null) => { const m = new THREE.Mesh(ctx.own(geo), mat); m.position.set(x, y, z); if (rot) m.rotation.set(...rot); dormant.add(m); return m; };
      // The cased instrument: a model kit's case and a rack of sample jars.
      const housing = add(new THREE.BoxGeometry(1.1, 0.5, 0.42), M.case, -0.4, height + 0.3, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      add(new THREE.BoxGeometry(0.9, 0.04, 0.3), M.caseDark, -0.4, height + 0.57, -0.2);
      [0.5, 0.72, 0.94].forEach((x, i) => {
        add(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), M.glass, x, y0 + 0.1, 0.1);
        add(new THREE.CylinderGeometry(0.05, 0.05, 0.11, 12), [M.amber, M.pitch, M.brass][i], x, y0 + 0.065, 0.1);
      });
    }
  });
}

/* --------------------------------------------------------------- the parts kit */

function kitFor(w) {
  const own = (...o) => w.own(...o);
  const { M, t4 } = w;
  const place = (m, [x, y, z], rot, shadow) => {
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    if (shadow) m.castShadow = m.receiveShadow = t4;
    return m;
  };
  const add = (g, geo, mat, p, rot = null, shadow = true) => { const m = place(new THREE.Mesh(own(geo), mat), p, rot, shadow); g.add(m); return m; };
  const box = (g, s, mat, p, rot = null, shadow = true) => add(g, new THREE.BoxGeometry(...s), mat, p, rot, shadow);
  const cyl = (g, [rt, rb, h, seg = 14], mat, p, rot = null, shadow = true) => add(g, new THREE.CylinderGeometry(rt, rb, h, seg), mat, p, rot, shadow);
  const strut = (g, a, b, r, mat, seg = 8) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), seg)), mat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
    m.castShadow = m.receiveShadow = t4;
    g.add(m);
    return m;
  };
  const pipe = (g, pts, r, mat) => {
    for (let i = 0; i < pts.length - 1; i++) strut(g, pts[i], pts[i + 1], r, mat, 10);
    for (let i = 1; i < pts.length - 1; i++) add(g, new THREE.SphereGeometry(r * 1.02, 10, 8), mat, pts[i], null, false);
  };
  const lamp = (g, x, y, z, { intensity = 9, distance = 14 } = {}) => {
    const mark = new THREE.Object3D();
    mark.position.set(x, y, z);
    mark.userData.lamp = { color: LAMP, intensity, distance, decay: 1.7 };
    g.add(mark);
    w.lamps.push(mark);
    box(g, [0.34, 0.12, 0.2], M.lantern, [x, y + 0.1, z], null, false);
    strut(g, [x, y + 0.16, z], [x, y + 0.7, z], 0.02, M.darkSteel, 5);
  };
  return { add, box, cyl, strut, pipe, lamp, own };
}

/** Where slab `i` of `n` stands round the room's centre, and the way it faces. Slab 0 is behind the plate; the door is opposite. */
const ringAt = (i, n, r) => { const a = Math.PI + (i / n) * Math.PI * 2; return { a, x: Math.sin(a) * r, z: CZ + Math.cos(a) * r }; };
/** Is slab `i` in the doorway (centred on +z)? `open` is the number of slabs left out. */
const inDoor = (i, n, open) => { const k = (i + n / 2) % n; return Math.min(k, n - k) < open / 2; };

/**
 * A wall of `n` pieces round the room, with a doorway toward +z. `make(i, at)` builds one piece; each piece gets two colliders so the
 * chain has no gap. Returns the colliders.
 */
function ring(n, r, open, make, pad = 0) {
  const colliders = [];
  const half = (Math.PI * r) / n;
  for (let i = 0; i < n; i++) {
    if (inDoor(i, n, open)) continue;
    const at = ringAt(i, n, r);
    make(i, at);
    for (const s of [-0.5, 0.5]) colliders.push({ lx: at.x + Math.cos(at.a) * half * s, lz: at.z - Math.sin(at.a) * half * s, r: Math.max(0.62, half * 0.62) + pad });
  }
  return colliders;
}

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const g = new THREE.Group();
  g.name = name;
  const bench = buildTmBench(w.ctx, { plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  return { k, M: w.M, g, bench, colliders: [{ lx: 0, lz: 0, hw: 2.4, hd: 0.65 }] };
}
const finish = h => ({ group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders });

/** A deterministic unevenness for piece `i`: 0 to 1. */
const jag = (i, s = 1) => { const v = Math.sin(i * 12.9898 * s + 4.1) * 43758.5453; return v - Math.floor(v); };

/* ------------------------------------------------------------------------ 1: the tapped stump */

export function buildTappedStump(w) {
  const h = start(w, 'site-1', 'tapped-stump');
  const { k, M, g } = h;
  const R = ROOM.r + 0.55; const N = 28;
  // Bark ribs all round, uneven in height like a broken stump; the crown closes it overhead.
  h.colliders.push(...ring(N, R, 2, (i, at) => {
    const tall = 6.2 + jag(i) * 2.6;
    const thick = 1.0 + jag(i, 3) * 0.5;
    k.box(g, [(2 * Math.PI * R) / N + 0.12, tall, thick], i % 2 ? M.bark : M.barkDark, [at.x, tall / 2 - 0.3, at.z], [0, at.a, 0]);
  }));
  k.cyl(g, [1.2, R + 0.9, 3.6, 18], M.barkDark, [0, 7.4, CZ]);
  // The door's lintel: a slab of bark across the gap.
  k.box(g, [4.6, 1.6, 1.1], M.bark, [0, 5.6, CZ + R]);
  // Tapping: three spouts in the back wall run pitch into pails on a timber shelf; a settling tank beside them.
  const zb = CZ - R + 0.9;
  k.box(g, [5.4, 0.12, 0.9], M.timber, [0, 0.9, zb + 0.5]);
  for (const x of [-2.2, 2.2]) k.box(g, [0.14, 0.9, 0.8], M.timber, [x, 0.45, zb + 0.5]);
  [-1.6, 0, 1.6].forEach(x => {
    k.pipe(g, [[x, 2.2, zb - 0.3], [x, 2.0, zb + 0.3], [x, 1.5, zb + 0.5]], 0.07, M.brass);
    k.cyl(g, [0.26, 0.2, 0.42, 14], M.rusted, [x, 1.17, zb + 0.5]);
    k.cyl(g, [0.22, 0.22, 0.03, 14], M.pitch, [x, 1.36, zb + 0.5], null, false);
  });
  k.cyl(g, [0.9, 0.9, 2.4, 18], M.steel, [-5.0, 1.2, zb + 1.2]);
  k.cyl(g, [0.96, 0.96, 0.1, 18], M.darkSteel, [-5.0, 2.45, zb + 1.2], null, false);
  k.pipe(g, [[-5.0, 2.5, zb + 1.2], [-5.0, 3.0, zb + 1.2], [-1.6, 3.0, zb - 0.2], [-1.6, 2.2, zb - 0.3]], 0.05, M.darkSteel);
  h.colliders.push({ lx: 0, lz: zb + 0.5, hw: 2.8, hd: 0.5 }, { lx: -5.0, lz: zb + 1.2, r: 1.0 });
  k.lamp(g, 2.4, 4.9, 1.6);
  k.lamp(g, 0, 4.6, CZ + R - 1.2, { intensity: 6, distance: 12 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 2: the tar still */

export function buildTarStill(w) {
  const h = start(w, 'site-2', 'tar-still');
  const { k, M, g } = h;
  const R = ROOM.r + 0.5; const N = 28;
  // A stump cut level: every stave the same height, banded with iron, and a plate roof riveted over it.
  h.colliders.push(...ring(N, R, 2, (i, at) => {
    k.box(g, [(2 * Math.PI * R) / N + 0.1, 5.6, 0.9], i % 3 ? M.bark : M.barkDark, [at.x, 2.5, at.z], [0, at.a, 0]);
    // Iron bands, a length on each stave.
    for (const y of [1.2, 4.6]) k.box(g, [(2 * Math.PI * (R + 0.5)) / N + 0.06, 0.16, 0.08], M.darkSteel, [at.x + Math.sin(at.a) * 0.5, y, at.z + Math.cos(at.a) * 0.5], [0, at.a, 0], false);
  }));
  k.cyl(g, [R + 1.0, R + 1.0, 0.28, 32], M.steel, [0, 5.42, CZ]);
  k.box(g, [4.4, 0.5, 1.0], M.darkSteel, [0, 5.05, CZ + R]);
  // The still: a retort on saddles over a firebox, its vapour pipe rising to a condenser coil, and a stack through the roof.
  const zb = CZ - R + 2.2;
  k.box(g, [3.4, 0.9, 1.8], M.concrete, [-2.2, 0.45, zb]);
  k.cyl(g, [1.0, 1.0, 3.2, 20], M.rusted, [-2.2, 1.9, zb], [0, 0, Math.PI / 2]);
  for (const x of [-3.4, -1.0]) k.box(g, [0.22, 0.5, 1.6], M.darkSteel, [x, 1.0, zb]);
  k.pipe(g, [[-0.6, 1.9, zb], [0.6, 1.9, zb], [1.4, 3.4, zb], [2.9, 3.4, zb]], 0.11, M.copper);
  for (let i = 0; i < 5; i++) k.add(g, new THREE.TorusGeometry(0.55, 0.06, 8, 20), M.copper, [3.4, 3.3 - i * 0.45, zb], [Math.PI / 2, 0, 0], false);
  k.cyl(g, [0.75, 0.75, 2.6, 18], M.glassDark, [3.4, 2.4, zb]);
  k.cyl(g, [0.5, 0.5, 0.8, 16], M.steel, [3.4, 0.5, zb]);
  k.cyl(g, [0.3, 0.36, 5.6, 14], M.darkSteel, [-4.6, 5.0, zb - 0.2]);
  k.cyl(g, [0.42, 0.3, 0.3, 14], M.rusted, [-4.6, 7.9, zb - 0.2]);
  h.colliders.push({ lx: -2.2, lz: zb, hw: 1.9, hd: 1.0 }, { lx: 1.1, lz: zb, hw: 1.5, hd: 0.5 }, { lx: 3.4, lz: zb, r: 0.9 }, { lx: -4.6, lz: zb - 0.2, r: 0.45 });
  k.lamp(g, -2.4, 4.7, 1.6);
  k.lamp(g, 3.2, 4.7, zb + 1.2, { intensity: 6, distance: 11 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 3: the mirror vault */

export function buildMirrorVault(w) {
  const h = start(w, 'site-3', 'mirror-vault');
  const { k, M, g } = h;
  const R = ROOM.r + 0.6; const N = 22;
  // Roots as thick as trunks come down from the tree overhead and stand in the ground; the front is open.
  h.colliders.push(...ring(N, R, 6, (i, at) => {
    const lean = 0.12 + jag(i) * 0.1;
    const rb = 1.25 + jag(i, 2) * 0.35;
    k.cyl(g, [rb * 0.55, rb, 6.8, 9], i % 2 ? M.root : M.bark, [at.x - Math.sin(at.a) * 0.5, 3.1, at.z - Math.cos(at.a) * 0.5], [-lean * Math.cos(at.a), 0, lean * Math.sin(at.a)]);
  }, 0.9));
  // The foot of the tree itself, spread over the roots as the roof, and its trunk going up out of sight.
  const roof = k.add(g, new THREE.SphereGeometry(1, 20, 12), M.barkDark, [0, 6.9, CZ]);
  roof.scale.set(R + 1.6, 1.9, R + 1.6);
  k.cyl(g, [3.2, 4.6, 16, 14], M.bark, [0, 16, CZ - 0.5]);
  // Behind the plate: a tall polished plate on a frame (a mirror), and a second, turned, beside it.
  const zb = CZ - R + 2.0;
  k.box(g, [3.0, 3.6, 0.08], M.mirror, [0, 2.3, zb], null, false);
  k.box(g, [3.3, 0.14, 0.2], M.darkSteel, [0, 4.17, zb]);
  k.box(g, [3.3, 0.14, 0.2], M.darkSteel, [0, 0.43, zb]);
  for (const x of [-1.6, 1.6]) k.box(g, [0.14, 4.1, 0.2], M.darkSteel, [x, 2.1, zb]);
  k.box(g, [1.8, 2.8, 0.08], M.mirror, [4.6, 1.9, zb + 1.0], [0, -0.7, 0], false);
  for (const s of [-1, 1]) k.box(g, [0.12, 3.2, 0.16], M.darkSteel, [4.6 + s * 0.72, 1.7, zb + 1.0 + s * 0.6]);
  h.colliders.push({ lx: 0, lz: zb, hw: 1.7, hd: 0.3 }, { lx: 4.6, lz: zb + 1.0, r: 1.1 });
  k.lamp(g, -2.4, 4.5, 1.6);
  k.lamp(g, 2.6, 4.5, 5.4, { intensity: 6, distance: 12 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 4: the wood-acid pit */

export function buildWoodAcidPit(w) {
  const h = start(w, 'site-4', 'wood-acid-pit');
  const { k, M, g } = h;
  const R = ROOM.r + 0.45; const N = 30;
  // The floor is dished into the mound. Piles driven round it hold back the pitch and carry a deck of timbers overhead.
  h.colliders.push(...ring(N, R, 2, (i, at) => {
    k.cyl(g, [0.72, 0.8, 6.4, 8], i % 2 ? M.timber : M.timberDark, [at.x, 2.9, at.z]);
  }));
  for (let i = -5; i <= 5; i++) k.box(g, [1.5, 0.34, 2 * Math.sqrt(Math.max(1, (R + 0.8) ** 2 - (i * 1.62) ** 2))], i % 2 ? M.timber : M.timberDark, [i * 1.62, 5.75, CZ]);
  for (const z of [-4.5, 0, 4.5]) k.box(g, [2 * (R + 0.4), 0.4, 0.4], M.timberDark, [0, 5.4, CZ + z]);
  // The kiln, where wood is baked without air; its vapour is cooled in a pipe that runs through a trough, and drips into two receivers.
  const zb = CZ - R + 2.4;
  const kiln = k.add(g, new THREE.SphereGeometry(1.7, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.brick, [-2.6, 0, zb]);
  kiln.scale.y = 1.25;
  k.box(g, [0.9, 0.9, 0.3], M.darkSteel, [-2.6, 0.5, zb + 1.62]);
  k.pipe(g, [[-2.6, 2.1, zb], [-2.6, 2.9, zb], [1.2, 2.9, zb], [1.2, 1.6, zb]], 0.1, M.copper);
  k.box(g, [3.2, 0.5, 0.8], M.timber, [1.4, 1.5, zb]);
  k.pipe(g, [[1.2, 1.6, zb], [3.4, 1.4, zb], [3.4, 1.0, zb + 0.5]], 0.07, M.copper);
  k.cyl(g, [0.42, 0.42, 0.9, 16], M.steel, [3.4, 0.45, zb + 0.6]);
  k.cyl(g, [0.42, 0.42, 0.9, 16], M.rusted, [4.6, 0.45, zb + 0.9]);
  h.colliders.push({ lx: -2.6, lz: zb, r: 1.8 }, { lx: 1.4, lz: zb, hw: 1.7, hd: 0.5 }, { lx: 3.9, lz: zb + 0.75, hw: 1.1, hd: 0.55 });
  k.lamp(g, 2.4, 4.6, 1.6);
  k.lamp(g, -2.2, 4.6, 6.0, { intensity: 6, distance: 12 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 5: the fallen trunk */

export function buildFallenTrunk(w) {
  const h = start(w, 'site-5', 'fallen-trunk');
  const { k, M, g } = h;
  const R = 7.4; const z0 = CZ - 8.4; const z1 = CZ + 9.0; const len = z1 - z0;
  // A hollow trunk lying along the mound: its shell arches overhead from one side of the floor to the other; the far end is whole.
  const shell = k.add(g, new THREE.CylinderGeometry(R, R * 1.06, len, 26, 1, true, -Math.PI / 2, Math.PI), M.barkShell, [0, 0, (z0 + z1) / 2], [-Math.PI / 2, 0, 0]);
  shell.userData.openShell = true;
  const outer = k.add(g, new THREE.CylinderGeometry(R + 0.8, R * 1.06 + 0.8, len, 26, 1, true, -Math.PI / 2, Math.PI), M.barkDark, [0, 0, (z0 + z1) / 2], [-Math.PI / 2, 0, 0]);
  outer.userData.openShell = true;
  // Its butt end, closed; the broken end is a ragged ring of shell with the way in through it.
  k.add(g, new THREE.CylinderGeometry(R * 1.06 + 0.8, R * 1.06 + 0.8, 0.9, 26, 1, false, -Math.PI / 2, Math.PI), M.barkDark, [0, 0, z0 - 0.4], [-Math.PI / 2, 0, 0]);
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI;
    const x = -Math.cos(a) * (R + 0.4); const y = Math.sin(a) * (R + 0.4);
    if (Math.abs(x) < 2.4 && y < 4.9) continue;
    k.box(g, [1.9, 1.9 + jag(i) * 1.6, 0.8], i % 2 ? M.bark : M.barkDark, [x, y - 0.3, z1 + 0.2], [0, 0, Math.PI / 2 - a]);
  }
  for (let z = z0; z <= z1 + 0.01; z += 1.25) for (const s of [-1, 1]) h.colliders.push({ lx: s * (R - 0.1), lz: z, r: 0.8 });
  for (let x = -R + 1; x <= R - 1; x += 1.25) h.colliders.push({ lx: x, lz: z0 + 0.2, r: 0.8 });
  for (const s of [-1, 1]) for (const x of [3.4, 4.6, 5.8, 7.0, 8.1]) h.colliders.push({ lx: s * x, lz: z1 + 0.2, r: 0.75 });
  // The mixing floor: two feed tanks, one pipe from each, into one vessel.
  const zb = CZ - 5.2;
  k.cyl(g, [0.9, 0.9, 2.6, 18], M.steel, [-3.4, 1.5, zb]);
  k.cyl(g, [0.9, 0.9, 2.6, 18], M.rusted, [3.4, 1.5, zb]);
  for (const x of [-3.4, 3.4]) { k.cyl(g, [0.96, 0.96, 0.4, 18], M.darkSteel, [x, 0.2, zb]); k.cyl(g, [0.5, 0.9, 0.5, 18], M.darkSteel, [x, 3.05, zb]); }
  k.cyl(g, [1.25, 1.0, 2.0, 20], M.copper, [0, 1.3, zb - 0.4]);
  k.cyl(g, [1.0, 1.0, 0.3, 20], M.darkSteel, [0, 0.15, zb - 0.4]);
  k.pipe(g, [[-3.4, 3.3, zb], [-3.4, 3.7, zb], [-0.5, 3.7, zb - 0.4], [-0.5, 2.3, zb - 0.4]], 0.08, M.darkSteel);
  k.pipe(g, [[3.4, 3.3, zb], [3.4, 3.7, zb], [0.5, 3.7, zb - 0.4], [0.5, 2.3, zb - 0.4]], 0.08, M.darkSteel);
  h.colliders.push({ lx: -3.4, lz: zb, r: 1.0 }, { lx: 3.4, lz: zb, r: 1.0 }, { lx: 0, lz: zb - 0.4, r: 1.3 });
  k.lamp(g, 2.4, 4.9, 1.6);
  k.lamp(g, -2.4, 4.9, 6.4, { intensity: 6, distance: 12 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 6: the plate works */

export function buildPlateWorks(w) {
  const h = start(w, 'site-6', 'plate-works');
  const { k, M, g } = h;
  const R = ROOM.r + 0.7;
  // Two stumps either side, and one cast plate of the fortress armour leaning across them for a roof.
  for (const s of [-1, 1]) {
    k.cyl(g, [2.3, 2.9, 6.2, 12], M.bark, [s * (R + 1.2), 3.0, CZ]);
    h.colliders.push({ lx: s * (R + 1.2), lz: CZ, r: 2.9 });
  }
  k.box(g, [2 * R + 6.4, 0.42, 2 * R + 2.4], M.armour, [0, 6.75, CZ], [0.075, 0, 0]);
  // Plates racked on edge make the walls: a rack down each side and one across the back, with the way in at the front.
  const rack = (x0, z0, x1, z1, n) => {
    const dx = (x1 - x0) / (n - 1); const dz = (z1 - z0) / (n - 1);
    const yaw = Math.atan2(dx, dz);
    for (let i = 0; i < n; i++) {
      const x = x0 + dx * i; const z = z0 + dz * i;
      k.box(g, [0.34, 5.4 + jag(i + n) * 0.6, 1.95], i % 3 ? M.armour : M.armourDark, [x, 2.75, z], [0, yaw + 0.12 * (jag(i) - 0.5), 0]);
      h.colliders.push({ lx: x, lz: z, r: 0.95 });
    }
    k.strut(g, [x0, 5.3, z0], [x1, 5.3, z1], 0.08, M.darkSteel, 6);
    k.strut(g, [x0, 0.5, z0], [x1, 0.5, z1], 0.08, M.darkSteel, 6);
  };
  rack(-R, CZ - R + 1.2, R, CZ - R + 1.2, 11);
  rack(-R, CZ - R + 2.8, -R, CZ - 3.6, 3);
  rack(R, CZ - R + 2.8, R, CZ - 3.6, 3);
  rack(-R, CZ + 3.6, -R, CZ + R - 0.6, 3);
  rack(R, CZ + 3.6, R, CZ + R - 0.6, 3);
  rack(-R + 1.6, CZ + R, -2.6, CZ + R, 3);
  rack(2.6, CZ + R, R - 1.6, CZ + R, 3);
  // The press: four columns, a fixed head, a platen and its ram, and a plate lying under it.
  const zb = CZ - R + 3.6;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(g, [0.16, 0.16, 4.4, 10], M.steel, [sx * 1.5 - 3.0, 2.2, zb + sz * 0.9]);
  k.box(g, [3.6, 0.6, 2.4], M.darkSteel, [-3.0, 4.5, zb]);
  k.box(g, [3.6, 0.5, 2.4], M.darkSteel, [-3.0, 0.25, zb]);
  k.cyl(g, [0.32, 0.32, 1.5, 14], M.steel, [-3.0, 3.5, zb]);
  k.box(g, [3.0, 0.3, 2.0], M.steel, [-3.0, 2.6, zb]);
  k.box(g, [2.8, 0.2, 1.8], M.armour, [-3.0, 0.6, zb]);
  k.cyl(g, [0.5, 0.5, 1.6, 14], M.rusted, [3.2, 0.8, zb]);
  k.pipe(g, [[3.2, 1.6, zb], [3.2, 4.9, zb], [-3.0, 4.9, zb]], 0.06, M.copper);
  h.colliders.push({ lx: -3.0, lz: zb, hw: 1.9, hd: 1.3 }, { lx: 3.2, lz: zb, r: 0.6 });
  k.lamp(g, -2.4, 4.9, 1.6);
  k.lamp(g, 2.4, 4.9, 6.2, { intensity: 6, distance: 12 });
  return finish(h);
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildTappedStump,
  'site-2': buildTarStill,
  'site-3': buildMirrorVault,
  'site-4': buildWoodAcidPit,
  'site-5': buildFallenTrunk,
  'site-6': buildPlateWorks
};
