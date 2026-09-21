/**
 * camera-rig.js — Spline and linear camera dolly between ship location anchors
 */

import * as THREE from 'three';
import { session } from '../session.js';
import { SHIP_GRAPH } from './ship-graph.js';

/**
 * Where the dolly stands the player at each station, and what it faces.
 *
 * DERIVED FROM THE GRAPH, NEVER AUTHORED TWICE. This was a hand-written table
 * beside `SHIP_GRAPH`, and it dated from the ship that was one open room: it
 * stood the player at (3.2, 1.8) for the star map, (-3.8, 2.2) for quarters,
 * (-2.8, -2.0) for comms and (4.2, -2.2) for cargo. Once the Avalon grew walls
 * and furniture, four of those seven anchors were INSIDE a collider — the comms
 * one was not even in the comms compartment any more — and the nav bar dollied
 * the player into the solid.
 *
 * **THAT IS NOT A CAMERA BUG, IT IS A DEAD END.** `FpsControls.update` tests
 * the destination of every step, so from inside a box every direction is
 * refused and the velocity is zeroed; `resolveBoxCollisions` then pushes out of
 * one box per frame, which is why its "player can never be stuck" comment does
 * not hold where two boxes overlap the player from opposite sides. The cargo
 * anchor sat in exactly that pinch — 0.25 m between the drum racks at x 4.3 and
 * the freight containers ending at x 4.05, in a 0.5 m body — so the push-out
 * shoved it back and forth between two positions for ever and the player could
 * not move at all. Pressing INVENTORY was a trap door.
 *
 * `SHIP_GRAPH` already carries the standing position and look target for every
 * station, in the right compartment, and `verify:ship` flood-fills every one of
 * them against the colliders the ship actually builds. So the rig reads them
 * from there and there is no second copy to fall out of step with the deck
 * plan. `verify:ship` measures these anchors too, because a derivation is only
 * as good as the thing it derives from.
 */
export const SHIP_ANCHORS = Object.fromEntries(
  Object.entries(SHIP_GRAPH.nodes).map(([id, node]) => [id, {
    name: node.name,
    pos: new THREE.Vector3(...node.pos),
    target: new THREE.Vector3(...node.target)
  }])
);

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
