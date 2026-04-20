document.getElementById("addDreamImage").addEventListener("drop", (e) => {
    e.preventDefault()

    const file = e.dataTransfer.files

    const fileName = document.getElementById("fileName")

    document.getElementById("addDreamImage").files = file

    fileName.textContent = file[0].name
})