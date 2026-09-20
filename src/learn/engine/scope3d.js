/**
 * scope3d.js — The sampler scope, built as an instrument instead of drawn as one.
 *
 * This is `scope.js` in three dimensions, for Tallow at T4. It exposes the same
 * API, takes the same sample declarations, and runs the same layout and tool
 * maths — `buildUnits`, `detailFor`, `planSettle` and `planCut` are imported from
 * the canvas engine rather than reimplemented, so what the blade finds and where
 * the bands land can never differ between the two.
 *
 * What changes is only where the player stands. The crate of bulk matter sits
 * in a real recessed well in the bench top, the power control is a milled cap
 * they reach over and turn — and the PICTURE the scope resolves is on the screen
 * raked over the well, drawn by `drawScopeField` from `scope.js`: the same
 * function, the same layout, the same pieces in the same places as on a
 * Chromebook.
 *
 * A MICROSCOPE'S OUTPUT IS A FLAT IMAGE. This used to stage the magnified
 * sample as spheres standing in the well, which is not what a scope does and is
 * not something a player can read: pieces at the back of the well hide behind
 * pieces at the front, and loose balls appearing inside the ring as the dial
 * came up read as the crate inflating rather than as the instrument resolving.
 * The instrument is built; its picture is drawn.
 *
 * It knows no chemistry. A piece is a piece, and what any of it means is the
 * quest's business.
 */

import * as THREE from 'three';
import {
  buildUnits, detailFor, planSettle, planCut, TINTS,
  drawScopeField, fieldGeometry, hitTestField
} from './scope.js';
import { BenchViewer3D, TINT_HEX, buildPowerDial } from './bench3d.js';
import { valueForAngle, angleFor as angleOf } from './dial.js';
import { benchHost } from './bench-host.js';

/** The well's radius in metres. Plays the part `aperture` plays on canvas. */
const WELL_R = 0.27;

