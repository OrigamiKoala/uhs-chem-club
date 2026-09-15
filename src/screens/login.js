/**
 * login.js — Login screen
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { showToast } from '../ui/toast.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="screen-container" style="max-width: 440px; margin: 2.5rem auto;">
      <div class="glass-panel">
        <h2 class="holo-title" style="text-align: center; margin-bottom: 1.5rem;">Sign In</h2>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-id">Email or Display Name</label>
            <input type="text" id="login-id" class="form-input" placeholder="student@example.com or AstraNova" required autocomplete="username">
          </div>

          <div class="form-group">
            <label class="form-label" for="login-pw">Password</label>
            <input type="password" id="login-pw" class="form-input" placeholder="Enter password" required autocomplete="current-password">
          </div>

          <div id="login-error" class="text-danger hidden" style="font-size: 0.85rem; margin-bottom: 1rem;"></div>

          <button type="submit" id="login-submit-btn" class="btn-primary" style="width: 100%;">
            <span>Sign In</span>
            <span>➔</span>
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem;">
          <span style="color: var(--text-secondary);">Need an account? </span>
          <a href="#/register" style="color: var(--accent-cyan); text-decoration: none; font-weight: 600;">Register</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const errorEl = container.querySelector('#login-error');
  const submitBtn = container.querySelector('#login-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    const identifier = container.querySelector('#login-id').value.trim();
    const password = container.querySelector('#login-pw').value;

    try {
      const res = await api.login(identifier, password);
      session.setToken(res.token);
      session.setUserData({ player: res.player });

      // Load full me details
      const meData = await api.getMe();
      session.setUserData(meData);

      showToast('Signed in.', 'success');
      if (res.player.team_id) {
        window.location.hash = '#/bridge';
      } else {
        window.location.hash = '#/onboarding';
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Login failed.';
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In</span><span>➔</span>';
    }
  });
}
