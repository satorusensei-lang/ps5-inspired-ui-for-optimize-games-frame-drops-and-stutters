const fs = require('fs');
const buffer = fs.readFileSync('C:/Program Files (x86)/Steam/appcache/appinfo.vdf');

// The games in the user's library:
const games = [
  { appId: '851850', title: 'DRAGON BALL Z: KAKAROT' },
  { appId: '1790600', title: 'DRAGON BALL: Sparking! ZERO' },
  { appId: '730', title: 'Counter-Strike 2' },
  { appId: '2358720', title: 'Black Myth: Wukong' },
  { appId: '208650', title: 'Batman: Arkham Knight' },
  { appId: '200260', title: 'Batman: Arkham City' },
  { appId: '209000', title: 'Batman: Arkham Origins' },
  { appId: '35140', title: 'Batman: Arkham Asylum' },
  { appId: '498240', title: 'Batman - The Telltale Series' },
  { appId: '1593500', title: 'God of War' },
  { appId: '2322010', title: 'God of War Ragnarök' },
  { appId: '1888930', title: 'The Last of Us Part I' },
  { appId: '2531310', title: 'The Last of Us Part II Remastered' },
  { appId: '3240220', title: 'Grand Theft Auto V Enhanced' },
  { appId: '12210', title: 'Grand Theft Auto IV' },
  { appId: '1546970', title: 'Grand Theft Auto III' },
  { appId: '1546990', title: 'Grand Theft Auto: Vice City' },
  { appId: '1547000', title: 'Grand Theft Auto: San Andreas' },
  { appId: '4080220', title: 'EA SPORTS FC 27' },
  { appId: '1551360', title: 'Forza Horizon 5' },
  { appId: '1817070', title: "Marvel's Spider-Man Remastered" },
  { appId: '1817190', title: "Marvel's Spider-Man: Miles Morales" },
  { appId: '2651280', title: "Marvel's Spider-Man 2" }
];

console.log('Searching appinfo.vdf for games:');
for (const g of games) {
  const needle = Buffer.from(g.appId);
  const idx = buffer.indexOf(needle);
  if (idx !== -1) {
    // Search around idx for numbers with 9 to 12 digits (byte sizes)
    const slice = buffer.slice(idx, idx + 4000).toString('latin1');
    const byteMatches = slice.match(/\b\d{9,12}\b/g) || [];
    console.log(`[${g.appId}] ${g.title}: found ${byteMatches.length} large numbers:`, byteMatches.slice(0, 5));
  } else {
    console.log(`[${g.appId}] ${g.title}: not found`);
  }
}
