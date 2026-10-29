/**
 * bench3d.js — The physical bench the 3D Learn instruments are built on.
 *
 * `scope.js` and `corebench.js` draw their instruments on a canvas, because a 2D
 * reveal runs identically on every tier and holds at 375 px. On Tallow at T4 the
 * player is standing at the bench in first person, so the instrument is built out
 * of the same parts as a real one: a plated top, a station per sample, a well with
 * a dark phosphor floor, and the sample itself as pieces you can walk your eye
 * around and click on.
 *
 * WHAT THIS IS NOT ALLOWED TO CHANGE. The 3D instruments expose exactly the API
 * their canvas counterparts expose, take exactly the same sample declarations, and
 * run the same layout maths — `buildUnits`, `packCore` and `RING_RADII` are
 * imported from the 2D engines rather than reimplemented, so the two can never
 * drift. Every player-facing string is the quest's, rendered verbatim. Nothing
 * here grades anything, and nothing here knows any chemistry.
 *
 * Aesthetic contract (CLAUDE.md §4): dust-coloured pieces, a recessed phosphor
 * well, engraved legends, chamfered plate. Nothing blooms. The reserved charge
 * hues stay in the campaign's containment chamber and never appear on this bench.
 */

import * as THREE from 'three';
import { angleFor } from './dial.js';
import { boltLine } from '../../three/materials/pbr-kit.js';
import { registerBenchViewer, unregisterBenchViewer, takeGaze, cameraShake } from './bench-host.js';
import { soundscape } from '../../audio/soundscape.js';
import { FoeLayer3D } from './encounter3d.js';
import { planLeanIn, chromeReserve, PLATE_ZONE, LEAN } from './lean.js';
import { getRoom } from './rooms.js';

/** Dust palette, in 3D. Mirrors TINTS in scope.js exactly. */
export const TINT_HEX = {
  bone: { fill: 0xb8afa0, rim: 0x6f685d },
  sand: { fill: 0xc39a63, rim: 0x7a6039 },
  iron: { fill: 0x6b625a, rim: 0x3b3631 },
  rust: { fill: 0x9c5423, rim: 0x5c3116 },
  pale: { fill: 0x8f8678, rim: 0x544e46 }
};

export const WELL_FLOOR = 0x0d0c0a;
export const PLATE_RIM = 0x2e2a26;
export const PHOSPHOR = 0x6f8f3f;
export const AMBER = 0xd99423;

/**
 * Draw a legend the way the plate shop would: engraved, mono, tracked wide.
 * Returns a CanvasTexture. The text passed in is rendered verbatim — this
 * function never abbreviates, wraps a word away, or adds anything of its own.
 */
