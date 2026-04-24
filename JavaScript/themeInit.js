/* Prevent flicker when page is loaded and applies the given code before the DOM is fully loaded. */
if (localStorage.getItem('sidebarState') === 'collapsed' && window.innerWidth >= 992) {
    document.documentElement.classList.add('sidebar-collapsed-init');
}
