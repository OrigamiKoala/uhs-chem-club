/**
 * bellows/vista.js — What stands in the far country, beyond the walk. Ambient: nothing collides with it,
 * nothing is checked for overlaps, and it is merged per material.
 *
 *   north   two other works, a few hundred metres off, each a deck on legs with a sphere, a drum and a
 *           stack, riding under bladders on their cables
 *   east    a line of scoop pylons standing up out of the cloud tops, their scoops turned into the wind
 *   south   a towering cloud column, its foot in the sea
 *   west    a bladder train: four bladders hung from a cable strung between two masts, under the sun
 */

import * as THREE from 'three';
import { bucketer, flush } from './decks.js';
import { SEA } from './works-plan.js';

function mast(B, x, z, top, w = 2.4) {
  const h = w / 2;
  for (const [dx, dz] of [[-h, -h], [h, -h], [h, h], [-h, h]]) B.span('darkSteel', x + dx - 0.2, x + dx + 0.2, SEA - 4, top, z + dz - 0.2, z + dz + 0.2);
  for (let y = SEA; y < top; y += 6) {
    B.span('darkSteel', x - h, x + h, y, y + 0.25, z - h - 0.1, z - h + 0.1);
    B.span('darkSteel', x - h, x + h, y, y + 0.25, z + h - 0.1, z + h + 0.1);
    B.span('darkSteel', x - h - 0.1, x - h + 0.1, y, y + 0.25, z - h, z + h);
    B.span('darkSteel', x + h - 0.1, x + h + 0.1, y, y + 0.25, z - h, z + h);
  }
}

function bag(B, x, y, z, a, b, c, rotY = 0) {
  const g = new THREE.SphereGeometry(1, 24, 12);
  g.scale(a, b, c);
  g.rotateY(rotY);
  g.translate(x, y, z);
  B.geo('skin', g);
}

/** A whole works seen from far off: a deck, a sphere, a drum, a stack and two bladders over it. */
function rig(B, x, z, y, s = 1) {
  B.span('steel', x - 22 * s, x + 22 * s, y - 1.2, y, z - 14 * s, z + 14 * s);
  for (const [dx, dz] of [[-18, -10], [18, -10], [-18, 10], [18, 10], [0, 0]]) mast(B, x + dx * s, z + dz * s, y - 1.2, 3 * s);
  const sp = new THREE.SphereGeometry(9 * s, 24, 16);
  sp.translate(x - 10 * s, y + 9 * s + 4, z);
  B.geo('cladding', sp);
  B.cyl('steel', 7 * s, 7 * s, 26 * s, 24, x + 9 * s, y + 13 * s, z - 2 * s);
  B.cyl('darkSteel', 1.1 * s, 1.5 * s, 34 * s, 10, x + 18 * s, y + 17 * s, z + 8 * s);
  bag(B, x - 4 * s, y + 46 * s, z, 22 * s, 8 * s, 9 * s, 0.3);
  bag(B, x + 14 * s, y + 52 * s, z + 6 * s, 18 * s, 7 * s, 7 * s, -0.2);
  for (const [dx, dz] of [[-16, -8], [-16, 8], [10, -6], [22, 10]]) B.rod('darkSteel', [x + dx * s, y, z + dz * s], [x + (dx * 0.4) * s, y + 40 * s, z + dz * 0.4 * s], 0.15 * s, 4);
}

export function buildVista(ctx) {
  const group = new THREE.Group();
  group.name = 'bellows-vista';
  group.userData.phys = 'ambient';
  const B = bucketer();

  // North: two other works.
  rig(B, -170, -390, 6, 1.2);
  rig(B, 230, -330, -4, 1.0);

  // East: scoop pylons out of the cloud tops, their scoops turned into the wind.
  for (let i = 0; i < 6; i++) {
    const x = 300 + (i % 2) * 24, z = -150 + i * 62, top = 18 + (i % 3) * 7;
    mast(B, x, z, top, 2.6);
    B.cyl('steel', 3.2, 1.2, 6, 14, x - 2.5, top + 2, z, 0, 0, Math.PI / 2);
    B.cyl('darkSteel', 1.4, 1.4, 1.2, 12, x, top + 0.6, z);
  }

  // South: a towering cloud column, its foot in the sea.
  {
    const r = (k) => (Math.sin(k * 12.9898) * 43758.5453) % 1;
    for (let k = 0; k < 18; k++) {
      const t = k / 17;
      const size = 70 - t * 30 + Math.abs(r(k)) * 18;
      const g = new THREE.IcosahedronGeometry(1, 2);
      g.scale(size, size * 0.75, size);
      g.translate(40 + r(k + 3) * 40, SEA + 10 + t * 260, 520 + r(k + 7) * 40);
      B.geo('cloud', g);
    }
  }

  // West: a bladder train between two masts, under the sun.
  {
    const a = [-340, 50, -110], b = [-370, 50, 150];
    mast(B, a[0], a[2], a[1], 3.4);
    mast(B, b[0], b[2], b[1], 3.4);
    B.rod('darkSteel', a, b, 0.25, 4);
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, y = a[1] - 4 - Math.sin(t * Math.PI) * 6;
      bag(B, x, y - 12, z, 9, 7, 16, 0.1);
      B.rod('darkSteel', [x, y, z], [x, y - 5, z], 0.12, 4);
    }
  }

  flush(ctx, B.buckets, group, 'vista', { phys: 'ambient', shadow: false });
  return group;
}
