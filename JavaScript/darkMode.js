let darkMode = localStorage.getItem("darkmode")
let darkModeSwitch = document.getElementById("darkModeSwitch")

let navLogo = document.getElementById("navLogo")

const enableDarkMode = () => {
    if(!document.getElementById("darkmode-toggle").checked) {
        document.body.classList.add("dark-mode")
        localStorage.setItem("darkmode", "active")
        navLogo.src = '../../Icons/logo-light.svg'
    }
}

const disableDarkMode = () => {
    if(document.getElementById("darkmode-toggle").checked) {
        document.body.classList.remove("dark-mode")
        localStorage.setItem("darkmode", null)
        navLogo.src = '../../Icons/Logo.svg'
    }
}

if(darkMode === "active") enableDarkMode()

darkModeSwitch.addEventListener("click", () => {
    darkMode = localStorage.getItem("darkmode")
    darkMode !== "active" ? enableDarkMode() : disableDarkMode()
})