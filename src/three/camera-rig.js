/**
 * camera-rig.js — Spline and linear camera dolly between ship location anchors
 */

import * as THREE from 'three';
import { session } from '../session.js';

export const SHIP_ANCHORS = {
  bridge: {
    name: 'Command Bridge',
    pos: new THREE.Vector3(0, 1.8, 4.8),
    target: new THREE.Vector3(0, 1.2, 0)
  },
  starmap: {
    name: 'Star Map & Navigation',
    pos: new THREE.Vector3(3.2, 2.2, 1.8),
    target: new THREE.Vector3(3.2, 0.9, 0)
  },
  quarters: {
    name: 'Crew Quarters',
    pos: new THREE.Vector3(-3.8, 1.6, 2.2),
    target: new THREE.Vector3(-3.8, 1.2, 0)
  },
  cargo: {
    name: 'Cargo Hold',
    pos: new THREE.Vector3(4.2, 1.6, -2.2),
    target: new THREE.Vector3(4.2, 1.0, -4.2)
  },
  comms: {
    name: 'Comms Array',
    pos: new THREE.Vector3(-2.8, 1.8, -2.0),
    target: new THREE.Vector3(-2.8, 1.2, -3.8)
  },
  airlock: {
    name: 'Airlock & Departure',
    pos: new THREE.Vector3(0, 1.8, -4.5),
    target: new THREE.Vector3(0, 1.8, -8.0)
  }
};

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.currentLocation = 'bridge';
    this.targetPos = SHIP_ANCHORS.bridge.pos.clone();
    this.currentTarget = SHIP_ANCHORS.bridge.target.clone();

    this.startPos = this.targetPos.clone();
    this.startTarget = this.currentTarget.clone();

    this.isTransitioning = false;
    this.transitionProgress = 1.0;
    this.transitionDuration = 700; // ms
    this.startTime = 0;
    this.onArrival = null;
  }

  moveTo(locationKey, onArrival) {
    const anchor = SHIP_ANCHORS[locationKey];
    if (!anchor) return;

    this.currentLocation = locationKey;
    this.onArrival = onArrival || null;

    if (session.reduceMotion) {
      this.camera.position.copy(anchor.pos);
      this.camera.lookAt(anchor.target);
      this.currentTarget.copy(anchor.target);
      if (this.onArrival) this.onArrival();
      return;
    }

    this.startPos.copy(this.camera.position);
    this.startTarget.copy(this.currentTarget);
    this.targetPos.copy(anchor.pos);
    this.currentTarget.copy(anchor.target);

    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.startTime = performance.now();
  }

  update(now = performance.now()) {
    if (!this.isTransitioning) return;

    const elapsed = now - this.startTime;
    const t = Math.min(1.0, elapsed / this.transitionDuration);

    // Ease-in-out cubic
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    this.camera.position.lerpVectors(this.startPos, this.targetPos, ease);
    const lookAt = new THREE.Vector3().lerpVectors(this.startTarget, this.currentTarget, ease);
    this.camera.lookAt(lookAt);

    if (t >= 1.0) {
      this.isTransitioning = false;
      if (this.onArrival) {
        this.onArrival();
        this.onArrival = null;
      }
    }
  }
}
