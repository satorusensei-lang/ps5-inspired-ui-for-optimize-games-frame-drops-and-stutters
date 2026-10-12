const fs = require('fs');
const path = require('path');

// 1. Update src/scripts/components/carousel.js
const carouselPath = path.join(__dirname, '..', 'src', 'scripts', 'components', 'carousel.js');
let cContent = fs.readFileSync(carouselPath, 'utf-8');

// Replace loadTabItems
const oldLoadTabItems = `function loadTabItems() {
  const source = currentTab === 'games' ? deduplicateGameList(PS5_GAMES) : PS5_MEDIA_APPS;
  const installedItems = source.filter(item => item.installed === true);

  const libraryTile = {
    id: '__ps5_library__',
    isLibrary: true,
    title: currentTab === 'games' ? 'Game Library' : 'App Library',
    studio: 'PlayStation Console & PC Storage • 1.2 TB Free',
    genre: 'Installed Games & Cloud Collection',
    tileIcon: '',
    heroBg: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
    badge: 'Library',
    installed: true,
    liveStatus: 'Manage Installed Storage & Sync PC Games'
  };

  homeItems = [...installedItems, libraryTile];`;

const newLoadTabItems = `function loadTabItems() {
  const source = currentTab === 'games' ? deduplicateGameList(PS5_GAMES) : PS5_MEDIA_APPS;

  const libraryTile = {
    id: '__ps5_library__',
    isLibrary: true,
    title: currentTab === 'games' ? 'Game Library' : 'App Library',
    studio: 'PlayStation Console & PC Storage • 1.2 TB Free',
    genre: 'Installed Games & Cloud Collection',
    tileIcon: '',
    heroBg: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
    badge: 'Library',
    installed: true,
    liveStatus: 'Manage Installed Storage & Sync PC Games'
  };

  if (currentTab === 'games') {
    const storeTile = source.find(item => item.isStore);
    const nonStore = source.filter(item => !item.isStore && !item.isLibrary);

    // Show installed games first (Ghost of Tsushima, Forza 6, Wallpaper Engine),
    // followed by all owned games from the user's Steam library
    const installedGames = nonStore.filter(item => item.installed === true);
    const ownedGames = nonStore.filter(item => item.installed !== true);

    homeItems = [
      ...(storeTile ? [storeTile] : []),
      ...installedGames,
      ...ownedGames,
      libraryTile
    ];
  } else {
    const installedMedia = source.filter(item => item.installed === true);
    homeItems = [...installedMedia, libraryTile];
  }`;

cContent = cContent.replace(oldLoadTabItems, newLoadTabItems);

// Badge class in renderCarouselTrack
cContent = cContent.replace(
  `\${item.badge ? \`<span class="ps5-tile-badge">\${item.badge}</span>\` : ''}`,
  `\${item.badge ? \`<span class="ps5-tile-badge \${item.installed ? 'badge-installed' : 'badge-owned'}">\${item.badge}</span>\` : ''}`
);

// initLibraryModal tabs wiring
cContent = cContent.replace(
  `document.getElementById('lib-tab-installed')?.addEventListener('click', () => switchLibraryTab('installed'));`,
  `document.getElementById('lib-tab-all')?.addEventListener('click', () => switchLibraryTab('all'));\n  document.getElementById('lib-tab-installed')?.addEventListener('click', () => switchLibraryTab('installed'));`
);

// openLibraryModal default tab
cContent = cContent.replace(
  `export function openLibraryModal(tab = 'installed') {`,
  `export function openLibraryModal(tab = 'all') {`
);

// renderLibraryContent filtering
const oldLibFilter = `  const filtered = libraryActiveTab === 'installed'
    ? allList.filter(item => item.installed === true)
    : allList.filter(item => item.installed === false);`;

const newLibFilter = `  let filtered = allList;
  if (libraryActiveTab === 'installed') {
    filtered = allList.filter(item => item.installed === true);
  } else if (libraryActiveTab === 'collection') {
    filtered = allList.filter(item => item.installed === false);
  } else {
    filtered = allList;
  }`;

cContent = cContent.replace(oldLibFilter, newLibFilter);

fs.writeFileSync(carouselPath, cContent, 'utf-8');
console.log('carousel.js updated successfully!');

// 2. Update index.html tabs
const indexPath = path.join(__dirname, '..', 'index.html');
let iContent = fs.readFileSync(indexPath, 'utf-8');
const oldTabsHtml = `<div class="lib-tabs-row">
        <button id="lib-tab-installed" class="lib-tab active">Installed Games</button>
        <button id="lib-tab-collection" class="lib-tab">Your Collection (Owned)</button>
      </div>`;

const newTabsHtml = `<div class="lib-tabs-row">
        <button id="lib-tab-all" class="lib-tab active">All Games</button>
        <button id="lib-tab-installed" class="lib-tab">Installed Games</button>
        <button id="lib-tab-collection" class="lib-tab">Your Collection (Owned on Steam)</button>
      </div>`;

if (iContent.includes(oldTabsHtml)) {
  iContent = iContent.replace(oldTabsHtml, newTabsHtml);
  fs.writeFileSync(indexPath, iContent, 'utf-8');
  console.log('index.html updated successfully!');
} else {
  console.log('index.html already has updated tabs or pattern differed');
}

// 3. Update ps5-components.css for .ps5-tile-badge.badge-owned
const cssPath = path.join(__dirname, '..', 'src', 'styles', 'ps5-components.css');
let cssContent = fs.readFileSync(cssPath, 'utf-8');
if (!cssContent.includes('.ps5-tile-badge.badge-owned')) {
  cssContent = cssContent.replace(
    `.ps5-tile-badge {\n  position: absolute;\n  top: 8px;\n  right: 8px;`,
    `.ps5-tile-badge {\n  position: absolute;\n  top: 8px;\n  right: 8px;`
  );
  const badgeExtra = `\n.ps5-tile-badge.badge-owned {\n  background: rgba(15, 23, 42, 0.85);\n  color: #93c5fd;\n  border-color: rgba(59, 130, 246, 0.4);\n}\n`;
  cssContent = cssContent.replace(
    `border: 1px solid var(--ps-white-20);\n}`,
    `border: 1px solid var(--ps-white-20);\n}${badgeExtra}`
  );
  fs.writeFileSync(cssPath, cssContent, 'utf-8');
  console.log('ps5-components.css badge styles updated successfully!');
}
