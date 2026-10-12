/* ==========================================================================
   PlayStation 5 High-Performance 120FPS Carousel & Game Hub Engine
   - 3 Modes: PS5 Games, Media Apps, and My PC (Real Laptop Apps & Games)
   - Real Windows .exe & Steam Protocol Execution
   - Laptop Game Scanner & Custom App Configurator
   - Vertical Navigation: Carousel <-> Game Hub (Activities & Help)
   ========================================================================== */

import { PS5_GAMES, setGameInstalled, syncPCInstalledGames, deduplicateGameList, getPS5Games, OFFICIAL_STEAM_STORE_SIZES } from '../data/ps5-games-data.js';
import { PS5_MEDIA_APPS, setMediaInstalled } from '../data/ps5-media-data.js';
import { launchPCApp, scanLaptopForGames } from './pc-launcher.js';
import { ps5Audio } from '../audio/ps5-audio.js';
import { openOverlay, closeActiveOverlay } from './overlays.js';
import { openMediaApp } from './media-launcher.js';

let currentTab = 'games'; // 'games' | 'media'
let activeIndex = 0;
let homeItems = []; 
let isGameHubActive = false;
let activeActivityIndex = 0;
let libraryModalOpen = false;
let libraryActiveTab = 'installed'; // 'installed' | 'collection'

// DOM element references
let trackElement = null;
let tileElements = [];
let carouselContainer = null;
let heroLogo = null;
let heroTitle = null;
let heroStudio = null;
let heroMeta = null;
let heroActivities = null;
let playBtn = null;
let playBtnLabel = null;
let playBtnIcon = null;
let bgLayerA = null;
let bgLayerB = null;

export function initCarousel() {
  carouselContainer = document.getElementById('ps5-tiles-carousel');
  heroLogo = document.getElementById('ps5-hero-logo');
  heroTitle = document.getElementById('ps5-hero-title');
  heroStudio = document.getElementById('ps5-hero-studio');
  heroMeta = document.getElementById('ps5-hero-meta');
  heroActivities = document.getElementById('ps5-activities-row');
  playBtn = document.getElementById('ps5-play-btn');
  playBtnLabel = playBtn?.querySelector('span');
  playBtnIcon = document.getElementById('ps5-play-btn-icon') || playBtn?.querySelector('svg');
  bgLayerA = document.getElementById('ps5-bg-layer-a');
  bgLayerB = document.getElementById('ps5-bg-layer-b');

  // Wire tab buttons (Games & Media)
  document.getElementById('tab-games')?.addEventListener('click', () => switchTab('games'));
  document.getElementById('tab-media')?.addEventListener('click', () => switchTab('media'));

  // Preload all assets in parallel into GPU memory
  preloadAssets();

  // Initialize Library Modal
  initLibraryModal();

  // Clean up legacy cached tiles, deduplicate, and repair any corrupted entries in localStorage
  try {
    const raw = localStorage.getItem('ps5_synced_pc_games');
    if (raw) {
      const list = JSON.parse(raw);
      const cleaned = list.filter(g => 
        g && 
        g.id !== 'pc_forza_horizon' && 
        g.title !== 'Forza Horizon' && 
        !g.tileIcon?.includes('photo-1550745165-9bc0b252726f')
      );
      cleaned.forEach(g => {
        if (OFFICIAL_STEAM_STORE_SIZES && OFFICIAL_STEAM_STORE_SIZES[g.appId] && !g.installed) {
          g.installSize = OFFICIAL_STEAM_STORE_SIZES[g.appId];
          g.liveStatus = `Owned on Steam • ${g.installSize} Download`;
        }
        if (g.appId === '2483190' || g.id === 'pc_steam_2483190') {
          g.installed = true;
          g.badge = 'Installed';
          g.title = 'Forza Horizon 6';
          g.installSize = '167 GB';
          g.liveStatus = 'Installed on Laptop • 167 GB Ready to Launch';
          g.logoImg = '/assets/games/forza6/logo.png';
          g.tileIcon = '/assets/games/forza6/tile.jpg';
          g.heroBg = '/assets/games/forza6/hero.jpg';
        }
        if (g.appId === '431960' || g.id === 'pc_steam_431960') {
          g.installSize = '512 MB';
        }
        if (g.appId === '2358720' || g.id === 'pc_steam_2358720') {
          g.tileIcon = '/assets/games/wukong/ps5_tile.webp';
          g.heroBg = '/assets/games/wukong/ps5_hero.webp';
        }
        if (g.appId === '851850' || g.id === 'pc_steam_851850') {
          g.installSize = '116.86 GB';
          g.liveStatus = 'Owned on Steam • 116.86 GB Download';
        }
        if (g.id === 'pc_valorant' || g.appId === 'valorant' || (g.title && g.title.toLowerCase() === 'valorant')) {
          g.id = 'pc_valorant';
          g.installed = true;
          g.badge = 'Installed';
          g.title = 'VALORANT';
          g.installSize = '45.2 GB';
          g.storageType = 'Laptop SSD (Riot Games)';
          g.liveStatus = 'Installed on Laptop • Low Latency 240FPS Vanguard Active';
          g.logoImg = '/assets/games/valorant/ps5_logo.svg';
          g.tileIcon = '/assets/games/valorant/ps5_master.png';
          g.heroBg = '/assets/games/valorant/ps5_gamehub_cover.png';
          g.execPath = 'C:\\Riot Games\\Riot Client\\RiotClientServices.exe';
          g.execArgs = '--launch-product=valorant --launch-patchline=live';
        }
      });
      const deduped = deduplicateGameList(cleaned);
      localStorage.setItem('ps5_synced_pc_games', JSON.stringify(deduped));
    }
  } catch (e) {}

  // Initial load
  loadTabItems();

  // Mouse Wheel Vertical Navigation: Carousel <-> Game Hub
  window.addEventListener('wheel', (e) => {
    if (libraryModalOpen) return;
    if (e.deltaY > 32 && !isGameHubActive) {
      enterGameHub();
    } else if (e.deltaY < -32 && isGameHubActive) {
      exitGameHub();
    }
  }, { passive: true });

  window.ps5OpenExploreHub = () => {
    openOverlay('ps5-explore-modal');
  };

  // Immediately sync all Steam games from PC/Steam on startup and show in games category
  syncPCGames(true);
}

