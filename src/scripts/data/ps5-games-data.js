/* ==========================================================================
   PlayStation 5 Games Database with 4K Wallpapers, Install Status & Storage
   ========================================================================== */

import { EPIC_GAMES_CATALOG, XBOX_GAME_PASS_CATALOG } from './store-catalogs-data.js';
export { EPIC_GAMES_CATALOG, XBOX_GAME_PASS_CATALOG };

export const INITIAL_PS5_GAMES = [
  // 0. PlayStation Store (Authentic PS5 First Tile)
  {
    id: "ps-store",
    isStore: true,
    title: "PlayStation Store",
    studio: "Official PlayStation Store • Discover Latest Releases & Deals",
    genre: "Featured • Subscriptions • Pre-Orders",
    logoImg: "/assets/games/store/logo.svg",
    tileIcon: "",
    heroBg: "/assets/games/store/hero.svg",
    badge: "PS Store",
    installed: true,
    installSize: "System Hub",
    storageType: "Direct Cloud Integration",
    playTime: null,
    trophies: null,
    friends: "14 friends active on PSN",
    activities: [
      { id: "store_act1", title: "Essential Picks: Up to 70% Off", tag: "Featured Sale", progress: 100, timeEst: "Browse Deals" },
      { id: "store_act2", title: "PS5 Pro Enhanced Titles", tag: "Next-Gen Highlights", progress: 100, timeEst: "Explore" },
      { id: "store_act3", title: "PlayStation Plus Monthly Games", tag: "Included with Sub", progress: 100, timeEst: "Claim" },
      { id: "store_act4", title: "Pre-Orders & Coming Soon", tag: "Wishlist", progress: 100, timeEst: "View" }
    ],
    liveStatus: "PlayStation Store • 4K HDR Dynamic Catalog"
  },
  // 1. Black Myth: Wukong (Authentic PS5 Primary Game in Carousel)
  {
    id: "pc_steam_2358720",
    appId: "2358720",
    title: "Black Myth: Wukong",
    subtitle: "Confront Destiny",
    studio: "Game Science • Action RPG",
    genre: "Action RPG • Journey to the West",
    logoImg: "/assets/games/wukong/logo.png",
    tileIcon: "/assets/games/wukong/ps5_tile.webp",
    heroBg: "/assets/games/wukong/hero.jpg",
    heroBgPos: "right center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "right center",
    badge: "Installed",
    installed: true,
    installSize: "130 GB",
    storageType: "Steam Library",
    playTime: "91h",
    store: "steam",
    trophies: { progress: 18, platinum: 0, gold: 0, silver: 1, bronze: 11 },
    friends: "5 friends playing on Steam",
    friendsWhoPlay: [
      { name: "Alex", avatar: "A", color: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
      { name: "Chen", avatar: "C", color: "linear-gradient(135deg, #10b981, #047857)" },
      { name: "David", avatar: "D", color: "linear-gradient(135deg, #f59e0b, #b45309)" },
      { name: "Elena", avatar: "E", color: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }
    ],
    promoCard: {
      title: "BLACK MYTH WUKONG",
      image: "/assets/games/wukong/steam_library_hero.jpg",
      discount: "-20%",
      price: "$47.99",
      origPrice: "$59.99"
    },
    launchUri: "steam://rungameid/2358720",
    activities: [
      { id: "bmw1", title: "Chapter 3: White Snow, Cold Frost", tag: "Main Story", progress: 60, timeEst: "Resume" },
      { id: "bmw2", title: "Defeat Yellowbrow", tag: "Boss Battle", progress: 0, timeEst: "Boss Challenge" },
      { id: "bmw3", title: "Collect All Loong Pearls", tag: "Exploration", progress: 75, timeEst: "Exploration" }
    ],
    liveStatus: "Installed on PC • Ready to Launch"
  },
  // 2. Wallpaper Engine (Matches User Reference)
  {
    id: "pc_steam_431960",
    appId: "431960",
    title: "Wallpaper Engine",
    studio: "Kristjan Skutta • Utilities",
    genre: "Utilities • Live Wallpaper & Customization",
    logoImg: "/assets/games/wallpaper/logo.png",
    tileIcon: "/assets/games/wallpaper/tile.jpg",
    heroBg: "/assets/games/wallpaper/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Installed",
    installed: true,
    installSize: "1.2 GB",
    storageType: "Steam Library",
    playTime: "142h",
    store: "steam",
    trophies: null,
    friends: "2 friends active",
    launchUri: "steam://rungameid/431960",
    activities: [
      { id: "we1", title: "Browse Steam Workshop", tag: "Workshop", progress: 100, timeEst: "Open" }
    ],
    liveStatus: "Installed on PC • Ready to Launch"
  },
  {
    id: "ps-explore",
    isExplore: true,
    title: "Explore",
    studio: "PlayStation Official News & Community Hub",
    genre: "PlayStation Blog • System Updates • PS Plus Highlights",
    logoImg: "/assets/games/explore/hero.svg",
    tileIcon: "",
    heroBg: "/assets/games/explore/hero.svg",
    badge: "Explore",
    installed: true,
    installSize: "Official Feed",
    storageType: "Direct Cloud Integration",
    playTime: null,
    trophies: null,
    friends: "PlayStation Official Community",
    activities: [
      { id: "exp_act1", title: "PlayStation Plus Monthly Games Available", tag: "PS Plus Essential", progress: 100, timeEst: "Claim Now" },
      { id: "exp_act2", title: "PS5 System Software Update 10.00 Live", tag: "Firmware", progress: 100, timeEst: "Read Notes" },
      { id: "exp_act3", title: "PlayStation Tournaments • Win Exclusive Avatars", tag: "Compete", progress: 100, timeEst: "Join" },
      { id: "exp_act4", title: "DualSense Wireless Controller Cloud Profiles", tag: "Hardware", progress: 100, timeEst: "Explore" }
    ],
    liveStatus: "Welcome to PlayStation 5 • Explore What's New"
  }
];

export const OFFICIAL_STEAM_STORE_SIZES = {
  "730": "85 GB",
  "12210": "22 GB",
  "21690": "15 GB",
  "35140": "8 GB",
  "200260": "17 GB",
  "208650": "45 GB",
  "209000": "20 GB",
  "221040": "16 GB",
  "313690": "10 GB",
  "418370": "24 GB",
  "498240": "12 GB",
  "851850": "116.86 GB",
  "883710": "26 GB",
  "952060": "45 GB",
  "1091500": "70 GB",
  "1196590": "30 GB",
  "1245620": "60 GB",
  "1546970": "5 GB",
  "1546990": "10 GB",
  "1547000": "19 GB",
  "1551360": "110 GB",
  "1593500": "70 GB",
  "1650010": "50 GB",
  "1778820": "120.8 GB",
  "1790600": "29 GB",
  "1815780": "10 GB",
  "1817070": "75 GB",
  "1817190": "75 GB",
  "1888930": "100 GB",
  "2050650": "67 GB",
  "2215430": "75 GB",
  "2322010": "190 GB",
  "2358720": "130 GB",
  "2440510": "130 GB",
  "2483190": "167 GB",
  "2531310": "150 GB",
  "2651280": "140 GB",
  "2878960": "103 GB",
  "3240220": "105 GB",
  "3357650": "40 GB",
  "389730": "78.5 GB",
  "3564740": "50.0 GB",
  "4080220": "100 GB",
  "2668510": "12 GB",
  "1174180": "120 GB",
  "304240": "20 GB",
  "339340": "13 GB",
  "2698940": "40 GB",
  "3768760": "50 GB",
  "814380": "25 GB",
  "3717070": "100 GB",
  "2315690": "90 GB",
  "502820": "8 GB",
  "570940": "8 GB",
  "374320": "25 GB",
  "335300": "12 GB"
};

const STEAM_FAVORITES_STORAGE_KEY = 'ps5_steam_favorites';
let _steamFavoritesAuthoritative = false;

function loadPersistedSteamFavorites() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STEAM_FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          _steamFavoritesAuthoritative = true;
          return parsed.map(String).filter(id => /^\d+$/.test(id));
        }
      }
    }
  } catch (e) {}
  return [];
}

export const STEAM_FAVORITE_APPIDS = new Set(loadPersistedSteamFavorites());

export function isSteamFavoritesAuthoritative() {
  return _steamFavoritesAuthoritative;
}

export function updateSteamFavoriteAppIds(appIds, authoritative = true) {
  if (!Array.isArray(appIds)) return;
  const normalized = appIds.map(String).filter(id => /^\d+$/.test(id) && !isNonGameSteamApp(null, id));
  STEAM_FAVORITE_APPIDS.clear();
  normalized.forEach(id => STEAM_FAVORITE_APPIDS.add(id));
  if (authoritative) _steamFavoritesAuthoritative = true;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STEAM_FAVORITES_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch (e) {}
}

export function isSteamCatalogEntry(game) {
  if (!game || game.isStore || game.isExplore || game.isLibrary) return false;
  const st = (game.store || '').toLowerCase();
  if (st === 'epic' || st === 'xbox' || st === 'riot' || st === 'playstation') return false;
  if (st === 'steam') return true;
  if (typeof game.id === 'string' && game.id.startsWith('pc_steam_')) return true;
  if (typeof game.launchUri === 'string' && game.launchUri.startsWith('steam://')) return true;
  return Boolean(game.appId && /^\d+$/.test(String(game.appId)));
}

function isExcludedLauncherEntry(game) {
  if (!game) return false;
  const idLow = String(game.id || '').toLowerCase();
  const titleLow = String(game.title || '').toLowerCase().trim();
  return (
    idLow === 'xbox_id_1794566092' ||
    idLow === 'xbox_minecraft_launcher' ||
    titleLow === 'minecraft launcher' ||
    String(game.productId || '').toUpperCase() === '9PGW18NPBZV5'
  );
}

const UNOWNED_EPIC_OR_RIOT_IDS = new Set([
  ...EPIC_GAMES_CATALOG.map(g => g.id),
  'pc_valorant'
]);

const UNOWNED_XBOX_CATALOG_IDS = new Set(
  XBOX_GAME_PASS_CATALOG.map(g => g.id)
);

