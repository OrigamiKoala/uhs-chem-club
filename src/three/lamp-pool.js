/**
 * lamp-pool.js — world lamp registry where every declared lamp owns an always-on PointLight.
 *
 * Each `add(src)` creates a real `THREE.PointLight` in `parent` so every lit
 * source illuminates its surroundings continuously rather than turning on only
 * as the player approaches. Sources with `on: false` (e.g. dormant pylons) stay
 * at intensity 0 until turned on.
 */

import * as THREE from 'three';

export class LampPool {
  /**
   * @param {THREE.Object3D} parent where the lights live (a scene: sources are world space)
   * @param {number} [_size] unused legacy pool cap, kept for call-site compatibility
   * @param {{ band?: number }} [opts]
   */
  constructor(parent, _size = 0, { band = 6 } = {}) {
    this.parent = parent;
    this.band = band;
    this.sources = [];
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
      _d: 0,
      _light: null
    };
    const light = new THREE.PointLight(
      s.color,
      s.on && s.intensity > 0 ? s.intensity : 0,
      s.distance,
      s.decay
    );
    light.position.copy(s.position);
    light.castShadow = false;
    light.name = `lamp-pool-${this.lights.length}`;
    this.parent.add(light);
    this.lights.push(light);
    s._light = light;
    this.sources.push(s);
    return s;
  }

  /** Remove a previously added lamp source and its PointLight from the scene. */
  remove(src) {
    const i = this.sources.indexOf(src);
    if (i >= 0) this.sources.splice(i, 1);
    if (src?._light) {
      this.parent.remove(src._light);
      const li = this.lights.indexOf(src._light);
      if (li >= 0) this.lights.splice(li, 1);
      src._light.dispose?.();
      src._light = null;
    }
  }

  update(_eye) {
    for (const s of this.sources) {
      const light = s._light;
      if (!light) continue;
      light.position.copy(s.position);
      light.color.copy(s.color);
      light.distance = s.distance;
      light.decay = s.decay;
      light.intensity = s.on && s.intensity > 0 ? s.intensity : 0;
    }
  }
}
