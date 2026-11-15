/**
 * lamp-pool.js — many lamps in a world, a few lights in the shader.
 *
 * WHY THIS EXISTS. A forward renderer shades every lit fragment against every
 * PointLight in the scene, and it does so whether that light is lit or not: a
 * light at intensity zero, or forty metres away with a four-metre range, still
 * costs the full specular term on every pixel of sand on the screen. Erebus
 * carried twenty-one of them (one per pylon and the lander's bay), which made
 * the light loop the most expensive thing in the ground's shader by a distance.
 *
 * A lamp's light only shows within a few metres of it, so only the lamps round
 * the player need a light at all. The pool owns a FIXED number of real lights
 * (a changing count would recompile every material in view) and hands them to
 * the lit sources nearest the eye.
 *
 * NOTHING POPS. Each pooled light is weighted by how much nearer its source is
 * than the first source that missed out, over `band` metres. Two sources trade
 * places only when they are the same distance away, and at that moment both
 * weigh zero — so a lamp dims out as another dims in, continuously.
 */

import * as THREE from 'three';

export class LampPool {
  /**
   * @param {THREE.Object3D} parent where the lights live (a scene: sources are world space)
   * @param {number} size how many real lights
   * @param {{ band?: number }} [opts]
   */
  constructor(parent, size, { band = 6 } = {}) {
    this.band = band;
    this.sources = [];
    this.lights = [];
    this._live = [];
    for (let i = 0; i < size; i++) {
      const light = new THREE.PointLight(0xffffff, 0, 1, 2);
      light.castShadow = false;
      light.name = `lamp-pool-${i}`;
      parent.add(light);
      this.lights.push(light);
    }
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

  update(eye) {
    if (!eye) return;
    const live = this._live;
    live.length = 0;
    for (const s of this.sources) {
      if (!s.on || s.intensity <= 0) continue;
      s._d = s.position.distanceTo(eye);
      live.push(s);
    }
    live.sort((a, b) => a._d - b._d);
    const n = this.lights.length;
    const next = live.length > n ? live[n]._d : Infinity;
    for (let i = 0; i < n; i++) {
      const light = this.lights[i];
      const s = live[i];
      if (!s) { light.intensity = 0; continue; }
      const w = Math.min(1, (next - s._d) / this.band);
      light.position.copy(s.position);
      light.color.copy(s.color);
      light.distance = s.distance;
      light.decay = s.decay;
      light.intensity = s.intensity * w;
    }
  }
}
