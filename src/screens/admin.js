/**
 * admin.js — Admin control panel for club leads
 */

import { api } from '../api.js';
import { showToast } from '../ui/toast.js';
import { pageHeader } from '../ui/layout.js';

export function renderAdmin(container) {
  let stats = { totalPlayers: '…', totalSubmissions: '…', completions: '…', gfxTiers: { T1: '…' } };

  container.innerHTML = `
      <div class="screen-container m-screen m-admin" style="max-width: 920px;">
        ${pageHeader({
          eyebrow: 'Restricted · logged',
          title: 'Admin',
          actions: `<a href="#/bridge" class="btn-secondary" style="text-decoration: none;">Bridge</a>`
        })}

        <!-- Live Counters -->
        <div class="admin-counters" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="holo-card admin-counter" style="padding: 1rem;">
            <div class="stat-label">Total Players</div>
            <div class="admin-counter-value" id="stat-total-players" style="font-family: var(--font-mono); font-size: 1.6rem; color: var(--accent-amber);">${stats.totalPlayers}</div>
          </div>
          <div class="holo-card admin-counter" style="padding: 1rem;">
            <div class="stat-label">Submissions</div>
            <div class="admin-counter-value" id="stat-total-subs" style="font-family: var(--font-mono); font-size: 1.6rem; color: var(--accent-green);">${stats.totalSubmissions}</div>
          </div>
          <div class="holo-card admin-counter" style="padding: 1rem;">
            <div class="stat-label">Completions</div>
            <div class="admin-counter-value" id="stat-completions" style="font-family: var(--font-mono); font-size: 1.6rem; color: var(--accent-amber);">${stats.completions}</div>
          </div>
          <div class="holo-card admin-counter" style="padding: 1rem;">
            <div class="stat-label">Tier 1 Submissions</div>
            <div class="admin-counter-value" id="stat-t1-subs" style="font-family: var(--font-mono); font-size: 1.6rem; color: var(--accent-gold);">${stats.gfxTiers?.T1 ?? 0}</div>
          </div>
        </div>

      <div class="m-grid-1 admin-tools" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem;">
        <!-- Reset Password Tool (§3.5) -->
        <div class="glass-panel">
          <h2 class="section-title" style="margin-bottom: 1.25rem;">Reset Password</h2>

          <form id="admin-reset-pw-form">
            <div class="form-group">
              <label class="form-label">Email or Display Name</label>
              <input type="text" id="target-id" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Temporary Password</label>
              <div class="admin-pw-row" style="display: flex; gap: 0.5rem;">
                <input type="text" id="target-new-pw" class="form-input" value="ember-42-drift" required style="font-family: var(--font-mono);">
                <button type="button" id="gen-pw-btn" class="btn-secondary" style="font-size: 0.75rem; white-space: nowrap;">Generate</button>
              </div>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%;">
              Reset Password
            </button>
          </form>
        </div>

        <!-- Grant XP Tool -->
        <div class="glass-panel">
          <h2 class="section-title" style="margin-bottom: 1.25rem;">Grant XP</h2>

          <form id="admin-grant-xp-form">
            <div class="form-group">
              <label class="form-label">Player ID or Display Name</label>
              <input type="text" id="grant-target-id" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">XP Amount</label>
              <input type="number" id="grant-amount" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Reason</label>
              <input type="text" id="grant-reason" class="form-input" required>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%;">
              Grant XP
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Random pw generator
  container.querySelector('#gen-pw-btn')?.addEventListener('click', () => {
    const words = ['ember', 'drift', 'quantum', 'pulse', 'helix', 'vortex', 'solar', 'frost'];
    const w = words[Math.floor(Math.random() * words.length)];
    const n = Math.floor(Math.random() * 90) + 10;
    const w2 = words[Math.floor(Math.random() * words.length)];
    container.querySelector('#target-new-pw').value = `${w}-${n}-${w2}`;
  });

  // Reset pw submit
  container.querySelector('#admin-reset-pw-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const target = container.querySelector('#target-id').value.trim();
    const newPw = container.querySelector('#target-new-pw').value;

    try {
      await api.adminResetPassword(target, newPw);
      showToast(`Password reset for ${target}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Reset failed.', 'error');
    }
  });

  // Grant xp submit
  container.querySelector('#admin-grant-xp-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const target = container.querySelector('#grant-target-id').value.trim();
    const amount = container.querySelector('#grant-amount').value;
    const reason = container.querySelector('#grant-reason').value.trim();

    try {
      await api.adminGrantXp(target, amount, reason);
      showToast(`+${amount} XP to ${target}.`, 'success');
    } catch (err) {
      showToast(err.message || 'XP grant failed.', 'error');
    }
  });

  // Fetch live stats in background
  api.adminStats().then(s => {
    if (!s) return;
    const pEl = container.querySelector('#stat-total-players');
    const sEl = container.querySelector('#stat-total-subs');
    const cEl = container.querySelector('#stat-completions');
    const tEl = container.querySelector('#stat-t1-subs');
    if (pEl) pEl.textContent = s.totalPlayers ?? 0;
    if (sEl) sEl.textContent = s.totalSubmissions ?? 0;
    if (cEl) cEl.textContent = s.completions ?? 0;
    if (tEl) tEl.textContent = s.gfxTiers?.T1 ?? 0;
  }).catch(() => {});
}
