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

/** Station pitch along the bench, in metres. */
const STATION_PITCH = 0.92;

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
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  let fontSize = size;
  let lines = [];
  for (let attempt = 0; attempt < 8; attempt++) {
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
    if ((lines.length * fontSize * 1.28) + pad * 2 <= h) break;
    fontSize -= 3;
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
  let y = align === 'middle' ? (h - blockH) / 2 : pad;

  for (const line of lines) {
    let x = pad;
    if (align === 'center' || align === 'middle') {
      let lw = 0;
      for (const ch of line) lw += ctx.measureText(ch).width + tracking;
      x = (w - lw) / 2;
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

  // The plinth: a wedge standing on the plate, raked toward the operator so the
  // cap's face is something you look at rather than down onto.
  const RAKE = 0.62;
  const base = new THREE.Mesh(own(new THREE.BoxGeometry(0.30, 0.035, 0.24)), dark);
  base.position.y = 0.017;
  base.castShadow = base.receiveShadow = true;
  g.add(base);
  g.add(boltLine([-0.13, 0.036, -0.09], [0.13, 0.036, -0.09], 3, dark,
    { size: 0.011, normalAxis: 'y' }));

  const face = new THREE.Group();
  face.position.set(0, 0.075, 0.012);
  face.rotation.x = -RAKE;
  g.add(face);

  const panel = new THREE.Mesh(own(new THREE.BoxGeometry(0.28, 0.022, 0.21)), steel);
  panel.castShadow = panel.receiveShadow = true;
  face.add(panel);

  // The engraved scale plate, set into the panel above the cap.
  const plaqueTex = engravedPlaque(label, { w: 320, h: 80, size: 34, align: 'center' });
  const plaqueMat = ownMat(new THREE.MeshStandardMaterial({
    map: plaqueTex, roughness: 0.85, metalness: 0.2
  }));
  const plaque = new THREE.Mesh(own(new THREE.PlaneGeometry(0.115, 0.029)), plaqueMat);
  plaque.rotation.x = -Math.PI / 2;
  plaque.position.set(0, 0.0115, -0.073);
  face.add(plaque);
  plaqueMat.userData = { ownTexture: plaqueTex };

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
  };
  setValue(value);

  return { group: g, knob, hit, setValue, geos, mats };
}

export class BenchViewer3D {
  /**
   * @param {HTMLElement} domElement the element pointer events are read from
   * @param {{
   *   backdrop?: 'awning'|'lab',
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
    this.inWorld = Boolean(world);

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
    this.disposables = [];
    this.elapsed = 0;
    this.disposed = false;

    // A constrained look-around: the player can lean over the bench and see a
    // piece from another side, but never get behind or under it.
    this.orbit = { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 };
    this.dragging = false;
    this.dragPointerId = null;
    this.lastPointer = { x: 0, y: 0 };
    // Controls bolted to the bench — a power knob, a lever — which take a press
    // before the view does. See `addGrabbable`.
    this.grabbables = [];
    this.grabbing = null;
    this.grabPointerId = null;

    this.buildLighting();
    this.buildBench();
    this.bindEvents();
    this.frameCamera(1);
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
   * One station: a chamfered tray with a recessed well, a label plate above it
   * and a note plate below. The well's floor is dark phosphor — this is a
   * cathode instrument, not a window.
   */
  buildStation(index, label, note) {
    const g = new THREE.Group();

    // Chamfered tray. An octagonal prism is a chamfer in the round: cut corners,
    // never rounded ones (CLAUDE.md §3).
    const trayGeo = this.own(new THREE.CylinderGeometry(0.34, 0.36, 0.055, 8));
    const tray = new THREE.Mesh(trayGeo, this.steelMat);
    tray.rotation.y = Math.PI / 8;
    tray.position.y = 0.925;
    tray.castShadow = tray.receiveShadow = true;
    g.add(tray);

    // The well: a recessed cylinder with a dark floor the pieces sit in.
    const wellRim = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.28, 0.016, 8, 28)),
      this.own(new THREE.MeshStandardMaterial({
        color: PLATE_RIM, roughness: 0.8, metalness: 0.5
      }))
    );
    wellRim.rotation.x = -Math.PI / 2;
    wellRim.position.y = 0.955;
    g.add(wellRim);

    const wellFloor = new THREE.Mesh(
      this.own(new THREE.CircleGeometry(0.28, 32)),
      this.own(new THREE.MeshStandardMaterial({
        color: WELL_FLOOR, roughness: 0.55, metalness: 0.05
      }))
    );
    wellFloor.rotation.x = -Math.PI / 2;
    wellFloor.position.y = 0.947;
    g.add(wellFloor);

    // The beam sweep plane: a thin phosphor bar that crosses the well once per
    // read, then fades. Hidden until a probe fires.
    const sweep = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(0.56, 0.012)),
      this.own(new THREE.MeshBasicMaterial({
        color: PHOSPHOR, transparent: true, opacity: 0, depthWrite: false
      }))
    );
    sweep.rotation.x = -Math.PI / 2;
    sweep.position.y = 0.95;
    g.add(sweep);

    // Label plate, standing at the back of the station.
    const labelTex = this.own(engravedPlaque(label, {
      w: 512, h: 96, size: 42, align: 'center', lit: false
    }));
    const labelPlate = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(0.62, 0.116)),
      this.own(new THREE.MeshStandardMaterial({
        map: labelTex, roughness: 0.9, metalness: 0.2
      }))
    );
    labelPlate.position.set(0, 1.09, -0.3);
    labelPlate.rotation.x = -0.22;
    g.add(labelPlate);

    const labelBack = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.66, 0.14, 0.02)), this.darkMat
    );
    labelBack.position.set(0, 1.088, -0.308);
    labelBack.rotation.x = -0.22;
    g.add(labelBack);

    // Status tag beside the label — blank until the quest sets one.
    const tagMesh = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(0.34, 0.07)),
      this.own(new THREE.MeshStandardMaterial({
        map: this.own(engravedPlaque('', { w: 384, h: 80, size: 36, align: 'center' })),
        roughness: 0.9, metalness: 0.2, transparent: true
      }))
    );
    tagMesh.position.set(0, 1.185, -0.28);
    tagMesh.rotation.x = -0.22;
    g.add(tagMesh);

    // Note plate, lying flat on the bench in front of the tray: the provenance
    // slip that came with the sample.
    const noteTex = this.own(engravedPlaque(note || '', {
      w: 640, h: 200, size: 28, align: 'left'
    }));
    const notePlate = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(0.62, 0.194)),
      this.own(new THREE.MeshStandardMaterial({
        map: noteTex, roughness: 0.95, metalness: 0.1
      }))
    );
    notePlate.rotation.x = -Math.PI / 2 + 0.24;
    notePlate.position.set(0, 0.906, 0.44);
    g.add(notePlate);

    // Selection indicator, set into the tray's front edge. Dead until selected.
    const indicator = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.018, 10, 8)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x4a4038, emissive: AMBER, emissiveIntensity: 0, roughness: 0.6
      }))
    );
    indicator.position.set(0, 0.945, 0.335);
    g.add(indicator);

    // The whole station sits at its place along the bench.
    g.position.x = 0;
    this.root.add(g);

    const station = {
      index, group: g, tray, wellFloor, sweep, indicator,
      labelPlate, notePlate, tagMesh,
      content: new THREE.Group(),   // whatever the instrument puts in the well
      sweepT: 0
    };
    g.add(station.content);
    station.content.position.y = 0.95;

    this.stations.push(station);
    return station;
  }

  /** Re-space the stations so N of them sit centred on the bench. */
  layoutStations() {
    const n = this.stations.length;
    const span = (n - 1) * STATION_PITCH;
    this.stations.forEach((st, i) => {
      st.group.position.x = -span / 2 + i * STATION_PITCH;
    });
    this.frameCamera(n);
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

  applyCamera() {
    const yaw = this.orbit.yaw;
    const pitch = this.orbit.pitch;
    const d = this.camDist;
    const t = this.camTarget;

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
      this._tgtLocal.copy(t);
      this.root.localToWorld(this._camLocal);
      this.root.localToWorld(this._tgtLocal);
      this.camera.position.copy(this._camLocal);
      this.camera.lookAt(this._tgtLocal);
      this.camera.updateMatrixWorld(true);
      return;
    }

    this.camera.position.set(x, y, z);
    this.camera.lookAt(t);
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

    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerCancel);
    this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
  }

  /**
   * Register something on the bench the player can take hold of.
   *
   * @param {{
   *   object: THREE.Object3D,   what the ray has to hit
   *   onStart?: Function,
   *   onMove?: (dx: number, dy: number, e: PointerEvent) => void,
   *   onEnd?: Function,
   *   onWheel?: (deltaY: number, e: WheelEvent) => void
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
    const el = this.domElement;
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

  /** Which station, if any, the ray passes through. */
  stationUnderRay() {
    for (const st of this.stations) {
      const hit = this.raycaster.intersectObject(st.tray, false);
      if (hit.length) return st;
      const hit2 = this.raycaster.intersectObject(st.wellFloor, false);
      if (hit2.length) return st;
    }
    return null;
  }

  /** Fire the read sweep across one station's well. */
  runSweep(station) {
    if (!station) return;
    station.sweepT = 1;
  }

  /** Set a station's status tag. The text is the quest's, rendered verbatim. */
  setStationTag(station, text) {
    if (!station) return;
    const old = station.tagMesh.material.map;
    station.tagMesh.material.map = engravedPlaque(text || '', {
      w: 384, h: 80, size: 36, align: 'center', lit: Boolean(text)
    });
    station.tagMesh.material.needsUpdate = true;
    if (old) old.dispose();
  }

  setStationSelected(station, on) {
    if (!station) return;
    station.indicator.material.emissiveIntensity = on ? 1.6 : 0;
    station.indicator.material.color.setHex(on ? AMBER : 0x4a4038);
  }

  /* ---------------- frame ---------------- */

  /**
   * Centre the bench in the part of the screen the frame is not covering.
   *
   * At T4 the quest frame sits as a panel over the 3D view, so without this the
   * instrument would be half behind it. This is the same `setViewOffset` trick
   * `quest3d/viewer.js` uses to keep the containment chamber clear of the stage
   * deck on a phone, applied to the bench and its deck panel.
   */
  fitToOpenArea() {
    // Deployed, the interface is not a panel over the view — it is bolted to the
    // bench inside it. There is nothing to dodge, and applying a view offset to
    // the world camera would skew the whole of Tallow to make room for a card
    // that is not there.
    if (this.inWorld) return;

    const cam = this.camera;
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (W < 1 || H < 1) return;

    let l = 0, t = 0, r = W, b = H;
    for (const el of document.querySelectorAll('.lq-deck, .lq-stage, .hud, .learn-host-bar')) {
      const box = el.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) continue;
      const midY = (box.top + box.bottom) / 2;
      if (box.width > W * 0.6) {
        if (midY < H / 2) t = Math.max(t, box.bottom);
        else b = Math.min(b, box.top);
      } else if (box.left > W * 0.4) {
        r = Math.min(r, box.left);
      } else if (box.height > H * 0.4) {
        l = Math.max(l, box.right);
      }
    }

    let w = r - l;
    let h = b - t;
    if (w < 120 || h < 120) { l = 0; t = 0; w = W; h = H; }

    const key = `${W}|${H}|${Math.round(l)}|${Math.round(t)}|${Math.round(w)}|${Math.round(h)}`;
    if (key === this._fitKey) return;
    this._fitKey = key;

    cam.aspect = w / h;
    cam.zoom = Math.min(1, (w / h) / 1.7);
    cam.setViewOffset(w, h, -l, -t, W, H);
    cam.updateProjectionMatrix();
  }

  update(delta) {
    if (this.disposed) return;
    this.elapsed += delta;

    // Re-measure a few times a second: the frame's deck changes height as hints
    // open and a reward card appears, and the bench should stay clear of it.
    this._sinceFit = (this._sinceFit || 0) + delta;
    if (this._sinceFit > 0.2) {
      this._sinceFit = 0;
      this.fitToOpenArea();
    }

    // Damped look: the view settles, it does not snap.
    this.orbit.yaw += (this.orbit.targetYaw - this.orbit.yaw) * Math.min(1, delta * 9);
    this.orbit.pitch += (this.orbit.targetPitch - this.orbit.pitch) * Math.min(1, delta * 9);
    this.applyCamera();

    for (const st of this.stations) {
      if (st.sweepT > 0) {
        st.sweepT = Math.max(0, st.sweepT - delta * 1.6);
        const t = 1 - st.sweepT;
        st.sweep.position.z = -0.28 + t * 0.56;
        st.sweep.material.opacity = 0.5 * st.sweepT;
      } else if (st.sweep.material.opacity !== 0) {
        st.sweep.material.opacity = 0;
      }
    }
  }

  onResize() {
    this._fitKey = null;
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
  clearStations() {
    const owned = new Set(this.disposables);
    for (const st of this.stations) {
      this.root.remove(st.group);
      st.group.traverse(o => {
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
    this.stations = [];
  }

  dispose() {
    this.disposed = true;
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerCancel);
    this.domElement.removeEventListener('wheel', this._onWheel);
    this.grabbables = [];
    this.grabbing = null;
    this.clearStations();
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
