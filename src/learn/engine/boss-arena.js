/**
 * boss-arena.js — Manages 3D boss encounters in open arena areas.
 *
 * Places high-quality 3D bosses (CombatMonster3D) in open world spots,
 * manages first-person attack effects (CombatFpsFx), damage flashes,
 * hit reactions, counters, and dispersal.
 *
 * THE FIGHT IS SEEN. The player works a table stood in the arena between them and the boss
 * (`three/arena-table.js`), and the leaned-in view looks down at the plate, so every beat of the fight
 * that matters turns the head up at the boss for as long as it lasts (`bench-host.js` `requestGaze`):
 * the boss rising out of the ground, the volley that lands, the bolt that comes back, the roar between
 * phases, the collapse. Between beats the view is the table's. Reduced motion keeps the camera still.
 */

import * as THREE from 'three';
import { CombatMonster3D } from './combat-monster-3d.js';
import { CombatFpsFx, DamageEmitter, shadowTexture, sfx } from './combat-fps-fx.js';
import { BossHud } from './boss-hud.js';
import { requestGaze, setShakeSource, activeBenchViewer } from './bench-host.js';

/** What the boss is called on its health plate, and the colour of what it throws. */
const BOSS_LOOK = {
  'the hopper':        { name: 'The Hopper',        attack: 0xe59b24, ember: 0xff7a1f },
  'the lantern-eater': { name: 'The Lantern-Eater', attack: 0x7fd36a, ember: 0xb6ff5a },
  'basalt warden':     { name: 'The Basalt Warden', attack: 0xff4818, ember: 0xff5a1a },
  'the compressor':    { name: 'The Compressor',    attack: 0xdfe6e6, ember: 0xffa53a },
  'the crucible':      { name: 'The Crucible',      attack: 0xff6b2b, ember: 0xff9d3b },
  'the undertow':      { name: 'The Undertow',      attack: 0xd8ecf2, ember: 0xa9d4e0 },
  'recipe golem':      { name: 'The Recipe Golem',  attack: 0xe8e1d0, ember: 0xff8a2a }
};

/** Health is cosmetic: each phase takes an equal share, and the last takes the rest. */
const MAX_HP = 1000;

function reducedMotion() {
  try {
    if (localStorage.getItem('avalon_motion_pref') === 'true') return true;
  } catch { /* storage can be blocked */ }
  try {
    return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  } catch { return false; }
}

let _activeBossArena = null;

export function getActiveBossArena() {
  return _activeBossArena;
}

export function setActiveBossArena(arena) {
  _activeBossArena = arena;
}

/** Open positions for each boss battle with clear line of sight */
export const BOSS_ARENA_SPOTS = {
  'boss-hopper': {
    worldId: 'unit01',
    playerPos: [0, 1.6, 42.0],
    lookAtPos: [0, 1.6, 30.0],
    bossPos: [0, 0, 30.0],
    scale: 1.8,
    species: 'the hopper'
  },
  'boss-eater': {
    worldId: 'unit02',
    playerPos: [0, 1.6, 68.0],
    lookAtPos: [0, 1.6, 54.0],
    bossPos: [0, 2.6, 54.0],
    scale: 1.1,
    species: 'the lantern-eater',
    flies: true
  },
  'boss-warden': {
    worldId: 'unit03',
    playerPos: [0, 1.6, 14.0],
    lookAtPos: [0, 1.6, 2.0],
    bossPos: [0, 0, 2.0],
    scale: 1.0,
    species: 'basalt warden'
  },
  'boss-compressor': {
    worldId: 'unit04',
    playerPos: [0, 1.6, 34.0],
    lookAtPos: [0, 1.6, 20.0],
    bossPos: [0, 0, 20.0],
    scale: 1.5,
    species: 'the compressor'
  },
  // In front of the caldera main's expansion loop, with the rim and the cone behind it
  // (`world-data/ember.json` keeps this ground open; `verify:ember` holds the two together).
  'boss-crucible': {
    worldId: 'unit05',
    playerPos: [0, 1.6, -47],
    lookAtPos: [0, 1.6, -63],
    bossPos: [0, 0, -63],
    scale: 1.4,
    species: 'the crucible'
  },
  // On the east bank of the canal, with the frozen stretch to its west and the wall of ice behind it
  // (`world-data/mirrowen.json` keeps this ground open; `verify:mirrowen` holds the two together).
  'boss-undertow': {
    worldId: 'unit06',
    playerPos: [30, 1.6, -62],
    lookAtPos: [30, 1.6, -78],
    bossPos: [30, 0, -78],
    scale: 1.5,
    species: 'the undertow'
  },
  // On the open ground in front of the blast furnace (`world-data/kettle.json` keeps this ground open; `verify:kettle` holds the two together).
  'boss-golem': {
    worldId: 'unit07',
    playerPos: [0, 1.6, -44],
    lookAtPos: [0, 1.6, -60],
    bossPos: [0, 0, -60],
    scale: 2.2,
    species: 'recipe golem'
  }
};

