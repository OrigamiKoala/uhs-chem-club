/**
 * corebench3d.js — The core bench, built as an instrument instead of drawn as one.
 *
 * This is `corebench.js` in three dimensions, for Tallow's sub-level lab at T4.
 * It exposes the same API, takes the same specimen declarations, and plans its
 * tools through the same pure functions — `packCore`, `RING_RADII`, `planBeam`
 * and `planStrip` come from the canvas engine, so what the tester reports and
 * which ring a strip takes from can never differ between the two benches.
 *
 * The three fields are the same three fields, shown as volumes instead of discs:
 *   whole — a haze of motion with the core drawn to scale inside it, a speck.
 *   core  — the grains separated in space, walk-around-able, probeable.
 *   rings — light pieces out at the fixed distances they keep.
 *
 * A marked grain is told apart by a stencilled cross cut into its face and never
 * by a colour, which is the same rule the canvas bench follows and the only
 * version of it that survives being colour-blind.
 *
 * It knows no chemistry. A mark is a mark, and what a specimen does is the
 * quest's business.
 */

import * as THREE from 'three';
import {
  packCore, RING_RADII, CORE_TINTS, FIELDS, planBeam, planStrip
} from './corebench.js';
import { BenchViewer3D, AMBER, PHOSPHOR } from './bench3d.js';
import { benchHost } from './bench-host.js';

