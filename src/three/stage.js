/**
 * stage.js — The master WebGL renderer and animation loop
 * Manages color management, quality tiers, background pausing, scene swapping ('ship' | 'world' | 'quest'),
 * and unconstrained first-person WASD navigation with physics collisions and diegetic interaction.
 */

import * as THREE from "three";
import { tierManager, tierAtLeast } from "./tier.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CameraRig } from "./camera-rig.js";
import { ShipInterior } from "./ship.js";
import { createStarfield } from "./materials/starfield.js";
import { WorldScene } from "./world.js";
import { FpsControls } from "./fps-controls.js";
import { session } from "../session.js";

class Stage {
  constructor() {
    this.canvas = null;
    this.renderer = null;
    this.camera = null;
    this.cameraRig = null;
    this.fpsControls = null;

    this.shipScene = null;
    this.shipInterior = null;
    this.worldScene = null;
    this.activeQuestScene = null;
    this.activeQuestViewer = null;

    this.starfield = null;
    this.isPaused = false;
    this.clock = new THREE.Clock();
    this.mode = "ship"; // 'ship' | 'world' | 'quest'
  }

  init() {
    this.canvas = document.getElementById("webgl-canvas");
    if (!this.canvas) return;

    tierManager.init();
    if (tierManager.currentTier === "T1") {
      return; // Skip WebGL initialization on T1
    }

    // 1. Perspective Camera
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.55, 1.8);
    this.camera.lookAt(0, 1.55, 20);

