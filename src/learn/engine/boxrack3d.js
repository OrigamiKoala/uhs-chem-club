/**
 * boxrack3d.js — The box rack, built as an instrument.
 *
 * `BoxRack` in three dimensions for Lanternfall at T4, a subclass of the drawn
 * rack through `plateBench3D`. The board of boxes and the tray are the SAME
 * `draw`, painted on the raked screen standing on its easel behind the well, and
 * a tap on a box or a tray chip resolves through the same `hitTest` the canvas
 * rack uses (`screenUnderRay` hands the press back in the screen's own pixels).
 * So an arrangement placed on the bench is the arrangement the quest grades, and
 * a hint that names a row is true on both.
 *
 * What is built is what stands on the plate with it: a tray holding three
 * key-caps (Up, Down, Remove) of which the one in the hand sits raised, and the
 * horseshoe magnet the stages test samples with. When the quest asks the bench
 * for a measurement (`pull(id, unpaired)`), a pellet of the sample slides toward
 * the magnet if it is attracted and away from it, a little, if it is not — the
 * same figure the readout gives, shown as the thing it is.
 *
 * THE RACK STAYS A FLAT BOARD, NOT A SCENE OF LOOSE ARROWS. A box either holds
 * an arrow pointing up or one pointing down, and the player reads and counts
 * them, so they are drawn once, in one plane, at a countable size.
 */

import * as THREE from 'three';
import { BoxRack } from './boxrack.js';
import { plateBench3D, ownedMaterial, ownedGeometry } from './plates3d.js';

const CHIPS = ['u', 'd', 'x'];

export class BoxRack3D extends plateBench3D(BoxRack, { backdrop: 'lab', frameTwo: 2.6 }) {
  buildHardware(station, item) {
    const rec = { geos: [], mats: [] };
    const c = station.content;
    const steel = ownedMaterial(rec, { color: 0x55504a, roughness: 0.55, metalness: 0.75 });
    const dark = ownedMaterial(rec, { color: 0x2f2b27, roughness: 0.7, metalness: 0.6 });
    const red = ownedMaterial(rec, { color: 0x6b2a22, roughness: 0.6, metalness: 0.3 });

    // The tray with its three key-caps.
    const tray = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.34, 0.02, 0.1)), dark);
    tray.position.set(0, 0.01, 0.17);
    c.add(tray);
    rec.chips = CHIPS.map((k, i) => {
      const chip = new THREE.Mesh(
        ownedGeometry(rec, new THREE.BoxGeometry(0.09, 0.03, 0.07)),
        ownedMaterial(rec, { color: 0x8d7f68, roughness: 0.5, metalness: 0.72 })
      );
      chip.position.set((i - 1) * 0.105, 0.035, 0.17);
      c.add(chip);
      return chip;
    });

    // The magnet: a horseshoe lying on the plate, two arms and a yoke.
    const arm = ownedGeometry(rec, new THREE.BoxGeometry(0.1, 0.035, 0.03));
    for (const z of [-0.035, 0.035]) {
      const a = new THREE.Mesh(arm, z < 0 ? red : steel);
      a.position.set(0.27, 0.025, z + 0.02);
      c.add(a);
    }
    const yoke = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.03, 0.035, 0.1)), steel);
    yoke.position.set(0.335, 0.025, 0.02);
    c.add(yoke);

    // The sample pellet the magnet tests.
    rec.pellet = new THREE.Mesh(
      ownedGeometry(rec, new THREE.IcosahedronGeometry(0.022, 1)),
      ownedMaterial(rec, { color: 0x8f8678, roughness: 0.8, flatShading: true })
    );
    rec.pellet.position.set(0.05, 0.03, 0.02);
    c.add(rec.pellet);
    rec.pelletRest = 0.05;
    return rec;
  }

  /** The measurement made visible: attracted samples slide in, the rest are nudged away. */
  pull(id, unpaired) {
    const rec = this.stations.find(r => r.item.id === id);
    if (!rec) return;
    rec.pellet.position.x = rec.pelletRest + (unpaired > 0 ? 0.1 + Math.min(unpaired, 6) * 0.012 : -0.02);
    rec.pellet.position.y = 0.03;
    this.viewer.runSweep(rec.station);
  }

  poseHardware(rec) {
    // The key-cap in the hand sits raised.
    CHIPS.forEach((k, i) => {
      if (rec.chips) rec.chips[i].position.y = this.cfg.hand === k ? 0.06 : 0.035;
    });
  }
}