function preloadAssets() {
  const allItems = [...PS5_GAMES, ...PS5_MEDIA_APPS];
  allItems.forEach(item => {
    if (item.heroBg) {
      const img = new Image();
      img.src = item.heroBg;
    }
    if (item.tileIcon) {
      const icon = new Image();
      icon.src = item.tileIcon;
    }
    if (item.logoImg) {
      const logo = new Image();
      logo.src = item.logoImg;
    }
  });
}

function loadTabItems() {
  const gamesList = typeof getPS5Games === 'function' ? getPS5Games() : PS5_GAMES;
  const source = currentTab === 'games' ? deduplicateGameList(gamesList) : PS5_MEDIA_APPS;

  const libraryTile = {
    id: '__ps5_library__',
    isLibrary: true,
    title: currentTab === 'games' ? 'Game Library' : 'App Library',
    studio: 'PlayStation Console & PC Storage • 1.2 TB Free',
    genre: 'Installed Games & Cloud Collection',
    tileIcon: '',
    heroBg: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
    badge: 'Library',
    installed: true,
    liveStatus: 'Manage Installed Storage & Sync PC Games'
  };

  if (currentTab === 'games') {
    const exploreTile = source.find(item => item.isExplore);
    const storeTile = source.find(item => item.isStore);
    const nonStore = source.filter(item => !item.isStore && !item.isLibrary && !item.isExplore);

    // Show installed games first (Ghost of Tsushima, Forza 6, Wallpaper Engine),
    // followed by all owned games from the user's Steam library
    const installedGames = nonStore.filter(item => item.installed === true);
    const ownedGames = nonStore.filter(item => item.installed !== true);

    homeItems = [
      ...(exploreTile ? [exploreTile] : []),
      ...(storeTile ? [storeTile] : []),
      ...installedGames,
      ...ownedGames,
      libraryTile
    ];
  } else {
    const installedMedia = source.filter(item => item.installed === true);
    homeItems = [...installedMedia, libraryTile];
  }

  if (activeIndex >= homeItems.length) {
    activeIndex = Math.max(0, homeItems.length - 1);
  }

  // Preload visible home item assets
  homeItems.forEach(item => {
    if (item.tileIcon) {
      const img = new Image();
      img.src = item.tileIcon;
    }
    if (item.logoImg) {
      const img = new Image();
      img.src = item.logoImg;
    }
  });

  renderCarouselTrack();
  updateActiveTile();
  updateHeroDisplay();
}

