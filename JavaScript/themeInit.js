/**
 * Initialize theme and layout settings.
 * This runs synchronously in the <head> to prevent layout shifts.
 */
if (localStorage.getItem('sidebarState') === 'collapsed' && window.innerWidth >= 992) {
    document.documentElement.classList.add('sidebar-collapsed-init');
}
