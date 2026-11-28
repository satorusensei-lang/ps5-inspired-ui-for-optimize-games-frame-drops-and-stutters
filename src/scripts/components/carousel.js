/* ==========================================================================
   PlayStation 5 High-Performance 120FPS Carousel & Game Hub Engine
   - 3 Modes: PS5 Games, Media Apps, and My PC (Real Laptop Apps & Games)
   - Real Windows .exe & Steam Protocol Execution
   - Laptop Game Scanner & Custom App Configurator
   - Vertical Navigation: Carousel <-> Game Hub (Activities & Help)
   ========================================================================== */

import { PS5_GAMES, setGameInstalled, syncPCInstalledGames, deduplicateGameList, getPS5Games, getCanonicalTitleKey, OFFICIAL_STEAM_STORE_SIZES, isNonGameSteamApp, STEAM_FAVORITE_APPIDS, isSteamFavoritesAuthoritative, updateSteamFavoriteAppIds, getGameHubMetadata } from '../data/ps5-games-data.js';
import { PS5_MEDIA_APPS, setMediaInstalled } from '../data/ps5-media-data.js';
import { launchPCApp, scanLaptopForGames } from './pc-launcher.js';
import { ps5Audio } from '../audio/ps5-audio.js';
import { openOverlay, closeActiveOverlay } from './overlays.js';
import { openMediaApp } from './media-launcher.js';
import { performMultiStoreSync } from '../services/store-sync-service.js';
import { getSteamDownload, resumeSteamDownload, pauseSteamDownload, formatBytes, normalizePercent } from '../services/steam-download-service.js';
import { PS5GameCard } from './ps5-game-card.js';

// Live Steam Favorites collection (kept synchronized with Steam client / ps5-games-data)
export const STEAM_FAVORITE_5_APPIDS = STEAM_FAVORITE_APPIDS;
const ownedSteamFavorites = STEAM_FAVORITE_APPIDS;

// Load last cached Steam Favorites snapshot only before live IPC sync completes
if (typeof window !== 'undefined') {
  fetch('/assets/cache/steam_favorites.json')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (typeof window !== 'undefined' && window.electronAPI) return;
      if (Array.isArray(data) && !isSteamFavoritesAuthoritative()) {
        updateSteamFavoriteAppIds(data, false);
        try { loadTabItems(); } catch (e) {}
      }
    })
    .catch(() => {});
}

import { PS5LogoEngine, normalizeGameLogo } from './ps5-logo-engine.js';

function getValidPercent(val) {
  return normalizePercent(val);
}

function getDownloadPercent(dlState) {
  if (!dlState) return null;
  return getValidPercent(dlState.downloadPercent);
}

