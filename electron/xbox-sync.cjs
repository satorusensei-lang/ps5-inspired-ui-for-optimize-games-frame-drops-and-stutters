const fs = require('fs');
const path = require('path');

let DatabaseSync = null;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (e) {}

function pickXboxArtworkUri(artworkList, purposes = []) {
  if (!Array.isArray(artworkList)) return '';
  for (const purpose of purposes) {
    const matches = artworkList.filter(a => a && a.purpose === purpose && a.uri);
    if (matches.length > 0) {
      // Prefer largest resolution for crisp 4K / square card rendering
      matches.sort((a, b) => (Number(b.width || 0) * Number(b.height || 0)) - (Number(a.width || 0) * Number(a.height || 0)));
      return String(matches[0].uri).replace(/^http:\/\//i, 'https://');
    }
  }
  return '';
}

function stripXboxPlatformSuffix(title) {
  let s = String(title || '').trim();
  let prev;
  do {
    prev = s;
    s = s
      .replace(/\s*[\(\[]\s*(?:windows(?:\s*(?:10|11))?|pc(?:\s*edition)?)\s*[\)\]]\s*$/i, '')
      .replace(/\s*(?:[-:–—|•]\s*|\bfor\s+)(?:windows(?:\s*(?:10|11))?(?:\s*edition)?|pc(?:\s*edition)?)\s*$/i, '')
      .trim();
  } while (s !== prev);
  return s;
}

function isXboxTitleInstalledOnDisk(title, productId, pfn) {
  const driveLetters = [];
  for (let code = 67; code <= 90; code++) {
    const d = String.fromCharCode(code);
    try {
      if (fs.existsSync(`${d}:\\`)) driveLetters.push(d);
    } catch (e) {}
  }
  const rawTitle = String(title || '').trim();
  const baseTitle = stripXboxPlatformSuffix(rawTitle);
  const cleanTitle = rawTitle.replace(/[™®:]/g, '').trim();
  const cleanBaseTitle = baseTitle.replace(/[™®:]/g, '').trim();
  const folderCandidates = [...new Set([rawTitle, baseTitle, cleanTitle, cleanBaseTitle].filter(Boolean))];

  for (const d of driveLetters) {
    const roots = [`${d}:\\XboxGames`];
    try {
      const grFile = `${d}:\\.GamingRoot`;
      if (fs.existsSync(grFile)) {
        const raw = fs.readFileSync(grFile);
        const decoded = raw.toString('utf16le').replace(/\0/g, '').trim();
        const folderMatch = decoded.match(/[A-Za-z0-9 _().-]+$/);
        if (folderMatch && folderMatch[0]) {
          const customRoot = path.join(`${d}:\\`, folderMatch[0].trim());
          if (!roots.includes(customRoot) && fs.existsSync(customRoot)) roots.push(customRoot);
        }
      }
    } catch (e) {}

    for (const rootDir of roots) {
      for (const folder of folderCandidates) {
        const xboxPath = path.join(rootDir, folder);
        try {
          if (fs.existsSync(xboxPath) && fs.statSync(xboxPath).isDirectory()) {
            if (
              fs.existsSync(path.join(xboxPath, 'MicrosoftGame.config')) ||
              fs.existsSync(path.join(xboxPath, 'Content', 'MicrosoftGame.config')) ||
              fs.existsSync(path.join(xboxPath, 'Content', 'appxmanifest.xml')) ||
              fs.readdirSync(xboxPath).some(f => f.toLowerCase().endsWith('.exe'))
            ) {
              return true;
            }
          }
        } catch (e) {}
      }
    }
  }

  if (pfn && process.env.LOCALAPPDATA) {
    try {
      const pkgDir = path.join(process.env.LOCALAPPDATA, 'Packages', String(pfn));
      if (fs.existsSync(pkgDir)) return true;
    } catch (e) {}
  }

  return false;
}

const IGNORED_XBOX_NON_GAME_PATTERNS = [
  /^minecraft launcher$/i,
  /\b(add-on|addon|dlc|expansion pack|soundtrack|content pack|skin pack|mash-up|texture pack|starter pack|welcome pack|car pack|bundle pack|vip membership|currency|coins|vbucks|minecoins|cod points)\b/i,
  /\b(candy crush|microsoft solitaire|solitaire collection|microsoft mahjong|microsoft minesweeper|microsoft sudoku|xbox insider hub|gaming services|xbox app)\b/i
];

function isExcludedXboxTitleOrProduct(title, product, entitlement) {
  const clean = stripXboxPlatformSuffix(title) || String(title || '').trim();
  if (!clean) return true;
  if (IGNORED_XBOX_NON_GAME_PATTERNS.some(rx => rx.test(clean))) return true;
  if (product?.productKind && String(product.productKind).toUpperCase() !== 'GAME') return true;
  if (entitlement) {
    if (String(entitlement.Status || '').toLowerCase() !== 'active') return true;
    if (String(entitlement.ProductKind || '').toLowerCase() !== 'game') return true;
    if (entitlement.IsTrial === true || String(entitlement.SkuType || '').toLowerCase() === 'trial') return true;
  }
  const platforms = Array.isArray(product?.availablePlatforms) ? product.availablePlatforms : null;
  if (platforms && platforms.length > 0) {
    const supportsPc = platforms.some(p => /^(pc|windows|desktop)$/i.test(String(p || '').trim()));
    if (!supportsPc) return true;
  }
  if (/[-–—]\s*xbox\s*$/i.test(String(title || '').trim())) return true;
  return false;
}

function findBestEntitlementsCacheFiles(msaIdHex) {
  const results = { entitlementsFiles: [], minimalLibFiles: [] };
  if (!process.env.LOCALAPPDATA) return results;
  try {
    const pkgsDir = path.join(process.env.LOCALAPPDATA, 'Packages');
    if (!fs.existsSync(pkgsDir)) return results;
    const storePkg = fs.readdirSync(pkgsDir).find(n => n.startsWith('Microsoft.WindowsStore_'));
    if (!storePkg) return results;
    const localCacheDir = path.join(pkgsDir, storePkg, 'LocalCache');
    if (!fs.existsSync(localCacheDir)) return results;

    const files = fs.readdirSync(localCacheDir);
    const pickMatching = (suffix) => {
      const candidates = files
        .filter(f => f.endsWith(suffix))
        .map(f => {
          const fullPath = path.join(localCacheDir, f);
          let mtimeMs = 0;
          try { mtimeMs = fs.statSync(fullPath).mtimeMs; } catch (e) {}
          return { name: f, fullPath, mtimeMs };
        });
      if (msaIdHex) {
        const exact = candidates.find(c => c.name.toUpperCase().startsWith(`MSA${msaIdHex}_`));
        if (exact) return [exact.fullPath];
      }
      candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
      return candidates.slice(0, 1).map(c => c.fullPath);
    };

    results.entitlementsFiles = pickMatching('_PersistentEntitlementsCache.json');
    results.minimalLibFiles = pickMatching('_MinimalLibraryCache.json');
  } catch (e) {}
  return results;
}

/**
 * Reads genuine owned Xbox / Microsoft Store PC games for the signed-in account:
 * - Uses Windows Store PersistentEntitlementsCache (Active, Full, non-Trial Game entitlements)
 *   enriched with Xbox GamingApp AsyncCache metadata (product_summary artwork/titleId/stats).
 * - Never synthesizes unowned games from Xbox Live achievements/played history or Add-Ons/DLC.
 */
function readXboxAccountGames() {
  const empty = { xuid: '', gamertag: '', games: [] };
  if (!process.env.LOCALAPPDATA) return empty;

  let gamingAppPkg = '';
  try {
    const pkgsDir = path.join(process.env.LOCALAPPDATA, 'Packages');
    if (fs.existsSync(pkgsDir)) {
      gamingAppPkg = fs.readdirSync(pkgsDir).find(n => n.startsWith('Microsoft.GamingApp_')) || '';
    }
  } catch (e) {}

  const dbPath = gamingAppPkg
    ? path.join(process.env.LOCALAPPDATA, 'Packages', gamingAppPkg, 'LocalState', 'AsyncCache.db')
    : '';

  let db = null;
  try {
    let xuid = '';
    let gamertag = '';
    let msaIdHex = '';
    let getProdSummaryStmt = null;
    let getStatsStmt = null;

    if (DatabaseSync && dbPath && fs.existsSync(dbPath)) {
      db = new DatabaseSync(dbPath, { readOnly: true });
      const profRow = db.prepare("SELECT key, value FROM AsyncCache WHERE scope='user_profile' LIMIT 1").get();
      if (profRow && profRow.value) {
        const prof = JSON.parse(profRow.value);
        xuid = String(prof.xuid || profRow.key || '').trim();
        gamertag = String(prof.gamertag?.uniqueGamertag || prof.gamertag?.legacyGamertag || '').trim();
      }
      try {
        const subsRow = db.prepare("SELECT value FROM AsyncCache WHERE scope='user_subscriptions' AND key='subscriptions' LIMIT 1").get();
        if (subsRow?.value) {
          const subs = JSON.parse(subsRow.value);
          const firstMsaKey = Object.keys(subs || {}).find(k => k && k.length >= 8);
          if (firstMsaKey) {
            msaIdHex = Buffer.from(firstMsaKey, 'utf8').toString('hex').toUpperCase();
          }
        }
      } catch (e) {}

      getProdSummaryStmt = db.prepare("SELECT value FROM AsyncCache WHERE scope='product_summary' AND key=?");
      getStatsStmt = xuid
        ? db.prepare("SELECT value FROM AsyncCache WHERE scope='achievements' AND key=?")
        : null;
    }

    const { entitlementsFiles, minimalLibFiles } = findBestEntitlementsCacheFiles(msaIdHex);
    const minimalLibByPid = new Map();
    for (const mlFile of minimalLibFiles) {
      try {
        const mlJson = JSON.parse(fs.readFileSync(mlFile, 'utf8'));
        for (const item of (Array.isArray(mlJson?.Items) ? mlJson.Items : [])) {
          const pid = String(item?.ProductId || '').trim().toUpperCase();
          if (pid && !minimalLibByPid.has(pid)) minimalLibByPid.set(pid, item);
        }
      } catch (e) {}
    }

    const ownedEntitlements = new Map();
    for (const entFile of entitlementsFiles) {
      try {
        const entJson = JSON.parse(fs.readFileSync(entFile, 'utf8'));
        for (const ent of (Array.isArray(entJson?.Entitlements) ? entJson.Entitlements : [])) {
          const pid = String(ent?.ProductId || '').trim().toUpperCase();
          if (!pid) continue;
          if (String(ent?.Status || '').toLowerCase() !== 'active') continue;
          if (String(ent?.ProductKind || '').toLowerCase() !== 'game') continue;
          if (ent?.IsTrial === true || String(ent?.SkuType || '').toLowerCase() === 'trial') continue;
          if (!ownedEntitlements.has(pid)) ownedEntitlements.set(pid, ent);
        }
      } catch (e) {}
    }

    const games = [];
    const seenProductIds = new Set();

    for (const [productId, ent] of ownedEntitlements.entries()) {
      if (seenProductIds.has(productId)) continue;
      seenProductIds.add(productId);

      let product = null;
      if (getProdSummaryStmt) {
        try {
          const sumRow = getProdSummaryStmt.get(productId);
          if (sumRow?.value) {
            const parsedSum = JSON.parse(sumRow.value);
            product = parsedSum?.data || parsedSum;
          }
        } catch (e) {}
      }

      const minimalItem = minimalLibByPid.get(productId) || null;
      // Require Xbox App catalog summary OR Gaming family in Store Library cache so Windows inbox mobile tiles are skipped
      if (!product && minimalItem?.ProductFamilyName !== 'Gaming') continue;

      const rawTitle = String(product?.title || minimalItem?.Title || '').trim();
      const title = stripXboxPlatformSuffix(rawTitle) || rawTitle;
      if (isExcludedXboxTitleOrProduct(rawTitle, product, ent)) continue;
      if (productId === '9PGW18NPBZV5') continue; // Minecraft Launcher

      const altIds = Array.isArray(product?.alternateIds) ? product.alternateIds : [];
      const titleId = String(altIds.find(a => a && a.idType === 'XBOXTITLEID')?.id || '').trim();
      const pfn = String(altIds.find(a => a && a.idType === 'PACKAGEFAMILYNAME')?.id || '').trim();

      let playMins = 0;
      if (getStatsStmt && titleId && xuid) {
        try {
          const statsRow = getStatsStmt.get(`userStats_${xuid}_${titleId}`);
          if (statsRow?.value) {
            const statsArr = JSON.parse(statsRow.value);
            if (Array.isArray(statsArr)) {
              const mp = statsArr.find(s => s && s.name === 'MinutesPlayed' && s.value !== undefined);
              if (mp) playMins = Number(mp.value) || 0;
            }
          }
        } catch (e) {}
      }

      const installed = isXboxTitleInstalledOnDisk(rawTitle, productId, pfn);
      // Skip non-XboxStore casual entries that aren't installed unless verified in Xbox PC catalog
      if (!product && !installed) continue;

      const artworkList = Array.isArray(product?.artwork) ? product.artwork : [];
      const libIconFallback = minimalItem?.LogoImage ? String(minimalItem.LogoImage).replace(/^http:\/\//i, 'https://') : '';

      const tileIcon = pickXboxArtworkUri(artworkList, ['BOXART', 'FEATUREPROMOTIONALSQUAREART', 'POSTER', 'TITLEDHEROART']) || libIconFallback;
      const heroBg = pickXboxArtworkUri(artworkList, ['SUPERHEROART', 'TITLEDHEROART', 'BOXART']) || tileIcon;
      let logoImg = '';
      if (title.toLowerCase() === 'fortnite') {
        logoImg = '/assets/games/fortnite/logo.png';
      } else if (/^minecraft(?::\s*(?:java|bedrock|windows).*|\s+for\s+windows)?$/i.test(title)) {
        logoImg = '/assets/games/minecraft/logo.png';
      }

      const playTimeText = playMins >= 60
        ? `${Math.floor(playMins / 60)} hrs${playMins % 60 > 0 ? ` ${playMins % 60}m` : ''}`
        : (playMins > 0 ? `${playMins} mins` : (installed ? 'Ready to Play' : 'Owned in Library'));

      const studio = [product?.developer, product?.publisher || minimalItem?.PublisherName]
        .filter((v, i, arr) => v && arr.indexOf(v) === i)
        .join(' • ') || 'Xbox Network • PC';

      const genre = Array.isArray(product?.categories) && product.categories.length > 0
        ? product.categories.slice(0, 2).join(' • ')
        : (installed ? 'Installed on Laptop • Xbox' : 'Owned • Xbox Store');

      games.push({
        id: titleId ? `xbox_id_${titleId}` : `xbox_pid_${productId}`,
        appId: '',
        xboxTitleId: titleId,
        productId,
        store: 'xbox',
        storeName: gamertag ? `Xbox (${gamertag})` : 'Xbox',
        title,
        studio,
        genre,
        logoImg,
        tileIcon,
        heroBg,
        installed,
        xboxOwnedVerified: true,
        badge: installed ? 'Installed' : 'Owned',
        installSize: installed ? 'Xbox Install' : 'Xbox Store',
        playTime: playTimeText,
        storageType: installed ? 'Laptop SSD (Xbox App)' : `Xbox ID (${gamertag || 'Signed In'})`,
        liveStatus: installed
          ? `Installed on Laptop • Xbox (${gamertag || 'Connected'})`
          : `Owned on Xbox (${gamertag || 'Signed In'}) • Ready to Install`,
        activities: [
          {
            id: `xbox_act_${titleId || productId}`,
            title: installed ? `Launch ${title}` : `Install ${title} via Xbox`,
            tag: gamertag ? `Xbox • ${gamertag}` : 'Xbox App',
            progress: installed ? 100 : 0,
            timeEst: installed ? 'Launch' : 'Install'
          }
        ],
        launchUri: productId ? `msxbox://game/?productId=${productId}` : 'xbox://'
      });
    }

    return { xuid, gamertag, games };
  } catch (e) {
    return empty;
  } finally {
    if (db) {
      try { db.close(); } catch (e) {}
    }
  }
}

/**
 * Merges Xbox Account metadata & Store artwork onto a matching Xbox record
 * (e.g. an installed C:\XboxGames folder scan entry) without duplicating it.
 */
function mergeXboxMetadataIntoRecord(target, source) {
  if (!target || !source || target === source) return target;
  if (source.installed && !target.installed) {
    target.installed = true;
    target.badge = 'Installed';
  }
  if (!target.tileIcon && source.tileIcon) target.tileIcon = source.tileIcon;
  if (!target.heroBg && source.heroBg) target.heroBg = source.heroBg;
  if (!target.logoImg && source.logoImg) target.logoImg = source.logoImg;
  if (!target.xboxTitleId && source.xboxTitleId) target.xboxTitleId = source.xboxTitleId;
  if (!target.productId && source.productId) target.productId = source.productId;
  if ((!target.launchUri || target.launchUri === 'xbox://') && source.launchUri && source.launchUri !== 'xbox://') {
    target.launchUri = source.launchUri;
  }
  if ((!target.studio || target.studio === 'Xbox Game Studios • PC Game Pass') && source.studio) {
    target.studio = source.studio;
  }
  if ((!target.genre || target.genre === 'Installed on PC' || target.genre === 'Installed on Laptop') && source.genre) {
    target.genre = source.genre;
  }
  if ((!target.playTime || target.playTime === 'Ready to Play') && source.playTime) {
    target.playTime = source.playTime;
  }
  if ((!target.storeName || target.storeName === 'Xbox Game Pass') && source.storeName) {
    target.storeName = source.storeName;
  }
  if ((!target.activities || target.activities.length === 0) && Array.isArray(source.activities) && source.activities.length > 0) {
    target.activities = source.activities;
  }
  if (target.title && source.title) {
    const cleanSource = stripXboxPlatformSuffix(source.title);
    if (stripXboxPlatformSuffix(target.title) !== target.title && cleanSource === source.title) {
      target.title = source.title;
    }
  }
  return target;
}

module.exports = {
  readXboxAccountGames,
  stripXboxPlatformSuffix,
  mergeXboxMetadataIntoRecord
};