export class BossArena {
  constructor(arg1, arg2 = null) {
    let scene, camera, species, bossPos, scale, flies;
    if (arg1 && (arg1.activeWorld || arg1.scene || arg1.camera)) {
      this.stage = arg1;
      scene = arg1.activeWorld?.scene || arg1.scene;
      camera = arg1.camera;
      species = arg2?.species;
      bossPos = arg2?.bossPos;
      scale = arg2?.scale ?? 2.2;
      flies = arg2?.flies;
    } else {
      this.stage = null;
      scene = arg1?.scene;
      camera = arg1?.camera;
      species = arg1?.species;
      bossPos = arg1?.bossPos;
      scale = arg1?.scale ?? 2.2;
      flies = arg1?.flies;
    }

    this.scene = scene;
    this.camera = camera;
    this.species = species || 'the hopper';
    this.look = BOSS_LOOK[this.species] || { name: this.species, attack: 0xe59b24, ember: 0xff7a1f };
    this.reduced = reducedMotion();
    this.disposed = false;
    this.wrongBusy = false;
    this.appliedShake = null;
    this.timers = [];
    this.queuedHit = null;     // what the foe's next strike does to the rig
    this.pending = 0;          // bolts of the current volley still in the air
    this.hp = MAX_HP;
    this.total = 5;
    this.phase = -1;
    this.defeated = false;
    this._eye = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this.idleActT = 9 + Math.random() * 5;   // seconds until it next makes a show of itself
    this.ambient = 0;                         // >0 while that show is on (its shake is a murmur)

    const x = bossPos ? bossPos[0] : 0;
    let y = bossPos ? bossPos[1] : 0;
    const z = bossPos ? bossPos[2] : 30;

    const world = this.stage?.activeWorld;
    const ground = (px, pz) => world?.getTerrainHeight?.(px, pz);
    const terrainH = ground(x, z);
    if (typeof terrainH === 'number' && !isNaN(terrainH)) {
      y = Math.max(y, terrainH);
    }

    this.monster = new CombatMonster3D(this.species, { id: 'boss' }, { x, y, z, scale });
    this.monster.setGround(ground);
    // A boss that walks stands ON the ground; one that flies hovers where it was put.
    if (!flies) this.monster.heightOffset = 0;
    this.monster.onEvent = (name, at) => this.onMonsterEvent(name, at);
    if (this.scene) this.scene.add(this.monster.group);

    // A soft dark pool under it: the sun's shadow map is only drawn at a few
    // hertz and not at all on weak devices, and a body with no shadow floats.
    if (this.scene) {
      this.shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({
          map: typeof document !== 'undefined' ? shadowTexture() : null,
          transparent: true, opacity: 0.6, depthWrite: false, fog: false,
          polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
        })
      );
      this.shadow.renderOrder = 2;
      this.shadow.scale.setScalar(this.monster.radius * 3.0);
      this.scene.add(this.shadow);
      this.emitter = new DamageEmitter(this.scene);
    }

