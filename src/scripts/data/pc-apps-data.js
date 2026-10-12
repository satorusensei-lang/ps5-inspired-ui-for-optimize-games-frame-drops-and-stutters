/* ==========================================================================
   PlayStation 5 PC Experience — Laptop Apps & Games Database
   Real Games & Apps Installed on this Windows Laptop
   ========================================================================== */

export const INITIAL_PC_ITEMS = [
  {
    id: "pc_ghost_of_tsushima",
    title: "Ghost of Tsushima DIRECTOR'S CUT",
    studio: "Sucker Punch • PlayStation PC Publishing",
    genre: "Action Adventure • Samurai Epic",
    tileIcon: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=400&q=80",
    heroBg: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80",
    badge: "Laptop PC",
    installed: true,
    installSize: "52.1 GB",
    storageType: "Laptop SSD (Steam Library)",
    playTime: "34 hours",
    execPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Ghost of Tsushima DIRECTOR'S CUT\\GhostOfTsushima.exe",
    launchUri: "steam://rungameid/2215430",
    activities: [
      { id: "got1", title: "Act II: Retake Castle Kaneda", tag: "Main Tale", progress: 65, timeEst: "Launch on PC" },
      { id: "got2", title: "Iki Island Expansion", tag: "DLC Tale", progress: 40, timeEst: "Launch on PC" },
      { id: "got3", title: "Legends Multiplayer Mode", tag: "Online Co-Op", progress: 100, timeEst: "Ready" }
    ],
    liveStatus: "Installed on Laptop • Native 4K 60FPS Fidelity Mode"
  },
  {
    id: "pc_steam_2483190",
    title: "Forza Horizon 6",
    studio: "Playground Games • Xbox Game Studios",
    genre: "Open World Racing • Simulation",
    tileIcon: "/assets/games/forza6/tile.jpg",
    heroBg: "/assets/games/forza6/hero.jpg",
    badge: "Laptop PC",
    installed: true,
    installSize: "170.4 GB",
    storageType: "Laptop SSD (Steam Library)",
    playTime: "82 hours",
    execPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\ForzaHorizon6\\forzahorizon6.exe",
    launchUri: "steam://rungameid/2483190",
    activities: [
      { id: "forza1", title: "Festival Horizon Apex Invitational", tag: "Championship", progress: 90, timeEst: "Launch on PC" },
      { id: "forza2", title: "Speed Trap Leaderboard Challenge", tag: "Seasonal", progress: 100, timeEst: "Launch on PC" }
    ],
    liveStatus: "Installed on Laptop • 158.7 GB Ready to Launch"
  },
  {
    id: "pc_valorant",
    title: "VALORANT",
    studio: "Riot Games • Tactical Hero Shooter",
    genre: "5v5 Character-Based Tactical Shooter",
    tileIcon: "/assets/games/valorant/ps5_master.png",
    heroBg: "/assets/games/valorant/ps5_gamehub_cover.png",
    logoImg: "/assets/games/valorant/ps5_logo.svg",
    badge: "Laptop PC",
    installed: true,
    installSize: "45.2 GB",
    storageType: "Laptop SSD (Riot Games)",
    playTime: "128 hours",
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
  {
    id: "pc_steam_launcher",
    title: "Steam Client",
    studio: "Valve Corporation • PC Gaming Platform",
    genre: "Game Launcher & Store",
    tileIcon: "https://images.unsplash.com/photo-1612287233216-a7c88bbfbdf6?auto=format&fit=crop&w=400&q=80",
    heroBg: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80",
    badge: "Launcher",
    installed: true,
    installSize: "PC Platform",
    storageType: "Laptop Program Files",
    playTime: "1,240 hours",
    execPath: "C:\\Program Files (x86)\\Steam\\steam.exe",
    launchUri: "steam://open/games",
    activities: [
      { id: "stm1", title: "Open Steam Games Library", tag: "Launcher", progress: 100, timeEst: "Instant" },
      { id: "stm2", title: "Launch Steam Big Picture Mode", tag: "Controller Mode", progress: 100, timeEst: "steam://open/bigpicture" }
    ],
    liveStatus: "Installed on Laptop • Open Steam Library"
  },
  {
    id: "pc_xbox_app",
    title: "Xbox App & Game Pass",
    studio: "Microsoft Corporation • PC Gaming",
    genre: "Game Pass & Cloud Gaming",
    tileIcon: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80",
    heroBg: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80",
    badge: "Windows App",
    installed: true,
    installSize: "Windows Core",
    storageType: "Microsoft Store Package",
    playTime: "120 hours",
    execPath: "",
    launchUri: "xbox://",
    activities: [
      { id: "xb1", title: "Browse PC Game Pass Titles", tag: "Subscription", progress: 100, timeEst: "Instant" },
      { id: "xb2", title: "Xbox Cloud Gaming", tag: "Cloud Streaming", progress: 100, timeEst: "Instant" }
    ],
    liveStatus: "Installed on Laptop • Open Xbox Windows App"
  },
  {
    id: "pc_wallpaper_engine",
    title: "Wallpaper Engine",
    studio: "Kristjan Skutta • Steam Software",
    genre: "Live Wallpapers & Audio Visualizer",
    tileIcon: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80",
    heroBg: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80",
    badge: "Laptop App",
    installed: true,
    installSize: "850 MB",
    storageType: "Laptop SSD",
    playTime: "Background",
    execPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\wallpaper_engine\\launcher.exe",
    launchUri: "steam://rungameid/431960",
    activities: [
      { id: "we1", title: "Open Wallpaper Engine Settings", tag: "Utility", progress: 100, timeEst: "Instant" }
    ],
    liveStatus: "Active on Laptop • Interactive Live Desktops"
  },
  {
    id: "pc_file_explorer",
    title: "File Explorer & Drives",
    studio: "Windows System Utilities",
    genre: "Files & Storage Drives",
    tileIcon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
    heroBg: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
    badge: "System",
    installed: true,
    installSize: "Windows",
    storageType: "C: / D: Drives",
    playTime: "System",
    execPath: "explorer.exe",
    launchUri: "",
    activities: [
      { id: "fe1", title: "Browse C:\\XboxGames", tag: "Folder", progress: 100, timeEst: "Open Folder" }
    ],
    liveStatus: "Windows 11 File Explorer Ready"
  },
  {
    id: "pc_vscode",
    title: "Visual Studio Code",
    studio: "Microsoft Corporation • Developer Tools",
    genre: "Code Editor & IDE",
    tileIcon: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80",
    heroBg: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80",
    badge: "Laptop App",
    installed: true,
    installSize: "550 MB",
    storageType: "Local Drive",
    playTime: "240 hours",
    execPath: "code.cmd",
    launchUri: "vscode://",
    activities: [
      { id: "vs1", title: "Open Project in VS Code", tag: "Editor", progress: 100, timeEst: "Instant" }
    ],
    liveStatus: "Installed on Laptop • Code Editor Ready"
  },
  {
    id: "pc_brave_browser",
    title: "Brave Web Browser",
    studio: "Brave Software • Web Browser",
    genre: "Internet & Media",
    tileIcon: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
    heroBg: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
    badge: "Laptop App",
    installed: true,
    installSize: "320 MB",
    storageType: "Local Drive",
    playTime: "Daily",
    execPath: "brave.exe",
    launchUri: "https://google.com",
    activities: [
      { id: "br1", title: "Open Web Browser", tag: "Web", progress: 100, timeEst: "Instant" }
    ],
    liveStatus: "Installed on Laptop • Private & Shielded Browser"
  }
];

// Load persisted custom apps from localStorage
function getSavedCustomApps() {
  try {
    const raw = localStorage.getItem('ps5_custom_laptop_apps');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export let PC_LAPTOP_ITEMS = [...INITIAL_PC_ITEMS, ...getSavedCustomApps()];

export function addCustomLaptopApp(appData) {
  const newApp = {
    id: 'custom_' + Date.now(),
    title: appData.title || 'Custom Laptop App',
    studio: appData.studio || 'Custom PC Application',
    genre: appData.genre || 'Laptop Software',
    tileIcon: appData.tileIcon || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    heroBg: appData.heroBg || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
    badge: 'Custom PC',
    installed: true,
    installSize: 'Local PC',
    storageType: 'Laptop Drive',
    execPath: appData.execPath || '',
    launchUri: appData.launchUri || '',
    activities: [
      { id: 'c1', title: 'Launch ' + appData.title, tag: 'Executable', progress: 100, timeEst: 'Launch on Laptop' }
    ],
    liveStatus: 'Configured on Laptop • Ready to Launch'
  };

  PC_LAPTOP_ITEMS.push(newApp);

  try {
    const current = getSavedCustomApps();
    current.push(newApp);
    localStorage.setItem('ps5_custom_laptop_apps', JSON.stringify(current));
  } catch (e) {}

  return newApp;
}
