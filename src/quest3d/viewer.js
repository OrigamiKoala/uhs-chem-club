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
    // Balanced neutral illumination for accurate electron density and molecular rendering
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(3, 6, 5);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-4, -2, 3);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 4, -4);
    this.scene.add(ambient, keyLight, fillLight, rimLight);
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
    // Stage completed successfully
  }

  triggerFailure() {
    this.triggerShudder();
    if (this.arrowController && this.arrowController.flashError) {
      this.arrowController.flashError();
    }
  }

  triggerShudder() {
    const origX = this.camera.position.x;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      this.camera.position.x = origX + (Math.random() - 0.5) * 0.25;
      if (step >= 10) {
        clearInterval(interval);
        this.camera.position.x = origX;
      }
    }, 35);
  }

  update(delta = 0.016, time = 0) {
    this.controls.update();
    if (this.currentIsosurface) {
      this.currentIsosurface.update(time);
    }
    this.anchorManager.update(this.camera, time);
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
