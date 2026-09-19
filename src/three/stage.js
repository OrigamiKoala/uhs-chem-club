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
import { TallowWorld } from "./tallow.js";
import { FpsControls } from "./fps-controls.js";
import { session } from "../session.js";
import { ShipLightPool } from "./ship-lighting.js";

/**
 * Tone-mapping exposure per place.
 *
 * The ship is a dark interior lit by filaments; Tallow is a salt pan under flat
 * overcast, which is roughly two stops brighter in the real world. Rendering both
 * at the ship's exposure washes the crust out to white paper. Erebus keeps the
 * ship's value, which is what it was tuned against.
 */
const SHIP_EXPOSURE = 1.28;
const TALLOW_EXPOSURE = 0.92;

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
    this.tallowWorld = null;
    // Whichever world the player is standing on. `mode === "world"` renders this
    // one; there is never more than one live at a time.
    this.activeWorld = null;
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
    this.renderer.toneMappingExposure = SHIP_EXPOSURE;

    // Contact shadows are a T4 enhancement. Every world light already asks for
    // them; without this they were simply never drawn.
    if (tierAtLeast("T4")) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // 3. Persistent Ship Scene
    this.shipScene = new THREE.Scene();
    this.shipScene.background = new THREE.Color(0x020203);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.shipScene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.shipScene.environmentIntensity = 0.58;
    pmrem.dispose();

    // Lighting rig: atmospheric bounce + forward canopy starlight + personal inspection light
    const hemiLight = new THREE.HemisphereLight(0x8faac8, 0x2e3544, 2.2);
    const ambientLight = new THREE.AmbientLight(0x4a5668, 1.5);
    const starlight = new THREE.DirectionalLight(0xdce6f8, 2.6);
    starlight.position.set(-8, 16, 26);
    starlight.target.position.set(0, 1.5, 0);

    // Personal camera inspection light (cadet suit chest luminaire)
    this.cameraLight = new THREE.PointLight(0xffedd2, 1.4, 12, 1.3);
    this.camera.add(this.cameraLight);
    this.shipScene.add(this.camera);

    this.shipScene.add(hemiLight, ambientLight, starlight, starlight.target);

    // Dynamic pooled interior compartment lighting rig
    this.shipLightPool = new ShipLightPool(this.shipScene, 7);

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
      const isAuthed = Boolean(session.token && session.player);
      this.shipInterior.setClubHoloVisible(isAuthed);
      if (this.fpsControls) {
        this.fpsControls.enabled = isAuthed;
      }
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
      if (this.mode === "world" && this.activeWorld === this.tallowWorld && this.tallowWorld) {
        const site = this.tallowWorld.nearbySite;
        if (site) {
          window.dispatchEvent(new CustomEvent("tallow:interact", { detail: site }));
        } else if (Math.hypot(this.camera.position.x - 34, this.camera.position.z - 42) < 9) {
          // The buyer's pad is the way off Tallow, the way the lander is on Erebus.
          window.location.hash = "#/bridge";
        }
      } else if (this.mode === "world" && this.worldScene) {
        if (this.worldScene.nearbySite) {
          const pylonEvent = new CustomEvent("pylon:interact", { detail: this.worldScene.nearbySite });
          window.dispatchEvent(pylonEvent);
        } else if (Math.hypot(this.camera.position.x, this.camera.position.z - 41) < 5.8) {
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
    this.renderer.setAnimationLoop(this.render.bind(this));
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
    this.activeWorld = this.worldScene;
    if (this.renderer) this.renderer.toneMappingExposure = SHIP_EXPOSURE;

    if (this.worldScene) {
      this.worldScene.scene.add(this.camera);

      const spawn = this.worldScene.data.spawn;
      const groundY = this.worldScene.getTerrainHeight(spawn.pos[0], spawn.pos[2]);
      const eyeHeight = this.fpsControls ? this.fpsControls.eyeHeight : 1.6;
      const eyeY = groundY + eyeHeight;

      this.camera.position.set(spawn.pos[0], eyeY, spawn.pos[2]);
      this.camera.lookAt(spawn.lookAt[0], eyeY, spawn.lookAt[2]);
      this.camera.updateMatrixWorld(true);

      if (this.fpsControls) {
        this.fpsControls.enabled = true;
        this.fpsControls.isGrounded = true;
        this.fpsControls.verticalVelocity = 0;
        this.fpsControls.velocity.set(0, 0, 0);
        this.fpsControls.euler.setFromQuaternion(this.camera.quaternion);
        this.fpsControls.euler.z = 0;
        this.fpsControls.setMode(
          "world",
          (x, z) => this.worldScene.getTerrainHeight(x, z),
          { minX: -85, maxX: 85, minZ: -85, maxZ: 85 },
          this.worldScene.colliders
        );
      }
    }
  }

  /**
   * Walk out onto Tallow, the salt-flat refinery (Learn world 01).
   *
   * `focusSiteId` puts the player at that site's approach mark instead of the
   * shuttle pad, so stepping out of a bench puts them back in front of it rather
   * than at the far end of the yard.
   */
  enterTallowScene(focusSiteId = null) {
    if (!this.tallowWorld && this.renderer) {
      this.tallowWorld = new TallowWorld(this.renderer);
    }
    this.mode = "world";
    this.activeWorld = this.tallowWorld;

    if (!this.tallowWorld) return;
    if (this.renderer) this.renderer.toneMappingExposure = TALLOW_EXPOSURE;

    this.tallowWorld.scene.add(this.camera);

    const data = this.tallowWorld.data;
    const site = focusSiteId ? data.sites.find(s => s.id === focusSiteId) : null;

    let px, pz, lookX, lookZ;
    if (site) {
      px = site.approachPos[0];
      pz = site.approachPos[2];
      lookX = site.pos[0];
      lookZ = site.pos[2];
    } else {
      px = data.spawn.pos[0];
      pz = data.spawn.pos[2];
      lookX = data.spawn.lookAt[0];
      lookZ = data.spawn.lookAt[2];
    }

    const groundY = this.tallowWorld.getTerrainHeight(px, pz);
    const eyeHeight = this.fpsControls ? this.fpsControls.eyeHeight : 1.6;
    const eyeY = groundY + eyeHeight;

    this.camera.position.set(px, eyeY, pz);
    this.camera.lookAt(lookX, eyeY, lookZ);
    this.camera.updateMatrixWorld(true);

    if (this.fpsControls) {
      this.fpsControls.enabled = true;
      this.fpsControls.isGrounded = true;
      this.fpsControls.verticalVelocity = 0;
      this.fpsControls.velocity.set(0, 0, 0);
      this.fpsControls.euler.setFromQuaternion(this.camera.quaternion);
      this.fpsControls.euler.z = 0;
      this.fpsControls.setMode(
        "world",
        (x, z) => this.tallowWorld.getTerrainHeight(x, z),
        { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
        this.tallowWorld.colliders
      );
    }
  }

  /** Light a Tallow site's indicator when its quest is finished. */
  setTallowSiteComplete(questId, complete) {
    if (this.tallowWorld) this.tallowWorld.setSiteComplete(questId, complete);
  }

  enterShipScene(locationKey = "bridge") {
    this.mode = "ship";
    this.activeWorld = null;
    if (this.renderer) this.renderer.toneMappingExposure = SHIP_EXPOSURE;
    if (this.shipScene) {
      this.shipScene.add(this.camera);
      this.camera.updateMatrixWorld(true);
    }
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
    if (this.fpsControls) {
      this.fpsControls.hidePrompt();
      if (questViewer) {
        this.fpsControls.enabled = false;
        this.fpsControls.exitPointerLock();
      } else {
        this.fpsControls.enabled = true;
      }
    }
  }

  exitQuestScene() {
    if (this.activeQuestViewer) {
      this.activeQuestViewer.dispose();
      this.activeQuestViewer = null;
    }
    this.activeQuestScene = null;
    this.mode = "world";
    if (this.fpsControls) {
      this.fpsControls.enabled = true;
      this.fpsControls.exitPointerLock();
    }
    // Back to whichever world the instrument was deployed on, not always Erebus.
    if (this.activeWorld) {
      this.activeWorld.scene.add(this.camera);
      this.camera.updateMatrixWorld(true);
    }
  }

  render(now) {
    if (this.isPaused || !this.renderer) return;

    tierManager.recordFrame(now);
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.mode === "quest" && this.activeQuestViewer) {
      this.activeQuestViewer.update(delta, time);
      this.renderer.render(this.activeQuestScene, this.activeQuestViewer.camera);
    } else if (this.mode === "world" && this.activeWorld === this.tallowWorld && this.tallowWorld) {
      if (this.fpsControls) {
        this.fpsControls.enabled = true;
        this.fpsControls.update(delta);
        const site = this.tallowWorld.nearbySite;
        if (site) {
          // A site that has no module yet says so when you reach it rather than
          // pretending to open. The world never invents a quest.
          this.fpsControls.showPrompt(
            site.built === false
              ? `${site.label.toUpperCase()} — SEALED`
              : `[E] WORK AT ${site.label.toUpperCase()}`
          );
        } else if (Math.hypot(this.camera.position.x - 34, this.camera.position.z - 42) < 9) {
          this.fpsControls.showPrompt("[E] BOARD AT THE PAD (RETURN TO SHIP)");
        } else {
          this.fpsControls.hidePrompt();
        }
      }
      this.tallowWorld.update(delta, this.camera.position);
      this.camera.updateMatrixWorld(true);
      this.renderer.render(this.tallowWorld.scene, this.camera);
    } else if (this.mode === "world" && this.worldScene) {
      if (this.fpsControls) {
        this.fpsControls.enabled = true;
        this.fpsControls.update(delta);
        if (this.worldScene.nearbySite) {
          this.fpsControls.showPrompt(`[E] DEPLOY CHAMBER AT ${this.worldScene.nearbySite.label.toUpperCase()}`);
        } else if (Math.hypot(this.camera.position.x, this.camera.position.z - 41) < 5.8) {
          this.fpsControls.showPrompt("[E] BOARD SURVEY LANDER (RETURN TO SHIP)");
        } else {
          this.fpsControls.hidePrompt();
        }
      }
      this.worldScene.update(delta, this.camera.position);
      this.camera.updateMatrixWorld(true);
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

      if (this.shipLightPool) {
        this.shipLightPool.update(this.camera.position);
      }
      if (this.shipInterior) this.shipInterior.update(delta, time);
      if (this.starfield) this.starfield.rotation.y += delta * 0.002;
      this.renderer.render(this.shipScene, this.camera);
    }
  }
}

export const stage = new Stage();
