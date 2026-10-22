/**
 * table3d.js — The built tabletop: the same table, worked from above.
 *
 * `Table3D` is a `BenchViewer3D` (never a second viewer): the plate, the camera,
 * the pointer plumbing, `addGrabbable` and `leanIn()` are the bench's own. What
 * it adds is the table: the `TableState` (`table/model.js`) drawn as pieces on
 * the plate, and a hand to move them.
 *
 * TWO VIEWS, ONE TABLE. `Table2D` (`table2d.js`) paints the state on a canvas;
 * this builds it. Both are given a state by the stage runner and answer with
 * reducer actions through `onAction`; neither changes a table, and the gestures
 * between a pointer and an action are `table/gestures.js` in both, so a stage
 * grades identically whichever the player has. THE PICTURE IS HONEST: the flat
 * part of the plate (zones, labels, jar levels) is `drawTable`'s own picture, the
 * same function the canvas calls; what stands up from it (pieces, jars, the
 * dials and Run key of a fixture, the paper strip) is built from the same state
 * and nothing else.
 *
 * INPUT. The whole plate is one grabbable (`addGrabbable`), a wide hit volume
 * that takes a press only where `TableGestures.wouldGrab` says something is
 * there: a piece (grab radius 1.5 x the piece, never under 16 px), a dial, a Run
 * key, a jar, the paper strip. An empty spot is a look (the bench's own drag),
 * and a tap on it with a piece in the hand is the two-tap twin. A press is
 * turned into table units by casting the ray onto the plane y = plate top, so a
 * piece follows the pointer on the plate, lifts 3 cm while held, and settles.
 * The cursor is never captured.
 *
 * LEANING IN. Built, the table leans the camera in as soon as it has a state
 * (`leanIn`, zones = the table's own rectangle on the plate), and re-frames when
 * the stage's table changes. A step stands the player up; `[E]` at the bench
 * leans in again; a world's field point (`three/field-points.js`) is `[E]` too.
 *
 * Aesthetic: dust and phosphor on durasteel; nothing blooms, nothing is lit but
 * lamps. A host's own materials dress the fixtures (`opts.world.materials`).
 */

import * as THREE from 'three';
import { BenchViewer3D, engravedPlaque, AMBER, PHOSPHOR } from './bench3d.js';
import { benchHost, guideTo } from './bench-host.js';
import { getKit, radiusOf } from '../table/kits/index.js';
import { dishUnder } from '../table/kits/atoms.js';
import { SIZES, rectOf } from '../table/snap.js';
import { plateMap, fixtureLayout, pieceTargets, foePadOf, FOE_HEADROOM_M } from '../table/layout.js';
import { TableGestures, pendingFetch } from '../table/gestures.js';
import { lineOf, readY } from '../table/recorder.js';
import { drawTable, faceOf } from './table2d.js';
import { TableKeys } from './table-keys.js';
import { TrendPlot } from './trendplot.js';
import { PLATE_SURFACE_Y } from './lean.js';
import { pickAimTarget, aimBox } from '../../three/aim-target.js';
import { fieldAimTargets, fieldPointById } from '../../three/field-points.js';

const PLATE_Y = PLATE_SURFACE_Y;
/** The flat picture lies this far above the plate; everything stands on it. */
const GROUND_Y = PLATE_Y + 0.0015;
/** How far a piece in the hand (or on the pointer) is lifted. */
const LIFT = 0.045;
const PUCK_T = 0.022;
const CARD_T = 0.010;

/** Half the width of a card, in table units: wide enough for its label, never under its radius. */
export function cardHalf(text, r) {
  return Math.min(r * 4, Math.max(r, 0.5 * (String(text).length * 1.15 + 3.5)));
}

export class Table3D extends BenchViewer3D {
  /**
   * @param {HTMLElement} host where the drawn tabletop would go (unused, emptied)
   * @param {{
   *   onAction?: (action: object) => void,
   *   tools?: string[],
   *   toolHost?: HTMLElement,                   where the keys go (the foot dock)
   *   onLeanChange?: (leaning: boolean) => void,
   *   onCarry?: (label: string|null) => void,
   *   world?: object, mountScene?: Function, unmountScene?: Function, backdrop?: string,
   *   room?: string                              a named room to stand the table in (`rooms.js`) where there is no host
   * }} opts
   */
  constructor(host, opts = {}) {
    super(document.body, { backdrop: opts.backdrop || 'lab', world: opts.world || null, room: opts.room || null });
    this.built = true;
    this.host = host || null;
    if (this.host) this.host.innerHTML = '';

    this.onAction = opts.onAction || null;
    this.toolIds = opts.tools || [];
    this.onLeanChange = opts.onLeanChange || null;
    this.onCarry = opts.onCarry || null;

    this.state = null;
    this.map = null;
    this.shown = {};          // eased positions, id -> {x, y} in table units
    this.lifts = {};          // eased lift, id -> metres
    this.drag = null;
    this.railGap = null;
    this.carry = null;        // { id, label } the field item on the player, not yet on the table
    this.entries = new Map(); // piece id -> { group, sig, ... }
    this.plaques = new Map(); // text key -> texture
    this.boardKey = '';
    this.reduced = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

    // The materials a world dresses its bench in; the bench kit's own otherwise.
    this.worldKit = Boolean(opts.world?.materials);
    // ...or a named room's (Kettle's foundry: its cast-iron plate, its blackened rims, its firebrick ore tubs);
    // the bench kit's own only where there is neither a host nor a room.
    this.mats = opts.world?.materials || this.room?.mats || { top: this.steelMat, dark: this.darkMat };

    this.table = new THREE.Group();
    this.table.name = 'tabletop';
    this.root.add(this.table);
    this.fixtureRoot = new THREE.Group();   // everything of the host's kit: rims, jars, dials, the strip
    this.fixtureRoot.name = 'tabletop-fixtures';
    this.pieceRoot = new THREE.Group();
    this.pieceRoot.name = 'tabletop-pieces';
    this.joinRoot = new THREE.Group();
    this.table.add(this.fixtureRoot, this.joinRoot, this.pieceRoot);

    this.gestures = new TableGestures(this);
    // The world the bench stands in, for its field points (`three/field-points.js`).
    this.worldObject = opts.world?.object || null;
    if (opts.world?.dormant) opts.world.dormant.visible = false;
    this.keys = new TableKeys(opts.toolHost || this.host || document.body, a => this.onAction?.(a), {
      // Where the world has the point, the player walks to it; a key would only be a shortcut past it.
      skipFetch: id => Boolean(fieldPointById(this.worldObject, id))
    });

    this.hitMat = this.own(new THREE.MeshBasicMaterial({ visible: false }));

    const renderHost = benchHost();
    this.mountScene = opts.mountScene || (v => renderHost.mount(v));
    this.unmountScene = opts.unmountScene || (v => renderHost.unmount(v));
    this.mountScene(this);

    this.frameCamera(3);
  }

