/* ==========================================================================
   PlayStation 5 PC Experience — Laptop Apps & Games Execution Service
   Communicates with Vite OS middleware to launch real .exe files & protocols
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { getGameBoostSettings } from './settings-manager.js';

let pendingBoostMinimizeTimer = null;
let lastBoostTriggerAt = 0;

export function cancelPendingBoostMinimize() {
  if (pendingBoostMinimizeTimer) {
    clearTimeout(pendingBoostMinimizeTimer);
    pendingBoostMinimizeTimer = null;
  }
}

export function isNonGameBoostTarget(item) {
  if (!item) return true;
  if (item.isStore || item.isExplore || item.isLibrary) return true;
  if (String(item.appId) === '431960') return true;
  const titleLow = String(item.title || '').toLowerCase();
  if (titleLow.includes('wallpaper engine')) return true;
  const uri = String(item.launchUri || item.uri || '').toLowerCase();
  if (uri.startsWith('steam://install/') || uri.startsWith('http://') || uri.startsWith('https://')) return true;
  const genreLow = String(item.genre || '').toLowerCase();
  if (genreLow.includes('streaming') || genreLow.includes('music')) return true;
  if (['youtube', 'youtube-music', 'spotify', 'netflix', 'discord', 'twitch', 'appletv', 'crunchyroll'].includes(String(item.id || ''))) {
    return true;
  }
  return false;
}

export async function ensureAutoGameBoost(item) {
  if (isNonGameBoostTarget(item)) return null;
  const now = Date.now();
  if (now - lastBoostTriggerAt < 1500) {
    return { alreadyTriggered: true, active: true };
  }
  lastBoostTriggerAt = now;

  const boostCfg = typeof getGameBoostSettings === 'function' ? getGameBoostSettings() : {};
  const payload = {
    ...boostCfg,
    autoGameBoost: true,
    gameInfo: {
      id: item.id,
      title: item.title,
      appId: item.appId,
      store: item.store,
      execPath: item.execPath,
      launchUri: item.launchUri || item.uri
    }
  };

  document.body.classList.add('game-boost-idle');

  if (typeof window !== 'undefined' && window.electronAPI?.enableGameBoost) {
    try {
      return await window.electronAPI.enableGameBoost(payload);
    } catch (e) {
      console.warn('[Game Boost] Electron auto-boost warning:', e);
      return null;
    }
  }

  try {
    const res = await fetch('/api/pc/boost/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export function scheduleBoostMinimizeIfEnabled() {
  const boostCfg = typeof getGameBoostSettings === 'function' ? getGameBoostSettings() : {};
  if (boostCfg?.boostMinimizeOnLaunch !== false && typeof window !== 'undefined' && window.electronAPI?.minimizeWindow) {
    cancelPendingBoostMinimize();
    window.electronAPI.minimizeWindow();
  }
}

export async function launchPCApp(item) {
  if (!item) return;

  // 1. Trigger PS5 launch HUD immediately, and let pre-launch cleanup release browser/chat VRAM/SSD load before starting game
  const boostPromise = ensureAutoGameBoost(item).catch(() => null);
  window.dispatchEvent(new CustomEvent('ps5-launch-game', { detail: item }));

  // Give background bloat closing up to 900ms to flush caches and free VRAM BEFORE game/DX12 initializes
  await Promise.race([
    boostPromise,
    new Promise(resolve => setTimeout(resolve, 900))
  ]);

  let launched = false;

  // 3. Direct Native Electron Desktop Launch (Zero sandbox / instant execution)
  if (window.electronAPI?.launchGame) {
    try {
      const res = await window.electronAPI.launchGame({
        execPath: item.execPath,
        uri: item.launchUri,
        appId: item.appId,
        title: item.title,
        args: item.execArgs || item.args || ''
      });
      if (res?.success) {
        launched = true;
        // Do not minimize immediately; Electron's launch-readiness guard keeps PS5
        // above Steam's launch overlay and minimizes only once the game window loads.
        boostPromise.catch(() => {});
      } else {
        cancelPendingBoostMinimize();
        boostPromise.then((boostReport) => {
          if (boostReport?.active && window.electronAPI?.disableGameBoost) {
            document.body.classList.remove('game-boost-idle');
            window.electronAPI.disableGameBoost({ restoreClosedApps: false }).catch(() => {});
          }
        });
      }
    } catch (err) {
      console.warn("Electron native launch error:", err);
      cancelPendingBoostMinimize();
      boostPromise.then((boostReport) => {
        if (boostReport?.active && window.electronAPI?.disableGameBoost) {
          document.body.classList.remove('game-boost-idle');
          window.electronAPI.disableGameBoost({ restoreClosedApps: false }).catch(() => {});
        }
      });
    }
  }

  // 4. Fallback to local Vite OS middleware
  if (!launched && (item.execPath || item.launchUri)) {
    try {
      const res = await fetch('/api/pc/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          execPath: item.execPath,
          uri: item.launchUri,
          appId: item.appId,
          title: item.title,
          args: item.execArgs || item.args || ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          launched = true;
          boostPromise.then((boostReport) => {
            if (boostReport?.active) {
              const closedCount = Array.isArray(boostReport.closedApps) ? boostReport.closedApps.length : 0;
              const freedLabel = boostReport.freedMb > 0 ? `${Math.round(boostReport.freedMb)} MB freed` : 'Anti-Stutter active';
              const closedText = closedCount > 0 ? `Closed ${closedCount} background app${closedCount > 1 ? 's' : ''} (${freedLabel})` : freedLabel;
              window.dispatchEvent(new CustomEvent('ps5-show-notification', {
                detail: {
                  title: `⚡ Game Boost v2 Active: ${item.title}`,
                  subtitle: `${closedText} • Anti-Stutter & GPU Priority tuned`
                }
              }));
            } else {
              window.dispatchEvent(new CustomEvent('ps5-show-notification', {
                detail: {
                  title: `🚀 Launched on Laptop: ${item.title}`,
                  subtitle: "Game is now running on Windows. DualSense controller active!"
                }
              }));
            }
          });
        }
      }
    } catch (err) {
      console.warn("Local Vite backend not reachable, falling back to protocol handler:", err);
    }
  }

  // 3. Fallback to native browser protocol handler for Steam/Xbox/Spotify (pure web mode only)
  if (!launched && item.launchUri && !window.electronAPI) {
    try {
      window.location.href = item.launchUri;
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: `🚀 Opening ${item.title}`,
          subtitle: "Launching via Windows protocol handler"
        }
      }));
    } catch (e) {
      console.error("Protocol launch error:", e);
    }
  } else if (!launched && window.electronAPI) {
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: `⚠️ Launch Failed: ${item.title}`,
        subtitle: "Could not launch application on desktop."
      }
    }));
  }
}

function sanitizeCloseReason(message) {
  // Keep failure subtitles useful but avoid echoing raw file paths or system
  // details back through the toast.
  const trimmed = String(message || '').trim();
  if (!trimmed) return 'Could not close the application on desktop.';
  if (trimmed.toLowerCase().includes('does not exist on disk') ||
      trimmed.toLowerCase().includes('no eligible executables found')) {
    return 'The game could not be matched to a running executable on this PC.';
  }
  if (trimmed.toLowerCase().includes('utility app cannot be closed')) {
    return 'That app is a utility and is not treated as a console game.';
  }
  if (trimmed.toLowerCase().includes('cannot close a process from a non-steam uri')) {
    return 'Closing by URI is not supported; use the app\'s own quit command.';
  }
  // Default: keep it short and actionable without leaking internals.
  return 'Could not close the application on desktop.';
}

export async function closePCApp(item) {
  if (!item) return;

  // 1. Play signature cancel chime
  ps5Audio.playBackCancel();

  // Build a safe close request: only forward fields the backend uses for
  // validated target resolution (appId/launchUri and, where applicable, the
  // execPath of an app this dashboard itself launched).
  const closePayload = {};
  if (item.appId) closePayload.appId = item.appId;
  if (item.launchUri) closePayload.launchUri = item.launchUri;
  if (item.execPath) closePayload.execPath = item.execPath;

  let lastError = null;

  // Native Electron Close
  if (window.electronAPI?.closeGame) {
    try {
      const res = await window.electronAPI.closeGame(closePayload);
      if (res?.success) {
        window.dispatchEvent(new CustomEvent('ps5-show-notification', {
          detail: {
            title: `🛑 Closed: ${item.title || 'Game'}`,
            subtitle: "Game closed on Windows. GPU & RAM resources freed."
          }
        }));
        return { success: true };
      }
      lastError = res?.error || 'Electron reported a close failure.';
    } catch (e) {
      lastError = e?.message || 'Electron native close error.';
      console.warn('Electron native close error:', e);
    }
  }

  // Fallback to the Vite backend close endpoint (dev mode only).
  if (!window.electronAPI) {
    try {
      const res = await fetch('/api/pc/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closePayload)
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log('[PC Launcher] Close response:', data);
        await fetch('/api/pc/boost/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restoreClosedApps: Boolean(getGameBoostSettings()?.boostRestoreClosedApps) })
        }).catch(() => {});
        document.body.classList.remove('game-boost-idle');
        window.dispatchEvent(new CustomEvent('ps5-show-notification', {
          detail: {
            title: `🛑 Closed: ${item.title || 'Game'}`,
            subtitle: "Game closed on Windows. GPU & RAM resources freed."
          }
        }));
        return data;
      }

      const body = await res.json().catch(() => ({}));
      lastError = body?.error || `Close request returned HTTP ${res.status}.`;
    } catch (err) {
      lastError = err?.message || 'Local Vite backend /api/pc/close not reachable.';
      console.warn('Local Vite backend /api/pc/close not reachable:', err);
    }
  }

  // Surface a sanitized reason so the user sees something useful.
  if (lastError) {
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: `⚠️ Close Failed: ${item.title || 'Game'}`,
        subtitle: sanitizeCloseReason(lastError)
      }
    }));
  }

  return { success: false, error: lastError };
}

export async function scanLaptopForGames() {
  try {
    const res = await fetch('/api/pc/scan');
    if (res.ok) {
      const data = await res.json();
      return data.games || [];
    }
  } catch (err) {
    console.warn("Scan failed:", err);
  }
  return [];
}
