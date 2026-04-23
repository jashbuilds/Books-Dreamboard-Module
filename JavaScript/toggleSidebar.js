document.addEventListener("DOMContentLoaded", () => {
  // Re-enable CSS transitions and clean up initialization classes after the DOM is ready
  setTimeout(() => {
    document.body.classList.remove("preload-transitions");
    document.documentElement.classList.remove("sidebar-collapsed-init");
  }, 100);

  const sidebar = document.getElementById("sidebar");
  const sidebarToggleBtn = document.getElementById("sidebarCollapseBtn");
  
  const savedState = localStorage.getItem('sidebarState');
  
  if (savedState === 'collapsed' && window.innerWidth >= 992) {
    sidebar.classList.add("collapsed");
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      const isMobileView = window.innerWidth < 992;

      if (isMobileView) {
        sidebar.classList.toggle("mobile-active");
      } else {
        sidebar.classList.toggle("collapsed");
        
        const currentState = sidebar.classList.contains("collapsed") ? 'collapsed' : 'expanded';
        localStorage.setItem('sidebarState', currentState);
      }
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992) {
      sidebar.classList.remove("mobile-active");
    }
  });

  document.addEventListener("click", (event) => {
    const isMobile = window.innerWidth < 992;
    if (isMobile && sidebar.classList.contains("mobile-active")) {
      const clickInsideSidebar = sidebar.contains(event.target);
      const clickOnToggleButton = sidebarToggleBtn.contains(event.target);
      if (!clickInsideSidebar && !clickOnToggleButton) {
        sidebar.classList.remove("mobile-active");
      }
    }
  });
});