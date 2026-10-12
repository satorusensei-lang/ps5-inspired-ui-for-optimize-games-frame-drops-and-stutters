const fs = require('fs');

// In PlayStation 5 Concept 10010048:
// We downloaded:
// 1) ps5_gamehub_cover.png from https://image.api.playstation.com/vulcan/ap/rnd/202609/0921/7ca70f70156fc5ee73f2a7c82ee14835f69d84b16e0768a3.png
// 2) ps5_hero_bg.png from https://image.api.playstation.com/vulcan/ap/rnd/202609/0922/bf0e7b89ba24ac8ae424a60b239cea4f8a1e75d93d4ef532.png

console.log('Comparing sizes:');
console.log('gamehub_cover:', fs.statSync('public/assets/games/valorant/ps5_gamehub_cover.png').size);
console.log('hero_bg:', fs.statSync('public/assets/games/valorant/ps5_hero_bg.png').size);
