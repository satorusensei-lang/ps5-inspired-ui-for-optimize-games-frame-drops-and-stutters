import assert from 'node:assert/strict';
import { isSteamSnapshotNewer, retainTransientlyMissingDownloads } from '../src/scripts/services/steam-download-service.js';

assert.equal(isSteamSnapshotNewer(2000, 1000), true, 'newer request snapshots are accepted');
assert.equal(isSteamSnapshotNewer(1000, 2000), false, 'a slow older response cannot undo a newer pause/resume snapshot');
assert.equal(isSteamSnapshotNewer(2000, 2000), false, 'duplicate timestamp snapshots do not reapply stale state');
assert.equal(isSteamSnapshotNewer(Number.NaN, 2000), true, 'legacy snapshots without ordering metadata remain usable');

const appId = '1815780';
const active = {
  appId,
  name: 'Asphalt Legends',
  status: 'Downloading',
  bytesDownloaded: 565022064,
  bytesTotal: 9932102480,
  downloadPercent: 6,
  installPercent: 6,
  downloadRateMbps: 29.4,
  syncSource: 'steam-overview',
  syncStatus: 'live',
  syncedAt: 1000
};

const missingSince = new Map();
const firstGap = retainTransientlyMissingDownloads({ [appId]: active }, {}, missingSince, 1100);
assert.equal(firstGap[appId].downloadPercent, 6, 'transient gaps preserve confirmed progress');
assert.equal(firstGap[appId].syncStatus, 'syncing', 'transient gaps are shown as syncing');
assert.equal(firstGap[appId].downloadRateMbps, 0, 'stale speed is not presented as live');

const repeatedGap = retainTransientlyMissingDownloads(firstGap, {}, missingSince, 3000);
assert.equal(repeatedGap[appId].status, 'Downloading', 'short repeated gaps do not replace the active game UI');

const stableAbsence = retainTransientlyMissingDownloads(repeatedGap, {}, missingSince, 5200);
assert.equal(Object.hasOwn(stableAbsence, appId), false, 'stable absence clears the retained game after the grace period');

const confirmedPaused = { ...active, status: 'Paused', downloadRateMbps: 0, syncedAt: 5300 };
const recovered = retainTransientlyMissingDownloads(firstGap, { [appId]: confirmedPaused }, missingSince, 5300);
assert.equal(recovered[appId].status, 'Paused', 'a fresh Steam state replaces the retained snapshot');
assert.equal(recovered[appId].syncStatus, 'live', 'confirmed Steam state clears the syncing label');
assert.equal(missingSince.has(appId), false, 'confirmed recovery clears the missing timer');

console.log('Steam download snapshot transition checks passed.');
