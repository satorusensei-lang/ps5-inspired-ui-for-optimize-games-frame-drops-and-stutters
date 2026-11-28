/* ==========================================================================
   PlayStation 5 Official Artwork Engine & Automatic Background Downloader
   - Fully automatic background artwork discovery & downloading engine
   - Multi-source provider system:
     1. Verified Curated Official Catalog (PlayStation Studios, Xbox Studios, Epic, Rockstar)
     2. Official Steam Store Web Resources & Akamai/Cloudflare CDN (4K hero, 600x900 tile, transparent logo)
     3. Official Xbox & PlayStation Web Catalog fallbacks
     4. Public verified official game key art (Wikipedia Public API / DuckDuckGo Instant Answer)
   - Client-side & Node-side hardware-accelerated cropping & aspect ratio optimization:
     * PS5 Dynamic Background: 16:9 widescreen (1920x1080)
     * PS5 Game Card (Tile): 1:1 Square (600x600) or 2:3 Vertical (600x900)
     * PS5 Transparent Title Logo: Trimmed PNG
   - Persistent storage to local disk cache and localStorage
   - Zero modal popups, non-blocking asynchronous execution, authentic PS5 notifications
   ========================================================================== */

import { PS5_GAMES, getPS5Games, deduplicateGameList, getCanonicalTitleKey } from '../data/ps5-games-data.js';
import { ps5Audio } from '../audio/ps5-audio.js';

// Concurrency tracking set to prevent duplicate download jobs and protect against stale overwrites
const inProgressDownloads = new Set();

/**
 * Checks if an artwork download job is currently running for a specific game
 */
export function isArtworkDownloadInProgress(gameId) {
  return inProgressDownloads.has(gameId);
}

