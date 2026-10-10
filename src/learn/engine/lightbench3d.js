/**
 * lightbench3d.js — The light bench, built as an instrument.
 *
 * `LightBench` in three dimensions for Lanternfall at T4. A subclass of the
 * drawn bench through `plateBench3D`: every picture is the SAME `draw`, painted
 * onto the raked screen over each station, and every reading comes from the same
 * pure planners in `lightdata.js`. What is built is the hardware the picture is
 * OF, standing in each well:
 *
 *   - a lamp housing with a lens that glows the colour of its wavelength (a
 *     lamp is a lamp, so it is allowed to be lit — CLAUDE.md §1),
 *   - a glass prism for the prism head, a vacuum tube with a metal plate for the
 *     photocell, a cuvette whose width follows the path length for the cuvette
 *     head.
 *
 * The wavelength and brightness controls are real milled dials bolted to the
 * plate (`dialSpecs`), sharing `valueForAngle` with the drawn dial so the two
 * cannot land on different detents.
 *
 * THE HARDWARE SHOWS WHAT THE BENCH REPORTS AND NOTHING MORE: the lens colour
 * is read off the same `rigNm` the picture uses, and the cuvette tint off the
 * rig's declared solute, so nothing on the bench is an answer the screen does
 * not already give.
 */

import * as THREE from 'three';
import { LightBench, rigNm } from './lightbench.js';
import { plateBench3D, ownedMaterial, ownedGeometry } from './plates3d.js';
import { wavelengthRgb, SOLUTES } from './lightdata.js';

const WELL_R = 0.27;

const GLASS = { color: 0x9fb4b2, roughness: 0.15, metalness: 0.0, transparent: true, opacity: 0.28 };

export class LightBench3D extends plateBench3D(LightBench, { backdrop: 'lab' }) {
  buildHardware(station, item) {
    const rec = { geos: [], mats: [] };
    const c = station.content;
    const steel = ownedMaterial(rec, { color: 0x55504a, roughness: 0.55, metalness: 0.75 });
    const dark = ownedMaterial(rec, { color: 0x2f2b27, roughness: 0.7, metalness: 0.6 });

    // The lamp housing on the left of the well, a lens facing in.
    const housing = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.09, 0.085, 0.09)), steel);
    housing.position.set(-WELL_R * 0.78, 0.045, 0);
    c.add(housing);
    rec.lensMat = ownedMaterial(rec, { color: 0x403a33, emissive: 0x000000, emissiveIntensity: 1.4, roughness: 0.4 });
    const lens = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.026, 0.026, 0.02, 16)), rec.lensMat);
    lens.rotation.z = Math.PI / 2;
    lens.position.set(-WELL_R * 0.78 + 0.052, 0.05, 0);
    c.add(lens);

    const rail = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(WELL_R * 1.7, 0.012, 0.04)), dark);
    rail.position.set(0, 0.006, 0.12);
    c.add(rail);

    const glass = ownedMaterial(rec, GLASS);
    if (item.head === 'prism') {
      const shape = new THREE.Shape();
      shape.moveTo(-0.045, 0); shape.lineTo(0.045, 0); shape.lineTo(0, 0.08); shape.closePath();
      const prism = new THREE.Mesh(
        ownedGeometry(rec, new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false })), glass
      );
      prism.position.set(0.0, 0.005, -0.035);
      c.add(prism);
    } else if (item.head === 'photocell') {
      const tube = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.05, 0.05, 0.2, 18)), glass);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0.02, 0.06, 0);
      c.add(tube);
      const plate = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.036, 0.036, 0.008, 14)), steel);
      plate.rotation.z = Math.PI / 2;
      plate.position.set(-0.07, 0.06, 0);
      c.add(plate);
    } else if (item.head === 'cuvette') {
      rec.cuvetteMat = ownedMaterial(rec, { color: 0x5684b0, roughness: 0.2, transparent: true, opacity: 0.55 });
      rec.cuvette = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(1, 0.1, 0.07)), rec.cuvetteMat);
      rec.cuvette.position.set(0.02, 0.06, 0);
      c.add(rec.cuvette);
      const frame = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(1, 0.104, 0.074)), glass);
      frame.position.copy(rec.cuvette.position);
      rec.cuvetteFrame = frame;
      c.add(frame);
    }
    return rec;
  }

  poseHardware(rec) {
    const item = rec.item;
    const nm = rigNm(item, this.cfg);
    const rgb = nm != null ? wavelengthRgb(nm) : null;
    if (rec.lensMat) {
      rec.lensMat.emissive.setRGB(rgb ? rgb[0] / 255 : 0.05, rgb ? rgb[1] / 255 : 0.05, rgb ? rgb[2] / 255 : 0.05);
      rec.lensMat.emissiveIntensity = nm == null ? 0 : 1.3;
    }
    if (rec.cuvette) {
      const w = 0.04 + 0.03 * (this.cfg.path || 1);
      rec.cuvette.scale.x = w;
      rec.cuvetteFrame.scale.x = w + 0.003;
      const s = SOLUTES[item.solute];
      const tint = { blue: 0x5684b0, purple: 0x80469a }[s?.looks] || 0x777777;
      rec.cuvetteMat.color.setHex(tint);
    }
  }

  dialSpecs() {
    const specs = [];
    if (this.items.some(r => r.tuned) && this.cfg.settings.length > 1) {
      specs.push({
        id: 'setting',
        label: (this.cfg.labels.dial || 'COLOUR').toUpperCase(),
        min: 1,
        max: this.cfg.settings.length,
        value: this.cfg.setting,
        onChange: v => this.onSetting?.(v)
      });
    }
    if (this.cfg.brightnessDial) {
      specs.push({
        id: 'brightness',
        label: 'BRIGHTNESS',
        min: 1,
        max: 5,
        value: this.cfg.brightness,
        onChange: v => this.onBrightness?.(v)
      });
    }
    return specs;
  }
}
