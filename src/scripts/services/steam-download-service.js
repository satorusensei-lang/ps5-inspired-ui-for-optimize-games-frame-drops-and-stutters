/* ==========================================================================
   Steam Live Download & Install Progress Service
   Provides real-time local Steam download tracking across MYRAA
   ========================================================================== */

import { getPS5Games, setGameInstalled, deduplicateGameList, areGamesEquivalent, STEAM_FAVORITE_APPIDS, isSteamFavoritesAuthoritative } from '../data/ps5-games-data.js';

let downloadsMap = {};
let previousDownloadsMap = {};
let pollIntervalTimer = null;
let isInitialized = false;
const missingDownloadSince = new Map();
const MISSING_DOWNLOAD_GRACE_MS = 4000;
let lastAppliedSnapshotTimestamp = 0;

export function isSteamSnapshotNewer(snapshotTimestamp, lastAppliedTimestamp) {
  return !Number.isFinite(snapshotTimestamp) || snapshotTimestamp > lastAppliedTimestamp;
}

export async function fetchSteamDownloads() {
  const hasLocalViteApi = typeof window !== 'undefined'
    && window.location?.protocol === 'http:'
    && ['localhost', '127.0.0.1'].includes(window.location.hostname);

  // In desktop development, Vite's structured Steam endpoint is the live source.
  // Prefer it over the Electron fallback so the renderer receives the same fresh
  // snapshot that the endpoint exposes, rather than a stale main-process snapshot.
  if (hasLocalViteApi) {
    try {
      const res = await fetch('/api/steam/downloads', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.downloads) return data.downloads;
      }
    } catch (e) {}
  }

  // 1. Electron IPC (desktop mode)
  if (typeof window !== 'undefined' && window.electronAPI?.getSteamDownloads) {
    try {
      const res = await window.electronAPI.getSteamDownloads();
      if (res && res.success && res.downloads) {
        return res.downloads;
      }
    } catch (e) {
      console.warn('[Steam Downloads] IPC fetch failed:', e);
    }
  }

  // 2. Vite Dev Server API fallback (browser dev mode)
  try {
    const res = await fetch('/api/steam/downloads');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.downloads) {
        return data.downloads;
      }
    }
  } catch (e) {}

  return {};
}

export function normalizePercent(val) {
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 100) {
    return Math.round(val);
  }
  return null;
}

export function normalizeDownloadState(item) {
  if (!item || typeof item !== 'object') return null;

  const rawDlPct = normalizePercent(item.downloadPercent);
  const rawInstPct = normalizePercent(item.installPercent);
  const rawBytesDownloaded = item.bytesDownloaded;
  const rawBytesTotal = item.bytesTotal;
  const hasByteFields = rawBytesDownloaded !== null && rawBytesDownloaded !== undefined
    || rawBytesTotal !== null && rawBytesTotal !== undefined;
  const hasValidBytePair = Number.isFinite(rawBytesDownloaded)
    && Number.isFinite(rawBytesTotal)
    && rawBytesDownloaded >= 0
    && rawBytesTotal > 0
    && rawBytesDownloaded <= rawBytesTotal;
  const bytesDownloaded = hasValidBytePair ? rawBytesDownloaded : null;
  const bytesTotal = hasValidBytePair ? rawBytesTotal : null;
  const resolvedDownloadPercent = hasValidBytePair
    ? normalizePercent((bytesDownloaded / bytesTotal) * 100)
    : (hasByteFields ? null : rawDlPct);

  return {
    ...item,
    appId: String(item.appId || item.appid || ''),
    downloadPercent: resolvedDownloadPercent,
    installPercent: rawInstPct,
    percent: resolvedDownloadPercent,
    bytesDownloaded,
    bytesTotal,
    downloadRateMbps: typeof item.downloadRateMbps === 'number' && Number.isFinite(item.downloadRateMbps) ? Math.max(0, item.downloadRateMbps) : 0,
    diskRateMbps: typeof item.diskRateMbps === 'number' && Number.isFinite(item.diskRateMbps) ? Math.max(0, item.diskRateMbps) : 0
  };
}

