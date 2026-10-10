/**
 * electronbench3d.js — The electron bench, built as an instrument.
 *
 * `ElectronBench` in three dimensions for Lanternfall at T4, a subclass of the
 * drawn bench through `plateBench3D`. Every spectrum and every ring picture is
 * the SAME `draw` painted on the raked screen over each station, and every
 * reading comes from the same planners (`spectrumOf`, `planPull`), so the number
 * a tap reports on the bench is the number it reports on a phone.
 *
 * What is built is the hardware the picture is of:
 *   - a SPECTRUM plate stands a lamp housing facing a detector arc on the plate;
 *     when light is fired the lamp's lens lights, and it stays lit for as long
 *     as the spectrum is filling in;
 *   - an ATOM plate stands a small model of its own rings on a pedestal, one
 *     torus per occupied shell with a bead for every electron, so `Ionize` takes
 *     a real bead off the real outer ring and `Add Electron` puts one on.
 *
 * It knows no chemistry.
 */

import * as THREE from 'three';
import { ElectronBench, outerShell } from './electronbench.js';
import { plateBench3D, ownedMaterial, ownedGeometry } from './plates3d.js';

const dummy = new THREE.Object3D();

export class ElectronBench3D extends plateBench3D(ElectronBench, { backdrop: 'lab' }) {
  buildHardware(station, item) {
    const rec = { geos: [], mats: [] };
    const c = station.content;
    const steel = ownedMaterial(rec, { color: 0x55504a, roughness: 0.55, metalness: 0.75 });
    const dark = ownedMaterial(rec, { color: 0x2f2b27, roughness: 0.7, metalness: 0.6 });

    if (item.head === 'spectrum') {
      const housing = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.1, 0.09, 0.1)), steel);
      housing.position.set(-0.17, 0.05, 0);
      c.add(housing);
      rec.lensMat = ownedMaterial(rec, { color: 0x403a33, emissive: 0x6f8f3f, emissiveIntensity: 0, roughness: 0.4 });
      const lens = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16)), rec.lensMat);
      lens.rotation.z = Math.PI / 2;
      lens.position.set(-0.115, 0.055, 0);
      c.add(lens);
      const arc = new THREE.Mesh(ownedGeometry(rec, new THREE.TorusGeometry(0.15, 0.012, 6, 24, Math.PI)), dark);
      arc.rotation.set(0, -Math.PI / 2, 0);
      arc.position.set(0.1, 0.012, 0);
      c.add(arc);
      return rec;
    }

    // An atom: a pedestal with its rings and one bead for every electron.
    const ped = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.04, 0.06, 0.03, 8)), steel);
    ped.position.y = 0.015;
    c.add(ped);
    rec.model = new THREE.Group();
    rec.model.position.y = 0.16;
    c.add(rec.model);
    rec.ringMat = ownedMaterial(rec, { color: 0x6b625a, roughness: 0.6, metalness: 0.5 });
    rec.beadMat = ownedMaterial(rec, { color: 0xb8afa0, roughness: 0.5, emissive: 0x3a352c });
    rec.beadGeo = ownedGeometry(rec, new THREE.SphereGeometry(0.008, 8, 6));
    rec.beads = new THREE.InstancedMesh(rec.beadGeo, rec.beadMat, 40);
    rec.beads.count = 0;
    rec.beads.frustumCulled = false;
    rec.model.add(rec.beads);
    rec.nucleus = new THREE.Mesh(ownedGeometry(rec, new THREE.SphereGeometry(0.014, 10, 8)), steel);
    rec.model.add(rec.nucleus);
    rec.rings = [];
    return rec;
  }

  poseHardware(rec) {
    const item = rec.item;
    if (item.head === 'spectrum') {
      if (rec.lensMat) rec.lensMat.emissiveIntensity = item.progress > 0 && item.progress < 1 ? 1.5 : item.progress >= 1 ? 0.4 : 0;
      return;
    }
    if (!rec.model) return;
    const key = `${item.shells.join(',')}|${item.radius}`;
    if (rec.drawnKey === key) return;
    rec.drawnKey = key;

    for (const r of rec.rings) { rec.model.remove(r); r.geometry.dispose(); }
    rec.rings = [];
    const maxPm = this.cfg.maxPm || 240;
    const k = 0.15 / maxPm;
    let bead = 0;
    item.shells.forEach((cnt, i) => {
      if (!cnt) return;
      const radius = item.radius * Math.pow((i + 1) / item.shells.length, 2) * k;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.0025, 6, 48), rec.ringMat);
      ring.rotation.x = Math.PI / 2;
      rec.model.add(ring);
      rec.rings.push(ring);
      for (let e = 0; e < cnt && bead < 40; e++) {
        const a = (e / cnt) * Math.PI * 2 + i * 0.7;
        dummy.position.set(radius * Math.cos(a), 0, -radius * Math.sin(a));
        dummy.updateMatrix();
        rec.beads.setMatrixAt(bead++, dummy.matrix);
      }
    });
    rec.beads.count = bead;
    rec.beads.instanceMatrix.needsUpdate = true;
    void outerShell;
  }

  tick(dt) {
    const live = super.tick(dt);
    for (const rec of this.stations || []) if (rec.model) rec.model.rotation.y += dt * 0.3;
    return live || this.stations?.some(r => r.model) || false;
  }
}