export function engravedPlaque(text, opts = {}) {
  const {
    w = 512, h = 128, size = 34, color = '#cfc5ae', align = 'left',
    bg = '#16140f', pad = 18, lit = false, tracking = 2
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Machined tooth on the plate face, so the legend sits on metal.
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < w * 1.5; i++) {
    const g = Math.floor(Math.random() * 255);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;

  // A hairline along the relieved edge: the chamfer, in two dimensions.
  ctx.strokeStyle = 'rgba(200, 190, 168, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(w, 2);
  ctx.stroke();

  ctx.font = `${size}px "Share Tech Mono", monospace`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Word wrap, measured against the real font. Nothing is dropped: if the text
  // is longer than the plate, the plate gets a smaller face, not fewer words.
  const maxW = w - pad * 2;
  const maxH = h - pad * 2;
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const minFont = 10;
  let fontSize = size;
  let lines = [];
  for (let attempt = 0; attempt < 50; attempt++) {
    ctx.font = `${fontSize}px "Share Tech Mono", monospace`;
    lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width + tracking * test.length > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    let maxLineW = 0;
    for (const l of lines) {
      const lw = ctx.measureText(l).width + tracking * l.length;
      if (lw > maxLineW) maxLineW = lw;
    }
    const blockH = lines.length * fontSize * 1.28;
    if (maxLineW <= maxW && blockH <= maxH) break;
    if (fontSize <= minFont) break;

    const scaleW = maxLineW > maxW ? maxW / maxLineW : 1;
    const scaleH = blockH > maxH ? maxH / blockH : 1;
    const scale = Math.min(scaleW, scaleH);
    const nextSize = Math.min(fontSize - 1, Math.floor(fontSize * scale));
    fontSize = Math.max(minFont, nextSize);
  }

  const drawTracked = (str, x, y) => {
    let cx = x;
    for (const ch of str) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + tracking;
    }
  };

  const lineH = fontSize * 1.28;
  const blockH = lines.length * lineH;
  let y = align === 'middle' ? Math.max(pad, (h - blockH) / 2) : pad;

  for (const line of lines) {
    let x = pad;
    if (align === 'center' || align === 'middle') {
      let lw = 0;
      for (const ch of line) lw += ctx.measureText(ch).width + tracking;
      x = Math.max(pad, (w - lw) / 2);
    }
    // Engraved: a dark line under the glyph, never a glow.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    drawTracked(line, x, y + 2);
    ctx.fillStyle = lit ? '#d99423' : color;
    drawTracked(line, x, y);
    y += lineH;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * The shared bench: a plated top, a back panel, stations along it, a warm work
 * lamp, and a camera that looks down at it the way a person standing at a bench
 * looks down at it.
 *
 * Subclasses build what goes into a station and say what a click on it means.
 */
/**
 * A POWER DIAL YOU CAN ACTUALLY TURN.
 *
 * The magnification control is a thing you turn, and on a bench that is built
 * rather than drawn it has to be a thing that is THERE: a milled cap on a raked
 * plinth bolted to the plate, with detents cut round its collar, a scale
 * engraved on the panel and an index that is lit because the instrument is
 * live. Reaching over and turning it is the gesture; nothing about it is a
 * widget wearing a bench's clothes.
 *
 * It shares its maths with the drawn dial. `angleFor` and `valueForAngle` come
 * from `engine/dial.js` and are the single implementation, so the knob on the
 * bench and the knob on the panel cannot disagree about which detent a given
 * power sits at — the same rule the tools follow (CLAUDE.md, "the two are the
 * same instrument").
 *
 * It knows no chemistry. It reports an integer in a range; the quest decides
 * what the integer means.
 *
 * @param {{min: number, max: number, value: number, label: string,
 *          materials: {steel: THREE.Material, dark: THREE.Material}}} opts
 * @returns {{group: THREE.Group, cap: THREE.Mesh, hit: THREE.Mesh,
 *            setValue: Function, geos: THREE.BufferGeometry[], mats: THREE.Material[]}}
 */
export function buildPowerDial(opts) {
  const { min = 1, max = 6, value = min, label = 'POWER', materials = null } = opts || {};
  const g = new THREE.Group();
  const geos = [];
  const mats = [];
  const own = x => { geos.push(x); return x; };
  const ownMat = m => { mats.push(m); return m; };

  const steel = materials?.steel || ownMat(new THREE.MeshStandardMaterial({
    color: 0x6f6657, roughness: 0.72, metalness: 0.62
  }));
  const dark = materials?.dark || ownMat(new THREE.MeshStandardMaterial({
    color: 0x24211c, roughness: 0.9, metalness: 0.4
  }));
  const cap = ownMat(new THREE.MeshStandardMaterial({
    color: 0x8d7f68, roughness: 0.5, metalness: 0.72
  }));
  const index = ownMat(new THREE.MeshStandardMaterial({
    color: AMBER, emissive: AMBER, emissiveIntensity: 1.2, roughness: 0.45
  }));

  // The plinth: a wedge standing on the plate, raked TOWARD THE OPERATOR so the
  // cap's face is something you look at rather than down onto.
  //
  // WHICH WAY IS TOWARD. A bench's local +z is its front — the player walks in
  // from there, the station screens stand at -z and face +z, and the camera
  // docks on the +z side. So the raked face must tilt its FAR edge up and its
  // NEAR edge down, which is a POSITIVE rotation about x. It used to be
  // negative, which raked the panel away from the player: the legend and the
  // whole scale plate faced the back of the bench, and what the operator saw
  // was the underside of the cap.
  const RAKE = 0.62;
  const base = new THREE.Mesh(own(new THREE.BoxGeometry(0.30, 0.035, 0.24)), dark);
  base.position.y = 0.017;
  base.castShadow = base.receiveShadow = true;
  g.add(base);
  g.add(boltLine([-0.13, 0.036, -0.09], [0.13, 0.036, -0.09], 3, dark,
    { size: 0.011, normalAxis: 'y' }));

  const face = new THREE.Group();
  face.position.set(0, 0.075, 0.012);
  face.rotation.x = RAKE;
  g.add(face);

  const panel = new THREE.Mesh(own(new THREE.BoxGeometry(0.28, 0.022, 0.21)), steel);
  panel.castShadow = panel.receiveShadow = true;
  face.add(panel);

  // THE LEGEND IS ON THE NEAR EDGE, which is the piece of the instrument
  // closest to the player's eye and the one nothing else stands in front of.
  // A knob whose name is engraved behind it is a knob with no name.
  const plaqueTex = engravedPlaque(label, {
    w: 384, h: 96, size: 52, align: 'center', tracking: 5
  });
  const plaqueMat = ownMat(new THREE.MeshStandardMaterial({
    map: plaqueTex, roughness: 0.85, metalness: 0.2
  }));
  const plaque = new THREE.Mesh(own(new THREE.PlaneGeometry(0.152, 0.038)), plaqueMat);
  plaque.rotation.x = -Math.PI / 2;
  plaque.position.set(0, 0.0115, 0.076);
  face.add(plaque);
  plaqueMat.userData = { ownTexture: plaqueTex };

  // The setting, in figures, on the raised far edge of the same panel. A dial
  // with an index groove tells you WHERE it is; a player who has never used one
  // still needs to be told WHAT it is on, and "TURN UP" is the whole of stage 1.
  const readCanvas = document.createElement('canvas');
  readCanvas.width = 256;
  readCanvas.height = 96;
  const readCtx = readCanvas.getContext('2d', { willReadFrequently: true });
  const readTex = new THREE.CanvasTexture(readCanvas);
  readTex.colorSpace = THREE.SRGBColorSpace;
  const readMat = ownMat(new THREE.MeshBasicMaterial({ map: readTex }));
  const readout = new THREE.Mesh(own(new THREE.PlaneGeometry(0.108, 0.041)), readMat);
  readout.rotation.x = -Math.PI / 2;
  readout.position.set(0, 0.0115, -0.078);
  face.add(readout);
  readMat.userData = { ownTexture: readTex };

  const paintReadout = v => {
    readCtx.fillStyle = '#0d0c0a';
    readCtx.fillRect(0, 0, 256, 96);
    readCtx.fillStyle = '#d99423';
    readCtx.font = '56px "Share Tech Mono", monospace';
    readCtx.textAlign = 'center';
    readCtx.textBaseline = 'middle';
    readCtx.fillText(`${v} / ${max}`, 128, 50);
    readTex.needsUpdate = true;
  };

  // Detents round the collar: one notch per step, the low and high stops long.
  const notchGeo = own(new THREE.BoxGeometry(0.006, 0.006, 0.018));
  const stopGeo = own(new THREE.BoxGeometry(0.007, 0.007, 0.030));
  for (let v = min; v <= max; v++) {
    const deg = angleFor(v, min, max);
    const rad = deg * Math.PI / 180;
    const r = 0.070;
    const isStop = v === min || v === max;
    const notch = new THREE.Mesh(isStop ? stopGeo : notchGeo, dark);
    notch.position.set(Math.sin(rad) * r, 0.012, -Math.cos(rad) * r);
    notch.rotation.y = rad;
    face.add(notch);
  }

  // The cap. Knurled, because a knob you turn with oily gloves is knurled.
  const knob = new THREE.Group();
  knob.position.y = 0.011;
  face.add(knob);

  const body = new THREE.Mesh(own(new THREE.CylinderGeometry(0.048, 0.052, 0.036, 24)), cap);
  body.position.y = 0.018;
  body.castShadow = true;
  knob.add(body);

  const knurlGeo = own(new THREE.BoxGeometry(0.006, 0.030, 0.010));
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const k = new THREE.Mesh(knurlGeo, cap);
    k.position.set(Math.sin(a) * 0.050, 0.018, Math.cos(a) * 0.050);
    k.rotation.y = a;
    knob.add(k);
  }

  // The index groove, and the filament let into the end of it.
  const groove = new THREE.Mesh(own(new THREE.BoxGeometry(0.006, 0.004, 0.040)), dark);
  groove.position.set(0, 0.037, -0.024);
  knob.add(groove);
  const lamp = new THREE.Mesh(own(new THREE.BoxGeometry(0.008, 0.005, 0.010)), index);
  lamp.position.set(0, 0.038, -0.041);
  knob.add(lamp);

  // A generous invisible target, so the knob is grabbable at a glancing angle
  // without having to hit a knurl exactly.
  const hitMat = ownMat(new THREE.MeshBasicMaterial({ visible: false }));
  const hit = new THREE.Mesh(own(new THREE.CylinderGeometry(0.082, 0.082, 0.09, 12)), hitMat);
  hit.position.y = 0.03;
  knob.add(hit);

  const setValue = v => {
    const deg = angleFor(v, min, max);
    // Dial degrees run clockwise from the top; a positive turn about +Y reads
    // anticlockwise from above, so the sign flips here and only here.
    knob.rotation.y = -deg * Math.PI / 180;
    paintReadout(Math.min(max, Math.max(min, Math.round(v))));
  };
  setValue(value);

  return { group: g, knob, hit, setValue, geos, mats };
}





export class BenchViewer3D {
  /**
   * @param {HTMLElement} domElement the element pointer events are read from
   * @param {{
   *   backdrop?: 'awning'|'lab',
   *   room?: string,           a named room (`rooms.js`) to build instead of the generic one: its own work
   *                            surface, walls, lamp and materials, for a bench with no world under it
   *   world?: {
   *     scene: THREE.Scene,      the world the player is standing in
   *     camera: THREE.Camera,    the world camera, docked at the bench
   *     position: [x, y, z],     where the real bench stands
   *     rotationY: number,       which way it faces
   *     topY: number             the height of its working surface
   *   }
   * }} opts
   *
   * DEPLOYED, OR STANDALONE. With `opts.world` the instrument is deployed onto
   * the bench that already stands on Tallow: the player walks up to it, the
   * camera docks, and the stations appear on the real working surface with the
   * salt flat still behind them. Without it — T3 and below, and the verifier —
   * the bench builds its own little room exactly as before.
   *
   * The instrument's LOCAL FRAME IS IDENTICAL in both cases. Only the transform
   * on `this.root` differs, so every station coordinate, every sweep and every
   * hit test below is written once and cannot drift between the two.
   */
  constructor(domElement, opts = {}) {
    this.domElement = domElement || document.body;
    this.opts = opts;

    const world = opts.world || null;
    this.world = world;
    // A boss fight's table (`three/arena-table.js`): the look up at the boss, the arena's shake.
    this.arenaFight = Boolean(world && world.arena);
    this.inWorld = Boolean(world);
    this.fpsControls = world?.fpsControls || null;

    // Everything the instrument builds hangs off this one node, which is what
    // makes deploying it into a world a transform rather than a rewrite.
    this.root = new THREE.Group();

    if (world) {
      this.scene = world.scene;
      this.camera = world.camera;
      this.root.position.set(world.position[0], 0, world.position[2]);
      // Local y = 0.895 is the standalone bench's working surface. Lining that
      // up with the real one puts every station on the actual plate rather than
      // hovering over it or sunk into it.
      this.root.position.y = world.topY - 0.895;
      this.root.rotation.y = world.rotationY || 0;
      this.scene.add(this.root);
    } else {
      this.scene = new THREE.Scene();
      this.scene.background = null;
      this.camera = new THREE.PerspectiveCamera(
        42, window.innerWidth / window.innerHeight, 0.05, 60
      );
      this.scene.add(this.root);
    }

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.stations = [];
    // WHAT THE AIM KEEPS IN THE GLASS.
    //
    // Two of the five Learn instruments are not station-shaped. A card index is
    // a board and a drawer; an assay rig is a hopper over a chute over a row of
    // bins. Neither has a well with a screen raked over it, and the aiming below
    // used to be written directly against `this.stations` — so an instrument
    // that laid out none simply was not aimed, and hung whereever the bench
    // happened to put it. An instrument that builds its own bodies registers
    // them here instead, and every fit reads `framedNodes()`, which falls back
    // to the stations when nothing has.
    this.fitNodes = [];
    this.disposables = [];
    this.elapsed = 0;
    this.disposed = false;
    this.dials = [];
    this.haloGroup = null;
    this.haloGeos = [];
    this.haloMaterials = [];
    this.haloBadges = [];
    this.haloPointers = [];

    // A constrained look-around: the player can lean over the bench and see a
    // piece from another side, but never get behind or under it.
    this.orbit = { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 };
    // DEPLOYED, THE CAMERA ENDS UP BELONGING TO THE PLAYER. The instrument
    // stands them in front of the stations and aims them clear of the frame,
    // and the FIRST STEP THEY TAKE it lets go and never writes to the camera
    // again. Holding the camera on the bench's own arc while a walkable world
    // was underneath meant every press of W was undone in the same frame, and
    // the aim correction re-solved against a view that was being fought over —
    // which is what juddered.
    this.playerControlled = false;
    // Where `applyCamera` last stood the player. Anything else on the ground
    // next frame is the player having moved themselves.
    this._standX = 0;
    this._standZ = 0;
    this._stood = false;
    // Deployed on a world, the walk clamps the camera to the terrain every
    // frame, so the instrument aims but never sets how high the head is. In
    // Node — where `verify:bench` measures the deployed bench and there is no
    // walk — it sets the height as it always did.
    this.walkOwnsHeight = Boolean(world && world.walkOwnsHeight);
    this.dragging = false;
    this.dragPointerId = null;
    this.lastPointer = { x: 0, y: 0 };
    // Controls bolted to the bench — a power knob, a lever — which take a press
    // before the view does. See `addGrabbable`.
    this.grabbables = [];
    this.grabbing = null;
    this.grabPointerId = null;

    // The tool keys, mirrored onto the plate as a switch panel. See `setKeys`.
    this.keyBank = null;
    this.keyGroups = [];
    this.keySig = '';
    this.onKeyPress = null;
    this.keyRelease = [];
    this.keysDirty = false;
    // How much further back the camera stands so the key bank is in the glass.
    this.keyPull = 0;
    // The readings board, mirrored from the frame's log, plot and device. See `setReadings`.
    this.readingsBoard = null;
    this.readingsSnap = null;
    // LEANING IN (`leanIn`): a tabletop is worked from above. While `lean` is set
    // the lean pose owns the camera; the standing aim is not applied.
    this.lean = null;
    this.leaning = false;
    this.leanZones = null;
    this.onLeanChange = null;
    // A boss fight asks the leaned-in view to look up at the boss for a beat (`bench-host.js` `requestGaze`): `{ point, hold, inS, outS, w }`.
    this.gaze = null;

    this.buildLighting();
    this.buildBench();
    this.bindEvents();
    this.frameCamera(1);

    // The foes of a stage that is a fight (encounter3d.js). An observer: it
    // stands bodies in the wells and is told what pose to take, nothing more.
    this.foes = new FoeLayer3D(this);

    // Announce the viewer, so the frame's tool keys can find the bench they
    // belong on (`bench-keys.js`). The frame is built before the instrument.
    registerBenchViewer(this);
  }

  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  /* ---------------- room ---------------- */

  buildLighting() {
    // Deployed on Tallow the room is already lit — the lean-to has its caged
    // lamp and the lab has four. Adding a second rig here would double every
    // shadow and give the bench a light with no fixture attached to it.
    if (this.inWorld) return;

    // A named room (`rooms.js`) brings its own lamp and fill.
    const room = getRoom(this.opts.room);
    if (room) {
      this.room = this.room || room(this);
      for (const l of this.room.lights) this.scene.add(l);
      this.keyLight = this.room.key;
      return;
    }

    // A work light over the bench and a broad fill. Warm sodium, local and dim:
    // the light comes from inside the room, not from an unexplained sky.
    const key = new THREE.SpotLight(0xffdfae, 26, 7.5, Math.PI * 0.32, 0.55, 1.4);
    key.position.set(-0.5, 2.5, 1.2);
    key.target.position.set(0, 0.9, 0);
    this.scene.add(key, key.target);
    this.keyLight = key;

    const fill = new THREE.HemisphereLight(0xcfc0a2, 0x3a342c, 1.15);
    this.scene.add(fill);

    const ambient = new THREE.AmbientLight(0x6f665a, 0.9);
    this.scene.add(ambient);

    // A cool rake from behind, so plate edges separate from the backdrop.
    const rake = new THREE.DirectionalLight(0x9a917e, 0.5);
    rake.position.set(3, 2.2, -3.5);
    this.scene.add(rake);
  }

  buildBench() {
    const g = new THREE.Group();

    const steel = this.own(new THREE.MeshStandardMaterial({
      color: 0x6f6657, roughness: 0.88, metalness: 0.42
    }));
    const dark = this.own(new THREE.MeshStandardMaterial({
      color: 0x3d3730, roughness: 0.92, metalness: 0.5
    }));
    this.steelMat = steel;
    this.darkMat = dark;

    // PHYSICS: the bench on Tallow is already built, already collided and
    // already standing in that square metre. Building a second one here would
    // put two objects in one place, which is the one thing the world is not
    // allowed to do. Deployed, the instrument brings its stations and nothing
    // else, and they are laid on the plate that is already there.
    if (this.inWorld) {
      this.benchGroup = g;
      this.root.add(g);
      return;
    }

    // A NAMED ROOM builds the work surface and everything round it from its own materials.
    const roomBuilder = getRoom(this.opts.room);
    if (roomBuilder) {
      this.room = this.room || roomBuilder(this);
      this.benchGroup = this.room.bench;
      this.root.add(this.room.bench, this.room.set);
      return;
    }

    // The bench top. Wide enough for four stations with room at each end.
    const top = new THREE.Mesh(this.own(new THREE.BoxGeometry(4.6, 0.07, 1.5)), steel);
    top.position.set(0, 0.86, 0);
    top.receiveShadow = true;
    g.add(top);

    // Seam down the middle of the top: it is two plates, bolted.
    const seam = new THREE.Mesh(this.own(new THREE.BoxGeometry(4.6, 0.012, 0.02)), dark);
    seam.position.set(0, 0.9, 0);
    g.add(seam);

    // Bolt heads along the seam, proud of the plate.
    const boltGeo = this.own(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 8));
    for (let i = 0; i < 14; i++) {
      const b = new THREE.Mesh(boltGeo, dark);
      b.position.set(-2.1 + i * 0.32, 0.902, 0);
      g.add(b);
    }

    // Front apron and a raised back lip.
    const apron = new THREE.Mesh(this.own(new THREE.BoxGeometry(4.6, 0.16, 0.05)), steel);
    apron.position.set(0, 0.79, 0.74);
    g.add(apron);

    const backLip = new THREE.Mesh(this.own(new THREE.BoxGeometry(4.6, 0.1, 0.05)), dark);
    backLip.position.set(0, 0.92, -0.74);
    g.add(backLip);

    // Legs with footplates and a stretcher.
    const legGeo = this.own(new THREE.BoxGeometry(0.09, 0.86, 0.09));
    for (const [lx, lz] of [[-2.1, -0.6], [2.1, -0.6], [-2.1, 0.6], [2.1, 0.6]]) {
      const leg = new THREE.Mesh(legGeo, dark);
      leg.position.set(lx, 0.43, lz);
      g.add(leg);
      const foot = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.18, 0.025, 0.18)), dark);
      foot.position.set(lx, 0.012, lz);
      g.add(foot);
    }
    const stretcher = new THREE.Mesh(this.own(new THREE.BoxGeometry(4.2, 0.05, 0.05)), dark);
    stretcher.position.set(0, 0.26, 0);
    g.add(stretcher);

    // Backdrop: the lean-to's sheet on the surface, the lab's bulkhead below.
    const isLab = this.opts.backdrop === 'lab';
    const back = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(5.6, 2.6, 0.08)),
      this.own(new THREE.MeshStandardMaterial({
        color: isLab ? 0x494238 : 0x7d7362,
        roughness: 0.95,
        metalness: isLab ? 0.35 : 0.28
      }))
    );
    back.position.set(0, 1.3, -1.25);
    g.add(back);

    // Rivet rows down the backdrop: the small detail that says it is sheet metal.
    const rivetGeo = this.own(new THREE.SphereGeometry(0.014, 8, 6));
    for (let i = 0; i < 18; i++) {
      for (const ry of [0.32, 1.28, 2.24]) {
        const r = new THREE.Mesh(rivetGeo, dark);
        r.position.set(-2.6 + i * 0.31, ry, -1.2);
        g.add(r);
      }
    }

    // The deck under the bench.
    const deck = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(6.4, 0.06, 4.2)),
      this.own(new THREE.MeshStandardMaterial({
        color: isLab ? 0x3a352d : 0x93897a, roughness: 1.0, metalness: isLab ? 0.2 : 0.0
      }))
    );
    deck.position.set(0, -0.03, 0.6);
    deck.receiveShadow = true;
    g.add(deck);

    this.benchGroup = g;
    this.root.add(g);
  }

  /**
   * Declare a body the camera fit must keep in the glass.
   * `topMark` is whatever must stay clear of the frame's chrome — the top edge
   * of a board, of a screen, of a hopper — or the body itself when it is all
   * one piece.
   */
  addFitNode(group, topMark, face) {
    this.fitNodes.push({ group, topMark: topMark || group, face: face || null });
    this.keysDirty = true;
  }

  /**
   * Everything the fit is solving for: registered bodies, or the stations.
   *
   * `face` is the READABLE surface, where the body has one — a station's
   * screen, a board's plate. It has to be wholly inside the glass, because
   * half a picture is not a picture; the rest of a body only has to be
   * roughly in frame, since a note plate clipped at the edge costs nothing.
   */
  framedNodes() {
    if (this.fitNodes.length) return this.fitNodes;
    return this.stations.map(st => ({
      group: st.group, topMark: st.topMark, face: st.screen?.mesh || null
    }));
  }

  /** Stand the camera where a person working the bench would have their head. */
  frameCamera(n) {
    // Further back for more stations, so every well stays in frame without the
    // player having to move — the instrument is the subject, not the room.
    const dist = 1.25 + Math.max(0, n - 1) * 0.42;
    this.camDist = dist;
    this.camHeight = 1.62 + Math.max(0, n - 2) * 0.05;
    this.camTarget = new THREE.Vector3(0, 0.95, -0.02);
    this.applyCamera();
  }

  /**
   * Aim the camera higher, which puts the bench LOWER in the glass.
   *
   * Deployed, the quest frame is a page over the world (the panels only leave
   * the page on a bench that is drawn rather than built), so the top of the
   * glass belongs to the header, the stage rail and the tool plate, and the
   * bench was being drawn straight through the middle of them. The camera does
   * not move — moving it would change how steeply the player looks into the
   * wells — it is only aimed up, which slides the whole instrument down into
   * the open glass underneath the frame.
   *
   * @param {number} lift metres the look-at point rises by. 0 is dead level.
   */
  setAimLift(lift) {
    const v = Math.max(0, Math.min(0.95, lift || 0));
    if (Math.abs(v - (this.aimLift || 0)) < 0.002) return;
    this.aimLift = v;
    this.applyCamera();
  }

  /**
   * Aim the camera sideways, which slides the bench the OTHER way in the glass.
   *
   * The vertical twin of this (`setAimLift`) keeps the instrument out from
   * under the header and the tool plate. This one keeps it out from behind a
   * transmission: at a deployed bench the briefing docks down one side of the
   * view, and a bench centred in the glass puts its leftmost stations behind
   * it. Aiming left walks the whole instrument right into the clear part of
   * the view without the player's standing position changing.
   *
   * @param {number} shift metres the look-at point moves along the bench.
   */
  setAimShift(shift) {
    const v = Math.max(-1.6, Math.min(1.6, shift || 0));
    if (Math.abs(v - (this.aimShift || 0)) < 0.002) return;
    this.aimShift = v;
    this.applyCamera();
  }

  applyCamera() {
    // Once the player has moved themselves, the bench is a thing standing in
    // the world and nothing more. It does not reach for the camera again.
    if (this.inWorld && this.playerControlled) return;

    const yaw = this.orbit.yaw;
    const pitch = this.orbit.pitch;
    // The key bank's pull is kept apart from `camDist`, which instruments set
    // outright on every layout; added here it can never accumulate.
    const d = this.camDist + (this.keyPull || 0);
    const t = this.camTarget;
    const lift = this.aimLift || 0;
    const shift = this.aimShift || 0;

    // The camera swings on a short arc around the bench centre. Pitch is clamped
    // by the caller, so the player can lean in but never get under the plate.
    const x = t.x + Math.sin(yaw) * d * Math.cos(pitch);
    const z = t.z + Math.cos(yaw) * d * Math.cos(pitch) + 0.55;
    const y = this.camHeight + Math.sin(pitch) * d;

    if (this.inWorld) {
      // Deployed, the arc is the same arc — it is just expressed in the bench's
      // frame and then taken out into the world, so a player who walked up to
      // the bench from the yard keeps standing where they were standing.
      this._camLocal = this._camLocal || new THREE.Vector3();
      this._tgtLocal = this._tgtLocal || new THREE.Vector3();
      this.root.updateMatrixWorld();
      this._camLocal.set(x, y, z);
      this._tgtLocal.set(t.x + shift, t.y + lift, t.z);
      this.root.localToWorld(this._camLocal);
      this.root.localToWorld(this._tgtLocal);
      const headY = this.camera.position.y;
      this.camera.position.copy(this._camLocal);
      // The ground the player is standing on decides how high their head is.
      if (this.walkOwnsHeight) this.camera.position.y = headY;
      this.camera.lookAt(this._tgtLocal);
      this.camera.updateMatrixWorld(true);
      // Remember where they were stood, so the next frame can tell a player who
      // walked from a camera the instrument simply left where it was.
      this._standX = this.camera.position.x;
      this._standZ = this.camera.position.z;
      this._stood = true;
      if (this.fpsControls) {
        this.fpsControls.syncFromCamera();
      }
      return;
    }

    this.camera.position.set(x, y, z);
    this.camera.lookAt(t.x + shift, t.y + lift, t.z);
  }

  /**
   * Has the player walked off the spot the instrument stood them on?
   *
   * Read off the ground rather than off an input, so it is true for every way
   * a world can be walked — keys, sticks, anything added later — and false for
   * the one thing that moves the camera without the player asking, which is the
   * walk clamping their head to the terrain. A single frame of walking covers
   * about 70 mm, so the threshold catches a step immediately and ignores a
   * collider easing them out of a corner.
   */
  playerWalked() {
    if (!this._stood) return false;
    const dx = this.camera.position.x - this._standX;
    const dz = this.camera.position.z - this._standZ;
    return (dx * dx + dz * dz) > (0.004 * 0.004);
  }

  /**
   * Turn the player's head. The deployed bench reads its own pointer drags —
   * it has to, because a press that lands on a crate or a dial is the bench's
   * before it is the view's — and the walk's own mouse path is stood down while
   * one is up, so this is where a drag on the view becomes a look.
   *
   * @param {number} yaw radians to turn right by.
   * @param {number} pitch radians to look down by.
   */
  turnCamera(yaw, pitch) {
    if (this.fpsControls) {
      this.fpsControls.rotate(yaw, pitch);
      return;
    }
    const e = this._lookEuler || (this._lookEuler = new THREE.Euler(0, 0, 0, 'YXZ'));
    e.setFromQuaternion(this.camera.quaternion);
    e.y -= yaw;
    e.x -= pitch;
    const maxPitch = (85 * Math.PI) / 180;
    e.x = Math.max(-maxPitch, Math.min(maxPitch, e.x));
    e.z = 0;
    this.camera.quaternion.setFromEuler(e);
    this.camera.updateMatrixWorld(true);
  }

  /* ---------------- input ---------------- */

  bindEvents() {
    // The frame's panels sit over the bench. A press that starts on one of them
    // belongs to that control, not to the instrument behind it — without this,
    // pressing Commit would also probe whatever piece was under the button.
    this._isChrome = e => Boolean(
      e.target && e.target.closest &&
      // `.lq-world-panel` is the diegetic case: the deck and the tool plate have
      // left the page and are standing on the bench as screens. A press on one
      // is still a press on a control, not a lean on the instrument behind it.
      e.target.closest('.lq, .lq-world-panel, #world-ui-layer, .learn-walk-hud, .hud, .in-world-terminal, .modal-container, .modal-backdrop, .learn-host-bar, .toast-stack, #fps-interact-prompt')
    );

    this._onPointerDown = e => {
      if (this._isChrome(e)) { this.dragging = false; this.dragPointerId = null; return; }

      // A CONTROL ON THE BENCH TAKES THE PRESS BEFORE THE VIEW DOES.
      // A knob you turn and a view you swing are the same gesture — a drag —
      // so whichever one the pointer went down on has to win, or every attempt
      // to turn the power dial would also lean the camera over the bench.
      this.setPointer(e);
      const grabbed = this.grabUnderRay();
      if (grabbed) {
        this.dragging = false;
        this.grabbing = grabbed;
        this.grabPointerId = e.pointerId;
        this.lastPointer = { x: e.clientX, y: e.clientY };
        grabbed.onStart?.(e);
        e.preventDefault?.();
        return;
      }

      this.dragging = true;
      this.dragPointerId = e.pointerId;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.movedWhileDown = 0;
    };

    this._onPointerMove = e => {
      if (this.grabbing && e.pointerId === this.grabPointerId) {
        const gx = e.clientX - this.lastPointer.x;
        const gy = e.clientY - this.lastPointer.y;
        this.lastPointer = { x: e.clientX, y: e.clientY };
        this.grabbing.onMove?.(gx, gy, e);
        return;
      }
      if (!this.dragging || e.pointerId !== this.dragPointerId) return;
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.movedWhileDown += Math.abs(dx) + Math.abs(dy);

      if (this.leaning) {
        // Leaned in (standalone, or deployed in a world): a drag swings the view a little and it settles back on release. A slipped
        // grab on the plate must never walk the player off the bench (and a phone has no key to lean back in); Leave Bench and the walk keys do that.
        if (this.movedWhileDown >= 6) this.leanLook(dx, dy);
        return;
      }

      if (this.inWorld) {
        // Deployed, a drag on the view is the player turning their head, not
        // the instrument swinging on a short arc — same sign and the same
        // sensitivity as a drag anywhere else on the flat, because at a bench
        // standing in a world turning has to feel like turning did on the walk
        // in. It is the bench that reads it, on every device: the walk's own
        // mouse path is stood down while a bench is up (`mouseLookLocked`), or
        // the two would each apply the drag and the view would turn twice as
        // far as the hand did.
        if (this.movedWhileDown >= 6) {
          if (this.leaning) this.leaveLean({ walked: true });
          this.playerControlled = true;
          this.turnCamera(dx * 0.0024, dy * 0.0024);
        }
        return;
      }

      this.orbit.targetYaw = THREE.MathUtils.clamp(
        this.orbit.targetYaw - dx * 0.004, -0.55, 0.55
      );
      this.orbit.targetPitch = THREE.MathUtils.clamp(
        this.orbit.targetPitch + dy * 0.003, -0.12, 0.55
      );
    };

    this._onPointerUp = e => {
      if (this.grabbing && e.pointerId === this.grabPointerId) {
        this.grabbing.onEnd?.(e);
        this.grabbing = null;
        this.grabPointerId = null;
        return;
      }
      if (e.pointerId !== this.dragPointerId) return;
      this.dragging = false;
      this.dragPointerId = null;
      if (this.lean) this.lean.look.release = true;
      // A click is a press that did not become a drag. Anything else is the
      // player looking around, and must not be read as picking a sample.
      if (this.movedWhileDown < 6) this.handleClick(e);
    };

    this._onPointerCancel = () => {
      if (this.grabbing) this.grabbing.onEnd?.();
      this.grabbing = null;
      this.grabPointerId = null;
      this.dragging = false;
      this.dragPointerId = null;
    };

    // The wheel over a bench control turns it. Over anything else it is left
    // alone: the bench camera is on a fixed arc and has no zoom to give away.
    this._onWheel = e => {
      if (this._isChrome(e)) return;
      this.setPointer(e);
      const g = this.grabUnderRay();
      if (!g || !g.onWheel) return;
      e.preventDefault?.();
      g.onWheel(e.deltaY, e);
    };

    // Escape stands a leaned-in player back up, unless something else wants it.
    this._onLeanKey = e => {
      if (!this.leaning || e.code !== 'Escape') return;
      const modal = typeof document !== 'undefined' && document.getElementById?.('modal-container');
      if (modal && !modal.classList.contains('hidden')) return;
      this.leaveLean({ walked: this.inWorld });
    };
    window.addEventListener('keydown', this._onLeanKey);

    const canvas = (typeof document !== 'undefined') ? document.getElementById('webgl-canvas') : null;
    this._pointerTarget = (this.inWorld && canvas) ? canvas : this.domElement;
    if (this._pointerTarget) {
      this._pointerTarget.addEventListener('pointerdown', this._onPointerDown);
      this._pointerTarget.addEventListener('wheel', this._onWheel, { passive: false });
    }
    if (this.domElement && this.domElement !== this._pointerTarget) {
      this.domElement.addEventListener('pointerdown', this._onPointerDown);
      this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
    }
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerCancel);
  }

  /**
   * Register something on the bench the player can take hold of.
   *
   * @param {{
   *   object: THREE.Object3D,   what the ray has to hit
   *   onStart?: Function,
   *   onMove?: (dx: number, dy: number, e: PointerEvent) => void,
   *   onEnd?: Function,
   *   onWheel?: (deltaY: number, e: WheelEvent) => void,
   *   accepts?: (raycaster: THREE.Raycaster) => boolean   a hit volume that is only a
   *     grab where this says so (the tabletop is one wide plane; an empty spot on it
   *     is a look, not a grab)
   * }} spec
   * @returns {Function} call it to unregister
   */
  addGrabbable(spec) {
    if (!spec?.object) return () => {};
    this.grabbables = this.grabbables || [];
    this.grabbables.push(spec);
    return () => {
      this.grabbables = (this.grabbables || []).filter(g => g !== spec);
      if (this.grabbing === spec) { this.grabbing = null; this.grabPointerId = null; }
    };
  }

  /** The nearest registered control the current ray passes through, or null. */
  grabUnderRay() {
    let best = null;
    let bestDist = Infinity;
    for (const g of this.grabbables || []) {
      if (!g.object.visible) continue;
      const hit = this.raycaster.intersectObject(g.object, true);
      if (hit.length && g.accepts && !g.accepts(this.raycaster)) continue;
      if (hit.length && hit[0].distance < bestDist) {
        bestDist = hit[0].distance;
        best = g;
      }
    }
    return best;
  }

  /**
   * Screen point to normalised device coordinates for the raycaster.
   *
   * Measured against the GLASS, not against the element the listener happens to
   * be bound to. The deployed bench binds to `document.body`, whose box is the
   * whole scrolling document — taller than the viewport the scene was rendered
   * into — and dividing by that height aims every ray high by the difference.
   * `visualViewport` is what is actually visible once a phone's toolbars are
   * accounted for, which is the same rule `stage.onResize` sizes the canvas by.
   */
  setPointer(e) {
    const el = this._pointerTarget || this.domElement;
    const isBody = !el || el === document.body || el === document.documentElement;
    const vv = window.visualViewport;
    const vw = (vv && vv.width) || window.innerWidth;
    const vh = (vv && vv.height) || window.innerHeight;

    const rect = (!isBody && el.getBoundingClientRect)
      ? el.getBoundingClientRect()
      : { left: 0, top: 0, width: vw, height: vh };
    const w = rect.width || vw;
    const h = rect.height || vh;
    this.pointer.x = ((e.clientX - rect.left) / w) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / h) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  /** Subclasses override. */
  handleClick() {}

  /* ---------------- keys and readings (tools and readings are on table/frame) ---------------- */

  setKeys() {}
  setReadings() {}
  getKeyList() { return []; }

  /* ---------------- frame ---------------- */

  fitToOpenArea() {}
  fitDeployedAim() {}


  /* ---------------- leaning in ---------------- */

  /** The glass, in CSS px: the visual viewport, as the stage sizes the canvas by. */
  leanViewport() {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    return {
      w: Math.max(1, Math.round((vv && vv.width) || window.innerWidth || 1280)),
      h: Math.max(1, Math.round((vv && vv.height) || window.innerHeight || 720))
    };
  }

  /**
   * What the chrome takes off the glass while leaned in, in px: the HUD and the
   * prompt strip over the top, the foot dock under it, and a briefing docked down
   * one side. Measured when the elements are there; the modelled chrome
   * (`chromeReserve`) when they are not (Node, or before layout).
   */
  measureLeanReserve(vp = this.leanViewport()) {
    const base = chromeReserve(vp.w, vp.h);
    const out = { top: base.top, bottom: base.bottom, left: base.left, right: base.right };
    if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return out;
    const rect = el => {
      const b = el?.getBoundingClientRect?.();
      return b && b.width > 1 && b.height > 1 ? b : null;
    };
    const strip = rect(document.querySelector('.lq-tstrip'));
    if (strip) out.top = Math.max(base.hud, Math.ceil(strip.bottom) + 6);
    const dock = rect(document.querySelector('.lq-tdock'));
    if (dock) out.bottom = Math.max(0, Math.ceil(vp.h - dock.top) + 6);
    // The briefing docks down one edge on stage 1 (and only there, plan §2): the
    // table belongs in the rest of the width.
    const modal = document.getElementById?.('modal-container');
    const card = modal && !modal.classList.contains('hidden') ? modal.querySelector('.modal-card') : null;
    const box = rect(card);
    if (box && box.width < vp.w * 0.7) {
      if (box.left < vp.w * 0.3) out.left = Math.max(out.left, Math.ceil(box.right) + 10);
      else if (box.right > vp.w * 0.7) out.right = Math.max(out.right, Math.ceil(vp.w - box.left) + 10);
    }
    return out;
  }

  /**
   * Solve the leaned-in pose for the current glass and chrome (bench frame).
   * @param {{zones?: object[], viewport?: {w: number, h: number}, reserve?: object, pitchDeg?: number}} [opts]
   */
  solveLean(opts = {}) {
    const viewport = opts.viewport || this.leanViewport();
    const reserve = opts.reserve || this.measureLeanReserve(viewport);
    const zones = opts.zones || this.leanZones || [PLATE_ZONE];
    const pose = planLeanIn({ zones, viewport, reserve, fov: this.camera.fov || 55, pitchDeg: opts.pitchDeg, minDist: opts.minDist ?? this.leanMinDist, frontZ: opts.frontZ ?? this.leanFrontZ });
    pose.key = JSON.stringify([viewport, reserve, zones]);
    return pose;
  }

  /**
   * LEAN IN. From the standing aim to a pitched view (about 55 degrees down)
   * framed so the stage's used zones fit the free glass at every aspect. Only a
   * tabletop calls this; every other bench keeps the standing aim exactly.
   *
   * Taking a step stands the player back up (`playerWalked` hands the camera to
   * the walk, as it always has); `leaveLean()` and Escape do the same on demand,
   * and `[E]` at the bench leans in again.
   *
   * @param {{zones?: {x0: number, x1: number, z0: number, z1: number}[],
   *          viewport?: {w: number, h: number},
   *          reserve?: {top: number, bottom: number, left: number, right: number},
   *          pitchDeg?: number, instant?: boolean}} [opts]
   *        `zones`: the used parts of the plate, bench frame, metres (default the whole plate).
   * @returns {object} the pose, `{position, target, pitch, dist, fov, aspect, fits, safe, ndc, key}`
   */
  leanIn(opts = {}) {
    if (this.disposed) return null;
    if (opts.zones) this.leanZones = opts.zones;
    const cam = this.camera;
    const pose = this.solveLean(opts);
    if (opts.viewport) {
      cam.aspect = opts.viewport.w / opts.viewport.h;
      cam.updateProjectionMatrix();
    }
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const tween = opts.instant || reduced ? 0 : LEAN.tweenS;
    const first = !this.leaning;
    if (first) {
      this._standY = cam.position.y;
      this.lean = {
        pose, t: 0, tween, sinceFit: 0, key: pose.key,
        fromPos: cam.position.clone(), fromQuat: cam.quaternion.clone(),
        look: { yaw: 0, pitch: 0, release: false }, ref: null, wrote: null
      };
      this.leaning = true;
      this.playerControlled = false;
      if (!this.inWorld) {
        cam.clearViewOffset?.();
        cam.zoom = 1;
        cam.updateProjectionMatrix();
      }
      if (typeof document !== 'undefined') document.body?.classList?.add?.('bench-leaning');
    } else {
      // A re-solve (the chrome moved): fly on from wherever the camera is.
      Object.assign(this.lean, {
        pose, t: 0, tween: opts.instant ? 0 : Math.min(tween, 0.25), key: pose.key,
        fromPos: cam.position.clone(), fromQuat: cam.quaternion.clone()
      });
      this.playerControlled = false;
    }
    if (this.lean.tween === 0) this.settleLean();
    if (first) this.onLeanChange?.(true);
    return pose;
  }

  /** Finish the flight at once (reduced motion, and the verifier). */
  settleLean() {
    if (!this.lean) return;
    this.lean.t = 1;
    this.playerControlled = false;
    this.writeLean(0);
    if (this.inWorld && this.fpsControls) {
      this._syncedLeanToFps = true;
      this.fpsControls.syncFromCamera();
      this.fpsControls.isGrounded = true;
      this.fpsControls.verticalVelocity = 0;
      this.fpsControls.velocity.set(0, 0, 0);
    }
  }

  /** Is the camera, right now, the leaned-in pose (flight done)? */
  isLeanSettled() {
    return Boolean(this.lean && this.lean.t >= 1);
  }

  /**
   * Stand back up: the standing aim returns. `walked` is the player's own step,
   * which hands the camera straight to the walk (nothing is written to it).
   */
  leaveLean({ walked = false } = {}) {
    if (!this.leaning) return;
    this.lean = null;
    this.leaning = false;
    this.gaze = null;
    if (typeof document !== 'undefined') document.body?.classList?.remove?.('bench-leaning');
    if (walked && this.inWorld) {
      this.playerControlled = true;
      if (this.fpsControls) {
        this.fpsControls.syncFromCamera();
        this.fpsControls.isGrounded = true;
        this.fpsControls.verticalVelocity = 0;
      }
    } else {
      this.playerControlled = false;
      this._fitKey = null;
      // The walk owns how high the head is; give back the height they stood at.
      if (this.inWorld && this.walkOwnsHeight && this._standY != null) this.camera.position.y = this._standY;
      this.applyCamera();
    }
    this.onLeanChange?.(false);
  }

  /** A drag on empty table while leaned in: swing a little, settle back on release. */
  leanLook(dx, dy) {
    const L = this.lean;
    if (!L) return;
    L.look.release = false;
    L.look.yaw = THREE.MathUtils.clamp(L.look.yaw - dx * 0.0022, -0.3, 0.3);
    L.look.pitch = THREE.MathUtils.clamp(L.look.pitch - dy * 0.0022, -0.2, 0.2);
  }

  /** The lean pose carried out into the world: a camera position and orientation. */
  leanWorldPose(pose, outPos, outQuat) {
    this.root.updateMatrixWorld(true);
    const target = this._leanTgt || (this._leanTgt = new THREE.Vector3());
    outPos.set(...pose.position);
    target.set(...pose.target);
    this.root.localToWorld(outPos);
    this.root.localToWorld(target);
    const m = this._leanMat || (this._leanMat = new THREE.Matrix4());
    m.lookAt(outPos, target, new THREE.Vector3(0, 1, 0));
    outQuat.setFromRotationMatrix(m);
  }

  /** Put the camera `e` of the way from where it was to the lean pose (and add the look). */
  writeLean(delta) {
    const L = this.lean;
    const cam = this.camera;
    if (!L) return;
    if (this.inWorld && this.playerControlled) {
      if (!this._syncedLeanToFps && this.fpsControls) {
        this._syncedLeanToFps = true;
        this.fpsControls.syncFromCamera();
        this.fpsControls.isGrounded = true;
        this.fpsControls.verticalVelocity = 0;
        this.fpsControls.velocity.set(0, 0, 0);
      }
      return;
    }
    const toPos = this._leanP || (this._leanP = new THREE.Vector3());
    const toQuat = this._leanQ || (this._leanQ = new THREE.Quaternion());
    this.leanWorldPose(L.pose, toPos, toQuat);
    const t = L.tween > 0 ? Math.min(1, L.t + delta / L.tween) : 1;
    L.t = t;
    const e = t * t * (3 - 2 * t);
    cam.position.lerpVectors(L.fromPos, toPos, e);
    cam.quaternion.slerpQuaternions(L.fromQuat, toQuat, e);
    if (t >= 1 && this.inWorld && this.fpsControls && !this._syncedLeanToFps) {
      this._syncedLeanToFps = true;
      this.fpsControls.syncFromCamera();
      this.fpsControls.isGrounded = true;
      this.fpsControls.verticalVelocity = 0;
      this.fpsControls.velocity.set(0, 0, 0);
    }
    if (L.look.release) {
      const k = Math.min(1, delta * 6);
      L.look.yaw -= L.look.yaw * k;
      L.look.pitch -= L.look.pitch * k;
      if (Math.abs(L.look.yaw) < 1e-4 && Math.abs(L.look.pitch) < 1e-4) { L.look.yaw = L.look.pitch = 0; L.look.release = false; }
    }
    if (L.look.yaw || L.look.pitch) {
      const eul = this._leanEuler || (this._leanEuler = new THREE.Euler(0, 0, 0, 'YXZ'));
      eul.set(L.look.pitch, L.look.yaw, 0);
      const lq = this._leanLookQ || (this._leanLookQ = new THREE.Quaternion());
      lq.setFromEuler(eul);
      cam.quaternion.multiply(lq);
    }
    // A look at the boss turns the head off the table for as long as the beat lasts; the position stays where the lean put it.
    if (this.gaze && this.gaze.w > 0.001) this.applyGaze(cam);
    // The arena's shake belongs to whoever owns the camera, and while leaned in that is this pose (`BossArena` stands down).
    if (this.arenaFight) {
      const sh = cameraShake();
      if (sh) {
        cam.position.x += sh.posX;
        cam.position.y += sh.posY;
        cam.rotateZ(sh.roll);
      }
    }
    cam.updateMatrixWorld(true);
    L.wrote = { x: cam.position.x, z: cam.position.z };
  }

  /* ---------------- looking at the boss ---------------- */

  /** Take a look request from the arena (`bench-host.js`), if one is waiting. */
  pollGaze() {
    const req = takeGaze();
    if (!req) return;
    if (req.end || typeof req.point !== 'function') {
      if (this.gaze) this.gaze.hold = 0;
      return;
    }
    const g = this.gaze;
    this.gaze = {
      point: req.point,
      hold: req.hold ?? 1.5,
      inS: Math.max(0.05, req.inS ?? 0.35),
      outS: Math.max(0.05, req.outS ?? 0.6),
      // A new request while a look is under way carries on from where the head is.
      w: g ? g.w : 0
    };
  }

  /** One frame of the look: onto the target while it is held, back to the table after. */
  advanceGaze(delta) {
    const g = this.gaze;
    if (!g) return;
    if (g.hold > 0) {
      g.hold -= delta;
      g.w = Math.min(1, g.w + delta / g.inS);
    } else {
      g.w = Math.max(0, g.w - delta / g.outS);
      if (g.w <= 0) this.gaze = null;
    }
  }

  /** Is the view mostly off the table (so a press on the glass is not aimed at the plate)? */
  get gazing() {
    return Boolean(this.gaze && this.gaze.w > 0.12);
  }

  /** Turn the camera `w` of the way toward its target (smoothstep), keeping its position. */
  applyGaze(cam) {
    const g = this.gaze;
    const target = this._gazeTarget || (this._gazeTarget = new THREE.Vector3());
    if (!g.point(target)) return;
    const m = this._gazeMat || (this._gazeMat = new THREE.Matrix4());
    const q = this._gazeQuat || (this._gazeQuat = new THREE.Quaternion());
    m.lookAt(cam.position, target, new THREE.Vector3(0, 1, 0));
    q.setFromRotationMatrix(m);
    const e = g.w * g.w * (3 - 2 * g.w);
    cam.quaternion.slerp(q, e);
  }

  /**
   * Has the player stepped off the spot they leaned in from? The walk (which
   * runs before the viewer each frame) writes the camera from where the player
   * is; the lean writes it from its pose. A position that is neither what the
   * lean wrote nor where the walk first put it has moved because the player did.
   */
  leanWalkIntent() {
    const L = this.lean;
    const cam = this.camera;
    if (!L) return false;
    const x = cam.position.x;
    const z = cam.position.z;
    if (L.wrote && Math.abs(x - L.wrote.x) < 1e-7 && Math.abs(z - L.wrote.z) < 1e-7) return false;
    if (!L.ref) { L.ref = { x, z }; return false; }
    const dx = x - L.ref.x;
    const dz = z - L.ref.z;
    return dx * dx + dz * dz > 0.004 * 0.004;
  }

  /** Re-solve when the glass, the chrome or the used zones have changed. */
  refitLean() {
    const L = this.lean;
    if (!L) return;
    const pose = this.solveLean();
    if (pose.key === L.key) return;
    this.leanIn({});
  }

  /** One frame of leaning: the lean pose is the camera. */
  updateLean(delta) {
    const L = this.lean;
    if (!L) return;
    L.sinceFit += delta;
    if (L.sinceFit > 0.2) {
      L.sinceFit = 0;
      this.refitLean();
    }
    if (this.lean) this.writeLean(delta);
  }

  update(delta) {
    if (this.disposed) return;
    this.elapsed += delta;

    // The handover, checked before anything else reads the camera: the moment
    // the player takes a step, the bench stops standing them anywhere and stops
    // aiming for them.
    if (this.inWorld && !this.playerControlled && !this.leaning) {
      const walking = this.playerWalked() || Boolean(this.fpsControls && (
        this.fpsControls.moveForward || this.fpsControls.moveBackward ||
        this.fpsControls.moveLeft || this.fpsControls.moveRight
      ));
      if (walking) {
        this.playerControlled = true;
      }
    }

    if (this.inWorld && this.leaning) {
      const walking = this.fpsControls ? Boolean(
        this.fpsControls.moveForward || this.fpsControls.moveBackward ||
        this.fpsControls.moveLeft || this.fpsControls.moveRight ||
        this.fpsControls.velocity.lengthSq() > 0.001
      ) : this.leanWalkIntent();
      if (walking) {
        this.leaveLean({ walked: true });
        this.playerControlled = true;
      }
    }

    if (this.arenaFight) this.pollGaze();
    this.advanceGaze(delta);

    if (this.leaning) {
      this.updateLean(delta);
    } else if (!(this.inWorld && this.playerControlled)) {
      // Damped look: the view settles, it does not snap.
      this.orbit.yaw += (this.orbit.targetYaw - this.orbit.yaw) * Math.min(1, delta * 9);
      this.orbit.pitch += (this.orbit.targetPitch - this.orbit.pitch) * Math.min(1, delta * 9);
      this.applyCamera();
    }

    this.foes?.update(delta);

    if (this.haloMaterials && this.haloMaterials.length > 0) {
      const pulse = 0.78 + 0.22 * Math.sin(this.elapsed * 5.0);
      for (const m of this.haloMaterials) {
        if (m.userData?.noPulse) continue;
        m.opacity = (m.userData.baseOpacity || 0.85) * pulse;
      }
    }
    if (this.haloPointers && this.haloPointers.length > 0) {
      const bob = Math.sin(this.elapsed * 4.5) * 0.035;
      const rot = this.elapsed * 2.5;
      for (const p of this.haloPointers) {
        p.mesh.position.y = p.baseY + bob;
        p.mesh.rotation.y = rot;
      }
    }
    if (this.camera && this.haloBadges && this.haloBadges.length > 0) {
      for (const b of this.haloBadges) {
        b.quaternion.copy(this.camera.quaternion);
      }
    }
  }

  onResize() {
    this._fitKey = null;
    if (this.lean) this.lean.sinceFit = 1;
    // The world camera belongs to the stage, which sizes it against the glass
    // and the visual viewport. Taking it over here would fight that every time
    // a phone collapsed its address bar.
    if (this.inWorld) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.fitToOpenArea();
  }

  /**
   * Tear down every station's contents without destroying the bench.
   *
   * Stations borrow the bench's own steel and dark materials for their trays and
   * label backs. Disposing those here would leave the bench itself drawn with
   * dead materials the next time a stage rebuilt its stations, so anything the
   * bench owns is protected and only what the station made is freed.
   */
  clearStations() {}

  /**
   * Take a subtree off the bench and free everything it owns.
   *
   * Anything the VIEWER owns (`own()`d geometry and materials it shares across
   * every station) is left alone — it is still in use by whatever is built
   * next. An instrument that builds its own bodies tears them down through
   * here, which is the same disposal `clearStations` has always done.
   */
  releaseGroup(group) {
    if (!group) return;
    const owned = new Set(this.disposables);
    group.parent?.remove(group);
    group.traverse(o => {
      if (o.geometry && !owned.has(o.geometry)) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (owned.has(m)) continue;
          if (m.map) m.map.dispose();
          m.dispose();
        }
      }
    });
  }

  /** Drop every registered fit body. Whoever added them owns them. */
  clearFitNodes() {
    this.fitNodes = [];
    this.keysDirty = true;
  }

  /* ---------------- dial registry ---------------- */

  registerDial(record) {
    if (!record) return;
    this.dials = this.dials || [];
    if (!this.dials.some(d => d === record || d.group === record.group || d.dial === record.dial)) {
      this.dials.push(record);
    }
    if (this.haloGroup) this.showInstrumentHalos(this._activeHaloKind || 'all', this._activeHaloId);
  }

  unregisterDial(record) {
    if (!record || !this.dials) return;
    this.dials = this.dials.filter(d => d !== record && d.group !== record && d.dial !== record && (!record.group || d.group !== record.group));
    if (this.haloGroup) this.showInstrumentHalos(this._activeHaloKind || 'all', this._activeHaloId);
  }

  /* ---------------- what a bench reports to the frame ---------------- */

  getAvailableInstruments() {
    return [{
      kind: 'stations',
      name: 'The table',
      shortDesc: 'Drag the pieces',
      desc: 'Drag a piece to move it, or tap a piece and then tap where it goes. Undo takes back your last move and Start Over clears the table.',
      tag: 'DRAG OR TAP'
    }];
  }

  getKeyList() { return []; }
  showInstrumentHalos() {}
  hideInstrumentHalos() {}

  dispose() {
    this.disposed = true;
    if (this.leaning && typeof document !== 'undefined') document.body?.classList?.remove?.('bench-leaning');
    this.lean = null;
    this.leaning = false;
    window.removeEventListener('keydown', this._onLeanKey);
    this.hideInstrumentHalos();
    unregisterBenchViewer(this);
    this.readingsSnap = null;
    this.keyGroups = [];
    this.onKeyPress = null;
    if (this._pointerTarget) {
      this._pointerTarget.removeEventListener('pointerdown', this._onPointerDown);
      this._pointerTarget.removeEventListener('wheel', this._onWheel);
      this._pointerTarget = null;
    }
    if (this.domElement && this.domElement !== this._pointerTarget) {
      this.domElement.removeEventListener('pointerdown', this._onPointerDown);
      this.domElement.removeEventListener('wheel', this._onWheel);
    }
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerCancel);
    this.grabbables = [];
    this.grabbing = null;
    this.clearStations();
    this.foes?.dispose();
    this.foes = null;
    for (const d of this.disposables) {
      try { d.dispose(); } catch (e) {}
    }
    this.disposables = [];
    if (this.inWorld) {
      // The scene is the world's, and the world is still standing in it. Take
      // back exactly what was brought.
      this.scene.remove(this.root);
      this.root.clear();
    } else {
      this.scene.clear();
    }
  }
}
