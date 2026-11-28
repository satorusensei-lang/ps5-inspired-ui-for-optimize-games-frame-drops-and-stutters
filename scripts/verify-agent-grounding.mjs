import fs from 'fs';
import path from 'path';
import process from 'process';

const root = process.cwd();
const jsonMode = process.argv.includes('--json');

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'dist-ssr',
  'build',
  'backups',
  'scratch',
  '.21st'
]);

const SOURCE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.html', '.css', '.md']);
const IMPORT_EXTENSIONS = ['', '.js', '.mjs', '.cjs', '.json', '.css'];
const REQUIRED_FILES = [
  'AGENTS.md',
  '.agents/rules/project-context.md',
  'package.json',
  'vite.config.js',
  'electron/main.cjs',
  'electron/preload.cjs',
  'index.html',
  'src/scripts/main.js'
];

const findings = [];

function addFinding(severity, type, message, file = null) {
  findings.push({ severity, type, message, file });
}

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function existsCaseInsensitive(filePath) {
  if (fs.existsSync(filePath)) return true;
  const dir = path.dirname(filePath);
  const base = path.basename(filePath).toLowerCase();
  if (!fs.existsSync(dir)) return false;
  try {
    return fs.readdirSync(dir).some((entry) => entry.toLowerCase() === base);
  } catch {
    return false;
  }
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.') && !specifier.startsWith('/src/')) return null;

  const base = specifier.startsWith('/src/')
    ? path.join(root, specifier.slice(1))
    : path.resolve(path.dirname(fromFile), specifier);

  for (const ext of IMPORT_EXTENSIONS) {
    const candidate = `${base}${ext}`;
    if (existsCaseInsensitive(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }

  for (const ext of IMPORT_EXTENSIONS.filter(Boolean)) {
    const candidate = path.join(base, `index${ext}`);
    if (existsCaseInsensitive(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }

  return false;
}

function normalizeAssetPath(rawAsset) {
  const withoutFragment = rawAsset.split('#')[0].split('?')[0];
  try {
    return decodeURIComponent(withoutFragment);
  } catch {
    return withoutFragment;
  }
}

function shouldSkipAsset(assetPath) {
  return (
    assetPath.startsWith('/assets/cache/') ||
    assetPath.includes('${') ||
    assetPath.includes('`') ||
    assetPath.includes('...') ||
    assetPath.endsWith('/assets/') ||
    assetPath === '/assets'
  );
}

function verifyRequiredFiles() {
  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(root, relPath);
    if (!existsCaseInsensitive(fullPath)) {
      addFinding('error', 'missing-required-file', `Required project context file is missing: ${relPath}`, relPath);
    }
  }
}

function verifyPackageScripts() {
  const packagePath = path.join(root, 'package.json');
  if (!fs.existsSync(packagePath)) return;

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (error) {
    addFinding('error', 'invalid-package-json', `package.json is not valid JSON: ${error.message}`, 'package.json');
    return;
  }

  for (const scriptName of ['dev', 'build', 'desktop', 'build:desktop', 'verify:agent']) {
    if (!packageJson.scripts || !packageJson.scripts[scriptName]) {
      addFinding('error', 'missing-npm-script', `Missing npm script: ${scriptName}`, 'package.json');
    }
  }
}

function verifyImports(files) {
  const importRegexes = [
    /\bimport\s+(?:[^'"()]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relFile = toPosixPath(path.relative(root, file));

    for (const regex of importRegexes) {
      for (const match of content.matchAll(regex)) {
        const specifier = match[1];
        const resolved = resolveImport(file, specifier);
        if (resolved === false) {
          addFinding('error', 'missing-local-import', `Cannot resolve local import "${specifier}"`, relFile);
        }
      }
    }
  }
}

function verifyAssets(files) {
  const assetRegexes = [
    /['"`(]\s*(\/assets\/[^'"`)\s]+)/g,
    /url\(\s*['"]?(\/assets\/[^'")\s]+)['"]?\s*\)/g
  ];
  const seen = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relFile = toPosixPath(path.relative(root, file));

    for (const regex of assetRegexes) {
      for (const match of content.matchAll(regex)) {
        const assetPath = normalizeAssetPath(match[1]);
        if (shouldSkipAsset(assetPath)) continue;

        const key = `${relFile}:${assetPath}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const publicPath = path.join(root, 'public', assetPath.slice(1));
        if (!existsCaseInsensitive(publicPath)) {
          addFinding('error', 'missing-local-asset', `Referenced asset does not exist: ${assetPath}`, relFile);
        }
      }
    }
  }
}

function printResults() {
  const errors = findings.filter((finding) => finding.severity === 'error');
  const warnings = findings.filter((finding) => finding.severity === 'warning');

  if (jsonMode) {
    console.log(JSON.stringify({ ok: errors.length === 0, errors: errors.length, warnings: warnings.length, findings }, null, 2));
    return;
  }

  if (findings.length === 0) {
    console.log('Agent grounding verification passed.');
    return;
  }

  console.log(`Agent grounding verification found ${errors.length} error(s) and ${warnings.length} warning(s).`);
  for (const finding of findings) {
    const location = finding.file ? ` [${finding.file}]` : '';
    console.log(`- ${finding.severity.toUpperCase()} ${finding.type}${location}: ${finding.message}`);
  }
}

const files = walk(root);
verifyRequiredFiles();
verifyPackageScripts();
verifyImports(files);
verifyAssets(files);
printResults();

if (findings.some((finding) => finding.severity === 'error')) {
  process.exitCode = 1;
}
