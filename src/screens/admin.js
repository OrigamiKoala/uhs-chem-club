/**
 * admin.js — Admin control panel for club leads
 */

import { api } from '../api.js';
import { showToast } from '../ui/toast.js';

export async function renderAdmin(container) {
  let stats = { totalPlayers: 0, totalSubmissions: 0, completions: 0, gfxTiers: { T1: 0, T2: 0, T3: 0 } };

  try {
    stats = await api.adminStats();
  } catch (e) {}

  container.innerHTML = `
    <div class="screen-container" style="max-width: 920px;">
      <div class="glass-panel" style="margin-bottom: 1.5rem;">
        <h2 class="holo-title" style="margin-bottom: 0;">Admin</h2>
      </div>

      <!-- Live Counters -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="holo-card" style="padding: 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Total Players</div>
          <div style="font-family: var(--font-mono); font-size: 1.75rem; font-weight: 800; color: var(--accent-cyan);">${stats.totalPlayers || 0}</div>
        </div>
        <div class="holo-card" style="padding: 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Submissions</div>
          <div style="font-family: var(--font-mono); font-size: 1.75rem; font-weight: 800; color: var(--accent-green);">${stats.totalSubmissions || 0}</div>
        </div>
        <div class="holo-card" style="padding: 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Completions</div>
          <div style="font-family: var(--font-mono); font-size: 1.75rem; font-weight: 800; color: var(--accent-amber);">${stats.completions || 0}</div>
        </div>
        <div class="holo-card" style="padding: 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Tier 1 Submissions</div>
          <div style="font-family: var(--font-mono); font-size: 1.75rem; font-weight: 800; color: #82b1ff;">${stats.gfxTiers?.T1 || 0}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem;">
        <!-- Reset Password Tool (§3.5) -->
        <div class="glass-panel">
          <h3 class="holo-title" style="font-size: 1.1rem; color: var(--accent-amber); margin-bottom: 0.4rem;">
            Reset Password
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Set a temporary password for a student.
          </p>

          <form id="admin-reset-pw-form">
            <div class="form-group">
              <label class="form-label">Email or Display Name</label>
              <input type="text" id="target-id" class="form-input" placeholder="e.g. student@example.com or Nova" required>
            </div>
            <div class="form-group">
              <label class="form-label">Temporary Password</label>
              <div style="display: flex; gap: 0.5rem;">
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
          <h3 class="holo-title" style="font-size: 1.1rem; color: var(--accent-green); margin-bottom: 0.4rem;">
            Grant XP
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Award XP with a recorded reason.
          </p>

          <form id="admin-grant-xp-form">
            <div class="form-group">
              <label class="form-label">Player ID or Display Name</label>
              <input type="text" id="grant-target-id" class="form-input" placeholder="p_123 or display name" required>
            </div>
            <div class="form-group">
              <label class="form-label">XP Amount</label>
              <input type="number" id="grant-amount" class="form-input" placeholder="e.g. 50" required>
            </div>
            <div class="form-group">
              <label class="form-label">Reason</label>
              <input type="text" id="grant-reason" class="form-input" placeholder="e.g. Meeting quiz winner" required>
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
      showToast(`Password successfully reset for ${target}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Reset failed', 'error');
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
      showToast(`+${amount} XP granted to ${target}!`, 'success');
    } catch (err) {
      showToast(err.message || 'XP grant failed', 'error');
    }
  });
}
