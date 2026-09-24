/**
 * joinbench3d.js — The join bench, built as an instrument instead of drawn as one.
 *
 * This is `joinbench.js` in three dimensions, for Ligar at T4. It is a SUBCLASS
 * of the drawn bench rather than a second implementation of it: `press`,
 * `strike`, `heat`, `cool`, `test`, `run` and the animation clock are inherited
 * unchanged, and every reading they report comes from the same pure planners
 * (`planJoin`, `planSlab`, `conductionOf`, `shellsAfter`). A stage that grades
 * correct on the canvas bench grades correct here because it is the same code
 * deciding — the rule that keeps T4 a fidelity tier and not a second game.
 *
 * What changes is only where the player stands, and what is drawn where.
 *
 * THE PICTURE IS FLAT, THE INSTRUMENT IS BUILT. What the bench RESOLVES — the
 * two atoms, their shells, the electrons that move or are shared, the
 * pattern inside a block — is drawn on the raked screen over each station by
 * `drawJoinField` / `drawSlabField`, the very functions the canvas plate calls.
 * A shell picture staged as rings of beads in a well would hide the back of
 * every shell behind its front, and the counts the quest asks for would be
 * counts of a picture the player could not see all of. Drawn flat, every piece
 * is in the picture at a countable size, on every tier, and a hint that names
 * a position stays true on both.
 *
 * What stands in the WELL is the hardware the picture is of:
 *   - a PAIR plate is a press — two jaws on a screw across the well, each
 *     holding a pellet of its kind — and the jaws close by exactly the amount
 *     the inherited `t` says, spring back when nothing holds, and stay shut
 *     when it does;
 *   - a SLAB plate is a block of stone in a clamp. Struck, it cleaves along
 *     one face, crumbles, or does nothing; heated, it glows and slumps; cooled,
 *     it sets again; tested, a lamp on the clamp lights or stays dark.
 *
 * THE BLOCK SHOWS WHAT THE BENCH REPORTS AND NOTHING MORE. Every one of those
 * states is read off `item.state`, `item.struck` and `item.current` — the
 * values the quest is told — so a SEALED block, which stage seven asks the
 * player to identify from how it behaves, gives away exactly what the readout
 * already says and never what is inside it.
 *
 * It knows no chemistry. A pellet is a pellet and a block is a block.
 */

import * as THREE from 'three';
import {
  JoinBench, drawJoinField, drawSlabField, hitTestJoin, planJoin, shellsAfter, TINTS
} from './joinbench.js';
import { BenchViewer3D, TINT_HEX } from './bench3d.js';
import { benchHost } from './bench-host.js';

/** The well's radius in metres, matching the tray every station is built on. */
const WELL_R = 0.27;

/** Jaw travel, in metres from the well's centre: open, and shut on a pair. */
const JAW_OPEN = 0.19;
const JAW_SHUT = 0.085;

/** A block's dimensions in the clamp. */
const BLOCK = { w: 0.30, h: 0.13, d: 0.2 };

/** The furnace colour a molten block glows. The only warm light on the bench. */
const HEAT = 0xc1521c;

function tintHex(name) {
  return (TINT_HEX[name] || TINT_HEX.pale);
}

export class JoinBench3D extends JoinBench {
  /**
   * @param {HTMLElement} host the frame's instrument host. Kept empty: the
   *   instrument is in the scene, not in the DOM.
   * @param {{onProbe?: Function, onSelect?: Function, world?: object,
   *          mountScene?: Function, unmountScene?: Function}} opts
   */
  constructor(host, opts = {}) {
    super(host, opts);

    // `stations` is set before anything can call a setter on it: a quest may
    // set a tag or a selection before its first `setPlates`.
    this.stations = [];

    // With `opts.world` the instrument deploys onto the bench that is already
    // standing on the ground in front of the player, rather than building a
    // private room for itself.
    this.viewer = new BenchViewer3D(document.body, {
      backdrop: opts.backdrop || 'lab',
      world: opts.world || null
    });
    this.viewer.handleClick = e => this.onPointer3D(e);

    if (this.host) this.host.innerHTML = '';

    const renderHost = benchHost();
    this.mountScene = opts.mountScene || (v => renderHost.mount(v));
    this.unmountScene = opts.unmountScene || (v => renderHost.unmount(v));
    this.mountScene(this.viewer);

    // The base class listens for resize to re-measure DOM plates; here the
    // viewer is what has to follow the window.
    window.removeEventListener('resize', this.onResize);
    this.onResize = () => this.viewer.onResize();
    window.addEventListener('resize', this.onResize);
  }

  /* ---------------- DOM hooks, redirected into the scene ---------------- */

  setSelectable(on) {
    this.selectable = Boolean(on);
  }

