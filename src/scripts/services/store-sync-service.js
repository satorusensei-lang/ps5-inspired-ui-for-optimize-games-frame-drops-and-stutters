/* ==========================================================================
   Multi-Store Synchronization Service
   Seamlessly discovers, catalogs, and syncs games from:
   - Steam (Manifests, Libraryfolders, Stplug-in, Cloud Collection)
   - Epic Games Store (Manifests, Launcher Apps, Cloud Collection)
   - Xbox / PC Game Pass (C:\XboxGames, Microsoft Store Gaming Packages)
   - Riot Games (VALORANT, League of Legends)
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { syncPCInstalledGames, areGamesEquivalent } from '../data/ps5-games-data.js';
import { EPIC_GAMES_CATALOG, XBOX_GAME_PASS_CATALOG } from '../data/store-catalogs-data.js';
import { autoDownloadMissingGameArtworks } from './artwork-service.js';

export { EPIC_GAMES_CATALOG, XBOX_GAME_PASS_CATALOG };

export async function fetchAllStoresPayload(preloadedPayload = null) {
  if (preloadedPayload && Array.isArray(preloadedPayload.games)) {
    return {
      games: preloadedPayload.games,
      steamFavorites: Array.isArray(preloadedPayload.steamFavorites) ? preloadedPayload.steamFavorites.map(String) : null,
      steamSynced: Boolean(preloadedPayload.steamSynced ?? preloadedPayload.steamFavorites)
    };
  }

  // 1. Native Electron IPC Scan (Direct Windows OS access)
  if (typeof window !== 'undefined' && window.electronAPI?.syncAllStores) {
    try {
      const res = await window.electronAPI.syncAllStores();
      if (res && res.success && Array.isArray(res.games)) {
        return {
          games: res.games,
          steamFavorites: Array.isArray(res.steamFavorites) ? res.steamFavorites.map(String) : null,
          steamSynced: Boolean(res.steamSynced ?? res.steamFavorites)
        };
      }
    } catch (e) {
      console.warn('[Store Sync] Electron IPC scan error:', e);
    }
  }

  // 2. HTTP Vite OS Middleware Scan
  try {
    const res = await fetch('/api/pc/sync-all-stores');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.games)) {
        return {
          games: data.games,
          steamFavorites: Array.isArray(data.steamFavorites) ? data.steamFavorites.map(String) : null,
          steamSynced: Boolean(data.steamSynced ?? data.steamFavorites)
        };
      }
    }
  } catch (e) {
    // Fallback to basic scan endpoint
    try {
      const basicRes = await fetch('/api/pc/scan');
      if (basicRes.ok) {
        const basicData = await basicRes.json();
        if (basicData?.games) {
          return {
            games: basicData.games,
            steamFavorites: Array.isArray(basicData.steamFavorites) ? basicData.steamFavorites.map(String) : null,
            steamSynced: Boolean(basicData.steamSynced ?? basicData.steamFavorites)
          };
        }
      }
    } catch (err) {}
  }

  return { games: [], steamFavorites: null, steamSynced: false };
}

export async function fetchAllStoresScan() {
  const payload = await fetchAllStoresPayload();
  return payload.games;
}

export async function performMultiStoreSync(silent = false, preloadedPayload = null) {
  try {
    const payload = await fetchAllStoresPayload(preloadedPayload);
    const scannedGames = payload.games || [];

    // Use real host-detected games + live Steam Favorites + Xbox App/Game Pass library
    // Enrich host-detected Epic titles from EPIC_GAMES_CATALOG without injecting unowned Epic games (e.g. GTA Online)
    const catalogEnrichment = [...EPIC_GAMES_CATALOG, ...XBOX_GAME_PASS_CATALOG];
    const allCandidates = scannedGames.map(item => {
      if (!item || item.store === 'steam') return item;
      const meta = catalogEnrichment.find(c => areGamesEquivalent(c, item));
      if (!meta) return item;
      return {
        ...meta,
        ...item,
        logoImg: item.logoImg || meta.logoImg,
        tileIcon: item.tileIcon || meta.tileIcon,
        heroBg: item.heroBg || meta.heroBg,
        trophies: item.trophies || meta.trophies,
        activities: item.activities || meta.activities
      };
    });

    // Enrich already-discovered Xbox games with curated artwork/metadata without injecting unowned Xbox Game Pass titles
    allCandidates.forEach((candidate, idx) => {
      if (candidate?.store !== 'xbox') return;
      const curatedMatch = XBOX_GAME_PASS_CATALOG.find(xboxItem => areGamesEquivalent(candidate, xboxItem));
      if (curatedMatch) {
        allCandidates[idx] = {
          ...curatedMatch,
          ...candidate,
          title: candidate.title || curatedMatch.title,
          studio: candidate.studio && !candidate.studio.includes('Installed on PC') ? candidate.studio : curatedMatch.studio,
          genre: candidate.genre && !candidate.genre.includes('Installed on PC') ? candidate.genre : curatedMatch.genre,
          tileIcon: candidate.tileIcon || curatedMatch.tileIcon,
          heroBg: candidate.heroBg || curatedMatch.heroBg,
          logoImg: candidate.logoImg || curatedMatch.logoImg
        };
      }
    });

    // Sync into the active PS5 games collection (passing authoritative Steam Favorites metadata)
    const changed = syncPCInstalledGames(allCandidates, {
      authoritativeSteamSync: Boolean(payload.steamSynced),
      steamFavorites: payload.steamFavorites
    });

    // Automatically check for any games without artwork and fetch official cards & backgrounds in background
    autoDownloadMissingGameArtworks(allCandidates).catch(e => console.warn('[Store Sync] Artwork auto-fetch warning:', e));

    // Compute store breakdown statistics
    const stats = {
      steam: 0,
      epic: 0,
      xbox: 0,
      riot: 0,
      total: allCandidates.length
    };

    allCandidates.forEach(g => {
      const st = (g.store || '').toLowerCase();
      if (st === 'steam' || g.appId || g.launchUri?.includes('steam://')) stats.steam++;
      else if (st === 'epic' || g.launchUri?.includes('epicgames')) stats.epic++;
      else if (st === 'xbox' || g.storageType?.includes('Xbox') || g.launchUri?.includes('xbox')) stats.xbox++;
      else if (st === 'riot' || g.id === 'pc_valorant' || g.title?.toLowerCase() === 'valorant') stats.riot++;
    });

    if (!silent) {
      try { ps5Audio.playBootChord(); } catch (e) {}

      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: "🌐 Game Stores Synchronized",
          subtitle: `Synced ${stats.total} titles • Steam: ${stats.steam} | Epic: ${stats.epic} | Xbox: ${stats.xbox} | Riot: ${stats.riot}`
        }
      }));
    }

    return {
      success: true,
      count: allCandidates.length,
      changed: Boolean(changed),
      steamFavorites: payload.steamFavorites || [],
      stats
    };
  } catch (err) {
    console.error('[Store Sync] Failed multi-store sync:', err);
    return { success: false, error: err.message };
  }
}
