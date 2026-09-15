/**
 * arrow-drag.js — Curved 3D arrow renderer and interaction controller
 * Supports pointer dragging and tap-source-then-tap-target
 */

import * as THREE from 'three';

export class ArrowController {
  constructor(scene, camera, picker) {
    this.scene = scene;
    this.camera = camera;
    this.picker = picker;
    this.activeArrowMesh = null;
    this.sourceAnchor = null;
    this.targetAnchor = null;
    this.completedArrows = []; // array of { from, to, mesh }
    this.onArrowComplete = null;

    this.material = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.9
    });
  }

  startFrom(anchor) {
    this.sourceAnchor = anchor;
    this.targetAnchor = null;
    this.removeActiveMesh();
  }

  updateDrag(currentPoint) {
    if (!this.sourceAnchor) return;
    this.renderArrow(this.sourceAnchor.position, currentPoint);
  }

  finishAt(anchor) {
    if (!this.sourceAnchor || !anchor || this.sourceAnchor.id === anchor.id) {
      this.cancel();
      return null;
    }

    this.targetAnchor = anchor;
    const arrowObj = {
      from: this.sourceAnchor.id,
      to: this.targetAnchor.id,
      mesh: this.createPersistentArrow(this.sourceAnchor.position, this.targetAnchor.position)
    };

    this.completedArrows.push(arrowObj);
    this.removeActiveMesh();

    const result = { from: arrowObj.from, to: arrowObj.to };
    this.sourceAnchor = null;
    this.targetAnchor = null;

    if (this.onArrowComplete) this.onArrowComplete(result);
    return result;
  }

  cancel() {
    this.removeActiveMesh();
    this.sourceAnchor = null;
    this.targetAnchor = null;
  }

  clear() {
    this.cancel();
    for (const item of this.completedArrows) {
      if (item.mesh) {
        this.scene.remove(item.mesh);
        item.mesh.geometry?.dispose();
      }
    }
    this.completedArrows = [];
  }

  removeActiveMesh() {
    if (this.activeArrowMesh) {
      this.scene.remove(this.activeArrowMesh);
      this.activeArrowMesh.geometry?.dispose();
      this.activeArrowMesh = null;
    }
  }

  renderArrow(startVec, endVec) {
    this.removeActiveMesh();
    this.activeArrowMesh = this.createArrowMesh(startVec, endVec, 0.085, 0xffd166);
    this.scene.add(this.activeArrowMesh);
  }

  createPersistentArrow(startVec, endVec) {
    const group = this.createArrowMesh(startVec, endVec, 0.095, 0x00ff88);
    this.scene.add(group);
    return group;
  }

  createArrowMesh(start, end, radius = 0.085, color = 0xffd166) {
    const group = new THREE.Group();

    // Compute curved midpoint
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    if (len < 0.05) return group;

    // Arch upwards relative to camera
    const up = new THREE.Vector3(0, 1, 0);
    const archOffset = up.clone().multiplyScalar(Math.min(len * 0.45, 0.9));
    const controlPoint = mid.clone().add(archOffset);

    const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, radius, 12, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: false });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.renderOrder = 999;
    group.add(tubeMesh);

    // Arrowhead cone
    const coneGeo = new THREE.ConeGeometry(radius * 2.6, radius * 4.2, 16);
    const coneMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: false });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.renderOrder = 999;

    // Position cone at end and orient along tangent
    const tangent = curve.getTangent(1.0).normalize();
    coneMesh.position.copy(end);
    coneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    group.add(coneMesh);

    return group;
  }
}
