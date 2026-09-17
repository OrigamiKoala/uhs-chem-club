/**
 * demo.js — One free puzzle, no account required.
 *
 * Stage 1 preview graded locally. Stage info appears in a modal before the stage begins.
 */

import { api } from '../api.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { QuestViewer } from '../quest3d/viewer.js';
import { MOLECULE_DATA } from '../quest3d/molecule.js';
import { renderFallbackInputs } from '../fallback2d/stages.js';
import { showToast } from '../ui/toast.js';
import { showModal, closeModal } from '../ui/modal.js';
import { esc } from '../ui/layout.js';
import { STAGE_CONFIGS, evaluateStageLocally, diagnoseMiss } from '../quest3d/evaluator.js';

function showDemoModal(cfg) {
  showModal(`
    <div class="quest-modal-head" style="text-align: center; margin-bottom: 1.25rem;">
      <div class="eyebrow lit">Sample Stage 1</div>
      <h2 id="demo-modal-title" class="page-title" style="font-size: 1.35rem; margin-top: 0.3rem;">
        ${esc(cfg.title || 'Stage 1')}
      </h2>
      <div style="margin-top: 0.4rem;">
        <span class="tag live">Free Demo</span>
      </div>
    </div>

    <div style="background: var(--plate-100); border: 1px solid var(--border-durasteel); padding: 1rem 1.15rem; margin-bottom: 1.25rem; font-size: 0.95rem; line-height: 1.55; color: var(--text-bright);">
      ${cfg.prompt ? esc(cfg.prompt) : 'Connect the molecules to trigger the reaction.'}
    </div>

    <div style="background: var(--plate-200); border-left: 2px solid var(--accent-cyan); padding: 8px 12px; margin-bottom: 1.25rem; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">
      Drag from the electron donor (negative, red) to the electron acceptor (positive, blue).
    </div>

    <div style="margin-top: 1.25rem;">
      <button type="button" id="modal-start-demo-btn" class="btn-primary" style="width: 100%; padding: 10px 0; font-size: 0.9rem;">
        Start Stage
      </button>
    </div>
  `, { labelledBy: 'demo-modal-title' });

  document.getElementById('modal-start-demo-btn')?.addEventListener('click', () => {
    closeModal();
  });
}

