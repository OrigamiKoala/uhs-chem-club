/**
 * fps-controls.js — First-Person WASD + Mouse Look controller with sliding physics collision
 * Handles pointer lock, drag-look fallback, smooth kinematic movement,
 * AABB and radial cylinder collision sliding, terrain clamping, and [E] interaction.
 */

import * as THREE from "three";

export class FpsControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document.body;
    this.enabled = true;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;

    // Speeds & kinematics
    this.walkSpeed = 4.2; // m/s
    this.sprintSpeed = 7.0; // m/s
    this.damping = 10.0;
    this.velocity = new THREE.Vector3();
    this.playerRadius = 0.35;

    // Orientation
    this.euler = new THREE.Euler(0, 0, 0, "YXZ");
    this.isPointerLocked = false;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    // Height & environment
    this.eyeHeight = 1.6;
    this.terrainHeightFn = null;
    this.boundaryBounds = null; // { minX, maxX, minZ, maxZ }
    this.boxColliders = []; // [{ minX, maxX, minZ, maxZ }]
    this.radialColliders = []; // [{ x, z, radius }]
    this.onInteract = null; // Callback for [E] / click on interactive target

    // UI Prompt element
    this.promptEl = null;
    this.initPromptUI();

    // Event handlers bound to instance
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onPointerlockChange = this.onPointerlockChange.bind(this);

    this.bindEvents();
  }

  initPromptUI() {
    let el = document.getElementById("fps-interact-prompt");
    if (!el) {
      el = document.createElement("div");
      el.id = "fps-interact-prompt";
      el.style.position = "fixed";
      el.style.bottom = "80px";
      el.style.left = "50%";
      el.style.transform = "translateX(-50%)";
      el.style.padding = "6px 14px";
      el.style.background = "rgba(18, 20, 24, 0.88)";
      el.style.border = "1px solid #d99423";
      el.style.color = "#d99423";
      el.style.fontFamily = "'Share Tech Mono', monospace";
      el.style.fontSize = "13px";
      el.style.letterSpacing = "0.1em";
      el.style.pointerEvents = "none";
      el.style.display = "none";
      el.style.zIndex = "1000";
      document.body.appendChild(el);
    }
    this.promptEl = el;
  }

  showPrompt(text) {
    if (this.promptEl) {
      this.promptEl.textContent = text;
      this.promptEl.style.display = "block";
    }
  }

  hidePrompt() {
    if (this.promptEl) {
      this.promptEl.style.display = "none";
    }
  }

  bindEvents() {
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    document.addEventListener("pointerlockchange", this._onPointerlockChange);

    this.domElement.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mouseup", this._onMouseUp);
    window.addEventListener("mousemove", this._onMouseMove);
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    document.removeEventListener("pointerlockchange", this._onPointerlockChange);

    this.domElement.removeEventListener("mousedown", this._onMouseDown);
    window.removeEventListener("mouseup", this._onMouseUp);
    window.removeEventListener("mousemove", this._onMouseMove);
    if (this.promptEl && this.promptEl.parentNode) {
      this.promptEl.parentNode.removeChild(this.promptEl);
    }
  }

  requestPointerLock() {
    if (!this.isPointerLocked && this.domElement.requestPointerLock) {
      this.domElement.requestPointerLock();
    }
  }

  exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  onPointerlockChange() {
    this.isPointerLocked = (document.pointerLockElement === this.domElement);
  }

  onMouseDown(e) {
    if (!this.enabled) return;
    if (e.button === 0) { // Left click
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      if (e.target === this.domElement) {
        this.requestPointerLock();
      }
    }
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onMouseMove(e) {
    if (!this.enabled) return;

    let movementX = 0;
    let movementY = 0;

    if (this.isPointerLocked) {
      movementX = e.movementX || 0;
      movementY = e.movementY || 0;
    } else if (this.isDragging) {
      movementX = e.clientX - this.previousMousePosition.x;
      movementY = e.clientY - this.previousMousePosition.y;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    } else {
      return;
    }

    const sensitivity = 0.0024;
    this.euler.setFromQuaternion(this.camera.quaternion);

    this.euler.y -= movementX * sensitivity;
    this.euler.x -= movementY * sensitivity;

    const maxPitch = (85 * Math.PI) / 180;
    this.euler.x = Math.max(-maxPitch, Math.min(maxPitch, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  }

  onKeyDown(e) {
    if (!this.enabled) return;
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        this.moveForward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.moveBackward = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.moveLeft = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.moveRight = true;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.isSprinting = true;
        break;
      case "KeyE":
        if (this.onInteract) {
          this.onInteract();
        }
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        this.moveForward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        this.moveBackward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.moveLeft = false;
        break;
      case "KeyD":
      case "ArrowRight":
        this.moveRight = false;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.isSprinting = false;
        break;
    }
  }

  setMode(mode, terrainFn = null, bounds = null, colliders = []) {
    this.terrainHeightFn = terrainFn;
    this.boundaryBounds = bounds;

    this.boxColliders = [];
    this.radialColliders = [];

    for (const c of colliders) {
      if (c.radius !== undefined) {
        this.radialColliders.push(c);
      } else if (c.minX !== undefined) {
        this.boxColliders.push(c);
      }
    }
  }

  testBoxCollision(x, z) {
    const r = this.playerRadius;
    for (const b of this.boxColliders) {
      if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ) {
        return true;
      }
    }
    return false;
  }

  resolveRadialCollisions(pos) {
    const r = this.playerRadius;
    for (const c of this.radialColliders) {
      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const dist = Math.hypot(dx, dz);
      const minDist = c.radius + r;
      if (dist < minDist && dist > 0.0001) {
        const nx = dx / dist;
        const nz = dz / dist;
        pos.x = c.x + nx * minDist;
        pos.z = c.z + nz * minDist;
      }
    }
  }

  update(delta) {
    if (!this.enabled) return;

    const dt = Math.min(delta, 0.1);

    this.velocity.x -= this.velocity.x * this.damping * dt;
    this.velocity.z -= this.velocity.z * this.damping * dt;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    if (forward.lengthSq() > 0.0001) forward.normalize();

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    right.y = 0;
    if (right.lengthSq() > 0.0001) right.normalize();

    const moveDir = new THREE.Vector3();
    if (this.moveForward) moveDir.add(forward);
    if (this.moveBackward) moveDir.sub(forward);
    if (this.moveRight) moveDir.add(right);
    if (this.moveLeft) moveDir.sub(right);

    if (moveDir.lengthSq() > 0.0001) {
      moveDir.normalize();
      const speed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;
      this.velocity.x += moveDir.x * speed * 8.0 * dt;
      this.velocity.z += moveDir.z * speed * 8.0 * dt;
    }

    // Attempt translation with sliding collision
    const nextX = this.camera.position.x + this.velocity.x * dt;
    const nextZ = this.camera.position.z + this.velocity.z * dt;

    // Test X move
    if (!this.testBoxCollision(nextX, this.camera.position.z)) {
      this.camera.position.x = nextX;
    } else {
      this.velocity.x = 0;
    }

    // Test Z move
    if (!this.testBoxCollision(this.camera.position.x, nextZ)) {
      this.camera.position.z = nextZ;
    } else {
      this.velocity.z = 0;
    }

    // Resolve radial obstacle collisions (e.g. pylons, rocks, lander)
    this.resolveRadialCollisions(this.camera.position);

    // Boundary constraints
    if (this.boundaryBounds) {
      const b = this.boundaryBounds;
      const r = this.playerRadius;
      this.camera.position.x = Math.max(b.minX + r, Math.min(b.maxX - r, this.camera.position.x));
      this.camera.position.z = Math.max(b.minZ + r, Math.min(b.maxZ - r, this.camera.position.z));
    }

    // Clamping to ground height
    if (this.terrainHeightFn) {
      const groundY = this.terrainHeightFn(this.camera.position.x, this.camera.position.z);
      this.camera.position.y = groundY + this.eyeHeight;
    } else {
      this.camera.position.y = this.eyeHeight;
    }
  }
}
