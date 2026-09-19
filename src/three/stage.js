/**
 * stage.js — The master WebGL renderer and animation loop
 * Manages color management, quality tiers, background pausing, scene swapping ('ship' | 'world' | 'quest'),
 * and unconstrained first-person WASD navigation with physics collisions and diegetic interaction.
 */

import * as THREE from "three";
import { tierManager, tierAtLeast, isTouchPrimary } from "./tier.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CameraRig } from "./camera-rig.js";
import { ShipInterior } from "./ship.js";
import { createStarfield } from "./materials/starfield.js";
import { WorldScene } from "./world.js";
import { TallowWorld } from "./tallow.js";
import { FpsControls } from "./fps-controls.js";
import { TouchControls } from "./touch-controls.js";
import { session } from "../session.js";
import { ShipLightPool } from "./ship-lighting.js";
import { soundscape } from "../audio/soundscape.js";
import { gameMode } from "../game-mode.js";
import { worldUI } from "./world-ui.js";
import { api } from "../api.js";

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

/**
 * The bridge directory board, as `ship.js` builds it: a 1.8 x 1.0125 m plate
 * hung at eye level 1.4 m in front of where a player stands on the bridge.
 * `fitClubHolo` scales it from these so the whole board is inside the glass.
 */
const CLUB_HOLO_W = 1.8;
const CLUB_HOLO_H = 1.0125;
const CLUB_HOLO_VIEW_DIST = 1.4;

