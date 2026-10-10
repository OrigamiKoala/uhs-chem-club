/**
 * plates3d.js — The plate bench, built as an instrument instead of drawn as one.
 *
 * `plateBench3D(Base)` returns a subclass of any `PlateBench` that lays its
 * plates on the real bench at T4. It is a SUBCLASS of the drawn bench, never a
 * second implementation: `prepare`, `draw`, `press`, `tick` and every planner
 * behind them are inherited unchanged, so a stage that grades correct on the
 * canvas grades correct here because the same code is deciding (the rule that
 * keeps T4 a fidelity tier and not a second game).
 *
 * THE PICTURE IS FLAT, THE INSTRUMENT IS BUILT. What the instrument resolves is
 * painted on the raked screen standing behind each station by the very `draw`
 * the canvas plate calls. What stands in the well is the hardware that picture
 * is OF — a lamp housing, a vacuum tube, a cuvette — supplied by the subclass
 * through `buildHardware` and brought into line with the plate's state by
 * `poseHardware`.
 *
 * It also bolts up to two real dials to the plate, outboard of the leftmost station
 * (`dialSpecs`), through the same `buildPowerDial` and `valueForAngle` the drawn
 * dial uses, so the knob on the bench and the knob on the panel cannot land on
 * different detents.
 *
 * It knows no chemistry.
 */

import * as THREE from 'three';
import { BenchViewer3D, buildPowerDial } from './bench3d.js';
import { benchHost } from './bench-host.js';
import { valueForAngle, angleFor as angleOf } from './dial.js';

