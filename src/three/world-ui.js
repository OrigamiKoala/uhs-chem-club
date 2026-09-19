/**
 * world-ui.js — Interfaces that are objects in the world, not pages over it.
 *
 * THE PROBLEM THIS SOLVES
 * A quest's prompt, its readout, its hint ladder and its Commit key used to be a
 * card floating over the render, which is the one thing in this product that
 * admitted it was a web page. Standing at a bench on Tallow and reading a screen
 * that is bolted to that bench is a different experience entirely, and it is the
 * brief: everything the player touches is a thing in the room.
 *
 * WHY THE TEXT STAYS DOM
 * Every quest module hands the frame HTML — prompts, scans, hint rungs, reward
 * cards. Rasterising that into a canvas texture would mean re-implementing their
 * layout, and re-implemented layout is how copy quietly changes: a line wraps
 * somewhere new, a word is dropped to make it fit, a hint rung loses its number.
 * The rule is that not one player-facing string may change, so the DOM is kept
 * and *placed* instead: a `CSS3DObject` carries the real element, with the real
 * handlers and the real stylesheet, onto a plane in the scene. The words are
 * verbatim by construction rather than by inspection.
 *
 * WHAT MAKES IT HARDWARE
 * A DOM plane alone would read as a sticker. Every panel is therefore issued a
 * WebGL housing built strictly AROUND the screen rectangle — a back plate behind
 * it, a bezel frame outside it, standoffs, bolts, a stencilled designator and a
 * dim filament that spills light from the tube onto the bench. Nothing in the
 * housing overlaps the screen, because the CSS layer composites above WebGL and
 * an overlapping bezel would simply vanish.
 *
 * THE ONE HONEST LIMITATION
 * That same compositing means a panel is not occluded by geometry in front of it.
 * Panels are therefore only ever raised while the player is docked at the station
 * that owns them, facing it from arm's length, with nothing between. Raise one
 * across a room and the illusion breaks — so nothing here does.
 */

import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { boltLine, placard } from './materials/pbr-kit.js';

/**
 * CSS pixels per world metre. A panel authored 760 px wide is one metre of
 * bench. Chosen so the existing stylesheets — which are written for a 375 px
 * phone and up — land at a physically sensible instrument size.
 */
export const PX_PER_M = 760;

/**
 * The shared DOM layer every world panel is drawn into.
 *
 * One renderer for the whole app, created lazily the first time a panel is
 * raised, and torn down when the last one is lowered — a page with no in-world
 * interface pays nothing for this file.
 */
class WorldUILayer {
  constructor() {
    this.renderer = null;
    this.el = null;
    this.panels = new Set();
  }

  ensure() {
    if (this.renderer) return;
    this.renderer = new CSS3DRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const el = this.renderer.domElement;
    el.id = 'world-ui-layer';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    // Above the canvas, below the page furniture and the HUD. The layer itself
    // never takes a press; only the panels inside it do, so a click on empty
    // sky still reaches the renderer and the walk controls behind it.
    el.style.zIndex = '5';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    this.el = el;
    window.addEventListener('resize', this.onResize);
  }

  onResize = () => {
    if (!this.renderer) return;
    const w = window.visualViewport?.width || window.innerWidth;
    const h = window.visualViewport?.height || window.innerHeight;
    this.renderer.setSize(w, h);
  };

  setSize(w, h) {
    if (this.renderer) this.renderer.setSize(w, h);
  }

  /** True when there is anything to draw. The render loop checks this first. */
  get active() {
    return this.panels.size > 0;
  }

  register(panel) {
    this.ensure();
    this.panels.add(panel);
  }

  unregister(panel) {
    this.panels.delete(panel);
    if (this.panels.size === 0) this.teardown();
  }

  /** Called once per frame, after the WebGL pass, with whatever scene is live. */
  render(scene, camera) {
    if (!this.renderer || this.panels.size === 0) return;
    this.renderer.render(scene, camera);
  }

  teardown() {
    if (!this.renderer) return;
    window.removeEventListener('resize', this.onResize);
    this.el?.remove();
    this.renderer = null;
    this.el = null;
  }
}

export const worldUI = new WorldUILayer();

/**
 * One physical instrument panel: a screen, and the hardware it is set into.
 *
 * The caller owns the element. This class never writes to it, never reads its
 * text and never re-renders it — it positions it and builds metal around it.
 */
