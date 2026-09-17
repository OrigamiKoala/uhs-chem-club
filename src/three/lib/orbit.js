/**
 * orbit.js — Lightweight pointer-driven camera orbit controls
 * Clamped polar angle, smooth damping, pinch zoom support
 */

import * as THREE from 'three';

export class SmoothOrbitControls {
  constructor(camera, domElement, target = new THREE.Vector3()) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = target;

    this.radius = camera.position.distanceTo(target) || 5;
    this.theta = Math.atan2(camera.position.x - target.x, camera.position.z - target.z);
    this.phi = Math.acos(Math.max(-1, Math.min(1, (camera.position.y - target.y) / this.radius)));

    this.targetTheta = this.theta;
    this.targetPhi = this.phi;
    this.targetRadius = this.radius;

    this.minPhi = 0.15;
    this.maxPhi = Math.PI - 0.15;
    this.minRadius = 1.5;
    this.maxRadius = 18.0;

    this.isDragging = false;
    this.previousPointer = { x: 0, y: 0 };
    this.pointerDownPos = { x: 0, y: 0 };
    this.pointerDownTime = 0;
    this.dragDistance = 0;
    this.activeTouches = new Map();
    this.damping = 0.12;
    this.enabled = true;
    this.mode = 'draw'; // 'draw' | 'rotate'

    this._onPointerDown = this.onPointerDown.bind(this);
    this._onPointerMove = this.onPointerMove.bind(this);
    this._onPointerUp = this.onPointerUp.bind(this);
    this._onPointerCancel = this.onPointerCancel.bind(this);
    this._onWheel = this.onWheel.bind(this);
    this._onContextMenu = (e) => e.preventDefault();

    this.bindEvents();
  }

  bindEvents() {
    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerCancel);
    this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this._onContextMenu);
    window.addEventListener('contextmenu', (e) => {
      if (e.target === this.domElement || this.domElement.contains(e.target)) {
        e.preventDefault();
      }
    });
  }

  destroy() {
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerCancel);
    this.domElement.removeEventListener('wheel', this._onWheel);
    this.domElement.removeEventListener('contextmenu', this._onContextMenu);
  }

  setMode(mode) {
    this.mode = mode;
  }

  stepRotate(angle = Math.PI / 4) {
    this.targetTheta += angle;
  }

  onPointerDown(e) {
    // Touches are counted even while an arrow drag has the controls disabled,
    // so a second finger can still take over as a two-finger rotate.
    if (e.pointerType === 'touch') {
      this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.activeTouches.size >= 2) {
        this.isDragging = true;
        this.pointerDownTime = Date.now();
        this.dragDistance = 0;
        const pts = Array.from(this.activeTouches.values());
        this.previousPointer.x = (pts[0].x + pts[1].x) / 2;
        this.previousPointer.y = (pts[0].y + pts[1].y) / 2;
        this.pointerDownPos = { ...this.previousPointer };
        return;
      }
    }

    if (!this.enabled) return;

    // In draw mode, button 2 (two-finger tap / right-click on Mac) rotates view
    const isRotateButton = (this.mode === 'rotate' && e.button === 0) || e.button === 2;
    if (!isRotateButton) return;

    this.isDragging = true;
    this.pointerDownTime = Date.now();
    this.dragDistance = 0;
    this.previousPointer.x = e.clientX;
    this.previousPointer.y = e.clientY;
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
  }

  onPointerMove(e) {
    if (!this.enabled || !this.isDragging) return;

    if (e.pointerType === 'touch' && this.activeTouches.has(e.pointerId)) {
      this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.activeTouches.size >= 2) {
        const pts = Array.from(this.activeTouches.values());
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const deltaX = midX - this.previousPointer.x;
        const deltaY = midY - this.previousPointer.y;
        this.dragDistance += Math.hypot(deltaX, deltaY);
        this.previousPointer.x = midX;
        this.previousPointer.y = midY;

        this.targetTheta -= deltaX * 0.007;
        this.targetPhi = Math.max(this.minPhi, Math.min(this.maxPhi, this.targetPhi - deltaY * 0.007));
        return;
      }
    }

    const deltaX = e.clientX - this.previousPointer.x;
    const deltaY = e.clientY - this.previousPointer.y;
    this.dragDistance += Math.hypot(deltaX, deltaY);
    this.previousPointer.x = e.clientX;
    this.previousPointer.y = e.clientY;

    this.targetTheta -= deltaX * 0.007;
    this.targetPhi = Math.max(this.minPhi, Math.min(this.maxPhi, this.targetPhi - deltaY * 0.007));
  }

  onPointerUp(e) {
    if (e?.pointerType === 'touch' && this.activeTouches.has(e.pointerId)) {
      const hadTwoTouches = this.activeTouches.size >= 2;
      this.activeTouches.delete(e.pointerId);
      if (hadTwoTouches) {
        const duration = Date.now() - this.pointerDownTime;
        if (this.dragDistance < 12 && duration < 350) {
          // Quick two-finger tap: step rotate view 45 degrees
          this.stepRotate(Math.PI / 4);
        }
        this.isDragging = false;
        return;
      }
    }

    if (this.isDragging) {
      const isRotateButton = (this.mode === 'rotate' && e?.button === 0) || e?.button === 2;
      const duration = Date.now() - this.pointerDownTime;
      // Quick two-finger tap on Mac trackpad (right-click release with negligible drag):
      if (isRotateButton && this.dragDistance < 8 && duration < 350) {
        this.stepRotate(Math.PI / 4);
      }
      this.isDragging = false;
    }
  }

  /** A cancelled touch never sends pointerup; forget it so it can't pose as a second finger. */
  onPointerCancel(e) {
    if (e.pointerType === 'touch') this.activeTouches.delete(e.pointerId);
    if (this.activeTouches.size < 2) this.isDragging = false;
  }

  onWheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    this.targetRadius = Math.max(this.minRadius, Math.min(this.maxRadius, this.targetRadius + e.deltaY * 0.005));
  }

  update() {
    this.theta += (this.targetTheta - this.theta) * this.damping;
    this.phi += (this.targetPhi - this.phi) * this.damping;
    this.radius += (this.targetRadius - this.radius) * this.damping;

    const x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.target.y + this.radius * Math.cos(this.phi);
    const z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }
}
