const fs = require('fs');

const resolved = JSON.parse(fs.readFileSync('c:/XboxGames/MYRAA/scratch/resolved_steam_games.json', 'utf8'));

console.log('Resolved games count:', Object.keys(resolved).length);
for (const [id, data] of Object.entries(resolved)) {
  console.log(`- [${id}] ${data.name} (type: ${data.type})`);
}
