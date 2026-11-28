/* ==========================================================================
   PlayStation 5 High-Fidelity Audio Synthesizer (Web Audio API)
   ========================================================================== */

class PS5AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.soundEffectsEnabled = true;
    this.homeMusicEnabled = true;
  }

  setSoundEffects(enabled) {
    this.soundEffectsEnabled = Boolean(enabled);
  }

  setHomeMusic(enabled) {
    this.homeMusicEnabled = Boolean(enabled);
    if (!this.homeMusicEnabled) {
      this.stopAmbientDrone();
    } else if (!this.muted) {
      this.startAmbientDrone();
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Subtle soft sine navigation tick when scrolling games
  playNavTick() {
    if (this.muted || !this.soundEffectsEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  // Generic play sound dispatcher
  play(name = 'select') {
    if (this.muted) return;
    if (name === 'select') this.playSelectChime();
    else if (name === 'back') this.playBackCancel();
    else if (name === 'nav' || name === 'tick') this.playNavTick();
    else if (name === 'error') this.playErrorBeep();
    else this.playSelectChime();
  }

  // Navigation cursor tick alias for controller navigation
  playCursorTick() {
    this.playNavTick();
  }

  // Back chime alias
  playBackChime() {
    this.playBackCancel();
  }

  // Authentic PS5 Error / Invalid Action Beep
  playErrorBeep() {
    if (this.muted || !this.soundEffectsEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.setValueAtTime(190, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  // Warm, iconic PS5 Select/Enter Chime
  playSelectChime() {
    if (this.muted || !this.soundEffectsEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);

      gain.gain.setValueAtTime(0.12, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.4);
    });
  }

  // Soft descending Cancel/Back sound (Circle button)
  playBackCancel() {
    if (this.muted || !this.soundEffectsEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [659.25, 493.88]; // E5, B4

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.09, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.28);
    });
  }

  // Authentic PlayStation 5 Trophy Earned Chime (Shimmering Platinum/Gold Triad)
  playTrophyChime() {
    if (this.muted || !this.soundEffectsEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.7);
    });
  }

  // Soft Authentic PS5 Notification Pop-in Chime
  playNotificationChime() {
    if (this.muted || !this.soundEffectsEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [659.25, 987.77]; // E5, B5

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.09, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.38);
    });
  }

  // Signature PlayStation Boot Chords (Theme-Specific Web Audio Synthesis)
  playBootChord(themeId = 'cosmos-gold') {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (themeId === 'anniversary-retro') {
      // PS1-inspired resonant crystal startup chord: deep sub-bass C2 (65.41Hz) + shimmering crystal harmonics
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(65.41, now);
      subGain.gain.setValueAtTime(0.2, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 4.6);

      const retroNotes = [261.63, 392.00, 523.25, 783.99, 1046.50, 1567.98];
      retroNotes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);
        gain.gain.setValueAtTime(0.09 / (idx * 0.4 + 1), now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + 4.2);
      });
      return;
    }

    if (themeId === 'spiderman-symbiote') {
      // Intense dramatic low-frequency symbiote pulse + resonant scarlet chord
      const chords = [55.0, 110.0, 164.81, 220.0, 329.63, 440.0];
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, now);
        filter.frequency.exponentialRampToValueAtTime(2200, now + 1.1);
        filter.frequency.exponentialRampToValueAtTime(320, now + 3.8);
        gain.gain.setValueAtTime(0.07 / (idx * 0.5 + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 4.1);
      });
      return;
    }

    if (themeId === 'astro-bot') {
      // Playful bright major chord with ascending crystal arpeggios
      const astroNotes = [130.81, 196.00, 261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
      astroNotes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);
        gain.gain.setValueAtTime(0.08 / (idx * 0.3 + 1), now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.03);
        osc.stop(now + 3.9);
      });
      return;
    }

    if (themeId === 'playstation-blue') {
      // Deep celestial blue synth chord (Eb2, Bb2, Eb3, G3, Bb3, D4)
      const blueNotes = [77.78, 116.54, 155.56, 196.00, 233.08, 293.66, 392.00];
      blueNotes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);
        filter.frequency.exponentialRampToValueAtTime(2800, now + 1.2);
        filter.frequency.exponentialRampToValueAtTime(500, now + 3.6);
        gain.gain.setValueAtTime(0.08 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 4.3);
      });
      return;
    }

    // Default: Cosmos Gold (Standard PS5 Major 9th chord: G2, D3, G3, B3, D4, F#4)
    const chord = [98.00, 146.83, 196.00, 246.94, 293.66, 369.99];
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 1.2);
      filter.frequency.exponentialRampToValueAtTime(600, now + 3.5);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.09 / (idx + 1), now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 4.3);
    });
  }

  // PS Button Quick Menu Chime
  playControlCenterChime() {
    if (this.muted || !this.soundEffectsEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Authentic PS5 Ethereal Ambient Background Drone Loop
  startAmbientDrone() {
    if (this.muted || !this.homeMusicEnabled || this.dronePlaying) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.droneGain.gain.exponentialRampToValueAtTime(0.026, this.ctx.currentTime + 3.0);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      const droneNotes = [73.42, 110.0, 146.83, 174.61, 220.0];
      this.droneOscs = droneNotes.map((freq, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.detune.setValueAtTime((i - 2) * 4, this.ctx.currentTime);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.18 / (i + 1), this.ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        return osc;
      });

      filter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);
      this.dronePlaying = true;
    } catch (e) {
      console.warn('[PS5 Audio] Drone init:', e);
    }
  }

  stopAmbientDrone() {
    if (!this.dronePlaying || !this.droneGain) return;
    try {
      this.droneGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
      setTimeout(() => {
        if (this.droneOscs) {
          this.droneOscs.forEach(o => {
            try { o.stop(); } catch (e) {}
          });
          this.droneOscs = [];
        }
        this.dronePlaying = false;
      }, 1300);
    } catch (e) {
      this.dronePlaying = false;
    }
  }

  // Atmospheric Game Audio Theme Motif on Hover
  playGameAmbience(gameId) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    let notes = [261.63, 329.63, 392.0, 523.25];
    let waveType = 'sine';

    if (gameId === 'spiderman-2' || (gameId && gameId.includes('spider'))) {
      notes = [110.0, 164.81, 220.0, 261.63, 329.63];
      waveType = 'triangle';
    } else if (gameId === 'black-myth-wukong' || (gameId && gameId.includes('wukong'))) {
      notes = [146.83, 196.0, 220.0, 293.66, 392.0];
      waveType = 'sine';
    } else if (gameId === 'gow-ragnarok' || (gameId && gameId.includes('gow'))) {
      notes = [73.42, 110.0, 130.81, 164.81];
      waveType = 'triangle';
    } else if (gameId === 'elden-ring' || (gameId && gameId.includes('elden'))) {
      notes = [98.0, 146.83, 185.0, 220.0, 293.66];
      waveType = 'triangle';
    } else if (gameId === 'astro-bot' || (gameId && gameId.includes('astro'))) {
      notes = [261.63, 329.63, 392.0, 523.25, 659.25];
      waveType = 'sine';
    } else if (gameId === 'ps-explore') {
      notes = [174.61, 220.0, 261.63, 349.23];
      waveType = 'sine';
    } else if (gameId === 'ps-store') {
      notes = [130.81, 196.0, 261.63, 329.63];
      waveType = 'sine';
    } else if (gameId && (gameId.includes('forza') || gameId.includes('2483190') || gameId.includes('1551360') || gameId.includes('2440510'))) {
      notes = [196.00, 246.94, 293.66, 392.00, 493.88];
      waveType = 'sine';
    } else if (gameId && (gameId.includes('tsushima') || gameId.includes('ghost'))) {
      notes = [146.83, 174.61, 220.0, 261.63, 293.66];
      waveType = 'sine';
    }

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.6);
      filter.frequency.exponentialRampToValueAtTime(400, now + 2.2);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.03 / (idx * 0.3 + 1), now + idx * 0.08 + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 2.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 2.6);
    });
  }

  suspendForGameplay() {
    this.stopAmbientDrone();
    if (this.ctx && this.ctx.state === 'running') {
      try { this.ctx.suspend(); } catch (e) {}
    }
  }

  resumeFromGameplay() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch (e) {}
    }
    if (!this.muted && this.homeMusicEnabled && !this.dronePlaying) {
      this.startAmbientDrone();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopAmbientDrone();
    } else {
      this.startAmbientDrone();
    }
    return this.muted;
  }
}

export const ps5Audio = new PS5AudioEngine();
