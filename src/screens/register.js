/**
 * register.js — Registration screen
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { showToast } from '../ui/toast.js';

export function renderRegister(container) {
  if (session.token && session.player) {
    window.location.hash = session.player.team_id ? '#/bridge' : '#/onboarding';
    return;
  }

  container.innerHTML = `
    <div class="screen-container" style="max-width: 440px; margin: 2rem auto;">
      <div class="glass-panel">
        <h2 class="holo-title" style="text-align: center; margin-bottom: 1.5rem;">Register</h2>

        <form id="register-form">
          <div class="form-group">
            <label class="form-label" for="reg-email">Email</label>
            <input type="email" id="reg-email" class="form-input" placeholder="student@example.com" required autocomplete="email">
            <span style="font-size: 0.72rem; color: var(--text-muted);">Used only as an identifier. No email is sent.</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-name">Display Name</label>
            <input type="text" id="reg-name" class="form-input" placeholder="e.g. AstraNova" minlength="3" maxlength="20" required autocomplete="username">
            <span style="font-size: 0.72rem; color: var(--text-muted);">Public on leaderboards. Letters, numbers, spaces, - and _.</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-pw">Password</label>
            <input type="password" id="reg-pw" class="form-input" placeholder="Minimum 8 characters" minlength="8" required autocomplete="new-password">
            <span style="font-size: 0.72rem; color: var(--accent-amber);">Reminder: Do not reuse your school Google password here.</span>
          </div>

          <div id="reg-error" class="text-danger hidden" style="font-size: 0.85rem; margin-bottom: 1rem;"></div>

          <button type="submit" id="reg-submit-btn" class="btn-primary" style="width: 100%;">
            <span>Register</span>
            <span>➔</span>
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem;">
          <span style="color: var(--text-secondary);">Already have an account? </span>
          <a href="#/login" style="color: var(--accent-cyan); text-decoration: none; font-weight: 600;">Log in</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#register-form');
  const errorEl = container.querySelector('#reg-error');
  const submitBtn = container.querySelector('#reg-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering…';

    const email = container.querySelector('#reg-email').value.trim();
    const displayName = container.querySelector('#reg-name').value.trim();
    const password = container.querySelector('#reg-pw').value;

    try {
      const res = await api.register(email, password, displayName);
      session.setToken(res.token);
      session.setUserData({ player: res.player });
      showToast('Account created.', 'success');
      window.location.hash = '#/onboarding';
    } catch (err) {
      errorEl.textContent = err.message || 'Registration failed.';
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Register</span><span>➔</span>';
    }
  });
}