function renderCarouselTrack() {
  if (!carouselContainer) return;

  carouselContainer.innerHTML = '<div class="ps5-carousel-track" id="ps5-carousel-track"></div>';
  trackElement = document.getElementById('ps5-carousel-track');

  trackElement.innerHTML = homeItems.map((item, idx) => {
    // 0. Official PlayStation Explore Tile
    if (item.isExplore) {
      return `
        <div class="ps5-tile tile-explore ${idx === activeIndex ? 'active' : ''}" data-index="${idx}" tabindex="0">
          <div class="ps5-tile-inner explore-gradient">
            <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            <span class="ps5-tile-explore-badge">Explore</span>
          </div>
        </div>
      `;
    }

    // 1. PlayStation Store Tile
    if (item.isStore) {
      return `
        <div class="ps5-tile tile-store ${idx === activeIndex ? 'active' : ''}" data-index="${idx}" tabindex="0">
          <div class="ps5-tile-inner store-gradient">
            <svg viewBox="0 0 32 32" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 10h20l-2 18H8L6 10z"/>
              <path d="M11 10V7a5 5 0 0 1 10 0v3"/>
            </svg>
            <span class="ps5-tile-store-badge">PS Store</span>
          </div>
        </div>
      `;
    }

    // 2. Game Library Tile
    if (item.isLibrary) {
      return `
        <div class="ps5-tile tile-library ${idx === activeIndex ? 'active' : ''}" data-index="${idx}" tabindex="0">
          <div class="ps5-tile-inner">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            <span class="ps5-library-tile-label">${currentTab === 'games' ? 'Game Library' : 'App Library'}</span>
          </div>
        </div>
      `;
    }

    // Check if this is the first owned game right after the installed games group
    const isFirstOwned = currentTab === 'games' && 
      !item.installed && 
      !item.isStore && 
      !item.isLibrary && 
      idx > 0 && 
      homeItems[idx - 1]?.installed;

    const dividerHtml = isFirstOwned ? `
      <div class="ps5-track-divider" title="Owned Games"></div>
    ` : '';

    // 3. Regular Installed / Owned Game Tile (Clean, minimalist - marks removed)
    return `
      ${dividerHtml}
      <div class="ps5-tile ${idx === activeIndex ? 'active' : ''}" data-index="${idx}" tabindex="0">
        <div class="ps5-tile-inner">
          ${item.tileIcon ? `
            <img class="ps5-tile-img" src="${item.tileIcon}" alt="${item.title}" loading="eager" decoding="async" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
          ` : ''}
          <div class="ps5-tile-fallback" style="${item.tileIcon ? 'display: none;' : 'display: flex;'}">
            <span class="fallback-title">${item.title}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  tileElements = Array.from(trackElement.querySelectorAll('.ps5-tile'));

  trackElement.onclick = (e) => {
    const tile = e.target.closest('.ps5-tile');
    if (!tile) return;
    const idx = parseInt(tile.getAttribute('data-index'), 10);
    if (idx === activeIndex) {
      handleItemSelect(homeItems[idx]);
    } else {
      selectIndex(idx);
    }
  };
}

export function getCurrentItem() {
  return homeItems[activeIndex] || homeItems[0];
}

export function handleItemSelect(item) {
  if (!item) return;

  if (item.isExplore) {
    openOverlay('ps5-explore-modal');
  } else if (item.isStore) {
    openOverlay('ps5-store-modal');
  } else if (item.isLibrary) {
    openLibraryModal();
  } else if (!item.installed && item.appId) {
    // Uninstalled Steam game: Trigger Download
    try {
      window.location.href = `steam://install/${item.appId}`;
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: `📥 Download Started: ${item.title}`,
        subtitle: "Steam download & installation initiated."
      }
    }));
  } else if (item.execPath || item.launchUri) {
    // Launch actual PC game executable or Steam protocol on laptop!
    launchPCApp(item);
  } else {
    window.dispatchEvent(new CustomEvent('ps5-request-launch'));
  }
}

/* --------------------------------------------------------------------------
   Carousel Navigation (Left / Right / Down to Game Hub)
   -------------------------------------------------------------------------- */
export function navigateCarousel(direction) {
  if (libraryModalOpen) return;

  if (isGameHubActive) {
    navigateActivities(direction);
    return;
  }

  if (direction === 'left' && activeIndex > 0) {
    const oldIdx = activeIndex;
    activeIndex--;
    onSelectionChange(oldIdx, activeIndex);
  } else if (direction === 'right' && activeIndex < homeItems.length - 1) {
    const oldIdx = activeIndex;
    activeIndex++;
    onSelectionChange(oldIdx, activeIndex);
  }
}

export function selectIndex(index) {
  if (index >= 0 && index < homeItems.length && index !== activeIndex) {
    const oldIdx = activeIndex;
    activeIndex = index;
    onSelectionChange(oldIdx, activeIndex);
  }
}

function onSelectionChange(oldIdx, newIdx) {
  ps5Audio.playNavTick();
  updateActiveTile(oldIdx, newIdx);
  updateHeroDisplay();
}

function updateActiveTile(oldIdx, newIdx) {
  if (oldIdx !== undefined && tileElements[oldIdx]) {
    tileElements[oldIdx].classList.remove('active');
  }
  if (newIdx !== undefined && tileElements[newIdx]) {
    tileElements[newIdx].classList.add('active');
  } else if (tileElements[activeIndex]) {
    tileElements[activeIndex].classList.add('active');
  }

  if (trackElement) {
    const activeTile = tileElements[activeIndex];
    if (activeTile) {
      const offset = Math.max(0, activeTile.offsetLeft - 20);
      trackElement.style.transform = `translate3d(-${offset}px, 0, 0)`;
    }
  }
}

