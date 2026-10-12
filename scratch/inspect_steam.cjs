const fs = require('fs');
const path = require('path');

// 1. Check librarycache
const librarycacheDir = 'C:/Program Files (x86)/Steam/appcache/librarycache';
const librarycacheAppIds = fs.existsSync(librarycacheDir) ? fs.readdirSync(librarycacheDir) : [];
console.log('Total librarycache directories:', librarycacheAppIds.length);

// 2. Check installed appmanifests
const steamApps = 'C:/Program Files (x86)/Steam/steamapps';
const installedAppIds = new Set();
const installedManifests = {};

if (fs.existsSync(steamApps)) {
  for (const f of fs.readdirSync(steamApps)) {
    if (f.startsWith('appmanifest_') && f.endsWith('.acf')) {
      const content = fs.readFileSync(path.join(steamApps, f), 'utf8');
      const matchAppId = content.match(/"appid"\s+"([^"]+)"/);
      const matchName = content.match(/"name"\s+"([^"]+)"/);
      const matchDir = content.match(/"installdir"\s+"([^"]+)"/);
      if (matchAppId) {
        installedAppIds.add(matchAppId[1]);
        installedManifests[matchAppId[1]] = {
          name: matchName ? matchName[1] : '',
          dir: matchDir ? matchDir[1] : ''
        };
      }
    }
  }
}
console.log('Installed steam apps count:', installedAppIds.size);
console.log('Installed steam apps:', installedManifests);

// 3. Check sharedconfig.vdf and localconfig.vdf
const userdirs = ['755748935', '19627'];
for (const uid of userdirs) {
  const localConfig = `C:/Program Files (x86)/Steam/userdata/${uid}/config/localconfig.vdf`;
  if (fs.existsSync(localConfig)) {
    const raw = fs.readFileSync(localConfig, 'utf8');
    const appsBlockMatch = raw.match(/"Software"[\s\S]*?"Valve"[\s\S]*?"Steam"[\s\S]*?"apps"\s*\{([\s\S]*?)\n\t\t\t\}/i);
    if (appsBlockMatch) {
      const block = appsBlockMatch[1];
      const appMatches = [...block.matchAll(/"(\d+)"\s*\{/g)].map(m => m[1]);
      console.log(`User ${uid} localconfig.vdf app count:`, appMatches.length);
    }
  }

  const sharedConfig = `C:/Program Files (x86)/Steam/userdata/${uid}/7/remote/sharedconfig.vdf`;
  if (fs.existsSync(sharedConfig)) {
    const raw = fs.readFileSync(sharedConfig, 'utf8');
    const appsBlockMatch = raw.match(/"apps"\s*\{([\s\S]*?)\n\t\t\}/i);
    if (appsBlockMatch) {
      const block = appsBlockMatch[1];
      const appMatches = [...block.matchAll(/"(\d+)"\s*\{/g)].map(m => m[1]);
      console.log(`User ${uid} sharedconfig.vdf app count:`, appMatches.length);
    }
  }
}
