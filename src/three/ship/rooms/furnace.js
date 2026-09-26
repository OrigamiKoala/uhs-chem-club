/**
 * ship/rooms/furnace.js — The engine room.
 *
 * The id is still 'furnace' because the deck plan and the verifiers know it
 * by that name; what stands in it now is the ship's reactor. It is the one
 * thing in the room at full height: an armoured drum on a striped plinth,
 * banded, ribbed, capped with a dome and coupled to the deckhead, with a
 * gallery round its face and the only fire aboard showing through a slot
 * behind bars. Coolant goes back into the stern plating through flanged
 * pipes; power goes forward along the deckhead to the motivator, a banded
 * drum lying in its cradles against the starboard hull.
 *
 * The room is a transverse slot less than three metres deep and it is
 * entered in the middle, so the reactor stands to port and the motivator to
 * starboard, and the middle of the deck is kept for the watch: the control
 * console on the stern plating, a watch station and the coolant valves on the
 * forward bulkhead. Every gap between two colliders is either wide enough to
 * walk into or closed — the old room passed the centre check with half its
 * deck sealed behind a slag bin, and this one is measured cell by cell.
 *
 * The gallery is decoration above head height; the deck stays flat.
 */

import * as THREE from "three";
import { boltLine, boltRing, placard, pipeFlange, pipeRun, dialGauge } from "../../materials/pbr-kit.js";
import {
  dressRoomShell, box, cyl, cylGeo, extrude, chamferedRect, chamferedHole, lamp
} from "../kit.js";

/* ---------------------------------------------------------------- parts */

const ALL = ['tl', 'tr', 'bl', 'br'];
const _geo = new Map();
const kf = v => Math.round(v * 1000);

/**
 * A box with the edges that run along `axis` cut off by `c`: 'y' chamfers the
 * uprights of a crate, 'z' the rim of a face plate, 'x' the length of a rail.
 */
function chamferGeo(w, h, d, c, axis) {
  const key = `${axis}${kf(w)}_${kf(h)}_${kf(d)}_${kf(c)}`;
  let g = _geo.get(key);
  if (g) return g;
  const o = { bevelEnabled: false, curveSegments: 1 };
  if (axis === 'y') {
    g = new THREE.ExtrudeGeometry(chamferedRect(w, d, c, ALL), { ...o, depth: h });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -h / 2, 0);
  } else if (axis === 'z') {
    g = new THREE.ExtrudeGeometry(chamferedRect(w, h, c, ALL), { ...o, depth: d });
    g.translate(0, 0, -d / 2);
  } else {
    g = new THREE.ExtrudeGeometry(chamferedRect(d, h, c, ALL), { ...o, depth: w });
    g.rotateY(Math.PI / 2);
    g.translate(-w / 2, 0, 0);
  }
  _geo.set(key, g);
  return g;
}

function cbox(parent, mat, w, h, d, x, y, z, c = 0.02, axis = 'y', rx = 0, ry = 0, rz = 0) {
  const lim = axis === 'y' ? Math.min(w, d) : axis === 'z' ? Math.min(w, h) : Math.min(d, h);
  const m = new THREE.Mesh(chamferGeo(w, h, d, Math.min(c, lim * 0.45), axis), mat);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

const _up = new THREE.Vector3(0, 1, 0);
/** A cylinder from point a to point b. */
function rod(parent, mat, r, a, b, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A);
  const m = new THREE.Mesh(cylGeo(r, r, dir.length(), seg), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, dir.normalize());
  parent.add(m);
  return m;
}

/** A torus in the plane square to `axis`. */
function ring(parent, mat, R, t, x, y, z, axis = 'z', seg = 16) {
  const key = `t${kf(R)}_${kf(t)}_${seg}`;
  let g = _geo.get(key);
  if (!g) { g = new THREE.TorusGeometry(R, t, 6, seg); _geo.set(key, g); }
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  if (axis === 'y') m.rotation.x = Math.PI / 2;
  else if (axis === 'x') m.rotation.y = Math.PI / 2;
  parent.add(m);
  return m;
}

function ball(parent, mat, r, x, y, z) {
  const key = `s${kf(r)}`;
  let g = _geo.get(key);
  if (!g) { g = new THREE.SphereGeometry(r, 12, 8); _geo.set(key, g); }
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** A group standing at (x, 0, z) turned by ry: local +z is "out of the thing it is mounted on". */
function mount(parent, x, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

/** A handwheel facing +z: rim, spokes, hub. */
function handwheel(parent, M, r, x, y, z, mat = M.steelMat) {
  ring(parent, mat, r, r * 0.12, x, y, z, 'z', 18);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    rod(parent, mat, r * 0.06, [x, y, z], [x + Math.cos(a) * r, y + Math.sin(a) * r, z], 6);
  }
  cyl(parent, M.gunmetalMat, r * 0.22, r * 0.3, x, y, z, 'z', 10);
}

/** Hazard paint laid at a fixed size in the world, so a long stripe is not one stretched chevron. */
function stripeMat(ship) {
  if (!ship._worldStripeMat) {
    const t = ship.hazardTex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.78, metalness: 0.18 });
    m.userData.worldUV = 0.34;
    ship._worldStripeMat = m;
  }
  return ship._worldStripeMat;
}