// Curated official high-resolution fallback assets for top titles
export const KNOWN_OFFICIAL_CATALOG = {
  'minecraft': {
    title: 'Minecraft',
    tile: '/assets/games/minecraft/tile.png',
    hero: '/assets/games/minecraft/hero.jpg',
    logo: '/assets/games/minecraft/logo.png',
    source: 'Xbox / Mojang Official Web'
  },
  'fortnite': {
    title: 'Fortnite',
    tile: '/assets/games/fortnite/tile.jpg',
    hero: '/assets/games/fortnite/hero.jpg',
    logo: '/assets/games/fortnite/logo.png',
    source: 'Epic Games Official Web'
  },
  'alan wake 2': {
    title: 'Alan Wake 2',
    tile: '/assets/games/alanwake2/tile.jpg',
    hero: '/assets/games/alanwake2/hero.jpg',
    logo: '/assets/games/alanwake2/logo.png',
    source: 'Epic Games / Remedy Official Web'
  },
  'valorant': {
    title: 'VALORANT',
    tile: '/assets/games/valorant/ps5_master.png',
    hero: '/assets/games/valorant/ps5_gamehub_cover.png',
    logo: '/assets/games/valorant/ps5_logo.png',
    source: 'Riot Games Official Web'
  },
  'rocket league': {
    title: 'Rocket League',
    tile: '/assets/games/rocketleague/tile.png',
    hero: '/assets/games/rocketleague/hero.jpg',
    logo: '/assets/games/rocketleague/logo.png',
    source: 'Epic Games / Psyonix Official Web'
  },
  'fall guys': {
    title: 'Fall Guys',
    tile: '/assets/games/fallguys/tile.png',
    hero: '/assets/games/fallguys/hero.jpg',
    logo: '/assets/games/fallguys/logo.png',
    source: 'Epic Games Official Web'
  },
  'ghost of tsushima': {
    title: 'Ghost of Tsushima DIRECTOR\'S CUT',
    tile: '/assets/games/got/tile.jpg',
    hero: '/assets/games/got/hero_clean.jpg',
    logo: '/assets/games/got/logo.png',
    source: 'PlayStation Studios Official Web'
  },
  'forza horizon 5': {
    title: 'Forza Horizon 5',
    tile: '/assets/games/forzahorizon5/tile.jpg',
    hero: '/assets/games/forzahorizon5/hero.jpg',
    logo: '/assets/games/forzahorizon5/logo.png',
    source: 'Xbox Game Studios Official Web'
  },
  'halo infinite': {
    title: 'Halo Infinite',
    tile: '/assets/games/haloinfinite/tile.jpg',
    hero: '/assets/games/haloinfinite/hero.jpg',
    logo: '/assets/games/haloinfinite/logo.png',
    source: 'Xbox Game Studios Official Web'
  },
  'starfield': {
    title: 'Starfield',
    tile: '/assets/games/starfield/tile.jpg',
    hero: '/assets/games/starfield/hero.jpg',
    logo: '/assets/games/starfield/logo.png',
    source: 'Bethesda / Xbox Official Web'
  },
  'sea of thieves': {
    title: 'Sea of Thieves',
    tile: '/assets/games/seaofthieves/tile.jpg',
    hero: '/assets/games/seaofthieves/hero.jpg',
    logo: '/assets/games/seaofthieves/logo.png',
    source: 'Xbox / Rare Official Web'
  },
  'grand theft auto v': {
    title: 'Grand Theft Auto V',
    tile: '/assets/games/gtav/tile.jpg',
    hero: '/assets/games/gtav/hero.jpg',
    logo: '/assets/games/gtav/logo.png',
    source: 'Rockstar Games Official Web'
  },
  'god of war ragnarok': {
    title: 'God of War Ragnarök',
    tile: '/assets/games/gowragnarok/tile.webp',
    hero: '/assets/games/gowragnarok/hero.webp',
    logo: '/assets/games/gowragnarok/logo.png',
    source: 'PlayStation Studios Official Web'
  },
  'god of war': {
    title: 'God of War',
    tile: '/assets/games/gow/tile.webp',
    hero: '/assets/games/gow/hero.webp',
    logo: '/assets/games/gow/logo.png',
    source: 'PlayStation Studios Official Web'
  },
  'spider-man 2': {
    title: 'Marvel\'s Spider-Man 2',
    tile: '/assets/games/spiderman2/tile.webp',
    hero: '/assets/games/spiderman2/hero.webp',
    logo: '/assets/games/spiderman2/logo.png',
    source: 'PlayStation Studios / Insomniac Official Web'
  },
  'spider-man remastered': {
    title: 'Marvel\'s Spider-Man Remastered',
    tile: '/assets/games/spidermanremastered/tile.webp',
    hero: '/assets/games/spidermanremastered/hero.webp',
    logo: '/assets/games/spidermanremastered/logo.png',
    source: 'PlayStation Studios / Insomniac Official Web'
  },
  'miles morales': {
    title: 'Marvel\'s Spider-Man: Miles Morales',
    tile: '/assets/games/spidermanmilesmorales/tile.webp',
    hero: '/assets/games/spidermanmilesmorales/hero.webp',
    logo: '/assets/games/spidermanmilesmorales/logo.png',
    source: 'PlayStation Studios / Insomniac Official Web'
  },
  'the last of us': {
    title: 'The Last of Us Part I',
    tile: '/assets/games/tlou1/tile.webp',
    hero: '/assets/games/tlou1/hero.webp',
    logo: '/assets/games/tlou1/logo.png',
    source: 'PlayStation Studios / Naughty Dog Official Web'
  },
  'the last of us part ii': {
    title: 'The Last of Us Part II Remastered',
    tile: '/assets/games/tlou2/tile.webp',
    hero: '/assets/games/tlou2/hero.webp',
    logo: '/assets/games/tlou2/logo.png',
    source: 'PlayStation Studios / Naughty Dog Official Web'
  },
  'the last of us part 2': {
    title: 'The Last of Us Part II Remastered',
    tile: '/assets/games/tlou2/tile.webp',
    hero: '/assets/games/tlou2/hero.webp',
    logo: '/assets/games/tlou2/logo.png',
    source: 'PlayStation Studios / Naughty Dog Official Web'
  },
  'the last of us 2': {
    title: 'The Last of Us Part II Remastered',
    tile: '/assets/games/tlou2/tile.webp',
    hero: '/assets/games/tlou2/hero.webp',
    logo: '/assets/games/tlou2/logo.png',
    source: 'PlayStation Studios / Naughty Dog Official Web'
  },
  'last of us 2': {
    title: 'The Last of Us Part II Remastered',
    tile: '/assets/games/tlou2/tile.webp',
    hero: '/assets/games/tlou2/hero.webp',
    logo: '/assets/games/tlou2/logo.png',
    source: 'PlayStation Studios / Naughty Dog Official Web'
  },
  'tlou 2': {
    title: 'The Last of Us Part II Remastered',
    tile: '/assets/games/tlou2/tile.webp',
    hero: '/assets/games/tlou2/hero.webp',
    logo: '/assets/games/tlou2/logo.png',
    source: 'PlayStation Studios / Naughty Dog Official Web'
  },
  'counter-strike 2': {
    title: 'Counter-Strike 2',
    tile: '/assets/games/cs2/tile.webp',
    hero: '/assets/games/cs2/hero.webp',
    logo: '/assets/games/cs2/logo.png',
    source: 'Valve Official Web'
  },
  'black myth: wukong': {
    title: 'Black Myth: Wukong',
    tile: '/assets/games/wukong/ps5_tile.webp',
    hero: '/assets/games/wukong/ps5_hero.webp',
    logo: '/assets/games/wukong/logo.png',
    source: 'Game Science Official Web'
  },
  'resident evil 4': {
    title: 'Resident Evil 4',
    tile: '/assets/games/re4/tile.webp',
    hero: '/assets/games/re4/hero.webp',
    logo: '/assets/games/re4/logo.png',
    source: 'Capcom Official Web'
  },
  'sparking zero': {
    title: 'DRAGON BALL: Sparking! ZERO',
    tile: '/assets/games/sparkingzero/tile.webp',
    hero: '/assets/games/sparkingzero/hero.webp',
    logo: '/assets/games/sparkingzero/logo.png',
    source: 'Bandai Namco Official Web'
  },
  'dragon ball z kakarot': {
    title: 'DRAGON BALL Z: KAKAROT',
    tile: '/assets/games/dbzkakarot/tile.webp',
    hero: '/assets/games/dbzkakarot/hero.webp',
    logo: '/assets/games/dbzkakarot/logo.png',
    source: 'Bandai Namco Official Web'
  },
  'ride 5': {
    title: 'RIDE 5',
    tile: '/assets/games/ride5/tile.webp',
    hero: '/assets/games/ride5/hero.webp',
    logo: '/assets/games/ride5/logo.png',
    source: 'Milestone Official Web'
  },
  'asphalt legends': {
    title: 'Asphalt Legends Unite',
    tile: '/assets/games/asphaltlegends/tile.webp',
    hero: '/assets/games/asphaltlegends/hero.webp',
    logo: '/assets/games/asphaltlegends/logo.png',
    source: 'Gameloft Official Web'
  },
  'forza motorsport': {
    title: 'Forza Motorsport',
    tile: '/assets/games/forzamotorsport/tile.jpg',
    hero: '/assets/games/forzamotorsport/hero.jpg',
    logo: '/assets/games/forzamotorsport/logo.png',
    source: 'Xbox Game Studios Official Web'
  },
  'tekken 8': {
    title: 'TEKKEN 8',
    tile: '/assets/cache/games/pc_steam_1778820/tile.jpg',
    hero: '/assets/cache/games/pc_steam_1778820/hero.jpg',
    logo: '/assets/cache/games/pc_steam_1778820/logo.png',
    source: 'Bandai Namco / Steam Official Web'
  },
  'tekken 7': {
    title: 'TEKKEN 7',
    tile: '/assets/cache/games/pc_steam_389730/tile.jpg',
    hero: '/assets/cache/games/pc_steam_389730/hero.jpg',
    logo: '/assets/cache/games/pc_steam_389730/logo.png',
    source: 'Bandai Namco / Steam Official Web'
  },
  'where winds meet': {
    title: 'Where Winds Meet',
    tile: '/assets/cache/games/pc_steam_3564740/tile.jpg',
    hero: '/assets/cache/games/pc_steam_3564740/hero.jpg',
    logo: '/assets/cache/games/pc_steam_3564740/logo.png',
    source: 'Everstone Studio / NetEase'
  },
  'lego batman': {
    title: 'LEGO® Batman™ 3: Beyond Gotham',
    tile: '/assets/games/legobatman/tile.jpg',
    hero: '/assets/games/legobatman/hero.jpg',
    logo: '/assets/games/legobatman/logo.png',
    source: 'Warner Bros. Official Web'
  },
  'red dead redemption 2': {
    title: 'Red Dead Redemption 2',
    tile: '/assets/cache/games/pc_steam_1174180/tile.jpg',
    hero: '/assets/cache/games/pc_steam_1174180/hero.jpg',
    logo: '/assets/cache/games/pc_steam_1174180/logo.png',
    source: 'Rockstar Games / Steam Official'
  },
  'red dead redemption': {
    title: 'Red Dead Redemption',
    tile: '/assets/cache/games/pc_steam_2668510/tile.jpg',
    hero: '/assets/cache/games/pc_steam_2668510/hero.jpg',
    logo: '/assets/cache/games/pc_steam_2668510/logo.png',
    source: 'Rockstar Games / Steam Official'
  },
  'sekiro': {
    title: 'Sekiro™: Shadows Die Twice - GOTY Edition',
    tile: '/assets/cache/games/pc_steam_814380/tile.jpg',
    hero: '/assets/cache/games/pc_steam_814380/hero.jpg',
    logo: '/assets/cache/games/pc_steam_814380/logo.png',
    source: 'FromSoftware / Activision Official'
  },
  'dark souls remastered': {
    title: 'DARK SOULS™: REMASTERED',
    tile: '/assets/cache/games/pc_steam_570940/tile.jpg',
    hero: '/assets/cache/games/pc_steam_570940/hero.jpg',
    logo: '/assets/cache/games/pc_steam_570940/logo.png',
    source: 'FromSoftware / Bandai Namco Official'
  },
  'dark souls 3': {
    title: 'DARK SOULS™ III',
    tile: '/assets/cache/games/pc_steam_374320/tile.jpg',
    hero: '/assets/cache/games/pc_steam_374320/hero.jpg',
    logo: '/assets/cache/games/pc_steam_374320/logo.png',
    source: 'FromSoftware / Bandai Namco Official'
  },
  'dark souls 2': {
    title: 'DARK SOULS™ II: Scholar of the First Sin',
    tile: '/assets/cache/games/pc_steam_335300/tile.jpg',
    hero: '/assets/cache/games/pc_steam_335300/hero.jpg',
    logo: '/assets/cache/games/pc_steam_335300/logo.png',
    source: 'FromSoftware / Bandai Namco Official'
  },
  'resident evil 0': {
    title: 'Resident Evil 0',
    tile: '/assets/cache/games/pc_steam_339340/tile.jpg',
    hero: '/assets/cache/games/pc_steam_339340/hero.jpg',
    logo: '/assets/cache/games/pc_steam_339340/logo.png',
    source: 'Capcom Official'
  },
  'the crew motorfest': {
    title: 'The Crew Motorfest',
    tile: '/assets/cache/games/pc_steam_2698940/tile.jpg',
    hero: '/assets/cache/games/pc_steam_2698940/hero.jpg',
    logo: '/assets/cache/games/pc_steam_2698940/logo.png',
    source: 'Ubisoft Ivory Tower'
  },
  'wwe 2k24': {
    title: 'WWE 2K24',
    tile: '/assets/cache/games/pc_steam_2315690/tile.jpg',
    hero: '/assets/cache/games/pc_steam_2315690/hero.jpg',
    logo: '/assets/cache/games/pc_steam_2315690/logo.png',
    source: '2K Sports'
  }
};

