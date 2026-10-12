async function test() {
  const res = await fetch('http://localhost:5173/api/pc/scan');
  const data = await res.json();
  const scannedGames = data.games;

  // Let's inspect all forza games in scanned
  const forzas = scannedGames.filter(g => g.title.toLowerCase().includes('forza'));
  console.log('Forza games in scanned:', forzas.map(f => ({ id: f.id, appId: f.appId, title: f.title, installed: f.installed })));

  // Simulate what happened in syncPCInstalledGames:
  let PS5_GAMES = [
    { id: 'pc_steam_2483190', appId: '2483190', title: 'Forza Horizon 6', installed: true }
  ];

  scannedGames.forEach(scanned => {
    const existing = PS5_GAMES.find(g => 
      g.id === scanned.id || 
      g.title.toLowerCase() === scanned.title.toLowerCase() ||
      (scanned.title.toLowerCase().includes('forza') && g.title.toLowerCase().includes('forza')) ||
      (scanned.appId && g.launchUri && g.launchUri.includes(scanned.appId)) ||
      (scanned.appId && g.appId === scanned.appId) ||
      (scanned.execPath && g.execPath && g.execPath.toLowerCase() === scanned.execPath.toLowerCase())
    );
    if (existing) {
      existing.installed = scanned.installed;
      existing.title = scanned.title;
      console.log('Updated existing with:', scanned.title, 'installed:', scanned.installed);
    }
  });

  console.log('Final PS5_GAMES for forza:', PS5_GAMES);
}

test();
