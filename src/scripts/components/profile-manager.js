/* ==========================================================================
   PlayStation 5 User & Account Management Service
   Enables changing Online ID / Player Name with persistent storage & HUD updates
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { openOverlay } from './overlays.js';

const STORAGE_KEY = 'ps5_account_name';
const DEFAULT_NAME = 'PlayStation Master';

export function getAccountName() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_NAME;
  } catch (e) {
    return DEFAULT_NAME;
  }
}

export function setAccountName(newName) {
  const trimmed = (newName || '').trim();
  if (!trimmed || trimmed.length < 2) {
    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: "⚠️ Invalid Account Name",
        subtitle: "Online ID must be at least 2 characters long."
      }
    }));
    return false;
  }

  const finalName = trimmed.slice(0, 24);

  try {
    localStorage.setItem(STORAGE_KEY, finalName);
  } catch (e) {}

  updateAllAccountNameDisplays(finalName);

  try {
    ps5Audio.playSelectChime();
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('ps5-show-notification', {
    detail: {
      title: "🎮 Online ID Updated",
      subtitle: `Your PlayStation account name is now: ${finalName}`
    }
  }));

  return true;
}

export function updateAllAccountNameDisplays(name = getAccountName()) {
  const headerName = document.getElementById('ps5-header-profile-name');
  if (headerName) headerName.textContent = name;

  const modalName = document.getElementById('ps5-modal-profile-name');
  if (modalName) modalName.textContent = name;

  const settingsTag = document.getElementById('current-account-name-tag');
  if (settingsTag) settingsTag.textContent = name;
}

export function initProfileManager() {
  // 1. Initial display sync from localStorage
  const currentName = getAccountName();
  updateAllAccountNameDisplays(currentName);

  // 2. Wire Profile Modal Edit Elements
  const editBtn = document.getElementById('btn-edit-profile-name');
  const cancelBtn = document.getElementById('btn-cancel-profile-name');
  const form = document.getElementById('profile-name-edit-form');
  const input = document.getElementById('profile-name-input');
  const displayRow = document.getElementById('profile-name-display-row');
  const settingsAccountBtn = document.getElementById('setting-account-name-btn');

  function showEditForm() {
    if (!form || !displayRow || !input) return;
    input.value = getAccountName();
    displayRow.style.display = 'none';
    form.style.display = 'flex';
    setTimeout(() => {
      input.focus();
      input.select();
    }, 50);
  }

  function hideEditForm() {
    if (!form || !displayRow) return;
    form.style.display = 'none';
    displayRow.style.display = 'flex';
  }

  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      try { ps5Audio.playNavTick(); } catch (err) {}
      showEditForm();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      try { ps5Audio.playBackCancel(); } catch (err) {}
      hideEditForm();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = input?.value;
      if (setAccountName(newName)) {
        hideEditForm();
      }
    });
  }

  // Handle Escape key to cancel edit
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        try { ps5Audio.playBackCancel(); } catch (err) {}
        hideEditForm();
      }
    });
  }

  // 3. Settings shortcut: clicking "User & Account Management" opens profile modal with edit open
  if (settingsAccountBtn) {
    settingsAccountBtn.addEventListener('click', () => {
      openOverlay('ps5-profile-modal');
      setTimeout(showEditForm, 150);
    });
  }
}