/** The containment volume's radius in metres. Plays `aperture`'s part. */
const FIELD_R = 0.26;

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
    this.disposed = false;

    this.viewer = new BenchViewer3D(document.body, { backdrop: opts.backdrop || 'lab' });
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

      // The containment volume: a glass bell over the station, dark and dusty,
      // through which the specimen is viewed. Not a window — an instrument.
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

      // Grains: two instanced meshes, marked and blank. A mark is a stencilled
      // cross, which is a third instanced mesh of two crossed bars per grain.
      const grainGeo = new THREE.SphereGeometry(1, 14, 10);
      const mkMesh = kind => {
        const mesh = new THREE.InstancedMesh(
          grainGeo,
          new THREE.MeshStandardMaterial({
            color: HEX[kind].fill, roughness: 0.84, metalness: 0.1
          }),
          1
        );
        mesh.count = 0;
        mesh.frustumCulled = false;
        station.content.add(mesh);
        return { mesh, geo: grainGeo, capacity: 1 };
      };

      const barGeo = new THREE.BoxGeometry(1, 1, 1);
      const barMat = new THREE.MeshStandardMaterial({
        color: 0x100f0d, roughness: 0.95, metalness: 0.0
      });
      const bars = new THREE.InstancedMesh(barGeo, barMat, 1);
      bars.count = 0;
      bars.frustumCulled = false;
      station.content.add(bars);

      // The haze: a point cloud standing in for motion too fast to resolve.
      const hazeGeo = new THREE.BufferGeometry();
      const hazeN = 460;
      const hp = new Float32Array(hazeN * 3);
      const rand = mulberry32(hashId(specimen.id) ^ 0x51ed);
      for (let k = 0; k < hazeN; k++) {
        // Uniform inside a hemisphere sitting on the station floor.
        const u = rand() * 2 - 1;
        const th = rand() * Math.PI * 2;
        const rr = Math.cbrt(rand()) * FIELD_R * 0.94;
        const sp2 = Math.sqrt(1 - u * u);
        hp[k * 3] = Math.cos(th) * sp2 * rr;
        hp[k * 3 + 1] = Math.abs(u) * rr + 0.006;
        hp[k * 3 + 2] = Math.sin(th) * sp2 * rr;
      }
      hazeGeo.setAttribute('position', new THREE.BufferAttribute(hp, 3));
      const haze = new THREE.Points(hazeGeo, new THREE.PointsMaterial({
        color: 0xb8afa0, size: 0.0042, sizeAttenuation: true,
        transparent: true, opacity: 0.42, depthWrite: false
      }));
      haze.visible = false;
      station.content.add(haze);

      // The core at its own scale, in the whole field. It is about one part in
      // ten thousand across; at this volume that is the smallest mark that can
      // be seen at all, which is the entire content of that view.
      const speck = new THREE.Mesh(
        new THREE.SphereGeometry(0.0022, 8, 6),
        new THREE.MeshStandardMaterial({
          color: AMBER, emissive: AMBER, emissiveIntensity: 0.9, roughness: 0.5
        })
      );
      speck.position.y = FIELD_R * 0.42;
      speck.visible = false;
      station.content.add(speck);

      // Light pieces on their rings, and the ring guides themselves.
      const lightGeo = new THREE.SphereGeometry(1, 10, 8);
      const lights = new THREE.InstancedMesh(
        lightGeo,
        new THREE.MeshStandardMaterial({
          color: HEX.light.fill, roughness: 0.8, metalness: 0.08
        }),
        1
      );
      lights.count = 0;
      lights.frustumCulled = false;
      station.content.add(lights);

      const ringGuides = new THREE.Group();
      station.content.add(ringGuides);

      // Beam tracks, rebuilt per shot.
      const beamGroup = new THREE.Group();
      station.content.add(beamGroup);

      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.006, 8, 6),
        new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0 })
      );
      spark.position.y = FIELD_R * 0.42;
      station.content.add(spark);

      const probeRing = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.1, 8, 22),
        new THREE.MeshBasicMaterial({ color: AMBER })
      );
      probeRing.rotation.x = -Math.PI / 2;
      probeRing.visible = false;
      station.content.add(probeRing);

      this.stations.push({
        specimen, station, bell,
        marked: mkMesh('marked'), blank: mkMesh('blank'),
        bars, barGeo, lights, lightGeo, ringGuides,
        haze, speck, beamGroup, spark, probeRing,
        beam: null, beamDone: null,
        hits: []           // {key, part, ring, pos: Vector3, r}
      });
    });

    this.viewer.layoutStations();
    this.drawAll();
  }

  ensureCapacity(slot, needed, parent) {
    if (needed <= slot.capacity) return slot;
    const cap = Math.max(needed, slot.capacity * 2);
    const mesh = new THREE.InstancedMesh(slot.geo, slot.mesh.material, cap);
    mesh.count = 0;
    mesh.frustumCulled = false;
    parent.remove(slot.mesh);
    slot.mesh.dispose();
    slot.mesh = mesh;
    slot.capacity = cap;
    parent.add(mesh);
    return slot;
  }

  /* ---------------- drawing ---------------- */

  drawAll() {
    if (this.disposed) return;
    for (const rec of this.stations) this.draw(rec);
  }

  draw(rec) {
    rec.hits = [];
    rec.haze.visible = false;
    rec.speck.visible = false;
    rec.marked.mesh.count = 0;
    rec.blank.mesh.count = 0;
    rec.bars.count = 0;
    rec.lights.count = 0;
    rec.probeRing.visible = false;
    rec.ringGuides.clear();

    if (this.field === 'whole') this.drawWhole(rec);
    else if (this.field === 'core') this.drawCore(rec);
    else this.drawRings(rec);

    this.drawProbeRing(rec);
  }

  /** The whole piece, at its own scale. Almost nothing to see, which is the point. */
  drawWhole(rec) {
    rec.haze.visible = true;
    rec.speck.visible = true;
    rec.hits.push({
      key: 'whole', part: 'whole',
      pos: new THREE.Vector3(0, FIELD_R * 0.42, 0), r: FIELD_R * 0.7
    });
  }

  /** The middle, magnified until the heavy pieces separate. */
  drawCore(rec) {
    const sp = rec.specimen;
    const marked = sp.core?.marked || 0;
    const blank = sp.core?.blank || 0;
    const total = marked + blank;
    if (!total) return;

    const rand = mulberry32(hashId(sp.id) ^ 0x7a31);
    const pack = packCore(total, rand);
    const spread = Math.max(1, ...pack.map(([x, y]) => Math.hypot(x, y))) + 1;
    const unit = (FIELD_R * 0.74) / spread;
    const r = unit * 0.88;

    // Alternate the two sorts as the pack is walked outward, so neither ends up
    // segregated into its own half of the core. Identical to the canvas bench.
    const order = [];
    let m = marked;
    let b = blank;
    for (let i = 0; i < total; i++) {
      const takeMarked = b === 0 || (m > 0 && (i % 2 === 0 ? m >= b : m > b));
      if (takeMarked) { order.push('marked'); m--; } else { order.push('blank'); b--; }
    }

    this.ensureCapacity(rec.marked, Math.max(marked, 1), rec.station.content);
    this.ensureCapacity(rec.blank, Math.max(blank, 1), rec.station.content);
    if (rec.bars.instanceMatrix.count < marked * 2) {
      rec.station.content.remove(rec.bars);
      rec.bars.dispose();
      const bars = new THREE.InstancedMesh(rec.barGeo, rec.bars.material, Math.max(marked * 2, 2));
      bars.count = 0;
      bars.frustumCulled = false;
      rec.bars = bars;
      rec.station.content.add(bars);
    }

    const mat4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const pos = new THREE.Vector3();
    let mi = 0;
    let bi = 0;
    let bar = 0;

    pack.forEach(([ox, oy], i) => {
      const sort = order[i];
      // A huddle, given depth: the pack's 2D offsets are spread through the
      // volume so the core is a ball rather than a coin standing on edge.
      const depth = (((i * 2654435761) % 1000) / 1000 - 0.5) * unit * 1.5;
      const x = ox * unit;
      const y = FIELD_R * 0.42 + oy * unit;
      const z = depth;

      pos.set(x, y, z);
      scale.setScalar(r);
      mat4.compose(pos, q, scale);

      if (sort === 'marked') {
        rec.marked.mesh.setMatrixAt(mi++, mat4);
        // The stencilled cross: two dark bars laid across the grain's face,
        // toward the viewer, so a mark is legible without relying on colour.
        for (let k = 0; k < 2; k++) {
          const bq = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, 0, k === 0 ? 0 : Math.PI / 2)
          );
          const bs = new THREE.Vector3(r * 1.35, r * 0.24, r * 0.24);
          const bp = new THREE.Vector3(x, y, z + r * 0.86);
          mat4.compose(bp, bq, bs);
          rec.bars.setMatrixAt(bar++, mat4);
        }
      } else {
        rec.blank.mesh.setMatrixAt(bi++, mat4);
      }

      rec.hits.push({ key: `core:${i}`, part: sort, pos: new THREE.Vector3(x, y, z), r });
    });

    rec.marked.mesh.count = mi;
    rec.blank.mesh.count = bi;
    rec.bars.count = bar;
    rec.marked.mesh.instanceMatrix.needsUpdate = true;
    rec.blank.mesh.instanceMatrix.needsUpdate = true;
    rec.bars.instanceMatrix.needsUpdate = true;
  }

  /** The light pieces, out at the distances they keep. */
  drawRings(rec) {
    const sp = rec.specimen;
    const rand = mulberry32(hashId(sp.id) ^ 0x2c99);
    const centreY = FIELD_R * 0.42;

    // The core is one mark at this scale — the point of the previous field.
    const coreR = Math.max(0.0045, FIELD_R * 0.075);
    this.ensureCapacity(rec.marked, 1, rec.station.content);
    const mat4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    mat4.compose(
      new THREE.Vector3(0, centreY, 0), q, new THREE.Vector3(coreR, coreR, coreR)
    );
    rec.marked.mesh.setMatrixAt(0, mat4);
    rec.marked.mesh.count = 1;
    rec.marked.mesh.instanceMatrix.needsUpdate = true;

    if (rec.bars.instanceMatrix.count >= 2) {
      for (let k = 0; k < 2; k++) {
        const bq = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, 0, k === 0 ? 0 : Math.PI / 2)
        );
        mat4.compose(
          new THREE.Vector3(0, centreY, coreR * 0.86), bq,
          new THREE.Vector3(coreR * 1.35, coreR * 0.24, coreR * 0.24)
        );
        rec.bars.setMatrixAt(k, mat4);
      }
      rec.bars.count = 2;
      rec.bars.instanceMatrix.needsUpdate = true;
    }

    rec.hits.push({
      key: 'core', part: 'core', pos: new THREE.Vector3(0, centreY, 0), r: FIELD_R * 0.08
    });

    if (sp.sealed) {
      // The outside will not resolve on this one: a shell of haze and nothing in it.
      rec.haze.visible = true;
      return;
    }

    const dotR = Math.max(0.0035, FIELD_R * 0.045);
    const total = sp.rings.reduce((n, c) => n + c, 0) + sp.pulled.length;
    this.ensureCapacity(rec.lights, Math.max(total, 1), rec.station.content);

    const scale = new THREE.Vector3(dotR, dotR, dotR);
    let li = 0;

    sp.rings.forEach((count, ri) => {
      const rad = (RING_RADII[ri] ?? 0.98) * FIELD_R;

      // The ring guide: a thin hoop at the distance this ring keeps, tilted a
      // little off flat so the rings read as shells rather than as a target.
      const guide = new THREE.Mesh(
        new THREE.TorusGeometry(rad, 0.0009, 5, 56),
        new THREE.MeshBasicMaterial({
          color: 0xb8afa0, transparent: true, opacity: 0.2, depthWrite: false
        })
      );
      guide.rotation.x = -Math.PI / 2 + ri * 0.13;
      guide.rotation.z = ri * 0.09;
      guide.position.y = centreY;
      rec.ringGuides.add(guide);

      const base = rand() * Math.PI * 2;
      for (let i = 0; i < count; i++) {
        const a = base + (i * Math.PI * 2) / Math.max(count, 1);
        // Placed on the tilted hoop, so a piece is genuinely out in space
        // rather than pinned to one plane.
        const tilt = ri * 0.13;
        const px = Math.cos(a) * rad;
        const flat = Math.sin(a) * rad;
        const py = centreY + flat * Math.sin(tilt);
        const pz = flat * Math.cos(tilt);

        mat4.compose(new THREE.Vector3(px, py, pz), q, scale);
        rec.lights.setMatrixAt(li++, mat4);
        rec.hits.push({
          key: `ring:${ri}:${i}`, part: 'light', ring: ri,
          pos: new THREE.Vector3(px, py, pz), r: dotR
        });
      }
    });

    // Anything the tester has knocked loose, on its way out of the field.
    sp.pulled.forEach(p => {
      const rad = (p.r0 + p.t * 1.4) * FIELD_R;
      const s = dotR * Math.max(0, 1 - p.t);
      mat4.compose(
        new THREE.Vector3(Math.cos(p.a) * rad, centreY, Math.sin(p.a) * rad),
        q, new THREE.Vector3(s, s, s)
      );
      rec.lights.setMatrixAt(li++, mat4);
    });

    rec.lights.count = li;
    rec.lights.instanceMatrix.needsUpdate = true;
  }

  drawProbeRing(rec) {
    if (!this.probe || this.probe.specimenId !== rec.specimen.id) return;
    const hit = rec.hits.find(h => h.key === this.probe.key);
    if (!hit) return;
    rec.probeRing.visible = true;
    rec.probeRing.position.copy(hit.pos);
    rec.probeRing.scale.setScalar(Math.max(hit.r * 1.6, 0.012));
  }

  /* ---------------- input ---------------- */

  onPointer(e) {
    if (this.disposed) return;
    this.viewer.setPointer(e);

    // Hits are spheres in the volume. Testing the ray against them directly
    // keeps a small grain clickable without needing a pixel-accurate mesh pick.
    const ray = this.viewer.raycaster.ray;
    let best = null;
    let bestD = Infinity;

    for (const rec of this.stations) {
      const origin = new THREE.Vector3();
      rec.station.content.getWorldPosition(origin);
      for (const hit of rec.hits) {
        const world = hit.pos.clone().add(origin);
        const d = ray.distanceToPoint(world);
        // A generous pick radius: a grain is small and a mouse is not a needle.
        if (d < Math.max(hit.r * 1.8, 0.012)) {
          const along = world.distanceTo(ray.origin);
          if (along < bestD) { bestD = along; best = { rec, hit }; }
        }
      }
    }

    if (best) {
      const { rec, hit } = best;
      this.probe = { specimenId: rec.specimen.id, key: hit.key };
      this.viewer.runSweep(rec.station);
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
      if (this.selectable && this.onSelect) this.onSelect(rec.specimen.id);
      return;
    }

    // Nothing resolved under the pointer: the click is still how a station is
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

    rec.beamGroup.clear();
    const centreY = FIELD_R * 0.42;

    // One line per track, drawn through the volume. Through-tracks are dim
    // phosphor, grazes are brighter, and the one that comes back is amber — the
    // same reading the canvas bench gives, in space.
    rec.beamLines = tracks.map(tr => {
      const pts = tr.path.map(([px, py]) =>
        new THREE.Vector3(px * FIELD_R, centreY + py * FIELD_R, 0)
      );
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: tr.kind === 'back' ? AMBER : tr.kind === 'wide' ? 0x8fa85b : PHOSPHOR,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const line = new THREE.Line(geo, mat);
      // The path is drawn progressively by moving the draw range as the head
      // advances, so a track is seen to travel rather than to appear.
      geo.setDrawRange(0, 2);
      rec.beamGroup.add(line);
      return { line, geo, mat, tr, pts };
    });

    rec.beam = { t: 0 };
    this.startAnim();

    return new Promise(resolve => {
      rec.beamDone = () => {
        setTimeout(() => {
          rec.beamGroup.clear();
          if (rec.beamLines) {
            for (const b of rec.beamLines) { b.geo.dispose(); b.mat.dispose(); }
            rec.beamLines = null;
          }
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

      for (const rec of this.stations) {
        if (rec.beam) {
          rec.beam.t += dt * 0.85;
          const t = rec.beam.t;

          if (rec.beamLines) {
            for (const b of rec.beamLines) {
              const head = Math.min(1, Math.max(0, (t - b.tr.delay) / 0.55));
              if (head <= 0) { b.mat.opacity = 0; continue; }
              b.mat.opacity = b.tr.kind === 'back' ? 1.0 : b.tr.kind === 'wide' ? 0.85 : 0.6;
              const span = 1 + head * (b.pts.length - 1);
              b.geo.setDrawRange(0, Math.max(2, Math.ceil(span)));
            }
          }
          // The impact spark, at the moment the returning track turns around.
          rec.spark.material.opacity = t > 0.35 && t < 1.1 ? 0.9 : 0;

          if (t >= 1.35) {
            const done = rec.beamDone;
            rec.beamDone = null;
            rec.beam.t = 1.35;
            if (done) done();
          } else {
            live = true;
          }
        }
      }

      let redraw = false;
      for (const sp of this.specimens) {
        if (!sp.pulled.length) continue;
        sp.pulled.forEach(p => { p.t += dt * 1.9; });
        sp.pulled = sp.pulled.filter(p => p.t < 1);
        live = true;
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
