// Prevent flicker when page is loaded and applies the given code before the DOM is fully loaded.
if (localStorage.getItem('sidebarState') === 'collapsed' && window.innerWidth >= 992) {
    document.documentElement.classList.add('sidebar-collapsed-init');
}

// Check for dark mode instantly before body renders
if (localStorage.getItem('darkmode') === 'active') {
    document.documentElement.classList.add('dark-mode');
}