  setSelected(id) {
    this.selected = id;
    this.stations.forEach(rec =>
      this.viewer.setStationSelected(rec.station, rec.item.id === id)
    );
  }

  setPlateTag(id, text) {
    const rec = this.stations.find(r => r.item.id === id);
    if (rec) this.viewer.setStationTag(rec.station, text);
  }

  /** The base class calls this from `setPlates`. Lay the stations out. */
  build() {
    if (!this.viewer) return;
    this.viewer.clearStations();
    this.stations = [];

    this.items.forEach((item, i) => {
      const station = this.viewer.buildStation(i, item.label, item.note || '');
      const rec = item.type === 'slab'
        ? this.buildBlock(station, item)
        : this.buildPress(station, item);
      this.stations.push(rec);
    });

    this.viewer.layoutStations();
    this.drawAll();
  }

  /** Nothing to measure: the screens are a fixed size. */
  layoutAll() {
    this.drawAll();
  }

  /* ---------------- the hardware in the well ---------------- */

  /**
   * A PAIR plate: a press across the well. A bed rail, two jaws that slide on
   * it, a screw between them and a pellet held in each jaw.
   */
  buildPress(station, item) {
    const c = station.content;
    const geos = [];
    const mats = [];
    const own = (g, m) => { if (g) geos.push(g); if (m) mats.push(m); };

    const steel = new THREE.MeshStandardMaterial({ color: 0x55504a, roughness: 0.55, metalness: 0.75 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2f2b27, roughness: 0.7, metalness: 0.6 });
    own(null, steel); own(null, dark);

    const railGeo = new THREE.BoxGeometry(WELL_R * 2 * 0.94, 0.018, 0.05);
    own(railGeo);
    const rail = new THREE.Mesh(railGeo, dark);
    rail.position.y = 0.012;
    c.add(rail);

    const screwGeo = new THREE.CylinderGeometry(0.008, 0.008, WELL_R * 2 * 0.9, 8);
    own(screwGeo);
    const screw = new THREE.Mesh(screwGeo, steel);
    screw.rotation.z = Math.PI / 2;
    screw.position.set(0, 0.032, -0.036);
    c.add(screw);

    const jawGeo = new THREE.BoxGeometry(0.03, 0.07, 0.09);
    own(jawGeo);
    const pelletGeo = new THREE.IcosahedronGeometry(1, 1);
    own(pelletGeo);

    const sides = {};
    for (const side of ['left', 'right']) {
      const piece = item[side] || {};
      const tint = tintHex(piece.tint);
      const pelletMat = new THREE.MeshStandardMaterial({
        color: tint.fill, roughness: 0.82, metalness: 0.05, flatShading: true
      });
      own(null, pelletMat);

      const jaw = new THREE.Group();
      const block = new THREE.Mesh(jawGeo, steel);
      block.position.y = 0.047;
      jaw.add(block);
      // The pellet sits on the INSIDE face of its jaw. Its size follows how
      // many shells the piece has, the same way the picture's radius does, so
      // "bigger" means the same thing on the bench and on the screen.
      const shells = (piece.shells || []).length || 1;
      const r = 0.018 + shells * 0.009;
      const pellet = new THREE.Mesh(pelletGeo, pelletMat);
      pellet.scale.setScalar(r);
      pellet.position.set(side === 'left' ? 0.015 + r : -0.015 - r, 0.047, 0);
      jaw.add(pellet);
      jaw.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
      c.add(jaw);
      sides[side] = { jaw, pellet, r };
    }

    // What a press on this pair will do. Asked of `planJoin`, never guessed,
    // and fixed for the stage: the pair in the clamp does not change.
    const planType = planJoin(item).type;
    return { kind: 'pair', item, station, sides, geos, mats, planType };
  }

