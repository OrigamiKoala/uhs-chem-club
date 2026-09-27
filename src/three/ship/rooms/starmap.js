/**
 * ship/rooms/starmap.js — The navigation table, on the starboard side of the
 * bridge.
 *
 * A PROJECTOR TABLE IS A MACHINE WITH A PICTURE OVER IT. The picture is the
 * light; the table is forty years of steel: an octagonal plinth bolted to the
 * deck, a faceted body flaring out to a heavy top with access plates on every
 * face, a raised rim you can lean on with instrument insets let into it and
 * handholds at the quarters, an emitter array sunk in a grilled well, and the
 * hoses that feed it running out into the deck.
 *
 * The orrery floats over the well; the data plate hangs above the orrery and
 * is turned to face the navigator's standing spot, so its lettering reads the
 * right way round from where the player arrives. Both sit under one group
 * that the ship shows and hides as the star map projection.
 */

import * as THREE from "three";
import { boltRing } from "../../materials/pbr-kit.js";
import { createHoloMaterial } from "../../materials/holo.js";
import { createQuestHoloTexture } from "../../materials/textures.js";
import { aimBoxFromBounds } from "../../aim-target.js";
import { box, cyl, tube, extrude } from "../kit.js";
import {
  bowFittings, facePlate, screenBezel, toggleBank, knob, keypad, grabHandle
} from "./bridge.js";

/** The table's centre on the deck, and where the navigator stands. */
const TABLE = [3.5, 2.2];
const STAND = [1.9, 1.6];

/** A regular octagon with flats square to the axes, as 2D points. */
function octagon(apothem) {
  const r = apothem / Math.cos(Math.PI / 8);
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  return pts;
}

/**
 * An octagonal cylinder with its flats square to the axes. Built with the
 * start angle rather than by turning the mesh, so its bounding box is the
 * octagon's and not a turned square round it.
 */
function octo(parent, mat, apTop, apBot, h, y) {
  const k = 1 / Math.cos(Math.PI / 8);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(apTop * k, apBot * k, h, 8, 1, false, Math.PI / 8), mat);
  m.position.y = y;
  parent.add(m);
  return m;
}

