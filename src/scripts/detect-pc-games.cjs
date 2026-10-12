const fs = require('fs');
const path = require('path');

function getSteamGames() {
  const steamPath = 'C:/Program Files (x86)/Steam/steamapps';
  const games = [];
  if (!fs.existsSync(steamPath)) return games;

  const files = fs.readdirSync(steamPath);
  for (const f of files) {
    if (f.startsWith('appmanifest_') && f.endsWith('.acf')) {
      const content = fs.readFileSync(path.join(steamPath, f), 'utf8');
      const nameMatch = content.match(/"name"\s+"([^"]+)"/);
      const appidMatch = content.match(/"appid"\s+"([^"]+)"/);
      const installDirMatch = content.match(/"installdir"\s+"([^"]+)"/);
      const sizeMatch = content.match(/"SizeOnDisk"\s+"([^"]+)"/);
      if (nameMatch && appidMatch) {
        const sizeGb = sizeMatch ? (parseInt(sizeMatch[1], 10) / (1024 * 1024 * 1024)).toFixed(1) + ' GB' : 'Unknown';
        games.push({
          id: 'steam_' + appidMatch[1],
          appId: appidMatch[1],
          name: nameMatch[1],
          installDir: installDirMatch ? installDirMatch[1] : '',
          size: sizeGb,
          launchUri: 'steam://rungameid/' + appidMatch[1]
        });
      }
    }
  }

  // Also check steamapps/common folders
  const commonPath = path.join(steamPath, 'common');
  if (fs.existsSync(commonPath)) {
    const folders = fs.readdirSync(commonPath);
    for (const f of folders) {
      if (!['Steam Controller Configs', 'Steamworks Shared'].includes(f)) {
        if (!games.find(g => g.name.toLowerCase() === f.toLowerCase() || g.installDir.toLowerCase() === f.toLowerCase())) {
          games.push({
            id: 'pc_' + f.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
            name: f,
            installDir: f,
            size: 'Installed',
            launchUri: 'steam://rungameid/' // or direct exe
          });
        }
      }
    }
  }

  return games;
}

console.log(JSON.stringify(getSteamGames(), null, 2));
