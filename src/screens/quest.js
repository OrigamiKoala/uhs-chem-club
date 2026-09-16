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
    <div class="concept-card" id="stage-concept-card">
      <div class="concept-card-header">
        <div class="concept-card-title-group">
          <span class="concept-badge">${concept.badge}</span>
          <span class="concept-card-title">${concept.title}</span>
        </div>
        <button type="button" class="concept-dismiss-btn" id="concept-dismiss-btn" title="Dismiss concept card" aria-label="Dismiss concept card">
          <span>✕</span>
          <span class="concept-dismiss-text">Dismiss</span>
        </button>
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
    <button type="button" class="concept-reopen-btn hidden" id="concept-reopen-btn" title="Show Key Concept Guide">
      <span>💡</span>
      <span>${concept.badge || 'KEY CONCEPT'}: Show Guide</span>
    </button>
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
    let stageCompleted = false;
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

    const totalStagesCount = STAGE_CONFIGS.length;
    const stageIndices = Array.from({ length: totalStagesCount }, (_, i) => i);

    // 1. Render Quest HUD Overlay
    container.innerHTML = `
      <div id="quest-screen-flash" class="quest-screen-flash"></div>
      <div class="quest-hud-overlay">
        <!-- Top HUD -->
        <div class="quest-hud-top">
          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <a href="#/bridge" class="btn-secondary" style="font-size: 0.75rem; padding: 6px 12px; min-height: 36px; text-decoration: none;">
              Exit Quest
            </a>
            <div class="stage-pill-track">
              ${stageIndices.map(i => `
                <div class="stage-dot ${i < currentStageIdx ? 'completed' : ''} ${i === currentStageIdx ? 'active' : ''}"
                     title="Stage ${i + 1}"></div>
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
              <div class="stage-xp-tag">+${stageMeta.xp || cfg.xp || 20} XP</div>
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
                ✕ Clear Line${cfg.multiArrow ? 's' : ''}
              </button>
            </div>

            ${currentStageIdx === 0 ? `
            <div style="font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.25); border: 1px solid var(--border-durasteel); border-radius: var(--radius-sm); padding: 6px 10px; margin-bottom: 0.85rem; line-height: 1.4;">
              <div>• <strong>Draw:</strong> Left-click and drag from red to blue.</div>
              <div>• <strong>Move view:</strong> Click 'Rotate View' or right-click drag anytime to orbit.</div>
            </div>
            ` : ''}

            ${cfg.multiArrow ? `
            <!-- Multi-Step Arrows HUD Tracker -->
            <div class="multi-step-track" id="multi-step-track">
              <div class="multi-step-header">
                <span>CHRONOLOGICAL STEPS (${cfg.steps ? cfg.steps.length : 2} REQUIRED)</span>
                <span style="color: var(--text-muted); font-size: 0.7rem;">Click ① to change order • Click arrow to delete</span>
              </div>
              <div class="multi-step-list" id="multi-step-list">
                <div style="font-size: 0.72rem; color: var(--text-muted); font-style: italic;">
                  No arrows drawn yet. Drag in 3D space to add Step 1!
                </div>
              </div>
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

    // Helper to update multi-step arrows list
    function updateMultiStepList(arrows = []) {
      const list = container.querySelector('#multi-step-list');
      if (!list) return;
      if (!arrows || arrows.length === 0) {
        list.innerHTML = `<div style="font-size: 0.72rem; color: var(--text-muted); font-style: italic;">No arrows drawn yet. Drag in 3D space to add Step 1!</div>`;
        return;
      }
      list.innerHTML = arrows.map((arr, idx) => `
        <div class="step-item-pill">
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="step-order-badge" data-step-idx="${idx}" title="Click to cycle step order">
              ${arr.order}
            </button>
            <span style="font-size: 0.75rem; color: #f1f5f9;">
              ${arr.from || 'Source'} ➔ ${arr.to || 'Target'}
            </span>
          </div>
          <button type="button" class="step-del-btn" data-del-idx="${idx}" title="Remove this arrow">
            ✕ Delete
          </button>
        </div>
      `).join('');

      list.querySelectorAll('.step-order-badge').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.getAttribute('data-step-idx'));
          if (viewer && viewer.arrowController) {
            viewer.arrowController.cycleArrowOrder(i);
          }
        });
      });

      list.querySelectorAll('.step-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.getAttribute('data-del-idx'));
          if (viewer && viewer.arrowController) {
            viewer.arrowController.removeArrow(i);
          }
        });
      });
    }

    // 2. Setup Concept Card Dismiss & Reopen
    const conceptCard = container.querySelector('#stage-concept-card');
    const dismissBtn = container.querySelector('#concept-dismiss-btn');
    const reopenBtn = container.querySelector('#concept-reopen-btn');

    dismissBtn?.addEventListener('click', () => {
      conceptCard?.classList.add('hidden');
      reopenBtn?.classList.remove('hidden');
    });

    reopenBtn?.addEventListener('click', () => {
      conceptCard?.classList.remove('hidden');
      reopenBtn?.classList.add('hidden');
    });

    // 3. Setup 3D or Fallback Inputs
    const interactiveArea = container.querySelector('#stage-interactive-area');

    if (tierManager.currentTier === 'T1' || !viewer) {
      // Tier 1 DOM-only fallback
      renderFallbackInputs(interactiveArea, cfg, cfg.multiArrow ? 'multi_arrow' : stageMeta.kind, (payload) => {
        currentPayload = payload;
        if (cfg.multiArrow) {
          updateMultiStepList(payload?.arrows || []);
        }
      });
    } else {
      // Tier 2 & 3: Configure 3D Viewer
      viewer.setMode('draw');
      viewer.loadStage(cfg, cfg.multiArrow ? 'multi_arrow' : stageMeta.kind, (payload) => {
        currentPayload = payload;
        if (cfg.multiArrow) {
          updateMultiStepList(payload?.arrows || []);
        }
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
        if (cfg.multiArrow) {
          updateMultiStepList([]);
        }
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

    // 3. Bind Grade Button and Submit Handler
    const gradeBtn = container.querySelector('#grade-btn');
    const sweep = container.querySelector('#scanning-sweep');

    async function submitStage(payload) {
      if (isGrading || isAdvancing) return;
      if (!payload || (cfg.multiArrow && (!payload.arrows || payload.arrows.length === 0))) {
        showToast(cfg.multiArrow ? `Please draw all ${cfg.steps?.length || 2} reaction arrows before submitting.` : 'Please connect an arrow from red to blue before submitting.', 'warning');
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
        const res = evaluateStageLocally(currentStageIdx, payload);

        // Asynchronously report submission to backend without blocking the player
        api.gradeStage(
          'q1',
          currentStageIdx,
          payload,
          elapsed,
          hintUsed,
          tierManager.currentTier
        ).catch(() => {});

        sweep.classList.add('hidden');

        if (res.correct) {
          isAdvancing = true;
          gradeBtn.disabled = true;
          gradeBtn.innerHTML = '<span>Reacting…</span><span>⚡</span>';

          if (session.player) {
            session.player.xp = (session.player.xp || 0) + res.xpAwarded;
            session.xp = (session.xp || 0) + res.xpAwarded;
            session.saveSession();
            session.notify();
          }

          // Keep explanation hidden while reaction animation is playing
          if (feedback) {
            feedback.className = 'hidden';
            feedback.innerHTML = '';
          }
          showToast(`Correct! +${res.xpAwarded} XP`, 'success');

          // Check if last stage completed
          const targetStageIdx = currentStageIdx + 1;
          const isLastStage = targetStageIdx >= STAGE_CONFIGS.length;

          const onReactionDone = () => {
            stageCompleted = true;
            isAdvancing = false;
            isGrading = false;

            // Explanation window pops up strictly AFTER the 3D animation finishes
            if (feedback) {
              feedback.className = 'stage-error-banner';
              feedback.style.borderColor = 'var(--accent-green)';
              feedback.style.borderLeftColor = 'var(--accent-green)';
              feedback.style.background = 'rgba(56, 176, 0, 0.2)';
              feedback.style.boxShadow = '0 0 20px rgba(56, 176, 0, 0.35)';

              const explanation = cfg.reaction?.explanation || 'Bond created! Molecules approached and bonded.';
              feedback.innerHTML = `
                <span style="font-size: 1.4rem;">⚡</span>
                <div style="flex: 1;">
                  <div style="font-weight: 800; color: #00e676; letter-spacing: 0.05em;">REACTION COMPLETE: NEW BOND FORMED!</div>
                  <div style="font-size: 0.85rem; color: #f1f5f9; margin-top: 3px; line-height: 1.45;">${explanation}</div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="font-size: 0.75rem; color: var(--accent-amber); font-family: var(--font-mono); font-weight: 700;">+${res.xpAwarded} XP AWARDED</div>
                    <button type="button" class="btn-primary" id="feedback-next-btn" style="padding: 6px 18px; font-size: 0.8rem; min-height: 34px;">
                      <span>${isLastStage ? 'Finish Quest' : 'Next Stage'}</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              `;

              const advBtn = feedback.querySelector('#feedback-next-btn');
              advBtn?.addEventListener('click', () => {
                if (isLastStage) {
                  showCompletionModal();
                } else {
                  loadStage(targetStageIdx);
                }
              });
            }

            gradeBtn.disabled = false;
            gradeBtn.innerHTML = isLastStage
              ? '<span>Finish Quest</span><span>✓</span>'
              : '<span>Next Stage</span><span>➔</span>';
            gradeBtn.focus();
          };

          if (viewer && viewer.playReaction && cfg.reaction) {
            viewer.playReaction(cfg.reaction, onReactionDone);
          } else {
            advanceTimer = setTimeout(onReactionDone, 1200);
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
          const isWrongOrder = !!res.wrongOrder;
          const isIncomplete = !!res.incomplete;
          let bannerTitle = 'INCORRECT';
          let msg = `Incorrect connection. Connect the crowded red zone directly into the hungry blue zone.`;

          if (isBlocked) {
            bannerTitle = 'PATH BLOCKED (TRAFFIC JAM)';
            msg = 'The molecule crashed into bulky surrounding atoms! That target is sterically hindered (too crowded). Rotate your 3D view to trace the open path into the accessible blue target.';
          } else if (isWrongOrder) {
            bannerTitle = 'WRONG CHRONOLOGICAL ORDER';
            msg = res.message || 'You found all the correct steps, but the sequence is out of order! Click on the arrow numbers to change their sequence.';
          } else if (isIncomplete) {
            bannerTitle = 'INCOMPLETE SEQUENCE';
            msg = res.message || 'Draw all required steps in order before submitting.';
          } else if (res.message) {
            msg = res.message;
          }

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
            if (isWrongOrder || isIncomplete) {
              feedback.style.borderColor = 'var(--accent-amber)';
              feedback.style.borderLeftColor = 'var(--accent-amber)';
              feedback.style.background = 'rgba(255, 159, 28, 0.15)';
              feedback.style.boxShadow = '0 0 15px rgba(255, 159, 28, 0.25)';
            } else {
              feedback.style.borderColor = '';
              feedback.style.borderLeftColor = '';
              feedback.style.background = '';
              feedback.style.boxShadow = '';
            }
            feedback.innerHTML = `
              <span style="font-size: 1.3rem; color: ${isWrongOrder || isIncomplete ? 'var(--accent-amber)' : '#ff5252'};">⚠️</span>
              <div style="flex: 1;">
                <div style="font-weight: 800; color: ${isWrongOrder || isIncomplete ? 'var(--accent-amber)' : '#ff5252'}; letter-spacing: 0.06em;">
                  ${bannerTitle}
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
    }

    gradeBtn.addEventListener('click', () => {
      if (stageCompleted) {
        const targetStageIdx = currentStageIdx + 1;
        const isLastStage = targetStageIdx >= STAGE_CONFIGS.length;
        if (isLastStage) {
          showCompletionModal();
        } else {
          loadStage(targetStageIdx);
        }
        return;
      }
      submitStage(currentPayload);
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

  let hasLoadedInitialStage = false;
  if (questData) {
    hasLoadedInitialStage = true;
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
        const reached = Math.min(Number(prog.stage_reached), questData.stages.length - 1);
        if (!hasLoadedInitialStage) {
          currentStageIdx = reached;
        }
      }
    }
    if (!hasLoadedInitialStage && questData) {
      hasLoadedInitialStage = true;
      loadStage(currentStageIdx);
    }
  }).catch(err => {
    console.error('Failed to load quest manifest:', err);
  });
}