/* --------------------------------------------------------------------------
   Vertical Navigation: Game Hub (Activities & News)
   -------------------------------------------------------------------------- */
export function enterGameHub() {
  const item = getCurrentItem();
  if (item?.isLibrary || item?.isAddApp || isGameHubActive) return;

  isGameHubActive = true;
  activeActivityIndex = 0;
  ps5Audio.playNavTick();
  document.body.classList.add('game-hub-active');
  highlightActivityCard();
}

export function exitGameHub() {
  if (!isGameHubActive) return;

  isGameHubActive = false;
  ps5Audio.playBackCancel();
  document.body.classList.remove('game-hub-active');
  clearActivityHighlights();
}

export function isHubActive() {
  return isGameHubActive;
}

function navigateActivities(dir) {
  const cards = document.querySelectorAll('.ps5-activity-card');
  if (!cards.length) return;

  if (dir === 'left' && activeActivityIndex > 0) {
    activeActivityIndex--;
    ps5Audio.playNavTick();
    highlightActivityCard();
  } else if (dir === 'right' && activeActivityIndex < cards.length - 1) {
    activeActivityIndex++;
    ps5Audio.playNavTick();
    highlightActivityCard();
  }
}

function highlightActivityCard() {
  const cards = document.querySelectorAll('.ps5-activity-card');
  cards.forEach((card, idx) => {
    if (idx === activeActivityIndex) {
      card.classList.add('card-focused');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      card.classList.remove('card-focused');
    }
  });
}

function clearActivityHighlights() {
  document.querySelectorAll('.ps5-activity-card').forEach(c => c.classList.remove('card-focused'));
}

export function triggerActiveActivity() {
  if (!isGameHubActive) return false;
  const cards = document.querySelectorAll('.ps5-activity-card');
  const card = cards[activeActivityIndex];
  if (card) {
    card.click();
    return true;
  }
  return false;
}