export function plateBench3D(Base, defaults = {}) {
  return class PlateBench3D extends Base {
    constructor(host, opts = {}) {
      super(host, opts);

      this.stations = [];
      this.dials = new Map();
      this.releases = [];

      this.viewer = new BenchViewer3D(document.body, {
        backdrop: opts.backdrop || defaults.backdrop || 'lab',
        world: opts.world || null
      });
      this.viewer.handleClick = e => this.onPointer3D(e);

      if (this.host) this.host.innerHTML = '';

      const renderHost = benchHost();
      this.mountScene = opts.mountScene || (v => renderHost.mount(v));
      this.unmountScene = opts.unmountScene || (v => renderHost.unmount(v));
      this.mountScene(this.viewer);

      window.removeEventListener('resize', this.onResize);
      this.onResize = () => this.viewer.onResize();
      window.addEventListener('resize', this.onResize);
    }

    /* ---- hooks for the subclass ---- */

    /** Build what stands in the well. Return `{ geos, mats, ...whatever pose needs }`. */
    buildHardware() { return {}; }

    /** Bring the hardware into line with the plate's state. */
    poseHardware() {}

    /** Up to two dials: `[{ id, label, min, max, value, onChange }]`. */
    dialSpecs() { return []; }

    /* ---- DOM hooks, redirected into the scene ---- */

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

    build() {
      if (!this.viewer) return;
      this.viewer.clearStations();
      for (const rec of this.stations) this.freeRec(rec);
      this.stations = [];

      this.items.forEach((item, i) => {
        const station = this.viewer.buildStation(i, item.label, item.note || '');
        const hw = this.buildHardware(station, item) || {};
        this.stations.push({ item, station, hits: [], geos: [], mats: [], ...hw });
      });

      this.viewer.layoutStations();
      // A bench with one plate stands the camera back as if there were two and a half. The
      // plates here are tall (a rack, a cloud block, a spectrum with its rings),
      // and a head that fits one is a head that is too close to hold the frame's
      // own chrome clear of it.
      if (this.stations.length < 2) this.viewer.frameCamera(2.6);
      this.buildDials();
      this.drawAll();
    }

    layoutAll() { this.drawAll(); }

    /* ---- the dials ---- */

    buildDials() {
      this.disposeDials();
      const specs = this.dialSpecs().filter(Boolean);
      if (!specs.length) return;

      const n = Math.max(1, this.stations.length);
      const span = (n - 1) * 0.92;
      this.viewer.camDist += 0.18;
      this.viewer.applyCamera();

      // BOTH DIALS STAND ON THE LEFT, one behind the other along the plate. The key
      // bank takes the right of the bench first, and a knob's generous hit target
      // standing where a key is would take that key's press.
      specs.forEach((spec, k) => {
        const x = -(span / 2 + 0.50 + k * 0.30);
        const dial = buildPowerDial({
          min: spec.min, max: spec.max, value: spec.value, label: spec.label
        });
        dial.group.position.set(x, 0.895, 0.10);
        this.viewer.root.add(dial.group);
        this.dials.set(spec.id, { dial, spec });

        let deg = 0;
        const release = this.viewer.addGrabbable({
          object: dial.hit,
          onStart: () => { deg = angleOf(spec.value, spec.min, spec.max); },
          onMove: (dx, dy) => {
            deg += (dx - dy) * 0.9;
            const v = valueForAngle(deg, spec.min, spec.max);
            if (v !== spec.value) spec.onChange?.(v);
          },
          onWheel: deltaY => {
            const v = Math.max(spec.min, Math.min(spec.max, spec.value + (deltaY > 0 ? -1 : 1)));
            if (v !== spec.value) spec.onChange?.(v);
          }
        });
        this.releases.push(release);
      });
    }

    /** Keep a knob pointing where the instrument actually is. */
    setDialValue(id, value) {
      const rec = this.dials.get(id);
      if (!rec) return;
      rec.spec.value = value;
      rec.dial.setValue(value);
    }

    disposeDials() {
      for (const r of this.releases) r?.();
      this.releases = [];
      for (const { dial } of this.dials.values()) {
        this.viewer.root.remove(dial.group);
        for (const g of dial.geos || []) g.dispose();
        for (const m of dial.mats || []) {
          if (m.userData?.ownTexture) m.userData.ownTexture.dispose();
          m.dispose();
        }
      }
      this.dials.clear();
    }

    /* ---- drawing ---- */

    drawAll() {
      if (this.disposed || !this.viewer) return;
      for (const rec of this.stations) this.drawStation(rec);
    }

    drawStation(rec) {
      const item = rec.item;
      const sc = rec.station.screen;
      const sweep = this.probe && this.probe.plateId === item.id ? this.sweep : 0;
      rec.hits = this.draw(sc.ctx, sc.w, sc.h, item, { sweep, probe: this.probe, bench: this }) || [];
      this.viewer.refreshScreen(rec.station);
      this.poseHardware(rec);
    }

    /* ---- input ---- */

    onPointer3D(e) {
      if (this.disposed) return;
      this.viewer.setPointer(e);

      const onScreen = this.viewer.screenUnderRay();
      const rec = onScreen
        ? this.stations.find(r => r.station === onScreen.station)
        : this.recUnderRay();
      if (!rec) return;

      if (onScreen && this.pressAt(rec.item, onScreen.px, onScreen.py, rec.hits)) {
        this.viewer.runSweep(rec.station);
        return;
      }
      if (this.selectable && this.onSelect) this.onSelect(rec.item.id);
    }

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

    freeRec(rec) {
      for (const g of rec.geos || []) g.dispose();
      for (const m of rec.mats || []) m.dispose();
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
      window.removeEventListener('resize', this.onResize);
      if (this.host) this.host.innerHTML = '';
      this.disposeDials();
      for (const rec of this.stations) this.freeRec(rec);
      this.stations = [];
      this.unmountScene(this.viewer);
      this.viewer.dispose();
    }
  };
}

/** Small helpers the subclasses' hardware builders share. */
export function ownedMaterial(rec, params) {
  const m = new THREE.MeshStandardMaterial(params);
  rec.mats.push(m);
  return m;
}
export function ownedGeometry(rec, geo) {
  rec.geos.push(geo);
  return geo;
}