  /* ---------------- the view contract TableGestures reads ---------------- */

  posOf(id) { return this.shown[id]; }
  dispatch(action) { this.onAction?.(action); }
  dragAt() { return this.drag?.at || null; }
  setDrag(drag, gap) { this.drag = drag; this.railGap = gap; this.repaintGround(); }
  changed() { this.repaintGround(); }
  /** Where the world has a field point the player walks to it, so no plate is drawn or tapped. */
  showsSite(id) { return !fieldPointById(this.worldObject, id); }

  /** Screen pixels to table units at the table's scale, where the camera is now. */
  pxToUnits(px) {
    return px / this.pxPerUnit();
  }

  pxPerUnit() {
    if (!this.map || !this.state) return 3.4;
    const cam = this.camera;
    cam.updateMatrixWorld(true);
    this.root.updateMatrixWorld(true);
    const vp = this.leanViewport();
    const c = this.map.toPlate({ x: this.state.bounds.w / 2, y: this.state.bounds.h / 2 });
    const a = new THREE.Vector3(c.x, PLATE_Y, c.z);
    const b = new THREE.Vector3(c.x + this.map.s, PLATE_Y, c.z);
    this.root.localToWorld(a);
    this.root.localToWorld(b);
    a.project(cam);
    b.project(cam);
    const px = Math.hypot((b.x - a.x) * vp.w / 2, (b.y - a.y) * vp.h / 2);
    return px > 0.01 ? px : 3.4;
  }

  /** Where the current ray meets the plate, as table units (null above the horizon). */
  unitsAtRay(ray = this.raycaster.ray) {
    if (!this.map) return null;
    this.root.updateMatrixWorld(true);
    const inv = (this._invRoot || (this._invRoot = new THREE.Matrix4())).copy(this.root.matrixWorld).invert();
    const o = ray.origin.clone().applyMatrix4(inv);
    const d = ray.direction.clone().transformDirection(inv);
    if (Math.abs(d.y) < 1e-6) return null;
    const t = (GROUND_Y - o.y) / d.y;
    if (t < 0) return null;
    return this.map.toUnits({ x: o.x + d.x * t, z: o.z + d.z * t });
  }

  unitsAt(e) {
    this.setPointer(e);
    return this.unitsAtRay();
  }

  /* ---------------- the state ---------------- */

  /** Take a new state: pieces ease to where it puts them, the board follows it. */
  setState(state, opts = {}) {
    if (this.disposed) return;
    const first = !this.state;
    const stageChanged = Boolean(opts.newStage || (opts.stageIndex != null && opts.stageIndex !== this.stageIndex));
    if (opts.stageIndex != null) this.stageIndex = opts.stageIndex;
    this.state = state;
    const key = this.boardSignature(state);
    const rebuilt = key !== this.boardKey;
    if (rebuilt) {
      this.boardKey = key;
      this.map = plateMap(state.bounds);
      this.buildBoard();
      // A different table is different pieces, whatever ids they share with the last one: build them afresh.
      for (const e of this.entries.values()) { this.pieceRoot.remove(e.group); this.freeGroup(e.group); }
      this.entries.clear();
    }
    for (const id of Object.keys(this.shown)) if (!state.pieces[id]) delete this.shown[id];
    for (const p of Object.values(state.pieces)) {
      if (first || rebuilt || !this.shown[p.id]) this.shown[p.id] = { ...p.at };
    }
    this.gestures.gesture = null;
    this.drag = null;
    this.railGap = null;

    this.repaintGround();
    this.syncJars();
    this.syncPiles();
    this.syncFixtures();
    this.syncSheet();
    this.syncPieces();
    this.syncJoins();
    this.keys.render(state, state.tools || this.toolIds);
    this.settleToTargets(this.reduced || first || rebuilt);

    this.syncGuide();

    // A fight's foe stands in the table's corner pad: it moves with the board it stands on.
    if (rebuilt && this.foes?.enc) this.foes.dirty = true;

    // The stage's table is the part of the plate in use: frame that.
    const zones = [this.map.zone];
    if (this.foes?.enc) {
      // A fight's foe stands in the top corner and rises above the table's far edge in the picture: frame the room for it.
      const z = this.map.zone;
      const pad = this.map.metres(foePadOf(state.bounds).r * 2);
      zones.push({ x0: z.x1 - pad, x1: z.x1, z0: z.z0 - FOE_HEADROOM_M, z1: z.z0 });
    }
    this.leanZones = zones;
    if (first || rebuilt || stageChanged) {
      this.leanIn({ instant: true, zones });
    }
  }

  /** What the board's furniture is, so a changed stage rebuilds it and a move does not. */
  boardSignature(state) {
    const z = state.zones;
    const geom = o => [o.at.x, o.at.y, o.size?.w, o.size?.h];
    return JSON.stringify([
      state.kit, state.bounds,
      Object.values(z.trays).map(t => [t.id, t.label, t.cap ?? null, ...geom(t)]),
      Object.values(z.slots).map(t => [t.id, t.label, ...geom(t)]),
      Object.values(z.containers).map(t => [t.id, t.label, ...geom(t), t.capacity ?? null, t.props?.pile ? 1 : 0]),
      z.rail ? [z.rail.first, z.rail.last, ...geom(z.rail)] : null,
      Object.values(state.fixtures).map(f => [f.id, f.kind, f.label, f.noRun ? 1 : 0, f.runLabel || '', ...geom(f), Object.keys(f.dials)]),
      Object.values(state.fetch).map(f => [f.id, f.label, f.at ? [f.at.x, f.at.y] : null]),
      geom(state.recorder.box)
    ]);
  }

