/**
 * pairboard3d.js — The pair board, built as an instrument.
 *
 * `PairBoard` in three dimensions for Ligar at T4, a subclass of the drawn board
 * through `plateBench3D`. The slate with its atoms, lamps and tray is the SAME
 * `draw`, painted on the raked screen behind the well, and a tap on a slot, an
 * atom or a tray chip resolves through the same hit list the canvas uses.
 *
 * What is built is what lies on the plate with it: the tray, with one capsule in
 * it for every pair the board still holds. The capsules are the tray count made
 * a thing you can see go down as the pairs go out, and a loose electron (an odd
 * tray) is a small bead beside them.
 */

import * as THREE from 'three';
import { PairBoard } from './pairboard.js';
import { plateBench3D, ownedMaterial, ownedGeometry } from './plates3d.js';
import { MOLECULES, planLewis } from './lewis.js';

const MAX_CAPSULES = 24;

export class PairBoard3D extends plateBench3D(PairBoard, { backdrop: 'lab', frameTwo: 2.6 }) {
  buildHardware(station) {
    const rec = { geos: [], mats: [] };
    const c = station.content;
    const dark = ownedMaterial(rec, { color: 0x2f2b27, roughness: 0.7, metalness: 0.6 });
    const tray = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.4, 0.02, 0.1)), dark);
    tray.position.set(0, 0.01, 0.17);
    c.add(tray);

    const capGeo = ownedGeometry(rec, new THREE.CapsuleGeometry(0.0085, 0.022, 4, 8));
    const capMat = ownedMaterial(rec, { color: 0xb8afa0, roughness: 0.45, metalness: 0.6 });
    rec.capsules = [];
    for (let k = 0; k < MAX_CAPSULES; k++) {
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.rotation.z = Math.PI / 2;
      const col = k % 12; const row = Math.floor(k / 12);
      cap.position.set(-0.17 + col * 0.031, 0.034, 0.145 + row * 0.04);
      c.add(cap);
      rec.capsules.push(cap);
    }
    rec.bead = new THREE.Mesh(ownedGeometry(rec, new THREE.SphereGeometry(0.009, 10, 8)), capMat);
    rec.bead.position.set(0.19, 0.034, 0.185);
    c.add(rec.bead);
    return rec;
  }

  poseHardware(rec) {
    if (!rec.capsules) return;
    const it = rec.item;
    const left = planLewis(MOLECULES[it.mol], it.placed, it.charge).left;
    rec.capsules.forEach((cap, k) => { cap.visible = k < Math.floor(left / 2); });
    rec.bead.visible = left % 2 === 1;
  }
}