/**
 * Normalizes raw folder, binary, or shortcut title into clean searchable game title
 */
export function normalizeGameTitle(rawTitle) {
  if (!rawTitle) return '';
  let clean = rawTitle.trim();

  // Strip file extensions
  clean = clean.replace(/\.(exe|lnk|url|app|bat)$/i, '');

  // Strip release tags & version numbers (e.g., v1.0, Build.1234, x64, CODEX)
  clean = clean.replace(/-(codex|rune|flt|skidrow|reloaded|cpt|fitgirl|dodi|plaza|goldberg|empress)\b/gi, '');
  clean = clean.replace(/\b(v\d+(\.\d+)*|build\.\d+|shipping|win64|win32|x64|x86|pc|rip|repack|multi\d*)\b/gi, '');
  clean = clean.replace(/\[.*?\]|\(.*?\)/g, ' ');

  // Replace underscores and dots with spaces
  clean = clean.replace(/[_\.]+/g, ' ');

  // Split CamelCase into words (e.g. SeaOfThieves -> Sea Of Thieves)
  clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Collapse whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}

async function getSteamStoreArtwork(appId) {
  const id = String(appId || '').trim();
  if (!/^\d+$/.test(id)) return null;
  try {
    let details = null;
    if (typeof window !== 'undefined' && window.electronAPI?.getSteamAppDetails) {
      details = await window.electronAPI.getSteamAppDetails(id);
    } else {
      const isBrowser = typeof window !== 'undefined' && window.location.protocol.startsWith('http');
      const endpoint = isBrowser
        ? `/api/steam/appdetails?appId=${encodeURIComponent(id)}`
        : `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(id)}&l=english&cc=US`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const payload = await response.json();
        details = payload?.[id]?.success ? payload[id].data : payload;
      }
    }
    if (!details?.name) return null;
    const hero = details.background_raw || details.screenshots?.[0]?.path_full || details.background || '';
    const tile = details.header_image || details.capsule_image || '';
    if (!tile && !hero) return null;
    return {
      success: true,
      title: details.name,
      appId: id,
      tile,
      hero,
      logo: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/logo.png`,
      source: 'Steam Store official artwork'
    };
  } catch (error) {
    console.warn(`[Artwork Service] Steam Store artwork lookup failed for ${id}:`, error);
    return null;
  }
}

/**
 * Verifies that an image URL actually loads and decodes with valid non-zero dimensions
 * @param {string} sourceUrl - Image URL or data URL
 * @returns {Promise<boolean>}
 */
export function verifyImageLoads(sourceUrl) {
  return new Promise((resolve) => {
    if (!sourceUrl || typeof sourceUrl !== 'string') return resolve(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve(Boolean(img.naturalWidth > 0 && img.naturalHeight > 0));
    };
    img.onerror = () => resolve(false);
    img.src = sourceUrl;
  });
}

/**
 * Searches real, official artwork for any game title from internet sources
 * (Steam Akamai CDN -> Steam Store Search -> Curated Fallbacks -> Public Web Key Art)
 * @param {string} title - Game title
 * @param {object} metadata - Optional additional game metadata (appId, publisher)
 */
export async function searchOfficialArtwork(title, metadata = {}) {
  const cleanTitle = normalizeGameTitle(title);
  if (!cleanTitle && !metadata.appId) return null;

  const lowerTitle = (cleanTitle || '').toLowerCase();
  let appId = metadata.appId;
  const isDesktop = typeof window !== 'undefined' && Boolean(window.electronAPI?.isDesktop);

  // 0. Explicit canonical match for franchise split titles (TLOU Part II vs Part I)
  const canonKey = getCanonicalTitleKey(cleanTitle);
  if (canonKey === 'thelastofuspart2' || metadata.appId === '2531310') {
    return {
      success: true,
      title: 'The Last of Us™ Part II Remastered',
      appId: metadata.appId ? String(metadata.appId) : '2531310',
      tile: '/assets/games/tlou2/tile.webp',
      hero: '/assets/games/tlou2/hero.webp',
      logo: '/assets/games/tlou2/logo.png',
      source: 'PlayStation Studios / Naughty Dog Official Web'
    };
  }
  if (canonKey === 'thelastofuspart1' || metadata.appId === '1888930') {
    return {
      success: true,
      title: 'The Last of Us™ Part I',
      appId: metadata.appId ? String(metadata.appId) : '1888930',
      tile: '/assets/games/tlou1/tile.webp',
      hero: '/assets/games/tlou1/hero.webp',
      logo: '/assets/games/tlou1/logo.png',
      source: 'PlayStation Studios / Naughty Dog Official Web'
    };
  }

  // 1. Check known curated official catalog first (verified on disk/cache; fall back to Steam CDN if cache not yet populated)
  // Sort by key length descending so more specific keys (e.g. 'the last of us part ii')
  // are matched before shorter overlapping keys (e.g. 'the last of us')
  const sortedCatalogEntries = Object.entries(KNOWN_OFFICIAL_CATALOG).sort((a, b) => b[0].length - a[0].length);
  for (const [key, item] of sortedCatalogEntries) {
    if (lowerTitle && (lowerTitle.includes(key) || key.includes(lowerTitle))) {
      const tileIsUncached = item.tile?.includes('/assets/cache/') && !(await verifyImageLoads(item.tile));
      if (tileIsUncached) {
        if (!appId) {
          const idMatch = item.tile.match(/pc_steam_(\d+)/);
          if (idMatch) appId = idMatch[1];
        }
        continue;
      }
      return {
        success: true,
        title: item.title,
        appId: appId ? String(appId) : undefined,
        tile: item.tile,
        hero: item.hero,
        logo: item.logo || '',
        source: item.source
      };
    }
  }

  // 2. Direct match for games with a known Steam App ID (Official Steam Akamai CDN)
  if (appId) {
    const storeArtwork = await getSteamStoreArtwork(appId);
    if (storeArtwork) return storeArtwork;
    return {
      success: true,
      title: cleanTitle || `App ${appId}`,
      appId: String(appId),
      tile: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900_2x.jpg`,
      hero: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`,
      logo: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/logo.png`,
      source: 'Steam Web / Akamai CDN (Official)'
    };
  }

  // 3. Query official Steam Store Web Search API to resolve Steam App ID for official 4K assets
  if (cleanTitle) {
    try {
      const canProxySteamSearch = typeof window !== 'undefined' && (
        window.location.protocol === 'app:' ||
        (window.location.protocol.startsWith('http') && !window.electronAPI?.isDesktop && window.location.host)
      );
      const steamApiUrl = canProxySteamSearch
        ? `/api/steam/search?term=${encodeURIComponent(cleanTitle)}`
        : `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanTitle)}&l=english&cc=US`;
      const response = await fetch(steamApiUrl);
      if (response.ok) {
        const data = await response.json();
        if (data && data.items && data.items.length > 0) {
          const match = data.items.find(it => it.type === 'app') || data.items[0];
          if (match && match.id) {
            appId = String(match.id);
          const storeArtwork = await getSteamStoreArtwork(appId);
          if (storeArtwork) {
            return { ...storeArtwork, title: match.name || storeArtwork.title };
          }
            return {
              success: true,
              title: match.name || cleanTitle,
              appId: String(appId),
              tile: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900_2x.jpg`,
              hero: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`,
              logo: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/logo.png`,
              source: 'Steam Web / Akamai CDN (Official)'
            };
          }
        }
      }
    } catch (err) {
      console.warn('[Artwork Service] Steam store search query error:', err);
    }
  }

  // 4. Fallback: Query Wikipedia Public API / Web Key Art for verified official promo artwork
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(cleanTitle + ' video game')}&gsrlimit=1&prop=pageimages&piprop=original`;
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const pages = wikiData?.query?.pages;
      if (pages) {
        const pageKey = Object.keys(pages)[0];
        const originalImg = pages[pageKey]?.thumbnail?.original || pages[pageKey]?.original?.source;
        if (originalImg) {
          return {
            success: true,
            title: pages[pageKey]?.title?.replace(/\s*\([^)]*\)/g, '') || cleanTitle,
            tile: originalImg,
            hero: originalImg,
            logo: '',
            source: 'Official Web Key Art'
          };
        }
      }
    }
  } catch (err) {
    console.warn('[Artwork Service] Web key art search error:', err);
  }

  return {
    success: false,
    title: cleanTitle,
    error: 'No official web artwork found for this game title'
  };
}

/**
 * Loads an image from URL and crops/resizes it to exact PS5 dimensions using HTML5 Canvas
 * @param {string} sourceUrl - Image URL (HTTP, HTTPS, local, or data URL)
 * @param {number} targetWidth - Width in pixels (e.g. 1920 for hero, 600 for card)
 * @param {number} targetHeight - Height in pixels (e.g. 1080 for hero, 600 for card)
 * @param {string} focal - 'top' | 'center' | 'bottom' | 'left' | 'right'
 * @returns {Promise<string>} - High-quality Data URL (image/jpeg or image/png)
 */
export function cropAndResizeImage(sourceUrl, targetWidth, targetHeight, focal = 'center', zoomFactor = 1.0) {
  return new Promise((resolve, reject) => {
    if (!sourceUrl) {
      return reject(new Error('No image source provided'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(sourceUrl);
        }

        // Enable highest quality bicubic interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Apply zoomFactor (safely bounded between 0.5 and 3.0)
        const safeZoom = Math.max(0.5, Math.min(3.0, Number(zoomFactor) || 1.0));
        const baseScale = Math.max(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
        const scale = baseScale * safeZoom;
        const renderW = img.naturalWidth * scale;
        const renderH = img.naturalHeight * scale;

        // Calculate focal alignment multipliers
        let focalXMult = 0.5;
        let focalYMult = 0.5;

        if (typeof focal === 'string') {
          switch (focal.toLowerCase()) {
            case 'top':
              focalYMult = 0.12;
              break;
            case 'bottom':
              focalYMult = 0.88;
              break;
            case 'left':
              focalXMult = 0.12;
              break;
            case 'right':
              focalXMult = 0.88;
              break;
            case 'center':
            default:
              focalXMult = 0.5;
              focalYMult = 0.5;
              break;
          }
        }

        let renderX = (targetWidth - renderW) * focalXMult;
        let renderY = (targetHeight - renderH) * focalYMult;

        // If zoomed out below canvas bounds, create a blurred ambient backdrop so there are no empty borders
        if (renderW < targetWidth || renderH < targetHeight) {
          ctx.save();
          ctx.filter = 'blur(24px) brightness(0.35)';
          const bgScale = Math.max(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
          const bgW = img.naturalWidth * bgScale;
          const bgH = img.naturalHeight * bgScale;
          ctx.drawImage(img, (targetWidth - bgW) / 2, (targetHeight - bgH) / 2, bgW, bgH);
          ctx.restore();
        }

        // Draw cropped, scaled and aligned image
        ctx.drawImage(img, renderX, renderY, renderW, renderH);

        // Check if output is transparent (PNG) or photographic (JPEG)
        const isPng = sourceUrl.toLowerCase().includes('.png') || targetWidth <= 400;
        const outFormat = isPng ? 'image/png' : 'image/jpeg';
        const outQuality = isPng ? undefined : 0.94;

        const dataUrl = canvas.toDataURL(outFormat, outQuality);
        resolve(dataUrl);
      } catch (err) {
        console.warn('[Artwork Service] Canvas crop fallback to source URL:', err);
        resolve(sourceUrl);
      }
    };

    img.onerror = (err) => {
      console.warn('[Artwork Service] Failed to load image for crop:', sourceUrl, err);
      reject(new Error(`Failed to load image for crop: ${sourceUrl}`));
    };

    img.src = sourceUrl;
  });
}

/**
 * Saves and attaches downloaded / cropped artwork directly to a game
 * Persists to disk cache, localStorage, and triggers live UI refresh
 */
export async function applyArtworkToGame(gameId, artwork) {
  if (!gameId || !artwork) return false;

  const { tile, hero, logo, title, heroBgPos, heroBgSize, heroBgZoom, heroBgOrigin, source } = artwork;
  const hasLogoValue = Object.prototype.hasOwnProperty.call(artwork, 'logo');
  const timestamp = Date.now();

  // 1. Save to local disk cache via Electron IPC if running in desktop app
  let diskCached = {};
  if (typeof window !== 'undefined' && window.electronAPI?.cacheArtwork) {
    try {
      const res = await window.electronAPI.cacheArtwork({
        gameId,
        tileDataUrl: tile,
        heroDataUrl: hero,
        logoDataUrl: logo
      });
      if (res?.success && res.saved) {
        diskCached = res.saved;
      }
    } catch (e) {
      console.warn('[Artwork Service] Electron disk cache error:', e);
    }
  }

  // 2. Fallback to Vite dev API if in browser dev mode
  if (!diskCached.tileIcon && typeof window !== 'undefined' && window.location.protocol !== 'file:') {
    try {
      const res = await fetch('/api/pc/cache-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          tileDataUrl: tile,
          heroDataUrl: hero,
          logoDataUrl: logo
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.saved) diskCached = data.saved;
      }
    } catch (e) {}
  }

  let finalTile = diskCached.tileIcon || tile;
  let finalHero = diskCached.heroBg || hero;
  let finalLogo = diskCached.logoImg || logo;

  // Append cache-busting timestamp to persistent asset URLs to invalidate Chromium image texture cache
  if (finalTile && typeof finalTile === 'string' && finalTile.includes('/assets/cache/') && !finalTile.includes('?')) {
    finalTile += `?t=${timestamp}`;
  }
  if (finalHero && typeof finalHero === 'string' && finalHero.includes('/assets/cache/') && !finalHero.includes('?')) {
    finalHero += `?t=${timestamp}`;
  }
  if (finalLogo && typeof finalLogo === 'string' && finalLogo.includes('/assets/cache/') && !finalLogo.includes('?')) {
    finalLogo += `?t=${timestamp}`;
  }

  // 3. Update active game in memory
  const allGames = typeof getPS5Games === 'function' ? getPS5Games() : PS5_GAMES;
  const inputNorm = getCanonicalTitleKey(title);
  const inputAppId = /^\d+$/.test(String(gameId)) ? String(gameId) : (typeof gameId === 'string' && gameId.startsWith('pc_steam_') ? gameId.replace('pc_steam_', '') : null);

  const matchGame = g => {
    if (!g) return false;
    if (g.id === gameId) return true;
    const gAppId = g.appId ? String(g.appId) : (g.launchUri?.match(/rungameid\/(\d+)/)?.[1]);
    if (inputAppId && gAppId && inputAppId === gAppId) return true;
    if (inputNorm && getCanonicalTitleKey(g.title) === inputNorm) return true;
    if (gameId === 'the-last-of-us-part-1' && (gAppId === '1888930' || g.id === 'pc_steam_1888930' || getCanonicalTitleKey(g.title) === 'thelastofuspart1')) return true;
    if (gameId === 'pc_steam_1888930' && (g.id === 'the-last-of-us-part-1' || gAppId === '1888930' || getCanonicalTitleKey(g.title) === 'thelastofuspart1')) return true;
    if (gameId === 'the-last-of-us-part-2' && (gAppId === '2531310' || g.id === 'pc_steam_2531310' || getCanonicalTitleKey(g.title) === 'thelastofuspart2')) return true;
    if (gameId === 'pc_steam_2531310' && (g.id === 'the-last-of-us-part-2' || gAppId === '2531310' || getCanonicalTitleKey(g.title) === 'thelastofuspart2')) return true;
    return false;
  };

  const targetGame = allGames.find(matchGame);

  const existingListRaw = localStorage.getItem('ps5_synced_pc_games');
  let existingList = [];
  try { existingList = existingListRaw ? JSON.parse(existingListRaw) : []; } catch (e) {}
  const existingItem = existingList.find(matchGame);
  const safeLogo = hasLogoValue ? (finalLogo || '') : (finalLogo || targetGame?.logoImg || existingItem?.logoImg || '');

  if (targetGame) {
    if (finalTile) targetGame.tileIcon = finalTile;
    if (finalHero) targetGame.heroBg = finalHero;
    if (hasLogoValue || safeLogo) targetGame.logoImg = safeLogo;
    if (title && (!targetGame.title || /^Steam App \d+$/i.test(targetGame.title))) targetGame.title = title;
    if (heroBgPos) targetGame.heroBgPos = heroBgPos;
    if (heroBgSize) targetGame.heroBgSize = heroBgSize;
    if (heroBgZoom !== undefined) targetGame.heroBgZoom = heroBgZoom;
    if (heroBgOrigin) targetGame.heroBgOrigin = heroBgOrigin;
    targetGame.hasCustomArtwork = true;
    targetGame.customArtwork = true;
    targetGame.artworkAutoFetched = true;
    if (source) targetGame.artworkSource = source;
    targetGame.artworkTimestamp = timestamp;
  }

  // 4. Update localStorage persistence
  try {
    const list = existingList;
    const existingIdx = list.findIndex(matchGame);

    const canonicalId = targetGame?.id || (inputAppId ? `pc_steam_${inputAppId}` : gameId);
    const updatedObj = targetGame ? { ...targetGame } : {
      id: canonicalId,
      appId: inputAppId || (inputNorm === 'thelastofuspart1' ? '1888930' : undefined),
      title: title || 'Game',
      tileIcon: finalTile,
      heroBg: finalHero,
      logoImg: safeLogo,
      hasCustomArtwork: true,
      customArtwork: true,
      artworkAutoFetched: true,
      artworkSource: source || 'Automatic artwork discovery',
      artworkTimestamp: timestamp,
      heroBgPos: heroBgPos || 'center center',
      heroBgSize: heroBgSize || 'cover',
      heroBgZoom: heroBgZoom !== undefined ? heroBgZoom : 1.0,
      heroBgOrigin: heroBgOrigin || 'center center'
    };

    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...updatedObj, id: canonicalId, hasCustomArtwork: true, customArtwork: true, artworkAutoFetched: true };
    } else {
      list.push({ ...updatedObj, id: canonicalId, hasCustomArtwork: true, customArtwork: true });
    }

    localStorage.setItem('ps5_synced_pc_games', JSON.stringify(deduplicateGameList(list)));
  } catch (e) {
    console.warn('[Artwork Service] LocalStorage save error:', e);
  }

  // 5. Notify system components for live UI update without reloading
  const resolvedGameId = targetGame?.id || gameId;
  window.dispatchEvent(new CustomEvent('ps5-game-artwork-updated', {
    detail: { gameId: resolvedGameId, title, tileIcon: finalTile, heroBg: finalHero, logoImg: safeLogo, heroBgPos, heroBgSize, heroBgZoom, heroBgOrigin }
  }));
  window.dispatchEvent(new CustomEvent('ps5-refresh-hero-display', { detail: { gameId: resolvedGameId } }));

  return true;
}

/**
 * Fully automatic background artwork discovery & downloading engine.
 * Triggered when user selects a game and clicks "Download Official Artwork from Site".
 * 
 * Requirements handled:
 * - No manual URL fields, no modal dialogs, no manual search controls
 * - User stays on the Games screen with zero interruption
 * - Searches official sources in background with concurrency protection
 * - Unobtrusive notifications for Finding -> Downloading -> Applying -> Updated
 * - Stale downloads from a previous game cannot overwrite a newly focused game
 * - Fallbacks tried; if all fail, existing artwork is 100% kept
 * 
 * @param {object} game - Currently selected game object
 * @returns {Promise<boolean>}
 */
export async function downloadOfficialArtworkInBackground(game, quiet = false) {
  if (!game || !game.id) return false;

  const targetGameId = game.id;
  const gameTitle = game.title || 'Selected Game';

  // 1. Prevent duplicate jobs if user clicks repeatedly
  if (inProgressDownloads.has(targetGameId)) {
    if (!quiet) {
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: 'Artwork Download In Progress',
          subtitle: `Artwork discovery is already running for "${gameTitle}".`
        }
      }));
    }
    return false;
  }

  inProgressDownloads.add(targetGameId);

  try {
    // 2. Status notification: Finding artwork...
    if (!quiet) {
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: '🔍 Finding Official Artwork...',
          subtitle: `Searching trusted official sources for "${gameTitle}".`
        }
      }));
    }

    // Extract Steam App ID if present
    let appId = game.appId;
    if (!appId && typeof targetGameId === 'string' && targetGameId.startsWith('pc_steam_')) {
      appId = targetGameId.replace('pc_steam_', '');
    }

    // 3. Search multi-source providers (Curated -> Steam Store/Akamai CDN -> Web Key Art)
    const artResult = await searchOfficialArtwork(gameTitle, { appId, publisher: game.studio });

    if (!artResult || !artResult.success || (!artResult.hero && !artResult.tile)) {
      // 4. Failure: Keep existing artwork completely intact
      if (!quiet) {
        window.dispatchEvent(new CustomEvent('ps5-show-notification', {
          detail: {
            title: '⚠️ Artwork Not Found',
            subtitle: "Couldn't find suitable artwork. Your current artwork has been kept."
          }
        }));
        try {
          ps5Audio.playBackCancel();
        } catch (e) {}
      }
      return false;
    }

    // 5. Status notification: Downloading artwork...
    if (!quiet) {
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: '📥 Downloading 4K Artwork...',
          subtitle: `Retrieving official background, game card & logo for "${gameTitle}".`
        }
      }));
    }

    // 6. Crop and resize to authentic PS5 dimensions (16:9 for hero, 1:1 or 2:3 for tile)
    let processedHero = artResult.hero;
    let processedTile = artResult.tile;
    let processedLogo = artResult.logo || game.logoImg || '';

    if (artResult.hero && (artResult.hero.startsWith('http://') || artResult.hero.startsWith('https://'))) {
      try {
        processedHero = await cropAndResizeImage(artResult.hero, 1920, 1080, 'center');
      } catch (e) {
        console.warn('[Artwork Service] Hero crop fallback to source URL:', e);
      }
    }

    if (artResult.tile && (artResult.tile.startsWith('http://') || artResult.tile.startsWith('https://'))) {
      try {
        processedTile = await cropAndResizeImage(artResult.tile, 600, 600, 'center');
      } catch (e) {
        console.warn('[Artwork Service] Tile crop fallback to source URL:', e);
      }
    }

    // Image decoding validation: Ensure each processed image is real and decodable
    const heroValid = processedHero ? await verifyImageLoads(processedHero) : false;
    const tileValid = processedTile ? await verifyImageLoads(processedTile) : false;
    const logoValid = processedLogo ? await verifyImageLoads(processedLogo) : false;
    const currentHeroValid = !heroValid && game.heroBg && game.heroBg !== processedHero
      ? await verifyImageLoads(game.heroBg) : false;
    const currentTileValid = !tileValid && game.tileIcon && game.tileIcon !== processedTile
      ? await verifyImageLoads(game.tileIcon) : false;
    const currentLogoValid = !logoValid && game.logoImg && game.logoImg !== processedLogo
      ? await verifyImageLoads(game.logoImg) : false;

    // Strict validation: if neither hero nor tile could be loaded, do not modify the game
    if (!heroValid && !tileValid && !logoValid) {
      throw new Error('Downloaded artwork failed decoding verification: no valid images could be loaded.');
    }

    // Only apply valid images; fallback to current game artwork for any asset that failed
    const heroToApply = heroValid ? processedHero : (currentHeroValid ? game.heroBg : '');
    const tileToApply = tileValid ? processedTile : (currentTileValid ? game.tileIcon : '');
    const logoToApply = logoValid ? processedLogo : (currentLogoValid ? game.logoImg : '');

    // 7. Status notification: Applying artwork...
    if (!quiet) {
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: '🎨 Applying Artwork...',
          subtitle: `Saving 4K assets and updating PlayStation 5 dashboard.`
        }
      }));
    }

    // 8. Save to persistent storage and live update target game
    const applied = await applyArtworkToGame(targetGameId, {
      tile: tileToApply,
      hero: heroToApply,
      logo: logoToApply,
      title: artResult.title || gameTitle,
      source: artResult.source
    });

    if (applied) {
      // 9. Status notification: Artwork updated
      if (!quiet) {
        window.dispatchEvent(new CustomEvent('ps5-show-notification', {
          detail: {
            title: '✅ Official Artwork Updated',
            subtitle: `New 4K background and game card applied to "${gameTitle}".`
          }
        }));
        try {
          ps5Audio.playSelectChime();
        } catch (e) {}
      }
      return true;
    } else {
      if (!quiet) {
        window.dispatchEvent(new CustomEvent('ps5-show-notification', {
          detail: {
            title: '⚠️ Artwork Save Failed',
            subtitle: "Couldn't save downloaded artwork. Your current artwork has been kept."
          }
        }));
      }
      return false;
    }
  } catch (error) {
    console.error(`[Artwork Service] Error during background artwork download for ${gameTitle}:`, error);
    if (!quiet) {
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: '⚠️ Artwork Not Found',
          subtitle: "Couldn't find suitable artwork. Your current artwork has been kept."
        }
      }));
      try {
        ps5Audio.playBackCancel();
      } catch (e) {}
    }
    return false;
  } finally {
    inProgressDownloads.delete(targetGameId);
  }
}