export class WorldPanel {
  /**
   * @param {{
   *   element: HTMLElement,          the live DOM the panel displays
   *   widthPx: number,               authored CSS width
   *   heightPx: number,              authored CSS height
   *   metres?: number,               physical width; defaults to widthPx / PX_PER_M
   *   scene: THREE.Scene,            the scene the housing is added to
   *   position?: [x, y, z],
   *   rotation?: [x, y, z],
   *   tilt?: number,                 extra lean-back, radians (a console rake)
   *   designator?: string,           the stencil on the bezel, e.g. 'RDT-02'
   *   materials?: {frame, dark},     housing materials; defaults are built here
   *   glow?: number,                 filament spill intensity, 0 disables
   *   housing?: 'bezel'|'none'       'none' when the caller builds its own case
   * }} opts
   */
  constructor(opts) {
    const {
      element, widthPx, heightPx, metres,
      scene, position = [0, 0, 0], rotation = [0, 0, 0], tilt = 0,
      designator = null, materials = null, glow = 0.55, housing = 'bezel'
    } = opts;

    this.scene = scene;
    this.element = element;
    this.widthPx = widthPx;
    this.heightPx = heightPx;

    const w = metres ?? widthPx / PX_PER_M;
    const h = w * (heightPx / widthPx);
    this.width = w;
    this.height = h;

    /* --- the screen itself --- */
    element.style.width = `${widthPx}px`;
    element.style.height = `${heightPx}px`;
    element.style.pointerEvents = 'auto';
    // Backface culling by hand: a panel seen from behind is a mirror-image of
    // its own text, which no instrument has ever done.
    element.style.backfaceVisibility = 'hidden';

    this.object = new CSS3DObject(element);
    this.object.scale.setScalar(w / widthPx);
    this.object.position.set(...position);
    this.object.rotation.set(rotation[0] + tilt, rotation[1], rotation[2]);

    /* --- the hardware --- */
    // A caller that is building its OWN case — a console fascia, a bench
    // instrument — asks for no bezel. Issuing one anyway would put a second
    // frame around an aperture that already has one.
    this.housing = new THREE.Group();
    this.housing.position.copy(this.object.position);
    this.housing.rotation.copy(this.object.rotation);
    this.ownedGeos = [];
    this.ownedMats = [];
    if (housing !== 'none') this.buildHousing(materials, designator, glow);

    scene.add(this.object);
    scene.add(this.housing);
    worldUI.register(this);
  }

  /**
   * Re-size the screen in place, keeping its authored pixel layout.
   *
   * The DOM is never re-flowed: the element stays `widthPx` wide and the plane
   * it rides on is scaled, so a panel fitted to a phone and one fitted to a
   * monitor lay out identically and only differ in how large they are drawn.
   * The housing is scaled by the same factor, because it was built around this
   * aperture and has to keep being built around it.
   *
   * @param {number} metres the new physical width
   */
  setWidth(metres) {
    if (!(metres > 0)) return;
    const factor = metres / this.width;
    if (Math.abs(factor - 1) < 1e-4) return;
    this.width = metres;
    this.height = metres * (this.heightPx / this.widthPx);
    this.object.scale.setScalar(metres / this.widthPx);
    this.housing.scale.multiplyScalar(factor);
  }