  /* ---------------- the board ---------------- */

  buildBoard() {
    this.ground?.tex.dispose();
    this.sheet?.tex.dispose();
    this.freeGroup(this.fixtureRoot);
    this.fixtureRoot = new THREE.Group();
    this.fixtureRoot.name = 'tabletop-fixtures';
    this.table.add(this.fixtureRoot);
    if (this.hit) { this.freeGroup(this.hit); this.hit = null; }
    this.unGrab?.();

    const state = this.state;
    const s = this.map.s;
    const kit = getKit(state.kit);
    const { mats } = this;

    // THE FLAT PICTURE: zones, labels and jar levels, drawn by the canvas table's own function.
    const W = 1024;
    const H = Math.max(64, Math.round(W * state.bounds.h / state.bounds.w));
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.ground = { canvas, ctx: canvas.getContext('2d', { willReadFrequently: true }), tex, W, H };
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(state.bounds.w * s, state.bounds.h * s),
      this.mine(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0.1 }))
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(0, GROUND_Y, 0);
    plane.receiveShadow = true;
    plane.name = 'tabletop-ground';
    this.fixtureRoot.add(plane);

    // Low rims round trays and slots: they are things on the host's work surface.
    // A host may dress its trays in a material of its own (`mats.tray`: Ligar's are basalt, ore tubs on the ledge).
    for (const t of Object.values(state.zones.trays)) this.rim(rectOf(t, SIZES.tray), 0.012, 0.006, mats.tray || mats.dark);
    for (const t of Object.values(state.zones.slots)) this.rim(rectOf(t, SIZES.slot), 0.006, 0.004, mats.dark);

    // Jars: low walls and a fill that rises with what they hold.
    this.jars = new Map();
    for (const c of Object.values(state.zones.containers)) {
      const r = rectOf(c, SIZES.container);
      this.rim(r, 0.04, 0.007, mats.top);
      // A pile's contents are its atoms (below), not a level: no slab of fill over them.
      if (kit.pileOf?.(c) || kit.noJarFill?.(c)) continue;
      const fill = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.mine(new THREE.MeshStandardMaterial({ color: PHOSPHOR, roughness: 0.55, metalness: 0.1 })));
      const p = this.map.toPlate({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 });
      fill.position.set(p.x, GROUND_Y, p.z);
      fill.visible = false;
      fill.userData.rect = r;
      this.fixtureRoot.add(fill);
      this.jars.set(c.id, { fill, rect: r });
    }

    // Piles: a heap is hundreds of atoms and ONE draw call. A kit says which containers are piles and where each
    // atom lies (`kit.pileOf`); the instanced body is laid once on those slots and `syncPiles` shows the first
    // `n` of them, so a heap drawn down loses its outermost atoms and the rest stay where they were.
    // A kit may also stand piles that belong to no container (`kit.pilesOf(state)`: the electrons that fall into the
    // bins of a spectrum), each `{id, at, n, cap, slots, r, colour}` with its slots relative to `at`.
    this.piles = new Map();
    for (const { id, at, pile } of this.pileSources(kit, state)) {
      const mesh = new THREE.InstancedMesh(
        new THREE.IcosahedronGeometry(1, 0),
        this.mine(new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0.15 })),
        pile.cap
      );
      mesh.name = `pile-${id}`;
      mesh.castShadow = true;
      this.layPile(mesh, at, pile);
      this.fixtureRoot.add(mesh);
      this.piles.set(id, mesh);
    }

    // Fixtures: a kit may build its own (`kit.fixture3d`); otherwise a rim, a track and knob per dial, and a Run key.
    this.fixtures = new Map();
    for (const f of Object.values(state.fixtures)) {
      const lay = fixtureLayout(f);
      this.rim(lay.box, 0.02, 0.008, mats.dark);
      const own = kit.fixture3d?.(f, { THREE, scale: s, mats, toPlate: this.map.toPlate, plaque: (t, w, h, o) => this.plaque(t, w, h, o) });
      if (own?.group) {
        this.fixtureRoot.add(own.group);
        this.fixtures.set(f.id, { custom: own, knobs: {} });
        continue;
      }
      const knobs = {};
      const knobGeo = new THREE.CylinderGeometry(0.02, 0.022, 0.026, 16);
      for (const d of lay.dials) {
        const a = this.map.toPlate({ x: d.x0, y: d.y });
        const b = this.map.toPlate({ x: d.x1, y: d.y });
        const track = new THREE.Mesh(new THREE.BoxGeometry(b.x - a.x, 0.004, 0.008), mats.dark);
        track.position.set((a.x + b.x) / 2, GROUND_Y + 0.002, a.z);
        this.fixtureRoot.add(track);
        const knob = new THREE.Mesh(knobGeo, mats.top);
        knob.castShadow = true;
        knob.position.set(a.x, GROUND_Y + 0.013, a.z);
        this.fixtureRoot.add(knob);
        knobs[d.name] = { knob, a, b };
      }
      if (!lay.run) { this.fixtures.set(f.id, { knobs }); continue; }
      const rp = this.map.toPlate({ x: (lay.run.x0 + lay.run.x1) / 2, y: (lay.run.y0 + lay.run.y1) / 2 });
      const cap = new THREE.Mesh(new THREE.BoxGeometry((lay.run.x1 - lay.run.x0) * s, 0.016, (lay.run.y1 - lay.run.y0) * s), mats.top);
      cap.position.set(rp.x, GROUND_Y + 0.008, rp.z);
      cap.castShadow = true;
      this.fixtureRoot.add(cap);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry((lay.run.x1 - lay.run.x0) * s * 0.9, (lay.run.y1 - lay.run.y0) * s * 0.8),
        this.mine(new THREE.MeshStandardMaterial({ map: this.plaque(f.runLabel || 'Run', Math.max(128, Math.round((lay.run.x1 - lay.run.x0) * 14)), 64, {}), roughness: 0.85, metalness: 0.2 }))
      );
      label.rotation.x = -Math.PI / 2;
      label.position.set(rp.x, GROUND_Y + 0.0165, rp.z);
      this.fixtureRoot.add(label);
      this.fixtures.set(f.id, { knobs });
    }

    // The paper strip the recorder prints on.
    this.buildSheet();

    // The whole plate is one grab: a press takes hold only where there is something to take.
    const hitW = state.bounds.w * s + 0.2;
    const hitD = state.bounds.h * s + 0.2;
    this.hit = new THREE.Mesh(new THREE.PlaneGeometry(hitW, hitD), this.hitMat);
    this.hit.rotation.x = -Math.PI / 2;
    this.hit.position.set(0, PLATE_Y + 0.04, 0);
    this.hit.name = 'tabletop-hit';
    this.table.add(this.hit);
    this.unGrab = this.addGrabbable({
      object: this.hit,
      accepts: rc => {
        const u = this.unitsAtRay(rc.ray);
        return Boolean(u && this.gestures.wouldGrab(u));
      },
      onStart: e => { const u = this.unitsAt(e); if (u) this.gestures.pointerDown(u); },
      onMove: (dx, dy, e) => { const u = this.unitsAt(e); if (u) this.gestures.pointerMove(u); },
      onEnd: e => {
        if (!e || e.clientX == null) { this.gestures.cancel(); return; }
        const u = this.unitsAt(e);
        if (u) this.gestures.pointerUp(u); else this.gestures.cancel();
      }
    });

    // Standing back, the table is what the camera frames.
    this.clearFitNodes();
    this.addFitNode(this.table, this.table);
  }

  /**
   * Take a subtree off the table and free what the TABLE made. The host's own
   * materials (`this.mats`, the bench kit's) and the cached legends are shared and
   * outlive any one subtree; they are freed (or not) by their owners.
   */
  freeGroup(group) {
    if (!group) return;
    group.parent?.remove(group);
    group.traverse(o => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      for (const m of mats) {
        if (!m.userData?.tableOwned) continue;
        // A face the kit painted is this table's own canvas: free it with the piece.
        if (m.userData.ownMap) m.map?.dispose?.();
        m.dispose();
      }
    });
  }

  /** A material only this table uses (so `freeGroup` may dispose it). */
  mine(mat) {
    mat.userData.tableOwned = true;
    return mat;
  }

  /** A low rim round a rectangle (table units) as four boxes. */
  rim(r, h, t, mat) {
    const a = this.map.toPlate({ x: r.x0, y: r.y0 });
    const b = this.map.toPlate({ x: r.x1, y: r.y1 });
    const w = b.x - a.x;
    const d = b.z - a.z;
    const cx = (a.x + b.x) / 2;
    const cz = (a.z + b.z) / 2;
    for (const [bw, bd, x, z] of [[w, t, cx, a.z], [w, t, cx, b.z], [t, d, a.x, cz], [t, d, b.x, cz]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, h, bd), mat);
      m.position.set(x, GROUND_Y + h / 2, z);
      m.receiveShadow = true;
      this.fixtureRoot.add(m);
    }
  }

  /** An engraved legend as a texture, kept by its text. */
  plaque(text, w, h, o = {}) {
    const key = `${text}|${w}|${h}|${o.dim ? 1 : 0}|${o.bg || ''}`;
    let tex = this.plaques.get(key);
    if (!tex) {
      tex = engravedPlaque(text, {
        w, h, size: o.size || Math.round(h * 0.42), align: 'middle', pad: 6, tracking: 1,
        color: o.dim ? '#7a7264' : '#dcd6cc', bg: o.bg || '#16140f'
      });
      this.plaques.set(key, tex);
    }
    return tex;
  }

  /** Repaint the flat picture from the state (zones, labels, jar levels, the held-piece highlight). */
  repaintGround() {
    const g = this.ground;
    if (!g || !this.state) return;
    drawTable(g.ctx, g.W, g.H, this.state, {
      pieces: false, controls: false, sheet: false, crt: false, piles: false, pourFrom: this.gestures.pourFrom,
      // Where the world has the field point, the player walks to it; a plate would only be a shortcut past it.
      sites: id => this.showsSite(id)
    });
    g.tex.needsUpdate = true;
  }

  /* ---------------- jars, fixtures, the strip ---------------- */

  syncJars() {
    if (!this.jars) return;
    const s = this.map.s;
    for (const c of Object.values(this.state.zones.containers)) {
      const jar = this.jars.get(c.id);
      if (!jar) continue;
      const total = Object.values(c.contents).reduce((a, b) => a + b, 0);
      const cap = c.capacity || Math.max(total, 1);
      const level = Math.min(1, total / cap);
      const r = jar.rect;
      jar.fill.visible = total > 0;
      const h = Math.max(0.001, level * 0.034);
      jar.fill.scale.set((r.x1 - r.x0) * s - 0.016, h, (r.y1 - r.y0) * s - 0.016);
      jar.fill.position.y = GROUND_Y + h / 2;
    }
  }

  /** Every pile on the table: a container that is one (`kit.pileOf`) and any a kit stands on its own (`kit.pilesOf`). */
  pileSources(kit, state) {
    const out = [];
    for (const c of Object.values(state.zones.containers)) {
      const pile = kit.pileOf?.(c);
      if (pile) out.push({ id: c.id, at: c.at, pile });
    }
    for (const p of kit.pilesOf?.(state) || []) out.push({ id: p.id, at: p.at, pile: p });
    return out;
  }

  /**
   * Lay a pile's atoms on its slots. The mound: the middle stands higher than the edge, and every atom rests on the bed
   * or on the ones under it. A pile whose atoms are not a prefix of its slots (a column in each bin of a spectrum) says
   * which stand with `pile.shown`; the rest are given no size.
   */
  layPile(mesh, at, pile) {
    const s = this.map.s;
    const rM = pile.r * s;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const col = new THREE.Color(pile.colour);
    pile.slots.forEach((slot, i) => {
      const p = this.map.toPlate({ x: at.x + slot.x, y: at.y + slot.y });
      const lift = rM * 0.8 + slot.h * rM * 2.2;
      const on = !pile.shown || pile.shown[i];
      m.compose(new THREE.Vector3(p.x, GROUND_Y + lift, p.z), q, on ? new THREE.Vector3(rM, rM * 0.82, rM) : new THREE.Vector3(0, 0, 0));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = pile.shown ? pile.cap : pile.n;
    mesh.userData.shown = pile.shown ? pile.shown.join('') : null;
  }

  /** Every pile on the table: a container that is one (`kit.pileOf`) and any a kit stands on its own (`kit.pilesOf`). */
  pileSources(kit, state) {
    const out = [];
    for (const c of Object.values(state.zones.containers)) {
      const pile = kit.pileOf?.(c);
      if (pile) out.push({ id: c.id, at: c.at, pile });
    }
    for (const p of kit.pilesOf?.(state) || []) out.push({ id: p.id, at: p.at, pile: p });
    return out;
  }

  /** Show as many atoms of each pile as its container holds. */
  syncPiles() {
    if (!this.piles?.size) return;
    const kit = getKit(this.state.kit);
    for (const { id, at, pile } of this.pileSources(kit, this.state)) {
      const mesh = this.piles.get(id);
      if (!mesh) continue;
      if (pile.shown) {
        if (mesh.userData.shown !== pile.shown.join('')) this.layPile(mesh, at, pile);
      } else {
        mesh.count = Math.min(pile.n, mesh.instanceMatrix.count);
      }
    }
  }

  syncFixtures() {
    if (!this.fixtures) return;
    const kit = getKit(this.state.kit);
    for (const f of Object.values(this.state.fixtures)) {
      const rec = this.fixtures.get(f.id);
      if (!rec) continue;
      if (rec.custom) { rec.custom.update?.(f, this.state); continue; }
      for (const [name, d] of Object.entries(f.dials)) {
        const k = rec.knobs[name];
        if (!k) continue;
        const frac = d.max === d.min ? 0 : (d.value - d.min) / (d.max - d.min);
        k.knob.position.x = k.a.x + frac * (k.b.x - k.a.x);
      }
    }
    void kit;
  }

  buildSheet() {
    const state = this.state;
    const box = rectOf(state.recorder.box, { w: 30, h: 18 });
    const s = this.map.s;
    const cw = 512;
    const ch = Math.max(64, Math.round(cw * box.h / box.w));
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const plot = new TrendPlot(canvas, {});
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = this.mine(new THREE.MeshBasicMaterial({ map: tex }));
    const c = this.map.toPlate({ x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(box.w * s, box.h * s), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(c.x, GROUND_Y + 0.004, c.z);
    mesh.visible = false;
    mesh.name = 'tabletop-recorder';
    this.fixtureRoot.add(mesh);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.004, 0.012), this.mats.top);
    bar.visible = false;
    bar.name = 'tabletop-straightedge';
    this.fixtureRoot.add(bar);
    this.sheet = { canvas, plot, tex, mesh, bar, box, cw, ch, rows: [] };
  }

  /** The strip prints what the recorder holds, with the straightedge laid on it. */
  syncSheet() {
    const sh = this.sheet;
    if (!sh) return;
    const rec = this.state.recorder;
    sh.mesh.visible = rec.rows.length > 0;
    if (!rec.rows.length) { sh.bar.visible = false; sh.rows = []; return; }
    const xs = rec.rows.map(r => r.x);
    const ys = rec.rows.map(r => r.y);
    const range = (a, floor) => {
      let lo = Math.floor(Math.min(...a));
      let hi = Math.ceil(Math.max(...a));
      if (floor !== undefined) lo = Math.min(lo, floor);
      if (hi <= lo) hi = lo + 1;
      return [lo, hi];
    };
    const [xMin, xMax] = range(xs);
    const [yMin, yMax] = range(ys);
    const ax = rec.axes || {};
    sh.plot.setSpec({
      xMin, xMax, yMin, yMax,
      xLabel: ax.xLabel || '', yLabel: ax.yLabel || '', xUnit: ax.xUnit || '', yUnit: ax.yUnit || ''
    });
    sh.plot.points = rec.rows.map((r, i) => ({ x: r.x, y: r.y, active: i === rec.rows.length - 1 }));
    const line = lineOf(rec);
    sh.plot.overlay = line
      ? (ctx, pl) => {
          const a = pl.pxOf(xMin, readY(line, xMin));
          const b = pl.pxOf(xMax, readY(line, xMax));
          ctx.strokeStyle = '#e59b24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      : null;
    sh.plot.draw();
    sh.tex.needsUpdate = true;

    const box = sh.box;
    const toUnits = p => ({ x: box.x0 + (p.x / sh.cw) * box.w, y: box.y0 + (p.y / sh.ch) * box.h });
    sh.rows = rec.rows.map((r, i) => ({ i, u: toUnits(sh.plot.pxOf(r.x, r.y)) }));

    // The straightedge itself: a bar laid along the line, across the strip.
    if (line) {
      const a = this.map.toPlate(toUnits(sh.plot.pxOf(xMin, readY(line, xMin))));
      const b = this.map.toPlate(toUnits(sh.plot.pxOf(xMax, readY(line, xMax))));
      const len = Math.hypot(b.x - a.x, b.z - a.z) * 1.06;
      sh.bar.visible = true;
      sh.bar.scale.set(len, 1, 1);
      sh.bar.position.set((a.x + b.x) / 2, GROUND_Y + 0.012, (a.z + b.z) / 2);
      sh.bar.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    } else {
      sh.bar.visible = false;
    }
  }

  sheetRows() { return this.sheet?.rows || []; }

  /* ---------------- pieces ---------------- */

  /** What makes a piece look the way it does; a change rebuilds only that piece. */
  pieceSignature(kit, p) {
    const f = faceOf(kit, p, this.state);
    const at = this.drag?.id === p.id ? this.drag.at : (this.shown[p.id] || p.at);
    return `${p.kind}|${radiusOf(kit, p)}|${f.text}|${f.badge}|${f.flipped ? 1 : 0}|${p.token ? 1 : 0}|${kit.faceKey ? kit.faceKey(p, this.state, at) : ''}`;
  }

  /**
   * A kit-painted face: the SAME `kit.paintPiece` the drawn table calls, onto a canvas that
   * becomes the puck's top. What is drawn on a piece is what the drawn table draws on it.
   */
  paintedFace(kit, p, r, thick) {
    const N = 384;
    const canvas = document.createElement('canvas');
    canvas.width = N;
    canvas.height = N;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#16140f';
    ctx.fillRect(0, 0, N, N);
    const at = this.drag?.id === p.id ? this.drag.at : (this.shown[p.id] || p.at);
    kit.paintPiece(ctx, p, this.state, { x: N / 2, y: N / 2, r: N * 0.47, lit: false, sc: (N * 0.47) / radiusOf(kit, p), flat: true, at });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = this.mine(new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.85,
      metalness: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    }));
    mat.userData.ownMap = true;
    const face = new THREE.Mesh(new THREE.CircleGeometry(r * 0.96, 36), mat);
    face.rotation.x = -Math.PI / 2;
    face.position.y = thick + 0.0008;
    return face;
  }

  /**
   * A card the kit paints (`kinds.x.rect = {hw, hh}`, in table units): a thin slab with its face drawn by the
   * SAME `kit.paintPiece` the drawn table calls, onto a canvas of the card's own proportions. The kit paints
   * a rectangle about the point it is given, `sc` pixels to the unit, as it does on the drawn table.
   */
  buildRectPiece(kit, p, rect) {
    const s = this.map.s;
    const hw = rect.hw * s;
    const hh = rect.hh * s;
    const T = CARD_T * 1.5;
    const g = new THREE.Group();
    g.name = `piece-${p.id}`;
    const body = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, T, hh * 2), this.mats.top);
    body.position.y = T / 2;
    body.castShadow = body.receiveShadow = true;
    g.add(body);

    const K = 36;   // canvas pixels to the table unit
    const W = Math.round(rect.hw * 2 * K);
    const H = Math.round(rect.hh * 2 * K);
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#16140f';
    ctx.fillRect(0, 0, W, H);
    kit.paintPiece(ctx, p, this.state, { x: W / 2, y: H / 2, r: radiusOf(kit, p) * K, lit: false, sc: K, flat: true });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = this.mine(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.15 }));
    mat.userData.ownMap = true;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.985, hh * 2 * 0.985), mat);
    face.rotation.x = -Math.PI / 2;
    face.position.y = T + 0.0008;
    g.add(face);

    // The mark a held card wears: a ring clear of its corners. A mark, never a light.
    const reach = Math.hypot(hw, hh);
    const ring = new THREE.Mesh(new THREE.RingGeometry(reach * 1.06, reach * 1.2, 28), this.mine(new THREE.MeshBasicMaterial({ color: AMBER })));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.0006;
    ring.visible = false;
    g.add(ring);
    g.userData.ring = ring;
    return g;
  }

  buildPiece(kit, p) {
    const s = this.map.s;
    const rU = radiusOf(kit, p);
    const r = rU * s;
    const f = faceOf(kit, p, this.state);
    const square = p.kind === 'card' || Boolean(p.token);
    const g = new THREE.Group();
    g.name = `piece-${p.id}`;
    if (kit.paintPiece && kit.kinds?.[p.kind]?.rect) return this.buildRectPiece(kit, p, kit.kinds[p.kind].rect);
    if (!square && kit.paintPiece) {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, PUCK_T, 28), this.mats.top);
      body.position.y = PUCK_T / 2;
      body.castShadow = body.receiveShadow = true;
      g.add(body);
      g.add(this.paintedFace(kit, p, r, PUCK_T));
      const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.16, r * 1.3, 28), this.mine(new THREE.MeshBasicMaterial({ color: AMBER })));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.0006;
      ring.visible = false;
      g.add(ring);
      g.userData.ring = ring;
      return g;
    }
    const text = f.badge ? `${f.text} ${f.badge}` : f.text;
    let labelW;
    let labelH;
    let thick;
    if (square) {
      const half = cardHalf(text, rU) * s;
      thick = CARD_T;
      const body = new THREE.Mesh(new THREE.BoxGeometry(half * 2, thick, r * 2), p.token ? this.mats.dark : this.mats.top);
      body.position.y = thick / 2;
      body.castShadow = body.receiveShadow = true;
      g.add(body);
      labelW = half * 2 * 0.94;
      labelH = r * 2 * 0.84;
    } else {
      thick = PUCK_T;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, thick, 20), this.mats.top);
      body.position.y = thick / 2;
      body.castShadow = body.receiveShadow = true;
      g.add(body);
      labelW = r * 1.7;
      labelH = r * 1.0;
    }
    // The legend on the face: a flipped card is struck dim, a scaled one carries its multiplier.
    const px = Math.max(96, Math.round(labelW / s * 14));
    const py = Math.max(48, Math.round(labelH / s * 14));
    const mat = this.mine(new THREE.MeshStandardMaterial({
      map: this.plaque(text, px, py, { dim: f.flipped, bg: f.flipped ? '#0d0c0a' : (p.token ? '#1d1b17' : '#2a2620') }),
      roughness: 0.85, metalness: 0.2
    }));
    const label = new THREE.Mesh(new THREE.PlaneGeometry(labelW, labelH), mat);
    label.rotation.x = -Math.PI / 2;
    label.position.y = thick + 0.0008;
    g.add(label);
    // The ring a held piece wears: amber is a signal, so it is a mark and not a light.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r * 1.16, r * 1.3, 24),
      this.mine(new THREE.MeshBasicMaterial({ color: AMBER }))
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.0006;
    ring.visible = false;
    g.add(ring);
    g.userData.ring = ring;
    return g;
  }

  syncPieces() {
    const kit = getKit(this.state.kit);
    const seen = new Set();
    const swarm = new Map();
    for (const p of Object.values(this.state.pieces)) {
      if (p.hidden) continue;
      // Many small unlabelled pieces of one kind are ONE draw call (an instanced body each).
      if (kit.kinds?.[p.kind]?.instanced) {
        if (!swarm.has(p.kind)) swarm.set(p.kind, []);
        swarm.get(p.kind).push(p.id);
        continue;
      }
      seen.add(p.id);
      const sig = this.pieceSignature(kit, p);
      let e = this.entries.get(p.id);
      if (e && e.sig !== sig) {
        this.pieceRoot.remove(e.group);
        this.freeGroup(e.group);
        e = null;
      }
      if (!e) {
        const group = this.buildPiece(kit, p);
        const at = this.shown[p.id] || p.at;
        const pl = this.map.toPlate(at);
        group.position.set(pl.x, GROUND_Y, pl.z);
        this.pieceRoot.add(group);
        e = { id: p.id, group, sig };
        this.entries.set(p.id, e);
        this.lifts[p.id] = this.lifts[p.id] || 0;
      }
      e.group.userData.ring.visible = this.state.carry.held === p.id;
    }
    for (const [id, e] of [...this.entries]) {
      if (seen.has(id)) continue;
      this.pieceRoot.remove(e.group);
      this.freeGroup(e.group);
      this.entries.delete(id);
      delete this.lifts[id];
    }
    this.syncSwarms(kit, swarm);
  }

  /** One InstancedMesh per instanced kind, sized to the pieces of that kind on the table. */
  syncSwarms(kit, groups) {
    this.swarms = this.swarms || new Map();
    for (const [kind, sw] of [...this.swarms]) {
      if (groups.has(kind) && sw.cap >= groups.get(kind).length) continue;
      this.pieceRoot.remove(sw.mesh);
      this.freeGroup(sw.mesh);
      this.swarms.delete(kind);
    }
    for (const [kind, ids] of groups) {
      let sw = this.swarms.get(kind);
      if (!sw) {
        const r = (kit.kinds[kind].r ?? 3) * this.map.s;
        const geo = new THREE.CylinderGeometry(r, r * 1.05, PUCK_T * 0.8, 14);
        const mesh = new THREE.InstancedMesh(geo, this.mats.top, Math.max(8, ids.length));
        mesh.castShadow = true;
        mesh.name = `swarm-${kind}`;
        this.pieceRoot.add(mesh);
        sw = { mesh, cap: mesh.instanceMatrix.count, ids };
        this.swarms.set(kind, sw);
      }
      sw.ids = ids;
      sw.mesh.count = ids.length;
    }
  }

  /** Rods between joined pieces, rebuilt from the links and re-laid each frame. */
  syncJoins() {
    const kit = getKit(this.state.kit);
    this.freeGroup(this.joinRoot);
    this.joinRoot = new THREE.Group();
    this.joinRoot.name = 'tabletop-joins';
    this.table.add(this.joinRoot);
    this.joinRods = [];
    const geo = new THREE.CylinderGeometry(0.009, 0.009, 1, 8);
    for (const key of Object.keys(this.state.links)) {
      const [a, b] = key.split('|');
      const pa = this.state.pieces[a];
      const pb = this.state.pieces[b];
      if (!pa || !pb || pa.hidden || pb.hidden) continue;
      // A kit may draw a join as several rods (a double bond is two) or as none (a lens resting on a sample).
      const n = kit.linkRods ? kit.linkRods(this.state.links[key], this.state) : 1;
      for (let i = 0; i < n; i++) {
        const rod = new THREE.Mesh(geo, this.mats.dark);
        rod.castShadow = true;
        this.joinRoot.add(rod);
        this.joinRods.push({ rod, a, b, off: (i - (n - 1) / 2) * 0.026 });
      }
    }
    this.layJoins();
  }

  layJoins() {
    for (const { rod, a, b, off } of this.joinRods || []) {
      const ea = this.entries.get(a)?.group;
      const eb = this.entries.get(b)?.group;
      if (!ea || !eb) { rod.visible = false; continue; }
      rod.visible = true;
      const A = ea.position;
      const B = eb.position;
      const len = Math.hypot(B.x - A.x, B.z - A.z);
      rod.scale.set(1, Math.max(0.001, len), 1);
      // Parallel rods sit either side of the line between the two centres.
      const nx = len > 1e-6 ? -(B.z - A.z) / len : 0;
      const nz = len > 1e-6 ? (B.x - A.x) / len : 0;
      rod.position.set((A.x + B.x) / 2 + nx * (off || 0), Math.max(A.y, B.y) + 0.012, (A.z + B.z) / 2 + nz * (off || 0));
      rod.rotation.set(0, 0, 0);
      rod.rotation.z = Math.PI / 2;
      rod.rotation.y = -Math.atan2(B.z - A.z, B.x - A.x);
    }
  }

  /** Where every piece is heading, in table units. */
  targets() {
    return pieceTargets(this.state, this.drag, this.railGap);
  }

  /** Put the pieces where they are going (no easing): first build, reduced motion, a test. */
  settleToTargets(now = true) {
    if (!this.state || !this.map) return;
    const held = this.state.carry.held;
    for (const [id, to] of Object.entries(this.targets())) {
      if (now) this.shown[id] = { ...to };
      const lift = (this.drag?.id === id || held === id) ? LIFT : 0;
      if (now) this.lifts[id] = lift;
    }
    this.placePieces();
  }

  settle() { this.settleToTargets(true); }

  /** Put each piece's mesh where its eased position says. */
  placePieces() {
    for (const [id, e] of this.entries) {
      const p = this.state.pieces[id];
      const at = this.drag?.id === id ? this.drag.at : (this.shown[id] || p.at);
      const pl = this.map.toPlate(at);
      const isLensOverDish = p?.kind === 'lens' && Boolean(dishUnder(id, this.state, at));
      const baseElev = isLensOverDish ? (PUCK_T + 0.004) : 0;
      e.group.position.set(pl.x, GROUND_Y + baseElev + (this.lifts[id] || 0), pl.z);
    }
    const m = this._swarmM || (this._swarmM = new THREE.Matrix4());
    for (const sw of this.swarms?.values() || []) {
      sw.ids.forEach((id, i) => {
        const at = this.drag?.id === id ? this.drag.at : (this.shown[id] || this.state.pieces[id].at);
        const pl = this.map.toPlate(at);
        m.makeTranslation(pl.x, GROUND_Y + PUCK_T * 0.4 + (this.lifts[id] || 0), pl.z);
        sw.mesh.setMatrixAt(i, m);
      });
      sw.mesh.instanceMatrix.needsUpdate = true;
    }
    this.layJoins();
  }

  /** Pieces ease toward their places with a short settle; the dragged one follows the pointer. */
  tickPieces(delta) {
    if (!this.state || !this.map) return;
    const k = this.reduced ? 1 : 1 - Math.exp(-delta * 16);
    const held = this.state.carry.held;
    for (const [id, to] of Object.entries(this.targets())) {
      const cur = this.shown[id] || (this.shown[id] = { ...to });
      const dx = to.x - cur.x;
      const dy = to.y - cur.y;
      if (Math.abs(dx) < 0.04 && Math.abs(dy) < 0.04) { cur.x = to.x; cur.y = to.y; } else { cur.x += dx * k; cur.y += dy * k; }
      const want = (this.drag?.id === id || held === id) ? LIFT : 0;
      const l = this.lifts[id] || 0;
      this.lifts[id] = Math.abs(want - l) < 0.0005 ? want : l + (want - l) * k;
    }
    if (this.drag) {
      const dp = this.state.pieces[this.drag.id];
      if (dp) {
        const kit = getKit(this.state.kit);
        const sig = this.pieceSignature(kit, dp);
        const e = this.entries.get(this.drag.id);
        if (e && e.sig !== sig) {
          this.syncPieces();
        }
      }
    }
    this.placePieces();
  }

  update(delta) {
    super.update(delta);
    this.tickPieces(delta);
  }

  /* ---------------- clicks, the field, [E] ---------------- */

  /** A click on empty table: the two-tap twin's second tap, when a piece is in the hand. */
  handleClick(e) {
    if (!this.state) return;
    const u = this.unitsAt(e);
    if (!u) return;
    if (this.gestures.pourFrom) { this.gestures.pourFrom = null; this.repaintGround(); }
    this.gestures.tapTarget(u);
  }

  /**
   * Where a stage that is a fight stands its foes: in the table's own corner pad (`table/layout.js` `FOE_PAD`),
   * on the plate, which is inside the frame the camera leans to and covers no piece. In the viewer's frame; null
   * until the table has a board.
   */
  foeSpots(n = 1) {
    if (!this.map || !this.state) return null;
    const pad = foePadOf(this.state.bounds);
    return Array.from({ length: n }, (_, i) => {
      const p = this.map.toPlate({ x: pad.x, y: pad.y + i * pad.r * 2 });
      return { x: p.x, y: GROUND_Y, z: p.z };
    });
  }

  /** Take a field item: it rides in the carry slot until the player is back at the bench. */
  takeField(point) {
    if (!this.state || !this.state.fetch[point.id] || !pendingFetch(this.state, point.id)) return false;
    this.carry = { id: point.id, label: this.state.fetch[point.id].label || point.label };
    this.onCarry?.(this.carry.label);
    this.syncGuide();
    return true;
  }

  /**
   * The chevron leads to the field point this table still sends the player to (the world has it, it
   * is not yet fetched or carried), and stops when there is none.
   */
  syncGuide() {
    if (!this.worldObject || !this.state) return;
    let want = null;
    for (const id of Object.keys(this.state.fetch)) {
      if (!pendingFetch(this.state, id) || this.carry?.id === id) continue;
      const pt = fieldPointById(this.worldObject, id);
      if (pt) { want = pt; break; }
    }
    const key = want ? want.id : null;
    if (key === this.guided) return;
    this.guided = key;
    // `siteId` and `to` let a world with workings route the way (doorway by doorway) to the place to stand, not to the bench.
    guideTo(want ? { x: want.stand?.[0] ?? want.pos[0], z: want.stand?.[2] ?? want.pos[2], label: want.label, siteId: want.siteId, to: true } : null);
  }

  /** Back at the bench: what was carried goes on the table (the reducer's `fetch`). */
  flushCarry() {
    if (!this.carry) return;
    const { id } = this.carry;
    this.carry = null;
    this.onCarry?.(null);
    this.dispatch({ fetch: id });
  }

  leanIn(opts = {}) {
    const pose = super.leanIn(opts);
    this.flushCarry();
    return pose;
  }

  /**
   * What `[E]` does, from where the camera is pointed: take a field item at a
   * point the world registered (never the nearest, `aim-target.js`), or lean in
   * over the table again after stepping away.
   */
  aimedInteraction(origin, dir, world) {
    if (!this.state) return null;
    world = world || this.worldObject;
    const ids = Object.keys(this.state.fetch).filter(id => pendingFetch(this.state, id) && this.carry?.id !== id);
    if (world && ids.length) {
      const hit = pickAimTarget(origin, dir, fieldAimTargets(world, { ids }));
      if (hit?.kind === 'field') {
        return {
          prompt: `[E] TAKE ${String(this.state.fetch[hit.point.id]?.label || hit.point.label).toUpperCase()}`,
          act: () => this.takeField(hit.point)
        };
      }
    }
    if (!this.leaning && this.world) {
      const w = this.world;
      const box = aimBox(
        [w.position[0], (w.position[1] + w.topY + 1.0) / 2, w.position[2]],
        [2.4, (w.topY + 1.0 - w.position[1]) / 2, 0.65],
        w.rotationY || 0
      );
      const hit = pickAimTarget(origin, dir, [{ kind: 'table', reach: 3.2, boxes: [box] }]);
      if (hit) return { prompt: '[E] LEAN IN', act: () => this.leanIn() };
    }
    return null;
  }

  /* ---------------- what a bench reports to the frame ---------------- */

  getAvailableInstruments() {
    return [{
      kind: 'stations',
      name: 'The table',
      shortDesc: 'Drag the pieces',
      desc: 'Drag a piece to move it. Tap a piece, then tap where it goes, to do the same without dragging.',
      tag: 'DRAG OR TAP'
    }];
  }

  getKeyList() { return []; }
  showInstrumentHalos() {}
  /** Tool keys live in the foot dock and readings on the paper strip: nothing mirrors onto this plate. */
  setKeys() {}
  setReadings() {}

  dispose() {
    if (this.disposed) return;
    if (this.guided) guideTo(null);
    this.guided = null;
    this.unGrab?.();
    this.keys?.dispose();
    this.ground?.tex.dispose();
    this.sheet?.tex.dispose();
    for (const t of this.plaques.values()) t.dispose();
    this.plaques.clear();
    this.freeGroup(this.table);
    this.entries.clear();
    this.unmountScene?.(this);
    super.dispose();
  }
}
