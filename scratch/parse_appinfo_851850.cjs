const fs = require('fs');
const buffer = fs.readFileSync('C:/Program Files (x86)/Steam/appcache/appinfo.vdf');

const offset = 529526;
const slice = buffer.slice(offset, offset + 6000);

// Search for numbers or strings in slice
const str = slice.toString('latin1');
const matches = str.match(/[a-zA-Z0-9_\-\.]{3,}/g);
console.log('Words in 851850 appinfo:');
console.log(matches.slice(0, 100).join(', '));

// Look for 'depots', 'download', 'size', 'manifest', or big numbers
for (let i = 0; i < matches.length; i++) {
  if (/depot|download|size|install|bytes|116/i.test(matches[i])) {
    console.log('Match near:', matches.slice(Math.max(0, i - 3), i + 4).join(' '));
  }
}
