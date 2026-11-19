/**
 * bellows/vista.js — What stands in the far country, beyond the walk: ambient, nothing collides with it.
 */

import * as THREE from 'three';

export function buildVista(ctx) {
  const g = new THREE.Group();
  g.name = 'bellows-vista';
  g.userData.phys = 'ambient';
  void ctx;
  return g;
}
