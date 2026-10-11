/**
 * domainrig3d.js — The domain rig, built as an instrument.
 *
 * `DomainRig` in three dimensions for Ligar at T4, a subclass of the drawn rig
 * through `plateBench3D`. This is the one Ligar instrument whose output IS a shape,
 * so the hub and its arms are real: a ball on a post with a rod, and a ball or a
 * balloon, for every arm, standing in the well at the vectors `planDomains`
 * settled them to. They glide to those vectors, the way the arms on the plate do.
 *
 * THE PICTURE ON THE SCREEN IS THE SAME SHAPE, read as a number: the protractor
 * reports an angle, so nothing about the geometry has to be judged by eye, and
 * the screen's projection and the well's arms are both the planner's vectors.
 */

import * as THREE from 'three';
import { DomainRig } from './domainrig.js';
import { plateBench3D, ownedMaterial, ownedGeometry } from './plates3d.js';
import { planDomains, planDipole, planMix, RIG_MOLECULES } from './vsepr.js';

const L = 0.1;            // rod length, metres
const HUB_Y = 0.14;       // the hub's height over the well floor
const TONE = { H: 0xb8afa0, C: 0x4a4640, N: 0x55606a, O: 0x6b5048, F: 0x6a7a4a, Cl: 0x7a8a52, S: 0x8a7a3a, P: 0x7a5a3a, Xe: 0x5a5a6a, B: 0x6a5a4a, X: 0x777777 };
const UP = new THREE.Vector3(0, 1, 0);

