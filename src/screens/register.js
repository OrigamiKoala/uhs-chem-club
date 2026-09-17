/**
 * register.js — Step 1: Session Zero Scene 1 (The Manifest).
 *
 * Vess walks the recruit through the crew manifest:
 * 1. "Name for the manifest?" (display name with live validation)
 * 2. "Comms frequency and a passphrase." (email & password)
 * 3. Background: Salvager / Runaway / Scholar (cosmetic starting background)
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';
import { stepRail, esc } from '../ui/layout.js';
import { BACKGROUNDS } from '../story/trinkets.js';

const NAME_PATTERN = /^[a-zA-Z0-9 _-]+$/;

/** Mirror of the backend display-name rules. */
export function checkDisplayName(name) {
  if (!name) return { valid: false, message: 'Pick a display name.', vessVoice: 'Name for the manifest?' };
  if (name.trim() !== name) return { valid: false, message: 'No spaces at the start or end.', vessVoice: 'Trim the edges.' };
  if (name.length < 3) return { valid: false, message: 'Use 3–20 characters.', vessVoice: 'Too short for the logs.' };
  if (name.length > 20) return { valid: false, message: 'Use 3–20 characters.', vessVoice: 'Too long. Keep it tight.' };
  if (/\s{2,}/.test(name)) return { valid: false, message: 'No double spaces.', vessVoice: 'Clean up the double spacing.' };
  if (!NAME_PATTERN.test(name)) return { valid: false, message: 'Letters, numbers, spaces, - and _ only.', vessVoice: 'Stick to alphanumeric characters.' };
  return { valid: true, message: 'Looks good.', vessVoice: 'Good. Clear on the roster.' };
}

