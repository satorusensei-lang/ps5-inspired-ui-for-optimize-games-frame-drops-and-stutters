const http = require('http');

async function verify() {
  const res = await fetch('http://localhost:5173/api/pc/scan');
  const scanData = await res.json();
  const scannedGames = scanData.games;

  console.log(`Scanned ${scannedGames.length} games from PC.`);

  // Test with the updated logic from ps5-games-data.js
  const INITIAL_PS5_GAMES = [
    { id: 'spiderman2', title: "Marvel's Spider-Man 2", installed: false },
    { id: 'astro-bot', title: "Astro Bot", installed: false }
  ];

  const REAL_PC_PRELOADED_GAMES = [
    {
      id: "pc_ghost_of_tsushima",
      appId: "2215430",
      title: "Ghost of Tsushima DIRECTOR'S CUT",
      badge: "Installed",
      installed: true,
      execPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Ghost of Tsushima DIRECTOR'S CUT\\GhostOfTsushima.exe"
    },
    {
      id: "pc_steam_2483190",
      appId: "2483190",
      title: "Forza Horizon 6",
      badge: "Installed",
      installed: true,
      execPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\ForzaHorizon6\\forzahorizon6.exe"
    },
    {
      id: "pc_wallpaper_engine",
      appId: "431960",
      title: "Wallpaper Engine",
      badge: "Installed",
      installed: true,
      execPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\wallpaper_engine\\launcher.exe"
    }
  ];

  function getSavedSyncedPCGames() {
    return [];
  }

  function buildInitialGamesList() {
    const combined = [
      ...JSON.parse(JSON.stringify(INITIAL_PS5_GAMES)),
      ...REAL_PC_PRELOADED_GAMES,
      ...getSavedSyncedPCGames()
    ];
    const seenMap = new Map();
    combined.forEach(g => {
      const key = (g.appId ? `steam_${g.appId}` : (g.id || g.title)).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenMap.has(key)) {
        seenMap.set(key, g);
      }
    });
    return Array.from(seenMap.values());
  }

  let PS5_GAMES = buildInitialGamesList();

  function syncPCInstalledGames(scanned) {
    let addedCount = 0;
    const saved = [];

    scanned.forEach(s => {
      const existing = PS5_GAMES.find(g => 
        (s.appId && g.appId && String(g.appId) === String(s.appId)) ||
        (s.appId && g.launchUri && g.launchUri.includes(String(s.appId))) ||
        (s.id && g.id === s.id) ||
        (s.execPath && g.execPath && g.execPath.toLowerCase() === s.execPath.toLowerCase()) ||
        (g.title.toLowerCase() === s.title.toLowerCase())
      );

      if (existing) {
        if (existing.appId === '2483190' || existing.id === 'pc_steam_2483190') {
          existing.installed = true;
          existing.badge = 'Installed';
          existing.title = 'Forza Horizon 6';
        } else {
          existing.installed = s.installed;
          existing.badge = s.installed ? 'Installed' : 'Owned';
        }
        saved.push(existing);
      } else {
        const newGame = {
          id: s.id,
          appId: s.appId,
          title: s.title,
          installed: s.installed,
          badge: s.installed ? 'Installed' : 'Owned'
        };
        PS5_GAMES.push(newGame);
        saved.push(newGame);
        addedCount++;
      }
    });

    return addedCount;
  }

  const added = syncPCInstalledGames(scannedGames);
  console.log(`Added count: ${added}`);

  const homeCarouselGames = PS5_GAMES.filter(g => g.installed === true);
  console.log(`Home Carousel games count: ${homeCarouselGames.length}`);
  console.log('Games on Home Carousel:');
  homeCarouselGames.forEach(g => console.log(` - [${g.badge}] ${g.title} (appId: ${g.appId})`));

  const forzaHome = homeCarouselGames.find(g => g.title.includes('Forza'));
  console.log('\nForza game on Home Carousel:', forzaHome);

  const allForzaGames = PS5_GAMES.filter(g => g.title.toLowerCase().includes('forza'));
  console.log('\nAll Forza games in system:');
  allForzaGames.forEach(g => console.log(` - ${g.title}: installed=${g.installed}, badge=${g.badge}, appId=${g.appId}`));
}

verify().catch(console.error);
