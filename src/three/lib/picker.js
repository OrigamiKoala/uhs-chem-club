/**
 * picker.js — Raycasting and screen-space hit testing for interactive anchors
 * Ensures all interactive anchor targets are >=44px regardless of 3D camera distance
 */

import * as THREE from 'three';

export class AnchorPicker {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.anchors = []; // list of { id, position: Vector3, label, mesh }
  }

  setAnchors(anchors) {
    this.anchors = anchors;
  }

  // Find anchor nearest to pointer event
  pick(e) {
    const rect = this.domElement.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    let closestAnchor = null;
    let minDistance = 38; // Screen-space threshold in pixels (effective 76px diameter)

    for (const anchor of this.anchors) {
      const screenPos = this.getScreenPosition(anchor.position);
      const dx = screenPos.x - pointerX;
      const dy = screenPos.y - pointerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDistance) {
        minDistance = dist;
        closestAnchor = anchor;
      }
    }

    return closestAnchor;
  }

  getScreenPosition(worldVec) {
    const projected = worldVec.clone().project(this.camera);
    const rect = this.domElement.getBoundingClientRect();
    const x = ((projected.x + 1) * 0.5) * rect.width;
    const y = ((-projected.y + 1) * 0.5) * rect.height;
    return { x, y, inFront: projected.z < 1 };
  }
}
