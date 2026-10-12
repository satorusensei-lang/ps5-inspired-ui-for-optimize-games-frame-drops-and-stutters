const fs = require('fs');
const buffer = fs.readFileSync('C:/Program Files (x86)/Steam/appcache/appinfo.vdf');

console.log('appinfo.vdf size:', buffer.length);
// Check if 851850 exists in text form or 4-byte int
const needle = Buffer.from('851850');
const idx = buffer.indexOf(needle);
console.log('needle 851850 index:', idx);

// Search for 851850 as a uint32: 851850 = 0x000cfdda
const intBuf = Buffer.alloc(4);
intBuf.writeUInt32LE(851850, 0);
let intIdx = -1;
for (let i = 0; i < buffer.length - 4; i++) {
  if (buffer.readUInt32LE(i) === 851850) {
    console.log('Found 851850 uint32LE at offset:', i);
    // Print around offset
    const slice = buffer.slice(i, i + 500);
    // Find strings in slice
    const str = slice.toString('latin1').replace(/[^\x20-\x7E]+/g, ' ');
    console.log('Sample text near uint32:', str.substring(0, 300));
    break;
  }
}