/* ------------------------------------------------------------ the pieces */

/** An arc of annulus lying flat (a gallery floor), angles as in the x/−z plane. */
function arcDeck(inner, outer, start, len, thick) {
  const s = new THREE.Shape();
  s.absarc(0, 0, outer, start, start + len, false);
  s.absarc(0, 0, inner, start + len, start, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 24 });
  g.rotateX(-Math.PI / 2);
  return g;
}

/** A point on a circle of radius r at angle a, in the same convention as `arcDeck`. */
const onArc = (r, a) => [Math.cos(a) * r, -Math.sin(a) * r];

/**
 * THE REACTOR, built round its own axis at (cx, cz). The window faces `yaw`
 * (0 is +z), which is turned toward the doorway so the fire is the first
 * thing a player sees from the spine.
 */
function reactor(g, M, glow, S, cx, cz) {
  const R = new THREE.Group();
  R.position.set(cx, 0, cz);
  g.add(R);

  // Scorched deck, striped plinth, stepped base.
  cyl(R, M.ashMat, 1.12, 0.012, 0, 0.006, 0, 'y', 8).rotation.y = Math.PI / 8;
  cyl(R, S, 0.95, 0.12, 0, 0.06, 0, 'y', 8).rotation.y = Math.PI / 8;
  cyl(R, M.gunmetalMat, 0.9, 0.1, 0, 0.17, 0, 'y', 8).rotation.y = Math.PI / 8;
  cyl(R, M.ribMat, 0.8, 0.5, 0, 0.47, 0, 'y', 24);
  const br = boltRing(0.76, 16, M.steelMat, { size: 0.022 });
  br.position.y = 0.725;
  R.add(br);

  // The drum: plate, collars, ribs, and one seam of glow under the top collar.
  cyl(R, M.durasteelMat, 0.72, 2.5, 0, 1.97, 0, 'y', 28);
  for (const y of [0.8, 2.62, 3.18]) cyl(R, M.trimMat, 0.765, 0.08, 0, y, 0, 'y', 28);
  cyl(R, glow, 0.725, 0.03, 0, 2.72, 0, 'y', 28);
  const yaw = 0.6;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    let d = Math.abs(((a - yaw + Math.PI) % (Math.PI * 2)) - Math.PI);
    if (d < 0.5 || Math.abs(d - 0.8) < 0.3) continue;
    const r = box(R, M.ribMat, 0.08, 1.74, 0.06, Math.sin(a) * 0.745, 1.71, Math.cos(a) * 0.745);
    r.rotation.y = a;
  }

  // The fire window: a slot behind bars in a heavy chamfered frame.
  const Wn = new THREE.Group();
  Wn.rotation.y = yaw;
  R.add(Wn);
  const fr = chamferedRect(0.52, 1.54, 0.1, ALL, 0, 1.75);
  fr.holes.push(chamferedHole(0.34, 1.3, 0.08, ALL, 0, 1.75));
  extrude(Wn, M.gunmetalMat, fr, 0.14).position.z = 0.7;
  box(Wn, M.ventMat, 0.4, 1.36, 0.05, 0, 1.75, 0.7);
  const fire = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 1.32), glow);
  fire.position.set(0, 1.75, 0.735);
  Wn.add(fire);
  for (const x of [-0.1, 0.1]) box(Wn, M.gunmetalMat, 0.025, 1.3, 0.012, x, 1.75, 0.745);
  for (let i = 0; i < 6; i++) box(Wn, M.gunmetalMat, 0.38, 0.026, 0.026, 0, 1.2 + i * 0.22, 0.785);
  for (const x of [-0.22, 0.22]) {
    Wn.add(boltLine([x, 1.08, 0.842], [x, 2.42, 0.842], 7, M.steelMat, { size: 0.013 }));
  }
  const tag = placard('CORE 1 // DO NOT OPEN HOT', { w: 0.46, h: 0.07 });
  tag.position.set(0, 0.92, 0.79);
  Wn.add(tag);

  // An instrument cluster on the drum's flank, facing the console.
  const Ic = new THREE.Group();
  Ic.rotation.y = 1.45;
  R.add(Ic);
  cbox(Ic, M.gunmetalMat, 0.36, 0.56, 0.1, 0, 1.5, 0.77, 0.03, 'z');
  for (const [y, mat] of [[1.64, M.dialGaugePsiMat], [1.42, M.dialGaugeBarMat]]) {
    const d = dialGauge(0.08, mat, M.gunmetalMat);
    d.position.set(-0.05, y, 0.83);
    Ic.add(d);
  }
  lamp(Ic, M, 0.12, 1.66, 0.82, M.amberLampMat);
  lamp(Ic, M, 0.12, 1.6, 0.82, M.greenLampMat);
  lamp(Ic, M, 0.12, 1.54, 0.82, M.redLampMat);
  cyl(Ic, M.cableMat, 0.02, 0.5, 0.1, 1.03, 0.77, 'y', 6);

  // Dome, and the column that couples it to the deckhead.
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.gunmetalMat);
  dome.scale.y = 0.4;
  dome.position.y = 3.22;
  R.add(dome);
  cyl(R, M.ribMat, 0.3, 0.44, 0, 3.64, 0, 'y', 16);
  for (const y of [3.47, 3.82]) cyl(R, M.gunmetalMat, 0.36, 0.06, 0, y, 0, 'y', 16);
  const tb = boltRing(0.33, 10, M.steelMat, { size: 0.016 });
  tb.position.y = 3.505;
  R.add(tb);

  // Coolant: two high pipes over the back into the stern plating, two low ones straight in.
  for (const sx of [-0.3, 0.3]) {
    R.add(pipeRun([[sx, 3.3, -0.35], [sx, 3.52, -0.6], [sx, 3.6, -0.95], [sx, 3.6, -11.04 - cz]],
      sx < 0 ? M.liveryMat : M.steelMat, { radius: 0.085, bend: 0.4 }));
    const f = pipeFlange(0.085, M.gunmetalMat, M.steelMat);
    f.rotation.x = Math.PI / 2;
    f.position.set(sx, 3.6, -11.0 - cz + 0.03);
    R.add(f);
  }
  for (const [sx, y, r] of [[-0.35, 0.5, 0.1], [0.35, 1.3, 0.11]]) {
    const z0 = -0.5, z1 = -11.04 - cz;
    cyl(R, M.steelMat, r, z0 - z1, sx, y, (z0 + z1) / 2, 'z', 14);
    for (const z of [z1 + 0.05, (z0 + z1) / 2]) {
      const f = pipeFlange(r, M.gunmetalMat, M.steelMat);
      f.rotation.x = Math.PI / 2;
      f.position.set(sx, y, z);
      R.add(f);
    }
  }
  const vb = new THREE.Group();
  vb.position.set(0.35, 0, (-0.5 + (-11.04 - cz)) / 2 + 0.12);
  vb.rotation.y = Math.PI / 2;
  R.add(vb);
  cbox(vb, M.gunmetalMat, 0.2, 0.26, 0.22, 0, 1.3, 0.05, 0.03);
  handwheel(vb, M, 0.13, 0, 1.3, 0.22, M.gunmetalMat);

  // The gallery: a grated arc round the drum's face above head height,
  // rails, a toe board, struts under it and a ladder up the port side.
  const ts = Math.PI - 0.35, tl = Math.PI + 0.7, gy = 2.25;
  const deck = new THREE.Mesh(arcDeck(0.76, 1.12, ts, tl, 0.04), M.grateMat);
  deck.position.y = gy;
  R.add(deck);
  const toe = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.1, 24, 1, true, ts + Math.PI / 2, tl), M.gunmetalMat);
  toe.position.y = gy + 0.09;
  R.add(toe);
  for (const y of [gy + 0.52, gy + 1.0]) {
    const tg = new THREE.TorusGeometry(1.1, 0.02, 6, 28, tl);
    tg.rotateZ(ts);
    tg.rotateX(-Math.PI / 2);
    const rail = new THREE.Mesh(tg, M.steelMat);
    rail.position.y = y;
    R.add(rail);
  }
  const posts = 9;
  for (let i = 0; i <= posts; i++) {
    const a = ts + (i / posts) * tl;
    const [x, z] = onArc(1.1, a);
    cyl(R, M.gunmetalMat, 0.022, 1.0, x, gy + 0.5, z, 'y', 6);
    const [ix, iz] = onArc(0.73, a);
    const [ox, oz] = onArc(1.0, a);
    rod(R, M.gunmetalMat, 0.022, [ix, gy - 0.4, iz], [ox, gy - 0.01, oz], 6);
  }
  for (const dz of [-0.18, 0.18]) cyl(R, M.steelMat, 0.02, 3.0, -0.93, 1.72, dz, 'y', 6);
  for (let y = 0.5; y < 3.1; y += 0.28) cyl(R, M.steelMat, 0.014, 0.36, -0.93, y, 0, 'z', 6);
}

