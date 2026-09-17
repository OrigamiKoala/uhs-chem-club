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

    const x = (pointerX / rect.width) * 2 - 1;
    const y = -(pointerY / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    let closestAnchor = null;
    let minScore = Infinity;

    for (const anchor of this.anchors) {
      const screenPos = this.getScreenPosition(anchor.position);
      if (!screenPos.inFront) continue;

      const dx = screenPos.x - pointerX;
      const dy = screenPos.y - pointerY;
      const screenDist = Math.sqrt(dx * dx + dy * dy);
      const rayDist = this.raycaster.ray.distanceToPoint(anchor.position);

      // Tight threshold: within 0.85 3D world units of the ray OR within 38px on screen
      // Prevents snapping to neighboring wrong atoms (which are >=1.2 - 1.5 units away)
      if (rayDist < 0.85 || screenDist < 38) {
        const score = rayDist * 35 + screenDist;
        if (score < minScore) {
          minScore = score;
          closestAnchor = anchor;
        }
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

  unprojectToPlane(e, referenceWorldPos) {
    const rect = this.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    const normal = new THREE.Vector3();
    this.camera.getWorldDirection(normal).negate();
    const refPos = referenceWorldPos || new THREE.Vector3(0, 0, 0);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, refPos);
    const target = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(plane, target);
    return hit || refPos;
  }
}
