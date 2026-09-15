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
import { STAGE_CONFIGS, evaluateStageLocally } from '../quest3d/evaluator.js';

function renderConceptCard(concept) {
  if (!concept) return '';
  return `
    <div class="concept-card">
      <div class="concept-card-header">
        <span class="concept-badge">${concept.badge}</span>
        <span class="concept-card-title">${concept.title}</span>
      </div>
      <div class="concept-card-intro">${concept.intro}</div>
      ${concept.pills && concept.pills.length ? `
        <div class="concept-grid">
          ${concept.pills.map(p => `
            <div class="concept-pill ${p.type}">${p.html}</div>
          `).join('')}
        </div>
      ` : ''}
      ${concept.action ? `
        <div class="concept-card-action">${concept.action}</div>
      ` : ''}
    </div>
  `;
}

export function renderQuest(container) {
  let questData = session.activeQuest || null;
  let currentStageIdx = 0;
  let currentPayload = null;
  let isGrading = false;
  let isAdvancing = false;
  let advanceTimer = null;
  let hintUsed = false;
  let attemptsLeft = 3;
  let stageStartTime = Date.now();
  let viewer = null;

  // Initialize 3D Quest Scene unless on Tier 1
  if (tierManager.currentTier !== 'T1' && stage.canvas) {
    viewer = new QuestViewer(stage.canvas);
    stage.setQuestScene(viewer);
  }

  function loadStage(idx) {
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    isAdvancing = false;
    isGrading = false;
    currentStageIdx = idx;
    currentPayload = null;
    hintUsed = false;
    attemptsLeft = 3;
    stageStartTime = Date.now();

    const localCfg = STAGE_CONFIGS[currentStageIdx] || STAGE_CONFIGS[0];
    const stageMeta = questData?.stages?.[currentStageIdx] || {
      stage_index: currentStageIdx,
      kind: 'arrow',
      xp: localCfg.xp,
      scene_config: {
        title: localCfg.title,
        prompt: localCfg.prompt,
        moleculeId: localCfg.moleculeId
      }
    };

    const cfg = {
      ...localCfg,
      ...(stageMeta.scene_config || {}),
      concept: localCfg.concept || null
    };

    const instruction = cfg.prompt || localCfg.prompt;

    // 1. Render Quest HUD Overlay
    container.innerHTML = `
      <div id="quest-screen-flash" class="quest-screen-flash"></div>
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
              <span style="color: #ff1744;">${currentStageIdx >= 1 ? 'MORE ELECTRONS (RED)' : 'MOST DENSE (DONOR)'}</span>
              <span style="color: #00b0ff;">${currentStageIdx >= 1 ? 'FEWER ELECTRONS (BLUE)' : 'LEAST DENSE (ACCEPTOR)'}</span>
            </div>
            <div style="height: 8px; border-radius: 4px; background: linear-gradient(90deg, #ff1744 0%, #fbbf24 25%, #10b981 50%, #00b0ff 100%); box-shadow: 0 0 10px rgba(0, 176, 255, 0.2);"></div>
          </div>
        </div>

        <!-- Bottom Stage Card -->
        <div class="stage-card-wrap">
          <div class="stage-prompt-card" id="stage-card">
            <div class="scanning-sweep hidden" id="scanning-sweep"></div>

            <div class="stage-header">
              <div class="stage-title">${cfg.title || ('Stage ' + (currentStageIdx + 1))}</div>
              <div class="stage-xp-tag">+${stageMeta.xp || 20} XP</div>
            </div>

            ${renderConceptCard(cfg.concept)}

            ${instruction ? `<div class="stage-instruction">${instruction}</div>` : ''}

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

            ${currentStageIdx === 0 ? `
            <div style="font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.25); border: 1px solid var(--border-durasteel); border-radius: var(--radius-sm); padding: 6px 10px; margin-bottom: 0.85rem; line-height: 1.4;">
              <div>• <strong>Draw:</strong> Left-click and drag from red to blue.</div>
              <div>• <strong>Move view:</strong> Click 'Rotate View' or right-click drag anytime to orbit.</div>
            </div>
            ` : ''}

            <!-- Interactive Stage Area -->
            <div id="stage-interactive-area" style="margin-bottom: 1rem;"></div>

            <!-- Prominent Inline Feedback Banner -->
            <div id="stage-feedback" class="hidden"></div>

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

      function clearFeedback() {
        const stageCard = container.querySelector('#stage-card');
        if (stageCard) stageCard.classList.remove('error-state');
        const feedback = container.querySelector('#stage-feedback');
        if (feedback) feedback.className = 'hidden';
      }

      clearBtn?.addEventListener('click', () => {
        viewer.clear();
        currentPayload = null;
        clearFeedback();
        showToast('Line cleared.', 'info');
      });

      drawBtn?.addEventListener('click', clearFeedback);
      rotateBtn?.addEventListener('click', clearFeedback);

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
            clearFeedback();
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
      if (isGrading || isAdvancing) return;
      if (!currentPayload) {
        showToast('Please connect an arrow from red to blue before submitting.', 'warning');
        return;
      }

      const stageCard = container.querySelector('#stage-card');
      const feedback = container.querySelector('#stage-feedback');
      const flash = container.querySelector('#quest-screen-flash');
      if (stageCard) stageCard.classList.remove('error-state');
      if (feedback) feedback.className = 'hidden';

      isGrading = true;
      gradeBtn.disabled = true;
      gradeBtn.textContent = 'Evaluating…';
      try {
        const elapsed = Date.now() - stageStartTime;

        // Immediate in-browser evaluation with pre-loaded solutions (0ms latency)
        const res = evaluateStageLocally(currentStageIdx, currentPayload);

        // Asynchronously report submission to backend without blocking the player
        api.gradeStage(
          'q1',
          currentStageIdx,
          currentPayload,
          elapsed,
          hintUsed,
          tierManager.currentTier
        ).catch(() => {});

        sweep.classList.add('hidden');

        if (res.correct) {
          isAdvancing = true;
          gradeBtn.disabled = true;
          gradeBtn.innerHTML = '<span>Correct!</span><span>✓</span>';

          if (session.player) {
            session.player.xp = (session.player.xp || 0) + res.xpAwarded;
            session.xp = (session.xp || 0) + res.xpAwarded;
            session.saveSession();
            session.notify();
          }
          if (viewer) viewer.triggerSuccessBloom();
          if (feedback) {
            feedback.className = 'stage-error-banner';
            feedback.style.borderColor = 'var(--accent-green)';
            feedback.style.borderLeftColor = 'var(--accent-green)';
            feedback.style.background = 'rgba(56, 176, 0, 0.2)';
            feedback.style.boxShadow = '0 0 20px rgba(56, 176, 0, 0.35)';

            const nextText = currentStageIdx === 0
              ? 'Stage 1 verified! Advancing to Stage 2: Introducing Electrons...'
              : (currentStageIdx === 3
                ? 'Target verified! Advancing to Stage 5: Tracing Molecule Paths & Steric Hindrance...'
                : 'Advancing to next stage...');

            feedback.innerHTML = `
              <span style="font-size: 1.25rem;">✓</span>
              <div>
                <div style="font-weight: 800; color: #00e676; letter-spacing: 0.05em;">CORRECT CONNECTION</div>
                <div style="font-size: 0.82rem; color: #f1f5f9; margin-top: 2px;">+${res.xpAwarded} XP Awarded. ${nextText}</div>
              </div>
            `;
          }
          showToast(`Correct! +${res.xpAwarded} XP`, 'success');

          // Check if last stage completed
          const targetStageIdx = currentStageIdx + 1;
          const isLastStage = targetStageIdx >= STAGE_CONFIGS.length;
          if (isLastStage) {
            advanceTimer = setTimeout(() => {
              showCompletionModal();
            }, 1200);
          } else {
            advanceTimer = setTimeout(() => {
              loadStage(targetStageIdx);
            }, 1200);
          }
        } else {
          gradeBtn.disabled = false;
          gradeBtn.innerHTML = '<span>Submit</span><span>➔</span>';
          isGrading = false;
          attemptsLeft = Math.max(0, attemptsLeft - 1);
          if (viewer) {
            if (viewer.triggerFailure) viewer.triggerFailure();
            else viewer.triggerShudder();
          }

          const isBlocked = !!res.blocked;
          const msg = isBlocked
            ? 'The molecule crashed into bulky surrounding atoms! That target is sterically hindered (too crowded). Rotate your 3D view to trace the open path into the accessible blue target.'
            : `Incorrect connection. ${attemptsLeft} attempt(s) remaining.`;

          // 1. Red screen flash
          if (flash) {
            flash.classList.add('flash-active');
            setTimeout(() => flash.classList.remove('flash-active'), 400);
          }

          // 2. Shake stage card with emergency red border glow
          if (stageCard) {
            stageCard.classList.remove('error-state');
            void stageCard.offsetWidth; // Force DOM reflow to re-trigger shake
            stageCard.classList.add('error-state');
          }

          // 3. Obvious inline error banner directly on stage card
          if (feedback) {
            feedback.className = 'stage-error-banner';
            feedback.style.borderColor = '';
            feedback.style.borderLeftColor = '';
            feedback.style.background = '';
            feedback.style.boxShadow = '';
            feedback.innerHTML = `
              <span style="font-size: 1.3rem; color: #ff5252;">⚠️</span>
              <div style="flex: 1;">
                <div style="font-weight: 800; color: #ff5252; letter-spacing: 0.06em;">
                  ${isBlocked ? 'PATH BLOCKED (STERIC HINDRANCE)' : 'INCORRECT'}
                </div>
                <div style="font-size: 0.82rem; color: #f1f5f9; margin-top: 2px; line-height: 1.4;">
                  ${msg}
                </div>
              </div>
            `;
          }

          showToast(msg, 'error');
        }
      } catch (err) {
        sweep.classList.add('hidden');
        gradeBtn.disabled = false;
        gradeBtn.innerHTML = '<span>Submit</span><span>➔</span>';
        isGrading = false;
        isAdvancing = false;
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
