/**
 * quest.js — Quest 1 player HUD & simulation runner
 * The Charge Gardens of Erebus
 */

import { api } from '../api.js';
import { session, levelTitle } from '../session.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { QuestViewer } from '../quest3d/viewer.js';
import { MOLECULE_DATA } from '../quest3d/molecule.js';
import { renderFallbackInputs } from '../fallback2d/stages.js';
import { showToast } from '../ui/toast.js';
import { showModal, closeModal } from '../ui/modal.js';
import { esc } from '../ui/layout.js';
import { STAGE_CONFIGS, evaluateStageLocally, diagnoseMiss, TOTAL_STAGES, TOTAL_QUEST_XP } from '../quest3d/evaluator.js';
import { soundscape } from '../audio/soundscape.js';
import { playCinematic } from '../ui/cinematic.js';
import { renderGardensMap } from '../ui/gardens-map.js';
import { createTransmissionElement } from '../ui/transmission.js';
import { QUEST1_STORY } from '../story/quest1.js';

const QUEST_ID = 'q1';

/**
 * Stages that introduce a genuinely new mechanic and earn an auto-shown briefing.
 * Every other stage starts immediately — its title and prompt are already visible
 * in the stage card, and the Objective button reopens the briefing on demand.
 * - 0 (Stage 1): first contact, drag controls + scan intro concept
 * - 4 (Stage 5): first blocked path, rotate-the-view
 * - 7 (Stage 8): first three-molecule chamber, ignore-the-bystander
 * - 10 (Stage 11): first multi-arrow stage, numbered badges intro concept
 * Stages with conceptTiming 'intro' always qualify as well, so future control
 * changes stay covered without editing this list.
 */
const AUTO_MODAL_STAGES = new Set([0, 4, 7, 10]);

const INTRO_SEEN_KEY = `avalon_${QUEST_ID}_intro_seen`;

function hasSeenStageIntro(idx) {
  try {
    const seen = JSON.parse(localStorage.getItem(INTRO_SEEN_KEY) || '[]');
    return Array.isArray(seen) && seen.includes(idx);
  } catch (e) {
    return false;
  }
}

function markStageIntroSeen(idx) {
  try {
    const seen = JSON.parse(localStorage.getItem(INTRO_SEEN_KEY) || '[]');
    const arr = Array.isArray(seen) ? seen : [];
    if (!arr.includes(idx)) {
      arr.push(idx);
      localStorage.setItem(INTRO_SEEN_KEY, JSON.stringify(arr));
    }
  } catch (e) {}
}

function shouldAutoShowStageModal(cfg, idx, isReplay) {
  if (isReplay) return false;
  if (hasSeenStageIntro(idx)) return false;
  if (cfg.conceptTiming === 'intro') return true;
  return AUTO_MODAL_STAGES.has(idx);
}

/**
 * The hint ladder. Rung 0 is free and asks a question; rung 1 narrows the field and
 * rung 2 names the move, and both have to be earned.
 */
const HINT_RUNGS = [
  { label: 'Nudge', unlocked: () => true, locked: '' },
  {
    label: 'Narrow it down',
    unlocked: (misses, elapsedMs) => misses >= 1 || elapsedMs >= 45000,
    locked: 'Try once first. Opens after an attempt, or a little more time.'
  },
  {
    label: 'Show the move',
    unlocked: (misses) => misses >= 2,
    locked: 'Opens after two attempts.'
  }
];

function renderConceptCard(concept) {
  if (!concept) return '';
  return `
    <div class="concept-card" style="margin-top: 0.75rem;">
      <div class="concept-card-header">
        <div class="concept-card-title-group">
          <span class="concept-badge">${esc(concept.badge)}</span>
          <span class="concept-card-title">${esc(concept.title)}</span>
        </div>
      </div>
      <div class="concept-card-intro">${esc(concept.intro)}</div>
      ${concept.pills && concept.pills.length ? `
        <div class="concept-grid">
          ${concept.pills.map(p => `
            <div class="concept-pill ${p.type}">${p.html}</div>
          `).join('')}
        </div>
      ` : ''}
      ${concept.action ? `
        <div class="concept-card-action">${esc(concept.action)}</div>
      ` : ''}
    </div>
  `;
}

