/**
 * gasrig3d.js — The gas rig, built as an instrument.
 *
 * `GasRig` in three dimensions for Bellows at T4. A subclass of the drawn rig
 * through `plateBench3D`: every picture on the raked screens is the SAME `draw`,
 * and every reading is the same `gasdata.js` planner, so a stage that grades on
 * the canvas grades here because the same code is deciding. What is built is the
 * hardware the picture is OF, standing in each well:
 *
 *   cylinder  a glass barrel on a cradle with a piston on a rod. The piston stands
 *             at V / vmax of the barrel, the same fraction the plate draws; a free
 *             piston carries a stack of weights; the heater band warms in colour.
 *   mixture   a steel tank on three legs with a gauge boss and a valve.
 *   leak      a chamber with a pinhole plate in its end wall.
 *   tube      a long glass tube whose band is the gas front the plate reports.
 *   path, record  a plinth and nothing more: the picture is the whole instrument.
 *
 * The volume, temperature and time dials are real milled caps bolted to the plate
 * (`dialSpecs`), sharing `valueForAngle` with the drawn dial so the two cannot
 * land on different detents.
 *
 * THE HARDWARE SHOWS WHAT THE BENCH REPORTS AND NOTHING MORE. The particles are
 * not built: they are on the screen, one plane, countable (CLAUDE.md, "A built
 * instrument shows a flat picture"). The piston position, the weights and the
 * tube's band are all read off the same state the plate prints.
 */

import * as THREE from 'three';
import { GasRig } from './gasrig.js';
import { plateBench3D, ownedMaterial, ownedGeometry } from './plates3d.js';
import { planGas, front, ATM_KPA, toCelsius } from './gasdata.js';

const BARREL = 0.40;   // metres of barrel the whole piston travel covers
const GLASS = { color: 0x9fb4b2, roughness: 0.15, metalness: 0.0, transparent: true, opacity: 0.26 };

