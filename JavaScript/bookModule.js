/* 
    SIDEBAR TOGGLE LOGIC
    This script listens for clicks on the hamburger button and decides how to move the sidebar.
*/

// Wait for the browser to finish loading the HTML content before running the script
document.addEventListener('DOMContentLoaded', function () {

  // FETCH KEY ELEMENTS
  // We get references to the elements we need to manipulate
  const sidebar = document.getElementById('sidebar');
  const sidebarToggleBtn = document.getElementById('sidebarCollapse');

  // ONLY PROCEED IF THE BUTTON EXISTS
  if (sidebarToggleBtn) {

    // ADD CLICK LISTENER
    // When the user clicks the hamburger button, run this logic
    sidebarToggleBtn.addEventListener('click', function () {

      // CHECK THE SCREEN WIDTH
      // 992 pixels is our "Breakpoint". Below this is mobile, above is desktop.
      const isMobileView = window.innerWidth < 992;

      if (isMobileView) {
        // MOBILE LOGIC:
        // We toggle the 'mobile-active' class which slides the sidebar in from the left.
        sidebar.classList.toggle('mobile-active');
      } else {
        // DESKTOP LOGIC:
        // We toggle the 'collapsed' class which shrinks the width from 280px to 85px.
        sidebar.classList.toggle('collapsed');
      }

      // LOG FOR DEBUGGING
      // This helps you see what's happening in the browser's console (F12 -> Console)
      console.log('Sidebar toggled. Current view: ' + (isMobileView ? 'Mobile' : 'Desktop'));
    });
  }

  // AUTO-CLOSE ON MOBILE RESIZE
  // If the sidebar is open on mobile and the user makes the screen bigger (desktop size), 
  // we should clean up the classes to prevent weird layout glitches.
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 992) {
      // Remove the mobile-specific overlay class when switching to desktop
      sidebar.classList.remove('mobile-active');
    }
  });

  // CLICK OUTSIDE TO CLOSE (Mobile Only)
  // If the sidebar is open on mobile, clicking anywhere else on the page will close it.
  document.addEventListener('click', function (event) {
    const isMobile = window.innerWidth < 992;

    // We only care if we are in mobile view AND the sidebar is currently open
    if (isMobile && sidebar.classList.contains('mobile-active')) {

      // Check if the click happened OUTSIDE of the sidebar and NOT on the toggle button
      const clickInsideSidebar = sidebar.contains(event.target);
      const clickOnToggleButton = sidebarToggleBtn.contains(event.target);

      if (!clickInsideSidebar && !clickOnToggleButton) {
        sidebar.classList.remove('mobile-active');
        console.log('Mobile sidebar closed by clicking outside.');
      }
    }
  });
});
