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
  }

  handlePointerDown(e) {
    if (e.button === 2) return; // Right-click orbits view
    this.dragStartPos = { x: e.clientX, y: e.clientY };

    const picked = this.picker.pick(e);
    const planeOrigin = picked ? picked.position : new THREE.Vector3(0, 0, 0);
    const unprojected = this.picker.unprojectToPlane(e, planeOrigin);
    const startPoint = picked ? picked.position.clone() : unprojected;

    this.startWorldPos = startPoint;
    this.selectedSource = picked;
    this.isDragging = true;

    this.arrowController.startFromPosition(startPoint, picked);
    if (this.controls) this.controls.enabled = false;
  }

  handlePointerMove(e) {
    if (!this.isDragging || !this.startWorldPos) return;

    // Snap to candidate anchor if hovered nearby
    const hovered = this.picker.pick(e);
    let currentPoint;
    if (hovered && (!this.selectedSource || hovered.id !== this.selectedSource.id)) {
      currentPoint = hovered.position.clone();
    } else {
      currentPoint = this.picker.unprojectToPlane(e, this.startWorldPos);
    }

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
      // Tiny tap without drag — cancel active drag line
      this.arrowController.cancel();
      this.startWorldPos = null;
      return;
    }

    const target = this.picker.pick(e);
    const endPoint = (target && (!this.selectedSource || target.id !== this.selectedSource.id))
      ? target.position.clone()
      : this.picker.unprojectToPlane(e, this.startWorldPos);

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
    if (!this.currentArrow) return null;
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
