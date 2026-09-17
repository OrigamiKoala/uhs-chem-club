/**
 * stage.js — The master WebGL renderer and animation loop
 * Manages color management, quality tiers, background pausing, and scene swapping
 */

import * as THREE from 'three';
import { tierManager } from './tier.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraRig } from './camera-rig.js';
import { ShipInterior } from './ship.js';
import { createStarfield } from './materials/starfield.js';

class Stage {
  constructor() {
    this.canvas = null;
    this.renderer = null;
    this.camera = null;
    this.cameraRig = null;

    this.shipScene = null;
    this.shipInterior = null;
    this.activeQuestScene = null;
    this.activeQuestViewer = null;

    this.starfield = null;
    this.isPaused = false;
    this.clock = new THREE.Clock();
    this.mode = 'ship'; // 'ship' | 'quest'
  }

  init() {
    this.canvas = document.getElementById('webgl-canvas');
    if (!this.canvas) return;

    tierManager.init();
    if (tierManager.currentTier === 'T1') {
      return; // Skip WebGL initialization on T1
    }

    // 1. Perspective Camera
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.8, 4.8);

    // 2. WebGL Renderer with proper color management
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: tierManager.currentTier === 'T3',
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(width, height);
    this.applyTierSettings(tierManager.currentTier);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 3. Persistent Ship Scene
    this.shipScene = new THREE.Scene();
    this.shipScene.background = new THREE.Color(0x020203);

    // Soft reflection environment so worn metal reads as metal instead of flat black.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.shipScene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.shipScene.environmentIntensity = 0.22;
    pmrem.dispose();

    // Star Wars / Dune Space Opera lighting rig: crisp cosmic starlight + warm cockpit avionics glow
    const ambientLight = new THREE.AmbientLight(0x141824, 1.1);
    // Cool celestial starlight cutting through the forward cockpit canopy
    const starlight = new THREE.DirectionalLight(0xdce6f8, 2.2);
    starlight.position.set(12, 16, -28);

    // Cockpit instrument glow (warm amber phosphor from flight dash)
    const cockpitDashLight = new THREE.PointLight(0xff9f1c, 1.3, 8);
    cockpitDashLight.position.set(0, 1.1, 0.4);

    // Overhead avionics switchboard light
    const overheadLight = new THREE.PointLight(0xffd166, 0.6, 6);
    overheadLight.position.set(0, 3.0, 0.2);

    // Section task lights
    const holoTableLight = new THREE.PointLight(0xff9f1c, 1.4, 12);
    holoTableLight.position.set(3.2, 2.4, 0);

    const commsLight = new THREE.PointLight(0x48c715, 0.5, 6);
    commsLight.position.set(-2.8, 2.0, -3.6);

    const quartersLight = new THREE.PointLight(0xffaa50, 0.7, 7);
    quartersLight.position.set(-3.8, 1.8, 0.5);

    const cargoLight = new THREE.PointLight(0xe09838, 0.9, 10);
    cargoLight.position.set(4.2, 3.0, -3.8);

    this.shipScene.add(ambientLight, starlight, cockpitDashLight, overheadLight, holoTableLight, commsLight, quartersLight, cargoLight);

    // Starfield
    const starCount = tierManager.currentTier === 'T3' ? 9000 : 4000;
    this.starfield = createStarfield(starCount, 600);
    this.shipScene.add(this.starfield);

    // Ship Interior Model
    this.shipInterior = new ShipInterior(this.shipScene);

    // Camera Rig
    this.cameraRig = new CameraRig(this.camera);

    // 4. Bind Events & Lifecycle
    window.addEventListener('resize', this.onResize.bind(this));
    document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
    tierManager.subscribe((tier) => this.applyTierSettings(tier));

    // 5. Start Animation Loop
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  applyTierSettings(tier) {
    if (!this.renderer) return;
    if (tier === 'T1') {
      this.renderer.setAnimationLoop(null);
      return;
    }
    const maxDpr = tier === 'T3' ? Math.min(window.devicePixelRatio, 2) : 1;
    this.renderer.setPixelRatio(maxDpr);
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onVisibilityChange() {
    this.isPaused = document.hidden;
    if (this.isPaused) {
      this.clock.stop();
    } else {
      this.clock.start();
    }
  }

  setQuestScene(questViewer) {
    if (this.activeQuestViewer && this.activeQuestViewer !== questViewer) {
      this.activeQuestViewer.dispose();
    }
    this.activeQuestViewer = questViewer;
    this.activeQuestScene = questViewer ? questViewer.scene : null;
    this.mode = questViewer ? 'quest' : 'ship';
  }

  exitQuestScene() {
    if (this.activeQuestViewer) {
      this.activeQuestViewer.dispose();
      this.activeQuestViewer = null;
    }
    this.activeQuestScene = null;
    this.mode = 'ship';
    if (this.cameraRig) {
      this.cameraRig.moveTo('bridge');
    }
  }

  render(now) {
    if (this.isPaused || !this.renderer) return;

    tierManager.recordFrame(now);
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.mode === 'quest' && this.activeQuestViewer) {
      this.activeQuestViewer.update(delta, time);
      this.renderer.render(this.activeQuestScene, this.activeQuestViewer.camera);
    } else {
      if (this.cameraRig) this.cameraRig.update(now);
      if (this.shipInterior) this.shipInterior.update(delta, time);
      if (this.starfield) this.starfield.rotation.y += delta * 0.002;
      this.renderer.render(this.shipScene, this.camera);
    }
  }
}

export const stage = new Stage();