function getInstallPercent(dlState) {
  if (!dlState) return null;
  return getValidPercent(dlState.installPercent);
}

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
let heroSubtitle = null;
let heroSubtitleName = null;
let heroDlIndicator = null;
let heroTitleBadgeRow = null;
let heroMeta = null;
let heroActivities = null;
let heroTrophiesRow = null;
let heroFriendsRow = null;
let heroPromoCard = null;
let heroPromoImg = null;
let heroPromoTitle = null;
let heroPromoDiscount = null;
let heroPromoPrice = null;
let heroPromoOrigPrice = null;
let playBtn = null;
let playBtnLabel = null;
let playBtnIcon = null;
let bgLayerA = null;
let bgLayerB = null;
let currentActiveBgLayer = null;

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function initCarousel() {
  carouselContainer = document.getElementById('ps5-tiles-carousel');
  heroLogo = document.getElementById('ps5-hero-logo');
  heroTitle = document.getElementById('ps5-hero-title');
  heroStudio = document.getElementById('ps5-hero-studio');
  heroSubtitle = document.getElementById('ps5-hero-subtitle');
  heroSubtitleName = document.getElementById('ps5-hero-subtitle-name');
  heroDlIndicator = document.getElementById('ps5-hero-dl-icon-indicator');
  heroTitleBadgeRow = document.getElementById('ps5-hero-title-badge-row');
  heroMeta = document.getElementById('ps5-hero-meta');
  heroActivities = document.getElementById('ps5-activities-row');
  heroTrophiesRow = document.getElementById('ps5-trophies-row');
  heroFriendsRow = document.getElementById('ps5-friends-avatars-row');
  heroPromoCard = document.getElementById('ps5-widget-promo-card');
  heroPromoImg = document.getElementById('ps5-promo-img');
  heroPromoTitle = document.getElementById('ps5-promo-title');
  heroPromoDiscount = document.getElementById('ps5-promo-discount');
  heroPromoPrice = document.getElementById('ps5-promo-price');
  heroPromoOrigPrice = document.getElementById('ps5-promo-orig-price');
  playBtn = document.getElementById('ps5-play-btn');
  playBtnLabel = playBtn?.querySelector('span');
  playBtnIcon = document.getElementById('ps5-play-btn-icon') || playBtn?.querySelector('svg');
  bgLayerA = document.getElementById('ps5-bg-layer-a');
  bgLayerB = document.getElementById('ps5-bg-layer-b');
  currentActiveBgLayer = bgLayerA;

  // Make Play Game button reliably launch current selection
  if (playBtn && !playBtn.dataset.wiredLaunch) {
    playBtn.dataset.wiredLaunch = 'true';
    playBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('ps5-request-launch'));
    });
  }

  // Wire Promo Card click to open store or external store link
  if (heroPromoCard && !heroPromoCard.dataset.wired) {
    heroPromoCard.dataset.wired = 'true';
    heroPromoCard.addEventListener('click', () => {
      const item = getCurrentItem();
      if (item) {
        if (item.isStore) {
          window.ps5OpenStore?.();
        } else if (item.appId) {
          try {
            if (window.electronAPI?.openExternal) {
              window.electronAPI.openExternal(`https://store.steampowered.com/app/${item.appId}`);
            } else {
              window.open(`https://store.steampowered.com/app/${item.appId}`, '_blank');
            }
          } catch (e) {
            window.open(`https://store.steampowered.com/app/${item.appId}`, '_blank');
          }
        } else {
          window.ps5OpenStore?.();
        }
      }
    });
  }

  // Wire tab buttons (Games & Media)
  document.getElementById('tab-games')?.addEventListener('click', () => switchTab('games'));
  document.getElementById('tab-media')?.addEventListener('click', () => switchTab('media'));

  // Ensure game logo smoothly adapts to window resize without touching carousel cards
  refreshCarouselLayoutMetrics();
  window.addEventListener('resize', () => {
    refreshCarouselLayoutMetrics();
    if (heroLogo && heroLogo.style.display !== 'none' && heroLogo.naturalWidth > 0) {
      applyLogoOpticalDimensions(heroLogo, heroLogo);
    }
    updateActiveTile();
  });

  // Preload all assets in parallel into GPU memory
  preloadAssets();

  // Initialize Library Modal
  initLibraryModal();

  // Never purge user cached games or custom artwork on startup
  try {
    localStorage.setItem('ps5_games_cache_ver', 'v16_dedup_order_fix');
  } catch (e) {}

  // Canonicalize legacy order aliases so saved order cannot reinsert duplicate cards.
  try {
    const order = JSON.parse(localStorage.getItem('ps5_game_order') || '[]');
    if (Array.isArray(order)) {
      const seen = new Set();
      const canonicalOrder = order.map(id => {
        const value = String(id || '').trim();
        const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (value === 'pc_steam_3564740' || value === '3564740' || normalized.includes('wherewindsmeet') || (normalized.includes('winds') && normalized.includes('meet'))) return 'pc_steam_3564740';
        if (value === 'pc_steam_3717070' || value === '3717070') return 'pc_steam_3717070';
        return value;
      }).filter(id => !seen.has(id) && seen.add(id));
      localStorage.setItem('ps5_game_order', JSON.stringify(canonicalOrder));
    }
  } catch (e) {}
  // Clean up legacy cached tiles, deduplicate, and repair any corrupted entries in localStorage
  try {
    const raw = localStorage.getItem('ps5_synced_pc_games');
    if (raw) {
      const list = JSON.parse(raw);
      const cleaned = list.filter(g => 
        g && 
        g.id !== 'pc_forza_horizon' && 
        g.title !== 'Forza Horizon' && 
        g.appId !== '1755070' &&
        g.id !== 'pc_steam_1755070' &&
        g.appId !== '2215200' &&
        g.id !== 'pc_steam_2215200' &&
        !g.title?.toLowerCase().includes('demo') &&
        !g.tileIcon?.includes('photo-1550745165-9bc0b252726f') &&
        !isNonGameSteamApp(g.title, g.appId) &&
        !(g.store === 'xbox' && !g.installed && (
          g.xboxOwnedVerified !== true ||
          /\b(add-on|addon|dlc|expansion pack|soundtrack|content pack|trial|minecraft launcher)\b/i.test(String(g.title || ''))
        ))
      );
      // Normalise IDs so dedup can match correctly regardless of which format was saved
      cleaned.forEach(g => {
        if (!g.appId && g.id && g.id.startsWith('pc_steam_')) {
          g.appId = g.id.replace('pc_steam_', '');
        }
        // Always give Steam games their canonical pc_steam_<appId> id
        if (g.appId && /^\d+$/.test(String(g.appId)) && (!g.id || !g.id.startsWith('pc_steam_'))) {
          g.id = `pc_steam_${g.appId}`;
        }
      });
      cleaned.forEach(g => {
        const hasCustomArt = Boolean(
          g.hasCustomArtwork ||
          g.customArtwork ||
          (g.tileIcon && (g.tileIcon.includes('/assets/cache/') || g.tileIcon.startsWith('data:'))) ||
          (g.heroBg && (g.heroBg.includes('/assets/cache/') || g.heroBg.startsWith('data:')))
        );
        const originalTile = g.tileIcon;
        const originalHero = g.heroBg;
        const originalLogo = g.logoImg;
        const originalZoom = g.heroBgZoom;
        const originalPos = g.heroBgPos;
        const originalSize = g.heroBgSize;
        const originalOrigin = g.heroBgOrigin;

        if (g.appId === '389730' || g.id === 'pc_steam_389730' || (g.title && g.title.toLowerCase().includes('tekken 7'))) {
          g.title = 'TEKKEN 7';
          g.logoImg = '/assets/cache/games/pc_steam_389730/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_389730/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_389730/hero.jpg';
          g.installSize = '78.5 GB';
          if (!g.installed) {
            g.liveStatus = 'Owned on Steam • 78.5 GB Download';
          }
        }
        if (g.appId === '3564740' || g.id === 'pc_steam_3564740' || (g.title && g.title.toLowerCase().includes('where winds meet'))) {
          g.title = 'Where Winds Meet';
          g.logoImg = '/assets/cache/games/pc_steam_3564740/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_3564740/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_3564740/hero.jpg';
          g.installSize = '50.0 GB';
          if (!g.installed) {
            g.liveStatus = 'Owned on Steam • 50.0 GB Download';
          }
        }

        if (g.installSize === '0.0 GB' || g.installSize === '0 GB' || g.installSize === '0.0GB') {
          g.installed = false;
          g.badge = 'Owned';
          if (OFFICIAL_STEAM_STORE_SIZES && OFFICIAL_STEAM_STORE_SIZES[g.appId]) {
            g.installSize = OFFICIAL_STEAM_STORE_SIZES[g.appId];
            g.liveStatus = `Owned on Steam • ${g.installSize} Download`;
          }
        } else if (OFFICIAL_STEAM_STORE_SIZES && OFFICIAL_STEAM_STORE_SIZES[g.appId] && !g.installed) {
          g.installSize = OFFICIAL_STEAM_STORE_SIZES[g.appId];
          g.liveStatus = `Owned on Steam • ${g.installSize} Download`;
        }
        if (g.appId === '2215430' || g.id === 'pc_steam_2215430' || (g.title && g.title.toLowerCase().includes('ghost of tsushima'))) {
          g.title = "Ghost of Tsushima DIRECTOR'S CUT";
          g.tileIcon = '/assets/games/got/tile.webp';
          g.heroBg = '/assets/games/got/hero.webp';
          g.logoImg = '/assets/games/got/logo.png';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '1817190' || g.id === 'pc_steam_1817190' || (g.title && g.title.toLowerCase().includes('miles morales'))) {
          g.title = "Marvel’s Spider-Man: Miles Morales";
          g.tileIcon = '/assets/games/spidermanmilesmorales/tile.webp';
          g.heroBg = '/assets/games/spidermanmilesmorales/hero.webp';
          g.logoImg = '/assets/games/spidermanmilesmorales/logo.png';
        }
        if (g.appId === '1817070' || g.id === 'pc_steam_1817070' || (g.title && g.title.toLowerCase().includes('spider-man remastered'))) {
          g.title = "Marvel’s Spider-Man Remastered";
          g.tileIcon = '/assets/games/spidermanremastered/tile.webp';
          g.heroBg = '/assets/games/spidermanremastered/hero.webp';
          g.logoImg = '/assets/games/spidermanremastered/logo.png';
        }
        if (g.appId === '2651280' || g.id === 'pc_steam_2651280' || (g.title && g.title.toLowerCase().includes('spider-man 2'))) {
          g.title = "Marvel's Spider-Man 2";
          g.tileIcon = '/assets/games/spiderman2/tile.webp';
          g.heroBg = '/assets/games/spiderman2/hero.webp';
          g.logoImg = '/assets/games/spiderman2/logo.png';
        }
        if (g.appId === '1593500' || g.id === 'pc_steam_1593500' || (g.title && g.title.toLowerCase() === 'god of war')) {
          g.title = 'God of War';
          g.tileIcon = '/assets/games/gow/tile.webp';
          g.heroBg = '/assets/games/gow/hero.webp';
          g.logoImg = '/assets/games/gow/logo.png';
        }
        if (g.appId === '2322010' || g.id === 'pc_steam_2322010' || (g.title && (g.title.toLowerCase().includes('ragnarök') || g.title.toLowerCase().includes('ragnarok')))) {
          g.title = 'God of War Ragnarök';
          g.tileIcon = '/assets/games/gowragnarok/tile.webp';
          g.heroBg = '/assets/games/gowragnarok/hero.webp';
          g.logoImg = '/assets/games/gowragnarok/logo.png';
        }
        const cNorm = getCanonicalTitleKey(g.title);
        if (g.appId === '2531310' || g.id === 'pc_steam_2531310' || cNorm === 'thelastofuspart2') {
          g.title = 'The Last of Us™ Part II Remastered';
          g.id = 'pc_steam_2531310';
          g.appId = '2531310';
          if (!hasCustomArt || g.tileIcon?.includes('tlou1')) {
            g.tileIcon = '/assets/games/tlou2/tile.webp';
            g.heroBg = '/assets/games/tlou2/hero.webp';
            g.logoImg = '/assets/games/tlou2/logo.png';
          }
        } else if (g.appId === '1888930' || g.id === 'pc_steam_1888930' || g.id === 'the-last-of-us-part-1' || cNorm === 'thelastofuspart1') {
          g.title = 'The Last of Us™ Part I';
          g.id = 'pc_steam_1888930';
          g.appId = '1888930';
          if (!hasCustomArt || g.tileIcon?.includes('tlou2')) {
            g.tileIcon = '/assets/games/tlou1/tile.webp';
            g.heroBg = '/assets/games/tlou1/hero.webp';
            g.logoImg = '/assets/games/tlou1/logo.png';
          }
        }
        if (g.appId === '1790600' || g.id === 'pc_steam_1790600' || (g.title && g.title.toLowerCase().includes('sparking'))) {
          g.title = 'DRAGON BALL: Sparking! ZERO';
          g.tileIcon = '/assets/games/sparkingzero/tile.webp';
          g.heroBg = '/assets/games/sparkingzero/hero.webp';
          g.logoImg = '/assets/games/sparkingzero/logo.png';
        }
        if (g.appId === '851850' || g.id === 'pc_steam_851850' || (g.title && g.title.trim().toLowerCase() === 'dragon ball z: kakarot')) {
          g.title = 'DRAGON BALL Z: KAKAROT';
          g.tileIcon = '/assets/games/dbzkakarot/tile.webp';
          g.heroBg = '/assets/games/dbzkakarot/hero.webp';
          g.logoImg = '/assets/games/dbzkakarot/logo.png';
          g.installSize = '116.86 GB';
          g.liveStatus = 'Owned on Steam • 116.86 GB Download';
        }
        if (g.appId === '1650010' || g.id === 'pc_steam_1650010' || (g.title && g.title.toLowerCase().includes('ride 5'))) {
          g.title = 'RIDE 5';
          g.tileIcon = '/assets/games/ride5/tile.webp';
          g.heroBg = '/assets/games/ride5/hero.webp';
          g.logoImg = '/assets/games/ride5/logo.png';
        }
        if (g.appId === '1815780' || g.id === 'pc_steam_1815780' || (g.title && g.title.toLowerCase().includes('asphalt'))) {
          g.title = 'Asphalt Legends';
          g.tileIcon = '/assets/games/asphaltlegends/tile.webp';
          g.heroBg = '/assets/games/asphaltlegends/hero.webp';
          g.logoImg = '/assets/games/asphaltlegends/logo.png';
        }
        if (g.appId === '730' || g.id === 'pc_steam_730' || (g.title && g.title.toLowerCase().includes('counter-strike'))) {
          g.title = 'Counter-Strike 2';
          g.tileIcon = '/assets/games/cs2/tile.webp';
          g.heroBg = '/assets/games/cs2/hero.webp';
          g.logoImg = '/assets/games/cs2/logo.png';
        }
        if (g.appId === '2483190' || g.id === 'pc_steam_2483190') {
          g.title = 'Forza Horizon 6';
          g.installSize = g.installSize || '167 GB';
          g.logoImg = g.logoImg || '/assets/games/forza6/logo.png';
          g.tileIcon = g.tileIcon || '/assets/games/forza6/tile.jpg';
          g.heroBg = g.heroBg || '/assets/games/forza6/hero.jpg';
        }
        if (g.appId === '2358720' || g.id === 'pc_steam_2358720') {
          g.tileIcon = '/assets/games/wukong/ps5_tile.webp';
          g.heroBg = '/assets/games/wukong/ps5_hero.webp';
          g.logoImg = '/assets/games/wukong/logo.png';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '3764200' || g.id === 'pc_steam_3764200' || (g.title && g.title.toLowerCase().includes('requiem'))) {
          g.title = 'Resident Evil Requiem';
          g.tileIcon = '/assets/games/rerequiem/tile.jpg';
          g.heroBg = '/assets/games/rerequiem/hero.jpg';
          g.logoImg = '/assets/games/rerequiem/logo.png';
          g.installSize = '68 GB';
          g.liveStatus = 'Owned on Steam • 68 GB Download';
        }
        if (g.appId === '4080220' || g.id === 'pc_steam_4080220') {
          g.tileIcon = '/assets/games/eafc27/tile.png';
          g.heroBg = '/assets/games/eafc27/hero.jpg';
          g.logoImg = '/assets/games/eafc27/logo.png';
        }
        if (g.appId === '2050650' || g.id === 'pc_steam_2050650' || (g.title && g.title.toLowerCase() === 'resident evil 4')) {
          g.title = 'Resident Evil 4';
          g.tileIcon = '/assets/games/re4/tile.webp';
          g.heroBg = '/assets/games/re4/hero.webp';
          g.logoImg = '/assets/games/re4/logo.png';
        }
        if (g.appId === '3357650' || g.id === 'pc_steam_3357650') {
          g.tileIcon = '/assets/games/pragmata/tile.png';
          g.heroBg = '/assets/games/pragmata/hero.jpg';
          g.logoImg = '/assets/games/pragmata/logo.png';
        }
        if (g.appId === '851850' || g.id === 'pc_steam_851850') {
          g.installSize = '116.86 GB';
          g.liveStatus = 'Owned on Steam • 116.86 GB Download';
        }
        if (g.id === 'pc_valorant' || g.appId === 'valorant' || (g.title && g.title.toLowerCase() === 'valorant')) {
          g.id = 'pc_valorant';
          g.title = 'VALORANT';
          g.installSize = '45.2 GB';
          g.badge = g.installed ? 'Installed' : 'Owned';
          g.storageType = g.installed ? 'Laptop SSD (Riot Games)' : 'Riot Games (Ready to Install)';
          g.liveStatus = g.installed ? 'Installed on Laptop • Low Latency 240FPS Vanguard Active' : 'Owned on Riot Games • Ready to Install';
          g.playTime = g.installed ? (g.playTime || 'Ready to Play') : 'Ready to Install';
          g.logoImg = '/assets/games/valorant/ps5_logo.svg';
          g.tileIcon = '/assets/games/valorant/ps5_master.png';
          g.heroBg = '/assets/games/valorant/ps5_gamehub_cover.png';
          g.execPath = g.installed ? 'C:\\Riot Games\\Riot Client\\RiotClientServices.exe' : '';
          g.execArgs = '--launch-product=valorant --launch-patchline=live';
          g.launchUri = g.installed ? '' : 'https://playvalorant.com/';
        }
        if (g.appId !== '2215430' && g.id !== 'pc_steam_2215430' && (g.appId === '3240220' || g.id === 'pc_steam_3240220' || g.id === 'epic_gtav' || (g.title && g.title.toLowerCase().includes('grand theft auto v')))) {
          g.title = 'Grand Theft Auto V';
          g.logoImg = '/assets/games/gtav/logo.png';
          g.tileIcon = '/assets/games/gtav/tile.jpg';
          g.heroBg = '/assets/games/gtav/hero.jpg';
        }
        if (g.id === 'epic_rocketleague' || (g.title && g.title.toLowerCase() === 'rocket league')) {
          g.logoImg = '/assets/games/rocketleague/logo.png';
          g.tileIcon = '/assets/games/rocketleague/tile.png';
          g.heroBg = '/assets/games/rocketleague/hero.jpg';
        }
        if (g.id === 'epic_fallguys' || (g.title && g.title.toLowerCase() === 'fall guys')) {
          g.logoImg = '/assets/games/fallguys/logo.png';
          g.tileIcon = '/assets/games/fallguys/tile.png';
          g.heroBg = '/assets/games/fallguys/hero.jpg';
        }
        if (g.id === 'xbox_minecraft' || (g.title && g.title.toLowerCase() === 'minecraft')) {
          g.logoImg = '/assets/games/minecraft/logo.png';
          g.tileIcon = '/assets/games/minecraft/tile.png';
          g.heroBg = '/assets/games/minecraft/hero.jpg';
        }
        if (g.id === 'xbox_haloinfinite' || (g.title && g.title.toLowerCase().includes('halo infinite'))) {
          g.logoImg = '/assets/games/haloinfinite/logo.png';
          g.tileIcon = '/assets/games/haloinfinite/tile.jpg';
          g.heroBg = '/assets/games/haloinfinite/hero.jpg';
        }
        if (g.appId === '1551360' || g.id === 'pc_steam_1551360' || g.id === 'xbox_forzahorizon5' || (g.title && g.title.toLowerCase().includes('forza horizon 5'))) {
          g.logoImg = '/assets/games/forzahorizon5/logo.png';
          g.tileIcon = '/assets/games/forzahorizon5/tile.jpg';
          g.heroBg = '/assets/games/forzahorizon5/hero.jpg';
        }
        if (g.appId === '2440510' || g.id === 'pc_steam_2440510' || (g.title && g.title.toLowerCase().includes('motorsport'))) {
          g.logoImg = '/assets/games/forzamotorsport/logo.png';
          g.tileIcon = '/assets/games/forzamotorsport/tile.jpg';
          g.heroBg = '/assets/games/forzamotorsport/hero.jpg';
        }
        if (g.id === 'xbox_starfield' || (g.title && g.title.toLowerCase() === 'starfield')) {
          g.logoImg = '/assets/games/starfield/logo.png';
          g.tileIcon = '/assets/games/starfield/tile.jpg';
          g.heroBg = '/assets/games/starfield/hero.jpg';
        }
        if (g.id === 'xbox_seaofthieves' || (g.title && g.title.toLowerCase() === 'sea of thieves')) {
          g.logoImg = '/assets/games/seaofthieves/logo.png';
          g.tileIcon = '/assets/games/seaofthieves/tile.jpg';
          g.heroBg = '/assets/games/seaofthieves/hero.jpg';
        }
        if (g.id === 'epic_fortnite' || (g.title && g.title.toLowerCase() === 'fortnite')) {
          g.logoImg = '/assets/games/fortnite/logo.png';
          g.tileIcon = '/assets/games/fortnite/tile.jpg';
          g.heroBg = '/assets/games/fortnite/hero.jpg';
        }
        if (g.id === 'epic_alanwake2' || (g.title && g.title.toLowerCase() === 'alan wake 2')) {
          g.logoImg = '/assets/games/alanwake2/logo.png';
          g.tileIcon = '/assets/games/alanwake2/tile.jpg';
          g.heroBg = '/assets/games/alanwake2/hero.jpg';
        }
        if (g.appId === '2668510' || g.id === 'pc_steam_2668510' || (g.title && g.title.toLowerCase().includes('red dead redemption') && !g.title.toLowerCase().includes('2'))) {
          g.title = 'Red Dead Redemption';
          g.logoImg = '/assets/cache/games/pc_steam_2668510/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_2668510/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_2668510/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '1174180' || g.id === 'pc_steam_1174180' || (g.title && g.title.toLowerCase().includes('red dead redemption 2'))) {
          g.title = 'Red Dead Redemption 2';
          g.logoImg = '/assets/cache/games/pc_steam_1174180/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_1174180/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_1174180/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '814380' || g.id === 'pc_steam_814380' || (g.title && g.title.toLowerCase().includes('sekiro'))) {
          g.title = 'Sekiro™: Shadows Die Twice - GOTY Edition';
          g.logoImg = '/assets/cache/games/pc_steam_814380/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_814380/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_814380/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '570940' || g.id === 'pc_steam_570940' || (g.title && g.title.toLowerCase().includes('dark souls') && g.title.toLowerCase().includes('remastered'))) {
          g.title = 'DARK SOULS™: REMASTERED';
          g.logoImg = '/assets/cache/games/pc_steam_570940/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_570940/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_570940/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '335300' || g.id === 'pc_steam_335300' || (g.title && g.title.toLowerCase().includes('dark souls ii'))) {
          g.title = 'DARK SOULS™ II: Scholar of the First Sin';
          g.logoImg = '/assets/cache/games/pc_steam_335300/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_335300/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_335300/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '374320' || g.id === 'pc_steam_374320' || (g.title && g.title.toLowerCase().includes('dark souls iii'))) {
          g.title = 'DARK SOULS™ III';
          g.logoImg = '/assets/cache/games/pc_steam_374320/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_374320/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_374320/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '2315690' || g.id === 'pc_steam_2315690' || (g.title && g.title.toLowerCase().includes('wwe 2k24'))) {
          g.title = 'WWE 2K24';
          g.logoImg = '/assets/cache/games/pc_steam_2315690/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_2315690/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_2315690/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '3717070' || g.id === 'pc_steam_3717070' || (g.title && g.title.toLowerCase().includes('wwe 2k26'))) {
          g.title = 'WWE 2K26';
          g.logoImg = '/assets/cache/games/pc_steam_3717070/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_3717070/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_3717070/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '2698940' || g.id === 'pc_steam_2698940' || (g.title && g.title.toLowerCase().includes('motorfest'))) {
          g.title = 'The Crew™ Motorfest';
          g.logoImg = '/assets/cache/games/pc_steam_2698940/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_2698940/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_2698940/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '3768760' || g.id === 'pc_steam_3768760' || (g.title && g.title.toLowerCase().includes('007 first light'))) {
          g.title = '007 First Light';
          g.logoImg = '/assets/cache/games/pc_steam_3768760/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_3768760/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_3768760/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '502820' || g.id === 'pc_steam_502820' || (g.title && g.title.toLowerCase().includes('arkham vr'))) {
          g.title = 'Batman™: Arkham VR';
          g.logoImg = '/assets/cache/games/pc_steam_502820/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_502820/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_502820/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }
        if (g.appId === '1778820' || g.id === 'pc_steam_1778820' || (g.title && g.title.toLowerCase().includes('tekken 8'))) {
          g.title = 'TEKKEN 8';
          g.logoImg = '/assets/cache/games/pc_steam_1778820/logo.png';
          g.tileIcon = '/assets/cache/games/pc_steam_1778820/tile.jpg';
          g.heroBg = '/assets/cache/games/pc_steam_1778820/hero.jpg';
          g.heroBgPos = 'center center';
          g.heroBgSize = 'cover';
          g.heroBgZoom = 1.0;
          g.heroBgOrigin = 'center center';
        }

        if (hasCustomArt) {
          if (originalTile) g.tileIcon = originalTile;
          if (originalHero) g.heroBg = originalHero;
          if (originalLogo) g.logoImg = originalLogo;
          if (originalZoom !== undefined) g.heroBgZoom = originalZoom;
          if (originalPos) g.heroBgPos = originalPos;
          if (originalSize) g.heroBgSize = originalSize;
          if (originalOrigin) g.heroBgOrigin = originalOrigin;
          g.hasCustomArtwork = true;
          g.customArtwork = true;
        }
      });
      const deduped = deduplicateGameList(cleaned);
      localStorage.setItem('ps5_synced_pc_games', JSON.stringify(deduped));
    }
  } catch (e) {}

  // Initial load
  loadTabItems();

  // Mouse Wheel Navigation: Carousel left / right navigation (smooth console glide)
  let lastWheelTime = 0;
  window.addEventListener('wheel', (e) => {
    if (libraryModalOpen) return;
    const now = Date.now();
    if (now - lastWheelTime < 110) return;
    lastWheelTime = now;
    if (e.deltaY > 24 || e.deltaX > 24) {
      navigateCarousel('right');
    } else if (e.deltaY < -24 || e.deltaX < -24) {
      navigateCarousel('left');
    }
  }, { passive: true });

  window.ps5OpenExploreHub = () => {
    openOverlay('ps5-explore-modal');
  };

  // Handle dynamically downloaded & cropped artwork updates
  window.addEventListener('ps5-game-artwork-updated', (e) => {
    const detail = e.detail || {};
    const { gameId, title, tileIcon, heroBg, logoImg, heroBgPos, heroBgSize, heroBgZoom, heroBgOrigin } = detail;
    const hasLogoValue = Object.prototype.hasOwnProperty.call(detail, 'logoImg');
    if (!gameId) return;

    const item = homeItems.find(it => it.id === gameId);
    if (item) {
      if (title && /^Steam App \d+$/i.test(item.title || '')) item.title = title;
      if (tileIcon) item.tileIcon = tileIcon;
      if (heroBg) item.heroBg = heroBg;
      if (hasLogoValue) item.logoImg = logoImg || '';
      if (heroBgPos) item.heroBgPos = heroBgPos;
      if (heroBgSize) item.heroBgSize = heroBgSize;
      if (heroBgZoom !== undefined) item.heroBgZoom = heroBgZoom;
      if (heroBgOrigin) item.heroBgOrigin = heroBgOrigin;
      item.hasCustomArtwork = true;
      item.customArtwork = true;
    }
    const allGames = typeof getPS5Games === 'function' ? getPS5Games() : PS5_GAMES;
    const gObj = allGames.find(g => g.id === gameId);
    if (gObj) {
      if (title && /^Steam App \d+$/i.test(gObj.title || '')) gObj.title = title;
      if (tileIcon) gObj.tileIcon = tileIcon;
      if (heroBg) gObj.heroBg = heroBg;
      if (hasLogoValue) gObj.logoImg = logoImg || '';
      if (heroBgPos) gObj.heroBgPos = heroBgPos;
      if (heroBgSize) gObj.heroBgSize = heroBgSize;
      if (heroBgZoom !== undefined) gObj.heroBgZoom = heroBgZoom;
      if (heroBgOrigin) gObj.heroBgOrigin = heroBgOrigin;
      gObj.hasCustomArtwork = true;
      gObj.customArtwork = true;
    }

    // Persist immediately to localStorage synced PC games cache
    try {
      const raw = localStorage.getItem('ps5_synced_pc_games');
      if (raw) {
        const list = JSON.parse(raw);
        const match = list.find(g => g.id === gameId || (item?.appId && String(g.appId) === String(item.appId)));
        if (match) {
          if (title && /^Steam App \d+$/i.test(match.title || '')) match.title = title;
          if (tileIcon) match.tileIcon = tileIcon;
          if (heroBg) match.heroBg = heroBg;
          if (hasLogoValue) match.logoImg = logoImg || '';
          if (heroBgPos) match.heroBgPos = heroBgPos;
          if (heroBgSize) match.heroBgSize = heroBgSize;
          if (heroBgZoom !== undefined) match.heroBgZoom = heroBgZoom;
          if (heroBgOrigin) match.heroBgOrigin = heroBgOrigin;
          match.hasCustomArtwork = true;
          match.customArtwork = true;
          localStorage.setItem('ps5_synced_pc_games', JSON.stringify(deduplicateGameList(list)));
        }
      }
    } catch (err) {}

    // In-place UI update: directly update the target game card DOM element without rebuilding carousel
    const tileEl = trackElement?.querySelector(`.ps5-tile[data-game-id="${gameId}"]`);
    if (tileEl && tileIcon) {
      const resolved = resolveAssetUrl(tileIcon, item?.appId || gObj?.appId, 'tile');
      let tileImg = tileEl.querySelector('.ps5-tile-img');
      const fallback = tileEl.querySelector('.ps5-tile-fallback');
      if (resolved) {
        if (!tileImg) {
          tileImg = document.createElement('img');
          tileImg.className = 'ps5-tile-img';
          tileImg.alt = item?.title || gObj?.title || '';
          tileImg.loading = 'eager';
          tileImg.decoding = 'async';
          const inner = tileEl.querySelector('.ps5-tile-inner') || tileEl;
          inner.insertBefore(tileImg, fallback);
        }
        tileImg.src = resolved;
        tileImg.style.display = 'block';
        if (fallback) fallback.style.display = 'none';
      }
    }

    // Preload into GPU texture cache for zero stutter
    if (heroBg) { const img = new Image(); img.src = heroBg; }
    if (tileIcon) { const img = new Image(); img.src = tileIcon; }
    if (logoImg) { const img = new Image(); img.src = logoImg; }

    const curItem = getCurrentItem();
    if (curItem && curItem.id === gameId) {
      if (currentActiveBgLayer) currentActiveBgLayer.dataset.bgUrl = '';
      lastDisplayedHeroUrl = null;
      lastDisplayedLogoUrl = null;
      updateHeroDisplay(true);
    }
  });

  window.addEventListener('ps5-refresh-hero-display', (e) => {
    const targetGameId = e.detail?.gameId;
    const curItem = getCurrentItem();
    // Only refresh hero display if the currently focused game matches the target game (prevents race conditions)
    if (!targetGameId || (curItem && curItem.id === targetGameId)) {
      if (currentActiveBgLayer) currentActiveBgLayer.dataset.bgUrl = '';
      lastDisplayedHeroUrl = null;
      lastDisplayedLogoUrl = null;
      updateHeroDisplay(true);
    }
  });

  // Handle live Steam download progress updates
  window.addEventListener('ps5-steam-download-update', () => {
    const sig = getDownloadGroupSignature();
    if (sig !== currentDownloadGroupSignature) {
      loadTabItems();
    }
    updateLiveDownloadUI();
  });

  window.addEventListener('ps5-game-download-completed', (e) => {
    const { appId } = e.detail || {};
    const item = homeItems.find(it => String(it.appId) === String(appId));
    if (item) {
      item.installed = true;
      item.badge = 'Installed';
      item.liveStatus = 'Installed on Laptop • Ready to Launch';
      if (item.id) setGameInstalled(item.id, true);
    }
    loadTabItems();
  });

  window.addEventListener('ps5-media-installed', () => {
    loadTabItems();
  });
}

