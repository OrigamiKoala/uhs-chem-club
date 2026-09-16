/**
 * arrow-drag.js — Curved 3D arrow renderer and interaction controller
 * Supports pointer dragging and tap-source-then-tap-target
 */

import * as THREE from 'three';

export class ArrowController {
  constructor(scene, camera, picker) {
    this.scene = scene;
    this.camera = camera;
    this.picker = picker;
    this.activeArrowMesh = null;
    this.sourceAnchor = null;
    this.targetAnchor = null;
    this.completedArrows = []; // array of { id, from, to, startPos, endPos, mesh, badgeSprite, order }
    this.maxArrows = 1;
    this.multiArrow = false;
    this.onArrowComplete = null;
    this.onArrowsChanged = null;

    this.material = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.9
    });
    this.startPosition = null;
  }

  setMultiArrow(enabled, maxArrows = 4) {
    this.multiArrow = !!enabled;
    this.maxArrows = enabled ? maxArrows : 1;
  }

  startFromPosition(pos, anchor = null) {
    this.startPosition = pos.clone();
    this.sourceAnchor = anchor;
    this.targetAnchor = null;
    this.removeActiveMesh();
  }

  startFrom(anchor) {
    if (!anchor) return;
    this.startFromPosition(anchor.position, anchor);
  }

  updateDrag(currentPoint) {
    const origin = this.startPosition || (this.sourceAnchor ? this.sourceAnchor.position : null);
    if (!origin) return;
    this.renderArrow(origin, currentPoint);
  }

  finishAtPosition(startPos, endPos, sourceAnchor = null, targetAnchor = null) {
    const start = startPos || this.startPosition || (sourceAnchor ? sourceAnchor.position : null);
    const end = endPos || (targetAnchor ? targetAnchor.position : null);
    if (!start || !end) {
      this.cancel();
      return null;
    }

    if (start.distanceTo(end) < 0.15) {
      this.cancel();
      return null;
    }

    if (!this.multiArrow) {
      this.clear();
    } else if (this.completedArrows.length >= this.maxArrows) {
      // Reached max arrows limit, cancel this addition
      this.cancel();
      return null;
    }

    const order = this.completedArrows.length + 1;
    const { group, midPos } = this.createPersistentArrow(start, end);
    const badgeSprite = this.multiArrow ? this.createBadgeSprite(order, midPos) : null;

    const arrowObj = {
      id: 'arrow_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      from: sourceAnchor ? sourceAnchor.id : null,
      to: targetAnchor ? targetAnchor.id : null,
      startPos: start.clone(),
      endPos: end.clone(),
      midPos: midPos.clone(),
      mesh: group,
      badgeSprite,
      order
    };

    this.completedArrows.push(arrowObj);
    this.removeActiveMesh();

    this.startPosition = null;
    this.sourceAnchor = null;
    this.targetAnchor = null;

    if (this.onArrowComplete) this.onArrowComplete(arrowObj);
    if (this.onArrowsChanged) this.onArrowsChanged(this.completedArrows);
    return arrowObj;
  }

  finishAt(anchor) {
    const start = this.startPosition || (this.sourceAnchor ? this.sourceAnchor.position : null);
    if (!start || !anchor) {
      this.cancel();
      return null;
    }
    return this.finishAtPosition(start, anchor.position, this.sourceAnchor, anchor);
  }

  cancel() {
    this.removeActiveMesh();
    this.startPosition = null;
    this.sourceAnchor = null;
    this.targetAnchor = null;
  }

  clear() {
    this.cancel();
    for (const item of this.completedArrows) {
      if (item.mesh) {
        this.scene.remove(item.mesh);
        item.mesh.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
      if (item.badgeSprite) {
        this.scene.remove(item.badgeSprite);
        item.badgeSprite.material?.map?.dispose();
        item.badgeSprite.material?.dispose();
      }
    }
    this.completedArrows = [];
    if (this.onArrowsChanged) this.onArrowsChanged(this.completedArrows);
  }

  removeArrow(index) {
    if (index < 0 || index >= this.completedArrows.length) return;
    const item = this.completedArrows[index];
    if (item.mesh) {
      this.scene.remove(item.mesh);
      item.mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    if (item.badgeSprite) {
      this.scene.remove(item.badgeSprite);
      item.badgeSprite.material?.map?.dispose();
      item.badgeSprite.material?.dispose();
    }
    this.completedArrows.splice(index, 1);

    // Renumber remaining arrows
    this.renumberArrows();
    if (this.onArrowsChanged) this.onArrowsChanged(this.completedArrows);
  }

  renumberArrows() {
    // Sort arrows by order then assign 1, 2, 3...
    this.completedArrows.sort((a, b) => a.order - b.order);
    this.completedArrows.forEach((arr, i) => {
      arr.order = i + 1;
      this.updateBadgeTexture(arr.badgeSprite, arr.order);
    });
  }

  cycleArrowOrder(index) {
    if (this.completedArrows.length <= 1) return;
    const count = this.completedArrows.length;
    const currOrder = this.completedArrows[index].order;
    const nextOrder = currOrder >= count ? 1 : currOrder + 1;

    // Swap order with the arrow currently having nextOrder
    const other = this.completedArrows.find(a => a.order === nextOrder);
    if (other) {
      other.order = currOrder;
      this.updateBadgeTexture(other.badgeSprite, other.order);
    }
    this.completedArrows[index].order = nextOrder;
    this.updateBadgeTexture(this.completedArrows[index].badgeSprite, nextOrder);

    // Keep completedArrows sorted by order
    this.completedArrows.sort((a, b) => a.order - b.order);
    if (this.onArrowsChanged) this.onArrowsChanged(this.completedArrows);
  }

  setArrowOrder(index, newOrder) {
    if (index < 0 || index >= this.completedArrows.length) return;
    const target = this.completedArrows[index];
    const other = this.completedArrows.find(a => a !== target && a.order === newOrder);
    if (other) {
      other.order = target.order;
      this.updateBadgeTexture(other.badgeSprite, other.order);
    }
    target.order = newOrder;
    this.updateBadgeTexture(target.badgeSprite, target.order);
    this.completedArrows.sort((a, b) => a.order - b.order);
    if (this.onArrowsChanged) this.onArrowsChanged(this.completedArrows);
  }

  pickArrowOrBadge(e) {
    const rect = this.camera ? this.picker.domElement.getBoundingClientRect() : null;
    if (!rect) return null;
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // 1. Check badge hit
    for (let i = 0; i < this.completedArrows.length; i++) {
      const arr = this.completedArrows[i];
      if (arr.badgeSprite) {
        const hits = raycaster.intersectObject(arr.badgeSprite);
        if (hits.length > 0) {
          return { type: 'badge', index: i, arrow: arr };
        }
      }
    }

    // 2. Check arrow mesh hit (tube or cone)
    for (let i = 0; i < this.completedArrows.length; i++) {
      const arr = this.completedArrows[i];
      if (arr.mesh) {
        const hits = raycaster.intersectObjects(arr.mesh.children, true);
        if (hits.length > 0) {
          return { type: 'arrow', index: i, arrow: arr };
        }
      }
    }

    return null;
  }

  createBadgeSprite(order, pos) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    this.drawBadgeOnCanvas(canvas, order);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.65, 0.65, 1);
    sprite.position.copy(pos).add(new THREE.Vector3(0, 0.28, 0));
    sprite.renderOrder = 1000;
    this.scene.add(sprite);
    return sprite;
  }

  updateBadgeTexture(sprite, order) {
    if (!sprite || !sprite.material || !sprite.material.map) return;
    const canvas = sprite.material.map.image;
    if (canvas && canvas.getContext) {
      this.drawBadgeOnCanvas(canvas, order);
      sprite.material.map.needsUpdate = true;
    }
  }

  drawBadgeOnCanvas(canvas, order) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    // Glowing outer circle
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fillStyle = '#0c0d11';
    ctx.fill();

    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ff9f1c';
    ctx.shadowColor = '#ff9f1c';
    ctx.shadowBlur = 16;
    ctx.stroke();

    // Number text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(order), 64, 66);
  }

  flashError() {
    for (const item of this.completedArrows) {
      if (item.mesh) {
        item.mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.setHex(0xd90429);
          }
        });
      }
    }
  }

  removeActiveMesh() {
    if (this.activeArrowMesh) {
      this.scene.remove(this.activeArrowMesh);
      this.activeArrowMesh.geometry?.dispose();
      this.activeArrowMesh = null;
    }
  }

  renderArrow(startVec, endVec) {
    this.removeActiveMesh();
    const { group } = this.createArrowMesh(startVec, endVec, 0.085, 0xffd166);
    this.activeArrowMesh = group;
    this.scene.add(this.activeArrowMesh);
  }

  createPersistentArrow(startVec, endVec) {
    const { group, controlPoint } = this.createArrowMesh(startVec, endVec, 0.095, 0x00ff88);
    this.scene.add(group);
    return { group, midPos: controlPoint };
  }

  createArrowMesh(start, end, radius = 0.085, color = 0xffd166) {
    const group = new THREE.Group();

    // Compute curved midpoint
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    if (len < 0.05) return { group, controlPoint: mid };

    // Arch upwards relative to camera
    const up = new THREE.Vector3(0, 1, 0);
    const archOffset = up.clone().multiplyScalar(Math.min(len * 0.45, 0.9));
    const controlPoint = mid.clone().add(archOffset);

    const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, radius, 12, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: false });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.renderOrder = 999;
    group.add(tubeMesh);

    // Arrowhead cone
    const coneGeo = new THREE.ConeGeometry(radius * 2.6, radius * 4.2, 16);
    const coneMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: false });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.renderOrder = 999;

    // Position cone at end and orient along tangent
    const tangent = curve.getTangent(1.0).normalize();
    coneMesh.position.copy(end);
    coneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    group.add(coneMesh);

    return { group, controlPoint };
  }
}