    // 2. WebGL Renderer with proper color management
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: tierAtLeast("T3"),
      powerPreference: "high-performance"
    });

    this.renderer.setSize(width, height);
    this.applyTierSettings(tierManager.currentTier);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 3. Persistent Ship Scene
    this.shipScene = new THREE.Scene();
    this.shipScene.background = new THREE.Color(0x020203);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.shipScene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.shipScene.environmentIntensity = 0.22;
    pmrem.dispose();

    // Lighting rig: starlight + warm cockpit avionics glow
    const ambientLight = new THREE.AmbientLight(0x141824, 1.1);
    const starlight = new THREE.DirectionalLight(0xdce6f8, 2.2);
    starlight.position.set(12, 16, -28);

    const cockpitDashLight = new THREE.PointLight(0xff9f1c, 1.3, 8);
    cockpitDashLight.position.set(0, 1.1, 0.4);

    const overheadLight = new THREE.PointLight(0xffd166, 0.6, 6);
    overheadLight.position.set(0, 3.0, 0.2);

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
    const starCount = tierAtLeast("T3") ? 9000 : 4000;
    this.starfield = createStarfield(starCount, 600);
    this.shipScene.add(this.starfield);

    // Ship Interior Model
    this.shipInterior = new ShipInterior(this.shipScene);

    // Sync in-world 3D displays with session state
    const syncShipDisplays = () => {
      if (!this.shipInterior) return;
      const prog = (session.progress || []).find(p => p.quest_id === "q1");
      let reached = prog && typeof prog.stage_reached === "number" ? Number(prog.stage_reached) : 0;
      try {
        const local = parseInt(localStorage.getItem("avalon_q1_stage_reached"), 10);
        if (!isNaN(local)) reached = Math.max(reached, local);
      } catch (e) {}

      const questData = {
        cleared: Math.min(reached, 20),
        total: 20,
        transmission: reached >= 20 ? "SECTOR 01 COMPLETE" : `PYLON ${reached + 1} AWAITS CONNECTION`
      };

      const standingsData = {
        teams: (session.teams && session.teams.length) ? session.teams.map(t => ({
          name: t.name || t.team_id,
          score: t.score || t.xp || 0
        })) : [
          { name: 'Earth', score: 1420 },
          { name: 'Fire', score: 1180 },
          { name: 'Water', score: 950 },
          { name: 'Air', score: 810 }
        ],
        chatter: session.player ? `PILOT: ${session.player.display_name || session.player.email || 'CADET'}` : 'COMMS MONITOR: STANDBY'
      };

      const inventoryData = {
        count: Array.isArray(session.inventory) ? session.inventory.length : 0,
        max: 8,
        trinket: session.player?.trinket || 'SPECTROMETER'
      };

      this.shipInterior.updateDisplays(questData, standingsData, inventoryData);
    };

    session.subscribe(syncShipDisplays);
    syncShipDisplays();

    // Camera Rig
    this.cameraRig = new CameraRig(this.camera);

    // 4. First-person WASD controls with collision sliding and interaction
    this.fpsControls = new FpsControls(this.camera, this.canvas);
    this.fpsControls.enabled = Boolean(session.token && session.player);
    this.fpsControls.setMode(
      "ship",
      null,
      { minX: -7.8, maxX: 7.8, minZ: -8.5, maxZ: 3.8 },
      this.shipInterior.colliders
    );

    this.fpsControls.onInteract = () => {
      if (this.mode === "world" && this.worldScene) {
        if (this.worldScene.nearbySite) {
          const pylonEvent = new CustomEvent("pylon:interact", { detail: this.worldScene.nearbySite });
          window.dispatchEvent(pylonEvent);
        } else if (Math.hypot(this.camera.position.x, this.camera.position.z - 44) < 4.0) {
          window.location.hash = "#/bridge";
        }
      } else if (this.mode === "ship") {
        const px = this.camera.position.x;
        const pz = this.camera.position.z;
        if (pz < -5.0 && Math.abs(px) < 2.0) {
          window.location.hash = "#/quest";
        } else if (Math.hypot(px - 3.2, pz - 1.8) < 2.2) {
          window.location.hash = "#/starmap";
        } else if (Math.hypot(px - 4.2, pz - (-2.2)) < 2.4) {
          window.location.hash = "#/inventory";
        } else if (Math.hypot(px - (-2.8), pz - (-2.0)) < 2.2) {
          window.location.hash = "#/leaderboard";
        } else if (Math.hypot(px - (-3.8), pz - 2.2) < 2.2) {
          window.location.hash = "#/quarters";
        } else if (Math.hypot(px, pz - 1.6) < 1.4) {
          window.location.hash = "#/settings";
        }
      }
    };

    // 5. Bind Events & Lifecycle
    window.addEventListener("resize", this.onResize.bind(this));
    document.addEventListener("visibilitychange", this.onVisibilityChange.bind(this));
    tierManager.subscribe((tier) => this.applyTierSettings(tier));

    // 6. Start Animation Loop
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  applyTierSettings(tier) {
    if (!this.renderer) return;
    if (tier === "T1") {
      this.renderer.setAnimationLoop(null);
      return;
    }
    const maxDpr = tierAtLeast("T3", tier) ? Math.min(window.devicePixelRatio, 2) : 1;
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

  enterWorldScene() {
    if (!this.worldScene && this.renderer) {
      this.worldScene = new WorldScene(this.renderer);
    }
    this.mode = "world";

    if (this.worldScene) {
      const spawn = this.worldScene.data.spawn;
      this.camera.position.set(spawn.pos[0], spawn.pos[1], spawn.pos[2]);
      this.camera.lookAt(spawn.lookAt[0], spawn.lookAt[1], spawn.lookAt[2]);
      if (this.fpsControls) {
        this.fpsControls.setMode(
          "world",
          (x, z) => this.worldScene.getTerrainHeight(x, z),
          { minX: -85, maxX: 85, minZ: -85, maxZ: 85 },
          this.worldScene.colliders
        );
      }
    }
  }

  enterShipScene(locationKey = "bridge") {
    this.mode = "ship";
    if (this.fpsControls) {
      this.fpsControls.setMode(
        "ship",
        null,
        { minX: -7.8, maxX: 7.8, minZ: -8.5, maxZ: 3.8 },
        this.shipInterior ? this.shipInterior.colliders : []
      );
    }
    if (this.cameraRig) {
      this.cameraRig.moveTo(locationKey);
    }
  }

  setQuestScene(questViewer) {
    if (this.activeQuestViewer && this.activeQuestViewer !== questViewer) {
      this.activeQuestViewer.dispose();
    }
    this.activeQuestViewer = questViewer;
    this.activeQuestScene = questViewer ? questViewer.scene : null;
    this.mode = questViewer ? "quest" : "world";
    if (this.fpsControls) this.fpsControls.hidePrompt();
  }

  exitQuestScene() {
    if (this.activeQuestViewer) {
      this.activeQuestViewer.dispose();
      this.activeQuestViewer = null;
    }
    this.activeQuestScene = null;
    this.mode = "world";
  }

  render(now) {
    if (this.isPaused || !this.renderer) return;

    tierManager.recordFrame(now);
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.mode === "quest" && this.activeQuestViewer) {
      this.activeQuestViewer.update(delta, time);
      this.renderer.render(this.activeQuestScene, this.activeQuestViewer.camera);
    } else if (this.mode === "world" && this.worldScene) {
      if (this.fpsControls) {
        this.fpsControls.update(delta);
        if (this.worldScene.nearbySite) {
          this.fpsControls.showPrompt(`[E] DEPLOY CHAMBER AT ${this.worldScene.nearbySite.label.toUpperCase()}`);
        } else if (Math.hypot(this.camera.position.x, this.camera.position.z - 44) < 4.0) {
          this.fpsControls.showPrompt("[E] BOARD SURVEY LANDER (RETURN TO SHIP)");
        } else {
          this.fpsControls.hidePrompt();
        }
      }
      this.worldScene.update(delta, this.camera.position);
      this.renderer.render(this.worldScene.scene, this.camera);
    } else {
      // Ship Mode
      const canMove = Boolean(session.token && session.player);
      if (this.fpsControls) {
        this.fpsControls.enabled = canMove;
      }

      if (this.cameraRig && this.cameraRig.isTransitioning) {
        this.cameraRig.update(now);
      } else if (this.fpsControls && canMove) {
        this.fpsControls.update(delta);
        const px = this.camera.position.x;
        const pz = this.camera.position.z;
        if (pz < -5.0 && Math.abs(px) < 2.0) {
          this.fpsControls.showPrompt("[E] AIRLOCK: DISEMBARK TO EREBUS (CHARGE GARDENS)");
        } else if (Math.hypot(px - 3.2, pz - 1.8) < 2.2) {
          this.fpsControls.showPrompt("[E] ACCESS STAR MAP & NAVIGATION");
        } else if (Math.hypot(px - 4.2, pz - (-2.2)) < 2.4) {
          this.fpsControls.showPrompt("[E] ACCESS CARGO & INVENTORY");
        } else if (Math.hypot(px - (-2.8), pz - (-2.0)) < 2.2) {
          this.fpsControls.showPrompt("[E] ACCESS SUB-SPACE COMMS RELAY");
        } else if (Math.hypot(px - (-3.8), pz - 2.2) < 2.2) {
          this.fpsControls.showPrompt("[E] ACCESS CREW QUARTERS & LOGS");
        } else if (Math.hypot(px, pz - 1.6) < 1.4) {
          this.fpsControls.showPrompt("[E] ACCESS FLIGHT COCKPIT & SETTINGS");
        } else {
          this.fpsControls.hidePrompt();
        }
      } else if (this.fpsControls) {
        this.fpsControls.hidePrompt();
      }

      if (this.shipInterior) this.shipInterior.update(delta, time);
      if (this.starfield) this.starfield.rotation.y += delta * 0.002;
      this.renderer.render(this.shipScene, this.camera);
    }
  }
}

export const stage = new Stage();