function updatePlayButtonIcon(type) {
  const icon = playBtnIcon || document.getElementById('ps5-play-btn-icon') || playBtn?.querySelector('svg');
  if (!icon) return;

  if (type === 'explore') {
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2.2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.innerHTML = `
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    `;
  } else if (type === 'download') {
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2.5');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.innerHTML = `
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    `;
  } else if (type === 'store') {
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2.2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.innerHTML = `
      <path d="M6 9l1.5 11h9L18 9H6z"/>
      <path d="M9 9V6a3 3 0 0 1 6 0v3"/>
    `;
  } else if (type === 'library') {
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2.2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.innerHTML = `
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    `;
  } else {
    // Default / Play Game
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'currentColor');
    icon.removeAttribute('stroke');
    icon.removeAttribute('stroke-width');
    icon.removeAttribute('stroke-linecap');
    icon.removeAttribute('stroke-linejoin');
    icon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
  }
}

/* --------------------------------------------------------------------------
   Hero Details & Activity Cards Display
   -------------------------------------------------------------------------- */
function updateHeroDisplay() {
  const item = getCurrentItem();
  if (!item) return;

  // 0. Trigger dynamic game theme ambience motif
  try {
    ps5Audio.playGameAmbience(item.id);
  } catch (e) {}

  // 1. Wallpaper cross-fade with preloaded images & Ken Burns camera drift
  if (bgLayerA && bgLayerB && item.heroBg) {
    let activeBg;
    if (bgLayerA.classList.contains('fade-out')) {
      bgLayerA.style.backgroundImage = `url('${item.heroBg}')`;
      bgLayerA.classList.remove('fade-out');
      bgLayerB.classList.add('fade-out');
      activeBg = bgLayerA;
    } else {
      bgLayerB.style.backgroundImage = `url('${item.heroBg}')`;
      bgLayerB.classList.remove('fade-out');
      bgLayerA.classList.add('fade-out');
      activeBg = bgLayerB;
    }
    // Dynamically restart 12-second cinematic Ken Burns camera drift
    activeBg.classList.remove('ken-burns');
    void activeBg.offsetWidth; // Force CSS reflow
    activeBg.classList.add('ken-burns');
  }

  // Natural Atmospheric Lighting — preserve authentic 4K game art colors
  const root = document.documentElement;
  if (item.id === 'black-myth-wukong' || item.id?.includes('wukong')) {
    root.style.setProperty('--ps-particle-tint', 'rgba(245, 158, 11, 0.35)');
    root.style.setProperty('--ps-theme-tint', 'rgba(245, 158, 11, 0.08)');
  } else if (item.id === 'gow-ragnarok' || item.id?.includes('gow')) {
    root.style.setProperty('--ps-particle-tint', 'rgba(241, 245, 249, 0.3)');
    root.style.setProperty('--ps-theme-tint', 'rgba(241, 245, 249, 0.05)');
  } else if (item.id === 'spiderman-2' || item.id?.includes('spider')) {
    root.style.setProperty('--ps-particle-tint', 'rgba(239, 68, 68, 0.3)');
    root.style.setProperty('--ps-theme-tint', 'rgba(239, 68, 68, 0.08)');
  } else if (item.id === 'elden-ring' || item.id?.includes('elden')) {
    root.style.setProperty('--ps-particle-tint', 'rgba(250, 204, 21, 0.3)');
    root.style.setProperty('--ps-theme-tint', 'rgba(250, 204, 21, 0.06)');
  } else {
    // Pure natural ambient lighting — zero artificial blue haze over the game art
    root.style.setProperty('--ps-particle-tint', 'rgba(255, 255, 255, 0.22)');
    root.style.setProperty('--ps-theme-tint', 'transparent');
  }

  // 2. Title & Studio / Official Logo
  if (heroStudio) heroStudio.textContent = item.studio || '';

  if (heroLogo && heroTitle) {
    heroTitle.textContent = item.title;

    if (item.logoImg) {
      const currentItemId = item.id;
      const testImg = new Image();
      testImg.src = item.logoImg;

      testImg.onload = () => {
        if (getCurrentItem()?.id === currentItemId) {
          heroLogo.src = item.logoImg;
          heroLogo.alt = item.title;
          heroLogo.style.display = 'block';
          heroTitle.style.display = 'none';
        }
      };

      testImg.onerror = () => {
        if (item.logoImg && item.logoImg.endsWith('.svg')) {
          const fallback = item.logoImg.replace('.svg', '.png');
          const fallbackImg = new Image();
          fallbackImg.src = fallback;
          fallbackImg.onload = () => {
            if (getCurrentItem()?.id === currentItemId) {
              heroLogo.src = fallback;
              heroLogo.alt = item.title;
              heroLogo.style.display = 'block';
              heroTitle.style.display = 'none';
            }
          };
          fallbackImg.onerror = () => {
            if (getCurrentItem()?.id === currentItemId) {
              heroLogo.style.display = 'none';
              heroTitle.style.display = 'block';
            }
          };
          return;
        }
        if (getCurrentItem()?.id === currentItemId) {
          heroLogo.style.display = 'none';
          heroTitle.style.display = 'block';
        }
      };

      if (testImg.complete && testImg.naturalWidth > 0) {
        heroLogo.src = item.logoImg;
        heroLogo.alt = item.title;
        heroLogo.style.display = 'block';
        heroTitle.style.display = 'none';
      } else {
        heroLogo.style.display = 'none';
        heroTitle.style.display = 'block';
      }
    } else {
      heroLogo.style.display = 'none';
      heroTitle.style.display = 'block';
    }
  } else if (heroTitle) {
    heroTitle.textContent = item.title;
  }

  // 3. Play / Action Button Label & Dynamic Icon
  if (playBtnLabel) {
    if (item.isExplore) {
      playBtnLabel.textContent = "Explore What's New";
      if (playBtn) playBtn.title = "Explore PlayStation 5 News & Highlights (Press Enter / ✕)";
      updatePlayButtonIcon('explore');
    } else if (item.isStore) {
      playBtnLabel.textContent = "Explore PlayStation Store";
      if (playBtn) playBtn.title = "Explore PlayStation Store (Press Enter / ✕)";
      updatePlayButtonIcon('store');
    } else if (item.isLibrary) {
      playBtnLabel.textContent = "Open Game Library";
      if (playBtn) playBtn.title = "Open Game Library (Press Enter / ✕)";
      updatePlayButtonIcon('library');
    } else if (currentTab === 'media' || item.genre?.includes('Streaming') || item.genre?.includes('Music') || item.id === 'youtube' || item.id === 'youtube-music' || item.id === 'spotify') {
      playBtnLabel.textContent = `Start ${item.title}`;
      if (playBtn) playBtn.title = `Start ${item.title} (Press Enter / ✕)`;
      updatePlayButtonIcon('play');
    } else if (item.installed) {
      playBtnLabel.textContent = "Play Game";
      if (playBtn) playBtn.title = "Launch Game (Press Enter / ✕)";
      updatePlayButtonIcon('play');
    } else {
      playBtnLabel.textContent = "Download";
      if (playBtn) playBtn.title = "Download Game via Steam (Press Enter / ✕)";
      updatePlayButtonIcon('download');
    }
  }

  // 4. Hero Metadata
  if (heroMeta) {
    if (item.isExplore) {
      heroMeta.innerHTML = `
        <div class="ps5-meta-item">
          <span style="color: #818cf8; font-weight: 700;">★ Official News & Community Hub</span>
        </div>
        <div class="ps5-meta-item">
          <span>System Software 10.00 Live</span>
        </div>
        <div class="ps5-meta-item" style="color: var(--ps-white-60);">
          <span>PS Plus Monthly Games Ready</span>
        </div>
      `;
    } else if (item.isStore) {
      heroMeta.innerHTML = `
        <div class="ps5-meta-item">
          <span style="color: var(--ps-blue-light); font-weight: 700;">★ Official PS Store</span>
        </div>
        <div class="ps5-meta-item">
          <span>Wallet: $120.00</span>
        </div>
        <div class="ps5-meta-item" style="color: var(--ps-white-60);">
          <span>Spring Sale Now Live • Up to 70% Off</span>
        </div>
      `;
    } else if (item.isLibrary) {
      heroMeta.innerHTML = `
        <div class="ps5-meta-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <rect x="2" y="2" width="20" height="8" rx="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2"/>
          </svg>
          <span>Storage: 1.2 TB Available</span>
        </div>
        <div class="ps5-meta-item">
          <span>Installed: ${homeItems.length - 2} Games</span>
        </div>
      `;
    } else {
      heroMeta.innerHTML = `
        <div class="ps5-meta-item">
          <span style="color: ${item.installed ? '#10b981' : '#60a5fa'}; font-weight: 700;">● ${item.installed ? 'Installed' : 'Owned'}</span>
          <span>• ${item.installSize || (item.installed ? 'Game' : 'Ready to Download')}</span>
        </div>
        ${item.playTime ? `
          <div class="ps5-meta-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>${item.playTime}</span>
          </div>
        ` : ''}
        ${item.trophies ? `
          <div class="ps5-meta-item" style="color: var(--ps-platinum);">
            <span>★ ${item.trophies.progress}% Trophies</span>
          </div>
        ` : ''}
        ${item.friends ? `
          <div class="ps5-meta-item" style="color: var(--ps-white-60);">
            <span>${item.friends}</span>
          </div>
        ` : ''}
      `;
    }
  }

  // 5. Activity Cards
  if (heroActivities) {
    if (item.isExplore) {
      heroActivities.innerHTML = `
        <div class="ps5-activity-card" onclick="window.ps5OpenExploreHub()" style="cursor: pointer;">
          <div class="activity-top">
            <span class="activity-tag" style="color: #fbbf24;">PS Plus Essential</span>
            <span class="activity-time">Monthly Drop</span>
          </div>
          <span class="activity-help-tag">💡 Activities Ready</span>
          <h3 class="activity-title">Claim PlayStation Plus Monthly Games</h3>
          <div class="activity-bar-wrap">
            <div class="activity-bar-fill" style="width: 100%; background: #fbbf24;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span class="activity-progress">3 Games Included</span>
            <span class="activity-resume-badge" style="color: #fbbf24; border-color: rgba(251, 191, 36, 0.4);">Claim ✕</span>
          </div>
        </div>
        <div class="ps5-activity-card" onclick="window.ps5OpenExploreHub()" style="cursor: pointer;">
          <div class="activity-top">
            <span class="activity-tag" style="color: #60a5fa;">Firmware 10.00</span>
            <span class="activity-time">System Software</span>
          </div>
          <span class="activity-help-tag">💡 Official Notes</span>
          <h3 class="activity-title">PS5 System Update 10.00 Released</h3>
          <div class="activity-bar-wrap">
            <div class="activity-bar-fill" style="width: 100%; background: #60a5fa;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span class="activity-progress">Up to date</span>
            <span class="activity-resume-badge" style="color: #60a5fa; border-color: rgba(96, 165, 250, 0.4);">Notes ✕</span>
          </div>
        </div>
        <div class="ps5-activity-card" onclick="window.ps5OpenExploreHub()" style="cursor: pointer;">
          <div class="activity-top">
            <span class="activity-tag" style="color: #a855f7;">Tournaments</span>
            <span class="activity-time">Compete</span>
          </div>
          <span class="activity-help-tag">💡 Community Bracket</span>
          <h3 class="activity-title">PlayStation Tournaments • Win Avatars</h3>
          <div class="activity-bar-wrap">
            <div class="activity-bar-fill" style="width: 100%; background: #a855f7;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span class="activity-progress">Live Global Standings</span>
            <span class="activity-resume-badge" style="color: #a855f7; border-color: rgba(168, 85, 247, 0.4);">Join ✕</span>
          </div>
        </div>
      `;
    } else if (item.isStore) {
      heroActivities.innerHTML = `
        <div class="ps5-activity-card" onclick="window.ps5OpenStore()" style="cursor: pointer;">
          <div class="activity-top">
            <span class="activity-tag">Featured Deal</span>
            <span class="activity-time">-70% Off</span>
          </div>
          <h3 class="activity-title">Essential Picks Collection</h3>
          <p class="activity-progress">Top rated PS5 hits at special prices</p>
        </div>
        <div class="ps5-activity-card" onclick="window.ps5OpenStore()" style="cursor: pointer;">
          <div class="activity-top">
            <span class="activity-tag">PS5 Pro Enhanced</span>
            <span class="activity-time">4K 120FPS</span>
          </div>
          <h3 class="activity-title">PlayStation 5 Pro Showcase</h3>
          <p class="activity-progress">Advanced ray-tracing & PSSR scaling</p>
        </div>
      `;
    } else if (item.isLibrary) {
      heroActivities.innerHTML = `
        <div class="ps5-activity-card" onclick="window.ps5OpenLibrary()" style="cursor: pointer;">
          <div class="activity-top">
            <span class="activity-tag">Console Storage</span>
            <span class="activity-time">Ultra-Fast NVMe</span>
          </div>
          <h3 class="activity-title">View All Installed Games</h3>
          <p class="activity-progress">Browse and launch your installed games</p>
        </div>
        <div class="ps5-activity-card" onclick="window.ps5SyncPCGames()" style="cursor: pointer;">
          <div class="activity-top">
            <span class="activity-tag" style="color: #60a5fa;">Laptop Storage</span>
            <span class="activity-time">Auto-Detect</span>
          </div>
          <h3 class="activity-title">Sync PC Games</h3>
          <p class="activity-progress">Scan laptop apps and add installed games to your library</p>
        </div>
      `;
    } else if (item.activities) {
      heroActivities.innerHTML = item.activities.map((act, i) => {
        const helpBadge = (i === 0 && item.installed) ? `<span class="activity-help-tag">💡 PS5 In-Game Help Available</span>` : '';
        const progressLabel = act.progress ? `${act.progress}% • Main Story Progress` : 'Activities Ready';
        return `
          <div class="ps5-activity-card" onclick="window.dispatchEvent(new CustomEvent('ps5-request-launch'))" style="cursor: pointer;">
            <div class="activity-top">
              <span class="activity-tag">${act.tag}</span>
              <span class="activity-time">${act.timeEst || 'Ready'}</span>
            </div>
            ${helpBadge}
            <h3 class="activity-title">${act.title}</h3>
            <div class="activity-bar-wrap">
              <div class="activity-bar-fill" style="width: ${act.progress || 100}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <span class="activity-progress">${progressLabel}</span>
              <span class="activity-resume-badge">Resume ✕</span>
            </div>
          </div>
        `;
      }).join('');
    } else {
      heroActivities.innerHTML = '';
    }
  }
}

export function getCurrentTab() {
  return currentTab;
}

export function switchTab(tab) {
  if (currentTab === tab) return;
  ps5Audio.playSelectChime();
  currentTab = tab;
  activeIndex = 0;
  exitGameHub();

  document.querySelectorAll('.ps5-tab').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');

  loadTabItems();
}

/* ==========================================================================
   PS5 Game Library Modal (Installed & Cloud Collection with PC Game Sync)
   ========================================================================== */
let isSyncing = false;
export async function syncPCGames(silent = false) {
  if (isSyncing) return;
  isSyncing = true;
  const syncBtn = document.getElementById('btn-sync-pc-games');
  if (syncBtn && !silent) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<span>Syncing PC Games...</span>`;
  }

  try {
    const scanned = await scanLaptopForGames();
    const added = syncPCInstalledGames(scanned);

    if (syncBtn && !silent) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        <span>Sync PC Games</span>
      `;
    }

    if (!silent || added > 0) {
      if (!silent) ps5Audio.playBootChord();
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: "🎮 Steam Games Synced",
          subtitle: `All ${scanned.length || 35} Steam games are synchronized with your Games category.`
        }
      }));
    }

    if (libraryModalOpen) {
      renderLibraryContent();
    }
    loadTabItems();
    return scanned;
  } finally {
    isSyncing = false;
  }
}

function initLibraryModal() {
  window.ps5OpenLibrary = openLibraryModal;
  window.ps5CloseLibrary = closeLibraryModal;
  window.ps5OpenStore = () => openOverlay('ps5-store-modal');
  window.ps5SyncPCGames = () => syncPCGames(false);

  const modal = document.getElementById('ps5-library-modal');
  if (!modal) return;

  document.getElementById('library-btn-close')?.addEventListener('click', closeLibraryModal);
  document.getElementById('btn-sync-pc-games')?.addEventListener('click', () => syncPCGames(false));
  document.getElementById('lib-tab-all')?.addEventListener('click', () => switchLibraryTab('all'));
  document.getElementById('lib-tab-installed')?.addEventListener('click', () => switchLibraryTab('installed'));
  document.getElementById('lib-tab-collection')?.addEventListener('click', () => switchLibraryTab('collection'));
}

export function openLibraryModal(tab = 'all') {
  const modal = document.getElementById('ps5-library-modal');
  if (!modal) return;

  libraryModalOpen = true;
  ps5Audio.playSelectChime();
  modal.classList.add('active');
  switchLibraryTab(tab);
}

export function closeLibraryModal() {
  const modal = document.getElementById('ps5-library-modal');
  if (!modal) return;

  libraryModalOpen = false;
  ps5Audio.playBackCancel();
  modal.classList.remove('active');
}

export function isLibraryOpen() {
  return libraryModalOpen;
}

function switchLibraryTab(tab) {
  libraryActiveTab = tab;
  document.querySelectorAll('.lib-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`lib-tab-${tab}`)?.classList.add('active');
  renderLibraryContent();
}

function renderLibraryContent() {
  const grid = document.getElementById('library-games-grid');
  if (!grid) return;

  const isGames = currentTab === 'games';
  const rawList = (isGames ? PS5_GAMES : PS5_MEDIA_APPS).filter(item => !item.isStore);
  const allList = isGames ? deduplicateGameList(rawList) : rawList;
  let filtered = allList;
  if (libraryActiveTab === 'installed') {
    filtered = allList.filter(item => item.installed === true);
  } else if (libraryActiveTab === 'collection') {
    filtered = allList.filter(item => item.installed === false);
  } else {
    filtered = allList;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--ps-white-60);">
        <h3>No games in this section</h3>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="lib-card ${item.installed ? 'installed' : 'uninstalled'}">
      <div class="lib-card-thumb">
        ${item.tileIcon ? `
          <img class="lib-card-img" src="${item.tileIcon}" alt="${item.title}" loading="lazy" decoding="async" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
        ` : ''}
        <div class="lib-card-fallback" style="${item.tileIcon ? 'display: none;' : 'display: flex;'}">
          <span>${item.title}</span>
        </div>
        <span class="lib-badge ${item.installed ? 'badge-green' : 'badge-owned'}">
          ${item.installed ? 'Installed' : 'Owned'}
        </span>
      </div>
      <div class="lib-card-info">
        <h4 class="lib-card-title">${item.title}</h4>
        <div class="lib-card-meta">${item.installSize || (item.installed ? 'PC Install' : 'Steam Library')} • ${item.storageType || 'Laptop Storage'}</div>
        <div class="lib-card-actions">
          ${item.installed ? `
            <button class="lib-btn-action lib-btn-play" onclick="window.ps5LaunchFromLib('${item.id}')">
              Play
            </button>
            <button class="lib-btn-action lib-btn-uninstall" onclick="window.ps5UninstallGame('${item.id}')" title="Uninstall to free storage">
              Uninstall
            </button>
          ` : `
            <button class="lib-btn-action lib-btn-download" id="btn-dl-${item.id}" onclick="window.ps5DownloadGame('${item.id}')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Download</span>
            </button>
          `}
        </div>
      </div>
    </div>
  `).join('');
}

