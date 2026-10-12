const fs = require('fs');
const path = require('path');

const pluginDir = 'C:/Program Files (x86)/Steam/config/stplug-in';
if (fs.existsSync(pluginDir)) {
  const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.lua'));
  console.log(`Found ${files.length} plugin lua files.`);
  for (const f of files) {
    const content = fs.readFileSync(path.join(pluginDir, f), 'utf8');
    const firstLine = content.split('\n')[0];
    const appId = f.replace('.lua', '');
    console.log(`AppID: ${appId} | ${firstLine.slice(0, 80)}`);
  }
}
