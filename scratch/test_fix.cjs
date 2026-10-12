async function testFix() {
  const res = await fetch('http://localhost:5173/api/pc/scan');
  const data = await res.json();
  const scannedGames = data.games;

  let PS5_GAMES = [
    {
      id: "pc_steam_2483190",
      appId: "2483190",
      title: "Forza Horizon 6",
      installed: true,
      badge: "Installed"
    }
  ];

  scannedGames.forEach(scanned => {
    const existing = PS5_GAMES.find(g => 
      (scanned.appId && g.appId === scanned.appId) ||
      (scanned.appId && g.launchUri && g.launchUri.includes(scanned.appId)) ||
      (scanned.id && g.id === scanned.id) || 
      (scanned.execPath && g.execPath && g.execPath.toLowerCase() === scanned.execPath.toLowerCase()) ||
      (g.title.toLowerCase() === scanned.title.toLowerCase())
    );

    if (existing) {
      existing.installed = scanned.installed;
      existing.title = scanned.title;
      existing.badge = scanned.installed ? 'Installed' : 'Owned';
    } else {
      PS5_GAMES.push({
        id: scanned.id,
        appId: scanned.appId,
        title: scanned.title,
        installed: scanned.installed,
        badge: scanned.installed ? 'Installed' : 'Owned'
      });
    }
  });

  const fh6 = PS5_GAMES.find(g => g.title === 'Forza Horizon 6');
  const fh5 = PS5_GAMES.find(g => g.title === 'Forza Horizon 5');
  const fMotorsport = PS5_GAMES.find(g => g.title === 'Forza Motorsport');

  console.log('FH6:', fh6);
  console.log('FH5:', fh5);
  console.log('FMotorsport:', fMotorsport);

  const installedOnHome = PS5_GAMES.filter(g => g.installed);
  console.log('Installed on home count:', installedOnHome.length, installedOnHome.map(g => g.title));
}

testFix();
