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
    if (e.button === 2) return; // Right-click orbits view
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
      // Tiny tap without drag — check if tapped an existing arrow mesh or number badge
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
      }
      return;
    }

    let target = this.picker.pick(e);
    // Never snap end position to anchor — arrow visually stays where cursor released
    const endPoint = this.picker.unprojectToPlane(e, this.startWorldPos);

    // If screen-space picker missed, check 3D proximity to registered anchors for ID matching
    if (!target && this.picker && this.picker.anchors) {
      let closestAnchor = null;
      let min3D = 1.35;
      for (const a of this.picker.anchors) {
        const d = endPoint.distanceTo(a.position);
        if (d < min3D) {
          min3D = d;
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
      let min3D = 1.35;
      for (const a of this.picker.anchors) {
        const d = this.startWorldPos.distanceTo(a.position);
        if (d < min3D) {
          min3D = d;
          closestAnchor = a;
        }
      }
      if (closestAnchor) {
        this.selectedSource = closestAnchor;
      }
    }

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
