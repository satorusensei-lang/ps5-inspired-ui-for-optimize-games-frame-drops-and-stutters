/* ==========================================================================
   PlayStation 5 Games Database with 4K Wallpapers, Install Status & Storage
   ========================================================================== */

export const INITIAL_PS5_GAMES = [
  {
    id: "ps-explore",
    isExplore: true,
    title: "Explore",
    studio: "PlayStation Official News & Community Hub",
    genre: "PlayStation Blog • System Updates • PS Plus Highlights",
    logoImg: "",
    tileIcon: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80",
    heroBg: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80",
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
  },
  {
    id: "ps-store",
    isStore: true,
    title: "PlayStation Store",
    studio: "Official PlayStation Store • Discover Latest Releases & Deals",
    genre: "Featured • Subscriptions • Pre-Orders",
    logoImg: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/PlayStation_logo.svg/512px-PlayStation_logo.svg.png",
    tileIcon: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80",
    heroBg: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80",
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
  "431960": "512 MB",
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
  "1790600": "29 GB",
  "1815780": "10 GB",
  "1817070": "75 GB",
  "1817190": "75 GB",
  "1888930": "100 GB",
  "2050650": "67 GB",
  "2215200": "50 GB",
  "2215430": "75 GB",
  "2322010": "190 GB",
  "2358720": "130 GB",
  "2440510": "130 GB",
  "2483190": "167 GB",
  "2531310": "150 GB",
  "2651280": "140 GB",
  "2878960": "103 GB",
  "3240220": "105 GB",
  "3301060": "500 MB",
  "3357650": "40 GB",
  "3764200": "45 GB",
  "4080220": "100 GB"
};

export const REAL_PC_PRELOADED_GAMES = [
  // 1. Ghost of Tsushima DIRECTOR'S CUT (Installed)
  {
    id: "pc_steam_2215430",
    appId: "2215430",
    title: "Ghost of Tsushima DIRECTOR'S CUT",
    studio: "Sucker Punch • PlayStation PC Publishing",
    genre: "Action Adventure • Samurai Epic",
    logoImg: "/api/pc/asset?appId=2215430&type=logo",
    tileIcon: "/api/pc/asset?appId=2215430&type=tile",
    heroBg: "/assets/games/got/hero.jpg",
    badge: "Installed",
    installed: true,
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
    liveStatus: "Installed on Laptop • Native 4K 60FPS Fidelity Mode"
  },
  // 2. Forza Horizon 6 (Installed)
  {
    id: "pc_steam_2483190",
    appId: "2483190",
    title: "Forza Horizon 6",
    studio: "Playground Games • Xbox Game Studios",
    genre: "Open World Racing • Next-Gen Simulation",
    logoImg: "/assets/games/forza6/logo.png",
    tileIcon: "/assets/games/forza6/tile.jpg",
    heroBg: "/assets/games/forza6/hero.jpg",
    badge: "Installed",
    installed: true,
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
  // 3. Wallpaper Engine (Installed)
  {
    id: "pc_steam_431960",
    appId: "431960",
    title: "Wallpaper Engine",
    studio: "Kristjan Skutta • Steam Software",
    genre: "Live Wallpapers & Audio Visualizer",
    logoImg: "/api/pc/asset?appId=431960&type=logo",
    tileIcon: "/api/pc/asset?appId=431960&type=tile",
    heroBg: "/api/pc/asset?appId=431960&type=hero",
    badge: "Installed",
    installed: true,
    installSize: "512 MB",
    storageType: "Laptop SSD",
    playTime: "Background",
    execPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\wallpaper_engine\\launcher.exe",
    launchUri: "steam://rungameid/431960",
    activities: [
      { id: "we1", title: "Open Wallpaper Engine Settings", tag: "Utility", progress: 100, timeEst: "Instant" }
    ],
    liveStatus: "Active on Laptop • Interactive Live Desktops"
  },
  // 4. VALORANT (Installed)
  {
    id: "pc_valorant",
    appId: "valorant",
    title: "VALORANT",
    studio: "Riot Games • Tactical Hero Shooter",
    genre: "5v5 Character-Based Tactical Shooter",
    logoImg: "/assets/games/valorant/ps5_logo.svg",
    tileIcon: "/assets/games/valorant/ps5_master.png",
    heroBg: "/assets/games/valorant/ps5_gamehub_cover.png",
    badge: "Installed",
    installed: true,
    installSize: "45.2 GB",
    storageType: "Laptop SSD (Riot Games)",
    playTime: "128 hours",
    trophies: { progress: 85, platinum: 1, gold: 5, silver: 15, bronze: 28 },
    friends: "4 friends in Competitive Party",
    execPath: "C:\\Riot Games\\Riot Client\\RiotClientServices.exe",
    execArgs: "--launch-product=valorant --launch-patchline=live",
    launchUri: "",
    activities: [
      { id: "val1", title: "Competitive Matchmaking: Radiant Ranked", tag: "Ranked", progress: 85, timeEst: "Launch on PC" },
      { id: "val2", title: "Swiftplay & Spike Rush Warmup", tag: "Casual", progress: 100, timeEst: "Launch on PC" },
      { id: "val3", title: "Premier Tournament Stage", tag: "Esports", progress: 50, timeEst: "Ready" }
    ],
    liveStatus: "Installed on Laptop • Low Latency 240FPS Vanguard Active"
  },
  // 5. Black Myth: Wukong
  {
    id: "pc_steam_2358720",
    appId: "2358720",
    title: "Black Myth: Wukong",
    studio: "Game Science • Action RPG",
    genre: "Action RPG • Journey to the West",
    logoImg: "/api/pc/asset?appId=2358720&type=logo",
    tileIcon: "/assets/games/wukong/ps5_tile.webp",
    heroBg: "/assets/games/wukong/ps5_hero.webp",
    badge: "Owned",
    installed: false,
    installSize: "130 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 68, platinum: 0, gold: 3, silver: 11, bronze: 22 },
    friends: "5 friends playing on Steam",
    launchUri: "steam://rungameid/2358720",
    activities: [
      { id: "bmw1", title: "Chapter 3: White Snow, Cold Frost", tag: "Main Story", progress: 60, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=730&type=logo",
    tileIcon: "/api/pc/asset?appId=730&type=tile",
    heroBg: "/api/pc/asset?appId=730&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "85 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 92, platinum: 1, gold: 6, silver: 14, bronze: 32 },
    friends: "8 friends online in Premier",
    launchUri: "steam://rungameid/730",
    activities: [
      { id: "cs1", title: "Premier Matchmaking: Competitive", tag: "Competitive", progress: 100, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=2322010&type=logo",
    tileIcon: "/api/pc/asset?appId=2322010&type=tile",
    heroBg: "/api/pc/asset?appId=2322010&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "190 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 96, platinum: 1, gold: 8, silver: 18, bronze: 36 },
    friends: "Marcus, Elena playing",
    launchUri: "steam://rungameid/2322010",
    activities: [
      { id: "gowr1", title: "Realm Travel: Svartalfheim Depths", tag: "Main Story", progress: 95, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=1593500&type=logo",
    tileIcon: "/api/pc/asset?appId=1593500&type=tile",
    heroBg: "/api/pc/asset?appId=1593500&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "70 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 88, platinum: 1, gold: 7, silver: 15, bronze: 31 },
    friends: "3 friends played",
    launchUri: "steam://rungameid/1593500",
    activities: [
      { id: "gow1", title: "Journey to the Highest Peak", tag: "Main Quest", progress: 85, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=2651280&type=logo",
    tileIcon: "/api/pc/asset?appId=2651280&type=tile",
    heroBg: "/api/pc/asset?appId=2651280&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "140 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 84, platinum: 1, gold: 6, silver: 14, bronze: 28 },
    friends: "Sarah, Alex playing",
    launchUri: "steam://rungameid/2651280",
    activities: [
      { id: "sm2_1", title: "Be Greater. Together.", tag: "Campaign", progress: 80, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=1817070&type=logo",
    tileIcon: "/api/pc/asset?appId=1817070&type=tile",
    heroBg: "/api/pc/asset?appId=1817070&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "75 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 95, platinum: 1, gold: 9, silver: 18, bronze: 38 },
    friends: "6 friends played",
    launchUri: "steam://rungameid/1817070",
    activities: [
      { id: "smr1", title: "The City That Never Sleeps", tag: "Full DLC", progress: 100, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=1817190&type=logo",
    tileIcon: "/api/pc/asset?appId=1817190&type=tile",
    heroBg: "/api/pc/asset?appId=1817190&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "75 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 100, platinum: 1, gold: 8, silver: 16, bronze: 30 },
    friends: "4 friends played",
    launchUri: "steam://rungameid/1817190",
    activities: [
      { id: "mm1", title: "Harlem Holiday Celebration", tag: "Story", progress: 90, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=1888930&type=logo",
    tileIcon: "/api/pc/asset?appId=1888930&type=tile",
    heroBg: "/api/pc/asset?appId=1888930&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "100 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 80, platinum: 0, gold: 6, silver: 14, bronze: 26 },
    friends: "David, Sarah played",
    launchUri: "steam://rungameid/1888930",
    activities: [
      { id: "tlou1", title: "Salt Lake City: The Hospital", tag: "Story Climax", progress: 95, timeEst: "Download" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 12. The Last of Us™ Part II Remastered
  {
    id: "pc_steam_2531310",
    appId: "2531310",
    title: "The Last of Us™ Part II Remastered",
    studio: "Naughty Dog • PlayStation PC",
    genre: "Action Adventure • Post-Apocalyptic",
    logoImg: "/api/pc/asset?appId=2531310&type=logo",
    tileIcon: "/api/pc/asset?appId=2531310&type=tile",
    heroBg: "/api/pc/asset?appId=2531310&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "150 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 70, platinum: 0, gold: 4, silver: 12, bronze: 24 },
    friends: "2 friends playing",
    launchUri: "steam://rungameid/2531310",
    activities: [
      { id: "tlou2", title: "No Return: Roguelike Survival", tag: "New Mode", progress: 50, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=1551360&type=logo",
    tileIcon: "/api/pc/asset?appId=1551360&type=tile",
    heroBg: "/api/pc/asset?appId=1551360&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "110 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 90, platinum: 1, gold: 8, silver: 20, bronze: 45 },
    friends: "Chris, Alex playing",
    launchUri: "steam://rungameid/1551360",
    activities: [
      { id: "fh5_1", title: "Guanajuato Street Racing", tag: "Festival Race", progress: 80, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=2440510&type=logo",
    tileIcon: "/api/pc/asset?appId=2440510&type=tile",
    heroBg: "/api/pc/asset?appId=2440510&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "130 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 65, platinum: 0, gold: 3, silver: 10, bronze: 25 },
    friends: "Motorsport Enthusiasts",
    launchUri: "steam://rungameid/2440510",
    activities: [
      { id: "fm1", title: "Builders Cup Career Series", tag: "Track Career", progress: 75, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=1650010&type=logo",
    tileIcon: "/api/pc/asset?appId=1650010&type=tile",
    heroBg: "/api/pc/asset?appId=1650010&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "50 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 55, platinum: 0, gold: 2, silver: 9, bronze: 18 },
    friends: "2 friends playing",
    launchUri: "steam://rungameid/1650010",
    activities: [
      { id: "ride1", title: "World Superbike: Mugello Circuit", tag: "Career Race", progress: 70, timeEst: "Download" },
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
    logoImg: "/api/pc/asset?appId=1790600&type=logo",
    tileIcon: "/api/pc/asset?appId=1790600&type=tile",
    heroBg: "/api/pc/asset?appId=1790600&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "29 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 85, platinum: 1, gold: 5, silver: 12, bronze: 28 },
    friends: "Goku, Vegeta online",
    launchUri: "steam://rungameid/1790600",
    activities: [
      { id: "dbz0", title: "Episode Battle: Super Saiyan God", tag: "Anime Battle", progress: 85, timeEst: "Download" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 17. DRAGON BALL Z: KAKAROT
  {
    id: "pc_steam_851850",
    appId: "851850",
    title: "DRAGON BALL Z: KAKAROT",
    studio: "CyberConnect2 • Bandai Namco",
    genre: "Action RPG • Anime Adventure",
    logoImg: "/api/pc/asset?appId=851850&type=logo",
    tileIcon: "/api/pc/asset?appId=851850&type=tile",
    heroBg: "/api/pc/asset?appId=851850&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "116.86 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 90, platinum: 1, gold: 6, silver: 15, bronze: 30 },
    friends: "4 friends played",
    launchUri: "steam://rungameid/851850",
    activities: [
      { id: "dbzk", title: "Buu Saga: Final Spirit Bomb", tag: "Epic Story", progress: 100, timeEst: "Download" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 18. Grand Theft Auto V Enhanced
  {
    id: "pc_steam_3240220",
    appId: "3240220",
    title: "Grand Theft Auto V Enhanced",
    studio: "Rockstar Games • Los Santos",
    genre: "Action • Crime Open World",
    logoImg: "/api/pc/asset?appId=3240220&type=logo",
    tileIcon: "/api/pc/asset?appId=3240220&type=tile",
    heroBg: "/api/pc/asset?appId=3240220&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "105 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 94, platinum: 1, gold: 8, silver: 22, bronze: 48 },
    friends: "Franklin, Michael, Trevor in Los Santos",
    launchUri: "steam://rungameid/3240220",
    activities: [
      { id: "gta5_1", title: "The Big Score Heist", tag: "Final Mission", progress: 95, timeEst: "Download" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
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
      { id: "gta4_1", title: "Roman's Sorrow", tag: "Story", progress: 60, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=1546970&type=logo",
    tileIcon: "/api/pc/asset?appId=1546970&type=tile",
    heroBg: "/api/pc/asset?appId=1546970&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "5 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 75, platinum: 0, gold: 3, silver: 8, bronze: 18 },
    friends: "Liberty City Nostalgia",
    launchUri: "steam://rungameid/1546970",
    activities: [
      { id: "gta3_1", title: "Portland to Staunton Island", tag: "Island Unlock", progress: 70, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=1546990&type=logo",
    tileIcon: "/api/pc/asset?appId=1546990&type=tile",
    heroBg: "/api/pc/asset?appId=1546990&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "10 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 85, platinum: 1, gold: 4, silver: 12, bronze: 22 },
    friends: "Tommy Vercetti in Vice City",
    launchUri: "steam://rungameid/1546990",
    activities: [
      { id: "gtavc_1", title: "Rub Out: Vercetti Estate Takeover", tag: "Mansion Heist", progress: 80, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=1547000&type=logo",
    tileIcon: "/api/pc/asset?appId=1547000&type=tile",
    heroBg: "/api/pc/asset?appId=1547000&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "19 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 92, platinum: 1, gold: 7, silver: 16, bronze: 32 },
    friends: "CJ in Los Santos",
    launchUri: "steam://rungameid/1547000",
    activities: [
      { id: "gtasa_1", title: "End of the Line", tag: "Final Mission", progress: 95, timeEst: "Download" }
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
      { id: "ak1", title: "Knightfall Protocol", tag: "True Ending", progress: 100, timeEst: "Download" }
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
      { id: "ac1", title: "Protocol 10 Infiltration", tag: "Story", progress: 90, timeEst: "Download" }
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
      { id: "ao1", title: "8 Assassins Bounty: Deathstroke", tag: "Boss Fight", progress: 75, timeEst: "Download" }
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
      { id: "aa1", title: "Titan Joker Showdown", tag: "Boss Battle", progress: 100, timeEst: "Download" }
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
      { id: "ttb1", title: "Episode 5: City of Light", tag: "Season Finale", progress: 100, timeEst: "Download" }
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
      { id: "lb3_1", title: "Lantern Worlds Free Play", tag: "Exploration", progress: 80, timeEst: "Download" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 29. LEGO® Batman™: Legacy of the Dark Knight
  {
    id: "pc_steam_2215200",
    appId: "2215200",
    title: "LEGO® Batman™: Legacy of the Dark Knight",
    studio: "TT Games • Warner Bros. Games",
    genre: "Action • LEGO Family Adventure",
    logoImg: "/api/pc/asset?appId=2215200&type=logo",
    tileIcon: "/api/pc/asset?appId=2215200&type=tile",
    heroBg: "/api/pc/asset?appId=2215200&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "50 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 70, platinum: 0, gold: 3, silver: 9, bronze: 22 },
    friends: "Family Co-Op",
    launchUri: "steam://rungameid/2215200",
    activities: [
      { id: "lbl1", title: "The Dark Knight Origins", tag: "Story", progress: 70, timeEst: "Download" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 30. WWE 2K25
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
      { id: "wwe1", title: "MyRISE: The Undisputed Era", tag: "Career Story", progress: 60, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=4080220&type=logo",
    tileIcon: "/api/pc/asset?appId=4080220&type=tile",
    heroBg: "/api/pc/asset?appId=4080220&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "100 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 80, platinum: 0, gold: 5, silver: 14, bronze: 30 },
    friends: "Ultimate Team Rivals",
    launchUri: "steam://rungameid/4080220",
    activities: [
      { id: "fc1", title: "Champions Weekend League", tag: "Ultimate Team", progress: 80, timeEst: "Download" }
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
      { id: "cp1", title: "Dogtown Infiltration: Firestarter", tag: "Phantom Liberty", progress: 70, timeEst: "Download" }
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
      { id: "er1", title: "Shadow of the Erdtree: Belurat Tower", tag: "Expansion", progress: 85, timeEst: "Download" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 34. Asphalt Legends
  {
    id: "pc_steam_1815780",
    appId: "1815780",
    title: "Asphalt Legends",
    studio: "Gameloft • High-Octane Racing",
    genre: "Arcade Racing • Supercars",
    logoImg: "/api/pc/asset?appId=1815780&type=logo",
    tileIcon: "/api/pc/asset?appId=1815780&type=tile",
    heroBg: "/api/pc/asset?appId=1815780&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "10 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 60, platinum: 0, gold: 2, silver: 8, bronze: 16 },
    friends: "Multiplayer Club",
    launchUri: "steam://rungameid/1815780",
    activities: [
      { id: "al1", title: "World Series Multiplayer Season", tag: "Arcade", progress: 60, timeEst: "Download" }
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
      { id: "re2_1", title: "R.P.D. Police Station Escape", tag: "Main Story", progress: 80, timeEst: "Download" }
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
      { id: "re3_1", title: "Nemesis Encounter: Downtown", tag: "Main Story", progress: 70, timeEst: "Download" }
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
    logoImg: "/api/pc/asset?appId=2050650&type=logo",
    tileIcon: "/api/pc/asset?appId=2050650&type=tile",
    heroBg: "/api/pc/asset?appId=2050650&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "67 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 90, platinum: 1, gold: 6, silver: 15, bronze: 30 },
    friends: "Leon S. Kennedy rescue mission",
    launchUri: "steam://rungameid/2050650",
    activities: [
      { id: "re4_1", title: "Chapter 4: The Castle Depths", tag: "Main Story", progress: 65, timeEst: "Download" }
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
      { id: "re5_1", title: "Chapter 5-3: Uroboros Confrontation", tag: "Co-Op Campaign", progress: 90, timeEst: "Download" }
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
      { id: "re6_1", title: "Leon Campaign: Tall Oaks", tag: "Story", progress: 85, timeEst: "Download" }
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
      { id: "re7_1", title: "The Baker Estate: Main House", tag: "Horror", progress: 75, timeEst: "Download" }
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
      { id: "rev_1", title: "Castle Dimitrescu Chambers", tag: "Gothic Horror", progress: 85, timeEst: "Download" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 43. Resident Evil Requiem
  {
    id: "pc_steam_3764200",
    appId: "3764200",
    title: "Resident Evil Requiem",
    studio: "Capcom • Next-Gen Horror",
    genre: "Survival Horror • RE Engine",
    logoImg: "/api/pc/asset?appId=3764200&type=logo",
    tileIcon: "/api/pc/asset?appId=3764200&type=tile",
    heroBg: "/api/pc/asset?appId=3764200&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "45 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 50, platinum: 0, gold: 2, silver: 8, bronze: 15 },
    friends: "Biohazard Quarantine",
    launchUri: "steam://rungameid/3764200",
    activities: [
      { id: "req_1", title: "Quarantine Zone Outbreak", tag: "Next-Gen", progress: 50, timeEst: "Download" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  },
  // 44. PRAGMATA
  {
    id: "pc_steam_3357650",
    appId: "3357650",
    title: "PRAGMATA",
    studio: "Capcom • Sci-Fi Adventure",
    genre: "Action Adventure • Lunar Dystopia",
    logoImg: "/api/pc/asset?appId=3357650&type=logo",
    tileIcon: "/api/pc/asset?appId=3357650&type=tile",
    heroBg: "/api/pc/asset?appId=3357650&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "40 GB",
    storageType: "Steam Library (Ready to Download)",
    playTime: "Ready to Download",
    trophies: { progress: 45, platinum: 0, gold: 2, silver: 6, bronze: 12 },
    friends: "Lunar Base Exploration",
    launchUri: "steam://rungameid/3357650",
    activities: [
      { id: "prg_1", title: "Lunar Shelter Extraction", tag: "Sci-Fi", progress: 45, timeEst: "Download" }
    ],
    liveStatus: "Owned on Steam • Ready to Download"
  }
];

export function deduplicateGameList(games) {
  if (!Array.isArray(games)) return [];
  const result = [];
  const seenIds = new Set();
  const seenAppIds = new Set();
  const seenTitles = new Set();

  games.forEach(g => {
    if (!g) return;
    let appId = g.appId ? String(g.appId) : null;
    if (!appId && g.launchUri) {
      const m = g.launchUri.match(/rungameid\/(\d+)/);
      if (m) appId = m[1];
    }
    if (!appId && g.id && g.id.startsWith('pc_steam_')) {
      const candidate = g.id.replace('pc_steam_', '');
      if (/^\d+$/.test(candidate)) appId = candidate;
    }
    const normTitle = (g.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const isDuplicate = 
      (appId && seenAppIds.has(appId)) ||
      (normTitle && seenTitles.has(normTitle)) ||
      (g.id && seenIds.has(g.id));

    if (!isDuplicate) {
      if (appId) {
        g.appId = appId;
        seenAppIds.add(appId);
      }
      if (normTitle) seenTitles.add(normTitle);
      if (g.id) seenIds.add(g.id);
      result.push(g);
    } else {
      const existing = result.find(e => 
        (appId && e.appId && String(e.appId) === appId) ||
        (normTitle && (e.title || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normTitle) ||
        (g.id && e.id === g.id)
      );
      if (existing) {
        if (g.installed && !existing.installed) {
          existing.installed = true;
          existing.badge = 'Installed';
        }
        if (g.appId && !existing.appId) existing.appId = g.appId;
        if (g.execPath && !existing.execPath) existing.execPath = g.execPath;
        if (g.launchUri && !existing.launchUri) existing.launchUri = g.launchUri;
        if (g.logoImg && (!existing.logoImg || existing.logoImg.includes('unsplash'))) existing.logoImg = g.logoImg;
        if (g.heroBg && (!existing.heroBg || existing.heroBg.includes('unsplash'))) existing.heroBg = g.heroBg;
        if (g.tileIcon && (!existing.tileIcon || existing.tileIcon.includes('unsplash'))) existing.tileIcon = g.tileIcon;
      }
    }
  });

  return result;
}

function getSavedSyncedPCGames() {
  try {
    const raw = localStorage.getItem('ps5_synced_pc_games');
    if (!raw) return [];
    const list = JSON.parse(raw);
    const filtered = list.filter(g => 
      g && 
      g.id !== 'pc_forza_horizon' &&
      g.title !== 'Forza Horizon' &&
      g.id !== 'pc_steam_2483190' &&
      g.appId !== '2483190' &&
      !g.tileIcon?.includes('photo-1550745165-9bc0b252726f')
    );
    filtered.forEach(g => {
      if (OFFICIAL_STEAM_STORE_SIZES[g.appId] && !g.installed) {
        g.installSize = OFFICIAL_STEAM_STORE_SIZES[g.appId];
        g.liveStatus = `Owned on Steam • ${g.installSize} Download`;
      }
      if (g.appId === '2483190' || g.id === 'pc_steam_2483190') {
        g.installSize = '167 GB';
        g.liveStatus = 'Installed on Laptop • 167 GB Ready to Launch';
      }
      if (g.appId === '431960' || g.id === 'pc_steam_431960') {
        g.installSize = '512 MB';
      }
      if (g.appId === '2215430' || g.id === 'pc_steam_2215430') {
        g.heroBg = '/assets/games/got/hero.jpg';
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
    return deduplicateGameList(filtered);
  } catch (e) {
    return [];
  }
}

function buildInitialGamesList() {
  const combined = [
    ...JSON.parse(JSON.stringify(INITIAL_PS5_GAMES)),
    ...REAL_PC_PRELOADED_GAMES,
    ...getSavedSyncedPCGames()
  ];
  return deduplicateGameList(combined);
}

export let PS5_GAMES = buildInitialGamesList();

export function syncPCInstalledGames(scannedGames) {
  let addedCount = 0;
  if (!scannedGames || !scannedGames.length) return addedCount;

  const saved = [];

  scannedGames.forEach(scanned => {
    const sAppId = scanned.appId ? String(scanned.appId) : (scanned.launchUri?.match(/rungameid\/(\d+)/)?.[1]);
    const sTitleNorm = (scanned.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const existing = PS5_GAMES.find(g => {
      const gAppId = g.appId ? String(g.appId) : (g.launchUri?.match(/rungameid\/(\d+)/)?.[1]);
      const gTitleNorm = (g.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      if (sAppId && gAppId && sAppId === gAppId) return true;
      if (sTitleNorm && gTitleNorm && sTitleNorm === gTitleNorm) return true;
      if (scanned.id && g.id && (scanned.id === g.id || scanned.id === `pc_steam_${g.appId}`)) return true;
      if (scanned.execPath && g.execPath && scanned.execPath.toLowerCase() === g.execPath.toLowerCase()) return true;
      return false;
    });

    if (existing) {
      if (existing.appId === '2483190' || existing.id === 'pc_steam_2483190') {
        existing.installed = true;
        existing.badge = 'Installed';
        existing.title = 'Forza Horizon 6';
        existing.installSize = '167 GB';
        existing.storageType = 'Laptop SSD (Steam Library)';
        existing.liveStatus = 'Installed on Laptop • 167 GB Ready to Launch';
        existing.logoImg = '/assets/games/forza6/logo.png';
        existing.tileIcon = '/assets/games/forza6/tile.jpg';
        existing.heroBg = '/assets/games/forza6/hero.jpg';
      } else if (existing.appId === '2215430' || existing.id === 'pc_steam_2215430') {
        existing.installed = scanned.installed;
        existing.badge = scanned.installed ? 'Installed' : 'Owned';
        existing.storageType = scanned.installed ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)';
        existing.liveStatus = scanned.installed ? 'Installed on Laptop • Ready to Launch' : 'Owned on Steam • Ready to Download';
        existing.heroBg = '/assets/games/got/hero.jpg';
        if (scanned.logoImg) existing.logoImg = scanned.logoImg;
        if (scanned.tileIcon && (!existing.tileIcon || existing.tileIcon.includes('unsplash'))) existing.tileIcon = scanned.tileIcon;
      } else if (existing.appId === '2358720' || existing.id === 'pc_steam_2358720') {
        existing.installed = scanned.installed;
        existing.badge = scanned.installed ? 'Installed' : 'Owned';
        existing.storageType = scanned.installed ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)';
        existing.liveStatus = scanned.installed ? 'Installed on Laptop • Ready to Launch' : 'Owned on Steam • Ready to Download';
        existing.tileIcon = '/assets/games/wukong/ps5_tile.webp';
        existing.heroBg = '/assets/games/wukong/ps5_hero.webp';
        if (scanned.logoImg) existing.logoImg = scanned.logoImg;
      } else if (existing.id === 'pc_valorant' || existing.appId === 'valorant' || (existing.title && existing.title.toLowerCase() === 'valorant')) {
        existing.installed = scanned.installed !== undefined ? scanned.installed : true;
        existing.badge = existing.installed ? 'Installed' : 'Owned';
        existing.title = 'VALORANT';
        existing.installSize = '45.2 GB';
        existing.storageType = 'Laptop SSD (Riot Games)';
        existing.liveStatus = 'Installed on Laptop • Low Latency 240FPS Vanguard Active';
        existing.logoImg = '/assets/games/valorant/ps5_logo.svg';
        existing.tileIcon = '/assets/games/valorant/ps5_master.png';
        existing.heroBg = '/assets/games/valorant/ps5_gamehub_cover.png';
        existing.execPath = 'C:\\Riot Games\\Riot Client\\RiotClientServices.exe';
        existing.execArgs = '--launch-product=valorant --launch-patchline=live';
      } else {
        existing.installed = scanned.installed;
        existing.badge = scanned.installed ? 'Installed' : 'Owned';
        existing.storageType = scanned.installed ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)';
        existing.liveStatus = scanned.installed ? 'Installed on Laptop • Ready to Launch' : 'Owned on Steam • Ready to Download';
        if (scanned.logoImg) existing.logoImg = scanned.logoImg;
        if (scanned.heroBg && (!existing.heroBg || existing.heroBg.includes('unsplash'))) existing.heroBg = scanned.heroBg;
        if (scanned.tileIcon && (!existing.tileIcon || existing.tileIcon.includes('unsplash'))) existing.tileIcon = scanned.tileIcon;
      }

      if (scanned.launchUri) existing.launchUri = scanned.launchUri;
      if (scanned.execPath) existing.execPath = scanned.execPath;
      if (scanned.appId) existing.appId = scanned.appId;
      if (OFFICIAL_STEAM_STORE_SIZES[existing.appId] && !existing.installed) {
        existing.installSize = OFFICIAL_STEAM_STORE_SIZES[existing.appId];
      } else if (scanned.installSize) {
        existing.installSize = scanned.installSize;
      }

      saved.push(existing);
    } else {
      const targetSize = OFFICIAL_STEAM_STORE_SIZES[scanned.appId] || scanned.installSize || (scanned.installed ? 'PC Install' : 'Steam Cloud');
      const newGame = {
        id: scanned.id || 'pc_steam_' + (scanned.appId || Date.now()),
        appId: scanned.appId || '',
        title: scanned.title,
        studio: scanned.studio || 'Steam Library • PC Game',
        genre: scanned.genre || (scanned.installed ? 'Installed on Laptop' : 'Steam Library • Owned'),
        logoImg: scanned.logoImg || '',
        tileIcon: scanned.tileIcon || '',
        heroBg: scanned.heroBg || '',
        badge: scanned.installed ? 'Installed' : 'Owned',
        installed: scanned.installed,
        installSize: targetSize,
        storageType: scanned.storageType || (scanned.installed ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)'),
        playTime: scanned.installed ? 'Ready to Play' : 'Ready to Download',
        trophies: scanned.trophies || { progress: 50, platinum: 0, gold: 2, silver: 5, bronze: 10 },
        execPath: scanned.execPath || '',
        launchUri: scanned.launchUri || (scanned.appId ? `steam://rungameid/${scanned.appId}` : ''),
        activities: scanned.activities || [
          { id: 'act_' + (scanned.appId || Date.now()), title: (scanned.installed ? 'Launch ' : 'Download ') + scanned.title, tag: scanned.installed ? 'PC Game' : 'Steam', progress: 100, timeEst: scanned.installed ? 'Launch on PC' : 'Install' }
        ],
        liveStatus: scanned.installed ? 'Installed on Laptop • Ready to Launch' : `Owned on Steam • ${targetSize} Download`
      };

      PS5_GAMES.push(newGame);
      saved.push(newGame);
      addedCount++;
    }
  });

  const dedupedList = deduplicateGameList(PS5_GAMES);
  PS5_GAMES.length = 0;
  PS5_GAMES.push(...dedupedList);

  try {
    localStorage.setItem('ps5_synced_pc_games', JSON.stringify(deduplicateGameList(saved)));
  } catch (e) {}

  return addedCount;
}

export function setGameInstalled(id, isInstalled) {
  const game = PS5_GAMES.find(g => g.id === id);
  if (game) {
    game.installed = isInstalled;
    game.badge = isInstalled ? "Installed" : "Owned";
    game.storageType = isInstalled ? "Console Storage (NVMe M.2)" : "Steam Library (Ready to Download)";
    game.liveStatus = isInstalled ? "Ready to Play • 4K 60FPS" : `Owned on Steam • ${game.installSize || 'Ready to Download'}`;
  }
  return game;
}

export function getPS5Games() {
  return PS5_GAMES;
}
