/**
 * THE 3D CALORIMETER & THERMODYNAMIC BENCH — Ember Reach (Unit 5)
 *
 * The T4 built twin of `Calorimeter`, subclassing it through `plateBench3D`
 * (`./plates3d.js`) so every raked station screen runs the exact same
 * `draw(ctx, w, h, item)` and `press(item, hit)` as the 2D bench, while each
 * well carries the physical 3D apparatus matching the plate's head:
 *   - 'cup'     : double-walled brass calorimeter cup with lid, stirrer & thermometer
 *   - 'contact' : paired thermal blocks on an insulated ceramic bridge
 *   - 'bonds'   : twin atom spheres mounted in a spring-loaded pull vise
 *   - 'hess'    : stepped enthalpy altitude rack with brass card plates
 *   - 'diagram' : two-shelf enthalpy level stand with vertical transfer rod
 *   - 'box'     : twin-chamber glass microstate box with a brass partition gate
 *   - 'gibbs'   : enthalpy-vs-entropy balance beam on a central brass fulcrum
 */

import * as THREE from 'three';
import { Calorimeter } from './calorimeter.js';
import { plateBench3D, ownedMaterial, ownedGeometry } from './plates3d.js';

const GLASS = { color: 0x9fb4b2, roughness: 0.15, metalness: 0.0, transparent: true, opacity: 0.26 };

export class Calorimeter3D extends plateBench3D(Calorimeter, { backdrop: 'lab', frameTwo: 2.6 }) {
  buildHardware(station, item) {
    const rec = { geos: [], mats: [] };
    const c = station.content;
    const head = item.head || 'cup';

    const steel = ownedMaterial(rec, { color: 0x55504a, roughness: 0.55, metalness: 0.75 });
    const dark = ownedMaterial(rec, { color: 0x2f2b27, roughness: 0.7, metalness: 0.6 });
    const brass = ownedMaterial(rec, { color: 0xb8893a, roughness: 0.38, metalness: 0.82 });
    const warm = ownedMaterial(rec, { color: 0xd96b27, roughness: 0.45, metalness: 0.35 });
    const cool = ownedMaterial(rec, { color: 0x4b83b8, roughness: 0.45, metalness: 0.35 });
    const glass = ownedMaterial(rec, GLASS);

    if (head === 'contact') {
      const base = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.16, 0.012, 0.09)), dark);
      base.position.set(0, 0.006, 0);
      const leftBlock = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.052, 0.052, 0.052)), warm);
      leftBlock.position.set(-0.032, 0.038, 0);
      const rightBlock = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.052, 0.052, 0.052)), cool);
      rightBlock.position.set(0.032, 0.038, 0);
      const bridge = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.024, 0.016, 0.024)), brass);
      bridge.position.set(0, 0.038, 0);
      c.add(base, leftBlock, rightBlock, bridge);
      return rec;
    }

    if (head === 'bonds') {
      const base = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.18, 0.012, 0.08)), dark);
      base.position.set(0, 0.006, 0);
      const postGeo = ownedGeometry(rec, new THREE.CylinderGeometry(0.008, 0.010, 0.08, 12));
      const pL = new THREE.Mesh(postGeo, steel);
      pL.position.set(-0.06, 0.046, 0);
      const pR = new THREE.Mesh(postGeo, steel);
      pR.position.set(0.06, 0.046, 0);
      const atomGeo = ownedGeometry(rec, new THREE.SphereGeometry(0.018, 16, 12));
      const aL = new THREE.Mesh(atomGeo, brass);
      aL.position.set(-0.024, 0.056, 0);
      const aR = new THREE.Mesh(atomGeo, brass);
      aR.position.set(0.024, 0.056, 0);
      const rod = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.005, 0.005, 0.048, 10)), warm);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(0, 0.056, 0);
      c.add(base, pL, pR, aL, aR, rod);
      return rec;
    }

    if (head === 'hess' || head === 'diagram') {
      const base = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.16, 0.012, 0.09)), dark);
      base.position.set(0, 0.006, 0);
      c.add(base);
      for (let i = 0; i < 3; i++) {
        const hStep = 0.026 + i * 0.022;
        const step = new THREE.Mesh(
          ownedGeometry(rec, new THREE.BoxGeometry(0.036, hStep, 0.048)),
          i === 1 ? brass : steel
        );
        step.position.set((i - 1) * 0.042, 0.012 + hStep / 2, 0);
        c.add(step);
      }
      return rec;
    }

    if (head === 'box') {
      const base = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.16, 0.012, 0.09)), dark);
      base.position.set(0, 0.006, 0);
      const chamber = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.13, 0.064, 0.068)), glass);
      chamber.position.set(0, 0.044, 0);
      const gate = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.006, 0.068, 0.072)), brass);
      gate.position.set(0, 0.046, 0);
      const dotGeo = ownedGeometry(rec, new THREE.SphereGeometry(0.010, 12, 10));
      const p1 = new THREE.Mesh(dotGeo, warm);
      p1.position.set(-0.03, 0.044, 0.01);
      const p2 = new THREE.Mesh(dotGeo, cool);
      p2.position.set(0.03, 0.044, -0.01);
      c.add(base, chamber, gate, p1, p2);
      return rec;
    }

    if (head === 'gibbs') {
      const base = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.16, 0.012, 0.09)), dark);
      base.position.set(0, 0.006, 0);
      const fulcrum = new THREE.Mesh(ownedGeometry(rec, new THREE.ConeGeometry(0.024, 0.052, 14)), steel);
      fulcrum.position.set(0, 0.038, 0);
      const beam = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.12, 0.008, 0.020)), brass);
      beam.position.set(0, 0.066, 0);
      beam.rotation.z = -0.10;
      const wGeo = ownedGeometry(rec, new THREE.CylinderGeometry(0.015, 0.015, 0.024, 12));
      const wL = new THREE.Mesh(wGeo, warm);
      wL.position.set(-0.046, 0.054, 0);
      const wR = new THREE.Mesh(wGeo, cool);
      wR.position.set(0.046, 0.066, 0);
      c.add(base, fulcrum, beam, wL, wR);
      return rec;
    }

    // Default ('cup'): Insulated double-walled calorimeter vessel
    const base = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.058, 0.062, 0.012, 20)), dark);
    base.position.set(0, 0.006, 0);
    const jacket = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.052, 0.048, 0.088, 22)), steel);
    jacket.position.set(0, 0.056, 0);
    const rim = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.056, 0.056, 0.010, 22)), brass);
    rim.position.set(0, 0.102, 0);
    const stem = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.004, 0.004, 0.046, 10)), glass);
    stem.position.set(-0.015, 0.122, 0);
    const bulb = new THREE.Mesh(ownedGeometry(rec, new THREE.SphereGeometry(0.008, 12, 10)), warm);
    bulb.position.set(-0.015, 0.146, 0);
    const stirrer = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.003, 0.003, 0.038, 8)), brass);
    stirrer.position.set(0.016, 0.120, 0);

    c.add(base, jacket, rim, stem, bulb, stirrer);
    return rec;
  }

  poseHardware() {}

  dialSpecs() {
    const c = this.cfg;
    const vals = c?.dialValues || [];
    if (vals.length > 1) {
      return [{
        id: 'dial',
        label: (c.dialLabel || 'SETTING').toUpperCase(),
        min: 1,
        max: vals.length,
        value: c.dial || 1,
        onChange: v => this.onDial?.(v),
      }];
    }
    return [];
  }
}
