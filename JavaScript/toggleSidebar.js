// Logic to Toggle Sidebar.
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const sidebarToggleBtn = document.getElementById("sidebarCollapseBtn");

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      const isMobileView = window.innerWidth < 992;

      if (isMobileView) {
        sidebar.classList.toggle("mobile-active");
      } else {
        sidebar.classList.toggle("collapsed");
        
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