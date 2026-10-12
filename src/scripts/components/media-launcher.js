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

export function closeMediaApp() {
  ps5Audio.playBackCancel();

  const modal = document.getElementById('ps5-media-app-modal');
  modal?.classList.remove('active');

  isMediaOpen = false;
  currentMediaApp = null;
}

async function launchDedicatedWindow(app) {
  const info = getAppInfo(app);

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

  return {
    title: app.title || 'YouTube',
    url: 'https://www.youtube.com',
    color: '#ff0000',
    desc: `Running official ${app.title || 'YouTube'} in dedicated frameless app mode.`
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
    } else {
      iconWrap.innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#ff0000">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      `;
    }
  }
}