/** Deterministic noise for the dust puck, matching the canvas instrument's seed. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class SampleScope3D {
  /**
   * @param {HTMLElement} host the frame's instrument host. Kept empty: the
   *   instrument is in the scene, not in the DOM.
   * @param {{kinds: object, onProbe?: Function, onSelect?: Function,
   *          mountScene?: Function, unmountScene?: Function}} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.kinds = opts.kinds || {};
    this.onProbe = opts.onProbe || null;
    this.onSelect = opts.onSelect || null;

    // The quest's power handler, when it gave one. THE DIAL ON THE BENCH IS A
    // REAL DIAL: at T4 the player reaches over and turns it, and this is how
    // the turn gets back to the quest. The drawn instrument ignores the option
    // entirely, so a quest module passes it once and works on both benches.
    this.onPower = opts.onPower || null;
    this.powerRange = opts.powerRange || { min: 1, max: 6 };

    this.samples = [];
    // Set before any stage runs: setSelected / setPlateTag can be called by a
    // quest before its first setSamples, and must not throw when they are.
    this.stations = [];
    this.power = 1;
    this.selectable = false;
    this.selected = null;
    this.probe = null;
    this.sweep = 0;
    this.sweepRaf = null;
    this.disposed = false;
    this.animating = false;

    // `opts.world`, when the dispatcher supplied one, deploys the instrument
    // onto the bench that is already standing on the ground in front of the
    // player instead of building a private room for it.
    this.viewer = new BenchViewer3D(document.body, {
      backdrop: opts.backdrop || 'awning',
      world: opts.world || null
    });
    this.viewer.handleClick = e => this.onPointer(e);

    // The host stays empty. Anything drawn into it would sit over the bench.
    if (this.host) this.host.innerHTML = '';

    // The bench is drawn by the stage's own loop, the way the campaign's
    // containment chamber is. A quest module never has to know this happened,
    // which is why its code is identical on both benches.
    const renderHost = benchHost();
    this.mountScene = opts.mountScene || (v => renderHost.mount(v));
    this.unmountScene = opts.unmountScene || (v => renderHost.unmount(v));
    this.mountScene(this.viewer);

    this.onResize = () => this.viewer.onResize();
    window.addEventListener('resize', this.onResize);
  }

  /* ---------------- samples & state ---------------- */

  setSamples(samples) {
    this.samples = samples.map(s => ({
      ...s,
      floorPower: s.floorPower ?? 4,
      units: buildUnits(s, this.kinds)
    }));
    this.probe = null;
    this.selected = null;
    this.build();
  }

  setPower(p) {
    this.power = p;
    this.probe = null;
    // Keep the knob pointing where the instrument actually is, whichever
    // control moved it — the bench dial, the panel dial, or a stage load.
    this.dial?.setValue(p);
    this.drawAll();
  }

  setSelectable(on) {
    this.selectable = Boolean(on);
  }

  setSelected(id) {
    this.selected = id;
    this.stations.forEach(st =>
      this.viewer.setStationSelected(st.station, st.sample.id === id)
    );
  }

  setPlateTag(id, text) {
    const rec = this.stations.find(s => s.sample.id === id);
    if (rec) this.viewer.setStationTag(rec.station, text);
  }

  /* ---------------- the bench ---------------- */

  build() {
    this.viewer.clearStations();
    this.stations = [];

    this.samples.forEach((sample, i) => {
      const station = this.viewer.buildStation(i, sample.label, sample.note || '');

      // WHAT IS IN THE WELL IS THE CRATE, NOT THE PICTURE. Bulk matter, poured
      // out at the size it actually is: a puck of grit that does not change
      // when the dial does, because turning a scope up does not make a crate
      // bigger. Everything the instrument resolves is on the screen above it.
      const puckGeo = new THREE.CylinderGeometry(WELL_R * 0.98, WELL_R * 0.98, 0.014, 40);
      const puckMat = new THREE.MeshStandardMaterial({
        color: 0x8f8678, roughness: 0.96, metalness: 0.0
      });
      const puck = new THREE.Mesh(puckGeo, puckMat);
      puck.position.y = 0.007;
      station.content.add(puck);

      // Grit on top of it, so the crate reads as poured rather than machined.
      const mottleGeo = new THREE.SphereGeometry(1, 8, 6);
      const mottleMat = new THREE.MeshStandardMaterial({
        color: 0x8f8678, roughness: 0.98, metalness: 0.0
      });
      const mottle = new THREE.InstancedMesh(mottleGeo, mottleMat, 160);
      mottle.count = 0;
      mottle.frustumCulled = false;
      station.content.add(mottle);

      this.stations.push({
        sample, station, puck, puckGeo, puckMat, mottle, mottleGeo, mottleMat
      });
    });

    this.viewer.layoutStations();
    this.buildDial();
    this.drawAll();
  }

  /**
   * Bolt the power dial to the plate, outboard of the last station.
   *
   * WHY IT MOVES WITH THE STATION COUNT. A stage with one sample frames the
   * camera close and a stage with four frames it back, so a dial at a fixed
   * coordinate would be off the left of the glass on the short stages and lost
   * in the middle of the bench on the long ones. Standing it half a metre
   * outboard of the leftmost tray keeps it in the same place in the player's
   * VIEW — front left, within reach — on every stage, and keeps it clear of the
   * trays and the provenance slips, which is where the physics check would
   * otherwise find it.
   */
  buildDial() {
    this.disposeDial();
    if (!this.onPower) return;

    const n = Math.max(1, this.stations.length);
    const span = (n - 1) * 0.92;
    const x = -(span / 2 + 0.50);

    const dial = buildPowerDial({
      min: this.powerRange.min,
      max: this.powerRange.max,
      value: this.power,
      label: 'POWER'
    });
    dial.group.position.set(x, 0.895, 0.10);
    this.viewer.root.add(dial.group);
    this.dial = dial;

    // The camera is pulled back a touch so the dial is inside the glass at the
    // short station counts too. Measured in `verify:bench`.
    this.viewer.camDist += 0.18;
    this.viewer.applyCamera();

    // TURNING IT. A knob and a view are the same gesture — a drag — so the
    // viewer hands the press to whichever the pointer went down on. The angle
    // is accumulated from the drag and run through `valueForAngle`, the SAME
    // pure function the drawn dial uses, so the two cannot land on different
    // detents. Horizontal and vertical both contribute, because a knob under
    // your fingers turns whichever way you sweep across it.
    let deg = 0;
    const { min, max } = this.powerRange;
    this.releaseDial = this.viewer.addGrabbable({
      object: dial.hit,
      onStart: () => {
        deg = angleOf(this.power, min, max);
      },
      onMove: (dx, dy) => {
        deg += (dx - dy) * 0.9;
        const v = valueForAngle(deg, min, max);
        if (v !== this.power && this.onPower) this.onPower(v);
      },
      onWheel: (deltaY) => {
        const v = Math.max(min, Math.min(max, this.power + (deltaY > 0 ? -1 : 1)));
        if (v !== this.power && this.onPower) this.onPower(v);
      }
    });
  }

  disposeDial() {
    this.releaseDial?.();
    this.releaseDial = null;
    if (!this.dial) return;
    this.viewer.root.remove(this.dial.group);
    for (const g of this.dial.geos || []) g.dispose();
    for (const m of this.dial.mats || []) {
      if (m.userData?.ownTexture) m.userData.ownTexture.dispose();
      m.dispose();
    }
    this.dial = null;
  }

  /* ---------------- drawing ---------------- */

  drawAll() {
    if (this.disposed) return;
    for (const rec of this.stations) this.draw(rec);
  }

  /**
   * One station: the crate in the well, and the picture on the screen.
   *
   * The picture is `drawScopeField` and nothing else, so the built bench and
   * the drawn bench cannot show different things — which is what lets a hint
   * that says "the lower right of the field" stay true on both.
   */
  draw(rec) {
    const sample = rec.sample;
    const sc = rec.station.screen;

    drawScopeField(sc.ctx, {
      w: sc.w, h: sc.h, sample, kinds: this.kinds, power: this.power,
      probe: this.probe && this.probe.sampleId === sample.id ? this.probe : null,
      sweep: this.probe && this.probe.sampleId === sample.id ? this.sweep : 0
    });
    this.viewer.refreshScreen(rec.station);

    this.drawCrate(rec);
  }

  /** The bulk matter in the well. Fixed: the dial magnifies, it does not pour. */
  drawCrate(rec) {
    const sample = rec.sample;
    if (rec.crateDrawn === sample.id) return;
    rec.crateDrawn = sample.id;

    const rand = mulberry32(hashId(sample.id) ^ 0x9e37);
    const firstTint = this.kinds[sample.units[0]?.members[0]?.kindId]?.tint || 'pale';
    const base = TINT_HEX[firstTint] || TINT_HEX.pale;
    rec.puckMat.color.setHex(base.fill);
    rec.mottleMat.color.setHex(base.rim);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const n = 150;
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * WELL_R * 0.93;
      const size = WELL_R * (0.016 + rand() * 0.034);
      pos.set(Math.cos(a) * rr, 0.014 + size * 0.4, Math.sin(a) * rr);
      scale.setScalar(size);
      m.compose(pos, q, scale);
      rec.mottle.setMatrixAt(i, m);
    }
    rec.mottle.count = n;
    rec.mottle.instanceMatrix.needsUpdate = true;
  }

  /** Where the picture sits on a station's screen, in that screen's pixels. */
  screenGeometry(rec) {
    const sc = rec.station.screen;
    return fieldGeometry(sc.w, sc.h, this.power, rec.sample.magnify);
  }

  /* ---------------- interaction ---------------- */

  onPointer(e) {
    if (this.disposed) return;
    this.viewer.setPointer(e);

    // A PIECE IS READ WHERE IT IS SHOWN. The picture is on the screen, so that
    // is where a press on a piece lands, and the hit test is `hitTestField` —
    // the same one the drawn instrument runs, against the same geometry.
    const onScreen = this.viewer.screenUnderRay();
    let rec = onScreen ? this.stations.find(s => s.station === onScreen.station) : null;

    if (rec) {
      const detail = detailFor(this.power, rec.sample.floorPower);
      if (detail >= 3) {
        const hit = hitTestField(this.screenGeometry(rec), rec.sample, onScreen.px, onScreen.py);
        if (hit) {
          this.probe = { sampleId: rec.sample.id, ...hit };
          this.sweep = 1;
          this.startSweep();
          this.viewer.runSweep(rec.station);
          this.draw(rec);
          if (this.onProbe) {
            const unit = rec.sample.units[hit.unitIndex];
            this.onProbe({
              sampleId: rec.sample.id,
              sampleLabel: rec.sample.label,
              kindId: unit.members[hit.memberIndex].kindId,
              neighbours: unit.bonds.filter(b => b.includes(hit.memberIndex)).length,
              groupSize: unit.members.length
            });
          }
        }
      }
    } else {
      // Not on a screen: the tray, the well and the crate in it all choose
      // this station, the same rule the canvas plate follows.
      const station = this.viewer.stationUnderRay();
      rec = station ? this.stations.find(s => s.station === station) : null;
    }

    if (!rec) return;
    if (this.selectable && this.onSelect) this.onSelect(rec.sample.id);
  }

  /** The probe beam sweep across the picture, which fades on its own. */
  startSweep() {
    if (this.sweepRaf) return;
    const tick = () => {
      if (this.disposed) { this.sweepRaf = null; return; }
      this.sweep -= 0.055;
      if (this.sweep <= 0) {
        this.sweep = 0;
        this.sweepRaf = null;
        this.drawAll();
        return;
      }
      this.drawAll();
      this.sweepRaf = requestAnimationFrame(tick);
    };
    this.sweepRaf = requestAnimationFrame(tick);
  }

  /* ---------------- bench actions ---------------- */

  /**
   * Pour a sample back the way it arrived. Every tool starts from the crate as
   * delivered — see the note on `SampleScope.reset`; the fairness rule it
   * describes is the same rule here.
   */
  reset(sampleId) {
    const rec = this.stations.find(s => s.sample.id === sampleId);
    if (!rec) return;
    rec.sample.units = buildUnits(rec.sample, this.kinds);
    if (this.probe?.sampleId === sampleId) this.probe = null;
    this.draw(rec);
  }

  settle(sampleId) {
    this.reset(sampleId);
    const rec = this.stations.find(s => s.sample.id === sampleId);
    if (!rec) return Promise.resolve();
    planSettle(rec.sample.units, this.kinds);
    return this.runAnim(700);
  }

  cut(sampleId) {
    this.reset(sampleId);
    const rec = this.stations.find(s => s.sample.id === sampleId);
    if (!rec) return Promise.resolve('none');

    const plan = planCut(rec.sample.units, sampleId);
    if (plan.result === 'none') return Promise.resolve('none');
    if (plan.result === 'broke') {
      rec.sample.units = plan.units;
      this.probe = null;
    }
    return this.runAnim(plan.ms).then(() => plan.result);
  }

  /** Ease every unit from where it is to its target, then resolve. */
  runAnim(ms) {
    return new Promise(resolve => {
      if (this.disposed || ms <= 0) { this.drawAll(); resolve(); return; }
      const start = performance.now();
      this.samples.forEach(s => s.units.forEach(u => { u.x0 = u.x; u.y0 = u.y; }));
      this.animating = true;

      const step = now => {
        if (this.disposed) { this.animating = false; resolve(); return; }
        const t = Math.min(1, (now - start) / ms);
        // Ease out: a crate lurches and settles, it does not glide.
        const e = 1 - Math.pow(1 - t, 3);
        this.samples.forEach(s => s.units.forEach(u => {
          u.x = u.x0 + (u.tx - u.x0) * e;
          u.y = u.y0 + (u.ty - u.y0) * e;
        }));
        this.drawAll();
        if (t < 1) { requestAnimationFrame(step); return; }
        this.samples.forEach(s => s.units.forEach(u => { u.x = u.tx; u.y = u.ty; }));
        this.drawAll();
        this.animating = false;
        resolve();
      };
      requestAnimationFrame(step);
    });
  }

  dispose() {
    this.disposed = true;
    if (this.sweepRaf) cancelAnimationFrame(this.sweepRaf);
    this.sweepRaf = null;
    this.disposeDial();
    window.removeEventListener('resize', this.onResize);
    this.unmountScene(this.viewer);
    this.viewer.dispose();
    this.stations = [];
    this.samples = [];
    if (this.host) this.host.innerHTML = '';
  }
}

/* TINTS is re-exported so a caller that imports the 3D instrument alone still
   has the one palette both instruments agree on. */
export { TINTS };
