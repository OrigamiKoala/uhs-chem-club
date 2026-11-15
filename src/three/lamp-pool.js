/**
 * lamp-pool.js — the registry of a world's lamps. It owns no lights.
 *
 * A forward renderer shades every lit fragment against every PointLight in the
 * scene, whether or not that light reaches the fragment. A world declares
 * thirty to fifty-five lamps, and one PointLight each made the light loop the
 * whole cost of the frame and overran the shader's uniform budget on some
 * GPUs. So a lamp is its emissive mesh only; what lights the ground round the
 * player is the world's sun and sky and the suit flashlight (stage.js).
 *
 * Worlds still declare every lamp here: the sources say where the lamps are
 * and whether each is on, which the worlds and their checks read.
 */

import * as THREE from 'three';

export class LampPool {
  /**
   * @param {THREE.Object3D} parent unused; kept for call-site compatibility
   * @param {number} [_size] unused; kept for call-site compatibility
   * @param {{ band?: number }} [opts]
   */
  constructor(parent, _size = 0, { band = 6 } = {}) {
    this.parent = parent;
    this.band = band;
    this.sources = [];
    /** Always empty: the pool adds no light to the scene. */
    this.lights = [];
  }

  /**
   * Declare a lamp. Returns the source; set `on` or `intensity` on it later.
   * @param {{ position: THREE.Vector3, color: number|THREE.Color, intensity: number,
   *           distance: number, decay?: number, on?: boolean }} src
   */
  add(src) {
    const s = {
      on: true, decay: 2, ...src,
      position: src.position.clone(),
      color: new THREE.Color(src.color),
      _d: 0
    };
    this.sources.push(s);
    return s;
  }

  /** Forget a previously declared lamp. */
  remove(src) {
    const i = this.sources.indexOf(src);
    if (i >= 0) this.sources.splice(i, 1);
  }

  update(_eye) {}
}
