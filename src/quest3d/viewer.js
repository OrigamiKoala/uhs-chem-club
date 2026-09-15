/**
 * viewer.js — The master reusable Quest 3D containment chamber
 * Powers all 7 stages of Quest 1 with stage re-configuration and clean disposal
 */

import * as THREE from 'three';
import { SmoothOrbitControls } from '../three/lib/orbit.js';
import { AnchorPicker } from '../three/lib/picker.js';
import { ArrowController } from '../three/arrow-drag.js';
import { MoleculeMesh } from './molecule.js';
import { DensityIsosurface } from './isosurface.js';
import { AnchorManager } from './anchors.js';
import { PickInteraction } from './interactions/pick.js';
import { ArrowInteraction } from './interactions/arrow.js';
import { ChainInteraction } from './interactions/chain.js';
import { RankInteraction } from './interactions/rank.js';

export class QuestViewer {
  constructor(domElement) {
    this.domElement = domElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030712);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    this.camera.position.set(0, 1.2, 5.5);

    this.controls = new SmoothOrbitControls(this.camera, this.domElement, new THREE.Vector3(0, 0, 0));
    this.picker = new AnchorPicker(this.camera, this.domElement);
    this.arrowController = new ArrowController(this.scene, this.camera, this.picker);
    this.anchorManager = new AnchorManager(this.scene);

    this.currentMolecule = null;
    this.currentIsosurface = null;
    this.activeInteraction = null;
    this.containmentRings = [];

    this.buildChamber();
    this.bindEvents();
  }

  buildChamber() {
    // Ambient & directional lighting for the containment chamber
    const ambient = new THREE.AmbientLight(0x0f172a, 1.5);
    const topLight = new THREE.DirectionalLight(0x00e5ff, 1.8);
    topLight.position.set(0, 8, 4);
    const rimLight = new THREE.PointLight(0xffea46, 1.2, 10);
    rimLight.position.set(0, -2, -3);
    this.scene.add(ambient, topLight, rimLight);

    // Three concentric alien containment rings
    for (let r = 0; r < 3; r++) {
      const radius = 3.2 + r * 0.8;
      const ringGeo = new THREE.TorusGeometry(radius, 0.04, 8, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.35 + r * 0.15
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.2 + r * 0.2;
      this.scene.add(ring);
      this.containmentRings.push(ring);
    }
  }

  bindEvents() {
    this._onPointerDown = (e) => {
      if (this.activeInteraction && this.activeInteraction.handlePointerDown) {
        this.activeInteraction.handlePointerDown(e);
      }
    };
    this._onPointerMove = (e) => {
      if (this.activeInteraction && this.activeInteraction.handlePointerMove) {
        this.activeInteraction.handlePointerMove(e);
      }
    };
    this._onPointerUp = (e) => {
      if (this.activeInteraction && this.activeInteraction.handlePointerUp) {
        this.activeInteraction.handlePointerUp(e);
      }
    };

    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  setMode(mode) {
    if (this.controls) {
      this.controls.setMode(mode);
    }
  }

  clear() {
    if (this.activeInteraction && this.activeInteraction.clear) {
      this.activeInteraction.clear();
    }
    this.arrowController.clear();
  }

  loadStage(stageConfig = {}, kind = 'pick', onPayloadChange = null) {
    // Clear previous molecules
    if (this.currentMolecule) {
      this.scene.remove(this.currentMolecule.group);
      this.currentMolecule = null;
    }
    if (this.currentIsosurface) {
      this.scene.remove(this.currentIsosurface.group);
      this.currentIsosurface.dispose();
      this.currentIsosurface = null;
    }
    this.arrowController.clear();
    this.anchorManager.clear();

    let molId = stageConfig.moleculeId;
    if (!molId || (molId === 'h2o' && kind === 'arrow')) {
      molId = 'stage1_pair';
    }

    // 1. Build molecule and density shells
    this.currentMolecule = new MoleculeMesh(molId);
    this.scene.add(this.currentMolecule.group);

    this.currentIsosurface = new DensityIsosurface(molId);
    this.scene.add(this.currentIsosurface.group);

    // 2. Load anchors
    const anchorIds = (stageConfig.anchors && stageConfig.anchors.length > 0)
      ? stageConfig.anchors
      : (this.currentMolecule?.data?.regions || []).map(r => r.id);
    const anchors = this.anchorManager.loadAnchors(anchorIds, this.currentMolecule?.data?.regions);
    this.picker.setAnchors(anchors);

    // 3. Setup interaction based on kind
    if (kind === 'arrow') {
      this.activeInteraction = new ArrowInteraction(this.arrowController, this.picker, this.controls, (blockedAnchor) => {
        this.triggerShudder();
      });
    } else if (kind === 'pick') {
      this.activeInteraction = new PickInteraction(this.picker, false);
    } else if (kind === 'pick_multi') {
      this.activeInteraction = new PickInteraction(this.picker, true);
    } else if (kind === 'chain') {
      this.activeInteraction = new ChainInteraction(this.arrowController, this.picker);
    } else if (kind === 'rank') {
      const ids = (stageConfig.items || []).map(x => x.id);
      this.activeInteraction = new RankInteraction(ids);
    } else {
      this.activeInteraction = new ArrowInteraction(this.arrowController, this.picker, this.controls, () => this.triggerShudder());
    }

    if (this.activeInteraction) {
      this.activeInteraction.onChange = (payload) => {
        if (onPayloadChange) onPayloadChange(payload);
      };
    }

    // Adjust camera framing
    if (stageConfig.camera?.pos) {
      this.camera.position.set(...stageConfig.camera.pos);
      this.controls.radius = this.camera.position.length();
    } else {
      this.camera.position.set(0, 1.2, 5.5);
      this.controls.radius = 5.5;
    }
  }

  triggerSuccessBloom() {
    for (const ring of this.containmentRings) {
      ring.material.color.setHex(0x00e676);
      ring.material.opacity = 0.9;
    }
    setTimeout(() => {
      for (let r = 0; r < this.containmentRings.length; r++) {
        this.containmentRings[r].material.color.setHex(0x00e5ff);
        this.containmentRings[r].material.opacity = 0.35 + r * 0.15;
      }
    }, 1200);
  }

  triggerShudder() {
    const origX = this.camera.position.x;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      this.camera.position.x = origX + (Math.random() - 0.5) * 0.15;
      if (step >= 8) {
        clearInterval(interval);
        this.camera.position.x = origX;
      }
    }, 40);
  }

  update(delta = 0.016, time = 0) {
    this.controls.update();
    if (this.currentIsosurface) {
      this.currentIsosurface.update(time);
    }
    this.anchorManager.update(this.camera, time);

    // Rotate containment rings slowly
    for (let i = 0; i < this.containmentRings.length; i++) {
      this.containmentRings[i].rotation.z += delta * (0.15 * (i % 2 === 0 ? 1 : -1));
    }
  }

  dispose() {
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    this.controls.destroy();
    if (this.currentIsosurface) this.currentIsosurface.dispose();
    this.anchorManager.clear();
    this.arrowController.clear();
  }
}
