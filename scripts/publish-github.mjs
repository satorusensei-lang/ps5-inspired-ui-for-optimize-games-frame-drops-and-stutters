import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_REPO_OWNER = 'satorusensei-lang';
const DEFAULT_REPO_NAME = 'ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters';
const DEFAULT_REMOTE_URL = `https://github.com/${DEFAULT_REPO_OWNER}/${DEFAULT_REPO_NAME}.git`;
const RELEASE_TAG = 'ps5';
const RELEASE_TITLE = 'ps5(performance and stability enhancer)';

function parseArgs(argv) {
  const args = {
    skipBuild: false,
    skipPush: false,
    skipRelease: false,
    message: ''
  };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--skip-build') args.skipBuild = true;
    else if (token === '--skip-push') args.skipPush = true;
    else if (token === '--skip-release') args.skipRelease = true;
    else if ((token === '--message' || token === '-m') && argv[i + 1]) {
      args.message = argv[++i];
    }
  }
  return args;
}

function run(cmd, cmdArgs, options = {}) {
  const isWinBatch = process.platform === 'win32' && /\.(cmd|bat)$/i.test(cmd);
  const actualCmd = isWinBatch ? 'cmd.exe' : cmd;
  const actualArgs = isWinBatch ? ['/d', '/s', '/c', cmd, ...cmdArgs] : cmdArgs;
  return execFileSync(actualCmd, actualArgs, {
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: options.capture ? 'utf8' : undefined,
    ...options
  });
}

function runNpm(npmArgs) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run(npmCmd, npmArgs);
}

function ensureOriginRemote(remoteUrl) {
  let currentUrl = '';
  try {
    currentUrl = run('git', ['remote', 'get-url', 'origin'], { capture: true }).trim();
  } catch {
    currentUrl = '';
  }
  if (!currentUrl) {
    run('git', ['remote', 'add', 'origin', remoteUrl]);
  } else if (currentUrl !== remoteUrl) {
    run('git', ['remote', 'set-url', 'origin', remoteUrl]);
  }
}

function resolveGitHubToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim();
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();

  try {
    const token = execFileSync('gh', ['auth', 'token'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8'
    }).trim();
    if (token) return token;
  } catch {}

  try {
    const out = execFileSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n',
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' }
    });
    const pwLine = out.split(/\r?\n/).find(line => line.startsWith('password='));
    if (pwLine) return pwLine.slice('password='.length).trim();
  } catch {}

  throw new Error('No GitHub token found. Set GH_TOKEN or sign in with Git Credential Manager (`git credential-manager`) / GitHub CLI (`gh auth login`).');
}

