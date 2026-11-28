/* ==========================================================================
   Multi-Store Catalogs Database (Epic Games Store & Xbox Game Pass)
   Rich metadata, 4K artwork, download sizes, and store launcher protocols
   ========================================================================== */

export const EPIC_GAMES_CATALOG = [
  {
    id: "epic_gtav",
    appId: "9d2d0eb64d5c44529cece33fe2a46482",
    store: "epic",
    storeName: "Epic Games",
    title: "Grand Theft Auto V",
    studio: "Rockstar Games • Los Santos",
    genre: "Action • Open World Crime",
    installSize: "105 GB",
    storageType: "Epic Games Store (Cloud Collection)",
    launchUri: "com.epicgames.launcher://apps/9d2d0eb64d5c44529cece33fe2a46482?action=launch&silent=true",
    logoImg: "/assets/games/gtav/logo.png",
    tileIcon: "/assets/games/gtav/tile.jpg",
    heroBg: "/assets/games/gtav/hero.jpg",
    badge: "Owned",
    installed: false,
    playTime: "Ready to Download",
    trophies: { progress: 85, platinum: 1, gold: 5, silver: 15, bronze: 30 },
    activities: [
      { id: "epic_gta1", title: "Los Santos Heists: The Diamond Casino", tag: "Heist", progress: 90, timeEst: "Download" }
    ],
    liveStatus: "Owned on Epic Games • 105 GB Ready to Download"
  },
  {
    id: "epic_fortnite",
    appId: "fn",
    store: "epic",
    storeName: "Epic Games",
    title: "Fortnite",
    studio: "Epic Games • Unreal Engine 5",
    genre: "Battle Royale • Live Events",
    installSize: "48 GB",
    storageType: "Epic Games Store (Cloud Collection)",
    launchUri: "com.epicgames.launcher://apps/fn?action=launch&silent=true",
    logoImg: "/assets/games/fortnite/logo.png",
    tileIcon: "/assets/games/fortnite/tile.jpg",
    heroBg: "/assets/games/fortnite/hero.jpg",
    badge: "Owned",
    installed: false,
    playTime: "Ready to Install",
    trophies: { progress: 60, platinum: 0, gold: 3, silver: 10, bronze: 25 },
    activities: [
      { id: "epic_fn1", title: "Battle Royale: Season Zero Rank", tag: "Ranked", progress: 80, timeEst: "Install" }
    ],
    liveStatus: "Owned on Epic Games • Free to Play"
  },
  {
    id: "epic_alanwake2",
    appId: "c128036f0b4a49c98a58a7da62b2e9d2",
    store: "epic",
    storeName: "Epic Games",
    title: "Alan Wake 2",
    studio: "Remedy Entertainment • Epic Games Publishing",
    genre: "Survival Horror • Psychological Thriller",
    installSize: "85 GB",
    storageType: "Epic Games Store (Cloud Collection)",
    launchUri: "com.epicgames.launcher://apps/c128036f0b4a49c98a58a7da62b2e9d2?action=launch&silent=true",
    logoImg: "/assets/games/alanwake2/logo.png",
    tileIcon: "/assets/games/alanwake2/tile.jpg",
    heroBg: "/assets/games/alanwake2/hero.jpg",
    badge: "Owned",
    installed: false,
    playTime: "Ready to Download",
    trophies: { progress: 92, platinum: 1, gold: 6, silver: 14, bronze: 32 },
    activities: [
      { id: "epic_aw1", title: "The Dark Place: Initiation 5", tag: "Story", progress: 70, timeEst: "Download" }
    ],
    liveStatus: "Owned on Epic Games • 85 GB Ready to Download"
  },
  {
    id: "epic_rocketleague",
    appId: "Sugar",
    store: "epic",
    storeName: "Epic Games",
    title: "Rocket League",
    studio: "Psyonix • Epic Games • Free to Play",
    genre: "Sports • Vehicular Soccer",
    installSize: "22 GB",
    storageType: "Epic Games (Ready to Install)",
    launchUri: "com.epicgames.launcher://apps/Sugar?action=launch&silent=true",
    logoImg: "/assets/games/rocketleague/logo.png",
    tileIcon: "/assets/games/rocketleague/tile.png",
    heroBg: "/assets/games/rocketleague/hero.jpg",
    badge: "Free",
    installed: false,
    playTime: "541 hours",
    trophies: { progress: 72, platinum: 1, gold: 24, silver: 12, bronze: 51 },
    friends: "3 friends playing Ranked",
    activities: [
      { id: "rl1", title: "Competitive 3v3 — Ranked Champion", tag: "Ranked", progress: 100, timeEst: "Install" },
      { id: "rl2", title: "Rocket Pass Premium Season 16", tag: "Season Pass", progress: 68, timeEst: "Install" },
      { id: "rl3", title: "Tournament: RLCS World Championship", tag: "Esports", progress: 100, timeEst: "Install" },
      { id: "rl4", title: "Extra Modes: Hoops & Dropshot", tag: "Casual", progress: 100, timeEst: "Install" }
    ],
    liveStatus: "Free to Play on Epic Games • 541h Played"
  },
  {
    id: "epic_fallguys",
    appId: "0a2d9f6491e640fe93ee74a165a287dd",
    store: "epic",
    storeName: "Epic Games",
    title: "Fall Guys",
    studio: "Mediatonic • Epic Games",
    genre: "Party • Knockout Royale",
    installSize: "10 GB",
    storageType: "Epic Games Store (Cloud Collection)",
    launchUri: "com.epicgames.launcher://apps/0a2d9f6491e640fe93ee74a165a287dd?action=launch&silent=true",
    logoImg: "/assets/games/fallguys/logo.png",
    tileIcon: "/assets/games/fallguys/tile.png",
    heroBg: "/assets/games/fallguys/hero.jpg",
    badge: "Owned",
    installed: false,
    playTime: "Ready to Install",
    trophies: { progress: 68, platinum: 0, gold: 2, silver: 12, bronze: 22 },
    activities: [
      { id: "epic_fg1", title: "Main Show: Final Round Crown", tag: "Finals", progress: 95, timeEst: "Install" }
    ],
    liveStatus: "Owned on Epic Games • Free to Play"
  }
];