const OFFICIAL_LOCAL_ASSETS = {
  '2215430': { tile: '/assets/games/got/tile.webp', hero: '/assets/games/got/hero.webp', logo: '/assets/games/got/logo.png' },
  '1817190': { tile: '/assets/games/spidermanmilesmorales/tile.webp', hero: '/assets/games/spidermanmilesmorales/hero.webp', logo: '/assets/games/spidermanmilesmorales/logo.png' },
  '1817070': { tile: '/assets/games/spidermanremastered/tile.webp', hero: '/assets/games/spidermanremastered/hero.webp', logo: '/assets/games/spidermanremastered/logo.png' },
  '2651280': { tile: '/assets/games/spiderman2/tile.webp', hero: '/assets/games/spiderman2/hero.webp', logo: '/assets/games/spiderman2/logo.png' },
  '1593500': { tile: '/assets/games/gow/tile.webp', hero: '/assets/games/gow/hero.webp', logo: '/assets/games/gow/logo.png' },
  '2322010': { tile: '/assets/games/gowragnarok/tile.webp', hero: '/assets/games/gowragnarok/hero.webp', logo: '/assets/games/gowragnarok/logo.png' },
  '1888930': { tile: '/assets/games/tlou1/tile.webp', hero: '/assets/games/tlou1/hero.webp', logo: '/assets/games/tlou1/logo.png' },
  '2531310': { tile: '/assets/games/tlou2/tile.webp', hero: '/assets/games/tlou2/hero.webp', logo: '/assets/games/tlou2/logo.png' },
  '1790600': { tile: '/assets/games/sparkingzero/tile.webp', hero: '/assets/games/sparkingzero/hero.webp', logo: '/assets/games/sparkingzero/logo.png' },
  '851850': { tile: '/assets/games/dbzkakarot/tile.webp', hero: '/assets/games/dbzkakarot/hero.webp', logo: '/assets/games/dbzkakarot/logo.png' },
  '1650010': { tile: '/assets/games/ride5/tile.webp', hero: '/assets/games/ride5/hero.webp', logo: '/assets/games/ride5/logo.png' },
  '1815780': { tile: '/assets/games/asphaltlegends/tile.webp', hero: '/assets/games/asphaltlegends/hero.webp', logo: '/assets/games/asphaltlegends/logo.png' },
  '730': { tile: '/assets/games/cs2/tile.webp', hero: '/assets/games/cs2/hero.webp', logo: '/assets/games/cs2/logo.png' },
  '2050650': { tile: '/assets/games/re4/tile.webp', hero: '/assets/games/re4/hero.webp', logo: '/assets/games/re4/logo.png' },
  '2483190': { tile: '/assets/games/forza6/tile.jpg', hero: '/assets/games/forza6/hero.jpg', logo: '/assets/games/forza6/logo.png' },
  '431960': { tile: '/assets/games/wallpaper/tile.jpg', hero: '/assets/games/wallpaper/hero.jpg', logo: '/assets/games/wallpaper/logo.png' },
  '2358720': { tile: '/assets/games/wukong/ps5_tile.webp', hero: '/assets/games/wukong/ps5_hero.webp', logo: '/assets/games/wukong/logo.png' },
  '3764200': { tile: '/assets/games/rerequiem/tile.jpg', hero: '/assets/games/rerequiem/hero.jpg', logo: '/assets/games/rerequiem/logo.png' },
  '4080220': { tile: '/assets/games/eafc27/tile.png', hero: '/assets/games/eafc27/hero.jpg', logo: '/assets/games/eafc27/logo.png' },
  '3357650': { tile: '/assets/games/pragmata/tile.png', hero: '/assets/games/pragmata/hero.jpg', logo: '/assets/games/pragmata/logo.png' },
  '1551360': { tile: '/assets/games/forzahorizon5/tile.jpg', hero: '/assets/games/forzahorizon5/hero.jpg', logo: '/assets/games/forzahorizon5/logo.png' },
  '2440510': { tile: '/assets/games/forzamotorsport/tile.jpg', hero: '/assets/games/forzamotorsport/hero.jpg', logo: '/assets/games/forzamotorsport/logo.png' }
};

