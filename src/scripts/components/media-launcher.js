/* ==========================================================================
   PlayStation 5 Dedicated Media App Launcher
   - Launches official YouTube, YouTube Music, and Spotify in frameless app mode
   - Preserves user's signed-in Google / Spotify accounts
   - Standalone PS5 app window without browser tabs or address bars
   - Live PS5 In-Dashboard HUD card with quick switcher and return controls
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';

let isMediaOpen = false;
let currentMediaApp = null;
let currentMediaPid = null;

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export function initMediaLauncher() {
  const closeBtn = document.getElementById('media-app-close-btn');
  const reopenBtn = document.getElementById('btn-reopen-media-app');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeMediaApp());
  }

  if (reopenBtn) {
    reopenBtn.addEventListener('click', () => {
      ps5Audio.playSelectChime();
      if (currentMediaApp) {
        launchDedicatedWindow(currentMediaApp);
      }
    });
  }

  // Close when clicking modal backdrop outside the card
  const modal = document.getElementById('ps5-media-app-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeMediaApp();
      }
    });
  }
}

export function isMediaAppOpen() {
  return isMediaOpen;
}

export function getCurrentMediaApp() {
  return currentMediaApp;
}

export function openMediaApp(app) {
  if (!app) return;
  currentMediaApp = app;
  isMediaOpen = true;

  ps5Audio.playBootChord();

  // Update In-Dashboard HUD Card
  updateMediaModalUI(app);

  // Launch standalone frameless app
  launchDedicatedWindow(app);

  const modal = document.getElementById('ps5-media-app-modal');
  modal?.classList.add('active');

  window.dispatchEvent(new CustomEvent('ps5-show-notification', {
    detail: {
      title: `📺 ${app.title} (PlayStation 5 Edition)`,
      subtitle: 'Running in dedicated app mode • Press ESC or ○ Circle to return'
    }
  }));
}

export async function closeMediaApp() {
  ps5Audio.playBackCancel();

  if (currentMediaPid && window.electronAPI) {
    try {
      if (window.electronAPI.killPid) {
        await window.electronAPI.killPid(currentMediaPid);
      } else if (window.electronAPI.closeGame) {
        await window.electronAPI.closeGame({
          pid: currentMediaPid,
          title: currentMediaApp?.title
        });
      }
    } catch (err) {
      console.warn('[PS5 Media Launcher] Error terminating media process:', err);
    }
  } else if (currentMediaApp && window.electronAPI?.closeGame) {
    try {
      await window.electronAPI.closeGame({
        title: `${currentMediaApp.title} (PS5 Dedicated App)`
      });
    } catch (err) {
      console.warn('[PS5 Media Launcher] Error closing media app:', err);
    }
  }
  currentMediaPid = null;

  const modal = document.getElementById('ps5-media-app-modal');
  modal?.classList.remove('active');

  isMediaOpen = false;
  currentMediaApp = null;
}

async function launchDedicatedWindow(app) {
  const info = getAppInfo(app);
  currentMediaPid = null;

  // 1. Native Electron Desktop launch via IPC
  if (window.electronAPI?.launchGame) {
    try {
      let res = await window.electronAPI.launchGame({
        execPath: BRAVE_PATH,
        args: `--app=${info.url}`,
        title: `${app.title} (PS5 Dedicated App)`
      });

      if (!res?.success) {
        // Fallback to Edge
        res = await window.electronAPI.launchGame({
          execPath: EDGE_PATH,
          args: `--app=${info.url}`,
          title: `${app.title} (PS5 Dedicated App)`
        });
      }

      if (res?.success && res.pid) {
        currentMediaPid = res.pid;
      }
      return;
    } catch (err) {
      console.warn('[PS5 Media Launcher] Failed to launch via electronAPI:', err);
    }
  }

  // 2. Fallback to local Vite server in web mode
  try {
    const res = await fetch('/api/pc/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        execPath: BRAVE_PATH,
        args: `--app=${info.url}`,
        title: `${app.title} (PS5 Dedicated App)`
      })
    });

    const data = await res.json();
    if (!data.success) {
      // Fallback to Edge
      await fetch('/api/pc/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          execPath: EDGE_PATH,
          args: `--app=${info.url}`,
          title: `${app.title} (PS5 Dedicated App)`
        })
      });
    }
  } catch (err) {
    console.warn('[PS5 Media Launcher] Failed to launch via /api/pc/launch:', err);
    window.open(info.url, '_blank', 'popup,width=1320,height=820,menubar=no,toolbar=no,location=no,status=no');
  }
}

function getAppInfo(app) {
  if (!app) {
    return {
      title: 'YouTube',
      url: 'https://www.youtube.com',
      color: '#ff0000',
      desc: 'Running official YouTube with your signed-in Google account in dedicated frameless PS5 mode.'
    };
  }

  if (app.id === 'youtube-music') {
    return {
      title: 'YouTube Music',
      url: 'https://music.youtube.com',
      color: '#ff0000',
      desc: 'Streaming YouTube Music with your personal mixes, history, and background audio.'
    };
  }

  if (app.id === 'spotify') {
    return {
      title: 'Spotify Music',
      url: 'https://open.spotify.com',
      color: '#1db954',
      desc: 'Streaming Spotify with your saved playlists and high-fidelity background audio.'
    };
  }

  if (app.id === 'netflix') {
    return {
      title: 'Netflix',
      url: 'https://www.netflix.com',
      color: '#e50914',
      desc: 'Streaming Netflix with 4K HDR and Dolby Atmos support in dedicated console mode.'
    };
  }

  if (app.id === 'discord') {
    return {
      title: 'Discord',
      url: 'https://discord.com/app',
      color: '#5865f2',
      desc: 'Connect with voice channels, gaming servers, and direct messages.'
    };
  }

  if (app.id === 'twitch') {
    return {
      title: 'Twitch',
      url: 'https://www.twitch.tv',
      color: '#9146ff',
      desc: 'Watch live gaming broadcasts, esports tournaments, and streamer chats.'
    };
  }

  if (app.id === 'appletv') {
    return {
      title: 'Apple TV',
      url: 'https://tv.apple.com',
      color: '#ffffff',
      desc: 'Stream Apple Original movies and series in 4K Dolby Vision.'
    };
  }

  if (app.id === 'crunchyroll') {
    return {
      title: 'Crunchyroll',
      url: 'https://www.crunchyroll.com',
      color: '#f47521',
      desc: 'Stream anime simulcasts from Japan in HD with ad-free playback.'
    };
  }

  return {
    title: app.title || 'Media Player',
    url: 'https://www.youtube.com',
    color: '#0070d1',
    desc: `Running official ${app.title || 'Media'} in dedicated frameless app mode.`
  };
}

function updateMediaModalUI(app) {
  const info = getAppInfo(app);

  const titleEl = document.getElementById('ps5-media-app-name');
  const editionEl = document.getElementById('ps5-media-app-edition');
  const urlEl = document.getElementById('ps5-media-active-url');
  const descEl = document.getElementById('ps5-media-desc');
  const iconWrap = document.getElementById('ps5-media-icon-wrap');

  if (titleEl) titleEl.textContent = info.title;
  if (editionEl) editionEl.textContent = 'PlayStation®5 Dedicated App Mode';
  if (urlEl) urlEl.textContent = info.url;
  if (descEl) descEl.textContent = info.desc;

  if (iconWrap) {
    if (app.id === 'spotify') {
      iconWrap.innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#1db954">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10 5.524 0 10-4.476 10-10 0-5.523-4.476-10-10-10zm4.587 14.428a.627.627 0 0 1-.86.208c-2.355-1.439-5.32-1.764-8.813-.966a.627.627 0 1 1-.278-1.223c3.823-.873 7.098-.506 9.743 1.12.301.185.395.578.208.861zm1.226-2.724a.785.785 0 0 1-1.08.258c-2.696-1.657-6.806-2.136-9.995-1.168a.784.784 0 1 1-.453-1.5c3.642-1.106 8.192-.577 11.27 1.33.364.223.48.704.258 1.08zm.106-2.835C14.69 8.922 9.387 8.745 6.302 9.68a.94.94 0 0 1-.55-1.796c3.553-1.079 9.429-.87 13.13 1.328a.942.942 0 0 1-.963 1.657z"/>
        </svg>
      `;
    } else if (app.id === 'youtube-music') {
      iconWrap.innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#ff0000">
          <circle cx="12" cy="12" r="10" stroke="#ff0000" stroke-width="2" fill="none"/>
          <circle cx="12" cy="12" r="6" fill="#ff0000"/>
          <polygon points="10,9 15,12 10,15" fill="#ffffff"/>
        </svg>
      `;
    } else if (app.id === 'netflix') {
      iconWrap.innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#e50914">
          <path d="M4 2v20l7-10.5L4 2zm16 0l-7 9.5L20 22V2z"/>
        </svg>
      `;
    } else if (app.id === 'discord') {
      iconWrap.innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#5865f2">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      `;
    } else if (app.id === 'twitch') {
      iconWrap.innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#9146ff">
          <path d="M2.149 0l-1.612 4.119v16.8h5.9v3.081h3.763l3.08-3.081h4.693l5.527-5.527V0H2.149zm17.518 14.288l-3.322 3.322H11.5l-3.08 3.08v-3.08H4.664V2.215h15.003v12.073zM16.48 5.922h-2.15v6.438h2.15V5.922zm-5.526 0H8.804v6.438h2.15V5.922z"/>
        </svg>
      `;
    } else {
      iconWrap.innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#ff0000">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      `;
    }
  }
}
