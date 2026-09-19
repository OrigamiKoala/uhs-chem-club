/**
 * scope3d.js — The sampler scope, built as an instrument instead of drawn as one.
 *
 * This is `scope.js` in three dimensions, for Tallow at T4. It exposes the same
 * API, takes the same sample declarations, and runs the same layout and tool
 * maths — `buildUnits`, `detailFor`, `planSettle` and `planCut` are imported from
 * the canvas engine rather than reimplemented, so what the blade finds and where
 * the bands land can never differ between the two.
 *
 * What changes is only what the player's eye does. On canvas, the walk down
 * through scales is a 2D reveal in an aperture. Here, each sample sits in a real
 * recessed well in the bench top: at low power it is a solid puck of dust, and as
 * the dial comes up it breaks into grit, then into lumps, then into individual
 * pieces with visible sticks between the ones that are held together — and the
 * player can lean over the bench and look at a cluster from another side to see
 * that a chain is a chain and not a star.
 *
 * It knows no chemistry. A piece is a piece, and what any of it means is the
 * quest's business.
 */

import * as THREE from 'three';
import { buildUnits, detailFor, planSettle, planCut, TINTS } from './scope.js';
import { BenchViewer3D, TINT_HEX, AMBER } from './bench3d.js';
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

    this.samples = [];
    // Set before any stage runs: setSelected / setPlateTag can be called by a
    // quest before its first setSamples, and must not throw when they are.
    this.stations = [];
    this.power = 1;
    this.selectable = false;
    this.selected = null;
    this.probe = null;
    this.disposed = false;
    this.animating = false;

    this.viewer = new BenchViewer3D(document.body, { backdrop: opts.backdrop || 'awning' });
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

      // One instanced mesh per dust tint, so a station of 400 pieces is five
      // draw calls rather than four hundred.
      const piecesByTint = {};
      const geo = new THREE.SphereGeometry(1, 14, 10);
      for (const tint of Object.keys(TINT_HEX)) {
        const mat = new THREE.MeshStandardMaterial({
          color: TINT_HEX[tint].fill,
          roughness: 0.86,
          metalness: 0.08
        });
        // 3 members is the widest cluster the quests declare; the cap is generous.
        const mesh = new THREE.InstancedMesh(geo, mat, 1);
        mesh.count = 0;
        mesh.frustumCulled = false;
        station.content.add(mesh);
        piecesByTint[tint] = { mesh, geo, mat, capacity: 1 };
      }

      // The sticks that hold a cluster together, also instanced.
      const bondGeo = new THREE.CylinderGeometry(1, 1, 1, 7);
      const bondMat = new THREE.MeshStandardMaterial({
        color: 0x4a443d, roughness: 0.9, metalness: 0.2
      });
      const bonds = new THREE.InstancedMesh(bondGeo, bondMat, 1);
      bonds.count = 0;
      bonds.frustumCulled = false;
      station.content.add(bonds);

      // The dust puck shown at low power, and its mottling.
      const puckGeo = new THREE.CylinderGeometry(WELL_R * 0.98, WELL_R * 0.98, 0.012, 40);
      const puckMat = new THREE.MeshStandardMaterial({
        color: 0x8f8678, roughness: 0.96, metalness: 0.0
      });
      const puck = new THREE.Mesh(puckGeo, puckMat);
      puck.position.y = 0.006;
      puck.visible = false;
      station.content.add(puck);

      const mottleGeo = new THREE.SphereGeometry(1, 8, 6);
      const mottleMat = new THREE.MeshStandardMaterial({
        color: 0x8f8678, roughness: 0.98, metalness: 0.0
      });
      const mottle = new THREE.InstancedMesh(mottleGeo, mottleMat, 182);
      mottle.count = 0;
      mottle.frustumCulled = false;
      station.content.add(mottle);

      // The ring the instrument scratches around a piece it has just read.
      const ringGeo = new THREE.TorusGeometry(1, 0.1, 8, 22);
      const ringMat = new THREE.MeshBasicMaterial({ color: AMBER });
      const probeRing = new THREE.Mesh(ringGeo, ringMat);
      probeRing.rotation.x = -Math.PI / 2;
      probeRing.visible = false;
      station.content.add(probeRing);

      this.stations.push({
        sample, station, piecesByTint, bonds, bondGeo, bondMat,
        puck, puckGeo, puckMat, mottle, mottleGeo, mottleMat,
        probeRing, ringGeo, ringMat, pieceGeo: geo,
        hitMap: new Map()    // "tint:instanceId" -> {unitIndex, memberIndex}
      });
    });

    this.viewer.layoutStations();
    this.drawAll();
  }

  /** Grow an instanced mesh when a sample needs more instances than it holds. */
  ensureCapacity(rec, tint, needed) {
    const slot = rec.piecesByTint[tint];
    if (needed <= slot.capacity) return slot;
    const cap = Math.max(needed, Math.ceil(slot.capacity * 2));
    const mesh = new THREE.InstancedMesh(slot.geo, slot.mat, cap);
    mesh.count = 0;
    mesh.frustumCulled = false;
    rec.station.content.remove(slot.mesh);
    slot.mesh.dispose();
    slot.mesh = mesh;
    slot.capacity = cap;
    rec.station.content.add(mesh);
    return slot;
  }

  ensureBondCapacity(rec, needed) {
    if (needed <= rec.bonds.instanceMatrix.count) return;
    const cap = Math.max(needed, rec.bonds.instanceMatrix.count * 2);
    rec.station.content.remove(rec.bonds);
    rec.bonds.dispose();
    const mesh = new THREE.InstancedMesh(rec.bondGeo, rec.bondMat, cap);
    mesh.count = 0;
    mesh.frustumCulled = false;
    rec.bonds = mesh;
    rec.station.content.add(mesh);
  }

  /* ---------------- geometry, in the same terms the canvas uses ---------------- */

  geometry(sample) {
    // Higher power magnifies: the same pieces, larger, with the edge of the
    // field falling outside the well — exactly as it falls outside the aperture.
    const zoom = (1 + 0.34 * (this.power - 1)) * (sample.magnify || 1);
    return {
      spread: WELL_R * 0.94 * zoom,
      pieceR: WELL_R * 0.085 * zoom
    };
  }

  memberPos(g, unit, m) {
    const cos = Math.cos(unit.spin);
    const sin = Math.sin(unit.spin);
    const ox = m.ox * cos - m.oy * sin;
    const oy = m.ox * sin + m.oy * cos;
    return {
      x: unit.x * g.spread + ox * g.pieceR * 2,
      z: unit.y * g.spread + oy * g.pieceR * 2,
      r: g.pieceR * m.size * 2
    };
  }

  /* ---------------- drawing ---------------- */

  drawAll() {
    if (this.disposed) return;
    for (const rec of this.stations) this.draw(rec);
  }

  draw(rec) {
    const sample = rec.sample;
    const detail = detailFor(this.power, sample.floorPower);
    const g = this.geometry(sample);

    // Everything off first, then only what this detail level resolves is turned
    // back on. A level never leaves a fragment of the level before it behind.
    rec.puck.visible = false;
    rec.mottle.count = 0;
    rec.bonds.count = 0;
    rec.probeRing.visible = false;
    for (const tint of Object.keys(rec.piecesByTint)) rec.piecesByTint[tint].mesh.count = 0;
    rec.hitMap.clear();

    if (detail === 0) this.drawSolid(rec, 1);
    else if (detail === 1) this.drawSolid(rec, 7);
    else if (detail === 2) this.drawLumps(rec, g);
    else this.drawPieces(rec, g);
  }

  /** Detail 0 and 1: the sample as a solid, then as something merely mottled. */
  drawSolid(rec, blobs) {
    const sample = rec.sample;
    const rand = mulberry32(hashId(sample.id) ^ 0x9e37);
    const firstTint = this.kinds[sample.units[0]?.members[0]?.kindId]?.tint || 'pale';
    const base = TINT_HEX[firstTint] || TINT_HEX.pale;

    rec.puck.visible = true;
    rec.puckMat.color.setHex(base.fill);

    // At detail 0 the puck is all there is. At detail 1 the surface is mottled:
    // the sample has begun to admit it is made of something.
    const n = blobs === 1 ? 0 : 160;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const pos = new THREE.Vector3();

    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * WELL_R * 0.93;
      const size = (WELL_R / (blobs + 1)) * (0.14 + rand() * 0.3);
      pos.set(Math.cos(a) * rr, 0.012 + size * 0.3, Math.sin(a) * rr);
      scale.setScalar(size);
      m.compose(pos, q, scale);
      rec.mottle.setMatrixAt(i, m);
    }
    rec.mottleMat.color.setHex(base.rim);
    rec.mottle.count = n;
    rec.mottle.instanceMatrix.needsUpdate = true;
  }

  /** Detail 2: the units are there but merged — grit, not pieces. */
  drawLumps(rec, g) {
    const sample = rec.sample;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const pos = new THREE.Vector3();

    // A lump carries its unit's tint, so a two-material crate already looks
    // like two materials before the pieces resolve.
    const counts = {};
    for (const tint of Object.keys(rec.piecesByTint)) counts[tint] = 0;

    const needed = {};
    sample.units.forEach(u => {
      const tint = this.kinds[u.members[0].kindId]?.tint || 'pale';
      needed[tint] = (needed[tint] || 0) + 1;
    });
    for (const tint of Object.keys(needed)) this.ensureCapacity(rec, tint, needed[tint]);

    sample.units.forEach(unit => {
      const tint = this.kinds[unit.members[0].kindId]?.tint || 'pale';
      const slot = rec.piecesByTint[tint];
      if (!slot) return;
      const x = unit.x * g.spread;
      const z = unit.y * g.spread;
      if (Math.hypot(x, z) > WELL_R * 1.02) return;   // outside the field
      const r = g.pieceR * 1.9;
      pos.set(x, r * 0.72, z);
      scale.setScalar(r);
      m.compose(pos, q, scale);
      slot.mesh.setMatrixAt(counts[tint]++, m);
    });

    for (const tint of Object.keys(counts)) {
      const slot = rec.piecesByTint[tint];
      slot.mesh.count = counts[tint];
      slot.mesh.instanceMatrix.needsUpdate = true;
      slot.mat.color.setHex(TINT_HEX[tint].fill);
    }
  }

  /** Detail 3: individual pieces, and the sticks that hold groups together. */
  drawPieces(rec, g) {
    const sample = rec.sample;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const pos = new THREE.Vector3();

    const needed = {};
    let bondCount = 0;
    sample.units.forEach(u => {
      u.members.forEach(mem => {
        const tint = this.kinds[mem.kindId]?.tint || 'pale';
        needed[tint] = (needed[tint] || 0) + 1;
      });
      bondCount += u.bonds.length;
    });
    for (const tint of Object.keys(needed)) this.ensureCapacity(rec, tint, needed[tint]);
    this.ensureBondCapacity(rec, Math.max(bondCount, 1));

    const counts = {};
    for (const tint of Object.keys(rec.piecesByTint)) counts[tint] = 0;

    sample.units.forEach((unit, ui) => {
      unit.members.forEach((mem, mi) => {
        const p = this.memberPos(g, unit, mem);
        // The well clips the field the way the aperture does: what has been
        // magnified past the rim is simply not in view any more.
        if (Math.hypot(p.x, p.z) > WELL_R * 1.02) return;

        const tint = this.kinds[mem.kindId]?.tint || 'pale';
        const slot = rec.piecesByTint[tint];
        if (!slot) return;

        pos.set(p.x, p.r, p.z);
        scale.setScalar(p.r);
        m.compose(pos, q, scale);
        const id = counts[tint]++;
        slot.mesh.setMatrixAt(id, m);
        rec.hitMap.set(`${tint}:${id}`, { unitIndex: ui, memberIndex: mi });
      });
    });

    for (const tint of Object.keys(counts)) {
      const slot = rec.piecesByTint[tint];
      slot.mesh.count = counts[tint];
      slot.mesh.instanceMatrix.needsUpdate = true;
      slot.mat.color.setHex(TINT_HEX[tint].fill);
    }

    // Sticks. A stick is drawn between the two members it actually joins, taken
    // from the unit's own bond list — a cluster that is a chain looks like a
    // chain from every angle, which is the reason this bench is worth building.
    let bi = 0;
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const mid = new THREE.Vector3();
    sample.units.forEach(unit => {
      if (unit.members.length < 2) return;
      unit.bonds.forEach(([a, b]) => {
        const pa = this.memberPos(g, unit, unit.members[a]);
        const pb = this.memberPos(g, unit, unit.members[b]);
        if (Math.hypot(pa.x, pa.z) > WELL_R * 1.02 && Math.hypot(pb.x, pb.z) > WELL_R * 1.02) return;

        const ax = new THREE.Vector3(pa.x, pa.r, pa.z);
        const bx = new THREE.Vector3(pb.x, pb.r, pb.z);
        dir.subVectors(bx, ax);
        const len = dir.length();
        if (len < 1e-5) return;
        mid.addVectors(ax, bx).multiplyScalar(0.5);
        q.setFromUnitVectors(up, dir.clone().normalize());
        scale.set(g.pieceR * 0.21, len, g.pieceR * 0.21);
        m.compose(mid, q, scale);
        rec.bonds.setMatrixAt(bi++, m);
      });
    });
    rec.bonds.count = bi;
    rec.bonds.instanceMatrix.needsUpdate = true;
    q.identity();

    // The read ring, if this station is the one holding the probe.
    if (this.probe && this.probe.sampleId === sample.id) {
      const unit = sample.units[this.probe.unitIndex];
      const mem = unit?.members[this.probe.memberIndex];
      if (mem) {
        const p = this.memberPos(g, unit, mem);
        rec.probeRing.visible = true;
        rec.probeRing.position.set(p.x, p.r * 0.35, p.z);
        rec.probeRing.scale.setScalar(p.r * 1.5);
      }
    }
  }

  /* ---------------- interaction ---------------- */

  onPointer(e) {
    if (this.disposed) return;
    this.viewer.setPointer(e);

    // Which station was clicked at all — the tray, the well, or a piece in it.
    const station = this.viewer.stationUnderRay();
    let rec = station ? this.stations.find(s => s.station === station) : null;

    // A piece can stand proud of the tray, so pieces are tested on their own and
    // win over the tray behind them.
    let hit = null;
    for (const r of this.stations) {
      for (const tint of Object.keys(r.piecesByTint)) {
        const slot = r.piecesByTint[tint];
        if (!slot.mesh.count) continue;
        const res = this.viewer.raycaster.intersectObject(slot.mesh, false);
        if (res.length && (!hit || res[0].distance < hit.distance)) {
          const found = r.hitMap.get(`${tint}:${res[0].instanceId}`);
          if (found) hit = { rec: r, distance: res[0].distance, ...found };
        }
      }
    }
    if (hit) rec = hit.rec;
    if (!rec) return;

    const detail = detailFor(this.power, rec.sample.floorPower);

    if (hit && detail >= 3) {
      this.probe = { sampleId: rec.sample.id, unitIndex: hit.unitIndex, memberIndex: hit.memberIndex };
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

    // Tapping anywhere on a station is also how a station is chosen, whether or
    // not anything was resolved to read — the same rule the canvas plate uses.
    if (this.selectable && this.onSelect) this.onSelect(rec.sample.id);
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
