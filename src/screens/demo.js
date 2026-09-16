/**
 * demo.js — One free puzzle, no account required.
 *
 * This is the same Stage 1 the real quest opens with, graded by the same local
 * evaluator, so what a visitor tries here is exactly what they get after signing up.
 * (It previously referenced a molecule that does not exist and graded an arrow
 * answer with pick logic, so it could never be solved.)
 */

import { api } from '../api.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { QuestViewer } from '../quest3d/viewer.js';
import { MOLECULE_DATA } from '../quest3d/molecule.js';
import { renderFallbackInputs } from '../fallback2d/stages.js';
import { renderScanReadout } from '../ui/scan.js';
import { showToast } from '../ui/toast.js';
import { STAGE_CONFIGS, evaluateStageLocally, diagnoseMiss, scanFor } from '../quest3d/evaluator.js';

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
  const demoSiteCount = Object.keys(cfg.scans || {}).length;
  const demoScanned = new Set();

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
        <div class="stage-prompt-card" id="demo-card">
          <div class="stage-header">
            <div>
              ${cfg.shape ? `<div class="stage-shape">${cfg.shape}</div>` : ''}
              <div class="stage-title">${cfg.title}</div>
            </div>
            <div class="stage-xp-tag">Sample</div>
          </div>

          <div class="concept-card">
            <div class="concept-card-header">
              <div class="concept-card-title-group">
                <span class="concept-badge">CONTROLS</span>
                <span class="concept-card-title">SCAN FIRST, THEN CONNECT</span>
              </div>
            </div>
            <div class="concept-card-intro">Glowing clouds are electric charge. Opposites pull — find out which is which.</div>
            <div class="concept-grid">
              <div class="concept-pill red-pill"><strong>Tap a cloud</strong> to scan that site.</div>
              <div class="concept-pill blue-pill"><strong>Drag between clouds</strong> to connect them.</div>
            </div>
          </div>

          <div class="stage-instruction">${cfg.prompt}</div>

          <div id="demo-scan-slot">${renderScanReadout(null, 0, demoSiteCount)}</div>

          <div class="stage-toolbar">
            <span class="stage-tip">Tap to scan · drag to connect · right-drag to rotate</span>
            <button type="button" id="demo-clear-btn" class="btn-secondary quest-btn-sm">Clear</button>
          </div>

          <div id="demo-interactive-area"></div>
          <div id="demo-feedback" class="hidden"></div>

          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <a href="#/register" class="btn-secondary quest-btn-sm" style="text-decoration: none;">
              Create Account
            </a>
            <button type="button" id="demo-grade-btn" class="btn-primary" style="padding: 9px 26px; min-height: 40px;">Submit</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const interactiveArea = container.querySelector('#demo-interactive-area');
  const card = container.querySelector('#demo-card');
  const feedback = container.querySelector('#demo-feedback');
  const flash = container.querySelector('#quest-screen-flash');
  const gradeBtn = container.querySelector('#demo-grade-btn');

  // The free sample teaches the loop the whole quest runs on, so the scanner has to
  // work here too — otherwise stage 1's own prompt tells the player to do something
  // that does nothing.
  const demoScanSlot = container.querySelector('#demo-scan-slot');
  function showDemoScan(regionId) {
    const scan = scanFor(0, regionId);
    if (!scan || !demoScanSlot) return;
    demoScanned.add(regionId);
    demoScanSlot.innerHTML = renderScanReadout(scan, demoScanned.size, demoSiteCount);
    const el = demoScanSlot.querySelector('.scan-readout');
    if (el) { void el.offsetWidth; el.classList.add('scan-sweep'); }
  }

  if (tierManager.currentTier === 'T1' || !viewer) {
    renderFallbackInputs(interactiveArea, cfg, 'arrow', (payload) => { currentPayload = payload; }, showDemoScan);
  } else {
    viewer.setMode('draw');
    viewer.loadStage(cfg, 'arrow', (payload) => { currentPayload = payload; }, showDemoScan);
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
      showToast('Nothing drawn yet. Scan the sites, then drag between two.', 'warning');
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
          <div style="flex: 1;">
            <div class="banner-title" style="color: var(--accent-green);">Solved</div>
            <div class="banner-body">One of twenty. Create an account to keep the rest.</div>
          </div>
        `;
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
        <div style="flex: 1;">
          <div class="banner-title" style="color: var(--lamp-red);">${diag.title}</div>
          <div class="banner-body">${diag.message}</div>
        </div>
      `;
    }
  });
}
