import { defineConfig } from 'vite';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

function findBestExe(dirPath, dirName = '') {
  try {
    if (!fs.existsSync(dirPath)) return '';
    const files = fs.readdirSync(dirPath);
    const exes = files.filter(f => f.toLowerCase().endsWith('.exe'));
    const filtered = exes.filter(f => {
      const l = f.toLowerCase();
      return !l.includes('crash') && !l.includes('report') && !l.includes('install') && !l.includes('setup') && !l.includes('crs-');
    });
    if (filtered.length > 0) {
      const cleanDir = dirName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const directMatch = filtered.find(f => cleanDir && f.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(cleanDir));
      if (directMatch) return path.join(dirPath, directMatch);
      const launcher = filtered.find(f => f.toLowerCase().includes('launcher'));
      if (launcher) return path.join(dirPath, launcher);
      return path.join(dirPath, filtered[0]);
    }

    // Check 1 level of subdirectories (like bin/ or Binaries/)
    for (const f of files) {
      const sub = path.join(dirPath, f);
      try {
        if (fs.statSync(sub).isDirectory() && !f.startsWith('.')) {
          const subFiles = fs.readdirSync(sub);
          const subExes = subFiles.filter(sf => sf.toLowerCase().endsWith('.exe')).filter(sf => {
            const l = sf.toLowerCase();
            return !l.includes('crash') && !l.includes('report') && !l.includes('install') && !l.includes('setup') && !l.includes('crs-');
          });
          if (subExes.length > 0) return path.join(sub, subExes[0]);
        }
      } catch (e) {}
    }
  } catch (e) {}
  return '';
}

const KNOWN_STEAM_APPIDS = {
  'ghost of tsushima director\'s cut': '2215430',
  'ghost of tsushima': '2215430',
  'forzahorizon6': '2483190',
  'forza horizon 6': '2483190',
  'forza horizon': '2483190',
  'wallpaper_engine': '431960',
  'wallpaper engine': '431960',
  'blackmythwukong': '2358720',
  'black myth: wukong': '2358720',
  'black myth wukong': '2358720',
  'counter-strike global offensive': '730',
  'counter-strike 2': '730',
  'cs:go': '730',
  'ride 5': '1650010',
  'ride5': '1650010',
  'cyberpunk 2077': '1091500',
  'elden ring': '1245620',
  'god of war ragnarök': '2322010',
  'god of war ragnarok': '2322010',
  'god of war': '1593500',
  'marvel\'s spider-man remastered': '1817070',
  'marvel\'s spider-man miles morales': '1817190',
  'marvel\'s spider-man 2': '2651280',
  'returnal': '1649240',
  'horizon forbidden west': '2420110',
  'grand theft auto iv': '12210',
  'gta iv': '12210',
  'grand theft auto v': '3240220',
  'gta v': '3240220',
  'forza horizon 5': '1551360',
  'forza motorsport': '2440510',
  'the last of us part i': '1888930',
  'the last of us part ii': '2531310',
  'batman arkham knight': '208650',
  'batman arkham city': '200260',
  'batman arkham origins': '209000',
  'batman arkham asylum': '35140',
  'dragon ball sparking zero': '1790600',
  'dragon ball z kakarot': '851850'
};

