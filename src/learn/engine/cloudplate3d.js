/**
 * cloudplate3d.js — The cloud plate, built as an instrument.
 *
 * `CloudPlate` in three dimensions for Lanternfall at T4. A subclass of the
 * drawn plate through `plateBench3D`: the flat picture on each screen is the
 * SAME `draw`, so every count and every empty shell is read exactly as it is on
 * a phone. What is built is the thing that picture is OF — a block of glass on
 * the bench with the dots hanging inside it, in three dimensions, turning slowly
 * so the shape can be walked round.
 *
 * THE 3D CLOUD IS THE POINT AND THE FLAT SLICE IS THE EVIDENCE. A cloud is a
 * shape, and a shape is best seen as one; but a count of dots, or a shell with
 * nothing in it, is read flat from the screen — so the glass never has to be
 * counted. It shows exactly the dots the plate has fired and, in slice mode,
 * only those the slice keeps.
 *
 * The ring head stands a real ring on the plate: a circular track with the
 * wave's crests as small beads, so the wavelength dial turns a thing on the
 * bench. It knows no chemistry.
 */

import * as THREE from 'three';
import { CloudPlate, MAX_SHOTS, SLICE_HALF, DEFAULT_VIEW, turnPoint } from './cloudplate.js';
import { plateBench3D, ownedMaterial, ownedGeometry } from './plates3d.js';

const BLOCK = 0.2;   // half the glass block's side, in metres

const dummy = new THREE.Object3D();

