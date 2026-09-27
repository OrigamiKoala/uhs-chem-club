/**
 * pwa-install.js — Home screen installation & orientation enforcement.
 *
 * Flaunts installation to the Home Screen with a dedicated aerospace HUD button
 * and platform-specific step-by-step walkthrough modal (Safari share > add to home screen).
 * Enforces landscape mode on mobile screens via Screen Orientation API and
 * the Orientation Guard overlay.
 */

import { gameMode } from './game-mode.js';
import { showModal, closeModal } from './ui/modal.js';

let deferredPrompt = null;

export function isMobileScreen() {
  if (typeof window === 'undefined') return false;
  const coarse = Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const touch = (navigator.maxTouchPoints || 0) > 0;
  const narrow = Boolean(window.matchMedia && window.matchMedia('(max-width: 900px)').matches);
  const short = Boolean(window.matchMedia && window.matchMedia('(max-height: 500px)').matches);
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  return (coarse || touch || mobileUa) && (narrow || short || coarse);
}

export function isIosDevice() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
}

/**
 * Show the flaunted Add to Home Screen popup dialog.
 */
export function showInstallModal(opts = {}) {
  const isIos = isIosDevice();
  const isStandalone = gameMode.isStandalone();
  if (isStandalone) return;

  const modalHtml = `
    <div class="pwa-install-dialog" role="document">
      <div class="pwa-modal-head">
        <div class="pwa-modal-badge">
          <span class="install-pulse-dot" aria-hidden="true"></span>
          <span>SHIPBOARD OS // AEROSPACE DEPLOYMENT</span>
        </div>
        <h2 id="pwa-modal-title" class="pwa-modal-title">ADD AVALON TO HOME SCREEN</h2>
        <p class="pwa-modal-sub">
          Launch Avalon in dedicated hardware mode with zero browser chrome, true full-bleed display, and calibrated landscape flight controls.
        </p>
      </div>

      <div class="pwa-steps-list">
        ${isIos ? `
          <div class="pwa-step-card">
            <div class="pwa-step-num">1</div>
            <div class="pwa-step-body">
              <div class="pwa-step-label">Tap the Share Button</div>
              <div class="pwa-step-desc">
                In Safari's toolbar at the bottom of the screen, tap the
                <span class="pwa-inline-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                    <polyline points="16 6 12 2 8 6"></polyline>
                    <line x1="12" y1="2" x2="12" y2="15"></line>
                  </svg>
                  Share
                </span>
                icon.
              </div>
            </div>
          </div>

          <div class="pwa-step-card">
            <div class="pwa-step-num">2</div>
            <div class="pwa-step-body">
              <div class="pwa-step-label">Select Add to Home Screen</div>
              <div class="pwa-step-desc">
                Scroll through the share sheet options and tap
                <span class="pwa-inline-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  Add to Home Screen
                </span>.
              </div>
            </div>
          </div>

          <div class="pwa-step-card">
            <div class="pwa-step-num">3</div>
            <div class="pwa-step-body">
              <div class="pwa-step-label">Launch from Home Screen</div>
              <div class="pwa-step-desc">
                Tap <strong>Add</strong> in the top-right corner, then launch Avalon from your Home Screen icon for the full console experience.
              </div>
            </div>
          </div>
        ` : `
          <div class="pwa-step-card">
            <div class="pwa-step-num">1</div>
            <div class="pwa-step-body">
              <div class="pwa-step-label">Open Browser Menu</div>
              <div class="pwa-step-desc">
                Tap the
                <span class="pwa-inline-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                  Menu
                </span>
                button in your browser header or address bar.
              </div>
            </div>
          </div>

          <div class="pwa-step-card">
            <div class="pwa-step-num">2</div>
            <div class="pwa-step-body">
              <div class="pwa-step-label">Install or Add to Home Screen</div>
              <div class="pwa-step-desc">
                Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> from the menu.
              </div>
            </div>
          </div>

          <div class="pwa-step-card">
            <div class="pwa-step-num">3</div>
            <div class="pwa-step-body">
              <div class="pwa-step-label">Launch Standalone Console</div>
              <div class="pwa-step-desc">
                Confirm installation to launch Avalon as a dedicated fullscreen landscape application.
              </div>
            </div>
          </div>
        `}
      </div>

      <div class="pwa-hardware-perk">
        <svg class="pwa-perk-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>Hardware Mode removes browser address bars, enables instant loading, and provides calibrated landscape twin sticks.</span>
      </div>

      <div class="pwa-modal-actions">
        ${deferredPrompt ? `
          <button type="button" id="pwa-native-install-btn" class="btn-primary" style="width: 100%; min-height: 44px; margin-bottom: 0.6rem;">
            ⚡ INSTALL APP NOW
          </button>
        ` : ''}
        <button type="button" id="pwa-dismiss-btn" class="${deferredPrompt ? 'btn-secondary' : 'btn-primary'}" style="width: 100%; min-height: 44px;">
          ${isIos ? 'GOT IT — CONTINUE TO CONSOLE' : (deferredPrompt ? 'MAYBE LATER' : 'GOT IT — CONTINUE')}
        </button>
      </div>
    </div>
  `;

  showModal(modalHtml, {
    labelledBy: 'pwa-modal-title',
    onClose: () => {
      try {
        sessionStorage.setItem('avalon_pwa_popup_dismissed', '1');
      } catch (e) {}
    }
  });

  const dismissBtn = document.getElementById('pwa-dismiss-btn');
  dismissBtn?.addEventListener('click', () => {
    try {
      sessionStorage.setItem('avalon_pwa_popup_dismissed', '1');
    } catch (e) {}
    closeModal();
  });

  const nativeInstallBtn = document.getElementById('pwa-native-install-btn');
  nativeInstallBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        deferredPrompt = null;
        closeModal();
      }
    } catch (e) {}
  });
}

