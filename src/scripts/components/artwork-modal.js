/* ==========================================================================
   PlayStation 5 Official Artwork & Background Manager Studio
   - Comprehensive Artwork & Background Management System
   - Manage Hero Background (16:9), Game Card Cover (1:1 / 2:3), and Title Logo (PNG)
   - Separate game properties: gameId, title, execPath, coverImage, backgroundImage, logoImage, thumbnail, artworkSource, lastUpdated
   - Live real-time preview (hero wallpaper + game card + logo layer)
   - Automatic official discovery from Steam Store CDN, PlayStation Studios, Xbox catalogs
   - Manual local file selection via native Windows File Dialog (Electron dialog)
   - Image URL entry with validation & error handling
   - Atomic disk write & persistent JSON store
   - Smooth live UI update & background cross-fade without removing cards
   - Restore Default Artwork button to reset custom overrides safely
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { openOverlay, closeActiveOverlay } from './overlays.js';
import { applyArtworkToGame, searchOfficialArtwork } from '../services/artwork-service.js';
import { getCurrentItem } from './carousel.js';

let currentGame = null;
let activeTab = 'hero'; // 'hero', 'tile', 'logo'
let previewHero = '';
let previewTile = '';
let previewLogo = '';
let isDownloading = false;

/**
 * Open the Artwork Manager Studio for the given game (or current carousel item)
 * @param {object} game
 */
export function openArtworkManager(game) {
  const targetGame = game || getCurrentItem();
  if (!targetGame || targetGame.isExplore || targetGame.isStore || targetGame.isLibrary) {
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: "Artwork Manager",
        subtitle: "Select an installed game to customize its artwork."
      }
    }));
    return;
  }

  currentGame = targetGame;
  activeTab = 'hero';
  previewHero = targetGame.heroBg || targetGame.backgroundImage || '';
  previewTile = targetGame.tileIcon || targetGame.coverImage || '';
  previewLogo = targetGame.logoImg || targetGame.logoImage || '';
  isDownloading = false;

  renderArtworkModal();
  openOverlay('ps5-artwork-modal');
  try { ps5Audio.playOpenChime(); } catch (e) {}
}

/**
 * Backward-compatible trigger hook
 */
export function openArtDownloadModalForGame(game) {
  openArtworkManager(game);
}

/**
 * Render or re-render the Artwork Manager modal DOM
 */
