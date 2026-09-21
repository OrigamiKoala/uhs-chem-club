/**
 * assay3d.js — The assay floor, built as a works instead of drawn as a picture.
 *
 * This is `assay.js` in three dimensions, for Tallow at T4. It exposes the same
 * API, takes the same hopper declarations, and plans every pour through
 * `planPour` and every heap through `packBin` — both imported from the canvas
 * engine rather than reimplemented, so what lands where and how it stacks can
 * never differ between the two.
 *
 * WHY THIS ONE IS NOT A FLAT PICTURE.
 *
 * The scope and the core bench draw their output on a screen because what they
 * produce IS an image: they resolve something too small to see, and an image
 * staged as solid bodies cannot be counted — pieces at the back hide behind
 * pieces at the front. This floor produces no image. It tips a heap of salvage
 * down a chute, a deflector turns the light pieces further than the heavy ones,
 * and the pieces land in bins. Those are objects falling into containers at
 * arm's length. Drawing a picture of them on a screen bolted over the real
 * hopper standing on the real bench would be a photograph of the thing the
 * player is looking at.
 *
 * SO THE COUNT IS PROTECTED A DIFFERENT WAY, AND IT IS PROTECTED. Each bin is
 * open-fronted behind a sight glass and every piece that lands stacks into ONE
 * PLANE just inside it, on the grid `packBin` computes — so nothing is ever
 * behind anything, every piece is at a countable size, and the heap in the bin
 * and the tally stencilled over it are the same measurement, which a player is
 * entitled to check one against the other. That is the rule the flat-picture
 * rule exists to serve, met by the geometry rather than by a screen.
 *
 * It knows no chemistry. What the weights mean, what the catalogue says a kind
 * ought to weigh and whether an answer is right are the quest's business.
 */

import * as THREE from 'three';
import { planPour, packBin } from './assay.js';
import { BenchViewer3D, engravedPlaque, AMBER, PHOSPHOR } from './bench3d.js';
import { benchHost } from './bench-host.js';

/* ---------------------------------------------------------------- metrics */

/** Station pitch along the bench, matching every other built instrument. */
const RIG_PITCH = 0.92;

/** The bench's working surface in the instrument's local frame. */
const PLATE_Y = 0.895;

/** One catch bin. The row of them never runs wider than this. */
const BIN_ROW_W = 0.78;
const BIN_GAP = 0.036;
const BIN_H = 0.215;
const BIN_D = 0.10;

/* THE RIG STANDS FORWARD OF THE BENCH'S OWN FITTINGS.
   A salvage bench is a prop with clutter on it: a tool rail with the cutter and
   the shaker hanging off it along the back at z = -0.30, and a weld bead down
   the middle of the plate at z = 0. This rig used to stand its hopper legs in
   the first and its bin floors in the second — `verify:bench` measures every
   pair and found both. Everything below is far enough forward to clear them,
   and the check is what holds it there. */

/** Where the chute lets go of a piece, above the bins. */
const MOUTH_Y = 0.425;
const MOUTH_Z = 0.165;

/** The deflector, half way down the run. */
const DEFLECT_Y = 0.545;
const DEFLECT_Z = 0.045;

/** The hopper throat, where the stream starts. */
const THROAT_Y = 0.635;
const THROAT_Z = -0.055;

/** How long a pour takes, however big the heap is. Nobody waits on a count. */
const POUR_SECONDS = 1.35;
const FLIGHT_SECONDS = 0.52;

/* ------------------------------------------------------------------ faces */

/** A stencilled figure on a plate — a weight under a bin, a tally over it. */
function stencil(text, opts = {}) {
  const { lit = false, colour = null, w = 192, h = 96, size = 52 } = opts;
  const tex = engravedPlaque(String(text ?? ''), {
    w, h, size, align: 'middle', lit,
    color: colour || (lit ? '#d99423' : '#cfc5ae')
  });
  return tex;
}

/* --------------------------------------------------------------- the rig */

