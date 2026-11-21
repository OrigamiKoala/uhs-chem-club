/**
 * director.js — a quest's opening scene, played in the world with the player's controls off (like the voyage).
 *
 * The scene is a list of steps from the world's intro data (`src/npc/intros/<world>.js`), so each world can open
 * its benches its own way: a crew member walks up and leads the player over, a cloaked figure is seen and
 * followed until it slips away, something goes wrong in front of the player, two of the crew are found arguing,
 * a trail is followed. Whatever the steps, the last line put to the player is the quest's question
 * (`quest-story.js` `mystery`), and the scene always ends the same way: a fade, the player back at the bench,
 * and the bench opening.
 *
 * Steps (`do`):
 *   place  { who, at }                put an actor at a named point
 *   look   { at, dur }                turn the view to a point or an actor
 *   go     { who, to, speed, wait }   walk an actor, or 'cam' (the player), along the walk grid
 *   follow { who, to, speed }         an actor leads and the player walks behind
 *   say    { who, lines | ask }       a line card (`ui/npc-card.js`); `ask: true` says the quest's question
 *   start  {}                         the problem begins now (until then the quest's symptom is held off)
 *   wait   { s }
 *   vanish { who }                    the cloaked figure slips off to its exit and is gone
 * Points: 'view' (where the player ends up), 'spot' (the problem), 'stand'/'stand2' (beside it), 'meet' (where
 * someone walking up starts), 'exit' (where a figure goes), 'trail' (the start of a trail), 'near' (in front of
 * the player), 'player'. Actors: 'npc:<crew id>', 'cloak'. Speakers also 'voice:<crew id>' (calling from out of
 * sight) and 'vess'.
 *
 * Esc (or the Skip key) ends it at once. Nothing here pays XP or gates anything.
 */
import * as THREE from 'three';
import { openLineCard, closeLineCard, advanceLineCard, isLineCardOpen } from '../../ui/npc-card.js';
import { introFor } from '../../npc/intros.js';
import { mysteryFor } from '../../story/quest-story.js';
import { noteIntro } from '../../story/intro-shown.js';

const EYE = 1.6;
const WALK = 1.25;
const FOLLOW_GAP = 1.9;

const CSS = `
#intro-bars { position: fixed; inset: 0; pointer-events: none; z-index: 1000; }
#intro-bars[hidden] { display: none; }
#intro-bars .bar { position: absolute; left: 0; right: 0; height: 9vh; background: #000; transition: transform 0.6s ease; }
#intro-bars .bar.top { top: 0; transform: translateY(-100%); }
#intro-bars .bar.bottom { bottom: 0; transform: translateY(100%); }
#intro-bars.on .bar { transform: none; }
#intro-bars .skip { position: absolute; right: 16px; bottom: calc(9vh - 34px); pointer-events: auto; background: none; border: 1px solid rgba(214,196,168,0.25);
  color: var(--text-muted, #9a958c); font-family: var(--font-mono, monospace); font-size: 0.66rem; letter-spacing: 0.1em; padding: 4px 10px; cursor: pointer; }
body.intro-playing .touch-controls { display: none; }
#intro-fade { position: fixed; inset: 0; background: #000; opacity: 0; pointer-events: none; z-index: 1002; transition: opacity 0.45s ease; }
`;