export function buildStarmapRoom(ship) {
  const M = ship;
  const g = new THREE.Group();
  g.name = 'star-map';
  g.position.set(TABLE[0], 0, TABLE[1]);
  bowFittings(ship).add(g);

  // Plinth, kick recess and the bolts that hold it down.
  octo(g, M.gunmetalMat, 0.62, 0.66, 0.1, 0.05);
  const bolts = boltRing(0.58, 16, M.steelMat, { size: 0.014 });
  bolts.position.y = 0.102;
  g.add(bolts);
  octo(g, M.ventMat, 0.58, 0.58, 0.08, 0.14);

  // The faceted body, flaring out to the top.
  const yb = 0.18, yt = 0.76, apB = 0.62, apT = 0.8;
  octo(g, M.panelDarkMat, apT, apB, yt - yb, (yb + yt) / 2);
  const slope = (apT - apB) / (yt - yb);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const s = Math.sin(a), c = Math.cos(a);
    const ym = (yb + yt) / 2, ap = (apB + apT) / 2;
    const f = facePlate(g, [s * ap, ym, c * ap], [c, 0, -s], [s * slope, 1, c * slope]);
    box(f, i % 2 ? M.panelMat : M.trimMat, 0.4, 0.4, 0.012, 0, 0, 0.006);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) cyl(f, M.steelMat, 0.01, 0.01, sx * 0.17, sy * 0.17, 0.016, 'z', 6);
    if (i % 2) {
      for (let k = 0; k < 5; k++) box(f, M.ventMat, 0.26, 0.016, 0.006, 0, -0.1 + k * 0.05, 0.015);
    } else {
      box(f, M.gunmetalMat, 0.16, 0.05, 0.02, 0, 0.1, 0.02);
      box(f, M.liveryMat, 0.3, 0.03, 0.004, 0, -0.14, 0.014);
    }
  }

  // The top: a chamfered deck, then the raised rim round the well.
  octo(g, M.trimMat, 0.92, 0.84, 0.1, 0.81);
  const rimShape = new THREE.Shape(octagon(0.94));
  rimShape.holes.push(new THREE.Path(octagon(0.76).reverse()));
  const rim = extrude(g, M.gunmetalMat, rimShape, 0.07);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.86;
  const stripe = new THREE.Mesh(new THREE.RingGeometry(0.905, 0.93, 8, 1, Math.PI / 8), M.liveryMat);
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.y = 0.931;
  g.add(stripe);

  // Instrument insets on the rim, flat, reading from outside the table.
  // The navigator arrives from the aft-port side, so the screens face them.
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const s = Math.sin(a), c = Math.cos(a);
    const f = facePlate(g, [s * 0.85, 0.93, c * 0.85], [c, 0, -s], [-s, 0, -c]);
    if (i === 5 || i === 6) {
      screenBezel(f, M, i === 5 ? M.crtAmberMat : M.crtGreenMat, 0.2, 0.09, 0, 0, 0, { lip: false });
      for (const x of [-0.22, 0.22]) knob(f, M, x, 0, 0, 0.018);
    } else if (i === 4 || i === 7) {
      keypad(f, M, -0.1, 0, 0, 4, 2);
      toggleBank(f, M, 4, 0.14, 0, 0, { lamps: false });
    } else {
      toggleBank(f, M, 6, 0, 0, 0);
    }
  }

  // Handholds at the quarters, on the rim's outer face.
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const h = new THREE.Group();
    h.rotation.y = a;
    g.add(h);
    grabHandle(facePlate(h, [0, 0.895, 0.94], [1, 0, 0], [0, 1, 0]), M, 0, 0, 0, 0.3);
  }

  // The emitter well: a grilled floor, the main lens and a ring of eight.
  octo(g, M.ventMat, 0.76, 0.76, 0.02, 0.87);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    box(g, M.trimMat, 0.014, 0.014, 0.5, Math.sin(a) * 0.46, 0.886, Math.cos(a) * 0.46, 0, a, 0);
  }
  cyl(g, M.gunmetalMat, 0.25, 0.03, 0, 0.895, 0, 'y', 20);
  cyl(g, M.brassMat, 0.19, 0.06, 0, 0.92, 0, 'y', 20);
  cyl(g, M.gunmetalMat, 0.15, 0.012, 0, 0.952, 0, 'y', 20);
  cyl(g, M.amberLampMat, 0.12, 0.01, 0, 0.955, 0, 'y', 20);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.sin(a) * 0.55, z = Math.cos(a) * 0.55;
    cyl(g, M.brassMat, 0.055, 0.05, x, 0.905, z, 'y', 10);
    cyl(g, M.amberLampMat, 0.035, 0.008, x, 0.932, z, 'y', 10);
  }

  // Feeds: armoured hoses out of the plinth and down into deck glands.
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const h = new THREE.Group();
    h.rotation.y = a;
    g.add(h);
    cyl(h, M.gunmetalMat, 0.055, 0.08, 0, 0.3, 0.62, 'z', 10);
    tube(h, M.cableMat, [[0, 0.3, 0.64], [0, 0.22, 0.78], [0, 0.05, 0.88], [0, 0.0, 0.92]], 0.035, 8);
    box(h, M.gunmetalMat, 0.13, 0.04, 0.13, 0, 0.02, 0.93);
  }

  /* ------------------------------------------------ THE PROJECTION */
  const holoProjector = new THREE.Group();
  holoProjector.position.set(0, 1.3, 0);
  holoProjector.scale.setScalar(0.85);

  const wireSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 16, 12),
    createHoloMaterial({ color: 0xffaa22, opacity: 0.32, wireframe: true })
  );
  holoProjector.add(wireSphere);
  holoProjector.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  ));

  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa22, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
  const orbitConfigs = [
    { rad: 0.22, color: 0xcc8833, size: 0.026, inclX: 0.15, inclY: 0.1, speed: 0.5 },
    { rad: 0.36, color: 0xddaa55, size: 0.042, inclX: -0.22, inclY: 0.35, speed: 0.35, hasRings: true },
    { rad: 0.48, color: 0x995533, size: 0.032, inclX: 0.28, inclY: -0.15, speed: 0.22 },
    { rad: 0.62, color: 0xb89a70, size: 0.024, inclX: -0.1, inclY: 0.45, speed: 0.16 }
  ];
  for (const cfg of orbitConfigs) {
    const orbitRing = new THREE.Mesh(new THREE.RingGeometry(cfg.rad - 0.005, cfg.rad + 0.005, 32), ringMat);
    orbitRing.rotation.x = Math.PI / 2 + cfg.inclX;
    orbitRing.rotation.y = cfg.inclY;
    const planet = new THREE.Mesh(new THREE.SphereGeometry(cfg.size, 12, 12), new THREE.MeshBasicMaterial({ color: cfg.color }));
    planet.position.set(cfg.rad, 0, 0);
    if (cfg.hasRings) {
      const pRings = new THREE.Mesh(
        new THREE.RingGeometry(cfg.size * 1.4, cfg.size * 2.2, 16),
        new THREE.MeshBasicMaterial({ color: 0xcca877, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
      );
      pRings.rotation.x = Math.PI / 2 + 0.3;
      planet.add(pRings);
    }
    orbitRing.add(planet);
    holoProjector.add(orbitRing);
    ship.animatedElements.push({ obj: orbitRing, speed: cfg.speed });
  }

  // A faint throw of light from the lens up to the orrery.
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.13, 0.36, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xe0a048, transparent: true, opacity: 0.05,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
    })
  );
  cone.position.y = 0.96 + 0.18;

  const PLATE_Y = 2.25;
  const qTex = createQuestHoloTexture(0, 20, '');
  ship.starmapHoloMat = new THREE.MeshBasicMaterial({
    map: qTex, transparent: true, opacity: 0.94, side: THREE.DoubleSide
  });
  const holoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), ship.starmapHoloMat);
  holoPlane.position.set(0, PLATE_Y, 0);
  ship.animatedElements.push({ obj: holoPlane, speed: 0.05, isHover: true, baseY: PLATE_Y });

  const starmapHoloGroup = new THREE.Group();
  starmapHoloGroup.userData.noMerge = true;
  // The plate is a flat plane whose text reads from its +z face; turn that
  // face to the navigator's spot. Drawn facing the bow it showed its BACK to
  // anybody standing at the table — mirrored text.
  starmapHoloGroup.rotation.y = Math.atan2(STAND[0] - TABLE[0], STAND[1] - TABLE[1]);
  starmapHoloGroup.add(holoProjector, cone, holoPlane);
  ship.starmapHoloGroup = starmapHoloGroup;
  ship.starmapHoloProjector = holoProjector;
  ship.starmapHoloPlane = holoPlane;
  g.add(starmapHoloGroup);

  ship.addCollider(TABLE[0] - 1.0, TABLE[0] + 1.0, TABLE[1] - 1.0, TABLE[1] + 1.0);
  // The slot between the table and the nav bank is closed at its forward end
  // by the comms console, so it is filled rather than left as a dead end.
  ship.addCollider(TABLE[0] + 1.0, 5.15, TABLE[1] - 1.2, TABLE[1] + 1.0);
  ship.addLight('starmap-holo', [TABLE[0], 1.4, TABLE[1]], 0xffb050, 1.6, 4.5);
  ship.interactiveTerminals.push({
    id: 'starmap', name: 'STAR MAP', pos: [STAND[0], 1.55, STAND[1]], route: '#/starmap',
    prompt: 'ACCESS STAR MAP & NAVIGATION',
    // The table, its rim and the projection standing over it.
    aim: [aimBoxFromBounds(TABLE[0] - 1.0, TABLE[0] + 1.0, 0, 2.7, TABLE[1] - 1.0, TABLE[1] + 1.0)]
  });
}
