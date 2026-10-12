/* ==========================================================================
   PlayStation 5 Media Apps Database with Install States
   ========================================================================== */

export const INITIAL_PS5_MEDIA_APPS = [
  {
    id: "youtube",
    title: "YouTube",
    studio: "Google LLC • 4K HDR Streaming",
    genre: "Video Streaming",
    logoImg: "/assets/media/youtube/logo.svg",
    tileIcon: "/assets/media/youtube/tile.svg",
    heroBg: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1920&q=80",
    badge: "Installed",
    installed: true,
    installSize: "1.4 GB",
    storageType: "Console Storage",
    playTime: "340 hours",
    trophies: null,
    friends: "8 friends watching streams",
    activities: [
      { id: "yt1", title: "PlayStation Showcase Live", tag: "Live Stream", progress: 100, timeEst: "4K 60FPS" },
      { id: "yt2", title: "Liked Gaming Videos", tag: "Library", progress: 100, timeEst: "180 videos" }
    ],
    liveStatus: "Signed in • 4K HDR Streaming Ready"
  },
  {
    id: "youtube-music",
    title: "YouTube Music",
    studio: "Google LLC • Hi-Fi Background Streaming",
    genre: "Music & Podcasts",
    logoImg: "/assets/media/ytmusic/logo.svg",
    tileIcon: "/assets/media/ytmusic/tile.svg",
    heroBg: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1920&q=80",
    badge: "Installed",
    installed: true,
    installSize: "780 MB",
    storageType: "Console Storage",
    playTime: "185 hours",
    trophies: null,
    friends: "Now Playing in Background",
    activities: [
      { id: "ytm1", title: "Liked Music & Replay Mix", tag: "Personal Mix", progress: 100, timeEst: "Continuous" },
      { id: "ytm2", title: "Gaming High-Energy Beats", tag: "Soundtrack", progress: 85, timeEst: "Track 12" }
    ],
    liveStatus: "Active in Quick Menu • Background Audio Ready"
  },
  {
    id: "spotify",
    title: "Spotify Music",
    studio: "Spotify AB • Background Game Soundtrack",
    genre: "Music & Podcasts",
    logoImg: "/assets/media/spotify/logo.svg",
    tileIcon: "/assets/media/spotify/tile.svg",
    heroBg: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1920&q=80",
    badge: "Installed",
    installed: true,
    installSize: "850 MB",
    storageType: "Console Storage",
    playTime: "620 hours",
    trophies: null,
    friends: "Now Playing in Background",
    activities: [
      { id: "spt1", title: "Cyberpunk 2077 Official OST", tag: "Playlist", progress: 40, timeEst: "Track 4" },
      { id: "spt2", title: "Lo-Fi Gaming Chill Beats", tag: "Focus Mix", progress: 100, timeEst: "Looping" }
    ],
    liveStatus: "Active in Quick Menu • Background Audio Ready"
  },

  /* --------------------------------------------------------------------------
     Uninstalled Media Apps
     -------------------------------------------------------------------------- */
  {
    id: "netflix",
    title: "Netflix",
    studio: "Netflix Inc. • Dolby Atmos & 4K",
    genre: "Movies & TV Series",
    logoImg: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/512px-Netflix_2015_logo.svg.png",
    tileIcon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Netflix_icon.svg/512px-Netflix_icon.svg.png",
    heroBg: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=80",
    badge: "Not Installed",
    installed: false,
    installSize: "2.1 GB",
    storageType: "Ready to Download",
    playTime: "190 hours",
    trophies: null,
    friends: "Available in Media Store",
    activities: [
      { id: "nfx1", title: "Arcane Season 2", tag: "Series", progress: 100, timeEst: "Download App" }
    ],
    liveStatus: "Not Installed • 2.1 GB Download Required"
  },
  {
    id: "discord",
    title: "Discord Voice & Communities",
    studio: "Discord Inc. • Cross-Play Voice Chat",
    genre: "Communication & Guilds",
    logoImg: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Discord_logo.svg/512px-Discord_logo.svg.png",
    tileIcon: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Discord_app_icon_%282021%29.svg/512px-Discord_app_icon_%282021%29.svg.png",
    heroBg: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80",
    badge: "Not Installed",
    installed: false,
    installSize: "1.2 GB",
    storageType: "Ready to Download",
    playTime: "410 hours",
    trophies: null,
    friends: "Voice Server Available",
    activities: [
      { id: "dsc1", title: "Raid Squad Voice Server", tag: "Guild", progress: 100, timeEst: "Download App" }
    ],
    liveStatus: "Not Installed • 1.2 GB Download Required"
  }
];

export let PS5_MEDIA_APPS = JSON.parse(JSON.stringify(INITIAL_PS5_MEDIA_APPS));

export function setMediaInstalled(id, isInstalled) {
  const app = PS5_MEDIA_APPS.find(a => a.id === id);
  if (app) {
    app.installed = isInstalled;
    app.badge = isInstalled ? "Installed" : "Not Installed";
    app.storageType = isInstalled ? "Console Storage" : "Ready to Download";
  }
  return app;
}
