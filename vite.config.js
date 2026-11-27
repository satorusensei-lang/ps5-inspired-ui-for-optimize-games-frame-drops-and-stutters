import { defineConfig } from 'vite';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';

const requireVite = createRequire(import.meta.url);
const { readXboxAccountGames, stripXboxPlatformSuffix, mergeXboxMetadataIntoRecord } = requireVite('./electron/xbox-sync.cjs');
const { createGameBoostManager } = requireVite('./electron/game-boost.cjs');
const gameBoostVite = createGameBoostManager(() => path.join(os.tmpdir(), 'myra_vite_boost'));
gameBoostVite.warmupSystemProfile?.().catch(() => {});

function findBestExe(dirPath, dirName = '') {
  try {
    if (!fs.existsSync(dirPath)) return '';
    const files = fs.readdirSync(dirPath);
    const exes = files.filter(f => f.toLowerCase().endsWith('.exe'));
    const filtered = exes.filter(f => {
      const l = f.toLowerCase();
      return !l.includes('crash') && !l.includes('report') && !l.includes('install') && !l.includes('setup') && !l.includes('crs-');
    });
    if (filtered.length > 0) {
      const cleanDir = dirName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const directMatch = filtered.find(f => cleanDir && f.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(cleanDir));
      if (directMatch) return path.join(dirPath, directMatch);
      const launcher = filtered.find(f => f.toLowerCase().includes('launcher'));
      if (launcher) return path.join(dirPath, launcher);
      return path.join(dirPath, filtered[0]);
    }

    // Check 1 level of subdirectories (like bin/ or Binaries/)
    for (const f of files) {
      const sub = path.join(dirPath, f);
      try {
        if (fs.statSync(sub).isDirectory() && !f.startsWith('.')) {
          const subFiles = fs.readdirSync(sub);
          const subExes = subFiles.filter(sf => sf.toLowerCase().endsWith('.exe')).filter(sf => {
            const l = sf.toLowerCase();
            return !l.includes('crash') && !l.includes('report') && !l.includes('install') && !l.includes('setup') && !l.includes('crs-');
          });
          if (subExes.length > 0) return path.join(sub, subExes[0]);
        }
      } catch (e) {}
    }
  } catch (e) {}
  return '';
}

const KNOWN_STEAM_APPIDS = {
  'ghost of tsushima director\'s cut': '2215430',
  'ghost of tsushima': '2215430',
  'tekken 7': '389730',
  'tekken7': '389730',
  'tekken 8': '1778820',
  'tekken8': '1778820',
  'where winds meet': '3564740',
  'forzahorizon6': '2483190',
  'forza horizon 6': '2483190',
  'forza horizon': '2483190',
  'wallpaper_engine': '431960',
  'wallpaper engine': '431960',
  'blackmythwukong': '2358720',
  'black myth: wukong': '2358720',
  'black myth wukong': '2358720',
  'counter-strike global offensive': '730',
  'counter-strike 2': '730',
  'cs:go': '730',
  'ride 5': '1650010',
  'ride5': '1650010',
  'cyberpunk 2077': '1091500',
  'elden ring': '1245620',
  'god of war ragnarök': '2322010',
  'god of war ragnarok': '2322010',
  'god of war': '1593500',
  'marvel\'s spider-man remastered': '1817070',
  'marvel\'s spider-man miles morales': '1817190',
  'marvel\'s spider-man 2': '2651280',
  'returnal': '1649240',
  'horizon forbidden west': '2420110',
  'grand theft auto iv': '12210',
  'gta iv': '12210',
  'grand theft auto v': '3240220',
  'gta v': '3240220',
  'forza horizon 5': '1551360',
  'forza motorsport': '2440510',
  'the last of us part i': '1888930',
  'the last of us part ii': '2531310',
  'batman arkham knight': '208650',
  'batman arkham city': '200260',
  'batman arkham origins': '209000',
  'batman arkham asylum': '35140',
  'dragon ball sparking zero': '1790600',
  'dragon ball z kakarot': '851850'
};

