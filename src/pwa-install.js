/**
 * pwa-install.js — Home screen installation & orientation enforcement.
 *
 * Mobile-only: On desktop / laptop, neither the install prompt nor the rotate
 * guard are shown.
 *
 * On mobile screens:
 * - Flaunts installation via HUD button and auto-popup on app open if not installed.
 * - Shows: "Add Avalon to Home Screen for a better experience" followed by steps.
 * - Shows rotate advisory: ONLY "Rotate your device for the best experience" with the graphic.
 */

import { gameMode } from './game-mode.js';
import { showModal, closeModal } from './ui/modal.js';

let deferredPrompt = null;

export function isMobileScreen() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const coarse = Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const fine = Boolean(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
  const hoverNone = Boolean(window.matchMedia && window.matchMedia('(hover: none)').matches);

  // Desktop or laptop (fine pointer/hover, no mobile UA) is never mobile
  if (!isMobileUa && (fine || !coarse || !hoverNone)) {
    return false;
  }

  return isMobileUa || (coarse && hoverNone);
}

export function isIosDevice() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
}

/**
 * Show the Add to Home Screen popup dialog (mobile only).
 */
export function showInstallModal(opts = {}) {
  if (!isMobileScreen()) return;
  const isIos = isIosDevice();
  const isStandalone = gameMode.isStandalone();
  if (isStandalone) return;

  const modalHtml = `
    <div class="pwa-install-dialog" role="document">
      <div class="pwa-modal-head" style="margin-bottom: 1.15rem;">
        <h2 id="pwa-modal-title" class="pwa-modal-title" style="font-size: 1.15rem; letter-spacing: 0.1em; line-height: 1.35; color: var(--text-bright); margin: 0;">Add Avalon to Home Screen for a better experience</h2>
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

      <div class="pwa-modal-actions">
        ${deferredPrompt ? `
          <button type="button" id="pwa-native-install-btn" class="btn-primary" style="width: 100%; min-height: 44px; margin-bottom: 0.6rem;">
            ⚡ INSTALL APP NOW
          </button>
        ` : ''}
        <button type="button" id="pwa-dismiss-btn" class="${deferredPrompt ? 'btn-secondary' : 'btn-primary'}" style="width: 100%; min-height: 44px;">
          ${deferredPrompt ? 'MAYBE LATER' : 'GOT IT'}
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
 * Initialize Orientation Guard and lock handlers (mobile only).
 */
export function initOrientationEnforcer() {
  if (!isMobileScreen()) {
    const guard = document.getElementById('orientation-guard');
    if (guard) guard.classList.add('hidden');
    return;
  }

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
  gameMode.lockLandscape();
}

/**
 * Main boot orchestrator for PWA installation & orientation.
 * Explicitly guards against desktop / laptop.
 */
export function initPwaAndOrientation() {
  // Never show on desktop / laptop
  if (!isMobileScreen()) {
    const hudBtn = document.getElementById('hud-install-btn');
    if (hudBtn) hudBtn.classList.add('hidden');
    const guard = document.getElementById('orientation-guard');
    if (guard) guard.classList.add('hidden');
    return;
  }

  // Capture beforeinstallprompt event for Chromium browsers on mobile
  window.addEventListener('beforeinstallprompt', (e) => {
    if (!isMobileScreen()) return;
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const hudBtn = document.getElementById('hud-install-btn');
    if (hudBtn) hudBtn.classList.add('hidden');
  });

  // Wire up flaunted install button in the HUD (mobile only)
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

  // If user isn't accessing this as an installed app on mobile, pop up on open
  if (!gameMode.isStandalone()) {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem('avalon_pwa_popup_dismissed') === '1';
    } catch (e) {}

    if (!dismissed) {
      setTimeout(() => {
        if (!gameMode.isStandalone() && isMobileScreen()) {
          showInstallModal({ autoTriggered: true });
        }
      }, 450);
    }
  }
}