const STEAM_LIBRARY_DATABASE = {
  '2215430': { title: "Ghost of Tsushima DIRECTOR'S CUT", studio: 'Sucker Punch • PlayStation PC Publishing', genre: 'Action Adventure • Samurai Epic', downloadSize: '75 GB' },
  '2483190': { title: 'Forza Horizon 6', studio: 'Playground Games • Xbox Game Studios', genre: 'Open World Racing • Simulation', downloadSize: '167 GB' },
  '431960': { title: 'Wallpaper Engine', studio: 'Kristjan Skutta • Steam Software', genre: 'Utility • Live Wallpapers', downloadSize: '512 MB' },
  '2322010': { title: 'God of War Ragnarök', studio: 'Santa Monica Studio • PlayStation PC', genre: 'Action • Mythological Epic', downloadSize: '190 GB' },
  '1593500': { title: 'God of War', studio: 'Santa Monica Studio • PlayStation PC', genre: 'Action Adventure • Mythological Epic', downloadSize: '70 GB' },
  '2651280': { title: "Marvel's Spider-Man 2", studio: 'Insomniac Games • PlayStation PC', genre: 'Action • Superhero Open World', downloadSize: '140 GB' },
  '1817070': { title: "Marvel’s Spider-Man Remastered", studio: 'Insomniac Games • PlayStation PC', genre: 'Action • Superhero Open World', downloadSize: '75 GB' },
  '1817190': { title: "Marvel’s Spider-Man: Miles Morales", studio: 'Insomniac Games • PlayStation PC', genre: 'Action • Superhero Open World', downloadSize: '75 GB' },
  '2358720': { title: 'Black Myth: Wukong', studio: 'Game Science • Action RPG', genre: 'Action RPG • Journey to the West', downloadSize: '130 GB' },
  '1888930': { title: 'The Last of Us™ Part I', studio: 'Naughty Dog • PlayStation PC', genre: 'Action Adventure • Post-Apocalyptic', downloadSize: '100 GB' },
  '2531310': { title: 'The Last of Us™ Part II Remastered', studio: 'Naughty Dog • PlayStation PC', genre: 'Action Adventure • Post-Apocalyptic', downloadSize: '150 GB' },
  '1551360': { title: 'Forza Horizon 5', studio: 'Playground Games • Xbox Game Studios', genre: 'Open World Racing • Festival', downloadSize: '110 GB' },
  '2440510': { title: 'Forza Motorsport', studio: 'Turn 10 Studios • Xbox Game Studios', genre: 'Track Racing • Motorsport Simulation', downloadSize: '130 GB' },
  '1650010': { title: 'RIDE 5', studio: 'Milestone S.r.l. • Unreal Engine 5', genre: 'Motorcycle Racing • Superbike Simulation', downloadSize: '50 GB' },
  '1790600': { title: 'DRAGON BALL: Sparking! ZERO', studio: 'Spike Chunsoft • Bandai Namco', genre: 'Anime Fighting • 3D Arena Brawler', downloadSize: '29 GB' },
  '851850': { title: 'DRAGON BALL Z: KAKAROT', studio: 'CyberConnect2 • Bandai Namco', genre: 'Action RPG • Anime Adventure', downloadSize: '116.86 GB' },
  '12210': { title: 'Grand Theft Auto IV: The Complete Edition', studio: 'Rockstar Games • Open World Classic', genre: 'Action • Crime Open World', downloadSize: '22 GB' },
  '3240220': { title: 'Grand Theft Auto V Enhanced', studio: 'Rockstar Games • Los Santos', genre: 'Action • Crime Open World', downloadSize: '105 GB' },
  '1546970': { title: 'Grand Theft Auto III – The Definitive Edition', studio: 'Rockstar Games • Liberty City', genre: 'Action • Open World', downloadSize: '5 GB' },
  '1546990': { title: 'Grand Theft Auto: Vice City – The Definitive Edition', studio: 'Rockstar Games • 80s Vice City', genre: 'Action • Open World', downloadSize: '10 GB' },
  '1547000': { title: 'Grand Theft Auto: San Andreas – The Definitive Edition', studio: 'Rockstar Games • San Andreas', genre: 'Action • Open World', downloadSize: '19 GB' },
  '35140': { title: 'Batman: Arkham Asylum Game of the Year Edition', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Superhero', downloadSize: '8 GB' },
  '200260': { title: 'Batman: Arkham City - Game of the Year Edition', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Superhero Open World', downloadSize: '17 GB' },
  '208650': { title: 'Batman™: Arkham Knight', studio: 'Rocksteady Studios • WB Games', genre: 'Action Adventure • Superhero Open World', downloadSize: '45 GB' },
  '209000': { title: 'Batman™: Arkham Origins', studio: 'WB Games Montréal • WB Games', genre: 'Action Adventure • Superhero', downloadSize: '20 GB' },
  '498240': { title: 'Batman - The Telltale Series', studio: 'Telltale Games • Interactive Story', genre: 'Episodic Adventure • Story', downloadSize: '12 GB' },
  '313690': { title: 'LEGO® Batman™ 3: Beyond Gotham', studio: 'TT Games • Warner Bros. Games', genre: 'Action • LEGO Family Adventure', downloadSize: '10 GB' },
  '2215200': { title: 'LEGO® Batman™: Legacy of the Dark Knight', studio: 'TT Games • Warner Bros. Games', genre: 'Action • LEGO Family Adventure', downloadSize: '50 GB' },
  '2878960': { title: 'WWE 2K25', studio: 'Visual Concepts • 2K Sports', genre: 'Sports • Pro Wrestling', downloadSize: '103 GB' },
  '4080220': { title: 'EA SPORTS FC™ 27', studio: 'EA Vancouver • EA Sports', genre: 'Sports • Football Simulation', downloadSize: '100 GB' },
  '730': { title: 'Counter-Strike 2', studio: 'Valve Corporation • Source 2 Engine', genre: 'Tactical FPS • Competitive Esports', downloadSize: '85 GB' },
  '1815780': { title: 'Asphalt Legends', studio: 'Gameloft • High-Octane Racing', genre: 'Arcade Racing • Supercars', downloadSize: '10 GB' },
  '3301060': { title: 'Desktop Mate', studio: 'Desktop Interactive • Mascot Utility', genre: 'Utility • Interactive Desktop', downloadSize: '500 MB' },
  '1091500': { title: 'Cyberpunk 2077', studio: 'CD PROJEKT RED • Night City', genre: 'Action RPG • Cyberpunk', downloadSize: '70 GB' },
  '1245620': { title: 'Elden Ring', studio: 'FromSoftware • Bandai Namco', genre: 'Action RPG • Dark Fantasy', downloadSize: '60 GB' },
  '883710': { title: 'Resident Evil 2', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror', downloadSize: '26 GB' },
  '952060': { title: 'Resident Evil 3', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror', downloadSize: '45 GB' },
  '2050650': { title: 'Resident Evil 4', studio: 'Capcom • Survival Horror', genre: 'Action • Survival Horror', downloadSize: '67 GB' },
  '21690': { title: 'Resident Evil 5', studio: 'Capcom • Action Co-Op', genre: 'Action • Co-Op Shooter', downloadSize: '15 GB' },
  '221040': { title: 'Resident Evil 6', studio: 'Capcom • Action Horror', genre: 'Action • Dramatic Horror', downloadSize: '16 GB' },
  '418370': { title: 'Resident Evil 7 Biohazard', studio: 'Capcom • Survival Horror', genre: 'Survival Horror • RE Engine', downloadSize: '24 GB' },
  '1196590': { title: 'Resident Evil Village', studio: 'Capcom • RE Engine', genre: 'Survival Horror • Ethan Winters', downloadSize: '30 GB' },
  '3764200': { title: 'Resident Evil Requiem', studio: 'Capcom • Next-Gen Horror', genre: 'Survival Horror • RE Engine', downloadSize: '45 GB' },
  '3357650': { title: 'PRAGMATA', studio: 'Capcom • Sci-Fi Adventure', genre: 'Action Adventure • Lunar Dystopia', downloadSize: '40 GB' }
};

// Vite custom plugin to communicate with Windows OS on the user's laptop
function pcLauncherPlugin() {
  let lastLaunchedApp = null;

  return {
    name: 'ps5-pc-launcher',
    configureServer(server) {
      // 1a. Launch Game or App on Laptop
      server.middlewares.use('/api/pc/launch', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const { execPath, uri, appId, title, args } = JSON.parse(body || '{}');
              lastLaunchedApp = { execPath, uri, appId, title, launchedAt: Date.now() };

              let cmd = '';

              if (execPath && args) {
                cmd = `start "" "${execPath}" ${args}`;
              } else if (uri) {
                // Windows protocol launch (e.g. steam://, xbox://, etc.)
                cmd = `start "" "${uri}"`;
              } else if (execPath) {
                // Windows exe path launch
                cmd = `start "" "${execPath}"`;
              }

              if (cmd) {
                console.log(`[PS5 PC Launcher] Launching: ${cmd}`);
                exec(cmd, { windowsHide: true }, (err) => {
                  if (err) {
                    console.error('[PS5 PC Launcher] Error:', err.message);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: err.message }));
                    return;
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, launched: cmd }));
                });
              } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing execPath or uri' }));
              }
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        }
      });

      // 1b. YouTube Search Suggest API Proxy
      server.middlewares.use('/api/yt/suggest', async (req, res) => {
        try {
          const u = new URL(req.url, 'http://localhost');
          const q = u.searchParams.get('q') || '';
          if (!q) {
            res.setHeader('Content-Type', 'application/json');
            res.end('[]');
            return;
          }
          const ytUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`;
          const resp = await fetch(ytUrl);
          const data = await resp.json();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data[1] || []));
        } catch (e) {
          res.setHeader('Content-Type', 'application/json');
          res.end('[]');
        }
      });

      // 1c. Direct In-App YouTube & YouTube Music Reverse Proxies (strip X-Frame-Options & CSP, inject base)
      server.middlewares.use('/proxy/yt', (req, res) => {
        const targetPath = req.url || '/';
        const targetUrl = `https://www.youtube.com${targetPath}`;
        import('https').then(https => {
          const reqHeaders = { ...req.headers };
          delete reqHeaders['accept-encoding']; // ensure uncompressed UTF-8 for HTML rewriting
          reqHeaders['host'] = 'www.youtube.com';
          reqHeaders['referer'] = 'https://www.youtube.com/';
          reqHeaders['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

          const pReq = https.request(targetUrl, {
            method: req.method,
            headers: reqHeaders
          }, (pRes) => {
            const headers = { ...pRes.headers };
            delete headers['x-frame-options'];
            delete headers['content-security-policy'];
            delete headers['frame-ancestors'];
            headers['access-control-allow-origin'] = '*';

            const contentType = headers['content-type'] || '';
            if (contentType.includes('text/html')) {
              let chunks = [];
              pRes.on('data', chunk => chunks.push(chunk));
              pRes.on('end', () => {
                let html = Buffer.concat(chunks).toString('utf-8');
                html = html.replace(/<head>/i, '<head><base href="https://www.youtube.com/">');
                delete headers['content-length'];
                res.writeHead(pRes.statusCode, headers);
                res.end(html);
              });
            } else {
              res.writeHead(pRes.statusCode, headers);
              pRes.pipe(res);
            }
          });
          pReq.on('error', (err) => {
            res.statusCode = 502;
            res.end(`Proxy error: ${err.message}`);
          });
          req.pipe(pReq);
        });
      });

      server.middlewares.use('/proxy/ytm', (req, res) => {
        const targetPath = req.url || '/';
        const targetUrl = `https://music.youtube.com${targetPath}`;
        import('https').then(https => {
          const reqHeaders = { ...req.headers };
          delete reqHeaders['accept-encoding'];
          reqHeaders['host'] = 'music.youtube.com';
          reqHeaders['referer'] = 'https://music.youtube.com/';
          reqHeaders['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

          const pReq = https.request(targetUrl, {
            method: req.method,
            headers: reqHeaders
          }, (pRes) => {
            const headers = { ...pRes.headers };
            delete headers['x-frame-options'];
            delete headers['content-security-policy'];
            delete headers['frame-ancestors'];
            headers['access-control-allow-origin'] = '*';

            const contentType = headers['content-type'] || '';
            if (contentType.includes('text/html')) {
              let chunks = [];
              pRes.on('data', chunk => chunks.push(chunk));
              pRes.on('end', () => {
                let html = Buffer.concat(chunks).toString('utf-8');
                html = html.replace(/<head>/i, '<head><base href="https://music.youtube.com/">');
                delete headers['content-length'];
                res.writeHead(pRes.statusCode, headers);
                res.end(html);
              });
            } else {
              res.writeHead(pRes.statusCode, headers);
              pRes.pipe(res);
            }
          });
          pReq.on('error', (err) => {
            res.statusCode = 502;
            res.end(`Proxy error: ${err.message}`);
          });
          req.pipe(pReq);
        });
      });

      // 1d. Forward relative YouTube API requests
      server.middlewares.use('/youtubei', (req, res) => {
        const targetUrl = `https://www.youtube.com/youtubei${req.url || ''}`;
        import('https').then(https => {
          const reqHeaders = { ...req.headers };
          reqHeaders['host'] = 'www.youtube.com';
          reqHeaders['referer'] = 'https://www.youtube.com/';
          reqHeaders['origin'] = 'https://www.youtube.com';

          const pReq = https.request(targetUrl, {
            method: req.method,
            headers: reqHeaders
          }, (pRes) => {
            const headers = { ...pRes.headers };
            delete headers['x-frame-options'];
            delete headers['content-security-policy'];
            headers['access-control-allow-origin'] = '*';
            res.writeHead(pRes.statusCode, headers);
            pRes.pipe(res);
          });
          pReq.on('error', (err) => {
            res.statusCode = 502;
            res.end(err.message);
          });
          req.pipe(pReq);
        });
      });

      // 1b. Close / Quit Running Game or App on Laptop
      server.middlewares.use('/api/pc/close', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const execPath = payload.execPath || lastLaunchedApp?.execPath;
              const uri = payload.uri || payload.launchUri || lastLaunchedApp?.uri;
              const appId = payload.appId || lastLaunchedApp?.appId;
              const title = payload.title || lastLaunchedApp?.title;

              const targets = new Set();

              // 1. Direct executable from execPath
              if (execPath) {
                const base = path.basename(execPath);
                if (base) targets.add(base);
              }

              // 2. Extract appId if present
              let targetAppId = appId;
              if (!targetAppId && uri && typeof uri === 'string' && uri.startsWith('steam://rungameid/')) {
                targetAppId = uri.replace('steam://rungameid/', '').trim();
              }

              // 3. Inspect Steam manifest for installdir
              const steamApps = 'C:/Program Files (x86)/Steam/steamapps';
              let installDir = '';
              if (targetAppId && fs.existsSync(steamApps)) {
                const manifestPath = path.join(steamApps, `appmanifest_${targetAppId}.acf`);
                if (fs.existsSync(manifestPath)) {
                  try {
                    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
                    const matchDir = manifestContent.match(/"installdir"\s+"([^"]+)"/);
                    if (matchDir) installDir = matchDir[1];
                  } catch (e) {}
                }
              }

              if (!installDir && title && fs.existsSync(path.join(steamApps, 'common'))) {
                try {
                  const commons = fs.readdirSync(path.join(steamApps, 'common'));
                  const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                  const matched = commons.find(c => {
                    const cleanC = c.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    return cleanTitle.includes(cleanC) || cleanC.includes(cleanTitle);
                  });
                  if (matched) installDir = matched;
                } catch (e) {}
              }

              // 4. Scan game folder for all executables
              if (installDir) {
                const fullGameDir = path.join(steamApps, 'common', installDir);
                if (fs.existsSync(fullGameDir)) {
                  try {
                    const scanExes = (dir, depth = 0) => {
                      if (depth > 2) return;
                      const entries = fs.readdirSync(dir);
                      for (const entry of entries) {
                        const full = path.join(dir, entry);
                        try {
                          const stat = fs.statSync(full);
                          if (stat.isDirectory() && !entry.startsWith('.')) {
                            scanExes(full, depth + 1);
                          } else if (entry.toLowerCase().endsWith('.exe')) {
                            const l = entry.toLowerCase();
                            if (!l.includes('crash') && !l.includes('report') && !l.includes('setup') && !l.includes('installer')) {
                              targets.add(entry);
                            }
                          }
                        } catch (e) {}
                      }
                    };
                    scanExes(fullGameDir);
                  } catch (e) {}
                }
              }

              // 5. Title specific heuristics
              if (title) {
                const lTitle = title.toLowerCase();
                if (lTitle.includes('forza')) {
                  targets.add('forzahorizon6.exe');
                  targets.add('forzaprotocolselector.exe');
                  targets.add('forzahorizon5.exe');
                  targets.add('forza.exe');
                } else if (lTitle.includes('tsushima')) {
                  targets.add('GhostOfTsushima.exe');
                } else if (lTitle.includes('wallpaper')) {
                  targets.add('wallpaper32.exe');
                  targets.add('wallpaper64.exe');
                  targets.add('launcher.exe');
                } else if (lTitle.includes('counter-strike') || lTitle.includes('cs2')) {
                  targets.add('cs2.exe');
                  targets.add('csgo.exe');
                } else if (lTitle.includes('ride 5')) {
                  targets.add('ride5.exe');
                  targets.add('Ride5-Win64-Shipping.exe');
                }
              }

              const targetList = Array.from(targets);
              console.log('[PS5 PC Launcher] Closing game targets:', targetList);

              if (targetList.length === 0) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, message: 'No executable target found to close' }));
                return;
              }

              // Execute taskkill for all candidate executables with /T (tree) and /F (force)
              let killedCount = 0;
              const killPromises = targetList.map(exe => new Promise(resolve => {
                exec(`taskkill /IM "${exe}" /T /F`, { windowsHide: true }, (err, stdout) => {
                  if (!err && stdout && stdout.toLowerCase().includes('success')) {
                    killedCount++;
                    console.log(`[PS5 PC Launcher] Successfully terminated process: ${exe}`);
                  }
                  resolve();
                });
              }));

              Promise.all(killPromises).then(() => {
                lastLaunchedApp = null;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  closedTargets: targetList,
                  processesKilled: killedCount
                }));
              });

            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        }
      });

      // 2. Official Steam Asset Streamer (Local Librarycache + Steam Akamai CDN)
      server.middlewares.use('/api/pc/asset', (req, res) => {
        try {
          const parsedUrl = new URL(req.url, 'http://localhost:5173');
          const appId = parsedUrl.searchParams.get('appId');
          const type = parsedUrl.searchParams.get('type'); // 'logo', 'hero', 'tile', 'header'

          if (!appId) {
            res.statusCode = 400;
            res.end('Missing appId');
            return;
          }

          // Special pristine hero art override for Ghost of Tsushima to eliminate Steam library_hero line artifact
          if (appId === '2215430' && type === 'hero') {
            res.writeHead(302, { Location: '/assets/games/got/hero.jpg' });
            res.end();
            return;
          }

          // Special Forza Horizon 6 dedicated assets
          if (appId === '2483190') {
            if (type === 'logo') {
              res.writeHead(302, { Location: '/assets/games/forza6/logo.png' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/forza6/hero.jpg' });
              res.end();
              return;
            } else if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/forza6/tile.jpg' });
              res.end();
              return;
            }
          }

          // Special official PS5 game card artwork for Black Myth: Wukong
          if (appId === '2358720') {
            if (type === 'tile') {
              res.writeHead(302, { Location: '/assets/games/wukong/ps5_tile.webp' });
              res.end();
              return;
            } else if (type === 'hero') {
              res.writeHead(302, { Location: '/assets/games/wukong/ps5_hero.webp' });
              res.end();
              return;
            }
          }

          // Search local Steam librarycache on user's laptop (including modern Steam hash subdirectories)
          function findLocalAsset(id, assetType) {
            const cacheBase = 'C:/Program Files (x86)/Steam/appcache/librarycache';
            const cacheDir = path.join(cacheBase, id);
            if (!fs.existsSync(cacheDir)) return null;

            const candidateNames = {
              logo: ['logo.png'],
              hero: ['library_hero.jpg', 'hero.jpg'],
              tile: ['library_600x900.jpg', 'library_600x900_2x.jpg', 'library_capsule.jpg', 'library_header.jpg', 'header.jpg'],
              header: ['library_header.jpg', 'header.jpg', 'library_capsule.jpg']
            }[assetType] || [];

            for (const fn of candidateNames) {
              const direct = path.join(cacheDir, fn);
              if (fs.existsSync(direct)) return direct;
            }

            try {
              const entries = fs.readdirSync(cacheDir);
              for (const entry of entries) {
                const sub = path.join(cacheDir, entry);
                if (fs.statSync(sub).isDirectory()) {
                  for (const fn of candidateNames) {
                    const subFile = path.join(sub, fn);
                    if (fs.existsSync(subFile)) return subFile;
                  }
                }
              }
            } catch (e) {}

            return null;
          }

          let localFile = findLocalAsset(appId, type);

          // Check fallback alias if needed
          let targetAppId = appId;
          if (!localFile) {
            if (appId === '2215200') targetAppId = '313690';
            if (appId === '4080220') targetAppId = '2669320';
            localFile = findLocalAsset(targetAppId, type);
          }

          if (localFile) {
            const ext = path.extname(localFile).toLowerCase();
            res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            fs.createReadStream(localFile).pipe(res);
            return;
          }

          // Fallback redirect to official Steam CDN
          let cdnUrl = '';
          if (type === 'logo') {
            cdnUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${targetAppId}/logo.png`;
          } else if (type === 'hero') {
            cdnUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${targetAppId}/library_hero.jpg`;
          } else if (type === 'tile') {
            cdnUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${targetAppId}/library_600x900_2x.jpg`;
          } else {
            cdnUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${targetAppId}/header.jpg`;
          }

          res.writeHead(302, { Location: cdnUrl });
          res.end();
        } catch (err) {
          res.statusCode = 500;
          res.end(err.message);
        }
      });

      // 3. Scan Laptop for Steam & PC Games with Real Logos, Covers & 4K Backgrounds
      server.middlewares.use('/api/pc/scan', (req, res) => {
        if (req.method === 'GET') {
          const detected = [];
          const seenTitles = new Set();
          const seenAppIds = new Set();

          // 3a. Discover all Steam library folders (from libraryfolders.vdf)
          const steamAppsBase = path.normalize('C:/Program Files (x86)/Steam/steamapps');
          const libraryFolders = [steamAppsBase];

          const libVdfPath = path.join(steamAppsBase, 'libraryfolders.vdf');
          if (fs.existsSync(libVdfPath)) {
            try {
              const vdfContent = fs.readFileSync(libVdfPath, 'utf-8');
              const pathMatches = [...vdfContent.matchAll(/"path"\s+"([^"]+)"/g)];
              for (const pm of pathMatches) {
                const normalized = path.normalize(path.join(pm[1].replace(/\\\\/g, path.sep), 'steamapps'));
                if (!libraryFolders.some(lf => lf.toLowerCase() === normalized.toLowerCase()) && fs.existsSync(normalized)) {
                  libraryFolders.push(normalized);
                }
              }
            } catch (e) {}
          }

          // 3b. Scan Steam App Manifests in all library folders
          for (const sApps of libraryFolders) {
            if (!fs.existsSync(sApps)) continue;
            try {
              const files = fs.readdirSync(sApps);
              for (const file of files) {
                if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
                  const content = fs.readFileSync(path.join(sApps, file), 'utf-8');
                  const matchName = content.match(/"name"\s+"([^"]+)"/);
                  const matchDir = content.match(/"installdir"\s+"([^"]+)"/);
                  const matchAppId = content.match(/"appid"\s+"([^"]+)"/);
                  if (matchName && matchDir) {
                    const name = matchName[1];
                    const dirName = matchDir[1];
                    const appId = matchAppId ? matchAppId[1] : '';

                    if (!name.toLowerCase().includes('steamworks') && 
                        !name.toLowerCase().includes('redistributable') &&
                        !name.toLowerCase().includes('controller config')) {
                      
                      if (appId && seenAppIds.has(appId)) continue;
                      if (seenTitles.has(name.toLowerCase())) continue;

                      const fullDir = path.join(sApps, 'common', dirName);
                      const exePath = findBestExe(fullDir, dirName);
                      const isReallyInstalled = Boolean(exePath && fs.existsSync(exePath));

                      seenTitles.add(name.toLowerCase());
                      seenTitles.add(dirName.toLowerCase());
                      if (appId) seenAppIds.add(appId);

                      const dbMeta = STEAM_LIBRARY_DATABASE[appId] || {};

                      const matchSizeOnDisk = content.match(/"SizeOnDisk"\s+"([^"]+)"/);
                      let manifestSize = '';
                      if (matchSizeOnDisk) {
                        const bytes = parseInt(matchSizeOnDisk[1], 10);
                        if (!isNaN(bytes) && bytes > 0) {
                          manifestSize = bytes >= 1073741824
                            ? (bytes / 1073741824).toFixed(1) + ' GB'
                            : Math.round(bytes / 1048576) + ' MB';
                        }
                      }
                      const exactSize = manifestSize || dbMeta.downloadSize || (isReallyInstalled ? '52.1 GB' : 'Ready to Download');

                      detected.push({
                        id: 'pc_steam_' + (appId || name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()),
                        appId: appId,
                        title: dbMeta.title || name,
                        studio: dbMeta.studio || 'Steam Library • PC Game',
                        genre: isReallyInstalled ? (dbMeta.genre || 'Installed on Laptop') : 'Steam Library • Owned',
                        execPath: exePath,
                        launchUri: appId ? `steam://rungameid/${appId}` : '',
                        logoImg: appId ? `/api/pc/asset?appId=${appId}&type=logo` : '',
                        heroBg: appId ? `/api/pc/asset?appId=${appId}&type=hero` : '',
                        tileIcon: appId ? `/api/pc/asset?appId=${appId}&type=tile` : '',
                        installDir: fullDir,
                        installed: isReallyInstalled,
                        badge: isReallyInstalled ? 'Installed' : 'Owned',
                        installSize: exactSize,
                        storageType: isReallyInstalled ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)',
                        liveStatus: isReallyInstalled ? `Installed on Laptop • ${exactSize} Ready` : `Owned on Steam • ${exactSize} Download`
                      });
                    }
                  }
                }
              }
            } catch (e) {}
          }

          // 3c. Scan Steam Common folders for any loose unmanifested games
          for (const sApps of libraryFolders) {
            const sCommon = path.join(sApps, 'common');
            if (fs.existsSync(sCommon)) {
              try {
                const folders = fs.readdirSync(sCommon);
                for (const folder of folders) {
                  const folderLower = folder.toLowerCase();
                  const resolvedAppId = KNOWN_STEAM_APPIDS[folderLower] || '';

                  if (seenTitles.has(folderLower) || 
                      (resolvedAppId && seenAppIds.has(resolvedAppId)) ||
                      folderLower.includes('steamworks') || 
                      folderLower.includes('controller config') ||
                      folderLower.includes('redistributable')) {
                    continue;
                  }

                  const fullDir = path.join(sCommon, folder);
                  if (fs.statSync(fullDir).isDirectory()) {
                    const exe = findBestExe(fullDir, folder);
                    const isReallyInstalled = Boolean(exe && fs.existsSync(exe));
                    seenTitles.add(folderLower);
                    if (resolvedAppId) seenAppIds.add(resolvedAppId);

                    const dbMeta = STEAM_LIBRARY_DATABASE[resolvedAppId] || {};
                    const exactSize = dbMeta.downloadSize || (isReallyInstalled ? '50.0 GB' : 'Ready to Download');

                    detected.push({
                      id: 'pc_' + folder.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
                      appId: resolvedAppId,
                      title: dbMeta.title || folder,
                      studio: dbMeta.studio || 'PC Game • Steam Library',
                      genre: isReallyInstalled ? (dbMeta.genre || 'Installed on Laptop') : 'Steam Library • Owned',
                      execPath: exe,
                      launchUri: resolvedAppId ? `steam://rungameid/${resolvedAppId}` : '',
                      logoImg: resolvedAppId ? `/api/pc/asset?appId=${resolvedAppId}&type=logo` : '',
                      heroBg: resolvedAppId ? `/api/pc/asset?appId=${resolvedAppId}&type=hero` : '',
                      tileIcon: resolvedAppId ? `/api/pc/asset?appId=${resolvedAppId}&type=tile` : '',
                      installDir: fullDir,
                      installed: isReallyInstalled,
                      badge: isReallyInstalled ? 'Installed' : 'Owned',
                      installSize: exactSize,
                      storageType: isReallyInstalled ? 'Laptop SSD (Steam Library)' : 'Steam Library (Ready to Download)',
                      liveStatus: isReallyInstalled ? `Installed on Laptop • ${exactSize} Ready` : `Owned on Steam • ${exactSize} Download`
                    });
                  }
                }
              } catch (e) {}
            }
          }

          // 3d. Scan Whole Steam Library for Owned Games (stplug-in licenses & library database)
          const ownedAppIds = new Set();

          // Collect from stplug-in
          const pluginDir = 'C:/Program Files (x86)/Steam/config/stplug-in';
          if (fs.existsSync(pluginDir)) {
            try {
              const pFiles = fs.readdirSync(pluginDir);
              for (const pf of pFiles) {
                if (pf.endsWith('.lua')) {
                  const aid = pf.replace('.lua', '');
                  if (/^\d+$/.test(aid)) ownedAppIds.add(aid);
                }
              }
            } catch (e) {}
          }

          // Also include all known user database games
          for (const aid of Object.keys(STEAM_LIBRARY_DATABASE)) {
            ownedAppIds.add(aid);
          }

          // For each owned game not already installed/detected:
          for (const aid of ownedAppIds) {
            if (seenAppIds.has(aid)) continue;
            const meta = STEAM_LIBRARY_DATABASE[aid];
            if (!meta) continue;

            seenAppIds.add(aid);
            seenTitles.add(meta.title.toLowerCase());

            const exactSize = meta.downloadSize || 'Ready to Download';

            detected.push({
              id: 'pc_steam_' + aid,
              appId: aid,
              title: meta.title,
              studio: meta.studio || 'Steam Library • Owned',
              genre: meta.genre || 'Steam Library • Owned',
              execPath: '',
              launchUri: `steam://rungameid/${aid}`,
              logoImg: `/api/pc/asset?appId=${aid}&type=logo`,
              heroBg: `/api/pc/asset?appId=${aid}&type=hero`,
              tileIcon: `/api/pc/asset?appId=${aid}&type=tile`,
              installed: false,
              badge: 'Owned',
              installSize: exactSize,
              storageType: 'Steam Library (Ready to Download)',
              liveStatus: `Owned on Steam • ${exactSize} Download`
            });
          }

          // 3e. Detect Valorant & Riot Games
          const riotClientExe = 'C:\\Riot Games\\Riot Client\\RiotClientServices.exe';
          const valorantDir = 'C:\\Riot Games\\VALORANT';
          if (fs.existsSync(riotClientExe) || fs.existsSync(valorantDir)) {
            const isInstalled = fs.existsSync(riotClientExe);
            detected.unshift({
              id: 'pc_valorant',
              appId: 'valorant',
              title: 'VALORANT',
              studio: 'Riot Games • Tactical Hero Shooter',
              genre: '5v5 Character-Based Tactical Shooter',
              execPath: riotClientExe,
              execArgs: '--launch-product=valorant --launch-patchline=live',
              launchUri: '',
              logoImg: '/assets/games/valorant/ps5_logo.png',
              heroBg: '/assets/games/valorant/ps5_gamehub_cover.png',
              tileIcon: '/assets/games/valorant/ps5_master.png',
              installed: isInstalled,
              badge: isInstalled ? 'Installed' : 'Owned',
              installSize: '45.2 GB',
              storageType: 'Laptop SSD (Riot Games)',
              liveStatus: isInstalled ? 'Installed on Laptop • Low Latency 240FPS Vanguard Active' : 'Ready to Install • Riot Games'
            });
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, games: detected }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [pcLauncherPlugin()],
  server: {
    port: 5173
  }
});