export function resolveAssetUrl(url, appId, type = 'tile') {
  const isFileProto = typeof window !== 'undefined' && window.location?.protocol === 'file:';
  const aid = appId || (url && url.includes('appId=') ? url.split('appId=')[1]?.split('&')[0] : '');
  const aType = type || (url && url.includes('type=') ? url.split('type=')[1]?.split('&')[0] : 'tile');

  const getCachedAsset = (id, assetType) => {
    if (!id) return '';
    const file = assetType === 'logo' ? 'logo.png' : (assetType === 'hero' ? 'hero.jpg' : 'tile.jpg');
    return `/assets/cache/games/pc_steam_${id}/${file}`;
  };

  const getSteamCdn = (id, assetType) => {
    if (!id) return '';
    if (assetType === 'logo') return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/logo.png`;
    if (assetType === 'hero') return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/library_hero.jpg`;
    return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900_2x.jpg`;
  };

  if (!url) {
    if (aid && OFFICIAL_LOCAL_ASSETS[aid]?.[aType]) {
      const local = OFFICIAL_LOCAL_ASSETS[aid][aType];
      return isFileProto ? '.' + local : local;
    }
    if (aid) {
      const cached = getCachedAsset(aid, aType);
      return isFileProto ? '.' + cached : cached;
    }
    return '';
  }

  // 1. Data URLs (e.g. from canvas crop or live image upload) always take highest priority
  if (url.startsWith('data:')) {
    return url;
  }

  // 2. Cached persistent assets (e.g. /assets/cache/games/...) always take priority over defaults
  if (url.includes('/assets/cache/') || url.startsWith('/assets/cache/')) {
    return isFileProto && !url.startsWith('.') ? '.' + url : url;
  }

  // 3. Direct HTTP / HTTPS URLs (e.g. from Steam Akamai CDN) always take priority over defaults
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 4. Handle /api/pc/asset endpoints cleanly: use verified curated assets first, otherwise let Vite serve live Steam cache/CDN on HTTP or local cache on file://
  if (url.startsWith('/api/pc/asset')) {
    if (aid && OFFICIAL_LOCAL_ASSETS[aid]?.[aType]) {
      const local = OFFICIAL_LOCAL_ASSETS[aid][aType];
      return isFileProto ? '.' + local : local;
    }
    if (isFileProto && aid) {
      return '.' + getCachedAsset(aid, aType);
    }
    return url;
  }

  // 5. Handle generic placeholder images (replace with official local asset if known)
  if (url.includes('unsplash') || url.includes('photo-1550745165-9bc0b252726f')) {
    if (aid && OFFICIAL_LOCAL_ASSETS[aid]?.[aType]) {
      const local = OFFICIAL_LOCAL_ASSETS[aid][aType];
      return isFileProto ? '.' + local : local;
    }
    if (aid) {
      const cached = getCachedAsset(aid, aType);
      return isFileProto ? '.' + cached : cached;
    }
  }

  // 6. Handle local /assets/ paths
  if (url.startsWith('/assets/')) {
    if (isFileProto) {
      return '.' + url;
    }
    return url;
  }

  return url;
}

function warmCarouselAssets(items, { includeHeroes = true, maxItems = 24 } = {}) {
  const queue = (Array.isArray(items) ? items : []).slice(0, maxItems);
  let idx = 0;

  const warmOne = (url) => {
    if (!url || preloadedAssetUrls.has(url)) return;
    preloadedAssetUrls.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  };

  const preloadNextBatch = () => {
    const end = Math.min(idx + 3, queue.length);
    for (; idx < end; idx++) {
      const item = queue[idx];
      if (!item) continue;
      if (item.tileIcon) warmOne(resolveAssetUrl(item.tileIcon, item.appId, 'tile'));
      if (includeHeroes && idx < 10) {
        if (item.heroBg) warmOne(resolveAssetUrl(item.heroBg, item.appId, 'hero'));
        if (item.logoImg) warmOne(resolveAssetUrl(item.logoImg, item.appId, 'logo'));
      }
    }
    if (idx < queue.length) {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(preloadNextBatch, { timeout: 600 });
      } else {
        setTimeout(preloadNextBatch, 100);
      }
    }
  };

  if (queue.length > 0) {
    setTimeout(preloadNextBatch, 180);
  }
}

function preloadAssets() {
  warmCarouselAssets([...PS5_GAMES, ...PS5_MEDIA_APPS], { includeHeroes: true, maxItems: 24 });
}

export function isItemActiveDownloading(item) {
  if (!item) return false;
  const appId = item.appId || (typeof item.id === 'string' && item.id.startsWith('pc_steam_') ? item.id.replace('pc_steam_', '') : null);
  if (!appId) return false;
  const dl = getSteamDownload(appId);
  return Boolean(dl && (dl.status === 'Downloading' || dl.status === 'Updating' || dl.status === 'Paused'));
}

let currentDownloadGroupSignature = '';
let downloadActionPending = false;
let deferredDownloadGroupRefresh = false;

function getDownloadGroupSignature() {
  const gamesList = typeof getPS5Games === 'function' ? getPS5Games() : PS5_GAMES;
  const source = currentTab === 'games' ? deduplicateGameList(gamesList) : PS5_MEDIA_APPS;
  const activeEntries = [];
  for (const it of source) {
    if (isItemActiveDownloading(it)) {
      const dl = getSteamDownload(it.appId);
      activeEntries.push(`${it.id || it.appId}:${dl?.status || 'Downloading'}`);
    }
  }
  return activeEntries.join('|');
}

export function getSavedGameOrder() {
  try {
    const raw = localStorage.getItem('ps5_game_order');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    }
  } catch (e) {}
  return null;
}

export function saveGameOrder(orderArray) {
  try {
    if (Array.isArray(orderArray)) {
      const unique = Array.from(new Set(orderArray));
      localStorage.setItem('ps5_game_order', JSON.stringify(unique));
    }
  } catch (e) {}
}

export function moveGameInOrder(gameId, direction) {
  if (!gameId || (direction !== 'left' && direction !== 'right')) return false;

  const gamesList = typeof getPS5Games === 'function' ? getPS5Games() : PS5_GAMES;
  const nonStore = gamesList.filter(item => !item.isStore && !item.isLibrary && !item.isExplore);
  let savedOrder = getSavedGameOrder() || nonStore.map(g => g.id);

  const curIdx = savedOrder.indexOf(gameId);
  if (curIdx === -1) return false;

  const targetIdx = direction === 'left' ? curIdx - 1 : curIdx + 1;
  if (targetIdx < 0 || targetIdx >= savedOrder.length) return false;

  const temp = savedOrder[curIdx];
  savedOrder[curIdx] = savedOrder[targetIdx];
  savedOrder[targetIdx] = temp;

  saveGameOrder(savedOrder);

  // Sync in-memory PS5_GAMES order
  const orderMap = new Map();
  savedOrder.forEach((id, idx) => orderMap.set(id, idx));
  PS5_GAMES.sort((a, b) => {
    if (a.isExplore) return -1;
    if (b.isExplore) return 1;
    if (a.isStore) return -1;
    if (b.isStore) return 1;
    if (a.isLibrary) return 1;
    if (b.isLibrary) return -1;
    return (orderMap.get(a.id) ?? 99999) - (orderMap.get(b.id) ?? 99999);
  });

  loadTabItems();

  const newIdx = homeItems.findIndex(it => it.id === gameId);
  if (newIdx !== -1) {
    selectIndex(newIdx);
  }

  try { ps5Audio.playNavTick?.(); } catch (e) {}

  const movedItem = homeItems.find(it => it.id === gameId);
  window.dispatchEvent(new CustomEvent('ps5-show-notification', {
    detail: {
      title: `Card Moved ${direction === 'left' ? 'Left ⬅' : 'Right ➡'}`,
      subtitle: `${movedItem?.title || 'Game'} position updated in carousel.`
    }
  }));

  return true;
}

export function reorderGames(sourceGameId, targetGameId) {
  if (!sourceGameId || !targetGameId || sourceGameId === targetGameId) return false;

  const gamesList = typeof getPS5Games === 'function' ? getPS5Games() : PS5_GAMES;
  const nonStore = gamesList.filter(item => !item.isStore && !item.isLibrary && !item.isExplore);
  let savedOrder = getSavedGameOrder() || nonStore.map(g => g.id);

  const srcIdx = savedOrder.indexOf(sourceGameId);
  const tgtIdx = savedOrder.indexOf(targetGameId);
  if (srcIdx === -1 || tgtIdx === -1) return false;

  savedOrder.splice(srcIdx, 1);
  savedOrder.splice(tgtIdx, 0, sourceGameId);

  saveGameOrder(savedOrder);

  const orderMap = new Map();
  savedOrder.forEach((id, idx) => orderMap.set(id, idx));
  PS5_GAMES.sort((a, b) => {
    if (a.isExplore) return -1;
    if (b.isExplore) return 1;
    if (a.isStore) return -1;
    if (b.isStore) return 1;
    if (a.isLibrary) return 1;
    if (b.isLibrary) return -1;
    return (orderMap.get(a.id) ?? 99999) - (orderMap.get(b.id) ?? 99999);
  });

  loadTabItems();

  const newIdx = homeItems.findIndex(it => it.id === sourceGameId);
  if (newIdx !== -1) {
    selectIndex(newIdx);
  }

  try { ps5Audio.playNavTick?.(); } catch (e) {}
  return true;
}

if (typeof window !== 'undefined') {
  window.moveGameInOrder = moveGameInOrder;
  window.reorderGames = reorderGames;
}

let lastRenderedOrderKey = '';
let lastRenderedVisualKey = '';
const preloadedAssetUrls = new Set();
const loadedHeroUrls = new Set();
let heroLoadSeq = 0;

function loadTabItems() {
  // Steam temporarily removes/reinserts an app while processing pause/resume.
  // Rebuilding the selected hero during that gap can replace its progress pill
  // with Download. Defer the carousel rebuild until Steam confirms the action.
  if (downloadActionPending) {
    deferredDownloadGroupRefresh = true;
    return;
  }

  const selectedItemId = homeItems[activeIndex]?.id;
  const gamesList = typeof getPS5Games === 'function' ? getPS5Games() : PS5_GAMES;
  const source = currentTab === 'games' ? deduplicateGameList(gamesList) : PS5_MEDIA_APPS;

  const libraryTile = {
    id: '__ps5_library__',
    isLibrary: true,
    title: currentTab === 'games' ? 'Game Library' : 'App Library',
    studio: 'PlayStation Console & PC Storage • 1.2 TB Free',
    genre: 'Installed Games & Cloud Collection',
    tileIcon: '',
    heroBg: '/assets/games/explore/hero.svg',
    badge: 'Library',
    installed: true,
    liveStatus: 'Manage Installed Storage & Sync PC Games'
  };

  let nextHomeItems = [];

  if (currentTab === 'games') {
    const storeTile = source.find(item => item.isStore);

    // Authentic PS5 Home Carousel: display installed games, active downloads, and Steam Favorites / multi-store titles.
    const showInstalledOnly = (typeof window !== 'undefined' && window.ps5Settings?.homeShowInstalledOnly !== undefined)
      ? window.ps5Settings.homeShowInstalledOnly
      : false;

    const nonStore = source.filter(item => {
      if (item.isStore || item.isLibrary || item.isExplore) return false;
      if (!showInstalledOnly) return true;
      return Boolean(
        item.installed === true ||
        item.isDownloading ||
        item.status === 'Downloading' ||
        item.status === 'Paused' ||
        item.badge === 'Downloading' ||
        item.badge === 'Paused' ||
        item.favorite === true ||
        !item.installed
      );
    });

    const savedOrder = getSavedGameOrder();
    let orderedNonStore = [];

    if (savedOrder && savedOrder.length > 0) {
      const orderMap = new Map();
      savedOrder.forEach((id, idx) => {
        orderMap.set(id, idx);
        if (id === 'the-last-of-us-part-1' || id === 'tlou1' || id === '1888930') {
          if (!orderMap.has('pc_steam_1888930')) orderMap.set('pc_steam_1888930', idx);
        }
        if (id === 'the-last-of-us-part-2' || id === 'tlou2' || id === '2531310') {
          if (!orderMap.has('pc_steam_2531310')) orderMap.set('pc_steam_2531310', idx);
        }
      });

      const existingOrdered = [];
      const newGames = [];
      // Guard against stale variant IDs in savedOrder that point to the same game —
      // track placed games by identity so a game that already matched can't sneak into newGames too.
      const placedGameIds = new Set();

      for (const item of nonStore) {
        if (placedGameIds.has(item.id)) continue;
        if (orderMap.has(item.id)) {
          existingOrdered.push(item);
        } else {
          newGames.push(item);
        }
        placedGameIds.add(item.id);
      }

      existingOrdered.sort((a, b) => (orderMap.get(a.id) ?? 99999) - (orderMap.get(b.id) ?? 99999));
      orderedNonStore = deduplicateGameList([...existingOrdered, ...newGames]);
      saveGameOrder(orderedNonStore.map(g => g.id));
    } else {
      orderedNonStore = deduplicateGameList(nonStore);
      saveGameOrder(orderedNonStore.map(g => g.id));
    }

    const isSteamFavItem = (item) => {
      if (!item) return false;
      const aid = item.appId ? String(item.appId) : '';
      return Boolean(item.favorite || (aid && ownedSteamFavorites.has(aid)));
    };

    const getGameSortRank = (item) => {
      if (isSteamFavItem(item)) return 0;
      if (item.store === 'xbox' || (typeof item.id === 'string' && item.id.startsWith('xbox_'))) return 10;
      if (item.store === 'epic' || (typeof item.id === 'string' && item.id.startsWith('epic_'))) return 20;
      return 50;
    };

    // Authentic PS5 carousel layout:
    // 1. Installed games (ready to play)
    // 2. Active downloads / updates
    // 3. Downloadable Steam Favorites & non-Steam catalog titles
    const installedGames = orderedNonStore.filter(g => g.installed && !isItemActiveDownloading(g));
    const downloadingGames = orderedNonStore.filter(g => isItemActiveDownloading(g));
    const downloadableGames = orderedNonStore.filter(g => {
      if (g.installed || isItemActiveDownloading(g)) return false;
      if (g.store === 'steam' || (!g.store && g.appId)) {
        return !g.appId || ownedSteamFavorites.has(String(g.appId));
      }
      return true;
    });

    downloadableGames.sort((a, b) => {
      const rankDiff = getGameSortRank(a) - getGameSortRank(b);
      if (rankDiff !== 0) return rankDiff;
      const playedDiff = Number(b.lastPlayed || 0) - Number(a.lastPlayed || 0);
      if (playedDiff !== 0) return playedDiff;
      return 0;
    });

    nextHomeItems = deduplicateGameList([
      ...(storeTile ? [storeTile] : []),
      ...installedGames,
      ...downloadingGames,
      ...downloadableGames,
      libraryTile
    ]);
  } else {
    const downloadingMedia = source.filter(item => isItemActiveDownloading(item));
    const normalInstalled = source.filter(item => !isItemActiveDownloading(item) && item.installed === true);
    const normalAvailable = source.filter(item => !isItemActiveDownloading(item) && item.installed !== true);
    nextHomeItems = [
      ...normalInstalled,
      ...downloadingMedia,
      ...normalAvailable,
      libraryTile
    ];
  }

  const nextOrderKey = `${currentTab}|${nextHomeItems.map(it => it.id).join(',')}`;
  const nextVisualKey = nextHomeItems.map(it =>
    `${it.id}:${it.installed ? 1 : 0}:${it.isDownloading ? 1 : 0}:${it.status || ''}:${it.badge || ''}:${it.tileIcon || ''}:${it.heroBg || ''}:${it.logoImg || ''}:${it.title || ''}`
  ).join('|');

  homeItems = nextHomeItems;
  currentDownloadGroupSignature = getDownloadGroupSignature();

  // Skip full track teardown and image churn when nothing visible changed
  if (
    trackElement &&
    tileElements.length === homeItems.length &&
    nextOrderKey === lastRenderedOrderKey &&
    nextVisualKey === lastRenderedVisualKey
  ) {
    return;
  }

  lastRenderedOrderKey = nextOrderKey;
  lastRenderedVisualKey = nextVisualKey;

  // Preserve focus and selection across live layout re-orderings
  if (selectedItemId) {
    const newIdx = homeItems.findIndex(it => it.id === selectedItemId);
    if (newIdx !== -1) {
      activeIndex = newIdx;
    }
  } else if (currentTab === 'games' && activeIndex === 0 && homeItems.length > 1 && !homeItems[1].isStore) {
    activeIndex = 1;
  }

  if (activeIndex >= homeItems.length) {
    activeIndex = Math.max(0, homeItems.length - 1);
  }

  // Preload newly introduced asset URLs in small async idle batches (never block input thread)
  warmCarouselAssets(homeItems, { includeHeroes: false, maxItems: 24 });

  renderCarouselTrack();
  updateActiveTile();
  updateHeroDisplay(true);
}

function renderCarouselTrack() {
  if (!carouselContainer) return;

  carouselContainer.innerHTML = '<div class="ps5-carousel-track" id="ps5-carousel-track"></div>';
  trackElement = document.getElementById('ps5-carousel-track');

  trackElement.innerHTML = homeItems.map((item, idx) => {
    // 0. Official PlayStation Explore Tile
    if (item.isExplore) {
      return `
        <div class="ps5-tile tile-explore ${idx === activeIndex ? 'active' : ''}" data-index="${idx}" data-game-id="${item.id}" tabindex="0">
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
        <div class="ps5-tile tile-store ${idx === activeIndex ? 'active' : ''}" data-index="${idx}" data-game-id="${item.id}" tabindex="0">
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
        <div class="ps5-tile tile-library ${idx === activeIndex ? 'active' : ''}" data-index="${idx}" data-game-id="${item.id}" tabindex="0">
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

    // Separator logic for carousel groups:
    // 1. Downloaded/installed games ('installed')
    // 2. Downloading, updating, or paused games ('downloading')
    // 3. Downloadable games (not installed & no active download) ('downloadable')
    // Shows a single separator between adjacent groups that contain items.
    const getItemGroup = (it) => {
      if (!it || it.isStore || it.isLibrary || it.isExplore) return null;
      if (isItemActiveDownloading(it)) return 'downloading';
      if (it.installed) return 'installed';
      return 'downloadable';
    };

    const prevItem = idx > 0 ? homeItems[idx - 1] : null;
    const currGroup = currentTab === 'games' ? getItemGroup(item) : null;
    const prevGroup = currentTab === 'games' ? getItemGroup(prevItem) : null;

    let showDivider = false;
    let dividerTitle = '';

    if (currentTab === 'games') {
      if (currGroup && prevGroup && currGroup !== prevGroup) {
        showDivider = true;
        dividerTitle = currGroup === 'downloading' ? 'Downloads' : 'Owned Games';
      }
    } else {
      const isDl = isItemActiveDownloading(item);
      const isPrevDl = prevItem ? isItemActiveDownloading(prevItem) : false;
      if (isDl && !isPrevDl) {
        showDivider = true;
        dividerTitle = 'Downloads';
      }
    }

    const dividerHtml = showDivider ? `
      <div class="ps5-track-divider" title="${dividerTitle}"></div>
    ` : '';

    const dlState = item.appId ? getSteamDownload(item.appId) : null;
    return PS5GameCard.renderTrackCard(item, idx, activeIndex, { dlState, currentTab, dividerHtml });
  }).join('');

  tileElements = Array.from(trackElement.querySelectorAll('.ps5-tile'));

  let isDraggingCard = false;

  tileElements.forEach(tile => {
    const gameId = tile.getAttribute('data-game-id');
    if (!gameId || tile.classList.contains('tile-explore') || tile.classList.contains('tile-store') || tile.classList.contains('tile-library')) {
      return;
    }

    tile.addEventListener('dragstart', (e) => {
      isDraggingCard = true;
      e.dataTransfer.setData('text/plain', gameId);
      e.dataTransfer.effectAllowed = 'move';
      tile.classList.add('is-dragging');
    });

    tile.addEventListener('dragend', () => {
      tile.classList.remove('is-dragging');
      tileElements.forEach(t => t.classList.remove('drag-over'));
      setTimeout(() => { isDraggingCard = false; }, 50);
    });

    tile.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      tile.classList.add('drag-over');
    });

    tile.addEventListener('dragleave', () => {
      tile.classList.remove('drag-over');
    });

    tile.addEventListener('drop', (e) => {
      e.preventDefault();
      tile.classList.remove('drag-over');
      const srcId = e.dataTransfer.getData('text/plain');
      if (srcId && srcId !== gameId) {
        reorderGames(srcId, gameId);
      }
    });
  });

  trackElement.onclick = (e) => {
    if (isDraggingCard) return;
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
  } else if (item.appId && getSteamDownload(item.appId)) {
    if (downloadActionPending) return;
    const now = Date.now();
    if (now - lastPillClickTime < 800) return;
    lastPillClickTime = now;
    const dlState = getSteamDownload(item.appId);
    if (dlState?.syncStatus === 'syncing') return;
    try { ps5Audio.play?.('select'); } catch (err) {}
    toggleSteamDownload(item, dlState.status !== 'Paused');
  } else if (!item.installed) {
    if (item.store === 'riot' || item.id === 'pc_valorant' || item.appId === 'valorant') {
      const targetUrl = item.launchUri || 'https://playvalorant.com/';
      if (window.electronAPI?.launchGame) {
        window.electronAPI.launchGame({ uri: targetUrl, title: item.title });
      } else {
        try { window.open(targetUrl, '_blank'); } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: `📥 Download VALORANT`,
          subtitle: "Opening Riot Games official download page."
        }
      }));
    } else if (item.store === 'epic') {
      const epicUri = item.launchUri || (item.appId ? `com.epicgames.launcher://apps/${item.appId}?action=install` : 'com.epicgames.launcher://');
      if (window.electronAPI?.launchGame) {
        window.electronAPI.launchGame({ uri: epicUri, title: item.title });
      } else {
        try { window.location.href = epicUri; } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: `📥 Download ${item.title}`,
          subtitle: "Opening Epic Games Launcher."
        }
      }));
    } else if (item.store === 'xbox') {
      const xboxUri = item.launchUri || 'xbox://';
      if (window.electronAPI?.launchGame) {
        window.electronAPI.launchGame({ uri: xboxUri, title: item.title });
      } else {
        try { window.location.href = xboxUri; } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: `📥 Install ${item.title}`,
          subtitle: "Opening Xbox Game Pass."
        }
      }));
    } else if (item.appId && /^\d+$/.test(String(item.appId))) {
      // Uninstalled Steam game: Trigger Download
      if (window.electronAPI?.launchGame) {
        window.electronAPI.launchGame({ uri: `steam://install/${item.appId}`, title: item.title });
      } else {
        try {
          window.location.href = `steam://install/${item.appId}`;
        } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: `📥 Download Started: ${item.title}`,
          subtitle: "Steam download & installation initiated."
        }
      }));
    } else if (item.launchUri) {
      if (window.electronAPI?.launchGame) {
        window.electronAPI.launchGame({ uri: item.launchUri, title: item.title });
      } else {
        try { window.open(item.launchUri, '_blank'); } catch (e) {}
      }
    } else {
      window.dispatchEvent(new CustomEvent('ps5-request-launch'));
    }
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
    const cards = document.querySelectorAll('#ps5-activities-row .ps5-activity-card');
    if (cards.length > 1) {
      if (direction === 'left' && activeActivityIndex > 0) {
        navigateActivities('left');
        return;
      }
      if (direction === 'right' && activeActivityIndex < cards.length - 1) {
        navigateActivities('right');
        return;
      }
    }
    // Never trap Left/Right or A/D when an item has 0-1 cards or reached row edge
    exitGameHub();
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
  if (isGameHubActive) exitGameHub();
  if (index >= 0 && index < homeItems.length && index !== activeIndex) {
    const oldIdx = activeIndex;
    activeIndex = index;
    onSelectionChange(oldIdx, activeIndex);
  }
}