class Stage {
  constructor() {
    this.canvas = null;
    this.renderer = null;
    this.camera = null;
    this.cameraRig = null;
    this.fpsControls = null;
    this.touchControls = null;
    this.isTouch = false;
    this.lastTouchSync = 0;

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
    // them; without this they were simply never drawn. A phone runs T4 without
    // them: soft shadow maps are the one T4 feature a mobile GPU cannot hold
    // 60fps through, and losing them costs far less than losing the tier.
    if (tierAtLeast("T4") && !isTouchPrimary()) {
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

      // THE BOARD SHOWS THE REAL BOARD, OR IT SHOWS NOTHING.
      //
      // `session.teams` is the roster manifest from `bootstrap` — guild names,
      // liveries and slot caps. It carries no scores, so reading `t.score` off
      // it produced a row of zeroes, and the four invented totals that stood in
      // when it was empty were simply fiction on a screen that claims to be
      // telemetry. Avalon is pre-launch (PRODUCT.md): there is no play data yet,
      // and a board that makes some up is worse than a board that says so.
      //
      // The real figures come from `leaderboard`, which is the same computation
      // Standings reads — mean XP of active members scaled by participation
      // (Scoring.gs §4.4), NEVER a sum and never labelled XP.
      const board = this.standings;
      const standingsData = {
        teams: (board?.teams || []).map(t => ({
          rank: t.rank,
          name: t.corp_name || t.name || t.team_id,
          team_score: t.team_score,
          active: t.active_members,
          roster: t.roster_size
        })),
        chatter: board
          ? (board.myRank
            ? `RANK ${board.myRank.rank} // ${board.myRank.display_name} // LVL ${board.myRank.level}`
            : 'NO RATED TRAFFIC ON THIS CHANNEL')
          : ''
      };

      const inventoryData = {
        count: Array.isArray(session.inventory) ? session.inventory.length : 0,
        max: 8,
        trinket: session.player?.trinket || 'SPECTROMETER'
      };

      this.shipInterior.updateDisplays(questData, standingsData, inventoryData);
      const isAuthed = Boolean(session.token && session.player);
      this.shipInterior.clubHoloClosed = session.hasFlag("clubHoloClosed");
      this.shipInterior.starmapHoloClosed = session.hasFlag("starmapHoloClosed");
      this.shipInterior.commsHoloClosed = session.hasFlag("commsHoloClosed");
      const showHolo = isAuthed && !this.shipInterior.clubHoloClosed;
      this.shipInterior.setClubHoloVisible(showHolo, true);
      const showStarmapHolo = !this.shipInterior.starmapHoloClosed;
      this.shipInterior.setStarmapHoloVisible(showStarmapHolo, true);
      const showCommsHolo = !this.shipInterior.commsHoloClosed;
      this.shipInterior.setCommsHoloVisible(showCommsHolo, true);
      if (this.fpsControls) {
        this.fpsControls.enabled = isAuthed;
      }
      // Signing in raises the HUD nav, which is 40px taller on a phone. The
      // board has to be re-fitted under it, not just at boot.
      this.fitClubHolo();
    };

    /**
     * Pull the real standings for the comms board.
     *
     * Fire-and-forget: a board that cannot be fetched stays blank and says
     * "awaiting telemetry", which is true. It is never allowed to throw into the
     * render path, and a failure here can never sign anybody out — `api.js`
     * takes two consecutive UNAUTHORIZED replies for that, and this route is
     * public anyway.
     */
    this.refreshStandings = () => {
      const now = Date.now();
      if (this._standingsPending) return;
      if (this._standingsAt && now - this._standingsAt < 20000) return;
      this._standingsPending = true;
      api.getLeaderboards()
        .then(data => {
          this.standings = data && typeof data === 'object' ? data : null;
          this._standingsAt = Date.now();
          syncShipDisplays();
        })
        .catch(() => { this._standingsAt = Date.now(); })
        .finally(() => { this._standingsPending = false; });
    };

    session.subscribe(() => {
      syncShipDisplays();
      // Signing in, or finishing a stage, can move the board. The 20 s floor in
      // refreshStandings keeps a chatty session from hammering the route.
      this.refreshStandings();
    });
    syncShipDisplays();
    this.refreshStandings();

    // Camera Rig
    this.cameraRig = new CameraRig(this.camera);

    // 4. First-person WASD controls with collision sliding and interaction
    this.fpsControls = new FpsControls(this.camera, this.canvas);
    this.fpsControls.enabled = Boolean(session.token && session.player);

    // On a phone the mouse path stands down and the twin sticks take over.
    this.isTouch = isTouchPrimary();
    if (this.isTouch) {
      document.body.classList.add("touch-primary");
      this.fpsControls.touchMode = true;
      this.touchControls = new TouchControls(this.fpsControls);
    }

    this.fpsControls.setMode(
      "ship",
      null,
      { minX: -7.8, maxX: 7.8, minZ: -8.5, maxZ: 3.8 },
      this.shipInterior.getActiveColliders()
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
        const nearDoor = this.shipInterior?.getDoorNear(px, pz, 1.8);
        if (nearDoor) {
          this.shipInterior.toggleDoor(nearDoor);
          this.fpsControls.colliders = this.shipInterior.getActiveColliders();
          soundscape.playNavRelayClick?.();
          return;
        }
        if (Math.hypot(px - 3.375, pz - (-6.6)) < 2.2) {
          window.location.hash = "#/quest";
        } else if (Math.hypot(px - 3.2, pz - 1.8) < 2.0) {
          window.location.hash = "#/starmap";
        } else if (Math.hypot(px - 3.3, pz - (-1.2)) < 2.2) {
          window.location.hash = "#/inventory";
        } else if (Math.hypot(px - (-3.375), pz - (-6.45)) < 2.2) {
          window.location.hash = "#/leaderboard";
        } else if (Math.hypot(px - (-3.375), pz - (-0.9)) < 2.2) {
          window.location.hash = "#/quarters";
        } else if (Math.hypot(px, pz - 1.6) < 1.4) {
          window.location.hash = "#/settings";
        }
      }
    };