export class GasRig3D extends plateBench3D(GasRig, { backdrop: 'lab', frameTwo: 2.6 }) {
  buildHardware(station, item) {
    const rec = { geos: [], mats: [] };
    const c = station.content;
    const steel = ownedMaterial(rec, { color: 0x55504a, roughness: 0.55, metalness: 0.75 });
    const dark = ownedMaterial(rec, { color: 0x2f2b27, roughness: 0.7, metalness: 0.6 });
    const glass = ownedMaterial(rec, GLASS);

    if (item.head === 'cylinder') {
      // The cradle, the barrel, the end cap with its knock plate, the piston and its rod.
      const cradle = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(BARREL + 0.06, 0.012, 0.07)), dark);
      cradle.position.set(0, 0.006, 0.0);
      c.add(cradle);
      const barrel = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.052, 0.052, BARREL, 24, 1, true)), glass);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(0, 0.07, 0);
      c.add(barrel);
      const cap = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.056, 0.056, 0.012, 20)), steel);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(-BARREL / 2, 0.07, 0);
      c.add(cap);
      rec.piston = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.05, 0.05, 0.014, 22)), steel);
      rec.piston.rotation.z = Math.PI / 2;
      c.add(rec.piston);
      rec.rod = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.006, 0.006, 1, 8)), steel);
      rec.rod.rotation.z = Math.PI / 2;
      c.add(rec.rod);
      rec.weights = [];
      for (let k = 0; k < 4; k++) {
        const wgt = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16)), dark);
        wgt.visible = false;
        c.add(wgt);
        rec.weights.push(wgt);
      }
      rec.bandMat = ownedMaterial(rec, { color: 0x3a3631, roughness: 0.6, metalness: 0.5 });
      const band = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.058, 0.058, 0.05, 20, 1, true)), rec.bandMat);
      band.rotation.z = Math.PI / 2;
      band.position.set(-BARREL / 2 + 0.07, 0.07, 0);
      band.material.side = THREE.DoubleSide;
      c.add(band);
      return rec;
    }

    if (item.head === 'mixture') {
      const tank = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.08, 0.08, 0.2, 22)), steel);
      tank.position.set(0, 0.15, 0);
      c.add(tank);
      for (const [dx, dz] of [[-0.06, 0.04], [0.06, 0.04], [0, -0.07]]) {
        const leg = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.014, 0.1, 0.014)), dark);
        leg.position.set(dx, 0.05, dz);
        c.add(leg);
      }
      const boss = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12)), dark);
      boss.position.set(0, 0.265, 0);
      c.add(boss);
      const valve = new THREE.Mesh(ownedGeometry(rec, new THREE.TorusGeometry(0.018, 0.005, 6, 14)), dark);
      valve.position.set(0.09, 0.2, 0);
      valve.rotation.y = Math.PI / 2;
      c.add(valve);
      return rec;
    }

    if (item.head === 'leak') {
      const chamber = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.2, 0.1, 0.1)), glass);
      chamber.position.set(-0.05, 0.07, 0);
      c.add(chamber);
      const wall = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.012, 0.1, 0.1)), steel);
      wall.position.set(0.055, 0.07, 0);
      c.add(wall);
      const hole = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.004, 0.004, 0.016, 8)),
        ownedMaterial(rec, { color: 0x0d0c0a, roughness: 1 }));
      hole.rotation.z = Math.PI / 2;
      hole.position.set(0.055, 0.07, 0);
      c.add(hole);
      return rec;
    }

    if (item.head === 'tube') {
      const tube = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.03, 0.03, BARREL, 18, 1, true)), glass);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0, 0.06, 0);
      c.add(tube);
      rec.fillMat = ownedMaterial(rec, { color: 0x6f8f3f, roughness: 0.5, transparent: true, opacity: 0.45 });
      rec.fill = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.027, 0.027, 1, 14)), rec.fillMat);
      rec.fill.rotation.z = Math.PI / 2;
      c.add(rec.fill);
      for (const x of [-BARREL / 2, BARREL / 2]) {
        const stop = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.034, 0.034, 0.01, 16)), steel);
        stop.rotation.z = Math.PI / 2;
        stop.position.set(x, 0.06, 0);
        c.add(stop);
      }
      return rec;
    }

    // A path or a record has nothing standing in the well but a plinth.
    const plinth = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.2, 0.02, 0.16)), dark);
    plinth.position.y = 0.01;
    c.add(plinth);
    return rec;
  }

  poseHardware(rec) {
    const item = rec.item;
    if (!item) return;
    if (item.head === 'cylinder' && rec.piston) {
      const s = planGas(item, this.cfg);
      const vmax = this.cfg.vmax || Math.max(...(this.cfg.volumes.length ? this.cfg.volumes : [s.V]), s.V) * 1.0001;
      const room = Math.max(0.03, Math.min(BARREL - 0.012, (s.V / vmax) * (BARREL - 0.012)));
      const x = -BARREL / 2 + 0.006 + room;
      rec.piston.position.set(x, 0.07, 0);
      const rodLen = Math.max(0.02, BARREL / 2 + 0.06 - x);
      rec.rod.scale.y = rodLen;
      rec.rod.position.set(x + rodLen / 2, 0.07, 0);
      const weights = item.hold === 'P' ? Math.max(1, Math.min(4, Math.round((item.P0 ?? ATM_KPA) / 50))) : 0;
      rec.weights.forEach((wgt, k) => {
        wgt.visible = k < weights;
        wgt.position.set(BARREL / 2 + 0.045, 0.07 + 0.016 * k, 0);
      });
      // The heater band warms a little in colour; it is not a lamp, so it does not glow.
      const warm = Math.max(0, Math.min(1, (toCelsius(s.T) + 50) / 500));
      rec.bandMat.color.setRGB(0.23 + 0.3 * warm, 0.21 + 0.1 * warm, 0.19);
    } else if (item.head === 'tube' && rec.fill) {
      const cm = Math.min(item.length || 8, front(item.gas, this.seconds));
      const len = Math.max(0.001, (cm / (item.length || 8)) * BARREL);
      rec.fill.scale.y = len;
      rec.fill.position.set(-BARREL / 2 + len / 2, 0.06, 0);
    }
  }

  dialSpecs() {
    const specs = [];
    const c = this.cfg;
    if (c.volumes.length > 1) {
      specs.push({ id: 'volume', label: 'VOLUME', min: 1, max: c.volumes.length, value: c.volume, onChange: v => this.onVolume?.(v) });
    }
    if (c.temps.length > 1) {
      specs.push({ id: 'temp', label: 'TEMPERATURE', min: 1, max: c.temps.length, value: c.temp, onChange: v => this.onTemp?.(v) });
    }
    if (c.times.length > 1) {
      specs.push({ id: 'time', label: 'TIME', min: 1, max: c.times.length, value: c.time, onChange: v => this.onTime?.(v) });
    }
    // Two dials stand on the left of the plate; a stage never needs a third at once.
    return specs.slice(0, 2);
  }
}