let glideTimer = null;

function onSelectionChange(oldIdx, newIdx) {
  ps5Audio.playNavTick();
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.add('carousel-gliding');
    if (glideTimer) clearTimeout(glideTimer);
    glideTimer = setTimeout(() => {
      document.body.classList.remove('carousel-gliding');
    }, 180);
  }
  updateActiveTile(oldIdx, newIdx);
  updateHeroDisplay(false);
}

function getSettledTileOffsetLeft(targetTile) {
  if (!targetTile) return 0;
  if (!trackElement) return targetTile.offsetLeft || 0;
  const TRACK_GAP = 14;
  const INACTIVE_TILE_W = 106;
  let x = 0;
  for (const child of trackElement.children) {
    if (child === targetTile) return x;
    if (child.classList?.contains('ps5-tile')) {
      x += INACTIVE_TILE_W + TRACK_GAP;
    } else {
      let childWidth = child.offsetWidth || 1.5;
      let marginTotal = 12;
      try {
        const cs = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(child) : null;
        if (cs) {
          childWidth = parseFloat(cs.width) || childWidth;
          marginTotal = (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0);
        }
      } catch (e) {}
      x += childWidth + marginTotal + TRACK_GAP;
    }
  }
  return targetTile.offsetLeft || 0;
}

let carouselLayoutMetrics = {
  paddingLeft: 74,
  paddingTop: 14,
  carouselTop: 104,
  screenWidth: 1920
};

function refreshCarouselLayoutMetrics() {
  const carouselSection = carouselContainer || (typeof document !== 'undefined' ? document.getElementById('ps5-tiles-carousel') : null);
  let paddingLeft = 74;
  let paddingTop = 14;
  let carouselTop = carouselSection?.offsetTop || 104;
  try {
    if (typeof window !== 'undefined' && window.getComputedStyle && carouselSection) {
      const cs = window.getComputedStyle(carouselSection);
      paddingLeft = parseInt(cs.paddingLeft, 10) || 74;
      paddingTop = parseInt(cs.paddingTop, 10) || 14;
      carouselTop = parseInt(cs.top, 10) || carouselTop;
    }
  } catch {}
  carouselLayoutMetrics = {
    paddingLeft,
    paddingTop,
    carouselTop,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1920
  };
}

function updateActiveTile(oldIdx, newIdx) {
  const activeTile = tileElements[activeIndex];
  const settledLeft = getSettledTileOffsetLeft(activeTile);

  // Authentic PS5 Track Offset using settled post-transition geometry:
  // When activeIndex is 0 or 1, keep Store visible at left (offset 0).
  const offset = (activeTile && activeIndex > 1) ? Math.max(0, settledLeft - 120) : 0;

  if (oldIdx !== undefined && tileElements[oldIdx]) {
    tileElements[oldIdx].classList.remove('active');
  }
  if (newIdx !== undefined && tileElements[newIdx]) {
    tileElements[newIdx].classList.add('active');
  } else if (activeTile) {
    activeTile.classList.add('active');
  }

  if (trackElement) {
    trackElement.style.transform = `translate3d(-${offset}px, 0, 0)`;
  }

  // Position active title banner cleanly OUTSIDE the active card's white border/glow ring (154px + 6px ring)
  // and cleanly BELOW the 106px adjacent tiles so text/store pills never overlap any card.
  const activeBanner = document.getElementById('ps5-active-title-banner');
  if (activeBanner && activeTile) {
    const { paddingLeft, paddingTop, carouselTop, screenWidth } = carouselLayoutMetrics;
    const settledActiveWidth = 154;
    const settledActiveHeight = 154;
    const activeViewportLeft = paddingLeft + (settledLeft - offset);

    // Clear 154px tile + 3px outer box-shadow ring + 17px air gap = +174px from tile left
    const bannerLeft = activeViewportLeft + settledActiveWidth + 20;
    const bannerTop = carouselTop + paddingTop + 120;

    if (bannerLeft + 260 > screenWidth) {
      const fallbackLeft = Math.max(paddingLeft, activeViewportLeft);
      activeBanner.style.left = `${fallbackLeft}px`;
      activeBanner.style.top = `${carouselTop + paddingTop + settledActiveHeight + 18}px`;
      activeBanner.style.maxWidth = `${Math.max(200, screenWidth - fallbackLeft - 36)}px`;
    } else {
      const clampedLeft = Math.max(paddingLeft, bannerLeft);
      activeBanner.style.left = `${clampedLeft}px`;
      activeBanner.style.top = `${bannerTop}px`;
      activeBanner.style.maxWidth = `${Math.max(200, screenWidth - clampedLeft - 36)}px`;
    }
  }
}

/* --------------------------------------------------------------------------
   Vertical Navigation: Game Hub (Activities & News)
   -------------------------------------------------------------------------- */