  /**
   * Back plate, bezel bars, standoffs and bolts — strictly outside the screen
   * rectangle, because anything inside it would be hidden by the DOM plane.
   */
  buildHousing(materials, designator, glow) {
    const w = this.width, h = this.height;
    const frameMat = materials?.frame || new THREE.MeshStandardMaterial({
      color: 0x6a6153, roughness: 0.74, metalness: 0.62
    });
    const darkMat = materials?.dark || new THREE.MeshStandardMaterial({
      color: 0x2b2722, roughness: 0.88, metalness: 0.5
    });
    this.ownedMats = materials ? [] : [frameMat, darkMat];
    this.ownedGeos = [];

    const own = g => { this.ownedGeos.push(g); return g; };

    const bezel = 0.028;              // frame bar width
    const depth = 0.055;              // how far the case stands off the mount

    // Back plate. Sits behind the DOM, a hair larger, so the screen never has a
    // bright edge of world showing around it.
    const back = new THREE.Mesh(
      own(new THREE.BoxGeometry(w + bezel * 2, h + bezel * 2, depth)), darkMat
    );
    back.position.z = -depth / 2 - 0.004;
    back.castShadow = back.receiveShadow = true;
    this.housing.add(back);

    // Bezel: four bars around the aperture, chamfered at the top-left the way a
    // plate is (CLAUDE.md §3) by shortening the top bar and dropping the corner.
    const barGeoH = own(new THREE.BoxGeometry(w + bezel * 2, bezel, depth * 0.85));
    const barGeoV = own(new THREE.BoxGeometry(bezel, h, depth * 0.85));
    const bars = [
      [0, h / 2 + bezel / 2, barGeoH],
      [0, -h / 2 - bezel / 2, barGeoH],
      [-w / 2 - bezel / 2, 0, barGeoV],
      [w / 2 + bezel / 2, 0, barGeoV]
    ];
    for (const [bx, by, g] of bars) {
      const bar = new THREE.Mesh(g, frameMat);
      bar.position.set(bx, by, -0.002);
      bar.castShadow = true;
      this.housing.add(bar);
    }

    // The chamfer hairline: a bright sliver across the relieved corner.
    const chamfer = new THREE.Mesh(
      own(new THREE.BoxGeometry(bezel * 2.6, bezel * 0.35, depth * 0.9)),
      frameMat
    );
    chamfer.position.set(-w / 2 - bezel * 0.2, h / 2 + bezel * 0.2, 0.004);
    chamfer.rotation.z = Math.PI / 4;
    this.housing.add(chamfer);

    // Fastenings down both sides of the case.
    const boltL = boltLine([-w / 2 - bezel / 2, -h / 2 + 0.02, depth * 0.44],
      [-w / 2 - bezel / 2, h / 2 - 0.02, depth * 0.44], 5, frameMat,
      { size: 0.009, normalAxis: 'z' });
    const boltR = boltLine([w / 2 + bezel / 2, -h / 2 + 0.02, depth * 0.44],
      [w / 2 + bezel / 2, h / 2 - 0.02, depth * 0.44], 5, frameMat,
      { size: 0.009, normalAxis: 'z' });
    this.housing.add(boltL, boltR);

    // Standoff arms: the case is held off its mount, not glued to it.
    for (const sx of [-w * 0.3, w * 0.3]) {
      const arm = new THREE.Mesh(
        own(new THREE.CylinderGeometry(0.014, 0.016, 0.1, 8)), darkMat
      );
      arm.rotation.x = Math.PI / 2;
      arm.position.set(sx, -h / 2 - bezel, -depth - 0.05);
      this.housing.add(arm);
    }

    // The stencilled designator on the bottom bar. A serial, not player copy.
    if (designator) {
      const tag = placard(designator, { w: Math.min(0.2, w * 0.3), h: 0.034, bg: '#4a4239', fg: '#cbbfa6' });
      tag.position.set(-w / 2 + 0.11, -h / 2 - bezel / 2, depth * 0.44);
      this.tag = tag;
      this.housing.add(tag);
    }

    // A tube throws light. This is an instrument that is switched on, so it is
    // allowed one filament (CLAUDE.md §4.2) — dim, short-range, warm, and it
    // lights the bench in front of it rather than blooming on its own face.
    if (glow > 0) {
      const spill = new THREE.PointLight(0xd8b878, glow * 4.2, 1.5, 2.0);
      spill.position.set(0, 0, 0.16);
      this.housing.add(spill);
      this.spill = spill;
    }
  }

  /** Move the screen and its hardware together. They are one object. */
  placeAt(position, rotation) {
    if (position) {
      this.object.position.set(...position);
      this.housing.position.set(...position);
    }
    if (rotation) {
      this.object.rotation.set(...rotation);
      this.housing.rotation.set(...rotation);
    }
  }

  /** Turn the panel to face a world point, keeping it upright. */
  faceTowards(target) {
    const look = new THREE.Vector3(target.x, this.object.position.y, target.z);
    this.object.lookAt(look);
    this.housing.rotation.copy(this.object.rotation);
  }

  setVisible(on) {
    this.object.visible = on;
    this.housing.visible = on;
    this.element.style.visibility = on ? '' : 'hidden';
    this.element.style.pointerEvents = on ? 'auto' : 'none';
  }

  dispose() {
    worldUI.unregister(this);
    this.scene.remove(this.object);
    this.scene.remove(this.housing);
    // The CSS3DObject holds the caller's element; hand it back rather than
    // destroying it, so a frame can re-home its own DOM.
    this.object.element?.remove();
    for (const g of this.ownedGeos || []) g.dispose();
    for (const m of this.ownedMats || []) m.dispose();
    this.housing.traverse(o => {
      if (o.userData?.ownGeometry) o.userData.ownGeometry.dispose();
      if (o.userData?.ownMaterial) o.userData.ownMaterial.dispose();
      if (o.userData?.ownTexture) o.userData.ownTexture.dispose();
    });
  }
}

/**
 * A station of panels mounted around one instrument, positioned in the
 * instrument's own local frame and raised and lowered together.
 *
 * This is what a quest frame talks to: it says "here are my regions", and the
 * rig decides which plate each one is bolted to. Nothing about the frame's copy
 * or its handlers reaches this file.
 */
export class PanelRig {
  /** @param {THREE.Scene} scene @param {THREE.Object3D} anchor */
  constructor(scene, anchor = null) {
    this.scene = scene;
    this.anchor = anchor;
    this.panels = new Map();
  }