export class AssayFloor3D {
  /**
   * @param {HTMLElement} host the frame's instrument host. Kept empty: the
   *   instrument is in the scene, not in the DOM.
   * @param {{onProbe?: Function, onSelect?: Function,
   *          world?: object, mountScene?: Function, unmountScene?: Function}} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.onProbe = opts.onProbe || null;
    this.onSelect = opts.onSelect || null;

    this.hoppers = [];
    this.rigs = [];
    this.selectable = false;
    this.selected = null;
    this.probe = null;
    this.disposed = false;
    this.raf = null;

    this.viewer = new BenchViewer3D(document.body, {
      backdrop: opts.backdrop || 'awning',
      world: opts.world || null
    });
    this.viewer.handleClick = e => this.onPointer(e);

    if (this.host) this.host.innerHTML = '';

    const renderHost = benchHost();
    this.mountScene = opts.mountScene || (v => renderHost.mount(v));
    this.unmountScene = opts.unmountScene || (v => renderHost.unmount(v));
    this.mountScene(this.viewer);

    /* THE SHARED MATERIALS ARE THE VIEWER'S, NOT THE STAGE'S.
       They used to be made in `build()` and dropped in `teardown()`, which is
       wrong twice over: `releaseGroup` frees anything the viewer does not own,
       so tearing down the FIRST rig disposed the plate steel, the sight glass
       and the salvage that the other two rigs on the bench were still built
       from. Made once and `own`ed, they live as long as the instrument does
       and every rig on every stage shares the one set. */
    this.steel = this.viewer.own(new THREE.MeshStandardMaterial({
      color: 0x6f6657, roughness: 0.86, metalness: 0.44
    }));
    this.dark = this.viewer.own(new THREE.MeshStandardMaterial({
      color: 0x3d3730, roughness: 0.92, metalness: 0.5
    }));
    this.glass = this.viewer.own(new THREE.MeshPhysicalMaterial({
      color: 0xb9c0bd, roughness: 0.16, metalness: 0,
      transparent: true, opacity: 0.17, transmission: 0.0, side: THREE.DoubleSide
    }));
    // The salvage itself. One material for every piece, because the pieces
    // really are all the same stuff — telling bins apart by colour would be a
    // claim this floor has no business making.
    this.pieceMat = this.viewer.own(new THREE.MeshStandardMaterial({
      color: 0xb8afa0, roughness: 0.82, metalness: 0.18
    }));

