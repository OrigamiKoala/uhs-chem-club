/**
 * quest.js — Master Quest 1 player HUD & simulation runner
 * The Charge Gardens of Vareth-9
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { QuestViewer } from '../quest3d/viewer.js';
import { renderFallbackInputs } from '../fallback2d/stages.js';
import { showToast } from '../ui/toast.js';

export async function renderQuest(container) {
  let questData = null;
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

  // Fetch Manifest
  try {
    const manifest = await api.getQuestManifest('q1');
    questData = manifest;
    // Check progress
    const me = await api.getMe();
    session.setUserData(me);
    const prog = (me.progress || []).find(p => p.quest_id === 'q1');
    if (prog && prog.stage_reached) {
      currentStageIdx = Math.min(Number(prog.stage_reached), manifest.stages.length - 1);
    }
  } catch (err) {
    console.error('Failed to load quest manifest:', err);
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

          <!-- Colormap Legend (Cividis) -->
          <div class="colormap-legend">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: var(--cividis-100); font-weight: bold;">- CHARGE</span>
              <span style="color: #94a3b8;">+ CORE</span>
            </div>
            <div class="colormap-bar"></div>
            <div class="colormap-labels">
              <span>LONE PAIR</span>
              <span>NEUTRAL</span>
              <span>STARVED</span>
            </div>
          </div>
        </div>

        <!-- Bottom Stage Card -->
        <div class="stage-card-wrap">
          <div class="stage-prompt-card" id="stage-card">
            <div class="scanning-sweep hidden" id="scanning-sweep"></div>

            <div class="stage-header">
              <div class="stage-title">${cfg.title || `Stage ${currentStageIdx + 1}`}</div>
              <div class="stage-xp-tag">+${stageMeta.xp || 20} XP</div>
            </div>

            <div class="stage-instruction">${cfg.prompt || 'Analyze charge distribution and route reaction flow.'}</div>

            <!-- Interactive Stage Area -->
            <div id="stage-interactive-area" style="margin-bottom: 1rem;"></div>

            <!-- Hint Display -->
            <div id="hint-box" class="hidden" style="margin-bottom: 1rem; padding: 10px 14px; background: rgba(255, 179, 0, 0.12); border: 1px solid rgba(255, 179, 0, 0.3); border-radius: var(--radius-sm); font-size: 0.85rem; color: #ffecb3;"></div>

            <!-- Stage Footer Actions -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
              <button type="button" id="hint-btn" class="btn-secondary" style="font-size: 0.8rem; padding: 8px 14px; min-height: 40px;">
                Hint (${stageMeta.hint_cost || 0} XP)
              </button>
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
      viewer.loadStage(cfg, stageMeta.kind, (payload) => {
        currentPayload = payload;
      });

      // Also render DOM choice options for 'choice' stage
      if (stageMeta.kind === 'choice' && cfg.options) {
        interactiveArea.innerHTML = `
          <div class="choice-list">
            ${cfg.options.map(opt => `
              <div class="choice-option" data-opt-id="${opt.id}">
                <span style="font-family: var(--font-mono); font-weight: bold; color: var(--accent-cyan);">${opt.id.toUpperCase()}</span>
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

    // 3. Bind Hint Button
    const hintBtn = container.querySelector('#hint-btn');
    const hintBox = container.querySelector('#hint-box');
    hintBtn.addEventListener('click', async () => {
      try {
        const hint = await api.getHint('q1', currentStageIdx);
        hintUsed = true;
        hintBox.textContent = hint.hintText;
        hintBox.classList.remove('hidden');
        if (viewer && hint.highlightAnchors) {
          for (const a of hint.highlightAnchors) viewer.anchorManager.highlight(a, true);
        }
      } catch (e) {
        showToast('Hint unavailable', 'warning');
      }
    });

    // 4. Bind Grade Button
    const gradeBtn = container.querySelector('#grade-btn');
    const sweep = container.querySelector('#scanning-sweep');

    gradeBtn.addEventListener('click', async () => {
      if (isGrading) return;
      if (!currentPayload) {
        showToast('Please select or route the charge before submitting.', 'warning');
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
          if (currentStageIdx >= (questData.stages.length - 1)) {
            showCompletionModal();
          } else {
            setTimeout(() => {
              loadStage(currentStageIdx + 1);
            }, 900);
          }
        } else {
          if (viewer) viewer.triggerShudder();
          showToast(`Incorrect. ${res.attemptsLeft} attempt(s) remaining.`, 'error');
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

          <div style="background: rgba(3, 7, 18, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; text-align: left;">
            <div style="font-family: var(--font-display); font-size: 0.85rem; color: var(--accent-cyan); margin-bottom: 0.5rem;">
              Summary
            </div>
            <p style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.6;">
              ${comp.epilogue}
            </p>
          </div>

          <div style="display: flex; justify-content: space-around; margin-bottom: 1.75rem;">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">XP Earned</div>
              <div style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 800; color: var(--accent-amber);">+${comp.totalXp} XP</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Item Awarded</div>
              <div style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--accent-cyan);">${comp.awardedItem}</div>
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

  loadStage(currentStageIdx);
}