export function renderDemo(container) {
  let viewer = null;
  let currentPayload = null;
  let solved = false;

  if (tierManager.currentTier !== 'T1' && stage.canvas) {
    viewer = new QuestViewer(stage.canvas);
    stage.setQuestScene(viewer);
  }

  const base = STAGE_CONFIGS[0];
  const cfg = {
    ...base,
    regions: MOLECULE_DATA[base.moleculeId]?.regions || [],
    anchors: (MOLECULE_DATA[base.moleculeId]?.regions || []).map(r => r.id)
  };

  container.innerHTML = `
    <div id="quest-screen-flash" class="quest-screen-flash"></div>
    <div class="quest-hud-overlay">
      <div class="quest-hud-top">
        <div class="quest-nav-cluster">
          <a href="#/" class="btn-secondary quest-btn-sm" style="text-decoration: none;">← Exit</a>
          <span class="stage-counter">SAMPLE · STAGE <strong>1</strong></span>
        </div>
        <div class="colormap-legend" style="min-width: 168px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.62rem; letter-spacing: 0.16em;">
            <span style="color: var(--charge-red-ink);">GIVER</span>
            <span style="color: var(--charge-blue-ink);">TAKER</span>
          </div>
          <div style="height: 6px; background: linear-gradient(90deg, var(--charge-red) 0%, var(--plate-500) 50%, var(--charge-blue) 100%);"></div>
        </div>
      </div>

      <div class="stage-card-wrap">
        <div class="stage-dock-bar hidden" id="demo-dock-bar">
          <button type="button" id="demo-open-btn" class="btn-secondary quest-btn-sm stage-reopen-btn" title="Open stage panel" aria-label="Open stage panel">
            Stage Panel
          </button>
          <button type="button" id="demo-dock-grade-btn" class="btn-primary quest-btn-sm" title="Submit answer">
            Submit
          </button>
        </div>
        <div class="stage-prompt-card" id="demo-card">
          <div class="stage-header">
            <div class="stage-header-main">
              ${cfg.shape ? `<div class="stage-shape">${cfg.shape}</div>` : ''}
              <div class="stage-title">${cfg.title}</div>
            </div>
            <div class="stage-header-actions" style="display: flex; gap: 0.4rem; align-items: center;">
              <button type="button" id="demo-info-btn" class="btn-secondary quest-btn-sm">Objective</button>
              <button type="button" id="demo-close-btn" class="btn-secondary quest-btn-sm" title="Close stage panel" aria-label="Close stage panel">Close</button>
              <div class="stage-xp-tag">Sample</div>
            </div>
          </div>

          <div class="stage-instruction">${cfg.prompt}</div>

          <div class="stage-toolbar">
            <span class="stage-tip">Drag to connect · right-drag to rotate</span>
            <button type="button" id="demo-clear-btn" class="btn-secondary quest-btn-sm">Clear</button>
          </div>

          <div id="demo-interactive-area"></div>
          <div id="demo-feedback" class="hidden"></div>

          <div class="demo-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <button type="button" id="demo-grade-btn" class="btn-primary" style="padding: 9px 26px; min-height: 40px;">Submit</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Show stage info modal before stage begins to explain controls
  showDemoModal(cfg);

  const interactiveArea = container.querySelector('#demo-interactive-area');
  const card = container.querySelector('#demo-card');
  const feedback = container.querySelector('#demo-feedback');
  const flash = container.querySelector('#quest-screen-flash');
  const gradeBtn = container.querySelector('#demo-grade-btn');

  container.querySelector('#demo-info-btn')?.addEventListener('click', () => {
    showDemoModal(cfg);
  });

  const demoDockBar = container.querySelector('#demo-dock-bar');
  const demoCloseBtn = container.querySelector('#demo-close-btn');
  const demoOpenBtn = container.querySelector('#demo-open-btn');
  const demoDockGradeBtn = container.querySelector('#demo-dock-grade-btn');

  function syncDemoDockGradeBtn() {
    if (!demoDockGradeBtn || !gradeBtn) return;
    demoDockGradeBtn.textContent = gradeBtn.textContent;
    demoDockGradeBtn.disabled = gradeBtn.disabled;
    demoDockGradeBtn.title = gradeBtn.textContent;
  }

  function setDemoCardClosed(closed) {
    if (closed) {
      card?.classList.add('hidden');
      demoDockBar?.classList.remove('hidden');
      demoOpenBtn?.focus();
    } else {
      card?.classList.remove('hidden');
      demoDockBar?.classList.add('hidden');
      demoCloseBtn?.focus();
    }
    syncDemoDockGradeBtn();
  }

  demoCloseBtn?.addEventListener('click', () => {
    setDemoCardClosed(true);
  });

  demoOpenBtn?.addEventListener('click', () => {
    setDemoCardClosed(false);
  });

  demoDockGradeBtn?.addEventListener('click', () => {
    gradeBtn?.click();
    syncDemoDockGradeBtn();
  });

  const demoGradeObserver = new MutationObserver(() => syncDemoDockGradeBtn());
  if (gradeBtn) {
    demoGradeObserver.observe(gradeBtn, { attributes: true, childList: true, characterData: true, subtree: true });
  }
  syncDemoDockGradeBtn();

  if (tierManager.currentTier === 'T1' || !viewer) {
    card?.classList.add('stage-card-fallback');
    renderFallbackInputs(interactiveArea, cfg, 'arrow', (payload) => { currentPayload = payload; });
  } else {
    viewer.setMode('draw');
    viewer.loadStage(cfg, 'arrow', (payload) => { currentPayload = payload; });
  }

  container.querySelector('#demo-clear-btn')?.addEventListener('click', () => {
    if (viewer) viewer.clear();
    currentPayload = null;
    feedback.className = 'hidden';
    card.classList.remove('error-state');
  });

  gradeBtn.addEventListener('click', () => {
    if (solved) {
      window.location.hash = '#/register';
      return;
    }
    if (!currentPayload) {
      showToast('Nothing drawn yet. Drag between two sites.', 'warning');
      return;
    }

    const res = evaluateStageLocally(0, currentPayload);
    api.gradeDemo(0, currentPayload).catch(() => {});

    if (res.correct) {
      solved = true;
      gradeBtn.disabled = true;
      gradeBtn.textContent = 'Reacting…';

      const finish = () => {
        solved = true;
        feedback.className = 'stage-error-banner stage-success-banner';
        feedback.innerHTML = `
          <span class="banner-mark" aria-hidden="true">//</span>
          <div class="banner-content" style="flex: 1;">
            <div class="banner-title" style="color: var(--accent-green);">Solved</div>
            <div class="banner-body">Stage 1 solved. Create an account to continue.</div>
          </div>
          <button type="button" class="banner-dismiss-btn" id="demo-dismiss-feedback-btn" aria-label="Dismiss feedback">✕</button>
        `;
        feedback.querySelector('#demo-dismiss-feedback-btn')?.addEventListener('click', () => {
          feedback.className = 'hidden';
        });
        gradeBtn.disabled = false;
        gradeBtn.textContent = 'Create Account';
        gradeBtn.focus();
      };

      if (viewer && viewer.playReaction && cfg.reaction) {
        viewer.playReaction(cfg.reaction, finish);
      } else {
        setTimeout(finish, 1000);
      }
    } else {
      if (viewer) viewer.triggerFailure?.();
      if (flash) {
        flash.classList.add('flash-active');
        setTimeout(() => flash.classList.remove('flash-active'), 400);
      }
      card.classList.remove('error-state');
      void card.offsetWidth;
      card.classList.add('error-state');
      const diag = diagnoseMiss(0, currentPayload, res);
      feedback.className = 'stage-error-banner';
      feedback.innerHTML = `
        <span class="banner-mark" aria-hidden="true">!!</span>
        <div class="banner-content" style="flex: 1;">
          <div class="banner-title" style="color: var(--lamp-red);">${diag.title}</div>
          <div class="banner-body">${diag.message}</div>
        </div>
        <button type="button" class="banner-dismiss-btn" id="demo-dismiss-feedback-btn" aria-label="Dismiss feedback">✕</button>
      `;
      feedback.querySelector('#demo-dismiss-feedback-btn')?.addEventListener('click', () => {
        feedback.className = 'hidden';
      });
    }
  });
}
