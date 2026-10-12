const fs = require('fs');
const path = require('path');

const pluginDir = 'C:/Program Files (x86)/Steam/config/stplug-in';
const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.lua'));
const allIds = files.map(f => f.replace('.lua', ''));

// Also add any other apps in libraryfolders.vdf
const libVdf = 'C:/Program Files (x86)/Steam/steamapps/libraryfolders.vdf';
if (fs.existsSync(libVdf)) {
  const content = fs.readFileSync(libVdf, 'utf8');
  for (const m of content.matchAll(/"(\d{3,10})"\s+"[^"]+"/g)) {
    if (!allIds.includes(m[1]) && m[1] !== '228980') {
      allIds.push(m[1]);
    }
  }
}

// Also add any apps from localconfig.vdf
const localConfig = 'C:/Program Files (x86)/Steam/userdata/755748935/config/localconfig.vdf';
if (fs.existsSync(localConfig)) {
  const content = fs.readFileSync(localConfig, 'utf8');
  for (const m of content.matchAll(/"(\d{3,10})"\s*\{/g)) {
    if (!allIds.includes(m[1]) && m[1] !== '228980' && m[1] !== '755748935') {
      allIds.push(m[1]);
    }
  }
}

console.log('Total candidate Steam IDs to resolve:', allIds.length, allIds);

async function run() {
  const results = {};
  for (const id of allIds) {
    try {
      const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}`);
      const data = await res.json();
      if (data && data[id]?.success && data[id]?.data) {
        const d = data[id].data;
        results[id] = {
          name: d.name,
          type: d.type,
          developers: d.developers || [],
          genres: (d.genres || []).map(g => g.description),
          short_description: d.short_description
        };
        console.log(`[${id}] ${d.name} (${d.type})`);
      } else {
        console.log(`[${id}] No Steam store data found`);
      }
    } catch (e) {
      console.log(`[${id}] Fetch error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 120)); // rate limit friendly
  }

  fs.writeFileSync('c:/XboxGames/MYRAA/scratch/resolved_steam_games.json', JSON.stringify(results, null, 2));
  console.log('Saved to scratch/resolved_steam_games.json');
}

run();
