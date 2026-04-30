let darkMode = localStorage.getItem("darkmode");
let darkModeSwitch = document.getElementById("darkModeSwitch");
let darkModeToggle = document.getElementById("darkmode-toggle");

let navLogo = document.getElementById("navLogo");

const enableDarkMode = () => {
  document.body.classList.add("dark-mode");
  localStorage.setItem("darkmode", "active");
};

const disableDarkMode = () => {
  document.body.classList.remove("dark-mode");
  localStorage.setItem("darkmode", null);
};

if (darkMode === "active") {
  darkModeToggle.checked = true;
  enableDarkMode();
}

darkModeSwitch.addEventListener("click", () => {
  darkMode = localStorage.getItem("darkmode");
  darkMode !== "active" ? enableDarkMode() : disableDarkMode();
});
