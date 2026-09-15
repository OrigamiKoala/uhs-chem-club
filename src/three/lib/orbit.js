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
    this.damping = 0.12;
    this.enabled = true;
    this.mode = 'draw'; // 'draw' | 'rotate'

    this._onPointerDown = this.onPointerDown.bind(this);
    this._onPointerMove = this.onPointerMove.bind(this);
    this._onPointerUp = this.onPointerUp.bind(this);
    this._onWheel = this.onWheel.bind(this);
    this._onContextMenu = (e) => e.preventDefault();

    this.bindEvents();
  }

  bindEvents() {
    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this._onContextMenu);
  }

  destroy() {
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    this.domElement.removeEventListener('wheel', this._onWheel);
    this.domElement.removeEventListener('contextmenu', this._onContextMenu);
  }

  setMode(mode) {
    this.mode = mode;
  }

  onPointerDown(e) {
    if (!this.enabled) return;
    // In draw mode, only right-click (button 2) rotates view; left click is for drawing
    if (this.mode === 'draw' && e.button !== 2) return;
    if (e.button !== 0 && e.button !== 2) return;
    this.isDragging = true;
    this.previousPointer.x = e.clientX;
    this.previousPointer.y = e.clientY;
  }

  onPointerMove(e) {
    if (!this.enabled || !this.isDragging) return;
    const deltaX = e.clientX - this.previousPointer.x;
    const deltaY = e.clientY - this.previousPointer.y;
    this.previousPointer.x = e.clientX;
    this.previousPointer.y = e.clientY;

    this.targetTheta -= deltaX * 0.007;
    this.targetPhi = Math.max(this.minPhi, Math.min(this.maxPhi, this.targetPhi - deltaY * 0.007));
  }

  onPointerUp() {
    this.isDragging = false;
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
