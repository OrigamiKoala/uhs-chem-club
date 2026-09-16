/**
 * register.js — Step 1 of the sign-up journey (account → team → play).
 *
 * Rules here mirror validateDisplayName() in apps-script/Util.gs exactly, so a
 * student never gets bounced by a server rule the form did not warn about.
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';
import { stepRail } from '../ui/layout.js';

const NAME_PATTERN = /^[a-zA-Z0-9 _-]+$/;

/** Mirror of the backend display-name rules. */
export function checkDisplayName(name) {
  if (!name) return { valid: false, message: 'Pick a display name.' };
  if (name.trim() !== name) return { valid: false, message: 'No spaces at the start or end.' };
  if (name.length < 3 || name.length > 20) return { valid: false, message: 'Use 3–20 characters.' };
  if (/\s{2,}/.test(name)) return { valid: false, message: 'No double spaces.' };
  if (!NAME_PATTERN.test(name)) return { valid: false, message: 'Letters, numbers, spaces, - and _ only.' };
  return { valid: true, message: 'Looks good.' };
}

export function renderRegister(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cockpit');
  }

  if (session.token && session.player) {
    window.location.hash = session.teamId ? '#/bridge' : '#/onboarding';
    return;
  }

  container.innerHTML = `
    <div class="screen-container" style="max-width: 460px;">
      ${stepRail(1)}
      <div class="glass-panel">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div class="eyebrow">Avalon · Intake</div>
          <h1 class="page-title" style="font-size: 1.5rem;">Create Account</h1>
        </div>

        <form id="register-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="reg-name">Display Name</label>
            <input type="text" id="reg-name" class="form-input" placeholder="e.g. AstraNova"
                   minlength="3" maxlength="20" required autocomplete="username" autocapitalize="off">
            <span class="form-help" id="reg-name-help">3–20 chars · letters, numbers, space, - _</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">Email</label>
            <input type="email" id="reg-email" class="form-input" placeholder="student@example.com"
                   required autocomplete="email" autocapitalize="off">
            <span class="form-help" id="reg-email-help">Sign-in only. Never emailed.</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-pw">Password</label>
            <div class="input-wrap">
              <input type="password" id="reg-pw" class="form-input" placeholder="At least 8 characters"
                     minlength="8" required autocomplete="new-password">
              <button type="button" class="reveal-btn" data-reveal="reg-pw" aria-label="Show password">SHOW</button>
            </div>
            <span class="form-help warn" id="reg-pw-help">Not your school password.</span>
          </div>

          <div id="reg-error" class="form-banner hidden" role="alert"></div>

          <button type="submit" id="reg-submit-btn" class="btn-primary" style="width: 100%;">
            Create Account
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem;">
          <a href="#/login" class="link-accent" style="font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.1em;">Sign in</a>
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

  bindPasswordReveal(container);

  // Live feedback so problems surface while typing, not after a failed round trip.
  nameInput.addEventListener('input', () => {
    const val = nameInput.value;
    if (!val) {
      nameHelp.className = 'form-help';
      nameHelp.textContent = 'Shown on the leaderboard. 3–20 characters: letters, numbers, spaces, - and _.';
      return;
    }
    const res = checkDisplayName(val);
    nameHelp.className = `form-help ${res.valid ? 'good' : 'bad'}`;
    nameHelp.textContent = res.message;
  });

  emailInput.addEventListener('blur', () => {
    const val = emailInput.value.trim();
    if (!val) return;
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
    emailHelp.className = `form-help ${ok ? '' : 'bad'}`;
    emailHelp.textContent = ok
      ? 'Sign-in only. Never emailed.'
      : 'That does not look like an email address.';
  });

  pwInput.addEventListener('input', () => {
    if (!pwInput.value) {
      pwHelp.className = 'form-help warn';
      pwHelp.textContent = 'Not your school password.';
      return;
    }
    const short = pwInput.value.length < 8;
    pwHelp.className = `form-help ${short ? 'bad' : 'good'}`;
    pwHelp.textContent = short
      ? `${8 - pwInput.value.length} more character${8 - pwInput.value.length === 1 ? '' : 's'} needed.`
      : 'Long enough. No reset email.';
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
    submitBtn.textContent = 'Creating…';

    try {
      const res = await api.register(email, password, displayName);
      session.setToken(res.token);
      session.setUserData({ player: res.player });
      showToast('Account created.', 'success');
      window.location.hash = '#/onboarding';
    } catch (err) {
      failWith(err.message || 'Registration failed. Check your connection and try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
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