    this.onResize = () => this.viewer.onResize();
    window.addEventListener('resize', this.onResize);
  }

  /* -------- contents (the drawn floor's API, method for method) -------- */

  setHoppers(hoppers) {
    // A pour still running has a caller waiting on it. Let it go before the
    // rig it was running on is replaced, or that caller waits forever.
    for (const r of this.rigs) {
      if (r.pourDone) { const d = r.pourDone; r.pourDone = null; d(); }
    }
    this.hoppers = (hoppers || []).map(hp => ({
      ...hp,
      bins: (hp.bins || []).map(b => ({ ...b })),
      landed: (hp.bins || []).map(() => 0),
      tally: false,
      flight: []
    }));
    this.probe = null;
    this.selected = null;
    this.build();
  }

  poured(id) {
    const hp = this.hoppers.find(h => h.id === id);
    return Boolean(hp && hp.landed.some(n => n > 0));
  }

  totalsOf(id) {
    const hp = this.hoppers.find(h => h.id === id);
    return hp ? hp.landed.slice() : [];
  }

  setSelectable(on) {
    this.selectable = Boolean(on);
  }

  setSelected(id) {
    this.selected = id;
    for (const r of this.rigs) {
      const on = r.hopper.id === id;
      r.indicator.material.emissiveIntensity = on ? 1.6 : 0;
    }
  }

  setPlateTag(id, text) {
    const r = this.rigs.find(x => x.hopper.id === id);
    if (!r) return;
    r.tagMesh.material.map?.dispose();
    r.tagMesh.material.map = stencil(text || '', { lit: Boolean(text), w: 384, h: 80, size: 34 });
    r.tagMesh.material.needsUpdate = true;
  }

  /* ---------------- building ---------------- */

  build() {
    this.teardown();

    const n = Math.max(1, this.hoppers.length);
    const span = (n - 1) * RIG_PITCH;

    this.hoppers.forEach((hopper, i) => {
      const rig = this.buildRig(hopper);
      rig.group.position.set(-span / 2 + i * RIG_PITCH, PLATE_Y, 0);
      this.viewer.root.add(rig.group);
      this.viewer.addFitNode(rig.group, rig.topMark);
      this.rigs.push(rig);
      this.refreshBin(rig, null);
    });

    this.frame(n);
  }

  /** One sample's works: hopper, chute, deflector, and a bin per weight. */
  buildRig(hopper) {
    const g = new THREE.Group();
    const bins = hopper.bins || [];
    const count = Math.max(1, bins.length);
    const binW = Math.min(0.30, (BIN_ROW_W - BIN_GAP * (count - 1)) / count);
    const rowW = count * binW + BIN_GAP * (count - 1);
    const originX = -rowW / 2 + binW / 2;

    /* ---- the hopper, on four legs, with the sample heaped in it ---- */
    const legGeo = new THREE.BoxGeometry(0.022, THROAT_Y, 0.022);
    for (const [lx, lz] of [
      [-0.16, -0.175], [0.16, -0.175], [-0.16, 0.070], [0.16, 0.070]
    ]) {
      const leg = new THREE.Mesh(legGeo, this.dark);
      leg.position.set(lx, THROAT_Y / 2, lz);
      leg.castShadow = true;
      g.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.05), this.dark);
      foot.position.set(lx, 0.004, lz);
      g.add(foot);
    }

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.155, 0.075, 0.185, 8), this.steel
    );
    body.rotation.y = Math.PI / 8;
    body.position.set(0, THROAT_Y + 0.095, THROAT_Z);
    body.castShadow = body.receiveShadow = true;
    g.add(body);

    // A rolled rim round its mouth, and a dark bore down the middle.
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.152, 0.011, 6, 20), this.dark
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(0, THROAT_Y + 0.188, THROAT_Z);
    g.add(rim);

    // The heap still in the hopper: the part of the sample not yet tipped.
    const heap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.128, 0.074, 0.085, 10),
      this.pieceMat
    );
    heap.position.set(0, THROAT_Y + 0.085, THROAT_Z);
    g.add(heap);

    /* ---- the gate, and the chute off it ---- */
    const gate = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.052, 0.012), this.dark
    );
    gate.position.set(0, THROAT_Y - 0.010, THROAT_Z + 0.062);
    g.add(gate);

    const runY = THROAT_Y - MOUTH_Y;
    const runZ = MOUTH_Z - THROAT_Z;
    const runLen = Math.hypot(runY, runZ);
    const chute = new THREE.Mesh(
      new THREE.BoxGeometry(0.135, 0.009, runLen), this.steel
    );
    chute.position.set(0, (THROAT_Y + MOUTH_Y) / 2, (THROAT_Z + MOUTH_Z) / 2);
    chute.rotation.x = Math.atan2(runY, runZ);
    chute.castShadow = true;
    g.add(chute);
    for (const rx of [-0.0675, 0.0675]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.026, runLen), this.dark
      );
      rail.position.set(rx, (THROAT_Y + MOUTH_Y) / 2 + 0.014, (THROAT_Z + MOUTH_Z) / 2);
      rail.rotation.x = chute.rotation.x;
      g.add(rail);
    }

    // THE DEFLECTOR: the one part that does the sorting, so it is the one part
    // that is unmistakably a plate standing in the way of the stream.
    const deflector = new THREE.Mesh(
      new THREE.BoxGeometry(0.145, 0.006, 0.055), this.dark
    );
    deflector.position.set(0, DEFLECT_Y, DEFLECT_Z);
    deflector.rotation.x = 0.55;
    g.add(deflector);
    for (const dx of [-0.076, 0.076]) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.05, 0.008), this.dark);
      bracket.position.set(dx, DEFLECT_Y + 0.02, DEFLECT_Z);
      g.add(bracket);
    }

    /* ---- the bins ---- */
    const binRecs = [];
    bins.forEach((bin, i) => {
      const x = originX + i * (binW + BIN_GAP);
      const b = new THREE.Group();
      b.position.set(x, 0, 0.180);
      g.add(b);

      const wall = (w, h, d, px, py, pz, mat) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(px, py, pz);
        m.receiveShadow = true;
        b.add(m);
        return m;
      };
      wall(binW, 0.010, BIN_D, 0, 0.005, 0, this.dark);                    // floor
      wall(binW, BIN_H, 0.008, 0, BIN_H / 2, -BIN_D / 2, this.steel);      // back
      wall(0.008, BIN_H, BIN_D, -binW / 2, BIN_H / 2, 0, this.steel);      // left
      wall(0.008, BIN_H, BIN_D, binW / 2, BIN_H / 2, 0, this.steel);       // right

      // THE SIGHT GLASS. Every piece that lands stacks in one plane just
      // inside it, so a bin is read the way a measuring glass is read.
      const sight = new THREE.Mesh(
        new THREE.PlaneGeometry(binW - 0.014, BIN_H - 0.016), this.glass
      );
      sight.position.set(0, BIN_H / 2, BIN_D / 2 - 0.001);
      b.add(sight);

      // The weight stencilled on the bin front. This is the bin's identity:
      // the pieces are all the same material, so the number is what tells
      // one bin from another — never a colour.
      const markMat = new THREE.MeshStandardMaterial({
        map: stencil(bin.mass, { w: 192, h: 96, size: 56 }),
        roughness: 0.92, metalness: 0.18, transparent: true
      });
      const mark = new THREE.Mesh(
        new THREE.PlaneGeometry(binW * 0.74, 0.048), markMat
      );
      mark.position.set(0, -0.001, BIN_D / 2 + 0.028);
      mark.rotation.x = -Math.PI / 2;
      b.add(mark);

      // The tally plate on a stalk over the bin. Blank until a pour lands.
      const tallyMat = new THREE.MeshStandardMaterial({
        map: stencil('', { w: 192, h: 96, size: 56 }),
        roughness: 0.9, metalness: 0.2, transparent: true
      });
      const tally = new THREE.Mesh(
        new THREE.PlaneGeometry(binW * 0.78, 0.052), tallyMat
      );
      tally.position.set(0, BIN_H + 0.052, BIN_D / 2 - 0.012);
      b.add(tally);
      const stalk = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.048, 0.006), this.dark
      );
      stalk.position.set(0, BIN_H + 0.024, BIN_D / 2 - 0.016);
      b.add(stalk);

      // The pieces. One instanced body per bin, drawn flat against the glass,
      // and SIZED TO WHAT THE BIN IS DECLARED TO HOLD. A fixed cap would mean
      // a bin that quietly drew fewer pieces than landed in it, which is the
      // instrument lying about the measurement the whole stage rests on.
      const pieceGeo = new THREE.CylinderGeometry(1, 1, 0.55, 12);
      const pieces = new THREE.InstancedMesh(
        pieceGeo, this.pieceMat, Math.max(1, bin.n || 1)
      );
      pieces.count = 0;
      pieces.frustumCulled = false;
      b.add(pieces);

      // A generous invisible target, so a bin can be tapped at any angle.
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(binW + BIN_GAP, BIN_H + 0.09, BIN_D + 0.06),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.position.set(0, BIN_H / 2, 0);
      hit.userData.binIndex = i;
      b.add(hit);

      binRecs.push({
        index: i, group: b, x, w: binW, pieces, pieceGeo,
        tallyMat, markMat, ring: null
      });
    });

    /* ---- the pieces in flight, one instanced body for the whole rig ---- */
    const flightGeo = new THREE.CylinderGeometry(1, 1, 0.55, 8);
    const declared = bins.reduce((n, b) => n + (b.n || 0), 0);
    const flight = new THREE.InstancedMesh(
      flightGeo, this.pieceMat, Math.max(8, Math.min(declared, 120))
    );
    flight.count = 0;
    flight.frustumCulled = false;
    g.add(flight);

    /* ---- the plate that says which sample this is ---- */
    const labelMat = new THREE.MeshStandardMaterial({
      map: engravedPlaque(hopper.label || '', { w: 512, h: 96, size: 42, align: 'center' }),
      roughness: 0.9, metalness: 0.2
    });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.083), labelMat);
    label.rotation.x = -Math.PI / 2 + 0.30;
    label.position.set(0, 0.006, 0.325);
    g.add(label);

    const tagMat = new THREE.MeshStandardMaterial({
      map: stencil('', { w: 384, h: 80, size: 34 }),
      roughness: 0.9, metalness: 0.2, transparent: true
    });
    const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.062), tagMat);
    tagMesh.rotation.x = -Math.PI / 2 + 0.30;
    tagMesh.position.set(0, 0.006, 0.400);
    g.add(tagMesh);

    const noteMat = new THREE.MeshStandardMaterial({
      map: engravedPlaque(hopper.note || '', { w: 640, h: 190, size: 26, align: 'left' }),
      roughness: 0.95, metalness: 0.1
    });
    const note = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.16), noteMat);
    note.rotation.x = -Math.PI / 2 + 0.24;
    note.position.set(0, 0.004, 0.520);
    g.add(note);

    // Selection lamp, set into the plate at the rig's near edge.
    const indicator = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 10, 8),
      new THREE.MeshStandardMaterial({
        color: 0x4a4038, emissive: AMBER, emissiveIntensity: 0, roughness: 0.6
      })
    );
    indicator.position.set(0, 0.012, 0.275);
    g.add(indicator);

    /* ---- A HOPPER TOO FULL TO TIP SAYS SO ----
       The gate is dogged shut across the chute mouth and stencilled, because
       the whole point of such a sample is that it CANNOT be counted by
       tipping it, and a floor that looked tippable and then refused would be
       hiding the one fact the stage is built on. */
    if (hopper.bulk) {
      const dog = new THREE.Mesh(
        new THREE.BoxGeometry(0.155, 0.014, 0.075), this.dark
      );
      dog.position.set(0, THROAT_Y - 0.030, THROAT_Z + 0.070);
      g.add(dog);
      const shutMat = new THREE.MeshStandardMaterial({
        map: engravedPlaque('GATE SHUT', { w: 384, h: 96, size: 34, align: 'center' }),
        roughness: 0.9, metalness: 0.2
      });
      const shut = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.050), shutMat);
      shut.position.set(0, THROAT_Y - 0.062, THROAT_Z + 0.078);
      shut.rotation.x = -0.35;
      g.add(shut);
    }

    const topMark = new THREE.Object3D();
    topMark.position.set(0, THROAT_Y + 0.205, THROAT_Z);
    g.add(topMark);

    g.userData.hopperId = hopper.id;

    return {
      hopper, group: g, bins: binRecs, heap, flight, flightGeo,
      indicator, tagMesh, topMark, binW,
      pourDone: null, queue: null
    };
  }

  /** Stand the camera so every rig is in the glass. */
  frame(n) {
    this.viewer.camDist = 1.30 + Math.max(0, n - 1) * 0.44;
    this.viewer.camHeight = 1.62 + Math.max(0, n - 2) * 0.05;
    this.viewer.camTarget = new THREE.Vector3(0, PLATE_Y + 0.26, -0.04);
    this.viewer.applyCamera();
  }

  /* ---------------- what is in the bins ---------------- */

  /**
   * Restack one rig's bins from what has landed, and repaint the tallies.
   *
   * EVERY PIECE THAT LANDED IS PLACED. Nothing is summarised, nothing is capped
   * and nothing stands in for a group — the heap in the bin and the figure over
   * it are the same measurement. The grid comes from `packBin`, the same pure
   * function the drawn floor stacks with, so a heap packs one way everywhere.
   */
  refreshBin(rig, only) {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    const scale = new THREE.Vector3();
    const pos = new THREE.Vector3();

    rig.bins.forEach((bin, i) => {
      if (only !== null && only !== undefined && only !== i) return;
      const n = rig.hopper.landed[i] || 0;
      const { cells, r } = packBin(n, bin.w - 0.016, BIN_H - 0.020);
      const take = cells.length;
      for (let k = 0; k < take; k++) {
        const [dx, dy] = cells[k];
        // One plane, just inside the sight glass: nothing is ever behind
        // anything, which is what makes the heap countable.
        pos.set(dx, 0.012 + dy, BIN_D / 2 - 0.020);
        scale.set(r, r * 1.6, r);
        m.compose(pos, q, scale);
        bin.pieces.setMatrixAt(k, m);
      }
      bin.pieces.count = take;
      bin.pieces.instanceMatrix.needsUpdate = true;

      const poured = rig.hopper.landed.some(x => x > 0);
      bin.tallyMat.map?.dispose();
      bin.tallyMat.map = stencil(rig.hopper.tally && poured ? String(n) : '', {
        w: 192, h: 96, size: 60, colour: '#6f8f3f'
      });
      bin.tallyMat.needsUpdate = true;

      bin.markMat.map?.dispose();
      bin.markMat.map = stencil(rig.hopper.bins[i].mass, {
        w: 192, h: 96, size: 56, lit: poured
      });
      bin.markMat.needsUpdate = true;
    });

    // The heap left in the hopper shrinks as the sample goes down the chute.
    const declared = rig.hopper.bins.reduce((n, b) => n + b.n, 0) || 1;
    const left = rig.hopper.bins.reduce((n, b, i) => n + (b.n - rig.hopper.landed[i]), 0);
    const f = Math.max(0, Math.min(1, left / declared));
    rig.heap.visible = f > 0.01;
    rig.heap.scale.set(1, Math.max(0.05, f), 1);
    rig.heap.position.y = THROAT_Y + 0.085 * Math.max(0.05, f);
  }

  /* ---------------- input ---------------- */

  onPointer(e) {
    if (this.disposed) return;
    this.viewer.setPointer(e);

    const ray = this.viewer.raycaster;
    ray.setFromCamera(this.viewer.pointer, this.viewer.camera);

    let picked = null;
    for (const rig of this.rigs) {
      const hits = ray.intersectObject(rig.group, true);
      if (!hits.length) continue;
      if (picked && hits[0].distance >= picked.distance) continue;
      let binIndex = null;
      let node = hits[0].object;
      while (node && node !== rig.group) {
        if (Number.isInteger(node.userData?.binIndex)) { binIndex = node.userData.binIndex; break; }
        node = node.parent;
      }
      picked = { rig, binIndex, distance: hits[0].distance };
    }
    if (!picked) return;

    const { rig, binIndex } = picked;

    /* A PRESS ON A BIN IS NOT A PRESS ON THE SAMPLE.
       A probe reports the sample AND which bin; a selection reports the sample
       and forgets the bin, because picking a different sample cannot leave you
       pointing at a bin of the old one. Firing both for one press therefore
       chooses a bin and then immediately un-chooses it, and "Read Code" answers
       that no bin has been tapped on the bin the player just tapped. So one
       press is one of the two: the bin if the press landed on a bin, the sample
       otherwise. This is the same rule the drawn floor follows. */
    if (binIndex !== null) {
      this.probe = { hopperId: rig.hopper.id, bin: binIndex };
      this.ringBin(rig, binIndex);
      this.onProbe?.({
        hopperId: rig.hopper.id,
        hopperLabel: rig.hopper.label,
        bin: binIndex,
        mass: rig.hopper.bins[binIndex]?.mass ?? null,
        count: rig.hopper.landed[binIndex] || 0,
        poured: this.poured(rig.hopper.id)
      });
      return;
    }

    if (this.selectable && this.onSelect) this.onSelect(rig.hopper.id);
  }

  /** Scratch a read ring round the bin the probe last sat on. */
  ringBin(rig, index) {
    for (const r of this.rigs) {
      for (const bin of r.bins) {
        if (bin.ring) { bin.group.remove(bin.ring); bin.ring.geometry.dispose(); bin.ring.material.dispose(); bin.ring = null; }
      }
    }
    const bin = rig.bins[index];
    if (!bin) return;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(bin.w * 0.62, 0.005, 6, 22),
      new THREE.MeshBasicMaterial({ color: AMBER })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.002, 0);
    bin.group.add(ring);
    bin.ring = ring;
  }

  /* ---------------- tools ---------------- */

  /**
   * Tip a hopper over the deflector and count what lands.
   *
   * THE COUNTS ARE THE DECLARATION, NOT A SIMULATION. `planPour` decides what
   * ends up where and is the same function the drawn floor calls; all this adds
   * is the flight — which order the pieces come down the chute in, which is
   * cosmetic and is the only part that is randomised.
   *
   * @returns {Promise<{totals: number[], total: number, refused?: boolean}>}
   */
  pour(id) {
    const rig = this.rigs.find(r => r.hopper.id === id);
    const hp = rig?.hopper;
    if (!hp) return Promise.resolve({ totals: [], total: 0 });
    if (hp.bulk) {
      return Promise.resolve({ refused: true, totals: hp.bins.map(() => 0), total: 0 });
    }
    if (this.poured(id)) {
      return Promise.resolve({
        totals: hp.landed.slice(), total: hp.landed.reduce((n, x) => n + x, 0)
      });
    }

    const { order, totals, total } = planPour(hp);
    hp.landed = hp.bins.map(() => 0);
    hp.flight = [];
    hp.tally = true;
    rig.queue = order.slice();
    this.startAnim();

    return new Promise(resolve => {
      rig.pourDone = () => setTimeout(() => {
        hp.landed = totals.slice();
        hp.flight = [];
        this.refreshBin(rig, null);
        this.syncFlight(rig);
        resolve({ totals: totals.slice(), total });
      }, 200);
    });
  }

  /* ---------------- animation ---------------- */

  /** Where a piece bound for bin `i` is, `t` of the way down the run. */
  flightPoint(rig, binIndex, t, out) {
    const bin = rig.bins[binIndex];
    const x1 = bin ? bin.x : 0;
    const clamped = Math.max(0, Math.min(1, t));

    if (clamped < 0.46) {
      // Down the chute to the deflector, straight.
      const f = clamped / 0.46;
      return out.set(
        0,
        THROAT_Y + (DEFLECT_Y - THROAT_Y) * f,
        THROAT_Z + (DEFLECT_Z - THROAT_Z) * f
      );
    }
    // Off the deflector and out along its own track: the further a piece is
    // turned aside, the further out it lands. That IS the sort.
    const f = (clamped - 0.46) / 0.54;
    const y0 = DEFLECT_Y;
    const y1 = BIN_H * 0.55;
    return out.set(
      x1 * f,
      y0 + (MOUTH_Y - y0) * Math.min(1, f * 2.2) + (y1 - MOUTH_Y) * f * f,
      DEFLECT_Z + (MOUTH_Z - DEFLECT_Z) * Math.min(1, f * 2.2) + 0.055 * f
    );
  }

  /** Put the in-flight bodies where the clock says they are. */
  syncFlight(rig) {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    const scale = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const flying = rig.hopper.flight || [];
    // The flight is cosmetic — it is which order pieces come down the chute in
    // — so this one IS allowed to clamp. Nothing is counted from it.
    const take = Math.min(flying.length, rig.flight.instanceMatrix.count);
    const r = Math.max(0.004, rig.binW * 0.030);
    for (let i = 0; i < take; i++) {
      const f = flying[i];
      this.flightPoint(rig, f.bin, f.t, pos);
      scale.set(r, r * 1.6, r);
      m.compose(pos, q, scale);
      rig.flight.setMatrixAt(i, m);
    }
    rig.flight.count = take;
    rig.flight.instanceMatrix.needsUpdate = true;
  }

  startAnim() {
    if (this.raf || this.disposed) return;
    let last = performance.now();
    const step = now => {
      if (this.disposed) { this.raf = null; return; }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let live = false;

      for (const rig of this.rigs) {
        const hp = rig.hopper;
        if (!rig.queue && !hp.flight.length) continue;

        if (rig.queue && rig.queue.length) {
          // The whole pour takes about a second and a half however big the
          // heap is, so a big one simply streams faster.
          const rate = Math.max(6, Math.ceil(rig.queue.length / POUR_SECONDS));
          const send = Math.min(rig.queue.length, Math.ceil(rate * dt));
          for (let i = 0; i < send; i++) hp.flight.push({ bin: rig.queue.shift(), t: 0 });
          live = true;
        }

        for (const f of hp.flight) f.t += dt / FLIGHT_SECONDS;
        const arrived = hp.flight.filter(f => f.t >= 1);
        for (const f of arrived) hp.landed[f.bin] = (hp.landed[f.bin] || 0) + 1;
        hp.flight = hp.flight.filter(f => f.t < 1);

        if (arrived.length) this.refreshBin(rig, null);
        this.syncFlight(rig);

        if (hp.flight.length) live = true;
        else if (rig.queue && !rig.queue.length) {
          rig.queue = null;
          const done = rig.pourDone;
          rig.pourDone = null;
          if (done) done();
        }
      }

      this.raf = live ? requestAnimationFrame(step) : null;
    };
    this.raf = requestAnimationFrame(step);
  }

  /* ---------------- teardown ---------------- */

  teardown() {
    for (const rig of this.rigs) this.viewer.releaseGroup(rig.group);
    this.viewer.clearFitNodes();
    this.rigs = [];
    // The shared materials are the viewer's and outlive the stage; the viewer
    // frees them when the instrument is disposed.
  }

  dispose() {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    window.removeEventListener('resize', this.onResize);
    this.teardown();
    this.unmountScene(this.viewer);
    this.viewer.dispose();
    if (this.host) this.host.innerHTML = '';
  }
}

export { PHOSPHOR };
