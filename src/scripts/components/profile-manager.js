/* ==========================================================================
   PlayStation 5 User & Account Management Service
   - Enables changing Online ID / Player Name with persistent storage & HUD updates
   - Manages Player Profile Avatars (8 Official PlayStation Character Presets)
   - Drives Out-of-Box Experience (OOBE) First-Time Console Setup flow
   ========================================================================== */

import { ps5Audio } from '../audio/ps5-audio.js';
import { openOverlay, closeActiveOverlay } from './overlays.js';
import { syncPCGames } from './carousel.js';
import { triggerFirstBootExperience } from './boot-screen.js';

const STORAGE_KEY = 'ps5_account_name';
const DEFAULT_NAME = 'PlayStation Master';
const AVATAR_KEY = 'ps5_avatar_url';
const SETUP_COMPLETED_KEY = 'ps5_setup_completed';

export const PS5_PRESET_AVATARS = [
  {
    id: 'jin-sakai',
    name: 'Ghost of Tsushima Jin',
    url: '/assets/games/got/tile.webp'
  },
  {
    id: 'spider-man',
    name: "Marvel's Spider-Man 2",
    url: '/assets/games/spiderman2/tile.webp'
  },
  {
    id: 'kratos',
    name: 'God of War Kratos',
    url: '/assets/games/gow/tile.webp'
  },
  {
    id: 'ellie',
    name: 'The Last of Us Ellie',
    url: '/assets/games/tlou1/tile.webp'
  },
  {
    id: 'wukong',
    name: 'Black Myth: Wukong',
    url: '/assets/games/wukong/ps5_tile.webp'
  },
  {
    id: 'leon',
    name: 'Resident Evil 4 Leon',
    url: '/assets/games/re4/tile.webp'
  },
  {
    id: 'forza',
    name: 'Forza Horizon',
    url: '/assets/games/forza6/tile.jpg'
  },
  {
    id: 'valorant',
    name: 'VALORANT Jett',
    url: '/assets/games/valorant/ps5_master.png'
  }
];

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

export function getAccountAvatar() {
  try {
    return localStorage.getItem(AVATAR_KEY) || PS5_PRESET_AVATARS[0].url;
  } catch (e) {
    return PS5_PRESET_AVATARS[0].url;
  }
}

export function setAccountAvatar(avatarUrl) {
  if (!avatarUrl) return false;
  try {
    localStorage.setItem(AVATAR_KEY, avatarUrl);
  } catch (e) {}
  updateAllAvatarDisplays(avatarUrl);
  return true;
}

export function updateAllAccountNameDisplays(name = getAccountName()) {
  const headerName = document.getElementById('ps5-header-profile-name');
  if (headerName) headerName.textContent = name;

  const modalName = document.getElementById('ps5-modal-profile-name');
  if (modalName) modalName.textContent = name;

  const settingsTag = document.getElementById('current-account-name-tag');
  if (settingsTag) settingsTag.textContent = name;

  const settingsHeaderName = document.getElementById('ps5-settings-header-name');
  if (settingsHeaderName) settingsHeaderName.textContent = name;
}

export function updateAllAvatarDisplays(avatarUrl = getAccountAvatar()) {
  document.querySelectorAll('.ps5-avatar-img, .profile-avatar-large img').forEach(img => {
    img.src = avatarUrl;
  });
}

