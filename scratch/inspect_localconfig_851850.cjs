const fs = require('fs');
const content = fs.readFileSync('C:/Program Files (x86)/Steam/userdata/755748935/config/localconfig.vdf', 'utf8');

// Look for 851850
const idx = content.indexOf('851850');
if (idx !== -1) {
  console.log('Found 851850 in localconfig.vdf:');
  console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 400)));
} else {
  console.log('851850 not in localconfig.vdf');
}
