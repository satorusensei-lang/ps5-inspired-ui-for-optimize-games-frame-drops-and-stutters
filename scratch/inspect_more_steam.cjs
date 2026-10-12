const fs = require('fs');

console.log('--- Checking config.vdf ---');
const configVdf = 'C:/Program Files (x86)/Steam/config/config.vdf';
if (fs.existsSync(configVdf)) {
  const content = fs.readFileSync(configVdf, 'utf8');
  console.log('config.vdf length:', content.length);
  const matchLicenses = content.match(/"Licenses"[\s\S]*?\{([\s\S]*?)\n\t\t\}/i);
  if (matchLicenses) {
    console.log('Found Licenses block:', matchLicenses[1].slice(0, 500));
  }
}

console.log('--- Checking sharedconfig.vdf ---');
const sharedConfig = 'C:/Program Files (x86)/Steam/userdata/755748935/7/remote/sharedconfig.vdf';
if (fs.existsSync(sharedConfig)) {
  const content = fs.readFileSync(sharedConfig, 'utf8');
  console.log('sharedconfig.vdf length:', content.length);
  const re = /"(\d{3,10})"\s*\{/g;
  let m;
  const appIds = [];
  while ((m = re.exec(content)) !== null) {
    appIds.push(m[1]);
  }
  console.log('sharedconfig AppIDs count:', appIds.length, appIds);
}