/**
 * Initialize Orientation Guard (rotate device guidance) and lock handlers.
 */
export function initOrientationEnforcer() {
  const lockBtn = document.getElementById('orientation-lock-btn');
  const bypassBtn = document.getElementById('orientation-bypass-btn');

  // Check if user previously bypassed rotation lock in this session
  try {
    if (sessionStorage.getItem('avalon_orientation_bypassed') === '1') {
      document.body.classList.add('orientation-bypass');
    }
  } catch (e) {}

  lockBtn?.addEventListener('click', async () => {
    await gameMode.enter();
    await gameMode.lockLandscape();
  });

  bypassBtn?.addEventListener('click', () => {
    document.body.classList.add('orientation-bypass');
    try {
      sessionStorage.setItem('avalon_orientation_bypassed', '1');
    } catch (e) {}
  });

  // Re-attempt lock whenever entering landscape on mobile
  const onOrientationChange = () => {
    if (isMobileScreen()) {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape) {
        gameMode.lockLandscape();
      }
    }
  };

  window.addEventListener('resize', onOrientationChange);
  window.addEventListener('orientationchange', onOrientationChange);
  if (window.screen && window.screen.orientation) {
    try {
      window.screen.orientation.addEventListener('change', onOrientationChange);
    } catch (e) {}
  }

  // Attempt lock on boot
  if (isMobileScreen()) {
    gameMode.lockLandscape();
  }
}

/**
 * Main boot orchestrator for PWA installation & orientation.
 */
export function initPwaAndOrientation() {
  // Capture beforeinstallprompt event for Chromium browsers
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const hudBtn = document.getElementById('hud-install-btn');
    if (hudBtn) hudBtn.classList.add('hidden');
  });

  // Wire up the flaunted install button in the HUD
  const hudBtn = document.getElementById('hud-install-btn');
  if (hudBtn) {
    if (gameMode.isStandalone()) {
      hudBtn.classList.add('hidden');
    } else {
      hudBtn.classList.remove('hidden');
      hudBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showInstallModal({ manual: true });
      });
    }
  }

  // Initialize orientation enforcement
  initOrientationEnforcer();

  // If user isn't accessing this as an installed app, pop up on open
  if (!gameMode.isStandalone()) {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem('avalon_pwa_popup_dismissed') === '1';
    } catch (e) {}

    if (!dismissed) {
      setTimeout(() => {
        if (!gameMode.isStandalone()) {
          showInstallModal({ autoTriggered: true });
        }
      }, 450);
    }
  }
}
