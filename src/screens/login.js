/**
 * login.js — Returning player sign-in.
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';
import { bindPasswordReveal } from './register.js';

export function renderLogin(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cockpit');
  }

  if (session.token && session.player) {
    window.location.hash = session.teamId ? '#/bridge' : '#/onboarding';
    return;
  }

  container.innerHTML = `
    <div class="screen-container m-screen m-login" style="max-width: 460px;">
      <div class="glass-panel">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div class="eyebrow">Account Access</div>
          <h1 class="page-title" style="font-size: 1.5rem;">Sign In</h1>
        </div>

        <form id="login-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-id">Email or Display Name</label>
            <input type="text" id="login-id" class="form-input"
                   required autocomplete="username" autocapitalize="off">
          </div>

          <div class="form-group">
            <label class="form-label" for="login-pw">Password</label>
            <div class="input-wrap">
              <input type="password" id="login-pw" class="form-input"
                     required autocomplete="current-password">
              <button type="button" class="reveal-btn" data-reveal="login-pw" aria-label="Show password">SHOW</button>
            </div>
          </div>

          <div id="login-error" class="form-banner hidden" role="alert"></div>

          <button type="submit" id="login-submit-btn" class="btn-primary" style="width: 100%;">
            <span>Sign In</span>
          </button>
        </form>

        <div class="m-foot m-foot-center" style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-secondary);">
          <a href="#/register" class="link-accent">Create account</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const errorEl = container.querySelector('#login-error');
  const submitBtn = container.querySelector('#login-submit-btn');

  bindPasswordReveal(container);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');

    const identifier = container.querySelector('#login-id').value.trim();
    const password = container.querySelector('#login-pw').value;

    if (!identifier || !password) {
      errorEl.innerHTML = '<span>Enter your name and password.</span>';
      errorEl.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Signing in…</span>';

    const idLc = identifier.toLowerCase();
    const cachedSalt = localStorage.getItem('avalon_salt_' + idLc) || undefined;

    try {
      const res = await api.login(identifier, password, cachedSalt);
      if (res.salt) {
        localStorage.setItem('avalon_salt_' + idLc, res.salt);
      }
      session.setToken(res.token);
      session.setUserData({
        player: res.player,
        team: res.team,
        xp: res.xp,
        level: res.level,
        inventory: res.inventory,
        progress: res.progress
      });
      if (res.config) session.setConfigAndTeams(res.config, session.teams);

      showToast('Signed in.', 'success');
      window.location.hash = session.teamId ? '#/bridge' : '#/onboarding';

      // Refresh full profile in background
      api.getMe().then(meData => {
        if (meData) session.setUserData(meData);
      }).catch(meErr => console.warn('Background getMe:', meErr));
    } catch (err) {
      const isBadCreds = err.code === 'INVALID_CREDENTIALS';
      errorEl.innerHTML = `<span>${
        isBadCreds ? 'That name or password is not right. Try again.' : (err.message || 'Sign-in failed.')
      }</span>`;
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In</span>';
    }
  });
}
