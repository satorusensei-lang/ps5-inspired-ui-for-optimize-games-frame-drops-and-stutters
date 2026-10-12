/* ==========================================================================
   PlayStation 5 PC Experience — Laptop Apps & Games Execution Service
   Communicates with Vite OS middleware to launch real .exe files & protocols
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';

export async function launchPCApp(item) {
  if (!item) return;

  // 1. Play signature PS5 boot chord
  ps5Audio.playBootChord();

  let launched = false;

  // 2. Direct Native Electron Desktop Launch (Zero sandbox / instant execution)
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
        window.dispatchEvent(new CustomEvent('ps5-show-notification', {
          detail: {
            title: `🚀 Launched: ${item.title}`,
            subtitle: "Game is running natively on Windows! DualSense controller active."
          }
        }));
      }
    } catch (err) {
      console.warn("Electron native launch error:", err);
    }
  }

  // 3. Fallback to local Vite OS middleware
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
          window.dispatchEvent(new CustomEvent('ps5-show-notification', {
            detail: {
              title: `🚀 Launched on Laptop: ${item.title}`,
              subtitle: "Game is now running on Windows. DualSense controller active!"
            }
          }));
        }
      }
    } catch (err) {
      console.warn("Local Vite backend not reachable, falling back to protocol handler:", err);
    }
  }

  // 3. Fallback to native browser protocol handler for Steam/Xbox/Spotify
  if (!launched && item.launchUri) {
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
  }

  // 4. Trigger PS5 In-Game Telemetry HUD
  window.dispatchEvent(new CustomEvent('ps5-launch-game', { detail: item }));
}

export async function closePCApp(item) {
  if (!item) return;

  // 1. Play signature cancel chime
  ps5Audio.playBackCancel();

  // Native Electron Close
  if (window.electronAPI?.closeGame) {
    try {
      await window.electronAPI.closeGame({
        execPath: item.execPath,
        title: item.title
      });
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: `🛑 Closed: ${item.title}`,
          subtitle: "Game closed on Windows. GPU & RAM resources freed."
        }
      }));
      return { success: true };
    } catch (e) {
      console.warn("Electron native close error:", e);
    }
  }

  try {
    const res = await fetch('/api/pc/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        execPath: item.execPath,
        uri: item.launchUri,
        appId: item.appId,
        title: item.title
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log('[PC Launcher] Close response:', data);
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: `🛑 Closed: ${item.title}`,
          subtitle: "Game closed on Windows. GPU & RAM resources freed."
        }
      }));
      return data;
    }
  } catch (err) {
    console.warn("Local Vite backend /api/pc/close not reachable:", err);
  }
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