  /**
   * @param {string} id
   * @param {HTMLElement} element
   * @param {object} spec see WorldPanel, minus scene
   */
  add(id, element, spec) {
    const panel = new WorldPanel({ ...spec, element, scene: this.scene });
    if (this.anchor) {
      // Re-express the panel in the anchor's frame, so moving the bench moves
      // every screen bolted to it without a second bookkeeping path.
      this.scene.remove(panel.object);
      this.scene.remove(panel.housing);
      this.anchor.add(panel.object);
      this.anchor.add(panel.housing);
    }
    this.panels.set(id, panel);
    return panel;
  }

  get(id) { return this.panels.get(id); }

  setVisible(on) {
    for (const p of this.panels.values()) p.setVisible(on);
  }

  dispose() {
    for (const p of this.panels.values()) {
      if (this.anchor) {
        this.anchor.remove(p.object);
        this.anchor.remove(p.housing);
      }
      p.dispose();
    }
    this.panels.clear();
  }
}


/**
 * The node a bench's screens are bolted to.
 *
 * Deliberately built in the SAME local frame the deployed instrument uses:
 * origin at the bench's centre line, +z toward the player, and local y = 0.895
 * sitting exactly on the working surface. A panel coordinate written here means
 * the same thing as a station coordinate written in `bench3d.js`, which is what
 * lets the two be laid out against each other instead of guessed at.
 *
 * @param {{position: number[], rotationY: number, topY: number}} deployment
 */
export function createBenchAnchor(deployment) {
  const g = new THREE.Group();
  g.position.set(deployment.position[0], deployment.topY - 0.895, deployment.position[2]);
  g.rotation.y = deployment.rotationY || 0;
  return g;
}

/**
 * The gantry the screens hang on: two uprights standing on the back of the
 * bench and a cross-head between them.
 *
 * Without this the panels would float, and a floating panel is a HUD wearing a
 * bezel. It is built to clear the instrument: the uprights stand at x = ±1.30
 * in front of the bench's back lip, and every screen is cantilevered behind
 * them on short arms, so nothing intrudes on the station line at z = 0.
 */
export function createPanelGantry(materials = null) {
  const g = new THREE.Group();
  const frame = materials?.frame || new THREE.MeshStandardMaterial({
    color: 0x5f574a, roughness: 0.8, metalness: 0.58
  });
  const dark = materials?.dark || new THREE.MeshStandardMaterial({
    color: 0x2b2722, roughness: 0.9, metalness: 0.45
  });
  const owned = materials ? [] : [frame, dark];
  const geos = [];
  const own = x => { geos.push(x); return x; };

  for (const ux of [-1.30, 1.30]) {
    const post = new THREE.Mesh(
      own(new THREE.BoxGeometry(0.07, 1.16, 0.07)), frame
    );
    post.position.set(ux, 0.895 + 0.58, -0.50);
    post.castShadow = true;
    g.add(post);

    // Footplate, bolted through the bench top.
    const foot = new THREE.Mesh(own(new THREE.BoxGeometry(0.19, 0.022, 0.19)), dark);
    foot.position.set(ux, 0.906, -0.50);
    g.add(foot);
    g.add(boltLine([ux - 0.06, 0.918, -0.56], [ux + 0.06, 0.918, -0.56], 2, dark,
      { size: 0.009, normalAxis: 'y' }));

    // The arm each screen hangs off, reaching back over the lip.
    const arm = new THREE.Mesh(own(new THREE.BoxGeometry(0.05, 0.05, 0.22)), dark);
    arm.position.set(ux * 0.72, 1.55, -0.61);
    g.add(arm);
  }

  const head = new THREE.Mesh(own(new THREE.BoxGeometry(2.67, 0.06, 0.06)), frame);
  head.position.set(0, 2.05, -0.50);
  head.castShadow = true;
  g.add(head);

  // A loom of cable dropping from the head to the bench, because screens are fed.
  const loom = new THREE.Mesh(own(new THREE.CylinderGeometry(0.014, 0.014, 0.9, 6)), dark);
  loom.position.set(0.62, 1.58, -0.53);
  loom.rotation.z = 0.06;
  g.add(loom);

  g.userData.ownedGeos = geos;
  g.userData.ownedMats = owned;
  return g;
}

/** Free a gantry's own geometry and materials. */
export function disposeGantry(g) {
  for (const x of g.userData.ownedGeos || []) x.dispose();
  for (const m of g.userData.ownedMats || []) m.dispose();
  g.traverse(o => {
    if (o.userData?.ownGeometry) o.userData.ownGeometry.dispose();
  });
}