window.ps5LaunchFromLib = (id) => {
  const item = PS5_GAMES.find(g => g.id === id) || PS5_MEDIA_APPS.find(m => m.id === id);
  if (item) {
    closeLibraryModal();
    if (PS5_MEDIA_APPS.some(m => m.id === id) || item.genre?.includes('Streaming') || item.genre?.includes('Music')) {
      openMediaApp(item);
    } else if (item.execPath || item.launchUri) {
      launchPCApp(item);
    } else {
      window.dispatchEvent(new CustomEvent('ps5-launch-game', { detail: item }));
    }
  }
};

window.ps5UninstallGame = (id) => {
  if (currentTab === 'games') {
    setGameInstalled(id, false);
  } else {
    setMediaInstalled(id, false);
  }

  ps5Audio.playBackCancel();
  window.dispatchEvent(new CustomEvent('ps5-show-notification', {
    detail: {
      title: "🗑️ Game Uninstalled",
      subtitle: "Freed console storage. Marked as Owned in Game Library."
    }
  }));

  renderLibraryContent();
  loadTabItems();
};

window.ps5DownloadGame = (id) => {
  const btn = document.getElementById(`btn-dl-${id}`);
  const item = PS5_GAMES.find(g => g.id === id) || PS5_MEDIA_APPS.find(m => m.id === id);

  if (item?.appId) {
    // Directly trigger Steam native installer
    try {
      window.location.href = `steam://install/${item.appId}`;
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: `🚀 Steam Install: ${item.title}`,
        subtitle: "Steam installation dialog launched on Windows."
      }
    }));
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Starting Steam...</span>`;
    ps5Audio.playSelectChime();

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = `<span>Install</span>`;
    }, 1200);
  }
};
