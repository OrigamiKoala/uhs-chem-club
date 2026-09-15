/**
 * quest.js — Master Quest 1 player HUD & simulation runner
 * The Charge Gardens of Erebus
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { QuestViewer } from '../quest3d/viewer.js';
import { renderFallbackInputs } from '../fallback2d/stages.js';
import { showToast } from '../ui/toast.js';

export function renderQuest(container) {
  let questData = session.activeQuest || null;
  let currentStageIdx = 0;
  let currentPayload = null;
  let isGrading = false;
  let hintUsed = false;
  let stageStartTime = Date.now();
  let viewer = null;

  // Initialize 3D Quest Scene unless on Tier 1
  if (tierManager.currentTier !== 'T1' && stage.canvas) {
    viewer = new QuestViewer(stage.canvas);
    stage.setQuestScene(viewer);
  }

  function loadStage(idx) {
    currentStageIdx = idx;
    currentPayload = null;
    hintUsed = false;
    stageStartTime = Date.now();

    const stageMeta = questData?.stages?.[currentStageIdx] || {
      stage_index: currentStageIdx,
      kind: 'pick',
      xp: 20,
      scene_config: { title: `Stage ${currentStageIdx}`, prompt: 'Analyze charge distribution.' }
    };

    const cfg = stageMeta.scene_config || {};

    const defaultPrompts = [
      'Drag an arrow from the electron-rich donor region (red) to the electron-poor acceptor center (blue).',
      'Connect the electron donor (red) to the polarized target site (blue).',
      'Multiple reactive sites: route the arrow between the strongest donor (extreme red) and the strongest electrophile (extreme blue).',
      'Select the primary reactive site (extreme red) and connect to the electrophilic center (extreme blue).',
      'Steric hindrance: orbit the view to find the open, accessible target site (blue) and connect from the donor (red).',
      'Bulky groups shield one site: orbit the view to target the accessible center (blue).',
      'Master challenge: identify the unhindered active site among multiple centers and route the arrow from the strongest donor.'
    ];

    const instruction = cfg.prompt && !cfg.prompt.includes('Draw a line between the two regions')
      ? cfg.prompt
      : (defaultPrompts[currentStageIdx] || 'Drag an arrow from the red donor region to the blue target region.');

    // 1. Render Quest HUD Overlay
    container.innerHTML = `
      <div class="quest-hud-overlay">
        <!-- Top HUD -->
        <div class="quest-hud-top">
          <div style="display: flex; gap: 1rem; align-items: center;">
            <a href="#/bridge" class="btn-secondary" style="font-size: 0.75rem; padding: 6px 12px; min-height: 36px; text-decoration: none;">
              Exit Quest
            </a>
            <div class="stage-pill-track">
              ${(questData?.stages || [0,1,2,3,4,5,6,7]).map((s, i) => `
                <div class="stage-dot ${i < currentStageIdx ? 'completed' : ''} ${i === currentStageIdx ? 'active' : ''}"
                     title="Stage ${i}"></div>
              `).join('')}
            </div>
          </div>

          <!-- Density Legend -->
          <div class="colormap-legend" style="min-width: 170px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.72rem; font-family: var(--font-mono); font-weight: 800;">
              <span style="color: #ff1744;">MOST DENSE (DONOR)</span>
              <span style="color: #00b0ff;">LEAST DENSE (ACCEPTOR)</span>
            </div>
            <div style="height: 8px; border-radius: 4px; background: linear-gradient(90deg, #ff1744 0%, #fbbf24 25%, #10b981 50%, #00b0ff 100%); box-shadow: 0 0 10px rgba(0, 176, 255, 0.2);"></div>
          </div>
        </div>

        <!-- Bottom Stage Card -->
        <div class="stage-card-wrap">
          <div class="stage-prompt-card" id="stage-card">
            <div class="scanning-sweep hidden" id="scanning-sweep"></div>

            <div class="stage-header">
              <div class="stage-title">Stage ${currentStageIdx + 1}</div>
              <div class="stage-xp-tag">+${stageMeta.xp || 20} XP</div>
            </div>

            <div class="stage-instruction">${instruction}</div>

            <!-- Move vs Draw Toolbar -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.75rem 0; flex-wrap: wrap; gap: 0.5rem;">
              <div style="display: flex; gap: 0.4rem;">
                <button type="button" id="tool-draw-btn" class="btn-secondary active" style="font-size: 0.75rem; padding: 5px 12px; min-height: 32px; border-color: var(--accent-amber); color: var(--accent-amber);">
                  ✏️ Draw Arrow
                </button>
                <button type="button" id="tool-rotate-btn" class="btn-secondary" style="font-size: 0.75rem; padding: 5px 12px; min-height: 32px;">
                  🔄 Rotate View
                </button>
              </div>
              <button type="button" id="tool-clear-btn" class="btn-secondary" style="font-size: 0.75rem; padding: 5px 12px; min-height: 32px;">
                ✕ Clear Line
              </button>
            </div>

            <div style="font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.25); border: 1px solid var(--border-durasteel); border-radius: var(--radius-sm); padding: 6px 10px; margin-bottom: 0.85rem; line-height: 1.4;">
              <div>• <strong>Draw:</strong> Left-click and drag from red to blue (or tap red, then tap blue).</div>
              <div>• <strong>Move view:</strong> Click 'Rotate View' or right-click drag anytime to orbit.</div>
            </div>

            <!-- Interactive Stage Area -->
            <div id="stage-interactive-area" style="margin-bottom: 1rem;"></div>

            <!-- Stage Footer Actions -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem;">
              <button type="button" id="grade-btn" class="btn-primary" style="padding: 8px 24px; min-height: 40px;">
                <span>Submit</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 2. Setup 3D or Fallback Inputs
    const interactiveArea = container.querySelector('#stage-interactive-area');

    if (tierManager.currentTier === 'T1' || !viewer) {
      // Tier 1 DOM-only fallback
      renderFallbackInputs(interactiveArea, cfg, stageMeta.kind, (payload) => {
        currentPayload = payload;
      });
    } else {
      // Tier 2 & 3: Configure 3D Viewer
      viewer.setMode('draw');
      viewer.loadStage(cfg, stageMeta.kind, (payload) => {
        currentPayload = payload;
      });

      // Bind toolbar
      const drawBtn = container.querySelector('#tool-draw-btn');
      const rotateBtn = container.querySelector('#tool-rotate-btn');
      const clearBtn = container.querySelector('#tool-clear-btn');

      drawBtn?.addEventListener('click', () => {
        drawBtn.classList.add('active');
        drawBtn.style.color = 'var(--accent-amber)';
        drawBtn.style.borderColor = 'var(--accent-amber)';
        rotateBtn?.classList.remove('active');
        if (rotateBtn) { rotateBtn.style.color = ''; rotateBtn.style.borderColor = ''; }
        viewer.setMode('draw');
      });

      rotateBtn?.addEventListener('click', () => {
        rotateBtn.classList.add('active');
        rotateBtn.style.color = 'var(--accent-amber)';
        rotateBtn.style.borderColor = 'var(--accent-amber)';
        drawBtn?.classList.remove('active');
        if (drawBtn) { drawBtn.style.color = ''; drawBtn.style.borderColor = ''; }
        viewer.setMode('rotate');
      });

      clearBtn?.addEventListener('click', () => {
        viewer.clear();
        currentPayload = null;
        showToast('Line cleared.', 'info');
      });

      // Also render DOM choice options for 'choice' stage if applicable
      if (stageMeta.kind === 'choice' && cfg.options) {
        interactiveArea.innerHTML = `
          <div class="choice-list">
            ${cfg.options.map(opt => `
              <div class="choice-option" data-opt-id="${opt.id}">
                <span style="font-family: var(--font-mono); font-weight: bold; color: var(--accent-amber);">${opt.id.toUpperCase()}</span>
                <span>${opt.label}</span>
              </div>
            `).join('')}
          </div>
        `;
        interactiveArea.querySelectorAll('.choice-option').forEach(el => {
          el.addEventListener('click', () => {
            interactiveArea.querySelectorAll('.choice-option').forEach(x => x.classList.remove('selected'));
            el.classList.add('selected');
            currentPayload = { correct: [el.getAttribute('data-opt-id')] };
          });
        });
      }
    }

    // 3. Bind Grade Button
    const gradeBtn = container.querySelector('#grade-btn');
    const sweep = container.querySelector('#scanning-sweep');

    gradeBtn.addEventListener('click', async () => {
      if (isGrading) return;
      if (!currentPayload) {
        showToast('Please connect an arrow from red to blue before submitting.', 'warning');
        return;
      }

      isGrading = true;
      gradeBtn.disabled = true;
      gradeBtn.textContent = 'Evaluating…';
      sweep.classList.remove('hidden');

      const elapsed = Date.now() - stageStartTime;

      try {
        await new Promise(r => setTimeout(r, 650));

        const res = await api.gradeStage(
          'q1',
          currentStageIdx,
          currentPayload,
          elapsed,
          hintUsed,
          tierManager.currentTier
        );

        sweep.classList.add('hidden');
        gradeBtn.disabled = false;
        gradeBtn.innerHTML = '<span>Submit</span><span>➔</span>';
        isGrading = false;

        if (res.correct) {
          if (viewer) viewer.triggerSuccessBloom();
          showToast(`Correct! +${res.xpAwarded} XP`, 'success');

          // Check if last stage completed
          const isLastStage = currentStageIdx >= ((questData?.stages?.length || 7) - 1);
          if (isLastStage) {
            setTimeout(() => {
              showCompletionModal();
            }, 1800);
          } else {
            setTimeout(() => {
              loadStage(currentStageIdx + 1);
            }, 2400);
          }
        } else {
          if (viewer) viewer.triggerShudder();
          const msg = res.blocked ? 'Path is blocked. Rotate to find an open path.' : `Incorrect. ${res.attemptsLeft ?? 2} attempt(s) remaining.`;
          showToast(msg, 'error');
        }
      } catch (err) {
        sweep.classList.add('hidden');
        gradeBtn.disabled = false;
        gradeBtn.innerHTML = '<span>Submit</span><span>➔</span>';
        isGrading = false;
        showToast(err.message || 'Submission error', 'error');
      }
    });
  }

  async function showCompletionModal() {
    try {
      const comp = await api.completeQuest('q1');
      const modal = document.getElementById('modal-container');
      if (!modal) return;

      modal.innerHTML = `
        <div class="glass-panel" style="max-width: 540px; width: 90%; margin: 4rem auto; text-align: center; border-color: var(--accent-green); box-shadow: 0 0 40px rgba(0, 230, 118, 0.25);">
          <h2 style="font-family: var(--font-display); font-size: 1.85rem; font-weight: 900; color: #fff; margin-bottom: 1rem;">
            Quest Complete
          </h2>

          <div style="background: rgba(14, 16, 21, 0.9); border: 1px solid var(--border-durasteel); border-radius: var(--radius-sm); padding: 1.25rem; margin-bottom: 1.5rem; text-align: left;">
            <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-amber); letter-spacing: 0.1em; margin-bottom: 0.5rem;">
              [ SYNTHESIS EPILOGUE ]
            </div>
            <p style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.6;">
              ${comp.epilogue}
            </p>
          </div>

          <div style="display: flex; justify-content: space-around; margin-bottom: 1.75rem;">
            <div>
              <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">XP YIELD</div>
              <div style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 800; color: var(--accent-amber);">+${comp.totalXp} XP</div>
            </div>
            <div>
              <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">SALVAGED MODULE</div>
              <div style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--accent-gold);">${comp.awardedItem}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Level</div>
              <div style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #82b1ff;">LVL ${comp.newLevel}</div>
            </div>
          </div>

          <button type="button" id="modal-bridge-btn" class="btn-primary" style="width: 100%;">
            Return to Bridge
          </button>
        </div>
      `;

      modal.classList.remove('hidden');
      modal.querySelector('#modal-bridge-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
        stage.exitQuestScene();
        window.location.hash = '#/bridge';
      });
    } catch (e) {
      window.location.hash = '#/bridge';
    }
  }

  if (questData) {
    loadStage(currentStageIdx);
  } else {
    container.innerHTML = `
      <div class="screen-container" style="max-width: 440px; margin: 4rem auto; text-align: center;">
        <div class="glass-panel" style="padding: 2.5rem;">
          <div style="font-size: 2rem; margin-bottom: 0.75rem;">🛰️</div>
          <h3 class="holo-title" style="font-size: 1.15rem; margin-bottom: 0.5rem;">Aligning Sensor Array</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">Connecting to quest beacon telemetry…</p>
        </div>
      </div>
    `;
  }

  // Fetch Manifest & Progress in background
  Promise.all([
    api.getQuestManifest('q1'),
    api.getMe().catch(() => null)
  ]).then(([manifest, me]) => {
    if (manifest) questData = manifest;
    if (me) {
      session.setUserData(me);
      const prog = (me.progress || []).find(p => p.quest_id === 'q1');
      if (prog && prog.stage_reached && questData?.stages) {
        currentStageIdx = Math.min(Number(prog.stage_reached), questData.stages.length - 1);
      }
    }
    if (questData) {
      loadStage(currentStageIdx);
    }
  }).catch(err => {
    console.error('Failed to load quest manifest:', err);
  });
}