function showStageModal(cfg, currentStageIdx, isReplay, stageXp) {
  const isMulti = Boolean(cfg.multiArrow);
  const requiredArrows = isMulti ? (cfg.steps?.length || 2) : 1;
  const introConcept = cfg.concept && cfg.conceptTiming === 'intro' ? cfg.concept : null;
  const b = QUEST1_STORY.briefing;

  if (currentStageIdx === 0 && b) {
    showModal(`
      <div class="quest-modal-head" style="text-align: center; margin-bottom: 1.15rem;">
        <h2 id="stage-modal-title" class="page-title" style="font-size: 1.35rem; margin-top: 0.25rem;">
          Stage 1 · ${esc(cfg.title || 'Target Lock')}
        </h2>
        <div style="margin-top: 0.35rem; display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="tag live">Stage 1 of ${TOTAL_STAGES}</span>
          ${isReplay ? '<span class="tag">Replay</span>' : `<span class="tag live">+${stageXp} XP</span>`}
        </div>
      </div>

      <div style="background: var(--plate-100); border: 1px solid var(--border-durasteel); padding: 1rem 1.15rem; margin-bottom: 1.15rem; font-size: 0.95rem; line-height: 1.55; color: var(--text-bright);">
        ${cfg.prompt ? esc(cfg.prompt) : 'Connect the molecules to trigger the reaction.'}
      </div>

      ${introConcept ? renderConceptCard(introConcept) : ''}

      <div style="margin-top: 1.15rem;">
        <button type="button" id="modal-start-stage-btn" class="btn-primary" style="width: 100%; padding: 11px 0; font-size: 0.92rem; letter-spacing: 0.08em;">
          Start Stage
        </button>
      </div>
    `, { labelledBy: 'stage-modal-title' });

    document.getElementById('modal-start-stage-btn')?.addEventListener('click', () => {
      closeModal();
      soundscape.playNavRelayClick();
    });
    return;
  }

  showModal(`
    <div class="quest-modal-head" style="text-align: center; margin-bottom: 1.25rem;">
      <h2 id="stage-modal-title" class="page-title" style="font-size: 1.35rem; margin-top: 0.3rem;">
        Stage ${currentStageIdx + 1} · ${esc(cfg.title || ('Stage ' + (currentStageIdx + 1)))}
      </h2>
      <div style="margin-top: 0.4rem;">
        ${isReplay ? '<span class="tag">Replay</span>' : `<span class="tag live">+${stageXp} XP</span>`}
      </div>
    </div>

    <div style="background: var(--plate-100); border: 1px solid var(--border-durasteel); padding: 1rem 1.15rem; margin-bottom: 1.25rem; font-size: 0.95rem; line-height: 1.55; color: var(--text-bright);">
      ${cfg.prompt ? esc(cfg.prompt) : 'Connect the molecules to trigger the reaction.'}
    </div>

    ${isMulti ? `
      <div style="background: var(--plate-200); border-left: 2px solid var(--accent-amber); padding: 8px 12px; margin-bottom: 1.25rem; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">
        <strong>Task:</strong> ${requiredArrows} arrows in sequence. Click an arrow's number to change its step order; click an arrow line to delete it.
      </div>
    ` : ''}

    ${introConcept ? renderConceptCard(introConcept) : ''}

    <div style="margin-top: 1.25rem;">
      <button type="button" id="modal-start-stage-btn" class="btn-primary" style="width: 100%; padding: 10px 0; font-size: 0.9rem;">
        Start Stage
      </button>
    </div>
  `, { labelledBy: 'stage-modal-title' });

  document.getElementById('modal-start-stage-btn')?.addEventListener('click', () => {
    closeModal();
    soundscape.playNavRelayClick();
  });
}

