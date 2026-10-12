const fs = require('fs');
const buffer = fs.readFileSync('C:/Program Files (x86)/Steam/appcache/appinfo.vdf');

const idx = buffer.indexOf('59663000544');
console.log('idx:', idx);
if (idx !== -1) {
  const slice = buffer.slice(idx - 100, idx + 400);
  console.log(slice.toString('latin1').replace(/[^\x20-\x7E]+/g, ' '));
}
