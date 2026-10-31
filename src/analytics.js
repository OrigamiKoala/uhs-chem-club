/**
 * analytics.js — Vercel Web Analytics integration for Avalon
 */

import { inject, pageview, track } from '@vercel/analytics';

let initialized = false;

/**
 * Normalizes a URL event so hash-based client routing is reported cleanly in Vercel.
 */
function normalizeEventUrl(event) {
  if (typeof window === 'undefined' || !event?.url) return event;
  try {
    const url = new URL(event.url);
    if (url.hash && url.hash.startsWith('#/')) {
      const hashPath = url.hash.slice(1).split('?')[0] || '/';
      url.pathname = hashPath;
      url.hash = '';
      event.url = url.toString();
    }
  } catch (_) {}
  return event;
}

/**
 * Initialize Vercel Analytics with custom hash-routing support.
 */
export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  try {
    inject({
      mode: 'auto',
      disableAutoTrack: true,
      beforeSend: normalizeEventUrl
    });
    initialized = true;
  } catch (err) {
    console.warn('[analytics] Failed to initialize Vercel Analytics:', err);
  }
}

/**
 * Record a route change / pageview.
 * @param {string} [path] - Concrete URL path, e.g. '/learn/unit01/q1'
 * @param {string} [route] - Parameterized route pattern, e.g. '/learn/[worldId]/[questId]'
 */
export function trackPageView(path, route) {
  if (typeof window === 'undefined') return;
  const currentPath = path || (window.location.hash.slice(1).split('?')[0]) || '/';
  const currentRoute = route || currentPath;
  try {
    pageview({
      path: currentPath,
      route: currentRoute
    });
  } catch (_) {}
}

/**
 * Record a custom event.
 * @param {string} name - Event name
 * @param {Record<string, string | number | boolean | null>} [data] - Event properties
 */
export function trackEvent(name, data) {
  if (typeof window === 'undefined') return;
  try {
    track(name, data);
  } catch (_) {}
}

