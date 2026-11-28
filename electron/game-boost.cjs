const fs = require('fs');
const path = require('path');
const os = require('os');
const child_process = require('child_process');
const util = require('util');

const execAsync = util.promisify(child_process.exec);
const execFileAsync = util.promisify(child_process.execFile);

const POWER_SCHEME_HIGH_PERFORMANCE = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c';
const POWER_SCHEME_ULTIMATE = 'e9a42b02-d5df-448d-aa00-03f14749eb61';
const SUB_PROCESSOR_GUID = '54533251-82be-4824-96c1-47b60b740d00';
const CPMINCORES_GUID = '0cc5b647-c1df-4637-891a-dec35c318583';

// Never close critical Windows services, drivers (NVIDIA/AMD/Intel), OEM fan controllers, anti-cheat, audio, or host/IDE tools
const PROTECTED_PROCESSES = new Set([
  'system', 'idle', 'registry', 'smss', 'csrss', 'wininit', 'services', 'lsass',
  'svchost', 'fontdrvhost', 'winlogon', 'dwm', 'explorer', 'taskhostw', 'sihost',
  'ctfmon', 'conhost', 'runtimebroker', 'audiodg', 'spoolsv', 'searchindexer',
  'searchhost', 'startmenuexperiencehost', 'shellexperiencehost', 'lockapp',
  'textinputhost', 'securityhealthservice', 'securityhealthsystray', 'msmpeng',
  'nissrv', 'smartscreen', 'taskmgr', 'dllhost', 'backgroundtaskhost', 'wmiprvse',
  'nvcontainer', 'nvdisplay.container', 'nvidia share', 'nvidia web helper',
  'nvidia app', 'nvidia overlay', 'nvtelemetrycontainer',
  'amddvr', 'radeonsoftware', 'amdrsserv', 'amdfendrsr', 'atieclxx', 'atiesrxx', 'cncmd', 'amdryzenmaster',
  'igfxem', 'igfxtray', 'igfxcuiservice', 'igfxext', 'intelgraphicssoftware', 'arccontrol',
  'armourycrate', 'acpowernotification', 'ghelper', 'vantage', 'predatorsense', 'nitrosense', 'omencommandcenter',
  'realtek', 'rtkauduservice64', 'nahimicservice', 'dolbydax2api',
  'vgc', 'vgtray', 'easyanticheat', 'easyanticheat_eos', 'beservice', 'battleye',
  'electron', 'node', 'vite', 'code', 'antigravity', 'language_server_windows_x64',
  'powershell', 'pwsh', 'cmd', 'windowsterminal', 'openconsole', 'git', 'python'
]);

// Only throttle genuinely non-game OS background tasks (never throttle Steam/Xbox/Epic helpers used by overlays & sign-in)
const HELPER_THROTTLE_TARGETS = {
  backgroundtaskhost: os.constants?.priority?.PRIORITY_LOW ?? 19,
  searchindexer: os.constants?.priority?.PRIORITY_LOW ?? 19,
  compattelrunner: os.constants?.priority?.PRIORITY_LOW ?? 19,
  msedgeupdate: os.constants?.priority?.PRIORITY_LOW ?? 19,
  googleupdate: os.constants?.priority?.PRIORITY_LOW ?? 19,
  onedrivestandaloneupdater: os.constants?.priority?.PRIORITY_LOW ?? 19,
  adobearm: os.constants?.priority?.PRIORITY_LOW ?? 19,
  jusched: os.constants?.priority?.PRIORITY_LOW ?? 19
};

// Storefront runtimes indexed so we protect whichever store owns the launched game
const STORE_RUNTIME_PROCESSES = {
  steam: ['steam', 'steamservice', 'steamwebhelper', 'gameoverlayui'],
  xbox: ['xboxpcapp', 'xboxapp', 'gamingservices', 'gamingservicesnet', 'xboxid'],
  riot: ['riotclientservices', 'riotclientux', 'riotclientuxrender', 'vgc', 'vgtray'],
  epic: ['epicgameslauncher', 'epicwebhelper', 'eosoverlayrenderer-win64-shipping', 'eosoverlayrenderer-win32-shipping'],
  ubisoft: ['upc', 'ubisoftconnect', 'ubisoftgamelauncher'],
  ea: ['eadesktop', 'ealauncher', 'eabackgroundservice']
};

const BROWSER_EXE_SET = new Set(['chrome', 'msedge', 'brave', 'opera', 'opera_gx', 'firefox', 'vivaldi', 'arc']);

// User-space unused apps & Windows bloat candidates organized cleanly by category
const BOOST_APP_CATALOG = {
  browsers: [
    { exe: 'chrome', label: 'Google Chrome' },
    { exe: 'msedge', label: 'Microsoft Edge' },
    { exe: 'brave', label: 'Brave Browser' },
    { exe: 'opera', label: 'Opera' },
    { exe: 'opera_gx', label: 'Opera GX' },
    { exe: 'firefox', label: 'Mozilla Firefox' },
    { exe: 'vivaldi', label: 'Vivaldi' },
    { exe: 'arc', label: 'Arc Browser' }
  ],
  chatMedia: [
    { exe: 'discord', label: 'Discord' },
    { exe: 'spotify', label: 'Spotify' },
    { exe: 'telegram', label: 'Telegram' },
    { exe: 'whatsapp', label: 'WhatsApp' },
    { exe: 'whatsapp.root', label: 'WhatsApp' },
    { exe: 'chatgpt', label: 'ChatGPT' },
    { exe: 'slack', label: 'Slack' },
    { exe: 'teams', label: 'Microsoft Teams' },
    { exe: 'ms-teams', label: 'Microsoft Teams' },
    { exe: 'zoom', label: 'Zoom' },
    { exe: 'skype', label: 'Skype' }
  ],
  unusedLaunchers: [
    { exe: 'epicgameslauncher', label: 'Epic Games Launcher' },
    { exe: 'epicwebhelper', label: 'Epic Web Helper' },
    { exe: 'upc', label: 'Ubisoft Connect' },
    { exe: 'ubisoftconnect', label: 'Ubisoft Connect' },
    { exe: 'eadesktop', label: 'EA App' },
    { exe: 'ealauncher', label: 'EA Launcher' },
    { exe: 'eabackgroundservice', label: 'EA Background Service' },
    { exe: 'gog_galaxy', label: 'GOG Galaxy' },
    { exe: 'galaxyclient', label: 'GOG Galaxy Client' },
    { exe: 'battlenet', label: 'Battle.net' },
    { exe: 'riotclientservices', label: 'Riot Client' },
    { exe: 'riotclientux', label: 'Riot Client UX' }
  ],
  windowsApps: [
    { exe: 'widgets', label: 'Windows Widgets' },
    { exe: 'widgetservice', label: 'Windows Widget Service' },
    { exe: 'onedrive', label: 'Microsoft OneDrive' },
    { exe: 'phoneexperiencehost', label: 'Phone Link' },
    { exe: 'yourphone', label: 'Phone Link' },
    { exe: 'copilot', label: 'Microsoft Copilot' },
    { exe: 'clipchamp', label: 'Clipchamp' },
    { exe: 'microsoft.photos', label: 'Microsoft Photos' },
    { exe: 'video.ui', label: 'Media Player' },
    { exe: 'calculatorapp', label: 'Calculator' },
    { exe: 'cortana', label: 'Cortana' },
    { exe: 'skypeapp', label: 'Windows Skype' },
    { exe: 'gamebarpresencewriter', label: 'Xbox Game Bar Presence Writer' },
    { exe: 'acrotray', label: 'Adobe Acrobat Tray' },
    { exe: 'ccxprocess', label: 'Adobe Creative Cloud Helper' },
    { exe: 'creative cloud', label: 'Adobe Creative Cloud' },
    { exe: 'qbittorrent', label: 'qBittorrent' },
    { exe: 'utorrent', label: 'uTorrent' },
    { exe: 'idm', label: 'Internet Download Manager' },
    { exe: 'wallpaper32', label: 'Wallpaper Engine (32-bit)' },
    { exe: 'wallpaper64', label: 'Wallpaper Engine (64-bit)' },
    { exe: 'lively', label: 'Lively Wallpaper' }
  ]
};