function renderArtworkModal() {
  let modal = document.getElementById('ps5-artwork-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ps5-artwork-modal';
    modal.className = 'ps5-modal-overlay';
    document.body.appendChild(modal);
  }

  const title = currentGame ? (currentGame.title || 'Game Artwork') : 'Game Artwork';
  const appId = currentGame ? (currentGame.appId || '') : '';
  const currentSource = currentGame?.artworkSource || (currentGame?.hasCustomArtwork ? 'User Custom' : 'Default Official');

  modal.innerHTML = `
    <div class="ps5-modal-box ps5-artwork-studio-box ps5-fade-in" style="max-width: 960px; width: 92%; padding: 32px 36px; border-radius: 16px; background: rgba(14, 16, 24, 0.94); backdrop-filter: blur(28px); border: 1px solid rgba(255, 255, 255, 0.14); box-shadow: 0 24px 60px rgba(0,0,0,0.85); color: #fff;">
      
      <!-- Modal Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--ps-cyan, #38bdf8); font-weight: 700; margin-bottom: 4px;">PlayStation 5 Artwork & Background Studio</div>
          <h2 style="font-size: 26px; font-weight: 800; margin: 0; color: #fff;">${escapeHtml(title)}</h2>
          <div style="font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 4px;">
            <span>Current Source: <b style="color: #fff;">${escapeHtml(currentSource)}</b></span>
            ${appId ? `<span style="margin-left: 14px;">App ID: <b>${escapeHtml(appId)}</b></span>` : ''}
          </div>
        </div>
        <button class="modal-close-btn" id="art-studio-close-btn" style="background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 36px; height: 36px; color: #fff; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">✕</button>
      </div>

      <!-- Studio Layout: Left = Live Preview, Right = Controls -->
      <div style="display: grid; grid-template-columns: 360px 1fr; gap: 28px;">
        
        <!-- Left: Live Preview Column -->
        <div>
          <div style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.8); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Live Console Preview</div>
          
          <!-- Mini Hero Wallpaper Preview -->
          <div style="position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden; background: #060709; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 10px 24px rgba(0,0,0,0.6);">
            <div id="art-preview-hero" style="width: 100%; height: 100%; background: url('${escapeHtml(previewHero)}') center center / cover no-repeat; transition: all 0.3s ease;"></div>
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(6,7,9,0.85) 100%);"></div>
            
            <!-- Logo inside hero preview -->
            <div style="position: absolute; bottom: 12px; left: 14px; max-width: 60%; max-height: 40px; display: flex; align-items: flex-end;">
              ${previewLogo ? `<img id="art-preview-logo" src="${escapeHtml(previewLogo)}" style="max-height: 36px; max-width: 100%; object-fit: contain; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8));" alt="Logo" />` : `<span id="art-preview-logo-text" style="font-size: 14px; font-weight: 800; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.9);">${escapeHtml(title)}</span>`}
            </div>
          </div>
          
          <!-- Mini Game Card Tile Preview -->
          <div style="display: flex; align-items: center; gap: 14px; margin-top: 14px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
            <div style="width: 68px; height: 68px; border-radius: 8px; overflow: hidden; background: #111; border: 2px solid #fff; box-shadow: 0 0 12px rgba(255,255,255,0.3); flex-shrink: 0;">
              <img id="art-preview-tile" src="${escapeHtml(previewTile)}" style="width: 100%; height: 100%; object-fit: cover;" alt="Tile" onerror="this.src='/assets/games/explore/hero.svg'" />
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #fff;">Carousel Card</div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.5);">Square / 2:3 Cover Art</div>
              <div style="font-size: 11px; color: var(--ps-cyan, #38bdf8); margin-top: 2px;">Active in Games Track</div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 8px;">
            <button id="art-btn-apply-all" class="ps5-btn-primary" style="width: 100%; padding: 12px 18px; font-size: 14px; font-weight: 700; background: #0070d1; color: #fff; border: none; border-radius: 8px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span>💾 Apply Artwork & Save Changes</span>
            </button>
            <button id="art-btn-restore-default" class="ps5-btn-secondary" style="width: 100%; padding: 10px 18px; font-size: 13px; font-weight: 600; background: transparent; color: #f87171; border: 1px solid rgba(248, 113, 113, 0.4); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
              <span>↺ Restore Original Default Artwork</span>
            </button>
          </div>
        </div>

        <!-- Right: Studio Controls Column -->
        <div>
          <!-- Asset Category Tabs -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
            <button class="art-tab-btn ${activeTab === 'hero' ? 'active' : ''}" data-tab="hero" style="padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: ${activeTab === 'hero' ? '#fff' : 'rgba(255,255,255,0.08)'}; color: ${activeTab === 'hero' ? '#000' : '#fff'}; transition: all 0.2s;">
              🖼 16:9 Background Wallpaper
            </button>
            <button class="art-tab-btn ${activeTab === 'tile' ? 'active' : ''}" data-tab="tile" style="padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: ${activeTab === 'tile' ? '#fff' : 'rgba(255,255,255,0.08)'}; color: ${activeTab === 'tile' ? '#000' : '#fff'}; transition: all 0.2s;">
              🎴 Game Card Cover
            </button>
            <button class="art-tab-btn ${activeTab === 'logo' ? 'active' : ''}" data-tab="logo" style="padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: ${activeTab === 'logo' ? '#fff' : 'rgba(255,255,255,0.08)'}; color: ${activeTab === 'logo' ? '#000' : '#fff'}; transition: all 0.2s;">
              ✨ Title Logo (PNG)
            </button>
          </div>

          <!-- Tab Content Area -->
          <div id="art-tab-content-area" style="min-height: 280px;">
            ${renderTabContent()}
          </div>

          <!-- Status / Progress Banner -->
          <div id="art-studio-status-banner" style="display: ${isDownloading ? 'flex' : 'none'}; align-items: center; gap: 12px; margin-top: 16px; padding: 12px 16px; border-radius: 8px; background: rgba(0, 112, 209, 0.15); border: 1px solid rgba(0, 112, 209, 0.4); color: #fff;">
            <div class="ps5-connecting-spinner" style="width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <span id="art-studio-status-text" style="font-size: 13px; font-weight: 600;">Searching official catalogs and downloading 4K artwork...</span>
          </div>
        </div>

      </div>

    </div>
  `;

  attachModalEventListeners(modal);
}

