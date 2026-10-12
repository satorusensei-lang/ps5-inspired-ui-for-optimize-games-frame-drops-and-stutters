const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'scripts', 'data', 'ps5-games-data.js');
let content = fs.readFileSync(targetPath, 'utf-8');

// The 35 real games from the user's Steam library
const STEAM_GAMES_CODE = `export const REAL_PC_PRELOADED_GAMES = [
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
    execPath: "C:\\\\Program Files (x86)\\\\Steam\\\\steamapps\\\\common\\\\Ghost of Tsushima DIRECTOR'S CUT\\\\GhostOfTsushima.exe",
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
    installSize: "170.4 GB",
    storageType: "Laptop SSD (Steam Library)",
    playTime: "82 hours",
    trophies: { progress: 85, platinum: 0, gold: 5, silver: 15, bronze: 32 },
    friends: "Chris, Alex playing",
    execPath: "C:\\\\Program Files (x86)\\\\Steam\\\\steamapps\\\\common\\\\ForzaHorizon6\\\\forzahorizon6.exe",
    launchUri: "steam://rungameid/2483190",
    activities: [
      { id: "forza1", title: "Festival Horizon Apex Invitational", tag: "Championship", progress: 90, timeEst: "Launch on PC" },
      { id: "forza2", title: "Speed Trap Leaderboard Challenge", tag: "Seasonal", progress: 100, timeEst: "Launch on PC" }
    ],
    liveStatus: "Installed on Laptop • 170.4 GB Ready to Launch"
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
    installSize: "850 MB",
    storageType: "Laptop SSD",
    playTime: "Background",
    execPath: "C:\\\\Program Files (x86)\\\\Steam\\\\steamapps\\\\common\\\\wallpaper_engine\\\\launcher.exe",
    launchUri: "steam://rungameid/431960",
    activities: [
      { id: "we1", title: "Open Wallpaper Engine Settings", tag: "Utility", progress: 100, timeEst: "Instant" }
    ],
    liveStatus: "Active on Laptop • Interactive Live Desktops"
  },
  // 4. Black Myth: Wukong
  {
    id: "pc_steam_2358720",
    appId: "2358720",
    title: "Black Myth: Wukong",
    studio: "Game Science • Action RPG",
    genre: "Action RPG • Journey to the West",
    logoImg: "/api/pc/asset?appId=2358720&type=logo",
    tileIcon: "/api/pc/asset?appId=2358720&type=tile",
    heroBg: "/api/pc/asset?appId=2358720&type=hero",
    badge: "Owned",
    installed: false,
    installSize: "128.4 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 68, platinum: 0, gold: 3, silver: 11, bronze: 22 },
    friends: "5 friends playing on Steam",
    launchUri: "steam://rungameid/2358720",
    activities: [
      { id: "bmw1", title: "Chapter 3: White Snow, Cold Frost", tag: "Main Story", progress: 60, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "38.2 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 92, platinum: 1, gold: 6, silver: 14, bronze: 32 },
    friends: "8 friends online in Premier",
    launchUri: "steam://rungameid/730",
    activities: [
      { id: "cs1", title: "Premier Matchmaking: Competitive", tag: "Competitive", progress: 100, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "84.1 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 96, platinum: 1, gold: 8, silver: 18, bronze: 36 },
    friends: "Marcus, Elena playing",
    launchUri: "steam://rungameid/2322010",
    activities: [
      { id: "gowr1", title: "Realm Travel: Svartalfheim Depths", tag: "Main Story", progress: 95, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "70.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 88, platinum: 1, gold: 7, silver: 15, bronze: 31 },
    friends: "3 friends played",
    launchUri: "steam://rungameid/1593500",
    activities: [
      { id: "gow1", title: "Journey to the Highest Peak", tag: "Main Quest", progress: 85, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "98.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 84, platinum: 1, gold: 6, silver: 14, bronze: 28 },
    friends: "Sarah, Alex playing",
    launchUri: "steam://rungameid/2651280",
    activities: [
      { id: "sm2_1", title: "Be Greater. Together.", tag: "Campaign", progress: 80, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "75.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 95, platinum: 1, gold: 9, silver: 18, bronze: 38 },
    friends: "6 friends played",
    launchUri: "steam://rungameid/1817070",
    activities: [
      { id: "smr1", title: "The City That Never Sleeps", tag: "Full DLC", progress: 100, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "50.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 100, platinum: 1, gold: 8, silver: 16, bronze: 30 },
    friends: "4 friends played",
    launchUri: "steam://rungameid/1817190",
    activities: [
      { id: "mm1", title: "Harlem Holiday Celebration", tag: "Story", progress: 90, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "79.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 80, platinum: 0, gold: 6, silver: 14, bronze: 26 },
    friends: "David, Sarah played",
    launchUri: "steam://rungameid/1888930",
    activities: [
      { id: "tlou1", title: "Salt Lake City: The Hospital", tag: "Story Climax", progress: 95, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "88.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 70, platinum: 0, gold: 4, silver: 12, bronze: 24 },
    friends: "2 friends playing",
    launchUri: "steam://rungameid/2531310",
    activities: [
      { id: "tlou2", title: "No Return: Roguelike Survival", tag: "New Mode", progress: 50, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "135.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 90, platinum: 1, gold: 8, silver: 20, bronze: 45 },
    friends: "Chris, Alex playing",
    launchUri: "steam://rungameid/1551360",
    activities: [
      { id: "fh5_1", title: "Guanajuato Street Racing", tag: "Festival Race", progress: 80, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "118.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 65, platinum: 0, gold: 3, silver: 10, bronze: 25 },
    friends: "Motorsport Enthusiasts",
    launchUri: "steam://rungameid/2440510",
    activities: [
      { id: "fm1", title: "Builders Cup Career Series", tag: "Track Career", progress: 75, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "48.5 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 55, platinum: 0, gold: 2, silver: 9, bronze: 18 },
    friends: "2 friends playing",
    launchUri: "steam://rungameid/1650010",
    activities: [
      { id: "ride1", title: "World Superbike: Mugello Circuit", tag: "Career Race", progress: 70, timeEst: "Install via Steam" },
      { id: "ride2", title: "Ducati Panigale V4 R Custom Tuning", tag: "Garage", progress: 100, timeEst: "Ready" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "32.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 85, platinum: 1, gold: 5, silver: 12, bronze: 28 },
    friends: "Goku, Vegeta online",
    launchUri: "steam://rungameid/1790600",
    activities: [
      { id: "dbz0", title: "Episode Battle: Super Saiyan God", tag: "Anime Battle", progress: 85, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "42.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 90, platinum: 1, gold: 6, silver: 15, bronze: 30 },
    friends: "4 friends played",
    launchUri: "steam://rungameid/851850",
    activities: [
      { id: "dbzk", title: "Buu Saga: Final Spirit Bomb", tag: "Epic Story", progress: 100, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "110.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 94, platinum: 1, gold: 8, silver: 22, bronze: 48 },
    friends: "Franklin, Michael, Trevor in Los Santos",
    launchUri: "steam://rungameid/3240220",
    activities: [
      { id: "gta5_1", title: "The Big Score Heist", tag: "Final Mission", progress: 95, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "22.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 80, platinum: 0, gold: 5, silver: 14, bronze: 28 },
    friends: "Niko Bellic in Liberty City",
    launchUri: "steam://rungameid/12210",
    activities: [
      { id: "gta4_1", title: "Roman's Sorrow", tag: "Story", progress: 60, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "5.2 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 75, platinum: 0, gold: 3, silver: 8, bronze: 18 },
    friends: "Liberty City Nostalgia",
    launchUri: "steam://rungameid/1546970",
    activities: [
      { id: "gta3_1", title: "Portland to Staunton Island", tag: "Island Unlock", progress: 70, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "10.5 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 85, platinum: 1, gold: 4, silver: 12, bronze: 22 },
    friends: "Tommy Vercetti in Vice City",
    launchUri: "steam://rungameid/1546990",
    activities: [
      { id: "gtavc_1", title: "Rub Out: Vercetti Estate Takeover", tag: "Mansion Heist", progress: 80, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "19.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 92, platinum: 1, gold: 7, silver: 16, bronze: 32 },
    friends: "CJ in Los Santos",
    launchUri: "steam://rungameid/1547000",
    activities: [
      { id: "gtasa_1", title: "End of the Line", tag: "Final Mission", progress: 95, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "48.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 90, platinum: 1, gold: 7, silver: 18, bronze: 36 },
    friends: "Gotham vigilantes online",
    launchUri: "steam://rungameid/208650",
    activities: [
      { id: "ak1", title: "Knightfall Protocol", tag: "True Ending", progress: 100, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "17.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 95, platinum: 1, gold: 8, silver: 20, bronze: 40 },
    friends: "Arkham City survivors",
    launchUri: "steam://rungameid/200260",
    activities: [
      { id: "ac1", title: "Protocol 10 Infiltration", tag: "Story", progress: 90, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "20.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 78, platinum: 0, gold: 4, silver: 12, bronze: 26 },
    friends: "Christmas Eve in Gotham",
    launchUri: "steam://rungameid/209000",
    activities: [
      { id: "ao1", title: "8 Assassins Bounty: Deathstroke", tag: "Boss Fight", progress: 75, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "8.5 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 100, platinum: 1, gold: 6, silver: 15, bronze: 32 },
    friends: "Arkham Island Asylum",
    launchUri: "steam://rungameid/35140",
    activities: [
      { id: "aa1", title: "Titan Joker Showdown", tag: "Boss Battle", progress: 100, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "12.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 100, platinum: 1, gold: 5, silver: 10, bronze: 20 },
    friends: "Wayne Enterprises",
    launchUri: "steam://rungameid/498240",
    activities: [
      { id: "ttb1", title: "Episode 5: City of Light", tag: "Season Finale", progress: 100, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "10.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 85, platinum: 0, gold: 4, silver: 12, bronze: 28 },
    friends: "LEGO Justice League",
    launchUri: "steam://rungameid/313690",
    activities: [
      { id: "lb3_1", title: "Lantern Worlds Free Play", tag: "Exploration", progress: 80, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "15.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 70, platinum: 0, gold: 3, silver: 9, bronze: 22 },
    friends: "Family Co-Op",
    launchUri: "steam://rungameid/2215200",
    activities: [
      { id: "lbl1", title: "The Dark Knight Origins", tag: "Story", progress: 70, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "85.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 65, platinum: 0, gold: 4, silver: 11, bronze: 25 },
    friends: "WrestleMania Rivals",
    launchUri: "steam://rungameid/2878960",
    activities: [
      { id: "wwe1", title: "MyRISE: The Undisputed Era", tag: "Career Story", progress: 60, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "60.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 80, platinum: 0, gold: 5, silver: 14, bronze: 30 },
    friends: "Ultimate Team Rivals",
    launchUri: "steam://rungameid/4080220",
    activities: [
      { id: "fc1", title: "Champions Weekend League", tag: "Ultimate Team", progress: 80, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "73.2 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 82, platinum: 0, gold: 5, silver: 16, bronze: 30 },
    friends: "Tyler, Maya in Night City",
    launchUri: "steam://rungameid/1091500",
    activities: [
      { id: "cp1", title: "Dogtown Infiltration: Firestarter", tag: "Phantom Liberty", progress: 70, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "60.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 95, platinum: 1, gold: 9, silver: 18, bronze: 32 },
    friends: "Tarnished Champions",
    launchUri: "steam://rungameid/1245620",
    activities: [
      { id: "er1", title: "Shadow of the Erdtree: Belurat Tower", tag: "Expansion", progress: 85, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "12.0 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 60, platinum: 0, gold: 2, silver: 8, bronze: 16 },
    friends: "Multiplayer Club",
    launchUri: "steam://rungameid/1815780",
    activities: [
      { id: "al1", title: "World Series Multiplayer Season", tag: "Arcade", progress: 60, timeEst: "Install via Steam" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
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
    installSize: "1.2 GB",
    storageType: "Steam Library (Ready to Install)",
    playTime: "Ready to Install",
    trophies: { progress: 40, platinum: 0, gold: 1, silver: 4, bronze: 10 },
    friends: "Companion on Desktop",
    launchUri: "steam://rungameid/3301060",
    activities: [
      { id: "dm1", title: "Custom Mascot Interactions", tag: "Companion", progress: 100, timeEst: "Instant" }
    ],
    liveStatus: "Owned on Steam • Ready to Install"
  }
];`;

// Replace from export const INITIAL_PS5_GAMES down to export function deduplicateGameList
const regex = /export const INITIAL_PS5_GAMES = \[[\s\S]*?export const REAL_PC_PRELOADED_GAMES = \[[\s\S]*?\];/;

const newSection = `export const INITIAL_PS5_GAMES = [
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

${STEAM_GAMES_CODE}`;

if (regex.test(content)) {
  content = content.replace(regex, newSection);
  fs.writeFileSync(targetPath, content, 'utf-8');
  console.log('Successfully updated ps5-games-data.js with all 35 Steam games!');
} else {
  console.error('Regex match failed!');
}