export function renderRegister(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cockpit');
  }

  if (session.token && session.player) {
    window.location.hash = session.teamId ? '#/bridge' : '#/onboarding';
    return;
  }

  let selectedBg = 'salvager';
  try {
    const saved = localStorage.getItem('avalon_pending_bg');
    if (saved && BACKGROUNDS[saved]) selectedBg = saved;
  } catch (e) {}

  container.innerHTML = `
    <div class="screen-container" style="max-width: 520px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
        ${stepRail(1)}
        <a href="#/login" class="eyebrow" style="text-decoration: none; color: var(--text-muted);">Skip // Sign In</a>
      </div>

      <div class="glass-panel">
        <!-- Vess Dialogue Inset -->
        <div class="cold-open-box" style="margin-bottom: 1.5rem; padding: 0.9rem 1.1rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-amber);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span class="eyebrow lit">VESS // QUARTERMASTER</span>
            <span class="tag live" style="font-size: 0.6rem;">SCENE 01 · MANIFEST</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.62rem; color: var(--text-muted); letter-spacing: 0.08em; margin-bottom: 0.35rem;">AVALON SALVAGE HAULER // CHIEF OF LOGISTICS</div>
          <p id="vess-line" style="font-family: var(--font-mono); font-size: 0.84rem; line-height: 1.45; color: var(--accent-gold); margin: 0;">
            "Name for the manifest? We need to know who to credit when the haul lands."
          </p>
        </div>

        <form id="register-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="reg-name">Call Sign / Display Name</label>
            <input type="text" id="reg-name" class="form-input" placeholder="e.g. AstraNova"
                   minlength="3" maxlength="20" required autocomplete="username" autocapitalize="off">
            <span class="form-help" id="reg-name-help">3–20 chars · letters, numbers, space, - _</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">Comms Frequency (Email)</label>
            <input type="email" id="reg-email" class="form-input" placeholder="student@example.com"
                   required autocomplete="email" autocapitalize="off">
            <span class="form-help" id="reg-email-help">Sign-in only. Never shared or emailed.</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-pw">Passphrase</label>
            <div class="input-wrap">
              <input type="password" id="reg-pw" class="form-input" placeholder="At least 8 characters"
                     minlength="8" required autocomplete="new-password">
              <button type="button" class="reveal-btn" data-reveal="reg-pw" aria-label="Show password">SHOW</button>
            </div>
            <span class="form-help warn" id="reg-pw-help">Not your school password.</span>
          </div>

          <!-- Background Selection (Purely cosmetic) -->
          <div class="form-group" style="margin-top: 1.4rem;">
            <label class="form-label">Background // Prior Record</label>
            <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem;" role="radiogroup" aria-label="Background">
              ${Object.values(BACKGROUNDS).map(bg => `
                <button type="button" class="choice-option bg-option ${bg.id === selectedBg ? 'selected' : ''}"
                        role="radio" aria-checked="${bg.id === selectedBg}" data-bg="${bg.id}"
                        style="padding: 9px 12px; text-align: left; display: flex; flex-direction: column; gap: 2px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span style="font-family: var(--font-display); font-weight: 600; font-size: 0.92rem; color: var(--text-bright); text-transform: uppercase;">${bg.title}</span>
                    <span class="eyebrow" style="font-size: 0.65rem;">COSMETIC</span>
                  </div>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-secondary);">${bg.flavor}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div id="reg-error" class="form-banner hidden" role="alert"></div>

          <button type="submit" id="reg-submit-btn" class="btn-primary" style="width: 100%; margin-top: 1.25rem;">
            Record on Manifest
          </button>
        </form>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem; font-family: var(--font-mono); font-size: 0.72rem;">
          <a href="#/login" class="link-accent">Sign in</a>
          <span style="color: var(--text-muted);">Step 1 of 3</span>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#register-form');
  const errorEl = container.querySelector('#reg-error');
  const submitBtn = container.querySelector('#reg-submit-btn');
  const nameInput = container.querySelector('#reg-name');
  const nameHelp = container.querySelector('#reg-name-help');
  const emailInput = container.querySelector('#reg-email');
  const emailHelp = container.querySelector('#reg-email-help');
  const pwInput = container.querySelector('#reg-pw');
  const pwHelp = container.querySelector('#reg-pw-help');
  const vessLine = container.querySelector('#vess-line');

  bindPasswordReveal(container);

  // Background toggle
  container.querySelectorAll('.bg-option').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.bg-option').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-checked', 'true');
      selectedBg = btn.getAttribute('data-bg');
      try { localStorage.setItem('avalon_pending_bg', selectedBg); } catch (e) {}

      const bgDef = BACKGROUNDS[selectedBg];
      if (vessLine && bgDef) {
        vessLine.textContent = `"${bgDef.flavor}"`;
      }
    });
  });

  // Live feedback + Vess in-character reaction
  nameInput.addEventListener('input', () => {
    const val = nameInput.value;
    if (!val) {
      nameHelp.className = 'form-help';
      nameHelp.textContent = '3–20 chars · letters, numbers, space, - _';
      if (vessLine) vessLine.textContent = '"Name for the manifest? We need to know who to credit when the haul lands."';
      return;
    }
    const res = checkDisplayName(val);
    nameHelp.className = `form-help ${res.valid ? 'good' : 'bad'}`;
    nameHelp.textContent = res.message;
    if (vessLine) vessLine.textContent = `"${res.vessVoice}"`;
  });

  emailInput.addEventListener('blur', () => {
    const val = emailInput.value.trim();
    if (!val) return;
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
    emailHelp.className = `form-help ${ok ? '' : 'bad'}`;
    emailHelp.textContent = ok ? 'Comms frequency verified.' : 'That does not look like a valid comms address.';
  });

  pwInput.addEventListener('input', () => {
    if (!pwInput.value) {
      pwHelp.className = 'form-help warn';
      pwHelp.textContent = 'Not your school password.';
      return;
    }
    const short = pwInput.value.length < 8;
    pwHelp.className = `form-help ${short ? 'bad' : 'good'}`;
    pwHelp.textContent = short ? `${8 - pwInput.value.length} more chars needed.` : 'Passphrase secure.';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');

    const email = emailInput.value.trim();
    const displayName = nameInput.value.trim();
    const password = pwInput.value;

    const nameCheck = checkDisplayName(displayName);
    if (!nameCheck.valid) return failWith(nameCheck.message, nameInput);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return failWith('Enter a valid email address.', emailInput);
    if (password.length < 8) return failWith('Password must be at least 8 characters.', pwInput);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Recording…';

    try {
      const res = await api.register(email, password, displayName);
      session.setToken(res.token);

      // Save background choice
      try { localStorage.setItem('avalon_pending_bg', selectedBg); } catch (e) {}

      session.setUserData({
        player: { ...(res.player || {}), background: selectedBg }
      });

      showToast('Recorded on manifest.', 'success');
      window.location.hash = '#/onboarding';
    } catch (err) {
      failWith(err.message || 'Registration failed. Check connection and retry.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Record on Manifest';
    }
  });

  function failWith(message, focusEl) {
    errorEl.innerHTML = `<span>${message}</span>`;
    errorEl.classList.remove('hidden');
    if (focusEl) focusEl.focus();
  }
}

/** Shared SHOW/HIDE toggle for password fields. */
export function bindPasswordReveal(root) {
  root.querySelectorAll('.reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = root.querySelector('#' + btn.getAttribute('data-reveal'));
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.textContent = showing ? 'SHOW' : 'HIDE';
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });
}