let dom = null;
function ensureDom() {
  if (dom || typeof document === 'undefined') return dom;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const bars = document.createElement('div');
  bars.id = 'intro-bars';
  bars.hidden = true;
  bars.innerHTML = '<div class="bar top"></div><div class="bar bottom"></div><button type="button" class="skip">SKIP</button>';
  const fade = document.createElement('div');
  fade.id = 'intro-fade';
  document.body.append(bars, fade);
  dom = { bars, fade, skip: bars.querySelector('.skip') };
  return dom;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

export class Director {
  constructor(stage) {
    this.stage = stage;
    this.active = false;
    this.tickers = [];
    this.t = 0;
    this._look = new THREE.Vector3();
    this._lookWant = new THREE.Vector3();
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
  }

  /** True when this quest opens on a scene in this world right now. */
  canPlay(world, worldId, questId) {
    const intro = introFor(worldId, questId);
    if (!intro?.steps?.length || !world?.mystery || !world.crew?.sim || !world.crew.grid?.ready) return false;
    if (!world.mystery.spotFor(questId)) return false;
    // Every crew member the scene uses must be loaded and drawable.
    for (const s of intro.steps) {
      const who = String(s.who || '');
      if (!who.startsWith('npc:')) continue;
      const id = who.slice(4);
      if (!world.crew.sim.member(id) || !world.crew.bodies.get(id)?.ready) return false;
    }
    return true;
  }

  /** Play the scene. Resolves once the player is back at the bench. */
  async play(world, site, worldId, questId) {
    const intro = introFor(worldId, questId);
    const d = ensureDom();
    this.world = world;
    this.site = world.mystery;
    this.crew = world.crew;
    this.spot = this.site.spotFor(questId);
    this.questId = questId;
    this.siteDef = site;
    this.ask = mysteryFor(`${worldId}/${questId}`);
    this.skipping = false;
    this.ending = false;
    this.actors = new Map();
    this.active = true;
    const cam = this.stage.camera;
    this.camPos = cam.position.clone();
    cam.getWorldDirection(this._look);
    this._look.multiplyScalar(4).add(cam.position);
    this._lookWant.copy(this._look);
    this.lookRate = 2.2;
    // The problem is held off until a `start` step, if the scene has one; otherwise it shows from the first frame.
    this.site.hold(questId, intro.steps.some(s => s.do === 'start') ? 'off' : 'on');

    const keys = e => {
      if (e.code === 'Escape') { e.preventDefault(); this.skip(); return; }
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
        if (isLineCardOpen()) { e.preventDefault(); e.stopPropagation(); advanceLineCard(); }
      }
    };
    window.addEventListener('keydown', keys, true);
    const onSkip = () => this.skip();
    d?.skip.addEventListener('click', onSkip);
    if (d) { d.bars.hidden = false; requestAnimationFrame(() => d.bars.classList.add('on')); }
    document.body.classList.add('intro-playing');

    try {
      this.trace = [];
      for (const step of intro.steps) {
        if (this.skipping) break;
        this.trace.push(`${this.t.toFixed(1)} ${step.do} ${step.who || step.at || ''}`);
        await this.run(step);
      }
      // A scene whose steps never asked the question asks it last, as Vess.
      if (!this.skipping && !intro.steps.some(s => s.ask)) await this.run({ do: 'say', who: 'vess', ask: true });
    } catch (err) {
      console.error('Opening scene failed:', err);
    }

    noteIntro(`${worldId}/${questId}`);
    this.ending = true;
    // Anything still moving (a walk that was not waited on) stops here, so it never carries into the next scene.
    for (const t of this.tickers) t.resolve();
    this.tickers = [];
    closeLineCard();
    if (d) d.fade.style.opacity = '1';
    await sleep(480);
    this.restore();
    window.removeEventListener('keydown', keys, true);
    d?.skip.removeEventListener('click', onSkip);
    if (d) { d.bars.classList.remove('on'); d.bars.hidden = true; }
    document.body.classList.remove('intro-playing');
    this.active = false;
    setTimeout(() => { if (d) d.fade.style.opacity = '0'; }, 120);
  }

  skip() {
    if (!this.active || this.skipping) return;
    this.skipping = true;
    closeLineCard();
    for (const t of this.tickers) t.resolve();
    this.tickers = [];
  }

  /** Put everyone back: the crew to their schedules, the figure under the ground, the player at the bench. */
  restore() {
    for (const [who, a] of this.actors) {
      if (a.kind === 'npc') {
        const m = a.m;
        m.scripted = false;
        m.talking = false;
        m.state = 'act';
        m.act = 'idle';
        m.timer = 2;
        m.path = null;
        m.speed = 0;
      } else if (a.kind === 'cloak') a.c.park();
      void who;
    }
    this.site.hold(null);
    const s = this.siteDef;
    const p = s.approachPos || s.pos;
    const y = this.world.getTerrainHeight(p[0], p[2]) + (this.stage.fpsControls?.eyeHeight || EYE);
    const cam = this.stage.camera;
    cam.position.set(p[0], y, p[2]);
    cam.lookAt(s.pos[0], y - 0.4, s.pos[2]);
    cam.updateMatrixWorld(true);
    this.stage.fpsControls?.syncFromCamera?.();
  }

  /* ---------------- points and actors ---------------- */

  actor(who) {
    if (this.actors.has(who)) return this.actors.get(who);
    let a = null;
    if (who.startsWith('npc:')) {
      const m = this.crew.sim.member(who.slice(4));
      if (m) {
        m.scripted = true;
        m.path = null;
        a = { kind: 'npc', m, name: m.def.name, role: m.def.role };
      }
    } else if (who === 'cloak' && this.site.cloak) {
      a = { kind: 'cloak', c: this.site.cloak };
    }
    if (a) this.actors.set(who, a);
    return a;
  }

  xzOf(a) { return a.kind === 'npc' ? [a.m.x, a.m.z] : [a.c.x, a.c.z]; }

  setXZ(a, x, z, yaw) {
    if (a.kind === 'npc') { a.m.x = x; a.m.z = z; if (yaw !== undefined) a.m.yaw = yaw; }
    else a.c.place(this.world, x, z, yaw);
  }

  /** A named point as [x, z]. */
  point(name) {
    if (Array.isArray(name)) return name;
    const sp = this.spot;
    if (name === 'player' || name === 'cam') return [this.camPos.x, this.camPos.z];
    if (name === 'spot') return sp.pos;
    if (name === 'trail') return sp.trail?.length ? sp.trail[Math.min(2, sp.trail.length - 1)] : sp.view;
    if (Array.isArray(sp[name]) && typeof sp[name][0] === 'number') return sp[name];
    if (name === 'near') return this.nearPlayer();
    const a = this.actors.get(name);
    if (a) return this.xzOf(a);
    return sp.view;
  }

  /** A clear cell 1.6 m in front of the player, for someone walking up to them. */
  nearPlayer() {
    const cam = this.stage.camera;
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const g = this.crew.grid;
    for (const r of [1.6, 2.0, 1.3, 2.4]) {
      for (const a of [0, 0.4, -0.4, 0.8, -0.8]) {
        const x = this.camPos.x + (dir.x * Math.cos(a) - dir.z * Math.sin(a)) * r;
        const z = this.camPos.z + (dir.z * Math.cos(a) + dir.x * Math.sin(a)) * r;
        if (!g.blockedAt(x, z)) return [x, z];
      }
    }
    return [this.camPos.x + dir.x * 1.6, this.camPos.z + dir.z * 1.6];
  }

  /** A point to look at, in 3D: the problem's focus, a person's head, or eye height over ground. */
  point3(name) {
    if (name === 'spot') {
      const f = this.site.focusOf(this.questId);
      if (f) return f;
    }
    if (name === 'trail') {
      const [x, z] = this.point('trail');
      return new THREE.Vector3(x, this.world.getTerrainHeight(x, z), z);
    }
    const a = this.actors.get(name);
    const [x, z] = this.point(name);
    const h = a ? (a.kind === 'npc' ? 1.55 : 1.5) : EYE - 0.2;
    return new THREE.Vector3(x, this.world.getTerrainHeight(x, z) + h, z);
  }

  pathFor(from, to) {
    const p = this.crew.grid.path(from, to);
    return p && p.length >= 2 ? p : [from, to];
  }

  /* ---------------- the frame ---------------- */

  /** Run `fn(dt)` each frame until it returns true (or the scene is skipped). */
  tick(fn) {
    return new Promise(resolve => {
      if (this.skipping) { resolve(); return; }
      this.tickers.push({ fn, resolve });
    });
  }

  update(delta) {
    if (!this.active) return;
    const dt = Math.min(delta, 0.1);
    this.t += dt;
    this.tickers = this.tickers.filter(t => {
      if (t.fn(dt)) { t.resolve(); return false; }
      return true;
    });
    for (const a of this.actors.values()) if (a.kind === 'cloak') a.c.sway(this.t, a.moving);
    // The view: at the walker's eye, turning smoothly to what it is told to look at.
    const cam = this.stage.camera;
    const y = this.world.getTerrainHeight(this.camPos.x, this.camPos.z) + (this.stage.fpsControls?.eyeHeight || EYE);
    this.camPos.y += (y - this.camPos.y) * Math.min(1, dt * 6);
    cam.position.copy(this.camPos);
    this._look.lerp(this._lookWant, Math.min(1, dt * this.lookRate));
    this._m.lookAt(cam.position, this._look, cam.up);
    this._q.setFromRotationMatrix(this._m);
    cam.quaternion.slerp(this._q, Math.min(1, dt * 8));
    cam.updateMatrixWorld(true);
  }

  /* ---------------- steps ---------------- */

  async run(step) {
    switch (step.do) {
      case 'place': {
        const a = this.actor(step.who);
        if (!a) return;
        // Someone walking up comes from wherever they are, when that is within a short walk; otherwise from 'meet'.
        if (step.at === 'meet' && a.kind === 'npc') {
          const p = this.crew.grid.path([a.m.x, a.m.z], this.nearPlayer());
          if (p && length(p) <= 30 && length(p) >= 3) { a.m.state = 'act'; a.m.act = 'idle'; a.m.speed = 0; return; }
        }
        const [x, z] = this.point(step.at);
        const face = step.face ? this.point(step.face) : [this.camPos.x, this.camPos.z];
        this.setXZ(a, x, z, Math.atan2(face[0] - x, face[1] - z));
        if (a.kind === 'npc') { a.m.state = 'act'; a.m.act = 'idle'; a.m.speed = 0; }
        return;
      }
      case 'look': {
        // `rate`: how fast the view turns; a snap is a sudden turn to something that has just happened.
        this.lookRate = step.rate ?? 2.2;
        this._lookWant.copy(this.point3(step.at));
        let left = step.dur ?? 1.4;
        await this.tick(dt => (left -= dt) <= 0);
        return;
      }
      case 'wait': {
        let left = step.s ?? 1;
        await this.tick(dt => (left -= dt) <= 0);
        return;
      }
      case 'start':
        this.site.hold(this.questId, 'on');
        return;
      case 'go': {
        const speed = step.speed ?? WALK;
        this.lookRate = 2.2;
        if (step.who === 'cam') {
          const path = this.pathFor([this.camPos.x, this.camPos.z], this.point(step.to));
          // A long way is walked briskly: no walk in a scene takes much over 14 s.
          const fast = Math.max(speed, Math.min(2.6, length(path) / 14));
          const lookAt = step.lookAt || null;
          const p = this.walker(path, fast, (x, z, ahead) => {
            this.camPos.x = x; this.camPos.z = z;
            this._lookWant.copy(lookAt ? this.point3(lookAt) : new THREE.Vector3(ahead[0], this.camPos.y - 0.15, ahead[1]));
          });
          if (step.wait !== false) await p;
          return;
        }
        const a = this.actor(step.who);
        if (!a) return;
        const path = this.pathFor(this.xzOf(a), this.point(step.to));
        const p = this.walkActor(a, path, speed, step.face);
        if (step.wait !== false) await p;
        return;
      }
      case 'follow': {
        const a = this.actor(step.who);
        if (!a) return;
        const path = this.pathFor(this.xzOf(a), this.point(step.to));
        const lens = cumulative(path);
        let s = 0;
        const total = lens[lens.length - 1];
        const speed = Math.max(step.speed ?? WALK, Math.min(1.9, total / 14));
        await this.tick(dt => {
          s = Math.min(total, s + speed * dt);
          const [x, z, yaw] = along(path, lens, s);
          this.moveActor(a, x, z, yaw, speed);
          // The player walks a step and a half behind, on the same ground.
          const [cx, cz] = along(path, lens, Math.max(0, s - FOLLOW_GAP));
          const k = Math.min(1, dt * 3);
          this.camPos.x += (cx - this.camPos.x) * k;
          this.camPos.z += (cz - this.camPos.z) * k;
          this._lookWant.copy(this.point3(step.who)).add(new THREE.Vector3(0, -0.2, 0));
          if (s >= total) { this.stopActor(a); return true; }
          return false;
        });
        // Arrived: the player steps to the viewing point beside them.
        const view = this.point('view');
        await this.tick(dt => {
          const k = Math.min(1, dt * 2.5);
          this.camPos.x += (view[0] - this.camPos.x) * k;
          this.camPos.z += (view[1] - this.camPos.z) * k;
          return Math.hypot(view[0] - this.camPos.x, view[1] - this.camPos.z) < 0.08;
        });
        return;
      }
      case 'say': {
        const who = step.who || 'vess';
        const a = who.startsWith('npc:') ? this.actor(who) : null;
        // A voice: one of the crew calling from out of sight, who is not moved by the scene.
        const voice = who.startsWith('voice:') ? this.crew.sim.member(who.slice(6))?.def : null;
        const name = a ? a.name : voice ? voice.name : who === 'vess' ? 'Vess' : step.name || '';
        const role = a ? a.role : voice ? voice.role : who === 'vess' ? 'On the wrist link' : step.role || '';
        const lines = step.ask ? [...(step.lines || []), ...splitSentences(this.ask)] : step.lines || [];
        if (!lines.length) return;
        if (a?.kind === 'npc') a.m.talking = true;
        const turning = a?.kind === 'npc' ? this.tick(() => {
          const m = a.m;
          const want = Math.atan2(this.camPos.x - m.x, this.camPos.z - m.z);
          m.yaw = wrap(m.yaw + wrap(want - m.yaw) * 0.15);
          return !a.m.talking;
        }) : null;
        if (step.look !== false && a) { this.lookRate = 2.2; this._lookWant.copy(this.point3(who)); }
        await new Promise(resolve => {
          if (this.skipping) { resolve(); return; }
          openLineCard({ name, role, lines, onClose: resolve });
        });
        if (a?.kind === 'npc') a.m.talking = false;
        await turning;
        return;
      }
      case 'vanish': {
        const a = this.actor(step.who || 'cloak');
        if (!a) return;
        // It only has to get out of sight: the first 9 m of its way out.
        const path = clip(this.pathFor(this.xzOf(a), this.point('exit')), 9);
        await this.walkActor(a, path, step.speed ?? 2.4);
        if (a.kind === 'cloak') a.c.park();
        return;
      }
      default:
        return;
    }
  }

  walker(path, speed, onStep) {
    const lens = cumulative(path);
    const total = lens[lens.length - 1];
    let s = 0;
    return this.tick(dt => {
      s = Math.min(total, s + speed * dt);
      const [x, z] = along(path, lens, s);
      const ahead = along(path, lens, Math.min(total, s + 3));
      onStep(x, z, [ahead[0] + (ahead[0] - x) * 0.01, ahead[1] + (ahead[1] - z) * 0.01]);
      return s >= total;
    });
  }

  walkActor(a, path, speed, face) {
    const lens = cumulative(path);
    const total = lens[lens.length - 1];
    let s = 0;
    a.moving = true;
    return this.tick(dt => {
      s = Math.min(total, s + speed * dt);
      const [x, z, yaw] = along(path, lens, s);
      this.moveActor(a, x, z, yaw, speed);
      if (s >= total) {
        this.stopActor(a);
        if (face) {
          const f = this.point(face);
          const y = Math.atan2(f[0] - x, f[1] - z);
          this.setXZ(a, x, z, y);
        }
        return true;
      }
      return false;
    });
  }

  moveActor(a, x, z, yaw, speed) {
    a.moving = true;
    if (a.kind === 'npc') {
      const m = a.m;
      m.x = x; m.z = z;
      m.yaw = wrap(m.yaw + wrap(yaw - m.yaw) * 0.2);
      m.state = 'walk';
      m.speed = speed;
    } else a.c.place(this.world, x, z, wrap(a.c.yaw + wrap(yaw - a.c.yaw) * 0.2));
  }

  stopActor(a) {
    a.moving = false;
    if (a.kind === 'npc') { a.m.state = 'act'; a.m.act = 'idle'; a.m.speed = 0; }
  }
}