// Steam can briefly omit an app from its overview while it moves between
// Downloading and Paused. Keep its last confirmed progress for a short grace
// period so one incomplete snapshot cannot replace the UI with a Download
// button. A later confirmed snapshot always wins; stable absence eventually
// clears the retained entry.
export function retainTransientlyMissingDownloads(previous, incoming, missingSince, now = Date.now(), graceMs = MISSING_DOWNLOAD_GRACE_MS) {
  const merged = { ...incoming };

  for (const [appId, previousState] of Object.entries(previous || {})) {
    if (!previousState || merged[appId]) {
      if (merged[appId]) missingSince.delete(appId);
      continue;
    }

    if (!['Downloading', 'Updating', 'Paused'].includes(previousState.status) || previousState.isFullyInstalled) {
      missingSince.delete(appId);
      continue;
    }

    if (!missingSince.has(appId)) missingSince.set(appId, now);
    if (now - missingSince.get(appId) <= graceMs) {
      merged[appId] = {
        ...previousState,
        syncStatus: 'syncing',
        downloadRateMbps: 0,
        diskRateMbps: 0
      };
    }
  }

  return merged;
}

const completedNotifiedSet = new Set();

function handleDownloadsUpdate(newDownloads) {
  if (!newDownloads || typeof newDownloads !== 'object') return;

  const snapshotTimestamp = Number(newDownloads.__snapshotTimestamp);
  if (!isSteamSnapshotNewer(snapshotTimestamp, lastAppliedSnapshotTimestamp)) {
    console.warn('[Steam Downloads] Ignored an out-of-order snapshot.', {
      snapshotTimestamp,
      lastAppliedSnapshotTimestamp
    });
    return;
  }
  if (Number.isFinite(snapshotTimestamp)) lastAppliedSnapshotTimestamp = snapshotTimestamp;

  const normalized = {};
  for (const [key, item] of Object.entries(newDownloads)) {
    if (key === '__snapshotTimestamp') continue;
    if (item) {
      const state = normalizeDownloadState(item);
      if (state) normalized[key] = state;
    }
  }

  previousDownloadsMap = { ...downloadsMap };
  downloadsMap = retainTransientlyMissingDownloads(
    previousDownloadsMap,
    normalized,
    missingDownloadSince
  );

  // Detect completion events for any game that was downloading/updating
  for (const [appId, prevItem] of Object.entries(previousDownloadsMap)) {
    if (prevItem && (prevItem.status === 'Downloading' || prevItem.status === 'Updating')) {
      const current = downloadsMap[appId];
      const isNowComplete = current && current.status === 'Complete';
      const isRemovedWithInstall = !current && prevItem.isFullyInstalled;

      if (isNowComplete || isRemovedWithInstall) {
        onDownloadCompleted(appId, prevItem.name);
      }
    }
  }

  // Clear completed flag and dynamically ingest newly downloading games into library
  const games = getPS5Games();
  let gamesListModified = false;

  for (const [appId, currItem] of Object.entries(downloadsMap)) {
    if (currItem && (currItem.status === 'Downloading' || currItem.status === 'Updating' || currItem.status === 'Paused')) {
      completedNotifiedSet.delete(String(appId));
      let game = games.find(g => areGamesEquivalent(g, { appId: String(appId), id: `pc_steam_${appId}`, store: 'steam' }));
      if (!game) {
        // Strictly sync only favorited Steam apps so non-favorite background updates (e.g. Minecraft Dungeons) do not pollute the launcher
        const favSynced = typeof isSteamFavoritesAuthoritative === 'function' ? isSteamFavoritesAuthoritative() : false;
        if ((favSynced || STEAM_FAVORITE_APPIDS.size > 0) && !STEAM_FAVORITE_APPIDS.has(String(appId))) {
          continue;
        }
        // Auto-ingest new favorited game downloading on Steam so it immediately shows on the PS5 dashboard!
        const totalSize = formatBytes(currItem.bytesTotal) || 'Steam Download';
        const cleanName = currItem.name && !currItem.name.startsWith('Steam App') ? currItem.name : `Steam App ${appId}`;
        const newGame = {
          id: `pc_steam_${appId}`,
          appId: String(appId),
          store: 'steam',
          storeName: 'Steam',
          title: cleanName,
          studio: 'Steam Library • Active Download',
          genre: 'Action • Steam Download',
          badge: currItem.status,
          installed: false,
          isDownloading: true,
          status: currItem.status,
          installSize: totalSize,
          storageType: 'Steam Library (Downloading)',
          liveStatus: `${currItem.status} on Steam • ${currItem.percent || 0}%`,
          launchUri: `steam://rungameid/${appId}`,
          tileIcon: `/api/pc/asset?appId=${appId}&type=tile`,
          heroBg: `/api/pc/asset?appId=${appId}&type=hero`,
          logoImg: `/api/pc/asset?appId=${appId}&type=logo`
        };
        games.push(newGame);
        gamesListModified = true;

        // Auto download official 4K cards and backgrounds in background
        import('./artwork-service.js').then(({ autoDownloadMissingGameArtworks }) => {
          autoDownloadMissingGameArtworks([newGame]);
        }).catch(() => {});
      } else {
        if (!game.installed) {
          game.badge = currItem.status;
          game.isDownloading = true;
          game.status = currItem.status;
        }
      }
    }
  }

  if (gamesListModified) {
    try {
      const raw = localStorage.getItem('ps5_synced_pc_games');
      const list = raw ? JSON.parse(raw) : [];
      for (const g of games) {
        if (!list.some(it => areGamesEquivalent(it, g))) {
          list.push({ ...g });
        }
      }
      localStorage.setItem('ps5_synced_pc_games', JSON.stringify(deduplicateGameList(list)));
    } catch (e) {}
  }

  // Dispatch live update event for UI subscribers
  window.dispatchEvent(new CustomEvent('ps5-steam-download-update', {
    detail: {
      downloads: downloadsMap,
      previous: previousDownloadsMap
    }
  }));
}