async function githubApi(url, token, options = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'myraa-release-publisher',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 204) return null;
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} on ${url}: ${json?.message || text}`);
  }
  return json;
}

async function uploadReleaseAsset({ uploadBase, filePath, token }) {
  const fileName = path.basename(filePath);
  const stat = fs.statSync(filePath);
  const targetUrl = `${uploadBase}?name=${encodeURIComponent(fileName)}`;
  console.log(`[Release] Uploading ${fileName} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)...`);

  // Use curl.exe streaming upload when available so large 170MB+ EXEs don't hit Node fetch body timeouts
  const curlCmd = process.platform === 'win32' ? 'curl.exe' : 'curl';
  try {
    execFileSync(curlCmd, ['--version'], { stdio: 'ignore' });
    const configLines = [
      `url = "${targetUrl}"`,
      `header = "Authorization: Bearer ${token}"`,
      `header = "Accept: application/vnd.github+json"`,
      `header = "X-GitHub-Api-Version: 2022-11-28"`,
      `header = "User-Agent: myraa-release-publisher"`,
      `header = "Content-Type: application/octet-stream"`,
      `upload-file = "${filePath.replace(/\\/g, '/')}"`
    ].join('\n');

    const responseText = execFileSync(
      curlCmd,
      ['-sS', '-f', '--http1.1', '--retry', '3', '--retry-delay', '3', '-X', 'POST', '-K', '-'],
      {
        input: configLines,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      }
    );
    const uploaded = JSON.parse(responseText || '{}');
    if (!uploaded?.browser_download_url) {
      throw new Error(`Unexpected GitHub upload response for ${fileName}: ${responseText}`);
    }
    return uploaded;
  } catch (curlErr) {
    if (curlErr?.code === 'ENOENT') {
      const buffer = fs.readFileSync(filePath);
      return githubApi(targetUrl, token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(buffer.length)
        },
        body: buffer
      });
    }
    const detail = curlErr?.stderr ? String(curlErr.stderr).trim() : (curlErr?.message || String(curlErr));
    throw new Error(`Upload failed for ${fileName}: ${detail}`);
  }
}

async function upsertReleaseAndUpload({ repoSlug, version, sha, exePath, blockmapPath, token }) {
  const apiBase = `https://api.github.com/repos/${repoSlug}`;
  const commitShort = sha.slice(0, 7);
  const exeName = path.basename(exePath);
  const blockmapName = blockmapPath && fs.existsSync(blockmapPath) ? path.basename(blockmapPath) : '';

  const notes = [
    `Updated Windows x64 installer for **MYRAA v${version}** (commit \`${commitShort}\`).`,
    '',
    '### Included Fixes & Features',
    '- Genuine owned Xbox/Microsoft Store game entitlement verification (removes unowned Game Pass catalog titles, DLC/add-ons, trials, and duplicate platform/launcher cards)',
    '- Strict Steam Favorites-only sync with download progress and pause/resume controls',
    '- Nixxes / multi-stage pre-launcher window readiness & foreground handoff (`Spider-Man Remastered`, `Ghost of Tsushima`, etc.)',
    '- Smooth 120 FPS carousel gliding, unified keyboard (`A`/`D`, Arrow keys, `Home`/`End`) & controller navigation, plus reversible Game Boost & anti-stutter tuning'
  ].join('\n');

  let release = null;
  try {
    release = await githubApi(`${apiBase}/releases/tags/${encodeURIComponent(RELEASE_TAG)}`, token);
  } catch (err) {
    if (!String(err.message).includes(' 404 ')) throw err;
  }

  if (!release) {
    release = await githubApi(`${apiBase}/releases`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: RELEASE_TAG,
        target_commitish: 'main',
        name: RELEASE_TITLE,
        body: notes,
        draft: false,
        prerelease: false
      })
    });
  } else {
    // Clean up any stale installers or mismatched names before uploading the new build
    const existingAssets = Array.isArray(release.assets) ? release.assets : [];
    for (const asset of existingAssets) {
      if (asset.name === exeName || asset.name === blockmapName || /\.(exe|blockmap|zip)$/i.test(asset.name)) {
        await githubApi(`${apiBase}/releases/assets/${asset.id}`, token, { method: 'DELETE' });
      }
    }

    release = await githubApi(`${apiBase}/releases/${release.id}`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: RELEASE_TAG,
        target_commitish: 'main',
        name: RELEASE_TITLE,
        body: notes
      })
    });
  }

  // Ensure the tag ref points to the latest pushed main commit so Releases reflects the newest code
  try {
    await githubApi(`${apiBase}/git/refs/tags/${encodeURIComponent(RELEASE_TAG)}`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha, force: true })
    });
  } catch (e) {
    console.warn(`[Release] Could not fast-forward tag ${RELEASE_TAG} directly:`, e.message);
  }

  const uploadBase = String(release.upload_url || '').replace(/\{.*$/, '');
  const filesToUpload = [exePath];
  if (blockmapName) filesToUpload.push(blockmapPath);

  for (const filePath of filesToUpload) {
    const uploaded = await uploadReleaseAsset({ uploadBase, filePath, token });
    console.log(`[Release] Uploaded asset: ${uploaded.browser_download_url}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const version = pkg.version || '1.0.0';
  const repoSlug = `${DEFAULT_REPO_OWNER}/${DEFAULT_REPO_NAME}`;
  const exePath = path.join(process.cwd(), 'release', `MYRAA-PS5-Setup-${version}.exe`);
  const blockmapPath = `${exePath}.blockmap`;

  ensureOriginRemote(DEFAULT_REMOTE_URL);

  console.log('[Publish] Running project verification checks...');
  runNpm(['run', 'verify:agent']);
  run('node', ['scripts/verify-steam-download-snapshot.mjs']);

  if (!args.skipBuild) {
    console.log('[Publish] Building production bundle & Windows NSIS installer...');
    runNpm(['run', 'dist:win']);
  }

  if (!args.skipPush) {
    run('git', ['add', '-A']);
    const stagedStatus = run('git', ['status', '--porcelain'], { capture: true }).trim();
    if (stagedStatus) {
      const msg = args.message || `chore: sync MYRAA desktop updates & v${version} release config`;
      run('git', ['commit', '-m', msg]);
    }
    console.log('[Publish] Pushing main branch to GitHub origin...');
    run('git', ['push', 'origin', 'main']);
  }

  if (!args.skipRelease) {
    if (!fs.existsSync(exePath)) {
      throw new Error(`Windows installer not found at ${exePath}. Run without --skip-build to generate it.`);
    }
    const headSha = run('git', ['rev-parse', 'HEAD'], { capture: true }).trim();
    const token = resolveGitHubToken();
    await upsertReleaseAndUpload({ repoSlug, version, sha: headSha, exePath, blockmapPath, token });
  }

  console.log('[Publish] GitHub repo and Release synced successfully.');
}

main().catch((err) => {
  console.error('[Publish] Failed:', err.message || err);
  process.exitCode = 1;
});