export class CloudPlate3D extends plateBench3D(CloudPlate, { backdrop: 'lab' }) {
  buildHardware(station, item) {
    const rec = { geos: [], mats: [] };
    const c = station.content;
    const steel = ownedMaterial(rec, { color: 0x55504a, roughness: 0.55, metalness: 0.75 });
    const glass = ownedMaterial(rec, { color: 0x9fb4b2, roughness: 0.12, transparent: true, opacity: 0.2 });

    // A plinth for the block.
    const plinth = new THREE.Mesh(ownedGeometry(rec, new THREE.CylinderGeometry(0.1, 0.12, 0.025, 8)), steel);
    plinth.position.y = 0.0125;
    c.add(plinth);

    rec.turn = new THREE.Group();
    rec.turn.position.y = BLOCK + 0.03;
    c.add(rec.turn);

    if (item.head === 'ring') {
      const ring = new THREE.Mesh(
        ownedGeometry(rec, new THREE.TorusGeometry(0.15, 0.004, 6, 64)),
        ownedMaterial(rec, { color: 0x6f8f3f, emissive: 0x2d3a18, roughness: 0.5 })
      );
      ring.rotation.x = Math.PI / 2;
      rec.turn.add(ring);
      rec.beadMat = ownedMaterial(rec, { color: 0xb8afa0, roughness: 0.5, emissive: 0x3a352c });
      rec.beadGeo = ownedGeometry(rec, new THREE.SphereGeometry(0.01, 8, 6));
      rec.beads = new THREE.InstancedMesh(rec.beadGeo, rec.beadMat, 8);
      rec.beads.count = 0;
      rec.beads.frustumCulled = false;
      rec.turn.add(rec.beads);
      rec.turn.position.y = 0.12;
      return rec;
    }

    // The block: a glass cube, edges only, with the dots inside it.
    const cube = new THREE.Mesh(ownedGeometry(rec, new THREE.BoxGeometry(BLOCK * 2, BLOCK * 2, BLOCK * 2)), glass);
    rec.turn.add(cube);
    const edges = new THREE.LineSegments(
      ownedGeometry(rec, new THREE.EdgesGeometry(new THREE.BoxGeometry(BLOCK * 2, BLOCK * 2, BLOCK * 2))),
      (() => { const m = new THREE.LineBasicMaterial({ color: 0x544e46 }); rec.mats.push(m); return m; })()
    );
    rec.turn.add(edges);

    rec.dotGeo = ownedGeometry(rec, new THREE.SphereGeometry(0.0055, 6, 5));
    rec.dotMat = ownedMaterial(rec, { color: 0x6f8f3f, emissive: 0x3a4a1d, roughness: 0.5 });
    rec.dots = new THREE.InstancedMesh(rec.dotGeo, rec.dotMat, MAX_SHOTS);
    rec.dots.count = 0;
    rec.dots.frustumCulled = false;
    rec.turn.add(rec.dots);

    // Hairline axes through the block, so a lobe's direction can be named.
    const axisMat = new THREE.LineBasicMaterial({ color: 0x3a352c });
    rec.mats.push(axisMat);
    for (const [a, b] of [[[-1, 0, 0], [1, 0, 0]], [[0, -1, 0], [0, 1, 0]], [[0, 0, -1], [0, 0, 1]]]) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...a).multiplyScalar(BLOCK), new THREE.Vector3(...b).multiplyScalar(BLOCK)
      ]);
      rec.geos.push(g);
      rec.turn.add(new THREE.Line(g, axisMat));
    }
    return rec;
  }

  poseHardware(rec) {
    const item = rec.item;

    if (item.head === 'ring') {
      const wl = (this.cfg.settings || [])[(this.cfg.setting || 1) - 1];
      if (wl && rec.beads) {
        // One bead per crest: as many as the wave puts round the track.
        const n = Math.max(1, Math.min(8, Math.round(332.4 / wl)));
        rec.beads.count = n;
        for (let i = 0; i < n; i++) {
          const t = (i / n) * Math.PI * 2;
          dummy.position.set(0.15 * Math.cos(t), 0, -0.15 * Math.sin(t));
          dummy.updateMatrix();
          rec.beads.setMatrixAt(i, dummy.matrix);
        }
        rec.beads.instanceMatrix.needsUpdate = true;
      }
      return;
    }
    if (!rec.dots) return;

    // A turning plate keeps the cloud's own axes in the glass and turns the whole
    // block by the plate's view, so the glass and the picture show one orientation.
    const turning = item.plane === 'turn';
    const key = `${item.fired}|${this.cfg.slice}|${this.cfg.extent}${turning ? `|${this.cfg.view?.yaw}|${this.cfg.view?.pitch}` : ''}`;
    if (rec.drawnKey === key) return;
    rec.drawnKey = key;

    const k = BLOCK / this.cfg.extent;
    let n = 0;
    const pts = item.points || [];
    for (let i = 0; i < item.fired && i < pts.length; i++) {
      const p = pts[i];
      if (this.cfg.slice && Math.abs(turning ? turnPoint(p, this.cfg.view || DEFAULT_VIEW).c : p.z) > SLICE_HALF) continue;
      if (Math.abs(p.x * k) > BLOCK || Math.abs(p.y * k) > BLOCK || Math.abs(p.z * k) > BLOCK) continue;
      if (turning) dummy.position.set(p.x * k, p.y * k, p.z * k);
      else dummy.position.set(p.x * k, p.z * k, -p.y * k);
      dummy.updateMatrix();
      rec.dots.setMatrixAt(n++, dummy.matrix);
    }
    rec.dots.count = n;
    rec.dots.instanceMatrix.needsUpdate = true;
  }

  tick(dt) {
    // A plain block turns slowly, so a shape can be seen from every side; one on
    // a turning plate is held at the view the player chose.
    const v = this.cfg.view || DEFAULT_VIEW;
    for (const rec of this.stations || []) {
      if (!rec.turn || !rec.dots) continue;
      if (rec.item?.plane === 'turn') rec.turn.rotation.set(v.pitch, v.yaw, 0, 'XYZ');
      else rec.turn.rotation.y += dt * 0.35;
    }
    return this.stations?.some(r => r.dots) || false;
  }

  dialSpecs() {
    if (!this.items.some(r => r.head === 'ring') || this.cfg.settings.length < 2) return [];
    return [{
      id: 'setting', label: 'WAVELENGTH', min: 1, max: this.cfg.settings.length, value: this.cfg.setting,
      onChange: v => this.onSetting?.(v)
    }];
  }
}