function onDownloadCompleted(appId, gameName) {
  const aidStr = String(appId);
  if (completedNotifiedSet.has(aidStr)) return;
  completedNotifiedSet.add(aidStr);

  const games = getPS5Games();
  const game = games.find(g => String(g.appId) === aidStr || g.id === `pc_steam_${aidStr}`);
  const title = game?.title || gameName || 'Game';

  if (game) {
    setGameInstalled(game.id, true);
  }

  window.dispatchEvent(new CustomEvent('ps5-show-notification', {
    detail: {
      title: '📥 Ready to Play',
      subtitle: `${title} has finished downloading and is ready to launch.`
    }
  }));

  window.dispatchEvent(new CustomEvent('ps5-game-download-completed', {
    detail: { appId, title, game }
  }));
}

export function initSteamDownloadService() {
  if (isInitialized) return;
  isInitialized = true;

  // 1. If in Electron, listen to pushed updates from the main process
  const hasDesktopPush = typeof window !== 'undefined' && typeof window.electronAPI?.onSteamDownloadsUpdate === 'function';
  if (hasDesktopPush) {
    window.electronAPI.onSteamDownloadsUpdate((downloads) => {
      handleDownloadsUpdate(downloads);
    });
  }

  const hasLocalViteApi = typeof window !== 'undefined'
    && window.location?.protocol === 'http:'
    && ['localhost', '127.0.0.1'].includes(window.location.hostname);

  // Packaged Electron uses the main-process push loop. In browser mode and
  // Electron development mode, use one sequential renderer poller instead.
  if (hasDesktopPush && !hasLocalViteApi) {
    fetchSteamDownloads().then(handleDownloadsUpdate);
    return;
  }

  let pollInFlight = false;
  let immediatePollRequested = false;

  const runPoll = async () => {
    if (document.hidden || document.body.classList.contains('game-boost-idle')) {
      pollIntervalTimer = setTimeout(runPoll, 2000);
      return;
    }
    if (pollInFlight) {
      immediatePollRequested = true;
      return;
    }
    pollInFlight = true;
    let downloads = {};
    try {
      downloads = await fetchSteamDownloads();
      handleDownloadsUpdate(downloads);
    } catch (e) {}
    pollInFlight = false;

    const hasActiveOrPaused = Object.values(downloadsMap).some(
      d => d && (d.status === 'Downloading' || d.status === 'Updating' || d.status === 'Paused')
    );
    const delay = immediatePollRequested ? 0 : (hasActiveOrPaused ? 250 : 5000);
    immediatePollRequested = false;
    pollIntervalTimer = setTimeout(runPoll, delay);
  };

  const refreshImmediately = () => {
    if (document.hidden || document.body.classList.contains('game-boost-idle')) return;
    if (pollIntervalTimer) clearTimeout(pollIntervalTimer);
    if (pollInFlight) {
      immediatePollRequested = true;
      return;
    }
    pollIntervalTimer = setTimeout(runPoll, 0);
  };

  runPoll();

  const onBoostStateChanged = (e) => {
    if (!e?.detail?.active && !document.hidden) {
      refreshImmediately();
    }
  };

  // Background timer throttling or a delayed window restore must not leave the
  // dashboard on a stale Steam snapshot. Refresh as soon as it becomes visible.
  window.addEventListener('focus', refreshImmediately);
  window.addEventListener('ps5-boost-state-changed', onBoostStateChanged);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshImmediately();
  });

  // Clean up timer on window unload
  window.addEventListener('beforeunload', () => {
    if (pollIntervalTimer) clearTimeout(pollIntervalTimer);
    window.removeEventListener('focus', refreshImmediately);
    window.removeEventListener('ps5-boost-state-changed', onBoostStateChanged);
  });
}

