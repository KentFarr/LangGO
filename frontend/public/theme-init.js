// Applies the saved theme before first paint to avoid a flash of the wrong theme.
// Kept as an external file (not inline) so the Content-Security-Policy can stay script-src 'self'.
// Mirrors applyTheme() in src/lib/theme.ts.
(function () {
  var preference = 'system';
  try {
    preference = localStorage.getItem('langgo-theme') || 'system';
  } catch (e) {
    // Storage unavailable (private mode, blocked cookies): fall back to the system setting.
  }
  var dark =
    preference === 'dark' ||
    (preference !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
})();
