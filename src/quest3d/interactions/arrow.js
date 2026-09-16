/**
 * arrow.js — Single curved arrow interaction handler
 * Allows drawing arrows anywhere in 3D space with proximity snapping
 */

import * as THREE from 'three';

export class ArrowInteraction {
  constructor(arrowController, picker, controls = null, onBlocked = null) {
    this.arrowController = arrowController;
    this.picker = picker;
    this.controls = controls;
    this.onBlocked = onBlocked;
    this.currentArrow = null;
    this.selectedSource = null;
    this.startWorldPos = null;
    this.isDragging = false;
    this.dragStartPos = { x: 0, y: 0 };
    this.onChange = null;
    /** Fired when the player taps a site without dragging — the scan gesture. */
    this.onProbe = null;

    this.arrowController.onArrowsChanged = () => {
      if (this.arrowController.completedArrows.length === 0) {
        this.currentArrow = null;
      }
      if (this.onChange) {
        this.onChange(this.getPayload());
      }
    };
  }

  setMultiArrow(enabled, maxArrows = 4) {
    this.arrowController.setMultiArrow(enabled, maxArrows);
  }

  handlePointerDown(e) {
    if (e.button === 2) return; // Right-click / two-finger tap rotates view
    if (e.pointerType === 'touch' && this.controls?.activeTouches?.size >= 2) {
      this.cancel();
      return;
    }
    this.dragStartPos = { x: e.clientX, y: e.clientY };

    const picked = this.picker.pick(e);
    const planeOrigin = picked ? picked.position : new THREE.Vector3(0, 0, 0);
    // Never snap start position to anchor — follow user input freely
    const unprojected = this.picker.unprojectToPlane(e, planeOrigin);
    const startPoint = unprojected;

    this.startWorldPos = startPoint;
    this.selectedSource = picked;
    this.isDragging = true;

    this.arrowController.startFromPosition(startPoint, picked);
    if (this.controls) this.controls.enabled = false;
  }

  handlePointerMove(e) {
    if (!this.isDragging || !this.startWorldPos) return;

    // Never snap while dragging — arrow tip follows cursor freely in 3D
    const currentPoint = this.picker.unprojectToPlane(e, this.startWorldPos);
    this.arrowController.updateDrag(currentPoint);
  }

  handlePointerUp(e) {
    if (!this.isDragging || !this.startWorldPos) return;
    this.isDragging = false;
    if (this.controls) this.controls.enabled = true;

    const dx = e.clientX - this.dragStartPos.x;
    const dy = e.clientY - this.dragStartPos.y;
    const dragDist = Math.sqrt(dx * dx + dy * dy);

    if (dragDist < 8) {
      // Tiny tap without drag. Three things can be under it, in priority order:
      // an arrow's number badge, an arrow, or a glowing site the player wants to scan.
      const tapSource = this.selectedSource;
      this.arrowController.cancel();
      this.startWorldPos = null;

      const hit = this.arrowController.pickArrowOrBadge(e);
      if (hit) {
        if (hit.type === 'badge') {
          // Clicked number badge -> change/cycle order
          this.arrowController.cycleArrowOrder(hit.index);
        } else if (hit.type === 'arrow') {
          // Clicked arrow mesh -> remove arrow
          this.arrowController.removeArrow(hit.index);
        }
        if (this.onChange) this.onChange(this.getPayload());
        return;
      }

      // Nothing drawn under the tap: treat it as a scan of whatever site is there.
      const probed = this.picker.pick(e) || tapSource;
      if (probed && this.onProbe) this.onProbe(probed);
      this.selectedSource = null;
      return;
    }

    let target = this.picker.pick(e);

    // If screen-space picker missed, check 3D ray proximity to registered anchors
    if (!target && this.picker && this.picker.anchors) {
      let closestAnchor = null;
      let minRayDist = 1.8;
      for (const a of this.picker.anchors) {
        const d = this.picker.raycaster.ray.distanceToPoint(a.position);
        if (d < minRayDist) {
          minRayDist = d;
          closestAnchor = a;
        }
      }
      if (closestAnchor && (!this.selectedSource || closestAnchor.id !== this.selectedSource.id)) {
        target = closestAnchor;
      }
    }

    // Also check if selectedSource was missed on down
    if (!this.selectedSource && this.picker && this.picker.anchors) {
      let closestAnchor = null;
      let minRayDist = 1.8;
      for (const a of this.picker.anchors) {
        const d = this.startWorldPos ? this.startWorldPos.distanceTo(a.position) : 999;
        if (d < minRayDist) {
          minRayDist = d;
          closestAnchor = a;
        }
      }
      if (closestAnchor) {
        this.selectedSource = closestAnchor;
      }
    }

    // Unproject target position onto the plane of the target anchor (or source plane if freeform)
    const targetRefPos = target ? target.position : (this.startWorldPos || new THREE.Vector3(0, 0, 0));
    const endPoint = this.picker.unprojectToPlane(e, targetRefPos);

    if (target && target.hindered && this.onBlocked) {
      this.onBlocked(target);
    }

    const completed = this.arrowController.finishAtPosition(
      this.startWorldPos,
      endPoint,
      this.selectedSource,
      target
    );

    this.currentArrow = completed;
    this.startWorldPos = null;
    this.selectedSource = null;

    if (this.onChange && completed) {
      this.onChange(this.getPayload());
    }
  }

  getPayload() {
    if (this.arrowController.multiArrow) {
      const arrs = this.arrowController.completedArrows || [];
      if (arrs.length === 0) return null;
      return {
        arrows: arrs.map(a => ({
          from: a.from || null,
          to: a.to || null,
          startPos: a.startPos ? [a.startPos.x, a.startPos.y, a.startPos.z] : null,
          endPos: a.endPos ? [a.endPos.x, a.endPos.y, a.endPos.z] : null,
          order: a.order
        }))
      };
    }

    if (!this.currentArrow || this.arrowController.completedArrows.length === 0) return null;
    const s = this.currentArrow.startPos;
    const e = this.currentArrow.endPos;
    return {
      from: this.currentArrow.from || null,
      to: this.currentArrow.to || null,
      startPos: s ? [s.x, s.y, s.z] : null,
      endPos: e ? [e.x, e.y, e.z] : null
    };
  }

  clear() {
    this.currentArrow = null;
    this.selectedSource = null;
    this.startWorldPos = null;
    this.isDragging = false;
    if (this.controls) this.controls.enabled = true;
    this.arrowController.clear();
    if (this.onChange) {
      this.onChange(null);
    }
  }
}
