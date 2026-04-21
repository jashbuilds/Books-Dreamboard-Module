// Initialize Dexie.
var db = new Dexie("Dreamboard");
db.version(1).stores({
  dreams: "++id, name",
});

// DOM Elements
const dropArea = document.getElementById("drop-area");
const inputFile = document.getElementById("addDreamImage");
const imageView = document.getElementById("imgFile");

const addDreamModal = document.getElementById("addDream");

const submitBtn = document.getElementById("submitBtn");

const availableImages = document.getElementById("availableImages");

const dreamName = document.getElementById("dreamName");

const dreamBoardGrid = document.getElementById("dreamBoardGrid");

let dreamData;

// array that stores images selected by user from modal
let uploadedImages = [];

function getDreamsData(key) {
  const request = indexedDB.open("Dreamboard", 10);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction("dreams");
    const store = transaction.objectStore("dreams");

    let getRequest;

    if (key) {
      getRequest = store.get(key);
    } else {
      getRequest = store.getAll();
    }

    getRequest.onsuccess = () => {
      const response = getRequest.result;
      renderDreamboard(response);
    };
  };
}
getDreamsData();

// function resultData(res) {
//   dreamData = res;
//   if (dreamData.length === 0) {
//     dreamBoardGrid.innerHTML = "<p class='text-center fs-4 fw-semibold'>No Dreams Created!</p>";
//     return;
//   }
//   renderDreamboard();
// }

// function to render Dreamboards from Dexie
function renderDreamboard(res) {
  if (res.length === 0) {
    dreamBoardGrid.innerHTML =
      "<p class='text-center fs-4 fw-semibold'>No Dreams Created!</p>";
    return;
  }
  dreamBoardGrid.innerHTML = res
    .map((d) => {
      const url = URL.createObjectURL(d.images[0]);

      return `
       <div class="col-sm-6 col-md-4 col-lg-3">
                                <div class="position-relative dreamCard h-100">
                                    <img
                                        src="${url}"
                                        alt="nature"
                                        class="img-fluid object-fit-cover rounded cursor-pointer h-100">
                                    <img src="../../Icons/pin-outlined.svg"
                                        class="pinIcon cursor-pointer position-absolute top-0 start-0 ps-3 pt-3"
                                        alt="pin" width="35" height="35">
                                    <div
                                        class="dropdown rounded-circle pinIcon cursor-pointer position-absolute top-0 end-0 pe-3 pt-3">
                                        <img
                                            src="../../Icons/three-dots-vertical-filled.svg"
                                            class="dropdown-toggle"
                                            alt="action-menu" width="30"
                                            height="30"
                                            data-bs-offset="0,5"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false">
                                        <ul
                                            class="dropdown-menu">
                                            <li><button
                                                    class="dropdown-item d-flex justify-content-start align-items-center gap-1"><img
                                                        src="../../Icons/edit.svg"
                                                        alt="preview"
                                                        width="25"
                                                        height="25">
                                                    Rename</button></li>
                                            <li><button
                                                    
                                                    class="dropdown-item d-flex justify-content-start align-items-center gap-2"><img
                                                        src="../../Icons/upload-image.svg"
                                                        alt="delete"
                                                        width="20"
                                                        height="20">Upload
                                                    Image</button></li>
                                            <li><button onclick="deleteDream(${d.id})"

                                                    class="dropdown-item d-flex justify-content-start align-items-center gap-2"><img
                                                        src="../../Icons/delete-icon.svg"
                                                        alt="delete"
                                                        width="20"
                                                        height="20">Delete Dream</button></li>
                                        </ul>
                                    </div>

                                    <div
                                        class="position-absolute bottom-0 p-xl-3 p-md-2 p-3 imgText">
                                        <span
                                            class="fw-semibold text-white mb-1 fs-5 cardPara">${d.name}</span> <br>
                                        <span
                                            class="fw-semibold text-white fs-6 cardSubpara">Created
                                            by, Jash Vadgama</span>
                                    </div>

                                </div>
                            </div>
    `;
    })
    .join("");
}

// Common function to render selected images
const renderImages = () => {
  availableImages.innerHTML = uploadedImages
    .map(
      (img, i) => `
        <table class="table table-hover">
            <tbody>
                <tr>
                    <th scope="row" class="col-1">${i + 1}</th>
                    <td class="col-10">${img.file.name}</td>
                    <td class="col-1">
                        <button type="button" class="btn-close" aria-label="Close" onclick="removeImg(${i})"></button>
                    </td>
                </tr>
            </tbody>
        </table>`,
    )
    .join("");

  if (uploadedImages.length >= 5) {
    dropArea.classList.add("d-none");
  } else {
    dropArea.classList.remove("d-none");
  }
};
attachDropdownCloseLogic();

inputFile.addEventListener("change", uploadImage);

// function to upload image on modal
function uploadImage() {
  if (!inputFile.files || inputFile.files.length === 0) {
    return;
  }

  const files = Array.from(inputFile.files);

  files.forEach((file) => {
    if (uploadedImages.length < 5) {
      uploadedImages.push({ file });
    }
  });

  renderImages();
  validateFormInput();
}

// handler function that handles dragover event
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
});

// handler function that handles drop event
dropArea.addEventListener("drop", (e) => {
  e.preventDefault();

  const files = Array.from(e.dataTransfer.files);
  files.forEach((file) => {
    if (uploadedImages.length < 5) {
      uploadedImages.push({ file });
    }
  });

  renderImages();
  validateFormInput();
});

// function to remove image from modal
const removeImg = (id) => {
  uploadedImages.splice(id, 1);
  renderImages();

  validateFormInput();
};

// Logic to add form data to Dexie
document.getElementById("dreamForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = dreamName.value;
  const imageFiles = uploadedImages.map((img) => img.file);

  await db.dreams.add({
    name: name,
    images: imageFiles,
  });

  document.getElementById("dreamForm").reset();

  const modal = bootstrap.Modal.getInstance(addDreamModal);
  modal.hide();

  getDreamsData();
});

const deleteDream = async (id) => {
  await db.dreams.delete(id);
  getDreamsData();
  console.log(id);
};

// function to validate form input
const validateFormInput = () => {
  const isFormValid =
    dreamName.value.trim() !== "" && uploadedImages.length <= 5;

  submitBtn.disabled = !isFormValid;
};

// function to reset form when closed
addDreamModal.addEventListener("hidden.bs.modal", () => {
  dreamName.value = "";
  uploadedImages = [];
  document.getElementById("dreamForm").reset();
  availableImages.innerHTML = "";
  dropArea.classList.remove("d-none");
  submitBtn.disabled = true;
});

// function to close dreamboard action dropdown when mouseleave
function attachDropdownCloseLogic() {
  const cards = document.querySelectorAll(".dreamCard");

  cards.forEach((card) => {
    card.addEventListener("mouseleave", () => {
      const toggle = card.querySelector('[data-bs-toggle="dropdown"]');

      if (toggle) {
        const instance = bootstrap.Dropdown.getInstance(toggle);
        if (instance) instance.hide();
      }
    });
  });
}