// Bloat/background helpers that should never be auto-restarted on game exit
const NON_RESTORABLE_HELPERS = new Set([
  'widgets', 'widgetservice', 'phoneexperiencehost', 'yourphone', 'copilot',
  'cortana', 'gamebarpresencewriter', 'epicwebhelper', 'riotclientux',
  'eabackgroundservice', 'ccxprocess', 'acrotray', 'calculatorapp',
  'microsoft.photos', 'video.ui', 'skypeapp', 'clipchamp'
]);

function parseTasklistCsvPids(csvText, exeNameSet) {
  const pids = [];
  if (!csvText || !exeNameSet || exeNameSet.size === 0) return pids;
  for (const line of String(csvText).split(/\r?\n/)) {
    if (!line) continue;
    const cols = line.split('","');
    if (cols.length < 2) continue;
    const img = cols[0].replace(/^"/, '').trim().toLowerCase().replace(/\.exe$/i, '');
    if (!exeNameSet.has(img)) continue;
    const pid = Number(cols[1].replace(/"/g, '').trim());
    if (Number.isFinite(pid) && pid > 0) pids.push({ pid, name: img });
  }
  return pids;
}

/**
 * Creates the cross-PC Windows Game Boost manager instance without heavy runtime
 * C# compilation or working-set page-faulting so frame pacing stays smooth.
 */
function createGameBoostManager(getUserDataDir) {
  let activeBoostState = {
    active: false,
    startedAt: 0,
    gameTitle: '',
    previousPowerSchemeGuid: '',
    appliedPowerSchemeGuid: '',
    powerSchemeName: '',
    previousCoreParkingAc: null,
    coreParkingDisabled: false,
    previousCoreParking1Ac: null,
    coreParking1Disabled: false,
    previousAutoGameMode: undefined,
    gameModeForced: false,
    previousOverlayGuid: '',
    overlaySwitched: false,
    previousToastSetting: undefined,
    toastsSuppressed: false,
    closedApps: [],
    freedMb: 0,
    prioritizedPids: [],
    throttledHelperPids: [],
    gpuConfiguredExes: [],
    hardwareProfile: null
  };

  let inFlightEnablePromise = null;
  let cachedHardwareProfile = null;
  let cachedPowerSchemes = null;
  let powerSchemesCachedAt = 0;
  const knownGpuConfiguredExes = new Set();

  function getJournalPath() {
    return path.join(getUserDataDir(), 'game_boost_journal.json');
  }

  function writeJournal(state) {
    try {
      const p = getJournalPath();
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {}
  }

  function clearJournal() {
    try {
      const p = getJournalPath();
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {}
  }

  function inferGameStore(gameInfo = {}) {
    const store = String(gameInfo.store || '').toLowerCase();
    if (store) return store;
    const uri = String(gameInfo.launchUri || gameInfo.uri || '').toLowerCase();
    if (uri.startsWith('steam://') || /^\d+$/.test(String(gameInfo.appId || ''))) return 'steam';
    if (uri.startsWith('msxbox://') || uri.startsWith('xbox://') || String(gameInfo.id || '').startsWith('xbox_')) return 'xbox';
    if (uri.includes('epicgames') || String(gameInfo.id || '').startsWith('epic_')) return 'epic';
    if (uri.startsWith('uplay://') || String(gameInfo.id || '').startsWith('ubisoft_')) return 'ubisoft';
    if (String(gameInfo.id || '') === 'pc_valorant' || String(gameInfo.execPath || '').toLowerCase().includes('riot')) return 'riot';
    return '';
  }

  function collectActiveGameInfo(options = {}) {
    const activeStore = inferGameStore(options.gameInfo || options);
    const activeGameExes = new Set();
    const candidateExePaths = new Set();

    const addPath = (rawPath) => {
      if (!rawPath || typeof rawPath !== 'string') return;
      const clean = rawPath.trim();
      if (!clean || !clean.toLowerCase().endsWith('.exe')) return;
      activeGameExes.add(path.basename(clean).toLowerCase().replace(/\.exe$/i, ''));
      try {
        if (fs.existsSync(clean)) candidateExePaths.add(path.normalize(clean));
      } catch (e) {}
    };

    addPath(options.gameInfo?.execPath);
    if (Array.isArray(options.gameInfo?.candidateExePaths)) {
      options.gameInfo.candidateExePaths.forEach(addPath);
    }
    if (Array.isArray(options.candidateExePaths)) {
      options.candidateExePaths.forEach(addPath);
    }
    if (Array.isArray(options.targetExes)) {
      options.targetExes.forEach(e => {
        activeGameExes.add(String(e || '').toLowerCase().replace(/\.exe$/i, ''));
      });
    }

    return {
      activeStore,
      activeGameExes,
      candidateExePaths: [...candidateExePaths]
    };
  }

  function buildTargetCloseList(options = {}) {
    const closeBrowsers = options.boostCloseBrowsers !== false;
    const closeChatMedia = options.boostCloseChatMedia !== false;
    const closeUnusedLaunchers = options.boostCloseUnusedLaunchers !== false;
    const closeWindowsApps = options.boostCloseWindowsApps !== false;
    const userExcluded = new Set(
      (Array.isArray(options.boostExcludedApps) ? options.boostExcludedApps : [])
        .map(s => String(s || '').toLowerCase().replace(/\.exe$/i, ''))
    );

    const { activeStore, activeGameExes } = collectActiveGameInfo(options);
    const activeStoreProtected = new Set(STORE_RUNTIME_PROCESSES[activeStore] || []);
    const candidates = [];
    const seenExe = new Set();

    const addGroup = (groupKey, items) => {
      for (const item of items) {
        const exe = item.exe.toLowerCase();
        if (seenExe.has(exe)) continue;
        if (PROTECTED_PROCESSES.has(exe)) continue;
        if (activeStoreProtected.has(exe)) continue;
        if (activeGameExes.has(exe)) continue;
        if (userExcluded.has(exe)) continue;
        seenExe.add(exe);
        candidates.push({ ...item, exe, category: groupKey });
      }
    };

    if (closeBrowsers) addGroup('browsers', BOOST_APP_CATALOG.browsers);
    if (closeChatMedia) addGroup('chatMedia', BOOST_APP_CATALOG.chatMedia);
    if (closeUnusedLaunchers) addGroup('unusedLaunchers', BOOST_APP_CATALOG.unusedLaunchers);
    if (closeWindowsApps) addGroup('windowsApps', BOOST_APP_CATALOG.windowsApps);

    return candidates;
  }

  async function detectHardwareProfile(forceRefresh = false) {
    if (cachedHardwareProfile && !forceRefresh) return cachedHardwareProfile;
    const cpus = os.cpus() || [];
    const cpuModel = String(cpus[0]?.model || 'Unknown CPU').trim();
    const cpuLow = cpuModel.toLowerCase();
    const cpuVendor = (cpuLow.includes('amd') || cpuLow.includes('ryzen'))
      ? 'amd'
      : (cpuLow.includes('intel') ? 'intel' : 'other');

    const gpuAdapters = [];
    const gpuVendors = new Set();
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync(
          'reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}" /s /v DriverDesc',
          { windowsHide: true, timeout: 2500 }
        );
        for (const line of String(stdout || '').split(/\r?\n/)) {
          const m = line.match(/DriverDesc\s+REG_SZ\s+(.+)/i);
          if (!m) continue;
          const desc = m[1].trim();
          const dLow = desc.toLowerCase();
          if (dLow.includes('virtual') || dLow.includes('basic display')) continue;
          gpuAdapters.push(desc);
          if (dLow.includes('nvidia') || dLow.includes('geforce') || dLow.includes('rtx') || dLow.includes('gtx')) gpuVendors.add('nvidia');
          if (dLow.includes('amd') || dLow.includes('radeon')) gpuVendors.add('amd');
          if (dLow.includes('intel')) gpuVendors.add('intel');
        }
      } catch (e) {}
    }

    const isRyzen = cpuVendor === 'amd' && /ryzen|threadripper|epyc/i.test(cpuModel);
    const isIntelHybrid = cpuVendor === 'intel' && (/core.*ultra|i[3579]-1[2-9]\d{2}|1[2-9]th gen/i.test(cpuModel) || cpus.length >= 12);
    const hasNvidia = gpuVendors.has('nvidia');
    const hasAmdGpu = gpuVendors.has('amd');
    const hasIntelGpu = gpuVendors.has('intel');
    const discreteGpuVendor = hasNvidia ? 'nvidia' : (hasAmdGpu ? 'amd' : (hasIntelGpu ? 'intel' : 'other'));
    const isHybridGpu = gpuAdapters.length >= 2 || (hasIntelGpu && (hasNvidia || hasAmdGpu)) || (hasAmdGpu && hasNvidia);

    cachedHardwareProfile = {
      cpuVendor,
      cpuModel,
      logicalCores: cpus.length || 0,
      isRyzen,
      isIntelHybrid,
      gpuVendors: [...gpuVendors],
      gpuAdapters,
      discreteGpuVendor,
      isHybridGpu
    };
    return cachedHardwareProfile;
  }

  async function listPowerSchemes(useCache = false) {
    if (useCache && cachedPowerSchemes && Date.now() - powerSchemesCachedAt < 15000) {
      return cachedPowerSchemes;
    }
    try {
      const { stdout } = await execAsync('powercfg /list', { windowsHide: true, timeout: 3000 });
      const schemes = [];
      const lineRegex = /Power Scheme GUID:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*\(([^)]+)\)\s*(\*)?/ig;
      let match;
      while ((match = lineRegex.exec(stdout)) !== null) {
        schemes.push({
          guid: match[1].toLowerCase(),
          name: match[2].trim(),
          isActive: Boolean(match[3])
        });
      }
      cachedPowerSchemes = schemes;
      powerSchemesCachedAt = Date.now();
      return schemes;
    } catch (e) {
      return cachedPowerSchemes || [];
    }
  }

  async function warmupSystemProfile() {
    if (process.platform !== 'win32') return null;
    const [hw, schemes] = await Promise.all([
      detectHardwareProfile(false),
      listPowerSchemes(false)
    ]);
    return { hardwareProfile: hw, schemeCount: schemes.length };
  }

  async function getActivePowerSchemeInfo() {
    const schemes = await listPowerSchemes(true);
    const active = schemes.find(s => s.isActive);
    if (active) return active;
    try {
      const { stdout } = await execAsync('powercfg /getactivescheme', { windowsHide: true, timeout: 3000 });
      const m = stdout.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*\(([^)]+)\)?/i);
      if (m) return { guid: m[1].toLowerCase(), name: (m[2] || '').trim(), isActive: true };
    } catch (e) {}
    return { guid: '', name: '', isActive: true };
  }

  async function setPowerSchemeGuid(guid) {
    if (!guid || !/^[0-9a-f-]{36}$/i.test(guid)) return false;
    try {
      await execAsync(`powercfg /setactive ${guid}`, { windowsHide: true, timeout: 3000 });
      cachedPowerSchemes = null;
      return true;
    } catch (e) {
      return false;
    }
  }

  function pickBestBoostScheme(schemes, hwProfile = null) {
    if (!Array.isArray(schemes) || schemes.length === 0) return null;
    const isAmdCpu = hwProfile?.cpuVendor === 'amd';
    return (
      schemes.find(s => s.guid === POWER_SCHEME_ULTIMATE) ||
      schemes.find(s => /\bturbo\b/i.test(s.name)) ||
      (isAmdCpu ? schemes.find(s => /ryzen.*high\s*performance/i.test(s.name)) : null) ||
      schemes.find(s => s.guid === POWER_SCHEME_HIGH_PERFORMANCE) ||
      schemes.find(s => /(high performance|ultimate|bitsum|\bperformance\b)/i.test(s.name) && !/(balanced|silent|saver)/i.test(s.name)) ||
      (isAmdCpu ? schemes.find(s => /ryzen.*balanced/i.test(s.name)) : null) ||
      null
    );
  }

const CPMINCORES1_GUID = '0cc5b647-c1df-4637-891a-dec35c318584';
const BEST_PERFORMANCE_OVERLAY_GUID = 'ded574b5-45a0-4f42-8737-46345c09c238';

  async function getCoreParkingAcIndex(guid, settingGuid = CPMINCORES_GUID) {
    if (!guid || !/^[0-9a-f-]{36}$/i.test(guid)) return null;
    try {
      const { stdout } = await execAsync(`powercfg /query ${guid} ${SUB_PROCESSOR_GUID} ${settingGuid}`, {
        windowsHide: true,
        timeout: 3000
      });
      const m = stdout.match(/Current AC Power Setting Index:\s*0x([0-9a-f]+)/i);
      return m ? parseInt(m[1], 16) : null;
    } catch (e) {
      return null;
    }
  }

  async function setCoreParkingAcIndex(guid, percent, settingGuid = CPMINCORES_GUID) {
    if (!guid || !/^[0-9a-f-]{36}$/i.test(guid) || !Number.isFinite(Number(percent))) return false;
    try {
      await execAsync(`powercfg /setacvalueindex ${guid} ${SUB_PROCESSOR_GUID} ${settingGuid} ${Math.max(0, Math.min(100, Math.round(percent)))}`, {
        windowsHide: true,
        timeout: 3000
      });
      await execAsync(`powercfg /setactive ${guid}`, { windowsHide: true, timeout: 3000 });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function switchPowerOverlayScheme(targetGuid) {
    if (process.platform !== 'win32' || !targetGuid || !/^[0-9a-f-]{36}$/i.test(targetGuid)) {
      return { switched: false, previousGuid: '' };
    }
    try {
      const script = `
        $sig = '[DllImport("powrprof.dll")] public static extern uint PowerGetActualOverlayScheme(out Guid g); [DllImport("powrprof.dll")] public static extern uint PowerSetActiveOverlayScheme(Guid g);'
        $t = Add-Type -MemberDefinition $sig -Name 'PowrOverlayHelper' -Namespace 'Win32' -PassThru -ErrorAction SilentlyContinue
        if (-not $t) { $t = [Win32.PowrOverlayHelper] }
        $prev = [Guid]::Empty
        $rc1 = $t::PowerGetActualOverlayScheme([ref]$prev)
        $target = [Guid]::Parse('${targetGuid}')
        $rc2 = 1
        if ($rc1 -eq 0 -and $prev -ne $target) {
          $rc2 = $t::PowerSetActiveOverlayScheme($target)
        }
        [PSCustomObject]@{ rcGet = $rc1; prev = $prev.ToString(); rcSet = $rc2 } | ConvertTo-Json -Compress
      `;
      const res = await runPowershellJson(script);
      if (res && res.rcGet === 0 && res.prev && res.rcSet === 0 && res.prev.toLowerCase() !== targetGuid.toLowerCase()) {
        return { switched: true, previousGuid: res.prev.toLowerCase() };
      }
      return { switched: false, previousGuid: res?.prev ? String(res.prev).toLowerCase() : '' };
    } catch (e) {
      return { switched: false, previousGuid: '' };
    }
  }

  async function queryRegDword(keyPath, valueName) {
    try {
      const { stdout } = await execAsync(`reg query "${keyPath}" /v "${valueName}"`, { windowsHide: true, timeout: 2000 });
      const m = stdout.match(/REG_DWORD\s+0x([0-9a-f]+)/i);
      return m ? parseInt(m[1], 16) : null;
    } catch (e) {
      return null;
    }
  }

  async function setRegDword(keyPath, valueName, value) {
    try {
      await execAsync(`reg add "${keyPath}" /v "${valueName}" /t REG_DWORD /d ${Number(value)} /f`, {
        windowsHide: true,
        timeout: 2500
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function deleteRegValue(keyPath, valueName) {
    try {
      await execAsync(`reg delete "${keyPath}" /v "${valueName}" /f`, { windowsHide: true, timeout: 2500 });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function getGraphicsHealthStatus(activeSchemeOverride = null) {
    const hw = await detectHardwareProfile(false);
    if (process.platform !== 'win32') {
      return {
        hagsState: 'unknown',
        hagsEnabled: false,
        gameModeEnabled: true,
        powerPlanName: '',
        hardwareProfile: hw,
        freeRamMb: Math.round(os.freemem() / 1048576),
        totalRamMb: Math.round(os.totalmem() / 1048576)
      };
    }

    const [hwSchVal, gameModeVal, schemeInfo] = await Promise.all([
      queryRegDword('HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers', 'HwSchMode'),
      queryRegDword('HKCU\\Software\\Microsoft\\GameBar', 'AllowAutoGameMode'),
      activeSchemeOverride ? Promise.resolve(activeSchemeOverride) : getActivePowerSchemeInfo()
    ]);

    const hagsState = hwSchVal === 2 ? 'enabled' : (hwSchVal === 1 ? 'disabled' : 'default');
    return {
      hagsState,
      hagsEnabled: hwSchVal === 2,
      gameModeEnabled: gameModeVal !== 0,
      powerPlanName: schemeInfo?.name || '',
      powerSchemeGuid: schemeInfo?.guid || '',
      hardwareProfile: hw,
      freeRamMb: Math.round(os.freemem() / 1048576),
      totalRamMb: Math.round(os.totalmem() / 1048576)
    };
  }

  async function runPowershellJson(script) {
    const fullScript = `$ProgressPreference = 'SilentlyContinue'\n${script}`;
    const encoded = Buffer.from(fullScript, 'utf16le').toString('base64');
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
      { windowsHide: true, timeout: 8000, maxBuffer: 1024 * 1024 }
    );
    const trimmed = String(stdout || '').trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      const idxObj = trimmed.lastIndexOf('{');
      const idxArr = trimmed.lastIndexOf('[');
      const start = Math.max(idxObj, idxArr);
      if (start >= 0) {
        return JSON.parse(trimmed.slice(start));
      }
      throw e;
    }
  }

  async function restoreToastNotifications(previousToastSetting) {
    const toastKey = 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings';
    if (previousToastSetting === null) {
      await deleteRegValue(toastKey, 'NOC_GLOBAL_SETTING_TOASTS_ENABLED');
      return true;
    }
    if (previousToastSetting === 0 || previousToastSetting === 1) {
      return setRegDword(toastKey, 'NOC_GLOBAL_SETTING_TOASTS_ENABLED', previousToastSetting);
    }
    return false;
  }

  async function restoreAutoGameMode(previousAutoGameMode) {
    const gameBarKey = 'HKCU\\Software\\Microsoft\\GameBar';
    if (previousAutoGameMode === null) {
      await deleteRegValue(gameBarKey, 'AllowAutoGameMode');
      return true;
    }
    if (previousAutoGameMode === 0 || previousAutoGameMode === 1) {
      return setRegDword(gameBarKey, 'AllowAutoGameMode', previousAutoGameMode);
    }
    return false;
  }

  async function restoreSystemAntiStutterState(state = {}) {
    let restoredPower = false;
    const prevGuid = state.previousPowerSchemeGuid || '';
    const appliedGuid = state.appliedPowerSchemeGuid || '';

    if (state.coreParkingDisabled && state.previousCoreParkingAc !== null && Number.isFinite(state.previousCoreParkingAc)) {
      const targetPlan = appliedGuid || prevGuid;
      if (targetPlan) {
        await setCoreParkingAcIndex(targetPlan, state.previousCoreParkingAc, CPMINCORES_GUID).catch(() => {});
      }
    }

    if (state.coreParking1Disabled && state.previousCoreParking1Ac !== null && Number.isFinite(state.previousCoreParking1Ac)) {
      const targetPlan = appliedGuid || prevGuid;
      if (targetPlan) {
        await setCoreParkingAcIndex(targetPlan, state.previousCoreParking1Ac, CPMINCORES1_GUID).catch(() => {});
      }
    }

    if (state.overlaySwitched && state.previousOverlayGuid) {
      await switchPowerOverlayScheme(state.previousOverlayGuid).catch(() => {});
    }

    if (prevGuid && prevGuid !== appliedGuid) {
      restoredPower = await setPowerSchemeGuid(prevGuid);
    }

    if (state.gameModeForced) {
      await restoreAutoGameMode(state.previousAutoGameMode).catch(() => {});
    }

    if (state.toastsSuppressed) {
      await restoreToastNotifications(state.previousToastSetting).catch(() => {});
    }

    const normalVal = os.constants?.priority?.PRIORITY_NORMAL ?? 0;
    for (const p of state.prioritizedPids || []) {
      try { os.setPriority(p, normalVal); } catch (e) {}
    }

    for (const entry of state.throttledHelperPids || []) {
      if (!entry || !entry.pid) continue;
      try {
        os.setPriority(entry.pid, Number.isFinite(entry.prev) ? entry.prev : normalVal);
      } catch (e) {}
    }

    return restoredPower;
  }

  async function getRunningBoostCandidates(options = {}) {
    const hw = await detectHardwareProfile(false);
    if (process.platform !== 'win32') {
      return {
        candidates: [],
        totalRamMb: 0,
        powerSchemeGuid: '',
        powerSchemeName: '',
        active: activeBoostState.active,
        hardwareProfile: hw,
        graphicsHealth: await getGraphicsHealthStatus()
      };
    }

    const targetList = buildTargetCloseList(options);
    const targetMap = new Map(targetList.map(t => [t.exe, t]));
    const names = [...targetMap.keys()];
    const schemes = await listPowerSchemes(true);
    const schemeInfo = schemes.find(s => s.isActive) || await getActivePowerSchemeInfo();

    if (names.length === 0) {
      const graphicsHealth = await getGraphicsHealthStatus(schemeInfo);
      return {
        candidates: [],
        totalRamMb: 0,
        powerSchemeGuid: schemeInfo.guid,
        powerSchemeName: schemeInfo.name,
        active: activeBoostState.active,
        closedApps: activeBoostState.closedApps,
        freedMb: activeBoostState.freedMb,
        hardwareProfile: hw,
        graphicsHealth
      };
    }

    const psNames = names.map(n => `'${n.replace(/'/g, "''")}'`).join(',');
    const psScript = `
      $ErrorActionPreference = 'SilentlyContinue'
      $targets = @(${psNames})
      $sess = [System.Diagnostics.Process]::GetCurrentProcess().SessionId
      $procs = Get-Process | Where-Object { $_.SessionId -eq $sess -and $targets -contains $_.ProcessName.ToLower() }
      $grouped = $procs | Group-Object { $_.ProcessName.ToLower() } | ForEach-Object {
        $mem = [math]::Round((($_.Group | Measure-Object WorkingSet64 -Sum).Sum) / 1MB, 1)
        $first = $_.Group | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
        if (-not $first) { $first = $_.Group | Select-Object -First 1 }
        $exePath = ''
        try { $exePath = $first.MainModule.FileName } catch {}
        [PSCustomObject]@{
          exe = $_.Name
          count = $_.Count
          ramMb = $mem
          exePath = $exePath
        }
      }
      if (-not $grouped) { '[]' } else { ConvertTo-Json -InputObject @($grouped) -Compress }
    `;

    try {
      const [rows, graphicsHealth] = await Promise.all([
        runPowershellJson(psScript).catch(() => []),
        getGraphicsHealthStatus(schemeInfo)
      ]);
      const items = (Array.isArray(rows) ? rows : []).map(r => {
        const meta = targetMap.get(String(r.exe || '').toLowerCase()) || {};
        return {
          exe: String(r.exe || '').toLowerCase(),
          label: meta.label || r.exe,
          category: meta.category || 'other',
          count: Number(r.count || 1),
          ramMb: Number(r.ramMb || 0),
          exePath: r.exePath || ''
        };
      }).sort((a, b) => b.ramMb - a.ramMb);

      const totalRamMb = Math.round(items.reduce((acc, it) => acc + it.ramMb, 0) * 10) / 10;
      return {
        candidates: items,
        totalRamMb,
        powerSchemeGuid: schemeInfo.guid,
        powerSchemeName: schemeInfo.name,
        active: activeBoostState.active,
        closedApps: activeBoostState.closedApps,
        freedMb: activeBoostState.freedMb,
        hardwareProfile: hw,
        graphicsHealth
      };
    } catch (e) {
      return {
        candidates: [],
        totalRamMb: 0,
        powerSchemeGuid: schemeInfo.guid,
        powerSchemeName: schemeInfo.name,
        active: activeBoostState.active,
        hardwareProfile: hw,
        graphicsHealth: await getGraphicsHealthStatus(schemeInfo)
      };
    }
  }

  /**
   * Registers game executables under Windows DirectX High Performance GPU preference (GpuPreference=2;),
   * assigning discrete NVIDIA / AMD Radeon / Intel Arc GPU over integrated graphics.
   */
  async function applyHighPerfGpuPreferences(exePaths = []) {
    if (process.platform !== 'win32' || !Array.isArray(exePaths) || exePaths.length === 0) return [];
    const validPaths = [...new Set(
      exePaths
        .map(p => String(p || '').trim())
        .filter(p => p && p.toLowerCase().endsWith('.exe') && !knownGpuConfiguredExes.has(path.normalize(p)) && fs.existsSync(p))
        .map(p => path.normalize(p))
    )];
    if (validPaths.length === 0) return [];

    const regPath = 'HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences';
    const configured = [];
    for (const fullExe of validPaths) {
      try {
        await execAsync(`reg add "${regPath}" /v "${fullExe}" /t REG_SZ /d "GpuPreference=2;" /f`, {
          windowsHide: true,
          timeout: 2000
        });
        knownGpuConfiguredExes.add(fullExe);
        configured.push(fullExe);
      } catch (e) {}
    }
    return configured;
  }

  async function runEnableGameBoostInternal(options = {}) {
    if (process.platform !== 'win32') {
      return { success: true, active: false, closedApps: [], freedMb: 0, note: 'Boost is Windows-only.' };
    }

    const dryRun = Boolean(options.dryRun);
    const shouldCloseApps = options.boostAutoCloseApps !== false;
    const shouldBoostPower = options.boostHighPerformancePower !== false;
    const antiStutterEnabled = options.boostAntiStutter !== false;
    const shouldThrottleHelpers = antiStutterEnabled && options.boostThrottleHelpers !== false;
    const shouldForceGpu = options.boostForceHighPerfGpu !== false;
    const shouldSuppressPopups = antiStutterEnabled && options.boostSuppressPopups !== false;
    const gameTitle = options.gameInfo?.title || options.title || 'Active Game';
    const { candidateExePaths } = collectActiveGameInfo(options);
    const hwProfile = await detectHardwareProfile(false);

    const result = {
      success: true,
      active: !dryRun,
      dryRun,
      gameTitle,
      hardwareProfile: hwProfile,
      closedApps: [],
      freedMb: 0,
      powerSwitched: false,
      previousPowerSchemeGuid: activeBoostState.previousPowerSchemeGuid || '',
      appliedPowerSchemeGuid: '',
      powerSchemeName: '',
      previousCoreParkingAc: null,
      coreParkingDisabled: false,
      previousCoreParking1Ac: null,
      coreParking1Disabled: false,
      previousAutoGameMode: undefined,
      gameModeForced: false,
      previousOverlayGuid: '',
      overlaySwitched: false,
      previousToastSetting: undefined,
      toastsSuppressed: false,
      throttledHelperPids: [],
      throttledHelperCount: 0,
      gpuConfiguredExes: []
    };

    const fastTasks = [];

    if (shouldBoostPower) {
      fastTasks.push((async () => {
        const schemes = await listPowerSchemes(true);
        const activeScheme = schemes.find(s => s.isActive) || await getActivePowerSchemeInfo();
        const currentScheme = activeBoostState.previousPowerSchemeGuid || activeScheme.guid;
        const targetScheme = pickBestBoostScheme(schemes, hwProfile);
        result.previousPowerSchemeGuid = currentScheme;
        result.powerSchemeName = targetScheme?.name || activeScheme.name || '';

        if (targetScheme && targetScheme.guid && targetScheme.guid !== currentScheme) {
          if (!dryRun) {
            const ok = await setPowerSchemeGuid(targetScheme.guid);
            if (ok) {
              result.powerSwitched = true;
              result.appliedPowerSchemeGuid = targetScheme.guid;
            }
          } else {
            result.appliedPowerSchemeGuid = targetScheme.guid;
          }
        } else {
          result.appliedPowerSchemeGuid = currentScheme;
        }

        // On Modern Standby AMD Ryzen / Intel laptops that only expose Balanced, switch Windows Power Mode Overlay to Best Performance
        if (!dryRun && !result.powerSwitched) {
          const overlayRes = await switchPowerOverlayScheme(BEST_PERFORMANCE_OVERLAY_GUID).catch(() => null);
          if (overlayRes?.switched) {
            result.overlaySwitched = true;
            result.previousOverlayGuid = activeBoostState.overlaySwitched
              ? activeBoostState.previousOverlayGuid
              : overlayRes.previousGuid;
          }
        }

        if (antiStutterEnabled && !dryRun && result.appliedPowerSchemeGuid) {
          const prevAc = await getCoreParkingAcIndex(result.appliedPowerSchemeGuid, CPMINCORES_GUID);
          if (prevAc !== null && prevAc < 100) {
            const unparked = await setCoreParkingAcIndex(result.appliedPowerSchemeGuid, 100, CPMINCORES_GUID);
            if (unparked) {
              result.previousCoreParkingAc = prevAc;
              result.coreParkingDisabled = true;
            }
          }
          // Also unpark Class 1 / heterogeneous cores on Intel Hybrid (P+E) and AMD Ryzen systems when exposed by plan
          if (hwProfile?.isIntelHybrid || hwProfile?.isRyzen) {
            const prevAc1 = await getCoreParkingAcIndex(result.appliedPowerSchemeGuid, CPMINCORES1_GUID);
            if (prevAc1 !== null && prevAc1 < 100) {
              const unparked1 = await setCoreParkingAcIndex(result.appliedPowerSchemeGuid, 100, CPMINCORES1_GUID);
              if (unparked1) {
                result.previousCoreParking1Ac = prevAc1;
                result.coreParking1Disabled = true;
              }
            }
          }
        }
      })());
    }

    // Ensure Windows Game Mode is active (critical for AMD Ryzen CCD/V-Cache & Intel Thread Director P-core scheduling)
    if (!dryRun && antiStutterEnabled) {
      fastTasks.push((async () => {
        const gameBarKey = 'HKCU\\Software\\Microsoft\\GameBar';
        const prevGm = activeBoostState.gameModeForced
          ? activeBoostState.previousAutoGameMode
          : await queryRegDword(gameBarKey, 'AllowAutoGameMode');
        if (prevGm !== 1) {
          const ok = await setRegDword(gameBarKey, 'AllowAutoGameMode', 1);
          if (ok) {
            result.previousAutoGameMode = prevGm;
            result.gameModeForced = true;
          }
        }
      })());
    }

    if (!dryRun && shouldSuppressPopups) {
      fastTasks.push((async () => {
        const toastKey = 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings';
        const prevToast = activeBoostState.toastsSuppressed
          ? activeBoostState.previousToastSetting
          : await queryRegDword(toastKey, 'NOC_GLOBAL_SETTING_TOASTS_ENABLED');
        const ok = await setRegDword(toastKey, 'NOC_GLOBAL_SETTING_TOASTS_ENABLED', 0);
        if (ok) {
          result.previousToastSetting = prevToast;
          result.toastsSuppressed = true;
        }
      })());
    }

    if (!dryRun && shouldForceGpu && candidateExePaths.length > 0) {
      fastTasks.push((async () => {
        result.gpuConfiguredExes = await applyHighPerfGpuPreferences(candidateExePaths);
      })());
    }

    // Close genuinely unused background apps via native PS (NO Add-Type C# compile, NO EmptyWorkingSet page faults)
    const targetList = shouldCloseApps ? buildTargetCloseList(options) : [];
    const targetMap = new Map(targetList.map(t => [t.exe, t]));
    const closeNames = [...targetMap.keys()];
    const browserNames = closeNames.filter(n => BROWSER_EXE_SET.has(n));

    if (closeNames.length > 0) {
      const psCloseNames = closeNames.map(n => `'${n.replace(/'/g, "''")}'`).join(',');
      const psBrowserNames = browserNames.map(n => `'${n.replace(/'/g, "''")}'`).join(',');

      const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        $closeTargets = @(${psCloseNames})
        $browserTargets = @(${psBrowserNames})
        $dry = ${dryRun ? '$true' : '$false'}
        $sess = [System.Diagnostics.Process]::GetCurrentProcess().SessionId
        $closeProcs = @(Get-Process | Where-Object { $_.SessionId -eq $sess -and $closeTargets -contains $_.ProcessName.ToLower() })
        $report = @()
        if ($closeProcs.Count -gt 0) {
          $hasBrowserWindow = $false
          if (-not $dry) {
            foreach ($p in $closeProcs) {
              try {
                if ($p.MainWindowHandle -ne 0) {
                  $null = $p.CloseMainWindow()
                  if ($browserTargets -contains $p.ProcessName.ToLower()) { $hasBrowserWindow = $true }
                }
              } catch {}
            }
            Start-Sleep -Milliseconds $(if ($hasBrowserWindow) { 260 } else { 100 })
          }
          foreach ($grp in ($closeProcs | Group-Object { $_.ProcessName.ToLower() })) {
            $exeKey = $grp.Name
            $ramMb = [math]::Round((($grp.Group | Measure-Object WorkingSet64 -Sum).Sum) / 1MB, 1)
            $exePath = ''
            foreach ($p in $grp.Group) {
              if (-not $exePath) { try { $exePath = $p.MainModule.FileName } catch {} }
            }
            $closedCount = 0
            if (-not $dry) {
              foreach ($p in $grp.Group) {
                try {
                  if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
                  $closedCount++
                } catch {}
              }
            } else {
              $closedCount = $grp.Count
            }
            if ($closedCount -gt 0) {
              $report += [PSCustomObject]@{ exe = $exeKey; count = $closedCount; ramMb = $ramMb; exePath = $exePath }
            }
          }
        }
        if ($report.Count -eq 0) { '[]' } else { ConvertTo-Json -InputObject @($report) -Compress }
      `;

      fastTasks.push((async () => {
        try {
          const rows = await runPowershellJson(psScript).catch(() => []);
          const items = (Array.isArray(rows) ? rows : []).map(r => {
            const key = String(r.exe || '').toLowerCase();
            const meta = targetMap.get(key) || {};
            return {
              exe: key,
              label: meta.label || r.exe,
              category: meta.category || 'other',
              count: Number(r.count || 1),
              ramMb: Number(r.ramMb || 0),
              exePath: r.exePath || '',
              restorable: Boolean(r.exePath && !NON_RESTORABLE_HELPERS.has(key) && (meta.category === 'chatMedia' || meta.category === 'browsers'))
            };
          });
          result.closedApps = items;
          result.freedMb = Math.round(items.reduce((sum, x) => sum + x.ramMb, 0) * 10) / 10;
        } catch (e) {}
      })());
    }

    // Native tasklist + Node os.setPriority for pure background OS indexers (zero PowerShell compile overhead)
    if (!dryRun && shouldThrottleHelpers) {
      fastTasks.push((async () => {
        try {
          const helperSet = new Set(Object.keys(HELPER_THROTTLE_TARGETS));
          const { stdout } = await execFileAsync('tasklist.exe', ['/FO', 'CSV', '/NH'], { windowsHide: true, timeout: 2500 });
          const matched = parseTasklistCsvPids(stdout, helperSet);
          for (const h of matched) {
            const targetPrio = HELPER_THROTTLE_TARGETS[h.name];
            if (!Number.isFinite(targetPrio)) continue;
            try {
              const prevPrio = os.getPriority(h.pid);
              if (prevPrio < targetPrio) {
                os.setPriority(h.pid, targetPrio);
                result.throttledHelperPids.push({ pid: h.pid, name: h.name, prev: prevPrio });
              }
            } catch (e) {}
          }
          result.throttledHelperCount = result.throttledHelperPids.length;
        } catch (e) {}
      })());
    }

    await Promise.all(fastTasks);

    if (!dryRun) {
      activeBoostState = {
        active: true,
        startedAt: Date.now(),
        gameTitle,
        hardwareProfile: hwProfile,
        previousPowerSchemeGuid: result.previousPowerSchemeGuid,
        appliedPowerSchemeGuid: result.appliedPowerSchemeGuid,
        powerSchemeName: result.powerSchemeName,
        previousCoreParkingAc: result.previousCoreParkingAc,
        coreParkingDisabled: result.coreParkingDisabled,
        previousCoreParking1Ac: result.previousCoreParking1Ac,
        coreParking1Disabled: result.coreParking1Disabled,
        previousAutoGameMode: result.previousAutoGameMode,
        gameModeForced: result.gameModeForced,
        previousOverlayGuid: result.previousOverlayGuid,
        overlaySwitched: result.overlaySwitched,
        previousToastSetting: result.previousToastSetting,
        toastsSuppressed: result.toastsSuppressed,
        closedApps: result.closedApps,
        freedMb: result.freedMb,
        prioritizedPids: [],
        throttledHelperPids: result.throttledHelperPids,
        gpuConfiguredExes: result.gpuConfiguredExes
      };
      writeJournal(activeBoostState);
    }

    return result;
  }

  async function enableGameBoost(options = {}) {
    if (options?.dryRun) {
      return runEnableGameBoostInternal(options);
    }
    if (inFlightEnablePromise) {
      return inFlightEnablePromise;
    }
    inFlightEnablePromise = runEnableGameBoostInternal(options).finally(() => {
      inFlightEnablePromise = null;
    });
    return inFlightEnablePromise;
  }

  /**
   * Elevates running game PIDs to ABOVE_NORMAL CPU priority using pure native Node + tasklist.exe
   * (zero PowerShell/Add-Type spikes; avoids PRIORITY_HIGH starvation of DWM, audio, and input).
   */
  async function boostGameProcessPriority({ pid = null, targetExes = [] } = {}) {
    if (inFlightEnablePromise) {
      await inFlightEnablePromise.catch(() => {});
    }
    if (process.platform !== 'win32' || !activeBoostState.active) {
      return { updated: 0, pids: [] };
    }

    const pidSet = new Set();
    if (pid && !isNaN(Number(pid))) {
      pidSet.add(Number(pid));
    }

    const cleanNames = new Set(
      (Array.isArray(targetExes) ? targetExes : [])
        .map(e => String(e || '').trim().toLowerCase().replace(/\.exe$/i, ''))
        .filter(Boolean)
    );
    if (cleanNames.size > 0) {
      try {
        const { stdout } = await execFileAsync('tasklist.exe', ['/FO', 'CSV', '/NH'], { windowsHide: true, timeout: 2500 });
        for (const row of parseTasklistCsvPids(stdout, cleanNames)) {
          pidSet.add(row.pid);
        }
      } catch (e) {}
    }

    let updated = 0;
    const aboveNormalVal = os.constants?.priority?.PRIORITY_ABOVE_NORMAL ?? -7;
    for (const p of pidSet) {
      if (!p || activeBoostState.prioritizedPids.includes(p)) continue;
      try {
        os.setPriority(p, aboveNormalVal);
        activeBoostState.prioritizedPids.push(p);
        updated++;
      } catch (e) {}
    }

    return { updated, pids: [...pidSet] };
  }

  async function disableGameBoost(options = {}) {
    if (inFlightEnablePromise) {
      await inFlightEnablePromise.catch(() => {});
    }
    if (process.platform !== 'win32') return { success: true, restoredPower: false, restoredApps: [] };

    let journal = null;
    try {
      const jp = getJournalPath();
      if (fs.existsSync(jp)) {
        journal = JSON.parse(fs.readFileSync(jp, 'utf8'));
      }
    } catch (e) {}

    const stateToRestore = {
      previousPowerSchemeGuid: activeBoostState.previousPowerSchemeGuid || journal?.previousPowerSchemeGuid || '',
      appliedPowerSchemeGuid: activeBoostState.appliedPowerSchemeGuid || journal?.appliedPowerSchemeGuid || '',
      previousCoreParkingAc: activeBoostState.previousCoreParkingAc ?? journal?.previousCoreParkingAc ?? null,
      coreParkingDisabled: Boolean(activeBoostState.coreParkingDisabled ?? journal?.coreParkingDisabled),
      previousCoreParking1Ac: activeBoostState.previousCoreParking1Ac ?? journal?.previousCoreParking1Ac ?? null,
      coreParking1Disabled: Boolean(activeBoostState.coreParking1Disabled ?? journal?.coreParking1Disabled),
      previousAutoGameMode: activeBoostState.gameModeForced
        ? activeBoostState.previousAutoGameMode
        : journal?.previousAutoGameMode,
      gameModeForced: Boolean(activeBoostState.gameModeForced ?? journal?.gameModeForced),
      previousOverlayGuid: activeBoostState.previousOverlayGuid || journal?.previousOverlayGuid || '',
      overlaySwitched: Boolean(activeBoostState.overlaySwitched ?? journal?.overlaySwitched),
      previousToastSetting: activeBoostState.toastsSuppressed
        ? activeBoostState.previousToastSetting
        : journal?.previousToastSetting,
      toastsSuppressed: Boolean(activeBoostState.toastsSuppressed ?? journal?.toastsSuppressed),
      prioritizedPids: activeBoostState.prioritizedPids || [],
      throttledHelperPids: activeBoostState.throttledHelperPids || []
    };

    const closedApps = activeBoostState.closedApps?.length ? activeBoostState.closedApps : (journal?.closedApps || []);
    const restoredPower = await restoreSystemAntiStutterState(stateToRestore);

    const restoredApps = [];
    if (options.restoreClosedApps === true && Array.isArray(closedApps)) {
      for (const appEntry of closedApps) {
        if (!appEntry?.restorable || !appEntry.exePath || !fs.existsSync(appEntry.exePath)) continue;
        try {
          const proc = child_process.spawn(appEntry.exePath, [], {
            cwd: path.dirname(appEntry.exePath),
            detached: true,
            stdio: 'ignore'
          });
          proc.unref();
          restoredApps.push(appEntry.label || appEntry.exe);
        } catch (e) {}
      }
    }

    activeBoostState = {
      active: false,
      startedAt: 0,
      gameTitle: '',
      previousPowerSchemeGuid: '',
      appliedPowerSchemeGuid: '',
      powerSchemeName: '',
      previousCoreParkingAc: null,
      coreParkingDisabled: false,
      previousCoreParking1Ac: null,
      coreParking1Disabled: false,
      previousAutoGameMode: undefined,
      gameModeForced: false,
      previousOverlayGuid: '',
      overlaySwitched: false,
      previousToastSetting: undefined,
      toastsSuppressed: false,
      closedApps: [],
      freedMb: 0,
      prioritizedPids: [],
      throttledHelperPids: [],
      gpuConfiguredExes: [],
      hardwareProfile: cachedHardwareProfile
    };
    clearJournal();

    return {
      success: true,
      active: false,
      restoredPower,
      restoredApps
    };
  }

  async function recoverLeftoverBoostOnStartup() {
    try {
      const jp = getJournalPath();
      if (!fs.existsSync(jp)) return false;
      const journal = JSON.parse(fs.readFileSync(jp, 'utf8'));
      await restoreSystemAntiStutterState(journal || {});
      clearJournal();
      return true;
    } catch (e) {
      clearJournal();
      return false;
    }
  }

  function getCurrentState() {
    return { ...activeBoostState };
  }

  function isActivatingOrActive() {
    return Boolean(activeBoostState.active || inFlightEnablePromise);
  }

  return {
    warmupSystemProfile,
    detectHardwareProfile,
    getRunningBoostCandidates,
    getGraphicsHealthStatus,
    enableGameBoost,
    disableGameBoost,
    boostGameProcessPriority,
    applyHighPerfGpuPreferences,
    recoverLeftoverBoostOnStartup,
    getCurrentState,
    isActivatingOrActive,
    BOOST_APP_CATALOG,
    PROTECTED_PROCESSES
  };
}

module.exports = {
  createGameBoostManager,
  BOOST_APP_CATALOG,
  PROTECTED_PROCESSES
};