const verifiedArtworkCache = new Map();

/**
 * Automatically searches and downloads missing artwork for all scanned games in the background
 */
export async function autoDownloadMissingGameArtworks(gamesList, quiet = true) {
  if (!Array.isArray(gamesList)) return;

  const candidates = gamesList.filter(g => {
    if (!g || !g.id || g.isStore || g.isExplore || g.isLibrary) return false;
    // Preserve user-selected artwork. Automatically fetched records may be retried
    // when any of their card, background, or logo files is still unavailable.
    if ((g.hasCustomArtwork || g.customArtwork) && !g.artworkAutoFetched) return false;
    const sig = `${g.tileIcon || ''}|${g.heroBg || ''}|${g.logoImg || ''}`;
    if (verifiedArtworkCache.get(g.id) === sig) return false;
    return true;
  });

  if (candidates.length === 0) return;

  const needsArt = [];
  const checkQueue = [...candidates];
  const checkWorkers = Array(Math.min(8, checkQueue.length)).fill(0).map(async () => {
    while (checkQueue.length) {
      const game = checkQueue.shift();
      const sources = [game.tileIcon, game.heroBg, game.logoImg];
      const missing = await Promise.all(sources.map(async source => {
        if (!source || source.includes('/api/pc/asset')) return true;
        if (source.startsWith('data:')) return false;
        return !(await verifyImageLoads(source));
      }));
      if (missing.some(Boolean)) {
        needsArt.push(game);
      } else {
        verifiedArtworkCache.set(game.id, `${game.tileIcon || ''}|${game.heroBg || ''}|${game.logoImg || ''}`);
      }
    }
  });
  await Promise.all(checkWorkers);

  if (needsArt.length === 0) return;

  // Process in parallel worker pool of 4 concurrent jobs for instant responsiveness
  const queue = [...needsArt];
  const workers = Array(4).fill(0).map(async () => {
    while (queue.length > 0) {
      const game = queue.shift();
      if (game) {
        try {
          await downloadOfficialArtworkInBackground(game, quiet);
        } catch (e) {
          console.warn(`[Artwork Service] Auto-download failed for ${game.title}:`, e);
        }
      }
    }
  });
  await Promise.all(workers);
}

