/**
 * Injected into <head> and run before first paint, so a saved theme is applied
 * before anything renders. Without it the page would paint in the system
 * theme and then visibly flip to the stored one.
 *
 * It lives in a plain module (not the "use client" component) because a Server
 * Component reads it.
 */
export const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch (e) {}
`;