export function isSetupCompleted() {
  try {
    return localStorage.getItem(SETUP_COMPLETED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setSetupCompleted(completed = true) {
  try {
    if (completed) {
      localStorage.setItem(SETUP_COMPLETED_KEY, 'true');
    } else {
      localStorage.removeItem(SETUP_COMPLETED_KEY);
    }
  } catch (e) {}
}

export function showSetupScreen() {
  const setupScreen = document.getElementById('ps5-setup-screen');
  if (!setupScreen) return;

  setupScreen.style.display = 'flex';
  setupScreen.classList.remove('hidden', 'fade-out');

  // Populate avatar options
  const avatarRow = document.getElementById('ps5-setup-avatar-row');
  let currentAvatarUrl = getAccountAvatar();

  if (avatarRow) {
    avatarRow.innerHTML = PS5_PRESET_AVATARS.map(avatar => `
      <div class="ps5-setup-avatar-item ${avatar.url === currentAvatarUrl ? 'selected' : ''}" data-avatar-url="${avatar.url}" title="${avatar.name}">
        <img src="${avatar.url}" alt="${avatar.name}" />
      </div>
    `).join('');

    avatarRow.querySelectorAll('.ps5-setup-avatar-item').forEach(item => {
      item.addEventListener('click', () => {
        avatarRow.querySelectorAll('.ps5-setup-avatar-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        currentAvatarUrl = item.getAttribute('data-avatar-url');
        try { ps5Audio.playNavTick(); } catch (e) {}
      });
    });
  }

  // Pre-fill input
  const nameInput = document.getElementById('ps5-setup-input-name');
  if (nameInput) {
    // If electronAPI has system info with user, prefill it if not customized
    if (typeof window !== 'undefined' && window.electronAPI?.getSystemInfo) {
      window.electronAPI.getSystemInfo().then(info => {
        if (info?.user && (!nameInput.value || nameInput.value === DEFAULT_NAME)) {
          nameInput.value = info.user;
          nameInput.placeholder = info.user;
        }
      }).catch(() => {});
    } else {
      const existing = getAccountName();
      if (existing && existing !== DEFAULT_NAME) {
        nameInput.value = existing;
      }
    }

    setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 150);
  }

  // Handle confirmation
  const submitBtn = document.getElementById('btn-submit-ps5-setup');
  const doSubmit = () => {
    const rawVal = nameInput ? nameInput.value.trim() : '';
    const finalName = rawVal && rawVal.length >= 2 ? rawVal : (nameInput?.placeholder || 'PlayStation Player');
    
    setAccountName(finalName);
    setAccountAvatar(currentAvatarUrl);
    setSetupCompleted(true);

    try { ps5Audio.playSelectChime(); } catch (e) {}

    setupScreen.classList.add('fade-out');
    setTimeout(() => {
      setupScreen.style.display = 'none';
      setupScreen.classList.remove('fade-out');
    }, 700);

    // Automatically synchronize all of friend's laptop game stores (Steam, Xbox, Epic Games)
    syncPCGames(false).catch(() => {});

    window.dispatchEvent(new CustomEvent('ps5-show-notification', {
      detail: {
        title: `👋 Welcome to PlayStation®5, ${finalName}!`,
        subtitle: "Setup completed! All Steam, Xbox & Epic games synchronized."
      }
    }));
  };

  if (submitBtn) {
    submitBtn.onclick = (e) => {
      e.preventDefault();
      doSubmit();
    };
  }

  if (nameInput) {
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSubmit();
      }
    };
  }
}

export function initProfileManager() {
  // 1. Initial display sync from localStorage
  const currentName = getAccountName();
  updateAllAccountNameDisplays(currentName);
  updateAllAvatarDisplays();

  // 2. Wire Profile Modal Edit Elements
  const editBtn = document.getElementById('btn-edit-profile-name');
  const cancelBtn = document.getElementById('btn-cancel-profile-name');
  const form = document.getElementById('profile-name-edit-form');
  const input = document.getElementById('profile-name-input');
  const displayRow = document.getElementById('profile-name-display-row');
  const settingsAccountBtn = document.getElementById('setting-account-name-btn');
  const settingFirstBootBtn = document.getElementById('setting-first-boot-btn');

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

  // 3. Avatar Picker in Profile Modal
  const avatarToggleBtn = document.getElementById('btn-toggle-avatar-picker');
  const avatarTray = document.getElementById('profile-avatar-picker-tray');
  const avatarGrid = document.getElementById('profile-avatar-grid');

  function renderAvatarPickerGrid() {
    if (!avatarGrid) return;
    const currentAvatar = getAccountAvatar();
    avatarGrid.innerHTML = PS5_PRESET_AVATARS.map(av => `
      <div class="profile-avatar-option ${av.url === currentAvatar ? 'selected' : ''}" data-avatar-url="${av.url}" title="${av.name}" tabindex="0" role="button">
        <img src="${av.url}" alt="${av.name}" />
      </div>
    `).join('');

    avatarGrid.querySelectorAll('.profile-avatar-option').forEach(opt => {
      const selectAvatar = () => {
        const url = opt.getAttribute('data-avatar-url');
        if (url) {
          setAccountAvatar(url);
          avatarGrid.querySelectorAll('.profile-avatar-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          try { ps5Audio.playNavTick(); } catch (err) {}
          window.dispatchEvent(new CustomEvent('ps5-show-notification', {
            detail: {
              title: "👤 Avatar Updated",
              subtitle: "Profile avatar updated across all PlayStation screens."
            }
          }));
        }
      };

      opt.addEventListener('click', selectAvatar);
      opt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectAvatar();
        }
      });
    });
  }

  if (avatarToggleBtn && avatarTray) {
    avatarToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = avatarTray.style.display !== 'none';
      if (isVisible) {
        avatarTray.style.display = 'none';
        try { ps5Audio.playBackCancel(); } catch (err) {}
      } else {
        renderAvatarPickerGrid();
        avatarTray.style.display = 'block';
        try { ps5Audio.playNavTick(); } catch (err) {}
        setTimeout(() => {
          avatarTray.querySelector('.profile-avatar-option.selected, .profile-avatar-option')?.focus();
        }, 50);
      }
    });
  }

  // 4. Sync Trophies Action
  const syncTrophiesBtn = document.getElementById('btn-sync-trophies-profile');
  if (syncTrophiesBtn) {
    syncTrophiesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        if (ps5Audio.playTrophyChime) {
          ps5Audio.playTrophyChime();
        } else {
          ps5Audio.playSelectChime();
        }
      } catch (err) {}
      window.dispatchEvent(new CustomEvent('ps5-show-notification', {
        detail: {
          title: "🏆 Trophies Synchronized",
          subtitle: "All 316 PlayStation™Network trophies up to date."
        }
      }));
    });
  }

  // 5. Settings shortcut: clicking "User & Account Management" opens profile modal with edit open
  if (settingsAccountBtn) {
    settingsAccountBtn.addEventListener('click', () => {
      openOverlay('ps5-profile-modal');
      setTimeout(showEditForm, 150);
    });
  }

  // 6. Test / Re-run First-Time Setup flow
  if (settingFirstBootBtn) {
    settingFirstBootBtn.addEventListener('click', () => {
      closeActiveOverlay(false);
      triggerFirstBootExperience();
    });
  }
}
