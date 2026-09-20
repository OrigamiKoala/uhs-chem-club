/**
 * corebench3d.js — The core bench, built as an instrument instead of drawn as one.
 *
 * This is `corebench.js` in three dimensions, for Tallow's sub-level lab at T4.
 * It exposes the same API, takes the same specimen declarations, and plans its
 * tools through the same pure functions — `drawCoreField`, `planBeam` and
 * `planStrip` come from the canvas engine, so what the picture shows, what the
 * tester reports and which ring a strip takes from can never differ between the
 * two benches.
 *
 * THE BENCH IS BUILT; ITS PICTURE IS FLAT. The specimen is mounted in a real
 * containment bell on the plate in front of the player, the tools are real
 * controls — and what the instrument RESOLVES is drawn in two dimensions on the
 * screen raked over the well, by `drawCoreField` from `corebench.js`.
 *
 * That is not a shortcut, it is the only arrangement the stages work in. A core
 * is a huddle of a dozen grains: staged as spheres in a hole, half of them are
 * behind the other half, and a player told to COUNT the marks counts five of
 * six and is refused by an instrument that never showed them the sixth. Light
 * pieces on rings fared worse — at that scale they were specks, indistinguishable
 * from the dust of the world behind them. Drawn in a plane, every piece is in
 * the picture, in one place, at a size a person can count.
 *
 * The three fields are the same three fields: `whole` (a haze with the core to
 * scale, a speck), `core` (the grains laid out and countable) and `rings` (light
 * pieces at their fixed distances). A marked grain is told apart by a stencilled
 * cross and never by a colour, which is the only version of that rule that
 * survives being colour-blind.
 *
 * It knows no chemistry. A mark is a mark, and what a specimen does is the
 * quest's business.
 */

import * as THREE from 'three';
import {
  CORE_TINTS, FIELDS, planBeam, planStrip, drawCoreField, hitTestCore
} from './corebench.js';
import { BenchViewer3D, AMBER } from './bench3d.js';
import { benchHost } from './bench-host.js';

/** The containment volume's radius in metres. Plays `aperture`'s part. */
const FIELD_R = 0.26;

const HEX = {
  marked: { fill: 0x9c5423, rim: 0x5c3116 },
  blank: { fill: 0x6b625a, rim: 0x3b3631 },
  light: { fill: 0xb8afa0, rim: 0x6f685d }
};

export class CoreBench3D {
  /**
   * @param {HTMLElement} host the frame's instrument host, kept empty.
   * @param {{onProbe?: Function, onSelect?: Function,
   *          mountScene?: Function, unmountScene?: Function}} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.onProbe = opts.onProbe || null;
    this.onSelect = opts.onSelect || null;

    this.specimens = [];
    this.stations = [];
    this.field = 'whole';
    this.selectable = false;
    this.selected = null;
    this.probe = null;
    this.sweep = 0;
    this.disposed = false;

    // `opts.world`, when the dispatcher supplied one, deploys the instrument
    // onto the bench that is already standing on the ground in front of the
    // player instead of building a private room for it.
    this.viewer = new BenchViewer3D(document.body, {
      backdrop: opts.backdrop || 'lab',
      world: opts.world || null
    });
    this.viewer.handleClick = e => this.onPointer(e);

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

    // The bench drives its own clock for the beam and for pieces flying off.
    this.raf = null;
  }

  /* ---------------- specimens & state ---------------- */

  setSpecimens(specimens) {
    // A beam still in flight has a caller waiting on it. Let it go before the
    // stations it was drawn on are replaced, or that caller waits forever.
    this.stations.forEach(st => {
      if (st.beamDone) { const d = st.beamDone; st.beamDone = null; d(); }
    });

    this.specimens = specimens.map(s => ({
      ...s,
      rings: (s.rings || []).slice(),
      baseRings: (s.rings || []).slice(),
      pulled: []
    }));
    this.probe = null;
    this.selected = null;
    this.build();
  }

  setField(field) {
    if (!FIELDS.includes(field) || field === this.field) return;
    this.field = field;
    this.probe = null;
    this.drawAll();
  }

  setSelectable(on) {
    this.selectable = Boolean(on);
  }

  setSelected(id) {
    this.selected = id;
    this.stations.forEach(st =>
      this.viewer.setStationSelected(st.station, st.specimen.id === id)
    );
  }

