const fs = require('fs');

const raw = fs.readFileSync('C:/Program Files (x86)/Steam/userdata/755748935/config/localconfig.vdf', 'utf8');

// Print matches in apps block
const re = /"(\d{3,10})"\s*\{([\s\S]*?)\n\t\t\t\t\}/g;
let match;
while ((match = re.exec(raw)) !== null) {
  const appId = match[1];
  const body = match[2];
  console.log(`AppID: ${appId}`);
  const lastPlayed = body.match(/"LastPlayed"\s+"([^"]+)"/);
  const playtime = body.match(/"Playtime"\s+"([^"]+)"/);
  console.log(`  LastPlayed: ${lastPlayed ? lastPlayed[1] : 'none'}, Playtime: ${playtime ? playtime[1] : '0'}`);
}