const STEAM_LIBRARY_DATABASE = {
  '389730': { title: 'TEKKEN 7', studio: 'Bandai Namco Entertainment • Fighting', genre: 'Fighting • 3D Martial Arts', downloadSize: '78.5 GB' },
  '3564740': { title: 'Where Winds Meet', studio: 'Everstone Studio • Open-World Wuxia', genre: 'Action RPG • Martial Arts Open World', downloadSize: '50.0 GB' },
  '1778820': { title: 'TEKKEN 8', studio: 'Bandai Namco Studios • Unreal Engine 5', genre: '3D Fighting • Next-Gen Arena Fighter', downloadSize: '120.8 GB' },
  '2215430': { title: "Ghost of Tsushima DIRECTOR'S CUT", studio: 'Sucker Punch • PlayStation PC Publishing', genre: 'Action Adventure • Samurai Epic', downloadSize: '75 GB' },
  '2483190': { title: 'Forza Horizon 6', studio: 'Playground Games • Xbox Game Studios', genre: 'Open World Racing • Simulation', downloadSize: '167 GB' },
  '431960': null, // Wallpaper Engine – NOT a game, excluded
  '2322010': { title: 'God of War Ragnarök', studio: 'Santa Monica Studio • PlayStation PC', genre: 'Action • Mythological Epic', downloadSize: '190 GB' },
  '1593500': { title: 'God of War', studio: 'Santa Monica Studio • PlayStation PC', genre: 'Action Adventure • Mythological Epic', downloadSize: '70 GB' },
  '2651280': { title: "Marvel's Spider-Man 2", studio: 'Insomniac Games • PlayStation PC', genre: 'Action • Superhero Open World', downloadSize: '140 GB' },
  '1817070': { title: "Marvel’s Spider-Man Remastered", studio: 'Insomniac Games • PlayStation PC', genre: 'Action • Superhero Open World', downloadSize: '75 GB' },
  '1817190': { title: "Marvel’s Spider-Man: Miles Morales", studio: 'Insomniac Games • PlayStation PC', genre: 'Action • Superhero Open World', downloadSize: '75 GB' },
  '2358720': { title: 'Black Myth: Wukong', studio: 'Game Science • Action RPG', genre: 'Action RPG • Journey to the West', downloadSize: '130 GB' },
  '1888930': { title: 'The Last of Us™ Part I', studio: 'Naughty Dog • PlayStation PC', genre: 'Action Adventure • Post-Apocalyptic', downloadSize: '100 GB' },
  '2531310': { title: 'The Last of Us™ Part II Remastered', studio: 'Naughty Dog • PlayStation PC', genre: 'Action Adventure • Post-Apocalyptic', downloadSize: '150 GB' },
  '1551360': { title: 'Forza Horizon 5', studio: 'Playground Games • Xbox Game Studios', genre: 'Open World Racing • Festival', downloadSize: '110 GB' },
  '2440510': { title: 'Forza Motorsport', studio: 'Turn 10 Studios • Xbox Game Studios', genre: 'Track Racing • Motorsport Simulation', downloadSize: '130 GB' },
  '1650010': { title: 'RIDE 5', studio: 'Milestone S.r.l. • Unreal Engine 5', genre: 'Motorcycle Racing • Superbike Simulation', downloadSize: '50 GB' },
  '1790600': { title: 'DRAGON BALL: Sparking! ZERO', studio: 'Spike Chunsoft • Bandai Namco', genre: 'Anime Fighting • 3D Arena Brawler', downloadSize: '29 GB' },
  '851850': { title: 'DRAGON BALL Z: KAKAROT', studio: 'CyberConnect2 • Bandai Namco', genre: 'Action RPG • Anime Adventure', downloadSize: '116.86 GB' },
  '12210': { title: 'Grand Theft Auto IV: The Complete Edition', studio: 'Rockstar Games • Open World Classic', genre: 'Action • Crime Open World', downloadSize: '22 GB' },
  '3240220': { title: 'Grand Theft Auto V Enhanced', studio: 'Rockstar Games • Los Santos', genre: 'Action • Crime Open World', downloadSize: '105 GB' },
  '1546970': { title: 'Grand Theft Auto III – The Definitive Edition', studio: 'Rockstar Games • Liberty City', genre: 'Action • Open World', downloadSize: '5 GB' },
  '1546990': { title: 'Grand Theft Auto: Vice City – The Definitive Edition', studio: 'Rockstar Games • 80s Vice City', genre: 'Action • Open World', downloadSize: '10 GB' },
  '1547000': { title: 'Grand Theft Auto: San Andreas – The Definitive Edition', studio: 'Rockstar Games • San Andreas', genre: 'Action • Open World', downloadSize: '19 GB' },
  '35140': { title: 'Batman: Arkham Asylum Game of the Year Edition', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Superhero', downloadSize: '8 GB' },
  '200260': { title: 'Batman: Arkham City - Game of the Year Edition', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Superhero Open World', downloadSize: '17 GB' },
  '208650': { title: 'Batman™: Arkham Knight', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Superhero Open World', downloadSize: '45 GB' },
  '209000': { title: 'Batman™: Arkham Origins', studio: 'WB Games Montréal • WB Games', genre: 'Action Adventure • Superhero', downloadSize: '20 GB' },
  '498240': { title: 'Batman - The Telltale Series', studio: 'Telltale Games • Interactive Story', genre: 'Episodic Adventure • Story', downloadSize: '12 GB' },
  '313690': { title: 'LEGO® Batman™ 3: Beyond Gotham', studio: 'TT Games • Warner Bros. Games', genre: 'Action • LEGO Family Adventure', downloadSize: '10 GB' },
  '3764200': { title: 'Resident Evil Requiem', studio: 'Capcom • Next-Gen Horror', genre: 'Survival Horror • RE Engine', downloadSize: '68 GB' },
  '2878960': { title: 'WWE 2K25', studio: 'Visual Concepts • 2K Sports', genre: 'Sports • Pro Wrestling', downloadSize: '103 GB' },
  '4080220': { title: 'EA SPORTS FC™ 27', studio: 'EA Vancouver • EA Sports', genre: 'Sports • Football Simulation', downloadSize: '100 GB' },
  '730': { title: 'Counter-Strike 2', studio: 'Valve Corporation • Source 2 Engine', genre: 'Tactical FPS • Competitive Esports', downloadSize: '85 GB' },
  '1815780': { title: 'Asphalt Legends', studio: 'Gameloft • High-Octane Racing', genre: 'Arcade Racing • Supercars', downloadSize: '10 GB' },
  '1091500': { title: 'Cyberpunk 2077', studio: 'CD PROJEKT RED • Night City', genre: 'Action RPG • Cyberpunk', downloadSize: '70 GB' },
  '1245620': { title: 'Elden Ring', studio: 'FromSoftware • Bandai Namco', genre: 'Action RPG • Dark Fantasy', downloadSize: '60 GB' },
  '883710': { title: 'Resident Evil 2', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror', downloadSize: '26 GB' },
  '952060': { title: 'Resident Evil 3', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror', downloadSize: '45 GB' },
  '2050650': { title: 'Resident Evil 4', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror', downloadSize: '67 GB' },
  '21690': { title: 'Resident Evil 5', studio: 'Capcom • Action Co-Op', genre: 'Action • Co-Op Shooter', downloadSize: '15 GB' },
  '221040': { title: 'Resident Evil 6', studio: 'Capcom • Action Horror', genre: 'Action • Dramatic Horror', downloadSize: '16 GB' },
  '418370': { title: 'Resident Evil 7 Biohazard', studio: 'Capcom • Survival Horror', genre: 'Survival Horror • RE Engine', downloadSize: '24 GB' },
  '1196590': { title: 'Resident Evil Village', studio: 'Capcom • RE Engine', genre: 'Survival Horror • Ethan Winters', downloadSize: '30 GB' },
  '3357650': { title: 'PRAGMATA', studio: 'Capcom • Sci-Fi Adventure', genre: 'Action Adventure • Lunar Dystopia', downloadSize: '40 GB' },
  '2668510': { title: 'Red Dead Redemption', studio: 'Rockstar Games • Double Eleven', genre: 'Action Adventure • Western Classic', downloadSize: '12 GB' },
  '1174180': { title: 'Red Dead Redemption 2', studio: 'Rockstar Games • Van der Linde Gang', genre: 'Action Adventure • Epic Western', downloadSize: '120 GB' },
  '304240': { title: 'Resident Evil', studio: 'Capcom • Survival Horror Classic', genre: 'Action • Survival Horror HD', downloadSize: '20 GB' },
  '339340': { title: 'Resident Evil 0', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror HD', downloadSize: '13 GB' },
  '2698940': { title: 'The Crew Motorfest', studio: 'Ubisoft Ivory Tower • Hawaii', genre: 'Open World Racing • Island Festival', downloadSize: '40 GB' },
  '3768760': { title: '007 First Light', studio: 'Capcom / IO Interactive • Spy Thriller', genre: 'Stealth Action • James Bond Origin', downloadSize: '50 GB' },
  '814380': { title: 'Sekiro™: Shadows Die Twice - GOTY Edition', studio: 'FromSoftware • Activision', genre: 'Action Adventure • Sengoku Shinobi', downloadSize: '25 GB' },
  '3717070': { title: 'WWE 2K26', studio: 'Visual Concepts • 2K Sports', genre: 'Sports • Pro Wrestling Simulation', downloadSize: '100 GB' },
  '2315690': { title: 'WWE 2K24', studio: 'Visual Concepts • 2K Sports', genre: 'Sports • 40 Years of WrestleMania', downloadSize: '90 GB' },
  '502820': { title: 'Batman™: Arkham VR', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Virtual Reality', downloadSize: '8 GB' },
  '570940': { title: 'DARK SOULS™: REMASTERED', studio: 'FromSoftware • Bandai Namco', genre: 'Action RPG • Lordran Epic', downloadSize: '8 GB' },
  '374320': { title: 'DARK SOULS™ III', studio: 'FromSoftware • Bandai Namco', genre: 'Action RPG • Lothric Kingdom', downloadSize: '25 GB' },
  '335300': { title: 'DARK SOULS™ II: Scholar of the First Sin', studio: 'FromSoftware • Bandai Namco', genre: 'Action RPG • Drangleic Kingdom', downloadSize: '12 GB' }
};

// Non-game app IDs (Tools, SDKs, Runtimes, Servers) to never show in the Games carousel
const NON_GAME_APPIDS_VITE = new Set([
  '7','228980','1070560','1391110','1628350','216938','250820',
  '365670','1905180','223850','294420','3301060','480','760',
  '1887720','1493710','2371090','241100','1486350','1755070','2215200'
]);

function isNonGameSteamAppVite(title, appId) {
  if (appId && NON_GAME_APPIDS_VITE.has(String(appId))) return true;
  if (!title) return false;
  const t = title.toLowerCase();
  if (/^steam\s+app\s+\d+$/i.test(title)) return true;
  if (/^steam\s+game\s+\d+$/i.test(title)) return true;
  if (t.includes(' demo') || t.endsWith(' demo') || t.includes('demo edition')) return true;
  return [
    'steamworks','redistributable','common redist','runtime',
    'proton','dedicated server','server tool','benchmark','3dmark','obs studio',
    'soundpad','sdk','openvr','steamvr','live wallpaper','audio visualizer',
    'desktop mate','vroid studio','spacewar'
  ].some(kw => t.includes(kw));
}

function getSteamFavoriteAppIdsVite() {
  const favPath = path.join(__dirname, 'public', 'assets', 'cache', 'steam_favorites.json');
  try {
    if (fs.existsSync(favPath)) {
      const data = JSON.parse(fs.readFileSync(favPath, 'utf-8'));
      if (Array.isArray(data)) {
        return new Set(data.map(String).filter(id => /^\d+$/.test(id) && !NON_GAME_APPIDS_VITE.has(id)));
      }
    }
  } catch (e) {}

  // Offline fallback: intersect cloudstorage user-collections.favorite with locally verified licenses/manifests
  const candidateDirs = [
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam',
    'C:\\Steam',
    'C:\\SteamLibrary',
    'D:\\Steam',
    'D:\\SteamLibrary'
  ];
  const cloudFavs = new Set();
  const verifiedOwned = new Set();

  for (const sDir of candidateDirs) {
    const pluginDir = path.join(sDir, 'config', 'stplug-in');
    if (fs.existsSync(pluginDir)) {
      try {
        for (const pf of fs.readdirSync(pluginDir)) {
          const aid = pf.replace('.lua', '');
          if (pf.endsWith('.lua') && /^\d+$/.test(aid)) verifiedOwned.add(aid);
        }
      } catch (e) {}
    }
    const sApps = path.join(sDir, 'steamapps');
    if (fs.existsSync(sApps)) {
      try {
        for (const f of fs.readdirSync(sApps)) {
          if (f.startsWith('appmanifest_') && f.endsWith('.acf')) {
            const aid = f.replace('appmanifest_', '').replace('.acf', '');
            if (/^\d+$/.test(aid)) verifiedOwned.add(aid);
          }
        }
      } catch (e) {}
    }

    const userDataPath = path.join(sDir, 'userdata');
    if (!fs.existsSync(userDataPath)) continue;
    try {
      for (const uDir of fs.readdirSync(userDataPath)) {
        const uPath = path.join(userDataPath, uDir);
        try {
          if (!fs.statSync(uPath).isDirectory() || uDir === '0' || uDir === 'anonymous') continue;
        } catch (e) { continue; }

        const localCfgPath = path.join(uPath, 'config', 'localconfig.vdf');
        if (fs.existsSync(localCfgPath)) {
          try {
            const cfg = fs.readFileSync(localCfgPath, 'utf-8');
            for (const am of cfg.matchAll(/"(\d{3,8})"\s*\{/g)) verifiedOwned.add(String(am[1]));
          } catch (e) {}
        }

        const cloudStorageDir = path.join(uPath, 'config', 'cloudstorage');
        if (fs.existsSync(cloudStorageDir)) {
          try {
            for (const csFile of fs.readdirSync(cloudStorageDir)) {
              if (csFile.startsWith('cloud-storage-namespace-') && csFile.endsWith('.json') && !csFile.endsWith('.modified.json')) {
                const parsed = JSON.parse(fs.readFileSync(path.join(cloudStorageDir, csFile), 'utf-8'));
                if (!Array.isArray(parsed)) continue;
                for (const entry of parsed) {
                  if (!Array.isArray(entry) || entry.length < 2) continue;
                  const [key, obj] = entry;
                  if (key === 'user-collections.favorite' && obj?.value) {
                    const val = typeof obj.value === 'string' ? JSON.parse(obj.value) : obj.value;
                    const added = Array.isArray(val?.added) ? val.added : [];
                    const removed = new Set((Array.isArray(val?.removed) ? val.removed : []).map(String));
                    for (const aid of added) {
                      const strAid = String(aid);
                      if (!removed.has(strAid) && !NON_GAME_APPIDS_VITE.has(strAid)) cloudFavs.add(strAid);
                    }
                  }
                }
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  const discovered = new Set([...cloudFavs].filter(id => verifiedOwned.has(id)));
  if (discovered.size > 0) {
    try {
      const cacheDir = path.dirname(favPath);
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(favPath, JSON.stringify([...discovered]), 'utf-8');
    } catch (e) {}
  }
  return discovered;
}

async function evaluateSteamCdpVite(expression, timeoutMs = 1500) {
  try {
    const res = await fetch('http://127.0.0.1:8080/json');
    if (!res.ok) return null;
    const targets = await res.json();
    const shared = targets.find(t => t.title === 'SharedJSContext');
    const WS = globalThis.WebSocket;
    if (!WS || !shared?.webSocketDebuggerUrl) return null;

    return await new Promise((resolve) => {
      const ws = new WS(shared.webSocketDebuggerUrl);
      const requestId = getNextCdpIdVite();
      let settled = false;
      const finish = (value = null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { ws.close(); } catch (e) {}
        resolve(value);
      };
      const timer = setTimeout(() => finish(null), timeoutMs);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: requestId,
          method: 'Runtime.evaluate',
          params: {
            expression,
            awaitPromise: true,
            returnByValue: true
          }
        }));
      };

      ws.onmessage = (msg) => {
        try {
          const d = JSON.parse(msg.data);
          if (d.id !== requestId) return;
          if (d.error || d.result?.exceptionDetails) {
            finish(null);
            return;
          }
          finish(d.result?.result?.value ?? null);
        } catch (e) {
          finish(null);
        }
      };

      ws.onerror = () => finish(null);
    });
  } catch (err) {
    return null;
  }
}

async function syncLiveFavoritesFromSteamClientVite() {
  const cdpFav = await evaluateSteamCdpVite(`
    (async () => {
      try {
        const cs = window.collectionStore;
        const as = window.appStore;
        if (!cs || typeof cs.GetCollection !== 'function') return { ready: false };
        const favCol = cs.GetCollection('favorite');
        if (!favCol) return { ready: false };
        const hiddenCol = cs.GetCollection('hidden');
        const hiddenSet = new Set();
        const hiddenRaw = hiddenCol?.visibleApps || hiddenCol?.allApps || hiddenCol?.apps;
        if (hiddenRaw) {
          const hArr = typeof hiddenRaw.values === 'function' ? [...hiddenRaw.values()] : (Array.isArray(hiddenRaw) ? hiddenRaw : [...hiddenRaw]);
          for (const item of hArr) {
            const aid = typeof item === 'object' ? item?.appid : item;
            if (aid) hiddenSet.add(String(aid));
          }
        }
        const rawList = favCol.visibleApps || favCol.allApps || favCol.apps;
        if (!rawList) return { ready: false };
        const listArr = typeof rawList.values === 'function' ? [...rawList.values()] : (Array.isArray(rawList) ? rawList : [...rawList]);
        const favorites = [];
        const meta = {};
        const excludedTypes = new Set([4, 8, 2048]);
        for (const item of listArr) {
          const appObj = (typeof item === 'object' && item !== null) ? item : as?.GetAppOverviewByAppID?.(Number(item));
          const aidNum = Number(appObj?.appid || (typeof item === 'number' || typeof item === 'string' ? item : 0));
          if (!aidNum) continue;
          const aid = String(aidNum);
          if (hiddenSet.has(aid)) continue;
          const appType = Number(appObj?.app_type || 0);
          if (excludedTypes.has(appType)) continue;
          favorites.push(aid);
          meta[aid] = {
            appId: aid,
            title: appObj?.display_name || '',
            installed: Boolean(appObj?.installed),
            sizeOnDisk: Number(appObj?.size_on_disk || 0),
            playtimeMinutes: Number(appObj?.minutes_playtime_forever || 0),
            lastPlayed: Number(appObj?.rt_last_time_played || 0),
            appType
          };
        }
        return { ready: true, favorites, meta };
      } catch (e) {
        return { ready: false };
      }
    })()
  `, 1400);

  if (!cdpFav || !cdpFav.ready || !Array.isArray(cdpFav.favorites)) return null;

  const filteredFavs = cdpFav.favorites.filter(aid => !isNonGameSteamAppVite(cdpFav.meta?.[aid]?.title, aid));
  const favPath = path.join(__dirname, 'public', 'assets', 'cache', 'steam_favorites.json');
  try {
    const nextJson = JSON.stringify(filteredFavs);
    const prevJson = fs.existsSync(favPath) ? fs.readFileSync(favPath, 'utf-8') : '';
    if (prevJson !== nextJson) {
      const cacheDir = path.dirname(favPath);
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(favPath, nextJson, 'utf-8');
    }
  } catch (e) {}

  return { favorites: filteredFavs, meta: cdpFav.meta || {} };
}

async function getLiveSteamCDPDataVite() {
  return evaluateSteamCdpVite(`
    new Promise((res) => {
      let overview = null;
      let items = null;
      let overviewReceived = false;
      let itemsReceived = false;
      let settled = false;
      let overviewHandle = null;
      let itemsHandle = null;

      const cleanup = () => {
        try { overviewHandle?.unregister?.(); } catch(e){}
        try { itemsHandle?.unregister?.(); } catch(e){}
      };

      const tryFinish = () => {
        if (!settled && overviewReceived && itemsReceived) {
          settled = true;
          clearTimeout(timeoutTimer);
          cleanup();
          res({ overview, items });
        }
      };

      const timeoutTimer = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          res({ overview, items });
        }
      }, 700);

      try {
        const downloads = window.SteamClient?.Downloads;
        if (typeof downloads?.RegisterForDownloadOverview !== 'function') throw new Error('Download overview unavailable');
        overviewHandle = downloads.RegisterForDownloadOverview((ov) => {
          const p2 = ov?.progress?.[2];
          const p3 = ov?.progress?.[3];
          overview = ov ? {
            appid: Number(ov.update_appid),
            paused: Boolean(ov.paused),
            state: ov.update_state,
            downloadProgress: p2 ? {
              bytes_in_progress: p2.bytes_in_progress,
              bytes_total: p2.bytes_total,
              estimated_time_remaining_sec: p2.estimated_time_remaining_sec
            } : null,
            installProgress: p3 ? {
              bytes_in_progress: p3.bytes_in_progress,
              bytes_total: p3.bytes_total,
              estimated_time_remaining_sec: p3.estimated_time_remaining_sec
            } : null,
            networkBytesPerSec: Number.isFinite(ov.update_network_bytes_per_second) ? ov.update_network_bytes_per_second : null,
            discBytesPerSec: Number.isFinite(ov.update_disc_bytes_per_second) ? ov.update_disc_bytes_per_second : null,
            installPercent: typeof ov.overall_percent_complete === 'number' ? ov.overall_percent_complete : null,
            timeRemainingSec: Number.isFinite(ov.overall_estimated_time_remaining_sec) && ov.overall_estimated_time_remaining_sec >= 0
              ? ov.overall_estimated_time_remaining_sec
              : null
          } : null;
          overviewReceived = true;
          tryFinish();
        });
        if (settled) cleanup();
      } catch(e) {
        overview = null;
        overviewReceived = true;
      }

      try {
        const downloads = window.SteamClient?.Downloads;
        if (typeof downloads?.RegisterForDownloadItems !== 'function') throw new Error('Download items unavailable');
        itemsHandle = downloads.RegisterForDownloadItems((isInitial, data) => {
          items = data?.[0]?.item_data || [];
          itemsReceived = true;
          tryFinish();
        });
        if (settled) cleanup();
      } catch(e) {
        items = [];
        itemsReceived = true;
      }
      tryFinish();
    })
  `, 900);
}

function isSteamProcessRunningVite() {
  try {
    const stdout = execSync('tasklist /FI "IMAGENAME eq steam.exe" /NH', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 1000
    });
    return stdout.toLowerCase().includes('steam.exe');
  } catch (e) {
    return false;
  }
}

let cdpSeqVite = 1;
function getNextCdpIdVite() {
  cdpSeqVite = (cdpSeqVite + 1) % 1000000;
  return cdpSeqVite;
}

async function controlSteamDownloadVite(appId, action) {
  try {
    const normalizedAppId = String(appId ?? '').trim();
    if (!/^\d+$/.test(normalizedAppId) || !['pause', 'resume'].includes(action)) {
      return { success: false, error: 'Invalid Steam download command parameters.' };
    }

    let res;
    try {
      res = await fetch('http://127.0.0.1:8080/json');
    } catch (netErr) {
      const running = isSteamProcessRunningVite();
      if (running) {
        return { success: false, error: 'Steam is running, but the remote control interface (debugging port 8080) is not responding.' };
      }
      return { success: false, error: 'Steam is not running. Please launch Steam first.' };
    }

    if (!res.ok) {
      const running = isSteamProcessRunningVite();
      if (running) {
        return { success: false, error: `Steam is running, but remote debugging returned HTTP ${res.status}.` };
      }
      return { success: false, error: 'Steam is not running. Please launch Steam first.' };
    }

    const targets = await res.json();
    const shared = targets.find(t => t.title === 'SharedJSContext');
    const WS = globalThis.WebSocket;
    if (!WS || !shared?.webSocketDebuggerUrl) {
      return { success: false, error: 'Steam remote control interface is available, but SharedJSContext was not found.' };
    }

    const numId = Number(normalizedAppId);
    const remoteId = "0"; // Steam local download remote ID; keep explicit until a real remoteId is available.

    const expression = `new Promise((resolve) => {
      const dl = window.SteamClient?.Downloads;
      if (!dl) {
        return resolve({ success: false, error: 'SteamClient.Downloads is unavailable.' });
      }
      const numId = ${numId};
      const remoteId = "${remoteId}";

      let settled = false;
      let listenerHandle = null;
      let initialSnapshotSeen = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutTimer);
        try { listenerHandle?.unregister?.(); } catch (e) {}
        resolve(result);
      };

      const timeoutTimer = setTimeout(() => {
        finish({ success: false, error: 'Steam did not confirm download state transition.' });
      }, 2500);

      try {
        listenerHandle = dl.RegisterForDownloadItems((isInitial, data) => {
          // Ignore the initial snapshot Steam sends on registration so we do not
          // misinterpret the pre-action state as the post-action outcome.
          if (isInitial) {
            initialSnapshotSeen = true;
            return;
          }

          const item = data?.[0]?.item_data?.find(i => i.appid === numId);
          if (!item) return;

          if (${action === 'pause' ? `item.paused === true || (item.active === false && !item.completed)` : `item.active === true && item.paused === false`}) {
            finish({
              success: true,
              status: ${action === 'pause' ? `'Paused'` : `'Downloading'`},
              paused: ${action === 'pause' ? 'true' : 'false'},
              active: ${action === 'pause' ? 'false' : 'true'}
            });
          }
        });
      } catch (e) {}

      try {
        ${action === 'pause' ? `
          if (typeof dl.PauseAppUpdate !== 'function') {
            return finish({ success: false, error: 'Steam does not expose PauseAppUpdate.' });
          }
          dl.PauseAppUpdate(numId, remoteId);
          try { dl.PauseAppUpdate(numId, 0); } catch(e){}
          try { dl.PauseAppUpdate(numId); } catch(e){}
        ` : `
          if (typeof dl.ResumeAppUpdate === 'function') {
            dl.ResumeAppUpdate(numId, remoteId);
            try { dl.ResumeAppUpdate(numId, 0); } catch(e){}
          }
          if (typeof dl.QueueAppUpdate === 'function') {
            dl.QueueAppUpdate(numId, remoteId);
            try { dl.QueueAppUpdate(numId, 0); } catch(e){}
          }
          if (typeof dl.EnableAllDownloads === 'function') {
            dl.EnableAllDownloads(true, remoteId);
            try { dl.EnableAllDownloads(true); } catch(e){}
          }
        `}
      } catch (err) {
        finish({ success: false, error: String(err?.message || err) });
      }
    })`;

    // Issue the action via CDP and wait for Steam to confirm the transition.
    let directResult;
    try {
      directResult = await new Promise((resolve) => {
        const ws = new WS(shared.webSocketDebuggerUrl);
        const requestId = getNextCdpIdVite();
        let settled = false;
        const finish = (result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          try { ws.close(); } catch (e) {}
          resolve(result);
        };
        const timer = setTimeout(() => finish({ success: false, error: 'Timed out waiting for Steam response.' }), 3500);
        ws.onopen = () => ws.send(JSON.stringify({
          id: requestId,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise: true, returnByValue: true }
        }));
        ws.onmessage = (message) => {
          try {
            const reply = JSON.parse(message.data);
            if (reply.id !== requestId) return;
            if (reply.error || reply.result?.exceptionDetails) {
              const errDetails = reply.error?.message || reply.result?.exceptionDetails?.text || 'Steam rejected download command.';
              finish({ success: false, error: errDetails });
              return;
            }
            const val = reply.result?.result?.value;
            if (val && typeof val === 'object' && val.success === true) {
              finish({ success: true, status: val.status });
            } else {
              finish({ success: false, error: val?.error || 'Steam did not accept download command.' });
            }
          } catch (_) {
            finish({ success: false, error: 'Could not parse Steam command response.' });
          }
        };
        ws.onerror = () => finish({ success: false, error: 'Could not connect to Steam WebSocket debugger.' });
      });
    } catch (e) {
      return { success: false, error: e.message || 'Steam download command failed.' };
    }

    // If Steam confirmed the transition through the listener, treat that as success.
    if (directResult?.success) {
      return { success: true, status: directResult.status };
    }

    // Otherwise, fall back to verifying the live state after the action. This covers
    // cases where the listener did not fire in time but Steam still applied the change.
    try {
      const verifySnapshot = await getLiveSteamCDPDataVite();
      if (verifySnapshot && verifySnapshot.items) {
        const item = verifySnapshot.items?.[0]?.item_data?.find(i => i.appid === numId);
        if (item) {
          const isPaused = Boolean(item.paused || (item.active === false && !item.completed));
          const isDownloading = Boolean(item.active);
          if (action === 'pause' && (isPaused || !isDownloading)) {
            return { success: true, status: 'Paused', paused: true, active: false };
          }
          if (action === 'resume' && isDownloading && !isPaused) {
            return { success: true, status: 'Downloading', paused: false, active: true };
          }
        }
      }
    } catch (verifyErr) {
      // Verification failure is not the same as a confirmed failure; keep the
      // original error from the direct command attempt.
      console.warn('[Steam CDP] Post-action verification failed:', verifyErr?.message);
    }

    // If directResult already gave us a non-success outcome, prefer that message.
    if (directResult?.error) {
      return { success: false, error: directResult.error };
    }

    return {
      success: false,
      error: `Steam did not confirm the ${action} action for app ${normalizedAppId}.`
    };
  } catch (e) {
    return { success: false, error: e.message || 'Steam download command failed.' };
  }
}

// Vite custom plugin to communicate with Windows OS on the user's laptop
function pcLauncherPlugin() {
  let lastLaunchedApp = null;

  // Helpers shared by the Steam download/pause/resume middlewares below.
  // Declared at plugin scope (not inside the launch middleware) so every
  // middleware in this plugin resolves them from the same binding.
  function normalizePercentValueVite(val) {
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 100) {
      return Math.round(val);
    }
    return null;
  }

  function normalizeSteamProgressVite(progress) {
    const downloaded = progress?.bytes_in_progress;
    const total = progress?.bytes_total;
    if (!Number.isFinite(downloaded) || !Number.isFinite(total) || downloaded < 0 || total <= 0 || downloaded > total) {
      return null;
    }
    return {
      bytesDownloaded: downloaded,
      bytesTotal: total,
      percent: normalizePercentValueVite((downloaded / total) * 100),
      timeRemainingSec: Number.isFinite(progress?.estimated_time_remaining_sec) && progress.estimated_time_remaining_sec >= 0
        ? progress.estimated_time_remaining_sec
        : null
    };
  }

  return {
    name: 'ps5-pc-launcher',
    configureServer(server) {
      const candidateSteamDirs = [
        'C:/Program Files (x86)/Steam',
        'C:/Program Files/Steam',
        'C:/Steam',
        'D:/Steam',
        'D:/SteamLibrary',
        'E:/Steam',
        'E:/SteamLibrary'
      ];

      function resolveSteamExesWithPathsVite(targetAppId) {
        const names = new Set();
        const paths = new Set();
        if (!targetAppId || !/^\d+$/.test(String(targetAppId))) return { names: [], paths: [] };
        const aid = String(targetAppId);
        if (aid === '431960') return { names: [], paths: [] };

        const steamAppsList = candidateSteamDirs
          .map(d => path.join(d, 'steamapps'))
          .filter(p => fs.existsSync(p));
        let installDir = '';
        let foundSteamApps = '';
        for (const sApps of steamAppsList) {
          const manifestPath = path.join(sApps, `appmanifest_${aid}.acf`);
          if (fs.existsSync(manifestPath)) {
            try {
              const content = fs.readFileSync(manifestPath, 'utf-8');
              const matchDir = content.match(/"installdir"\s+"([^"]+)"/);
              if (matchDir) {
                installDir = matchDir[1];
                foundSteamApps = sApps;
                break;
              }
            } catch (e) {}
          }
        }
        if (!installDir || !foundSteamApps) return { names: [], paths: [] };
        const fullGameDir = path.join(foundSteamApps, 'common', installDir);
        if (!fs.existsSync(fullGameDir)) return { names: [], paths: [] };

        try {
          const scanExes = (dir, depth = 0) => {
            if (depth > 2) return;
            for (const entry of fs.readdirSync(dir)) {
              const full = path.join(dir, entry);
              try {
                const stat = fs.statSync(full);
                if (stat.isDirectory() && !entry.startsWith('.')) {
                  scanExes(full, depth + 1);
                } else if (entry.toLowerCase().endsWith('.exe')) {
                  const l = entry.toLowerCase();
                  if (!l.includes('crash') && !l.includes('report') &&
                      !l.includes('setup') && !l.includes('installer') && !l.includes('unins')) {
                    names.add(entry);
                    paths.add(full);
                  }
                }
              } catch (e) {}
            }
          };
          scanExes(fullGameDir);
        } catch (e) {}
        return { names: [...names], paths: [...paths] };
      }

      // 1a. Game Boost APIs (for browser / Vite dev server mode)
      server.middlewares.use('/api/pc/boost/status', async (req, res) => {
        try {
          const st = await gameBoostVite.getRunningBoostCandidates();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, ...st }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      server.middlewares.use('/api/pc/boost/enable', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('{}'); }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
          try {
            const opts = JSON.parse(body || '{}');
            const gInfo = opts.gameInfo && typeof opts.gameInfo === 'object' ? { ...opts.gameInfo } : {};
            if (gInfo.appId && /^\d+$/.test(String(gInfo.appId))) {
              const resolved = resolveSteamExesWithPathsVite(String(gInfo.appId));
              if (resolved.paths.length > 0) gInfo.candidateExePaths = resolved.paths;
            }
            const out = await gameBoostVite.enableGameBoost({ ...opts, gameInfo: gInfo, autoGameBoost: true });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(out));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });

      server.middlewares.use('/api/pc/boost/open-graphics', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('{}'); }
        exec('cmd /c start "" "ms-settings:display-advancedgraphics"', { windowsHide: true }, () => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        });
      });

      server.middlewares.use('/api/pc/boost/disable', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('{}'); }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
          try {
            const opts = JSON.parse(body || '{}');
            const out = await gameBoostVite.disableGameBoost(opts);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(out));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });

      // 1a. Launch Game or App on Laptop
      server.middlewares.use('/api/pc/launch', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { execPath, uri, appId, title, args } = JSON.parse(body || '{}');
              lastLaunchedApp = { execPath, uri, appId, title, launchedAt: Date.now() };

              // Skip launching non-game apps
              if (appId === '431960' || (title && title.toLowerCase().includes('wallpaper engine'))) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Utility app cannot be launched as a game' }));
                return;
              }

              const resolvedSteam = (appId && /^\d+$/.test(String(appId)))
                ? resolveSteamExesWithPathsVite(String(appId))
                : { names: [], paths: [] };
              const targetExes = resolvedSteam.names.length > 0
                ? resolvedSteam.names
                : (execPath ? [path.basename(execPath)] : []);
              const candidateExePaths = resolvedSteam.paths.length > 0
                ? resolvedSteam.paths
                : (execPath ? [execPath] : []);

              const uriLow = String(uri || '').toLowerCase();
              const isRealGame = !uriLow.startsWith('steam://install/') && !uriLow.startsWith('http');
              if (isRealGame && !gameBoostVite.isActivatingOrActive?.()) {
                // Launch boost concurrently with game startup for zero click-to-launch delay
                gameBoostVite.enableGameBoost({
                  autoGameBoost: true,
                  boostAntiStutter: true,
                  boostThrottleHelpers: true,
                  boostTrimRam: true,
                  boostForceHighPerfGpu: true,
                  boostSuppressPopups: true,
                  gameInfo: { execPath, uri, appId, title, candidateExePaths }
                }).catch(() => {});
              }

              let cmd = '';
              const exeDir = execPath ? path.dirname(execPath) : '';

              if (appId && /^\d+$/.test(String(appId))) {
                cmd = `start "" "steam://rungameid/${appId}"`;
              } else if (execPath && args) {
                cmd = `start "" /d "${exeDir}" "${execPath}" ${args}`;
              } else if (uri) {
                // Windows protocol launch (e.g. steam://, xbox://, etc.)
                cmd = `start "" "${uri}"`;
              } else if (execPath) {
                // Windows exe path launch with working directory
                cmd = `start "" /d "${exeDir}" "${execPath}"`;
              }

              if (cmd) {
                console.log(`[PS5 PC Launcher] Launching: ${cmd}`);
                exec(cmd, { windowsHide: true }, (err) => {
                  if (err) {
                    console.error('[PS5 PC Launcher] Error:', err.message);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: err.message }));
                    return;
                  }
                  if (isRealGame && targetExes.length > 0) {
                    setTimeout(() => {
                      if (gameBoostVite.getCurrentState().active) {
                        gameBoostVite.boostGameProcessPriority({ targetExes }).catch(() => {});
                      }
                    }, 4500);
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, launched: cmd }));
                });
              } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing execPath or uri' }));
              }
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        }
      });

      // 1a2. Steam Live Downloads & Install Status API
      server.middlewares.use('/api/steam/downloads', async (req, res) => {
        try {
          const snapshotTimestamp = Date.now();
          const live = await getLiveSteamCDPDataVite();
          if (!live) {
            // Let the Electron bridge provide its manifest-backed syncing state;
            // an empty successful snapshot would briefly turn an active game into
            // a Download button in the renderer.
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 503;
            res.end(JSON.stringify({ success: false, downloads: {}, error: 'Steam live snapshot is temporarily unavailable.' }));
            return;
          }
          const downloads = {};
          {
            const overview = live.overview;
            const items = Array.isArray(live.items) ? live.items : [];
            const overviewAppId = Number.isInteger(overview?.appid) && overview.appid > 0 ? String(overview.appid) : '';

            // 1. Queue items
            for (const item of items) {
              if (!item?.appid) continue;
              const aid = String(item.appid);
              if (aid === overviewAppId) continue;
              // Queue data is stale for active apps when Steam's Overview callback
              // is missing or delayed. Wait for that app's live Overview instead.
              const itemProgress = item.active && aid !== overviewAppId
                ? null
                : normalizeSteamProgressVite(item.update_type_info?.[0]?.progress?.[2]);
              const isPaused = Boolean(item.paused || (!item.active && !item.completed));
              const isDownloading = Boolean(item.active);
              const installPct = normalizePercentValueVite(item.overall_percent_complete);

              downloads[aid] = {
                appId: aid,
                name: STEAM_LIBRARY_DATABASE[aid]?.title || `Steam App ${aid}`,
                status: isPaused ? 'Paused' : (isDownloading ? 'Downloading' : (item.completed ? 'Complete' : 'Queued')),
                bytesDownloaded: itemProgress?.bytesDownloaded ?? null,
                bytesTotal: itemProgress?.bytesTotal ?? null,
                downloadPercent: itemProgress?.percent ?? null,
                downloadRateMbps: (isDownloading && typeof item.current_download_rate === 'number') ? (item.current_download_rate * 8) / 1_000_000 : 0,
                installPercent: installPct,
                percent: itemProgress?.percent ?? null,
                isFullyInstalled: Boolean(item.completed),
                syncSource: 'steam-queue',
                syncStatus: isDownloading && !itemProgress ? 'syncing' : 'live',
                syncedAt: Date.now()
              };
            }

            // 2. Overwrite / enrich active downloading game with live streaming overview counters
            if (overviewAppId) {
              const activeAid = overviewAppId;
              const downloadProgress = normalizeSteamProgressVite(overview.downloadProgress);
              const installProgress = normalizeSteamProgressVite(overview.installProgress);
              const installPercent = normalizePercentValueVite(overview.installPercent);
              const isPaused = overview.paused;
              const rateMbps = Number.isFinite(overview.networkBytesPerSec) && overview.networkBytesPerSec > 0 ? (overview.networkBytesPerSec * 8) / 1_000_000 : 0;
              const diskRateMbps = Number.isFinite(overview.discBytesPerSec) && overview.discBytesPerSec > 0 ? (overview.discBytesPerSec * 8) / 1_000_000 : 0;

              downloads[activeAid] = {
                ...(downloads[activeAid] || {}),
                appId: activeAid,
                name: STEAM_LIBRARY_DATABASE[activeAid]?.title || downloads[activeAid]?.name || `Steam App ${activeAid}`,
                status: isPaused ? 'Paused' : 'Downloading',
                bytesDownloaded: downloadProgress?.bytesDownloaded ?? null,
                bytesTotal: downloadProgress?.bytesTotal ?? null,
                downloadPercent: downloadProgress?.percent ?? null,
                downloadRateMbps: isPaused ? 0 : rateMbps,
                installPercent: installPercent,
                diskRateMbps: isPaused ? 0 : diskRateMbps,
                percent: downloadProgress?.percent ?? null,
                timeRemainingSec: downloadProgress?.timeRemainingSec,
                installTimeRemainingSec: installProgress?.timeRemainingSec,
                isFullyInstalled: false,
                syncSource: 'steam-overview',
                syncStatus: downloadProgress ? 'live' : 'syncing',
                syncedAt: Date.now()
              };
            } else {
              for (const [aid, state] of Object.entries(downloads)) {
                if (!['Downloading', 'Updating', 'Paused'].includes(state?.status)) continue;
                downloads[aid] = {
                  ...state,
                  bytesDownloaded: null,
                  bytesTotal: null,
                  downloadPercent: null,
                  percent: null,
                  installPercent: null,
                  downloadRateMbps: 0,
                  diskRateMbps: 0,
                  syncSource: 'steam-overview-pending',
                  syncStatus: 'syncing',
                  syncedAt: snapshotTimestamp
                };
              }
            }
          }
          downloads.__snapshotTimestamp = snapshotTimestamp;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, downloads }));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, downloads: {}, error: err.message }));
        }
      });

      // 1a3. Steam Pause Download API
      server.middlewares.use('/api/steam/pause', async (req, res) => {
        try {
          const u = new URL(req.url, 'http://localhost');
          const appId = u.searchParams.get('appId');
          if (!appId || !/^\d+$/.test(appId.trim())) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Invalid Steam AppID.' }));
            return;
          }
          const result = await controlSteamDownloadVite(appId, 'pause');
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = result.success ? 200 : 502;
          res.end(JSON.stringify(result));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      // 1a4. Steam Resume Download API
      server.middlewares.use('/api/steam/resume', async (req, res) => {
        try {
          const u = new URL(req.url, 'http://localhost');
          const appId = u.searchParams.get('appId');
          if (!appId || !/^\d+$/.test(appId.trim())) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Invalid Steam AppID.' }));
            return;
          }
          const result = await controlSteamDownloadVite(appId, 'resume');
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = result.success ? 200 : 502;
          res.end(JSON.stringify(result));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      // 1b. YouTube Search Suggest API Proxy
      server.middlewares.use('/api/yt/suggest', async (req, res) => {
        try {
          const u = new URL(req.url, 'http://localhost');
          const q = u.searchParams.get('q') || '';
          if (!q) {
            res.setHeader('Content-Type', 'application/json');
            res.end('[]');
            return;
          }
          const ytUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`;
          const resp = await fetch(ytUrl);
          const data = await resp.json();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data[1] || []));
        } catch (e) {
          res.setHeader('Content-Type', 'application/json');
          res.end('[]');
        }
      });

      // 1c. Direct In-App YouTube & YouTube Music Reverse Proxies (strip X-Frame-Options & CSP, inject base)
      server.middlewares.use('/proxy/yt', (req, res) => {
        const targetPath = req.url || '/';
        const targetUrl = `https://www.youtube.com${targetPath}`;
        import('https').then(https => {
          const reqHeaders = { ...req.headers };
          delete reqHeaders['accept-encoding']; // ensure uncompressed UTF-8 for HTML rewriting
          reqHeaders['host'] = 'www.youtube.com';
          reqHeaders['referer'] = 'https://www.youtube.com/';
          reqHeaders['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

          const pReq = https.request(targetUrl, {
            method: req.method,
            headers: reqHeaders
          }, (pRes) => {
            const headers = { ...pRes.headers };
            delete headers['x-frame-options'];
            delete headers['content-security-policy'];
            delete headers['frame-ancestors'];
            headers['access-control-allow-origin'] = '*';

            const contentType = headers['content-type'] || '';
            if (contentType.includes('text/html')) {
              let chunks = [];
              pRes.on('data', chunk => chunks.push(chunk));
              pRes.on('end', () => {
                let html = Buffer.concat(chunks).toString('utf-8');
                html = html.replace(/<head>/i, '<head><base href="https://www.youtube.com/">');
                delete headers['content-length'];
                res.writeHead(pRes.statusCode, headers);
                res.end(html);
              });
            } else {
              res.writeHead(pRes.statusCode, headers);
              pRes.pipe(res);
            }
          });
          pReq.on('error', (err) => {
            res.statusCode = 502;
            res.end(`Proxy error: ${err.message}`);
          });
          req.pipe(pReq);
        });
      });

      server.middlewares.use('/proxy/ytm', (req, res) => {
        const targetPath = req.url || '/';
        const targetUrl = `https://music.youtube.com${targetPath}`;
        import('https').then(https => {
          const reqHeaders = { ...req.headers };
          delete reqHeaders['accept-encoding'];
          reqHeaders['host'] = 'music.youtube.com';
          reqHeaders['referer'] = 'https://music.youtube.com/';
          reqHeaders['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

          const pReq = https.request(targetUrl, {
            method: req.method,
            headers: reqHeaders
          }, (pRes) => {
            const headers = { ...pRes.headers };
            delete headers['x-frame-options'];
            delete headers['content-security-policy'];
            delete headers['frame-ancestors'];
            headers['access-control-allow-origin'] = '*';

            const contentType = headers['content-type'] || '';
            if (contentType.includes('text/html')) {
              let chunks = [];
              pRes.on('data', chunk => chunks.push(chunk));
              pRes.on('end', () => {
                let html = Buffer.concat(chunks).toString('utf-8');
                html = html.replace(/<head>/i, '<head><base href="https://music.youtube.com/">');
                delete headers['content-length'];
                res.writeHead(pRes.statusCode, headers);
                res.end(html);
              });
            } else {
              res.writeHead(pRes.statusCode, headers);
              pRes.pipe(res);
            }
          });
          pReq.on('error', (err) => {
            res.statusCode = 502;
            res.end(`Proxy error: ${err.message}`);
          });
          req.pipe(pReq);
        });
      });

      // 1d. Forward relative YouTube API requests
      server.middlewares.use('/youtubei', (req, res) => {
        const targetUrl = `https://www.youtube.com/youtubei${req.url || ''}`;
        import('https').then(https => {
          const reqHeaders = { ...req.headers };
          reqHeaders['host'] = 'www.youtube.com';
          reqHeaders['referer'] = 'https://www.youtube.com/';
          reqHeaders['origin'] = 'https://www.youtube.com';

          const pReq = https.request(targetUrl, {
            method: req.method,
            headers: reqHeaders
          }, (pRes) => {
            const headers = { ...pRes.headers };
            delete headers['x-frame-options'];
            delete headers['content-security-policy'];
            headers['access-control-allow-origin'] = '*';
            res.writeHead(pRes.statusCode, headers);
            pRes.pipe(res);
          });
          pReq.on('error', (err) => {
            res.statusCode = 502;
            res.end(err.message);
          });
          req.pipe(pReq);
        });
      });

      // 1b. Close / Quit Running Game or App on Laptop
      // Only kills processes that this plugin itself launched or that match a
      // recognized Steam appId resolved from its manifest. It intentionally does
      // NOT build kill targets from client-supplied title heuristics or from an
      // arbitrary execPath basename.
      function resolveCloseTargetsFromSteamAppId(targetAppId) {
        return new Set(resolveSteamExesWithPathsVite(targetAppId).names);
      }

      server.middlewares.use('/api/pc/close', (req, res) => {
        if (req.method !== 'POST') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 405;
          res.end(JSON.stringify({ success: false, error: 'Method not allowed.' }));
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const payload = JSON.parse(body || '{}');

            // Prefer an explicit steam://rungameid URI or a numeric appId.
            let targetAppId = payload.appId;
            let explicitUri = payload.uri || payload.launchUri || null;
            if (!targetAppId && explicitUri && typeof explicitUri === 'string' && explicitUri.startsWith('steam://rungameid/')) {
              targetAppId = explicitUri.replace('steam://rungameid/', '').trim();
            }
            if (targetAppId && !/^\d+$/.test(String(targetAppId))) {
              targetAppId = null;
            }

            // Fall back to the most recent app launched by this plugin only if the
            // caller gave no appId/uri and the recorded launch was a steam URI or had
            // a numeric appId.
            let effectiveAppId = targetAppId;
            if (!effectiveAppId && lastLaunchedApp) {
              const rec = lastLaunchedApp;
              const recUri = rec.uri || rec.launchUri || '';
              if (recUri.startsWith('steam://rungameid/')) {
                effectiveAppId = recUri.replace('steam://rungameid/', '').trim();
              } else if (rec.appId && /^\d+$/.test(String(rec.appId))) {
                effectiveAppId = String(rec.appId);
              }
            }

            const targets = new Set();

            if (effectiveAppId) {
              targets.addAll(resolveCloseTargetsFromSteamAppId(effectiveAppId));
            }

            // If the plugin previously launched a direct executable, kill its basename.
            if (targets.size === 0 && lastLaunchedApp && lastLaunchedApp.execPath) {
              const base = path.basename(lastLaunchedApp.execPath);
              if (base && base.toLowerCase().endsWith('.exe')) {
                targets.add(base);
              }
            }

            const targetList = Array.from(targets);
            console.log('[PS5 PC Launcher] Closing game targets:', targetList);

            if (targetList.length === 0) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: effectiveAppId
                  ? 'No eligible executable target found for this app in the Steam manifest or launch record.'
                  : 'Missing appId/uri and no recognized previous launch record to close.'
              }));
              return;
            }

            let killedCount = 0;
            const killPromises = targetList.map(exe => new Promise(resolve => {
              exec(`taskkill /IM "${exe}" /T /F`, { windowsHide: true }, (err, stdout) => {
                if (!err && stdout && stdout.toLowerCase().includes('success')) {
                  killedCount++;
                  console.log(`[PS5 PC Launcher] Successfully terminated process: ${exe}`);
                } else {
                  console.warn(`[PS5 PC Launcher] taskkill failed for ${exe}:`, err?.message || stdout?.trim() || 'no output');
                }
                resolve();
              });
            }));

            Promise.all(killPromises).then(async () => {
              if (gameBoostVite.getCurrentState().active) {
                await gameBoostVite.disableGameBoost({ restoreClosedApps: false }).catch(() => {});
              }
              // Only clear the launch record if it pointed at this effective app.
              if (lastLaunchedApp) {
                const recId = String(lastLaunchedApp.appId || (lastLaunchedApp.uri || '').replace('steam://rungameid/', '').trim());
                if (recId === String(effectiveAppId)) {
                  lastLaunchedApp = null;
                }
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                closedTargets: targetList,
                processesKilled: killedCount
              }));
            });

          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });

      // 2. Official Steam Asset Streamer (Local Librarycache + Steam Akamai CDN)
      server.middlewares.use('/api/pc/asset', (req, res) => {
        try {
          const parsedUrl = new URL(req.url, 'http://localhost:5173');
          const appId = parsedUrl.searchParams.get('appId');
          const type = parsedUrl.searchParams.get('type'); // 'logo', 'hero', 'tile', 'header'

          if (!appId) {
            res.statusCode = 400;
            res.end('Missing appId');
            return;
          }

          // Official PS5 assets for Ghost of Tsushima DIRECTOR'S CUT
          if (appId === '2215430') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/got/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/got/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/got/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for Marvel's Spider-Man: Miles Morales
          if (appId === '1817190') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/spidermanmilesmorales/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/spidermanmilesmorales/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/spidermanmilesmorales/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for Marvel's Spider-Man Remastered
          if (appId === '1817070') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/spidermanremastered/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/spidermanremastered/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/spidermanremastered/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for Marvel's Spider-Man 2
          if (appId === '2651280') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/spiderman2/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/spiderman2/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/spiderman2/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for God of War
          if (appId === '1593500') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/gow/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/gow/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/gow/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for God of War Ragnarök
          if (appId === '2322010') {
            if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/gowragnarok/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/gowragnarok/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for The Last of Us Part I
          if (appId === '1888930') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/tlou1/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/tlou1/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/tlou1/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for The Last of Us Part II Remastered
          if (appId === '2531310') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/tlou2/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/tlou2/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/tlou2/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for DRAGON BALL: Sparking! ZERO
          if (appId === '1790600') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/sparkingzero/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/sparkingzero/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/sparkingzero/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for DRAGON BALL Z: KAKAROT
          if (appId === '851850') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/dbzkakarot/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/dbzkakarot/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/dbzkakarot/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for RIDE 5
          if (appId === '1650010') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/ride5/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/ride5/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/ride5/tile.webp' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for Asphalt Legends
          if (appId === '1815780') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/asphaltlegends/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/asphaltlegends/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/asphaltlegends/tile.webp' });
              res.end();
              return;
            }
          }

          // High-Res assets for Counter-Strike 2
          if (appId === '730') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/cs2/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/cs2/hero.webp' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/cs2/tile.webp' });
              res.end();
              return;
            }
          }

          // Special Forza Horizon 6 dedicated assets
          if (appId === '2483190') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/forza6/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/forza6/hero.jpg' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/forza6/tile.jpg' });
              res.end();
              return;
            }
          }

          // Special official PS5 game card artwork for Black Myth: Wukong
          if (appId === '2358720') {
            if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/wukong/ps5_tile.webp' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/wukong/ps5_hero.webp' });
              res.end();
              return;
            }
          }

          // Special local assets for PRAGMATA
          if (appId === '3357650') {
            if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/pragmata/tile.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/pragmata/hero.jpg' });
              res.end();
              return;
            } else if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/pragmata/logo.png' });
              res.end();
              return;
            }
          }

          // Official PS5 assets for Resident Evil 4
          if (appId === '2050650') {
            if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/re4/tile.webp' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/re4/hero.webp' });
              res.end();
              return;
            } else if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/re4/logo.png' });
              res.end();
              return;
            }
          }

          // Special local assets for Resident Evil Requiem
          if (appId === '3764200') {
            if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/rerequiem/tile.jpg' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/rerequiem/hero.jpg' });
              res.end();
              return;
            } else if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/rerequiem/logo.png' });
              res.end();
              return;
            }
          }

          // Special local assets for EA SPORTS FC 27
          if (appId === '4080220') {
            if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/eafc27/tile.jpg' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/eafc27/hero.jpg' });
              res.end();
              return;
            } else if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/eafc27/logo.png' });
              res.end();
              return;
            }
          }

          // Special local assets for Forza Horizon 5
          if (appId === '1551360') {
            if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/forzahorizon5/tile.jpg' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/forzahorizon5/hero.jpg' });
              res.end();
              return;
            } else if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/forzahorizon5/logo.png' });
              res.end();
              return;
            }
          }

          // Special local assets for Forza Motorsport
          if (appId === '2440510') {
            if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/forzamotorsport/tile.jpg' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/forzamotorsport/hero.jpg' });
              res.end();
              return;
            } else if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/forzamotorsport/logo.png' });
              res.end();
              return;
            }
          }

          // Search local Steam librarycache on user's laptop (including modern Steam hash subdirectories)
          function findLocalAsset(id, assetType) {
            // First check MYRAA's verified local high-res game asset cache
            const projectCacheDir = path.join(__dirname, 'public', 'assets', 'cache', 'games', `pc_steam_${id}`);
            if (fs.existsSync(projectCacheDir)) {
              const myraaCandidates = {
                logo: ['logo.png'],
                hero: ['hero.jpg', 'hero.png', 'hero.webp'],
                tile: ['tile.jpg', 'tile.png', 'tile.webp']
              }[assetType] || [];
              for (const fn of myraaCandidates) {
                const p = path.join(projectCacheDir, fn);
                if (fs.existsSync(p)) return p;
              }
            }

            const cacheBase = 'C:/Program Files (x86)/Steam/appcache/librarycache';
            const cacheDir = path.join(cacheBase, id);
            if (!fs.existsSync(cacheDir)) return null;

            const candidateNames = {
              logo: ['logo.png'],
              hero: ['library_hero.jpg', 'hero.jpg'],
              tile: ['library_600x900.jpg', 'library_600x900_2x.jpg', 'library_capsule.jpg', 'library_header.jpg', 'header.jpg'],
              header: ['library_header.jpg', 'header.jpg', 'library_capsule.jpg']
            }[assetType] || [];

            for (const fn of candidateNames) {
              const direct = path.join(cacheDir, fn);
              if (fs.existsSync(direct)) return direct;
            }

            try {
              const entries = fs.readdirSync(cacheDir);
              for (const entry of entries) {
                const sub = path.join(cacheDir, entry);
                if (fs.statSync(sub).isDirectory()) {
                  for (const fn of candidateNames) {
                    const subFile = path.join(sub, fn);
                    if (fs.existsSync(subFile)) return subFile;
                  }
                }
              }
            } catch (e) {}

            return null;
          }

          let localFile = findLocalAsset(appId, type);

          // Check fallback alias if needed
          let targetAppId = appId;
          if (!localFile) {
            if (appId === '4080220') targetAppId = '2669320';
            localFile = findLocalAsset(targetAppId, type);
          }

          if (localFile) {
            const ext = path.extname(localFile).toLowerCase();
            res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            fs.createReadStream(localFile).pipe(res);
            return;
          }

          // Fallback redirect to official Steam CDN
          let cdnUrl = '';
          if (type === 'logo') {
            cdnUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${targetAppId}/logo.png`;
          } else if (type === 'hero') {
            cdnUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${targetAppId}/library_hero.jpg`;
          } else if (type === 'tile') {
            cdnUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${targetAppId}/library_600x900_2x.jpg`;
          } else {
            cdnUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${targetAppId}/header.jpg`;
          }

          res.writeHead(302, { Location: cdnUrl });
          res.end();
        } catch (err) {
          res.statusCode = 500;
          res.end(err.message);
        }
      });

      // 3. Scan Laptop for Steam & PC Games with Real Logos, Covers & 4K Backgrounds
      server.middlewares.use('/api/pc/scan', async (req, res) => {
        if (req.method === 'GET') {
          const detected = [];
          const seenTitles = new Set();
          const seenAppIds = new Set();

          const liveFavData = await syncLiveFavoritesFromSteamClientVite();
          const liveMeta = liveFavData?.meta || {};
          const steamFavorites = liveFavData?.favorites
            ? new Set(liveFavData.favorites.map(String).filter(aid => !isNonGameSteamAppVite(liveMeta[aid]?.title, aid)))
            : getSteamFavoriteAppIdsVite();

          // 3a. Discover all Steam library folders across all drives (from libraryfolders.vdf)
          const candidateSteamDirs = [
            'C:/Program Files (x86)/Steam',
            'C:/Program Files/Steam',
            'C:/Steam',
            'D:/Steam',
            'D:/SteamLibrary',
            'E:/Steam',
            'E:/SteamLibrary'
          ];
          const libraryFolders = [];
          for (const sDir of candidateSteamDirs) {
            const sApps = path.normalize(path.join(sDir, 'steamapps'));
            if (fs.existsSync(sApps)) {
              if (!libraryFolders.some(lf => lf.toLowerCase() === sApps.toLowerCase())) {
                libraryFolders.push(sApps);
              }
              const libVdfPath = path.join(sApps, 'libraryfolders.vdf');
              if (fs.existsSync(libVdfPath)) {
                try {
                  const vdfContent = fs.readFileSync(libVdfPath, 'utf-8');
                  const pathMatches = [...vdfContent.matchAll(/"path"\s+"([^"]+)"/g)];
                  for (const pm of pathMatches) {
                    const normalized = path.normalize(path.join(pm[1].replace(/\\\\/g, path.sep), 'steamapps'));
                    if (!libraryFolders.some(lf => lf.toLowerCase() === normalized.toLowerCase()) && fs.existsSync(normalized)) {
                      libraryFolders.push(normalized);
                    }
                  }
                } catch (e) {}
              }
            }
          }

          // 3b. Scan Steam App Manifests in all library folders
          for (const sApps of libraryFolders) {
            if (!fs.existsSync(sApps)) continue;
            try {
              const files = fs.readdirSync(sApps);
              for (const file of files) {
                if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
                  const content = fs.readFileSync(path.join(sApps, file), 'utf-8');
                  const matchName = content.match(/"name"\s+"([^"]+)"/);
                  const matchDir = content.match(/"installdir"\s+"([^"]+)"/);
                  const matchAppId = content.match(/"appid"\s+"([^"]+)"/);
                  if (matchName && matchDir) {
                    const appId = matchAppId ? String(matchAppId[1]).trim() : '';
                    const name = liveMeta[appId]?.title || matchName[1];
                    const dirName = matchDir[1];

                    // Enforce strict Favorites-only Steam library sync
                    if (!appId || !steamFavorites.has(String(appId))) continue;

                    if (!name.toLowerCase().includes('steamworks') &&
                        !name.toLowerCase().includes('redistributable') &&
                        !name.toLowerCase().includes('controller config') &&
                        !isNonGameSteamAppVite(name, appId)) {
                      
                      const flags = parseInt(content.match(/"StateFlags"\s+"([^"]+)"/)?.[1] || '0', 10);
                      const hasActiveDownloadFlags = (flags & (256 | 512 | 1024 | 16)) !== 0 || flags === 1042;
                      const hasDownloadingFolder = fs.existsSync(path.join(sApps, 'downloading', appId));
                      const isDownloading = hasActiveDownloadFlags || ((flags & 4) === 0 && hasDownloadingFolder);

                      if (appId && seenAppIds.has(appId)) continue;
                      if (seenTitles.has(name.toLowerCase())) continue;
                      const isStateFullyInstalled = (flags & 4) !== 0 && !hasActiveDownloadFlags;
                      const fullDir = path.join(sApps, 'common', dirName);
                      const exePath = findBestExe(fullDir, dirName);
                      const isReallyInstalled = Boolean(isStateFullyInstalled && exePath && fs.existsSync(exePath));

                      seenTitles.add(name.toLowerCase());
                      seenTitles.add(dirName.toLowerCase());
                      if (appId) seenAppIds.add(appId);

                      const dbMeta = (STEAM_LIBRARY_DATABASE[appId] && STEAM_LIBRARY_DATABASE[appId] !== null) ? STEAM_LIBRARY_DATABASE[appId] : {};

                      const matchSizeOnDisk = content.match(/"SizeOnDisk"\s+"([^"]+)"/);
                      let manifestSize = '';
                      if (matchSizeOnDisk) {
                        const bytes = parseInt(matchSizeOnDisk[1], 10);
                        if (!isNaN(bytes) && bytes > 0) {
                          manifestSize = bytes >= 1073741824
                            ? (bytes / 1073741824).toFixed(1) + ' GB'
                            : Math.round(bytes / 1048576) + ' MB';
                        }
                      }
                      if (!manifestSize) {
                        const matchBToDl = content.match(/"BytesToDownload"\s+"([^"]+)"/);
                        if (matchBToDl && parseInt(matchBToDl[1], 10) > 0) {
                          manifestSize = (parseInt(matchBToDl[1], 10) / 1073741824).toFixed(1) + ' GB';
                        }
                      }
                      const exactSize = manifestSize || dbMeta.downloadSize || (isReallyInstalled ? '52.1 GB' : 'Ready to Download');
                      const statusBadge = isReallyInstalled ? 'Installed' : (isDownloading ? ((flags & 512) ? 'Paused' : 'Downloading') : 'Owned');

                      const playMins = Number(liveMeta[appId]?.playtimeMinutes || 0);
                      const playTimeText = playMins >= 60
                        ? `${Math.floor(playMins / 60)} hrs ${playMins % 60 > 0 ? (playMins % 60) + 'm' : ''}`.trim()
                        : (playMins > 0 ? `${playMins} mins` : (isReallyInstalled ? 'Ready to Play' : 'Ready to Download'));

                      detected.push({
                        id: 'pc_steam_' + (appId || name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()),
                        appId: appId,
                        store: 'steam',
                        storeName: 'Steam',
                        title: dbMeta.title || name,
                        studio: dbMeta.studio || (isDownloading ? 'Steam Library • Active Download' : 'Steam Library • Favorite'),
                        genre: isReallyInstalled ? (dbMeta.genre || 'Installed on Laptop') : (isDownloading ? 'Action • Steam Download' : 'Steam Library • Favorite'),
                        execPath: exePath,
                        launchUri: appId ? `steam://rungameid/${appId}` : '',
                        logoImg: appId ? `/api/pc/asset?appId=${appId}&type=logo` : '',
                        heroBg: appId ? `/api/pc/asset?appId=${appId}&type=hero` : '',
                        tileIcon: appId ? `/api/pc/asset?appId=${appId}&type=tile` : '',
                        installDir: fullDir,
                        installed: isReallyInstalled,
                        isDownloading: isDownloading,
                        favorite: true,
                        playTime: playTimeText,
                        lastPlayed: liveMeta[appId]?.lastPlayed || 0,
                        status: isDownloading ? ((flags & 512) ? 'Paused' : 'Downloading') : undefined,
                        badge: statusBadge,
                        installSize: exactSize,
                        storageType: isReallyInstalled ? 'Laptop SSD (Steam Library)' : (isDownloading ? 'Steam Library (Downloading)' : 'Steam Library (Ready to Download)'),
                        liveStatus: isReallyInstalled ? `Installed on Laptop • ${exactSize} Ready` : (isDownloading ? `Downloading on Steam • ${exactSize}` : `Steam Favorite • ${exactSize} Download`)
                      });
                    }
                  }
                }
              }
            } catch (e) {}
          }

          // 3c & 3d. Ensure ALL remaining live Steam Favorites (cloud / ready to download) are synced cleanly
          for (const aid of steamFavorites) {
            if (seenAppIds.has(aid) || isNonGameSteamAppVite(liveMeta[aid]?.title, aid)) continue;
            const meta = STEAM_LIBRARY_DATABASE[aid] || {};
            const liveInfo = liveMeta[aid] || {};
            const title = liveInfo.title || meta.title || `Steam App ${aid}`;
            const isCdpInstalled = Boolean(liveInfo.installed);
            const cdpBytes = Number(liveInfo.sizeOnDisk || 0);
            const cdpSizeStr = cdpBytes > 0
              ? (cdpBytes >= 1073741824 ? (cdpBytes / 1073741824).toFixed(1) + ' GB' : Math.round(cdpBytes / 1048576) + ' MB')
              : '';
            const playMins = Number(liveInfo.playtimeMinutes || 0);
            const playTimeText = playMins >= 60
              ? `${Math.floor(playMins / 60)} hrs ${playMins % 60 > 0 ? (playMins % 60) + 'm' : ''}`.trim()
              : (playMins > 0 ? `${playMins} mins` : (isCdpInstalled ? 'Ready to Play' : 'Ready to Download'));

            seenAppIds.add(aid);
            seenTitles.add(title.toLowerCase());

            const exactSize = cdpSizeStr || meta.downloadSize || 'Ready to Download';

            detected.push({
              id: 'pc_steam_' + aid,
              appId: aid,
              store: 'steam',
              storeName: 'Steam',
              title: title,
              studio: meta.studio || 'Steam Library • Favorite',
              genre: meta.genre || (isCdpInstalled ? 'Installed on Laptop' : 'Steam Library • Favorite'),
              execPath: '',
              launchUri: `steam://rungameid/${aid}`,
              logoImg: `/api/pc/asset?appId=${aid}&type=logo`,
              heroBg: `/api/pc/asset?appId=${aid}&type=hero`,
              tileIcon: `/api/pc/asset?appId=${aid}&type=tile`,
              installed: isCdpInstalled,
              badge: isCdpInstalled ? 'Installed' : 'Owned',
              favorite: true,
              playTime: playTimeText,
              lastPlayed: liveInfo.lastPlayed || 0,
              installSize: exactSize,
              storageType: isCdpInstalled ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)',
              liveStatus: isCdpInstalled ? `Installed on Laptop • ${exactSize} Ready` : `Steam Favorite • ${exactSize} Download`
            });
          }

          // 3e. Detect Valorant & Riot Games
          const riotClientCandidates = [
            'C:\\Riot Games\\Riot Client\\RiotClientServices.exe',
            'D:\\Riot Games\\Riot Client\\RiotClientServices.exe',
            'E:\\Riot Games\\Riot Client\\RiotClientServices.exe'
          ];
          const valorantDirCandidates = [
            'C:\\Riot Games\\VALORANT',
            'D:\\Riot Games\\VALORANT',
            'E:\\Riot Games\\VALORANT'
          ];
          const riotClientExe = riotClientCandidates.find(p => fs.existsSync(p)) || '';
          const isInstalled = valorantDirCandidates.some(p => fs.existsSync(p)) && Boolean(riotClientExe);
          if (isInstalled) {
            detected.unshift({
              id: 'pc_valorant',
              appId: 'valorant',
              store: 'riot',
              storeName: 'Riot Games',
              title: 'VALORANT',
              studio: 'Riot Games • Tactical Hero Shooter',
              genre: 'Installed on Laptop',
              execPath: riotClientExe,
              execArgs: '--launch-product=valorant --launch-patchline=live',
              launchUri: '',
              logoImg: '/assets/games/valorant/ps5_logo.png',
              heroBg: '/assets/games/valorant/ps5_gamehub_cover.png',
              tileIcon: '/assets/games/valorant/ps5_master.png',
              installed: true,
              badge: 'Installed',
              installSize: '45.2 GB',
              storageType: 'Laptop SSD (Riot Games)',
              liveStatus: 'Installed on Laptop • Low Latency 240FPS Vanguard Active'
            });
          }

          // 3f. Scan Epic Games Store Manifests
          const epicManifestDir = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests';
          if (fs.existsSync(epicManifestDir)) {
            try {
              const eFiles = fs.readdirSync(epicManifestDir);
              for (const ef of eFiles) {
                if (ef.endsWith('.item')) {
                  try {
                    const item = JSON.parse(fs.readFileSync(path.join(epicManifestDir, ef), 'utf-8'));
                    if (item.DisplayName && item.AppName && !seenTitles.has(item.DisplayName.toLowerCase())) {
                      seenTitles.add(item.DisplayName.toLowerCase());
                      const exe = item.LaunchExecutable ? path.join(item.InstallLocation || '', item.LaunchExecutable) : '';
                      detected.push({
                        id: 'epic_' + item.AppName,
                        appId: item.AppName,
                        store: 'epic',
                        storeName: 'Epic Games',
                        title: item.DisplayName,
                        studio: 'Epic Games Launcher • PC Game',
                        genre: 'Installed on Laptop',
                        badge: 'Installed',
                        installed: true,
                        installSize: 'Epic Install',
                        storageType: 'Laptop SSD (Epic Games)',
                        liveStatus: 'Installed on Laptop • Ready to Launch via Epic',
                        execPath: exe,
                        launchUri: `com.epicgames.launcher://apps/${item.AppName}?action=launch&silent=true`
                      });
                    }
                  } catch (e) {}
                }
              }
            } catch (e) {}
          }

          // 3g. Scan Xbox / PC Game Pass directories
          const normXboxKey = (t) => stripXboxPlatformSuffix(t).toLowerCase().replace(/[^a-z0-9]/g, '');
          const xboxDirs = ['C:\\XboxGames', 'D:\\XboxGames'];
          for (const xDir of xboxDirs) {
            if (fs.existsSync(xDir)) {
              try {
                const xFolders = fs.readdirSync(xDir);
                for (const xf of xFolders) {
                  const xfKey = normXboxKey(xf);
                  if (!xf.toLowerCase().includes('myraa') && !xf.toLowerCase().includes('save') && !xf.toLowerCase().includes('minecraft launcher') && !xf.startsWith('.') && !seenTitles.has(xf.toLowerCase()) && !detected.some(g => normXboxKey(g.title) === xfKey)) {
                    const fullX = path.join(xDir, xf);
                    if (fs.statSync(fullX).isDirectory()) {
                      const hasCfg = fs.existsSync(path.join(fullX, 'MicrosoftGame.config')) || fs.existsSync(path.join(fullX, 'Content', 'MicrosoftGame.config'));
                      let hasExe = false;
                      try {
                        hasExe = fs.readdirSync(fullX).some(f => f.toLowerCase().endsWith('.exe'));
                      } catch (e) {}
                      if (!hasCfg && !hasExe) continue;

                      seenTitles.add(xf.toLowerCase());
                      detected.push({
                        id: 'xbox_' + xf.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
                        store: 'xbox',
                        storeName: 'Xbox Game Pass',
                        title: xf,
                        studio: 'Xbox Game Studios • PC Game Pass',
                        genre: 'Installed on Laptop',
                        badge: 'Installed',
                        installed: true,
                        installSize: 'Xbox Install',
                        storageType: `Laptop Storage (${xDir})`,
                        liveStatus: 'Installed on Laptop • Ready to Launch via Xbox',
                        launchUri: 'xbox://'
                      });
                    }
                  }
                }
              } catch (e) {}
            }
          }

          // 3h. Signed-in Xbox App (Microsoft.GamingApp) account library & artwork
          try {
            const seenNorms = new Set([...seenTitles].map(t => normXboxKey(t)));
            const xboxAccount = readXboxAccountGames();
            for (const xg of xboxAccount.games) {
              if (!xg || !xg.title) continue;
              const tLow = xg.title.toLowerCase();
              const tNorm = normXboxKey(xg.title);
              if (!tNorm) continue;
              const existingByTitle = detected.find(g => normXboxKey(g.title) === tNorm);
              if (existingByTitle) {
                if (existingByTitle.store === 'xbox') {
                  mergeXboxMetadataIntoRecord(existingByTitle, xg);
                }
                seenTitles.add(tLow);
                seenNorms.add(tNorm);
                continue;
              }
              if (seenTitles.has(tLow) || seenNorms.has(tNorm)) continue;
              seenTitles.add(tLow);
              seenNorms.add(tNorm);
              detected.push(xg);
            }
          } catch (e) {}

          // Deduplicate detected games across manifests, loose folders, localconfig, epic, and xbox
          const dedupedDetected = [];
          for (const g of detected) {
            if (!g) continue;
            const existing = dedupedDetected.find(e => {
              if (e.id && g.id && e.id === g.id) return true;
              if (e.appId && g.appId && String(e.appId).trim() === String(g.appId).trim()) return true;
              if (e.execPath && g.execPath && e.execPath.trim().toLowerCase() === g.execPath.trim().toLowerCase()) return true;
              return false;
            });
            if (!existing) {
              dedupedDetected.push(g);
            } else if (g.installed && !existing.installed) {
              existing.installed = true;
              existing.badge = 'Installed';
              if (g.execPath) existing.execPath = g.execPath;
              if (g.storageType) existing.storageType = g.storageType;
              if (g.liveStatus) existing.liveStatus = g.liveStatus;
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            games: dedupedDetected,
            steamFavorites: [...steamFavorites],
            steamSynced: true
          }));
        }
      });

      // 4. Multi-Store Sync Endpoint Alias
      server.middlewares.use('/api/pc/sync-all-stores', (req, res) => {
        req.url = '/api/pc/scan';
        // Forward internally
        const scanHandler = server.middlewares.stack.find(m => m.route === '/api/pc/scan');
        if (scanHandler && scanHandler.handle) {
          scanHandler.handle(req, res);
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, games: [] }));
        }
      });

      // 5. Cache Artwork to Disk Endpoint
      server.middlewares.use('/api/pc/cache-artwork', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { gameId, tileDataUrl, heroDataUrl, logoDataUrl } = JSON.parse(body || '{}');
              if (!gameId) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ success: false, error: 'No gameId' }));
              }
              const safeId = gameId.replace(/[^a-zA-Z0-9_-]/g, '_');
              const baseDir = import.meta.dirname || process.cwd();
              const cacheDir = path.join(baseDir, 'public', 'assets', 'cache', 'games', safeId);
              if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
              }

              const appIdMatch = gameId.match(/pc_steam_(\d+)/);
              const appId = appIdMatch ? appIdMatch[1] : null;
              const saved = {};
              const timestamp = Date.now();

              async function saveImg(source, fn) {
                if (source && typeof source === 'string') {
                  if (source.includes('base64,')) {
                    const buf = Buffer.from(source.split('base64,')[1], 'base64');
                    fs.writeFileSync(path.join(cacheDir, fn), buf);
                    return `/assets/cache/games/${safeId}/${fn}?t=${timestamp}`;
                  }
                  if (source.startsWith('http://') || source.startsWith('https://')) {
                    try {
                      const resp = await fetch(source);
                      if (resp.ok && (resp.headers.get('content-type') || '').startsWith('image/')) {
                        const arrBuf = await resp.arrayBuffer();
                        const buf = Buffer.from(arrBuf);
                        if (buf.length < 1024) return null;
                        fs.writeFileSync(path.join(cacheDir, fn), buf);
                        return `/assets/cache/games/${safeId}/${fn}?t=${timestamp}`;
                      }
                    } catch (e) {}
                  }
                  if (source.startsWith('/assets/')) {
                    return source;
                  }
                }

                // Check local Steam librarycache
                if (appId) {
                  for (const sDir of candidateSteamDirs) {
                    const lcDir = path.join(sDir, 'appcache', 'librarycache', appId);
                    if (fs.existsSync(lcDir)) {
                      const candidateFiles = fn === 'tile.jpg'
                        ? ['library_600x900_2x.jpg', 'library_600x900.jpg', 'library_capsule.jpg']
                        : fn === 'hero.jpg'
                        ? ['library_hero.jpg', 'hero.jpg']
                        : ['logo.png'];
                      for (const cFn of candidateFiles) {
                        const localSrc = path.join(lcDir, cFn);
                        if (fs.existsSync(localSrc)) {
                          fs.copyFileSync(localSrc, path.join(cacheDir, fn));
                          return `/assets/cache/games/${safeId}/${fn}?t=${timestamp}`;
                        }
                      }
                    }
                  }

                  // Fallback fetch from Steam Akamai CDN
                  try {
                    const cdnPath = fn === 'tile.jpg'
                      ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900_2x.jpg`
                      : fn === 'hero.jpg'
                      ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`
                      : `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/logo.png`;
                    const resp = await fetch(cdnPath);
                    if (resp.ok) {
                      const arrBuf = await resp.arrayBuffer();
                      fs.writeFileSync(path.join(cacheDir, fn), Buffer.from(arrBuf));
                      return `/assets/cache/games/${safeId}/${fn}?t=${timestamp}`;
                    }
                  } catch (e) {}
                }

                return null;
              }

              if (tileDataUrl || appId) saved.tileIcon = await saveImg(tileDataUrl, 'tile.jpg');
              if (heroDataUrl || appId) saved.heroBg = await saveImg(heroDataUrl, 'hero.jpg');
              if (logoDataUrl || appId) saved.logoImg = await saveImg(logoDataUrl, 'logo.png');

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, saved }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });

      // 6. Steam Store Search Proxy Endpoint (Resolves Browser Dev Mode CORS)
      server.middlewares.use('/api/steam/search', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const term = urlObj.searchParams.get('term') || '';
          const steamApiUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`;
          const steamRes = await fetch(steamApiUrl);
          const data = await steamRes.json();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(data));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: err.message, items: [] }));
        }
      });

      // Steam Store app details provide hashed, currently valid artwork URLs.
      server.middlewares.use('/api/steam/appdetails', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const appId = urlObj.searchParams.get('appId') || '';
          if (!/^\d+$/.test(appId)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Invalid Steam appId' }));
            return;
          }
          const steamRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=US`);
          const payload = await steamRes.json();
          const entry = payload?.[appId];
          const data = entry?.success ? entry.data : null;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(data ? {
            success: true,
            appId,
            name: data.name,
            header_image: data.header_image || data.capsule_image || '',
            background_raw: data.background_raw || '',
            background: data.background || '',
            screenshots: Array.isArray(data.screenshots)
              ? data.screenshots.map(item => ({ path_full: item.path_full })).filter(item => item.path_full)
              : []
          } : { success: false, appId }));
        } catch (err) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [pcLauncherPlugin()],
  server: {
    port: 5173
  }
});