    if (this.scene && this.camera) {
      this.fx = new CombatFpsFx(this.scene, this.camera, { reduced: this.reduced });
      // The table's view owns the camera while the player is leaned in, so the shake is handed to it.
      setShakeSource(() => this.fx?.getShakeOffsets() || null);
    }

    if (typeof document !== 'undefined') {
      this.vignette = document.createElement('div');
      this.vignette.className = 'fps-damage-vignette';
      document.body.appendChild(this.vignette);
      // The plate is scenery: if it cannot be drawn the fight still goes on.
      try {
        this.hud = new BossHud({ name: this.look.name, maxHp: MAX_HP, total: this.total });
        this.hud.setPhase(0, this.total);
      } catch (e) {
        console.error('boss plate failed:', e);
        this.hud = null;
      }
    }

    // It arrives. Reduced motion has it simply standing there.
    if (this.reduced) {
      this.monster.entrance = { kind: 'rise', t: 0, dur: 1, landed: true };
    } else {
      this.monster.startEntrance(flies ? 'drop' : 'rise', flies ? 1.8 : 2.2);
      this.hud?.showIntro();
      sfx('playEntry');
      // The view stays on the boss while it arrives, then comes down to the table.
      this.gaze(3.1, { inS: 0.2, outS: 0.9 });
    }
    this.monster.update(0, false, this.camera?.position || null);

    this.lastT = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.tick = (now) => {
      if (this.disposed) return;
      const dt = Math.min((now - this.lastT) / 1000, 0.1);
      this.lastT = now;
      this.frame(dt);
      if (typeof requestAnimationFrame !== 'undefined') {
        this.animId = requestAnimationFrame(this.tick);
      }
    };
    if (typeof requestAnimationFrame !== 'undefined') {
      this.animId = requestAnimationFrame(this.tick);
    }

