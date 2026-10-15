/**
 * boss-hud.js — The boss's health plate, drawn over the world.
 *
 * One plate at the top of the glass: the boss's name, a bar with a tick between
 * each phase, and a pale trailing chunk that shows the last blow draining away.
 * Under it, the rig's Integrity as three pips. A name card plays once when the
 * boss arrives.
 *
 * It only DISPLAYS what `BossArena` hands it. It never reads the fight, so it
 * cannot hold back or refuse an answer. Scoured plate: grey metal, red for the
 * foe's health, amber for the blow that just landed, no glow.
 */

import { esc } from '../../ui/layout.js';

export class BossHud {
  /**
   * @param {{ name: string, maxHp: number, total: number, integrity?: number }} cfg
   */
  constructor({ name, maxHp, total, integrity = 3 }) {
    this.maxHp = maxHp;
    this.total = Math.max(1, total);
    this.name = name;
    this.rigMax = integrity;

    this.root = document.createElement('div');
    this.root.className = 'boss-hud';
    this.root.setAttribute('role', 'group');
    this.root.setAttribute('aria-label', `${name} health`);
    this.root.innerHTML = this.markup(integrity);
    document.body.appendChild(this.root);

    this.el = {
      phase: this.root.querySelector('.boss-hud-phase'),
      ghost: this.root.querySelector('.boss-hud-ghost'),
      fill: this.root.querySelector('.boss-hud-fill'),
      hp: this.root.querySelector('.boss-hud-hp'),
      bar: this.root.querySelector('.boss-hud-bar'),
      ticks: this.root.querySelector('.boss-hud-ticks'),
      rig: this.root.querySelector('.boss-hud-rig')
    };

    this.intro = document.createElement('div');
    this.intro.className = 'boss-intro';
    this.intro.setAttribute('aria-hidden', 'true');
    this.intro.innerHTML = `<span>${esc(name)}</span>`;
    document.body.appendChild(this.intro);

    this.buildTicks();
    this.setHp(maxHp, { snap: true });
    this.timers = [];
  }

  markup(integrity) {
    const pips = Array.from({ length: integrity }, () => '<i class="on"></i>').join('');
    return `
      <div class="boss-hud-top">
        <span class="boss-hud-name">${esc(this.name)}</span>
        <span class="boss-hud-phase"></span>
      </div>
      <div class="boss-hud-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${this.maxHp}">
        <i class="boss-hud-ghost"></i>
        <i class="boss-hud-fill"></i>
        <span class="boss-hud-ticks"></span>
      </div>
      <div class="boss-hud-foot">
        <span class="boss-hud-hp"></span>
        <span class="boss-hud-rig" aria-label="Rig integrity">${pips}</span>
      </div>`;
  }

  buildTicks() {
    const ticks = [];
    for (let i = 1; i < this.total; i++) {
      ticks.push(`<b style="left:${(i / this.total) * 100}%"></b>`);
    }
    this.el.ticks.innerHTML = ticks.join('');
  }

  setTotal(total) {
    if (total === this.total) return;
    this.total = Math.max(1, total);
    this.buildTicks();
  }

  setPhase(index, total) {
    this.setTotal(total);
    this.el.phase.textContent = `Phase ${Math.min(index + 1, this.total)} of ${this.total}`;
  }

  /** The main bar drops at once; the pale chunk follows after a beat. */
  setHp(hp, { snap = false } = {}) {
    const pct = Math.max(0, Math.min(100, (hp / this.maxHp) * 100));
    this.el.fill.style.width = `${pct}%`;
    this.el.bar.setAttribute('aria-valuenow', String(Math.round(hp)));
    this.el.hp.textContent = hp > 0 ? `${Math.round(hp)} / ${this.maxHp}` : 'Dispersed';
    if (snap) {
      this.el.ghost.style.transition = 'none';
      this.el.ghost.style.width = `${pct}%`;
      void this.el.ghost.offsetWidth;
      this.el.ghost.style.transition = '';
    } else {
      this.el.ghost.style.width = `${pct}%`;
    }
  }

  /** The foe's blow lands: a pip goes out. */
  setRig(integrity, max = this.rigMax, { hit = false } = {}) {
    this.rigMax = max;
    this.el.rig.innerHTML = Array.from({ length: max }, (_, i) =>
      `<i class="${i < integrity ? 'on' : ''}"></i>`).join('');
    if (hit) this.kick(this.el.rig);
  }

  /** Shake the whole plate: a blow landed. */
  hit() { this.kick(this.root, 'hit'); }

  kick(el, cls = 'kick') {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  showIntro() {
    this.intro.classList.remove('play');
    void this.intro.offsetWidth;
    this.intro.classList.add('play');
  }

  defeat() {
    this.root.classList.add('down');
    this.timers.push(setTimeout(() => this.root.classList.add('gone'), 3200));
  }

  dispose() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.root.remove();
    this.intro.remove();
  }
}
