let darkMode = localStorage.getItem("darkmode");
let darkModeSwitch = document.getElementById("darkModeSwitch");
let darkModeToggle = document.getElementById("darkmode-toggle");

let navLogo = document.getElementById("navLogo");

const enableDarkMode = () => {
  document.documentElement.classList.add("dark-mode");
  localStorage.setItem("darkmode", "active");
};

const disableDarkMode = () => {
  document.documentElement.classList.remove("dark-mode");
  localStorage.setItem("darkmode", null);
};

if (darkMode === "active") {
  if (darkModeToggle) darkModeToggle.checked = true;
  enableDarkMode();
}

if (darkModeSwitch) {
  darkModeSwitch.addEventListener("click", () => {
    darkMode = localStorage.getItem("darkmode");
    darkMode !== "active" ? enableDarkMode() : disableDarkMode();
  });
}
