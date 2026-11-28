/* ==========================================================================
   PlayStation 5 Digital Clock
   ========================================================================== */

export function initClock() {
  function update() {
    if (typeof document !== 'undefined' && (document.hidden || document.body?.classList?.contains('game-boost-idle'))) {
      return;
    }
    const now = new Date();
    const format = localStorage.getItem('ps5_clock_format') || '24h';
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    let formattedTime;
    if (format === '12h') {
      const h12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      formattedTime = `${h12}:${minutes} ${ampm}`;
    } else {
      formattedTime = `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    document.querySelectorAll('#ps5-live-clock, .ps5-live-clock').forEach(el => {
      el.textContent = formattedTime;
    });
  }

  update();
  setInterval(update, 1000);
}
