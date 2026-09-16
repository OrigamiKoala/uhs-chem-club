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
import { renderScanReadout } from '../ui/scan.js';
import { STAGE_CONFIGS, evaluateStageLocally, diagnoseMiss, scanFor, TOTAL_STAGES, TOTAL_QUEST_XP } from '../quest3d/evaluator.js';

const QUEST_ID = 'q1';

/**
 * The hint ladder. Rung 0 is free and asks a question; rung 1 narrows the field and
 * rung 2 names the move, and both have to be earned. A stuck player always reaches
 * the answer within two misses, so nobody is ever stranded — but nobody is handed it
 * for free either, which is the whole point of the scanner.
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
    locked: 'Opens after two attempts. Scan the sites you have not read yet.'
  }
];

function renderConceptCard(concept) {
  if (!concept) return '';
  return `
    <div class="concept-card" id="stage-concept-card">
      <div class="concept-card-header">
        <div class="concept-card-title-group">
          <span class="concept-badge">${concept.badge}</span>
          <span class="concept-card-title">${concept.title}</span>
        </div>
        <button type="button" class="concept-dismiss-btn" id="concept-dismiss-btn" title="Hide this explainer" aria-label="Hide explainer">
          Hide
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
    <button type="button" class="concept-reopen-btn hidden" id="concept-reopen-btn" title="Show the explainer again">
      ${concept.badge || 'Key concept'}
    </button>
  `;
}

export function renderQuest(container) {
  let questData = session.activeQuest || null;
  let currentStageIdx = 0;
  let maxStageReached = 0;

  // Resume where the player left off.
  try {
    const savedStage = parseInt(localStorage.getItem(`avalon_${QUEST_ID}_stage_reached`), 10);
    if (!isNaN(savedStage) && savedStage >= 0) {
      maxStageReached = Math.min(savedStage, TOTAL_STAGES - 1);
      currentStageIdx = maxStageReached;
    }
  } catch (e) {}

  const prog = (session.progress || []).find(p => p.quest_id === QUEST_ID);
  if (prog && typeof prog.stage_reached === 'number') {
    const reached = Math.min(Number(prog.stage_reached), TOTAL_STAGES - 1);
    if (reached > maxStageReached) {
      maxStageReached = reached;
      currentStageIdx = reached;
    }
  }

  let currentPayload = null;
  let isGrading = false;
  let isAdvancing = false;
  let advanceTimer = null;
  let hintUsed = false;
  let stageStartTime = Date.now();
  let viewer = null;

  // Per-stage, reset by loadStage.
  let misses = 0;
  let hintRung = -1;          // highest hint rung revealed so far
  let usedSolutionHint = false;
  let scannedIds = new Set();

  // Survives stage changes: consecutive stages solved first try without the
  // solution rung. Display only — it pays no XP, so the once-per-stage flat XP
  // rule is untouched.
  let cleanStreak = 0;

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
    stageStartTime = Date.now();
    misses = 0;
    hintRung = -1;
    usedSolutionHint = false;
    scannedIds = new Set();

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

    const cfg = {
      ...localCfg,
      ...(stageMeta.scene_config || {}),
      // The bundled configs are authoritative for anything the player reads or is graded on.
      title: localCfg.title,
      prompt: localCfg.prompt,
      hint: localCfg.hint,
      hints: localCfg.hints,
      shape: localCfg.shape,
      scans: localCfg.scans || {},
      steps: localCfg.steps,
      concept: localCfg.concept || null,
      conceptTiming: localCfg.conceptTiming || 'reward'
    };

    // Anchors come from the molecule itself, so the no-WebGL fallback has real
    // targets to offer instead of an empty dropdown.
    const regions = MOLECULE_DATA[cfg.moleculeId]?.regions || [];
    if (!cfg.anchors || cfg.anchors.length === 0) {
      cfg.anchors = regions.map(r => r.id);
    }
    cfg.regions = regions;

    const isMulti = Boolean(cfg.multiArrow);
    const requiredArrows = isMulti ? (cfg.steps?.length || 2) : 1;
    // A stage the player has already cleared: replayable, but it cannot pay out twice.
    const isReplay = currentStageIdx < maxStageReached;
    const stageXp = stageMeta.xp || cfg.xp || 20;
    const scannableIds = Object.keys(cfg.scans || {});
    const totalSites = scannableIds.length;
    // Concept cards that explain an idea now land AFTER the player has found it.
    // Only cards that teach the controls stay up front.
    const showConceptNow = cfg.concept && cfg.conceptTiming === 'intro';

    // 1. Render Quest HUD Overlay
    container.innerHTML = `
      <div id="quest-screen-flash" class="quest-screen-flash"></div>
      <div class="quest-hud-overlay">
        <!-- Top HUD -->
        <div class="quest-hud-top">
          <div class="quest-nav-cluster">
            <a href="#/bridge" class="btn-secondary quest-btn-sm" style="text-decoration: none;">
              ← Exit
            </a>
            <button type="button" id="prev-stage-btn" class="btn-secondary quest-btn-sm" ${currentStageIdx === 0 ? 'disabled' : ''} title="Previous stage" aria-label="Previous stage">
              ◀
            </button>
            <div class="stage-counter" aria-live="polite">
              STAGE <strong>${currentStageIdx + 1}</strong> / ${TOTAL_STAGES}
            </div>
            <div class="clean-streak ${cleanStreak > 0 ? '' : 'hidden'}" id="clean-streak" title="Stages solved first try, without the solution hint">
              ${cleanStreak} CLEAN
            </div>
            <button type="button" id="next-stage-btn" class="btn-secondary quest-btn-sm" ${currentStageIdx >= maxStageReached ? 'disabled' : ''} title="Next stage" aria-label="Next stage">
              ▶
            </button>
            <div class="stage-pill-track" role="group" aria-label="Stage progress">
              ${Array.from({ length: TOTAL_STAGES }, (_, i) => `
                <button type="button" class="stage-dot ${i < maxStageReached ? 'completed' : ''} ${i === currentStageIdx ? 'active' : ''} ${i <= maxStageReached ? 'clickable' : ''}"
                     data-stage-idx="${i}"
                     ${i > maxStageReached ? 'disabled' : ''}
                     aria-label="Stage ${i + 1}${i > maxStageReached ? ' (locked)' : ''}"
                     title="Stage ${i + 1}${i > maxStageReached ? ' (locked)' : ''}"></button>
              `).join('')}
            </div>
          </div>

          <!-- Density Legend -->
          <div class="colormap-legend" style="min-width: 168px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.62rem; letter-spacing: 0.16em;">
              <span style="color: var(--charge-red-ink);">GIVER</span>
              <span style="color: var(--charge-blue-ink);">TAKER</span>
            </div>
            <div style="height: 6px; background: linear-gradient(90deg, var(--charge-red) 0%, var(--plate-500) 50%, var(--charge-blue) 100%);"></div>
          </div>
        </div>

        <!-- Bottom Stage Card -->
        <div class="stage-card-wrap">
          <div class="stage-prompt-card" id="stage-card">
            <div class="stage-header">
              <div>
                ${cfg.shape ? `<div class="stage-shape">${esc(cfg.shape)}</div>` : ''}
                <div class="stage-title">${cfg.title || ('Stage ' + (currentStageIdx + 1))}</div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                ${isReplay ? '<span class="tag">Replay</span>' : ''}
                <div class="stage-xp-tag">${isReplay ? 'Earned' : `+${stageXp} XP`}</div>
              </div>
            </div>

            ${showConceptNow ? renderConceptCard(cfg.concept) : ''}

            ${cfg.prompt ? `<div class="stage-instruction">${cfg.prompt}</div>` : ''}

            <div id="scan-slot">${totalSites ? renderScanReadout(null, 0, totalSites) : ''}</div>

            <!-- Toolbar -->
            <div class="stage-toolbar">
              <div class="stage-toolbar-left">
                ${isMulti ? `
                  <span class="arrow-counter" id="arrow-counter" aria-live="polite">
                    Arrows drawn: <strong id="arrow-count">0</strong> / ${requiredArrows}
                  </span>
                ` : ''}
                <span class="stage-tip">
                  Tap to scan · drag to connect · right-drag to rotate
                </span>
              </div>
              <div class="stage-toolbar-right">
                ${(cfg.hints || []).length ? `
                  <button type="button" id="hint-btn" class="btn-secondary quest-btn-sm">
                    ◈ Hint <span class="hint-rung-count" id="hint-rung-count">1/${cfg.hints.length}</span>
                  </button>
                ` : ''}
                <button type="button" id="tool-clear-btn" class="btn-secondary quest-btn-sm">
                  Clear
                </button>
              </div>
            </div>

            ${isMulti ? `
              <div class="stage-note">
                ${requiredArrows} arrows, in order. Click a number to change its step; click an arrow to delete it.
              </div>
            ` : ''}

            <!-- Interactive Stage Area (Tier 1 fallback inputs live here) -->
            <div id="stage-interactive-area"></div>

            <!-- Hint / feedback banners -->
            <div id="stage-hint" class="hint-stack hidden" role="status"></div>
            <div id="stage-feedback" class="hidden"></div>

            <!-- Stage Footer Actions -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem;">
              <button type="button" id="grade-btn" class="btn-primary" style="padding: 9px 26px; min-height: 40px;">Submit</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const stageCard = container.querySelector('#stage-card');
    const feedback = container.querySelector('#stage-feedback');
    const hintBanner = container.querySelector('#stage-hint');
    const flash = container.querySelector('#quest-screen-flash');
    const arrowCountEl = container.querySelector('#arrow-count');

    function clearFeedback() {
      if (stageCard) stageCard.classList.remove('error-state');
      if (feedback) {
        feedback.className = 'hidden';
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

    // 2. Stage navigation
    container.querySelector('#prev-stage-btn')?.addEventListener('click', () => {
      if (currentStageIdx > 0) loadStage(currentStageIdx - 1);
    });
    container.querySelector('#next-stage-btn')?.addEventListener('click', () => {
      if (currentStageIdx < maxStageReached) loadStage(currentStageIdx + 1);
    });
    container.querySelectorAll('.stage-dot.clickable').forEach(dot => {
      dot.addEventListener('click', () => {
        const targetIdx = Number(dot.getAttribute('data-stage-idx'));
        if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx <= maxStageReached && targetIdx !== currentStageIdx) {
          loadStage(targetIdx);
        }
      });
    });

    // 3. Concept card show/hide. Called again if the card is added after a solve.
    function bindConceptCard() {
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
    }
    bindConceptCard();

    // 4. Scanner — the exploration loop. Tapping a site reads out that site alone,
    //    so the answer only ever comes from comparing several of them.
    const scanSlot = container.querySelector('#scan-slot');

    function showScan(regionId) {
      const scan = scanFor(currentStageIdx, regionId);
      if (!scan || !scanSlot) return;
      const isNew = !scannedIds.has(regionId);
      scannedIds.add(regionId);
      scanSlot.innerHTML = renderScanReadout(scan, scannedIds.size, totalSites);
      const el = scanSlot.querySelector('.scan-readout');
      if (el) {
        // Replay the sweep so a repeat scan of the same site still feels like an action.
        void el.offsetWidth;
        el.classList.add('scan-sweep');
      }
      if (isNew && scannedIds.size === totalSites && totalSites > 2) {
        showToast('Whole chamber scanned. Now compare the numbers.', 'info');
      }
    }

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
      hintBanner.innerHTML = availableHints.slice(0, hintRung + 1).map((text, i) => `
        <div class="hint-rung ${i === hintRung ? 'fresh' : ''}">
          <span class="hint-rung-label">${esc(HINT_RUNGS[i]?.label || 'Hint')}</span>
          <span class="hint-rung-text">${text}</span>
        </div>
      `).join('');
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
    const interactionKind = isMulti ? 'multi_arrow' : (stageMeta.kind || 'arrow');
    const usingFallback = tierManager.currentTier === 'T1' || !viewer;

    if (usingFallback) {
      renderFallbackInputs(interactiveArea, cfg, interactionKind, onPayloadChange, showScan);
    } else {
      viewer.setMode('draw');
      viewer.loadStage(cfg, interactionKind, onPayloadChange, showScan);
      viewer.setArrowLimitHandler((max) => {
        showToast(`${max} arrows max. Click an arrow to delete it.`, 'warning');
      });
    }

    container.querySelector('#tool-clear-btn')?.addEventListener('click', () => {
      if (usingFallback) {
        // Rebuild the dropdowns — there is no canvas to clear on Tier 1.
        renderFallbackInputs(interactiveArea, cfg, interactionKind, onPayloadChange, showScan);
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

    async function submitStage(payload) {
      if (isGrading || isAdvancing) return;

      const drawn = isMulti ? (payload?.arrows?.length || 0) : (payload ? 1 : 0);
      if (drawn === 0) {
        showToast('Nothing drawn yet. Scan a few sites, then drag between two.', 'warning');
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
              feedback.innerHTML = `
                <span class="banner-mark" aria-hidden="true">//</span>
                <div style="flex: 1;">
                  <div class="banner-title" style="color: var(--accent-green);">Reaction complete</div>
                  <div class="banner-body">${explanation}</div>
                  <div class="banner-meta">
                    ${awarded > 0 ? `+${awarded} XP` : 'REPLAY · XP ALREADY EARNED'}${isCleanSolve && !isReplay ? ' · CLEAN SOLVE' : ''}
                  </div>
                </div>
              `;
            }

            // The concept card is the payoff, not the briefing: it names the idea the
            // player just worked out, and only once they have worked it out.
            if (cfg.concept && cfg.conceptTiming !== 'intro' && feedback) {
              feedback.insertAdjacentHTML('afterend', renderConceptCard(cfg.concept));
              bindConceptCard();
            }

            const streakEl = container.querySelector('#clean-streak');
            if (streakEl) {
              streakEl.textContent = `${cleanStreak} CLEAN`;
              streakEl.classList.toggle('hidden', cleanStreak <= 0);
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
          gradeBtn.disabled = false;
          gradeBtn.textContent = 'Submit';
          isGrading = false;
          if (viewer) {
            if (viewer.triggerFailure) viewer.triggerFailure();
            else viewer.triggerShudder();
          }

          // A miss is the most teachable moment in a stage, so name what actually
          // went wrong and point at a site the player can go and scan.
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
              <div style="flex: 1;">
                <div class="banner-title" style="color: ${isSoftError ? 'var(--accent-amber)' : 'var(--lamp-red)'};">
                  ${bannerTitle}
                </div>
                <div class="banner-body">${msg}</div>
              </div>
            `;
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

    gradeBtn.addEventListener('click', () => {
      if (stageCompleted) {
        const targetStageIdx = currentStageIdx + 1;
        maxStageReached = Math.max(maxStageReached, targetStageIdx);
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
    // Never let a flaky network swallow the payoff: fall back to a local summary.
    let comp = null;
    try {
      comp = await api.completeQuest(QUEST_ID);
    } catch (e) {
      comp = null;
    }

    const epilogue = comp?.epilogue || LOCAL_EPILOGUE;
    const totalXp = comp?.totalXp ?? TOTAL_QUEST_XP;
    const newLevel = comp?.newLevel ?? session.level ?? 1;
    const item = comp?.awardedItem;

    showModal(`
      <div style="text-align: center;">
        <div class="eyebrow lit">Sector 01 cleared</div>
        <h2 id="quest-complete-title" class="page-title" style="font-size: 1.35rem;">The Charge Gardens</h2>
      </div>

      <div class="stat-row" style="margin: 1.25rem 0; justify-content: space-around;">
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

      <div style="background: var(--plate-100); border: 1px solid var(--border-durasteel); box-shadow: inset 0 2px 8px rgba(0,0,0,0.6); padding: 1.1rem 1.25rem; margin-bottom: 1.5rem;">
        <div class="eyebrow lit" style="margin-bottom: 0.7rem;">Debrief</div>
        <div class="prose-block">${epilogue}</div>
      </div>

      ${item ? `
        <div style="text-align: center; margin-bottom: 1.25rem;">
          <span class="tag warn">Salvaged · ${item.replace(/_/g, ' ')}</span>
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <button type="button" id="modal-bridge-btn" class="btn-primary">Bridge</button>
        <button type="button" id="modal-standings-btn" class="btn-secondary">Standings</button>
      </div>
    `, { labelledBy: 'quest-complete-title' });

    const go = (hash) => {
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
  loadStage(currentStageIdx);

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
        const reached = Math.min(Number(remote.stage_reached), TOTAL_STAGES - 1);
        if (reached > maxStageReached) {
          maxStageReached = reached;
          // Only jump the player forward if they have not started playing yet.
          if (currentStageIdx === 0) loadStage(reached);
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
