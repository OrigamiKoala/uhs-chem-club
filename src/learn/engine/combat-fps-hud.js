/**
 * combat-fps-hud.js — Tactical FPS Crosshair, Lock-on Reticle & Combat HUD.
 *
 * Renders first-person combat reticles, dynamic 3D lock-on brackets around foes,
 * hitmarkers, damage vignette flashes, and boss/foe healthplates.
 */

import * as THREE from 'three';

const _screenPos = new THREE.Vector3();

export class CombatFpsHud {
  /**
   * @param {HTMLElement} mount
   * @param {THREE.Camera} camera
   */
  constructor(mount, camera) {
    this.mount = mount || document.body;
    this.camera = camera;
    this.el = null;
    this.active = false;
    this.monsters = [];
    this.targetMonster = null;
    this.onStrike = null;

    this.hitmarkerTimer = 0;
    this.damageVignetteTimer = 0;

    this.initDOM();
  }

  initDOM() {
    this.el = document.createElement('div');
    this.el.className = 'fps-combat-overlay';
    this.el.innerHTML = `
      <!-- Vignette Damage Flash -->
      <div class="fps-damage-vignette" aria-hidden="true"></div>

      <!-- Tactical Reticle / Crosshair -->
      <div class="fps-crosshair" aria-hidden="true">
        <div class="fps-cross-dot"></div>
        <div class="fps-cross-prong fps-prong-top"></div>
        <div class="fps-cross-prong fps-prong-bottom"></div>
        <div class="fps-cross-prong fps-prong-left"></div>
        <div class="fps-cross-prong fps-prong-right"></div>
        <!-- Tactical Hitmarker -->
        <div class="fps-hitmarker">
          <div class="fps-hm-line fps-hm-tl"></div>
          <div class="fps-hm-line fps-hm-tr"></div>
          <div class="fps-hm-line fps-hm-bl"></div>
          <div class="fps-hm-line fps-hm-br"></div>
        </div>
      </div>

      <!-- 3D Tracking Lock-on Target Box -->
      <div class="fps-target-box" style="display: none;">
        <div class="fps-bracket fps-b-tl"></div>
        <div class="fps-bracket fps-b-tr"></div>
        <div class="fps-bracket fps-b-bl"></div>
        <div class="fps-bracket fps-b-br"></div>
        <div class="fps-target-label">
          <span class="fps-target-tag">TARGET ACQUIRED</span>
          <span class="fps-target-name">SALT HUSK</span>
          <span class="fps-target-dist">RANGE: 2.2M</span>
        </div>
      </div>

      <!-- Foe Threat Bar at Top Center -->
      <div class="fps-threat-plate" style="display: none;">
        <div class="fps-threat-head">
          <span class="fps-threat-species">FOE ENCOUNTER</span>
          <span class="fps-threat-status">HOSTILE</span>
        </div>
        <div class="fps-integrity-bar">
          <div class="fps-integrity-pip active"></div>
          <div class="fps-integrity-pip active"></div>
          <div class="fps-integrity-pip active"></div>
        </div>
      </div>
    `;

    // Clicking crosshair or lock box triggers strike
    this.el.addEventListener('click', (e) => {
      if (this.onStrike && (e.target.closest('.fps-target-box') || e.target.closest('.fps-crosshair'))) {
        e.preventDefault();
        e.stopPropagation();
        this.onStrike();
      }
    });

    this.mount.appendChild(this.el);

    this.vignetteEl = this.el.querySelector('.fps-damage-vignette');
    this.crosshairEl = this.el.querySelector('.fps-crosshair');
    this.hitmarkerEl = this.el.querySelector('.fps-hitmarker');
    this.targetBoxEl = this.el.querySelector('.fps-target-box');
    this.targetNameEl = this.el.querySelector('.fps-target-name');
    this.targetDistEl = this.el.querySelector('.fps-target-dist');
    this.threatPlateEl = this.el.querySelector('.fps-threat-plate');
    this.threatSpeciesEl = this.el.querySelector('.fps-threat-species');
    this.threatStatusEl = this.el.querySelector('.fps-threat-status');
    this.integrityBarEl = this.el.querySelector('.fps-integrity-bar');
  }

  show(enc, fight) {
    this.active = true;
    this.el.classList.add('active');
    this.updateThreatPlate(enc, fight);
  }

  hide() {
    this.active = false;
    this.el.classList.remove('active');
    if (this.targetBoxEl) this.targetBoxEl.style.display = 'none';
    if (this.threatPlateEl) this.threatPlateEl.style.display = 'none';
  }

  updateThreatPlate(enc, fight) {
    if (!enc || !this.threatPlateEl) return;
    this.threatPlateEl.style.display = 'flex';
    const isBoss = enc.species?.includes('boss') || enc.species === 'the hopper' || enc.species === 'the lantern-eater' || enc.species === 'the compressor';
    this.threatSpeciesEl.textContent = `${isBoss ? '[ BOSS ] ' : ''}${enc.speciesName?.toUpperCase() || enc.species?.toUpperCase()}`;
    this.threatStatusEl.textContent = fight?.won ? 'DISPERSED' : 'HOSTILE';

    if (this.integrityBarEl && fight) {
      const pips = [];
      for (let i = 0; i < fight.max; i++) {
        pips.push(`<div class="fps-integrity-pip ${i < fight.integrity ? 'active' : 'spent'}"></div>`);
      }
      this.integrityBarEl.innerHTML = pips.join('');
    }
  }

  triggerHitmarker() {
    this.hitmarkerTimer = 0.22;
    this.hitmarkerEl?.classList.add('visible');
  }

  triggerDamageFlash() {
    this.damageVignetteTimer = 0.45;
    this.vignetteEl?.classList.add('visible');
  }

  setMonsters(monsters) {
    this.monsters = monsters || [];
    this.targetMonster = this.monsters[0] || null;
  }

  update(dt) {
    if (!this.active) return;

    // Hitmarker timer
    if (this.hitmarkerTimer > 0) {
      this.hitmarkerTimer -= dt;
      if (this.hitmarkerTimer <= 0) {
        this.hitmarkerEl?.classList.remove('visible');
      }
    }

    // Damage vignette timer
    if (this.damageVignetteTimer > 0) {
      this.damageVignetteTimer -= dt;
      if (this.damageVignetteTimer <= 0) {
        this.vignetteEl?.classList.remove('visible');
      }
    }

    // Project 3D monster position to 2D target box
    if (this.targetMonster && this.targetMonster.group.visible && this.camera) {
      const pos = this.targetMonster.group.position.clone();
      pos.y += 0.85; // center on chest
      _screenPos.copy(pos).project(this.camera);

      // Check if in front of camera
      if (_screenPos.z < 1.0) {
        const x = (_screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-_screenPos.y * 0.5 + 0.5) * window.innerHeight;

        const dist = pos.distanceTo(this.camera.position).toFixed(1);

        if (this.targetBoxEl) {
          this.targetBoxEl.style.display = 'block';
          this.targetBoxEl.style.left = `${x}px`;
          this.targetBoxEl.style.top = `${y}px`;
        }

        if (this.targetNameEl) this.targetNameEl.textContent = this.targetMonster.species.toUpperCase();
        if (this.targetDistEl) this.targetDistEl.textContent = `RANGE: ${dist}M`;
      } else {
        if (this.targetBoxEl) this.targetBoxEl.style.display = 'none';
      }
    } else {
      if (this.targetBoxEl) this.targetBoxEl.style.display = 'none';
    }
  }

  dispose() {
    this.el?.remove();
    this.el = null;
  }
}