    // 5. Bind Events & Lifecycle
    this._onResize = this.onResize.bind(this);
    window.addEventListener("resize", this._onResize);
    // A phone collapsing its address bar fires this and not `resize`.
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this._onResize);
    }
    window.addEventListener("orientationchange", () => setTimeout(this._onResize, 120));
    document.addEventListener("visibilitychange", this.onVisibilityChange.bind(this));
    tierManager.subscribe((tier) => this.applyTierSettings(tier));
    this.onResize();

    // Global 'X' key handler to close and open any holographic display
    let lastXPress = 0;
    const handleKeyX = () => {
      const now = Date.now();
      if (now - lastXPress < 150) return;
      lastXPress = now;
      this.toggleAnyHolo();
    };

    window.addEventListener("keydown", (e) => {
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select" || document.activeElement?.isContentEditable) return;
      const modal = document.getElementById("modal-container");
      if (modal && !modal.classList.contains("hidden")) return;

      if (e.repeat) return;
      if (e.key === "x" || e.key === "X" || e.code === "KeyX") {
        handleKeyX();
      }
    });

    // Pointer click on the Close badge a holo screen draws. A press anywhere
    // else on the screen is not a dismissal: the whole surface used to be one
    // close button, so reading the board — or steadying the view with a click
    // — took it away, and the badge in the corner was decoration.
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const hitCloseBadge = (group) => {
      const hits = raycaster.intersectObjects(group.children, true);
      for (const hit of hits) {
        const rect = hit.object?.material?.map?.userData?.closeRect;
        if (!rect || !hit.uv) continue;
        if (hit.uv.x >= rect.u0 && hit.uv.x <= rect.u1 &&
            hit.uv.y >= rect.v0 && hit.uv.y <= rect.v1) return true;
      }
      return false;
    };
    if (this.canvas) {
      this.canvas.addEventListener("pointerup", (e) => {
        if (this.mode !== "ship" || !this.camera) return;
        // Measured off the canvas, not the window: on a phone the drawing
        // buffer tracks the visual viewport, which is shorter than the window
        // while the address bar is up, and window-relative NDC would aim the
        // ray below where the finger actually landed.
        const r = this.canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);
        if (this.shipInterior?.isClubHoloVisible() && this.shipInterior.clubHoloGroup) {
          if (hitCloseBadge(this.shipInterior.clubHoloGroup)) {
            this.closeClubHolo();
            return;
          }
        }
        if (this.shipInterior?.isStarmapHoloVisible() && this.shipInterior.starmapHoloGroup) {
          if (hitCloseBadge(this.shipInterior.starmapHoloGroup)) {
            this.closeStarmapHolo();
            return;
          }
        }
      });
    }

    // 6. Start Animation Loop
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  closeClubHolo() {
    let wasVisible = false;
    if (this.shipInterior && this.shipInterior.isClubHoloVisible?.()) {
      this.shipInterior.closeClubHolo();
      wasVisible = true;
    } else if (this.shipInterior) {
      this.shipInterior.closeClubHolo();
    }
    session.setFlag("clubHoloClosed", true);
    window.dispatchEvent(new CustomEvent("club-holo:close"));
    if (wasVisible) {
      soundscape.playNavRelayClick?.();
    }
  }

  openClubHolo() {
    let wasHidden = false;
    if (this.shipInterior && !this.shipInterior.isClubHoloVisible?.()) {
      this.shipInterior.openClubHolo();
      wasHidden = true;
    } else if (this.shipInterior) {
      this.shipInterior.openClubHolo();
    }
    session.setFlag("clubHoloClosed", false);
    window.dispatchEvent(new CustomEvent("club-holo:open"));
    if (wasHidden) {
      soundscape.playNavRelayClick?.();
    }
  }

  toggleClubHolo() {
    if (this.isClubHoloVisible()) {
      this.closeClubHolo();
    } else {
      this.openClubHolo();
    }
    return this.isClubHoloVisible();
  }

  isClubHoloVisible() {
    if (this.shipInterior?.isClubHoloVisible) {
      return this.shipInterior.isClubHoloVisible();
    }
    return !session.hasFlag("clubHoloClosed");
  }

  closeStarmapHolo() {
    let wasVisible = false;
    if (this.shipInterior && this.shipInterior.isStarmapHoloVisible?.()) {
      this.shipInterior.closeStarmapHolo();
      wasVisible = true;
    } else if (this.shipInterior) {
      this.shipInterior.closeStarmapHolo();
    }
    session.setFlag("starmapHoloClosed", true);
    window.dispatchEvent(new CustomEvent("starmap-holo:close"));
    if (wasVisible) {
      soundscape.playNavRelayClick?.();
    }
  }

  openStarmapHolo() {
    let wasHidden = false;
    if (this.shipInterior && !this.shipInterior.isStarmapHoloVisible?.()) {
      this.shipInterior.openStarmapHolo();
      wasHidden = true;
    } else if (this.shipInterior) {
      this.shipInterior.openStarmapHolo();
    }
    session.setFlag("starmapHoloClosed", false);
    window.dispatchEvent(new CustomEvent("starmap-holo:open"));
    if (wasHidden) {
      soundscape.playNavRelayClick?.();
    }
  }

  toggleStarmapHolo() {
    if (this.isStarmapHoloVisible()) {
      this.closeStarmapHolo();
    } else {
      this.openStarmapHolo();
    }
    return this.isStarmapHoloVisible();
  }

  isStarmapHoloVisible() {
    if (this.shipInterior?.isStarmapHoloVisible) {
      return this.shipInterior.isStarmapHoloVisible();
    }
    return !session.hasFlag("starmapHoloClosed");
  }

  closeCommsHolo() {
    session.setFlag("commsHoloClosed", true);
    if (this.shipInterior?.closeCommsHolo) {
      this.shipInterior.closeCommsHolo();
      soundscape.playNavRelayClick?.();
    }
  }

  openCommsHolo() {
    session.setFlag("commsHoloClosed", false);
    if (this.shipInterior?.openCommsHolo) {
      this.shipInterior.openCommsHolo();
      soundscape.playNavRelayClick?.();
    }
  }

  toggleCommsHolo() {
    if (this.isCommsHoloVisible()) {
      this.closeCommsHolo();
    } else {
      this.openCommsHolo();
    }
    return this.isCommsHoloVisible();
  }

  isCommsHoloVisible() {
    if (this.shipInterior?.isCommsHoloVisible) {
      return this.shipInterior.isCommsHoloVisible();
    }
    return !session.hasFlag("commsHoloClosed");
  }

  toggleAnyHolo() {
    if (this.mode === "ship" && this.camera) {
      const px = this.camera.position.x;
      const pz = this.camera.position.z;
      const distBridge = Math.hypot(px - 0, pz - 1.2);
      const distStarmap = Math.hypot(px - 3.2, pz - 1.8);
      const distComms = Math.hypot(px - (-3.35), pz - (-6.1));

      if (window.location.hash.includes("leaderboard") || distComms < 3.0) {
        this.toggleCommsHolo();
        return;
      }
      if (window.location.hash.includes("starmap")) {
        this.toggleStarmapHolo();
        return;
      }
      if (window.location.hash.includes("bridge")) {
        this.toggleClubHolo();
        return;
      }

      if (distComms < distBridge && distComms < distStarmap) {
        this.toggleCommsHolo();
      } else if (distStarmap < distBridge) {
        this.toggleStarmapHolo();
      } else {
        this.toggleClubHolo();
      }
    } else if (window.location.hash.includes("leaderboard")) {
      this.toggleCommsHolo();
    } else if (window.location.hash.includes("starmap")) {
      this.toggleStarmapHolo();
    } else {
      this.toggleClubHolo();
    }
  }

  applyTierSettings(tier) {
    if (!this.renderer) return;
    if (tier === "T1") {
      this.renderer.setAnimationLoop(null);
      return;
    }
    this.renderer.setAnimationLoop(this.render.bind(this));
    // A phone's devicePixelRatio is commonly 3; rendering the walk at even 2x
    // there is four times the pixels of 1x for no visible gain on a 6-inch
    // panel, and it is the difference between 60fps and 30.
    const dpr = window.devicePixelRatio || 1;
    let maxDpr = 1;
    if (tierAtLeast("T3", tier)) maxDpr = Math.min(dpr, isTouchPrimary() ? 1.5 : 2);
    this.renderer.setPixelRatio(maxDpr);
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    // `visualViewport` is what is actually visible once a phone's toolbars are
    // accounted for. Sizing to innerWidth/innerHeight there renders a canvas
    // taller than the window and the horizon sits off the bottom of the glass.
    const vv = window.visualViewport;
    const width = Math.round(vv && this.isTouch ? vv.width : window.innerWidth);
    const height = Math.round(vv && this.isTouch ? vv.height : window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.fitClubHolo(width, height);
  }

  /**
   * Size the bridge directory board so the whole of it is inside the glass.
   *
   * It is a fixed plate in the room, and a window narrower than the one it was
   * laid out for cropped its left and right edges — you could not read the
   * columns or reach the Close badge. The camera's vertical field is fixed, so
   * how many metres the glass spans at the board's standing distance is a
   * matter of arithmetic; the board is scaled to fit inside that, minus the
   * HUD, which covers the top of the view and is not part of the picture.
   *
   * It never scales above 1: the board is drawn at the size it was designed at
   * whenever there is room for it.
   */
  fitClubHolo(w, h) {
    if (!this.camera || !this.shipInterior?.setClubHoloScale) return;
    const width = w || window.innerWidth;
    const height = h || window.innerHeight;
    if (!width || !height) return;

    // Metres of world, at the board's distance, per pixel of glass.
    const visibleH = 2 * CLUB_HOLO_VIEW_DIST * Math.tan((this.camera.fov * Math.PI) / 360);
    const mPerPx = visibleH / height;

    let hudPx = 0;
    const hudEl = document.getElementById("hud");
    if (hudEl) hudPx = hudEl.getBoundingClientRect().height || 0;

    const margin = Math.max(16, Math.min(width, height) * 0.04);
    // The board is hung at eye level, so it grows equally above and below the
    // centre line: whatever the HUD takes off the top is taken off both halves.
    const halfPx = Math.max(40, height / 2 - hudPx - margin);
    const allowH = 2 * halfPx * mPerPx;
    const allowW = Math.max(0, width - margin * 2) * mPerPx;

    const scale = Math.min(1, allowW / CLUB_HOLO_W, allowH / CLUB_HOLO_H);
    this.shipInterior.setClubHoloScale(Math.max(0.25, scale));
  }

  /**
   * Raise or lower the twin sticks. The walk owns the screen only when it is
   * the foreground: a deployed chamber, an in-world terminal or a cinematic
   * takes the sticks away, and a push held through that transition is released
   * rather than left stuck on.
   *
   * Throttled, because it asks the DOM a question and the answer changes at
   * the speed of navigation, not of frames.
   */
  syncTouchControls(now) {
    if (now - this.lastTouchSync < 200) return;
    this.lastTouchSync = now;

    // Driven from here rather than from each entry point so no scene swap can
    // forget it; the class is read by CSS, not per frame.
    this.syncWorldOrientation();
    if (!this.touchControls) return;

    const walking = Boolean(
      this.fpsControls &&
      this.fpsControls.enabled &&
      this.mode !== "quest" &&
      tierAtLeast("T3")
    );
    const show = walking && !TouchControls.overlayBlocking();
    this.touchControls.setVisible(show);
    if (show) {
      const prompt = this.fpsControls.promptEl;
      // The prompt reads `[E]` on every device now — the stick key is engraved
      // with the same legend — so this is the one string to look for.
      const offered = Boolean(
        this.fpsControls.promptVisible &&
        prompt &&
        prompt.textContent.includes("[E]")
      );
      this.touchControls.setInteractAvailable(offered);
    }
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
    // Stepping onto a planet on a phone is the moment to take the screen and
    // turn it sideways. The request rides the gesture that navigated here; a
    // refusal costs nothing but the rotate notice.
    if (this.isTouch) gameMode.enterWorld();
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
    if (this.isTouch) gameMode.enterWorld();
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

  /**
   * The landscape lock is taken when the player steps onto a planet and given
   * back when they leave it. "On a planet" is `activeWorld` set and the mode
   * either `world` or `quest` — walking the ground, or working an instrument
   * deployed on it. The ship reads fine in portrait, and a chamber opened at
   * T3 or below has no world behind it and has always been portrait.
   */
  syncWorldOrientation() {
    if (!this.isTouch) return;
    const onPlanet = Boolean(
      this.activeWorld && (this.mode === "world" || this.mode === "quest")
    );
    if (!onPlanet) gameMode.unlockOrientation();
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

  /**
   * Where a Learn quest's bench physically is, for the instrument that is about
   * to be deployed onto it. Null unless the player is standing on a world that
   * is built as a place and that bench is one of its sites.
   *
   * The world owns the answer — `registerBenchAnchor` recorded it when the bench
   * was built — so moving a bench moves the instrument with it and there is no
   * second copy of the coordinates to fall out of step.
   */
  benchDeployment(questId) {
    if (!this.tallowWorld || this.activeWorld !== this.tallowWorld) return null;
    const anchor = this.tallowWorld.benchAnchor(questId);
    if (!anchor || !this.camera) return null;
    this._deployedQuestId = questId;
    this.tallowWorld.setBenchDeployed(questId, true);
    return {
      scene: this.tallowWorld.scene,
      camera: this.camera,
      position: anchor.position,
      rotationY: anchor.rotationY,
      topY: anchor.topY
    };
  }

  /** Case the worked bench back up once the player steps away from it. */
  releaseBenchDeployment() {
    if (this._deployedQuestId && this.tallowWorld) {
      this.tallowWorld.setBenchDeployed(this._deployedQuestId, false);
    }
    this._deployedQuestId = null;
  }

  /**
   * Stand the walk down while the player is working an instrument that is NOT
   * a scene of its own.
   *
   * `setQuestScene` covers the built benches and the containment chamber: they
   * bring a viewer, so there is something to hand the renderer. A drawn
   * instrument — the sampler scope — brings a page instead, and without this the
   * player would still be walking Tallow behind it: W would step off the bench,
   * and an arrow key aimed at a dial would also be aimed at the ground.
   *
   * @param {boolean} on
   */
  setWalkSuspended(on) {
    this._walkSuspended = Boolean(on);
    if (!this.fpsControls) return;
    this.fpsControls.hidePrompt();
    if (on) {
      this.fpsControls.releaseKeys?.();
      this.fpsControls.enabled = false;
    } else if (this.mode !== "quest") {
      this.fpsControls.enabled = true;
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
    this.releaseBenchDeployment();
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
    this.syncTouchControls(now);

    if (this.mode === "quest" && this.activeQuestViewer) {
      this.activeQuestViewer.update(delta, time);
      // An instrument deployed on a world the player walked to is standing IN
      // that world: its dust still drifts, its lamps still flicker and its sock
      // still turns while the player works. Without this the flat would freeze
      // solid the moment a bench was opened.
      if (this.activeQuestViewer.inWorld && this.activeWorld) {
        this.activeWorld.update(delta, this.camera.position);
      }
      this.renderer.render(this.activeQuestScene, this.activeQuestViewer.camera);
      worldUI.render(this.activeQuestScene, this.activeQuestViewer.camera);
      return;
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
      worldUI.render(this.tallowWorld.scene, this.camera);
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
      worldUI.render(this.worldScene.scene, this.camera);
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
        const nearDoor = this.shipInterior?.getDoorNear(px, pz, 1.8);
        if (nearDoor) {
          this.fpsControls.showPrompt(nearDoor.isOpen ? "[E] CLOSE DOOR" : "[E] OPEN DOOR");
        } else if (Math.hypot(px - 3.375, pz - (-6.6)) < 2.2) {
          this.fpsControls.showPrompt("[E] AIRLOCK: DISEMBARK TO EREBUS (CHARGE GARDENS)");
        } else if (Math.hypot(px - 3.2, pz - 1.8) < 2.0) {
          this.fpsControls.showPrompt("[E] ACCESS STAR MAP & NAVIGATION");
        } else if (Math.hypot(px - 3.3, pz - (-1.2)) < 2.2) {
          this.fpsControls.showPrompt("[E] ACCESS CARGO & INVENTORY");
        } else if (Math.hypot(px - (-3.375), pz - (-6.45)) < 2.2) {
          this.fpsControls.showPrompt("[E] ACCESS SUB-SPACE COMMS RELAY");
        } else if (Math.hypot(px - (-3.375), pz - (-0.9)) < 2.2) {
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
      worldUI.render(this.shipScene, this.camera);
    }
  }
}

export const stage = new Stage();