export class DomainRig3D extends plateBench3D(DomainRig, { backdrop: 'lab', frameTwo: 2.6 }) {
  buildHardware(station, item) {
    const rec = { geos: [], mats: [] };
    const c = station.content;
    const steel = ownedMaterial(rec, { color: 0x55504a, roughness: 0.55, metalness: 0.75 });
    const dark = ownedMaterial(rec, { color: 0x2f2b27, roughness: 0.7, metalness: 0.6 });

    const post = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.012, 0.02, HUB_Y - 0.01, 10)), steel);
    post.position.y = (HUB_Y - 0.01) / 2;
    c.add(post);
    const base = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.07, 0.08, 0.016, 16)), dark);
    base.position.y = 0.008;
    c.add(base);

    rec.pivot = new THREE.Group();
    rec.pivot.position.y = HUB_Y;
    c.add(rec.pivot);

    if (item.head === 'twist') {
      // Two joined centres with their pegs; the far end turns about the bond.
      const pegs = item.bond === 'single' ? 3 : 2;
      const gold = ownedMaterial(rec, { color: 0x4a4640, roughness: 0.45, metalness: 0.5 });
      const pegMat = ownedMaterial(rec, { color: 0xb8afa0, roughness: 0.45, metalness: 0.5 });
      const sphere = ownedGeometry(rec, new THREE.SphereGeometry(1, 16, 12));
      const bar = ownedGeometry(rec, new THREE.CylinderGeometry(0.005, 0.005, 1, 8));
      const makeEnd = dir => {
        const g = new THREE.Group();
        g.position.x = dir * 0.06;
        const centre = new THREE.Mesh(sphere, gold); centre.scale.setScalar(0.022); g.add(centre);
        for (let k = 0; k < pegs; k++) {
          const a = (k / pegs) * Math.PI * 2;
          const peg = new THREE.Mesh(sphere, pegMat); peg.scale.setScalar(0.013);
          peg.position.set(dir * 0.035, Math.cos(a) * 0.045, Math.sin(a) * 0.045);
          g.add(peg);
          const arm = new THREE.Mesh(bar, rec.rodMat || steel);
          const to = new THREE.Vector3(dir * 0.035, Math.cos(a) * 0.045, Math.sin(a) * 0.045);
          arm.scale.set(1, to.length(), 1);
          arm.position.copy(to).multiplyScalar(0.5);
          arm.quaternion.setFromUnitVectors(UP, to.clone().normalize());
          g.add(arm);
        }
        rec.pivot.add(g);
        return g;
      };
      makeEnd(-1);
      rec.twistEnd = makeEnd(1);
      const link = new THREE.Mesh(bar, steel);
      link.scale.set(1, 0.12, 1);
      link.rotation.z = Math.PI / 2;
      rec.pivot.add(link);
      rec.arms = [];
      return rec;
    }
    const hub = new THREE.Mesh(ownedGeometry(rec, new THREE.SphereGeometry(0.026, 18, 14)), ownedMaterial(rec, { color: TONE[item.hub] || 0x777777, roughness: 0.4, metalness: 0.6 }));
    rec.pivot.add(hub);

    rec.rodGeo = ownedGeometry(rec, new THREE.CylinderGeometry(0.004, 0.004, 1, 8));
    rec.rodMat = steel;
    rec.ballGeo = ownedGeometry(rec, new THREE.SphereGeometry(1, 16, 12));
    rec.balloonMat = ownedMaterial(rec, { color: 0x9fb4b2, roughness: 0.2, transparent: true, opacity: 0.32 });
    rec.ballMats = {};
    rec.arms = [];
    for (let k = 0; k < 6; k++) {
      const g = new THREE.Group();
      const rod = new THREE.Mesh(rec.rodGeo, rec.rodMat);
      const ball = new THREE.Mesh(rec.ballGeo, rec.balloonMat);
      g.add(rod); g.add(ball);
      g.visible = false;
      rec.pivot.add(g);
      rec.arms.push({ g, rod, ball });
    }
    // Field plates for the field head.
    if (item.head === 'field') {
      for (const sx of [-1, 1]) {
        const plate = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(0.012, 0.2, 0.16)), dark);
        plate.position.set(sx * 0.18, HUB_Y, 0);
        c.add(plate);
      }
    }
    return rec;
  }

  matFor(rec, sym) {
    if (!rec.ballMats[sym]) rec.ballMats[sym] = ownedMaterial(rec, { color: TONE[sym] || 0x777777, roughness: 0.45, metalness: 0.5 });
    return rec.ballMats[sym];
  }

  /** The vectors the well shows: the same ones the plate draws. */
  vectorsFor(item) {
    if (item.head === 'field') {
      const dip = planDipole(item.mol);
      const plan = dip.plan;
      const net = dip.mag > 0.05 ? dip.net.map(c => c / dip.mag) : [1, 0, 0];
      // Swing the molecule's net dipole onto the -x axis as the plate does: the negative end goes to the positive plate.
      const a = net; const b = [-1, 0, 0];
      const v = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const s = Math.hypot(...v); const cc = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const k = s < 1e-6 ? [0, 1, 0] : v.map(t => t / s);
      const ang = s < 1e-6 ? (cc > 0 ? 0 : Math.PI) : Math.atan2(s, cc);
      const turn = x => {
        const cs = Math.cos(ang); const sn = Math.sin(ang);
        const kx = k[1] * x[2] - k[2] * x[1]; const ky = k[2] * x[0] - k[0] * x[2]; const kz = k[0] * x[1] - k[1] * x[0];
        const kd = k[0] * x[0] + k[1] * x[1] + k[2] * x[2];
        return [x[0] * cs + kx * sn + k[0] * kd * (1 - cs), x[1] * cs + ky * sn + k[1] * kd * (1 - cs), x[2] * cs + kz * sn + k[2] * kd * (1 - cs)];
      };
      const t = item.align || 0;
      return plan.vectors.map(pv => pv.v.map((c, d) => c + (turn(pv.v)[d] - c) * t));
    }
    if (item.head === 'mixer') {
      const p = this.cfg.mix;
      if (!p) return [];
      return planDomains(Array.from({ length: planMix(p).lobes }, () => ({ kind: 'atom', sym: 'X' }))).vectors.map(v => v.v);
    }
    return item.shown || [];
  }

  armsFor(item) {
    if (item.head === 'field') return RIG_MOLECULES[item.mol].arms;
    if (item.head === 'mixer') {
      const p = this.cfg.mix;
      return p ? Array.from({ length: planMix(p).lobes }, () => ({ kind: 'lone' })) : [];
    }
    return item.arms || [];
  }

  poseHardware(rec) {
    if (!rec.arms) return;
    const item = rec.item;
    const vecs = this.vectorsFor(item);
    const arms = this.armsFor(item);
    // A twist plate has no arms of its own to stand: its picture is the evidence.
    rec.arms.forEach((slot, k) => {
      const v = vecs[k]; const arm = arms[k];
      if (!v || !arm || item.head === 'twist') { slot.g.visible = false; return; }
      slot.g.visible = true;
      const dir = new THREE.Vector3(v[0], v[1], v[2]);
      const len = Math.max(0.0001, dir.length());
      dir.normalize();
      slot.g.quaternion.setFromUnitVectors(UP, dir);
      slot.rod.scale.set(arm.mult > 1 ? 1.6 : 1, L * len, arm.mult > 1 ? 1.6 : 1);
      slot.rod.position.y = (L * len) / 2;
      slot.rod.visible = arm.kind === 'atom';
      if (arm.kind === 'lone') {
        slot.ball.material = rec.balloonMat;
        slot.ball.scale.set(0.02, L * 0.42, 0.02);
        slot.ball.position.y = L * len * 0.6;
      } else {
        slot.ball.material = this.matFor(rec, arm.sym);
        const r = arm.sym === 'H' ? 0.014 : 0.022;
        slot.ball.scale.setScalar(r);
        slot.ball.position.y = L * len;
      }
    });
    if (rec.twistEnd) rec.twistEnd.rotation.x = (item.twistAngle * Math.PI) / 180;
  }
}