    setActiveBossArena(this);
  }

  /* ------------------------------ clock ------------------------------ */

  after(sec, fn) {
    this.timers.push({ t: sec, fn });
  }

  frame(dt) {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t <= 0) {
        this.timers.splice(i, 1);
        try { tm.fn(); } catch (e) { console.error('boss arena timer failed:', e); }
      }
    }

    const eye = this.camera ? this.camera.position : null;
    this.monster?.update(dt, this.reduced, eye);
    this.fx?.update(dt);

    this.updateGround(dt);
    this.idleShow(dt);

    // While the player is leaned in, the table's view applies the shake itself (it rewrites the camera every frame).
    const viewer = activeBenchViewer();
    const viewOwns = Boolean(viewer?.leaning && viewer.world?.arena);
    if (this.camera && !viewOwns) {
      if (this.appliedShake) {
        this.camera.rotation.z -= this.appliedShake.roll;
        this.camera.position.x -= this.appliedShake.posX;
        this.camera.position.y -= this.appliedShake.posY;
        this.appliedShake = null;
      }
      const shake = this.fx?.getShakeOffsets();
      if (shake) {
        this.camera.rotation.z += shake.roll;
        this.camera.position.x += shake.posX;
        this.camera.position.y += shake.posY;
        this.appliedShake = shake;
      }
    }
  }

  /** Its shadow, the smoke off its wounds. */
  updateGround(dt) {
    const m = this.monster;
    if (!m) return;
    if (this.shadow) {
      const gone = m.isGone || m.debris;
      const p = m.group.position;
      const ground = m.groundAt(p.x, p.z);
      const up = Math.max(0, p.y - ground);
      const rise = m.entrance && !m.entrance.landed && m.entrance.kind === 'rise' ? Math.max(0, 1 - m.entrance.t / m.entrance.dur) : 0;
      this.shadow.visible = !gone;
      this.shadow.position.set(p.x, ground + 0.05, p.z);
      this.shadow.scale.setScalar(m.radius * 3.0 * (1 + Math.min(up, 8) * 0.04));
      this.shadow.material.opacity = 0.62 * Math.max(0, 1 - up / 11) * (1 - rise * 0.8);
    }
    if (this.emitter) {
      const level = m.debris ? 0 : m.damage;
      if (level > 0.02) this.emitter.update(dt, m.getWorldBox(this._box ||= new THREE.Box3()), level, this.look.ember);
    }
  }

  /* ----------------------------- the view ----------------------------- */

  /** Turn the leaned-in view up at the boss for `hold` seconds. Reduced motion never moves the camera. */
  gaze(hold, { inS = 0.35, outS = 0.6 } = {}) {
    if (this.reduced || this.disposed) return;
    requestGaze({
      point: out => {
        if (!this.monster || this.monster.isGone) return null;
        this.monster.getCenterWorld(out);
        out.y += this.monster.height * 0.12;
        return out;
      },
      hold, inS, outS
    });
  }

  /**
   * Between the player's moves it is not still: now and then it rears and roars (a murmur of shake, no bolt,
   * no cost). Nothing that is not a committed miss ever fires at the player.
   */
  idleShow(dt) {
    if (this.ambient > 0) this.ambient = Math.max(0, this.ambient - dt);
    if (this.reduced || this.defeated || !this.monster) return;
    const m = this.monster;
    if (m.entrance && !m.entrance.landed) return;
    if (m.windup || m.roarT > 0 || m.lungeT > 0 || this.pending > 0 || this.wrongBusy) return;
    this.idleActT -= dt;
    if (this.idleActT > 0) return;
    this.idleActT = 13 + Math.random() * 9;
    this.ambient = 1.4;
    m.triggerRoar();
  }

  /* ------------------------- what the boss does ------------------------- */

  onMonsterEvent(name, at) {
    const m = this.monster;
    if (!m || !this.fx) return;
    const ground = () => new THREE.Vector3(m.group.position.x, m.groundAt(m.group.position.x, m.group.position.z), m.group.position.z);
    if (name === 'landed') {
      this.fx.dustBurst(ground(), { radius: m.radius * 1.5, count: 16 });
      this.fx.shockwave(ground(), { radius: m.radius * 3.2 });
      this.fx.addTrauma(0.65);
      sfx('playTouchdown');
    } else if (name === 'roar') {
      this.fx.dustBurst(ground(), { radius: m.radius * 1.2, count: 10 });
      this.fx.shockwave(ground(), { radius: m.radius * 2.4, life: 0.8 });
      this.fx.addTrauma(this.ambient > 0 ? 0.18 : 0.4);
      sfx('playEntry');
    } else if (name === 'slam') {
      this.fx.dustBurst(ground(), { radius: m.radius * 1.1, count: 8 });
    } else if (name === 'strike') {
      const hit = this.queuedHit;
      this.queuedHit = null;
      const from = this.mouthPoint();
      this.fx.fireFoeBolt(from, this.look.attack, () => this.playerHit(hit));
    } else if (name === 'plate' && at) {
      // A piece of its armour struck off by the wound that just landed.
      this.fx.sparks(at, { count: 18, speed: 6, color: this.look.ember, size: 0.14, life: 0.6 });
      this.fx.dustBurst(at, { radius: 1.2, count: 5, rise: 1.2 });
      this.fx.addTrauma(0.12);
    } else if (name === 'shattered') {
      this.fx.dustBurst(ground(), { radius: m.radius * 2.0, count: 22, rise: 2.4 });
    }
  }

  /** Where it charges and fires from: the side of its body that faces the player. */
  mouthPoint(out = new THREE.Vector3()) {
    const m = this.monster;
    // A body with a muzzle (a maw, a spout, a fist) fires from it.
    if (m.muzzle) {
      m.group.updateMatrixWorld(true);
      return m.muzzle.getWorldPosition(out);
    }
    if (this.camera) this.camera.getWorldPosition(this._eye);
    m.getSurfacePoint(this._eye, out);
    out.y += m.height * 0.12;
    return out;
  }

  /* --------------------------- the fight itself --------------------------- */

  /**
   * A phase of the fight began. Health follows how many phases are behind the
   * player, so resuming at phase 3 finds the boss already hurt. It only ever
   * goes DOWN: walking back to an earlier phase does not heal it.
   */
  setPhase(index, total, rig = null) {
    if (this.disposed || this.defeated || !this.monster) return;
    const first = this.phase < 0;
    this.total = total;
    this.hud?.setPhase(index, total);
    if (rig) this.hud?.setRig(rig.integrity, rig.max);

    const expected = Math.round(MAX_HP * (total - index) / total);
    if (first) {
      this.hp = expected;
      this.hud?.setHp(expected, { snap: true });
      this.monster.setDamage(1 - expected / MAX_HP, true);
    } else {
      if (expected < this.hp && this.pending === 0) {
        this.hp = expected;
        this.hud?.setHp(expected);
        this.monster.setDamage(1 - expected / MAX_HP);
      }
      if (index > this.phase && !this.reduced) {
        // The next phase: it rears up and closes in, and the view goes up to watch it.
        this.after(0.3, () => { if (!this.defeated) this.monster?.triggerRoar(); });
        this.gaze(1.7);
      }
    }
    this.phase = Math.max(this.phase, index);
  }

  /**
   * The phase was solved: the player's volley hits the boss. The last phase takes
   * the last of its health and the boss comes apart; any other leaves it standing,
   * hurt and angrier.
   */
  onCorrect({ index = 0, total = this.total, last = false } = {}) {
    if (this.disposed || this.defeated || !this.monster || this.pending > 0) return;
    const target = last ? 0 : Math.round(MAX_HP * (total - index - 1) / total);
    const dmg = Math.max(0, this.hp - target);
    const n = last ? 4 : 3;
    this.pending = n;

    const strike = (i, point) => {
      const final = i === n - 1;
      const part = final ? Math.max(0, this.hp - target) : Math.min(Math.round(dmg / n), Math.max(0, this.hp - target));
      this.hp = Math.max(target, this.hp - part);
      this.hud?.setHp(this.hp);
      this.hud?.hit();
      this.monster.setDamage(1 - this.hp / MAX_HP);
      this.monster.triggerHitReact(final ? 1 : 0.4);
      if (this.fx && point) {
        this.fx.hitBurst(point, { scale: final ? 1.5 : 1 });
        if (part > 0) {
          const at = point.clone();
          at.y += this.monster.height * 0.18;
          at.x += (i - 1) * 0.5;
          this.fx.damageNumber(at, `-${part}`, { big: final, color: final ? '#ffb347' : '#ffe7b0' });
        }
        if (final) this.fx.addTrauma(last ? 0.5 : 0.35);
      }
      this.pending--;
      if (final && last) this.beginDefeat();
    };

    if (this.fx) {
      const interval = last ? 0.2 : 0.17;
      // The head comes up first, so the bolts leave a view that already has the boss in it; then they fly.
      const turn = this.reduced ? 0 : 0.34;
      this.gaze(turn + n * interval + (last ? 3.2 : 1.7), last ? { outS: 1.0 } : {});
      this.after(turn, () => {
        if (this.disposed || !this.fx || !this.monster) return;
        this.fx.fireVolley(
          () => {
            if (this.camera) this.camera.getWorldPosition(this._eye);
            return { point: this.monster.getSurfacePoint(this._eye) };
          },
          { count: n, interval, scale: last ? 1.15 : 1, onHit: strike }
        );
      });
    } else {
      for (let i = 0; i < n; i++) this.after(i * 0.15, () => strike(i, null));
    }
  }

  /** The boss convulses under a run of blasts, then comes apart into pieces. */
  beginDefeat() {
    if (this.defeated || !this.monster) return;
    this.defeated = true;
    this.queuedHit = null;
    this.hud?.defeat();
    this.gaze(4.6, { outS: 1.2 });
    this.monster.triggerDeathThroes();
    sfx('playDropout');

    const m = this.monster;
    const dur = this.reduced ? 0.4 : 1.8;
    const blasts = this.reduced ? 2 : 7;
    for (let i = 0; i < blasts; i++) {
      this.after((i / blasts) * dur, () => {
        if (!this.fx || !this.monster) return;
        const c = m.getCenterWorld(new THREE.Vector3());
        c.x += (Math.random() - 0.5) * m.radius * 1.5;
        c.z += (Math.random() - 0.5) * m.radius * 1.5;
        c.y += (Math.random() - 0.35) * m.height * 0.6;
        this.fx.explosion(c, { scale: 0.7 + Math.random() * 0.6, color: this.look.ember });
      });
    }
    this.after(dur, () => {
      if (!this.monster) return;
      const c = m.getCenterWorld(new THREE.Vector3());
      this.fx?.explosion(c, { scale: 2.4, color: 0xffd08a });
      this.fx?.shockwave(new THREE.Vector3(c.x, m.groundAt(c.x, c.z), c.z), { radius: m.radius * 5, life: 0.9 });
      this.fx?.addTrauma(0.9);
      m.shatter();
    });
  }

  /**
   * A miss: it winds up (crouching, glowing, a ring collapsing onto an orb),
   * then fires a slow bolt at the player. `rig` is what the miss costs.
   */
  onWrong(rig = null) {
    if (this.disposed || !this.monster || this.defeated || this.wrongBusy) return;
    if (this.monster.entrance && !this.monster.entrance.landed) {
      // Still arriving: it answers the moment it has landed.
      this.after(0.6, () => this.onWrong(rig));
      return;
    }
    this.wrongBusy = true;
    this.after(0.35, () => { this.wrongBusy = false; });
    if (this.monster.windup) {
      this.queuedHit = rig;      // already winding up: this miss rides the same strike
      return;
    }
    this.queuedHit = rig;
    const wind = this.reduced ? 0.2 : 0.55;
    // The view goes up as it winds up and stays for the bolt's flight and the blow.
    this.gaze(wind + 1.5);
    this.monster.triggerTelegraph(wind);
    this.fx?.chargeOrb(() => this.mouthPoint(), wind, this.look.attack);
  }

  /** The bolt reached the player. */
  playerHit(rig) {
    if (this.disposed) return;
    const heavy = Boolean(rig?.knockedBack);
    this.fx?.addTrauma(heavy ? 1 : 0.75);
    if (this.fx && this.camera) {
      const at = this.camera.getWorldPosition(new THREE.Vector3());
      const q = this.camera.getWorldQuaternion(new THREE.Quaternion());
      at.addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(q), 1.4);
      this.fx.sparks(at, { count: 22, speed: 5, color: this.look.attack, size: 0.12, life: 0.5 });
    }
    if (this.vignette) {
      this.vignette.classList.toggle('heavy', heavy);
      this.vignette.classList.add('visible');
      this.after(heavy ? 0.9 : 0.4, () => this.vignette?.classList.remove('visible'));
    }
    if (rig) {
      this.hud?.setRig(heavy ? 0 : rig.integrity, rig.max, { hit: true });
      if (heavy) {
        this.after(1.0, () => this.hud?.setRig(rig.max, rig.max));
        if (!this.reduced) this.after(0.4, () => { if (!this.defeated) this.monster?.triggerRoar(); });
      }
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (_activeBossArena === this) {
      setActiveBossArena(null);
    }
    requestGaze(null);
    setShakeSource(null);
    if (this.camera && this.appliedShake) {
      this.camera.rotation.z -= this.appliedShake.roll;
      this.camera.position.x -= this.appliedShake.posX;
      this.camera.position.y -= this.appliedShake.posY;
      this.appliedShake = null;
    }
    if (this.animId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animId);
    }
    this.timers = [];
    if (this.monster) {
      this.scene?.remove(this.monster.group);
      this.monster.dispose();
      this.monster = null;
    }
    if (this.shadow) {
      this.scene?.remove(this.shadow);
      this.shadow.geometry.dispose();
      this.shadow.material.dispose();
      this.shadow = null;
    }
    if (this.emitter) {
      this.emitter.dispose();
      this.emitter = null;
    }
    if (this.fx) {
      this.fx.dispose();
      this.fx = null;
    }
    if (this.vignette) {
      this.vignette.remove();
      this.vignette = null;
    }
    if (this.hud) {
      this.hud.dispose();
      this.hud = null;
    }
  }
}