/**
 * Render inner content for the currently active tab
 */
function renderTabContent() {
  const currentVal = activeTab === 'hero' ? previewHero : (activeTab === 'tile' ? previewTile : previewLogo);
  const label = activeTab === 'hero' ? 'Background Image' : (activeTab === 'tile' ? 'Cover Image (Tile)' : 'Title Logo Image');
  const spec = activeTab === 'hero' ? 'Recommended: 1920×1080 or 3840×2160 (16:9 Landscape)' : (activeTab === 'tile' ? 'Recommended: 600×600 (1:1) or 600×900 (2:3)' : 'Recommended: Transparent PNG (Clear background)');

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Option 1: Automatic Official Search -->
      <div style="padding: 16px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px;">Option 1: Automatic Official Discovery</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 12px;">Query official PlayStation Studios, Steam Store CDN & verified catalogs for authentic key art.</div>
        <button id="art-btn-auto-search" style="padding: 10px 18px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-weight: 700; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s;">
          🔍 Auto-Find Official ${label}
        </button>
      </div>

      <!-- Option 2: Choose from Local PC File -->
      <div style="padding: 16px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px;">Option 2: Choose Local Image from PC</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 12px;">Select any image file (.png, .jpg, .webp) stored on your computer. ${spec}</div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="art-btn-browse-file" style="padding: 10px 18px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-weight: 700; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s;">
            📁 Browse Local File...
          </button>
          <input type="file" id="art-hidden-file-input" accept="image/png, image/jpeg, image/webp" style="display: none;" />
          <span id="art-selected-file-label" style="font-size: 12px; color: rgba(255,255,255,0.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px;">No file chosen</span>
        </div>
      </div>

      <!-- Option 3: Manual Image URL -->
      <div style="padding: 16px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px;">Option 3: Custom Image URL</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 10px;">Paste a direct web link to an official or community image.</div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="art-url-input" value="${escapeHtml(currentVal || '')}" placeholder="https://..." style="flex: 1; padding: 10px 14px; border-radius: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 13px;" />
          <button id="art-btn-preview-url" style="padding: 10px 16px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-weight: 600; border-radius: 6px; cursor: pointer; font-size: 13px;">
            Preview
          </button>
        </div>
      </div>

    </div>
  `;
}

/**
 * Attach interactive event listeners to modal elements
 */
function attachModalEventListeners(modal) {
  // Close button
  document.getElementById('art-studio-close-btn')?.addEventListener('click', () => {
    closeActiveOverlay();
    try { ps5Audio.playBackCancel(); } catch (e) {}
  });

  // Tab switching
  modal.querySelectorAll('.art-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.getAttribute('data-tab');
      try { ps5Audio.playMoveTick(); } catch (e) {}
      renderArtworkModal();
    });
  });

  // Auto Search Button
  document.getElementById('art-btn-auto-search')?.addEventListener('click', async () => {
    if (!currentGame || isDownloading) return;
    setStudioDownloading(true, `Searching official sources for "${currentGame.title}"...`);

    try {
      let appId = currentGame.appId;
      if (!appId && typeof currentGame.id === 'string' && currentGame.id.startsWith('pc_steam_')) {
        appId = currentGame.id.replace('pc_steam_', '');
      }

      const res = await searchOfficialArtwork(currentGame.title, { appId, publisher: currentGame.studio });
      if (res && res.success) {
        if (activeTab === 'hero' && res.hero) {
          previewHero = res.hero;
          updatePreviewDisplay();
          setStudioDownloading(false, '✅ Official 4K Background discovered! Click "Apply" to save.');
        } else if (activeTab === 'tile' && res.tile) {
          previewTile = res.tile;
          updatePreviewDisplay();
          setStudioDownloading(false, '✅ Official Game Card Cover discovered! Click "Apply" to save.');
        } else if (activeTab === 'logo' && res.logo) {
          previewLogo = res.logo;
          updatePreviewDisplay();
          setStudioDownloading(false, '✅ Official Title Logo discovered! Click "Apply" to save.');
        } else {
          // Found general artwork
          if (res.hero) previewHero = res.hero;
          if (res.tile) previewTile = res.tile;
          if (res.logo) previewLogo = res.logo;
          updatePreviewDisplay();
          setStudioDownloading(false, '✅ Official Artwork Set discovered! Click "Apply" to save.');
        }
        try { ps5Audio.playSelectChime(); } catch (e) {}
      } else {
        setStudioDownloading(false, '⚠️ Could not find alternative artwork on public official servers.');
        try { ps5Audio.playBackCancel(); } catch (e) {}
      }
    } catch (err) {
      console.warn('[Artwork Studio] Search error:', err);
      setStudioDownloading(false, '⚠️ Search failed. Please check network connection.');
    }
  });

  // Local File Browse Button (Electron native dialog or HTML file input)
  document.getElementById('art-btn-browse-file')?.addEventListener('click', async () => {
    if (typeof window !== 'undefined' && window.electronAPI?.browseLocalImage) {
      try {
        const filePath = await window.electronAPI.browseLocalImage();
        if (filePath) {
          handleSelectedLocalFile(filePath);
        }
      } catch (err) {
        console.warn('[Artwork Studio] Browse error:', err);
      }
    } else {
      document.getElementById('art-hidden-file-input')?.click();
    }
  });

  document.getElementById('art-hidden-file-input')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const dataUrl = re.target.result;
        handleSelectedImageData(dataUrl, file.name);
      };
      reader.readAsDataURL(file);
    }
  });

  // Preview URL Button
  document.getElementById('art-btn-preview-url')?.addEventListener('click', () => {
    const inputVal = document.getElementById('art-url-input')?.value?.trim();
    if (inputVal) {
      if (activeTab === 'hero') previewHero = inputVal;
      else if (activeTab === 'tile') previewTile = inputVal;
      else if (activeTab === 'logo') previewLogo = inputVal;
      updatePreviewDisplay();
      try { ps5Audio.playSelectChime(); } catch (e) {}
    }
  });

  // Apply Changes Button
  document.getElementById('art-btn-apply-all')?.addEventListener('click', async () => {
    if (!currentGame) return;
    setStudioDownloading(true, 'Saving artwork to persistent storage & updating console...');

    try {
      const gameId = currentGame.id;

      // 1. If running under Electron, save custom assets to disk atomically
      if (typeof window !== 'undefined' && window.electronAPI?.saveCustomArtwork) {
        if (previewHero && previewHero !== currentGame.heroBg) {
          await window.electronAPI.saveCustomArtwork({
            gameId,
            type: 'hero',
            source: previewHero,
            title: currentGame.title
          });
        }
        if (previewTile && previewTile !== currentGame.tileIcon) {
          await window.electronAPI.saveCustomArtwork({
            gameId,
            type: 'tile',
            source: previewTile,
            title: currentGame.title
          });
        }
        if (previewLogo && previewLogo !== currentGame.logoImg) {
          await window.electronAPI.saveCustomArtwork({
            gameId,
            type: 'logo',
            source: previewLogo,
            title: currentGame.title
          });
        }
      }

      // 2. Apply via central artwork service
      await applyArtworkToGame(gameId, {
        hero: previewHero,
        tile: previewTile,
        logo: previewLogo,
        title: currentGame.title,
        source: 'User Custom Studio'
      });

      setStudioDownloading(false, '✅ Artwork successfully applied and saved!');
      try { ps5Audio.playBootChord(); } catch (e) {}

      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: "🎨 Custom Artwork Saved",
          subtitle: `New background and card successfully applied to "${currentGame.title}".`
        }
      }));

      setTimeout(() => {
        closeActiveOverlay();
      }, 700);

    } catch (err) {
      console.error('[Artwork Studio] Apply error:', err);
      setStudioDownloading(false, '⚠️ Failed to save artwork. Please try again.');
    }
  });

  // Restore Default Artwork Button
  document.getElementById('art-btn-restore-default')?.addEventListener('click', async () => {
    if (!currentGame) return;
    setStudioDownloading(true, 'Restoring original official artwork...');

    try {
      const gameId = currentGame.id;
      if (typeof window !== 'undefined' && window.electronAPI?.restoreDefaultArtwork) {
        await window.electronAPI.restoreDefaultArtwork(gameId);
      }

      // Re-trigger store sync / canonical artwork reset
      currentGame.hasCustomArtwork = false;
      currentGame.customArtwork = false;

      // Reset previews
      previewHero = '';
      previewTile = '';
      previewLogo = '';

      window.dispatchEvent(new CustomEvent('ps5-game-artwork-updated', {
        detail: { gameId, resetDefault: true }
      }));
      window.dispatchEvent(new CustomEvent('ps5-refresh-hero-display', { detail: { gameId } }));

      setStudioDownloading(false, '✅ Restored default artwork.');
      try { ps5Audio.playSelectChime(); } catch (e) {}

      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: "↺ Artwork Restored",
          subtitle: `Default official assets restored for "${currentGame.title}".`
        }
      }));

      setTimeout(() => {
        closeActiveOverlay();
      }, 700);

    } catch (err) {
      console.error('[Artwork Studio] Restore error:', err);
      setStudioDownloading(false, '⚠️ Could not restore default artwork.');
    }
  });
}

function handleSelectedLocalFile(filePath) {
  const lbl = document.getElementById('art-selected-file-label');
  if (lbl) lbl.textContent = filePath.split(/[\\/]/).pop();

  if (activeTab === 'hero') previewHero = filePath;
  else if (activeTab === 'tile') previewTile = filePath;
  else if (activeTab === 'logo') previewLogo = filePath;

  updatePreviewDisplay();
  try { ps5Audio.playSelectChime(); } catch (e) {}
}

function handleSelectedImageData(dataUrl, fileName) {
  const lbl = document.getElementById('art-selected-file-label');
  if (lbl) lbl.textContent = fileName || 'Selected image';

  if (activeTab === 'hero') previewHero = dataUrl;
  else if (activeTab === 'tile') previewTile = dataUrl;
  else if (activeTab === 'logo') previewLogo = dataUrl;

  updatePreviewDisplay();
  try { ps5Audio.playSelectChime(); } catch (e) {}
}

function updatePreviewDisplay() {
  const heroEl = document.getElementById('art-preview-hero');
  if (heroEl && previewHero) heroEl.style.backgroundImage = `url("${previewHero}")`;

  const tileEl = document.getElementById('art-preview-tile');
  if (tileEl && previewTile) tileEl.src = previewTile;

  const logoEl = document.getElementById('art-preview-logo');
  if (logoEl && previewLogo) logoEl.src = previewLogo;
}

function setStudioDownloading(active, text) {
  isDownloading = active;
  const banner = document.getElementById('art-studio-status-banner');
  const txt = document.getElementById('art-studio-status-text');
  if (banner) banner.style.display = active || text ? 'flex' : 'none';
  if (txt && text) txt.textContent = text;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function initArtworkModal() {
  // Global event listener for opening artwork manager
  window.addEventListener('ps5-open-artwork-studio', (e) => {
    openArtworkManager(e.detail?.game);
  });
}