  /**
   * A SLAB plate: a block of stone in a clamp, with two electrode clips on it
   * and a lamp on the clamp frame that lights when a current passes.
   *
   * The block is built as TWO halves from the start, fitted flush: a cleave is
   * then the halves sliding apart, which is exactly what `planSlab` draws for a
   * struck grid — one plane, one cell of slip — and a crumble is the halves
   * breaking into chips. An intact block is two halves nobody can tell apart.
   */
  buildBlock(station, item) {
    const c = station.content;
    const geos = [];
    const mats = [];
    const own = (g, m) => { if (g) geos.push(g); if (m) mats.push(m); };

    const tint = tintHex(item.tint);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: tint.fill, roughness: 0.88, metalness: 0.02,
      emissive: HEAT, emissiveIntensity: 0
    });
    const steel = new THREE.MeshStandardMaterial({ color: 0x55504a, roughness: 0.55, metalness: 0.75 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2f2b27, roughness: 0.7, metalness: 0.6 });
    // The lamp on the clamp. Dead until a test finds a current.
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0x4a4038, emissive: 0xd99423, emissiveIntensity: 0, roughness: 0.6
    });
    own(null, stoneMat); own(null, steel); own(null, dark); own(null, lampMat);

    const halfGeo = new THREE.BoxGeometry(BLOCK.w / 2, BLOCK.h, BLOCK.d);
    own(halfGeo);
    const halves = [];
    for (const s of [-1, 1]) {
      const half = new THREE.Mesh(halfGeo, stoneMat);
      half.position.set(s * BLOCK.w / 4, BLOCK.h / 2 + 0.006, 0);
      half.castShadow = half.receiveShadow = true;
      c.add(half);
      halves.push(half);
    }

    // Chips a crumbled block breaks into. Hidden until it crumbles.
    const chipGeo = new THREE.DodecahedronGeometry(1, 0);
    own(chipGeo);
    const chips = [];
    for (let i = 0; i < 9; i++) {
      const chip = new THREE.Mesh(chipGeo, stoneMat);
      const a = (i / 9) * Math.PI * 2;
      chip.userData.home = new THREE.Vector3(
        Math.cos(a) * (0.05 + (i % 3) * 0.035), 0.022, Math.sin(a) * (0.04 + (i % 2) * 0.03)
      );
      chip.scale.setScalar(0.022 + (i % 4) * 0.006);
      chip.position.copy(chip.userData.home);
      chip.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      chip.visible = false;
      chip.castShadow = true;
      c.add(chip);
      chips.push(chip);
    }

    // The clamp: two end plates on a rail, either side of the block.
    const endGeo = new THREE.BoxGeometry(0.02, 0.12, 0.16);
    own(endGeo);
    for (const s of [-1, 1]) {
      const end = new THREE.Mesh(endGeo, steel);
      end.position.set(s * (BLOCK.w / 2 + 0.035), 0.066, 0);
      c.add(end);
      // An electrode clip on top of each end, reaching onto the block.
      const clipGeo = new THREE.BoxGeometry(0.05, 0.012, 0.03);
      own(clipGeo);
      const clip = new THREE.Mesh(clipGeo, dark);
      clip.position.set(s * (BLOCK.w / 2 + 0.01), BLOCK.h + 0.014, 0);
      c.add(clip);
    }
    const railGeo = new THREE.BoxGeometry(BLOCK.w + 0.12, 0.012, 0.04);
    own(railGeo);
    const rail = new THREE.Mesh(railGeo, dark);
    rail.position.set(0, 0.006, BLOCK.d / 2 + 0.03);
    c.add(rail);

    const lampGeo = new THREE.SphereGeometry(0.012, 10, 8);
    own(lampGeo);
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(BLOCK.w / 2 + 0.035, 0.14, 0);
    c.add(lamp);

    return {
      kind: 'slab', item, station, halves, chips, stoneMat, lampMat, lamp,
      geos, mats, tint
    };
  }

  /* ---------------- drawing ---------------- */

  /**
   * Everything the base class draws goes through here: the picture onto each
   * screen, and the hardware in each well brought into line with the same
   * item state the picture was drawn from.
   */
  drawAll() {
    if (this.disposed || !this.viewer) return;
    for (const rec of this.stations) this.drawStation(rec);
  }

  drawStation(rec) {
    const item = rec.item;
    const sc = rec.station.screen;
    const sweep = this.probe && this.probe.plateId === item.id ? this.sweep : 0;

    rec.hits = item.type === 'slab'
      ? drawSlabField(sc.ctx, {
        w: sc.w, h: sc.h, slab: item, state: item.state,
        current: item.current, temp: item.temp, sweep
      })
      : drawJoinField(sc.ctx, {
        w: sc.w, h: sc.h, pair: item, t: item.t,
        probe: this.probe && this.probe.plateId === item.id ? this.probe.side : null,
        sweep
      });
    this.viewer.refreshScreen(rec.station);

    if (rec.kind === 'pair') this.posePress(rec);
    else this.poseBlock(rec);
  }

  /** Close the jaws by exactly the amount the inherited clock says. */
  posePress(rec) {
    const t = Math.max(0, Math.min(1, rec.item.t || 0));
    // The same easing `joinGeometry` uses for the picture, so the jaws and the
    // pieces on the screen move together: a pair that will not hold is pushed
    // in and springs back, one that holds closes and stays shut.
    const plan = rec.planType;
    const close = plan === 'none'
      ? Math.sin(t * Math.PI) * 0.35
      : t;
    const shut = plan === 'share' ? JAW_SHUT : JAW_SHUT + 0.02;
    const x = JAW_OPEN + (shut - JAW_OPEN) * close;
    rec.sides.left.jaw.position.x = -x;
    rec.sides.right.jaw.position.x = x;
  }

  /** Bring the block into line with the state the bench has reported. */
  poseBlock(rec) {
    const item = rec.item;
    const molten = item.state === 'molten';
    const struck = item.state === 'struck';

    // Cleaved: the halves slide apart along the one plane, and the right half
    // steps down a little, the slip the picture shows. Held: nothing moves.
    const cleaved = struck && item.build === 'grid';
    const crumbled = struck && item.build === 'clusters';

    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? -1 : 1;
      const half = rec.halves[i];
      // A crumbled block is its chips; melted, it runs back into one mass.
      half.visible = molten || !crumbled;
      half.position.x = s * BLOCK.w / 4 + (cleaved ? s * 0.022 : 0);
      half.position.y = BLOCK.h / 2 + 0.006 - (cleaved && s > 0 ? 0.012 : 0);
      half.rotation.z = cleaved ? s * 0.05 : 0;
      // A molten block slumps: lower, wider, and glowing.
      half.scale.set(molten ? 1.18 : 1, molten ? 0.55 : 1, molten ? 1.12 : 1);
      if (molten) half.position.y = (BLOCK.h * 0.55) / 2 + 0.004;
    }
    for (const chip of rec.chips) chip.visible = crumbled && !molten;

    rec.stoneMat.emissiveIntensity = molten ? 1.35 : 0;
    rec.stoneMat.color.setHex(molten ? 0x6a2c12 : rec.tint.fill);

    // The lamp says what the last test found: lit for a current, dark for none,
    // and dark again once the block changes state and the reading is stale.
    rec.lampMat.emissiveIntensity = item.current === true ? 1.8 : 0;
  }

  /* ---------------- input ---------------- */

  /**
   * A press on a SCREEN reads a piece, the same way a press on the canvas plate
   * does: `hitTestJoin` against the hit list the picture was drawn with. A
   * press anywhere else on a station — the press, the block, the tray —
   * selects that plate. A press that read a piece is spent, and does not also
   * select: that is the bug the canvas bench's `pieceTaken` flag exists to stop.
   */
  onPointer3D(e) {
    if (this.disposed) return;
    this.viewer.setPointer(e);

    const onScreen = this.viewer.screenUnderRay();
    const rec = onScreen
      ? this.stations.find(r => r.station === onScreen.station)
      : this.recUnderRay();
    if (!rec) return;

    if (onScreen && this.onProbe) {
      const hit = hitTestJoin(rec.hits, onScreen.px, onScreen.py);
      if (hit) {
        this.reportProbe(rec.item, hit.side);
        return;
      }
    }
    if (this.selectable && this.onSelect) this.onSelect(rec.item.id);
  }

  /**
   * The station under the pointer when it is NOT on a screen. The tray and the
   * well floor are what the viewer tests; the press and the block stand ON
   * them, and a press that lands on the block the player is looking at has to
   * choose that block rather than fall through to nothing.
   */
  recUnderRay() {
    const st = this.viewer.stationUnderRay();
    if (st) return this.stations.find(r => r.station === st) || null;
    let best = null;
    for (const rec of this.stations) {
      const hit = this.viewer.raycaster.intersectObject(rec.station.content, true);
      if (hit.length && (!best || hit[0].distance < best.d)) best = { rec, d: hit[0].distance };
    }
    return best ? best.rec : null;
  }

  /**
   * The same report the canvas bench makes, built by the same rule: the shells
   * a piece ends up with come from `shellsAfter`, its charge from `planJoin`,
   * and neither is recomputed here.
   */
  reportProbe(item, side) {
    this.probe = { plateId: item.id, side };
    this.sweep = 1;
    this.startAnim();
    const rec = this.stations.find(r => r.item.id === item.id);
    if (rec) this.viewer.runSweep(rec.station);

    if (item.type === 'slab') {
      this.onProbe({ plateId: item.id, plateLabel: item.label, side: 'slab', slab: item });
      return;
    }
    const piece = side === 'left' ? item.left : item.right;
    this.onProbe({
      plateId: item.id,
      plateLabel: item.label,
      side,
      piece,
      shells: item.pressed ? shellsAfter(item, side) : (piece.shells || []).slice(),
      charge: item.pressed ? (planJoin(item).charge?.[side] ?? 0) : 0,
      pressed: item.pressed
    });
  }

  /**
   * Torn down here rather than by the base class: the drawn bench's `dispose`
   * clears a DOM host, and the built one may have none — the host is kept
   * empty in the game and is absent in the verifier.
   */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    window.removeEventListener('resize', this.onResize);
    if (this.host) this.host.innerHTML = '';
    for (const rec of this.stations) {
      for (const g of rec.geos || []) g.dispose();
      for (const m of rec.mats || []) m.dispose();
    }
    this.stations = [];
    this.unmountScene(this.viewer);
    this.viewer.dispose();
  }
}

export { TINTS };
