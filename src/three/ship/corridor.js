/**
 * ship/corridor.js — The spine.
 *
 * The one place on the ship every player walks through, so it carries the
 * full section: ribs on the frame spacing with the portal of a pressure door
 * between every other pair, a handrail at hip height, a continuous amber
 * light line under the cornice, conduit looms riding the chamfer, and the
 * deck split by a lit service channel under grating down its length.
 *
 * Frame numbers are stencilled on the ribs so a player learns the spine the
 * way crew do: FR 03 at the bridge end, counting aft.
 */

import * as THREE from "three";
import { placard } from "../materials/pbr-kit.js";
import { ROOMS } from "../ship-rooms.js";
import { dressRoomShell, box, cyl } from "./kit.js";

export function buildCorridor(ship) {
  const { faces } = dressRoomShell(ship, 'corridor', {
    floor: 'grate',
    handrail: true,
    chamferStrip: true,
    ribSpacing: 1.04,
    fill: { panels: 4, vent: 1.2, conduit: 2.2, machinery: 1.4, light: 1.0 },
    troughs: 1,
    seed: 3
  });

  // Frame numbers on the ribs of the port wall, counting aft.
  const port = faces.find(f => f.face.id === 'W');
  if (port) {
    const sorted = [...port.ribs].sort((a, b) => a - b);
    sorted.forEach((u, i) => {
      const tag = placard(`FR ${String(3 + i).padStart(2, '0')}`, { w: 0.13, h: 0.06, bg: '#8e8676' });
      tag.position.set(u, 2.05, 0.078);
      port.frame.group.add(tag);
    });
  }

  // A pipe pair along the deckhead's outboard edges, hung on the beams.
  const c = ROOMS.corridor;
  const g = new THREE.Group();
  g.name = 'spine-overhead';
  ship.hull.add(g);
  const len = c.maxZ - c.minZ - 0.3;
  const mz = (c.maxZ + c.minZ) / 2;
  for (const s of [-1, 1]) {
    cyl(g, s < 0 ? ship.gunmetalMat : ship.liveryMat, 0.05, len, s * 0.5, c.ceil - 0.2, mz, 'z', 12);
    for (let z = c.minZ + 0.6; z < c.maxZ - 0.3; z += 1.04) {
      box(g, ship.trimMat, 0.14, 0.08, 0.05, s * 0.5, c.ceil - 0.17, z);
    }
  }

  ship.addLight('spine-fwd', [0, 2.6, -1.2], 0xffd9a0, 2.6, 8.5);
  ship.addLight('spine-mid', [0, 2.6, -3.9], 0xffd9a0, 2.6, 8.5);
  ship.addLight('spine-aft', [0, 2.6, -6.4], 0xffd9a0, 2.6, 8.5);
  ship.addLight('spine-channel', [0, -0.05, -3.8], 0xc98a3a, 1.0, 5);
}
