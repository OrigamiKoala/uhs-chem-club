/**
 * arrow.js — Single curved arrow interaction handler
 * Supports both mouse dragging (press on red, drag to blue, release)
 * and accessible tap-source-then-tap-destination
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
    this.isDragging = false;
    this.dragStartPos = { x: 0, y: 0 };
    this.onChange = null;
  }

  handlePointerDown(e) {
    if (e.button === 2) return; // Right-click orbits view
    const picked = this.picker.pick(e);
    this.dragStartPos = { x: e.clientX, y: e.clientY };

    if (picked) {
      if (!this.selectedSource) {
        // Must start dragging from a red region (source)
        if (picked.type && picked.type !== 'red') return;
        this.selectedSource = picked;
        this.isDragging = true;
        this.arrowController.startFrom(picked);
        if (this.controls) this.controls.enabled = false;
      } else {
        // Tap-tap flow: completing existing source
        if (picked.id !== this.selectedSource.id) {
          this.completeConnection(picked);
        } else {
          this.clear();
        }
      }
    }
  }

  handlePointerMove(e) {
    if (!this.isDragging || !this.selectedSource) return;

    // Check if hovering near a candidate target anchor
    const hovered = this.picker.pick(e);
    if (hovered && hovered.id !== this.selectedSource.id) {
      this.arrowController.updateDrag(hovered.position);
    } else {
      // Unproject to the 3D plane passing through source anchor
      const unprojected = this.picker.unprojectToPlane(e, this.selectedSource.position);
      this.arrowController.updateDrag(unprojected);
    }
  }

  handlePointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this.controls) this.controls.enabled = true;

    const dx = e.clientX - this.dragStartPos.x;
    const dy = e.clientY - this.dragStartPos.y;
    const dragDist = Math.sqrt(dx * dx + dy * dy);

    const target = this.picker.pick(e);

    if (target && target.id !== this.selectedSource.id) {
      this.completeConnection(target);
    } else if (dragDist < 8) {
      // Small click/tap without moving: leave source selected for tap-tap mode
    } else {
      // Drag released in empty space: cancel active arrow
      this.clear();
    }
  }

  completeConnection(target) {
    if (!this.selectedSource || !target) return;

    if (target.hindered) {
      if (this.onBlocked) {
        this.onBlocked(target);
      }
    }

    const completed = this.arrowController.finishAt(target);
    this.currentArrow = completed;
    this.selectedSource = null;
    this.isDragging = false;
    if (this.controls) this.controls.enabled = true;

    if (this.onChange) {
      this.onChange(this.getPayload());
    }
  }

  getPayload() {
    if (!this.currentArrow) return null;
    return { from: this.currentArrow.from, to: this.currentArrow.to };
  }

  clear() {
    this.currentArrow = null;
    this.selectedSource = null;
    this.isDragging = false;
    if (this.controls) this.controls.enabled = true;
    this.arrowController.clear();
    if (this.onChange) {
      this.onChange(null);
    }
  }
}