export const XBOX_GAME_PASS_CATALOG = [
  {
    id: "xbox_forzahorizon5",
    store: "xbox",
    storeName: "Xbox Game Pass",
    title: "Forza Horizon 5",
    studio: "Playground Games • Xbox Game Studios",
    genre: "Open World Racing • Horizon Mexico",
    installSize: "110 GB",
    storageType: "Xbox App (PC Game Pass)",
    launchUri: "xbox://",
    logoImg: "/assets/games/forzahorizon5/logo.png",
    tileIcon: "/assets/games/forzahorizon5/tile.jpg",
    heroBg: "/assets/games/forzahorizon5/hero.jpg",
    badge: "Owned",
    installed: false,
    playTime: "Ready to Install",
    trophies: { progress: 94, platinum: 1, gold: 7, silver: 16, bronze: 42 },
    activities: [
      { id: "xbox_fh5", title: "The Colossus: 55km Endurance Goliath", tag: "Road Racing", progress: 85, timeEst: "Install" }
    ],
    liveStatus: "Included with PC Game Pass • 110 GB Ready to Install"
  },
  {
    id: "xbox_haloinfinite",
    store: "xbox",
    storeName: "Xbox Game Pass",
    title: "Halo Infinite",
    studio: "343 Industries • Xbox Game Studios",
    genre: "Sci-Fi FPS • Master Chief Campaign",
    installSize: "50 GB",
    storageType: "Xbox App (PC Game Pass)",
    launchUri: "xbox://",
    logoImg: "/assets/games/haloinfinite/logo.png",
    tileIcon: "/assets/games/haloinfinite/tile.jpg",
    heroBg: "/assets/games/haloinfinite/hero.jpg",
    badge: "Owned",
    installed: false,
    playTime: "Ready to Install",
    trophies: { progress: 88, platinum: 1, gold: 4, silver: 12, bronze: 30 },
    activities: [
      { id: "xbox_halo", title: "Zeta Halo: FOB Extraction", tag: "Campaign", progress: 78, timeEst: "Install" }
    ],
    liveStatus: "Included with PC Game Pass • 50 GB Ready to Install"
  },
  {
    id: "xbox_starfield",
    store: "xbox",
    storeName: "Xbox Game Pass",
    title: "Starfield",
    studio: "Bethesda Game Studios • Xbox Game Studios",
    genre: "Sci-Fi RPG • Settled Systems",
    installSize: "125 GB",
    storageType: "Xbox App (PC Game Pass)",
    launchUri: "xbox://",
    logoImg: "/assets/games/starfield/logo.png",
    tileIcon: "/assets/games/starfield/tile.jpg",
    heroBg: "/assets/games/starfield/hero.jpg",
    badge: "Owned",
    installed: false,
    playTime: "Ready to Install",
    trophies: { progress: 80, platinum: 0, gold: 5, silver: 11, bronze: 28 },
    activities: [
      { id: "xbox_sf", title: "Constellation: Artifact Hunt", tag: "Main Story", progress: 65, timeEst: "Install" }
    ],
    liveStatus: "Included with PC Game Pass • 125 GB Ready to Install"
  },
  {
    id: "xbox_seaofthieves",
    store: "xbox",
    storeName: "Xbox Game Pass",
    title: "Sea of Thieves",
    studio: "Rare Ltd • Xbox Game Studios",
    genre: "Pirate Adventure • Multiplayer",
    installSize: "82 GB",
    storageType: "Xbox App (PC Game Pass)",
    launchUri: "xbox://",
    logoImg: "/assets/games/seaofthieves/logo.png",
    tileIcon: "/assets/games/seaofthieves/tile.jpg",
    heroBg: "/assets/games/seaofthieves/hero.jpg",
    badge: "Owned",
    installed: false,
    playTime: "Ready to Install",
    trophies: { progress: 70, platinum: 0, gold: 3, silver: 9, bronze: 24 },
    activities: [
      { id: "xbox_sot", title: "Gold Hoarders: Vault of the Ancients", tag: "Voyage", progress: 100, timeEst: "Install" }
    ],
    liveStatus: "Included with PC Game Pass • 82 GB Ready to Install"
  },
  {
    id: "xbox_minecraft",
    store: "xbox",
    storeName: "Xbox Game Pass",
    title: "Minecraft",
    studio: "Mojang Studios • Xbox Game Studios",
    genre: "Sandbox • Creative & Survival",
    installSize: "2 GB",
    storageType: "Xbox App (PC Game Pass)",
    launchUri: "xbox://",
    logoImg: "/assets/games/minecraft/logo.png",
    tileIcon: "/assets/games/minecraft/tile.png",
    heroBg: "/assets/games/minecraft/hero.jpg",
    badge: "Owned",
    installed: false,
    playTime: "Ready to Launch",
    trophies: { progress: 99, platinum: 1, gold: 10, silver: 20, bronze: 50 },
    activities: [
      { id: "xbox_mc", title: "The End: Slay the Ender Dragon", tag: "Adventure", progress: 90, timeEst: "Launch" }
    ],
    liveStatus: "Included with PC Game Pass • Ready to Launch"
  }
];