export const REAL_PC_PRELOADED_GAMES = [
  // 1. Ghost of Tsushima DIRECTOR'S CUT (Installed)
  {
    id: "pc_steam_2215430",
    appId: "2215430",
    title: "Ghost of Tsushima DIRECTOR'S CUT",
    studio: "Sucker Punch • PlayStation PC Publishing",
    genre: "Action Adventure • Samurai Epic",
    logoImg: "/assets/games/got/logo.png",
    tileIcon: "/assets/games/got/tile.webp",
    heroBg: "/assets/games/got/hero.webp",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "52.1 GB",
    storageType: "Laptop SSD (Steam Library)",
    playTime: "34 hours",
    trophies: { progress: 75, platinum: 1, gold: 4, silver: 12, bronze: 30 },
    friends: "3 friends playing on Steam",
    execPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Ghost of Tsushima DIRECTOR'S CUT\\GhostOfTsushima.exe",
    launchUri: "steam://rungameid/2215430",
    activities: [
      { id: "got1", title: "Act II: Retake Castle Kaneda", tag: "Main Tale", progress: 65, timeEst: "Launch on PC" },
      { id: "got2", title: "Iki Island Expansion", tag: "DLC Tale", progress: 40, timeEst: "Launch on PC" },
      { id: "got3", title: "Legends Multiplayer Mode", tag: "Online Co-Op", progress: 100, timeEst: "Ready" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 2. Forza Horizon 6 (Owned)
  {
    id: "pc_steam_2483190",
    appId: "2483190",
    title: "Forza Horizon 6",
    studio: "Playground Games • Xbox Game Studios",
    genre: "Open World Racing • Next-Gen Simulation",
    logoImg: "/assets/games/forza6/logo.png",
    tileIcon: "/assets/games/forza6/tile.jpg",
    heroBg: "/assets/games/forza6/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "167 GB",
    storageType: "Laptop SSD (Steam Library)",
    playTime: "82 hours",
    trophies: { progress: 85, platinum: 0, gold: 5, silver: 15, bronze: 32 },
    friends: "Chris, Alex playing",
    execPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\ForzaHorizon6\\forzahorizon6.exe",
    launchUri: "steam://rungameid/2483190",
    activities: [
      { id: "forza1", title: "Festival Horizon Apex Invitational", tag: "Championship", progress: 90, timeEst: "Launch on PC" },
      { id: "forza2", title: "Speed Trap Leaderboard Challenge", tag: "Seasonal", progress: 100, timeEst: "Launch on PC" }
    ],
    liveStatus: "Installed on Laptop • 167 GB Ready to Launch"
  },
  // 3. VALORANT
  {
    id: "pc_valorant",
    appId: "valorant",
    store: "riot",
    storeName: "Riot Games",
    title: "VALORANT",
    studio: "Riot Games • Tactical Hero Shooter",
    genre: "5v5 Character-Based Tactical Shooter",
    logoImg: "/assets/games/valorant/ps5_logo.svg",
    tileIcon: "/assets/games/valorant/ps5_master.png",
    heroBg: "/assets/games/valorant/ps5_gamehub_cover.png",
    heroBgPos: "center 20%",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "45.2 GB",
    storageType: "Riot Games (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 85, platinum: 1, gold: 5, silver: 15, bronze: 28 },
    friends: "4 friends in Competitive Party",
    execPath: "C:\\Riot Games\\Riot Client\\RiotClientServices.exe",
    execArgs: "--launch-product=valorant --launch-patchline=live",
    launchUri: "https://playvalorant.com/",
    activities: [
      { id: "val1", title: "Download VALORANT", tag: "Riot Games", progress: 0, timeEst: "Install" },
      { id: "val2", title: "Competitive Matchmaking", tag: "Ranked", progress: 85, timeEst: "Install" },
      { id: "val3", title: "Premier Tournament Stage", tag: "Esports", progress: 50, timeEst: "Install" }
    ],
    liveStatus: "Owned on Riot Games • Ready to Install"
  },
  // 4. Black Myth: Wukong
  {
    id: "pc_steam_2358720",
    appId: "2358720",
    title: "Black Myth: Wukong",
    subtitle: "Confront Destiny",
    studio: "Game Science • Action RPG",
    genre: "Action RPG • Journey to the West",
    logoImg: "/assets/games/wukong/logo.png",
    tileIcon: "/assets/games/wukong/ps5_tile.webp",
    heroBg: "/assets/games/wukong/hero.jpg",
    heroBgPos: "right center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "right center",
    badge: "Owned",
    installed: false,
    installSize: "130 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 18, platinum: 0, gold: 0, silver: 1, bronze: 11 },
    friends: "5 friends playing on Steam",
    friendsWhoPlay: [
      { name: "Alex", avatar: "A", color: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
      { name: "Chen", avatar: "C", color: "linear-gradient(135deg, #10b981, #047857)" },
      { name: "David", avatar: "D", color: "linear-gradient(135deg, #f59e0b, #b45309)" },
      { name: "Elena", avatar: "E", color: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }
    ],
    promoCard: {
      title: "BLACK MYTH WUKONG",
      image: "/assets/games/wukong/steam_library_hero.jpg",
      discount: "-20%",
      price: "$47.99",
      origPrice: "$59.99"
    },
    launchUri: "steam://rungameid/2358720",
    activities: [
      { id: "bmw1", title: "Chapter 3: White Snow, Cold Frost", tag: "Main Story", progress: 60, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 5. Counter-Strike 2
  {
    id: "pc_steam_730",
    appId: "730",
    title: "Counter-Strike 2",
    studio: "Valve Corporation • Source 2 Engine",
    genre: "Tactical FPS • Competitive Esports",
    logoImg: "/assets/games/cs2/logo.png",
    tileIcon: "/assets/games/cs2/tile.webp",
    heroBg: "/assets/games/cs2/hero.webp",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "85 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 92, platinum: 1, gold: 6, silver: 14, bronze: 32 },
    friends: "8 friends online in Premier",
    launchUri: "steam://rungameid/730",
    activities: [
      { id: "cs1", title: "Premier Matchmaking: Competitive", tag: "Competitive", progress: 100, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 6. God of War Ragnarök
  {
    id: "pc_steam_2322010",
    appId: "2322010",
    title: "God of War Ragnarök",
    studio: "Santa Monica Studio • PlayStation PC",
    genre: "Action • Mythological Epic",
    logoImg: "/assets/games/gowragnarok/logo.png",
    tileIcon: "/assets/games/gowragnarok/tile.webp",
    heroBg: "/assets/games/gowragnarok/hero.webp",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "190 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 96, platinum: 1, gold: 8, silver: 18, bronze: 36 },
    friends: "Marcus, Elena playing",
    launchUri: "steam://rungameid/2322010",
    activities: [
      { id: "gowr1", title: "Realm Travel: Svartalfheim Depths", tag: "Main Story", progress: 95, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 7. God of War
  {
    id: "pc_steam_1593500",
    appId: "1593500",
    title: "God of War",
    studio: "Santa Monica Studio • PlayStation PC",
    genre: "Action Adventure • Mythological Epic",
    logoImg: "/assets/games/gow/logo.png",
    tileIcon: "/assets/games/gow/tile.webp",
    heroBg: "/assets/games/gow/hero.webp",
    heroBgPos: "center 30%",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "70 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 88, platinum: 1, gold: 7, silver: 15, bronze: 31 },
    friends: "3 friends played",
    launchUri: "steam://rungameid/1593500",
    activities: [
      { id: "gow1", title: "Journey to the Highest Peak", tag: "Main Quest", progress: 85, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 8. Marvel's Spider-Man 2
  {
    id: "pc_steam_2651280",
    appId: "2651280",
    title: "Marvel's Spider-Man 2",
    studio: "Insomniac Games • PlayStation PC",
    genre: "Action • Superhero Open World",
    logoImg: "/assets/games/spiderman2/logo.png",
    tileIcon: "/assets/games/spiderman2/tile.webp",
    heroBg: "/assets/games/spiderman2/hero.webp",
    heroBgPos: "center 25%",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "140 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 84, platinum: 1, gold: 6, silver: 14, bronze: 28 },
    friends: "Sarah, Alex playing",
    launchUri: "steam://rungameid/2651280",
    activities: [
      { id: "sm2_1", title: "Be Greater. Together.", tag: "Campaign", progress: 80, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 9. Marvel’s Spider-Man Remastered
  {
    id: "pc_steam_1817070",
    appId: "1817070",
    title: "Marvel’s Spider-Man Remastered",
    studio: "Insomniac Games • PlayStation PC",
    genre: "Action • Superhero Open World",
    logoImg: "/assets/games/spidermanremastered/logo.png",
    tileIcon: "/assets/games/spidermanremastered/tile.webp",
    heroBg: "/assets/games/spidermanremastered/hero.webp",
    badge: "Owned",
    installed: false,
    installSize: "75 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 95, platinum: 1, gold: 9, silver: 18, bronze: 38 },
    friends: "6 friends played",
    launchUri: "steam://rungameid/1817070",
    activities: [
      { id: "smr1", title: "The City That Never Sleeps", tag: "Full DLC", progress: 100, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 10. Marvel’s Spider-Man: Miles Morales
  {
    id: "pc_steam_1817190",
    appId: "1817190",
    title: "Marvel’s Spider-Man: Miles Morales",
    studio: "Insomniac Games • PlayStation PC",
    genre: "Action • Superhero Open World",
    logoImg: "/assets/games/spidermanmilesmorales/logo.png",
    tileIcon: "/assets/games/spidermanmilesmorales/tile.webp",
    heroBg: "/assets/games/spidermanmilesmorales/hero.webp",
    badge: "Owned",
    installed: false,
    installSize: "75 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 100, platinum: 1, gold: 8, silver: 16, bronze: 30 },
    friends: "4 friends played",
    launchUri: "steam://rungameid/1817190",
    activities: [
      { id: "mm1", title: "Harlem Holiday Celebration", tag: "Story", progress: 90, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 11. The Last of Us™ Part I
  {
    id: "pc_steam_1888930",
    appId: "1888930",
    title: "The Last of Us™ Part I",
    studio: "Naughty Dog • PlayStation PC",
    genre: "Action Adventure • Post-Apocalyptic",
    logoImg: "/assets/games/tlou1/logo.png",
    tileIcon: "/assets/games/tlou1/tile.webp",
    heroBg: "/assets/games/tlou1/hero.webp",
    badge: "Owned",
    installed: false,
    installSize: "100 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 80, platinum: 0, gold: 6, silver: 14, bronze: 26 },
    friends: "David, Sarah played",
    launchUri: "steam://rungameid/1888930",
    activities: [
      { id: "tlou1", title: "Salt Lake City: The Hospital", tag: "Story Climax", progress: 95, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 12. The Last of Us™ Part II Remastered
  {
    id: "pc_steam_2531310",
    appId: "2531310",
    title: "The Last of Us™ Part II Remastered",
    studio: "Naughty Dog • PlayStation PC",
    logoImg: "/assets/games/tlou2/logo.png",
    tileIcon: "/assets/games/tlou2/tile.webp",
    heroBg: "/assets/games/tlou2/hero.webp",
    badge: "Owned",
    installed: false,
    installSize: "150 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 70, platinum: 0, gold: 4, silver: 12, bronze: 24 },
    friends: "2 friends playing",
    launchUri: "steam://rungameid/2531310",
    activities: [
      { id: "tlou2", title: "No Return: Roguelike Survival", tag: "New Mode", progress: 50, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 13. Forza Horizon 5
  {
    id: "pc_steam_1551360",
    appId: "1551360",
    title: "Forza Horizon 5",
    studio: "Playground Games • Xbox Game Studios",
    genre: "Open World Racing • Horizon Festival",
    logoImg: "/assets/games/forzahorizon5/logo.png",
    tileIcon: "/assets/games/forzahorizon5/tile.jpg",
    heroBg: "/assets/games/forzahorizon5/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "110 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 90, platinum: 1, gold: 8, silver: 20, bronze: 45 },
    friends: "Chris, Alex playing",
    launchUri: "steam://rungameid/1551360",
    activities: [
      { id: "fh5_1", title: "Guanajuato Street Racing", tag: "Festival Race", progress: 80, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 14. Forza Motorsport
  {
    id: "pc_steam_2440510",
    appId: "2440510",
    title: "Forza Motorsport",
    studio: "Turn 10 Studios • Xbox Game Studios",
    genre: "Track Racing • Motorsport Simulation",
    logoImg: "/assets/games/forzamotorsport/logo.png",
    tileIcon: "/assets/games/forzamotorsport/tile.jpg",
    heroBg: "/assets/games/forzamotorsport/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "130 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 65, platinum: 0, gold: 3, silver: 10, bronze: 25 },
    friends: "Motorsport Enthusiasts",
    launchUri: "steam://rungameid/2440510",
    activities: [
      { id: "fm1", title: "Builders Cup Career Series", tag: "Track Career", progress: 75, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 15. RIDE 5
  {
    id: "pc_steam_1650010",
    appId: "1650010",
    title: "RIDE 5",
    studio: "Milestone S.r.l. • Unreal Engine 5",
    genre: "Motorcycle Racing • Superbike Simulation",
    logoImg: "/assets/games/ride5/logo.png",
    tileIcon: "/assets/games/ride5/tile.webp",
    heroBg: "/assets/games/ride5/hero.webp",
    badge: "Owned",
    installed: false,
    installSize: "50 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 55, platinum: 0, gold: 2, silver: 9, bronze: 18 },
    friends: "2 friends playing",
    launchUri: "steam://rungameid/1650010",
    activities: [
      { id: "ride1", title: "World Superbike: Mugello Circuit", tag: "Career Race", progress: 70, timeEst: "45m" },
      { id: "ride2", title: "Ducati Panigale V4 R Custom Tuning", tag: "Garage", progress: 100, timeEst: "Ready" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 16. DRAGON BALL: Sparking! ZERO
  {
    id: "pc_steam_1790600",
    appId: "1790600",
    title: "DRAGON BALL: Sparking! ZERO",
    studio: "Spike Chunsoft • Bandai Namco",
    genre: "Anime Fighting • 3D Arena Brawler",
    logoImg: "/assets/games/sparkingzero/logo.png",
    tileIcon: "/assets/games/sparkingzero/tile.webp",
    heroBg: "/assets/games/sparkingzero/hero.webp",
    badge: "Owned",
    installed: false,
    installSize: "29 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 85, platinum: 1, gold: 5, silver: 12, bronze: 28 },
    friends: "Goku, Vegeta online",
    launchUri: "steam://rungameid/1790600",
    activities: [
      { id: "dbz0", title: "Episode Battle: Super Saiyan God", tag: "Anime Battle", progress: 85, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 17. TEKKEN 8 (Steam Active Download)
  {
    id: "pc_steam_1778820",
    appId: "1778820",
    title: "TEKKEN 8",
    studio: "Bandai Namco Studios • Unreal Engine 5",
    genre: "3D Fighting • Next-Gen Arena Fighter",
    logoImg: "/assets/cache/games/pc_steam_1778820/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_1778820/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_1778820/hero.jpg",
    badge: "Owned",
    installed: false,
    isDownloading: false,
    installSize: "120.8 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 45, platinum: 0, gold: 2, silver: 8, bronze: 20 },
    friends: "Jin, Kazuya online",
    launchUri: "steam://rungameid/1778820",
    activities: [
      { id: "tk8_1", title: "The Dark Awakens: Chapter 1", tag: "Story", progress: 50, timeEst: "45m" },
      { id: "tk8_2", title: "Arcade Quest: Champion Rank", tag: "Arcade", progress: 30, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • 120.8 GB Download"
  },
  // 17. DRAGON BALL Z: KAKAROT
  {
    id: "pc_steam_851850",
    appId: "851850",
    title: "DRAGON BALL Z: KAKAROT",
    studio: "CyberConnect2 • Bandai Namco",
    genre: "Action RPG • Anime Adventure",
    logoImg: "/assets/games/dbzkakarot/logo.png",
    tileIcon: "/assets/games/dbzkakarot/tile.webp",
    heroBg: "/assets/games/dbzkakarot/hero.webp",
    badge: "Owned",
    installed: false,
    installSize: "116.86 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 90, platinum: 1, gold: 6, silver: 15, bronze: 30 },
    friends: "4 friends played",
    launchUri: "steam://rungameid/851850",
    activities: [
      { id: "dbzk", title: "Buu Saga: Final Spirit Bomb", tag: "Epic Story", progress: 100, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 18. Asphalt Legends
  {
    id: "pc_steam_1815780",
    appId: "1815780",
    title: "Asphalt Legends",
    studio: "Gameloft • High-Octane Racing",
    genre: "Arcade Racing • Supercars",
    logoImg: "/assets/games/asphaltlegends/logo.png",
    tileIcon: "/assets/games/asphaltlegends/tile.webp",
    heroBg: "/assets/games/asphaltlegends/hero.webp",
    badge: "Owned",
    installed: false,
    installSize: "10 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 75, platinum: 0, gold: 4, silver: 10, bronze: 20 },
    friends: "3 friends racing",
    launchUri: "steam://rungameid/1815780",
    activities: [
      { id: "asph1", title: "TouchDrive World Tour Championship", tag: "Grand Prix", progress: 80, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 18. Grand Theft Auto V
  {
    id: "pc_steam_3240220",
    appId: "3240220",
    title: "Grand Theft Auto V",
    studio: "Rockstar Games • Los Santos",
    genre: "Action • Crime Open World",
    logoImg: "/assets/games/gtav/logo.png",
    tileIcon: "/assets/games/gtav/tile.jpg",
    heroBg: "/assets/games/gtav/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "105 GB",
    storageType: "Steam / Epic Games (Dual Store Launch)",
    playTime: "Ready to Download",
    trophies: { progress: 94, platinum: 1, gold: 8, silver: 22, bronze: 48 },
    friends: "Franklin, Michael, Trevor in Los Santos",
    launchUri: "steam://rungameid/3240220",
    activities: [
      { id: "gta5_1", title: "The Big Score Heist", tag: "Final Mission", progress: 95, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam & Epic Games • Ready to Download"
  },
  // 19. Grand Theft Auto IV: The Complete Edition
  {
    id: "pc_steam_12210",
    appId: "12210",
    title: "Grand Theft Auto IV: The Complete Edition",
    studio: "Rockstar Games • Liberty City",
    genre: "Action • Crime Open World",
    logoImg: "/api/pc/asset?appId=12210&type=logo",
    tileIcon: "/api/pc/asset?appId=12210&type=tile",
    heroBg: "/api/pc/asset?appId=12210&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "22 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 80, platinum: 0, gold: 5, silver: 14, bronze: 28 },
    friends: "Niko Bellic in Liberty City",
    launchUri: "steam://rungameid/12210",
    activities: [
      { id: "gta4_1", title: "Roman's Sorrow", tag: "Story", progress: 60, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 20. Grand Theft Auto III – The Definitive Edition
  {
    id: "pc_steam_1546970",
    appId: "1546970",
    title: "Grand Theft Auto III – The Definitive Edition",
    studio: "Rockstar Games • Liberty City",
    genre: "Action • Open World",
    logoImg: "/assets/cache/games/pc_steam_1546970/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_1546970/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_1546970/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "5 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 75, platinum: 0, gold: 3, silver: 8, bronze: 18 },
    friends: "Liberty City Nostalgia",
    launchUri: "steam://rungameid/1546970",
    activities: [
      { id: "gta3_1", title: "Portland to Staunton Island", tag: "Island Unlock", progress: 70, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 21. Grand Theft Auto: Vice City – The Definitive Edition
  {
    id: "pc_steam_1546990",
    appId: "1546990",
    title: "Grand Theft Auto: Vice City – The Definitive Edition",
    studio: "Rockstar Games • 80s Vice City",
    genre: "Action • Open World",
    logoImg: "/assets/cache/games/pc_steam_1546990/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_1546990/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_1546990/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "10 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 85, platinum: 1, gold: 4, silver: 12, bronze: 22 },
    friends: "Tommy Vercetti in Vice City",
    launchUri: "steam://rungameid/1546990",
    activities: [
      { id: "gtavc_1", title: "Rub Out: Vercetti Estate Takeover", tag: "Mansion Heist", progress: 80, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 22. Grand Theft Auto: San Andreas – The Definitive Edition
  {
    id: "pc_steam_1547000",
    appId: "1547000",
    title: "Grand Theft Auto: San Andreas – The Definitive Edition",
    studio: "Rockstar Games • San Andreas",
    genre: "Action • Open World",
    logoImg: "/assets/cache/games/pc_steam_1547000/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_1547000/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_1547000/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "19 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 92, platinum: 1, gold: 7, silver: 16, bronze: 32 },
    friends: "CJ in Los Santos",
    launchUri: "steam://rungameid/1547000",
    activities: [
      { id: "gtasa_1", title: "End of the Line", tag: "Final Mission", progress: 95, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 23. Batman™: Arkham Knight
  {
    id: "pc_steam_208650",
    appId: "208650",
    title: "Batman™: Arkham Knight",
    studio: "Rocksteady Studios • WB Games",
    genre: "Action Adventure • Superhero Open World",
    logoImg: "/api/pc/asset?appId=208650&type=logo",
    tileIcon: "/api/pc/asset?appId=208650&type=tile",
    heroBg: "/api/pc/asset?appId=208650&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "45 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 90, platinum: 1, gold: 7, silver: 18, bronze: 36 },
    friends: "Gotham vigilantes online",
    launchUri: "steam://rungameid/208650",
    activities: [
      { id: "ak1", title: "Knightfall Protocol", tag: "True Ending", progress: 100, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 24. Batman: Arkham City - Game of the Year Edition
  {
    id: "pc_steam_200260",
    appId: "200260",
    title: "Batman: Arkham City - Game of the Year Edition",
    studio: "Rocksteady Studios • WB Games",
    genre: "Action Adventure • Superhero Open World",
    logoImg: "/api/pc/asset?appId=200260&type=logo",
    tileIcon: "/api/pc/asset?appId=200260&type=tile",
    heroBg: "/api/pc/asset?appId=200260&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "17 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 95, platinum: 1, gold: 8, silver: 20, bronze: 40 },
    friends: "Arkham City survivors",
    launchUri: "steam://rungameid/200260",
    activities: [
      { id: "ac1", title: "Protocol 10 Infiltration", tag: "Story", progress: 90, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 25. Batman™: Arkham Origins
  {
    id: "pc_steam_209000",
    appId: "209000",
    title: "Batman™: Arkham Origins",
    studio: "WB Games Montréal • WB Games",
    genre: "Action Adventure • Superhero",
    logoImg: "/api/pc/asset?appId=209000&type=logo",
    tileIcon: "/api/pc/asset?appId=209000&type=tile",
    heroBg: "/api/pc/asset?appId=209000&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "20 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 78, platinum: 0, gold: 4, silver: 12, bronze: 26 },
    friends: "Christmas Eve in Gotham",
    launchUri: "steam://rungameid/209000",
    activities: [
      { id: "ao1", title: "8 Assassins Bounty: Deathstroke", tag: "Boss Fight", progress: 75, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 26. Batman: Arkham Asylum Game of the Year Edition
  {
    id: "pc_steam_35140",
    appId: "35140",
    title: "Batman: Arkham Asylum Game of the Year Edition",
    studio: "Rocksteady Studios • WB Games",
    genre: "Action Adventure • Superhero",
    logoImg: "/api/pc/asset?appId=35140&type=logo",
    tileIcon: "/api/pc/asset?appId=35140&type=tile",
    heroBg: "/api/pc/asset?appId=35140&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "8 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 100, platinum: 1, gold: 6, silver: 15, bronze: 32 },
    friends: "Arkham Island Asylum",
    launchUri: "steam://rungameid/35140",
    activities: [
      { id: "aa1", title: "Titan Joker Showdown", tag: "Boss Battle", progress: 100, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 27. Batman - The Telltale Series
  {
    id: "pc_steam_498240",
    appId: "498240",
    title: "Batman - The Telltale Series",
    studio: "Telltale Games • Interactive Story",
    genre: "Episodic Adventure • Story",
    logoImg: "/api/pc/asset?appId=498240&type=logo",
    tileIcon: "/api/pc/asset?appId=498240&type=tile",
    heroBg: "/api/pc/asset?appId=498240&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "12 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 100, platinum: 1, gold: 5, silver: 10, bronze: 20 },
    friends: "Wayne Enterprises",
    launchUri: "steam://rungameid/498240",
    activities: [
      { id: "ttb1", title: "Episode 5: City of Light", tag: "Season Finale", progress: 100, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 28. LEGO® Batman™ 3: Beyond Gotham
  {
    id: "pc_steam_313690",
    appId: "313690",
    title: "LEGO® Batman™ 3: Beyond Gotham",
    studio: "TT Games • Warner Bros. Games",
    genre: "Action • LEGO Family Adventure",
    logoImg: "/api/pc/asset?appId=313690&type=logo",
    tileIcon: "/api/pc/asset?appId=313690&type=tile",
    heroBg: "/api/pc/asset?appId=313690&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "10 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 85, platinum: 0, gold: 4, silver: 12, bronze: 28 },
    friends: "LEGO Justice League",
    launchUri: "steam://rungameid/313690",
    activities: [
      { id: "lb3_1", title: "Lantern Worlds Free Play", tag: "Exploration", progress: 80, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 29. WWE 2K25
  {
    id: "pc_steam_2878960",
    appId: "2878960",
    title: "WWE 2K25",
    studio: "Visual Concepts • 2K Sports",
    genre: "Sports • Pro Wrestling",
    logoImg: "/api/pc/asset?appId=2878960&type=logo",
    tileIcon: "/api/pc/asset?appId=2878960&type=tile",
    heroBg: "/api/pc/asset?appId=2878960&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "103 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 65, platinum: 0, gold: 4, silver: 11, bronze: 25 },
    friends: "WrestleMania Rivals",
    launchUri: "steam://rungameid/2878960",
    activities: [
      { id: "wwe1", title: "MyRISE: The Undisputed Era", tag: "Career Story", progress: 60, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 31. EA SPORTS FC™ 27
  {
    id: "pc_steam_4080220",
    appId: "4080220",
    title: "EA SPORTS FC™ 27",
    studio: "EA Vancouver • EA Sports",
    genre: "Sports • Football Simulation",
    logoImg: "/assets/games/eafc27/logo.png",
    tileIcon: "/assets/games/eafc27/tile.jpg",
    heroBg: "/assets/games/eafc27/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "100 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 80, platinum: 0, gold: 5, silver: 14, bronze: 30 },
    friends: "Ultimate Team Rivals",
    launchUri: "steam://rungameid/4080220",
    activities: [
      { id: "fc1", title: "Champions Weekend League", tag: "Ultimate Team", progress: 80, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 32. Cyberpunk 2077
  {
    id: "pc_steam_1091500",
    appId: "1091500",
    title: "Cyberpunk 2077",
    studio: "CD PROJEKT RED • Night City",
    genre: "Action RPG • Open World Cyberpunk",
    logoImg: "/api/pc/asset?appId=1091500&type=logo",
    tileIcon: "/api/pc/asset?appId=1091500&type=tile",
    heroBg: "/api/pc/asset?appId=1091500&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "70 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 82, platinum: 0, gold: 5, silver: 16, bronze: 30 },
    friends: "Tyler, Maya in Night City",
    launchUri: "steam://rungameid/1091500",
    activities: [
      { id: "cp1", title: "Dogtown Infiltration: Firestarter", tag: "Phantom Liberty", progress: 70, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 33. Elden Ring
  {
    id: "pc_steam_1245620",
    appId: "1245620",
    title: "Elden Ring",
    studio: "FromSoftware • Bandai Namco",
    genre: "Action RPG • The Lands Between",
    logoImg: "/api/pc/asset?appId=1245620&type=logo",
    tileIcon: "/api/pc/asset?appId=1245620&type=tile",
    heroBg: "/api/pc/asset?appId=1245620&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "60 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 95, platinum: 1, gold: 9, silver: 18, bronze: 32 },
    friends: "Tarnished Champions",
    launchUri: "steam://rungameid/1245620",
    activities: [
      { id: "er1", title: "Shadow of the Erdtree: Belurat Tower", tag: "Expansion", progress: 85, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 35. Desktop Mate
  {
    id: "pc_steam_3301060",
    appId: "3301060",
    title: "Desktop Mate",
    studio: "Desktop Interactive • Mascot Utility",
    genre: "Utility • Interactive Desktop",
    logoImg: "/api/pc/asset?appId=3301060&type=logo",
    tileIcon: "/api/pc/asset?appId=3301060&type=tile",
    heroBg: "/api/pc/asset?appId=3301060&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "500 MB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 40, platinum: 0, gold: 1, silver: 4, bronze: 10 },
    friends: "Companion on Desktop",
    launchUri: "steam://rungameid/3301060",
    activities: [
      { id: "dm1", title: "Custom Mascot Interactions", tag: "Companion", progress: 100, timeEst: "Instant" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 36. Resident Evil 2
  {
    id: "pc_steam_883710",
    appId: "883710",
    title: "Resident Evil 2",
    studio: "Capcom • Survival Horror",
    genre: "Action • Survival Horror",
    logoImg: "/api/pc/asset?appId=883710&type=logo",
    tileIcon: "/api/pc/asset?appId=883710&type=tile",
    heroBg: "/api/pc/asset?appId=883710&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "26 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 75, platinum: 1, gold: 5, silver: 12, bronze: 26 },
    friends: "Leon, Claire in Raccoon City",
    launchUri: "steam://rungameid/883710",
    activities: [
      { id: "re2_1", title: "R.P.D. Police Station Escape", tag: "Main Story", progress: 80, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 37. Resident Evil 3
  {
    id: "pc_steam_952060",
    appId: "952060",
    title: "Resident Evil 3",
    studio: "Capcom • Survival Horror",
    genre: "Action • Survival Horror",
    logoImg: "/api/pc/asset?appId=952060&type=logo",
    tileIcon: "/api/pc/asset?appId=952060&type=tile",
    heroBg: "/api/pc/asset?appId=952060&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "45 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 82, platinum: 1, gold: 4, silver: 11, bronze: 20 },
    friends: "Jill Valentine vs Nemesis",
    launchUri: "steam://rungameid/952060",
    activities: [
      { id: "re3_1", title: "Nemesis Encounter: Downtown", tag: "Main Story", progress: 70, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 38. Resident Evil 4
  {
    id: "pc_steam_2050650",
    appId: "2050650",
    title: "Resident Evil 4",
    studio: "Capcom • Survival Horror",
    genre: "Action • Survival Horror",
    logoImg: "/assets/games/re4/logo.png",
    tileIcon: "/assets/games/re4/tile.webp",
    heroBg: "/assets/games/re4/hero.webp",
    badge: "Owned",
    installed: false,
    installSize: "67 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 90, platinum: 1, gold: 6, silver: 15, bronze: 30 },
    friends: "Leon S. Kennedy rescue mission",
    launchUri: "steam://rungameid/2050650",
    activities: [
      { id: "re4_1", title: "Chapter 4: The Castle Depths", tag: "Main Story", progress: 65, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 39. Resident Evil 5
  {
    id: "pc_steam_21690",
    appId: "21690",
    title: "Resident Evil 5",
    studio: "Capcom • Action Co-Op",
    genre: "Action • Co-Op Shooter",
    logoImg: "/api/pc/asset?appId=21690&type=logo",
    tileIcon: "/api/pc/asset?appId=21690&type=tile",
    heroBg: "/api/pc/asset?appId=21690&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "15 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 88, platinum: 1, gold: 5, silver: 14, bronze: 28 },
    friends: "Chris Redfield, Sheva Alomar",
    launchUri: "steam://rungameid/21690",
    activities: [
      { id: "re5_1", title: "Chapter 5-3: Uroboros Confrontation", tag: "Co-Op Campaign", progress: 90, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 40. Resident Evil 6
  {
    id: "pc_steam_221040",
    appId: "221040",
    title: "Resident Evil 6",
    studio: "Capcom • Action Horror",
    genre: "Action • Dramatic Horror",
    logoImg: "/api/pc/asset?appId=221040&type=logo",
    tileIcon: "/api/pc/asset?appId=221040&type=tile",
    heroBg: "/api/pc/asset?appId=221040&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "16 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 70, platinum: 0, gold: 3, silver: 10, bronze: 25 },
    friends: "Leon, Chris, Jake campaigns",
    launchUri: "steam://rungameid/221040",
    activities: [
      { id: "re6_1", title: "Leon Campaign: Tall Oaks", tag: "Story", progress: 85, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 41. Resident Evil 7 Biohazard
  {
    id: "pc_steam_418370",
    appId: "418370",
    title: "Resident Evil 7 Biohazard",
    studio: "Capcom • Survival Horror",
    genre: "Survival Horror • RE Engine",
    logoImg: "/api/pc/asset?appId=418370&type=logo",
    tileIcon: "/api/pc/asset?appId=418370&type=tile",
    heroBg: "/api/pc/asset?appId=418370&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "24 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 95, platinum: 1, gold: 7, silver: 16, bronze: 32 },
    friends: "Baker Plantation Estate",
    launchUri: "steam://rungameid/418370",
    activities: [
      { id: "re7_1", title: "The Baker Estate: Main House", tag: "Horror", progress: 75, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 42. Resident Evil Village
  {
    id: "pc_steam_1196590",
    appId: "1196590",
    title: "Resident Evil Village",
    studio: "Capcom • RE Engine",
    genre: "Survival Horror • Ethan Winters",
    logoImg: "/api/pc/asset?appId=1196590&type=logo",
    tileIcon: "/api/pc/asset?appId=1196590&type=tile",
    heroBg: "/api/pc/asset?appId=1196590&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "30 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 92, platinum: 1, gold: 6, silver: 15, bronze: 34 },
    friends: "Castle Dimitrescu",
    launchUri: "steam://rungameid/1196590",
    activities: [
      { id: "rev_1", title: "Castle Dimitrescu Chambers", tag: "Gothic Horror", progress: 85, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 42. Resident Evil Requiem
  {
    id: "pc_steam_3764200",
    appId: "3764200",
    title: "Resident Evil Requiem",
    studio: "Capcom • Next-Gen Survival Horror",
    genre: "Survival Horror • RE Engine",
    logoImg: "/assets/games/rerequiem/logo.png",
    tileIcon: "/assets/games/rerequiem/tile.jpg",
    heroBg: "/assets/games/rerequiem/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "68 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 65, platinum: 0, gold: 3, silver: 10, bronze: 22 },
    friends: "Biohazard Quarantine",
    launchUri: "steam://rungameid/3764200",
    activities: [
      { id: "req_1", title: "Raccoon City Hotel Investigation", tag: "Grace Ashcroft", progress: 65, timeEst: "45m" },
      { id: "req_2", title: "Midwest Outbreak Response", tag: "Leon S. Kennedy", progress: 40, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 43. PRAGMATA
  {
    id: "pc_steam_3357650",
    appId: "3357650",
    title: "PRAGMATA",
    studio: "Capcom • Sci-Fi Adventure",
    genre: "Action Adventure • Lunar Dystopia",
    logoImg: "/assets/games/pragmata/logo.png",
    tileIcon: "/assets/games/pragmata/tile.png",
    heroBg: "/assets/games/pragmata/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "40 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 45, platinum: 0, gold: 2, silver: 6, bronze: 12 },
    friends: "Lunar Base Exploration",
    launchUri: "steam://rungameid/3357650",
    activities: [
      { id: "prg_1", title: "Lunar Shelter Extraction", tag: "Sci-Fi", progress: 45, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 44. TEKKEN 7
  {
    id: "pc_steam_389730",
    appId: "389730",
    title: "TEKKEN 7",
    studio: "Bandai Namco Entertainment",
    genre: "Fighting • 3D Fighting",
    logoImg: "/assets/cache/games/pc_steam_389730/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_389730/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_389730/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "78.5 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 70, platinum: 0, gold: 4, silver: 12, bronze: 28 },
    friends: "The Mishima Bloodline Saga",
    launchUri: "steam://rungameid/389730",
    activities: [
      { id: "tk7_1", title: "The Mishima Saga: Story Mode", tag: "Mishima Feud", progress: 70, timeEst: "45m" },
      { id: "tk7_2", title: "Online Ranked Battles", tag: "Ranked Match", progress: 50, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • 78.5 GB Download"
  },
  // 46. Red Dead Redemption
  {
    id: "pc_steam_2668510",
    appId: "2668510",
    title: "Red Dead Redemption",
    studio: "Rockstar Games • Double Eleven",
    genre: "Action Adventure • Western Classic",
    logoImg: "/assets/cache/games/pc_steam_2668510/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_2668510/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_2668510/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "12 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 65, platinum: 0, gold: 3, silver: 8, bronze: 18 },
    friends: "John Marston in the West",
    launchUri: "steam://rungameid/2668510",
    activities: [
      { id: "rdr1_1", title: "Mexico: The Last Enemy That Shall Be Destroyed", tag: "Act III", progress: 70, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 47. Red Dead Redemption 2
  {
    id: "pc_steam_1174180",
    appId: "1174180",
    title: "Red Dead Redemption 2",
    studio: "Rockstar Games • Van der Linde Gang",
    genre: "Action Adventure • Epic Western",
    logoImg: "/assets/cache/games/pc_steam_1174180/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_1174180/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_1174180/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "120 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 78, platinum: 1, gold: 5, silver: 14, bronze: 30 },
    friends: "Arthur Morgan, Dutch's Gang",
    launchUri: "steam://rungameid/1174180",
    activities: [
      { id: "rdr2_1", title: "Epilogue: American Venom", tag: "Story Finale", progress: 75, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 48. Sekiro: Shadows Die Twice – GOTY Edition
  {
    id: "pc_steam_814380",
    appId: "814380",
    title: "Sekiro™: Shadows Die Twice - GOTY Edition",
    studio: "FromSoftware • Activision",
    genre: "Action Adventure • Sengoku Shinobi",
    logoImg: "/assets/cache/games/pc_steam_814380/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_814380/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_814380/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "25 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 72, platinum: 0, gold: 4, silver: 10, bronze: 22 },
    friends: "Shinobi Resurrection",
    launchUri: "steam://rungameid/814380",
    activities: [
      { id: "skr_1", title: "Genichiro Ashina: Ashina Castle Peak", tag: "Boss Fight", progress: 65, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 49. DARK SOULS™: REMASTERED
  {
    id: "pc_steam_570940",
    appId: "570940",
    title: "DARK SOULS™: REMASTERED",
    studio: "FromSoftware • QLOC • Bandai Namco",
    genre: "Action RPG • Dark Fantasy",
    logoImg: "/assets/cache/games/pc_steam_570940/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_570940/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_570940/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "8 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 55, platinum: 0, gold: 2, silver: 8, bronze: 20 },
    friends: "Solaire of Astora",
    launchUri: "steam://rungameid/570940",
    activities: [
      { id: "ds1_1", title: "Anor Londo: Ornstein & Smough", tag: "Boss Fight", progress: 60, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 50. DARK SOULS™ II: Scholar of the First Sin
  {
    id: "pc_steam_335300",
    appId: "335300",
    title: "DARK SOULS™ II: Scholar of the First Sin",
    studio: "FromSoftware • Bandai Namco",
    genre: "Action RPG • Drangleic Kingdom",
    logoImg: "/assets/cache/games/pc_steam_335300/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_335300/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_335300/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "12 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 48, platinum: 0, gold: 2, silver: 6, bronze: 16 },
    friends: "Bearer of the Curse",
    launchUri: "steam://rungameid/335300",
    activities: [
      { id: "ds2_1", title: "Throne of Want: Final Boss", tag: "Story Climax", progress: 45, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 51. DARK SOULS™ III
  {
    id: "pc_steam_374320",
    appId: "374320",
    title: "DARK SOULS™ III",
    studio: "FromSoftware • Bandai Namco",
    genre: "Action RPG • Lothric Kingdom",
    logoImg: "/assets/cache/games/pc_steam_374320/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_374320/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_374320/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "25 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 62, platinum: 0, gold: 3, silver: 9, bronze: 24 },
    friends: "Ashen One",
    launchUri: "steam://rungameid/374320",
    activities: [
      { id: "ds3_1", title: "Kiln of the First Flame: Soul of Cinder", tag: "Final Boss", progress: 60, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 52. WWE 2K24
  {
    id: "pc_steam_2315690",
    appId: "2315690",
    title: "WWE 2K24",
    studio: "Visual Concepts • 2K Sports",
    genre: "Sports • Pro Wrestling Showcase",
    logoImg: "/assets/cache/games/pc_steam_2315690/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_2315690/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_2315690/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "90 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 50, platinum: 0, gold: 3, silver: 10, bronze: 25 },
    friends: "Cody Rhodes • American Nightmare",
    launchUri: "steam://rungameid/2315690",
    activities: [
      { id: "wwe24_1", title: "MyRISE: 40 Years of WrestleMania Showcase", tag: "Showcase", progress: 50, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 53. WWE 2K26
  {
    id: "pc_steam_3717070",
    appId: "3717070",
    title: "WWE 2K26",
    studio: "Visual Concepts • 2K Sports",
    genre: "Sports • Pro Wrestling Simulation",
    logoImg: "/assets/cache/games/pc_steam_3717070/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_3717070/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_3717070/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "100 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 40, platinum: 0, gold: 2, silver: 7, bronze: 18 },
    friends: "WrestleMania Rivals",
    launchUri: "steam://rungameid/3717070",
    activities: [
      { id: "wwe26_1", title: "MyRISE: Road to WrestleMania", tag: "Career Story", progress: 40, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 54. The Crew™ Motorfest
  {
    id: "pc_steam_2698940",
    appId: "2698940",
    title: "The Crew™ Motorfest",
    studio: "Ubisoft Ivory Tower • A Ubisoft Original",
    genre: "Open World Racing • Island Festival",
    logoImg: "/assets/cache/games/pc_steam_2698940/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_2698940/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_2698940/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "40 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 58, platinum: 0, gold: 3, silver: 9, bronze: 20 },
    friends: "Hawaii Speed Festival",
    launchUri: "steam://rungameid/2698940",
    activities: [
      { id: "cmf_1", title: "Oahu Main Stage: Opening Festival", tag: "Grand Race", progress: 55, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 55. 007 First Light
  {
    id: "pc_steam_3768760",
    appId: "3768760",
    title: "007 First Light",
    studio: "IO Interactive • James Bond Origin Story",
    genre: "Stealth Action • Spy Thriller",
    logoImg: "/assets/cache/games/pc_steam_3768760/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_3768760/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_3768760/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "50 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 35, platinum: 0, gold: 1, silver: 5, bronze: 12 },
    friends: "Agent 007 Origins",
    launchUri: "steam://rungameid/3768760",
    activities: [
      { id: "fl_1", title: "Licence to Kill: First Mission", tag: "Origin Story", progress: 35, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 56. Batman™: Arkham VR
  {
    id: "pc_steam_502820",
    appId: "502820",
    title: "Batman™: Arkham VR",
    studio: "Rocksteady Studios • WB Games",
    genre: "VR Adventure • Superhero Immersive",
    logoImg: "/assets/cache/games/pc_steam_502820/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_502820/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_502820/hero.jpg",
    heroBgPos: "center center",
    heroBgSize: "cover",
    heroBgZoom: 1.0,
    heroBgOrigin: "center center",
    badge: "Owned",
    installed: false,
    installSize: "8 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 90, platinum: 1, gold: 3, silver: 6, bronze: 10 },
    friends: "Gotham VR Experience",
    launchUri: "steam://rungameid/502820",
    activities: [
      { id: "bavr_1", title: "The Dark Knight's Perspective", tag: "VR Campaign", progress: 90, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 45. Where Winds Meet
  {
    id: "pc_steam_3564740",
    appId: "3564740",
    title: "Where Winds Meet",
    studio: "Everstone Studio",
    genre: "Action RPG • Wuxia Open World",
    logoImg: "/assets/cache/games/pc_steam_3564740/logo.png",
    tileIcon: "/assets/cache/games/pc_steam_3564740/tile.jpg",
    heroBg: "/assets/cache/games/pc_steam_3564740/hero.jpg",
    badge: "Owned",
    installed: false,
    installSize: "50.0 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 30, platinum: 0, gold: 1, silver: 5, bronze: 10 },
    friends: "Wuxia Open World Exploration",
    launchUri: "steam://rungameid/3564740",
    activities: [
      { id: "wwm_1", title: "Ten Kingdoms Dynasty Saga", tag: "Wuxia Adventure", progress: 30, timeEst: "45m" }
    ],
    liveStatus: "Owned on Steam • 50.0 GB Download"
  }
];

export function isNonGameSteamApp(title, appId) {
  const NON_GAME_IDS = new Set([
    '7','228980','1070560','1391110','1628350','216938','250820',
    '365670','1905180','223850','294420','3301060','480','760',
    '1887720','1493710','2371090','241100','1486350','1755070','2215200'
  ]);
  if (appId && NON_GAME_IDS.has(String(appId))) return true;
  if (!title) return false;
  const t = title.toLowerCase();
  if (/^steam\s+app\s+\d+$/i.test(title)) return true;
  if (/^steam\s+game\s+\d+$/i.test(title)) return true;
  if (t.includes(' demo') || t.endsWith(' demo') || t.includes('demo edition')) return true;
  return [
    'steamworks','redistributable','common redist','runtime',
    'proton','dedicated server','server tool','3dmark','obs studio','soundpad',
    'sdk','openvr','steamvr','live wallpaper','audio visualizer',
    'desktop mate','vroid studio','spacewar'
  ].some(kw => t.includes(kw));
}

export function normalizeGamePath(p) {
  if (!p || typeof p !== 'string') return '';
  let norm = p.trim().replace(/\//g, '\\');
  // Collapse multiple consecutive backslashes into one, preserving leading double backslash for UNC paths
  norm = norm.replace(/([^\\])\\+/g, '$1\\');
  // Remove trailing backslash unless it is root (e.g. C:\)
  if (norm.length > 3 && norm.endsWith('\\')) {
    norm = norm.replace(/\\+$/, '');
  }
  return norm.toLowerCase();
}

export function stripPlatformSuffix(title) {
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

export function getCanonicalTitleKey(title) {
  if (!title) return '';
  let norm = stripPlatformSuffix(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  if (norm.startsWith('grandtheftautov') && !norm.includes('iv') && !norm.includes('iii') && !norm.includes('vicecity') && !norm.includes('sanandreas')) {
    return 'grandtheftautov';
  }
  if (norm.startsWith('grandtheftauto5')) {
    return 'grandtheftautov';
  }
  // The Last of Us: separate Part I vs Part II distinctly
  if (norm.includes('thelastofus') || norm.includes('lastofus') || norm.includes('tlou')) {
    if (
      norm.includes('partii') || norm.includes('part2') || norm.includes('parttwo') ||
      norm.includes('lastofus2') || norm.includes('lastofusii') ||
      norm.includes('thelastofus2') || norm.includes('thelastofusii') ||
      norm.includes('tlou2') || norm.includes('tlouii') ||
      norm.endsWith('2') || norm.endsWith('ii') ||
      /\b(2|ii|part\s*2|part\s*ii|part\s*two)\b/i.test(title)
    ) {
      return 'thelastofuspart2';
    }
    return 'thelastofuspart1';
  }
  // God of War Ragnarok normalization
  if (norm.includes('godofwar') && (norm.includes('ragnarok') || norm.includes('ragnark'))) {
    return 'godofwarragnarok';
  }
  // Where Winds Meet has been imported from both Steam and the curated catalog;
  // keep full title and WWM abbreviation variants under one canonical identity.
  if (norm.includes('wherewindsmeet') || norm === 'wwm' || norm.startsWith('wwmgame') || (norm.includes('winds') && norm.includes('meet'))) {
    return 'wherewindsmeet';
  }
  // Treat abbreviations and punctuation variants as the same storefront title.
  if (norm === 'gta3' || norm === 'grandtheftauto3' || norm.startsWith('grandtheftautoiii')) return 'grandtheftauto3';
  if (norm === 'gtavicecity' || norm.startsWith('grandtheftautovicecity')) return 'grandtheftautovicecity';
  if (norm === 'gtasanandreas' || norm.startsWith('grandtheftautosanandreas')) return 'grandtheftautosanandreas';
  if (norm.includes('wwe2k26')) return 'wwe2k26';
  // Normalize away edition/subtitle/remake noise so variants of the same title deduplicate cleanly
  norm = norm
    .replace(/premiumedition|deluxeedition|standardedition|ultimateedition|completeedition|specialedition|collectorsedition|anniversaryedition|enhancededition|expandedandenhanced/g, '')
    .replace(/directorscut/g, '')
    .replace(/remastered/g, '')
    .replace(/remake/g, '')
    .replace(/gameoftheyearedition|gotyedition|gotyed|goty/g, '')
    .replace(/definitivedition|definitive/g, '')
    .replace(/digitaldeluxe/g, '')
    .replace(/marvels|marvel/g, '');
  return norm;
}

export function getGameIdentity(g) {
  if (!g) return { platform: null, stableKey: null, titleKey: '', steamAppId: null, normPath: '' };

  let steamAppId = null;
  if (g.appId && /^\d+$/.test(String(g.appId).trim())) {
    steamAppId = String(g.appId).trim();
  } else if (g.id && typeof g.id === 'string' && g.id.startsWith('pc_steam_')) {
    const cand = g.id.replace('pc_steam_', '').trim();
    if (/^\d+$/.test(cand)) steamAppId = cand;
  } else if (g.launchUri && typeof g.launchUri === 'string') {
    const m = g.launchUri.match(/rungameid\/(\d+)/i);
    if (m) steamAppId = m[1];
  }

  const titleKey = getCanonicalTitleKey(g.title);
  // A stale duplicate can carry Steam app ID 3564740 but a generic/custom title.
  // The catalog Steam ID is authoritative for this game identity.
  if (steamAppId === '3564740') return { platform: 'steam', stableKey: 'steam:3564740', titleKey: 'wherewindsmeet', steamAppId, normPath: normalizeGamePath(g.execPath || g.installPath || g.installLocation) };
  if (!steamAppId) {
    if (g.id === 'the-last-of-us-part-1' || g.id === 'tlou1' || titleKey === 'thelastofuspart1') {
      steamAppId = '1888930';
    } else if (titleKey === 'thelastofuspart2') {
      steamAppId = '2531310';
    } else if (titleKey === 'godofwarragnarok') {
      steamAppId = '2322010';
    }
  }

  let platform = null;
  let stableKey = null;

  if (steamAppId) {
    platform = 'steam';
    stableKey = `steam:${steamAppId}`;
  } else if (g.store === 'epic' || (typeof g.id === 'string' && g.id.startsWith('epic_')) || (typeof g.launchUri === 'string' && g.launchUri.includes('com.epicgames.launcher'))) {
    platform = 'epic';
    const epicApp = g.appId || (typeof g.id === 'string' ? g.id.replace(/^epic_/, '') : null);
    stableKey = epicApp ? `epic:${epicApp}` : null;
  } else if (g.store === 'xbox' || (typeof g.id === 'string' && g.id.startsWith('xbox_')) || (typeof g.launchUri === 'string' && g.launchUri.includes('xbox'))) {
    platform = 'xbox';
    const xboxId = g.id || g.appId;
    stableKey = xboxId ? `xbox:${xboxId}` : null;
  } else if (g.store === 'riot' || g.id === 'pc_valorant' || g.appId === 'valorant' || titleKey === 'valorant') {
    platform = 'riot';
    stableKey = 'riot:valorant';
  } else if (g.isExplore) {
    platform = 'system';
    stableKey = 'system:explore';
  } else if (g.isStore) {
    platform = 'system';
    stableKey = 'system:store';
  } else if (g.isLibrary) {
    platform = 'system';
    stableKey = 'system:library';
  }

  const normPath = normalizeGamePath(g.execPath || g.installPath || g.installLocation);

  return {
    platform,
    stableKey,
    titleKey,
    steamAppId,
    normPath
  };
}

export function areGamesEquivalent(g1, g2) {
  if (!g1 || !g2) return false;
  if (g1 === g2) return true;

  const isWhereWindsMeetRecord = game => {
    const appId = String(game.appId || game.id?.replace(/^pc_steam_/, '') || game.launchUri?.match(/rungameid\/(\d+)/i)?.[1] || '');
    return appId === '3564740' || getCanonicalTitleKey(game.title) === 'wherewindsmeet';
  };
  // The Steam ID or a recognized title alias is sufficient to identify WWM.
  // Requiring both records to already look canonical lets bad aliases through.
  if (isWhereWindsMeetRecord(g1) || isWhereWindsMeetRecord(g2)) return isWhereWindsMeetRecord(g1) && isWhereWindsMeetRecord(g2);

  // 1. Exact ID match (case-insensitive)
  if (g1.id && g2.id && String(g1.id).trim().toLowerCase() === String(g2.id).trim().toLowerCase()) {
    return true;
  }

  const id1 = getGameIdentity(g1);
  const id2 = getGameIdentity(g2);

  // Older sync data may carry malformed IDs or come from another store, so
  // collapse title aliases to the single canonical Steam record.
  const isWhereWindsMeet = id1.titleKey === 'wherewindsmeet' && id2.titleKey === 'wherewindsmeet';
  if (isWhereWindsMeet) return true;

  // 2. System tiles (Explore, Store, Library) must match their exact stable key
  if (id1.platform === 'system' || id2.platform === 'system') {
    return id1.stableKey === id2.stableKey;
  }

  // 3. Normalized installation path match
  // If both have valid on-disk executable or installation paths and they match:
  if (id1.normPath && id2.normPath && id1.normPath === id2.normPath) {
    return true;
  }

  // 4. Same platform stable ID check
  if (id1.platform && id2.platform && id1.platform === id2.platform) {
    if (id1.stableKey && id2.stableKey) {
      if (id1.stableKey === id2.stableKey) {
        return true;
      }
      // Differing numeric Steam appIds on Steam are distinct games
      if (id1.steamAppId && id2.steamAppId && id1.steamAppId !== id2.steamAppId) {
        return false;
      }
      // For Xbox/Epic or slug-based titles, differing keys may be folder name vs catalog ID; allow fallthrough to title key
    }
  }

  // 5. Cross-platform / Catalog match by canonical title key
  if (id1.titleKey && id2.titleKey && id1.titleKey === id2.titleKey) {
    // If both have different numeric Steam appIds, they are DIFFERENT games!
    if (id1.steamAppId && id2.steamAppId && id1.steamAppId !== id2.steamAppId) {
      return false;
    }
    // Multiple shortcuts or detection paths for the same game belong to one unified card.
    return true;
  }

  return false;
}

export function mergeGameRecords(target, source) {
  if (!target || !source || target === source) return target;

  const targetId = getGameIdentity(target);
  const sourceId = getGameIdentity(source);

  // Restore curated title-specific artwork after merging stale Steam sync
  // records, which can otherwise overwrite official art with one title's art.
  const curatedArtwork = {
    '1593500': {
      title: 'God of War',
      tileIcon: '/assets/games/gow/tile.webp',
      heroBg: '/assets/games/gow/hero.webp',
      logoImg: '/assets/games/gow/logo.png'
    },
    '1778820': {
    subtitle: 'Fist Meets Fate',
    heroBgPos: 'center center',
    trophies: { platinum: 1, gold: 3, silver: 10, bronze: 25, progress: 68 },
    friendsWhoPlay: [
      { name: 'Jin', avatar: 'J', color: 'linear-gradient(135deg, #ef4444, #991b1b)' },
      { name: 'Kazuya', avatar: 'K', color: 'linear-gradient(135deg, #8b5cf6, #5b21b6)' },
      { name: 'Reina', avatar: 'R', color: 'linear-gradient(135deg, #f59e0b, #b45309)' }
    ],
    promoCard: {
      title: 'TEKKEN 8 DELUXE',
      image: '/assets/cache/games/pc_steam_1778820/hero.jpg',
      discount: '-30%',
      price: '$48.99',
      origPrice: '$69.99'
    }
  },
  '2322010': {
      title: 'God of War Ragnarök',
      tileIcon: '/assets/games/gowragnarok/tile.webp',
      heroBg: '/assets/games/gowragnarok/hero.webp',
      logoImg: '/assets/games/gowragnarok/logo.png'
    },
    '3564740': {
      title: 'Where Winds Meet',
      tileIcon: '/assets/cache/games/pc_steam_3564740/tile.jpg',
      heroBg: '/assets/cache/games/pc_steam_3564740/hero.jpg',
      logoImg: '/assets/cache/games/pc_steam_3564740/logo.png'
    },
    '3717070': {
      title: 'WWE 2K26',
      tileIcon: '/assets/cache/games/pc_steam_3717070/tile.jpg',
      heroBg: '/assets/cache/games/pc_steam_3717070/hero.jpg',
      logoImg: '/assets/cache/games/pc_steam_3717070/logo.png'
    }
  };
  const isWhereWindsMeet = targetId.titleKey === 'wherewindsmeet' || sourceId.titleKey === 'wherewindsmeet';
  const isWwe2k26 = targetId.titleKey === 'wwe2k26' || sourceId.titleKey === 'wwe2k26';
  const canonicalSteamId = isWhereWindsMeet ? '3564740' : (isWwe2k26 ? '3717070' : (targetId.steamAppId || sourceId.steamAppId));
  const artwork = curatedArtwork[canonicalSteamId];

  // Preserve official / stable IDs
  if (!target.appId && sourceId.steamAppId) {
    target.appId = sourceId.steamAppId;
  }
  if ((!target.id || target.id === 'the-last-of-us-part-1' || target.id === 'tlou1') && sourceId.steamAppId) {
    target.id = `pc_steam_${sourceId.steamAppId}`;
  }

  // Preserve installed status (if either is installed, the merged game is installed)
  const becomesInstalled = Boolean(target.installed || source.installed);
  target.installed = becomesInstalled;

  if (becomesInstalled) {
    target.badge = 'Installed';
    if (source.installed && !target.execPath && source.execPath) {
      target.execPath = source.execPath;
    }
    if (source.installed && source.storageType && (!target.storageType || target.storageType.includes('Ready to Download'))) {
      target.storageType = source.storageType;
    }
    if (source.installed && source.liveStatus && (!target.liveStatus || target.liveStatus.includes('Ready to Download'))) {
      target.liveStatus = source.liveStatus;
    }
    if (source.installed && source.playTime && (!target.playTime || target.playTime.includes('Ready to Download'))) {
      target.playTime = source.playTime;
    }
  } else if (source.isDownloading || source.badge === 'Downloading' || source.badge === 'Paused') {
    target.isDownloading = true;
    target.badge = source.status || source.badge;
    target.status = source.status || source.badge;
    if (source.installSize) target.installSize = source.installSize;
    if (source.storageType) target.storageType = source.storageType;
    if (source.liveStatus) target.liveStatus = source.liveStatus;
  }

  // Preserve stores
  if (!target.store && source.store) target.store = source.store;
  if ((!target.storeName || target.storeName === 'Xbox Game Pass') && source.storeName) target.storeName = source.storeName;
  if (!target.xboxTitleId && source.xboxTitleId) target.xboxTitleId = source.xboxTitleId;
  if (!target.productId && source.productId) target.productId = source.productId;
  if ((!target.launchUri || target.launchUri === 'xbox://') && source.launchUri && source.launchUri !== 'xbox://') {
    target.launchUri = source.launchUri;
  } else if (!target.launchUri && source.launchUri) {
    target.launchUri = source.launchUri;
  }
  if (!target.execPath && source.execPath) target.execPath = source.execPath;
  if (!target.installSize && source.installSize) target.installSize = source.installSize;
  if ((!target.studio || target.studio === 'Xbox Game Studios • PC Game Pass') && source.studio) target.studio = source.studio;
  if ((!target.genre || target.genre === 'Installed on PC' || target.genre === 'Installed on Laptop') && source.genre) target.genre = source.genre;
  if (target.title && source.title) {
    const cleanSource = stripPlatformSuffix(source.title);
    if (stripPlatformSuffix(target.title) !== target.title && cleanSource === source.title) {
      target.title = source.title;
    }
  } else if (target.title) {
    const cleanTarget = stripPlatformSuffix(target.title);
    if (cleanTarget) target.title = cleanTarget;
  }

  // Preserve artwork: Custom user artwork has highest priority
  const sourceHasCustom = Boolean(
    source.hasCustomArtwork ||
    source.customArtwork ||
    (source.heroBg && (source.heroBg.includes('/assets/cache/') || source.heroBg.startsWith('data:') || (source.heroBg.startsWith('http') && !source.heroBg.includes('unsplash')))) ||
    (source.tileIcon && (source.tileIcon.includes('/assets/cache/') || source.tileIcon.startsWith('data:') || (source.tileIcon.startsWith('http') && !source.tileIcon.includes('unsplash'))))
  );

  const targetHasCustom = Boolean(
    target.hasCustomArtwork ||
    target.customArtwork ||
    (target.heroBg && (target.heroBg.includes('/assets/cache/') || target.heroBg.startsWith('data:') || (target.heroBg.startsWith('http') && !target.heroBg.includes('unsplash')))) ||
    (target.tileIcon && (target.tileIcon.includes('/assets/cache/') || target.tileIcon.startsWith('data:') || (target.tileIcon.startsWith('http') && !target.tileIcon.includes('unsplash'))))
  );

  if (sourceHasCustom) {
    if (source.tileIcon) target.tileIcon = source.tileIcon;
    if (source.heroBg) target.heroBg = source.heroBg;
    if (source.logoImg) target.logoImg = source.logoImg;
    target.hasCustomArtwork = true;
    target.customArtwork = true;
    if (source.artworkTimestamp) target.artworkTimestamp = source.artworkTimestamp;
    if (source.heroBgPos) target.heroBgPos = source.heroBgPos;
    if (source.heroBgSize) target.heroBgSize = source.heroBgSize;
    if (source.heroBgZoom !== undefined) target.heroBgZoom = source.heroBgZoom;
    if (source.heroBgOrigin) target.heroBgOrigin = source.heroBgOrigin;
  } else if (!targetHasCustom) {
    // If target has generic or missing art, adopt official assets from source
    if (source.tileIcon && (!target.tileIcon || target.tileIcon.includes('unsplash') || (source.tileIcon.startsWith('/assets/games/') && !target.tileIcon.startsWith('/assets/games/')))) {
      target.tileIcon = source.tileIcon;
    }
    if (source.heroBg && (!target.heroBg || target.heroBg.includes('unsplash') || (source.heroBg.startsWith('/assets/games/') && !target.heroBg.startsWith('/assets/games/')))) {
      target.heroBg = source.heroBg;
    }
    if (source.logoImg && (!target.logoImg || target.logoImg.includes('unsplash') || (source.logoImg.startsWith('/assets/games/') && !target.logoImg.startsWith('/assets/games/')))) {
      target.logoImg = source.logoImg;
    }
  }

  // Preserve activities and trophies if source has them and target does not
  if ((!target.activities || target.activities.length === 0) && source.activities && source.activities.length > 0) {
    target.activities = source.activities;
  }
  if (!target.trophies && source.trophies) {
    target.trophies = source.trophies;
  }

  if (artwork) {
    if (artwork.title) target.title = artwork.title;
    if (artwork.tileIcon) target.tileIcon = artwork.tileIcon;
    if (artwork.heroBg) target.heroBg = artwork.heroBg;
    if (artwork.logoImg) target.logoImg = artwork.logoImg;
    target.appId = canonicalSteamId;
    target.id = `pc_steam_${canonicalSteamId}`;
    if (canonicalSteamId === '3564740') target.launchUri = 'steam://rungameid/3564740';
  }

  return target;
}

export function deduplicateGameList(games) {
  if (!Array.isArray(games)) return [];
  const result = [];
  const curatedAliases = new Map([
    ['wherewindsmeet', { id: 'pc_steam_3564740', appId: '3564740', title: 'Where Winds Meet', base: '/assets/cache/games/pc_steam_3564740', launchUri: 'steam://rungameid/3564740' }],
    ['grandtheftauto3', { id: 'pc_steam_1546970', appId: '1546970', title: 'Grand Theft Auto III – The Definitive Edition', base: '/assets/cache/games/pc_steam_1546970', launchUri: 'steam://rungameid/1546970' }],
    ['grandtheftautovicecity', { id: 'pc_steam_1546990', appId: '1546990', title: 'Grand Theft Auto: Vice City – The Definitive Edition', base: '/assets/cache/games/pc_steam_1546990', launchUri: 'steam://rungameid/1546990' }],
    ['grandtheftautosanandreas', { id: 'pc_steam_1547000', appId: '1547000', title: 'Grand Theft Auto: San Andreas – The Definitive Edition', base: '/assets/cache/games/pc_steam_1547000', launchUri: 'steam://rungameid/1547000' }],
    ['wwe2k26', { id: 'pc_steam_3717070', appId: '3717070', title: 'WWE 2K26', base: '/assets/cache/games/pc_steam_3717070', launchUri: 'steam://rungameid/3717070' }],
    ['wwe2k25', { id: 'pc_steam_2878960', appId: '2878960', title: 'WWE 2K25', base: '/assets/cache/games/pc_steam_2878960', launchUri: 'steam://rungameid/2878960' }]
  ]);

  for (const g of games) {
    if (!g || isExcludedLauncherEntry(g)) continue;

    const key = getCanonicalTitleKey(g.title);
    const appIdKey = String(g.appId || g.id?.replace(/^pc_steam_/, '') || g.launchUri?.match(/rungameid\/(\d+)/i)?.[1] || '');
    const canonicalKey = appIdKey === '3564740' ? 'wherewindsmeet' : key;
    const canonical = curatedAliases.get(canonicalKey);
    const isCustomized = Boolean(
      g.hasCustomArtwork ||
      g.customArtwork ||
      (g.tileIcon && (g.tileIcon.includes('/assets/cache/') || g.tileIcon.startsWith('data:'))) ||
      (g.heroBg && (g.heroBg.includes('/assets/cache/') || g.heroBg.startsWith('data:')))
    );

    if (canonical) {
      g.id = canonical.id;
      g.appId = canonical.appId;
      if (!isCustomized) {
        g.title = canonical.title;
        g.launchUri = canonical.launchUri;
        g.tileIcon = `${canonical.base}/tile.jpg`;
        g.heroBg = `${canonical.base}/hero.jpg`;
        g.logoImg = `${canonical.base}/logo.png`;
      }
    }

    const gameId = String(g.appId || g.id?.replace(/^pc_steam_/, '') || '');
    const titleKey = canonicalKey;
    if (!isCustomized) {
      if (gameId === '1593500') {
        g.title = 'God of War';
        g.tileIcon = '/assets/games/gow/tile.webp';
        g.heroBg = '/assets/games/gow/hero.webp';
        g.logoImg = '/assets/games/gow/logo.png';
      } else if (gameId === '2322010') {
        g.title = 'God of War Ragnarök';
        g.tileIcon = '/assets/games/gowragnarok/tile.webp';
        g.heroBg = '/assets/games/gowragnarok/hero.webp';
        g.logoImg = '/assets/games/gowragnarok/logo.png';
      } else if (gameId === '3564740' || titleKey === 'wherewindsmeet') {
        g.id = 'pc_steam_3564740';
        g.appId = '3564740';
        g.title = 'Where Winds Meet';
        g.tileIcon = '/assets/cache/games/pc_steam_3564740/tile.jpg';
        g.heroBg = '/assets/cache/games/pc_steam_3564740/hero.jpg';
        g.logoImg = '/assets/cache/games/pc_steam_3564740/logo.png';
        g.launchUri = 'steam://rungameid/3564740';
      } else if (gameId === '3717070' || titleKey === 'wwe2k26') {
        g.id = 'pc_steam_3717070';
        g.appId = '3717070';
        g.title = 'WWE 2K26';
        g.tileIcon = '/assets/cache/games/pc_steam_3717070/tile.jpg';
        g.heroBg = '/assets/cache/games/pc_steam_3717070/hero.jpg';
        g.logoImg = '/assets/cache/games/pc_steam_3717070/logo.png';
        g.launchUri = 'steam://rungameid/3717070';
      }

      // Sanitize any known historical corruption before matching:
      const sId = g.appId ? String(g.appId).trim() : (g.id ? String(g.id).replace('pc_steam_', '').trim() : '');
      if (sId === '2215430') {
        g.title = "Ghost of Tsushima DIRECTOR'S CUT";
        if (!g.tileIcon || g.tileIcon.includes('gtav')) g.tileIcon = '/assets/games/got/tile.webp';
        if (!g.heroBg || g.heroBg.includes('gtav')) g.heroBg = '/assets/games/got/hero.webp';
        if (!g.logoImg || g.logoImg.includes('gtav')) g.logoImg = '/assets/games/got/logo.png';
      }
    }

    const existingIndex = result.findIndex(existing => areGamesEquivalent(existing, g));

    if (existingIndex === -1) {
      result.push(g);
    } else {
      mergeGameRecords(result[existingIndex], g);
    }
  }

  return result;
}

function getSavedSyncedPCGames() {
  try {
    const raw = localStorage.getItem('ps5_synced_pc_games');
    if (!raw) return [];
    const list = JSON.parse(raw);
    const filtered = list.filter(g => {
      if (!g || isExcludedLauncherEntry(g)) return false;
      if (
        g.id === 'pc_forza_horizon' ||
        g.title === 'Forza Horizon' ||
        g.appId === '1755070' ||
        g.id === 'pc_steam_1755070' ||
        g.appId === '2215200' ||
        g.id === 'pc_steam_2215200' ||
        g.title?.toLowerCase().includes('demo') ||
        g.tileIcon?.includes('photo-1550745165-9bc0b252726f') ||
        isNonGameSteamApp(g.title, g.appId)
      ) {
        return false;
      }
      if (isSteamCatalogEntry(g)) {
        if (g.favorite === false) return false;
        if (_steamFavoritesAuthoritative) {
          const aid = String(g.appId || g.id?.replace('pc_steam_', '') || '');
          if (!aid || !STEAM_FAVORITE_APPIDS.has(aid)) return false;
        }
      }
      if (!g.installed && UNOWNED_EPIC_OR_RIOT_IDS.has(g.id)) {
        return false;
      }
      if (g.store === 'xbox' && !g.installed && (
        UNOWNED_XBOX_CATALOG_IDS.has(g.id) ||
        g.xboxOwnedVerified !== true ||
        /\b(add-on|addon|dlc|expansion pack|soundtrack|content pack|trial|minecraft launcher)\b/i.test(String(g.title || ''))
      )) {
        return false;
      }
      return true;
    });
    filtered.forEach(g => {
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
        g.heroBgPos = 'center center';
        g.heroBgSize = 'cover';
        g.heroBgZoom = 1.0;
        g.heroBgOrigin = 'center center';
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
        g.heroBgPos = 'center center';
        g.heroBgSize = 'cover';
        g.heroBgZoom = 1.0;
        g.heroBgOrigin = 'center center';
        g.installSize = '50.0 GB';
        if (!g.installed) {
          g.liveStatus = 'Owned on Steam • 50.0 GB Download';
        }
      }

      if (g.appId === '2050650' || g.id === 'pc_steam_2050650' || (g.title && g.title.toLowerCase() === 'resident evil 4')) {
        g.title = 'Resident Evil 4';
        g.logoImg = '/assets/games/re4/logo.png';
        g.tileIcon = '/assets/games/re4/tile.webp';
        g.heroBg = '/assets/games/re4/hero.webp';
      }
      if (g.installSize === '0.0 GB' || g.installSize === '0 GB' || g.installSize === '0.0GB') {
        g.installed = false;
        g.badge = 'Owned';
        if (OFFICIAL_STEAM_STORE_SIZES[g.appId]) {
          g.installSize = OFFICIAL_STEAM_STORE_SIZES[g.appId];
          g.liveStatus = `Owned on Steam • ${g.installSize} Download`;
        }
      } else if (OFFICIAL_STEAM_STORE_SIZES[g.appId] && !g.installed) {
        g.installSize = OFFICIAL_STEAM_STORE_SIZES[g.appId];
        g.liveStatus = `Owned on Steam • ${g.installSize} Download`;
      }
      if (g.appId === '2483190' || g.id === 'pc_steam_2483190') {
        g.installSize = g.installSize || '167 GB';
        g.liveStatus = g.installed
          ? `Installed on Laptop • ${g.installSize} Ready to Launch`
          : `Steam Favorite • ${g.installSize} Download`;
      }
      if (g.appId === '431960' || g.id === 'pc_steam_431960') {
        g.installSize = '512 MB';
      }
      if (g.appId === '2215430' || g.id === 'pc_steam_2215430' || (g.title && g.title.toLowerCase().includes('ghost of tsushima'))) {
        g.title = "Ghost of Tsushima DIRECTOR'S CUT";
        g.logoImg = '/assets/games/got/logo.png';
        g.tileIcon = '/assets/games/got/tile.webp';
        g.heroBg = '/assets/games/got/hero.webp';
        g.heroBgPos = 'center center';
        g.heroBgSize = 'cover';
        g.heroBgZoom = 1.0;
        g.heroBgOrigin = 'center center';
      }
      if (g.appId === '1817190' || g.id === 'pc_steam_1817190' || (g.title && g.title.toLowerCase().includes('miles morales'))) {
        g.title = "Marvel’s Spider-Man: Miles Morales";
        g.logoImg = '/assets/games/spidermanmilesmorales/logo.png';
        g.tileIcon = '/assets/games/spidermanmilesmorales/tile.webp';
        g.heroBg = '/assets/games/spidermanmilesmorales/hero.webp';
      }
      if (g.appId === '1817070' || g.id === 'pc_steam_1817070' || (g.title && g.title.toLowerCase().includes('spider-man remastered'))) {
        g.title = "Marvel’s Spider-Man Remastered";
        g.logoImg = '/assets/games/spidermanremastered/logo.png';
        g.tileIcon = '/assets/games/spidermanremastered/tile.webp';
        g.heroBg = '/assets/games/spidermanremastered/hero.webp';
      }
      if (g.appId === '2651280' || g.id === 'pc_steam_2651280' || (g.title && g.title.toLowerCase().includes('spider-man 2'))) {
        g.title = "Marvel's Spider-Man 2";
        g.logoImg = '/assets/games/spiderman2/logo.png';
        g.tileIcon = '/assets/games/spiderman2/tile.webp';
        g.heroBg = '/assets/games/spiderman2/hero.webp';
      }
      if (g.appId === '1593500' || g.id === 'pc_steam_1593500' || (g.title && g.title.toLowerCase() === 'god of war')) {
        g.title = 'God of War';
        g.logoImg = '/assets/games/gow/logo.png';
        g.tileIcon = '/assets/games/gow/tile.webp';
        g.heroBg = '/assets/games/gow/hero.webp';
      }
      if (g.appId === '2322010' || g.id === 'pc_steam_2322010' || (g.title && (g.title.toLowerCase().includes('ragnarök') || g.title.toLowerCase().includes('ragnarok')))) {
        g.title = 'God of War Ragnarök';
        g.tileIcon = '/assets/games/gowragnarok/tile.webp';
        g.heroBg = '/assets/games/gowragnarok/hero.webp';
        g.logoImg = '/assets/games/gowragnarok/logo.png';
      }
      const tlouNorm = getCanonicalTitleKey(g.title);
      if (g.appId === '2531310' || g.id === 'pc_steam_2531310' || tlouNorm === 'thelastofuspart2') {
        g.title = 'The Last of Us™ Part II Remastered';
        g.logoImg = '/assets/games/tlou2/logo.png';
        g.tileIcon = '/assets/games/tlou2/tile.webp';
        g.heroBg = '/assets/games/tlou2/hero.webp';
      } else if (g.appId === '1888930' || g.id === 'pc_steam_1888930' || g.id === 'the-last-of-us-part-1' || g.id === 'tlou1' || tlouNorm === 'thelastofuspart1') {
        g.title = 'The Last of Us™ Part I';
        g.logoImg = '/assets/games/tlou1/logo.png';
        g.tileIcon = '/assets/games/tlou1/tile.webp';
        g.heroBg = '/assets/games/tlou1/hero.webp';
      }
      if (g.appId === '1790600' || g.id === 'pc_steam_1790600' || (g.title && g.title.toLowerCase().includes('sparking'))) {
        g.title = 'DRAGON BALL: Sparking! ZERO';
        g.tileIcon = '/assets/games/sparkingzero/tile.webp';
        g.heroBg = '/assets/games/sparkingzero/hero.webp';
        g.logoImg = '/assets/games/sparkingzero/logo.png';
      }
      if (g.appId === '851850' || g.id === 'pc_steam_851850' || (g.title && g.title.trim().toLowerCase() === 'dragon ball z: kakarot')) {
        g.title = 'DRAGON BALL Z: KAKAROT';
        g.logoImg = '/assets/games/dbzkakarot/logo.png';
        g.tileIcon = '/assets/games/dbzkakarot/tile.webp';
        g.heroBg = '/assets/games/dbzkakarot/hero.webp';
        g.installSize = '116.86 GB';
        g.liveStatus = 'Owned on Steam • 116.86 GB Download';
      }
      if (g.appId === '3764200' || g.id === 'pc_steam_3764200' || (g.title && g.title.toLowerCase().includes('requiem'))) {
        g.title = 'Resident Evil Requiem';
        g.logoImg = '/assets/games/rerequiem/logo.png';
        g.tileIcon = '/assets/games/rerequiem/tile.jpg';
        g.heroBg = '/assets/games/rerequiem/hero.jpg';
        g.installSize = '68 GB';
        g.liveStatus = 'Owned on Steam • 68 GB Download';
      }
      if (g.appId === '1650010' || g.id === 'pc_steam_1650010' || (g.title && g.title.toLowerCase().includes('ride 5'))) {
        g.title = 'RIDE 5';
        g.logoImg = '/assets/games/ride5/logo.png';
        g.tileIcon = '/assets/games/ride5/tile.webp';
        g.heroBg = '/assets/games/ride5/hero.webp';
      }
      if (g.appId === '1815780' || g.id === 'pc_steam_1815780' || (g.title && g.title.toLowerCase().includes('asphalt'))) {
        g.title = 'Asphalt Legends';
        g.logoImg = '/assets/games/asphaltlegends/logo.png';
        g.tileIcon = '/assets/games/asphaltlegends/tile.webp';
        g.heroBg = '/assets/games/asphaltlegends/hero.webp';
      }
      if (g.appId === '730' || g.id === 'pc_steam_730' || (g.title && g.title.toLowerCase().includes('counter-strike'))) {
        g.title = 'Counter-Strike 2';
        g.logoImg = '/assets/games/cs2/logo.png';
        g.tileIcon = '/assets/games/cs2/tile.webp';
        g.heroBg = '/assets/games/cs2/hero.webp';
      }
      if (g.appId === '2358720' || g.id === 'pc_steam_2358720') {
        g.tileIcon = '/assets/games/wukong/ps5_tile.webp';
        g.heroBg = '/assets/games/wukong/hero.jpg';
        g.logoImg = '/assets/games/wukong/logo.png';
        g.heroBgPos = 'right center';
        g.heroBgSize = 'cover';
        g.heroBgZoom = 1.0;
        g.heroBgOrigin = 'right center';
        g.subtitle = 'Confront Destiny';
        g.trophies = { progress: 18, platinum: 0, gold: 0, silver: 1, bronze: 11 };
        g.friendsWhoPlay = [
          { name: "Alex", avatar: "A", color: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
          { name: "Chen", avatar: "C", color: "linear-gradient(135deg, #10b981, #047857)" },
          { name: "David", avatar: "D", color: "linear-gradient(135deg, #f59e0b, #b45309)" },
          { name: "Elena", avatar: "E", color: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }
        ];
        g.promoCard = {
          title: "BLACK MYTH WUKONG",
          image: "/assets/games/wukong/steam_library_hero.jpg",
          discount: "-20%",
          price: "$47.99",
          origPrice: "$59.99"
        };
      }
      if (g.id === 'pc_valorant' || g.appId === 'valorant' || (g.title && g.title.toLowerCase() === 'valorant')) {
        g.id = 'pc_valorant';
        g.store = 'riot';
        g.storeName = 'Riot Games';
        g.title = 'VALORANT';
        g.installSize = '45.2 GB';
        g.installed = false;
        g.badge = 'Owned';
        g.storageType = 'Riot Games (Ready to Install)';
        g.liveStatus = 'Owned on Riot Games • Ready to Install';
        g.playTime = 'Ready to Install';
        g.logoImg = '/assets/games/valorant/ps5_logo.svg';
        g.tileIcon = '/assets/games/valorant/ps5_master.png';
        g.heroBg = '/assets/games/valorant/ps5_gamehub_cover.png';
        g.execPath = '';
        g.execArgs = '--launch-product=valorant --launch-patchline=live';
        g.launchUri = 'https://playvalorant.com/';
      }
      // Official artwork repairs for catalog & synced games
      if (g.appId === '3240220' || g.id === 'pc_steam_3240220' || g.id === 'epic_gtav' || (g.title && g.title.toLowerCase().includes('grand theft auto v'))) {
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
      if (g.id === 'xbox_forzahorizon5' || (g.title && g.title.toLowerCase().includes('forza horizon 5'))) {
        g.logoImg = '/assets/games/forzahorizon5/logo.png';
        g.tileIcon = '/assets/games/forzahorizon5/tile.jpg';
        g.heroBg = '/assets/games/forzahorizon5/hero.jpg';
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
    return deduplicateGameList(filtered);
  } catch (e) {
    return [];
  }
}

function buildInitialGamesList() {
  // System PlayStation hubs + synced owned/favorite PC games (never inject unowned Xbox catalog titles)
  const systemTiles = JSON.parse(JSON.stringify(INITIAL_PS5_GAMES.filter(g => g.isStore || g.isExplore)));
  const savedGames = getSavedSyncedPCGames();
  const combined = [
    ...systemTiles,
    ...savedGames
  ];
  return deduplicateGameList(combined);
}

export let PS5_GAMES = buildInitialGamesList();

const CURATED_STEAM_OVERRIDES = [
  { appId: '389730', title: 'TEKKEN 7', size: '78.5 GB', customOwnedStatus: true, matchTitle: t => t.includes('tekken 7') },
  { appId: '3564740', title: 'Where Winds Meet', size: '50.0 GB', customOwnedStatus: true, matchTitle: t => t.includes('where winds meet') },
  { appId: '2668510', title: 'Red Dead Redemption', size: '12 GB', heroBgPos: '60% center', coverMeta: true, matchTitle: t => t.includes('red dead redemption') && !t.includes('2') },
  { appId: '1174180', title: 'Red Dead Redemption 2', size: '120 GB', heroBgPos: '65% center', coverMeta: true, matchTitle: t => t.includes('red dead redemption 2') },
  { appId: '814380', title: 'Sekiro™: Shadows Die Twice - GOTY Edition', size: '25 GB', heroBgPos: 'center center', coverMeta: true, matchTitle: t => t.includes('sekiro') },
  { appId: '570940', title: 'DARK SOULS™: REMASTERED', size: '8 GB', heroBgPos: 'center center', coverMeta: true },
  { appId: '335300', title: 'DARK SOULS™ II: Scholar of the First Sin', size: '12 GB', heroBgPos: 'center 30%', coverMeta: true },
  { appId: '374320', title: 'DARK SOULS™ III', size: '25 GB', heroBgPos: 'center center', coverMeta: true },
  { appId: '2315690', title: 'WWE 2K24', size: '90 GB', heroBgPos: 'center center', coverMeta: true },
  { appId: '3717070', title: 'WWE 2K26', size: '100 GB', heroBgPos: 'center center', coverMeta: true },
  { appId: '2698940', title: 'The Crew™ Motorfest', size: '40 GB', heroBgPos: 'center center', coverMeta: true },
  { appId: '3768760', title: '007 First Light', size: '50 GB', heroBgPos: '65% center', coverMeta: true },
  { appId: '502820', title: 'Batman™: Arkham VR', size: '8 GB', heroBgPos: 'center center', coverMeta: true }
];

function findCuratedSteamOverride(record, allowTitleMatch = true) {
  const recAppId = String(record?.appId || '').trim();
  const recId = String(record?.id || '').trim();
  const recTitle = String(record?.title || '').toLowerCase();
  return CURATED_STEAM_OVERRIDES.find(c =>
    recAppId === c.appId ||
    recId === `pc_steam_${c.appId}` ||
    (allowTitleMatch && c.matchTitle && c.matchTitle(recTitle))
  );
}

function applyCuratedSteamOverride(target, match, scanned, includeArt = true) {
  target.title = match.title;
  target.installSize = match.size;
  if (includeArt) {
    target.logoImg = scanned.logoImg || `/assets/cache/games/pc_steam_${match.appId}/logo.png`;
    target.tileIcon = scanned.tileIcon || `/assets/cache/games/pc_steam_${match.appId}/tile.jpg`;
    target.heroBg = scanned.heroBg || `/assets/cache/games/pc_steam_${match.appId}/hero.jpg`;
    if (match.heroBgPos) target.heroBgPos = match.heroBgPos;
    if (match.coverMeta) {
      target.heroBgSize = 'cover';
      target.heroBgZoom = 1.0;
      target.heroBgOrigin = 'center center';
    }
  }
}

export function syncPCInstalledGames(scannedGames, options = {}) {
  let addedCount = 0;
  let updatedCount = 0;
  let prunedCount = 0;

  const authoritativeSteamSync = Boolean(options?.authoritativeSteamSync ?? options?.steamSynced);
  let allowedSteamFavorites = null;
  if (Array.isArray(options?.steamFavorites)) {
    updateSteamFavoriteAppIds(options.steamFavorites, authoritativeSteamSync);
    allowedSteamFavorites = new Set(STEAM_FAVORITE_APPIDS);
  } else if (authoritativeSteamSync && Array.isArray(scannedGames)) {
    const favIdsFromScan = scannedGames
      .filter(g => g && g.favorite && g.appId && !isNonGameSteamApp(g.title, g.appId))
      .map(g => String(g.appId));
    updateSteamFavoriteAppIds(favIdsFromScan, true);
    allowedSteamFavorites = new Set(STEAM_FAVORITE_APPIDS);
  }

  const normalizedScans = Array.isArray(scannedGames) ? scannedGames : [];
  if (!normalizedScans.length && !authoritativeSteamSync) return 0;

  const saved = [];

  normalizedScans.forEach(scanned => {
    // Skip non-game Steam apps & utility launchers (e.g. Minecraft Launcher)
    if (isExcludedLauncherEntry(scanned) || isNonGameSteamApp(scanned.title, scanned.appId)) return;
    const sAppId = scanned.appId ? String(scanned.appId) : (scanned.launchUri?.match(/rungameid\/(\d+)/)?.[1]);

    // Strictly Favorites-only for Steam whenever authoritative host Steam Favorites exist
    // (including when the user has 0 Steam Favorites — never fall back to all installed non-favorite Steam games).
    if (authoritativeSteamSync && allowedSteamFavorites && isSteamCatalogEntry(scanned)) {
      if (!sAppId || !allowedSteamFavorites.has(sAppId)) return;
    }

    // Give Where Winds Meet a stable Steam identity before attempting a
    // catalog match so it updates its preloaded record instead of appending.
    if (sAppId === '3564740' || getCanonicalTitleKey(scanned.title) === 'wherewindsmeet') {
      scanned = {
        ...scanned,
        id: 'pc_steam_3564740',
        appId: '3564740',
        title: 'Where Winds Meet',
        logoImg: scanned.logoImg || '/assets/cache/games/pc_steam_3564740/logo.png',
        tileIcon: scanned.tileIcon || '/assets/cache/games/pc_steam_3564740/tile.jpg',
        heroBg: scanned.heroBg || '/assets/cache/games/pc_steam_3564740/hero.jpg'
      };
    }

    // Only sync real games or active downloads
    const isDl = Boolean(scanned.isDownloading || scanned.status === 'Downloading' || scanned.status === 'Paused' || scanned.badge === 'Downloading' || scanned.badge === 'Paused');
    const isFav = Boolean(scanned.favorite || (sAppId && STEAM_FAVORITE_APPIDS.has(sAppId)) || (scanned.appId && STEAM_FAVORITE_APPIDS.has(String(scanned.appId))));
    const cachedDir = (scanned.appId || sAppId) ? `/assets/cache/games/pc_steam_${scanned.appId || sAppId}` : '';
    const fallbackTile = cachedDir ? `${cachedDir}/tile.jpg` : '';
    const fallbackHero = cachedDir ? `${cachedDir}/hero.jpg` : '';
    const fallbackLogo = cachedDir ? `${cachedDir}/logo.png` : '';

    const existing = PS5_GAMES.find(g => areGamesEquivalent(g, scanned));

    if (existing) {
      existing.favorite = isFav;
      if (scanned.store) existing.store = scanned.store;
      if (scanned.storeName) existing.storeName = scanned.storeName;
      if (scanned.store === 'steam' && scanned.id && existing.id?.startsWith('xbox_')) {
        existing.id = scanned.id;
      }
      if (!existing.store) {
        existing.store = existing.id?.startsWith('epic_') ? 'epic' : existing.id?.startsWith('xbox_') ? 'xbox' : (existing.id === 'pc_valorant' ? 'riot' : 'steam');
        existing.storeName = existing.store === 'epic' ? 'Epic Games' : existing.store === 'xbox' ? 'Xbox Game Pass' : existing.store === 'riot' ? 'Riot Games' : 'Steam';
      }

      const existingHasCustom = Boolean(
        existing.hasCustomArtwork ||
        existing.customArtwork ||
        (existing.heroBg && (existing.heroBg.includes('/assets/cache/') || existing.heroBg.startsWith('data:') || (existing.heroBg.startsWith('http') && !existing.heroBg.includes('unsplash')))) ||
        (existing.tileIcon && (existing.tileIcon.includes('/assets/cache/') || existing.tileIcon.startsWith('data:') || (existing.tileIcon.startsWith('http') && !existing.tileIcon.includes('unsplash'))))
      );

      if (existing.appId === '2483190' || existing.id === 'pc_steam_2483190') {
        existing.installed = scanned.installed;
        existing.badge = scanned.installed ? 'Installed' : 'Owned';
        existing.title = 'Forza Horizon 6';
        existing.installSize = '167 GB';
        existing.storageType = scanned.installed ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)';
        existing.liveStatus = scanned.installed ? 'Installed on Laptop • 167 GB Ready to Launch' : 'Owned on Steam • 167 GB Download';
        if (!existingHasCustom) {
          existing.logoImg = '/assets/games/forza6/logo.png';
          existing.tileIcon = '/assets/games/forza6/tile.jpg';
          existing.heroBg = '/assets/games/forza6/hero.jpg';
        }
      } else if (existing.appId === '2215430' || existing.id === 'pc_steam_2215430') {
        existing.installed = scanned.installed;
        existing.badge = scanned.installed ? 'Installed' : 'Owned';
        existing.storageType = scanned.installed ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)';
        existing.liveStatus = scanned.installed ? 'Installed on Laptop • Ready to Launch' : 'Owned on Steam • Ready to Download';
        if (!existingHasCustom) {
          existing.heroBg = '/assets/games/got/hero.webp';
          existing.heroBgPos = 'center center';
          existing.heroBgSize = 'cover';
          existing.heroBgZoom = 1.0;
          existing.heroBgOrigin = 'center center';
          existing.logoImg = '/assets/games/got/logo.png';
          if (scanned.tileIcon && (!existing.tileIcon || existing.tileIcon.includes('unsplash'))) existing.tileIcon = scanned.tileIcon;
        }
      } else if (existing.appId === '2358720' || existing.id === 'pc_steam_2358720') {
        existing.installed = scanned.installed;
        existing.badge = scanned.installed ? 'Installed' : 'Owned';
        existing.storageType = scanned.installed ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)';
        existing.liveStatus = scanned.installed ? 'Installed on Laptop • Ready to Launch' : 'Owned on Steam • Ready to Download';
        if (!existingHasCustom) {
          existing.tileIcon = '/assets/games/wukong/ps5_tile.webp';
          existing.heroBg = '/assets/games/wukong/hero.jpg';
          existing.logoImg = '/assets/games/wukong/logo.png';
          existing.heroBgPos = 'right center';
          existing.heroBgSize = 'cover';
          existing.heroBgZoom = 1.0;
          existing.heroBgOrigin = 'right center';
          existing.subtitle = 'Confront Destiny';
          existing.trophies = { progress: 18, platinum: 0, gold: 0, silver: 1, bronze: 11 };
          existing.friendsWhoPlay = [
            { name: "Alex", avatar: "A", color: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
            { name: "Chen", avatar: "C", color: "linear-gradient(135deg, #10b981, #047857)" },
            { name: "David", avatar: "D", color: "linear-gradient(135deg, #f59e0b, #b45309)" },
            { name: "Elena", avatar: "E", color: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }
          ];
          existing.promoCard = {
            title: "BLACK MYTH WUKONG",
            image: "/assets/games/wukong/steam_library_hero.jpg",
            discount: "-20%",
            price: "$47.99",
            origPrice: "$59.99"
          };
          if (scanned.logoImg) existing.logoImg = scanned.logoImg;
        }
      } else if (existing.id === 'pc_valorant' || existing.appId === 'valorant' || (existing.title && existing.title.toLowerCase() === 'valorant')) {
        const isValInstalled = Boolean(scanned.installed);
        existing.installed = isValInstalled;
        existing.badge = isValInstalled ? 'Installed' : 'Owned';
        existing.title = 'VALORANT';
        existing.installSize = '45.2 GB';
        existing.storageType = isValInstalled ? 'Laptop SSD (Riot Games)' : 'Riot Games (Ready to Install)';
        existing.liveStatus = isValInstalled ? 'Installed on Laptop • Low Latency 240FPS Vanguard Active' : 'Owned on Riot Games • Ready to Install';
        existing.playTime = isValInstalled ? 'Ready to Play' : 'Ready to Install';
        if (!existingHasCustom) {
          existing.logoImg = '/assets/games/valorant/ps5_logo.svg';
          existing.tileIcon = '/assets/games/valorant/ps5_master.png';
          existing.heroBg = '/assets/games/valorant/ps5_gamehub_cover.png';
        }
        existing.execPath = isValInstalled ? (scanned.execPath || 'C:\\Riot Games\\Riot Client\\RiotClientServices.exe') : '';
        existing.execArgs = '--launch-product=valorant --launch-patchline=live';
        existing.launchUri = isValInstalled ? '' : 'https://playvalorant.com/';
      } else if ((() => {
        const match = findCuratedSteamOverride(existing, true);
        if (!match) return false;
        existing.installed = scanned.installed;
        existing.badge = scanned.installed ? 'Installed' : 'Owned';
        existing.storageType = scanned.installed ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)';
        existing.liveStatus = scanned.installed
          ? 'Installed on Laptop • Ready to Launch'
          : (match.customOwnedStatus ? `Owned on Steam • ${match.size} Download` : 'Owned on Steam • Ready to Download');
        applyCuratedSteamOverride(existing, match, scanned, !existingHasCustom);
        return true;
      })()) {
        // Curated Steam entry updated cleanly
      } else {
        const isStaleZero = scanned.installSize === '0.0 GB' || scanned.installSize === '0 GB' || scanned.installSize === '0.0GB';
        const isReallyInstalled = scanned.installed && !isStaleZero;
        const isDownloading = Boolean(scanned.isDownloading || scanned.status === 'Downloading' || scanned.status === 'Paused' || scanned.badge === 'Downloading' || scanned.badge === 'Paused');
        existing.installed = isReallyInstalled;
        existing.isDownloading = isDownloading;
        existing.badge = isReallyInstalled ? 'Installed' : (isDownloading ? (scanned.status || scanned.badge || 'Downloading') : 'Owned');
        existing.storageType = isReallyInstalled ? `Laptop SSD (${existing.storeName || 'PC'})` : (isDownloading ? 'Steam Library (Downloading)' : `${existing.storeName || 'Game Store'} (Ready to Download)`);
        existing.liveStatus = isReallyInstalled ? 'Installed on Laptop • Ready to Launch' : (isDownloading ? `Downloading on Steam • ${scanned.installSize || 'In Progress'}` : `Owned on ${existing.storeName || 'Store'} • Ready to Download`);
        const isPlaceholderArt = (val) => !val || val.includes('unsplash') || val.includes('/assets/cache/') || val.includes('/api/pc/asset');
        if (scanned.logoImg && ((!existingHasCustom && isPlaceholderArt(existing.logoImg)) || !existing.logoImg)) existing.logoImg = scanned.logoImg;
        else if (!existing.logoImg && fallbackLogo) existing.logoImg = fallbackLogo;
        if (scanned.heroBg && ((!existingHasCustom && isPlaceholderArt(existing.heroBg)) || !existing.heroBg)) existing.heroBg = scanned.heroBg;
        else if (!existing.heroBg && fallbackHero) existing.heroBg = fallbackHero;
        if (scanned.tileIcon && ((!existingHasCustom && isPlaceholderArt(existing.tileIcon)) || !existing.tileIcon)) existing.tileIcon = scanned.tileIcon;
        else if (!existing.tileIcon && fallbackTile) existing.tileIcon = fallbackTile;
      }

      if (scanned.launchUri && (!existing.launchUri || existing.launchUri === 'xbox://' || scanned.launchUri !== 'xbox://')) existing.launchUri = scanned.launchUri;
      if (scanned.execPath) existing.execPath = scanned.execPath;
      if (scanned.execArgs) existing.execArgs = scanned.execArgs;
      if (scanned.appId) existing.appId = scanned.appId;
      if (scanned.xboxTitleId) existing.xboxTitleId = scanned.xboxTitleId;
      if (scanned.productId) existing.productId = scanned.productId;
      if (scanned.xboxOwnedVerified === true) existing.xboxOwnedVerified = true;
      if (scanned.studio && (!existing.studio || existing.studio === 'Xbox Game Studios • PC Game Pass')) existing.studio = scanned.studio;
      if (scanned.genre && (!existing.genre || existing.genre === 'Installed on PC' || existing.genre === 'Installed on Laptop')) existing.genre = scanned.genre;
      if (scanned.title && existing.title && stripPlatformSuffix(existing.title) !== existing.title && stripPlatformSuffix(scanned.title) === scanned.title) {
        existing.title = scanned.title;
      }
      if (scanned.playTime) existing.playTime = scanned.playTime;
      if (scanned.lastPlayed) existing.lastPlayed = scanned.lastPlayed;
      if (OFFICIAL_STEAM_STORE_SIZES[existing.appId] && (!existing.installed || scanned.installSize === '0.0 GB' || scanned.installSize === '0 GB')) {
        existing.installSize = OFFICIAL_STEAM_STORE_SIZES[existing.appId];
      } else if (scanned.installSize && scanned.installSize !== '0.0 GB' && scanned.installSize !== '0 GB') {
        existing.installSize = scanned.installSize;
      }

      updatedCount++;
      saved.push(existing);
    } else {
      const storeKey = scanned.store || (scanned.launchUri?.includes('com.epicgames.launcher') ? 'epic' : scanned.launchUri?.includes('xbox') ? 'xbox' : (scanned.id === 'pc_valorant' || scanned.title?.toLowerCase() === 'valorant' ? 'riot' : 'steam'));
      const storeName = scanned.storeName || (storeKey === 'epic' ? 'Epic Games' : storeKey === 'xbox' ? 'Xbox Game Pass' : storeKey === 'riot' ? 'Riot Games' : 'Steam');
      const targetSize = scanned.installSize || OFFICIAL_STEAM_STORE_SIZES[scanned.appId] || (scanned.installed ? 'PC Install' : `${storeName} Cloud`);
      const isDownloading = Boolean(scanned.isDownloading || scanned.status === 'Downloading' || scanned.status === 'Paused' || scanned.badge === 'Downloading' || scanned.badge === 'Paused');
      const badge = scanned.installed ? 'Installed' : (isDownloading ? (scanned.status || scanned.badge || 'Downloading') : 'Owned');
      const newGame = {
        id: scanned.id || `pc_${storeKey}_` + (scanned.appId || Date.now()),
        appId: scanned.appId || '',
        store: storeKey,
        storeName: storeName,
        title: scanned.title,
        studio: scanned.studio || `${storeName} Library • PC Game`,
        genre: scanned.genre || (scanned.installed ? 'Installed on Laptop' : (isDownloading ? `${storeName} Library • Downloading` : `${storeName} Library • Owned`)),
        logoImg: scanned.logoImg || fallbackLogo,
        tileIcon: scanned.tileIcon || fallbackTile,
        heroBg: scanned.heroBg || fallbackHero,
        badge: badge,
        favorite: isFav,
        installed: scanned.installed,
        isDownloading: isDownloading,
        ...(scanned.xboxOwnedVerified ? { xboxOwnedVerified: true } : {}),
        ...(scanned.xboxTitleId ? { xboxTitleId: scanned.xboxTitleId } : {}),
        ...(scanned.productId ? { productId: scanned.productId } : {}),
        installSize: targetSize,
        storageType: scanned.storageType || (scanned.installed ? `Laptop SSD (${storeName})` : (isDownloading ? `${storeName} Library (Downloading)` : `${storeName} (Ready to Download)`)),
        playTime: scanned.playTime || (scanned.installed ? 'Ready to Play' : (isDownloading ? (scanned.statusText || 'Downloading') : 'Ready to Download')),
        lastPlayed: scanned.lastPlayed || 0,
        trophies: scanned.trophies || { progress: 50, platinum: 0, gold: 2, silver: 5, bronze: 10 },
        execPath: scanned.execPath || '',
        ...(scanned.execArgs ? { execArgs: scanned.execArgs } : {}),
        launchUri: scanned.launchUri || (scanned.appId ? `steam://rungameid/${scanned.appId}` : ''),
        activities: scanned.activities || [
          { id: 'act_' + (scanned.appId || Date.now()), title: (scanned.installed ? 'Launch ' : (isDownloading ? 'Downloading ' : 'Download ')) + scanned.title, tag: scanned.installed ? 'PC Game' : storeName, progress: isDownloading ? 50 : 100, timeEst: scanned.installed ? 'Launch on PC' : (isDownloading ? 'In Progress' : 'Install') }
        ],
        liveStatus: scanned.liveStatus || (scanned.installed ? 'Installed on Laptop • Ready to Launch' : (isDownloading ? `Downloading on ${storeName} • ${targetSize}` : `Owned on ${storeName} • ${targetSize} Download`))
      };

      const newCurated = findCuratedSteamOverride(scanned, true);
      if (newCurated) {
        applyCuratedSteamOverride(newGame, newCurated, scanned, true);
        if (newCurated.customOwnedStatus) {
          newGame.liveStatus = newGame.installed ? 'Installed on Laptop • Ready to Launch' : `Owned on Steam • ${newCurated.size} Download`;
        }
      }

      PS5_GAMES.push(newGame);
      saved.push(newGame);
      addedCount++;
    }
  });

  // Reconcile games in PS5_GAMES that were uninstalled or removed from disk / Steam Favorites
  PS5_GAMES.forEach(g => {
    if (g.isExplore || g.isStore || g.isLibrary) return;
    const isMatched = normalizedScans.some(scanned => areGamesEquivalent(g, scanned));

    if (!isMatched && g.installed) {
      g.installed = false;
      g.isDownloading = false;
      g.status = undefined;
      g.badge = 'Owned';
      g.storageType = `${g.storeName || 'Game Store'} (Ready to Download)`;
      g.liveStatus = `Owned on ${g.storeName || 'Store'} • Ready to Download`;
      g.playTime = g.store === 'riot' ? 'Ready to Install' : 'Ready to Download';
      g.execPath = '';
      if (g.store === 'riot') g.launchUri = 'https://playvalorant.com/';
      updatedCount++;
    }
  });

  // Authoritative host & Steam Favorites enforcement: prune non-favorited Steam items (or non-installed if no Favorites exist)
  // while preserving Xbox ID library games & XBOX_GAME_PASS_CATALOG
  let filteredGames = PS5_GAMES.filter(g => !isExcludedLauncherEntry(g));
  prunedCount += PS5_GAMES.length - filteredGames.length;
  if (authoritativeSteamSync) {
    filteredGames = filteredGames.filter(g => {
      if (g.isExplore || g.isStore || g.isLibrary) return true;
      if (isSteamCatalogEntry(g)) {
        if (authoritativeSteamSync && allowedSteamFavorites) {
          const aid = String(g.appId || g.id?.replace('pc_steam_', '') || '');
          const keep = Boolean(aid && allowedSteamFavorites.has(aid));
          if (!keep) prunedCount++;
          return keep;
        }
        const matchedInHostScan = normalizedScans.some(scanned => areGamesEquivalent(g, scanned));
        if (!matchedInHostScan) {
          prunedCount++;
          return false;
        }
        return true;
      }
      const matchedInHostScan = normalizedScans.some(scanned => areGamesEquivalent(g, scanned));
      const isFakeOrAddonXbox = g.store === 'xbox' && !g.installed && (
        UNOWNED_XBOX_CATALOG_IDS.has(g.id) ||
        g.xboxOwnedVerified !== true ||
        /\b(add-on|addon|dlc|expansion pack|soundtrack|content pack|trial|minecraft launcher)\b/i.test(String(g.title || '')) ||
        !matchedInHostScan
      );
      if (isFakeOrAddonXbox || (!matchedInHostScan && (!g.installed || UNOWNED_EPIC_OR_RIOT_IDS.has(g.id)))) {
        prunedCount++;
        return false;
      }
      return true;
    });
  }

  const dedupedList = deduplicateGameList(filteredGames);
  PS5_GAMES.length = 0;
  PS5_GAMES.push(...dedupedList);

  try {
    const persistable = PS5_GAMES.filter(g => !g.isExplore && !g.isStore && !g.isLibrary);
    localStorage.setItem('ps5_synced_pc_games', JSON.stringify(deduplicateGameList(persistable)));
  } catch (e) {}

  return addedCount + updatedCount + prunedCount;
}

export function setGameInstalled(id, isInstalled) {
  const game = PS5_GAMES.find(g => g.id === id);
  if (game) {
    game.installed = isInstalled;
    game.badge = isInstalled ? "Installed" : "Owned";
    game.storageType = isInstalled ? "Console Storage (NVMe M.2)" : "Steam Library (Ready to Download)";
    game.liveStatus = isInstalled ? "Ready to Play • 4K 60FPS" : `Owned on Steam • ${game.installSize || 'Ready to Download'}`;

    try {
      const raw = localStorage.getItem('ps5_synced_pc_games');
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(g => g && areGamesEquivalent(g, game));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...game };
      } else {
        list.push({ ...game });
      }
      localStorage.setItem('ps5_synced_pc_games', JSON.stringify(deduplicateGameList(list)));
    } catch (e) {
      console.warn('[PS5 Games] Failed to persist installed game state:', e);
    }
  }
  return game;
}

export function getPS5Games() {
  return PS5_GAMES;
}

export const GAME_HUB_METADATA = {
  '2358720': {
    subtitle: 'Confront Destiny',
    heroBgPos: 'right center',
    trophies: { platinum: 0, gold: 0, silver: 1, bronze: 11, progress: 18 },
    friendsWhoPlay: [
      { name: 'Alex', avatar: 'A', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
      { name: 'Chen', avatar: 'C', color: 'linear-gradient(135deg, #10b981, #047857)' },
      { name: 'David', avatar: 'D', color: 'linear-gradient(135deg, #f59e0b, #b45309)' },
      { name: 'Elena', avatar: 'E', color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }
    ],
    promoCard: {
      title: 'BLACK MYTH WUKONG',
      image: '/assets/games/wukong/steam_library_hero.jpg',
      discount: '-20%',
      price: '$47.99',
      origPrice: '$59.99'
    }
  },
  '2215430': {
    subtitle: 'A Storm is Coming',
    heroBgPos: 'center center',
    trophies: { platinum: 1, gold: 4, silver: 12, bronze: 30, progress: 75 },
    friendsWhoPlay: [
      { name: 'Jin', avatar: 'J', color: 'linear-gradient(135deg, #ef4444, #991b1b)' },
      { name: 'Kenji', avatar: 'K', color: 'linear-gradient(135deg, #3b82f6, #1e40af)' },
      { name: 'Yuna', avatar: 'Y', color: 'linear-gradient(135deg, #10b981, #065f46)' }
    ],
    promoCard: {
      title: 'IKI ISLAND EXPANSION',
      image: '/assets/games/got/hero.webp',
      discount: '-25%',
      price: '$14.99',
      origPrice: '$19.99'
    }
  },
  '2651280': {
    subtitle: 'Be Greater. Together.',
    heroBgPos: 'center 25%',
    trophies: { platinum: 1, gold: 2, silver: 10, bronze: 22, progress: 65 },
    friendsWhoPlay: [
      { name: 'Peter', avatar: 'P', color: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
      { name: 'Miles', avatar: 'M', color: 'linear-gradient(135deg, #10b981, #047857)' },
      { name: 'Gwen', avatar: 'G', color: 'linear-gradient(135deg, #ec4899, #be185d)' }
    ],
    promoCard: {
      title: 'DELUXE UPGRADE',
      image: '/assets/games/spiderman2/hero.webp',
      discount: '-20%',
      price: '$7.99',
      origPrice: '$9.99'
    }
  },
  '1778820': {
    subtitle: 'Fist Meets Fate',
    heroBgPos: 'center center',
    trophies: { platinum: 1, gold: 3, silver: 10, bronze: 25, progress: 68 },
    friendsWhoPlay: [
      { name: 'Jin', avatar: 'J', color: 'linear-gradient(135deg, #ef4444, #991b1b)' },
      { name: 'Kazuya', avatar: 'K', color: 'linear-gradient(135deg, #8b5cf6, #5b21b6)' },
      { name: 'Reina', avatar: 'R', color: 'linear-gradient(135deg, #f59e0b, #b45309)' }
    ],
    promoCard: {
      title: 'TEKKEN 8 DELUXE',
      image: '/assets/cache/games/pc_steam_1778820/hero.jpg',
      discount: '-30%',
      price: '$48.99',
      origPrice: '$69.99'
    }
  },
  '2322010': {
    subtitle: 'Death Can Have Me When It Earns Me',
    heroBgPos: 'center center',
    trophies: { platinum: 1, gold: 5, silver: 15, bronze: 28, progress: 82 },
    friendsWhoPlay: [
      { name: 'Kratos', avatar: 'K', color: 'linear-gradient(135deg, #dc2626, #7f1d1d)' },
      { name: 'Atreus', avatar: 'A', color: 'linear-gradient(135deg, #f59e0b, #92400e)' },
      { name: 'Freya', avatar: 'F', color: 'linear-gradient(135deg, #8b5cf6, #5b21b6)' }
    ],
    promoCard: {
      title: 'VALHALLA EXPANSION',
      image: '/assets/games/gowragnarok/hero.webp',
      discount: 'FREE',
      price: 'Free DLC',
      origPrice: ''
    }
  },
  '1593500': {
    subtitle: 'A New Beginning',
    heroBgPos: 'center 30%',
    trophies: { platinum: 1, gold: 5, silver: 14, bronze: 24, progress: 90 },
    friendsWhoPlay: [
      { name: 'Leo', avatar: 'L', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
      { name: 'Marcus', avatar: 'M', color: 'linear-gradient(135deg, #10b981, #047857)' }
    ],
    promoCard: {
      title: 'DIGITAL DELUXE EDITION',
      image: '/assets/games/gow/hero.webp',
      discount: '-50%',
      price: '$19.99',
      origPrice: '$39.99'
    }
  },
  '1245620': {
    subtitle: 'Rise, Tarnished',
    heroBgPos: 'center center',
    trophies: { platinum: 1, gold: 6, silver: 14, bronze: 26, progress: 88 },
    friendsWhoPlay: [
      { name: 'Ranni', avatar: 'R', color: 'linear-gradient(135deg, #60a5fa, #2563eb)' },
      { name: 'Blaidd', avatar: 'B', color: 'linear-gradient(135deg, #64748b, #334155)' },
      { name: 'Melina', avatar: 'M', color: 'linear-gradient(135deg, #f59e0b, #b45309)' }
    ],
    promoCard: {
      title: 'SHADOW OF THE ERDTREE',
      image: '/assets/cache/games/pc_steam_1245620/hero.jpg',
      discount: '-15%',
      price: '$33.99',
      origPrice: '$39.99'
    }
  },
  '1091500': {
    subtitle: 'Night City Changes Every Body',
    heroBgPos: 'center center',
    trophies: { platinum: 1, gold: 4, silver: 12, bronze: 28, progress: 70 },
    friendsWhoPlay: [
      { name: 'V', avatar: 'V', color: 'linear-gradient(135deg, #eab308, #a16207)' },
      { name: 'Johnny', avatar: 'J', color: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
      { name: 'Judy', avatar: 'J', color: 'linear-gradient(135deg, #06b6d4, #0e7490)' }
    ],
    promoCard: {
      title: 'PHANTOM LIBERTY',
      image: '/assets/cache/games/pc_steam_1091500/hero.jpg',
      discount: '-20%',
      price: '$23.99',
      origPrice: '$29.99'
    }
  },
  '2531310': {
    subtitle: 'Every Action Has a Consequence',
    heroBgPos: 'center 20%',
    trophies: { platinum: 1, gold: 3, silver: 10, bronze: 24, progress: 78 },
    friendsWhoPlay: [
      { name: 'Ellie', avatar: 'E', color: 'linear-gradient(135deg, #10b981, #047857)' },
      { name: 'Abby', avatar: 'A', color: 'linear-gradient(135deg, #f59e0b, #b45309)' },
      { name: 'Joel', avatar: 'J', color: 'linear-gradient(135deg, #64748b, #334155)' }
    ],
    promoCard: {
      title: 'NO RETURN ROGUELIKE MODE',
      image: '/assets/games/tlou2/hero.webp',
      discount: 'INCLUDED',
      price: 'Enhanced PS5',
      origPrice: ''
    }
  },
  '1888930': {
    subtitle: 'Endure and Survive',
    heroBgPos: 'center center',
    trophies: { platinum: 1, gold: 4, silver: 11, bronze: 20, progress: 85 },
    friendsWhoPlay: [
      { name: 'Joel', avatar: 'J', color: 'linear-gradient(135deg, #64748b, #334155)' },
      { name: 'Ellie', avatar: 'E', color: 'linear-gradient(135deg, #10b981, #047857)' }
    ],
    promoCard: {
      title: 'LEFT BEHIND PREQUEL',
      image: '/assets/games/tlou1/hero.webp',
      discount: 'INCLUDED',
      price: 'Part I Complete',
      origPrice: ''
    }
  },
  '431960': {
    subtitle: 'Bring Your Desktop to Life',
    heroBgPos: 'center center',
    trophies: { platinum: 0, gold: 2, silver: 5, bronze: 10, progress: 100 },
    friendsWhoPlay: [
      { name: 'Sam', avatar: 'S', color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
      { name: 'Dan', avatar: 'D', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }
    ],
    promoCard: {
      title: 'STEAM WORKSHOP',
      image: '/assets/games/wallpaper/hero.jpg',
      discount: 'WORKSHOP',
      price: 'Over 1M Wallpapers',
      origPrice: ''
    }
  },
  'valorant': {
    subtitle: 'Defy the Limits',
    heroBgPos: 'center 20%',
    trophies: { platinum: 1, gold: 5, silver: 15, bronze: 28, progress: 85 },
    friendsWhoPlay: [
      { name: 'Jett', avatar: 'J', color: 'linear-gradient(135deg, #38bdf8, #0284c7)' },
      { name: 'Reyna', avatar: 'R', color: 'linear-gradient(135deg, #a855f7, #7e22ce)' },
      { name: 'Omen', avatar: 'O', color: 'linear-gradient(135deg, #6366f1, #4338ca)' }
    ],
    promoCard: {
      title: 'EPISODE 9 BATTLEPASS',
      image: '/assets/games/valorant/ps5_gamehub_cover.png',
      discount: '-10%',
      price: '1,000 VP',
      origPrice: ''
    }
  },
  '730': {
    subtitle: 'The Next Era of Counter-Strike',
    heroBgPos: 'center center',
    trophies: { platinum: 0, gold: 1, silver: 4, bronze: 8, progress: 60 },
    friendsWhoPlay: [
      { name: 'Neo', avatar: 'N', color: 'linear-gradient(135deg, #f59e0b, #b45309)' },
      { name: 'S1mple', avatar: 'S', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }
    ],
    promoCard: {
      title: 'PRIME STATUS UPGRADE',
      image: '/assets/games/cs2/hero.webp',
      discount: 'PRIME',
      price: '$14.99',
      origPrice: ''
    }
  },
  '2483190': {
    subtitle: 'Your Ultimate Horizon Adventure',
    heroBgPos: 'center center',
    trophies: { platinum: 0, gold: 5, silver: 15, bronze: 32, progress: 85 },
    friendsWhoPlay: [
      { name: 'Chris', avatar: 'C', color: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
      { name: 'Alex', avatar: 'A', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }
    ],
    promoCard: {
      title: 'VIP MEMBERSHIP & PASS',
      image: '/assets/games/forza6/hero.jpg',
      discount: '-30%',
      price: '$19.99',
      origPrice: '$29.99'
    }
  },
  '2050650': {
    subtitle: 'Survive the Nightmare',
    heroBgPos: 'center center',
    trophies: { platinum: 1, gold: 4, silver: 12, bronze: 22, progress: 80 },
    friendsWhoPlay: [
      { name: 'Leon', avatar: 'L', color: 'linear-gradient(135deg, #64748b, #334155)' },
      { name: 'Ada', avatar: 'A', color: 'linear-gradient(135deg, #ef4444, #991b1b)' }
    ],
    promoCard: {
      title: 'SEPARATE WAYS DLC',
      image: '/assets/games/re4/hero.webp',
      discount: '-20%',
      price: '$7.99',
      origPrice: '$9.99'
    }
  },
  '2440510': {
    subtitle: 'Break the Heavens',
    heroBgPos: 'center center',
    trophies: { platinum: 1, gold: 3, silver: 12, bronze: 24, progress: 72 },
    friendsWhoPlay: [
      { name: 'Goku', avatar: 'G', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
      { name: 'Vegeta', avatar: 'V', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }
    ],
    promoCard: {
      title: 'SEASON PASS 1',
      image: '/assets/games/sparkingzero/hero.webp',
      discount: '-15%',
      price: '$29.99',
      origPrice: '$34.99'
    }
  },
  '3564740': {
    subtitle: 'Forge Your Own Wuxia Legend',
    heroBgPos: 'center center',
    trophies: { platinum: 0, gold: 2, silver: 8, bronze: 18, progress: 45 },
    friendsWhoPlay: [
      { name: 'Kai', avatar: 'K', color: 'linear-gradient(135deg, #10b981, #047857)' },
      { name: 'Lin', avatar: 'L', color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }
    ],
    promoCard: {
      title: 'FOUNDER PACK EDITION',
      image: '/assets/cache/games/pc_steam_3564740/hero.jpg',
      discount: '-20%',
      price: '$39.99',
      origPrice: '$49.99'
    }
  }
};

export function getGameHubMetadata(item) {
  if (!item) return null;
  const key = String(item.appId || item.id || '').replace(/^pc_steam_/, '');
  const matched = GAME_HUB_METADATA[key] || GAME_HUB_METADATA[item.appId] || GAME_HUB_METADATA[item.id];
  if (matched) return matched;

  const title = (item.title || '').toLowerCase();
  if (title.includes('wukong')) return GAME_HUB_METADATA['2358720'];
  if (title.includes('tsushima')) return GAME_HUB_METADATA['2215430'];
  if (title.includes('spider-man 2') || title.includes('spiderman 2')) return GAME_HUB_METADATA['2651280'];
  if (title.includes('ragnarok') || title.includes('ragnarök')) return GAME_HUB_METADATA['2322010'];
  if (title.includes('god of war')) return GAME_HUB_METADATA['1593500'];
  if (title.includes('elden ring')) return GAME_HUB_METADATA['1245620'];
  if (title.includes('cyberpunk')) return GAME_HUB_METADATA['1091500'];
  if (title.includes('last of us') && (title.includes('part ii') || title.includes('part 2'))) return GAME_HUB_METADATA['2531310'];
  if (title.includes('last of us')) return GAME_HUB_METADATA['1888930'];
  if (title.includes('wallpaper')) return GAME_HUB_METADATA['431960'];
  if (title.includes('valorant')) return GAME_HUB_METADATA['valorant'];
  if (title.includes('counter-strike') || title.includes('cs2')) return GAME_HUB_METADATA['730'];
  if (title.includes('forza')) return GAME_HUB_METADATA['2483190'];
  if (title.includes('resident evil 4')) return GAME_HUB_METADATA['2050650'];
  if (title.includes('sparking') || title.includes('dragon ball')) return GAME_HUB_METADATA['2440510'];
  if (title.includes('tekken 8')) return GAME_HUB_METADATA['1778820'];
  if (title.includes('where winds meet')) return GAME_HUB_METADATA['3564740'];

  const hash = Math.abs((item.id || item.title || 'game').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const hasPlat = (item.installed && (hash % 5 === 0)) ? 1 : 0;
  const gold = Math.min(6, (hash % 4));
  const silver = (hash % 10) + 2;
  const bronze = (hash % 20) + 6;
  const progress = Math.min(100, Math.round((silver + bronze) * 2.5));

  const colors = [
    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    'linear-gradient(135deg, #10b981, #047857)',
    'linear-gradient(135deg, #f59e0b, #b45309)',
    'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    'linear-gradient(135deg, #ec4899, #be185d)'
  ];

  return {
    subtitle: item.subtitle || item.tagline || item.genre || 'Experience the Adventure',
    heroBgPos: item.heroBgPos || 'center center',
    trophies: item.trophies || { platinum: hasPlat, gold, silver, bronze, progress },
    friendsWhoPlay: item.friendsWhoPlay || [
      { name: 'Alex', avatar: 'A', color: colors[hash % colors.length] },
      { name: 'Jordan', avatar: 'J', color: colors[(hash + 1) % colors.length] },
      { name: 'Sam', avatar: 'S', color: colors[(hash + 2) % colors.length] }
    ],
    promoCard: item.promoCard || {
      title: item.title ? item.title.toUpperCase() : 'GAME SPECIAL',
      image: item.heroBg || item.tileIcon || '/assets/games/explore/hero.svg',
      discount: item.installed ? 'COMMUNITY' : '-20%',
      price: item.installed ? 'Active' : '$49.99',
      origPrice: item.installed ? '' : '$59.99'
    }
  };
}

export const GameIdentityManager = {
  getIdentity: getGameIdentity,
  areEquivalent: areGamesEquivalent,
  deduplicate: deduplicateGameList,
  merge: mergeGameRecords
};
