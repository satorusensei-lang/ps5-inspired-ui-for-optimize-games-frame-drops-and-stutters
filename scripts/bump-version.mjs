import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const DEFAULT_REPO = 'satorusensei-lang/ps5-inspired-ui-for-optimize-games-frame-drops-and-stutters';
const DEFAULT_RELEASE_TAG = 'ps5';
const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;
const INSTALLER_ASSET_RE = /^MYRAA-PS5-Setup-(\d+\.\d+\.\d+)\.exe$/i;

export function parseSemver(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(SEMVER_RE);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function normalizeSemver(value) {
  const parts = parseSemver(value);
  return parts ? parts.join('.') : null;
}

export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  }
  return 0;
}

export function maxSemver(values) {
  let best = null;
  for (const val of values) {
    const normalized = normalizeSemver(val);
    if (!normalized) continue;
    if (!best || compareSemver(normalized, best) > 0) {
      best = normalized;
    }
  }
  return best;
}

export function bumpPatchVersion(value) {
  const parts = parseSemver(value);
  if (!parts) {
    throw new Error(`Invalid semantic version "${value}". Expected MAJOR.MINOR.PATCH.`);
  }
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

export function extractReleasedExeVersion(assets) {
  if (!Array.isArray(assets)) return null;
  const versions = [];
  for (const asset of assets) {
    const match = String(asset?.name || '').match(INSTALLER_ASSET_RE);
    if (match) versions.push(match[1]);
  }
  return maxSemver(versions);
}

export function readPackageVersion(cwd = process.cwd()) {
  const pkgPath = path.join(cwd, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return normalizeSemver(pkg.version) || '1.0.0';
}

function detectEol(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

export function writeVersionToPackageFiles(newVersion, cwd = process.cwd()) {
  const normalized = normalizeSemver(newVersion);
  if (!normalized) {
    throw new Error(`Invalid target version "${newVersion}". Expected MAJOR.MINOR.PATCH.`);
  }

  const pkgPath = path.join(cwd, 'package.json');
  const pkgRaw = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgRaw);
  pkg.version = normalized;
  const pkgEol = detectEol(pkgRaw);
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2).replace(/\n/g, pkgEol)}${pkgEol}`, 'utf8');

  const lockPath = path.join(cwd, 'package-lock.json');
  if (fs.existsSync(lockPath)) {
    const lockRaw = fs.readFileSync(lockPath, 'utf8');
    const lock = JSON.parse(lockRaw);
    lock.version = normalized;
    if (lock.packages && lock.packages['']) {
      lock.packages[''].version = normalized;
    }
    const lockEol = detectEol(lockRaw);
    fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2).replace(/\n/g, lockEol)}${lockEol}`, 'utf8');
  }

  return normalized;
}

export function resolveNextPatchVersion({ currentVersion, releasedVersion, explicitVersion }) {
  if (explicitVersion) {
    const normalized = normalizeSemver(explicitVersion);
    if (!normalized) {
      throw new Error(`Invalid --version "${explicitVersion}". Expected MAJOR.MINOR.PATCH.`);
    }
    return normalized;
  }
  const base = maxSemver([currentVersion, releasedVersion]) || '1.0.0';
  return bumpPatchVersion(base);
}

export async function fetchReleasedVersion({ repoSlug, releaseTag = DEFAULT_RELEASE_TAG, token = '' }) {
  const url = `https://api.github.com/repos/${repoSlug}/releases/tags/${encodeURIComponent(releaseTag)}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'myraa-release-publisher',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers });
    if (res.status === 404) return { version: null, release: null };
    if (!res.ok) {
      console.warn(`[Version] Warning: GitHub release lookup returned HTTP ${res.status}.`);
      return { version: null, release: null };
    }
    const release = await res.json();
    return {
      version: extractReleasedExeVersion(release?.assets),
      release
    };
  } catch (err) {
    console.warn(`[Version] Warning: Could not inspect GitHub release "${releaseTag}": ${err.message}`);
    return { version: null, release: null };
  }
}

function readPrevCommitVersion(cwd) {
  try {
    const raw = execFileSync('git', ['show', 'HEAD~1:package.json'], {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8'
    });
    const parsed = JSON.parse(raw);
    return normalizeSemver(parsed.version);
  } catch {
    return null;
  }
}

function writeGitHubOutput(entries) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const lines = Object.entries(entries).map(([k, v]) => `${k}=${v}`);
  fs.appendFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

async function runCli() {
  const args = new Set(process.argv.slice(2));
  const cwd = process.cwd();
  const isCi = args.has('--ci');
  const dryRun = args.has('--dry-run');
  const repoSlug = process.env.REPO || DEFAULT_REPO;
  const token = (process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '').trim();
  const eventName = (process.env.GITHUB_EVENT_NAME || '').trim();

  const currentVersion = readPackageVersion(cwd);
  const { version: releasedVersion } = await fetchReleasedVersion({ repoSlug, token });

  if (isCi) {
    const prevVersion = readPrevCommitVersion(cwd);
    const alreadyBumpedInCommit = Boolean(
      prevVersion && compareSemver(currentVersion, prevVersion) > 0
    );

    let finalVersion = currentVersion;
    let bumped = false;

    // Preserve explicit version bumps already included in a pushed commit (e.g. from release:github)
    if (!alreadyBumpedInCommit || eventName === 'workflow_dispatch') {
      finalVersion = resolveNextPatchVersion({ currentVersion, releasedVersion });
      bumped = true;
      console.log(
        `[Version] Auto-bumping patch version: ${currentVersion} -> ${finalVersion}` +
          (releasedVersion ? ` (latest released asset: ${releasedVersion})` : '')
      );
      if (!dryRun) {
        writeVersionToPackageFiles(finalVersion, cwd);
        execFileSync('git', ['config', 'user.name', 'github-actions[bot]'], { cwd, stdio: 'inherit' });
        execFileSync('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], {
          cwd,
          stdio: 'inherit'
        });
        execFileSync('git', ['add', 'package.json', 'package-lock.json'], { cwd, stdio: 'inherit' });
        execFileSync('git', ['commit', '-m', `chore: bump version to v${finalVersion} [skip ci]`], {
          cwd,
          stdio: 'inherit'
        });
        execFileSync('git', ['push', 'origin', 'HEAD:main'], { cwd, stdio: 'inherit' });
      }
    } else {
      console.log(
        `[Version] Keeping version ${currentVersion} (already bumped from ${prevVersion} in this commit).`
      );
    }

    const headSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8'
    }).trim();

    writeGitHubOutput({
      version: finalVersion,
      bumped: String(bumped),
      commit_sha: headSha
    });
    return;
  }

  const nextVersion = resolveNextPatchVersion({ currentVersion, releasedVersion });
  console.log(`[Version] ${currentVersion} -> ${nextVersion} (released: ${releasedVersion || 'none'})`);
  if (!dryRun) {
    writeVersionToPackageFiles(nextVersion, cwd);
  }
}

const isDirectRun = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) {
  runCli().catch((err) => {
    console.error('[Version] Failed:', err.message || err);
    process.exitCode = 1;
  });
}
