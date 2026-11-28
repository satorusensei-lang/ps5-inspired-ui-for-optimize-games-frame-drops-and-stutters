/* ==========================================================================
   PS5GameCard - Standardized PlayStation 5 Game Card Component
   - Ensures 100% visual parity across Home Carousel & Game Library Grid
   - Authentic 1:1 square tiles with PS5 curvature, selection ring, & soft glow
   - Controlled selection scaling with smooth 120fps hardware-accelerated transitions
   - Non-obtrusive platform badges & download progress bars
   - High-fidelity asset resolution with CDN & local fallbacks
   ========================================================================== */

import { resolveAssetUrl } from '../services/artwork-service.js';

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const PS5GameCard = {
  /**
   * Returns canonical platform badge text (STEAM, XBOX, EPIC, RIOT, EA, GOG, PC)
   */
  getPlatformBadge(item, currentTab = 'games') {
    if (!item) return 'PC';
    if (currentTab === 'media') return item.badge || 'App';
    if (item.platformBadge) return String(item.platformBadge).toUpperCase();
    if (item.platform && item.platform !== 'PC' && item.platform !== 'PS5') {
      return String(item.platform).toUpperCase();
    }
    const idStr = String(item.id || '').toLowerCase();
    const store = String(item.store || item.source || '').toLowerCase();
    if (store === 'steam') return 'STEAM';
    if (store === 'epic') return 'EPIC';
    if (store === 'xbox') return 'XBOX';
    if (store === 'riot') return 'RIOT';
    if (store === 'ubisoft') return 'UBI';
    if (store === 'ea') return 'EA';
    if (store === 'gog') return 'GOG';
    if (store === 'playstation') return 'PS5';
    if (idStr.startsWith('epic_')) return 'EPIC';
    if (item.xboxTitleId || idStr.startsWith('xbox_')) return 'XBOX';
    if (idStr === 'pc_valorant') return 'RIOT';
    if (idStr.startsWith('ubisoft_')) return 'UBI';
    if (idStr.startsWith('ea_')) return 'EA';
    if (idStr.startsWith('gog_')) return 'GOG';
    if (idStr.startsWith('ps-')) return 'PS5';
    if (idStr.startsWith('pc_steam_') || item.appId) return 'STEAM';
    return 'PC';
  },

  /**
   * Standardized game action state for Play/Install buttons
   */
  getActionState(item, currentTab = 'games', dlState = null) {
    if (!item) {
      return { label: 'Play Game', action: 'launch', isInstalled: true, isDownloading: false };
    }
    if (item.isStore) {
      return { label: 'Browse Store', action: 'browse', isInstalled: true, isDownloading: false };
    }
    if (item.isLibrary) {
      return { label: currentTab === 'games' ? 'Open Library' : 'Open Apps', action: 'browse', isInstalled: true, isDownloading: false };
    }
    if (item.isExplore) {
      return { label: 'Explore News', action: 'browse', isInstalled: true, isDownloading: false };
    }

    if (dlState) {
      const isPaused = dlState.status === 'Paused';
      const pct = dlState.downloadPercent !== undefined ? Math.round(dlState.downloadPercent) : null;
      if (isPaused) {
        return { label: 'Resume', action: 'resume', isInstalled: false, isDownloading: true, isPaused: true };
      }
      return {
        label: pct !== null ? `Downloading ${pct}%` : dlState.status || 'Downloading',
        action: 'pause',
        isInstalled: false,
        isDownloading: true,
        percent: pct
      };
    }

    if (item.installed) {
      return {
        label: currentTab === 'media' ? 'Open App' : 'Play Game',
        action: 'launch',
        isInstalled: true,
        isDownloading: false
      };
    }

    return {
      label: 'Install',
      action: 'install',
      isInstalled: false,
      isDownloading: false
    };
  },

  /**
   * Renders a carousel track card (Store, Library, Explore, or Game Tile)
   */
  renderTrackCard(item, idx, activeIndex, options = {}) {
    const { dlState = null, currentTab = 'games', dividerHtml = '' } = options;
    const isActive = idx === activeIndex;

    // 0. Official PlayStation Explore Tile
    if (item.isExplore) {
      return `
        ${dividerHtml}
        <div class="ps5-tile tile-explore ${isActive ? 'active' : ''}" data-index="${idx}" data-game-id="${item.id}" tabindex="0">
          <div class="ps5-tile-inner explore-gradient">
            <div class="ps5-tile-explore-content">
              <div class="ps5-tile-explore-icon">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="9"/>
                  <polygon points="12 6.5 15.2 13.5 12 12 8.8 13.5 12 6.5" fill="currentColor"/>
                </svg>
              </div>
              <span class="ps5-tile-explore-badge">Explore</span>
            </div>
          </div>
        </div>
      `;
    }

    // 1. PlayStation Store Tile
    if (item.isStore) {
      return `
        ${dividerHtml}
        <div class="ps5-tile tile-store ${isActive ? 'active' : ''}" data-index="${idx}" data-game-id="${item.id}" tabindex="0">
          <div class="ps5-tile-inner store-gradient">
            <div class="ps5-tile-store-content">
              <div class="ps5-tile-store-icon">
                <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Game Library Tile
    if (item.isLibrary) {
      return `
        ${dividerHtml}
        <div class="ps5-tile tile-library ${isActive ? 'active' : ''}" data-index="${idx}" data-game-id="${item.id}" tabindex="0">
          <div class="ps5-tile-inner">
            <div class="ps5-tile-library-content">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </div>
          </div>
        </div>
      `;
    }

    // 3. Regular Installed / Owned Game Tile
    const resolvedIcon = resolveAssetUrl(item.tileIcon, item.appId, 'tile');
    const isDownloadingTile = Boolean(dlState);
    const dlTilePct = dlState && dlState.downloadPercent !== undefined ? Math.round(dlState.downloadPercent) : null;
    const badgeLabel = dlState
      ? (dlTilePct !== null ? `${dlTilePct}%` : dlState.status)
      : this.getPlatformBadge(item, currentTab);
    const isReadyToDownload = !item.installed && item.appId && !isDownloadingTile;

    return `
      ${dividerHtml}
      <div class="ps5-tile ${isActive ? 'active' : ''} ${item.installed ? 'installed' : 'cloud'} ${isDownloadingTile ? 'tile-downloading ' + dlState.status.toLowerCase() : ''}" data-index="${idx}" data-game-id="${item.id}" draggable="${!item.isExplore && !item.isStore && !item.isLibrary}" tabindex="0">
        <div class="ps5-tile-inner">
          ${isDownloadingTile ? `
            <div class="ps5-tile-platform-badge dl-badge">
              <span class="ps5-tile-cloud-wrap">
                <svg class="ps5-dl-cloud-svg ${dlState?.status === 'Downloading' ? 'animating' : ''}" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
              </span>
              <span class="ps5-badge-text ps5-badge-dl-text">${escapeHtml(badgeLabel)}</span>
            </div>
          ` : ''}
          ${resolvedIcon ? `
            <img class="ps5-tile-img" src="${resolvedIcon}" alt="${escapeHtml(item.title)}" loading="eager" decoding="async" onerror="if (!this.dataset.cdnTried && '${item.appId || ''}') { this.dataset.cdnTried='1'; this.src='https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.appId}/library_600x900_2x.jpg'; } else if (this.dataset.cdnTried==='1' && '${item.appId || ''}') { this.dataset.cdnTried='2'; this.src='https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.appId}/header.jpg'; } else { this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex'; }" />
          ` : ''}
          <div class="ps5-tile-fallback" style="${resolvedIcon ? 'display: none;' : 'display: flex;'}">
            <svg viewBox="0 0 24 24" width="22" height="18" fill="rgba(255,255,255,0.35)" style="margin-bottom: 6px;">
              <path d="M15.858 11.451c-.313.395-1.079.676-1.079.676l-5.696 2.046v-1.509l4.192-1.493c.476-.17.549-.412.162-.538c-.386-.127-1.085-.09-1.56.08l-2.794.984v-1.566l.161-.054s.807-.286 1.942-.412c1.135-.125 2.525.017 3.616.43c1.23.39 1.368.962 1.056 1.356M9.625 8.883v-3.86c0-.453-.083-.87-.508-.988c-.326-.105-.528.198-.528.65v9.664l-2.606-.827V2c1.108.206 2.722.692 3.59.985c2.207.757 2.955 1.7 2.955 3.825c0 2.071-1.278 2.856-2.903 2.072Zm-8.424 3.625C-.061 12.15-.271 11.41.304 10.984c.532-.394 1.436-.69 1.436-.69l3.737-1.33v1.515l-2.69.963c-.474.17-.547.411-.161.538c.386.126 1.085.09 1.56-.08l1.29-.469v1.356l-.257.043a8.45 8.45 0 0 1-4.018-.323Z"/>
            </svg>
            <span class="fallback-title">${escapeHtml(item.title)}</span>
          </div>
          ${isDownloadingTile ? `
            <div class="ps5-tile-dl-bar">
              <div class="ps5-tile-dl-fill ${dlState.status.toLowerCase()}" style="width: ${dlTilePct !== null ? dlTilePct : 0}%;"></div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Renders a game card in the full-screen Game Library Grid
   */
  renderLibraryCard(item, idx, options = {}) {
    const { storeMeta = null } = options;
    const badgeColor = storeMeta ? storeMeta.color : '#3b82f6';
    const badgeText = storeMeta ? storeMeta.name : this.getPlatformBadge(item);
    const resolvedIcon = resolveAssetUrl(item.tileIcon, item.appId, 'tile');

    return `
      <div class="lib-card ${item.installed ? 'installed' : 'uninstalled'}" tabindex="0" role="button" data-index="${idx}" data-game-id="${item.id}">
        <div class="lib-card-thumb">
          ${resolvedIcon ? `
            <img class="lib-card-img" src="${resolvedIcon}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
          ` : ''}
          <div class="lib-card-fallback" style="${resolvedIcon ? 'display: none;' : 'display: flex;'}">
            <span>${escapeHtml(item.title)}</span>
          </div>
          <span class="lib-card-store-pill" style="border-left: 3px solid ${badgeColor};">${escapeHtml(badgeText)}</span>
          ${item.installed ? '<span class="lib-card-installed-badge"><svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg> Installed</span>' : ''}
        </div>
        <div class="lib-card-info">
          <div class="lib-card-title">${escapeHtml(item.title)}</div>
          <div class="lib-card-sub">${escapeHtml(item.installed ? (item.playTime || 'Ready to Play') : (item.installSize || 'Ready to Install'))}</div>
        </div>
      </div>
    `;
  }
};