export const OFFICIAL_LOCAL_ASSETS = {
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

  // 1. Data URLs always take highest priority
  if (url.startsWith('data:')) {
    return url;
  }

  // 2. Cached persistent assets
  if (url.includes('/assets/cache/') || url.startsWith('/assets/cache/')) {
    return isFileProto && !url.startsWith('.') ? '.' + url : url;
  }

  // 3. Direct HTTP / HTTPS URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 4. Handle /api/pc/asset placeholder endpoints
  if (url.startsWith('/api/pc/asset')) {
    if (aid && OFFICIAL_LOCAL_ASSETS[aid]?.[aType]) {
      const local = OFFICIAL_LOCAL_ASSETS[aid][aType];
      return isFileProto ? '.' + local : local;
    }
    if (aid) {
      const cached = getCachedAsset(aid, aType);
      return isFileProto ? '.' + cached : cached;
    }
    return url;
  }

  // 5. Handle generic placeholder images
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

export async function saveCustomArtwork(data) {
  if (typeof window !== 'undefined' && window.electronAPI?.saveCustomArtwork) {
    return await window.electronAPI.saveCustomArtwork(data);
  }
  return { success: false, error: 'Desktop bridge unavailable' };
}

export async function restoreDefaultArtwork(gameId) {
  if (typeof window !== 'undefined' && window.electronAPI?.restoreDefaultArtwork) {
    return await window.electronAPI.restoreDefaultArtwork(gameId);
  }
  return { success: false, error: 'Desktop bridge unavailable' };
}

export const GameArtworkManager = {
  resolveAssetUrl,
  downloadOfficialArtworkInBackground,
  autoDownloadMissingGameArtworks,
  saveCustomArtwork,
  restoreDefaultArtwork
};