export async function resumeSteamDownload(appId) {
  if (!appId) return { success: false, error: 'No AppID specified.' };
  const aidStr = String(appId).trim();
  if (!/^\d+$/.test(aidStr)) return { success: false, error: 'Invalid Steam AppID.' };

  // 1. Electron IPC handler (desktop mode)
  if (typeof window !== 'undefined' && window.electronAPI?.resumeSteamDownload) {
    try {
      const res = await window.electronAPI.resumeSteamDownload(aidStr);
      if (res?.success) {
        const fresh = await fetchSteamDownloads();
        handleDownloadsUpdate(fresh);
        return { success: true };
      }
      return { success: false, error: res?.error || 'Steam did not accept the resume command.' };
    } catch (e) {
      return { success: false, error: e?.message || 'Failed to communicate with Steam desktop process.' };
    }
  }

  // 2. Server endpoint (browser dev mode)
  if (typeof window === 'undefined' || !window.electronAPI) {
    try {
      const res = await fetch(`/api/steam/resume?appId=${encodeURIComponent(aidStr)}`);
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        const fresh = await fetchSteamDownloads();
        handleDownloadsUpdate(fresh);
        return { success: true };
      }
      return { success: false, error: data?.error || 'Steam did not accept the resume command.' };
    } catch (e) {
      return { success: false, error: e?.message || 'Failed to communicate with Steam API endpoint.' };
    }
  }

  return { success: false, error: 'Steam download control is not available.' };
}

export async function pauseSteamDownload(appId) {
  if (!appId) return { success: false, error: 'No AppID specified.' };
  const aidStr = String(appId).trim();
  if (!/^\d+$/.test(aidStr)) return { success: false, error: 'Invalid Steam AppID.' };

  // 1. Electron IPC handler (desktop mode)
  if (typeof window !== 'undefined' && window.electronAPI?.pauseSteamDownload) {
    try {
      const res = await window.electronAPI.pauseSteamDownload(aidStr);
      if (res?.success) {
        const fresh = await fetchSteamDownloads();
        handleDownloadsUpdate(fresh);
        return { success: true };
      }
      return { success: false, error: res?.error || 'Steam did not accept the pause command.' };
    } catch (e) {
      return { success: false, error: e?.message || 'Failed to communicate with Steam desktop process.' };
    }
  }

  // 2. Server endpoint fallback (browser dev mode)
  try {
    const res = await fetch(`/api/steam/pause?appId=${encodeURIComponent(aidStr)}`);
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      const fresh = await fetchSteamDownloads();
      handleDownloadsUpdate(fresh);
      return { success: true };
    }
    return { success: false, error: data?.error || 'Steam did not accept the pause command.' };
  } catch (e) {
    return { success: false, error: e?.message || 'Failed to communicate with Steam API endpoint.' };
  }
}

export function getSteamDownload(appId) {
  if (!appId) return null;
  const entry = downloadsMap[String(appId)];
  if (!entry) return null;
  // Only return entries that are in active downloading, updating, or paused state
  if (entry.status === 'Downloading' || entry.status === 'Updating' || entry.status === 'Paused') {
    return normalizeDownloadState(entry);
  }
  return null;
}

export function getAllSteamDownloads() {
  return downloadsMap;
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 3 ? 1 : 0)} ${units[i]}`;
}