  setPlateTag(id, text) {
    const rec = this.stations.find(s => s.specimen.id === id);
    if (rec) this.viewer.setStationTag(rec.station, text);
  }

  /** Draw a proposed arrangement of the light pieces without touching the real one. */
  setRings(id, rings) {
    const sp = this.specimens.find(s => s.id === id);
    if (!sp) return;
    sp.rings = (rings || []).slice();
    this.drawAll();
  }

  ringsOf(id) {
    const sp = this.specimens.find(s => s.id === id);
    return sp ? sp.rings.slice() : [];
  }

  /* ---------------- the bench ---------------- */

  build() {
    this.viewer.clearStations();
    this.stations = [];

    this.specimens.forEach((specimen, i) => {
      const station = this.viewer.buildStation(i, specimen.label, specimen.note || '');

      // WHAT IS IN THE WELL IS THE SPECIMEN, NOT THE PICTURE. A single piece of
      // salvage, mounted on a pin under a containment bell, at the size it
      // actually is. Switching field does not move it: the field is a setting on
      // the instrument, and the instrument's answer is on the screen above.
      const bell = new THREE.Mesh(
        new THREE.SphereGeometry(FIELD_R * 1.12, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new THREE.MeshStandardMaterial({
          color: 0x1b1813, roughness: 0.5, metalness: 0.1,
          transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false
        })
      );
      bell.position.y = 0.004;
      station.content.add(bell);

      const bellRim = new THREE.Mesh(
        new THREE.TorusGeometry(FIELD_R * 1.12, 0.008, 8, 30),
        new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: 0.8, metalness: 0.55 })
      );
      bellRim.rotation.x = -Math.PI / 2;
      bellRim.position.y = 0.005;
      station.content.add(bellRim);

      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.006, FIELD_R * 0.34, 8),
        new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: 0.7, metalness: 0.6 })
      );
      pin.position.y = FIELD_R * 0.17;
      station.content.add(pin);

      const piece = new THREE.Mesh(
        new THREE.IcosahedronGeometry(FIELD_R * 0.17, 1),
        new THREE.MeshStandardMaterial({
          color: HEX.light.fill, roughness: 0.88, metalness: 0.12, flatShading: true
        })
      );
      piece.position.y = FIELD_R * 0.42;
      station.content.add(piece);

      // The mount fires when the beam does, so the player sees the shot land on
      // the thing in front of them and reads its result on the screen.
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 8, 6),
        new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0 })
      );
      spark.position.y = FIELD_R * 0.42;
      station.content.add(spark);

      this.stations.push({
        specimen, station, bell, piece, spark,
        beam: null, beamDone: null,
        hits: []           // {key, part, ring, x, y, r} in the screen's pixels
      });
    });

    this.viewer.layoutStations();
    this.drawAll();
  }

  /* ---------------- drawing ---------------- */

  drawAll() {
    if (this.disposed) return;
    for (const rec of this.stations) this.draw(rec);
  }

  /**
   * One station's screen. `drawCoreField` is the whole of it, so the built
   * bench and the drawn bench show the identical picture and a hint that names
   * a position stays true on both.
   */
  draw(rec) {
    const sc = rec.station.screen;
    const mine = this.probe && this.probe.specimenId === rec.specimen.id;
    rec.hits = drawCoreField(sc.ctx, {
      w: sc.w, h: sc.h,
      specimen: rec.specimen,
      field: this.field,
      beam: rec.beam,
      probeKey: mine ? this.probe.key : null,
      sweep: mine ? this.sweep : 0
    });
    this.viewer.refreshScreen(rec.station);
  }

  /* ---------------- input ---------------- */

  onPointer(e) {
    if (this.disposed) return;
    this.viewer.setPointer(e);

    // A PIECE IS READ WHERE IT IS SHOWN. The picture is on the screen, so that
    // is where a press on a grain lands, and the hit test is `hitTestCore` —
    // the same one the drawn instrument runs, against the same picture.
    const onScreen = this.viewer.screenUnderRay();
    if (onScreen) {
      const rec = this.stations.find(s => s.station === onScreen.station);
      const hit = rec ? hitTestCore(rec.hits, onScreen.px, onScreen.py) : null;
      if (rec && hit) {
        this.probe = { specimenId: rec.specimen.id, key: hit.key };
        this.sweep = 1;
        this.viewer.runSweep(rec.station);
        this.startAnim();
        this.draw(rec);
        if (this.onProbe) {
          this.onProbe({
            specimenId: rec.specimen.id,
            specimenLabel: rec.specimen.label,
            part: hit.part,
            ring: hit.ring ?? null,
            field: this.field
          });
        }
      }
      if (rec && this.selectable && this.onSelect) this.onSelect(rec.specimen.id);
      return;
    }

    // Nothing under the pointer on a screen: the click is still how a station is
    // chosen, the same way it is on the canvas plate.
    const station = this.viewer.stationUnderRay();
    const rec = station ? this.stations.find(s => s.station === station) : null;
    if (rec && this.selectable && this.onSelect) this.onSelect(rec.specimen.id);
  }

  /* ---------------- tools ---------------- */

  /**
   * Fire a stream through the specimen and report what came back. The tracks and
   * the counts come from `planBeam`, so this bench reports exactly what the
   * canvas bench reports.
   */
  fireBeam(specimenId) {
    const rec = this.stations.find(s => s.specimen.id === specimenId);
    if (!rec) return Promise.resolve({ shots: 0, through: 0, wide: 0, back: 0 });

    const { tracks, wide, back, shots } = planBeam(specimenId);

    // The tracks are drawn on the screen, which is where the instrument's
    // answer belongs; the mount below it sparks when the shot lands.
    rec.beam = { tracks, t: 0 };
    this.startAnim();

    return new Promise(resolve => {
      rec.beamDone = () => {
        setTimeout(() => {
          rec.beam = null;
          rec.spark.material.opacity = 0;
          this.drawAll();
          resolve({ shots, through: shots - wide - back, wide, back });
        }, 420);
      };
    });
  }

  /**
   * Pull one light piece off the outermost ring that has one. Returns the ring
   * it came from, or null when there was nothing left to take.
   */
  strip(specimenId) {
    const sp = this.specimens.find(s => s.id === specimenId);
    if (!sp) return Promise.resolve(null);

    const ri = planStrip(sp);
    if (ri === null) return Promise.resolve(null);

    this.drawAll();
    this.startAnim();
    return new Promise(resolve => setTimeout(() => resolve(ri), 520));
  }

  /** Put a specimen back the way it was found. */
  reset(specimenId) {
    const sp = this.specimens.find(s => s.id === specimenId);
    if (!sp) return;
    sp.rings = sp.baseRings.slice();
    sp.pulled = [];
    this.drawAll();
  }

  /* ---------------- animation ---------------- */

  startAnim() {
    if (this.raf || this.disposed) return;
    let last = performance.now();

    const step = now => {
      if (this.disposed) { this.raf = null; return; }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let live = false;
      let redraw = false;

      for (const rec of this.stations) {
        if (!rec.beam) continue;
        rec.beam.t += dt * 0.85;
        redraw = true;
        // The impact spark on the mount, at the moment the returning track
        // turns around.
        rec.spark.material.opacity = rec.beam.t > 0.35 && rec.beam.t < 1.1 ? 0.9 : 0;

        if (rec.beam.t >= 1.35) {
          const done = rec.beamDone;
          rec.beamDone = null;
          rec.beam.t = 1.35;
          if (done) done();
        } else {
          live = true;
        }
      }

      for (const sp of this.specimens) {
        if (!sp.pulled.length) continue;
        sp.pulled.forEach(p => { p.t += dt * 1.9; });
        sp.pulled = sp.pulled.filter(p => p.t < 1);
        live = true;
        redraw = true;
      }

      if (this.sweep > 0) {
        this.sweep = Math.max(0, this.sweep - dt * 3.2);
        live = live || this.sweep > 0;
        redraw = true;
      }

      if (redraw) this.drawAll();
      this.raf = live ? requestAnimationFrame(step) : null;
    };

    this.raf = requestAnimationFrame(step);
  }

  dispose() {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    window.removeEventListener('resize', this.onResize);
    this.stations.forEach(st => {
      if (st.beamDone) { const d = st.beamDone; st.beamDone = null; d(); }
    });
    this.unmountScene(this.viewer);
    this.viewer.dispose();
    this.stations = [];
    this.specimens = [];
    if (this.host) this.host.innerHTML = '';
  }
}

export { FIELDS, CORE_TINTS };