export function renderQuest(container) {
  let questData = session.activeQuest || null;
  let currentStageIdx = 0;
  // How many stages the player has cleared: 0..TOTAL_STAGES. A finished quest sits at
  // TOTAL_STAGES, which is one past the last playable index — clamping this to
  // TOTAL_STAGES - 1 used to make the final stage look unfinished and, worse, made it
  // read as "not yet cleared", so replaying it paid XP again.
  let maxStageReached = 0;
  /** Highest stage index the player may open. */
  const navMaxIdx = () => Math.min(maxStageReached, TOTAL_STAGES - 1);

  // Resume where the player left off.
  try {
    const savedStage = parseInt(localStorage.getItem(`avalon_${QUEST_ID}_stage_reached`), 10);
    if (!isNaN(savedStage) && savedStage >= 0) {
      maxStageReached = Math.min(savedStage, TOTAL_STAGES);
      currentStageIdx = navMaxIdx();
    }
  } catch (e) {}

  const prog = (session.progress || []).find(p => p.quest_id === QUEST_ID);
  if (prog && typeof prog.stage_reached === 'number') {
    const reached = Math.min(Number(prog.stage_reached), TOTAL_STAGES);
    if (reached > maxStageReached) {
      maxStageReached = reached;
      currentStageIdx = navMaxIdx();
    }
  }

  // A finished quest re-opens at Pylon 1 — every stage is unlocked, nothing pays XP
  // again, and "Replay Gardens" on the Bridge should not drop the player on the last
  // stage of a quest they have already cleared.
  const questComplete = maxStageReached >= TOTAL_STAGES;
  if (questComplete) currentStageIdx = 0;

  let currentPayload = null;
  let isGrading = false;
  let isAdvancing = false;
  let advanceTimer = null;
  let hintUsed = false;
  let stageStartTime = Date.now();
  let viewer = null;
  let activeTransmission = null;
  let gradeObserver = null;

  // Per-stage, reset by loadStage.
  let misses = 0;
  let hintRung = -1;          // highest hint rung revealed so far
  let usedSolutionHint = false;

  // Survives stage changes: consecutive stages solved first try without the
  // solution rung. Display only — it pays no XP, so the once-per-stage flat XP
  // rule is untouched.
  let cleanStreak = 0;

  // Initialize 3D Quest Scene unless on Tier 1
  const isT4 = tierManager.currentTier === 'T4';

  if (isT4) {
    stage.enterWorldScene();
    if (stage.fpsControls && QUEST1_STORY.arrival?.cinematic) {
      stage.fpsControls.enabled = false;
    }
    if (stage.worldScene) {
      stage.worldScene.setClearedStages(new Set(Array.from({ length: maxStageReached }, (_, i) => i + 1)));
    }
  } else if (tierManager.currentTier !== 'T1' && stage.canvas) {
    viewer = new QuestViewer(stage.canvas);
    stage.setQuestScene(viewer);
  }

  function renderErebusHUD() {
    container.innerHTML = `
      <div class="erebus-world-hud">
        <div class="erebus-hud-card">
          <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.35rem;">
            <a href="#/bridge" class="btn-secondary quest-btn-sm" style="text-decoration: none; font-size: 0.7rem;">
              ← Bridge
            </a>
            <span class="eyebrow lit" style="font-size: 0.68rem;">EREBUS</span>
          </div>
          <div style="font-family: var(--font-display); font-size: 0.85rem; font-weight: 700; color: var(--text-bright); text-transform: uppercase;">
            The Charge Gardens
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-gold); margin-top: 0.2rem;">
            Stage ${Math.min(maxStageReached + 1, TOTAL_STAGES)} of ${TOTAL_STAGES}
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted); margin-top: 0.35rem;">
            WASD: Move · Drag: Look · E: Interact
          </div>
        </div>

        <div class="erebus-hud-card" style="min-width: 220px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="eyebrow lit">STAGES</span>
            <span class="tag live">${maxStageReached} / ${TOTAL_STAGES} CLEARED</span>
          </div>
          ${renderGardensMap({ clearedCount: maxStageReached, currentStageIdx: Math.min(maxStageReached, TOTAL_STAGES - 1), compact: true })}
        </div>
      </div>
    `;

    container.querySelectorAll('.gardens-map-pylon.reachable, .gardens-map-pylon.cleared').forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-stage-idx'), 10);
        if (!isNaN(idx) && idx <= maxStageReached) {
          deployChamber(idx);
        }
      });
    });
  }

  function deployChamber(idx) {
    if (stage.canvas) {
      viewer = new QuestViewer(stage.canvas);
      stage.setQuestScene(viewer);
    }
    loadStage(idx);
  }

  function exitChamber() {
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    if (gradeObserver) {
      gradeObserver.disconnect();
      gradeObserver = null;
    }
    if (activeTransmission?.destroy) {
      activeTransmission.destroy();
      activeTransmission = null;
    }
    stage.exitQuestScene();
    renderErebusHUD();
  }

  const onPylonInteract = (e) => {
    if (!isT4) return;
    const site = e.detail;
    if (!site) return;
    const targetIdx = site.stage - 1;
    if (targetIdx > maxStageReached) {
      showToast(`Pylon ${site.stage} is dormant. Calibrate preceding conduit relays first.`, 'info');
      return;
    }
    deployChamber(targetIdx);
  };
  window.addEventListener('pylon:interact', onPylonInteract);

  const cleanupPylon = () => {
    window.removeEventListener('pylon:interact', onPylonInteract);
    window.removeEventListener('hashchange', cleanupPylon);
  };
  window.addEventListener('hashchange', cleanupPylon);

  function loadStage(idx) {
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    if (gradeObserver) {
      gradeObserver.disconnect();
      gradeObserver = null;
    }
    if (activeTransmission?.destroy) {
      activeTransmission.destroy();
      activeTransmission = null;
    }
    isAdvancing = false;
    isGrading = false;
    let stageCompleted = false;
    currentStageIdx = idx;
    currentPayload = null;
    hintUsed = false;
    stageStartTime = Date.now();
    misses = 0;
    hintRung = -1;
    usedSolutionHint = false;

    const localCfg = STAGE_CONFIGS[currentStageIdx] || STAGE_CONFIGS[0];
    const stageMeta = questData?.stages?.[currentStageIdx] || {
      stage_index: currentStageIdx,
      kind: localCfg.multiArrow ? 'multi_arrow' : 'arrow',
      xp: localCfg.xp,
      scene_config: {
        title: localCfg.title,
        prompt: localCfg.prompt,
        moleculeId: localCfg.moleculeId
      }
    };

    // The bundled configs are authoritative for everything the player sees, draws
    // or is graded on. Backend scene_config is only trusted for transport-level
    // fields — a stale Sheets row must never swap in another stage's molecule
    // (Stage 8 once rendered Stage 7's atoms) or desync the reaction animation.
    const regions = MOLECULE_DATA[localCfg.moleculeId]?.regions || [];
    const cfg = {
      ...localCfg,
      ...(stageMeta.scene_config || {}),
      // Player-facing copy stays bundled.
      title: localCfg.title,
      prompt: localCfg.prompt,
      hint: localCfg.hint,
      hints: localCfg.hints,
      shape: localCfg.shape,
      steps: localCfg.steps,
      concept: localCfg.concept || null,
      conceptTiming: localCfg.conceptTiming || 'reward',
      // Gameplay truth stays bundled.
      moleculeId: localCfg.moleculeId,
      expectedFrom: localCfg.expectedFrom,
      expectedTo: localCfg.expectedTo,
      sourcePos: localCfg.sourcePos,
      targetPos: localCfg.targetPos,
      tolerance: localCfg.tolerance,
      blockedAnchor: localCfg.blockedAnchor,
      blockedPos: localCfg.blockedPos,
      multiArrow: localCfg.multiArrow,
      maxArrows: localCfg.maxArrows,
      reaction: localCfg.reaction,
      xp: localCfg.xp,
      anchors: regions.map(r => r.id),
      regions
    };

    const isMulti = Boolean(cfg.multiArrow);
    const requiredArrows = isMulti ? (cfg.steps?.length || 2) : 1;
    // A stage the player has already cleared: replayable, but it cannot pay out twice.
    const isReplay = currentStageIdx < maxStageReached;
    // Displayed XP must match what evaluateStageLocally awards (local cfg.xp),
    // otherwise the "+N XP" tag contradicts the grading result.
    const stageXp = localCfg.xp || stageMeta.xp || 20;

    const pylonStory = QUEST1_STORY.pylons[currentStageIdx];
    const initialText = currentStageIdx === 0
      ? (QUEST1_STORY.briefing?.message || QUEST1_STORY.guildOpeners[session.guild] || QUEST1_STORY.guildOpeners.neutral)
      : (pylonStory?.transmission || 'Calibrate your sensors.');

    // 1. Render Quest HUD Overlay
    container.innerHTML = `
      <div id="quest-screen-flash" class="quest-screen-flash"></div>
      <div class="quest-hud-overlay">
        <!-- Top HUD -->
        <div class="quest-hud-top">
          <div class="quest-nav-cluster">
            <button type="button" id="quest-exit-btn" class="btn-secondary quest-btn-sm" title="${isT4 ? 'Return to Erebus surface' : 'Return to bridge'}">
              ${isT4 ? '← Surface' : '← Exit'}
            </button>
            <button type="button" id="prev-stage-btn" class="btn-secondary quest-btn-sm" ${currentStageIdx === 0 ? 'disabled' : ''} title="Previous stage" aria-label="Previous stage">
              ◀
            </button>
            <div class="stage-counter" aria-live="polite">
              STAGE <strong>${currentStageIdx + 1}</strong> / ${TOTAL_STAGES}
            </div>
            <div class="clean-streak ${cleanStreak > 0 ? '' : 'hidden'}" id="clean-streak" title="Stages solved first try, without the solution hint">
              ${cleanStreak} CLEAN
            </div>
            <button type="button" id="next-stage-btn" class="btn-secondary quest-btn-sm" ${currentStageIdx >= navMaxIdx() ? 'disabled' : ''} title="Next stage" aria-label="Next stage">
              ▶
            </button>
            <div class="stage-pill-track" role="group" aria-label="Stage progress">
              ${Array.from({ length: TOTAL_STAGES }, (_, i) => `
                <button type="button" class="stage-dot ${i < maxStageReached ? 'completed' : ''} ${i === currentStageIdx ? 'active' : ''} ${i <= navMaxIdx() ? 'clickable' : ''}"
                     data-stage-idx="${i}"
                     ${i > navMaxIdx() ? 'disabled' : ''}
                     aria-label="Stage ${i + 1}${i > navMaxIdx() ? ' (locked)' : ''}"
                     title="Stage ${i + 1}${i > navMaxIdx() ? ' (locked)' : ''}"></button>
              `).join('')}
            </div>
          </div>

          <!-- Compact Gardens Relay Grid -->
          <div class="quest-gardens-slot">
            ${renderGardensMap({ clearedCount: maxStageReached, currentStageIdx, compact: true })}
          </div>

          <!-- Density Legend -->
          <div class="colormap-legend" style="min-width: 168px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.62rem; letter-spacing: 0.16em;">
              <span style="color: var(--charge-red-ink);">NEGATIVE</span>
              <span style="color: var(--charge-blue-ink);">POSITIVE</span>
            </div>
            <div style="height: 6px; background: linear-gradient(90deg, var(--charge-red) 0%, var(--plate-500) 50%, var(--charge-blue) 100%);"></div>
          </div>
        </div>

        <!-- Bottom Stage Deck -->
        <div class="stage-card-wrap">
          <div class="stage-dock-bar hidden" id="stage-dock-bar">
            <button type="button" id="stage-card-open-btn" class="btn-secondary quest-btn-sm stage-reopen-btn" title="Open stage panel" aria-label="Open stage panel">
              Stage Panel
            </button>
            <button type="button" id="stage-dock-grade-btn" class="btn-primary quest-btn-sm" title="Submit answer">
              Submit
            </button>
          </div>
          <div class="stage-prompt-card" id="stage-card">
            <div class="stage-header" style="margin-bottom: 0.4rem; padding-bottom: 0.4rem;">
              <div class="stage-header-main" style="display: flex; align-items: center; gap: 0.6rem;">
                <span class="stage-title">${cfg.title || ('Stage ' + (currentStageIdx + 1))}</span>
                ${isReplay ? '<span class="tag">Replay</span>' : `<span class="tag live">+${stageXp} XP</span>`}
              </div>
              <div class="stage-header-actions" style="display: flex; gap: 0.4rem; align-items: center;">
                <button type="button" id="stage-info-btn" class="btn-secondary quest-btn-sm" title="Instructions">
                  Instructions
                </button>
                <button type="button" id="stage-card-close-btn" class="btn-secondary quest-btn-sm" title="Close stage panel" aria-label="Close stage panel">
                  Close
                </button>
              </div>
            </div>

            <div class="stage-instruction" style="font-size: 0.88rem; line-height: 1.45; color: var(--text-bright); margin-bottom: 0.4rem;">
              ${esc(cfg.prompt || '')}
            </div>

            <!-- Toolbar -->
            <div class="stage-toolbar" style="margin: 0.4rem 0;">
              <div class="stage-toolbar-left">
                ${isMulti ? `
                  <span class="arrow-counter" id="arrow-counter" aria-live="polite">
                    Arrows: <strong id="arrow-count">0</strong> / ${requiredArrows}
                  </span>
                ` : ''}
                <span class="stage-tip">Drag to connect · right-drag to rotate</span>
              </div>
              <div class="stage-toolbar-right">
                ${(cfg.hints || []).length ? `
                  <button type="button" id="hint-btn" class="btn-secondary quest-btn-sm">
                    Hint <span class="hint-rung-count" id="hint-rung-count">1/${cfg.hints.length}</span>
                  </button>
                ` : ''}
                <button type="button" id="tool-clear-btn" class="btn-secondary quest-btn-sm">
                  Clear
                </button>
                <button type="button" id="grade-btn" class="btn-primary" style="padding: 7px 22px; min-height: 34px;">Submit</button>
              </div>
            </div>

            <!-- Interactive Stage Area (Tier 1 fallback inputs live here) -->
            <div id="stage-interactive-area"></div>

            <!-- Hint / feedback banners -->
            <div id="stage-hint" class="hint-stack hidden" role="status"></div>
            <div id="stage-feedback" class="hidden"></div>
          </div>
        </div>
      </div>
    `;

    // Briefing modal only for genuinely new mechanics — every other stage starts
    // immediately. The Objective button above reopens it on demand.
    if (shouldAutoShowStageModal(cfg, currentStageIdx, isReplay)) {
      markStageIntroSeen(currentStageIdx);
      showStageModal(cfg, currentStageIdx, isReplay, stageXp);
    }

    const stageCard = container.querySelector('#stage-card');
    const feedback = container.querySelector('#stage-feedback');
    const hintBanner = container.querySelector('#stage-hint');
    const flash = container.querySelector('#quest-screen-flash');
    const arrowCountEl = container.querySelector('#arrow-count');

    function clearFeedback() {
      if (stageCard) stageCard.classList.remove('error-state');
      if (feedback) {
        feedback.className = 'hidden';
        feedback.innerHTML = '';
        feedback.removeAttribute('style');
      }
    }

    function onPayloadChange(payload) {
      currentPayload = payload;
      if (arrowCountEl) {
        arrowCountEl.textContent = String(payload?.arrows?.length || 0);
      }
      if (!stageCompleted) clearFeedback();
    }

    // Stage instructions / info modal trigger
    container.querySelector('#stage-info-btn')?.addEventListener('click', () => {
      showStageModal(cfg, currentStageIdx, isReplay, stageXp);
    });

    const dockBar = container.querySelector('#stage-dock-bar');
    const closeBtn = container.querySelector('#stage-card-close-btn');
    const openBtn = container.querySelector('#stage-card-open-btn');
    const dockGradeBtn = container.querySelector('#stage-dock-grade-btn');

    function syncDockGradeBtn() {
      if (!dockGradeBtn || !gradeBtn) return;
      dockGradeBtn.textContent = gradeBtn.textContent;
      dockGradeBtn.disabled = gradeBtn.disabled;
      dockGradeBtn.title = gradeBtn.textContent;
    }

    function setCardClosed(closed) {
      if (closed) {
        stageCard?.classList.add('hidden');
        dockBar?.classList.remove('hidden');
        openBtn?.focus();
      } else {
        stageCard?.classList.remove('hidden');
        dockBar?.classList.add('hidden');
        closeBtn?.focus();
      }
      syncDockGradeBtn();
    }

    closeBtn?.addEventListener('click', () => {
      setCardClosed(true);
      soundscape.playNavRelayClick();
    });

    openBtn?.addEventListener('click', () => {
      setCardClosed(false);
      soundscape.playNavRelayClick();
    });

    dockGradeBtn?.addEventListener('click', () => {
      gradeBtn?.click();
      syncDockGradeBtn();
    });

    container.querySelector('#quest-exit-btn')?.addEventListener('click', () => {
      if (isT4) {
        exitChamber();
      } else {
        window.location.hash = '#/bridge';
      }
    });

    // 2. Stage navigation
    container.querySelector('#prev-stage-btn')?.addEventListener('click', () => {
      if (currentStageIdx > 0) loadStage(currentStageIdx - 1);
    });
    container.querySelector('#next-stage-btn')?.addEventListener('click', () => {
      if (currentStageIdx < navMaxIdx()) loadStage(currentStageIdx + 1);
    });
    container.querySelectorAll('.stage-dot.clickable').forEach(dot => {
      dot.addEventListener('click', () => {
        const targetIdx = Number(dot.getAttribute('data-stage-idx'));
        if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx <= navMaxIdx() && targetIdx !== currentStageIdx) {
          loadStage(targetIdx);
        }
      });
    });

    // 5. Hint ladder
    const hintBtn = container.querySelector('#hint-btn');
    const hintRungCount = container.querySelector('#hint-rung-count');
    const availableHints = cfg.hints || [];

    function renderHints() {
      if (!hintBanner) return;
      if (hintRung < 0) {
        hintBanner.classList.add('hidden');
        hintBanner.innerHTML = '';
        return;
      }
      hintBanner.classList.remove('hidden');
      hintBanner.innerHTML = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
          <button type="button" class="banner-dismiss-btn" id="dismiss-hints-btn" title="Hide hints" aria-label="Hide hints">✕</button>
        </div>
        ${availableHints.slice(0, hintRung + 1).map((text, i) => `
          <div class="hint-rung ${i === hintRung ? 'fresh' : ''}">
            <span class="hint-rung-label">${esc(HINT_RUNGS[i]?.label || 'Hint')}</span>
            <span class="hint-rung-text">${text}</span>
          </div>
        `).join('')}
      `;
      hintBanner.querySelector('#dismiss-hints-btn')?.addEventListener('click', () => {
        hintBanner.classList.add('hidden');
      });
      if (hintRungCount) {
        const next = hintRung + 2;
        hintRungCount.textContent = next > availableHints.length
          ? `${availableHints.length}/${availableHints.length}`
          : `${next}/${availableHints.length}`;
      }
      if (hintBtn && hintRung >= availableHints.length - 1) {
        hintBtn.disabled = true;
        hintBtn.innerHTML = '◈ No hints left';
      }
    }

    hintBtn?.addEventListener('click', () => {
      const next = hintRung + 1;
      if (next >= availableHints.length) return;

      const rung = HINT_RUNGS[next] || HINT_RUNGS[0];
      if (!rung.unlocked(misses, Date.now() - stageStartTime)) {
        showToast(rung.locked, 'warning');
        hintBtn.classList.remove('nudge');
        return;
      }

      hintRung = next;
      hintUsed = true;
      if (next >= 2) usedSolutionHint = true;
      hintBtn.classList.remove('nudge');
      renderHints();
      // Log the hint request for the club's telemetry; never block on it.
      api.getHint(QUEST_ID, currentStageIdx).catch(() => {});
    });

    // 6. Interactive inputs — 3D viewer, or DOM controls on Tier 1
    const interactiveArea = container.querySelector('#stage-interactive-area');
    const interactionKind = isMulti ? 'multi_arrow' : 'arrow';
    const usingFallback = tierManager.currentTier === 'T1' || !viewer;

    if (usingFallback) {
      stageCard?.classList.add('stage-card-fallback');
      renderFallbackInputs(interactiveArea, cfg, interactionKind, onPayloadChange);
    } else {
      viewer.setMode('draw');
      viewer.loadStage(cfg, interactionKind, onPayloadChange);
      viewer.setArrowLimitHandler((max) => {
        showToast(`${max} arrows max. Click an arrow to delete it.`, 'warning');
      });
    }

    container.querySelector('#tool-clear-btn')?.addEventListener('click', () => {
      if (usingFallback) {
        // Rebuild the dropdowns — there is no canvas to clear on Tier 1.
        renderFallbackInputs(interactiveArea, cfg, interactionKind, onPayloadChange);
      } else {
        viewer.clear();
      }
      currentPayload = null;
      if (arrowCountEl) arrowCountEl.textContent = '0';
      clearFeedback();
      showToast(isMulti ? 'Arrows cleared.' : 'Line cleared.', 'info');
    });

    // 7. Submit
    const gradeBtn = container.querySelector('#grade-btn');

    if (gradeBtn) {
      gradeObserver = new MutationObserver(() => syncDockGradeBtn());
      gradeObserver.observe(gradeBtn, { attributes: true, childList: true, characterData: true, subtree: true });
    }
    syncDockGradeBtn();

    async function submitStage(payload) {
      if (isGrading || isAdvancing) return;

      const drawn = isMulti ? (payload?.arrows?.length || 0) : (payload ? 1 : 0);
      if (drawn === 0) {
        showToast('Nothing drawn yet. Drag an arrow between two sites.', 'warning');
        return;
      }
      if (isMulti && drawn < requiredArrows) {
        showToast(`${requiredArrows} arrows needed — ${drawn} drawn.`, 'warning');
        return;
      }

      clearFeedback();
      isGrading = true;
      gradeBtn.disabled = true;
      gradeBtn.textContent = 'Checking…';

      try {
        const elapsed = Date.now() - stageStartTime;

        // Immediate in-browser evaluation with pre-loaded solutions (0ms latency)
        const res = evaluateStageLocally(currentStageIdx, payload);

        // Report the submission to the backend without making the player wait.
        api.gradeStage(QUEST_ID, currentStageIdx, payload, elapsed, hintUsed, tierManager.currentTier)
          .catch(() => {});

        if (res.correct) {
          isAdvancing = true;
          gradeBtn.disabled = true;
          gradeBtn.textContent = 'Reacting…';

          soundscape.playBondSnap();
          soundscape.playPylonWake();

          // XP is paid once per stage. Replays are free to practise but pay nothing,
          // otherwise the Prev button would be an infinite XP button.
          const awarded = isReplay ? 0 : res.xpAwarded;
          if (awarded > 0) session.addXp(awarded);

          const targetStageIdx = currentStageIdx + 1;
          maxStageReached = Math.max(maxStageReached, targetStageIdx);
          session.recordProgress(QUEST_ID, maxStageReached);

          const isCleanSolve = misses === 0 && !usedSolutionHint;
          if (!isReplay) {
            if (isCleanSolve) cleanStreak++;
            else cleanStreak = 0;
          }

          showToast(awarded > 0 ? `Correct · +${awarded} XP` : 'Correct · replay, XP already earned', 'success');

          const isLastStage = targetStageIdx >= TOTAL_STAGES;

          const onReactionDone = () => {
            stageCompleted = true;
            isAdvancing = false;
            isGrading = false;

            // The explainer appears only after the 3D reaction has finished playing.
            if (feedback) {
              feedback.className = 'stage-error-banner stage-success-banner';
              const explanation = cfg.reaction?.explanation || 'Bond created! The two regions snapped together.';
              const clearStory = pylonStory?.onClear || '';
              feedback.innerHTML = `
                <span class="banner-mark" aria-hidden="true">//</span>
                <div class="banner-content" style="flex: 1;">
                  <div class="banner-title" style="color: var(--accent-green);">Pylon ${currentStageIdx + 1} Awakened</div>
                  ${clearStory ? `<div style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--accent-gold); margin-bottom: 0.35rem;">"${esc(clearStory)}"</div>` : ''}
                  <div class="banner-body">${explanation}</div>
                  <div class="banner-meta">
                    ${awarded > 0 ? `+${awarded} XP` : 'REPLAY · XP ALREADY EARNED'}${isCleanSolve && !isReplay ? ' · CLEAN SOLVE' : ''}
                  </div>
                </div>
                <button type="button" class="banner-dismiss-btn" id="dismiss-feedback-btn" aria-label="Dismiss feedback">✕</button>
              `;
              const dismissBtn = feedback.querySelector('#dismiss-feedback-btn');
              if (dismissBtn) dismissBtn.addEventListener('click', clearFeedback);
            }

            // The concept card is the payoff, not the briefing: it names the idea the
            // player just worked out, and only once they have worked it out.
            if (cfg.concept && cfg.conceptTiming !== 'intro' && feedback) {
              feedback.insertAdjacentHTML('afterend', renderConceptCard(cfg.concept));
            }

            const streakEl = container.querySelector('#clean-streak');
            if (streakEl) {
              streakEl.textContent = `${cleanStreak} CLEAN`;
              streakEl.classList.toggle('hidden', cleanStreak <= 0);
            }

            if (isT4 && stage.worldScene) {
              stage.worldScene.setClearedStages(new Set(Array.from({ length: maxStageReached }, (_, i) => i + 1)));
            }

            gradeBtn.disabled = false;
            gradeBtn.textContent = isLastStage ? 'Finish' : 'Next Stage';
            gradeBtn.focus();
          };

          if (viewer && viewer.playReaction && cfg.reaction) {
            viewer.playReaction(cfg.reaction, onReactionDone);
          } else {
            advanceTimer = setTimeout(onReactionDone, 1200);
          }
        } else {
          soundscape.playMissBuzzer();
          gradeBtn.disabled = false;
          gradeBtn.textContent = 'Submit';
          isGrading = false;
          if (viewer) {
            if (viewer.triggerFailure) viewer.triggerFailure();
            else viewer.triggerShudder();
          }

          // A miss is the most teachable moment in a stage, so name what actually
          // went wrong.
          const diag = diagnoseMiss(currentStageIdx, payload, res);
          const bannerTitle = diag.title;
          const msg = diag.message;
          const isSoftError = diag.soft;

          // An incomplete submission is not really an attempt, so it neither unlocks
          // hints nor breaks the streak.
          if (!res.incomplete) {
            misses++;
            cleanStreak = 0;
            const streakEl = container.querySelector('#clean-streak');
            if (streakEl) streakEl.classList.add('hidden');
          }

          if (flash && !isSoftError) {
            flash.classList.add('flash-active');
            setTimeout(() => flash.classList.remove('flash-active'), 400);
          }

          if (stageCard) {
            stageCard.classList.remove('error-state');
            void stageCard.offsetWidth; // force reflow so the shake replays
            stageCard.classList.add('error-state');
          }

          if (feedback) {
            feedback.className = `stage-error-banner ${isSoftError ? 'soft' : ''}`;
            feedback.innerHTML = `
              <span class="banner-mark" aria-hidden="true">!!</span>
              <div class="banner-content" style="flex: 1;">
                <div class="banner-title" style="color: ${isSoftError ? 'var(--accent-amber)' : 'var(--lamp-red)'};">
                  ${bannerTitle}
                </div>
                <div class="banner-body">${msg}</div>
              </div>
              <button type="button" class="banner-dismiss-btn" id="dismiss-feedback-btn" aria-label="Dismiss feedback">✕</button>
            `;
            const dismissBtn = feedback.querySelector('#dismiss-feedback-btn');
            if (dismissBtn) dismissBtn.addEventListener('click', clearFeedback);
          }

          const nextRung = HINT_RUNGS[hintRung + 1];
          if (hintBtn && !hintBtn.disabled && nextRung && nextRung.unlocked(misses, Date.now() - stageStartTime)) {
            hintBtn.classList.add('nudge');
          }

          showToast(msg, 'error');
        }
      } catch (err) {
        gradeBtn.disabled = false;
        gradeBtn.textContent = 'Submit';
        isGrading = false;
        isAdvancing = false;
        showToast(err.message || 'Something went wrong checking that answer.', 'error');
      }
    }

    gradeBtn.addEventListener('click', async () => {
      if (stageCompleted) {
        const targetStageIdx = currentStageIdx + 1;
        maxStageReached = Math.max(maxStageReached, targetStageIdx);

        // Milestone cinematic check (Stage 7, 10, 20)
        const milestoneStageNum = currentStageIdx + 1;
        const milestone = QUEST1_STORY.milestones[milestoneStageNum];
        if (milestone && !session.hasFlag(`milestone_${milestoneStageNum}`)) {
          session.setFlag(`milestone_${milestoneStageNum}`, true);
          gradeBtn.disabled = true;
          await playCinematic(milestone.cinematic);
          gradeBtn.disabled = false;
        }

        if (targetStageIdx >= TOTAL_STAGES) {
          gradeBtn.disabled = true;
          gradeBtn.textContent = 'Wrapping up…';
          showCompletionModal();
        } else {
          session.recordProgress(QUEST_ID, maxStageReached);
          loadStage(targetStageIdx);
        }
        return;
      }
      submitStage(currentPayload);
    });
  }

  async function showCompletionModal() {
    if (!session.hasFlag('cinematic_item_award')) {
      session.setFlag('cinematic_item_award', true);
      await playCinematic(QUEST1_STORY.debrief.cinematic || 'item_award');
    }
    // Never let a flaky network swallow the payoff: fall back to a local summary.
    let comp = null;
    try {
      comp = await api.completeQuest(QUEST_ID);
    } catch (e) {
      comp = null;
    }

    const totalXp = comp?.totalXp ?? TOTAL_QUEST_XP;
    const newLevel = comp?.newLevel ?? session.level ?? 1;
    const item = comp?.awardedItem;
    const debriefStory = QUEST1_STORY.debrief || {};
    const sections = debriefStory.sections || [
      {
        speaker: 'Vess',
        text: debriefStory.message || 'Outstanding work restoring the grid. Thank you for completing the mission.'
      }
    ];

    showModal(`
      <div class="quest-modal-head" style="text-align: center; margin-bottom: 0.85rem;">
        <div class="eyebrow lit" style="letter-spacing: 0.18em;">COMPLETE</div>
        <h2 id="quest-complete-title" class="page-title" style="font-size: 1.35rem; margin-top: 0.25rem;">The Charge Gardens</h2>
      </div>

      <div class="stat-row quest-debrief-stats" style="margin: 0.75rem 0 1rem; justify-content: space-around;">
        <div class="stat-tile">
          <div class="stat-label">Stages</div>
          <div class="stat-value">${TOTAL_STAGES} / ${TOTAL_STAGES}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-label">Quest XP</div>
          <div class="stat-value">${totalXp}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-label">Level</div>
          <div class="stat-value plain">${newLevel} · ${levelTitle(newLevel)}</div>
        </div>
      </div>

      <div id="modal-debrief-transmission-slot" style="margin-bottom: 0.75rem;"></div>

      <div class="debrief-controls" style="display: flex; justify-content: space-between; align-items: center; background: var(--plate-100); border: 1px solid var(--border-durasteel); padding: 0.55rem 0.85rem; margin-bottom: 1.25rem;">
        <div class="debrief-controls-left" style="display: flex; align-items: center; gap: 0.65rem;">
          <button type="button" id="debrief-prev-btn" class="btn-secondary quest-btn-sm" style="min-width: 62px;" disabled>
            ◀ Prev
          </button>
          <div class="debrief-step-dots" style="display: flex; gap: 4px; align-items: center;" role="group" aria-label="Debrief sections">
            ${sections.map((_, i) => `
              <span class="stage-dot ${i === 0 ? 'active' : ''}" data-debrief-dot="${i}" style="width: 7px; height: 7px; pointer-events: none;"></span>
            `).join('')}
          </div>
          <span class="eyebrow" id="debrief-counter" style="font-size: 0.65rem; color: var(--accent-gold); letter-spacing: 0.1em;">
            1 / ${sections.length}
          </span>
        </div>

        <button type="button" id="debrief-next-btn" class="btn-primary quest-btn-sm" style="min-width: 80px; padding: 6px 14px;">
          Next ▶
        </button>
      </div>

      ${item ? `
        <div id="salvage-banner" class="hidden" style="text-align: center; margin-bottom: 1.25rem;">
          <span class="tag warn">Item earned · ${item.replace(/_/g, ' ')}</span>
        </div>
      ` : ''}

      <div id="debrief-exit-actions" class="hidden" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <button type="button" id="modal-bridge-btn" class="btn-primary">Bridge</button>
        <button type="button" id="modal-standings-btn" class="btn-secondary">Standings</button>
      </div>
    `, { labelledBy: 'quest-complete-title' });

    let currentSecIdx = 0;
    let transmissionFinished = false;

    const debriefTransmission = createTransmissionElement({
      speaker: sections[0].speaker || 'Vess',
      text: sections[0].text,
      variant: 'hero',
      onComplete: () => {
        transmissionFinished = true;
      }
    });
    document.getElementById('modal-debrief-transmission-slot')?.appendChild(debriefTransmission.element);

    function syncSection(idx) {
      currentSecIdx = idx;
      const sec = sections[idx];
      transmissionFinished = false;

      debriefTransmission.update({
        speaker: sec.speaker || 'Vess',
        text: sec.text,
        onComplete: () => {
          transmissionFinished = true;
        }
      });

      const prevBtn = document.getElementById('debrief-prev-btn');
      const nextBtn = document.getElementById('debrief-next-btn');
      const counter = document.getElementById('debrief-counter');
      const exitActions = document.getElementById('debrief-exit-actions');
      const salvageBanner = document.getElementById('salvage-banner');

      if (prevBtn) prevBtn.disabled = (idx === 0);
      if (counter) counter.textContent = `${idx + 1} / ${sections.length}`;

      document.querySelectorAll('[data-debrief-dot]').forEach((dot, dIdx) => {
        dot.classList.toggle('active', dIdx === idx);
        dot.classList.toggle('completed', dIdx < idx);
      });

      if (idx === sections.length - 1) {
        if (nextBtn) nextBtn.textContent = 'Done';
        if (exitActions) exitActions.classList.remove('hidden');
        if (salvageBanner) salvageBanner.classList.remove('hidden');
      } else {
        if (nextBtn) nextBtn.textContent = 'Next ▶';
      }
    }

    document.getElementById('debrief-prev-btn')?.addEventListener('click', () => {
      if (currentSecIdx > 0) {
        soundscape.playNavRelayClick();
        syncSection(currentSecIdx - 1);
      }
    });

    document.getElementById('debrief-next-btn')?.addEventListener('click', () => {
      if (!transmissionFinished) {
        debriefTransmission.finish();
        return;
      }
      if (currentSecIdx < sections.length - 1) {
        soundscape.playNavRelayClick();
        syncSection(currentSecIdx + 1);
      } else {
        soundscape.playPylonWake();
        const exitActions = document.getElementById('debrief-exit-actions');
        if (exitActions) {
          exitActions.classList.remove('hidden');
          document.getElementById('modal-bridge-btn')?.focus();
        }
      }
    });

    const go = (hash) => {
      if (debriefTransmission?.destroy) debriefTransmission.destroy();
      closeModal();
      stage.exitQuestScene();
      window.location.hash = hash;
    };
    document.getElementById('modal-bridge-btn')?.addEventListener('click', () => go('#/bridge'));
    document.getElementById('modal-standings-btn')?.addEventListener('click', () => go('#/leaderboard'));

    // Pull the authoritative XP total once the run is banked.
    api.getMe().then(me => { if (me) session.setUserData(me); }).catch(() => {});
  }

  // 1. Render the current stage immediately from bundled configs (0ms latency)
  // Play arrival cinematic (Erebus Descent) on entry to Sector 01
  const startQuest = async () => {
    if (QUEST1_STORY.arrival?.cinematic) {
      if (stage.fpsControls) stage.fpsControls.enabled = false;
      await playCinematic(QUEST1_STORY.arrival.cinematic);
    }
    if (window.location.hash.split('?')[0] !== '#/quest') return;
    if (isT4) {
      if (stage.fpsControls) stage.fpsControls.enabled = true;
      renderErebusHUD();
    } else {
      loadStage(currentStageIdx);
    }
  };
  startQuest();

  // 2. Sync the remote manifest & player progress in the background
  Promise.all([
    api.getQuestManifest(QUEST_ID).catch(() => null),
    api.getMe().catch(() => null)
  ]).then(([manifest, me]) => {
    if (manifest) questData = manifest;
    if (me) {
      session.setUserData(me);
      const remote = (me.progress || []).find(p => p.quest_id === QUEST_ID);
      if (remote && typeof remote.stage_reached === 'number') {
        const reached = Math.min(Number(remote.stage_reached), TOTAL_STAGES);
        if (reached > maxStageReached) {
          maxStageReached = reached;
          if (isT4 && stage.worldScene) {
            stage.worldScene.setClearedStages(new Set(Array.from({ length: maxStageReached }, (_, i) => i + 1)));
          }
          // Only jump the player forward if they have not started playing yet, and
          // never on a completed quest — there, stage 1 is a deliberate replay start.
          if (!isT4 && currentStageIdx === 0 && maxStageReached < TOTAL_STAGES) loadStage(navMaxIdx());
        }
      }
    }
  }).catch(err => {
    console.warn('Background quest sync:', err);
  });
}

/** Shown if the backend cannot be reached when the quest is completed. */
const LOCAL_EPILOGUE = `Here is the chemistry you were actually doing.

Every red cloud was a spot with extra electrons — a region of negative charge. Every blue spot was electron-poor and positively charged. Opposite charges attract, so reactions start where the reddest region meets the bluest one.

The lines you drew are called curved arrows, and chemists use exactly this notation. An arrow shows a pair of electrons moving from where they are to where they are going.

When two blue targets competed, geometry decided the winner: bulky groups physically block incoming molecules, so reactions take the open route. That is called steric hindrance.

In the multi-step stages you were writing a reaction mechanism — the exact order in which bonds form and break. That is the core skill of organic chemistry, and you just did twenty of them.`;
