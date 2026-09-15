/**
 * demo.js — Kiosk showcase demo mode (unauthenticated Stage 1 play)
 */

import { api } from '../api.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { QuestViewer } from '../quest3d/viewer.js';
import { renderFallbackInputs } from '../fallback2d/stages.js';
import { showToast } from '../ui/toast.js';

export function renderDemo(container) {
  let viewer = null;
  let currentPayload = null;

  if (tierManager.currentTier !== 'T1' && stage.canvas) {
    viewer = new QuestViewer(stage.canvas);
    stage.setQuestScene(viewer);
  }

  const stageConfig = {
    title: 'Demo: Calibrate Scanner',
    prompt: 'Orbit the charge cloud and click the highest-density lobe.',
    moleculeId: 'h2o',
    anchors: ['lp_o', 'h1', 'h2']
  };

  container.innerHTML = `
    <div class="quest-hud-overlay">
      <div class="quest-hud-top">
        <a href="#/" class="btn-secondary" style="font-size: 0.75rem; padding: 6px 12px; min-height: 36px; text-decoration: none;">
          Exit Demo
        </a>
        <div style="font-family: var(--font-display); font-size: 0.8rem; color: var(--accent-amber); background: rgba(255, 179, 0, 0.15); border: 1px solid rgba(255, 179, 0, 0.3); padding: 4px 12px; border-radius: var(--radius-sm);">
          Demo
        </div>
      </div>

      <div class="stage-card-wrap">
        <div class="stage-prompt-card">
          <div class="scanning-sweep hidden" id="demo-sweep"></div>
          <div class="stage-header">
            <div class="stage-title">${stageConfig.title}</div>
            <div class="stage-xp-tag">+10 XP</div>
          </div>
          <div class="stage-instruction">${stageConfig.prompt}</div>

          <div id="demo-interactive-area" style="margin-bottom: 1rem;"></div>
          <div id="demo-feedback" class="hidden" style="margin-bottom: 1rem; padding: 12px; border-radius: var(--radius-sm); font-size: 0.9rem;"></div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button type="button" id="demo-grade-btn" class="btn-primary" style="padding: 8px 24px; min-height: 40px;">
              <span>Submit</span>
              <span>➔</span>
            </button>
            <a href="#/register" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  const interactiveArea = container.querySelector('#demo-interactive-area');

  if (tierManager.currentTier === 'T1' || !viewer) {
    renderFallbackInputs(interactiveArea, stageConfig, 'pick', (payload) => {
      currentPayload = payload;
    });
  } else {
    viewer.loadStage(stageConfig, 'pick', (payload) => {
      currentPayload = payload;
    });
  }

  const gradeBtn = container.querySelector('#demo-grade-btn');
  const sweep = container.querySelector('#demo-sweep');
  const feedback = container.querySelector('#demo-feedback');

  gradeBtn.addEventListener('click', async () => {
    if (!currentPayload) {
      showToast('Select an anchor before submitting.', 'warning');
      return;
    }

    sweep.classList.remove('hidden');
    gradeBtn.disabled = true;

    try {
      await new Promise(r => setTimeout(r, 600));
      const res = await api.gradeDemo(1, currentPayload);
      sweep.classList.add('hidden');
      gradeBtn.disabled = false;

      if (res.correct) {
        if (viewer) viewer.triggerSuccessBloom();
        feedback.className = 'text-success';
        feedback.style.background = 'rgba(0, 230, 118, 0.15)';
        feedback.style.border = '1px solid var(--accent-green)';
        feedback.innerHTML = `
          <strong>${res.revealText}</strong><br>
          <span style="color: var(--text-primary);">Sign up to save progress and join a team.</span>
          <div style="margin-top: 0.75rem;">
            <a href="#/register" class="btn-primary" style="display: inline-block; padding: 6px 16px; font-size: 0.8rem; text-decoration: none;">Sign Up</a>
          </div>
        `;
        feedback.classList.remove('hidden');
      } else {
        if (viewer) viewer.triggerShudder();
        feedback.className = 'text-danger';
        feedback.style.background = 'rgba(255, 82, 82, 0.15)';
        feedback.style.border = '1px solid var(--accent-danger)';
        feedback.textContent = res.revealText;
        feedback.classList.remove('hidden');
      }
    } catch (e) {
      sweep.classList.add('hidden');
      gradeBtn.disabled = false;
    }
  });
}