export function enterGameHub() {
  const item = getCurrentItem();
  if (item?.isLibrary || item?.isAddApp || isGameHubActive) return;
  const cards = document.querySelectorAll('.ps5-activity-card');
  if (!cards.length) return; // Do not enter if game has no activity cards

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
  window.scrollTo(0, 0);
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
  const row = document.getElementById('ps5-activities-row');
  cards.forEach((card, idx) => {
    if (idx === activeActivityIndex) {
      card.classList.add('card-focused');
      if (row && typeof row.scrollTo === 'function') {
        const cardLeft = card.offsetLeft - row.offsetLeft;
        row.scrollTo({ left: Math.max(0, cardLeft - 32), behavior: 'smooth' });
      }
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
  } else if (type === 'downloading') {
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2.5');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.innerHTML = `
      <path class="ps5-anim-dl-arrow" d="M12 3v11m0 0l-5-5m5 5l5-5"/>
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
    `;
  } else if (type === 'paused') {
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'currentColor');
    icon.removeAttribute('stroke');
    icon.removeAttribute('stroke-width');
    icon.removeAttribute('stroke-linecap');
    icon.removeAttribute('stroke-linejoin');
    icon.innerHTML = `
      <rect x="6" y="4" width="4" height="16" rx="1.5"/>
      <rect x="14" y="4" width="4" height="16" rx="1.5"/>
    `;
  } else if (type === 'updating') {
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2.4');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.innerHTML = `
      <path d="M21.5 2v6h-6"/>
      <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
    `;
  } else {
    // Authentic PS5: Clean Play Game text button with no triangle icon
    icon.style.display = 'none';
    return;
  }
  icon.style.display = 'block';
}

let lastDisplayedItemId = null;
let lastDisplayedHeroUrl = null;
let lastDisplayedLogoUrl = null;
let lastAmbienceItemId = null;
let currentHeroRequestId = 0;
let lastPillClickTime = 0;
let heroDebounceTimer = null;

async function toggleSteamDownload(item, shouldPause) {
  if (!item?.appId || downloadActionPending) return;
  downloadActionPending = true;
  const action = shouldPause ? 'pause' : 'resume';
  const statusEl = playBtn?.querySelector('.ps5-dl-pill-status');
  const prevStatusText = statusEl ? statusEl.textContent : '';
  if (statusEl) statusEl.textContent = shouldPause ? 'Pausing...' : 'Resuming...';
  if (playBtn) playBtn.setAttribute('aria-busy', 'true');

  try {
    const result = shouldPause
      ? await pauseSteamDownload(item.appId)
      : await resumeSteamDownload(item.appId);
    if (result?.success) {
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: shouldPause ? `⏸ Download Paused: ${item.title}` : `📥 Download Resumed: ${item.title}`,
          subtitle: `Steam confirmed download is ${shouldPause ? 'paused' : 'resumed'}.`
        }
      }));
    } else {
      // Revert UI status immediately since Steam did not accept the command
      const dlState = getSteamDownload(item.appId);
      if (dlState) {
        renderDownloadPill(dlState, item);
      } else if (statusEl && prevStatusText) {
        statusEl.textContent = prevStatusText;
      }
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: `Could not ${action} download`,
          subtitle: result?.error || `Steam did not accept the ${action} command.`
        }
      }));
    }
  } catch (error) {
    console.error(`[Steam Download] ${action} failed`, error);
    const dlState = getSteamDownload(item.appId);
    if (dlState) {
      renderDownloadPill(dlState, item);
    } else if (statusEl && prevStatusText) {
      statusEl.textContent = prevStatusText;
    }
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: `Could not ${action} download`,
        subtitle: error?.message || `Steam did not accept the ${action} command.`
      }
    }));
  } finally {
    downloadActionPending = false;
    if (playBtn) playBtn.removeAttribute('aria-busy');
    const groupChanged = getDownloadGroupSignature() !== currentDownloadGroupSignature;
    if (deferredDownloadGroupRefresh || groupChanged) {
      deferredDownloadGroupRefresh = false;
      loadTabItems();
    }
    updateLiveDownloadUI();
  }
}

function renderDownloadPill(dlState, item) {
  if (!playBtn) return;
  const isPaused = dlState.status === 'Paused';
  const isUpdating = dlState.status === 'Updating';
  const isSyncing = dlState.syncStatus === 'syncing';
  const dlPct = getDownloadPercent(dlState);
  const instPct = getInstallPercent(dlState);
  const pctText = dlPct !== null ? `${dlPct}%` : '';
  const statusText = isSyncing ? 'Syncing with Steam...' : (isPaused ? 'Paused' : (isUpdating ? 'Updating...' : 'Downloading...'));
  const fillClass = isPaused ? 'paused' : (isUpdating ? 'updating' : '');

  const dlBytesStr = (dlState.bytesDownloaded > 0 || dlState.bytesTotal > 0)
    ? `${formatBytes(dlState.bytesDownloaded)} / ${formatBytes(dlState.bytesTotal)}`
    : '';
  const installStr = instPct !== null ? ` • Installing: ${instPct}%` : '';
  const rateStr = dlState.downloadRateMbps ? ` • ${dlState.downloadRateMbps.toFixed(1)} Mbps` : '';

  currentBtnLabelText = null;
  currentBtnIconType = null;
  playBtn.className = `ps5-play-btn ps5-btn-download-pill ${isPaused ? 'ps5-pill-paused' : ''}`;
  playBtn.disabled = isSyncing;
  playBtn.style.removeProperty('--download-progress');
  playBtn.title = isSyncing
    ? 'Waiting for Steam to confirm the download state.'
    : isPaused
    ? `Paused: ${dlBytesStr}${installStr} (Click or Press Enter to Resume)`
    : `${statusText}: ${dlBytesStr}${pctText ? ` (${pctText})` : ''}${installStr}${rateStr} (Click to pause)`;

  playBtn.innerHTML = `
    <div class="ps5-dl-pill-inner">
      <div class="ps5-dl-pill-row">
        <span class="ps5-dl-pill-status">${statusText}</span>
        ${pctText ? `<span class="ps5-dl-pill-percent">${pctText}</span>` : ''}
      </div>
      <div class="ps5-dl-pill-bar-track">
        <div class="ps5-dl-pill-bar-fill ${fillClass}" style="width: ${dlPct !== null ? dlPct : 0}%;"></div>
      </div>
    </div>
  `;

  playBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloadActionPending) return;
    const now = Date.now();
    if (now - lastPillClickTime < 800) return;
    lastPillClickTime = now;
    try { ps5Audio.play?.('select'); } catch (err) {}
    toggleSteamDownload(item, !isPaused);
  };
}

let currentBtnLabelText = null;
let currentBtnIconType = null;
let btnTransitionTimer = null;

function restoreStandardPlayBtn(item, labelText, iconType, tooltip, isWide = false) {
  if (!playBtn) return;
  playBtn.onclick = null;
  playBtn.disabled = false;
  playBtn.className = `ps5-play-btn ${isWide ? 'ps5-btn-wide' : ''}`;
  playBtn.style.removeProperty('--download-progress');
  playBtn.title = tooltip;

  let contentWrap = playBtn.querySelector('.ps5-play-btn-content');
  if (!contentWrap) {
    playBtn.innerHTML = `
      <span class="ps5-play-btn-content" id="ps5-play-btn-content">
        <svg id="ps5-play-btn-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span class="ps5-play-btn-text" id="ps5-play-btn-text">${labelText}</span>
      </span>
    `;
    contentWrap = playBtn.querySelector('.ps5-play-btn-content');
    playBtnLabel = contentWrap.querySelector('.ps5-play-btn-text');
    playBtnIcon = document.getElementById('ps5-play-btn-icon');
    updatePlayButtonIcon(iconType);
    currentBtnLabelText = labelText;
    currentBtnIconType = iconType;
    return;
  }

  playBtnLabel = contentWrap.querySelector('.ps5-play-btn-text');
  playBtnIcon = document.getElementById('ps5-play-btn-icon');

  // If label and icon already match, skip any DOM updates or animations
  if (currentBtnLabelText === labelText && currentBtnIconType === iconType) {
    return;
  }

  // Smooth authentic PS5 crossfade transition
  if (btnTransitionTimer) {
    clearTimeout(btnTransitionTimer);
    btnTransitionTimer = null;
  }

  contentWrap.classList.add('ps5-btn-crossfade');
  btnTransitionTimer = setTimeout(() => {
    if (playBtnLabel) playBtnLabel.textContent = labelText;
    updatePlayButtonIcon(iconType);
    currentBtnLabelText = labelText;
    currentBtnIconType = iconType;
    contentWrap.classList.remove('ps5-btn-crossfade');
    btnTransitionTimer = null;
  }, 60);
}

function formatDownloadMetaHtml(item, dlState) {
  const platformPill = 'PS5';
  const isSyncing = dlState.syncStatus === 'syncing';
  const statusColor = isSyncing ? '#cbd5e1' : (dlState.status === 'Paused' ? '#f59e0b' : '#38bdf8');
  const dlPct = getDownloadPercent(dlState);
  const instPct = getInstallPercent(dlState);
  const dlPctText = dlPct !== null ? `${dlPct}%` : '';
  const dlBytesText = (dlState.bytesDownloaded > 0 || dlState.bytesTotal > 0)
    ? `${formatBytes(dlState.bytesDownloaded)} of ${formatBytes(dlState.bytesTotal)}`
    : '';
  const installText = instPct !== null ? `Installing ${instPct}%` : '';
  const speedText = dlState.downloadRateMbps ? `${dlState.downloadRateMbps.toFixed(1)} Mbps` : '';
  const visibleStatus = isSyncing ? 'Syncing with Steam' : dlState.status;

  return `
    <div class="ps5-meta-item">
      <span class="ps5-meta-platform-pill">${platformPill}</span>
      <span class="ps5-meta-dl-status ${isSyncing ? 'syncing' : dlState.status.toLowerCase()}">${visibleStatus}</span>
      ${dlPctText ? `<span style="color: ${statusColor}; font-weight: 700;">${dlPctText}</span>` : ''}
      ${dlBytesText ? `<span>• Downloaded ${dlBytesText}</span>` : ''}
      ${installText ? `<span style="color: #4ade80; font-weight: 600;">• ${installText}</span>` : ''}
      ${speedText ? `<span style="color: var(--ps-white-60);">• ${speedText}</span>` : ''}
    </div>
    <div class="ps5-meta-item" style="color: var(--ps-white-60);">
      <span>${item.storageType || 'Laptop SSD'} • Steam Managed</span>
    </div>
  `;
}

function updateHeroTitleBadgeRow(item, dlState) {
  if (heroSubtitleName) heroSubtitleName.textContent = item?.title || '';
  if (heroDlIndicator) {
    if (dlState) {
      const dlPct = getDownloadPercent(dlState);
      heroDlIndicator.style.display = 'inline-flex';
      heroDlIndicator.title = `${dlState.status} via Steam${dlPct !== null ? ` (${dlPct}%)` : ''}`;
      const svg = heroDlIndicator.querySelector('.ps5-dl-cloud-svg');
      if (svg) {
        svg.classList.toggle('animating', dlState.status === 'Downloading');
      }
    } else {
      heroDlIndicator.style.display = 'none';
    }
  }
}

function applyLogoOpticalDimensions(logoEl, img) {
  if (!logoEl) return;
  return normalizeGameLogo(logoEl, img);
}

function applyHeroWallpaper(item) {
  if (!bgLayerA || !bgLayerB || !item) return;
  if (!currentActiveBgLayer) {
    currentActiveBgLayer = bgLayerA;
  }

  const fallbackHero = '/assets/games/explore/hero.svg';
  const resolvedHero = resolveAssetUrl(item.heroBg, item.appId, 'hero');
  const resolvedTileFallback = item.tileIcon ? resolveAssetUrl(item.tileIcon, item.appId, 'tile') : '';
  const targetHero = resolvedHero || resolvedTileFallback || fallbackHero;

  // If the active layer already displays this exact target background, skip redundant transition
  if (currentActiveBgLayer.dataset.bgUrl === targetHero) {
    return;
  }

  const hubMeta = getGameHubMetadata(item);
  let bgPos = item.heroBgPos || hubMeta?.heroBgPos;
  if (!bgPos) {
    if (item.appId === '2358720' || item.id === 'pc_steam_2358720' || (item.title && item.title.toLowerCase().includes('wukong'))) {
      bgPos = 'right center';
    } else {
      bgPos = 'center center';
    }
  }
  const bgSize = item.heroBgSize || 'cover';
  const bgTransform = item.heroBgZoom && item.heroBgZoom !== 1 ? `scale(${item.heroBgZoom})` : 'none';
  const bgOrigin = item.heroBgOrigin || bgPos;

  const commitCrossfade = (finalUrl) => {
    if (!bgLayerA || !bgLayerB) return;
    if (!currentActiveBgLayer) currentActiveBgLayer = bgLayerA;
    if (currentActiveBgLayer.dataset.bgUrl === finalUrl) return;

    const incoming = currentActiveBgLayer === bgLayerA ? bgLayerB : bgLayerA;
    const outgoing = currentActiveBgLayer;

    incoming.style.backgroundImage = `url('${finalUrl}')`;
    incoming.style.backgroundPosition = bgPos;
    incoming.style.backgroundSize = bgSize;
    incoming.style.transform = bgTransform;
    incoming.style.transformOrigin = bgOrigin;
    incoming.style.zIndex = '2';
    outgoing.style.zIndex = '1';
    incoming.dataset.bgUrl = finalUrl;

    incoming.classList.remove('fade-out');
    outgoing.classList.add('fade-out');

    currentActiveBgLayer = incoming;
    lastDisplayedHeroUrl = finalUrl;
  };

  if (loadedHeroUrls.has(targetHero) || targetHero === fallbackHero || targetHero.startsWith('data:')) {
    loadedHeroUrls.add(targetHero);
    commitCrossfade(targetHero);
    return;
  }

  const mySeq = ++heroLoadSeq;
  const img = new Image();
  img.onload = () => {
    loadedHeroUrls.add(targetHero);
    if (mySeq === heroLoadSeq) {
      commitCrossfade(targetHero);
    }
  };
  img.onerror = () => {
    if (mySeq !== heroLoadSeq) return;
    if (resolvedTileFallback && resolvedTileFallback !== targetHero) {
      const tileImg = new Image();
      tileImg.onload = () => {
        loadedHeroUrls.add(resolvedTileFallback);
        if (mySeq === heroLoadSeq) commitCrossfade(resolvedTileFallback);
      };
      tileImg.onerror = () => {
        if (mySeq === heroLoadSeq) commitCrossfade(fallbackHero);
      };
      tileImg.src = resolvedTileFallback;
    } else {
      commitCrossfade(fallbackHero);
    }
  };
  img.src = targetHero;
}

/* --------------------------------------------------------------------------
   Hero Details & Activity Cards Display
   -------------------------------------------------------------------------- */
function updateHeroDisplay(immediate = false) {
  const item = getCurrentItem();
  if (!item) return;

  const thisRequestId = ++currentHeroRequestId;
  lastDisplayedItemId = item.id;

  // 1. Immediate light updates: Studio text, fallback title, subtitle, action button, active banner
  if (heroStudio) heroStudio.textContent = item.studio || '';

  const resolvedLogo = resolveAssetUrl(item.logoImg, item.appId, 'logo');
  if (heroLogo && heroTitle) {
    heroTitle.textContent = item.title;
    if (!resolvedLogo) {
      lastDisplayedLogoUrl = null;
      heroLogo.style.display = 'none';
      heroTitle.style.display = 'block';
    } else if (lastDisplayedLogoUrl !== resolvedLogo) {
      // Immediately clear previous game's logo while gliding; load new logo in settled pass
      heroLogo.style.display = 'none';
      heroTitle.style.display = 'block';
    }
  } else if (heroTitle) {
    heroTitle.textContent = item.title;
  }

  // 2. Play / Action Button Label & Dynamic Icon (Authentic PS5 Pill for Downloads)
  const dlState = item?.appId ? getSteamDownload(item.appId) : null;
  updateHeroTitleBadgeRow(item, dlState);

  if (dlState) {
    renderDownloadPill(dlState, item);
  } else if (item.isExplore) {
    restoreStandardPlayBtn(item, "Explore What's New", 'explore', "Explore PlayStation 5 News & Highlights (Press Enter / ✕)", true);
  } else if (item.isStore) {
    restoreStandardPlayBtn(item, "Explore PlayStation Store", 'store', "Explore PlayStation Store (Press Enter / ✕)", true);
  } else if (item.isLibrary) {
    restoreStandardPlayBtn(item, "Open Game Library", 'library', "Open Game Library (Press Enter / ✕)", true);
  } else if (currentTab === 'media' || item.genre?.includes('Streaming') || item.genre?.includes('Music') || item.id === 'youtube' || item.id === 'youtube-music' || item.id === 'spotify' || item.id === 'netflix' || item.id === 'discord' || item.id === 'twitch' || item.id === 'appletv' || item.id === 'crunchyroll') {
    if (item.installed) {
      restoreStandardPlayBtn(item, "Start", 'play', `Start ${item.title} (Press Enter / ✕)`, false);
    } else {
      restoreStandardPlayBtn(item, "Install", 'download', `Install ${item.title} (${item.installSize || '2.1 GB'}) (Press Enter / ✕)`, false);
    }
  } else if (item.installed) {
    restoreStandardPlayBtn(item, "Play Game", 'play', "Launch Game (Press Enter / ✕)", false);
  } else {
    const storeLabel = item.storeName || (item.store === 'riot' ? 'Riot Games' : item.store === 'epic' ? 'Epic Games' : item.store === 'xbox' ? 'Xbox' : 'Steam');
    restoreStandardPlayBtn(item, "Install", 'download', `Install ${item.title} via ${storeLabel} (Press Enter / ✕)`, false);
  }

  // 3. Subtitle & Active Banner (Lightweight text writes)
  const hubMeta = getGameHubMetadata(item);
  if (heroSubtitle) {
    if (item.isExplore) {
      heroSubtitle.textContent = "Discover What's New on PlayStation 5";
      heroSubtitle.style.display = 'block';
    } else if (item.isStore) {
      heroSubtitle.textContent = "Explore Latest Releases & Deals";
      heroSubtitle.style.display = 'block';
    } else if (item.isLibrary) {
      heroSubtitle.textContent = currentTab === 'games' ? "Your PlayStation Games Collection" : "Your Media & Streaming Apps";
      heroSubtitle.style.display = 'block';
    } else {
      const subtitleText = item.subtitle || hubMeta?.subtitle || item.tagline || item.genre || 'Confront Destiny';
      heroSubtitle.textContent = subtitleText;
      heroSubtitle.style.display = 'block';
    }
  }

  const activeTitleBanner = document.getElementById('ps5-active-title-banner');
  const activeSourceBadge = document.getElementById('ps5-active-source-badge');
  const activeGameName = document.getElementById('ps5-active-game-name');
  if (activeTitleBanner && activeGameName) {
    if (item.isStore || item.isLibrary || item.isExplore) {
      if (activeSourceBadge) activeSourceBadge.style.display = 'none';
      activeGameName.textContent = item.isStore ? 'PlayStation Store' : (item.isExplore ? 'Explore' : (currentTab === 'games' ? 'Game Library' : 'App Library'));
    } else {
      if (activeSourceBadge) {
        activeSourceBadge.style.display = 'inline-flex';
        const storeKey = getItemStore(item);
        const srcText = storeKey === 'xbox' ? 'XBOX' : storeKey === 'epic' ? 'EPIC' : storeKey === 'riot' ? 'RIOT' : (item.platform === 'EA' ? 'EA' : 'STEAM');
        activeSourceBadge.textContent = srcText;
      }
      activeGameName.textContent = item.title;
    }
  }

  // 4. Heavy Visuals & Audio Motif (Wallpaper Decode/Crossfade, Logo Image, Widgets, Promo Card, Activities)
  // Debounced during rapid carousel gliding so holding keys stays locked at 120 FPS with zero 4K decode churn
  const commitLogoSwap = () => {
    if (!heroLogo || !heroTitle || !resolvedLogo) return;
    if (lastDisplayedLogoUrl === resolvedLogo) return;
    lastDisplayedLogoUrl = resolvedLogo;
    const currentItemId = item.id;
    const testImg = new Image();
    testImg.decoding = 'async';
    testImg.src = resolvedLogo;

    testImg.onload = () => {
      if (getCurrentItem()?.id === currentItemId) {
        heroLogo.src = resolvedLogo;
        heroLogo.alt = item.title;
        applyLogoOpticalDimensions(heroLogo, testImg);
        heroLogo.style.display = 'block';
        heroTitle.style.display = 'none';
      }
    };

    testImg.onerror = () => {
      if (item.logoImg && item.logoImg.endsWith('.svg')) {
        const fallback = item.logoImg.replace('.svg', '.png');
        const fallbackImg = new Image();
        fallbackImg.decoding = 'async';
        fallbackImg.src = fallback;
        fallbackImg.onload = () => {
          if (getCurrentItem()?.id === currentItemId) {
            heroLogo.src = fallback;
            heroLogo.alt = item.title;
            applyLogoOpticalDimensions(heroLogo, fallbackImg);
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
      heroLogo.src = resolvedLogo;
      heroLogo.alt = item.title;
      applyLogoOpticalDimensions(heroLogo, testImg);
      heroLogo.style.display = 'block';
      heroTitle.style.display = 'none';
    }
  };

  const commitSecondaryWidgets = () => {
    const trophiesCard = document.getElementById('ps5-widget-trophies');
    if (heroTrophiesRow && trophiesCard) {
      if (item.isExplore || item.isStore || item.isLibrary) {
        trophiesCard.style.display = 'none';
      } else {
        trophiesCard.style.display = 'flex';
        const tr = item.trophies || hubMeta?.trophies || { platinum: 0, gold: 0, silver: 1, bronze: 11 };
        heroTrophiesRow.innerHTML = `
          <div class="ps5-trophy-item">
            <span class="ps5-trophy-icon platinum" title="Platinum Trophies">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 4h-2V2H7v2H5c-1.1 0-2 .9-2 2v2c0 2.5 1.9 4.6 4.3 4.9C8.3 14.5 10 16 12 16.3v2.7H9v2h6v-2h-3v-2.7c2-.3 3.7-1.8 4.7-3.4 2.4-.3 4.3-2.4 4.3-4.9V6c0-1.1-.9-2-2-2zm-14 4V6h2v4.6C5.8 10.3 5 9.2 5 8zm14 0c0 1.2-.8 2.3-2 2.6V6h2v2z"/></svg>
            </span>
            <span class="ps5-trophy-count" id="trophy-count-plat">${tr.platinum ?? 0}</span>
          </div>
          <div class="ps5-trophy-item">
            <span class="ps5-trophy-icon gold" title="Gold Trophies">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 4h-2V2H7v2H5c-1.1 0-2 .9-2 2v2c0 2.5 1.9 4.6 4.3 4.9C8.3 14.5 10 16 12 16.3v2.7H9v2h6v-2h-3v-2.7c2-.3 3.7-1.8 4.7-3.4 2.4-.3 4.3-2.4 4.3-4.9V6c0-1.1-.9-2-2-2zm-14 4V6h2v4.6C5.8 10.3 5 9.2 5 8zm14 0c0 1.2-.8 2.3-2 2.6V6h2v2z"/></svg>
            </span>
            <span class="ps5-trophy-count" id="trophy-count-gold">${tr.gold ?? 0}</span>
          </div>
          <div class="ps5-trophy-item">
            <span class="ps5-trophy-icon silver" title="Silver Trophies">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 4h-2V2H7v2H5c-1.1 0-2 .9-2 2v2c0 2.5 1.9 4.6 4.3 4.9C8.3 14.5 10 16 12 16.3v2.7H9v2h6v-2h-3v-2.7c2-.3 3.7-1.8 4.7-3.4 2.4-.3 4.3-2.4 4.3-4.9V6c0-1.1-.9-2-2-2zm-14 4V6h2v4.6C5.8 10.3 5 9.2 5 8zm14 0c0 1.2-.8 2.3-2 2.6V6h2v2z"/></svg>
            </span>
            <span class="ps5-trophy-count" id="trophy-count-silver">${tr.silver ?? 1}</span>
          </div>
          <div class="ps5-trophy-item">
            <span class="ps5-trophy-icon bronze" title="Bronze Trophies">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 4h-2V2H7v2H5c-1.1 0-2 .9-2 2v2c0 2.5 1.9 4.6 4.3 4.9C8.3 14.5 10 16 12 16.3v2.7H9v2h6v-2h-3v-2.7c2-.3 3.7-1.8 4.7-3.4 2.4-.3 4.3-2.4 4.3-4.9V6c0-1.1-.9-2-2-2zm-14 4V6h2v4.6C5.8 10.3 5 9.2 5 8zm14 0c0 1.2-.8 2.3-2 2.6V6h2v2z"/></svg>
            </span>
            <span class="ps5-trophy-count" id="trophy-count-bronze">${tr.bronze ?? 11}</span>
          </div>
        `;
      }
    }

    const friendsCard = document.getElementById('ps5-widget-friends');
    if (heroFriendsRow && friendsCard) {
      if (item.isExplore || item.isStore || item.isLibrary) {
        friendsCard.style.display = 'none';
      } else {
        friendsCard.style.display = 'flex';
        const friendsList = item.friendsWhoPlay || hubMeta?.friendsWhoPlay || [
          { name: "Alex", avatar: "A", color: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
          { name: "Chen", avatar: "C", color: "linear-gradient(135deg, #10b981, #047857)" },
          { name: "David", avatar: "D", color: "linear-gradient(135deg, #f59e0b, #b45309)" },
          { name: "Elena", avatar: "E", color: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }
        ];
        heroFriendsRow.innerHTML = friendsList.slice(0, 4).map(f => `
          <span class="ps5-friend-avatar-disc" style="background: ${f.color || '#3b82f6'};" title="${escapeHtml(f.name || 'Friend')}">${escapeHtml(f.avatar || (f.name ? f.name.charAt(0) : 'P'))}</span>
        `).join('');
      }
    }

    if (heroPromoCard) {
      if (item.isExplore || item.isStore || item.isLibrary) {
        heroPromoCard.style.display = 'none';
      } else {
        heroPromoCard.style.display = 'block';
        const promo = item.promoCard || hubMeta?.promoCard || {
          title: (item.title || 'GAME SPECIAL').toUpperCase(),
          image: resolveAssetUrl(item.heroBg, item.appId, 'hero') || '/assets/games/wukong/steam_library_hero.jpg',
          discount: '-20%',
          price: '$47.99',
          origPrice: '$59.99'
        };

        if (heroPromoImg) {
          const promoImgSrc = resolveAssetUrl(promo.image, item.appId, 'hero') || promo.image;
          heroPromoImg.src = promoImgSrc;
          heroPromoImg.alt = promo.title || item.title;
        }
        if (heroPromoTitle) {
          heroPromoTitle.textContent = promo.title || (item.title ? item.title.toUpperCase() : '');
        }
        if (heroPromoDiscount) {
          heroPromoDiscount.textContent = promo.discount || '-20%';
          heroPromoDiscount.style.display = promo.discount ? 'inline-block' : 'none';
        }
        if (heroPromoPrice) {
          heroPromoPrice.textContent = promo.price || '$47.99';
        }
        if (heroPromoOrigPrice) {
          heroPromoOrigPrice.textContent = promo.origPrice || '';
          heroPromoOrigPrice.style.display = promo.origPrice ? 'inline-block' : 'none';
        }
      }
    }

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
      } else if (dlState) {
        heroMeta.innerHTML = formatDownloadMetaHtml(item, dlState);
      } else {
        const platformPill = currentTab === 'media' ? (item.badge || 'App') : getGamePlatformBadge(item);
        heroMeta.innerHTML = `
          <div class="ps5-meta-item">
            <span class="ps5-meta-platform-pill">${platformPill}</span>
            <span style="color: ${item.installed ? '#10b981' : '#60a5fa'}; font-weight: 700;">● ${item.installed ? 'Installed' : 'Owned'}</span>
            <span>• ${item.installSize || (item.installed ? 'Console Storage' : 'Ready to Download')}</span>
          </div>
          ${item.playTime ? `
            <div class="ps5-meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9"/>
                <polyline points="12 7 12 12 15 14"/>
              </svg>
              <span>${item.playTime}</span>
            </div>
          ` : ''}
          ${item.trophies ? `
            <div class="ps5-meta-item" style="color: var(--ps-platinum);">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M19 4h-2V2H7v2H5c-1.1 0-2 .9-2 2v2c0 2.5 1.9 4.6 4.3 4.9C8.3 14.5 10 16 12 16.3v2.7H9v2h6v-2h-3v-2.7c2-.3 3.7-1.8 4.7-3.4 2.4-.3 4.3-2.4 4.3-4.9V6c0-1.1-.9-2-2-2zm-14 4V6h2v4.6C5.8 10.3 5 9.2 5 8zm14 0c0 1.2-.8 2.3-2 2.6V6h2v2z"/>
              </svg>
              <span>${item.trophies.progress}% Trophies</span>
            </div>
          ` : ''}
          ${item.friends ? `
            <div class="ps5-meta-item" style="color: var(--ps-white-60);">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span>${item.friends}</span>
            </div>
          ` : ''}
        `;
      }
    }

    const statSourcePill = document.getElementById('ps5-stat-source-pill');
    const statSourceText = document.getElementById('ps5-stat-source-text');
    const statPlaytimePill = document.getElementById('ps5-stat-playtime-pill');
    const statPlaytimeText = document.getElementById('ps5-stat-playtime-text');
    if (statSourcePill && statSourceText) {
      if (item.isStore || item.isLibrary || item.isExplore) {
        statSourcePill.style.display = 'none';
        if (statPlaytimePill) statPlaytimePill.style.display = 'none';
      } else {
        statSourcePill.style.display = 'inline-flex';
        const storeKey = getItemStore(item);
        const src = storeKey === 'xbox' ? 'XBOX' : storeKey === 'epic' ? 'EPIC' : storeKey === 'riot' ? 'RIOT' : 'STEAM';
        statSourceText.textContent = src;
        if (statPlaytimePill && statPlaytimeText) {
          if (item.installed && (item.playTime || item.playtime)) {
            statPlaytimePill.style.display = 'inline-flex';
            statPlaytimeText.textContent = item.playTime || item.playtime;
          } else if (!item.installed && item.installSize) {
            statPlaytimePill.style.display = 'inline-flex';
            statPlaytimeText.textContent = item.installSize;
          } else {
            statPlaytimePill.style.display = 'none';
          }
        }
      }
    }
  };

  const runHeavyUpdates = () => {
    if (thisRequestId !== currentHeroRequestId) return;
    const cur = getCurrentItem();
    if (!cur || cur.id !== item.id) return;

    applyHeroWallpaper(item);
    commitLogoSwap();
    commitSecondaryWidgets();

    // Trigger dynamic game theme ambience motif ONLY when settled on the game
    if (lastAmbienceItemId !== item.id) {
      try {
        ps5Audio.playGameAmbience(item.id);
      } catch (e) {}
      lastAmbienceItemId = item.id;
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
    } else if (item.isExplore) {
      root.style.setProperty('--ps-particle-tint', 'rgba(245, 158, 11, 0.4)');
      root.style.setProperty('--ps-theme-tint', 'rgba(245, 158, 11, 0.1)');
    } else if (item.isStore) {
      root.style.setProperty('--ps-particle-tint', 'rgba(56, 189, 248, 0.4)');
      root.style.setProperty('--ps-theme-tint', 'rgba(0, 112, 209, 0.12)');
    } else {
      // Pure natural ambient lighting — zero artificial blue haze over the game art
      root.style.setProperty('--ps-particle-tint', 'rgba(255, 255, 255, 0.22)');
      root.style.setProperty('--ps-theme-tint', 'transparent');
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
        const isDownloadingAct = Boolean(dlState);
        const helpBadge = (i === 0 && item.installed && !isDownloadingAct) ? `<span class="activity-help-tag">💡 PS5 In-Game Help Available</span>` : '';
        const instPct = getInstallPercent(dlState);
        const dlPct = getDownloadPercent(dlState);
        const progressLabel = isDownloadingAct
          ? (instPct !== null ? `Installing Files • ${instPct}%` : (dlPct !== null ? `Downloading Data • ${dlPct}%` : 'Steam Download in Progress'))
          : (act.progress ? `${act.progress}% • Main Story Progress` : 'Activities Ready');
        const resumeBadge = isDownloadingAct ? 'Steam ✕' : (!item.installed ? 'Download ✕' : 'Resume ✕');
        const actTime = isDownloadingAct ? (instPct !== null ? `${instPct}%` : (dlPct !== null ? `${dlPct}%` : dlState.status)) : (act.timeEst || 'Ready');
        const barWidth = isDownloadingAct ? (instPct !== null ? instPct : (dlPct !== null ? dlPct : 0)) : (act.progress || 100);
        return `
          <div class="ps5-activity-card" onclick="window.dispatchEvent(new CustomEvent('ps5-request-launch'))" style="cursor: pointer;">
            <div class="activity-top">
              <span class="activity-tag">${act.tag}</span>
              <span class="activity-time">${actTime}</span>
            </div>
            ${helpBadge}
            <h3 class="activity-title">${act.title}</h3>
            <div class="activity-bar-wrap">
              <div class="activity-bar-fill" style="width: ${barWidth}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <span class="activity-progress">${progressLabel}</span>
              <span class="activity-resume-badge">${resumeBadge}</span>
            </div>
          </div>
        `;
      }).join('');
    } else {
      heroActivities.innerHTML = '';
    }
  }
};

  if (immediate) {
    if (heroDebounceTimer) {
      clearTimeout(heroDebounceTimer);
      heroDebounceTimer = null;
    }
    runHeavyUpdates();
  } else {
    if (heroDebounceTimer) clearTimeout(heroDebounceTimer);
    heroDebounceTimer = setTimeout(runHeavyUpdates, 55);
  }
}

function updateDownloadMetaAndButtons(item, dlState) {
  if (!item) return;

  if (dlState) {
    renderDownloadPill(dlState, item);
    updateHeroTitleBadgeRow(item, dlState);

    if (heroMeta) {
      heroMeta.innerHTML = formatDownloadMetaHtml(item, dlState);
    }

    if (heroActivities) {
      const instPct = getInstallPercent(dlState);
      const dlPct = getDownloadPercent(dlState);
      const targetPct = instPct !== null ? instPct : (dlPct !== null ? dlPct : 0);
      const actFill = heroActivities.querySelector('.activity-bar-fill');
      if (actFill) actFill.style.width = `${targetPct}%`;
      const actProg = heroActivities.querySelector('.activity-progress');
      if (actProg) {
        actProg.textContent = instPct !== null
          ? `Installing Files • ${instPct}%`
          : (dlPct !== null ? `Downloading Data • ${dlPct}%` : 'Steam Download in Progress');
      }
      const actTime = heroActivities.querySelector('.activity-time');
      if (actTime) {
        actTime.textContent = instPct !== null
          ? `${instPct}%`
          : (dlPct !== null ? `${dlPct}%` : dlState.status);
      }
    }
  } else if (playBtn?.classList.contains('ps5-btn-download-pill')) {
    updateHeroTitleBadgeRow(item, null);
    updateHeroDisplay(true);
  }
}

function updateLiveDownloadUI() {
  const current = getCurrentItem();
  if (current) {
    const dlState = current.appId ? getSteamDownload(current.appId) : null;
    if (!downloadActionPending) {
      updateDownloadMetaAndButtons(current, dlState);
    }
  }

  if (tileElements && tileElements.length > 0) {
    for (let i = 0; i < tileElements.length; i++) {
      const tile = tileElements[i];
      const item = homeItems[i];
      if (!item || !item.appId) continue;
      const dl = getSteamDownload(item.appId);
      const dlBar = tile.querySelector('.ps5-tile-dl-bar');
      const dlFill = tile.querySelector('.ps5-tile-dl-fill');
      const badgeText = tile.querySelector('.ps5-badge-text');
      const cloudWrap = tile.querySelector('.ps5-tile-cloud-wrap');
      const dlIcon = tile.querySelector('.ps5-badge-dl-icon');
      const platformBadge = tile.querySelector('.ps5-tile-platform-badge');

      if (dl) {
        const dlPct = getDownloadPercent(dl);
        tile.classList.add('tile-downloading');
        tile.classList.toggle('tile-paused', dl.status === 'Paused');
        if (!platformBadge) {
          const inner = tile.querySelector('.ps5-tile-inner');
          if (inner) {
            const badge = document.createElement('div');
            badge.className = 'ps5-tile-platform-badge dl-badge';
            badge.innerHTML = `
              <span class="ps5-tile-cloud-wrap">
                <svg class="ps5-dl-cloud-svg ${dl.status === 'Downloading' ? 'animating' : ''}" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
              </span>
              <span class="ps5-badge-text ps5-badge-dl-text">${dlPct !== null ? `${dlPct}%` : dl.status}</span>
            `;
            inner.appendChild(badge);
          }
        } else {
          platformBadge.classList.add('dl-badge');
          if (cloudWrap) {
            cloudWrap.style.display = '';
            const svg = cloudWrap.querySelector('.ps5-dl-cloud-svg');
            if (svg) svg.classList.toggle('animating', dl.status === 'Downloading');
          }
          if (dlIcon) dlIcon.style.display = 'none';
          if (badgeText) {
            badgeText.textContent = dlPct !== null ? `${dlPct}%` : dl.status;
            badgeText.classList.add('ps5-badge-dl-text');
          }
        }
        if (dlFill) {
          dlFill.className = `ps5-tile-dl-fill ${dl.status.toLowerCase()}`;
          dlFill.style.width = `${dlPct !== null ? dlPct : 0}%`;
        } else {
          const bar = document.createElement('div');
          bar.className = 'ps5-tile-dl-bar';
          bar.innerHTML = `<div class="ps5-tile-dl-fill ${dl.status.toLowerCase()}" style="width: ${dlPct !== null ? dlPct : 0}%"></div>`;
          tile.querySelector('.ps5-tile-inner')?.appendChild(bar);
        }
      } else if (tile.classList.contains('tile-downloading')) {
        tile.classList.remove('tile-downloading', 'tile-paused');
        platformBadge?.remove();
        dlBar?.remove();
      }
    }
  }
}

export function getCurrentTab() {
  return currentTab;
}

export function switchTab(tab) {
  exitGameHub();
  window.scrollTo(0, 0);
  if (currentTab === tab) return;
  ps5Audio.playSelectChime();
  currentTab = tab;
  activeIndex = 0;
  if (currentActiveBgLayer) currentActiveBgLayer.dataset.bgUrl = '';
  lastDisplayedItemId = null;
  lastDisplayedHeroUrl = null;
  lastDisplayedLogoUrl = null;
  lastRenderedOrderKey = '';
  lastRenderedVisualKey = '';

  document.querySelectorAll('.ps5-tab').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  document.body.classList.toggle('tab-media-active', tab === 'media');

  loadTabItems();
}

/* ==========================================================================
   PS5 Game Library Modal (Installed & Cloud Collection with PC Game Sync)
   ========================================================================== */
let isSyncing = false;
let syncQueued = false;
let queuedSyncSilent = true;
let queuedSyncPayload = null;

function getItemStore(item) {
  if (!item) return 'steam';
  if (item.store) return item.store.toLowerCase();
  if (item.id === 'pc_valorant' || item.appId === 'valorant' || item.title?.toLowerCase() === 'valorant') return 'riot';
  if (item.id?.startsWith('epic_') || item.launchUri?.includes('epicgames') || item.storageType?.includes('Epic')) return 'epic';
  if (item.id?.startsWith('xbox_') || item.launchUri?.includes('xbox') || item.storageType?.includes('Xbox')) return 'xbox';
  if (item.isExplore || item.isStore || item.id?.startsWith('ps-')) return 'playstation';
  return 'steam';
}

export function getGamePlatformBadge(item) {
  if (!item) return 'PC';
  if (item.badge && item.badge !== 'PS5' && item.badge !== 'Owned' && item.badge !== 'Installed') {
    return item.badge;
  }
  if (item.isStore || item.isExplore || item.isLibrary) return 'PS5';

  const store = getItemStore(item);
  switch (store) {
    case 'xbox': return 'XBOX';
    case 'epic': return 'EPIC';
    case 'riot': return 'RIOT';
    case 'ea': return 'EA';
    case 'ubisoft': return 'UBI';
    case 'gog': return 'GOG';
    case 'playstation': return 'PS5';
    case 'steam':
    default:
      if (item.appId) return 'STEAM';
      if (item.execPath) return 'PC';
      return 'STEAM';
  }
}

function getStoreBadgeMeta(storeKey) {
  switch (storeKey) {
    case 'epic':
      return { badgeClass: 'badge-store-epic', label: 'Epic Games', icon: '⚡' };
    case 'xbox':
      return { badgeClass: 'badge-store-xbox', label: 'Xbox', icon: '🟢' };
    case 'riot':
      return { badgeClass: 'badge-store-riot', label: 'Riot Games', icon: '🔴' };
    case 'playstation':
      return { badgeClass: 'badge-store-ps', label: 'PlayStation', icon: '🔷' };
    case 'steam':
    default:
      return { badgeClass: 'badge-store-steam', label: 'Steam', icon: '🎮' };
  }
}

export async function syncPCGames(silent = false, preloadedPayload = null) {
  if (isSyncing) {
    syncQueued = true;
    if (!silent) queuedSyncSilent = false;
    if (preloadedPayload) queuedSyncPayload = preloadedPayload;
    return null;
  }
  isSyncing = true;
  const syncBtn = document.getElementById('btn-sync-pc-games');
  if (syncBtn && !silent) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<span>Syncing All Stores (Steam, Epic, Xbox)...</span>`;
  }

  let res = null;
  try {
    res = await performMultiStoreSync(silent, preloadedPayload);

    if (syncBtn && !silent) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        <span>Sync All Stores (Steam, Epic, Xbox)</span>
      `;
    }

    if (libraryModalOpen) {
      renderLibraryContent();
    }
    loadTabItems();
    return res;
  } finally {
    isSyncing = false;
    if (syncQueued) {
      const nextSilent = queuedSyncSilent;
      const nextPayload = queuedSyncPayload;
      syncQueued = false;
      queuedSyncSilent = true;
      queuedSyncPayload = null;
      await syncPCGames(nextSilent, nextPayload);
    }
  }
}

function initLibraryModal() {
  window.ps5OpenLibrary = openLibraryModal;
  window.ps5CloseLibrary = closeLibraryModal;
  window.ps5OpenStore = () => openOverlay('ps5-store-modal');
  window.ps5SyncPCGames = (silent = false, payload = null) => syncPCGames(silent, payload);

  const modal = document.getElementById('ps5-library-modal');
  if (!modal) return;

  document.getElementById('library-btn-close')?.addEventListener('click', closeLibraryModal);
  document.getElementById('btn-sync-pc-games')?.addEventListener('click', () => syncPCGames(false));
  const openStoreDiagnostics = () => {
    closeLibraryModal();
    if (window.ps5OpenStoreDiagnostics) {
      window.ps5OpenStoreDiagnostics();
    } else if (window.ps5OpenSteamDiagnostics) {
      window.ps5OpenSteamDiagnostics();
    }
  };
  document.getElementById('btn-store-diagnostics')?.addEventListener('click', openStoreDiagnostics);
  document.getElementById('btn-steam-diagnostics')?.addEventListener('click', openStoreDiagnostics);
  document.getElementById('lib-tab-all')?.addEventListener('click', () => switchLibraryTab('all'));
  document.getElementById('lib-tab-installed')?.addEventListener('click', () => switchLibraryTab('installed'));
  document.getElementById('lib-tab-steam')?.addEventListener('click', () => switchLibraryTab('steam'));
  document.getElementById('lib-tab-epic')?.addEventListener('click', () => switchLibraryTab('epic'));
  document.getElementById('lib-tab-xbox')?.addEventListener('click', () => switchLibraryTab('xbox'));
  document.getElementById('lib-tab-riot')?.addEventListener('click', () => switchLibraryTab('riot'));
  document.getElementById('lib-tab-collection')?.addEventListener('click', () => switchLibraryTab('collection'));
}

export function openLibraryModal(tab = 'all') {
  const modal = document.getElementById('ps5-library-modal');
  if (!modal) return;

  libraryModalOpen = true;
  ps5Audio.playSelectChime();
  modal.classList.add('active');
  switchLibraryTab(tab);

  setTimeout(() => {
    document.getElementById(`lib-tab-${tab}`)?.focus();
  }, 50);
}

export function closeLibraryModal() {
  const modal = document.getElementById('ps5-library-modal');
  if (!modal) return;

  libraryModalOpen = false;
  ps5Audio.playBackCancel();
  modal.classList.remove('active');

  setTimeout(() => {
    tileElements[activeIndex]?.focus({ preventScroll: true });
  }, 50);
}

export function isLibraryOpen() {
  if (libraryModalOpen && typeof document !== 'undefined') {
    const modal = document.getElementById('ps5-library-modal');
    if (modal && !modal.classList.contains('active')) {
      libraryModalOpen = false;
    }
  }
  return libraryModalOpen;
}

export function switchLibraryTab(tab) {
  libraryActiveTab = tab;
  document.querySelectorAll('.lib-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`lib-tab-${tab}`)?.classList.add('active');
  renderLibraryContent();
}

export function getLibraryActiveTab() {
  return libraryActiveTab;
}

function renderLibraryContent() {
  const grid = document.getElementById('library-games-grid');
  if (!grid) return;

  const isGames = currentTab === 'games';
  const rawList = (isGames ? PS5_GAMES : PS5_MEDIA_APPS).filter(item => !item.isStore && !item.isExplore && !item.isLibrary);
  const allList = isGames ? deduplicateGameList(rawList) : rawList;
  let filtered = allList;

  if (libraryActiveTab === 'installed') {
    filtered = allList.filter(item => item.installed === true);
  } else if (libraryActiveTab === 'collection') {
    filtered = allList.filter(item => item.installed === false);
  } else if (libraryActiveTab === 'steam') {
    filtered = allList.filter(item => getItemStore(item) === 'steam');
  } else if (libraryActiveTab === 'epic') {
    filtered = allList.filter(item => getItemStore(item) === 'epic');
  } else if (libraryActiveTab === 'xbox') {
    filtered = allList.filter(item => getItemStore(item) === 'xbox');
  } else if (libraryActiveTab === 'riot') {
    filtered = allList.filter(item => getItemStore(item) === 'riot');
  } else {
    filtered = allList;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--ps-white-60);">
        <h3>No games found in this store section</h3>
        <p style="margin-top: 8px; font-size: 0.9rem;">Click "Sync All Stores" above to search your system for installed & owned titles.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((item, idx) => {
    const storeKey = getItemStore(item);
    const storeMeta = getStoreBadgeMeta(storeKey);
    return `
    <div class="lib-card ${item.installed ? 'installed' : 'uninstalled'}" tabindex="0" role="button" data-index="${idx}" data-game-id="${item.id}">
      <div class="lib-card-thumb">
        ${item.tileIcon ? `
          <img class="lib-card-img" src="${item.tileIcon}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
        ` : ''}
        <div class="lib-card-fallback" style="${item.tileIcon ? 'display: none;' : 'display: flex;'}">
          <span>${escapeHtml(item.title)}</span>
        </div>
        <span class="lib-store-badge ${storeMeta.badgeClass}">
          <span>${storeMeta.icon}</span>
          <span>${storeMeta.label}</span>
        </span>
        <span class="lib-badge ${item.installed ? 'badge-green' : 'badge-owned'}">
          ${item.installed ? 'Installed' : 'Owned'}
        </span>
      </div>
      <div class="lib-card-info">
        <h4 class="lib-card-title">${escapeHtml(item.title)}</h4>
        <div class="lib-card-meta">${item.installSize || (item.installed ? 'PC Install' : `${storeMeta.label} Collection`)} • ${item.storageType || 'Laptop Storage'}</div>
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
  `;
  }).join('');
}

window.ps5LaunchFromLib = (id) => {
  const item = PS5_GAMES.find(g => g.id === id) || PS5_MEDIA_APPS.find(m => m.id === id);
  if (item) {
    if (item.isExplore || item.isStore || item.isLibrary) return;
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
  const item = PS5_GAMES.find(g => g.id === id) || PS5_MEDIA_APPS.find(m => m.id === id);
  if (item && (item.isExplore || item.isStore || item.isLibrary)) return;

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
  if (!item) return;

  const storeKey = getItemStore(item);

  if (storeKey === 'epic') {
    if (item.launchUri) {
      try { window.location.href = item.launchUri; } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: `⚡ Epic Games: ${item.title}`,
        subtitle: "Opening Epic Games Launcher to install game."
      }
    }));
  } else if (storeKey === 'xbox') {
    if (item.launchUri) {
      try { window.location.href = item.launchUri; } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: `🟢 Xbox Game Pass: ${item.title}`,
        subtitle: "Opening Xbox app on Windows to install title."
      }
    }));
  } else if (storeKey === 'riot') {
    if (item.launchUri || item.execPath) {
      launchPCApp(item);
    }
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: `🔴 Riot Games: ${item.title}`,
        subtitle: "Opening Riot Client installer."
      }
    }));
  } else {
    // Steam
    if (item.appId) {
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
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Opening Launcher...</span>`;
    ps5Audio.playSelectChime();

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = `<span>Install</span>`;
    }, 1500);
  }
};

export { PS5GameCard };
export { PS5LogoEngine, normalizeGameLogo };

