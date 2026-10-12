/* ==========================================================================
   PlayStation 5 Digital Clock
   ========================================================================== */

export function initClock() {
  const clockEl = document.getElementById('ps5-live-clock');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    clockEl.textContent = `${hours}:${minutes} ${ampm}`;
  }

  update();
  setInterval(update, 1000);
}