/** A tall stores locker, facing +z from the wall at z = 0. */
function locker(g, M, doorMat) {
  cbox(g, M.gunmetalMat, 0.47, 2.05, 0.42, 0, 1.025, 0.22, 0.02);
  box(g, doorMat, 0.42, 1.9, 0.015, 0, 1.03, 0.435);
  for (const y of [0.7, 1.4]) box(g, M.panelDarkMat, 0.36, 0.05, 0.012, 0, y, 0.447);
  for (const y0 of [0.14, 1.72]) {
    for (let i = 0; i < 5; i++) box(g, M.ventMat, 0.28, 0.012, 0.005, 0, y0 + i * 0.03, 0.445);
  }
  for (const y of [0.3, 1.03, 1.76]) cyl(g, M.gunmetalMat, 0.014, 0.1, -0.205, y, 0.44, 'y', 6);
  box(g, M.steelMat, 0.03, 0.2, 0.02, 0.16, 1.05, 0.452);
  cyl(g, M.steelMat, 0.016, 0.012, 0.16, 1.2, 0.445, 'z', 8);
}

/* ================================================================ BUILD */

export function buildFurnaceRoom(ship) {
  const M = ship;
  const S = stripeMat(ship);

  dressRoomShell(ship, 'furnace', {
    keepClear: [
      { side: 'S', from: -4.35, to: -2.05, top: 4.0 },   // coolant into the stern plating
      { side: 'S', from: -1.5, to: 1.85 },                // the control console
      { side: 'W', from: -11.0, to: -9.15 },              // stores lockers
      { side: 'E', from: -11.0, to: -9.0 },               // the motivator's coupling
      { side: 'N', from: -3.95, to: -2.05 },              // coolant board
      { side: 'N', from: 1.95, to: 3.95 },                // motivator watch
      { side: 'N', from: 3.95, to: 5.6, top: 4.0 }        // coolant return, floor to deckhead
    ],
    fill: { panels: 3, vent: 1.4, conduit: 2.4, machinery: 1.6, light: 0.6 },
    ribSpacing: 1.0,
    chamferStrip: true,
    seed: 41
  });

  const g = new THREE.Group();
  g.name = 'furnace';

  // The one warm fire aboard, on its own material so it can breathe.
  const glow = new THREE.MeshBasicMaterial({ color: 0xe0762a });

  /* ---------------- THE REACTOR, port ---------------- */
  const cx = -3.2, cz = -9.8;
  reactor(g, M, glow, S, cx, cz);
  ship.addCollider(-4.2, -2.2, -10.84, -8.8);

  // Hoist rail over it, trolley parked outboard over the stores.
  const hz = -9.2;
  box(g, M.gunmetalMat, 3.2, 0.025, 0.15, -3.4, 3.59, hz);
  box(g, S, 3.2, 0.12, 0.022, -3.4, 3.665, hz);
  box(g, M.gunmetalMat, 3.2, 0.025, 0.15, -3.4, 3.74, hz);
  for (const x of [-4.96, -1.84]) cbox(g, M.gunmetalMat, 0.08, 0.14, 0.17, x, 3.54, hz, 0.015);
  for (const x of [-4.8, -3.3, -2.0]) {
    box(g, M.gunmetalMat, 0.12, 0.02, 0.18, x, 3.76, hz);
    cyl(g, M.steelMat, 0.012, 0.22, x, 3.87, hz, 'y', 6);
    box(g, M.gunmetalMat, 0.16, 0.015, 0.16, x, 3.975, hz);
  }
  const tx = -4.5;
  for (const s of [-1, 1]) box(g, M.gunmetalMat, 0.24, 0.15, 0.02, tx, 3.6, hz + s * 0.095);
  cbox(g, M.liveryMat, 0.28, 0.22, 0.2, tx, 3.4, hz, 0.03, 'x');
  cyl(g, M.gunmetalMat, 0.09, 0.07, tx - 0.16, 3.4, hz, 'x', 12);
  cyl(g, M.steelMat, 0.012, 0.9, tx, 2.84, hz, 'y', 6);
  cbox(g, M.gunmetalMat, 0.1, 0.13, 0.08, tx, 2.34, hz, 0.015);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 12, Math.PI * 1.4), M.steelMat);
  hook.position.set(tx, 2.24, hz);
  hook.rotation.z = Math.PI * 0.8;
  g.add(hook);

  /* ---------------- STORES LOCKERS, port plating ---------------- */
  [-10.55, -10.05, -9.55].forEach((z, i) => {
    locker(mount(g, -5.6, z, Math.PI / 2), M, i === 1 ? M.liveryMat : M.panelMat);
  });
  ship.addCollider(-5.44, -5.1, -10.84, -9.25);

  /* ---------------- COOLANT BOARD, forward bulkhead, port ---------------- */
  const Nb = mount(g, -3.0, -7.91, Math.PI);
  box(Nb, M.panelDarkMat, 1.84, 1.12, 0.02, 0, 1.55, 0.022);
  cbox(Nb, M.gunmetalMat, 1.8, 1.0, 0.07, 0, 1.55, 0.055, 0.04, 'z');
  box(Nb, M.panelMat, 1.7, 0.9, 0.01, 0, 1.55, 0.093);
  [-0.6, -0.2, 0.2, 0.6].forEach((x, i) => {
    const d = dialGauge(0.1, i % 2 ? M.dialGaugeBarMat : M.dialGaugePsiMat, M.gunmetalMat);
    d.position.set(x, 1.74, 0.11);
    Nb.add(d);
    lamp(Nb, M, x, 1.5, 0.098, i === 3 ? M.redLampMat : M.greenLampMat);
  });
  for (let i = 0; i < 10; i++) {
    const x = -0.72 + i * 0.16;
    box(Nb, M.gunmetalMat, 0.03, 0.03, 0.012, x, 1.3, 0.1);
    box(Nb, M.steelMat, 0.012, 0.038, 0.012, x, 1.31, 0.114, -0.45);
  }
  box(Nb, M.trimMat, 1.5, 0.012, 0.03, 0, 1.26, 0.115);
  cyl(Nb, M.liveryMat, 0.05, 1.84, 0, 0.5, 0.06, 'x', 12);
  for (const x of [-0.5, 0.5]) {
    cbox(Nb, M.gunmetalMat, 0.14, 0.16, 0.1, x, 0.5, 0.06, 0.02);
    handwheel(Nb, M, 0.09, x, 0.5, 0.12, M.gunmetalMat);
  }
  cyl(Nb, M.cableMat, 0.02, 0.4, -0.8, 2.25, 0.04, 'y', 6);
  ship.addCollider(-3.95, -2.05, -8.03, -7.91);

  /* ---------------- CONTROL CONSOLE, stern plating ---------------- */
  // Local +z is into the room (world +z); local x is world x.
  const C = mount(g, -0.1, -11.0, 0);
  const W = 2.4;
  box(C, M.gunmetalMat, W, 0.08, 0.56, 0, 0.04, 0.3);
  box(C, M.cableMat, W - 0.1, 0.07, 0.03, 0, 0.045, 0.585);
  cbox(C, M.panelDarkMat, W, 0.8, 0.5, 0, 0.48, 0.3, 0.03, 'x');
  for (const x of [-0.8, 0, 0.8]) {
    box(C, M.panelMat, 0.7, 0.55, 0.012, x, 0.46, 0.556);
    for (const y of [0.21, 0.71]) C.add(boltLine([x - 0.3, y, 0.564], [x + 0.3, y, 0.564], 4, M.steelMat, { size: 0.01 }));
    box(C, M.steelMat, 0.12, 0.02, 0.02, x, 0.62, 0.572);
  }
  for (let i = 0; i < 6; i++) box(C, M.ventMat, 0.4, 0.012, 0.005, 0, 0.34 + i * 0.03, 0.564);
  // Desk: switch panel, throttle quadrant, palm rail.
  const D = new THREE.Group();
  D.position.set(0, 0.92, 0.6);
  D.rotation.x = 0.2;
  C.add(D);
  cbox(D, M.trimMat, W + 0.04, 0.05, 0.36, 0, 0, 0, 0.02, 'x');
  box(D, M.controlPanelMat, 1.4, 0.01, 0.26, -0.35, 0.03, 0);
  cbox(D, M.gunmetalMat, 0.3, 0.08, 0.24, 0.85, 0.06, -0.02, 0.02);
  for (const x of [0.76, 0.85, 0.94]) {
    rod(D, M.steelMat, 0.012, [x, 0.1, 0.02], [x, 0.24, 0.08], 6);
    cyl(D, x === 0.85 ? M.redLampMat : M.cableMat, 0.022, 0.04, x, 0.245, 0.085, 'x', 8);
  }
  cyl(D, M.steelMat, 0.014, W - 0.2, 0, 0.04, 0.2, 'x', 8);
  // Instrument face: the reactor screen in its bezel, two gauge clusters, toggles.
  const F = new THREE.Group();
  F.position.set(0, 1.35, 0.32);
  F.rotation.x = -0.3;
  C.add(F);
  cbox(F, M.gunmetalMat, W, 0.8, 0.12, 0, 0, 0, 0.04, 'z');
  box(F, M.panelDarkMat, W - 0.12, 0.7, 0.01, 0, 0, 0.062);
  box(F, M.crtReactorMat, 0.5, 0.34, 0.006, 0, 0.06, 0.066);
  for (const sy of [-1, 1]) box(F, M.trimMat, 0.62, 0.05, 0.04, 0, 0.06 + sy * 0.195, 0.08);
  for (const sx of [-1, 1]) box(F, M.trimMat, 0.05, 0.44, 0.04, sx * 0.285, 0.06, 0.08);
  box(F, M.gunmetalMat, 0.64, 0.02, 0.1, 0, 0.29, 0.12);
  for (const sx of [-1, 1]) {
    [[0.75, 0.16, M.dialGaugePsiMat], [0.52, 0.16, M.dialGaugePsiMat], [0.635, -0.08, M.dialGaugeBarMat]].forEach(([x, y, mat]) => {
      const d = dialGauge(0.075, mat, M.gunmetalMat);
      d.position.set(sx * x, y, 0.08);
      F.add(d);
    });
    lamp(F, M, sx * 1.0, 0.25, 0.066, sx < 0 ? M.amberLampMat : M.greenLampMat);
    lamp(F, M, sx * 1.0, 0.18, 0.066, M.amberLampMat);
  }
  for (let i = 0; i < 8; i++) {
    const x = -0.35 + i * 0.1;
    box(F, M.gunmetalMat, 0.03, 0.03, 0.012, x, -0.25, 0.07);
    box(F, i === 3 ? M.redLampMat : M.steelMat, 0.012, 0.04, 0.012, x, -0.24, 0.084, -0.45);
  }
  box(F, M.trimMat, 0.8, 0.012, 0.03, 0, -0.29, 0.085);
  cbox(C, M.gunmetalMat, W + 0.04, 0.04, 0.24, 0, 1.76, 0.2, 0.015, 'x');
  for (const x of [-0.9, -0.84, -0.78]) cyl(C, M.cableMat, 0.02, 0.66, x, 2.11, 0.06, 'y', 6);
  const cTag = placard('REACTOR CONTROL // ENG 1', { w: 0.6, h: 0.08 });
  cTag.position.set(0.3, 1.9, 0.02);
  C.add(cTag);
  // The bypass valve at its port end.
  cyl(C, M.steelMat, 0.05, 2.4, -1.28, 1.2, 0.15, 'y', 12);
  cyl(C, M.steelMat, 0.05, 0.15, -1.28, 2.38, 0.075, 'z', 12);
  cbox(C, M.gunmetalMat, 0.14, 0.2, 0.14, -1.28, 1.05, 0.15, 0.03);
  handwheel(C, M, 0.11, -1.28, 1.05, 0.28, M.gunmetalMat);
  // Power distribution cabinet at its starboard end: two big breakers.
  const px = 1.575;
  cbox(C, M.gunmetalMat, 0.62, 1.9, 0.45, px, 0.95, 0.235, 0.025);
  box(C, M.panelMat, 0.54, 1.5, 0.012, px, 0.9, 0.465);
  box(C, S, 0.54, 0.08, 0.01, px, 1.78, 0.465);
  for (const dx of [-0.13, 0.13]) {
    cbox(C, M.gunmetalMat, 0.12, 0.3, 0.06, px + dx, 1.25, 0.49, 0.01);
    rod(C, M.steelMat, 0.014, [px + dx, 1.2, 0.52], [px + dx, 1.42, 0.62], 6);
    cyl(C, M.cableMat, 0.024, 0.12, px + dx, 1.43, 0.63, 'x', 8);
  }
  lamp(C, M, px + 0.2, 1.6, 0.47, M.redLampMat);
  lamp(C, M, px + 0.2, 1.54, 0.47, M.greenLampMat);
  cyl(C, M.gunmetalMat, 0.05, 0.5, px, 2.15, 0.12, 'y', 10);
  ship.addCollider(-1.45, 1.95, -10.84, -10.2);

  /* ---------------- THE MOTIVATOR, starboard ---------------- */
  const my = 1.15, mz = -10.05;
  for (const x of [2.55, 4.15]) {
    box(g, M.gunmetalMat, 0.26, 0.1, 1.4, x, 0.05, mz);
    cbox(g, M.gunmetalMat, 0.22, 0.45, 0.3, x, 0.32, mz, 0.03);
    for (const s of [-1, 1]) cbox(g, M.gunmetalMat, 0.22, 0.62, 0.26, x, 0.41, mz + s * 0.47, 0.03);
    ring(g, M.gunmetalMat, 0.625, 0.03, x, my, mz, 'x', 28);
    g.add(boltLine([x - 0.1, 0.11, mz - 0.6], [x - 0.1, 0.11, mz + 0.6], 5, M.steelMat, { size: 0.014 }));
  }
  cyl(g, M.durasteelMat, 0.6, 2.2, 3.35, my, mz, 'x', 28);
  for (const x of [2.95, 3.35, 3.75]) ring(g, M.steelMat, 0.64, 0.045, x, my, mz, 'x', 28);
  for (const x of [3.15, 3.55]) cyl(g, M.gunmetalMat, 0.615, 0.1, x, my, mz, 'x', 28);
  // West end: a bell, a bolted end plate, a handwheel on the access plug.
  cyl(g, M.gunmetalMat, 0.46, 0.2, 2.15, my, mz, 'x', 24, 0.6);
  cyl(g, M.ribMat, 0.46, 0.04, 2.04, my, mz, 'x', 24);
  const eb = boltRing(0.4, 12, M.steelMat, { size: 0.02, axis: 'x' });
  eb.position.set(2.015, my, mz);
  g.add(eb);
  const plug = mount(g, 2.02, mz, -Math.PI / 2);
  cyl(plug, M.gunmetalMat, 0.2, 0.04, 0, my - 0.05, 0.02, 'z', 16);
  handwheel(plug, M, 0.14, 0, my - 0.05, 0.08, M.gunmetalMat);
  cyl(plug, M.amberLampMat, 0.03, 0.01, 0, my + 0.3, 0.005, 'z', 10);
  // East end: flange, reducer and the conduit into the plating.
  cyl(g, M.ribMat, 0.68, 0.1, 4.5, my, mz, 'x', 28);
  const fb = boltRing(0.64, 16, M.steelMat, { size: 0.02, axis: 'x' });
  fb.position.set(4.555, my, mz);
  g.add(fb);
  cyl(g, M.gunmetalMat, 0.6, 0.3, 4.7, my, mz, 'x', 24, 0.32);
  cyl(g, M.gunmetalMat, 0.3, 0.77, 5.235, my, mz, 'x', 20);
  cyl(g, M.ribMat, 0.42, 0.06, 5.56, my, mz, 'x', 20);
  for (const x of [5.05, 5.35]) ring(g, M.trimMat, 0.31, 0.025, x, my, mz, 'x', 20);
  // A bolted service strip along its crown.
  cbox(g, M.gunmetalMat, 1.2, 0.06, 0.3, 3.35, my + 0.6, mz, 0.02, 'x');
  for (const s of [-1, 1]) g.add(boltLine([2.8, my + 0.635, mz + s * 0.12], [3.9, my + 0.635, mz + s * 0.12], 8, M.steelMat, { size: 0.011 }));
  const mt = placard('MOTIVATOR 2', { w: 0.2, h: 0.06 });
  mt.position.set(4.15, 0.45, mz + 0.601);
  g.add(mt);
  ship.addCollider(1.95, 5.44, -10.84, -9.3);

  /* ---------------- POWER, forward along the deckhead ---------------- */
  const pz = -9.95, py = 3.62;
  cyl(g, M.liveryMat, 0.085, 3.8 - -3.05, (3.8 + -3.05) / 2, py, pz, 'x', 12);
  cbox(g, M.gunmetalMat, 0.26, 0.22, 0.26, 3.8, py, pz, 0.03);
  cyl(g, M.liveryMat, 0.085, py - 1.72, 3.8, (py + 1.72) / 2, pz, 'y', 12);
  cyl(g, M.gunmetalMat, 0.12, 0.06, 3.8, 1.77, pz, 'y', 12);
  const tz = -10.25;
  box(g, M.gunmetalMat, 5.7, 0.02, 0.2, 0.25, 3.5, tz);
  for (const s of [-1, 1]) box(g, M.gunmetalMat, 5.7, 0.08, 0.015, 0.25, 3.54, tz + s * 0.1);
  for (const dz of [-0.04, 0.04]) cyl(g, M.cableMat, 0.03, 5.7, 0.25, 3.54, tz + dz, 'x', 8);
  cyl(g, M.cableMat, 0.035, 1.8, 2.9, 2.62, tz, 'y', 8);
  for (const x of [-2.0, -0.65, 0.65, 2.0, 3.3]) {
    box(g, M.gunmetalMat, 0.05, 0.3, 0.04, x, 3.84, pz);
    box(g, M.gunmetalMat, 0.05, 0.02, 0.22, x, py + 0.09, pz);
    cyl(g, M.steelMat, 0.01, 0.46, x, 3.74, tz, 'y', 6);
    box(g, M.gunmetalMat, 0.16, 0.015, 0.4, x, 3.975, (pz + tz) / 2);
  }

  /* ---------------- MOTIVATOR WATCH, forward bulkhead, starboard ---------------- */
  const Nc = mount(g, 2.92, -7.91, Math.PI);
  box(Nc, M.gunmetalMat, 1.8, 0.08, 0.4, 0, 0.04, 0.22);
  cbox(Nc, M.panelDarkMat, 1.8, 0.8, 0.42, 0, 0.48, 0.23, 0.03, 'x');
  for (const x of [-0.45, 0.45]) {
    box(Nc, M.panelMat, 0.8, 0.55, 0.012, x, 0.46, 0.446);
    box(Nc, M.steelMat, 0.12, 0.02, 0.02, x, 0.62, 0.46);
  }
  const Dn = new THREE.Group();
  Dn.position.set(0, 0.9, 0.47);
  Dn.rotation.x = 0.22;
  Nc.add(Dn);
  cbox(Dn, M.trimMat, 1.86, 0.045, 0.3, 0, 0, 0, 0.02, 'x');
  box(Dn, M.controlPanelMat, 0.8, 0.01, 0.22, -0.4, 0.028, 0);
  cyl(Dn, M.steelMat, 0.014, 1.6, 0, 0.035, 0.16, 'x', 8);
  const Fn = new THREE.Group();
  Fn.position.set(0, 1.35, 0.2);
  Fn.rotation.x = -0.2;
  Nc.add(Fn);
  cbox(Fn, M.gunmetalMat, 1.8, 0.8, 0.1, 0, 0, 0, 0.04, 'z');
  box(Fn, M.panelDarkMat, 1.68, 0.7, 0.01, 0, 0, 0.052);
  box(Fn, M.crtReactorMat, 0.44, 0.3, 0.006, 0.4, 0.05, 0.056);
  for (const sy of [-1, 1]) box(Fn, M.trimMat, 0.54, 0.05, 0.04, 0.4, 0.05 + sy * 0.175, 0.07);
  for (const sx of [-1, 1]) box(Fn, M.trimMat, 0.05, 0.4, 0.04, 0.4 + sx * 0.245, 0.05, 0.07);
  [-0.7, -0.45, -0.2].forEach((x, i) => {
    const d = dialGauge(0.075, i === 1 ? M.dialGaugeBarMat : M.dialGaugePsiMat, M.gunmetalMat);
    d.position.set(x, 0.14, 0.07);
    Fn.add(d);
    lamp(Fn, M, x, -0.06, 0.056, i === 2 ? M.amberLampMat : M.greenLampMat);
  });
  for (let i = 0; i < 6; i++) {
    const x = -0.72 + i * 0.1;
    box(Fn, M.gunmetalMat, 0.03, 0.03, 0.012, x, -0.22, 0.06);
    box(Fn, M.steelMat, 0.012, 0.04, 0.012, x, -0.21, 0.074, -0.45);
  }
  cbox(Nc, M.gunmetalMat, 1.84, 0.04, 0.2, 0, 1.75, 0.13, 0.015, 'x');
  for (const x of [0.7, 0.76]) cyl(Nc, M.cableMat, 0.018, 0.66, x, 2.1, 0.05, 'y', 6);
  ship.addCollider(1.95, 3.95, -8.55, -7.91);

  /* ---------------- COOLANT RETURN, forward bulkhead, starboard corner ---------------- */
  const Nv = mount(g, 4.7, -7.91, Math.PI);
  for (const [sx, mat, vy] of [[-0.3, M.steelMat, 1.1], [0.3, M.liveryMat, 1.4]]) {
    cyl(Nv, mat, 0.1, 3.98, sx, 1.99, 0.18, 'y', 14);
    for (const y of [0.03, 3.95]) {
      const f = pipeFlange(0.1, M.gunmetalMat, M.steelMat);
      f.position.set(sx, y, 0.18);
      Nv.add(f);
    }
    for (const y of [0.7, 2.0, 3.2]) box(Nv, M.gunmetalMat, 0.08, 0.06, 0.1, sx, y, 0.05);
    cbox(Nv, M.gunmetalMat, 0.26, 0.3, 0.26, sx, vy, 0.18, 0.04);
    cyl(Nv, M.steelMat, 0.016, 0.14, sx, vy, 0.36, 'z', 6);
    handwheel(Nv, M, 0.14, sx, vy, 0.42, M.gunmetalMat);
  }
  cyl(Nv, M.steelMat, 0.06, 0.6, 0, 2.3, 0.18, 'x', 12);
  const vg = dialGauge(0.08, M.dialGaugePsiMat, M.gunmetalMat);
  vg.position.set(0, 2.3, 0.26);
  Nv.add(vg);
  const vt = placard('COOLANT RETURN // LOOP B', { w: 0.46, h: 0.08 });
  vt.position.set(0, 2.8, 0.02);
  Nv.add(vt);
  ship.addCollider(3.95, 5.44, -8.35, -7.91);

  /* ---------------- DECK ---------------- */
  box(g, S, 2.9, 0.006, 0.08, 3.5, 0.003, -9.26);
  box(g, S, 0.08, 0.006, 1.2, -1.95, 0.003, -9.9);

  ship.group.add(g);
  ship.bake(g);

  ship.addLight('engine-reactor', [-2.55, 1.8, -8.75], 0xe0762a, 4.0, 12);
  const fireLight = ship.lightSources[ship.lightSources.length - 1];
  ship.addLight('engine-overhead', [0.4, 3.4, -9.3], 0xffd9a0, 2.6, 10);
  ship.addLight('engine-motivator', [3.3, 2.4, -8.95], 0xffc070, 1.8, 7);

  // The fire never quite holds still: two slow beats and a faster one.
  const base = new THREE.Color(0xe0762a);
  ship.animatedElements.push({
    update(delta, time) {
      const f = 0.86 + 0.07 * Math.sin(time * 1.7) + 0.05 * Math.sin(time * 6.3 + 1.3) + 0.03 * Math.sin(time * 13.1);
      glow.color.copy(base).multiplyScalar(f);
      fireLight.intensity = 4.0 * f;
    }
  });
}
