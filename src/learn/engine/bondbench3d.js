/**
 * bondbench3d.js — The bond bench, built as an instrument.
 *
 * `BondBench` in three dimensions for Ligar at T4, a subclass of the drawn bench
 * through `plateBench3D`: the rail, the trace and the lattice picture on each
 * raked screen are the SAME `draw`, so a reading is the reading everywhere. What
 * is built is the thing the picture is OF — two atoms on a rail whose gap the
 * crank sets, or a small block of ions — and the crank itself, a real milled dial
 * bolted to the plate that shares `valueForAngle` with the drawn one.
 *
 * THE HARDWARE SHOWS WHAT THE BENCH REPORTS AND NOTHING MORE: the gap between the
 * balls is the separation the plate prints, to the same scale as the plate's own
 * rail, and the ions are the plate's ions at the plate's radii.
 */

import * as THREE from 'three';
import { BondBench, X_MAX } from './bondbench.js';
import { plateBench3D, ownedMaterial, ownedGeometry } from './plates3d.js';
import { PAIRS, DISC_RADIUS, IONS, LATTICES } from './bonddata.js';

const RAIL = 0.44;          // metres of rail the whole separation range covers
const PM = RAIL / X_MAX;    // metres per picometre on the rail

const TONE = { H: 0xb8afa0, C: 0x4a4640, N: 0x55606a, O: 0x6b5048, F: 0x6a7a4a, Cl: 0x7a8a52 };

export class BondBench3D extends plateBench3D(BondBench, { backdrop: 'lab', frameTwo: 2.6 }) {
  buildHardware(station, item) {
    const rec = { geos: [], mats: [] };
    const c = station.content;
    const steel = ownedMaterial(rec, { color: 0x55504a, roughness: 0.55, metalness: 0.75 });
    const dark = ownedMaterial(rec, { color: 0x2f2b27, roughness: 0.7, metalness: 0.6 });

    if (item.head === 'lattice') {
      const lat = LATTICES[item.lattice];
      const cat = IONS[lat.cation]; const an = IONS[lat.anion];
      const step = 0.052;
      rec.ions = [];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) {
        const isCat = (i + j + k) % 2 === 0;
        const ion = isCat ? cat : an;
        const r = Math.max(0.011, ion.radius * 0.00017);
        const ball = new THREE.Mesh(
          ownedGeometry(rec, new THREE.SphereGeometry(r, 14, 10)),
          ownedMaterial(rec, { color: isCat ? 0xb8afa0 : 0x4a4640, roughness: 0.5, metalness: 0.4 })
        );
        ball.position.set((i - 1) * step, 0.05 + k * step, (j - 1) * step * 0.9);
        c.add(ball);
        rec.ions.push(ball);
      }
      const plinth = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.2, 0.02, 0.18)), dark);
      plinth.position.y = 0.01;
      c.add(plinth);
      return rec;
    }

    const pair = PAIRS[item.pair];
    const rail = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(RAIL + 0.08, 0.012, 0.03)), dark);
    rail.position.set(0, 0.006, 0.02);
    c.add(rail);
    for (let t = 0; t <= X_MAX; t += 50) {
      const tick = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.003, 0.004, 0.018)), steel);
      tick.position.set(-RAIL / 2 + t * PM, 0.013, 0.02);
      c.add(tick);
    }
    const mk = sym => {
      const r = Math.max(0.014, Math.min(0.06, (DISC_RADIUS[sym] || 60) * PM * 0.55));
      const m = new THREE.Mesh(
        ownedGeometry(rec, new THREE.SphereGeometry(r, 18, 14)),
        ownedMaterial(rec, { color: TONE[sym] || 0x777777, roughness: 0.45, metalness: 0.55 })
      );
      m.userData.r = r;
      c.add(m);
      return m;
    };
    rec.a = mk(pair.a);
    rec.b = mk(pair.b);
    rec.gap = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(1, 0.004, 0.004)),
      ownedMaterial(rec, { color: 0xd99423, roughness: 0.6, emissive: 0x3a2a08 }));
    c.add(rec.gap);
    return rec;
  }

  poseHardware(rec) {
    if (!rec.a) return;
    const r = this.separation;
    if (r == null) return;
    const ax = -RAIL / 2 + rec.a.userData.r;
    const bx = ax + r * PM;
    const y = 0.02 + Math.max(rec.a.userData.r, rec.b.userData.r);
    rec.a.position.set(ax, y, 0.02);
    rec.b.position.set(bx, y, 0.02);
    rec.gap.scale.x = Math.max(0.001, bx - ax);
    rec.gap.position.set((ax + bx) / 2, 0.016, 0.06);
  }

  dialSpecs() {
    if (!this.cfg.settings || this.cfg.settings.length < 2) return [];
    return [{
      id: 'setting', label: 'SEPARATION',
      min: 1, max: this.cfg.settings.length, value: this.cfg.setting,
      onChange: v => this.onSetting?.(v)
    }];
  }
}