function length(path) {
  const c = cumulative(path);
  return c[c.length - 1];
}

/** The first `max` metres of a path. */
function clip(path, max) {
  const out = [path[0]];
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    if (acc + d >= max) {
      const k = (max - acc) / d;
      out.push([path[i - 1][0] + (path[i][0] - path[i - 1][0]) * k, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * k]);
      return out;
    }
    acc += d;
    out.push(path[i]);
  }
  return out;
}

function cumulative(path) {
  const out = [0];
  for (let i = 1; i < path.length; i++) out.push(out[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  return out;
}

/** The point `s` metres along a path, and the way it faces there. */
function along(path, lens, s) {
  let i = 1;
  while (i < lens.length - 1 && lens[i] < s) i++;
  const a = path[i - 1], b = path[i];
  const seg = Math.max(1e-6, lens[i] - lens[i - 1]);
  const k = Math.min(1, Math.max(0, (s - lens[i - 1]) / seg));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[0] - a[0], b[1] - a[1])];
}

function splitSentences(text) {
  return String(text || '').match(/[^.?]+[.?]+/g)?.map(s => s.trim()) || (text ? [text] : []);
}

/** For the checks: the step kinds a scene may use. */
export const STEP_KINDS = Object.freeze(['place', 'look', 'go', 'follow', 'say', 'start', 'wait', 'vanish']);
